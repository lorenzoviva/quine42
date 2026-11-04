// The browser's cache of forms keeps only what has finished, like the kernel's (T163, ADR-0108), and throws away once what it saved before.
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Forms, type Form, type FormRequest, type FormResult } from '../src/kernel/forms';
import { FORM_DISK_BYTES, FORMS_DB_VERSION, formBytes, formCacheKey, IdbFormStore, keepsFormsOnDisk, MemoryFormStore, WorkerRunner } from '../src/render/forms';
import { geoOf, geoWhenReady, geometryCount, trimGeometries } from '../src/render/models';
import { askCampusModels } from '../src/render/corona3d';
import type { MeshData } from '../src/mj/mesh';
import type { FormMeshes, MeshAnswer, MeshRead, WorkerAnswer } from '../src/render/worker';
import { hashStr } from '../src/kernel/rng';

const PROGRAM = '<sequence values="BW"><box at="0 0 0" size="1 1 1" color="W"/></sequence>';
/** Many steps on a big box: longer than a millisecond on any machine. */
const SLOW = '<one values="BW" size="60 60 60"><rule in="B" out="W"/></one>';
const req = (over: Partial<FormRequest> = {}): FormRequest => ({ xml: PROGRAM, seed: 1, size: [2, 2, 2], vpt: 20, model: 'x', ...over });
const result = (): FormResult => ({ grid: { X: 1, Y: 1, Z: 1, cells: new Uint8Array([1]), alphabet: ['B', 'W'] }, palette: {}, actions: [], animations: [] });
const tick = () => new Promise((r) => setTimeout(r, 5));

/** A pool of one worker that answers when told. */
function pool(store = new MemoryFormStore()) {
  const sent: Array<{ id: number; req: FormRequest }> = [];
  let worker: Worker | undefined;
  const runner = new WorkerRunner(1, store, () => (worker = { postMessage: (m: { id: number; req: FormRequest }) => sent.push(m), terminate() {} } as unknown as Worker));
  const answer = (a: WorkerAnswer) => worker!.onmessage!({ data: a } as MessageEvent);
  return { runner, store, sent, answer };
}

afterEach(() => vi.unstubAllGlobals());

describe('WorkerRunner', () => {
  it('gives what has not finished to who asked, and keeps it nowhere', async () => {
    const { runner, store, sent, answer } = pool();
    const key = formCacheKey(req());
    const half = result();
    const asked = runner.run(req());
    await tick();
    answer({ id: sent[0].id, ok: true, result: half, finished: false });
    expect(await asked).toBe(half);
    expect(runner.has(key)).toBe(false);
    expect(runner.getCached(key)).toBeUndefined();
    expect(runner.cachedCount).toBe(0);
    expect(await store.get(key)).toBeUndefined();

    // Asked again it runs again, and now it finishes.
    const whole = result();
    const again = runner.run(req());
    await tick();
    expect(sent.length).toBe(2);
    answer({ id: sent[1].id, ok: true, result: whole, finished: true });
    expect(await again).toBe(whole);
    expect(runner.has(key)).toBe(true);
    expect(await store.get(key)).toBe(whole);
  });

  it('does the same without workers', async () => {
    const store = new MemoryFormStore();
    const runner = new WorkerRunner(0, store);
    const late = req({ xml: SLOW, size: undefined, tempo: 1 });
    const half = await runner.run(late);
    expect(half.grid.cells.includes(0), 'half a model').toBe(true);
    expect(runner.has(formCacheKey(late))).toBe(false);
    expect(await store.get(formCacheKey(late))).toBeUndefined();

    const whole = await runner.run(req());
    expect(whole).not.toHaveProperty('finished');
    expect(whole).not.toHaveProperty('model');
    expect(runner.has(formCacheKey(req()))).toBe(true);
    expect(await store.get(formCacheKey(req()))).toBe(whole);
  });

  it('does not run again at every frame what has not finished: the Form stays', async () => {
    const { runner, sent, answer } = pool();
    const forms = new Forms(runner);
    forms.load({ 'models/index.json': '{}', 'models/x.xml': PROGRAM });
    for (let frame = 0; frame < 3; frame++) forms.get('x', 1);
    await tick();
    answer({ id: sent[0].id, ok: true, result: result(), finished: false });
    await tick();
    expect(forms.get('x', 1)?.status).toBe('ready');
    await tick();
    expect(sent.length).toBe(1);
  });
});

