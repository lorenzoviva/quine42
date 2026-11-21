// The prototypes of T459 (docs/design/terreno-3d.md): the ways the ground could go past one level per tile, and the cellular
// automata of the water and of the wind, as pure functions and classes with no kernel and no three.js. The same code runs in Node
// (lab/terreno-3d/misura.ts, the time per place and the memory) and in the page (lab/terreno-3d/pagina.ts, bundled by
// `misura-frame.mjs --terreno`, the frame). Nothing here is the game's: it is what a task would start from, and what was measured.
//
// The ways of the ground:
//   - today (the reference): a level per tile (relief.ts, ADR-0048), neighbours within two levels, the strata a look (strata.ts);
//   - "columns" (2.5D): still a column per tile, but a relief with massifs, terraces, cliffs and basins (`trueRelief`), the bed under
//     the water, the rule 10 counted on the graph of the steps (`stepGraph`), the strata written by a MarkovJunior program on
//     S × S × D with their adjacencies (`STRATA_XML`);
//   - "voxels" (3D): the place as a grid of voxels, r a tile, the large scale written by the kernel from the same relief and the detail
//     by a MarkovJunior program (strata, ore, caves, the seabed: `terrainXml`), walked on the floors of its columns (`voxelFloors`).
// The automata: the water as virtual pipes (`PipesWater`), the wind as a lattice Boltzmann D2Q9 (`LbmWind`), and a discrete automaton
// written as data (`RuleTable`), the parametric primitive to compare with the same rule in MarkovJunior and in Lua.

import { hash32 } from '../../src/kernel/rng';
import { compileMjx } from '../../src/mj/model';
import { runOn, type Grid3, type PaletteEntry } from '../../src/mj/engine';

/** A level of the relief, in tiles (relief.ts). */
export const LEVEL = 0.25;
/** Levels a body walks up between two tiles: the relief of today never goes past it (ADR-0048). */
export const STEP = 2;
/** Levels a jump clears (JUMP_UP = 1.05 tiles, forms.ts): four levels. */
export const JUMP = 4;
/** Levels a body could climb with a means (a proposal: three tiles, a rope or a ladder). */
export const CLIMB = 12;

// ---------------------------------------------------------------------------------------------------------------- noise

const UNIT = 1 / 4294967296;
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise in [0, 1) on the integer lattice, from the seed: the same in Node and in the browser (integer hashes, doubles). */
export function vnoise(x: number, y: number, s: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const a = hash32(ix, iy, s) * UNIT, b = hash32(ix + 1, iy, s) * UNIT;
  const c = hash32(ix, iy + 1, s) * UNIT, d = hash32(ix + 1, iy + 1, s) * UNIT;
  return a + (b - a) * fx + (c - a + (a - b + d - c) * fx) * fy;
}

/** Ridged noise: high on the lines where the noise crosses its middle, as mountain chains. */
const ridge = (x: number, y: number, s: number) => 1 - Math.abs(2 * vnoise(x, y, s) - 1);

const smoothstep = (a: number, b: number, v: number) => smooth(Math.min(1, Math.max(0, (v - a) / (b - a))));

// ---------------------------------------------------------------------------------------------------------------- the true relief

/** What `trueRelief` adds to the relief of today, in levels. */
export const RELIEF = {
  /** The highest a massif rises over the hills: 56 levels, 14 tiles. */
  peak: 56,
  /** A terrace: inside it the slope is a quarter of the massif's; between two, a cliff. */
  terrace: 8,
  /** The scale of the massifs and of the passes (tiles). */
  massif: 150,
  pass: 46,
  /** How deep the bed of the sea and of the shallow water lies under the surface (levels): base and how much more. */
  sea: [8, 20] as const,
  shallow: [2, 5] as const,
};

/** The draft's codes the relief reads (the seed's, `world.terrain`): the open sea, the shallow water, the mountain. */
const SEA = 'o', WATER = 'w', MOUNTAIN = 'k';

export interface TrueTile {
  /** The level of the ground (land) or of the bed (water). */
  level: number;
  /** The level of the surface of the water over the bed, if it is water. */
  surface?: number;
  /** How much of a massif the tile is (0-1). */
  massif: number;
}

/**
 * The relief with peaks, terraces, cliffs and basins (the way "columns", and the large scale of the way "voxels"): the hills of today,
 * plus massifs where a ridged noise of the world says (terraced: gentle inside a terrace, a cliff of about six levels between two, except
 * on the passes, thin valleys where the massif keeps its slope), and under the water a bed: the sea from 8 to 28 levels under its
 * surface, the shallow water from 2 to 7, with a reef where a noise says. `hills` is today's level of a tile (`Relief.level`); `code`
 * the draft's code; `sea` the sea's level. A function of the world's coordinates only: places meet as before.
 */
export function trueRelief(col: number, row: number, seed: number, hills: (c: number, r: number) => number, code: string, sea: number): TrueTile {
  const R = RELIEF;
  const m = smoothstep(0.55, 0.85, 0.65 * ridge(col / R.massif, row / R.massif, seed + 911) + 0.35 * vnoise(col / (R.massif / 3), row / (R.massif / 3), seed + 912));
  const raw = m * R.peak;
  const t = Math.floor(raw / R.terrace);
  const terraced = t * R.terrace + (raw - t * R.terrace) * 0.25;
  // On a pass the massif keeps its own slope: a way up that the kernel may still need to even out.
  const pass = smoothstep(0.9, 0.97, ridge(col / R.pass, row / R.pass, seed + 913));
  const lift = Math.round(terraced + (raw - terraced) * pass);
  const base = Math.max(sea, hills(col, row));
  if (code === SEA || code === WATER) {
    const [b, extra] = code === SEA ? R.sea : R.shallow;
    const reef = code === SEA && vnoise(col / 7, row / 7, seed + 914) > 0.82;
    const depth = reef ? 1 : b + Math.round(extra * vnoise(col / 11, row / 11, seed + 915));
    const surface = code === SEA ? sea : base + lift;
    return { level: surface - depth, surface, massif: m };
  }
  return { level: base + lift, massif: m };
}

/** The codes of a place that a body does not walk (the seed's: woods, rock, walls) and those it swims (the water). */
export interface Walk {
  solid: (code: string) => boolean;
  swim: (code: string) => boolean;
}

