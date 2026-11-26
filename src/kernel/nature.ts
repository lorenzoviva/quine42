// The nature of a world and the primitives of its physics (T437, ADR-0224). How a body crosses a tile, at what pace, how much it tires,
// how deep the water is, whether there is air; what the world is made of (its geography, its sky, its day, its gravity, whether one
// breathes): data, never constants of the kernel, read through these functions and always within the kernel's limits (rule 7).
// Who writes them: the Physicist, for the terrains (at the Genesis, `genesis.physics`; after it only by the kernel's hand); the kernel, for
// the nature, from the theme chosen at the Genesis, fixed after it as the game is (ADR-0053). Lua reads them (`world.nature()`), never
// writes them. A value this kernel cannot make true is not accepted: it is the world of today (ADR-0221, «what the kernel cannot do is
// not asked»); each task that makes one true opens it here.

import { cleanText } from './cleantext';
import { repairAutomata, type AutomatonSpec } from './automata';
import type { TerrainDef } from './types';

// --- The terrain: how a body crosses a tile ------------------------------------------------------------------------------------------

/** How a body crosses a tile: on foot, swimming, or not at all. `solid` is what is not walked (`cross` is not `walk`). */
export const CROSSINGS = ['walk', 'swim', 'none'] as const;
export type Crossing = (typeof CROSSINGS)[number];

/**
 * How deep the water of a tile one swims is: what a hull floats on (T439), whether one too loaded may enter it (T438). A reef (T443,
 * ADR-0230) is rock just under the surface: a body swims over it, no hull floats on it (a vessel stops there, whatever its draught).
 */
export const DEPTHS = ['shallow', 'deep', 'reef'] as const;
export type WaterDepth = (typeof DEPTHS)[number];

/**
 * The kernel's limits of a terrain's physics: whatever the Physicist says, the terrain stays inside them. The pace is a multiplier of the
 * body's (6 tiles a second): on foot the range of the Genesis since ADR-0011, swimming never faster than a slow walk. The fatigue is how
 * many times the energy a second in the water costs, against walking (only a tile one swims has it, in the contract 0.10).
 */
export const TERRAIN_LIMITS = {
  walkPace: [0.3, 1.5],
  swimPace: [0.2, 0.6],
  fatigue: [1, 6],
} as const;

/** The pace and the fatigue of the water nobody has said them of (T432, `docs/design/acqua-spazio.md` § 1.1). */
export const SWIM_PACE = 0.4;
export const SWIM_FATIGUE = 3;

/**
 * The water codes of every palette (`BASE_CODES` w and o) and their depth: swum in every universe from the contract 0.10 (ADR-0224), the
 * meaning of a base code the Cartographer and the Physicist do not change, as `solid` was before.
 */
export const WATER_CODES: Readonly<Record<string, WaterDepth>> = { w: 'shallow', o: 'deep' };

/** A terrain's physics as the kernel reads it. */
export interface TerrainPhysics {
  cross: Crossing;
  /** The pace on the tile, within the range of its crossing (1 where nothing is crossed). */
  pace: number;
  /** The fatigue swimming (1 where one does not swim). */
  fatigue: number;
  /** Only where one swims: how deep the water is (deep if not said). */
  depth?: WaterDepth;
  /** Whether a body breathes on the tile (true if not said; the void never): read where the world counts the breath (T446, `air.ts`). */
  air: boolean;
}

