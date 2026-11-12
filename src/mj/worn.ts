// What is worn on a body (T290, ADR-0180): the way the author chose on the bench of T289 (lab/banco/indossati.md), C + B.
//
// - The zones of a body (`bodyOf`): its head, its torso and its back, found from its voxels and its rig as the hands of hold.ts are
//   found from its arms, with no table per body. Three legs or more stand on all fours (long axis y), two or none stand up (long
//   axis z); the neck is the narrowest slice of the core between two wider ones (or the palette's `head` part); the torso goes from
//   the hips to the neck, the back is its rear half (its upper half on all fours).
// - The frame of a zone: heads look toward +y on every body; a torso or a back on all fours is turned a quarter round x (`turnUp`),
//   so that it stands with its back toward −y like a standing one. A worn section is written once, in that frame, for every body.
// - Way B (`wearB`): the thing's program has a `<worn zone="…">` section beside its root: rules that run on a copy of the wearer.
//   Before them the kernel writes four letters (`WORN_MARKS`): z the voxels of the zone, o the rest of the body, r the air where the
//   thing may be, m that air on the middle line; the body's own letters are out of the rules' reach. Afterwards z and o go back to
//   what they were, r and m to air: what the rules wrote in the thing's letters stays. A section that does not compile, does not
//   finish or writes nothing falls back to C.
// - Way C (`wearC`), the floor: the outer voxels of the zone take the thing's two main colours (`mainColors`), and a cloak standing
//   falls to the ground behind (the only cells it adds). Every thing that is worn shows this way at once, a thing without a model
//   in the colour of its pack.
//
// Things are put on the outer first (back, torso, head: `DRESSING_ORDER`): a later one never writes over an earlier one. The dressed
// body is a new grid, `PAD` voxels larger round the body and above it (never under the feet), with the same centre and floor: the
// joints of the bare body's rig are its joints, so what the figure holds stays in its hand. Pure functions: the worker, the
// validator and the tests run the same.

import { Mj3Error, runOn, type GridLimits, type PaletteEntry, type Program3, type Vec3 } from './engine';
import { colorTable, partTable, type VoxelGrid } from './mesh';
import { compileMjx } from './model';
import { rig, type Limb } from './rig';
import { symbolName, symbolTokens } from './symbols';
import { parseXml, XmlError, type XmlElement } from './xml';

export type WornZone = 'head' | 'torso' | 'back';
export const WORN_ZONES: readonly WornZone[] = ['head', 'torso', 'back'];
/** The order things are put on: the outer first (a cloak, then a cuirass, then a helmet), so that a later one fills only what is left. */
export const DRESSING_ORDER: readonly WornZone[] = ['back', 'torso', 'head'];
export const isWornZone = (v: unknown): v is WornZone => typeof v === 'string' && (WORN_ZONES as readonly string[]).includes(v);

/** A grid and the palette of its letters. */
export interface Dressed {
  grid: VoxelGrid;
  palette: Record<string, PaletteEntry>;
}

export interface Zone {
  id: WornZone;
  /** Body voxels of the zone, as indices of the body's grid. */
  cells: number[];
  /** Their bounds, inclusive, in voxels of the body's grid. */
  min: Vec3;
  max: Vec3;
}

export interface Body {
  grid: VoxelGrid;
  /** 1 where a voxel is seen. */
  solid: Uint8Array;
  /** Per voxel, the index of its limb in `limbs`, or -1. */
  limbOf: Int16Array;
  limbs: Limb[];
  /** Standing (long axis z) or on all fours (long axis y). */
  upright: boolean;
  /** Where the neck is along the long axis (the last slice of the torso), and how it was found. */
  neck: { at: number; found: 'rig' | 'narrowing' | 'share' };
  zones: Partial<Record<WornZone, Zone>>;
}

/** A slice is the neck when it holds at most this share of the widest slice on its narrower side. */
export const NECK_RATIO = 0.8;
/** Without a neck, the head is this share of the core along the long axis (standing, on all fours). */
const HEAD_SHARE = { upright: 0.36, prone: 0.28 } as const;
/** Pieces of a slice smaller than this share of its largest one are left out (a staff, a whisker). */
const MAIN_PIECE = 0.25;

const idx = (g: VoxelGrid, x: number, y: number, z: number) => x + y * g.X + z * g.X * g.Y;
export const coordsOf = (g: VoxelGrid, i: number): Vec3 => [i % g.X, Math.floor(i / g.X) % g.Y, Math.floor(i / (g.X * g.Y))];

/** The cells of a slice of `mask` (axis 1: y = t, axis 2: z = t) that are in its main pieces (8-connected in the slice). */
function mainOfSlice(g: VoxelGrid, mask: Uint8Array, axis: 1 | 2, t: number): number[] {
  const { X, Y } = g;
  const V = axis === 2 ? Y : g.Z;
  const at = (u: number, v: number) => (axis === 2 ? idx(g, u, v, t) : idx(g, u, t, v));
  const seen = new Uint8Array(X * V);
  const pieces: number[][] = [];
  for (let v = 0; v < V; v++)
    for (let u = 0; u < X; u++) {
      if (seen[u + v * X] || !mask[at(u, v)]) continue;
      const piece: number[] = [];
      const stack = [u + v * X];
      seen[u + v * X] = 1;
      while (stack.length) {
        const c = stack.pop()!;
        const cu = c % X, cv = Math.floor(c / X);
        piece.push(at(cu, cv));
        for (let dv = -1; dv <= 1; dv++)
          for (let du = -1; du <= 1; du++) {
            const nu = cu + du, nv = cv + dv;
            if (nu < 0 || nv < 0 || nu >= X || nv >= V || seen[nu + nv * X] || !mask[at(nu, nv)]) continue;
            seen[nu + nv * X] = 1;
            stack.push(nu + nv * X);
          }
      }
      pieces.push(piece);
    }
  if (!pieces.length) return [];
  let most = 0;
  for (const p of pieces) most = Math.max(most, p.length);
  return pieces.filter((p) => p.length >= MAIN_PIECE * most).flat();
}

