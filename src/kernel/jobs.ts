// The programs of the trades (T245b, ADR-0140; docs/design/comportamento-npc.md, section 1): how the day of a trade is made, as data of
// the universe (a `data` module with `mestieri`), written once per trade and used by everyone who has it. The tasks are a closed list
// of behaviours, carried out by the Lua system `sys.lavoro` of the seed; a program never holds code. Pure: the validator, the kernel and
// the tests import it.

import { ACTIVITIES, type Activity } from './society';
import type { DayPhase } from './society';

/** The behaviours, a closed list: what a task may do (`fa`). */
export const JOB_BEHAVIOURS = ['vai', 'prendi', 'porta', 'trasforma', 'raccogli', 'produci', 'usa', 'costruisci', 'pattuglia', 'riposa', 'mangia', 'prega', 'chiacchiera', 'aspetta'] as const;
export type JobBehaviour = (typeof JOB_BEHAVIOURS)[number];

export const JOB_PHASES: readonly DayPhase[] = ['mattina', 'giorno', 'sera', 'notte'];
/** At most this many tasks a phase, and a task's work within these seconds of the world. */
export const MAX_TASKS = 6;
export const MIN_DURATION = 5;
export const MAX_DURATION = 300;
/** At most this many tiles a task changes before the next one. */
export const MAX_REPEAT = 12;
/** Individuals at work in one loaded place: the others live as before (the tick's budget). */
export const WORKERS_PER_PLACE = 12;

/** One task of a phase: what it does and with what. Only the fields its behaviour reads matter; the others are dropped. */
export interface JobTask {
  fa: JobBehaviour;
  /** Where: `casa | lavoro | piazza | casella:<codice> | entita:<tag>`. */
  dove?: string;
  /** A tile: what it is before and after (`trasforma`), what is gathered and what it leaves (`raccogli`). */
  da?: string;
  a?: string;
  casella?: string;
  lascia?: string;
  /** An item: what is gathered, carried, made; what is used up (`con`). */
  oggetto?: string;
  con?: string;
  /** How many: tiles changed, things made. */
  quante?: number;
  /** Seconds of work for each. */
  durata?: number;
  /** The pose while working: one of the activities. */
  posa?: Activity;
  /** What they say starting it, once. */
  dice?: string;
  /** `pattuglia`: the places of the round. */
  percorso?: string[];
  /** `usa`: which action of the thing (an `id` of its manifest's `actions`); without, the first that has no effects. */
  azione?: string;
}

export interface JobProgram {
  id: string;
  /** The words of `mestiere` that take this program. */
  nomi: string[];
  /** Where the work is: the tile of the place they work at. */
  posto?: { casella?: string; entita?: string };
  giornata: Record<DayPhase, JobTask[]>;
  /** What the module that holds it is: for the log. */
  modulo?: string;
}

/** What a program may refer to: the tiles of the universe, its items, the tags of its modules. */
export interface JobWorld {
  codes: ReadonlySet<string>;
  items: ReadonlySet<string>;
  tags?: ReadonlySet<string>;
}

const WHERE_RE = /^(casa|lavoro|piazza|impresa)$|^(casella|entita):(.+)$/;

/** A text of the world, short. */
const text = (v: unknown, n: number): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined);

/**
 * A program as the data say it, checked by reference as the plans of the places are (rule 2): every tile a code of the universe, every
 * item in the registry, every place one of those known. What is not right is a reason, and the program does not run.
 */
