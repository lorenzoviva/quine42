// The lot of more places (T370, ADR-0206): a Gargantuan structure, 25 × 25 tiles (`GARGANTUAN_LOT`), does not fit a place of 18; it stands
// on a block of 2 × 2 places (36 × 36 tiles), in the middle of it, with a ring of five or six tiles around it where the gates of the four
// places are joined by the paths the kernel digs (rule 10). Pure geometry, the same for the world, the model of places and the tests:
//   - a block is named by its top-left place (`BlockMark`), its places are the four from there;
//   - its lot is a square of world tiles centred on the corner the four places share (`blockLot`), cut by every place (`lotIn`);
//   - the cells of a place under the lot are reserved (`reservedCells`): the environment's program does not write them, no path goes
//     through them, nothing is put on them; the kernel makes them ground and the structure blocks with its voxels;
//   - a gate of an edge between two places of the block that falls under the lot is moved into the ring (`blockGates`), the same for the
//     two places that share it, so the ring goes round the structure without leaving the block;
//   - the lot is flat at one level for the four places (`blockLevel`), from the relief alone: the same whatever is loaded.

import { hash32 } from './rng';
import { GARGANTUAN_LOT } from '../mj/classes';

/** Places a side of a block. */
export const BLOCK = 2;

/** A block, by its top-left place (chunk coordinates). */
export interface BlockMark {
  x: number;
  y: number;
}

/** A block of the world: its top-left place and the place whose plan has the structure (`anchor`, a chunk key). */
export interface Block extends BlockMark {
  anchor: string;
}

/** A rectangle of tiles, inclusive: world tiles for `blockLot`, a place's cells for `lotIn` (which may go past the place). */
export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const blockKey = (b: BlockMark): string => `${b.x},${b.y}`;

/** The four places of a block, top-left first, in rows: [cx, cy]. */
export function blockPlaces(b: BlockMark): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let dy = 0; dy < BLOCK; dy++) for (let dx = 0; dx < BLOCK; dx++) out.push([b.x + dx, b.y + dy]);
  return out;
}

/** Whether the place (cx, cy) is one of the block's. */
export const inBlock = (b: BlockMark, cx: number, cy: number): boolean => cx >= b.x && cy >= b.y && cx < b.x + BLOCK && cy < b.y + BLOCK;

/** The blocks a place may be part of, in a fixed order: the one where it is the top-left place first, then going left and up. */
export function blocksAround(cx: number, cy: number): BlockMark[] {
  const out: BlockMark[] = [];
  for (let dy = 0; dy < BLOCK; dy++) for (let dx = 0; dx < BLOCK; dx++) out.push({ x: cx - dx, y: cy - dy });
  return out;
}

/** The lot of a block in world tiles: a square of `side` tiles in the middle of its 2 × 2 places (5 tiles of ring before it, 6 after, at 18). */
export function blockLot(b: BlockMark, S: number, side = GARGANTUAN_LOT): TileRect {
  const n = Math.min(side, BLOCK * S - 4);
  const x0 = b.x * S + Math.floor((BLOCK * S - n) / 2), y0 = b.y * S + Math.floor((BLOCK * S - n) / 2);
  return { x0, y0, x1: x0 + n - 1, y1: y0 + n - 1 };
}

/** The block's lot in the cells of the place (cx, cy): the same rectangle, from the place's top-left corner (it goes past the place). */
export function lotIn(b: BlockMark, S: number, cx: number, cy: number, side = GARGANTUAN_LOT): TileRect {
  const l = blockLot(b, S, side);
  return { x0: l.x0 - cx * S, y0: l.y0 - cy * S, x1: l.x1 - cx * S, y1: l.y1 - cy * S };
}

