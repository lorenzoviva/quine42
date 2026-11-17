// The migration 0.8 → 0.9 (T405, ADR-0209): the structures that grow by rules are at 16 voxels a tile, the same voxels a quarter larger in
// tiles. A universe of 0.8 opens ported: its entries of the class `structure` from Large up that did not say their density say the 20 they
// were sculpted at, and keep their box and their tiles on the lots cut for them; a Gargantuan one of T370 (500 voxels at 20) says its box
// in its program too. The entries that said a density, the other classes and the plans stay as they were; the index stops following the
// seed (its entries at 16 would replace the ones of before), and a new entry, in a new universe or in an old one, is at 16.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { migrateUniverse, MIGRATIONS } from '../src/kernel/migrations';
import { prepareUniverse, SEED_FILE } from '../src/kernel/universes';
import { cellarVoxels, entryBox, vptOf } from '../src/kernel/forms';
import { KERNEL_CONTRACT } from '../src/kernel/version';
import { modelSize } from '../src/kernel/modeldirector';
import { classOf, STRUCTURE_VPT } from '../src/mj/classes';
import { hashStr, hex } from '../src/kernel/rng';
import type { FileMap } from '../src/kernel/types';

const json = (s: string | undefined) => JSON.parse(s ?? 'null');
const write = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
const h = (s: string) => hex(hashStr(s));
const structure = classOf('structure')!;
/** A program without a box of its own: it runs in its entry's. */
const PROGRAM = '<sequence values="BW" origin="bottom"><one in="B" out="W"/></sequence>';

/** A universe of 0.8: the seed's files as a 0.8 universe had them, with entries of the Sculptor of every kind. */
function universe0_8(): FileMap {
  const cfg = json(bundledFiles['universe.json']);
  const index = {
    ...json(bundledFiles['models/index.json']),
    'struttura-il-mulino': { class: 'structure', name: 'Il mulino' },
    'struttura-la-rocca-huge': { class: 'structure', size: 'huge', name: 'La rocca' },
    'struttura-la-locanda-huge': { class: 'structure', size: 'huge', vpt: 16, cellar: 1 },
    'struttura-la-cittadella-gargantuan': { class: 'structure', size: 'gargantuan', cellar: 1 },
    'struttura-la-torre-gargantuan': { class: 'structure', size: 'gargantuan', vpt: 20 },
    'struttura-la-capanna-medium': { class: 'structure', size: 'medium' },
    'npc-mugnaio': { class: 'person' },
  };
  const files: FileMap = {
    ...bundledFiles,
    'universe.json': write({ ...cfg, kernel: '0.8.2', kernels: { from: '0.8' }, ai: { ...cfg.ai, maxModels: 0 } }),
    'models/index.json': write(index),
    'models/struttura-la-cittadella-gargantuan.xml': '<!-- <sequence size="1 1 1"> in a comment --><sequence values="BW" origin="bottom" soil="B"><one in="B" out="W"/></sequence>',
  };
  for (const id of ['struttura-il-mulino', 'struttura-la-rocca-huge', 'struttura-la-locanda-huge', 'struttura-la-torre-gargantuan', 'struttura-la-capanna-medium']) files[`models/${id}.xml`] = PROGRAM;
  // The index of the seed as the universe took it: pristine, so it would follow the seed.
  files[SEED_FILE] = JSON.stringify({ ...json(bundledFiles[SEED_FILE] ?? '{}'), 'models/index.json': h(files['models/index.json']) }, null, 1) + '\n';
  return files;
}

