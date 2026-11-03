// Variance and scale on the bench (T180): the same program with more seeds and more sizes. Today's bench tries one seed in one box, so a
// program of fixed boxes passes: here it is seen for what it is. Only shape counts: a seed that repaints the same building has changed nothing.

import { stepOf } from '../../src/kernel/forms';
import { classOf, sizeOf, sizeRank, TAGLIE, type Taglia } from '../../src/mj/classes';
import { Mj3Error, type Grid3, type PaletteEntry } from '../../src/mj/engine';
import { colorTable, footprint } from '../../src/mj/mesh';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import { fotoPianta } from './foto';
import { esegui, giudica, misura, scatolaDi, type Bersaglio, type Eseguito, type Misure } from './misure';

/** At least this many seeds: with fewer a median of pairs says little. */
export const SEMI = 5;

/** The threshold proposed for variance (`lab/banco/README.md`): medians of the pairs of seeds, shares from 0 to 1. */
export const SOGLIA_VARIANZA = {
  /** Under this share of different shape a program is static, whatever its colours do. */
  statico: 0.01,
  /** Shape: voxels full in one seed and empty in the other, over those full in either. */
  voxel: 0.2,
  /** Plan: columns occupied above the feet in only one seed, over those occupied in either. */
  pianta: 0.15,
  /** Outer perimeter farther than half a tile from the other seed's. */
  perimetro: 0.15,
  /** Covered floor a body reaches in only one seed, over that reached in either. */
  interno: 0.35,
  /** Different lists of storeys or of rooms per storey, among the seeds. */
  firme: 2,
  /** Seeds that are another building from all the others. */
  architetture: 3,
} as const;

/** How two seeds of a program differ. */
export interface Confronto {
  voxel: number;
  /** Of the voxels full in both, those with another letter: colour, which does not count as variance. */
  colore: number;
  pianta: number;
  perimetro: number;
  interno: number;
}

const QUOTE = ['voxel', 'colore', 'pianta', 'perimetro', 'interno'] as const;

/** What of a seed's run is compared with the others. */
interface Impronta {
  X: number;
  Y: number;
  pieni: Uint8Array;
  lettere: string[];
  cells: Uint8Array;
  pianta: Uint8Array;
  /** Occupied columns that outside air touches: a courtyard's walls are not on it. */
  bordo: Uint8Array;
  /** Covered floor a body reaches: `(x, y, z)` as a number. */
  interno: Set<number>;
  firmaPiani: string;
  firmaStanze: string;
}

function improntaDi(e: Eseguito, m: Misure, palette: Record<string, PaletteEntry>): Impronta {
  const g = e.grid;
  const { vpt, base } = e.scatola;
  const colors = colorTable(g.alphabet, palette);
  const pieni = new Uint8Array(g.cells.length);
  for (let i = 0; i < pieni.length; i++) if (colors[g.cells[i]]) pieni[i] = 1;
  const pianta = footprint(g, palette, base + stepOf(vpt) + 1, g.Z);
  const XY = g.X * g.Y;
  const interno = new Set<number>();
  for (const c of m.celle) {
    const i = c.x + c.y * g.X;
    for (let z = c.z + 1; z < g.Z; z++)
      if (pieni[i + z * XY]) {
        interno.add((i + 1) * 4096 + c.z);
        break;
      }
  }
  return {
    X: g.X,
    Y: g.Y,
    pieni,
    lettere: g.alphabet,
    cells: g.cells,
    pianta,
    bordo: bordoDi(pianta, g.X, g.Y),
    interno,
    firmaPiani: m.piani.map((p) => p.quota.toFixed(1)).join(' '),
    firmaStanze: m.piani.map((p) => p.stanze).join(' '),
  };
}

