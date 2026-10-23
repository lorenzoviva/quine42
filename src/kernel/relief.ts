// The relief of the simulation (ADR-0048): how high the ground is on every tile. It comes from
// MarkovJunior's own `Hills` example (models.xml, 40×40×12), the universe's `world/rilievo.xml` if it
// has one: air grows down from the sky into the earth, a convolution smooths it, and the top of the
// earth in each column is a height.
//
// The world has no edges, a MarkovJunior grid does: two runs of the program on boxes of coprime sides
// (64 and 45) are read as tiles that repeat, their seams mended so that neighbours differ by at most one
// level, and the height of a tile is the sum of the two (it repeats only every 2880 tiles). Each run
// keeps neighbours within one level, so the sum keeps them within two: a level is a quarter of a tile,
// a step is at most half a tile and the wanderer climbs it — the relief is never an obstacle
// (AGENTS.md rule 10: what looks impassable is; a hill does not look it).
//
// Deterministic from the universe's seed and the coordinates; the same in Node and in the browser.

import { compileMjx } from '../mj/model';
import { runMjx } from '../mj/run';
import { hash32 } from './rng';

export const RELIEF_PATH = 'world/rilievo.xml';

/** MarkovJunior's `Hills` (github.com/mxgmn/MarkovJunior, MIT, © 2022 Maxim Gumin), unchanged. */
export const HILLS = `<sequence values="BA">
  <prl in="B" out="A"/>
  <prl in="A *" out="B *" symmetry="()"/>
  <one in="AB" out="AA" steps="8000"/>
  <convolution neighborhood="NoCorners" periodic="True">
    <rule in="B" out="A" sum="10..18" values="A"/>
    <rule in="A" out="B" sum="10..18" values="B"/>
  </convolution>
</sequence>`;

/** Height of a level, in tiles. */
export const LEVEL = 0.25;
/** The two repeating boxes: coprime sides, `Hills`' own height. */
const SIDES = [64, 45];
const DEPTH = 12;
/** `Hills` is written for 40×40: its growth steps are scaled with the box. */
const HILLS_AREA = 40 * 40;

/** A heightmap that repeats with period `n` on both axes. */
interface Tile {
  n: number;
  h: Uint8Array;
}

/** The program's steps scaled to a box of side n, so a larger box grows as many hills per tile. */
function scaled(xml: string, n: number): string {
  return xml.replace(/steps="(\d+)"/g, (_, s) => `steps="${Math.round((Number(s) * n * n) / HILLS_AREA)}"`);
}

/** Runs the program on an n×n box and reads the top of the earth (the program's last value) per column. */
function runTile(xml: string, n: number, seed: number): Tile {
  const m = compileMjx(scaled(xml, n), { size: [n, n, DEPTH] });
  const g = runMjx(m, seed, { deadline: 4_000 }).grid;
  const h = new Uint8Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let top = 0;
      for (let z = 0; z < DEPTH; z++) if (g.cells[x + y * n + z * n * n] !== 0) top = z + 1;
      h[x + y * n] = top;
    }
  mend(h, n);
  return { n, h };
}

/** Lowers what stands more than one level above a neighbour (across the wrap too), until none does. */
export function mend(h: Uint8Array, n: number): void {
  for (let changed = true; changed; ) {
    changed = false;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const i = x + y * n;
        const low = Math.min(h[((x + 1) % n) + y * n], h[((x + n - 1) % n) + y * n], h[x + ((y + 1) % n) * n], h[x + ((y + n - 1) % n) * n]);
        if (h[i] > low + 1) {
          h[i] = low + 1;
          changed = true;
        }
      }
  }
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export class Relief {
  private tiles: Tile[] = [];
  private base = 0;
  /** Levels above the lowest point of the world (0 = the lowest). */
  readonly max: number;

  constructor(seed: number, xml = HILLS) {
    this.tiles = SIDES.map((n, i) => runTile(xml, n, hash32(seed, 4242, i)));
    const lo = this.tiles.map((t) => Math.min(...t.h));
    const hi = this.tiles.map((t) => Math.max(...t.h));
    this.base = lo[0] + lo[1];
    this.max = hi[0] + hi[1] - this.base;
  }

  /** The level of a tile (an integer, 0 the lowest). */
  level(col: number, row: number): number {
    let s = -this.base;
    for (const t of this.tiles) s += t.h[mod(col, t.n) + mod(row, t.n) * t.n];
    return s;
  }

  /** The height of a tile's ground, in tiles. */
  height(col: number, row: number): number {
    return this.level(col, row) * LEVEL;
  }
}

/**
 * Water lies flat: each body of water of a chunk (its liquid tiles, joined by their sides) is as high as
 * the lowest of them; -1 for what is not water. Only the chunk's own tiles count, so it is the same
 * whatever is loaded around it; where a river crosses into the next chunk it may fall a step.
 */
