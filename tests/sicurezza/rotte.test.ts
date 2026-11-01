import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GeminiGate, geminiProxy } from '../../server/geminiProxy';
import { handleStripeWebhookEvent } from '../../server/stripe';
import { subscriptionQueue } from '../../server/subscriptionQueue';
import { universeStore } from '../../server/universeStore';
import { MockModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { fakeLink } from '../../src/session/protocol';
import { playerFiles, SessionServer } from '../../src/session/server';

// The server's routes as `npm run sicurezza:prove` measures them, without a server: see docs/sicurezza/README.md. Each test
// looks at the effect (the disk, the call to Google), so it stays right after the fix. Only a temporary folder and fake values.

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void;

/** The middleware of a route's plugin, on a server on the loopback. */
async function serve(plugin: { configureServer?: unknown }) {
  let handler: Handler | undefined;
  (plugin.configureServer as (s: unknown) => void)({ middlewares: { use: (h: Handler) => (handler = h) } });
  const server = http.createServer((req, res) => handler!(req, res, () => ((res.statusCode = 404), res.end())));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}

const git = (cwd: string, args: string[]) =>
  execFileSync('git', ['-c', 'user.name=Prove', '-c', 'user.email=prove@rune.local', '-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });

let dir: string;
let store: Awaited<ReturnType<typeof serve>>;
const root = () => path.join(dir, 'sonda');
const logic = () => path.join(root(), 'modules', 'sonda', 'logic.lua');
const saldo = () => JSON.parse(readFileSync(path.join(root(), 'world', 'giocatori', 'altro.json'), 'utf8')).crediti;
const commit = (changes: Record<string, string>, headers: Record<string, string> = { 'Content-Type': 'application/json' }) =>
  fetch(`${store.base}/api/universe/sonda/commit`, { method: 'POST', headers, body: JSON.stringify({ changes, message: 'sonda', author: 'player' }) });

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'quine-rotte-'));
  mkdirSync(path.dirname(logic()), { recursive: true });
  mkdirSync(path.join(root(), 'world', 'giocatori'), { recursive: true });
  writeFileSync(path.join(root(), 'universe.json'), JSON.stringify({ name: 'sonda', partita: { modalita: 'multigiocatore', master: 'io' } }));
  writeFileSync(logic(), 'return {}\n');
  writeFileSync(path.join(root(), 'world', 'giocatori', 'altro.json'), JSON.stringify({ nome: 'Altro', crediti: 5 }));
  git(root(), ['init', '-q']);
  git(root(), ['add', '-A']);
  git(root(), ['commit', '-q', '-m', 'nasce']);
  store = await serve(universeStore(dir));
});

afterAll(() => {
  store.server.close();
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  vi.unstubAllGlobals();
});

describe('/api/universe', () => {
  // Open: T120. Each one restores nothing: the balance and the code are read right after the request.
  it.fails('V-001 senza identità non si riscrive il Lua sul server', async () => {
    await commit({ 'modules/sonda/logic.lua': '-- V-001\nreturn {}\n' });
    expect(readFileSync(logic(), 'utf8')).not.toContain('V-001');
  });

  it.fails('V-001 senza identità non si cambia un saldo', async () => {
    await commit({ 'world/giocatori/altro.json': JSON.stringify({ nome: 'Altro', crediti: 1000 }) });
    expect(saldo()).toBe(5);
  });

  it.fails('V-001 senza identità non si leggono i file di un universo in multigiocatore', async () => {
    const r = await fetch(`${store.base}/api/universe/sonda`);
    expect(Object.keys(((await r.json()) as { files?: object }).files ?? {})).not.toContain('modules/sonda/logic.lua');
  });

  it.fails('V-001 un\'altra origine con un corpo text/plain non scrive', async () => {
    await commit({ 'world/da-altro-sito.txt': 'sonda\n' }, { 'Content-Type': 'text/plain', Origin: 'http://altro.example' });
    expect(existsSync(path.join(root(), 'world', 'da-altro-sito.txt'))).toBe(false);
  });

  it('V-003 il nome esatto della cartella di git è rifiutato, come ciò che esce dall\'universo', async () => {
    for (const p of ['.git/sonda-v003', '../sonda-v003', 'world/../../sonda-v003']) await commit({ [p]: 'sonda\n' });
    expect(existsSync(path.join(root(), '.git', 'sonda-v003'))).toBe(false);
    expect(existsSync(path.join(dir, 'sonda-v003'))).toBe(false);
  });
});

