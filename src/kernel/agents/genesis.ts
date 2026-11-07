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
import { internalFields } from '../internalNames';

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

export interface CastEntry {
  tipo: 'npc' | 'oggetto' | 'strumento';
  richiesta: string;
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
    titolo: { type: 'STRING' },
    tono: { type: 'STRING' },
    sintesi: { type: 'STRING' },
    storia: { type: 'STRING' },
    luoghi: { type: 'ARRAY', items: { type: 'STRING' } },
    personaggi: { type: 'ARRAY', items: { type: 'STRING' } },
    fatti: { type: 'ARRAY', items: { type: 'STRING' } },
    misteri: { type: 'ARRAY', items: { type: 'STRING' }, description: 'legends told by the people of the world (people, beasts, gods, the powerful of the past)' },
    usanze: { type: 'ARRAY', items: { type: 'STRING' }, description: 'at most 3 customs or sayings of this world, that enrich the lexicon without contradicting or explaining it' },
  },
  required: ['titolo', 'tono', 'sintesi', 'storia', 'luoghi', 'personaggi', 'fatti', 'misteri'],
};

const STYLE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    stile: { type: 'STRING' },
    forme: { type: 'STRING', description: 'proportions and shapes of the models (big or realistic heads, squat or slender buildings…)' },
    palette: { type: 'ARRAY', items: { type: 'STRING' } },
    luce: { type: 'STRING' },
    regole: { type: 'ARRAY', items: { type: 'STRING' } },
    protagonista: { type: 'STRING', description: 'what the wanderer (the one who plays) looks like' },
    case_comuni: { type: 'STRING', description: 'what the common houses look like, if they are not cottages of stone, wood and straw; empty otherwise' },
  },
  required: ['stile', 'forme', 'palette', 'luce', 'regole', 'protagonista'],
};

const TERRAIN_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    terreni: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          codice: { type: 'STRING' },
          nome: { type: 'STRING' },
          descrizione: { type: 'STRING', description: 'what it is like: material, colour, details' },
          colore: { type: 'STRING', description: 'hexadecimal #rrggbb, well apart from the others' },
          strato: { type: 'STRING', enum: ['ground', 'floor', 'wall', 'door', 'liquid', 'vegetation', 'rock'] },
          solido: { type: 'BOOLEAN' },
          velocita: { type: 'NUMBER' },
        },
        required: ['codice', 'nome', 'descrizione', 'colore', 'strato', 'solido', 'velocita'],
      },
    },
    tetto: { type: 'STRING', description: 'colour #rrggbb of the roofs of the buildings' },
  },
  required: ['terreni', 'tetto'],
};

const PHYS_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    terreni: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { codice: { type: 'STRING' }, solido: { type: 'BOOLEAN' }, velocita: { type: 'NUMBER' }, nota: { type: 'STRING' } }, required: ['codice', 'solido', 'velocita'] },
    },
  },
  required: ['terreni'],
};

const REVIEW_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    approvato: { type: 'BOOLEAN' },
    problemi: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { agente: { type: 'STRING', enum: ['narrator', 'artist', 'cartographer'] }, problema: { type: 'STRING' } }, required: ['agente', 'problema'] },
    },
  },
  required: ['approvato', 'problemi'],
};

const CAST_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    moduli: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { tipo: { type: 'STRING', enum: ['npc', 'oggetto', 'strumento'] }, richiesta: { type: 'STRING' } }, required: ['tipo', 'richiesta'] },
    },
  },
  required: ['moduli'],
};

interface RawStyle {
  stile: string;
  forme: string;
  palette: string[];
  luce: string;
  regole: string[];
  protagonista: string;
  case_comuni?: string;
}

interface RawTerrain {
  codice: string;
  nome: string;
  descrizione: string;
  colore: string;
  strato: TerrainLayer;
  solido: boolean;
  velocita: number;
}

export function styleMarkdown(s: RawStyle): string {
  return [
    `# Guida di stile`,
    `Stile: ${s.stile}`,
    `Forme: ${s.forme}`,
    `Luce: ${s.luce}`,
    `Palette: ${(s.palette ?? []).join(', ')}`,
    `Regole:\n${(s.regole ?? []).map((r) => `- ${r}`).join('\n')}`,
    `Protagonista: ${s.protagonista}`,
  ].join('\n');
}

