// The coefficients of generation (T45b, ADR-0085): how often every agent asks the model, from 0 (never) to 1 (as
// the game always did). Where a call has a rhythm the coefficient stretches it (sessions every N places, dialogues
// between people, the Sculptor's revisions, plots, models); where it has none it thins what causes it (fewer people
// per place, rarer item packs and new kinds, fewer new entities per place); what the wanderer asks for themselves
// is rationed like the rest (T247, ADR-0133): the share of those requests the models answer, the others go to the local
// models, as when the credits run out. Only the Genesis has no knob: it happens once, before the lobby. «Low Detail» is the game played to save.

import { priceOf, costOf } from './ai/prices';
import { DEFAULT_SCULPTORS, type SculptorAiModels } from './agents/sculptor';
import type { AiConfig } from './types';

export const COEFFICIENT_KEYS = ['sessioni', 'dialoghi', 'trame', 'revisioni', 'modelli', 'persone', 'abitanti', 'pacchetti', 'cose', 'brani', 'luoghi', 'parole', 'sguardi', 'azioni', 'magia', 'morte', 'riparazioni', 'studio'] as const;
export type CoefficientKey = (typeof COEFFICIENT_KEYS)[number];
export type Coefficients = Record<CoefficientKey, number>;

export const FULL_DETAIL: Coefficients = { sessioni: 1, dialoghi: 1, trame: 1, revisioni: 1, modelli: 1, persone: 1, abitanti: 1, pacchetti: 1, cose: 1, brani: 1, luoghi: 1, parole: 1, sguardi: 1, azioni: 1, magia: 1, morte: 1, riparazioni: 1, studio: 1 };

/** «Low Detail»: about a fifth of the calls the world makes by itself, and the cheap model for every figure; what the wanderer asks stays answered. */
export const LOW_DETAIL: { coefficienti: Coefficients; scultori: Partial<SculptorAiModels> } = {
  coefficienti: { sessioni: 0.25, dialoghi: 0.2, trame: 0.34, revisioni: 0.25, modelli: 0.34, persone: 0.5, abitanti: 0.25, pacchetti: 0.25, cose: 0.34, brani: 0.34, luoghi: 1, parole: 1, sguardi: 1, azioni: 1, magia: 1, morte: 1, riparazioni: 1, studio: 1 },
  scultori: { figura: 'gemini-3.1-flash-lite', struttura: 'gemini-3.1-flash-lite', importante: 'gemini-3.8-flash', artista: 'gemini-3.1-flash-lite', musicista: 'gemini-3.1-flash-lite' },
};

/**
 * The Actor (T157, ADR-0116): an option of the master. Off (the default) the Narrator plays every individual as it always did
 * and no call is added; on, the Narrator writes a sheet once per individual (`npc.sheet`) and the Actor plays them
 * (`npc.reply`, `npc.dialogue`) with its own model.
 */
export interface ActorConfig {
  acceso: boolean;
  /** The Actor's model; `ACTOR_MODEL` when it says nothing. */
  modello: string;
}

/**
 * The Actor's default model: the lines of the people are what the player reads most, its prompt is short (a sheet, the
 * memories, the neighbourhood of the graph: no bible, no catalog), so a model a step above Flash-Lite costs little in
 * absolute terms (about a cent for every ten lines); whoever turns the option on asks for better acting, not for less.
 */
export const ACTOR_MODEL = 'gemini-3.8-flash';

/** The Actor's option from what universe.json says: a boolean, a model's name (on, with that model), or an object. */
export function repairActor(raw: unknown): ActorConfig {
  if (typeof raw === 'boolean') return { acceso: raw, modello: ACTOR_MODEL };
  if (typeof raw === 'string') {
    const m = raw.trim();
    if (!m || /^(no|off|spento|false|0)$/i.test(m)) return { acceso: false, modello: ACTOR_MODEL };
    if (/^(s[iì]|on|acceso|true|1)$/i.test(m)) return { acceso: true, modello: ACTOR_MODEL };
    return { acceso: true, modello: m };
  }
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const modello = typeof r.modello === 'string' && r.modello.trim() ? r.modello.trim() : ACTOR_MODEL;
  const acceso = typeof r.acceso === 'boolean' ? r.acceso : typeof r.acceso === 'string' ? /^(s[iì]|on|acceso|true|1)$/i.test(r.acceso.trim()) : r.acceso === 1;
  return { acceso, modello };
}

