// T134: the rules of access tried against real servers, each in its own process, with the real build of the client, the built program of the worlds, fake secrets
// and no way out of this machine (`fixtures/rete-finta.mjs`). Two servers: the file `npm run serve` starts, with the real verifier of tokens (firebase-admin),
// and the same modules with a verifier that takes tokens of ours, the only way to have accounts here. All that comes out (answers, sockets, logs, what is on disk,
// the builds) is kept and looked through for the fake values at the end.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { buildServer } from '../../server/buildServer';
import { createFakeStripeSignature } from '../../server/stripe';
import { PROGRAM_HEAD } from '../../server/worldHost';
import { bundledFiles } from '../../src/kernel/bundle';
import { accountWanderer } from '../../src/session/account';
import type { ServerMsg } from '../../src/session/protocol';
// @ts-expect-error a plain .mjs of the kit, without types
import { cleanEnv, fakeSecrets, git, makeProject, removeProject, REPO, writeEnv } from '../../tools/sicurezza/ambiente.mjs';

const SITE = 'https://gioco.example';
const HOST = 'gioco.example';
const NETWORK_STUB = path.resolve('tests/sicurezza/fixtures/rete-finta.mjs');
const MASTER = accountWanderer('uid-master');
const ALICE = accountWanderer('uid-alice');
const BRUNO = accountWanderer('uid-bruno');
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const json = { 'Content-Type': 'application/json' };

let work: string;
let secrets: Record<string, string>;
let baseEnv: Record<string, string>;
/** Everything a client was told, on any door: the last test looks for the values in it. */
const heardByClients: string[] = [];

interface Answer {
  status: number;
  headers: http.IncomingHttpHeaders;
  text: string;
}

/** A request as it is written (`fetch` would normalise the path and refuse to say `Host`), as from the site. */
const askAt = (port: number, target: string, o: { method?: string; headers?: Record<string, string>; body?: string } = {}) =>
  new Promise<Answer>((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, path: target, method: o.method ?? 'GET', headers: { Host: HOST, ...o.headers } }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        heardByClients.push(JSON.stringify(res.headers), text);
        resolve({ status: res.statusCode ?? 0, headers: res.headers, text });
      });
    });
    r.on('error', reject);
    r.end(o.body);
  });

const until = async (what: () => unknown, ms: number, label: string) => {
  const end = Date.now() + ms;
  for (;;) {
    if (what()) return;
    if (Date.now() > end) throw new Error(`scaduta: ${label}`);
    await new Promise((r) => setTimeout(r, 25));
  }
};

/** A universe of many on disk, as `create` leaves it. */
function makeUniverse(universes: string, name: string, master: string): string {
  const root = path.join(universes, name);
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files: Record<string, string> = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, name, partita: { modalita: 'multigiocatore', morte: 3, master } }) };
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), text);
  }
  git(root, ['init', '-q']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'nasce']);
  return root;
}

const ledgerOf = (universes: string, name: string) => path.join(universes, '.saldi', `${name}.json`);

/** A server in a process of its own, with only the environment it is given and nothing out of the machine. What it and its worlds write is kept. */
function startServer(args: string[], env: Record<string, string>, network: string) {
  const child = spawn(process.execPath, ['--import', pathToFileURL(NETWORK_STUB).href, ...args], { cwd: work, env: { ...baseEnv, ...env, RETE_FINTA: network }, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const out = { text: '' };
  child.stdout.on('data', (d) => (out.text += String(d)));
  child.stderr.on('data', (d) => (out.text += String(d)));
  const ended = new Promise<number | null>((r) => child.on('exit', (code) => r(code)));
  const ready = async () => {
    await until(() => /in ascolto su [^:]+:(\d+)/.test(out.text) || child.exitCode !== null, 120000, 'il server non si mette in ascolto');
    const port = Number(/in ascolto su [^:]+:(\d+)/.exec(out.text)?.[1]);
    if (!port) throw new Error(`il server non è partito: ${out.text.slice(0, 2000)}`);
    return port;
  };
  return { child, out, ended, ready };
}

const networkOf = (file: string): Array<Record<string, unknown>> => (existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

function walk(dir: string, skip: (rel: string) => boolean = () => false, base = dir): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (skip(path.relative(base, abs))) continue;
    if (e.isDirectory()) out.push(...walk(abs, skip, base));
    else if (e.isFile()) out.push(abs);
  }
  return out;
}

function makeEvent(id: string, universo: string, wandererId: string, cents: number, extra: Record<string, unknown> = {}) {
  return JSON.stringify({ id, type: 'checkout.session.completed', data: { object: { id: `cs_${id}`, payment_status: 'paid', amount_total: cents, currency: 'usd', metadata: { universo, wandererId, crediti: '1000000' }, ...extra } } });
}

let serverFile: string;
let worldProgram: string;
let launcher: string;

beforeAll(async () => {
  secrets = fakeSecrets() as Record<string, string>;
  work = await makeProject(secrets);
  baseEnv = {
    ...(cleanEnv(work) as Record<string, string>),
    ...secrets,
    FIREBASE_PROJECT_ID: 'prova',
    FIREBASE_API_KEY: 'pubblica',
    QUINE_ORIGINI: SITE,
    GEMINI_TETTO_GIORNALIERO: '10',
  };
  await writeEnv(work, { ...secrets, FIREBASE_PROJECT_ID: 'prova', FIREBASE_API_KEY: 'pubblica' });

  // The client, with the secrets in its `.env`; the server and the worlds, with them in the environment of who builds.
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(REPO, 'tools', 'sicurezza', 'server.mjs'), 'build'], { cwd: work, env: cleanEnv(work), stdio: 'ignore', windowsHide: true });
    child.on('error', reject);
    child.on('exit', resolve);
  });
  expect(code).toBe(0);
  for (const [k, v] of Object.entries(secrets)) vi.stubEnv(k, v);
  try {
    const built = await buildServer(process.cwd(), path.join(work, 'dist-server'));
    serverFile = built.server;
    worldProgram = built.world;
    const { build } = await import('vite');
    await build({
      configFile: false,
      envFile: false,
      root: process.cwd(),
      logLevel: 'error',
      publicDir: false,
      ssr: { noExternal: true },
      build: {
        ssr: 'tests/sicurezza/fixtures/server-con-account.ts',
        outDir: path.join(work, 'lanciatore'),
        emptyOutDir: false,
        minify: false,
        reportCompressedSize: false,
        commonjsOptions: { ignoreDynamicRequires: true, ignore: ['bufferutil', 'utf-8-validate'] },
        rollupOptions: { external: ['vite', /^firebase-admin(\/|$)/], output: { entryFileNames: 'lanciatore.mjs', banner: PROGRAM_HEAD } },
      },
    });
    launcher = path.join(work, 'lanciatore', 'lanciatore.mjs');
  } finally {
    vi.unstubAllEnvs();
  }
}, 900000);

