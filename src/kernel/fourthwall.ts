// Two tables, as in Dungeons & Dragons (ADR-0025): the Council is the Dungeon Master, outside the
// world; inside, the wanderer and the people live a world that is real to them. The principles below
// go with every request to the Council; the filter catches content that breaks the fourth wall anyway,
// in the language of the world, in Italian and in English (T310, ADR-0165): the models read English
// instructions and may slip into English, and they may repeat the Italian of an old prompt.

import type { Bible } from './agents/council';
import { DEFAULT_LANGUAGE, type WorldLanguage } from './language';

/** Sent with every request to the Council (kernel text: it holds whatever the universe says). English, as every prompt (T310). */
export const COUNCIL_PRINCIPLES = `## Principles of the Council (the kernel guarantees them)
Two tables, as in Dungeons & Dragons. The Council is the Dungeon Master: it stands outside the world, creates it and
makes it evolve. Inside the world there are the wanderer and the people: for them the world is real.
- No meta-game in the content (people, things, places, dialogue, texts, plots, facts, legends): never code,
  simulations, programs, computers, games, players, agents, Council, "cracks in reality", measured edges of the
  world, worlds that repeat or restart.
- Not even hints dressed up as legends. The world does not know it is a game, so nobody tells that: whoever walks
  too far always comes back to the square or never gets lost; someone or something (a king under the lake, the
  moon, a god) watches every wanderer; a border (the wood, the valley, the kingdom) cannot be crossed or turns you
  back on your steps; the world ends, repeats, starts over or exists only for whoever looks at it.
- No doubles of the elements of the game. The runes are one thing only, the canon's: no other "glowing symbol",
  "glyph", "letter of light" or "writing that shines" in the ground, and no behaviour of the runes the canon does
  not tell. The same for what already exists (things, people, incantations).
- Concrete trades and roles (baker, guard, shepherd, healer, merchant, brigand, village mage), never keepers of
  reality, censors of identities, archivists of the world, measurers of anomalies.
- Simple, concrete stories made of people: loves, debts, trades, thefts, feasts, rivalries, journeys, beasts,
  rune magic as the canon tells it. Mystery is not a duty.
- The Council makes the game evolve, it does not censor it: what makes sense in the world (a saddled horse, a
  boat, a weapon, a ritual) is made possible with things, actions, effects, states and code, with consistent
  consequences.
- Every world has its own age: machines and trades are things of the world. The forbidden words are not used
  even for something else: the Language block says the world's words for them.`;

/**
 * Words that, inside the world, only the Dungeon Master's table should know: one table per language (T310), each with its own
 * exceptions (the Italian `programm[ai]` is any program; the English `program` is also a festival's, so only `programmer`).
 */