/** The occupied cells next to the air that comes from out of the box. */
function bordoDi(mask: Uint8Array, X: number, Y: number): Uint8Array {
  const fuori = new Uint8Array(X * Y);
  const stack: number[] = [];
  const entra = (i: number) => {
    if (!mask[i] && !fuori[i]) {
      fuori[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < X; x++) entra(x), entra(x + (Y - 1) * X);
  for (let y = 0; y < Y; y++) entra(y * X), entra(X - 1 + y * X);
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % X;
    if (x > 0) entra(i - 1);
    if (x < X - 1) entra(i + 1);
    if (i >= X) entra(i - X);
    if (i < X * (Y - 1)) entra(i + X);
  }
  const out = new Uint8Array(X * Y);
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      const i = x + y * X;
      if (mask[i] && (x === 0 || y === 0 || x === X - 1 || y === Y - 1 || fuori[i - 1] || fuori[i + 1] || fuori[i - X] || fuori[i + X])) out[i] = 1;
    }
  return out;
}

/** Share of `a` farther than `r` cells (on a square) from `b`. */
function lontani(a: Uint8Array, b: Uint8Array, X: number, Y: number, r: number): { fuori: number; tot: number } {
  // A summed-area table: how much of `b` there is in any square.
  const sum = new Int32Array((X + 1) * (Y + 1));
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) sum[x + 1 + (y + 1) * (X + 1)] = b[x + y * X] + sum[x + (y + 1) * (X + 1)] + sum[x + 1 + y * (X + 1)] - sum[x + y * (X + 1)];
  let fuori = 0, tot = 0;
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      if (!a[x + y * X]) continue;
      tot++;
      const x0 = Math.max(0, x - r), x1 = Math.min(X, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(Y, y + r + 1);
      if (!(sum[x1 + y1 * (X + 1)] - sum[x0 + y1 * (X + 1)] - sum[x1 + y0 * (X + 1)] + sum[x0 + y0 * (X + 1)])) fuori++;
    }
  return { fuori, tot };
}

/** Full in one, empty in the other, over full in either. */
function diversi(a: Uint8Array, b: Uint8Array): number {
  let xor = 0, or = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] || b[i]) or++;
    if (a[i] !== b[i]) xor++;
  }
  return or ? xor / or : 0;
}

function confronta(a: Impronta, b: Impronta, vpt: number): Confronto {
  let entrambi = 0, altraLettera = 0;
  for (let i = 0; i < a.pieni.length; i++)
    if (a.pieni[i] && b.pieni[i]) {
      entrambi++;
      if (a.lettere[a.cells[i]] !== b.lettere[b.cells[i]]) altraLettera++;
    }
  const r = Math.round(vpt / 2);
  const ab = lontani(a.bordo, b.bordo, a.X, a.Y, r), ba = lontani(b.bordo, a.bordo, a.X, a.Y, r);
  const tutti = new Set([...a.interno, ...b.interno]).size;
  let comuni = 0;
  for (const k of a.interno) if (b.interno.has(k)) comuni++;
  return {
    voxel: diversi(a.pieni, b.pieni),
    colore: entrambi ? altraLettera / entrambi : 0,
    pianta: diversi(a.pianta, b.pianta),
    perimetro: ab.tot + ba.tot ? (ab.fuori + ba.fuori) / (ab.tot + ba.tot) : 0,
    interno: tutti ? 1 - comuni / tutti : 0,
  };
}

const mediana = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** Another building, not the same one retouched: much of its shape changes, in its plan or in the floor a body walks on. */
const altraArchitettura = (c: Confronto) => {
  const S = SOGLIA_VARIANZA;
  return c.voxel >= S.voxel && (c.pianta >= S.pianta || c.interno >= S.interno);
};

export interface Varianza extends Confronto {
  semi: number;
  /** Different lists of storeys' heights among the seeds. */
  firmePiani: number;
  /** Different lists of rooms per storey among the seeds. */
  firmeStanze: number;
  /** Seeds that are another building from all those counted before them. */
  architetture: number;
  /** Nothing of the shape changes: a fixed building, even if its colours or a few voxels do. */
  statico: boolean;
}

