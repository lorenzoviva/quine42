// Google Gemini through server/geminiProxy.ts: its route /api/gemini in the browser, its `direct()` on the server.
//
// What a call costs is counted from every answer (prompt, cached prompt, answer and reasoning) and
// reported to the kernel's usage ledger (onCall). Reasoning is asked `low` unless a call says otherwise.
// A request that times out, or whose connection fails, is NOT repeated: Gemini may have generated (and
// billed) it anyway. Only an answer that says "try again" (429, 5xx) is repeated, a few times.
// A call that asks for it (`cache`, the Actor's) names an explicit cache of its system instructions (T351, ADR-0185): the
// policy is in cache.ts, the write here (`cache.write` in the ledger, paid by the whole world: `comune`); a cache that is
// gone sends the call whole, once.

import { BudgetError, emptyUsage, Semaphore, type Limits, type AiModels, type TextCall, type Thinking } from './models';
import type { CallRecord } from './usage';
import { ExplicitCaches } from './cache';
import { cacheable } from './prices';

/** Who pays the write of an explicit cache: every later call of the world names it (rule 8i: said, not derived). */
export const CACHE_PAYER = 'comune';
/** The task of a cache's write in the ledger. */
export const CACHE_TASK = 'cache.write';

export interface GeminiOptions {
  endpoint?: string;
  textModel: string;
  limits: Limits;
  fetchImpl?: typeof fetch;
  /** Default reasoning effort (`low`). */
  thinking?: Thinking;
  /** Milliseconds before a request is given up (default 120 s); it is then not repeated. */
  timeout?: number;
  /** Seconds an explicit cache is kept (EXPLICIT_CACHE.ttl when missing), and the clock in milliseconds (tests). */
  cacheTtl?: number;
  now?: () => number;
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

function inline(dataUrl: string): GeminiPart {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!m) throw new Error('immagine non in formato data URL');
  return { inlineData: { mimeType: m[1], data: m[2] } };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RETRIES = 3;

export class GeminiAiModels implements AiModels {
  readonly name = 'gemini';
  readonly usage = emptyUsage();
  limits: Limits;
  onCall?: (r: CallRecord) => void;
  private textGate = new Semaphore(4);
  private endpoint: string;
  private fetchImpl: typeof fetch;
  readonly caches: ExplicitCaches;

  get textModel(): string {
    return this.opts.textModel;
  }
  set textModel(m: string) {
    this.opts.textModel = m;
  }

  constructor(private opts: GeminiOptions) {
    this.limits = opts.limits;
    this.endpoint = opts.endpoint ?? '/api/gemini';
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
    this.caches = new ExplicitCaches({ write: (model, system, ttl, agent) => this.writeCache(model, system, ttl, agent), ttl: opts.cacheTtl, now: opts.now });
  }

  static async available(endpoint = '/api/gemini'): Promise<boolean> {
    try {
      const r = await fetch(`${endpoint}/status`);
      return r.ok && (await r.json()).available === true;
    } catch {
      return false;
    }
  }

