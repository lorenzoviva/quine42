// Chunks. The Cartographer no longer draws grids (models cannot count cells): it chooses the
// environment (a MarkovJunior layout program), names the place and says what lives there, inside or
// outside lots. The kernel runs the program, guarantees paths and places entities.
// At genesis the Cartographer writes the layout programs themselves.

import type { Schema } from '../ai/models';
import type { CardStamp } from '../cards';
import type { EnvironmentDef, ChunkInfo, TerrainDef } from '../types';
import type { MjNode } from '../mj';
import { sizeOf, type SizeTier } from '../../mj/classes';
import { internalName, internalValues } from '../internalNames';
import { paletteSummary, type CatalogEntry, type Council } from './council';
import type { Geography } from '../nature';
import { REUSE_OFFERED, reuseLines } from '../reuse';
import type { Means, Roughness } from '../network';
import { readStreet } from '../streets';

/**
 * What the Cartographer is told at the Genesis of an archipelago (T443, ADR-0230): the shores are most of its places, so among its environments
 * those of the coast, with the stamp of the harbour where a ship moors.
 */
export const ARCHIPELAGO_ENVIRONMENTS =
  'This world is an archipelago in the open sea: most places stand on a shore. Among the environments, those of its coasts: a harbour (the stamp "harbour": a pier from the shore out to where the water is deep, where a ship moors, with reefs off it; houses and stores around it), a lighthouse on a cape (a "tower"), a shipyard, a beach with wrecks, a coast of reefs (a terrain of reef: rock just under the water, swum over, where a ship runs aground).';

/** What the Cartographer is told of a place on a shore (T443): the harbour only where the place has the sea. */
export const SHORE_LINE =
  'On a shore: a harbour (an environment with the stamp "harbour") puts a pier where the water is deep enough for a ship; choose it only where this place has the sea and few places around have a harbour; lighthouses, shipyards, wrecks and reefs belong to the shores too.';

/**
 * Where a thing of a plan stands (T310b, `dove-piano`): inside the lots, outside them, anywhere; `under` (T417, ADR-0091 point 4) in the cellar
 * of a structure the plan asks with one, on its floors under the ground reached from the door; without a cellar, inside; `enclave` (T474,
 * ADR-0250) in a part of the place only a cliff parts from its paths (a ledge, a mesa), where the roughness keeps one; without, anywhere;
 * `underwater` (T480, ADR-0259) on the seabed under swimmable water in a true-relief world (sunken chests, anchors, ruins, reefs); without, outside.
 */
export type Where = 'inside' | 'outside' | 'anywhere' | 'under' | 'enclave' | 'underwater';

export interface PlacedObject {
  module: string;
  where: Where;
  /** The individual the master declared whom this character is (T376): written by the kernel, never by the Cartographer. */
  individual?: string;
}

/** The water of a tile that has flowed (T51b): its bed, its water (levels), the tile it was before it became water. */
export type WaterRecord = [number, number] | [number, number, string];

/** A house a venture builds on free ground (T245e): in the plan of its place, so whoever draws the place (a client too) has it. */
export interface PlannedHouse {
  origin: string;
  x: number;
  y: number;
  model: string;
  seed: number;
  yaw: number;
  class: string;
  concept: string;
  stage: number;
}

export interface ChunkPlan {
  place: ChunkInfo;
  /** Layout (environment) id. */
  layout: string;
  objects: PlacedObject[];
  /** Names of items lying around. */
  ground: string[];
  /** Entities that do not exist yet: the Forge will create them; `takeable` (T292) if the Cartographer said whether a wanderer can carry it elsewhere. */
  fresh: Array<{ concept: string; where: Where; takeable?: boolean }>;
  /** Rune fragments (lines from the catalogue) to scatter. */
  runes: string[];
  /**
   * Structures the place has (ADR-0043): each becomes a whole model one enters, set on a lot of the
   * environment (the largest first); the Sculptor writes the ones that do not exist yet. Their size (ADR-0092)
   * is a size of D&D, fitted by the kernel to the lot and to the rarity of the two largest.
   */
  structures?: PlanStructure[];
  /** Tiles changed after the layout (by effects, spells, Lua): cell index → tile code. */
  edits?: Record<string, string>;
  /** The day of the world each edit was written (T245b, ADR-0140): what ripens counts from there. An edit without one is of today. */
  days?: Record<string, number>;
  /** The stage of the building of a lot that a venture is putting up again (T245e, ADR-0148): lot origin → 0..1. Absent: standing. */
  stages?: Record<string, number>;
  /** The houses the ventures build on free ground (T245e): where, which model and seed, and their stage. */
  houses?: PlannedHouse[];
  /** When it was last left (T245f, ADR-0149): seconds of the world, only while nobody sees it; at the return the kernel says how long. */
  seen?: number;
  /** The ground dug (negative) or raised after the layout (T51b): cell index → levels. */
  digs?: Record<string, number>;
  /** The water that has flowed (T51b, `water.ts`): cell index → its bed and its water (levels), and the tile it was before it became water. */
  water?: Record<string, WaterRecord>;
  /** Who planned the place and who paid for it (T36). */
  card?: CardStamp;
  /**
   * The block this place is part of (T370, ADR-0206): its top-left place, and its side in places and its lot in tiles when they are not
   * 2 and 25 (T404: 3 × 3 places and a lot of 50 for the author's fort at 10 voxels a tile). All its places carry it, written by the kernel
   * when a place's Gargantuan structure takes the lot; the plan of that place has the structure, the others are the kernel's own, planned
   * at once without a call. The lot's cells are reserved in the layout of each.
   */
  block?: { x: number; y: number; side?: number; lot?: number };
  /**
   * The voxels a tile of the structures its stamps cut their buildings for (T407, ADR-0211): 16 (`STRUCTURE_VPT`), written by the kernel
   * on every plan it makes, so a Large structure stands inside its lot; absent, a plan of before, whose stamps were cut at 20 and stay so
   * (its edits, its things and the forms of its lots are per tile).
   */
  vpt?: number;
  /**
   * The strata under its ground (T418, ADR-0091 point 5): `STRATA_DEPTH` rows of `S × S` codes of the generator's `strata`, the first row the
   * first tile under the ground; written by the kernel from the draft when the place is planned. Absent, a plan of before: the draft says them again.
   */
  strata?: string[];
  /**
   * How its strata are made (T478, ADR-0249): `STRATA_DEPTH` (6) for a new plan, its rows by its environment's program over the draft (or the
   * draft's, without one); absent in a plan of before, whose strata are the draft's 4 (`strataDepthOf`). Written only by the kernel.
   */
  strataDepth?: number;
  /**
   * The mark of the layout that swims (T438, ADR-0224): true, written by the kernel on every plan it makes, the water one swims joins the
   * place and is never dug; absent, a plan of before, whose layout keeps the paths it dug on the water (they are its bridges and piers).
   */
  swim?: boolean;
  /**
   * The mark of the climates (T510, ADR-0261): true, written by the kernel on every plan it makes, its draft has only the climates its world
   * (or its planet) admits; absent, a plan of before, laid again on the draft it was planned on, every climate of the generator.
   */
  climates?: boolean;
  /**
   * The mark of the wide streets (T548, ADR-0270): true, written by the kernel on every plan it makes, its roads (where the code the layout
   * digs with is a road by its name) are 2-4 tiles wide with the sidewalk at their sides (`widenStreets`); absent, a plan of before, whose
   * roads stay as they were laid (its things and its edits are per tile).
   */
  streets?: boolean;
  /**
   * How rough the place is for the rule 10 of the steps (T474, ADR-0250): written by the kernel when the plan is made in a region of the master
   * that says it (`Region.roughness`); absent, the roughness its relief measures. A region changed later does not move the places it had.
   */
  roughness?: Roughness;
}

