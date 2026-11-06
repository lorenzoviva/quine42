// The people of the world as a society: every individual has a job, a family, a home and a daily
// routine, and is related to the others. The registry lives in the universe (world/people.json): the
// Narrator reads it when it creates someone new, so new people fit among the old ones (a daughter of
// the miller, the blacksmith's rival). The kernel turns routines into places to go (sys.wander walks
// there) and lets related people greet each other when they meet. No model calls here.

import { internalFields, internalIndividual, italianName } from './internalNames';
import { hashStr } from './rng';
import type { FileMap } from './types';
import { SOLO, WANDERER_NAME, wandererOf } from './wanderers';

// The values are internal (T307b, ADR-0153): English; the world says them in its language (italianName).
export type DayPhase = 'morning' | 'day' | 'evening' | 'night';
export const DAY_PHASES: DayPhase[] = ['morning', 'day', 'evening', 'night'];
export type Where = 'home' | 'work' | 'square' | 'about';
export const WHERES: Where[] = ['home', 'work', 'square', 'about'];

/** What an individual is physically doing: the renderer shows it (lying in bed, hoeing, fishing…). */
export const ACTIVITIES = ['sleep', 'hoe', 'work', 'cook', 'eat', 'pray', 'trade', 'patrol', 'chat', 'read', 'fish', 'chop_wood', 'graze', 'stroll'] as const;
export type Activity = (typeof ACTIVITIES)[number];

/** A sign over the head while doing it. */
export const ACTIVITY_ICON: Record<Activity, string> = {
  sleep: 'z', hoe: '⚒', work: '⚒', cook: '♨', eat: 'ò', pray: '✦', trade: '⚖', patrol: '⚔', chat: '…', read: '▤', fish: '≈', chop_wood: '⚒', graze: '♣', stroll: '',
};

/** The activity a routine step describes, when the Narrator did not say. */
export function inferActivity(fa: string, dove: string): Activity {
  const t = fa.toLowerCase();
  const rules: Array<[RegExp, Activity]> = [
    [/dorm|riposa|letto|sonn/, 'sleep'], [/zapp|semin|ar[ao]|campo|orto|raccol|mietere|mieti/, 'hoe'], [/cucin|impast|forno|pane|zuppa/, 'cook'], [/mangi|cena|pranz|colazion/, 'eat'],
    [/preg|tempio|altare|medita/, 'pray'], [/vend|commerc|merc|banco|baratt/, 'trade'], [/guard|pattugl|ronda|sorveglia/, 'patrol'], [/legg|studi|scriv|libr/, 'read'],
    [/pesc/, 'fish'], [/legna|ascia|taglia|tronc/, 'chop_wood'], [/pecor|greg|pascol|capre|mucche/, 'graze'], [/chiacchier|parla|racconta|piazza/, 'chat'],
    [/lavor|forgia|martell|cuc[ie]|tess|ripara|intaglia|bottega/, 'work'],
  ];
  return rules.find(([re]) => re.test(t))?.[1] ?? (dove === 'home' ? 'eat' : dove === 'square' ? 'chat' : 'stroll');
}

export interface RoutineStep {
  when: DayPhase;
  does: string;
  where: Where;
  activity?: Activity;
}

/** Something an individual remembers: what happened, with whom, how much it mattered (1-3). */
export interface Memory {
  when: string;
  text: string;
  with?: string;
  /** The wanderer it is about (their id, T34): only they hear of it. */
  wanderer?: string;
  weight: number;
}

export interface Relation {
  name: string;
  bond: string;
  /** A relation with a wanderer: their id (`nome` is how they are called). */
  wanderer?: string;
}

export type Species = 'person' | 'animal';
export type Gender = 'male' | 'female';

export interface Individual {
  name: string;
  /** A person or an animal (from the archetype): it decides which relations are possible. */
  species?: Species;
  gender?: Gender;
  /** Archetype module. */
  kind: string;
  job: string;
  age?: string;
  family: Relation[];
  routine: RoutineStep[];
  story?: string;
  /** Where they were met (place name) and the stable origin of their entity, to meet them again. */
  place?: string;
  origin?: string;
  persona?: string;
  look?: string;
  carries?: string[];
  memories?: Memory[];
  /** Before T34: what they were to the only wanderer (read into `famiglia` with the id `io`). */
  wandererBond?: string;
  /** The sheet the Narrator wrote for the Actor (T157): the text, and the fingerprint of what it was written from. */
  sheet?: IndividualSheet;
}

