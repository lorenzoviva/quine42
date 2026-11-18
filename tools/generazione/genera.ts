// The deferred generation (T207, ADR-0143): `npm run genera -- <universo> [opzioni]` generates a universe before anyone plays it,
// without a browser and only on the subscriptions' queue (served by `npm run abbonamento`, isolated as ADR-0106 says).
//
//   --partita singola|multigiocatore   the game, chosen for a universe that has not had its Genesis (default singola)
//   --tema <id>                        one of the Genesis's settings (themes.ts), default the first; --testo "<testo>" for one of yours
//   --luoghi <n>                       places from the centre, in a spiral (default 25: the 5 × 5 around (0, 0))
//   --modelli <n>, --brani <n>          at most in this run (default the universe's ai.maxModels, ai.maxPieces)
//   --tetto <%>                        this universe may use at most this much of the subscription's week (default 10); kept in
//                                      universes/.generation/<universo>.json, which is read again before every step
//   --universi <cartella>              where the universes are (default universes/)
//   --modello <id>, --sforzo <livello>  the model and the effort of the CLI for every call (default the CLI's own; T411)
//
// The regeneration of the models (T411, ADR-0216): `npm run genera -- <universo> --rigenera modelli [opzioni]` sculpts again the types of
// models the universe wears (its furniture, structures and figures) with today's Sculptor, the structures at 16 voxels a tile and furnished by
// the Scenografo, the lots of its places of before cut again where they would not hold them; the bible, the places and the people stay. The
// state of before stays in the universe's history under the tag `prima-della-rigenerazione`.
//
//   --tipi <id,id…>                    only these types of the library (a proof on one type)
//   --classi <classe,…>                the classes sculpted again (default furniture,structure,building,person,animal,beast)
//   --modelli <n>                      at most this many types in this run
//   --tetto <%>                        as above, in universes/.generation/<universo>.rigenera-modelli.json
//   --modello <id>, --sforzo <livello>  default claude-opus-5-5, low (the stable Sculptor of T406 and T413)
//
// Local only: it never runs on the production server (which does not have it) and never on a universe with a world lit.

import { execFile } from 'node:child_process';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { tagUniverse, universeHandler } from '../../server/universeStore';
import { diskQueueFetch, served } from '../../server/subscriptionQueue';
import { progressFile, takeGeneration } from '../../server/generation';
import { worldToken } from '../../server/access';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { readConfig } from '../../src/kernel/universe';
import { UNIVERSE_NAME_RE } from '../../src/kernel/paths';
import { checkKernelVersion } from '../../src/kernel/version';
import { cliEffortOf, cliModelOf, CLI_EFFORTS, CLI_MODELS, QueueAiModels } from '../../src/kernel/ai/subscription';
import type { AiModels } from '../../src/kernel/ai/models';
import { internalName } from '../../src/kernel/internalNames';
import { WORLD_THEMES } from '../../src/kernel/themes';
import { CLASSES } from '../../src/mj/classes';
import type { MjNode } from '../../src/kernel/mj';
import { INTERNAL_HEADER, prepareUniverse, SEED_FILE, seedHashes, UniverseChunks, UniverseClient, type UniverseSnapshot } from '../../src/kernel/universes';
import { DeferredModels, deferredTable, runDeferred, StepChunks, StepGate, type DeferredOutcome, type DeferredStorage, type WeeklyUsage } from '../../src/kernel/deferred';
import { BEFORE_REGENERATION, REGEN_CLASSES, REGEN_EFFORT, REGEN_MODEL, REGEN_MODES, regenerationSteps, regenKind, type RegenMode } from '../../src/kernel/regenerate';
import { serverPath } from '../../server/folders';

export const DEFAULT_PLACES = 25;
export const DEFAULT_CEILING = 10;
/** How long the regeneration waits for whoever serves the queue to beat (the pipeline starts both together, T88). */
export const QUEUE_WAIT_MS = 120_000;

