// The interiors of a building, the kernel's part (T409, ADR-0212; `docs/design/scenografo.md` § 2 and § 10.1). A building that grows by
// rules changes with every seed, so its interior is written apart from it (the Scenografo, T259, T303, T406) and placed on the building
// already made. The kernel measures what a body uses and what must stay as it is, and keeps only the furniture that breaks nothing:
//
//   - the plan (`interiorPlan`): on the feet layer of every storey, the free floor a body sweeps, only where something is above it (the
//     yard and the fields outside are not furnished); what is kept (the door and the straight way in, the stairs and a body around their
//     feet and heads, what belongs to no room, the rooms smaller than `SMALL_ROOM`, the storeys smaller than `SMALL_STOREY`); the place of
//     the animals (the tiles of an area that names them, `ANIMAL_AREAS`);
//   - the stage (`stageGrid`): those classes as letters, `W` any part of the building, `F` free floor, `C` free floor under the ground,
//     `P` kept, `A` the free floor of the animals; a program of a second stage reads only these, so one program serves every seed;
//   - the guard (`InteriorGuard`): a piece of furniture is kept only if it writes on no part of the building, no place of the animals,
//     leaves the cellar holding (T419: what `groundOfForm` measures on the furnished building), cuts nothing off (every centre a body
//     stands on, storeys, stairs and the ground, in as many pieces as before) and leaves the room the Sculptor's checks want (`partErrors`:
//     the side of the largest room, never under the least, or under what it was if it was less).
//
// Furniture never touches the building: what a program writes on `W` is not written, what it writes on `A` or cuts off is taken away.

import { areasOf } from '../mj/areas';
import { partVoxels } from '../mj/classes';
import type { Grid3, PaletteEntry } from '../mj/engine';
import type { VoxelGrid } from '../mj/mesh';
import type { MjxClip } from '../mj/model';
import { BODY_R, groundOfForm, headroomAbove, largestSquare, levelAt, rampBlocks, standingCells, stepOf, storeysOf, walkIn, type Form, type Ground, type Walked } from './forms';

/** A storey with less covered floor than this, in tiles², is not furnished at all: it would stop being a storey (T303, T406: 2). */
export const SMALL_STOREY = 2;
/** A room whose body centres cover less than this, in tiles², stays empty (T259). */
export const SMALL_ROOM = 0.6;
/** The narrowest passage that still joins two rooms, in tiles: the floor of a storey is cut there into rooms. */
export const NARROW = 0.4;

/** The classes of the stage: the letters a program of a second stage reads (T303). */
export const STAGE = { wall: 'W', free: 'F', cellar: 'C', kept: 'P', animals: 'A' } as const;
/** The stage's alphabet, in the order of its codes (0 the empty cell). */
export const STAGE_ALPHABET = ['.', STAGE.wall, STAGE.free, STAGE.cellar, STAGE.kept, STAGE.animals];

/**
 * The areas where animals stand (T346 takes them out of the program: the program marks where they go). Area names are free words
 * (`AREA_RE`): the English the Sculptor's prompt uses, and the Italian a program may slip into.
 */
export const ANIMAL_AREAS = /pasture|paddock|pen|fold|barn|stable|stall|byre|coop|sty|corral|meadow|pascol|recint|ovil|porcil|pollai/i;

/** A building made, as the kernel gives it to the interior: its grid as built, how dense, how deep under the ground, its actions. */
export interface InteriorBuilding {
  grid: VoxelGrid;
  palette: Record<string, PaletteEntry>;
  vpt: number;
  /** Voxels under the ground (ADR-0091). */
  base?: number;
  /** Its actions: the door is walked open (`open`). */
  actions?: readonly MjxClip[];
  seed?: number;
  /**
   * The density whose voxels the Sculptor's parts are measured at (`partVoxels`), if not `vpt`: the game measures a structure at its
   * own density (`checkOnce`); a bench reading the voxels of before at another one says it.
   */
  partsVpt?: number;
}

/** A storey as the interior sees it. */
export interface StoreyPlan {
  /** Height of its floor, voxels from the bottom of the grid. */
  z: number;
  /** Covered floor reached, in tiles². */
  area: number;
  /** Under the ground: only furniture from floor to ceiling (a low top would be a floor no body reaches, ADR-0135). */
  cellar: boolean;
  /** Its body centres on covered floor, `x + y·X`. */
  centres: Set<number>;
  /** Air at the feet a body sweeps (the centres widened by the body), not kept. */
  free: Uint8Array;
  /** Air at the feet that must stay free. */
  kept: Uint8Array;
}

