// Writes the programs of the catalogue to `<collezione>/<ambientazione>/<nome>.xml` (all, or the named ones).
//   npx vite-node lab/banco/fauna-biomi-cloud/scolpisci.ts -- [nome …]

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFINIZIONI } from './catalogo';

const QUI = dirname(fileURLToPath(import.meta.url));
const nomi = process.argv.slice(2).filter((a) => a !== '--');
for (const d of DEFINIZIONI) {
  if (nomi.length && !nomi.includes(d.nome)) continue;
  const dir = join(QUI, d.collezione, d.ambientazione);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${d.nome}.xml`), d.xml());
}
