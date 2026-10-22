// Plots: horizontal stories the Narrator weaves among people (in the manner of Westworld) — a
// mystery, the people involved, beats that happen on given days and moments of the day in given
// places, clues, and sometimes a request for the wanderer (a quest). They live in the universe
// (world/plots.json); the kernel plays the beats (people go there, say their line, remember it).

import type { FileMap } from './types';
import { metaBreak } from './fourthwall';
import { BINDING_WORDS, relationKind, type DayPhase, type People } from './society';

export interface Beat {
  /** Day relative to the plot's start. */
  giorno: number;
  momento: DayPhase;
  chi: string;
  dove: string;
  cosa: string;
  battuta?: string;
  indizio?: string;
  fatto?: boolean;
}

export interface Quest {
  da: string;
  testo: string;
  obiettivo: { tipo: 'porta' | 'vai' | 'parla'; oggetto?: string; a?: string; luogo?: string };
  ricompensa?: string;
  stato: 'offerta' | 'accettata' | 'compiuta';
}

export interface Plot {
  id: string;
  titolo: string;
  mistero: string;
  coinvolti: string[];
  tappe: Beat[];
  missione?: Quest;
  /** Absolute day it started. */
  inizio: number;
  stato: 'attiva' | 'chiusa';
}

export const PLOTS_FILE = 'world/plots.json';

export function readPlots(files: FileMap): Plot[] {
  try {
    const p = JSON.parse(files[PLOTS_FILE] ?? '{}');
    return Array.isArray(p.trame) ? p.trame : [];
  } catch {
    return [];
  }
}

export function writePlots(plots: Plot[]): string {
  return JSON.stringify({ trame: plots.slice(-30) }, null, 2) + '\n';
}

/** What a person knows of the plots they are in: for their chat (hints, never confessions). */
export function secretsOf(plots: Plot[], name: string, day: number): string {
  const out: string[] = [];
  for (const p of plots) {
    if (p.stato !== 'attiva' || !p.coinvolti.includes(name)) continue;
    out.push(`- Trama «${p.titolo}»: ${p.mistero}`);
    for (const b of p.tappe) if (b.chi === name) out.push(`  · ${b.fatto ? 'hai già' : p.inizio + b.giorno > day ? 'dovrai' : 'devi'} ${b.cosa} (${b.dove}, ${b.momento})${b.indizio ? ` — indizio: ${b.indizio}` : ''}`);
    if (p.missione?.da === name && p.missione.stato === 'offerta') out.push(`  · Hai una richiesta per il viandante: ${p.missione.testo} (se te la chiede o se ti fidi, affidagliela con l'azione "missione")`);
  }
  return out.join('\n');
}

/** Quests the wanderer accepted and has not finished yet. */
export function activeQuests(plots: Plot[]): Array<{ plot: Plot; quest: Quest }> {
  return plots.filter((p) => p.missione?.stato === 'accettata').map((p) => ({ plot: p, quest: p.missione! }));
}

/** All the words of a plot, for the fourth-wall filter. */
export function plotText(p: Pick<Plot, 'titolo' | 'mistero' | 'tappe' | 'missione'>): string {
  return [p.titolo, p.mistero, ...p.tappe.flatMap((b) => [b.cosa, b.battuta ?? '', b.indizio ?? '']), p.missione?.testo ?? ''].join('\n');
}

/** A plot from the Narrator's answer: the shape is the kernel's (days, moments, lengths); the people are checked by `reviewPlot`. */
export function plotFromRaw(raw: any, inizio: number, id: string): Plot {
  const tappe: Beat[] = (Array.isArray(raw?.tappe) ? raw.tappe : []).filter((b: any) => b?.chi).slice(0, 8).map((b: any) => ({
    giorno: Math.max(0, Math.min(4, Math.round(Number(b.giorno) || 0))),
    momento: ['mattina', 'giorno', 'sera', 'notte'].includes(b.momento) ? b.momento : 'giorno',
    chi: String(b.chi), dove: String(b.dove ?? 'piazza').slice(0, 40), cosa: String(b.cosa ?? '').slice(0, 120),
    ...(b.battuta ? { battuta: String(b.battuta).slice(0, 140) } : {}), ...(b.indizio ? { indizio: String(b.indizio).slice(0, 120) } : {}),
  }));
  const m = raw?.missione;
  return {
    id,
    titolo: String(raw?.titolo ?? 'Una storia').slice(0, 60),
    mistero: String(raw?.mistero ?? '').slice(0, 300),
    coinvolti: [...new Set(tappe.map((b) => b.chi))],
    tappe,
    inizio,
    stato: 'attiva',
    ...(m?.da && ['porta', 'vai', 'parla'].includes(m.tipo)
      ? { missione: { da: String(m.da), testo: String(m.testo ?? '').slice(0, 200), obiettivo: { tipo: m.tipo, ...(m.oggetto ? { oggetto: String(m.oggetto) } : {}), ...(m.a ? { a: String(m.a) } : {}), ...(m.luogo ? { luogo: String(m.luogo) } : {}) }, ...(m.ricompensa ? { ricompensa: String(m.ricompensa) } : {}), stato: 'offerta' as const } }
      : {}),
  };
}

