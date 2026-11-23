// The lot of more places (T370, ADR-0206; T404, ADR-0208): a Gargantuan structure does not fit a place of 18 tiles; it stands on a block of
// places, in the middle of it, with a ring of tiles around it where the gates of the places are joined by the paths the kernel digs (rule
// 10). A block is 2 × 2 places (36 × 36 tiles) with a lot of 25 tiles (`GARGANTUAN_LOT`) unless it says otherwise: the side its structure
// asks for (`blockShapeFor`), 3 × 3 places with a lot of 50 tiles for the author's fort at 10 voxels a tile (D61). Pure geometry, the same
// for the world, the model of places and the tests:
//   - a block is named by its top-left place (`BlockMark`), with its side in places and its lot in tiles when they are not the default;
//   - its lot is a square of world tiles in the middle of its places (`blockLot`), cut by every place (`lotIn`);
//   - the cells of a place under the lot are reserved (`reservedCells`): the environment's program does not write them, no path goes
//     through them, nothing is put on them; the kernel makes them ground and the structure blocks with its voxels;
//   - a gate of an edge between two places of the block that falls under the lot is moved into the ring (`blockGates`), the same for the
//     two places that share it, so the ring goes round the structure without leaving the block;
//   - the lot is flat at one level for all the places (`blockLevel`), from the relief alone: the same whatever is loaded.

import { hash32 } from './rng';
import { GARGANTUAN_LOT } from '../mj/classes';

/** Places a side of a block that does not say its own (T370): the lot of 25 tiles of a Gargantuan structure at 20 voxels a tile. */
export const BLOCK = 2;

/** The most places a side of a block may have (T404, D61): 3 × 3, nine places loaded together, measured with the author's fort. */
export const MAX_BLOCK = 3;

/** Tiles of ring a block keeps on every side of its lot at least: the edge of the lot one walks and the border of the places. */
export const RING = 2;

/** A block, by its top-left place (chunk coordinates); its side in places and its lot in tiles when they are not `BLOCK` and `GARGANTUAN_LOT`. */
export interface BlockMark {
  x: number;
  y: number;
  /** Places a side (T404): `BLOCK` if it does not say. */
  side?: number;
  /** Tiles a side of its lot (T404): `GARGANTUAN_LOT` if it does not say. */
  lot?: number;
}

/** A block of the world: its top-left place and the place whose plan has the structure (`anchor`, a chunk key). */
export interface Block extends BlockMark {
  anchor: string;
}

/** The shape of a block: places a side and tiles a side of its lot. */
export interface BlockShape {
  side: number;
  lot: number;
}

/** Places a side of a block. */
export const sideOf = (b: BlockMark): number => b.side ?? BLOCK;

/** Tiles a side of a block's lot: what it says, within its places less the ring. */
export const lotSideOf = (b: BlockMark, S: number): number => Math.min(b.lot ?? GARGANTUAN_LOT, sideOf(b) * S - 2 * RING);

/**
 * The block a Gargantuan structure of `tiles` a side asks for (T404): its lot as large as the structure (never under `GARGANTUAN_LOT`, the
 * lot of T370), the fewest places a side that hold it with the ring, from `BLOCK` to `MAX_BLOCK`; none past them (the structure goes down).
 */
export function blockShapeFor(tiles: number, S: number): BlockShape | undefined {
  if (!Number.isFinite(tiles) || tiles <= 0) return undefined;
  const lot = Math.max(GARGANTUAN_LOT, Math.ceil(tiles - 1e-9));
  for (let side = BLOCK; side <= MAX_BLOCK; side++) if (side * S - 2 * RING >= lot) return { side, lot };
  return undefined;
}

/** A block's mark as plans and the state keep it: the side and the lot only when they are not the default (the 2 × 2 blocks of T370 as they were). */
export function markOf(b: BlockMark): BlockMark {
  return { x: b.x, y: b.y, ...(b.side !== undefined && b.side !== BLOCK ? { side: b.side } : {}), ...(b.lot !== undefined && b.lot !== GARGANTUAN_LOT ? { lot: b.lot } : {}) };
}

/** A rectangle of tiles, inclusive: world tiles for `blockLot`, a place's cells for `lotIn` (which may go past the place). */
export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const blockKey = (b: BlockMark): string => `${b.x},${b.y}`;

/** The places of a block, top-left first, in rows: [cx, cy]. */
export function blockPlaces(b: BlockMark): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const n = sideOf(b);
  for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) out.push([b.x + dx, b.y + dy]);
  return out;
}

