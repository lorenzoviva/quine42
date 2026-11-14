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

/** Codes the procedural draft and the kernel rely on: every palette must define them. */
export const BASE_CODES: Record<string, { meaning: string; layer: TerrainLayer; solid: boolean; indoor?: boolean }> = {
  g: { meaning: 'walkable base ground (grass, sand, earth…)', layer: 'ground', solid: false },
  p: { meaning: 'path or road (also the paths the kernel digs)', layer: 'ground', solid: false },
  t: { meaning: 'vegetation that blocks the way (trees, brambles…)', layer: 'vegetation', solid: true },
  w: { meaning: 'water or uncrossable liquid', layer: 'liquid', solid: true },
  r: { meaning: 'uncrossable rock, relief or rubble', layer: 'rock', solid: true },
  h: { meaning: 'wall of the buildings', layer: 'wall', solid: true },
  f: { meaning: 'inner floor of the buildings', layer: 'floor', solid: false, indoor: true },
  d: { meaning: 'door or threshold', layer: 'door', solid: false },
  // Biomes of the procedural draft (world.terrain): they must exist in every world.
  s: { meaning: 'dry walkable ground (sand, desert, beach)', layer: 'ground', solid: false },
  j: { meaning: 'very thick, uncrossable vegetation of hot climates (jungle)', layer: 'vegetation', solid: true },
  o: { meaning: 'deep water of the sea or the ocean', layer: 'liquid', solid: true },
  k: { meaning: 'mountain, uncrossable walls', layer: 'rock', solid: true },
  n: { meaning: 'cold walkable, slow ground (snow, frost)', layer: 'ground', solid: false },
};

/** The seed's environments that belong to no age (ADR-0134): a Genesis that wrote too few keeps these, not a castle in a city of neon. */
const TIMELESS_LAYOUTS = new Set(['woods', 'fields', 'ruins', 'dungeon', 'desert', 'jungle', 'mountains', 'lake']);

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
        },
        required: ['code', 'name', 'description', 'color', 'layer', 'solid', 'speed'],
      },
    },
    roof: { type: 'STRING', description: 'colour #rrggbb of the roofs of the buildings' },
  },
  required: ['terrains', 'roof'],
};

const PHYS_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    terrains: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { code: { type: 'STRING' }, solid: { type: 'BOOLEAN' }, speed: { type: 'NUMBER' }, note: { type: 'STRING' } }, required: ['code', 'solid', 'speed'] },
    },
  },
  required: ['terrains'],
};

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
    if (typeof t.code !== 'string' || t.code.length !== 1 || '?*/[]'.includes(t.code)) errors.push(`codice non valido "${t.code}"`);
    if (!/^#[0-9a-f]{6}$/i.test(t.color)) errors.push(`colore non valido per ${t.code}: ${t.color}`);
  }
  if (new Set(codes).size !== codes.length) errors.push('codici duplicati');
  if (terrains.length > 24) errors.push('al massimo 24 terreni');
  return errors;
}

/** The base codes keep their meaning whatever the models say: the engine depends on them. */
export function toPalette(terrains: RawTerrain[]): Record<string, TerrainDef> {
  return Object.fromEntries(
    terrains.map((t) => {
      const base = BASE_CODES[t.code];
      const layer = base?.layer ?? t.layer ?? (t.solid ? 'rock' : 'ground');
      const solid = base ? base.solid : layer === 'wall' || layer === 'liquid' || layer === 'vegetation' || layer === 'rock' ? true : layer === 'floor' || layer === 'door' ? false : !!t.solid;
      // What stands on woods and rocks is a model of its own, which the Sculptor writes from the description.
      const model = layer === 'vegetation' || layer === 'rock' ? { model: `terreno-${t.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || t.code.charCodeAt(0)}` } : {};
      return [t.code, { name: t.name, description: t.description, color: t.color.toLowerCase(), solid, layer, ...model, ...(base?.indoor || layer === 'floor' ? { indoor: true } : {}), speed: Math.min(1.5, Math.max(0.3, Number(t.speed) || 1)) }];
    }),
  );
}

export type LayoutCheck = (id: string, def: EnvironmentDef, palette: Record<string, TerrainDef>) => string[];

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

export async function planGenesis(c: Council, theme: string, base: FileMap, checkLayout: LayoutCheck, brought?: GenesisBrought): Promise<GenesisPlan> {
  const data = { theme };
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
      `Define 14-20 kinds of terrain for the maps of this universe, outdoor and indoor, of its age.\nTheme: ${theme}\nTone: ${bible.tone}\nPlaces: ${bible.places.join('; ')}\nStyle: ${style.style}; palette ${style.palette.join(', ')}\nRequired codes (one character each), adapted to the theme:\n${Object.entries(BASE_CODES).map(([k, v]) => `- ${k}: ${v.meaning} [layer ${v.layer}]`).join('\n')}\nAdd others (one character), what exists in the theme: in a village tilled fields, mud, stone wall, straw, fence, drawbridge; in a city asphalt, rails, concrete, glass, sheet metal, wire fence; anywhere lava, carpet. Colours well apart from each other.${feedback ? `\nTo fix: ${feedback}` : ''}`,
      TERRAIN_SCHEMA,
      { data: { ...data, bible } },
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

  // The Physicist decides what can be walked on, and how fast.
  if (!errs.length) {
    const phys = await c.ask<{ terrains: Array<{ code: string; solid: boolean; speed: number; note?: string }> }>(
      'physicist',
      'genesis.physics',
      `Review the physics of these terrains: what can be crossed and at what speed (a multiplier of 0.3-1.5).\n${terrain.terrains.map((t) => `${t.code} ${t.name} [${t.layer}]: ${t.description} (solid=${t.solid}, speed=${t.speed})`).join('\n')}\nFixed rules: g, p, f, d walkable; w, t, r, h uncrossable.`,
      PHYS_SCHEMA,
      { data: { terrains: terrain.terrains } },
    );
    for (const p of phys.terrains ?? []) {
      const t = terrain.terrains.find((x) => x.code === p.code);
      if (!t || BASE_CODES[t.code]) continue;
      if (t.solid !== p.solid || t.speed !== p.speed) c.say('physicist', 'corregge', `${t.name}: ${p.solid ? 'invalicabile' : 'calpestabile'}, velocità ×${p.speed}${p.note ? ` — ${p.note}` : ''}`, 'cartographer');
      t.solid = p.solid;
      t.speed = p.speed;
    }
  }
  const palette = errs.length ? (JSON.parse(base['modules/world.terrain/manifest.json']).tiles as Record<string, TerrainDef>) : toPalette(terrain.terrains);

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
    const designed = await designLayouts(c, palette, feedback, brought?.music);
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

  const cast = await c.ask<{ modules: Array<{ type?: string; request?: string }> }>(
    'narrator',
    'genesis.cast',
    `Choose the first inhabitants and the first things of «${bible.title}»: 5 npcs very different from each other (at least 3 people of different trades, ages and genders, and 1 animal; none the same as another), 5 objects that stand in the world (at least 3 pieces of furniture or containers, as its age has them: bed, cupboard, chest, workbench…, and 1-2 outdoor things to do something with: well, altar, bonfire, booth, vending machine…), 2 special tools ("type": npc, object, item). For each one a one-sentence request for the Forge, consistent with the bible.${brought?.cast.length ? ` These already have their look: ${listed(brought.cast, 30)}; when one fits this world, ask for it with exactly its name.` : ''}`,
    CAST_SCHEMA,
    { data: { bible } },
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