describe('the key (T164)', () => {
  /** Two programs that draw different things, with the same 32 bits of hashStr: a comment changes until they meet. */
  function collision(): [string, string] {
    const white = '<sequence values="BW"><box at="0 0 0" size="1 1 1" color="W"/></sequence>';
    const red = '<sequence values="BR"><box at="0 0 0" size="1 1 1" color="R"/></sequence>';
    const seen = new Map<number, string>();
    let state = 1;
    for (let i = 0; i < 2_000_000; i++) {
      state = Math.imul(state, 1103515245) + 12345;
      const comment = `<!-- ${(state >>> 0).toString(36)}${i.toString(36)} -->`;
      const w = comment + white;
      seen.set(hashStr(w), w);
      const r = seen.get(hashStr(comment + red));
      if (r) return [r, comment + red];
    }
    throw new Error('no collision found');
  }

  it('does not give one program the form of another with the same short hash', async () => {
    const [a, b] = collision();
    expect(a).not.toBe(b);
    expect(hashStr(a)).toBe(hashStr(b));
    const first = req({ xml: a });
    const second = req({ xml: b });
    expect(formCacheKey(first)).not.toBe(formCacheKey(second));

    const runner = new WorkerRunner(0, new MemoryFormStore());
    const [ra, rb] = [await runner.run(first), await runner.run(second)];
    expect(ra.grid.alphabet).toContain('W');
    expect(rb.grid.alphabet).toContain('R');
    expect(runner.cachedCount).toBe(2);
  });

  it('is the same for the same request, and different for what changes the result', () => {
    expect(formCacheKey(req())).toBe(formCacheKey(req()));
    expect(formCacheKey(req({ tint: undefined }))).toBe(formCacheKey(req()));
    for (const other of [
      req({ seed: 2 }),
      req({ size: [2, 2, 3] }),
      req({ vpt: 8 }),
      req({ rig: true }),
      req({ sway: true }),
      req({ tint: { symbol: 'W', color: '#ff0000' } }),
      req({ xml: `${PROGRAM} ` }),
    ])
      expect(formCacheKey(other)).not.toBe(formCacheKey(req()));
    expect(formCacheKey(req({ tint: { symbol: 'a', color: 'b","c' } }))).not.toBe(formCacheKey(req({ tint: { symbol: 'a","b', color: 'c' } })));
  });

  it('does not depend on who asks: two names of one program, or how long they wait, are one result', async () => {
    expect(formCacheKey(req({ model: 'y' }))).toBe(formCacheKey(req()));
    expect(formCacheKey(req({ tempo: 5_000 }))).toBe(formCacheKey(req()));
    const { runner, sent, answer } = pool();
    const whole = result();
    const asked = runner.run(req());
    await tick();
    answer({ id: sent[0].id, ok: true, result: whole, finished: true });
    await asked;
    expect(await runner.run(req({ model: 'y', tempo: 5_000 }))).toBe(whole);
    expect(sent.length).toBe(1);
  });

  it('two universes with a model of the same name and different programs do not share an entry', async () => {
    const store = new MemoryFormStore();
    const runner = new WorkerRunner(0, store);
    const one = await runner.run(req({ xml: '<sequence values="BW"><box at="0 0 0" size="1 1 1" color="W"/></sequence>', model: 'casa' }));
    const two = await new WorkerRunner(0, store).run(req({ xml: '<sequence values="BR"><box at="0 0 0" size="1 1 1" color="R"/></sequence>', model: 'casa' }));
    expect(one.grid.alphabet).toContain('W');
    expect(two.grid.alphabet).toContain('R');
  });
});

const mesh = (vertices: number): MeshData => ({ positions: new Float32Array(vertices * 3), normals: new Float32Array(vertices * 3), colors: new Float32Array(vertices * 3), indices: new Uint32Array(vertices) }) as MeshData;
/** A form whose arrays weigh about `kb` kilobytes, all in its mesh, and whose only cell says which it is. */
const drawn = (kb: number, which = 1): FormResult => ({ ...result(), grid: { X: 1, Y: 1, Z: 1, cells: new Uint8Array([which]), alphabet: ['B', 'W'] }, meshes: { body: mesh(Math.ceil((kb * 1024) / 40)), limbs: [], frames: [] } satisfies FormMeshes });
const other = (seed: number) => req({ seed });

/** A pool with a limit, whose worker makes a form of `kb` at once and counts its jobs. */
function limited(limit: number, kb: number, store: MemoryFormStore | IdbFormStore = new MemoryFormStore()) {
  const jobs: number[] = [];
  let worker: Worker;
  const runner = new WorkerRunner(
    1,
    store,
    () =>
      (worker = {
        postMessage: (m: { id: number; req: FormRequest }) => {
          // A worker with no IndexedDB: the store reads the meshes itself.
          if ('read' in m) return void setTimeout(() => worker.onmessage!({ data: { id: m.id, read: true } satisfies MeshAnswer } as MessageEvent));
          jobs.push(m.req.seed);
          setTimeout(() => worker.onmessage!({ data: { id: m.id, ok: true, result: drawn(kb, m.req.seed), finished: true } satisfies WorkerAnswer } as MessageEvent));
        },
        terminate() {},
      } as unknown as Worker),
    limit,
  );
  return { runner, jobs };
}