/** The sheet of an individual (T157): written once, rewritten when their bonds or story change (`sheetFingerprint`). */
export interface IndividualSheet {
  text: string;
  fingerprint: string;
}

/** What a sheet depends on: who they are, their trade, their story, their bonds. Memories are not here: they go with every line. */
export function sheetFingerprint(p: Pick<Individual, 'name' | 'persona' | 'job' | 'story' | 'family' | 'age' | 'gender'>): string {
  const bonds = [...(p.family ?? [])].map((f) => `${f.name}=${f.bond}`).sort().join(',');
  return String(hashStr(`${p.name}|${p.persona ?? ''}|${p.job}|${p.story ?? ''}|${p.age ?? ''}|${p.gender ?? ''}|${bonds}`));
}

/** Keeps memories that matter: the heavy ones and the recent ones (at most 30). */
export function remember(list: Memory[] | undefined, m: Memory): Memory[] {
  const all = [...(list ?? []), m];
  if (all.length <= 30) return all;
  // Forget the lightest of the oldest.
  const old = all.slice(0, all.length - 10);
  const drop = old.reduce((best, x, i) => (x.weight < old[best].weight ? i : best), 0);
  return all.filter((_, i) => i !== drop);
}

export function memorySummary(list: Memory[] | undefined, n = 12): string {
  return (list ?? [])
    .slice(-n)
    .map((m) => `- (${m.when}${m.with ? `, con ${m.with}` : ''}${m.weight >= 3 ? ', importante' : ''}) ${m.text}`)
    .join('\n');
}

export interface People {
  people: Individual[];
  /** Named by someone, not met yet: a later individual of a fitting kind may turn out to be them. */
  expected: Array<{ name: string; bond: string; of: string }>;
}

export function readPeople(files: FileMap): People {
  try {
    const p = JSON.parse(files['world/people.json'] ?? '{}');
    // Values of the contract 0.2 (`femmina`, `mattina`, T307b) and fields of 0.3 (`nome`, `famiglia`, T308a) read internal: the
    // migration ports the file, this a stray one. The values first: their repair reads the fields of before.
    const people = (p.people ?? p.persone ?? []).map((x: Individual) => withWandererIds(internalFields('individual', internalIndividual(x))));
    return { people, expected: (internalFields('people', { attesi: p.expected ?? p.attesi ?? [] }) as unknown as { expected?: People['expected'] }).expected ?? [] };
  } catch {
    return { people: [], expected: [] };
  }
}

/** A registry written before T34 speaks of «Viandante»: that is the wanderer `io`. */
function withWandererIds(p: Individual): Individual {
  const famiglia = (p.family ?? []).map((r) => (r.wanderer || wandererOf(r) !== SOLO ? r : { ...r, wanderer: SOLO }));
  if (p.wandererBond && !famiglia.some((r) => wandererOf(r) === SOLO)) famiglia.push({ name: WANDERER_NAME, bond: p.wandererBond, wanderer: SOLO });
  const ricordi = p.memories?.map((m) => (m.wanderer || wandererOf(m) !== SOLO ? m : { ...m, wanderer: SOLO }));
  const { wandererBond: _, ...rest } = p;
  return { ...rest, family: famiglia, ...(ricordi ? { memories: ricordi } : {}) };
}

// --- A coherent society: species, gender, relations both ways, names that do not repeat ----------
//
// A relation in an individual's `famiglia` says what THIS individual is to the other one: Berta's
// { nome: 'Ada', legame: 'figlia' } means Berta is Ada's daughter. The word agrees with this individual's
// gender; what is possible depends on both species (a cat has no human brother and no apprentice, it
// has at most one owner). The kernel writes the other side itself.

/** Who can be what to whom: same species, people only, anyone, a person to an animal (or a servant), an animal to its owner. */
type Between = 'same' | 'people' | 'all' | 'owner' | 'pet';

interface Kind {
  id: string;
  m: string;
  f: string;
  /** The word when the gender is unknown (someone named, not met). */
  n?: string;
  words: RegExp;
  /** What the other one is, in order of preference. */
  back: string[];
  between: Between;
}

