// The nature of the world and the primitives of its physics (T437, ADR-0224): how a body crosses a tile (walk, swim, none) as data within
// the kernel's limits; the water codes swum in every palette; the Physicist within the layer; the nature fixed at the Genesis like the
// game, repaired to what the kernel can make true, read by Lua with `world.nature()` and never written by it.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { BASE_CODES, toPalette } from '../src/kernel/agents/genesis';
import { crossingOf, DEFAULT_NATURE, NATURE_ACCEPTS, physicsOf, repairNature, SWIM_FATIGUE, SWIM_PACE, terrainPhysics, terrainPhysicsErrors, WATER_CODES } from '../src/kernel/nature';
import { readConfig } from '../src/kernel/universe';
import { apiErrors, LUA_API } from '../src/kernel/validator';
import { playerFiles } from '../src/session/files';
import { WORLD_THEMES } from '../src/kernel/themes';
import type { TerrainDef } from '../src/kernel/types';

const tile = (t: Partial<TerrainDef>): TerrainDef => ({ name: 'x', color: '#123456', solid: true, ...t });
const seedTiles = () => JSON.parse(bundledFiles['modules/world.terrain/manifest.json']).tiles as Record<string, TerrainDef>;

describe('how a body crosses a tile (T437)', () => {
  it('solid says what is walked, as always; a liquid that says so is swum; nothing escapes the three', () => {
    expect(crossingOf(tile({ solid: false }))).toBe('walk');
    expect(crossingOf(tile({ solid: true, layer: 'rock' }))).toBe('none');
    expect(crossingOf(tile({ solid: true, layer: 'liquid' }))).toBe('none');
    expect(crossingOf(tile({ solid: true, layer: 'liquid', cross: 'swim' }))).toBe('swim');
    // Swimming is only in a liquid; what is walked is walked whatever `cross` says; nothing is nothing.
    expect(crossingOf(tile({ solid: true, layer: 'ground', cross: 'swim' }))).toBe('none');
    expect(crossingOf(tile({ solid: false, layer: 'liquid', cross: 'none' }))).toBe('walk');
    expect(crossingOf(tile({ solid: true, cross: 'fly' as never }))).toBe('none');
    expect(crossingOf(undefined)).toBe('none');
  });

  it('the physics read within the limits: a number that is not one, or out of range, is the nearest it may be', () => {
    expect(terrainPhysics(tile({ solid: false, speed: 9 }))).toEqual({ cross: 'walk', pace: 1.5, fatigue: 1, air: true });
    expect(terrainPhysics(tile({ solid: true, layer: 'liquid', cross: 'swim' }))).toEqual({ cross: 'swim', pace: SWIM_PACE, fatigue: SWIM_FATIGUE, depth: 'deep', air: true });
    expect(terrainPhysics(tile({ solid: true, layer: 'liquid', cross: 'swim', speed: NaN, fatigue: 40, depth: 'shallow', air: false }))).toEqual({ cross: 'swim', pace: SWIM_PACE, fatigue: 6, depth: 'shallow', air: false });
    expect(terrainPhysics(tile({ solid: true, layer: 'liquid', cross: 'swim', speed: 1 })).pace).toBe(0.6);
    expect(terrainPhysics(undefined)).toEqual({ cross: 'none', pace: 1, fatigue: 1, air: true });
  });

  it('the validator refuses what contradicts itself or leaves the limits, and lets a terrain of before be', () => {
    const errs = (t: Record<string, unknown>) => terrainPhysicsErrors('w', { name: 'acqua', color: '#000000', ...t });
    expect(errs({ solid: true, layer: 'liquid' })).toEqual([]);
    expect(errs({ solid: true, layer: 'liquid', cross: 'swim', depth: 'shallow', speed: 0.4, fatigue: 2 })).toEqual([]);
    expect(errs({ solid: false, layer: 'ground', cross: 'walk', air: false })).toEqual([]);
    expect(errs({ solid: true, cross: 'fly' })[0]).toMatch(/cross deve essere/);
    expect(errs({ solid: true, cross: 'walk' })[0]).toMatch(/si contraddicono/);
    expect(errs({ solid: false, layer: 'liquid', cross: 'swim' })[0]).toMatch(/si contraddicono/);
    expect(errs({ solid: true, layer: 'ground', cross: 'swim' })[0]).toMatch(/solo un liquido/);
    expect(errs({ solid: true, layer: 'rock', cross: 'none', depth: 'deep' })[0]).toMatch(/depth/);
    expect(errs({ solid: true, layer: 'liquid', cross: 'swim', depth: 'abyss' })[0]).toMatch(/depth/);
    expect(errs({ solid: true, layer: 'liquid', cross: 'swim', fatigue: 0 })[0]).toMatch(/fatigue/);
    expect(errs({ solid: true, layer: 'liquid', cross: 'swim', speed: 1 })[0]).toMatch(/a nuoto speed/);
    expect(errs({ solid: false, air: 'sì' })[0]).toMatch(/air/);
  });

  it('the seed says it of every terrain: its water is swum, lava is not crossed', () => {
    const tiles = seedTiles();
    for (const [code, t] of Object.entries(tiles)) {
      expect(terrainPhysicsErrors(code, t as never), code).toEqual([]);
      expect(t.cross, code).toBe(crossingOf(t));
    }
    expect(Object.entries(tiles).filter(([, t]) => t.cross === 'swim').map(([c]) => c).sort()).toEqual(['o', 'w']);
    expect(tiles.w).toMatchObject({ solid: true, cross: 'swim', depth: 'shallow', speed: 0.4 });
    expect(tiles.o).toMatchObject({ solid: true, cross: 'swim', depth: 'deep', speed: 0.4 });
    expect(tiles.v).toMatchObject({ layer: 'liquid', solid: true, cross: 'none' });
  });
});

