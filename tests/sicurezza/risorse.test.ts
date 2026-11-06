// V-026 (T172, ADR-0114): what an account, or an address, can make this machine carry. A world starts only for who proves who they are and stops when left
// empty; universes have a quota; what leaves a file has a rhythm; sockets and routes have one per address, and that address is not what a client says.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import type { AccountSettings } from '../../server/account';
import { worldToken } from '../../server/access';
import { createProductionServer, productionProblems, type ProductionServer } from '../../server/production';
import { addressKey, clientAddress, proxyHops, Rates } from '../../server/rates';
import { ACCOUNT_SOCKETS, activeHosts, attachSessions, wsLink } from '../../server/session';
import { DEFAULT_UNIVERSES_PER_ACCOUNT, universeHandler, universesOf, universesPerAccount, UNIVERSES_MADE } from '../../server/universeStore';
import { PROFILE_SAVES, wandererHandler } from '../../server/wanderer';
import { WorldHost, type HostLink } from '../../server/worldHost';
import { INTERNAL_HEADER } from '../../src/kernel/universes';
import { accountWanderer } from '../../src/session/account';
import { bundledFiles } from '../../src/kernel/bundle';
import type { ServerMsg } from '../../src/session/protocol';

const FAKE = path.resolve('tests/sicurezza/fixtures/mondo-finto.mjs');
const SITE = 'https://gioco.example';

