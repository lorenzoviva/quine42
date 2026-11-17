// The reference of «done well» (T371, D53): the fort the author drew by hand (`lab/mjx/models/handmade/forte-handmade.xml`, 500 × 500 ×
// 150 voxels, 50 × 50 tiles at 10 voxels a tile, D61) is the standard of the best quality a structure can have. No model of today is
// expected to reach it: it is the measure. Here the measure as numbers a program of any letters can be held against: the traits of a fort
// read from the voxels alone (what is built, what is enclosed, what rises, where one walks), never from the letters of its palette, so that a
// fort written by Gemini, by Claude or by hand is measured the same way; and the scale that says how close a program comes to the
// reference, item by item and as one number out of 10. The reference is versioned: `REFERENCE_VERSION` names the measures saved in
// `lab/banco/riferimento/ottima/forte-<version>.json` (`lab/scripts/banco-ottima.ts -- --riferimento`), with the hash of the file they come
// from; a new version of the fort replaces the measures and keeps the scale.

import { createHash } from 'node:crypto';
import { habitableParts } from '../../../src/kernel/forms';
import { partVoxels } from '../../../src/mj/classes';
import type { Grid3, PaletteEntry } from '../../../src/mj/engine';
import { colorTable } from '../../../src/mj/mesh';
import type { MjxClip } from '../../../src/mj/model';
import { turn } from '../../../src/mj/photo';
import { act } from '../../../src/mj/run';

/** The version of the author's fort the saved measures come from: a new fort is a new version, the scale stays. */
export const REFERENCE_VERSION = 'v1';
export const REFERENCE_FILE = 'lab/mjx/models/handmade/forte-handmade.xml';
/** The density the author chose for the fort (D61, A2): 10 voxels a tile, 50 × 50 tiles. */
export const REFERENCE_VPT = 10;
export const REFERENCE_DIR = 'lab/banco/riferimento/ottima';
/** The wanderer's height in tiles: 30 voxels at 20 a tile (`PARTS`, lab/mjx/models/viandante.xml). */
export const WANDERER_TILES = 1.5;

export const referencePath = (version = REFERENCE_VERSION): string => `${REFERENCE_DIR}/forte-${version}.json`;
export const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

/** The traits of a fort, read from its voxels: shares, counts and heights in wanderers, the same at every density. */
export interface FortTraits {
  /** The plan inside the outline (what is at least a tile tall, and what it encloses), in tiles. */
  footprintTiles: number;
  /** Of the plan inside the outline, the share that is enclosed and not tall: the courtyard, with what low stands in it. */
  courtyard: number;
  /** The re-entrant corners of the courtyard: a union of rectangles has some, one rectangle none. */
  courtyardBends: number;
  /** The re-entrant corners of the outer outline (walls that bend, towers that stand out). */
  wallBends: number;
  /** The convex corners of the outer outline. */
  corners: number;
  /** Of the convex corners, the share with a tower (a peak) within a cell. */
  cornerTowers: number;
  /** The peaks: separate masses at least half a tile taller than the walls. */
  towers: number;
  /** The walls: the median top of the outer ring, in wanderers. */
  wallHeight: number;
  /** The highest top, in wanderers. */
  topHeight: number;
  /** The heights of the top, each on at least 1.5 % of the built columns (the skyline). */
  skyline: number;
  /** The covered storeys a body reaches on foot from outside, through the gate, whatever side it is on. */
  storeys: number;
  /** Of those, the storeys at least a wanderer above the ground: walks on the walls, upper floors, terraces. */
  upperStoreys: number;
  /** The floors with a room where one stands (a storey's clear height, a room's side), reached or not. */
  roomFloors: number;
  /** The share of the outer perimeter whose top is toothed (merlons: a step of a voxel to most of a tile between neighbours). */
  crenels: number;
  /** The share of the outer perimeter with an opening in the face (a slit or a window: a gap between solid, or glass). */
  openings: number;
  /** The distance between the tallest mass (the keep) and the gate, over the diagonal of the outline (0: no gate found). */
  keepFromGate: number;
}

/** The measures of the author's fort at a version, saved by the bench. */
export interface Reference {
  version: string;
  file: string;
  sha256: string;
  commit?: string;
  date: string;
  vpt: number;
  box: [number, number, number];
  seeds: Array<{ seed: number; ms: number; traits: FortTraits }>;
  /** The mean of the seeds: what a program is held against. */
  traits: FortTraits;
  /** How much the plans of the seeds differ (`planDistance`, mean of the pairs). */
  variety: number;
}

