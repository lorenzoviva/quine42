// The deferred generation (T207, ADR-0143): a universe generated before anyone plays, without a browser, only on the subscriptions.
// A command (tools/generazione/genera.ts) opens the universe in a kernel and runs it step by step: the Genesis, the places in a
// spiral from (0, 0) with the individuals behind their characters, the models, the pieces. Here what does not need Node:
//
// - `DeferredModels`: every task to a subscription's queue; one that would go to the API stops the command, and nothing after it
//   is asked (it never spends);
// - `StepGate` and `StepChunks`: the commits and plans of a step stay in hand and reach the universe only when the step ended valid;
//   a step stopped halfway leaves the disk at the step before, so the next start does it again from there;
// - `runDeferred`: the steps, the ceiling of consumption read again before each one, the progress for the next start.

import { emptyUsage, type AiModels, type Limits, type TextCall } from './ai/models';
import type { CallRecord } from './ai/usage';
import { SUBSCRIPTIONS, subscriptionsOf, type Provider, type Subscriptions } from './ai/subscription';
import type { ChunkRecord, ChunkStore } from './chunks';
import type { Author } from './repo';
import type { FileMap } from './types';
import type { UniverseBackend } from './universes';
import type { Kernel } from './kernel';

type Subscription = Exclude<Provider, 'api'>;

/** The command stops: a task out of the queue, or the step could not end valid. */
export class DeferredStop extends Error {}

/**
 * The table of the deferred generation: every agent on a subscription (`provider`, the first one by default), except those the
 * universe's table sends to the API on purpose: their tasks stop the command instead of spending.
 */
export function deferredTable(ai: { provider?: unknown; agenti?: unknown } | undefined, provider: Subscription = SUBSCRIPTIONS[0]): Subscriptions {
  return { provider, agenti: subscriptionsOf(ai).agenti };
}

/** The models of the deferred generation: each call to its subscription's queue, all tasks, not only the slow ones. */
export class DeferredModels implements AiModels {
  readonly name = 'differita';
  /** No budget of its own: the subscription's is the ceiling of `runDeferred`. */
  limits: Limits = { text: Infinity };
  /** Why the command stops, once something would have gone to the API (or a step was stopped): every call after it fails at once. */
  stopped?: string;
  private inFlight = 0;

  constructor(
    readonly table: Subscriptions,
    readonly queues: Partial<Record<Subscription, AiModels>>,
  ) {}

  get usage() {
    return Object.values(this.queues)[0]?.usage ?? emptyUsage();
  }
  get onCall(): ((r: CallRecord) => void) | undefined {
    return Object.values(this.queues)[0]?.onCall;
  }
  set onCall(f: ((r: CallRecord) => void) | undefined) {
    for (const q of Object.values(this.queues)) if (q) q.onCall = f;
  }

  /** Where a call goes: the table's provider for its agent, whatever the task. */
  route(call: Pick<TextCall, 'agent' | 'task'>): Provider {
    return this.table.agenti[call.agent] ?? this.table.provider;
  }

  stop(why: string): void {
    this.stopped ??= why;
  }

  async text(call: TextCall): Promise<string> {
    if (this.stopped) throw new DeferredStop(this.stopped);
    const p = this.route(call);
    const q = p === 'api' ? undefined : this.queues[p];
    if (!q) {
      this.stop(`«${call.agent}: ${call.task}» andrebbe alle API (${p === 'api' ? 'la tabella di universe.json lo manda lì' : `nessuna coda per ${p}`}): la generazione differita non spende`);
      throw new DeferredStop(this.stopped!);
    }
    this.inFlight++;
    try {
      return await q.text(call);
    } finally {
      this.inFlight--;
    }
  }

  /** Once no call is out (what the kernel started without waiting, the cast of a place for one): checked twice, `quietMs` apart. */
  async settled(quietMs = 50, maxMs = 30 * 60_000): Promise<void> {
    const until = Date.now() + maxMs;
    for (let quiet = 0; quiet < 2 && Date.now() < until; ) {
      await new Promise((r) => setTimeout(r, quietMs));
      quiet = this.inFlight === 0 ? quiet + 1 : 0;
    }
  }
}

type HeldWrite = { kind: 'commit'; changes: Record<string, string | null>; message: string; author: Author } | { kind: 'map'; key: string; record: ChunkRecord };

/** What `StepGate` writes to: the universe's client (UniverseClient). */
export interface GateTarget extends UniverseBackend {
  readonly pending: number;
  readonly lastError: string;
  putMap(key: string, data: unknown): Promise<void>;
}

/** The kernel's backend during the deferred generation: what a step writes waits here until the step ends valid. */
export class StepGate implements UniverseBackend {
  readonly name: string;
  private held: HeldWrite[] = [];

  constructor(private target: GateTarget) {
    this.name = target.name;
  }

  get waiting(): number {
    return this.held.length;
  }

  listMaps(): Promise<Array<{ file: string; name: string; layout: string }>> {
    return this.target.listMaps?.() ?? Promise.resolve([]);
  }

  commit(changes: Record<string, string | null>, message: string, author: Author): Promise<string | null> {
    this.held.push({ kind: 'commit', changes, message, author });
    return Promise.resolve(null);
  }

