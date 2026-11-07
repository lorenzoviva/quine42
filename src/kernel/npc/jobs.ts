// The programs of the trades (T245b, ADR-0140; docs/design/comportamento-npc.md, section 1): how the day of a trade is made, as data of
// the universe (a `data` module with `mestieri`), written once per trade and used by everyone who has it. The tasks are a closed list
// of behaviours, carried out by the Lua system `sys.work` of the seed; a program never holds code. Pure: the validator, the kernel and
// the tests import it.

import { ACTIVITIES, type Activity } from './society';
import type { DayPhase } from './society';
import { internalFields } from '../internalNames';

/** The seed's system that carries out the trades (T307b: `sys.lavoro` before); its store holds the deposits of the places. */
export const WORK_MODULE = 'sys.work';

/** The behaviours, a closed list: what a task may do (`fa`). */
export const JOB_BEHAVIOURS = ['go', 'take', 'carry', 'transform', 'gather', 'produce', 'use', 'build', 'patrol', 'rest', 'eat', 'pray', 'chat', 'wait'] as const;
export type JobBehaviour = (typeof JOB_BEHAVIOURS)[number];

export const JOB_PHASES: readonly DayPhase[] = ['morning', 'day', 'evening', 'night'];
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
  does: JobBehaviour;
  /** Where: `home | work | square | venture | tile:<codice> | entity:<tag>` (`casella:`, `entita:` until the contract 0.4). */
  where?: string;
  /** A tile: what it is before and after (`transform`), what is gathered and what it leaves (`gather`). */
  from?: string;
  to?: string;
  tile?: string;
  drop?: string;
  /** An item: what is gathered, carried, made; what is used up (`con`). */
  item?: string;
  with?: string;
  /** How many: tiles changed, things made. */
  count?: number;
  /** Seconds of work for each. */
  duration?: number;
  /** The pose while working: one of the activities. */
  pose?: Activity;
  /** What they say starting it, once. */
  says?: string;
  /** `patrol`: the places of the round. */
  route?: string[];
  /** `use`: which action of the thing (an `id` of its manifest's `actions`); without, the first that has no effects. */
  action?: string;
}

export interface JobProgram {
  id: string;
  /** The words of `mestiere` that take this program. */
  names: string[];
  /** Where the work is: the tile of the place they work at. */
  workplace?: { tile?: string; entity?: string };
  day: Record<DayPhase, JobTask[]>;
  /** What the module that holds it is: for the log. */
  module?: string;
}

/** What a program may refer to: the tiles of the universe, its items, the tags of its modules. */
export interface JobWorld {
  codes: ReadonlySet<string>;
  items: ReadonlySet<string>;
  tags?: ReadonlySet<string>;
}

const WHERE_RE = /^(home|work|square|venture)$|^(tile|entity):(.+)$/;

/** A text of the world, short. */
const text = (v: unknown, n: number): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined);

/**
 * A program as the data say it, checked by reference as the plans of the places are (rule 2): every tile a code of the universe, every
 * item in the registry, every place one of those known. What is not right is a reason, and the program does not run.
 */
