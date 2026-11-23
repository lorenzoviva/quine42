// One level of the water for every tile, the same for the network and for the feet (T504, ADR-0258, rule 10).
//
// With the true relief (T475, ADR-0256) a place's network (`networkOf`) levels its water as if the place were alone, while the feet
// (`groundAt`, the collision, the server's step) read the field of the loaded world (`levelsOf`): a lake that touched the water of a lower
// place across its border went down to it, its land and its ramps stayed where they were. T503 saw it in Far West: in the place (4,1) the
// ramp from the lake started 8 levels over the water and could not be climbed, in (5,1) a lake of the massif fell from 53 to 0 into a pit.
// Now a place of the true relief is levelled alone in the world's field too; the places of the hills keep their field of before (the
// fingerprint of `lab/scripts/impronta-terreno.ts` does not change), and the water that flows does not pour over a fall between two places.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel, type Chunk } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { LEVEL, worldLevels, type WaterChunk } from '../src/kernel/relief';
import { STEP, type Network } from '../src/kernel/network';
import { WaterFlow, type WaterWorld } from '../src/kernel/water';
import { WORLD_THEMES } from '../src/kernel/themes';

describe('worldLevels with keepCliffs levels each place alone (T504)', () => {
  const S = 6;
  const wet = (c: string) => c === 'w';
  // A lake of a massif (west, its tiles at 20 and more) whose water touches across the border the water of a valley (east, at 0).
  const high: WaterChunk = { cx: 0, cy: 0, tiles: '......' + '..wwww' + '..wwww' + '..wwww' + '......' + '......' };
  const low: WaterChunk = { cx: 1, cy: 0, tiles: '......' + 'www...' + 'www...' + 'www...' + '......' + '......' };
  const level = (c: number, r: number) => (c < S ? 20 + (r % 2) : 0);

  it('keeps the water of each place its own, as the place alone has it, whatever is loaded around', () => {
    const both = worldLevels([high, low], S, wet, level, 0, undefined, true);
    const alone = [high, low].map((c) => worldLevels([c], S, wet, level, 0, undefined, true)[0]);
    expect([...both[0]]).toEqual([...alone[0]]);
    expect([...both[1]]).toEqual([...alone[1]]);
    // The lake of the massif lies at the lowest of its own tiles, not at the valley's water.
    expect(both[0][1 * S + 3]).toBe(20);
    expect(both[1][1 * S + 1]).toBe(0);
  });

  it('the hills (without keepCliffs) still follow a body of water across the border', () => {
    const both = worldLevels([high, low], S, wet, level, 0);
    expect(both[0][1 * S + 3]).toBe(0);
    expect(both[0][1 * S + 3]).toBe(both[1][1 * S + 1]);
  });
});

describe('the water that flows does not pour over a fall (T504)', () => {
  // A row of water: the tiles 0-4 a lake at 20 (bed 18), the tiles 5-9 a lake at 0 (bed -2); the fall between 4 and 5.
  const world = (joined?: WaterWorld['joined']): WaterWorld => ({
    loaded: (c, r) => r === 0 && c >= 0 && c < 10,
    wet: () => true,
    surface: (c) => (c < 5 ? 20 : 0),
    ground: (c) => (c < 5 ? 18 : -2),
    record: () => undefined,
    sea: () => -100,
    ...(joined ? { joined } : {}),
  });
  const settle = (flow: WaterFlow) => {
    for (let i = 0; i < 5000 && flow.step(); i++);
  };
  const lake = (flow: WaterFlow) => [0, 1, 2, 3, 4].reduce((v, c) => v + flow.water(c, 0)!.water, 0);

  it('a dig in the lake of the massif keeps its water on its side of the fall', () => {
    const fall = new WaterFlow(world((c, _r, tc) => (c < 5) === (tc < 5)));
    fall.dig(2, 0, -1);
    settle(fall);
    expect(lake(fall)).toBeCloseTo(10, 6);
    // The valley's water is not even taken into the flow: it is another body.
    expect(fall.water(5, 0)?.water ?? 2).toBeCloseTo(2, 6);
    // Without the fall the same dig empties it into the valley, as the flow of the hills would.
    const open = new WaterFlow(world());
    open.dig(2, 0, -1);
    settle(open);
    expect(lake(open)).toBeLessThan(1.5);
  });
});

/** The Far West of T503: a Genesis of the western offline, the places around (4,1) and (5,1) planned. */
async function farWest(): Promise<Kernel> {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  expect(await k.runGenesis(WORLD_THEMES.find((t) => t.id === 'western')!.text)).toBe(true);
  expect(k.nature().relief).toBe('true');
  for (let cy = 0; cy <= 2; cy++) for (let cx = 3; cx <= 6; cx++) await k.planAhead(cx, cy);
  return k;
}

