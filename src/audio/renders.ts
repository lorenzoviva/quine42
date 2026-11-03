// The sounds ready to play (ADR-0126): one worker, a queue where music goes first, a memory that keeps what was asked for last. What goes wrong answers `undefined`: silence.

import { soundKey, type PreparedSound, type SoundRequest } from './prepare';
import type { SoundAnswer, SoundJob } from './worker';

/** What the page keeps ready. A piece of music is about 4 MB, an effect a few KB. */
export const SOUND_MEMORY_BYTES = 64 * 1024 * 1024;
/** A render takes one or two seconds. A program still running after this has something wrong, or a machine that is not making it: either way, silence. */
export const SOUND_WATCHDOG_MS = 20_000;

/** The part of a Worker used here, so that the tests can answer by themselves. */
export interface SoundWorker {
  postMessage(job: SoundJob): void;
  terminate(): void;
  onmessage: ((ev: { data: SoundAnswer }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
}

interface Waiting {
  job: SoundJob;
  key: string;
  done: (s: PreparedSound | undefined) => void;
}

/** One line for each thing rendered or read, for whoever measures. */
export interface RenderMeasure {
  use: string;
  ms: number;
  bytes: number;
  fromDisk: boolean;
}

export class SoundRenders {
  private memory = new Map<string, PreparedSound>();
  private inflight = new Map<string, Promise<PreparedSound | undefined>>();
  private failed = new Map<string, string>();
  private queue: Waiting[] = [];
  private running?: Waiting;
  private worker?: SoundWorker;
  private watchdog?: ReturnType<typeof setTimeout>;
  private next = 1;
  bytes = 0;
  readonly measures: RenderMeasure[] = [];

  constructor(
    private makeWorker: () => SoundWorker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }) as unknown as SoundWorker,
    private disk = false,
    private maxBytes = SOUND_MEMORY_BYTES,
  ) {}

  /** The ones that failed, and why. */
  get failures(): ReadonlyMap<string, string> {
    return this.failed;
  }

  /** Never rejects. A program that failed once is not run again until its text changes. */
  get(req: SoundRequest): Promise<PreparedSound | undefined> {
    const key = soundKey(req);
    const hit = this.memory.get(key);
    if (hit) {
      this.memory.delete(key);
      this.memory.set(key, hit);
      return Promise.resolve(hit);
    }
    if (this.failed.has(key)) return Promise.resolve(undefined);
    const going = this.inflight.get(key);
    if (going) return going;
    const promise = new Promise<PreparedSound | undefined>((done) => {
      const w: Waiting = { job: { id: this.next++, req, disk: this.disk }, key, done };
      // Music first, in the order asked: someone is waiting to hear it; the effects are getting ready in advance.
      const at = req.use === 'musica' ? this.queue.findIndex((q) => q.job.req.use !== 'musica') : -1;
      if (at >= 0) this.queue.splice(at, 0, w);
      else this.queue.push(w);
    }).finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    this.pump();
    return promise;
  }

  private pump(): void {
    if (this.running || !this.queue.length) return;
    const w = this.queue.shift()!;
    this.running = w;
    try {
      this.worker ??= this.spawn();
      this.watchdog = setTimeout(() => this.finish(w, undefined, 'non ha finito in tempo', true), SOUND_WATCHDOG_MS);
      this.worker.postMessage(w.job);
    } catch (e) {
      this.finish(w, undefined, e instanceof Error ? e.message : String(e), true);
    }
  }

  private spawn(): SoundWorker {
    const worker = this.makeWorker();
    worker.onmessage = (ev) => {
      const a = ev.data;
      const w = this.running;
      if (!w || w.job.id !== a.id) return;
      if ('error' in a) return this.finish(w, undefined, a.error);
      this.measures.push({ use: w.job.req.use, ms: a.ms, bytes: a.sound.samples.byteLength, fromDisk: a.fromDisk });
      if (this.measures.length > 200) this.measures.shift();
      this.finish(w, a.sound);
    };
    worker.onerror = () => {
      if (this.running) this.finish(this.running, undefined, 'il worker si è fermato', true);
    };
    return worker;
  }

  private finish(w: Waiting, sound: PreparedSound | undefined, error?: string, killWorker = false): void {
    clearTimeout(this.watchdog);
    this.running = undefined;
    if (killWorker) {
      try {
        this.worker?.terminate();
      } catch {
        /* it is gone anyway */
      }
      this.worker = undefined;
    }
    if (sound) this.remember(w.key, sound);
    else this.failed.set(w.key, error ?? 'non suona');
    w.done(sound);
    this.pump();
  }

  private remember(key: string, sound: PreparedSound): void {
    this.memory.set(key, sound);
    this.bytes += sound.samples.byteLength;
    for (const [k, s] of this.memory) {
      if (this.bytes <= this.maxBytes || this.memory.size <= 1) break;
      this.memory.delete(k);
      this.bytes -= s.samples.byteLength;
    }
  }
}