const KINDS: Kind[] = [
  { id: 'parent', m: 'padre', f: 'madre', n: 'genitore', words: /^(padre|madre|mamma|papà|babbo|genitore)$/, back: ['child'], between: 'same' },
  { id: 'child', m: 'figlio', f: 'figlia', words: /^(figli[oa]|figliastr[oa]|bambin[oa])$/, back: ['parent'], between: 'same' },
  { id: 'sibling', m: 'fratello', f: 'sorella', words: /^(fratell(o|astro)|sorell(a|astra)|gemell[oa])$/, back: ['sibling'], between: 'same' },
  { id: 'spouse', m: 'marito', f: 'moglie', n: 'coniuge', words: /^(marito|moglie|spos[oa]|coniuge|consorte)$/, back: ['spouse'], between: 'people' },
  { id: 'betrothed', m: 'fidanzato', f: 'fidanzata', words: /^fidanzat[oa]$/, back: ['betrothed'], between: 'people' },
  { id: 'grandparent', m: 'nonno', f: 'nonna', words: /^nonn[oa]$/, back: ['grandchild_or_nephew'], between: 'people' },
  { id: 'uncle_or_aunt', m: 'zio', f: 'zia', words: /^zi[oa]$/, back: ['grandchild_or_nephew'], between: 'people' },
  { id: 'grandchild_or_nephew', m: 'nipote', f: 'nipote', words: /^nipot(e|in[oa])$/, back: ['grandparent', 'uncle_or_aunt'], between: 'people' },
  { id: 'cousin', m: 'cugino', f: 'cugina', words: /^cugin[oa]$/, back: ['cousin'], between: 'people' },
  { id: 'sibling_in_law', m: 'cognato', f: 'cognata', words: /^cognat[oa]$/, back: ['sibling_in_law'], between: 'people' },
  { id: 'parent_in_law', m: 'suocero', f: 'suocera', words: /^suocer[oa]$/, back: ['child_in_law'], between: 'people' },
  { id: 'child_in_law', m: 'genero', f: 'nuora', words: /^(genero|nuora)$/, back: ['parent_in_law'], between: 'people' },
  { id: 'mentor', m: 'maestro', f: 'maestra', words: /^(maestr[oa]|mentore)$/, back: ['apprentice'], between: 'people' },
  { id: 'apprentice', m: 'apprendista', f: 'apprendista', words: /^(apprendista|garzone|allievo|allieva|discepol[oa])$/, back: ['mentor'], between: 'people' },
  { id: 'owner', m: 'padrone', f: 'padrona', words: /^padron[ea]$/, back: ['pet', 'servant'], between: 'owner' },
  { id: 'servant', m: 'servo', f: 'serva', words: /^serv[oa]$/, back: ['owner'], between: 'people' },
  { id: 'pet', m: 'animale', f: 'animale', words: /^(animale|gatt[oa]|can[ei]|cagnolin[oa]|mici[oa])$/, back: ['owner'], between: 'pet' },
  { id: 'friend', m: 'amico', f: 'amica', words: /^(amic[oa]|compagn[oa])$/, back: ['friend'], between: 'all' },
  { id: 'rival', m: 'rivale', f: 'rivale', words: /^(rivale|nemic[oa])$/, back: ['rival'], between: 'all' },
  { id: 'neighbor', m: 'vicino', f: 'vicina', words: /^vicin[oa]$/, back: ['neighbor'], between: 'all' },
  { id: 'colleague', m: 'collega', f: 'collega', words: /^(collega|soci[oa])$/, back: ['colleague'], between: 'people' },
  { id: 'acquaintance', m: 'conoscente', f: 'conoscente', words: /^conoscente$/, back: ['acquaintance'], between: 'all' },
];
const KIND = new Map(KINDS.map((k) => [k.id, k]));

/** The words a relation can be said with, for the Narrator. */
export const RELATION_WORDS = KINDS.flatMap((k) => (k.m === k.f ? [k.m] : [k.m, k.f]));

/** The kind of a relation: the first word that means something ("nipote lontano" is a nipote); else an acquaintance. */
function kindOf(legame: string): Kind {
  for (const w of legame.toLowerCase().split(/[^\p{L}]+/u)) {
    const k = KINDS.find((x) => x.words.test(w));
    if (k) return k;
  }
  return KIND.get('acquaintance')!;
}

