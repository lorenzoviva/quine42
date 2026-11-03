// The forms shared by the kernels of a process (T161, ADR-0108): what the key says, what is kept, how much, and that nobody changes it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Forms, FormCache, formKey, InlineRunner, instanceGrid, runForm, sharedForms, type FormComp, type FormRequest, type FormResult } from '../src/kernel/forms';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { hashStr } from '../src/kernel/rng';
import { diskForms, engineVersion } from './setup/forms-disk';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });

const PROGRAM = '<sequence values="BW"><box at="0 0 0" size="1 1 1" color="W"/></sequence>';
const req = (over: Partial<FormRequest> = {}): FormRequest => ({ xml: PROGRAM, seed: 1, size: [2, 2, 2], vpt: 20, ...over });
const fresh = () => {
  const cache = new FormCache();
  return { cache, runner: new InlineRunner(cache) };
};
// On whole forms and grids `toEqual`, and `not.toBe` too (it looks for a hint), walk millions of cells inside vitest: seconds each.
const sameCells = (a: Uint8Array, b: Uint8Array) => Buffer.compare(a, b) === 0;
/** Many steps on a big box: longer than a millisecond on any machine. */
const SLOW = '<one values="BW" size="60 60 60"><rule in="B" out="W"/></one>';

describe('two kernels of a process', () => {
  it('have forms of their own and the same result, without being told', async () => {
    const [a, b] = [await boot(), await boot()];
    expect(a.forms === b.forms).toBe(false);
    const [fa, fb] = [(await a.forms.wait('corona-drone', 1))!, (await b.forms.wait('corona-drone', 1))!];
    expect(fa === fb).toBe(false);
    expect(fa.result).toBe(fb.result);
    expect(sharedForms.size).toBeGreaterThan(0);
  });
});

describe('the key', () => {
  it('tells apart the box, the tint, the seed and the program', async () => {
    const { cache, runner } = fresh();
    const base = await runner.run(req());
    const others = [req({ size: [3, 2, 2] }), req({ seed: 2 }), req({ tint: { symbol: 'W', color: '#ff0000' } }), req({ tint: { symbol: 'W', color: '#00ff00' } }), req({ xml: PROGRAM.replace('color="W"', 'color="B"') })];
    for (const q of others) expect(await runner.run(q)).not.toBe(base);
    expect(cache.size).toBe(1 + others.length);
    expect((await runner.run(req({ size: [3, 2, 2] }))).grid.X).toBe(3);
    expect((await runner.run(req({ tint: { symbol: 'W', color: '#ff0000' } }))).palette.W.color).toBe('#ff0000');
  });

  it('does not change for what does not change the voxels', async () => {
    const { cache, runner } = fresh();
    const base = await runner.run(req({ model: 'uno' }));
    for (const q of [req({ model: 'due' }), req({ vpt: 8 }), req({ rig: true }), req({ sway: true }), req({ tempo: 5_000 })]) expect(await runner.run(q)).toBe(base);
    expect(cache.size).toBe(1);
  });

  it('does not take for one two programs with the same short hash, nor two tints that read alike', () => {
    // A collision of the 32 bits of hashStr, found on the spot: the universes of a server could write one.
    const seen = new Map<number, string>();
    let pair: [string, string] | undefined;
    let state = 1;
    for (let i = 0; !pair && i < 2_000_000; i++) {
      // Digits in order do not collide: this hash is too regular for them.
      state = Math.imul(state, 1103515245) + 12345;
      const xml = `<!-- ${(state >>> 0).toString(36)}${i.toString(36)} -->${PROGRAM}`;
      const h = hashStr(xml);
      const other = seen.get(h);
      if (other) pair = [other, xml];
      else seen.set(h, xml);
    }
    expect(pair).toBeDefined();
    expect(formKey(req({ xml: pair![0] }))).not.toBe(formKey(req({ xml: pair![1] })));
    expect(formKey(req({ tint: { symbol: 'a', color: 'b","c' } }))).not.toBe(formKey(req({ tint: { symbol: 'a","b', color: 'c' } })));
  });
});

