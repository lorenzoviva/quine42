// The parts one lives in as sub-blocks of the seed, the areas of a structure and the maps that come back to the box (T346,
// ADR-0182): a part is a program that alone builds its own scene and is validated like the rest of the library; included, it
// climbs, opens, crowns or pierces what the program that includes it has built; a program marks its areas on the ground and draws no
// animal; a program whose maps return to the root's scale takes the box it is given, like one without maps.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkProgram, shareableProgram, withSize } from '../src/kernel/agents/sculptor';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';
import { formAreas, habitableParts, type Form } from '../src/kernel/forms';
import { modelErrors } from '../src/kernel/validator';
import { AREA_RE, areaNames, areasOf } from '../src/mj/areas';
import { analyse } from '../src/mj/check';
import { boxOf, classOf, partVoxels, TILE } from '../src/mj/classes';
import { compileMjx, hasMapIn, mapsBackToBox, mjxIncludes, type MjxFiles } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { animalLetters, merlonRuns } from '../lab/banco/taglie/misure';

const structure = classOf('structure')!;
const PARTS = ['part-stair', 'part-door', 'part-battlements', 'part-slits'];
const read = (id: string) => fs.readFileSync(`universe/models/${id}.xml`, 'utf8');
const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? read(f.replace(/\.xml$/, '')) : undefined));

describe('the parts one lives in, as sub-blocks of the seed (T346)', () => {
  it('each part alone builds its scene from its origin and passes the validator of the library', () => {
    for (const id of PARTS) {
      const xml = read(id);
      expect(modelErrors(`models/${id}.xml`, xml), id).toEqual([]);
      const m = compileMjx(xml);
      const r = runMjx(m, 1, { deadline: 20_000 });
      expect(r.finished, id).toBe(true);
      expect(analyse(r, m.program.palette, { grounded: true }).errors, id).toEqual([]);
    }
  }, 60_000);

  it('the stair alone climbs its house: two storeys reached on foot through its door, of the least measures', () => {
    const m = compileMjx(read('part-stair'));
    const r = runMjx(m, 1, { deadline: 20_000 });
    const parts = habitableParts(r.grid, m.program.palette, TILE, partVoxels(TILE).storey.clear, 0, m.actions, 1);
    expect(parts.storeys.length).toBe(2);
    expect(parts.doors).toEqual([{ width: 11, height: 30 }]);
  });

  it('the stair takes the first 16 cells of a longer strip and gives the rest back (T354): the house of the Sculptor marks a zone of 20', () => {
    const xml = MOCK_STRUCTURE_PROGRAM;
    const m = compileMjx(xml, { size: boxOf(structure, 'large'), files: seedFiles(xml) });
    const r = runMjx(m, 1, { deadline: 20_000 });
    const k = r.grid.alphabet.indexOf('k');
    const columns = new Set<number>();
    for (let i = 0; i < r.grid.cells.length; i++) if (r.grid.cells[i] === k) columns.add(i % r.grid.X);
    expect(columns.size).toBe(16);
    const parts = habitableParts(r.grid, m.program.palette, TILE, partVoxels(TILE).storey.clear, 0, m.actions, 1);
    expect(parts.storeys).toEqual([1, 33]);
    // The contract of every part is the first paragraph of its comment, a blank line before the rest.
    for (const id of PARTS) expect(read(id)).toMatch(/^<!--\n[\s\S]+?\n\n[\s\S]+?Written by lab\/banco\/taglie\/parti\.mjs/);
  }, 60_000);

  it('the battlements are regular: merlons of five from every corner, and a slit under each of them', () => {
    for (const id of ['part-battlements', 'part-slits']) {
      const m = compileMjx(read(id));
      const r = runMjx(m, 1, { deadline: 20_000 });
      expect(merlonRuns(r.grid, 'M'), id).toEqual({ 5: 16 });
      if (id === 'part-slits') expect(analyse(r, m.program.palette).colors.U).toBeGreaterThan(0);
    }
  });

  it('included, a part does nothing from its origin and works on what the program built: the fort of the bench climbs, opens, crowns and pierces', () => {
    const xml = fs.readFileSync('lab/banco/taglie/forte.xml', 'utf8');
    const files = seedFiles(xml);
    expect(Object.keys(files).sort()).toEqual(['part-battlements.xml', 'part-door.xml', 'part-slits.xml', 'part-stair.xml']);
    const m = compileMjx(xml, { size: boxOf(structure, 'large'), files });
    const r = runMjx(m, 1, { deadline: 20_000 });
    // The trial scenes' letter S never appears: an include has no origin (the fort's own S is a marker that goes).
    const S = r.grid.alphabet.indexOf('S');
    expect(S >= 0 ? r.grid.cells.filter((c) => c === S).length : 0).toBe(0);
    const parts = habitableParts(r.grid, m.program.palette, TILE, partVoxels(TILE).storey.clear, 0, m.actions, 1);
    expect(parts.storeys.length).toBe(2);
    expect(parts.doors).toEqual([{ width: 11, height: 30 }]);
    const runs = merlonRuns(r.grid, 'M');
    expect(runs[5]).toBeGreaterThan(10);
    expect(Object.keys(runs).filter((k) => Number(k) > 7)).toEqual([]);
    expect(analyse(r, m.program.palette).colors.U).toBeGreaterThan(0);
  }, 60_000);
});

