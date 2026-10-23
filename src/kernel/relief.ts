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