/**
 * A structure of a plan (ADR-0043): its concept, its size of D&D (ADR-0092), and whether it has a cellar (T417, ADR-0091 point 4): then the
 * `ModelDirector` asks its model with one (1 tile, 2 for the rare sizes), if it grows by rules, and the things `under` go down there.
 */
export interface PlanStructure {
  concept: string;
  size?: SizeTier;
  cellar?: boolean;
  /**
   * The seed of a structure of the world worn again (T495, ADR-0247): written by the kernel when the plan is new and its concept is one the
   * library has (`reuseSeed`, from the place), never by the Cartographer; absent, the seed of its lot (`seedFor`), as ever.
   */
  seed?: number;
}

export interface PlanContext {
  cx: number;
  cy: number;
  /** What the procedural draft looks like (terrain proportions). */
  terrain: string;
  neighbors: Array<{ place: string; layout: string }>;
  layouts: Array<{ id: string; name: string; description: string; environment: string }>;
  catalog: CatalogEntry[];
  fragments: string[];
  /** Items people talked about, to bring into the world when coherent. */
  wanted: string[];
  start: boolean;
  attempt: number;
  feedback?: string;
  /** The region of the atlas this place belongs to, if any. */
  region?: { name: string; description: string };
  /**
   * The island of an archipelago this place stands on (T441, ADR-0229): its name if the Cartographer gave it one, otherwise how large it is,
   * and the Cartographer names it in `island` with this first place on it.
   */
  island?: { name?: string; description?: string; islet?: boolean; across?: number; body?: 'station' | 'asteroid' };
  /**
   * The rare sizes a structure here may still have (ADR-0092): Huge one per zone of the world (about a
   * million tiles), Gargantuan one per realm (4 × 4 zones); the kernel enforces it anyway.
   */
  rari?: SizeTier[];
  /** Who pays for the plan (T40): the wanderer who first came to the place. */
  chi?: string;
  /** The structures that came with the cards (T295, ADR-0170): asked by their concept and size, they are worn as they are, at no cost. */
  brought?: Array<{ concept: string; size?: SizeTier }>;
  /**
   * The structures the world has (T495, ADR-0247), the brought ones among them: the Cartographer asks one again by its concept, the kernel
   * builds it with another seed; in their order (the least worn first).
   */
  known?: Array<{ concept: string; sizes: SizeTier[]; uses: number; cellar: boolean }>;
  /** Whether a new concept of structure may be asked now (T495): false over the ceiling of the hour (`ai.newStructuresPerHour`), then only `known`. */
  newStructures?: boolean;
  /** A new concept is welcome here (T495): under the ceiling, and `FRESH_EVERY` plans brought none. */
  freshWanted?: boolean;
  /**
   * The relief of the place where it keeps enclaves (T474, ADR-0250) or has true relief with terraces, cliffs or elevation (T475, ADR-0256):
   * its roughness, how many enclaves, their share and the hardest pass's means, plus (in true relief) lowest/highest levels over sea, cliffs
   * and buildable terraces. Absent for a plain hills place: nothing is said, and the schema has `enclave` only when `enclaves >= 1`.
   */
  relief?: { roughness: Roughness; enclaves: number; share: number; means: Means; low?: number; high?: number; cliffs?: number; terraces?: number };
  /**
   * The seabed of the place in a true-relief world when it has swimmable water with a visible bed underneath (T480, ADR-0259): how many
   * interior water tiles, how many deep or reef tiles, maximum depth in levels, and the names of the seabed strata. Absent elsewhere.
   */
  seabed?: { tiles: number; deep: number; reef: number; maxDepth: number; strata: string[] };
}

