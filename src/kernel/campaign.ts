// The master's directives (T374, ADR-0188 §4, ADR-0191): `world/campaign.md`, in the language of the world, with a section for each team
// of the Council. Every request carries the section «for everyone» and the one of its agent, in the stable part the cache serves; the Arbiter
// and the Referente read all of it, the Actor only «for everyone», the closed decisions (Jev) nothing. The master writes it in the editor, or
// the Referente appends a directive for them (`directive`), one line with the day of the world. They say *how* the world is made, never
// facts: those stay in the bible, the people, the plots, the atlas. The fourth wall holds with the local filter only (`metaBreak`, D54.5):
// a line that breaks it stays out of the requests, a directive that breaks it does not go in. Pure: the kernel, the validator, the editor and
// the lab read it without the engine.

import type { AgentId } from './agents/council';
import { cleanText } from './cleantext';
import { metaBreak } from './fourthwall';
import { DEFAULT_LANGUAGE, type WorldLanguage } from './language';

export const CAMPAIGN_FILE = 'world/campaign.md';

/** The sections, by id: whoever reads them is `CAMPAIGN_READERS`. */
export const CAMPAIGN_SECTIONS = ['all', 'narrator', 'cartographer', 'sculptor-artist', 'engineer-physicist', 'musician'] as const;
export type CampaignSection = (typeof CAMPAIGN_SECTIONS)[number];

/** Characters of a section (about 1.200 tokens), of the whole file, of one directive the Referente appends. */
export const SECTION_CHARS = 4000;
export const CAMPAIGN_CHARS = 12000;
export const DIRECTIVE_CHARS = 300;

/** The title of each section in the file, in the language of the world (the prompts say it in English). */
const TITLES: Readonly<Record<CampaignSection, Readonly<Record<WorldLanguage, string>>>> = {
  all: { it: 'Per tutti', en: 'For everyone', fr: 'Pour tous', es: 'Para todos' },
  narrator: { it: 'Narratore', en: 'Narrator', fr: 'Narrateur', es: 'Narrador' },
  cartographer: { it: 'Cartografo', en: 'Cartographer', fr: 'Cartographe', es: 'Cartógrafo' },
  'sculptor-artist': { it: 'Scultore e Artista', en: 'Sculptor and Artist', fr: 'Sculpteur et Artiste', es: 'Escultor y Artista' },
  'engineer-physicist': { it: 'Ingegnere e Fisico', en: 'Engineer and Physicist', fr: 'Ingénieur et Physicien', es: 'Ingeniero y Físico' },
  musician: { it: 'Musicista', en: 'Musician', fr: 'Musicien', es: 'Músico' },
};

const FILE_TITLE: Readonly<Record<WorldLanguage, string>> = { it: 'Campagna', en: 'Campaign', fr: 'Campagne', es: 'Campaña' };

/** What the template says to whoever opens it: an HTML comment, which no request carries. */
const FILE_NOTE: Partial<Record<WorldLanguage, string>> = {
  it: 'Le direttive del master: come si fa il mondo da qui in avanti, non i fatti (quelli stanno nella bibbia, nelle persone, nelle trame, nell’atlante). Ogni sezione la legge la sua squadra, «Per tutti» tutto il Concilio; l’Arbitro e il Referente leggono tutto. Una riga per direttiva; una riga che nomina il gioco, i giocatori o la simulazione resta fuori dalle richieste.',
  en: 'The directives of the master: how the world is made from now on, not facts (those go in the bible, the people, the plots, the atlas). Each section is read by its team, «For everyone» by the whole Council; the Arbiter and the Referente read everything. One line per directive; a line that names the game, the players or the simulation stays out of the requests.',
};

/** Who reads which sections: each agent its own and «for everyone»; the Arbiter and the Referente all; the Actor only «for everyone». */
export function campaignSectionsFor(agent: AgentId): readonly CampaignSection[] {
  switch (agent) {
    case 'arbiter':
    case 'liaison':
      return CAMPAIGN_SECTIONS;
    case 'actor':
      return ['all'];
    case 'narrator':
      return ['all', 'narrator'];
    case 'cartographer':
      return ['all', 'cartographer'];
    case 'sculptor':
    case 'artist':
      return ['all', 'sculptor-artist'];
    case 'engineer':
    case 'physicist':
      return ['all', 'engineer-physicist'];
    case 'musician':
      return ['all', 'musician'];
  }
}

/** The title of a section in a language (for the file and for the master). */
export const sectionTitle = (s: CampaignSection, lang: WorldLanguage = DEFAULT_LANGUAGE): string => TITLES[s][lang] ?? TITLES[s].en;

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** A section from its id or its title in any language (what a heading says, what the Referente answers), or undefined. */
export function sectionOf(raw: unknown): CampaignSection | undefined {
  if (typeof raw !== 'string') return undefined;
  const f = fold(raw);
  if (!f) return undefined;
  for (const s of CAMPAIGN_SECTIONS) if (fold(s) === f || Object.values(TITLES[s]).some((t) => fold(t) === f)) return s;
  return undefined;
}

