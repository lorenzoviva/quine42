// The coefficients of generation (T45b, ADR-0085): how often every agent asks the model, from 0 (never) to 1 (as
// the game always did). Where a call has a rhythm the coefficient stretches it (sessions every N places, dialogues
// between people, the Sculptor's revisions, plots, models); where it has none it thins what causes it (fewer people
// per place, rarer item packs and new kinds, fewer new entities per place); what the wanderer asks for themselves
// is rationed like the rest (T247, ADR-0133): the share of those requests the models answer, the others go to the local
// models, as when the credits run out. Only the Genesis has no knob: it happens once, before the lobby. «Low Detail» is the game played to save.

import { cacheable, costOf, EXPLICIT_CACHE, priceOf } from './ai/prices';
import { JEV_MODEL, JEV_ZERO_RETENTION } from './ai/decisions';
import { DEFAULT_SCULPTORS, type SculptorAiModels } from './agents/sculptor';
import type { AiConfig } from './types';
import { internalCoefficients, internalFields, internalSculptors } from './internalNames';

export const COEFFICIENT_KEYS = ['sessions', 'dialogues', 'plots', 'reviews', 'models', 'people', 'inhabitants', 'packs', 'entities', 'pieces', 'chunks', 'words', 'looks', 'actions', 'magic', 'death', 'repairs', 'studio', 'lives'] as const;
export type CoefficientKey = (typeof COEFFICIENT_KEYS)[number];
export type Coefficients = Record<CoefficientKey, number>;

export const FULL_DETAIL: Coefficients = { sessions: 1, dialogues: 1, plots: 1, reviews: 1, models: 1, people: 1, inhabitants: 1, packs: 1, entities: 1, pieces: 1, chunks: 1, words: 1, looks: 1, actions: 1, magic: 1, death: 1, repairs: 1, studio: 1, lives: 1 };

/** «Low Detail»: about a fifth of the calls the world makes by itself, and the cheap model for every figure; what the wanderer asks stays answered. */
export const LOW_DETAIL: { coefficients: Coefficients; sculptors: Partial<SculptorAiModels> } = {
  coefficients: { sessions: 0.25, dialogues: 0.2, plots: 0.34, reviews: 0.25, models: 0.34, people: 0.5, inhabitants: 0.25, packs: 0.25, entities: 0.34, pieces: 0.34, chunks: 1, words: 1, looks: 1, actions: 1, magic: 1, death: 1, repairs: 1, studio: 1, lives: 0.2 },
  sculptors: { figure: 'gemini-3.1-flash-lite', structure: 'gemini-3.1-flash-lite', important: 'gemini-3.8-flash', artist: 'gemini-3.1-flash-lite', musician: 'gemini-3.1-flash-lite' },
};

/**
 * The Actor (T157, ADR-0116): an option of the master. Off (the default) the Narrator plays every individual as it always did
 * and no call is added; on, the Narrator writes a sheet once per individual (`npc.sheet`) and the Actor plays them
 * (`npc.reply`, `npc.dialogue`) with its own model.
 */
export interface ActorConfig {
  on: boolean;
  /** The Actor's model; `ACTOR_MODEL` when it says nothing. */
  model: string;
}

/**
 * The Actor's default model: the lines of the people are what the player reads most, its prompt is short (a sheet, the
 * memories, the neighbourhood of the graph: no bible, no catalog), so a model a step above Flash-Lite costs little in
 * absolute terms (about a cent for every ten lines); whoever turns the option on asks for better acting, not for less.
 */
export const ACTOR_MODEL = 'gemini-3.8-flash';

