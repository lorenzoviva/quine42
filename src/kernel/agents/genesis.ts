// Genesis: from a theme, the Council writes the world bible, the art direction, the terrains (with
// their layers), the environments (layout programs) and plans the first inhabitants and furniture.
// Constants never generated: the carpet, movement, physics, needs, runes, the kernel.

import type { Schema } from '../ai/models';
import type { FileMap, EnvironmentDef, TerrainDef, TerrainLayer } from '../types';
import type { AgentId, Bible, Council } from './council';
import { wordsOf } from './council';
import { designLayouts } from './cartography';
import { repairProgram } from '../mj';
import { bibleBreaks, cleanBible, metaBreak } from '../fourthwall';
import { internalFields, internalName } from '../internalNames';
import { FORGE_KINDS, type ForgeKind } from './forge';
import { TIMELESS_LAYOUTS } from '../themes';
import { CLIMATES, DEPTHS, physicsOf, TERRAIN_LIMITS, WATER_CODES, type Climate, type Crossing, type Geography } from '../nature';
import { SEED_STRATA, STRATA_DEPTH, STRATA_EXAMPLE, strataErrors, strataPalette, STRATUM_ROLES } from '../strata';
import { GRAIN_LIMITS, readGrain, type Grain } from '../grain';
import { BASE_GROUND, INSET_LIMITS, readInset } from '../inset';

/**
 * Codes the procedural draft and the kernel rely on: every palette must define them. Their layer and how a body crosses them (T437,
 * ADR-0224: the water codes are swum in every universe) are the kernel's, whatever the Cartographer and the Physicist say.
 */
export const BASE_CODES: Record<string, { meaning: string; layer: TerrainLayer; solid: boolean; cross: Crossing; indoor?: boolean }> = {
  g: { meaning: 'walkable base ground (grass, sand, earth…)', layer: 'ground', solid: false, cross: 'walk' },
  p: { meaning: 'path or road (also the paths the kernel digs)', layer: 'ground', solid: false, cross: 'walk' },
  t: { meaning: 'vegetation that blocks the way (trees, brambles…)', layer: 'vegetation', solid: true, cross: 'none' },
  w: { meaning: 'water one swims across: river, lake, pond, moat', layer: 'liquid', solid: true, cross: 'swim' },
  r: { meaning: 'uncrossable rock, relief or rubble', layer: 'rock', solid: true, cross: 'none' },
  h: { meaning: 'wall of the buildings', layer: 'wall', solid: true, cross: 'none' },
  f: { meaning: 'inner floor of the buildings', layer: 'floor', solid: false, cross: 'walk', indoor: true },
  d: { meaning: 'door or threshold', layer: 'door', solid: false, cross: 'walk' },
  // Biomes of the procedural draft (world.terrain): they must exist in every world.
  s: { meaning: 'dry walkable ground (sand, desert, beach)', layer: 'ground', solid: false, cross: 'walk' },
  j: { meaning: 'very thick, uncrossable vegetation of hot climates (jungle)', layer: 'vegetation', solid: true, cross: 'none' },
  o: { meaning: 'deep water of the sea or the ocean, swum', layer: 'liquid', solid: true, cross: 'swim' },
  k: { meaning: 'mountain, uncrossable walls', layer: 'rock', solid: true, cross: 'none' },
  n: { meaning: 'cold walkable, slow ground (snow, frost)', layer: 'ground', solid: false, cross: 'walk' },
};

/**
 * What the codes of a climate the world does not admit mean (T510, ADR-0261): the draft never draws them there, but every palette has them
 * (the environments and the kernel rely on them), so they are another ground and another thicket of this world, never snow nor a jungle.
 */
const OUT_OF_CLIMATE: Partial<Record<Climate, { code: string; meaning: string }>> = {
  frozen: { code: 'n', meaning: 'another slow walkable ground of this world (mud, scree, a salt flat…): this world has no snow nor frost' },
  jungle: { code: 'j', meaning: 'another very thick, uncrossable vegetation of this world (a thorn thicket, a cane brake…): this world has no jungle' },
};

/**
 * Base codes for a world: in a true-relief world (T475, ADR-0256), mountains are relief (terraces and cliffs) rather than solid blocks, so
 * `k` is walkable bare mountain rock (`layer: 'ground', solid: false, cross: 'walk'`, no boulder model) while `r` stays the solid boulder.
 * `climates` (T510), those the world admits: the codes of the others say another ground of this world, the same layer and crossing.
 */
export function baseCodesFor(trueRelief = false, climates: readonly Climate[] = CLIMATES): typeof BASE_CODES {
  const codes: typeof BASE_CODES = trueRelief
    ? { ...BASE_CODES, k: { meaning: 'mountain bare rock, walkable with terraces and cliffs', layer: 'ground', solid: false, cross: 'walk' } }
    : { ...BASE_CODES };
  for (const c of CLIMATES) {
    const out = OUT_OF_CLIMATE[c];
    if (out && !climates.includes(c)) codes[out.code] = { ...codes[out.code], meaning: out.meaning };
  }
  return codes;
}

/** What the Narrator asks the Forge for at the Genesis: a kind of what it creates (T310b, `tipi-fucina`) and the request. */
export interface CastEntry {
  type: ForgeKind;
  request: string;
}