/** What the generation and the regeneration share: the universe, the week, the queue, whoever stops it, where it speaks. */
interface CommonOptions {
  name: string;
  /** The folder of the universes (`universes/`). */
  dir: string;
  /** Written into the progress file when given; otherwise what the file says, or `DEFAULT_CEILING`. */
  tetto?: number;
  /** The subscription's queue as models (tests: a queue served by a fake CLI). Default: the queue on disk, `universes/.queue/`. */
  queue?: AiModels;
  weekly?: () => Promise<WeeklyUsage | undefined>;
  interrupted?: () => boolean;
  log?: (line: string) => void;
  /** The model and the effort of the CLI (T411): one of `CLI_MODELS`, one of `CLI_EFFORTS`. */
  modello?: string;
  sforzo?: string;
}

export interface GenerateOptions extends CommonOptions {
  partita?: 'single' | 'multiplayer';
  theme?: string;
  luoghi?: number;
  modelli?: number;
  brani?: number;
}

export interface RegenerateOptions extends CommonOptions {
  /** What is regenerated: today the models. */
  mode?: RegenMode;
  /** Only these types of the library. */
  tipi?: string[];
  /** The classes sculpted again (`REGEN_CLASSES`). */
  classi?: string[];
  /** At most this many types in this run. */
  modelli?: number;
  /** How long to wait for whoever serves the queue (`QUEUE_WAIT_MS`). */
  queueWait?: number;
}

/** The subscription's week from the CLI's `/usage`, as the pipeline reads it (no model is called). */
export async function cliWeekly(cmd = 'claude'): Promise<WeeklyUsage | undefined> {
  // @ts-expect-error pipeline.mjs is untyped plain JS
  const { parseUsage } = await import('../pipeline/pipeline.mjs');
  const text = await new Promise<string>((done) =>
    execFile(cmd, ['-p', '/usage'], { encoding: 'utf8', timeout: 120_000, windowsHide: true }, (e, out) => done(e ? '' : String(out))),
  );
  const counters = (parseUsage('claude', text) ?? []) as Array<{ nome: string; finestra: string; residuo: number; reset?: string }>;
  const week = counters.filter((c) => c.finestra === 'settimana').sort((a, b) => a.residuo - b.residuo)[0];
  return week ? { usato: 100 - week.residuo, reset: week.reset } : undefined;
}

const failed = (motivo: string): DeferredOutcome => ({ esito: 'errore', motivo, fatti: [] });

/**
 * The universe opened through the store in this process (the same checks as the server's), for this process only (the lock of the
 * generation, never with a world lit); `work` gets its client; everything is closed after.
 */
async function withUniverse(o: CommonOptions, work: (client: UniverseClient) => Promise<DeferredOutcome>): Promise<DeferredOutcome> {
  if (!UNIVERSE_NAME_RE.test(o.name)) return failed(`nome di universo non valido: ${o.name}`);
  const held = takeGeneration(o.dir, o.name);
  if ('error' in held) return failed(held.error);
  const secret = randomBytes(24).toString('hex');
  const handler = universeHandler(o.dir, { internal: secret });
  const server = http.createServer((req, res) => handler(req, res, () => ((res.statusCode = 404), res.end())));
  let client: UniverseClient | null = null;
  try {
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    // The store knows this process as it knows a world of the server: a token good for this universe only (ADR-0102, ADR-0110).
    client = await UniverseClient.connect(o.name, base, { [INTERNAL_HEADER]: worldToken(secret, o.name) }, { storage: null });
    if (!client) return failed('l’archivio degli universi non risponde');
    return await work(client);
  } catch (e) {
    return failed((e as Error).message);
  } finally {
    client?.close();
    await new Promise((r) => server.close(r));
    held.release();
  }
}

/**
 * A universe as this kernel reads it: an older contract is ported (T307a); one of another contract that no migration reaches does not open as
 * if it were this kernel's (ADR-0136): nothing is spent and nothing is written on it. `before` runs before anything is written (the tag).
 */
async function prepared(o: CommonOptions, client: UniverseClient, snap: UniverseSnapshot, before?: () => Promise<void>): Promise<{ files: Record<string, string> } | DeferredOutcome> {
  const up = prepareUniverse(snap.files ?? {}, bundledFiles);
  const read = readConfig(up.files);
  if (read.error) return failed(`«${o.name}»: universe.json non si legge: ${read.error}`);
  const version = checkKernelVersion(read.config.kernel, undefined, read.config.kernels);
  if (!version.ok) return failed(`«${o.name}» non è di questo kernel: ${version.motivo}`);
  await before?.();
  if (Object.keys(up.changes).length) await client.commit(up.changes, `aggiornamento dal kernel: ${up.updated.slice(0, 6).join(', ') || 'seme'}`, 'kernel');
  return { files: up.files };
}

