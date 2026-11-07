// The language of a world (T310, ADR-0153, ADR-0164): the Council's prompts are English, the text of the world is in the language of its
// universe (`universe.json → language`, Italian when it says none; the choice at the Genesis is T239's). The Language block goes with every
// request, after the principles; the detector says what language a text is in, with the function words of each language.

import type { FileMap } from './types';

export type WorldLanguage = 'it' | 'en' | 'fr' | 'es';

/** The languages a world can have, with their name as the prompts say it. */
export const WORLD_LANGUAGES: Readonly<Record<WorldLanguage, string>> = { it: 'Italian', en: 'English', fr: 'French', es: 'Spanish' };

/** A world that says no language speaks Italian: every universe before T239. */
export const DEFAULT_LANGUAGE: WorldLanguage = 'it';

export const isWorldLanguage = (v: unknown): v is WorldLanguage => typeof v === 'string' && Object.hasOwn(WORLD_LANGUAGES, v);

/** The language of a universe: `universe.json → language`, or Italian if it is missing, unreadable or not one of the four. */
export function languageOf(files: FileMap): WorldLanguage {
  try {
    const v = (JSON.parse(files['universe.json'] ?? '{}') as { language?: unknown }).language;
    return isWorldLanguage(v) ? v : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * The words the principles forbid, in each language: they are not used even for something else, so a world with machines says the
 * world's word for them (the Italian «calcolatore», not «computer»). A language without its line says only the English one.
 */
const FORBIDDEN_WORDS: Partial<Record<WorldLanguage, string>> = {
  it: 'never «computer», «programma», «giocatore», «simulazione»: say «calcolatore», «trasmissione», «calciatore»',
  en: 'never "computer", "program", "player", "simulation": say "calculating machine", "broadcast", "footballer"',
};

/**
 * The Language block (T310): in what language the text of the world is written, and what stays as the schema says. It follows the
 * principles in every request, so a model that reads English instructions does not write the world in English.
 */
export function languageBlock(lang: WorldLanguage = DEFAULT_LANGUAGE): string {
  const name = WORLD_LANGUAGES[lang];
  return [
    `## Language of the world: ${name} (${lang})`,
    `- Write every text of the world in ${name}: names, descriptions, dialogue, stories, the bible, memories, plots, signs, labels of actions, what the wanderer reads. These instructions are in English; the world is not.`,
    `- The ids stay as the schema gives them, in English: enum values, codes, ids of modules, models, items, actions and terrains, field names. Do not translate them, do not write the world's text in them.`,
    `- Examples in these instructions are only forms: write their like in ${name}, never copy their words.`,
    `- Code is English (names and comments); a string of the code that the wanderer reads is in ${name}.`,
    `- In ${name} the words the principles forbid are not used even for something else: ${FORBIDDEN_WORDS[lang] ?? FORBIDDEN_WORDS.en}.`,
  ].join('\n');
}

/** Function words of each language, the ones a text cannot avoid: the same method as the census of the languages (T239). */
const FUNCTION_WORDS: Readonly<Record<WorldLanguage, readonly string[]>> = {
  it: ['il', 'lo', 'la', 'gli', 'le', 'di', 'del', 'della', 'dei', 'delle', 'che', 'è', 'non', 'per', 'con', 'una', 'uno', 'nel', 'nella', 'sono', 'anche', 'ma', 'come', 'più', 'al', 'alla', 'ai', 'questo', 'questa', 'si', 'ha', 'chi', 'dove', 'quando'],
  en: ['the', 'of', 'and', 'to', 'is', 'that', 'with', 'for', 'his', 'her', 'their', 'this', 'it', 'are', 'was', 'from', 'by', 'at', 'on', 'who', 'an', 'not', 'be', 'has', 'have', 'they', 'what', 'when', 'where', 'which', 'into', 'would'],
  fr: ['le', 'la', 'les', 'des', 'du', 'et', 'est', 'une', 'un', 'pour', 'dans', 'qui', 'que', 'pas', 'sur', 'au', 'aux', 'avec', 'ce', 'cette', 'sont', 'mais', 'où', 'leur', 'ils', 'elle', 'nous'],
  es: ['el', 'los', 'las', 'del', 'y', 'es', 'una', 'un', 'para', 'en', 'que', 'por', 'con', 'no', 'se', 'su', 'sus', 'al', 'como', 'pero', 'más', 'este', 'esta', 'son', 'donde', 'cuando', 'muy'],
};

/**
 * The language a text is written in, or undefined when it is too short to say (fewer than `min` function words) or two languages tie.
 * Deterministic: the language whose function words the text uses most.
 */
export function detectLanguage(text: string, min = 4): WorldLanguage | undefined {
  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  let best: WorldLanguage | undefined;
  let bestCount = 0;
  let tie = false;
  for (const lang of Object.keys(FUNCTION_WORDS) as WorldLanguage[]) {
    const set = new Set(FUNCTION_WORDS[lang]);
    const n = words.filter((w) => set.has(w)).length;
    if (n > bestCount) {
      best = lang;
      bestCount = n;
      tie = false;
    } else if (n === bestCount && n > 0) tie = true;
  }
  return bestCount >= min && !tie ? best : undefined;
}
