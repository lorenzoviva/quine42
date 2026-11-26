// The queue of the subscriptions paid with Anthropic's API credits (T542, ADR-0262): `npm run abbonamento -- --api --tetto-api <usd>`, or
// `QUINE_CODA_API=1` and `QUINE_CODA_TETTO_API=<usd>` in the `.env`. The CLI bills the API when ANTHROPIC_API_KEY is in its environment:
// only the child that serves a request gets it, read here from the `.env` and never put into this process's environment (so no other
// child inherits it), never printed, never in a log nor in an answer (`redact`). Without `--api` the child has no key at all (`childEnv`).
//
// Every run is priced at Anthropic's list (`anthropicCost` on the tokens the CLI says, `priceRun`), with the CLI's own figure beside it, in a
// ledger next to the queue (`universes/.queue/spesa-api-claude.json`, by month); past the ceiling the queue stops serving (`capReached`), and
// an answer of the API that says the credits are over stops it too (`CREDITS_OVER`). Nothing of the kernel changes.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ANTHROPIC_PRICES, anthropicCost } from '../../src/kernel/ai/prices';

/** The variable the CLI reads its API key from. */
export const API_KEY_VAR = 'ANTHROPIC_API_KEY';

/** The ledger's file, in the queue's folder. */
export const API_LEDGER = 'spesa-api-claude.json';

/**
 * The workspace of a key that belongs to none (an organisation's key): the API wants its id in a header, which the CLI sends from
 * `ANTHROPIC_CUSTOM_HEADERS`. Its id is no secret, and it is printed.
 */
export const WORKSPACE_VAR = 'ANTHROPIC_WORKSPACE_ID';
const WORKSPACE_RE = /^[A-Za-z0-9_-]{1,128}$/;

/** What the API says to a key of no workspace without the header: the queue stops until the `.env` says the workspace. */
export const NO_WORKSPACE = /not scoped to a workspace|anthropic-workspace-id/i;

/** What the API says when the prepaid credits are spent: the queue stops as at its ceiling. */
export const CREDITS_OVER = /credit balance is too low|insufficient[_ ]credit/i;

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);

/** A model id as the CLI writes it in `modelUsage` («claude-sonnet-5-5[1m]», with a date): the one of the list it begins with. */
export const listedModel = (id: string): string | undefined =>
  Object.keys(ANTHROPIC_PRICES).find((k) => id === k || id.startsWith(`${k}-`) || id.startsWith(`${k}[`));

/** The tokens and the dollars of one run of the CLI. */
export interface PricedRun {
  model: string;
  input: number;
  written5m: number;
  written1h: number;
  read: number;
  output: number;
  /** At Anthropic's list; undefined if a model of the run is off the list and the CLI says no cost for it. */
  usd?: number;
  /** `total_cost_usd` of the CLI's result (its own estimate at the API list). */
  usdCli?: number;
}

/**
 * The tokens and the dollars of one run, from its `result` event: per model of `modelUsage` (the CLI may ask a small model too), the
 * writes split between 5 minutes and an hour as `usage.cache_creation` says; a model off the list is taken at the CLI's own cost.
 */
export function priceRun(raw: unknown, chosen: string): PricedRun {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const usage = (r.usage && typeof r.usage === 'object' ? r.usage : {}) as Record<string, unknown>;
  const creation = (usage.cache_creation && typeof usage.cache_creation === 'object' ? usage.cache_creation : {}) as Record<string, unknown>;
  const w1 = num(creation.ephemeral_1h_input_tokens);
  const w5 = num(creation.ephemeral_5m_input_tokens);
  const hourShare = w1 + w5 > 0 ? w1 / (w1 + w5) : 0;
  const perModel = (r.modelUsage && typeof r.modelUsage === 'object' ? r.modelUsage : undefined) as Record<string, Record<string, unknown>> | undefined;
  const rows: Array<{ id: string; input: number; written: number; read: number; output: number; cost?: number }> = perModel
    ? Object.entries(perModel).map(([id, u]) => ({ id, input: num(u.inputTokens), written: num(u.cacheCreationInputTokens), read: num(u.cacheReadInputTokens), output: num(u.outputTokens), cost: typeof u.costUSD === 'number' ? u.costUSD : undefined }))
    : [{ id: chosen, input: num(usage.input_tokens), written: num(usage.cache_creation_input_tokens), read: num(usage.cache_read_input_tokens), output: num(usage.output_tokens) }];
  const out: PricedRun = { model: chosen, input: 0, written5m: 0, written1h: 0, read: 0, output: 0, usd: 0 };
  for (const row of rows) {
    const written1h = Math.round(row.written * hourShare);
    const t = { input: row.input, written5m: row.written - written1h, written1h, read: row.read, output: row.output };
    const id = listedModel(row.id);
    const cost = id ? anthropicCost(id, t) : row.cost;
    out.input += t.input;
    out.written5m += t.written5m;
    out.written1h += t.written1h;
    out.read += t.read;
    out.output += t.output;
    out.usd = out.usd === undefined || cost === undefined ? undefined : out.usd + cost;
  }
  return { ...out, ...(typeof r.total_cost_usd === 'number' ? { usdCli: r.total_cost_usd } : {}) };
}