/** In the way "columns" a mountain is relief, no longer a block: `k` is walked as bare rock, `r` stays a boulder. */
export const columnsWalk = (solid: (c: string) => boolean, swim: (c: string) => boolean): Walk => ({
  solid: (c) => c !== MOUNTAIN && solid(c),
  swim,
});

// ---------------------------------------------------------------------------------------------------------------- the rule 10 on the steps

/** The four gates of a place (layout.ts `gates`), as indices of its cells: west, east, north, south. */
export function gatesOf(cx: number, cy: number, S: number, seed: number): number[] {
  const along = (a: number, b: number, c: number) => 2 + (hash32(seed, a, b, c) % (S - 4));
  return [along(cx, cy, 1) * S, along(cx + 1, cy, 1) * S + S - 1, along(cx, cy, 2), (S - 1) * S + along(cx, cy + 1, 2)];
}

export interface StepGraph {
  /** Tiles reached from the first gate on foot (steps within `STEP`) or swimming, after the ramps. */
  reached: number;
  /** Tiles walked or swum in the place. */
  open: number;
  /** Ramps the kernel carved to join the gates (one per gate not reached), and the levels it moved to even them. */
  ramps: number;
  earthworks: number;
  /** Walked areas of 4 tiles or more that only a cliff parts from the network (they keep it: the revised rule 10's enclaves). */
  enclaves: Array<{ tiles: number; jump: boolean; climb: boolean }>;
  /** Walked areas of 4 tiles or more that solid tiles (woods, boulders) part from the network: today's layout joins them with a path. */
  pockets: number;
  /** Edges between two open tiles: within a step, within a jump, within a climb, beyond. */
  edges: { step: number; jump: number; climb: number; cliff: number };
}

const DIRS: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * The rule 10 counted on the graph of the steps of one place (the way "columns"): two neighbouring tiles are joined when both are open
 * (walked or swum) and their levels differ by `STEP` at most (water joins water whatever its bed: one swims over it). From the first
 * gate, the other gates must be reached: where one is not, the kernel carves a ramp, the cheapest way through what a body can be on
 * (Dijkstra; a step costs one, every level over `STEP` costs four, a solid tile is not crossed), and evens its levels so that every step
 * of it is within `STEP` (the earthworks: levels moved). What stays apart and is walked by 4 tiles or more is an enclave: how it is
 * parted (a jump, a climb, more) is the means it asks for. `levels` holds the place and a ring of one tile around it (S + 2 a side), so
 * that a gate's step across the border is counted. `strict`: today's rule 10 to the letter, every enclave joined with a ramp too (what
 * the kernel would have to dig to keep every walked tile walked to): the enclaves are then those no ramp reaches.
 */
export function stepGraph(codes: string, levels: Int16Array, S: number, walk: Walk, gates: number[], strict = false): StepGraph {
  const W = S + 2;
  const lv = Int16Array.from(levels);
  const at = (c: number, r: number) => (r + 1) * W + (c + 1);
  const code = (i: number) => codes[i] ?? '';
  const open = (i: number) => !walk.solid(code(i)) || walk.swim(code(i));
  const wet = (i: number) => walk.swim(code(i));
  const joined = (a: number, b: number, ia: number, ib: number) => (wet(a) && wet(b)) || Math.abs(lv[ia] - lv[ib]) <= STEP;
  const edges = { step: 0, jump: 0, climb: 0, cliff: 0 };
  let openCount = 0;
  for (let i = 0; i < S * S; i++) {
    if (!open(i)) continue;
    openCount++;
    const c = i % S, r = (i - c) / S;
    for (const [dc, dr] of [[1, 0], [0, 1]] as const) {
      const nc = c + dc, nr = r + dr;
      if (nc >= S || nr >= S || !open(nr * S + nc)) continue;
      if (wet(i) && wet(nr * S + nc)) {
        edges.step++;
        continue;
      }
      const d = Math.abs(lv[at(c, r)] - lv[at(nc, nr)]);
      if (d <= STEP) edges.step++;
      else if (d <= JUMP) edges.jump++;
      else if (d <= CLIMB) edges.climb++;
      else edges.cliff++;
    }
  }
  const flood = (from: number): Uint8Array => {
    const seen = new Uint8Array(S * S);
    if (!open(from)) return seen;
    const q = [from];
    seen[from] = 1;
    while (q.length) {
      const i = q.pop()!;
      const c = i % S, r = (i - c) / S;
      for (const [dc, dr] of DIRS) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= S || nr >= S) continue;
        const n = nr * S + nc;
        if (seen[n] || !open(n) || !joined(i, n, at(c, r), at(nc, nr))) continue;
        seen[n] = 1;
        q.push(n);
      }
    }
    return seen;
  };
  // The ramp: the cheapest way from a tile to what is reached, then its levels evened from the reached end.
  let ramps = 0, earthworks = 0;
  const carve = (from: number, reach: Uint8Array) => {
    const dist = new Float64Array(S * S).fill(Infinity);
    const prev = new Int32Array(S * S).fill(-1);
    dist[from] = 0;
    const heap: Array<[number, number]> = [[0, from]];
    let end = -1;
    while (heap.length) {
      let bi = 0;
      for (let j = 1; j < heap.length; j++) if (heap[j][0] < heap[bi][0]) bi = j;
      const [d, i] = heap.splice(bi, 1)[0];
      if (d > dist[i]) continue;
      if (reach[i]) {
        end = i;
        break;
      }
      const c = i % S, r = (i - c) / S;
      for (const [dc, dr] of DIRS) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= S || nr >= S) continue;
        const n = nr * S + nc;
        if (!open(n)) continue;
        const over = wet(i) && wet(n) ? 0 : Math.max(0, Math.abs(lv[at(c, r)] - lv[at(nc, nr)]) - STEP);
        const nd = d + 1 + 4 * over;
        if (nd < dist[n]) {
          dist[n] = nd;
          prev[n] = i;
          heap.push([nd, n]);
        }
      }
    }
    if (end < 0) return;
    ramps++;
    const path: number[] = [];
    for (let i = end; i >= 0; i = prev[i]) path.push(i);
    // From the reached end towards the gate: each tile within a step of the one before it.
    for (let j = 1; j < path.length; j++) {
      const a = path[j - 1], b = path[j];
      if (wet(a) && wet(b)) continue;
      const ia = at(a % S, (a - (a % S)) / S), ib = at(b % S, (b - (b % S)) / S);
      const want = Math.min(lv[ia] + STEP, Math.max(lv[ia] - STEP, lv[ib]));
      earthworks += Math.abs(want - lv[ib]);
      lv[ib] = want;
    }
  };
  const first = gates[0];
  let reach = flood(first);
  for (const g of gates.slice(1)) {
    if (!open(g) || reach[g]) continue;
    carve(g, reach);
    reach = flood(first);
  }
  // What is still apart: the enclaves, and how far a means must take a body (the least difference of levels to the network).
  const enclaves: StepGraph['enclaves'] = [];
  let pockets = 0;
  const done = Uint8Array.from(reach);
  for (let i = 0; i < S * S; i++) {
    if (done[i] || !open(i) || wet(i)) continue;
    const part = flood(i);
    let tiles = 0, least = Infinity;
    for (let j = 0; j < S * S; j++) {
      if (!part[j]) continue;
      done[j] = 1;
      tiles++;
      const c = j % S, r = (j - c) / S;
      for (const [dc, dr] of DIRS) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= S || nr >= S || !reach[nr * S + nc]) continue;
        least = Math.min(least, Math.abs(lv[at(c, r)] - lv[at(nc, nr)]));
      }
    }
    if (tiles < 4) continue;
    // Not beside the network at all: solid tiles part it, and the layout of today carves a path to it as ever.
    if (least === Infinity) pockets++;
    else if (strict) {
      const before = ramps;
      carve(i, reach);
      reach = flood(first);
      for (let j = 0; j < S * S; j++) if (reach[j]) done[j] = 1;
      if (ramps === before) enclaves.push({ tiles, jump: least <= JUMP, climb: least > JUMP && least <= CLIMB });
    } else enclaves.push({ tiles, jump: least <= JUMP, climb: least > JUMP && least <= CLIMB });
  }
  let reached = 0;
  for (let i = 0; i < S * S; i++) reached += reach[i];
  return { reached, open: openCount, ramps, earthworks, enclaves, pockets, edges };
}