export interface InteriorPlan {
  X: number;
  Y: number;
  Z: number;
  vpt: number;
  base: number;
  /** The building as a body finds it: the door open. */
  walked: Walked;
  /** The grid as built (the door shut): where furniture is written. */
  built: VoxelGrid;
  palette: Record<string, PaletteEntry>;
  storeys: StoreyPlan[];
  /** The front door: a covered cell of the ground floor that opens to the front. */
  door?: { x: number; y: number };
  /** Per feet column `x + y·X`: on a tile of the animals. */
  animals: Uint8Array;
  /** The areas of the animals the building marks. */
  animalAreas: string[];
  /** The storey of the ground (the first above the ground), if any. */
  ground?: StoreyPlan;
  /** A person's height, in voxels. */
  person: number;
  /** The density of the Sculptor's parts. */
  partsVpt: number;
  /** How the door opens and the seed it opens with: the kernel's walk on the furnished building (`walkIn`, T419). */
  actions: readonly MjxClip[];
  seed: number;
}

/**
 * The plan of a building's interior (T409): what a body uses on every storey, what must stay free and where the animals stand. The same
 * for every way of furnishing: it is the floor, not a task of the agent.
 */
export function interiorPlan(b: InteriorBuilding): InteriorPlan {
  const vpt = b.vpt;
  const base = b.base ?? 0;
  const w = walkIn(b.grid, b.palette, vpt, base, b.actions ?? [], b.seed ?? 1);
  const g = w.g;
  const { X, Y, Z } = g;
  const XY = X * Y;
  const step = stepOf(vpt);
  const r = Math.ceil(BODY_R * vpt);
  const keep = Math.ceil(2 * BODY_R * vpt) + 2;
  const covered = (c: { x: number; y: number; z: number }) => headroomAbove(w.levels, c.x + c.y * X, c.z) !== undefined;
  const storeys: StoreyPlan[] = storeysOf(w, vpt).map((z) => ({
    z,
    area: w.celle.filter((c) => Math.abs(c.z - z) <= 1 && covered(c)).length / (vpt * vpt),
    cellar: z < base,
    centres: new Set<number>(),
    free: new Uint8Array(XY),
    kept: new Uint8Array(XY),
  }));
  const storeyOf = (z: number) => storeys.findIndex((p) => Math.abs(p.z - z) <= 1);
  // Stairs and ramps: centres between storeys, not the ground outside; they keep the cells of the storeys they touch.
  const ramps: Array<{ x: number; y: number; z: number }> = [];
  for (const c of w.celle) {
    const k = storeyOf(c.z);
    if (k >= 0) {
      if (covered(c)) storeys[k].centres.add(c.x + c.y * X);
    } else if (Math.abs(c.z - base) > step) ramps.push(c);
  }
  const air = (x: number, y: number, z: number) => x >= 0 && y >= 0 && x < X && y < Y && z < Z && g.cells[x + y * X + z * XY] === 0;
  const mark = (mask: Uint8Array, x: number, y: number, z: number, d: number) => {
    for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (air(x + dx, y + dy, z)) mask[x + dx + (y + dy) * X] = 1;
  };
  // What a body reaches from (x, y) within `d` voxels walking through air on the feet layer: what is kept does not pass walls.
  const flood = (mask: Uint8Array, x: number, y: number, z: number, d: number) => {
    if (!air(x, y, z)) return;
    const dist = new Map<number, number>([[x + y * X, 0]]);
    const queue = [x + y * X];
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q];
      mask[i] = 1;
      const di = dist.get(i)!;
      if (di >= d) continue;
      const cx = i % X, cy = (i - cx) / X;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = cx + dx + (cy + dy) * X;
        if (dist.has(j) || !air(cx + dx, cy + dy, z)) continue;
        dist.set(j, di + 1);
        queue.push(j);
      }
    }
  };
  // The highest voxel of the building over every column: a floor is covered under it.
  const top = new Int32Array(XY).fill(-1);
  for (let z = 0; z < Z; z++) for (let i = 0; i < XY; i++) if (g.cells[i + z * XY] || b.grid.cells[i + z * XY]) top[i] = z;
  for (const p of storeys) {
    for (const i of p.centres) mark(p.free, i % X, Math.floor(i / X), p.z, r);
    // The body's width does not go past the eaves: the yard is not furnished.
    for (let i = 0; i < XY; i++) if (top[i] <= p.z) p.free[i] = 0;
  }
  for (const c of ramps) for (const p of storeys) if (Math.abs(p.z - c.z) <= step * 3) flood(p.kept, c.x, c.y, p.z, keep + r);
  // A stair solid under its treads (the cellar's of `part-cellar`, T419) has no air at the storey's feet over them: its foot is the centres of
  // the storey a step from its first tread, and what is kept is flooded from there.
  const rampAt = new Map<number, number[]>();
  for (const c of ramps) {
    const i = c.x + c.y * X;
    const zs = rampAt.get(i);
    if (zs) zs.push(c.z);
    else rampAt.set(i, [c.z]);
  }
  for (const p of storeys)
    for (const i of p.centres) {
      const x = i % X;
      const near = [x > 0 ? i - 1 : -1, x < X - 1 ? i + 1 : -1, i - X, i + X].some((j) => rampAt.get(j)?.some((z) => Math.abs(z - p.z) <= step * 3));
      if (near) flood(p.kept, x, (i - x) / X, p.z, keep + r);
    }
  const ground = storeys.find((p) => !p.cellar);
  const door = frontDoor(w, vpt, base);
  if (door && storeys.length) {
    const at = ground ?? storeys[0];
    flood(at.kept, door.x, Math.max(0, door.y - 2), at.z, Math.round(1.2 * vpt));
    // The straight way in from the door, a body wide.
    for (let y = door.y; y >= Math.max(0, door.y - Math.round(1.5 * vpt)); y--) flood(at.kept, door.x, y, at.z, keep);
  }
  // A small storey stays empty, and so do a small room and what belongs to no room (a cell too small to have a core, the neck of a
  // stair): a storey keeps the floor that makes it a storey.
  for (const p of storeys) {
    if (p.area < SMALL_STOREY) for (const i of p.centres) mark(p.kept, i % X, Math.floor(i / X), p.z, r + 1);
    const inRoom = new Set<number>();
    for (const room of roomsOf(p.centres, X, Y, Math.round(NARROW * vpt))) if (room.length >= SMALL_ROOM * vpt * vpt) for (const i of room) inRoom.add(i);
    for (const i of p.centres) if (!inRoom.has(i)) mark(p.kept, i % X, Math.floor(i / X), p.z, r + 1);
  }
  for (const p of storeys) for (let i = 0; i < XY; i++) if (p.kept[i]) p.free[i] = 0;
  // The animals: the tiles of their areas on the ground the building marks (ADR-0182).
  const areas = areasOf(b.grid, b.palette, vpt, base);
  const animalAreas = Object.keys(areas).filter((a) => ANIMAL_AREAS.test(a));
  const tiles = new Set(animalAreas.flatMap((a) => areas[a].map(([x, y]) => `${x},${y}`)));
  const animals = new Uint8Array(XY);
  if (tiles.size) for (let i = 0; i < XY; i++) if (tiles.has(`${Math.floor((i % X) / vpt)},${Math.floor(Math.floor(i / X) / vpt)}`)) animals[i] = 1;
  return {
    X, Y, Z, vpt, base, walked: w, built: b.grid, palette: b.palette, storeys, ...(door ? { door } : {}), animals, animalAreas, ...(ground ? { ground } : {}),
    person: Math.ceil(1.5 * vpt),
    partsVpt: b.partsVpt ?? vpt,
    actions: b.actions ?? [],
    seed: b.seed ?? 1,
  };
}