/** Whether the place (cx, cy) is one of the block's. */
export const inBlock = (b: BlockMark, cx: number, cy: number): boolean => cx >= b.x && cy >= b.y && cx < b.x + sideOf(b) && cy < b.y + sideOf(b);

/**
 * The blocks of a shape (2 × 2 with the lot of 25 if none) a place may be part of, in a fixed order: the one where it is the top-left place
 * first, then going left and up.
 */
export function blocksAround(cx: number, cy: number, shape?: BlockShape): BlockMark[] {
  const out: BlockMark[] = [];
  const n = shape?.side ?? BLOCK;
  for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) out.push(markOf({ x: cx - dx, y: cy - dy, ...(shape ?? {}) }));
  return out;
}

/**
 * The lot of a block in world tiles: a square in the middle of its places (`lotSideOf`): 25 tiles in the 36 of 2 × 2 places, five tiles of
 * ring before it and six after; 50 tiles in the 54 of 3 × 3, two and two (T404).
 */
export function blockLot(b: BlockMark, S: number): TileRect {
  const n = lotSideOf(b, S), all = sideOf(b) * S;
  const x0 = b.x * S + Math.floor((all - n) / 2), y0 = b.y * S + Math.floor((all - n) / 2);
  return { x0, y0, x1: x0 + n - 1, y1: y0 + n - 1 };
}

/** The block's lot in the cells of the place (cx, cy): the same rectangle, from the place's top-left corner (it goes past the place). */
export function lotIn(b: BlockMark, S: number, cx: number, cy: number): TileRect {
  const l = blockLot(b, S);
  return { x0: l.x0 - cx * S, y0: l.y0 - cy * S, x1: l.x1 - cx * S, y1: l.y1 - cy * S };
}

/** The cells of the place (cx, cy) under the block's lot (row * S + col): all of them for the middle place of a block of 3 × 3. */
export function reservedCells(b: BlockMark, S: number, cx: number, cy: number): Set<number> {
  const l = lotIn(b, S, cx, cy);
  const out = new Set<number>();
  for (let r = Math.max(0, l.y0); r <= Math.min(S - 1, l.y1); r++) for (let c = Math.max(0, l.x0); c <= Math.min(S - 1, l.x1); c++) out.add(r * S + c);
  return out;
}

/**
 * The four gates of a place of a block, as `gates` in layout.ts gives them ([west, east, north, south], cells of the place), with the gate
 * of an edge between two places of the block moved into the ring when the lot covers it: along the edge, out of the lot, never at the two
 * cells of a corner, chosen by a hash of the edge (the same for the two places that share it, as `gates` does). Where the ring is two tiles
 * (a block of 3 × 3 with its lot of 50, T404) only the cell beside the corner is out of the lot: the gate goes there, on the edge of the
 * lot one walks. An edge the lot covers whole (the middle place of 3 × 3) keeps its gate under the lot, where nothing reaches it.
 */
export function blockGates(standard: number[], b: BlockMark, S: number, seed: number, cx: number, cy: number): number[] {
  const reserved = reservedCells(b, S, cx, cy);
  const l = lotIn(b, S, cx, cy);
  const last = b.x + sideOf(b) - 1, bottom = b.y + sideOf(b) - 1;
  const out = [...standard];
  // [west, east, north, south]: which edge is inside the block, and the edge's identity as `gates` hashes it.
  const edges: Array<{ inside: boolean; vertical: boolean; at: number; id: [number, number, number] }> = [
    { inside: cx > b.x, vertical: true, at: 0, id: [cx, cy, 1] },
    { inside: cx < last, vertical: true, at: S - 1, id: [cx + 1, cy, 1] },
    { inside: cy > b.y, vertical: false, at: 0, id: [cx, cy, 2] },
    { inside: cy < bottom, vertical: false, at: S - 1, id: [cx, cy + 1, 2] },
  ];
  edges.forEach((e, i) => {
    if (!e.inside || !reserved.has(out[i])) return;
    const [lo, hi] = e.vertical ? [l.y0, l.y1] : [l.x0, l.x1];
    const outside = (from: number, to: number) => {
      const free: number[] = [];
      for (let a = from; a <= to; a++) if (a < lo || a > hi) free.push(a);
      return free;
    };
    const wide = outside(2, S - 3);
    const free = wide.length ? wide : outside(1, S - 2);
    if (!free.length) return;
    const a = free[hash32(seed, ...e.id, 37) % free.length];
    out[i] = e.vertical ? a * S + e.at : e.at * S + a;
  });
  return out;
}

