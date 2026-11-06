// V-030, V-031, V-032 (T293, ADR-0161): the handmade cards. A program a player wrote ends up in other people's browsers and worlds: it
// passes only within caps measured on the real engine, and checking it stops neither the server nor anyone else (V-030). The archive of the
// cards is outside every universe: only the author writes their own, within caps, with the switch on (V-031). A name and a signature are
// texts of a player, for a page and maybe a world (V-032).

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AccountSettings } from '../../server/account';
import { HANDMADE_DIR, handmadeHandler, HANDMADE_ROUTE, type HandmadeRouteOptions } from '../../server/handmade';
import { CHECK_MEMORY_MB, inlineChecker, processChecker } from '../../server/programCheck';
import { handmadeProgramErrors, HANDMADE_CONTRACT, HANDMADE_LIMITS } from '../../src/kernel/handmade';
import { allowedPath, UNIVERSE_NAME_RE } from '../../src/kernel/paths';
import { accountWanderer } from '../../src/session/account';

const FAKE = path.resolve('tests/sicurezza/fixtures/verifica-finta.mjs');
const SMALL = readFileSync('universe/models/object.xml', 'utf8');
const ENDLESS = '<markov values="BW" size="4 4 4"><one><rule in="B" out="W"/></one><one><rule in="W" out="B"/></one></markov>';
const ALICE = accountWanderer('uid-alice');
const BRUNO = accountWanderer('uid-bruno');

const accounts: AccountSettings = {
  config: { projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' },
  verify: async (t) => (t.startsWith('vero-') ? { uid: t.slice(5), anonimo: false } : t.startsWith('anon-') ? { uid: t.slice(5), anonimo: true } : undefined),
};

interface Answer {
  status: number;
  body: any;
}

async function serve(o: Partial<HandmadeRouteOptions> & { universesDir: string }) {
  const handler = handmadeHandler({ labs: () => true, checker: inlineChecker(), ...o });
  const server = http.createServer((req, res) =>
    handler(req as never, res, () => {
      res.statusCode = 404;
      res.end('{}');
    }),
  );
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  const ask = (method: string, target: string, opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
    new Promise<Answer>((resolve, reject) => {
      const r = http.request(
        {
          host: '127.0.0.1',
          port,
          path: target,
          method,
          headers: { Host: `127.0.0.1:${port}`, ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}), ...opts.headers },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            resolve({ status: res.statusCode ?? 0, body: text ? JSON.parse(text) : undefined });
          });
        },
      );
      r.on('error', reject);
      r.end(opts.body === undefined ? undefined : typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    });
  return { ask, close: () => new Promise<void>((r) => server.close(() => r())) };
}

const card = (more: Record<string, unknown> = {}) => ({ kernel: HANDMADE_CONTRACT, kind: 'model', name: 'Fagotto', class: 'object', xml: SMALL, ...more });

let work: string;
beforeAll(() => {
  work = mkdtempSync(path.join(os.tmpdir(), 'quine-carte-mano-sic-'));
});
afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});
let made = 0;
const universes = () => path.join(work, `u${++made}`);