const META_PATTERNS: Partial<Record<WorldLanguage, readonly string[]>> = {
  it: [
    // code, simulation, the Council's table
    String.raw`simulazion\w*|simulat[oa]|codic[ei] (?:del mondo|sorgente)|programm[ai]\b|algoritm\w*|riavvi\w*|matrice del|giocator\w*|meta-?gioco|quarta parete|concilio degli agenti`,
    // reality that cracks, abstract roles
    String.raw`crep[ae] (?:della|nella) realt\w*|tessuto della realt\w*|ancorare la realt\w*|realt[aà] (?:si|è) (?:instabil\w*|finta|falsa)|censor[ei] delle identit\w*|custod[ei] (?:della realt\w*|dei registri del mondo)|archivista supremo|misurator[ei] di (?:ombre|anomalie)|anomali[ae] del mondo`,
    // the measured edge, the world that repeats
    String.raw`42 passi|quarantadue passi|44 passi|quarantaquattro passi|bordo del (?:mondo|regno)[^.]{0,30}passi|(?:il )?mondo (?:si ripete|ricomincia|si riavvia)`,
    // the carpet that brings you back to the square
    String.raw`(?:torna\w*|ritrov\w*|riport\w*|ricondu\w*) sempre[^.]{0,20}\bin piazza|si ritrova(?:no)? in piazza|chi cammina troppo|non (?:far |lascia )?perder(?:e|si) nessuno`,
    // someone watching every wanderer
    String.raw`(?:osserv|sorvegli|spi|guard)\w* (?:ogni|ciascun|tutti i) viandant\w*`,
    // borders nobody crosses
    String.raw`nessun viandante[^.]{0,40}(?:superar|oltrepassar|attraversar|uscir)\w*|confin\w* invalicabil\w*|senza tornare sui (?:suoi|propri) passi`,
    // other glowing signs in the ground, doubles of the runes
    String.raw`(?:simbol|segn|glif|letter|scritt)\w* luminos\w*|lettere (?:di luce|che affiorano)|glif\w* (?:di luce|che brilla\w*)`,
  ],
  en: [
    // code, simulation, the Council's table (not `server`, `bug`, `loop`, `code`, `kernel`, `render` alone: a waiter, an insect, a rope, a law, corn, fat)
    String.raw`simulat(?:ion|ions|ed)\b|source code|code of (?:the world|reality)|programm(?:er|ers|ing)\b|computer programs?|algorithm\w*|computers?\b|glitch\w*|pixels?\b|rendering|renderer|game engine|debug\w*|software|bugs? in (?:the )?(?:world|reality|code)|time loop|reboot\w*|respawn\w*|players?\b|gamers?\b|meta-?game\w*|video ?games?|fourth wall|council of (?:the )?agents`,
    // reality that cracks, abstract roles
    String.raw`cracks? (?:in|of) (?:the )?reality|fabric of reality|anchor(?:ing|s)? (?:the )?reality|reality (?:is|feels|grows|becomes) (?:unstable|fake|false|thin)|censors? of (?:the )?identit\w*|(?:keepers?|guardians?|custodians?) of (?:the )?(?:reality|world'?s? records)|supreme archivist|measurers? of (?:shadows|anomalies)|anomal(?:y|ies) (?:of|in) the world`,
    // the measured edge, the world that repeats
    String.raw`(?:42|forty-two|44|forty-four) (?:steps|paces)|edge of the (?:world|kingdom)[^.]{0,30}(?:steps|paces)|(?:the )?world (?:repeats|restarts|reboots|resets|starts over|begins again)`,
    // the carpet that brings you back to the square
    String.raw`always[^.]{0,30}\bback (?:in|to|on|at|into) the (?:\w+ )?square|finds? (?:himself|herself|themselves|themself|oneself|yourself) (?:back )?in the (?:\w+ )?square|who(?:ever)? walks too far|(?:no ?one|nobody) ever gets lost|never lets? (?:anyone|anybody) (?:get )?lost`,
    // someone watching every wanderer
    String.raw`(?:watch|observ|spie|spy|guard|survey)\w* (?:over )?(?:every|each|all(?: the)?) (?:wanderers?|travell?ers?)`,
    // borders nobody crosses
    String.raw`no (?:wanderer|travell?er)[^.]{0,40}(?:cross|pass|get (?:past|beyond|out)|leave|escape)\w*|(?:uncrossable|impassable) (?:border|boundar|frontier|edge)\w*|without (?:turning back|retracing (?:his|her|their|its|one's|your) (?:own )?steps)`,
    // other glowing signs in the ground, doubles of the runes
    String.raw`(?:glowing|luminous|shining|radiant) (?:symbol|sign|glyph|letter|writing|inscription)s?\b|letters (?:of light|that (?:surface|rise|emerge))|glyphs? (?:of light|that (?:glow|shine))`,
  ],
};

/**
 * The words a language borrows from the Council's table (the Italian `server`, `loop`, `bug`): read only when it is the language of the
 * world, since in English they are a waiter, a rope, an insect.
 */
const META_LOANWORDS: Partial<Record<WorldLanguage, string>> = {
  it: String.raw`computer|glitch|pixel|render\w*|server|kernel|debug|bug\b|loop\b`,
};

/** The languages the filter reads for a world: its own, Italian and English (D34.5), each once. */
export function metaLanguages(world: WorldLanguage = DEFAULT_LANGUAGE): WorldLanguage[] {
  return [...new Set<WorldLanguage>([world, 'it', 'en'])];
}

const metaRes = new Map<string, RegExp | null>();
function metaRe(lang: WorldLanguage, world: WorldLanguage): RegExp | null {
  const key = `${lang}:${lang === world}`;
  if (!metaRes.has(key)) {
    const own = lang === world ? META_LOANWORDS[lang] : undefined;
    const ps = [...(META_PATTERNS[lang] ?? []), ...(own ? [own] : [])];
    metaRes.set(key, ps.length ? new RegExp(ps.map((p) => String.raw`\b(?:${p})`).join('|'), 'i') : null);
  }
  return metaRes.get(key)!;
}

/**
 * Whether a text breaks the fourth wall (what it says, for the feedback); with the lexicon's words, also
 * whether it explains one of them like a glossary. It reads the language of the world, Italian and English.
 */
export function metaBreak(text: string, words: string[] = [], world: WorldLanguage = DEFAULT_LANGUAGE): string | undefined {
  for (const lang of metaLanguages(world)) {
    const m = metaRe(lang, world)?.exec(text);
    if (m) return m[0];
  }
  return glossaryBreak(text, words, world);
}

