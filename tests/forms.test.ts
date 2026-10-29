// Things look like their MarkovJunior programs (ADR-0041): the seed's library, forms in the kernel,
// collision from the voxels, actions as rules on the model.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { modelErrors } from '../src/kernel/validator';
import { classOf } from '../src/mj/classes';
import { InlineRunner, type FormComp, type FormRequest, type FormResult } from '../src/kernel/forms';
import { formCacheKey, restoreFormResult, MemoryFormStore, WorkerRunner } from '../src/render/forms';

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

describe('precalculated variants and form cache (T64)', () => {
  it('computes deterministic formCacheKey with all variants and hashes', () => {
    const req1: FormRequest = { xml: '<sequence values="BW"/>', seed: 1, vpt: 20, model: 'circuito-3D' };
    const req2: FormRequest = { xml: '<sequence values="BW"/>', seed: 1, vpt: 20, model: 'circuito-3D' };
    const reqDiffSeed: FormRequest = { xml: '<sequence values="BW"/>', seed: 2, vpt: 20, model: 'circuito-3D' };
    const reqDiffXml: FormRequest = { xml: '<sequence values="BR"/>', seed: 1, vpt: 20, model: 'circuito-3D' };
    const reqTint: FormRequest = { xml: '<sequence values="BW"/>', seed: 1, vpt: 20, tint: { symbol: 'W', color: '#ff0000' }, model: 'circuito-3D' };

    expect(formCacheKey(req1)).toBe(formCacheKey(req2));
    expect(formCacheKey(req1)).not.toBe(formCacheKey(reqDiffSeed));
    expect(formCacheKey(req1)).not.toBe(formCacheKey(reqDiffXml));
    expect(formCacheKey(req1)).not.toBe(formCacheKey(reqTint));
  });

  it('restores typed arrays safely via restoreFormResult', () => {
    const mockRes: any = {
      grid: { X: 2, Y: 2, Z: 2, cells: [1, 2, 3, 4], alphabet: ['B', 'W'] },
      palette: {},
      actions: [],
      animations: [],
      meshes: {
        body: {
          positions: [0, 0, 0, 1, 1, 1],
          normals: [0, 1, 0, 0, 1, 0],
          colors: [1, 1, 1, 1, 1, 1],
          indices: [0, 1],
        },
        limbs: [],
        frames: [
          {
            positions: [0, 0, 0],
            normals: [0, 1, 0],
            colors: [1, 0, 0],
            indices: [0],
          },
        ],
      },
    };

    const restored = restoreFormResult(mockRes);
    const meshes = restored.meshes as any;
    expect(restored.grid.cells).toBeInstanceOf(Uint8Array);
    expect(meshes.body.positions).toBeInstanceOf(Float32Array);
    expect(meshes.body.normals).toBeInstanceOf(Float32Array);
    expect(meshes.body.colors).toBeInstanceOf(Float32Array);
    expect(meshes.body.indices).toBeInstanceOf(Uint32Array);
    expect(meshes.frames[0].positions).toBeInstanceOf(Float32Array);
    expect(meshes.frames[0].indices).toBeInstanceOf(Uint32Array);
  });

  it('MemoryFormStore stores, retrieves, and clears results', async () => {
    const store = new MemoryFormStore();
    const mockRes: any = { grid: { X: 1, Y: 1, Z: 1, cells: new Uint8Array([0]), alphabet: ['B'] }, palette: {}, actions: [], animations: [] };
    expect(await store.get('test#1')).toBeUndefined();
    await store.set('test#1', mockRes);
    expect(await store.get('test#1')).toBe(mockRes);
    await store.clear();
    expect(await store.get('test#1')).toBeUndefined();
  });

  it('WorkerRunner caches results in memory and deduplicates in-flight calls', async () => {
    const allMessages: any[] = [];
    let latestWorker: any;
    const workerFactory = () => {
      latestWorker = {
        messages: [] as any[],
        postMessage(data: any) {
          allMessages.push(data);
          this.messages.push(data);
        },
        terminate() {},
      };
      return latestWorker as unknown as Worker;
    };

    const store = new MemoryFormStore();
    const runner = new WorkerRunner(1, store, workerFactory);

    const req: FormRequest = { xml: '<sequence values="BW"/>', seed: 1, vpt: 20, model: 'circuito-3D' };
    const fakeResult: FormResult = {
      grid: { X: 1, Y: 1, Z: 1, cells: new Uint8Array([1]), alphabet: ['B', 'W'] },
      palette: {},
      actions: [],
      animations: [],
      meshes: {
        body: { positions: new Float32Array([0, 0, 0]), normals: new Float32Array([0, 1, 0]), colors: new Float32Array([1, 1, 1]), indices: new Uint32Array([0]) },
        limbs: [],
        frames: [],
      },
    };

    // 1. First run triggers worker message (after microtask store check)
    const p1 = runner.run(req);
    // 2. Concurrent second call for same key shares in-flight promise without sending second worker message
    const p2 = runner.run(req);

    // Give microtasks time to check store and dispatch to worker
    await new Promise((r) => setTimeout(r, 5));
    expect(allMessages.length).toBe(1);
    const jobId = allMessages[0].id;

    // Worker completes
    latestWorker.onmessage?.({ data: { id: jobId, ok: true, result: fakeResult } } as MessageEvent);

    const r1 = await p1;
    const r2 = await p2;
    expect(r1).toBe(fakeResult);
    expect(r2).toBe(fakeResult);
    expect(runner.cachedCount).toBe(1);

    // 3. Third call hits memory cache immediately (no worker messages)
    const r3 = await runner.run(req);
    expect(r3).toBe(fakeResult);
    expect(allMessages.length).toBe(1);

    // 4. Stored in store as well
    const key = formCacheKey(req);
    expect(await store.get(key)).toBe(fakeResult);

    // 5. Create a new runner with the populated store: loads from store without worker!
    const runner2 = new WorkerRunner(1, store, workerFactory);
    const rFromStore = await runner2.run(req);
    expect(rFromStore).toEqual(fakeResult);
    expect(allMessages.length).toBe(1); // Still 1! No new worker message sent!
  });

  it('Forms.seedsOf returns 4 seeds for heavy models and preload initiates them', async () => {
    const k = await boot();
    expect(k.forms.seedsOf('circuito-3D')).toBe(4);
    expect(k.forms.seedsOf('schermo-struttura')).toBe(4);
    expect(k.forms.seedsOf('schermo-scritte')).toBe(4);
    expect(k.forms.seedsOf('albero')).toBe(3);

    const forms = k.forms.preload('circuito-3D');
    expect(forms.length).toBe(4);
    expect(forms.map((f) => f.seed)).toEqual([1, 2, 3, 4]);
  });

  it('InlineRunner caches results across repeated runs', async () => {
    const runner = new InlineRunner();
    const req: FormRequest = { xml: '<sequence values="BW" size="2 2 2"><box at="0 0 0" size="1 1 1" color="W"/></sequence>', seed: 1, vpt: 20, model: 'test' };
    const r1 = await runner.run(req);
    const r2 = await runner.run(req);
    expect(r1).toBe(r2);
  });
});
