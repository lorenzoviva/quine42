// The browser's FormRunner: a small pool of Web Workers that run the models' programs and make their
// meshes (src/render/worker.ts). The kernel keeps the grid for collision and actions; the renderer draws
// the meshes that came with it.
//
// T64: Form variants and animation frames cache (in-memory Map and persistent IndexedDB) so heavy models
// (e.g. circuito-3D with 32 animation frames) run once and reload instantly across sessions and seeds.

import { formKey, runForm, type FormRequest, type FormResult, type FormRunner } from '../kernel/forms';
import type { FormMeshes, WorkerAnswer } from './worker';
import type { MeshData } from '../mj/mesh';

/**
 * Version of the persistent cache: raising it throws away everything saved before. 2 (T163): the entries of version 1 may be
 * half models, and nothing in them says so. 3 (T164): the keys changed, the old ones would only take room. 4 (T175): every entry says when it
 * was last used and how much it weighs, and those saved before do not.
 */
export const FORMS_DB_VERSION = 4;

/**
 * The most the page keeps ready beyond what it has drawn, and the most the persistent cache keeps, in bytes of arrays (ADR-0108, measures there).
 * The second one must hold a whole world: least recently used out first, a world bigger than the cache would push out at every load what the next load asks for.
 */
export const FORM_MEMORY_BYTES = 128 * 1024 * 1024;
export const FORM_DISK_BYTES = 4 * 1024 * 1024 * 1024;
export const FORM_ENTRIES = 4096;

/** The ports of this machine that stay the same from one day to the next: `npm run dev` and `vite preview` when not told otherwise. */
const LASTING_PORTS = ['5173', '4173'];

/**
 * Whether the forms of this page may stay on disk (T177, ADR-0108). IndexedDB belongs to an origin, and an origin has its port: every
 * browser check on a free port left about 0.5 GB in the Chrome profile, on C:, for good (15 GB in four days), and no page can clean up
 * another origin. So on this machine only the lasting ports keep them; elsewhere the site's origin is one. `?formecache` is for who is checking the cache itself.
 */
export function keepsFormsOnDisk(place: { hostname: string; port: string; search: string }): boolean {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(place.hostname)) return true;
  return LASTING_PORTS.includes(place.port) || new URLSearchParams(place.search).has('formecache');
}

/** The bytes of the arrays of a mesh. */
const meshBytes = (m: MeshData): number => [m.positions, m.normals, m.colors, m.indices, m.sway, m.glow, m.alpha].reduce((n, a) => n + (a?.byteLength ?? 0), 0);

/** About how much a form takes: its arrays. Everything else in it is small, and the key is the program's text, already in memory. */
export function formBytes(res: FormResult): number {
  const m = res.meshes as FormMeshes | undefined;
  const meshes = m ? meshBytes(m.body) + m.limbs.reduce((n, l) => n + meshBytes(l.mesh), 0) + m.frames.reduce((n, f) => n + meshBytes(f), 0) : 0;
  return res.grid.cells.length + meshes;
}

export interface FormStore {
  get(key: string): Promise<FormResult | undefined>;
  set(key: string, res: FormResult): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Everything a form with its meshes depends on, and nothing else (ADR-0108): the kernel's `formKey` (the whole text of the program, so two
 * programs are never taken for one, the seed, the box, the tint) and what only the meshes look at. Not the model's name: two universes may
 * give it to different programs, and one program under two names is one result. Not `tempo`: what did not finish is not kept.
 */
export function formCacheKey(req: FormRequest): string {
  return JSON.stringify([req.vpt, !!req.rig, !!req.sway]) + formKey(req);
}

function restoreMesh(m: MeshData): MeshData {
  if (m.positions && !(m.positions instanceof Float32Array)) m.positions = new Float32Array(m.positions);
  if (m.normals && !(m.normals instanceof Float32Array)) m.normals = new Float32Array(m.normals);
  if (m.colors && !(m.colors instanceof Float32Array)) m.colors = new Float32Array(m.colors);
  if (m.indices && !(m.indices instanceof Uint32Array)) m.indices = new Uint32Array(m.indices);
  if (m.sway && !(m.sway instanceof Float32Array)) m.sway = new Float32Array(m.sway);
  if (m.glow && !(m.glow instanceof Float32Array)) m.glow = new Float32Array(m.glow);
  if (m.alpha && !(m.alpha instanceof Float32Array)) m.alpha = new Float32Array(m.alpha);
  return m;
}

