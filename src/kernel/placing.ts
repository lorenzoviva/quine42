// Putting things down on furniture (T291, ADR-0147). What the wanderer holds goes onto a shelf of the piece of furniture
// in front, where its shape fits. Pure functions on the true shapes of both: the floors of the furniture's form (`Levels`,
// the actions done on it included) and the item's model seen from above. A shelf is a floor of the furniture above its
// ground with room over it for the item; every column of the item stands on it, at the same height; the rectangle of the
// item's footprint takes room no other thing on the shelf takes, nor anyone standing there. So how many things a shelf
// holds is how many footprints it holds. Which shelf and where: the widest one the wanderer reaches, then, row by row, from
// the corner nearest to them (first fit, the same answer for the same world: no clock, no random).

import type { PaletteEntry } from '../mj/engine';
import { colorTable, type Levels, type VoxelGrid } from '../mj/mesh';
import type { Inventory } from './inventory';

/** The component of a thing lying on furniture (`posato`): the height (tiles) of the shelf it was put on. */
export interface PlacedComp {
  z: number;
}

/** A thing lying on furniture as the save keeps it (`posati` of `world/stato.json`): where, how high, turned how, and a bag's content. */
export interface PlacedRecord {
  item: string;
  count: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  inv?: Inventory;
}

/** What an item takes on a shelf: the columns of its model with something in them (seen from above), and how tall it is. */
export interface ItemShape {
  /** Per column of the item's grid (`x + y·X`): 1 where something of it is. */
  mask: Uint8Array;
  X: number;
  Y: number;
  /** Voxels per tile of its model. */
  vpt: number;
  /** Voxels from the bottom of its grid to the top of its highest voxel. */
  height: number;
}

/** The shape of an item from its form, or undefined if its model holds nothing. */
export function itemShape(g: VoxelGrid, palette: Record<string, PaletteEntry>, vpt: number): ItemShape | undefined {
  const colors = colorTable(g.alphabet, palette);
  const XY = g.X * g.Y;
  const mask = new Uint8Array(XY);
  let height = 0;
  for (let z = 0; z < g.Z; z++)
    for (let i = 0; i < XY; i++)
      if (colors[g.cells[i + z * XY]]) {
        mask[i] = 1;
        height = z + 1;
      }
  return height ? { mask, X: g.X, Y: g.Y, vpt, height } : undefined;
}

/** What stands in for an item whose model is not there (it failed): a small block, so that it still goes somewhere. */
export function blockShape(side = 8, height = 8, vpt = 20): ItemShape {
  return { mask: new Uint8Array(side * side).fill(1), X: side, Y: side, vpt, height };
}

/** A piece of furniture as a support: the floors of its form, the size of its grid, its density. */
export interface Support {
  levels: Levels;
  X: number;
  Y: number;
  vpt: number;
  /** Voxels of its model under the ground (a cellar): no floor down there is a shelf. */
  base: number;
}

/** Where an item lies on a support. */
export interface Spot {
  /** Its pivot (the middle of its grid, where it is drawn from) in the support's own frame: tiles from the support's centre. */
  x: number;
  y: number;
  /** The shelf it lies on: voxels from the bottom of the support's grid. */
  h: number;
  /** Quarter turns of the item against the support (its yaw is the support's plus these). */
  turns: number;
  /** The support's columns (`x + y·X`) its rectangle takes. */
  cells: number[];
}

/**
 * Why nothing goes there, from the farthest from going to the nearest: no shelf holds the item at all (a sign, a fire, a
 * shelf too small), only shelves out of reach above or below, only spots too far from the wanderer, every spot taken by
 * what lies there, or free of things but someone stands there.
 */
export type SpotFailure = 'nessun-piano' | 'alto' | 'lontano' | 'pieno' | 'occupato';

export interface SpotQuery {
  /** Columns taken by the rectangles of what already lies there, per shelf (its height in voxels). */
  things?: ReadonlyMap<number, ReadonlySet<number>>;
  /** Columns taken by who stands there, per shelf. */
  bodies?: ReadonlyMap<number, ReadonlySet<number>>;
  /** Where the one who puts it down stands, in the support's own frame (tiles from its centre). */
  from: { x: number; y: number };
  /** The farthest the item's pivot may be from them (tiles). */
  reach: number;
  /** The highest and the lowest shelf they reach (voxels from the bottom of the support's grid). */
  top: number;
  bottom: number;
}

const EPS = 1e-6;

/** A point of the item's own frame in the support's, the item turned by `turns` quarter turns as three.js turns a model by its yaw. */
export function turned(a: number, b: number, turns: number): [number, number] {
  switch (((Math.round(turns) % 4) + 4) % 4) {
    case 1:
      return [b, -a];
    case 2:
      return [-a, -b];
    case 3:
      return [-b, a];
    default:
      return [a, b];
  }
}

