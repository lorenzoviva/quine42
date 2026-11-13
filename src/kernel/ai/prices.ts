// The only list of prices in the project (the kernel's usage ledger, the Council panel and the lab use it).
// Read from https://aistudio.google.com/docs/pricing on PRICES_READ_ON (paid tier, Standard, USD per million
// tokens). Prices change: keep the date, and the report in docs/reports/ that shows every calculation.
// Thinking tokens are billed as output; prompt tokens served from the cache at the cache price.

export interface Price {
  /** USD per million prompt tokens (text and images). */
  input: number;
  /** USD per million output tokens, thinking included. */
  output: number;
  /** USD per million prompt tokens served from the cache. */
  cached: number;
  /**
   * USD per million tokens kept an hour in an explicit cache (T351, ADR-0185): only the models that have it may hold one
   * (`ExplicitCaches`, the gate). Without it a model is never cached explicitly.
   */
  storage?: number;
  /** From this date (ISO) the prices change to `next`. */
  until?: string;
  next?: Omit<Price, 'until' | 'next'>;
  note?: string;
}

export const PRICES_READ_ON = '2026-10-22';

export const PRICES: Record<string, Price> = {
  'gemini-4-argon': { input: 2.0, output: 10.0, cached: 0.1, until: '2026-12-01', next: { input: 4.0, output: 20.0, cached: 0.2 } },
  // The storage of an explicit cache (T351): 0.50 $ per million tokens an hour until the end of 2026, then 1.00 $ (read on
  // STORAGE_READ_ON on the pages that copy Google's; to check on the first bill, as the write: see EXPLICIT_CACHE).
  'gemini-3.8-flash': { input: 0.75, output: 3.75, cached: 0.075, storage: 0.5, until: '2027-01-01', next: { input: 1.5, output: 7.5, cached: 0.15, storage: 1.0 } },
  'gemini-3.6-flash': { input: 0.75, output: 3.75, cached: 0.075, until: '2027-01-01', next: { input: 1.5, output: 7.5, cached: 0.15 } },
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5, cached: 0.03 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5, cached: 0.025 },
  'gemini-3.1-pro-preview': { input: 2.0, output: 12.0, cached: 0.2, note: 'fino a 200k token di prompt; oltre: 4,00 / 18,00 / 0,40' },
  'gemini-3-flash-preview': { input: 0.5, output: 3.0, cached: 0.05, note: 'modello «legacy»' },
};

/** When the storage price of the explicit cache was read (T351). */
export const STORAGE_READ_ON = '2026-11-13';

/**
 * The explicit cache of Gemini (T351, ADR-0185): a prefix (the system instructions) kept by Google for `ttl` seconds and named in
 * the calls that follow, which pay it at the `cached` price. Its write is billed here as prompt at the `input` price (the pages
 * do not agree on a fee for the write: never lower than it may be) and its storage for the whole `ttl` at the `storage` price,
 * paid when it is written. `ttl` is the most a cache lives: when it ends a new one is written, if it is still asked for.
 * `maxTtl` is the most the gate lets anybody ask; `minTokens` is what Gemini wants at least in a cache (under it, no cache).
 */
export const EXPLICIT_CACHE = { ttl: 1800, maxTtl: 3600, minTokens: 1024 } as const;

/**
 * Not on the pricing page. The report of step 8.2B priced them between the Flash-Lite and the 3.8 Flash
 * prices; the ledger uses the higher estimate (its note says so), so a cost is never shown as lower than it is.
 */
export const ESTIMATED: Record<string, Price> = {
  'gemini-3.5-flash': { input: 0.75, output: 3.75, cached: 0.075, note: 'stima (report 8.2B)' },
  'gemini-3.7-flash': { input: 0.75, output: 3.75, cached: 0.075, note: 'stima (report 8.2B)' },
};
export const UNPRICED = Object.keys(ESTIMATED);

/**
 * The models that choose instead of writing (ADR-0157, `decisions.ts`): TypeSafe's Jev, read from https://docs.typesafe.ai/models.md on
 * DECISION_PRICES_READ_ON. Input tokens only: the answer is free; no cache.
 */
export const DECISION_PRICES_READ_ON = '2026-11-06';
export const DECISION_PRICES: Record<string, Price> = {
  'jev-1.13.0': { input: 0.042, output: 0, cached: 0.042, note: 'TypeSafe: solo i token in ingresso' },
  'jev-1.14.0': { input: 0.042, output: 0, cached: 0.042, note: 'TypeSafe: solo i token in ingresso' },
};

/** The calls served by a subscription's CLI (T68): already paid with the subscription, zero dollars per call. */
export const SUBSCRIPTION_PRICES: Record<string, Price> = {
  'abbonamento-claude': { input: 0, output: 0, cached: 0, note: 'abbonamento (Claude Code)' },
  // Only for the calls already in a ledger: Antigravity is no longer on the queue (ADR-0106).
  'abbonamento-antigravity': { input: 0, output: 0, cached: 0, note: 'abbonamento (Antigravity)' },
};

export function priceOf(model: string, date = new Date().toISOString().slice(0, 10)): Price | undefined {
  const id = model.replace(/^models\//, '');
  const p = PRICES[id] ?? ESTIMATED[id] ?? DECISION_PRICES[id] ?? SUBSCRIPTION_PRICES[id];
  if (!p) return undefined;
  return p.until && p.next && date >= p.until ? { ...p.next } : p;
}

export interface Tokens {
  prompt: number;
  cached?: number;
  output: number;
  thoughts?: number;
  /** Tokens kept in an explicit cache, times the hours they are kept (T351). */
  stored?: number;
}

/** The dearest of the list: a model off it is never shown or billed lower. */
export const DEAREST_MODEL = Object.keys(PRICES).reduce((a, b) => (PRICES[b].output > PRICES[a].output ? b : a));

/** The model a call of Google's is billed as: its own, or the dearest if it is off the list. The others (local, subscriptions) as they are. */
export const billedModel = (model: string): string => (/^(models\/)?gemini-/.test(model) && !priceOf(model) ? DEAREST_MODEL : model);

/**
 * USD for some usage: the cached part of the prompt at the cache price, thinking at the output price, the storage of an explicit
 * cache at its price (at the input price, an hour, for a model without one: never lower than it may be).
 */
export function costOf(model: string, t: Tokens, date?: string): number | undefined {
  const p = priceOf(model, date);
  if (!p) return undefined;
  const cached = t.cached ?? 0;
  const stored = t.stored ?? 0;
  return ((t.prompt - cached) * p.input + cached * p.cached + (t.output + (t.thoughts ?? 0)) * p.output + (stored ? stored * (p.storage ?? p.input) : 0)) / 1e6;
}

/** Whether a model may hold an explicit cache: only those whose storage has a price (T351). */
export const cacheable = (model: string, date?: string): boolean => priceOf(model, date)?.storage !== undefined;

export const usd = (v: number | undefined) => (v === undefined ? 'n.d.' : v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(3)}`);
