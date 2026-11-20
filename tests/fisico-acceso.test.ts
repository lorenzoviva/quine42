// The Physicist with the world on (T452, ADR-0235): a terrain's crossing, pace, fatigue, depth and air, and the gravity of the world, reshaped
// on the Referente's request, within the kernel's limits, in one commit of the Council; refused with the reason when it would cut a place
// (rule 10), when it goes out of the limits or touches what is fixed; the players of a game of many see it once the master publishes.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { DEFAULT_NATURE, terrainPhysics } from '../src/kernel/nature';
import { crossingChanged, keptNature, reshapedGravity, reshapedTerrain } from '../src/kernel/reshape';
import { councilMayWrite } from '../src/kernel/paths';
import type { TerrainDef } from '../src/kernel/types';

const DT = 1 / 60;
const TERRAIN = 'modules/world.terrain/manifest.json';
const tilesOf = (files: Record<string, string | null>): Record<string, TerrainDef> => JSON.parse(String(files[TERRAIN])).tiles;

async function boot(files = bundledFiles) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(DT);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(DT);
  return k;
}

describe('what the Physicist may reshape of a terrain (reshapedTerrain)', () => {
  const tiles = tilesOf(bundledFiles);

  it('the pace of a base code, the fatigue of its water; a new crossing of a ground or a liquid of the world', () => {
    const snow = reshapedTerrain('n', tiles.n, { speed: 0.5 });
    expect(snow).toMatchObject({ ok: true, changed: ['speed'] });
    expect(snow.ok && snow.tile).toMatchObject({ speed: 0.5, solid: false, cross: 'walk' });
    const sea = reshapedTerrain('o', tiles.o, { speed: 0.3, fatigue: 5 });
    expect(sea.ok && terrainPhysics(sea.tile)).toMatchObject({ cross: 'swim', pace: 0.3, fatigue: 5, depth: 'deep' });
    // The ploughed field is not crossed any more: solid, without a swimming fatigue or depth.
    const field = reshapedTerrain('m', tiles.m, { cross: 'none' });
    expect(field.ok && field.tile).toMatchObject({ cross: 'none', solid: true });
    expect(field.ok && field.changed).toEqual(['cross']);
    // The lava is swum (a liquid of the world, not a base code): the pace of the water, deep if not said.
    const lava = reshapedTerrain('v', tiles.v, { cross: 'swim', fatigue: 6 });
    expect(lava.ok && terrainPhysics(lava.tile)).toMatchObject({ cross: 'swim', pace: 0.4, fatigue: 6, depth: 'deep' });
    // The reef stops being swum: its depth and fatigue go with it.
    const reef = reshapedTerrain('y', tiles.y, { cross: 'none' });
    expect(reef.ok && reef.tile.depth).toBeUndefined();
  });

  it('refuses with the reason what is fixed or out of the limits, never clamps it', () => {
    const why = (code: string, change: Record<string, unknown>) => {
      const r = reshapedTerrain(code, tiles[code], change);
      return r.ok ? '' : r.reason;
    };
    expect(why('g', { cross: 'none' })).toMatch(/codice di base/);
    expect(why('w', { cross: 'none' })).toMatch(/codice di base/);
    expect(why('w', { depth: 'deep' })).toMatch(/profondità è del kernel/);
    expect(why('b', { cross: 'walk' })).toMatch(/strato \(wall\)/);
    expect(why('i', { cross: 'none' })).toMatch(/strato \(floor\)/);
    expect(why('m', { cross: 'swim' })).toMatch(/solo un liquido/);
    expect(why('v', { cross: 'walk' })).toMatch(/liquido non si cammina/);
    expect(why('n', { speed: 3 })).toMatch(/a piedi speed sta tra 0.3 e 1.5/);
    expect(why('o', { speed: 1 })).toMatch(/a nuoto speed/);
    expect(why('o', { fatigue: 9 })).toMatch(/fatigue/);
    expect(why('n', { fatigue: 2 })).toMatch(/solo di ciò che si nuota/);
    expect(why('n', { speed: Number.NaN })).toMatch(/è un numero/);
    expect(why('n', { cross: 'fly' })).toMatch(/cross è uno tra/);
    expect(why('m', { air: 'no' })).toMatch(/vero o falso/);
    expect(why('n', { speed: 0.7 })).toMatch(/niente cambia/);
    expect(why('?', {})).toMatch(/non è un terreno/);
    expect(why('Q', { speed: 1 })).toMatch(/non è un terreno/);
  });

  it('the gravity within what this kernel accepts; of the nature only the gravity follows what universe.json says', () => {
    expect(reshapedGravity(0.5)).toEqual({ ok: true, gravity: 0.5 });
    expect(reshapedGravity(3).ok).toBe(false);
    expect(reshapedGravity('1').ok).toBe(false);
    const said = { ...DEFAULT_NATURE, gravity: 0.4, geography: 'void' as const, day: 0 };
    expect(keptNature(DEFAULT_NATURE, said)).toEqual({ ...DEFAULT_NATURE, gravity: 0.4 });
    expect(crossingChanged(tiles, { ...tiles, m: { ...tiles.m, solid: true, cross: 'none' } })).toEqual(['m']);
  });
});