export function restoreFormResult(res: FormResult): FormResult {
  if (res.grid?.cells && !(res.grid.cells instanceof Uint8Array)) {
    res.grid.cells = new Uint8Array(res.grid.cells);
  }
  const meshes = res.meshes as FormMeshes | undefined;
  if (meshes) {
    if (meshes.body) restoreMesh(meshes.body);
    if (meshes.limbs) {
      for (const l of meshes.limbs) if (l.mesh) restoreMesh(l.mesh);
    }
    if (meshes.frames) {
      for (const f of meshes.frames) restoreMesh(f);
    }
  }
  return res;
}

export class MemoryFormStore implements FormStore {
  private m = new Map<string, FormResult>();
  async get(key: string): Promise<FormResult | undefined> {
    return this.m.get(key);
  }
  async set(key: string, res: FormResult): Promise<void> {
    this.m.set(key, res);
  }
  async clear(): Promise<void> {
    this.m.clear();
  }
}

/** When an entry of the persistent cache was last used and how much it weighs: apart from the entry, so that neither means reading a form. */
const USES = 'uses';
interface FormUse {
  at: number;
  bytes: number;
}

export class IdbFormStore implements FormStore {
  private dbPromise?: Promise<IDBDatabase | undefined>;
  private clock = 0;

  constructor(
    private dbName = 'rune-forms',
    private storeName = 'forms',
    private maxBytes = FORM_DISK_BYTES,
    private maxEntries = FORM_ENTRIES,
  ) {}

  private db(): Promise<IDBDatabase | undefined> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof indexedDB === 'undefined') return Promise.resolve(undefined);
    return (this.dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, FORMS_DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          for (const name of [this.storeName, USES]) {
            if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
            db.createObjectStore(name);
          }
        };
        // Another tab holds the old version: this one goes on without the persistent cache rather than waiting for it.
        req.onblocked = () => resolve(undefined);
        req.onsuccess = () => {
          // And it does not hold back the tab of a later version (a closed database reads as a miss).
          req.result.onversionchange = () => req.result.close();
          resolve(req.result);
        };
        req.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    }));
  }

  /** Later than every use so far, also within a millisecond: the order is what the limit goes by. */
  private now(): number {
    return (this.clock = Math.max(Date.now(), this.clock + 1));
  }

  async get(key: string): Promise<FormResult | undefined> {
    const db = await this.db();
    if (!db) return undefined;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([this.storeName, USES], 'readwrite');
        const req = tx.objectStore(this.storeName).get(key);
        req.onsuccess = () => {
          const res = req.result as FormResult | undefined;
          if (res) tx.objectStore(USES).put({ at: this.now(), bytes: formBytes(res) } satisfies FormUse, key);
          resolve(res ? restoreFormResult(res) : undefined);
        };
        req.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    });
  }

  async set(key: string, res: FormResult): Promise<void> {
    // Now, not after the wait for the database: by then the page may have let go of the meshes.
    const whole = { ...res };
    const bytes = formBytes(whole);
    // Bigger than the whole cache: it would only push out everything else.
    if (bytes > this.maxBytes) return;
    const db = await this.db();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([this.storeName, USES], 'readwrite');
        tx.oncomplete = tx.onabort = tx.onerror = () => resolve();
        const forms = tx.objectStore(this.storeName);
        const uses = tx.objectStore(USES);
        forms.put(whole, key);
        uses.put({ at: this.now(), bytes } satisfies FormUse, key);
        // In this transaction: another tab may be writing, and what it wrote counts.
        const keys = uses.getAllKeys();
        const all = uses.getAll();
        all.onsuccess = () => {
          const entries = (all.result as FormUse[]).map((use, i) => ({ key: keys.result[i] as string, ...use })).sort((a, b) => a.at - b.at);
          let total = entries.reduce((n, e) => n + e.bytes, 0);
          let left = entries.length;
          for (const e of entries) {
            if (total <= this.maxBytes && left <= this.maxEntries) break;
            if (e.key === key) continue;
            forms.delete(e.key);
            uses.delete(e.key);
            total -= e.bytes;
            left--;
          }
        };
      } catch {
        resolve();
      }
    });
  }

  async clear(): Promise<void> {
    const db = await this.db();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([this.storeName, USES], 'readwrite');
        tx.oncomplete = tx.onabort = tx.onerror = () => resolve();
        tx.objectStore(this.storeName).clear();
        tx.objectStore(USES).clear();
      } catch {
        resolve();
      }
    });
  }
}

export class WorkerRunner implements FormRunner {
  private idle: Worker[] = [];
  private queue: Array<{ id: number; req: FormRequest; key: string }> = [];
  private waiting = new Map<number, { ok: (r: FormResult) => void; fail: (e: Error) => void; key: string }>();
  private next = 1;
  /** Least recently used first. */
  private memory = new Map<string, { result: FormResult; bytes: number }>();
  /** How much `memory` holds. */
  bytes = 0;
  private inflight = new Map<string, Promise<FormResult>>();
  readonly store: FormStore;

