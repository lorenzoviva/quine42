// Variance between concepts and between seeds (T337). `varianza.ts` says how much the seeds of one program differ; this says also whether
// a fort is another building from a temple or the same one recoloured. Three distances that do not see colours, on grids brought to the
// same scale (a plan of LATO × LATO, heights as a share of the box), so that programs of different sizes, and the author's handmade models,
// can be compared:
//
//   impronta    the plan: 1 − IoU of the columns occupied above the feet
//   profilo     the skyline: the tallest column along x (seen from the front) and along y (from the side), and the height map, as
//               1 − Σmin/Σmax (a weighted Jaccard): a tower, a pitched roof, a stepped pyramid change it
//   pieni       full and empty by height: in each of FASCE bands, the solid voxels over the columns of the plan; a temple full of stone, a
//               house of walls and rooms, a fort of thick walls and courtyard give different vectors (also 1 − Σmin/Σmax)
//
// `distanza` is their mean. Over a set of programs, each run with some seeds: `traSemi` (the median of the pairs of seeds of one
// program), `traConcetti` (the median of the pairs of runs of two different programs), their ratio (`separazione`: about 1 means the
// concepts differ no more than the seeds of one of them, «all the same building») and `vicini`, the share of runs whose nearest other run
// is a seed of the same program.

import { stepOf } from '../../src/kernel/forms';
import type { Grid3, PaletteEntry } from '../../src/mj/engine';
import { colorTable } from '../../src/mj/mesh';

/** The side of the normalised plan. */
export const LATO = 48;
/** Height bands of the full/empty vector. */
export const FASCE = 8;

export interface Forma {
  programma: string;
  seme: number;
  /** LATO × LATO: at least half of the columns of the cell occupied above the feet. */
  pianta: Uint8Array;
  /** LATO × LATO: mean top of the occupied columns, as a share of the height above the feet (0 empty). */
  altezze: Float32Array;
  /** The tallest column for each x (from the front) and for each y (from the side), LATO each, as shares. */
  profiloX: Float32Array;
  profiloY: Float32Array;
  /** Solid voxels in each band over the columns of the plan times the band. */
  masse: Float32Array;
  /** Of the plan of the box, the share occupied. */
  copertura: number;
  /** Solid voxels over the volume under the tops of the occupied columns: 1 is a solid block, a house of thin walls is low. */
  pieno: number;
  altezzaMedia: number;
  altezzaMassima: number;
  /** Empty columns closed by the building (courtyards, cloisters) over the plan with them. */
  cortile: number;
  /** Heights of the top, each on at least 1.5 % of the plan (the bench's `sagoma`). */
  quote: number;
  /** Peaks: columns at least 15 % of the height above the median top whose region of such columns is apart from the others. */
  torri: number;
  /** For the letters: the solid voxels' letters, to see what changes in colour only. */
  lettere: Uint8Array;
  pieni: Uint8Array;
  alfabeto: string[];
  X: number;
  Y: number;
  Z: number;
}

/** What a run gives to the comparison. `piede` is the first layer that counts (above the ground floor's floor). */
export function formaDi(programma: string, seme: number, g: Grid3, palette: Record<string, PaletteEntry>, piede = 0): Forma {
  const { X, Y, Z } = g;
  const XY = X * Y;
  const colors = colorTable(g.alphabet, palette);
  const pieni = new Uint8Array(g.cells.length);
  for (let i = 0; i < pieni.length; i++) if (colors[g.cells[i]]) pieni[i] = 1;
  const H = Math.max(1, Z - piede);
  // The top of each column above the feet: one above the highest solid voxel.
  const cima = new Int32Array(XY);
  let solidi = 0;
  for (let z = piede; z < Z; z++)
    for (let i = 0; i < XY; i++)
      if (pieni[i + z * XY]) {
        cima[i] = z - piede + 1;
        solidi++;
      }
  const occupata = new Uint8Array(XY);
  let area = 0, involucro = 0;
  for (let i = 0; i < XY; i++)
    if (cima[i]) {
      occupata[i] = 1;
      area++;
      involucro += cima[i];
    }
  // Normalised plan and heights.
  const pianta = new Uint8Array(LATO * LATO);
  const altezze = new Float32Array(LATO * LATO);
  for (let v = 0; v < LATO; v++)
    for (let u = 0; u < LATO; u++) {
      const x0 = Math.floor((u * X) / LATO), x1 = Math.max(x0 + 1, Math.floor(((u + 1) * X) / LATO));
      const y0 = Math.floor((v * Y) / LATO), y1 = Math.max(y0 + 1, Math.floor(((v + 1) * Y) / LATO));
      let n = 0, occ = 0, somma = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          n++;
          const i = x + y * X;
          if (occupata[i]) {
            occ++;
            somma += cima[i];
          }
        }
      if (occ * 2 >= n && occ) {
        pianta[u + v * LATO] = 1;
        altezze[u + v * LATO] = somma / occ / H;
      }
    }
  const profiloX = new Float32Array(LATO), profiloY = new Float32Array(LATO);
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      const h = cima[x + y * X] / H;
      const u = Math.min(LATO - 1, Math.floor((x * LATO) / X)), v = Math.min(LATO - 1, Math.floor((y * LATO) / Y));
      if (h > profiloX[u]) profiloX[u] = h;
      if (h > profiloY[v]) profiloY[v] = h;
    }
  const masse = new Float32Array(FASCE);
  if (area)
    for (let k = 0; k < FASCE; k++) {
      const z0 = piede + Math.floor((k * H) / FASCE), z1 = piede + Math.floor(((k + 1) * H) / FASCE);
      let n = 0;
      for (let z = z0; z < z1; z++) for (let i = 0; i < XY; i++) if (pieni[i + z * XY] && occupata[i]) n++;
      masse[k] = n / (area * Math.max(1, z1 - z0));
    }
  const tops = [...cima].filter((c) => c > 0).sort((a, b) => a - b);
  const mediana = tops.length ? tops[tops.length >> 1] : 0;
  return {
    programma,
    seme,
    pianta,
    altezze,
    profiloX,
    profiloY,
    masse,
    copertura: area / XY,
    pieno: involucro ? solidi / involucro : 0,
    altezzaMedia: tops.length ? tops.reduce((s, c) => s + c, 0) / tops.length / H : 0,
    altezzaMassima: tops.length ? tops[tops.length - 1] / H : 0,
    cortile: cortileDi(occupata, X, Y, area),
    quote: quoteDi(cima, area),
    torri: torriDi(cima, X, Y, mediana + 0.15 * H),
    lettere: g.cells,
    pieni,
    alfabeto: g.alphabet,
    X,
    Y,
    Z,
  };
}