function bounds(g: VoxelGrid, cells: readonly number[]): { min: Vec3; max: Vec3; mean: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  const mean: Vec3 = [0, 0, 0];
  for (const c of cells) {
    const p = coordsOf(g, c);
    for (let a = 0; a < 3; a++) {
      if (p[a] < min[a]) min[a] = p[a];
      if (p[a] > max[a]) max[a] = p[a];
      mean[a] += p[a] / cells.length;
    }
  }
  return { min, max, mean };
}

/**
 * A voxel that is no limb but has more of one limb than of the body round it is that limb's skin: the light on a wolf's tail is
 * painted over it in a letter without a part, and would make the tail a piece of the back (a lone voxel on a limb is its skin too).
 * Twice, so that a skin two voxels deep goes too; only for the zones (the rig of the figure is as it is).
 */
function absorbSkins(g: VoxelGrid, solid: Uint8Array, limbOf: Int16Array, count: number): void {
  if (!count) return;
  const { X, Y, Z } = g;
  for (let pass = 0; pass < 2; pass++) {
    const moves: Array<[number, number]> = [];
    const tally = new Int32Array(count);
    for (let z = 0; z < Z; z++)
      for (let y = 0; y < Y; y++)
        for (let x = 0; x < X; x++) {
          const i = idx(g, x, y, z);
          if (!solid[i] || limbOf[i] >= 0) continue;
          tally.fill(0);
          let body = 0;
          for (let dz = -1; dz <= 1; dz++)
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy, nz = z + dz;
                if ((!dx && !dy && !dz) || nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z) continue;
                const j = idx(g, nx, ny, nz);
                if (!solid[j]) continue;
                if (limbOf[j] >= 0) tally[limbOf[j]]++;
                else body++;
              }
          let best = -1;
          for (let k = 0; k < count; k++) if (tally[k] > body && (tally[k] >= 3 || body === 0) && (best < 0 || tally[k] > tally[best])) best = k;
          if (best >= 0) moves.push([i, best]);
        }
    if (!moves.length) break;
    for (const [i, k] of moves) limbOf[i] = k;
  }
}

/** The body of a figure: its rig, its plan, its neck and its zones (T289's bench, `lab/banco/indossati/body.ts`, measured on 27 bodies). */
export function bodyOf(grid: VoxelGrid, palette: Record<string, PaletteEntry>): Body {
  const g = grid;
  const n = g.cells.length;
  const colors = colorTable(g.alphabet, palette);
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (colors[g.cells[i]]) solid[i] = 1;
  const limbs = rig({ ...g, log: [], epoch: 0 }, palette).limbs;
  const limbOf = new Int16Array(n).fill(-1);
  limbs.forEach((l, k) => {
    for (const c of l.cells) limbOf[c] = k;
  });
  absorbSkins(g, solid, limbOf, limbs.length);
  const core = new Uint8Array(n);
  const coreCells: number[] = [];
  for (let i = 0; i < n; i++)
    if (solid[i] && limbOf[i] < 0) {
      core[i] = 1;
      coreCells.push(i);
    }
  const legs = limbs.filter((l) => l.part === 'leg');
  const heads = limbs.filter((l) => l.part === 'head').sort((a, b) => b.cells.length - a.cells.length);
  const empty: Body = { grid: g, solid, limbOf, limbs, upright: true, neck: { at: 0, found: 'share' }, zones: {} };
  const all = [...coreCells, ...heads.flatMap((h) => h.cells)];
  if (!all.length) return empty;
  const extent = bounds(g, all);
  const deep = extent.max[1] - extent.min[1] + 1;
  const tall = extent.max[2] - extent.min[2] + 1;
  // Three legs or more: on all fours, unless much taller than long; two or none: standing, unless much longer than tall.
  const upright = legs.length >= 3 ? tall > 1.5 * deep : deep <= 1.5 * tall;
  const axis: 1 | 2 = upright ? 2 : 1;
  const lo = extent.min[axis];
  const hi = extent.max[axis];
  const span = hi - lo + 1;
  const along = (i: number) => coordsOf(g, i)[axis];

  // The main pieces of every slice of the core along the long axis.
  const slices: number[][] = [];
  for (let t = 0; t <= (axis === 2 ? g.Z : g.Y) - 1; t++) slices[t] = t < lo || t > hi ? [] : mainOfSlice(g, core, axis, t);

  let neck: Body['neck'];
  let headCells: number[];
  if (heads.length) {
    // The palette says where the head is: that part. The neck is just under it.
    headCells = heads[0].cells;
    let least = Infinity;
    for (const c of headCells) least = Math.min(least, along(c));
    neck = { at: least - 1, found: 'rig' };
  } else {
    const area = slices.map((s) => s.length);
    const from = Math.round(lo + (upright ? 0.35 : 0.45) * span);
    const to = Math.round(lo + (upright ? 0.85 : 0.9) * span);
    let best = Infinity;
    const scores: Array<[number, number]> = [];
    for (let t = from; t <= to; t++) {
      let before = 0, after = 0;
      for (let u = lo; u < t; u++) before = Math.max(before, area[u] ?? 0);
      for (let u = t + 1; u <= hi; u++) after = Math.max(after, area[u] ?? 0);
      const side = Math.min(before, after);
      if (side <= 0) continue;
      const score = (area[t] ?? 0) / side;
      scores.push([t, score]);
      best = Math.min(best, score);
    }
    if (best <= NECK_RATIO) {
      // The narrowest slices: the middle of them, so that a long neck is shared between the head and the torso.
      const narrow = scores.filter(([, s]) => s <= best + 0.03).map(([t]) => t);
      neck = { at: narrow[Math.floor((narrow.length - 1) / 2)], found: 'narrowing' };
    } else neck = { at: Math.round(hi - (upright ? HEAD_SHARE.upright : HEAD_SHARE.prone) * span), found: 'share' };
    headCells = slices.slice(neck.at + 1).flat();
  }

  // The torso: from the hips to the neck (standing), the whole core behind the neck (on all fours); with the head named by the
  // palette, every slice past the hips that is not the head (a body leaning forward has its back beside the head). The hips are the
  // top of the legs, if the legs end well under the neck, and never lower than a quarter of the way up to it: a long robe is not a chest.
  const head = new Set(headCells);
  let hips = lo;
  if (upright) {
    let legTop = -1;
    for (const l of legs) for (const c of l.cells) legTop = Math.max(legTop, coordsOf(g, c)[2]);
    const quarter = Math.round(lo + 0.25 * (neck.at - lo));
    hips = legTop >= 0 && legTop + 1 <= neck.at - 3 ? Math.max(legTop + 1, quarter) : quarter;
  }
  const last = neck.found === 'rig' ? hi : neck.at;
  const torsoCells = slices.slice(hips, last + 1).flat().filter((c) => !head.has(c));
  // The back: the rear half of the torso standing, its upper half on all fours.
  let backCells: number[] = [];
  if (torsoCells.length) {
    const side: 1 | 2 = upright ? 1 : 2;
    const mid = torsoCells.reduce((s, c) => s + coordsOf(g, c)[side], 0) / torsoCells.length;
    backCells = torsoCells.filter((c) => (upright ? coordsOf(g, c)[1] <= mid : coordsOf(g, c)[2] >= mid));
  }
  const zones: Body['zones'] = {};
  for (const [id, cells] of [['head', headCells], ['torso', torsoCells], ['back', backCells]] as Array<[WornZone, number[]]>) {
    if (!cells.length) continue;
    const b = bounds(g, cells);
    zones[id] = { id, cells, min: b.min, max: b.max };
  }
  return { grid: g, solid, limbOf, limbs, upright, neck, zones };
}

