// Loading a universe written on disk (lab/banco/universi-cloud/<nome>/) as the kernel reads it: its files as a FileMap, its maps as a chunk store
// under the kernel's own keys (`recordKey`: name, seed, signature of the bible's title, place), and a Kernel booted on them with the offline models.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kernel } from '../../../../src/kernel/kernel';
import { MemoryChunks } from '../../../../src/kernel/chunks';
import { memoryStore } from '../../../../src/kernel/repo';
import { MockAiModels } from '../../../../src/kernel/ai/mock';
import { allowedPath } from '../../../../src/kernel/paths';
import { hashStr, hex } from '../../../../src/kernel/rng';
import type { FileMap } from '../../../../src/kernel/types';
import type { ChunkRecord } from '../../../../src/kernel/chunks';

export const RADICE = fileURLToPath(new URL('../', import.meta.url));

/** Every file of the universe that a universe may hold (`allowedPath`): what is beside it (README, verifica.ts) stays out, maps apart. */
export function leggiUniverso(dir: string): { files: FileMap; maps: Record<string, ChunkRecord> } {
  const files: FileMap = {};
  const maps: Record<string, ChunkRecord> = {};
  const walk = (d: string) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else {
        const rel = relative(dir, p).replace(/\\/g, '/');
        if (!allowedPath(rel)) continue;
        const text = readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
        if (rel.startsWith('maps/')) maps[rel.slice(5, -5)] = JSON.parse(text);
        else files[rel] = text;
      }
    }
  };
  walk(dir);
  return { files, maps };
}

/** The prefix of the name of a map file of this universe (`maps/<prefisso>_<cx>_<cy>.json`), as `UniverseChunks` writes it. */
export function prefissoMappe(files: FileMap): string {
  const u = JSON.parse(files['universe.json']);
  // The bible's title, as the kernel signs the places (`title` since the contract 0.4, `titolo` before: the files may be either).
  const bible = JSON.parse(files['world/bible.json']);
  const titolo = bible.title ?? bible.titolo ?? '';
  return `${u.name}_${u.seed}_${hex(hashStr(titolo))}`;
}

export const fileMappa = (files: FileMap, cx: number, cy: number) => `${prefissoMappe(files)}_${cx}_${cy}`;

/** A chunk store holding the maps under the kernel's keys (`name:seed:sig:cx,cy`). */
export function negozioMappe(files: FileMap, maps: Record<string, ChunkRecord>): MemoryChunks {
  const store = new MemoryChunks();
  const prefix = prefissoMappe(files);
  for (const [name, rec] of Object.entries(maps)) {
    if (!name.startsWith(prefix + '_')) continue;
    const [cx, cy] = name.slice(prefix.length + 1).split('_');
    void store.save(`${prefix.replace(/_/g, ':')}:${cx},${cy}`, rec);
  }
  return store;
}

export async function avvia(dir: string, ai = new MockAiModels()) {
  const { files, maps } = leggiUniverso(dir);
  const chunks = negozioMappe(files, maps);
  const k = await Kernel.boot({ files, store: memoryStore(), ai, chunks });
  return { k, files, maps, chunks };
}
