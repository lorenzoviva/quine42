// «Collega OpenRouter» (T364, ADR-0197): the module of the pages (the game's lobby and panel P, the site) against the real route and a fake
// OpenRouter. The PKCE flow from the button to the way back, the paste, the key's limit read from `/api/v1/key`, the forgetting; alone on this
// machine the key kept beside the universes and read again at a restart. Nothing leaves the machine.

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { keyFingerprint, OpenRouterGate, openrouterRoute, readKeyLimits } from '../server/openrouterProxy';
import type { AccountSettings } from '../server/account';
import { authUrl, callbackOf, KEY_LABEL, limitWords, OpenRouterLink, pkcePair } from '../src/ui/openrouter';
import { WANDERER_HEADER } from '../src/kernel/universes';

const KEY = 'sk-or-v1-kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk';
const OTHER = 'sk-or-v1-oooooooooooooooooooooooooooooooo';
const LOCAL = { host: 'localhost:5173', origin: 'http://localhost:5173' };

type Route = ReturnType<typeof openrouterRoute>;

/** The route as a page's fetch sees it. */
function pageFetch(route: Route, address = '127.0.0.1'): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new PassThrough() as any;
    req.url = String(input);
    req.method = init?.method ?? 'GET';
    const said = Object.fromEntries(Object.entries((init?.headers as Record<string, string>) ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    req.headers = { ...LOCAL, ...said };
    req.socket = { remoteAddress: address };
    const answer = new Promise<Response>((resolve, reject) => {
      const headers: Record<string, string> = {};
      const res: any = { statusCode: 200, setHeader: (k: string, v: string) => void (headers[k.toLowerCase()] = v), end: (text: string) => resolve(new Response(text, { status: res.statusCode, headers })) };
      route(req, res, () => reject(new Error('passata oltre')));
    });
    req.end(typeof init?.body === 'string' ? init.body : '');
    return answer;
  }) as typeof fetch;
}