/** The queue on disk with the model and the effort of the CLI said. */
const diskQueue = (dir: string, cli: { model?: string; effort?: string }) =>
  new QueueAiModels({ provider: 'claude', fetchImpl: diskQueueFetch(serverPath(dir, 'queue')), poll: 1000, timeout: 60 * 60_000, parallel: 2, ...cli });

/** The kernel of a deferred run over its universe: every call to the queue, what a step writes held by the gate until it ends valid. */
async function bootDeferred(files: Record<string, string>, client: UniverseClient, snap: UniverseSnapshot, queue: AiModels) {
  const ai = readConfig(files).config.ai;
  const models = new DeferredModels(deferredTable(ai, 'claude'), { claude: queue });
  const gate = new StepGate(client);
  const kernel = await Kernel.boot({ files, store: memoryStore(), ai: models, chunks: new StepChunks(gate, new UniverseChunks(client)), backend: gate, past: snap.log ?? [] });
  return { kernel, models, gate };
}

/** Opens the universe through the store in this process (the same checks as the server's), generates it, closes everything. */
export async function generateUniverse(o: GenerateOptions): Promise<DeferredOutcome> {
  return withUniverse(o, async (client) => {
    let snap = await client.load();
    if (!snap.exists) {
      await client.create({ ...bundledFiles, [SEED_FILE]: JSON.stringify(seedHashes(bundledFiles), null, 1) + '\n' }, 'nasce dal seme del kernel');
      snap = await client.load();
    }
    const up = await prepared(o, client, snap);
    if ('esito' in up) return up;
    const progress = progressFile(o.dir, o.name, { tetto: DEFAULT_CEILING });
    if (o.tetto !== undefined) progress.save({ ...progress.load(), tetto: o.tetto });
    const queue = o.queue ?? diskQueue(o.dir, { ...(cliModelOf(o.modello) ? { model: o.modello } : {}), ...(cliEffortOf(o.sforzo) ? { effort: o.sforzo } : {}) });
    const { kernel, models, gate } = await bootDeferred(up.files, client, snap, queue);
    // What the boot wrote (an atlas, an update) goes with the first step, or not at all.
    return await runDeferred({
      kernel,
      models,
      gate,
      progress,
      weekly: o.weekly ?? (() => cliWeekly()),
      theme: o.theme ?? WORLD_THEMES[0].text,
      partita: o.partita ?? 'single',
      luoghi: o.luoghi ?? DEFAULT_PLACES,
      modelli: o.modelli,
      brani: o.brani,
      interrupted: o.interrupted,
      log: o.log,
    });
  });
}

/** Whether a process serves the queue on disk now, waiting up to `ms` for its first beat (the pipeline starts it with the command). */
async function queueServed(dir: string, ms: number): Promise<boolean> {
  const until = Date.now() + ms;
  for (;;) {
    if ((await served(serverPath(dir, 'queue'))).includes('claude')) return true;
    if (Date.now() >= until) return false;
    await new Promise((r) => setTimeout(r, Math.min(2000, Math.max(10, until - Date.now()))));
  }
}

/** The seed's environments of today (`universe/` as this kernel ships it): what a universe that kept the seed's of before may take (T411). */
function seedLayouts(): Record<string, { program?: MjNode }> {
  const out: Record<string, { program?: MjNode }> = {};
  for (const [p, text] of Object.entries(bundledFiles)) {
    if (!p.endsWith('manifest.json')) continue;
    try {
      Object.assign(out, JSON.parse(text).layouts ?? {});
    } catch {
      /* a manifest that does not read has no environment to give */
    }
  }
  return out;
}

/**
 * The regeneration of a universe's models (T411, ADR-0216): the universe must exist; before anything is written its head gets the tag of before
 * (once); then the steps of `regenerationSteps` on the queue, with the ceiling, the gate, the progress (its own file) and the stops of the
 * deferred generation.
 */