describe('the Physicist with the world on, alone (T452)', () => {
  it('the Referente takes a request to the Physicist: one commit of the Council, the terrain and the gravity reshaped', async () => {
    const k = await boot();
    const commits = k.repo.log().length;
    const r = await k.talkToAgent('liaison', 'la neve è più lenta: passo 0,5');
    expect(r.forged).toMatch(/Il Fisico rimodella il mondo: neve: passo ×0,5/);
    expect(tilesOf(k.files).n.speed).toBe(0.5);
    expect(terrainPhysics(k.palette.n).pace).toBe(0.5);
    expect(k.repo.log().length).toBe(commits + 1);
    expect(k.repo.head().message).toMatch(/il Fisico rimodella/);
    expect(councilMayWrite(TERRAIN)).toBe(true);
    // The gravity: universe.json by the kernel's hand in the same kind of commit, and it stays when the files are applied again.
    const g = await k.talkToAgent('liaison', 'la gravità del mondo è 0,5');
    expect(g.forged).toMatch(/gravità ×0,5/);
    expect(k.config.nature.gravity).toBe(0.5);
    expect(JSON.parse(k.repo.head().files['universe.json']!).nature.gravity).toBe(0.5);
    k.applyFiles({ ...k.repo.working });
    expect(k.config.nature.gravity).toBe(0.5);
    // The rest of the nature stays the Genesis's, whatever universe.json says.
    const raw = JSON.parse(k.repo.working['universe.json']!);
    k.applyFiles({ ...k.repo.working, 'universe.json': JSON.stringify({ ...raw, nature: { ...raw.nature, geography: 'void', gravity: 0.8 } }) });
    expect(k.config.nature).toMatchObject({ geography: 'continent', gravity: 0.8 });
    expect(k.feed().some((e) => e.task === 'physics.reshape' && e.from === 'physicist')).toBe(true);
  }, 60_000);

  it('refuses with the reason a crossing that would cut a place (rule 10), a base code, a gravity out of range', async () => {
    const k = await boot();
    const ch = k.chunks.get('0,0')!;
    const S = k.config.chunkSize;
    // A ploughed field across the place, from edge to edge: not crossed any more, it would cut it in two.
    ch.tiles = Array.from({ length: S }, () => 'g'.repeat(8) + 'm' + 'g'.repeat(S - 9)).join('');
    const before = k.files[TERRAIN];
    const commits = k.repo.log().length;
    const cut = await k.talkToAgent('liaison', 'il campo arato non si attraversa più');
    expect(cut.forged).toMatch(/Il Fisico non lo fa: .*campo arato.*dividerebbe «/);
    expect(k.files[TERRAIN]).toBe(before);
    expect(k.repo.log().length).toBe(commits);
    expect(k.feed().some((e) => e.from === 'kernel' && e.kind === 'scarta' && /dividerebbe/.test(e.text))).toBe(true);
    // The fixed: a base code's crossing, a gravity the kernel cannot make true.
    const base = await k.reshapePhysics('il prato non si attraversa più');
    expect(base).toMatchObject({ ok: false });
    expect(!base.ok && base.reason).toMatch(/codice di base/);
    const heavy = await k.reshapePhysics('la gravità è 5');
    expect(!heavy.ok && heavy.reason).toMatch(/gravità del mondo sta tra 0.2 e 2/);
    expect(k.config.nature.gravity).toBe(1);
    expect(k.repo.log().length).toBe(commits);
    // Where nothing is cut the same crossing goes in: the field drawn away, the place whole.
    ch.tiles = 'g'.repeat(S * S);
    const ok = await k.reshapePhysics('il campo arato non si attraversa più');
    expect(ok).toMatchObject({ ok: true });
    expect(k.palette.m).toMatchObject({ solid: true, cross: 'none' });
  }, 60_000);
});

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

async function thin(server: SessionServer, id: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
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

describe('the Physicist with the world on, in a game of many (T452)', () => {
  it('the master asks on their branch; published, the world and every player have the new physics; a player cannot ask', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const master = await thin(server, 'me');
    const anna = await thin(server, 'anna');
    run(server, [master, anna], 6);
    const r = await until(server, [master, anna], master.k.talkToAgent('liaison', 'la neve è più lenta: passo 0,5, e la gravità 0,5'));
    expect(r.forged).toMatch(/Il Fisico rimodella/);
    run(server, [master, anna], 12);
    // On the branch, not in the world nor with the players.
    expect(Object.keys(server.branchFiles()).sort()).toEqual([TERRAIN, 'universe.json'].sort());
    expect(terrainPhysics(k.palette.n).pace).toBe(0.7);
    expect(anna.k.config.nature.gravity).toBe(1);
    // A player's words to the Council go nowhere.
    const refused = await until(server, [master, anna], anna.session.act({ t: 'agent', agent: 'liaison', text: 'la gravità è 0,3' }));
    expect(refused.ok).toBe(false);
    // Published: the world, and what every client walks with.
    const out = await until(server, [master, anna], master.k.publisher!.publish());
    expect(out.ok).toBe(true);
    expect(terrainPhysics(k.palette.n).pace).toBe(0.5);
    expect(k.config.nature.gravity).toBe(0.5);
    run(server, [master, anna], 12);
    expect(terrainPhysics(anna.k.palette.n).pace).toBe(0.5);
    expect(anna.k.config.nature.gravity).toBe(0.5);
    expect(anna.k.nature().gravity).toBe(0.5);
  }, 60_000);
});