describe('the limit in memory (T175)', () => {
  const KB = 1024;

  it('sends out the least recently used, and what is used stays', async () => {
    const { runner } = limited(350 * KB, 100);
    for (const s of [1, 2, 3]) await runner.run(other(s));
    expect(runner.cachedCount).toBe(3);
    await runner.run(other(1));
    await runner.run(other(4));
    expect(runner.has(formCacheKey(other(1))), 'just used').toBe(true);
    expect(runner.has(formCacheKey(other(2))), 'the oldest').toBe(false);
    expect(runner.bytes).toBeLessThanOrEqual(350 * KB);
  });

  it('what goes out lets go of its meshes for whoever holds it, and keeps its grid', async () => {
    const { runner } = limited(150 * KB, 100);
    const first = await runner.run(other(1));
    expect(first.meshes).toBeDefined();
    await runner.run(other(2));
    expect(first.meshes).toBeUndefined();
    expect(first.meshesGone).toBe(true);
    expect(first.grid.cells[0]).toBe(1);
    expect(runner.cachedCount).toBe(1);
  });

  it('a form bigger than the limit is still kept, alone, so that the next one frees it', async () => {
    const { runner } = limited(50 * KB, 100);
    const first = await runner.run(other(1));
    expect(runner.has(formCacheKey(other(1)))).toBe(true);
    expect(first.meshes).toBeDefined();
    await runner.run(other(2));
    expect(first.meshes).toBeUndefined();
    expect(runner.cachedCount).toBe(1);
  });

  it('a form taken away comes back from the workers, the same, asked once however many frames ask', async () => {
    const { runner, jobs } = limited(150 * KB, 100);
    const forms = new Forms(runner);
    forms.load({ 'models/index.json': '{}', 'models/x.xml': PROGRAM });
    const f = forms.get('x', 1)!;
    await vi.waitFor(() => expect(f.status).toBe('ready'));
    const grid = f.result!.grid;
    await forms.wait('x', 2);
    expect(f.result!.meshesGone, 'pushed out by the second').toBe(true);
    const version = forms.version;

    for (let frame = 0; frame < 5; frame++) expect(geoOf(f)).toBeUndefined();
    expect(f.status, 'it stays ready: the kernel has its grid').toBe('ready');
    await vi.waitFor(() => expect(f.result!.meshes).toBeDefined());
    expect(jobs.filter((s) => s === 1).length, 'first run and one more').toBe(2);
    expect(forms.version, 'whoever draws sees it arrive').toBe(version + 1);
    expect(f.result!.grid).toEqual(grid);
    expect(geoOf(f)).toBeDefined();
  });

  it('a form taken away comes back from the store, without the workers, when the store has it', async () => {
    vi.stubGlobal('indexedDB', fakeIndexedDB());
    const { runner, jobs } = limited(150 * KB, 100, new IdbFormStore());
    const first = await runner.run(other(1));
    const bytes = formBytes(first);
    await runner.run(other(2));
    await new Promise((r) => setTimeout(r, 20));
    expect(first.meshesGone).toBe(true);

    const back = await runner.run(other(1));
    expect(jobs).toEqual([1, 2]);
    expect(formBytes(back)).toBe(bytes);
    expect(back.meshesGone).toBeUndefined();
    expect(back.grid.cells[0]).toBe(1);
  });

  it('a page without a persistent cache does not mistake a form without meshes for a hit', async () => {
    const { runner, jobs } = limited(150 * KB, 100);
    await runner.run(other(1));
    await runner.run(other(2));
    const back = await runner.run(other(1));
    expect(back.meshes).toBeDefined();
    expect(jobs).toEqual([1, 2, 1]);
  });
});