/** The camera's pitch (renderer.ts `PITCH`): it looks down at 0.95 radians, from the south when it has not turned. */
export const PITCH = 0.95;

/**
 * Whether the ground hides a body standing on (x, y) from the 3/4 camera looking from the south (yaw 0): the line from its middle (0.6 over
 * its feet, where the camera aims) up to the camera, rising `tan(PITCH)` a tile, passes under the top of a column between them (its near
 * edge, `reach` tiles at most). What the cut of T416 would have to take away, towards the camera, for the wanderer to be seen.
 */
export function hiddenFromCamera(level: (c: number, r: number) => number, x: number, y: number, reach = 16): boolean {
  const mid = level(x, y) * LEVEL + 0.6;
  const rise = Math.tan(PITCH);
  for (let s = 1; s <= reach; s++) if (level(x, y + s) * LEVEL > mid + rise * (s - 0.5)) return true;
  return false;
}

// ---------------------------------------------------------------------------------------------------------------- the strata in MarkovJunior

/**
 * The strata of a place as a MarkovJunior program on S × S × D (the way "columns", ADR-0091 point 5): the kernel writes the surface
 * (the top layer, a letter per kind of ground) and earth `E` under it; the rules say what lies under what, a layer at a time (patterns
 * with the top layer first): topsoil under grass and snow, packed sand under sand, mud under the water, bedrock under rock; how thick
 * each is (`prl`), clay under them, the bedrock all the way down; veins of ore in the bedrock; under the water, a spring of the aquifer
 * here and there. The adjacencies are the rules: nothing else decides them. The root keeps the up and the down (`symmetry="(xy)"`): without
 * it MarkovJunior tries a rule in every turn of the cube (its default in 3D, as `Hills` knows), and a rule of what lies under what spreads
 * sideways, clay into the rock beside the meadow.
 */
export const STRATA_XML = `<sequence values="EGSRNMWTCADBOQ" symmetry="(xy)">
  <all in="G E" out="G T"/>
  <all in="N E" out="N T"/>
  <all in="S E" out="S A"/>
  <all in="M E" out="M D"/>
  <all in="W E" out="W D"/>
  <all in="R E" out="R B"/>
  <prl in="T E" out="T T" p="0.5" steps="1"/>
  <prl in="A E" out="A A" p="0.6" steps="2"/>
  <prl in="D E" out="D D" p="0.4" steps="1"/>
  <all in="T E" out="T C"/>
  <all in="A E" out="A C"/>
  <all in="D E" out="D C"/>
  <prl in="C E" out="C C" p="0.5" steps="2"/>
  <all in="C E" out="C B"/>
  <all in="B E" out="B B"/>
  <one in="B" out="O" steps="3"/>
  <prl in="OB" out="OO" p="0.3" steps="3"/>
  <prl in="D C" out="D Q" p="0.05" steps="1"/>
</sequence>`;

/** The letter of the surface for the strata and the voxels: from the draft's code (the seed's, `world.terrain`). */
export function surfaceLetter(code: string): string {
  switch (code) {
    case 'o':
    case 'w':
      return 'W';
    case 's':
      return 'S';
    case 'r':
    case 'k':
      return 'R';
    case 'n':
      return 'N';
    default:
      return 'G';
  }
}

/** The colours of the letters of the strata and of the voxels (the seed's strata and terrains, `SEED_STRATA`). */
export const TERRAIN_PALETTE: Record<string, PaletteEntry> = {
  E: { color: '#6b4a30' },
  G: { color: '#5a9e48' },
  S: { color: '#d8c48a' },
  R: { color: '#8c8d95' },
  N: { color: '#eef2f4' },
  M: { color: '#463a2e' },
  W: { color: '#3c7cc8', hidden: true },
  T: { color: '#6b4a30' },
  C: { color: '#a0643f' },
  A: { color: '#bfa064' },
  D: { color: '#463a2e' },
  B: { color: '#6d6a68' },
  O: { color: '#c9a640' },
  Q: { color: '#4f8fd0' },
  V: { color: '#000000', hidden: true },
  K: { color: '#2f6b3a' },
  L: { color: '#77706a' },
};

