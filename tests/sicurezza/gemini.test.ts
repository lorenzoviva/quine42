import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { accessRefusal, GeminiGate, geminiRoute, MAX_BODY, modelsOfConfig, type GateOptions } from '../../server/geminiProxy';
import { BudgetError } from '../../src/kernel/ai/models';
import { GeminiAiModels } from '../../src/kernel/ai/gemini';

// V-002: the key is spent only for the game and within the decided budgets. Fake upstream: no call ever reaches Gemini.

const KEY = 'chiave-finta-di-prova';
const MODEL = 'gemini-3.1-flash-lite';
const LOCAL = { host: 'localhost:5173', origin: 'http://localhost:5173', 'content-type': 'application/json' };

function upstream(answer: () => Response = () => okAnswer(1000, 1000)) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return answer();
  }) as unknown as typeof fetch;
  return { calls, impl };
}

const okAnswer = (prompt: number, output: number) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }], usageMetadata: { promptTokenCount: prompt, candidatesTokenCount: output } }), { status: 200 });

function gate(impl: typeof fetch, opts: GateOptions = {}) {
  return new GeminiGate({ apiKey: KEY, fetchImpl: impl, dailyCap: 10, today: () => '2026-11-01', ...opts });
}

/** A request as the route sees it, and what it answers. */
async function ask(g: GeminiGate, o: { url?: string; method?: string; headers?: Record<string, string>; body?: string; address?: string } = {}) {
  const req = new PassThrough() as any;
  req.url = o.url ?? `/api/gemini/models/${MODEL}:generateContent`;
  req.method = o.method ?? 'POST';
  req.headers = o.headers ?? LOCAL;
  req.socket = { remoteAddress: o.address ?? '127.0.0.1' };
  const answer = new Promise<{ status: number; text: string; headers: Record<string, string> }>((resolve, reject) => {
    const headers: Record<string, string> = {};
    const res: any = {
      statusCode: 200,
      setHeader: (k: string, v: string) => (headers[k.toLowerCase()] = v),
      end: (text: string) => resolve({ status: res.statusCode, text, headers }),
    };
    geminiRoute(g)(req, res, () => reject(new Error('passata oltre')));
  });
  req.end(o.body ?? '{}');
  return answer;
}

