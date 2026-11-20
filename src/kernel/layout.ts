// From draft to playable chunk:
//   1. the procedural draft is continuous across chunks (world coordinates);
//   2. deterministic gates on every edge are made walkable (both sides agree: same edge, same hash);
//   3. the chosen layout program (MarkovJunior rules, written by the Cartographer) transforms the
//      interior; the 1-tile border ring is frozen, so chunks always join seamlessly;
//   4. connectivity is guaranteed: every gate, door and sizeable walkable area is joined to the rest
//      by carving the cheapest path (vegetation before rock, never through lots); a plan with the mark of T438
//      (`swim`, ADR-0224) is joined on foot or swimming: the water one swims is a way and is never carved;
//   5. lots (indoor floor enclosed by walls) are recognised for roofs and interiors.
// The void (T445, ADR-0233) is the absence of a floor: never carved, never a gate (a gate on it stays void), never written nor taken away
// by a program; a place whose gates are all on the void is joined from its land nearest the middle.
// A place of a block (T370, ADR-0206) has cells reserved for the lot of more places: the program does not write them, no path goes
// through them, they are never reachable; its gates are the kernel's (those inside the block moved into the ring).

import { hash32 } from './rng';
import { resolveStamps, run, type MjNode } from './mj';
import { defaultCodes, stampGround } from './stamps';
import { STRUCTURE_VPT } from '../mj/classes';
import { crossingOf, isVoid } from './nature';
import type { TerrainDef } from './types';

export interface Lot {
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
  lots: Lot[];
  gates: number[];
  /** Cells reachable from the gates: where entities may be placed (walked: with `swim` the water that joins them is not among them). */
  reachable: Set<number>;
  carved: number;
  steps: number;
  /** With `stages` (the phases of the model of places, T26): the grid with its gates, and after the program. */
  stages?: { gated: string[]; programmed: string[] };
}

export interface LayoutOptions {
  cx: number;
  cy: number;
  seed: number;
  program?: MjNode;
  /** Code used for carved paths and gates. */
  pathCode: string;
  /** Keep the intermediate grids (`LayoutResult.stages`). */
  stages?: boolean;
  /** Cells under the lot of a block (T370): frozen for the program, never walked nor carved, never reachable. */
  reserved?: ReadonlySet<number>;
  /** The four gates ([west, east, north, south]) when they are not `gates`' (a place of a block, `blockGates`). */
  gates?: number[];
  /** Cells that must be walked and reached from the gates (the edge of the lot of a block, T370): path where they block, frozen for the program. */
  apron?: ReadonlySet<number>;
  /**
   * The voxels a tile of the structures the stamps cut their buildings for (T407, `StampCut`): STRUCTURE_VPT if not said, TILE for the
   * plans of before (`ChunkPlan.vpt` absent), whose places keep the stamps they were drawn with.
   */
  vpt?: number;
  /**
   * The water one swims is a way (T438, ADR-0224): it joins what it touches and is never carved, a gate on it stays water. Only for the
   * plans with the mark (`ChunkPlan.swim`): a plan of before keeps the paths it dug on the water.
   */
  swim?: boolean;
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

function solidCost(t: TerrainDef | undefined): number {
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

/** Whether a body goes over a terrain: on foot, and swimming where the layout counts it (T438). */
const goesOver = (t: TerrainDef | undefined, swim: boolean): boolean => t?.solid === false || (swim && crossingOf(t) === 'swim');

/** Indices of walkable cells connected to `from` (4-neighbourhood); `blocked` cells are never walked (the lot of a block); with `swim` through the water one swims. */
function flood(grid: string[], size: number, palette: Record<string, TerrainDef>, from: number[], blocked?: ReadonlySet<number>, swim = false): Set<number> {
  const seen = new Set<number>();
  const queue = from.filter((i) => goesOver(palette[grid[Math.floor(i / size)][i % size]], swim) && !blocked?.has(i));
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
      if (seen.has(n) || !goesOver(palette[grid[ny][nx]], swim) || blocked?.has(n)) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return seen;
}

/** Cheapest path (Dijkstra) from `start` to any cell of `targets`, through solid cells if needed. */
function carvePath(cells: string[][], size: number, palette: Record<string, TerrainDef>, start: number, targets: Set<number>, frozen: Set<number>, swim = false): number[] | null {
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
      const t = palette[cells[ny][nx]];
      // Nothing is carved through the void (T445): no way goes over it.
      if (isVoid(t)) continue;
      const nd = d + (swim && crossingOf(t) === 'swim' ? 1 : solidCost(t));
      if (nd < (dist.get(n) ?? Infinity)) {
        dist.set(n, nd);
        prev.set(n, cur);
        open.push([nd, n]);
      }
    }
  }
  return null;
}

