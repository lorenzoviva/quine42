// The archipelago (T441, ADR-0228): the islands of the kernel, from the seed alone; the longest strait measured on the swimming body and the
// islets the kernel puts where a strait would be longer (rule 10); the islands that never move; the open sea planned without a call; the
// Cartographer who names an island with the first place on it; `world.region_at` and `world.islands` for Lua, read only.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { memoryStore } from '../src/kernel/repo';
import { DEFAULT_NATURE, gaitOf, TERRAIN_LIMITS } from '../src/kernel/nature';
import { ATLAS_FILE, islandRegion, readAtlas, regionAt } from '../src/kernel/atlas';
import {
  BEACH,
  BORN_ENERGY,
  groundAt,
  ISLAND_PITCH,
  islandDraft,
  islandOf,
  islandOfPlace,
  islandsNear,
  isletBetween,
  MAX_STRAIT,
  OPEN_SEA,
  routeGap,
  SHALLOWS,
  shoreAt,
  straitCost,
  type Island,
} from '../src/kernel/islands';
import { apiErrors, LUA_API } from '../src/kernel/validator';
import { playerFiles } from '../src/session/files';

const S = 18;
const SEEDS = Array.from({ length: 60 }, (_, i) => 1 + i * 7919);

/** The local models, writing down the plans asked. */
class Recording extends MockAiModels {
  plans: string[] = [];
  async text(call: TextCall): Promise<string> {
    if (call.task === 'chunk.plan') {
      const d = call.data as { cx: number; cy: number };
      this.plans.push(`${d.cx},${d.cy}`);
    }
    return super.text(call);
  }
}

function archipelagoFiles(extra: Record<string, string> = {}) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, geography: 'archipelago' } }, null, 2) + '\n', ...extra };
}

describe('the longest strait, measured on the swimming body (T441)', () => {
  it('costs a minute and a sixth of the energy in the seed’s sea, and less than a wanderer is born with in the worst sea', () => {
    const seed = straitCost(MAX_STRAIT, { pace: 0.4, fatigue: 3 });
    expect(seed.seconds).toBeCloseTo(60, 5);
    expect(seed.energy).toBeLessThan(18);
    expect(seed.health).toBeCloseTo(36, 5);
    // The most tiring sea the Physicist may write, under the gravity with the heaviest gait.
    const worst = straitCost(MAX_STRAIT, { pace: TERRAIN_LIMITS.swimPace[0], fatigue: TERRAIN_LIMITS.fatigue[1] }, 0.2);
    expect(gaitOf(0.2)).toBeCloseTo(0.9, 5);
    expect(worst.energy).toBeLessThan(BORN_ENERGY);
    // And with no energy left, drowning, the health still holds over it.
    expect(worst.health).toBeLessThan(100);
    // Longer than the 4 places the study proposed.
    expect(MAX_STRAIT / S).toBeGreaterThan(4);
  });
});