describe('the palette of a Genesis (T437)', () => {
  const raw = (code: string, layer: TerrainDef['layer'], extra: Record<string, unknown> = {}) => ({ code, name: code, description: '', color: '#123456', layer: layer!, solid: false, speed: 1, ...extra });

  it('the base codes keep their meaning: w and o swum, with their depth and the pace of swimming', () => {
    expect(BASE_CODES.w.cross).toBe('swim');
    expect(BASE_CODES.o.cross).toBe('swim');
    for (const [code, b] of Object.entries(BASE_CODES)) expect(b.cross === 'walk', code).toBe(!b.solid);
    const p = toPalette([raw('w', 'ground', { solid: false, speed: 1 }), raw('o', 'liquid', { speed: 0.5, fatigue: 9 }), raw('g', 'liquid', { solid: true })]);
    expect(p.w).toMatchObject({ layer: 'liquid', solid: true, cross: 'swim', depth: WATER_CODES.w, speed: SWIM_PACE });
    expect(p.o).toMatchObject({ layer: 'liquid', solid: true, cross: 'swim', depth: 'deep', speed: 0.5, fatigue: 6 });
    expect(p.g).toMatchObject({ layer: 'ground', solid: false, cross: 'walk' });
  });

  it('the Physicist says within the layer: ground walked or not, another liquid swum or not (lava nobody said of is not crossed)', () => {
    expect(physicsOf('wall', { cross: 'walk' })).toMatchObject({ solid: true, cross: 'none' });
    expect(physicsOf('vegetation', { cross: 'swim' })).toMatchObject({ solid: true, cross: 'none' });
    expect(physicsOf('door', { cross: 'none' })).toMatchObject({ solid: false, cross: 'walk' });
    expect(physicsOf('ground', { cross: 'swim' })).toMatchObject({ solid: false, cross: 'walk' });
    expect(physicsOf('ground', { cross: 'none' })).toMatchObject({ solid: true, cross: 'none' });
    expect(physicsOf('ground', { solid: true })).toMatchObject({ solid: true, cross: 'none' });
    expect(physicsOf('liquid', {})).toMatchObject({ solid: true, cross: 'none' });
    expect(physicsOf('liquid', { cross: 'swim', speed: 0.3, depth: 'shallow' })).toEqual({ solid: true, cross: 'swim', speed: 0.3, depth: 'shallow' });
    expect(physicsOf('ground', { speed: 7 })).toMatchObject({ speed: 1.5 });
    // Every terrain of a palette says how it is crossed, and the validator takes it.
    const p = toPalette(Object.keys(BASE_CODES).map((c) => raw(c, 'ground')));
    for (const [code, t] of Object.entries(p)) expect(terrainPhysicsErrors(code, t as never), code).toEqual([]);
  });

  it('an offline Genesis writes a palette whose water is swum, and the nature of its theme', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(await k.runGenesis(WORLD_THEMES[5].text)).toBe(true);
    const tiles = JSON.parse(k.repo.working['modules/world.terrain/manifest.json']).tiles as Record<string, TerrainDef>;
    expect(crossingOf(tiles.w)).toBe('swim');
    expect(crossingOf(tiles.o)).toBe('swim');
    expect(crossingOf(k.palette.o)).toBe('swim');
    for (const t of Object.values(tiles)) expect(t.cross).toBe(crossingOf(t));
    // The pirates bring the archipelago (T441), the only nature a theme brings yet.
    expect(JSON.parse(k.repo.working['universe.json']).nature).toEqual({ ...DEFAULT_NATURE, geography: 'archipelago' });
    expect(k.nature()).toEqual({ ...DEFAULT_NATURE, geography: 'archipelago' });
  }, 60_000);
});