describe('the limit on the geometries (T175)', () => {
  const formOf = (key: string, kb: number): Form => ({ key, model: key, seed: 1, status: 'ready', result: drawn(kb), base: 0, reach: 1, vpt: 20, cls: {} as Form['cls'] });
  const NOW = 1e12;

  it('lets go of what nothing draws, the oldest first, and never of what hangs from the scene', () => {
    const scene = new THREE.Scene();
    const inScene = formOf('t175-a', 100), idle = formOf('t175-b', 100), lately = formOf('t175-c', 100);
    const a = geoOf(inScene)!, b = geoOf(idle)!, c = geoOf(lately)!;
    scene.add(new THREE.Mesh(a.body));
    const freed: string[] = [];
    b.body.addEventListener('dispose', () => freed.push('b'));
    c.body.addEventListener('dispose', () => freed.push('c'));
    a.body.addEventListener('dispose', () => freed.push('a'));

    trimGeometries(scene, NOW, 0);
    expect(freed.sort()).toEqual(['b', 'c']);
    expect(geometryCount().count, 'what hangs from the scene').toBe(1);
    expect(geoOf(inScene)).toBe(a);
    // Made again, if its meshes are still there, when someone asks.
    expect(geoOf(idle)).not.toBe(b);
    expect(geoOf(lately)).not.toBe(c);
  });

  it('does not touch what was asked for a moment ago, or what stays within the limit', () => {
    const scene = new THREE.Scene();
    const f = formOf('t175-d', 100);
    const g = geoOf(f)!;
    trimGeometries(scene, performance.now(), 0);
    expect(geoOf(f), 'asked for just now').toBe(g);
    trimGeometries(scene, NOW, Number.MAX_SAFE_INTEGER);
    expect(geoOf(f), 'within the limit').toBe(g);
    trimGeometries(scene, NOW, 0);
    expect(geoOf(f)).not.toBe(g);
    trimGeometries(scene, NOW, 0);
  });

  it('what the ring wears asks for its meshes as soon as it is ready, without waiting for the ring (T215)', () => {
    const remake = vi.fn();
    const gone = (key: string) => ({ ...formOf(key, 1), remake, result: { ...result(), meshesGone: true } });
    const forms: Record<string, Form> = { 'albero#4': gone('t215-a'), 'corona-drone#1': gone('t215-b'), 'corona-treno#1': gone('t215-c'), 'statua#320': gone('t215-d') };
    const k = { corona: { props: [{ model: 'albero', seed: 4 }, { model: 'non-ancora', seed: 1 }] }, forms: { ready: (m: string, s: number) => forms[`${m}#${s}`] }, plinthSculpture: { model: 'statua', seed: 320 } };
    askCampusModels(k as unknown as Parameters<typeof askCampusModels>[0]);
    expect(remake, 'one for each that is ready').toHaveBeenCalledTimes(4);
    askCampusModels({ ...k, plinthSculpture: undefined } as unknown as Parameters<typeof askCampusModels>[0]);
    expect(remake).toHaveBeenCalledTimes(7);
  });

  it('asks for the meshes only when the runner let go of them, not when there never were any', () => {
    const remake = vi.fn();
    const without = { ...formOf('t175-e', 1), remake };
    without.result = result();
    expect(geoOf(without)).toBeUndefined();
    expect(remake).not.toHaveBeenCalled();
    without.result = { ...result(), meshesGone: true };
    expect(geoOf(without)).toBeUndefined();
    expect(remake).toHaveBeenCalledOnce();
  });
});

describe('the worker', () => {
  it('says whether the program has finished', async () => {
    const answers: WorkerAnswer[] = [];
    const self = { postMessage: (a: WorkerAnswer) => answers.push(a), onmessage: undefined as undefined | ((ev: unknown) => void) };
    vi.stubGlobal('self', self);
    vi.resetModules();
    await import('../src/render/worker');
    self.onmessage!({ data: { id: 1, req: req() } });
    self.onmessage!({ data: { id: 2, req: req({ xml: SLOW, size: undefined, tempo: 1 }) } });
    expect(answers.map((a) => a.ok && a.finished)).toEqual([true, false]);
  }, 30_000);
});

/** Just what IdbFormStore touches of IndexedDB: databases with a version, thrown away by nobody but the upgrade. */
function fakeIndexedDB(blocked = false) {
  const dbs = new Map<string, { version: number; stores: Map<string, Map<string, unknown>> }>();
  /** Every read of an entry, as `store:key`. */
  const reads: string[] = [];
  const open =(name: string, version: number) => {
    const req: Record<string, any> = {};
    setTimeout(() => {
      if (blocked) return req.onblocked?.();
      const d = dbs.get(name) ?? { version: 0, stores: new Map() };
      dbs.set(name, d);
      req.result = {
        objectStoreNames: { contains: (s: string) => d.stores.has(s) },
        createObjectStore: (s: string) => d.stores.set(s, new Map()),
        deleteObjectStore: (s: string) => d.stores.delete(s),
        close() {},
        transaction: () => {
          const tx: Record<string, any> = {
            objectStore: (s: string) => {
              const answer = (result?: unknown) => {
                const r: Record<string, any> = { result };
                setTimeout(() => r.onsuccess?.());
                return r;
              };
              return {
                get: (k: string) => (reads.push(`${s}:${k}`), answer(d.stores.get(s)!.get(k))),
                // What goes in is a copy made now, as structured clone does: later changes to the object do not reach it.
                put: (v: unknown, k: string) => (d.stores.get(s)!.set(k, typeof v === 'object' ? { ...(v as object) } : v), answer()),
                clear: () => (d.stores.get(s)!.clear(), answer()),
                delete: (k: string) => (d.stores.get(s)!.delete(k), answer()),
                getAll: () => answer([...d.stores.get(s)!.values()]),
                getAllKeys: () => answer([...d.stores.get(s)!.keys()]),
              };
            },
          };
          setTimeout(() => tx.oncomplete?.(), 5);
          return tx;
        },
      };
      if (d.version < version) {
        d.version = version;
        req.onupgradeneeded?.();
      }
      req.onsuccess?.();
    });
    return req;
  };
  return { open, dbs, reads };
}

