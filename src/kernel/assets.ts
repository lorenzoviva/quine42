// Binary-ish assets (generated images) live outside the repository: manifests and chunk records
// reference them by content hash ("img:…"). Chunk records cache the Council's work, so a place is
// generated once and revisited for free.

import { hashStr, hex } from './rng';
import type { ChunkPlan } from './agents/cartography';

export interface AssetStore {
  put(dataUrl: string): Promise<string>;
  get(id: string): Promise<string | undefined>;
  /** Synchronous lookup of already loaded assets. */
  peek(id: string): string | undefined;
}

export interface ChunkRecord {
  plan: ChunkPlan;
  /** Collision grid after the Physicist's survey (or the plan's grid if not painted). */
  grid: string[];
  image?: string;
  painted: boolean;
}

export interface ChunkStore {
  load(key: string): Promise<ChunkRecord | undefined>;
  save(key: string, record: ChunkRecord): Promise<void>;
  clear(): Promise<void>;
}

export function assetId(dataUrl: string): string {
  // Hash a sample plus the length: full hashing of megabyte strings is wasteful and collisions are irrelevant here.
  const step = Math.max(1, Math.floor(dataUrl.length / 4096));
  let sample = '';
  for (let i = 0; i < dataUrl.length; i += step) sample += dataUrl[i];
  return `img:${hex(hashStr(sample))}${hex(dataUrl.length)}`;
}

export class MemoryAssets implements AssetStore {
  private m = new Map<string, string>();
  async put(dataUrl: string): Promise<string> {
    const id = assetId(dataUrl);
    this.m.set(id, dataUrl);
    return id;
  }
  async get(id: string): Promise<string | undefined> {
    return this.m.get(id);
  }
  peek(id: string): string | undefined {
    return this.m.get(id);
  }
}

export class MemoryChunks implements ChunkStore {
  private m = new Map<string, ChunkRecord>();
  async load(key: string): Promise<ChunkRecord | undefined> {
    return this.m.get(key);
  }
  async save(key: string, record: ChunkRecord): Promise<void> {
    this.m.set(key, record);
  }
  async clear(): Promise<void> {
    this.m.clear();
  }
}

// --- IndexedDB (browser) -------------------------------------------------------------------------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('rune', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('assets');
      req.result.createObjectStore('chunks');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(store, mode).objectStore(store));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export class IdbAssets implements AssetStore {
  private m = new Map<string, string>();
  private db = openDb();
  async put(dataUrl: string): Promise<string> {
    const id = assetId(dataUrl);
    this.m.set(id, dataUrl);
    await tx(await this.db, 'assets', 'readwrite', (s) => s.put(dataUrl, id)).catch(() => undefined);
    return id;
  }
  async get(id: string): Promise<string | undefined> {
    if (this.m.has(id)) return this.m.get(id);
    const v = await tx<string | undefined>(await this.db, 'assets', 'readonly', (s) => s.get(id)).catch(() => undefined);
    if (v) this.m.set(id, v);
    return v;
  }
  peek(id: string): string | undefined {
    return this.m.get(id);
  }
}

export class IdbChunks implements ChunkStore {
  private db = openDb();
  async load(key: string): Promise<ChunkRecord | undefined> {
    return tx<ChunkRecord | undefined>(await this.db, 'chunks', 'readonly', (s) => s.get(key)).catch(() => undefined);
  }
  async save(key: string, record: ChunkRecord): Promise<void> {
    await tx(await this.db, 'chunks', 'readwrite', (s) => s.put(record, key)).catch(() => undefined);
  }
  async clear(): Promise<void> {
    await tx(await this.db, 'chunks', 'readwrite', (s) => s.clear()).catch(() => undefined);
  }
}
