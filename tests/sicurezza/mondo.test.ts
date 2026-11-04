// V-007, second half (T127, ADR-0110): a world is a process of its own. A blocked one stops neither the HTTP nor another world, it is
// killed and starts again, its clients stay and are told, it holds no secret.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bundledFiles } from '../../src/kernel/bundle';
import { worldToken } from '../../server/access';
import { gitLocks, runGit, settleGit } from '../../server/git';
import { LEDGER_DIR, ledgerOf } from '../../server/ledger';
import { universeStore } from '../../server/universeStore';
import { INTERNAL_HEADER } from '../../src/kernel/universes';
import type { PaymentRecord } from '../../src/kernel/credits';
import { buildWorld, MAX_BACKLOG, WORLD_TIMES, WorldHost, worldEnv, type HostLink, type WorldOptions } from '../../server/worldHost';
import { TurnRunner } from '../../src/session/host';
import type { FormRequest, FormResult } from '../../src/kernel/forms';
import { LIMITS } from '../../src/session/server';
import type { ServerMsg } from '../../src/session/protocol';
import { removeWhenFree } from './fixtures/removeWhenFree';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void;

const INTERNAL = 'segreto-finto-del-processo';
const FIXTURES = path.resolve('tests/sicurezza/fixtures');
const FAKE = path.join(FIXTURES, 'mondo-finto.mjs');
const REAL = path.join(FIXTURES, 'mondo-bloccabile.mjs');
const FAST = { notice: 300, kill: 1500, boot: 60000, healthy: 100000, call: 3000, deaths: 4 };

const until = async (what: () => unknown, ms = 30000, label = 'attesa') => {
  const end = Date.now() + ms;
  for (;;) {
    const v = what();
    if (v) return v;
    if (Date.now() > end) throw new Error(`scaduta: ${label}`);
    await new Promise((r) => setTimeout(r, 20));
  }
};

/** A client as the sockets give it, keeping what it hears. */
function client() {
  const heard: ServerMsg[] = [];
  const fns: Array<(m: unknown) => void> = [];
  let closed = false;
  const link: HostLink = {
    send: (m) => void heard.push(m),
    onMessage: (fn) => void fns.push(fn),
    onClose: () => undefined,
    close: () => void (closed = true),
  };
  return { link, heard, say: (m: unknown) => fns.forEach((f) => f(m)), closed: () => closed, of: (t: ServerMsg['t']) => heard.filter((m) => m.t === t) };
}

const fake = (mode: string, more: Partial<WorldOptions> = {}) => new WorldHost({ name: 'finto', base: 'http://localhost:1', internal: INTERNAL, entry: FAKE, entryArgs: [mode], reads: [], times: FAST, ...more });
const childOf = (h: WorldHost) => (h as unknown as { child: { send(m: unknown): void; on(e: string, f: (m: never) => void): void } }).child;

