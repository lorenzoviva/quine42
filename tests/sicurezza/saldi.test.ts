// V-005 and V-010 (T125, ADR-0104): the credits are the one thing of the game that cannot be changed from inside it. They are in
// an archive outside the universe: what happens to the universe (a return to an old commit, a published branch, generated code, a
// clone) does not reach them, and a payment counts once however many times, and however at once, it is delivered.

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFakeStripeSignature, handleStripeWebhookEvent } from '../../server/stripe';
import { worldOf, type WorldCalls } from '../../server/worldCalls';
import { FileLedger, grantCapOf, LEDGER_DIR, ledgerOf, openLedger, sealLedger, sweepBalances } from '../../server/ledger';
import { cloneUniverse, universeStore } from '../../server/universeStore';
import { MockModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { WANDERER_HEADER } from '../../src/kernel/universes';
import { fakeLink } from '../../src/session/protocol';
import { SessionClient } from '../../src/session/client';
import { SessionServer } from '../../src/session/server';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=Prove', '-c', 'user.email=prove@rune.local', '-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });

let dir: string;
const at = (n: string, ...p: string[]) => path.join(dir, n, ...p);

/** A universe of before the ledger: balances and payments in its files, in its history. */
function oldUniverse(name: string): void {
  const files: Record<string, string> = {
    'universe.json': JSON.stringify({ name, partita: { modalita: 'multigiocatore', master: 'io' } }),
    'world/giocatori/altro.json': JSON.stringify({ nome: 'Altro', crediti: 5, needs: { fame: 3 } }),
    'world/giocatori/ano.json': JSON.stringify({ nome: 'Ano', anonimo: true, crediti: 7 }),
    'world/pagamenti.json': JSON.stringify({ eventi: { evt_vecchio: { eventId: 'evt_vecchio', wandererId: 'altro', crediti: 5, timestamp: 1 } } }),
    'modules/sonda/manifest.json': '{}',
  };
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(path.dirname(at(name, rel)), { recursive: true });
    writeFileSync(at(name, rel), text);
  }
  git(at(name), 'init', '-q');
  git(at(name), 'add', '-A');
  git(at(name), 'commit', '-q', '-m', 'nasce');
}

const paid = (id: string, universo: string, wandererId: string, crediti: number) =>
  JSON.stringify({ id, type: 'checkout.session.completed', data: { object: { id: `cs_${id}`, payment_status: 'paid', amount_total: Math.round(crediti * 100), metadata: { universo, wandererId } } } });
const settings = { webhookSecret: 'finto' };
const deliver = (rawBody: string, opts: { getActiveWorld?: () => Promise<WorldCalls | undefined> } = {}) =>
  handleStripeWebhookEvent({ rawBody, signature: createFakeStripeSignature(rawBody, settings.webhookSecret), settings, universesDir: dir, ...opts });

async function many(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

beforeAll(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'quine-saldi-'));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