export interface ScaleItem {
  id: keyof FortTraits;
  name: string;
  what: string;
  kind: 'share' | 'count' | 'wanderers' | 'ratio';
}

/** The scale: every item is a trait of the reference; a program scores on each the share of the reference it reaches (at most 1). */
export const SCALE: ScaleItem[] = [
  { id: 'courtyard', name: 'cortile', what: 'la parte della pianta dentro il contorno che è cortile aperto', kind: 'share' },
  { id: 'courtyardBends', name: 'cortile a rettangoli', what: 'gli angoli rientranti del cortile: un rettangolo solo ne ha zero, un’unione di rettangoli molti', kind: 'count' },
  { id: 'wallBends', name: 'mura irregolari', what: 'gli angoli rientranti del contorno esterno (mura che girano, torri che sporgono)', kind: 'count' },
  { id: 'cornerTowers', name: 'torri agli angoli', what: 'gli angoli convessi del contorno con una torre entro una cella', kind: 'share' },
  { id: 'towers', name: 'torri', what: 'le masse separate più alte delle mura di almeno mezza casella (torri, mastio, torre della porta)', kind: 'count' },
  { id: 'wallHeight', name: 'mura', what: 'l’altezza mediana dell’anello esterno, in viandanti', kind: 'wanderers' },
  { id: 'topHeight', name: 'cima', what: 'il punto più alto, in viandanti', kind: 'wanderers' },
  { id: 'skyline', name: 'sagoma', what: 'le altezze della cima, ognuna su almeno l’1,5 % del costruito', kind: 'count' },
  { id: 'storeys', name: 'piani raggiunti', what: 'i piani coperti raggiunti a piedi dal portone, su qualunque lato stia', kind: 'count' },
  { id: 'upperStoreys', name: 'piani in quota', what: 'di quelli, i piani almeno un viandante sopra il suolo: camminamenti, piani alti, terrazze', kind: 'count' },
  { id: 'roomFloors', name: 'piani con stanze', what: 'i pavimenti con una stanza in cui si sta in piedi', kind: 'count' },
  { id: 'crenels', name: 'merlature', what: 'la parte del perimetro con la cima dentellata', kind: 'share' },
  { id: 'openings', name: 'aperture', what: 'la parte del perimetro con feritoie o finestre', kind: 'share' },
  { id: 'keepFromGate', name: 'mastio lontano dal portone', what: 'la distanza fra la massa più alta e il portone, sulla diagonale del contorno', kind: 'ratio' },
];

export interface Scored {
  /** Out of 10: the mean of the items' scores. */
  total: number;
  items: Array<{ id: keyof FortTraits; name: string; value: number; reference: number; score: number }>;
}

/** How close a program's traits come to the reference's: on every item the share reached (at most 1), the total out of 10. */
export function scoreOf(t: FortTraits, ref: FortTraits): Scored {
  // An item the reference has none of says nothing: left out of the mean.
  const items = SCALE.filter((s) => ref[s.id] > 0).map((s) => ({ id: s.id, name: s.name, value: t[s.id], reference: ref[s.id], score: Math.max(0, Math.min(1, t[s.id] / ref[s.id])) }));
  const total = items.length ? Math.round((items.reduce((a, i) => a + i.score, 0) / items.length) * 100) / 10 : 0;
  return { total, items };
}

/** The mean of some traits, item by item. */
export function meanTraits(all: FortTraits[]): FortTraits {
  const out = {} as FortTraits;
  for (const key of Object.keys(all[0]) as Array<keyof FortTraits>) out[key] = Math.round((all.reduce((a, t) => a + t[key], 0) / all.length) * 1000) / 1000;
  return out;
}

const mode = (values: Iterable<number>): number => {
  const count = new Map<number, number>();
  for (const v of values) count.set(v, (count.get(v) ?? 0) + 1);
  let best = { value: 0, n: 0 };
  for (const [value, n] of count) if (n > best.n) best = { value, n };
  return best.value;
};

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[s.length >> 1];
};

/** The grid as a body finds it: the door opened by the action `open`, if the program has one. */
function opened(grid: Grid3, actions: readonly MjxClip[], seed: number): Grid3 {
  const clip = actions.find((a) => /^(open|apr)/i.test(a.name));
  if (!clip) return grid;
  const copy: Grid3 = { ...grid, cells: new Uint8Array(grid.cells), alphabet: [...grid.alphabet], log: [], epoch: 0 };
  act(copy, clip, seed);
  return copy;
}

