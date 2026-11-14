import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { CALL_PACE, chatRequest, decisionRequest, keyFingerprint, OpenRouterGate, openrouterRoute, PAID_BY_HEADER, PAYERS_HEADER, payersIn, worldsPayWith, type OpenRouterGateOptions } from '../../server/openrouterProxy';
import { productionProblems } from '../../server/production';
import { worldEnv } from '../../server/worldHost';
import type { AccountSettings } from '../../server/account';
import { BudgetError } from '../../src/kernel/ai/models';
import { OpenRouterAiModels, OpenRouterDecisionModels } from '../../src/kernel/ai/openrouter';
import type { CallRecord } from '../../src/kernel/ai/usage';
import { JEV_MODEL, type DecisionCall } from '../../src/kernel/ai/decisions';

// V-040 (T363, ADR-0197): a key of OpenRouter is spent only for the game, only by the gate, only for whoever it belongs to. A player's key lives
// in the memory of the server, never on disk, in a log, in an answer, in a world or in a browser: elsewhere only its SHA-256. Fake OpenRouter:
// nothing leaves the machine.

const ANNA = 'sk-or-v1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const BRUNO = 'sk-or-v1-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const SERVER = 'sk-or-v1-ssssssssssssssssssssssssssssssss';
const VERIFIER = 'v'.repeat(43);
const LOCAL = { host: 'localhost:5173', origin: 'http://localhost:5173', 'content-type': 'application/json' };
const CHAT = JSON.stringify({ model: 'google/gemini-3.1-flash-lite', messages: [{ role: 'user', content: 'ciao' }], temperature: 0.8 });
const DECISION = JSON.stringify({ model: 'typesafe/jev-1.13', state: { x: 1 }, questions: { fits: { type: 'noul', instructions: 'Does it fit?' } } });

const completion = (cost = 0.001) => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'ok' } }], usage: { prompt_tokens: 100, completion_tokens: 10, cost } });
const decided = () => JSON.stringify({ answers: { fits: { noul: 0.9 } }, usage: { input_tokens: 100, output_tokens: 0, cost: 0.000004 } });

/** OpenRouter as the gate sees it: every request kept with its key, the answer by url and by key. */
function upstream(answer: (url: string, key: string | undefined, n: number) => Response = () => new Response(completion(), { status: 200 })) {
  const calls: Array<{ url: string; key?: string; body: any }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    const auth = (init.headers as Record<string, string> | undefined)?.Authorization;
    const key = auth?.replace(/^Bearer /, '');
    calls.push({ url, key, body: JSON.parse(String(init.body)) });
    return answer(url, key, calls.length);
  }) as unknown as typeof fetch;
  return { calls, impl };
}

const gateOf = (impl: typeof fetch, opts: OpenRouterGateOptions = {}) => new OpenRouterGate({ fetchImpl: impl, today: () => '2026-11-14', ...opts });

const accounts: AccountSettings = { config: {}, verify: async (token) => (/^tok-(\w+)$/.test(token) ? { uid: token.slice(4), anonymous: token === 'tok-ospite' } : undefined) };

