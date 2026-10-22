// Things look like their MarkovJunior programs (ADR-0041): the seed's library, forms in the kernel,
// collision from the voxels, actions as rules on the model.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { modelErrors } from '../src/kernel/validator';
import { classOf } from '../src/mj/classes';
import type { FormComp } from '../src/kernel/forms';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

describe('the library of models', () => {
  it('has a program for every class, all valid, all described in the index', () => {
    const index = JSON.parse(bundledFiles['models/index.json']);
    const files = Object.keys(bundledFiles).filter((p) => /^models\/.*\.xml$/.test(p));
    expect(files.length).toBeGreaterThanOrEqual(20);
    for (const p of files) {
      const id = p.slice('models/'.length, -'.xml'.length);
      expect(index[id], id).toBeDefined();
      expect(classOf(index[id].classe), id).toBeDefined();
      expect(modelErrors(p, bundledFiles[p]), id).toEqual([]);
    }
    // Every class has its generic model, used when a thing has none of its own.
    for (const c of ['persona', 'animale', 'bestia', 'albero', 'cespuglio', 'roccia', 'sasso', 'oggetto', 'mobile', 'edificio', 'monumento', 'grande']) expect(bundledFiles[`models/${c}.xml`], c).toBeDefined();
  }, 60_000);

  it('refuses a program that does not stand', () => {
    expect(modelErrors('models/x.xml', '<sequence values="BW" size="4 4 4"><box at="2 2 2" size="2 2 1" color="W"/></sequence>').join()).toMatch(/terra/);
    // What the front-end can mend it mends (an undeclared letter); what is left is judged: here, nothing was built.
    expect(modelErrors('models/x.xml', '<sequence values="BW" size="4 4 4"><one in="BX" out="WW"/></sequence>').join()).toMatch(/vuoto/);
    expect(modelErrors('models/x.xml', '<sequence values="BW" size="4 4 4"><wfc/></sequence>').join()).toMatch(/WFC/);
  });
});

describe('forms in the kernel', () => {
  it('gives every thing its model, a seed for who it is, and items the generic thing in their colour', async () => {
    const k = await boot();
    const cat = k.spawnModuleEntity(k.modules.get('npc.cat')!, 0.5, 0.5, undefined, 'test#gatto');
    const well = k.spawnModuleEntity(k.modules.get('object.well')!, 3.5, 3.5, undefined, 'test#pozzo');
    const item = k.spawnItem('item.forbici', 1.5, 1.5);
    const bread = k.spawnItem([...k.content.items.keys()].find((id) => !k.content.get(id)!.model)!, 2.5, 1.5);
    expect((k.ecs.get(cat, 'form') as FormComp).model).toBe('animale');
    expect((k.ecs.get(well, 'form') as FormComp).model).toBe('pozzo');
    // An item defined by a module has the module's model; the others the generic thing.
    expect((k.ecs.get(item, 'form') as FormComp).model).toBe('forbici');
    const f = k.ecs.get(bread, 'form') as FormComp;
    expect(f.model).toBe('oggetto');
    expect(f.tint).toBe(k.itemInfo(k.ecs.get(bread, 'pickup').item).color);
    expect((k.ecs.get(k.playerId, 'form') as FormComp).model).toBe('viandante');
    // The same person in another place is another seed of the same program; a few seeds per kind.
    const seeds = new Set(Array.from({ length: 30 }, (_, i) => k.forms.seedFor('persona', `p${i}`)));
    expect(seeds.size).toBeGreaterThan(1);
    expect(Math.max(...seeds)).toBeLessThanOrEqual(8);
    // A thing whose model is missing falls back to its class's.
    expect(k.forms.resolve('non-esiste', 'albero')).toBe('albero');
    expect(k.forms.resolve(undefined, undefined)).toBe('oggetto');
  });

  it('a solid thing blocks with its voxels, not with its whole cell', async () => {
    const k = await boot();
    k.tick(1 / 60);
    // A clear patch of ground, far from the start.
    let spot: [number, number] | undefined;
    for (let y = -8; y <= 8 && !spot; y++)
      for (let x = -8; x <= 8 && !spot; x++) {
        let ok = true;
        for (let dy = -3; dy <= 3 && ok; dy++) for (let dx = -3; dx <= 3 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.2);
        if (ok) spot = [x + 0.5, y + 0.5];
      }
    expect(spot).toBeDefined();
    const [x, y] = spot!;
    const well = k.spawnModuleEntity(k.modules.get('object.well')!, x, y, undefined, 'test#pozzo');
    const fc = k.ecs.get(well, 'form') as FormComp;
    fc.yaw = 0;
    const form = await k.forms.wait(fc.model, fc.seed);
    expect(form?.status).toBe('ready');
    k.tick(1 / 60);
    // Where its voxels stand (the rim) one cannot go; where they do not (the shaft, the corners of its
    // box) one can, even in the same tile: the footprint, not the cell.
    const g = form!.result!.grid;
    const at = (vx: number, vy: number) => [x + (vx + 0.5 - g.X / 2) / 20, y + (vy + 0.5 - g.Y / 2) / 20] as const;
    let blocked = 0, open = 0;
    for (let vy = 0; vy < g.Y; vy += 3)
      for (let vx = 0; vx < g.X; vx += 3) {
        const [px, py] = at(vx, vy);
        const solid = !!form!.foot![vx + vy * g.X];
        expect(k.free(px, py, 0.001), `${vx},${vy}`).toBe(!solid);
        solid ? blocked++ : open++;
      }
    expect(blocked).toBeGreaterThan(10);
    expect(open).toBeGreaterThan(10);
    expect(k.free(x + 2.5, y, 0.1)).toBe(true);
  });

  it('runs the actions of a model as rules on its voxels, and remembers them', async () => {
    const k = await boot();
    const house = k.spawnModuleEntity(k.modules.get('object.well')!, 5.5, 5.5, undefined, 'test#casa');
    const fc = k.ecs.get(house, 'form') as FormComp;
    fc.model = 'grande';
    fc.seed = 1;
    expect(k.modelActions(house)).toEqual([]);
    await k.forms.wait('grande', 1);
    expect(k.modelActions(house).map((a) => a.name)).toEqual(['apri']);
    expect(k.actionsFor(house).some((o) => o.id === 'modello:apri' && o.label === 'Apri la porta')).toBe(true);
    await k.perform(house, 'modello:apri');
    expect(fc.done).toEqual(['apri']);
    expect(k.modelActions(house).map((a) => a.name)).toEqual(['chiudi']);
    expect(k.saveState()).toBe(true);
    expect(JSON.parse(k.repo.head().files['world/stato.json']!).forme['test#casa']).toEqual(['apri']);
    // Closing it again: back to how it was made, nothing left to remember.
    await k.perform(house, 'modello:chiudi');
    expect(fc.done).toEqual([]);
  }, 30_000);
});