describe('the nature of the world (T437)', () => {
  it('is repaired to what this kernel can make true: anything else is the world of today', () => {
    expect(repairNature(undefined)).toEqual(DEFAULT_NATURE);
    expect(repairNature({ geography: 'void', sky: 'stars', day: 0, gravity: 9, oxygen: true })).toEqual(DEFAULT_NATURE);
    // The archipelago is open since T441.
    expect(repairNature({ geography: 'archipelago', sky: 'stars' })).toEqual({ ...DEFAULT_NATURE, geography: 'archipelago' });
    // The gravity is open since T447: 0.2-2, anything else the earth's.
    expect(repairNature({ geography: 'void', gravity: 0.3 })).toEqual({ ...DEFAULT_NATURE, gravity: 0.3 });
    expect(repairNature({ gravity: 0.1 }).gravity).toBe(1);
    expect(repairNature({ geography: 'continent', day: NaN, gravity: '1' })).toEqual(DEFAULT_NATURE);
    expect(repairNature([1, 2])).toEqual(DEFAULT_NATURE);
    // What it accepts is a list a task widens: the world of today, the gravity of T447, the archipelago of T441.
    expect(NATURE_ACCEPTS).toEqual({ geography: ['continent', 'archipelago'], sky: ['earth'], day: [600, 600], gravity: [0.2, 2], oxygen: [false] });
    expect(readConfig(bundledFiles).config.nature).toEqual(DEFAULT_NATURE);
    for (const t of WORLD_THEMES) expect(repairNature(t.nature), t.id).toEqual(t.id === 'pirates' ? { ...DEFAULT_NATURE, geography: 'archipelago' } : DEFAULT_NATURE);
  });

  it('is fixed like the game: a universe.json that says otherwise later is written back', async () => {
    {
      const cfg = JSON.parse(bundledFiles['universe.json']);
      const light = { ...DEFAULT_NATURE, gravity: 0.4 };
      const k = await Kernel.boot({ files: { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, nature: light }, null, 2) + '\n' }, store: memoryStore(), ai: new MockAiModels() });
      expect(k.nature()).toEqual(light);
      const heavy = { ...k.files, 'universe.json': JSON.stringify({ ...JSON.parse(k.files['universe.json']), nature: { ...light, gravity: 2 } }, null, 2) + '\n' };
      k.applyFiles(heavy);
      expect(k.nature()).toEqual(light);
      expect(JSON.parse(k.repo.working['universe.json']).nature).toEqual(light);
      expect(k.feed().some((e) => /natura del mondo/.test(e.text))).toBe(true);
    }
  });

  it('Lua reads it with world.nature(), a copy: what Lua changes of it is its own', async () => {
    expect(LUA_API.world).toContain('nature');
    expect(apiErrors('local n = world.nature(); log(n.gravity)')).toEqual([]);
    const files = {
      ...bundledFiles,
      'modules/sys.natura/manifest.json': JSON.stringify({ id: 'sys.natura', name: 'Natura', kind: 'system', logic: 'logic.lua', order: 95 }),
      'modules/sys.natura/logic.lua': `local M = {}
function M.update(dt)
  local n = world.nature()
  n.gravity = 9
  n.geography = "void"
  local again = world.nature()
  world.store_set("letta", { geography = again.geography, sky = again.sky, day = again.day, gravity = again.gravity, oxygen = again.oxygen })
end
return M
`,
    };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    expect(k.faults.list().filter((f) => f.key.startsWith('module:sys.natura'))).toEqual([]);
    expect(k.stores.get('sys.natura', 'letta')).toEqual(DEFAULT_NATURE);
    expect(k.nature()).toEqual(DEFAULT_NATURE);
  });

  it('goes to the clients with universe.json, and the terrains with how they are crossed', () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, nature: DEFAULT_NATURE }) };
    const shown = playerFiles(files);
    expect(JSON.parse(shown['universe.json']).nature).toEqual(DEFAULT_NATURE);
    expect(JSON.parse(shown['universe.json']).ai).toBeUndefined();
    const tiles = JSON.parse(shown['modules/world.terrain/manifest.json']).tiles;
    expect(tiles.w).toMatchObject({ cross: 'swim', depth: 'shallow' });
    expect(tiles.g).toMatchObject({ cross: 'walk' });
  });
});