export const WHERE: Where[] = ['inside', 'outside', 'anywhere', 'under', 'enclave', 'underwater'];
/** The places the schema offers where the place has neither enclaves nor a seabed (T474, T480). */
const WHERE_PLAIN = WHERE.filter((w) => w !== 'enclave' && w !== 'underwater');

/** Where a thing stands, as the Cartographer wrote it (or a plan of before T310b, in Italian): one of `WHERE`, `anywhere` otherwise. */
export const whereOf = (w: unknown): Where => {
  const said = internalName('dove-piano', String(w ?? ''));
  return WHERE.includes(said as Where) ? (said as Where) : 'anywhere';
};

const PLAN_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    place: { type: 'OBJECT', properties: { name: { type: 'STRING' }, description: { type: 'STRING' } }, required: ['name', 'description'] },
    environment: { type: 'STRING' },
    objects: { type: 'ARRAY', items: { type: 'OBJECT', properties: { module: { type: 'STRING' }, where: { type: 'STRING', enum: WHERE_PLAIN } }, required: ['module', 'where'] } },
    ground: { type: 'ARRAY', items: { type: 'STRING' } },
    fresh: { type: 'ARRAY', items: { type: 'OBJECT', properties: { concept: { type: 'STRING' }, where: { type: 'STRING', enum: WHERE_PLAIN }, takeable: { type: 'BOOLEAN' } }, required: ['concept', 'where'] } },
    runes: { type: 'ARRAY', items: { type: 'STRING' } },
    structures: { type: 'ARRAY', items: { type: 'OBJECT', properties: { concept: { type: 'STRING' }, size: { type: 'STRING', enum: internalValues('taglie') }, cellar: { type: 'BOOLEAN' } }, required: ['concept'] } },
  },
  required: ['place', 'environment', 'objects', 'runes'],
};

/**
 * A structure of a plan, as the Cartographer wrote it or as a saved plan has it: a size of D&D, or `importante`
 * of the plans before ADR-0092 (the castle of then is Huge); its cellar only if said true (T417).
 */
export function readStructure(s: any): PlanStructure {
  // A plan of before the contract 0.4 says `taglia` and `concetto`; a size in the Italian of 0.1 is still the one it means.
  const size = sizeOf(internalName('taglie', String(s?.size ?? s?.taglia ?? '').trim().toLowerCase()))?.id ?? (s?.importante === true ? 'huge' : undefined);
  // The seed of a structure worn again (T495) is the kernel's: a whole number of its span, else none.
  const seed = typeof s?.seed === 'number' && Number.isInteger(s.seed) && s.seed >= 1 && s.seed < 2 ** 31 ? s.seed : undefined;
  return { concept: String(s?.concept ?? s?.concetto ?? '').trim(), ...(size ? { size } : {}), ...(s?.cellar === true ? { cellar: true } : {}), ...(seed !== undefined ? { seed } : {}) };
}

