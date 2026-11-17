// The strata of the ground (T418, ADR-0091 point 5, T52d reduced): the seed's terrains of the strata, the draft column by column from the
// tile and its biome, deterministic from the world's seed; the plan keeps them, a plan of before has them again from its draft; a thin
// client receives them with the place.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { MemoryChunks, type ChunkRecord } from '../src/kernel/chunks';
import { Validator } from '../src/kernel/validator';
import { Sandbox } from '../src/kernel/sandbox';
import { fakeHost } from './helpers';
import {
  biomeOf,
  columnRoles,
  draftStrata,
  readStrata,
  roleCodes,
  SEED_STRATA,
  STRATA_DEPTH,
  strataErrors,
  strataPalette,
  stratumRow,
} from '../src/kernel/strata';
import type { TerrainDef } from '../src/kernel/types';
import { fakeLink, type ChunkView } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';

const seedTerrain = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']!);
const palette = seedTerrain.tiles as Record<string, TerrainDef>;
const strata = strataPalette(seedTerrain.strata);

describe('the strata of the seed (T418)', () => {
  it('the seed has its terrains of the strata, the same as the kernel falls back on, and they are good', () => {
    expect(seedTerrain.strata).toEqual(JSON.parse(JSON.stringify(SEED_STRATA)));
    expect(strataErrors(seedTerrain.strata)).toEqual([]);
    for (const t of Object.values<TerrainDef>(seedTerrain.strata)) expect(t.layer).toBe('stratum');
    // No stratum is a tile of the maps: the palette of the tiles has none.
    expect(Object.values(palette).some((t) => t.layer === 'stratum')).toBe(false);
  });

  it("a world's own strata go over the seed's, code by code; what is not good is left out", () => {
    const own = strataPalette({ '2': { id: 'clay', name: 'creta', color: '#aa5533', solid: true, layer: 'stratum' }, '9': { name: 'x', color: 'rosso', layer: 'stratum' } });
    expect(own['2']!.name).toBe('creta');
    expect(own['9']).toBeUndefined();
    expect(own['5']).toEqual(SEED_STRATA['5']);
    // A world that names another clay: the draft takes the world's own.
    const other = strataPalette({ c: { id: 'clay', name: 'marna', color: '#998877', solid: true, layer: 'stratum' } });
    expect(roleCodes(other).clay).toBe('c');
    expect(roleCodes(strata)).toEqual({ topsoil: '1', clay: '2', sandbed: '3', mud: '4', bedrock: '5' });
    // Nothing is trusted: no object, a list, a layer of the maps.
    expect(strataPalette('terra')).toEqual({ ...SEED_STRATA });
    expect(strataErrors([])).not.toEqual([]);
    expect(strataErrors({ '1': { name: 'terra', color: '#112233', layer: 'ground' } })[0]).toMatch(/stratum/);
    expect(strataErrors({ ab: { name: 'terra', color: '#112233', layer: 'stratum' } })[0]).toMatch(/non valido/);
  });

  it('the validator refuses a generator whose strata are not good', async () => {
    const v = new Validator(await Sandbox.create(fakeHost().host));
    const good = v.parseManifest('modules/world.terrain/manifest.json', JSON.stringify(seedTerrain));
    expect(good.errors).toEqual([]);
    const bad = v.parseManifest('modules/world.terrain/manifest.json', JSON.stringify({ ...seedTerrain, strata: { '1': { name: 'terra', color: 'marrone', layer: 'stratum' } } }));
    expect(bad.errors.join(' ')).toMatch(/strato "1" incompleto/);
  });
});

describe('the draft of the strata (T418)', () => {
  it('a column by its biome: earth and clay over the bedrock, packed sand, mud under the water, rock all the way', () => {
    expect(biomeOf('g', palette.g)).toBe('soil');
    expect(biomeOf('o', palette.o)).toBe('wet');
    expect(biomeOf('w', palette.w)).toBe('wet');
    expect(biomeOf('k', palette.k)).toBe('rock');
    expect(biomeOf('s', palette.s)).toBe('sand');
    for (let x = -20; x < 20; x++)
      for (let y = -3; y < 3; y++) {
        const soil = columnRoles('soil', x, y, 42);
        expect(soil).toHaveLength(STRATA_DEPTH);
        expect(soil[0]).toBe('topsoil');
        expect(soil[STRATA_DEPTH - 1]).toBe('bedrock');
        // Downwards the strata never come back up: earth, then clay, then rock.
        const order = ['topsoil', 'clay', 'bedrock'];
        for (let d = 1; d < STRATA_DEPTH; d++) expect(order.indexOf(soil[d]!)).toBeGreaterThanOrEqual(order.indexOf(soil[d - 1]!));
        expect(columnRoles('rock', x, y, 42).every((r) => r === 'bedrock')).toBe(true);
        expect(columnRoles('wet', x, y, 42)[0]).toBe('mud');
        expect(columnRoles('sand', x, y, 42)[0]).toBe('sandbed');
      }
    // The columns differ: the earth is one or two tiles deep, the rock begins at two or three.
    const seen = new Set<string>();
    for (let x = 0; x < 40; x++) seen.add(columnRoles('soil', x, 0, 42).join(','));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('the same seed, the same strata; another seed, others', () => {
    const S = 18;
    const draft = Array.from({ length: S * S }, (_, i) => 'ggggggssskkkoowwtn'[i % 18]).join('');
    const a = draftStrata(draft, 2, -3, S, 7, palette, strata);
    const b = draftStrata(draft, 2, -3, S, 7, palette, strata);
    expect(a).toEqual(b);
    expect(a).toHaveLength(STRATA_DEPTH);
    for (const row of a) expect(row).toHaveLength(S * S);
    expect(draftStrata(draft, 2, -3, S, 8, palette, strata)).not.toEqual(a);
    expect(draftStrata(draft, 3, -3, S, 7, palette, strata)).not.toEqual(a);
    // Under the mountain the bedrock, under the sea the mud, under the sand the packed sand.
    expect(a[0]![9]).toBe('5');
    expect(a[0]![12]).toBe('4');
    expect(a[0]![6]).toBe('3');
    expect(readStrata(a, S, strata)).toEqual(a);
  });

  it('reads the strata of a plan without trusting them', () => {
    const S = 4;
    const good = Array.from({ length: STRATA_DEPTH }, () => '1'.repeat(S * S));
    expect(readStrata(good, S, strata)).toEqual(good);
    expect(readStrata(good.slice(1), S, strata)).toBeUndefined();
    expect(readStrata([...good.slice(1), '1'.repeat(S * S - 1)], S, strata)).toBeUndefined();
    expect(readStrata([...good.slice(1), 'g'.repeat(S * S)], S, strata)).toBeUndefined();
    expect(readStrata('1111', S, strata)).toBeUndefined();
    expect(readStrata(null, S, strata)).toBeUndefined();
    // A row a tile deep from the ground down; the last one deeper down, the first one above the ground.
    expect([stratumRow(-0.5), stratumRow(0.04), stratumRow(1.2), stratumRow(9), stratumRow(NaN)]).toEqual([0, 0, 1, STRATA_DEPTH - 1, 0]);
  });
});

/** A kernel whose loaded places have all been planned by the Cartographer (offline). */
async function boot(chunks = new MemoryChunks()) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks });
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
  return { k, chunks };
}