const dirs: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'gemini-gate-'));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('il proxy di Gemini', () => {
  it('V-002 da questa macchina e dalla stessa origine la richiesta arriva a Google, con la chiave solo lì', async () => {
    const { calls, impl } = upstream();
    const r = await ask(gate(impl), { body: '{"a":1}' });
    expect(r.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain(`/${MODEL}:generateContent`);
    expect(calls[0].url).not.toContain(KEY);
    expect((calls[0].init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY);
    expect(calls[0].init.body).toBe('{"a":1}');
    expect(r.text).not.toContain(KEY);
  });

  it('V-002 rifiuta chi non è su questa macchina, e chi ci arriva da un tunnel', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    for (const address of ['192.168.1.20', '8.8.8.8', '::ffff:10.0.0.3', '']) expect((await ask(g, { address })).status).toBe(403);
    expect((await ask(g, { headers: { ...LOCAL, 'x-forwarded-for': '8.8.8.8' } })).status).toBe(403);
    expect((await ask(g, { address: '192.168.1.20', url: '/api/gemini/status', method: 'GET' })).status).toBe(403);
    expect(calls).toHaveLength(0);
    for (const address of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) expect(accessRefusal({ headers: LOCAL, socket: { remoteAddress: address } })).toBeUndefined();
  });

  it('V-002 rifiuta un altro sito: per origine, per nome e per tipo del corpo', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    for (const origin of ['https://altro.example', 'http://localhost:9999', 'http://127.0.0.1:5173', 'http://localhost.altro.example:5173', 'null', 'non un url']) {
      expect((await ask(g, { headers: { ...LOCAL, origin } })).status, origin).toBe(403);
    }
    // A name of another site pointed at this machine.
    expect((await ask(g, { headers: { ...LOCAL, host: 'altro.example:5173', origin: 'http://altro.example:5173' } })).status).toBe(403);
    expect((await ask(g, { headers: { 'content-type': 'application/json' } })).status).toBe(403);
    // A form of another site, even without an Origin to look at.
    expect((await ask(g, { headers: { host: 'localhost:5173', 'content-type': 'text/plain' } })).status).toBe(415);
    expect(calls).toHaveLength(0);
    // No Origin at all is not a browser's POST: a process of this same machine.
    expect((await ask(g, { headers: { host: 'localhost:5173', 'content-type': 'application/json' } })).status).toBe(200);
  });

  it('V-002 rifiuta i modelli che non sono nei prezzi né in un universo', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    expect((await ask(g, { url: '/api/gemini/models/gemini-9-costosissimo:generateContent' })).status).toBe(403);
    expect((await ask(g, { url: '/api/gemini/models/altro-modello:generateContent' })).status).toBe(404);
    expect(calls).toHaveLength(0);
    for (const m of [MODEL, 'gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.5-flash']) expect(g.allows(m), m).toBe(true);
  });

  it('V-002 un modello chiesto da un universo è ammesso, e costa come il più caro', async () => {
    const dir = tempDir();
    mkdirSync(path.join(dir, 'aurora'));
    writeFileSync(path.join(dir, 'aurora', 'universe.json'), JSON.stringify({ ai: { textModel: 'gemini-5-nuovo', scultori: { figura: 'gemini-5-figure' } } }));
    const { impl } = upstream(() => okAnswer(1_000_000, 0));
    const g = gate(impl, { universesDir: dir });
    expect(g.allows('gemini-5-figure')).toBe(true);
    expect(g.allows('gemini-5-altro')).toBe(false);
    await g.forward('gemini-5-nuovo', '{}');
    expect(g.spentToday()).toBeGreaterThanOrEqual(2);
    expect(modelsOfConfig('non json')).toEqual([]);
  });

  it('V-002 rifiuta un corpo troppo grande, senza leggerlo tutto e senza chiamare Google', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    const big = 'x'.repeat(MAX_BODY + 1);
    const r = await ask(g, { body: big });
    expect(r.status).toBe(413);
    expect(r.headers.connection).toBe('close');
    expect((await ask(g, { headers: { ...LOCAL, 'content-length': String(MAX_BODY + 1) } })).status).toBe(413);
    expect((await g.forward(MODEL, big)).status).toBe(413);
    expect(MAX_BODY).toBeLessThanOrEqual(2 * 1024 * 1024);
    expect(calls).toHaveLength(0);
  });

  it('V-002 al tetto del giorno non spende più, e il giorno dopo riparte', async () => {
    let day = '2026-11-01';
    const { calls, impl } = upstream(() => okAnswer(2_000_000, 0));
    const g = gate(impl, { dailyCap: 1, today: () => day });
    expect((await ask(g)).status).toBe(200);
    expect(g.spentToday()).toBeCloseTo(0.5);
    expect((await ask(g)).status).toBe(200);
    const stopped = await ask(g);
    expect(stopped.status).toBe(402);
    expect(calls).toHaveLength(2);
    day = '2026-11-02';
    expect((await ask(g)).status).toBe(200);
    expect(calls).toHaveLength(3);
  });

  it('V-002 tante chiamate insieme non passano tutte sotto il tetto', async () => {
    const release: Array<() => void> = [];
    const impl = (() => new Promise<Response>((resolve) => release.push(() => resolve(okAnswer(10, 10))))) as unknown as typeof fetch;
    const g = gate(impl, { dailyCap: 0.05 });
    const all = Array.from({ length: 50 }, () => g.forward(MODEL, '{}'));
    await new Promise((r) => setTimeout(r, 0));
    expect(release.length).toBeGreaterThan(0);
    expect(release.length).toBeLessThan(50);
    release.forEach((f) => f());
    const statuses = (await Promise.all(all)).map((r) => r.status);
    expect(statuses.filter((s) => s === 402)).toHaveLength(50 - release.length);
    // What was only held is given back.
    expect(g.spentToday()).toBeLessThan(0.01);
  });

  it('V-002 ciò che fallisce senza risposta resta contato, ciò che Google rifiuta no', async () => {
    const down = gate((async () => {
      throw new Error('connessione caduta');
    }) as unknown as typeof fetch);
    await expect(down.forward(MODEL, '{}')).rejects.toThrow();
    expect(down.spentToday()).toBeGreaterThan(0);
    const refused = gate(upstream(() => new Response('{}', { status: 400 })).impl);
    expect((await refused.forward(MODEL, '{}')).status).toBe(400);
    expect(refused.spentToday()).toBe(0);
  });

  it('V-002 la spesa del giorno sopravvive a un riavvio, e non finisce in chiaro con la chiave', async () => {
    const ledgerFile = path.join(tempDir(), 'sotto', 'spesa.json');
    const { impl } = upstream(() => okAnswer(2_000_000, 0));
    await gate(impl, { ledgerFile, dailyCap: 1 }).forward(MODEL, '{}');
    expect(existsSync(ledgerFile)).toBe(true);
    expect(readFileSync(ledgerFile, 'utf8')).not.toContain(KEY);
    expect(gate(impl, { ledgerFile }).spentToday()).toBeCloseTo(0.5);
    expect(gate(impl, { ledgerFile, today: () => '2026-11-02' }).spentToday()).toBe(0);
  });

  it('V-002 senza chiave la rotta lo dice e non chiama nessuno; lo stato non la rivela mai', async () => {
    const { calls, impl } = upstream();
    const none = new GeminiGate({ fetchImpl: impl });
    expect((await ask(none)).status).toBe(503);
    expect(none.direct()).toBeUndefined();
    expect(calls).toHaveLength(0);
    const status = await ask(gate(impl), { url: '/api/gemini/status', method: 'GET' });
    expect(JSON.parse(status.text)).toEqual({ available: true });
  });
});