/** What every coefficient regulates, in the words of the Genesis screen and of the lobby; `minimo` is what the game does at 0. */
export const COEFFICIENT_INFO: Record<CoefficientKey, { nome: string; agente: string; modo: 'diretta' | 'indiretta'; testo: string; minimo: string }> = {
  sessioni: { nome: 'Sessioni del Concilio', agente: 'arbitro', modo: 'diretta', testo: 'ogni 12 luoghi nuovi; a 0,5 ogni 24', minimo: "il Concilio non si riunisce" },
  dialoghi: { nome: 'Dialoghi tra individui', agente: 'narratore', modo: 'diretta', testo: 'al più uno ogni 40 secondi; a 0,5 ogni 80, a 0 solo saluti', minimo: "gli individui si scambiano solo saluti" },
  trame: { nome: 'Trame', agente: 'narratore', modo: 'diretta', testo: 'una nuova quando nessuna è aperta; a 0,5 un giorno sì e uno no', minimo: "nessuna trama nuova" },
  revisioni: { nome: 'Revisioni dei modelli', agente: 'scultore', modo: 'diretta', testo: "sotto 0,75 un programma per le cose semplici, sotto 0,5 niente revisione, sotto 0,25 niente giudizio dell'Artista", minimo: "un programma solo, senza revisione né giudizio" },
  modelli: { nome: 'Modelli nuovi', agente: 'scultore', modo: 'diretta', testo: 'una pausa tra un modello e il successivo: nessuna a 1, un minuto a 0,5', minimo: "solo i modelli generici" },
  persone: { nome: 'Individui per luogo', agente: 'narratore', modo: 'indiretta', testo: 'meno individui: meno risposte e dialoghi', minimo: "nessun individuo nuovo" },
  abitanti: { nome: 'Tipi di abitanti', agente: 'narratore', modo: 'indiretta', testo: 'un tipo nuovo ogni 7 luoghi; a 0,5 ogni 14', minimo: "solo i tipi di abitanti che ci sono" },
  pacchetti: { nome: 'Pacchetti di oggetti', agente: 'narratore', modo: 'indiretta', testo: 'un pacchetto ogni 10 luoghi; a 0,5 ogni 20', minimo: "solo gli oggetti che ci sono" },
  cose: { nome: 'Cose nuove nei luoghi', agente: 'cartografo', modo: 'indiretta', testo: 'meno cose che la Fucina crea per un luogo e meno oggetti sconosciuti a terra', minimo: "nei luoghi solo ciò che esiste già" },
  brani: { nome: 'Brani nuovi', agente: 'musicista', modo: 'diretta', testo: 'un brano per ogni ambiente che non ne ha: due minuti tra uno e il successivo, quattro a 0,5, a 0 nessuno', minimo: "solo la musica che c'è" },
  luoghi: { nome: 'Luoghi nuovi', agente: 'cartografo', modo: 'diretta', testo: 'la parte dei luoghi nuovi che il Cartografo scrive; gli altri nascono dai modelli locali', minimo: 'ogni luogo è abbozzato dai modelli locali, con nomi e cose più semplici' },
  parole: { nome: 'Risposte degli individui', agente: 'narratore', modo: 'diretta', testo: 'la parte delle parole del viandante a cui risponde il modello', minimo: 'gli individui rispondono con frasi brevi e generiche, senza ricordi nuovi' },
  sguardi: { nome: '«Esamina» e «Leggi»', agente: 'narratore', modo: 'diretta', testo: 'la parte degli sguardi che riceve un testo scritto apposta', minimo: 'una descrizione breve e generica' },
  azioni: { nome: '«Altro…» e fabbricazioni libere', agente: 'narratore', modo: 'diretta', testo: 'la parte delle azioni libere e delle combinazioni giudicate dal Narratore', minimo: 'un giudizio semplice: per lo più non succede nulla' },
  magia: { nome: 'Incantesimi e rune nuove', agente: 'narratore', modo: 'diretta', testo: 'la parte degli incantesimi nuovi che il Narratore nomina', minimo: 'nomi ed effetti semplici; le rune del canone restano tutte' },
  morte: { nome: 'Racconto della morte', agente: 'narratore', modo: 'diretta', testo: 'la parte delle morti che il Narratore racconta', minimo: 'vale la punizione scelta alla Genesi, alla lettera' },
  riparazioni: { nome: 'Riparazioni del codice', agente: 'ingegnere', modo: 'diretta', testo: "la parte dei moduli guasti che l'Ingegnere ripara", minimo: 'il modulo guasto resta isolato finché la partita non ricomincia' },
  studio: { nome: 'Richieste nello studio', agente: 'referente', modo: 'diretta', testo: 'la parte delle richieste al Referente e alle squadre, nella corona, che va ai modelli', minimo: 'nello studio rispondono i modelli locali' },
};