/**
 * A grid of the engine, every cell code 0. The engine's empty cell is always `.` at code 0 (`alphabetOf`): a program's first value, its
 * background, is read as it, so `letters` starts with `.` and that is the background of the program that runs on the grid (earth `E` for
 * `STRATA_XML`, air `I` for `terrainXml`).
 */
function emptyGrid(X: number, Y: number, Z: number, letters: string): Grid3 {
  return { X, Y, Z, cells: new Uint8Array(X * Y * Z), alphabet: [...letters], log: [], epoch: 0 };
}

const compiled = new Map<string, ReturnType<typeof compileMjx>>();
function program(xml: string, size: [number, number, number]) {
  const key = `${size.join('x')}|${xml}`;
  let m = compiled.get(key);
  if (!m) compiled.set(key, (m = compileMjx(xml, { size })));
  return m;
}

/**
 * The strata of a place by `STRATA_XML`: D rows of S × S letters under the surface (the first row the first tile under the ground).
 * `r` cells a tile (1: a cell a tile, as `ChunkPlan.strata`; 2 or 4: what a cut at a quarter of a tile would show).
 */
export function strataMj(codes: string, S: number, D: number, seed: number, r = 1): { grid: Grid3; ms: number } {
  const X = S * r, Z = D * r + 1;
  const m = program(STRATA_XML, [X, X, Z]);
  // Earth under the surface is the program's background (`E`, code 0): the grid starts as it.
  const g = emptyGrid(X, X, Z, '.GSRNMWTCADBOQ');
  const top = (Z - 1) * X * X;
  for (let y = 0; y < X; y++)
    for (let x = 0; x < X; x++) g.cells[top + y * X + x] = g.alphabet.indexOf(surfaceLetter(codes[Math.floor(y / r) * S + Math.floor(x / r)] ?? 'g'));
  const t0 = performance.now();
  runOn(g, m.program, seed, 5_000_000);
  return { grid: g, ms: performance.now() - t0 };
}

// ---------------------------------------------------------------------------------------------------------------- the voxels

/**
 * The detail of the ground of a place in voxels (the way "voxels"): the kernel has written the large scale (the relief of `trueRelief`
 * at r voxels a tile: earth `E` under the surface, the surface's letter on top, the bed `M` and the water `W` over it); the program
 * writes the strata as `STRATA_XML` (unless `kernelStrata`: then the kernel has written them, column by column, as `draftStrata`
 * does today, and the program only adds what grows), the ore, the caves (seeds in the bedrock grown into chambers), the seabed (rocks
 * on the bed, kelp that grows up from it into the water). The steps of `one` follow the place's area, so a place of any r has as much.
 */
export function terrainXml(X: number, Y: number, kernelStrata = false): string {
  const area = (X * Y) / (72 * 72);
  const n = (k: number) => Math.max(1, Math.round(k * area));
  const strata = kernelStrata
    ? ''
    : `
  <all in="G E" out="G T"/>
  <all in="N E" out="N T"/>
  <all in="S E" out="S A"/>
  <all in="M E" out="M D"/>
  <all in="R E" out="R B"/>
  <prl in="T E" out="T T" p="0.5" steps="3"/>
  <prl in="A E" out="A A" p="0.6" steps="5"/>
  <prl in="D E" out="D D" p="0.4" steps="3"/>
  <all in="T E" out="T C"/>
  <all in="A E" out="A C"/>
  <all in="D E" out="D C"/>
  <prl in="C E" out="C C" p="0.6" steps="5"/>
  <all in="C E" out="C B"/>
  <all in="B E" out="B B"/>`;
  return `<sequence values="IEGSRNMWTCADBOQVKL" symmetry="(xy)">${strata}
  <one in="B" out="O" steps="${n(14)}"/>
  <prl in="OB" out="OO" p="0.25" steps="4"/>
  <one in="BBB/BBB/BBB BBB/BBB/BBB BBB/BBB/BBB" out="BBB/BBB/BBB BVB/BBB/BBB BBB/BBB/BBB" steps="${n(3)}"/>
  <prl in="VB" out="VV" p="0.45" steps="12" symmetry="(xyz)"/>
  <prl in="W M" out="L M" p="0.04" steps="1"/>
  <prl in="W M" out="K M" p="0.03" steps="1"/>
  <prl in="W K" out="K K" p="0.5" steps="8"/>
</sequence>`;
}

/** One column of the large scale, at voxels: how high its ground (or bed) and its water stand, in voxels from the box's floor. */
export interface Column {
  ground: number;
  water?: number;
  letter: string;
}

/**
 * The grid of a place at r voxels a tile (cubic voxels: a voxel is 1/r of a tile, so at r = 4 a level), from the large scale the
 * kernel wrote (`columns(x, y)` at voxel columns), then the program of `terrainXml`. The box is as tall as the place needs: from
 * `depth` tiles under its lowest ground to its highest ground or water. `kernelStrata`: the kernel writes the strata column by column
 * (topsoil, clay, bedrock from a hash) before the program, which then only adds the ore, the caves and the seabed.
 */
export function voxelPlace(S: number, r: number, columns: (x: number, y: number) => Column, seed: number, depth = 4, kernelStrata = false): { grid: Grid3; base: number; fillMs: number; programMs: number } {
  const X = S * r;
  const t0 = performance.now();
  const cols: Column[] = [];
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < X; y++)
    for (let x = 0; x < X; x++) {
      const c = columns(x, y);
      cols.push(c);
      lo = Math.min(lo, c.ground);
      hi = Math.max(hi, c.ground, c.water ?? -Infinity);
    }
  const base = lo - depth * r;
  const Z = hi - base + 2;
  // Air is the program's background (`I`, code 0).
  const letters = '.EGSRNMWTCADBOQVKL';
  const g = emptyGrid(X, X, Z, letters);
  const idx = (ch: string) => letters.indexOf(ch);
  const [E, M, W, T, C, B] = ['E', 'M', 'W', 'T', 'C', 'B'].map(idx);
  const XY = X * X;
  for (let i = 0; i < XY; i++) {
    const c = cols[i];
    const top = c.ground - base;
    const wet = c.water !== undefined;
    const surface = idx(wet ? 'M' : c.letter);
    const h = kernelStrata ? hash32(seed, i, 4513) : 0;
    for (let z = 0; z < top; z++) {
      let v = E;
      if (kernelStrata) {
        const d = top - 1 - z;
        const soil = (1 + (h & 1)) * r, rock = Math.max(soil, (2 + ((h >> 1) & 1)) * r);
        v = c.letter === 'R' ? B : d < soil ? (wet ? M : T) : d < rock ? C : B;
      }
      g.cells[i + z * XY] = v;
    }
    g.cells[i + (top - 1) * XY] = surface;
    if (wet) for (let z = top; z < (c.water as number) - base; z++) g.cells[i + z * XY] = W;
  }
  const fillMs = performance.now() - t0;
  const m = program(terrainXml(X, X, kernelStrata), [X, X, Z]);
  const t1 = performance.now();
  runOn(g, m.program, seed, 20_000_000);
  return { grid: g, base, fillMs, programMs: performance.now() - t1 };
}

