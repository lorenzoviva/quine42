// The measures of T557, the same as T543's where they can be (lab/strutture-modulari/grande/misure.ts): rule 10 on the graph of the bays
// (from the streets, through the passages both bays have, the doors and stairs the stitching opened), by kind (rooms on the ground and
// above, stairs, terraces); the rooms; the bricks used and their entropy; the kernel's own walk on the voxels; and the stitching the
// kernel of T543 would do on the same wave (`kernelStitch`: a wall becomes a passage by dressing the two bays again with signatures of the
// same family that meet every other neighbour and lose no passage), to set it beside the stitching written in MarkovJunior.

import { walkIn } from '../../../src/kernel/forms';
import type { Grid3 } from '../../../src/mj/engine';
import { C, H, VPT } from './sorgente';
import { DIR, OPP } from './estrattore';
import { hashOf, type ExtractedSet } from './insieme';
import { bayStates, type Complex } from './programma';

export interface Fab {
  X: number;
  Y: number;
  Z: number;
  sig: Int32Array;
  state: string[];
}

const CARVED = ['E', 'S', 'W', 'N'];
/** A street with the stair outside toward a side (programma.ts). */
const OUTSIDE = ['F', 'G', 'J', 'K'];

/** The fabric after the first wave (stage 2) or the stitching (stage 3). */
export const fabricOf = (cx: Complex, g: Grid3): Fab | undefined => bayStates(cx, g);

/** The side a bay's state opened (a door), if any. */
const doorSide = (s: string) => {
  const i = CARVED.indexOf(s.toUpperCase());
  return i >= 0 ? i : -1;
};

/**
 * The bays reached on the graph: from the bays the set starts reached (streets, yards), through a side both bays pass (or a door the state
 * opened on it, with a passage or a door on the other side), up and down a stair of the set or one the stitching opened (U under, D or d over).
 */
export function reachOf(set: ExtractedSet, f: Fab, o: { doors?: boolean } = {}): Uint8Array {
  const { X, Y, Z, sig, state } = f;
  const doors = o.doors !== false;
  const seen = new Uint8Array(X * Y * Z);
  const stack: number[] = [];
  for (let i = 0; i < sig.length; i++)
    if (set.sigs[sig[i]].start === 'r') {
      seen[i] = 1;
      stack.push(i);
    }
  const passes = (i: number, d: number) => {
    const s = set.sigs[sig[i]];
    if (s.pass[d]) return true;
    if (!doors) return false;
    if (d < 4) return doorSide(state[i]) === d;
    return d === 4 ? state[i] === 'U' : state[i] === 'D' || state[i] === 'd';
  };
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
    for (let d = 0; d < 6; d++) {
      const nx = x + DIR[d][0], ny = y + DIR[d][1], nz = z + DIR[d][2];
      if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z) continue;
      const j = nx + ny * X + nz * X * Y;
      if (seen[j] || !set.sigs[sig[j]].node) continue;
      if (!passes(i, d) || !passes(j, d < 4 ? OPP[d] : d === 4 ? 5 : 4)) continue;
      seen[j] = 1;
      stack.push(j);
    }
    // Up the stair outside: from the street to the room a storey up beside it, through its door.
    const o = doors ? OUTSIDE.indexOf(state[i]) : -1;
    if (o >= 0 && z + 1 < Z) {
      const nx = x + DIR[o][0], ny = y + DIR[o][1];
      if (nx >= 0 && ny >= 0 && nx < X && ny < Y) {
        const j = nx + ny * X + (z + 1) * X * Y;
        if (!seen[j] && set.sigs[sig[j]].node && passes(j, OPP[o])) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
  }
  return seen;
}

export interface Reach {
  ground: [number, number];
  above: [number, number];
  stairs: [number, number];
  roofs: [number, number];
}

/** Bays to reach by kind, reached and in all (the ring of the lot left out: it is the street around). */
export function reachBy(set: ExtractedSet, f: Fab, seen: Uint8Array): Reach {
  const out: Reach = { ground: [0, 0], above: [0, 0], stairs: [0, 0], roofs: [0, 0] };
  for (let z = 0; z < f.Z; z++)
    for (let y = 1; y < f.Y - 1; y++)
      for (let x = 1; x < f.X - 1; x++) {
        const i = x + y * f.X + z * f.X * f.Y;
        const s = set.sigs[f.sig[i]];
        if (!s.node || s.start === 'r') continue;
        const bin = s.family === 'stair' ? out.stairs : s.family === 'roof' ? out.roofs : s.family === 'room' ? (z === 0 ? out.ground : out.above) : undefined;
        if (!bin) continue;
        bin[1]++;
        if (seen[i]) bin[0]++;
      }
  return out;
}

/**
 * The kernel's stitching of T543 on a fabric (a copy), on signatures: where a bay to reach is not reached and a reached one stands beside
 * it, both are dressed again with signatures of the same family and the same letters of the massing that meet every other neighbour as the
 * old ones did, lose no passage, and pass to each other; in a fixed order, until nothing more opens. No door is carved: the set's own bays.
 */
