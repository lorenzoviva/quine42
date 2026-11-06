// The deferred generation (T207, ADR-0143): `npm run genera -- <universo> [opzioni]` generates a universe before anyone plays it,
// without a browser and only on the subscriptions' queue (served by `npm run abbonamento`, isolated as ADR-0106 says).
//
//   --partita singola|multigiocatore   the game, chosen for a universe that has not had its Genesis (default singola)
//   --tema <id>                        one of the Genesis's settings (themes.ts), default the first; --testo "<testo>" for one of yours
//   --luoghi <n>                       places from the centre, in a spiral (default 25: the 5 × 5 around (0, 0))
//   --modelli <n>, --brani <n>          at most in this run (default the universe's ai.maxModels, ai.maxPieces)
//   --tetto <%>                        this universe may use at most this much of the subscription's week (default 10); kept in
//                                      universes/.generazione/<universo>.json, which is read again before every step
//   --universi <cartella>              where the universes are (default universes/)
//
// Local only: it never runs on the production server (which does not have it) and never on a universe with a world lit.

import { execFile } from 'node:child_process';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { universeHandler } from '../../server/universeStore';
import { diskQueueFetch } from '../../server/subscriptionQueue';
import { progressFile, takeGeneration } from '../../server/generation';
import { worldToken } from '../../server/access';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { readConfig } from '../../src/kernel/universe';
import { UNIVERSE_NAME_RE } from '../../src/kernel/paths';
import { checkKernelVersion } from '../../src/kernel/version';
import { QueueAiModels } from '../../src/kernel/ai/subscription';
import type { AiModels } from '../../src/kernel/ai/models';
import { internalName } from '../../src/kernel/internalNames';
import { WORLD_THEMES } from '../../src/kernel/themes';
import { INTERNAL_HEADER, prepareUniverse, SEED_FILE, seedHashes, UniverseChunks, UniverseClient } from '../../src/kernel/universes';
import { DeferredModels, deferredTable, runDeferred, StepChunks, StepGate, type DeferredOutcome, type WeeklyUsage } from '../../src/kernel/deferred';
import { serverPath } from '../../server/folders';

export const DEFAULT_PLACES = 25;
export const DEFAULT_CEILING = 10;

export interface GenerateOptions {
  name: string;
  /** The folder of the universes (`universes/`). */
  dir: string;
  partita?: 'single' | 'multiplayer';
  theme?: string;
  luoghi?: number;
  modelli?: number;
  brani?: number;
  /** Written into the progress file when given; otherwise what the file says, or `DEFAULT_CEILING`. */
  tetto?: number;
  /** The subscription's queue as models (tests: a queue served by a fake CLI). Default: the queue on disk, `universes/.queue/`. */
  queue?: AiModels;
  weekly?: () => Promise<WeeklyUsage | undefined>;
  interrupted?: () => boolean;
  log?: (line: string) => void;
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

/** Opens the universe through the store in this process (the same checks as the server's), generates it, closes everything. */
export async function generateUniverse(o: GenerateOptions): Promise<DeferredOutcome> {
  const fail = (motivo: string): DeferredOutcome => ({ esito: 'errore', motivo, fatti: [] });
  if (!UNIVERSE_NAME_RE.test(o.name)) return fail(`nome di universo non valido: ${o.name}`);
  const held = takeGeneration(o.dir, o.name);
  if ('error' in held) return fail(held.error);
  const secret = randomBytes(24).toString('hex');
  const handler = universeHandler(o.dir, { internal: secret });
  const server = http.createServer((req, res) => handler(req, res, () => ((res.statusCode = 404), res.end())));
  let client: UniverseClient | null = null;
  try {
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    // The store knows this process as it knows a world of the server: a token good for this universe only (ADR-0102, ADR-0110).
    client = await UniverseClient.connect(o.name, base, { [INTERNAL_HEADER]: worldToken(secret, o.name) }, { storage: null });
    if (!client) return fail('l’archivio degli universi non risponde');
    let snap = await client.load();
    if (!snap.exists) {
      await client.create({ ...bundledFiles, [SEED_FILE]: JSON.stringify(seedHashes(bundledFiles), null, 1) + '\n' }, 'nasce dal seme del kernel');
      snap = await client.load();
    }
    // A universe of an older contract is ported first (T307a); one of another contract that no migration reaches does not open as if it
    // were this kernel's (ADR-0136): nothing is spent and nothing is written on it.
    const up = prepareUniverse(snap.files ?? {}, bundledFiles);
    const read = readConfig(up.files);
    if (read.error) return fail(`«${o.name}»: universe.json non si legge: ${read.error}`);
    const version = checkKernelVersion(read.config.kernel, undefined, read.config.kernels);
    if (!version.ok) return fail(`«${o.name}» non è di questo kernel: ${version.motivo}`);
    if (Object.keys(up.changes).length) await client.commit(up.changes, `aggiornamento dal kernel: ${up.updated.slice(0, 6).join(', ') || 'seme'}`, 'kernel');
    const progress = progressFile(o.dir, o.name, { tetto: DEFAULT_CEILING });
    if (o.tetto !== undefined) progress.save({ ...progress.load(), tetto: o.tetto });
    const ai = readConfig(up.files).config.ai;
    const queue = o.queue ?? new QueueAiModels({ provider: 'claude', fetchImpl: diskQueueFetch(serverPath(o.dir, 'queue')), poll: 1000, timeout: 60 * 60_000, parallel: 2 });
    const models = new DeferredModels(deferredTable(ai, 'claude'), { claude: queue });
    const gate = new StepGate(client);
    const kernel = await Kernel.boot({ files: up.files, store: memoryStore(), ai: models, chunks: new StepChunks(gate, new UniverseChunks(client)), backend: gate, past: snap.log ?? [] });
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
  } catch (e) {
    return fail((e as Error).message);
  } finally {
    client?.close();
    await new Promise((r) => server.close(r));
    held.release();
  }
}

function parseArgs(argv: string[]): GenerateOptions | string {
  const [name, ...rest] = argv.filter((a) => a !== '--');
  if (!name || name.startsWith('-')) return 'uso: npm run genera -- <universo> [--partita singola|multigiocatore] [--tema <id> | --testo "<testo>"] [--luoghi <n>] [--modelli <n>] [--brani <n>] [--tetto <%>] [--universi <cartella>]';
  const o: GenerateOptions = { name, dir: path.resolve(process.cwd(), 'universes') };
  for (let i = 0; i < rest.length; i += 2) {
    const [k, v] = [rest[i], rest[i + 1]];
    if (v === undefined) return `manca il valore di ${k}`;
    if (k === '--partita') {
      // The words of the command stay the author's (singola, multigiocatore); the English ones are taken too.
      const mode = internalName('partita', v);
      if (mode !== 'single' && mode !== 'multiplayer') return `partita: singola o multigiocatore, non ${v}`;
      o.partita = mode;
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
    } else if (k === '--tetto') {
      o.tetto = Number(v);
      if (!Number.isFinite(o.tetto) || o.tetto < 0 || o.tetto > 100) return 'tetto: una percentuale della settimana, da 0 a 100';
    } else if (k === '--universi') o.dir = path.resolve(v);
    else return `opzione sconosciuta: ${k}`;
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
  const out = await generateUniverse({ ...o, interrupted: () => stop, log: (l) => console.log(l) });
  console.log(`${out.esito}${out.motivo ? `: ${out.motivo}` : ''} — ${out.fatti.length} passi in questa esecuzione`);
  process.exit(out.esito === 'errore' ? 1 : 0);
}

if (process.argv[1] && /genera\.ts$/.test(process.argv[1])) void main();