export interface GenesisPlan {
  files: FileMap;
  cast: CastEntry[];
  wandererPrompt: string;
  palette: Record<string, TerrainDef>;
}

const BIBLE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    tone: { type: 'STRING' },
    summary: { type: 'STRING' },
    history: { type: 'STRING' },
    places: { type: 'ARRAY', items: { type: 'STRING' } },
    characters: { type: 'ARRAY', items: { type: 'STRING' } },
    facts: { type: 'ARRAY', items: { type: 'STRING' } },
    mysteries: { type: 'ARRAY', items: { type: 'STRING' }, description: 'legends told by the people of the world (people, beasts, gods, the powerful of the past)' },
    customs: { type: 'ARRAY', items: { type: 'STRING' }, description: 'at most 3 customs or sayings of this world, that enrich the lexicon without contradicting or explaining it' },
  },
  required: ['title', 'tone', 'summary', 'history', 'places', 'characters', 'facts', 'mysteries'],
};

const STYLE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    style: { type: 'STRING' },
    shapes: { type: 'STRING', description: 'proportions and shapes of the models (big or realistic heads, squat or slender buildings…)' },
    palette: { type: 'ARRAY', items: { type: 'STRING' } },
    light: { type: 'STRING' },
    rules: { type: 'ARRAY', items: { type: 'STRING' } },
    protagonist: { type: 'STRING', description: 'what the wanderer (the one who plays) looks like' },
    common_houses: { type: 'STRING', description: 'what the common houses look like, if they are not cottages of stone, wood and straw; empty otherwise' },
  },
  required: ['style', 'shapes', 'palette', 'light', 'rules', 'protagonist'],
};

const TERRAIN_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    terrains: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          code: { type: 'STRING' },
          name: { type: 'STRING' },
          description: { type: 'STRING', description: 'what it is like: material, colour, details' },
          color: { type: 'STRING', description: 'hexadecimal #rrggbb, well apart from the others' },
          layer: { type: 'STRING', enum: ['ground', 'floor', 'wall', 'door', 'liquid', 'vegetation', 'rock'] },
          solid: { type: 'BOOLEAN' },
          speed: { type: 'NUMBER' },
          grain: {
            type: 'OBJECT',
            description: `only for walkable ground strewn with small loose bits seen from above (gravel, the ballast of a railway, dry leaves): specks of one voxel of colour #rrggbb on density ${GRAIN_LIMITS.density.join('-')} of its top; leave it out otherwise`,
            properties: { color: { type: 'STRING' }, density: { type: 'NUMBER' } },
            required: ['color', 'density'],
          },
          inset: {
            type: 'NUMBER',
            description: `only for walkable ground drawn lower or higher than the ground beside it, in tiles ${INSET_LIMITS.join(' to ')}: a road -0.12 under its sidewalk (the curb), a ditch -0.18, the ballast of a railway 0.06; never for the code g; leave it out otherwise`,
          },
        },
        required: ['code', 'name', 'description', 'color', 'layer', 'solid', 'speed'],
      },
    },
    roof: { type: 'STRING', description: 'colour #rrggbb of the roofs of the buildings' },
  },
  required: ['terrains', 'roof'],
};

/**
 * The physics' schema in a world that counts the breath (T446, ADR-0238): `air` false for a terrain one does not breathe on. Built from
 * PHYS_SCHEMA after it; only there, so a world of today is asked as before.
 */
const PHYS_BREATH = '\nIn this world bodies count their breath: say air false of a terrain where nobody breathes (a grating open to the void, the floor of a flooded shaft); of the base codes say nothing, they have air.';

const PHYS_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    terrains: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          code: { type: 'STRING' },
          cross: { type: 'STRING', enum: ['walk', 'swim', 'none'], description: 'how a body crosses it: on foot, swimming (only a liquid), not at all' },
          speed: { type: 'NUMBER', description: `the pace, a multiplier: on foot ${TERRAIN_LIMITS.walkPace.join('-')}, swimming ${TERRAIN_LIMITS.swimPace.join('-')}` },
          fatigue: { type: 'NUMBER', description: `only where one swims: how many times the energy against walking, ${TERRAIN_LIMITS.fatigue.join('-')}` },
          depth: { type: 'STRING', enum: [...DEPTHS], description: 'only where one swims: how deep the water is; reef: rock just under the surface, swum over, no hull floats on it' },
          note: { type: 'STRING' },
        },
        required: ['code', 'cross', 'speed'],
      },
    },
  },
  required: ['terrains'],
};

const PHYS_SCHEMA_BREATH: Schema = (() => {
  const s = JSON.parse(JSON.stringify(PHYS_SCHEMA)) as { properties: { terrains: { items: { properties: Record<string, unknown> } } } };
  s.properties.terrains.items.properties.air = { type: 'BOOLEAN', description: 'false only for a terrain nobody breathes on; leave it out otherwise' };
  return s as unknown as Schema;
})();

const REVIEW_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    approved: { type: 'BOOLEAN' },
    problems: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { agent: { type: 'STRING', enum: ['narrator', 'artist', 'cartographer'] }, problem: { type: 'STRING' } }, required: ['agent', 'problem'] },
    },
  },
  required: ['approved', 'problems'],
};

