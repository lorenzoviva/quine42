// Variance between concepts and between seeds (T337, `lab/banco/concetti.ts`): no model is called, the programs already written run with
// more seeds, and the table says how much the seeds of each differ and how much the concepts differ from each other.
//
//   npx vite-node lab/scripts/banco-concetti.ts -- --radici lab/banco/procedurale --nome procedurale [--taglia large] [--semi 5] [--out lab/banco/metodo/misure]
//   npx vite-node lab/scripts/banco-concetti.ts -- --xml a.xml:rocca,b.xml:tempio --nome prova
//   npx vite-node lab/scripts/banco-concetti.ts -- --handmade lab/mjx/models/handmade --nome handmade
//   … --scheletro lab/banco/riferimento/cantiere.xml   (how much of each program is the skeleton's lines, verbatim)
//
// → <out>/<nome>.md, <out>/<nome>.json, <out>/<nome>.png (a row per program, a model per seed, in 3/4 from the front).

import fs from 'node:fs';
import path from 'node:path';
import type { SizeTier } from '../../src/mj/classes';
import { Mj3Error, type Grid3 } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import { FORM_LIMITS, runMjx } from '../../src/mj/run';
import { BERSAGLI, bersaglio } from '../banco/bersagli';
import { COMPONENTI, confronta, descrittori, formaDi, piedeDi, type Forma, type Gruppo } from '../banco/concetti';
import { esegui, type Bersaglio } from '../banco/misure';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);

const out = path.resolve(opt('out') ?? 'lab/out/banco/concetti');
const nome = opt('nome') ?? 'concetti';
const semi = Number(opt('semi') ?? 5);
const taglia = opt('taglia') as SizeTier | undefined;
const scheletro = opt('scheletro');
const conFoto = !args.includes('--senza-foto');

interface Voce {
  nome: string;
  file: string;
  /** A building of the bench: run in the box of its class; otherwise the program's own box. */
  b?: Bersaglio;
  concetto: string;
}

/** The last version of each attempt of a folder of the bench: `<target>/<n>/seconda/modello.xml` if there is one. */
function vociDi(radice: string): Voce[] {
  const voci: Voce[] = [];
  for (const b of BERSAGLI) {
    const dir = path.join(radice, b.id);
    if (!fs.existsSync(dir)) continue;
    for (const n of fs.readdirSync(dir).sort()) {
      const file = ['seconda', ''].map((s) => path.join(dir, n, s, 'modello.xml')).find((f) => fs.existsSync(f));
      if (file) voci.push({ nome: `${b.id}/${n}${file.includes('seconda') ? '/seconda' : ''}`, file, b, concetto: b.id });
    }
  }
  return voci;
}

const voci: Voce[] = [];
for (const r of (opt('radici') ?? '').split(',').filter(Boolean)) voci.push(...vociDi(r));
for (const spec of (opt('xml') ?? '').split(',').filter(Boolean)) {
  const [file, id] = spec.split(':');
  const b = bersaglio(id ?? '');
  if (!b) throw new Error(`--xml file:bersaglio, bersaglio sconosciuto: ${id}`);
  voci.push({ nome: `${path.basename(file, '.xml')}`, file, b, concetto: b.id });
}
const hm = opt('handmade');
if (hm)
  for (const f of fs.readdirSync(hm).sort())
    if (f.endsWith('.xml') && !/ copy/.test(f)) voci.push({ nome: f.replace(/\.xml$/, ''), file: path.join(hm, f), concetto: f.replace(/\.xml$/, '') });
if (!voci.length) throw new Error('niente da misurare: --radici, --xml o --handmade');

/** One run: the grid and where its feet are. Throws Mj3Error if the game would not take it. */
function corsa(v: Voce, seme: number): { g: Grid3; palette: Parameters<typeof formaDi>[3]; piede: number } {
  if (v.b) {
    const b = taglia ? { ...v.b, taglia } : v.b;
    const e = esegui(fs.readFileSync(v.file, 'utf8'), b, seme);
    return { g: e.grid, palette: e.model.program.palette, piede: piedeDi(e.scatola.base, e.scatola.vpt) };
  }
  const m = compileMjx(fs.readFileSync(v.file, 'utf8'));
  const r = runMjx(m, seme, { deadline: 8_000, limits: FORM_LIMITS });
  return { g: r.grid, palette: m.program.palette, piede: 0 };
}

/** Lines of the program as nodes: trimmed, with spaces collapsed; comments and colours out (a recolouring is not a copy of the form). */
const righe = (xml: string) =>
  xml
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n/)
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter((l) => l.startsWith('<') && !l.startsWith('</') && !/^<color\b/.test(l));
const lineeScheletro = scheletro ? new Set(righe(fs.readFileSync(scheletro, 'utf8'))) : undefined;

