// The stamps and the environments of the seed cut for the structures at 16 voxels a tile (T407, ADR-0211): since T405 a Large structure is
// 6.25 tiles (ADR-0209), and every lot a stamp or an environment of the seed draws holds the structure it is for, both ways, without going
// down a size or jutting out of it; no two lots share a tile; their doors are reached (rule 10). The plans of before keep the stamps they
// were drawn with, and a universe keeps the programs of the environments it has.

import { describe, expect, it } from 'vitest';
import { layout, type Lot } from '../src/kernel/layout';
import type { MjNode } from '../src/kernel/mj';
import { shapePattern, STAMP_SHAPES, STAMP_SIZES, type StampShape } from '../src/kernel/stamps';
import { Rng } from '../src/kernel/rng';
import { classOf, STRUCTURE_VPT, TILE, tilesOf, type SizeTier } from '../src/mj/classes';
import { bundledFiles } from '../src/kernel/bundle';
import { keepEnvironments, seedHashes, upgradeFromSeed } from '../src/kernel/universes';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { TerrainDef } from '../src/kernel/types';

const S = 18;
const LAYOUTS = 'modules/world.layouts/manifest.json';
const palette: Record<string, TerrainDef> = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']).tiles;
const layouts: Record<string, { program: MjNode }> = JSON.parse(bundledFiles[LAYOUTS]).layouts;

/** A draft of meadow with some wood and rock, the same for a seed: where the environments of the seed are tried. */
function draft(seed: number): string[] {
  const rng = new Rng(seed);
  return Array.from({ length: S }, () => Array.from({ length: S }, () => (rng.next() < 0.1 ? 't' : rng.next() < 0.03 ? 'r' : 'g')).join(''));
}

const sides = (b: Lot) => ({ w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 });

/**
 * What the kernel stands on a lot (`lotsOf`): a structure from 5 tiles a side up, a small house under; its tiles at a size, or its
 * class's own (a common house, a structure without a size: a Large one, 6.25 tiles at 16).
 */
function heldBy(b: Lot, size?: SizeTier): { cls: string; tiles: number[] } {
  const { w, h } = sides(b);
  const cls = classOf(Math.max(w, h) >= 5 ? 'structure' : 'building')!;
  return { cls: cls.id, tiles: tilesOf(cls, size).slice(0, 2) };
}

/** Why a lot does not hold what it is for, or nothing: its tiles both ways inside the lot. */
function jutting(b: Lot, size?: SizeTier): string | undefined {
  const { w, h } = sides(b);
  const { cls, tiles } = heldBy(b, size);
  const side = Math.min(w, h);
  return tiles.every((t) => t <= side + 1e-9) ? undefined : `lotto ${w} × ${h}: ${cls}${size ? ` ${size}` : ''} di ${tiles.join(' × ')} caselle sporge`;
}

/** The tiles of each lot's box: no two lots share one, so no two structures do. */
function overlaps(lots: Lot[]): string | undefined {
  const seen = new Map<number, number>();
  for (const [n, b] of lots.entries())
    for (let y = b.y0; y <= b.y1; y++)
      for (let x = b.x0; x <= b.x1; x++) {
        const i = y * S + x;
        if (seen.has(i)) return `i lotti ${seen.get(i)} e ${n} si toccano in ${x},${y}`;
        seen.set(i, n);
      }
  return undefined;
}

/** Every door of every lot, and every gate of the place, is reached from the gates (rule 10). */
function unreached(r: ReturnType<typeof layout>): number[] {
  return [...r.lots.flatMap((b) => b.doors), ...r.gates].filter((d) => !r.reachable.has(d));
}