// --- Plots coherent with the people and with the rune canon --------------------------------------

// What the runes never do (world/canone.md, «Come si comportano», «La magia»): said of a rune, it is a
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
export function reviewPlot(plot: Plot, people: People): PlotReview {
  const problems: string[] = [];
  let fatal = false;
  const byName = new Map(people.persone.map((p) => [p.nome, p]));
  const isAnimal = (n: string) => byName.get(n)?.specie === 'animale';
  const tappe: Beat[] = [];
  for (const b of plot.tappe) {
    if (!byName.has(b.chi)) {
      problems.push(`${b.chi} non esiste (tappa «${b.cosa}»): usa solo le persone dell'elenco`);
      continue;
    }
    if (isAnimal(b.chi)) {
      const deed = HUMAN_DEED.exec(b.cosa);
      if (deed) {
        problems.push(`${b.chi} è un animale e non «${deed[0]}» (tappa «${b.cosa}»)`);
        continue;
      }
      if (b.battuta) {
        problems.push(`${b.chi} è un animale e non parla («${b.battuta}»)`);
        const { battuta: _, ...mute } = b;
        tappe.push(mute);
        continue;
      }
    }
    tappe.push({ ...b });
  }
  let missione = plot.missione ? { ...plot.missione, obiettivo: { ...plot.missione.obiettivo } } : undefined;
  if (missione) {
    const to = missione.obiettivo.a;
    const why = !byName.has(missione.da)
      ? `la missione è di ${missione.da}, che non esiste`
      : isAnimal(missione.da)
        ? `${missione.da} è un animale e non chiede nulla al viandante`
        : (missione.obiettivo.tipo === 'parla' && !to) || (to && !byName.has(to))
          ? `la missione manda da ${to ?? 'nessuno'}, che non esiste`
          : missione.obiettivo.tipo === 'parla' && to && isAnimal(to)
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
    const real = byName.get(who)?.famiglia.find((r) => r.nome === of)?.legame;
    if (real && relationKind(real) === relationKind(word)) return;
    fatal = true;
    problems.push(`«${quote.trim()}»: per il registro ${who} ${real ? `è ${real} di ${of}` : `non è parente di ${of}`}`);
  };
  if (names) {
    const end = '(?![\\p{L}])';
    const mine = new RegExp(`(?<![\\p{L}])(?:mio|mia)\\s+(?<rel>${BINDING_WORDS})${end}\\s*,?\\s+(?<who>${names})${end}`, 'giu');
    const his = new RegExp(`(?<![\\p{L}])(?:suo|sua)\\s+(?<rel>${BINDING_WORDS})${end}\\s*,?\\s+(?<who>${names})${end}`, 'giu');
    const of = new RegExp(`(?<who>${names})${end}\\s*,?\\s*(?:è\\s+|era\\s+)?(?:il |la |lo |l')?(?:suo |sua )?(?<rel>${BINDING_WORDS})\\s+di\\s+(?<of>${names})${end}`, 'giu');
    const said: Array<[string, string]> = [];
    for (const b of tappe) {
      if (b.battuta) said.push([b.battuta, b.chi]);
      for (const m of b.cosa.matchAll(his)) claim(m.groups!.who, m.groups!.rel, b.chi, m[0]);
    }
    if (missione) said.push([missione.testo, missione.da]);
    for (const [text, speaker] of said) for (const m of text.matchAll(mine)) claim(m.groups!.who, m.groups!.rel, speaker, m[0]);
    for (const text of [plot.mistero, ...tappe.flatMap((b) => [b.cosa, b.battuta ?? '', b.indizio ?? '']), missione?.testo ?? ''])
      for (const m of text.matchAll(of)) claim(m.groups!.who, m.groups!.rel, m.groups!.of, m[0]);
  }
  const text = plotText({ ...plot, tappe, missione });
  const meta = metaBreak(text);
  if (meta) {
    fatal = true;
    problems.push(`rompe la quarta parete o duplica le rune («${meta}»): dentro il mondo nessuno sa di essere in un gioco, e le rune sono solo quelle del canone`);
  }
  const rune = canonBreak(text);
  if (rune) {
    fatal = true;
    problems.push(`le rune non fanno ciò che il canone non dice («${rune}»): restano dove sono, ferme e mute, finché qualcuno non le raccoglie`);
  }
  if (fatal || !tappe.length) return { problems };
  const { missione: _, ...rest } = plot;
  return { problems, plot: { ...rest, coinvolti: [...new Set(tappe.map((b) => b.chi))], tappe, ...(missione ? { missione } : {}) } };
}
