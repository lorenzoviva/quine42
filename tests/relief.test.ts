// The relief of the simulation (ADR-0048): MarkovJunior's `Hills` read as two repeating heightmaps,
// deterministic, without seams, never a step a body cannot climb; the kernel stands bodies on it.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { chunkLevels, LEVEL, mend, Relief, RELIEF_PATH, waterLevels } from '../src/kernel/relief';

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

describe('flat lots', () => {
  /** Neighbours on land never more than two levels apart. */
  const worstStep = (lv: Int16Array, n: number, wet = (_: number) => false) => {
    let worst = 0;
    for (let i = 0; i < n * n; i++) {
      if (wet(i)) continue;
      if (i % n < n - 1 && !wet(i + 1)) worst = Math.max(worst, Math.abs(lv[i] - lv[i + 1]));
      if (i + n < n * n && !wet(i + n)) worst = Math.max(worst, Math.abs(lv[i] - lv[i + n]));
    }
    return worst;
  };

  it('lays a lot and its ring flat, bends the land around it and keeps the border', () => {
    // A slope rising a level a tile to the east, a lot in the middle.
    const n = 12;
    const slope = (c: number) => c;
    const lot = { x0: 4, y0: 4, x1: 7, y1: 6 };
    const lv = chunkLevels('g'.repeat(n * n), n, () => false, (c) => slope(c), [lot]);
    const flat = lv[4 * n + 4];
    expect(flat).toBe(6); // the median of 4, 5, 6, 7
    for (let r = 3; r <= 7; r++) for (let c = 3; c <= 8; c++) expect(lv[r * n + c], `${c},${r}`).toBe(flat);
    for (let i = 0; i < n; i++) {
      expect(lv[i]).toBe(slope(i));
      expect(lv[(n - 1) * n + i]).toBe(slope(i));
      expect(lv[i * n]).toBe(slope(0));
      expect(lv[i * n + n - 1]).toBe(slope(n - 1));
    }
    expect(worstStep(lv, n)).toBeLessThanOrEqual(2);
    // Without lots it is the relief.
    expect([...chunkLevels('g'.repeat(n * n), n, () => false, (c) => slope(c), [])]).toEqual(Array.from({ length: n * n }, (_, i) => slope(i % n)));
  });

  it('stays within reach of the border', () => {
    // A slope as steep as the relief gets, two levels a tile, up to a plateau: the median (6) is out of
    // reach of the border two tiles away, the lot is as near to it as that allows, its ring yields.
    const n = 10;
    const lv = chunkLevels('g'.repeat(n * n), n, () => false, (c) => Math.min(2 * c, 6), [{ x0: 2, y0: 3, x1: 5, y1: 6 }]);
    expect(lv[3 * n + 2]).toBe(4);
    expect(lv[3 * n + 1]).toBe(2);
    expect(lv[3 * n + 6]).toBe(4);
    expect(worstStep(lv, n)).toBeLessThanOrEqual(2);
  });

  it('leaves water to itself, and gives a tile to the larger of two lots that want it', () => {
    const n = 12;
    const tiles = 'w'.repeat(n) + 'g'.repeat(n * (n - 1));
    const small = { x0: 6, y0: 3, x1: 7, y1: 4 };
    const large = { x0: 1, y0: 3, x1: 4, y1: 7 };
    const lv = chunkLevels(tiles, n, (c) => c === 'w', (c, r) => (c + r) >> 1, [small, large]);
    for (let c = 0; c < n; c++) expect(lv[c]).toBe(0); // the lake, at its lowest tile
    // The ring of the large lot reaches column 5, the small lot's ring too: the large one has it.
    expect(lv[4 * n + 5]).toBe(lv[4 * n + 1]);
    expect(lv[3 * n + 6]).toBe(lv[4 * n + 7]);
    expect(worstStep(lv, n, (i) => tiles[i] === 'w')).toBeLessThanOrEqual(2);
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

  it('lays the lots of the planned places flat, their structures on them, the land around still climbable', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    for (let i = 0; i < 80; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
      if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
    }
    const S = k.config.chunkSize;
    // Every lot of a planned place is flat, its structure on it, and the land around it still climbable.
    let lots = 0;
    for (const ch of k.chunks.values()) {
      if (ch.stage !== 'planned') continue;
      for (const b of ch.buildings) {
        lots++;
        const h = k.groundAt(ch.cx * S + b.x0, ch.cy * S + b.y0);
        for (let row = b.y0 - 1; row <= b.y1 + 1; row++)
          for (let col = b.x0 - 1; col <= b.x1 + 1; col++) {
            const inner = col >= 1 && row >= 1 && col <= S - 2 && row <= S - 2;
            const lot = col >= b.x0 && row >= b.y0 && col <= b.x1 && row <= b.y1;
            if (!lot && !inner) continue;
            const x = ch.cx * S + col, y = ch.cy * S + row;
            // A ring tile may belong to a larger lot next to it.
            if (lot) expect(k.groundAt(x + 0.5, y + 0.5), `${ch.key} ${col},${row}`).toBe(h);
          }
        expect(k.groundAt(ch.cx * S + (b.x0 + b.x1 + 1) / 2, ch.cy * S + (b.y0 + b.y1 + 1) / 2)).toBe(h);
      }
      for (let i = 0; i < S * S; i++) {
        const x = ch.cx * S + (i % S), y = ch.cy * S + Math.floor(i / S);
        const land = (j: number) => k.palette[ch.tiles[j]]?.layer !== 'liquid';
        if (!land(i)) continue;
        if ((i % S) + 1 < S && land(i + 1)) expect(Math.abs(k.groundAt(x + 1, y) - k.groundAt(x, y))).toBeLessThanOrEqual(2 * LEVEL);
        if (i + S < S * S && land(i + S)) expect(Math.abs(k.groundAt(x, y + 1) - k.groundAt(x, y))).toBeLessThanOrEqual(2 * LEVEL);
      }
    }
    expect(lots).toBeGreaterThan(0);
    // The structures stand on their lots.
    for (const id of k.ecs.query('struttura', 'pos')) {
      const p = k.ecs.get(id, 'pos');
      expect(k.floorAt(p.x, p.y)).toBeGreaterThanOrEqual(k.groundAt(p.x, p.y));
    }
  }, 30_000);
});