/** The variance of the runs of one program in one box. */
export function varianzaDi(impronte: Impronta[], vpt: number): Varianza {
  const coppie: Confronto[] = [];
  const diverse = new Map<string, boolean>();
  impronte.forEach((a, i) =>
    impronte.slice(i + 1).forEach((b, k) => {
      const c = confronta(a, b, vpt);
      coppie.push(c);
      diverse.set(`${i}.${i + 1 + k}`, altraArchitettura(c));
    }),
  );
  const kept: number[] = [];
  impronte.forEach((_, i) => {
    if (kept.every((k) => diverse.get(`${k}.${i}`))) kept.push(i);
  });
  const quote = Object.fromEntries(QUOTE.map((q) => [q, mediana(coppie.map((c) => c[q]))])) as unknown as Confronto;
  return {
    ...quote,
    semi: impronte.length,
    firmePiani: new Set(impronte.map((i) => i.firmaPiani)).size,
    firmeStanze: new Set(impronte.map((i) => i.firmaStanze)).size,
    architetture: kept.length,
    statico: quote.voxel < SOGLIA_VARIANZA.statico,
  };
}

const n2 = (v: number) => (Math.round(v * 100) / 100).toString();

/** What the threshold says of a variance, one defect per measure. `perimetro` only for large buildings: a hut may keep its outline. */
export function giudicaVarianza(v: Varianza, b: Pick<Bersaglio, 'classe'>): string[] {
  const S = SOGLIA_VARIANZA;
  const out: string[] = [];
  if (v.statico) out.push(`statico: voxel ${n2(v.voxel)} (serve ≥ ${S.voxel}; colore ${n2(v.colore)}, che non conta)`);
  else if (v.voxel < S.voxel) out.push(`voxel: ${n2(v.voxel)} (serve ≥ ${S.voxel})`);
  if (v.pianta < S.pianta) out.push(`pianta: ${n2(v.pianta)} (serve ≥ ${S.pianta})`);
  if (b.classe === 'grande' && v.perimetro < S.perimetro) out.push(`perimetro: ${n2(v.perimetro)} (serve ≥ ${S.perimetro})`);
  if (v.interno < S.interno) out.push(`interno: ${n2(v.interno)} (serve ≥ ${S.interno})`);
  if (Math.max(v.firmePiani, v.firmeStanze) < S.firme) out.push(`piani e stanze: ${v.firmePiani} liste di piani, ${v.firmeStanze} di stanze (serve almeno una con ≥ ${S.firme})`);
  if (v.architetture < S.architetture) out.push(`architetture: ${v.architetture} su ${v.semi} semi (serve ≥ ${S.architetture})`);
  return out;
}

/** The sizes a program is tried at if nobody says: its own and the next, the one below for the largest. */
export function taglieDiProva(b: Pick<Bersaglio, 'classe' | 'taglia'>): Taglia[] {
  const own = sizeOf(b.taglia)?.id ?? classOf(b.classe)!.taglia;
  const next = TAGLIE[sizeRank(own) + 1]?.id ?? TAGLIE[sizeRank(own) - 1]!.id;
  return [own, next];
}

export interface ProvaSeme {
  seme: number;
  /** What the game refuses, or what the measures do not take: empty if it passes. */
  difetti: string[];
  ms: number;
}

export interface ProvaTaglia {
  taglia: Taglia;
  box: [number, number, number];
  vpt: number;
  gradino: number;
  semi: ProvaSeme[];
  /** Every seed passes today's measures. */
  regge: boolean;
  varianza?: Varianza;
  difettiVarianza: string[];
}

export interface Prova {
  taglie: ProvaTaglia[];
  /** Every measure at every seed and every size. */
  regge: boolean;
  /** Static at every size where it runs: one the game refuses is not static, it is not there. */
  statico: boolean;
  /** Varies enough at every size. */
  varia: boolean;
  passa: boolean;
  ms: number;
  /** What the contact sheet is made of. */
  esecuzioni: Array<{ taglia: Taglia; seme: number; e: Eseguito; m: Misure }>;
}

export interface OpzioniProva {
  semi?: number;
  taglie?: Taglia[];
}

