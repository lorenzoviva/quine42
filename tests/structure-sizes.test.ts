// Structures that fit their size (T338, ADR-0179): the parts one lives in keep their least measures in tiles at every size, a part
// under its measure goes back to the Sculptor with the reason (the farm of 5 × 5 tiles of before: a house too small), and the same
// program at a larger area contains more, not the same drawn bigger. The programs tried: the bench's and those written as the Sculptor
// writes them from the prompt without a skeleton (T354).

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkProgram } from '../src/kernel/agents/sculptor';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';
import { habitableParts } from '../src/kernel/forms';
import { compositionOf, partErrors, varietyError, type Composition } from '../src/mj/check';
import { boxOf, classOf, densityFor, PARTS, partVoxels, STRUCTURE_SIDE, TILE, tilesOf, type SizeTier } from '../src/mj/classes';
import { compileMjx, mjxIncludes, type MjxFiles } from '../src/mj/model';
import { runMjx } from '../src/mj/run';

const structure = classOf('structure')!;
const SIZES: SizeTier[] = ['large', 'huge', 'gargantuan'];

/** The files of the seed's models/ a program reads (the parts one lives in, T346), as the game gives them to the compiler. */
const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));

/** A program at a size of the structures, at a seed: its parts and what it contains. */
function at(xml: string, size: SizeTier, seed = 1) {
  const vpt = densityFor(structure, size);
  const model = compileMjx(xml.replace(/(<sequence[^>]*?)\ssize="[^"]*"/, '$1'), { size: boxOf(structure, size), files: seedFiles(xml) });
  const r = runMjx(model, seed, { deadline: 20_000 });
  expect(r.finished).toBe(true);
  const parts = habitableParts(r.grid, model.program.palette, vpt, partVoxels(vpt).storey.clear, 0, model.actions, seed);
  return { parts, composition: compositionOf(r.grid, model.program.palette), errors: partErrors(parts, vpt) };
}

describe('the scale of the parts one lives in (T338)', () => {
  it('is written once in tiles, and the same in tiles at every density', () => {
    expect(PARTS.door).toEqual({ width: 0.55, height: 1.5 });
    expect(PARTS.room.side).toBe(1.4);
    // At 20 voxels a tile: a door of 11 × 30, a room of 28.
    expect(partVoxels(TILE)).toEqual({ door: { width: 11, height: 30 }, storey: { clear: 30 }, room: { side: 28 }, shelter: { clear: 30, depth: 20 } });
    // At a coarser density the voxels are fewer, the tiles the same (never under: rounded up).
    const coarse = partVoxels(12);
    expect(coarse.door).toEqual({ width: 7, height: 18 });
    expect(coarse.room.side / 12).toBeGreaterThanOrEqual(PARTS.room.side);
  });

  it('runs a structure that grows by rules at 20 voxels a tile at every size: a larger size is a larger area', () => {
    for (const t of SIZES) expect(densityFor(structure, t)).toBe(TILE);
    expect(SIZES.map((t) => boxOf(structure, t)[0])).toEqual([100, 150, 200]);
    expect(Math.max(...boxOf(structure, 'gargantuan'))).toBeLessThanOrEqual(STRUCTURE_SIDE);
    expect(tilesOf(structure, 'gargantuan')[0] * TILE).toBe(boxOf(structure, 'gargantuan')[0]);
  });

  it('says a part under its measure, with the measure found and the one wanted', () => {
    expect(partErrors({ rooms: [{ z: 1, room: 31, clear: 62 }], doors: [{ width: 11, height: 30 }] }, TILE)).toEqual([]);
    expect(partErrors({ rooms: [{ z: 1, room: 31, clear: 62 }], doors: [{ width: 9, height: 24 }] }, TILE)[0]).toMatch(/^porta: 9 × 24 voxel .* almeno 11 × 30/);
    expect(partErrors({ rooms: [{ z: 1, room: 26, clear: 40 }], doors: [] }, TILE)[0]).toMatch(/^stanza: .* 26 voxel \(1,30 caselle\).* almeno 28/);
    expect(partErrors({ rooms: [{ z: 1, room: 40, clear: 22 }], doors: [] }, TILE)[0]).toMatch(/^piano: .* 22 voxel .* 30/);
  });

  it('measures the rooms, the storeys and the doors of the offline answer within the scale (T354)', () => {
    const m = at(MOCK_STRUCTURE_PROGRAM, 'large');
    expect(m.parts.storeys.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...m.parts.rooms.map((r) => r.room))).toBeGreaterThanOrEqual(partVoxels(TILE).room.side);
    // The front door, three cells of the plan wide, and the door between the wing and the body, widened to 11.
    expect(m.parts.doors).toEqual(expect.arrayContaining([{ width: 15, height: 30 }, { width: 11, height: 30 }]));
    expect(m.errors).toEqual([]);
  }, 60_000);
});

