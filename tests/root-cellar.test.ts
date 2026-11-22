// The cellar and the density on the root of a program (T494, ADR-0246): `under="N"` says how many voxels the program digs under the
// soil, `vpt="N"` the density a hand drawn program is drawn for. The compiler reads them (the soil at `under` where whoever runs it does
// not say another `base`); an index entry that says no `cellar` takes its tiles from `under / vpt`, one that says `cellar` or `vpt` wins;
// the Sculptor's programs never carry them.

import { describe, expect, it } from 'vitest';
import { compileMjx, rootVptOf, underOf } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { cellarOf, cellarVoxels, Forms, InlineRunner, vptOf, withRoot } from '../src/kernel/forms';
import { checkProgram, withoutRootDensity } from '../src/kernel/agents/sculptor';
import { modelErrors } from '../src/kernel/validator';
import { classOf } from '../src/mj/classes';

// A slab of stone under the soil and a floor on it: the soil is E, what is under it S where the program digs.
const program = (attrs: string) => `<sequence values="BES" size="20 20 60" soil="E" ${attrs} origin="bottom">
  <color symbol="S" value="8a8070" name="pietra"/>
  <color symbol="E" value="6a8a40" name="terra"/>
  <box at="10 10 0" size="20 20 2" color="S"/>
</sequence>`;

const soilLayer = (xml: string, base?: number): number => {
  const m = compileMjx(xml, base === undefined ? {} : { base });
  const g = runMjx(m, 1).grid;
  const E = g.alphabet.indexOf('E');
  for (let z = 0; z < g.Z; z++) if (g.cells[z * g.X * g.Y] === E) return z;
  return -1;
};

describe('`under` and `vpt` on the root (T494)', () => {
  it('the compiler reads them; the soil is at `under` unless `base` says another layer', () => {
    const m = compileMjx(program('under="20" vpt="10"'));
    expect(m.under).toBe(20);
    expect(m.vpt).toBe(10);
    expect(m.program.soilAt).toBe(20);
    expect(soilLayer(program('under="20" vpt="10"'))).toBe(20);
    expect(soilLayer(program('under="20"'), 0)).toBe(0);
    expect(soilLayer(program('under="20"'), 30)).toBe(30);
    expect(soilLayer(program(''))).toBe(0);
    expect(underOf(program('under="20" vpt="10"'))).toBe(20);
    expect(rootVptOf(program('under="20" vpt="10"'))).toBe(10);
    expect(rootVptOf(program(''))).toBeUndefined();
  });

  it('a number out of range does not compile, with the reason', () => {
    for (const a of ['under="0"', 'under="121"', 'under="2.5"', 'under="tanto"']) expect(() => compileMjx(program(a))).toThrow(/under/);
    for (const a of ['vpt="3"', 'vpt="41"', 'vpt="dieci"']) expect(() => compileMjx(program(a))).toThrow(/vpt/);
  });

  it('an entry without `cellar` takes 2 tiles of cellar from `under="20"` at 10 voxels a tile, the soil on the layer 20', async () => {
    const xml = program('under="20" vpt="10"');
    expect(cellarOf({ class: 'structure' }, xml)).toBe(2);
    expect(cellarVoxels({ class: 'structure' }, xml)).toBe(20);
    expect(vptOf(withRoot({ class: 'structure' }, xml))).toBe(10);
    const forms = new Forms(new InlineRunner());
    forms.load({ 'models/index.json': JSON.stringify({ segrete: { class: 'structure', name: 'Segrete' } }), 'models/segrete.xml': xml });
    const f = (await forms.wait('segrete', 1))!;
    expect(f.status).toBe('ready');
    expect(f.vpt).toBe(10);
    expect(f.base).toBe(20);
    expect(forms.request('segrete', 1)!.base).toBe(20);
    expect(forms.cellarVoxelsOf('segrete')).toBe(20);
    // The entry is as it is written: the root's defaults are read, never written into it.
    expect(forms.info('segrete')).toEqual({ class: 'structure', name: 'Segrete' });
  });

  it('the entry wins: `cellar` (0 too) and `vpt` it says are its own', async () => {
    const xml = program('under="20" vpt="10"');
    expect(cellarOf({ class: 'structure', cellar: 0 }, xml)).toBe(0);
    expect(cellarVoxels({ class: 'structure', cellar: 0 }, xml)).toBe(0);
    expect(cellarOf({ class: 'structure', cellar: 1 }, xml)).toBe(1);
    expect(cellarVoxels({ class: 'structure', cellar: 1, vpt: 20 }, xml)).toBe(20);
    expect(vptOf(withRoot({ class: 'structure', vpt: 20 }, xml))).toBe(20);
    const forms = new Forms(new InlineRunner());
    forms.load({ 'models/index.json': JSON.stringify({ terra: { class: 'structure', cellar: 0, vpt: 20 } }), 'models/terra.xml': xml });
    const f = (await forms.wait('terra', 1))!;
    expect(f.status).toBe('ready');
    expect(f.vpt).toBe(20);
    expect(f.base).toBe(0);
    // Laid on the ground: the soil on the layer 0, as without a cellar.
    expect(forms.request('terra', 1)!.base).toBe(0);
    const g = f.result!.grid;
    expect(g.cells[0]).toBe(g.alphabet.indexOf('E'));
  });

  it('a program without them runs as ever: the same request, the same entry', () => {
    const xml = program('');
    const forms = new Forms(new InlineRunner());
    forms.load({ 'models/index.json': JSON.stringify({ casa: { class: 'structure', cellar: 1 } }), 'models/casa.xml': xml });
    const info = { class: 'structure', cellar: 1 };
    expect(withRoot(info, xml)).toBe(info);
    expect(cellarVoxels(info, xml)).toBe(cellarVoxels(info));
    expect(forms.request('casa', 1)!.base).toBe(20);
    expect(cellarOf({ class: 'structure' }, xml)).toBe(0);
  });

  it('the Sculptor never writes them: its programs lose them before they are checked', () => {
    const xml = program('under="20" vpt="10"');
    const bare = withoutRootDensity(xml);
    expect(bare).not.toMatch(/under=|vpt=/);
    expect(bare).toContain('soil="E"');
    expect(withoutRootDensity(program(''))).toBe(program(''));
    const c = checkProgram(xml, classOf('rock')!);
    expect(c.xml).not.toMatch(/under=|vpt=/);
  });

  it('the validator tries a program with `under` as deep as the world runs it', () => {
    // No `size` anywhere (the validator takes a size on any tag for the program's own box): the class's box, `under` voxels deeper.
    const xml = `<sequence values="BESO" soil="E" under="20" origin="bottom">
  <color symbol="S" value="8a8070"/>
  <color symbol="E" value="6a8a40"/>
  <color symbol="O" value="6a8a40"/>
  <prl in="O" out="S"/>
</sequence>`;
    expect(compileMjx(xml, { size: [20, 20, 60] }).program.soilAt).toBe(20);
    expect(modelErrors('models/x.xml', xml, 4000, [20, 20, 40])).toEqual([]);
    expect(modelErrors('models/x.xml', xml, 4000, [20, 20, 40], undefined, { base: 0 })).toEqual([]);
  });
});