function allowed(k: Kind, a: Species, b: Species | undefined): boolean {
  switch (k.between) {
    case 'same': return !b || a === b;
    case 'people': return a === 'person' && (!b || b === 'person');
    case 'all': return true;
    case 'owner': return a === 'person';
    case 'pet': return a === 'animal' && (!b || b === 'person');
  }
}

/** What a relation can be between these two: family across species becomes ownership, the rest friendship. */
function fitKind(k: Kind, a: Species, b: Species | undefined): Kind {
  if (allowed(k, a, b)) return k;
  if (a === 'person' && b === 'animal') return KIND.get('owner')!;
  if (a === 'animal' && b === 'person') return KIND.get('pet')!;
  return KIND.get('friend')!;
}

const wordOf = (k: Kind, g: Gender | undefined) => (g === 'female' ? k.f : g === 'male' ? k.m : k.n ?? k.m);

const backOf = (k: Kind, a: Species, b: Species) => KIND.get(k.back.find((id) => allowed(KIND.get(id)!, b, a)) ?? 'acquaintance')!;

/** The other side of a relation: if Ada is Berta's mother, Berta is Ada's child (in Berta's gender). */
export function reverseRelation(legame: string, gender?: Gender, a: Species = 'person', b: Species = a): string {
  return wordOf(backOf(fitKind(kindOf(legame), a, b), a, b), gender);
}

/** What is wrong with a relation between these two (species, the word's gender), or undefined when it can be. */
export function relationProblem(legame: string, a: { species?: Species; gender?: Gender }, b: { species?: Species }): string | undefined {
  const k = kindOf(legame);
  const sa = a.species ?? 'person';
  if (!allowed(k, sa, b.species)) return `«${legame}» non si dà tra ${sa === 'animal' ? 'un animale' : 'una persona'} e ${b.species === 'animal' ? 'un animale' : 'una persona'}`;
  const word = legame.toLowerCase().split(/[^\p{L}]+/u).find((w) => k.words.test(w));
  if (word && k.m !== k.f && a.gender && word === (a.gender === 'female' ? k.m : k.f)) return `«${legame}» non si dice di ${a.gender === 'female' ? 'una femmina' : 'un maschio'}`;
  return undefined;
}

/** True when two relations can be the two sides of one bond (Ada madre di Berta, Berta figlia di Ada). */
export function relationsAgree(ab: string, ba: string): boolean {
  const x = kindOf(ab);
  const y = kindOf(ba);
  return x.back.includes(y.id) || y.back.includes(x.id);
}

/** Relations anyone may claim loosely (a friend, a rival, a neighbour): the others bind and are checked. */
const LOOSE = new Set(['friend', 'rival', 'neighbor', 'colleague', 'acquaintance']);

/** The words of the binding relations (family, master and apprentice, owner and animal), as a regex alternation. */
export const BINDING_WORDS = KINDS.filter((k) => !LOOSE.has(k.id)).map((k) => k.words.source.slice(1, -1)).join('|');

/** The kind of a relation: "sorella" and "fratello" are one kind, to compare what is said with the registry. */
export function relationKind(legame: string): string {
  return kindOf(legame).id;
}

// Names: two names are alike when their given names are close ("Elias il Giovane" and "Elias la
// Rossa", "Vecchia Elara" and "Elara del Pozzo", "Ombra" and "Ombroso", "Elia" and "Elias"); a
// shared family or place name ("Isolde del Riflesso", "Lyra del Riflesso") is fine.
const NAME_FILLER = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'dal', 'dalla', 'dai', 'di', 'da', 'de', 'd', 'e', 'giovane', 'vecchio', 'vecchia', 'rosso', 'rossa', 'sotto', 'sopra', 'pozzo', 'mulino', 'collina', 'piccolo', 'piccola']);

function nameWords(name: string): string[] {
  const all = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const core = all.filter((w) => !NAME_FILLER.has(w));
  return core.length ? core : all;
}

function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}

function closeWords(a: string, b: string): boolean {
  if (a === b) return true;
  const short = Math.min(a.length, b.length);
  let prefix = 0;
  while (prefix < short && a[prefix] === b[prefix]) prefix++;
  return prefix >= 4 || distance(a, b) <= (short <= 5 ? 1 : 2);
}

/** True when two names would be mistaken for each other. */
export function similarNames(a: string, b: string): boolean {
  const [x] = nameWords(a);
  const [y] = nameWords(b);
  return !!x && !!y && closeWords(x, y);
}

