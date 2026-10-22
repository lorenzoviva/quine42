// The people of the world as a society: every individual has a job, a family, a home and a daily
// routine, and is related to the others. The registry lives in the universe (world/people.json): the
// Narrator reads it when it creates someone new, so new people fit among the old ones (a daughter of
// the miller, the blacksmith's rival). The kernel turns routines into places to go (sys.wander walks
// there) and lets related people greet each other when they meet. No model calls here.

import { hashStr } from './rng';
import type { FileMap } from './types';

export type DayPhase = 'mattina' | 'giorno' | 'sera' | 'notte';
export const DAY_PHASES: DayPhase[] = ['mattina', 'giorno', 'sera', 'notte'];
export type Where = 'casa' | 'lavoro' | 'piazza' | 'in giro';
export const WHERES: Where[] = ['casa', 'lavoro', 'piazza', 'in giro'];

/** What a person is physically doing: the renderer shows it (lying in bed, hoeing, fishing…). */
export const ACTIVITIES = ['dorme', 'zappa', 'lavora', 'cucina', 'mangia', 'prega', 'commercia', 'pattuglia', 'chiacchiera', 'legge', 'pesca', 'taglia_legna', 'pascola', 'passeggia'] as const;
export type Activity = (typeof ACTIVITIES)[number];

/** A sign over the head while doing it. */
export const ACTIVITY_ICON: Record<Activity, string> = {
  dorme: 'z', zappa: '⚒', lavora: '⚒', cucina: '♨', mangia: 'ò', prega: '✦', commercia: '⚖', pattuglia: '⚔', chiacchiera: '…', legge: '▤', pesca: '≈', taglia_legna: '⚒', pascola: '♣', passeggia: '',
};

/** The activity a routine step describes, when the Narrator did not say. */
export function inferActivity(fa: string, dove: string): Activity {
  const t = fa.toLowerCase();
  const rules: Array<[RegExp, Activity]> = [
    [/dorm|riposa|letto|sonn/, 'dorme'], [/zapp|semin|ar[ao]|campo|orto|raccol|mietere|mieti/, 'zappa'], [/cucin|impast|forno|pane|zuppa/, 'cucina'], [/mangi|cena|pranz|colazion/, 'mangia'],
    [/preg|tempio|altare|medita/, 'prega'], [/vend|commerc|merc|banco|baratt/, 'commercia'], [/guard|pattugl|ronda|sorveglia/, 'pattuglia'], [/legg|studi|scriv|libr/, 'legge'],
    [/pesc/, 'pesca'], [/legna|ascia|taglia|tronc/, 'taglia_legna'], [/pecor|greg|pascol|capre|mucche/, 'pascola'], [/chiacchier|parla|racconta|piazza/, 'chiacchiera'],
    [/lavor|forgia|martell|cuc[ie]|tess|ripara|intaglia|bottega/, 'lavora'],
  ];
  return rules.find(([re]) => re.test(t))?.[1] ?? (dove === 'casa' ? 'mangia' : dove === 'piazza' ? 'chiacchiera' : 'passeggia');
}

export interface RoutineStep {
  quando: DayPhase;
  fa: string;
  dove: Where;
  azione?: Activity;
}

/** Something a person remembers: what happened, with whom, how much it mattered (1-3). */
export interface Memory {
  quando: string;
  testo: string;
  con?: string;
  peso: number;
}

export interface Relation {
  nome: string;
  legame: string;
}

export type Species = 'persona' | 'animale';
export type Gender = 'maschio' | 'femmina';

export interface Person {
  nome: string;
  /** A person or an animal (from the archetype): it decides which relations are possible. */
  specie?: Species;
  genere?: Gender;
  /** Archetype module. */
  tipo: string;
  mestiere: string;
  eta?: string;
  famiglia: Relation[];
  routine: RoutineStep[];
  storia?: string;
  /** Where they were met (place name) and the stable origin of their entity, to meet them again. */
  luogo?: string;
  origine?: string;
  persona?: string;
  aspetto?: string;
  porta?: string[];
  ricordi?: Memory[];
  /** What they are to the wanderer (amico, fidanzata, moglie, figlio…), if anything. */
  legameViandante?: string;
}

