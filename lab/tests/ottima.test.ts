// The reference of «done well» (T371, D53): the author's fort, versioned, and the scale that says how close a fort of any letters comes to
// it. The saved measures must be those of the fort on disk; the reference scores 10 against itself; a fort written as the Sculptor writes
// it scores less, the same whatever side its gate faces; a box of stone scores almost nothing. Nothing here calls a model.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileMjx, mjxIncludes } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import { classOf, structureVoxels, STRUCTURE_VPT } from '../../src/mj/classes';
import { facing, fortTraits, REFERENCE_FILE, REFERENCE_VERSION, referencePath, SCALE, scoreOf, sha256, type FortTraits, type Reference } from '../banco/riferimento/ottima';

const seedFiles = (xml: string) => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));
const reference = (): Reference => JSON.parse(fs.readFileSync(referencePath(), 'utf8')) as Reference;

describe('il riferimento dell’ottima (T371)', () => {
  it('le misure salvate sono quelle del forte dell’autore su disco, alla versione corrente', () => {
    const ref = reference();
    expect(ref.version).toBe(REFERENCE_VERSION);
    expect(ref.file).toBe(REFERENCE_FILE);
    // A new fort is a new version: `banco-ottima.ts -- --riferimento --versione v2`, then REFERENCE_VERSION.
    expect(ref.sha256, 'il forte è cambiato: rifai il riferimento con una versione nuova').toBe(sha256(fs.readFileSync(REFERENCE_FILE, 'utf8')));
    expect(ref.vpt).toBe(10);
    expect(ref.seeds.length).toBeGreaterThanOrEqual(3);
    // What the standard has: a courtyard of many rectangles, towers on the corners, several storeys reached on foot, walks in height.
    expect(ref.traits.courtyard).toBeGreaterThan(0.3);
    expect(ref.traits.courtyardBends).toBeGreaterThanOrEqual(4);
    expect(ref.traits.cornerTowers).toBeGreaterThanOrEqual(0.75);
    expect(ref.traits.storeys).toBeGreaterThanOrEqual(3);
    expect(ref.traits.upperStoreys).toBeGreaterThanOrEqual(2);
    expect(ref.traits.wallHeight).toBeGreaterThan(1.3);
  });

  it('il riferimento fa 10 contro sé stesso, e ogni voce della scala ha un nome e una spiegazione', () => {
    const ref = reference();
    const s = scoreOf(ref.traits, ref.traits);
    expect(s.total).toBe(10);
    for (const i of s.items) expect(i.score).toBe(1);
    for (const item of SCALE) {
      expect(item.name.length).toBeGreaterThan(2);
      expect(item.what.length).toBeGreaterThan(10);
      expect(Object.keys(ref.traits)).toContain(item.id);
    }
  });

  it('la rocca scritta come lo Scultore (T354) a Grande: le misure si leggono, il voto sta sotto il riferimento, e non cambia girando il portone', () => {
    const xml = fs.readFileSync('lab/banco/taglie/scultore-rocca.xml', 'utf8');
    const model = compileMjx(xml, { size: structureVoxels(classOf('structure')!, 'large'), files: seedFiles(xml) });
    const r = runMjx(model, 1, { deadline: 30_000 });
    expect(r.finished).toBe(true);
    const t = fortTraits(r.grid, model.program.palette, STRUCTURE_VPT, model.actions, 1);
    expect(t.footprintTiles).toBeGreaterThan(4);
    expect(t.courtyard).toBeGreaterThan(0);
    expect(t.storeys).toBeGreaterThanOrEqual(2);
    expect(t.towers).toBeGreaterThanOrEqual(1);
    const s = scoreOf(t, reference().traits);
    expect(s.total).toBeGreaterThan(1);
    expect(s.total).toBeLessThan(9);
    for (const i of s.items) expect(i.score).toBeGreaterThanOrEqual(0), expect(i.score).toBeLessThanOrEqual(1);
    // The gate on another side: the walk still gets in.
    const turned = fortTraits(facing(r.grid, 1), model.program.palette, STRUCTURE_VPT, model.actions, 1);
    expect(turned.storeys).toBe(t.storeys);
    expect(turned.courtyardBends).toBe(t.courtyardBends);
    expect(turned.towers).toBe(t.towers);
  }, 60_000);

  it('una scatola di pietra senza cortile né piani fa quasi zero', () => {
    const model = compileMjx('<sequence values="BW" size="60 60 40"><all in="B" out="W"/><color symbol="W" value="888888" name="pietra"/></sequence>', {});
    const r = runMjx(model, 1, { deadline: 10_000 });
    const t = fortTraits(r.grid, model.program.palette, 20, [], 1);
    expect(t.courtyard).toBe(0);
    expect(t.courtyardBends).toBe(0);
    expect(t.storeys).toBe(0);
    expect(t.towers).toBe(0);
    expect(scoreOf(t, reference().traits).total).toBeLessThan(3);
  });

  it('un tratto che il riferimento non ha resta fuori dalla media', () => {
    const ref = reference();
    const none: FortTraits = { ...ref.traits, openings: 0 };
    const s = scoreOf(ref.traits, none);
    expect(s.items.find((i) => i.id === 'openings')).toBeUndefined();
    expect(s.total).toBe(10);
  });
});
