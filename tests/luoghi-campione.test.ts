// Three sample places of the seed, frozen (T437, ADR-0224; the rule 2 of T183: «what is derived is saved or frozen»). A place's plan is
// saved, but its tiles are not: every load lays the plan out again on its draft (`layoutOf`). The draft comes from the seed's generator,
// which reaches every universe that did not rewrite it (`upgradeFromSeed`), and the layout is the kernel's: if either changes, the places
// already planned change under the wanderers, in every universe.
//
// If this test fails, the change moves the tiles of places that exist. Either it is a new contract (ADR-0136: `Y` up and a migration in
// src/kernel/migrations.ts), or it is kept to the plans made from now on by a mark the kernel writes on them, as `vpt` did for the stamps
// at 16 (ADR-0211) and as the layout that stops digging the water will (T438, ADR-0224): then the layout of a plan without the mark is
// still the one below. The fixture (tests/fixtures/luoghi-campione.json) is the layout of today, made once with this file's own calls: it
// is not made again to let a change through.

import { describe, expect, it } from 'vitest';
import fixture from './fixtures/luoghi-campione.json';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { layout } from '../src/kernel/layout';
import type { MjNode } from '../src/kernel/mj';

/** The start, with a pond in its corner; the coast (sea, shore, sand, snow), where the road crosses the water; the open sea. */
const SAMPLES = [
  { cx: 0, cy: 0 },
  { cx: 5, cy: -5 },
  { cx: -7, cy: 6 },
];

/** A house on the meadow and a path from its door, as an environment of the Cartographer would: the lots and the doors join the gates. */
const HOUSE: MjNode = {
  type: 'sequence',
  children: [
    { type: 'one', rules: [{ in: 'ggggg/ggggg/ggggg/ggggg/ggggg', out: 'hhhhh/hfffh/hfffh/hfffh/hhdhh' }], steps: 1 },
    { type: 'path', from: 'd', to: 'p', on: 'g', color: 'p', steps: 1 },
  ],
};

describe('three sample places of the seed (T437)', () => {
  it('have the draft and the layout of before: the water dug where the layout joins the gates', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const S = k.config.chunkSize;
    const rows = (d: string) => Array.from({ length: S }, (_, r) => d.slice(r * S, r * S + S));
    expect(fixture.map((f) => ({ cx: f.cx, cy: f.cy }))).toEqual(SAMPLES);
    for (const f of fixture) {
      const where = `${f.name} (${f.cx}, ${f.cy})`;
      const draft = rows((k as unknown as { genDraft(cx: number, cy: number): string }).genDraft(f.cx, f.cy));
      expect(draft, `la bozza di ${where}`).toEqual(f.draft);
      const opts = { cx: f.cx, cy: f.cy, seed: k.config.seed, pathCode: 'p' };
      const bare = layout(draft, k.palette, opts);
      expect({ grid: bare.grid, gates: bare.gates, carved: bare.carved, reachable: bare.reachable.size }, `il layout di ${where}`).toEqual(f.bare);
      const house = layout(draft, k.palette, { ...opts, program: HOUSE });
      expect({ grid: house.grid, gates: house.gates, carved: house.carved, reachable: house.reachable.size, lots: house.lots.length }, `il layout con la casa di ${where}`).toEqual(f.house);
    }
    // What the three show: the start keeps its pond and has its house; on the coast and on the open sea the gates on the water and the
    // paths that join them are dug in it (16 of the coast's 156 water tiles, 37 of the sea's 324: the cross of § 1.2 of acqua-spazio.md).
    const water = (g: string[]) => g.join('').split('').filter((c) => c === 'w' || c === 'o').length;
    const dug = (f: (typeof fixture)[number]) => [water(f.draft), water(f.draft) - water(f.bare.grid), f.bare.carved];
    const [start, coast, sea] = fixture;
    expect([start.house.lots, ...dug(start)]).toEqual([1, 24, 0, 0]);
    expect(dug(coast)).toEqual([156, 16, 14]);
    expect(dug(sea)).toEqual([324, 37, 33]);
  }, 60_000);
});
