import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { sweepSuites } from './setup/suite-temp';

describe('the temporary folders of the tests (T177)', () => {
  it('every test and what it spawns writes inside the folder of the run', () => {
    const inRun = path.basename(tmpdir());
    expect(inRun).toMatch(/^quine-suite-\d+-/);
    const child = execFileSync(process.execPath, ['-e', 'console.log(require("os").tmpdir())'], { encoding: 'utf8' }).trim();
    expect(path.basename(child)).toBe(inRun);
  });

  it('the sweep takes the folders of the runs that are over, nothing else', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'spazzata-'));
    const names = ['quine-suite-111-aaa', 'quine-suite-222-bbb', 'quine-turni-111', 'quine-suite-x-ccc', 'coda-111'];
    for (const n of names) mkdirSync(path.join(base, n));
    writeFileSync(path.join(base, 'quine-suite-111-aaa', 'dentro.txt'), 'x');
    expect(sweepSuites(base, (pid) => pid === 222)).toEqual(['quine-suite-111-aaa']);
    expect(readdirSync(base).sort()).toEqual(names.filter((n) => n !== 'quine-suite-111-aaa').sort());
    rmSync(base, { recursive: true, force: true });
  });

  it('a base that is not there is nothing to sweep', () => {
    const none = path.join(tmpdir(), 'non-esiste');
    expect(sweepSuites(none)).toEqual([]);
    expect(existsSync(none)).toBe(false);
  });
});
