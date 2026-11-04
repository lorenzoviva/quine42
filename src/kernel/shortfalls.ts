// What the Council could not do (T238, ADR-0129): every request that ends badly, whoever asked it, is one entry of a ledger that
// counts how often it happened. It is the list Phase III starts from, so it outlives rollbacks, as the usage does. It stays on the
// server: nothing in the world reads it and `src/session/files.ts` does not name it. The text comes from players and from the
// models, so it is cut down and flattened here. Pure and light: the report command imports it, without the kernel.

export const SHORTFALLS_FILE = 'world/mancanze.json';

/**
 * How it ended: the Council said no (`rifiuto`); it said yes, but the validator refused its last attempt or dropped what it
 * proposed (`invalido`); the model gave no usable answer (`errore`); generated code that fails and the Engineer did not repair (`guasto`).
 */
export type ShortfallOutcome = 'rifiuto' | 'invalido' | 'errore' | 'guasto';
const OUTCOMES: readonly string[] = ['rifiuto', 'invalido', 'errore', 'guasto'] satisfies ShortfallOutcome[];

export interface ShortfallNote {
  richiesta: string;
  /** Who asked: a wanderer's id, or `comune` when it was the world's own need. */
  chi: string;
  agente: string;
  /** The task of the model (`forge.concept`, `action.judge`). */
  compito: string;
  esito: ShortfallOutcome;
  motivo: string;
}

/** One entry of world/mancanze.json. */
export interface Shortfall extends Omit<ShortfallNote, 'chi'> {
  /** Everyone who asked, each once. */
  chi: string[];
  volte: number;
  /** ISO days. */
  primo: string;
  ultimo: string;
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

const keyOf = (s: Pick<ShortfallNote, 'agente' | 'compito' | 'richiesta'>) => `${s.agente}|${s.compito}|${s.richiesta.toLowerCase()}`;

const today = () => new Date().toISOString().slice(0, 10);

/** An entry as read from the file, or undefined if it is not one: the file may have been edited by hand. */
function readEntry(raw: unknown): Shortfall | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const e = raw as Record<string, unknown>;
  const richiesta = flat(e.richiesta, MAX_REQUEST);
  if (!richiesta || !OUTCOMES.includes(e.esito as string)) return undefined;
  const volte = Number.isSafeInteger(e.volte) && (e.volte as number) > 0 ? (e.volte as number) : 1;
  const chi = (Array.isArray(e.chi) ? e.chi : []).filter((c) => typeof c === 'string').map((c) => flat(c, MAX_WORD)).slice(-MAX_ASKERS);
  const primo = flat(e.primo, 10);
  return { richiesta, chi, agente: flat(e.agente, MAX_WORD), compito: flat(e.compito, MAX_WORD), esito: e.esito as ShortfallOutcome, motivo: flat(e.motivo, MAX_REASON), volte, primo, ultimo: flat(e.ultimo, 10) || primo };
}

/** The entries of the file's text; what cannot be read is nothing. */
export function readShortfalls(json: string | undefined): Shortfall[] {
  if (!json) return [];
  try {
    const voci = JSON.parse(json)?.voci;
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
    const richiesta = flat(n.richiesta, MAX_REQUEST);
    if (!richiesta) return;
    const agente = flat(n.agente, MAX_WORD);
    const compito = flat(n.compito, MAX_WORD);
    const key = keyOf({ agente, compito, richiesta });
    const e = this.entries.get(key) ?? { richiesta, chi: [], agente, compito, esito: n.esito, motivo: '', volte: 0, primo: day, ultimo: day };
    const chi = flat(n.chi, MAX_WORD);
    e.chi = [...e.chi.filter((c) => c !== chi), chi].slice(-MAX_ASKERS);
    e.esito = n.esito;
    e.motivo = flat(n.motivo, MAX_REASON);
    e.volte++;
    e.ultimo = day;
    // Reinserted last: the map stays in the order of what happened most recently.
    this.entries.delete(key);
    this.entries.set(key, e);
    if (this.entries.size > MAX_ENTRIES) this.forgetOne();
    this.version++;
  }

  /** Over the cap (a player can make up new requests for as long as they like): out goes the oldest of those counted least. */
  private forgetOne(): void {
    let worst: [string, number] | undefined;
    for (const [k, e] of this.entries) if (!worst || e.volte < worst[1]) worst = [k, e.volte];
    if (worst) this.entries.delete(worst[0]);
  }

  list(): Shortfall[] {
    return [...this.entries.values()];
  }

  toJson(): string {
    return JSON.stringify({ voci: this.list() }, null, 1) + '\n';
  }
}

/** A cell of a Markdown table: whatever a player wrote does not open a new column. */
const cell = (s: string) => s.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

/** The report for the kernel 1.0.0: what happened most first, as Markdown. Each universe's entries stay apart. */
export function shortfallReport(universes: Array<{ universo: string; voci: Shortfall[] }>): string {
  const rows = universes.flatMap(({ universo, voci }) => voci.map((v) => ({ universo, ...v }))).sort((a, b) => b.volte - a.volte || b.ultimo.localeCompare(a.ultimo));
  const out = ['# Ciò che il Concilio non è riuscito a fare', ''];
  if (!rows.length) return [...out, universes.length === 1 ? `Nessuna voce in «${universes[0].universo}».` : `Nessuna voce negli universi letti: ${universes.length}.`, ''].join('\n');
  const times = rows.reduce((n, r) => n + r.volte, 0);
  out.push(`Richieste: ${rows.length}. Volte: ${times}. Universi con voci: ${universes.filter((u) => u.voci.length).length}.`, '');
  const byAgent = new Map<string, { rows: number; times: number }>();
  for (const r of rows) {
    const a = byAgent.get(r.agente) ?? { rows: 0, times: 0 };
    a.rows++;
    a.times += r.volte;
    byAgent.set(r.agente, a);
  }
  out.push('| agente | richieste | volte |', '|---|---:|---:|');
  for (const [agente, a] of [...byAgent].sort((x, y) => y[1].times - x[1].times)) out.push(`| ${cell(agente)} | ${a.rows} | ${a.times} |`);
  out.push('', '| volte | richiesta | chi | agente | compito | esito | motivo | universo | ultima volta |', '|---:|---|---|---|---|---|---|---|---|');
  for (const r of rows) out.push(`| ${r.volte} | ${cell(r.richiesta)} | ${cell(r.chi.join(', '))} | ${cell(r.agente)} | ${cell(r.compito)} | ${r.esito} | ${cell(r.motivo)} | ${cell(r.universo)} | ${cell(r.ultimo)} |`);
  out.push('');
  return out.join('\n');
}