/** Empty columns that no empty path joins to the edge of the box. */
function cortileDi(occupata: Uint8Array, X: number, Y: number, area: number): number {
  const fuori = new Uint8Array(X * Y);
  const stack: number[] = [];
  const entra = (i: number) => {
    if (!occupata[i] && !fuori[i]) {
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
  let chiuse = 0;
  for (let i = 0; i < X * Y; i++) if (!occupata[i] && !fuori[i]) chiuse++;
  return area + chiuse ? chiuse / (area + chiuse) : 0;
}

function quoteDi(cima: Int32Array, area: number): number {
  const conta = new Map<number, number>();
  for (const c of cima) if (c) conta.set(c, (conta.get(c) ?? 0) + 1);
  let n = 0;
  for (const v of conta.values()) if (v >= 0.015 * area) n++;
  return n;
}

/** Separate regions (4-neighbours) of columns at least `soglia` tall, of at least 4 columns. */
function torriDi(cima: Int32Array, X: number, Y: number, soglia: number): number {
  const visto = new Uint8Array(X * Y);
  let n = 0;
  for (let i = 0; i < X * Y; i++) {
    if (visto[i] || cima[i] < soglia || !cima[i]) continue;
    let size = 0;
    const stack = [i];
    visto[i] = 1;
    while (stack.length) {
      const c = stack.pop()!;
      size++;
      const x = c % X;
      for (const d of [x > 0 ? c - 1 : -1, x < X - 1 ? c + 1 : -1, c - X, c + X]) {
        if (d < 0 || d >= X * Y || visto[d] || cima[d] < soglia) continue;
        visto[d] = 1;
        stack.push(d);
      }
    }
    if (size >= 4) n++;
  }
  return n;
}

/** 1 − Σmin/Σmax: 0 equal, 1 nothing in common. */
function jaccard(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let mn = 0, mx = 0;
  for (let i = 0; i < a.length; i++) {
    mn += Math.min(a[i], b[i]);
    mx += Math.max(a[i], b[i]);
  }
  return mx ? 1 - mn / mx : 0;
}

export interface Distanza {
  impronta: number;
  profilo: number;
  pieni: number;
  /** The mean of the three. */
  distanza: number;
}

export const COMPONENTI = ['impronta', 'profilo', 'pieni', 'distanza'] as const;

export function distanza(a: Forma, b: Forma): Distanza {
  const impronta = jaccard(a.pianta, b.pianta);
  const profilo = (jaccard(a.profiloX, b.profiloX) + jaccard(a.profiloY, b.profiloY) + jaccard(a.altezze, b.altezze)) / 3;
  const pieni = jaccard(a.masse, b.masse);
  return { impronta, profilo, pieni, distanza: (impronta + profilo + pieni) / 3 };
}

/** Of the voxels solid in both (same grid only), the share with another letter: colour, which is not form. */
export function colore(a: Forma, b: Forma): number | undefined {
  if (a.X !== b.X || a.Y !== b.Y || a.Z !== b.Z) return undefined;
  let entrambi = 0, altra = 0;
  for (let i = 0; i < a.pieni.length; i++)
    if (a.pieni[i] && b.pieni[i]) {
      entrambi++;
      if (a.alfabeto[a.lettere[i]] !== b.alfabeto[b.lettere[i]]) altra++;
    }
  return entrambi ? altra / entrambi : 0;
}

/** Voxels full in one and empty in the other over full in either (same grid only): `varianza.ts`'s `voxel`. */
export function voxel(a: Forma, b: Forma): number | undefined {
  if (a.X !== b.X || a.Y !== b.Y || a.Z !== b.Z) return undefined;
  let xor = 0, or = 0;
  for (let i = 0; i < a.pieni.length; i++) {
    if (a.pieni[i] || b.pieni[i]) or++;
    if (a.pieni[i] !== b.pieni[i]) xor++;
  }
  return or ? xor / or : 0;
}

export const mediana = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((p, q) => p - q);
  return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

export interface Gruppo {
  /** The program (a file). */
  nome: string;
  /** What it should be: programs of the same concept are not counted as «between concepts». */
  concetto: string;
  forme: Forma[];
}

export type Quote = Record<(typeof COMPONENTI)[number], number>;

export interface Confronto {
  /** Per program: the medians of its pairs of seeds, and the letters' change. */
  traSemi: Array<{ nome: string; concetto: string; quote: Quote; colore?: number; voxel?: number }>;
  /** Medians over all pairs of seeds of one program, and over all pairs of runs of two programs of different concepts. */
  dentro: Quote;
  fra: Quote;
  /** fra / dentro, per component. */
  separazione: Quote;
  /** Runs whose nearest other run is a seed of the same program. */
  vicini: number;
  /** Concept × concept: median distance between their runs (on the diagonal, between seeds). */
  matrice: { concetti: string[]; d: number[][] };
}

const quoteDi2 = (ds: Distanza[]): Quote => Object.fromEntries(COMPONENTI.map((k) => [k, mediana(ds.map((d) => d[k]))])) as Quote;

export function confronta(gruppi: Gruppo[]): Confronto {
  const traSemi = gruppi.map((g) => {
    const ds: Distanza[] = [], cs: number[] = [], vs: number[] = [];
    g.forme.forEach((a, i) =>
      g.forme.slice(i + 1).forEach((b) => {
        ds.push(distanza(a, b));
        const c = colore(a, b), v = voxel(a, b);
        if (c !== undefined) cs.push(c);
        if (v !== undefined) vs.push(v);
      }),
    );
    return { nome: g.nome, concetto: g.concetto, quote: quoteDi2(ds), ...(cs.length ? { colore: mediana(cs) } : {}), ...(vs.length ? { voxel: mediana(vs) } : {}) };
  });
  const dentro: Distanza[] = [], fra: Distanza[] = [];
  const tutte = gruppi.flatMap((g, gi) => g.forme.map((f) => ({ f, gi })));
  const concetti = [...new Set(gruppi.map((g) => g.concetto))];
  const celle = new Map<string, number[]>();
  let giusti = 0;
  tutte.forEach((a, i) => {
    let migliore = Infinity, stesso = false;
    tutte.forEach((b, j) => {
      if (i === j) return;
      const d = distanza(a.f, b.f);
      if (d.distanza < migliore) {
        migliore = d.distanza;
        stesso = a.gi === b.gi;
      }
      if (j < i) return;
      const ca = gruppi[a.gi].concetto, cb = gruppi[b.gi].concetto;
      if (a.gi === b.gi) dentro.push(d);
      else if (ca !== cb) fra.push(d);
      const k = [ca, cb].sort().join('|');
      celle.set(k, [...(celle.get(k) ?? []), d.distanza]);
    });
    if (stesso) giusti++;
  });
  const qd = quoteDi2(dentro), qf = quoteDi2(fra);
  const separazione = Object.fromEntries(COMPONENTI.map((k) => [k, qd[k] ? qf[k] / qd[k] : Infinity])) as Quote;
  const d = concetti.map((a) => concetti.map((b) => mediana(celle.get([a, b].sort().join('|')) ?? [])));
  return { traSemi, dentro: qd, fra: qf, separazione, vicini: tutte.length ? giusti / tutte.length : 0, matrice: { concetti, d } };
}

/** The descriptors of a program, as means over its seeds: what the table per concept shows. */
export function descrittori(g: Gruppo) {
  const m = (k: 'copertura' | 'pieno' | 'altezzaMedia' | 'altezzaMassima' | 'cortile' | 'quote' | 'torri') => g.forme.reduce((s, f) => s + f[k], 0) / Math.max(1, g.forme.length);
  return { copertura: m('copertura'), pieno: m('pieno'), altezzaMedia: m('altezzaMedia'), altezzaMassima: m('altezzaMassima'), cortile: m('cortile'), quote: m('quote'), torri: m('torri') };
}

/** The feet of a building run: what stands below is the plinth and the floor of the ground floor (`varianza.ts` does the same). */
export const piedeDi = (base: number, vpt: number) => base + stepOf(vpt) + 1;