/** OpenRouter: the exchange gives KEY for the code it gave, `/v1/key` says the limit of the key asked with. */
function fakeOpenRouter(o: { limit?: number | null; revoked?: boolean } = {}) {
  const calls: Array<{ url: string; key?: string; body?: any }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    const key = (init.headers as Record<string, string> | undefined)?.Authorization?.replace(/^Bearer /, '');
    calls.push({ url, key, body: init.body ? JSON.parse(String(init.body)) : undefined });
    if (url.endsWith('/v1/auth/keys')) return new Response(JSON.stringify({ key: KEY, user_id: 'u1' }), { status: 200 });
    if (url.endsWith('/v1/key')) {
      if (o.revoked) return new Response(JSON.stringify({ error: { message: 'revoked' } }), { status: 401 });
      const limit = o.limit === undefined ? 5 : o.limit;
      return new Response(JSON.stringify({ data: { label: KEY_LABEL, limit, limit_remaining: limit === null ? null : limit - 1.25, limit_reset: 'monthly', usage: 1.25, is_free_tier: false, key: 'never-this' } }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  }) as unknown as typeof fetch;
  return { calls, impl };
}

const accounts: AccountSettings = { config: {}, verify: async (token) => (/^tok-(\w+)$/.test(token) ? { uid: token.slice(4), anonymous: false } : undefined) };

/** sessionStorage and history as a tab has them. */
const tab = new Map<string, string>();
let realFetch: typeof fetch;
beforeEach(() => {
  tab.clear();
  (globalThis as any).sessionStorage = { getItem: (k: string) => tab.get(k) ?? null, setItem: (k: string, v: string) => void tab.set(k, v), removeItem: (k: string) => void tab.delete(k) };
  (globalThis as any).history = { state: null, replaceState: () => undefined };
  realFetch = globalThis.fetch;
});
const dirs: string[] = [];
afterEach(() => {
  globalThis.fetch = realFetch;
  delete (globalThis as any).sessionStorage;
  delete (globalThis as any).history;
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('«Collega OpenRouter» (T364)', () => {
  it('il PKCE dal pulsante al ritorno: la pagina fa verifier e challenge, il server dà lo state e scambia il codice, la chiave non arriva mai alla pagina', async () => {
    const or = fakeOpenRouter();
    const gate = new OpenRouterGate({ fetchImpl: or.impl });
    const route = openrouterRoute(gate, { access: { accounts, internal: 'x' } });
    globalThis.fetch = pageFetch(route);
    const link = new OpenRouterLink(() => ({ Authorization: 'Bearer tok-anna' }));
    expect(await link.status()).toMatchObject({ linked: false, available: false });
    let went = '';
    expect(await link.begin('http://localhost:5173/index.html?universo=mondo&code=vecchio#invito', (u) => (went = u))).toBeUndefined();
    const auth = new URL(went);
    expect(auth.origin + auth.pathname).toBe('https://openrouter.ai/auth');
    expect(auth.searchParams.get('callback_url')).toBe('http://localhost:5173/index.html?universo=mondo');
    expect(auth.searchParams.get('code_challenge_method')).toBe('S256');
    expect(auth.searchParams.get('key_label')).toBe(KEY_LABEL);
    const state = auth.searchParams.get('state')!;
    expect(state).toMatch(/^[a-f0-9]{32}$/);
    // The verifier waits in this tab only; the challenge is its SHA-256.
    const flow = JSON.parse(tab.get('quine:openrouter:flow')!);
    const digest = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(flow.verifier))).toString('base64url');
    expect(auth.searchParams.get('code_challenge')).toBe(digest);
    // OpenRouter comes back with the code and the state.
    const back = `http://localhost:5173/index.html?universo=mondo&code=codice-1&state=${state}`;
    expect(OpenRouterLink.returning(back)).toBe(true);
    const done = await link.finish(back);
    expect(done).toEqual({ ok: true, fingerprint: keyFingerprint(KEY) });
    expect(JSON.stringify(done)).not.toContain(KEY);
    expect(or.calls[0].body).toEqual({ code: 'codice-1', code_verifier: flow.verifier, code_challenge_method: 'S256' });
    // The flow is spent: the same address again is not a way back.
    expect(OpenRouterLink.returning(back)).toBe(false);
    expect(await link.finish(back)).toBeUndefined();
    // The key as OpenRouter sees it: its limit, never the key.
    const k = await link.key();
    expect(k).toMatchObject({ linked: true, fingerprint: keyFingerprint(KEY), exhausted: false, limits: { label: KEY_LABEL, limit: 5, remaining: 3.75, usage: 1.25, reset: 'monthly', freeTier: false } });
    expect(JSON.stringify(k)).not.toContain(KEY);
    expect(JSON.stringify(k)).not.toContain('never-this');
    expect(or.calls.at(-1)).toMatchObject({ url: 'https://openrouter.ai/api/v1/key', key: KEY });
    // Asked again within a minute: told without asking OpenRouter.
    const n = or.calls.length;
    await link.key();
    expect(or.calls).toHaveLength(n);
    expect(await link.status()).toMatchObject({ linked: true, available: true });
    // Forgotten on request.
    expect(await link.forget()).toBe(true);
    expect(await link.key()).toEqual({ linked: false });
  });

  it('un ritorno che non è quello cominciato in questa scheda non scambia niente', async () => {
    const or = fakeOpenRouter();
    const route = openrouterRoute(new OpenRouterGate({ fetchImpl: or.impl }), { access: { accounts, internal: 'x' } });
    globalThis.fetch = pageFetch(route);
    const link = new OpenRouterLink(() => ({ Authorization: 'Bearer tok-anna' }));
    // No flow in this tab: not a way back.
    expect(await link.finish('http://localhost:5173/?code=c&state=' + 'a'.repeat(32))).toBeUndefined();
    await link.begin('http://localhost:5173/', () => undefined);
    expect(await link.finish('http://localhost:5173/?code=c&state=' + 'b'.repeat(32))).toMatchObject({ ok: false });
    expect(or.calls).toHaveLength(0);
  });

  it('l’incolla è il ripiego; una chiave revocata su OpenRouter si dimentica quando se ne legge il limite', async () => {
    const or = fakeOpenRouter({ revoked: true });
    const gate = new OpenRouterGate({ fetchImpl: or.impl });
    globalThis.fetch = pageFetch(openrouterRoute(gate, { access: { accounts, internal: 'x' } }));
    const link = new OpenRouterLink(() => ({ Authorization: 'Bearer tok-bruno' }));
    expect(await link.paste('non-una-chiave')).toMatchObject({ ok: false });
    expect(await link.paste(`  ${OTHER} `)).toEqual({ ok: true, fingerprint: keyFingerprint(OTHER) });
    expect(gate.keyOf('bruno')).toBeDefined();
    expect(await link.key()).toEqual({ linked: false, forgotten: true });
    expect(gate.keyOf('bruno')).toBeUndefined();
  });

  it('da soli su questo PC la chiave resta accanto agli universi e torna a un riavvio; da un’altra macchina, o senza il file, resta in memoria', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'quine-keys-'));
    dirs.push(dir);
    const file = path.join(dir, '.keys', 'openrouter.json');
    const or = fakeOpenRouter();
    const gate = new OpenRouterGate({ fetchImpl: or.impl, keysFile: file });
    // Without accounts, as alone: the id from this machine.
    const route = openrouterRoute(gate, { access: { internal: 'x' } });
    globalThis.fetch = pageFetch(route);
    const me = new OpenRouterLink(() => ({ [WANDERER_HEADER]: 'me' }));
    expect(await me.paste(KEY)).toMatchObject({ ok: true });
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ keys: { me: KEY } });
    // A restart: the key is there again, and pays for `me` alone.
    const again = new OpenRouterGate({ fetchImpl: or.impl, keysFile: file });
    expect(again.keyOf('me')).toEqual({ fingerprint: keyFingerprint(KEY), exhausted: false });
    expect(again.holders()).toEqual({ holders: ['me'], exhausted: [] });
    // Forgotten: out of the file too.
    expect(await me.forget()).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ keys: {} });
    // From another machine (a dev server exposed by hand), with accounts: kept in memory, never in the file.
    const exposed = openrouterRoute(gate, { access: { accounts, internal: 'x' } });
    globalThis.fetch = pageFetch(exposed, '192.168.1.20');
    const far = new OpenRouterLink(() => ({ Authorization: 'Bearer tok-carla' }));
    expect(await far.paste(OTHER)).toMatchObject({ ok: true });
    expect(gate.keyOf('carla')).toBeDefined();
    expect(readFileSync(file, 'utf8')).not.toContain(OTHER);
    // The production server gives no file: nothing ever written.
    const dir2 = mkdtempSync(path.join(tmpdir(), 'quine-keys-'));
    dirs.push(dir2);
    const prod = new OpenRouterGate({ fetchImpl: or.impl });
    globalThis.fetch = pageFetch(openrouterRoute(prod, { access: { internal: 'x' } }));
    expect(await me.paste(KEY)).toMatchObject({ ok: true });
    expect(existsSync(path.join(dir2, '.keys'))).toBe(false);
    // A file written by hand with something that is not a key: left out.
    const odd = path.join(dir, '.keys', 'odd.json');
    writeFileSync(odd, JSON.stringify({ keys: { me: 'AIza-google', '../x': KEY, ok: KEY } }));
    expect(new OpenRouterGate({ fetchImpl: or.impl, keysFile: odd }).holders()).toEqual({ holders: ['ok'], exhausted: [] });
  });

  it('il server dice dove i mondi pagano con le chiavi dei giocatori; la pagina lo legge', async () => {
    const gate = new OpenRouterGate({ fetchImpl: fakeOpenRouter().impl });
    globalThis.fetch = pageFetch(openrouterRoute(gate, { access: { internal: 'x' }, worlds: () => true }));
    expect(await new OpenRouterLink(() => ({ [WANDERER_HEADER]: 'me' })).status()).toMatchObject({ worlds: true });
  });

  it('le parti pure: callback, indirizzo, verifier, il limite in parole', async () => {
    expect(callbackOf('https://quine42.example/site/profilo.html?code=x&state=y&a=1#frammento')).toBe('https://quine42.example/site/profilo.html?a=1');
    expect(authUrl({ callback: 'http://localhost:5173/', challenge: 'c', state: 's' })).toBe('https://openrouter.ai/auth?callback_url=http%3A%2F%2Flocalhost%3A5173%2F&code_challenge=c&code_challenge_method=S256&state=s&key_label=QUINE42');
    const { verifier, challenge } = await pkcePair();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(readKeyLimits({ data: { limit: null, limit_remaining: null, usage: 2, limit_reset: 'mai', is_free_tier: true } })).toEqual({ limit: null, remaining: null, usage: 2, reset: null, freeTier: true });
    expect(readKeyLimits({ nope: 1 })).toBeUndefined();
    expect(limitWords({ limit: null, remaining: null, usage: 0, reset: null, freeTier: false }, 5).warn).toContain('$5.00');
    expect(limitWords({ limit: 5, remaining: 0, usage: 5, reset: 'daily', freeTier: false }, 5).warn).toContain('finito');
    expect(limitWords({ limit: 100, remaining: 90, usage: 10, reset: null, freeTier: false }, 5).warn).toContain('abbassalo');
    expect(limitWords({ limit: 5, remaining: 4, usage: 1, reset: 'weekly', freeTier: false }, 5)).toEqual({ text: 'Limite della chiave $5.00 alla settimana: restano $4.00 (spesi finora $1.00).' });
  });
});