/** The program at every size and every seed: all today's measures, and how much the seeds differ. Nothing here throws: what the game refuses is a defect. */
export function prova(xml: string, b: Bersaglio, o: OpzioniProva = {}): Prova {
  const t0 = Date.now();
  const semi = Array.from({ length: o.semi ?? SEMI }, (_, i) => i + 1);
  const esecuzioni: Prova['esecuzioni'] = [];
  const taglie = (o.taglie ?? taglieDiProva(b)).map((taglia): ProvaTaglia => {
    const qui: Bersaglio = { ...b, taglia };
    // The library's own idea of the box, its cellar included.
    const voluta = scatolaDi(qui).box;
    const impronte: Impronta[] = [];
    let box = voluta as ProvaTaglia['box'], vpt = 0, gradino = 0;
    const provati = semi.map((seme): ProvaSeme => {
      const t = Date.now();
      try {
        const e = esegui(xml, qui, seme);
        const m = misura(e, qui);
        impronte.push(improntaDi(e, m, e.model.program.palette));
        esecuzioni.push({ taglia, seme, e, m });
        box = e.scatola.box as ProvaTaglia['box'];
        ({ vpt, gradino } = e.scatola);
        const difetti = giudica(m, e.scatola).difetti;
        // A program with a `size` of its own (`map`) stays that large whatever the size says.
        if (box.join() !== voluta.join()) difetti.push(`scatola: ${box.join(' × ')} (la taglia ${taglia} dà ${voluta.join(' × ')})`);
        return { seme, difetti, ms: Date.now() - t };
      } catch (err) {
        if (!(err instanceof Mj3Error)) throw err;
        return { seme, difetti: [`il gioco lo rifiuta: ${err.message}`], ms: Date.now() - t };
      }
    });
    const varianza = impronte.length >= 2 ? varianzaDi(impronte, vpt) : undefined;
    return {
      taglia,
      box,
      vpt,
      gradino,
      semi: provati,
      regge: provati.every((s) => !s.difetti.length),
      ...(varianza ? { varianza } : {}),
      difettiVarianza: varianza ? giudicaVarianza(varianza, b) : ['non gira con abbastanza semi'],
    };
  });
  const regge = taglie.every((t) => t.regge);
  const varia = taglie.every((t) => !t.difettiVarianza.length);
  return { taglie, regge, statico: taglie.every((t) => t.varianza?.statico === true), varia, passa: regge && varia, ms: Date.now() - t0, esecuzioni };
}

const SFONDO: [number, number, number] = [112, 150, 84];

/** Pictures one under the other, centred on nothing: rows of a sheet. */
function pila(righe: Picture[]): Picture {
  const w = Math.max(...righe.map((r) => r.w));
  const h = righe.reduce((s, r) => s + r.h, 0);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...SFONDO, 255], i * 4);
  let oy = 0;
  for (const r of righe) {
    for (let y = 0; y < r.h; y++) data.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), (oy + y) * w * 4);
    oy += r.h;
  }
  return { w, h, data };
}

/**
 * The contact sheet: one picture to judge the seeds at a low cost. A row per size with the model of each seed in 3/4 from the front, door open if
 * it has one; under the first size the plan of each seed's ground floor, as `pianta.png` draws it.
 */
export function fotoSemi(p: Prova): Picture | undefined {
  const righe: Picture[] = [];
  p.taglie.forEach((t, n) => {
    const qui = p.esecuzioni.filter((x) => x.taglia === t.taglia);
    if (!qui.length) return;
    righe.push(sheet(qui.map((x) => render(x.e.grid as Grid3, x.e.model.program.palette, 0, DEFAULT_RENDER)), 1, 4, SFONDO));
    if (n) return;
    const piante = qui.flatMap((x) => fotoPianta(x.e, { ...x.m, piani: x.m.piani.slice(0, 1) }, 1) ?? []);
    righe.push(sheet(piante, 1, 4, SFONDO));
  });
  return righe.length ? pila(righe) : undefined;
}
