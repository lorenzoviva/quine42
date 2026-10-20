// From draft to playable chunk:
//   1. the procedural draft is continuous across chunks (world coordinates);
//   2. deterministic gates on every edge are made walkable (both sides agree: same edge, same hash);
//   3. the chosen layout program (MarkovJunior rules, written by the Cartographer) transforms the
//      interior; the 1-tile border ring is frozen, so chunks always join seamlessly;
//   4. connectivity is guaranteed: every gate, door and sizeable walkable area is joined to the rest
//      by carving the cheapest path (vegetation before rock, never through buildings);
//   5. buildings (indoor floor enclosed by walls) are recognised for roofs and interiors.

import { hash32 } from './rng';
import { run, type MjNode } from './mj';
import type { TileDef } from './types';

export interface Building {
  /** Cell indices (row * size + col) of indoor floor. */
  floor: number[];
  walls: number[];
  doors: number[];
  /** Bounding box in chunk cells, inclusive. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface LayoutResult {
  grid: string[];
  buildings: Building[];
  gates: number[];
  /** Cells reachable from the gates: where things may be placed. */
  reachable: Set<number>;
  carved: number;
  steps: number;
}

export interface LayoutOptions {
  cx: number;
  cy: number;
  seed: number;
  program?: MjNode;
  /** Code used for carved paths and gates. */
  pathCode: string;
}

const DIRS: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Gate positions along each edge, identical for the two chunks sharing it. */
export function gates(cx: number, cy: number, size: number, seed: number): number[] {
  const along = (a: number, b: number, c: number) => 2 + (hash32(seed, a, b, c) % (size - 4));
  const out: number[] = [];
  // Vertical edges are identified by the x of their right chunk, horizontal ones by the y of the lower chunk.
  const west = along(cx, cy, 1);
  const east = along(cx + 1, cy, 1);
  const north = along(cx, cy, 2);
  const south = along(cx, cy + 1, 2);
  out.push(west * size + 0, east * size + (size - 1), 0 * size + north, (size - 1) * size + south);
  return out;
}

function solidCost(t: TileDef | undefined): number {
  if (!t) return 50;
  if (!t.solid) return 1;
  switch (t.layer) {
    case 'vegetation':
      return 4;
    case 'liquid':
      return 7;
    case 'rock':
      return 9;
    case 'wall':
      return 80;
    default:
      return 8;
  }
}

/** Indices of walkable cells connected to `from` (4-neighbourhood). */
function flood(grid: string[], size: number, palette: Record<string, TileDef>, from: number[]): Set<number> {
  const seen = new Set<number>();
  const queue = from.filter((i) => palette[grid[Math.floor(i / size)][i % size]]?.solid === false);
  for (const q of queue) seen.add(q);
  while (queue.length) {
    const cur = queue.pop()!;
    const x = cur % size;
    const y = Math.floor(cur / size);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const n = ny * size + nx;
      if (seen.has(n) || palette[grid[ny][nx]]?.solid !== false) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return seen;
}

/** Cheapest path (Dijkstra) from `start` to any cell of `targets`, through solid cells if needed. */
function carvePath(cells: string[][], size: number, palette: Record<string, TileDef>, start: number, targets: Set<number>, frozen: Set<number>): number[] | null {
  const dist = new Map<number, number>([[start, 0]]);
  const prev = new Map<number, number>();
  const open: Array<[number, number]> = [[0, start]];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [d, cur] = open.splice(bi, 1)[0];
    if (d > (dist.get(cur) ?? Infinity)) continue;
    if (targets.has(cur) && cur !== start) {
      const path: number[] = [];
      for (let c: number | undefined = cur; c !== undefined; c = prev.get(c)) path.push(c);
      return path.reverse();
    }
    const x = cur % size;
    const y = Math.floor(cur / size);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const n = ny * size + nx;
      if (frozen.has(n) && !targets.has(n)) continue;
      const nd = d + solidCost(palette[cells[ny][nx]]);
      if (nd < (dist.get(n) ?? Infinity)) {
        dist.set(n, nd);
        prev.set(n, cur);
        open.push([nd, n]);
      }
    }
  }
  return null;
}

