// The archipelago (T441, ADR-0229, `docs/design/acqua-spazio.md` § 1.2 and § 1.5): where a world of islands has land, decided by the kernel
// from the universe's seed alone, without a call and without a file. A lattice of islands, one in each cell of `ISLAND_PITCH` tiles, its
// centre shaken within the cell, its shore a closed curve around it; between two islands of neighbouring cells whose shores are farther
// than the longest strait (`MAX_STRAIT`) an islet on the line between them, so that no swim between two shores is longer. The islands never
// move: they are a function of the seed, the nature is fixed at the Genesis (ADR-0224), and nothing else enters them, not the atlas, not the
// master, not the Cartographer, who only names them (`Region.island`). Pure and deterministic: the same in Node, in the browser, on the server.
// The void (T445, ADR-0233) has its lands on the same lattice: stations (squared, built) and asteroids (smaller, of rock) in the void,
// without islets (nobody swims the void) and with the gates of the places moved onto the land (`voidGates`).

import { hash32 } from './rng';
import { gaitOf, VOID_CODE } from './nature';
import { gates } from './layout';
import { WALK_ENERGY, DROWN_HEALTH } from './swim';
import type { WorldLanguage } from './language';

/** The side of a cell of the lattice, in tiles (10 places of 18): one island in each; between neighbours about 7 places of water (T441). */
export const ISLAND_PITCH = 180;
/** How far an island's centre may be from the middle of its cell, on each axis, in tiles (the start's is the origin). */
export const ISLAND_JITTER = 18;
/** The radius of an island's shore before its wobble, in tiles: from a cay to an island of five places across. */
export const ISLAND_RADIUS: readonly [number, number] = [16, 40];
/** The island of the start: the largest, centred on the first tile, so the start is well inland. */
export const START_ISLAND_RADIUS = 40;
/** How much a shore wanders from its circle, as a share of the radius: never more (the shape stays star-shaped around its centre). */
export const ISLAND_WOBBLE = 0.2;
/** The radius of an islet the kernel puts on a strait too long (`isletBetween`), in tiles. */
export const ISLET_RADIUS = 5;
/** The sand along the shore, inside it (tiles): every shore is a beach one walks onto from the water, whatever the draft had there. */
export const BEACH = 2;
/** The shallow water along the shore, outside it (tiles), before the open sea. */
export const SHALLOWS = 2;

/**
 * The longest strait, in tiles: the water between two shores of a chain no swimmer needs to cross more of (8 places of 18). Measured on the
 * swimming body (`straitCost`): with the sea of the seed (pace 0.4, fatigue 3) a minute in the water and 17 of the 100 of energy; in the
 * most tiring sea the Physicist may write (pace 0.2, fatigue 6) and the heaviest gait of a gravity (0.9), 77, below the 90 a wanderer is
 * born with; with no energy left, drowning, 36 of the 100 of health in the seed's sea and 80 in the worst. The study proposed 4 places.
 */
export const MAX_STRAIT = 144;

/** The pace of a body, tiles a second (`core.player`'s speed): the swimming pace is a share of it. */
export const BODY_SPEED = 6;
/** The energy a wanderer is born with (`core.player`): a strait must be crossed with it, in any sea. */
export const BORN_ENERGY = 90;

/** What the lattice makes of the world: the islands of an archipelago, or the stations and asteroids of the void (T445). */
export type Lattice = 'archipelago' | 'void';

/** A land of the void (T445): a station, squared and built, or an asteroid, smaller and of rock. */
export type Body = 'station' | 'asteroid';

/** The radius of an asteroid before its wobble, in tiles: from a boulder one crosses in a few steps to one of three places. */
export const ASTEROID_RADIUS: readonly [number, number] = [10, 24];
/** How many lands of the void are asteroids, one in so many (the rest are stations; the start's is always a station). */
export const ASTEROID_ONE_IN = 3;
/** How square a station's edge is (the exponent of its superellipse: 2 a circle, larger a square with rounded corners). */
const STATION_SQUARE = 4;