export async function planChunk(c: Council, ctx: PlanContext): Promise<ChunkPlan> {
  const prompt = [
    `Design the place (${ctx.cx}, ${ctx.cy}). Starting terrain: ${ctx.terrain}.`,
    ctx.neighbors.length ? `Neighbouring places: ${ctx.neighbors.map((n) => `${n.place} (${n.layout})`).join('; ')}. Keep continuity: a settlement does not end all at once, a wood fades out.` : '',
    `Available environments ("environment" = one of these ids):\n${ctx.layouts.map((l) => `- ${l.id}: ${l.name} [${l.environment}] — ${l.description}`).join('\n')}`,
    ctx.start ? 'It is the starting square: choose an inhabited, welcoming environment.' : '',
    ctx.region ? `This place belongs to the region «${ctx.region.name}» (${ctx.region.description}): its name and what is in it must belong to the region (e.g. «${ctx.region.name} — the north gate», in the language of the world).` : '',
    `Things and characters: 2-6 entries in "objects", "module" = EXACTLY one of the ids below; "where": inside (in the buildings), outside, anywhere, under (in the cellar of a structure with "cellar": true). Furnish the interiors (beds, tables, cupboards, chests) and people the place: about one place in two has at least one character; vary the characters (do not always put the same kind, and never the same as the neighbouring places).\n${ctx.catalog.map((m) => `- ${m.id} «${m.name}» [${m.kind}]: ${m.context}`).join('\n')}`,
    ctx.catalog.some((m) => m.kind === 'vehicle') ? 'A [vehicle] is ridden and steered (a boat, a barge, a cart): it is offered only where this place has room for it to move; at most one per place, with "where": outside, only where the place calls for it (a harbour, a landing, a ford); the kernel puts it where it floats or rolls.' : '',
    `"ground": 0-4 names of common things lying on the ground here (new ones too, if consistent).${ctx.wanted.length ? ` If it makes sense, include something people have talked about: ${ctx.wanted.join(', ')}.` : ''}`,
    '"fresh": almost always empty; only a concrete thing or a character the place calls for and that does not exist among the modules; for a thing, "takeable": true if a wanderer could lift it and set it down elsewhere (a chest, a stool), false if it is fixed or built in place (a well, an oven, a statue).',
    `"runes": 0-2 fragments taken exactly from this list: ${ctx.fragments.map((f) => `«${f}»`).join(', ')}.`,
    '"structures": 0-2 buildings or constructions of this place, if the environment has some of its age (e.g. "the mill on the river", "the tram depot", "the boiler works"): each becomes a whole model one can enter, on the lots of the environment (the other lots have common houses). "cellar": true, now and then, for one that has rooms under the ground (the barrel cellar of an inn, the crypt of a temple, the vault of a bank): then put what belongs down there in "objects" with "where": under.',
    ...(ctx.known ? reuseLines(ctx.known, ctx.newStructures !== false, ctx.freshWanted === true) : []),
    !ctx.known && ctx.brought?.length ? `These structures are already built in the library: ${ctx.brought.slice(0, 30).map((b) => `«${b.concept}»${b.size ? ` (${b.size})` : ''}`).join(', ')}. When one fits this place, write EXACTLY its concept (and its size) in "structures".` : '',
    `"size" (optional, as the sizes of D&D: tiny, small, medium, large, huge, gargantuan): medium a house, large a mill, a station or a tower; the kernel fits it to the lot.`,
    ctx.rari?.length
      ? `The biggest sizes are rare: this part of the world may still have ${ctx.rari.map((t) => (t === 'huge' ? 'one "huge" structure (what is huge in its age: a castle, a power station, a skyscraper)' : 'one "gargantuan" structure (a citadel, a cathedral, a tower-city, an immense ruin)')).join(' and ')}: at most one per place, only if the place truly deserves it.`
      : 'No "huge" or "gargantuan" structures here: this part of the world already has its remarkable places.',
    reliefLine(ctx.relief),
    seabedLine(ctx.seabed),
    ctx.feedback ? `THE PREVIOUS ATTEMPT WAS DISCARDED: ${ctx.feedback}. Fix it.` : '',
    islandLine(ctx.island),
    ctx.island ? (ctx.island.body ? VOID_LINE : SHORE_LINE) : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  // The environment can only be one of the existing ids: the schema says so. An island nobody has named yet is named with it (T441).
  const unnamed = !!ctx.island && !ctx.island.name;
  // Over the ceiling of the hour (T495) a structure is one the world has, or none: the schema lets only their concepts through.
  const { structures: _s, ...rest } = PLAN_SCHEMA.properties!;
  const structures: Record<string, Schema> = ctx.newStructures === false ? (ctx.known?.length ? { structures: knownStructures(ctx.known) } : {}) : { structures: PLAN_SCHEMA.properties!.structures };
  // Where the place keeps enclaves (T474) or has a seabed (T480), the schema offers those places only then.
  const extras: Where[] = [
    ...(ctx.relief && ctx.relief.enclaves > 0 ? (['enclave'] as const) : []),
    ...(ctx.seabed && ctx.seabed.tiles > 0 ? (['underwater'] as const) : []),
  ];
  const placed = withWhere(rest, extras);
  const schema: Schema = {
    ...PLAN_SCHEMA,
    properties: { ...placed, ...structures, environment: { type: 'STRING', enum: ctx.layouts.map((l) => l.id) }, ...(unnamed ? { island: ISLAND_SCHEMA } : {}) },
    ...(unnamed ? { required: [...PLAN_SCHEMA.required!, 'island'] } : {}),
  };
  const raw = await c.ask<any>('cartographer', 'chunk.plan', prompt, schema, { data: ctx, temperature: 0.9, chi: ctx.chi });
  // `oggetti` of a plan of before T310b are its objects (`internalAnswer` does not port the word: a pack's are items).
  const objects = Array.isArray(raw?.objects) ? raw.objects : Array.isArray(raw?.oggetti) ? raw.oggetti : [];
  return {
    place: { name: String(raw?.place?.name ?? '').trim(), description: String(raw?.place?.description ?? '').trim() },
    layout: String(raw?.environment ?? ''),
    objects: objects.slice(0, 8).map((o: any) => ({ module: String(o?.module ?? ''), where: whereOf(o?.where) })),
    ground: (raw?.ground ?? []).slice(0, 4).map(String),
    fresh: (raw?.fresh ?? []).slice(0, 1).map((o: any) => ({ concept: String(o?.concept ?? ''), where: whereOf(o?.where), ...(typeof o?.takeable === 'boolean' ? { takeable: o.takeable } : {}) })),
    runes: (raw?.runes ?? []).slice(0, 3).map(String),
    // The seed is never the Cartographer's (T495): the kernel writes it for a structure of the world worn again.
    structures: (Array.isArray(raw?.structures) ? raw.structures : []).slice(0, 3).map((x: unknown) => {
      const { seed: _seed, ...said } = readStructure(x);
      return said;
    }),
    // The island's name as said (T441): the kernel checks it and writes it on the atlas, never in the plan.
    ...(unnamed && raw?.island ? { island: raw.island } : {}),
  } as ChunkPlan;
}

/** The structures of a plan when only those of the world may be asked (T495): their concepts as an enumeration, as the environments. */
const knownStructures = (known: NonNullable<PlanContext['known']>): Schema => ({
  type: 'ARRAY',
  items: { type: 'OBJECT', properties: { concept: { type: 'STRING', enum: known.slice(0, REUSE_OFFERED).map((k) => k.concept) }, size: { type: 'STRING', enum: internalValues('taglie') }, cellar: { type: 'BOOLEAN' } }, required: ['concept'] },
});

/** The objects and the fresh things of the plan's schema with extra `Where` values (`enclave`, `underwater`; T474, T480). */
function withWhere(props: Record<string, Schema>, extras: Where[]): Record<string, Schema> {
  if (!extras.length) return props;
  const allowed = [...WHERE_PLAIN, ...extras];
  const out = JSON.parse(JSON.stringify(props)) as Record<string, { items: { properties: { where: { enum: string[] } } } }>;
  for (const k of ['objects', 'fresh']) if (out[k]?.items?.properties?.where) out[k].items.properties.where.enum = allowed;
  return out as unknown as Record<string, Schema>;
}

/**
 * What the Cartographer is told of a place's seabed (T480, ADR-0259): only in true-relief worlds where the place has swimmable water
 * with a visible bed underneath; nothing elsewhere.
 */
export function seabedLine(seabed: PlanContext['seabed']): string {
  if (!seabed || seabed.tiles <= 0) return '';
  const maxT = (seabed.maxDepth * 0.25).toFixed(1);
  const parts: string[] = [`up to ${maxT} tiles deep`];
  if (seabed.reef > 0) parts.push(`${seabed.reef} reef tiles`);
  if (seabed.deep > 0) parts.push(`${seabed.deep} deep-water tiles`);
  const bed = seabed.strata.length ? ` (bed: ${seabed.strata.join(', ')})` : '';
  return `Seabed of this place: ${seabed.tiles} tiles of water with a visible bed ${parts.join(', ')}${bed}. Sunken or underwater details (a sunken chest, an anchor, ruins, amphorae, kelp, corals) may have "where": underwater; never people or vehicles.`;
}

/** What the means of a pass are, in the request (T474). */
const MEANS_WORDS: Record<Means, string> = { jump: 'jumping', climb: 'climbing', build: 'building their way up (steps cut in the rock, a ladder, a bridge) or digging' };

/**
 * What the Cartographer is told of a place's relief (T474, ADR-0250; T475, ADR-0256): in true-relief worlds its elevation, terraces and
 * cliffs (buildings sit only on flat terraces, never straddling a cliff), and where it keeps enclaves how many parts only a cliff parts
 * from its paths, so a thing meant to be found there may stand in one. Nothing for a plain hills place of today.
 */
export function reliefLine(relief: PlanContext['relief']): string {
  if (!relief) return '';
  const parts: string[] = [];
  if (relief.high !== undefined && relief.low !== undefined) {
    const lo = (relief.low * 0.25).toFixed(1);
    const hi = (relief.high * 0.25).toFixed(1);
    const terraces = relief.terraces && relief.terraces > 1 ? ` across ${relief.terraces} terraces` : '';
    const cliffs = relief.cliffs && relief.cliffs > 0 ? ', with cliffs between them (buildings sit only on flat terraces, never straddling a cliff)' : '';
    parts.push(`Relief of this place (${relief.roughness}): the ground rises from ${lo} to ${hi} tiles above sea level${terraces}${cliffs}.`);
  }
  if (relief.enclaves >= 1) {
    const rough = relief.roughness === 'rugged' ? 'rugged' : 'mountainous';
    const share = Math.max(1, Math.round(relief.share * 100));
    parts.push(`The ground of this place is ${rough}: cliffs part ${relief.enclaves === 1 ? 'one ledge or rise' : `${relief.enclaves} ledges and rises`} (about ${share}% of its tiles) from its paths, reached only by ${MEANS_WORDS[relief.means]}. A thing meant to be found there (a hidden chest, a nest, a shrine on a crag) may have "where": enclave; whatever people use, live in or need to reach stays elsewhere.`);
  }
  return parts.join(' ');
}

/** The island's name and a line about it, as the Cartographer gives them with the first place on it (T441). */
const ISLAND_SCHEMA: Schema = { type: 'OBJECT', properties: { name: { type: 'STRING' }, description: { type: 'STRING' } }, required: ['name', 'description'] };

/** The edge of a station or an asteroid (T445, ADR-0233), as the Cartographer is told: the void around, where nothing stands. */
export const VOID_LINE =
  'Around this land is the void, with the stars above and below: nothing stands on it and nobody walks or swims it; what the place has is on its land, and its edge looks out on the stars.';

/** What the Cartographer is told of the island a place stands on (T441), or of the station or the asteroid in the void (T445): its name, or that it is to be named. */
function islandLine(island: PlanContext['island']): string {
  if (!island) return '';
  const land = island.body === 'station' ? 'station' : island.body === 'asteroid' ? 'asteroid' : 'island';
  if (island.name) return `This place is on the ${land} «${island.name}» (${island.description ?? ''}): its name and what is in it belong to the ${land}; ${island.body ? 'the void around it is empty' : 'the sea around it is open water'}.`;
  const what = island.body
    ? `a ${land} about ${island.across ?? 1} places across, in the void among the stars${island.body === 'station' ? ' (built: decks, corridors, modules)' : ' (rock, dust and ice)'}`
    : island.islet
      ? 'a cay, a few tiles of sand in the open sea between two far islands'
      : `an island about ${island.across ?? 1} places across, in the open sea`;
  return `This place is the first one explored on ${what}, which has no name yet: name it in "island" ("name", short, as the people of the world call it, and "description", one line), in the language of the world.`;
}

/** The types of an environment (T310b, `tipi-ambiente`), as the Cartographer's schemas list them. */
export const ENVIRONMENT_TYPES: Array<EnvironmentDef['environment']> = ['outdoor', 'indoor', 'mixed'];

/** The type of an environment as the Cartographer wrote it (or in the Italian of before T310b): one of the three, `outdoor` otherwise. */
export const environmentTypeOf = (t: unknown): EnvironmentDef['environment'] => {
  const said = internalName('tipi-ambiente', String(t ?? ''));
  return (ENVIRONMENT_TYPES as string[]).includes(said) ? (said as EnvironmentDef['environment']) : 'outdoor';
};

const LAYOUTS_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    environments: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          name: { type: 'STRING' },
          description: { type: 'STRING' },
          type: { type: 'STRING', enum: ENVIRONMENT_TYPES },
          program_json: { type: 'STRING', description: 'the MarkovJunior program as JSON' },
          street_width: { type: 'NUMBER', description: 'only where the roads of its places are streets of a town or a city: how many tiles wide, 2-4 (a lane 1); leave it out otherwise' },
        },
        required: ['id', 'name', 'description', 'type', 'program_json'],
      },
    },
  },
  required: ['environments'],
};

