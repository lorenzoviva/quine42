import { describe, expect, it } from 'vitest';
import { GeminiModels } from '../src/kernel/ai/gemini';
import { BudgetError, parseJson } from '../src/kernel/ai/models';
import { colorName } from '../src/kernel/agents/council';

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