const SFONDO: [number, number, number] = [112, 150, 84];
const gruppi: Gruppo[] = [];
const foto: Picture[] = [];
const extra: Record<string, { errori: string[]; ms: number; copiate?: number; tenute?: number; righe?: number }> = {};
for (const v of voci) {
  const forme: Forma[] = [];
  const pics: Picture[] = [];
  const errori: string[] = [];
  const t0 = Date.now();
  for (let s = 1; s <= semi; s++) {
    try {
      const { g, palette, piede } = corsa(v, s);
      forme.push(formaDi(v.nome, s, g, palette, piede));
      if (conFoto) pics.push(render(g, palette, 0, DEFAULT_RENDER));
    } catch (e) {
      if (!(e instanceof Mj3Error)) throw e;
      errori.push(`seme ${s}: ${e.message}`);
    }
  }
  const info: (typeof extra)[string] = { errori, ms: Date.now() - t0 };
  if (lineeScheletro) {
    const r = righe(fs.readFileSync(v.file, 'utf8'));
    const mie = new Set(r);
    info.righe = r.length;
    info.copiate = r.length ? r.filter((l) => lineeScheletro.has(l)).length / r.length : 0;
    info.tenute = [...lineeScheletro].filter((l) => mie.has(l)).length / lineeScheletro.size;
  }
  extra[v.nome] = info;
  if (forme.length) gruppi.push({ nome: v.nome, concetto: v.concetto, forme });
  if (pics.length) foto.push(sheet(pics, 1, 4, SFONDO));
  console.log(`${v.nome}: ${forme.length}/${semi} semi, ${info.ms} ms${errori.length ? ` · ${errori[0]}` : ''}`);
}

const c = confronta(gruppi);
const n2 = (x: number | undefined) => (x === undefined || Number.isNaN(x) ? '—' : !Number.isFinite(x) ? '∞' : x.toFixed(2).replace('.', ','));
const pct = (x: number | undefined) => (x === undefined ? '—' : `${Math.round(x * 100)} %`);
const desc = new Map(gruppi.map((g) => [g.nome, descrittori(g)]));
const md = [
  `# Varianza tra concetti e tra semi: ${nome}`,
  '',
  `${gruppi.length} programmi, ${semi} semi${taglia ? `, taglia ${taglia}` : ', ognuno alla taglia del suo bersaglio (o nella sua scatola)'}; le misure sono in \`lab/banco/concetti.ts\`.`,
  '',
  '## In breve',
  '',
  `| | ${COMPONENTI.join(' | ')} |`,
  `|---|${COMPONENTI.map(() => '---').join('|')}|`,
  `| tra i semi di un programma (mediana) | ${COMPONENTI.map((k) => n2(c.dentro[k])).join(' | ')} |`,
  `| tra concetti diversi (mediana) | ${COMPONENTI.map((k) => n2(c.fra[k])).join(' | ')} |`,
  `| separazione (fra / dentro) | ${COMPONENTI.map((k) => n2(c.separazione[k])).join(' | ')} |`,
  '',
  `Vicini: ${pct(c.vicini)} delle esecuzioni hanno come esecuzione più vicina un altro seme dello stesso programma.`,
  '',
  '## Per programma',
  '',
  `| programma | semi | ${COMPONENTI.join(' | ')} | voxel | colore | copertura | pieno | alt. media | alt. max | cortile | quote | torri${lineeScheletro ? ' | righe | dallo scheletro | scheletro tenuto' : ''} |`,
  `|---|---|${COMPONENTI.map(() => '---').join('|')}|---|---|---|---|---|---|---|---|---${lineeScheletro ? '|---|---|---' : ''}|`,
  ...c.traSemi.map((t) => {
    const d = desc.get(t.nome)!;
    const x = extra[t.nome];
    const g = gruppi.find((q) => q.nome === t.nome)!;
    return `| ${t.nome} | ${g.forme.length} | ${COMPONENTI.map((k) => n2(t.quote[k])).join(' | ')} | ${n2(t.voxel)} | ${n2(t.colore)} | ${n2(d.copertura)} | ${n2(d.pieno)} | ${n2(d.altezzaMedia)} | ${n2(d.altezzaMassima)} | ${n2(d.cortile)} | ${d.quote.toFixed(1).replace('.', ',')} | ${d.torri.toFixed(1).replace('.', ',')}${lineeScheletro ? ` | ${x.righe} | ${pct(x.copiate)} | ${pct(x.tenute)}` : ''} |`;
  }),
  '',
  '## Concetto per concetto (distanza mediana; sulla diagonale, tra i semi)',
  '',
  `| | ${c.matrice.concetti.join(' | ')} |`,
  `|---|${c.matrice.concetti.map(() => '---').join('|')}|`,
  ...c.matrice.concetti.map((a, i) => `| ${a} | ${c.matrice.d[i].map((v) => n2(v)).join(' | ')} |`),
  '',
  ...(Object.entries(extra).some(([, x]) => x.errori.length) ? ['## Rifiutati', '', ...Object.entries(extra).filter(([, x]) => x.errori.length).map(([k, x]) => `- ${k}: ${x.errori.join('; ')}`), ''] : []),
].join('\n');

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, `${nome}.md`), `${md}\n`);
fs.writeFileSync(
  path.join(out, `${nome}.json`),
  `${JSON.stringify({ nome, semi, taglia, ...c, descrittori: Object.fromEntries(desc), extra }, (_, v) => (typeof v === 'number' && !Number.isFinite(v) ? null : v), 1)}\n`,
);
if (foto.length) {
  const w = Math.max(...foto.map((p) => p.w));
  const h = foto.reduce((s, p) => s + p.h, 0);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...SFONDO, 255], i * 4);
  let oy = 0;
  for (const p of foto) {
    for (let y = 0; y < p.h; y++) data.set(p.data.subarray(y * p.w * 4, (y + 1) * p.w * 4), (oy + y) * w * 4);
    oy += p.h;
  }
  fs.writeFileSync(path.join(out, `${nome}.png`), png({ w, h, data }));
}
console.log(`dentro ${n2(c.dentro.distanza)} · fra ${n2(c.fra.distanza)} · separazione ${n2(c.separazione.distanza)} · vicini ${pct(c.vicini)} → ${path.join(out, `${nome}.md`)}`);