/**
 * The level the block's lot lies flat at, for all its places: the median of the relief over the lot (never below the sea), kept within
 * two levels a tile of the relief on the borders of its places outside the lot, which stays as the relief has it (ADR-0048), so the
 * ring between is climbed as ever. With `keepCliffs` (T475, true relief) the lot is a plateau at its own median without bending to distant
 * cliffs at the border: the network joins its apron to the gates with ramps. From the relief alone: the places, loaded or not, a thin
 * client and the model of places agree.
 */
export function blockLevel(b: BlockMark, S: number, level: (col: number, row: number) => number, sea: number, keepCliffs = false): number {
  const l = blockLot(b, S);
  const own: number[] = [];
  for (let r = l.y0; r <= l.y1; r++) for (let c = l.x0; c <= l.x1; c++) own.push(Math.max(sea, level(c, r)));
  own.sort((a, z) => a - z);
  const median = own[own.length >> 1];
  if (keepCliffs) return median;
  let lo = -Infinity, hi = Infinity;
  for (const [px, py] of blockPlaces(b))
    for (let i = 0; i < S; i++)
      for (const [c, r] of [[i, 0], [i, S - 1], [0, i], [S - 1, i]]) {
        const col = px * S + c, row = py * S + r;
        const d = Math.max(0, l.x0 - col, col - l.x1) + Math.max(0, l.y0 - row, row - l.y1);
        if (d === 0) continue;
        const v = Math.max(sea, level(col, row));
        lo = Math.max(lo, v - 2 * d);
        hi = Math.min(hi, v + 2 * d);
      }
  return Math.min(hi, Math.max(lo, median));
}

/** A whole number from `lo` to `hi`; undefined if absent, null if present and anything else. */
function wholeIn(v: unknown, lo: number, hi: number): number | undefined | null {
  if (v === undefined) return undefined;
  return Number.isSafeInteger(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : null;
}

/**
 * A block mark read from a plan or a state (`{ x, y }`, whole numbers; `side` from `BLOCK` to `MAX_BLOCK` and `lot` from 1 to 1000 if it
 * says them, T404): anything else is none, a side or a lot that is not a sane number too (the geometry of the places hangs on them).
 */
export function readBlockMark(v: unknown): BlockMark | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const { x, y, side, lot } = v as Record<string, unknown>;
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return undefined;
  const n = wholeIn(side, BLOCK, MAX_BLOCK), l = wholeIn(lot, 1, 1000);
  if (n === null || l === null) return undefined;
  return markOf({ x: x as number, y: y as number, ...(n !== undefined ? { side: n } : {}), ...(l !== undefined ? { lot: l } : {}) });
}

/**
 * The blocks of a state (`world/state.json → blocks`: top-left place «x,y» → the anchor's chunk key, or `{ anchor, side, lot }` for a block
 * that is not 2 × 2 with the lot of 25, T404), repaired: the anchor is one of its places.
 */
export function readBlocks(v: unknown): Block[] {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return [];
  const out: Block[] = [];
  for (const [k, a] of Object.entries(v as Record<string, unknown>)) {
    const m = /^(-?\d+),(-?\d+)$/.exec(k);
    const shaped = a && typeof a === 'object' && !Array.isArray(a) ? (a as Record<string, unknown>) : undefined;
    const anchor = typeof a === 'string' ? a : typeof shaped?.anchor === 'string' ? shaped.anchor : undefined;
    const n = anchor !== undefined ? /^(-?\d+),(-?\d+)$/.exec(anchor) : null;
    if (!m || !n) continue;
    const b = readBlockMark({ x: Number(m[1]), y: Number(m[2]), ...(shaped ? { side: shaped.side, lot: shaped.lot } : {}) });
    if (b && inBlock(b, Number(n[1]), Number(n[2]))) out.push({ ...b, anchor: anchor! });
  }
  return out;
}

/** A block as `world/state.json → blocks` keeps it: the anchor, with the side and the lot when they are not the default (T404). */
export function blockRecord(b: Block): string | { anchor: string; side?: number; lot?: number } {
  const { side, lot } = markOf(b);
  return side === undefined && lot === undefined ? b.anchor : { anchor: b.anchor, ...(side !== undefined ? { side } : {}), ...(lot !== undefined ? { lot } : {}) };
}
