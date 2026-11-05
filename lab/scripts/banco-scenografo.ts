// The Scenografo's bench (T259): two ways of furnishing six buildings, five seeds each, with the bench's measures before and after.
//
//   npx vite-node lab/scripts/banco-scenografo.ts -- [--semi 5] [--solo palazzina,locanda] [--out lab/banco/scenografo]
//
// → <out>/riepilogo.md, <out>/riepilogo.json, <out>/<edificio>.png (a row before, one with the program, one with the models; the
// ground floor cut at a body's height, seen from the front in 3/4). No model is called.

import fs from 'node:fs';
import path from 'node:path';
import { type Grid3 } from '../../src/mj/engine';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import { bersaglio } from '../banco/bersagli';
import { giudica, type Bersaglio, type Eseguito } from '../banco/misure';
import { arredaDati, arredaProgramma, arredaValidato, catalogo, CATALOGO, programmaArredo, scena, varianzaInterna, type Arredato, type Confronto, type Scena } from '../banco/scenografo/scenografo';
import { STRUTTURE } from '../banco/suolo/strutture';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const semi = Number(opt('semi') ?? 5);
const solo = opt('solo')?.split(',');
const out = path.resolve(opt('out') ?? 'lab/banco/scenografo');

const EDIFICI: Array<{ nome: string; file: string; b: Bersaglio }> = [
  { nome: 'palazzina', file: 'lab/banco/riferimento/palazzina.xml', b: bersaglio('moderna')! },
  { nome: 'forte', file: 'lab/banco/riferimento/forte.xml', b: bersaglio('rocca')! },
  { nome: 'tempio', file: 'lab/banco/riferimento/tempio.xml', b: bersaglio('tempio')! },
  { nome: 'locanda', file: 'lab/banco/suolo/locanda/1/corretta/modello.xml', b: bersaglio('locanda')! },
  { nome: 'officina', file: 'lab/banco/riferimento/cantiere.xml', b: bersaglio('steampunk')! },
  { nome: 'laboratorio', file: 'lab/banco/suolo/strutture/laboratorio.xml', b: STRUTTURE.find((s) => s.id === 'laboratorio')! },
];

const SFONDO: [number, number, number] = [112, 150, 84];

/** The ground floor cut a little above a body's head, seen from the front: what the furniture looks like. */
function taglio(e: Eseguito, z0: number): Picture {
  const g = e.grid;
  const top = Math.min(g.Z, z0 + Math.round(0.9 * e.scatola.vpt));
  const cut: Grid3 = { ...g, Z: top, cells: g.cells.slice(0, g.X * g.Y * top), log: [], epoch: 0 };
  return render(cut, e.model.program.palette, 0, DEFAULT_RENDER);
}

interface Riga {
  edificio: string;
  via: 'programma' | 'dati';
  seme: number;
  ms: number;
  confronto: Confronto;
  regge: boolean;
  /** Measures of `giudica` the building passed before and fails with the interior. */
  giudica: string[];
  /** Runs the kernel needed (1 = the first holds; 5 = none of the 4 held). */
  tentativi: number;
  /** One run, the last. */
  msUno: number;
  varianza: number;
  voxel: number;
}

const tokens = (s: string) => Math.round(s.length / 4);
const righe: Riga[] = [];
const fs_ = fs;
fs_.mkdirSync(out, { recursive: true });
const cataloghi = new Map<number, ReturnType<typeof catalogo>>();