/**
 * The environments' schema in a world that counts the breath (T446, ADR-0238): `air` false for one whose places have no air. Only there: in a
 * world of today the air is everywhere and the Cartographer is not asked.
 */
const LAYOUTS_SCHEMA_BREATH: Schema = (() => {
  const s = JSON.parse(JSON.stringify(LAYOUTS_SCHEMA)) as { properties: { environments: { items: { properties: Record<string, unknown> } } } };
  s.properties.environments.items.properties.air = { type: 'BOOLEAN', description: 'false only for a place with no air to breathe (a flooded shaft, the bare rock of an airless moon); leave it out otherwise' };
  return s as unknown as Schema;
})();

/** What the Cartographer is told of the air in a world that counts the breath (T446). */
const BREATH_ENVIRONMENTS = 'In this world bodies count their breath: where there is no air it runs out. Say "air": false of an environment whose places have none (the open rock of an airless body, a flooded shaft); a station, a dome, a ship hold the air. Most places have air.';

/** How wide the Cartographer said the streets of an environment are (T548, ADR-0270), read without trusting; nothing if it did not say. */
function streetField(width: unknown): { street?: { width: number } } {
  const w = readStreet({ width }).width;
  return w !== undefined ? { street: { width: w } } : {};
}

/** Genesis: the Cartographer writes the environments of this world as rewrite programs. */
export async function designLayouts(c: Council, palette: Record<string, TerrainDef>, feedback = '', music: Array<{ name: string; environments: string[] }> = [], geography?: Geography, breath = false): Promise<Array<{ id: string; def: EnvironmentDef } | { id: string; error: string }>> {
  const raw = await c.ask<{ environments: Array<{ id: string; name: string; description: string; type: string; program_json: string; air?: unknown; street_width?: unknown }> }>(
    'cartographer',
    'genesis.layouts',
    [
      'Write 10-14 environments for the places of this world, each as a MarkovJunior rewrite program (see your role for the syntax) that transforms the procedural draft.',
      'Variety, in the age of the bible! Needed: where people live (more than one kind: from the stone village to the quarter of blocks of flats, as the world has it), where they work and farm, the nature that remains in this world (woods, jungles, deserts, mountains, lakes and coasts, or what they made of them), and special places with the kernel\'s stamps. Plus one big interior with several rooms. The draft is nature: a densely built environment clears it first.',
      `Available stamps: {"type":"stamp","shape":…} with shape among ${internalValues('timbri').join(', ')} (see the role). A stamp is a shape, not an age: its id stays in the program, the name and description of the environment are yours to decide and "codes" gives it the materials of this world.`,
      // An archipelago (T443, ADR-0230): its shores are most of its places, and what is made on them.
      geography === 'archipelago' && ARCHIPELAGO_ENVIRONMENTS,
      breath && BREATH_ENVIRONMENTS,
      `Usable terrain codes:\n${paletteSummary(palette)}`,
      // The music that came with the cards (T295) plays where an environment's id contains one of its words.
      music.length && `Music is already written for the environments whose id contains: ${music.slice(0, 20).map((m) => `${m.environments.map((e) => `"${e}"`).join(' or ')} (${m.name})`).join('; ')}. When one of yours is that kind of place, put that word in its id.`,
      feedback && `SOME PROGRAMS WERE INVALID, fix them: ${feedback}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    breath ? LAYOUTS_SCHEMA_BREATH : LAYOUTS_SCHEMA,
    { data: { palette }, temperature: 0.7 },
  );
  return (raw.environments ?? []).map((a) => {
    const id = String(a.id ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 24) || 'ambiente';
    try {
      const program = JSON.parse(a.program_json) as MjNode;
      return { id, def: { name: String(a.name), description: String(a.description), environment: environmentTypeOf(a.type), program, ...(breath && a.air === false ? { air: false as const } : {}), ...streetField(a.street_width) } };
    } catch (e) {
      return { id, error: `${id}: program_json non è JSON valido (${(e as Error).message})` };
    }
  });
}

/** The directions of the compass as the Cartographer writes them (T310b, `direzioni`): never `here`. */
const DIRECTIONS = internalValues('direzioni').filter((d) => d !== 'here');

const REGION_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING', description: 'proper name of the region, in the language of the world (e.g. «Rocca di Montenero», «Dune del Sale», «Darsena Vecchia»)' },
    description: { type: 'STRING' },
    environment: { type: 'STRING' },
    direction: { type: 'STRING', enum: DIRECTIONS },
    distance: { type: 'INTEGER', description: 'in places from the starting point (2-12)' },
    radius: { type: 'INTEGER', description: '1 = a place and its neighbours, 2-3 = a wide zone (deserts, jungles, seas)' },
  },
  required: ['name', 'description', 'environment', 'direction', 'distance', 'radius'],
};

export interface RegionDraft {
  name: string;
  description: string;
  environment: string;
  /** A direction of the compass, as an id (`north-east`); one in the Italian of before is read as the same (`directionVector`). */
  direction: string;
  distance: number;
  radius: number;
}

/** Genesis: the Cartographer draws the geography — where the castle is, the desert, the elves' wood. */
export async function drawAtlas(c: Council, layouts: Array<{ id: string; name: string; description: string }>): Promise<RegionDraft[]> {
  const ids = layouts.map((l) => l.id);
  const raw = await c.ask<{ regions: RegionDraft[] }>(
    'cartographer',
    'genesis.atlas',
    [
      'Draw the geography of the world: 8-14 regions around the starting point (which is at the centre). Each one has a proper name, a sentence, an environment among the available ones, a direction and a distance (in places) from the centre, and a radius.',
      'Make it believable and of its age: the desert far from the lakes, what towers on a hill with a settlement nearby, the mountains to the north, the sea on one side; the farther you go, the stranger things are.',
      `Environments:\n${layouts.map((l) => `- ${l.id}: ${l.name} — ${l.description}`).join('\n')}`,
    ].join('\n\n'),
    { type: 'OBJECT', properties: { regions: { type: 'ARRAY', items: { ...REGION_SCHEMA, properties: { ...REGION_SCHEMA.properties!, environment: { type: 'STRING', enum: ids } } } } }, required: ['regions'] },
    { data: { layouts }, temperature: 0.8 },
  );
  return (raw.regions ?? []).filter((r) => ids.includes(r.environment)).slice(0, 16);
}

const ENV_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    reuse: { type: 'STRING', description: 'if an existing environment already fits, its id (then no program)' },
    id: { type: 'STRING' },
    name: { type: 'STRING' },
    description: { type: 'STRING' },
    type: { type: 'STRING', enum: ENVIRONMENT_TYPES },
    program_json: { type: 'STRING', description: 'the MarkovJunior program as JSON (it may use the stamps)' },
    new_terrains: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          code: { type: 'STRING', description: 'a single character not used yet' },
          name: { type: 'STRING' },
          color: { type: 'STRING', description: '#rrggbb' },
          layer: { type: 'STRING', enum: ['ground', 'floor', 'wall', 'door', 'liquid', 'vegetation', 'rock'] },
          solid: { type: 'BOOLEAN' },
          indoor: { type: 'BOOLEAN' },
          description: { type: 'STRING' },
        },
        required: ['code', 'name', 'color', 'layer', 'solid'],
      },
    },
    region: REGION_SCHEMA,
  },
  required: ['name', 'description', 'region'],
};

export interface EnvironmentDraft {
  reuse?: string;
  id: string;
  name: string;
  description: string;
  environment: EnvironmentDef['environment'];
  program?: unknown;
  tiles: Array<{ code: string; tile: TerrainDef }>;
  region: RegionDraft;
}

/** On request: a new environment (program + new terrains if needed), placed on the map. */
export async function designEnvironment(
  c: Council,
  request: string,
  ctx: { palette: Record<string, TerrainDef>; layouts: Array<{ id: string; name: string; description: string }>; here: string; stamps: readonly string[]; feedback?: string },
): Promise<EnvironmentDraft> {
  const raw = await c.ask<any>(
    'cartographer',
    'cartographer.environment',
    [
      `You are asked: «${request}». The wanderer is at «${ctx.here}».`,
      `Existing environments:\n${ctx.layouts.map((l) => `- ${l.id}: ${l.name} — ${l.description}`).join('\n')}`,
      `Terrains:\n${paletteSummary(ctx.palette)}`,
      `If needed, write a new environment as a program (you may use the stamps: ${ctx.stamps.join(', ')}) and add new terrains (one character each, never one already used). Then place it in the atlas: a region with a proper name, a direction and a distance in places from where the wanderer is (in a zone not explored yet, 3-8 places).`,
      ctx.feedback ? `THE PREVIOUS ATTEMPT DID NOT WORK: ${ctx.feedback}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    ENV_SCHEMA,
    { data: { request, ...ctx }, temperature: 0.7 },
  );
  let program: unknown;
  try {
    program = raw.program_json ? JSON.parse(raw.program_json) : undefined;
  } catch {
    program = undefined;
  }
  const tiles = (Array.isArray(raw.new_terrains) ? raw.new_terrains : []).slice(0, 4).map((t: any) => ({
    code: String(t?.code ?? '').slice(0, 1),
    tile: { name: String(t?.name ?? 'terreno').slice(0, 30), color: /^#[0-9a-f]{6}$/i.test(t?.color) ? t.color : '#888888', solid: !!t?.solid, layer: t?.layer, indoor: !!t?.indoor, description: t?.description ? String(t.description).slice(0, 120) : undefined } as TerrainDef,
  }));
  const r = raw.region ?? {};
  return {
    reuse: raw.reuse && ctx.layouts.some((l) => l.id === raw.reuse) ? String(raw.reuse) : undefined,
    id: String(raw.id ?? raw.name ?? 'ambiente').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'ambiente',
    name: String(raw.name ?? request).slice(0, 40),
    description: String(raw.description ?? '').slice(0, 200),
    environment: environmentTypeOf(raw.type),
    program,
    tiles,
    region: { name: String(r.name ?? raw.name ?? request).slice(0, 40), description: String(r.description ?? raw.description ?? '').slice(0, 200), environment: '', direction: internalName('direzioni', String(r.direction ?? 'north')), distance: Math.max(2, Math.min(12, Math.round(Number(r.distance) || 4))), radius: Math.max(1, Math.min(3, Math.round(Number(r.radius) || 1))) },
  };
}

/** The task of an environment cut again for the structures at 16 (T422): only in the regeneration of the models (`npm run genera --rigenera modelli`). */
export const RECUT_TASK = 'environment.recut';

/** A place on an environment cut again, as the Cartographer is told it: its name, its structures and what each needs, the lots it has now, its draft. */
export interface RecutPlace {
  name: string;
  structures: Array<{ concept: string; size?: SizeTier; need: number }>;
  /** The lots its buildings make now, `w×h`, largest first. */
  lots: string[];
  /** The terrains of its draft, the most common first, with their share (`t 40%`). */
  draft: string;
  /** Its whole draft, a row of codes a line: only for a place with structures. */
  rows?: string[];
}

/** What the Cartographer is told when an environment's buildings are too small for the structures at 16 (T422). */
export interface RecutContext {
  id: string;
  def: EnvironmentDef;
  palette: Record<string, TerrainDef>;
  /** The least side, walls included, of a building that holds the largest structure of its places (7 a Large at 16, 10 a Huge). */
  need: number;
  /**
   * The least side of every building that is not a small house (7: a Large, a common house at 16), when it is under `need` (T436): only the
   * structure that needs more needs a building of `need`. Absent: `need`.
   */
  least?: number;
  /** The longer side under which a building is a small house that holds no structure (`STRUCTURE_LOT`: 5, so at most 4 × 4). */
  small: number;
  places: RecutPlace[];
  feedback?: string;
}

const RECUT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    program_json: { type: 'STRING', description: 'the whole MarkovJunior program of the environment, as JSON' },
    note: { type: 'STRING', description: 'one sentence: what changed' },
  },
  required: ['program_json'],
};