const isCrossing = (v: unknown): v is Crossing => typeof v === 'string' && (CROSSINGS as readonly string[]).includes(v);
const isDepth = (v: unknown): v is WaterDepth => typeof v === 'string' && (DEPTHS as readonly string[]).includes(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const within = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

/**
 * How a body crosses a tile of this terrain. `solid` says, as it always has, whether it is walked; `cross` says how a tile not walked is
 * crossed: swum, if it is a liquid that says so, and otherwise not at all. Whatever else a terrain says, it is one of the three.
 */
export function crossingOf(t: Pick<TerrainDef, 'solid' | 'cross' | 'layer'> | undefined): Crossing {
  if (!t || t.layer === 'void') return 'none';
  if (t.solid === false) return 'walk';
  return t.cross === 'swim' && t.layer === 'liquid' ? 'swim' : 'none';
}

/** The physics of a terrain, within the kernel's limits: a number that is not one, or out of range, is the nearest it may be (rule 7). */
export function terrainPhysics(t: TerrainDef | undefined): TerrainPhysics {
  const cross = crossingOf(t);
  const air = t?.air !== false && t?.layer !== 'void';
  if (cross === 'none') return { cross, pace: 1, fatigue: 1, air };
  if (cross === 'walk') return { cross, pace: within(finite(t?.speed) ? t!.speed! : 1, TERRAIN_LIMITS.walkPace), fatigue: 1, air };
  return {
    cross,
    pace: within(finite(t?.speed) ? t!.speed! : SWIM_PACE, TERRAIN_LIMITS.swimPace),
    fatigue: within(finite(t?.fatigue) ? t!.fatigue! : SWIM_FATIGUE, TERRAIN_LIMITS.fatigue),
    depth: isDepth(t?.depth) ? t!.depth : 'deep',
    air,
  };
}

/**
 * What the validator refuses of a terrain's physics as a manifest writes it (the Council's, or a universe's by hand): a crossing that is not
 * one of the three or that says the opposite of `solid`, swimming in what is not a liquid, a depth or a fatigue where one does not swim or
 * outside the limits, the pace of the water outside its range, an `air` that is not true or false. A terrain without `cross` is of before.
 */
export function terrainPhysicsErrors(code: string, t: Record<string, unknown>): string[] {
  const out: string[] = [];
  const err = (s: string) => out.push(`tile "${code}": ${s}`);
  if (t.cross !== undefined) {
    if (!isCrossing(t.cross)) err(`cross deve essere uno tra ${CROSSINGS.join(', ')}`);
    else if ((t.cross === 'walk') !== (t.solid === false)) err(`cross "${t.cross}" e solid ${String(t.solid)} si contraddicono (solid è ciò che non si cammina)`);
    else if (t.cross === 'swim' && t.layer !== 'liquid') err('si nuota solo un liquido (layer liquid)');
  }
  const swum = t.cross === 'swim';
  if (t.depth !== undefined && (!swum || !isDepth(t.depth))) err(`depth (${DEPTHS.join(', ')}) solo dove si nuota`);
  if (t.fatigue !== undefined && (!swum || !finite(t.fatigue) || t.fatigue < TERRAIN_LIMITS.fatigue[0] || t.fatigue > TERRAIN_LIMITS.fatigue[1])) err(`fatigue (${TERRAIN_LIMITS.fatigue.join('-')}) solo dove si nuota`);
  if (swum && t.speed !== undefined && (!finite(t.speed) || t.speed < TERRAIN_LIMITS.swimPace[0] || t.speed > TERRAIN_LIMITS.swimPace[1])) err(`a nuoto speed sta tra ${TERRAIN_LIMITS.swimPace.join(' e ')}`);
  if (t.air !== undefined && typeof t.air !== 'boolean') err('air deve essere true o false');
  return out;
}

/** What the Physicist may say of a terrain (`genesis.physics`), as read: nothing of it is trusted. */
export interface PhysicsSaid {
  cross?: unknown;
  speed?: unknown;
  fatigue?: unknown;
  depth?: unknown;
}

/**
 * The physics of a terrain of a new palette, as the kernel writes it (`toPalette`): what the layer fixes (walls, trees and rocks are not
 * crossed; floors and doors are walked), the meaning of a base code (`fixed`: the water codes are swum), and otherwise what the Physicist
 * said within the layer (ground walked or not, a liquid swum or not; a liquid nobody said of is not crossed, as before 0.10, so lava
 * stays lava); the pace, the fatigue and the depth within the limits of the crossing. `cross` is written on every terrain: a palette of
 * the contract 0.10 says it all.
 */
export function physicsOf(layer: TerrainDef['layer'], said: PhysicsSaid & { solid?: unknown }, fixed?: Crossing, fixedDepth?: WaterDepth): Pick<TerrainDef, 'solid' | 'cross' | 'speed' | 'fatigue' | 'depth'> {
  const cross: Crossing =
    fixed ??
    (layer === 'wall' || layer === 'vegetation' || layer === 'rock'
      ? 'none'
      : layer === 'floor' || layer === 'door'
        ? 'walk'
        : layer === 'liquid'
          ? said.cross === 'swim'
            ? 'swim'
            : 'none'
          : said.cross === 'none' || (said.cross === undefined && said.solid === true)
            ? 'none'
            : 'walk');
  const speed = finite(said.speed) ? said.speed : undefined;
  if (cross === 'none') return { solid: true, cross, speed: within(speed ?? 1, TERRAIN_LIMITS.walkPace) };
  if (cross === 'walk') return { solid: false, cross, speed: within(speed ?? 1, TERRAIN_LIMITS.walkPace) };
  // A pace outside the swimming range was said of walking (the Cartographer's 1 for the water it drew): the water's own, then.
  const [lo, hi] = TERRAIN_LIMITS.swimPace;
  return {
    solid: true,
    cross,
    speed: speed !== undefined && speed >= lo && speed <= hi ? speed : SWIM_PACE,
    ...(finite(said.fatigue) ? { fatigue: within(said.fatigue, TERRAIN_LIMITS.fatigue) } : {}),
    depth: fixedDepth ?? (isDepth(said.depth) ? said.depth : 'deep'),
  };
}

// --- The void (T445, ADR-0233) -------------------------------------------------------------------------------------------------------

/**
 * The code of the void in a palette: the kernel's, never the Cartographer's (the Genesis refuses it, a manifest cannot say the layer
 * `void`). Only a world whose nature is the void has it (`voidTerrain`, added by the kernel to its palette); a world of today never does.
 */
export const VOID_CODE = '~';

/** The words of the void in the language of the world: no ground, the stars above and below. */
const VOID_WORDS: Readonly<Record<string, { name: string; description: string }>> = {
  it: { name: 'vuoto', description: 'nessun suolo: le stelle sopra e sotto' },
  en: { name: 'void', description: 'no ground: the stars above and below' },
  fr: { name: 'vide', description: 'aucun sol : les étoiles dessus et dessous' },
  es: { name: 'vacío', description: 'ningún suelo: las estrellas arriba y abajo' },
};

/**
 * The void as a terrain (T445, `docs/design/acqua-spazio.md` § 2.2): the absence of a floor. Not walked, not swum, not crossed by a jump,
 * never carved by the layout nor a gate, nothing set on it, no air; the renderer draws no ground there (the stars show through) and the
 * edge of the land beside it is a slab with its thickness. Its physics is fixed: no Physicist and no Lua write it.
 */
export function voidTerrain(language = 'it'): TerrainDef {
  const w = VOID_WORDS[language] ?? VOID_WORDS.it;
  return { id: 'void', name: w.name, description: w.description, color: '#05060c', solid: true, cross: 'none', layer: 'void', air: false };
}

/** Whether a terrain is the void (the kernel's, `layer: 'void'`). */
export const isVoid = (t: Pick<TerrainDef, 'layer'> | undefined): boolean => t?.layer === 'void';

// --- The nature of the world ---------------------------------------------------------------------------------------------------------

/** What the draft makes of the world: land with its seas today; an archipelago (T441), the void with its stations (T445). */
export type Geography = 'continent' | 'archipelago' | 'void';
/** How the ground rises (T475, ADR-0256): today's rolling hills (`hills`, omitted) or true relief from `generate_relief` (`true`). */
export const RELIEF_KINDS = ['hills', 'true'] as const;
export type ReliefKind = (typeof RELIEF_KINDS)[number];
/** The sky over it: the earth's, with its day and its night; the stars (T445). */
export type Sky = 'earth' | 'stars';

/**
 * The climates of the draft (T510, ADR-0261): the large-scale biomes the generator draws from its temperature and humidity (`world.terrain`):
 * the temperate land (grass and woods), the desert, the jungle, the frozen land (snow and the snow on the cold peaks). A world admits some of
 * them, by its theme or its planet: the Far West has no snow, the islands of the pirates no frost, an ice planet nothing but.
 */
export const CLIMATES = ['temperate', 'desert', 'jungle', 'frozen'] as const;
export type Climate = (typeof CLIMATES)[number];

/**
 * The codes of the draft that only a climate draws (T510): the snow `n` of the frozen land, the jungle `j` of the hot and wet one, and
 * what the kernel makes of them where the world does not admit the climate (its floor, whatever the generator says): the base ground and
 * the trees. The sand of the desert is also the sand of the shore, and every world has shores: it is no code of the desert alone.
 */
export const CLIMATE_CODES: Readonly<Partial<Record<Climate, { code: string; instead: string }>>> = {
  frozen: { code: 'n', instead: 'g' },
  jungle: { code: 'j', instead: 't' },
};

/** The climates a nature admits: all of them where it says none (the world of today). */
export const climatesOf = (n: Pick<WorldNature, 'climates'> | undefined): readonly Climate[] => n?.climates ?? CLIMATES;

/** The codes of the draft a nature does not admit, each with what it becomes (T510): none in the world of today. */
export function offClimate(n: Pick<WorldNature, 'climates'> | undefined): Map<string, string> {
  const admitted = climatesOf(n);
  const out = new Map<string, string>();
  for (const c of CLIMATES) {
    const k = CLIMATE_CODES[c];
    if (k && !admitted.includes(c)) out.set(k.code, k.instead);
  }
  return out;
}

/**
 * The climates said, as the kernel keeps them (T510): known ones, once each, in the order of `CLIMATES`, at least one; all of them, or
 * none that is known, are no restriction (undefined, the world of today).
 */
export function repairClimates(raw: unknown): Climate[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const said = CLIMATES.filter((c) => raw.includes(c));
  return said.length && said.length < CLIMATES.length ? said : undefined;
}

/** Whether a world (or a planet) uses the true relief of its generator (T475, ADR-0256). */
export const hasTrueRelief = (n: Pick<WorldNature, 'relief'> | undefined): boolean => n?.relief === 'true';

/**
 * The nature of a world (`universe.json → nature`): chosen at the Genesis with its theme and never changed after, written by the kernel,
 * repaired by `repairNature`; the Council does not write it (universe.json is not among what it may write, ADR-0109). A universe without
 * it is the world of today, so the defaults never change. It is public, as the rest of universe.json but `ai` (`playerFiles`).
 */
export interface WorldNature {
  /**
   * The planets of a world of the void (T449, ADR-0236): each one a far band of the same plane (`src/kernel/planets.ts`), the void with its
   * stations and asteroids the band 0, the orbit. Only a world of the void has them; none, the world of today.
   */
  planets?: Planet[];
  /**
   * Cellular automata declared for this world (T482, ADR-0254): physical (`flow`, `wind`, `diffuse`) and discrete (`table`, `rules`) fields
   * on the loaded window, written by the Physicist within the fixed load budget. Omitted when empty: worlds of before stay untouched.
   */
  automata?: AutomatonSpec[];
  /**
   * The relief of the world (T475, ADR-0256): `'true'` when the generator provides massifs, terraces, cliffs and basins (`generate_relief`)
   * and `k` is walkable mountain rock; omitted (`'hills'`) for the rolling hills of today. Fixed at the Genesis like the geography.
   */
  relief?: ReliefKind;
  /**
   * The climates its draft has (T510, ADR-0261): those of its theme, fixed at the Genesis like the geography; omitted, all of them (the
   * world of today). A universe of before that does not say them takes its theme's (`themeClimates`, `readConfig`), without a call.
   */
  climates?: Climate[];
  geography: Geography;
  sky: Sky;
  /**
   * Seconds of a day of the world (600, `Kernel.DAY_SECONDS`), within `NATURE_ACCEPTS.day`; 0 a light that never changes (T445: the lamps
   * of a station, a sun standing still over an asteroid). It enters the routines and the days of the world (`clockDay`): under a still
   * light the clock keeps the earth's day, and the shifts go on.
   */
  day: number;
  /** The weight of a body against the earth's (1): the jump scales with it (T447). */
  gravity: number;
  /**
   * Whether a body counts its breath (T446, ADR-0238): the need `oxygen`, drained where there is no air (`air.ts`); false, the air is
   * everywhere and no body has the need.
   */
  oxygen: boolean;
}

export const DEFAULT_NATURE: Readonly<WorldNature> = Object.freeze({ geography: 'continent', sky: 'earth', day: 600, gravity: 1, oxygen: false });

/**
 * What this kernel accepts of each field of the nature: what it can make true. A value outside is the default (the world of today). The
 * task that makes a value true widens its list here (ADR-0224 § the nature: `archipelago` open since T441, ADR-0229; `void`, `stars` and
 * the day since T445, ADR-0233: a day of 2 minutes to an hour, or 0, the light that never changes; the oxygen since T446, ADR-0238; the gravity 0.2-2 since T447; `relief` since T475, ADR-0256).
 */
export const NATURE_ACCEPTS: { geography: readonly Geography[]; relief: readonly ReliefKind[]; sky: readonly Sky[]; day: readonly [number, number]; gravity: readonly [number, number]; oxygen: readonly boolean[] } = {
  geography: ['continent', 'archipelago', 'void'],
  relief: RELIEF_KINDS,
  sky: ['earth', 'stars'],
  day: [120, 3600],
  gravity: [0.2, 2],
  oxygen: [false, true],
};

/** The day of a still light (`nature.day` 0, T445): accepted besides the range of `NATURE_ACCEPTS.day`. */
export const STILL_DAY = 0;

/** The nature of universe.json (or of a theme), whatever it says: each field within what this kernel accepts, the rest the world of today. */
export function repairNature(raw: unknown): WorldNature {
  const r = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const one = <T>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);
  const num = (v: unknown, range: readonly [number, number], d: number): number => (finite(v) && v >= range[0] && v <= range[1] ? v : d);
  const geography = one(r.geography, NATURE_ACCEPTS.geography, DEFAULT_NATURE.geography);
  const relief = one(r.relief, NATURE_ACCEPTS.relief, 'hills');
  // The planets only around the void (T449): the orbit is the band 0, and a world of today has no far bands.
  const planets = geography === 'void' ? repairPlanets(r.planets) : [];
  const automata = repairAutomata(r.automata);
  const climates = repairClimates(r.climates);
  return {
    ...(planets.length ? { planets } : {}),
    ...(automata.length ? { automata } : {}),
    ...(relief === 'true' ? { relief } : {}),
    ...(climates ? { climates } : {}),
    geography,
    sky: one(r.sky, NATURE_ACCEPTS.sky, DEFAULT_NATURE.sky),
    day: r.day === STILL_DAY ? STILL_DAY : num(r.day, NATURE_ACCEPTS.day, DEFAULT_NATURE.day),
    gravity: num(r.gravity, NATURE_ACCEPTS.gravity, DEFAULT_NATURE.gravity),
    oxygen: one(r.oxygen, NATURE_ACCEPTS.oxygen, DEFAULT_NATURE.oxygen),
  };
}