const CAST_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    modules: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { type: { type: 'STRING', enum: [...FORGE_KINDS] }, request: { type: 'STRING' } }, required: ['type', 'request'] },
    },
  },
  required: ['modules'],
};

interface RawStyle {
  style: string;
  shapes: string;
  palette: string[];
  light: string;
  rules: string[];
  protagonist: string;
  common_houses?: string;
}

interface RawTerrain {
  code: string;
  name: string;
  description: string;
  color: string;
  layer: TerrainLayer;
  solid: boolean;
  speed: number;
  /** The specks of its ground (T547, ADR-0267), if the Cartographer said them: read without trusting (`readGrain`). */
  grain?: unknown;
  /** How much lower or higher its top is drawn (T548, ADR-0270), if the Cartographer said it: read without trusting (`readInset`). */
  inset?: unknown;
  /** What the Physicist said of it (T437, ADR-0224): how a body crosses it, how tiring the water is, how deep; whether one breathes on it (T446). */
  cross?: Crossing;
  fatigue?: number;
  depth?: string;
  air?: boolean;
}

export function styleMarkdown(s: RawStyle): string {
  return [
    `# Guida di stile`,
    `Stile: ${s.style}`,
    `Forme: ${s.shapes}`,
    `Luce: ${s.light}`,
    `Palette: ${(s.palette ?? []).join(', ')}`,
    `Regole:\n${(s.rules ?? []).map((r) => `- ${r}`).join('\n')}`,
    `Protagonista: ${s.protagonist}`,
  ].join('\n');
}

