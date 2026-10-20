// Free actions ("Altro…"): the player writes what they do to a thing; the Narrator judges whether it
// can happen and what follows, choosing effects from a closed set (types.ts → Effect). The kernel
// validates them (validator.ts → validateEffects) and core.effects (Lua) applies them. An action that
// makes sense and can be repeated is learned by the object: it enters its menu, no further calls.

import type { Schema } from '../ai/models';
import { EFFECT_TYPES } from '../types';
import type { Council } from './council';

export interface ActionContext {
  /** What the player wrote. */
  text: string;
  target: { name: string; description: string; tags: string[]; container: boolean; kind: string };
  /** Names of what the player carries, and what they hold. */
  carrying: string[];
  holding: string;
  /** Tile under the target and the terrains of the world (names). */
  tile: string;
  terrains: string[];
  /** Modules that can be summoned (names), and loot tables. */
  summonable: string[];
  loot: string[];
  place: string;
}

export interface ActionJudgement {
  possible: boolean;
  story: string;
  effects: unknown[];
  repeatable: boolean;
  label: string;
  /** Item (name) the action needs, if any. */
  requires?: string;
}

const EFFECT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    tipo: { type: 'STRING', enum: [...EFFECT_TYPES] },
    testo: { type: 'STRING' },
    oggetto: { type: 'STRING', description: 'nome di un oggetto (crea_oggetto, consuma)' },
    quantita: { type: 'INTEGER' },
    a: { type: 'STRING', description: 'terreno: nome del terreno risultante' },
    da: { type: 'STRING', description: 'terreno: solo le caselle di questo terreno (facoltativo)' },
    raggio: { type: 'NUMBER' },
    durata: { type: 'NUMBER', description: 'secondi' },
    forza: { type: 'NUMBER' },
    modulo: { type: 'STRING', description: 'evoca: nome di ciò che compare' },
    fame: { type: 'NUMBER' },
    sete: { type: 'NUMBER' },
    energia: { type: 'NUMBER' },
    salute: { type: 'NUMBER' },
    capienza: { type: 'INTEGER' },
    bottino: { type: 'STRING' },
  },
  required: ['tipo'],
};

const JUDGE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    possibile: { type: 'BOOLEAN' },
    racconto: { type: 'STRING', description: "cosa succede, 1-2 frasi, seconda persona" },
    effetti: { type: 'ARRAY', items: EFFECT_SCHEMA },
    ripetibile: { type: 'BOOLEAN', description: "vero se è un'azione sensata che si può rifare sempre allo stesso modo su cose come questa" },
    etichetta: { type: 'STRING', description: "l'azione come voce di menu, 1-3 parole (es. «Forza la serratura»)" },
    serve: { type: 'STRING', description: "oggetto che il viandante deve avere per farlo (facoltativo, tra quelli che porta)" },
  },
  required: ['possibile', 'racconto', 'effetti', 'ripetibile', 'etichetta'],
};

export const EFFECTS_GUIDE = [
  'messaggio {testo}: solo racconto, nessun cambiamento',
  'bisogni {fame, sete, energia, salute}: variazioni da -40 a +40 (positivo = meglio)',
  'crea_oggetto {oggetto, quantita}: compare un oggetto a terra (anche nuovo, se ha senso)',
  'consuma {oggetto, quantita}: il viandante spende un altro oggetto che porta (un ingrediente, del cibo); MAI la cosa su cui agisce: quella resta, a meno di distruggi',
  "distruggi: la cosa si rompe o finisce (e lascia ciò che conteneva)",
  'apri: si apre (se è un contenitore)',
  'contenitore {capienza, bottino}: la cosa diventa apribile (ha uno spazio dentro)',
  'terreno {a, da, raggio}: il terreno attorno cambia (raggio 0-3)',
  'fuoco {raggio, durata}: fiamme che bruciano ciò che è infiammabile',
  'luce {raggio, durata}: una luce',
  'scudo {durata}: il viandante è protetto',
  'spingi {forza}: la cosa viene spinta via',
  'evoca {modulo}: compare qualcosa o qualcuno che esiste già nel mondo',
  'SOLO SU UNA PERSONA — legame {legame}: cosa diventa per il viandante (amico, innamorata, moglie, marito, nemico…); ricordo {testo, peso 1-3}: cosa ricorderà; nascita {nome}: nasce un figlio (solo tra sposi, e solo se la persona lo vuole)',
].join('\n');