// --- The frame of a zone ---------------------------------------------------------------------------------------------------------

/** Whether a zone of this body is turned to be written on: a torso or a back on all fours. */
export const turned = (b: Pick<Body, 'upright'>, id: WornZone) => !b.upright && id !== 'head';

/**
 * A grid turned a quarter round x, so that what was up looks toward −y and what was forward looks up: (x, y, z) → (x, Z−1−z, y).
 * A body on all fours then stands like a standing one, its back toward −y. `turnBack` undoes it.
 */
export function turnUp<T extends VoxelGrid>(g: T): T {
  const { X, Y, Z } = g;
  const cells = new Uint8Array(g.cells.length);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) cells[x + (Z - 1 - z) * X + y * X * Z] = g.cells[x + y * X + z * X * Y];
  return { ...g, X, Y: Z, Z: Y, cells };
}

/** The inverse of `turnUp`: (x, y', z') → (x, z', Z−1−y'), where Z is the height before turning (the turned grid's Y). */
export function turnBack<T extends VoxelGrid>(g: T): T {
  const { X, Y, Z } = g;
  const cells = new Uint8Array(g.cells.length);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) cells[x + z * X + (Y - 1 - y) * X * Z] = g.cells[x + y * X + z * X * Y];
  return { ...g, X, Y: Z, Z: Y, cells };
}

/** Where a cell of the body's grid is in the turned grid. */
export function turnIndex(g: VoxelGrid, i: number): number {
  const [x, y, z] = coordsOf(g, i);
  return x + (g.Z - 1 - z) * g.X + y * g.X * g.Z;
}

// --- The grid of a dressed body ------------------------------------------------------------------------------------------------------

/** Room round a body for what it wears (voxels): on every side and above, never under the feet. */
export const PAD = 4;

/** A body being dressed: its grid, its palette, and the codes of the things already on it (a later thing does not write over them). */
interface Dressing extends Dressed {
  worn: Set<number>;
}

/** The body in a box with room around it: `p` voxels on every side and above, not under the feet; the same centre, the same floor. */
export function padded(d: Dressed, p = PAD): Dressed {
  const { X, Y, Z } = d.grid;
  const [X2, Y2, Z2] = [X + 2 * p, Y + 2 * p, Z + p];
  const cells = new Uint8Array(X2 * Y2 * Z2);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) cells[x + p + (y + p) * X2 + z * X2 * Y2] = d.grid.cells[x + y * X + z * X * Y];
  return { grid: { X: X2, Y: Y2, Z: Z2, cells, alphabet: [...d.grid.alphabet] }, palette: { ...d.palette } };
}

