// What the kernel would read of a set of bricks (T543): the faces of every bay read from the voxels (never declared), the bays of every
// brick in its eight symmetries (the turns and the mirror, as MarkovJunior's tile model makes them, `squareSymmetries` in src/mj/wfc.ts),
// the propagator of MarkovJunior's solver and the checks of the set.
//
// A side face is read on the band of the two outer layers of the bay and the first one inside (T522): nothing solid is air (A); a run of at
// least a door's width (11) of columns with a floor within a step (3) and a body's height (26) of air above is a passage, open (P) or a door
// (D) if a wall stands around it; no passage is a parapet (R) when nothing is solid above 10 voxels, else a wall (W). What changes from T522,
// each found by the measures: an open passage says whether its bay is inside (a room, a corridor) or outside (a street, a roof), and inside
// and outside meet only through a door, so a room always has its facade; an open floor inside meets only an open floor inside or a door, a
// door only a door or the outside, an open floor outside ends only on a wall, so a room is closed by its own walls and doors (2 × 2 bays or
// more) and a roof is never cut by a parapet; a passage says where it lies along its side, and two meet only where they overlap by a door's
// width; a floor is something solid under the feet, at the bottom of a bay only what its brick has under it.

import { DX, DY } from '../../../src/mj/wfc';
import { Block, C, H, type Brick } from './tasselli';

export type Face =
  | { k: 'A' }
  | { k: 'W' }
  | { k: 'R' }
  | { k: 'P'; h: number; io: 'i' | 'o'; u0: number; u1: number }
  | { k: 'D'; h: number; u0: number; u1: number }
  | { k: 'L'; label: string }
  | { k: 'needs' }
  | { k: 'open' }
  | { k: 'F' }
  | { k: 'O' };

export const faceText = (f: Face): string => (f.k === 'P' ? `P${f.h}${f.io}${f.u0 > 0 || f.u1 < C - 1 ? `[${f.u0}-${f.u1}]` : ''}` : f.k === 'D' ? `D${f.h}[${f.u0}-${f.u1}]` : f.k === 'L' ? 'L' : f.k);

/** A door's width and a body's height in voxels at 16 a tile, and the step (`stepOf(16)`). */
export const DOOR_W = 11;
export const BODY_H = 26;
export const STEP = 3;

/**
 * The class of the side face `side` (0 +x, 1 +y, 2 -x, 3 -y) of a bay, inside (`indoor`) or not. `below` says whether the voxel under a
 * column of the bay is solid, where the bay below is of the same brick (the top of a ramp is the floor of the bay above it).
 */
export function sideFace(b: Block, side: number, indoor: boolean, below: (x: number, y: number) => boolean = () => false): Face {
  const at = (u: number, v: number): [number, number] => (side === 0 ? [C - 1 - v, u] : side === 2 ? [v, u] : side === 1 ? [u, C - 1 - v] : [u, v]);
  const solid = (x: number, y: number, z: number) => b.get(x, y, z) !== 0;
  let any = 0, high = 0;
  const floors: number[] = [];
  const clears: number[] = [];
  for (let u = 0; u < C; u++) {
    let lo = Infinity, hi = 0, clear = Infinity;
    for (let v = 0; v < 3; v++) {
      const [x, y] = at(u, v);
      let f = 0;
      while (f < H && solid(x, y, f)) f++;
      let c = 0;
      while (f + c < H && !solid(x, y, f + c)) c++;
      lo = Math.min(lo, f);
      hi = Math.max(hi, f);
      clear = Math.min(clear, c + (f + c >= H ? 64 : 0)); // open to the top of the bay: the storey above goes on
      if (v < 2)
        for (let z = 0; z < H; z++)
          if (solid(x, y, z)) {
            any++;
            if (z >= 10) high++;
          }
    }
    // A floor is something solid under the feet in all three layers: at the bottom of the bay only what the brick has under it (T543: a
    // column of air is not a floor at 0, as T522 read it).
    let grounded = true;
    for (let v = 0; v < 3 && grounded; v++) {
      const [x, y] = at(u, v);
      if (!solid(x, y, 0) && !below(x, y)) grounded = false;
    }
    floors.push(hi - lo <= STEP && grounded ? hi : H);
    clears.push(clear);
  }
  if (!any) return { k: 'A' };
  let best = 0, bestH = 0, bestU = 0;
  for (let u0 = 0; u0 < C; u0++) {
    if (floors[u0] >= H || clears[u0] < BODY_H) continue;
    let lo = floors[u0], hi = floors[u0], u = u0;
    while (u < C && floors[u] < H && clears[u] >= BODY_H && Math.max(hi, floors[u]) - Math.min(lo, floors[u]) <= STEP) {
      lo = Math.min(lo, floors[u]);
      hi = Math.max(hi, floors[u]);
      u++;
    }
    if (u - u0 > best) {
      best = u - u0;
      bestH = hi;
      bestU = u0;
    }
  }
  if (best >= DOOR_W) {
    const above = 2 * C * (H - bestH);
    let wall = 0;
    for (let u = 0; u < C; u++)
      for (let v = 0; v < 2; v++) {
        const [x, y] = at(u, v);
        for (let z = bestH + 2; z < H; z++) if (solid(x, y, z)) wall++;
      }
    // Where the passage is along the side: two passages meet only where they overlap by a door's width (T543: a door off the middle of
    // a side and one in the middle are not a way through, whatever their class).
    const run = { u0: bestU, u1: bestU + best - 1 };
    return wall > 0.3 * above ? { k: 'D', h: bestH, ...run } : { k: 'P', h: bestH, io: indoor ? 'i' : 'o', ...run };
  }
  return high <= 0.05 * 2 * C * (H - 10) ? { k: 'R' } : { k: 'W' };
}