describe('V-030 il programma di una carta', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('V-030 un programma che non finisce, una griglia enorme, troppe azioni: tornano indietro sul motore vero', () => {
    expect(handmadeProgramErrors({ kind: 'model', xml: ENDLESS, class: 'object' }).join()).toMatch(/non finisce/);
    expect(handmadeProgramErrors({ kind: 'model', xml: '<sequence values="BW" size="250 250 250"><box at="0 0 0" size="5 5 5" color="W"/></sequence>', class: 'object' }).join()).toMatch(/griglia troppo grande/);
    const action = (i: number) => `<action name="a${i}"><all><rule in="C" out="C"/></all></action>`;
    expect(handmadeProgramErrors({ kind: 'model', xml: SMALL + Array.from({ length: 40 }, (_, i) => action(i)).join(''), class: 'object' }).join()).toMatch(/troppe azioni/);
    expect(handmadeProgramErrors({ kind: 'model', xml: 'x'.repeat(HANDMADE_LIMITS.xmlChars + 1), class: 'object' }).join()).toMatch(/troppo lungo/);
  });

  it('V-030 un XML ostile torna indietro presto e non ferma niente', () => {
    const cap = HANDMADE_LIMITS.xmlChars;
    const hostile = [
      // Comments that never close, and tags that never end: the reader goes once through the text.
      '<!--'.repeat(cap / 4 - 1),
      '<a'.repeat(cap / 2 - 1),
      `<sequence values="BW" size="4 4 4">${'<x a="1"'.repeat(cap / 9)}`,
      // Nested as deep as the text allows.
      `<sequence values="BW" size="4 4 4">${'<sequence>'.repeat(5000)}${'</sequence>'.repeat(5000)}</sequence>`,
      // Entities are only the five of XML: nothing is expanded.
      '<!DOCTYPE x [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;">]><sequence values="BW" size="4 4 4" name="&b;&b;&b;"><box at="0 0 0" size="2 2 2" color="W"/></sequence>',
      // What a program cannot ask for: rules from files.
      '<sequence values="BW" size="4 4 4"><one><rule file="/etc/passwd"/></one></sequence>',
      '<script>alert(1)</script>',
    ];
    for (const xml of hostile) {
      expect(xml.length).toBeLessThanOrEqual(cap);
      const t = Date.now();
      const errors = handmadeProgramErrors({ kind: 'model', xml, class: 'object' });
      expect(Date.now() - t, xml.slice(0, 40)).toBeLessThan(3000);
      expect(errors.length, xml.slice(0, 40)).toBeGreaterThan(0);
    }
  });

  it('V-030 un controllo che non risponde è ucciso nel suo tempo', async () => {
    const checker = processChecker({ program: async () => FAKE, args: ['muto'], killMs: 600 });
    const t = Date.now();
    expect(await checker.check({ kind: 'model', xml: SMALL, class: 'object' })).toEqual({ errors: ['il controllo non finisce in 0.6 s: il programma è troppo lento per una carta'] });
    expect(Date.now() - t).toBeLessThan(5000);
    // A reply that is not to its question does not count.
    expect(await processChecker({ program: async () => FAKE, args: ['altro'], killMs: 600 }).check({ kind: 'model', xml: SMALL, class: 'object' })).toHaveProperty('errors', [expect.stringMatching(/non finisce/)]);
  });

  it('V-030 un controllo che muore, anche di memoria, torna indietro e il server resta', async () => {
    for (const [mode, memoryMb] of [['muore', CHECK_MEMORY_MB], ['memoria', 64]] as const) {
      const r = await processChecker({ program: async () => FAKE, args: [mode], memoryMb, killMs: 20000 }).check({ kind: 'model', xml: SMALL, class: 'object' });
      expect(r, mode).toEqual({ errors: ['il controllo si è fermato: il programma chiede più di quanto una carta può avere'] });
    }
  }, 60000);

  it('V-030 uno alla volta, una coda corta, poi «occupato»', async () => {
    const checker = processChecker({ program: async () => FAKE, args: ['lento'], queue: 1 });
    const q = { kind: 'model' as const, xml: SMALL, class: 'object' };
    const all = await Promise.all([checker.check(q), checker.check(q), checker.check(q)]);
    expect(all).toEqual([{ errors: [] }, { errors: [] }, { busy: true }]);
    checker.stop();
    expect(await checker.check(q)).toEqual({ busy: true });
  }, 30000);

  it('V-030 il processo del controllo non ha segreti: ambiente vuoto, memoria limitata, solo la sua cartella', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'FINTA-chiave-t293');
    vi.stubEnv('STRIPE_SECRET_KEY', 'FINTA-stripe-t293');
    const r = await processChecker({ program: async () => FAKE, args: ['ambiente'] }).check({ kind: 'model', xml: SMALL, class: 'object' });
    expect('errors' in r).toBe(true);
    const lines = (r as { errors: string[] }).errors;
    expect(lines.join(' ')).not.toContain('FINTA');
    const keys = lines.find((l) => l.startsWith('env:'))!.slice(4).split(',').filter(Boolean);
    // What Windows gives every process (libuv adds PATH, the home, the user) is not ours; nothing of this server's is there.
    expect(keys).toContain('NODE_ENV');
    expect(keys.filter((k) => /GEMINI|STRIPE|FIREBASE|QUINE|TYPESAFE|API_KEY|SECRET|TOKEN/i.test(k))).toEqual([]);
    const execArgv = lines.filter((l) => l.startsWith('arg:')).map((l) => l.slice(4));
    expect(execArgv).toContain(`--max-old-space-size=${CHECK_MEMORY_MB}`);
    if (process.allowedNodeEnvironmentFlags.has('--permission')) {
      expect(execArgv).toContain('--permission');
      expect(execArgv.filter((f) => f.startsWith('--allow-fs-write') || f.startsWith('--allow-child-process') || f.startsWith('--allow-worker'))).toEqual([]);
    }
  });

  it('V-030 ciò che il processo dice torna tagliato, e solo testo', async () => {
    const r = (await processChecker({ program: async () => FAKE, args: ['ostile'] }).check({ kind: 'model', xml: SMALL, class: 'object' })) as { errors: string[] };
    expect(r.errors.length).toBe(20);
    for (const e of r.errors) {
      expect(typeof e).toBe('string');
      expect(e.length).toBeLessThanOrEqual(500);
    }
  });

  it('V-030 il server non salva un programma che non passa, e lo dice', async () => {
    const s = await serve({ universesDir: universes(), accounts });
    try {
      const r = await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card({ xml: ENDLESS }) });
      expect(r.status).toBe(422);
      expect(r.body.errors.join()).toMatch(/non finisce/);
      expect((await s.ask('GET', `${HANDMADE_ROUTE}?mine=1`, { token: 'vero-uid-alice' })).body.cards).toEqual([]);
      // A checker with too many waiting: «busy», nothing written.
      const full = await serve({ universesDir: universes(), accounts, checker: { check: async () => ({ busy: true }), stop: () => undefined } });
      try {
        expect((await full.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card() })).status).toBe(503);
      } finally {
        await full.close();
      }
    } finally {
      await s.close();
    }
  });
});