describe('the islands of the kernel (T441)', () => {
  it('are the seed’s and nothing else’s: the same island for the same cell, the start on the largest, at the origin', () => {
    expect(islandOf(7, 3, -2)).toEqual(islandOf(7, 3, -2));
    expect(islandOf(7, 3, -2)).not.toEqual(islandOf(8, 3, -2));
    for (const seed of SEEDS) {
      const start = islandOf(seed, 0, 0);
      expect([start.x, start.y]).toEqual([0, 0]);
      // The first place is land, well inland.
      for (let a = 0; a < 16; a++) expect(shoreAt(start, (a / 16) * Math.PI * 2)).toBeGreaterThan(S * Math.SQRT2 + BEACH);
    }
  });

  it('never overlap, and between neighbours no water is longer than the longest strait: directly, or through the islet the kernel puts there', () => {
    let islets = 0;
    let pairs = 0;
    for (const seed of SEEDS)
      for (let i = -3; i <= 3; i++)
        for (let j = -3; j <= 3; j++) {
          const a = islandOf(seed, i, j);
          for (const b of [islandOf(seed, i + 1, j), islandOf(seed, i, j + 1), islandOf(seed, i + 1, j + 1), islandOf(seed, i + 1, j - 1)]) expect(routeGap(a, b).gap).toBeGreaterThan(2 * SHALLOWS);
          for (const b of [islandOf(seed, i + 1, j), islandOf(seed, i, j + 1)]) {
            pairs++;
            const islet = isletBetween(seed, a, b);
            if (!islet) {
              expect(routeGap(a, b).gap).toBeLessThanOrEqual(MAX_STRAIT);
              continue;
            }
            islets++;
            expect(routeGap(a, b).gap).toBeGreaterThan(MAX_STRAIT);
            expect(routeGap(a, islet).gap).toBeLessThanOrEqual(MAX_STRAIT);
            expect(routeGap(islet, b).gap).toBeLessThanOrEqual(MAX_STRAIT);
            expect(routeGap(a, islet).gap).toBeGreaterThan(2 * SHALLOWS);
          }
        }
    // Islets are not rare, nor the rule: the islands are far apart, about ten places from centre to centre.
    expect(islets / pairs).toBeGreaterThan(0.05);
    expect(islets / pairs).toBeLessThan(0.4);
    expect(ISLAND_PITCH / S).toBe(10);
  });

  it('on the tiles: from the start every island of the chain is reached without swimming more than the longest strait', () => {
    // The ground of 5 × 5 cells around the start, tile by tile, and a swim measured in steps of 1 and √2 (it overestimates a straight line
    // by at most 8 %: the margin of the comparison).
    const seed = 4242;
    const half = Math.round(2.5 * ISLAND_PITCH);
    const side = 2 * half;
    const land = new Uint8Array(side * side);
    const features = islandsNear(seed, 0, 0, half * Math.SQRT2);
    for (let y = 0; y < side; y++)
      for (let x = 0; x < side; x++) {
        const g = groundAt(features, x - half + 0.5, y - half + 0.5).ground;
        land[y * side + x] = g === 'land' || g === 'beach' ? 1 : 0;
      }
    const reached = new Uint8Array(side * side);
    const flood = (from: number) => {
      const stack = [from];
      reached[from] = 1;
      while (stack.length) {
        const t = stack.pop()!;
        const x = t % side, y = (t / side) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          const n = ny * side + nx;
          if (nx >= 0 && ny >= 0 && nx < side && ny < side && land[n] && !reached[n]) {
            reached[n] = 1;
            stack.push(n);
          }
        }
      }
    };
    flood(half * side + half);
    const limit = MAX_STRAIT * 1.083;
    for (let wave = 0; wave < 60; wave++) {
      // From every tile of land reached, through the water only, as far as a strait goes.
      const dist = new Float32Array(side * side).fill(Infinity);
      const queue: number[] = [];
      for (let t = 0; t < side * side; t++) if (reached[t]) (dist[t] = 0), queue.push(t);
      const found: number[] = [];
      for (let qi = 0; qi < queue.length; qi++) {
        const t = queue[qi];
        const x = t % side, y = (t / side) | 0;
        for (const [dx, dy, c] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= side || ny >= side) continue;
          const n = ny * side + nx;
          const d = dist[t] + c;
          if (d > limit || d >= dist[n]) continue;
          if (land[n]) {
            if (!reached[n]) found.push(n);
            continue;
          }
          dist[n] = d;
          queue.push(n);
        }
      }
      if (!found.length) break;
      for (const n of found) if (!reached[n]) flood(n);
    }
    // Every island whose land lies wholly inside the window is reached.
    const inside = features.filter((f) => Math.abs(f.x) + f.radius * 1.2 < half - 1 && Math.abs(f.y) + f.radius * 1.2 < half - 1);
    expect(inside.length).toBeGreaterThan(9);
    for (const f of inside) {
      const t = (Math.round(f.y) + half) * side + Math.round(f.x) + half;
      expect(land[t], f.id).toBe(1);
      expect(reached[t], f.id).toBe(1);
    }
  });

  it('draw the draft: open sea, shallows and beach around the land the generator made; a generator’s sea inside is a lagoon', () => {
    const land = 'g'.repeat(S * S);
    const sea = 'o'.repeat(S * S);
    // The first place is land; a place between the cells is open sea.
    expect(islandDraft(land, 9, 0, 0, S)).toBe(land);
    expect(islandDraft(sea, 9, 0, 0, S)).toBe('w'.repeat(S * S));
    expect(islandDraft(land, 9, 5, 5, S)).toBe(sea);
    // Somewhere on the shore of the start island: beach and shallows.
    const shore = islandDraft(land, 9, 2, 0, S) + islandDraft(land, 9, 1, 0, S) + islandDraft(land, 9, 2, 1, S);
    expect(shore).toContain('s');
    expect(shore).toContain('w');
    expect(islandOfPlace(9, 0, 0, S)?.id).toBe('0,0');
    expect(islandOfPlace(9, 5, 5, S)).toBeUndefined();
  });
});

