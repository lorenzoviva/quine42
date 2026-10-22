// Google Gemini through the local proxy (/api/gemini, see server/geminiProxy.ts).
//
// What a call costs is counted from every answer (prompt, cached prompt, answer and reasoning) and
// reported to the kernel's usage ledger (onCall). Reasoning is asked `low` unless a call says otherwise.
// A request that times out, or whose connection fails, is NOT repeated: Gemini may have generated (and
// billed) it anyway. Only an answer that says "try again" (429, 5xx) is repeated, a few times.

import { BudgetError, emptyUsage, Semaphore, type Limits, type Models, type TextCall, type Thinking } from './models';
import type { CallRecord } from './usage';

export interface GeminiOptions {
  endpoint?: string;
  textModel: string;
  limits: Limits;
  fetchImpl?: typeof fetch;
  /** Default reasoning effort (`low`). */
  thinking?: Thinking;
  /** Milliseconds before a request is given up (default 120 s); it is then not repeated. */
  timeout?: number;
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

export class GeminiModels implements Models {
  readonly name = 'gemini';
  readonly usage = emptyUsage();
  limits: Limits;
  onCall?: (r: CallRecord) => void;
  private textGate = new Semaphore(4);
  private endpoint: string;
  private fetchImpl: typeof fetch;

  constructor(private opts: GeminiOptions) {
    this.limits = opts.limits;
    this.endpoint = opts.endpoint ?? '/api/gemini';
    this.fetchImpl = opts.fetchImpl ?? ((...a) => fetch(...a));
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
      const body = {
        // Stable instructions first: Gemini caches the start of a prompt it has seen recently.
        systemInstruction: { parts: [{ text: call.system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: call.temperature ?? 0.8,
          ...(call.schema ? { responseMimeType: 'application/json', responseSchema: call.schema } : {}),
          ...(thinking !== 'off' ? { thinkingConfig: { thinkingLevel: thinking } } : {}),
        },
      };
      const j = await this.post(call.model ?? this.opts.textModel, body, call);
      const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: GeminiPart) => p.text ?? '').join('');
      if (!text) throw new Error(`risposta vuota (${j.candidates?.[0]?.finishReason ?? 'sconosciuto'})`);
      return text;
    });
  }

  private async post(model: string, body: unknown, call: { agent: string; task: string }): Promise<any> {
    const report = (u: any, extra: Partial<CallRecord> = {}) => {
      const r: CallRecord = {
        model,
        agent: call.agent,
        task: call.task,
        prompt: u?.promptTokenCount ?? 0,
        cached: u?.cachedContentTokenCount ?? 0,
        output: u?.candidatesTokenCount ?? 0,
        thoughts: u?.thoughtsTokenCount ?? 0,
        ...extra,
      };
      this.usage.inputTokens += r.prompt;
      this.usage.cachedTokens += r.cached;
      this.usage.outputTokens += r.output;
      this.usage.thoughtTokens += r.thoughts;
      this.onCall?.(r);
    };
    let last = '';
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
      last = `${r.status} ${j.error?.message ?? r.statusText}`;
      if (r.status !== 429 && r.status < 500) break;
      if (attempt < RETRIES) {
        retries++;
        this.usage.retries++;
        await sleep(800 * 2 ** attempt);
      }
    }
    this.usage.failures++;
    throw new Error(`Gemini ${model}: ${last}`);
  }
}
