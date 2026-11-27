// The measures of a fabric (T543), the same for both ways: a grid of bays, each with its pattern. Rule 10 on the graph of the bricks (from
// the streets and the ring around, through passages and doors within a step and the inner seams one walks: the stairs, the cores floor to
// floor, the outdoor stair), the rooms (bays of rooms whose open sides meet: their size in bays and whether they hold a square of 2 × 2 bays,
// 4 × 4 tiles), the pairs the set does not allow, the bricks used. The kernel's walk on the voxels (`walkIn`) is in the script.

import { DX, DY, DZ } from '../../../src/mj/wfc';
import type { Grid3 } from '../../../src/mj/engine';
import { overlap, STEP, type BrickSet, type Pattern } from './facce';
import { ALPHABET, C, H } from './tasselli';

export interface Fabric {
  set: BrickSet;
  X: number;
  Y: number;
  Z: number;
  /** The pattern of every bay (x + y·X + z·X·Y). */
  at: Int32Array;
  /** The letter of the massing of every bay (the sources of the walk are its streets and its ring). */
  letter: (x: number, y: number, z: number) => string;
}

/** A bay a body stands in: not the air, not the well of a stair or of the turret. */
export const walkable = (p: Pattern) =>
  p.brick.family !== 'air' && !((p.brick.family === 'stair' || p.brick.family === 'xstair') && p.orig === '0,0,1') && !(p.brick.family === 'turret' && p.orig === '0,1,0');

/** Two bays of one brick that meet at a label: whether a body walks through (the brick's own seams; the core from landing to landing). */
function seam(p: Pattern, q: Pattern, label: string): boolean {
  if (label.startsWith('fusto:')) return p.orig.split(',')[1] === '0' && q.orig.split(',')[1] === '0';
  return (p.brick.walk ?? []).some(([a, b]) => (a === p.orig && b === q.orig) || (a === q.orig && b === p.orig));
}

/** Whether a body goes from bay p to its neighbour q in direction d (0-3 sides, 4 up, 5 down). */
export function goes(p: Pattern, q: Pattern, d: number): boolean {
  if (!walkable(q)) return false;
  const a = p.faces[d], b = q.faces[d < 4 ? (d + 2) % 4 : d === 4 ? 5 : 4];
  if (a.k === 'L' || b.k === 'L') return a.k === 'L' && b.k === 'L' && a.label === b.label && seam(p, q, a.label);
  if (d >= 4) return false;
  if (a.k !== 'P' && a.k !== 'D') return false;
  if (b.k !== 'P' && b.k !== 'D') return false;
  if (Math.abs(a.h - b.h) > STEP || !overlap(a, b)) return false;
  return !(a.k === 'P' && b.k === 'P' && a.io !== b.io);
}

/**
 * The bays reached on foot, from the sources: the bays of street (S) on the ground and every walkable bay of the ground on the ring around
 * the grid (the places around, the lot's ring). `window` keeps the walk inside a rectangle: with `edge: 'all'` every walkable bay of its
 * edge counts as reached (a region's check, T522); with `edge: 'ground'` only what the kernel's walk around the window enters, the bays of
 * its edge on the ground whose side out of the window is a passage (to compare with `walkIn` on the same window).
 */
export function reachedBays(f: Fabric, window?: { x0: number; y0: number; x1: number; y1: number; edge: 'all' | 'ground' }): Uint8Array {
  const { X, Y, Z, at, set } = f;
  const seen = new Uint8Array(X * Y * Z);
  const stack: number[] = [];
  const w = window ?? { x0: 0, y0: 0, x1: X - 1, y1: Y - 1, edge: undefined };
  for (let y = w.y0; y <= w.y1; y++)
    for (let x = w.x0; x <= w.x1; x++) {
      const ring = x === 0 || y === 0 || x === X - 1 || y === Y - 1;
      for (let z = 0; z < Z; z++) {
        const i = x + y * X + z * X * Y;
        const p = set.patterns[at[i]];
        if (!walkable(p)) continue;
        const outward = [x === w.x1, y === w.y1, x === w.x0, y === w.y0];
        const source = window
          ? w.edge === 'all'
            ? outward.some(Boolean) || (z === 0 && f.letter(x, y, 0) === 'S')
            : z === 0 && outward.some((o, d) => o && (p.faces[d].k === 'P' || p.faces[d].k === 'D'))
          : z === 0 && (f.letter(x, y, 0) === 'S' || ring);
        if (source) {
          seen[i] = 1;
          stack.push(i);
        }
      }
    }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
    const p = set.patterns[at[i]];
    for (let d = 0; d < 6; d++) {
      const nx = x + DX[d], ny = y + DY[d], nz = z + DZ[d];
      if (nx < w.x0 || ny < w.y0 || nx > w.x1 || ny > w.y1 || nz < 0 || nz >= Z) continue;
      const j = nx + ny * X + nz * X * Y;
      if (seen[j] || !goes(p, set.patterns[at[j]], d)) continue;
      seen[j] = 1;
      stack.push(j);
    }
  }
  return seen;
}