/** Where a cell of the bare body is in its padded grid. */
export function paddedIndex(g: VoxelGrid, i: number, p = PAD): number {
  const [x, y, z] = coordsOf(g, i);
  return x + p + (y + p) * (g.X + 2 * p) + z * (g.X + 2 * p) * (g.Y + 2 * p);
}

/** The characters of the dressed body's new letters: no symbol a program writes (letters, digits, the private area up to U+F8FF). */
const NEW_LETTERS = 0xf900;
/** The characters the body's letters wear while a worn section runs: free in the private area (unions U+E000…, symbols U+F00A…U+F7FF). */
const HIDDEN_LETTERS = 0xf800;
/** Codes a grid may hold, air included: its cells are bytes. */
const MAX_CODES = 256;

/** A new letter of the dressed body, with its colour (no part: it stays with the body), or -1 if the grid has no room for one. */
function letter(d: Dressing, entry: PaletteEntry | undefined): number {
  if (d.grid.alphabet.length >= MAX_CODES) return -1;
  let n = 0;
  let ch: string;
  do ch = String.fromCharCode(NEW_LETTERS + n++);
  while (d.grid.alphabet.includes(ch));
  d.grid.alphabet.push(ch);
  const { part: _part, ...rest } = entry ?? {};
  d.palette[ch] = { ...rest };
  return d.grid.alphabet.length - 1;
}

/** The grid of the zone's frame (turned up for a torso or a back on all fours, else a copy) and the zone's cells in it. */
function frameOf(d: Dressed, body: Body, zone: WornZone): { grid: VoxelGrid; cells: number[]; turn: boolean } {
  const turn = turned(body, zone);
  const g = d.grid;
  const grid = turn ? turnUp(g) : { ...g, cells: new Uint8Array(g.cells) };
  const cells = (body.zones[zone]?.cells ?? []).map((c) => (turn ? turnIndex(g, c) : c));
  return { grid, cells, turn };
}

/** Writes the zone's frame back into the dressed body. */
function settle(d: Dressed, frame: { grid: VoxelGrid; turn: boolean }): void {
  d.grid.cells.set((frame.turn ? turnBack(frame.grid) : frame.grid).cells);
}

/** What putting one thing on did. */
export interface Change {
  zone: WornZone;
  way: 'B' | 'C';
  /** Voxels where there was air. */
  added: number;
  /** Body voxels that took a colour of the thing. */
  recoloured: number;
  /** B: the steps of its rules. */
  steps?: number;
  /** Why B did not dress the body (and C did): the section is broken (`error`, `time`, `letters`), or does nothing on this body. */
  fault?: 'error' | 'time' | 'letters' | 'nothing' | 'zone';
  why?: string;
}

// --- C: the kernel recolours the zone ----------------------------------------------------------------------------------------------

const SIDES: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/**
 * The colours of a thing for way C: the letter with the most visible voxels, then the most used one that is not a shade of it
 * (`partTable`: the iron in the shade is the iron, the brass is another colour). A thing without a model is the generic one tinted
 * with its pack's colour: that colour first.
 */
export function mainColors(g: VoxelGrid, palette: Record<string, PaletteEntry>): PaletteEntry[] {
  const colors = colorTable(g.alphabet, palette);
  const parts = partTable(g.alphabet, palette);
  const count = new Map<number, number>();
  for (const c of g.cells) if (colors[c]) count.set(c, (count.get(c) ?? 0) + 1);
  const order = [...count].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([c]) => c);
  if (!order.length) return [];
  const other = order.find((c) => parts[c] !== parts[order[0]]);
  return [order[0], ...(other !== undefined ? [other] : [])].map((c) => {
    const e = palette[g.alphabet[c]];
    return { ...(e?.name ? { name: e.name } : {}), color: e!.color!, ...(e?.glow ? { glow: true } : {}), ...(typeof e?.alpha === 'number' ? { alpha: e.alpha } : {}) };
  });
}

/** Way C: the outer voxels of the zone in the thing's two colours, and the fall of a cloak standing. */
export function wearC(d: Dressing, body: Body, zone: WornZone, palette: readonly PaletteEntry[]): Change {
  const out: Change = { zone, way: 'C', added: 0, recoloured: 0 };
  const frame = frameOf(d, body, zone);
  const g = frame.grid;
  if (!frame.cells.length || !palette.length) return out;
  const first = letter(d, palette[0]);
  const second = letter(d, palette[1] ?? palette[0]);
  if (first < 0 || second < 0) return out;
  d.worn.add(first);
  d.worn.add(second);
  const colors = colorTable(g.alphabet, d.palette);
  const XY = g.X * g.Y;
  const air = (x: number, y: number, z: number) => x < 0 || y < 0 || z < 0 || x >= g.X || y >= g.Y || z >= g.Z || !colors[g.cells[x + y * g.X + z * XY]];
  const b = bounds(g, frame.cells);
  const paint: Array<[number, number]> = [];
  for (const c of frame.cells) {
    if (d.worn.has(g.cells[c])) continue;
    const [x, y, z] = coordsOf(g, c);
    const open = SIDES.filter(([dx, dy, dz]) => air(x + dx, y + dy, z + dz));
    if (!open.length) continue;
    if (zone === 'head') {
      // A cap over the upper part of the head (the eyes and the face stay), its lowest ring in the second colour.
      const cut = b.min[2] + Math.round(0.4 * (b.max[2] - b.min[2] + 1));
      if (z >= cut) paint.push([c, z === cut ? second : first]);
    } else if (zone === 'torso') {
      // The sides of the torso, its top and bottom rows in the second colour.
      if (open.some(([, , dz]) => dz === 0)) paint.push([c, z === b.min[2] || z === b.max[2] ? second : first]);
    } else if (open.some(([, dy]) => dy === -1) || (open.some(([, , dz]) => dz === 1) && z === b.max[2])) paint.push([c, first]);
  }
  for (const [c, code] of paint) {
    g.cells[c] = code;
    out.recoloured++;
  }
  // The fall of a cloak standing: a voxel behind the lowest row of the back, down to the ground, where there is air.
  if (zone === 'back' && body.upright) {
    for (let x = b.min[0]; x <= b.max[0]; x++) {
      let rear = Infinity;
      for (const c of frame.cells) {
        const [cx, cy, cz] = coordsOf(g, c);
        if (cx === x && cz === b.min[2]) rear = Math.min(rear, cy);
      }
      if (!Number.isFinite(rear)) continue;
      for (let z = b.min[2] - 1; z >= 1; z--) {
        const y = rear - 1;
        if (y < 0 || !air(x, y, z)) break;
        g.cells[x + y * g.X + z * XY] = z === 1 ? second : first;
        out.added++;
      }
    }
  }
  settle(d, frame);
  return out;
}

