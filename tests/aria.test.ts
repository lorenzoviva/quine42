// The air and the breath (T446, ADR-0238, `docs/design/acqua-spazio.md` § 2.4): where a body breathes (the terrain, a closed vehicle's
// deck, the master's region, the environment, the body of the void), the need `oxygen` only in a world that counts the breath, drained out
// of the air by the kernel (not by `sys.needs`), slower with a suit, given back in the air and by a tank, and asphyxia as a death of the
// game. A world of today does not notice: no oxygen in its needs, the air everywhere.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { CAPSULE, Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { AIR_AGAIN, airOf, ASPHYXIATED, ASPHYXIA_HEALTH, breathOf, breathTick, NO_AIR, OXYGEN_DRAIN } from '../src/kernel/air';
import { DEFAULT_NATURE, NATURE_ACCEPTS, repairNature, terrainPhysics, voidTerrain } from '../src/kernel/nature';
import { masterRegion, regionAir, type Atlas } from '../src/kernel/atlas';
import { dockOf, islandOf } from '../src/kernel/islands';
import { vehicleSpecErrors, vehicleSpecOf } from '../src/kernel/vehicle';
import { apiErrors, describeEffect, validateEffects } from '../src/kernel/validator';
import { toItemDef } from '../src/kernel/agents/content';
import { WORLD_THEMES } from '../src/kernel/themes';
import type { FileMap } from '../src/kernel/types';

const S = 18;

/** A pack with a tank and a suit, as the Narrator of a world of the stars would write them. */
const AIR_PACK = {
  id: 'items.aria',
  name: 'Aria',
  kind: 'data',
  version: '0.1.0',
  description: 'bombole e tute',
  items: [
    { id: 'item.bombola', name: 'Bombola d’ossigeno', description: 'piena', category: 'tool', weight: 3, stack: 3, tags: ['aria'], glyph: '▯', color: '#d8e8f0', effects: { oxygen: 100 } },
    { id: 'item.tuta', name: 'Tuta pressurizzata', description: 'una tuta', category: 'clothing', weight: 4, stack: 1, tags: ['aria'], glyph: '◙', color: '#e0e0e0', slot: 'torso', bonus: { breath: 10 } },
  ],
};

function breathFiles(nature: Record<string, unknown> = {}): FileMap {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, oxygen: true, ...nature } }, null, 2) + '\n',
    'modules/items.aria/manifest.json': JSON.stringify(AIR_PACK, null, 2) + '\n',
  };
}

async function boot(files: FileMap) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  return k;
}

const ticks = (k: Kernel, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) k.tick(1 / 60);
};

/** The wanderer on a walked tile of the start, and that tile's terrain made airless (every tile of its code: a grating open to the void). */
function airless(k: Kernel) {
  const c = k.wandererCarpet();
  const code = k.tileAt(Math.floor(c.x), Math.floor(c.y))!;
  const was = k.palette[code];
  k.palette[code] = { ...was, air: false };
  return () => (k.palette[code] = was);
}

