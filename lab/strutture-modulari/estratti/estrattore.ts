// The extractor of T557: a static model cut into bricks (docs/design/strutture-modulari.md § 12). The source (sorgente.ts) is fitted to the
// bays; here every bay is read as the kernel would read it, never declared:
//
// - the walk: where a body stands (something solid under the feet, a body's height of air above, the door leaves read open), where its
//   footprint fits (a square of 7 × 7 voxels of floor within a step: the kernel's body is 0.22 tiles of radius) and where it goes (a step of
//   3 voxels at most, 16 a tile); a floor is covered (inside) when something solid stands over it;
// - the bricks: the bays the walk crosses where no floor is (a stair from a storey to the next, a ramp across a side above the floor) are
//   one brick of several bays, as the stair core of T543 was; every other bay is a brick of its own;
// - the faces: the side of a bay is the layer of voxels on its side, seen in blocks of 4 × 4 (the letter that holds most of a block, or air),
//   with whether the floor at it is inside or outside; the top and the bottom, solid or not in blocks of 4 × 4; a face inside a brick only
//   meets its partner. Two faces may meet where the source shows them meeting (the pairs seen in the source, in its four turns): the bricks
//   go together again only as the model shows they can, and a face met by several bricks lets them take each other's place;
// - the node of a brick: the part of its walk with most floor inside (else the largest); a side lets a body through when the node touches it
//   (the walk inside the brick, from the room through its door to the strip outside), a face inside a brick when the node holds both bays.
//
// The sets are made of these bays in the four turns of the source (no mirror: the bricks are as the Concilio drew them), counted where
// they are the same, and of a carved copy of every bay of a room with a door opened in the middle of each side it does not pass (the
// stitching of the program, ricucitura.ts, dresses a bay again with it).

import { C, H, turned, type Source, type Vox } from './sorgente';

export const STEP = 3;
export const BODY_H = 26;
/** Half the side of the square of floor the body stands on (7 × 7 voxels: the kernel's body radius, 0.22 tiles, at 16 a tile). */
export const BODY_R = 3;
/** Blocks of the faces' keys: 4 × 4 voxels of a 32 × 32 face. */
export const KB = 4;
/**
 * Whether a side's key says the letter of a block (a window meets a window) or only whether it is solid (a wall meets a wall, the windows
 * of the source cut where the bays cut them): with the letter two bays of a facade whose rhythm is not the bay's never meet but as the
 * source has them (T557: the palazzina's windows every 10 voxels, the bay 32), so the default is solid or not.
 */
export const KEYS = { material: false, block: 8, height: 8 };
/** The directions of the solver (src/mj/wfc.ts): +x, +y, -x, -y, +z, -z. */
export const DIR = [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as const;
export const OPP = [2, 3, 0, 1, 5, 4];

/** What the massing letters a bay may stand on are (massa.ts): street, yard, ground storey, storey above, roof, stair bottom and top, air. */
export type Role = 'S' | 'Y' | 'H' | 'B' | 'R' | 'q' | 'Q' | 'A';

export interface WalkGrid {
  X: number;
  Y: number;
  Z: number;
  /** Cells where a body's footprint fits. */
  ok: Uint8Array;
  /** Among them, those with something solid above (inside). */
  covered: Uint8Array;
}

/** Whether a voxel is solid for the walk: the door leaves are open. */
const solidOf = (g: Vox, doors: Set<number>) => (x: number, y: number, z: number) => {
  if (z < 0) return true;
  if (x < 0 || y < 0 || x >= g.X || y >= g.Y || z >= g.Z) return false;
  const c = g.cells[x + y * g.X + z * g.X * g.Y];
  return c !== 0 && !doors.has(c);
};

/** Where a body's footprint fits, and whether it is covered. */
export function walkGrid(g: Vox, doors: Set<number>): WalkGrid {
  const { X, Y, Z } = g;
  const solid = solidOf(g, doors);
  const stand = new Uint8Array(X * Y * Z);
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      // Free voxels from the top down: a standing cell has BODY_H of them from itself up (above the grid is free).
      let free = BODY_H;
      // Down to the bottom layer: under the grid is the ground (a door leaf open to its sill stands there).
      for (let z = Z - 1; z >= 0; z--) {
        if (solid(x, y, z)) {
          free = 0;
          continue;
        }
        free++;
        if (free >= BODY_H && solid(x, y, z - 1)) stand[x + y * X + z * X * Y] = 1;
      }
    }
  // A cell where the 7 × 7 square around it stands, smooth as the kernel wants the floor under a body (`rampBlocks`: no two columns side by
  // side more than a step apart): a column r voxels away stands within r steps of the cell (a stair of a step a voxel climbs).
  const near = [1, 2, 3].map((r) => {
    const n = new Uint8Array(X * Y * Z);
    const span = STEP * r;
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        // A sliding window over z: the stands of the column within ±span.
        let count = 0;
        for (let z = 0; z <= Math.min(Z - 1, span); z++) count += stand[x + y * X + z * X * Y];
        for (let z = 0; z < Z; z++) {
          if (count) n[x + y * X + z * X * Y] = 1;
          const out = z - span, inn = z + span + 1;
          if (out >= 0) count -= stand[x + y * X + out * X * Y];
          if (inn < Z) count += stand[x + y * X + inn * X * Y];
        }
      }
    return n;
  });
  const ok = new Uint8Array(X * Y * Z);
  const covered = new Uint8Array(X * Y * Z);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const i = x + y * X + z * X * Y;
        if (!stand[i]) continue;
        let fits = true;
        for (let dy = -BODY_R; dy <= BODY_R && fits; dy++)
          for (let dx = -BODY_R; dx <= BODY_R && fits; dx++) {
            const r = Math.max(Math.abs(dx), Math.abs(dy));
            if (!r) continue;
            // Beyond the grid the ground goes on as at its edge (the lot is not the end of the world).
            const nx = Math.min(X - 1, Math.max(0, x + dx)), ny = Math.min(Y - 1, Math.max(0, y + dy));
            if (!near[r - 1][nx + ny * X + z * X * Y]) fits = false;
          }
        if (!fits) continue;
        ok[i] = 1;
        for (let zz = z + BODY_H; zz < Math.min(Z, z + BODY_H + 24); zz++)
          if (solid(x, y, zz)) {
            covered[i] = 1;
            break;
          }
      }
  return { X, Y, Z, ok, covered };
}

