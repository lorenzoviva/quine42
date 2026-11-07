// V-033 (T295, ADR-0169): the cards a master brings into a universe before it starts. They come from universes of other masters and from
// the archive of other players: only the master of the universe brings them (never a player, an anonymous account or the world), what a
// card is the server reads from the disk (the client names only where), a hostile card does not come (a program that does not end, a
// name with markup, a stamp or a chain that does not read, fields the game would run with), and no balance moves (rule 8d).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AccountSettings } from '../../server/account';
import { worldToken } from '../../server/access';
import { inlineChecker } from '../../server/programCheck';
import { universeHandler } from '../../server/universeStore';
import { KERNEL_VERSION } from '../../src/kernel/version';
import { accountWanderer } from '../../src/session/account';

const seed = (id: string) => readFileSync(`universe/models/${id}.xml`, 'utf8');
const ENDLESS = '<markov values="BW" size="4 4 4"><one><rule in="B" out="W"/></one><one><rule in="W" out="B"/></one></markov>';
const BOMB = '<!DOCTYPE x [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;">]><sequence values="BC" size="4 4 4"><box at="1 1 0" size="2 2 2" color="C"/></sequence>';
const ALICE = accountWanderer('uid-alice');
const SECRET = 'segreto-del-processo';
const accounts: AccountSettings = {
  config: { projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' },
  verify: async (t) => (t.startsWith('vero-') ? { uid: t.slice(5), anonymous: false } : t.startsWith('anon-') ? { uid: t.slice(5), anonymous: true } : undefined),
};
const stamp = { author: 'sculptor', payer: 'comune', holder: 'anna' };

interface Answer {
  status: number;
  body: any;
}

describe('le carte portate (V-033)', () => {
  let dir: string;
  let server: http.Server;
  let port = 0;
  const ask = (method: string, target: string, opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {}) =>
    new Promise<Answer>((resolve, reject) => {
      const r = http.request(
        { host: '127.0.0.1', port, path: target, method, headers: { Host: `127.0.0.1:${port}`, ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}), ...opts.headers } },
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
      r.end(opts.body === undefined ? undefined : JSON.stringify(opts.body));
    });
  const create = (name: string, token: string) =>
    ask('POST', `/api/universe/${name}/create`, { token, body: { files: { 'universe.json': JSON.stringify({ name, kernel: KERNEL_VERSION, game: { mode: 'multiplayer' } }) + '\n', 'models/index.json': '{}\n' }, message: 'nasce dal seme del kernel' } });
  const bring = (name: string, cards: unknown, token = 'vero-uid-alice') => ask('POST', `/api/universe/${name}/bring`, { token, body: { cards } });

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-v033-'));
    const handler = universeHandler(dir, { accounts, internal: SECRET, checker: inlineChecker(), quota: 99 });
    server = http.createServer((req, res) => handler(req as never, res, () => ((res.statusCode = 404), res.end('{}'))));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    port = (server.address() as AddressInfo).port;
    expect((await create('casa-alice', 'vero-uid-alice')).status).toBe(200);
    expect((await create('casa-carla', 'vero-uid-carla')).status).toBe(200);
    // Carla's universe, a kin of Alice's: what its master wrote in it, without the Council's checks (a commit of the store takes any program).
    const index = {
      barile: { class: 'furniture', name: 'Barile', card: stamp },
      ciclo: { class: 'object', name: 'Ciclo', card: stamp },
      bomba: { class: 'object', name: 'Bomba', card: stamp },
      marcato: { class: 'object', name: '<img src=x onerror=alert(1)>', card: stamp },
      'timbro-strano': { class: 'object', name: 'Timbro', card: { author: '<script>', payer: 'comune', holder: 'anna' } },
      'catena-strana': { class: 'object', name: 'Catena', card: { ...stamp, origins: [{ holder: 'x'.repeat(300), universe: 'primo', fingerprint: [1] }] } },
      gonfio: { class: 'object', name: 'Gonfio', card: stamp, time: 9_000_000, vpt: 1, advice: ['tutto'], problems: ['niente'], cellar: 99, seeds: 1000, tint: 'CC', score: 1e9 },
    };
    const changes = { 'models/index.json': JSON.stringify(index), 'models/barile.xml': seed('barile'), 'models/ciclo.xml': ENDLESS, 'models/bomba.xml': BOMB, 'models/marcato.xml': seed('object'), 'models/timbro-strano.xml': seed('object'), 'models/catena-strana.xml': seed('object'), 'models/gonfio.xml': seed('object') };
    expect((await ask('POST', '/api/universe/casa-carla/commit', { token: 'vero-uid-carla', body: { changes, message: 'la mano di Carla', author: 'player' } })).status).toBe(200);
  });
  afterAll(async () => {
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });

  it('V-033 solo il master porta carte nel suo universo: non chi gioca, non un anonimo, non chi non dice chi è, non il mondo', async () => {
    const card = [{ universe: 'casa-carla', model: 'barile' }];
    expect((await ask('GET', '/api/universe/casa-alice/kin', { token: 'vero-uid-bruno' })).status).toBe(403);
    expect((await bring('casa-alice', card, 'vero-uid-bruno')).status).toBe(403);
    expect((await bring('casa-alice', card, 'anon-uid-alice')).status).toBe(403);
    expect((await ask('POST', '/api/universe/casa-alice/bring', { body: { cards: card } })).status).toBe(403);
    expect((await bring('casa-alice', card, 'falso')).status).toBe(401);
    // The world's token is for its universe, and bringing is not a world's to do.
    const world = { 'x-quine-interno': worldToken(SECRET, 'casa-alice') };
    expect((await ask('GET', '/api/universe/casa-alice/kin', { headers: world })).status).toBe(403);
    expect((await ask('POST', '/api/universe/casa-alice/bring', { headers: world, body: { cards: card } })).status).toBe(403);
    expect(readdirSync(path.join(dir, 'casa-alice', 'models'))).toEqual(['index.json']);
  });

  it('V-033 una carta ostile di un altro universo non entra: il programma, l’XML, il nome, il timbro, la catena', async () => {
    const r = await bring('casa-alice', ['ciclo', 'bomba', 'marcato', 'timbro-strano', 'catena-strana'].map((model) => ({ universe: 'casa-carla', model })));
    expect(r.status).toBe(422);
    const why = Object.fromEntries(r.body.cards.map((c: { card: string; reason: string; errors?: string[] }) => [c.card, `${c.reason} ${c.errors?.join(' ') ?? ''}`]));
    expect(why['casa-carla/ciclo']).toMatch(/non passa il controllo.*non finisce/);
    // The reader does not expand entities: what is left of the bomb is a program that does not stand.
    expect(why['casa-carla/bomba']).toMatch(/non passa il controllo/);
    expect(why['casa-carla/marcato']).toMatch(/il nome/);
    expect(why['casa-carla/timbro-strano']).toMatch(/timbro/);
    expect(why['casa-carla/catena-strana']).toMatch(/catena/);
    expect(readdirSync(path.join(dir, 'casa-alice', 'models'))).toEqual(['index.json']);
  }, 60000);

  it('V-033 ciò che una carta è lo legge il server dal disco: il client dice solo dove; i campi che il gioco non legge restano fuori', async () => {
    const said = { universe: 'casa-carla', model: 'gonfio', xml: ENDLESS, entry: { time: 1 }, card: { holder: 'bruno', origins: [{ holder: 'bruno', universe: 'x', fingerprint: [] }] } };
    const r = await bring('casa-alice', [said]);
    expect(r.status).toBe(200);
    expect(readFileSync(path.join(dir, 'casa-alice', 'models', 'gonfio.xml'), 'utf8')).toBe(seed('object'));
    const entry = JSON.parse(readFileSync(path.join(dir, 'casa-alice', 'models', 'index.json'), 'utf8')).gonfio;
    expect(Object.keys(entry).sort()).toEqual(['brought', 'card', 'class', 'name', 'score']);
    expect(entry.score).toBe(10);
    // Whose it is: the master who brought it; the chain: who held it where it was, read from that universe.
    expect(entry.card.holder).toBe(ALICE);
    expect(entry.card.origins.map((o: { holder: string; universe: string }) => `${o.holder}@${o.universe}`)).toEqual(['anna@casa-carla']);
  });

  it('V-033 portare non costa crediti: nessun archivio dei saldi si muove', async () => {
    const ledger = path.join(dir, '.balances');
    const before = existsSync(ledger) ? readdirSync(ledger).map((f) => readFileSync(path.join(ledger, f), 'utf8')) : [];
    expect((await bring('casa-alice', [{ universe: 'casa-carla', model: 'barile' }])).status).toBe(200);
    const after = existsSync(ledger) ? readdirSync(ledger).map((f) => readFileSync(path.join(ledger, f), 'utf8')) : [];
    expect(after).toEqual(before);
    // The commit holds only the library.
    const files = execFileSync('git', ['show', '--name-only', '--format=', 'HEAD'], { cwd: path.join(dir, 'casa-alice'), encoding: 'utf8' }).trim().split('\n').sort();
    expect(files).toEqual(['models/barile.xml', 'models/index.json']);
  });
});