// --- The planets (T449, ADR-0236) ----------------------------------------------------------------------------------------------------

/**
 * A planet of a world of the void (`nature.planets[k - 1]` is the band k, `src/kernel/planets.ts`): its name in the world, the seed of its
 * ground and of its relief (the world's and its band's if not said), what its draft is made of (the generator's land with its seas: the
 * archipelago and the void are not open on a planet yet), its relief (`'true'` for `generate_relief`, omitted for hills, T475), its sky, its day, its gravity, and where its sea lies (levels of its relief over its
 * lowest, as `universe.json → relief.sea`; the one its relief gives if not said). Fixed at the Genesis as the rest of the nature.
 */
export interface Planet {
  name?: string;
  seed?: number;
  geography: 'continent';
  relief?: ReliefKind;
  /** The climates of its draft (T510): an ice planet only `frozen`; omitted, all of them. */
  climates?: Climate[];
  sky: Sky;
  day: number;
  gravity: number;
  sea?: number;
}

/** How many planets a world has at most (T449): eight far bands, 2^23 tiles, well within what `hash32` takes. */
export const MAX_PLANETS = 8;
/** What this kernel accepts of a planet: its land and seas (the generator's), a sea within the relief's levels, a name of a line. */
export const PLANET_ACCEPTS = { geography: ['continent'] as const, sea: [0, 24] as const, name: 40 };