export interface Reach {
  /** Bays of rooms and corridors on the ground, above it; of stairs, cores and turrets; of roofs; of bridges and outdoor stairs; of yards: reached and in all. */
  ground: [number, number];
  above: [number, number];
  stairs: [number, number];
  roofs: [number, number];
  bridges: [number, number];
  yards: [number, number];
}

/** The walkable bays by kind, reached and in all. */
export function reachOf(f: Fabric, seen: Uint8Array, rect?: { x0: number; y0: number; x1: number; y1: number }): Reach {
  const out: Reach = { ground: [0, 0], above: [0, 0], stairs: [0, 0], roofs: [0, 0], bridges: [0, 0], yards: [0, 0] };
  const r = rect ?? { x0: 1, y0: 1, x1: f.X - 2, y1: f.Y - 2 };
  for (let z = 0; z < f.Z; z++)
    for (let y = r.y0; y <= r.y1; y++)
      for (let x = r.x0; x <= r.x1; x++) {
        const i = x + y * f.X + z * f.X * f.Y;
        const p = f.set.patterns[f.at[i]];
        if (!walkable(p)) continue;
        const fam = p.brick.family;
        const bin =
          fam === 'room' || fam === 'corridor' ? (z === 0 ? out.ground : out.above) : fam === 'stair' || fam === 'core' || fam === 'turret' ? out.stairs : fam === 'roof' ? out.roofs : fam === 'bridge' || fam === 'xstair' ? out.bridges : fam === 'yard' ? out.yards : undefined;
        if (!bin) continue;
        bin[1]++;
        if (seen[i]) bin[0]++;
      }
  return out;
}

export interface Rooms {
  /** Rooms (bays of rooms joined by open sides inside), their bays, and how many hold a square of 2 × 2 bays (4 × 4 tiles). */
  rooms: number;
  bays: number;
  square: number;
  /** Bays in the rooms that hold such a square. */
  baysInSquare: number;
  /** Rooms by size in bays (1, 2, 3, 4-5, 6-9, 10+). */
  sizes: Record<string, number>;
  largest: number;
}

/** The rooms of a fabric: on every storey, the bays of rooms whose facing sides are both open inside, joined. */
export function roomsOf(f: Fabric, rect?: { x0: number; y0: number; x1: number; y1: number }): Rooms {
  const { X, Y, Z, at, set } = f;
  const r = rect ?? { x0: 1, y0: 1, x1: X - 2, y1: Y - 2 };
  const seen = new Uint8Array(X * Y * Z);
  const out: Rooms = { rooms: 0, bays: 0, square: 0, baysInSquare: 0, sizes: { '1': 0, '2': 0, '3': 0, '4-5': 0, '6-9': 0, '10+': 0 }, largest: 0 };
  const isRoom = (i: number) => set.patterns[at[i]].brick.family === 'room';
  for (let z = 0; z < Z; z++)
    for (let y = r.y0; y <= r.y1; y++)
      for (let x = r.x0; x <= r.x1; x++) {
        const i0 = x + y * X + z * X * Y;
        if (seen[i0] || !isRoom(i0)) continue;
        const members: number[] = [];
        const stack = [i0];
        seen[i0] = 1;
        while (stack.length) {
          const i = stack.pop()!;
          members.push(i);
          const cx = i % X, cy = Math.floor(i / X) % Y;
          const p = set.patterns[at[i]];
          for (let d = 0; d < 4; d++) {
            const nx = cx + DX[d], ny = cy + DY[d];
            if (nx < r.x0 || ny < r.y0 || nx > r.x1 || ny > r.y1) continue;
            const j = nx + ny * X + z * X * Y;
            if (seen[j] || !isRoom(j)) continue;
            const a = p.faces[d], b = set.patterns[at[j]].faces[(d + 2) % 4];
            if (a.k === 'P' && b.k === 'P' && a.io === 'i' && b.io === 'i') {
              seen[j] = 1;
              stack.push(j);
            }
          }
        }
        const n = members.length;
        const cells = new Set(members.map((i) => `${i % X},${Math.floor(i / X) % Y}`));
        const square = members.some((i) => {
          const cx = i % X, cy = Math.floor(i / X) % Y;
          return cells.has(`${cx + 1},${cy}`) && cells.has(`${cx},${cy + 1}`) && cells.has(`${cx + 1},${cy + 1}`);
        });
        out.rooms++;
        out.bays += n;
        if (square) out.square++, (out.baysInSquare += n);
        out.largest = Math.max(out.largest, n);
        out.sizes[n === 1 ? '1' : n === 2 ? '2' : n === 3 ? '3' : n <= 5 ? '4-5' : n <= 9 ? '6-9' : '10+']++;
      }
  return out;
}

