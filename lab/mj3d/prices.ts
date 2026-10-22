// What a Gemini call costs, from https://aistudio.google.com/docs/pricing (read on 22 October 2026: paid
// tier, Standard, USD per million tokens). Prices change: keep the date, and the report in
// docs/reports/ that shows every calculation. Thinking tokens are billed as output.

export interface Price {
  /** USD per million prompt tokens (text and images). */
  input: number;
  /** USD per million output tokens, thinking included. */
  output: number;
  /** USD per million prompt tokens served from the cache. */
  cached: number;
  /** From this date (ISO) the prices change to `next`. */
  until?: string;
  next?: Omit<Price, 'until' | 'next'>;
  note?: string;
}

export const PRICES_READ_ON = '2026-10-22';

export const PRICES: Record<string, Price> = {
  'gemini-4-argon': { input: 2.0, output: 10.0, cached: 0.1, until: '2026-12-01', next: { input: 4.0, output: 20.0, cached: 0.2 } },
  'gemini-3.8-flash': { input: 0.75, output: 3.75, cached: 0.075, until: '2027-01-01', next: { input: 1.5, output: 7.5, cached: 0.15 } },
  'gemini-3.6-flash': { input: 0.75, output: 3.75, cached: 0.075, until: '2027-01-01', next: { input: 1.5, output: 7.5, cached: 0.15 } },
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5, cached: 0.03 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5, cached: 0.025 },
  'gemini-3.1-pro-preview': { input: 2.0, output: 12.0, cached: 0.2, note: 'fino a 200k token di prompt; oltre: 4,00 / 18,00 / 0,40' },
  'gemini-3-flash-preview': { input: 0.5, output: 3.0, cached: 0.05, note: 'modello «legacy»' },
};

/** Not on the pricing page: the report treats these as assumptions. */
export const UNPRICED = ['gemini-3.5-flash', 'gemini-3.7-flash'];

/** Images: gemini-3.1-flash-lite-image, $30 per million image tokens = $0.0336 per 1K image. */
export const IMAGE_PRICE = { model: 'gemini-3.1-flash-lite-image', perImage: 0.0336, input: 0.25, textOutput: 1.5 };

export function priceOf(model: string, date = new Date().toISOString().slice(0, 10)): Price | undefined {
  const p = PRICES[model.replace(/^models\//, '')];
  if (!p) return undefined;
  return p.until && p.next && date >= p.until ? { ...p.next } : p;
}

export interface Tokens {
  prompt: number;
  cached?: number;
  output: number;
  thoughts?: number;
}

/** USD for some usage: the cached part of the prompt at the cache price, thinking at the output price. */
export function costOf(model: string, t: Tokens, date?: string): number | undefined {
  const p = priceOf(model, date);
  if (!p) return undefined;
  const cached = t.cached ?? 0;
  return ((t.prompt - cached) * p.input + cached * p.cached + (t.output + (t.thoughts ?? 0)) * p.output) / 1e6;
}

export const usd = (v: number | undefined) => (v === undefined ? 'n.d.' : v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(3)}`);