/**
 * The floors of a grid of voxels a body stands on (the rule 10 in 3D): per column, every height with a solid voxel or water under it
 * (a body swims at the surface) and `body` voxels of air (a cave's too) over it; and how many of them the first gate reaches, going from
 * a column to the next within a step (`step` voxels up or down). Caves under the ground are floors too: the 3D flood finds which are
 * joined and which are not. The bed under the water is no floor: it is reached diving, a means of its own.
 */
export function voxelFloors(g: Grid3, body: number, step: number, from: [number, number]): { floors: number; reached: number; ms: number } {
  const t0 = performance.now();
  const { X, Y, Z, cells } = g;
  const XY = X * Y;
  const air = new Uint8Array(g.alphabet.length);
  for (const ch of ['.', 'V']) {
    const i = g.alphabet.indexOf(ch);
    if (i >= 0) air[i] = 1;
  }
  // The floors of every column, as a flat list with offsets.
  const start = new Int32Array(XY + 1);
  const zs: number[] = [];
  for (let i = 0; i < XY; i++) {
    start[i] = zs.length;
    let run = 0;
    for (let z = Z - 1; z >= 1; z--) {
      if (air[cells[i + z * XY]]) run++;
      else run = 0;
      if (run >= body && !air[cells[i + (z - 1) * XY]]) zs.push(z);
    }
  }
  start[XY] = zs.length;
  const seen = new Uint8Array(zs.length);
  const [fx, fy] = from;
  let first = -1;
  const fi = fy * X + fx;
  for (let k = start[fi]; k < start[fi + 1]; k++) if (first < 0 || zs[k] > zs[first]) first = k;
  let reached = 0;
  if (first >= 0) {
    const q = [first];
    seen[first] = 1;
    const colOf = new Int32Array(zs.length);
    for (let i = 0; i < XY; i++) for (let k = start[i]; k < start[i + 1]; k++) colOf[k] = i;
    while (q.length) {
      const k = q.pop()!;
      reached++;
      const i = colOf[k], x = i % X, y = (i - x) / X, z = zs[k];
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= X || ny >= Y) continue;
        const n = ny * X + nx;
        for (let j = start[n]; j < start[n + 1]; j++) if (!seen[j] && Math.abs(zs[j] - z) <= step) {
          seen[j] = 1;
          q.push(j);
        }
      }
    }
  }
  return { floors: zs.length, reached, ms: performance.now() - t0 };
}

// ---------------------------------------------------------------------------------------------------------------- meshes, without three.js

/** A mesh as the game's terrain has it (`Builder` of terrain.ts): non-indexed triangles, a normal, a colour and a part per vertex. */
export class Tris {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  prt: number[] = [];
  quad(a: number[], b: number[], c: number[], d: number[], n: readonly number[], rgb: readonly number[], part: number): void {
    for (const v of [a, b, c, a, c, d]) {
      this.pos.push(v[0], v[1], v[2]);
      this.nor.push(n[0], n[1], n[2]);
      this.col.push(rgb[0], rgb[1], rgb[2]);
      this.prt.push(part);
    }
  }
  get triangles(): number {
    return this.pos.length / 9;
  }
  /** The bytes of its buffers as the game makes them (positions, normals and colours as floats, the part a byte). */
  get bytes(): number {
    return (this.pos.length + this.nor.length + this.col.length) * 4 + this.prt.length;
  }
}

const rgb = (hex: string | undefined, k = 1): number[] => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? '');
  if (!m) return [0.5 * k, 0.5 * k, 0.5 * k];
  return [1, 2, 3].map((j) => Math.pow(parseInt(m[j], 16) / 255, 2.2) * k);
};

/**
 * The mesh of a place in the way "columns": as terrain.ts draws it today (a top a tile, a side where the neighbour is lower), with the
 * relief of `trueRelief`, the bed under the water as a column like the land, and the sides of a cliff in the bands of the strata (a band a
 * row of `strata`, from the ground down, the last one deeper). `level(c, r)` and `code(c, r)` read the world (the ring around the place too).
 */
export function columnsMesh(S: number, cx: number, cy: number, level: (c: number, r: number) => number, code: (c: number, r: number) => string, colour: (code: string) => string | undefined, strata: (c: number, r: number, row: number) => string | undefined, rows: number): Tris {
  const b = new Tris();
  const X0 = cx * S, Z0 = cy * S;
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const x = X0 + c, z = Z0 + r;
      const y = level(x, z) * LEVEL;
      const k0 = 0.92 + (hash32(x, z, 77) % 13) / 100;
      const top = rgb(colour(code(x, z)), k0 * 1.08);
      b.quad([x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z], [0, 1, 0], top, 1);
      for (const [dx, dz] of DIRS) {
        const ny = level(x + dx, z + dz) * LEVEL;
        if (ny >= y) continue;
        // The side in bands: a band a tile deep, from the ground down.
        for (let t = y, row = 0; t > ny; row++) {
          const bottom = row >= rows - 1 ? ny : Math.max(ny, y - row - 1);
          const band = rgb(colour(strata(x, z, row) ?? '') ?? '#5f4632', 0.72);
          const p = dx === 1 ? x + 1 : dx === -1 ? x : dz === 1 ? z + 1 : z;
          const a = dx ? z : x, e = a + 1;
          if (dx === 1) b.quad([p, t, e], [p, bottom, e], [p, bottom, a], [p, t, a], [1, 0, 0], band, 129);
          if (dx === -1) b.quad([p, t, a], [p, bottom, a], [p, bottom, e], [p, t, e], [-1, 0, 0], band, 129);
          if (dz === 1) b.quad([a, t, p], [a, bottom, p], [e, bottom, p], [e, t, p], [0, 0, 1], band, 129);
          if (dz === -1) b.quad([e, t, p], [e, bottom, p], [a, bottom, p], [a, t, p], [0, 0, -1], band, 129);
          t = bottom;
        }
      }
    }
  return b;
}