/** The walk's neighbours of a cell: the four sides, a step up or down at most. */
function* steps(w: WalkGrid, i: number): Generator<number> {
  const { X, Y, Z } = w;
  const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  for (let d = 0; d < 4; d++) {
    const nx = x + DIR[d][0], ny = y + DIR[d][1];
    if (nx < 0 || ny < 0 || nx >= X || ny >= Y) continue;
    for (let dz = -STEP; dz <= STEP; dz++) {
      const nz = z + dz;
      if (nz < 0 || nz >= Z) continue;
      const j = nx + ny * X + nz * X * Y;
      if (w.ok[j]) yield j;
    }
  }
}

/** The pieces of the walk inside a box of voxels: a label per cell (0 none), and per label its cells and its covered cells. */
export function piecesIn(w: WalkGrid, box: { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number }) {
  const { X, Y } = w;
  const label = new Map<number, number>();
  const sizes: Array<{ cells: number; covered: number }> = [{ cells: 0, covered: 0 }];
  const inside = (j: number) => {
    const x = j % X, y = Math.floor(j / X) % Y, z = Math.floor(j / (X * Y));
    return x >= box.x0 && x < box.x1 && y >= box.y0 && y < box.y1 && z >= box.z0 && z < box.z1;
  };
  for (let z = box.z0; z < box.z1; z++)
    for (let y = box.y0; y < box.y1; y++)
      for (let x = box.x0; x < box.x1; x++) {
        const i = x + y * X + z * X * Y;
        if (!w.ok[i] || label.has(i)) continue;
        const id = sizes.length;
        const s = { cells: 0, covered: 0 };
        sizes.push(s);
        const stack = [i];
        label.set(i, id);
        while (stack.length) {
          const a = stack.pop()!;
          s.cells++;
          if (w.covered[a]) s.covered++;
          for (const b of steps(w, a)) {
            if (label.has(b) || !inside(b)) continue;
            label.set(b, id);
            stack.push(b);
          }
        }
      }
  return { label, sizes };
}

export interface BayRead {
  /** Bay coordinates in the turned source's grid. */
  i: number;
  j: number;
  k: number;
  role: Role;
  /** The brick it belongs to (an index in `bricks` of the read), and where it is in the brick. */
  brick: number;
  at: [number, number, number];
  /** Keys of the six faces. */
  keys: string[];
  /** Whether a body goes through each face from the brick's node. */
  pass: boolean[];
  /** Whether the brick's node has floor in this bay, and whether it is inside. */
  node: boolean;
  indoor: boolean;
  /** Bays a stair joins in one brick: the bottom storey (q) and the ones above (Q). */
  stair?: 'q' | 'Q';
  voxels: Uint8Array;
}

