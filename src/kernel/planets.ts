// The planets and the voyage between them (T449, ADR-0236, `docs/design/acqua-spazio.md` § 2.7, the way C1 of D64): far bands of the same plane,
// no coordinate of their own and no contract. The planet k is the band of places around (k · pitch, 0), a pitch of about 2^20 tiles (a day
// and a night of walking); the band 0 is the orbit, the void with its stations and asteroids. A planet's draft is the generator's around its
// own centre, with its own seed; its relief is its own, its sea at the world's level; its gravity, its sky and its day its own.
//
// The voyage moves a vehicle of the void and whoever is aboard by the same Δ to the landing of the destination: the kernel shifts the scroll of
// each one's carpet, never where they stand in the circle (rule 8: the corona does not notice). The renderer shows it for a few seconds: the
// vehicle alone among the stars, the body it leaves going away and the one it comes to coming near, at a definition that grows with the
// nearness (the levels of detail: precomputed from the generator, fewer voxels from afar, the true places at the landing). Pure functions:
// the same in every kernel, never a file.

import { hash32 } from './rng';
import { cleanCoined } from './coined';
import { DEFAULT_NATURE, type Planet, type WorldNature } from './nature';
import type { Dock } from './islands';
import type { TerrainDef } from './types';

/** How wide a band is, in tiles: 2^20, so that between two planets there is a day and a night of walking (48 hours at 6 tiles a second). */
export const PLANET_SPAN = 2 ** 20;

/** The pitch of the bands in places: the span in whole places (58 254 at 18 tiles), so that a planet's places are whole places of its own. */
export const planetPitch = (S: number): number => Math.round(PLANET_SPAN / S);

/** The band of a place: k for a planet of the nature (1 to `count`), 0 for the orbit and for what lies beyond the last planet. */
export function bandOfPlace(cx: number, S: number, count: number): number {
  if (!(count > 0) || !Number.isFinite(cx)) return 0;
  const k = Math.round(cx / planetPitch(S));
  return k >= 1 && k <= count ? k : 0;
}

/** The band of a tile (carpet space). */
export const bandOfTile = (x: number, S: number, count: number): number => bandOfPlace(Math.floor(x / S), S, count);

/** The first place of a planet's own (its local (0, 0)), in places: `planetLocal` subtracts it. */
export const planetPlace = (k: number, S: number): number => k * planetPitch(S);

/** A place of a planet in its own coordinates (as its generator sees it), from the world's. */
export const planetLocal = (cx: number, k: number, S: number): number => cx - planetPlace(k, S);

/** The seed of a planet's ground and relief: its own if the nature says it, else one of the world's seed and its band. */
export function planetSeed(worldSeed: number, k: number, p?: Pick<Planet, 'seed'>): number {
  return p?.seed !== undefined ? p.seed | 0 : hash32(worldSeed, 0x9e3779, k);
}

/** The nature of a band: the world's for the orbit; a planet's own sky, day and gravity over the world's breath. Never with the planets. */
export function natureOfBand(n: WorldNature, k: number): WorldNature {
  const { planets, ...world } = n;
  const p = k >= 1 ? planets?.[k - 1] : undefined;
  if (!p) return world;
  return { ...DEFAULT_NATURE, geography: p.geography, ...(p.relief === 'true' ? { relief: 'true' as const } : {}), sky: p.sky, day: p.day, gravity: p.gravity, oxygen: world.oxygen };
}

/** What the orbit is called, in the language of the world: the destination of the voyage back to the stations. */
export const ORBIT_NAME: Readonly<Record<string, string>> = { it: 'l’orbita', en: 'the orbit', fr: 'l’orbite', es: 'la órbita' };

// No `th` («Thth», «Anth»: no word of the world) nor `ka` («Kaka», and with `zan` a «kaz…»): what is left is filtered (T462).
const SYLLABLES = ['sol', 'ri', 'to', 'ne', 'su', 'mar', 'vel', 'do', 'li', 'an', 'or', 'te', 'zan', 'pe', 'ru', 'is', 'lo', 'ga', 'mi', 'na'];

