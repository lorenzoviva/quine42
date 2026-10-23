// The relief of the simulation (ADR-0048): MarkovJunior's `Hills` read as two repeating heightmaps,
// deterministic, without seams, never a step a body cannot climb; the kernel stands bodies on it.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { LEVEL, mend, Relief, RELIEF_PATH, waterLevels } from '../src/kernel/relief';

describe('relief', () => {
  const r = new Relief(12345);

  it('has hills: several levels, all of them reached', () => {
    const seen = new Set<number>();
    for (let y = -40; y < 120; y++) for (let x = -40; x < 120; x++) seen.add(r.level(x, y));
    expect(r.max).toBeGreaterThanOrEqual(4);
    expect(Math.min(...seen)).toBe(0);
    expect(seen.size).toBeGreaterThanOrEqual(4);
    expect(r.height(3, 7)).toBe(r.level(3, 7) * LEVEL);
  });

  it('never steps more than two levels between neighbours, across the seams and below zero too', () => {
    let worst = 0;
    // 64 and 45 are the sides of the two boxes: their seams are crossed here, and the origin.
    for (let y = -70; y < 140; y++)
      for (let x = -70; x < 140; x++) {
        const l = r.level(x, y);
        worst = Math.max(worst, Math.abs(l - r.level(x + 1, y)), Math.abs(l - r.level(x, y + 1)));
      }
    expect(worst).toBeLessThanOrEqual(2);
    expect(2 * LEVEL).toBeLessThanOrEqual(0.5);
  });

  it('is the same for the same seed, another for another', () => {
    const again = new Relief(12345);
    const other = new Relief(777);
    const cells = Array.from({ length: 200 }, (_, i) => [i * 7 - 300, i * 13 - 900]);
    expect(cells.map(([x, y]) => again.level(x, y))).toEqual(cells.map(([x, y]) => r.level(x, y)));
    expect(cells.map(([x, y]) => other.level(x, y))).not.toEqual(cells.map(([x, y]) => r.level(x, y)));
  });

  it('mends a heightmap so that no neighbour is more than one level apart, across the wrap', () => {
    const h = new Uint8Array([9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5]);
    mend(h, 4);
    expect(h[0]).toBe(1);
    expect(h[15]).toBe(1);
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        expect(Math.abs(h[x + y * 4] - h[((x + 1) % 4) + y * 4])).toBeLessThanOrEqual(1);
        expect(Math.abs(h[x + y * 4] - h[x + ((y + 1) % 4) * 4])).toBeLessThanOrEqual(1);
      }
  });

  it('lays each body of water flat, at the lowest of its tiles', () => {
    // Two lakes (w) on a 4×4 chunk, apart; the relief rises to the east.
    const tiles = 'ww.w' + 'w..w' + '...w' + 'gggg';
    const lv = waterLevels(tiles, 4, (c) => c === 'w', (c, r) => c + r);
    expect([lv[0], lv[1], lv[4]]).toEqual([0, 0, 0]);
    expect([lv[3], lv[7], lv[11]]).toEqual([3, 3, 3]);
    expect(lv[2]).toBe(-1);
    expect(lv[12]).toBe(-1);
  });
});

describe('the kernel on the relief', () => {
  it('stands on the ground of the universe’s relief, and falls back to Hills if the program is broken', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    const r = new Relief(k.config.seed);
    // Far from the loaded chunks there is no water: the ground is the relief.
    for (const [x, y] of [[1000.5, 0.5], [-1300.2, 40.9], [100, -700]]) {
      expect(k.groundAt(x, y)).toBe(r.height(Math.floor(x), Math.floor(y)));
      expect(k.floorAt(x, y)).toBeGreaterThanOrEqual(k.groundAt(x, y));
    }
    // Water in the loaded chunks lies flat, never above the relief under it.
    const S = k.config.chunkSize;
    for (const ch of k.chunks.values())
      for (let i = 0; i < S * S; i++) {
        if (k.palette[ch.tiles[i]]?.layer !== 'liquid') continue;
        const x = ch.cx * S + (i % S), y = ch.cy * S + Math.floor(i / S);
        expect(k.groundAt(x, y)).toBeLessThanOrEqual(r.height(x, y));
        if ((i % S) + 1 < S && k.palette[ch.tiles[i + 1]]?.layer === 'liquid') expect(k.groundAt(x + 1, y)).toBe(k.groundAt(x, y));
      }
    // A broken program is a fault, never a broken world.
    k.applyFiles({ ...k.files, [RELIEF_PATH]: '<sequence values="BA"><nonsense/></sequence>' });
    expect(k.groundAt(100, -700)).toBe(r.height(100, -700));
    expect(k.faults.has('universe:relief')).toBe(true);
  }, 30_000);
});