async function ask(route: ReturnType<typeof openrouterRoute>, o: { url?: string; method?: string; headers?: Record<string, string>; body?: string; address?: string } = {}) {
  const req = new PassThrough() as any;
  req.url = o.url ?? '/api/openrouter/status';
  req.method = o.method ?? 'GET';
  req.headers = o.headers ?? LOCAL;
  req.socket = { remoteAddress: o.address ?? '127.0.0.1' };
  const answer = new Promise<{ status: number; text: string; headers: Record<string, string> }>((resolve, reject) => {
    const headers: Record<string, string> = {};
    const res: any = { statusCode: 200, setHeader: (k: string, v: string) => void (headers[k.toLowerCase()] = v), end: (text: string) => resolve({ status: res.statusCode, text, headers }) };
    route(req, res, () => reject(new Error('passata oltre')));
  });
  req.end(o.body ?? '');
  return answer;
}

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('V-040 il varco di OpenRouter: le chiavi dei giocatori', () => {
  it('V-040 una chiave si collega solo con un account (o l’id detto da questa macchina); lo stato e il collegamento non la dicono mai, solo l’impronta', async () => {
    const { calls, impl } = upstream();
    const g = gateOf(impl);
    const route = openrouterRoute(g, { access: { accounts, internal: 'x' } });
    const bearer = (t: string) => ({ ...LOCAL, authorization: `Bearer ${t}` });
    // Without a token: nobody in particular, nothing to link to.
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', body: JSON.stringify({ key: ANNA }) })).status).toBe(403);
    // A token that is not one.
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: bearer('falso'), body: JSON.stringify({ key: ANNA }) })).status).toBe(401);
    // Pasted (the fallback, ADR-0184 punto 2): kept, and only its fingerprint comes back.
    const linked = await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: bearer('tok-anna'), body: JSON.stringify({ key: ANNA }) });
    expect(linked.status).toBe(200);
    expect(JSON.parse(linked.text)).toEqual({ linked: true, fingerprint: keyFingerprint(ANNA) });
    expect(linked.text).not.toContain(ANNA);
    const status = await ask(route, { headers: bearer('tok-anna') });
    expect(JSON.parse(status.text)).toEqual({ available: true, linked: true, server: false, fingerprint: keyFingerprint(ANNA), exhausted: false });
    expect(status.text).not.toContain(ANNA);
    // Another account sees nothing of hers; an anonymous one may link their own (D52.4).
    expect(JSON.parse((await ask(route, { headers: bearer('tok-bruno') })).text)).toEqual({ available: false, linked: false, server: false });
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: bearer('tok-ospite'), body: JSON.stringify({ key: BRUNO }) })).status).toBe(200);
    // A key that is not one is not kept; a body that is not JSON neither.
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: bearer('tok-bruno'), body: JSON.stringify({ key: 'AIza-chiave-di-google' }) })).status).toBe(400);
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: { ...bearer('tok-bruno'), 'content-type': 'text/plain' }, body: ANNA })).status).toBe(415);
    expect(g.keyOf('bruno')).toBeUndefined();
    // Forgotten on request.
    expect(JSON.parse((await ask(route, { url: '/api/openrouter/key', method: 'DELETE', headers: bearer('tok-anna') })).text)).toEqual({ forgotten: true });
    expect(g.keyOf('anna')).toBeUndefined();
    expect(calls).toHaveLength(0);
    // Another site's page, whatever token it has.
    expect((await ask(route, { headers: { ...bearer('tok-anna'), origin: 'https://altro.example' } })).status).toBe(403);
  });

  it('V-040 il flusso PKCE: lo scambio lo fa il server con lo `state` che ha dato, una volta; la chiave che torna non arriva al browser', async () => {
    const { calls, impl } = upstream((url) => new Response(url.endsWith('/v1/auth/keys') ? JSON.stringify({ key: ANNA }) : completion(), { status: 200 }));
    const g = gateOf(impl);
    const route = openrouterRoute(g, { access: { accounts, internal: 'x' } });
    const anna = { ...LOCAL, authorization: 'Bearer tok-anna' };
    const begun = await ask(route, { url: '/api/openrouter/begin', method: 'POST', headers: anna });
    const { state } = JSON.parse(begun.text);
    expect(state).toMatch(/^[a-f0-9]{32}$/);
    // A code with a state this server did not give, or another wanderer's: no exchange.
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: anna, body: JSON.stringify({ code: 'codice-1', verifier: VERIFIER, state: 'f'.repeat(32) }) })).status).toBe(400);
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: { ...LOCAL, authorization: 'Bearer tok-bruno' }, body: JSON.stringify({ code: 'codice-1', verifier: VERIFIER, state }) })).status).toBe(400);
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: anna, body: JSON.stringify({ code: 'codice-1', verifier: 'corto', state }) })).status).toBe(400);
    expect(calls).toHaveLength(0);
    const r = await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: anna, body: JSON.stringify({ code: 'codice-1', verifier: VERIFIER, state }) });
    expect(r.status).toBe(200);
    expect(JSON.parse(r.text)).toEqual({ linked: true, fingerprint: keyFingerprint(ANNA) });
    expect(r.text).not.toContain(ANNA);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://openrouter.ai/api/v1/auth/keys');
    expect(calls[0].body).toEqual({ code: 'codice-1', code_verifier: VERIFIER, code_challenge_method: 'S256' });
    expect(calls[0].key).toBeUndefined();
    // The same state a second time is spent.
    expect((await ask(route, { url: '/api/openrouter/key', method: 'POST', headers: anna, body: JSON.stringify({ code: 'codice-2', verifier: VERIFIER, state }) })).status).toBe(400);
    expect(calls).toHaveLength(1);
    // A flow begun too long ago is gone.
    let now = 0;
    const slow = gateOf(impl, { now: () => now });
    const { state: old } = slow.beginFlow('anna');
    now = 11 * 60 * 1000;
    expect(await slow.exchange('anna', { code: 'codice-3', verifier: VERIFIER, state: old })).toMatchObject({ status: 400 });
    // OpenRouter refusing the code: nothing kept, and its words do not reach the browser as they are.
    const refusing = upstream(() => new Response(JSON.stringify({ error: 'bad code sk-or-xxx' }), { status: 400 }));
    const r2 = gateOf(refusing.impl);
    const { state: s2 } = r2.beginFlow('anna');
    const out = await r2.exchange('anna', { code: 'codice-4', verifier: VERIFIER, state: s2 });
    expect(out).toMatchObject({ status: 400 });
    expect(JSON.stringify(out)).not.toContain('sk-or-xxx');
    expect(r2.keyOf('anna')).toBeUndefined();
  });

  it('V-040 le porte delle chiavi hanno un ritmo per account', async () => {
    const g = gateOf(upstream().impl);
    const route = openrouterRoute(g, { access: { accounts, internal: 'x' }, keyPace: { burst: 2, perSecond: 0 } });
    const anna = { ...LOCAL, authorization: 'Bearer tok-anna' };
    expect((await ask(route, { url: '/api/openrouter/begin', method: 'POST', headers: anna })).status).toBe(200);
    expect((await ask(route, { url: '/api/openrouter/begin', method: 'POST', headers: anna })).status).toBe(200);
    expect((await ask(route, { url: '/api/openrouter/begin', method: 'POST', headers: anna })).status).toBe(429);
    // The status has no rhythm of its own, and another account has its own.
    expect((await ask(route, { headers: anna })).status).toBe(200);
    expect((await ask(route, { url: '/api/openrouter/begin', method: 'POST', headers: { ...LOCAL, authorization: 'Bearer tok-bruno' } })).status).toBe(200);
  });

  it('V-040 le porte dei modelli: solo da questa macchina e dalla stessa origine, solo JSON, mai in produzione; chi gioca qui paga con la sua chiave, mai con quella di un altro', async () => {
    const { calls, impl } = upstream();
    const g = gateOf(impl);
    g.setKey('anna', ANNA);
    g.setKey('bruno', BRUNO);
    const route = openrouterRoute(g, { access: { accounts, internal: 'x' }, models: true });
    const chat = (headers: Record<string, string>, more: Record<string, unknown> = {}) => ask(route, { url: '/api/openrouter/v1/chat/completions', method: 'POST', headers, body: CHAT, ...more });
    for (const address of ['192.168.1.20', '8.8.8.8', '']) expect((await chat(LOCAL, { address })).status).toBe(403);
    expect((await chat({ ...LOCAL, 'x-forwarded-for': '8.8.8.8' })).status).toBe(403);
    expect((await chat({ ...LOCAL, origin: 'https://altro.example' })).status).toBe(403);
    expect((await chat({ ...LOCAL, 'content-type': 'text/plain' })).status).toBe(415);
    expect(calls).toHaveLength(0);
    // Anna, with her token: her key, whatever the page names in the header.
    const r = await chat({ ...LOCAL, authorization: 'Bearer tok-anna', [PAYERS_HEADER]: 'bruno' });
    expect(r.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].key).toBe(ANNA);
    expect(r.headers[PAID_BY_HEADER]).toBe('anna');
    // Somebody without a key of their own, and no key of the server's: nothing can pay.
    expect((await chat({ ...LOCAL, authorization: 'Bearer tok-carla', [PAYERS_HEADER]: 'anna,bruno' })).status).toBe(503);
    expect(calls).toHaveLength(1);
    // The production server has no model doors.
    const production = openrouterRoute(g, { access: { accounts, internal: 'x' } });
    expect((await ask(production, { url: '/api/openrouter/v1/chat/completions', method: 'POST', headers: { ...LOCAL, authorization: 'Bearer tok-anna' }, body: CHAT })).status).toBe(404);
    expect((await ask(production, { url: '/api/openrouter/alpha/decisions', method: 'POST', headers: { ...LOCAL, authorization: 'Bearer tok-anna' }, body: DECISION })).status).toBe(404);
    expect(calls).toHaveLength(1);
  });

  it('V-040 i corpi si rifanno campo per campo: modelli a elenco, niente ripieghi su altri modelli, la ritenzione zero per Jev', () => {
    const ok = chatRequest(JSON.stringify({ model: 'google/gemini-3.8-flash', messages: [{ role: 'user', content: 'x' }], models: ['openai/gpt-5'], route: 'fallback', plugins: [{ id: 'web' }], provider: { data_collection: 'allow', allow_fallbacks: true }, transforms: ['middle-out'] }));
    expect('body' in ok && JSON.parse(ok.body)).toEqual({ model: 'google/gemini-3.8-flash', messages: [{ role: 'user', content: 'x' }], provider: { require_parameters: true, data_collection: 'deny' } });
    for (const model of ['openrouter/auto', 'google/gemini-3.8-flash:nitro', '~google/gemini-latest', 'gemini-3.8-flash', '']) expect(chatRequest(JSON.stringify({ model, messages: [{ role: 'user', content: 'x' }] })), model).toMatchObject({ status: 403 });
    expect(chatRequest(JSON.stringify({ model: 'google/gemini-3.8-flash' }))).toMatchObject({ status: 400 });
    expect(chatRequest('no')).toMatchObject({ status: 400 });
    const d = decisionRequest(JSON.stringify({ model: 'typesafe/jev-1.14', state: 's', questions: { a: { type: 'choice', options: {} } }, provider: { zdr: false }, assets: { img: {} } }));
    expect('body' in d && JSON.parse(d.body)).toEqual({ model: 'typesafe/jev-1.14', state: 's', questions: { a: { type: 'choice', options: {} } }, provider: { zdr: true } });
    for (const model of ['~typesafe/jev-latest', 'jev-1.13.0', 'google/gemini-3.8-flash']) expect(decisionRequest(JSON.stringify({ model, state: 's', questions: { a: { type: 'noul' } } })), model).toMatchObject({ status: 403 });
    expect(decisionRequest(JSON.stringify({ model: 'typesafe/jev-1.13', state: 's', questions: { a: { type: 'testo' } } }))).toMatchObject({ status: 400 });
    expect(decisionRequest(JSON.stringify({ model: 'typesafe/jev-1.13', state: 's', questions: {} }))).toMatchObject({ status: 400 });
    expect(payersIn('anna, bruno,Carla,../x,me')).toEqual(['anna', 'bruno', 'me']);
    expect(payersIn(undefined)).toEqual([]);
  });

  it('V-040 per il canale: la chiamata va sulla prima chiave di chi può pagare; un 402 la mette fuori dal turno e passa alla seguente, un 401 la dimentica; il mondo sa chi ha pagato, mai la chiave', async () => {
    const changes: string[] = [];
    const { calls, impl } = upstream((_url, key) => {
      if (key === ANNA) return new Response(JSON.stringify({ error: { message: 'insufficient credits' } }), { status: 402 });
      if (key === BRUNO) return new Response(JSON.stringify({ error: { message: 'revoked' } }), { status: 401 });
      return new Response(completion(), { status: 200 });
    });
    const g = gateOf(impl);
    g.onChange = (k) => void changes.push(JSON.stringify(k));
    g.setKey('anna', ANNA);
    g.setKey('bruno', BRUNO);
    g.setKey('carla', 'sk-or-v1-cccccccccccccccccccccccccccccccc');
    expect(g.holders()).toEqual({ holders: ['anna', 'bruno', 'carla'], exhausted: [] });
    const door = g.direct();
    const r = await door('openrouter:/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', [PAYERS_HEADER]: 'anna,bruno,carla' }, body: CHAT });
    expect(r.status).toBe(200);
    expect(r.headers.get(PAID_BY_HEADER)).toBe('carla');
    expect(calls.map((c) => c.key)).toEqual([ANNA, BRUNO, 'sk-or-v1-cccccccccccccccccccccccccccccccc']);
    expect(g.holders()).toEqual({ holders: ['carla'], exhausted: ['anna'] });
    expect(g.keyOf('bruno')).toBeUndefined();
    expect(changes.at(-1)).toBe(JSON.stringify({ holders: ['carla'], exhausted: ['anna'] }));
    expect(await r.text()).not.toContain('sk-or');
    // Anna is out of the turn until she brings a key again; a new key puts her back.
    expect((await door('openrouter:/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', [PAYERS_HEADER]: 'anna' }, body: CHAT })).status).toBe(402);
    expect(calls).toHaveLength(3);
    g.setKey('anna', 'sk-or-v1-a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2');
    expect(g.holders()).toEqual({ holders: ['anna', 'carla'], exhausted: [] });
    // Nobody named who can pay, and no key of the server's.
    expect((await door('openrouter:/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', [PAYERS_HEADER]: 'dario' }, body: CHAT })).status).toBe(402);
    expect((await door('openrouter:/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: CHAT })).status).toBe(503);
    expect((await door('openrouter:/altro', { method: 'POST', body: CHAT })).status).toBe(404);
    expect(calls).toHaveLength(3);
    // Jev's door, the same way.
    const j = await door('openrouter:/alpha/decisions', { method: 'POST', headers: { 'Content-Type': 'application/json', [PAYERS_HEADER]: 'carla' }, body: DECISION });
    expect(j.status).toBe(200);
    expect(calls.at(-1)?.url).toBe('https://openrouter.ai/api/alpha/decisions');
    expect(calls.at(-1)?.body.provider).toEqual({ zdr: true });
  });

  it('V-040 gli adattatori del mondo: un 402 sulla propria chiave è un budget, non una ripetizione; chi ha pagato entra nel registro', async () => {
    const { calls, impl } = upstream((url, key) => (key === ANNA ? new Response(JSON.stringify({ error: { message: 'no credits' } }), { status: 402 }) : new Response(url.includes('decisions') ? decided() : completion(), { status: 200 })));
    const g = gateOf(impl);
    g.setKey('anna', ANNA);
    g.setKey('bruno', BRUNO);
    const records: CallRecord[] = [];
    const models = new OpenRouterAiModels({ fetchImpl: g.direct(), endpoint: 'openrouter:', textModel: 'gemini-3.1-flash-lite', limits: { text: 10 }, keyPayers: (chi) => (chi === 'comune' ? ['anna', 'bruno'] : [chi]) });
    models.onCall = (r) => void records.push(r);
    expect(await models.text({ agent: 'narrator', task: 'npc.reply', system: 's', prompt: 'p', chi: 'bruno' })).toBe('ok');
    expect(records.at(-1)).toMatchObject({ who: 'bruno', paidBy: 'bruno', usd: 0.001 });
    await expect(models.text({ agent: 'narrator', task: 'npc.reply', system: 's', prompt: 'p', chi: 'anna' })).rejects.toBeInstanceOf(BudgetError);
    expect(g.holders()).toEqual({ holders: ['bruno'], exhausted: ['anna'] });
    // The commons: anna first in the turn, her key says 402, bruno's pays; the record says so.
    expect(await models.text({ agent: 'narrator', task: 'plot.weave', system: 's', prompt: 'p', chi: 'comune' })).toBe('ok');
    expect(records.at(-1)).toMatchObject({ who: 'comune', paidBy: 'bruno' });
    expect(calls.filter((c) => c.key === ANNA)).toHaveLength(1);
    const jev = new OpenRouterDecisionModels({ fetchImpl: g.direct(), endpoint: 'openrouter:', keyPayers: () => ['bruno'] });
    jev.onCall = (r) => void records.push(r);
    const call: DecisionCall = { agent: 'sculptor', task: 'model.reuse', state: { asked: 'botte' }, questions: { fits: { type: 'noul', instructions: 'Does it fit?' } }, rule: { fits: false }, chi: 'comune', model: JEV_MODEL };
    expect(await jev.decide(call)).toEqual({ fits: true });
    expect(records.at(-1)).toMatchObject({ model: 'typesafe/jev-1.13', paidBy: 'bruno' });
  });

  it('V-040 la chiave del server: le spese comuni di chi ospita, entro un tetto al giorno che resta dopo un riavvio; con un ritmo per chiave', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'openrouter-gate-'));
    dirs.push(dir);
    const ledgerFile = path.join(dir, '.openrouter-spend.json');
    const { calls, impl } = upstream(() => new Response(completion(0.04), { status: 200 }));
    const g = gateOf(impl, { apiKey: SERVER, dailyCap: 0.1, ledgerFile });
    const door = g.direct();
    for (let i = 0; i < 3; i++) expect((await door('openrouter:/v1/chat/completions', { method: 'POST', body: CHAT })).status).toBe(200);
    expect(g.spentToday()).toBeCloseTo(0.12, 6);
    expect((await door('openrouter:/v1/chat/completions', { method: 'POST', body: CHAT })).status).toBe(402);
    expect(calls).toHaveLength(3);
    expect(calls.every((c) => c.key === SERVER)).toBe(true);
    expect(JSON.parse(readFileSync(ledgerFile, 'utf8'))).toEqual({ day: '2026-11-14', spent: g.spentToday() });
    expect(gateOf(impl, { apiKey: SERVER, dailyCap: 0.1, ledgerFile }).spentToday()).toBeCloseTo(0.12, 6);
    expect(gateOf(impl, { apiKey: SERVER, dailyCap: 0.1, ledgerFile, today: () => '2026-11-15' }).spentToday()).toBe(0);
    // A player's key is not under the server's cap, and the server's key never pays for a wanderer named.
    g.setKey('anna', ANNA);
    expect((await door('openrouter:/v1/chat/completions', { method: 'POST', headers: { [PAYERS_HEADER]: 'anna' }, body: CHAT })).status).toBe(200);
    expect(calls.at(-1)?.key).toBe(ANNA);
    expect((await door('openrouter:/v1/chat/completions', { method: 'POST', headers: { [PAYERS_HEADER]: 'bruno' }, body: CHAT })).status).toBe(402);
    // The rhythm per key owner (a world that asks in somebody's name is contained).
    const fast = gateOf(upstream().impl, { callPace: { burst: 2, perSecond: 0 } });
    fast.setKey('anna', ANNA);
    const once = () => fast.direct()('openrouter:/v1/chat/completions', { method: 'POST', headers: { [PAYERS_HEADER]: 'anna' }, body: CHAT });
    expect((await once()).status).toBe(200);
    expect((await once()).status).toBe(200);
    expect((await once()).status).toBe(429);
    expect(CALL_PACE.burst).toBeGreaterThan(20);
  });

  it('V-040 come pagano i mondi: la chiave del server se c’è; altrimenti le chiavi dei giocatori solo dove non c’è una chiave di Google; mai una chiave nel loro ambiente né nel loro programma', () => {
    const none = gateOf(upstream().impl);
    expect(worldsPayWith(none, { gemini: true, accounts: true })).toBeUndefined();
    expect(worldsPayWith(none, { gemini: false, accounts: false })).toBeUndefined();
    expect(worldsPayWith(none, { gemini: false, accounts: true })?.policy).toEqual({ players: true, server: false });
    none.setKey('anna', ANNA);
    expect(worldsPayWith(none, { gemini: false, accounts: false })?.policy).toEqual({ players: true, server: false });
    expect(worldsPayWith(none, { gemini: true, accounts: false })).toBeUndefined();
    const own = gateOf(upstream().impl, { apiKey: SERVER });
    expect(worldsPayWith(own, { gemini: true, accounts: false })?.policy).toEqual({ players: false, server: true });
    expect(worldsPayWith(own, { gemini: false, accounts: true })?.policy).toEqual({ players: true, server: true });
    expect(worldsPayWith(own, { gemini: false, accounts: true })?.keys()).toEqual({ holders: [], exhausted: [] });
    process.env.OPENROUTER_API_KEY = SERVER;
    try {
      expect(JSON.stringify(worldEnv(0))).not.toContain('OPENROUTER');
    } finally {
      delete process.env.OPENROUTER_API_KEY;
    }
    for (const file of ['src/session/host.ts', 'src/session/worldProcess.ts', 'src/kernel/ai/openrouter.ts', 'src/kernel/kernel.ts', 'src/main.ts']) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toContain('OPENROUTER_API_KEY');
      expect(text, file).not.toMatch(/sk-or-/);
    }
  });

  it('V-040 il server di produzione vuole un tetto per la chiave del server, e non ne dice il valore', () => {
    const base = { FIREBASE_PROJECT_ID: 'p', FIREBASE_API_KEY: 'k', STRIPE_WEBHOOK_SECRET: 'whsec_x', QUINE_ORIGINI: 'https://quine42.example', QUINE_PROXY_FIDATI: '0' };
    expect(productionProblems(base)).toEqual([]);
    const said = productionProblems({ ...base, OPENROUTER_API_KEY: SERVER }).join('\n');
    expect(said).toContain('OPENROUTER_TETTO_GIORNALIERO');
    expect(said).not.toContain(SERVER);
    expect(productionProblems({ ...base, OPENROUTER_API_KEY: SERVER, OPENROUTER_TETTO_GIORNALIERO: 'tanto' }).join('\n')).toContain('OPENROUTER_TETTO_GIORNALIERO');
    expect(productionProblems({ ...base, OPENROUTER_API_KEY: SERVER, OPENROUTER_TETTO_GIORNALIERO: '5' })).toEqual([]);
  });
});