export async function judgeAction(c: Council, ctx: ActionContext): Promise<ActionJudgement> {
  const t = ctx.target;
  const prompt = [
    `Il viandante, davanti a «${t.name}» (${t.kind}: ${t.description}${t.tags.length ? `; tag ${t.tags.join(', ')}` : ''}${t.container ? '; è un contenitore' : ''}), scrive: «${ctx.text}».`,
    `Porta: ${ctx.carrying.join(', ') || 'niente'}. Impugna: ${ctx.holding}. Sotto la cosa: ${ctx.tile}. Luogo: ${ctx.place || 'sconosciuto'}.`,
    `Giudica come il Concilio: è possibile, nel mondo e per la fisica? Se no, "possibile" falso e racconta perché non riesce (effetti vuoti o solo messaggio).`,
    `Se sì, scegli gli effetti (al massimo 4) SOLO da questo elenco:\n${EFFECTS_GUIDE}`,
    `Terreni esistenti: ${ctx.terrains.join(', ')}. Cose evocabili: ${ctx.summonable.slice(0, 30).join(', ') || 'nessuna'}. Tabelle di bottino: ${ctx.loot.join(', ')}.`,
    `Sii fedele alla fisica: niente miracoli senza strumenti o rune; serve il giusto attrezzo per scassinare, tagliare, scavare. Se serve un oggetto che il viandante porta, mettilo in "serve".`,
  ].join('\n\n');
  const r = await c.ask<{ possibile: boolean; racconto: string; effetti?: unknown[]; ripetibile?: boolean; etichetta?: string; serve?: string }>('narratore', 'action.judge', prompt, JUDGE_SCHEMA, {
    data: ctx,
    temperature: 0.5,
  });
  return {
    possible: !!r.possibile,
    story: String(r.racconto ?? ''),
    effects: Array.isArray(r.effetti) ? r.effetti : [],
    repeatable: !!r.ripetibile,
    label: String(r.etichetta ?? ctx.text).slice(0, 40),
    requires: r.serve ? String(r.serve) : undefined,
  };
}

const SPELL_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    nome: { type: 'STRING', description: "nome dell'incantesimo, 1-2 parole" },
    descrizione: { type: 'STRING', description: 'cosa fa, una frase' },
    costo: { type: 'INTEGER', description: 'energia del viandante che consuma, da 3 a 40' },
    effetti: { type: 'ARRAY', items: EFFECT_SCHEMA },
  },
  required: ['nome', 'descrizione', 'costo', 'effetti'],
};

export interface SpellDraft {
  name: string;
  description: string;
  cost: number;
  effects: unknown[];
}

/**
 * An incantation never spoken before: the Narrator decides, once, what this sequence of runes does.
 * Coherent with the runes' elements and with the incantations already known; stronger costs more.
 */
export async function nameSpell(
  c: Council,
  runes: Array<{ token: string; name: string; element: string; description: string }>,
  known: Array<{ sequence: string; name: string; description: string }>,
  terrains: string[],
): Promise<SpellDraft> {
  const seq = runes.map((r) => r.token).join(' ');
  const prompt = [
    `Il viandante pronuncia, in quest'ordine, le rune: ${runes.map((r) => `«${r.token}» (${r.name}, ${r.element}: ${r.description})`).join(', ')}.`,
    `Incantesimi già noti:\n${known.map((k) => `- ${k.sequence} → ${k.name}: ${k.description}`).join('\n') || '(nessuno)'}`,
    `Decidi cosa fa questa sequenza (${seq}). L'ordine conta. Deve derivare dagli elementi delle rune, essere coerente con gli incantesimi noti e con il mondo; più rune = più forte e più costoso. Effetti (al massimo 4) SOLO da questo elenco:\n${EFFECTS_GUIDE}`,
    `Terreni esistenti: ${terrains.join(', ')}. Gli effetti agiscono su ciò che il viandante ha davanti (o sul viandante stesso per bisogni e scudo).`,
  ].join('\n\n');
  const r = await c.ask<{ nome: string; descrizione: string; costo: number; effetti?: unknown[] }>('narratore', 'spell.name', prompt, SPELL_SCHEMA, {
    data: { runes, known, terrains },
    temperature: 0.7,
  });
  return {
    name: String(r.nome ?? seq).slice(0, 40),
    description: String(r.descrizione ?? '').slice(0, 200),
    cost: Math.max(3, Math.min(40, Math.round(Number(r.costo) || 10))),
    effects: Array.isArray(r.effetti) ? r.effetti : [],
  };
}

