// Bringing cards into a universe before it starts (T295, ADR-0170): the root of a contract, the kin, the choice open and closed, what a
// card becomes where it enters (its chain, its holder, its shares), the doubles, and the Genesis that does not make again what came.
// What concerns who may do what, and the hostile cards, is in tests/sicurezza/carte-portate.test.ts.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EMPTY_TREE, plantRoot, rootCommitId, rootCommitText, rootsOf } from '../server/git';
import { inlineChecker } from '../server/programCheck';
import { cloneUniverse, universeHandler, type UniverseStoreOptions } from '../server/universeStore';
import { isWorldLit, worldLit, worldOut } from '../server/generation';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { bundledFiles } from '../src/kernel/bundle';
import { broughtEntry, cardChoiceIn, doubles, kinCards, readBringRefs, sameName, withBrought, withCardChoice, type BringRef } from '../src/kernel/bring';
import { allCards } from '../src/kernel/cards';
import { contentText, fingerprint, HANDMADE_ORIGIN } from '../src/kernel/heritage';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import type { FileMap } from '../src/kernel/types';
import { KERNEL_CONTRACT, KERNEL_VERSION } from '../src/kernel/version';

const seed = (id: string) => readFileSync(`universe/models/${id}.xml`, 'utf8');
const SEED_INDEX = JSON.parse(readFileSync('universe/models/index.json', 'utf8'));
const GIT: [string, string] = ['Kernel', 'kernel@rune.local'];
const git = (root: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root, encoding: 'utf8' }).trim();
const stamp = (holder: string, origins: unknown[] = []) => ({ author: 'sculptor', payer: 'comune', holder, ...(origins.length ? { origins } : {}) });

interface Answer {
  status: number;
  body: any;
}

/** The store of the universes on a port of this machine: without accounts, only this machine (`gate`). */
async function serveStore(dir: string, o: UniverseStoreOptions = {}) {
  const handler = universeHandler(dir, { checker: inlineChecker(), ...o });
  const server = http.createServer((req, res) => handler(req as never, res, () => ((res.statusCode = 404), res.end('{}'))));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
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
  return { ask, close: () => new Promise<void>((r) => server.close(() => r())) };
}

type Ask = Awaited<ReturnType<typeof serveStore>>['ask'];

/** A universe born from the seed, through the store: a settings file and an empty library are enough here. */
const create = (ask: Ask, name: string, config: Record<string, unknown> = {}, opts: { token?: string; headers?: Record<string, string> } = {}) =>
  ask('POST', `/api/universe/${name}/create`, { ...opts, body: { files: { 'universe.json': JSON.stringify({ name, kernel: KERNEL_VERSION, ...config }, null, 2) + '\n', 'models/index.json': '{}\n' }, message: 'nasce dal seme del kernel' } });

const commit = (ask: Ask, name: string, changes: Record<string, string | null>, message = 'concilio: modelli', opts: { token?: string } = {}) => ask('POST', `/api/universe/${name}/commit`, { ...opts, body: { changes, message, author: 'agent' } });

/** The library of a universe with these entries, and their programs. */
function library(entries: Record<string, { entry: Record<string, unknown>; xml: string }>): Record<string, string> {
  const out: Record<string, string> = { 'models/index.json': JSON.stringify(Object.fromEntries(Object.entries(entries).map(([id, e]) => [id, e.entry])), null, 1) + '\n' };
  for (const [id, e] of Object.entries(entries)) out[`models/${id}.xml`] = e.xml;
  return out;
}

