// The people of the world as a society: every individual has a job, a family, a home and a daily
// routine, and is related to the others. The registry lives in the universe (world/people.json): the
// Narrator reads it when it creates someone new, so new people fit among the old ones (a daughter of
// the miller, the blacksmith's rival). The kernel turns routines into places to go (sys.wander walks
// there) and lets related people greet each other when they meet. No model calls here.

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

export interface Person {
  nome: string;
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

const REVERSE: Array<[RegExp, string]> = [
  [/^(madre|padre|mamma|papà|genitore)$/, 'figlio'],
  [/^(figli[oa]|bambin[oa])$/, 'genitore'],
  [/^(fratello|sorella)$/, 'fratello'],
  [/^moglie$/, 'marito'],
  [/^marito$/, 'moglie'],
  [/^(nonn[oa])$/, 'nipote'],
  [/^(nipote)$/, 'nonno'],
  [/^(zi[oa])$/, 'nipote'],
  [/^(amic[oa])$/, 'amico'],
  [/^(rivale|nemic[oa])$/, 'rivale'],
  [/^(maestr[oa]|padron[ea])$/, 'apprendista'],
  [/^(apprendista|garzone|servo)$/, 'padrone'],
];

/** The other side of a relation: if Ada is Berta's mother, Berta is Ada's child. */
export function reverseRelation(legame: string): string {
  const l = legame.toLowerCase().trim();
  return REVERSE.find(([re]) => re.test(l))?.[1] ?? 'conoscente';
}

/** Adds a person, linking both sides of every relation with people already known. */
export function addPerson(people: People, p: Person): People {
  const persone = people.persone.filter((x) => x.nome !== p.nome);
  for (const rel of p.famiglia) {
    const other = persone.find((x) => x.nome.toLowerCase() === rel.nome.toLowerCase());
    if (other) {
      if (!other.famiglia.some((r) => r.nome === p.nome)) other.famiglia.push({ nome: p.nome, legame: reverseRelation(rel.legame) });
    }
  }
  const met = new Set([...persone.map((x) => x.nome.toLowerCase()), p.nome.toLowerCase()]);
  const attesi = [
    ...people.attesi.filter((a) => a.nome.toLowerCase() !== p.nome.toLowerCase()),
    ...p.famiglia.filter((r) => !met.has(r.nome.toLowerCase())).map((r) => ({ nome: r.nome, legame: r.legame, di: p.nome })),
  ].filter((a, i, all) => all.findIndex((b) => b.nome === a.nome) === i);
  return { persone: [...persone, p].slice(-200), attesi: attesi.slice(-60) };
}

/** What the society looks like, for the Narrator creating someone new. */
export function societySummary(people: People, n = 16): string {
  const lines = people.persone.slice(-n).map((p) => `- ${p.nome}, ${p.mestiere}${p.luogo ? ` (${p.luogo})` : ''}${p.famiglia.length ? `; ${p.famiglia.map((r) => `${r.legame} di ${r.nome}`).join(', ')}` : ''}`);
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