describe('il sorvegliante, con un mondo finto', () => {
  it('V-007 un mondo che non si apre lo dice a chi lo apre e non riparte', async () => {
    const h = fake('errore');
    expect(await h.start()).toEqual({ error: 'non si apre' });
    expect(h.restarts).toBe(0);
    await h.stop();
  });

  it('V-007 un mondo bloccato: avviso, ucciso, ripartito; il client resta e sa di dover rientrare', async () => {
    const h = fake('pronto');
    expect(await h.start()).toEqual({ ok: true });
    const c = client();
    h.connect(c.link);
    c.say({ t: 'entra', id: 'alice' });
    childOf(h).send({ t: 'sonda-blocca' });
    await until(() => c.of('mondo').length, 5000, 'avviso');
    expect(c.of('mondo')[0]).toMatchObject({ t: 'mondo', stato: 'fermo' });
    expect(c.closed()).toBe(false);
    await until(() => c.of('mondo').some((m) => m.t === 'mondo' && m.stato === 'ripartito'), 10000, 'ripartito');
    expect(h.restarts).toBe(1);
    expect(c.closed()).toBe(false);
    await h.stop();
  });

  it('V-007 muore due volte di fila: torna all’ultimo commit vissuto; poi si arrende, e il prossimo client riprova', async () => {
    let gaveUp = '';
    let n = 0;
    const h = fake('pronto', { times: { ...FAST, healthy: 150, deaths: 3 }, headOf: async () => `commit-${++n}`, onGiveUp: (w) => (gaveUp = w) });
    const inner = h as unknown as { good?: string; up: boolean; times: { healthy: number } };
    await h.start();
    const c = client();
    h.connect(c.link);
    await until(() => inner.good, 5000, 'un commit vissuto');
    // From here the deaths are in a row: under load, 150 ms could pass between the world opening and the next probe reaching it.
    inner.times.healthy = 3600000;
    childOf(h).send({ t: 'sonda-muori' });
    await until(() => h.restarts === 1, 5000, 'primo riavvio');
    await until(() => inner.up, 5000, 'di nuovo su');
    childOf(h).send({ t: 'sonda-muori' });
    await until(() => h.restarts === 2, 5000, 'secondo riavvio');
    const third: Array<{ t: string; open?: { restore?: string } }> = [];
    childOf(h).on('message', (m: never) => void third.push(m));
    await until(() => third.some((m) => m.t === 'visto'), 5000, 'apertura');
    expect(third.find((m) => m.t === 'visto')?.open?.restore).toMatch(/^commit-\d+$/);
    childOf(h).send({ t: 'sonda-muori' });
    await until(() => gaveUp, 5000, 'resa');
    expect(c.of('rifiuto')).toHaveLength(1);
    expect(c.closed()).toBe(true);
    await h.stop();
  });

  it('V-007 l’apertura non conta come vita: chi muore appena aperto, dopo un’apertura più lunga di `healthy`, torna al commit vissuto e si arrende', async () => {
    let gaveUp = '';
    let n = 0;
    const h = fake('pronto', { times: { ...FAST, healthy: 150, deaths: 3 }, headOf: async () => `commit-${++n}`, onGiveUp: (w) => (gaveUp = w) });
    const inner = h as unknown as { good?: string; times: { healthy: number }; o: { entryArgs: string[] } };
    await h.start();
    const c = client();
    h.connect(c.link);
    await until(() => inner.good, 5000, 'un commit vissuto');
    // From here it opens in 2 s and lives 400 ms: `healthy` is between the two. In production: an opening of 90 s against 60 s (T176). The 400 ms are more than a look of the watcher.
    inner.times.healthy = 1500;
    inner.o.entryArgs = ['apre-e-muore', '2000', '400'];
    childOf(h).send({ t: 'sonda-muori' });
    await until(() => h.restarts === 2, 15000, 'secondo riavvio');
    const third: Array<{ t: string; open?: { restore?: string } }> = [];
    childOf(h).on('message', (m: never) => void third.push(m));
    await until(() => third.some((m) => m.t === 'pronto'), 15000, 'terza apertura');
    expect(third.find((m) => m.t === 'visto')?.open?.restore).toMatch(/^commit-\d+$/);
    await until(() => gaveUp, 15000, 'resa');
    expect(c.of('rifiuto')).toHaveLength(1);
    await h.stop();
  }, 60000);

  it('V-007 aperto e vivo per `healthy`, le morti di prima si dimenticano', async () => {
    const h = fake('pronto', { times: { ...FAST, healthy: 1000 } });
    const inner = h as unknown as { deaths: number; up: boolean };
    await h.start();
    childOf(h).send({ t: 'sonda-muori' });
    await until(() => h.restarts === 1 && inner.up, 15000, 'di nuovo su');
    expect(inner.deaths).toBe(1);
    await until(() => inner.deaths === 0, 15000, 'morti dimenticate');
    await h.stop();
  }, 60000);

  it('V-007 i segreti restano qui: nel comando e nell’ambiente del mondo non ci sono', async () => {
    process.env.GEMINI_API_KEY = 'chiave-finta';
    try {
      const env = worldEnv();
      expect(Object.keys(env).sort().join()).not.toMatch(/GEMINI|STRIPE|FIREBASE|QUINE/);
      expect(JSON.stringify(env)).not.toContain('chiave-finta');
      // The fee passes by value (ADR-0132): that name, nothing else of ours.
      expect(Object.keys(worldEnv(0)).filter((k) => /GEMINI|STRIPE|FIREBASE|QUINE/.test(k))).toEqual(['QUINE_COMMISSIONE']);
      expect(worldEnv(0).QUINE_COMMISSIONE).toBe('0');
    } finally {
      delete process.env.GEMINI_API_KEY;
    }
  });

  it('V-007 una chiamata a un mondo bloccato fallisce la rotta entro il suo tempo, non la ferma', async () => {
    const h = fake('pronto', { times: { ...FAST, call: 200, kill: 60000, notice: 60000 } });
    await h.start();
    childOf(h).send({ t: 'sonda-blocca' });
    const t = Date.now();
    await expect(Promise.resolve(h.calls.isAnonymous('alice'))).rejects.toThrow(/non risponde/);
    expect(Date.now() - t).toBeLessThan(2000);
    (h as unknown as { child: { kill(s: string): void } }).child.kill('SIGKILL');
    await h.stop();
  });
});

