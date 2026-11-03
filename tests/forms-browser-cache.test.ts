// The browser's cache of forms keeps only what has finished, like the kernel's (T163, ADR-0108), and throws away once what it saved before.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Forms, type FormRequest, type FormResult } from '../src/kernel/forms';
import { FORMS_DB_VERSION, formCacheKey, IdbFormStore, keepsFormsOnDisk, MemoryFormStore, WorkerRunner } from '../src/render/forms';
import type { WorkerAnswer } from '../src/render/worker';
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

  it('goes on without it when an old tab holds the database', async () => {
    vi.stubGlobal('indexedDB', fakeIndexedDB(true));
    const store = new IdbFormStore();
    expect(await store.get('k')).toBeUndefined();
    await store.set('k', result());
    expect(await store.get('k')).toBeUndefined();
  });
});