describe('the stamps cut for the structures at 16 voxels a tile (T407)', () => {
  it('every stamp with a lot holds the structure of its size, both ways, on lots apart, doors and gates reached', () => {
    for (const shape of STAMP_SHAPES) {
      const size = STAMP_SIZES[shape];
      for (let seed = 1; seed <= 40; seed++) {
        const r = layout(draft(seed), palette, { cx: seed, cy: -seed, seed: 7, pathCode: 'p', program: { type: 'stamp', shape } as MjNode });
        const where = `${shape} seme ${seed}`;
        if (!size) {
          expect(r.lots, where).toEqual([]);
          continue;
        }
        expect(r.lots.length, where).toBeGreaterThan(0);
        for (const b of r.lots) {
          // The class the kernel gives the lot is the one the shape is for; its size fits it, as `claimSizes` measures and both ways.
          expect(heldBy(b).cls, `${where}: ${JSON.stringify(sides(b))}`).toBe(size === 'building' ? 'building' : 'structure');
          expect(jutting(b, size === 'building' ? undefined : size), where).toBeUndefined();
        }
        expect(overlaps(r.lots), where).toBeUndefined();
        expect(unreached(r), where).toEqual([]);
      }
    }
  });

  it('a stamp drawn more times keeps apart from the others and from the buildings the rules drew', () => {
    const program = {
      type: 'sequence',
      children: [
        { type: 'one', rules: [{ in: 'gggggg/gggggg/gggggg/gggggg/gggggg/gggggg', out: '******/*hhhh*/*hffh*/*hffh*/*hhdh*/******' }], steps: 2 },
        { type: 'stamp', shape: 'house', count: 4 },
        { type: 'stamp', shape: 'huts', count: 6 },
      ],
    } as MjNode;
    for (let seed = 1; seed <= 30; seed++) {
      const r = layout(draft(seed), palette, { cx: seed, cy: seed, seed: 3, pathCode: 'p', program });
      for (const b of r.lots) expect(jutting(b), `seme ${seed}`).toBeUndefined();
      expect(overlaps(r.lots), `seme ${seed}`).toBeUndefined();
      expect(unreached(r), `seme ${seed}`).toEqual([]);
    }
  });

  it('the stamps of before are there for the plans of before: their lots are the ones they had', () => {
    const lotsAt = (shape: StampShape, vpt: number) =>
      layout(Array.from({ length: S }, () => 'g'.repeat(S)), palette, { cx: 0, cy: 0, seed: 5, pathCode: 'p', vpt, program: { type: 'stamp', shape } as MjNode }).lots.map((b) => {
        const { w, h } = sides(b);
        return `${w}x${h}`;
      });
    expect(lotsAt('castle', TILE)).toEqual(['5x5']);
    expect(lotsAt('castle', STRUCTURE_VPT)).toEqual(['7x7']);
    expect(lotsAt('fortress', TILE)).toEqual(['5x4']);
    expect(lotsAt('pyramid', TILE)).toEqual(['5x8']);
    expect(lotsAt('pyramid', STRUCTURE_VPT)).toEqual(['7x9']);
    expect(lotsAt('temple', TILE)).toEqual(['9x8']);
    expect(lotsAt('temple', STRUCTURE_VPT)).toEqual(['10x10']);
    // The patterns of before, cell by cell, for every seed: the tower, the huts and the pen did not change.
    for (const shape of ['tower', 'huts', 'pen', 'lair', 'well'] as StampShape[])
      for (let s = 1; s <= 5; s++) expect(shapePattern(shape, new Rng(s), STRUCTURE_VPT), shape).toEqual(shapePattern(shape, new Rng(s), TILE));
  });
});

describe('the environments of the seed cut for the structures at 16 voxels a tile (T407)', () => {
  // What the lot of an environment is for, when it is not a structure of its class's own size: the inn is a large building, for a Huge one.
  const FOR: Record<string, SizeTier> = { inn: 'huge' };

  it('every lot of every environment of the seed holds its structure, both ways, on lots apart, doors and gates reached', () => {
    const seen: Record<string, number> = {};
    for (const [id, l] of Object.entries(layouts)) {
      for (let seed = 1; seed <= 30; seed++) {
        const r = layout(draft(seed), palette, { cx: seed, cy: 2 * seed, seed: 11, pathCode: 'p', program: l.program });
        const where = `${id} seme ${seed}`;
        seen[id] = (seen[id] ?? 0) + r.lots.length;
        for (const b of r.lots) expect(jutting(b, heldBy(b).cls === 'structure' ? FOR[id] : undefined), where).toBeUndefined();
        expect(overlaps(r.lots), where).toBeUndefined();
        expect(unreached(r), where).toEqual([]);
      }
    }
    // The environments with buildings do draw them here: the test sees their lots.
    for (const id of ['village', 'fields', 'inn', 'castle', 'fortress', 'huts', 'stables', 'barracks', 'dungeon', 'wizard_tower', 'temple', 'pyramid', 'brick_village'])
      expect(seen[id], id).toBeGreaterThan(0);
  });

  it('a house of the village holds a Large structure, the inn a Huge one', () => {
    const lots = (id: string) => Array.from({ length: 20 }, (_, i) => layout(draft(i + 1), palette, { cx: i, cy: 0, seed: 1, pathCode: 'p', program: layouts[id].program }).lots).flat();
    const village = lots('village');
    expect(village.length).toBeGreaterThan(0);
    for (const b of village) expect(sides(b)).toEqual({ w: 7, h: 7 });
    const inn = lots('inn');
    expect(inn.length).toBeGreaterThan(0);
    for (const b of inn) {
      expect(sides(b)).toEqual({ w: 10, h: 10 });
      expect(jutting(b, 'huge')).toBeUndefined();
    }
  });
});