  async text(call: TextCall): Promise<string> {
    if (this.usage.text >= this.limits.text) throw new BudgetError('il testo');
    this.usage.text++;
    return this.textGate.run(async () => {
      const parts: GeminiPart[] = [{ text: call.prompt }, ...(call.images ?? []).map(inline)];
      const thinking = call.thinking ?? this.opts.thinking ?? 'low';
      const model = call.model ?? this.opts.textModel;
      const rest = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: call.temperature ?? 0.8,
          ...(call.schema ? { responseMimeType: 'application/json', responseSchema: call.schema } : {}),
          ...(thinking !== 'off' ? { thinkingConfig: { thinkingLevel: thinking } } : {}),
        },
      };
      // Stable instructions first: Gemini caches the start of a prompt it has seen recently.
      const whole = { systemInstruction: { parts: [{ text: call.system }] }, ...rest };
      const cached = call.cache && cacheable(model) ? await this.caches.nameFor(model, call.system, call.agent) : undefined;
      let j: any;
      if (cached) {
        try {
          // The system instructions are in the cache: a call that names one may not send them again.
          j = await this.post(model, { cachedContent: cached, ...rest }, call);
        } catch (e) {
          const status = (e as { status?: number }).status;
          // Expired, unknown to the gate after a restart, refused: the call goes whole, once; the cache is written anew if asked for.
          if (status === undefined || status >= 500 || status === 429 || status === 402) throw e;
          this.caches.forget(model, call.system);
          j = await this.post(model, whole, call);
        }
      } else j = await this.post(model, whole, call);
      const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: GeminiPart) => p.text ?? '').join('');
      if (!text) throw new Error(`risposta vuota (${j.candidates?.[0]?.finishReason ?? 'sconosciuto'})`);
      return text;
    });
  }

  private async post(model: string, body: unknown, call: { agent: string; task: string; chi?: string }): Promise<any> {
    const report = (u: any, extra: Partial<CallRecord> = {}) => {
      const r: CallRecord = {
        model,
        agent: call.agent,
        task: call.task,
        prompt: u?.promptTokenCount ?? 0,
        cached: u?.cachedContentTokenCount ?? 0,
        output: u?.candidatesTokenCount ?? 0,
        thoughts: u?.thoughtsTokenCount ?? 0,
        ...(call.chi ? { who: call.chi } : {}),
        ...extra,
      };
      this.usage.inputTokens += r.prompt;
      this.usage.cachedTokens += r.cached;
      this.usage.outputTokens += r.output;
      this.usage.thoughtTokens += r.thoughts;
      this.onCall?.(r);
    };
    let last = '';
    let lastStatus: number | undefined;
    let retries = 0;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      let r: Response;
      try {
        r = await this.fetchImpl(`${this.endpoint}/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.opts.timeout ?? 120_000),
        });
      } catch (e) {
        // No answer: the request may have been generated and billed all the same. Never again.
        const timeout = /abort|timeout/i.test(`${(e as Error).name} ${(e as Error).message}`);
        this.usage.failures++;
        if (timeout) this.usage.timeouts++;
        report(undefined, { failed: timeout ? 'timeout' : 'errore', retries });
        throw new Error(`Gemini ${model}: ${timeout ? 'tempo scaduto' : (e as Error).message} (non ripetuta)`);
      }
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        report(j.usageMetadata, { retries });
        return j;
      }
      // The proxy's daily cap (T123): nothing more today, and whoever stops at a budget stops here too.
      if (r.status === 402) throw new BudgetError('la spesa del giorno');
      last = `${r.status} ${j.error?.message ?? r.statusText}`;
      lastStatus = r.status;
      if (r.status !== 429 && r.status < 500) break;
      if (attempt < RETRIES) {
        retries++;
        this.usage.retries++;
        await sleep(800 * 2 ** attempt);
      }
    }
    this.usage.failures++;
    throw Object.assign(new Error(`Gemini ${model}: ${last}`), { status: lastStatus });
  }

  /**
   * Writes an explicit cache of `system` (T351): the gate counts it against the day's cap, the ledger records it as `cache.write` with
   * its tokens and the hours they are kept, paid by `comune`. Undefined when Gemini or the gate say no; a write with no answer stays
   * counted as a failure (it may have been billed) and is not repeated.
   */
  private async writeCache(model: string, system: string, ttl: number, agent: string): Promise<{ name: string } | undefined> {
    const record = (tokens: number, failed?: CallRecord['failed']) => {
      const r: CallRecord = { model, agent, task: CACHE_TASK, prompt: tokens, cached: 0, output: 0, thoughts: 0, stored: (tokens * ttl) / 3600, who: CACHE_PAYER, ...(failed ? { failed } : {}) };
      this.usage.inputTokens += tokens;
      this.onCall?.(r);
    };
    let r: Response;
    try {
      r = await this.fetchImpl(`${this.endpoint}/cachedContents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: `models/${model}`, systemInstruction: { parts: [{ text: system }] }, ttl: `${ttl}s` }),
        signal: AbortSignal.timeout(this.opts.timeout ?? 120_000),
      });
    } catch (e) {
      const timeout = /abort|timeout/i.test(`${(e as Error).name} ${(e as Error).message}`);
      this.usage.failures++;
      if (timeout) this.usage.timeouts++;
      record(0, timeout ? 'timeout' : 'errore');
      return undefined;
    }
    const j = await r.json().catch(() => ({}));
    const name = typeof j?.name === 'string' && /^cachedContents\/[\w-]{1,128}$/.test(j.name) ? j.name : undefined;
    if (!r.ok || !name) return undefined;
    record(Math.max(0, Number(j.usageMetadata?.totalTokenCount) || 0));
    return { name };
  }
}