/** Why the Genesis has no knob in the lobby: it comes before it (the question is in docs/pipeline/domande/T247.md). */
const GENESIS_ONCE = "una volta, alla Genesi: la lobby viene dopo; chi non vuole pagarla gioca l'universo di esempio";

/**
 * The census of every call (docs/conversazioni.md, T67): what regulates it. `diretta` and `indiretta` name their
 * coefficient; `non regolabile` is only the Genesis, with the reason in `nota` (a test holds this: T247).
 */
export const CENSUS: Array<{ compito: string; agente: string; modo: 'diretta' | 'indiretta' | 'non regolabile'; coefficiente?: CoefficientKey; nota?: string }> = [
  { compito: 'genesis.bible', agente: 'narratore', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.style', agente: 'artista', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.terrain', agente: 'cartografo', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.physics', agente: 'fisico', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.review', agente: 'arbitro', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.layouts', agente: 'cartografo', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.atlas', agente: 'cartografo', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'genesis.cast', agente: 'narratore', modo: 'non regolabile', nota: GENESIS_ONCE },
  { compito: 'chunk.plan', agente: 'cartografo', modo: 'diretta', coefficiente: 'luoghi', nota: 'uno per luogo nuovo: quanto si esplora' },
  { compito: 'cartographer.environment', agente: 'cartografo', modo: 'diretta', coefficiente: 'studio', nota: 'su richiesta nella corona' },
  { compito: 'forge.concept', agente: 'narratore', modo: 'indiretta', coefficiente: 'cose', nota: 'anche abitanti e sessioni' },
  { compito: 'forge.physics', agente: 'fisico', modo: 'indiretta', coefficiente: 'cose' },
  { compito: 'forge.code', agente: 'ingegnere', modo: 'indiretta', coefficiente: 'cose' },
  { compito: 'forge.review', agente: 'arbitro', modo: 'indiretta', coefficiente: 'cose' },
  { compito: 'forge.fix', agente: 'ingegnere', modo: 'diretta', coefficiente: 'riparazioni', nota: 'ripara il codice che fallisce' },
  { compito: 'craft.judge', agente: 'narratore', modo: 'diretta', coefficiente: 'azioni', nota: 'combinazioni del viandante' },
  { compito: 'content.items', agente: 'narratore', modo: 'indiretta', coefficiente: 'pacchetti' },
  { compito: 'content.physics', agente: 'fisico', modo: 'indiretta', coefficiente: 'pacchetti' },
  { compito: 'content.review', agente: 'arbitro', modo: 'indiretta', coefficiente: 'pacchetti' },
  { compito: 'content.recipes', agente: 'narratore', modo: 'indiretta', coefficiente: 'pacchetti' },
  { compito: 'content.define', agente: 'narratore', modo: 'indiretta', coefficiente: 'cose', nota: 'anche ciò che il viandante fabbrica' },
  { compito: 'npc.individuate', agente: 'narratore', modo: 'indiretta', coefficiente: 'persone' },
  { compito: 'npc.sheet', agente: 'narratore', modo: 'indiretta', coefficiente: 'persone', nota: "solo con l'Attore acceso: una scheda per individuo, alla sua prima battuta" },
  { compito: 'action.judge', agente: 'narratore', modo: 'diretta', coefficiente: 'azioni', nota: '«Altro…» del viandante' },
  { compito: 'craft.free', agente: 'narratore', modo: 'diretta', coefficiente: 'azioni', nota: 'fabbricazione libera' },
  { compito: 'spell.name', agente: 'narratore', modo: 'diretta', coefficiente: 'magia', nota: 'un incantesimo nuovo, una volta' },
  { compito: 'rune.invent', agente: 'narratore', modo: 'diretta', coefficiente: 'magia', nota: 'una runa nuova: dalle sessioni o da una formula, al più 16 rune' },
  { compito: 'council.session', agente: 'arbitro', modo: 'diretta', coefficiente: 'sessioni' },
  { compito: 'player.death', agente: 'narratore', modo: 'diretta', coefficiente: 'morte', nota: 'a ogni morte' },
  { compito: 'npc.reply', agente: 'narratore', modo: 'diretta', coefficiente: 'parole', nota: "quando il viandante parla; con l'Attore acceso la fa l'Attore" },
  { compito: 'npc.dialogue', agente: 'narratore', modo: 'diretta', coefficiente: 'dialoghi', nota: "con l'Attore acceso la fa l'Attore" },
  { compito: 'plot.weave', agente: 'narratore', modo: 'diretta', coefficiente: 'trame' },
  { compito: 'text.examine', agente: 'narratore', modo: 'diretta', coefficiente: 'sguardi', nota: '«Esamina»' },
  { compito: 'text.read', agente: 'narratore', modo: 'diretta', coefficiente: 'sguardi', nota: '«Leggi»' },
  { compito: 'referente.coordinate', agente: 'referente', modo: 'diretta', coefficiente: 'studio', nota: 'nella corona' },
  { compito: 'agent.chat', agente: 'referente', modo: 'diretta', coefficiente: 'studio', nota: 'nella corona' },
  { compito: 'model.sculpt', agente: 'scultore', modo: 'diretta', coefficiente: 'modelli', nota: 'e revisioni' },
  { compito: 'model.judge', agente: 'artista', modo: 'diretta', coefficiente: 'revisioni' },
  { compito: 'model.action', agente: 'scultore', modo: 'diretta', coefficiente: 'azioni', nota: '«Altro…» che cambia la forma' },
  { compito: 'mechanic.design', agente: 'ingegnere', modo: 'diretta', coefficiente: 'studio', nota: 'su richiesta (sessioni e Referente)' },
  { compito: 'review.fourthwall', agente: 'narratore', modo: 'indiretta', coefficiente: 'sessioni', nota: 'una volta per universo, per ciò che era nato prima del filtro: a 0 restano i ritiri che il kernel decide da sé' },
  { compito: 'sound.compose', agente: 'musicista', modo: 'diretta', coefficiente: 'brani', nota: 'per gli ambienti senza musica; ciò che chiede il viandante non si dirada' },
];