/** An island (or an islet) of the archipelago, or a land of the void: its centre and its shore. */
export interface Island {
  /** `i,j` the cell of the lattice; an islet `i,j~k,l`, the two islands it joins. */
  id: string;
  /** The centre, in tiles of the carpet. */
  x: number;
  y: number;
  /** The radius of its shore before the wobble, in tiles. */
  radius: number;
  /** The wobble of the shore: amplitude and phase of the harmonics 2, 3 and 4. */
  wave: ReadonlyArray<readonly [number, number]>;
  islet?: true;
  /** In the void (T445): a station or an asteroid. */
  body?: Body;
}

const AMPLITUDES = [0.5, 0.3, 0.2] as const;

function waveOf(seed: number, a: number, b: number, c: number): Array<[number, number]> {
  return AMPLITUDES.map((amp, n) => [amp, (hash32(seed, a, b, c, 101 + n) / 2 ** 32) * Math.PI * 2] as [number, number]);
}

/** Where the shore of an island is, in the direction `theta` from its centre (tiles): every ray from the centre crosses it once. */
export function shoreAt(island: Island, theta: number): number {
  // A station's edge is a superellipse (T445): squared, with rounded corners, and every ray still crosses it once.
  if (island.body === 'station') return island.radius / (Math.abs(Math.cos(theta)) ** STATION_SQUARE + Math.abs(Math.sin(theta)) ** STATION_SQUARE) ** (1 / STATION_SQUARE);
  let w = 0;
  island.wave.forEach(([amp, phase], n) => (w += amp * Math.sin((n + 2) * theta + phase)));
  return island.radius * (1 + ISLAND_WOBBLE * w);
}

/**
 * The island of a cell of the lattice: the seed's, always the same. In the void (T445) a station or an asteroid: the start's a station as
 * large as the start's island, the others an asteroid one in `ASTEROID_ONE_IN`, smaller; centres and shapes from the same hashes.
 */
export function islandOf(seed: number, i: number, j: number, lattice: Lattice = 'archipelago'): Island {
  const start = i === 0 && j === 0;
  const shake = (k: number) => (start ? 0 : (hash32(seed, i, j, k) % (2 * ISLAND_JITTER + 1)) - ISLAND_JITTER);
  const body: Body | undefined = lattice !== 'void' ? undefined : !start && hash32(seed, i, j, 6) % ASTEROID_ONE_IN === 0 ? 'asteroid' : 'station';
  const [lo, hi] = body === 'asteroid' ? ASTEROID_RADIUS : ISLAND_RADIUS;
  return {
    id: `${i},${j}`,
    x: i * ISLAND_PITCH + shake(1),
    y: j * ISLAND_PITCH + shake(2),
    radius: start ? START_ISLAND_RADIUS : lo + (hash32(seed, i, j, 3) % (hi - lo + 1)),
    wave: waveOf(seed, i, j, 4),
    ...(body ? { body } : {}),
  };
}

/** The water between two shores on the line between their centres (tiles), and the direction from `a` to `b`. */
export function routeGap(a: Island, b: Island): { gap: number; theta: number } {
  const theta = Math.atan2(b.y - a.y, b.x - a.x);
  return { gap: Math.hypot(b.x - a.x, b.y - a.y) - shoreAt(a, theta) - shoreAt(b, theta + Math.PI), theta };
}

/**
 * The islet between two islands of neighbouring cells, if the water between their shores is longer than the longest strait: in the middle
 * of that water, on the line between their centres, so each half is a strait (rule 10: what the kernel guarantees, not luck).
 */
export function isletBetween(seed: number, a: Island, b: Island): Island | undefined {
  const { gap, theta } = routeGap(a, b);
  if (gap <= MAX_STRAIT) return undefined;
  const at = shoreAt(a, theta) + gap / 2;
  const [i, j] = a.id.split(',').map(Number);
  const [k, l] = b.id.split(',').map(Number);
  return { id: `${a.id}~${b.id}`, x: a.x + Math.cos(theta) * at, y: a.y + Math.sin(theta) * at, radius: ISLET_RADIUS, wave: waveOf(seed, i * 7 + k, j * 7 + l, 5), islet: true };
}