const NAME_POOL: Record<Species, Record<Gender, string[]>> = {
  person: {
    female: ['Adelina', 'Brunella', 'Clelia', 'Dorotea', 'Elvira', 'Filomena', 'Giuditta', 'Irene', 'Lucrezia', 'Nives', 'Ornella', 'Petronilla', 'Quirina', 'Rosalba', 'Serafina', 'Teodora', 'Ursula', 'Violante', 'Zelinda', 'Albina', 'Benedetta', 'Costanza', 'Dafne', 'Ersilia', 'Fosca', 'Gisella', 'Ippolita', 'Letizia', 'Marianna', 'Noemi'],
    male: ['Adelmo', 'Baldo', 'Cosimo', 'Damiano', 'Ermanno', 'Fulvio', 'Gerardo', 'Ivo', 'Leandro', 'Manfredi', 'Nestore', 'Oreste', 'Pasquale', 'Quinto', 'Raniero', 'Settimio', 'Teobaldo', 'Umberto', 'Vitale', 'Zeno', 'Amedeo', 'Bonifacio', 'Clemente', 'Donato', 'Egidio', 'Folco', 'Gaspare', 'Lazzaro', 'Matteo', 'Ottavio'],
  },
  animal: {
    female: ['Briciola', 'Cannella', 'Fuliggine', 'Lucciola', 'Mora', 'Nocciola', 'Pepita', 'Stella', 'Zucca', 'Perla', 'Ruggine', 'Viola'],
    male: ['Baffo', 'Carbone', 'Fumo', 'Gomitolo', 'Lampo', 'Pepe', 'Tizzone', 'Bricco', 'Ciuffo', 'Pallino', 'Tobia', 'Zenzero'],
  },
};

/** A name unlike every name taken: from the pool first, then made of syllables (deterministic for a seed). */
export function freshName(specie: Species, genere: Gender, taken: string[], seed: string): string {
  const free = (n: string) => !taken.some((t) => similarNames(t, n));
  const pool = NAME_POOL[specie][genere];
  const h = hashStr(seed);
  for (let i = 0; i < pool.length; i++) if (free(pool[(h + i) % pool.length])) return pool[(h + i) % pool.length];
  const C = ['b', 'c', 'd', 'f', 'g', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'z'];
  const V = ['a', 'e', 'i', 'o', 'u'];
  for (let i = 0; i < 2000; i++) {
    const x = hashStr(`${seed}#${i}`);
    const n = `${C[x % 14].toUpperCase()}${V[(x >> 4) % 5]}${C[(x >> 7) % 14]}${V[(x >> 11) % 5]}${['', 'l', 'n', 'r'][(x >> 14) % 4]}${genere === 'female' ? 'a' : 'o'}`;
    if (free(n)) return n;
  }
  return `${pool[h % pool.length]} ${taken.length}`;
}

const MALE_IN_A = /^(luca|andrea|elia|barnaba|nicola|mattia|tobia|enea|battista|geremia|isaia|giona|zaccaria|evangelista)$/;

/** A gender for someone who has none written: the name, the job, the words they are called by. */
export function guessGender(p: Pick<Individual, 'name' | 'job' | 'family'>): Gender {
  const first = nameWords(p.name)[0] ?? '';
  if (MALE_IN_A.test(first)) return 'male';
  if (/a$/.test(first)) return 'female';
  if (/o$/.test(first)) return 'male';
  const job = (p.job ?? '').toLowerCase().split(/\s+/)[0] ?? '';
  if (/(trice|essa|iera|aia|ina)$/.test(job)) return 'female';
  if (/(tore|iere|aio|ino|o)$/.test(job)) return 'male';
  let f = 0;
  let m = 0;
  for (const r of p.family ?? []) {
    const w = r.bond.toLowerCase().split(/\s+/)[0];
    const k = kindOf(w);
    if (k.m === k.f) continue;
    if (w === k.f) f++;
    else if (w === k.m) m++;
  }
  return f > m ? 'female' : 'male';
}