/** Keeps memories that matter: the heavy ones and the recent ones (at most 30). */
export function remember(list: Memory[] | undefined, m: Memory): Memory[] {
  const all = [...(list ?? []), m];
  if (all.length <= 30) return all;
  // Forget the lightest of the oldest.
  const old = all.slice(0, all.length - 10);
  const drop = old.reduce((best, x, i) => (x.peso < old[best].peso ? i : best), 0);
  return all.filter((_, i) => i !== drop);
}

export function memorySummary(list: Memory[] | undefined, n = 12): string {
  return (list ?? [])
    .slice(-n)
    .map((m) => `- (${m.quando}${m.con ? `, con ${m.con}` : ''}${m.peso >= 3 ? ', importante' : ''}) ${m.testo}`)
    .join('\n');
}

export interface People {
  persone: Person[];
  /** Named by someone, not met yet: a later individual of a fitting kind may turn out to be them. */
  attesi: Array<{ nome: string; legame: string; di: string }>;
}

export function readPeople(files: FileMap): People {
  try {
    const p = JSON.parse(files['world/people.json'] ?? '{}');
    return { persone: p.persone ?? [], attesi: p.attesi ?? [] };
  } catch {
    return { persone: [], attesi: [] };
  }
}

// --- A coherent society: species, gender, relations both ways, names that do not repeat ----------
//
// A relation in a person's `famiglia` says what THIS person is to the other one: Berta's
// { nome: 'Ada', legame: 'figlia' } means Berta is Ada's daughter. The word agrees with this person's
// gender; what is possible depends on both species (a cat has no human brother and no apprentice, it
// has at most one owner). The kernel writes the other side itself.

/** Who can be what to whom: same species, people only, anyone, a person to an animal (or a servant), an animal to its owner. */
type Between = 'stessa' | 'persone' | 'tutti' | 'padrone' | 'animale';

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
  { id: 'genitore', m: 'padre', f: 'madre', n: 'genitore', words: /^(padre|madre|mamma|papà|babbo|genitore)$/, back: ['figlio'], between: 'stessa' },
  { id: 'figlio', m: 'figlio', f: 'figlia', words: /^(figli[oa]|figliastr[oa]|bambin[oa])$/, back: ['genitore'], between: 'stessa' },
  { id: 'fratello', m: 'fratello', f: 'sorella', words: /^(fratell(o|astro)|sorell(a|astra)|gemell[oa])$/, back: ['fratello'], between: 'stessa' },
  { id: 'coniuge', m: 'marito', f: 'moglie', n: 'coniuge', words: /^(marito|moglie|spos[oa]|coniuge|consorte)$/, back: ['coniuge'], between: 'persone' },
  { id: 'fidanzato', m: 'fidanzato', f: 'fidanzata', words: /^fidanzat[oa]$/, back: ['fidanzato'], between: 'persone' },
  { id: 'nonno', m: 'nonno', f: 'nonna', words: /^nonn[oa]$/, back: ['nipote'], between: 'persone' },
  { id: 'zio', m: 'zio', f: 'zia', words: /^zi[oa]$/, back: ['nipote'], between: 'persone' },
  { id: 'nipote', m: 'nipote', f: 'nipote', words: /^nipot(e|in[oa])$/, back: ['nonno', 'zio'], between: 'persone' },
  { id: 'cugino', m: 'cugino', f: 'cugina', words: /^cugin[oa]$/, back: ['cugino'], between: 'persone' },
  { id: 'cognato', m: 'cognato', f: 'cognata', words: /^cognat[oa]$/, back: ['cognato'], between: 'persone' },
  { id: 'suocero', m: 'suocero', f: 'suocera', words: /^suocer[oa]$/, back: ['genero'], between: 'persone' },
  { id: 'genero', m: 'genero', f: 'nuora', words: /^(genero|nuora)$/, back: ['suocero'], between: 'persone' },
  { id: 'maestro', m: 'maestro', f: 'maestra', words: /^(maestr[oa]|mentore)$/, back: ['apprendista'], between: 'persone' },
  { id: 'apprendista', m: 'apprendista', f: 'apprendista', words: /^(apprendista|garzone|allievo|allieva|discepol[oa])$/, back: ['maestro'], between: 'persone' },
  { id: 'padrone', m: 'padrone', f: 'padrona', words: /^padron[ea]$/, back: ['animale', 'servo'], between: 'padrone' },
  { id: 'servo', m: 'servo', f: 'serva', words: /^serv[oa]$/, back: ['padrone'], between: 'persone' },
  { id: 'animale', m: 'animale', f: 'animale', words: /^(animale|gatt[oa]|can[ei]|cagnolin[oa]|mici[oa])$/, back: ['padrone'], between: 'animale' },
  { id: 'amico', m: 'amico', f: 'amica', words: /^(amic[oa]|compagn[oa])$/, back: ['amico'], between: 'tutti' },
  { id: 'rivale', m: 'rivale', f: 'rivale', words: /^(rivale|nemic[oa])$/, back: ['rivale'], between: 'tutti' },
  { id: 'vicino', m: 'vicino', f: 'vicina', words: /^vicin[oa]$/, back: ['vicino'], between: 'tutti' },
  { id: 'collega', m: 'collega', f: 'collega', words: /^(collega|soci[oa])$/, back: ['collega'], between: 'persone' },
  { id: 'conoscente', m: 'conoscente', f: 'conoscente', words: /^conoscente$/, back: ['conoscente'], between: 'tutti' },
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
  return KIND.get('conoscente')!;
}

