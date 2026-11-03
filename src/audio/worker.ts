// Renders sound programs off the page's thread (ADR-0126), and keeps them on disk: reading a value from IndexedDB is decoding it, and that too stays out of the page.

import { soundKey, tryPrepareSound, type PreparedSound, type SoundRequest } from './prepare';

export interface SoundJob {
  id: number;
  req: SoundRequest;
  /** Whether this origin keeps things on disk (`keepsFormsOnDisk`). */
  disk: boolean;
}

export type SoundAnswer = { id: number; sound: PreparedSound; ms: number; fromDisk: boolean } | { id: number; error: string };

const DB = 'quine-suoni';
const RENDERS = 'renders';
const USES = 'uses';
/** About 25 seconds of music is 4.4 MB: this is some sixty pieces. Least recently used out first. */
export const SOUND_DISK_BYTES = 256 * 1024 * 1024;

let database: Promise<IDBDatabase | undefined> | undefined;
function db(): Promise<IDBDatabase | undefined> {
  return (database ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(RENDERS);
        req.result.createObjectStore(USES);
      };
      req.onblocked = req.onerror = () => resolve(undefined);
      req.onsuccess = () => resolve(req.result);
    } catch {
      resolve(undefined);
    }
  }));
}

async function readDisk(key: string): Promise<PreparedSound | undefined> {
  const d = await db();
  if (!d) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = d.transaction([RENDERS, USES], 'readwrite');
      tx.onabort = () => resolve(undefined);
      const got = tx.objectStore(RENDERS).get(key);
      got.onerror = () => resolve(undefined);
      got.onsuccess = () => {
        const sound = got.result as PreparedSound | undefined;
        if (sound) tx.objectStore(USES).put({ at: Date.now(), bytes: sound.samples.byteLength }, key);
        resolve(sound);
      };
    } catch {
      resolve(undefined);
    }
  });
}

async function writeDisk(key: string, sound: PreparedSound): Promise<void> {
  const d = await db();
  if (!d) return;
  return new Promise((resolve) => {
    try {
      const tx = d.transaction([RENDERS, USES], 'readwrite');
      tx.oncomplete = tx.onabort = tx.onerror = () => resolve();
      const renders = tx.objectStore(RENDERS);
      const uses = tx.objectStore(USES);
      renders.put(sound, key);
      uses.put({ at: Date.now(), bytes: sound.samples.byteLength }, key);
      const keys = uses.getAllKeys();
      const all = uses.getAll();
      all.onsuccess = () => {
        const entries = (all.result as Array<{ at: number; bytes: number }>).map((u, i) => ({ ...u, key: keys.result[i] as string })).sort((a, b) => a.at - b.at);
        let total = entries.reduce((n, e) => n + e.bytes, 0);
        for (const e of entries) {
          if (total <= SOUND_DISK_BYTES) break;
          if (e.key === key) continue;
          renders.delete(e.key);
          uses.delete(e.key);
          total -= e.bytes;
        }
      };
    } catch {
      resolve();
    }
  });
}

self.onmessage = async (ev: MessageEvent<SoundJob>) => {
  const { id, req, disk } = ev.data;
  const reply = (a: SoundAnswer) => (self as unknown as Worker).postMessage(a, 'sound' in a ? [a.sound.samples.buffer] : []);
  const t0 = performance.now();
  const key = soundKey(req);
  const kept = disk && typeof indexedDB !== 'undefined' ? await readDisk(key) : undefined;
  if (kept) return reply({ id, sound: kept, ms: performance.now() - t0, fromDisk: true });
  const made = tryPrepareSound(req);
  if ('error' in made) return reply({ id, error: made.error });
  const ms = performance.now() - t0;
  // Before the transfer takes the samples away; the clone is made when `put` is called.
  if (disk && typeof indexedDB !== 'undefined') await writeDisk(key, made.sound);
  reply({ id, sound: made.sound, ms, fromDisk: false });
};
