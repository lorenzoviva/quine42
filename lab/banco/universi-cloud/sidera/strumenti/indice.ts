// models/index.json di Sidera: le voci del seme per i programmi copiati dal seme, e quelle di models/index.sidera.json
// per i programmi scritti per Sidera. Esegui: npx vite-node lab/banco/universi-cloud/sidera/strumenti/indice.ts
import fs from 'node:fs';
import path from 'node:path';
import { SIDERA } from './carica';

const seme = JSON.parse(fs.readFileSync(path.join(SIDERA, '../../../../universe/models/index.json'), 'utf8'));
const nostro = JSON.parse(fs.readFileSync(path.join(SIDERA, 'models/index.sidera.json'), 'utf8'));
const presenti = fs.readdirSync(path.join(SIDERA, 'models')).filter((f) => f.endsWith('.xml')).map((f) => f.slice(0, -4));
const indice: Record<string, unknown> = {};
const mancano: string[] = [];
for (const id of presenti) {
  const voce = nostro[id] ?? seme[id];
  if (voce) indice[id] = voce;
  else mancano.push(id);
}
fs.writeFileSync(path.join(SIDERA, 'models/index.json'), JSON.stringify(indice, null, 1) + '\n');
console.log(`${Object.keys(indice).length} voci (${Object.keys(nostro).filter((k) => presenti.includes(k)).length} di Sidera)${mancano.length ? `; senza voce: ${mancano.join(', ')}` : ''}`);
