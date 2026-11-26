// What the kernel would read of a set of bricks (T522, the «tasselli» of the study): the class of every face of every cell, read from the voxels and never declared, the
// patterns (every cell with its turns around z), the propagator of the solver of MarkovJunior (src/mj/wfc.ts) and the checks of the set.
//
// A side face is the band of the two outer layers of the cell on that side: nothing solid in it is air (A); a passage is a run of at least a
// door's width (11 voxels) of columns with a floor and a body's height (26) of air above it, all within a step (3) of each other: open (P)
// if the band is mostly air, a door (D) if a wall stands around it; no passage is a parapet (R) when nothing is solid above 10 voxels, else a
// wall (W). A bottom face is a slab (F) or open (O); a top face asks for a ceiling when the cell is a room (`covered`), otherwise it is open.
// The inner faces of a brick of more cells only meet each other (a label of the brick, the two cells and the turn).

import { DX, DY } from '../../src/mj/wfc';
import { Block, C, H, type Brick } from './tasselli';

export type Face =
  | { k: 'A' }
  | { k: 'W' }
  | { k: 'R' }
  | { k: 'P'; h: number }
  | { k: 'D'; h: number }
  | { k: 'L'; label: string }
  | { k: 'F' }
  | { k: 'O' }
  | { k: 'needs' }
  | { k: 'open' };

export const faceText = (f: Face): string => (f.k === 'P' || f.k === 'D' ? `${f.k}${f.h}` : f.k === 'L' ? 'L' : f.k);

/** A door's width and a body's height in voxels at 16 a tile (the Architect's door is 11 × 30; a person 24 tall), and the step (`stepOf(16)`). */
export const DOOR_W = 11;
export const BODY_H = 26;
export const STEP = 3;

const solid = (b: Block, x: number, y: number, z: number) => b.get(x, y, z) !== 0;

/** The class of the side face `side` (0 +x, 1 +y, 2 -x, 3 -y) of a cell block. */
export function sideFace(b: Block, side: number): Face {
  // (u along the face, v the depth from the outer layer) → (x, y)
  const at = (u: number, v: number): [number, number] => (side === 0 ? [C - 1 - v, u] : side === 2 ? [v, u] : side === 1 ? [u, C - 1 - v] : [u, v]);
  let any = 0, high = 0;
  const floors: number[] = [];
  const clears: number[] = [];
  for (let u = 0; u < C; u++) {
    // The two layers of the band and the first one inside: a passage goes on into the cell within a step (a parapet or a railing on the
    // band is a rise from the floor inside, not a floor).
    let lo = Infinity, hi = 0, clear = Infinity;
    for (let v = 0; v < 3; v++) {
      const [x, y] = at(u, v);
      let f = 0;
      while (f < H && solid(b, x, y, f)) f++;
      let c = 0;
      while (f + c < H && !solid(b, x, y, f + c)) c++;
      lo = Math.min(lo, f);
      hi = Math.max(hi, f);
      clear = Math.min(clear, c + (f + c >= H ? 64 : 0)); // open to the top of the cell: the storey above goes on
      if (v < 2)
        for (let z = 0; z < H; z++)
          if (solid(b, x, y, z)) {
            any++;
            if (z >= 10) high++;
          }
    }
    floors.push(hi - lo <= STEP ? hi : H);
    clears.push(clear);
  }
  if (!any) return { k: 'A' };
  // The widest run of passable columns whose floors stay within a step of each other.
  let best = 0, bestH = 0;
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
    }
  }
  if (best >= DOOR_W) {
    // A wall around the passage (more than 30 % of the band above the floor solid) makes it a door.
    const above = 2 * C * (H - bestH);
    let wall = 0;
    for (let u = 0; u < C; u++)
      for (let v = 0; v < 2; v++) {
        const [x, y] = at(u, v);
        for (let z = bestH + 2; z < H; z++) if (solid(b, x, y, z)) wall++;
      }
    return wall > 0.3 * above ? { k: 'D', h: bestH } : { k: 'P', h: bestH };
  }
  return high <= 0.05 * 2 * C * (H - 10) ? { k: 'R' } : { k: 'W' };
}

