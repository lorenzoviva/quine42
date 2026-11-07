// The production server (T133, ADR-0112): built for real into a temporary folder. It does not start without its configuration, it serves the build and
// only the routes on its list, every answer has the policy, and a game of two is played over real WebSockets, each world in its process.

import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { gitLocks } from '../../server/git';
import { removeWhenFree } from './fixtures/removeWhenFree';
import { buildServer } from '../../server/buildServer';
import { contentSecurityPolicy } from '../../server/csp';
import { activeHosts } from '../../server/session';
import { buildFile, createProductionServer, frontDoorRefusal, originsOf, productionProblems, type ProductionServer } from '../../server/production';
import type { AccountSettings } from '../../server/account';
import { bundledFiles } from '../../src/kernel/bundle';
import { HANDMADE_CONTRACT } from '../../src/kernel/handmade';
import { accountWanderer } from '../../src/session/account';
import type { ServerMsg } from '../../src/session/protocol';

const SITE = 'https://gioco.example';
const FAKE = { key: 'FINTA-chiave-gemini-t133', webhook: 'FINTO-segreto-webhook-t133', firebase: 'FINTA-chiave-firebase-t133', stripe: 'FINTA-chiave-stripe-t133' };
const ENV = { FIREBASE_PROJECT_ID: 'prova', FIREBASE_API_KEY: FAKE.firebase, STRIPE_WEBHOOK_SECRET: FAKE.webhook, STRIPE_SECRET_KEY: FAKE.stripe, QUINE_ORIGINI: SITE };