const FACE_NORMALS: ReadonlyArray<readonly [number, number, number]> = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

/**
 * The mesh of a place of voxels (the way "voxels"), in the game's axes (engine x, y, z → three x, z, y; a voxel 1/r of a tile), placed at
 * the place's corner: the faces of solid voxels that touch air, water or a hidden letter, merged where `greedy` (coplanar faces of one letter
 * in a slice joined into rectangles, as a terrain mesher would) or one quad a face (as `meshVoxels` does, without its occlusion). Across the
 * place's border `outside(x, y, z)` says whether the neighbour's voxel is solid (the large scale of the neighbour, without its detail), so
 * the faces between two places are not drawn. Water is not in it: its surface is the water's own mesh, as today.
 */
export function voxelMesh(g: Grid3, r: number, X0: number, Z0: number, base: number, palette: Record<string, PaletteEntry>, outside: (x: number, y: number, z: number) => boolean, greedy: boolean): Tris {
  const { X, Y, Z, cells } = g;
  const XY = X * Y;
  const colours = g.alphabet.map((ch, i) => (i > 0 && palette[ch] && !palette[ch].hidden ? rgb(palette[ch].color) : null));
  const solidAt = (x: number, y: number, z: number) => {
    if (z < 0) return true;
    if (z >= Z) return false;
    if (x < 0 || y < 0 || x >= X || y >= Y) return outside(x, y, z);
    return colours[cells[x + y * X + z * XY]] !== null;
  };
  const b = new Tris();
  const s = 1 / r;
  // The corners of the face of the voxel (x, y, z) towards f, in the game's axes, in the winding of terrain.ts (counter-clockwise from outside).
  const emit = (f: number, x: number, y: number, z: number, w: number, h: number, c: number) => {
    const n = FACE_NORMALS[f];
    const shade = f === 4 ? 1.08 : f === 5 ? 0.6 : 0.82;
    const col = colours[c]!.map((v) => v * shade);
    const part = (c % 127) + (f === 4 ? 0 : 128);
    // In engine axes, the face spans (w, h) along its two axes from (x, y, z).
    const P = (ex: number, ey: number, ez: number) => [X0 + ex * s, (base + ez) * s, Z0 + ey * s];
    const nn = [n[0], n[2], n[1]];
    switch (f) {
      case 0: return b.quad(P(x + 1, y, z + h), P(x + 1, y, z), P(x + 1, y + w, z), P(x + 1, y + w, z + h), nn, col, part);
      case 1: return b.quad(P(x, y + w, z + h), P(x, y + w, z), P(x, y, z), P(x, y, z + h), nn, col, part);
      case 2: return b.quad(P(x + w, y + 1, z + h), P(x + w, y + 1, z), P(x, y + 1, z), P(x, y + 1, z + h), nn, col, part);
      case 3: return b.quad(P(x, y, z + h), P(x, y, z), P(x + w, y, z), P(x + w, y, z + h), nn, col, part);
      case 4: return b.quad(P(x, y, z + 1), P(x, y + h, z + 1), P(x + w, y + h, z + 1), P(x + w, y, z + 1), nn, col, part);
      case 5: return b.quad(P(x, y + h, z), P(x, y, z), P(x + w, y, z), P(x + w, y + h, z), nn, col, part);
    }
  };
  // Per face direction, a slice at a time: the mask of the faces drawn (the letter, 0 for none), then rectangles.
  for (let f = 0; f < 6; f++) {
    const [nx, ny, nz] = FACE_NORMALS[f];
    // The slice's axis and the two axes along it (u along the first, v along the second, in emit's order).
    const axis = nx ? 0 : ny ? 1 : 2;
    const U = axis === 2 ? X : axis === 0 ? Y : X, V = axis === 2 ? Y : Z, N = axis === 0 ? X : axis === 1 ? Y : Z;
    const mask = new Int32Array(U * V);
    for (let k = 0; k < N; k++) {
      let any = false;
      for (let v = 0; v < V; v++)
        for (let u = 0; u < U; u++) {
          const [x, y, z] = axis === 0 ? [k, u, v] : axis === 1 ? [u, k, v] : [u, v, k];
          const c = cells[x + y * X + z * XY];
          const m = colours[c] !== null && !solidAt(x + nx, y + ny, z + nz) ? c + 1 : 0;
          mask[v * U + u] = m;
          if (m) any = true;
        }
      if (!any) continue;
      for (let v = 0; v < V; v++)
        for (let u = 0; u < U; ) {
          const m = mask[v * U + u];
          if (!m) {
            u++;
            continue;
          }
          let w = 1, h = 1;
          if (greedy) {
            while (u + w < U && mask[v * U + u + w] === m) w++;
            outer: while (v + h < V) {
              for (let j = 0; j < w; j++) if (mask[(v + h) * U + u + j] !== m) break outer;
              h++;
            }
            for (let dv = 0; dv < h; dv++) for (let j = 0; j < w; j++) mask[(v + dv) * U + u + j] = 0;
          }
          const [x, y, z] = axis === 0 ? [k, u, v] : axis === 1 ? [u, k, v] : [u, v, k];
          emit(f, x, y, z, w, h, m - 1);
          u += w;
        }
    }
  }
  return b;
}

// ---------------------------------------------------------------------------------------------------------------- the water as virtual pipes

/**
 * The water as virtual pipes (O'Brien and Hodgins 1995; Mei, Decaudin and Hu 2007): every cell a column of water over its bed, and a flux
 * towards each of its four neighbours that the difference of their surfaces accelerates; no more leaves a cell than it has; the depth
 * changes by what flows in and out. Waves travel, water runs downhill and stops when level, the amount is kept; a cell of the open sea
 * holds its surface (a source and a sink). Heights in tiles, a cell `cell` tiles a side, time in seconds. Float32 storage and IEEE
 * arithmetic only (no Math.sin, no clock): the same steps on the same cells give the same water in every engine (ADR-0055).
 */