/** The bottom face: a slab where half the bottom two layers are solid. */
export function bottomFace(b: Block): Face {
  let n = 0;
  for (let z = 0; z < 2; z++) for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (solid(b, x, y, z)) n++;
  return n >= C * C ? { k: 'F' } : { k: 'O' };
}

/** Whether two side faces may touch (symmetric): what the kernel allows, for rule 10 and for what looks right. */
export function sidesMeet(a: Face, b: Face): boolean {
  if (a.k === 'L' || b.k === 'L') return a.k === 'L' && b.k === 'L' && a.label === b.label;
  const pass = (f: Face) => f.k === 'P' || f.k === 'D';
  if (pass(a) && pass(b)) return Math.abs((a as { h: number }).h - (b as { h: number }).h) <= STEP;
  // A door leads somewhere: never onto the air, a wall or a parapet. An open floor never ends on the air.
  if (a.k === 'D' || b.k === 'D') return false;
  if ((a.k === 'P' && b.k === 'A') || (a.k === 'A' && b.k === 'P')) return false;
  return true; // A, W, R among them; P against W or R (a wall or a parapet closes the floor)
}

/** Whether the cell `top` may stand on `below` (the top face of the lower one, the bottom face of the upper one). */
export function stacks(belowTop: Face, aboveBottom: Face): boolean {
  if (belowTop.k === 'L' || aboveBottom.k === 'L') return belowTop.k === 'L' && aboveBottom.k === 'L' && belowTop.label === aboveBottom.label;
  if (belowTop.k === 'needs') return aboveBottom.k === 'F';
  return true;
}

/** A cell of a brick with one of its turns: what the solver places. */
export interface Pattern {
  index: number;
  brick: Brick;
  /** The cell in the brick, canonical. */
  cell: [number, number, number];
  rot: number;
  /** +x, +y, -x, -y, top, bottom, in the turned frame. */
  faces: Face[];
  weight: number;
  /** The voxels of the cell, turned. */
  voxels: Block;
}

/** Turns a cell block by `rot` quarters counter-clockwise around z (x → y). */
export function turn(b: Block, rot: number): Block {
  let out = b;
  for (let r = 0; r < rot; r++) {
    const t = new Block(out.Y, out.X, out.Z);
    for (let z = 0; z < out.Z; z++) for (let y = 0; y < out.Y; y++) for (let x = 0; x < out.X; x++) t.set(out.Y - 1 - y, x, z, out.get(x, y, z));
    out = t;
  }
  return out;
}

const cutCell = (b: Block, cx: number, cy: number, cz: number): Block => {
  const out = new Block(C, C, H);
  for (let z = 0; z < H; z++) for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) out.set(x, y, z, b.get(cx * C + x, cy * C + y, cz * H + z));
  return out;
};

const same = (a: Block, b: Block) => a.cells.every((v, i) => v === b.cells[i]);

/** The set as the solver reads it: patterns, weights, the propagator; and what the checks found. */
export interface BrickSet {
  patterns: Pattern[];
  weights: number[];
  propagator: number[][][];
  /** The class of every face of every canonical cell, for the report. */
  faces: Array<{ brick: string; cell: string; faces: string[] }>;
  problems: string[];
}