describe('where a body breathes (T446)', () => {
  it('the first that says, in order: a closed deck, the terrain’s none, the master’s region, the environment, the body of the void', () => {
    expect(airOf({ terrain: true })).toBe(true);
    expect(airOf({ terrain: false })).toBe(false);
    expect(airOf({ terrain: false, deck: true })).toBe(true);
    expect(airOf({ terrain: false, region: true })).toBe(false);
    expect(airOf({ terrain: true, region: false })).toBe(false);
    expect(airOf({ terrain: true, region: true, environment: false, body: 'asteroid' })).toBe(true);
    expect(airOf({ terrain: true, environment: false })).toBe(false);
    expect(airOf({ terrain: true, body: 'asteroid' })).toBe(false);
    expect(airOf({ terrain: true, body: 'station' })).toBe(true);
    // The terrain: true if not said, the void never.
    expect(terrainPhysics({ name: 'x', color: '#000000', solid: false, layer: 'ground' }).air).toBe(true);
    expect(terrainPhysics({ name: 'x', color: '#000000', solid: false, layer: 'ground', air: false }).air).toBe(false);
    expect(terrainPhysics(voidTerrain()).air).toBe(false);
  });

  it('a vehicle of the void holds air if it says nothing, another only if it says so; air is true or false', () => {
    expect(vehicleSpecOf({ medium: 'void' })!.air).toBe(true);
    expect(vehicleSpecOf({ medium: 'void', air: false })!.air).toBe(false);
    expect(vehicleSpecOf({ medium: 'water' })!.air).toBe(false);
    expect(vehicleSpecOf({ medium: 'land', air: true })!.air).toBe(true);
    expect(vehicleSpecErrors({ medium: 'void', air: 'yes' }).join()).toMatch(/air/);
    expect(vehicleSpecErrors({ medium: 'void', air: false })).toEqual([]);
  });

  it('a region of the master says it, true or false, never a region held; the Cartographer’s never', () => {
    const atlas: Atlas = { regions: [] };
    const envs = { villaggio: {} };
    const ok = masterRegion(atlas, { name: 'Luna Nuda', center: [6, 0], radius: 1, environment: 'villaggio', air: false }, envs);
    expect('region' in ok && ok.region.air).toBe(false);
    expect('region' in ok && regionAir(ok.region)).toBe(false);
    const dome = masterRegion(atlas, { name: 'Cupola', center: [6, 0], radius: 1, environment: 'villaggio', air: true }, envs);
    expect('region' in dome && regionAir(dome.region)).toBe(true);
    const none = masterRegion(atlas, { name: 'Valle', center: [6, 0], radius: 1, environment: 'villaggio' }, envs);
    expect('region' in none && regionAir(none.region)).toBeUndefined();
    expect(masterRegion(atlas, { name: 'Valle', center: [6, 0], radius: 1, environment: 'villaggio', air: 'no' }, envs)).toMatchObject({ errors: [expect.stringMatching(/aria/)] });
    expect(masterRegion(atlas, { name: 'Valle', center: [6, 0], radius: 1, kind: 'held', air: false }, envs)).toMatchObject({ errors: [expect.stringMatching(/trattenuta/)] });
    expect(regionAir({ id: 'r', name: 'r', description: '', environment: 'e', center: [5, 5], radius: 1, air: false })).toBeUndefined();
  });
});

describe('the breath (T446)', () => {
  it('runs out in about two minutes out of the air, ten times slower with a suit, comes back quickly in the air; then the health goes', () => {
    const n = { health: 100 } as { oxygen?: number; health: number; dead?: boolean };
    // A needs without oxygen gets it full.
    expect(breathTick(n, true, 1, 1 / 60)).toBe(false);
    expect(n.oxygen).toBe(100);
    for (let i = 0; i < 60 * 60; i++) breathTick(n, false, 1, 1 / 60);
    expect(n.oxygen).toBeCloseTo(100 - 60 * OXYGEN_DRAIN, 3);
    expect(n.oxygen).toBeCloseTo(50, 0);
    const suited = { oxygen: 100, health: 100 };
    for (let i = 0; i < 60 * 60; i++) breathTick(suited, false, 10, 1 / 60);
    expect(suited.oxygen).toBeCloseTo(95, 0);
    for (let i = 0; i < 3 * 60; i++) breathTick(n, true, 1, 1 / 60);
    expect(n.oxygen).toBe(100);
    // Out of oxygen: the health, quickly; at zero dead, once.
    const gasping = { oxygen: 0, health: 1 };
    breathTick(gasping, false, 1, 0.25);
    expect(gasping.health).toBeCloseTo(1 - ASPHYXIA_HEALTH * 0.25, 5);
    expect(breathTick(gasping, false, 1, 1)).toBe(true);
    expect(breathTick(gasping, false, 1, 1)).toBe(false);
    // Rule 7: no NaN, no time.
    const broken = { oxygen: Number.NaN, health: 50 };
    expect(breathTick(broken, false, Number.NaN, Number.NaN)).toBe(false);
    expect(broken.oxygen).toBe(100);
  });

  it('a suit is the largest breath bonus of what is worn, within 1-10', () => {
    expect(breathOf([])).toBe(1);
    expect(breathOf([{ defense: 3 }, { breath: 3 }, { breath: 40 }])).toBe(10);
    expect(breathOf([{ breath: 0.2 }, undefined, { breath: Number.NaN }])).toBe(1);
  });

  it('is open in the nature since T446; no theme brings it yet (the space of the Council is T450)', () => {
    expect(NATURE_ACCEPTS.oxygen).toEqual([false, true]);
    expect(repairNature({ oxygen: true })).toEqual({ ...DEFAULT_NATURE, oxygen: true });
    expect(repairNature({ oxygen: 'yes' }).oxygen).toBe(false);
    for (const t of WORLD_THEMES) expect(repairNature(t.nature).oxygen, t.id).toBe(false);
  });
});