/** A mask of cells: the 2 × 2 windows with one cell set are convex corners (a diagonal pair counts two), with three set re-entrant ones. */
function cornersOf(mask: Uint8Array, W: number, H: number): { convex: Array<[number, number]>; concave: number } {
  const convex: Array<[number, number]> = [];
  let concave = 0;
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < W && y < H ? mask[x + y * W] : 0);
  for (let y = -1; y < H; y++)
    for (let x = -1; x < W; x++) {
      const a = at(x, y), b = at(x + 1, y), c = at(x, y + 1), d = at(x + 1, y + 1);
      const n = a + b + c + d;
      if (n === 1) convex.push(a ? [x, y] : b ? [x + 1, y] : c ? [x, y + 1] : [x + 1, y + 1]);
      else if (n === 2 && a === d) {
        if (a) convex.push([x, y], [x + 1, y + 1]);
        else convex.push([x + 1, y], [x, y + 1]);
      } else if (n === 3) concave++;
    }
  return { convex, concave };
}

/** The 4-connected regions of a mask, each as its cells. */
function regionsOf(mask: Uint8Array, W: number): number[][] {
  const seen = new Uint8Array(mask.length);
  const out: number[][] = [];
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || seen[s]) continue;
    const cells: number[] = [];
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const c = stack.pop()!;
      cells.push(c);
      const x = c % W;
      for (const d of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W]) {
        if (d < 0 || d >= mask.length || seen[d] || !mask[d]) continue;
        seen[d] = 1;
        stack.push(d);
      }
    }
    out.push(cells);
  }
  return out;
}

const centroid = (cells: number[], W: number): [number, number] => [cells.reduce((a, c) => a + (c % W), 0) / cells.length, cells.reduce((a, c) => a + Math.floor(c / W), 0) / cells.length];

/** A grid turned so that `side` (0 +y, 1 +x, 2 −y, 3 −x) faces the front, where a body starts walking in. */
export function facing(g: Grid3, side: number): Grid3 {
  const view = [0, 3, 2, 1][((side % 4) + 4) % 4];
  const t = turn(g, view);
  return { X: t.X, Y: t.Y, Z: t.Z, cells: t.cells, alphabet: g.alphabet, log: [], epoch: 0 };
}

/**
 * The traits of a fort on the grid its program made, at a density: nothing from the letters but their colour (hidden letters and the
 * air are nothing) and, for the openings, a name that says glass; the storeys from the kernel's own walk (`habitableParts`), with the
 * gate's side turned to the front.
 */