afterAll(async () => {
  if (work) expect(await removeProject(work)).toBeUndefined();
}, 60000);

describe('con gli account', () => {
  let port: number;
  let server: ReturnType<typeof startServer>;
  let universes: string;
  let root: string;
  const network = () => path.join(work, 'rete-account.jsonl');
  const ask = (target: string, o: { method?: string; headers?: Record<string, string>; body?: string } = {}) => askAt(port, target, o);
  const post = (target: string, token: string | undefined, body: unknown, headers: Record<string, string> = {}) => ask(target, { method: 'POST', headers: { ...json, ...(token ? bearer(token) : {}), ...headers }, body: JSON.stringify(body) });
  const head = () => git(root, ['rev-parse', 'HEAD']).trim();
  const webhook = (raw: string, signature = createFakeStripeSignature(raw, secrets.STRIPE_WEBHOOK_SECRET)) => ask('/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': signature, ...json }, body: raw });
  const balance = async (token: string) => JSON.parse((await ask('/api/crediti?universo=prova', { headers: bearer(token) })).text).portafoglio?.crediti;

  beforeAll(async () => {
    universes = path.join(work, 'universes');
    root = makeUniverse(universes, 'prova', MASTER);
    makeUniverse(universes, 'altro', MASTER);
    server = startServer([launcher, path.join(work, 'dist'), worldProgram, universes], { QUINE_UNIVERSI: universes }, network());
    port = await server.ready();
  }, 180000);

  afterAll(async () => {
    server?.child.stdin?.end();
    await Promise.race([server?.ended, new Promise((r) => setTimeout(r, 30000))]);
    if (server?.child.exitCode === null) server.child.kill();
    await server?.ended;
  }, 60000);

  describe('la build vera', () => {
    it('V-014 la pagina del gioco e quelle del sito si aprono, e ciò che chiedono c’è', async () => {
      for (const page of ['/?universo=prova', '/site/', '/site/sessioni.html', '/site/profilo.html', '/site/pagamenti.html', '/site/carte.html']) {
        const r = await ask(page);
        expect(r.status, page).toBe(200);
        expect(r.headers['content-type'], page).toMatch(/text\/html/);
        expect(r.headers['content-security-policy'], page).toContain("default-src 'self'");
        const wanted = [...r.text.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]).filter((u) => /\.(js|css)$/.test(u));
        expect(wanted.length, page).toBeGreaterThan(0);
        for (const asset of wanted) expect((await ask(asset)).status, asset).toBe(200);
        expect(r.text, page).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
      }
    });

    it('V-014 oltre la build nulla: né i segreti, né il server, né gli universi', async () => {
      expect(existsSync(path.join(work, '.env'))).toBe(true);
      for (const target of ['/.env', '/%2eenv', '/..%2f.env', '/%2e%2e/.env', '/assets/..%2f..%2f.env', '/..%5c.env', '/dist-server/server.mjs', '/lanciatore/lanciatore.mjs', '/universes/prova/universe.json', '/%2e%2e/universes/prova/universe.json', '/universes/.saldi/prova.json', '/rete-account.jsonl', '/package.json', '/lab/3d/index.html', '/@fs/etc/hosts', '/src/main.ts']) {
        expect((await ask(target)).status, target).toBe(404);
      }
    });
  });

  describe('l’identità', () => {
    const commit = { changes: { 'world/nota.md': 'scritta' }, message: 'x' };

    it('V-001 chi non è il master non scrive, in nessuna operazione, comunque si presenti', async () => {
      const before = head();
      const writes: Array<[string, unknown]> = [
        ['commit', commit],
        ['checkout', { id: before }],
        ['reset', {}],
        ['branch', { branch: 'rami/master', files: { 'world/nota.md': 'x' } }],
        ['merge', { branch: 'rami/master' }],
        ['clone', { nome: 'mio', master: ALICE }],
      ];
      const callers: Array<[string, string | undefined, Record<string, string>, number[]]> = [
        ['nessuno', undefined, {}, [403]],
        ['un token falso', 'falso', {}, [401]],
        ['un altro account', 'vero-uid-alice', {}, [403]],
        ['un anonimo', 'anon-uid-master', {}, [403]],
        ['chi dice di essere il master', undefined, { 'X-Quine-Viandante': MASTER }, [403]],
        ['un account che dice di essere il master', 'vero-uid-alice', { 'X-Quine-Viandante': MASTER }, [403]],
        ['chi dice di essere il mondo', undefined, { 'X-Quine-Interno': 'a'.repeat(64) }, [403]],
        ['questo indirizzo con un nome di questa macchina', undefined, { Host: `localhost:${port}` }, [403]],
        ['chi dichiara un altro indirizzo', 'vero-uid-alice', { 'X-Forwarded-For': '127.0.0.1' }, [403]],
      ];
      for (const [op, body] of writes) {
        for (const [who, token, headers, status] of callers) {
          const r = await post(`/api/universe/prova/${op}`, token, body, headers);
          expect(status, `${op}: ${who}`).toContain(r.status);
        }
      }
      expect((await ask('/api/universe/prova/map/0_0', { method: 'PUT', headers: { ...json, ...bearer('vero-uid-alice') }, body: '{}' })).status).toBe(403);
      expect(existsSync(path.join(universes, 'mio'))).toBe(false);
      expect(existsSync(path.join(root, 'world', 'nota.md'))).toBe(false);
      expect(head()).toBe(before);
    });

    it('V-001 il master scrive, ed è il token a dirlo', async () => {
      const before = head();
      const r = await post('/api/universe/prova/commit', 'vero-uid-master', { changes: { 'world/nota.md': 'del master' }, message: 'del master' });
      expect(r.status).toBe(200);
      expect(readFileSync(path.join(root, 'world', 'nota.md'), 'utf8')).toBe('del master');
      expect(head()).not.toBe(before);
    });

    it('V-001 nemmeno il master scrive i crediti da fuori', async () => {
      const r = await post('/api/universe/prova/commit', 'vero-uid-master', { changes: { [`world/giocatori/${ALICE}.json`]: '{"crediti":1000}' }, message: 'x' });
      expect(r.status).toBe(403);
    });

    it('V-012 chi non è il master legge solo ciò che è pubblico; il master tutto', async () => {
      for (const headers of [{}, bearer('vero-uid-alice'), bearer('anon-uid-master'), { Host: `localhost:${port}` }] as Array<Record<string, string>>) {
        const r = JSON.parse((await ask('/api/universe/prova', { headers })).text);
        expect(r.exists).toBe(true);
        expect(r.log).toBeUndefined();
        expect(Object.keys(r.files).filter((p) => /^(prompts\/|world\/(giocatori|consumi|stato))/.test(p))).toEqual([]);
        // Of the code only the two modules every client runs for its own wanderer (ADR-0061); of the bible what the realm's card says of it.
        expect(Object.keys(r.files).filter((p) => p.endsWith('logic.lua')).sort()).toEqual(['modules/core.carpet/logic.lua', 'modules/core.movement/logic.lua']);
        expect(Object.keys(JSON.parse(r.files['world/bible.json'])).filter((k) => !['concetto', 'tema'].includes(k))).toEqual([]);
        expect(JSON.parse(r.files['universe.json']).ai?.provider).toBeUndefined();
      }
      const own = JSON.parse((await ask('/api/universe/prova', { headers: bearer('vero-uid-master') })).text);
      expect(own.files['world/nota.md']).toBe('del master');
      expect(Object.keys(own.files).some((p) => p.startsWith('prompts/'))).toBe(true);
    });

    it('V-006 viandante e crediti sono del token: senza, niente; un id detto non vale', async () => {
      for (const route of ['/api/viandante?universo=prova', '/api/crediti?universo=prova']) {
        expect((await ask(route)).status, route).toBe(401);
        expect((await ask(route, { headers: { 'X-Quine-Viandante': MASTER } })).status, route).toBe(401);
        expect((await ask(route, { headers: bearer('falso') })).status, route).toBe(401);
      }
      const asked = JSON.parse((await ask(`/api/viandante?universo=prova&viandante=${MASTER}`, { headers: bearer('vero-uid-alice') })).text);
      expect(asked.viandante.id).toBe(ALICE);
      const seen = (await ask('/api/session')).text;
      for (const id of [MASTER, ALICE, BRUNO]) expect(seen).not.toContain(id);
    });

    it('V-001 chi fa un universo ne è il master, qualunque cosa dicano i file; un anonimo e nessuno no', async () => {
      const files = { 'universe.json': JSON.stringify({ name: 'fatto', partita: { modalita: 'multigiocatore', master: MASTER } }), [`world/giocatori/${ALICE}.json`]: '{"crediti":1000}' };
      expect((await post('/api/universe/fatto/create', undefined, { files })).status).toBe(403);
      expect((await post('/api/universe/fatto/create', 'anon-uid-alice', { files })).status).toBe(403);
      expect(existsSync(path.join(universes, 'fatto'))).toBe(false);
      expect((await post('/api/universe/fatto/create', 'vero-uid-alice', { files })).status).toBe(200);
      expect(JSON.parse(readFileSync(path.join(universes, 'fatto', 'universe.json'), 'utf8')).partita.master).toBe(ALICE);
      expect(existsSync(path.join(universes, 'fatto', 'world', 'giocatori', `${ALICE}.json`))).toBe(false);
    });
  });

  describe('l’origine', () => {
    it('V-001 un altro sito o un altro nome non arrivano a nessuna rotta, nemmeno col token giusto', async () => {
      const routes: Array<[string, string]> = [
        ['GET', '/api/universe'],
        ['GET', '/api/universe/prova'],
        ['POST', '/api/universe/prova/commit'],
        ['GET', '/api/viandante?universo=prova'],
        ['GET', '/api/crediti?universo=prova'],
        ['GET', '/api/session'],
        ['GET', '/api/account'],
        ['POST', '/api/stripe/checkout'],
        ['POST', '/api/stripe/webhook'],
      ];
      const before = head();
      for (const [method, target] of routes) {
        for (const headers of [{ Origin: 'https://altro.example' }, { Origin: 'null' }, { Origin: `${SITE}.altro.example` }, { Origin: 'http://gioco.example' }, { Host: 'altro.example' }, { Host: 'gioco.example.altro.example' }] as Array<Record<string, string>>) {
          const r = await ask(target, { method, headers: { ...json, ...bearer('vero-uid-master'), ...headers }, ...(method === 'POST' ? { body: JSON.stringify({ changes: { 'world/altro.md': 'x' }, message: 'x' }) } : {}) });
          expect(r.status, `${method} ${target} ${JSON.stringify(headers)}`).toBe(403);
          expect(r.headers['access-control-allow-origin'], target).toBeUndefined();
        }
      }
      expect(head()).toBe(before);
    });

    it('V-001 dal sito giusto si risponde; un corpo che un modulo di un altro sito può mandare no', async () => {
      expect((await ask('/api/universe', { headers: { Origin: SITE } })).status).toBe(200);
      const body = JSON.stringify({ changes: { 'world/testo.md': 'x' }, message: 'x' });
      for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data']) {
        const r = await ask('/api/universe/prova/commit', { method: 'POST', headers: { 'Content-Type': type, ...bearer('vero-uid-master'), Origin: SITE }, body });
        expect(r.status, type).toBe(415);
      }
      expect(existsSync(path.join(root, 'world', 'testo.md'))).toBe(false);
    });

    it('V-006 sul WebSocket un altro sito e un altro nome non aprono', async () => {
      const refused = (origin: string, host: string) =>
        new Promise<number | string>((resolve) => {
          const ws = new WebSocket(`ws://127.0.0.1:${port}/api/session?universo=prova`, { origin, headers: { Host: host } });
          ws.on('unexpected-response', (_q, res) => resolve(res.statusCode ?? 0));
          ws.on('open', () => resolve('aperto'));
          ws.on('error', (e) => resolve(e.message));
        });
      expect(await refused('https://altro.example', HOST)).toBe(403);
      expect(await refused('null', HOST)).toBe(403);
      expect(await refused(SITE, 'altro.example')).toBe(403);
    });
  });

  describe('i percorsi', () => {
    // As a program would say them: every form of the folder of git, and of the way out of a universe.
    const refused = ['.git/config', '.GIT/config', '.Git/hooks/pre-commit', '.git./config', '.git /config', 'GIT~1/config', '.git::$INDEX_ALLOCATION/config', 'world/../.git/config', '../fuori.md', '../../fuori.md', 'world/../../fuori.md', 'world\\..\\..\\fuori.md', '/fuori.md', 'C:/fuori.md', 'world/a:b.md', 'universe.json::$DATA', 'world/CON', 'world/nul.md', '.gitattributes', '.gitmodules', 'server/x.ts', 'node_modules/x.js', 'world/nota.md.', 'world/nota.md '];

    it('V-003 nemmeno il master scrive fuori dall’elenco, per nessuna via, e il repository resta com’è', async () => {
      const config = readFileSync(path.join(root, '.git', 'config'), 'utf8');
      const hooks = readdirSync(path.join(root, '.git', 'hooks')).length;
      const above = readdirSync(universes).sort();
      const before = head();
      for (const p of refused) {
        const c = await post('/api/universe/prova/commit', 'vero-uid-master', { changes: { [p]: 'x' }, message: 'x' });
        expect(c.status, `commit ${p}`).toBe(400);
        const b = await post('/api/universe/prova/branch', 'vero-uid-master', { branch: 'rami/master', files: { [p]: 'x' } });
        expect(b.status, `ramo ${p}`).toBe(400);
        // Each from an account of its own: what makes universes has a rhythm per account (ADR-0114).
        const n = await post('/api/universe/nuovo/create', `vero-uid-fa-${refused.indexOf(p)}`, { files: { 'universe.json': '{}', [p]: 'x' } });
        expect(n.status, `create ${p}`).toBe(400);
      }
      expect(readFileSync(path.join(root, '.git', 'config'), 'utf8')).toBe(config);
      expect(readdirSync(path.join(root, '.git', 'hooks')).length).toBe(hooks);
      expect(readdirSync(universes).sort()).toEqual(above);
      expect(existsSync(path.join(work, 'fuori.md'))).toBe(false);
      expect(head()).toBe(before);
    });

    it('V-003 il nome di un universo e di un luogo non escono dalla loro cartella', async () => {
      for (const name of ['..', '.git', '.saldi', '.cestino', '%2e%2e', '..%2f..', '%2e%2e%2f.saldi', 'prova%2f..', 'PROVA%00', 'con']) {
        const r = await ask(`/api/universe/${name}`, { headers: bearer('vero-uid-master') });
        expect(r.text, name).not.toContain('"exists":true');
        const w = await post(`/api/universe/${name}/commit`, 'vero-uid-master', { changes: { 'world/x.md': 'x' }, message: 'x' });
        expect(w.status, name).not.toBe(200);
      }
      for (const place of ['..%2f..%2ffuori', '..%5c..%5cfuori', '%2e%2e%2f.git%2fconfig']) {
        const r = await ask(`/api/universe/prova/map/${place}`, { method: 'PUT', headers: { ...json, ...bearer('vero-uid-master') }, body: '{}' });
        expect(r.status, place).toBe(400);
      }
      expect(existsSync(path.join(universes, 'fuori.json'))).toBe(false);
      expect(existsSync(path.join(work, 'fuori.json'))).toBe(false);
    });
  });

  describe('il webhook', () => {
    it('V-004 senza la firma giusta nulla, anche con un corpo perfetto', async () => {
      const raw = makeEvent('evt_falso', 'prova', ALICE, 5000);
      const t = Math.floor(Date.now() / 1000);
      const forged = [
        '',
        't=1,v1=00',
        `t=${t},v1=${'0'.repeat(64)}`,
        createFakeStripeSignature(raw, 'FINTO-un-altro-segreto'),
        createFakeStripeSignature(raw, secrets.STRIPE_WEBHOOK_SECRET, t - 3600),
        createFakeStripeSignature(`${raw} `, secrets.STRIPE_WEBHOOK_SECRET),
      ];
      for (const signature of forged) expect((await webhook(raw, signature)).status, signature).toBe(400);
      expect(await balance('vero-uid-alice')).toBe(0);
    });

    it('V-004 firmato, conta ciò che si è pagato, non ciò che dicono i metadati; e i nomi restano nomi', async () => {
      const paid = await webhook(makeEvent('evt_paga', 'prova', ALICE, 500));
      expect(paid.status).toBe(200);
      expect(JSON.parse(paid.text).crediti).toBe(5);
      expect(await balance('vero-uid-alice')).toBe(5);
      expect(await balance('vero-uid-bruno')).toBe(0);
      const beforeAbove = readdirSync(work).sort();
      for (const raw of [
        makeEvent('evt_n1', '../fuori', ALICE, 500),
        makeEvent('evt_n2', '..\\fuori', ALICE, 500),
        makeEvent('evt_n3', 'prova', '../../fuori', 500),
        makeEvent('evt_n4', 'prova', ALICE, -500),
        makeEvent('evt_n5', 'prova', ALICE, 500, { currency: 'eur' }),
      ]) {
        expect((await webhook(raw)).status, raw).toBe(400);
      }
      const unknown = await webhook(makeEvent('evt_n6', 'non-esiste', ALICE, 500));
      expect(unknown.status).toBe(500);
      expect(unknown.text).not.toContain('non-esiste');
      expect(readdirSync(work).sort()).toEqual(beforeAbove);
      expect(await balance('vero-uid-alice')).toBe(5);
    });

    it('V-005 un evento accredita una volta, anche consegnato otto volte insieme, e fuori dalla storia dell’universo', async () => {
      const before = head();
      const raw = makeEvent('evt_doppio', 'prova', ALICE, 300);
      const all = await Promise.all(Array.from({ length: 8 }, () => webhook(raw)));
      expect(all.map((r) => r.status)).toEqual(Array(8).fill(200));
      expect(all.filter((r) => JSON.parse(r.text).status === 'credited').length).toBe(1);
      expect(await balance('vero-uid-alice')).toBe(8);
      expect(head()).toBe(before);
      expect(git(root, ['status', '--porcelain']).trim()).toBe('');
      expect(JSON.parse(readFileSync(ledgerOf(universes, 'prova'), 'utf8'))).toBeTruthy();
      expect(existsSync(path.join(root, 'world', 'pagamenti.json'))).toBe(false);
      expect(readFileSync(path.join(root, `world/nota.md`), 'utf8')).toBe('del master');
    });

    it('V-005 il ritorno a un commit non riporta indietro il saldo', async () => {
      expect((await webhook(makeEvent('evt_altro', 'altro', ALICE, 100))).status).toBe(200);
      const back = await post('/api/universe/altro/checkout', 'vero-uid-master', { id: git(path.join(universes, 'altro'), ['rev-list', '--max-parents=0', 'HEAD']).trim() });
      expect(back.status).toBe(200);
      const wallet = JSON.parse((await ask('/api/crediti?universo=altro', { headers: bearer('vero-uid-alice') })).text).portafoglio;
      expect(wallet.crediti).toBe(1);
    });
  });

  describe('il checkout', () => {
    const buy = (token: string | undefined, o: Record<string, unknown> = {}) => post('/api/stripe/checkout', undefined, { universo: 'prova', wandererId: ALICE, crediti: 5, ...(token ? { token } : {}), returnUrl: `${SITE}/site/pagamenti.html`, ...o }, { Origin: SITE });

    it('V-006 solo per sé, con un account vero', async () => {
      expect((await buy(undefined)).status).toBe(401);
      expect((await buy('falso')).status).toBe(401);
      expect((await buy('anon-uid-alice')).status).toBe(403);
      expect((await buy('vero-uid-bruno')).status).toBe(403);
      expect(networkOf(network()).filter((n) => n.a === 'stripe')).toEqual([]);
    });

    it('V-015 torna solo a questo sito', async () => {
      for (const returnUrl of ['https://altro.example/', `https://${HOST}@altro.example/`, `https://x:y@${HOST}/`, 'javascript:alert(1)']) {
        expect((await buy('vero-uid-alice', { returnUrl })).status, returnUrl).toBe(400);
      }
      expect(networkOf(network()).filter((n) => n.a === 'stripe')).toEqual([]);
    });

    it('V-016 la chiave va a Stripe e basta: l’errore di Stripe che la ripete resta fuori dalla risposta e dal log', async () => {
      const ok = await buy('vero-uid-alice');
      expect([ok.status, JSON.parse(ok.text).ok]).toEqual([200, true]);
      const calls = networkOf(network()).filter((n) => n.a === 'stripe');
      expect(calls).toEqual([{ a: 'stripe', conChiave: true, ritorno: HOST }]);
      const bad = await buy('vero-uid-alice', { crediti: 7 });
      expect(bad.status).toBe(500);
      expect(bad.text).not.toContain('DETTAGLIO-INTERNO-FINTO');
      await until(() => server.out.text.includes('DETTAGLIO-INTERNO-FINTO'), 5000, 'il dettaglio nel log');
      expect(server.out.text).not.toContain(secrets.STRIPE_SECRET_KEY);
    });
  });

  describe('la chiave di Gemini', () => {
    it('V-002 nessuna porta verso Google, per nessuno', async () => {
      for (const headers of [{}, bearer('vero-uid-master'), { Host: `localhost:${port}` }, { Host: `127.0.0.1:${port}` }] as Array<Record<string, string>>) {
        for (const [method, target] of [['GET', '/api/gemini/status'], ['POST', '/api/gemini/models/gemini-3.1-flash-lite:generateContent'], ['POST', '/api/gemini/'], ['GET', '/api/gemini%2fstatus']] as const) {
          const r = await ask(target, { method, headers: { ...json, ...headers }, ...(method === 'POST' ? { body: '{"contents":[]}' } : {}) });
          expect(r.status, `${target} ${JSON.stringify(headers)}`).toBe(404);
        }
      }
      // A page of this machine, which the dev server's route would hear: here the front door stops it.
      expect((await ask('/api/gemini/status', { headers: { Host: `127.0.0.1:${port}`, Origin: `http://127.0.0.1:${port}` } })).status).toBe(403);
      expect(networkOf(network()).filter((n) => n.a === 'gemini')).toEqual([]);
    });

    it('V-009 nessuna coda delle CLI, per nessuno', async () => {
      for (const headers of [{}, bearer('vero-uid-master'), { Host: `localhost:${port}` }] as Array<Record<string, string>>) {
        for (const target of ['/api/coda', '/api/coda/prendi', '/api/coda/segreto']) {
          expect((await ask(target, { headers })).status, target).toBe(404);
          expect((await ask(target, { method: 'POST', headers: { ...json, ...headers }, body: '{}' })).status, target).toBe(404);
        }
      }
      expect(existsSync(path.join(universes, '.coda'))).toBe(false);
    });
  });

  describe('sul WebSocket, in una partita vera', () => {
    const player = (query = '?universo=prova') => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/api/session${query}`, { origin: SITE, headers: { Host: HOST } });
      const heard: ServerMsg[] = [];
      ws.on('message', (d) => {
        heardByClients.push(String(d));
        heard.push(JSON.parse(String(d)));
      });
      const opened = new Promise<void>((resolve, reject) => {
        ws.on('open', () => resolve());
        ws.on('error', reject);
      });
      return { ws, heard, opened, say: (m: unknown) => ws.send(JSON.stringify(m)), of: <T extends ServerMsg['t']>(t: T) => heard.filter((m) => m.t === t) as Array<Extract<ServerMsg, { t: T }>> };
    };

    it('V-006 chi entra è il suo token; il client non dice `offline`; ciò che chiede solo il master non passa; la chiave resta nel server', async () => {
      const stranger = player();
      await stranger.opened;
      stranger.say({ t: 'entra', id: MASTER, token: 'falso' });
      await until(() => stranger.of('rifiuto').length, 15000, 'il rifiuto di un token falso');
      stranger.ws.close();

      // Alice has credits (the webhooks above): what she asks goes to the model, even if her client says `offline`.
      const a = player('?universo=prova&offline');
      await a.opened;
      a.say({ t: 'entra', id: MASTER, token: 'vero-uid-alice', tetto: 1000 });
      await until(() => a.of('ingresso').length, 180000, 'l’ingresso di alice');
      const ingresso = a.of('ingresso')[0];
      expect(ingresso.id).toBe(ALICE);
      expect(ingresso.master).toBeFalsy();
      expect(Object.keys(ingresso.files).filter((p) => p.startsWith('prompts/') || p === 'world/bible.json' || p.endsWith('consumi.json'))).toEqual([]);
      expect(JSON.parse(ingresso.files['universe.json']).ai).toBeUndefined();

      const b = player();
      await b.opened;
      b.say({ t: 'entra', id: BRUNO, token: 'vero-uid-bruno' });
      await until(() => b.of('ingresso').length, 30000, 'l’ingresso di bruno');
      await until(() => a.of('aggiorna').some((m) => m.viandanti?.some((v) => v.id === BRUNO)), 20000, 'alice vede bruno');

      // What only the master says, said by a player.
      a.say({ t: 'ramo', seq: 1, files: { 'modules/x/logic.lua': 'x' }, base: {} });
      a.say({ t: 'pubblica', seq: 2 });
      a.say({ t: 'ricarica', seq: 3, viandante: ALICE, quanti: 1000 });
      a.say({ t: 'segui', seq: 4, id: BRUNO });
      const answers = () => a.of('esito').filter((m) => [1, 2, 3, 4].includes(m.seq));
      await until(() => answers().length >= 4, 15000, 'le risposte al non master');
      for (const m of answers()) expect(m.ok, JSON.stringify(m)).toBe(false);
      expect(() => git(root, ['rev-parse', '--verify', '-q', 'refs/heads/rami/master'])).toThrow();
      expect(existsSync(path.join(root, 'modules', 'x'))).toBe(false);

      // The world is on: the same ledger, once.
      const raw = makeEvent('evt_acceso', 'prova', ALICE, 200);
      const creditedNow = await Promise.all([webhook(raw), webhook(raw), webhook(raw)]);
      expect(creditedNow.map((r) => r.status)).toEqual([200, 200, 200]);
      expect(creditedNow.filter((r) => JSON.parse(r.text).status === 'credited').length).toBe(1);
      expect(await balance('vero-uid-alice')).toBeLessThanOrEqual(10);
      expect(await balance('vero-uid-alice')).toBeGreaterThan(8);
      expect(await balance('vero-uid-bruno')).toBe(0);

      // The world asks Google through its channel: the key is added here, in the header, and goes nowhere else.
      await until(() => networkOf(network()).some((n) => n.a === 'gemini'), 120000, 'una chiamata del mondo a Google');
      for (const call of networkOf(network()).filter((n) => n.a === 'gemini')) expect(call).toEqual({ a: 'gemini', conChiave: true, chiaveNellUrl: false, chiaveNelCorpo: false });

      expect(JSON.parse((await ask('/api/session')).text).sessions).toContainEqual(expect.objectContaining({ name: 'prova', active: true }));
      a.ws.close();
      b.ws.close();
    }, 480000);
  });

  it('V-016 nessun valore finto in ciò che è uscito: risposte, socket, log, ciò che resta su disco, e nulla è uscito dalla macchina', async () => {
    // Worlds still on write their last words here: stop first.
    server.child.stdin?.end();
    await Promise.race([server.ended, new Promise((r) => setTimeout(r, 30000))]);
    const values = Object.values(secrets);
    // That the search looks at something: a key that is not here would pass anyway.
    expect(heardByClients.length).toBeGreaterThan(100);
    expect(server.out.text).toContain('[stripe]');
    for (const [name, v] of Object.entries(secrets)) {
      expect(heardByClients.some((t) => t.includes(v)), `${name} a un client`).toBe(false);
      expect(server.out.text.includes(v), `${name} nel log`).toBe(false);
      expect(readFileSync(network(), 'utf8').includes(v), `${name} nelle uscite`).toBe(false);
    }
    const found: string[] = [];
    const onDisk = walk(universes, (rel) => rel.split(path.sep).includes('.git'));
    expect(onDisk.length).toBeGreaterThan(50);
    for (const file of onDisk) {
      const bytes = readFileSync(file);
      if (values.some((v) => bytes.includes(v))) found.push(path.relative(universes, file));
    }
    expect(found).toEqual([]);
    const history = git(root, ['log', '--all', '-p', '--format=%H %s']);
    for (const v of values) expect(history.includes(v)).toBe(false);
    // The spending is counted, and it is only a number.
    expect(Object.keys(JSON.parse(readFileSync(path.join(universes, '.spesa-gemini.json'), 'utf8'))).sort()).toEqual(['giorno', 'spesi']);
    expect(networkOf(network()).filter((n) => n.bloccato)).toEqual([]);
  }, 60000);
});

describe('il file che `npm run serve` avvia, con il verificatore vero', () => {
  let port: number;
  let server: ReturnType<typeof startServer>;
  let universes: string;
  const network = () => path.join(work, 'rete-file.jsonl');
  const ask = (target: string, o: { method?: string; headers?: Record<string, string>; body?: string } = {}) => askAt(port, target, o);
  const jwt = (head: object, claims: object, signature = 'firma') => [head, claims].map((p) => Buffer.from(JSON.stringify(p)).toString('base64url')).join('.') + `.${Buffer.from(signature).toString('base64url')}`;
  const claims = () => {
    const t = Math.floor(Date.now() / 1000);
    return { iss: 'https://securetoken.google.com/prova', aud: 'prova', sub: 'uid-master', user_id: 'uid-master', iat: t - 10, exp: t + 3000, auth_time: t - 10, firebase: { sign_in_provider: 'google.com', identities: {} } };
  };

  beforeAll(async () => {
    universes = path.join(work, 'universes-file');
    mkdirSync(universes, { recursive: true });
    makeUniverse(universes, 'prova', MASTER);
    server = startServer([serverFile], { QUINE_UNIVERSI: 'universes-file', QUINE_PORTA: '0', QUINE_CODA: '1' }, network());
    port = await server.ready();
  }, 180000);

  afterAll(async () => {
    server?.child.kill();
    await server?.ended;
  }, 60000);

  it('V-014 ascolta solo su questa macchina se nessuno dice altro', () => {
    expect(server.out.text).toContain('in ascolto su 127.0.0.1:');
  });

  it('V-006 firebase-admin vero rifiuta un token senza firma, con una firma inventata, di un altro progetto', async () => {
    const tokens = [
      'falso',
      jwt({ alg: 'none', typ: 'JWT' }, claims()),
      jwt({ alg: 'HS256', typ: 'JWT', kid: 'x' }, claims()),
      jwt({ alg: 'RS256', typ: 'JWT', kid: 'inventata' }, claims()),
      jwt({ alg: 'RS256', typ: 'JWT', kid: 'inventata' }, { ...claims(), aud: 'altro', iss: 'https://securetoken.google.com/altro' }),
    ];
    for (const token of tokens) {
      expect((await ask('/api/viandante?universo=prova', { headers: bearer(token) })).status, token).toBe(401);
      expect((await ask('/api/universe/prova/commit', { method: 'POST', headers: { ...json, ...bearer(token) }, body: JSON.stringify({ changes: { 'world/x.md': 'x' }, message: 'x' }) })).status, token).toBe(401);
    }
    // A forged signature gets as far as the certificates, which here cannot be fetched: so the real verifier has run, and the door stays closed.
    expect(networkOf(network()).some((n) => /googleapis\.com$/.test(String(n.bloccato)))).toBe(true);
    expect(existsSync(path.join(universes, 'prova', 'world', 'x.md'))).toBe(false);
    expect(server.child.exitCode).toBeNull();
  }, 120000);

  it('V-025 un socket con un token che non vale non avvia un mondo', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/api/session?universo=prova`, { origin: SITE, headers: { Host: HOST } });
    const heard: ServerMsg[] = [];
    ws.on('message', (d) => {
      heardByClients.push(String(d));
      heard.push(JSON.parse(String(d)));
    });
    await new Promise((r) => ws.on('open', r));
    ws.send(JSON.stringify({ t: 'entra', id: MASTER, token: jwt({ alg: 'none', typ: 'JWT' }, claims()) }));
    await until(() => heard.some((m) => m.t === 'rifiuto'), 30000, 'il rifiuto');
    ws.close();
    expect(JSON.parse((await ask('/api/session')).text).sessions).toEqual([]);
  }, 60000);

  it('V-004 il webhook accredita con la sua firma e basta', async () => {
    const raw = makeEvent('evt_file', 'prova', ALICE, 700);
    const hook = (signature: string) => ask('/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': signature, ...json }, body: raw });
    expect((await hook(createFakeStripeSignature(raw, 'FINTO-un-altro-segreto'))).status).toBe(400);
    expect(existsSync(ledgerOf(universes, 'prova'))).toBe(false);
    const paid = await hook(createFakeStripeSignature(raw, secrets.STRIPE_WEBHOOK_SECRET));
    expect([paid.status, JSON.parse(paid.text).status, JSON.parse(paid.text).crediti]).toEqual([200, 'credited', 7]);
    expect(JSON.parse((await hook(createFakeStripeSignature(raw, secrets.STRIPE_WEBHOOK_SECRET))).text).status).toBe('duplicate');
    expect(JSON.stringify(JSON.parse(readFileSync(ledgerOf(universes, 'prova'), 'utf8')))).toContain(ALICE);
  });

  it('V-009 niente Gemini né coda, anche con QUINE_CODA=1', async () => {
    for (const target of ['/api/gemini/status', '/api/coda', '/api/coda/prendi']) {
      expect((await ask(target, { headers: { Host: `localhost:${port}` } })).status, target).toBe(404);
    }
    expect(existsSync(path.join(universes, '.coda'))).toBe(false);
  });

  it('V-014 la configurazione non si legge: né dal disco né dalla rotta', async () => {
    for (const target of ['/.env', '/%2eenv', '/dist-server/server.mjs', '/dist-server/mondo/mondo.mjs', '/universes-file/prova/universe.json']) {
      expect((await ask(target)).status, target).toBe(404);
    }
    expect(JSON.parse((await ask('/api/account')).text)).toEqual({ projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' });
    const config = JSON.parse((await ask('/api/stripe/config')).text);
    expect(config.available).toBe(true);
    expect(config.publishableKey).toBeUndefined();
  });

  it('V-016 nessun valore finto: nelle risposte, nel log, nelle build; verso fuori solo la richiesta dei certificati, fermata', () => {
    const values = Object.values(secrets);
    for (const [name, v] of Object.entries(secrets)) {
      expect(heardByClients.some((t) => t.includes(v)), `${name} a un client`).toBe(false);
      expect(server.out.text.includes(v), `${name} nel log`).toBe(false);
    }
    expect(networkOf(network()).filter((n) => n.a)).toEqual([]);
    for (const n of networkOf(network())) expect(String(n.bloccato)).toMatch(/(^|\.)googleapis\.com$|(^|\.)google\.com$/);
    const built = [...walk(path.join(work, 'dist')), ...walk(path.join(work, 'dist-server')), ...walk(path.join(work, 'lanciatore'))];
    expect(built.length).toBeGreaterThan(5);
    expect(built.filter((f) => statSync(f).size > 0).length).toBe(built.length);
    const found = built.filter((f) => {
      const bytes = readFileSync(f);
      return values.some((v) => bytes.includes(v));
    });
    expect(found).toEqual([]);
  });
});
