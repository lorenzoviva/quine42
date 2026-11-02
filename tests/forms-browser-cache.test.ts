// The browser's cache of forms keeps only what has finished, like the kernel's (T163, ADR-0108), and throws away once what it saved before.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Forms, type FormRequest, type FormResult } from '../src/kernel/forms';
import { FORMS_DB_VERSION, formCacheKey, IdbFormStore, MemoryFormStore, WorkerRunner } from '../src/render/forms';
import type { WorkerAnswer } from '../src/render/worker';

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
  const open = (name: string, version: number) => {
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
        transaction: (s: string) => ({
          objectStore: () => {
            const answer = (result?: unknown) => {
              const r: Record<string, any> = { result };
              setTimeout(() => r.onsuccess?.());
              return r;
            };
            return {
              get: (k: string) => answer(d.stores.get(s)!.get(k)),
              put: (v: unknown, k: string) => (d.stores.get(s)!.set(k, v), answer()),
              clear: () => (d.stores.get(s)!.clear(), answer()),
            };
          },
        }),
      };
      if (d.version < version) {
        d.version = version;
        req.onupgradeneeded?.();
      }
      req.onsuccess?.();
    });
    return req;
  };
  return { open, dbs };
}

describe('the persistent cache', () => {
  it('does not reuse what was saved before this version, once', async () => {
    const idb = fakeIndexedDB();
    const key = formCacheKey(req());
    idb.dbs.set('rune-forms', { version: 1, stores: new Map([['forms', new Map<string, unknown>([[key, result()]])]]) });
    vi.stubGlobal('indexedDB', idb);

    const { runner, sent, answer } = pool(new IdbFormStore() as unknown as MemoryFormStore);
    const asked = runner.run(req());
    await new Promise((r) => setTimeout(r, 20));
    expect(sent.length, 'the old entry does not answer').toBe(1);
    expect(idb.dbs.get('rune-forms')!.version).toBe(FORMS_DB_VERSION);
    expect(FORMS_DB_VERSION).toBeGreaterThan(1);
    const whole = result();
    answer({ id: sent[0].id, ok: true, result: whole, finished: true });
    await asked;
    await new Promise((r) => setTimeout(r, 20));

    // What is saved from now on stays across a reload.
    const reloaded = await new IdbFormStore().get(key);
    expect(reloaded?.grid.X).toBe(whole.grid.X);
  });

  it('goes on without it when an old tab holds the database', async () => {
    vi.stubGlobal('indexedDB', fakeIndexedDB(true));
    const store = new IdbFormStore();
    expect(await store.get('k')).toBeUndefined();
    await store.set('k', result());
    expect(await store.get('k')).toBeUndefined();
  });
});
