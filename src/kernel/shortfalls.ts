// What the Council could not do (T238, ADR-0130): every request that ends badly, whoever asked it, is one entry of a ledger that
// counts how often it happened. It is the list Phase III starts from, so it outlives rollbacks, as the usage does. It stays on the
// server: nothing in the world reads it and `src/session/files.ts` does not name it. The text comes from players and from the
// models, so it is cut down and flattened here. Pure and light: the report command imports it, without the kernel.

export const SHORTFALLS_FILE = 'world/shortfalls.json';
import { internalFields, internalName, internalSoloIn } from './internalNames';

/**
 * How it ended: the Council said no (`refusal`); it said yes, but the validator refused its last attempt or dropped what it
 * proposed (`invalid`); the model gave no usable answer (`error`); generated code that fails and the Engineer did not repair (`fault`).
 */
export type ShortfallOutcome = 'refusal' | 'invalid' | 'error' | 'fault';
const OUTCOMES: readonly string[] = ['refusal', 'invalid', 'error', 'fault'] satisfies ShortfallOutcome[];

export interface ShortfallNote {
  request: string;
  /** Who asked: a wanderer's id, or `comune` when it was the world's own need. */
  who: string;
  agent: string;
  /** The task of the model (`forge.concept`, `action.judge`). */
  task: string;
  outcome: ShortfallOutcome;
  reason: string;
}

/** One entry of world/shortfalls.json. */
export interface Shortfall extends Omit<ShortfallNote, 'who'> {
  /** Everyone who asked, each once. */
  who: string[];
  times: number;
  /** ISO days. */
  first: string;
  last: string;
}

const MAX_ENTRIES = 500;
const MAX_ASKERS = 12;
const MAX_REQUEST = 200;
const MAX_REASON = 300;
const MAX_WORD = 64;

/** One line of plain text, at most `max` characters. */
function flat(text: unknown, max: number): string {
  return String(text ?? '').replace(/[\s\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
}

const keyOf = (s: Pick<ShortfallNote, 'agent' | 'task' | 'request'>) => `${s.agent}|${s.task}|${s.request.toLowerCase()}`;

const today = () => new Date().toISOString().slice(0, 10);

/** An entry as read from the file, or undefined if it is not one: the file may have been edited by hand. */
function readEntry(raw: unknown): Shortfall | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  // The fields of the contract 0.3 (`richiesta`, `volte`) and its wanderer alone (`io`) read internal (T308a): the tools read the disk.
  const e = internalSoloIn(internalFields('shortfall', raw as Record<string, unknown>)) as Record<string, unknown>;
  const richiesta = flat(e.request, MAX_REQUEST);
  // An outcome of the contract 0.2 (`rifiuto`) reads internal (T307b).
  const esito = typeof e.outcome === 'string' ? internalName('partita', e.outcome) : e.outcome;
  if (!richiesta || !OUTCOMES.includes(esito as string)) return undefined;
  const volte = Number.isSafeInteger(e.times) && (e.times as number) > 0 ? (e.times as number) : 1;
  const chi = (Array.isArray(e.who) ? e.who : []).filter((c) => typeof c === 'string').map((c) => flat(c, MAX_WORD)).slice(-MAX_ASKERS);
  const primo = flat(e.first, 10);
  return { request: richiesta, who: chi, agent: flat(e.agent, MAX_WORD), task: flat(e.task, MAX_WORD), outcome: esito as ShortfallOutcome, reason: flat(e.reason, MAX_REASON), times: volte, first: primo, last: flat(e.last, 10) || primo };
}

/** The entries of the file's text; what cannot be read is nothing. */
export function readShortfalls(json: string | undefined): Shortfall[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    const voci = parsed?.entries ?? parsed?.voci;
    return Array.isArray(voci) ? voci.map(readEntry).filter((e): e is Shortfall => !!e) : [];
  } catch {
    return [];
  }
}