describe('the persistent cache', () => {
  const at = (hostname: string, port: string, search = '') => ({ hostname, port, search });

  it('stays on disk on the site and on the lasting ports of this machine, not on a port of a check (T177)', () => {
    expect(keepsFormsOnDisk(at('quine42.example', ''))).toBe(true);
    expect(keepsFormsOnDisk(at('quine42.example', '8443'))).toBe(true);
    expect(keepsFormsOnDisk(at('localhost', '5173'))).toBe(true);
    expect(keepsFormsOnDisk(at('127.0.0.1', '4173'))).toBe(true);
    for (const host of ['localhost', '127.0.0.1', '[::1]']) expect(keepsFormsOnDisk(at(host, '4877')), host).toBe(false);
    expect(keepsFormsOnDisk(at('localhost', '4877', '?skip&offline&formecache'))).toBe(true);
  });

  it('a page on a port of a check opens no database, and its forms stay in memory (T177)', async () => {
    const idb = fakeIndexedDB();
    vi.stubGlobal('indexedDB', idb);
    vi.stubGlobal('location', at('localhost', '4877', '?skip&offline'));
    const runner = new WorkerRunner(0);
    expect(runner.store).toBeInstanceOf(MemoryFormStore);
    expect(idb.dbs.size).toBe(0);
    vi.stubGlobal('location', at('localhost', '5173'));
    expect(new WorkerRunner(0).store).toBeInstanceOf(IdbFormStore);
  });

  it('does not reuse what was saved before this version, once', async () => {
    const idb = fakeIndexedDB();
    const key = formCacheKey(req());
    idb.dbs.set('rune-forms', { version: FORMS_DB_VERSION - 1, stores: new Map([['forms', new Map<string, unknown>([[key, result()], ['x#1#20#123456##0#0#2x2x2#', result()]])]]) });
    vi.stubGlobal('indexedDB', idb);

    const { runner, sent, answer } = pool(new IdbFormStore() as unknown as MemoryFormStore);
    const asked = runner.run(req());
    await new Promise((r) => setTimeout(r, 20));
    expect(sent.length, 'the old entry does not answer').toBe(1);
    expect(idb.dbs.get('rune-forms')!.version).toBe(FORMS_DB_VERSION);
    expect(idb.dbs.get('rune-forms')!.stores.get('forms')!.size, 'the old keys take no room').toBe(0);
    expect(FORMS_DB_VERSION).toBeGreaterThan(2);
    const whole = result();
    answer({ id: sent[0].id, ok: true, result: whole, finished: true });
    await asked;
    await new Promise((r) => setTimeout(r, 20));

    // What is saved from now on stays across a reload.
    const reloaded = await new IdbFormStore().get(key);
    expect(reloaded?.grid.X).toBe(whole.grid.X);
  });

  describe('grids and meshes apart (T212)', () => {
    const settle = () => new Promise((r) => setTimeout(r, 15));
    const open = () => {
      const idb = fakeIndexedDB();
      vi.stubGlobal('indexedDB', idb);
      return { idb, store: new IdbFormStore('t212', 'forms', FORM_DISK_BYTES, 100) };
    };
    const meshReads = (reads: string[]) => reads.filter((r) => r.startsWith('meshes:'));

    it('without the meshes reads no mesh, and says they are elsewhere', async () => {
      const { idb, store } = open();
      await store.set('a', drawn(100, 7));
      const light = (await store.withoutMeshes('a'))!;
      expect(light.grid.cells[0]).toBe(7);
      expect(light.meshes).toBeUndefined();
      expect(light.meshesGone).toBe(true);
      expect(meshReads(idb.reads)).toEqual([]);
      expect(store.bytesRead).toBe(1);

      const whole = (await store.get('a'))!;
      expect(whole.meshesGone).toBeUndefined();
      expect(whole.meshes).toBeDefined();
      expect(meshReads(idb.reads)).toEqual(['meshes:a']);
      expect(store.bytesRead).toBe(1 + formBytes(whole));
    });

    it('a form that never had meshes does not ask for them', async () => {
      const { store } = open();
      await store.set('a', result());
      const light = (await store.withoutMeshes('a'))!;
      expect(light.meshesGone).toBeUndefined();
      expect(await store.get('a')).toBeDefined();
      expect(await store.withoutMeshes('nothing')).toBeUndefined();
    });

    it('a load reads only the meshes of what is drawn, 0 jobs, and a mesh arrives when asked for', async () => {
      const { idb, store } = open();
      const firstLoad = limited(1024 * 1024, 100, store);
      const forms = new Forms(firstLoad.runner);
      forms.load({ 'models/index.json': '{}', 'models/x.xml': PROGRAM });
      // One at a time: in Node, with its only worker busy, the runner would run the second in this thread.
      await forms.wait('x', 1);
      await forms.wait('x', 2);
      expect(firstLoad.jobs).toEqual([1, 2]);
      await settle();
      idb.reads.length = 0;

      const again = limited(1024 * 1024, 100, new IdbFormStore('t212', 'forms', FORM_DISK_BYTES, 100));
      const reload = new Forms(again.runner);
      reload.load({ 'models/index.json': '{}', 'models/x.xml': PROGRAM });
      const [drawnOne, leftAlone] = await Promise.all([reload.wait('x', 1), reload.wait('x', 2)]);
      expect(drawnOne!.status).toBe('ready');
      expect(leftAlone!.foot, 'the kernel has what it needs').toBeDefined();
      expect(meshReads(idb.reads)).toEqual([]);

      const version = reload.version;
      expect(geoOf(drawnOne!), 'on its way, like one not ready').toBeUndefined();
      await vi.waitFor(() => expect(drawnOne!.result!.meshes).toBeDefined());
      expect(reload.version).toBe(version + 1);
      expect(geoOf(drawnOne!)).toBeDefined();
      expect(meshReads(idb.reads), 'the other stays on disk').toHaveLength(1);
      expect(leftAlone!.result!.meshes).toBeUndefined();
      expect(again.jobs).toEqual([]);
    });

    it('forms heavier together than the limit are each read once, however late who draws comes back', async () => {
      const { idb, store } = open();
      const firstLoad = limited(1024 * 1024, 100, store);
      const before = new Forms(firstLoad.runner);
      before.load({ 'models/index.json': '{}', 'models/x.xml': PROGRAM });
      for (const seed of [11, 12, 13]) await before.wait('x', seed);
      await settle();
      idb.reads.length = 0;

      // Room for one in the runner: each that arrives pushes out the one before.
      const reload = new Forms(limited(150 * 1024, 100, store).runner);
      reload.load({ 'models/index.json': '{}', 'models/x.xml': PROGRAM });
      const all = await Promise.all([11, 12, 13].map((seed) => reload.wait('x', seed)));
      for (const f of all) expect(geoOf(f!)).toBeUndefined();
      await vi.waitFor(() => expect(meshReads(idb.reads)).toHaveLength(3));
      await settle();
      for (const f of all) expect(geoOf(f!), f!.key).toBeDefined();
      await settle();
      expect(meshReads(idb.reads), 'no second reading').toHaveLength(3);
    });

    it('whoever asks once waits for the meshes (the icons)', async () => {
      const { store } = open();
      const firstLoad = limited(1024 * 1024, 100, store);
      const before = new Forms(firstLoad.runner);
      before.load({ 'models/index.json': '{}', 'models/x.xml': PROGRAM });
      await before.wait('x', 7);
      await vi.waitFor(() => expect(firstLoad.jobs.length).toBe(1));
      await settle();

      const reload = new Forms(limited(1024 * 1024, 100, store).runner);
      reload.load({ 'models/index.json': '{}', 'models/x.xml': PROGRAM });
      const f = await reload.wait('x', 7);
      expect(f!.result!.meshesGone).toBe(true);
      expect(await geoWhenReady(f!)).toBeDefined();
    });

    it('a cache of version 4 is thrown away, with no error, and the form is made again', async () => {
      const idb = fakeIndexedDB();
      const key = formCacheKey(other(1));
      const old = drawn(100, 9);
      idb.dbs.set('rune-forms', { version: 4, stores: new Map([['forms', new Map<string, unknown>([[key, old]])], ['uses', new Map<string, unknown>([[key, { at: 1, bytes: formBytes(old) }]])]]) });
      vi.stubGlobal('indexedDB', idb);
      expect(FORMS_DB_VERSION).toBe(6);

      const { runner, jobs } = limited(1024 * 1024, 100, new IdbFormStore());
      const back = await runner.withoutMeshes(other(1));
      expect(jobs, 'the old entry does not answer').toEqual([1]);
      expect(back.grid.cells[0]).toBe(1);
      expect(back.meshes).toBeDefined();
      await settle();
      const d = idb.dbs.get('rune-forms')!;
      expect(d.version).toBe(FORMS_DB_VERSION);
      expect([...d.stores.keys()].sort()).toEqual(['forms', 'meshes', 'uses']);
      expect(d.stores.get('forms')!.get(key)).not.toHaveProperty('meshes');
      expect(d.stores.get('meshes')!.has(key)).toBe(true);
    });

    it('the limit is on the total: an entry goes with its meshes, and so does what was only read without them', async () => {
      const KB = 1024;
      const idb = fakeIndexedDB();
      vi.stubGlobal('indexedDB', idb);
      const store = new IdbFormStore('t212', 'forms', 350 * KB, 100);
      for (const k of ['a', 'b', 'c']) await store.set(k, drawn(100));
      expect(await store.withoutMeshes('a'), 'a read of the grid is a use').toBeDefined();
      await store.set('d', drawn(100));
      await settle();
      const d = idb.dbs.get('t212')!;
      for (const s of ['forms', 'meshes', 'uses']) expect([...d.stores.get(s)!.keys()].sort(), s).toEqual(['a', 'c', 'd']);
      expect([...d.stores.get('uses')!.values()].reduce((n: number, u) => n + (u as { bytes: number }).bytes, 0)).toBeLessThanOrEqual(350 * KB);
    });

    it('an entry that lost its meshes is a miss for who wants them, and the workers make them', async () => {
      const idb = fakeIndexedDB();
      vi.stubGlobal('indexedDB', idb);
      const store = new IdbFormStore();
      const key = formCacheKey(other(1));
      await store.set(key, drawn(100, 1));
      await settle();
      idb.dbs.get('rune-forms')!.stores.get('meshes')!.delete(key);
      expect(await store.get(key)).toBeUndefined();
      const { runner, jobs } = limited(1024 * 1024, 100, store);
      expect((await runner.run(other(1))).meshes).toBeDefined();
      expect(jobs).toEqual([1]);
    });

    describe('read off the page (T215)', () => {
      const KEY = formCacheKey(other(1));
      /** A saved form, and a runner whose worker answers reads with `reader`. */
      const saved = async (reader: (read: MeshRead) => FormMeshes | undefined, respond = true) => {
        const idb = fakeIndexedDB();
        vi.stubGlobal('indexedDB', idb);
        const form = drawn(100, 3);
        await new IdbFormStore().set(KEY, form);
        await settle();
        idb.reads.length = 0;
        const sent: Array<{ id: number; read?: MeshRead; req?: FormRequest }> = [];
        let worker: Worker;
        const store = new IdbFormStore();
        const runner = new WorkerRunner(
          1,
          store,
          () =>
            (worker = {
              postMessage: (m: { id: number; read?: MeshRead; req?: FormRequest }) => {
                sent.push(m);
                if (m.read && respond) setTimeout(() => worker.onmessage!({ data: { id: m.id, read: true, meshes: reader(m.read!) } satisfies MeshAnswer } as MessageEvent));
              },
              terminate() {},
            } as unknown as Worker),
        );
        return { idb, form, store, runner, sent, fail: () => worker.onerror!({ message: 'guasto' } as ErrorEvent), answer: (a: WorkerAnswer | MeshAnswer) => worker.onmessage!({ data: a } as MessageEvent) };
      };

      it('the meshes come from the worker, whole, with no read on the page and no program run', async () => {
        const held = drawn(100, 3).meshes as FormMeshes;
        const { idb, store, runner, sent } = await saved(() => held);
        const back = await runner.run(other(1));
        expect(back.meshes).toBe(held);
        expect(back.meshesGone).toBeUndefined();
        expect(back.grid.cells[0]).toBe(3);
        expect(sent).toHaveLength(1);
        expect(sent[0].read).toEqual({ db: 'rune-forms', version: FORMS_DB_VERSION, store: 'meshes', key: KEY });
        expect(meshReads(idb.reads), 'nothing decoded on the page').toEqual([]);
        expect(store.bytesRead).toBe(formBytes(back));
        expect(runner.busy).toBe(0);
      });

      it('a worker that finds nothing leaves the reading to the page, and it is the same form', async () => {
        const { idb, form, runner, sent } = await saved(() => undefined);
        const back = await runner.run(other(1));
        expect(formBytes(back)).toBe(formBytes(form));
        expect(meshReads(idb.reads)).toEqual([`meshes:${KEY}`]);
        expect(sent.filter((m) => m.req), 'no program').toEqual([]);
      });

      it('a worker that breaks down does not leave who asked waiting', async () => {
        const { form, runner, fail } = await saved(() => undefined, false);
        const back = runner.run(other(1));
        await vi.waitFor(() => expect(runner.busy).toBe(1));
        fail();
        expect(formBytes(await back)).toBe(formBytes(form));
        expect(runner.busy).toBe(0);
      });

      it('a read goes before the programs that wait', async () => {
        // In Node, with no `Worker`, a program that finds its only worker busy would run on this thread.
        vi.stubGlobal('Worker', class {});
        const { runner, sent, answer } = await saved(() => undefined, false);
        const made = runner.run(other(2));
        await vi.waitFor(() => expect(sent).toHaveLength(1));
        const waiting = runner.run(other(3));
        await settle();
        const read = runner.run(other(1));
        await settle();
        answer({ id: sent[0].id, ok: true, result: drawn(1, 2), finished: true });
        await made;
        await vi.waitFor(() => expect(sent).toHaveLength(2));
        expect(sent[1].read?.key).toBe(KEY);
        answer({ id: sent[1].id, read: true });
        await read;
        await vi.waitFor(() => expect(sent).toHaveLength(3));
        expect(sent[2].req?.seed).toBe(3);
        answer({ id: sent[2].id, ok: true, result: drawn(1, 3), finished: true });
        await waiting;
      });

      it('the worker reads them from the database and hands over their buffers', async () => {
        const idb = fakeIndexedDB();
        vi.stubGlobal('indexedDB', idb);
        await new IdbFormStore().set(KEY, drawn(100, 3));
        await settle();
        const answers: Array<{ a: MeshAnswer; transfer: unknown[] }> = [];
        const self = { postMessage: (a: MeshAnswer, transfer: unknown[]) => answers.push({ a, transfer }), onmessage: undefined as undefined | ((ev: unknown) => void) };
        vi.stubGlobal('self', self);
        vi.resetModules();
        await import('../src/render/worker');
        const read = (id: number, key: string) => self.onmessage!({ data: { id, read: { db: 'rune-forms', version: FORMS_DB_VERSION, store: 'meshes', key } } });
        read(1, KEY);
        read(2, 'nothing');
        await vi.waitFor(() => expect(answers).toHaveLength(2));
        const byId = (id: number) => answers.find((x) => x.a.id === id)!;
        const meshes = byId(1).a.meshes!;
        expect(byId(1).transfer).toEqual([meshes.body.positions.buffer, meshes.body.normals.buffer, meshes.body.colors.buffer, meshes.body.indices.buffer]);
        expect(byId(2).a.meshes).toBeUndefined();
        expect(byId(2).transfer).toEqual([]);
      });
    });

    it('clear takes the meshes away too', async () => {
      const { idb, store } = open();
      await store.set('a', drawn(100));
      await store.clear();
      await settle();
      expect(idb.dbs.get('t212')!.stores.get('meshes')!.size).toBe(0);
    });
  });

  describe('the limit (T175)', () => {
    const KB = 1024;
    const settle =() => new Promise((r) => setTimeout(r, 15));
    const open = (limit: number, entries = 100) => {
      vi.stubGlobal('indexedDB', fakeIndexedDB());
      return new IdbFormStore('t175', 'forms', limit, entries);
    };

    it('sends out the least recently used: a read counts as a use', async () => {
      const store = open(350 * KB);
      for (const k of ['a', 'b', 'c']) await store.set(k, drawn(100));
      expect(await store.get('a')).toBeDefined();
      await store.set('d', drawn(100));
      await settle();
      expect(await store.get('a'), 'just read').toBeDefined();
      expect(await store.get('b'), 'the oldest').toBeUndefined();
      expect(await store.get('c')).toBeDefined();
      expect(await store.get('d')).toBeDefined();
    });

    it('holds to the number of entries too', async () => {
      const store = open(FORM_DISK_BYTES, 2);
      for (const k of ['a', 'b', 'c']) await store.set(k, drawn(1));
      await settle();
      expect(await store.get('a')).toBeUndefined();
      expect(await store.get('b')).toBeDefined();
      expect(await store.get('c')).toBeDefined();
    });

    it('does not keep what is bigger than the whole cache, and it pushes out nothing', async () => {
      const store = open(100 * KB);
      await store.set('small', drawn(50));
      await store.set('huge', drawn(500));
      await settle();
      expect(await store.get('huge')).toBeUndefined();
      expect(await store.get('small')).toBeDefined();
    });

    it('what comes back is the same form, whole', async () => {
      const store = open(350 * KB);
      const saved = drawn(100, 7);
      const bytes = formBytes(saved);
      await store.set('a', saved);
      const back = (await store.get('a'))!;
      expect(formBytes(back)).toBe(bytes);
      expect(back.grid.cells[0]).toBe(7);
    });

    it('saves the meshes even if the page lets go of them while the database opens', async () => {
      const store = open(350 * KB);
      const saved = drawn(100);
      const bytes = formBytes(saved);
      const writing = store.set('a', saved);
      saved.meshes = undefined;
      saved.meshesGone = true;
      await writing;
      const back = (await store.get('a'))!;
      expect(back.meshesGone).toBeUndefined();
      expect(formBytes(back)).toBe(bytes);
    });

    it('clear takes everything away', async () => {
      const store = open(350 * KB);
      await store.set('a', drawn(100));
      await store.clear();
      expect(await store.get('a')).toBeUndefined();
      for (const k of ['b', 'c', 'd']) await store.set(k, drawn(100));
      await settle();
      expect(await store.get('b'), 'what was cleared does not count against the limit').toBeDefined();
    });
  });

  it('goes on without it when an old tab holds the database', async () => {
    vi.stubGlobal('indexedDB', fakeIndexedDB(true));
    const store = new IdbFormStore();
    expect(await store.get('k')).toBeUndefined();
    await store.set('k', result());
    expect(await store.get('k')).toBeUndefined();
  });
});
