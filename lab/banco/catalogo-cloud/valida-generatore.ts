// The validation of the catalogue (cantiere 1): every program at 5 seeds and 2 sizes with the bench's own measures (`misure.ts`,
// `varianza.ts`), plus what the catalogue asks on top: no floating voxel, every storey reached, under 4500 ms at every size and seed.
// No model is called.
//
//   npx vite-node lab/banco/catalogo-cloud/valida-generatore.ts -- <file.xml> [<file.xml> …] [--rapporto] [--semi 5] [--taglie grande,enorme]
//
// With --rapporto it writes <file>.md next to each program (the table of the measures at the two sizes and the trace of seed 1) and
// <dir>/risultati.json with the numbers the index is made of. A program has a cellar (`sotto: 1`) if its root says `ground="Z"`.

import fs from 'node:fs';
import path from 'node:path';
import type { SizeTier } from '../../../src/mj/classes';
import { renderTrace, traceProgram } from '../../../src/mj/trace';
import type { Bersaglio } from '../misure';
import { prova, type Prova } from '../varianza';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const files = args.filter((a, i) => a.endsWith('.xml') && !args[i - 1]?.startsWith('--s') && !args[i - 1]?.startsWith('--t'));
const semi = Number(opt('semi') ?? 5);
const taglie = (opt('taglie') ?? 'grande,enorme').split(',') as SizeTier[];
const rapporto = args.includes('--rapporto');
const tracciaAnche = args.includes('--traccia');

/** The catalogue's own ceiling on time, at every size and seed. */
export const TEMPO_MASSIMO = 4500;

export interface Esito {
  file: string;
  nome: string;
  ambientazione: string;
  cantina: boolean;
  passa: boolean;
  difetti: string[];
  taglie: Array<{
    taglia: SizeTier;
    box: number[];
    vpt: number;
    semi: Array<{ seme: number; ms: number; piani: number; stanze: number; cantina: number; murato: number; persi: number; staccati: number; salti: number; finestre: number; porta: string; difetti: string[] }>;
    varianza?: Record<string, number | boolean>;
    difettiVarianza: string[];
    msMax: number;
  }>;
}

const n2 = (v: number) => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');

function valuta(file: string): { esito: Esito; p: Prova; xml: string; b: Bersaglio } {
  const xml = fs.readFileSync(file, 'utf8');
  const cantina = /\bground="Z"/.test(xml);
  const nome = path.basename(file, '.xml');
  const b: Bersaglio = { id: nome, nome, stile: '', descrizione: '', classe: 'structure', ...(cantina ? { sotto: 1 } : {}) };
  const p = prova(xml, b, { semi, taglie });
  const difetti: string[] = [];
  const out: Esito['taglie'] = p.taglie.map((t) => {
    const qui = p.esecuzioni.filter((x) => x.taglia === t.taglia);
    const righe = t.semi.map((s) => {
      const x = qui.find((q) => q.seme === s.seme);
      const m = x?.m;
      const extra: string[] = [];
      if (m) {
        const staccati = Math.round((1 - m.analisi.mainPart) * m.analisi.voxels);
        if (staccati > 0) extra.push(`fluttuanti: ${staccati} voxel staccati (${m.analisi.parts} pezzi)`);
        if (m.persi.length) extra.push(`piani non raggiunti: ${m.persi.map((q) => `z ${q.z} (${n2(q.area)} caselle²)`).join(', ')}`);
        if (cantina && m.cantina < 1.2) extra.push(`cantina: ${n2(m.cantina)} caselle² raggiunte`);
      }
      if (x && x.m.ms >= TEMPO_MASSIMO) extra.push(`tempo: ${x.m.ms} ms (serve < ${TEMPO_MASSIMO})`);
      const tutti = [...s.difetti, ...extra];
      for (const d of tutti) difetti.push(`${t.taglia} seme ${s.seme}: ${d}`);
      return {
        seme: s.seme,
        ms: m?.ms ?? s.ms,
        piani: m?.piani.length ?? 0,
        stanze: m?.stanze ?? 0,
        cantina: m?.cantina ?? 0,
        murato: m?.murato ?? 1,
        persi: m?.persi.length ?? 0,
        staccati: m ? Math.round((1 - m.analisi.mainPart) * m.analisi.voxels) : 0,
        salti: m?.salti.length ?? 0,
        finestre: m?.finestre ?? 0,
        porta: m?.porta ? `scarto ${n2(m.porta.scarto)}, alta ${n2(m.porta.alta)}${m.porta.libera ? '' : ', ostruita'}` : 'nessuna',
        difetti: tutti,
      };
    });
    for (const d of t.difettiVarianza) difetti.push(`${t.taglia} varianza: ${d}`);
    const v = t.varianza;
    return {
      taglia: t.taglia,
      box: t.box,
      vpt: t.vpt,
      semi: righe,
      ...(v ? { varianza: { voxel: v.voxel, colore: v.colore, pianta: v.pianta, perimetro: v.perimetro, interno: v.interno, firmePiani: v.firmePiani, firmeStanze: v.firmeStanze, architetture: v.architetture, statico: v.statico } } : {}),
      difettiVarianza: t.difettiVarianza,
      msMax: Math.max(...righe.map((r) => r.ms)),
    };
  });
  const ambientazione = path.basename(path.dirname(file));
  return { esito: { file, nome, ambientazione, cantina, passa: !difetti.length, difetti, taglie: out }, p, xml, b };
}