export function waterLevels(tiles: string, size: number, liquid: (code: string) => boolean, level: (c: number, r: number) => number): Int16Array {
  const out = new Int16Array(size * size).fill(-1);
  const seen = new Uint8Array(size * size);
  for (let start = 0; start < size * size; start++) {
    if (seen[start] || !liquid(tiles[start])) continue;
    const body = [start];
    seen[start] = 1;
    let low = Infinity;
    for (let i = 0; i < body.length; i++) {
      const t = body[i];
      const c = t % size, r = (t - c) / size;
      low = Math.min(low, level(c, r));
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        const n = nc + nr * size;
        if (nc < 0 || nr < 0 || nc >= size || nr >= size || seen[n] || !liquid(tiles[n])) continue;
        seen[n] = 1;
        body.push(n);
      }
    }
    for (const t of body) out[t] = low;
  }
  return out;
}

/** A lot of a chunk, in its cells (inclusive): a structure stands on it (ADR-0043). */
export interface Lot {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * The level of every tile of a chunk (ADR-0048, flat lots): water lies flat (`waterLevels`); every lot
 * is flat at the median level of its tiles, or as near as the border and the lots already laid allow (the
 * larger lots first, a tile keeps the first lot that takes it), and so is a ring of one tile around it where the land allows; the rest of the chunk bends towards
 * them, so that neighbours on land still differ by at most two levels, while the chunk's border keeps the
 * relief and meets the next chunk as before. Only the chunk's own tiles count, as for water.
 */
export function chunkLevels(tiles: string, size: number, liquid: (code: string) => boolean, level: (c: number, r: number) => number, lots: Lot[]): Int16Array {
  const S = size;
  const out = waterLevels(tiles, S, liquid, level);
  const wet = (i: number) => liquid(tiles[i]);
  // 0 free, 1 fixed by the relief (the border), 2 fixed by a lot, 3 free but starting at a lot's level (its ring, where it cannot be flat).
  const fixed = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) {
    if (wet(i)) continue;
    const c = i % S, r = (i - c) / S;
    out[i] = level(c, r);
    if (c === 0 || r === 0 || c === S - 1 || r === S - 1) fixed[i] = 1;
  }
  const order = lots.map((l, i) => ({ l, i, area: (l.x1 - l.x0 + 1) * (l.y1 - l.y0 + 1) })).sort((a, b) => b.area - a.area || a.i - b.i);
  // Within two levels a tile of what is already fixed, so that the land between can still be climbed.
  const reach = (x0: number, y0: number, x1: number, y1: number) => {
    let lo = -Infinity, hi = Infinity;
    for (let i = 0; i < S * S; i++) {
      if (fixed[i] !== 1 && fixed[i] !== 2) continue;
      const c = i % S, r = (i - c) / S;
      const d = Math.max(0, x0 - c, c - x1) + Math.max(0, y0 - r, r - y1);
      if (d === 0) continue;
      lo = Math.max(lo, out[i] - 2 * d);
      hi = Math.min(hi, out[i] + 2 * d);
    }
    return [lo, hi];
  };
  // The lots first, then their rings (inside the border, which stays the relief), which yield where they must.
  const flats = new Map<Lot, number>();
  for (const { l } of order) {
    const own: number[] = [];
    for (let r = Math.max(0, l.y0); r <= Math.min(S - 1, l.y1); r++) for (let c = Math.max(0, l.x0); c <= Math.min(S - 1, l.x1); c++) if (!wet(r * S + c)) own.push(level(c, r));
    if (!own.length) continue;
    own.sort((a, b) => a - b);
    const [lo, hi] = reach(l.x0, l.y0, l.x1, l.y1);
    const flat = Math.min(hi, Math.max(lo, own[own.length >> 1]));
    flats.set(l, flat);
    for (let r = Math.max(0, l.y0); r <= Math.min(S - 1, l.y1); r++)
      for (let c = Math.max(0, l.x0); c <= Math.min(S - 1, l.x1); c++) {
        const i = r * S + c;
        if (wet(i) || fixed[i] === 2) continue;
        out[i] = flat;
        fixed[i] = 2;
      }
  }
  for (const [l, flat] of flats)
    for (let r = Math.max(1, l.y0 - 1); r <= Math.min(S - 2, l.y1 + 1); r++)
      for (let c = Math.max(1, l.x0 - 1); c <= Math.min(S - 2, l.x1 + 1); c++) {
        const i = r * S + c;
        if (wet(i) || fixed[i] >= 2) continue;
        out[i] = flat;
        const [lo, hi] = reach(c, r, c, r);
        fixed[i] = flat >= lo && flat <= hi ? 2 : 3;
      }
  if (!order.length) return out;
  // The free land between: each tile within two levels of its neighbours on land, until it settles.
  for (let pass = 0, changed = true; changed && pass < 4 * S; pass++) {
    changed = false;
    for (let i = 0; i < S * S; i++) {
      if ((fixed[i] && fixed[i] !== 3) || wet(i)) continue;
      const c = i % S, r = (i - c) / S;
      let lo = -Infinity, hi = Infinity;
      for (const n of [c > 0 ? i - 1 : -1, c < S - 1 ? i + 1 : -1, r > 0 ? i - S : -1, r < S - 1 ? i + S : -1]) {
        if (n < 0 || wet(n)) continue;
        lo = Math.max(lo, out[n] - 2);
        hi = Math.min(hi, out[n] + 2);
      }
      const v = lo <= hi ? Math.min(hi, Math.max(lo, out[i])) : Math.round((lo + hi) / 2);
      if (v !== out[i]) {
        out[i] = v;
        changed = true;
      }
    }
  }
  return out;
}