describe('V-031 l’archivio delle carte', () => {
  it('V-031 con l’interruttore spento ogni rotta rifiuta chiunque e non scrive nulla', async () => {
    const dir = universes();
    const s = await serve({ universesDir: dir, accounts, labs: () => false });
    try {
      for (const token of [undefined, 'vero-uid-alice', 'anon-uid-alice', 'falso']) {
        for (const [method, target, body] of [
          ['GET', HANDMADE_ROUTE, undefined],
          ['GET', `${HANDMADE_ROUTE}?mine=1`, undefined],
          ['GET', `${HANDMADE_ROUTE}/handmade-aaaaaaaaaa`, undefined],
          ['POST', HANDMADE_ROUTE, card()],
          ['POST', `${HANDMADE_ROUTE}/handmade-aaaaaaaaaa`, { name: 'x' }],
          ['POST', `${HANDMADE_ROUTE}/signature`, { signature: 'x' }],
          ['DELETE', `${HANDMADE_ROUTE}/handmade-aaaaaaaaaa`, undefined],
        ] as const) {
          const r = await s.ask(method, target, { token, body });
          expect(r.status, `${method} ${target} ${token}`).toBe(403);
          expect(r.body.reason).toBe('i laboratori non sono aperti');
        }
      }
      expect(existsSync(path.join(dir, HANDMADE_DIR))).toBe(false);
    } finally {
      await s.close();
    }
  });

  it('V-031 senza account niente; un token falso niente; un anonimo legge e non scrive', async () => {
    const dir = universes();
    const s = await serve({ universesDir: dir, accounts });
    try {
      expect((await s.ask('GET', HANDMADE_ROUTE)).status).toBe(401);
      expect((await s.ask('POST', HANDMADE_ROUTE, { body: card() })).status).toBe(401);
      expect((await s.ask('POST', HANDMADE_ROUTE, { body: card(), headers: { 'X-Quine-Viandante': ALICE } })).status).toBe(401);
      expect((await s.ask('GET', HANDMADE_ROUTE, { token: 'falso' })).status).toBe(401);
      expect((await s.ask('POST', HANDMADE_ROUTE, { token: 'falso', body: card() })).status).toBe(401);
      expect((await s.ask('GET', HANDMADE_ROUTE, { token: 'anon-uid-chi' })).status).toBe(200);
      const anonymous = await s.ask('POST', HANDMADE_ROUTE, { token: 'anon-uid-chi', body: card() });
      expect(anonymous.status).toBe(403);
      expect((await s.ask('POST', `${HANDMADE_ROUTE}/signature`, { token: 'anon-uid-chi', body: { signature: 'Chi' } })).status).toBe(403);
      expect(existsSync(path.join(dir, HANDMADE_DIR))).toBe(false);
    } finally {
      await s.close();
    }
  });

  it('V-031 un’altra origine non arriva, nemmeno col token giusto; senza account solo questa macchina', async () => {
    const s = await serve({ universesDir: universes(), accounts });
    try {
      for (const origin of ['https://altro.example', 'null']) expect((await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card(), headers: { Origin: origin } })).status, origin).toBe(403);
      // A form of another site cannot send JSON without asking first.
      expect((await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: JSON.stringify(card()), headers: { 'Content-Type': 'text/plain' } })).status).toBe(415);
    } finally {
      await s.close();
    }
    const local = await serve({ universesDir: universes() });
    try {
      expect((await local.ask('GET', HANDMADE_ROUTE, { headers: { Host: 'gioco.example' } })).status).toBe(403);
      expect((await local.ask('GET', HANDMADE_ROUTE, { headers: { 'X-Forwarded-For': '203.0.113.9' } })).status).toBe(403);
    } finally {
      await local.close();
    }
  });

  it('V-031 solo l’autore scrive le sue carte: chi scrive lo dice il token, mai il corpo', async () => {
    const dir = universes();
    const s = await serve({ universesDir: dir, accounts });
    try {
      const made = await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card({ author: BRUNO, id: 'handmade-aaaaaaaaaa', made: '2000-01-01' }) });
      expect(made.status).toBe(201);
      const id = made.body.card.id;
      expect(id).not.toBe('handmade-aaaaaaaaaa');
      const file = path.join(dir, HANDMADE_DIR, `${ALICE}.json`);
      const before = readFileSync(file, 'utf8');
      expect(JSON.parse(before).cards[0].author).toBe(ALICE);
      for (const [method, target, body] of [
        ['POST', `${HANDMADE_ROUTE}/${id}`, { name: 'Di Bruno' }],
        ['POST', `${HANDMADE_ROUTE}/${id}`, { kernel: HANDMADE_CONTRACT, xml: SMALL.replace('Cosa', 'Bruno') }],
        ['DELETE', `${HANDMADE_ROUTE}/${id}`, undefined],
      ] as const) {
        const r = await s.ask(method, target, { token: 'vero-uid-bruno', body });
        expect(r.status, `${method} ${JSON.stringify(body)}`).toBe(404);
      }
      expect(readFileSync(file, 'utf8')).toBe(before);
      expect(readdirSync(path.join(dir, HANDMADE_DIR))).toEqual([`${ALICE}.json`]);
      // Bruno sees it, as everyone with an account.
      const seen = await s.ask('GET', `${HANDMADE_ROUTE}/${id}`, { token: 'vero-uid-bruno' });
      expect(seen.body.card).toMatchObject({ id, mine: false });
    } finally {
      await s.close();
    }
  });

  it('V-031 ciò che esce agli altri è a elenco: mai l’id dell’autore, né la catena, né le impronte', async () => {
    const dir = universes();
    const root = path.join(dir, 'prova');
    mkdirSync(path.join(root, '.git'), { recursive: true });
    mkdirSync(path.join(root, 'models'), { recursive: true });
    writeFileSync(path.join(root, 'universe.json'), '{"name":"prova"}');
    writeFileSync(path.join(root, 'models', 'object.xml'), SMALL);
    writeFileSync(path.join(root, 'models', 'index.json'), JSON.stringify({ object: { class: 'object', card: { author: 'a', payer: 'b', holder: 'uid-carla', origins: [] } } }));
    const s = await serve({ universesDir: dir, accounts });
    try {
      const made = await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card({ from: { universe: 'prova', model: 'object' } }) });
      expect(made.status).toBe(201);
      for (const token of ['vero-uid-bruno', 'anon-uid-chi']) {
        for (const target of [HANDMADE_ROUTE, `${HANDMADE_ROUTE}/${made.body.card.id}`]) {
          const text = JSON.stringify((await s.ask('GET', target, { token })).body);
          expect(text, target).not.toContain(ALICE);
          expect(text, target).not.toContain('uid-carla');
          expect(text, target).not.toContain('fingerprint');
          expect(text, target).not.toContain('origins');
        }
      }
    } finally {
      await s.close();
    }
  });

  it('V-031 i tetti per account: numero di carte e byte; e un ritmo', async () => {
    const s = await serve({ universesDir: universes(), accounts, caps: { cards: 2, bytes: 1024 * 1024 } });
    try {
      for (let i = 0; i < 2; i++) expect((await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card() })).status).toBe(201);
      const third = await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card() });
      expect([third.status, third.body.reason]).toEqual([413, 'hai già 2 carte: al più 2 per account']);
    } finally {
      await s.close();
    }
    const small = await serve({ universesDir: universes(), accounts, caps: { cards: 50, bytes: 2000 } });
    try {
      const big = await small.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card({ xml: `<!-- ${'x'.repeat(3000)} -->\n${SMALL}` }) });
      expect(big.status).toBe(413);
      expect(big.body.reason).toMatch(/supererebbero/);
    } finally {
      await small.close();
    }
    const paced = await serve({ universesDir: universes(), accounts, writes: { burst: 2, perSecond: 0.001 } });
    try {
      const said = [];
      for (let i = 0; i < 3; i++) said.push((await paced.ask('POST', `${HANDMADE_ROUTE}/signature`, { token: 'vero-uid-alice', body: { signature: `Alice ${i}` } })).status);
      expect(said).toEqual([200, 200, 429]);
      // Another account has its own.
      expect((await paced.ask('POST', `${HANDMADE_ROUTE}/signature`, { token: 'vero-uid-bruno', body: { signature: 'Bruno' } })).status).toBe(200);
    } finally {
      await paced.close();
    }
  });

  it('V-031 un programma di un altro contratto non entra; senza contratto nemmeno', async () => {
    const s = await serve({ universesDir: universes(), accounts });
    try {
      const other = await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card({ kernel: '0.3' }) });
      expect(other.status).toBe(409);
      expect(other.body.reason).toContain(`questo server è del ${HANDMADE_CONTRACT}`);
      expect((await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card({ kernel: undefined }) })).status).toBe(400);
      const ok = await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card() });
      expect((await s.ask('POST', `${HANDMADE_ROUTE}/${ok.body.card.id}`, { token: 'vero-uid-alice', body: { kernel: '9.9', xml: SMALL } })).status).toBe(409);
    } finally {
      await s.close();
    }
  });

  it('V-031 un archivio illeggibile non si riscrive: le sue carte non si perdono', async () => {
    const dir = universes();
    mkdirSync(path.join(dir, HANDMADE_DIR), { recursive: true });
    const file = path.join(dir, HANDMADE_DIR, `${ALICE}.json`);
    writeFileSync(file, '{"cards": [ rotto');
    const s = await serve({ universesDir: dir, accounts });
    try {
      expect((await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card() })).status).toBe(503);
      expect(readFileSync(file, 'utf8')).toBe('{"cards": [ rotto');
      // The others' list goes on without it.
      expect((await s.ask('GET', HANDMADE_ROUTE, { token: 'vero-uid-bruno' })).status).toBe(200);
    } finally {
      await s.close();
    }
  });

  it('V-031 una carta che questo kernel non sa leggere resta nel file com’è, non esce a nessuno e conta nei tetti', async () => {
    const dir = universes();
    mkdirSync(path.join(dir, HANDMADE_DIR), { recursive: true });
    const file = path.join(dir, HANDMADE_DIR, `${ALICE}.json`);
    const tomorrow = { id: 'handmade-domani0001', kind: 'model', name: 'Nave', class: 'vehicle', xml: SMALL, kernel: '0.9', author: ALICE, made: '2027-01-01T00:00:00.000Z', changed: '2027-01-01T00:00:00.000Z' };
    const forged = { ...tomorrow, id: 'handmade-altrui0001', class: 'object', kernel: HANDMADE_CONTRACT, author: BRUNO };
    writeFileSync(file, JSON.stringify({ cards: [tomorrow, forged] }));
    const s = await serve({ universesDir: dir, accounts, caps: { cards: 3, bytes: 1024 * 1024 } });
    try {
      expect((await s.ask('GET', HANDMADE_ROUTE, { token: 'vero-uid-bruno' })).body.cards).toEqual([]);
      for (const id of [tomorrow.id, forged.id]) expect((await s.ask('GET', `${HANDMADE_ROUTE}/${id}`, { token: 'vero-uid-bruno' })).status, id).toBe(404);
      // Not even Alice's own route writes it: it is not one of the cards it reads.
      expect((await s.ask('DELETE', `${HANDMADE_ROUTE}/${forged.id}`, { token: 'vero-uid-alice' })).status).toBe(404);
      expect((await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card() })).status).toBe(201);
      const kept = JSON.parse(readFileSync(file, 'utf8')).cards;
      expect(kept).toEqual(expect.arrayContaining([tomorrow, forged]));
      const mine = (await s.ask('GET', `${HANDMADE_ROUTE}?mine=1`, { token: 'vero-uid-alice' })).body;
      expect([mine.cards.length, mine.used.cards]).toEqual([1, 3]);
      expect((await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card() })).status).toBe(413);
    } finally {
      await s.close();
    }
  });

  it('V-031 nessun universo arriva all’archivio: non è un nome di universo né un percorso di un universo', () => {
    expect(UNIVERSE_NAME_RE.test(HANDMADE_DIR)).toBe(false);
    for (const p of [`../${HANDMADE_DIR}/${ALICE}.json`, `${HANDMADE_DIR}/${ALICE}.json`, `world/../../${HANDMADE_DIR}/x.json`]) expect(allowedPath(p), p).toBe(false);
  });
});