/** The largest a shore reaches from its centre (tiles). */
const reachOf = (f: Island) => f.radius * (1 + ISLAND_WOBBLE) + SHALLOWS;

/**
 * The islands and the islets within `reach` tiles of (x, y), the nearest first: of the lattice's cells around, and of the pairs of
 * neighbouring cells (the islets). Each is a function of the seed and its cells only. In the void (T445) the stations and the asteroids,
 * without islets: nobody swims the void.
 */
export function islandsNear(seed: number, x: number, y: number, reach: number, lattice: Lattice = 'archipelago'): Island[] {
  const r = Math.max(0, Number.isFinite(reach) ? reach : 0);
  const i0 = Math.floor((x - r) / ISLAND_PITCH) - 1;
  const i1 = Math.ceil((x + r) / ISLAND_PITCH) + 1;
  const j0 = Math.floor((y - r) / ISLAND_PITCH) - 1;
  const j1 = Math.ceil((y + r) / ISLAND_PITCH) + 1;
  const cells = new Map<string, Island>();
  const cell = (i: number, j: number) => {
    const k = `${i},${j}`;
    let c = cells.get(k);
    if (!c) cells.set(k, (c = islandOf(seed, i, j, lattice)));
    return c;
  };
  const out: Island[] = [];
  const near = (f: Island) => Math.hypot(f.x - x, f.y - y) <= r + reachOf(f);
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++) {
      const a = cell(i, j);
      if (near(a)) out.push(a);
      if (lattice === 'void') continue;
      for (const b of [cell(i + 1, j), cell(i, j + 1)]) {
        const islet = isletBetween(seed, a, b);
        if (islet && near(islet)) out.push(islet);
      }
    }
  return out.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
}

/** What a tile of an archipelago is: the open sea, the shallows around a shore, the beach, the land inside it. */
export type Ground = 'sea' | 'shallows' | 'beach' | 'land';
const RANK: Record<Ground, number> = { sea: 0, shallows: 1, beach: 2, land: 3 };

/** What the tile whose centre is (px, py) is among these islands, and of which (the island of its beach or land, or of its shallows). */
export function groundAt(features: readonly Island[], px: number, py: number): { ground: Ground; island?: Island } {
  let best: Ground = 'sea';
  let of: Island | undefined;
  for (const f of features) {
    const dx = px - f.x, dy = py - f.y;
    const rho = Math.hypot(dx, dy);
    if (rho > reachOf(f)) continue;
    const shore = shoreAt(f, Math.atan2(dy, dx));
    const g: Ground = rho < shore - BEACH ? 'land' : rho < shore ? 'beach' : rho < shore + SHALLOWS ? 'shallows' : 'sea';
    if (RANK[g] > RANK[best]) [best, of] = [g, f];
  }
  return { ground: best, ...(of ? { island: of } : {}) };
}

/** The features that may touch a place (cx, cy) of side S. */
export function islandsOfPlace(seed: number, cx: number, cy: number, S: number, lattice: Lattice = 'archipelago'): Island[] {
  return islandsNear(seed, cx * S + S / 2, cy * S + S / 2, S * Math.SQRT1_2 + 1, lattice);
}

/**
 * The draft of a place of an archipelago (T441): the land of the generator inside the shores, the beach (`s`) along them, the shallows (`w`)
 * and the open sea (`o`) outside; what the generator made sea inside a shore is a lagoon (`w`). The islands are the kernel's: a generator a
 * universe rewrote still has them.
 */