export interface SourceRead {
  t: number;
  nx: number;
  ny: number;
  nz: number;
  bays: BayRead[];
  bricks: Array<{ bays: number[]; size: [number, number, number]; origin: [number, number, number] }>;
  /** Bays of rooms reached from the streets in the source, and in all. */
  reached: [number, number];
}

const bayIndex = (r: { nx: number; ny: number }, i: number, j: number, k: number) => i + j * (r.nx + 2) + k * (r.nx + 2) * (r.ny + 2);

/** The voxels of a box of a grid. */
export function cut(g: Vox, x0: number, y0: number, z0: number, sx: number, sy: number, sz: number): Uint8Array {
  const out = new Uint8Array(sx * sy * sz);
  for (let z = 0; z < sz; z++) for (let y = 0; y < sy; y++) out.set(g.cells.subarray(x0 + (y0 + y) * g.X + (z0 + z) * g.X * g.Y, x0 + sx + (y0 + y) * g.X + (z0 + z) * g.X * g.Y), y * sx + z * sx * sy);
  return out;
}

/** The key of a side face of a bay (its layer on that side, in blocks), and of its top or bottom (solid or not, in blocks). */
export function sideKey(v: Uint8Array, side: number, io: string): string {
  // u along the side, as T543's `at`: +x and -x along y, +y and -y along x; the layer on the side.
  const at = (u: number, z: number) => {
    const [x, y] = side === 0 ? [C - 1, u] : side === 2 ? [0, u] : side === 1 ? [u, C - 1] : [u, 0];
    return v[x + y * C + z * C * C];
  };
  let s = `${io}:`;
  const count = new Map<number, number>();
  const B = KEYS.block, BZ = KEYS.height;
  for (let bz = 0; bz < H / BZ; bz++)
    for (let bu = 0; bu < C / B; bu++) {
      count.clear();
      let solid = 0;
      for (let z = bz * BZ; z < bz * BZ + BZ; z++)
        for (let u = bu * B; u < bu * B + B; u++) {
          const c = at(u, z);
          if (!c) continue;
          solid++;
          count.set(c, (count.get(c) ?? 0) + 1);
        }
      if (solid * 2 < B * BZ) s += '.';
      else s += KEYS.material ? String.fromCharCode(48 + [...count].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]) : '#';
    }
  return s;
}

export function flatKey(v: Uint8Array, z: number): string {
  let s = '';
  for (let by = 0; by < C / KB; by++)
    for (let bx = 0; bx < C / KB; bx++) {
      let solid = 0;
      for (let y = by * KB; y < by * KB + KB; y++) for (let x = bx * KB; x < bx * KB + KB; x++) if (v[x + y * C + z * C * C]) solid++;
      s += solid * 2 >= KB * KB ? '#' : '.';
    }
  return s;
}

/**
 * The pairs of keys a read shows (with the keys as they are now): across a side, x and y apart (`a|b` with a on the lower side), and from a
 * bay to the one above (`below|above`).
 */
export function pairsOf(r: SourceRead, into: [Set<string>, Set<string>, Set<string>]): void {
  const BX = r.nx + 2, BY = r.ny + 2, BZ = r.nz + 1;
  const bayAt = (i: number, j: number, k: number) => r.bays[bayIndex(r, i, j, k)];
  for (const b of r.bays) {
    if (b.i + 1 < BX) into[0].add(`${b.keys[0]}|${bayAt(b.i + 1, b.j, b.k).keys[2]}`);
    if (b.j + 1 < BY) into[1].add(`${b.keys[1]}|${bayAt(b.i, b.j + 1, b.k).keys[3]}`);
    if (b.k + 1 < BZ) into[2].add(`${b.keys[4]}|${bayAt(b.i, b.j, b.k + 1).keys[5]}`);
  }
}