export function findBuildings(grid: string[], size: number, palette: Record<string, TileDef>): Building[] {
  const seen = new Set<number>();
  const out: Building[] = [];
  for (let i = 0; i < size * size; i++) {
    const t = palette[grid[Math.floor(i / size)][i % size]];
    if (seen.has(i) || !t?.indoor) continue;
    const floor: number[] = [];
    const walls = new Set<number>();
    const doors = new Set<number>();
    const queue = [i];
    seen.add(i);
    let x0 = size, y0 = size, x1 = -1, y1 = -1;
    while (queue.length) {
      const cur = queue.pop()!;
      floor.push(cur);
      const x = cur % size;
      const y = Math.floor(cur / size);
      for (const [dx, dy] of [...DIRS, [1, 1], [-1, -1], [1, -1], [-1, 1]] as Array<[number, number]>) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        const n = ny * size + nx;
        const nt = palette[grid[ny][nx]];
        if (nt?.indoor) {
          if (!seen.has(n) && Math.abs(dx) + Math.abs(dy) === 1) {
            seen.add(n);
            queue.push(n);
          }
        } else if (nt?.layer === 'wall') walls.add(n);
        else if (nt?.layer === 'door') doors.add(n);
      }
    }
    for (const c of [...floor, ...walls, ...doors]) {
      const x = c % size;
      const y = Math.floor(c / size);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    out.push({ floor, walls: [...walls], doors: [...doors], x0, y0, x1, y1 });
  }
  return out;
}

export function layout(draft: string[], palette: Record<string, TileDef>, opts: LayoutOptions): LayoutResult {
  const size = draft.length;
  const cells = draft.map((r) => [...r]);
  const border = new Set<number>();
  for (let i = 0; i < size; i++) for (const c of [i, (size - 1) * size + i, i * size, i * size + size - 1]) border.add(c);
  const gateCells = gates(opts.cx, opts.cy, size, opts.seed);
  const walkable = (i: number) => palette[cells[Math.floor(i / size)][i % size]]?.solid === false;
  for (const g of gateCells) if (!walkable(g)) cells[Math.floor(g / size)][g % size] = opts.pathCode;

  // The layout program shapes the interior; the border ring stays exactly as the draft.
  let steps = 0;
  if (opts.program) {
    const grid = { w: size, h: size, cells: cells.flat(), fixed: border };
    steps = run(opts.program, grid, hash32(opts.seed, opts.cx, opts.cy, 77));
    for (let i = 0; i < size * size; i++) cells[Math.floor(i / size)][i % size] = palette[grid.cells[i]] ? grid.cells[i] : draft[Math.floor(i / size)][i % size];
  }

  // Connectivity: everything that matters must be reachable from the first gate.
  let carved = 0;
  const rows = () => cells.map((r) => r.join(''));
  const doorCells: number[] = [];
  for (let i = 0; i < size * size; i++) if (palette[cells[Math.floor(i / size)][i % size]]?.layer === 'door') doorCells.push(i);
  const mustReach = [...gateCells.slice(1), ...doorCells];
  let reach = flood(rows(), size, palette, [gateCells[0]]);
  const join = (from: number) => {
    const path = carvePath(cells, size, palette, from, reach, new Set([...border].filter((b) => !gateCells.includes(b))));
    if (!path) return;
    for (const c of path) {
      const x = c % size;
      const y = Math.floor(c / size);
      const t = palette[cells[y][x]];
      if (t?.solid && t.layer !== 'wall') {
        cells[y][x] = opts.pathCode;
        carved++;
      }
    }
    reach = flood(rows(), size, palette, [gateCells[0]]);
  };
  for (const target of mustReach) if (!reach.has(target)) join(target);
  // Sizeable walkable pockets are joined too; tiny ones are left as scenery.
  const visited = new Set(reach);
  for (let i = 0; i < size * size; i++) {
    if (visited.has(i) || !walkable(i)) continue;
    const pocket = flood(rows(), size, palette, [i]);
    for (const p of pocket) visited.add(p);
    if (pocket.size >= 4 && !pocket.has(gateCells[0])) join(i);
  }

  const grid = rows();
  return { grid, buildings: findBuildings(grid, size, palette), gates: gateCells, reachable: reach, carved, steps };
}