export function brickSet(modules: readonly Brick[]): BrickSet {
  const patterns: Pattern[] = [];
  const faces: BrickSet['faces'] = [];
  const problems: string[] = [];
  for (const m of modules) {
    const whole = m.build();
    const [sx, sy, sz] = m.size;
    if (whole.X !== sx * C || whole.Y !== sy * C || whole.Z !== sz * H) problems.push(`${m.name}: il blocco non è ${sx}×${sy}×${sz} celle`);
    for (let cz = 0; cz < sz; cz++)
      for (let cy = 0; cy < sy; cy++)
        for (let cx = 0; cx < sx; cx++) {
          const block = cutCell(whole, cx, cy, cz);
          const inside = (x: number, y: number, z: number) => x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz;
          const label = (x2: number, y2: number, z2: number) => {
            const a = `${cx},${cy},${cz}`, b = `${x2},${y2},${z2}`;
            return `${m.name}|${a < b ? `${a}|${b}` : `${b}|${a}`}`;
          };
          // The canonical faces: +x, +y, -x, -y, top, bottom.
          const canon: Face[] = [0, 1, 2, 3].map((d) => (inside(cx + DX[d], cy + DY[d], cz) ? { k: 'L', label: label(cx + DX[d], cy + DY[d], cz) } : sideFace(block, d)));
          canon.push(inside(cx, cy, cz + 1) ? { k: 'L', label: label(cx, cy, cz + 1) } : m.covered ? { k: 'needs' } : { k: 'open' });
          canon.push(inside(cx, cy, cz - 1) ? { k: 'L', label: label(cx, cy, cz - 1) } : bottomFace(block));
          faces.push({ brick: m.name, cell: `${cx},${cy},${cz}`, faces: canon.map(faceText) });
          const seen: Block[] = [];
          for (let rot = 0; rot < 4; rot++) {
            const voxels = turn(block, rot);
            // A cell of one cell that turns into itself is one pattern (the solver's tiles without doubles); a cell of a larger brick never.
            if (sx * sy * sz === 1 && seen.some((s) => same(s, voxels))) continue;
            seen.push(voxels);
            const turned: Face[] = [0, 1, 2, 3].map((D) => {
              const f = canon[(D - rot + 4) % 4];
              return f.k === 'L' ? { k: 'L', label: `${f.label}@${rot}` } : f;
            });
            for (const v of [4, 5]) turned.push(canon[v].k === 'L' ? { k: 'L', label: `${(canon[v] as { label: string }).label}@${rot}` } : canon[v]);
            patterns.push({ index: patterns.length, brick: m, cell: [cx, cy, cz], rot, faces: turned, weight: m.weight, voxels });
          }
        }
  }
  // The propagator as src/mj/wfc.ts wants it: per direction (+x, +y, -x, -y, +z, -z), per pattern, the patterns that may stand there.
  const propagator = [0, 1, 2, 3, 4, 5].map((d) =>
    patterns.map((p) =>
      patterns
        .filter((q) => (d < 4 ? sidesMeet(p.faces[d], q.faces[(d + 2) % 4]) : d === 4 ? stacks(p.faces[4], q.faces[5]) : stacks(q.faces[4], p.faces[5])))
        .map((q) => q.index),
    ),
  );
  // The checks of the set: every pattern has a neighbour on every side; every open side can be closed by a cell that closes the rest.
  for (const p of patterns)
    for (let d = 0; d < 6; d++)
      if (!propagator[d][p.index].length) problems.push(`${p.brick.name} ${p.cell.join(',')} girata ${p.rot}: nessun vicino in direzione ${d}`);
  const closes = (q: Pattern, d: number) => [0, 1, 2, 3].every((e) => e === d || ['A', 'W', 'R'].includes(q.faces[e].k));
  for (const p of patterns)
    for (let d = 0; d < 4; d++) {
      if (p.faces[d].k !== 'P' && p.faces[d].k !== 'D') continue;
      const opposite = (d + 2) % 4;
      if (!propagator[d][p.index].some((qi) => closes(patterns[qi], opposite) && patterns[qi].brick.size.every((s) => s === 1)))
        problems.push(`${p.brick.name} ${p.cell.join(',')} girata ${p.rot}: il passaggio in direzione ${d} non si chiude con una cella sola`);
    }
  return { patterns, weights: patterns.map((p) => p.weight), propagator, faces, problems };
}
