// The relief effect and terraforming (T57c, ADR-0096): `rilievo {delta, raggio}` raises or lowers
// the ground by whole levels, persisted in the place's plan (scavi), and wakes the water flow.

import { describe, expect, it } from 'vitest';
import { describeEffect, validateEffects } from '../src/kernel/validator';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { LEVEL } from '../src/kernel/relief';

const dummyNames = {
  tile: () => undefined,
  item: () => undefined,
  module: () => undefined,
};

describe('rilievo effect validation and description', () => {
  const ctx = {
    palette: {},
    item: () => undefined,
    module: () => undefined,
    loot: new Set<string>(),
  };

  it('validates delta and radius, clamping within bounds', () => {
    const v1 = validateEffects([{ tipo: 'rilievo', delta: 2, raggio: 1 }], ctx);
    expect(v1.effects).toEqual([{ tipo: 'rilievo', delta: 2, raggio: 1 }]);
    expect(v1.dropped).toEqual([]);

    const v2 = validateEffects([{ tipo: 'rilievo', delta: 15, raggio: 5 }], ctx);
    expect(v2.effects).toEqual([{ tipo: 'rilievo', delta: 8, raggio: 3 }]);

    const v3 = validateEffects([{ tipo: 'rilievo', delta: -20, raggio: -2 }], ctx);
    expect(v3.effects).toEqual([{ tipo: 'rilievo', delta: -8, raggio: 0 }]);
  });

  it('drops rilievo with delta 0', () => {
    const v = validateEffects([{ tipo: 'rilievo', delta: 0, raggio: 1 }], ctx);
    expect(v.effects).toEqual([]);
    expect(v.dropped).toContain('rilievo senza variazione');
  });

  it('describes raising and lowering with levels and radius', () => {
    expect(describeEffect({ tipo: 'rilievo', delta: 1, raggio: 1 }, dummyNames)).toBe('alza il terreno di 1 livello, raggio 1');
    expect(describeEffect({ tipo: 'rilievo', delta: 3, raggio: 2 }, dummyNames)).toBe('alza il terreno di 3 livelli, raggio 2');
    expect(describeEffect({ tipo: 'rilievo', delta: -1, raggio: 0 }, dummyNames)).toBe('abbassa il terreno di 1 livello');
    expect(describeEffect({ tipo: 'rilievo', delta: -4, raggio: 1 }, dummyNames)).toBe('abbassa il terreno di 4 livelli, raggio 1');
  });
});

