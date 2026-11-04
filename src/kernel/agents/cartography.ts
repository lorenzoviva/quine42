// Chunks. The Cartographer no longer draws grids (models cannot count cells): it chooses the
// environment (a MarkovJunior layout program), names the place and says what lives there, inside or
// outside lots. The kernel runs the program, guarantees paths and places entities.
// At genesis the Cartographer writes the layout programs themselves.

import type { Schema } from '../ai/models';
import type { CardStamp } from '../cards';
import type { EnvironmentDef, ChunkInfo, TerrainDef } from '../types';
import type { MjNode } from '../mj';
import { sizeOf, SIZE_TIERS, type SizeTier } from '../../mj/classes';
import { STAMP_SHAPES } from '../stamps';
import { paletteSummary, type CatalogEntry, type Council } from './council';

export type Where = 'dentro' | 'fuori' | 'ovunque';

export interface PlacedObject {
  module: string;
  where: Where;
}

/** The water of a tile that has flowed (T51b): its bed, its water (levels), the tile it was before it became water. */
export type WaterRecord = [number, number] | [number, number, string];

export interface ChunkPlan {
  place: ChunkInfo;
  /** Layout (environment) id. */
  layout: string;
  objects: PlacedObject[];
  /** Names of items lying around. */
  ground: string[];
  /** Entities that do not exist yet: the Forge will create them. */
  fresh: Array<{ concept: string; where: Where }>;
  /** Rune fragments (lines from the catalogue) to scatter. */
  runes: string[];
  /**
   * Structures the place has (ADR-0043): each becomes a whole model one enters, set on a lot of the
   * environment (the largest first); the Sculptor writes the ones that do not exist yet. Their size (ADR-0092)
   * is a size of D&D, fitted by the kernel to the lot and to the rarity of the two largest.
   */
  strutture?: Array<{ concetto: string; taglia?: SizeTier }>;
  /** Tiles changed after the layout (by effects, spells, Lua): cell index → tile code. */
  edits?: Record<string, string>;
  /** The ground dug (negative) or raised after the layout (T51b): cell index → levels. */
  scavi?: Record<string, number>;
  /** The water that has flowed (T51b, `water.ts`): cell index → its bed and its water (levels), and the tile it was before it became water. */
  acqua?: Record<string, WaterRecord>;
  /** Who planned the place and who paid for it (T36). */
  carta?: CardStamp;
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
    nuovi: { type: 'ARRAY', items: { type: 'OBJECT', properties: { concetto: { type: 'STRING' }, dove: { type: 'STRING', enum: WHERE } }, required: ['concetto', 'dove'] } },
    rune: { type: 'ARRAY', items: { type: 'STRING' } },
    strutture: { type: 'ARRAY', items: { type: 'OBJECT', properties: { concetto: { type: 'STRING' }, taglia: { type: 'STRING', enum: SIZE_TIERS.map((t) => t.id) } }, required: ['concetto'] } },
  },
  required: ['luogo', 'ambiente', 'oggetti', 'rune'],
};

/**
 * A structure of a plan, as the Cartographer wrote it or as a saved plan has it: a size of D&D, or `importante`
 * of the plans before ADR-0092 (the castle of then is Huge).
 */
export function readStructure(s: any): { concetto: string; taglia?: SizeTier } {
  const taglia = sizeOf(String(s?.taglia ?? '').trim().toLowerCase())?.id ?? (s?.importante === true ? 'enorme' : undefined);
  return { concetto: String(s?.concetto ?? '').trim(), ...(taglia ? { taglia } : {}) };
}

