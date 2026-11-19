import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { seedHashes, upgradeFromSeed } from '../src/kernel/universes';
import { compileMjx } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { isStar, STAR, starPulse } from '../src/render/star';
import type { FileMap } from '../src/kernel/types';

// T430: what has no model of its own is a star of four points, not a bundle that looked like a potion.
describe('the star of what has no model of its own', () => {
  it('is the generic thing of the seed: a flat star, its four points as long as its box, its colour the thing\'s', () => {
    const xml = bundledFiles['models/object.xml'];
    const info = JSON.parse(bundledFiles['models/index.json'])[STAR];
    expect(info).toMatchObject({ class: 'object', tint: 'C', vpt: 28 });
    const { grid: g } = runMjx(compileMjx(xml), 1);
    expect([g.X, g.Y, g.Z]).toEqual([17, 17, 17]);
    const at = (x: number, y: number, z: number) => g.alphabet[g.cells[x + y * g.X + z * g.X * g.Y]];
    // The four points reach the box's sides, in the middle plane only; what is not on the star's plane is empty there.
    for (const [x, z] of [[8, 0], [8, 16], [0, 8], [16, 8]]) expect(at(x, 8, z)).toBe('C');
    for (const [x, z] of [[8, 0], [0, 8]]) expect(at(x, 7, z)).toBe(g.alphabet[0]);
    // The sides curve in: the corners are empty, the steps narrow outwards.
    expect(at(3, 8, 3)).toBe(g.alphabet[0]);
    expect(at(4, 8, 7)).toBe('C');
    expect(at(4, 8, 6)).toBe(g.alphabet[0]);
    // A light heart on both faces, the thing's colour around it.
    expect(at(8, 6, 8)).toBe('W');
    expect(at(8, 10, 8)).toBe('W');
    expect(at(8, 5, 8)).toBe('W');
    expect(at(8, 11, 8)).toBe('W');
    expect(at(6, 7, 8)).toBe('C');
    // As tall as wide at its density: 17 voxels at 28 a tile, the 0.6 tiles of a small object.
    expect(17 / info.vpt).toBeCloseTo(0.6, 1);
  });

  it('turns and stretches in height and width, out of step by its phase, always finite and never flat', () => {
    expect(isStar('object')).toBe(true);
    expect(isStar('forbici')).toBe(false);
    expect(isStar(undefined)).toBe(false);
    let minW = Infinity, maxW = 0, minH = Infinity, maxH = 0;
    for (let t = 0; t < 30; t += 0.05) {
      const s = starPulse(t, 1.3);
      minW = Math.min(minW, s.width);
      maxW = Math.max(maxW, s.width);
      minH = Math.min(minH, s.height);
      maxH = Math.max(maxH, s.height);
    }
    expect(minW).toBeGreaterThan(0.3);
    expect(maxW - minW).toBeGreaterThan(0.4);
    expect(maxH - minH).toBeGreaterThan(0.3);
    expect(starPulse(2, 0)).not.toEqual(starPulse(2, 1));
    for (const s of [starPulse(NaN, NaN), starPulse(Infinity)]) for (const v of Object.values(s)) expect(Number.isFinite(v)).toBe(true);
  });

  it('comes to a universe from the seed with its entry, where the universe never rewrote the thing; one that did keeps its own', () => {
    const OLD = '<sequence values="BC" size="12 12 12"><color symbol="C" value="b08a5a"/><box at="6 6 0" size="4 4 4" color="C"/></sequence>\n';
    const oldEntry = { class: 'object', name: 'Cosa', author: 'a mano (Claude Code)', tint: 'C', seeds: 3 };
    // A universe made from the seed of before: its index rewritten by the Sculptor (a model of its own), the thing as the seed had it.
    const index = { ...JSON.parse(bundledFiles['models/index.json']), object: oldEntry, lanterna: { class: 'object', name: 'Lanterna' } };
    const before: FileMap = { ...bundledFiles, 'models/object.xml': OLD, 'models/index.json': JSON.stringify(index, null, 1) + '\n' };
    const seedOfBefore = { ...bundledFiles, 'models/object.xml': OLD };
    before['seed.json'] = JSON.stringify(seedHashes(seedOfBefore), null, 1) + '\n';
    const up = upgradeFromSeed(before, bundledFiles);
    expect(up.files['models/object.xml']).toBe(bundledFiles['models/object.xml']);
    const now = JSON.parse(up.files['models/index.json']);
    expect(now.object).toMatchObject({ vpt: 28, name: 'Cosa (stella)', tint: 'C', seeds: 3 });
    expect(now.lanterna).toEqual({ class: 'object', name: 'Lanterna' });
    // One that wrote its own thing keeps it, and its entry.
    const mine: FileMap = { ...before, 'models/object.xml': OLD.replace('4 4 4', '5 5 5') };
    const kept = upgradeFromSeed(mine, bundledFiles);
    expect(kept.files['models/object.xml']).toBe(mine['models/object.xml']);
    expect(JSON.parse(kept.files['models/index.json']).object).toEqual(oldEntry);
  });
});