/** The empty file, with its sections in the language of the world. */
export function campaignTemplate(lang: WorldLanguage = DEFAULT_LANGUAGE): string {
  const note = FILE_NOTE[lang] ?? FILE_NOTE.en!;
  return [`# ${FILE_TITLE[lang] ?? FILE_TITLE.en}`, '', `<!-- ${note} -->`, '', ...CAMPAIGN_SECTIONS.flatMap((s) => [`## ${sectionTitle(s, lang)}`, ''])].join('\n');
}

/** A line of the file left out of the requests, and why. */
export interface LeftOut {
  section: CampaignSection;
  line: string;
  reason: string;
}

export interface CampaignRead {
  /** The lines each section gives the requests, within the caps and without what breaks the fourth wall. */
  sections: Record<CampaignSection, string[]>;
  /** The lines the fourth wall keeps out (`metaBreak`), for the master. */
  left: LeftOut[];
  /** What is wrong with the file's form: a section nobody reads, text outside the sections, the caps. The validator says them. */
  errors: string[];
}

/** Invisible and control characters (but the line's own breaks), which no request carries. */
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}]/gu;

/**
 * The file read: its sections, line by line, without HTML comments and invisible characters; what breaks the fourth wall left out (with the
 * lexicon's words and the language of the world, as for every text of the Council); every section within `SECTION_CHARS` and the file within
 * `CAMPAIGN_CHARS`, keeping its first lines (the master's own order). Never throws.
 */
export function readCampaign(text: string | undefined, opts: { words?: string[]; lang?: WorldLanguage } = {}): CampaignRead {
  const sections = Object.fromEntries(CAMPAIGN_SECTIONS.map((s) => [s, [] as string[]])) as Record<CampaignSection, string[]>;
  const out: CampaignRead = { sections, left: [], errors: [] };
  if (typeof text !== 'string' || !text.trim()) return out;
  const lang = opts.lang ?? DEFAULT_LANGUAGE;
  const lines = text.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?(?:-->|$)/g, '').split('\n');
  let current: CampaignSection | undefined;
  let skipping = false;
  const seen = new Set<CampaignSection>();
  const written = Object.fromEntries(CAMPAIGN_SECTIONS.map((s) => [s, [] as string[]])) as Record<CampaignSection, string[]>;
  lines.forEach((raw, i) => {
    const line = raw.replace(INVISIBLE, '').trimEnd();
    const head = /^\s*##(?!#)\s*(.*)$/.exec(line);
    if (head) {
      current = sectionOf(head[1]);
      skipping = !current;
      if (!current) out.errors.push(`${CAMPAIGN_FILE}: riga ${i + 1}, sezione sconosciuta «${head[1].trim().slice(0, 40)}»: le sezioni sono ${CAMPAIGN_SECTIONS.map((s) => `«${sectionTitle(s, lang)}»`).join(', ')}`);
      else if (seen.has(current)) out.errors.push(`${CAMPAIGN_FILE}: riga ${i + 1}, la sezione «${sectionTitle(current, lang)}» c'è due volte`);
      if (current) seen.add(current);
      return;
    }
    if (!line.trim()) return;
    // The file's title (`# Campagna`) is for whoever opens it.
    if (!current && /^\s*#(?!#)/.test(line)) return;
    if (!current) {
      if (!skipping) out.errors.push(`${CAMPAIGN_FILE}: riga ${i + 1}, testo fuori da una sezione: non arriva a nessuno`);
      return;
    }
    written[current].push(line.trim());
  });
  let total = 0;
  for (const s of CAMPAIGN_SECTIONS) {
    let size = 0;
    for (const line of written[s]) {
      const hit = metaBreak(line, opts.words ?? [], lang);
      if (hit) {
        out.left.push({ section: s, line, reason: hit });
        continue;
      }
      const cost = line.length + 1;
      if (size + cost > SECTION_CHARS + 1 || total + cost > CAMPAIGN_CHARS + 1) continue;
      size += cost;
      total += cost;
      sections[s].push(line);
    }
    const all = written[s].reduce((n, l) => n + l.length + 1, 0);
    if (all > SECTION_CHARS + 1) out.errors.push(`${CAMPAIGN_FILE}: la sezione «${sectionTitle(s, lang)}» ha ${all - 1} caratteri, al più ${SECTION_CHARS}`);
  }
  const whole = CAMPAIGN_SECTIONS.reduce((n, s) => n + written[s].reduce((m, l) => m + l.length + 1, 0), 0);
  if (whole > CAMPAIGN_CHARS + 1) out.errors.push(`${CAMPAIGN_FILE}: ${whole - 1} caratteri di direttive, al più ${CAMPAIGN_CHARS}`);
  return out;
}