describe('the Council and the validator (T446)', () => {
  it('a needs effect may give or take oxygen, said in words; a tank of the Narrator keeps it, a suit its breath', () => {
    const ctx = { palette: {}, item: () => undefined, module: () => undefined, loot: new Set<string>() };
    const v = validateEffects([{ type: 'needs', oxygen: 99 }], ctx);
    expect(v.effects).toEqual([{ type: 'needs', oxygen: 40 }]);
    expect(describeEffect(v.effects[0], { tile: () => undefined, item: () => undefined, module: () => undefined })).toBe('ossigeno +40');
    const tank = toItemDef({ name: 'Bombola', description: 'piena', category: 'tool', weight: 3, stack: 3, tags: [], look: 'una bombola', effects: { oxygen: 150 } }, new Set());
    expect(tank?.effects?.oxygen).toBe(100);
    const bread = toItemDef({ name: 'Pane', description: 'pane', category: 'food', weight: 1, stack: 3, tags: [], look: 'pane', effects: { hunger: 20 } }, new Set());
    expect(bread?.effects && 'oxygen' in bread.effects).toBe(false);
    const suit = toItemDef({ name: 'Tuta', description: 'tuta', category: 'clothing', weight: 4, stack: 1, tags: [], look: 'tuta', slot: 'torso', bonus: { breath: 10 } }, new Set());
    expect(suit?.bonus?.breath).toBe(10);
  });

  it('an environment says only air false; Lua reads world.air_at', async () => {
    const val = (await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() })).validator;
    const def = { name: 'Pozzo allagato', description: 'x', environment: 'indoor' as const, program: { type: 'sequence', children: [] } as never };
    expect(val.validateLayout('pozzo', { ...def, air: 'no' } as never, {}, []).join()).toMatch(/air/);
    expect(val.validateLayout('pozzo', { ...def, air: false }, {}, []).join()).not.toMatch(/air/);
    expect(apiErrors('if not world.air_at(1, 2) then log("niente aria") end')).toEqual([]);
  }, 60_000);
});

describe('a world of today (T446)', () => {
  it('has no oxygen in its needs and breathes everywhere, airless tiles or not', async () => {
    const k = await boot(bundledFiles);
    expect(k.config.nature.oxygen).toBe(false);
    airless(k);
    expect(k.breathing()).toBe(false);
    ticks(k, 1);
    expect(k.needs()!.oxygen).toBeUndefined();
  }, 60_000);
});