export function islandDraft(draft: string, seed: number, cx: number, cy: number, S: number): string {
  const features = islandsOfPlace(seed, cx, cy, S);
  const out: string[] = [];
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const { ground } = groundAt(features, cx * S + c + 0.5, cy * S + r + 0.5);
      const code = draft[r * S + c];
      out.push(ground === 'sea' ? 'o' : ground === 'shallows' ? 'w' : ground === 'beach' ? 's' : code === 'o' ? 'w' : code);
    }
  return out.join('');
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const UNIT32 = 1 / 4294967296;
function islandNoise(x: number, y: number, s: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const a = hash32(ix, iy, s) * UNIT32, b = hash32(ix + 1, iy, s) * UNIT32;
  const c = hash32(ix, iy + 1, s) * UNIT32, d = hash32(ix + 1, iy + 1, s) * UNIT32;
  return a + (b - a) * fx + (c - a + (a - b + d - c) * fx) * fy;
}

/**
 * The true relief of a place of an archipelago (T475, ADR-0256): the open sea around the islands keeps its deep bed (-8 to -28, reefs at
 * -1), the shallows a shallow bed (-2 to -7) with surface at 0, the beach near sea level (0 to 2, walkable out of the water: rule 10), and
 * the interior of each island rises steeply from its shore into terraces and headlands (gentler on cays and around the start). The islands
 * stay the kernel's even if a universe rewrites `generate_relief`.
 */
export function islandRelief(levels: Int16Array, bed: Int16Array, seed: number, cx: number, cy: number, S: number): { levels: Int16Array; bed: Int16Array } {
  const features = islandsOfPlace(seed, cx, cy, S);
  const outL = Int16Array.from(levels);
  const outB = Int16Array.from(bed);
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const i = r * S + c;
      const wx = cx * S + c, wy = cy * S + r;
      const px = wx + 0.5, py = wy + 0.5;
      const { ground, island } = groundAt(features, px, py);
      if (ground === 'sea') {
        const reef = islandNoise(wx / 7, wy / 7, seed + 914) > 0.82;
        const depth = reef ? 1 : 8 + Math.round(20 * islandNoise(wx / 11, wy / 11, seed + 915));
        outL[i] = -depth;
        outB[i] = -depth;
      } else if (ground === 'shallows') {
        const depth = 2 + Math.round(5 * islandNoise(wx / 11, wy / 11, seed + 915));
        outL[i] = 0;
        outB[i] = -depth;
      } else if (ground === 'beach') {
        const shore = island ? shoreAt(island, Math.atan2(py - island.y, px - island.x)) : BEACH;
        const inland = island ? Math.max(0, shore - Math.hypot(px - island.x, py - island.y)) : 0;
        // Every beach tile stays within a step of the sea (0..2), so a swimmer always climbs ashore (rule 10).
        const h = Math.min(2, Math.max(0, Math.round(inland)));
        outL[i] = h;
        outB[i] = h;
      } else {
        const shore = island ? shoreAt(island, Math.atan2(py - island.y, px - island.x)) : BEACH;
        const rho = island ? Math.hypot(px - island.x, py - island.y) : 0;
        const inland = Math.max(0, shore - rho - BEACH);
        // Smooth climb from the beach (level 2) up into steep inland headlands and terraces (gentler on cays and around the start).
        const ramp = smooth(Math.min(1, inland / 8));
        const origin = smooth(Math.min(1, Math.max(0, (Math.hypot(wx, wy) - 6) / 14)));
        const raw = Math.max(0, levels[i]);
        const isletScale = island?.islet ? 0.25 : 1;
        // Add an island headland dome on larger islands so islands rise boldly over the sea even on lowland noise.
        const dome = island && !island.islet ? Math.round(10 * smooth(Math.min(1, inland / Math.max(8, island.radius * 0.45))) * origin) : 0;
        const lifted = Math.min(64, Math.max(2, 2 + Math.round(Math.max(0, raw + dome - 2) * ramp * isletScale * (0.25 + 0.75 * origin))));
        outL[i] = lifted;
        outB[i] = bed[i] < levels[i] ? Math.max(-32, lifted - Math.min(7, levels[i] - bed[i])) : lifted;
      }
    }
  return { levels: outL, bed: outB };
}