export interface SocietyRepair {
  people: People;
  /** What was wrong (and is now right), one line each: empty when the society is coherent. */
  fixes: string[];
  /** Names given to people whose name was too like an older one's: [old, new]. */
  renames: Array<[string, string]>;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Replaces a full name in a text, but not when it is the start of a longer one ("Elia" in "Elia delle Rive"). */
export function renameIn(text: string, from: string, to: string): string {
  return text.replace(new RegExp(`(?<![\\p{L}])${escapeRe(from)}(?![\\p{L}]| (il|la|lo|del|della|dello|dei|delle|di|dal|dalla|da)\\b)`, 'gu'), to);
}

function renameDeep<T>(value: T, from: string, to: string): T {
  if (typeof value === 'string') return renameIn(value, from, to) as T;
  if (Array.isArray(value)) return value.map((v) => renameDeep(v, from, to)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, renameDeep(v, from, to)])) as T;
  return value;
}

/** Renames people in another file of the universe (plots name them). */
export function applyRenames<T>(value: T, renames: Array<[string, string]>): T {
  return renames.reduce((v, [from, to]) => renameDeep(v, from, to), value);
}

/**
 * Makes the society coherent: everyone has a species (from their type) and a gender; names are not
 * alike (later namesakes get a new name, everywhere); relations point to someone, are possible
 * between these two species, agree with the gender and exist on both sides (the first one said
 * wins); an animal has at most one owner and does an animal's job. The fixes are the validator's report.
 */