export function kernelStitch(set: ExtractedSet, f: Fab): { fab: Fab; opened: number; ms: number } {
  const t0 = performance.now();
  const fab: Fab = { ...f, sig: Int32Array.from(f.sig), state: [...f.state] };
  const { X, Y, Z, sig } = fab;
  const idx = (x: number, y: number, z: number) => (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? -1 : x + y * X + z * X * Y);
  const pos = new Map(set.wave.map((s, t) => [s, t]));
  const meets = (a: number, d: number, b: number) => set.propagator[d][pos.get(a)!].includes(pos.get(b)!);
  const sameRole = (a: number, b: number) => [...set.sigs[a].roles].some((r) => set.sigs[b].roles.has(r));
  const dressings = (i: number, d: number, skip: number): number[] => {
    const p = sig[i];
    const sp = set.sigs[p];
    const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
    const out: number[] = [];
    for (const q of set.wave) {
      const sq = set.sigs[q];
      if (sq.family !== sp.family || !sameRole(p, q) || !sq.pass[d]) continue;
      let ok = true;
      for (let e = 0; e < 6 && ok; e++) {
        const j = idx(x + DIR[e][0], y + DIR[e][1], z + DIR[e][2]);
        if (j < 0 || j === skip) continue;
        ok = meets(q, e, sig[j]);
        if (ok && sp.pass[e] && set.sigs[sig[j]].pass[e < 4 ? OPP[e] : e === 4 ? 5 : 4]) ok = sq.pass[e];
      }
      if (ok) out.push(q);
    }
    return out.sort((a, b) => (b === p ? 1 : 0) - (a === p ? 1 : 0) || set.sigs[b].weight - set.sigs[a].weight);
  };
  let opened = 0;
  for (let round = 0; round < 4000; round++) {
    const seen = reachOf(set, fab, { doors: false });
    let done = false;
    outer: for (let z = 0; z < Z; z++)
      for (let y = 0; y < Y; y++)
        for (let x = 0; x < X; x++) {
          const i = x + y * X + z * X * Y;
          const sb = set.sigs[sig[i]];
          if (seen[i] || !sb.node || sb.start !== 'u') continue;
          for (let d = 0; d < 4; d++) {
            const j = idx(x + DIR[d][0], y + DIR[d][1], z);
            if (j < 0 || !seen[j] || !set.sigs[sig[j]].node) continue;
            const od = OPP[d];
            const sa = set.sigs[sig[j]];
            const sidesA = sa.pass[od] ? [sig[j], ...dressings(j, od, i)] : dressings(j, od, i);
            const sidesB = sb.pass[d] ? [sig[i], ...dressings(i, d, j)] : dressings(i, d, j);
            for (const qa of sidesA)
              for (const qb of sidesB) {
                if (!meets(qa, od, qb) || !set.sigs[qa].pass[od] || !set.sigs[qb].pass[d]) continue;
                if (qa === sig[j] && qb === sig[i]) continue;
                opened += (qa !== sig[j] ? 1 : 0) + (qb !== sig[i] ? 1 : 0);
                sig[j] = qa;
                sig[i] = qb;
                done = true;
                break outer;
              }
          }
        }
    if (!done) break;
  }
  return { fab, opened, ms: performance.now() - t0 };
}

export interface Rooms {
  rooms: number;
  bays: number;
  largest: number;
  sizes: Record<string, number>;
}

/** The rooms: on every storey, bays of rooms joined by a side both pass with floor inside (doors aside: a door joins two rooms). */
export function roomsOf(set: ExtractedSet, f: Fab): Rooms {
  const { X, Y, Z, sig } = f;
  const seen = new Uint8Array(X * Y * Z);
  const out: Rooms = { rooms: 0, bays: 0, largest: 0, sizes: { '1': 0, '2': 0, '3-4': 0, '5-9': 0, '10+': 0 } };
  const isRoom = (i: number) => set.sigs[sig[i]].family === 'room' && set.sigs[sig[i]].indoor;
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const i0 = x + y * X + z * X * Y;
        if (seen[i0] || !isRoom(i0)) continue;
        let n = 0;
        const stack = [i0];
        seen[i0] = 1;
        while (stack.length) {
          const i = stack.pop()!;
          n++;
          const cx = i % X, cy = Math.floor(i / X) % Y;
          for (let d = 0; d < 4; d++) {
            const nx = cx + DIR[d][0], ny = cy + DIR[d][1];
            if (nx < 0 || ny < 0 || nx >= X || ny >= Y) continue;
            const j = nx + ny * X + z * X * Y;
            if (seen[j] || !isRoom(j)) continue;
            const a = set.sigs[sig[i]], b = set.sigs[sig[j]];
            if (a.pass[d] && b.pass[OPP[d]] && a.keys[d].startsWith('i') && b.keys[OPP[d]].startsWith('i')) {
              seen[j] = 1;
              stack.push(j);
            }
          }
        }
        out.rooms++;
        out.bays += n;
        out.largest = Math.max(out.largest, n);
        out.sizes[n === 1 ? '1' : n === 2 ? '2' : n <= 4 ? '3-4' : n <= 9 ? '5-9' : '10+']++;
      }
  return out;
}

