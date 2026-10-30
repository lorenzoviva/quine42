// The coefficients of generation (T45b, ADR-0085): how often every agent asks the model, from 0 (never) to 1 (as
// the game always did). Where a call has a rhythm the coefficient stretches it (sessions every N places, dialogues
// between people, the Sculptor's revisions, plots, models); where it has none it thins what causes it (fewer people
// per place, rarer item packs and new kinds, fewer new things per place); what the wanderer asks for themselves
// cannot be thinned, and the Genesis screen says what it costs. «Low Detail» is the game played to save.

import { priceOf, costOf } from './ai/prices';
import { DEFAULT_SCULPTORS, type SculptorModels } from './agents/sculptor';
import type { AiConfig } from './types';

export const COEFFICIENT_KEYS = ['sessioni', 'dialoghi', 'trame', 'revisioni', 'modelli', 'persone', 'abitanti', 'pacchetti', 'cose'] as const;
export type CoefficientKey = (typeof COEFFICIENT_KEYS)[number];
export type Coefficients = Record<CoefficientKey, number>;

export const FULL_DETAIL: Coefficients = { sessioni: 1, dialoghi: 1, trame: 1, revisioni: 1, modelli: 1, persone: 1, abitanti: 1, pacchetti: 1, cose: 1 };

/** «Low Detail»: about a fifth of the calls the world makes by itself, and the cheap model for every figure. */
export const LOW_DETAIL: { coefficienti: Coefficients; scultori: Partial<SculptorModels> } = {
  coefficienti: { sessioni: 0.25, dialoghi: 0.2, trame: 0.34, revisioni: 0.25, modelli: 0.34, persone: 0.5, abitanti: 0.25, pacchetti: 0.25, cose: 0.34 },
  scultori: { figura: 'gemini-3.1-flash-lite', struttura: 'gemini-3.1-flash-lite', importante: 'gemini-3.8-flash', artista: 'gemini-3.1-flash-lite' },
};

/** What every coefficient regulates, in the words of the Genesis screen. */
export const COEFFICIENT_INFO: Record<CoefficientKey, { nome: string; agente: string; modo: 'diretta' | 'indiretta'; testo: string }> = {
  sessioni: { nome: 'Sessioni del Concilio', agente: 'arbitro', modo: 'diretta', testo: 'ogni 12 luoghi nuovi; a 0,5 ogni 24' },
  dialoghi: { nome: 'Dialoghi tra persone', agente: 'narratore', modo: 'diretta', testo: 'al più uno ogni 40 secondi; a 0,5 ogni 80, a 0 solo saluti' },
  trame: { nome: 'Trame', agente: 'narratore', modo: 'diretta', testo: 'una nuova quando nessuna è aperta; a 0,5 un giorno sì e uno no' },
  revisioni: { nome: 'Revisioni dei modelli', agente: 'scultore', modo: 'diretta', testo: "sotto 0,75 un programma per le cose semplici, sotto 0,5 niente revisione, sotto 0,25 niente giudizio dell'Artista" },
  modelli: { nome: 'Modelli nuovi', agente: 'scultore', modo: 'diretta', testo: 'una pausa tra un modello e il successivo: nessuna a 1, un minuto a 0,5' },
  persone: { nome: 'Persone per luogo', agente: 'narratore', modo: 'indiretta', testo: 'meno persone: meno individui, risposte e dialoghi' },
  abitanti: { nome: 'Tipi di abitanti', agente: 'narratore', modo: 'indiretta', testo: 'un tipo nuovo ogni 7 luoghi; a 0,5 ogni 14' },
  pacchetti: { nome: 'Pacchetti di oggetti', agente: 'narratore', modo: 'indiretta', testo: 'un pacchetto ogni 10 luoghi; a 0,5 ogni 20' },
  cose: { nome: 'Cose nuove nei luoghi', agente: 'cartografo', modo: 'indiretta', testo: 'meno cose che la Fucina crea per un luogo e meno oggetti sconosciuti a terra' },
};

/**
 * The census of every call (docs/conversazioni.md, T67): what regulates it. `diretta` and `indiretta` name their
 * coefficient; `non regolabile` are what the wanderer asks for (or the Genesis, once): they are paid as they come.
 */