/** Pairs of neighbouring bays the set does not allow: zero for a valid fabric. */
export function violations(f: Fabric): number {
  const { X, Y, Z, at, set } = f;
  let bad = 0;
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const p = at[x + y * X + z * X * Y];
        for (const d of [0, 1, 4]) {
          const nx = x + DX[d], ny = y + DY[d], nz = z + DZ[d];
          if (nx >= X || ny >= Y || nz >= Z) continue;
          const q = at[nx + ny * X + nz * X * Y];
          if (!set.propagator[d][p].includes(q)) bad++;
        }
      }
  return bad;
}

/** The bricks a fabric uses (bays of each, the air left out), how many of the set's, and the entropy of their use in bits. */
export function bricksUsed(f: Fabric): { counts: Map<string, number>; used: number; of: number; entropy: number } {
  const counts = new Map<string, number>();
  for (const t of f.at) {
    const b = f.set.patterns[t].brick;
    if (b.family === 'air') continue;
    counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  let entropy = 0;
  for (const n of counts.values()) entropy -= (n / total) * Math.log2(n / total);
  return { counts, used: counts.size, of: f.set.bricks.filter((b) => b.family !== 'air').length, entropy };
}

/** The share of bays (not air in both) whose brick differs between two fabrics of the same massing grid. */
export function difference(a: Fabric, b: Fabric): number {
  let n = 0, diff = 0;
  for (let i = 0; i < a.at.length; i++) {
    const pa = a.set.patterns[a.at[i]], pb = b.set.patterns[b.at[i]];
    if (pa.brick.family === 'air' && pb.brick.family === 'air') continue;
    n++;
    if (pa.brick.name !== pb.brick.name || pa.t !== pb.t) diff++;
  }
  return n ? diff / n : 0;
}

/** How the colours of a fabric's voxels are spread (the letters of its bays, counted): what a set looks like, to compare sets. */
export function looks(f: Fabric): Float64Array {
  const counts = new Float64Array(ALPHABET.length);
  for (const t of f.at) {
    const v = f.set.patterns[t].voxels.cells;
    for (let k = 0; k < v.length; k += 7) counts[v[k]]++;
  }
  counts[0] = 0;
  const total = counts.reduce((a, b) => a + b, 0);
  return counts.map((c) => c / total);
}

/** Half the L1 distance of two spreads (0 the same, 1 nothing in common). */
export const spread = (a: Float64Array, b: Float64Array) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / 2;

/** The voxels of a rectangle of bays, every `step`-th voxel (what a cube of step³ holds, its first solid). */
export function voxelsOf(f: Fabric, x0: number, y0: number, x1: number, y1: number, step = 1, z1 = f.Z - 1): Grid3 {
  const cw = C / step, ch = H / step;
  const X = (x1 - x0 + 1) * cw, Y = (y1 - y0 + 1) * cw, Z = (z1 + 1) * ch;
  const cells = new Uint8Array(X * Y * Z);
  for (let gz = 0; gz <= z1; gz++)
    for (let gy = y0; gy <= y1; gy++)
      for (let gx = x0; gx <= x1; gx++) {
        const b = f.set.patterns[f.at[gx + gy * f.X + gz * f.X * f.Y]].voxels;
        for (let z = 0; z < ch; z++)
          for (let y = 0; y < cw; y++)
            for (let x = 0; x < cw; x++) {
              let v = 0;
              for (let k = 0; k < step * step * step && !v; k++) v = b.get(x * step + (k % step), y * step + (Math.floor(k / step) % step), z * step + Math.floor(k / (step * step)));
              if (v) cells[(gx - x0) * cw + x + ((gy - y0) * cw + y) * X + (gz * ch + z) * X * Y] = v;
            }
      }
  return { X, Y, Z, cells, alphabet: [...ALPHABET], log: [], epoch: 0 };
}