const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('la radice di un contratto (T295)', () => {
  let dir: string;
  let store: Awaited<ReturnType<typeof serveStore>>;
  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-radice-'));
    store = await serveStore(dir);
  });
  afterAll(async () => {
    await store?.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });

  it('due universi nati dal seme hanno la stessa radice, quella del contratto, con un albero vuoto; il seme viene dopo', async () => {
    expect((await create(store.ask, 'alfa')).status).toBe(200);
    expect((await create(store.ask, 'beta')).status).toBe(200);
    const root = rootCommitId(KERNEL_CONTRACT);
    expect(await rootsOf(path.join(dir, 'alfa'), GIT)).toEqual([root]);
    expect(await rootsOf(path.join(dir, 'beta'), GIT)).toEqual([root]);
    // The root is git's object as the server wrote it, byte for byte, on any machine.
    expect(git(path.join(dir, 'alfa'), 'cat-file', 'commit', root) + '\n').toBe(rootCommitText(KERNEL_CONTRACT));
    expect(git(path.join(dir, 'alfa'), 'rev-parse', `${root}^{tree}`)).toBe(EMPTY_TREE);
    expect(git(path.join(dir, 'alfa'), 'log', '--format=%an|%s').split('\n')).toEqual(['Genesi|nasce dal seme del kernel', `Kernel|radice degli universi del contratto ${KERNEL_CONTRACT}`]);
    // The choice of the cards is open since the birth, from the seed.
    expect(cardChoiceIn(readFileSync(path.join(dir, 'alfa', 'universe.json'), 'utf8'))).toBe('seed');
  });

  it('il registro del master non mostra la radice, e non ci si torna', async () => {
    const r = await store.ask('GET', '/api/universe/alfa');
    expect(r.body.log.map((c: { message: string }) => c.message)).toEqual(['nasce dal seme del kernel']);
    const back = await store.ask('POST', '/api/universe/alfa/checkout', { body: { id: rootCommitId(KERNEL_CONTRACT).slice(0, 7) } });
    expect(back.status).toBe(500);
    expect(back.body.error).toBe('commit non valido');
    expect(existsSync(path.join(dir, 'alfa', 'universe.json'))).toBe(true);
  });

  it('un altro contratto ha un’altra radice; un universo nato prima non ne ha una in comune con nessuno', async () => {
    expect(rootCommitId('0.4')).not.toBe(rootCommitId(KERNEL_CONTRACT));
    expect(() => rootCommitText('0.5.1')).toThrow(/contratto/);
    const old = path.join(dir, 'vecchio');
    mkdirSync(old);
    git(old, 'init', '-q');
    writeFileSync(path.join(old, 'universe.json'), '{}\n');
    git(old, 'add', '-A');
    git(old, 'commit', '-q', '-m', 'nasce dal seme del kernel');
    expect(await rootsOf(old, GIT)).not.toContain(rootCommitId(KERNEL_CONTRACT));
    const other = path.join(dir, 'altro');
    mkdirSync(other);
    git(other, 'init', '-q');
    expect(await plantRoot(other, '0.4', GIT)).toBe(rootCommitId('0.4'));
    expect(await rootsOf(other, GIT)).toEqual([rootCommitId('0.4')]);
    // The store never lists the roots of a folder without commits.
    const empty = path.join(dir, 'vuoto');
    mkdirSync(empty);
    git(empty, 'init', '-q');
    expect(await rootsOf(empty, GIT)).toEqual([]);
  });

  it('un clone tiene la radice, e la sua scelta resta aperta finché nessuno entra, anche con una Genesi alle spalle', async () => {
    const anna = { headers: { 'x-quine-viandante': 'anna' } };
    const bruno = { headers: { 'x-quine-viandante': 'bruno' } };
    expect((await create(store.ask, 'molti', { game: { mode: 'multiplayer' } }, anna)).status).toBe(200);
    // A world generated, with a card of its own.
    const generated = { 'models/index.json': JSON.stringify({ barile: { class: 'furniture', name: 'Barile', card: stamp('anna') } }), 'models/barile.xml': seed('barile') };
    expect((await store.ask('POST', '/api/universe/molti/commit', { ...anna, body: { changes: generated, message: 'genesi: Il Regno di Valmora', author: 'agent' } })).status).toBe(200);
    const r = await cloneUniverse(dir, path.join(dir, 'molti'), { nome: 'molti-due', master: 'bruno' });
    expect(r.nome).toBe('molti-due');
    expect(await rootsOf(path.join(dir, 'molti-due'), GIT)).toEqual([rootCommitId(KERNEL_CONTRACT)]);
    const cfg = readJson(path.join(dir, 'molti-due', 'universe.json'));
    expect(cfg).toMatchObject({ name: 'molti-due', cardChoice: 'clone', game: { master: 'bruno' } });
    // Its master, before anyone enters: open though a Genesis is behind it. What it copied is there already; what a kin has comes.
    const kin = await store.ask('GET', '/api/universe/molti-due/kin', bruno);
    expect(kin.body).toMatchObject({ open: true, choice: 'clone' });
    expect(kin.body.kin.find((k: { name: string }) => k.name === 'molti').cards.map((c: { id: string }) => c.id)).toEqual(['barile']);
    const copied = await store.ask('POST', '/api/universe/molti-due/bring', { ...bruno, body: { cards: [{ universe: 'molti', model: 'barile' }] } });
    expect(copied).toMatchObject({ status: 409, body: { cards: [{ card: 'molti/barile', reason: expect.stringMatching(/c'è già/) }] } });
    expect((await commit(store.ask, 'beta', { 'models/index.json': JSON.stringify({ cassa: { class: 'furniture', name: 'Cassa', card: stamp('me') } }), 'models/cassa.xml': seed('furniture') })).status).toBe(200);
    const came = await store.ask('POST', '/api/universe/molti-due/bring', { ...bruno, body: { cards: [{ universe: 'beta', model: 'cassa' }] } });
    expect(came.status).toBe(200);
    expect(git(path.join(dir, 'molti-due'), 'log', '-1', '--format=%s')).toBe('carte portate prima del primo ingresso: «Cassa» (beta)');
    expect(readJson(path.join(dir, 'molti-due', 'models', 'index.json')).cassa.card).toMatchObject({ holder: 'bruno', origins: [{ holder: 'me', universe: 'beta' }] });
    // Who is not its master neither sees nor brings; the universe it came from is anna's, and closed (its Genesis is done).
    expect((await store.ask('GET', '/api/universe/molti-due/kin', anna)).status).toBe(403);
    expect((await store.ask('GET', '/api/universe/molti/kin', anna)).body).toMatchObject({ open: false, reason: expect.stringMatching(/Genesi è già fatta/) });
  });
});

describe('le carte portate, pure (T295)', () => {
  const sourceEntry = { class: 'furniture', name: 'Barile', author: 'gemini-3.8-flash', score: 8, time: 900000, advice: ['più scuro'], problems: ['storto'], vpt: 3, card: stamp('anna', [{ holder: 'carla', universe: 'primo', fingerprint: [1, 2] }]) };

  it('ciò che un universo può dare: le sue carte, con il programma; non il seme', () => {
    const files: FileMap = { ...library({ barile: { entry: sourceEntry, xml: seed('barile') }, object: { entry: SEED_INDEX.object, xml: seed('object') }, 'sound-music-woods': { entry: { ...SEED_INDEX['sound-music-woods'], card: stamp('anna') }, xml: seed('sound-music-woods') } }) };
    delete files['models/object.xml'];
    expect(kinCards(files)).toEqual([
      { id: 'barile', kind: 'model', name: 'Barile', class: 'furniture', score: 8 },
      { id: 'sound-music-woods', kind: 'sound', name: 'Selva', environments: ['woods', 'jungle', 'mountains', 'desert', 'wizard_tower'] },
    ]);
  });

  it('la voce che diventa: solo ciò che il gioco legge, la catena allungata, il titolare il master', () => {
    const made = broughtEntry({ kind: 'model', universe: 'fonte', id: 'barile', entry: sourceEntry, xml: seed('barile'), name: 'Barile' }, 'me');
    if ('error' in made) throw new Error(made.error);
    const { card, ...info } = made.info;
    expect(info).toEqual({ class: 'furniture', name: 'Barile', author: 'gemini-3.8-flash', score: 8, brought: 'fonte' });
    expect(card).toEqual({ author: 'sculptor', payer: 'comune', holder: 'me', origins: [{ holder: 'carla', universe: 'primo', fingerprint: [1, 2] }, { holder: 'anna', universe: 'fonte', fingerprint: fingerprint(contentText(info)) }] });
    // A size of D&D that is not the class's own is kept, with the density it runs at; one that is not a size is not.
    const big = broughtEntry({ kind: 'model', universe: 'fonte', id: 'torre', entry: { class: 'structure', size: 'gargantuan', card: stamp('anna') }, xml: '<x/>', name: 'Torre' }, 'me');
    expect('info' in big && big.info).toMatchObject({ size: 'gargantuan', vpt: expect.any(Number) });
    const odd = broughtEntry({ kind: 'model', universe: 'fonte', id: 'torre', entry: { class: 'structure', size: 'enorme', card: stamp('anna') }, xml: '<x/>', name: 'Torre' }, 'me');
    expect('info' in odd && odd.info.size).toBeUndefined();
    // A model of the seed is no card, and its chain must read.
    expect(broughtEntry({ kind: 'model', universe: 'fonte', id: 'object', entry: SEED_INDEX.object, xml: seed('object'), name: 'Cosa' }, 'me')).toEqual({ error: expect.stringMatching(/non è una carta/) });
    expect(broughtEntry({ kind: 'model', universe: 'fonte', id: 'b', entry: { class: 'object', card: { ...stamp('anna'), origins: [{ holder: '<b>', universe: 'x', fingerprint: [] }] } }, xml: '<x/>', name: 'B' }, 'me')).toEqual({ error: 'la sua catena non si legge' });
  });

  it('una carta fatta a mano: misurata sul programma, l’ultimo anello dal suo autore nell’archivio', () => {
    const made = broughtEntry({ kind: 'model', handmade: true, id: 'handmade-abcdefghij', xml: seed('barile'), name: 'Botte', class: 'furniture', author: 'bruno' }, 'me');
    if ('error' in made) throw new Error(made.error);
    expect(made.info).toMatchObject({ class: 'furniture', name: 'Botte', brought: HANDMADE_ORIGIN, card: { author: 'bruno', payer: 'bruno', holder: 'me', origins: [{ holder: 'bruno', universe: HANDMADE_ORIGIN, fingerprint: fingerprint(seed('barile')) }] } });
    // In the universe its shares are measured as the card was: by the program. Unchanged, half goes back to its author.
    const files = { ...library({ 'handmade-abcdefghij': { entry: made.info as unknown as Record<string, unknown>, xml: seed('barile') } }), 'universe.json': '{}' };
    expect(allCards(files, true).find((c) => c.id === 'model:handmade-abcdefghij')?.quote).toEqual({ me: 0.5, bruno: 0.5 });
  });

  it('i doppioni: due scelte con un id, o un id che c’è già', () => {
    const refs: BringRef[] = [{ universe: 'fonte', model: 'barile' }, { universe: 'fonte2', model: 'barile' }, { universe: 'fonte', model: 'tavolo' }, { handmade: 'handmade-abcdefghij' }];
    const d = doubles(refs, (id) => id === 'tavolo');
    expect([...d.keys()].sort()).toEqual(['barile', 'tavolo']);
    expect(d.get('barile')).toMatch(/stesso id «barile»: fonte\/barile, fonte2\/barile/);
    expect(d.get('tavolo')).toMatch(/c'è già/);
    expect(readBringRefs([{ universe: 'Fonte!', model: 'x' }])).toEqual({ error: expect.stringMatching(/universe, model/) });
    expect(readBringRefs(new Array(25).fill({ handmade: 'handmade-abcdefghij' }))).toEqual({ error: expect.stringMatching(/al più 24/) });
    expect(readBringRefs([])).toEqual({ error: expect.stringMatching(/elenco/) });
  });

  it('la scelta in universe.json: aperta dal seme o dal clone, chiusa senza', () => {
    const text = JSON.stringify({ name: 'x', ai: { maxText: 3 } }, null, 2) + '\n';
    expect(cardChoiceIn(text)).toBeUndefined();
    const open = withCardChoice(text, 'seed');
    expect(cardChoiceIn(open)).toBe('seed');
    expect(JSON.parse(withCardChoice(open, undefined))).toEqual(JSON.parse(text));
    expect(cardChoiceIn(JSON.stringify({ cardChoice: 'aperta' }))).toBeUndefined();
    expect(withBrought('{"a":{"class":"object"}}', { b: { class: 'object' } })).toBe('{\n "a": {\n  "class": "object"\n },\n "b": {\n  "class": "object"\n }\n}\n');
    expect(sameName('Il Mulino, sul fiume', 'il mulino sul fiume')).toBe(true);
    expect(sameName('', '')).toBe(false);
  });
});

describe('portare le carte con lo store (T295)', () => {
  let dir: string;
  let store: Awaited<ReturnType<typeof serveStore>>;
  let labs = false;
  const barile = { entry: { class: 'furniture', name: 'Barile', author: 'gemini-3.8-flash', card: stamp('anna', [{ holder: 'carla', universe: 'primo', fingerprint: [1, 2] }]) }, xml: seed('barile') };
  const selva = { entry: { ...SEED_INDEX['sound-music-woods'], name: 'Selva antica', card: { author: 'musician', payer: 'comune', holder: 'anna' } }, xml: seed('sound-music-woods') };

  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'quine-carte-portate-'));
    store = await serveStore(dir, { labs: () => labs });
    for (const name of ['fonte', 'fonte2', 'nuovo', 'nuovo2', 'fatto', 'entrato', 'acceso']) expect((await create(store.ask, name)).status).toBe(200);
    expect((await create(store.ask, 'vecchio', { kernel: '0.4.2' })).status).toBe(200);
    expect((await commit(store.ask, 'fonte', library({ barile, 'sound-music-woods-antica': selva, object: { entry: SEED_INDEX.object, xml: seed('object') } }))).status).toBe(200);
    expect((await commit(store.ask, 'fonte2', library({ barile }))).status).toBe(200);
    expect((await commit(store.ask, 'vecchio', library({ barile }))).status).toBe(200);
    // A universe of before the roots, with a card of its own.
    const old = path.join(dir, 'estraneo');
    mkdirSync(path.join(old, 'models'), { recursive: true });
    for (const [p, t] of Object.entries({ 'universe.json': JSON.stringify({ name: 'estraneo', kernel: KERNEL_VERSION, cardChoice: 'seed' }), ...library({ barile }) })) writeFileSync(path.join(old, p), t);
    git(old, 'init', '-q');
    git(old, 'add', '-A');
    git(old, 'commit', '-q', '-m', 'nasce dal seme del kernel');
  });
  afterAll(async () => {
    await store?.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  });

  it('i parenti: gli universi con la stessa radice e le loro carte; di un altro contratto con il motivo; gli altri no', async () => {
    const r = await store.ask('GET', '/api/universe/nuovo/kin');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, open: true, choice: 'seed', contract: KERNEL_CONTRACT, handmade: [] });
    const kin = Object.fromEntries(r.body.kin.map((k: { name: string }) => [k.name, k]));
    expect(Object.keys(kin).sort()).toEqual(['acceso', 'entrato', 'fatto', 'fonte', 'fonte2', 'nuovo2', 'vecchio']);
    expect(kin.fonte.cards.map((c: { id: string }) => c.id)).toEqual(['barile', 'sound-music-woods-antica']);
    expect(kin.vecchio).toMatchObject({ ok: false, kernel: '0.4.2', cards: [], reason: expect.stringMatching(/kernel 0\.4\.2/) });
    expect(kin.estraneo).toBeUndefined();
  });

  it('un modello e un suono entrano: un commit del Kernel, la carta del master, la catena allungata; nessun saldo si muove', async () => {
    const balances = () => (existsSync(path.join(dir, '.balances')) ? readdirSync(path.join(dir, '.balances')).sort().map((f) => `${f}:${readFileSync(path.join(dir, '.balances', f), 'utf8')}`) : []);
    const before = balances();
    const r = await store.ask('POST', '/api/universe/nuovo/bring', { body: { cards: [{ universe: 'fonte', model: 'barile' }, { universe: 'fonte', model: 'sound-music-woods-antica' }] } });
    expect(r.status).toBe(200);
    expect(r.body.brought).toEqual([
      { id: 'barile', kind: 'model', name: 'Barile', from: 'fonte' },
      { id: 'sound-music-woods-antica', kind: 'sound', name: 'Selva antica', from: 'fonte' },
    ]);
    const root = path.join(dir, 'nuovo');
    expect(git(root, 'log', '-1', '--format=%an|%s')).toBe('Kernel|carte portate prima della Genesi: «Barile» (fonte), «Selva antica» (fonte)');
    expect(readFileSync(path.join(root, 'models', 'barile.xml'), 'utf8')).toBe(seed('barile'));
    const index = readJson(path.join(root, 'models', 'index.json'));
    const { card, ...info } = index.barile;
    expect(info).toEqual({ class: 'furniture', name: 'Barile', author: 'gemini-3.8-flash', brought: 'fonte' });
    expect(card).toEqual({ author: 'sculptor', payer: 'comune', holder: 'me', origins: [{ holder: 'carla', universe: 'primo', fingerprint: [1, 2] }, { holder: 'anna', universe: 'fonte', fingerprint: fingerprint(contentText(info)) }] });
    expect(index['sound-music-woods-antica']).toMatchObject({ class: 'suono', brought: 'fonte', sound: { use: 'music', environments: ['woods', 'jungle', 'mountains', 'desert', 'wizard_tower'] }, card: { author: 'musician', holder: 'me' } });
    // The shares follow ADR-0084: the copy unchanged gives half of every use back along the chain.
    const files: FileMap = { 'universe.json': readFileSync(path.join(root, 'universe.json'), 'utf8'), 'models/index.json': readFileSync(path.join(root, 'models', 'index.json'), 'utf8') };
    const quote = allCards(files, true).find((c) => c.id === 'model:barile')!.quote!;
    expect(quote.me).toBeCloseTo(0.5);
    expect(quote.anna + quote.carla).toBeCloseTo(0.5);
    // Rule 8d: bringing costs no credit; no ledger is written.
    expect(balances()).toEqual(before);
    // The answer has the files written, for the kernel of a game alone.
    expect(Object.keys(r.body.changes).sort()).toEqual(['models/barile.xml', 'models/index.json', 'models/sound-music-woods-antica.xml']);
  });

  it('ciò che c’è già, e due carte con un id, si dicono prima: niente si scrive', async () => {
    const head = git(path.join(dir, 'nuovo'), 'rev-parse', 'HEAD');
    const again = await store.ask('POST', '/api/universe/nuovo/bring', { body: { cards: [{ universe: 'fonte', model: 'barile' }] } });
    expect(again.status).toBe(409);
    expect(again.body.cards).toEqual([{ card: 'fonte/barile', reason: "«barile» c'è già in questo universo" }]);
    const twice = await store.ask('POST', '/api/universe/nuovo2/bring', { body: { cards: [{ universe: 'fonte', model: 'barile' }, { universe: 'fonte2', model: 'barile' }] } });
    expect(twice.status).toBe(409);
    expect(twice.body.cards.map((c: { card: string }) => c.card)).toEqual(['fonte/barile', 'fonte2/barile']);
    expect(git(path.join(dir, 'nuovo'), 'rev-parse', 'HEAD')).toBe(head);
  });

  it('da chi non ha la stessa radice, di un altro contratto, dal seme: no, con il motivo, e niente entra', async () => {
    const head = git(path.join(dir, 'nuovo2'), 'rev-parse', 'HEAD');
    const bring = (cards: BringRef[]) => store.ask('POST', '/api/universe/nuovo2/bring', { body: { cards } });
    expect((await bring([{ universe: 'estraneo', model: 'barile' }])).body.cards).toEqual([{ card: 'estraneo/barile', reason: expect.stringMatching(/antenato comune/) }]);
    expect((await bring([{ universe: 'vecchio', model: 'barile' }])).body.cards).toEqual([{ card: 'vecchio/barile', reason: expect.stringMatching(/kernel 0\.4\.2/) }]);
    // All or nothing: the sound that could come does not, while the model of the seed is in the choice.
    const r = await bring([{ universe: 'fonte', model: 'object' }, { universe: 'fonte', model: 'sound-music-woods-antica' }]);
    expect(r.status).toBe(422);
    expect(r.body.cards).toEqual([{ card: 'fonte/object', reason: expect.stringMatching(/seme/) }]);
    expect(git(path.join(dir, 'nuovo2'), 'rev-parse', 'HEAD')).toBe(head);
    expect(existsSync(path.join(dir, 'nuovo2', 'models', 'sound-music-woods-antica.xml'))).toBe(false);
  });

  it('a Genesi fatta, a partita iniziata, con il mondo acceso: la scelta è chiusa', async () => {
    expect((await commit(store.ask, 'fatto', { 'world/bible.json': '{}\n' }, 'genesi: Il Regno di Valmora')).status).toBe(200);
    const done = await store.ask('GET', '/api/universe/fatto/kin');
    expect(done.body).toMatchObject({ open: false, reason: expect.stringMatching(/Genesi è già fatta/) });
    expect((await store.ask('POST', '/api/universe/fatto/bring', { body: { cards: [{ universe: 'fonte', model: 'barile' }] } })).status).toBe(409);
    // The first entry: the kernel takes the choice away from universe.json (tested below on the kernel).
    const cfg = readFileSync(path.join(dir, 'entrato', 'universe.json'), 'utf8');
    expect((await commit(store.ask, 'entrato', { 'universe.json': withCardChoice(cfg, undefined) }, 'la scelta delle carte si chiude: si entra nel mondo')).status).toBe(200);
    const entered = await store.ask('POST', '/api/universe/entrato/bring', { body: { cards: [{ universe: 'fonte', model: 'barile' }] } });
    expect(entered).toMatchObject({ status: 409, body: { error: expect.stringMatching(/scelta delle carte è chiusa/) } });
    worldLit(dir, 'acceso');
    try {
      expect(isWorldLit(dir, 'acceso')).toBe(true);
      const lit = await store.ask('POST', '/api/universe/acceso/bring', { body: { cards: [{ universe: 'fonte', model: 'barile' }] } });
      expect(lit).toMatchObject({ status: 409, body: { error: expect.stringMatching(/mondo è acceso/) } });
    } finally {
      worldOut(dir, 'acceso');
    }
  });

  it('le carte fatte a mano: solo con i laboratori aperti, solo del contratto; il loro autore nella catena', async () => {
    mkdirSync(path.join(dir, '.handmade'), { recursive: true });
    const card = (id: string, kernel: string) => ({ id, kind: 'model', name: 'Botte di Bruno', class: 'furniture', xml: seed('barile'), kernel, author: 'bruno', made: '2026-11-07T10:00:00.000Z', changed: '2026-11-07T10:00:00.000Z' });
    writeFileSync(path.join(dir, '.handmade', 'bruno.json'), JSON.stringify({ signature: 'Bruno', cards: [card('handmade-bottebruno', KERNEL_CONTRACT), card('handmade-vecchiaxyz', '0.4')] }));
    labs = false;
    expect((await store.ask('GET', '/api/universe/acceso/kin')).body.handmade).toEqual([]);
    const closed = await store.ask('POST', '/api/universe/acceso/bring', { body: { cards: [{ handmade: 'handmade-bottebruno' }] } });
    expect(closed.body.cards).toEqual([{ card: 'handmade-bottebruno', reason: expect.stringMatching(/laboratori/) }]);
    labs = true;
    const kin = await store.ask('GET', '/api/universe/acceso/kin');
    // What the choice shows of a handmade card is a list (rule 8f): the signature, never the author.
    expect(kin.body.handmade).toEqual([expect.objectContaining({ id: 'handmade-bottebruno', name: 'Botte di Bruno', signature: 'Bruno', mine: false })]);
    expect(JSON.stringify(kin.body.handmade)).not.toMatch(/"bruno"/);
    const old = await store.ask('POST', '/api/universe/acceso/bring', { body: { cards: [{ handmade: 'handmade-vecchiaxyz' }] } });
    expect(old.body.cards).toEqual([{ card: 'handmade-vecchiaxyz', reason: expect.stringMatching(/kernel 0\.4/) }]);
    const r = await store.ask('POST', '/api/universe/acceso/bring', { body: { cards: [{ handmade: 'handmade-bottebruno' }] } });
    expect(r.status).toBe(200);
    const entry = readJson(path.join(dir, 'acceso', 'models', 'index.json'))['handmade-bottebruno'];
    expect(entry).toMatchObject({ class: 'furniture', name: 'Botte di Bruno', brought: HANDMADE_ORIGIN, card: { author: 'bruno', payer: 'bruno', holder: 'me', origins: [{ holder: 'bruno', universe: HANDMADE_ORIGIN, fingerprint: fingerprint(seed('barile')) }] } });
    labs = false;
  });
});