const CRAFT_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    possibile: { type: 'BOOLEAN' },
    racconto: { type: 'STRING', description: 'come lo fai, o perché non si può: 1-2 frasi, seconda persona' },
    risultato: { type: 'STRING', description: "nome dell'oggetto che ottieni" },
    descrizione: { type: 'STRING', description: "com'è l'oggetto ottenuto, se è nuovo" },
    quantita: { type: 'INTEGER' },
    ingredienti: { type: 'ARRAY', items: { type: 'OBJECT', properties: { oggetto: { type: 'STRING' }, quantita: { type: 'INTEGER' } }, required: ['oggetto', 'quantita'] }, description: 'cose che porti e che si consumano' },
    attrezzi: { type: 'ARRAY', items: { type: 'STRING' }, description: 'cose che porti, servono ma non si consumano' },
  },
  required: ['possibile', 'racconto'],
};

export interface CraftJudgement {
  possible: boolean;
  story: string;
  result?: string;
  description?: string;
  count: number;
  inputs: Array<{ item: string; count: number }>;
  tools: string[];
}

/**
 * Free crafting: the player says what they want to make from what they carry. The Narrator (with the
 * Physicist's sense) decides whether it can be made and from what; the kernel checks that every
 * ingredient is really carried, and a possible recipe becomes a rule of the world (a known recipe).
 */
export async function judgeCraft(c: Council, text: string, carrying: string[], known: string[]): Promise<CraftJudgement> {
  const prompt = [
    `Il viandante vuole fabbricare: «${text}».`,
    `Porta con sé: ${carrying.join(', ') || 'niente'}.`,
    `Oggetti che esistono già nel mondo (usa questi nomi se il risultato è uno di loro): ${known.slice(0, 80).join(', ')}.`,
    `Si può fare con ciò che porta, a mano, in modo credibile? Se sì: "risultato" (nome), "quantita", "ingredienti" consumati e "attrezzi" usati, SOLO tra le cose che porta e con nomi esatti; se il risultato non esiste ancora, descrivilo. Se no, "possibile" falso e spiega cosa manca. Sii severo come un artigiano vero.`,
  ].join('\n\n');
  const r = await c.ask<{ possibile: boolean; racconto: string; risultato?: string; descrizione?: string; quantita?: number; ingredienti?: Array<{ oggetto: string; quantita: number }>; attrezzi?: string[] }>('narratore', 'craft.free', prompt, CRAFT_SCHEMA, {
    data: { text, carrying, known },
    temperature: 0.4,
  });
  return {
    possible: !!r.possibile && !!r.risultato,
    story: String(r.racconto ?? ''),
    result: r.risultato ? String(r.risultato).slice(0, 40) : undefined,
    description: r.descrizione ? String(r.descrizione).slice(0, 200) : undefined,
    count: Math.max(1, Math.min(10, Math.round(Number(r.quantita) || 1))),
    inputs: (r.ingredienti ?? []).slice(0, 5).map((i) => ({ item: String(i.oggetto ?? ''), count: Math.max(1, Math.min(20, Math.round(Number(i.quantita) || 1))) })),
    tools: (r.attrezzi ?? []).slice(0, 3).map(String),
  };
}

const SESSION_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    valutazione: { type: 'STRING', description: 'in una frase: come sta andando il mondo' },
    intervento: { type: 'STRING', enum: ['nessuno', 'oggetti', 'abitante', 'cosa'] },
    richiesta: { type: 'STRING', description: 'per abitante o cosa: la richiesta alla Fucina in una frase; per oggetti: che genere di oggetti mancano' },
  },
  required: ['valutazione', 'intervento'],
};

/**
 * A session of the Council: from time to time it looks at how the world is being played (rules made,
 * people met, places seen) and decides whether to intervene — new items, a new kind of inhabitant, a
 * new thing — so the world keeps evolving coherently with what happened.
 */
export async function councilSession(c: Council, summary: string): Promise<{ assessment: string; action: 'nessuno' | 'oggetti' | 'abitante' | 'cosa'; request?: string }> {
  const r = await c.ask<{ valutazione: string; intervento: string; richiesta?: string }>(
    'arbitro',
    'council.session',
    `Sessione del Concilio. Ecco come il viandante sta vivendo il mondo:\n${summary}\n\nIl mondo deve evolvere restando coerente. Serve un intervento? Al massimo uno: "oggetti" (un pacchetto di oggetti che manca, dì quali), "abitante" (un nuovo tipo di persona che renda più viva la società), "cosa" (un oggetto o mobile del mondo che le azioni del viandante fanno pensare), oppure "nessuno". Interveni solo se serve davvero.`,
    SESSION_SCHEMA,
    { data: { summary }, temperature: 0.6 },
  );
  const action = (['nessuno', 'oggetti', 'abitante', 'cosa'] as const).find((a) => a === r.intervento) ?? 'nessuno';
  return { assessment: String(r.valutazione ?? ''), action, request: r.richiesta ? String(r.richiesta).slice(0, 200) : undefined };
}