describe('i programmi nel mondo (T169)', () => {
  it('V-007 tra due programmi di una raffica passa il timer dei tick: il silenzio è uno, non la somma', async () => {
    let turns = 0;
    const timer = setInterval(() => turns++, 1);
    const at: number[] = [];
    const slow = { run: async () => {
      const end = Date.now() + 20;
      while (Date.now() < end);
      at.push(turns);
      return {} as FormResult;
    } };
    const r = new TurnRunner(slow);
    await Promise.all(Array.from({ length: 6 }, () => r.run({} as FormRequest)));
    clearInterval(timer);
    expect(new Set(at).size).toBe(6);
  });

  it('V-007 un programma che fallisce non ferma quelli dopo', async () => {
    let n = 0;
    const r = new TurnRunner({ run: async () => {
      if (++n === 1) throw new Error('no');
      return {} as FormResult;
    } });
    const [a, b] = [r.run({} as FormRequest), r.run({} as FormRequest)];
    await expect(a).rejects.toThrow('no');
    await expect(b).resolves.toEqual({});
  });
});

describe('il canale verso un mondo bloccato (T169)', () => {
  it('V-011 ciò che un mondo fermo non ascolta non si accumula oltre il tetto: chi aspetta ha una risposta', async () => {
    const h = fake('pronto', { times: { ...FAST, kill: 60000, notice: 60000 } });
    await h.start();
    const c = client();
    h.connect(c.link);
    c.say({ t: 'entra', id: 'alice' });
    childOf(h).send({ t: 'sonda-blocca' });
    const text = 'x'.repeat(200 * 1024);
    for (let i = 1; i < (2 * MAX_BACKLOG) / text.length; i++) c.say({ t: 'altro', seq: i, entita: 1, testo: text });
    await until(() => c.of('esito').length, 5000, 'risposta');
    expect(c.of('esito')[0]).toMatchObject({ t: 'esito', ok: false });
    expect((h as unknown as { backlog: number }).backlog).toBeLessThanOrEqual(MAX_BACKLOG);
    (h as unknown as { child: { kill(s: string): void } }).child.kill('SIGKILL');
    await h.stop();
  });
});