/** The quarter turns between two yaws (radians), the nearest whole number of them. */
export function turnsBetween(yaw: number, of: number): number {
  const t = Math.round((yaw - of) / (Math.PI / 2));
  return Number.isFinite(t) ? ((t % 4) + 4) % 4 : 0;
}

/** An item turned and laid on a support's grid: the columns under it and its rectangle, from the rectangle's corner. */
interface Pattern {
  /** Offsets `du + dv·W` of the columns under something of the item. */
  solid: number[];
  W: number;
  H: number;
  /** Its pivot from the rectangle's corner, in the support's voxels. */
  px: number;
  py: number;
  /** Its height in the support's voxels. */
  h: number;
  turns: number;
}

function patternOf(item: ItemShape, vpt: number, turns: number): Pattern | undefined {
  const k = vpt / item.vpt;
  const rects: Array<[number, number, number, number]> = [];
  let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
  for (let iy = 0; iy < item.Y; iy++)
    for (let ix = 0; ix < item.X; ix++) {
      if (!item.mask[ix + iy * item.X]) continue;
      const [u0, v0] = turned((ix - item.X / 2) * k, (iy - item.Y / 2) * k, turns);
      const [u1, v1] = turned((ix + 1 - item.X / 2) * k, (iy + 1 - item.Y / 2) * k, turns);
      const r: [number, number, number, number] = [Math.min(u0, u1), Math.min(v0, v1), Math.max(u0, u1), Math.max(v0, v1)];
      rects.push(r);
      minU = Math.min(minU, r[0]);
      minV = Math.min(minV, r[1]);
      maxU = Math.max(maxU, r[2]);
      maxV = Math.max(maxV, r[3]);
    }
  if (!rects.length) return undefined;
  const W = Math.max(1, Math.ceil(maxU - minU - EPS));
  const H = Math.max(1, Math.ceil(maxV - minV - EPS));
  const solid = new Set<number>();
  for (const [u0, v0, u1, v1] of rects)
    for (let dv = Math.max(0, Math.floor(v0 - minV + EPS)); dv < Math.min(H, Math.ceil(v1 - minV - EPS)); dv++)
      for (let du = Math.max(0, Math.floor(u0 - minU + EPS)); du < Math.min(W, Math.ceil(u1 - minU - EPS)); du++) solid.add(du + dv * W);
  return { solid: [...solid].sort((a, b) => a - b), W, H, px: -minU, py: -minV, h: Math.max(1, Math.ceil(item.height * k - EPS)), turns };
}

/**
 * The shelves of a support: per height (voxels from the bottom of its grid), the room over that floor in each column (voxels;
 * Infinity when nothing is above), 0 where the column has no floor there. Floors at its ground or under it are not shelves.
 */
export function shelvesOf(s: Support): Map<number, Float64Array> {
  const out = new Map<number, Float64Array>();
  const { start, z, base } = s.levels;
  const XY = s.X * s.Y;
  for (let i = 0; i < XY; i++)
    for (let l = start[i]; l < start[i + 1]; l++) {
      if (z[l] <= s.base) continue;
      let room = out.get(z[l]);
      if (!room) out.set(z[l], (room = new Float64Array(XY)));
      room[i] = l + 1 < start[i + 1] ? base[l + 1] - z[l] : Infinity;
    }
  return out;
}

/** The support's columns an item's rectangle takes, the item's pivot at (x, y) of the support's own frame, turned by `turns`. */
export function cellsOf(s: Support, item: ItemShape, x: number, y: number, turns: number): number[] {
  const p = patternOf(item, s.vpt, turns);
  if (!p || !Number.isFinite(x) || !Number.isFinite(y)) return [];
  const ax = Math.round(x * s.vpt + s.X / 2 - p.px), ay = Math.round(y * s.vpt + s.Y / 2 - p.py);
  const out: number[] = [];
  for (let dv = 0; dv < p.H; dv++)
    for (let du = 0; du < p.W; du++) {
      const cx = ax + du, cy = ay + dv;
      if (cx >= 0 && cy >= 0 && cx < s.X && cy < s.Y) out.push(cx + cy * s.X);
    }
  return out;
}

/** The support's columns whose middle is within `r` tiles of (x, y) of its own frame: where someone standing there is. */
export function discCells(s: Support, x: number, y: number, r: number): number[] {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !(r > 0)) return [];
  const out: number[] = [];
  const x0 = Math.max(0, Math.floor((x - r) * s.vpt + s.X / 2)), x1 = Math.min(s.X - 1, Math.floor((x + r) * s.vpt + s.X / 2));
  const y0 = Math.max(0, Math.floor((y - r) * s.vpt + s.Y / 2)), y1 = Math.min(s.Y - 1, Math.floor((y + r) * s.vpt + s.Y / 2));
  for (let cy = y0; cy <= y1; cy++)
    for (let cx = x0; cx <= x1; cx++) if (Math.hypot((cx + 0.5 - s.X / 2) / s.vpt - x, (cy + 0.5 - s.Y / 2) / s.vpt - y) <= r) out.push(cx + cy * s.X);
  return out;
}