export async function regenerateUniverse(o: RegenerateOptions): Promise<DeferredOutcome> {
  const mode = o.mode ?? 'modelli';
  if (!REGEN_MODES.includes(mode)) return failed(`si rigenera: ${REGEN_MODES.join(', ')}, non ${String(mode)}`);
  return withUniverse(o, async (client) => {
    const snap = await client.load();
    if (!snap.exists) return failed(`«${o.name}» non esiste: si rigenera un universo che c'è (per farne uno: npm run genera -- ${o.name})`);
    const model = o.modello ?? REGEN_MODEL;
    const effort = o.sforzo ?? REGEN_EFFORT;
    if (!cliModelOf(model)) return failed(`modello della CLI non ammesso: ${model} (${CLI_MODELS.join(', ')})`);
    if (!cliEffortOf(effort)) return failed(`sforzo della CLI non ammesso: ${effort} (${CLI_EFFORTS.join(', ')})`);
    // Nobody serving the queue: every call would wait an hour and fail; better to say it now (the pipeline starts the queue with the command).
    if (!o.queue && !(await queueServed(o.dir, o.queueWait ?? QUEUE_WAIT_MS))) return failed('nessuno serve la coda degli abbonamenti (npm run abbonamento)');
    const up = await prepared(o, client, snap, async () => {
      const tag = await tagUniverse(path.join(o.dir, o.name), BEFORE_REGENERATION);
      o.log?.(tag === 'made' ? `lo stato di prima resta nella storia dell'universo: tag ${BEFORE_REGENERATION}` : tag === 'there' ? `tag ${BEFORE_REGENERATION}: c'era già, resta dov'era` : `nessun commit da segnare con ${BEFORE_REGENERATION}`);
    });
    if ('esito' in up) return up;
    const progress: DeferredStorage = progressFile(o.dir, o.name, { tetto: DEFAULT_CEILING }, regenKind(mode));
    if (o.tetto !== undefined) progress.save({ ...progress.load(), tetto: o.tetto });
    const queue = o.queue ?? diskQueue(o.dir, { model, effort });
    const { kernel, models, gate } = await bootDeferred(up.files, client, snap, queue);
    const layouts = seedLayouts();
    return await runDeferred({
      kernel,
      models,
      gate,
      progress,
      weekly: o.weekly ?? (() => cliWeekly()),
      theme: '',
      luoghi: 0,
      interrupted: o.interrupted,
      log: o.log,
      steps: (k, done) => regenerationSteps(k, { ...(o.classi ? { classes: o.classi } : {}), ...(o.tipi ? { only: o.tipi } : {}), ...(o.modelli !== undefined ? { max: o.modelli } : {}), model, seedLayouts: layouts, log: o.log }, done),
    });
  });
}

const USAGE = [
  'uso: npm run genera -- <universo> [--partita singola|multigiocatore] [--tema <id> | --testo "<testo>"] [--luoghi <n>] [--modelli <n>] [--brani <n>] [--tetto <%>] [--modello <id>] [--sforzo <livello>] [--universi <cartella>]',
  '     npm run genera -- <universo> --rigenera modelli [--tipi <id,…>] [--classi <classe,…>] [--modelli <n>] [--tetto <%>] [--modello <id>] [--sforzo <livello>] [--universi <cartella>]',
].join('\n');

