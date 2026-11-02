// What the second audit found (T167, docs/sicurezza/audit-2026-11-2.md, ADR-0112), each as the property that now holds.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { failureText } from '../../server/access';
import { DEFAULT_MAX_WORLDS, worldRefusal, wsLink } from '../../server/session';
import { stripeHandler } from '../../server/stripe';
import { universeStore } from '../../server/universeStore';
import { wandererHandler } from '../../server/wanderer';
import { WorldHost } from '../../server/worldHost';
import { MockModels } from '../../src/kernel/ai/mock';
import { billedModel, DEAREST_MODEL } from '../../src/kernel/ai/prices';
import { COMUNE } from '../../src/kernel/cards';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { Sandbox } from '../../src/kernel/sandbox';
import { fakeLink, type ServerMsg } from '../../src/session/protocol';
import { SessionServer } from '../../src/session/server';
import { fakeHost } from '../helpers';

/** JSON can write an object that JS cannot turn into a primitive: `String()` and `Number()` throw on it. */
const POISON = { toString: 1, valueOf: 1 };
const TICK = 1 / 60;

async function bootMany() {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3, master: 'io' } }, null, 2) };
  const models = new MockModels();
  const kernel = await Kernel.boot({ files, store: memoryStore(), models });
  return { kernel, models };
}

function enter(server: SessionServer, id: string, extra: Record<string, unknown> = {}) {
  const { server: s, client } = fakeLink();
  const got: ServerMsg[] = [];
  let closed = false;
  client.onMessage((m) => got.push(m));
  client.onClose(() => (closed = true));
  server.connect(s);
  client.send({ t: 'entra', id, ...extra } as never);
  return { send: (m: unknown) => client.send(m as never), got, closed: () => closed };
}

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r));
};

describe('V-021 un messaggio che non si capisce', () => {
  let kernel: Kernel;
  beforeAll(async () => void ({ kernel } = await bootMany()), 120_000);

  const SHAPES: Array<Record<string, unknown>> = [
    { t: 'frase', seq: POISON, tokens: [] },
    { t: 'pannello', pannello: POISON, posto: POISON, op: 'metti' },
    { t: 'oggetto', op: POISON, slot: 0 },
    { t: 'ricarica', viandante: POISON, quanti: POISON },
    { t: 'passo', seq: POISON, x: 1e9, y: 0 },
    { t: 'casella', col: POISON, row: POISON },
    { t: 'azione', entita: POISON, azione: POISON },
    { t: 'contenitore', entita: POISON, op: POISON },
    { t: 'segui', id: POISON },
    { t: 'dai', viandante: POISON, slot: 0, quanti: POISON },
    { t: 'dici', viandante: POISON, testo: POISON },
    { t: 'ramo', files: POISON, base: POISON },
    { t: POISON },
    { t: 'fabbrica', ricetta: POISON, unisci: [POISON, POISON] },
    { t: 'altro', viandante: 'nessuno', testo: POISON },
    { t: 'chat', entita: POISON, testo: POISON },
    { t: 'agente', agente: 'constructor', testo: 'x' },
    { t: 'profilo', profilo: { nome: POISON, seme: POISON, tinta: POISON, presentazione: POISON } },
  ];

  it('V-021 non ferma il tick, per nessun messaggio', async () => {
    const server = new SessionServer(kernel);
    const a = enter(server, 'avvelena');
    for (const shape of SHAPES) {
      a.send(shape);
      const before = kernel.ticks;
      expect(() => server.tick(TICK), JSON.stringify(shape)).not.toThrow();
      expect(kernel.ticks, JSON.stringify(shape)).toBe(before + 1);
    }
    await settle();
  });

  it('V-021 chi viene dopo nello stesso tick è servito', async () => {
    const server = new SessionServer(kernel);
    const a = enter(server, 'avvelena2');
    const b = enter(server, 'altro2');
    a.send({ t: 'frase', seq: POISON, tokens: [] });
    b.send({ t: 'frase', seq: 7, tokens: [] });
    server.tick(TICK);
    await settle();
    expect(b.got.some((m) => m.t === 'esito' && m.seq === 7)).toBe(true);
  });

  it('V-021 oltre il ritmo non getta nulla fuori da chi ascolta: nel processo del mondo lo ucciderebbe', () => {
    const server = new SessionServer(kernel);
    const a = enter(server, 'avvelena3');
    for (let i = 0; i < 200; i++) a.send({ t: 'frase', seq: 1, tokens: [] });
    expect(() => a.send({ t: 'frase', seq: POISON })).not.toThrow();
  });

  it('V-021 entrare con un nome o un profilo così è un rifiuto o un ingresso, mai un\'eccezione', () => {
    const server = new SessionServer(kernel);
    let a: ReturnType<typeof enter> | undefined;
    expect(() => (a = enter(server, 'avvelena4', { nome: POISON, tetto: POISON, profilo: { nome: POISON, seme: POISON, tinta: POISON, presentazione: POISON } }))).not.toThrow();
    expect(a!.got.some((m) => m.t === 'ingresso' || m.t === 'rifiuto')).toBe(true);
  });

  it('V-021 con gli account il rifiuto arriva anche dopo la verifica, senza promesse lasciate cadere', async () => {
    const failed: unknown[] = [];
    const seen = (e: unknown) => failed.push(e);
    process.on('unhandledRejection', seen);
    const server = new SessionServer(kernel, { verify: async () => ({ uid: 'avvelena5', anonimo: true }) });
    const a = enter(server, 'x', { token: 't', nome: POISON, profilo: { nome: POISON, seme: POISON, tinta: POISON, presentazione: POISON } });
    await settle();
    process.off('unhandledRejection', seen);
    expect(failed).toEqual([]);
    expect(a.got.some((m) => m.t === 'ingresso' || m.t === 'rifiuto')).toBe(true);
  });
});