/**
 * Where an item goes on a support, or why it does not (see `SpotFailure`). Every column under the item has a floor at the same
 * height with room for its height, and so do the columns around its pivot (where the kernel finds what it rests on); its rectangle
 * is inside the support's grid, out of every rectangle already there and of whoever stands there; the shelf is within reach.
 * The shelves are tried in the order they are preferred (the widest for the item, then the higher), the spots of each in the order
 * of their rows from the wanderer's side, each row from the end on their side, then the fewer turns: the first free one is the one.
 */
export function findSpot(s: Support, item: ItemShape, q: SpotQuery): { spot: Spot } | { fail: SpotFailure } {
  const patterns: Pattern[] = [];
  for (let t = 0; t < 4; t++) {
    const p = patternOf(item, s.vpt, t);
    // A shape that turns into one already there (a round pot) is tried once.
    if (p && !patterns.some((o) => o.W === p.W && o.H === p.H && o.px === p.px && o.py === p.py && o.solid.join() === p.solid.join())) patterns.push(p);
  }
  if (!patterns.length) return { fail: 'nessun-piano' };
  const need = patterns[0].h;
  const shelves = [...shelvesOf(s)]
    .map(([h, room]) => ({ h, room, area: room.reduce((n, r) => n + (r >= need ? 1 : 0), 0) }))
    .filter((x) => x.area > 0)
    .sort((a, b) => b.area - a.area || b.h - a.h);
  // Which way the wanderer looks at it: the axis they are farther along is the depth, their side of it is the near side.
  const depthX = Math.abs(q.from.x) >= Math.abs(q.from.y);
  const near = (depthX ? q.from.x : q.from.y) >= 0 ? 1 : -1;
  const side = (depthX ? q.from.y : q.from.x) >= 0 ? 1 : -1;
  let stage = 0;
  for (const { h, room } of shelves) {
    let found: { k: number; j: number; ax: number; ay: number; p: Pattern } | undefined;
    for (const p of patterns) {
      const nx = s.X - p.W + 1, ny = s.Y - p.H + 1;
      if (nx <= 0 || ny <= 0) continue;
      // The k-th row from the wanderer's side and its j-th place from the end on their side: the order of preference.
      const rows = depthX ? nx : ny, places = depthX ? ny : nx;
      scan: for (let k = 0; k < rows; k++)
        for (let j = 0; j < places; j++) {
          // Nothing further in this order beats what fewer turns found already.
          if (found && (k > found.k || (k === found.k && j >= found.j))) break scan;
          const a = near > 0 ? rows - 1 - k : k;
          const b = side > 0 ? places - 1 - j : j;
          const ax = depthX ? a : b, ay = depthX ? b : a;
          let fits = true;
          for (const o of p.solid) {
            if (room[ax + (o % p.W) + (ay + Math.floor(o / p.W)) * s.X] < need) {
              fits = false;
              break;
            }
          }
          if (!fits) continue;
          // What the kernel samples to rest it: the columns around its pivot have the shelf too.
          const px = ax + p.px, py = ay + p.py;
          for (const [dx, dy] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) {
            const cx = Math.floor(px + dx), cy = Math.floor(py + dy);
            if (cx < 0 || cy < 0 || cx >= s.X || cy >= s.Y || !(room[cx + cy * s.X] > 0)) fits = false;
          }
          if (!fits) continue;
          stage = Math.max(stage, 1);
          if (h > q.top || h < q.bottom) continue;
          stage = Math.max(stage, 2);
          if (Math.hypot((px - s.X / 2) / s.vpt - q.from.x, (py - s.Y / 2) / s.vpt - q.from.y) > q.reach) continue;
          stage = Math.max(stage, 3);
          // The rectangle against what lies there and who stands there, without making it a list (a big table has many places).
          const things = q.things?.get(h);
          const bodies = q.bodies?.get(h);
          let thing = false, body = false;
          for (let dv = 0; dv < p.H && !thing; dv++)
            for (let du = 0; du < p.W; du++) {
              const c = ax + du + (ay + dv) * s.X;
              if (things?.has(c)) {
                thing = true;
                break;
              }
              if (bodies?.has(c)) body = true;
            }
          if (thing) continue;
          stage = Math.max(stage, 4);
          if (body) continue;
          stage = 5;
          found = { k, j, ax, ay, p };
          break scan;
        }
    }
    if (found) {
      const { ax, ay, p } = found;
      const cells: number[] = [];
      for (let dv = 0; dv < p.H; dv++) for (let du = 0; du < p.W; du++) cells.push(ax + du + (ay + dv) * s.X);
      return { spot: { x: (ax + p.px - s.X / 2) / s.vpt, y: (ay + p.py - s.Y / 2) / s.vpt, h, turns: p.turns, cells } };
    }
  }
  return { fail: (['nessun-piano', 'alto', 'lontano', 'pieno', 'occupato'] as const)[stage] ?? 'nessun-piano' };
}
