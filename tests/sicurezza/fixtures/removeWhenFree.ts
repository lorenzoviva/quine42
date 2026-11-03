// A universe's folder at the end of a test. A world's last save may still be running in it after `stop()`: `stop()` does not wait for a `git commit` that the store has
// started, and on Windows a folder that a process has as its working directory cannot be removed (EBUSY, T176: under load it outlasts the 3 s of `rmSync`'s own retries).

import { rmSync } from 'node:fs';

const BUSY = new Set(['EBUSY', 'ENOTEMPTY', 'EPERM']);

/** Removes the folder as soon as nothing holds it. What holds it longer than `ms` is an error of the test. */
export async function removeWhenFree(dir: string, ms = 60000): Promise<void> {
  const end = Date.now() + ms;
  for (;;) {
    try {
      return rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      if (!BUSY.has((e as NodeJS.ErrnoException).code ?? '') || Date.now() > end) throw e;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}