/** The bays of the final grid, matched to the set's bays by their voxels: which bay (motif) every cell of the lot became. */
export function motifsOf(cx: Complex, g: Grid3, X: number, Y: number, Z: number): Int32Array {
  const byHash = new Map<string, number>();
  for (const mi of cx.motifs) byHash.set(hashOf(Uint8Array.from(cx.set.motifs[mi].voxels, (c) => (c ? g.alphabet.indexOf(cx.set.alphabet[c]) : 0))), mi);
  const out = new Int32Array(X * Y * Z).fill(-1);
  const bay = new Uint8Array(C * C * H);
  for (let k = 0; k < Z; k++)
    for (let j = 0; j < Y; j++)
      for (let i = 0; i < X; i++) {
        for (let z = 0; z < H; z++) for (let y = 0; y < C; y++) bay.set(g.cells.subarray(i * C + (j * C + y) * g.X + (k * H + z) * g.X * g.Y, i * C + C + (j * C + y) * g.X + (k * H + z) * g.X * g.Y), y * C + z * C * C);
        out[i + j * X + k * X * Y] = byHash.get(hashOf(bay)) ?? -1;
      }
  return out;
}

/** The bricks a lot uses (any turn of a brick is the brick; air and the plain street apart), and the entropy of their use. */
export function bricksUsed(set: ExtractedSet, motifs: Int32Array): { counts: Map<string, number>; used: number; of: number; entropy: number } {
  const counts = new Map<string, number>();
  for (const m of motifs) {
    if (m < 0) continue;
    const mo = set.motifs[m];
    const b = set.bricks[mo.brick];
    if (b.family === 'air' || b.family === 'street') continue;
    counts.set(b.canon, (counts.get(b.canon) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  let entropy = 0;
  for (const n of counts.values()) entropy -= (n / total) * Math.log2(n / total);
  const of = new Set(set.bricks.filter((b) => b.family !== 'air' && b.family !== 'street').map((b) => b.canon)).size;
  return { counts, used: counts.size, of, entropy };
}

/** Half the L1 distance of two spreads (0 the same, 1 nothing in common). */
export function spread(a: Map<string, number>, b: Map<string, number>): number {
  const ta = [...a.values()].reduce((s, v) => s + v, 0) || 1, tb = [...b.values()].reduce((s, v) => s + v, 0) || 1;
  let s = 0;
  for (const k of new Set([...a.keys(), ...b.keys()])) s += Math.abs((a.get(k) ?? 0) / ta - (b.get(k) ?? 0) / tb);
  return s / 2;
}

/** How a grid's colours are spread (its letters counted, every 7th voxel). */
export function looks(g: Grid3): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 0; i < g.cells.length; i += 7) if (g.cells[i]) out.set(g.alphabet[g.cells[i]], (out.get(g.alphabet[g.cells[i]]) ?? 0) + 1);
  return out;
}

/**
 * The kernel's own walk (`walkIn`, the door leaves open) on the voxels of a lot, from the street in front of it: which bays it stands in
 * (a cell of a bay's storey, its feet within the bay's lower part), set beside the graph's.
 */
export function kernelWalk(cx: Complex, g: Grid3, f: Fab, graph: Uint8Array): { ms: number; both: number; onlyGraph: number; onlyWalk: number; walked: Uint8Array } {
  const doors = new Set([...cx.set.doors].map((d) => g.alphabet.indexOf(cx.set.alphabet[d])));
  const cells = Uint8Array.from(g.cells, (c) => (doors.has(c) ? 0 : c));
  const t0 = performance.now();
  const w = walkIn({ X: g.X, Y: g.Y, Z: g.Z, cells, alphabet: g.alphabet }, cx.program.palette, VPT, 0, [], 1);
  const ms = performance.now() - t0;
  const walked = new Uint8Array(f.X * f.Y * f.Z);
  for (const c of w.celle) {
    const k = Math.floor(c.z / H);
    if (k >= f.Z || c.z - k * H > H - 6) continue;
    walked[Math.floor(c.x / C) + Math.floor(c.y / C) * f.X + k * f.X * f.Y] = 1;
  }
  let both = 0, onlyGraph = 0, onlyWalk = 0;
  for (let i = 0; i < walked.length; i++) {
    const s = cx.set.sigs[f.sig[i]];
    if (!s.node || s.start === 'r') continue;
    if (graph[i] && walked[i]) both++;
    else if (graph[i]) onlyGraph++;
    else if (walked[i]) onlyWalk++;
  }
  return { ms, both, onlyGraph, onlyWalk, walked };
}
