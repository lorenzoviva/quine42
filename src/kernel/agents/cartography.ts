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

export type Where = 'dentro' | 'fuori' | 'ovunque';

export interface PlacedObject {
  module: string;
  where: Where;
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
  structures?: Array<{ concept: string; size?: SizeTier }>;
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
  region?: { nome: string; descrizione: string };
  /**
   * The rare sizes a structure here may still have (ADR-0092): Huge one per zone of the world (about a
   * million tiles), Gargantuan one per realm (4 × 4 zones); the kernel enforces it anyway.
   */
  rari?: SizeTier[];
  /** Who pays for the plan (T40): the wanderer who first came to the place. */
  chi?: string;
}

const WHERE: Where[] = ['dentro', 'fuori', 'ovunque'];

const PLAN_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    luogo: { type: 'OBJECT', properties: { nome: { type: 'STRING' }, descrizione: { type: 'STRING' } }, required: ['nome', 'descrizione'] },
    ambiente: { type: 'STRING' },
    oggetti: { type: 'ARRAY', items: { type: 'OBJECT', properties: { modulo: { type: 'STRING' }, dove: { type: 'STRING', enum: WHERE } }, required: ['modulo', 'dove'] } },
    a_terra: { type: 'ARRAY', items: { type: 'STRING' } },
    nuovi: { type: 'ARRAY', items: { type: 'OBJECT', properties: { concetto: { type: 'STRING' }, dove: { type: 'STRING', enum: WHERE }, takeable: { type: 'BOOLEAN' } }, required: ['concetto', 'dove'] } },
    rune: { type: 'ARRAY', items: { type: 'STRING' } },
    strutture: { type: 'ARRAY', items: { type: 'OBJECT', properties: { concetto: { type: 'STRING' }, taglia: { type: 'STRING', enum: internalValues('taglie') } }, required: ['concetto'] } },
  },
  required: ['luogo', 'ambiente', 'oggetti', 'rune'],
};

/**
 * A structure of a plan, as the Cartographer wrote it or as a saved plan has it: a size of D&D, or `importante`
 * of the plans before ADR-0092 (the castle of then is Huge).
 */
export function readStructure(s: any): { concept: string; size?: SizeTier } {
  // The Cartographer still writes the Italian fields (until T310b); its sizes are English since T310, an Italian one is still the one it means.
  const size = sizeOf(internalName('taglie', String(s?.size ?? s?.taglia ?? '').trim().toLowerCase()))?.id ?? (s?.importante === true ? 'huge' : undefined);
  return { concept: String(s?.concept ?? s?.concetto ?? '').trim(), ...(size ? { size } : {}) };
}

