// One temporary folder per test run, removed at the end (T177): the tests make their folders with `mkdtemp(os.tmpdir())`, and many
// never removed them (about 2000 a day in %TEMP% under the pipeline). `globalSetup` in vite.config.ts loads this before the workers
// start: they inherit TEMP, and so does whatever they spawn, so a new test needs nothing to stay clean. A run killed halfway leaves
// its folder: the next run sweeps it.
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const PREFIX = 'quine-suite-';
const VARS = ['TEMP', 'TMP', 'TMPDIR'] as const;

const remove = (dir: string) => {
  // On Windows a process that is still closing holds its folder: what stays now goes with the next sweep.
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* the next run */ }
};

const running = (pid: number): boolean => {
  try { process.kill(pid, 0); return true; } catch (e) { return (e as NodeJS.ErrnoException).code === 'EPERM'; }
};

/** Removes the folders of the runs that are over, and only those: several runs share %TEMP% under the pipeline. */
export function sweepSuites(base: string, alive: (pid: number) => boolean = running): string[] {
  const gone: string[] = [];
  let names: string[] = [];
  try { names = readdirSync(base); } catch { return gone; }
  for (const name of names) {
    const m = new RegExp(`^${PREFIX}(\\d+)-`).exec(name);
    if (!m || alive(Number(m[1]))) continue;
    remove(path.join(base, name));
    gone.push(name);
  }
  return gone;
}

export function setup(): () => void {
  const base = tmpdir();
  sweepSuites(base);
  const dir = mkdtempSync(path.join(base, `${PREFIX}${process.pid}-`));
  const before = VARS.map((k) => process.env[k]);
  for (const k of VARS) process.env[k] = dir;
  return () => {
    VARS.forEach((k, i) => { if (before[i] === undefined) delete process.env[k]; else process.env[k] = before[i]; });
    remove(dir);
  };
}
