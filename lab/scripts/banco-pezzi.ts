// The bench of the grid in pieces (T339, lab/banco/pezzi/README.md): the large farm and the large fort, at several seeds, run on the
// whole grid and in pieces in the two ways (a: every piece reads the grid as the plan left it; b: what the pieces before it wrote) with
// the margin growing or frozen; the checks on the borders (`bordi.ts`) against the whole grid, the time, the slowest piece; the photos.
//
//   npx vite-node lab/scripts/banco-pezzi.ts -- [--semi 4] [--solo fattoria,forte] [--foto] [--json lab/banco/pezzi/misure/banco.json]

import fs from 'node:fs';
import path from 'node:path';
import { run, type Grid3, type GridLimits, type RunResult } from '../../src/mj/engine';
import { compileMjx, type MjxModel } from '../../src/mj/model';
import { DEFAULT_RENDER, render, sheet } from '../../src/mj/photo';
import { FORM_LIMITS, FORM_PIECES } from '../../src/mj/run';
import { png } from './png';
import { pezziDi, riquadro, salti, senzaPezzi, strutture, type Salti } from '../banco/pezzi/bordi';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const DIR = path.resolve('lab/banco/pezzi');

interface Banco {
  id: string;
  file: string;
  box: [number, number, number];
  /** The size of its pieces, as its program says. */
  piece: [number, number];
  /** The letters the detail builds without chance: they must be where the whole grid has them. */
  strutture: string;
  /** Letter sets that must stay in as many pieces as in the whole grid, and at which height. */
  continui: Array<{ nome: string; lettere: string; z: number }>;
}

export const BANCHI: Banco[] = [
  {
    id: 'fattoria',
    file: 'lab/banco/pezzi/fattoria.xml',
    box: [500, 500, 50],
    piece: [130, 130],
    strutture: 'RLnQ',
    continui: [
      { nome: 'sentieri', lettere: 'rs', z: 0 },
      { nome: 'traverse dei recinti', lettere: 'L', z: 2 },
    ],
  },
  {
    id: 'forte',
    file: 'lab/banco/pezzi/forte.xml',
    box: [384, 384, 96],
    piece: [128, 128],
    strutture: 'Q',
    continui: [{ nome: 'selciato', lettere: 'AV', z: 0 }],
  },
];

/** The two ways and the two margins: what `<pieces>` says (the program's own is way a, the margin growing). */
export const VIE: Array<{ id: string; nome: string; attrs: string }> = [
  { id: 'a', nome: 'a: ogni pezzo legge il piano, il margine cresce (la via scelta)', attrs: 'halo="before" edge="grow"' },
  { id: 'a-fermo', nome: 'a, col margine fermo', attrs: 'halo="before" edge="frozen"' },
  { id: 'b', nome: 'b: ogni pezzo legge ciò che hanno scritto i pezzi prima, il margine cresce', attrs: 'halo="written" edge="grow"' },
  { id: 'b-fermo', nome: 'b, col margine fermo', attrs: 'halo="written" edge="frozen"' },
];

const LIMITS: GridLimits = { ...FORM_LIMITS, pieces: FORM_PIECES };
/** The whole grid is beyond `FORM_LIMITS` (the game refuses it today): for the comparison it runs with limits as large as it needs. */
const WHOLE: GridLimits = { side: 4096, cells: 256_000_000 };

/** The program with its `<pieces>` told one way (its piece and margin stay). */
export function inVia(xml: string, attrs: string): string {
  return xml.replace(/<pieces\b([^>]*)>/, (_, a: string) => `<pieces${a.replace(/\s(halo|edge)="[^"]*"/g, '')} ${attrs}>`);
}

export interface Riga {
  banco: string;
  seme: number;
  via: string;
  ms: number;
  finito: boolean;
  pezzi?: number;
  pezzoLento?: number;
  strutture: number;
  salti: Salti;
  continui: Record<string, [number, number]>;
}

function esegui(xml: string, b: Banco, seme: number, limits = LIMITS): { m: MjxModel; r: RunResult; ms: number } {
  const m = compileMjx(xml, { size: b.box });
  const t0 = performance.now();
  const r = run(m.program, seme, 50_000_000, limits, { deadline: 120_000 });
  return { m, r, ms: Math.round(performance.now() - t0) };
}