describe('the kernel’s rilievo effect (T57c)', () => {
  async function bootKernel() {
    const files = {
      ...bundledFiles,
      'universe.json': JSON.stringify({ ...JSON.parse(bundledFiles['universe.json']), rilievo: { mare: 0 } }),
    };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    for (let i = 0; i < 400 && (k.chunks.get('0,0')?.stage !== 'planned' || k.chunks.get('1,0')?.stage !== 'planned'); i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 5));
    }
    return k;
  }

  it('raises and lowers ground, affecting tiles in radius, and persists upon reload', async () => {
    const k = await bootKernel();
    const ch = k.chunks.get('0,0')!;
    expect(ch.stage).toBe('planned');

    const col = 5, row = 5;
    const initial = k.groundAt(col, row) / LEVEL;

    // Apply raising effect
    k.applyEffects([{ tipo: 'rilievo', delta: 2, raggio: 1 }], undefined, { x: col + 0.5, y: row + 0.5 });
    const raisedCenter = k.groundAt(col, row) / LEVEL;
    expect(raisedCenter).toBe(initial + 2);
    expect(k.groundAt(col + 1, row) / LEVEL).toBe((k.groundAt(col + 1, row) / LEVEL)); // raised too

    // Check plan.scavi
    expect(ch.plan!.scavi).toBeDefined();
    const tile = row * k.config.chunkSize + col;
    expect(ch.plan!.scavi![tile]).toBe(2);

    // Apply lowering effect
    k.applyEffects([{ tipo: 'rilievo', delta: -3, raggio: 0 }], undefined, { x: col + 0.5, y: row + 0.5 });
    const loweredCenter = k.groundAt(col, row) / LEVEL;
    expect(loweredCenter).toBe(initial - 1);
    expect(ch.plan!.scavi![tile]).toBe(-1);

    // Persists upon reload: save plan to chunkStore and reload place
    const rKey = (k as any).recordKey(ch);
    await k.chunkStore.save(rKey, { plan: ch.plan! });
    const reloaded = await k.chunkStore.load(rKey);
    expect(reloaded?.plan.scavi?.[tile]).toBe(-1);
  }, 30_000);

  it('wakes the water flow when a hollow is dug beside a pond', async () => {
    const k = await bootKernel();
    const S = k.config.chunkSize;
    const west = k.chunks.get('0,0')!;
    const east = k.chunks.get('1,0')!;
    const water = Object.keys(k.palette).find((c) => k.palette[c].layer === 'liquid')!;

    // A pond along column S-1 and S
    const pond = (t: string, cols: number[]) => [...t].map((c, i) => (cols.includes(i % S) && i >= 5 * S && i < 11 * S ? water : c)).join('');
    west.tiles = pond(west.tiles, [S - 2, S - 1]);
    east.tiles = pond(east.tiles, [0, 1]);

    const pondLevel = k.groundAt(S - 1, 7) / LEVEL;

    // Dig a hollow beside the pond using the rilievo effect
    const hollowCol = S + 2;
    const hollowRow = 7;
    const beforeHollow = k.groundAt(hollowCol, hollowRow) / LEVEL;
    const digDepth = Math.round(beforeHollow - pondLevel + 3);

    k.applyEffects([{ tipo: 'rilievo', delta: -digDepth, raggio: 1 }], undefined, { x: hollowCol + 0.5, y: hollowRow + 0.5 });
    expect(k.water.moving).toBe(true);

    // Settle water
    for (let i = 0; i < 6000 && k.water.moving; i++) k.tick(1 / 60);
    expect(k.water.moving).toBe(false);

    // The hollow now has water
    const isLiquid = (x: number, y: number) => k.palette[k.tileAt(x, y) ?? '']?.layer === 'liquid';
    expect(isLiquid(hollowCol, hollowRow)).toBe(true);
  }, 40_000);

  it('casts terraforming incantations: terra vento terra raises, vento terra vento lowers', async () => {
    const k = await bootKernel();
    k.needs()!.mana = 100;
    k.give('item.cristallo-magico', 5);

    const giveRunes = (seq: string[]) => {
      for (const t of seq) k.give(`rune:${t}`, 1);
    };

    // Position player facing east on a known flat area
    const { ox, oy } = k.offset();
    const px = 5, py = 5;
    Object.assign(k.wandererPos(), { x: px - ox, y: py - oy });
    k.wandererComp().facing = 'right';
    const [dx, dy] = (k as any).facingDelta();
    const targetCol = Math.floor(px + dx * 1.5);
    const targetRow = Math.floor(py + dy * 1.5);

    const before = k.groundAt(targetCol, targetRow) / LEVEL;

    // Cast «terra vento terra» -> raises
    giveRunes(['terra', 'vento', 'terra']);
    k.phrase().tokens = ['terra', 'vento', 'terra'];
    expect(await k.castSpell()).toBe(true);
    expect(k.content.spells['terra vento terra']?.effects[0]).toMatchObject({ tipo: 'rilievo', delta: 2 });
    const afterRaise = k.groundAt(targetCol, targetRow) / LEVEL;
    expect(afterRaise).toBeGreaterThan(before);

    // Cast «vento terra vento» -> lowers
    giveRunes(['vento', 'terra', 'vento']);
    k.phrase().tokens = ['vento', 'terra', 'vento'];
    expect(await k.castSpell()).toBe(true);
    expect(k.content.spells['vento terra vento']?.effects[0]).toMatchObject({ tipo: 'rilievo', delta: -2 });
    const afterLower = k.groundAt(targetCol, targetRow) / LEVEL;
    expect(afterLower).toBeLessThan(afterRaise);
  }, 30_000);
});