export async function planChunk(c: Council, ctx: PlanContext): Promise<ChunkPlan> {
  const prompt = [
    `Design the place (${ctx.cx}, ${ctx.cy}). Starting terrain: ${ctx.terrain}.`,
    ctx.neighbors.length ? `Neighbouring places: ${ctx.neighbors.map((n) => `${n.place} (${n.layout})`).join('; ')}. Keep continuity: a settlement does not end all at once, a wood fades out.` : '',
    `Available environments ("ambiente" = one of these ids):\n${ctx.layouts.map((l) => `- ${l.id}: ${l.name} [${l.environment}] — ${l.description}`).join('\n')}`,
    ctx.start ? 'It is the starting square: choose an inhabited, welcoming environment.' : '',
    ctx.region ? `This place belongs to the region «${ctx.region.nome}» (${ctx.region.descrizione}): its name and what is in it must belong to the region (e.g. «${ctx.region.nome} — the north gate», in the language of the world).` : '',
    `Things and characters: 2-6 entries, "modulo" = EXACTLY one of the ids below; "dove": dentro (inside the buildings), fuori (outside), ovunque (anywhere). Furnish the interiors (beds, tables, cupboards, chests) and people the place: about one place in two has at least one character; vary the characters (do not always put the same kind, and never the same as the neighbouring places).\n${ctx.catalog.map((m) => `- ${m.id} «${m.name}» [${m.kind}]: ${m.context}`).join('\n')}`,
    `"a_terra": 0-4 names of common things lying on the ground here (new ones too, if consistent).${ctx.wanted.length ? ` If it makes sense, include something people have talked about: ${ctx.wanted.join(', ')}.` : ''}`,
    '"nuovi": almost always empty; only a concrete thing or a character the place calls for and that does not exist among the modules; for a thing, "takeable": true if a wanderer could lift it and set it down elsewhere (a chest, a stool), false if it is fixed or built in place (a well, an oven, a statue).',
    `"rune": 0-2 fragments taken exactly from this list: ${ctx.fragments.map((f) => `«${f}»`).join(', ')}.`,
    '"strutture": 0-2 buildings or constructions of this place, if the environment has some of its age (e.g. "the mill on the river", "the tram depot", "the boiler works"): each becomes a whole model one can enter, on the lots of the environment (the other lots have common houses).',
    `"taglia" (optional, as the sizes of D&D: tiny, small, medium, large, huge, gargantuan): medium a house, large a mill, a station or a tower; the kernel fits it to the lot.`,
    ctx.rari?.length
      ? `The biggest sizes are rare: this part of the world may still have ${ctx.rari.map((t) => (t === 'huge' ? 'one "huge" structure (what is huge in its age: a castle, a power station, a skyscraper)' : 'one "gargantuan" structure (a citadel, a cathedral, a tower-city, an immense ruin)')).join(' and ')}: at most one per place, only if the place truly deserves it.`
      : 'No "huge" or "gargantuan" structures here: this part of the world already has its remarkable places.',
    ctx.feedback ? `THE PREVIOUS ATTEMPT WAS DISCARDED: ${ctx.feedback}. Fix it.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  // The environment can only be one of the existing ids: the schema says so.
  const schema: Schema = { ...PLAN_SCHEMA, properties: { ...PLAN_SCHEMA.properties!, ambiente: { type: 'STRING', enum: ctx.layouts.map((l) => l.id) } } };
  const raw = await c.ask<any>('cartographer', 'chunk.plan', prompt, schema, { data: ctx, temperature: 0.9, chi: ctx.chi });
  const where = (w: unknown): Where => (WHERE.includes(w as Where) ? (w as Where) : 'ovunque');
  return {
    place: { name: String(raw?.luogo?.nome ?? '').trim(), description: String(raw?.luogo?.descrizione ?? '').trim() },
    layout: String(raw?.ambiente ?? ''),
    objects: (raw?.oggetti ?? []).slice(0, 8).map((o: any) => ({ module: String(o?.modulo ?? ''), where: where(o?.dove) })),
    ground: (raw?.a_terra ?? []).slice(0, 4).map(String),
    fresh: (raw?.nuovi ?? []).slice(0, 1).map((o: any) => ({ concept: String(o?.concetto ?? ''), where: where(o?.dove), ...(typeof o?.takeable === 'boolean' ? { takeable: o.takeable } : {}) })),
    runes: (raw?.rune ?? []).slice(0, 3).map(String),
    structures: (raw?.strutture ?? []).slice(0, 3).map(readStructure),
  };
}

const LAYOUTS_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    ambienti: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          nome: { type: 'STRING' },
          descrizione: { type: 'STRING' },
          tipo: { type: 'STRING', enum: ['esterno', 'interno', 'misto'] },
          programma_json: { type: 'STRING', description: 'the MarkovJunior program as JSON' },
        },
        required: ['id', 'nome', 'descrizione', 'tipo', 'programma_json'],
      },
    },
  },
  required: ['ambienti'],
};

/** Genesis: the Cartographer writes the environments of this world as rewrite programs. */
export async function designLayouts(c: Council, palette: Record<string, TerrainDef>, feedback = ''): Promise<Array<{ id: string; def: EnvironmentDef } | { id: string; error: string }>> {
  const raw = await c.ask<{ ambienti: Array<{ id: string; nome: string; descrizione: string; tipo: EnvironmentDef['environment']; programma_json: string }> }>(
    'cartographer',
    'genesis.layouts',
    [
      'Write 10-14 environments for the places of this world, each as a MarkovJunior rewrite program (see your role for the syntax) that transforms the procedural draft.',
      'Variety, in the age of the bible! Needed: where people live (more than one kind: from the stone village to the quarter of blocks of flats, as the world has it), where they work and farm, the nature that remains in this world (woods, jungles, deserts, mountains, lakes and coasts, or what they made of them), and special places with the kernel\'s stamps. Plus one big interior with several rooms. The draft is nature: a densely built environment clears it first.',
      `Available stamps: {"type":"stamp","shape":…} with shape among ${internalValues('timbri').join(', ')} (see the role). A stamp is a shape, not an age: its id stays in the program, the name and description of the environment are yours to decide and "codes" gives it the materials of this world.`,
      `Usable terrain codes:\n${paletteSummary(palette)}`,
      feedback && `SOME PROGRAMS WERE INVALID, fix them: ${feedback}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    LAYOUTS_SCHEMA,
    { data: { palette }, temperature: 0.7 },
  );
  return (raw.ambienti ?? []).map((a) => {
    const id = String(a.id ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 24) || 'ambiente';
    try {
      const program = JSON.parse(a.programma_json) as MjNode;
      return { id, def: { name: String(a.nome), description: String(a.descrizione), environment: a.tipo ?? 'esterno', program } };
    } catch (e) {
      return { id, error: `${id}: programma_json non è JSON valido (${(e as Error).message})` };
    }
  });
}