/** The words of the command: a generation's options or a regeneration's (`--rigenera`), or why not. */
export function parseArgs(argv: string[], cwd = process.cwd()): ({ rigenera?: undefined } & GenerateOptions) | ({ rigenera: RegenMode } & RegenerateOptions) | string {
  const [name, ...rest] = argv.filter((a) => a !== '--');
  if (!name || name.startsWith('-')) return USAGE;
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < rest.length; i += 2) {
    const [k, v] = [rest[i], rest[i + 1]];
    if (v === undefined) return `manca il valore di ${k}`;
    pairs.push([k, v]);
  }
  const dir = path.resolve(cwd, 'universes');
  const common = (o: CommonOptions, k: string, v: string): string | undefined | true => {
    if (k === '--tetto') {
      o.tetto = Number(v);
      if (!Number.isFinite(o.tetto) || o.tetto < 0 || o.tetto > 100) return 'tetto: una percentuale della settimana, da 0 a 100';
    } else if (k === '--universi') o.dir = path.resolve(v);
    else if (k === '--modello') {
      if (!cliModelOf(v)) return `modello della CLI: ${CLI_MODELS.join(', ')}, non ${v}`;
      o.modello = v;
    } else if (k === '--sforzo') {
      if (!cliEffortOf(v)) return `sforzo della CLI: ${CLI_EFFORTS.join(', ')}, non ${v}`;
      o.sforzo = v;
    } else return true;
    return undefined;
  };
  const mode = pairs.find(([k]) => k === '--rigenera')?.[1];
  if (mode !== undefined) {
    if (!REGEN_MODES.includes(mode as RegenMode)) return `rigenera: ${REGEN_MODES.join(', ')}, non ${mode}`;
    const o: { rigenera: RegenMode } & RegenerateOptions = { rigenera: mode as RegenMode, mode: mode as RegenMode, name, dir };
    for (const [k, v] of pairs) {
      if (k === '--rigenera') continue;
      const c = common(o, k, v);
      if (typeof c === 'string') return c;
      if (c === undefined) continue;
      if (k === '--tipi') o.tipi = v.split(',').map((s) => s.trim()).filter(Boolean);
      else if (k === '--classi') {
        const cls = v.split(',').map((s) => s.trim()).filter(Boolean);
        const unknown = cls.filter((c) => !CLASSES.some((x) => x.id === c));
        if (unknown.length || !cls.length) return `classi: tra ${CLASSES.map((c) => c.id).join(', ')} (predefinite ${REGEN_CLASSES.join(', ')}), non ${unknown.join(', ') || v}`;
        o.classi = cls;
      } else if (k === '--modelli') {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 0) return 'modelli: un numero intero, 0 o più';
        o.modelli = n;
      } else return `opzione sconosciuta con --rigenera: ${k}`;
    }
    return o;
  }
  const o: GenerateOptions = { name, dir };
  for (const [k, v] of pairs) {
    const c = common(o, k, v);
    if (typeof c === 'string') return c;
    if (c === undefined) continue;
    if (k === '--partita') {
      // The words of the command stay the author's (singola, multigiocatore); the English ones are taken too.
      const game = internalName('partita', v);
      if (game !== 'single' && game !== 'multiplayer') return `partita: singola o multigiocatore, non ${v}`;
      o.partita = game;
    } else if (k === '--tema') {
      const t = WORLD_THEMES.find((x) => x.id === v);
      if (!t) return `tema sconosciuto: ${v} (${WORLD_THEMES.map((x) => x.id).join(', ')})`;
      o.theme = t.text;
    } else if (k === '--testo') o.theme = v;
    else if (k === '--luoghi') {
      o.luoghi = Number(v);
      if (!Number.isInteger(o.luoghi) || o.luoghi < 1 || o.luoghi > 400) return 'luoghi: da 1 a 400';
    } else if (k === '--modelli' || k === '--brani') {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) return `${k.slice(2)}: un numero intero, 0 o più`;
      o[k === '--modelli' ? 'modelli' : 'brani'] = n;
    } else return `opzione sconosciuta: ${k}`;
  }
  return o;
}

async function main(): Promise<void> {
  const o = parseArgs(process.argv.slice(2));
  if (typeof o === 'string') {
    console.error(o);
    process.exit(2);
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('la generazione differita è un comando locale: mai sul server di produzione');
    process.exit(2);
  }
  let stop = false;
  process.on('SIGINT', () => {
    if (stop) process.exit(130);
    stop = true;
    console.error('\nfermo dopo il passo in corso (di nuovo Ctrl+C per uscire subito: il passo non si scrive)');
  });
  const common = { interrupted: () => stop, log: (l: string) => console.log(l) };
  const out = o.rigenera ? await regenerateUniverse({ ...o, ...common }) : await generateUniverse({ ...o, ...common });
  console.log(`${out.esito}${out.motivo ? `: ${out.motivo}` : ''} — ${out.fatti.length} passi in questa esecuzione`);
  process.exit(out.esito === 'errore' ? 1 : 0);
}

if (process.argv[1] && /genera\.ts$/.test(process.argv[1])) void main();