/**
 * The stage of a building (T303): the building as `W`, the feet layer of every storey as its classes; a grid of the building's size
 * and the stage's own alphabet (`STAGE_ALPHABET`). A program of a second stage runs on it and never sees the building's letters.
 */
export function stageGrid(plan: InteriorPlan): Grid3 {
  const g = plan.walked.g;
  const XY = g.X * g.Y;
  const cells = new Uint8Array(g.cells.length);
  for (let i = 0; i < cells.length; i++) cells[i] = g.cells[i] || plan.built.cells[i] ? 1 : 0;
  for (const p of plan.storeys)
    for (let i = 0; i < XY; i++) {
      const at = i + p.z * XY;
      if (at >= cells.length || cells[at]) continue;
      if (p.kept[i]) cells[at] = 4;
      else if (p.free[i]) cells[at] = p.cellar ? 3 : p === plan.ground && plan.animals[i] ? 5 : 2;
    }
  return { X: g.X, Y: g.Y, Z: g.Z, cells, alphabet: [...STAGE_ALPHABET], log: [], epoch: 0 } as Grid3;
}

/**
 * The kernel's guard on furniture (T259, T409), the same for every way: a piece is kept only if it writes on air of the building, not on
 * the place of the animals, leaves the cellar holding (no top under the ground a body could stand on and not reach, T419), keeps the
 * Sculptor's room and cuts nothing off. The last is the kernel's own walk (`walkIn`, without the jumps): from the front, every step a body takes with the floors and the edges of
 * `rampBlocks`; with a piece the floors are made again and the steps into the columns near it tried again, and every place reached
 * before that the piece does not take (a body would stand in it, `touched`) must still be reached.
 */