export function validateJobProgram(raw: unknown, world: JobWorld): { program?: JobProgram; errors: string[] } {
  const errors: string[] = [];
  // A program with the fields and the places of the contract 0.3 (`giornata`, `casella:m`) reads internal (T308a).
  const r = internalFields('job', (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>);
  const id = text(r.id, 40);
  if (!id || !/^[a-z0-9-]+$/.test(id)) errors.push('id mancante o non semplice');
  const nomi = Array.isArray(r.names) ? r.names.map((n) => text(n, 40)?.toLowerCase()).filter((n): n is string => !!n) : [];
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
    if (!m) return void errors.push(`${id}: «${String(d)}» non è un posto (home, work, square, venture, tile:…, entity:…)`);
    if (m[2] === 'tile') code(m[3], 'il posto');
    // A tag no module has is not an error: a universe may have rewritten the module that had it. At work that task finds nothing and is skipped.
    return d as string;
  };
  const posto = r.workplace && typeof r.workplace === 'object' ? (r.workplace as Record<string, unknown>) : undefined;
  if (posto?.tile !== undefined) code(posto.tile, 'il posto di lavoro');
  const giornata = {} as Record<DayPhase, JobTask[]>;
  const day = (r.day && typeof r.day === 'object' ? r.day : {}) as Record<string, unknown>;
  for (const phase of JOB_PHASES) {
    const list = Array.isArray(day[phase]) ? (day[phase] as unknown[]) : [];
    if (list.length > MAX_TASKS) errors.push(`${id}: ${phase} ha più di ${MAX_TASKS} compiti`);
    giornata[phase] = list.slice(0, MAX_TASKS).map((t, i) => {
      const o = (t && typeof t === 'object' ? t : {}) as Record<string, unknown>;
      const at = `${id}, ${phase} ${i + 1}`;
      const fa = o.does as JobBehaviour;
      if (!JOB_BEHAVIOURS.includes(fa)) errors.push(`${at}: «${String(o.does)}» non è un comportamento (${JOB_BEHAVIOURS.join(', ')})`);
      const task: JobTask = { does: fa };
      if (o.duration !== undefined) {
        const d = Number(o.duration);
        if (!Number.isFinite(d) || d < MIN_DURATION || d > MAX_DURATION) errors.push(`${at}: durata fuori da ${MIN_DURATION}-${MAX_DURATION} secondi`);
        task.duration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, d || MIN_DURATION));
      }
      if (o.count !== undefined) task.count = Math.max(1, Math.min(MAX_REPEAT, Math.round(Number(o.count)) || 1));
      if (o.pose !== undefined) {
        if (!ACTIVITIES.includes(o.pose as Activity)) errors.push(`${at}: la posa «${String(o.pose)}» non è un'attività`);
        else task.pose = o.pose as Activity;
      }
      const said = text(o.says, 80);
      if (said) task.says = said;
      switch (fa) {
        case 'go':
          task.where = where(o.where);
          break;
        case 'transform':
          task.from = code(o.from, 'la casella di partenza');
          task.to = code(o.to, 'la casella che diventa');
          if (o.with !== undefined) task.with = item(o.with, 'ciò che consuma');
          break;
        case 'gather':
          task.tile = code(o.tile, 'la casella');
          task.drop = code(o.drop ?? o.tile, 'ciò che lascia');
          task.item = item(o.item, 'il raccolto');
          break;
        case 'carry':
        case 'take':
          task.item = item(o.item, 'ciò che porta');
          if (o.to !== undefined || o.where !== undefined) task.where = where(o.to ?? o.where);
          break;
        case 'produce':
          task.item = item(o.item, 'ciò che produce');
          if (o.with !== undefined) task.with = item(o.with, 'ciò che consuma');
          if (o.where !== undefined) task.where = where(o.where);
          break;
        case 'use': {
          task.where = where(o.where ?? (typeof o.entity === 'string' ? `entity:${o.entity}` : undefined));
          if (task.where && !task.where.startsWith('entity:')) errors.push(`${at}: si usa una cosa, «entity:<tag>»`);
          const act = text(o.action, 40);
          if (act) task.action = act;
          break;
        }
        case 'patrol': {
          const round = Array.isArray(o.route) ? o.route : [];
          if (round.length < 2) errors.push(`${at}: un giro ha almeno due posti`);
          task.route = round.slice(0, 6).map((d) => where(d)).filter((d): d is string => !!d);
          break;
        }
        default:
          break;
      }
      return task;
    });
  }
  if (errors.length) return { errors };
  const program: JobProgram = { id: id!, names: [...new Set(nomi)], day: giornata };
  if (posto?.tile) program.workplace = { tile: String(posto.tile) };
  else if (typeof posto?.entity === 'string') program.workplace = { entity: posto.entity };
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
  const whole = programs.find((p) => p.names.includes(t));
  if (whole) return whole;
  const words = new Set(t.split(/[^a-zàèéìòù]+/).filter(Boolean));
  return programs.find((p) => p.names.some((n) => words.has(n)));
}

/**
 * What a trade brings to the deposit of its place in a day (T245f, ADR-0149): the things it gathers or makes and then carries there
 * (`carry` to its place, not into a thing), and what making them uses up. The accounting of the places nobody sees counts with this.
 */
export function dailyProduce(p: JobProgram): { gathered: Record<string, number>; made: Array<{ oggetto: string; con?: string; quante: number }> } {
  const tasks = JOB_PHASES.flatMap((f) => p.day[f] ?? []);
  const delivered = new Set(tasks.flatMap((t) => (t.does === 'carry' && t.item && !t.where?.startsWith('entity:') ? [t.item] : [])));
  const gathered: Record<string, number> = {};
  const made: Array<{ oggetto: string; con?: string; quante: number }> = [];
  for (const t of tasks) {
    if (!t.item || !delivered.has(t.item)) continue;
    const n = t.count ?? 1;
    if (t.does === 'gather') gathered[t.item] = (gathered[t.item] ?? 0) + n;
    else if (t.does === 'produce') made.push({ oggetto: t.item, ...(t.with ? { con: t.with } : {}), quante: n });
  }
  return { gathered, made };
}