describe('non parte senza configurazione', () => {
  const said = (env: Record<string, string | undefined>) => productionProblems(env).join('\n');

  it('V-014 con tutto ciò che serve non ha nulla da dire', () => {
    expect(productionProblems(ENV)).toEqual([]);
  });

  it.each([
    ['FIREBASE_PROJECT_ID', 'chi verifica le identità'],
    ['FIREBASE_API_KEY', 'browser'],
    ['STRIPE_WEBHOOK_SECRET', 'accreditare'],
    ['QUINE_ORIGINI', 'siti'],
  ])('V-014 senza %s no', (name, why) => {
    const env: Record<string, string | undefined> = { ...ENV };
    delete env[name];
    expect(said(env)).toContain(name);
    expect(said(env)).toContain(why);
  });

  it('V-006 niente emulatore, che prende token senza firma, né una chiave finta di Stripe', () => {
    expect(said({ ...ENV, FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099' })).toContain('FIREBASE_AUTH_EMULATOR_HOST');
    expect(said({ ...ENV, STRIPE_SECRET_KEY: 'mock_prova' })).toContain('STRIPE_SECRET_KEY');
    expect(said({ ...ENV, STRIPE_SECRET_KEY: 'mock' })).toContain('STRIPE_SECRET_KEY');
  });

  it('V-002 la chiave di Gemini solo con un tetto scritto', () => {
    expect(said({ ...ENV, GEMINI_API_KEY: FAKE.key })).toContain('GEMINI_TETTO_GIORNALIERO');
    expect(said({ ...ENV, GEMINI_API_KEY: FAKE.key, GEMINI_TETTO_GIORNALIERO: 'molto' })).toContain('GEMINI_TETTO_GIORNALIERO');
    expect(productionProblems({ ...ENV, GEMINI_API_KEY: FAKE.key, GEMINI_TETTO_GIORNALIERO: '10' })).toEqual([]);
  });

  it('V-014 le origini: https, o http solo per questa macchina; niente percorsi, jolly, credenziali', () => {
    expect(originsOf(' https://a.example , http://localhost:4173 ,https://b.example/')).toEqual({ origins: ['https://a.example', 'http://localhost:4173', 'https://b.example'], bad: [] });
    for (const no of ['http://a.example', 'https://a.example/x', '*', 'https://*.example', 'https://u:p@a.example', 'ftp://a.example', 'null']) expect(originsOf(no).bad, no).toEqual([1]);
  });

  it('V-014 ciò che dice non ripete mai un valore', () => {
    const text = said({ QUINE_ORIGINI: FAKE.key, GEMINI_API_KEY: FAKE.key, STRIPE_SECRET_KEY: 'mock_' + FAKE.stripe, FIREBASE_AUTH_EMULATOR_HOST: FAKE.firebase });
    for (const v of Object.values(FAKE)) expect(text).not.toContain(v);
  });

  it('V-014 senza la build non si crea nemmeno', () => {
    expect(() => createProductionServer({ env: ENV, dist: '/non-esiste', worldProgram: '/non-esiste/mondo.mjs', universesDir: '/non-esiste' })).toThrow(/npm run build/);
  });

  it('V-014 la porta: un’altra origine mai, un altro nome di questo server nemmeno; questa macchina è se stessa', () => {
    const req = (headers: Record<string, string>, remoteAddress = '10.0.0.1') => ({ headers, socket: { remoteAddress } });
    expect(frontDoorRefusal(req({ host: 'gioco.example', origin: SITE }), [SITE])).toBeUndefined();
    expect(frontDoorRefusal(req({ host: 'gioco.example' }), [SITE])).toBeUndefined();
    expect(frontDoorRefusal(req({ host: 'gioco.example', origin: 'https://altro.example' }), [SITE])).toBeDefined();
    expect(frontDoorRefusal(req({ host: 'gioco.example', origin: 'null' }), [SITE])).toBeDefined();
    expect(frontDoorRefusal(req({ host: 'altro.example' }), [SITE])).toBeDefined();
    expect(frontDoorRefusal(req({ host: 'localhost:9' }), [SITE])).toBeDefined();
    expect(frontDoorRefusal(req({ host: 'localhost:9' }, '127.0.0.1'), [SITE])).toBeUndefined();
    expect(frontDoorRefusal(req({ host: 'localhost:9', 'x-forwarded-for': '1.2.3.4' }, '127.0.0.1'), [SITE])).toBeDefined();
  });
});

describe('il server vero', () => {
  let work: string;
  let dist: string;
  let built: { server: string; world: string };
  let running: ProductionServer;
  let crowded: ProductionServer | undefined;
  let port: number;
  const universes = () => path.join(work, 'universes');

  /** A request as it is written (`fetch` would normalise the path and refuse to say `Host`), as from the site. */
  const ask = (target: string, o: { method?: string; headers?: Record<string, string>; body?: string; to?: number } = {}) =>
    new Promise<{ status: number; headers: http.IncomingHttpHeaders; text: string }>((resolve, reject) => {
      const r = http.request({ host: '127.0.0.1', port: o.to ?? port, path: target, method: o.method ?? 'GET', headers: { Host: 'gioco.example', ...o.headers } }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }));
      });
      r.on('error', reject);
      r.end(o.body);
    });

  const makeUniverse = (name: string, modalita = 'multigiocatore') => {
    const root = path.join(universes(), name);
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files: Record<string, string> = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, name, game: { modalita, death: 3, master: 'me' } }) };
    for (const [rel, text] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      writeFileSync(path.join(root, rel), text);
    }
    const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=Prove', '-c', 'user.email=prove@rune.local', '-c', 'core.autocrlf=false', ...a], { cwd: root, windowsHide: true, stdio: 'ignore' });
    git('init', '-q');
    git('add', '-A');
    git('commit', '-q', '-m', 'nasce');
  };

  // Accounts are the only thing not real here: a token says its uid.
  const accounts: AccountSettings = {
    config: { projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' },
    verify: async (t) => (t.startsWith('vero-') ? { uid: t.slice(5), anonymous: false } : undefined),
  };

  beforeAll(async () => {
    work = mkdtempSync(path.join(os.tmpdir(), 'quine-produzione-'));
    dist = path.join(work, 'dist');
    mkdirSync(path.join(dist, 'assets'), { recursive: true });
    mkdirSync(path.join(dist, 'site'), { recursive: true });
    mkdirSync(path.join(dist, 'lab', '3d'), { recursive: true });
    mkdirSync(path.join(dist, 'lab', 'indossati'), { recursive: true });
    mkdirSync(universes(), { recursive: true });
    writeFileSync(path.join(dist, 'index.html'), '<title>gioco</title>');
    writeFileSync(path.join(dist, 'site', 'index.html'), '<title>sito</title>');
    writeFileSync(path.join(dist, 'lab', '3d', 'index.html'), '<title>laboratorio</title>');
    writeFileSync(path.join(dist, 'lab', 'indossati', 'index.html'), '<title>banco</title>');
    writeFileSync(path.join(dist, 'assets', 'a-1.js'), 'export {}');
    writeFileSync(path.join(dist, 'assets', 'glue.wasm'), 'x');
    writeFileSync(path.join(dist, '.env'), `GEMINI_API_KEY=${FAKE.key}`);
    writeFileSync(path.join(dist, 'dati.bin'), 'senza tipo');
    writeFileSync(path.join(work, '.env'), `GEMINI_API_KEY=${FAKE.key}`);
    built = await buildServer(process.cwd(), path.join(work, 'dist-server'));
    makeUniverse('prova');
    makeUniverse('sola', 'singola');
    running = createProductionServer({ env: { ...ENV, QUINE_CODA: '1' }, dist, worldProgram: built.world, universesDir: universes(), accounts });
    await new Promise<void>((r) => running.server.listen(0, '127.0.0.1', r));
    port = (running.server.address() as AddressInfo).port;
  }, 240000);

  afterAll(async () => {
    await crowded?.stop();
    await running?.stop();
    // The last saves of the worlds have ended with the server (T209).
    expect(gitLocks(path.join(universes(), 'prova'))).toEqual([]);
    await removeWhenFree(work);
  }, 120000);

  it('V-014 serve la build, con i tipi giusti, e la radice porta al sito', async () => {
    const page = await ask('/index.html?universo=prova');
    expect([page.status, page.text]).toEqual([200, '<title>gioco</title>']);
    expect(page.headers['content-type']).toMatch(/text\/html/);
    expect((await ask('/site/')).text).toBe('<title>sito</title>');
    const script = await ask('/assets/a-1.js');
    expect(script.headers['content-type']).toMatch(/javascript/);
    expect(script.headers['cache-control']).toMatch(/immutable/);
    expect((await ask('/assets/glue.wasm')).headers['content-type']).toBe('application/wasm');
    const root = await ask('/');
    expect([root.status, root.headers.location]).toEqual([302, '/site/']);
    expect((await ask('/?universo=prova')).text).toBe('<title>gioco</title>');
    // Without a universe it would be a game alone, which here nobody makes.
    const alone = await ask('/index.html');
    expect([alone.status, alone.headers.location]).toEqual([302, '/site/sessioni.html']);
    const head = await ask('/index.html?universo=prova', { method: 'HEAD' });
    expect([head.status, head.text]).toEqual([200, '']);
    expect((await ask('/index.html?universo=prova', { method: 'POST' })).status).toBe(405);
  });

  it('V-014 oltre la build nulla, in nessuna forma', async () => {
    for (const target of [
      '/.env',
      '/%2eenv',
      '/../.env',
      '/..%2f.env',
      '/%2e%2e/.env',
      '/assets/../../.env',
      '/..%5c.env',
      '/universes/prova/universe.json',
      '/@fs/etc/passwd',
      `/@fs/${work.replace(/\\/g, '/')}/.env`,
      '/@vite/client',
      '/src/main.ts',
      '/server/production.ts',
      '/package.json',
      '/lab/3d/',
      '/lab/3d/index.html',
      '/dati.bin',
      '/nessuno',
      '/%00',
      '/%',
      '/C:/Windows/win.ini',
    ]) {
      const r = await ask(target);
      expect(r.status, target).toBe(404);
      expect(r.text, target).not.toContain(FAKE.key);
    }
    expect(buildFile(dist, '/index.html')).toBe(path.join(dist, 'index.html'));
    expect(buildFile(dist, '/assets/../index.html')).toBeUndefined();
  });

  it('V-009 solo le rotte dell’elenco: niente Gemini, niente coda, anche con QUINE_CODA=1 e da questa macchina', async () => {
    for (const headers of [{}, { Host: `localhost:${port}` }] as Array<Record<string, string>>) {
      for (const target of ['/api/gemini/status', '/api/coda', '/api/coda/prendi', '/api/qualunque', '/api']) {
        const r = await ask(target, { headers });
        expect(r.status, target).toBe(404);
      }
      expect((await ask('/api/gemini/models/gemini-3.1-flash-lite:generateContent', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(404);
    }
    expect((await ask('/api/universe')).status).toBe(200);
    expect(JSON.parse((await ask('/api/account')).text)).toEqual(accounts.config);
    expect((await ask('/api/stripe/config')).status).toBe(200);
    expect((await ask('/api/session')).status).toBe(200);
    expect((await ask('/api/viandante?universo=prova')).status).toBe(401);
    expect((await ask('/api/crediti?universo=prova')).status).toBe(401);
  });

  it('V-015 ogni risposta ha la stessa CSP: pagine, rotte, errori, rifiuti', async () => {
    const policy = contentSecurityPolicy(accounts.config);
    for (const [target, o] of [
      ['/index.html', {}],
      ['/', {}],
      ['/nessuno', {}],
      ['/api/universe', {}],
      ['/api/qualunque', {}],
      ['/api/universe/prova/commit', { method: 'POST' }],
      ['/index.html', { headers: { Origin: 'https://altro.example' } }],
      ['/index.html', { headers: { Host: 'altro.example' } }],
      ['/index.html', { method: 'DELETE' }],
    ] as const) {
      const r = await ask(target, o);
      expect(r.headers['content-security-policy'], target).toBe(policy);
      expect(r.headers['x-content-type-options'], target).toBe('nosniff');
    }
  });

  it('V-014 un altro sito o un altro nome non arrivano alle rotte', async () => {
    const other = await ask('/api/universe', { headers: { Origin: 'https://altro.example' } });
    expect(other.status).toBe(403);
    expect((await ask('/api/universe', { headers: { Host: 'altro.example' } })).status).toBe(403);
    expect((await ask('/api/universe', { headers: { Origin: SITE } })).status).toBe(200);
  });

  it('V-029 un altro sito non ha CORS: nemmeno una risposta al preflight, e nessuna risposta lo concede', async () => {
    const preflight = await ask('/api/universe/prova/commit', { method: 'OPTIONS', headers: { Origin: 'https://altro.example', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization' } });
    expect(preflight.status).toBe(403);
    // Without `Origin` (a <script> of another site) a file of the build comes, but no page can read it; the same site's own requests get no header either.
    for (const r of [preflight, await ask('/assets/a-1.js'), await ask('/api/universe', { headers: { Origin: SITE } })]) {
      expect(Object.keys(r.headers).filter((h) => h.startsWith('access-control-'))).toEqual([]);
    }
  });

  it('V-028 il checkout passa dalla stessa porta delle altre rotte: un altro sito no, un corpo che non è JSON no', async () => {
    expect((await ask('/api/stripe/checkout', { method: 'POST', headers: { Origin: 'https://altro.example', 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(403);
    expect((await ask('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' })).status).toBe(415);
  });

  it('V-020 ciò che si rompe dentro una rotta non arriva al client', async () => {
    const said: string[] = [];
    const warn = console.warn;
    console.warn = (...a: unknown[]) => void said.push(a.join(' '));
    try {
      const broken = await ask('/api/universe/rotto/create', { method: 'POST', headers: { Authorization: 'Bearer vero-estraneo', 'Content-Type': 'application/json' }, body: '{non è json' });
      expect(broken.status).toBe(500);
      expect(JSON.parse(broken.text).error).toBe('il server non è riuscito a farlo: riprova tra poco');
      expect(said.join('\n')).toContain('[universi]');
    } finally {
      console.warn = warn;
    }
  });

  it('V-001 le regole delle rotte restano: chi non è il master non scrive, un webhook senza firma non accredita', async () => {
    const bearer = { Authorization: 'Bearer vero-estraneo', 'Content-Type': 'application/json' };
    const write = await ask('/api/universe/prova/commit', { method: 'POST', headers: bearer, body: JSON.stringify({ changes: { 'universe.json': '{}' }, message: 'x' }) });
    expect(write.status).toBe(403);
    expect((await ask('/api/universe/prova/commit', { method: 'POST', headers: { Authorization: 'Bearer falso', 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(401);
    const hook = await ask('/api/stripe/webhook', { method: 'POST', body: '{}', headers: { 'stripe-signature': 't=1,v1=00' } });
    expect(hook.status).toBe(400);
    // Who has no account makes no universe, not even a game alone: that is only of who is on this machine.
    const made = await ask('/api/universe/nuovo/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: { 'universe.json': '{}' }, message: 'x' }) });
    expect(made.status).toBe(403);
    expect(existsSync(path.join(universes(), 'nuovo'))).toBe(false);
    const read = await ask('/api/universe/prova');
    expect(Object.keys(JSON.parse(read.text).files).filter((p) => p.startsWith('prompts/'))).toEqual([]);
  });

  it('V-030 le carte fatte a mano: spente rifiutano; accese, il programma lo controlla il programma dei mondi in un processo suo, al ritmo delle rotte pesanti', async () => {
    const json = { Authorization: 'Bearer vero-alice', 'Content-Type': 'application/json' };
    // Off, as `labs` is unless said: refused, nothing written, and `/lab` is not served.
    for (const [method, target] of [['GET', '/api/handmade'], ['POST', '/api/handmade'], ['DELETE', '/api/handmade/handmade-aaaaaaaaaa']] as const) {
      expect((await ask(target, { method, headers: json, ...(method === 'POST' ? { body: '{}' } : {}) })).status, `${method} ${target}`).toBe(403);
    }
    expect(existsSync(path.join(universes(), '.handmade'))).toBe(false);
    const own = path.join(work, 'universes-laboratori');
    mkdirSync(own, { recursive: true });
    const labs = createProductionServer({ env: ENV, dist, worldProgram: built.world, universesDir: own, accounts, labs: true, rates: { heavy: { burst: 4, perSecond: 0.001 } } });
    await new Promise<void>((r) => labs.server.listen(0, '127.0.0.1', r));
    const to = (labs.server.address() as AddressInfo).port;
    try {
      // On, the three labs of the players are served, under the same policy; nothing else of `/lab` (T294).
      for (const target of ['/lab/3d/', '/lab/3d/index.html', '/lab/3d/?card=handmade-aaaaaaaaaa']) {
        const page = await ask(target, { to });
        expect(page.status, target).toBe(200);
        expect(page.text).toContain('laboratorio');
        expect(page.headers['content-security-policy'], target).toMatch(/script-src 'self'/);
      }
      const bare = await ask('/lab/3d?fork=prova/barile', { to });
      expect(bare.status).toBe(301);
      expect(bare.headers.location).toBe('/lab/3d/?fork=prova%2Fbarile');
      for (const target of ['/lab/', '/lab', '/lab/indossati/', '/lab/indossati/index.html', '/LAB/3d/', '/lab/3D/', '/lab/3d/../indossati/', '/lab/3d/%2e%2e/indossati/', '/lab/3d/../../.env', '/lab/scripts/gemini.ts']) {
        expect((await ask(target, { to })).status, target).toBe(404);
      }
      expect(buildFile(dist, '/lab/3d/', true)).toBe(path.join(dist, 'lab', '3d', 'index.html'));
      expect(buildFile(dist, '/lab/3d/', false)).toBeUndefined();
      expect(buildFile(dist, '/lab/indossati/', true)).toBeUndefined();
      const small = readFileSync('universe/models/object.xml', 'utf8');
      const card = { kernel: HANDMADE_CONTRACT, kind: 'model', name: 'Fagotto', class: 'object', xml: small };
      const ok = await ask('/api/handmade', { to, method: 'POST', headers: json, body: JSON.stringify(card) });
      expect(ok.status).toBe(201);
      expect(JSON.parse(ok.text).card).toMatchObject({ name: 'Fagotto', mine: true });
      const endless = await ask('/api/handmade', { to, method: 'POST', headers: json, body: JSON.stringify({ ...card, xml: '<markov values="BW" size="4 4 4"><one><rule in="B" out="W"/></one><one><rule in="W" out="B"/></one></markov>' }) });
      expect(endless.status).toBe(422);
      expect(JSON.parse(endless.text).errors.join()).toMatch(/non finisce/);
      // Every route of the cards is heavy: the fourth of this address passes, the fifth waits.
      expect((await ask('/api/handmade', { to, headers: json })).status).toBe(200);
      expect((await ask('/api/handmade?mine=1', { to, headers: json })).status).toBe(200);
      expect((await ask('/api/handmade', { to, headers: json })).status).toBe(429);
      expect(readdirSync(path.join(own, '.handmade'))).toEqual(['alice.json']);
    } finally {
      await labs.stop();
    }
  }, 120000);

  describe('sul WebSocket', () => {
    const open = (query: string, o: { origin?: string; host?: string; target?: string } = {}) => new WebSocket(`ws://127.0.0.1:${port}${o.target ?? '/api/session'}${query}`, { origin: o.origin ?? SITE, headers: { Host: o.host ?? 'gioco.example' } });
    const closedBefore = (ws: WebSocket) =>
      new Promise<number | string>((resolve) => {
        ws.on('unexpected-response', (_r, res) => resolve(res.statusCode ?? 0));
        ws.on('error', (e) => resolve(e.message));
        ws.on('open', () => resolve('aperto'));
      });
    /** A client of the game that keeps what it hears. */
    const player = (ws: WebSocket) => {
      const heard: ServerMsg[] = [];
      ws.on('message', (d) => heard.push(JSON.parse(String(d))));
      return {
        heard,
        // `send` on a closed socket drops the message without a word: the wait after it would only say that time ran out.
        say: (m: unknown) => {
          if (ws.readyState !== ws.OPEN) throw new Error(`il socket è chiuso, non si dice ${JSON.stringify(m)}: ${JSON.stringify(heard.filter((h) => h.t === 'refusal'))}`);
          ws.send(JSON.stringify(m));
        },
        of: <T extends ServerMsg['t']>(t: T) => heard.filter((m) => m.t === t) as Array<Extract<ServerMsg, { t: T }>>,
      };
    };
    const until = async (what: () => unknown, ms: number, label: string) => {
      const end = Date.now() + ms;
      for (;;) {
        if (what()) return;
        if (Date.now() > end) throw new Error(`scaduta: ${label}`);
        await new Promise((r) => setTimeout(r, 25));
      }
    };

    /** Until they are in; a refusal is said as it is, at once, not as time that ran out. */
    const entered = async (p: ReturnType<typeof player>, ms: number, label: string) => {
      await until(() => p.of('welcome').length || p.of('refusal').length, ms, label);
      const refused = p.of('refusal')[0];
      if (refused) throw new Error(`${label}: rifiuto «${refused.reason}»`);
    };

    it('V-014 un altro sito e un altro nome no; un altro percorso nemmeno', async () => {
      expect(await closedBefore(open('?universo=prova', { origin: 'https://altro.example' }))).toBe(403);
      expect(await closedBefore(open('?universo=prova', { host: 'altro.example' }))).toBe(403);
      expect(await closedBefore(open('', { target: '/@vite/ws' }))).not.toBe('aperto');
    });

    it('V-006 una partita di due, ciascuno col suo account: si vedono; un token falso è un rifiuto; `offline` non si ascolta', async () => {
      const a = open('?universo=prova&offline');
      const pa = player(a);
      await closedBefore(a);
      const [ida, idb] = [accountWanderer('uid-alice'), accountWanderer('uid-bruno')];
      pa.say({ t: 'join', id: ida, token: 'vero-uid-alice' });
      await entered(pa, 120000, 'ingresso di alice');
      expect(pa.of('welcome')[0].id).toBe(ida);
      // Only now: a socket has ENTRY_MS to say who it is, and the world alice starts can take longer than that (T174).
      const b = open('?universo=prova');
      const pb = player(b);
      await closedBefore(b);
      pb.say({ t: 'join', id: 'chiunque', token: 'vero-uid-bruno' });
      await entered(pb, 30000, 'ingresso di bruno');
      // Who you are is the token's, not what you say.
      expect(pb.of('welcome')[0].id).toBe(idb);
      expect(pb.of('welcome')[0].wanderers.map((v) => v.id)).toContain(ida);
      await until(() => pa.of('update').some((m) => m.wanderers?.some((v) => v.id === idb)), 15000, 'alice vede bruno');
      // A player is sent only what the client draws (ADR-0109).
      expect(pb.of('welcome')[0].files['world/bible.json']).toBeUndefined();

      const c = open('?universo=prova');
      const pc = player(c);
      await closedBefore(c);
      pc.say({ t: 'join', id: ida, token: 'falso' });
      await until(() => pc.of('refusal').length, 15000, 'refusal');

      const seen = JSON.parse((await ask('/api/session')).text);
      expect(seen.sessions).toContainEqual(expect.objectContaining({ name: 'prova', active: true }));
      for (const ws of [a, b, c]) ws.close();
    }, 240000);

    /** What a socket is told when it names a universe, before it says who it is. */
    const refusalFor = async (to: number, name: string) => {
      const ws = new WebSocket(`ws://127.0.0.1:${to}/api/session?universo=${name}`, { origin: SITE, headers: { Host: 'gioco.example' } });
      const p = player(ws);
      await until(() => p.of('refusal').length, 15000, `rifiuto di ${name}`);
      ws.close();
      return p.of('refusal')[0].reason;
    };

    it('V-025 un socket non avvia un mondo per un nome che non esiste né per una partita in singola', async () => {
      expect(await refusalFor(port, 'non-esiste')).toMatch(/non esiste/);
      expect(await refusalFor(port, 'sola')).toMatch(/singola/);
      for (const name of ['non-esiste', 'sola']) expect(activeHosts.has(name)).toBe(false);
    }, 60000);

    it('V-025 al più QUINE_MONDI_MASSIMI mondi accesi', async () => {
      crowded = createProductionServer({ env: { ...ENV, QUINE_MONDI_MASSIMI: '1' }, dist, worldProgram: built.world, universesDir: universes(), accounts });
      await new Promise<void>((r) => crowded!.server.listen(0, '127.0.0.1', r));
      const to = (crowded.server.address() as AddressInfo).port;
      makeUniverse('terza');
      // The list of the worlds is the process's: one place taken is the whole of this limit.
      activeHosts.set('segnaposto', Promise.resolve({ error: 'segnaposto' }));
      try {
        expect(await refusalFor(to, 'terza')).toMatch(/troppi mondi/);
        expect(activeHosts.has('terza')).toBe(false);
      } finally {
        activeHosts.delete('segnaposto');
      }
    }, 60000);

    it('V-021 un messaggio malformato non ferma il mondo; prima di «entra» non arriva a lui', async () => {
      const a = open('?universo=prova');
      const pa = player(a);
      await closedBefore(a);
      // Nobody has said who they are yet.
      pa.say({ t: 'chat', id: {}, text: 'prima di entrare' });
      pa.say({ t: 'join', id: accountWanderer('uid-carla'), token: 'vero-uid-carla' });
      await entered(pa, 120000, 'ingresso di carla');
      const b = open('?universo=prova');
      const pb = player(b);
      await closedBefore(b);
      pb.say({ t: 'join', id: accountWanderer('uid-dario'), token: 'vero-uid-dario' });
      await entered(pb, 30000, 'ingresso di dario');
      for (const m of [null, 7, [], {}, { t: {} }, { t: 'step', x: {}, y: [] }, { t: 'step', seq: { toString: 1 } }, { t: 'chat', id: [], text: {} }, { t: 'join', id: {} }, { t: 'profile', profile: 'x' }, { t: 'action', x: 'y' }, { t: 'give', wanderer: {}, slot: {}, count: {} }]) pa.say(m);
      // What it sends after those is the same world's: none restarted, no warning that it stopped.
      const before = pa.heard.length + pb.heard.length;
      await until(() => pa.heard.length + pb.heard.length > before + 5, 20000, 'il mondo risponde ancora');
      expect([...pa.of('world'), ...pb.of('world')]).toEqual([]);
      for (const ws of [a, b]) ws.close();
    }, 240000);
  });

  describe('il file costruito', () => {
    /** The built server, with only the environment it is given. */
    const start = (env: Record<string, string>) => {
      const child = spawn(process.execPath, [built.server], { env: { ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}), QUINE_UNIVERSI: universes(), ...env }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      const out = { text: '' };
      child.stdout.on('data', (d) => (out.text += String(d)));
      child.stderr.on('data', (d) => (out.text += String(d)));
      return { child, out, ended: new Promise<number | null>((r) => child.on('exit', (code) => r(code))) };
    };
    let live: ChildProcess | undefined;

    afterAll(() => void live?.kill());

    it('V-014 non parte senza configurazione: esce con i nomi, senza i valori', async () => {
      const { ended, out } = start({ STRIPE_SECRET_KEY: `mock_${FAKE.stripe}`, GEMINI_API_KEY: FAKE.key, QUINE_ORIGINI: FAKE.firebase });
      expect(await ended).toBe(1);
      for (const name of ['FIREBASE_PROJECT_ID', 'STRIPE_WEBHOOK_SECRET', 'QUINE_ORIGINI', 'STRIPE_SECRET_KEY', 'GEMINI_TETTO_GIORNALIERO']) expect(out.text).toContain(name);
      for (const v of Object.values(FAKE)) expect(out.text).not.toContain(v);
    }, 60000);

    it('V-014 con la configurazione parte da solo, senza Vite, e un token falso non passa', async () => {
      const text = readFileSync(built.server, 'utf8');
      // Vite is only named by what builds the worlds, which here is never called.
      expect(text).not.toMatch(/^\s*import\s[^;]*from\s+["']vite["']/m);
      expect(text).not.toContain('configureServer(server2)');
      const s = start({ ...ENV, QUINE_PORTA: '0' });
      live = s.child;
      await until2(() => /in ascolto su [^:]+:(\d+)/.test(s.out.text), 30000);
      const to = Number(/in ascolto su [^:]+:(\d+)/.exec(s.out.text)?.[1]);
      const account = await ask('/api/account', { to });
      expect(account.status).toBe(200);
      expect(account.headers['content-security-policy']).toContain("default-src 'self'");
      expect(JSON.parse(account.text).projectId).toBe('prova');
      expect((await ask('/api/viandante?universo=prova', { to, headers: { Authorization: 'Bearer falso' } })).status).toBe(401);
      expect((await ask('/api/coda', { to })).status).toBe(404);
      // Nothing says a secret, at any of its doors.
      for (const v of [FAKE.webhook, FAKE.stripe]) expect(account.text).not.toContain(v);
      expect(s.out.text).not.toContain(FAKE.webhook);
    }, 60000);
  });
});

async function until2(what: () => unknown, ms: number): Promise<void> {
  const end = Date.now() + ms;
  while (!what()) {
    if (Date.now() > end) throw new Error('scaduta');
    await new Promise((r) => setTimeout(r, 25));
  }
}