export class InteriorGuard {
  private readonly X: number;
  private readonly Y: number;
  private readonly XY: number;
  private readonly N: number;
  private readonly r: number;
  private readonly step: number;
  /** The margin of the walk around the grid (`walkIn`): a body walks around the building. */
  private readonly m: number;
  private readonly W: number;
  /** Every place of the walk: its column (x, y, also out of the grid by the margin) and the height of the feet. */
  private xs: number[] = [];
  private ys: number[] = [];
  private zs: number[] = [];
  private ids = new Map<number, number>();
  /** The steps of the walk, place to place. */
  private out: number[][] = [];
  /** Places a piece took (a body would stand in it). */
  private gone: Uint8Array;
  /** The rooms the Sculptor measures: per height, the feet height of each column (-1 none), what furniture took, the side now. */
  private rooms: Array<{ zAt: Int16Array; gone: Uint8Array; side: number }> = [];
  private readonly clear: number;
  private readonly body: number;
  /** The least side the largest room keeps, voxels (0: nothing to keep). */
  readonly roomSide: number;
  /** From the ground up to a person above the ground floor: the height of the animals. */
  private readonly animalTop: number;
  /** The building as a body finds it with the furniture kept so far, the furniture as one letter with a colour: what a body stands on now. */
  private work: VoxelGrid;
  private workPalette: Record<string, PaletteEntry>;
  private furniture: number;
  /** The building's cellar holds (`groundOfForm` keeps its hole, T52b): a piece must leave it so (T419). */
  private readonly holds: boolean;