const REGION_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    nome: { type: 'STRING', description: 'proper name of the region, in the language of the world (e.g. «Rocca di Montenero», «Dune del Sale», «Darsena Vecchia»)' },
    descrizione: { type: 'STRING' },
    ambiente: { type: 'STRING' },
    direzione: { type: 'STRING', enum: ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'] },
    distanza: { type: 'INTEGER', description: 'in places from the starting point (2-12)' },
    raggio: { type: 'INTEGER', description: '1 = a place and its neighbours, 2-3 = a wide zone (deserts, jungles, seas)' },
  },
  required: ['nome', 'descrizione', 'ambiente', 'direzione', 'distanza', 'raggio'],
};

export interface RegionDraft {
  nome: string;
  descrizione: string;
  ambiente: string;
  direzione: string;
  distanza: number;
  raggio: number;
}

/** Genesis: the Cartographer draws the geography — where the castle is, the desert, the elves' wood. */
export async function drawAtlas(c: Council, layouts: Array<{ id: string; name: string; description: string }>): Promise<RegionDraft[]> {
  const ids = layouts.map((l) => l.id);
  const raw = await c.ask<{ regioni: RegionDraft[] }>(
    'cartographer',
    'genesis.atlas',
    [
      'Draw the geography of the world: 8-14 regions around the starting point (which is at the centre). Each one has a proper name, a sentence, an environment among the available ones, a direction and a distance (in places) from the centre, and a radius.',
      'Make it believable and of its age: the desert far from the lakes, what towers on a hill with a settlement nearby, the mountains to the north, the sea on one side; the farther you go, the stranger things are.',
      `Environments:\n${layouts.map((l) => `- ${l.id}: ${l.name} — ${l.description}`).join('\n')}`,
    ].join('\n\n'),
    { type: 'OBJECT', properties: { regioni: { type: 'ARRAY', items: { ...REGION_SCHEMA, properties: { ...REGION_SCHEMA.properties!, ambiente: { type: 'STRING', enum: ids } } } } }, required: ['regioni'] },
    { data: { layouts }, temperature: 0.8 },
  );
  return (raw.regioni ?? []).filter((r) => ids.includes(r.ambiente)).slice(0, 16);
}

const ENV_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    usa_ambiente: { type: 'STRING', description: 'if an existing environment already fits, its id (then no program)' },
    id: { type: 'STRING' },
    nome: { type: 'STRING' },
    descrizione: { type: 'STRING' },
    tipo: { type: 'STRING', enum: ['esterno', 'interno', 'misto'] },
    programma_json: { type: 'STRING', description: 'the MarkovJunior program as JSON (it may use the stamps)' },
    nuovi_terreni: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          codice: { type: 'STRING', description: 'a single character not used yet' },
          nome: { type: 'STRING' },
          colore: { type: 'STRING', description: '#rrggbb' },
          strato: { type: 'STRING', enum: ['ground', 'floor', 'wall', 'door', 'liquid', 'vegetation', 'rock'] },
          solido: { type: 'BOOLEAN' },
          interno: { type: 'BOOLEAN' },
          descrizione: { type: 'STRING' },
        },
        required: ['codice', 'nome', 'colore', 'strato', 'solido'],
      },
    },
    regione: REGION_SCHEMA,
  },
  required: ['nome', 'descrizione', 'regione'],
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
    program = raw.programma_json ? JSON.parse(raw.programma_json) : undefined;
  } catch {
    program = undefined;
  }
  const tiles = (Array.isArray(raw.nuovi_terreni) ? raw.nuovi_terreni : []).slice(0, 4).map((t: any) => ({
    code: String(t?.codice ?? '').slice(0, 1),
    tile: { name: String(t?.nome ?? 'terreno').slice(0, 30), color: /^#[0-9a-f]{6}$/i.test(t?.colore) ? t.colore : '#888888', solid: !!t?.solido, layer: t?.strato, indoor: !!t?.interno, description: t?.descrizione ? String(t.descrizione).slice(0, 120) : undefined } as TerrainDef,
  }));
  const r = raw.regione ?? {};
  return {
    reuse: raw.usa_ambiente && ctx.layouts.some((l) => l.id === raw.usa_ambiente) ? String(raw.usa_ambiente) : undefined,
    id: String(raw.id ?? raw.nome ?? 'ambiente').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'ambiente',
    name: String(raw.nome ?? request).slice(0, 40),
    description: String(raw.descrizione ?? '').slice(0, 200),
    environment: ['esterno', 'interno', 'misto'].includes(raw.tipo) ? raw.tipo : 'esterno',
    program,
    tiles,
    region: { nome: String(r.nome ?? raw.nome ?? request).slice(0, 40), descrizione: String(r.descrizione ?? raw.descrizione ?? '').slice(0, 200), ambiente: '', direzione: String(r.direzione ?? 'nord'), distanza: Math.max(2, Math.min(12, Math.round(Number(r.distanza) || 4))), raggio: Math.max(1, Math.min(3, Math.round(Number(r.raggio) || 1))) },
  };
}