export function terrainErrors(terrains: RawTerrain[]): string[] {
  const errors: string[] = [];
  const codes = terrains.map((t) => t.code);
  for (const [code, b] of Object.entries(BASE_CODES)) if (!codes.includes(code)) errors.push(`manca il codice "${code}" (${b.meaning})`);
  for (const t of terrains) {
    if (typeof t.code !== 'string' || t.code.length !== 1 || '?*/[]~'.includes(t.code)) errors.push(`codice non valido "${t.code}"`);
    if (!/^#[0-9a-f]{6}$/i.test(t.color)) errors.push(`colore non valido per ${t.code}: ${t.color}`);
  }
  if (new Set(codes).size !== codes.length) errors.push('codici duplicati');
  if (terrains.length > 24) errors.push('al massimo 24 terreni');
  return errors;
}

/**
 * The grain the Cartographer said of a terrain (T547, ADR-0267), read without trusting: only of the ground one walks, none if it is not one.
 * Unsaid, the terrain takes the one its name says when it is drawn (`grainOf`): nothing is written for it.
 */
function grainField(layer: TerrainLayer, raw: unknown): { grain?: Grain } {
  if (layer !== 'ground') return {};
  const g = readGrain(raw);
  return g ? { grain: g } : {};
}

/**
 * The inset the Cartographer said of a terrain (T548, ADR-0270), read without trusting: only of the ground one walks and never of the base
 * ground (the level of the world). Unsaid, the terrain takes the one its name says when it is drawn (`insetOf`): nothing is written for it.
 */
function insetField(code: string, layer: TerrainLayer, raw: unknown): { inset?: number } {
  if (layer !== 'ground' || code === BASE_GROUND) return {};
  const v = readInset(raw);
  return v !== undefined ? { inset: v } : {};
}

/** Outdoor floors (bridges, piers, boardwalks): `layer: 'floor'` without `indoor: true`, so `findLots` never turns them into buildings (T505, ADR-0064, ADR-0230). */
const OUTDOOR_FLOOR_RE = /ponte|levatoi|bridge|passerell|molo|pontil|banchin|tavolat|pier|jetty|dock|boardwalk|wharf|quay/i;

/**
 * The base codes keep their meaning whatever the models say: the engine depends on them. How a body crosses every terrain, its pace, the
 * fatigue and the depth of its water are written by `physicsOf` (T437, ADR-0224), within the kernel's limits: the water codes are swum.
 * With `trueRelief` (T475, ADR-0256), `k` is walkable mountain rock (`layer: 'ground', solid: false, cross: 'walk'`, no boulder model).
 */
export function toPalette(terrains: RawTerrain[], trueRelief = false): Record<string, TerrainDef> {
  const codes = baseCodesFor(trueRelief);
  return Object.fromEntries(
    terrains.map((t) => {
      const base = codes[t.code];
      const layer = base?.layer ?? t.layer ?? (t.solid ? 'rock' : 'ground');
      const physics = physicsOf(layer, t, base?.cross, WATER_CODES[t.code]);
      // What stands on woods and rocks is a model of its own, which the Sculptor writes from the description.
      const model = layer === 'vegetation' || layer === 'rock' ? { model: `terreno-${t.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || t.code.charCodeAt(0)}` } : {};
      const indoor = base?.indoor || (layer === 'floor' && !OUTDOOR_FLOOR_RE.test(t.name));
      // The air (T446): only the Physicist's false, never of a base code (one breathes over the water and on the ground of every world).
      return [t.code, { name: t.name, description: t.description, color: t.color.toLowerCase(), ...physics, layer, ...model, ...(indoor ? { indoor: true } : {}), ...(!base && t.air === false ? { air: false } : {}), ...grainField(layer, t.grain), ...insetField(t.code, layer, t.inset) }];
    }),
  );
}

/** How the kernel tries an environment (`validateLayout` on the drafts of trial); `strata`, the terrains of the strata its program may write (T478). */
export type LayoutCheck = (id: string, def: EnvironmentDef, palette: Record<string, TerrainDef>, strata?: Record<string, TerrainDef>) => string[];

/**
 * What came with the cards before the Genesis (T295, ADR-0170), as its agents are told: the Artist every model and sound by name and class
 * (they stay as they are: the guide welcomes them), the Cartographer the music by the environments it plays in, the Narrator the figures
 * and things it may cast by name. Never the universes they come from: inside the world nothing comes from elsewhere.
 */
export interface GenesisBrought {
  all: Array<{ name: string; class: string }>;
  music: Array<{ name: string; environments: string[] }>;
  cast: Array<{ name: string; class: string }>;
}

const listed = (xs: Array<{ name: string; class: string }>, n = 40) => xs.slice(0, n).map((x) => `«${x.name}» (${x.class})`).join(', ');

export async function planGenesis(c: Council, theme: string, base: FileMap, checkLayout: LayoutCheck, brought?: GenesisBrought, geography?: Geography, breath = false, trueRelief = false, climates: readonly Climate[] = CLIMATES): Promise<GenesisPlan> {
  const data = { theme };
  const baseCodes = baseCodesFor(trueRelief, climates);
  // The fields of the bible are those of the file (English since T310b); `storia` of an answer of before is `history` here, not in internalAnswer.
  const askBible = async (feedback = ''): Promise<Bible> =>
    internalFields('bible', await c.ask<Bible>(
      'narrator',
      'genesis.bible',
      `Create the bible of a new universe from this theme:\n${theme}\n\nFor those who live in it the world is real (see the principles). Write a simple, concrete world, made of people and trades, in the age the theme says: the tone and the summary say it clearly (the technology, what a town is like), because the others will work from there. The runes are as the canon tells them: add nothing. List 6-10 places, 4-6 characters with concrete trades, 6-10 facts, 2-4 legends told by the people (stories of people, beasts, gods, the powerful of the past: never about the world itself, nor about the runes beyond the canon). People speak and behave as the lexicon says: use it where it comes naturally, without explaining it; in "usanze" at most 3 customs or sayings of this world, that do not contradict the lexicon and add no words that replace others.${feedback ? `\nThe Arbiter objected: ${feedback}` : ''}`,
      BIBLE_SCHEMA,
      { data },
    ));
  const askStyle = (bible: Bible, feedback = '') =>
    c.ask<RawStyle>(
      'artist',
      'genesis.style',
      `Write the style guide for all the models of this universe: it is a 3D game where everything (people, animals, trees, rocks, things, buildings) is a voxel model (20 voxels per tile) built by a program of rules, seen from above in 3/4. The world is drawn like a cartoon: flat bands of light and a dark outline where the part changes. Say the style (simple and readable from afar), the shapes and proportions (squat and simplified), the palette (a muted, light environment, few saturated accents on the things that matter), the light, 3-6 rules (among them: one solid colour per part, neighbouring parts well apart in light and dark, details as dark marks) and the look of the protagonist, all in the age of the theme. In "common_houses", only if the common houses of this age are not cottages of stone, wood and straw, say in one sentence what they are like (a block of flats with balconies, a tin shack with a sign); otherwise leave it empty.${brought?.all.length ? `\nSome models of the library were made before this guide and stay as they are: ${listed(brought.all)}. Let the palette and the shapes welcome them, without naming them in the guide.` : ''}\nTheme: ${theme}\nTitle: ${bible.title}\nTone: ${bible.tone}\nSummary: ${bible.summary}${feedback ? `\nThe Arbiter objected: ${feedback}` : ''}`,
      STYLE_SCHEMA,
      { data: { ...data, bible } },
    );
  const askTerrain = (bible: Bible, style: RawStyle, feedback = '') =>
    c.ask<{ terrains: RawTerrain[]; roof: string }>(
      'cartographer',
      'genesis.terrain',
      `Define 14-20 kinds of terrain for the maps of this universe, outdoor and indoor, of its age.\nTheme: ${theme}\nTone: ${bible.tone}\nPlaces: ${bible.places.join('; ')}\nStyle: ${style.style}; palette ${style.palette.join(', ')}\nRequired codes (one character each), adapted to the theme:\n${Object.entries(baseCodes).map(([k, v]) => `- ${k}: ${v.meaning} [layer ${v.layer}]`).join('\n')}\nAdd others (one character), what exists in the theme: in a village tilled fields, mud, stone wall, straw, fence, drawbridge; in a city asphalt, rails, concrete, glass, sheet metal, wire fence; on the frontier planks, packed dirt, corral; on islands planks (for the piers), a reef (rock just under the water), coral, rigging; on a far world regolith, ice, glass of the greenhouses; anywhere lava, carpet. Colours well apart from each other.${feedback ? `\nTo fix: ${feedback}` : ''}`,
      TERRAIN_SCHEMA,
      // The geography for the local models only (T540): the offline palette of an archipelago has the seed's pier and reef.
      { data: { ...data, bible, geography } },
    );

  // A bible of the world, not of the Council's table: asked once more if it breaks the fourth wall, then cleaned.
  const worldBible = async (feedback = '') => {
    const words = wordsOf(base);
    let b = await askBible(feedback);
    const breaks = bibleBreaks(b, words);
    if (breaks.length) {
      const why = `rompe la quarta parete, duplica le rune o spiega il lessico come un glossario: ${breaks.slice(0, 4).join('; ')}. Dentro il mondo nessuno sa di essere in un gioco.`;
      c.say('kernel', 'scarta', why, 'narrator');
      b = await askBible([feedback, why].filter(Boolean).join('; '));
    }
    return cleanBible(b, words);
  };
  let bible = await worldBible();
  c.say('narrator', 'propone', `«${bible.title}» — ${bible.summary}`);
  let style = await askStyle(bible);
  c.say('artist', 'propone', `${style.style}; ${style.shapes}; luce ${style.light}`);
  let terrain = await askTerrain(bible, style);
  let errs = terrainErrors(terrain.terrains);
  if (errs.length) {
    c.say('kernel', 'scarta', errs.join('; '), 'cartographer');
    terrain = await askTerrain(bible, style, errs.join('; '));
    errs = terrainErrors(terrain.terrains);
  }
  if (!errs.length) c.say('cartographer', 'propone', terrain.terrains.map((t) => `${t.code}=${t.name}`).join(', '));

  // The Physicist decides how a body crosses each terrain, and how fast (T437, ADR-0224): within the kernel's limits, which `toPalette` keeps.
  if (!errs.length) {
    const fixedLine = trueRelief
      ? 'Fixed rules: g, p, s, n, k, f, d are walked (k is bare mountain rock, walkable on terraces and ridges); t, j, r, h are not crossed; w (shallow) and o (deep) are swum: of them say only the pace and the fatigue.'
      : 'Fixed rules: g, p, s, n, f, d are walked; t, j, r, k, h are not crossed; w (shallow) and o (deep) are swum: of them say only the pace and the fatigue.';
    const phys = await c.ask<{ terrains: Array<{ code: string; cross?: Crossing; solid?: boolean; speed?: number; fatigue?: number; depth?: string; air?: unknown; note?: string }> }>(
      'physicist',
      'genesis.physics',
      `Review the physics of these terrains: how a body crosses each one (walk, swim or none) and at what pace (a multiplier: on foot ${TERRAIN_LIMITS.walkPace.join('-')}, swimming ${TERRAIN_LIMITS.swimPace.join('-')}); where one swims, how many times the energy it costs against walking (${TERRAIN_LIMITS.fatigue.join('-')}) and whether the water is shallow, deep or a reef (rock just under the surface: one swims over it, no hull floats on it).\n${terrain.terrains.map((t) => `${t.code} ${t.name} [${t.layer}]: ${t.description} (solid=${t.solid}, speed=${t.speed})`).join('\n')}\n${fixedLine} Walls, vegetation and rock are never crossed, floors and doors always walked; other ground is walked or not; another liquid is swum or not (lava, tar: none).${breath ? PHYS_BREATH : ''}`,
      breath ? PHYS_SCHEMA_BREATH : PHYS_SCHEMA,
      { data: { terrains: terrain.terrains } },
    );
    for (const p of phys.terrains ?? []) {
      const t = terrain.terrains.find((x) => x.code === p.code);
      const base = t && baseCodes[t.code];
      // Of a base code only the water's pace and fatigue are the Physicist's; the rest is the kernel's.
      if (!t || (base && base.cross !== 'swim')) continue;
      const was = physicsOf(base ? base.layer : t.layer, t, base ? base.cross : undefined, WATER_CODES[t.code]);
      // An answer of before (`solid`, no `cross`) still says whether it is walked.
      const cross = p.cross ?? (p.solid === true ? 'none' : p.solid === false ? 'walk' : undefined);
      if (!base && cross) t.cross = cross;
      if (typeof p.speed === 'number') t.speed = p.speed;
      if (typeof p.fatigue === 'number') t.fatigue = p.fatigue;
      if (!base && typeof p.depth === 'string') t.depth = p.depth;
      if (breath && !base && p.air === false) t.air = false;
      const now = physicsOf(base ? base.layer : t.layer, t, base ? base.cross : undefined, WATER_CODES[t.code]);
      if (now.cross !== was.cross || now.speed !== was.speed || now.fatigue !== was.fatigue) c.say('physicist', 'corregge', `${t.name}: ${now.cross === 'walk' ? 'calpestabile' : now.cross === 'swim' ? 'si nuota' : 'invalicabile'}, velocità ×${now.speed}${p.note ? ` — ${p.note}` : ''}`, 'cartographer');
    }
  }
  const palette = errs.length ? (JSON.parse(base['modules/world.terrain/manifest.json']).tiles as Record<string, TerrainDef>) : toPalette(terrain.terrains, trueRelief);

  // The Arbiter checks that the story, the look and the land agree.
  const review = await c.ask<{ approved: boolean; problems: Array<{ agent: AgentId; problem: string }> }>(
    'arbiter',
    'genesis.review',
    `Check that the bible, the style guide and the terrains of this newborn universe agree. Point out only concrete contradictions.\nBible: ${JSON.stringify(bible)}\nStyle: ${JSON.stringify(style)}\nTerrains: ${JSON.stringify(terrain.terrains)}`,
    REVIEW_SCHEMA,
    { data: { bible, style, terrains: terrain.terrains }, temperature: 0.2 },
  );
  if (review.approved || !review.problems?.length) c.say('arbiter', 'approva', 'Storia, aspetto e terreni sono coerenti.');
  else {
    for (const p of review.problems.slice(0, 4)) c.say('arbiter', 'obietta', p.problem, p.agent);
    const issues = (a: AgentId) => review.problems.filter((p) => p.agent === a).map((p) => p.problem).join('; ');
    if (issues('narrator')) {
      bible = await worldBible(issues('narrator'));
      c.say('narrator', 'corregge', bible.summary);
    }
    if (issues('artist')) {
      style = await askStyle(bible, issues('artist'));
      c.say('artist', 'corregge', style.style);
    }
  }

  // Environments: the Cartographer writes them as rewrite programs; the kernel test-runs each one.
  const layouts: Record<string, EnvironmentDef> = {};
  let feedback = '';
  for (let round = 0; round < 2 && Object.keys(layouts).length < 4; round++) {
    const designed = await designLayouts(c, palette, feedback, brought?.music, geography, breath);
    const problems: string[] = [];
    for (const d of designed) {
      if ('error' in d) {
        problems.push(d.error);
        continue;
      }
      const notes: string[] = [];
      const repaired = repairProgram(d.def.program, notes);
      if (!repaired) {
        problems.push(`${d.id}: nessuna regola comprensibile`);
        continue;
      }
      if (notes.length) c.say('kernel', 'corregge', `${d.id}: ${notes.slice(0, 3).join('; ')}`, 'cartographer');
      d.def.program = repaired;
      const e = checkLayout(d.id, d.def, palette);
      if (e.length) problems.push(...e);
      else layouts[d.id] = d.def;
    }
    feedback = problems.join('; ');
    c.say('cartographer', 'propone', `ambienti: ${Object.values(layouts).map((l) => l.name).join(', ') || 'nessuno valido'}`);
    if (problems.length) c.say('kernel', 'scarta', problems.slice(0, 3).join('; '), 'cartographer');
  }

  // What lies under the ground (T478, ADR-0249): the terrains of the strata and, for each environment, the program of its strata.
  const under = Object.keys(layouts).length ? await designStrata(c, layouts, palette, checkLayout, theme) : { strata: {}, programs: {} };
  for (const [id, program] of Object.entries(under.programs)) layouts[id]!.strata = program;

  const cast = await c.ask<{ modules: Array<{ type?: string; request?: string }> }>(
    'narrator',
    'genesis.cast',
    `Choose the first inhabitants and the first things of «${bible.title}»: 5 npcs very different from each other (at least 3 people of different trades, ages and genders, and 1 animal; none the same as another), 5 objects that stand in the world (at least 3 pieces of furniture or containers, as its age has them: bed, cupboard, chest, workbench…, and 1-2 outdoor things to do something with: well, altar, bonfire, booth, vending machine…), 2 special tools ("type": npc, object, item). For each one a one-sentence request for the Forge, consistent with the bible.${brought?.cast.length ? ` These already have their look: ${listed(brought.cast, 30)}; when one fits this world, ask for it with exactly its name.` : ''}`,
    CAST_SCHEMA,
    // The geography for the local models only (T540): the offline cast of an archipelago has a chest and a boat.
    { data: { bible, geography } },
  );
  // A kind in the Italian of the contract 0.6 (`strumento`) is still the one it means.
  const moduli: CastEntry[] = (Array.isArray(cast.modules) ? cast.modules : []).flatMap((m) => {
    const type = internalName('tipi-fucina', String(m?.type ?? ''));
    return m?.request && (FORGE_KINDS as readonly string[]).includes(type) ? [{ type: type as ForgeKind, request: String(m.request) }] : [];
  });
  c.say('narrator', 'propone', `Primi abitanti e cose: ${moduli.map((m) => m.request).join(' · ')}`);

  const files: FileMap = {
    'world/bible.json': JSON.stringify(bible, null, 2) + '\n',
    'world/style.md': styleMarkdown(style) + '\n',
    'prompts/theme.md': theme.trim() + '\n',
  };
  const terrainPath = 'modules/world.terrain/manifest.json';
  const tm = JSON.parse(base[terrainPath]);
  tm.tiles = palette;
  if (/^#[0-9a-f]{6}$/i.test(terrain.roof ?? '')) tm.roof = { color: terrain.roof.toLowerCase() };
  // Common houses of their own only where the seed's cottages would not fit (ADR-0134): a world of cottages keeps the seed's.
  const house = typeof style.common_houses === 'string' ? style.common_houses.trim().slice(0, 200) : '';
  if (house && !metaBreak(house, wordsOf(base))) tm.commonHouse = house;
  else delete tm.commonHouse;
  // The strata of this world (T478), where the Cartographer wrote some that are good, under them the seed's (`strataPalette`); else the seed's.
  tm.strata = Object.keys(under.strata).length ? under.strata : { ...SEED_STRATA };
  files[terrainPath] = JSON.stringify(tm, null, 2) + '\n';
  if (Object.keys(layouts).length >= 1) {
    const lp = 'modules/world.layouts/manifest.json';
    const lm = JSON.parse(base[lp]);
    // Too few environments make a monotonous world: previous ones that fit any age and the new terrains stay.
    const keep = Object.keys(layouts).length < 3 ? Object.entries<EnvironmentDef>(lm.layouts ?? {}).filter(([id, def]) => TIMELESS_LAYOUTS.has(id) && !layouts[id] && !checkLayout(id, def, palette).length) : [];
    lm.layouts = { ...layouts, ...Object.fromEntries(keep) };
    files[lp] = JSON.stringify(lm, null, 2) + '\n';
  }
  return { files, cast: moduli.slice(0, 14), wandererPrompt: style.protagonist, palette };
}

// ---------------------------------------------------------------------------------------------------------------- the strata (T478)

/** Kinds of earth and rock the Cartographer writes under the ground of a world at most (T478): with the seed's, within `strataErrors`' 16. */
export const MAX_OWN_STRATA = 8;

const STRATA_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    strata: {
      type: 'ARRAY',
      description: `4-${MAX_OWN_STRATA} kinds of earth and rock under the ground of this world`,
      items: {
        type: 'OBJECT',
        properties: {
          code: { type: 'STRING', description: 'one uppercase letter other than E, not a code of the terrains' },
          name: { type: 'STRING' },
          description: { type: 'STRING', description: 'what it is like: material, colour, what is in it' },
          color: { type: 'STRING', description: 'hexadecimal #rrggbb, well apart from the others' },
          role: { type: 'STRING', enum: [...STRATUM_ROLES, 'other'] },
        },
        required: ['code', 'name', 'description', 'color', 'role'],
      },
    },
    environments: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { id: { type: 'STRING' }, program: { type: 'STRING', description: 'the MarkovJunior XML that says what lies under what in its places' } },
        required: ['id', 'program'],
      },
    },
  },
  required: ['strata', 'environments'],
};

