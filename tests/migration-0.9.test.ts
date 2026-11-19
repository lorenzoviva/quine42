// The migration 0.9 → 0.10 (T437, ADR-0224): the water is swum in every universe. A universe of 0.9 opens ported: the water codes of its
// palette (`w`, `o`), liquids not walked, say how a body crosses them (`cross: swim`), how deep their water is and a pace of swimming;
// they stay solid (what is not walked), the other liquids (lava) stay not crossed, the plans and every other file stay as they were, and a
// terrain manifest that followed the seed keeps following it.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { migrateUniverse, MIGRATIONS, portedProgram } from '../src/kernel/migrations';
import { prepareUniverse, SEED_FILE } from '../src/kernel/universes';
import { crossingOf, DEFAULT_NATURE, SWIM_PACE } from '../src/kernel/nature';
import { KERNEL_CONTRACT } from '../src/kernel/version';
import { hashStr, hex } from '../src/kernel/rng';
import type { FileMap, TerrainDef } from '../src/kernel/types';

const json = (s: string | undefined) => JSON.parse(s ?? 'null');
const write = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
const h = (s: string) => hex(hashStr(s));
const TERRAIN = 'modules/world.terrain/manifest.json';

/** A palette as a Genesis of 0.9 wrote it: the water solid, with the Cartographer's pace of walking; a pond walked by hand; lava. */
const PALETTE_0_9: Record<string, TerrainDef> = {
  g: { name: 'pascolo', color: '#6aa84f', solid: false, layer: 'ground', speed: 1 },
  p: { name: 'tratturo', color: '#c8a868', solid: false, layer: 'ground', speed: 1.1 },
  w: { name: 'torrente', color: '#3a78c8', solid: true, layer: 'liquid', speed: 1 },
  o: { name: 'mare', color: '#1d4f8a', solid: true, layer: 'liquid', speed: 0.5 },
  v: { name: 'lava', color: '#e04010', solid: true, layer: 'liquid', speed: 1 },
  r: { name: 'pietraia', color: '#9a9a92', solid: true, layer: 'rock', speed: 1 },
};

/** A universe of 0.9 after its Genesis: its own palette, a plan, a manifest of the Council with tiles too. */
function universe0_9(palette: Record<string, TerrainDef> = PALETTE_0_9): FileMap {
  const cfg = json(bundledFiles['universe.json']);
  const terrain = { ...json(bundledFiles[TERRAIN]), tiles: palette };
  return {
    ...bundledFiles,
    'universe.json': write({ ...cfg, kernel: '0.9.21', kernels: { from: '0.9' } }),
    [TERRAIN]: write(terrain),
    'maps/regno_0_0.json': write({ plan: { place: { name: 'La piazza' }, layout: 'fields', objects: [], ground: [], fresh: [], runes: [], vpt: 16 } }),
  };
}

describe('the migration 0.9 → 0.10 (T437)', () => {
  it('is the last step of the chain, and this kernel is of 0.10', () => {
    expect(KERNEL_CONTRACT).toBe('0.10');
    expect(MIGRATIONS.at(-1)).toMatchObject({ from: '0.9', to: '0.10' });
    expect(MIGRATIONS.at(-1)?.migratePlan).toBeUndefined();
  });

  it('makes the water of a palette swum, with its depth and a pace of swimming; nothing else changes', () => {
    const files = universe0_9();
    const { files: out, applied } = migrateUniverse(files);
    expect(applied.map((a) => a.slice(0, 9))).toEqual(['0.9→0.10:']);
    const tiles = json(out[TERRAIN]).tiles as Record<string, TerrainDef>;
    // The Cartographer's 1 was a pace of walking: the water's own; a pace of swimming already said stays.
    expect(tiles.w).toEqual({ ...PALETTE_0_9.w, cross: 'swim', depth: 'shallow', speed: SWIM_PACE });
    expect(tiles.o).toEqual({ ...PALETTE_0_9.o, cross: 'swim', depth: 'deep', speed: 0.5 });
    for (const code of ['g', 'p', 'v', 'r']) expect(tiles[code], code).toEqual(PALETTE_0_9[code]);
    expect(crossingOf(tiles.w)).toBe('swim');
    expect(crossingOf(tiles.v)).toBe('none');
    // The plans, the models, the rest of the universe: as they were.
    for (const p of Object.keys(files)) if (![TERRAIN, 'universe.json', SEED_FILE].includes(p)) expect(out[p], p).toBe(files[p]);
    expect(json(out['universe.json'])).toMatchObject({ kernel: expect.stringMatching(/^0\.10\./), kernels: { from: '0.10' } });
    expect(json(out['universe.json']).nature).toBeUndefined();
  });

  it('leaves the water a universe made walkable by hand, and one that said already how it is crossed', () => {
    const palette = { ...PALETTE_0_9, w: { ...PALETTE_0_9.w, solid: false }, o: { ...PALETTE_0_9.o, cross: 'none' as const } };
    const tiles = json(migrateUniverse(universe0_9(palette)).files[TERRAIN]).tiles;
    expect(tiles.w).toEqual(palette.w);
    expect(tiles.o).toEqual(palette.o);
  });

  it('a terrain manifest that followed the seed keeps following it: it takes the seed of 0.10', () => {
    const terrain0_9 = (() => {
      const m = json(bundledFiles[TERRAIN]);
      for (const t of Object.values<Record<string, unknown>>(m.tiles)) {
        delete t.cross;
        delete t.depth;
      }
      delete m.tiles.w.speed;
      delete m.tiles.o.speed;
      return write(m);
    })();
    const cfg = json(bundledFiles['universe.json']);
    const files: FileMap = {
      ...bundledFiles,
      'universe.json': write({ ...cfg, kernel: '0.9.21', kernels: { from: '0.9' } }),
      [TERRAIN]: terrain0_9,
      [SEED_FILE]: JSON.stringify({ ...json(bundledFiles[SEED_FILE] ?? '{}'), [TERRAIN]: h(terrain0_9) }, null, 1) + '\n',
    };
    const out = prepareUniverse(files, bundledFiles).files;
    expect(out[TERRAIN]).toBe(bundledFiles[TERRAIN]);
  });

  it('a handmade card of 0.9 reads in 0.10 as it was: the programs do not change', () => {
    const xml = '<sequence values="BW"><one in="B" out="W"/></sequence>';
    expect(portedProgram(xml, '0.9')).toEqual({ xml, contract: '0.10' });
  });

  it('opens an old universe with its water swum and the nature of today', async () => {
    const k = await Kernel.boot({ files: universe0_9(), store: memoryStore(), ai: new MockAiModels() });
    expect(k.faults.has('universe:kernel')).toBe(false);
    expect(crossingOf(k.palette.w)).toBe('swim');
    expect(crossingOf(k.palette.o)).toBe('swim');
    expect(crossingOf(k.palette.v)).toBe('none');
    expect(k.palette.w.solid).toBe(true);
    expect(k.nature()).toEqual(DEFAULT_NATURE);
  });
});