describe('the network and the feet on the true relief (T504, the places of T503)', () => {
  it('have the same level on every tile of every planned place, the ramps climbed on the feet, the lake of the massif at its level', async () => {
    const k = await farWest();
    const S = k.config.chunkSize;
    const level = (c: number, r: number) => Math.round(k.groundAt(c + 0.5, r + 0.5) / LEVEL);
    const liquid = (code: string) => k.palette[code]?.layer === 'liquid';
    const planned = [...k.chunks.values()].filter((ch) => ch.stage === 'planned' && ch.network);
    expect(planned.length).toBe(12);
    let ramps = 0;
    for (const ch of planned) {
      const net = ch.network as Network;
      const at = (i: number) => [ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S)] as const;
      // Tile by tile, the network's level is the feet's.
      for (let i = 0; i < S * S; i++) expect(level(...at(i)), `${ch.key} tile ${i}`).toBe(net.levels[i]);
      // What the network joins, the step walks: two tiles beside each other it reached, within a step or both swum, meet no rise.
      for (let i = 0; i < S * S; i++) {
        if (!net.reach[i]) continue;
        for (const j of [i % S < S - 1 ? i + 1 : -1, i + S < S * S ? i + S : -1]) {
          if (j < 0 || !net.reach[j]) continue;
          const swum = liquid(ch.tiles[i]) && liquid(ch.tiles[j]);
          if (!swum && Math.abs(net.levels[i] - net.levels[j]) > STEP) continue;
          expect(k.riseOnStep(...at(i), ...at(j)), `${ch.key} ${i}-${j}`).toBe(false);
        }
      }
      // Every ramp is climbed on the feet: tiles beside each other, a step at most, no rise.
      for (const ramp of net.ramps) {
        ramps++;
        for (let s = 1; s < ramp.length; s++) {
          const [a, b] = [ramp[s - 1], ramp[s]];
          expect(Math.abs((a % S) - (b % S)) + Math.abs(Math.floor(a / S) - Math.floor(b / S))).toBe(1);
          expect(Math.abs(level(...at(a)) - level(...at(b))), `${ch.key} ramp ${ramp}`).toBeLessThanOrEqual(STEP);
          expect(k.riseOnStep(...at(a), ...at(b))).toBe(false);
        }
      }
    }
    expect(ramps).toBeGreaterThan(0);

    // (4,1): the ramp from the lake starts at the water, as the feet have it (in T503: 8 levels over it).
    const west = k.chunks.get('4,1') as Chunk;
    const westNet = west.network as Network;
    const fromLake = westNet.ramps.find((r) => liquid(west.tiles[r[r.length - 1]]) || liquid(west.tiles[r[0]]));
    expect(fromLake).toBeDefined();
    const water = fromLake!.find((i) => liquid(west.tiles[i]))!;
    const firstLand = fromLake![fromLake![0] === water ? 1 : fromLake!.length - 2];
    const lv = (i: number) => level(west.cx * S + (i % S), west.cy * S + Math.floor(i / S));
    expect(Math.abs(lv(firstLand) - lv(water))).toBeLessThanOrEqual(STEP);

    // (5,1): a lake of the massif lies at the lowest of its own tiles (53 in T503's world), not in a pit at the valley's water.
    const lakeChunk = k.chunks.get('5,1') as Chunk;
    const own = new Set<number>();
    let lowest = Infinity;
    for (let i = 0; i < S * S; i++) {
      if (!liquid(lakeChunk.tiles[i])) continue;
      const [c, r] = [lakeChunk.cx * S + (i % S), lakeChunk.cy * S + Math.floor(i / S)];
      own.add(level(c, r));
      lowest = Math.min(lowest, Math.max(k.seaLevel, k.relief.level(c, r)));
    }
    expect([...own]).toEqual([lowest]);
    expect(lowest).toBeGreaterThan(40);

    // Its west border is a fall onto the lake of (4,1): a dig beside it lets the water flow, never over the fall.
    const [fc, fr] = [lakeChunk.cx * S, lakeChunk.cy * S + 8];
    expect(liquid(k.tileAt(fc, fr)!) && liquid(k.tileAt(fc - 1, fr)!)).toBe(true);
    expect(level(fc, fr) - level(fc - 1, fr)).toBeGreaterThan(STEP);
    expect(k.dig(fc + 1, fr, -1)).toBe(true);
    for (let i = 0; i < 4000 && k.water.step(); i++);
    expect(k.water.water(fc - 1, fr)).toBeUndefined();
    expect(k.water.water(fc, fr)!.water).toBeGreaterThan(1.5);
  }, 120_000);
});