  /** No going back in the middle of a generation: the step is done again instead. */
  checkout(): Promise<FileMap | null> {
    return Promise.resolve(null);
  }

  reset(): Promise<void> {
    return Promise.reject(new Error('la generazione differita non manda universi nel cestino'));
  }

  map(key: string): ChunkRecord | undefined {
    for (let i = this.held.length - 1; i >= 0; i--) {
      const w = this.held[i];
      if (w.kind === 'map' && w.key === key) return w.record;
    }
    return undefined;
  }

  putMap(key: string, record: ChunkRecord): void {
    this.held.push({ kind: 'map', key, record });
  }

  /** The step ended valid: its writes to the universe, in order; throws if the store did not take them all. */
  async flush(): Promise<number> {
    const writes = this.held;
    this.held = [];
    for (const w of writes) {
      if (w.kind === 'map') await this.target.putMap(w.key, w.record);
      // A commit the store refused would leave the disk short of what the kernel holds: the generation stops there.
      else if ((await this.target.commit(w.changes, w.message, w.author)) === null) throw new DeferredStop(`l'archivio non ha preso il commit «${w.message}»: ${this.target.lastError}`);
    }
    if (this.target.pending) throw new DeferredStop(`l'archivio non ha preso ${this.target.pending} scritture: ${this.target.lastError}`);
    return writes.length;
  }

  /** The step did not end valid: what it wrote never reaches the universe. */
  discard(): number {
    const n = this.held.length;
    this.held = [];
    return n;
  }
}

/** The kernel's store of plans during the deferred generation: through the gate. */
export class StepChunks implements ChunkStore {
  constructor(
    private gate: StepGate,
    private inner: ChunkStore,
  ) {}
  async load(key: string): Promise<ChunkRecord | undefined> {
    return this.gate.map(key) ?? this.inner.load(key);
  }
  async save(key: string, record: ChunkRecord): Promise<void> {
    this.gate.putMap(key, record);
  }
  async clear(): Promise<void> {
    await this.inner.clear();
  }
}

/** The places from (0, 0) outward, ring after ring: (0,0), then (1,0), (1,1), (0,1)… */
export function spiral(n: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let r = 0; out.length < n; r++) {
    if (r === 0) {
      out.push([0, 0]);
      continue;
    }
    const ring: Array<[number, number]> = [];
    for (let y = -r + 1; y <= r; y++) ring.push([r, y]);
    for (let x = r - 1; x >= -r; x--) ring.push([x, r]);
    for (let y = r - 1; y >= -r; y--) ring.push([-r, y]);
    for (let x = -r + 1; x <= r; x++) ring.push([x, -r]);
    out.push(...ring);
  }
  return out.slice(0, Math.max(0, n));
}

/** The subscription's weekly counter: how much of the week is used (%), and when it starts again. */
export interface WeeklyUsage {
  usato: number;
  reset?: string;
}

/** What a generation has done, outside the universe (`universes/.generazione/<nome>.json`): it is the machine's, not the world's. */
export interface DeferredProgress {
  /** The steps ended valid. */
  passi: string[];
  /** The ceiling: this universe may use at most this much of the subscription's week (%). Read again before every step. */
  tetto: number;
  partita?: 'single' | 'multiplayer';
  /** The week measured so far: its reset, the last reading, what the steps used of it (%). */
  consumo?: { reset?: string; ultimo?: number; speso: number };
}

export interface DeferredStorage {
  load(): DeferredProgress;
  save(p: DeferredProgress): void;
}

export interface DeferredRun {
  kernel: Kernel;
  models: DeferredModels;
  gate: StepGate;
  progress: DeferredStorage;
  /** The subscription's week now; undefined if it cannot be read (then nothing is generated: a ceiling without a measure is none). */
  weekly: () => Promise<WeeklyUsage | undefined>;
  /** The Genesis's text, when the universe needs one. */
  theme: string;
  partita: 'single' | 'multiplayer';
  /** How many places from the centre. */
  luoghi: number;
  /** Models and pieces at most in this run (default the universe's `ai.maxModels`, `ai.maxBrani`). */
  modelli?: number;
  brani?: number;
  /** True once whoever started it asked to stop (Ctrl+C): the step under way is not written. */
  interrupted?: () => boolean;
  log?: (line: string) => void;
}

export interface DeferredOutcome {
  esito: 'finito' | 'tetto' | 'interrotto' | 'errore';
  motivo?: string;
  /** Steps ended valid in this run. */
  fatti: string[];
}