describe('what is kept', () => {
  it('not a run out of time, and it comes back whole when there is time', async () => {
    const { cache, runner } = fresh();
    const late = await runner.run(req({ xml: SLOW, size: undefined, tempo: 1 }));
    expect(late.grid.cells.includes(0), 'half a model').toBe(true);
    expect(cache.size).toBe(0);
    expect(cache.bytes).toBe(0);
    const whole = await runner.run(req({ xml: SLOW, size: undefined, tempo: 30_000 }));
    expect(whole.grid.cells.includes(0)).toBe(false);
    expect(cache.size).toBe(1);
    // What has finished does not depend on the time given: `tempo` is not in the key.
    expect(await runner.run(req({ xml: SLOW, size: undefined, tempo: 1 }))).toBe(whole);
  }, 60_000);

  it('not a program that fails', async () => {
    const { cache, runner } = fresh();
    await expect(runner.run(req({ xml: 'x'.repeat(1_000_001) }))).rejects.toThrow();
    await expect(runner.run(req({ xml: '<sequence values="BW" size="0 0 0"/>' }))).rejects.toThrow();
    expect(cache.size).toBe(0);
  });
});

describe('the limit', () => {
  const result = (cells: number): FormResult => ({ grid: { X: cells, Y: 1, Z: 1, cells: new Uint8Array(cells), alphabet: ['B'] }, palette: {}, actions: [], animations: [] });

  it('by entries: the least recently used goes first', () => {
    const cache = new FormCache(2);
    cache.set('a', result(1));
    cache.set('b', result(1));
    expect(cache.get('a')).toBeDefined();
    cache.set('c', result(1));
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBeDefined();
    expect(cache.get('c')).toBeDefined();
    expect(cache.size).toBe(2);
  });

  it('by memory, and it counts what goes out and what is written again', () => {
    const cache = new FormCache(100, 7000);
    const one = cache.set('a', result(2000));
    const weight = cache.bytes;
    expect(weight).toBeGreaterThanOrEqual(2000);
    cache.set('a', result(2000));
    expect(cache.bytes).toBe(weight);
    cache.set('b', result(2000));
    cache.set('c', result(2000));
    expect(cache.bytes).toBeLessThanOrEqual(7000);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(2);
    expect(one.grid.X).toBe(2000);
  });

  it('what is bigger than all of it goes to who asked and pushes nothing out', () => {
    const cache = new FormCache(100, 5000);
    cache.set('a', result(100));
    expect(cache.set('enorme', result(6000)).grid.X).toBe(6000);
    expect(cache.get('enorme')).toBeUndefined();
    expect(cache.get('a')).toBeDefined();
  });

  it('there is no way to empty it from a runner', () => {
    expect('clear' in new InlineRunner()).toBe(false);
    expect('clear' in new FormCache()).toBe(false);
  });
});