/** Where a building or a tower stands across a line between two pieces: the corner of a box around it, for the photograph. */
function doveUnBordo(g: Grid3, palette: MjxModel['program']['palette'], piece: [number, number], lato: number): [number, number] {
  const XY = g.X * g.Y;
  let best: [number, number] = [Math.max(0, piece[0] - (lato >> 1)), Math.max(0, piece[1] - (lato >> 1))];
  let most = -1;
  for (let s = piece[0]; s < g.X; s += piece[0])
    for (let y = 0; y < g.Y; y += 4) {
      let tall = 0;
      for (let z = 8; z < g.Z; z++) {
        const c = g.alphabet[g.cells[s + y * g.X + z * XY]];
        if (c !== '.' && palette[c]?.color && !palette[c]?.hidden) tall++;
      }
      if (tall > most) {
        most = tall;
        best = [Math.max(0, Math.min(g.X - lato, s - (lato >> 1))), Math.max(0, Math.min(g.Y - lato, y - (lato >> 1)))];
      }
    }
  return best;
}

const semi = Number(opt('semi') ?? 4);
const solo = opt('solo')?.split(',');
const foto = args.includes('--foto');
const righe: Riga[] = [];
for (const b of BANCHI) {
  if (solo && !solo.includes(b.id)) continue;
  const xml = fs.readFileSync(b.file, 'utf8');
  for (let seme = 1; seme <= semi; seme++) {
    const intera = esegui(senzaPezzi(xml), b, seme, WHOLE);
    const continui = (g: Grid3) => Object.fromEntries(b.continui.map((c) => [c.nome, pezziDi(g, c.lettere, c.z)]));
    const base = continui(intera.r.grid);
    righe.push({ banco: b.id, seme, via: 'intera', ms: intera.ms, finito: intera.r.finished, strutture: 0, salti: salti(intera.r.grid, intera.m.program.palette, b.piece), continui: Object.fromEntries(Object.entries(base).map(([k, v]) => [k, [v, v]])) });
    const fatte: Record<string, Grid3> = { intera: intera.r.grid };
    for (const v of VIE) {
      const e = esegui(inVia(xml, v.attrs), b, seme);
      fatte[v.id] = e.r.grid;
      const c = continui(e.r.grid);
      righe.push({
        banco: b.id,
        seme,
        via: v.id,
        ms: e.ms,
        finito: e.r.finished,
        pezzi: e.r.pieces?.length,
        pezzoLento: e.r.pieces ? Math.max(...e.r.pieces.map((p) => p.ms)) : undefined,
        strutture: strutture(e.r.grid, intera.r.grid, b.strutture),
        salti: salti(e.r.grid, e.m.program.palette, b.piece),
        continui: Object.fromEntries(Object.entries(c).map(([k, n]) => [k, [n, base[k]]])),
      });
    }
    for (const r of righe.filter((r) => r.banco === b.id && r.seme === seme))
      console.log(`${b.id} seme ${seme} ${r.via.padEnd(8)} ${String(r.ms).padStart(6)} ms ${r.finito ? '' : 'NON FINITO '}${r.pezzi ? `${r.pezzi} pezzi, il più lento ${r.pezzoLento} ms · ` : ''}strutture diverse ${r.strutture} · salti ai bordi ${r.salti.bordi}/${r.salti.coppie[0]}, dentro ${r.salti.dentro}/${r.salti.coppie[1]} · ${Object.entries(r.continui).map(([k, [n, w]]) => `${k} ${n}${n === w ? '' : ` (intera ${w})`}`).join(', ')}`);
    if (foto && seme === 1) {
      const pal = intera.m.program.palette;
      const way = fatte.a;
      // The model from four sides, in pieces (way a).
      fs.writeFileSync(path.join(DIR, `${b.id}.png`), png(sheet([0, 1, 2, 3].map((view) => render(way, pal, view, DEFAULT_RENDER)), 1, 6, [120, 150, 90])));
      // Where two pieces meet: the whole grid, way a, a with the margin frozen, way b.
      const lato = Math.min(b.piece[0], 140);
      const [x0, y0] = doveUnBordo(intera.r.grid, pal, b.piece, lato);
      const crop = (g: Grid3) => render(riquadro(g, x0, y0, lato, lato), pal, 0, { ...DEFAULT_RENDER, px: 3, top: 3, front: 3 });
      fs.writeFileSync(path.join(DIR, `${b.id}-bordo.png`), png(sheet(['intera', 'a', 'a-fermo', 'b'].map((k) => crop(fatte[k])), 1, 8, [120, 150, 90])));
      console.log(`foto: ${b.id}.png, ${b.id}-bordo.png (riquadro ${x0},${y0} di ${lato})`);
    }
  }
}
const out = opt('json');
if (out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(righe, null, 1));
}