export function fortTraits(grid: Grid3, palette: Record<string, PaletteEntry>, vpt: number, actions: readonly MjxClip[] = [], seed = 1): FortTraits {
  const g = opened(grid, actions, seed);
  const { X, Y, Z } = g;
  const XY = X * Y;
  const colors = colorTable(g.alphabet, palette);
  const glass = g.alphabet.map((ch) => /finestr|window|feritoi|slit|vetr|glass/i.test(palette[ch]?.name ?? ''));

  // Every column: its lowest solid, its top (one over the highest solid), whether it has an air gap between solids, whether it has glass.
  const low = new Int32Array(XY).fill(-1);
  const top = new Int32Array(XY);
  const gaps = new Uint8Array(XY);
  const sees = new Uint8Array(XY);
  const pending = new Uint8Array(XY);
  for (let z = 0; z < Z; z++)
    for (let i = 0; i < XY; i++) {
      const c = g.cells[i + z * XY];
      if (colors[c]) {
        if (low[i] < 0) low[i] = z;
        if (pending[i]) gaps[i] = 1;
        pending[i] = 0;
        top[i] = z + 1;
        if (glass[c]) sees[i] = 1;
      } else if (low[i] >= 0) pending[i] = 1;
    }
  const lows: number[] = [];
  for (let i = 0; i < XY; i++) if (low[i] >= 0) lows.push(low[i]);
  const floorZ = mode(lows);
  const built = new Uint8Array(XY);
  let builtColumns = 0;
  for (let i = 0; i < XY; i++) if (top[i] - floorZ > 0.5 * vpt) (built[i] = 1), builtColumns++;
  // A passage: a column where a person passes at the ground (air from the layer over the ground for a wanderer's height), built or not:
  // a gate under a gatehouse is built above and open below.
  const passage = new Uint8Array(XY);
  const person = Math.ceil(WANDERER_TILES * vpt);
  for (let i = 0; i < XY; i++) {
    const from = colors[g.cells[i + floorZ * XY]] ? floorZ + 1 : floorZ;
    let z = from;
    while (z < Z && z < from + person && !colors[g.cells[i + z * XY]]) z++;
    if (z >= from + person) passage[i] = 1;
  }
  const empty: FortTraits = { footprintTiles: 0, courtyard: 0, courtyardBends: 0, wallBends: 0, corners: 0, cornerTowers: 0, towers: 0, wallHeight: 0, topHeight: 0, skyline: 0, storeys: 0, upperStoreys: 0, roomFloors: 0, crenels: 0, openings: 0, keepFromGate: 0 };
  if (!builtColumns) return empty;

  // Cells of a quarter of a tile: a cell is built where at least half its columns are.
  const cell = Math.max(2, Math.round(vpt / 4));
  const CX = Math.ceil(X / cell), CY = Math.ceil(Y / cell);
  const cellBuilt = new Uint8Array(CX * CY);
  const cellTop = new Float32Array(CX * CY);
  // A tall cell is at least a tile high: what encloses a courtyard (walls), not a hedge, a fence or a well.
  const cellTall = new Uint8Array(CX * CY);
  for (let cy = 0; cy < CY; cy++)
    for (let cx = 0; cx < CX; cx++) {
      let n = 0, b = 0, h = 0, sum = 0;
      for (let y = cy * cell; y < Math.min(Y, (cy + 1) * cell); y++)
        for (let x = cx * cell; x < Math.min(X, (cx + 1) * cell); x++) {
          n++;
          const i = x + y * X;
          if (built[i]) (b++), (sum += top[i] - floorZ);
          if (top[i] - floorZ >= vpt) h++;
        }
      if (b * 2 >= n && b) (cellBuilt[cx + cy * CX] = 1), (cellTop[cx + cy * CX] = sum / b);
      if (h * 2 >= n && h) cellTall[cx + cy * CX] = 1;
    }
  // A cell one passes through at the ground: at least half its columns are passages.
  const cellPassage = new Uint8Array(CX * CY);
  for (let cy = 0; cy < CY; cy++)
    for (let cx = 0; cx < CX; cx++) {
      let n = 0, p = 0;
      for (let y = cy * cell; y < Math.min(Y, (cy + 1) * cell); y++) for (let x = cx * cell; x < Math.min(X, (cx + 1) * cell); x++) (n++), (p += passage[x + y * X]);
      if (p * 2 >= n && p) cellPassage[cx + cy * CX] = 1;
    }
  // The gaps of the outline up to a tile and a half wide (a gate without a gatehouse, a notch) are shut for the flood: the closing of
  // the built cells (dilated by three quarters of a tile, then eroded) adds them, and the outside does not come in through them.
  const r = Math.max(1, Math.round((0.75 * vpt) / cell));
  const dilated = new Uint8Array(CX * CY);
  for (let i = 0; i < CX * CY; i++) {
    if (!cellTall[i]) continue;
    const x = i % CX, y = Math.floor(i / CX);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < CX && y + dy < CY) dilated[x + dx + (y + dy) * CX] = 1;
  }
  const shut = new Uint8Array(CX * CY);
  for (let i = 0; i < CX * CY; i++) {
    if (cellTall[i]) continue;
    const x = i % CX, y = Math.floor(i / CX);
    let all = true;
    for (let dy = -r; dy <= r && all; dy++) for (let dx = -r; dx <= r; dx++) if (x + dx < 0 || y + dy < 0 || x + dx >= CX || y + dy >= CY || !dilated[x + dx + (y + dy) * CX]) { all = false; break; }
    if (all) shut[i] = 1;
  }
  // Outside: the cells not tall that an empty path joins to the edge; enclosed: the rest of the cells not tall (the courtyard, with
  // what low stands in it).
  const outside = new Uint8Array(CX * CY);
  const stack: number[] = [];
  const enter = (i: number) => {
    if (!cellTall[i] && !shut[i] && !outside[i]) (outside[i] = 1), stack.push(i);
  };
  for (let x = 0; x < CX; x++) enter(x), enter(x + (CY - 1) * CX);
  for (let y = 0; y < CY; y++) enter(y * CX), enter(CX - 1 + y * CX);
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % CX;
    if (x > 0) enter(i - 1);
    if (x < CX - 1) enter(i + 1);
    if (i >= CX) enter(i - CX);
    if (i < CX * (CY - 1)) enter(i + CX);
  }
  const enclosed = new Uint8Array(CX * CY);
  const footprint = new Uint8Array(CX * CY);
  let enclosedN = 0, footprintN = 0;
  for (let i = 0; i < CX * CY; i++) {
    if (!outside[i] && !cellTall[i]) (enclosed[i] = 1), enclosedN++;
    if (!outside[i]) (footprint[i] = 1), footprintN++;
  }
  // The ring: the cells of the outline next to the outside (or the edge of the box).
  const ring = new Uint8Array(CX * CY);
  for (let i = 0; i < CX * CY; i++) {
    if (!footprint[i]) continue;
    const x = i % CX, y = Math.floor(i / CX);
    const out = (j: number) => j < 0 || j >= CX * CY || outside[j];
    if (x === 0 || y === 0 || x === CX - 1 || y === CY - 1 || out(i - 1) || out(i + 1) || out(i - CX) || out(i + CX)) ring[i] = 1;
  }
  const ringTops: number[] = [];
  for (let i = 0; i < CX * CY; i++) if (ring[i] && cellTall[i]) ringTops.push(cellTop[i]);
  const wallTop = median(ringTops);
  let maxTop = 0;
  for (let i = 0; i < XY; i++) if (built[i]) maxTop = Math.max(maxTop, top[i] - floorZ);
  // The peaks: built cells at least half a tile over the walls; the towers their separate masses.
  const peak = new Uint8Array(CX * CY);
  for (let i = 0; i < CX * CY; i++) if (cellBuilt[i] && cellTop[i] >= wallTop + 0.5 * vpt) peak[i] = 1;
  const towers = regionsOf(peak, CX).length;
  const outline = cornersOf(footprint, CX, CY);
  const nearPeak = ([x, y]: [number, number]) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < CX && y + dy < CY && peak[x + dx + (y + dy) * CX]) return true;
    return false;
  };
  const cornerTowers = outline.convex.length ? outline.convex.filter(nearPeak).length / outline.convex.length : 0;
  const yard = cornersOf(enclosed, CX, CY);

  // The skyline: the heights of the top, each on at least 1.5 % of the built columns.
  const tops = new Map<number, number>();
  for (let i = 0; i < XY; i++) if (built[i]) tops.set(top[i], (tops.get(top[i]) ?? 0) + 1);
  let skyline = 0;
  for (const n of tops.values()) if (n >= 0.015 * builtColumns) skyline++;

  // The perimeter: the built columns next to a column not built; toothed where the top steps by a voxel to most of a tile; open where
  // the face has a gap or glass.
  const edge = new Uint8Array(XY);
  let boundary = 0, open = 0;
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      const i = x + y * X;
      if (!built[i]) continue;
      const near = [x > 0 ? i - 1 : -1, x < X - 1 ? i + 1 : -1, y > 0 ? i - X : -1, y < Y - 1 ? i + X : -1];
      if (!near.some((j) => j < 0 || !built[j])) continue;
      edge[i] = 1;
      boundary++;
      if (gaps[i] || sees[i]) open++;
    }
  // A tooth: along a line of the perimeter, a run of equal tops no longer than most of a tile whose two neighbouring runs both stand
  // a voxel to half a tile higher (a gap between merlons) or lower (a merlon); a roof's edge steps one way only and is none.
  const tooth = new Uint8Array(XY);
  const maxTooth = 0.5 * vpt, maxRun = Math.ceil(0.6 * vpt);
  const scan = (line: number[]) => {
    const runs: Array<{ from: number; to: number; top: number }> = [];
    for (let k = 0; k < line.length; k++) {
      const last = runs[runs.length - 1];
      if (last && last.top === top[line[k]]) last.to = k;
      else runs.push({ from: k, to: k, top: top[line[k]] });
    }
    for (let q = 1; q + 1 < runs.length; q++) {
      const run = runs[q];
      if (run.to - run.from + 1 > maxRun) continue;
      const a = runs[q - 1].top - run.top, b = runs[q + 1].top - run.top;
      if (a * b > 0 && Math.abs(a) >= 1 && Math.abs(a) <= maxTooth && Math.abs(b) >= 1 && Math.abs(b) <= maxTooth) for (let k = run.from; k <= run.to; k++) tooth[line[k]] = 1;
    }
  };
  for (let y = 0; y < Y; y++) {
    let line: number[] = [];
    for (let x = 0; x <= X; x++) {
      if (x < X && edge[x + y * X]) line.push(x + y * X);
      else if (line.length) (scan(line)), (line = []);
    }
  }
  for (let x = 0; x < X; x++) {
    let line: number[] = [];
    for (let y = 0; y <= Y; y++) {
      if (y < Y && edge[x + y * X]) line.push(x + y * X);
      else if (line.length) (scan(line)), (line = []);
    }
  }
  let crenel = 0;
  for (let i = 0; i < XY; i++) if (tooth[i]) crenel++;

  // The gate: the cells of the ring one passes through at the ground (a gap in the wall, or the passage under a gatehouse); the keep: the
  // tallest mass; their distance over the diagonal.
  const gateCells: number[] = [];
  for (let i = 0; i < CX * CY; i++) if (ring[i] && (!cellTall[i] || cellPassage[i])) gateCells.push(i);
  const keepCells: number[] = [];
  for (let i = 0; i < CX * CY; i++) if (cellBuilt[i] && cellTop[i] >= 0.85 * maxTop) keepCells.push(i);
  let x0 = CX, x1 = -1, y0 = CY, y1 = -1;
  for (let i = 0; i < CX * CY; i++)
    if (footprint[i]) {
      const x = i % CX, y = Math.floor(i / CX);
      (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
    }
  const diagonal = Math.hypot(x1 - x0 + 1, y1 - y0 + 1) || 1;
  let keepFromGate = 0;
  let gateSide: number | undefined;
  if (gateCells.length && keepCells.length) {
    const gate = centroid(gateCells, CX), keep = centroid(keepCells, CX);
    keepFromGate = Math.hypot(gate[0] - keep[0], gate[1] - keep[1]) / diagonal;
    const dx = gate[0] - (x0 + x1) / 2, dy = gate[1] - (y0 + y1) / 2;
    gateSide = Math.abs(dy) >= Math.abs(dx) ? (dy >= 0 ? 0 : 2) : dx >= 0 ? 1 : 3;
  }

  // The storeys, by the kernel's walk from the front: the gate's side first, then the others if it did not get in.
  const clear = partVoxels(vpt).storey.clear;
  const roomSide = partVoxels(vpt).room.side;
  let best: ReturnType<typeof habitableParts> | undefined;
  for (const side of [...(gateSide !== undefined ? [gateSide] : []), 0, 1, 2, 3].filter((s, k, all) => all.indexOf(s) === k)) {
    const h = habitableParts(facing(g, side), palette, vpt, clear, 0, [], seed);
    if (!best || h.storeys.length > best.storeys.length) best = h;
    if (best.storeys.length >= 2 && side === gateSide) break;
  }
  const storeys = best?.storeys ?? [];
  const roomFloors = new Set((best?.rooms ?? []).filter((r) => r.room >= roomSide && r.clear >= clear).map((r) => r.z)).size;

  return {
    footprintTiles: Math.round((footprintN * cell * cell) / (vpt * vpt)),
    courtyard: footprintN ? enclosedN / footprintN : 0,
    courtyardBends: yard.concave,
    wallBends: outline.concave,
    corners: outline.convex.length,
    cornerTowers,
    towers,
    wallHeight: wallTop / vpt / WANDERER_TILES,
    topHeight: maxTop / vpt / WANDERER_TILES,
    skyline,
    storeys: storeys.length,
    upperStoreys: storeys.filter((z) => z - floorZ >= WANDERER_TILES * vpt).length,
    roomFloors,
    crenels: boundary ? crenel / boundary : 0,
    openings: boundary ? open / boundary : 0,
    keepFromGate,
  };
}

const fmt = (v: number, kind: ScaleItem['kind']): string => (kind === 'count' ? String(Math.round(v * 10) / 10) : kind === 'share' ? `${Math.round(v * 100)} %` : (Math.round(v * 100) / 100).toLocaleString('it'));

/** One row of a table: the total and every item as «value / reference». */
export function scoreRow(s: Scored): string {
  return `${s.total.toLocaleString('it', { minimumFractionDigits: 1 })} | ${s.items.map((i) => `${fmt(i.value, SCALE.find((x) => x.id === i.id)!.kind)} (${Math.round(i.score * 100)} %)`).join(' | ')}`;
}

/** The head of that table. */
export const scoreHead = (ref: FortTraits): string[] => [
  `| programma | voto | ${SCALE.filter((s) => ref[s.id] > 0).map((s) => s.name).join(' | ')} |`,
  `|---|---|${SCALE.filter((s) => ref[s.id] > 0).map(() => '---').join('|')}|`,
];

export { fmt as formatTrait };
