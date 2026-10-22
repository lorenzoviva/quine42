import { describe, expect, it } from 'vitest';
import { GeminiModels } from '../src/kernel/ai/gemini';
import { BudgetError, parseJson } from '../src/kernel/ai/models';
import { colorName } from '../src/kernel/agents/council';
import { costOf, priceOf } from '../src/kernel/ai/prices';
import { UsageLedger, type CallRecord } from '../src/kernel/ai/usage';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';

type Call = { url: string; body: any };

function fakeFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Call[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    const r = responses.shift() ?? { status: 500, body: {} };
    return { ok: r.status < 400, status: r.status, statusText: '', json: async () => r.body } as Response;
  }) as unknown as typeof fetch;
  return { calls, impl };
}

const textOk = (text: string) => ({ status: 200, body: { candidates: [{ content: { parts: [{ text }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } } });

describe('GeminiModels', () => {
  it('sends system prompt, images and JSON schema through the proxy, and counts usage', async () => {
    const { calls, impl } = fakeFetch([textOk('{"a":1}')]);
    const g = new GeminiModels({ textModel: 'gemini-3.1-flash-lite', imageModel: 'gemini-3.1-flash-lite-image', limits: { text: 5, images: 5 }, fetchImpl: impl });
    const out = await g.text({ agent: 'fisico', task: 't', system: 'sei il fisico', prompt: 'ciao', schema: { type: 'OBJECT', properties: { a: { type: 'NUMBER' } } }, images: ['data:image/png;base64,QUJD'] });
    expect(out).toBe('{"a":1}');
    expect(calls[0].url).toBe('/api/gemini/models/gemini-3.1-flash-lite:generateContent');
    expect(calls[0].body.systemInstruction.parts[0].text).toBe('sei il fisico');
    expect(calls[0].body.contents[0].parts[1].inlineData).toEqual({ mimeType: 'image/png', data: 'QUJD' });
    expect(calls[0].body.generationConfig.responseMimeType).toBe('application/json');
    expect(g.usage).toMatchObject({ text: 1, inputTokens: 10, outputTokens: 5 });
    // Reasoning is asked low unless a call says otherwise.
    expect(calls[0].body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'low' });
  });

  it('uses the model a call asks for, counts reasoning and cache, and reports every call', async () => {
    const { calls, impl } = fakeFetch([{ status: 200, body: { candidates: [{ content: { parts: [{ text: 'ok' }] } }], usageMetadata: { promptTokenCount: 1000, cachedContentTokenCount: 600, candidatesTokenCount: 200, thoughtsTokenCount: 300 } } }]);
    const g = new GeminiModels({ textModel: 'gemini-3.1-flash-lite', imageModel: 'i', limits: { text: 5, images: 0 }, fetchImpl: impl, thinking: 'medium' });
    const seen: CallRecord[] = [];
    g.onCall = (r) => seen.push(r);
    await g.text({ agent: 'scultore', task: 'sculpt', system: 's', prompt: 'p', model: 'gemini-3.8-flash', thinking: 'off' });
    expect(calls[0].url).toContain('gemini-3.8-flash:generateContent');
    expect(calls[0].body.generationConfig.thinkingConfig).toBeUndefined();
    expect(seen).toEqual([{ model: 'gemini-3.8-flash', agent: 'scultore', task: 'sculpt', prompt: 1000, cached: 600, output: 200, thoughts: 300, retries: 0 }]);
    expect(g.usage).toMatchObject({ cachedTokens: 600, thoughtTokens: 300 });
  });

  it('never repeats a request that timed out (it may have been billed)', async () => {
    let n = 0;
    const impl = (async () => {
      n++;
      throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
    }) as unknown as typeof fetch;
    const g = new GeminiModels({ textModel: 'gemini-3.1-flash-lite', imageModel: 'i', limits: { text: 5, images: 0 }, fetchImpl: impl });
    const seen: CallRecord[] = [];
    g.onCall = (r) => seen.push(r);
    await expect(g.text({ agent: 'a', task: 't', system: '', prompt: '' })).rejects.toThrow(/tempo scaduto/);
    expect(n).toBe(1);
    expect(g.usage).toMatchObject({ timeouts: 1, failures: 1 });
    expect(seen[0].failed).toBe('timeout');
  });

  it('retries on 429 and returns images as data URLs', async () => {
    const { calls, impl } = fakeFetch([
      { status: 429, body: { error: { message: 'slow down' } } },
      { status: 200, body: { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAA' } }] } }] } },
    ]);
    const g = new GeminiModels({ textModel: 't', imageModel: 'gemini-3.1-flash-lite-image', limits: { text: 5, images: 5 }, fetchImpl: impl });
    expect(await g.image({ agent: 'artista', task: 'p', prompt: 'x' })).toBe('data:image/png;base64,AAA');
    expect(calls.length).toBe(2);
    expect(calls[1].body.generationConfig.responseModalities).toEqual(['IMAGE']);
  }, 10000);

  it('enforces the session budget', async () => {
    const { impl } = fakeFetch([textOk('{}')]);
    const g = new GeminiModels({ textModel: 't', imageModel: 'i', limits: { text: 1, images: 0 }, fetchImpl: impl });
    await g.text({ agent: 'a', task: 't', system: '', prompt: '' });
    await expect(g.text({ agent: 'a', task: 't', system: '', prompt: '' })).rejects.toBeInstanceOf(BudgetError);
    await expect(g.image({ agent: 'a', task: 't', prompt: '' })).rejects.toBeInstanceOf(BudgetError);
  });
});

describe('usage ledger', () => {
  it('prices every call by day, model and task, with cache and reasoning', () => {
    const l = new UsageLedger();
    l.record({ model: 'gemini-3.1-flash-lite', agent: 'cartografo', task: 'chunk.plan', prompt: 10_000, cached: 4_000, output: 1_000, thoughts: 2_000, day: '2026-10-22' });
    l.record({ model: 'gemini-3.8-flash', agent: 'scultore', task: 'sculpt', prompt: 20_000, cached: 0, output: 5_000, thoughts: 0, day: '2026-10-22' });
    l.record({ model: 'mistero', agent: 'x', task: 'y', prompt: 1, cached: 0, output: 1, thoughts: 0, day: '2026-10-22' });
    // (6000 × 0.25 + 4000 × 0.025 + 3000 × 1.5) / 1e6 and (20000 × 0.75 + 5000 × 3.75) / 1e6
    const a = (6000 * 0.25 + 4000 * 0.025 + 3000 * 1.5) / 1e6, b = (20000 * 0.75 + 5000 * 3.75) / 1e6;
    expect(l.day('2026-10-22').total.usd).toBeCloseTo(a + b, 9);
    expect(l.day('2026-10-22').total.unpriced).toBe(1);
    expect(l.tasks('2026-10-22')[0].task).toBe('sculpt');
    // Prices change on their date; models without a published price use the report's estimate.
    expect(costOf('gemini-3.8-flash', { prompt: 1e6, output: 0 }, '2027-01-02')).toBe(1.5);
    expect(priceOf('gemini-3.5-flash')?.note).toMatch(/stima/);
    const again = new UsageLedger();
    again.load(l.toJson());
    again.load(l.toJson());
    expect(again.day('2026-10-22').total.calls).toBe(6);
  });

  it('goes into the universe with every commit and survives a rollback', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    k.models.onCall!({ model: 'gemini-3.1-flash-lite', agent: 'narratore', task: 'npc.reply', prompt: 100, cached: 0, output: 50, thoughts: 0 });
    expect(k.saveUsage()).toBe(true);
    expect(JSON.parse(k.repo.head().files['world/consumi.json']!).prezzi).toBe('2026-10-22');
    k.models.onCall!({ model: 'gemini-3.1-flash-lite', agent: 'narratore', task: 'npc.reply', prompt: 100, cached: 0, output: 50, thoughts: 0 });
    k.rollback();
    expect(k.usage.session.calls).toBe(2);
    expect(k.saveUsage()).toBe(true);
    const day = Object.values(JSON.parse(k.repo.head().files['world/consumi.json']!).giorni)[0] as any;
    expect(day['gemini-3.1-flash-lite']['npc.reply'].calls).toBe(2);
  });
});

describe('helpers', () => {
  it('parses JSON answers with fences and prose', () => {
    expect(parseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJson('Ecco: {"b":2}')).toEqual({ b: 2 });
  });

  it('names colours for image legends', () => {
    expect(colorName('#3a78c8')).toBe('blue');
    expect(colorName('#1f5a2a')).toBe('dark green');
    expect(colorName('#8a8a92')).toBe('gray');
  });
});