/** The planets of a nature, whatever it says: at most `MAX_PLANETS`, each within what the kernel accepts; what is not an object is no planet. */
export function repairPlanets(raw: unknown): Planet[] {
  if (!Array.isArray(raw)) return [];
  const out: Planet[] = [];
  for (const p of raw.slice(0, MAX_PLANETS)) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) continue;
    const r = p as Record<string, unknown>;
    // A planet is a world with air under its own sky: its own nature within the same limits as the world's.
    const n = repairNature({ geography: 'continent', relief: r.relief, climates: r.climates, sky: r.sky ?? 'earth', day: r.day, gravity: r.gravity });
    const said = typeof r.name === 'string' ? cleanText(r.name, PLANET_ACCEPTS.name, 'il nome') : undefined;
    const name = said && 'text' in said ? said.text : '';
    const seed = typeof r.seed === 'number' && Number.isSafeInteger(r.seed) ? r.seed : undefined;
    const sea = finite(r.sea) && r.sea >= PLANET_ACCEPTS.sea[0] && r.sea <= PLANET_ACCEPTS.sea[1] ? Math.round(r.sea) : undefined;
    out.push({ ...(name ? { name } : {}), ...(seed !== undefined ? { seed } : {}), geography: 'continent', ...(n.relief === 'true' ? { relief: 'true' as const } : {}), ...(n.climates ? { climates: n.climates } : {}), sky: n.sky, day: n.day, gravity: n.gravity, ...(sea !== undefined ? { sea } : {}) });
  }
  return out;
}

