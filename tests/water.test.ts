// The water that flows (T51b, ADR-0094): a cellular automaton of the kernel; a hollow dug beside a lake
// fills, and the lake goes down by what it gave.

import { describe, expect, it } from 'vitest';
import { DEEP, WaterFlow, type WaterWorld } from '../src/kernel/water';

/** A flat land at level 10 with a lake at level 8 on the columns 0-9 of rows 0-9 (100 tiles), all loaded. */
function world(sea = 0): WaterWorld & { lake: Set<string> } {
  const lake = new Set<string>();
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) lake.add(`${c},${r}`);
  return {
    lake,
    loaded: (c, r) => c >= -5 && r >= -5 && c < 30 && r < 15,
    wet: (c, r) => lake.has(`${c},${r}`),
    surface: (c, r) => (lake.has(`${c},${r}`) ? 8 : 10),
    ground: () => 10,
    record: () => undefined,
    sea: () => sea,
  };
}

const settle = (f: WaterFlow, max = 20_000) => {
  let n = 0;
  while (f.step() && n < max) n++;
  return n;
};

describe('the water that flows (T51b)', () => {
  it('fills a hollow dug beside a lake, and the lake goes down by what it gave', () => {
    const w = world();
    const f = new WaterFlow(w);
    // A hollow of 20 tiles (columns 10-13, rows 0-4) dug 6 levels down to 4, beside the lake.
    const hollow: Array<[number, number]> = [];
    for (let r = 0; r < 5; r++) for (let c = 10; c < 14; c++) hollow.push([c, r]);
    for (const [c, r] of hollow) f.dig(c, r, -6);
    const before = 100 * DEEP;
    const steps = settle(f);
    expect(f.moving).toBe(false);
    expect(steps).toBeGreaterThan(10);
    // The amount is kept; one surface for lake and hollow: 100·(L−6) + 20·(L−4) = 200 → L = 22/3 (it was 8).
    expect(f.volume()).toBeCloseTo(before, 6);
    const surface = (c: number, r: number) => f.water(c, r)!.bed + f.water(c, r)!.water;
    expect(surface(5, 5)).toBeCloseTo(22 / 3, 1);
    expect(surface(12, 2)).toBeCloseTo(22 / 3, 1);
    const changed = f.changed(true);
    const dug = changed.filter((x) => x.col >= 10);
    expect(dug.length).toBeGreaterThanOrEqual(20);
    for (const x of dug.filter((x) => x.water > 1)) {
      expect(x.wet).toBe(true);
      expect(x.from).toBeDefined();
    }
    // The land around stays dry.
    expect(f.water(14, 2)?.water ?? 0).toBeLessThan(0.01);
  });

  it('is the same flow for the same dig (deterministic) and does nothing where nothing changed', () => {
    const run = () => {
      const f = new WaterFlow(world());
      for (let r = 0; r < 3; r++) f.dig(10, r, -4);
      for (let i = 0; i < 50; i++) f.step();
      return f.changed(true).map((x) => [x.col, x.row, x.water.toFixed(9)].join());
    };
    expect(run()).toEqual(run());
    const idle = new WaterFlow(world());
    expect(idle.step()).toBe(false);
    expect(idle.changed(true)).toEqual([]);
  });

  it('a hollow beside the sea fills to the sea and the sea stays where it is', () => {
    const w = world(8);
    const f = new WaterFlow(w);
    for (let r = 0; r < 5; r++) for (let c = 10; c < 14; c++) f.dig(c, r, -6);
    settle(f);
    const x = f.water(12, 2)!;
    expect(x.bed + x.water).toBeCloseTo(8, 1);
  });
});

describe('the kernel’s water (T51b)', () => {
  it('a hollow dug beside a pond across two places fills, the pond goes down, the plans keep it', async () => {
    const { Kernel } = await import('../src/kernel/kernel');
    const { bundledFiles } = await import('../src/kernel/bundle');
    const { memoryStore } = await import('../src/kernel/repo');
    const { MockAiModels } = await import('../src/kernel/ai/mock');
    const { LEVEL } = await import('../src/kernel/relief');
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...JSON.parse(bundledFiles['universe.json']), rilievo: { mare: 0 } }) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const S = k.config.chunkSize;
    for (let i = 0; i < 400 && (k.chunks.get('0,0')?.stage !== 'planned' || k.chunks.get('1,0')?.stage !== 'planned'); i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 5));
    }
    const [west, east] = [k.chunks.get('0,0')!, k.chunks.get('1,0')!];
    expect(west.stage).toBe('planned');
    expect(east.stage).toBe('planned');
    const water = Object.keys(k.palette).find((c) => k.palette[c].layer === 'liquid')!;
    const liquid = (x: number, y: number) => k.palette[k.tileAt(x, y) ?? '']?.layer === 'liquid';
    // A pond of 4 × 6 tiles across the border of the two places (columns S−2 … S+1, rows 5-10).
    const pond = (t: string, cols: number[]) => [...t].map((c, i) => (cols.includes(i % S) && i >= 5 * S && i < 11 * S ? water : c)).join('');
    west.tiles = pond(west.tiles, [S - 2, S - 1]);
    east.tiles = pond(east.tiles, [0, 1]);
    const before = k.groundAt(S - 1, 7) / LEVEL;
    expect(k.groundAt(S, 7) / LEVEL).toBe(before);
    // A hollow of 2 × 6 tiles beside it, in the east place, dug well below the pond.
    const hollow: Array<[number, number]> = [];
    for (let r = 5; r < 11; r++) for (const c of [S + 2, S + 3]) hollow.push([c, r]);
    const depth = Math.max(...hollow.map(([c, r]) => k.groundAt(c, r) / LEVEL)) - before + 3;
    for (const [c, r] of hollow) expect(k.dig(c, r, -depth)).toBe(true);
    expect(k.water.moving).toBe(true);
    for (let i = 0; i < 6000 && k.water.moving; i++) k.tick(1 / 60);
    expect(k.water.moving).toBe(false);
    // The hollow is water, at one level with the pond; the pond went down, and not to the bottom of the hollow.
    for (const [c, r] of hollow) expect(liquid(c, r), `${c},${r}`).toBe(true);
    const after = k.groundAt(S - 1, 7) / LEVEL;
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(before - 3);
    expect(k.groundAt(S + 3, 8) / LEVEL).toBe(after);
    expect(k.groundAt(S, 7) / LEVEL).toBe(after);
    // The plans keep the ground dug and the water.
    expect(Object.keys(east.plan!.scavi ?? {}).length).toBe(hollow.length);
    expect(Object.keys(east.plan!.acqua ?? {}).length).toBeGreaterThanOrEqual(hollow.length);
    expect(Object.keys(west.plan!.acqua ?? {}).length).toBeGreaterThan(0);
    // Nothing moves where nothing changed; a dig outside the planned world is refused.
    expect(k.dig(10_000, 10_000, -2)).toBe(false);
  }, 60_000);
});