/** The bottom face: a slab where half the bottom two layers are solid. */
export function bottomFace(b: Block): Face {
  let n = 0;
  for (let z = 0; z < 2; z++) for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (b.get(x, y, z)) n++;
  return n >= C * C ? { k: 'F' } : { k: 'O' };
}

const pass = (f: Face): f is Extract<Face, { k: 'P' | 'D' }> => f.k === 'P' || f.k === 'D';

/** Whether two passages on the faces of two neighbours overlap by a door's width (the coordinate along a side is the same on both). */
export const overlap = (a: { u0: number; u1: number }, b: { u0: number; u1: number }) => Math.min(a.u1, b.u1) - Math.max(a.u0, b.u0) + 1 >= DOOR_W;

/** Whether two side faces may touch (symmetric): rule 10 in small, and a room that keeps its facade. */
export function sidesMeet(a: Face, b: Face): boolean {
  if (a.k === 'L' || b.k === 'L') return a.k === 'L' && b.k === 'L' && a.label === b.label;
  if (pass(a) && pass(b)) {
    if (Math.abs(a.h - b.h) > STEP || !overlap(a, b)) return false;
    // Inside and outside meet only through a door; a door opens onto another door or onto the outside, never onto the open side of a room
    // (so a room is closed by its own walls and doors: rooms of 2 × 2 bays and more, the corridors aside).
    if (a.k === 'P' && b.k === 'P') return a.io === b.io;
    const open = a.k === 'P' ? a : b.k === 'P' ? b : undefined;
    return !open || open.io === 'o';
  }
  // A door leads somewhere: never onto the air, a wall or a parapet.
  if (a.k === 'D' || b.k === 'D') return false;
  // An open floor outside ends on a wall (a street at a facade, a terrace at a taller wall), never on a parapet (a roof is one terrace, its
  // parapets face the air) nor on the air. Inside, never: a room ends on its own walls, so it is a room of 2 × 2 bays or more, or a corridor.
  if (a.k === 'P' || b.k === 'P') {
    const [p, q] = a.k === 'P' ? [a, b] : [b, a];
    return p.k === 'P' && p.io === 'o' && q.k === 'W';
  }
  return true; // A, W, R among them
}

/** Whether `above` may stand on `below`: a room wants a slab above it; over an open top only what has no floor, or what spans. */
export function stacks(belowTop: Face, aboveBottom: Face, aboveSpans: boolean): boolean {
  if (belowTop.k === 'L' || aboveBottom.k === 'L') return belowTop.k === 'L' && aboveBottom.k === 'L' && belowTop.label === aboveBottom.label;
  if (belowTop.k === 'needs') return aboveBottom.k === 'F';
  return aboveBottom.k === 'O' || (aboveBottom.k === 'F' && aboveSpans);
}

/** A bay of a brick in one of its symmetries: what the solver places. */
export interface Pattern {
  index: number;
  brick: Brick;
  /** The symmetry (0-7: the mirror on x if ≥ 4, then `t % 4` quarters counter-clockwise). */
  t: number;
  /** The bay in the turned brick, and where it was in the brick as written. */
  cell: [number, number, number];
  orig: string;
  /** +x, +y, -x, -y, top, bottom. */
  faces: Face[];
  weight: number;
  voxels: Block;
}

/** The eight symmetries of a block around z: mirror on x first (t ≥ 4), then quarter turns counter-clockwise (x → y). */
export function transform(b: Block, t: number): Block {
  let out = b;
  if (t >= 4) {
    const m = new Block(out.X, out.Y, out.Z);
    for (let z = 0; z < out.Z; z++) for (let y = 0; y < out.Y; y++) for (let x = 0; x < out.X; x++) m.cells[out.X - 1 - x + y * out.X + z * out.X * out.Y] = out.cells[x + y * out.X + z * out.X * out.Y];
    out = m;
  }
  for (let r = 0; r < t % 4; r++) {
    const n = new Block(out.Y, out.X, out.Z);
    for (let z = 0; z < out.Z; z++) for (let y = 0; y < out.Y; y++) for (let x = 0; x < out.X; x++) n.cells[out.Y - 1 - y + x * n.X + z * n.X * n.Y] = out.cells[x + y * out.X + z * out.X * out.Y];
    out = n;
  }
  return out;
}