/** Reads a source in one of its four turns: its bays and its bricks. */
export function readSource(s: Source, t: number): SourceRead {
  const g = turned(s, t);
  const nx = t % 2 ? s.ny : s.nx, ny = t % 2 ? s.nx : s.ny, nz = s.nz;
  const BX = nx + 2, BY = ny + 2, BZ = nz + 1;
  const w = walkGrid(g, s.doors);
  const bayOf = (cell: number): number => {
    const x = cell % g.X, y = Math.floor(cell / g.X) % g.Y, z = Math.floor(cell / (g.X * g.Y));
    return bayIndex({ nx, ny }, Math.floor(x / C), Math.floor(y / C), Math.floor(z / H));
  };
  // The walk from the streets (the ring's ground): what the source reaches, and where it crosses a side away from the floor.
  const ringGround = (cell: number) => {
    const x = cell % g.X, y = Math.floor(cell / g.X) % g.Y, z = Math.floor(cell / (g.X * g.Y));
    const i = Math.floor(x / C), j = Math.floor(y / C);
    return z < H && (i === 0 || j === 0 || i === BX - 1 || j === BY - 1);
  };
  const seen = new Uint8Array(w.ok.length);
  const stack: number[] = [];
  for (let c = 0; c < w.ok.length; c++)
    if (w.ok[c] && ringGround(c)) {
      seen[c] = 1;
      stack.push(c);
    }
  // Union-find of the bays the walk joins away from a floor.
  const parent = Int32Array.from({ length: BX * BY * BZ }, (_, i) => i);
  const find = (a: number): number => (parent[a] === a ? a : (parent[a] = find(parent[a])));
  const join = (a: number, b: number) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
  };
  while (stack.length) {
    const a = stack.pop()!;
    for (const b of steps(w, a)) {
      const ba = bayOf(a), bb = bayOf(b);
      if (ba !== bb) {
        const za = Math.floor(a / (g.X * g.Y)), zb = Math.floor(b / (g.X * g.Y));
        const ka = Math.floor(za / H), kb = Math.floor(zb / H);
        // A storey crossed (a stair), or a side crossed away from the floor (a ramp, a landing).
        if (ka !== kb || za % H > 6 || zb % H > 6) join(ba, bb);
      }
      if (seen[b]) continue;
      seen[b] = 1;
      stack.push(b);
    }
  }
  // The bricks: the boxes of the joined bays (a joined set that is not a box takes its box).
  const groups = new Map<number, number[]>();
  for (let b = 0; b < BX * BY * BZ; b++) groups.set(find(b), [...(groups.get(find(b)) ?? []), b]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const members of groups.values()) {
      if (members.length < 2) continue;
      const cs = members.map((b) => [b % BX, Math.floor(b / BX) % BY, Math.floor(b / (BX * BY))]);
      const lo = [0, 1, 2].map((a) => Math.min(...cs.map((c) => c[a]))), hi = [0, 1, 2].map((a) => Math.max(...cs.map((c) => c[a])));
      for (let k = lo[2]; k <= hi[2]; k++)
        for (let j = lo[1]; j <= hi[1]; j++)
          for (let i = lo[0]; i <= hi[0]; i++) {
            const b = bayIndex({ nx, ny }, i, j, k);
            if (find(b) !== find(members[0])) {
              join(b, members[0]);
              changed = true;
            }
          }
    }
    if (changed) {
      groups.clear();
      for (let b = 0; b < BX * BY * BZ; b++) groups.set(find(b), [...(groups.get(find(b)) ?? []), b]);
    }
  }
  const bricks: SourceRead['bricks'] = [];
  const brickOf = new Int32Array(BX * BY * BZ);
  for (const members of groups.values()) {
    const cs = members.map((b) => [b % BX, Math.floor(b / BX) % BY, Math.floor(b / (BX * BY))]);
    const lo = [0, 1, 2].map((a) => Math.min(...cs.map((c) => c[a]))), hi = [0, 1, 2].map((a) => Math.max(...cs.map((c) => c[a])));
    const id = bricks.length;
    bricks.push({ bays: members, size: [hi[0] - lo[0] + 1, hi[1] - lo[1] + 1, hi[2] - lo[2] + 1], origin: [lo[0], lo[1], lo[2]] });
    for (const b of members) brickOf[b] = id;
  }
  // Every brick's node: the piece of its walk with the most floor inside, else the largest; and the bays it has floor in.
  const nodeOf: Array<{ label: Map<number, number>; main: number; indoor: boolean; bays: Set<number> }> = bricks.map((br) => {
    const box = { x0: br.origin[0] * C, y0: br.origin[1] * C, z0: br.origin[2] * H, x1: (br.origin[0] + br.size[0]) * C, y1: (br.origin[1] + br.size[1]) * C, z1: (br.origin[2] + br.size[2]) * H };
    const p = piecesIn(w, box);
    let main = 0;
    for (let l = 1; l < p.sizes.length; l++) {
      const a = p.sizes[l], b = p.sizes[main];
      if (!main || a.covered > b.covered || (a.covered === b.covered && a.cells > b.cells)) main = l;
    }
    const inBays = new Set<number>();
    for (const [cell, l] of p.label) if (l === main) inBays.add(bayOf(cell));
    return { label: p.label, main, indoor: main > 0 && p.sizes[main].covered * 2 > p.sizes[main].cells, bays: inBays };
  });
  const bays: BayRead[] = [];
  let reached = 0, rooms = 0;
  const inBox = (i: number, j: number) => i >= 1 && j >= 1 && i <= nx && j <= ny;
  for (let k = 0; k < BZ; k++)
    for (let j = 0; j < BY; j++)
      for (let i = 0; i < BX; i++) {
        const b = bayIndex({ nx, ny }, i, j, k);
        const br = bricks[brickOf[b]];
        const node = nodeOf[brickOf[b]];
        const voxels = cut(g, i * C, j * C, k * H, C, C, H);
        const x0 = i * C, y0 = j * C, z0 = k * H;
        // The node's cells in this bay, and the floor at each side.
        let nodeCells = 0, nodeCovered = 0;
        const sideNode = [0, 0, 0, 0];
        const sideIn = [0, 0, 0, 0], sideOut = [0, 0, 0, 0];
        for (let z = z0; z < z0 + H; z++)
          for (let y = y0; y < y0 + C; y++)
            for (let x = x0; x < x0 + C; x++) {
              const c = x + y * g.X + z * g.X * g.Y;
              if (!w.ok[c]) continue;
              const onSide = [x === x0 + C - 1, y === y0 + C - 1, x === x0, y === y0];
              for (let d = 0; d < 4; d++)
                if (onSide[d]) {
                  if (w.covered[c]) sideIn[d]++;
                  else sideOut[d]++;
                }
              if (node.main && node.label.get(c) === node.main) {
                nodeCells++;
                if (w.covered[c]) nodeCovered++;
                for (let d = 0; d < 4; d++) if (onSide[d]) sideNode[d]++;
              }
            }
        const at: [number, number, number] = [i - br.origin[0], j - br.origin[1], k - br.origin[2]];
        const inside = (ii: number, jj: number, kk: number) => ii >= br.origin[0] && jj >= br.origin[1] && kk >= br.origin[2] && ii < br.origin[0] + br.size[0] && jj < br.origin[1] + br.size[1] && kk < br.origin[2] + br.size[2];
        const keys: string[] = [];
        const pass: boolean[] = [];
        for (let d = 0; d < 6; d++) {
          const ni = i + DIR[d][0], nj = j + DIR[d][1], nk = k + DIR[d][2];
          if (inside(ni, nj, nk)) {
            // A face inside a brick: its key names the two bays (the set adds the brick's own name), and a body goes through it when the
            // brick's node has floor in both bays.
            const a = at.join(','), bb = [ni - br.origin[0], nj - br.origin[1], nk - br.origin[2]].join(',');
            keys.push(`L${d}:${a}>${bb}`);
            pass.push(nodeCells > 0 && node.bays.has(bayIndex({ nx, ny }, ni, nj, nk)));
          } else if (d < 4) {
            const io = sideIn[d] + sideOut[d] === 0 ? '-' : sideIn[d] >= sideOut[d] ? 'i' : 'o';
            keys.push(sideKey(voxels, d, io));
            pass.push(sideNode[d] > 0);
          } else {
            // The top of a room says it wants something over it (a slab, a roof): a room is never left open to the sky.
            keys.push(`${d === 4 && nodeCells > 0 && nodeCovered * 2 > nodeCells ? 'c' : 'o'}:${flatKey(voxels, d === 4 ? H - 1 : 0)}`);
            pass.push(false);
          }
        }
        let solid = 0;
        for (const v of voxels) if (v) solid++;
        const indoor = nodeCells > 0 && nodeCovered * 2 > nodeCells;
        // A brick of more storeys is a stair (or a ramp): its bottom storey stands where the massing says q, the rest where it says Q.
        const multiStorey = br.size[2] > 1;
        let role: Role;
        if (multiStorey) role = k === br.origin[2] ? 'q' : 'Q';
        else if (!solid) role = 'A';
        else if (!inBox(i, j)) role = k === 0 ? 'S' : 'A';
        else if (indoor) role = k === 0 ? 'H' : 'B';
        else role = k === 0 ? 'Y' : 'R';
        bays.push({ i, j, k, role, brick: brickOf[b], at, keys, pass, node: nodeCells > 0, indoor, ...(multiStorey ? { stair: role as 'q' | 'Q' } : {}), voxels });
        if (indoor && inBox(i, j)) {
          rooms++;
          let hit = false;
          for (const [cell, l] of node.label)
            if (l === node.main && seen[cell] && bayOf(cell) === b) {
              hit = true;
              break;
            }
          if (hit) reached++;
        }
      }
  return { t, nx, ny, nz, bays, bricks, reached: [reached, rooms] };
}
