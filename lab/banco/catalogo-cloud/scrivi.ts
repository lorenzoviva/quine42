// Writes the programs of the catalogue (`catalogo.ts`) as `<ambientazione>/<nome>.xml`, with `genera.ts` and `struttura.ts`.
//
//   npx vite-node lab/banco/catalogo-cloud/scrivi.ts             all of them
//   npx vite-node lab/banco/catalogo-cloud/scrivi.ts -- fucina   only those whose name contains `fucina`

import fs from 'node:fs';
import path from 'node:path';
import { CATALOGO } from './catalogo';
import { xmlDi } from './genera';
import { programma } from './struttura';

const filtro = process.argv.slice(2).filter((a) => a !== '--')[0];
const qui = path.dirname(new URL(import.meta.url).pathname);
for (const s of CATALOGO) {
  if (filtro && !`${s.ambientazione}/${s.nome}`.includes(filtro)) continue;
  const dir = path.join(qui, s.ambientazione);
  fs.mkdirSync(dir, { recursive: true });
  const xml = xmlDi(programma(s));
  fs.writeFileSync(path.join(dir, `${s.nome}.xml`), xml);
  console.log(`${s.ambientazione}/${s.nome}.xml: ${xml.length} caratteri${s.cantina ? ', cantina' : ''}`);
}
