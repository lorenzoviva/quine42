// T183: how far the kernel of today goes. Each scenario is a real module (`moduli/<id>/`), checked as the Forge of mechanics
// checks what the Engineer writes (`cleanPanel`, `validateForged`, `cleanCases`) and run in the kernel in miniature (`runBenchCase` → `runCase`).
// Nothing here touches src/kernel/: what a scenario cannot do is written as a test of the limit, and in docs/design/espressivita.md.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { cleanPanel } from '../../src/kernel/agents/mechanics';
import { cleanCases, type BenchRun } from '../../src/kernel/bench';
import { bundledFiles } from '../../src/kernel/bundle';
import { MemoryChunks, type ChunkStore } from '../../src/kernel/chunks';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import type { FileMap, Manifest } from '../../src/kernel/types';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const MODULES = path.join(HERE, 'moduli');

/** The files of a module of `moduli/`, as they would stand in a universe. */
export function moduleFiles(id: string): FileMap {
  const dir = path.join(MODULES, id);
  return Object.fromEntries(readdirSync(dir).map((f) => [`modules/${id}/${f}`, readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n')]));
}

/** The seed with these modules added. */
export function universeWith(...ids: string[]): FileMap {
  return { ...bundledFiles, ...Object.assign({}, ...ids.map(moduleFiles)) };
}

export const manifestOf = (id: string): Manifest => JSON.parse(moduleFiles(id)[`modules/${id}/manifest.json`]);
export const logicOf = (id: string): string => moduleFiles(id)[`modules/${id}/logic.lua`] ?? '';

/**
 * What the Forge of mechanics asks of a module before it enters a universe: the panel survives the cleaning as written, the code compiles,
 * calls only the API, loads. A system with no panel is refused here, as it is there (ADR-0028).
 */
export async function expectForgeable(id: string, extras: string[] = []): Promise<Kernel> {
  const k = await Kernel.boot({ files: universeWith(...extras), store: memoryStore(), ai: new MockAiModels() });
  const manifest = manifestOf(id);
  if (manifest.kind === 'system') {
    const { panel, errors } = cleanPanel(manifest.ui ?? {}, manifest.ui?.id ?? 'x');
    expect(errors).toEqual([]);
    expect(panel?.elementi.length).toBe(manifest.ui?.elementi.length);
  }
  expect(k.validator.validateForged(manifest, logicOf(id), new Set(k.modules.keys()), { system: true })).toEqual([]);
  return k;
}

/** One case of a mechanic: forged like the Engineer's, cleaned like the Engineer's, run with its real code. No error, or it does not pass. */
export async function runScenario(id: string, raw: unknown, extras: string[] = []): Promise<BenchRun> {
  const k = await expectForgeable(id, extras);
  const manifest = manifestOf(id);
  const { cases, errors } = cleanCases([raw], manifest.ui, logicOf(id).split('\n').length);
  expect(errors).toEqual([]);
  expect(cases.length).toBe(1);
  const run = await k.runBenchCase(manifest, logicOf(id), cases[0]);
  expect(run.errori).toEqual([]);
  return run;
}

/** The values of a watched field, frame by frame. */
export const series = (run: BenchRun, field: string): unknown[] => run.frames.map((f) => f.valori[field]);

/** A world that lasts: a whole kernel (not the bench) on a store and a set of places that outlive it. */
export interface Lasting {
  chunks: ChunkStore;
  files: FileMap;
}

export const newLasting = (files: FileMap): Lasting => ({ chunks: new MemoryChunks(), files });

/** Opens the world as a restart does: from its files and its places. */
export async function open(w: Lasting): Promise<Kernel> {
  const k = await Kernel.boot({ files: w.files, store: memoryStore(), ai: new MockAiModels(), chunks: w.chunks });
  await developAll(k);
  return k;
}

/** Saves the game and closes it: what stays is what the files and the places hold. The plans are written half a second after a change. */
export async function closeWorld(k: Kernel, w: Lasting): Promise<void> {
  expect(k.saveState()).toBe(true);
  await pause(700);
  w.files = { ...k.files };
}

export const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const DT = 1 / 60;

export async function developAll(k: Kernel): Promise<void> {
  for (let i = 0; i < 80; i++) {
    k.tick(DT);
    await pause(25);
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(DT);
}

export function play(k: Kernel, seconds: number): void {
  for (let t = 0; t < seconds; t += DT) k.tick(DT);
}

/** With another wanderer in the same world: what a multiplayer game is, in the kernel on the server. */
export function manyPlayers(files: FileMap): FileMap {
  const cfg = JSON.parse(files['universe.json']);
  return { ...files, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3, master: 'io' } }, null, 2) };
}
