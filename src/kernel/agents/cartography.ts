// Chunks. The Cartographer no longer draws grids (models cannot count cells): it chooses the
// environment (a MarkovJunior layout program), names the place and says what lives there, inside or
// outside buildings. The kernel runs the program, guarantees paths and places things.
// At genesis the Cartographer writes the layout programs themselves.

import type { Schema } from '../ai/models';
import type { LayoutDef, Place, TileDef } from '../types';
import type { MjNode } from '../mj';
import { paletteSummary, type CatalogEntry, type Council } from './council';

export type Where = 'dentro' | 'fuori' | 'ovunque';

export interface PlacedObject {
  module: string;
  where: Where;
}

export interface ChunkPlan {
  place: Place;
  /** Layout (environment) id. */
  layout: string;
  objects: PlacedObject[];
  /** Names of items lying around. */
  ground: string[];
  /** Things that do not exist yet: the Forge will create them. */
  fresh: Array<{ concept: string; where: Where }>;
  /** Rune fragments (lines from the catalogue) to scatter. */
  runes: string[];
  /** Tiles changed after the layout (by effects, spells, Lua): cell index → tile code. */
  edits?: Record<string, string>;
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
  },
  required: ['luogo', 'ambiente', 'oggetti', 'rune'],
};

export async function planChunk(c: Council, ctx: PlanContext): Promise<ChunkPlan> {
  const prompt = [
    `Progetta il luogo (${ctx.cx}, ${ctx.cy}). Terreno di partenza: ${ctx.terrain}.`,
    ctx.neighbors.length ? `Luoghi confinanti: ${ctx.neighbors.map((n) => `${n.place} (${n.layout})`).join('; ')}. Mantieni continuità: un borgo non finisce di colpo, un bosco sfuma.` : '',
    `Ambienti disponibili ("ambiente" = uno di questi id):\n${ctx.layouts.map((l) => `- ${l.id}: ${l.name} [${l.environment}] — ${l.description}`).join('\n')}`,
    ctx.start ? 'È la piazza di partenza: scegli un ambiente abitato e accogliente.' : '',
    `Oggetti e personaggi: 2-6 voci, "modulo" = ESATTAMENTE uno degli id qui sotto; "dove": dentro (negli edifici), fuori, ovunque. Arreda gli interni (letti, tavoli, credenze, casse) e popola: circa un luogo su due ha almeno un personaggio; varia i personaggi (non mettere sempre lo stesso tipo, e mai lo stesso dei luoghi vicini).\n${ctx.catalog.map((m) => `- ${m.id} «${m.name}» [${m.kind}]: ${m.context}`).join('\n')}`,
    `"a_terra": 0-4 nomi di oggetti comuni che si trovano per terra qui (anche nuovi, se coerenti).${ctx.wanted.length ? ` Se ha senso, includi qualcosa di cui si è parlato: ${ctx.wanted.join(', ')}.` : ''}`,
    '"nuovi": quasi sempre vuoto; solo un oggetto concreto o un personaggio che il luogo richiede e che non esiste tra i moduli.',
    `"rune": 0-2 frammenti presi esattamente da questo elenco: ${ctx.fragments.map((f) => `«${f}»`).join(', ')}.`,
    ctx.feedback ? `IL TENTATIVO PRECEDENTE È STATO SCARTATO: ${ctx.feedback}. Correggi.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  // The environment can only be one of the existing ids: the schema says so.
  const schema: Schema = { ...PLAN_SCHEMA, properties: { ...PLAN_SCHEMA.properties!, ambiente: { type: 'STRING', enum: ctx.layouts.map((l) => l.id) } } };
  const raw = await c.ask<any>('cartografo', 'chunk.plan', prompt, schema, { data: ctx, temperature: 0.9 });
  const where = (w: unknown): Where => (WHERE.includes(w as Where) ? (w as Where) : 'ovunque');
  return {
    place: { name: String(raw?.luogo?.nome ?? '').trim(), description: String(raw?.luogo?.descrizione ?? '').trim() },
    layout: String(raw?.ambiente ?? ''),
    objects: (raw?.oggetti ?? []).slice(0, 8).map((o: any) => ({ module: String(o?.modulo ?? ''), where: where(o?.dove) })),
    ground: (raw?.a_terra ?? []).slice(0, 4).map(String),
    fresh: (raw?.nuovi ?? []).slice(0, 1).map((o: any) => ({ concept: String(o?.concetto ?? ''), where: where(o?.dove) })),
    runes: (raw?.rune ?? []).slice(0, 3).map(String),
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
export async function designLayouts(c: Council, palette: Record<string, TileDef>, feedback = ''): Promise<Array<{ id: string; def: LayoutDef } | { id: string; error: string }>> {
  const raw = await c.ask<{ ambienti: Array<{ id: string; nome: string; descrizione: string; tipo: LayoutDef['environment']; programma_json: string }> }>(
    'cartografo',
    'genesis.layouts',
    [
      'Scrivi 5-7 ambienti per i luoghi di questo mondo, ognuno come programma di riscrittura MarkovJunior (vedi il tuo ruolo per la sintassi) che trasforma la bozza procedurale.',
      'Servono: almeno un ambiente abitato con edifici (muri, pavimento interno, porta), uno selvaggio, uno coltivato o lavorato, uno con rovine o luoghi strani, e un interno grande (es. una locanda, un mulino, un tempio) con più stanze.',
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