for (const ed of EDIFICI) {
  if (solo && !solo.includes(ed.nome)) continue;
  const xml = fs.readFileSync(ed.file, 'utf8');
  const foto: Picture[][] = [[], [], []];
  for (let seme = 1; seme <= semi; seme++) {
    const s: Scena = scena(xml, ed.b, seme);
    const vpt = s.e.scatola.vpt;
    if (!cataloghi.has(vpt)) cataloghi.set(vpt, catalogo(vpt));
    const mobili = cataloghi.get(vpt)!;
    const ground = s.m.piani.find((p) => p.z >= s.e.scatola.base - 1)?.z ?? s.e.scatola.base;
    foto[0].push(taglio(s.e, ground));
    for (const via of ['programma', 'dati'] as const) {
      const fa = (k: number): Arredato => (via === 'programma' ? arredaProgramma(s, k) : arredaDati(s, k, mobili));
      const v1 = arredaValidato(s, fa, 1);
      const v2 = arredaValidato(s, fa, 2);
      const a = v1.a, c = v1.c;
      const gPrima = giudica(s.m, s.e.scatola).difetti.map((d) => d.split(':')[0]);
      const gDopo = giudica(a.m, a.e.scatola).difetti.map((d) => d.split(':')[0]);
      righe.push({ edificio: ed.nome, via, seme, giudica: gDopo.filter((d) => !gPrima.includes(d)), ms: Math.round(v1.ms), msUno: Math.round(a.ms / 1), confronto: c, regge: v1.tentativi <= 4, tentativi: v1.tentativi, varianza: varianzaInterna(a.voxel, v2.a.voxel), voxel: a.voxel.size });
      foto[via === 'programma' ? 1 : 2].push(taglio(a.e, ground));
      const last = righe[righe.length - 1];
      console.log(`${ed.nome} ${seme} ${via}: ${last.ms} ms · pezzi ${c.pezzi} · piani ${c.piani.join('→')} · stanze ${c.stanze.join('→')} · murato ${c.murato.toFixed(2)} · porta ${c.porta} · cantina ${c.cantina.map((v) => v.toFixed(1)).join('→')} · raggiunte ${(c.raggiunte * 100).toFixed(1)} % · stanze percorribili ${c.stanzePercorribili.join('/')} · tentativi ${last.tentativi} · varianza ${last.varianza.toFixed(2)} · ${last.regge ? 'regge' : 'NO'}`);
    }
  }
  fs.writeFileSync(path.join(out, `${ed.nome}.png`), png(pila(foto.map((r) => sheet(r, 2, 4, SFONDO)))));
}

/** Rows one under the other. */
function pila(rs: Picture[]): Picture {
  const gap = 6;
  const w = Math.max(...rs.map((r) => r.w));
  const h = rs.reduce((s, r) => s + r.h, 0) + gap * (rs.length - 1);
  const data = new Uint8ClampedArray(w * h * 4).fill(240);
  let y0 = 0;
  for (const r of rs) {
    for (let y = 0; y < r.h; y++) data.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), ((y0 + y) * w) * 4);
    y0 += r.h + gap;
  }
  return { w, h, data };
}

// The tables.
const n2 = (v: number) => v.toFixed(2).replace('.', ',');
const media = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / Math.max(1, xs.length);
const tok1 = tokens(JSON.stringify(programmaArredo(11)));
const tok2 = tokens(JSON.stringify(CATALOGO));
const tabella = ['| edificio | via | regge al primo | regge entro 4 | `giudica` perso | tempo di un arredo (max) | tempo con i tentativi | pezzi | piani | stanze percorribili | stanze di `misure` | murato max | raggiunte min | varianza interna |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
for (const ed of EDIFICI)
  for (const via of ['programma', 'dati'] as const) {
    const rs = righe.filter((r) => r.edificio === ed.nome && r.via === via);
    if (!rs.length) continue;
    const ok = rs.filter((r) => r.regge);
    tabella.push(
      `| ${ed.nome} | ${via} | ${rs.filter((r) => r.tentativi === 1).length}/${rs.length} | ${ok.length}/${rs.length} | ${[...new Set(rs.flatMap((r) => r.giudica))].join(', ') || '—'} | ${Math.round(media(rs.map((r) => r.msUno)))} ms (${Math.max(...rs.map((r) => r.msUno))}) | ${Math.round(media(rs.map((r) => r.ms)))} ms | ${n2(media(rs.map((r) => r.confronto.pezzi)))} | ${rs.every((r) => r.confronto.piani[0] === r.confronto.piani[1]) ? 'uguali' : 'cambiano'} | ${rs.map((r) => r.confronto.stanzePercorribili.join('/')).join(', ')} | ${rs.map((r) => r.confronto.stanze.join('→')).join(', ')} | ${n2(Math.max(...rs.map((r) => r.confronto.murato)))} | ${(Math.min(...rs.map((r) => r.confronto.raggiunte)) * 100).toFixed(1)} % | ${n2(media(rs.map((r) => r.varianza)))} |`,
    );
  }
const md = [
  `# Lo Scenografo sul banco: ${new Set(righe.map((r) => r.edificio)).size} edifici, ${semi} semi, due vie`,
  '',
  `Token di ciò che l'agente scrive: programma ≈ ${tok1}, dati (catalogo) ≈ ${tok2} (caratteri / 4). Il tempo è quello dell'arredo, senza le misure.`,
  '',
  ...tabella,
  '',
].join('\n');
fs.writeFileSync(path.join(out, 'riepilogo.md'), md);
fs.writeFileSync(path.join(out, 'riepilogo.json'), JSON.stringify({ tokens: { programma: tok1, dati: tok2 }, righe }, null, 1));
console.log(md);