describe('V-022 chi paga dopo un await', () => {
  let kernel: Kernel;
  let models: MockModels;
  const asked: Array<{ task: string; chi?: string }> = [];
  beforeAll(async () => {
    ({ kernel, models } = await bootMany());
    const real = models.text.bind(models);
    models.text = ((q: { task: string; chi?: string }) => {
      asked.push({ task: q.task, chi: q.chi });
      return real(q as never);
    }) as never;
  }, 120_000);

  it('V-022 la risposta di una persona la paga chi le parla, non il master', async () => {
    const server = new SessionServer(kernel, { reach: 1e6 });
    const a = enter(server, 'parla');
    kernel.ledger.credit('parla', 5);
    const person = [...kernel.modules.values()].find((m) => m.manifest.persona)!;
    const at = kernel.wandererAt('parla')!;
    const npc = kernel.spawnModuleEntity(person, at.x + 1, at.y);
    asked.length = 0;
    a.send({ t: 'chat', seq: 1, entita: npc, testo: 'ciao' });
    for (let i = 0; i < 200 && !a.got.some((m) => m.t === 'esito' && m.seq === 1); i++) {
      server.tick(TICK);
      await settle();
    }
    const reply = asked.find((c) => c.task === 'npc.reply');
    expect(reply?.chi).toBe('parla');
    expect(asked.filter((c) => c.chi === 'io')).toEqual([]);
  });

  it('V-022 senza crediti di chi parla risponde il modello locale, anche se il master ne ha', async () => {
    kernel.ledger.credit('io', 5);
    const server = new SessionServer(kernel, { reach: 1e6 });
    const a = enter(server, 'senza');
    const person = [...kernel.modules.values()].find((m) => m.manifest.persona)!;
    const at = kernel.wandererAt('senza')!;
    const npc = kernel.spawnModuleEntity(person, at.x + 1, at.y);
    const master = kernel.creditsOf('io');
    asked.length = 0;
    a.send({ t: 'chat', seq: 1, entita: npc, testo: 'ciao' });
    for (let i = 0; i < 200 && !a.got.some((m) => m.t === 'esito' && m.seq === 1); i++) {
      server.tick(TICK);
      await settle();
    }
    expect(asked.filter((c) => c.task === 'npc.reply')).toEqual([]);
    expect(kernel.creditsOf('io')).toBe(master);
  });

  it('V-022 ciò che il mondo chiede da solo, fuori da un viandante che agisce, non è del master', () => {
    expect(kernel.payerNow()).toBe(COMUNE);
    expect(kernel.as('parla', () => kernel.payerNow())).toBe('parla');
    expect(kernel.as('io', () => kernel.payerNow())).toBe('io');
  });
});

