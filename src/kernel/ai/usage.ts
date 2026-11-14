// The usage ledger: what every call to a model cost, per day, model and task, in tokens and dollars.
// GeminiAiModels reports each call (onCall); the kernel keeps the ledger and saves it in the universe
// (world/usage.json) with every commit, so the spending of every session stays with the world it made.
// Google's own usage page lags hours behind: this one is right after every call. Every call also has a payer
// (`chi`, T36): the wanderer it was made for, or `comune` when the whole world asked for it.

import { costOf, priceOf, PRICES_READ_ON, type Tokens } from './prices';
import { internalFields, internalSoloIn } from '../internalNames';

/** One call as the model layer saw it. */
export interface CallRecord {
  model: string;
  agent: string;
  task: string;
  prompt: number;
  /** Of the prompt, the tokens served from the cache. */
  cached: number;
  output: number;
  /** Reasoning tokens, billed as output. */
  thoughts: number;
  /**
   * The write of an explicit cache (T351, task `cache.write`): its tokens times the hours Google keeps them, paid with the write at the
   * storage price; the tokens themselves are in `prompt`.
   */
  stored?: number;
  /** Retries after 429 or a server error (the failed tries are not billed). */
  retries?: number;
  /** The call never got an answer: a timeout or a network error. It may still have been billed. */
  failed?: 'timeout' | 'errore';
  /** ISO day; default today. */
  day?: string;
  /** Who pays (T36): a wanderer's id, or `comune` (also when missing). */
  who?: string;
}

export interface Tally {
  calls: number;
  prompt: number;
  cached: number;
  output: number;
  thoughts: number;
  /** Token-hours of explicit caches written (T351). */
  stored: number;
  usd: number;
  retries: number;
  timeouts: number;
  failures: number;
  /** Calls whose model has no price at all: their dollars are missing from usd. */
  unpriced: number;
}

export const emptyTally = (): Tally => ({ calls: 0, prompt: 0, cached: 0, output: 0, thoughts: 0, stored: 0, usd: 0, retries: 0, timeouts: 0, failures: 0, unpriced: 0 });

/** world/usage.json */
export interface UsageFile {
  /** When the prices used for the dollars were read. */
  prices: string;
  /** day → model → task → tally */
  days: Record<string, Record<string, Record<string, Tally>>>;
  /** day → payer (a wanderer's id or `comune`) → tally (T36). */
  payers?: Record<string, Record<string, Tally>>;
  /**
   * day → who asked (a wanderer other than the master, or `comune`) → what the master was charged for them, in a match where the master
   * pays (T372, ADR-0188): the master's wallet says it, and a player's own spending is what is left of theirs. Absent where nobody paid for another.
   */
  masterPaid?: Record<string, Record<string, Tally>>;
}

export const USAGE_FILE = 'world/usage.json';
/** The tokens of a call as the prices read them: the storage of an explicit cache too (T351). */
export const tokensOf = (r: CallRecord): Tokens => ({ prompt: r.prompt, cached: r.cached, output: r.output, thoughts: r.thoughts, ...(r.stored ? { stored: r.stored } : {}) });

/** The payer of a call nobody in particular asked for (as COMUNE in cards.ts, which this layer does not import). */
const COMMON = 'comune';

const today = () => new Date().toISOString().slice(0, 10);

function add(t: Tally, r: CallRecord, usd: number | undefined): void {
  t.calls++;
  t.prompt += r.prompt;
  t.cached += r.cached;
  t.output += r.output;
  t.thoughts += r.thoughts;
  t.stored += r.stored ?? 0;
  t.retries += r.retries ?? 0;
  if (r.failed === 'timeout') t.timeouts++;
  if (r.failed) t.failures++;
  if (usd === undefined) t.unpriced++;
  else t.usd += usd;
}

function sum(into: Tally, t: Tally): Tally {
  for (const k of Object.keys(into) as Array<keyof Tally>) into[k] += t[k] ?? 0;
  return into;
}

export class UsageLog {
  private file: UsageFile & { payers: Record<string, Record<string, Tally>>; masterPaid: Record<string, Record<string, Tally>> } = { prices: PRICES_READ_ON, days: {}, payers: {}, masterPaid: {} };
  /** This session only (since the page opened). */
  readonly session = emptyTally();
  readonly sessionByModel: Record<string, Tally> = {};
  /** This session by agent (the file keeps models and tasks only), and each agent's last call (the Direction's screens, T46b). */
  readonly sessionByAgent: Record<string, Tally> = {};
  readonly lastCall: Record<string, { model: string; task: string; time: number }> = {};
  /** This session by payer (T36). */
  readonly sessionByPayer: Record<string, Tally> = {};
  /** Bumped at every call: the kernel writes the file when it changed. */
  version = 0;
  onChange?: () => void;

  /** Merges what an earlier session saved (the file is the history; this session adds to it). */
  load(json: string | undefined): void {
    if (!json) return;
    try {
      // A file of the contract 0.3 (`giorni`, `paganti`, the payer `io`) reads internal (T308a).
      const f = internalSoloIn(internalFields('usage', JSON.parse(json))) as Partial<UsageFile>;
      for (const [day, models] of Object.entries(f.days ?? {}))
        for (const [model, tasks] of Object.entries(models ?? {}))
          for (const [task, t] of Object.entries(tasks ?? {})) {
            const slot = (((this.file.days[day] ??= {})[model] ??= {})[task] ??= emptyTally());
            sum(slot, { ...emptyTally(), ...t });
          }
      for (const [day, payers] of Object.entries(f.payers ?? {}))
        for (const [chi, t] of Object.entries(payers ?? {})) sum(((this.file.payers[day] ??= {})[chi] ??= emptyTally()), { ...emptyTally(), ...t });
      for (const [day, askers] of Object.entries(f.masterPaid ?? {}))
        for (const [chi, t] of Object.entries(askers ?? {})) sum(((this.file.masterPaid[day] ??= {})[chi] ??= emptyTally()), { ...emptyTally(), ...t });
    } catch {
      /* a broken file is replaced by this session's */
    }
  }

