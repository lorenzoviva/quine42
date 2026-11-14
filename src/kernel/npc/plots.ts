// Plots: horizontal stories the Narrator weaves among people (in the manner of Westworld) — a
// mystery, the people involved, beats that happen on given days and moments of the day in given
// places, clues, and sometimes a request for the wanderer (a quest). They live in the universe
// (world/plots.json); the kernel plays the beats (people go there, say their line, remember it).

import type { FileMap } from '../types';
import { metaBreak } from '../fourthwall';
import { SOLO } from '../wandererIds';
import { BINDING_WORDS, DAY_PHASES, relationKind, type DayPhase, type People } from './society';
import { internalFields, internalName, internalPlot, italianName } from '../internalNames';

export interface Beat {
  /** Day relative to the plot's start. */
  day: number;
  moment: DayPhase;
  who: string;
  where: string;
  what: string;
  line?: string;
  clue?: string;
  done?: boolean;
}

export interface Quest {
  from: string;
  text: string;
  goal: { type: QuestGoal; item?: string; to?: string; place?: string };
  reward?: string;
  state: 'offered' | 'accepted' | 'completed';
  /** Who accepted it (the wanderer's id, T34; `me` when missing). */
  wanderer?: string;
}

export interface Plot {
  id: string;
  title: string;
  mystery: string;
  involved: string[];
  beats: Beat[];
  quest?: Quest;
  /** Absolute day it started. */
  start: number;
  state: 'active' | 'closed';
}

/** The kinds of a quest's goal (T307b: internal; the Narrator still says them in Italian, `plotFromRaw` takes them in). */
export type QuestGoal = 'bring' | 'go' | 'talk';
export const QUEST_GOALS: readonly QuestGoal[] = ['bring', 'go', 'talk'];

export const PLOTS_FILE = 'world/plots.json';

export function readPlots(files: FileMap): Plot[] {
  try {
    const p = JSON.parse(files[PLOTS_FILE] ?? '{}');
    // Values of the contract 0.2 (T307b), then fields of 0.3 (`titolo`, `tappe`, T308a): the migration ports the file, this a stray one.
    const list = p.plots ?? p.trame;
    return Array.isArray(list) ? list.map((t: Plot) => internalFields('plot', internalPlot(t))) : [];
  } catch {
    return [];
  }
}

export function writePlots(plots: Plot[]): string {
  return JSON.stringify({ plots: plots.slice(-30) }, null, 2) + '\n';
}

/** What an individual knows of the plots they are in: for their chat (hints, never confessions). */
export function secretsOf(plots: Plot[], name: string, day: number): string {
  const out: string[] = [];
  for (const p of plots) {
    if (p.state !== 'active' || !p.involved.includes(name)) continue;
    out.push(`- Trama «${p.title}»: ${p.mystery}`);
    for (const b of p.beats) if (b.who === name) out.push(`  · ${b.done ? 'hai già' : p.start + b.day > day ? 'dovrai' : 'devi'} ${b.what} (${italianName('dove', b.where)}, ${italianName('momenti', b.moment)})${b.clue ? ` — indizio: ${b.clue}` : ''}`);
    if (p.quest?.from === name && p.quest.state === 'offered') out.push(`  · Hai una richiesta per il viandante: ${p.quest.text} (se te la chiede o se ti fidi, affidagliela con l'azione "missione")`);
  }
  return out.join('\n');
}

/** Quests a wanderer accepted and has not finished yet (all of them, without an id). */
export function activeQuests(plots: Plot[], wanderer?: string): Array<{ plot: Plot; quest: Quest }> {
  return plots
    .filter((p) => p.quest?.state === 'accepted' && (!wanderer || (p.quest.wanderer ?? SOLO) === wanderer))
    .map((p) => ({ plot: p, quest: p.quest! }));
}

/** All the words of a plot, for the fourth-wall filter. */
export function plotText(p: Pick<Plot, 'title' | 'mystery' | 'beats' | 'quest'>): string {
  return [p.title, p.mystery, ...p.beats.flatMap((b) => [b.what, b.line ?? '', b.clue ?? '']), p.quest?.text ?? ''].join('\n');
}

/**
 * A plot from the Narrator's answer: the shape is the kernel's (days, moments, lengths); the people are checked by `reviewPlot`. The
 * fields are those of its schema, English since T310b (an answer with the Italian ones of before reaches here ported, `internalAnswer`).
 */