describe('V-023 le spese comuni senza nessuno che paga', () => {
  let kernel: Kernel;
  let models: MockModels;
  beforeAll(async () => void ({ kernel, models } = await bootMany()), 120_000);
  afterEach(() => void vi.restoreAllMocks());

  const ask = () => kernel.council.write('narratore', 'council.prova', 'prova', { chi: COMUNE });

  it('V-023 con gli account, nessuno con crediti: la chiave non si spende', async () => {
    const server = new SessionServer(kernel, { verify: async () => ({ uid: 'povero', anonimo: false }) });
    enter(server, 'x', { token: 't' });
    await settle();
    expect(server.connected()).toContain('povero');
    const spy = vi.spyOn(models, 'text');
    await ask();
    expect(spy).not.toHaveBeenCalled();
  });

  it('V-023 con gli account, nessuno collegato: la chiave non si spende', async () => {
    new SessionServer(kernel, { verify: async () => undefined });
    const spy = vi.spyOn(models, 'text');
    await ask();
    expect(spy).not.toHaveBeenCalled();
  });

  it('V-023 con qualcuno che può pagare si spende, e paga lui', async () => {
    const server = new SessionServer(kernel, { verify: async () => ({ uid: 'ricco', anonimo: false }) });
    enter(server, 'x', { token: 't' });
    await settle();
    kernel.ledger.credit('ricco', 5);
    const spy = vi.spyOn(models, 'text');
    await ask();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('V-023 senza account (questa macchina, la sua chiave) resta come prima', async () => {
    new SessionServer(kernel);
    const spy = vi.spyOn(models, 'text');
    await ask();
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('V-024 un modello fuori listino', () => {
  it('V-024 si paga come il più caro, come lo conta il proxy, e i locali restano gratis', async () => {
    expect(billedModel('gemini-mai-sentito')).toBe(DEAREST_MODEL);
    expect(billedModel('gemini-3.1-flash-lite')).toBe('gemini-3.1-flash-lite');
    expect(billedModel('mock')).toBe('mock');
    const { kernel } = await bootMany();
    kernel.ledger.credit('paga', 5);
    const call = (model: string) => ({ day: '2026-11-02', model, agent: 'narratore', task: 'text.examine', prompt: 100000, cached: 0, output: 100000, thoughts: 0, chi: 'paga' });
    kernel.billCall(call('mock') as never);
    expect(kernel.ledger.balance('paga')).toBe(5);
    kernel.billCall(call('gemini-mai-sentito') as never);
    expect(kernel.ledger.balance('paga')).toBeLessThan(5);
  }, 120_000);
});

describe('V-025 quali mondi apre un socket', () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-mondi-'));
    for (const [name, modalita] of [['molti', 'multigiocatore'], ['solo', 'singola']]) {
      mkdirSync(path.join(dir, name, '.git'), { recursive: true });
      writeFileSync(path.join(dir, name, 'universe.json'), JSON.stringify({ partita: { modalita } }));
    }
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('V-025 un nome che non è un universo non avvia un processo', () => expect(worldRefusal(dir, 'non-esiste', 0)).toMatch(/non esiste/));
  it('V-025 una partita in singola nemmeno', () => expect(worldRefusal(dir, 'solo', 0)).toMatch(/singola/));
  it('V-025 una partita di molti sì, finché ci sono posti', () => {
    expect(worldRefusal(dir, 'molti', 0)).toBeUndefined();
    expect(worldRefusal(dir, 'molti', DEFAULT_MAX_WORLDS - 1)).toBeUndefined();
    expect(worldRefusal(dir, 'molti', DEFAULT_MAX_WORLDS)).toMatch(/troppi/);
    expect(worldRefusal(dir, 'molti', 3, 3)).toMatch(/troppi/);
  });
});

describe('V-027 ciò che Lua lascia al kernel da leggere', () => {
  async function sandbox(store: Record<string, unknown>) {
    const fake = fakeHost();
    let given: unknown;
    fake.host.get = () => store;
    fake.host.set = (_id: number, _name: string, data: unknown) => {
      given = data;
      return true;
    };
    const sb = await Sandbox.create(fake.host);
    const run = (body: string) => {
      const name = `prova${Math.random()}`;
      expect(sb.loadModule(name, `local M = {} function M.update() ${body} end return M`)).toBeNull();
      sb.run(name, 'update');
    };
    return { run, given: () => given };
  }

  it('V-027 una lista non diventa di miliardi di buchi', async () => {
    const store = { list: [1, 2] as unknown[] };
    const { run } = await sandbox(store);
    run(`ecs.get(1, 'x').list.length = 4000000000`);
    expect(store.list.length).toBe(2);
    run(`ecs.get(1, 'x').list[3000000000] = 1`);
    expect(store.list.length).toBe(2);
    run(`ecs.get(1, 'x').list['3000000000'] = 1`);
    expect(store.list.length).toBe(2);
  });

  it('V-027 una lista cresce ancora, e si riscrive', async () => {
    const store = { list: [1, 2] as unknown[] };
    const { run } = await sandbox(store);
    run(`local l = ecs.get(1, 'x').list; l[#l + 1] = 3; l[1] = 9`);
    expect(store.list).toEqual([9, 2, 3]);
  });

  it('V-027 una tabella condivisa a ogni livello si può ancora scrivere in JSON', async () => {
    const { run, given } = await sandbox({});
    run(`local t = {1}; for i = 1, 60 do t = {t, t} end; ecs.set(1, 'y', t)`);
    const text = JSON.stringify(given());
    expect(text.length).toBeLessThan(64 * 1024 * 1024);
  });

  it('V-027 una tabella grande ma vera arriva intera', async () => {
    const { run, given } = await sandbox({});
    run(`local t = {}; for i = 1, 5000 do t[i] = {i} end; local s = {}; s.a = t; s.b = t; ecs.set(1, 'y', s)`);
    const got = given() as { a: unknown[]; b: unknown[] };
    expect(got.a.length).toBe(5000);
    expect(got.b).toBe(got.a);
  });
});

describe('V-028 prima di sapere chi è', () => {
  it('V-028 ciò che arriva al mondo prima di «entra» non passa', () => {
    const host = new WorldHost({ name: 'x', base: 'http://localhost', internal: 's', entry: 'nessuno' });
    const sent: unknown[] = [];
    Object.assign(host, { up: true, child: { connected: true, send: (m: unknown, done: () => void) => (sent.push(m), done()) } });
    const fns: Array<(m: unknown) => void> = [];
    host.connect({ send() {}, onMessage: (f) => void fns.push(f), onClose() {}, close() {} });
    fns[0]({ t: 'frase', tokens: ['x'.repeat(1000)] });
    expect(sent.filter((m) => (m as { t: string }).t === 'msg')).toEqual([]);
    fns[0]({ t: 'entra', id: 'a' });
    fns[0]({ t: 'frase', tokens: [] });
    expect(sent.filter((m) => (m as { t: string }).t === 'msg').length).toBe(2);
  });

  it('V-028 un socket che si chiude mentre il mondo apre lo si sa lo stesso', () => {
    const on: Record<string, () => void> = {};
    const ws = { readyState: 1, OPEN: 1, on: (e: string, f: () => void) => (on[e] = f), send() {}, close() {} };
    const link = wsLink(ws as never);
    let told = 0;
    link.onClose(() => told++);
    ws.readyState = 3;
    on.close();
    expect(told).toBe(1);
    link.onClose(() => told++);
    expect(told).toBe(2);
  });

  const request = (base: string, p: string, headers: Record<string, string>, body: string) =>
    new Promise<{ status: number; text: string }>((done, fail) => {
      const r = http.request(`${base}${p}`, { method: 'POST', headers }, (res) => {
        let text = '';
        res.on('data', (c) => (text += c));
        res.on('end', () => done({ status: res.statusCode ?? 0, text }));
      });
      r.on('error', fail);
      r.end(body);
    });

  async function serve(handler: (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void) {
    const server = http.createServer((req, res) => handler(req, res, () => ((res.statusCode = 404), res.end())));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    return { base: `http://localhost:${(server.address() as AddressInfo).port}`, close: () => server.close() };
  }

  it('V-028 il checkout passa dalla stessa porta delle altre rotte', async () => {
    const fetchFn = vi.fn();
    const s = await serve(stripeHandler({ settings: { secretKey: 'mock' }, universesDir: '.', fetchFn } as never) as never);
    const body = JSON.stringify({ universo: 'x', wandererId: 'a', crediti: 5 });
    const J = { 'Content-Type': 'application/json' };
    expect((await request(s.base, '/api/stripe/checkout', { ...J, Origin: 'http://altro.example' }, body)).status).toBe(403);
    expect((await request(s.base, '/api/stripe/checkout', { ...J, 'X-Forwarded-For': '203.0.113.7' }, body)).status).toBe(403);
    expect((await request(s.base, '/api/stripe/checkout', { 'Content-Type': 'text/plain' }, body)).status).toBe(415);
    expect((await request(s.base, '/api/stripe/checkout', J, body)).status).toBe(200);
    s.close();
  });

  it('V-028 fare un universo senza account finisce prima di leggere il corpo', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'quine-crea-'));
    let handler: (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void;
    (universeStore(dir, { accounts: { config: {}, verify: async () => undefined } }).configureServer as (s: unknown) => void)({ middlewares: { use: (h: typeof handler) => (handler = h) } });
    const s = await serve((a, b, c) => handler(a, b, c));
    const r = await request(s.base, '/api/universe/nuovo/create', { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.7' }, 'questo non è JSON');
    expect(r.status).toBe(403);
    s.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('V-029 il CORS del server di sviluppo', () => {
  it('V-029 è spento, anche nella preview: lo misura V-029.a del kit', () => {
    const config = readFileSync('vite.config.ts', 'utf8');
    expect(config).toMatch(/preview: \{ cors: false \}/);
    expect(config).toMatch(/server: \{ cors: false,/);
  });
});

describe('V-020 il testo delle eccezioni', () => {
  afterEach(() => void vi.restoreAllMocks());

  it('V-020 al client vanno le parole scritte per lui, il resto nel log', () => {
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const said of ['esiste già', 'universo sconosciuto', 'commit non valido', 'percorso non ammesso: x', 'nome non valido: x', '«a» è già il master di questo universo', "l'universo «x» non esiste", '«x» è una partita in singola']) {
      expect(failureText('prova', new Error(said))).toBe(said);
    }
    expect(log).not.toHaveBeenCalled();
    for (const inner of ['fatal: not a git repository: C:\\Users\\x\\universes\\y', "ENOENT: no such file or directory, open '/home/x/universes/y'", 'Unexpected token q in JSON at position 0', 'error: pathspec']) {
      const told = failureText('prova', new Error(inner));
      expect(told).not.toContain(inner);
      expect(told).not.toMatch(/[\\/]|JSON|fatal/);
    }
    expect(log).toHaveBeenCalledTimes(4);
  });

  it('V-020 il negozio degli universi non dice cosa pensa il parser né git', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dir = mkdtempSync(path.join(os.tmpdir(), 'quine-errori-'));
    const root = path.join(dir, 'mio');
    mkdirSync(root);
    execFileSync('git', ['init', '-q'], { cwd: root });
    let handler: (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void;
    (universeStore(dir).configureServer as (s: unknown) => void)({ middlewares: { use: (h: typeof handler) => (handler = h) } });
    const server = http.createServer((req, res) => handler(req, res, () => res.end()));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://localhost:${(server.address() as AddressInfo).port}`;
    const J = { 'Content-Type': 'application/json' };
    const bad = await fetch(`${base}/api/universe/mio/commit`, { method: 'POST', headers: J, body: 'questo non è JSON' });
    expect(bad.status).toBe(500);
    expect(await bad.text()).not.toMatch(/JSON|token|position/);
    const git = await fetch(`${base}/api/universe/mio/checkout`, { method: 'POST', headers: J, body: JSON.stringify({ id: 'abcd' }) });
    expect(git.status).toBe(500);
    expect(await git.text()).not.toMatch(/fatal|error:|[\\/]universes|quine-errori/);
    const told = await fetch(`${base}/api/universe/mio/checkout`, { method: 'POST', headers: J, body: JSON.stringify({ id: 'zz' }) });
    expect(await told.text()).toContain('commit non valido');
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('V-020 il viandante e i crediti non dicono cosa è successo dentro', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = wandererHandler({ universesDir: '.', accounts: { config: {}, verify: async () => { throw new Error('C:\\segreto\\percorso: fallito'); } } });
    const server = http.createServer((req, res) => handler(req, res, () => res.end()));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const r = await fetch(`http://localhost:${(server.address() as AddressInfo).port}/api/viandante?universo=mio`, { headers: { Authorization: 'Bearer x' } });
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain('segreto');
    server.close();
  });
});
