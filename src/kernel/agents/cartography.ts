// Chunks: the Cartographer designs the semantic layout, the Artist paints it (with the painted
// neighbours as context), the Physicist looks at the painting and realigns the collision grid.

import type { Schema } from '../ai/models';
import type { GeneratedRune, Place, TileDef } from '../types';
import { colorName, type CatalogEntry, type Council } from './council';

export interface PlacedObject {
  module: string;
  col: number;
  row: number;
}

export interface FreshObject {
  concept: string;
  col: number;
  row: number;
}

export interface ChunkPlan {
  place: Place;
  /** size rows of size tile codes. */
  grid: string[];
  objects: PlacedObject[];
  /** Things that do not exist yet: the Forge will create them. */
  fresh: FreshObject[];
  runes: GeneratedRune[];
  notes?: string;
}

export interface Edges {
  n?: string;
  s?: string;
  w?: string;
  e?: string;
}

export interface PlanContext {
  cx: number;
  cy: number;
  size: number;
  /** Continuous procedural draft (world.terrain), the starting point. */
  draft: string[];
  edges: Edges;
  neighborPlaces: string[];
  palette: Record<string, TileDef>;
  catalog: CatalogEntry[];
  fragments: string[];
  /** The starting square: its centre must stay walkable. */
  start: boolean;
  attempt: number;
  feedback?: string;
}

const PLAN_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    luogo: { type: 'OBJECT', properties: { nome: { type: 'STRING' }, descrizione: { type: 'STRING' } }, required: ['nome', 'descrizione'] },
    griglia: { type: 'ARRAY', items: { type: 'STRING' } },
    oggetti: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { modulo: { type: 'STRING' }, col: { type: 'INTEGER' }, riga: { type: 'INTEGER' } }, required: ['modulo', 'col', 'riga'] },
    },
    nuovi: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { concetto: { type: 'STRING' }, col: { type: 'INTEGER' }, riga: { type: 'INTEGER' } }, required: ['concetto', 'col', 'riga'] },
    },
    rune: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { codice: { type: 'STRING' }, col: { type: 'INTEGER' }, riga: { type: 'INTEGER' } }, required: ['codice', 'col', 'riga'] },
    },
    note: { type: 'STRING' },
  },
  required: ['luogo', 'griglia', 'oggetti', 'rune'],
};

interface RawPlan {
  luogo?: { nome?: string; descrizione?: string };
  griglia?: string[];
  oggetti?: Array<{ modulo: string; col: number; riga: number }>;
  nuovi?: Array<{ concetto: string; col: number; riga: number }>;
  rune?: Array<{ codice: string; col: number; riga: number }>;
  note?: string;
}

