import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GeminiGate, geminiProxy } from '../../server/geminiProxy';
import { createFakeStripeSignature, handleStripeWebhookEvent, stripeRoute } from '../../server/stripe';
import { queueWanted, subscriptionQueue } from '../../server/subscriptionQueue';
import { ledgerOf } from '../../server/ledger';
import { universeStore } from '../../server/universeStore';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { fakeLink } from '../../src/session/protocol';
import { buildCliCommand, cliEnv, IsolationCheck, ISOLATION_ARGS, serveOne } from '../../tools/abbonamenti/servi';
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
const saldo = () => ledgerOf(dir, 'sonda').balance('altro');
const commit = (changes: Record<string, string>, headers: Record<string, string> = { 'Content-Type': 'application/json' }) =>
  fetch(`${store.base}/api/universe/sonda/commit`, { method: 'POST', headers, body: JSON.stringify({ changes, message: 'sonda', author: 'player' }) });

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'quine-rotte-'));
  mkdirSync(path.dirname(logic()), { recursive: true });
  mkdirSync(path.join(root(), 'world', 'giocatori'), { recursive: true });
  writeFileSync(path.join(root(), 'universe.json'), JSON.stringify({ name: 'sonda', partita: { modalita: 'multiplayer', master: 'io' } }));
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
  // Each one restores nothing: the balance and the code are read right after the request. The rest of who may do what: accesso.test.ts.
  it('V-001 senza identità non si riscrive il Lua sul server', async () => {
    await commit({ 'modules/sonda/logic.lua': '-- V-001\nreturn {}\n' });
    expect(readFileSync(logic(), 'utf8')).not.toContain('V-001');
  });

  it('V-001 senza identità non si cambia un saldo', async () => {
    await commit({ 'world/giocatori/altro.json': JSON.stringify({ nome: 'Altro', crediti: 1000 }) });
    expect(saldo()).toBe(5);
  });

  it('V-001 senza identità non si leggono i file di un universo in multigiocatore', async () => {
    const r = await fetch(`${store.base}/api/universe/sonda`);
    expect(Object.keys(((await r.json()) as { files?: object }).files ?? {})).not.toContain('modules/sonda/logic.lua');
  });

  it('V-001 un\'altra origine con un corpo text/plain non scrive', async () => {
    await commit({ 'world/da-altro-sito.txt': 'sonda\n' }, { 'Content-Type': 'text/plain', Origin: 'http://altro.example' });
    expect(existsSync(path.join(root(), 'world', 'da-altro-sito.txt'))).toBe(false);
  });

  it('V-003 il nome esatto della cartella di git è rifiutato, come ciò che esce dall\'universo', async () => {
    // As the master: a stranger stops before the paths are even looked at.
    for (const p of ['.git/sonda-v003', '../sonda-v003', 'world/../../sonda-v003']) await commit({ [p]: 'sonda\n' }, { 'Content-Type': 'application/json', 'X-Quine-Viandante': 'io' });
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

  const settings = { webhookSecret: 'finto' };
  /** A delivery with the right signature: the refusals below are not the signature's. */
  const signed = (rawBody: string) => handleStripeWebhookEvent({ rawBody, signature: createFakeStripeSignature(rawBody, settings.webhookSecret), settings, universesDir: dir });

  it('V-004 senza segreto il webhook risponde 503 e non accredita nulla', async () => {
    const before = saldo();
    const rawBody = paid('evt_v004a', 'sonda', 'altro', 100);
    // Not even with a signature made with an empty secret.
    for (const secret of [undefined, '']) {
      const r = await handleStripeWebhookEvent({ rawBody, signature: createFakeStripeSignature(rawBody, ''), settings: { webhookSecret: secret }, universesDir: dir });
      expect(r.status).toBe(503);
    }
    expect(saldo()).toBe(before);
  });

  it('V-004 il nome dell\'universo nei metadati non porta fuori dalla cartella', async () => {
    const outside = `${dir}-fuori`;
    mkdirSync(path.join(outside, '.git'), { recursive: true });
    try {
      const r = await signed(paid('evt_v004b', `../${path.basename(outside)}`, 'altro', 1));
      expect(r.status).toBe(400);
      expect(existsSync(path.join(outside, 'world', 'giocatori', 'altro.json'))).toBe(false);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('V-004 l\'id del viandante nei metadati non porta fuori dalla cartella dei viandanti', async () => {
    const r = await signed(paid('evt_v004c', 'sonda', '../../sonda-id-fuori', 1));
    expect(r.status).toBe(400);
    expect(existsSync(path.join(root(), 'sonda-id-fuori.json'))).toBe(false);
  });

  it('V-004 il credito è quello dell\'importo pagato, non quello scritto nei metadati', async () => {
    const before = saldo();
    const event = JSON.parse(paid('evt_v004d', 'sonda', 'altro', 1000));
    event.data.object.amount_total = 150;
    expect((await signed(JSON.stringify(event))).status).toBe(200);
    expect(saldo()).toBe(before + 1.5);
  });

  it('V-004 la route risponde 503 nel server di sviluppo e nella preview', async () => {
    const plugin = stripeRoute({ settings: {}, universesDir: dir });
    for (const configureServer of [plugin.configureServer, plugin.configurePreviewServer]) {
      const route = await serve({ configureServer });
      try {
        const r = await fetch(`${route.base}/api/stripe/webhook`, { method: 'POST', body: paid('evt_v004f', 'sonda', 'altro', 100) });
        expect(r.status).toBe(503);
      } finally {
        route.server.close();
      }
    }
  });

  it('V-004 senza un importo in dollari non si accredita nulla', async () => {
    const before = saldo();
    for (const change of [{ amount_total: undefined }, { amount_total: 0 }, { amount_total: -100 }, { amount_total: 1.5 }, { amount_total: '100' }, { currency: 'jpy' }]) {
      const event = JSON.parse(paid(`evt_v004e${JSON.stringify(change)}`, 'sonda', 'altro', 5));
      Object.assign(event.data.object, change);
      expect((await signed(JSON.stringify(event))).status, JSON.stringify(change)).toBe(400);
    }
    expect(saldo()).toBe(before);
  });
});

describe('la coda delle CLI', () => {
  const request = JSON.stringify({ provider: 'claude', agent: 'sonda', task: 'sonda', system: 'sonda', prompt: 'sonda' });
  /** A queue on, in a folder of its own; nobody serves it: a request stays a file. */
  async function queue(fn: (base: string, coda: string) => Promise<void>, enabled = true) {
    const coda = mkdtempSync(path.join(os.tmpdir(), 'quine-coda-prova-'));
    rmSync(coda, { recursive: true });
    const route = await serve(subscriptionQueue(coda, { enabled }));
    try {
      await fn(route.base, coda);
    } finally {
      route.server.close();
      rmSync(coda, { recursive: true, force: true });
    }
  }
  const secretOf = async (base: string) => (await (await fetch(`${base}/api/coda/segreto`, { headers: { 'sec-fetch-site': 'same-origin' } })).json()).segreto as string;

  it('V-009 senza una richiesta esplicita la route non c\'è', async () => {
    expect(queueWanted({})).toBe(false);
    expect(queueWanted({ QUINE_CODA: '0' })).toBe(false);
    expect(queueWanted({ QUINE_CODA: '1' })).toBe(true);
    await queue(async (base, coda) => {
      expect((await fetch(`${base}/api/coda`, { method: 'POST', body: request })).status).toBe(404);
      for (const p of ['stato', 'segreto']) expect((await fetch(`${base}/api/coda/${p}`, { headers: { 'sec-fetch-site': 'same-origin' } })).status, p).toBe(404);
      expect(existsSync(coda)).toBe(false);
    }, false);
  });

  it('V-009 senza segreto locale non si mette un compito in coda e non si legge nulla', async () => {
    await queue(async (base, coda) => {
      const wrong = { 'x-quine-coda': 'f'.repeat(64) };
      expect((await fetch(`${base}/api/coda`, { method: 'POST', body: request })).status).toBe(403);
      expect((await fetch(`${base}/api/coda`, { method: 'POST', body: request, headers: wrong })).status).toBe(403);
      expect((await fetch(`${base}/api/coda/stato`)).status).toBe(403);
      expect((await fetch(`${base}/api/coda/stato`, { headers: wrong })).status).toBe(403);
      expect((await fetch(`${base}/api/coda/qualcosa`, { method: 'DELETE' })).status).toBe(403);
      expect(existsSync(coda)).toBe(false);
    });
  });

  it('V-009 il segreto lo legge solo la pagina di questo server', async () => {
    await queue(async (base) => {
      for (const site of [undefined, 'cross-site', 'same-site', 'none']) {
        const r = await fetch(`${base}/api/coda/segreto`, { headers: site ? { 'sec-fetch-site': site } : {} });
        expect(r.status, String(site)).toBe(403);
      }
      expect((await fetch(`${base}/api/coda/segreto`, { headers: { 'sec-fetch-site': 'same-origin', origin: 'https://altro.example' } })).status).toBe(403);
      const again = await secretOf(base);
      expect(again).toMatch(/^[0-9a-f]{64}$/);
      expect(await secretOf(base)).toBe(again);
    });
  });

  it('V-009 con il segreto la coda funziona, solo da questa macchina e dalla stessa origine', async () => {
    await queue(async (base, coda) => {
      const headers = { 'x-quine-coda': await secretOf(base) };
      const posted = await fetch(`${base}/api/coda`, { method: 'POST', body: request, headers });
      expect(posted.status).toBe(200);
      expect(((await posted.json()) as { id: string }).id).toBeTruthy();
      expect((await fetch(`${base}/api/coda/stato`, { headers })).status).toBe(200);
      expect(readdirSync(coda).filter((f) => f.endsWith('.richiesta.json'))).toHaveLength(1);
      // The right secret does not open it from another site.
      expect((await fetch(`${base}/api/coda/stato`, { headers: { ...headers, origin: 'https://altro.example' } })).status).toBe(403);
      expect((await fetch(`${base}/api/coda/stato`, { headers: { ...headers, 'x-forwarded-for': '203.0.113.9' } })).status).toBe(403);
    });
  });

  it('V-009 non da loopback o con un altro nome è rifiutata', () => {
    let handler: Handler | undefined;
    (subscriptionQueue('non-usata', { enabled: true }).configureServer as unknown as (s: unknown) => void)({ middlewares: { use: (h: Handler) => (handler = h) } });
    const statusOf = (remoteAddress: string, host: string) => {
      const res = { statusCode: 0, setHeader() {}, end() {} };
      handler!({ url: '/api/coda/stato', method: 'GET', headers: { host, 'sec-fetch-site': 'same-origin' }, socket: { remoteAddress } } as never, res as never, () => undefined);
      return res.statusCode;
    };
    expect(statusOf('192.168.1.20', 'localhost:5173')).toBe(403);
    expect(statusOf('::ffff:10.0.0.2', '127.0.0.1:5173')).toBe(403);
    expect(statusOf('127.0.0.1', 'altro.example')).toBe(403);
  });

  const queued = { id: 'x', provider: 'claude' as const, agent: 'sonda', task: 'sonda', system: 'sistema', prompt: '--un-testo-che-comincia-con-un-trattino', creata: '' };

  it('V-009 gli argomenti della CLI escludono strumenti, MCP, hook e impostazioni; il testo non è un argomento', () => {
    const { cmd, args, stdin } = buildCliCommand('claude', queued);
    expect(cmd).toBe('claude');
    const value = (flag: string) => args[args.indexOf(flag) + 1];
    expect(value('--tools')).toBe('');
    expect(args).toContain('--strict-mcp-config');
    expect(JSON.parse(value('--mcp-config'))).toEqual({ mcpServers: {} });
    expect(value('--setting-sources')).toBe('');
    expect(JSON.parse(value('--settings'))).toEqual({ disableAllHooks: true });
    for (const flag of ['--safe-mode', '--restricted', '--disable-slash-commands', '--no-session-persistence']) expect(args, flag).toContain(flag);
    for (const flag of ['--dangerously-skip-permissions', '--allow-dangerously-skip-permissions', '--add-dir', '--allowedTools', '--bare']) expect(args, flag).not.toContain(flag);
    expect(stdin).toBe(queued.prompt);
    expect(args).not.toContain(queued.prompt);
    expect(args.slice(0, ISOLATION_ARGS.length)).toEqual([...ISOLATION_ARGS]);
  });

  it('V-009 la CLI non eredita i segreti', () => {
    const env = cliEnv({ Path: 'p', USERPROFILE: 'u', SystemRoot: 's', GEMINI_API_KEY: 'FINTA', ANTHROPIC_API_KEY: 'FINTA', STRIPE_SECRET_KEY: 'FINTA', GITHUB_TOKEN: 'FINTA', NODE_OPTIONS: 'FINTA', QUINE_MASTER: 'FINTA' });
    expect(env).toEqual({ Path: 'p', USERPROFILE: 'u', SystemRoot: 's' });
  });

  const init = { type: 'system', subtype: 'init', tools: [], mcp_servers: [], skills: [], slash_commands: [], plugins: [{ path: 'builtin' }] };
  const see = (...events: unknown[]) => {
    const c = new IsolationCheck();
    for (const e of events) c.see(JSON.stringify(e));
    return c;
  };

  it('V-009 senza conferma di non avere nulla in mano la CLI non serve', () => {
    expect(see(init)).toMatchObject({ confirmed: true, breach: undefined });
    expect(see(init, { type: 'assistant', message: { content: [{ type: 'text' }] } }).breach).toBeUndefined();
    for (const change of [{ tools: ['Bash'] }, { mcp_servers: [{ name: 'x' }] }, { skills: ['x'] }, { slash_commands: ['x'] }, { plugins: [{ path: 'C:/plugin' }] }, { tools: undefined }, { plugins: undefined }]) {
      expect(see({ ...init, ...change }), JSON.stringify(change)).toMatchObject({ confirmed: false, breach: expect.any(String) });
    }
    expect(see({ type: 'assistant', message: { content: [] } }).breach).toMatch(/prima della conferma/);
    expect(see(init, { type: 'system', subtype: 'hook_started' }).breach).toMatch(/hook/);
    expect(see(init, { type: 'assistant', message: { content: [{ type: 'tool_use' }] } }).breach).toMatch(/strumento/);
  });

  /** A fake CLI that writes what it sees next to itself, then does what `body` says. Never a real one. */
  async function fakeCli(body: string) {
    const place = mkdtempSync(path.join(os.tmpdir(), 'quine-cli-finta-'));
    const script = path.join(place, 'cli.mjs');
    const seen = path.join(place, 'visto.json');
    writeFileSync(
      script,
      `import fs from 'node:fs';
      const stdin = fs.readFileSync(0, 'utf8');
      fs.writeFileSync(${JSON.stringify(seen)}, JSON.stringify({ cwd: process.cwd(), inCwd: fs.readdirSync(process.cwd()), stdin, argv: process.argv.slice(2), env: process.env }));
      ${body}`,
    );
    return { cmd: `node ${script}`, seen, place };
  }
  const INIT_LINE = `console.log(${JSON.stringify(JSON.stringify(init))});`;

  it('V-009 la CLI gira in una cartella vuota, con l\'ambiente ridotto e il testo su stdin', async () => {
    const coda = mkdtempSync(path.join(os.tmpdir(), 'quine-coda-prova-'));
    const cli = await fakeCli(`${INIT_LINE} console.log(JSON.stringify({ type: 'result', result: 'fatto' }));`);
    vi.stubEnv('GEMINI_API_KEY', 'FINTA-gemini');
    try {
      const { enqueue } = await import('../../server/subscriptionQueue');
      await enqueue(coda, queued);
      const step = await serveOne(coda, 'claude', { cmd: cli.cmd });
      expect(step).toMatchObject({ status: 'ok', text: 'fatto' });
      const seen = JSON.parse(readFileSync(cli.seen, 'utf8'));
      expect(seen.inCwd).toEqual([]);
      expect(path.resolve(seen.cwd)).not.toBe(path.resolve(process.cwd()));
      expect(existsSync(seen.cwd)).toBe(false); // gone with the run
      expect(seen.stdin).toBe(queued.prompt);
      expect(seen.argv).not.toContain(queued.prompt);
      expect(JSON.stringify(seen.env)).not.toContain('FINTA-gemini');
    } finally {
      vi.unstubAllEnvs();
      rmSync(coda, { recursive: true, force: true });
      rmSync(cli.place, { recursive: true, force: true });
    }
  });

  it('V-009 una CLI che non conferma viene fermata e la sua risposta non passa', async () => {
    for (const [name, body] of [
      ['ha strumenti', `console.log(${JSON.stringify(JSON.stringify({ ...init, tools: ['Bash'] }))}); await new Promise((r) => setTimeout(r, 20000)); console.log(JSON.stringify({ type: 'result', result: 'fatto' }));`],
      ['non dice nulla', `console.log(JSON.stringify({ type: 'result', result: 'fatto' }));`],
    ]) {
      const coda = mkdtempSync(path.join(os.tmpdir(), 'quine-coda-prova-'));
      const cli = await fakeCli(body);
      try {
        const { enqueue, look } = await import('../../server/subscriptionQueue');
        const id = await enqueue(coda, queued);
        const started = Date.now();
        const step = await serveOne(coda, 'claude', { cmd: cli.cmd });
        expect(step.status, name).toBe('isolation');
        expect(Date.now() - started, name).toBeLessThan(15000);
        expect((await look(coda, id)).stato, name).toBe('fallita');
      } finally {
        rmSync(coda, { recursive: true, force: true });
        rmSync(cli.place, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      }
    }
  });
});

describe('la sessione', () => {
  async function world() {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multiplayer', morte: 3 } }, null, 2) };
    return new SessionServer(await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() }));
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

  // Nobody becomes the master by saying so: accesso.test.ts (with a verifier the id is not heard; without, only this machine gets in).
  it('V-006 essere anonimo non lo decide il client', async () => {
    expect(enter(await world(), { id: 'sonda', nome: 'Sonda', anonimo: true }).anonimo).toBeFalsy();
  });

  it('V-012 a un giocatore non arrivano le impostazioni dell\'IA', () => {
    expect(JSON.parse(playerFiles(bundledFiles)['universe.json']).ai).toBeUndefined();
  });

  it('V-012 a un giocatore non arrivano le storie dei moduli', () => {
    const shown = Object.entries(playerFiles(bundledFiles)).filter(([p]) => p.endsWith('/manifest.json')).map(([, t]) => JSON.parse(t));
    expect(shown.filter((m) => m.persona !== undefined || m.lore !== undefined || m.context !== undefined)).toEqual([]);
  });

  it('V-012 a un giocatore non arrivano prompt, bibbia, persone e codice degli altri', () => {
    const paths = Object.keys(playerFiles(bundledFiles));
    expect(paths.filter((p) => /^(prompts|world\/(bible|people|plots|rules|consumi))/.test(p))).toEqual([]);
    expect(paths.filter((p) => p.endsWith('.lua') && !/^modules\/core\.(movement|carpet)\//.test(p))).toEqual([]);
  });
});