describe('a shared result', () => {
  it('cannot be written, but for its cells', async () => {
    const r = await fresh().runner.run(req());
    expect(() => ((r as any).actions = [])).toThrow(TypeError);
    expect(() => ((r.grid as any).X = 9)).toThrow(TypeError);
    expect(() => r.grid.alphabet.push('Z')).toThrow(TypeError);
    expect(() => ((r.palette as any).W = {})).toThrow(TypeError);
    expect(() => ((r.palette.W as any).color = '#000')).toThrow(TypeError);
  });

  it('stays as it was after a kernel has used it: actions, collision, footprints', async () => {
    const k = await boot();
    const id = k.spawnModuleEntity(k.modules.get('object.well')!, 3.5, 3.5, undefined, 'test#porta');
    const fc = k.ecs.get(id, 'form') as FormComp;
    fc.model = 'fattoria';
    fc.seed = 1;
    const f = (await k.forms.wait('fattoria', 1))!;
    expect(f.status).toBe('ready');
    const shared = f.result!;
    const before = new Uint8Array(shared.grid.cells);
    expect(k.modelActions(id).map((a) => a.name)).toContain('apri');
    expect(k.doModelAction(id, 'apri')).toBe(true);
    expect(fc.done).toEqual(['apri']);
    (k as any).groundOf(id, fc, f);
    const opened = instanceGrid(k.forms, f, ['apri']);
    expect(opened.cells.some((c, i) => c !== before[i]), 'the action changes the instance').toBe(true);
    expect(opened.cells.buffer === shared.grid.cells.buffer).toBe(false);
    expect(sameCells(shared.grid.cells, before)).toBe(true);
    expect(sameCells(shared.grid.cells, runForm(k.forms.request('fattoria', 1)!).grid.cells)).toBe(true);
    // And a kernel that comes after sees the door closed.
    const other = (await (await boot()).forms.wait('fattoria', 1))!;
    expect(other.result).toBe(shared);
    expect(sameCells(other.result!.grid.cells, before)).toBe(true);
  }, 120_000);

  it('gives two Forms their own collision', async () => {
    const runner = new InlineRunner(new FormCache());
    const files = { 'models/index.json': '{}', 'models/x.xml': '<sequence values="BW" size="4 4 4"><box at="0 0 0" size="4 4 1" color="W"/></sequence>' };
    const [a, b] = [new Forms(runner), new Forms(runner)];
    a.load(files);
    b.load(files);
    const [fa, fb] = [(await a.wait('x', 1))!, (await b.wait('x', 1))!];
    expect(fa.result).toBe(fb.result);
    expect(fa.foot).not.toBe(fb.foot);
    expect(fa.levels).not.toBe(fb.levels);
  });
});

describe('the forms on disk of the tests', () => {
  const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'quine-forme-'));

  it('give back the same result to another process, sealed', async () => {
    const d = dir();
    const first = fresh();
    first.cache.backing = diskForms(d);
    const made = await first.runner.run(req({ tint: { symbol: 'W', color: '#123456' } }));
    const again = fresh();
    again.cache.backing = diskForms(d);
    const read = await again.runner.run(req({ tint: { symbol: 'W', color: '#123456' } }));
    expect(read).not.toBe(made);
    expect(read).toEqual(made);
    expect(() => ((read.palette.W as any).color = '#000')).toThrow(TypeError);
    fs.rmSync(d, { recursive: true, force: true });
  });

  it('take whatever is not a whole result for a miss', () => {
    const d = dir();
    const disk = diskForms(d);
    const whole = runForm(req());
    disk.write('k', whole);
    const [file] = fs.readdirSync(d);
    expect(file.endsWith('.form')).toBe(true);
    expect(disk.read('k')!.grid.cells).toEqual(whole.grid.cells);
    const bytes = fs.readFileSync(path.join(d, file));
    for (const bad of [bytes.subarray(0, 2), bytes.subarray(0, 20), bytes.subarray(0, bytes.length - 1), Buffer.from([1, 0, 0, 0, 123])]) {
      fs.writeFileSync(path.join(d, file), bad);
      expect(disk.read('k')).toBeUndefined();
    }
    expect(disk.read('altra')).toBeUndefined();
    fs.rmSync(d, { recursive: true, force: true });
  });

  it('leave nothing aside when many write the same result', () => {
    const d = dir();
    const whole = runForm(req());
    for (let i = 0; i < 20; i++) diskForms(d).write('k', whole);
    expect(fs.readdirSync(d)).toHaveLength(1);
    fs.rmSync(d, { recursive: true, force: true });
  });

  it('change folder when the engine changes', () => {
    const d = dir();
    fs.mkdirSync(path.join(d, 'src/mj'), { recursive: true });
    fs.mkdirSync(path.join(d, 'src/kernel'), { recursive: true });
    fs.writeFileSync(path.join(d, 'src/mj/engine.ts'), 'a');
    fs.writeFileSync(path.join(d, 'src/kernel/rng.ts'), 'b');
    fs.writeFileSync(path.join(d, 'src/kernel/forms.ts'), 'c');
    let last = engineVersion(d);
    for (const f of ['src/mj/engine.ts', 'src/kernel/rng.ts', 'src/kernel/forms.ts']) {
      fs.appendFileSync(path.join(d, f), '!');
      const v = engineVersion(d);
      expect(v).not.toBe(last);
      last = v;
    }
    fs.rmSync(d, { recursive: true, force: true });
  });
});