/** The English name of a section in a request (the prompts are English, ADR-0165; the lines are in the language of the world). */
const PROMPT_TITLES: Readonly<Record<CampaignSection, string>> = {
  all: 'For everyone',
  narrator: 'Narrator',
  cartographer: 'Cartographer',
  'sculptor-artist': 'Sculptor and Artist',
  'engineer-physicist': 'Engineer and Physicist',
  musician: 'Musician',
};

/**
 * What a request of an agent carries of the directives: its sections that have lines, under one heading, or '' when there are none. It goes
 * after the summary of the game, in the stable part of the request (the cache serves it: the directives change rarely).
 */
export function campaignPrompt(read: CampaignRead, agent: AgentId): string {
  const parts = campaignSectionsFor(agent)
    .filter((s) => read.sections[s].length)
    .map((s) => `### ${PROMPT_TITLES[s]}\n${read.sections[s].join('\n')}`);
  if (!parts.length) return '';
  return [
    "## The master's directives for this world (how it is made from now on: follow them in your work, as the rules; they are never told, quoted or named inside the world)",
    ...parts,
  ].join('\n');
}

/** The day of the world as a directive is dated with it (`day` 0 is the first). */
export function directiveDay(day: number, lang: WorldLanguage = DEFAULT_LANGUAGE): string {
  const n = Number.isFinite(day) && day >= 0 ? Math.floor(day) + 1 : 1;
  return { it: `giorno ${n}`, en: `day ${n}`, fr: `jour ${n}`, es: `día ${n}` }[lang] ?? `day ${n}`;
}

/**
 * A directive as it can go in the file: a text of a player (`cleanText`: one line, no markup, no invisible character, at most
 * `DIRECTIVE_CHARS`), without the marks of a list it may start with, and not a break of the fourth wall (`metaBreak`, the local filter only:
 * the master's words never go to Jev, D54.5). `wall` when it is the fourth wall that refuses it: the Referente may word it again.
 */
export function directiveText(raw: unknown, opts: { words?: string[]; lang?: WorldLanguage } = {}): { text: string } | { error: string; wall?: true } {
  const r = cleanText(typeof raw === 'string' ? raw.replace(/^[\s\-*#>•]+/u, '') : raw, DIRECTIVE_CHARS, 'la direttiva');
  if ('error' in r) return r;
  const hit = metaBreak(r.text, opts.words ?? [], opts.lang ?? DEFAULT_LANGUAGE);
  return hit ? { error: `la direttiva: nel mondo non si dice «${hit}»`, wall: true } : r;
}

/**
 * The file with one more directive at the end of its section (`- (giorno 3) …`): the section is made if it is missing, the file from the
 * template if it is not there. Refused, with the reason, when the section or the file would go over their caps: the master trims them in the
 * editor.
 */
export function withDirective(text: string | undefined, section: CampaignSection, line: string, lang: WorldLanguage = DEFAULT_LANGUAGE): { text: string } | { error: string } {
  const base = typeof text === 'string' && text.trim() ? text.replace(/\r\n?/g, '\n') : campaignTemplate(lang);
  const lines = base.split('\n');
  const entry = `- ${line}`;
  const start = lines.findIndex((l) => {
    const h = /^\s*##(?!#)\s*(.*)$/.exec(l);
    return !!h && sectionOf(h[1]) === section;
  });
  if (start < 0) {
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.push('', `## ${sectionTitle(section, lang)}`, entry, '');
  } else {
    let end = lines.findIndex((l, i) => i > start && /^\s*##?(?!#)\s/.test(l));
    if (end < 0) end = lines.length;
    // After the section's last line that says something, before the blank lines that close it.
    let at = end;
    while (at > start + 1 && !lines[at - 1].trim()) at--;
    lines.splice(at, 0, entry);
    if (at + 1 < lines.length && lines[at + 1].trim() && /^\s*#/.test(lines[at + 1])) lines.splice(at + 1, 0, '');
  }
  const next = lines.join('\n').replace(/\n*$/, '\n');
  const after = readCampaign(next, { lang });
  const used = after.sections[section].reduce((n, l) => n + l.length + 1, 0);
  const full = after.errors.find((e) => e.includes('caratteri'));
  if (full) return { error: `la sezione «${sectionTitle(section, lang)}» o il file delle direttive sono pieni (${used} caratteri nella sezione, al più ${SECTION_CHARS}; ${CAMPAIGN_CHARS} nel file): il master li sfoltisca nell'editor` };
  return { text: next };
}