export class PipesWater {
  readonly n: number;
  bed: Float32Array;
  depth: Float32Array;
  /** Out-fluxes to x+1, x−1, y+1, y−1 (tiles³ a second). */
  fx0: Float32Array;
  fx1: Float32Array;
  fy0: Float32Array;
  fy1: Float32Array;
  /** 1 where the cell is the open sea, held at `sea`. */
  source: Uint8Array;
  sea = 0;
  /** Gravity (tiles a second²: a tile is about a metre) and how much a flux keeps of itself each step. */
  g = 9.8;
  damp = 0.995;
  constructor(readonly W: number, readonly H: number, readonly cell = 1) {
    this.n = W * H;
    this.bed = new Float32Array(this.n);
    this.depth = new Float32Array(this.n);
    this.fx0 = new Float32Array(this.n);
    this.fx1 = new Float32Array(this.n);
    this.fy0 = new Float32Array(this.n);
    this.fy1 = new Float32Array(this.n);
    this.source = new Uint8Array(this.n);
  }
  /** The largest step that keeps it stable: a wave crosses at most half a cell. */
  stableDt(maxDepth: number): number {
    return (0.5 * this.cell) / Math.sqrt(this.g * Math.max(0.01, maxDepth));
  }
  step(dt: number): void {
    const { W, H, bed, depth, fx0, fx1, fy0, fy1, source, damp } = this;
    // The pipe's section (cell²) over its length (cell), times g and dt: what a difference of surfaces adds to the flux.
    const k = dt * this.g * this.cell;
    const area = this.cell * this.cell;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const h = bed[i] + depth[i];
        let a = x + 1 < W ? Math.max(0, fx0[i] * damp + k * (h - bed[i + 1] - depth[i + 1])) : 0;
        let b = x > 0 ? Math.max(0, fx1[i] * damp + k * (h - bed[i - 1] - depth[i - 1])) : 0;
        let c = y + 1 < H ? Math.max(0, fy0[i] * damp + k * (h - bed[i + W] - depth[i + W])) : 0;
        let d = y > 0 ? Math.max(0, fy1[i] * damp + k * (h - bed[i - W] - depth[i - W])) : 0;
        const out = (a + b + c + d) * dt;
        const have = depth[i] * area;
        if (out > have && out > 0) {
          const s = have / out;
          a *= s;
          b *= s;
          c *= s;
          d *= s;
        }
        fx0[i] = a;
        fx1[i] = b;
        fy0[i] = c;
        fy1[i] = d;
      }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (source[i]) {
          depth[i] = Math.max(0, this.sea - bed[i]);
          continue;
        }
        const inflow = (x > 0 ? fx0[i - 1] : 0) + (x + 1 < W ? fx1[i + 1] : 0) + (y > 0 ? fy0[i - W] : 0) + (y + 1 < H ? fy1[i + W] : 0);
        const outflow = fx0[i] + fx1[i] + fy0[i] + fy1[i];
        depth[i] = Math.max(0, depth[i] + (dt * (inflow - outflow)) / area);
      }
  }
  /** The velocity of the water at a cell (tiles a second), from the fluxes through it: the current a swimmer or a hull would feel. */
  velocity(x: number, y: number): [number, number] {
    const { W, H, fx0, fx1, fy0, fy1, depth } = this;
    const i = y * W + x;
    const d = Math.max(1e-3, depth[i]) * this.cell;
    const u = ((x > 0 ? fx0[i - 1] - fx1[i] : 0) + (x + 1 < W ? fx0[i] - fx1[i + 1] : 0)) / 2;
    const v = ((y > 0 ? fy0[i - W] - fy1[i] : 0) + (y + 1 < H ? fy0[i] - fy1[i + W] : 0)) / 2;
    return [u / d, v / d];
  }
  /** All the water, the sea's cells apart (tiles³). */
  volume(): number {
    let v = 0;
    for (let i = 0; i < this.n; i++) if (!this.source[i]) v += this.depth[i];
    return v * this.cell * this.cell;
  }
}

// ---------------------------------------------------------------------------------------------------------------- the wind as a lattice Boltzmann

const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1];
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1];
const WT = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6];

/**
 * The wind as a lattice Boltzmann automaton (D2Q9, BGK): nine populations a cell stream to their neighbours and relax towards the
 * equilibrium of the cell's density and velocity; an obstacle (what stands higher than the wind's layer: a mountain, a building) bounces
 * them back, so the wind goes round it and has its lee and its gusts. The prevailing wind enters on the upwind edges (`inflow`, in cells a
 * step, under 0.1) and leaves on the others. A cell `cell` tiles a side. Float32 storage, IEEE arithmetic only.
 */
export class LbmWind {
  readonly n: number;
  f: Float32Array;
  private g: Float32Array;
  solid: Uint8Array;
  /** The relaxation time (over 0.5): the air's viscosity. */
  tau = 0.58;
  inflow: [number, number] = [0.06, 0.02];
  constructor(readonly W: number, readonly H: number, readonly cell = 1) {
    this.n = W * H;
    this.f = new Float32Array(9 * this.n);
    this.g = new Float32Array(9 * this.n);
    this.solid = new Uint8Array(this.n);
    for (let i = 0; i < this.n; i++) this.equilibrium(this.f, i, 1, this.inflow[0], this.inflow[1]);
  }
  private equilibrium(f: Float32Array, i: number, rho: number, ux: number, uy: number): void {
    const uu = ux * ux + uy * uy;
    for (let q = 0; q < 9; q++) {
      const eu = EX[q] * ux + EY[q] * uy;
      f[q * this.n + i] = WT[q] * rho * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * uu);
    }
  }
  step(): void {
    const { W, H, n, f, g, solid } = this;
    const omega = 1 / this.tau;
    // Collide.
    for (let i = 0; i < n; i++) {
      if (solid[i]) continue;
      let rho = 0, ux = 0, uy = 0;
      for (let q = 0; q < 9; q++) {
        const v = f[q * n + i];
        rho += v;
        ux += v * EX[q];
        uy += v * EY[q];
      }
      ux /= rho;
      uy /= rho;
      const uu = ux * ux + uy * uy;
      for (let q = 0; q < 9; q++) {
        const eu = EX[q] * ux + EY[q] * uy;
        const eq = WT[q] * rho * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * uu);
        const k = q * n + i;
        f[k] += omega * (eq - f[k]);
      }
    }
    // Stream, bouncing back from the obstacles; the edges take the prevailing wind.
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        for (let q = 0; q < 9; q++) {
          const sx = x - EX[q], sy = y - EY[q];
          let v: number;
          if (sx < 0 || sy < 0 || sx >= W || sy >= H) v = WT[q] * (1 + 3 * (EX[q] * this.inflow[0] + EY[q] * this.inflow[1]));
          else {
            const s = sy * W + sx;
            v = solid[s] ? f[OPP[q] * n + i] : f[q * n + s];
          }
          g[q * n + i] = v;
        }
      }
    this.f = g;
    this.g = f;
  }
  /** The wind at a cell (cells a step). */
  velocity(i: number): [number, number] {
    const { n, f } = this;
    let rho = 0, ux = 0, uy = 0;
    for (let q = 0; q < 9; q++) {
      const v = f[q * n + i];
      rho += v;
      ux += v * EX[q];
      uy += v * EY[q];
    }
    return [ux / rho, uy / rho];
  }
}

