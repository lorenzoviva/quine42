// The worker that makes the places' meshes (T486, the point 3 of T331): one, its own, apart from the pool of the models' programs
// (forms.ts), whose programs take seconds and would keep a place's ground waiting behind them. A place is out at most once at a time: what
// changes while it is out the renderer asks again when it comes back (its signature is old), so a place whose tiles change every tick (water
// that flows) shows the latest made, never a queue of them. A worker that stops, or has work and does not answer, is given up: the page
// makes the meshes itself from then on, as before (terrain.ts, `buildChunk`).

import type { ChunkAnswer, ChunkArrays, ChunkInput } from './terrainmesh';

/** How long the worker may be silent with places out: a place takes milliseconds, so this long is a worker that is stuck. */
export const MESHER_WATCHDOG_MS = 20_000;

/** A place made in the worker, with the signature it was asked with: its arrays, or why not. */
export interface MeshedChunk {
  key: string;
  sig: string;
  arrays?: ChunkArrays;
  error?: string;
}

export class ChunkMesher {
  private worker?: Worker;
  private next = 1;
  /** Every job out: the place it is for and the signature it was asked with. */
  private jobs = new Map<number, { key: string; sig: string }>();
  /** The job out for each place. */
  private out = new Map<string, number>();
  private done: MeshedChunk[] = [];
  private watchdog?: ReturnType<typeof setTimeout>;
  /** Why the worker was given up, if it was: the page makes the meshes itself. */
  gaveUp?: string;
  /** Places made in the worker so far. */
  made = 0;

  constructor(
    make?: () => Worker,
    private watchdogMs = MESHER_WATCHDOG_MS,
  ) {
    const factory = make ?? (typeof Worker !== 'undefined' ? () => new Worker(new URL('./terrainworker.ts', import.meta.url), { type: 'module' }) : undefined);
    if (!factory) return;
    try {
      this.worker = factory();
    } catch (e) {
      this.gaveUp = `il worker del terreno non parte: ${e instanceof Error ? e.message : String(e)}`;
      return;
    }
    this.worker.onmessage = (ev: MessageEvent<ChunkAnswer>) => this.answer(ev.data);
    this.worker.onerror = (e: ErrorEvent) => this.stop(`il worker del terreno si è fermato${e?.message ? `: ${e.message}` : ''}`);
  }

  /** Whether there is a worker to ask. */
  get working(): boolean {
    return !!this.worker;
  }

  /** Whether a place is out. */
  asking(key: string): boolean {
    return this.out.has(key);
  }

  /** How many places are out. */
  get pending(): number {
    return this.jobs.size;
  }

  /** A place to make, from the copy of what its mesh reads, under the signature it has now. */
  ask(key: string, sig: string, input: ChunkInput): void {
    if (!this.worker) return;
    const id = this.next++;
    this.jobs.set(id, { key, sig });
    this.out.set(key, id);
    try {
      this.worker.postMessage({ id, chunk: input });
    } catch (e) {
      this.stop(`il worker del terreno non riceve: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    // From the first job out; an answer winds it again.
    if (!this.watchdog) this.arm();
  }

  /** What came back since the last call, in the order it came. */
  take(): MeshedChunk[] {
    const d = this.done;
    this.done = [];
    return d;
  }

  /** Forgets every place out and what came back: of a world that is no more (the renderer starts again from the universe's files). */
  forget(): void {
    this.jobs.clear();
    this.out.clear();
    this.done = [];
    this.arm();
  }

  dispose(): void {
    this.stop('chiuso');
  }

  private answer(a: ChunkAnswer): void {
    const job = this.jobs.get(a.id);
    // Forgotten: nothing to do with it.
    if (!job) return;
    this.jobs.delete(a.id);
    if (this.out.get(job.key) === a.id) this.out.delete(job.key);
    if (a.ok) {
      this.made++;
      this.done.push({ ...job, arrays: a.arrays });
    } else this.done.push({ ...job, error: a.error });
    this.arm();
  }

  /** The watchdog runs while places are out, from the last answer. */
  private arm(): void {
    clearTimeout(this.watchdog);
    this.watchdog = undefined;
    if (!this.worker || !this.jobs.size) return;
    this.watchdog = setTimeout(() => this.stop('il worker del terreno non risponde'), this.watchdogMs);
    (this.watchdog as { unref?: () => void }).unref?.();
  }

  private stop(why: string): void {
    clearTimeout(this.watchdog);
    this.watchdog = undefined;
    try {
      this.worker?.terminate();
    } catch {
      /* gone anyway */
    }
    this.worker = undefined;
    this.gaveUp = why;
    this.jobs.clear();
    this.out.clear();
  }
}