  constructor(
    n = Math.max(1, Math.min(4, (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4) - 1)),
    store?: FormStore,
    workerFactory?: () => Worker,
    private maxBytes = FORM_MEMORY_BYTES,
    private maxEntries = FORM_ENTRIES,
  ) {
    const onDisk = typeof indexedDB !== 'undefined' && (typeof location === 'undefined' || keepsFormsOnDisk(location));
    this.store = store ?? (onDisk ? new IdbFormStore() : new MemoryFormStore());
    if (typeof Worker !== 'undefined' || workerFactory) {
      const makeWorker = workerFactory ?? (() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
      for (let i = 0; i < n; i++) {
        const w = makeWorker();
        w.onmessage = (ev: MessageEvent<WorkerAnswer>) => {
          const a = ev.data;
          const p = this.waiting.get(a.id);
          this.waiting.delete(a.id);
          if (p) {
            if (a.ok) {
              if (a.finished) this.keep(p.key, a.result);
              p.ok(a.result);
            } else {
              p.fail(new Error(a.error));
            }
          }
          this.idle.push(w);
          this.pump();
        };
        w.onerror = (err: ErrorEvent) => {
          for (const [id, p] of this.waiting.entries()) {
            p.fail(new Error(`Worker error: ${err.message}`));
            this.waiting.delete(id);
          }
        };
        this.idle.push(w);
      }
    }
  }

  /** Jobs waiting or running (the HUD may show it). */
  get busy(): number {
    return this.queue.length + this.waiting.size;
  }

  /** Number of forms in the in-memory cache. */
  get cachedCount(): number {
    return this.memory.size;
  }

  has(key: string): boolean {
    return this.memory.has(key);
  }

  getCached(key: string): FormResult | undefined {
    return this.memory.get(key)?.result;
  }

  async clear(): Promise<void> {
    this.memory.clear();
    this.bytes = 0;
    await this.store.clear();
  }

  run(req: FormRequest): Promise<FormResult> {
    const key = formCacheKey(req);

    // 1. In-memory cache hit (synchronously resolved)
    const memHit = this.memory.get(key);
    if (memHit) {
      this.memory.delete(key);
      this.memory.set(key, memHit);
      return Promise.resolve(memHit.result);
    }

    // 2. In-flight deduplication: return existing job if already calculating
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = (async () => {
      // 3. Persistent store (IndexedDB) hit
      const dbHit = await this.store.get(key);
      // A store that holds the very objects of this page (MemoryFormStore) may have one whose meshes are gone: that is a miss.
      if (dbHit && !dbHit.meshesGone) {
        this.remember(key, dbHit);
        return dbHit;
      }

      // 4. Headless fallback if no workers were constructed
      if (this.idle.length === 0 && typeof Worker === 'undefined') {
        const { model: _compiled, finished, ...res } = runForm(req);
        if (finished) this.keep(key, res);
        return res;
      }

      // 5. Worker execution
      return new Promise<FormResult>((ok, fail) => {
        const id = this.next++;
        this.waiting.set(id, { ok, fail, key });
        this.queue.push({ id, req, key });
        this.pump();
      });
    })().finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, promise);
    return promise;
  }

  /** Only what has finished: a half model goes to who asked and stops there, as in InlineRunner (ADR-0108). */
  private keep(key: string, result: FormResult): void {
    this.remember(key, result);
    void this.store.set(key, result);
  }

  /**
   * Within the limit, least recently used out first, the last one always in: who asked is about to draw it. What goes out must really go, and a `Form`
   * of the kernel holds this same object: so it loses its meshes here, and the grid, which the kernel needs and which weighs little, stays
   * (`geoOf` asks for them again). The geometries already made have their own hold on the arrays.
   */
  private remember(key: string, result: FormResult): void {
    const old = this.memory.get(key);
    if (old) this.bytes -= old.bytes;
    this.memory.delete(key);
    const bytes = formBytes(result);
    this.memory.set(key, { result, bytes });
    this.bytes += bytes;
    for (const [k, e] of this.memory) {
      if (this.memory.size <= 1 || (this.bytes <= this.maxBytes && this.memory.size <= this.maxEntries)) break;
      this.memory.delete(k);
      this.bytes -= e.bytes;
      if (e.result.meshes) {
        e.result.meshes = undefined;
        e.result.meshesGone = true;
      }
    }
  }

  private pump(): void {
    while (this.idle.length && this.queue.length) {
      const job = this.queue.shift()!;
      this.idle.pop()!.postMessage({ id: job.id, req: job.req });
    }
  }
}