/** The codes of the procedural draft, as the request of the strata tells them: what the top layer of a program holds. */
const DRAFT_LINE = 'g (grass, earth), p (path), t (wood), j (jungle), n (snow), s (sand), w (shallow water), o (sea), r (rock), k (mountain)';

/**
 * The terrains of the strata the Cartographer wrote (T478), read without trusting them: one uppercase letter each but E (the earth not yet
 * decided of the programs, the seed's too), not a code of the terrains and not twice, good as a stratum (`strataErrors`), a role of the draft
 * at most once (its `id`, so the draft takes it: `roleCodes`); at most `MAX_OWN_STRATA`. What is left out, and why.
 */
export function ownStrata(raw: unknown, palette: Record<string, TerrainDef>): { strata: Record<string, TerrainDef>; problems: string[] } {
  const strata: Record<string, TerrainDef> = {};
  const problems: string[] = [];
  const roles = new Set<string>();
  for (const s of Array.isArray(raw) ? raw.slice(0, MAX_OWN_STRATA * 2) : []) {
    const t = (s && typeof s === 'object' ? s : {}) as { code?: unknown; name?: unknown; description?: unknown; color?: unknown; role?: unknown };
    const code = typeof t.code === 'string' ? t.code.trim() : '';
    if (!/^[A-Z]$/.test(code) || code === 'E') {
      problems.push(`strato «${String(t.name ?? t.code)}»: il codice è una lettera maiuscola, non E (la terra ancora da decidere dei programmi)`);
      continue;
    }
    if (palette[code] || strata[code]) {
      problems.push(`strato ${code}: il codice è già ${palette[code] ? 'un terreno' : 'un altro strato'}`);
      continue;
    }
    const role = typeof t.role === 'string' && (STRATUM_ROLES as readonly string[]).includes(t.role) && !roles.has(t.role) ? t.role : undefined;
    const def: TerrainDef = {
      ...(role ? { id: role } : {}),
      name: typeof t.name === 'string' ? t.name.trim().slice(0, 40) : '',
      description: typeof t.description === 'string' ? t.description.trim().slice(0, 200) : '',
      color: typeof t.color === 'string' ? t.color.trim().toLowerCase() : '',
      solid: true,
      layer: 'stratum',
    };
    const errs = strataErrors({ [code]: def });
    if (errs.length) {
      problems.push(errs[0]!);
      continue;
    }
    if (Object.keys(strata).length >= MAX_OWN_STRATA) break;
    if (role) roles.add(role);
    strata[code] = def;
  }
  return { strata, problems };
}