/** How many seeds a name is coined from before the fallback: the filter and the repeats turn down fewer than one in ten. */
const NAME_TRIES = 64;

/** Two or three syllables from a seed, as they come; `undefined` when one comes twice in a row («Gaga», «Velvel»: a child's word). */
function syllables(seed: number): string | undefined {
  const n = 2 + (hash32(seed, 17) % 2);
  let s = '';
  let last = -1;
  for (let i = 0; i < n; i++) {
    const at = hash32(seed, 31, i) % SYLLABLES.length;
    if (at === last) return undefined;
    s += SYLLABLES[(last = at)];
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The name of a planet nobody named (a function of its seed): two or three syllables, as a word of the world and never a number. A name that
 * says or sounds like a word that offends (`cleanCoined`, T462), or says a syllable twice in a row, is coined again from the next seed;
 * after `NAME_TRIES` seeds, Velmar.
 */
export function planetName(seed: number): string {
  for (let a = 0; a < NAME_TRIES; a++) {
    const name = syllables((seed + a) | 0);
    if (name && cleanCoined(name)) return name;
  }
  return 'Velmar';
}

/** Where a voyage can go: the orbit (band 0) and every planet, with its name. */
export interface Destination {
  band: number;
  name: string;
}

export function destinations(n: WorldNature, worldSeed: number, language = 'it'): Destination[] {
  const out: Destination[] = [{ band: 0, name: ORBIT_NAME[language] ?? ORBIT_NAME.it }];
  (n.planets ?? []).forEach((p, i) => out.push({ band: i + 1, name: p.name || planetName(planetSeed(worldSeed, i + 1, p)) }));
  return out;
}

// --- The spaceport of a planet -------------------------------------------------------------------------------------------------------

/**
 * The pad of a planet's spaceport, in its own tiles: a capsule (2,5 × 4) inside its first place, its bow north, the hatch at the stern on the
 * tile (1, 4). The kernel keeps its tiles walked and clear (`padTiles`, the apron of the layout) and docks a capsule there when its place
 * comes, as at every landing of the void (rule 10: from a planet one goes back only by capsule).
 */
export const PAD = { x: 1.25, y: 2, heading: Math.PI, land: [1, 4] as const };

/** The landing of a planet (band k ≥ 1): its pad as a `Dock` (carpet space), `planet:<k>` its land. */
export function planetDock(k: number, S: number): Dock {
  const x0 = planetPlace(k, S) * S;
  return { island: `planet:${k}`, x: x0 + PAD.x, y: PAD.y, heading: PAD.heading, land: [x0 + PAD.land[0], PAD.land[1]] };
}

/** The tiles of a planet's pad (carpet space): under the capsule and the land at its hatch, inside the planet's first place. */
export function padTiles(k: number, S: number): Array<[number, number]> {
  const x0 = planetPlace(k, S) * S;
  const out: Array<[number, number]> = [];
  for (let y = 0; y <= PAD.land[1]; y++) for (let x = 0; x <= 2; x++) out.push([x0 + x, y]);
  return out;
}

// --- The voyage ----------------------------------------------------------------------------------------------------------------------

/** How long a voyage lasts (seconds of the world): long enough to see the body left and the one reached; the jump halfway. */
export const TRAVEL_SECONDS = 16;
export const TRAVEL_JUMP = 0.5;

/**
 * A voyage under way, on the vehicle's state (written only by the kernel): from which band to which, how long it has gone and lasts, whether
 * the vehicle has already been moved to the landing of the destination (halfway: before, its places are still those it left).
 */
export interface Transit {
  from: number;
  to: number;
  t: number;
  total: number;
  jumped?: boolean;
}

/** A voyage as read (rule 7): whole bands within the nature's, a time within its length; anything else is no voyage. */
export function saneTransit(raw: unknown, count: number): Transit | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const band = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= count;
  if (!band(r.from) || !band(r.to) || r.from === r.to) return undefined;
  const total = typeof r.total === 'number' && Number.isFinite(r.total) ? Math.min(120, Math.max(1, r.total)) : TRAVEL_SECONDS;
  const t = typeof r.t === 'number' && Number.isFinite(r.t) ? Math.min(total, Math.max(0, r.t)) : 0;
  return { from: r.from as number, to: r.to as number, t, total, ...(r.jumped === true ? { jumped: true } : {}) };
}

/** How high over its body a vehicle starts to be seen leaving, or ends to be seen coming: tiles, for a planet's globe and for the orbit. */
export const GLOBE_TOP = 6;
export const ORBIT_TOP = 360;

/**
 * Where a voyage is, as the renderer shows it: the body seen (the band left in the first half, the one reached in the second), how high
 * over its landing the vehicle is (tiles), whether it is leaving. Altitude from 0 to `top` in the first half and back to 0 in the second, as
 * an exponential (the same share of the distance each second: the globe grows evenly), ending on the ground.
 */
export function transitView(tr: Transit, top: (band: number) => number): { band: number; altitude: number; leaving: boolean; u: number } {
  const u = Math.min(1, Math.max(0, tr.t / tr.total));
  const leaving = u < TRAVEL_JUMP;
  const s = leaving ? 1 - u / TRAVEL_JUMP : (u - TRAVEL_JUMP) / (1 - TRAVEL_JUMP);
  const band = leaving ? tr.from : tr.to;
  return { band, altitude: altitudeAt(s, top(band)), leaving, u };
}

/** The altitude at a share s (0 high, 1 landed) of a descent from `top`: exponential to half a tile, then down to the ground. */
export function altitudeAt(s: number, top: number): number {
  const low = 0.5;
  const c = Math.min(1, Math.max(0, s));
  return Math.max(0, top * Math.pow(low / top, c) - low * c);
}

// --- The levels of detail of a planet ------------------------------------------------------------------------------------------------

/**
 * The radius of a planet's globe, tiles: its band wrapped round it, the equator as long as the span, so that the map of the globe around the
 * landing (azimuthal, equidistant: true near the landing) reaches the edge of the band at the antipode.
 */
export const GLOBE_RADIUS = PLANET_SPAN / (2 * Math.PI);

/** Cells along a side of a level; levels from the whole planet (a cell of 2^15 tiles) to the tile. */
export const LOD_CELLS = 32;
export const LOD_LEVELS = 16;

/** The side of a cell of a level, tiles: 32 768 at the level 0, the tile at the last. */
export const lodCell = (L: number): number => 2 ** (LOD_LEVELS - 1 - L);

/**
 * The point a cell of a level samples, as an offset in tiles from the planet's centre (its first tile): the middle of the cell, the cells of
 * every level centred on the planet's centre, so that the last level has a cell per tile and its tiles are the draft's.
 */
export function lodPoint(L: number, i: number, j: number): [number, number] {
  const c = lodCell(L);
  return [(i - LOD_CELLS / 2 + 0.5) * c, (j - LOD_CELLS / 2 + 0.5) * c];
}

/** Whether a cell of a level lies on the globe (within the antipode, where the map ends). */
export function onGlobe(L: number, i: number, j: number): boolean {
  const c = lodCell(L);
  const u = (i - LOD_CELLS / 2) * c, v = (j - LOD_CELLS / 2) * c;
  const far = Math.max(Math.hypot(u, v), Math.hypot(u + c, v), Math.hypot(u, v + c), Math.hypot(u + c, v + c));
  return far < Math.PI * GLOBE_RADIUS * 0.985;
}

/**
 * A point of the map around the planet's centre (tiles east, south) at a height h, on the globe: relative to the ground at the centre, y up.
 * Near the centre it is the flat map (x = u, z = v, y = h), so the last levels meet the true places; far, the globe curves away.
 */
export function globePoint(u: number, v: number, h: number, R = GLOBE_RADIUS): [number, number, number] {
  const rho = Math.hypot(u, v);
  if (rho < 1e-9) return [0, h, 0];
  const th = rho / R;
  const s = (R + h) * Math.sin(th);
  return [(s * u) / rho, (R + h) * Math.cos(th) - R, (s * v) / rho];
}

/**
 * How high a cell of a level stands over the sea (tiles): what grows there in a share of its side (water at 0, ground, then vegetation and
 * rock higher), so that from afar the globe is voxels too; and near, where a cell is a few tiles, the planet's relief.
 */
export function cellHeight(def: Pick<TerrainDef, 'layer' | 'solid'> | undefined, cell: number, relief = 0): number {
  const layer = def?.layer ?? 'ground';
  const rank = layer === 'liquid' ? 0 : layer === 'vegetation' ? 2 : layer === 'rock' || layer === 'wall' ? 3 : 1;
  return rank * Math.min(cell * 0.12, 0.25 + cell * 0.04) + (cell <= 256 ? relief : 0);
}

/**
 * The level a viewer wants at a distance (tiles) with a pixel of `pixel` radians: the one whose cells look about `PX` pixels wide there, as a
 * fraction (its part over the whole is how far the next finer one has faded in). Clamped to the levels.
 */
export const LOD_PX = 9;
export function lodWanted(distance: number, pixel: number): number {
  const want = Math.max(1e-6, distance * pixel * LOD_PX);
  return Math.min(LOD_LEVELS - 1, Math.max(0, LOD_LEVELS - 1 - Math.log2(want)));
}

/** The cache's version of the levels: a level computed by another rule is not read. */
export const LOD_VERSION = 1;

/**
 * The levels of detail of a planet, filled a few cells at a time (they are computed once and kept: `codes` is what the cache saves): the
 * terrain code of every cell of every level, from the coarsest, which the voyage needs first, to the tile. `sample(x, y)` is the generator
 * at a tile of the planet (its own coordinates).
 */
export class PlanetLod {
  readonly codes: Array<string | undefined> = new Array(LOD_LEVELS).fill(undefined);
  private level = 0;
  private cell = 0;
  private part = '';

  constructor(saved?: ReadonlyArray<string | null | undefined>) {
    if (!saved) return;
    for (let L = 0; L < LOD_LEVELS; L++) {
      const s = saved[L];
      if (typeof s === 'string' && [...s].length === LOD_CELLS * LOD_CELLS) this.codes[L] = s;
      else break;
    }
    this.level = this.codes.findIndex((c) => c === undefined);
    if (this.level < 0) this.level = LOD_LEVELS;
  }

  /** How many levels are ready, from the coarsest. */
  get ready(): number {
    return this.level;
  }

  get done(): boolean {
    return this.level >= LOD_LEVELS;
  }

  /** Fills cells while `more()` says so; returns how many it sampled. A cell off the globe is the sea's `?`, never sampled. */
  fill(sample: (x: number, y: number) => string, more: () => boolean): number {
    let n = 0;
    while (this.level < LOD_LEVELS && more()) {
      const i = this.cell % LOD_CELLS, j = Math.floor(this.cell / LOD_CELLS);
      let code = '?';
      if (onGlobe(this.level, i, j)) {
        const [x, y] = lodPoint(this.level, i, j);
        const got = sample(Math.floor(x), Math.floor(y));
        code = typeof got === 'string' && [...got].length === 1 ? got : '?';
        n++;
      }
      this.part += code;
      if (++this.cell === LOD_CELLS * LOD_CELLS) {
        this.codes[this.level++] = this.part;
        this.part = '';
        this.cell = 0;
      }
    }
    return n;
  }
}


/** The words of the voyage in the world (the menu of the controls, what those aboard hear), as `VEHICLE_WORDS`. */
export const TRAVEL_WORDS = {
  course: (to: string) => `Rotta per ${to}`,
  under: (to: string) => `In viaggio verso ${to}`,
  left: (to: string) => `I motori si accendono: rotta per ${to}.`,
  arrived: (to: string) => `Siete arrivati: ${to}.`,
  busy: 'L’approdo è occupato.',
  still: 'Siete in viaggio: fuori non c’è niente.',
  helm: 'Devi tenere i comandi.',
};