describe('the areas of a structure (T346)', () => {
  it('a letter of the palette carries area="…", a plain name; a wrong one is dropped with a note', () => {
    const m = compileMjx('<sequence values="BW#1" size="4 4 4" ground="W"><color symbol="W" value="aabbcc" area="yard"/><color symbol="#1" hidden="True" area="Pasture Of Mine"/><all in="B" out="W" steps="1"/></sequence>');
    expect(m.program.palette.W.area).toBe('yard');
    expect(m.program.palette[Object.keys(m.program.palette).find((k) => k !== 'W')!].area).toBeUndefined();
    expect(m.warnings.join(' ')).toMatch(/area "Pasture Of Mine"/);
    expect(AREA_RE.test('tower-floor')).toBe(true);
    expect(AREA_RE.test('')).toBe(false);
  });

  it('reads the ground layer tile by tile: the area with most cells, hidden letters too, none where none', () => {
    // Two tiles of 4 × 4 on a grid of 8 × 4: the left one half yard and half pasture (a tie: the first name), the right one of no area.
    const m = compileMjx('<sequence values="BypW" size="8 4 2" ground="W"><color symbol="y" value="aabbcc" area="yard"/><color symbol="p" hidden="True" area="pasture"/><color symbol="W" value="112233"/><all in="W" out="y" steps="8"/><all in="yW" out="*p" steps="8"/></sequence>');
    const r = runMjx(m, 1, { deadline: 5_000 });
    const g = r.grid;
    // Write the layer by hand: x < 2 yard, 2 ≤ x < 4 pasture, the rest wall.
    for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) g.cells[x + y * 8] = g.alphabet.indexOf(x < 2 ? 'y' : x < 4 ? 'p' : 'W');
    expect(areasOf(g, m.program.palette, 4)).toEqual({ pasture: [[0, 0]] });
    g.cells[0] = g.alphabet.indexOf('y');
    g.cells[2] = g.alphabet.indexOf('y');
    expect(areasOf(g, m.program.palette, 4)).toEqual({ yard: [[0, 0]] });
    expect(areaNames(m.program.palette)).toEqual(['pasture', 'yard']);
    expect(areasOf(g, m.program.palette, 4, 7)).toEqual({});
  });

  it('the farm of the bench marks its ground and draws no animal; the areas of a form are read once', () => {
    const xml = fs.readFileSync('lab/banco/taglie/fattoria.xml', 'utf8');
    const m = compileMjx(xml, { size: boxOf(structure, 'gargantuan'), files: seedFiles(xml) });
    expect(animalLetters(m.program.palette)).toEqual([]);
    const r = runMjx(m, 2, { deadline: 30_000 });
    const areas = areasOf(r.grid, m.program.palette, TILE);
    expect(Object.keys(areas)).toEqual(expect.arrayContaining(['house', 'shelter', 'yard', 'barn']));
    for (const tiles of Object.values(areas)) for (const [x, y] of tiles) expect(x >= 0 && x < 10 && y >= 0 && y < 10).toBe(true);
    const form = { result: { grid: r.grid, palette: m.program.palette, actions: [], animations: [] }, vpt: TILE, base: 0 } as unknown as Form;
    expect(formAreas(form)).toEqual(areas);
    expect(formAreas(form)).toBe(form.areas);
    expect(formAreas({ vpt: TILE, base: 0 } as Form)).toEqual({});
  }, 60_000);
});

describe('a program whose maps come back to the box (T346)', () => {
  const plan = '<sequence values="BNE" symmetry="(xy)" soil="E" origin="bottom"><map scale="1/10 1/10 1" values="BNEW"><rule in="E" out="E"/><rule in="N" out="N"/><all in="NE" out="*W" steps="1"/><map scale="10 10 1" values="BW"><rule in="W" out="WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW"/><rule in="N" out="WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW/WWWWWWWWWW"/><all in="B W" out="W *" steps="3"/></map></map><color symbol="W" value="aabbcc"/></sequence>';

  it('is told from one that stays on another scale', () => {
    expect(mapsBackToBox(plan)).toBe(true);
    expect(mapsBackToBox('<sequence values="BW" size="8 8 8"><map scale="3 3 3"/></sequence>')).toBe(false);
    expect(mapsBackToBox('<sequence values="BW"><map scale="1/4 1/4 1/4"><map scale="4 4 2"/></map></sequence>')).toBe(false);
    expect(mapsBackToBox('<sequence values="BW" size="8 8 8"><all in="B" out="W"/></sequence>')).toBe(false);
    expect(hasMapIn(plan)).toBe(true);
  });

  it('takes the box it is given, keeps its soil, and so serves every size (shareable)', () => {
    expect(shareableProgram(plan)).toBe(true);
    expect(withSize(plan, [20, 20, 16])).toContain('size="20 20 16"');
    // The one that stays on another scale keeps its own box, as before (ADR-0160).
    expect(withSize('<sequence values="BW" size="8 8 8"><map scale="3 3 3"/></sequence>', [20, 20, 16])).toContain('size="8 8 8"');
    for (const side of [100, 150, 200]) {
      const m = compileMjx(plan, { size: [side, side, 8] });
      const r = runMjx(m, 1, { deadline: 5_000 });
      expect([r.grid.X, r.grid.Y, r.grid.Z]).toEqual([side, side, 8]);
      expect(analyse(r, m.program.palette).voxels).toBe(2000);
    }
    expect(() => compileMjx('<sequence values="BNE" soil="E" size="40 40 8"><map scale="1/4 1/4 1" values="BNE"><rule in="E" out="E"/></map></sequence>')).toThrow(/suolo non vale con map/);
  });

  it('the farm of the bench is such a program: the kernel checks it at its sizes with the parts of the seed', () => {
    const xml = fs.readFileSync('lab/banco/taglie/fattoria.xml', 'utf8');
    expect(mapsBackToBox(xml)).toBe(true);
    expect(shareableProgram(xml)).toBe(true);
    expect(checkProgram(xml, structure, 'large', seedFiles(xml)).error).toBeUndefined();
  }, 120_000);
});
