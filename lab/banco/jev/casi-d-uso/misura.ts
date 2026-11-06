// T325, point 1, the run: a walk through each universe with the recorder, every call cut into its parts and counted, the mean over the
// universes and an hour of play priced (`misure/contesto.json`). Counting with Gemini's countTokens is free (it generates nothing):
// with a key the tokens are exact, without one they are estimated from the characters.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RecordingModels, walk, WALK, type RecordedCall } from './registratore';
import { acrossUniverses, actorHour, CACHE_SHARE, CHARS_PER_TOKEN, estimateCounter, geminiCounter, hourTable, measure, partsHour, type HourRow, type TaskMeasure } from './contesto';
import { leggiUniverso, negozioMappe } from '../../universi-cloud/strumenti/carica';
import { Kernel } from '../../../../src/kernel/kernel';
import { bundledFiles } from '../../../../src/kernel/bundle';
import { memoryStore } from '../../../../src/kernel/repo';
import { prepareUniverse } from '../../../../src/kernel/universes';
import type { AiModels } from '../../../../src/kernel/ai/models';
import { PRICES_READ_ON } from '../../../../src/kernel/ai/prices';

export const USE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const MEASURES = path.join(USE_DIR, 'misure', 'contesto.json');
export const TOKEN_CACHE = path.join(USE_DIR, 'misure', 'token.json');

/** The universes measured: three of Claude Cloud's in the lab, and valmora, the oldest one played with Gemini (on the author's disk). */
export const UNIVERSES = ['neapolis', 'orichalcum', 'sidera', 'valmora'];

/** Where a universe is: the lab's, or the main checkout's `universes/`. */
export function universeDir(name: string): string | undefined {
  const lab = path.resolve(USE_DIR, '../../universi-cloud', name);
  if (fs.existsSync(path.join(lab, 'universe.json'))) return lab;
  try {
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim();
    const dir = path.resolve(common, '..', 'universes', name);
    if (fs.existsSync(path.join(dir, 'universe.json'))) return dir;
  } catch {
    /* not a repository */
  }
  return undefined;
}

export interface ContextMeasures {
  date: string;
  prices: string;
  exact: boolean;
  /** Characters per token over every part counted (exact counts only). */
  charsPerToken: number;
  cacheShare: number;
  places: number;
  universes: Array<{ name: string; calls: number; modules: number; catalog: number }>;
  tasks: TaskMeasure[];
  mean: TaskMeasure[];
  hour: HourRow[];
  actor: HourRow[];
  /** What each part costs in an hour (Actor off). */
  parts: ReturnType<typeof partsHour>;
}

export interface ContextOptions {
  universes?: string[];
  /** Gemini's key for countTokens; without it the estimate. */
  countKey?: string;
  offline?: boolean;
  log?: (s: string) => void;
  /** Where to write the measures (the test writes elsewhere). */
  out?: string;
  /** Places of the walk (the test walks fewer). */
  places?: number;
  fetchImpl?: typeof fetch;
}

/**
 * A universe booted as the game loads it (src/session/host.ts): ported to this kernel's contract and given the seed's new files
 * (`prepareUniverse`), its maps under the kernel's keys.
 */
export async function bootLikeTheGame(dir: string, ai: AiModels): Promise<Kernel> {
  const { files, maps } = leggiUniverso(dir);
  const prepared = prepareUniverse(files, bundledFiles).files;
  return Kernel.boot({ files: prepared, store: memoryStore(), ai, chunks: negozioMappe(prepared, maps) });
}

/** The calls of a walk through one universe. */
export async function recordUniverse(name: string, places = WALK.places, log: (s: string) => void = () => {}): Promise<{ calls: RecordedCall[]; modules: number; catalog: number } | undefined> {
  const dir = universeDir(name);
  if (!dir) {
    log(`${name}: non c'è su questo disco, salto`);
    return undefined;
  }
  const rec = new RecordingModels(name);
  const k = await bootLikeTheGame(dir, rec);
  const before = WALK.places;
  WALK.places = places;
  try {
    await walk(k, rec, log);
  } finally {
    WALK.places = before;
  }
  return { calls: rec.calls, modules: k.modules.size, catalog: k.catalog().length };
}

export async function runContext(o: ContextOptions): Promise<ContextMeasures> {
  const log = o.log ?? (() => {});
  // Offline the walk only shows that everything runs: one universe, a few places, unless told otherwise.
  const names = o.universes?.length ? o.universes : o.offline ? ['sidera'] : UNIVERSES;
  const places = o.places ?? (o.offline ? 6 : WALK.places);
  const cache: Record<string, number> = !o.offline && fs.existsSync(TOKEN_CACHE) ? JSON.parse(fs.readFileSync(TOKEN_CACHE, 'utf8')) : {};
  const counter = o.countKey && !o.offline ? geminiCounter(o.countKey, cache, undefined, o.fetchImpl) : estimateCounter;
  const tasks: TaskMeasure[] = [];
  const universes: ContextMeasures['universes'] = [];
  for (const name of names) {
    log(`${name}: la passeggiata`);
    const r = await recordUniverse(name, places, log);
    if (!r) continue;
    const ms = await measure(r.calls, counter);
    tasks.push(...ms);
    universes.push({ name, calls: r.calls.length, modules: r.modules, catalog: r.catalog });
    log(`${name}: ${r.calls.length} chiamate, ${ms.length} compiti`);
  }
  if (counter.exact) {
    fs.mkdirSync(path.dirname(TOKEN_CACHE), { recursive: true });
    fs.writeFileSync(TOKEN_CACHE, JSON.stringify(cache));
  }
  const mean = acrossUniverses(tasks);
  const chars = tasks.reduce((s, m) => s + m.chars * m.calls, 0);
  const tokens = tasks.reduce((s, m) => s + (m.input - (m.parts.immagini ?? 0)) * m.calls, 0);
  const result: ContextMeasures = {
    date: new Date().toISOString().slice(0, 10),
    prices: PRICES_READ_ON,
    exact: counter.exact,
    charsPerToken: counter.exact && tokens ? Math.round((chars / tokens) * 100) / 100 : CHARS_PER_TOKEN,
    cacheShare: CACHE_SHARE,
    places,
    universes,
    tasks,
    mean,
    hour: hourTable(mean),
    actor: hourTable(mean, actorHour()),
    parts: partsHour(mean),
  };
  // The fake measures never overwrite the real ones.
  const out = o.out ?? (o.offline ? path.resolve('lab/out/jev/contesto-offline.json') : MEASURES);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 1));
  log(`scritto ${out}${counter.exact ? '' : ' (token stimati dai caratteri)'}`);
  return result;
}
