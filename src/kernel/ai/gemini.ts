// Google Gemini through the local proxy (/api/gemini, see server/geminiProxy.ts).
// Text: narrative, NPC chat, descriptions, module code. Image: chunks and sprites.

import { BudgetError, emptyUsage, Semaphore, type ImageCall, type Limits, type Models, type TextCall } from './models';

export interface GeminiOptions {
  endpoint?: string;
  textModel: string;
  imageModel: string;
  limits: Limits;
  fetchImpl?: typeof fetch;
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

export class GeminiModels implements Models {
  readonly name = 'gemini';
  readonly canPaint = true;
  readonly usage = emptyUsage();
  limits: Limits;
  private textGate = new Semaphore(4);
  private imageGate = new Semaphore(2);
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
      const body = {
        systemInstruction: { parts: [{ text: call.system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: call.temperature ?? 0.8,
          ...(call.schema ? { responseMimeType: 'application/json', responseSchema: call.schema } : {}),
        },
      };
      const j = await this.post(this.opts.textModel, body);
      const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: GeminiPart) => p.text ?? '').join('');
      if (!text) throw new Error(`risposta vuota (${j.candidates?.[0]?.finishReason ?? 'sconosciuto'})`);
      return text;
    });
  }

  async image(call: ImageCall): Promise<string | null> {
    if (this.usage.images >= this.limits.images) throw new BudgetError('le immagini');
    this.usage.images++;
    return this.imageGate.run(async () => {
      const body = {
        contents: [{ role: 'user', parts: [{ text: call.prompt }, ...(call.images ?? []).map(inline)] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
      };
      const j = await this.post(this.opts.imageModel, body);
      const part = (j.candidates?.[0]?.content?.parts ?? []).find((p: GeminiPart) => p.inlineData);
      if (!part?.inlineData) throw new Error(`nessuna immagine (${j.candidates?.[0]?.finishReason ?? 'sconosciuto'})`);
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    });
  }

  private async post(model: string, body: unknown): Promise<any> {
    let last = '';
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const r = await this.fetchImpl(`${this.endpoint}/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok) {
          this.usage.inputTokens += j.usageMetadata?.promptTokenCount ?? 0;
          this.usage.outputTokens += j.usageMetadata?.candidatesTokenCount ?? 0;
          return j;
        }
        last = `${r.status} ${j.error?.message ?? r.statusText}`;
        if (r.status !== 429 && r.status < 500) break;
      } catch (e) {
        last = (e as Error).message;
      }
      await sleep(800 * 2 ** attempt);
    }
    this.usage.failures++;
    throw new Error(`Gemini ${model}: ${last}`);
  }
}