/**
 * The seconds of a day of the world for its clock (T445): the routines, the shifts, what ripens, the days of a plan (`Kernel.day`). The
 * nature's day; under a still light (0) the earth's (600), so that the people of a station still sleep and work.
 */
export function clockDay(nature: Pick<WorldNature, 'day'> | undefined): number {
  const d = nature?.day;
  const [lo, hi] = NATURE_ACCEPTS.day;
  return finite(d) && d >= lo && d <= hi ? d : DEFAULT_NATURE.day;
}

/** Whether the light of a world never changes (`nature.day` 0, T445): the light of full day, always. */
export const stillLight = (nature: Pick<WorldNature, 'day'> | undefined): boolean => nature?.day === STILL_DAY;

/** Whether two natures are the same world. */
export const sameNature = (a: WorldNature, b: WorldNature): boolean =>
  (Object.keys(DEFAULT_NATURE) as Array<keyof WorldNature>).every((k) => a[k] === b[k]) &&
  (a.relief ?? 'hills') === (b.relief ?? 'hills') &&
  climatesOf(a).join() === climatesOf(b).join() &&
  JSON.stringify(a.planets ?? []) === JSON.stringify(b.planets ?? []) &&
  JSON.stringify(a.automata ?? []) === JSON.stringify(b.automata ?? []);

