// Legge l'universo Sidera dal disco come FileMap (percorso relativo → testo), come lo vede il kernel.
import fs from 'node:fs';
import path from 'node:path';
import type { FileMap } from '../../../../../src/kernel/types';

export const SIDERA = path.resolve(__dirname, '..');

/** Ciò che non è dell'universo: gli strumenti, il rapporto, la verifica. */
const FUORI = new Set(['strumenti', 'README.md', 'verifica.ts', 'rapporto-verifica.md']);

export function fileDi(dir = SIDERA, opts: { mappe?: boolean } = {}): FileMap {
  const out: FileMap = {};
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      const rel = path.relative(dir, p).split(path.sep).join('/');
      if (FUORI.has(rel.split('/')[0])) continue;
      if (!opts.mappe && rel.startsWith('maps/')) continue;
      if (rel === 'models/index.sidera.json' || rel.endsWith('rapporto-modelli.md')) continue;
      if (e.isDirectory()) walk(p);
      else out[rel] = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    }
  };
  walk(dir);
  return out;
}
