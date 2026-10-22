// Place records live outside the text snapshot of the universe: the Cartographer's plan of every place,
// so a place is generated once and revisited for free (maps/ in the universe repository, or IndexedDB).

import type { ChunkPlan } from './agents/cartography';

export interface ChunkRecord {
  plan: ChunkPlan;
}

export interface ChunkStore {
  load(key: string): Promise<ChunkRecord | undefined>;
  save(key: string, record: ChunkRecord): Promise<void>;
  clear(): Promise<void>;
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

// --- IndexedDB (browser, without the universe server) ---------------------------------------------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('rune', 1);
    req.onupgradeneeded = () => {
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