// --- B: the thing's rules on the body ------------------------------------------------------------------------------------------------

/** The kernel's letters in a worn section: the zone, the rest of the body, the air the thing may take, that air on the middle line. */
export const WORN_MARKS = 'zorm';
/** How far the air of a zone reaches (Chebyshev, voxels): over and round a head, round a torso; behind a back, its own box. */
export const REACH = { head: 3, torso: 2 } as const;
/** What a worn section may hold: rule nodes and their rules, no shapes (the body is not known), maps, paths, files nor inference. */
export const WORN_NODES = ['one', 'all', 'prl', 'sequence', 'markov', 'convolution', 'rule', 'in', 'out', 'union'] as const;
/** The steps of a worn section, and its time: the bench's took 5-11 ms on the wanderer and the wolf. */
export const WORN_STEPS = 20_000;
export const WORN_TIME_MS = 1_000;
const WORN_LIMITS: GridLimits = { side: 512, cells: 8_000_000 };

/** A `<worn>` section of a program, as written: its zone, the element whole, what is inside it, its line. */
export interface WornSection {
  zone: string;
  /** `symmetry` of the element, if written ("()" when not). */
  symmetry?: string;
  inner: string;
  line: number;
}

const WORN_RE = /<worn\b([^>]*?)(\/?)>/g;

/** The program with its comments blanked, at their places: a comment may name an element. */
const bare = (xml: string) => xml.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));

/**
 * The `<worn>` sections of a program (beside its root, or inside it), outside comments, in order. A section without its end is not
 * one: the compiler says what is wrong with the program.
 */