describe('an archipelago in the kernel (T441)', () => {
  it('a universe of today does not change: the nature says continent, and the seed’s drafts are the ones they were', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(k.nature().geography).toBe('continent');
    // Far from the origin the seed has its own sea, not the kernel's islands.
    const draft = k.placeDraft(5, 5).join('');
    expect(draft).not.toBe('o'.repeat(S * S));
  });

  it('the draft has the kernel’s islands; the open sea is planned by the kernel without a call; an island is named once', async () => {
    const models = new Recording();
    const k = await Kernel.boot({ files: archipelagoFiles(), store: memoryStore(), ai: models });
    expect(k.nature().geography).toBe('archipelago');
    // The start is land; between the cells the open sea.
    expect(k.placeDraft(0, 0).join('')).not.toMatch(/o/);
    expect(k.placeDraft(5, 5).join('')).toBe('o'.repeat(S * S));
    // The open sea: the kernel's plan, no call, the sea's name, nothing dug.
    expect(await k.planAhead(5, 5)).toBe('nuovo');
    const sea = k.chunks.get('5,5')!;
    expect(sea.stage).toBe('planned');
    expect(sea.plan).toMatchObject({ layout: '', objects: [], ground: [], fresh: [], runes: [], swim: true });
    expect(sea.place?.name).toBe(OPEN_SEA.it.name);
    expect(sea.tiles).toBe('o'.repeat(S * S));
    expect(models.plans).not.toContain('5,5');
    // The first place on an island: the Cartographer plans it and names the island.
    const island = islandOf(k.config.seed, 1, 0);
    const at = [Math.floor(island.x / S), Math.floor(island.y / S)];
    const key = `${at[0]},${at[1]}`;
    expect(await k.planAhead(at[0], at[1])).toBe('nuovo');
    expect(models.plans).toContain(key);
    const named = islandRegion(readAtlas(k.files), '1,0');
    expect(named).toBeTruthy();
    expect(named!.name).toMatch(/Isola/);
    expect(named!.island).toBe('1,0');
    expect(k.repo.log()[0]?.message).toMatch(/isola «/);
    // An island region is not a region of the places, and gives its environment to nobody else.
    expect(regionAt(readAtlas(k.files), at[0], at[1])?.island).toBeUndefined();
    // A second place on the same island: named already, the atlas is not written again.
    const regions = readAtlas(k.files).regions.length;
    const next = [at[0] + (island.x - at[0] * S > S / 2 ? 1 : -1), at[1]];
    expect(islandOfPlace(k.config.seed, next[0], next[1], S)?.id).toBe('1,0');
    expect(await k.planAhead(next[0], next[1])).toBe('nuovo');
    expect(readAtlas(k.files).regions.length).toBe(regions);
    // The players' clients see the island on the atlas.
    expect(JSON.parse(playerFiles(k.files)[ATLAS_FILE]).regions.find((r: { island?: string }) => r.island === '1,0')).toMatchObject({ name: named!.name });
  }, 60_000);

  it('Lua reads the atlas and the islands, copies: world.region_at and world.islands', async () => {
    expect(LUA_API.world).toEqual(expect.arrayContaining(['region_at', 'islands']));
    expect(apiErrors('local r = world.region_at(1, 2); local l = world.islands(0, 0, 300); log(#l)')).toEqual([]);
    const files = archipelagoFiles({
      'modules/sys.carta/manifest.json': JSON.stringify({ id: 'sys.carta', name: 'Carta', kind: 'system', logic: 'logic.lua', order: 95 }),
      'modules/sys.carta/logic.lua': `local M = {}
function M.update(dt)
  local here = world.region_at(1, 1)
  local far = world.region_at(5 * 18 + 9, 5 * 18 + 9)
  local list = world.islands(0, 0, 300)
  local first = list[1]
  first.x = 9999
  local again = world.islands(0, 0, 300)
  world.store_set("carta", { here = here and here.island or "", far = far == nil, n = #list, first = again[1].id, x = again[1].x, islet = again[1].islet, bad = #world.islands("a", 0, 10) })
end
return M
`,
    });
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    expect(k.faults.list().filter((f) => f.key.startsWith('module:sys.carta'))).toEqual([]);
    const seen = k.stores.get('sys.carta', 'carta') as Record<string, unknown>;
    expect(seen).toMatchObject({ here: '0,0', far: true, first: '0,0', x: 0, islet: false, bad: 0 });
    expect(seen.n).toBeGreaterThan(1);
    // In a world that is not an archipelago, no islands.
    expect(k.islandsSeen(0, 0, 300).length).toBeGreaterThan(1);
    const today = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(today.islandsSeen(0, 0, 300)).toEqual([]);
    expect(today.regionInfoAt(1, 1)).toBeUndefined();
    expect(today.regionInfoAt(NaN, 1)).toBeUndefined();
  }, 60_000);
});

/** Islands are never the master's nor the atlas's: a region drawn over one does not move it. */
describe('the islands never move (T441)', () => {
  it('whatever the atlas says, the draft is the same', async () => {
    const k = await Kernel.boot({ files: archipelagoFiles(), store: memoryStore(), ai: new MockAiModels() });
    const before = k.placeDraft(1, 0).join('');
    const moved: Island = { ...islandOf(k.config.seed, 1, 0), x: 0, y: 0 };
    const atlas = { regions: [{ id: 'island-1,0', name: 'Isola Finta', description: '', environment: 'village', center: [moved.x, moved.y] as [number, number], radius: 9, island: '1,0' }] };
    k.applyFiles({ ...k.files, [ATLAS_FILE]: JSON.stringify(atlas) });
    expect(k.placeDraft(1, 0).join('')).toBe(before);
  }, 60_000);
});