describe('Gemini in multigiocatore', () => {
  it('V-002 il server chiama Google senza passare da una rotta, con gli stessi limiti', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    const models = new GeminiAiModels({ fetchImpl: g.direct()!, textModel: MODEL, limits: { text: 5 } });
    expect(await models.text({ agent: 'narrator', task: 't', system: 's', prompt: 'p' })).toBe('ok');
    expect(calls[0].url).toMatch(/^https:\/\/generativelanguage\.googleapis\.com\/.*gemini-3\.1-flash-lite:generateContent$/);
    expect(g.spentToday()).toBeGreaterThan(0);
    await expect(models.text({ agent: 'narrator', task: 't', system: 's', prompt: 'p', model: 'gemini-9-costosissimo' })).rejects.toThrow(/403/);
    expect(calls).toHaveLength(1);
    // The world of many knows no route and no key: only the `fetch` it is handed.
    const host = readFileSync('src/session/host.ts', 'utf8');
    expect(host).not.toContain('/api/gemini');
    expect(host).not.toContain('GEMINI_API_KEY');
  });

  it('V-002 al tetto il kernel si ferma come a un budget, senza ripetere la chiamata', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl, { dailyCap: 0 });
    const models = new GeminiAiModels({ fetchImpl: g.direct()!, textModel: MODEL, limits: { text: 5 } });
    await expect(models.text({ agent: 'narrator', task: 't', system: 's', prompt: 'p' })).rejects.toBeInstanceOf(BudgetError);
    expect(calls).toHaveLength(0);
  });

  it('V-002 una connessione caduta arriva al kernel come tale: non si ripete', async () => {
    let n = 0;
    const g = gate((async () => {
      n++;
      throw new Error('connessione caduta');
    }) as unknown as typeof fetch);
    const models = new GeminiAiModels({ fetchImpl: g.direct()!, textModel: MODEL, limits: { text: 5 } });
    await expect(models.text({ agent: 'narrator', task: 't', system: 's', prompt: 'p' })).rejects.toThrow(/non ripetuta/);
    expect(n).toBe(1);
  });
});

