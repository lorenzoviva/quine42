// Writes README-generatore.md's comparative table from risultati.json (what `valida-generatore.ts --rapporto` leaves): the part between the two markers.
//   npx vite-node lab/banco/catalogo-cloud/indice.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOGO } from './catalogo-generatore';

const qui = path.dirname(fileURLToPath(import.meta.url));
const r = JSON.parse(fs.readFileSync(path.join(qui, 'risultati.json'), 'utf8'));
const n2 = (v: number) => v.toFixed(2).replace('.', ',');
const righe = ['| ambientazione | struttura | cosa è | cantina | Grande: semi, ms max | Enorme: semi, ms max | perimetro G / E | pianta G / E | interno G / E | architetture G / E | esito |', '|---|---|---|---|---|---|---|---|---|---|---|'];
for (const s of CATALOGO) {
  const e = r[`${s.ambientazione}/${s.nome}`];
  if (!e) continue;
  const [g, n] = e.taglie;
  const semi = (t: any) => `${t.semi.filter((x: any) => !x.difetti.length).length}/${t.semi.length}, ${t.msMax}`;
  const coppia = (q: string) => `${n2(g.varianza[q])} / ${n2(n.varianza[q])}`;
  righe.push(`| ${s.ambientazione} | [${s.nome}](${s.ambientazione}/${s.nome}.md) | ${s.titolo} | ${s.cantina ? 'sì' : '—'} | ${semi(g)} | ${semi(n)} | ${coppia('perimetro')} | ${coppia('pianta')} | ${coppia('interno')} | ${g.varianza.architetture}/${g.semi.length} / ${n.varianza.architetture}/${n.semi.length} | ${e.passa ? 'passa' : 'non passa'} |`);
}
const file = path.join(qui, 'README-generatore.md');
const testo = fs.readFileSync(file, 'utf8');
const [a, b] = ['<!-- tabella -->', '<!-- /tabella -->'];
fs.writeFileSync(file, `${testo.slice(0, testo.indexOf(a) + a.length)}\n${righe.join('\n')}\n${testo.slice(testo.indexOf(b))}`);
console.log(`${righe.length - 2} righe`);
