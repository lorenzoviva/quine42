// The tables of lab/banco/universi-cloud/INTEGRAZIONE.md (T273): where every structure of Claude Cloud stands in the four universes, from the
// plans as the kernel builds them (`collocate`), between the two markers of the file.
//   npx vite-node lab/banco/universi-cloud/strumenti/integrazione.ts

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { collocate, leggi, PROGETTO, strutture, UNIVERSI } from './cloud';

const S = 18;
const righe: string[] = [];
for (const u of UNIVERSI) {
  const { files, maps } = leggi(u);
  const { strutture: placed, problemi } = await collocate(files, maps);
  const catalogo = new Map(strutture(u.tema).map((s) => [s.id, s]));
  placed.sort((a, b) => Math.hypot(a.cx, a.cy) - Math.hypot(b.cx, b.cy) || a.cy - b.cy || a.cx - b.cx || a.x - b.x);
  righe.push(`### ${u.nome} (${u.tema}) — ${placed.length} strutture${problemi.length ? `, ${problemi.length} problemi` : ''}`, '');
  righe.push('| luogo (cx, cy) | nome del luogo | ambiente | struttura (concetto del piano) | modello | taglia | lotto | centro del lotto (x, y) | centro del luogo (x, y) | catalogo |');
  righe.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const p of placed) {
    const c = catalogo.get(p.modello);
    const from = c ? `${c.catalogo === 'primo' ? 'primo' : 'gemello'}: \`${c.file}\`${c.cantina ? ', cantina' : ''}` : 'dell’universo (T272)';
    righe.push(`| (${p.cx}, ${p.cy}) | ${p.luogo} | \`${p.ambiente}\` | ${p.concetto} | \`${p.modello}\` | ${p.taglia ?? '—'} | ${p.lotto} | (${p.x}, ${p.y}) | (${p.cx * S + S / 2}, ${p.cy * S + S / 2}) | ${from} |`);
  }
  righe.push('');
}
const file = join(PROGETTO, 'lab/banco/universi-cloud/INTEGRAZIONE.md');
const testo = readFileSync(file, 'utf8');
const [a, b] = ['<!-- strutture -->', '<!-- /strutture -->'];
writeFileSync(file, `${testo.slice(0, testo.indexOf(a) + a.length)}\n\n${righe.join('\n')}\n${testo.slice(testo.indexOf(b))}`);
console.log(`${righe.length} righe`);
process.exit(0);