/** The local models, counting the calls of every task; named as if they were online, so the directors work. */
class Counting extends MockAiModels {
  calls: TextCall[] = [];
  constructor() {
    super();
    Object.defineProperty(this, 'name', { value: 'prova' });
  }
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
  count(...tasks: string[]): number {
    return this.calls.filter((c) => tasks.includes(c.task)).length;
  }
}

const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));
const withChoice = (files: FileMap): FileMap => ({ ...files, 'universe.json': withCardChoice(files['universe.json'], 'seed') });

/** The models the world asks for, sculpted until none is missing (or the budget ends): the director's own pace, without the clock. */
async function sculptAll(k: Kernel): Promise<void> {
  for (let i = 0; i < 400 && k.sculpting.missing().length; i++) {
    k.sculpting.pump();
    await settle(2);
  }
  await settle(20);
}

describe('la Genesi con le carte (T295)', () => {
  it('la Genesi chiude la scelta, e così il primo ingresso; uno specchio no', async () => {
    const k = await Kernel.boot({ files: withChoice(bundledFiles), store: memoryStore(), ai: new MockAiModels() });
    expect(k.config.cardChoice).toBe('seed');
    k.lockSettings();
    expect(k.config.cardChoice).toBeUndefined();
    expect(cardChoiceIn(k.repo.working['universe.json'])).toBeUndefined();
    expect(k.repo.head().message).toBe('la scelta delle carte si chiude: si entra nel mondo');
    expect(await k.bringCards([{ universe: 'fonte', model: 'barile' }])).toEqual({ ok: false, reason: expect.stringMatching(/partita è cominciata/) });
    const g = await Kernel.boot({ files: withChoice(bundledFiles), store: memoryStore(), ai: new MockAiModels() });
    expect(await g.runGenesis('un regno di pastori')).toBe(true);
    expect(g.config.cardChoice).toBeUndefined();
    expect(g.repo.log().map((c) => c.message)).toContain('la scelta delle carte si chiude: comincia la Genesi');
    const mirror = await Kernel.boot({ files: withChoice(bundledFiles), store: memoryStore(), ai: new MockAiModels(), mirror: true });
    mirror.lockSettings();
    expect(mirror.config.cardChoice).toBe('seed');
    // Without the store there is nothing to bring, and the kernel says so.
    const alone = await Kernel.boot({ files: withChoice(bundledFiles), store: memoryStore(), ai: new MockAiModels() });
    expect(await alone.bringCards([{ universe: 'fonte', model: 'barile' }])).toEqual({ ok: false, reason: expect.stringMatching(/server degli universi/) });
  }, 60000);

  it('offline, con le carte di un universo parente la Genesi chiama meno lo Scultore, e i suoi agenti le conoscono; nessun guasto', async () => {
    // A universe generated without cards: what its Genesis and its director made.
    const plain = new Counting();
    const a = await Kernel.boot({ files: withChoice(bundledFiles), store: memoryStore(), ai: plain });
    expect(await a.runGenesis('un regno di pastori')).toBe(true);
    await sculptAll(a);
    const sculpted = plain.count('model.sculpt');
    expect(sculpted).toBeGreaterThan(3);
    // Its cards, brought into a new universe as the store would: an entry each, with the chain and the master's card.
    const index = JSON.parse(a.files['models/index.json']);
    const entries: Record<string, ReturnType<typeof Object>> = {};
    const programs: FileMap = {};
    for (const [id, entry] of Object.entries<Record<string, any>>(index)) {
      if (!entry.card) continue;
      const made = broughtEntry({ kind: 'model', universe: 'alfa', id, entry, xml: a.files[`models/${id}.xml`], name: entry.name ?? id }, 'me');
      if ('error' in made) throw new Error(`${id}: ${made.error}`);
      entries[id] = made.info;
      programs[`models/${id}.xml`] = a.files[`models/${id}.xml`];
    }
    // And a structure and a piece of music from elsewhere, for the Cartographer.
    const tower = broughtEntry({ kind: 'model', universe: 'alfa', id: 'struttura-il-mulino-sul-fiume', entry: { ...SEED_INDEX['struttura-torre-di-guardia'], name: 'il mulino sul fiume', card: stamp('anna') }, xml: seed('struttura-torre-di-guardia'), name: 'il mulino sul fiume' }, 'me');
    const music = broughtEntry({ kind: 'sound', universe: 'alfa', id: 'sound-music-boschi', entry: { ...SEED_INDEX['sound-music-woods'], card: stamp('anna') }, xml: seed('sound-music-woods'), name: 'Boschi' }, 'me');
    if ('error' in tower || 'error' in music) throw new Error('voce non valida');
    entries['struttura-il-mulino-sul-fiume'] = tower.info;
    entries['sound-music-boschi'] = music.info;
    programs['models/struttura-il-mulino-sul-fiume.xml'] = seed('struttura-torre-di-guardia');
    programs['models/sound-music-boschi.xml'] = seed('sound-music-woods');
    const files = withChoice({ ...bundledFiles, ...programs, 'models/index.json': withBrought(bundledFiles['models/index.json'], entries as never) });
    const counted = new Counting();
    const c = await Kernel.boot({ files, store: memoryStore(), ai: counted });
    expect(c.broughtModels().length).toBe(Object.keys(entries).length);
    expect(await c.runGenesis('un regno di pastori')).toBe(true);
    await sculptAll(c);
    const withCards = counted.count('model.sculpt');
    // The figures and things of the cast wear what came: the Sculptor is not asked for them again.
    expect(withCards).toBeLessThan(sculpted);
    for (const id of Object.keys(entries)) expect(c.sculpting.missing().map((r) => r.id)).not.toContain(id);
    expect(c.faults.list().filter((f) => /model|forma|carte/i.test(f.key))).toEqual([]);
    // What the agents were told.
    const prompt = (task: string) => counted.calls.filter((x) => x.task === task).map((x) => x.prompt).join('\n');
    expect(prompt('genesis.style')).toMatch(/made before this guide.*«il mulino sul fiume» \(structure\)/s);
    expect(prompt('genesis.layouts')).toMatch(/Music is already written for the environments whose id contains: "woods"/);
    expect(prompt('genesis.cast')).toMatch(/already have their look/);
    // The Cartographer asks for a brought structure by its concept: the kernel dresses the lot with it.
    expect((c as any).structureModelFor('Il mulino sul fiume')).toBe('struttura-il-mulino-sul-fiume');
    // At another size it is not the one that came: the kernel's own entries of the concept (ADR-0160).
    expect((c as any).structureModelFor('Il mulino sul fiume', 'huge')).not.toBe('struttura-il-mulino-sul-fiume');
    // The numbers of the ADR (offline, MockAiModels): said by the test, not guessed.
    console.info(`[T295] Scultore senza carte: ${sculpted} chiamate; con le carte: ${withCards} (${plain.count('model.judge')} → ${counted.count('model.judge')} giudizi dell'Artista; ${plain.calls.length} → ${counted.calls.length} chiamate in tutto)`);
  }, 120000);
});