const until = async (what: () => unknown, ms = 15000, label = 'attesa') => {
  const end = Date.now() + ms;
  for (;;) {
    if (what()) return;
    if (Date.now() > end) throw new Error(`scaduta: ${label}`);
    await new Promise((r) => setTimeout(r, 20));
  }
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A token says its account: `vero-<uid>`, `anon-<uid>`.
const accounts: AccountSettings = {
  config: { projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' },
  verify: async (t) => (t.startsWith('vero-') ? { uid: t.slice(5), anonimo: false } : t.startsWith('anon-') ? { uid: t.slice(5), anonimo: true } : undefined),
};

function socketOf(url: string, headers: Record<string, string> = {}, origin?: string) {
  const ws = new WebSocket(url, { headers, ...(origin ? { origin } : {}) });
  const heard: ServerMsg[] = [];
  const state = { closed: false, status: 0 };
  ws.on('message', (d) => heard.push(JSON.parse(String(d))));
  ws.on('close', () => (state.closed = true));
  ws.on('unexpected-response', (_q, res) => {
    state.status = res.statusCode ?? 0;
    state.closed = true;
  });
  ws.on('error', () => (state.closed = true));
  const opened = new Promise<void>((r) => {
    ws.on('open', () => r());
    ws.on('close', () => r());
    ws.on('error', () => r());
    ws.on('unexpected-response', () => r());
  });
  return { ws, heard, state, opened, say: (m: unknown) => ws.send(JSON.stringify(m)), refusal: () => heard.find((m) => m.t === 'rifiuto') as { motivo: string } | undefined };
}

describe('V-026 il ritmo e l’indirizzo', () => {
  it('V-026 un secchio si svuota e torna col tempo, per chiave', () => {
    let t = 0;
    const r = new Rates({ burst: 2, perSecond: 1 }, () => t);
    expect([r.take('a'), r.take('a'), r.take('a'), r.take('b')]).toEqual([true, true, false, true]);
    t = 1000;
    expect([r.take('a'), r.take('a')]).toEqual([true, false]);
    t = 100000;
    expect([r.take('a'), r.take('a'), r.take('a')]).toEqual([true, true, false]);
  });

  it('V-026 un indirizzo è una chiave sola in ogni sua forma; un IPv6 conta per i suoi primi 64 bit', () => {
    expect(addressKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(addressKey('203.0.113.7')).toBe('203.0.113.7');
    expect(addressKey('2001:db8:1:2:aaaa::1')).toBe(addressKey('2001:db8:1:2:bbbb::9'));
    expect(addressKey('2001:db8:1:2::1')).toBe(addressKey('2001:0db8:0001:0002:ffff:ffff:ffff:ffff'));
    expect(addressKey('2001:db8:1:3::1')).not.toBe(addressKey('2001:db8:1:2::1'));
    expect(addressKey('::1')).toBe('0:0:0:0');
    expect(addressKey('niente')).toBe('ignoto');
  });

  const req = (remoteAddress: string, forwarded?: string) => ({ socket: { remoteAddress }, headers: forwarded ? { 'x-forwarded-for': forwarded } : {} });

  it('V-026 senza proxy nostri conta il socket: ciò che il client scrive non cambia chi è', () => {
    expect(clientAddress(req('198.51.100.1', '203.0.113.7'), 0)).toBe('198.51.100.1');
    expect(proxyHops(undefined)).toBe(0);
    expect(proxyHops(' 2 ')).toBe(2);
    expect(proxyHops('sì')).toBeUndefined();
  });

  it('V-026 con un proxy conta ciò che lui ha visto, a destra; ciò che il client scrive resta a sinistra', () => {
    expect(clientAddress(req('10.0.0.1', '6.6.6.6, 203.0.113.7'), 1)).toBe('203.0.113.7');
    expect(clientAddress(req('10.0.0.1', '6.6.6.6, 7.7.7.7, 203.0.113.7, 10.0.0.2'), 2)).toBe('203.0.113.7');
    // It did not come through them, or what is there is no address: the socket.
    expect(clientAddress(req('10.0.0.1'), 1)).toBe('10.0.0.1');
    expect(clientAddress(req('10.0.0.1', '203.0.113.7'), 2)).toBe('10.0.0.1');
    expect(clientAddress(req('10.0.0.1', 'non-un-indirizzo'), 1)).toBe('10.0.0.1');
  });

  it('V-026 il server di produzione non parte con un numero di proxy che non è un numero', () => {
    const env = { FIREBASE_PROJECT_ID: 'p', FIREBASE_API_KEY: 'k', STRIPE_WEBHOOK_SECRET: 's', QUINE_ORIGINI: SITE };
    expect(productionProblems(env)).toEqual([]);
    expect(productionProblems({ ...env, QUINE_PROXY_FIDATI: '1' })).toEqual([]);
    expect(productionProblems({ ...env, QUINE_PROXY_FIDATI: 'tutti' }).join()).toContain('QUINE_PROXY_FIDATI');
  });
});

describe('V-026 un mondo parte per chi dice chi è e si ferma quando resta vuoto', () => {
  let server: http.Server;
  let sessions: { stop(): Promise<void> };
  let port: number;

  const start = async (o: { idle?: number; entryMs?: number; program?: string; verify?: boolean } = {}) => {
    server = http.createServer();
    sessions = attachSessions(server, {
      accounts: o.verify === false ? undefined : accounts,
      internal: 'finto',
      program: async () => o.program ?? FAKE,
      entryMs: o.entryMs ?? 400,
      times: { notice: 300, kill: 1500, boot: 20000, healthy: 100000, call: 3000, deaths: 4, idle: o.idle ?? 100000 },
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    port = (server.address() as AddressInfo).port;
  };
  const open = (name: string) => socketOf(`ws://127.0.0.1:${port}/api/session?universo=${name}`);

  afterEach(async () => {
    await sessions?.stop();
    await new Promise((r) => server.close(r));
    for (const k of activeHosts.keys()) activeHosts.delete(k);
  });

  it('V-026 un socket che non dice chi è non avvia nulla, e dopo poco viene chiuso', async () => {
    await start();
    const c = open('tace');
    await c.opened;
    await wait(100);
    expect(activeHosts.has('tace')).toBe(false);
    await until(() => c.state.closed, 3000, 'chiuso');
    expect(c.refusal()?.motivo).toMatch(/nessun ingresso/);
    expect(activeHosts.has('tace')).toBe(false);
  });

  it('V-026 chi parla senza dire chi è non avvia nulla e viene chiuso presto', async () => {
    await start({ entryMs: 60000 });
    const c = open('parla');
    await c.opened;
    for (let i = 0; i < 20; i++) c.say({ t: 'passo', seq: i, x: 1, y: 1 });
    await until(() => c.state.closed, 3000, 'chiuso');
    expect(activeHosts.has('parla')).toBe(false);
  });

  it.each([
    ['un token falso', { t: 'entra', id: 'x', token: 'falso' }, /non valido/],
    ['nessun token', { t: 'entra', id: 'x' }, /serve un account/],
    ['un token che non è un testo', { t: 'entra', id: 'x', token: { a: 1 } }, /serve un account/],
  ])('V-026 %s non avvia il mondo', async (_n, entra, motivo) => {
    await start();
    const c = open('falso');
    await c.opened;
    c.say(entra);
    await until(() => c.state.closed, 3000, 'rifiuto');
    expect(c.refusal()?.motivo).toMatch(motivo);
    expect(activeHosts.has('falso')).toBe(false);
  });

  it('V-026 un token vero lo avvia, e un mondo rimasto vuoto si ferma; il prossimo che entra ne avvia un altro', async () => {
    await start({ idle: 300 });
    const a = open('vuoto');
    await a.opened;
    a.say({ t: 'entra', id: 'x', token: 'vero-alice' });
    await until(() => activeHosts.has('vuoto'), 5000, 'avviato');
    const first = await activeHosts.get('vuoto');
    await until(() => first && 'session' in first && first.session.clientCount === 1, 5000, 'collegato');
    // Someone there: however long it takes, it stays.
    await wait(800);
    expect(activeHosts.get('vuoto')).toBeDefined();
    a.ws.close();
    await until(() => !activeHosts.has('vuoto'), 5000, 'fermato');

    const b = open('vuoto');
    await b.opened;
    b.say({ t: 'entra', id: 'x', token: 'vero-bruno' });
    await until(() => activeHosts.has('vuoto'), 5000, 'di nuovo');
    expect(await activeHosts.get('vuoto')).not.toBe(first);
    b.ws.close();
  });

  it('V-026 ogni account ha pochi socket: uno solo non tiene un posto in ogni mondo', async () => {
    await start();
    const held: Array<ReturnType<typeof open>> = [];
    for (let i = 0; i < ACCOUNT_SOCKETS; i++) {
      const c = open(`posto${i}`);
      await c.opened;
      c.say({ t: 'entra', id: 'x', token: 'vero-carla' });
      held.push(c);
    }
    await until(() => activeHosts.size === ACCOUNT_SOCKETS, 5000, 'i suoi mondi');
    const over = open('posto-oltre');
    await over.opened;
    over.say({ t: 'entra', id: 'x', token: 'vero-carla' });
    await until(() => over.state.closed, 3000, 'rifiuto');
    expect(over.refusal()?.motivo).toMatch(/troppe finestre/);
    expect(activeHosts.has('posto-oltre')).toBe(false);
    // One closed: the place is free again.
    held[0].ws.close();
    await until(() => held[0].state.closed, 3000, 'chiuso');
    await wait(50);
    const again = open('posto0');
    await again.opened;
    again.say({ t: 'entra', id: 'x', token: 'vero-carla' });
    await wait(200);
    expect(again.state.closed).toBe(false);
    for (const c of [...held, again]) c.ws.close();
  });

  it('V-026 un account non avvia mondi all’infinito', async () => {
    await start({ idle: 50 });
    const refused: string[] = [];
    for (let i = 0; i < 12 && !refused.length; i++) {
      const c = open(`giro${i}`);
      await c.opened;
      c.say({ t: 'entra', id: 'x', token: 'vero-dario' });
      await until(() => activeHosts.has(`giro${i}`) || c.state.closed, 5000, 'una risposta');
      if (c.refusal()) refused.push(c.refusal()!.motivo);
      c.ws.close();
      await until(() => c.state.closed, 3000, 'chiuso');
    }
    expect(refused.join()).toMatch(/troppi mondi avviati/);
  });

  it('V-026 senza account il server ascolta solo questa macchina: un «entra» basta, com’era', async () => {
    await start({ verify: false });
    const c = open('locale');
    await c.opened;
    c.say({ t: 'entra', id: 'x' });
    await until(() => activeHosts.has('locale'), 5000, 'avviato');
    c.ws.close();
  });

  it('V-026 il link tiene da «entra» in poi: ciò che viene prima non ruba il posto all’ingresso', () => {
    const on: Record<string, (d?: unknown) => void> = {};
    const ws = { on: (e: string, f: (d?: unknown) => void) => void (on[e] = f), send() {}, close() {}, readyState: 1, OPEN: 1 };
    const link = wsLink(ws as never);
    for (let i = 0; i < 10; i++) on.message(JSON.stringify({ t: 'passo', seq: i }));
    on.message(JSON.stringify({ t: 'entra', id: 'x' }));
    on.message(JSON.stringify({ t: 'passo', seq: 99 }));
    const got: Array<{ t: string }> = [];
    link.onMessage((m) => void got.push(m as { t: string }));
    expect(got.map((m) => m.t)).toEqual(['entra', 'passo']);
  });

  it('V-026 chi arriva mentre il mondo vuoto si salva aspetta, e trova un mondo nuovo', async () => {
    // Stopping takes it 400 ms: two processes of one universe would write the same files.
    await start({ idle: 100, program: path.resolve('tests/sicurezza/fixtures/mondo-finto-lento.mjs') });
    const a = open('salva');
    await a.opened;
    a.say({ t: 'entra', id: 'x', token: 'vero-elisa' });
    await until(() => activeHosts.has('salva'), 5000, 'avviato');
    const old = await activeHosts.get('salva');
    await until(() => old && 'session' in old && old.session.clientCount === 1, 5000, 'collegato');
    a.ws.close();
    await until(() => !activeHosts.has('salva'), 5000, 'in fermata');
    const b = open('salva');
    await b.opened;
    b.say({ t: 'entra', id: 'x', token: 'vero-elisa' });
    await wait(150);
    expect(activeHosts.has('salva')).toBe(false);
    expect(b.state.closed).toBe(false);
    await until(() => activeHosts.has('salva'), 5000, 'di nuovo');
    const h = await activeHosts.get('salva');
    await until(() => h && 'session' in h && h.session.clientCount === 1, 5000, 'collegato al nuovo');
    b.ws.close();
  });
});

describe('V-026 il sorvegliante e i vuoti', () => {
  const FAST = { notice: 300, kill: 1500, boot: 20000, healthy: 100000, call: 3000, deaths: 4 };
  const client = () => {
    const heard: ServerMsg[] = [];
    const fns: Array<(m: unknown) => void> = [];
    const closes: Array<() => void> = [];
    const link: HostLink = { send: (m) => void heard.push(m), onMessage: (f) => void fns.push(f), onClose: (f) => void closes.push(f), close() {} };
    return { link, heard, say: (m: unknown) => fns.forEach((f) => f(m)), leave: () => closes.forEach((f) => f()) };
  };

  it('V-026 chi resta collegato mentre il mondo riparte rientra, e il mondo non è vuoto', async () => {
    let idle = 0;
    const h = new WorldHost({ name: 'resta', base: 'http://localhost:1', internal: 'finto', entry: FAKE, entryArgs: ['pronto'], reads: [], times: { ...FAST, idle: 200 }, onIdle: () => idle++ });
    await h.start();
    const c = client();
    h.connect(c.link);
    c.say({ t: 'entra', id: 'alice' });
    (h as unknown as { child: { send(m: unknown): void } }).child.send({ t: 'sonda-muori' });
    await until(() => c.heard.some((m) => m.t === 'mondo' && m.stato === 'ripartito'), 10000, 'ripartito');
    await wait(500);
    expect(idle).toBe(0);
    // Who is told «ripartito» says who they are again, and that reaches the new world.
    c.say({ t: 'entra', id: 'alice' });
    expect(h.clientCount).toBe(1);
    c.leave();
    await until(() => idle > 0, 5000, 'vuoto');
    await h.stop();
  });

  it('V-026 un mondo salva quando si ferma: gli viene chiesto, non viene ucciso', async () => {
    const h = new WorldHost({ name: 'salva', base: 'http://localhost:1', internal: 'finto', entry: FAKE, entryArgs: ['lento'], reads: [], times: { ...FAST, idle: 100 } });
    await h.start();
    const child = (h as unknown as { child: { exitCode: number | null; signalCode: string | null } }).child;
    const t0 = Date.now();
    await h.stop();
    expect(Date.now() - t0).toBeGreaterThanOrEqual(300);
    expect([child.exitCode, child.signalCode]).toEqual([0, null]);
  });
});

describe('V-026 sul disco', () => {
  let dir: string;
  let store: http.Server;
  let base: string;
  const author = accountWanderer('uid-autore');

  const universe = (name: string, partita?: { modalita: string; master: string }, players: string[] = []) => {
    const root = path.join(dir, name);
    mkdirSync(path.join(root, 'world', 'giocatori'), { recursive: true });
    mkdirSync(path.join(root, 'models'), { recursive: true });
    for (const f of ['models/index.json', 'models/viandante.xml']) writeFileSync(path.join(root, f), bundledFiles[f]);
    writeFileSync(path.join(root, 'universe.json'), JSON.stringify({ name, ...(partita ? { partita } : {}) }));
    for (const p of players) writeFileSync(path.join(root, 'world', 'giocatori', `${p}.json`), JSON.stringify({ nome: 'Noto' }));
    const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: root, stdio: 'ignore', windowsHide: true });
    git('init', '-q');
    git('add', '-A');
    git('commit', '-q', '-m', 'nasce');
  };

  const call = (p: string, token: string | undefined, body?: unknown, to = base) =>
    fetch(`${to}${p}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(async (r) => ({ status: r.status, body: (await r.json().catch(() => ({}))) as Record<string, unknown> }));

  const many = { 'universe.json': JSON.stringify({ partita: { modalita: 'multiplayer' } }) };

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-risorse-'));
    const handler = universeHandler(dir, { accounts: { ...accounts, masterUid: 'uid-autore' }, internal: 'finto', quota: 2 });
    const route = wandererHandler({ accounts, universesDir: dir });
    store = http.createServer((req, res) => void (req.url?.startsWith('/api/viandante') ? route : handler)(req, res, () => void res.writeHead(404).end()));
    await new Promise<void>((r) => store.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(store.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((r) => store.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('V-026 un anonimo non fa universi, nemmeno da questa macchina o in singola', async () => {
    for (const files of [many, { 'universe.json': '{}' }]) {
      const r = await call('/api/universe/di-anonimo/create', 'anon-qualcuno', { files, message: 'x' });
      expect(r.status).toBe(403);
    }
    expect(existsSync(path.join(dir, 'di-anonimo'))).toBe(false);
  });

  it('V-026 un account fa al più la sua quota di universi, anche chiedendoli insieme', async () => {
    const token = 'vero-uid-quota';
    const asked = await Promise.all(['q1', 'q2', 'q3', 'q4'].map((n) => call(`/api/universe/${n}/create`, token, { files: many, message: 'x' })));
    expect(asked.map((r) => r.status).sort()).toEqual([200, 200, 403, 403]);
    expect(await universesOf(dir, accountWanderer('uid-quota'))).toBe(2);
    const over = asked.find((r) => r.status === 403);
    expect(over?.body.error).toMatch(/al più 2/);
    // Others are not counted with them.
    expect((await call('/api/universe/altrui/create', 'vero-uid-altri', { files: many, message: 'x' })).status).toBe(200);
  });

  it('V-026 un clone conta per chi lo riceve', async () => {
    const token = 'vero-uid-clona';
    const heir = accountWanderer('uid-erede');
    expect((await call('/api/universe/da-clonare/create', token, { files: many, message: 'x' })).status).toBe(200);
    expect((await call('/api/universe/di-erede/create', 'vero-uid-erede', { files: many, message: 'x' })).status).toBe(200);
    expect((await call('/api/universe/da-clonare/clone', token, { nome: 'clone-1', master: heir })).status).toBe(200);
    expect(await universesOf(dir, heir)).toBe(2);
    const over = await call('/api/universe/da-clonare/clone', token, { nome: 'clone-2', master: heir });
    expect(over.status).toBe(403);
    expect(existsSync(path.join(dir, 'clone-2'))).toBe(false);
  });

  it('V-026 l’autore (QUINE_MASTER) non ha quota', async () => {
    for (const n of ['a1', 'a2', 'a3']) expect((await call(`/api/universe/${n}/create`, 'vero-uid-autore', { files: many, message: 'x' })).status).toBe(200);
    expect(await universesOf(dir, author)).toBe(3);
  });

  it('V-026 fare e buttare non riempie il disco: anche il cestino ha un ritmo', async () => {
    expect(UNIVERSES_MADE.burst).toBeLessThanOrEqual(12);
    const token = 'vero-uid-cestino';
    const codes: number[] = [];
    for (let i = 0; i < UNIVERSES_MADE.burst + 2; i++) {
      const r = await call('/api/universe/giro/create', token, { files: many, message: 'x' });
      codes.push(r.status);
      if (r.status === 200) await call('/api/universe/giro/reset', token, {});
    }
    expect(codes.at(-1)).toBe(429);
    expect(codes.filter((c) => c === 200)).toHaveLength(UNIVERSES_MADE.burst);
    expect(readdirSync(path.join(dir, '.cestino')).filter((f) => f.startsWith('giro-')).length).toBeLessThanOrEqual(UNIVERSES_MADE.burst);
  }, 60000);

  it('V-026 la quota si legge dal .env', () => {
    expect(universesPerAccount(undefined)).toBe(DEFAULT_UNIVERSES_PER_ACCOUNT);
    expect(universesPerAccount(' 7 ')).toBe(7);
    expect(universesPerAccount('0')).toBe(0);
    expect(universesPerAccount('molti')).toBe(DEFAULT_UNIVERSES_PER_ACCOUNT);
  });

  const commits = (name: string) => execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: path.join(dir, name), encoding: 'utf8', windowsHide: true }).trim();

  it('V-026 un anonimo non scrive un profilo in un universo che non lo conosce', async () => {
    universe('reame', { modalita: 'multiplayer', master: 'io' });
    const before = commits('reame');
    const r = await call('/api/viandante', 'anon-sconosciuto', { universo: 'reame', profilo: { nome: 'Ospite' } });
    expect(r.status).toBe(403);
    expect(commits('reame')).toBe(before);
    expect(existsSync(path.join(dir, 'reame', 'world', 'giocatori', `${accountWanderer('sconosciuto')}.json`))).toBe(false);
  });

  it('V-026 un anonimo che l’universo conosce sì; un account anche se nuovo, col suo ritmo', async () => {
    const known = accountWanderer('conosciuto');
    universe('reame2', { modalita: 'multiplayer', master: 'io' }, [known]);
    expect((await call('/api/viandante', 'anon-conosciuto', { universo: 'reame2', profilo: { nome: 'Ospite' } })).status).toBe(200);
    const statuses: number[] = [];
    for (let i = 0; i < PROFILE_SAVES.burst + 2; i++) statuses.push((await call('/api/viandante', 'vero-uid-profili', { universo: 'reame2', profilo: { nome: `Nome${'abcdefghij'[i]}` } })).status);
    expect(statuses.slice(0, PROFILE_SAVES.burst).every((s) => s === 200)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  }, 60000);

  it('V-026 nessun profilo in una partita in singola, che su questo server non è di nessuno', async () => {
    universe('sola');
    const r = await call('/api/viandante', 'vero-uid-singola', { universo: 'sola', profilo: { nome: 'Ospite' } });
    expect(r.status).toBe(403);
  });
});

describe('V-026 il server di produzione', () => {
  let work: string;
  let running: ProductionServer | undefined;
  let port: number;
  const ENV = { FIREBASE_PROJECT_ID: 'prova', FIREBASE_API_KEY: 'finta', STRIPE_WEBHOOK_SECRET: 'finto', QUINE_ORIGINI: SITE };

  const start = async (rates: Parameters<typeof createProductionServer>[0]['rates'], env: Record<string, string> = {}) => {
    running = createProductionServer({ env: { ...ENV, ...env }, dist: path.join(work, 'dist'), worldProgram: FAKE, universesDir: path.join(work, 'universes'), accounts, rates, sessions: { entryMs: 500 } });
    await new Promise<void>((r) => running!.server.listen(0, '127.0.0.1', r));
    port = (running.server.address() as AddressInfo).port;
  };

  const ask = (target: string, headers: Record<string, string> = {}) =>
    new Promise<{ status: number; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const r = http.request({ host: '127.0.0.1', port, path: target, headers: { Host: 'gioco.example', ...headers } }, (res) => {
        res.resume();
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers }));
      });
      r.on('error', reject);
      r.end();
    });

  const socket = () => socketOf(`ws://127.0.0.1:${port}/api/session?universo=manca`, { Host: 'gioco.example' }, SITE);

  beforeAll(() => {
    work = mkdtempSync(path.join(os.tmpdir(), 'quine-risorse-prod-'));
    mkdirSync(path.join(work, 'dist'), { recursive: true });
    mkdirSync(path.join(work, 'universes'), { recursive: true });
    writeFileSync(path.join(work, 'dist', 'index.html'), '<title>gioco</title>');
  });

  afterEach(async () => {
    await running?.stop();
    running = undefined;
  });

  afterAll(() => rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

  const statuses = async (n: number, target: string, headers?: Record<string, string>) => {
    const out: number[] = [];
    for (let i = 0; i < n; i++) out.push((await ask(target, headers)).status);
    return out;
  };

  it('V-026 le rotte hanno un ritmo per indirizzo; la risposta dice quando riprovare e ha gli stessi header', async () => {
    await start({ api: { burst: 3, perSecond: 0.001 } });
    expect(await statuses(4, '/api/account')).toEqual([200, 200, 200, 429]);
    const over = await ask('/api/account');
    expect(over.headers['retry-after']).toBeDefined();
    expect(over.headers['content-security-policy']).toBeDefined();
    expect((await ask('/index.html?universo=x')).status).toBe(200);
  });

  it('V-026 ciò che legge un universo intero ha un ritmo più stretto delle altre rotte', async () => {
    await start({ api: { burst: 100, perSecond: 0.001 }, heavy: { burst: 2, perSecond: 0.001 } });
    expect(await statuses(3, '/api/universe/nessuno')).toEqual([200, 200, 429]);
    expect((await ask('/api/universe/nessuno/carte')).status).toBe(429);
    expect((await ask('/api/account')).status).toBe(200);
    expect((await ask('/api/universe')).status).toBe(200);
  });

  it('V-026 scrivere X-Forwarded-For non dà un altro indirizzo', async () => {
    await start({ api: { burst: 2, perSecond: 0.001 } });
    const said = await Promise.all(['1.1.1.1', '2.2.2.2', '3.3.3.3'].map((a) => ask('/api/account', { 'X-Forwarded-For': a })));
    expect(said.map((r) => r.status).sort()).toEqual([200, 200, 429]);
  });

  it('V-026 dietro un proxy dichiarato conta ciò che lui ha visto', async () => {
    await start({ api: { burst: 1, perSecond: 0.001 } }, { QUINE_PROXY_FIDATI: '1' });
    expect((await ask('/api/account', { 'X-Forwarded-For': '6.6.6.6, 203.0.113.1' })).status).toBe(200);
    expect((await ask('/api/account', { 'X-Forwarded-For': '7.7.7.7, 203.0.113.1' })).status).toBe(429);
    expect((await ask('/api/account', { 'X-Forwarded-For': '6.6.6.6, 203.0.113.2' })).status).toBe(200);
  });

  it('V-026 un mondo non ha ritmo, ma solo col suo token', async () => {
    await start({ api: { burst: 1, perSecond: 0.001 }, heavy: { burst: 1, perSecond: 0.001 } });
    // A token that is not the world's counts like anyone else.
    const forged = { [INTERNAL_HEADER]: worldToken('non-il-segreto', 'nessuno') };
    expect(await statuses(2, '/api/universe/nessuno', forged)).toEqual([200, 429]);
  });

  it('V-026 i socket hanno un ritmo per indirizzo', async () => {
    await start({ sockets: { burst: 2, perSecond: 0.001 } });
    const [a, b, c] = [socket(), socket(), socket()];
    await Promise.all([a.opened, b.opened, c.opened]);
    expect([a, b, c].map((s) => s.state.status).sort()).toEqual([0, 0, 429]);
    for (const s of [a, b, c]) s.ws.terminate();
  });

  it('V-026 un indirizzo ha pochi socket insieme, e chi chiude libera il posto', async () => {
    mkdirSync(path.join(work, 'universes'), { recursive: true });
    await start({ sockets: { burst: 100, perSecond: 1 }, socketsAtOnce: 2 });
    // A universe that exists keeps the sockets open while they say nothing.
    const root = path.join(work, 'universes', 'aperto');
    mkdirSync(root, { recursive: true });
    writeFileSync(path.join(root, 'universe.json'), JSON.stringify({ partita: { modalita: 'multiplayer', master: 'io' } }));
    execFileSync('git', ['init', '-q'], { cwd: root, stdio: 'ignore', windowsHide: true });
    const held = () => socketOf(`ws://127.0.0.1:${port}/api/session?universo=aperto`, { Host: 'gioco.example' }, SITE);
    const [a, b] = [held(), held()];
    await Promise.all([a.opened, b.opened]);
    const over = held();
    await over.opened;
    expect(over.state.status).toBe(429);
    a.ws.terminate();
    await until(() => a.state.closed, 3000, 'chiuso');
    await wait(100);
    const again = held();
    await again.opened;
    expect(again.state.status).toBe(0);
    for (const s of [b, again]) s.ws.terminate();
  });
});
