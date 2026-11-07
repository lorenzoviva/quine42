// Where a thing is worn on a body (T289): the head, the torso and the back of any figure, from its voxels and its rig, as the
// hands of src/mj/hold.ts come from the arms. The three ways of the bench (ways.ts) all start from here: what a worn mesh is fitted
// to (A), where the rules of an item write (B), what the kernel recolours (C). Nothing here is in the game: the bench measures it.
//
// - The plan of the body: a figure with three legs or more stands on all fours and its long axis is y (it looks toward large y, as
//   every model); one with two legs or none stands up, its long axis is z. A body on all fours that is much taller than long counts
//   as standing, and the reverse.
// - The core: the visible voxels that are not a limb of the rig (legs, arms, tail; the head when the palette names it).
// - The neck: along the long axis, the slice of the core that is narrowest against the widest on each side of it; the head is
//   what lies beyond. With a `head` part in the palette, the head is that part. Without a narrowing, a share of the core.
// - Per slice along the long axis only the main pieces of the core count: a staff or an antenna beside the head is not the head.
// - The torso: the core from the hips (the top of the legs) to the neck; the back: its rear half, or its upper half on all fours.
//
// The frame of a zone (`toCanonical`): heads look toward +y on every body; a torso on all fours is turned a quarter round x, so that
// its long axis is up, its back toward −y and its belly toward +y, like a standing one. A worn program and the rules of an item are
// written once, in that frame, for every body.

import type { PaletteEntry, Vec3 } from '../../../src/mj/engine';
import { colorTable, type VoxelGrid } from '../../../src/mj/mesh';
import { rig, type Limb } from '../../../src/mj/rig';

export type ZoneId = 'head' | 'torso' | 'back';
export const ZONES: readonly ZoneId[] = ['head', 'torso', 'back'];

export interface Zone {
  id: ZoneId;
  /** Body voxels of the zone, as indices of the body's grid. */
  cells: number[];
  /** Their bounds, inclusive, in voxels of the body's grid. */
  min: Vec3;
  max: Vec3;
}

export interface Body {
  grid: VoxelGrid;
  palette: Record<string, PaletteEntry>;
  vpt: number;
  /** 1 where a voxel is seen. */
  solid: Uint8Array;
  /** Per voxel, the index of its limb in `limbs`, or -1. */
  limbOf: Int16Array;
  limbs: Limb[];
  /** Standing (long axis z) or on all fours (long axis y). */
  upright: boolean;
  /** Where the neck is along the long axis (the last slice of the torso), and how it was found. */
  neck: { at: number; found: 'rig' | 'narrowing' | 'share' };
  zones: Partial<Record<ZoneId, Zone>>;
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
  // The slice as a 2D grid: u is always x, v is z (a slice of y) or y (a slice of z).
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
  const most = Math.max(...pieces.map((p) => p.length));
  return pieces.filter((p) => p.length >= MAIN_PIECE * most).flat();
}

function bounds(g: VoxelGrid, cells: readonly number[]): { min: Vec3; max: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const c of cells) {
    const p = coordsOf(g, c);
    for (let a = 0; a < 3; a++) {
      if (p[a] < min[a]) min[a] = p[a];
      if (p[a] > max[a]) max[a] = p[a];
    }
  }
  return { min, max };
}

const zone = (g: VoxelGrid, id: ZoneId, cells: number[]): Zone | undefined => (cells.length ? { id, cells, ...bounds(g, cells) } : undefined);