/** The steps, in order, as the state of the world says them now (a step already done is not in the list twice). */
async function* stepsOf(k: Kernel, r: DeferredRun, done: Set<string>): AsyncGenerator<{ id: string; run: () => Promise<string | true> }> {
  if (k.needsGenesis())
    yield {
      id: 'genesi',
      run: async () => ((await k.runGenesis(r.theme, (s) => r.log?.(`  ${s}`), { modalita: r.partita })) ? true : 'la Genesi non è riuscita'),
    };
  for (const [cx, cy] of spiral(r.luoghi)) {
    const id = `luogo:${cx},${cy}`;
    if (done.has(id)) continue;
    yield {
      id,
      run: async () => {
        const how = await k.planAhead(cx, cy);
        if (how === 'no') return `il luogo ${cx},${cy} non si è pianificato`;
        const people = await k.peopleOf(cx, cy);
        r.log?.(`  ${how === 'nuovo' ? 'pianificato' : 'già nell’universo'}, ${people} individui`);
        return true;
      },
    };
  }
  const tried = new Set<string>();
  for (let made = 0; made < (r.modelli ?? k.config.ai.maxModels ?? 40); made++) {
    const req = k.sculpting.missing().find((q) => !tried.has(q.id));
    if (!req) break;
    tried.add(req.id);
    yield { id: `modello:${req.id}`, run: async () => (await k.sculpting.make(req), true) };
  }
  const composed = new Set<string>();
  for (let made = 0; made < (r.brani ?? k.config.ai.maxBrani ?? 8); made++) {
    const what = (q: { ambienti?: string[]; nome?: string; richiesta: string }) => q.ambienti?.[0] ?? q.nome ?? q.richiesta;
    const req = k.composing.missing().find((q) => !composed.has(what(q)));
    if (!req) break;
    composed.add(what(req));
    yield { id: `brano:${what(req)}`, run: async () => ((await k.composing.make(req)), true) };
  }
}

/** Reads the week; the first reading of a run only sets where it starts (what was used between two runs is not this universe's). */
async function measure(r: DeferredRun, p: DeferredProgress, first: boolean): Promise<string | undefined> {
  const u = await r.weekly().catch(() => undefined);
  if (!u || !Number.isFinite(u.usato)) return 'il consumo settimanale dell’abbonamento non si legge: senza una misura il tetto non vale, e non si genera';
  const c = p.consumo ?? { speso: 0 };
  if (c.reset !== u.reset) p.consumo = { reset: u.reset, ultimo: u.usato, speso: 0 };
  else p.consumo = { reset: c.reset, ultimo: u.usato, speso: first ? c.speso : c.speso + Math.max(0, u.usato - (c.ultimo ?? u.usato)) };
  return undefined;
}

/** Runs the deferred generation until it is done, stopped, at its ceiling or at a task out of the queue. Never throws. */
export async function runDeferred(r: DeferredRun): Promise<DeferredOutcome> {
  const k = r.kernel;
  const fatti: string[] = [];
  const out = (esito: DeferredOutcome['esito'], motivo?: string): DeferredOutcome => ({ esito, ...(motivo ? { motivo } : {}), fatti });
  // Who pays (ADR-0143): nobody in credits. The credits are for the API; here the master spends their own subscription, at zero dollars in the
  // ledger. Without this, in a universe of many with nobody connected every common call would go to the local models instead of the queue.
  k.council.hasCredits = undefined;
  let p = r.progress.load();
  if (!k.needsGenesis() && k.gameSetup().modalita !== r.partita) return out('errore', `l'universo è già una partita ${k.gameSetup().modalita === 'multiplayer' ? 'multigiocatore' : 'in singola'}`);
  if (p.partita && p.partita !== r.partita && !k.needsGenesis()) return out('errore', `la generazione era cominciata per una partita ${p.partita}`);
  p.partita = r.partita;
  const why = await measure(r, p, true);
  r.progress.save(p);
  if (why) return out('errore', why);
  const done = new Set(p.passi);
  for await (const step of stepsOf(k, r, done)) {
    if (r.interrupted?.()) return out('interrotto');
    // The ceiling and the week, read again before each step: the author may change the first while it runs.
    p = { ...r.progress.load(), partita: r.partita, consumo: p.consumo };
    const unread = await measure(r, p, false);
    r.progress.save(p);
    if (unread) return out('errore', unread);
    if ((p.consumo?.speso ?? 0) >= p.tetto) return out('tetto', `usato ${round(p.consumo!.speso)} % della settimana, il tetto è ${p.tetto} %`);
    r.log?.(`passo ${step.id}`);
    let result: string | true;
    try {
      result = await step.run();
    } catch (e) {
      result = (e as Error).message;
    }
    await r.models.settled();
    if (r.interrupted?.() && result === true && r.models.stopped === undefined) {
      // Asked to stop while it ran: it ended valid, so it is kept.
    } else if (r.interrupted?.()) {
      r.gate.discard();
      return out('interrotto');
    }
    const stop = r.models.stopped ?? (result === true ? undefined : result);
    if (stop) {
      const lost = r.gate.discard();
      r.models.stop(stop);
      return out('errore', `${step.id}: ${stop}${lost ? ` (${lost} scritture del passo non scritte)` : ''}`);
    }
    try {
      await r.gate.flush();
    } catch (e) {
      return out('errore', `${step.id}: ${(e as Error).message}`);
    }
    fatti.push(step.id);
    p = { ...r.progress.load(), partita: r.partita, consumo: p.consumo };
    if (!p.passi.includes(step.id)) p.passi.push(step.id);
    r.progress.save(p);
  }
  return out('finito');
}

const round = (n: number) => Math.round(n * 10) / 10;