describe('the farm of 5 × 5 tiles of before (T338)', () => {
  const farm = fs.readFileSync('universe/models/fattoria.xml', 'utf8');

  it('has a house too small at every seed: its largest room is under the measure', () => {
    for (const seed of [1, 2, 3, 4]) {
      const m = at(farm, 'large', seed);
      expect(Math.max(0, ...m.parts.rooms.map((r) => r.room))).toBeLessThan(partVoxels(TILE).room.side);
      expect(m.errors.join('; ')).toMatch(/stanza: /);
    }
  }, 60_000);

  it('goes back to the Sculptor with the reason', () => {
    const c = checkProgram(farm, structure);
    expect(c.error).toMatch(/^taglia Grande, seme 1: .*stanza: la più grande in cui si sta in piedi ha il lato di \d+ voxel/);
  }, 60_000);
});

describe('what fits: the same program at three sizes (T338, T354)', () => {
  const kinds = (c: Composition) => Object.keys(c.byLetter).sort();

  for (const [name, xml, adds] of [
    // The farm (T346): a house with its lean-to and hay; then the fence's posts and rails and the fields; then the barn with its floor.
    ['fattoria', fs.readFileSync('lab/banco/taglie/fattoria.xml', 'utf8'), [['p', 'L'], ['b']]],
    // The fort: a keep with its talus; then the curtain wall; then the towers on its corners, with their slate.
    ['forte', fs.readFileSync('lab/banco/taglie/forte.xml', 'utf8'), [['C'], ['c']]],
    // As the Sculptor writes them (T354): the country house gets trees where seven cells of lawn are free, then a well; the fort a well in a
    // yard of five, then a moat where five cells of ground go on past the curtain.
    ['scultore-villetta', MOCK_STRUCTURE_PROGRAM, [['Y', 'C'], ['Q']]],
    ['scultore-rocca', fs.readFileSync('lab/banco/taglie/scultore-rocca.xml', 'utf8'), [['Q'], ['a']]],
  ] as const) {
    it(`gives the ${name} of the bench other parts at every larger size, all of them within the scale`, () => {
      const runs = SIZES.map((t) => at(xml, t));
      for (const r of runs) {
        expect(r.errors).toEqual([]);
        expect(r.parts.storeys.length).toBeGreaterThanOrEqual(2);
      }
      for (let i = 1; i < SIZES.length; i++) {
        const [small, large] = [runs[i - 1].composition, runs[i].composition];
        expect(varietyError(small, large, SIZES[i - 1], SIZES[i])).toBeUndefined();
        expect(kinds(large)).toEqual(expect.arrayContaining([...kinds(small), ...adds[i - 1]]));
        for (const k of adds[i - 1]) expect(kinds(small)).not.toContain(k);
      }
    }, 120_000);
  }

  it('sends back a program that draws the same building in a larger box', () => {
    // The country house without what fits around it (the hedge, the well, the trees) is the same house at every size.
    const bare = MOCK_STRUCTURE_PROGRAM.split('\n')
      .filter((l) => !/out="\*x"|\*\*Q\*\*|\*\*\*t\*\*\*/.test(l))
      .join('\n');
    expect(bare).not.toContain('***t***');
    const c = checkProgram(bare, structure, undefined, seedFiles(bare));
    expect(c.error).toMatch(/^varietà: alla taglia Enorme/);
    expect(c.failedAt).toEqual({ taglia: 'huge', seed: 1 });
  }, 120_000);
});
