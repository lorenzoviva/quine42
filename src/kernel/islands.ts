// The archipelago (T441, ADR-0228, `docs/design/acqua-spazio.md` § 1.2 and § 1.5): where a world of islands has land, decided by the kernel
// from the universe's seed alone, without a call and without a file. A lattice of islands, one in each cell of `ISLAND_PITCH` tiles, its
// centre shaken within the cell, its shore a closed curve around it; between two islands of neighbouring cells whose shores are farther
// than the longest strait (`MAX_STRAIT`) an islet on the line between them, so that no swim between two shores is longer. The islands never
// move: they are a function of the seed, the nature is fixed at the Genesis (ADR-0224), and nothing else enters them, not the atlas, not the
// master, not the Cartographer, who only names them (`Region.island`). Pure and deterministic: the same in Node, in the browser, on the server.

import { hash32 } from './rng';
import { gaitOf } from './nature';
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

/** An island (or an islet) of the archipelago: its centre and its shore. */
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
}

const AMPLITUDES = [0.5, 0.3, 0.2] as const;

function waveOf(seed: number, a: number, b: number, c: number): Array<[number, number]> {
  return AMPLITUDES.map((amp, n) => [amp, (hash32(seed, a, b, c, 101 + n) / 2 ** 32) * Math.PI * 2] as [number, number]);
}

/** Where the shore of an island is, in the direction `theta` from its centre (tiles): every ray from the centre crosses it once. */
export function shoreAt(island: Island, theta: number): number {
  let w = 0;
  island.wave.forEach(([amp, phase], n) => (w += amp * Math.sin((n + 2) * theta + phase)));
  return island.radius * (1 + ISLAND_WOBBLE * w);
}

/** The island of a cell of the lattice: the seed's, always the same. */
export function islandOf(seed: number, i: number, j: number): Island {
  const start = i === 0 && j === 0;
  const shake = (k: number) => (start ? 0 : (hash32(seed, i, j, k) % (2 * ISLAND_JITTER + 1)) - ISLAND_JITTER);
  const [lo, hi] = ISLAND_RADIUS;
  return {
    id: `${i},${j}`,
    x: i * ISLAND_PITCH + shake(1),
    y: j * ISLAND_PITCH + shake(2),
    radius: start ? START_ISLAND_RADIUS : lo + (hash32(seed, i, j, 3) % (hi - lo + 1)),
    wave: waveOf(seed, i, j, 4),
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
 * neighbouring cells (the islets). Each is a function of the seed and its cells only.
 */
export function islandsNear(seed: number, x: number, y: number, reach: number): Island[] {
  const r = Math.max(0, Number.isFinite(reach) ? reach : 0);
  const i0 = Math.floor((x - r) / ISLAND_PITCH) - 1;
  const i1 = Math.ceil((x + r) / ISLAND_PITCH) + 1;
  const j0 = Math.floor((y - r) / ISLAND_PITCH) - 1;
  const j1 = Math.ceil((y + r) / ISLAND_PITCH) + 1;
  const cells = new Map<string, Island>();
  const cell = (i: number, j: number) => {
    const k = `${i},${j}`;
    let c = cells.get(k);
    if (!c) cells.set(k, (c = islandOf(seed, i, j)));
    return c;
  };
  const out: Island[] = [];
  const near = (f: Island) => Math.hypot(f.x - x, f.y - y) <= r + reachOf(f);
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++) {
      const a = cell(i, j);
      if (near(a)) out.push(a);
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
export function islandsOfPlace(seed: number, cx: number, cy: number, S: number): Island[] {
  return islandsNear(seed, cx * S + S / 2, cy * S + S / 2, S * Math.SQRT1_2 + 1);
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

/**
 * The island a place stands on (T441): the one with the most of its land and beach in the place, or undefined if the place is all water.
 * The Cartographer names it when the first place on it is planned.
 */
export function islandOfPlace(seed: number, cx: number, cy: number, S: number): Island | undefined {
  const features = islandsOfPlace(seed, cx, cy, S);
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
export function islandAtTile(seed: number, x: number, y: number): Island | undefined {
  const tx = Math.floor(x) + 0.5, ty = Math.floor(y) + 0.5;
  const g = groundAt(islandsNear(seed, tx, ty, 1), tx, ty);
  return g.ground === 'sea' ? undefined : g.island;
}

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
