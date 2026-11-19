// The forms on disk, for the tests only (ADR-0108): vitest gives every test file its own modules, so the cache of the process
// would not outlive a file and each file would pay its first boot (about 10 s). `setupFiles` in vite.config.ts loads this; the
// game and the server never do, nothing under src/ or server/ imports it.
//
// One file per result, named by the SHA-256 of its key, in a folder named by the version of the engine. Several workers write at
// once: each file is written aside and renamed, so a reader sees all of it or nothing. The folder can be deleted at any time.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { sharedForms, type FormBacking, type FormResult } from '../../src/kernel/forms';

/**
 * What a result is made by: the engine, its random numbers (`src/mj/` imports them from the kernel), `runForm`, the furnishing it does for
 * a building with an interior (`furnish.ts`, `interior.ts`) and how a result is written here (this file: T431 added `furniture`).
 */
export function engineVersion(root = process.cwd()): string {
  const dir = path.join(root, 'src/mj');
  const kernel = ['rng.ts', 'forms.ts', 'furnish.ts', 'interior.ts'].map((f) => path.join(root, 'src/kernel', f));
  const sources = [...fs.readdirSync(dir).sort().map((f) => path.join(dir, f)), ...kernel, path.join(root, 'tests/setup/forms-disk.ts')];
  const hash = crypto.createHash('sha256');
  // A file that is not there (a root made by a test) adds its name only.
  for (const f of sources) hash.update(fs.existsSync(f) ? fs.readFileSync(f) : f);
  return hash.digest('hex').slice(0, 24);
}

/** A length, the result without its cells as JSON, the cells. */
function encode(r: FormResult): Buffer {
  const { X, Y, Z, alphabet } = r.grid;
  const head = Buffer.from(JSON.stringify({ X, Y, Z, alphabet, palette: r.palette, actions: r.actions, animations: r.animations, ...(r.furniture ? { furniture: r.furniture } : {}) }));
  const size = Buffer.alloc(4);
  size.writeUInt32LE(head.length);
  return Buffer.concat([size, head, r.grid.cells]);
}

/** Undefined for whatever is not a whole result: then the program simply runs again. */
function decode(b: Buffer): FormResult | undefined {
  if (b.length < 4) return undefined;
  const end = 4 + b.readUInt32LE(0);
  if (end > b.length) return undefined;
  try {
    const { X, Y, Z, alphabet, palette, actions, animations, furniture } = JSON.parse(b.toString('utf8', 4, end));
    if (X * Y * Z !== b.length - end) return undefined;
    // A copy: the buffer of a small file may be shared with others in node's pool.
    return { grid: { X, Y, Z, alphabet, cells: new Uint8Array(b.subarray(end)) }, palette, actions, animations, ...(furniture ? { furniture } : {}) };
  } catch {
    return undefined;
  }
}

export function diskForms(dir: string): FormBacking {
  const fileOf = (key: string) => path.join(dir, `${crypto.createHash('sha256').update(key).digest('hex')}.form`);
  return {
    read(key) {
      try {
        return decode(fs.readFileSync(fileOf(key)));
      } catch {
        return undefined;
      }
    },
    write(key, result) {
      const file = fileOf(key);
      const aside = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}`;
      try {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(aside, encode(result));
        fs.renameSync(aside, file);
      } catch {
        // Another worker holds the file (Windows) or the disk is full: only a miss the next time.
        fs.rmSync(aside, { force: true });
      }
    },
  };
}

sharedForms.backing = diskForms(path.join(process.cwd(), 'node_modules/.cache/quine-forms', engineVersion()));
