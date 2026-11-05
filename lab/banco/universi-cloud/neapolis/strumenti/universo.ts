// Ciò che gli strumenti di Neapolis condividono: i file dell'universo come li legge il kernel, un kernel acceso.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Kernel } from '../../../../../src/kernel/kernel';
import { memoryStore } from '../../../../../src/kernel/repo';
import { MockAiModels } from '../../../../../src/kernel/ai/mock';
import { MemoryChunks, type ChunkStore } from '../../../../../src/kernel/chunks';
import type { FileMap } from '../../../../../src/kernel/types';

export const DIR = 'lab/banco/universi-cloud/neapolis';
/** Ciò che sta nella cartella ma non è dell'universo (gli strumenti, il rapporto). */
const NOT_UNIVERSE = new Set(['strumenti', 'README.md', 'verifica.ts', 'maps']);

/** I file di testo dell'universo (senza `maps/`, che il kernel legge dall'archivio dei luoghi). */
export function universeFiles(dir = DIR): FileMap {
  const out: FileMap = {};
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const rel = relative(dir, p).replace(/\\/g, '/');
      if (NOT_UNIVERSE.has(rel.split('/')[0])) continue;
      if (statSync(p).isDirectory()) walk(p);
      else out[rel] = readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    }
  };
  walk(dir);
  return out;
}

/** I piani dei luoghi in `maps/`: nome del file → piano. */
export function mapFiles(dir = DIR): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let names: string[] = [];
  try {
    names = readdirSync(join(dir, 'maps'));
  } catch {
    return out;
  }
  for (const n of names) if (n.endsWith('.json')) out[n] = JSON.parse(readFileSync(join(dir, 'maps', n), 'utf8'));
  return out;
}

/** L'archivio dei luoghi come lo legge il kernel: la chiave è quella di `recordKey`, il file la sostituisce `:` e `,` con `_`. */
export function chunksFromMaps(maps: Record<string, unknown>): ChunkStore {
  const store = new MemoryChunks();
  const byFile = new Map(Object.entries(maps));
  const inner = store as unknown as { load: ChunkStore['load'] };
  const load = inner.load.bind(store);
  store.load = async (key: string) => (await load(key)) ?? (byFile.get(`${key.replace(/[:,]/g, '_')}.json`) as never);
  return store;
}

export async function bootNeapolis(opts: { chunks?: ChunkStore; files?: FileMap } = {}): Promise<Kernel> {
  return Kernel.boot({ files: opts.files ?? universeFiles(), store: memoryStore(), ai: new MockAiModels(), chunks: opts.chunks ?? chunksFromMaps(mapFiles()) });
}
