import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { jevRequest, TypeSafeGate, typesafeRoute, type TypeSafeGateOptions } from '../../server/typesafeProxy';
import { BudgetError } from '../../src/kernel/ai/models';
import { JEV_MAX_BODY, JEV_MODEL, JevDecisionModels, type DecisionCall } from '../../src/kernel/ai/decisions';

// V-034: TypeSafe's key is spent only for the game, within its cap, and never reaches a browser or a world. Fake upstream: nothing reaches TypeSafe.

const KEY = 'chiave-finta-typesafe';
const LOCAL = { host: 'localhost:5173', origin: 'http://localhost:5173', 'content-type': 'application/json' };
const BODY = JSON.stringify({ model: JEV_MODEL, state: { luogo: 'piazza' }, questions: { fits: { type: 'noul', instructions: 'Does it fit?' } } });

function upstream(answer: () => Response = () => okAnswer(1000)) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return answer();
  }) as unknown as typeof fetch;
  return { calls, impl };
}

const okAnswer = (input: number) => new Response(JSON.stringify({ model: JEV_MODEL, answers: { fits: { noul: 0.8 } }, usage: { input_tokens: input, output_tokens: 50 } }), { status: 200 });

const gate = (impl: typeof fetch, opts: TypeSafeGateOptions = {}) => new TypeSafeGate({ apiKey: KEY, fetchImpl: impl, dailyCap: 1, today: () => '2026-11-12', ...opts });

async function ask(g: TypeSafeGate, o: { url?: string; method?: string; headers?: Record<string, string>; body?: string; address?: string } = {}) {
  const req = new PassThrough() as any;
  req.url = o.url ?? '/api/typesafe/v1/systemone';
  req.method = o.method ?? 'POST';
  req.headers = o.headers ?? LOCAL;
  req.socket = { remoteAddress: o.address ?? '127.0.0.1' };
  const answer = new Promise<{ status: number; text: string }>((resolve, reject) => {
    const res: any = { statusCode: 200, setHeader: () => undefined, end: (text: string) => resolve({ status: res.statusCode, text }) };
    typesafeRoute(g)(req, res, () => reject(new Error('passata oltre')));
  });
  req.end(o.body ?? BODY);
  return answer;
}

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('il varco di TypeSafe', () => {
  it('V-034 da questa macchina la richiesta arriva a TypeSafe rifatta, con la chiave solo nell’intestazione', async () => {
    const { calls, impl } = upstream();
    const r = await ask(gate(impl));
    expect(r.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.typesafe.ai/v1/systemone');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    expect(JSON.parse(String(calls[0].init.body))).toEqual(JSON.parse(BODY));
    expect(String(calls[0].init.body)).not.toContain(KEY);
    expect(r.text).not.toContain(KEY);
  });

  it('V-034 rifiuta chi non è su questa macchina, un tunnel, un altro sito e un tipo che non è JSON', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    for (const address of ['192.168.1.20', '8.8.8.8', '']) expect((await ask(g, { address })).status).toBe(403);
    expect((await ask(g, { headers: { ...LOCAL, 'x-forwarded-for': '8.8.8.8' } })).status).toBe(403);
    expect((await ask(g, { headers: { ...LOCAL, origin: 'https://altro.example' } })).status).toBe(403);
    expect((await ask(g, { headers: { ...LOCAL, 'content-type': 'text/plain' } })).status).toBe(415);
    expect((await ask(g, { address: '8.8.8.8', url: '/api/typesafe/status', method: 'GET' })).status).toBe(403);
    expect((await ask(g, { url: '/api/typesafe/v1/altro' })).status).toBe(404);
    expect((await ask(g, { method: 'GET' })).status).toBe(404);
    expect(calls).toHaveLength(0);
  });

  it('V-034 senza chiave non chiama nessuno; lo stato non la rivela', async () => {
    const { calls, impl } = upstream();
    const none = new TypeSafeGate({ fetchImpl: impl });
    expect((await ask(none)).status).toBe(503);
    expect(none.direct()).toBeUndefined();
    expect(calls).toHaveLength(0);
    const status = await ask(gate(impl), { url: '/api/typesafe/status', method: 'GET' });
    expect(JSON.parse(status.text)).toEqual({ available: true });
  });

  it('V-034 solo le versioni fisse di Jev, solo modello, stato e domande: niente immagini, niente campi in più', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    const q = { fits: { type: 'noul', instructions: 'x' } };
    for (const model of ['jev-preview', 'jev-latest', 'gemini-3.1-flash-lite', 'jev-9.0.0', '']) expect((await ask(g, { body: JSON.stringify({ model, state: {}, questions: q }) })).status, model).toBe(403);
    expect((await ask(g, { body: JSON.stringify({ model: JEV_MODEL, state: {}, questions: q, assets: { img: { type: 'image', data_base64: 'AAAA' } } }) })).status).toBe(400);
    expect((await ask(g, { body: JSON.stringify({ model: JEV_MODEL, state: {}, questions: { a: { type: 'testo', instructions: 'scrivi' } } }) })).status).toBe(400);
    expect((await ask(g, { body: JSON.stringify({ model: JEV_MODEL, state: {}, questions: {} }) })).status).toBe(400);
    expect((await ask(g, { body: 'non json' })).status).toBe(400);
    expect(calls).toHaveLength(0);
    expect(jevRequest(JSON.stringify({ model: JEV_MODEL, questions: q }))).toEqual({ model: JEV_MODEL, body: JSON.stringify({ model: JEV_MODEL, state: null, questions: q }) });
  });

  it('V-034 un corpo troppo grande si rifiuta prima di leggerlo tutto', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    const big = JSON.stringify({ model: JEV_MODEL, state: 'x'.repeat(JEV_MAX_BODY), questions: { a: { type: 'noul', instructions: 'x' } } });
    expect((await ask(g, { body: big })).status).toBe(413);
    expect((await ask(g, { body: big, headers: { ...LOCAL, 'content-length': String(big.length) } })).status).toBe(413);
    expect((await g.forward(big)).status).toBe(413);
    expect(calls).toHaveLength(0);
  });

  it('V-034 il tetto del giorno: oltre, 402 senza chiamare; la spesa resta dopo un riavvio e torna a zero il giorno dopo', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'typesafe-gate-'));
    dirs.push(dir);
    const ledgerFile = path.join(dir, '.typesafe-spend.json');
    // A million tokens at 0.042 $: three answers are past a cap of 0.1 $.
    const { calls, impl } = upstream(() => okAnswer(1_000_000));
    const g = gate(impl, { dailyCap: 0.1, ledgerFile });
    for (let i = 0; i < 3; i++) expect((await ask(g)).status).toBe(200);
    expect(g.spentToday()).toBeCloseTo(0.126, 6);
    expect((await ask(g)).status).toBe(402);
    expect(calls).toHaveLength(3);
    expect(JSON.parse(readFileSync(ledgerFile, 'utf8'))).toEqual({ day: '2026-11-12', spent: g.spentToday() });
    expect(gate(impl, { dailyCap: 0.1, ledgerFile }).spentToday()).toBeCloseTo(0.126, 6);
    expect(gate(impl, { dailyCap: 0.1, ledgerFile, today: () => '2026-11-13' }).spentToday()).toBe(0);
    // A refusal of TypeSafe is not billed.
    const refused = upstream(() => new Response('{"detail":"no"}', { status: 401 }));
    const r = gate(refused.impl);
    expect((await ask(r)).status).toBe(401);
    expect(r.spentToday()).toBe(0);
  });
});