export function plotFromRaw(raw: any, inizio: number, id: string): Plot {
  const beats: Beat[] = (Array.isArray(raw?.beats) ? raw.beats : []).filter((b: any) => b?.who).slice(0, 8).map((b: any) => ({
    day: Math.max(0, Math.min(4, Math.round(Number(b.day) || 0))),
    moment: (DAY_PHASES as string[]).includes(internalName('momenti', String(b.moment))) ? internalName('momenti', String(b.moment)) : 'day',
    who: String(b.who), where: internalName('dove', String(b.where ?? 'square')).slice(0, 40), what: String(b.what ?? '').slice(0, 120),
    ...(b.line ? { line: String(b.line).slice(0, 140) } : {}), ...(b.clue ? { clue: String(b.clue).slice(0, 120) } : {}),
  }));
  const m = raw?.quest;
  const goal = typeof m?.type === 'string' ? (internalName('trame', m.type) as QuestGoal) : undefined;
  return {
    id,
    title: String(raw?.title ?? 'Una storia').slice(0, 60),
    mystery: String(raw?.mystery ?? '').slice(0, 300),
    involved: [...new Set(beats.map((b) => b.who))],
    beats,
    start: inizio,
    state: 'active',
    ...(m?.from && goal && QUEST_GOALS.includes(goal)
      ? { quest: { from: String(m.from), text: String(m.text ?? '').slice(0, 200), goal: { type: goal, ...(m.item ? { item: String(m.item) } : {}), ...(m.to ? { to: String(m.to) } : {}), ...(m.place ? { place: String(m.place) } : {}) }, ...(m.reward ? { reward: String(m.reward) } : {}), state: 'offered' as const } }
      : {}),
  };
}

// --- Plots coherent with the people and with the rune canon --------------------------------------

// What the runes never do (world/canon.md, «Come si comportano», «La magia»): said of a rune, it is a
// rune with a life of its own. "Non si spostano" is the canon itself, so a denial is fine.
const RUNE_DEED = new RegExp(
  String.raw`\brun(?:a|e|ica|iche)(?![\p{L}])[^.;:!?]{0,40}?(?<![\p{L}])(si (?:spost|muov|spegn|accend|svegli|moltiplic|apr)\p{L}*|cammin\p{L}*|cresc\p{L}*|germogli\p{L}*|fiorisc\p{L}*|suon(?:a|ano|ava|avano)|cant(?:a|ano|ava|avano)|parl(?:a|ano|ava|avano)|sussurr\p{L}*|reagisc\p{L}*|puls(?:a|ano|ava|avano)|vibr\p{L}*|ronz\p{L}*|lampegg\p{L}*|tremol\p{L}*|respir\p{L}*|nasc(?:e|ono|ere|ita)|(?:ri)?(?:appar|compar)(?:e|ve|vero|ire|s[aeio])|spunt(?:a|ano|ata|ate)|cambi\p{L}* (?:segno|forma|colore)|legg\p{L}* (?:i |nei )?pensier\p{L}*|riport\p{L}* in vita|resuscit\p{L}*|portal[ei]|altri mondi)`,
  'giu',
);

/** Where a text gives the runes a behaviour the canon does not have (the words, for the feedback). */
export function canonBreak(text: string): string | undefined {
  for (const m of text.matchAll(RUNE_DEED)) {
    const at = m.index! + m[0].length - m[1].length;
    if (/(?:^|[^\p{L}])(?:non|mai|né)\s+$/iu.test(text.slice(Math.max(0, at - 8), at))) continue;
    return m[0];
  }
  return undefined;
}

/** What only a person does: an animal does not write, read, weave, trade, pray or talk. */
const HUMAN_DEED = /(?<![\p{L}])(?:scriv|legg|tess|cuc|cucin|compr|vend|firm|macin|forgi|cont|preg|parl|dic|raccont|sussurr|predic|insegn)(?:e|a|ono|ano)(?![\p{L}])/iu;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface PlotReview {
  /** What does not hold, one line each, for the Narrator (empty when the plot is coherent). */
  problems: string[];
  /** The plot repaired (beats of unknown people dropped, animals silent, an impossible quest removed), or undefined when it cannot be. */
  plot?: Plot;
}

/**
 * The validator of a plot: its people exist, an animal acts as an animal (no words, no requests),
 * the relations it speaks of are those of the registry (who calls someone «mio fratello» is their
 * brother), the runes do only what the canon says, nothing hints at the game. What can be repaired
 * is; a plot that contradicts the registry, the canon or the fourth wall cannot.
 */