export function terrainErrors(terrains: RawTerrain[]): string[] {
  const errors: string[] = [];
  const codes = terrains.map((t) => t.codice);
  for (const [code, b] of Object.entries(BASE_CODES)) if (!codes.includes(code)) errors.push(`manca il codice "${code}" (${b.meaning})`);
  for (const t of terrains) {
    if (typeof t.codice !== 'string' || t.codice.length !== 1 || '?*/[]'.includes(t.codice)) errors.push(`codice non valido "${t.codice}"`);
    if (!/^#[0-9a-f]{6}$/i.test(t.colore)) errors.push(`colore non valido per ${t.codice}: ${t.colore}`);
  }
  if (new Set(codes).size !== codes.length) errors.push('codici duplicati');
  if (terrains.length > 24) errors.push('al massimo 24 terreni');
  return errors;
}

/** The base codes keep their meaning whatever the models say: the engine depends on them. */
export function toPalette(terrains: RawTerrain[]): Record<string, TerrainDef> {
  return Object.fromEntries(
    terrains.map((t) => {
      const base = BASE_CODES[t.codice];
      const layer = base?.layer ?? t.strato ?? (t.solido ? 'rock' : 'ground');
      const solid = base ? base.solid : layer === 'wall' || layer === 'liquid' || layer === 'vegetation' || layer === 'rock' ? true : layer === 'floor' || layer === 'door' ? false : !!t.solido;
      // What stands on woods and rocks is a model of its own, which the Sculptor writes from the description.
      const model = layer === 'vegetation' || layer === 'rock' ? { model: `terreno-${t.nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || t.codice.charCodeAt(0)}` } : {};
      return [t.codice, { name: t.nome, description: t.descrizione, color: t.colore.toLowerCase(), solid, layer, ...model, ...(base?.indoor || layer === 'floor' ? { indoor: true } : {}), speed: Math.min(1.5, Math.max(0.3, Number(t.velocita) || 1)) }];
    }),
  );
}

export type LayoutCheck = (id: string, def: EnvironmentDef, palette: Record<string, TerrainDef>) => string[];

/**
 * What came with the cards before the Genesis (T295, ADR-0169), as its agents are told: the Artist every model and sound by name and class
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
  // The Narrator still writes the bible with the Italian fields of its schema (until T310b): it is read with those of 0.4 (T308a).
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
      `Write the style guide for all the models of this universe: it is a 3D game where everything (people, animals, trees, rocks, things, buildings) is a voxel model (20 voxels per tile) built by a program of rules, seen from above in 3/4. The world is drawn like a cartoon: flat bands of light and a dark outline where the part changes. Say the style (simple and readable from afar), the shapes and proportions (squat and simplified), the palette (a muted, light environment, few saturated accents on the things that matter), the light, 3-6 rules (among them: one solid colour per part, neighbouring parts well apart in light and dark, details as dark marks) and the look of the protagonist, all in the age of the theme. In "case_comuni", only if the common houses of this age are not cottages of stone, wood and straw, say in one sentence what they are like (a block of flats with balconies, a tin shack with a sign); otherwise leave it empty.${brought?.all.length ? `\nSome models of the library were made before this guide and stay as they are: ${listed(brought.all)}. Let the palette and the shapes welcome them, without naming them in the guide.` : ''}\nTheme: ${theme}\nTitle: ${bible.title}\nTone: ${bible.tone}\nSummary: ${bible.summary}${feedback ? `\nThe Arbiter objected: ${feedback}` : ''}`,
      STYLE_SCHEMA,
      { data: { ...data, bible } },
    );
  const askTerrain = (bible: Bible, style: RawStyle, feedback = '') =>
    c.ask<{ terreni: RawTerrain[]; tetto: string }>(
      'cartographer',
      'genesis.terrain',
      `Define 14-20 kinds of terrain for the maps of this universe, outdoor and indoor, of its age.\nTheme: ${theme}\nTone: ${bible.tone}\nPlaces: ${bible.places.join('; ')}\nStyle: ${style.stile}; palette ${style.palette.join(', ')}\nRequired codes (one character each), adapted to the theme:\n${Object.entries(BASE_CODES).map(([k, v]) => `- ${k}: ${v.meaning} [layer ${v.layer}]`).join('\n')}\nAdd others (one character), what exists in the theme: in a village tilled fields, mud, stone wall, straw, fence, drawbridge; in a city asphalt, rails, concrete, glass, sheet metal, wire fence; anywhere lava, carpet. Colours well apart from each other.${feedback ? `\nTo fix: ${feedback}` : ''}`,
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
  c.say('artist', 'propone', `${style.stile}; ${style.forme}; luce ${style.luce}`);
  let terrain = await askTerrain(bible, style);
  let errs = terrainErrors(terrain.terreni);
  if (errs.length) {
    c.say('kernel', 'scarta', errs.join('; '), 'cartographer');
    terrain = await askTerrain(bible, style, errs.join('; '));
    errs = terrainErrors(terrain.terreni);
  }
  if (!errs.length) c.say('cartographer', 'propone', terrain.terreni.map((t) => `${t.codice}=${t.nome}`).join(', '));

  // The Physicist decides what can be walked on, and how fast.
  if (!errs.length) {
    const phys = await c.ask<{ terreni: Array<{ codice: string; solido: boolean; velocita: number; nota?: string }> }>(
      'physicist',
      'genesis.physics',
      `Review the physics of these terrains: what can be crossed and at what speed (a multiplier of 0.3-1.5).\n${terrain.terreni.map((t) => `${t.codice} ${t.nome} [${t.strato}]: ${t.descrizione} (solido=${t.solido}, velocita=${t.velocita})`).join('\n')}\nFixed rules: g, p, f, d walkable; w, t, r, h uncrossable.`,
      PHYS_SCHEMA,
      { data: { terreni: terrain.terreni } },
    );
    for (const p of phys.terreni ?? []) {
      const t = terrain.terreni.find((x) => x.codice === p.codice);
      if (!t || BASE_CODES[t.codice]) continue;
      if (t.solido !== p.solido || t.velocita !== p.velocita) c.say('physicist', 'corregge', `${t.nome}: ${p.solido ? 'invalicabile' : 'calpestabile'}, velocità ×${p.velocita}${p.nota ? ` — ${p.nota}` : ''}`, 'cartographer');
      t.solido = p.solido;
      t.velocita = p.velocita;
    }
  }
  const palette = errs.length ? (JSON.parse(base['modules/world.terrain/manifest.json']).tiles as Record<string, TerrainDef>) : toPalette(terrain.terreni);

  // The Arbiter checks that the story, the look and the land agree.
  const review = await c.ask<{ approvato: boolean; problemi: Array<{ agente: AgentId; problema: string }> }>(
    'arbiter',
    'genesis.review',
    `Check that the bible, the style guide and the terrains of this newborn universe agree. Point out only concrete contradictions.\nBible: ${JSON.stringify(bible)}\nStyle: ${JSON.stringify(style)}\nTerrains: ${JSON.stringify(terrain.terreni)}`,
    REVIEW_SCHEMA,
    { data: { bible, style, terreni: terrain.terreni }, temperature: 0.2 },
  );
  if (review.approvato || !review.problemi?.length) c.say('arbiter', 'approva', 'Storia, aspetto e terreni sono coerenti.');
  else {
    for (const p of review.problemi.slice(0, 4)) c.say('arbiter', 'obietta', p.problema, p.agente);
    const issues = (a: AgentId) => review.problemi.filter((p) => p.agente === a).map((p) => p.problema).join('; ');
    if (issues('narrator')) {
      bible = await worldBible(issues('narrator'));
      c.say('narrator', 'corregge', bible.summary);
    }
    if (issues('artist')) {
      style = await askStyle(bible, issues('artist'));
      c.say('artist', 'corregge', style.stile);
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

  const { moduli } = await c.ask<{ moduli: CastEntry[] }>(
    'narrator',
    'genesis.cast',
    `Choose the first inhabitants and the first things of «${bible.title}»: 5 npcs very different from each other (at least 3 people of different trades, ages and genders, and 1 animal; none the same as another), 5 objects that stand in the world (at least 3 pieces of furniture or containers, as its age has them: bed, cupboard, chest, workbench…, and 1-2 outdoor things to do something with: well, altar, bonfire, booth, vending machine…), 2 special tools. For each one a one-sentence request for the Forge, consistent with the bible.${brought?.cast.length ? ` These already have their look: ${listed(brought.cast, 30)}; when one fits this world, ask for it with exactly its name.` : ''}`,
    CAST_SCHEMA,
    { data: { bible } },
  );
  c.say('narrator', 'propone', `Primi abitanti e cose: ${moduli.map((m) => m.richiesta).join(' · ')}`);

  const files: FileMap = {
    'world/bible.json': JSON.stringify(bible, null, 2) + '\n',
    'world/style.md': styleMarkdown(style) + '\n',
    'prompts/theme.md': theme.trim() + '\n',
  };
  const terrainPath = 'modules/world.terrain/manifest.json';
  const tm = JSON.parse(base[terrainPath]);
  tm.tiles = palette;
  if (/^#[0-9a-f]{6}$/i.test(terrain.tetto ?? '')) tm.roof = { color: terrain.tetto.toLowerCase() };
  // Common houses of their own only where the seed's cottages would not fit (ADR-0134): a world of cottages keeps the seed's.
  const house = typeof style.case_comuni === 'string' ? style.case_comuni.trim().slice(0, 200) : '';
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
  return { files, cast: moduli.slice(0, 14), wandererPrompt: style.protagonista, palette };
}