describe('the plans of before and the environments a universe has (T407)', () => {
  it('a new plan says it is cut at 16 and lays the stamps at 16; a plan of before lays the ones it was drawn with', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    for (let i = 0; i < 80; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
      if (k.chunks.get('0,0')?.stage === 'planned') break;
    }
    const start = k.chunks.get('0,0')!;
    expect(start.plan?.vpt).toBe(STRUCTURE_VPT);
    // The village of the seed: its houses hold the Large structure of the Cartographer, which keeps its size.
    for (const b of start.lots) expect(jutting(b), JSON.stringify(sides(b))).toBeUndefined();
    const kk = k as any;
    const lotsOf = (plan: Partial<ChunkPlan>) =>
      kk.layoutOf({ cx: 3, cy: 3, draft: 'g'.repeat(S * S) }, { place: { name: 'x', description: '' }, objects: [], ground: [], fresh: [], runes: [], ...plan }, kk.pathCode()).result.lots.map((b: Lot) => {
        const { w, h } = sides(b);
        return `${w}x${h}`;
      });
    expect(lotsOf({ layout: 'castle', vpt: STRUCTURE_VPT })).toEqual(['7x7']);
    expect(lotsOf({ layout: 'castle' })).toEqual(['5x5']);
    expect(lotsOf({ layout: 'castle', vpt: 12 })).toEqual(['5x5']);
  }, 30_000);

  it('a universe keeps the programs of the environments it has, and takes the new ones of the seed', () => {
    const now = JSON.parse(bundledFiles[LAYOUTS]);
    const before = structuredClone(now);
    before.layouts.village.program.children[1].rules[0] = { in: Array(5).fill('[gpm]'.repeat(6)).join('/'), out: 'hhhhhh/hffffh/hffffh/hffffh/hhdhhh' };
    before.layouts.inn.program.children[1].rules[0] = { in: Array(7).fill('[gpmr]'.repeat(9)).join('/'), out: 'hhhhhhhhh/hfffhfffh/hfffdfffh/hfffhhdhh/hfffffffh/hfffffffh/hhhhdhhhh' };
    delete before.layouts.brick_village;
    const old = JSON.stringify(before, null, 2) + '\n';
    const seedBefore = { ...bundledFiles, [LAYOUTS]: old };
    const universe = { ...seedBefore, 'seed.json': JSON.stringify(seedHashes(seedBefore), null, 1) + '\n' };
    const up = upgradeFromSeed(universe, bundledFiles);
    const got = JSON.parse(up.files[LAYOUTS]);
    expect(got.layouts.village).toEqual(before.layouts.village);
    expect(got.layouts.brick_village).toEqual(now.layouts.brick_village);
    expect(got.layouts.inn).toEqual(before.layouts.inn);
    expect(got.layouts.castle).toEqual(now.layouts.castle);
    // Once taken, the seed's hash is there: the next load changes nothing.
    expect(upgradeFromSeed(up.files, bundledFiles).changes[LAYOUTS]).toBeUndefined();
    // A manifest without environments, or the same environments, is the seed's.
    expect(keepEnvironments('{"id":"a"}', '{"id":"b"}')).toBe('{"id":"b"}');
    expect(keepEnvironments(bundledFiles[LAYOUTS], bundledFiles[LAYOUTS])).toBe(bundledFiles[LAYOUTS]);
  });
});
