// The connection after the wave (T543): what the kernel can do with a fabric whose wave did not see rule 10 (the way A: a wave over the
// whole lot; the way B without its check). MarkovJunior's ModernHouse reconnects its rooms with `path` after its `wfc`; here the kernel
// does it on the bays: where a bay that must be reached is not, and a reached one stands beside it, the wall (or the parapet) between them
// becomes a passage, by dressing each of the two bays again with a pattern its letter of the massing allows, of the same family, that meets
// every neighbour it has as the old one did and has a passage there (a corner with a window becomes the same corner with a door, a roof
// loses a parapet). So the fabric stays valid. Faces are matched as faces, not copied: taking a parapet away moves the ends of the passages
// beside it, and a copy of the other faces would find no pattern (the first version of this did that, and left half the roofs out). The
// bays are taken in a fixed order: the same fabric gives the same stitching.

import { DX, DY, DZ } from '../../../src/mj/wfc';
import { sidesMeet, stacks, type Pattern } from './facce';
import { goes, reachedBays, walkable, type Fabric } from './misure';
import { masksOf } from './via-a';

export interface Stitched {
  /** Bays dressed again (each opening changes one or two), and the wanted bays still not reached. */
  opened: number;
  lost: number;
  ms: number;
}

/**
 * Opens, in place, a wall at a time between what is reached and what is not, until every wanted bay is reached or nothing more can be
 * opened. `wanted` says which bays must be reached (the rooms, corridors, stairs, cores; with roofs, the roofs). In a region of the way B:
 * `window` is where the walk goes and what it starts from (its edge), `mutable` the bays it may change (its own).
 */
export function stitch(f: Fabric, wanted: (p: Pattern) => boolean, o: { rounds?: number; window?: { x0: number; y0: number; x1: number; y1: number; edge: 'all' | 'ground' }; mutable?: (i: number) => boolean } = {}): Stitched {
  const t0 = performance.now();
  const { X, Y, Z, at, set } = f;
  const masks = masksOf(set);
  const mutable = o.mutable ?? (() => true);
  const P = set.patterns;
  const index = (x: number, y: number, z: number) => (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? -1 : x + y * X + z * X * Y);
  /** The patterns bay i may hold instead of its own: one bay, the same family, its letter's, meeting every neighbour but `skip`, a passage on side `d`. */
  const dressings = (i: number, d: number, skip: number): Pattern[] => {
    const p = P[at[i]];
    if (p.brick.size.some((n) => n !== 1)) return [];
    const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
    const mask = masks.get(f.letter(x, y, z))!;
    const out: Pattern[] = [];
    for (const q of P) {
      if (!mask[q.index] || q.brick.family !== p.brick.family || q.brick.size.some((n) => n !== 1)) continue;
      if (q.faces[d].k !== 'P' && q.faces[d].k !== 'D') continue;
      let ok = true;
      for (let e = 0; e < 6 && ok; e++) {
        const j = index(x + DX[e], y + DY[e], z + DZ[e]);
        if (j < 0 || j === skip) continue;
        const n = P[at[j]];
        ok = e < 4 ? sidesMeet(q.faces[e], n.faces[(e + 2) % 4]) : e === 4 ? stacks(q.faces[4], n.faces[5], !!n.brick.spans) : stacks(n.faces[4], q.faces[5], !!q.brick.spans);
        // Never a passage less: what the bay led to, it still leads to (what was reached stays reached).
        if (ok && e < 4 && goes(p, n, e)) ok = goes(q, n, e);
      }
      if (ok) out.push(q);
    }
    // The bay's own brick first (the same corner with a door), then by weight.
    return out.sort((a, b) => (b.brick === p.brick ? 1 : 0) - (a.brick === p.brick ? 1 : 0) || b.weight - a.weight);
  };
  let opened = 0;
  const seen = reachedBays(f, o.window);
  const w = o.window ?? { x0: 0, y0: 0, x1: X - 1, y1: Y - 1 };
  // What a new passage reaches: the bays from the newly reached one on (passages are only added, so the walk only grows).
  const flood = (start: number) => {
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
      for (let e = 0; e < 6; e++) {
        const nx = x + DX[e], ny = y + DY[e], nz = z + DZ[e];
        if (nx < w.x0 || ny < w.y0 || nx > w.x1 || ny > w.y1 || nz < 0 || nz >= Z) continue;
        const j = nx + ny * X + nz * X * Y;
        if (seen[j] || !goes(P[at[i]], P[at[j]], e)) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
  };
  for (let round = 0; round < (o.rounds ?? 2000); round++) {
    let done = false;
    // The first unreached wanted bay (in order) with a reached neighbour across a wall that can become a passage on both sides.
    outer: for (let z = 0; z < Z; z++)
      for (let y = 0; y < Y; y++)
        for (let x = 0; x < X; x++) {
          const i = x + y * X + z * X * Y;
          const pb = P[at[i]];
          if (seen[i] || !walkable(pb) || !wanted(pb) || !mutable(i)) continue;
          for (let d = 0; d < 4; d++) {
            const j = index(x + DX[d], y + DY[d], z);
            if (j < 0 || !seen[j] || !mutable(j)) continue;
            const pa = P[at[j]];
            const od = (d + 2) % 4;
            if (!walkable(pa) || goes(pa, pb, od)) continue;
            // Keep a side that already is a passage, or dress the bay again with one that is.
            const sidesA = pa.faces[od].k === 'P' || pa.faces[od].k === 'D' ? [pa, ...dressings(j, od, i)] : dressings(j, od, i);
            if (!sidesA.length) continue;
            const sidesB = pb.faces[d].k === 'P' || pb.faces[d].k === 'D' ? [pb, ...dressings(i, d, j)] : dressings(i, d, j);
            for (const qa of sidesA)
              for (const qb of sidesB) {
                if (!sidesMeet(qa.faces[od], qb.faces[d]) || !goes(qa, qb, od)) continue;
                at[j] = qa.index;
                at[i] = qb.index;
                opened += (qa !== pa ? 1 : 0) + (qb !== pb ? 1 : 0);
                flood(i);
                done = true;
                break outer;
              }
          }
        }
    if (!done) break;
  }
  const after = reachedBays(f, o.window);
  let lost = 0;
  for (let i = 0; i < at.length; i++) if (!after[i] && mutable(i) && walkable(P[at[i]]) && wanted(P[at[i]])) lost++;
  return { opened, lost, ms: performance.now() - t0 };
}

/** What rule 10 wants reached: rooms, corridors, stairs, cores, the turret; with `roofs` the roofs too. */
export const wantedBays = (roofs: boolean) => (p: Pattern) => ['room', 'corridor', 'stair', 'core', 'turret', ...(roofs ? ['roof'] : [])].includes(p.brick.family);
