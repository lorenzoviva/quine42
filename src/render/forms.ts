// The browser's FormRunner: a small pool of Web Workers that run the models' programs and make their
// meshes (src/render/worker.ts). The kernel keeps the grid for collision and actions; the renderer draws
// the meshes that came with it.
//
// T64: Form variants and animation frames cache (in-memory Map and persistent IndexedDB) so heavy models
// (e.g. circuito-3D with 32 animation frames) run once and reload instantly across sessions and seeds.

import { runForm, type FormRequest, type FormResult, type FormRunner } from '../kernel/forms';
import type { FormMeshes, WorkerAnswer } from './worker';
import type { MeshData } from '../mj/mesh';
import { hashStr } from '../kernel/rng';

export interface FormStore {
  get(key: string): Promise<FormResult | undefined>;
  set(key: string, res: FormResult): Promise<void>;
  clear(): Promise<void>;
}

/** Deterministic cache key for a program's form variant. */
export function formCacheKey(req: FormRequest): string {
  const h = hashStr(req.xml);
  const tint = req.tint ? `${req.tint.symbol}:${req.tint.color}` : '';
  const rig = req.rig ? 1 : 0;
  const sway = req.sway ? 1 : 0;
  const size = req.size ? `${req.size[0]}x${req.size[1]}x${req.size[2]}` : '';
  const model = req.model ?? '';
  return `${model}#${req.seed}#${req.vpt}#${h}#${tint}#${rig}#${sway}#${size}#${req.tempo ?? ''}`;
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

export class IdbFormStore implements FormStore {
  private dbPromise?: Promise<IDBDatabase | undefined>;

  constructor(private dbName = 'rune-forms', private storeName = 'forms') {}

  private db(): Promise<IDBDatabase | undefined> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof indexedDB === 'undefined') return Promise.resolve(undefined);
    return (this.dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(this.storeName)) {
            req.result.createObjectStore(this.storeName);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    }));
  }

  async get(key: string): Promise<FormResult | undefined> {
    const db = await this.db();
    if (!db) return undefined;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.storeName, 'readonly');
        const req = tx.objectStore(this.storeName).get(key);
        req.onsuccess = () => {
          const res = req.result as FormResult | undefined;
          resolve(res ? restoreFormResult(res) : undefined);
        };
        req.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    });
  }

  async set(key: string, res: FormResult): Promise<void> {
    const db = await this.db();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const req = tx.objectStore(this.storeName).put(res, key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
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
        const tx = db.transaction(this.storeName, 'readwrite');
        const req = tx.objectStore(this.storeName).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
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
  private memory = new Map<string, FormResult>();
  private inflight = new Map<string, Promise<FormResult>>();
  readonly store: FormStore;

  constructor(
    n = Math.max(1, Math.min(4, (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4) - 1)),
    store?: FormStore,
    workerFactory?: () => Worker
  ) {
    this.store = store ?? (typeof indexedDB !== 'undefined' ? new IdbFormStore() : new MemoryFormStore());
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
              this.memory.set(p.key, a.result);
              void this.store.set(p.key, a.result);
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
    return this.memory.get(key);
  }

  async clear(): Promise<void> {
    this.memory.clear();
    await this.store.clear();
  }

  run(req: FormRequest): Promise<FormResult> {
    const key = formCacheKey(req);

    // 1. In-memory cache hit (synchronously resolved)
    const memHit = this.memory.get(key);
    if (memHit) return Promise.resolve(memHit);

    // 2. In-flight deduplication: return existing job if already calculating
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = (async () => {
      // 3. Persistent store (IndexedDB) hit
      const dbHit = await this.store.get(key);
      if (dbHit) {
        this.memory.set(key, dbHit);
        return dbHit;
      }

      // 4. Headless fallback if no workers were constructed
      if (this.idle.length === 0 && typeof Worker === 'undefined') {
        const res = runForm(req);
        this.memory.set(key, res);
        void this.store.set(key, res);
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

  private pump(): void {
    while (this.idle.length && this.queue.length) {
      const job = this.queue.shift()!;
      this.idle.pop()!.postMessage({ id: job.id, req: job.req });
    }
  }
}