// --- The gravity: how a body leaps and walks (T447, ADR-0226) ------------------------------------------------------------------------

/** The gravity a nature says, as the kernel uses it: within the range this kernel accepts, 1 (the earth's) otherwise (rule 7). */
export function gravityOf(nature: Pick<WorldNature, 'gravity'> | undefined): number {
  const g = nature?.gravity;
  const [lo, hi] = NATURE_ACCEPTS.gravity;
  return finite(g) && g >= lo && g <= hi ? g : 1;
}

/**
 * How a jump changes under a gravity, against the earth's (`docs/design/acqua-spazio.md` § 2.5): the same push, so how high and how far
 * it goes scale with 1/g, and so does the time of its arc. Never shorter nor lower than on the earth (`reach` at least 1): the kernel
 * checks what is reachable with the earth's jump (`reachableStoreys`, rule 10), and what it guarantees stays so under a heavy gravity,
 * which shows in a quicker, flatter arc and a heavier gait.
 */
export function leapOf(gravity: number): { reach: number; time: number } {
  const g = finite(gravity) && gravity > 0 ? gravity : 1;
  return { reach: 1 / Math.min(1, g), time: 1 / g };
}

/**
 * How the gait changes under a gravity: barely (`docs/design/acqua-spazio.md` § 2.5). A body made for the earth walks a little slower
 * away from it, light (it bounces, its feet grip less) or heavy (it drags): 1 on the earth, 0.9 at the ends of the range (0.2 and 5).
 */
export function gaitOf(gravity: number): number {
  const g = finite(gravity) && gravity > 0 ? gravity : 1;
  return 1 - 0.1 * Math.min(1, Math.abs(Math.log(g)) / Math.log(5));
}