describe('a world that counts the breath (T446)', () => {
  it('gives the needs their oxygen, drains it out of the air with a word, gives it back with another', async () => {
    const k = await boot(breathFiles());
    const said: string[] = [];
    k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
    expect(k.needs()!.oxygen).toBe(100);
    expect(k.breathing()).toBe(true);
    const back = airless(k);
    ticks(k, 12);
    expect(k.needs()!.oxygen).toBeCloseTo(90, 0);
    expect(said.filter((t) => t === NO_AIR)).toHaveLength(1);
    back();
    ticks(k, 1);
    expect(k.needs()!.oxygen).toBe(100);
    expect(said).toContain(AIR_AGAIN);
  }, 60_000);

  it('a suit worn slows it ten times, a tank used fills it again', async () => {
    const k = await boot(breathFiles());
    airless(k);
    k.give('item.tuta', 1);
    k.give('item.bombola', 1);
    const at = (item: string) => k.inventory().slots.findIndex((s) => s?.item === item);
    k.wearSlot(at('item.tuta'));
    expect(Object.values(k.outfit())).toContain('item.tuta');
    ticks(k, 12);
    expect(k.needs()!.oxygen).toBeCloseTo(99, 0);
    k.needs()!.oxygen = 20;
    k.useSlot(at('item.bombola'));
    expect(k.needs()!.oxygen).toBeGreaterThan(99);
    expect(at('item.bombola')).toBe(-1);
  }, 60_000);

  it('out of oxygen the wanderer dies of asphyxia, a death of the game; a god does not', async () => {
    const k = await boot(breathFiles());
    const deaths: string[] = [];
    k.bus.on('ui:death', (d: { cause: string }) => deaths.push(d.cause));
    airless(k);
    Object.assign(k.needs()!, { oxygen: 0, health: 1 });
    for (let i = 0; i < 120 && !deaths.length; i++) k.tick(1 / 60);
    expect(deaths).toEqual([ASPHYXIATED]);
  }, 60_000);

  it('in the void: no air on the void nor on an asteroid, air on a station', async () => {
    const k = await boot(breathFiles({ geography: 'void', sky: 'stars' }));
    expect(k.airAt(1.5, 1.5)).toBe(true);
    await k.planAhead(5, 5);
    expect(k.airAt(5 * S + 3, 5 * S + 3)).toBe(false);
    let asteroid: { x: number; y: number } | undefined;
    for (let i = -6; i <= 6 && !asteroid; i++) for (let j = -6; j <= 6 && !asteroid; j++) if (islandOf(k.config.seed, i, j, 'void').body === 'asteroid') asteroid = islandOf(k.config.seed, i, j, 'void');
    expect(asteroid).toBeDefined();
    expect(k.airAt(Math.floor(asteroid!.x) + 0.5, Math.floor(asteroid!.y) + 0.5)).toBe(false);
    // Lua reads the same air.
    expect(k.airAt(Number.NaN, 0)).toBe(true);
  }, 60_000);

  it('aboard the capsule one breathes over the void: its deck holds the air', async () => {
    const k = await Kernel.boot({ files: breathFiles({ geography: 'void', sky: 'stars' }), store: memoryStore(), ai: new MockAiModels() });
    k.carpet()!.active = false;
    const d = dockOf(k.config.seed, islandOf(k.config.seed, 0, 0, 'void'))!;
    const cx = Math.floor(d.x / S), cy = Math.floor(d.y / S);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) await k.planAhead(cx + a, cy + b);
    const [c] = k.ecs.query('vehicle').filter((e) => k.ecs.get(e, 'module').id === CAPSULE);
    const fc = k.ecs.get(c, 'form');
    await k.forms.wait(fc.model, fc.seed, fc.tint);
    k.tick(1 / 60);
    Object.assign(k.carpet()!, { ox: Math.round(d.x), oy: Math.round(d.y) });
    const { ox, oy } = k.offset();
    const p = k.wandererPos();
    delete p.z;
    Object.assign(p, { x: d.land[0] + 0.5 - ox, y: d.land[1] + 0.5 - oy });
    k.tick(1 / 60);
    expect(k.breathing()).toBe(true);
    await k.perform(c, 'board');
    expect(k.aboard()).toBe(c);
    const w = k.wandererCarpet();
    expect(k.airAt(w.x, w.y)).toBe(false);
    expect(k.breathing()).toBe(true);
    ticks(k, 5);
    expect(k.needs()!.oxygen).toBe(100);
  }, 60_000);
});