describe('la rotta su HTTP vero, in locale', () => {
  it('V-002 risponde su loopback, e rifiuta un altro sito prima di chiamare Google', async () => {
    const { calls, impl } = upstream();
    const route = geminiRoute(gate(impl));
    const server = createServer((req, res) => route(req, res, () => res.end()));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const post = (origin: string) => fetch(`${base}/api/gemini/models/${MODEL}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: '{}' });
      expect((await post('https://altro.example')).status).toBe(403);
      expect(calls).toHaveLength(0);
      expect((await post(base)).status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(await (await fetch(`${base}/api/gemini/status`)).json()).toEqual({ available: true });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

describe('le cache esplicite nel varco (T351)', () => {
  const CACHED = 'gemini-3.8-flash';
  const written = (tokens = 1_000_000, name = 'cachedContents/abc') => () => new Response(JSON.stringify({ name, usageMetadata: { totalTokenCount: tokens } }), { status: 200 });
  const write = (o: Record<string, unknown> = {}) => JSON.stringify({ model: `models/${CACHED}`, systemInstruction: { parts: [{ text: 'istruzioni' }] }, ttl: '3600s', ...o });

  it('V-002 una cache si scrive solo per un modello con il prezzo della conservazione, con una durata limitata e un corpo rifatto', async () => {
    const { calls, impl } = upstream(written());
    const g = gate(impl);
    expect((await g.writeCache(write({ model: `models/${MODEL}` }))).status).toBe(403);
    expect((await g.writeCache(write({ model: 'models/gemini-9-costosissimo' }))).status).toBe(403);
    expect((await g.writeCache(write({ model: CACHED }))).status).toBe(403);
    for (const ttl of ['3601s', '86400s', '10s', '1h', 3600, '-5s']) expect((await g.writeCache(write({ ttl }))).status, String(ttl)).toBe(400);
    expect((await g.writeCache(write({ systemInstruction: { parts: [{ inlineData: { mimeType: 'image/png', data: 'QUJD' } }] } }))).status).toBe(400);
    expect((await g.writeCache(write({ systemInstruction: { parts: [{ text: 'a', fileData: {} }] } }))).status).toBe(400);
    expect((await g.writeCache('non json')).status).toBe(400);
    expect(calls).toHaveLength(0);
    // What reaches Google is only the model, the text and the ttl; the key only in the header.
    expect((await g.writeCache(write({ contents: [{ role: 'user', parts: [{ text: 'altro' }] }], tools: [{}], displayName: 'x' }))).status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/cachedContents');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ model: `models/${CACHED}`, systemInstruction: { parts: [{ text: 'istruzioni' }] }, ttl: '3600s' });
    expect((calls[0].init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY);
    expect(String(calls[0].init.body)).not.toContain(KEY);
  });

  it('V-002 la scrittura e la conservazione per tutta la durata stanno nel tetto del giorno', async () => {
    const { calls, impl } = upstream(written(1_000_000));
    const g = gate(impl, { dailyCap: 2 });
    expect((await g.writeCache(write())).status).toBe(200);
    // A million tokens: 0.75 $ written, 0.50 $ kept an hour.
    expect(g.spentToday()).toBeCloseTo(1.25);
    expect((await g.writeCache(write())).status).toBe(200);
    expect((await g.writeCache(write())).status).toBe(402);
    expect(calls).toHaveLength(2);
    // Refused by Google: nothing spent.
    const refused = gate(upstream(() => new Response('{}', { status: 400 })).impl);
    expect((await refused.writeCache(write())).status).toBe(400);
    expect(refused.spentToday()).toBe(0);
    expect(refused.liveCaches()).toBe(0);
  });

  it('V-002 una chiamata nomina solo una cache scritta da questo varco, per il suo modello, finché vive', async () => {
    let now = 0;
    const { calls, impl } = upstream(written());
    const g = gate(impl, { now: () => now });
    const named = (name: string) => JSON.stringify({ cachedContent: name, contents: [] });
    expect((await g.forward(CACHED, named('cachedContents/altrui'))).status).toBe(404);
    expect(calls).toHaveLength(0);
    await g.writeCache(write());
    expect((await g.forward(CACHED, named('cachedContents/abc'))).status).toBe(200);
    expect((await g.forward('gemini-4-argon', named('cachedContents/abc'))).status).toBe(404);
    expect((await g.forward(CACHED, JSON.stringify({ cachedContent: 42 }))).status).toBe(404);
    now = 3600 * 1000;
    expect((await g.forward(CACHED, named('cachedContents/abc'))).status).toBe(404);
    expect(g.liveCaches()).toBe(0);
    // A prompt that only speaks of caches is not refused.
    expect((await g.forward(CACHED, JSON.stringify({ contents: [{ parts: [{ text: 'cachedContent' }] }] }))).status).toBe(200);
  });

  it('V-002 la rotta e la porta dei mondi di molti portano la scrittura al varco, con gli stessi limiti', async () => {
    const { calls, impl } = upstream(written(1000));
    const g = gate(impl);
    expect((await ask(g, { url: '/api/gemini/cachedContents', body: write() })).status).toBe(200);
    expect((await ask(g, { url: '/api/gemini/cachedContents', body: write(), headers: { ...LOCAL, origin: 'https://altro.example' } })).status).toBe(403);
    expect((await ask(g, { url: '/api/gemini/cachedContents', body: write(), address: '8.8.8.8' })).status).toBe(403);
    expect((await ask(g, { url: '/api/gemini/cachedContents', method: 'GET' })).status).toBe(404);
    expect((await ask(g, { url: '/api/gemini/cachedContents/abc', body: '{}' })).status).toBe(404);
    expect(calls).toHaveLength(1);
    const direct = g.direct()!;
    expect((await direct('/api/gemini/cachedContents', { method: 'POST', body: write({ ttl: '99999s' }) })).status).toBe(400);
    expect((await direct('/api/gemini/cachedContents', { method: 'POST', body: write() })).status).toBe(200);
    expect(calls).toHaveLength(2);
  });
});