export function wornSections(xml: string): WornSection[] {
  if (!xml.includes('<worn')) return [];
  const text = bare(xml);
  const out: WornSection[] = [];
  for (const m of text.matchAll(WORN_RE)) {
    const start = m.index!;
    const attrs = m[1];
    const zone = /\bzone="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const symmetry = /\bsymmetry="([^"]*)"/.exec(attrs)?.[1];
    const line = text.slice(0, start).split('\n').length;
    if (m[2] === '/') {
      out.push({ zone, ...(symmetry !== undefined ? { symmetry } : {}), inner: '', line });
      continue;
    }
    const open = start + m[0].length;
    const end = text.indexOf('</worn>', open);
    if (end < 0) continue;
    out.push({ zone, ...(symmetry !== undefined ? { symmetry } : {}), inner: xml.slice(open, end), line });
  }
  return out;
}

/** The program without its `<worn>` sections: what runs on the ground. The same text, the sections blanked (lines stay where they were). */
export function withoutWorn(xml: string): string {
  if (!xml.includes('<worn')) return xml;
  const text = bare(xml);
  let out = '';
  let from = 0;
  for (const m of text.matchAll(WORN_RE)) {
    const start = m.index!;
    if (start < from) continue;
    const end = m[2] === '/' ? start + m[0].length : text.indexOf('</worn>', start + m[0].length);
    if (end < 0) continue;
    const stop = m[2] === '/' ? end : end + '</worn>'.length;
    out += xml.slice(from, start) + xml.slice(start, stop).replace(/[^\n]/g, ' ');
    from = stop;
  }
  return out + xml.slice(from);
}

/** The first symbol of the root's `values` of a program (its empty cell), as written; undefined if it does not read. */
export function backgroundOf(xml: string): string | undefined {
  try {
    const root = parseXml(withoutWorn(xml)).find((r) => r.name !== 'animation' && r.name !== 'action');
    const t = symbolTokens(root?.attrs.values ?? '')[0];
    return t && !t.error && t.code !== undefined ? t.text : undefined;
  } catch {
    return undefined;
  }
}

/** The elements of a section that are not in `WORN_NODES`, with their lines. */
function strayNodes(els: XmlElement[], out: string[] = []): string[] {
  for (const e of els) {
    if (!(WORN_NODES as readonly string[]).includes(e.name)) out.push(`<${e.name}> (riga ${e.line})`);
    strayNodes(e.children, out);
  }
  return out;
}

/** A colour of the palette as `<color>` writes it. */
function colorLine(name: string, e: PaletteEntry): string {
  const hex = /^#?([0-9a-f]{6})$/i.exec(e.color ?? '')?.[1];
  if (!hex && !e.hidden) return '';
  return `<color symbol="${name}"${hex ? ` value="${hex}"` : ''}${e.hidden ? ' hidden="True"' : ''}${e.glow ? ' glow="True"' : ''}${typeof e.alpha === 'number' ? ` alpha="${e.alpha}"` : ''}/>`;
}

/**
 * The section of a thing for a zone as a program of its own, which the kernel compiles and runs on a body: the thing's letters with
 * their colours (`palette`, as the thing's form has them, its tint too), its empty cell (`background`), the kernel's four letters,
 * hidden, and the section's rules. Undefined if the thing has no section for the zone. Throws Mj3Error when it cannot be one.
 */
export function wornProgram(xml: string, zone: WornZone, thing: { background: string; palette: Record<string, PaletteEntry> }): string | undefined {
  const s = wornSections(xml).find((w) => w.zone === zone);
  if (!s) return undefined;
  const names = Object.keys(thing.palette).map(symbolName);
  const taken = [...WORN_MARKS].filter((ch) => names.includes(ch) || thing.background === ch);
  if (taken.length) throw new Mj3Error(`<worn>: le lettere ${[...WORN_MARKS].join(' ')} sono del corpo; il programma della cosa usa ${taken.join(' ')}: dagli altre lettere`);
  const colors = Object.entries(thing.palette).map(([ch, e]) => colorLine(symbolName(ch), e)).filter(Boolean);
  const marks = [...WORN_MARKS].map((ch) => `<color symbol="${ch}" hidden="True"/>`);
  return `<sequence values="${thing.background}${names.join('')}${WORN_MARKS}" symmetry="${s.symmetry ?? '()'}" size="1 1 1">\n${[...colors, ...marks].join('\n')}\n${s.inner}\n</sequence>`;
}

/** A worn program compiled, or why not: what its nodes may be (`WORN_NODES`), at least one rule. */
export function compileWorn(program: string): { program: Program3 } | { error: string } {
  try {
    let roots: XmlElement[];
    try {
      roots = parseXml(program);
    } catch (e) {
      throw new Mj3Error(`XML: ${e instanceof XmlError ? e.message : (e as Error).message}`);
    }
    const inside = roots[0]?.children.filter((c) => c.name !== 'color') ?? [];
    const stray = strayNodes(inside);
    if (stray.length) throw new Mj3Error(`<worn>: ${stray.slice(0, 3).join(', ')} non va qui (solo ${WORN_NODES.slice(0, 6).join(', ')} e le loro regole: il corpo non si conosce, niente forme né coordinate)`);
    if (!inside.length) throw new Mj3Error('<worn>: nessuna regola');
    const m = compileMjx(program);
    return { program: m.program };
  } catch (e) {
    return { error: e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}` };
  }
}

/** Compiled worn programs of this thread, by their text (the same thing on many bodies compiles once). */
const compiled = new Map<string, ReturnType<typeof compileWorn>>();
function compiledWorn(program: string): ReturnType<typeof compileWorn> {
  let c = compiled.get(program);
  if (!c) {
    if (compiled.size >= 128) compiled.delete(compiled.keys().next().value!);
    compiled.set(program, (c = compileWorn(program)));
  }
  return c;
}

/** Every cell within `r` voxels (Chebyshev) of a marked one. */
function dilate(g: VoxelGrid, mark: Uint8Array, r: number): Uint8Array {
  let cur = mark;
  const { X, Y, Z } = g;
  const step = [1, X, X * Y];
  const dims = [X, Y, Z];
  for (let a = 0; a < 3; a++) {
    const next = new Uint8Array(cur.length);
    for (let i = 0; i < cur.length; i++) {
      if (!cur[i]) continue;
      const p = a === 0 ? i % X : a === 1 ? Math.floor(i / X) % Y : Math.floor(i / (X * Y));
      for (let d = -r; d <= r; d++) if (p + d >= 0 && p + d < dims[a]) next[i + d * step[a]] = 1;
    }
    cur = next;
  }
  return cur;
}

/** Where the rules of a thing may write in a zone's frame: the air round the zone (r), and the middle line of it (m). */
export function reachOf(g: VoxelGrid, cells: readonly number[], zone: WornZone, upright: boolean, solid: (code: number) => boolean): { reach: Uint8Array; middle: number } {
  const b = bounds(g, cells);
  const reach = new Uint8Array(g.cells.length);
  const middle = Math.round(b.mean[0]);
  if (zone === 'back') {
    // Behind the back, from the shoulders down to the ground standing, to the end of the back on all fours.
    const bottom = upright ? 1 : b.min[2] - 2;
    for (let z = Math.max(0, bottom); z <= Math.min(g.Z - 1, b.max[2] + 2); z++)
      for (let y = Math.max(0, b.min[1] - 3); y <= Math.min(g.Y - 1, b.max[1]); y++)
        for (let x = Math.max(0, b.min[0] - 2); x <= Math.min(g.X - 1, b.max[0] + 2); x++) {
          const i = x + y * g.X + z * g.X * g.Y;
          if (!solid(g.cells[i])) reach[i] = 1;
        }
    return { reach, middle };
  }
  const mark = new Uint8Array(g.cells.length);
  for (const c of cells) mark[c] = 1;
  const near = dilate(g, mark, REACH[zone]);
  for (let i = 0; i < near.length; i++) {
    if (!near[i] || solid(g.cells[i])) continue;
    const z = Math.floor(i / (g.X * g.Y));
    if (z < b.min[2] || (zone === 'torso' && z > b.max[2])) continue;
    reach[i] = 1;
  }
  return { reach, middle };
}

/**
 * Way B: the thing's worn program run on a copy of the body, in the zone's frame. Nothing changes unless it finishes in time and
 * writes something: then `why` says what went wrong, and the caller falls back to C.
 */
export function wearB(d: Dressing, body: Body, zone: WornZone, program: Program3, seed = 1): Change {
  const out: Change = { zone, way: 'B', added: 0, recoloured: 0 };
  const frame = frameOf(d, body, zone);
  const g = frame.grid;
  if (!frame.cells.length) return { ...out, fault: 'zone', why: 'il corpo non ha questa zona' };
  const colors = colorTable(g.alphabet, d.palette);
  const solid = (code: number) => !!colors[code];
  // The body's letters out of the rules' reach: characters no program can name.
  const alphabet = g.alphabet.map((ch, i) => (i === 0 ? ch : String.fromCharCode(HIDDEN_LETTERS + i)));
  const [Z, O, R, M] = [...WORN_MARKS].map((ch) => alphabet.push(ch) - 1);
  const cells = new Uint8Array(g.cells);
  const zoneSet = new Uint8Array(cells.length);
  for (const c of frame.cells) zoneSet[c] = 1;
  const { reach, middle } = reachOf(g, frame.cells, zone, body.upright, solid);
  for (let i = 0; i < cells.length; i++) {
    const c = g.cells[i];
    // What another thing put on is the body now, for this one: other (o), never its zone.
    if (zoneSet[i] && solid(c) && !d.worn.has(c)) cells[i] = Z;
    else if (solid(c)) cells[i] = O;
    else if (reach[i]) cells[i] = i % g.X === middle ? M : R;
  }
  // The rest of the body, as it was before the rules: whatever they write there is not theirs to write (a limb, a thing put on before).
  const other = new Uint8Array(cells.length);
  for (let i = 0; i < cells.length; i++) if (cells[i] === O) other[i] = 1;
  const work = { X: g.X, Y: g.Y, Z: g.Z, cells, alphabet, log: [] as number[], epoch: 0 };
  let run: ReturnType<typeof runOn>;
  try {
    run = runOn(work, program, seed, WORN_STEPS, WORN_LIMITS, { deadline: WORN_TIME_MS });
  } catch (e) {
    return { ...out, fault: 'error', why: e instanceof Mj3Error ? e.message : `errore: ${(e as Error).message}` };
  }
  out.steps = run.steps;
  if (!run.finished) return { ...out, fault: 'time', why: `le regole non finiscono in ${WORN_TIME_MS} ms né in ${WORN_STEPS} passi` };
  // What the rules wrote in the thing's letters, before anything changes. A voxel of the body is never taken away: whatever the rules
  // made of z and o goes back to the body, and r, m and the empty cell are air.
  const hidden = (ch: string) => ch.charCodeAt(0) >= HIDDEN_LETTERS && ch.charCodeAt(0) < HIDDEN_LETTERS + MAX_CODES;
  const writes: Array<[number, number]> = [];
  for (let i = 0; i < cells.length; i++) {
    const ch = work.alphabet[work.cells[i]];
    if (other[i] || ch === 'z' || ch === 'o' || ch === 'r' || ch === 'm' || ch === '.' || hidden(ch)) continue;
    writes.push([i, work.cells[i]]);
  }
  if (!writes.length) return { ...out, fault: 'nothing', why: 'le regole non scrivono niente su questo corpo' };
  const codes = new Map<number, number>();
  for (const [, code] of writes) {
    if (codes.has(code)) continue;
    const mine = letter(d, program.palette[work.alphabet[code]]);
    if (mine < 0) return { ...out, fault: 'letters', why: 'troppe lettere per un corpo solo (al più 255)' };
    codes.set(code, mine);
  }
  for (const [i, code] of writes) {
    if (solid(g.cells[i])) out.recoloured++;
    else out.added++;
    g.cells[i] = codes.get(code)!;
  }
  for (const c of codes.values()) d.worn.add(c);
  settle(d, frame);
  return out;
}

// --- A whole outfit ---------------------------------------------------------------------------------------------------------------

/** One thing worn: its zone, its two colours (C, and B's fallback), its worn program for that zone if it has one (B, `wornProgram`). */
export interface WornPiece {
  zone: WornZone;
  colors: PaletteEntry[];
  program?: string;
}

export interface DressedBody extends Dressed {
  body: Body;
  /** The room added round the bare body (`PAD`). */
  pad: number;
  changes: Change[];
}

/**
 * A body wearing `pieces` (one per zone, the first if more): the body in a padded box, its zones, then each thing, the outer first,
 * by B where it has a worn program that works on this body, by C otherwise.
 */
export function dressBody(base: Dressed, pieces: readonly WornPiece[], seed = 1): DressedBody {
  const p = padded(base, PAD);
  const d: Dressing = { ...p, worn: new Set() };
  const body = bodyOf(d.grid, d.palette);
  const changes: Change[] = [];
  for (const zone of DRESSING_ORDER) {
    const piece = pieces.find((x) => x.zone === zone);
    if (!piece) continue;
    let failed: Pick<Change, 'fault' | 'why'> | undefined;
    if (piece.program) {
      const c = compiledWorn(piece.program);
      if ('error' in c) failed = { fault: 'error', why: c.error };
      else {
        const b = wearB(d, body, zone, c.program, seed);
        if (!b.fault) {
          changes.push(b);
          continue;
        }
        failed = { fault: b.fault, why: b.why };
      }
    }
    changes.push({ ...wearC(d, body, zone, piece.colors), ...failed });
  }
  return { grid: d.grid, palette: d.palette, body, pad: PAD, changes };
}

// --- Bodies to try a section on ---------------------------------------------------------------------------------------------------

/**
 * Two bodies made by the kernel, without a program: one standing (legs, arms, a torso, a head) and one on all fours (four legs, a
 * long body, a head forward, a tail). The validator and the Sculptor's checks try a worn section on both, as the world will on any.
 */
let trials: Array<{ name: string } & Dressed> | undefined;
export function trialBodies(): Array<{ name: string } & Dressed> {
  return (trials ??= makeTrialBodies());
}

function makeTrialBodies(): Array<{ name: string } & Dressed> {
  const make = (X: number, Y: number, Z: number, paint: (set: (x: number, y: number, z: number, ch: number) => void) => void) => {
    const cells = new Uint8Array(X * Y * Z);
    paint((x, y, z, ch) => {
      if (x >= 0 && y >= 0 && z >= 0 && x < X && y < Y && z < Z) cells[x + y * X + z * X * Y] = ch;
    });
    return { X, Y, Z, cells, alphabet: ['.', 'S', 'L', 'A', 'H', 'T'] };
  };
  const palette: Record<string, PaletteEntry> = {
    S: { name: 'skin', color: '#b07850' },
    L: { name: 'legs', color: '#4a3424', part: 'leg' },
    A: { name: 'arms', color: '#8a6040', part: 'arm' },
    H: { name: 'hair', color: '#3a2a1a' },
    T: { name: 'tail', color: '#6a4a2a', part: 'tail' },
  };
  const box = (set: (x: number, y: number, z: number, ch: number) => void, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, ch: number) => {
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, z, ch);
  };
  // Standing: 14 wide, 8 deep, 30 tall; the face toward +y.
  const standing = make(14, 8, 30, (set) => {
    box(set, 3, 2, 0, 5, 5, 11, 2);
    box(set, 8, 2, 0, 10, 5, 11, 2);
    box(set, 3, 1, 12, 10, 6, 20, 1);
    box(set, 0, 2, 11, 2, 5, 20, 3);
    box(set, 11, 2, 11, 13, 5, 20, 3);
    box(set, 6, 3, 21, 7, 4, 21, 1);
    box(set, 4, 1, 22, 9, 6, 28, 1);
    box(set, 4, 1, 29, 9, 5, 29, 4);
    box(set, 4, 1, 25, 9, 1, 28, 4);
  });
  // On all fours: 10 wide, 26 long, 16 tall; the head toward +y.
  const prone = make(10, 26, 16, (set) => {
    for (const [x, y] of [[2, 5], [6, 5], [2, 16], [6, 16]]) box(set, x, y, 0, x + 1, y + 2, 6, 2);
    box(set, 1, 4, 7, 8, 19, 12, 1);
    box(set, 3, 19, 10, 6, 20, 13, 1);
    box(set, 2, 21, 10, 7, 25, 15, 1);
    box(set, 4, 0, 10, 5, 3, 11, 5);
  });
  return [
    { name: 'in piedi', grid: standing, palette },
    { name: 'a quattro zampe', grid: prone, palette },
  ];
}

/**
 * What is wrong with the worn sections of a program, for the validator and the Sculptor (`[]` when nothing): every section names a
 * zone (`head`, `torso`, `back`), one per zone, compiles with the thing's letters (`palette` of the compiled program, `background`
 * its empty cell), and on the bodies of `trialBodies` finishes in time and writes something on at least one.
 */
export function wornErrors(xml: string, thing: { background: string; palette: Record<string, PaletteEntry> }): string[] {
  const sections = wornSections(xml);
  if (!sections.length) return [];
  const errors: string[] = [];
  // The root first: the kernel writes the box on the first element of a program.
  if (/<(?![!/?])([a-z]+)/i.exec(bare(xml))?.[1] === 'worn') errors.push('<worn> va dopo il programma, non prima: il primo elemento è il nodo radice');
  const seen = new Set<string>();
  for (const s of sections) {
    const where = `<worn> (riga ${s.line})`;
    if (!isWornZone(s.zone)) {
      errors.push(`${where}: zone="${s.zone}" non è una zona (${WORN_ZONES.join(', ')})`);
      continue;
    }
    if (seen.has(s.zone)) {
      errors.push(`${where}: una sola sezione per zona (${s.zone} c'è già)`);
      continue;
    }
    seen.add(s.zone);
    let program: string | undefined;
    try {
      program = wornProgram(xml, s.zone, thing);
    } catch (e) {
      errors.push(`${where}: ${(e as Error).message}`);
      continue;
    }
    const c = compileWorn(program!);
    if ('error' in c) {
      errors.push(`${where}: ${c.error}`);
      continue;
    }
    let wrote = false;
    let broken: string | undefined;
    for (const t of trialBodies()) {
      const d: Dressing = { ...padded(t, PAD), worn: new Set() };
      const r = wearB(d, bodyOf(d.grid, d.palette), s.zone, c.program, 1);
      if (r.fault === 'error' || r.fault === 'time' || r.fault === 'letters') {
        broken = `${where}, sul corpo di prova ${t.name}: ${r.why}`;
        break;
      }
      if (!r.fault) wrote = true;
    }
    if (broken) errors.push(broken);
    else if (!wrote) errors.push(`${where}: le regole non scrivono niente né sul corpo in piedi né su quello a quattro zampe (scrivono le lettere della cosa su r, m o z?)`);
  }
  return errors;
}