export function reviewPlot(plot: Plot, people: People, words: string[] = []): PlotReview {
  const problems: string[] = [];
  let fatal = false;
  const byName = new Map(people.people.map((p) => [p.name, p]));
  const isAnimal = (n: string) => byName.get(n)?.species === 'animal';
  const tappe: Beat[] = [];
  for (const b of plot.beats) {
    if (!byName.has(b.who)) {
      problems.push(`${b.who} non esiste (tappa «${b.what}»): usa solo le persone dell'elenco`);
      continue;
    }
    if (isAnimal(b.who)) {
      const deed = HUMAN_DEED.exec(b.what);
      if (deed) {
        problems.push(`${b.who} è un animale e non «${deed[0]}» (tappa «${b.what}»)`);
        continue;
      }
      if (b.line) {
        problems.push(`${b.who} è un animale e non parla («${b.line}»)`);
        const { line: _, ...mute } = b;
        tappe.push(mute);
        continue;
      }
    }
    tappe.push({ ...b });
  }
  let missione = plot.quest ? { ...plot.quest, obiettivo: { ...plot.quest.goal } } : undefined;
  if (missione) {
    const to = missione.obiettivo.to;
    const why = !byName.has(missione.from)
      ? `la missione è di ${missione.from}, che non esiste`
      : isAnimal(missione.from)
        ? `${missione.from} è un animale e non chiede nulla al viandante`
        : (missione.obiettivo.type === 'talk' && !to) || (to && !byName.has(to))
          ? `la missione manda da ${to ?? 'nessuno'}, che non esiste`
          : missione.obiettivo.type === 'talk' && to && isAnimal(to)
            ? `la missione manda a parlare con ${to}, che è un animale`
            : '';
    if (why) {
      problems.push(why);
      missione = undefined;
    }
  }
  // Relations: «mio fratello X» said by someone, «X, sorella di Y», «suo padre X» done by someone.
  const names = [...byName.keys()].sort((a, b) => b.length - a.length).map(escapeRe).join('|');
  const claim = (who: string, word: string, of: string, quote: string) => {
    if (who === of) return;
    const real = byName.get(who)?.family.find((r) => r.name === of);
    if (real && relationKind(real) === relationKind(word)) return;
    fatal = true;
    problems.push(`«${quote.trim()}»: per il registro ${who} ${real ? `è ${real.bond} di ${of}` : `non è parente di ${of}`}`);
  };
  if (names) {
    const end = '(?![\\p{L}])';
    const mine = new RegExp(`(?<![\\p{L}])(?:mio|mia)\\s+(?<rel>${BINDING_WORDS})${end}\\s*,?\\s+(?<who>${names})${end}`, 'giu');
    const his = new RegExp(`(?<![\\p{L}])(?:suo|sua)\\s+(?<rel>${BINDING_WORDS})${end}\\s*,?\\s+(?<who>${names})${end}`, 'giu');
    const of = new RegExp(`(?<who>${names})${end}\\s*,?\\s*(?:è\\s+|era\\s+)?(?:il |la |lo |l')?(?:suo |sua )?(?<rel>${BINDING_WORDS})\\s+di\\s+(?<of>${names})${end}`, 'giu');
    const said: Array<[string, string]> = [];
    for (const b of tappe) {
      if (b.line) said.push([b.line, b.who]);
      for (const m of b.what.matchAll(his)) claim(m.groups!.who, m.groups!.rel, b.who, m[0]);
    }
    if (missione) said.push([missione.text, missione.from]);
    for (const [text, speaker] of said) for (const m of text.matchAll(mine)) claim(m.groups!.who, m.groups!.rel, speaker, m[0]);
    for (const text of [plot.mystery, ...tappe.flatMap((b) => [b.what, b.line ?? '', b.clue ?? '']), missione?.text ?? ''])
      for (const m of text.matchAll(of)) claim(m.groups!.who, m.groups!.rel, m.groups!.of, m[0]);
  }
  const text = plotText({ ...plot, beats: tappe, quest: missione });
  const meta = metaBreak(text, words);
  if (meta) {
    fatal = true;
    problems.push(`rompe la quarta parete o duplica le rune o spiega il lessico («${meta}»): dentro il mondo nessuno sa di essere in un gioco, le rune sono solo quelle del canone e nessuno traduce le parole della sua lingua`);
  }
  const rune = canonBreak(text);
  if (rune) {
    fatal = true;
    problems.push(`le rune non fanno ciò che il canone non dice («${rune}»): restano dove sono, ferme e mute, finché qualcuno non le raccoglie`);
  }
  if (fatal || !tappe.length) return { problems };
  const { quest: _, ...rest } = plot;
  return { problems, plot: { ...rest, involved: [...new Set(tappe.map((b) => b.who))], beats: tappe, ...(missione ? { quest: missione } : {}) } };
}