/** Where the bay (x, y) of a brick of sx × sy bays goes under the symmetry t (as `transform` moves voxels). */
export function moveCell(x: number, y: number, sx: number, sy: number, t: number): [number, number] {
  let X = sx, Y = sy;
  if (t >= 4) x = sx - 1 - x;
  for (let r = 0; r < t % 4; r++) {
    [x, y] = [Y - 1 - y, x];
    [X, Y] = [Y, X];
  }
  return [x, y];
}

const cutCell = (b: Block, cx: number, cy: number, cz: number): Block => {
  const out = new Block(C, C, H);
  for (let z = 0; z < H; z++) for (let y = 0; y < C; y++) out.cells.set(b.cells.subarray(cx * C + (cy * C + y) * b.X + (cz * H + z) * b.X * b.Y, cx * C + C + (cy * C + y) * b.X + (cz * H + z) * b.X * b.Y), y * C + z * C * C);
  return out;
};

const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

/** The set as the solver reads it: patterns, weights, the propagator; and what the checks found. */
export interface BrickSet {
  bricks: Brick[];
  patterns: Pattern[];
  weights: number[];
  propagator: number[][][];
  /** The faces of every bay of every brick as written (symmetry 0), for the report. */
  faces: Array<{ brick: string; cell: string; faces: string[] }>;
  problems: string[];
  /** Patterns by brick name. */
  byBrick: Map<string, Pattern[]>;
}

/** The key of a face for the propagator: faces with the same key meet the same faces. */
const keyOf = (f: Face) => (f.k === 'P' ? `P${f.h}${f.io}${f.u0}-${f.u1}` : f.k === 'D' ? `D${f.h}${f.u0}-${f.u1}` : f.k === 'L' ? `L${f.label}` : f.k);