describe('TypeSafe nei mondi di molti', () => {
  const CALL: DecisionCall = { agent: 'sculptor', task: 'model.reuse', state: { asked: 'botte' }, questions: { fits: { type: 'noul', instructions: 'Does it fit?' } }, rule: { fits: false } };

  it('V-034 il mondo chiede per il canale, senza rotta né chiave', async () => {
    const { calls, impl } = upstream();
    const g = gate(impl);
    const jev = new JevDecisionModels({ fetchImpl: g.direct()!, endpoint: 'typesafe:' });
    expect(await jev.decide(CALL)).toEqual({ fits: true });
    expect(calls[0].url).toBe('https://api.typesafe.ai/v1/systemone');
    expect(g.spentToday()).toBeGreaterThan(0);
    expect((await g.direct()!('typesafe:/altro', { method: 'POST', body: BODY })).status).toBe(404);
    expect(calls).toHaveLength(1);
    for (const file of ['src/session/host.ts', 'src/session/worldProcess.ts', 'src/kernel/ai/decisions.ts', 'src/main.ts']) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toContain('TYPESAFE_KEY');
      expect(text, file).not.toContain('api.typesafe.ai');
    }
  });

  it('V-034 al tetto il kernel si ferma come a un budget, senza ripetere', async () => {
    const { calls, impl } = upstream();
    const jev = new JevDecisionModels({ fetchImpl: gate(impl, { dailyCap: 0 }).direct()!, endpoint: 'typesafe:' });
    await expect(jev.decide(CALL)).rejects.toBeInstanceOf(BudgetError);
    expect(calls).toHaveLength(0);
  });
});

describe('la rotta su HTTP vero, in locale', () => {
  it('V-034 risponde su loopback, e rifiuta un altro sito prima di chiamare TypeSafe', async () => {
    const { calls, impl } = upstream();
    const route = typesafeRoute(gate(impl));
    const server = createServer((req, res) => route(req, res, () => res.end()));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const post = (origin: string) => fetch(`${base}/api/typesafe/v1/systemone`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: BODY });
      expect((await post('https://altro.example')).status).toBe(403);
      expect(calls).toHaveLength(0);
      expect((await post(base)).status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(await (await fetch(`${base}/api/typesafe/status`)).json()).toEqual({ available: true });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
