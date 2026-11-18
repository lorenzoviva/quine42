import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { runForm, vptOf, MODELS_INDEX } from '../src/kernel/forms';
import { commonHouseModel } from '../src/kernel/modeldirector';
import { REGEN_CLASSES, regenerationTargets, requestOf } from '../src/kernel/regenerate';
import { classFit } from '../src/mj/check';
import { classOf, tilesOf } from '../src/mj/classes';

// T428, ADR-0219: the buildings drawn as small as furniture. neapolis's common house of the small lots (and its newsstand) are handmade programs
// of T273 at 25 × 25 × 24 voxels without the `map` × 2 of the seed's cottage: at 20 voxels a tile, under a tile on a lot of 4 × 4. Nothing
// measured them against their class (only the Sculptor's checks do) and the regeneration of the models (ADR-0216) left the class `building` out.

/** The program of neapolis's small common house, as T273 installed it (`lab/banco/universi-cloud/neapolis`). */
const SMALL_HOUSE = readFileSync('lab/banco/universi-cloud/neapolis/models/casa-comune-edificio-f2e1f8de.xml', 'utf8');
const BUILDING = classOf('building')!;
const measure = (xml: string, vpt: number) => {
  const r = runForm({ xml, seed: 1, vpt, ...(/\ssize="/.test(xml.slice(0, 600)) ? {} : { size: [50, 50, 50] }) });
  return classFit(r.grid, r.palette, vpt, tilesOf(BUILDING));
};

describe('gli edifici disegnati piccoli come mobili (T428)', () => {
  it('la casa comune piccola di neapolis è sotto un terzo della sua classe; alla densità che la misura dice, è alla misura della classe', () => {
    const small = measure(SMALL_HOUSE, 20);
    expect(small.small).toBe(true);
    expect(Math.max(small.tiles[0], small.tiles[1])).toBeLessThan(1);
    expect(small.box).toEqual([2.5, 2.5, 2.5]);
    expect(small.fit).toBe(8);
    // The same program at the density it says: about 2.4 tiles, the class's box, and not small.
    const fitted = measure(SMALL_HOUSE, small.fit);
    expect(fitted.small).toBe(false);
    expect(Math.max(fitted.tiles[0], fitted.tiles[1])).toBeGreaterThan(2);
    expect(Math.max(fitted.tiles[0], fitted.tiles[1])).toBeLessThanOrEqual(2.5);
    expect(fitted.tiles[2]).toBeLessThanOrEqual(2.5);
    expect(fitted.fit).toBe(small.fit);
  });

  it('il casale del seme (25 voxel con la map × 2) è alla misura della classe e resta a 20', () => {
    const seed = measure(bundledFiles['models/building.xml'], 20);
    expect(seed.small).toBe(false);
    expect(seed.fit).toBe(20);
    expect(seed.height).toBeGreaterThanOrEqual(BUILDING.minHeight!);
  });

  it('una voce che dice la sua densità si mostra a quella: la casa comune piccola a vpt 8', () => {
    expect(vptOf({ class: 'building', vpt: 8 })).toBe(8);
    expect(vptOf({ class: 'building' })).toBe(20);
  });

  it('la rigenerazione dei modelli riscolpisce anche gli edifici che il mondo indossa; la casa comune dei lotti piccoli è chiesta come in gioco', async () => {
    expect(REGEN_CLASSES).toContain('building');
    const house = 'una palazzina di tufo intonacata di ocra';
    const id = commonHouseModel(house, 'building');
    const terrain = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']);
    const index = JSON.parse(bundledFiles[MODELS_INDEX]);
    const files = {
      ...bundledFiles,
      'modules/world.terrain/manifest.json': JSON.stringify({ ...terrain, commonHouse: house }),
      [MODELS_INDEX]: JSON.stringify({ ...index, [id]: { class: 'building', name: 'Palazzina di tufo (piccola)', author: 'a mano' } }),
      [`models/${id}.xml`]: SMALL_HOUSE,
    };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const targets = regenerationTargets(k, []);
    const t = targets.find((x) => x.id === id);
    expect(t).toBeDefined();
    expect(t!.request).toMatchObject({ classe: 'building', dwelling: true, nome: 'Palazzina di tufo (piccola)' });
    expect(t!.request.aspetto).toMatch(/^una palazzina di tufo intonacata di ocra: a building one enters, with the door at the front/);
    expect(t!.request.taglia).toBeUndefined();
    expect(t!.request.cellar).toBeUndefined();
    // The steps' order: the structures, then the small buildings, then the figures.
    const order = targets.map((x) => REGEN_CLASSES.indexOf(x.info.class));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('un edificio che un modulo indossa è chiesto per chi lo indossa, come un mobile', () => {
    const r = requestOf('edicola', { class: 'building', name: 'Edicola' }, [{ kind: 'module', name: 'Edicola', look: 'un chiosco di giornali verde' }]);
    expect(r).toMatchObject({ classe: 'building', nome: 'Edicola', aspetto: 'un chiosco di giornali verde' });
    expect(r.dwelling).toBeUndefined();
  });
});