  constructor(private plan: InteriorPlan) {
    const { X, Y, Z, vpt, base } = plan;
    this.X = X;
    this.Y = Y;
    this.XY = X * Y;
    this.N = X * Y * Z;
    this.r = Math.ceil(BODY_R * vpt);
    this.step = stepOf(vpt);
    this.m = Math.ceil(BODY_R * vpt) + 2;
    this.W = X + 2 * this.m;
    const g = plan.walked.g;
    const letter = '\u{E1FF}';
    this.work = { X, Y, Z, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet, letter] };
    this.furniture = this.work.alphabet.length - 1;
    this.workPalette = { ...plan.palette, [letter]: { color: '808080' } };
    const ground = groundOfForm(this.work, this.workPalette, vpt, base);
    this.holds = base > 0 && !!ground.hole;
    // The walk, as `walkIn` makes it without the jumps: every place and every step.
    this.node(Math.floor(X / 2), Y + this.m - 1, base);
    for (let a = 0; a < this.xs.length; a++)
      for (const [nx, ny, to] of this.steps(a, ground)) this.out[a].push(this.ids.get(this.key(nx, ny, to)) ?? this.node(nx, ny, to));
    this.gone = new Uint8Array(this.xs.length);
    // The Sculptor's room (`habitableParts`, `partErrors`): the largest square of covered floor under a ceiling a storey high.
    const parts = partVoxels(plan.partsVpt);
    this.clear = parts.storey.clear;
    this.body = Math.round(2 * BODY_R * vpt);
    const { cells, heights } = standingCells(plan.walked, vpt);
    let best = 0;
    for (const z of heights) {
      const zAt = new Int16Array(this.XY).fill(-1);
      for (const c of cells) if (Math.abs(c.z - z) <= 1 && c.head >= this.clear) zAt[c.i] = Math.max(zAt[c.i], c.z);
      const room = { zAt, gone: new Uint8Array(this.XY), side: 0 };
      room.side = this.side(room);
      if (room.side) best = Math.max(best, room.side + this.body);
      this.rooms.push(room);
    }
    this.roomSide = Math.min(best, parts.room.side);
    this.animalTop = (plan.ground?.z ?? base) + plan.person;
  }

  /** How many places the walk reaches (inside the grid and around it). */
  get places(): number {
    return this.xs.length;
  }

  private key(x: number, y: number, at: number): number {
    return (x + this.m + (y + this.m) * this.W) * 8192 + (at + 256);
  }

  private node(x: number, y: number, at: number): number {
    const id = this.xs.length;
    this.xs.push(x);
    this.ys.push(y);
    this.zs.push(at);
    this.out.push([]);
    this.ids.set(this.key(x, y, at), id);
    return id;
  }

  /** Whether a body with its feet `at` voxels up, centred on a column, is blocked on these floors. */
  private blocks(ground: Ground, x: number, y: number, at: number): boolean {
    const { vpt, base } = this.plan;
    const f = { result: { grid: this.work }, vpt, base } as unknown as Form;
    const lx = (x + 0.5 - this.X / 2) / vpt, ly = (y + 0.5 - this.Y / 2) / vpt;
    return rampBlocks(f, ground, lx - BODY_R, ly - BODY_R, lx + BODY_R, ly + BODY_R, at);
  }

  /** Where the place `a` steps to on these floors: `walkIn`'s rule. */
  private steps(a: number, ground: Ground): Array<[number, number, number]> {
    const { X, Y, m } = this;
    const x = this.xs[a], y = this.ys[a], at = this.zs[a];
    const out: Array<[number, number, number]> = [];
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < -m || ny < -m || nx >= X + m || ny >= Y + m) continue;
      const to = nx >= 0 && ny >= 0 && nx < X && ny < Y ? ground.levels.z[levelAt(ground.levels, nx + ny * X, at)] : this.plan.base;
      if (Math.abs(to - at) > this.step) continue;
      if (this.blocks(ground, nx, ny, at) || (to !== at && this.blocks(ground, nx, ny, to))) continue;
      out.push([nx, ny, to]);
    }
    return out;
  }

  private side(room: { zAt: Int16Array; gone: Uint8Array }, extra?: Set<number>): number {
    const mask = new Uint8Array(this.XY);
    for (let i = 0; i < this.XY; i++) if (room.zAt[i] >= 0 && !room.gone[i] && !extra?.has(i)) mask[i] = 1;
    return largestSquare(mask, this.X, this.Y);
  }

  /** The places a body could no longer stand in with these voxels of furniture: within a body around it, from the feet to a person up. */
  private touched(voxels: readonly number[]): Set<number> {
    const out = new Set<number>();
    const { X, Y, XY, r } = this;
    for (const v of voxels) {
      const x = v % X, y = Math.floor(v / X) % Y, z = Math.floor(v / XY);
      for (let dz = 0; dz < this.plan.person; dz++)
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            const j = this.ids.get(this.key(x + dx, y + dy, z - dz));
            if (j !== undefined && !this.gone[j]) out.add(j);
          }
    }
    return out;
  }

  /** Per room height, the columns a body could no longer count in the Sculptor's room with these voxels (within a body, under a storey's ceiling). */
  private roomTouched(voxels: readonly number[]): Array<Set<number>> {
    const { X, Y, XY, r } = this;
    return this.rooms.map((room) => {
      const out = new Set<number>();
      for (const v of voxels) {
        const x = v % X, y = Math.floor(v / X) % Y, z = Math.floor(v / XY);
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            if (x + dx < 0 || x + dx >= X || y + dy < 0 || y + dy >= Y) continue;
            const i = x + dx + (y + dy) * X;
            const fz = room.zAt[i];
            if (fz >= 0 && !room.gone[i] && z >= fz && z < fz + this.clear) out.add(i);
          }
      }
      return out;
    });
  }

  /**
   * Whether every place not taken is still reached with the piece in `work`, and the steps that changed: a step into a column within a
   * body of the piece is tried again on the new floors (the floor under the feet, the edges under the body); the others stay.
   */
  private walk(taken: Set<number>, voxels: readonly number[], ground: Ground): { ok: boolean; changed: Map<number, number[]> } {
    const { X, Y, m, r, W } = this;
    const near = new Uint8Array(W * (Y + 2 * m));
    for (const v of voxels) {
      const x = v % X, y = Math.floor(v / X) % Y;
      for (let dy = -r - 1; dy <= r + 1; dy++)
        for (let dx = -r - 1; dx <= r + 1; dx++) {
          const nx = x + dx + m, ny = y + dy + m;
          if (nx >= 0 && ny >= 0 && nx < W && ny < Y + 2 * m) near[nx + ny * W] = 1;
        }
    }
    const isNear = (b: number) => near[this.xs[b] + m + (this.ys[b] + m) * W] === 1;
    const changed = new Map<number, number[]>();
    const seen = new Uint8Array(this.xs.length);
    const queue = [0];
    seen[0] = 1;
    for (let q = 0; q < queue.length; q++) {
      const a = queue[q];
      let next = this.out[a];
      // A step into a column near the piece is tried again: kept only if the walk on the new floors still takes it.
      if (next.some(isNear)) {
        const now = new Set(this.steps(a, ground).map(([nx, ny, to]) => this.ids.get(this.key(nx, ny, to)) ?? -1));
        next = next.filter((b) => !isNear(b) || now.has(b));
        changed.set(a, next);
      }
      for (const b of next) {
        if (seen[b] || this.gone[b] || taken.has(b)) continue;
        seen[b] = 1;
        queue.push(b);
      }
    }
    for (let j = 0; j < this.xs.length; j++) if (!seen[j] && !this.gone[j] && !taken.has(j)) return { ok: false, changed };
    return { ok: true, changed };
  }

  /** Why a piece is refused (`Refusal`), or undefined if it is kept; kept, the places it takes are gone and the walk is of the new floors. */
  refusal(voxels: readonly number[]): Refusal | undefined {
    const { built, walked, animals, base, vpt } = this.plan;
    let under = false;
    for (const v of voxels) {
      if (!(v >= 0 && v < this.N) || built.cells[v] || walked.g.cells[v] || this.work.cells[v]) return 'wall';
      const z = Math.floor(v / this.XY);
      if (animals[v % this.XY] && z >= base && z < this.animalTop) return 'animals';
      if (z < base) under = true;
    }
    // Under the ground of a building whose cellar does not hold, the earth fills it (T52b): nothing goes there.
    if (under && !this.holds) return 'cellar';
    const lost = this.roomTouched(voxels);
    const sides = this.rooms.map((room, k) => (lost[k].size ? this.side(room, lost[k]) : room.side));
    if (this.roomSide > 0 && Math.max(0, ...sides.map((s) => (s ? s + this.body : 0))) < this.roomSide) return 'room';
    const taken = this.touched(voxels);
    for (const v of voxels) this.work.cells[v] = this.furniture;
    const ground = groundOfForm(this.work, this.workPalette, vpt, base);
    // The cellar still holds (T52b, ADR-0135): a top under the ground a body could stand on and no body reaches would undo it, and the game
    // would fill it with earth. What the game measures on the furnished building, not that every column reaches the ceiling (T419).
    if (this.holds && !ground.hole) {
      for (const v of voxels) this.work.cells[v] = 0;
      return 'cellar';
    }
    const { ok, changed } = this.walk(taken, voxels, ground);
    if (!ok) {
      for (const v of voxels) this.work.cells[v] = 0;
      return 'cut';
    }
    for (const [a, next] of changed) this.out[a] = next;
    for (const j of taken) this.gone[j] = 1;
    this.rooms.forEach((room, k) => {
      for (const i of lost[k]) room.gone[i] = 1;
      room.side = sides[k];
    });
    return undefined;
  }

  /** Keeps the piece if the guard lets it, and takes its places away. */
  admit(voxels: readonly number[]): boolean {
    return this.refusal(voxels) === undefined;
  }
}