export async function planChunk(c: Council, ctx: PlanContext): Promise<ChunkPlan> {
  const edges = Object.entries(ctx.edges)
    .filter(([, v]) => v)
    .map(([k, v]) => `- bordo ${({ n: 'nord (riga 0)', s: 'sud (ultima riga)', w: 'ovest (colonna 0)', e: 'est (ultima colonna)' } as Record<string, string>)[k]} del vicino già disegnato: ${v}`)
    .join('\n');
  const prompt = [
    `Progetta il chunk (${ctx.cx}, ${ctx.cy}): ${ctx.size}×${ctx.size} caselle.`,
    `Bozza procedurale (continua con i vicini, puoi modificarla per dare carattere al luogo):\n${ctx.draft.join('\n')}`,
    edges ? `Continuità obbligatoria con i vicini:\n${edges}` : '',
    ctx.neighborPlaces.length ? `Luoghi confinanti: ${ctx.neighborPlaces.join(', ')}.` : '',
    ctx.start ? `È la piazza di partenza: le caselle entro 2 dall'angolo nord-ovest (col 0-2, riga 0-2) devono restare calpestabili.` : '',
    `Frammenti di runa disponibili (codice Lua vero, ognuno valido così com'è): ${ctx.fragments.map((f) => `«${f}»`).join(', ')}.`,
    `Regole della griglia: esattamente ${ctx.size} stringhe di ${ctx.size} caratteri ciascuna (conta i caratteri!), solo codici dei terreni. Sentieri, acqua, ponti, muri ed edifici si disegnano nella griglia, non sono oggetti.`,
    `Oggetti (0-4): "modulo" deve essere ESATTAMENTE uno di questi id: ${ctx.catalog.map((m) => m.id).join(', ') || 'nessuno'}. Su caselle calpestabili, dove il loro contesto ha senso. Metti un abitante (npc) circa in un luogo su due: il mondo deve sembrare abitato.`,
    `"nuovi": quasi sempre vuoto. Solo se il luogo ha davvero bisogno di un oggetto concreto o di un personaggio che non esiste ancora tra i moduli (mai terreni o strutture), descritto in una frase.`,
    `Rune: 0-2 frammenti presi esattamente dall'elenco, con gli spazi tra i token come nell'elenco. Ognuno su una sola riga, tutto su caselle calpestabili, col ≥ 1 e col + lunghezza ≤ ${ctx.size - 1}, riga tra 1 e ${ctx.size - 2}, con almeno una casella vuota prima e dopo.`,
    ctx.feedback ? `IL TUO TENTATIVO PRECEDENTE È STATO SCARTATO: ${ctx.feedback}. Correggi.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const raw = await c.ask<RawPlan>('cartografo', 'chunk.plan', prompt, PLAN_SCHEMA, { data: ctx, temperature: 0.9 });
  return {
    place: { name: raw.luogo?.nome?.trim() ?? '', description: raw.luogo?.descrizione?.trim() ?? '' },
    grid: Array.isArray(raw.griglia) ? raw.griglia.map(String) : [],
    objects: (raw.oggetti ?? []).map((o) => ({ module: String(o.modulo), col: o.col, row: o.riga })),
    fresh: (raw.nuovi ?? []).slice(0, 1).map((o) => ({ concept: String(o.concetto), col: o.col, row: o.riga })),
    runes: (raw.rune ?? []).map((r) => ({ line: String(r.codice), col: r.col, row: r.riga })),
    notes: raw.note,
  };
}

export function legend(palette: Record<string, TileDef>): string {
  return Object.entries(palette)
    .filter(([code]) => code !== '?')
    .map(([, t]) => `${colorName(t.color)} (${t.color}) = ${t.name}${t.description ? `: ${t.description}` : ''}${t.solid ? ' [obstacle]' : ''}`)
    .join('\n');
}

/** Prompt for the image model. `margin` tiles of painted neighbours (or black) frame the layout. */
export function paintPrompt(c: Council, plan: ChunkPlan, palette: Record<string, TileDef>, size: number, margin: number): string {
  const style = c.files['world/style.md'] ?? '';
  const role = c.files['prompts/agents/artista.md'] ?? '';
  const n = size + 2 * margin;
  return [
    role.split('\n## Immagini')[0].slice(0, 600),
    `ART DIRECTION:\n${style}`,
    `The input image is a ${n}x${n}-tile canvas. The OUTER RING (${margin} tiles wide) is context: where it shows a painted picture it is an already finished neighbouring map, where it is black it is unknown.`,
    `The INNER ${size}x${size} tiles are a COLOR-CODED LAYOUT to paint. Legend:\n${legend(palette)}`,
    `Place: ${plan.place.name} — ${plan.place.description}`,
    `Paint the inner area as a finished game map in the art direction above, strictly top-down, continuing any painted neighbour seamlessly across the border.`,
    `CRITICAL: keep every inner region exactly where the layout puts it (same tiles, same boundaries); obstacles only where the layout has obstacles. Every tile is painted as its terrain, even an isolated single tile (one dark green tile = one tree): never leave a flat coloured square from the layout. Do not paint characters, creatures, items, text, UI or a frame.`,
  ].join('\n\n');
}

const SURVEY_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: { griglia: { type: 'ARRAY', items: { type: 'STRING' } }, note: { type: 'STRING' } },
  required: ['griglia'],
};

/** The Physicist compares the painting with the layout and returns the grid that matches the picture. */
export async function surveyChunk(c: Council, image: string, grid: string[], palette: Record<string, TileDef>, data?: unknown): Promise<{ grid: string[]; notes?: string }> {
  const codes = Object.entries(palette)
    .filter(([code]) => code !== '?')
    .map(([code, t]) => `${code} = ${t.name}${t.solid ? ' (ostacolo)' : ''}`)
    .join(', ');
  const prompt = [
    `L'immagine è un chunk di ${grid.length}×${grid.length} caselle già dipinto dall'Artista. Questa è la griglia che il Cartografo aveva progettato (codici: ${codes}):`,
    grid.join('\n'),
    `Confrontala con ciò che è DAVVERO dipinto. Restituisci la griglia che corrisponde al dipinto, stessi codici, ${grid.length} stringhe di ${grid.length} caratteri. Cambia solo le caselle chiaramente diverse (es. un albero dipinto dove la griglia dice prato). In "note" elenca in breve cosa hai corretto.`,
  ].join('\n\n');
  const raw = await c.ask<{ griglia?: string[]; note?: string }>('fisico', 'chunk.survey', prompt, SURVEY_SCHEMA, { images: [image], data: { grid, ...((data as object) ?? {}) }, temperature: 0.1 });
  return { grid: Array.isArray(raw.griglia) ? raw.griglia.map(String) : [], notes: raw.note };
}