/**
 * Genesis (T478, ADR-0249): the Cartographer writes the terrains of the strata of this world and, for each environment, the program that says
 * what lies under what in its places. The strata of its first answer stay (of the second only if the first had none); each program is tried as
 * the world runs it (`checkLayout` with the strata, `strataProgramErrors`) and goes back once with the reasons; one still invalid is left out,
 * and that environment's places have the draft's strata. Nothing of it stops the Genesis: without strata of its own the world has the seed's.
 */
export async function designStrata(
  c: Council,
  layouts: Record<string, EnvironmentDef>,
  palette: Record<string, TerrainDef>,
  checkLayout: LayoutCheck,
  theme: string,
): Promise<{ strata: Record<string, TerrainDef>; programs: Record<string, string> }> {
  let own: Record<string, TerrainDef> = {};
  const programs: Record<string, string> = {};
  let wanted = Object.keys(layouts);
  let feedback = '';
  for (let round = 0; round < 2 && wanted.length; round++) {
    const fixed = Object.keys(own).length ? own : undefined;
    const raw = await c.ask<{ strata?: unknown; environments?: Array<{ id?: unknown; program?: unknown }> }>(
      'cartographer',
      'genesis.strata',
      [
        `Write what lies under the ground of this world, of its land and its age: the strata (4-${MAX_OWN_STRATA} kinds of earth and rock the cuts under the ground show: under the steppe the loess, under the volcano the basalt, under the marsh the peat) and, for each environment, a short program that says what lies under what in its places.`,
        fixed
          ? `The strata are these; keep them as they are: ${Object.entries(fixed).map(([k, t]) => `${k} ${t.name}${t.id ? ` (${t.id})` : ''}`).join(', ')}.`
          : 'Each stratum: a code (one uppercase letter other than E, not a code of the terrains), a name and a description in the language of the world, a colour #rrggbb well apart from the others, and its role if it plays one: topsoil (the earth under meadows and woods), clay (the earth under it), sandbed (under the sand), mud (under the waters), bedrock (what everything rests on, at the bottom); other for the rest (water in the gravel, a vein of ore, roots, ash).',
        `Each program is MarkovJunior XML in 3D on the tiles of a place, ${STRATA_DEPTH} rows deep under a top layer. The kernel writes the top layer, each column's ground in the draft of nature, one of ${DRAFT_LINE}; every cell under it starts as the root's first value, the earth not decided yet. A rule is two layers separated by a space, the upper one first: <all in="g E" out="g T"/> is «under the grass, the topsoil T»; "*" in out keeps the cell; two cells side by side in a layer are written together ("VB"). Use only one, all and prl (with p and steps) inside a sequence or a markov, and <union symbol="?" values="gtj"/> for a set of codes. The root is <sequence values="E…" symmetry="(xy)">: E first (neither a terrain nor a stratum), then the codes it reads and the strata it writes; symmetry="(xy)" keeps the up and the down. Under the surface write only strata: a cell left undecided is the kernel's (earth, clay, rock).`,
        `Example, with the codes of its strata (T topsoil, C clay, A packed sand, M mud, B bedrock, V a vein):\n${STRATA_EXAMPLE}`,
        'Make the underground of each environment its own (under the village the potters\' clay and the water of the wells, under the desert sand deep down, in the mountains the rock right under the ground, under the lake the mud, under coastal waters sandbed in the shallows, mud in the deep sea and bedrock on reefs), 5-15 rules each.',
        `Environments:\n${wanted.map((id) => `- ${id}: ${layouts[id]!.name} — ${layouts[id]!.description}`).join('\n')}`,
        `Terrains of the maps (not strata): ${paletteLine(palette)}`,
        feedback && `SOME PROGRAMS WERE INVALID, fix them: ${feedback}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      STRATA_SCHEMA,
      { data: { theme, environments: wanted.map((id) => ({ id, name: layouts[id]!.name, description: layouts[id]!.description })), strata: fixed ?? null, feedback }, temperature: 0.5 },
    );
    if (!fixed) {
      const read = ownStrata(raw.strata, palette);
      own = read.strata;
      if (read.problems.length) c.say('kernel', 'scarta', read.problems.slice(0, 3).join('; '), 'cartographer');
      if (Object.keys(own).length) c.say('cartographer', 'propone', `strati: ${Object.entries(own).map(([k, t]) => `${k}=${t.name}`).join(', ')}`);
    }
    const all = strataPalette(own);
    const problems: string[] = [];
    for (const e of Array.isArray(raw.environments) ? raw.environments : []) {
      const id = typeof e?.id === 'string' ? e.id : '';
      if (!wanted.includes(id) || programs[id] || typeof e.program !== 'string') continue;
      const errs = checkLayout(id, { ...layouts[id]!, strata: e.program }, palette, all);
      if (errs.length) problems.push(...errs.slice(0, 2));
      else programs[id] = e.program;
    }
    wanted = wanted.filter((id) => !programs[id]);
    feedback = problems.join('; ');
    if (problems.length) c.say('kernel', 'scarta', problems.slice(0, 3).join('; '), 'cartographer');
  }
  if (Object.keys(programs).length) c.say('cartographer', 'propone', `sottosuolo di ${Object.keys(programs).map((id) => layouts[id]!.name).join(', ')}`);
  return { strata: own, programs };
}

/** The terrains of the maps in one line, for the request of the strata: their codes, not to be taken for strata. */
function paletteLine(palette: Record<string, TerrainDef>): string {
  return Object.entries(palette)
    .filter(([k]) => k !== '?')
    .map(([k, t]) => `${k} ${t.name}`)
    .join(', ');
}