/**
 * Why the guard takes a piece away: it writes on the building (`wall`), on the place of the animals (`animals`), under the ground of a
 * cellar that does not hold or so that the cellar would hold no more (`cellar`: a top a body could stand on and no body reaches, ADR-0135,
 * T419), takes the Sculptor's room under its least (`room`), or cuts something off (`cut`).
 */
export type Refusal = 'wall' | 'animals' | 'cellar' | 'room' | 'cut';

/** Pieces of furniture: the 6-connected groups of its voxels, `x + y·X + z·X·Y`. */
export function furniturePieces(voxels: Set<number>, X: number, XY: number): number[][] {
  const seen = new Set<number>();
  const out: number[][] = [];
  for (const s0 of voxels) {
    if (seen.has(s0)) continue;
    const group = [s0];
    seen.add(s0);
    for (let q = 0; q < group.length; q++) {
      const i = group[q];
      const x = i % X;
      for (const j of [x > 0 ? i - 1 : -1, x < X - 1 ? i + 1 : -1, i - X, i + X, i - XY, i + XY])
        if (j >= 0 && voxels.has(j) && !seen.has(j)) {
          seen.add(j);
          group.push(j);
        }
    }
    out.push(group);
  }
  return out;
}

/** What a furnishing left in the building. */
export interface Furnished {
  /** The building with its furniture: a copy of the grid as built, the furniture's letters added to its alphabet. */
  grid: VoxelGrid;
  /** The palette of the building with the furniture's colours. */
  palette: Record<string, PaletteEntry>;
  /** Voxels of furniture kept, `x + y·X + z·X·Y`. */
  voxels: Set<number>;
  pieces: number;
  /** Pieces the guard took away, by reason. */
  refused: Record<Refusal, number>;
  /** The way of data (`furnishWithRules`, T419): every piece kept, which furniture, in which kind of room, on which storey (-1 the cellar). */
  items?: Array<{ id: string; room: string; storey: number; voxels: number; box: PieceBox; cells?: number[] }>;
}

/** The box of a piece of furniture in its building's grid, voxels, both ends inside (T431): what the cursor finds it by. */
export type PieceBox = [x0: number, y0: number, z0: number, x1: number, y1: number, z1: number];

/** The box of some voxels of a grid `x + y·X + z·X·Y` (T431). */
export function boxOf(voxels: readonly number[], X: number, Y: number): PieceBox {
  const b: PieceBox = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const v of voxels) {
    const x = v % X, y = Math.floor(v / X) % Y, z = Math.floor(v / (X * Y));
    if (x < b[0]) b[0] = x;
    if (y < b[1]) b[1] = y;
    if (z < b[2]) b[2] = z;
    if (x > b[3]) b[3] = x;
    if (y > b[4]) b[4] = y;
    if (z > b[5]) b[5] = z;
  }
  return b;
}

/**
 * What a program of a second stage wrote on the stage, put into the building piece by piece through the guard (T409): a letter of the
 * program with a colour, written where the stage had air or a class of floor; what it wrote on `W` is not there. The building is never
 * touched; a piece the guard refuses is taken away whole.
 */