export function repairSociety(people: People, speciesOf: (tipo: string) => Species | undefined = () => undefined): SocietyRepair {
  const fixes: string[] = [];
  const renames: Array<[string, string]> = [];
  let persone: Individual[] = people.people.map((p) => ({ ...p, family: (p.family ?? []).map((r) => ({ ...r })) }));
  // Species and gender.
  for (const p of persone) {
    const sp = speciesOf(p.kind) ?? p.species ?? 'person';
    if (p.species !== sp) fixes.push(`${p.name}: specie ${italianName('specie', sp)}`);
    p.species = sp;
    if (p.gender !== 'male' && p.gender !== 'female') {
      p.gender = guessGender(p);
      fixes.push(`${p.name}: genere ${italianName('specie', p.gender)}`);
    }
  }
  // Names: the first one keeps it.
  const taken: string[] = ['Viandante'];
  for (let i = 0; i < persone.length; i++) {
    const p = persone[i];
    if (taken.some((t) => similarNames(t, p.name))) {
      const old = p.name;
      const nuovo = freshName(p.species!, p.gender!, [...taken, ...persone.map((x) => x.name)], p.origin ?? old);
      renames.push([old, nuovo]);
      fixes.push(`${old} → ${nuovo}: nome troppo simile a un altro`);
      // An exact namesake: only their own record speaks of them (the others mean the first one).
      if (persone.some((x) => x !== p && x.name === old)) persone[i] = renameDeep(p, old, nuovo);
      else persone = persone.map((x) => renameDeep(x, old, nuovo));
      persone[i].name = nuovo;
    }
    taken.push(persone[i].name);
  }
  const byName = new Map<string, Individual>();
  for (const p of persone) if (!byName.has(p.name.toLowerCase())) byName.set(p.name.toLowerCase(), p);
  // Relations, as pairs: the first said is the truth, the other side follows.
  interface Edge { a: Individual; b: Individual; ab: Kind; ba?: Kind }
  const edges = new Map<string, Edge>();
  const own = new Map<Individual, Array<Edge | Relation>>(persone.map((p) => [p, []]));
  const said = (p: Individual, r: Relation, k: Kind, to: string) => {
    if (wordOf(k, p.gender) !== r.bond) fixes.push(`${p.name}: ${r.bond} di ${to} → ${wordOf(k, p.gender)}`);
  };
  for (const p of persone) {
    for (const r of p.family) {
      if (wandererOf(r)) {
        own.get(p)!.push(r);
        continue;
      }
      const q = byName.get(r.name.toLowerCase());
      if (q === p) {
        fixes.push(`${p.name}: legame con se stesso`);
        continue;
      }
      const k = fitKind(kindOf(r.bond), p.species!, q?.species);
      if (!q) {
        // Someone named, not met yet.
        if (own.get(p)!.some((x) => !('a' in x) && x.name.toLowerCase() === r.name.toLowerCase())) continue;
        said(p, r, k, r.name);
        own.get(p)!.push({ name: r.name, bond: wordOf(k, p.gender) });
        continue;
      }
      const key = [p.name, q.name].sort().join('\u0000');
      const e = edges.get(key);
      if (!e) {
        const edge: Edge = { a: p, b: q, ab: k };
        edges.set(key, edge);
        own.get(p)!.push(edge);
        own.get(q)!.push(edge);
        said(p, r, k, q.name);
      } else if (e.a === p || e.ba) {
        fixes.push(`${p.name}: un secondo legame con ${q.name}`);
      } else if (e.ab.back.includes(k.id) && allowed(k, p.species!, q.species)) {
        // The other side, said by the second one: kept if it agrees.
        e.ba = k;
        said(p, r, k, q.name);
      } else {
        e.ba = backOf(e.ab, q.species!, p.species!);
        fixes.push(`${p.name}: ${r.bond} di ${q.name} non torna con ${wordOf(e.ab, q.gender)} di ${p.name} → ${wordOf(e.ba, p.gender)}`);
      }
    }
  }
  for (const e of edges.values()) {
    if (e.ba) continue;
    e.ba = backOf(e.ab, e.a.species!, e.b.species!);
    fixes.push(`${e.b.name}: manca ${wordOf(e.ba, e.b.gender)} di ${e.a.name}`);
  }
  // An animal has one owner: the first.
  const owned = new Set<Individual>();
  for (const e of edges.values()) {
    const animal = e.ab.id === 'owner' && e.b.species === 'animal' ? e.b : e.ba!.id === 'owner' && e.a.species === 'animal' ? e.a : undefined;
    if (!animal) continue;
    if (owned.has(animal)) {
      e.ab = e.ba = KIND.get('friend')!;
      fixes.push(`${animal.name}: un solo padrone (${e.a === animal ? e.b.name : e.a.name} diventa amico)`);
    } else owned.add(animal);
  }
  // One father and one mother, one spouse, and spouses are not children of the same parent.
  const parents = new Map<Individual, Individual[]>();
  const spouse = new Map<Individual, Individual>();
  const parentsOf = (p: Individual) => parents.get(p) ?? [];
  for (const e of edges.values()) {
    const [parent, child] = e.ab.id === 'parent' ? [e.a, e.b] : e.ba!.id === 'parent' ? [e.b, e.a] : [];
    let wrong = '';
    if (parent && child) {
      const s = spouse.get(child);
      if (parentsOf(child).some((x) => x.gender === parent.gender)) wrong = `${child.name}: ha già ${parent.gender === 'female' ? 'una madre' : 'un padre'} (non ${parent.name})`;
      else if (s && (s === parent || parentsOf(s).includes(parent))) wrong = `${child.name}: ${parent.name} è già genitore del suo coniuge`;
      else parents.set(child, [...parentsOf(child), parent]);
    } else if (e.ab.id === 'spouse') {
      if (spouse.has(e.a) || spouse.has(e.b)) wrong = `${e.a.name} e ${e.b.name}: uno dei due è già sposato`;
      else if (parentsOf(e.a).some((x) => parentsOf(e.b).includes(x))) wrong = `${e.a.name} e ${e.b.name}: hanno un genitore in comune`;
      else spouse.set(e.a, e.b).set(e.b, e.a);
    }
    if (!wrong) continue;
    e.ab = e.ba = KIND.get('acquaintance')!;
    fixes.push(`${wrong} → conoscenti`);
  }
  for (const p of persone) {
    p.family = own.get(p)!.map((x) => ('a' in x ? { name: x.a === p ? x.b.name : x.a.name, bond: wordOf(x.a === p ? x.ab : x.ba!, p.gender) } : x));
  }
  // An animal does what animals of its kind do, not a person's job.
  const words = (s: string) => s.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length >= 4);
  for (const p of persone) {
    if (p.species !== 'animal') continue;
    const kin = persone.filter((x) => x !== p && x.kind === p.kind && x.species === 'animal');
    const mine = words(p.job ?? '');
    if (!kin.length || kin.some((x) => words(x.job ?? '').some((w) => mine.includes(w)))) continue;
    const counts = new Map<string, number>();
    for (const x of kin) counts.set(x.job, (counts.get(x.job) ?? 0) + 1);
    const best = [...counts].sort((x, y) => y[1] - x[1])[0][0];
    fixes.push(`${p.name}: ${p.job} → ${best}`);
    p.job = best;
  }
  // Named, not met: what they are to whoever named them.
  const attesi: People['expected'] = [];
  for (const p of persone) {
    for (const r of p.family) {
      if (wandererOf(r) || byName.has(r.name.toLowerCase()) || attesi.some((a) => a.name.toLowerCase() === r.name.toLowerCase())) continue;
      attesi.push({ name: r.name, bond: reverseRelation(r.bond, undefined, p.species, p.species), of: p.name });
    }
  }
  return { people: { people: persone, expected: attesi.slice(-60) }, fixes, renames };
}