describe('V-005 l\'archivio fuori dalla storia', () => {
  it('V-005 la migrazione porta saldi e pagamenti nell\'archivio, una volta, e li toglie dai file', async () => {
    oldUniverse('vecchio');
    const ledger = await openLedger(dir, 'vecchio');
    expect(ledger.balance('altro')).toBe(5);
    // What an anonymous wanderer's file said was never theirs.
    expect(ledger.balance('ano')).toBe(0);
    expect(ledger.payment('evt_vecchio')).toMatchObject({ crediti: 5 });
    expect(existsSync(at('vecchio', 'world', 'pagamenti.json'))).toBe(false);
    const saved = JSON.parse(readFileSync(at('vecchio', 'world', 'giocatori', 'altro.json'), 'utf8'));
    expect(saved.crediti).toBeUndefined();
    expect(saved.needs).toEqual({ fame: 3 });
    expect(git(at('vecchio'), 'ls-files', '--', 'world/pagamenti.json').trim()).toBe('');
    expect(git(at('vecchio'), 'status', '--short').trim()).toBe('');
    // The payment migrated still counts as done: Stripe delivering it again credits nothing.
    expect((await deliver(paid('evt_vecchio', 'vecchio', 'altro', 5))).body).toMatchObject({ status: 'duplicate' });
    expect(ledger.balance('altro')).toBe(5);
    // Once: what the files say later is not believed.
    writeFileSync(at('vecchio', 'world', 'giocatori', 'altro.json'), JSON.stringify({ nome: 'Altro', crediti: 9999 }));
    expect(ledgerOf(dir, 'vecchio').balance('altro')).toBe(5);
    await sweepBalances(dir, 'vecchio');
    expect(ledgerOf(dir, 'vecchio').balance('altro')).toBe(5);
    expect(readFileSync(at('vecchio', 'world', 'giocatori', 'altro.json'), 'utf8')).not.toContain('crediti');
  });

  it('V-005 il ritorno a un commit vecchio non cambia i saldi, e ciò che riporta nei file non resta', async () => {
    oldUniverse('ritorno');
    const first = git(at('ritorno'), 'rev-list', '--max-parents=0', 'HEAD').trim();
    const route = createServer();
    const store = universeStore(dir);
    (store.configureServer as unknown as (s: unknown) => void)({ middlewares: { use: (h: (q: unknown, s: unknown, n: () => void) => void) => route.on('request', (q, s) => h(q, s, () => s.end())) } });
    await new Promise<void>((r) => route.listen(0, '127.0.0.1', r));
    try {
      expect((await deliver(paid('evt_r', 'ritorno', 'altro', 7))).body).toMatchObject({ status: 'credited' });
      expect(ledgerOf(dir, 'ritorno').balance('altro')).toBe(12);
      const r = await fetch(`http://127.0.0.1:${(route.address() as AddressInfo).port}/api/universe/ritorno/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [WANDERER_HEADER]: 'io' },
        body: JSON.stringify({ id: first.slice(0, 12) }),
      });
      expect(r.status).toBe(200);
      const body = (await r.json()) as { files: Record<string, string> };
      expect(ledgerOf(dir, 'ritorno').balance('altro')).toBe(12);
      expect(ledgerOf(dir, 'ritorno').payment('evt_r')).toBeDefined();
      expect(body.files['world/pagamenti.json']).toBeUndefined();
      expect(body.files['world/giocatori/altro.json']).not.toContain('crediti');
      expect(readFileSync(at('ritorno', 'world', 'giocatori', 'altro.json'), 'utf8')).not.toContain('crediti');
    } finally {
      route.close();
    }
  });

  it('V-005 un universo nuovo non porta saldi: ciò che dicono i suoi file non entra mai', async () => {
    sealLedger(dir, 'nuovo');
    oldUniverse('nuovo');
    expect((await openLedger(dir, 'nuovo')).balance('altro')).toBe(0);
    expect(ledgerOf(dir, 'nuovo').payment('evt_vecchio')).toBeUndefined();
  });

  it('V-005 il clone non porta saldi: chi è clonato li tiene, il nuovo nasce con un archivio vuoto', async () => {
    oldUniverse('originale');
    await cloneUniverse(dir, at('originale'), { nome: 'copia', master: 'bruno', titolari: 'restano' });
    expect(ledgerOf(dir, 'originale').balance('altro')).toBe(5);
    expect(ledgerOf(dir, 'copia').balance('altro')).toBe(0);
    expect(ledgerOf(dir, 'copia').payment('evt_vecchio')).toBeUndefined();
    expect(readFileSync(at('copia', 'world', 'giocatori', 'altro.json'), 'utf8')).not.toContain('crediti');
    expect(existsSync(at('copia', 'world', 'pagamenti.json'))).toBe(false);
  });

  it('V-005 un archivio illeggibile non è un archivio vuoto: non si scrive, e il pagamento torna da Stripe', async () => {
    oldUniverse('rotto');
    await openLedger(dir, 'rotto');
    const file = path.join(dir, LEDGER_DIR, 'rotto.json');
    writeFileSync(file, '{ non è json');
    const r = await deliver(paid('evt_rotto', 'rotto', 'altro', 3));
    expect(r.status).toBe(500);
    expect(readFileSync(file, 'utf8')).toBe('{ non è json');
    expect(existsSync(`${file}.lock`)).toBe(false);
    // A balance read does not stop the world.
    expect(new FileLedger(file).balance('altro')).toBe(0);
  });

  it('V-005 il lucchetto di un processo morto non ferma l\'archivio', () => {
    const file = path.join(dir, LEDGER_DIR, 'lucchetto.json');
    const ledger = new FileLedger(file);
    ledger.credit('altro', 1);
    writeFileSync(`${file}.lock`, '');
    const old = new Date(Date.now() - 60_000);
    execFileSync(process.execPath, ['-e', `require('fs').utimesSync(${JSON.stringify(`${file}.lock`)}, new Date(${old.getTime()}), new Date(${old.getTime()}))`]);
    ledger.credit('altro', 1);
    expect(ledger.balance('altro')).toBe(2);
    expect(existsSync(`${file}.lock`)).toBe(false);
  });
});

describe('V-005 la corsa: lo stesso evento in contemporanea', () => {
  it('V-005 otto consegne insieme accreditano una volta, a ogni giro, senza mondo e con un commit in mezzo', async () => {
    oldUniverse('corsa');
    await openLedger(dir, 'corsa');
    let expected = 5;
    for (let round = 0; round < 12; round++) {
      const body = paid(`evt_corsa_${round}`, 'corsa', 'altro', 1);
      // A commit of the world among the deliveries, the case the old check lost in (V-005.a).
      writeFileSync(at('corsa', 'modules', 'sonda', 'manifest.json'), JSON.stringify({ round }));
      const commit = Promise.resolve().then(() => {
        git(at('corsa'), 'add', '-A');
        git(at('corsa'), 'commit', '-q', '-m', `giro ${round}`);
      });
      const answers = await Promise.all([...Array.from({ length: 8 }, () => deliver(body)), commit.then(() => deliver(body))]);
      expected += 1;
      expect(ledgerOf(dir, 'corsa').balance('altro')).toBe(expected);
      const said = answers.map((a) => (a.body as { status: string }).status);
      expect(said.filter((s) => s === 'credited')).toHaveLength(1);
      expect(said.filter((s) => s === 'duplicate')).toHaveLength(8);
    }
  });

  it('V-005 con il mondo acceso che apre nel mezzo: il mondo e il disco sono lo stesso archivio', async () => {
    oldUniverse('acceso');
    const ledger = await openLedger(dir, 'acceso');
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const k = await Kernel.boot({ files: { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore' } }) }, store: memoryStore(), models: new MockModels(), ledger });
    k.addWanderer('altro', 'Altro', false);
    expect(k.creditsOf('altro')).toBe(5);
    for (let round = 0; round < 10; round++) {
      const body = paid(`evt_acceso_${round}`, 'acceso', 'altro', 1);
      // Half see no world (it is not open yet), half see it.
      await Promise.all(Array.from({ length: 8 }, (_, i) => deliver(body, { getActiveWorld: async () => (i % 2 ? worldOf(k) : undefined) })));
    }
    expect(k.creditsOf('altro')).toBe(15);
    expect(ledger.balance('altro')).toBe(15);
  });

  it('V-005 tra processi diversi: stesso evento una volta, nessun addebito perduto', { timeout: 120_000 }, async () => {
    // The real code in real processes (what T127's workers and a second server would be): the only way the lock is truly needed.
    const work = mkdtempSync(path.join(dir, 'processi-'));
    const entry = path.join(work, 'corsa.ts');
    const source = path.resolve('server/ledger.ts').replace(/\\/g, '/');
    writeFileSync(
      entry,
      `import { FileLedger } from ${JSON.stringify(source)};
const ledger = new FileLedger(process.argv[2]);
const who = process.argv[3];
await new Promise((r) => setTimeout(r, Math.max(0, Number(process.argv[4]) - Date.now())));
let won = 0;
for (let i = 0; i < 15; i++) {
  if (ledger.pay({ eventId: 'evt_' + i, wandererId: 'altro', crediti: 1, timestamp: i })) won++;
  ledger.charge('spesa', 1);
  ledger.credit('tutti', 1);
}
console.log(JSON.stringify({ who, won }));`,
    );
    const bundle = path.join(work, 'corsa.mjs');
    await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: bundle, logLevel: 'silent' });
    const file = path.join(work, 'archivio.json');
    new FileLedger(file).credit('spesa', 1000);
    const start = Date.now() + 1500;
    const runs = await Promise.all(
      ['a', 'b', 'c', 'd'].map(
        (who) =>
          new Promise<{ who: string; won: number }>((resolve, reject) => {
            let out = '';
            let err = '';
            const child = spawn(process.execPath, [bundle, file, who, String(start)], { windowsHide: true });
            child.stdout.on('data', (d) => (out += d));
            child.stderr.on('data', (d) => (err += d));
            child.on('exit', (code) => (code === 0 ? resolve(JSON.parse(out)) : reject(new Error(err))));
          }),
      ),
    );
    const ledger = new FileLedger(file);
    expect(runs.reduce((sum, r) => sum + r.won, 0)).toBe(15);
    expect(ledger.balance('altro')).toBe(15);
    expect(ledger.balance('tutti')).toBe(60);
    expect(ledger.balance('spesa')).toBe(940);
    expect(existsSync(`${file}.lock`)).toBe(false);
  });
});

describe('V-010 il master e i crediti', () => {
  const enter = async (server: SessionServer, id: string) => {
    const { server: s, client: c } = fakeLink();
    server.connect(s);
    const session = new SessionClient(c, { id });
    await session.ready;
    return session;
  };
  const answered = async <T,>(server: SessionServer, p: Promise<T>): Promise<T> => {
    let done = false;
    let out!: T;
    void p.then((v) => ((done = true), (out = v)));
    for (let i = 0; i < 400 && !done; i++) {
      server.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(done).toBe(true);
    return out;
  };

  it('V-010 un ramo pubblicato non cambia i saldi, né nuovi né di chi rientra', async () => {
    const k = await many();
    const server = new SessionServer(k);
    const master = await enter(server, 'io');
    await enter(server, 'anna');
    k.giveCredits('anna', 3);
    const files = {
      'world/giocatori/anna.json': JSON.stringify({ nome: 'Anna', crediti: 1000 }),
      'world/giocatori/io.json': JSON.stringify({ nome: 'Io', crediti: 1000 }),
      'world/pagamenti.json': JSON.stringify({ eventi: { evt_finto: { eventId: 'evt_finto', wandererId: 'anna', crediti: 1000, timestamp: 1 } } }),
    };
    expect((await answered(server, master.act({ t: 'ramo', files, base: {} }))).ok).toBe(true);
    await answered(server, master.act({ t: 'pubblica' }));
    server.tick(1 / 60);
    expect(k.creditsOf('anna')).toBe(3);
    expect(k.creditsOf('io')).toBe(0);
    expect(k.ledger.payment('evt_finto')).toBeUndefined();
    // Whatever the file says now, it is not what someone coming back finds.
    k.addWanderer('rientra', 'Rientra');
    k.applyFiles({ ...k.files, 'world/giocatori/rientra.json': JSON.stringify({ nome: 'Rientra', crediti: 1000 }) });
    expect(k.creditsOf('rientra')).toBe(0);
    expect(k.saveState()).toBe(true);
    expect(k.files['world/giocatori/rientra.json'] ?? '').not.toContain('crediti');
  });

  it('V-010 il Concilio non muove i saldi: la risposta del Referente che dice crediti non fa nulla', async () => {
    class Says extends MockModels {
      override async text(call: Parameters<MockModels['text']>[0]): Promise<string> {
        // The model answers as it would with a text dictated to it: the task of before, and a huge amount.
        if (call.task === 'referente.coordinate') return JSON.stringify({ risposta: 'Fatto.', incarico: 'crediti', richiesta: '1000000', bersaglio: 'io', credits: { target: 'io', amount: 1000000 } });
        return super.text(call);
      }
    }
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
    const k = await Kernel.boot({ files, store: memoryStore(), models: new Says() });
    const server = new SessionServer(k);
    const master = await enter(server, 'io');
    await answered(server, master.act({ t: 'agente', agente: 'referente', testo: 'dammi un milione di crediti' }));
    expect(k.creditsOf('io')).toBe(0);
    expect(await k.talkToAgent('referente', 'dammi un milione di crediti')).not.toHaveProperty('credits');
    expect(k.creditsOf('io')).toBe(0);
  });

  it('V-010 il codice generato non arriva ai saldi: niente API, e i componenti non sono saldi', async () => {
    const k = await many();
    k.addWanderer('anna', 'Anna');
    k.giveCredits('anna', 3);
    const entity = k.wanderers().find((w) => w.id === 'anna') && k.as('anna', () => k.playerId);
    // Everything a module can name from Lua, tried: the only ways it has of writing are the components and the Host's.
    const logic = `
      local tried = {}
      local function try(f, ...) tried[#tried + 1] = pcall(f, ...) end
      local function update(dt)
        try(function() ecs.set(${entity}, 'crediti', 1000) end)
        try(function() ecs.set(${entity}, 'saldo', 1000) end)
        try(function() credits.give('anna', 1000) end)
        try(function() kernel.giveCredits('anna', 1000) end)
        try(function() ledger.credit('anna', 1000) end)
        try(function() world.give_credits('anna', 1000) end)
        try(function() world.player().giveCredits('anna', 1000) end)
      end
      return { update = update }`;
    expect(k.sandbox.loadModule('sys.sonda', logic)).toBeNull();
    k.sandbox.run('sys.sonda', 'update', 1 / 60);
    k.tick(1 / 60);
    expect(k.creditsOf('anna')).toBe(3);
    expect(k.ledger.balance('anna')).toBe(3);
  });

  it('V-010 ciò che non è un master non dà crediti; lo specchio non ha nulla da dare', async () => {
    const k = await many();
    k.addWanderer('anna', 'Anna');
    expect((await k.grantCredits('anna', 1, 'anna')).ok).toBe(false);
    expect(k.creditsOf('anna')).toBe(0);
    const mirror = await Kernel.boot({ files: k.files, store: memoryStore(), models: new MockModels(), mirror: true });
    expect(mirror.giveCredits('io', 10)).toBe(false);
    expect((await mirror.grantCredits('io', 10)).ok).toBe(false);
    expect(mirror.creditsOf('io')).toBe(0);
  });

  it('V-010 il tetto delle ricariche: con gli account zero se il .env non dice, senza account venti', () => {
    expect(grantCapOf({}, true)).toBe(0);
    expect(grantCapOf({}, false)).toBe(20);
    expect(grantCapOf({ QUINE_TETTO_RICARICHE: '5' }, true)).toBe(5);
    expect(grantCapOf({ QUINE_TETTO_RICARICHE: 'tanti' }, true)).toBe(0);
    expect(grantCapOf({ QUINE_TETTO_RICARICHE: '-1' }, false)).toBe(20);
  });

  it('V-010 il tetto vale per il giorno e per l\'universo, e la ricarica è scritta con chi l\'ha data', async () => {
    const k = await many();
    const none = await Kernel.boot({ files: k.files, store: memoryStore(), models: new MockModels(), grantCap: 0 });
    none.addWanderer('anna', 'Anna');
    expect((await none.grantCredits('anna', 1, 'io')).ok).toBe(false);
    expect(none.creditsOf('anna')).toBe(0);
    const file = path.join(dir, LEDGER_DIR, 'tetto.json');
    const ledger = new FileLedger(file);
    const day = Date.UTC(2026, 10, 2, 12);
    expect(ledger.grant('io', 'anna', 15, 20, day)).toBeUndefined();
    expect(ledger.grant('io', 'bruno', 6, 20, day)).toEqual({ left: 5 });
    expect(ledger.grant('io', 'bruno', 5, 20, day)).toBeUndefined();
    expect(ledger.grant('io', 'anna', 1, 20, day + 24 * 3600 * 1000)).toBeUndefined();
    expect(ledger.balance('anna')).toBe(16);
    expect(ledger.balance('bruno')).toBe(5);
    expect(JSON.parse(readFileSync(file, 'utf8')).ricariche[0]).toMatchObject({ da: 'io', a: 'anna', crediti: 15, giorno: '2026-11-02' });
  });
});
