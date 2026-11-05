// T260 + T273: the four universes one can explore (the seed `universe/` for aurora, and the three of Claude Cloud in
// lab/banco/universi-cloud/) say the kernel they were written for, and that kernel is this one: the same X.Y, a Z not above ours.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkKernelVersion, KERNEL_VERSION, parseVersion } from '../src/kernel/version';

const ROOTS: Record<string, string> = {
  aurora: 'universe',
  orichalcum: 'lab/banco/universi-cloud/orichalcum',
  neapolis: 'lab/banco/universi-cloud/neapolis',
  sidera: 'lab/banco/universi-cloud/sidera',
};

const config = (root: string) => JSON.parse(readFileSync(join(root, 'universe.json'), 'utf8')) as { name: string; kernel?: unknown };

describe('the four universes say their kernel', () => {
  for (const [name, root] of Object.entries(ROOTS)) {
    it(`${name} is of this kernel's contract`, () => {
      const u = config(root);
      expect(u.name).toBe(name);
      // Written, not implied: a universe without the field would be read as 0.1.0.
      expect(typeof u.kernel).toBe('string');
      expect(parseVersion(u.kernel)).toBeDefined();
      expect(checkKernelVersion(u.kernel, KERNEL_VERSION)).toEqual({ ok: true });
    });
  }
});