export async function planChunk(c: Council, ctx: PlanContext): Promise<ChunkPlan> {
  const prompt = [
    `Progetta il luogo (${ctx.cx}, ${ctx.cy}). Terreno di partenza: ${ctx.terrain}.`,
    ctx.neighbors.length ? `Luoghi confinanti: ${ctx.neighbors.map((n) => `${n.place} (${n.layout})`).join('; ')}. Mantieni continuità: un abitato non finisce di colpo, un bosco sfuma.` : '',
    `Ambienti disponibili ("ambiente" = uno di questi id):\n${ctx.layouts.map((l) => `- ${l.id}: ${l.name} [${l.environment}] — ${l.description}`).join('\n')}`,
    ctx.start ? 'È la piazza di partenza: scegli un ambiente abitato e accogliente.' : '',
    ctx.region ? `Questo luogo fa parte della regione «${ctx.region.nome}» (${ctx.region.descrizione}): il nome e ciò che c'è devono appartenerle (es. «${ctx.region.nome} — la porta nord»).` : '',
    `Oggetti e personaggi: 2-6 voci, "modulo" = ESATTAMENTE uno degli id qui sotto; "dove": dentro (negli edifici), fuori, ovunque. Arreda gli interni (letti, tavoli, credenze, casse) e popola: circa un luogo su due ha almeno un personaggio; varia i personaggi (non mettere sempre lo stesso tipo, e mai lo stesso dei luoghi vicini).\n${ctx.catalog.map((m) => `- ${m.id} «${m.name}» [${m.kind}]: ${m.context}`).join('\n')}`,
    `"a_terra": 0-4 nomi di oggetti comuni che si trovano per terra qui (anche nuovi, se coerenti).${ctx.wanted.length ? ` Se ha senso, includi qualcosa di cui si è parlato: ${ctx.wanted.join(', ')}.` : ''}`,
    '"nuovi": quasi sempre vuoto; solo un oggetto concreto o un personaggio che il luogo richiede e che non esiste tra i moduli.',
    `"rune": 0-2 frammenti presi esattamente da questo elenco: ${ctx.fragments.map((f) => `«${f}»`).join(', ')}.`,
    '"strutture": 0-2 edifici o costruzioni di questo luogo, se l\'ambiente ne ha della sua epoca (es. «il mulino sul fiume», «il deposito dei tram», «l\'officina delle caldaie»): ognuno diventa un modello intero in cui si entra, sui lotti dell\'ambiente (gli altri lotti hanno case comuni).',
    `"taglia" (facoltativa, come le taglie di D&D: minuscola, piccola, media, grande, enorme, gargantuesca): media una casa, grande un mulino, una stazione o una torre; il kernel la adatta al lotto.`,
    ctx.rari?.length
      ? `Le taglie più grandi sono rare: in questa parte del mondo può esserci ancora ${ctx.rari.map((t) => (t === 'enorme' ? 'una struttura "enorme" (ciò che nella sua epoca è enorme: un castello, una centrale, un grattacielo)' : 'una struttura "gargantuesca" (una cittadella, una cattedrale, una torre-città, una rovina immensa)')).join(' e ')}: al più una per luogo, solo se il luogo lo merita davvero.`
      : 'Niente strutture "enorme" né "gargantuesca" qui: questa parte del mondo ha già i suoi luoghi notevoli.',
    ctx.feedback ? `IL TENTATIVO PRECEDENTE È STATO SCARTATO: ${ctx.feedback}. Correggi.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  // The environment can only be one of the existing ids: the schema says so.
  const schema: Schema = { ...PLAN_SCHEMA, properties: { ...PLAN_SCHEMA.properties!, ambiente: { type: 'STRING', enum: ctx.layouts.map((l) => l.id) } } };
  const raw = await c.ask<any>('cartografo', 'chunk.plan', prompt, schema, { data: ctx, temperature: 0.9, chi: ctx.chi });
  const where = (w: unknown): Where => (WHERE.includes(w as Where) ? (w as Where) : 'ovunque');
  return {
    place: { name: String(raw?.luogo?.nome ?? '').trim(), description: String(raw?.luogo?.descrizione ?? '').trim() },
    layout: String(raw?.ambiente ?? ''),
    objects: (raw?.oggetti ?? []).slice(0, 8).map((o: any) => ({ module: String(o?.modulo ?? ''), where: where(o?.dove) })),
    ground: (raw?.a_terra ?? []).slice(0, 4).map(String),
    fresh: (raw?.nuovi ?? []).slice(0, 1).map((o: any) => ({ concept: String(o?.concetto ?? ''), where: where(o?.dove) })),
    runes: (raw?.rune ?? []).slice(0, 3).map(String),
    strutture: (raw?.strutture ?? []).slice(0, 3).map(readStructure),
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
          programma_json: { type: 'STRING', description: 'il programma MarkovJunior come JSON' },
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
    'cartografo',
    'genesis.layouts',
    [
      'Scrivi 10-14 ambienti per i luoghi di questo mondo, ognuno come programma di riscrittura MarkovJunior (vedi il tuo ruolo per la sintassi) che trasforma la bozza procedurale.',
      'Varietà, nell\'epoca della bibbia! Servono: dove si abita (più di un tipo: dal borgo di pietra al quartiere di condomini, secondo il mondo), dove si lavora e si coltiva, la natura che in questo mondo resta (boschi, giungle, deserti, montagne, laghi e coste, o ciò che ne hanno fatto), e luoghi speciali con i timbri del kernel. Più un interno grande con più stanze. La bozza è natura: un ambiente costruito fitto prima la sgombra.',
      `Timbri disponibili: {"type":"stamp","shape":…} con shape tra ${STAMP_SHAPES.join(', ')} (vedi il ruolo). Un timbro è una forma, non un'epoca: il suo nome resta nel programma, nome e descrizione dell'ambiente li decidi tu e "codes" gli dà i materiali di questo mondo.`,
      `Codici dei terreni utilizzabili:\n${paletteSummary(palette)}`,
      feedback && `ALCUNI PROGRAMMI ERANO INVALIDI, correggili: ${feedback}`,
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
    nome: { type: 'STRING', description: 'nome proprio della regione (es. «Rocca di Montenero», «Dune del Sale», «Darsena Vecchia»)' },
    descrizione: { type: 'STRING' },
    ambiente: { type: 'STRING' },
    direzione: { type: 'STRING', enum: ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'] },
    distanza: { type: 'INTEGER', description: 'in luoghi dal punto di partenza (2-12)' },
    raggio: { type: 'INTEGER', description: '1 = un luogo e i suoi vicini, 2-3 = una zona vasta (deserti, giungle, mari)' },
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
    'cartografo',
    'genesis.atlas',
    [
      "Disegna la geografia del mondo: 8-14 regioni attorno al punto di partenza (che è al centro). Ognuna ha un nome proprio, una frase, un ambiente tra quelli disponibili, una direzione e una distanza (in luoghi) dal centro, e un raggio.",
      'Rendila credibile e della sua epoca: il deserto lontano dai laghi, ciò che domina su un colle con un abitato vicino, le montagne a nord, il mare da un lato; più si va lontano più le cose sono strane.',
      `Ambienti:\n${layouts.map((l) => `- ${l.id}: ${l.name} — ${l.description}`).join('\n')}`,
    ].join('\n\n'),
    { type: 'OBJECT', properties: { regioni: { type: 'ARRAY', items: { ...REGION_SCHEMA, properties: { ...REGION_SCHEMA.properties!, ambiente: { type: 'STRING', enum: ids } } } } }, required: ['regioni'] },
    { data: { layouts }, temperature: 0.8 },
  );
  return (raw.regioni ?? []).filter((r) => ids.includes(r.ambiente)).slice(0, 16);
}

const ENV_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    usa_ambiente: { type: 'STRING', description: "se un ambiente esistente va già bene, il suo id (allora niente programma)" },
    id: { type: 'STRING' },
    nome: { type: 'STRING' },
    descrizione: { type: 'STRING' },
    tipo: { type: 'STRING', enum: ['esterno', 'interno', 'misto'] },
    programma_json: { type: 'STRING', description: 'il programma MarkovJunior come JSON (può usare i timbri)' },
    nuovi_terreni: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          codice: { type: 'STRING', description: 'un solo carattere non ancora usato' },
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
    'cartografo',
    'cartographer.environment',
    [
      `Ti chiedono: «${request}». Il viandante si trova a «${ctx.here}».`,
      `Ambienti esistenti:\n${ctx.layouts.map((l) => `- ${l.id}: ${l.name} — ${l.description}`).join('\n')}`,
      `Terreni:\n${paletteSummary(ctx.palette)}`,
      `Se serve, scrivi un ambiente nuovo come programma (puoi usare i timbri: ${ctx.stamps.join(', ')}) e aggiungi terreni nuovi (un carattere ciascuno, mai già usato). Poi collocalo nell'atlante: una regione con nome proprio, direzione e distanza in luoghi da dove si trova il viandante (in una zona ancora inesplorata, 3-8 luoghi).`,
      ctx.feedback ? `IL TENTATIVO PRECEDENTE NON ANDAVA: ${ctx.feedback}` : '',
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