/** The Actor's option from what universe.json says: a boolean, a model's name (on, with that model), or an object. */
export function repairActor(raw: unknown): ActorConfig {
  if (typeof raw === 'boolean') return { on: raw, model: ACTOR_MODEL };
  if (typeof raw === 'string') {
    const m = raw.trim();
    if (!m || /^(no|off|spento|false|0)$/i.test(m)) return { on: false, model: ACTOR_MODEL };
    if (/^(s[iì]|on|acceso|true|1)$/i.test(m)) return { on: true, model: ACTOR_MODEL };
    return { on: true, model: m };
  }
  // The fields of the contract 0.3 (`acceso`, `modello`) read internal (T308a).
  const r = internalFields('actor', (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>);
  const model = typeof r.model === 'string' && r.model.trim() ? r.model.trim() : ACTOR_MODEL;
  const on = typeof r.on === 'boolean' ? r.on : typeof r.on === 'string' ? /^(s[iì]|on|acceso|true|1)$/i.test(r.on.trim()) : r.on === 1;
  return { on, model };
}

/** What every coefficient regulates, in the words of the Genesis screen and of the lobby; `minimo` is what the game does at 0. */
export const COEFFICIENT_INFO: Record<CoefficientKey, { nome: string; agente: string; modo: 'diretta' | 'indiretta'; testo: string; minimo: string }> = {
  sessions: { nome: 'Sessioni del Concilio', agente: 'arbiter', modo: 'diretta', testo: 'ogni 12 luoghi nuovi; a 0,5 ogni 24', minimo: "il Concilio non si riunisce" },
  dialogues: { nome: 'Dialoghi tra individui', agente: 'narrator', modo: 'diretta', testo: 'al più uno ogni 40 secondi; a 0,5 ogni 80, a 0 solo saluti', minimo: "gli individui si scambiano solo saluti" },
  plots: { nome: 'Trame', agente: 'narrator', modo: 'diretta', testo: 'una nuova quando nessuna è aperta; a 0,5 un giorno sì e uno no', minimo: "nessuna trama nuova" },
  reviews: { nome: 'Revisioni dei modelli', agente: 'sculptor', modo: 'diretta', testo: "sotto 0,75 un programma per le cose semplici, sotto 0,5 niente revisione, sotto 0,25 niente giudizio dell'Artista", minimo: "un programma solo, senza revisione né giudizio" },
  models: { nome: 'Modelli nuovi', agente: 'sculptor', modo: 'diretta', testo: 'una pausa tra un modello e il successivo: nessuna a 1, un minuto a 0,5', minimo: "solo i modelli generici" },
  people: { nome: 'Individui per luogo', agente: 'narrator', modo: 'indiretta', testo: 'meno individui: meno risposte e dialoghi', minimo: "nessun individuo nuovo" },
  inhabitants: { nome: 'Tipi di abitanti', agente: 'narrator', modo: 'indiretta', testo: 'un tipo nuovo ogni 7 luoghi; a 0,5 ogni 14', minimo: "solo i tipi di abitanti che ci sono" },
  packs: { nome: 'Pacchetti di oggetti', agente: 'narrator', modo: 'indiretta', testo: 'un pacchetto ogni 10 luoghi; a 0,5 ogni 20', minimo: "solo gli oggetti che ci sono" },
  entities: { nome: 'Cose nuove nei luoghi', agente: 'cartographer', modo: 'indiretta', testo: 'meno cose che la Fucina crea per un luogo e meno oggetti sconosciuti a terra', minimo: "nei luoghi solo ciò che esiste già" },
  pieces: { nome: 'Brani nuovi', agente: 'musician', modo: 'diretta', testo: 'un brano per ogni ambiente che non ne ha: due minuti tra uno e il successivo, quattro a 0,5, a 0 nessuno', minimo: "solo la musica che c'è" },
  chunks: { nome: 'Luoghi nuovi', agente: 'cartographer', modo: 'diretta', testo: 'la parte dei luoghi nuovi che il Cartografo scrive; gli altri nascono dai modelli locali', minimo: 'ogni luogo è abbozzato dai modelli locali, con nomi e cose più semplici' },
  words: { nome: 'Risposte degli individui', agente: 'narrator', modo: 'diretta', testo: 'la parte delle parole del viandante a cui risponde il modello', minimo: 'gli individui rispondono con frasi brevi e generiche, senza ricordi nuovi' },
  looks: { nome: '«Esamina» e «Leggi»', agente: 'narrator', modo: 'diretta', testo: 'la parte degli sguardi che riceve un testo scritto apposta', minimo: 'una descrizione breve e generica' },
  actions: { nome: '«Altro…» e fabbricazioni libere', agente: 'narrator', modo: 'diretta', testo: 'la parte delle azioni libere e delle combinazioni giudicate dal Narratore', minimo: 'un giudizio semplice: per lo più non succede nulla' },
  magic: { nome: 'Incantesimi e rune nuove', agente: 'narrator', modo: 'diretta', testo: 'la parte degli incantesimi nuovi che il Narratore nomina', minimo: 'nomi ed effetti semplici; le rune del canone restano tutte' },
  death: { nome: 'Racconto della morte', agente: 'narrator', modo: 'diretta', testo: 'la parte delle morti che il Narratore racconta', minimo: 'vale la punizione scelta alla Genesi, alla lettera' },
  repairs: { nome: 'Riparazioni del codice', agente: 'engineer', modo: 'diretta', testo: "la parte dei moduli guasti che l'Ingegnere ripara", minimo: 'il modulo guasto resta isolato finché la partita non ricomincia' },
  studio: { nome: 'Richieste nello studio', agente: 'liaison', modo: 'diretta', testo: 'la parte delle richieste al Referente e alle squadre, nella corona, che va ai modelli', minimo: 'nello studio rispondono i modelli locali' },
  lives: { nome: 'Vite degli individui', agente: 'narrator', modo: 'diretta', testo: 'Cronaca a 0, Vita a 0,5, Teatro a 1: quanto spesso gli individui scelgono, riflettono e hanno mestieri e imprese scritti apposta', minimo: 'Cronaca: gli individui vivono dei loro mestieri come li sa il mondo, nessuno cambia idea' },
};

/**
 * What a knob is worth when universe.json does not say it: 1 (the game as it always was), but `lives` (T245a, ADR-0138; `vite` before T307b) is 0, Cronaca. A
 * universe of before never chose Teatro, and must not pay for it on its own.
 */
export const ABSENT: Partial<Record<CoefficientKey, number>> = { lives: 0 };

/** Why the Genesis has no knob in the lobby: it comes before it (the question is in docs/pipeline/domande/T247.md). */
const GENESIS_ONCE = "una volta, alla Genesi: la lobby viene dopo; chi non vuole pagarla gioca l'universo di esempio";

/**
 * The census of every call (docs/conversazioni.md, T67): what regulates it. `diretta` and `indiretta` name their
 * coefficient; `non regolabile` is only the Genesis, with the reason in `nota` (a test holds this: T247). `via: 'decide'` is a closed
 * decision (ADR-0157): it goes to the layer of decisions (`ai/decisions.ts`, Jev), never to a model that writes, and only these tasks may.
 */
export const CENSUS: Array<{ compito: string; agente: string; modo: 'diretta' | 'indiretta' | 'non regolabile'; coefficiente?: CoefficientKey; via?: 'decide'; freeText?: true; nota?: string }> = [
  { compito: 'genesis.bible', agente: 'narrator', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.style', agente: 'artist', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.terrain', agente: 'cartographer', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.physics', agente: 'physicist', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.review', agente: 'arbiter', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.layouts', agente: 'cartographer', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.atlas', agente: 'cartographer', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.cast', agente: 'narrator', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'chunk.plan', agente: 'cartographer', modo: 'diretta', coefficiente: 'chunks', nota: 'uno per luogo nuovo: quanto si esplora' },
  { compito: 'cartographer.environment', agente: 'cartographer', modo: 'diretta', coefficiente: 'studio', nota: 'su richiesta nella corona' },
  { compito: 'forge.concept', agente: 'narrator', modo: 'indiretta', coefficiente: 'entities', nota: 'anche abitanti e sessioni' },
  { compito: 'forge.physics', agente: 'physicist', modo: 'indiretta', coefficiente: 'entities' },
  { compito: 'forge.code', agente: 'engineer', modo: 'indiretta', coefficiente: 'entities' },
  { compito: 'forge.review', agente: 'arbiter', modo: 'indiretta', coefficiente: 'entities' },
  { compito: 'forge.fix', agente: 'engineer', modo: 'diretta', coefficiente: 'repairs', nota: 'ripara il codice che fallisce' },
  { compito: 'craft.judge', agente: 'narrator', modo: 'diretta', coefficiente: 'actions', nota: 'combinazioni del viandante' },
  { compito: 'content.items', agente: 'narrator', modo: 'indiretta', coefficiente: 'packs' },
  { compito: 'content.physics', agente: 'physicist', modo: 'indiretta', coefficiente: 'packs' },
  { compito: 'content.review', agente: 'arbiter', modo: 'indiretta', coefficiente: 'packs' },
  { compito: 'content.recipes', agente: 'narrator', modo: 'indiretta', coefficiente: 'packs' },
  { compito: 'content.define', agente: 'narrator', modo: 'indiretta', coefficiente: 'entities', nota: 'anche ciò che il viandante fabbrica' },
  { compito: 'npc.individuate', agente: 'narrator', modo: 'indiretta', coefficiente: 'people' },
  { compito: 'npc.sheet', agente: 'narrator', modo: 'indiretta', coefficiente: 'people', nota: "solo con l'Attore acceso: una scheda per individuo, alla sua prima battuta" },
  { compito: 'action.judge', agente: 'narrator', modo: 'diretta', coefficiente: 'actions', nota: '«Altro…» del viandante' },
  { compito: 'craft.free', agente: 'narrator', modo: 'diretta', coefficiente: 'actions', nota: 'fabbricazione libera' },
  { compito: 'spell.name', agente: 'narrator', modo: 'diretta', coefficiente: 'magic', nota: 'un incantesimo nuovo, una volta' },
  { compito: 'rune.invent', agente: 'narrator', modo: 'diretta', coefficiente: 'magic', nota: 'una runa nuova: dalle sessioni o da una formula, al più 16 rune' },
  { compito: 'council.session', agente: 'arbiter', modo: 'diretta', coefficiente: 'sessions' },
  { compito: 'player.death', agente: 'narrator', modo: 'diretta', coefficiente: 'death', nota: 'a ogni morte' },
  { compito: 'npc.reply', agente: 'narrator', modo: 'diretta', coefficiente: 'words', nota: "quando il viandante parla; con l'Attore acceso la fa l'Attore" },
  { compito: 'npc.dialogue', agente: 'narrator', modo: 'diretta', coefficiente: 'dialogues', nota: "con l'Attore acceso la fa l'Attore" },
  { compito: 'plot.weave', agente: 'narrator', modo: 'diretta', coefficiente: 'plots' },
  { compito: 'text.examine', agente: 'narrator', modo: 'diretta', coefficiente: 'looks', nota: '«Esamina»' },
  { compito: 'text.read', agente: 'narrator', modo: 'diretta', coefficiente: 'looks', nota: '«Leggi»' },
  { compito: 'referente.coordinate', agente: 'liaison', modo: 'diretta', coefficiente: 'studio', nota: 'nella corona' },
  { compito: 'agent.chat', agente: 'liaison', modo: 'diretta', coefficiente: 'studio', nota: 'nella corona' },
  { compito: 'model.sculpt', agente: 'sculptor', modo: 'diretta', coefficiente: 'models', nota: 'e revisioni' },
  { compito: 'model.judge', agente: 'artist', modo: 'diretta', coefficiente: 'reviews' },
  { compito: 'model.action', agente: 'sculptor', modo: 'diretta', coefficiente: 'actions', nota: '«Altro…» che cambia la forma' },
  { compito: 'mechanic.design', agente: 'engineer', modo: 'diretta', coefficiente: 'studio', nota: 'su richiesta (sessioni e Referente)' },
  { compito: 'review.fourthwall', agente: 'narrator', modo: 'indiretta', coefficiente: 'sessions', nota: 'una volta per universo, per ciò che era nato prima del filtro: a 0 restano i ritiri che il kernel decide da sé' },
  { compito: 'sound.compose', agente: 'musician', modo: 'diretta', coefficiente: 'pieces', nota: 'per gli ambienti senza musica; ciò che chiede il viandante non si dirada' },
  // The closed decisions (ADR-0157): the knob at 0 means today's rule, without a call.
  { compito: 'model.reuse', agente: 'sculptor', modo: 'diretta', coefficiente: 'models', via: 'decide', nota: 'prima di scolpire: un modello che c’è già va bene? Una scelta, non un testo' },
  // T350: the fourth wall on what the Council writes for the world, with `metaBreak` in front; the knob of the Council's sessions, as `review.fourthwall`.
  { compito: 'text.fourthwall', agente: 'arbiter', modo: 'indiretta', coefficiente: 'sessions', via: 'decide', nota: 'ciò che il Concilio scrive per il mondo rompe la quarta parete? Quattro sì o no dopo il filtro di parole' },
  // T350: the guard on what the wanderer writes (D45.5). Their free text: the rule answers until TypeSafe keeps nothing (D45.3).
  { compito: 'text.guard', agente: 'arbiter', modo: 'diretta', coefficiente: 'words', via: 'decide', freeText: true, nota: 'ciò che scrive il viandante detta ordini, è senza senso o fuori dal mondo? Mai isolato: va al Narratore, che resta nel mondo' },
];

/** The knob of a closed decision (ADR-0157), or undefined: a task the census does not name as a decision is never asked to the layer. */
export const decisionKnob = (task: string): CoefficientKey | undefined => CENSUS.find((c) => c.compito === task && c.via === 'decide')?.coefficiente;

/**
 * Whether a decision's state carries the free text of a wanderer (D45.3): until TypeSafe offers zero retention (`JEV_ZERO_RETENTION`) such a
 * call never leaves the kernel, the local models answer with the rule.
 */
export const freeTextDecision = (task: string): boolean => !JEV_ZERO_RETENTION && !!CENSUS.find((c) => c.compito === task && c.via === 'decide')?.freeText;

/** The knobs the Council applies to a call itself (T247): what they do not let through goes to the local models. */
export const RATIONED_KEYS: readonly CoefficientKey[] = ['chunks', 'words', 'looks', 'actions', 'magic', 'death', 'studio'];

/** The knob that rations a task, if the Council rations it. `forge.fix` is not here: a local repair would empty the module, so the kernel does not ask. */
export const rationedKnob = (task: string): CoefficientKey | undefined => {
  const k = CENSUS.find((c) => c.compito === task)?.coefficiente;
  return k && RATIONED_KEYS.includes(k) ? k : undefined;
};

/**
 * The knob of a task whose call, at 0, goes to the local models whatever else thins it: every row of the census but the Genesis's and
 * `forge.fix` (which the kernel keeps itself). The indirect ones are thinned where they arise (ADR-0085), but what the wanderer causes
 * (a name for who they talk to, an item they mention) comes here too, and 0 means no call.
 */
export const knobOfTask = (task: string): CoefficientKey | undefined => (task === 'forge.fix' ? undefined : CENSUS.find((c) => c.compito === task)?.coefficiente);

/**
 * How many calls of a knob go through: with `c` of 0.5 one in two, always in the same order, never by a draw (ADR-0055):
 * the share accumulates and every whole one is a call.
 */
export class Rationing {
  private carried = new Map<CoefficientKey, number>();

  allows(key: CoefficientKey, c: number): boolean {
    if (c >= 1) return true;
    if (c <= 0) return false;
    const n = (this.carried.get(key) ?? 0) + c;
    const through = n >= 1 - 1e-9;
    this.carried.set(key, through ? n - 1 : n);
    return through;
  }
}

const PRESETS: Record<string, Coefficients> = { 'low detail': LOW_DETAIL.coefficients, low: LOW_DETAIL.coefficients, pieno: FULL_DETAIL, full: FULL_DETAIL };

/** A coefficient from what universe.json says: a number, «0,5», «50%»; clamped to 0-1, `absent` (1) when it says nothing. */
function one(v: unknown, absent = 1): number {
  let n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim().replace(',', '.').replace(/%$/, '')) / (/%\s*$/.test(v) ? 100 : 1) : NaN;
  if (!Number.isFinite(n)) return absent;
  if (n > 1 && n <= 100 && typeof v === 'string') n /= 100;
  return Math.round(Math.max(0, Math.min(1, n)) * 100) / 100;
}

/** The coefficients of `ai.coefficienti`, whatever it says: an object (unknown keys dropped), or a preset's name. */
export function repairCoefficients(raw: unknown): Coefficients {
  if (typeof raw === 'string') return { ...(PRESETS[raw.trim().toLowerCase().replace(/[-_«»"]/g, ' ').replace(/\s+/g, ' ')] ?? repairCoefficients(undefined)) };
  // The keys of the contract 0.2 (`trame`, `vite`) read internal (T307b).
  const r = internalCoefficients((raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>);
  return Object.fromEntries(COEFFICIENT_KEYS.map((k) => [k, one(r[k], ABSENT[k] ?? 1)])) as Coefficients;
}

/** Whether the coefficients are «Low Detail»'s. */
export const isLowDetail = (c: Coefficients) => COEFFICIENT_KEYS.every((k) => c[k] === LOW_DETAIL.coefficients[k]);

/** A rhythm of `base` stretched by a coefficient: every `base / c` (Infinity at 0). */
export const stretch = (base: number, c: number): number => (c <= 0 ? Infinity : Math.max(base, Math.round(base / c)));

/** Whether the `n`-th occurrence of something that happens every `base` happens with the coefficient. */
export const onBeat = (n: number, base: number, c: number): boolean => {
  const every = stretch(base, c);
  return Number.isFinite(every) && n > 0 && n % every === 0;
};

/** How the Sculptor works for a coefficient of revisions: programs for the simple things, a revision, the Artist. */
export function sculptPlan(c: number): { semplici: number; revisione: boolean; giudizio: boolean } {
  return { semplici: c >= 0.75 ? 2 : 1, revisione: c >= 0.5, giudizio: c >= 0.25 };
}

/** Seconds of pause after a piece of music, for the coefficient of pieces (Infinity at 0: the music there is). */
export const pieceGap = (c: number): number => (c <= 0 ? Infinity : Math.round(120 / c));

/** Seconds of pause after a model, for the coefficient of models (Infinity at 0: generic models only). */
export const modelGap = (c: number): number => (c <= 0 ? Infinity : Math.round(60 * (1 / c - 1)));

// The estimate of an hour of play: what a wanderer usually does in an hour, and what a call usually weighs. They are
// assumptions, said as such on the screen; the ledger (`kernel.usage`) says what was really spent.
export const HOUR = {
  /** New places walked into. */
  luoghi: 40,
  /** Days of the world (10 minutes each). */
  giorni: 6,
  /** People met per place, and the share of them met for the first time. */
  persone: 1.5,
  /** Seconds out of the hour spent near two people who could talk. */
  vicini: 1800,
  /** Environments walked in that no program names yet. */
  ambientiSenzaBrano: 4,
  /** New entities the Cartographer asks for, unknown items on the ground, per place. */
  nuovi: 0.3,
  ignoti: 0.3,
  /** What the wanderer asks: words to people, «Altro…» and fabrications, «Esamina» and «Leggi». */
  parole: 20,
  azioni: 8,
  sguardi: 10,
};

/** Tokens of a typical call: text tasks, a program of the Sculptor, a judgement of the Artist (with its image). */
const WEIGHT = { testo: { prompt: 3500, cached: 1500, output: 500 }, scultura: { prompt: 7000, cached: 2500, output: 3000 }, giudizio: { prompt: 3800, cached: 0, output: 300 } };
/**
 * The Actor with its explicit cache (T351, ADR-0185): of a call, the share of the prompt its system instructions are (T325 measured 70 % of
 * the Actor's prompt as stable prefix), served at the cache price; the prefix the cache keeps (T325: about 5.400 tokens), written again
 * every `ttl` while the Actor plays, its storage paid for the whole `ttl`.
 */
export const ACTOR_CACHED_SHARE = 0.7;
export const ACTOR_PREFIX_TOKENS = 5400;
/** Calls of a Forge (concept, physics, code, review, and some repair), of an item pack. */
const FORGE_CALLS = 5;
const PACK_CALLS = 4;

/**
 * The reuse of the library before the Sculptor (T349, ADR-0157 §4.1), when Jev decides: the share of the models a world asks for that is
 * of a class that may wear one of the library and has one to wear (`REUSE_ASKED`, measured on an offline Genesis by
 * `lab/scripts/riuso-modelli.ts`), and the share of those Jev finds one that fits (`REUSE_HIT`, the middle of T325's 30-50 %: the bench's cases
 * were chosen to be mostly reusable, 81 %, so they are not the world's). Their product is the share of the sculptures saved.
 */
export const REUSE_ASKED = 0.4;
export const REUSE_HIT = 0.4;
export const REUSE_SHARE = REUSE_ASKED * REUSE_HIT;
/** Tokens of a `model.reuse` question: the thing and the library of its class (about 300 on an offline Genesis; more as the library grows). */
const REUSE_WEIGHT = { prompt: 800, cached: 0, output: 0 };
/** Tokens of a `text.fourthwall` call: four questions (about 450), the world in a line and the text (T313's bench: 569 with a short text). */
const WALL_WEIGHT = { prompt: 900, cached: 0, output: 0 };

export interface HourLine {
  voce: string;
  modo: 'diretta' | 'indiretta' | 'non regolabile';
  chiamate: number;
  dollari: number;
}

/**
 * What an hour of play usually costs with this configuration: the calls of every kind and their dollars, on the
 * prices of today. The budgets of `ai` (per session) cap what the world does by itself.
 */
export function hourlyEstimate(ai: AiConfig, date?: string, opts: { decisions?: boolean } = {}): { righe: HourLine[]; chiamate: number; dollari: number } {
  const c = repairCoefficients(ai.coefficients);
  const sc: SculptorAiModels = { ...DEFAULT_SCULPTORS, ...internalSculptors(ai.sculptors ?? {}) };
  const actor = repairActor(ai.actor);
  const text = (n: number) => n * (costOf(ai.textModel, WEIGHT.testo, date) ?? 0);
  // Who plays the people: the Actor's model when the option is on (T157), else the text model.
  // With the Actor's explicit cache (T351) the stable part of its prompt is paid at the cache price.
  const actorCache = actor.on && cacheable(actor.model, date);
  const playedWeight = actorCache ? { ...WEIGHT.testo, cached: Math.round(WEIGHT.testo.prompt * ACTOR_CACHED_SHARE) } : WEIGHT.testo;
  const played = (n: number) => n * (costOf(actor.on ? actor.model : ai.textModel, playedWeight, date) ?? 0);
  const H = HOUR;
  const rows: HourLine[] = [];
  const add = (voce: string, modo: HourLine['modo'], chiamate: number, dollari: number) => rows.push({ voce, modo, chiamate: Math.round(chiamate * 10) / 10, dollari });
  const per = (base: number, k: number) => (Number.isFinite(stretch(base, k)) ? H.luoghi / stretch(base, k) : 0);

  add(COEFFICIENT_INFO.chunks.nome, 'diretta', H.luoghi * c.chunks, text(H.luoghi * c.chunks));
  const sessions = per(12, c.sessions);
  add(COEFFICIENT_INFO.sessions.nome, 'diretta', sessions * (1 + FORGE_CALLS / 2), text(sessions * (1 + FORGE_CALLS / 2)));
  const packs = Math.min(per(10, c.packs), ai.maxPacks ?? 4);
  add(COEFFICIENT_INFO.packs.nome, 'indiretta', packs * PACK_CALLS, text(packs * PACK_CALLS));
  const kinds = Math.min(per(7, c.inhabitants), ai.maxCast ?? 3);
  add(COEFFICIENT_INFO.inhabitants.nome, 'indiretta', kinds * FORGE_CALLS, text(kinds * FORGE_CALLS));
  const fresh = Math.min(H.luoghi * H.nuovi * c.entities, ai.maxForges);
  const things = fresh * FORGE_CALLS + H.luoghi * H.ignoti * c.entities;
  add(COEFFICIENT_INFO.entities.nome, 'indiretta', things, text(things));
  const people = H.luoghi * H.persone * c.people;
  add(COEFFICIENT_INFO.people.nome, 'indiretta', people * 1.2, text(people * 1.2));
  const talks = c.dialogues <= 0 ? 0 : (H.vicini / (40 / c.dialogues)) * Math.min(1, c.people * 1.5);
  add(COEFFICIENT_INFO.dialogues.nome, 'diretta', talks, played(talks));
  // The Actor's sheets: one per individual heard for the first time (a conversation, a dialogue), never more than the people met.
  if (actor.on) {
    const sheets = Math.min(people, (H.parole * c.words) / 2 + talks);
    add("Schede dei personaggi (l'Attore acceso)", 'indiretta', sheets, text(sheets));
  }
  // The explicit cache of the Actor (T351): written once a `ttl` while it plays, paid by everybody (`comune`).
  if (actorCache && talks + H.parole * c.words > 0) {
    const ttl = EXPLICIT_CACHE.ttl;
    const writes = 3600 / ttl;
    const write = costOf(actor.model, { prompt: ACTOR_PREFIX_TOKENS, output: 0, stored: (ACTOR_PREFIX_TOKENS * ttl) / 3600 }, date) ?? 0;
    add("Cache dell'Attore (scrittura e conservazione)", 'non regolabile', writes, writes * write);
  }
  const plots = c.plots <= 0 ? 0 : H.giorni / Math.max(4, stretch(1, c.plots));
  add(COEFFICIENT_INFO.plots.nome, 'diretta', plots * 1.3, text(plots * 1.3));
  // With Jev (T350), the fourth wall on what the Council writes for the world: a concept, an individual, a sheet, a plot; four questions each.
  if (opts.decisions && c.sessions > 0) {
    const walls = fresh + kinds + people + plots * 1.3;
    add('Quarta parete sui testi nuovi (Jev)', 'indiretta', walls, walls * (costOf(JEV_MODEL, WALL_WEIGHT, date) ?? 0));
  }
  // Models: what is missing comes from new kinds, packs and structures; the pause between two of them caps it.
  const gap = modelGap(c.models);
  const wanted = (kinds + fresh + packs * 2 + H.luoghi * 0.3) * (c.models > 0 ? 1 : 0);
  let models = Math.min(wanted, Number.isFinite(gap) ? 3600 / (40 + gap) : 0, ai.maxModels ?? 40);
  const plan = sculptPlan(c.reviews);
  // With Jev (T349) a share of them wears a model of the library: asked once each, not sculpted nor judged.
  const asked = opts.decisions ? models * REUSE_ASKED : 0;
  if (opts.decisions) {
    add('Riuso dei modelli della libreria (Jev)', 'diretta', asked, asked * (costOf(JEV_MODEL, REUSE_WEIGHT, date) ?? 0));
    models -= asked * REUSE_HIT;
  }
  // Half simple things, half figures and structures (a revision for half of them).
  const writes = models * (0.5 * plan.semplici + 0.5 * (1 + (plan.revisione ? 0.5 : 0)));
  const judges = plan.giudizio ? writes : 0;
  const sculptCost = models * (0.5 * plan.semplici * (costOf(sc.simple, WEIGHT.scultura, date) ?? 0) + 0.5 * (1 + (plan.revisione ? 0.5 : 0)) * (costOf(sc.figure, WEIGHT.scultura, date) ?? 0));
  add(COEFFICIENT_INFO.models.nome, 'diretta', writes, sculptCost);
  add(COEFFICIENT_INFO.reviews.nome, 'diretta', judges, judges * (costOf(sc.artist, WEIGHT.giudizio, date) ?? 0));
  // The Musician: a program for each environment that has none, a third of them sent back once.
  const pause = pieceGap(c.pieces);
  const pieces = Number.isFinite(pause) ? Math.min(H.ambientiSenzaBrano, 3600 / pause, ai.maxPieces ?? 8) * 1.34 : 0;
  add(COEFFICIENT_INFO.pieces.nome, 'diretta', pieces, pieces * (costOf(sc.musician, WEIGHT.scultura, date) ?? 0));
  // What the wanderer asks: the share of it the knobs let through to the models.
  add(COEFFICIENT_INFO.words.nome, 'diretta', H.parole * c.words, played(H.parole * c.words));
  add(COEFFICIENT_INFO.actions.nome, 'diretta', H.azioni * c.actions, text(H.azioni * c.actions));
  add(COEFFICIENT_INFO.looks.nome, 'diretta', H.sguardi * c.looks, text(H.sguardi * c.looks));
  // The lives of the people (T245a): their tasks come with T245g-T245i; until then a row with no call, whatever the knob says.
  add(COEFFICIENT_INFO.lives.nome, 'diretta', 0, 0);
  return { righe: rows, chiamate: Math.round(rows.reduce((s, r) => s + r.chiamate, 0)), dollari: rows.reduce((s, r) => s + r.dollari, 0) };
}

/** The models the Genesis screen offers: every priced one. */
export const pricedAiModels = (): string[] => ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-pro-preview'].filter((m) => priceOf(m));