const saved = (chunks: MemoryChunks) => (chunks as unknown as { m: Map<string, ChunkRecord> }).m;

describe('the strata in the world (T418)', () => {
  it('a place planned keeps its strata in its plan, the draft\'s; a plan of before has them again from its draft', async () => {
    const { k, chunks } = await boot();
    const S = k.config.chunkSize;
    const ch = k.chunks.get('0,0')!;
    expect(ch.stage).toBe('planned');
    const records = [...saved(chunks).entries()].filter(([key]) => key.endsWith(':0,0'));
    expect(records).toHaveLength(1);
    const plan = records[0]![1].plan;
    expect(plan.strata).toEqual(draftStrata(ch.draft, 0, 0, S, k.config.seed, k.palette, k.strata));
    expect(k.strataOf(ch)).toEqual(plan.strata);
    // The column under a tile: its stratum at every depth, the last one deeper down.
    const top = k.stratumAt(3, 4, 0.5)!;
    expect(top.layer).toBe('stratum');
    expect(top).toBe(k.strata[plan.strata![0]![4 * S + 3]!]);
    expect(k.stratumAt(3, 4, 40)).toBe(k.strata[plan.strata![STRATA_DEPTH - 1]![4 * S + 3]!]);
    expect(k.stratumAt(10_000, 10_000, 1)).toBeUndefined();

    // The same world, its plans of before (without strata): the same strata, from the draft, and nothing else changes.
    const before = new MemoryChunks();
    for (const [key, rec] of saved(chunks)) {
      const { strata: _, ...rest } = rec.plan;
      await before.save(key, { plan: rest });
    }
    const again = await boot(before);
    const ch2 = again.k.chunks.get('0,0')!;
    expect(ch2.plan!.strata).toBeUndefined();
    expect(ch2.tiles).toBe(ch.tiles);
    expect(again.k.strataOf(ch2)).toEqual(plan.strata);
  }, 90_000);
});

describe('the strata over the wire (T418)', () => {
  it('a thin client receives the strata with the place, once: a place sent again keeps them', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']!);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    const views: ChunkView[] = [];
    c.onMessage((m) => void views.push(...((m as { chunks?: ChunkView[] }).chunks ?? [])));
    server.connect(s);
    const session = new SessionClient(c, { id: 'anna', name: 'Anna' });
    await session.ready;
    const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    const thin = new ThinClient(mirror, session);
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        mirror.tick(1 / 60);
        thin.frame(1 / 60);
        server.tick(1 / 60);
      }
    };
    for (let i = 0; i < 80 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      run(1);
      await new Promise((r) => setTimeout(r, 25));
    }
    run(6);
    const ch = k.chunks.get('0,0')!;
    expect(ch.stage).toBe('planned');
    expect(mirror.chunks.get('0,0')!.strata).toEqual(k.strataOf(ch));
    expect(mirror.stratumAt(2, 3, 1.5)).toEqual(k.stratumAt(2, 3, 1.5));
    // A tile changed: the place goes again, without its strata, and the client keeps them.
    const sent = views.filter((v) => v.key === '0,0').length;
    const free = [...ch.tiles].findIndex((t, i) => i > 0 && !k.palette[t]?.solid && t !== ch.tiles[i - 1]);
    expect(k.setTile(free % k.config.chunkSize, Math.floor(free / k.config.chunkSize), ch.tiles[free - 1]!)).toBe(true);
    run(6);
    const again = views.filter((v) => v.key === '0,0').slice(sent);
    expect(again.length).toBeGreaterThan(0);
    expect(again.every((v) => v.strata === undefined)).toBe(true);
    expect(mirror.chunks.get('0,0')!.strata).toEqual(k.strataOf(ch));
  }, 90_000);
});
