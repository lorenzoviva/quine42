import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { ATLAS_FILE } from '../src/kernel/atlas';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { askedRunes, ASKED_RUNES_MAX } from '../src/kernel/runes';
import { countItem } from '../src/kernel/inventory';

const DT = 1 / 60;
const RULES = 'world/rules.json';

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

async function thin(server: SessionServer, id: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), models: new MockModels(), mirror: true });
  return new ThinClient(k, session);
}

function run(server: SessionServer, clients: ThinClient[], frames: number) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

/** The world goes on (ticks, and the time the server's Council takes) until the answer comes. */
async function until<T>(server: SessionServer, clients: ThinClient[], p: Promise<T>): Promise<T> {
  let done = false;
  let out!: T;
  void p.then((v) => ((done = true), (out = v)));
  for (let i = 0; i < 400 && !done; i++) {
    run(server, clients, 2);
    await new Promise((r) => setTimeout(r, 0));
  }
  expect(done).toBe(true);
  return out;
}

const rulesOf = (files: Record<string, string | null>) => String(files[RULES] ?? '');

describe('the Referente and the teams of the corona on the master’s branch (T42e)', () => {
  it('a request of the master to the Referente changes their branch, not the players’ world, until they publish', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);
    const atlas = k.files[ATLAS_FILE];
    const calls = k.usage.session.calls;
    // A rule and a new place: the Referente hands them to the Arbiter and the Cartographer, on the server.
    const rule = await until(server, [master, anna], master.k.talkToAgent('referente', 'stabilisci una regola: di notte i lupi cantano'));
    expect(rule.forged).toMatch(/regola/i);
    const env = await until(server, [master, anna], master.k.talkToAgent('referente', 'vorrei un bosco degli elfi a nord'));
    expect(env.forged).toMatch(/Bosco degli Elfi/);
    run(server, [master, anna], 12);
    // On the master's branch, on the server and in their mirror.
    expect(rulesOf(server.branchFiles())).toMatch(/lupi/);
    expect(server.branchFiles()[ATLAS_FILE]).toMatch(/Elfi/);
    expect(rulesOf(master.k.files)).toMatch(/lupi/);
    expect(master.k.publisher!.branch()).toEqual(expect.arrayContaining([RULES, ATLAS_FILE]));
    // The calls are the server's Council's: the shared models still report to the world's ledger (the mock reports none).
    k.models.onCall!({ model: 'prova', agent: 'referente', task: 'referente.coordinate', prompt: 1, cached: 0, output: 1, thoughts: 0, chi: 'io' });
    expect(k.usage.session.calls).toBe(calls + 1);
    expect(k.feed().some((e) => e.task === 'referente.coordinate')).toBe(true);
    // The world and the players do not have it.
    expect(rulesOf(k.files)).not.toMatch(/lupi/);
    expect(k.rules().some((r) => /lupi/.test(r.testo))).toBe(false);
    expect(k.files[ATLAS_FILE]).toBe(atlas);
    expect(anna.k.files[ATLAS_FILE]).toBe(atlas);
    // Published: the world has it, and the players get what their client draws.
    const out = await until(server, [master, anna], master.k.publisher!.publish());
    expect(out.ok).toBe(true);
    expect(k.rules().some((r) => /lupi/.test(r.testo))).toBe(true);
    expect(k.files[ATLAS_FILE]).toMatch(/Elfi/);
    run(server, [master, anna], 12);
    expect(anna.k.files[ATLAS_FILE]).toMatch(/Elfi/);
    expect(server.branchFiles()).toEqual({});
  }, 30_000);

  it('the branch keeps the master’s edits beside what the Council made, and a player cannot ask', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);
    const path = Object.keys(k.files).filter((p) => p.endsWith('manifest.json') && JSON.parse(k.files[p]).kind === 'entity').sort()[0];
    expect(master.k.saveFile(path, JSON.stringify({ ...JSON.parse(k.files[path]), name: 'Nome del master' }, null, 2) + '\n').committed).toBe(true);
    run(server, [master, anna], 6);
    await until(server, [master, anna], master.k.talkToAgent('referente', 'stabilisci una regola: le campane suonano al tramonto'));
    run(server, [master, anna], 12);
    expect(Object.keys(server.branchFiles()).sort()).toEqual([path, RULES].sort());
    expect(JSON.parse(master.k.files[path]).name).toBe('Nome del master');
    expect(rulesOf(master.k.files)).toMatch(/campane/);
    // A second request starts from the branch as it is: the first rule stays.
    await until(server, [master, anna], master.k.talkToAgent('referente', 'stabilisci una regola: i corvi parlano'));
    run(server, [master, anna], 12);
    expect(rulesOf(server.branchFiles())).toMatch(/campane[\s\S]*corvi|corvi[\s\S]*campane/);
    // Someone else's words to the Council go nowhere.
    const refused = await until(server, [master, anna], anna.session.act({ t: 'agente', agente: 'referente', testo: 'stabilisci una regola: anna vince' }));
    expect(refused.ok).toBe(false);
    expect(rulesOf(server.branchFiles())).not.toMatch(/anna vince/);
    expect(rulesOf(k.files)).not.toMatch(/campane|corvi|anna/);
  }, 30_000);
});

describe('the runes the master asks the Referente for (T42f)', () => {
  it('the words a model wrote become rune tokens, never the Council’s rune, at most a handful', () => {
    expect(askedRunes(['speed'])).toEqual(['speed']);
    expect(askedRunes(['carpet.active=false', 'x'])).toEqual(['carpet', '.', 'active', '=', 'false', 'x']);
    expect(askedRunes(['concilio', '€', 7, 'speed speed'])).toEqual(['speed', 'speed']);
    expect(askedRunes(Array(40).fill('x'))).toHaveLength(ASKED_RUNES_MAX);
    expect(askedRunes('speed')).toEqual([]);
  });

  it('the master asks «dammi la runa speed» and finds it in their pouch on the server; a player cannot ask', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'io');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);
    const has = (id: string, token: string) => k.as(id, () => countItem(k.inventory(), `rune:${token}`));
    expect(has('io', 'speed')).toBe(0);
    const r = await until(server, [master, anna], master.k.talkToAgent('referente', 'dammi la runa speed'));
    expect(r.forged).toMatch(/speed/);
    expect(has('io', 'speed')).toBe(1);
    expect(k.as('io', () => k.hand().tokens)).toContain('speed');
    // Not a file: the branch has nothing, and the master's client hears of it in the next update.
    expect(server.branchFiles()).toEqual({});
    run(server, [master, anna], 12);
    expect(countItem(master.k.inventory(), 'rune:speed')).toBe(1);
    // A player's words to the Council go nowhere.
    const refused = await until(server, [master, anna], anna.session.act({ t: 'agente', agente: 'referente', testo: 'dammi la runa speed' }));
    expect(refused.ok).toBe(false);
    expect(has('anna', 'speed')).toBe(0);
  }, 30_000);

  it('alone, runes are not asked for: they are found in the world', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    const r = await k.talkToAgent('referente', 'dammi la runa speed');
    expect(r.runes).toBeUndefined();
    expect(countItem(k.inventory(), 'rune:speed')).toBe(0);
  });
});