// ---------------------------------------------------------------------------------------------------------------- the parametric primitive

/**
 * A scalar that spreads and fades (heat, smoke, a smell, the damp): each step a cell takes `rate` of the difference with its four
 * neighbours and loses `decay` of itself; a source holds its value; an obstacle (1 in `wall`) takes nothing and gives nothing. The
 * family `diffuse` of the primitive. Float32 storage, IEEE arithmetic only.
 */
export class Diffuse {
  readonly n: number;
  value: Float32Array;
  private next: Float32Array;
  wall: Uint8Array;
  source: Float32Array;
  rate = 0.2;
  decay = 0.002;
  constructor(readonly W: number, readonly H: number) {
    this.n = W * H;
    this.value = new Float32Array(this.n);
    this.next = new Float32Array(this.n);
    this.wall = new Uint8Array(this.n);
    this.source = new Float32Array(this.n).fill(NaN);
  }
  step(): void {
    const { W, H, value: v, next, wall, source, rate, decay } = this;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (wall[i]) {
          next[i] = 0;
          continue;
        }
        if (source[i] === source[i]) {
          next[i] = source[i];
          continue;
        }
        const c = v[i];
        let sum = 0;
        if (x > 0 && !wall[i - 1]) sum += v[i - 1] - c;
        if (x + 1 < W && !wall[i + 1]) sum += v[i + 1] - c;
        if (y > 0 && !wall[i - W]) sum += v[i - W] - c;
        if (y + 1 < H && !wall[i + W]) sum += v[i + W] - c;
        next[i] = Math.max(0, c + rate * sum - decay * c);
      }
    this.value = next;
    this.next = v;
  }
}

/**
 * A discrete automaton written as data (the parametric primitive): states 0..k−1, for each state and number of neighbours (Moore, 0-8)
 * in the state `counted`, the next state and its chance (a hash of the cell and of the step, never Math.random: the same on the server
 * and on a client). The example: fire on fuel (0 fuel, 1 burning, 2 ash): fuel by a fire catches with a chance that grows with the
 * fires around, a fire becomes ash.
 */
export class RuleTable {
  readonly n: number;
  cells: Uint8Array;
  private next: Uint8Array;
  steps = 0;
  /** `rules[state * 9 + count]` = [next state, chance in 0-1]. */
  constructor(readonly W: number, readonly H: number, readonly states: number, readonly counted: number, readonly rules: Array<[number, number]>, readonly seed: number) {
    this.n = W * H;
    this.cells = new Uint8Array(this.n);
    this.next = new Uint8Array(this.n);
  }
  step(): void {
    const { W, H, cells, next, rules, counted } = this;
    const s = this.seed + this.steps++;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < W && ny < H && cells[ny * W + nx] === counted) count++;
          }
        const [to, p] = rules[cells[i] * 9 + count];
        next[i] = p >= 1 || (p > 0 && hash32(s, i) * UNIT < p) ? to : cells[i];
      }
    this.cells = next;
    this.next = cells;
  }
}

/** The fire of `RuleTable` as rules: fuel catches with 0.12 a fire around, a fire is ash the step after, ash stays. */
export function fireRules(): Array<[number, number]> {
  const rules: Array<[number, number]> = [];
  for (let state = 0; state < 3; state++)
    for (let count = 0; count < 9; count++) {
      if (state === 0) rules.push(count ? [1, Math.min(1, 0.12 * count)] : [0, 0]);
      else if (state === 1) rules.push([2, 1]);
      else rules.push([2, 0]);
    }
  return rules;
}

/** The same fire as a MarkovJunior program, for a `Stepper`: a step is one tick of the program (fuel F, fire B, ash A). */
export const FIRE_XML = `<sequence values="FBA">
  <convolution neighborhood="Moore" steps="1">
    <rule in="F" out="B" sum="1..8" values="B" p="0.3"/>
    <rule in="B" out="A"/>
  </convolution>
</sequence>`;

/** The same fire in Lua, a function a cell (what a Lua automaton of the Engineer would be): the next state from the state and the count. */
export const FIRE_LUA_CELL = `function fire_cell(state, count, roll)
  if state == 0 then
    if count > 0 and roll < 0.12 * count then return 1 end
    return 0
  elseif state == 1 then return 2 end
  return 2
end`;

/** The same fire in Lua, the whole step in Lua over a table of cells (1-based), with its own neighbours. */
export const FIRE_LUA_STEP = `function fire_step(cells, nextc, W, H, seed)
  for y = 0, H - 1 do
    for x = 0, W - 1 do
      local i = y * W + x + 1
      local count = 0
      for dy = -1, 1 do
        for dx = -1, 1 do
          if dx ~= 0 or dy ~= 0 then
            local nx, ny = x + dx, y + dy
            if nx >= 0 and ny >= 0 and nx < W and ny < H and cells[ny * W + nx + 1] == 1 then count = count + 1 end
          end
        end
      end
      local s = cells[i]
      local roll = ((i * 2654435761 + seed * 97) % 1000) / 1000
      if s == 0 then nextc[i] = (count > 0 and roll < 0.12 * count) and 1 or 0
      else nextc[i] = 2 end
    end
  end
end`;