export const CENSUS: Array<{ compito: string; agente: string; modo: 'diretta' | 'indiretta' | 'non regolabile'; coefficiente?: CoefficientKey; nota?: string }> = [
  { compito: 'genesis.bible', agente: 'narratore', modo: 'non regolabile', nota: 'una volta, alla Genesi' },
  { compito: 'genesis.style', agente: 'artista', modo: 'non regolabile', nota: 'una volta, alla Genesi' },
  { compito: 'genesis.terrain', agente: 'cartografo', modo: 'non regolabile', nota: 'una volta, alla Genesi' },
  { compito: 'genesis.physics', agente: 'fisico', modo: 'non regolabile', nota: 'una volta, alla Genesi' },
  { compito: 'genesis.review', agente: 'arbitro', modo: 'non regolabile', nota: 'una volta, alla Genesi' },
  { compito: 'genesis.layouts', agente: 'cartografo', modo: 'non regolabile', nota: 'una volta, alla Genesi' },
  { compito: 'genesis.atlas', agente: 'cartografo', modo: 'non regolabile', nota: 'una volta, alla Genesi' },
  { compito: 'genesis.cast', agente: 'narratore', modo: 'non regolabile', nota: 'una volta, alla Genesi' },
  { compito: 'chunk.plan', agente: 'cartografo', modo: 'non regolabile', nota: 'uno per luogo nuovo: quanto si esplora' },
  { compito: 'cartographer.environment', agente: 'cartografo', modo: 'non regolabile', nota: 'su richiesta nella corona' },
  { compito: 'forge.concept', agente: 'narratore', modo: 'indiretta', coefficiente: 'cose', nota: 'anche abitanti e sessioni' },
  { compito: 'forge.physics', agente: 'fisico', modo: 'indiretta', coefficiente: 'cose' },
  { compito: 'forge.code', agente: 'ingegnere', modo: 'indiretta', coefficiente: 'cose' },
  { compito: 'forge.review', agente: 'arbitro', modo: 'indiretta', coefficiente: 'cose' },
  { compito: 'forge.fix', agente: 'ingegnere', modo: 'non regolabile', nota: 'ripara il codice che fallisce' },
  { compito: 'craft.judge', agente: 'narratore', modo: 'non regolabile', nota: 'combinazioni del viandante' },
  { compito: 'content.items', agente: 'narratore', modo: 'indiretta', coefficiente: 'pacchetti' },
  { compito: 'content.physics', agente: 'fisico', modo: 'indiretta', coefficiente: 'pacchetti' },
  { compito: 'content.review', agente: 'arbitro', modo: 'indiretta', coefficiente: 'pacchetti' },
  { compito: 'content.recipes', agente: 'narratore', modo: 'indiretta', coefficiente: 'pacchetti' },
  { compito: 'content.define', agente: 'narratore', modo: 'indiretta', coefficiente: 'cose', nota: 'anche ciò che il viandante fabbrica' },
  { compito: 'npc.individuate', agente: 'narratore', modo: 'indiretta', coefficiente: 'persone' },
  { compito: 'action.judge', agente: 'narratore', modo: 'non regolabile', nota: '«Altro…» del viandante' },
  { compito: 'craft.free', agente: 'narratore', modo: 'non regolabile', nota: 'fabbricazione libera' },
  { compito: 'spell.name', agente: 'narratore', modo: 'non regolabile', nota: 'un incantesimo nuovo, una volta' },
  { compito: 'council.session', agente: 'arbitro', modo: 'diretta', coefficiente: 'sessioni' },
  { compito: 'player.death', agente: 'narratore', modo: 'non regolabile', nota: 'a ogni morte' },
  { compito: 'npc.reply', agente: 'narratore', modo: 'non regolabile', nota: 'quando il viandante parla (meno persone, meno occasioni)' },
  { compito: 'npc.dialogue', agente: 'narratore', modo: 'diretta', coefficiente: 'dialoghi' },
  { compito: 'plot.weave', agente: 'narratore', modo: 'diretta', coefficiente: 'trame' },
  { compito: 'text.examine', agente: 'narratore', modo: 'non regolabile', nota: '«Esamina»' },
  { compito: 'text.read', agente: 'narratore', modo: 'non regolabile', nota: '«Leggi»' },
  { compito: 'referente.coordinate', agente: 'referente', modo: 'non regolabile', nota: 'nella corona' },
  { compito: 'agent.chat', agente: 'referente', modo: 'non regolabile', nota: 'nella corona' },
  { compito: 'model.sculpt', agente: 'scultore', modo: 'diretta', coefficiente: 'modelli', nota: 'e revisioni' },
  { compito: 'model.judge', agente: 'artista', modo: 'diretta', coefficiente: 'revisioni' },
  { compito: 'model.action', agente: 'scultore', modo: 'non regolabile', nota: '«Altro…» che cambia la forma' },
  { compito: 'mechanic.design', agente: 'ingegnere', modo: 'non regolabile', nota: 'su richiesta (sessioni e Referente)' },
];

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
  /** New things the Cartographer asks for, unknown items on the ground, per place. */
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
  const sc: SculptorModels = { ...DEFAULT_SCULPTORS, ...(ai.scultori ?? {}) };
  const text = (n: number) => n * (costOf(ai.textModel, WEIGHT.testo, date) ?? 0);
  const H = HOUR;
  const rows: HourLine[] = [];
  const add = (voce: string, modo: HourLine['modo'], chiamate: number, dollari: number) => rows.push({ voce, modo, chiamate: Math.round(chiamate * 10) / 10, dollari });
  const per = (base: number, k: number) => (Number.isFinite(stretch(base, k)) ? H.luoghi / stretch(base, k) : 0);

  add('Luoghi nuovi (Cartografo)', 'non regolabile', H.luoghi, text(H.luoghi));
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
  add(COEFFICIENT_INFO.dialoghi.nome, 'diretta', talks, text(talks));
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
  const asked = H.parole + H.azioni + H.sguardi;
  add('Ciò che chiede il viandante (parole, «Altro…», «Esamina»)', 'non regolabile', asked, text(asked));
  return { righe: rows, chiamate: Math.round(rows.reduce((s, r) => s + r.chiamate, 0)), dollari: rows.reduce((s, r) => s + r.dollari, 0) };
}

/** The models the Genesis screen offers: every priced one. */
export const pricedModels = (): string[] => ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-pro-preview'].filter((m) => priceOf(m));