describe('il proxy di Gemini', () => {
  /** What the proxy asks Google, instead of asking it. */
  const asked = () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(String(url));
      return new Response('{}', { status: 200 });
    });
    return calls;
  };

  /** A request by node:http: `fetch` here is the stub above. */
  const send = (base: string, model: string, headers: Record<string, string> = { 'Content-Type': 'application/json' }) =>
    new Promise<void>((resolve, reject) => {
      const req = http.request(`${base}/api/gemini/models/${model}:generateContent`, { method: 'POST', headers }, (res) => {
        res.resume();
        res.on('end', () => resolve());
      });
      req.on('error', reject);
      req.end('{}');
    });

  const open = () => serve(geminiProxy(new GeminiGate({ apiKey: 'finta' })));

  it('V-002 un modello fuori dall\'elenco non arriva a Google', async () => {
    const proxy = await open();
    const calls = asked();
    try {
      await send(proxy.base, 'gemini-sonda-fuori-elenco');
      expect(calls).toEqual([]);
      // The control: the same request with a model on the list does arrive, so a refusal here means something.
      await send(proxy.base, 'gemini-3.1-flash-lite');
      expect(calls).toHaveLength(1);
    } finally {
      proxy.server.close();
      vi.unstubAllGlobals();
    }
  });

  it('V-002 un\'altra origine non spende la chiave', async () => {
    const proxy = await open();
    const calls = asked();
    try {
      await send(proxy.base, 'gemini-3.1-flash-lite', { 'Content-Type': 'application/json', Origin: 'http://altro.example' });
      expect(calls).toEqual([]);
    } finally {
      proxy.server.close();
      vi.unstubAllGlobals();
    }
  });
});

describe('il webhook di Stripe', () => {
  const paid = (id: string, universo: string, wandererId: string, crediti: number) =>
    JSON.stringify({ id, type: 'checkout.session.completed', data: { object: { id: `cs_${id}`, payment_status: 'paid', amount_total: crediti * 100, metadata: { universo, wandererId, crediti: String(crediti) } } } });

  // Open: T124.
  it.fails('V-004 senza segreto il webhook non accredita nulla', async () => {
    const before = saldo();
    await handleStripeWebhookEvent({ rawBody: paid('evt_v004a', 'sonda', 'altro', 100), settings: {}, universesDir: dir });
    expect(saldo()).toBe(before);
  });

  it.fails('V-004 il nome dell\'universo nei metadati non porta fuori dalla cartella', async () => {
    const outside = `${dir}-fuori`;
    mkdirSync(path.join(outside, '.git'), { recursive: true });
    try {
      await handleStripeWebhookEvent({ rawBody: paid('evt_v004b', `../${path.basename(outside)}`, 'altro', 1), settings: {}, universesDir: dir });
      expect(existsSync(path.join(outside, 'world', 'giocatori', 'altro.json'))).toBe(false);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});

describe('la coda delle CLI', () => {
  // Open: T128. Nobody serves the queue here: the request stays a file in the temporary folder.
  it.fails('V-009 senza segreto locale non si mette un compito in coda', async () => {
    const coda = path.join(dir, '.coda');
    const route = await serve(subscriptionQueue(coda));
    try {
      await fetch(`${route.base}/api/coda`, { method: 'POST', body: JSON.stringify({ provider: 'claude', agent: 'sonda', task: 'sonda', system: 'sonda', prompt: 'sonda' }) });
      expect(existsSync(coda)).toBe(false);
    } finally {
      route.server.close();
    }
  });
});

describe('la sessione', () => {
  async function world() {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
    return new SessionServer(await Kernel.boot({ files, store: memoryStore(), models: new MockModels() }));
  }

  /** The `ingresso` the client gets, entering as it says. */
  function enter(server: SessionServer, entra: Record<string, unknown>) {
    const { server: s, client } = fakeLink();
    const got: Array<{ t: string; master?: boolean; anonimo?: boolean }> = [];
    client.onMessage((m) => got.push(m as (typeof got)[number]));
    server.connect(s);
    client.send({ t: 'entra', ...entra } as never);
    const ingresso = got.find((m) => m.t === 'ingresso');
    expect(ingresso, 'il client deve essere entrato').toBeTruthy();
    return ingresso!;
  }

  // Open: T120.
  it.fails('V-006 nessuno diventa master dicendolo', async () => {
    expect(enter(await world(), { id: 'io', nome: 'Sonda' }).master).toBeFalsy();
  });

  it.fails('V-006 essere anonimo non lo decide il client', async () => {
    expect(enter(await world(), { id: 'sonda', nome: 'Sonda', anonimo: true }).anonimo).toBeFalsy();
  });

  // Open: T130.
  it.fails('V-012 a un giocatore non arrivano le impostazioni dell\'IA', () => {
    expect(JSON.parse(playerFiles(bundledFiles)['universe.json']).ai).toBeUndefined();
  });

  it.fails('V-012 a un giocatore non arrivano le storie dei moduli', () => {
    const shown = Object.entries(playerFiles(bundledFiles)).filter(([p]) => p.endsWith('/manifest.json')).map(([, t]) => JSON.parse(t));
    expect(shown.filter((m) => m.persona !== undefined || m.lore !== undefined || m.context !== undefined)).toEqual([]);
  });

  it('V-012 a un giocatore non arrivano prompt, bibbia, persone e codice degli altri', () => {
    const paths = Object.keys(playerFiles(bundledFiles));
    expect(paths.filter((p) => /^(prompts|world\/(bible|people|plots|rules|consumi))/.test(p))).toEqual([]);
    expect(paths.filter((p) => p.endsWith('.lua') && !/^modules\/core\.(movement|carpet)\//.test(p))).toEqual([]);
  });
});