export class ShortfallLog {
  private entries = new Map<string, Shortfall>();
  /** Bumped at every note: the kernel saves when it changed. */
  version = 0;

  load(json: string | undefined): void {
    for (const e of readShortfalls(json)) this.entries.set(keyOf(e), e);
  }

  /** One more time this request ended badly: the last reason stays. A request that is empty is no request. */
  note(n: ShortfallNote, day = today()): void {
    const richiesta = flat(n.request, MAX_REQUEST);
    if (!richiesta) return;
    const agente = flat(n.agent, MAX_WORD);
    const compito = flat(n.task, MAX_WORD);
    const key = keyOf({ agent: agente, task: compito, request: richiesta });
    const e = this.entries.get(key) ?? { request: richiesta, who: [], agent: agente, task: compito, outcome: n.outcome, reason: '', times: 0, first: day, last: day };
    const chi = flat(n.who, MAX_WORD);
    e.who = [...e.who.filter((c) => c !== chi), chi].slice(-MAX_ASKERS);
    e.outcome = n.outcome;
    e.reason = flat(n.reason, MAX_REASON);
    e.times++;
    e.last = day;
    // Reinserted last: the map stays in the order of what happened most recently.
    this.entries.delete(key);
    this.entries.set(key, e);
    if (this.entries.size > MAX_ENTRIES) this.forgetOne();
    this.version++;
  }

  /** Over the cap (a player can make up new requests for as long as they like): out goes the oldest of those counted least. */
  private forgetOne(): void {
    let worst: [string, number] | undefined;
    for (const [k, e] of this.entries) if (!worst || e.times < worst[1]) worst = [k, e.times];
    if (worst) this.entries.delete(worst[0]);
  }

  list(): Shortfall[] {
    return [...this.entries.values()];
  }

  toJson(): string {
    return JSON.stringify({ entries: this.list() }, null, 1) + '\n';
  }
}

/** A cell of a Markdown table: whatever a player wrote does not open a new column. */
const cell = (s: string) => s.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

/** The report for the kernel 1.0.0: what happened most first, as Markdown. Each universe's entries stay apart. */
export function shortfallReport(universes: Array<{ universo: string; voci: Shortfall[] }>): string {
  const rows = universes.flatMap(({ universo, voci }) => voci.map((v) => ({ universo, ...v }))).sort((a, b) => b.times - a.times || b.last.localeCompare(a.last));
  const out = ['# Ciò che il Concilio non è riuscito a fare', ''];
  if (!rows.length) return [...out, universes.length === 1 ? `Nessuna voce in «${universes[0].universo}».` : `Nessuna voce negli universi letti: ${universes.length}.`, ''].join('\n');
  const times = rows.reduce((n, r) => n + r.times, 0);
  out.push(`Richieste: ${rows.length}. Volte: ${times}. Universi con voci: ${universes.filter((u) => u.voci.length).length}.`, '');
  const byAgent = new Map<string, { rows: number; times: number }>();
  for (const r of rows) {
    const a = byAgent.get(r.agent) ?? { rows: 0, times: 0 };
    a.rows++;
    a.times += r.times;
    byAgent.set(r.agent, a);
  }
  out.push('| agente | richieste | volte |', '|---|---:|---:|');
  for (const [agente, a] of [...byAgent].sort((x, y) => y[1].times - x[1].times)) out.push(`| ${cell(agente)} | ${a.rows} | ${a.times} |`);
  out.push('', '| volte | richiesta | chi | agente | compito | esito | motivo | universo | ultima volta |', '|---:|---|---|---|---|---|---|---|---|');
  for (const r of rows) out.push(`| ${r.times} | ${cell(r.request)} | ${cell(r.who.join(', '))} | ${cell(r.agent)} | ${cell(r.task)} | ${r.outcome} | ${cell(r.reason)} | ${cell(r.universo)} | ${cell(r.last)} |`);
  out.push('');
  return out.join('\n');
}