/**
 * A voxel that is no limb but has more of one limb than of the body round it is that limb's skin: the light on a wolf's tail is
 * painted over it in a letter without a part, and would make the tail a piece of the back (a lone voxel on a limb is its skin too).
 * Twice, so that a skin two voxels deep goes too; only for the zones (the rig of the game is as it is).
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

/** The body of a figure: its rig, its plan, its neck and its zones. */
export function bodyOf(grid: VoxelGrid, palette: Record<string, PaletteEntry>, vpt: number): Body {
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
  for (let i = 0; i < n; i++) if (solid[i] && limbOf[i] < 0) core[i] = 1;
  const legs = limbs.filter((l) => l.part === 'leg');
  const coreCells = [...core.keys()].filter((i) => core[i]);
  const heads = limbs.filter((l) => l.part === 'head').sort((a, b) => b.cells.length - a.cells.length);
  const extent = bounds(g, [...coreCells, ...heads.flatMap((h) => h.cells)]);
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
    neck = { at: Math.min(...headCells.map(along)) - 1, found: 'rig' };
  } else {
    const area = slices.map((s) => s.length);
    const from = Math.round(lo + (upright ? 0.35 : 0.45) * span);
    const to = Math.round(lo + (upright ? 0.85 : 0.9) * span);
    let best = Infinity;
    const scores: Array<[number, number]> = [];
    for (let t = from; t <= to; t++) {
      const before = Math.max(0, ...area.slice(lo, t));
      const after = Math.max(0, ...area.slice(t + 1, hi + 1));
      const side = Math.min(before, after);
      if (side <= 0) continue;
      const score = area[t] / side;
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
  // palette, every slice past the hips that is not the head (a body leaning forward has its back beside the head). The hips are
  // the top of the legs, if the legs end well under the neck, and never lower than a quarter of the way up to it: a long robe
  // or a skirt is not a chest.
  const head = new Set(headCells);
  let hips = lo;
  if (upright) {
    const legTop = legs.length ? Math.max(...legs.flatMap((l) => l.cells.map((c) => coordsOf(g, c)[2]))) : -1;
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
  return {
    grid: g,
    palette,
    vpt,
    solid,
    limbOf,
    limbs,
    upright,
    neck,
    zones: Object.fromEntries(
      ([['head', headCells], ['torso', torsoCells], ['back', backCells]] as Array<[ZoneId, number[]]>).flatMap(([id, cells]) => {
        const z = zone(g, id, cells);
        return z ? [[id, z]] : [];
      }),
    ),
  };
}

// --- The frame of a zone --------------------------------------------------------------------------------------------------------

/** Whether a zone of this body is turned to be written on: a torso or a back on all fours. */
export const turned = (b: Pick<Body, 'upright'>, id: ZoneId) => !b.upright && id !== 'head';

/**
 * A grid turned a quarter round x, so that what was up looks toward −y and what was forward looks up: (x, y, z) → (x, Z−1−z, y).
 * A body on all fours then stands like a standing one, its back toward −y. `back` undoes it.
 */
export function turnUp<T extends VoxelGrid>(g: T): T {
  const { X, Y, Z } = g;
  const cells = new Uint8Array(g.cells.length);
  // New sizes: X, Z, Y.
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) cells[x + (Z - 1 - z) * X + y * X * Z] = g.cells[x + y * X + z * X * Y];
  return { ...g, X, Y: Z, Z: Y, cells };
}

/** The inverse of `turnUp`: (x, y', z') → (x, z', Z−1−y'), where Z is the height before turning (the turned grid's Y). */
export function turnBack<T extends VoxelGrid>(g: T): T {
  const { X, Y, Z } = g;
  const cells = new Uint8Array(g.cells.length);
  // Before turning the sizes were X, Z (this Z), Y (this Y).
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) cells[x + z * X + (Y - 1 - y) * X * Z] = g.cells[x + y * X + z * X * Y];
  return { ...g, X, Y: Z, Z: Y, cells };
}

/** Where a cell of the body's grid is in the turned grid (same index if the zone is not turned). */
export function turnIndex(g: VoxelGrid, i: number): number {
  const [x, y, z] = coordsOf(g, i);
  return x + (g.Z - 1 - z) * g.X + y * g.X * g.Z;
}

/** A map of the zones, for the pictures: every zone voxel in a colour of its own over the body (head red, torso blue, back green). */
export function zoneMap(b: Body): { grid: VoxelGrid; palette: Record<string, PaletteEntry> } {
  const g = b.grid;
  const alphabet = [...g.alphabet];
  const palette: Record<string, PaletteEntry> = { ...b.palette };
  const add = (ch: string, color: string) => {
    if (!alphabet.includes(ch)) alphabet.push(ch);
    palette[ch] = { name: ch, color };
    return alphabet.indexOf(ch);
  };
  const codes = { head: add('à', '#e0483c'), torso: add('è', '#3c70e0'), back: add('ì', '#3cc060'), limb: add('ò', '#9a9a9a') };
  const cells = new Uint8Array(g.cells);
  for (let i = 0; i < cells.length; i++) if (b.solid[i]) cells[i] = b.limbOf[i] >= 0 && b.limbs[b.limbOf[i]].part !== 'head' ? codes.limb : g.cells[i];
  for (const id of ['torso', 'back', 'head'] as const) for (const c of b.zones[id]?.cells ?? []) cells[c] = codes[id];
  return { grid: { ...g, cells, alphabet }, palette };
}