  record(r: CallRecord): void {
    const day = r.day ?? today();
    const usd = costOf(r.model, tokensOf(r), day);
    add(((this.file.days[day] ??= {})[r.model] ??= {})[r.task] ??= emptyTally(), r, usd);
    add(this.session, r, usd);
    add((this.sessionByModel[r.model] ??= emptyTally()), r, usd);
    add((this.sessionByAgent[r.agent] ??= emptyTally()), r, usd);
    const chi = r.who || COMMON;
    add(((this.file.payers[day] ??= {})[chi] ??= emptyTally()), r, usd);
    add((this.sessionByPayer[chi] ??= emptyTally()), r, usd);
    this.lastCall[r.agent] = { model: r.model, task: r.task, time: Date.now() };
    this.version++;
    this.onChange?.();
  }

  /**
   * A call the master was charged for, asked by someone else (T372, ADR-0188): `record` already counted it for who asked; this says who
   * paid it instead, at the same price.
   */
  paidByMaster(r: CallRecord): void {
    const day = r.day ?? today();
    add(((this.file.masterPaid[day] ??= {})[r.who || COMMON] ??= emptyTally()), r, costOf(r.model, tokensOf(r), day));
    this.version++;
    this.onChange?.();
  }

  /** What the master paid for each of the others: on a day, or (without one) on every day (T372). */
  paidForOthers(day?: string): Record<string, Tally> {
    const out: Record<string, Tally> = {};
    for (const d of day ? [day] : Object.keys(this.file.masterPaid)) for (const [chi, t] of Object.entries(this.file.masterPaid[d] ?? {})) sum((out[chi] ??= emptyTally()), t);
    return out;
  }

  /** A day's total (default today), and per model. */
  day(day = today()): { total: Tally; byModel: Record<string, Tally> } {
    const total = emptyTally();
    const byModel: Record<string, Tally> = {};
    for (const [model, tasks] of Object.entries(this.file.days[day] ?? {})) {
      const m = (byModel[model] = emptyTally());
      for (const t of Object.values(tasks)) sum(m, t);
      sum(total, m);
    }
    return { total, byModel };
  }

  /** Every day, every model. */
  total(): Tally {
    const t = emptyTally();
    for (const day of Object.keys(this.file.days)) sum(t, this.day(day).total);
    return t;
  }

  /** What each payer spent: on a day, or (without one) on every day. */
  payers(day?: string): Record<string, Tally> {
    const out: Record<string, Tally> = {};
    for (const d of day ? [day] : Object.keys(this.file.payers)) for (const [chi, t] of Object.entries(this.file.payers[d] ?? {})) sum((out[chi] ??= emptyTally()), t);
    return out;
  }

  /** The most expensive tasks of a day. */
  tasks(day = today()): Array<{ model: string; task: string; tally: Tally }> {
    const out: Array<{ model: string; task: string; tally: Tally }> = [];
    for (const [model, tasks] of Object.entries(this.file.days[day] ?? {})) for (const [task, tally] of Object.entries(tasks)) out.push({ model, task, tally });
    return out.sort((a, b) => b.tally.usd - a.tally.usd);
  }

  toJson(): string {
    const round = (t: Tally): Tally => ({ ...t, usd: Math.round(t.usd * 1e6) / 1e6 });
    const giorni: UsageFile['days'] = {};
    for (const day of Object.keys(this.file.days).sort())
      for (const [model, tasks] of Object.entries(this.file.days[day]))
        for (const [task, t] of Object.entries(tasks)) ((giorni[day] ??= {})[model] ??= {})[task] = round(t);
    const paganti: NonNullable<UsageFile['payers']> = {};
    for (const day of Object.keys(this.file.payers).sort())
      for (const chi of Object.keys(this.file.payers[day]).sort()) (paganti[day] ??= {})[chi] = round(this.file.payers[day][chi]);
    const masterPaid: NonNullable<UsageFile['masterPaid']> = {};
    for (const day of Object.keys(this.file.masterPaid).sort())
      for (const chi of Object.keys(this.file.masterPaid[day]).sort()) (masterPaid[day] ??= {})[chi] = round(this.file.masterPaid[day][chi]);
    // Only where the master paid for someone (T372): every other universe's file stays as it was.
    return JSON.stringify({ prices: PRICES_READ_ON, days: giorni, payers: paganti, ...(Object.keys(masterPaid).length ? { masterPaid } : {}) } satisfies UsageFile, null, 1) + '\n';
  }
}

/** "$0.0123" (four decimals under a cent), "$1.23". */
export const usd = (v: number | undefined) => (v === undefined ? 'n.d.' : v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`);

/** One line for a panel: calls, tokens and dollars. */
export function tallyLine(t: Tally): string {
  const k = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}k` : String(n));
  return `${t.calls} chiamate · ${usd(t.usd)}${t.unpriced ? ` (+${t.unpriced} senza prezzo)` : ''} · input ${k(t.prompt)}${t.cached ? ` (cache ${k(t.cached)})` : ''} · risposta ${k(t.output)} · ragionamento ${k(t.thoughts)}${t.stored ? ` · cache esplicita ${k(Math.round(t.stored))} token·ora` : ''}${t.timeouts ? ` · ${t.timeouts} scadute` : ''}${t.retries ? ` · ${t.retries} ripetute` : ''}`;
}

/** Whether a model has a price (estimated or published) on a day. */
export const priced = (model: string, day?: string) => !!priceOf(model, day);