export function brickSet(bricks: readonly Brick[]): BrickSet {
  const patterns: Pattern[] = [];
  const faces: BrickSet['faces'] = [];
  const problems: string[] = [];
  for (const m of bricks) {
    const whole = m.build();
    const [sx, sy, sz] = m.size;
    if (whole.X !== sx * C || whole.Y !== sy * C || whole.Z !== sz * H) problems.push(`${m.name}: il blocco non è ${sx}×${sy}×${sz} vani`);
    const seen: Uint8Array[] = [];
    for (let t = 0; t < 8; t++) {
      const tb = transform(whole, t);
      if (seen.some((s) => same(s, tb.cells))) continue;
      seen.push(tb.cells);
      const TX = tb.X / C, TY = tb.Y / C;
      // Where each bay of the brick as written went.
      const origOf = new Map<string, string>();
      for (let cz = 0; cz < sz; cz++) for (let cy = 0; cy < sy; cy++) for (let cx = 0; cx < sx; cx++) origOf.set(`${moveCell(cx, cy, sx, sy, t).join(',')},${cz}`, `${cx},${cy},${cz}`);
      for (let cz = 0; cz < sz; cz++)
        for (let cy = 0; cy < TY; cy++)
          for (let cx = 0; cx < TX; cx++) {
            const block = cutCell(tb, cx, cy, cz);
            const inside = (x: number, y: number, z: number) => x >= 0 && y >= 0 && z >= 0 && x < TX && y < TY && z < sz;
            const label = (x2: number, y2: number, z2: number) => {
              const a = `${cx},${cy},${cz}`, b = `${x2},${y2},${z2}`;
              return `${m.name}#${t}|${a < b ? `${a}|${b}` : `${b}|${a}`}`;
            };
            const orig = origOf.get(`${cx},${cy},${cz}`)!;
            const half = orig.split(',')[1];
            const under = (x: number, y: number) => cz > 0 && tb.get(cx * C + x, cy * C + y, cz * H - 1) !== 0;
            const f: Face[] = [0, 1, 2, 3].map((d) => (inside(cx + DX[d], cy + DY[d], cz) ? { k: 'L', label: label(cx + DX[d], cy + DY[d], cz) } : sideFace(block, d, m.indoor, under)));
            const shaft = (top: boolean): Face | undefined => ((top ? m.shaft?.top : m.shaft?.bottom) ? { k: 'L', label: `fusto:${m.style}:${half}#${t}` } : undefined);
            f.push(inside(cx, cy, cz + 1) ? { k: 'L', label: label(cx, cy, cz + 1) } : (shaft(true) ?? (m.covered ? { k: 'needs' } : { k: 'open' })));
            f.push(inside(cx, cy, cz - 1) ? { k: 'L', label: label(cx, cy, cz - 1) } : (shaft(false) ?? bottomFace(block)));
            if (t === 0) faces.push({ brick: m.name, cell: orig, faces: f.map(faceText) });
            patterns.push({ index: patterns.length, brick: m, t, cell: [cx, cy, cz], orig, faces: f, weight: m.weight, voxels: block });
          }
    }
  }
  // The propagator as src/mj/wfc.ts wants it, built on the keys of the faces: faces with one key meet the same faces, so a pattern's
  // neighbours are the patterns of the keys its face meets (in the order of their indices, as MarkovJunior's tile model lists them).
  const P = patterns.length;
  const propagator: number[][][] = [0, 1, 2, 3, 4, 5].map(() => Array.from({ length: P }, () => [] as number[]));
  const groups = (key: (p: Pattern) => string) => {
    const out = new Map<string, { face: Pattern; members: number[] }>();
    for (const p of patterns) {
      const k = key(p);
      const g = out.get(k);
      if (g) g.members.push(p.index);
      else out.set(k, { face: p, members: [p.index] });
    }
    return out;
  };
  for (let d = 0; d < 4; d++) {
    const o = (d + 2) % 4;
    const mine = groups((p) => keyOf(p.faces[d]));
    const theirs = [...groups((p) => keyOf(p.faces[o])).values()];
    for (const g of mine.values()) {
      const list = theirs.filter((h) => sidesMeet(g.face.faces[d], h.face.faces[o])).flatMap((h) => h.members).sort((a, b) => a - b);
      for (const i of g.members) propagator[d][i] = list;
    }
  }
  {
    // +z: j stands on i; -z: j stands under i.
    const tops = groups((p) => keyOf(p.faces[4]));
    const bottoms = groups((p) => `${keyOf(p.faces[5])}${p.brick.spans ? '+' : ''}`);
    for (const g of tops.values()) {
      const list = [...bottoms.values()].filter((h) => stacks(g.face.faces[4], h.face.faces[5], !!h.face.brick.spans)).flatMap((h) => h.members).sort((a, b) => a - b);
      for (const i of g.members) propagator[4][i] = list;
    }
    for (const g of bottoms.values()) {
      const list = [...tops.values()].filter((h) => stacks(h.face.faces[4], g.face.faces[5], !!g.face.brick.spans)).flatMap((h) => h.members).sort((a, b) => a - b);
      for (const i of g.members) propagator[5][i] = list;
    }
  }
  // The checks of the set: every pattern has a neighbour on every side; every passage outside and every door can be closed by a bay of
  // one that closes the rest (no endless tunnel); an open side inside is closed by a room of 2 × 2 bays, so the set needs its corner.
  for (const p of patterns)
    for (let d = 0; d < 6; d++) if (!propagator[d][p.index].length) problems.push(`${p.brick.name} ${p.orig} simmetria ${p.t}: nessun vicino in direzione ${d}`);
  const closes = (q: Pattern, d: number) => [0, 1, 2, 3].every((e) => e === d || ['A', 'W', 'R'].includes(q.faces[e].k));
  const corner = patterns.some((q) => [0, 1, 2, 3].every((e) => (q.faces[e].k === 'W') === (e === 0 || e === 3) && (e === 0 || e === 3 || (q.faces[e].k === 'P' && (q.faces[e] as { io: string }).io === 'i'))));
  if (!corner) problems.push("il set non ha l'angolo di una stanza (due muri accanto, due lati aperti dentro): un lato aperto dentro non si chiude");
  for (const p of patterns)
    for (let d = 0; d < 4; d++) {
      if (!pass(p.faces[d]) || p.brick.family === 'air') continue;
      if (p.faces[d].k === 'P' && (p.faces[d] as { io: string }).io === 'i') continue;
      const opposite = (d + 2) % 4;
      if (!propagator[d][p.index].some((qi) => closes(patterns[qi], opposite) && patterns[qi].brick.size.every((s) => s === 1)))
        problems.push(`${p.brick.name} ${p.orig} simmetria ${p.t}: il passaggio in direzione ${d} non si chiude con un vano solo`);
    }
  const byBrick = new Map<string, Pattern[]>();
  for (const p of patterns) byBrick.set(p.brick.name, [...(byBrick.get(p.brick.name) ?? []), p]);
  return { bricks: [...bricks], patterns, weights: patterns.map((p) => p.weight), propagator, faces, problems, byBrick };
}

/** Entries of the propagator: what the engine counts against `WFC_LIMITS.propagator`. */
export const propagatorEntries = (s: BrickSet) => s.propagator.reduce((n, d) => n + d.reduce((m, l) => m + l.length, 0), 0);