/** The cells of the place (cx, cy) under the block's lot (row * S + col). */
export function reservedCells(b: BlockMark, S: number, cx: number, cy: number, side = GARGANTUAN_LOT): Set<number> {
  const l = lotIn(b, S, cx, cy, side);
  const out = new Set<number>();
  for (let r = Math.max(0, l.y0); r <= Math.min(S - 1, l.y1); r++) for (let c = Math.max(0, l.x0); c <= Math.min(S - 1, l.x1); c++) out.add(r * S + c);
  return out;
}

/**
 * The four gates of a place of a block, as `gates` in layout.ts gives them ([west, east, north, south], cells of the place), with the gate
 * of an edge between two places of the block moved into the ring when the lot covers it: along the edge, out of the lot, never at the two
 * cells of a corner, chosen by a hash of the edge (the same for the two places that share it, as `gates` does).
 */
export function blockGates(standard: number[], b: BlockMark, S: number, seed: number, cx: number, cy: number, side = GARGANTUAN_LOT): number[] {
  const reserved = reservedCells(b, S, cx, cy, side);
  const l = lotIn(b, S, cx, cy, side);
  const out = [...standard];
  // [west, east, north, south]: which edge is inside the block, and the edge's identity as `gates` hashes it.
  const edges: Array<{ inside: boolean; vertical: boolean; at: number; id: [number, number, number] }> = [
    { inside: cx === b.x + 1, vertical: true, at: 0, id: [cx, cy, 1] },
    { inside: cx === b.x, vertical: true, at: S - 1, id: [cx + 1, cy, 1] },
    { inside: cy === b.y + 1, vertical: false, at: 0, id: [cx, cy, 2] },
    { inside: cy === b.y, vertical: false, at: S - 1, id: [cx, cy + 1, 2] },
  ];
  edges.forEach((e, i) => {
    if (!e.inside || !reserved.has(out[i])) return;
    const [lo, hi] = e.vertical ? [l.y0, l.y1] : [l.x0, l.x1];
    const free: number[] = [];
    for (let a = 2; a <= S - 3; a++) if (a < lo || a > hi) free.push(a);
    if (!free.length) return;
    const a = free[hash32(seed, ...e.id, 37) % free.length];
    out[i] = e.vertical ? a * S + e.at : e.at * S + a;
  });
  return out;
}

/**
 * The level the block's lot lies flat at, for its four places: the median of the relief over the lot (never below the sea), kept within
 * two levels a tile of the relief on the borders of the four places outside the lot, which stays as the relief has it (ADR-0048), so the
 * ring between is climbed as ever. From the relief alone: the four places, loaded or not, a thin client and the model of places agree.
 */
export function blockLevel(b: BlockMark, S: number, level: (col: number, row: number) => number, sea: number, side = GARGANTUAN_LOT): number {
  const l = blockLot(b, S, side);
  const own: number[] = [];
  for (let r = l.y0; r <= l.y1; r++) for (let c = l.x0; c <= l.x1; c++) own.push(Math.max(sea, level(c, r)));
  own.sort((a, z) => a - z);
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
  return Math.min(hi, Math.max(lo, own[own.length >> 1]));
}

/** A block mark read from a plan or a state (`{ x, y }`, whole numbers): anything else is none. */
export function readBlockMark(v: unknown): BlockMark | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const { x, y } = v as Record<string, unknown>;
  return Number.isSafeInteger(x) && Number.isSafeInteger(y) ? { x: x as number, y: y as number } : undefined;
}

/** The blocks of a state (`world/state.json → blocks`: top-left place «x,y» → the anchor's chunk key), repaired: the anchor is one of its places. */
export function readBlocks(v: unknown): Block[] {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return [];
  const out: Block[] = [];
  for (const [k, a] of Object.entries(v as Record<string, unknown>)) {
    const m = /^(-?\d+),(-?\d+)$/.exec(k), n = typeof a === 'string' ? /^(-?\d+),(-?\d+)$/.exec(a) : null;
    if (!m || !n) continue;
    const b = { x: Number(m[1]), y: Number(m[2]) };
    if (inBlock(b, Number(n[1]), Number(n[2]))) out.push({ ...b, anchor: a as string });
  }
  return out;
}