function testoRapporto(e: Esito, p: Prova): string {
  const righe: string[] = [];
  righe.push(`# ${e.nome} (${e.ambientazione})`, '');
  righe.push(`Programma: \`${path.basename(e.file)}\` · classe \`struttura\` (bersaglio \`grande\`)${e.cantina ? ' · **cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`)' : ''} · esito: **${e.passa ? 'passa' : 'non passa'}**`, '');
  righe.push(`Misurato con \`lab/banco/catalogo-cloud/valida-generatore.ts\` (le funzioni di \`misure.ts\` e \`varianza.ts\`), ${semi} semi, taglie ${taglie.join(' e ')}. Tempo massimo del catalogo: ${TEMPO_MASSIMO} ms a ogni seme.`, '');
  for (const t of e.taglie) {
    righe.push(`## ${t.taglia}: ${t.box.join(' × ')}, ${t.vpt} voxel per casella`, '');
    righe.push('| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |');
    righe.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const s of t.semi) righe.push(`| ${s.seme} | ${s.ms} | ${s.piani} | ${s.stanze} | ${e.cantina ? n2(s.cantina) : '—'} | ${n2(s.murato)} | ${s.persi} | ${s.staccati} | ${s.salti} | ${s.finestre} | ${s.porta} | ${s.difetti.join('; ') || '—'} |`);
    righe.push('');
    const v = t.varianza;
    if (v) {
      righe.push(`Varianza su ${semi} semi (mediane delle coppie): voxel ${n2(v.voxel as number)}, colore ${n2(v.colore as number)}, pianta ${n2(v.pianta as number)}, perimetro ${n2(v.perimetro as number)}, interno ${n2(v.interno as number)}, liste di piani ${v.firmePiani}, di stanze ${v.firmeStanze}, architetture ${v.architetture}/${semi}. ${t.difettiVarianza.length ? `Sotto la soglia: ${t.difettiVarianza.join('; ')}.` : 'Sopra le soglie di `varianza.ts`.'} Tempo massimo: ${t.msMax} ms.`, '');
    }
  }
  const prima = p.esecuzioni.find((x) => x.seme === 1);
  if (prima) {
    const giudizio = prima.m;
    righe.push(`## Piani del seme 1 a ${prima.taglia}`, '');
    righe.push('| quota (caselle) | area (caselle²) | testa | stanze |', '|---|---|---|---|');
    for (const pi of giudizio.piani) righe.push(`| ${n2(pi.quota)} | ${n2(pi.area)} | ${n2(pi.testa)} | ${pi.stanze} |`);
    righe.push('');
    righe.push(`## Traccia del seme 1 a ${prima.taglia} (\`src/mj/trace.ts\`, forma «differenze»)`, '');
    const t = traceProgram(prima.e.model, 1);
    righe.push('```text', renderTrace(t, prima.e.model, { forma: 'diffs', tetto: 3500 }), '```', '');
  }
  return righe.join('\n');
}

const risultati: Esito[] = [];
for (const file of files) {
  const { esito, p } = valuta(file);
  risultati.push(esito);
  const riga = esito.taglie.map((t) => `${t.taglia} ${t.semi.filter((s) => !s.difetti.length).length}/${t.semi.length} (max ${t.msMax} ms${t.varianza ? `, per ${n2(t.varianza.perimetro as number)} pianta ${n2(t.varianza.pianta as number)} int ${n2(t.varianza.interno as number)} arch ${t.varianza.architetture}` : ''})`).join(' · ');
  console.log(`${esito.passa ? 'PASSA' : 'CADE '} ${esito.ambientazione}/${esito.nome}: ${riga}`);
  for (const d of esito.difetti.slice(0, 14)) console.log(`   - ${d}`);
  if (rapporto) fs.writeFileSync(file.replace(/\.xml$/, '.md'), testoRapporto(esito, p));
  if (tracciaAnche && !esito.passa) {
    const x = p.esecuzioni.find((q) => q.m && esito.difetti.some((d) => d.startsWith(`${q.taglia} seme ${q.seme}:`)));
    if (x) console.log(renderTrace(traceProgram(x.e.model, x.seme), x.e.model, { forma: 'sections', tetto: 3000 }));
  }
}
if (rapporto && files.length) {
  const json = path.join(path.dirname(path.dirname(path.resolve(files[0]))), 'risultati.json');
  const prima: Record<string, Esito> = fs.existsSync(json) ? JSON.parse(fs.readFileSync(json, 'utf8')) : {};
  for (const e of risultati) prima[`${e.ambientazione}/${e.nome}`] = { ...e, file: path.relative(process.cwd(), e.file) };
  fs.writeFileSync(json, `${JSON.stringify(prima, null, 1)}\n`);
}
process.exitCode = risultati.every((e) => e.passa) ? 0 : 1;