function allowed(k: Kind, a: Species, b: Species | undefined): boolean {
  switch (k.between) {
    case 'stessa': return !b || a === b;
    case 'persone': return a === 'persona' && (!b || b === 'persona');
    case 'tutti': return true;
    case 'padrone': return a === 'persona';
    case 'animale': return a === 'animale' && (!b || b === 'persona');
  }
}

/** What a relation can be between these two: family across species becomes ownership, the rest friendship. */
function fitKind(k: Kind, a: Species, b: Species | undefined): Kind {
  if (allowed(k, a, b)) return k;
  if (a === 'persona' && b === 'animale') return KIND.get('padrone')!;
  if (a === 'animale' && b === 'persona') return KIND.get('animale')!;
  return KIND.get('amico')!;
}

const wordOf = (k: Kind, g: Gender | undefined) => (g === 'femmina' ? k.f : g === 'maschio' ? k.m : k.n ?? k.m);

const backOf = (k: Kind, a: Species, b: Species) => KIND.get(k.back.find((id) => allowed(KIND.get(id)!, b, a)) ?? 'conoscente')!;

/** The other side of a relation: if Ada is Berta's mother, Berta is Ada's child (in Berta's gender). */
export function reverseRelation(legame: string, gender?: Gender, a: Species = 'persona', b: Species = a): string {
  return wordOf(backOf(fitKind(kindOf(legame), a, b), a, b), gender);
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
  persona: {
    femmina: ['Adelina', 'Brunella', 'Clelia', 'Dorotea', 'Elvira', 'Filomena', 'Giuditta', 'Irene', 'Lucrezia', 'Nives', 'Ornella', 'Petronilla', 'Quirina', 'Rosalba', 'Serafina', 'Teodora', 'Ursula', 'Violante', 'Zelinda', 'Albina', 'Benedetta', 'Costanza', 'Dafne', 'Ersilia', 'Fosca', 'Gisella', 'Ippolita', 'Letizia', 'Marianna', 'Noemi'],
    maschio: ['Adelmo', 'Baldo', 'Cosimo', 'Damiano', 'Ermanno', 'Fulvio', 'Gerardo', 'Ivo', 'Leandro', 'Manfredi', 'Nestore', 'Oreste', 'Pasquale', 'Quinto', 'Raniero', 'Settimio', 'Teobaldo', 'Umberto', 'Vitale', 'Zeno', 'Amedeo', 'Bonifacio', 'Clemente', 'Donato', 'Egidio', 'Folco', 'Gaspare', 'Lazzaro', 'Matteo', 'Ottavio'],
  },
  animale: {
    femmina: ['Briciola', 'Cannella', 'Fuliggine', 'Lucciola', 'Mora', 'Nocciola', 'Pepita', 'Stella', 'Zucca', 'Perla', 'Ruggine', 'Viola'],
    maschio: ['Baffo', 'Carbone', 'Fumo', 'Gomitolo', 'Lampo', 'Pepe', 'Tizzone', 'Bricco', 'Ciuffo', 'Pallino', 'Tobia', 'Zenzero'],
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
    const n = `${C[x % 14].toUpperCase()}${V[(x >> 4) % 5]}${C[(x >> 7) % 14]}${V[(x >> 11) % 5]}${['', 'l', 'n', 'r'][(x >> 14) % 4]}${genere === 'femmina' ? 'a' : 'o'}`;
    if (free(n)) return n;
  }
  return `${pool[h % pool.length]} ${taken.length}`;
}

