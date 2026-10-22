// What the lab's calls to Gemini really cost. GeminiModels (the kernel's) counts prompt and answer tokens;
// Gemini also bills the model's reasoning ("thoughts") as output, and discounts the part of the prompt it
// had cached. This fetch reads all of them from every answer, gives up on requests that hang, and can
// ask for less reasoning.

import { costOf, usd } from './prices';

export interface Meter {
  calls: number;
  prompt: number;
  /** Of the prompt, the tokens Gemini served from its cache (repeated instructions). */
  cached: number;
  output: number;
  thoughts: number;
  /** Per model. */
  models: Record<string, { calls: number; prompt: number; cached: number; output: number; thoughts: number }>;
}

export const newMeter = (): Meter => ({ calls: 0, prompt: 0, cached: 0, output: 0, thoughts: 0, models: {} });

export interface MeterOptions {
  /** Milliseconds before a request is given up (GeminiModels then tries again). */
  timeout?: number;
  /** Asks Gemini 3 models to reason less ("low") or more ("high"); off unless set. */
  thinking?: 'low' | 'medium' | 'high';
  /** Extra headers (the scripts add the key here; the page goes through the proxy). */
  headers?: Record<string, string>;
}

export function meteredFetch(meter: Meter, opts: MeterOptions = {}, base: typeof fetch = (...a) => fetch(...a)): typeof fetch {
  return async (url, init) => {
    let body = init?.body;
    if (opts.thinking && typeof body === 'string') {
      const j = JSON.parse(body);
      j.generationConfig = { ...(j.generationConfig ?? {}), thinkingConfig: { thinkingLevel: opts.thinking } };
      body = JSON.stringify(j);
    }
    const r = await base(url, {
      ...init,
      body,
      headers: { ...(init?.headers as Record<string, string>), ...(opts.headers ?? {}) },
      ...(opts.timeout ? { signal: AbortSignal.timeout(opts.timeout) } : {}),
    });
    try {
      const u = (await r.clone().json())?.usageMetadata;
      if (u) {
        const model = /models\/([^:]+):/.exec(String(url))?.[1] ?? '?';
        const m = (meter.models[model] ??= { calls: 0, prompt: 0, cached: 0, output: 0, thoughts: 0 });
        for (const t of [meter, m]) {
          t.calls++;
          t.prompt += u.promptTokenCount ?? 0;
          t.cached += u.cachedContentTokenCount ?? 0;
          t.output += u.candidatesTokenCount ?? 0;
          t.thoughts += u.thoughtsTokenCount ?? 0;
        }
      }
    } catch {
      /* not JSON: an error, counted by GeminiModels */
    }
    return r;
  };
}

/** USD spent, from prices.ts (undefined if a model has no published price). */
export function meterCost(m: Meter): number | undefined {
  let sum = 0;
  for (const [model, t] of Object.entries(m.models)) {
    const c = costOf(model, t);
    if (c === undefined) return undefined;
    sum += c;
  }
  return sum;
}

export const meterLine = (m: Meter) =>
  `${m.calls} chiamate · input ${m.prompt} token (di cui in cache ${m.cached}) · risposta ${m.output} · ragionamento ${m.thoughts} · costo ${usd(meterCost(m))}`;