/** The bible's lines that break the fourth wall (as «line» → what breaks it). */
export function bibleBreaks(b: Bible, words: string[] = [], world: WorldLanguage = DEFAULT_LANGUAGE): string[] {
  return [b.tone, b.summary, b.history ?? '', ...(b.characters ?? []), ...(b.facts ?? []), ...(b.mysteries ?? []), ...(b.customs ?? [])]
    .flatMap((l) => {
      const m = metaBreak(l, words, world);
      return m ? [`«${l.slice(0, 120)}» («${m}»)`] : [];
    });
}

/** How many customs of its own a universe adds to the lexicon (T65: few, the common thread stays). */
export const OWN_CUSTOMS = 3;

/**
 * The bible without the lines of lists that break the fourth wall (and without the old «crepe»); its own
 * customs at most OWN_CUSTOMS, none that explains or redefines a word of the lexicon.
 */
export function cleanBible(b: Bible, words: string[] = [], world: WorldLanguage = DEFAULT_LANGUAGE): Bible {
  const keep = (ls?: string[]) => (ls ?? []).filter((l) => typeof l === 'string' && !metaBreak(l, words, world));
  const { cracks: _, customs: usanze, ...rest } = b;
  const own = keep(usanze).filter((l) => !redefines(l, words)).slice(0, OWN_CUSTOMS);
  return { ...rest, characters: keep(b.characters), facts: keep(b.facts), mysteries: keep(b.mysteries), ...(own.length ? { customs: own } : {}) };
}

/** A custom that starts from a word of the lexicon («bonombo: …») gives it a meaning again: it contradicts the lexicon. */
function redefines(line: string, words: string[]): boolean {
  const head = line.trim().replace(/^[-*«"“\s]+/, '').toLowerCase();
  return words.some((w) => new RegExp(`^${escape(w.toLowerCase())}(?![\p{L}])[»"”\s]*[:=—–-]`, 'u').test(head));
}

/** The lexicon's words (world/lexicon.md, «Parole che si dicono così»), every form: what no one in the world explains. */
export function lexiconWords(lexicon: string): string[] {
  const section = /^## Parole[^\n]*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(lexicon)?.[1] ?? '';
  return [...section.matchAll(/^- \*\*([^*]+)\*\*/gm)].flatMap((m) => m[1].split('/').map((w) => w.trim()).filter(Boolean));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * How a glossary explains a word, per language (T310): `w` is the word of the lexicon. The first form needs no quotes, the second
 * only a quoted word («il macico sta per partire» is just speech), the third names the word as a word.
 */
const GLOSSARY_PATTERNS: Partial<Record<WorldLanguage, (w: string) => readonly string[]>> = {
  it: (w) => [
    // «bonombo» significa ciao; lerpio vuol dire bello
    String.raw`(?<![\p{L}])${w}[»"”']?\s*,?\s*(?:significa|vuol(?:e)? dire|si traduce|equivale a|(?:è|e') (?:una )?parol\w* (?:per|che))`,
    // «macico», cioè un tale
    String.raw`[«"“']${w}[»"”']\s*,?\s*(?:sta per|cioè|ovvero|nel senso di)`,
    // la parola bonombo
    String.raw`(?<![\p{L}])(?:la|una|questa|quella) (?:parol\w*|termin\w*|espression\w*) [«"“]?${w}(?![\p{L}])`,
  ],
  en: (w) => [
    // "bonombo" means hello; lerpio is a word for beautiful
    String.raw`(?<![\p{L}])${w}[»"”']?\s*,?\s*(?:means|meant|stands for|translates (?:as|to)|is (?:an?|the|their|our) (?:\w+ )?word (?:for|that|meaning)|is (?:how|what) (?:they|we|people|folk) (?:say|call))`,
    // "macico", that is a fellow
    String.raw`[«"“']${w}[»"”']\s*,?\s*(?:that is|i\.e\.|in other words|meaning)`,
    // the word bonombo
    String.raw`(?<![\p{L}])(?:the|a|this|that) (?:word|term|expression) [«"“]?${w}(?![\p{L}])`,
  ],
};

/**
 * Whether a text of the world explains a word of the lexicon like a glossary («bonombo» significa ciao): the
 * people speak their language, nobody translates it (T65). What it says, for the feedback. The lexicon is the same in
 * every language; the forms of a glossary are read in the language of the world, Italian and English.
 */
export function glossaryBreak(text: string, words: string[], world: WorldLanguage = DEFAULT_LANGUAGE): string | undefined {
  if (!words.length) return undefined;
  const w = `(?:${words.map(escape).join('|')})`;
  const forms = metaLanguages(world).flatMap((lang) => GLOSSARY_PATTERNS[lang]?.(w) ?? []);
  return new RegExp(forms.join('|'), 'iu').exec(text)?.[0];
}