describe('the migration 0.8 → 0.9 (T405)', () => {
  it('is the last step of the chain, and this kernel is of 0.9', () => {
    expect(KERNEL_CONTRACT).toBe('0.9');
    expect(MIGRATIONS.at(-1)).toMatchObject({ from: '0.8', to: '0.9' });
  });

  it('keeps every structure of before at the 20 it was sculpted at: its box, its tiles', () => {
    const files = universe0_8();
    const { files: out, applied } = migrateUniverse(files);
    expect(applied.map((a) => a.slice(0, 8))).toEqual(['0.8→0.9:']);
    const after = json(out['models/index.json']);
    // The seed's structures and the Sculptor's say their 20; the ones that said a density, the other sizes and classes stay.
    expect(after['struttura-il-mulino']).toEqual({ class: 'structure', name: 'Il mulino', vpt: 20 });
    expect(after['struttura-la-rocca-huge']).toEqual({ class: 'structure', size: 'huge', name: 'La rocca', vpt: 20 });
    expect(after['struttura-locanda']).toMatchObject({ vpt: 20 });
    expect(after.fattoria).toMatchObject({ vpt: 20 });
    expect(after['struttura-la-locanda-huge']).toEqual({ class: 'structure', size: 'huge', vpt: 16, cellar: 1 });
    expect(after['struttura-la-torre-gargantuan']).toEqual({ class: 'structure', size: 'gargantuan', vpt: 20 });
    expect(after['struttura-la-capanna-medium']).toEqual({ class: 'structure', size: 'medium' });
    expect(after['npc-mugnaio']).toEqual({ class: 'person' });
    expect(after['corona-magia']).toEqual(json(files['models/index.json'])['corona-magia']);
    // The boxes are the ones they were sculpted in, at the density they were sculpted at.
    expect(entryBox(structure, after['struttura-il-mulino'])).toEqual([100, 100, 80]);
    expect(entryBox(structure, after['struttura-la-rocca-huge'])).toEqual([150, 150, 120]);
    expect(entryBox(structure, after['struttura-la-locanda-huge'])).toEqual([120, 120, 96]);
    expect(vptOf(after['struttura-il-mulino'])).toBe(20);
    // A Gargantuan one of T370 says its box in its program (its cellar under it), after the comments.
    expect(after['struttura-la-cittadella-gargantuan']).toEqual({ class: 'structure', size: 'gargantuan', cellar: 1, vpt: 20 });
    expect(out['models/struttura-la-cittadella-gargantuan.xml']).toBe('<!-- <sequence size="1 1 1"> in a comment --><sequence values="BW" origin="bottom" soil="B" size="500 500 180"><one in="B" out="W"/></sequence>');
    // Nothing else of the universe changes.
    for (const p of Object.keys(files)) if (!['models/index.json', 'models/struttura-la-cittadella-gargantuan.xml', 'universe.json', SEED_FILE].includes(p)) expect(out[p], p).toBe(files[p]);
  });

  it('the index stops following the seed, and still receives its new entries', () => {
    const files = universe0_8();
    const seed = { ...bundledFiles, 'models/index.json': write({ ...json(bundledFiles['models/index.json']), 'struttura-nuova': { class: 'structure' } }) };
    const out = prepareUniverse(files, seed).files;
    const after = json(out['models/index.json']);
    expect(after['struttura-locanda']).toMatchObject({ vpt: 20 });
    expect(after['struttura-il-mulino']).toMatchObject({ vpt: 20 });
    expect(after['struttura-nuova']).toEqual({ class: 'structure' });
  });

  it('opens an old universe at the tiles of before, and gives the new entries 16', async () => {
    const k = await Kernel.boot({ files: universe0_8(), store: memoryStore(), ai: new MockAiModels() });
    expect(k.forms.entryTiles('struttura-il-mulino')).toEqual([5, 5, 4]);
    expect(k.forms.entryTiles('struttura-la-rocca-huge')).toEqual([7.5, 7.5, 6]);
    expect(k.forms.entryTiles('struttura-la-cittadella-gargantuan')).toEqual([25, 25, 9]);
    // An old place's lot of 6 keeps its Large structure of before; a concept not sculpted yet takes the tiles of today, 6.25.
    const lot = (n: number) => ({ x0: 0, y0: 0, x1: n - 1, y1: n - 1, walls: [], floor: [], doors: [] });
    const old = { structures: [{ concept: 'il mulino', size: 'large' }] };
    (k as any).claimSizes({ key: '40,40', cx: 40, cy: 40, lots: [lot(6)] }, old);
    expect(old.structures[0].size).toBe('large');
    const fresh = { structures: [{ concept: 'il frantoio', size: 'large' }] };
    (k as any).claimSizes({ key: '41,40', cx: 41, cy: 40, lots: [lot(6)] }, fresh);
    expect(fresh.structures[0].size).toBe('medium');
    // What the Sculptor writes next says no density: it is at 16.
    expect(modelSize({ classe: 'structure', taglia: 'huge' })).toEqual({ size: 'huge' });
    expect(vptOf({ class: 'structure', size: 'huge' })).toBe(STRUCTURE_VPT);
    expect(entryBox(structure, { size: 'huge' })).toEqual([150, 150, 120]);
  });

  it('a new universe has the seed at 16: its structures a quarter larger, with the same voxels', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(k.forms.info('struttura-locanda')?.vpt).toBeUndefined();
    expect(k.forms.entryTiles('struttura-locanda')).toEqual([6.25, 6.25, 5]);
    expect(k.forms.entryTiles('fattoria')).toEqual([6.25, 6.25, 5]);
    // The seed's Huge inn was at 16 already (ADR-0179): it stays.
    expect(k.forms.entryTiles('struttura-locanda-del-cinghiale')).toEqual([7.5, 7.5, 6]);
    // A cellar keeps the voxels its program writes, 20 a tile: at 16 it is 1.25 tiles deep.
    expect(cellarVoxels(k.forms.info('struttura-locanda'))).toBe(20);
    expect(k.forms.request('struttura-locanda', 1)).toMatchObject({ vpt: 16, size: [100, 100, 100], base: 20 });
  });
});