/**
 * The island a place stands on (T441): the one with the most of its land and beach in the place, or undefined if the place is all water.
 * The Cartographer names it when the first place on it is planned.
 */
export function islandOfPlace(seed: number, cx: number, cy: number, S: number, lattice: Lattice = 'archipelago'): Island | undefined {
  const features = islandsOfPlace(seed, cx, cy, S, lattice);
  const count = new Map<Island, number>();
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const { ground, island } = groundAt(features, cx * S + c + 0.5, cy * S + r + 0.5);
      if (island && (ground === 'land' || ground === 'beach')) count.set(island, (count.get(island) ?? 0) + 1);
    }
  let best: Island | undefined;
  for (const [f, n] of count) if (!best || n > count.get(best)!) best = f;
  return best;
}

/** The island whose shallows, beach or land the tile (x, y) is on, if any. */
export function islandAtTile(seed: number, x: number, y: number, lattice: Lattice = 'archipelago'): Island | undefined {
  const tx = Math.floor(x) + 0.5, ty = Math.floor(y) + 0.5;
  const g = groundAt(islandsNear(seed, tx, ty, 1, lattice), tx, ty);
  // In the void the shallows are the void too (T445): only the land is a station's or an asteroid's.
  return g.ground === 'sea' || (lattice === 'void' && g.ground === 'shallows') ? undefined : g.island;
}

// --- The void (T445, ADR-0233) -------------------------------------------------------------------------------------------------------

/** Whether a ground of the lattice is land in the void: the beach and the land inside a shore; the rest is the void. */
const landOfVoid = (g: Ground) => g === 'land' || g === 'beach';

/** What a tile of the generator becomes on an asteroid: no trees, no water but ice, dust for the meadow; what else it drew stays. */
const ASTEROID_GROUND: Readonly<Record<string, string>> = { g: 's', t: 'r', j: 'r', w: 'n', o: 'n' };

/**
 * The draft of a place of the void (T445): outside the edges of the stations and the asteroids the void (`VOID_CODE`); a station's
 * floor is the plating of the world (`p`, the path of every palette: the corridors, the decks, what the environments build on); an
 * asteroid keeps what the generator drew of rock, dust and ice (`ASTEROID_GROUND`), its rim dust. The lands are the kernel's: a generator
 * a universe rewrote still has them.
 */
export function voidDraft(draft: string, seed: number, cx: number, cy: number, S: number): string {
  const features = islandsOfPlace(seed, cx, cy, S, 'void');
  const out: string[] = [];
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const { ground, island } = groundAt(features, cx * S + c + 0.5, cy * S + r + 0.5);
      const code = draft[r * S + c];
      out.push(!landOfVoid(ground) ? VOID_CODE : island?.body === 'station' ? 'p' : ground === 'beach' ? 's' : (ASTEROID_GROUND[code] ?? code));
    }
  return out.join('');
}

/** Whether the tile (x, y) of the carpet is land in the void, among these features. */
const voidLand = (features: readonly Island[], x: number, y: number) => landOfVoid(groundAt(features, x + 0.5, y + 0.5).ground);

/**
 * The gates of a place of the void (T445, `docs/design/acqua-spazio.md` § 2.2), as `gates` gives them ([west, east, north, south]):
 * a gate stands where the land goes on into the next place, on both sides of the edge; from the gate of the hash, the nearest such tile
 * along the edge. An edge that is the void on one side wherever one looks keeps the gate of the hash, which the layout leaves as void (no
 * gate, nothing carved). The two places of an edge look at the same two rows of tiles, so they agree.
 */