export function furnishFromStage(plan: InteriorPlan, stage: Grid3, palette: Record<string, PaletteEntry>, guard = new InteriorGuard(plan)): Furnished {
  const built = plan.built;
  const XY = plan.X * plan.Y;
  const alphabet = [...built.alphabet];
  const cells = new Uint8Array(built.cells);
  const colours: Record<string, PaletteEntry> = {};
  const code = new Map<number, number>();
  const written = new Map<number, number>();
  for (let i = 0; i < stage.cells.length && i < cells.length; i++) {
    const c = stage.cells[i];
    const ch = stage.alphabet[c];
    if (!c || STAGE_ALPHABET.includes(ch) || cells[i] !== 0 || plan.walked.g.cells[i] !== 0) continue;
    const entry = palette[ch];
    if (!entry || entry.hidden || !entry.color) continue;
    written.set(i, c);
  }
  const refused: Record<Refusal, number> = { wall: 0, animals: 0, cellar: 0, room: 0, cut: 0 };
  const voxels = new Set<number>();
  let pieces = 0;
  for (const group of furniturePieces(new Set(written.keys()), plan.X, XY)) {
    const why = guard.refusal(group);
    if (why) {
      refused[why]++;
      continue;
    }
    pieces++;
    for (const v of group) {
      const c = written.get(v)!;
      if (!code.has(c)) {
        // The program's letter in the building's alphabet: its own character if the building has none such, else one of the private area.
        const ch = stage.alphabet[c];
        let sym = ch;
        for (let n = 0xe200; alphabet.includes(sym) || sym in plan.palette; n++) sym = String.fromCharCode(n);
        colours[sym] = palette[ch];
        code.set(c, alphabet.push(sym) - 1);
      }
      cells[v] = code.get(c)!;
      voxels.add(v);
    }
  }
  return { grid: { X: built.X, Y: built.Y, Z: built.Z, cells, alphabet }, palette: { ...plan.palette, ...colours }, voxels, pieces, refused };
}

/** A storey's covered floor as rooms (T413): what a dwelling's floor is measured on. */
export interface StoreyFloor {
  /** Height of its floor, voxels from the bottom of the grid. */
  z: number;
  /** Under the ground. */
  cellar: boolean;
  /** Its rooms, tiles² of body centres each, the largest (the hall) first. */
  rooms: number[];
  /** The covered floor where a body's centre stands, tiles²: the sum of its rooms. */
  area: number;
}

/**
 * The covered floor of every storey reached, cut into rooms (T413, ADR-0213), as the Scenografo's bench measures it (`stanzeDi`, T406): on
 * each storey of `storeysOf` the centres a body stands on with something above them (the yard and a terrace are not a house's floor), cut
 * at the passages narrower than `NARROW` (a door in a wall cuts), every piece of `roomsOf`. The walk is the one `habitableParts` measures.
 */
export function storeyFloors(w: Walked, vpt: number, base = 0): StoreyFloor[] {
  const { X, Y } = w.g;
  const zs = storeysOf(w, vpt);
  const centres = zs.map(() => new Set<number>());
  for (const c of w.celle) {
    const k = zs.findIndex((z) => Math.abs(z - c.z) <= 1);
    if (k >= 0 && headroomAbove(w.levels, c.x + c.y * X, c.z) !== undefined) centres[k].add(c.x + c.y * X);
  }
  return zs.map((z, k) => {
    const rooms = roomsOf(centres[k], X, Y, Math.round(NARROW * vpt)).map((r) => r.length / (vpt * vpt)).sort((a, b) => b - a);
    // Under the ground as `reachableStoreys` leaves it out (T417): more than a step under it, so a cellar is never a storey of the house.
    return { z, cellar: z < base - stepOf(vpt), rooms, area: rooms.reduce((s, r) => s + r, 0) };
  });
}

/** The rooms of a storey: its centres, cut at the narrow passages, each passage cell given back to the nearest piece (T259). */
export function roomsOf(centres: Set<number>, X: number, Y: number, narrow: number): number[][] {
  let mask = new Uint8Array(X * Y);
  for (const i of centres) mask[i] = 1;
  const all = mask;
  for (let k = 0; k < narrow; k++) {
    const next = new Uint8Array(X * Y);
    for (let y = 1; y < Y - 1; y++)
      for (let x = 1; x < X - 1; x++) {
        const i = x + y * X;
        next[i] = mask[i] & mask[i - 1] & mask[i + 1] & mask[i - X] & mask[i + X];
      }
    mask = next;
  }
  const label = new Int32Array(X * Y).fill(-1);
  const queue: number[] = [];
  let n = 0;
  for (let s = 0; s < X * Y; s++) {
    if (!mask[s] || label[s] >= 0) continue;
    const stack = [s];
    label[s] = n;
    while (stack.length) {
      const i = stack.pop()!;
      queue.push(i);
      for (const j of [i - 1, i + 1, i - X, i + X]) if (j >= 0 && j < X * Y && mask[j] && label[j] < 0) (label[j] = n), stack.push(j);
    }
    n++;
  }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    for (const j of [i - 1, i + 1, i - X, i + X]) if (j >= 0 && j < X * Y && all[j] && label[j] < 0) (label[j] = label[i]), queue.push(j);
  }
  const out: number[][] = Array.from({ length: n }, () => []);
  for (const i of centres) if (label[i] >= 0) out[label[i]].push(i);
  return out.filter((r) => r.length >= 16);
}