/**
 * T422: an environment of before whose buildings are too small for the structures at 16 voxels a tile (ADR-0209), which the kernel could not grow
 * by itself (`stretchBoxes`): the Cartographer writes its program again, the same environment with buildings that hold them. The program only:
 * its name, description, type and terrains stay; the kernel checks it on the real drafts of its places (`regenerate.ts`).
 */
export async function recutEnvironment(c: Council, ctx: RecutContext): Promise<{ program?: MjNode; note: string; error?: string }> {
  const n = ctx.need;
  // T436: a Huge on one place of the environment asks for one building that large, not for every building of every place.
  const least = Math.min(n, ctx.least ?? n);
  const walled = (m: number) => `at least ${m} × ${m}, walls included (inner floor closed by walls, a door, a ring of free ground around: the input one tile larger on every side, \`*\` there in the output)`;
  const clear = `- A rule is placed only where its whole input matches the draft: clear first what would stop a big building (vegetation, rocks, the scrub of the draft) with a "prl" at p 1 where needed, and let the input take every walkable terrain of the draft and those your own rules draw before it (a paving, a quay).\n- A "one" rule lands anywhere its input matches: where the draft has streets (a row or column of one code across the place), a building whose input begins with that street row and column sits in its block and leaves room for the next.`;
  const sizes =
    least < n
      ? [
          `- Every building of ${ctx.small} tiles or more on its longer side must be ${walled(least)}; smaller buildings stay at most ${ctx.small - 1} × ${ctx.small - 1}.`,
          `- Only a structure that says so needs a larger building (the largest ${n} × ${n}): draw that one first and at most one per place ("steps" 1), then the buildings of ${least} × ${least}, so that a place still gets them beside it.`,
          `- Each place below must get, for each structure it lists, its own building at least as large as that structure needs.`,
          clear,
          `- The place is 18 × 18 tiles and its border does not change (its outer rows and columns keep the terrain of the draft even under a rule that writes there, so an input that covers the border must take the draft's terrains there: sand stays sand): two buildings of ${least} × ${least} with their ring fit; one of ${n} × ${n} and one of ${least} × ${least} fit only in opposite corners, so keep the large one off the middle.`,
        ]
      : [
          `- Every building of ${ctx.small} tiles or more on its longer side must be ${walled(n)}; smaller buildings stay at most ${ctx.small - 1} × ${ctx.small - 1}.`,
          `- Each place below must get at least as many buildings of ${n} × ${n} as the structures it lists: put the big buildings first, with enough "steps", then the small ones.`,
          clear,
          `- The place is 18 × 18 tiles and its border does not change (its outer rows and columns keep the terrain of the draft even under a rule that writes there, so an input that covers the border must take the draft's terrains there: sand stays sand): two buildings of ${n} × ${n} with their ring fit, three only on open ground.`,
        ];
  const raw = await c.ask<{ program_json?: string; note?: string }>(
    'cartographer',
    RECUT_TASK,
    [
      `The environment «${ctx.id}» (${ctx.def.name}, ${ctx.def.environment}: ${ctx.def.description}) was written when buildings were smaller. Its buildings no longer hold the structures of its places: a structure now needs a building at least ${least < n ? `${least} × ${least} tiles, walls included, the largest ${n} × ${n}` : `${n} × ${n} tiles, walls included`}.`,
      `Its program now:\n${JSON.stringify(ctx.def.program)}`,
      `Write the program again: the same environment (its character, its terrains, its streets and details), with buildings that hold the structures.\n${sizes.join('\n')}`,
      `The places on this environment (the kernel runs your program on their drafts):\n${ctx.places.map((p) => `- «${p.name}»: ${p.structures.length ? `structures ${p.structures.map((s) => `${s.concept}${s.size ? ` (${s.size})` : ''}, ${s.need} × ${s.need}`).join('; ')}` : 'no structures (common houses on its big buildings)'}; buildings now ${p.lots.join(', ') || 'none'}; draft ${p.draft}${p.rows ? `:\n${p.rows.map((r) => `    ${r}`).join('\n')}` : ''}`).join('\n')}`,
      `Terrains:\n${paletteSummary(ctx.palette)}`,
      ctx.feedback ? `THE PREVIOUS PROGRAM DID NOT HOLD THEM: ${ctx.feedback}. Fix it.` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    RECUT_SCHEMA,
    { data: { ...ctx, palette: undefined, codes: recutCodes(ctx.palette) }, temperature: 0.4 },
  );
  const note = String(raw?.note ?? '').slice(0, 200);
  if (typeof raw?.program_json !== 'string' || !raw.program_json.trim()) return { note, error: 'program_json mancante' };
  try {
    return { program: JSON.parse(raw.program_json) as MjNode, note };
  } catch (e) {
    return { note, error: `program_json non è JSON valido (${(e as Error).message})` };
  }
}

/** The codes of a palette by role, for the local models' answer to `environment.recut`: walls, inner floor, doors, the ground one walks on, the rest. */
export function recutCodes(palette: Record<string, TerrainDef>): { wall: string[]; floor: string[]; door: string[]; ground: string[]; clear: string[] } {
  const all = Object.entries(palette).filter(([c]) => c !== '?');
  const of = (f: (t: TerrainDef) => boolean) => all.filter(([, t]) => f(t)).map(([c]) => c);
  return {
    wall: of((t) => t.layer === 'wall'),
    floor: of((t) => t.layer === 'floor' && !t.solid),
    door: of((t) => t.layer === 'door'),
    ground: of((t) => (t.layer ?? 'ground') === 'ground' && !t.solid),
    clear: of((t) => t.layer === 'vegetation' || t.layer === 'rock'),
  };
}