describe('due mondi veri', () => {
  let dir: string;
  let outDir: string;
  let program: string;
  let server: http.Server;
  let base: string;
  const modules = path.resolve('node_modules');

  const universe = (name: string) => {
    const root = path.join(dir, name);
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files: Record<string, string> = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, name, partita: { modalita: 'multigiocatore', morte: 3, master: 'io' } }) };
    for (const [rel, text] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      writeFileSync(path.join(root, rel), text);
    }
    const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=Prove', '-c', 'user.email=prove@rune.local', '-c', 'core.autocrlf=false', ...a], { cwd: root, windowsHide: true, stdio: 'ignore' });
    git('init', '-q');
    git('add', '-A');
    git('commit', '-q', '-m', 'nasce');
  };

  // Measured with 24 busy threads on 12 logical processors (T176). Opening: 90 s against 12 s on an idle machine, 84 of them the programs of the campus with the cache
  // of the forms empty, so a real world has the time production gives it. Silence once open: up to 5.5 s, so the notice and the routes' wait are production's too, and
  // the kill, which here a test waits for and production has at 45 s, is well above it.
  const REAL_TIMES = { ...FAST, notice: WORLD_TIMES.notice, kill: 20000, boot: WORLD_TIMES.boot, call: WORLD_TIMES.call };
  /** The longest a test that opens a world `n` times can take. A wait, not a pace: a well test ends long before. */
  const opening = (n: number) => n * WORLD_TIMES.boot + 60000;
  const world = (name: string, more: Partial<WorldOptions> = {}) =>
    new WorldHost({ name, base, internal: INTERNAL, offline: true, entry: REAL, entryArgs: [program], reads: [outDir], times: REAL_TIMES, ...more });

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-mondo-'));
    outDir = path.join(modules, '.quine-mondo', `prova-${process.pid}`);
    program = await buildWorld(process.cwd(), { outDir });
    universe('uno');
    universe('due');
    const handlers: Handler[] = [];
    const plugin = universeStore(dir, { internal: INTERNAL }) as unknown as { configureServer(s: unknown): void };
    plugin.configureServer({ middlewares: { use: (h: Handler) => handlers.push(h) } });
    server = http.createServer((req, res) => {
      const run = (i: number): void => (handlers[i] ? handlers[i](req, res, () => run(i + 1)) : ((res.statusCode = 404), void res.end()));
      run(0);
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }, 180000);

  afterAll(async () => {
    server?.close();
    rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    await removeWhenFree(dir);
  }, 120000);

  it('V-007 un mondo bloccato non ferma l’HTTP né l’altro mondo, e riparte; chi era dentro rientra', async () => {
    const [uno, due] = [world('uno'), world('due')];
    try {
      expect(await uno.start()).toEqual({ ok: true });
      expect(await due.start()).toEqual({ ok: true });
      const [a, b] = [client(), client()];
      uno.connect(a.link);
      due.connect(b.link);
      a.say({ t: 'entra', id: 'alice' });
      b.say({ t: 'entra', id: 'bruno' });
      await until(() => a.of('ingresso').length && b.of('ingresso').length, 20000, 'ingresso');
      // A first opening longer than the notice (the cache of the forms is empty) is not silence: nobody was told, nothing was killed.
      expect(a.of('mondo')).toHaveLength(0);
      expect(uno.restarts).toBe(0);
      childOf(uno).send({ t: 'sonda-blocca' });
      await until(() => a.of('mondo').length, 20000, 'avviso');
      // The server answers while that world is stuck, and the other one goes on hearing its client.
      const r = await fetch(`${base}/api/universe`);
      expect(r.status).toBe(200);
      const seen = b.heard.length;
      b.say({ t: 'passo', seq: 1, x: 0.1, y: 0.1 });
      await until(() => b.heard.length > seen, 20000, 'l’altro mondo risponde');
      expect(due.restarts).toBe(0);
      await until(() => a.of('mondo').some((m) => m.t === 'mondo' && m.stato === 'ripartito'), REAL_TIMES.kill + WORLD_TIMES.boot, 'ripartito');
      a.say({ t: 'entra', id: 'alice' });
      await until(() => a.of('ingresso').length === 2, 30000, 'di nuovo dentro');
      expect(uno.restarts).toBe(1);
      expect(a.closed()).toBe(false);
    } finally {
      await uno.stop();
      await due.stop();
    }
  }, opening(3));

  it('V-007 stop() aspetta il commit già partito: niente lock, e il commit c’è (T209)', async () => {
    universe('salva');
    const root = path.join(dir, 'salva');
    const h = fake('pronto', { name: 'salva', gits: () => settleGit(root, 60000) });
    await h.start();
    const changes: Record<string, string> = {};
    for (let i = 0; i < 3000; i++) changes[`modules/massa/f${i}.json`] = `{"n":${i}}`;
    const commit = fetch(`${base}/api/universe/salva/commit`, { method: 'POST', headers: { 'Content-Type': 'application/json', [INTERNAL_HEADER]: worldToken(INTERNAL, 'salva') }, body: JSON.stringify({ changes, message: 'l’ultimo salvataggio', author: 'kernel' }) });
    // The world goes while git is at work: as when it is killed at the end of its last save.
    await until(() => gitLocks(root).length, 60000, 'il commit è partito');
    await h.stop();
    expect(gitLocks(root)).toEqual([]);
    expect((await commit).status).toBe(200);
    expect(execFileSync('git', ['log', '-1', '--format=%s'], { cwd: root, windowsHide: true, encoding: 'utf8' }).trim()).toBe('l’ultimo salvataggio');
  }, 120000);

  it('V-007 stop() entro il suo limite: un git che non finisce è ucciso e i lock tolti (T209)', async () => {
    universe('ferma');
    const root = path.join(dir, 'ferma');
    const h = fake('pronto', { name: 'ferma', gits: () => settleGit(root, 300) });
    await h.start();
    // Reads what nobody writes: it never ends. The lock is what a commit cut short would leave.
    const stuck = runGit(root, ['hash-object', '--stdin'], { author: ['Prove', 'prove@rune.local'] }).catch((e: Error) => e);
    writeFileSync(path.join(root, '.git', 'index.lock'), '');
    mkdirSync(path.join(root, '.git', 'refs', 'heads', 'rami'), { recursive: true });
    writeFileSync(path.join(root, '.git', 'refs', 'heads', 'rami', 'x.lock'), '');
    const t = Date.now();
    await h.stop();
    expect(Date.now() - t).toBeLessThan(20000);
    expect(gitLocks(root)).toEqual([]);
    expect(await stuck).toBeInstanceOf(Error);
  }, 60000);

  it('V-007 il programma ha la cache delle forme senza il disco dei test', () => {
    const text = readFileSync(program, 'utf8');
    expect(text).toContain('sharedForms');
    expect(text).not.toContain('quine-forms');
    expect(text).not.toContain('engineVersion');
  });

  it('V-011 V-012 attraverso il processo valgono i limiti e gli elenchi, anche dopo un riavvio', async () => {
    const uno = world('uno', { times: { ...REAL_TIMES, kill: 60000, notice: 60000 } });
    const isolated = (m: ServerMsg | undefined) => {
      if (m?.t !== 'ingresso') throw new Error('nessun ingresso');
      expect(m.master).toBeFalsy();
      const paths = Object.keys(m.files);
      expect(paths.some((p) => p.startsWith('prompts/') || p === 'world/bible.json' || p === 'world/people.json' || p.startsWith('world/giocatori/'))).toBe(false);
      expect(JSON.parse(m.files['universe.json'])).not.toHaveProperty('ai');
    };
    try {
      expect(await uno.start()).toEqual({ ok: true });
      const [p, q] = [client(), client()];
      uno.connect(p.link);
      uno.connect(q.link);
      p.say({ t: 'entra', id: 'pina' });
      q.say({ t: 'entra', id: 'quirino' });
      await until(() => p.of('ingresso').length && q.of('ingresso').length, 20000, 'ingresso');
      isolated(p.of('ingresso')[0]);
      // What may call the models is refused past its pace, in the world's own process, with an answer.
      for (let i = 1; i <= LIMITS.heavyBurst + 5; i++) p.say({ t: 'altro', seq: 1000 + i, viandante: 'quirino', testo: 'prova' });
      await until(() => p.of('esito').some((m) => m.t === 'esito' && !m.ok && /fretta|attesa/.test(m.motivo ?? '')), 15000, 'limite dei pesanti');
      // Who does not stop is closed; the other goes on hearing the world.
      for (let i = 0; i < LIMITS.burst + LIMITS.flood + 500; i++) p.say({ t: 'passo', seq: 5000 + i, x: 0.1, y: 0.1 });
      await until(() => p.closed(), 15000, 'chiuso');
      expect(q.closed()).toBe(false);
      const seen = q.heard.length;
      q.say({ t: 'passo', seq: 1, x: 0.2, y: 0.2 });
      await until(() => q.heard.length > seen, 20000, 'l’altro ascolta');
      // After a restart the warnings say nothing of the world, and what comes in again is on the list again.
      (uno as unknown as { child: { kill(s: string): void } }).child.kill('SIGKILL');
      await until(() => q.of('mondo').some((m) => m.t === 'mondo' && m.stato === 'ripartito'), WORLD_TIMES.boot, 'ripartito');
      for (const m of q.of('mondo')) expect(Object.keys(m).sort()).toEqual(['stato', 't', 'testo']);
      q.say({ t: 'entra', id: 'quirino' });
      await until(() => q.of('ingresso').length === 2, 30000, 'di nuovo dentro');
      isolated(q.of('ingresso')[1]);
    } finally {
      await uno.stop();
    }
  }, opening(2));

  // The one `FATAL ERROR: Reached heap limit ... JavaScript heap out of memory` in the log of the suite comes from here, with its native stack (T210): the child
  // inherits stderr (`stdio` in `WorldHost.spawn`) and dies on purpose at the 200 MB asked for below. It is the property under test, not a fault of the suite.
  it('V-007 oltre il limite di memoria muore lui solo, e riparte', async () => {
    const uno = world('uno', { memoryMb: 200, times: { ...REAL_TIMES, kill: 60000, notice: 60000 } });
    try {
      expect(await uno.start()).toEqual({ ok: true });
      childOf(uno).send({ t: 'sonda-gonfia' });
      await until(() => uno.restarts === 1, 60000, 'riavvio');
      await until(() => (uno as unknown as { up: boolean }).up, WORLD_TIMES.boot, 'di nuovo su');
      expect((await fetch(`${base}/api/universe`)).status).toBe(200);
    } finally {
      await uno.stop();
    }
  }, opening(2));

  it('V-007 sotto i permessi il mondo scrive il suo archivio dei saldi e risponde alle rotte; il token vale per il suo universo', async () => {
    const saldi = path.join(dir, LEDGER_DIR);
    mkdirSync(saldi, { recursive: true });
    const uno = world('uno', { ledgerFile: path.join(saldi, 'uno.json'), grantCap: 0, platformFee: 0 });
    try {
      expect(await uno.start()).toEqual({ ok: true });
      const payment = { eventId: 'evt-mondo', wandererId: 'alice', crediti: 7, importo: 7, data: new Date().toISOString() } as unknown as PaymentRecord;
      expect(await uno.calls.creditRecharge(payment)).toMatchObject({ ok: true });
      expect(await uno.calls.creditRecharge(payment)).toMatchObject({ ok: true, duplica: true });
      expect(ledgerOf(dir, 'uno').balance('alice')).toBe(7);
      expect(await uno.calls.wallet('uno', 'alice', 'google')).toMatchObject({ id: 'alice', crediti: 7, commissione: 0 });
      // Written from another universe's token, the store refuses.
      const r = await fetch(`${base}/api/universe/due/commit`, { method: 'POST', headers: { 'Content-Type': 'application/json', [INTERNAL_HEADER]: worldToken(INTERNAL, 'uno') }, body: JSON.stringify({ changes: { 'modules/x/logic.lua': 'return {}' }, message: 'x', author: 'kernel' }) });
      expect(r.status).toBe(403);
    } finally {
      await uno.stop();
    }
  }, opening(1));

  it('V-007 ripartendo da un commit vissuto, il mondo ci torna con un commit che lo dice', async () => {
    const root = path.join(dir, 'due');
    const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=Prove', '-c', 'user.email=prove@rune.local', ...a], { cwd: root, windowsHide: true, encoding: 'utf8' }).trim();
    const good = git('rev-parse', 'HEAD');
    writeFileSync(path.join(root, 'modules', 'dopo.txt'), 'ciò che è venuto dopo');
    git('add', '-A');
    git('commit', '-q', '-m', 'dopo');
    const due = world('due');
    (due as unknown as { restore: string }).restore = good;
    try {
      expect(await due.start()).toEqual({ ok: true });
      expect(existsSync(path.join(root, 'modules', 'dopo.txt'))).toBe(false);
      // After it, the kernel's own update from the seed, if any.
      expect(git('log', '-3', '--format=%s')).toMatch(/ritorno|torna/i);
    } finally {
      await due.stop();
    }
  }, opening(1));

  it('V-007 il mondo non ha i segreti: né nell’ambiente né su disco, e non scrive dove non deve', async () => {
    // Beside the node_modules a world may read: where the real `.env` is.
    const secret = path.resolve(`.sonda-segreto-${process.pid}.env`);
    writeFileSync(secret, 'GEMINI_API_KEY=finta');
    process.env.GEMINI_API_KEY = 'chiave-finta';
    const uno = world('uno');
    try {
      await uno.start();
      const seen = new Promise<{ env: string[]; lettura: string; scrittura: string; argv: string[] }>((r) => childOf(uno).on('message', (m: never) => (m as { t: string }).t === 'sonda-visto' && r(m)));
      childOf(uno).send({ t: 'sonda-guarda', segreto: secret, scrivi: path.join(dir, 'uno', 'modules', 'scritto.txt') });
      const got = await seen;
      expect(got.env.join()).not.toMatch(/GEMINI|STRIPE|FIREBASE|QUINE/);
      expect(got.lettura).toBe('ERR_ACCESS_DENIED');
      expect(got.scrittura).toBe('ERR_ACCESS_DENIED');
      expect(got.argv.join(' ')).not.toContain(INTERNAL);
    } finally {
      delete process.env.GEMINI_API_KEY;
      rmSync(secret, { force: true });
      await uno.stop();
    }
  }, opening(1));
});