export function voidGates(seed: number, cx: number, cy: number, S: number): number[] {
  const base = gates(cx, cy, S, seed);
  const features = islandsNear(seed, cx * S + S / 2, cy * S + S / 2, S * 1.5 + 2, 'void');
  const X0 = cx * S, Y0 = cy * S;
  // For each edge: the gate's position along it, its tile in the place, and the two tiles (here, beyond) at a position along it.
  const edges: Array<{ along: number; tile: (a: number) => number; pair: (a: number) => [number, number, number, number] }> = [
    { along: Math.floor(base[0] / S), tile: (a) => a * S, pair: (a) => [X0, Y0 + a, X0 - 1, Y0 + a] },
    { along: Math.floor(base[1] / S), tile: (a) => a * S + S - 1, pair: (a) => [X0 + S - 1, Y0 + a, X0 + S, Y0 + a] },
    { along: base[2] % S, tile: (a) => a, pair: (a) => [X0 + a, Y0, X0 + a, Y0 - 1] },
    { along: base[3] % S, tile: (a) => (S - 1) * S + a, pair: (a) => [X0 + a, Y0 + S - 1, X0 + a, Y0 + S] },
  ];
  return edges.map(({ along, tile, pair }, k) => {
    for (let d = 0; d < S; d++)
      for (const a of d === 0 ? [along] : [along + d, along - d]) {
        if (a < 2 || a > S - 3) continue;
        const [x1, y1, x2, y2] = pair(a);
        if (voidLand(features, x1, y1) && voidLand(features, x2, y2)) return tile(a);
      }
    return base[k];
  });
}

// --- The landing of a land of the void and its capsule (T448, ADR-0234) ------------------------------------------------------------

/** The box of the seed's capsule (`models/capsule.xml`), tiles: across, and along from the stern to the bow. */
export const CAPSULE_TILES: readonly [number, number] = [2.5, 4];
/**
 * How far a docked capsule's stern goes over the edge of its land, in tiles: a sixty-fourth, so that between the land and its deck there is
 * no gap to stop a foot, while every point of its hull (`hullPoints`: the middles of its columns, a thirty-second in) stays over the void.
 */
export const DOCK_OVERLAP = 1 / 64;
/** How near its landing (tiles, its middle from the landing's) a vehicle is at it: there the kernel puts no other capsule. */
export const DOCK_NEAR = 2.5;

/**
 * The landing of a land of the void (T448): where its capsule waits, docked. Its middle (carpet space) in the void beyond the edge, its bow
 * away from the land (`heading`, as a vehicle's: the bow toward (sin, cos)), its stern, with the hatch, against the edge; `land` the tile of
 * the land at the hatch, which the layout keeps walked and reached from the gates (rule 10).
 */
export interface Dock {
  island: string;
  x: number;
  y: number;
  heading: number;
  land: [number, number];
}

const AXES: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, Math.PI / 2],
  [-1, 0, (3 * Math.PI) / 2],
  [0, 1, 0],
  [0, -1, Math.PI],
];

/**
 * The landing of a land of the void (T448, `docs/design/acqua-spazio.md` § 2.2): on the axis (east, west, south, north) toward the nearest
 * of its four neighbours of the lattice, where the land ends along the row (or the column) through its middle; the capsule (`CAPSULE_TILES`)
 * beyond, its stern over the edge by `DOCK_OVERLAP`, moved out a tile at a time while a tile under it is land. A function of the seed and the
 * land: the same in every kernel, never a file. Undefined in the archipelago (an island is reached swimming) and if no room is found.
 */