describe('V-032 il nome e la firma', () => {
  it('V-032 un nome o una firma con markup, caratteri di controllo o invisibili non entrano', async () => {
    const dir = universes();
    const s = await serve({ universesDir: dir, accounts });
    try {
      for (const name of ['<img src=x onerror=alert(1)>', 'Torre‮enoz', 'a\u0000b', 'zero​spazio', '   ', 'x'.repeat(61)]) {
        const r = await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card({ name }) });
        expect(r.status, JSON.stringify(name)).toBe(400);
        expect(r.body.reason, JSON.stringify(name)).toMatch(/^il nome/);
      }
      for (const signature of ['<script>alert(1)</script>', 'Ali‮ce', 'x'.repeat(41), 42]) {
        expect((await s.ask('POST', `${HANDMADE_ROUTE}/signature`, { token: 'vero-uid-alice', body: { signature } })).status, JSON.stringify(signature)).toBe(400);
      }
      expect(existsSync(path.join(dir, HANDMADE_DIR))).toBe(false);
    } finally {
      await s.close();
    }
  });

  it('V-032 un nome che nel mondo romperebbe la quarta parete non entra', async () => {
    const s = await serve({ universesDir: universes(), accounts });
    try {
      for (const name of ['La simulazione', 'Il computer del mago', 'Glitch']) {
        const r = await s.ask('POST', HANDMADE_ROUTE, { token: 'vero-uid-alice', body: card({ name }) });
        expect(r.status, name).toBe(400);
        expect(r.body.reason, name).toMatch(/nel mondo non si dice/);
      }
    } finally {
      await s.close();
    }
  });
});