const MALE_IN_A = /^(luca|andrea|elia|barnaba|nicola|mattia|tobia|enea|battista|geremia|isaia|giona|zaccaria|evangelista)$/;

/** A gender for someone who has none written: the name, the job, the words they are called by. */
export function guessGender(p: Pick<Person, 'nome' | 'mestiere' | 'famiglia'>): Gender {
  const first = nameWords(p.nome)[0] ?? '';
  if (MALE_IN_A.test(first)) return 'maschio';
  if (/a$/.test(first)) return 'femmina';
  if (/o$/.test(first)) return 'maschio';
  const job = (p.mestiere ?? '').toLowerCase().split(/\s+/)[0] ?? '';
  if (/(trice|essa|iera|aia|ina)$/.test(job)) return 'femmina';
  if (/(tore|iere|aio|ino|o)$/.test(job)) return 'maschio';
  let f = 0;
  let m = 0;
  for (const r of p.famiglia ?? []) {
    const w = r.legame.toLowerCase().split(/\s+/)[0];
    const k = kindOf(w);
    if (k.m === k.f) continue;
    if (w === k.f) f++;
    else if (w === k.m) m++;
  }
  return f > m ? 'femmina' : 'maschio';
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
  let persone: Person[] = people.persone.map((p) => ({ ...p, famiglia: (p.famiglia ?? []).map((r) => ({ ...r })) }));
  // Species and gender.
  for (const p of persone) {
    const sp = speciesOf(p.tipo) ?? p.specie ?? 'persona';
    if (p.specie !== sp) fixes.push(`${p.nome}: specie ${sp}`);
    p.specie = sp;
    if (p.genere !== 'maschio' && p.genere !== 'femmina') {
      p.genere = guessGender(p);
      fixes.push(`${p.nome}: genere ${p.genere}`);
    }
  }
  // Names: the first one keeps it.
  const taken: string[] = ['Viandante'];
  for (let i = 0; i < persone.length; i++) {
    const p = persone[i];
    if (taken.some((t) => similarNames(t, p.nome))) {
      const old = p.nome;
      const nuovo = freshName(p.specie!, p.genere!, [...taken, ...persone.map((x) => x.nome)], p.origine ?? old);
      renames.push([old, nuovo]);
      fixes.push(`${old} → ${nuovo}: nome troppo simile a un altro`);
      // An exact namesake: only their own record speaks of them (the others mean the first one).
      if (persone.some((x) => x !== p && x.nome === old)) persone[i] = renameDeep(p, old, nuovo);
      else persone = persone.map((x) => renameDeep(x, old, nuovo));
      persone[i].nome = nuovo;
    }
    taken.push(persone[i].nome);
  }
  const byName = new Map<string, Person>();
  for (const p of persone) if (!byName.has(p.nome.toLowerCase())) byName.set(p.nome.toLowerCase(), p);
  // Relations, as pairs: the first said is the truth, the other side follows.
  interface Edge { a: Person; b: Person; ab: Kind; ba?: Kind }
  const edges = new Map<string, Edge>();
  const own = new Map<Person, Array<Edge | Relation>>(persone.map((p) => [p, []]));
  const said = (p: Person, r: Relation, k: Kind, to: string) => {
    if (wordOf(k, p.genere) !== r.legame) fixes.push(`${p.nome}: ${r.legame} di ${to} → ${wordOf(k, p.genere)}`);
  };
  for (const p of persone) {
    for (const r of p.famiglia) {
      if (r.nome.toLowerCase() === 'viandante') {
        own.get(p)!.push(r);
        continue;
      }
      const q = byName.get(r.nome.toLowerCase());
      if (q === p) {
        fixes.push(`${p.nome}: legame con se stesso`);
        continue;
      }
      const k = fitKind(kindOf(r.legame), p.specie!, q?.specie);
      if (!q) {
        // Someone named, not met yet.
        if (own.get(p)!.some((x) => !('a' in x) && x.nome.toLowerCase() === r.nome.toLowerCase())) continue;
        said(p, r, k, r.nome);
        own.get(p)!.push({ nome: r.nome, legame: wordOf(k, p.genere) });
        continue;
      }
      const key = [p.nome, q.nome].sort().join('\u0000');
      const e = edges.get(key);
      if (!e) {
        const edge: Edge = { a: p, b: q, ab: k };
        edges.set(key, edge);
        own.get(p)!.push(edge);
        own.get(q)!.push(edge);
        said(p, r, k, q.nome);
      } else if (e.a === p || e.ba) {
        fixes.push(`${p.nome}: un secondo legame con ${q.nome}`);
      } else if (e.ab.back.includes(k.id) && allowed(k, p.specie!, q.specie)) {
        // The other side, said by the second one: kept if it agrees.
        e.ba = k;
        said(p, r, k, q.nome);
      } else {
        e.ba = backOf(e.ab, q.specie!, p.specie!);
        fixes.push(`${p.nome}: ${r.legame} di ${q.nome} non torna con ${wordOf(e.ab, q.genere)} di ${p.nome} → ${wordOf(e.ba, p.genere)}`);
      }
    }
  }
  for (const e of edges.values()) {
    if (e.ba) continue;
    e.ba = backOf(e.ab, e.a.specie!, e.b.specie!);
    fixes.push(`${e.b.nome}: manca ${wordOf(e.ba, e.b.genere)} di ${e.a.nome}`);
  }
  // An animal has one owner: the first.
  const owned = new Set<Person>();
  for (const e of edges.values()) {
    const animal = e.ab.id === 'padrone' && e.b.specie === 'animale' ? e.b : e.ba!.id === 'padrone' && e.a.specie === 'animale' ? e.a : undefined;
    if (!animal) continue;
    if (owned.has(animal)) {
      e.ab = e.ba = KIND.get('amico')!;
      fixes.push(`${animal.nome}: un solo padrone (${e.a === animal ? e.b.nome : e.a.nome} diventa amico)`);
    } else owned.add(animal);
  }
  // One father and one mother, one spouse, and spouses are not children of the same parent.
  const parents = new Map<Person, Person[]>();
  const spouse = new Map<Person, Person>();
  const parentsOf = (p: Person) => parents.get(p) ?? [];
  for (const e of edges.values()) {
    const [parent, child] = e.ab.id === 'genitore' ? [e.a, e.b] : e.ba!.id === 'genitore' ? [e.b, e.a] : [];
    let wrong = '';
    if (parent && child) {
      const s = spouse.get(child);
      if (parentsOf(child).some((x) => x.genere === parent.genere)) wrong = `${child.nome}: ha già ${parent.genere === 'femmina' ? 'una madre' : 'un padre'} (non ${parent.nome})`;
      else if (s && (s === parent || parentsOf(s).includes(parent))) wrong = `${child.nome}: ${parent.nome} è già genitore del suo coniuge`;
      else parents.set(child, [...parentsOf(child), parent]);
    } else if (e.ab.id === 'coniuge') {
      if (spouse.has(e.a) || spouse.has(e.b)) wrong = `${e.a.nome} e ${e.b.nome}: uno dei due è già sposato`;
      else if (parentsOf(e.a).some((x) => parentsOf(e.b).includes(x))) wrong = `${e.a.nome} e ${e.b.nome}: hanno un genitore in comune`;
      else spouse.set(e.a, e.b).set(e.b, e.a);
    }
    if (!wrong) continue;
    e.ab = e.ba = KIND.get('conoscente')!;
    fixes.push(`${wrong} → conoscenti`);
  }
  for (const p of persone) {
    p.famiglia = own.get(p)!.map((x) => ('a' in x ? { nome: x.a === p ? x.b.nome : x.a.nome, legame: wordOf(x.a === p ? x.ab : x.ba!, p.genere) } : x));
  }
  // An animal does what animals of its kind do, not a person's job.
  const words = (s: string) => s.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length >= 4);
  for (const p of persone) {
    if (p.specie !== 'animale') continue;
    const kin = persone.filter((x) => x !== p && x.tipo === p.tipo && x.specie === 'animale');
    const mine = words(p.mestiere ?? '');
    if (!kin.length || kin.some((x) => words(x.mestiere ?? '').some((w) => mine.includes(w)))) continue;
    const counts = new Map<string, number>();
    for (const x of kin) counts.set(x.mestiere, (counts.get(x.mestiere) ?? 0) + 1);
    const best = [...counts].sort((x, y) => y[1] - x[1])[0][0];
    fixes.push(`${p.nome}: ${p.mestiere} → ${best}`);
    p.mestiere = best;
  }
  // Named, not met: what they are to whoever named them.
  const attesi: People['attesi'] = [];
  for (const p of persone) {
    for (const r of p.famiglia) {
      if (r.nome.toLowerCase() === 'viandante' || byName.has(r.nome.toLowerCase()) || attesi.some((a) => a.nome.toLowerCase() === r.nome.toLowerCase())) continue;
      attesi.push({ nome: r.nome, legame: reverseRelation(r.legame, undefined, p.specie, p.specie), di: p.nome });
    }
  }
  return { people: { persone, attesi: attesi.slice(-60) }, fixes, renames };
}