export function findLots(grid: string[], size: number, palette: Record<string, TerrainDef>): Lot[] {
  const seen = new Set<number>();
  const out: Lot[] = [];
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

export function layout(draft: string[], palette: Record<string, TerrainDef>, opts: LayoutOptions): LayoutResult {
  const size = draft.length;
  const cells = draft.map((r) => [...r]);
  const border = new Set<number>();
  for (let i = 0; i < size; i++) for (const c of [i, (size - 1) * size + i, i * size, i * size + size - 1]) border.add(c);
  const gateTiles = opts.gates?.length === 4 ? opts.gates : gates(opts.cx, opts.cy, size, opts.seed);
  const reserved = opts.reserved ?? new Set<number>();
  const swim = opts.swim === true;
  const walkable = (i: number) => palette[cells[Math.floor(i / size)][i % size]]?.solid === false && !reserved.has(i);
  // A gate on the water one swims stays water (T438): the place beyond is reached swimming.
  const swum = (i: number) => swim && crossingOf(palette[cells[Math.floor(i / size)][i % size]]) === 'swim';
  // A gate on the void is no gate (T445): the land does not go on there.
  const voided = (i: number) => isVoid(palette[draft[Math.floor(i / size)][i % size]]);
  for (const g of gateTiles) if (!walkable(g) && !reserved.has(g) && !swum(g) && !voided(g)) cells[Math.floor(g / size)][g % size] = opts.pathCode;
  const apron = [...(opts.apron ?? [])].filter((i) => i >= 0 && i < size * size && !reserved.has(i));
  for (const a of apron) if (!walkable(a)) cells[Math.floor(a / size)][a % size] = opts.pathCode;
  const gated = opts.stages ? cells.map((r) => r.join('')) : undefined;

  // The layout program shapes the interior; the border ring stays exactly as the draft.
  let steps = 0;
  if (opts.program) {
    // The stamps keep off each other and off the buildings the rules drew (T407): one lot, one structure.
    const built = Object.entries(palette).filter(([, t]) => t.layer === 'wall' || t.layer === 'door' || t.indoor).map(([c]) => c).join('');
    const cut = { vpt: opts.vpt ?? STRUCTURE_VPT, built, claimed: new Set<number>(), ground: stampGround(palette) };
    const grid = { w: size, h: size, cells: cells.flat(), fixed: reserved.size || apron.length ? new Set([...border, ...reserved, ...apron]) : border, cut };
    steps = run(resolveStamps(opts.program, defaultCodes(palette, opts.pathCode)), grid, hash32(opts.seed, opts.cx, opts.cy, 77));
    for (let i = 0; i < size * size; i++) cells[Math.floor(i / size)][i % size] = palette[grid.cells[i]] ? grid.cells[i] : draft[Math.floor(i / size)][i % size];
    // The void is the kernel's (T445): a program neither builds on it nor opens it in the land.
    for (let i = 0; i < size * size; i++) if (voided(i) !== isVoid(palette[cells[Math.floor(i / size)][i % size]])) cells[Math.floor(i / size)][i % size] = draft[Math.floor(i / size)][i % size];
  }

  // Connectivity: everything that matters must be reachable from the first gate.
  let carved = 0;
  const rows = () => cells.map((r) => r.join(''));
  const stages = gated && { gated, programmed: rows() };
  const doorTiles: number[] = [];
  for (let i = 0; i < size * size; i++) if (palette[cells[Math.floor(i / size)][i % size]]?.layer === 'door' && !reserved.has(i)) doorTiles.push(i);
  // From the first gate the lot of a block does not cover (T404: in a block of 3 × 3 an edge may lie under it whole); the first gate elsewhere.
  // A gate on the void is none (T445); a place whose gates are all on it starts from its land nearest the middle.
  const live = gateTiles.filter((g) => !voided(g));
  const first = live.length ? Math.max(0, live.findIndex((g) => !reserved.has(g))) : -1;
  const start = first >= 0 ? live[first] : landNearMiddle(cells, size, palette, reserved);
  const mustReach = [...live.filter((_, i) => i !== first), ...doorTiles, ...apron].filter((i) => !reserved.has(i) && !voided(i));
  let reach = flood(rows(), size, palette, [start], reserved, swim);
  const frozen = new Set([...border].filter((b) => !gateTiles.includes(b)));
  for (const r of reserved) frozen.add(r);
  const join = (from: number) => {
    const path = carvePath(cells, size, palette, from, reach, frozen, swim);
    if (!path) return;
    for (const c of path) {
      const x = c % size;
      const y = Math.floor(c / size);
      const t = palette[cells[y][x]];
      if (t?.solid && t.layer !== 'wall' && !(swim && crossingOf(t) === 'swim')) {
        cells[y][x] = opts.pathCode;
        carved++;
      }
    }
    reach = flood(rows(), size, palette, [start], reserved, swim);
  };
  for (const target of mustReach) if (!reach.has(target)) join(target);
  // Sizeable walkable pockets are joined too; tiny ones are left as scenery.
  const visited = new Set(reach);
  for (let i = 0; i < size * size; i++) {
    if (visited.has(i) || !walkable(i)) continue;
    const pocket = flood(rows(), size, palette, [i], reserved, swim);
    for (const p of pocket) visited.add(p);
    // Sizeable by what is walked in it (T438): a tile of shore by a pond is not a pocket of five.
    const walked = swim ? [...pocket].filter(walkable).length : pocket.size;
    if (walked >= 4 && !pocket.has(start)) join(i);
  }

  const grid = rows();
  // Where entities may be placed is what is walked (T438): nothing is set on the water, even where it joins the place.
  const reachable = swim ? new Set([...reach].filter((i) => palette[grid[Math.floor(i / size)][i % size]]?.solid === false)) : reach;
  return { grid, lots: findLots(grid, size, palette), gates: gateTiles, reachable, carved, steps, ...(stages ? { stages } : {}) };
}

/** The walked cell nearest the middle of a place (T445: where a place of the void with no gate is joined from); 0 if none. */
function landNearMiddle(cells: string[][], size: number, palette: Record<string, TerrainDef>, reserved: ReadonlySet<number>): number {
  let best = 0, far = Infinity;
  const m = (size - 1) / 2;
  for (let i = 0; i < size * size; i++) {
    if (reserved.has(i) || palette[cells[Math.floor(i / size)][i % size]]?.solid !== false) continue;
    const d = Math.hypot((i % size) - m, Math.floor(i / size) - m);
    if (d < far) [best, far] = [i, d];
  }
  return best;
}

/**
 * Articulation points (cut vertices) of an undirected 4-connected grid graph of free cells.
 * Removing an articulation point increases the number of connected components of the free cells
 * (rule 10: solid obstacles must not be placed on them, otherwise the place is separated).
 */
export function articulationPoints(freeTiles: Set<number>, size: number): Set<number> {
  const result = new Set<number>();
  if (freeTiles.size <= 2) return result;

  const visited = new Set<number>();
  const tin = new Map<number, number>();
  const low = new Map<number, number>();
  let timer = 0;

  const neighborsOf = (u: number): number[] => {
    const x = u % size;
    const y = Math.floor(u / size);
    const nbrs: number[] = [];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        const v = ny * size + nx;
        if (freeTiles.has(v)) nbrs.push(v);
      }
    }
    return nbrs;
  };

  const dfs = (u: number, p?: number) => {
    visited.add(u);
    tin.set(u, timer);
    low.set(u, timer);
    timer++;
    let children = 0;

    for (const to of neighborsOf(u)) {
      if (to === p) continue;
      if (visited.has(to)) {
        low.set(u, Math.min(low.get(u)!, tin.get(to)!));
      } else {
        dfs(to, u);
        low.set(u, Math.min(low.get(u)!, low.get(to)!));
        if (low.get(to)! >= tin.get(u)! && p !== undefined) {
          result.add(u);
        }
        children++;
      }
    }
    if (p === undefined && children > 1) {
      result.add(u);
    }
  };

  for (const u of freeTiles) {
    if (!visited.has(u)) {
      dfs(u);
    }
  }

  return result;
}