/** The validator of the society: what is wrong in it (nothing, when it is coherent). */
export function checkSociety(people: People, speciesOf?: (tipo: string) => Species | undefined): string[] {
  return repairSociety(people, speciesOf).fixes;
}

/** Adds an individual; the society is then made coherent (the other side of each relation, the awaited ones). */
export function addIndividual(people: People, p: Individual, speciesOf?: (tipo: string) => Species | undefined): People {
  const persone = [...people.people.filter((x) => x.name !== p.name), p].slice(-200);
  return repairSociety({ people: persone, expected: people.expected }, speciesOf).people;
}

/** What the society looks like, for the Narrator creating someone new. */
export function societySummary(people: People, n = 16): string {
  const who = (p: Individual) => (p.species === 'animal' ? `animale${p.gender ? `, ${italianName('specie', p.gender)}` : ''}` : p.gender === 'female' ? 'donna' : p.gender === 'male' ? 'uomo' : '');
  const lines = people.people.slice(-n).map((p) => `- ${p.name}, ${p.job}${who(p) ? ` — ${who(p)}` : ''}${p.place ? ` (${p.place})` : ''}${p.family.length ? `; ${p.family.map((r) => `${r.bond} di ${r.name}`).join(', ')}` : ''}`);
  const waiting = people.expected.slice(-10).map((a) => `- ${a.name} (${a.bond} di ${a.of})`);
  return [lines.length ? `Persone già conosciute:\n${lines.join('\n')}` : 'Nessuno è stato ancora conosciuto.', waiting.length ? `Nominate ma mai incontrate (potresti essere una di loro, se il tipo è adatto):\n${waiting.join('\n')}` : ''].filter(Boolean).join('\n\n');
}

/** The part of the day, from the kernel's clock (same phase as daylight). */
export function dayPhase(time: number, daySeconds: number): DayPhase {
  const phase = (time / daySeconds + 0.12) % 1;
  // daylight peaks at 0.25; night is centred on 0.75.
  if (phase < 0.12 || phase >= 0.96) return 'morning';
  if (phase < 0.42) return 'day';
  if (phase < 0.58) return 'evening';
  return 'night';
}

/** A sensible routine when the Narrator gave none. */
export function defaultRoutine(job: string): RoutineStep[] {
  return [
    { when: 'morning', does: 'si prepara per la giornata', where: 'home', activity: 'eat' },
    { when: 'day', does: job ? `lavora come ${job}` : 'lavora', where: 'work', activity: inferActivity(job || 'lavora', 'work') },
    { when: 'evening', does: 'chiacchiera in piazza', where: 'square', activity: 'chat' },
    { when: 'night', does: 'dorme', where: 'home', activity: 'sleep' },
  ];
}

/** A line two related people say when they meet (cheap: no model). */
export function greeting(a: { nome: string; mestiere: string }, b: { nome: string }, legame: string, doing: string): [string, string] {
  const l = legame.toLowerCase();
  if (/figli|bambin/.test(l)) return [`${b.nome}! Non fare tardi stasera.`, `Sì, sì… sto ${doing || 'arrivando'}.`];
  if (/genitore|madre|padre|mamma|papà/.test(l)) return [`Ciao! Sto ${doing || 'lavorando'}.`, `Brava gente lavora, ${a.nome}. Ci vediamo a cena.`];
  if (/moglie|marito/.test(l)) return [`${b.nome}, hai visto che cielo strano oggi?`, `Sembra sempre lo stesso, caro mio.`];
  if (/fratello|sorella/.test(l)) return [`Ehi, ${b.nome}! Ancora qui?`, `Dove vuoi che vada? Qui si torna sempre.`];
  if (/rivale/.test(l)) return [`Hmpf. ${b.nome}.`, `${a.nome}. Sempre in mezzo ai piedi.`];
  if (/apprendista|garzone/.test(l)) return [`Maestro, ho quasi finito!`, `Quasi non basta, ${a.nome}.`];
  return [`Buongiorno, ${b.nome}!`, `Buongiorno a te, ${a.nome}. Come va il lavoro da ${a.mestiere}?`];
}
