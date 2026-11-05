// Le prove dei modelli e dei suoni di Sidera (Cantiere 4C): il validatore del gioco, la scatola della classe, la varianza fra i semi,
// l'analisi dei suoni su dieci terne di semi, la quarta parete. Stampa una tabella, scrive `models/rapporto-modelli.md`, esce con 1 se qualcosa non va.
//
//   npx vite-node lab/banco/universi-cloud/sidera/strumenti/modelli.ts [-- id1 id2 …]

import fs from 'node:fs';
import path from 'node:path';
import { modelErrors } from '../../../../../src/kernel/validator';
import { metaBreak } from '../../../../../src/kernel/fourthwall';
import { FormCache, Forms, InlineRunner, MODEL_TIME } from '../../../../../src/kernel/forms';
import { boxOf, classOf } from '../../../../../src/mj/classes';
import { analyse } from '../../../../../src/mj/check';
import { colorTable } from '../../../../../src/mj/mesh';
import { compileMjx } from '../../../../../src/mj/model';
import { FORM_LIMITS, MAX_FORM_TIME, MAX_FORM_XML, runMjx } from '../../../../../src/mj/run';
import { analyzeSound } from '../../../../../src/mj/soundanalysis';

const DIR = path.resolve(__dirname, '../models');
const SEMI = [1, 2, 3, 4, 5];
const SOGLIA = 0.15;
const TERNE = Array.from({ length: 10 }, (_, k) => [3 * k + 1, 3 * k + 2, 3 * k + 3]);
/** Parole che dentro il mondo non si dicono (oltre al filtro del gioco). */
const VIETATE = /\b(programm\w*|codic\w*|simulazion\w*|computer|glitch|pixel|render\w*|server|bug|loop|giocator\w*)\b/i;

const index: Record<string, { classe: string; nome: string; autore: string; suono?: unknown }> = JSON.parse(fs.readFileSync(path.join(DIR, 'index.sidera.json'), 'utf8'));
const filtro = process.argv.slice(2).filter((a) => a !== '--');
const ids = Object.keys(index).filter((id) => !filtro.length || filtro.includes(id));

interface Riga {
  id: string;
  classe: string;
  errori: string[];
  varianza?: number;
  secondi: number;
}

/** Il programma come lo esegue il gioco: la voce dell'indice con la sua classe, la scatola che `Forms` gli dà. */
function esegui(id: string, xml: string, classe: string, seme: number) {
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load({ [`models/${id}.xml`]: xml, 'models/index.json': JSON.stringify({ [id]: { classe } }) });
  const q = forms.request(id, seme)!;
  const model = compileMjx(q.xml, { ...(q.size ? { size: q.size } : {}), ...(q.base ? { base: q.base } : {}) });
  const result = runMjx(model, seme, { deadline: Math.min(q.tempo ?? MODEL_TIME, MAX_FORM_TIME), limits: FORM_LIMITS });
  return { model, result };
}

function provaModello(id: string, xml: string, classe: string): Riga {
  const t0 = performance.now();
  const errori: string[] = [];
  const cls = classOf(classe);
  if (!cls) return { id, classe, errori: [`classe sconosciuta ${classe}`], secondi: 0 };
  const box = boxOf(cls);
  const pieni: Uint8Array[] = [];
  for (const seme of SEMI) {
    try {
      const { model, result } = esegui(id, xml, classe, seme);
      const g = result.grid;
      if (g.X !== box[0] || g.Y !== box[1] || g.Z !== box[2]) errori.push(`seme ${seme}: scatola ${g.X}×${g.Y}×${g.Z}, la classe vuole ${box.join('×')}`);
      const a = analyse(result, model.program.palette, { grounded: true, minHeight: Math.round((cls.minHeight ?? 0) * box[2]) });
      for (const e of a.errors) errori.push(`seme ${seme}: ${e}`);
      if (a.voxels > g.cells.length * 0.85) errori.push(`seme ${seme}: riempie troppo la scatola`);
      if (result.ms > 4000) errori.push(`seme ${seme}: lento (${Math.round(result.ms)} ms)`);
      const colori = colorTable(g.alphabet, model.program.palette);
      const p = new Uint8Array(g.cells.length);
      for (let i = 0; i < p.length; i++) if (colori[g.cells[i]]) p[i] = 1;
      pieni.push(p);
    } catch (e) {
      errori.push(`seme ${seme}: ${(e as Error).message}`);
    }
  }
  let varianza: number | undefined;
  if (pieni.length === SEMI.length) {
    const quote: number[] = [];
    for (let i = 0; i < pieni.length; i++)
      for (let j = i + 1; j < pieni.length; j++) {
        let diversi = 0, uno = 0;
        const a = pieni[i], b = pieni[j];
        for (let k = 0; k < a.length; k++) {
          if (a[k] || b[k]) uno++;
          if (a[k] !== b[k]) diversi++;
        }
        quote.push(uno ? diversi / uno : 0);
      }
    quote.sort((x, y) => x - y);
    varianza = (quote[4] + quote[5]) / 2;
    if (varianza <= SOGLIA) errori.push(`varianza ${varianza.toFixed(3)} ≤ ${SOGLIA}`);
  }
  return { id, classe, errori, varianza, secondi: (performance.now() - t0) / 1000 };
}