export function validateJobProgram(raw: unknown, world: JobWorld): { program?: JobProgram; errors: string[] } {
  const errors: string[] = [];
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const id = text(r.id, 40);
  if (!id || !/^[a-z0-9-]+$/.test(id)) errors.push('id mancante o non semplice');
  const nomi = Array.isArray(r.nomi) ? r.nomi.map((n) => text(n, 40)?.toLowerCase()).filter((n): n is string => !!n) : [];
  if (!nomi.length) errors.push(`${id ?? '?'}: nessun nome`);
  const code = (c: unknown, what: string) => {
    if (typeof c !== 'string' || !world.codes.has(c)) errors.push(`${id}: ${what} «${String(c)}» non è un terreno dell'universo`);
    return typeof c === 'string' ? c : undefined;
  };
  const item = (i: unknown, what: string) => {
    if (typeof i !== 'string' || !world.items.has(i)) errors.push(`${id}: ${what} «${String(i)}» non è un oggetto del registro`);
    return typeof i === 'string' ? i : undefined;
  };
  const where = (d: unknown) => {
    const m = typeof d === 'string' ? WHERE_RE.exec(d) : null;
    if (!m) return void errors.push(`${id}: «${String(d)}» non è un posto (casa, lavoro, piazza, casella:…, entita:…)`);
    if (m[2] === 'casella') code(m[3], 'il posto');
    // A tag no module has is not an error: a universe may have rewritten the module that had it. At work that task finds nothing and is skipped.
    return d as string;
  };
  const posto = r.posto && typeof r.posto === 'object' ? (r.posto as Record<string, unknown>) : undefined;
  if (posto?.casella !== undefined) code(posto.casella, 'il posto di lavoro');
  const giornata = {} as Record<DayPhase, JobTask[]>;
  const day = (r.giornata && typeof r.giornata === 'object' ? r.giornata : {}) as Record<string, unknown>;
  for (const phase of JOB_PHASES) {
    const list = Array.isArray(day[phase]) ? (day[phase] as unknown[]) : [];
    if (list.length > MAX_TASKS) errors.push(`${id}: ${phase} ha più di ${MAX_TASKS} compiti`);
    giornata[phase] = list.slice(0, MAX_TASKS).map((t, i) => {
      const o = (t && typeof t === 'object' ? t : {}) as Record<string, unknown>;
      const at = `${id}, ${phase} ${i + 1}`;
      const fa = o.fa as JobBehaviour;
      if (!JOB_BEHAVIOURS.includes(fa)) errors.push(`${at}: «${String(o.fa)}» non è un comportamento (${JOB_BEHAVIOURS.join(', ')})`);
      const task: JobTask = { fa };
      if (o.durata !== undefined) {
        const d = Number(o.durata);
        if (!Number.isFinite(d) || d < MIN_DURATION || d > MAX_DURATION) errors.push(`${at}: durata fuori da ${MIN_DURATION}-${MAX_DURATION} secondi`);
        task.durata = Math.max(MIN_DURATION, Math.min(MAX_DURATION, d || MIN_DURATION));
      }
      if (o.quante !== undefined) task.quante = Math.max(1, Math.min(MAX_REPEAT, Math.round(Number(o.quante)) || 1));
      if (o.posa !== undefined) {
        if (!ACTIVITIES.includes(o.posa as Activity)) errors.push(`${at}: la posa «${String(o.posa)}» non è un'attività`);
        else task.posa = o.posa as Activity;
      }
      const said = text(o.dice, 80);
      if (said) task.dice = said;
      switch (fa) {
        case 'vai':
          task.dove = where(o.dove);
          break;
        case 'trasforma':
          task.da = code(o.da, 'la casella di partenza');
          task.a = code(o.a, 'la casella che diventa');
          if (o.con !== undefined) task.con = item(o.con, 'ciò che consuma');
          break;
        case 'raccogli':
          task.casella = code(o.casella, 'la casella');
          task.lascia = code(o.lascia ?? o.casella, 'ciò che lascia');
          task.oggetto = item(o.oggetto, 'il raccolto');
          break;
        case 'porta':
        case 'prendi':
          task.oggetto = item(o.oggetto, 'ciò che porta');
          if (o.a !== undefined || o.dove !== undefined) task.dove = where(o.a ?? o.dove);
          break;
        case 'produci':
          task.oggetto = item(o.oggetto, 'ciò che produce');
          if (o.con !== undefined) task.con = item(o.con, 'ciò che consuma');
          if (o.dove !== undefined) task.dove = where(o.dove);
          break;
        case 'usa': {
          task.dove = where(o.dove ?? (typeof o.entita === 'string' ? `entita:${o.entita}` : undefined));
          if (task.dove && !task.dove.startsWith('entita:')) errors.push(`${at}: si usa una cosa, «entita:<tag>»`);
          const act = text(o.azione, 40);
          if (act) task.azione = act;
          break;
        }
        case 'pattuglia': {
          const round = Array.isArray(o.percorso) ? o.percorso : [];
          if (round.length < 2) errors.push(`${at}: un giro ha almeno due posti`);
          task.percorso = round.slice(0, 6).map((d) => where(d)).filter((d): d is string => !!d);
          break;
        }
        default:
          break;
      }
      return task;
    });
  }
  if (errors.length) return { errors };
  const program: JobProgram = { id: id!, nomi: [...new Set(nomi)], giornata };
  if (posto?.casella) program.posto = { casella: String(posto.casella) };
  else if (typeof posto?.entita === 'string') program.posto = { entita: posto.entita };
  return { program, errors };
}

/** A trade as the people say it: lower case, without articles and what follows a comma or «del», «della»… */
export function normalTrade(mestiere: string): string {
  return mestiere
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/\b(il|lo|la|i|gli|le|l|un|uno|una)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The program of a trade (T245b): first a name of `nomi` as the whole trade, then a name as one of its words («contadino del Rovo»),
 * else none: that individual lives as before. Always the same answer for the same trade and the same programs.
 */
export function matchJob(mestiere: string | undefined, programs: readonly JobProgram[]): JobProgram | undefined {
  if (!mestiere) return undefined;
  const t = normalTrade(mestiere);
  if (!t) return undefined;
  const whole = programs.find((p) => p.nomi.includes(t));
  if (whole) return whole;
  const words = new Set(t.split(/[^a-zàèéìòù]+/).filter(Boolean));
  return programs.find((p) => p.nomi.some((n) => words.has(n)));
}

/**
 * What a trade brings to the deposit of its place in a day (T245f, ADR-0144): the things it gathers or makes and then carries there
 * (`porta` to its place, not into a thing), and what making them uses up. The accounting of the places nobody sees counts with this.
 */
export function dailyProduce(p: JobProgram): { gathered: Record<string, number>; made: Array<{ oggetto: string; con?: string; quante: number }> } {
  const tasks = JOB_PHASES.flatMap((f) => p.giornata[f] ?? []);
  const delivered = new Set(tasks.flatMap((t) => (t.fa === 'porta' && t.oggetto && !t.dove?.startsWith('entita:') ? [t.oggetto] : [])));
  const gathered: Record<string, number> = {};
  const made: Array<{ oggetto: string; con?: string; quante: number }> = [];
  for (const t of tasks) {
    if (!t.oggetto || !delivered.has(t.oggetto)) continue;
    const n = t.quante ?? 1;
    if (t.fa === 'raccogli') gathered[t.oggetto] = (gathered[t.oggetto] ?? 0) + n;
    else if (t.fa === 'produci') made.push({ oggetto: t.oggetto, ...(t.con ? { con: t.con } : {}), quante: n });
  }
  return { gathered, made };
}