/** The values a `.env` gives for these names (`NAME=value`, quotes and `export` allowed); nothing goes into `process.env`. */
export function envValues(text: string, names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || !names.includes(m[1]) || m[1] in out) continue;
    let v = m[2];
    const q = /^(["'])(.*)\1$/.exec(v);
    if (q) v = q[2];
    else v = v.replace(/\s+#.*$/, '');
    if (v) out[m[1]] = v;
  }
  return out;
}

/** The `.env` files the queue reads: the one given, else this checkout's and the main checkout's (a worktree has none of its own). */
export function envFiles(given?: string, cwd = process.cwd()): string[] {
  if (given) return [path.resolve(cwd, given)];
  const out = [path.resolve(cwd, '.env')];
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const main = path.join(path.dirname(common), '.env');
    if (!out.includes(main)) out.push(main);
  } catch {
    /* not a checkout */
  }
  return out;
}

/** How the queue pays: the key and the ceiling in dollars a month. The key is never printed: `describe` says where it came from. */
export interface ApiSettings {
  key: string;
  cap: number;
  /** The file the key was read from. */
  from: string;
  /** The workspace the requests go to, for a key of none (`ANTHROPIC_WORKSPACE_ID`). */
  workspace?: string;
}

/**
 * Whether the queue is paid with the API and how (`--api`, `--tetto-api`, or the `.env`): undefined on the subscription, a text when
 * something is missing (the key, the ceiling), which never contains the key.
 */
export function apiSettings(o: { api?: boolean; cap?: number; envFile?: string; files?: string[] }): ApiSettings | string | undefined {
  const files = o.files ?? envFiles(o.envFile);
  const found: Record<string, { value: string; file: string }> = {};
  for (const file of files) {
    let text: string;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const [k, value] of Object.entries(envValues(text, [API_KEY_VAR, WORKSPACE_VAR, 'QUINE_CODA_API', 'QUINE_CODA_TETTO_API']))) found[k] ??= { value, file };
  }
  if (!o.api && found.QUINE_CODA_API?.value !== '1') return undefined;
  const cap = o.cap ?? (found.QUINE_CODA_TETTO_API ? Number(found.QUINE_CODA_TETTO_API.value) : undefined);
  if (cap === undefined) return 'la coda sui crediti API vuole un tetto in dollari: --tetto-api <usd> o QUINE_CODA_TETTO_API nel .env';
  if (!Number.isFinite(cap) || cap <= 0) return 'il tetto dei crediti API è un numero di dollari maggiore di zero';
  const key = found[API_KEY_VAR];
  if (!key) return `${API_KEY_VAR} non è in ${files.join(', ')}`;
  const workspace = found[WORKSPACE_VAR]?.value;
  if (workspace !== undefined && !WORKSPACE_RE.test(workspace)) return `${WORKSPACE_VAR} non è l’id di un workspace (lettere, cifre, _ e -)`;
  return { key: key.value, cap, from: key.file, ...(workspace ? { workspace } : {}) };
}

/**
 * The environment of the child that serves a request, from the reduced one (`cliEnv`): with a key, the key and not the subscription's
 * token (the CLI would take the key anyway, ADR-0262); without, no key whatever the source had.
 */
