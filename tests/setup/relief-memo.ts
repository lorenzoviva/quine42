// The relief, for the tests only (T160): `Hills` runs twice for every kernel, about 400 ms of each boot, a third of a world made
// ready; it depends only on the seed and the program. `setupFiles` in vite.config.ts loads this, nothing under src/ or server/
// does. `tests/relief.test.ts` and `tests/determinism.test.ts`, which prove what the relief does, call `vi.unmock` and run it.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';
import { engineVersion } from './forms-disk';

/** A run past this is near the program's deadline (4 s), when it may stop halfway without an error: never kept. */
const SLOW_MS = 2000;

type Tile = { n: number; h: Uint8Array };
type Fields = { tiles: Tile[]; base: number; max: number };

/** Undefined for whatever is not a whole relief: then the program simply runs again. */
function read(file: string): Fields | undefined {
  try {
    const { tiles, base, max } = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { tiles: tiles.map((t: { n: number; h: number[] }) => ({ n: t.n, h: Uint8Array.from(t.h) })), base, max };
  } catch {
    return undefined;
  }
}

/** Written aside and renamed, as the forms: several workers write at once. */
function write(file: string, f: Fields): void {
  const aside = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}`;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(aside, JSON.stringify({ ...f, tiles: f.tiles.map((t) => ({ n: t.n, h: [...t.h] })) }));
    fs.renameSync(aside, file);
  } catch {
    fs.rmSync(aside, { force: true });
  }
}

vi.mock('../../src/kernel/relief', async (original) => {
  const real = await original<typeof import('../../src/kernel/relief')>();
  const source = fs.readFileSync(path.join(process.cwd(), 'src/kernel/relief.ts'));
  const dir = path.join(process.cwd(), 'node_modules/.cache/quine-relief', engineVersion());
  const kept = new Map<string, InstanceType<typeof real.Relief>>();
  // `new Relief(…)` gives what this returns; `sea` caches its own answer, nothing else in a Relief ever changes.
  function Relief(seed: number, xml?: string) {
    const key = crypto.createHash('sha256').update(source).update(`${seed}|${xml ?? real.HILLS}`).digest('hex');
    const known = kept.get(key);
    if (known) return known;
    const file = path.join(dir, `${key}.json`);
    const saved = read(file);
    let relief: InstanceType<typeof real.Relief>;
    if (saved) {
      relief = Object.assign(Object.create(real.Relief.prototype), saved);
    } else {
      const start = performance.now();
      relief = new real.Relief(seed, xml);
      if (performance.now() - start >= SLOW_MS) return relief;
      write(file, relief as unknown as Fields);
    }
    kept.set(key, relief);
    return relief;
  }
  Relief.prototype = real.Relief.prototype;
  return { ...real, Relief };
});