/** The knobs the Council applies to a call itself (T247): what they do not let through goes to the local models. */
export const RATIONED_KEYS: readonly CoefficientKey[] = ['luoghi', 'parole', 'sguardi', 'azioni', 'magia', 'morte', 'studio'];

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

const PRESETS: Record<string, Coefficients> = { 'low detail': LOW_DETAIL.coefficienti, low: LOW_DETAIL.coefficienti, pieno: FULL_DETAIL, full: FULL_DETAIL };

/** A coefficient from what universe.json says: a number, «0,5», «50%»; clamped to 0-1, 1 when it says nothing. */
function one(v: unknown): number {
  let n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim().replace(',', '.').replace(/%$/, '')) / (/%\s*$/.test(v) ? 100 : 1) : NaN;
  if (!Number.isFinite(n)) return 1;
  if (n > 1 && n <= 100 && typeof v === 'string') n /= 100;
  return Math.round(Math.max(0, Math.min(1, n)) * 100) / 100;
}

/** The coefficients of `ai.coefficienti`, whatever it says: an object (unknown keys dropped), or a preset's name. */
export function repairCoefficients(raw: unknown): Coefficients {
  if (typeof raw === 'string') return { ...(PRESETS[raw.trim().toLowerCase().replace(/[-_«»"]/g, ' ').replace(/\s+/g, ' ')] ?? FULL_DETAIL) };
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(COEFFICIENT_KEYS.map((k) => [k, one(r[k])])) as Coefficients;
}

/** Whether the coefficients are «Low Detail»'s. */
export const isLowDetail = (c: Coefficients) => COEFFICIENT_KEYS.every((k) => c[k] === LOW_DETAIL.coefficienti[k]);

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
/** Calls of a Forge (concept, physics, code, review, and some repair), of an item pack. */
const FORGE_CALLS = 5;
const PACK_CALLS = 4;

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
export function hourlyEstimate(ai: AiConfig, date?: string): { righe: HourLine[]; chiamate: number; dollari: number } {
  const c = repairCoefficients(ai.coefficienti);
  const sc: SculptorAiModels = { ...DEFAULT_SCULPTORS, ...(ai.scultori ?? {}) };
  const actor = repairActor(ai.attore);
  const text = (n: number) => n * (costOf(ai.textModel, WEIGHT.testo, date) ?? 0);
  // Who plays the people: the Actor's model when the option is on (T157), else the text model.
  const played = (n: number) => n * (costOf(actor.acceso ? actor.modello : ai.textModel, WEIGHT.testo, date) ?? 0);
  const H = HOUR;
  const rows: HourLine[] = [];
  const add = (voce: string, modo: HourLine['modo'], chiamate: number, dollari: number) => rows.push({ voce, modo, chiamate: Math.round(chiamate * 10) / 10, dollari });
  const per = (base: number, k: number) => (Number.isFinite(stretch(base, k)) ? H.luoghi / stretch(base, k) : 0);

  add(COEFFICIENT_INFO.luoghi.nome, 'diretta', H.luoghi * c.luoghi, text(H.luoghi * c.luoghi));
  const sessions = per(12, c.sessioni);
  add(COEFFICIENT_INFO.sessioni.nome, 'diretta', sessions * (1 + FORGE_CALLS / 2), text(sessions * (1 + FORGE_CALLS / 2)));
  const packs = Math.min(per(10, c.pacchetti), ai.maxPacks ?? 4);
  add(COEFFICIENT_INFO.pacchetti.nome, 'indiretta', packs * PACK_CALLS, text(packs * PACK_CALLS));
  const kinds = Math.min(per(7, c.abitanti), ai.maxCast ?? 3);
  add(COEFFICIENT_INFO.abitanti.nome, 'indiretta', kinds * FORGE_CALLS, text(kinds * FORGE_CALLS));
  const fresh = Math.min(H.luoghi * H.nuovi * c.cose, ai.maxForges);
  const things = fresh * FORGE_CALLS + H.luoghi * H.ignoti * c.cose;
  add(COEFFICIENT_INFO.cose.nome, 'indiretta', things, text(things));
  const people = H.luoghi * H.persone * c.persone;
  add(COEFFICIENT_INFO.persone.nome, 'indiretta', people * 1.2, text(people * 1.2));
  const talks = c.dialoghi <= 0 ? 0 : (H.vicini / (40 / c.dialoghi)) * Math.min(1, c.persone * 1.5);
  add(COEFFICIENT_INFO.dialoghi.nome, 'diretta', talks, played(talks));
  // The Actor's sheets: one per individual heard for the first time (a conversation, a dialogue), never more than the people met.
  if (actor.acceso) {
    const sheets = Math.min(people, (H.parole * c.parole) / 2 + talks);
    add("Schede dei personaggi (l'Attore acceso)", 'indiretta', sheets, text(sheets));
  }
  const plots = c.trame <= 0 ? 0 : H.giorni / Math.max(4, stretch(1, c.trame));
  add(COEFFICIENT_INFO.trame.nome, 'diretta', plots * 1.3, text(plots * 1.3));
  // Models: what is missing comes from new kinds, packs and structures; the pause between two of them caps it.
  const gap = modelGap(c.modelli);
  const wanted = (kinds + fresh + packs * 2 + H.luoghi * 0.3) * (c.modelli > 0 ? 1 : 0);
  const models = Math.min(wanted, Number.isFinite(gap) ? 3600 / (40 + gap) : 0, ai.maxModels ?? 40);
  const plan = sculptPlan(c.revisioni);
  // Half simple things, half figures and structures (a revision for half of them).
  const writes = models * (0.5 * plan.semplici + 0.5 * (1 + (plan.revisione ? 0.5 : 0)));
  const judges = plan.giudizio ? writes : 0;
  const sculptCost = models * (0.5 * plan.semplici * (costOf(sc.semplice, WEIGHT.scultura, date) ?? 0) + 0.5 * (1 + (plan.revisione ? 0.5 : 0)) * (costOf(sc.figura, WEIGHT.scultura, date) ?? 0));
  add(COEFFICIENT_INFO.modelli.nome, 'diretta', writes, sculptCost);
  add(COEFFICIENT_INFO.revisioni.nome, 'diretta', judges, judges * (costOf(sc.artista, WEIGHT.giudizio, date) ?? 0));
  // The Musician: a program for each environment that has none, a third of them sent back once.
  const pause = pieceGap(c.brani);
  const pieces = Number.isFinite(pause) ? Math.min(H.ambientiSenzaBrano, 3600 / pause, ai.maxBrani ?? 8) * 1.34 : 0;
  add(COEFFICIENT_INFO.brani.nome, 'diretta', pieces, pieces * (costOf(sc.musicista, WEIGHT.scultura, date) ?? 0));
  // What the wanderer asks: the share of it the knobs let through to the models.
  add(COEFFICIENT_INFO.parole.nome, 'diretta', H.parole * c.parole, played(H.parole * c.parole));
  add(COEFFICIENT_INFO.azioni.nome, 'diretta', H.azioni * c.azioni, text(H.azioni * c.azioni));
  add(COEFFICIENT_INFO.sguardi.nome, 'diretta', H.sguardi * c.sguardi, text(H.sguardi * c.sguardi));
  return { righe: rows, chiamate: Math.round(rows.reduce((s, r) => s + r.chiamate, 0)), dollari: rows.reduce((s, r) => s + r.dollari, 0) };
}

/** The models the Genesis screen offers: every priced one. */
export const pricedAiModels = (): string[] => ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-pro-preview'].filter((m) => priceOf(m));