/**
 * The front door (the bench's, `lab/banco/misure.ts`): where the covered ground floor opens towards the front (+y), on a covered piece
 * as large as a storey; the one whose way out to the front is free, nearest the middle.
 */
function frontDoor(w: Walked, vpt: number, base: number): { x: number; y: number } | undefined {
  const g = w.g;
  const { X, Y } = g;
  const step = stepOf(vpt);
  const least = (1.1 * vpt) ** 2;
  const covered = new Uint8Array(X * Y);
  const open = new Uint8Array(X * Y);
  for (const c of w.celle) {
    if (Math.abs(c.z - base) > step) continue;
    const i = c.x + c.y * X;
    if (headroomAbove(w.levels, i, c.z) === undefined) open[i] = 1;
    else covered[i] = 1;
  }
  const piece = new Int32Array(X * Y).fill(-1);
  const sizes: number[] = [];
  for (let s = 0; s < covered.length; s++) {
    if (!covered[s] || piece[s] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    const stack = [s];
    piece[s] = id;
    while (stack.length) {
      const i = stack.pop()!;
      size++;
      const x = i % X;
      for (const n of [x > 0 ? i - 1 : -1, x < X - 1 ? i + 1 : -1, i >= X ? i - X : -1, i < X * (Y - 1) ? i + X : -1])
        if (n >= 0 && covered[n] && piece[n] < 0) (piece[n] = id), stack.push(n);
    }
    sizes.push(size);
  }
  const outside = (x: number) => {
    for (let d = -step; d <= step; d++) if (base + d >= 0 && w.reached(x, Y, base + d)) return true;
    return false;
  };
  const freeFront = (x: number, y: number) => {
    for (let k = y + 1; k < Y; k++) if (!open[x + k * X]) return false;
    return outside(x);
  };
  let best: { x: number; y: number; free: boolean; off: number } | undefined;
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      const i = x + y * X;
      if (!covered[i] || sizes[piece[i]] < least) continue;
      if (!(y + 1 >= Y ? outside(x) : !!open[i + X])) continue;
      const p = { x, y, free: freeFront(x, y), off: Math.abs(x + 0.5 - X / 2) };
      if (!best || Number(p.free) > Number(best.free) || (p.free === best.free && p.off < best.off)) best = p;
    }
  return best && { x: best.x, y: best.y };
}

/** A room of the ground floor (T513): its covered floor where a body stands, in tiles², and whether the walk from the outside gets into it. */
export interface GroundRoom {
  area: number;
  reached: boolean;
  /** Its columns, `x + y·X`, and the height of the feet on each. */
  cells: Array<[i: number, z: number]>;
}

/**
 * The rooms of a building's ground floor and whether a body gets into each (T513): every covered floor where a body stands a step or less
 * from the ground floor (reached or not, `standingCells`), cut into rooms at the narrow passages (`roomsOf`), the rooms of at least
 * `SMALL_ROOM` tiles²; a room is reached when the walk (`walkIn`) stands on any of it. `reached` counts the covered cells the walk stands on,
 * on every storey.
 */
export function roomsReached(w: Walked, vpt: number, base = 0): { rooms: GroundRoom[]; reached: number } {
  const { X, Y } = w.g;
  const step = stepOf(vpt);
  const z0 = storeysOf(w, vpt).find((z) => z >= base - step) ?? base;
  const { cells } = standingCells(w, vpt);
  const floor = new Set<number>();
  const zOf = new Map<number, number>();
  for (const c of cells)
    if (Math.abs(c.z - z0) <= step) {
      floor.add(c.i);
      zOf.set(c.i, c.z);
    }
  const rooms = roomsOf(floor, X, Y, Math.round(NARROW * vpt))
    .filter((r) => r.length >= SMALL_ROOM * vpt * vpt)
    .map((r) => ({ area: Math.round((r.length / (vpt * vpt)) * 10) / 10, reached: r.some((i) => w.reached(i % X, Math.floor(i / X), zOf.get(i)!)), cells: r.map((i): [number, number] => [i, zOf.get(i)!]) }));
  let reached = 0;
  for (const c of w.celle) if (headroomAbove(w.levels, c.x + c.y * X, c.z) !== undefined) reached++;
  return { rooms, reached };
}