export function childEnv(reduced: NodeJS.ProcessEnv, key?: string, workspace?: string): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(reduced)) {
    const K = k.toUpperCase();
    if (K === API_KEY_VAR || K === 'ANTHROPIC_AUTH_TOKEN' || K === 'ANTHROPIC_CUSTOM_HEADERS' || (key && K === 'CLAUDE_CODE_OAUTH_TOKEN')) continue;
    out[k] = v;
  }
  if (key) out[API_KEY_VAR] = key;
  // The header of the workspace, as the CLI sends its custom headers: only with the key, and only a plain id.
  if (key && workspace && WORKSPACE_RE.test(workspace)) out.ANTHROPIC_CUSTOM_HEADERS = `anthropic-workspace-id: ${workspace}`;
  return out;
}

/** A text with the key in it, if it ever is (an error of the CLI), without it. */
export function redact(text: string, key?: string): string {
  return key && key.length >= 8 ? text.split(key).join('[chiave]') : text;
}

/** One run in the ledger: no prompt, no answer, only what it cost. */
export interface ApiCall {
  t: string;
  id?: string;
  task?: string;
  model: string;
  input: number;
  written5m: number;
  written1h: number;
  read: number;
  output: number;
  /** At the list, or the CLI's figure for a model off the list. */
  usd: number;
  usdCli?: number;
  esito: string;
}

/** A month of the ledger. */
export interface ApiMonth {
  speso: number;
  spesoCli: number;
  chiamate: number;
}

export interface ApiLedger {
  /** The ceiling of the last process that served, in dollars a month. */
  tetto?: number;
  /** By month (`AAAA-MM`, local time): the ceiling holds for the month of now. */
  mesi: Record<string, ApiMonth>;
  /** The last runs, the newest last. */
  ultime: ApiCall[];
  servitore?: { pid: number; dal: string };
  /** Why the queue stopped serving, and when. */
  fermo?: { motivo: string; t: string };
}

/** How many runs the ledger keeps one by one. */
export const LEDGER_KEPT = 500;

export const ledgerFile = (dir: string) => path.join(dir, API_LEDGER);

export const monthOf = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** The ledger as it is on disk; a file that does not read is an empty ledger. */
export function readLedger(dir: string): ApiLedger {
  try {
    const l = JSON.parse(fs.readFileSync(ledgerFile(dir), 'utf8'));
    if (l && typeof l === 'object') return { ...l, mesi: l.mesi && typeof l.mesi === 'object' ? l.mesi : {}, ultime: Array.isArray(l.ultime) ? l.ultime : [] };
  } catch {
    /* none yet */
  }
  return { mesi: {}, ultime: [] };
}

export function writeLedger(dir: string, l: ApiLedger): void {
  fs.mkdirSync(dir, { recursive: true });
  const file = ledgerFile(dir);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(l, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

/** What the month of `now` has spent. */
export const spentIn = (l: ApiLedger, now: Date = new Date()): ApiMonth => l.mesi[monthOf(now)] ?? { speso: 0, spesoCli: 0, chiamate: 0 };

/** Whether the ceiling is reached in the month of `now`. */
export const capReached = (l: ApiLedger, cap: number, now: Date = new Date()): boolean => spentIn(l, now).speso >= cap;

const cents = (v: number) => Math.round(v * 1e6) / 1e6;

/** Writes one run in the ledger, in the month of `now`. */
export function recordCall(dir: string, call: Omit<ApiCall, 't'>, now: Date = new Date()): ApiLedger {
  const l = readLedger(dir);
  const m = spentIn(l, now);
  l.mesi[monthOf(now)] = { speso: cents(m.speso + call.usd), spesoCli: cents(m.spesoCli + (call.usdCli ?? 0)), chiamate: m.chiamate + 1 };
  l.ultime = [...l.ultime, { t: now.toISOString(), ...call }].slice(-LEDGER_KEPT);
  writeLedger(dir, l);
  return l;
}

/** Marks in the ledger who serves now (and with which ceiling), or why it stopped. */
export function markLedger(dir: string, change: Partial<Pick<ApiLedger, 'tetto' | 'servitore' | 'fermo'>>): void {
  const l = readLedger(dir);
  writeLedger(dir, { ...l, ...change });
}

export const dollars = (v: number) => `${v.toFixed(2)} $`;