export function dockOf(seed: number, land: Island): Dock | undefined {
  if (!land.body || land.islet) return undefined;
  const [i, j] = land.id.split(',').map(Number);
  if (!Number.isInteger(i) || !Number.isInteger(j)) return undefined;
  let best = AXES[0], far = Infinity;
  for (const a of AXES) {
    const n = islandOf(seed, i + a[0], j + a[1], 'void');
    const d = Math.hypot(n.x - land.x, n.y - land.y);
    if (d < far) [best, far] = [a, d];
  }
  const [dx, dy, heading] = best;
  const own = [land];
  const cx = Math.floor(land.x), cy = Math.floor(land.y);
  // Along the axis, the first tile that is not land.
  let k = 1;
  while (k < 200 && landOfVoid(groundAt(own, cx + k * dx + 0.5, cy + k * dy + 0.5).ground)) k++;
  const features = islandsNear(seed, land.x, land.y, land.radius * 2 + 16, 'void');
  const [W, L] = CAPSULE_TILES;
  // The edge: the coordinate along the axis where the first void tile begins; across, the middle of the row (or the column).
  const across = (dx !== 0 ? cy : cx) + 0.5;
  for (let out = 0; out < 4; out++) {
    const step = k + out;
    const edge = dx > 0 ? cx + step : dx < 0 ? cx - step + 1 : dy > 0 ? cy + step : cy - step + 1;
    const sign = dx + dy;
    const mid = edge + sign * (L / 2 - DOCK_OVERLAP);
    // The tiles under the hull's points: from the edge to the bow, the width across, a thirty-second in.
    const a0 = Math.min(edge - sign * DOCK_OVERLAP, mid + sign * L / 2) + 1 / 32, a1 = Math.max(edge - sign * DOCK_OVERLAP, mid + sign * L / 2) - 1 / 32;
    const b0 = across - W / 2 + 1 / 32, b1 = across + W / 2 - 1 / 32;
    let clear = true;
    for (let a = Math.floor(a0); a <= Math.floor(a1) && clear; a++)
      for (let b = Math.floor(b0); b <= Math.floor(b1) && clear; b++) {
        const [tx, ty] = dx !== 0 ? [a, b] : [b, a];
        if (landOfVoid(groundAt(features, tx + 0.5, ty + 0.5).ground)) clear = false;
      }
    if (!clear) continue;
    const back = k - 1;
    return { island: land.id, x: dx !== 0 ? mid : across, y: dx !== 0 ? across : mid, heading, land: [cx + back * dx, cy + back * dy] };
  }
  return undefined;
}

/** The name of a place of the void, which the kernel plans without a call (T445), in the language of the world. */
export const OPEN_VOID: Readonly<Record<WorldLanguage, { name: string; description: string }>> = {
  it: { name: 'Vuoto', description: 'Nient’altro che stelle, sopra e sotto.' },
  en: { name: 'The void', description: 'Nothing but stars, above and below.' },
  fr: { name: 'Le vide', description: 'Rien que des étoiles, dessus et dessous.' },
  es: { name: 'El vacío', description: 'Nada más que estrellas, arriba y abajo.' },
};

/** The place a feature's centre is in and how many places around it its shore reaches (Chebyshev, as the atlas measures a region). */
export function islandPlaces(f: Island, S: number): { center: [number, number]; radius: number } {
  return { center: [Math.floor(f.x / S), Math.floor(f.y / S)], radius: Math.ceil(reachOf(f) / S) };
}

/**
 * What crossing `tiles` of water costs a body (T441): the seconds, the energy (the seed's needs walking and the kernel's fatigue, `swim.ts`),
 * and the health it would cost with no energy left (drowning). `pace` and `fatigue` the water's (`terrainPhysics`), `gravity` the world's.
 */
export function straitCost(tiles: number, water: { pace: number; fatigue: number }, gravity = 1): { seconds: number; energy: number; health: number } {
  const seconds = tiles / (BODY_SPEED * water.pace * gaitOf(gravity));
  return { seconds, energy: seconds * WALK_ENERGY * water.fatigue, health: seconds * DROWN_HEALTH };
}

/** The name of a place of open sea, which the kernel plans without a call (T441), in the language of the world. */
export const OPEN_SEA: Readonly<Record<WorldLanguage, { name: string; description: string }>> = {
  it: { name: 'Mare aperto', description: 'Acqua profonda fin dove arriva lo sguardo.' },
  en: { name: 'Open sea', description: 'Deep water as far as the eye can see.' },
  fr: { name: 'Haute mer', description: 'De l’eau profonde à perte de vue.' },
  es: { name: 'Mar abierto', description: 'Agua profunda hasta donde alcanza la vista.' },
};

/** How far `world.islands` looks, in tiles (four cells of the lattice), and how many islands it gives at most (T441). */
export const ISLANDS_REACH = 720;
export const MAX_ISLANDS_SEEN = 32;