/** The validator of the society: what is wrong in it (nothing, when it is coherent). */
export function checkSociety(people: People, speciesOf?: (tipo: string) => Species | undefined): string[] {
  return repairSociety(people, speciesOf).fixes;
}

/** Adds a person; the society is then made coherent (the other side of each relation, the awaited ones). */
export function addPerson(people: People, p: Person, speciesOf?: (tipo: string) => Species | undefined): People {
  const persone = [...people.persone.filter((x) => x.nome !== p.nome), p].slice(-200);
  return repairSociety({ persone, attesi: people.attesi }, speciesOf).people;
}

/** What the society looks like, for the Narrator creating someone new. */
export function societySummary(people: People, n = 16): string {
  const who = (p: Person) => (p.specie === 'animale' ? `animale${p.genere ? `, ${p.genere}` : ''}` : p.genere === 'femmina' ? 'donna' : p.genere === 'maschio' ? 'uomo' : '');
  const lines = people.persone.slice(-n).map((p) => `- ${p.nome}, ${p.mestiere}${who(p) ? ` — ${who(p)}` : ''}${p.luogo ? ` (${p.luogo})` : ''}${p.famiglia.length ? `; ${p.famiglia.map((r) => `${r.legame} di ${r.nome}`).join(', ')}` : ''}`);
  const waiting = people.attesi.slice(-10).map((a) => `- ${a.nome} (${a.legame} di ${a.di})`);
  return [lines.length ? `Persone già conosciute:\n${lines.join('\n')}` : 'Nessuno è stato ancora conosciuto.', waiting.length ? `Nominate ma mai incontrate (potresti essere una di loro, se il tipo è adatto):\n${waiting.join('\n')}` : ''].filter(Boolean).join('\n\n');
}

/** The part of the day, from the kernel's clock (same phase as daylight). */
export function dayPhase(time: number, daySeconds: number): DayPhase {
  const phase = (time / daySeconds + 0.12) % 1;
  // daylight peaks at 0.25; night is centred on 0.75.
  if (phase < 0.12 || phase >= 0.96) return 'mattina';
  if (phase < 0.42) return 'giorno';
  if (phase < 0.58) return 'sera';
  return 'notte';
}

/** A sensible routine when the Narrator gave none. */
export function defaultRoutine(job: string): RoutineStep[] {
  return [
    { quando: 'mattina', fa: 'si prepara per la giornata', dove: 'casa', azione: 'mangia' },
    { quando: 'giorno', fa: job ? `lavora come ${job}` : 'lavora', dove: 'lavoro', azione: inferActivity(job || 'lavora', 'lavoro') },
    { quando: 'sera', fa: 'chiacchiera in piazza', dove: 'piazza', azione: 'chiacchiera' },
    { quando: 'notte', fa: 'dorme', dove: 'casa', azione: 'dorme' },
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