function provaSuono(id: string, xml: string): Riga {
  const t0 = performance.now();
  const errori: string[] = [];
  const m = compileMjx(xml);
  if (!m.sound) return { id, classe: 'suono', errori: ['manca <sound>'], secondi: 0 };
  for (const seeds of TERNE) {
    const r = analyzeSound(m, { seeds });
    for (const i of r.issues) errori.push(`semi ${seeds.join(',')}: ${i.defect}: ${i.message}`);
  }
  return { id, classe: 'suono', errori, secondi: (performance.now() - t0) / 1000 };
}

const righe: Riga[] = [];
for (const id of ids) {
  const voce = index[id];
  const file = path.join(DIR, `${id}.xml`);
  if (!fs.existsSync(file)) {
    righe.push({ id, classe: voce.classe, errori: ['file mancante'], secondi: 0 });
    continue;
  }
  const xml = fs.readFileSync(file, 'utf8');
  const comuni: string[] = [];
  if (xml.length > MAX_FORM_XML) comuni.push('troppo lungo');
  comuni.push(...modelErrors(`models/${id}.xml`, xml));
  for (const testo of [xml, voce.nome]) {
    const m = metaBreak(testo) ?? VIETATE.exec(testo)?.[0];
    if (m) comuni.push(`quarta parete: «${m}»`);
  }
  const riga = voce.classe === 'suono' ? provaSuono(id, xml) : provaModello(id, xml, voce.classe);
  riga.errori.unshift(...comuni);
  righe.push(riga);
  const v = riga.varianza === undefined ? '   -  ' : riga.varianza.toFixed(3);
  console.log(`${id.padEnd(30)} ${riga.classe.padEnd(10)} ${String(riga.errori.length).padStart(3)} ${v.padStart(6)} ${riga.secondi.toFixed(1).padStart(6)}s`);
  for (const e of riga.errori.slice(0, 8)) console.log(`    ${e}`);
}

const falliti = righe.filter((r) => r.errori.length);
const tabella = [
  '| id | classe | errori | varianza (mediana) | secondi |',
  '|---|---|---|---|---|',
  ...righe.map((r) => `| ${r.id} | ${r.classe} | ${r.errori.length} | ${r.varianza === undefined ? '-' : r.varianza.toFixed(3)} | ${r.secondi.toFixed(1)} |`),
].join('\n');
if (!filtro.length) {
  const md = [
    '# Sidera: le prove dei modelli e dei suoni',
    '',
    'Scritto da `lab/banco/universi-cloud/sidera/strumenti/modelli.ts`. Per ogni modello: il validatore del gioco (`modelErrors`), la scatola della classe',
    `come la dà \`Forms\` con l'analisi a terra e l'altezza minima della classe, sui semi ${SEMI.join(', ')}; la varianza è la mediana, sulle coppie di semi,`,
    `dei voxel pieni in uno solo dei due sopra quelli pieni in almeno uno (soglia > ${SOGLIA}). Per ogni suono: il validatore e l'analisi su dieci terne`,
    `di semi (${TERNE.map((t) => t.join(',')).join(' · ')}). Per tutti: il filtro della quarta parete.`,
    '',
    tabella,
    '',
    falliti.length ? `**${falliti.length} non passano.**\n\n${falliti.map((r) => `- ${r.id}: ${r.errori.slice(0, 5).join('; ')}`).join('\n')}` : '**Passano tutti.**',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(DIR, 'rapporto-modelli.md'), md);
}
console.log(falliti.length ? `\n${falliti.length} non passano` : '\nPassano tutti');
process.exit(falliti.length ? 1 : 0);
