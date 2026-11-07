// The engine's Stepper (T315, ADR-0164): a program kept on its grid between calls, for what moves a little at every tick of a page.
// `advance` cut in pieces is the run `runOn` makes in one go, voxel for voxel; `tick` runs the program again from its first node with its
// matches kept up to date from the grid's log, keeps the log bounded, and leaves every other run as it was (tests/mj-engine-determinism).

import { describe, expect, it } from 'vitest';
import { Stepper, runOn, type Grid3, type Node3, type Program3 } from '../src/mj/engine';

const palette = (codes: string): Program3['palette'] => Object.fromEntries([...codes].map((c) => [c, {}]));

/** A grid of `fill`, with `marks` cells set, in an alphabet that starts with air. */
function grid(X: number, Y: number, Z: number, alphabet: string, fill: string, marks: Array<[number, string]> = []): Grid3 {
  const codes = ['.', ...alphabet];
  const cells = new Uint8Array(X * Y * Z).fill(codes.indexOf(fill));
  for (const [i, c] of marks) cells[i] = codes.indexOf(c);
  return { X, Y, Z, cells, alphabet: codes, log: [], epoch: 0 };
}

const MAZE: Node3 = {
  type: 'sequence',
  children: [
    { type: 'one', rules: [{ in: 'WBB', out: 'WAW' }] },
    { type: 'one', steps: 1, rules: [{ in: 'W', out: 'S' }] },
    { type: 'path', from: 'W', to: 'S', on: 'WA', color: 'P', longest: true, steps: 1 },
  ],
};
/** Grows from a seed, then fills what it grew, then grows again from there: a markov node that starts its children again. */
const SPREAD: Node3 = {
  type: 'markov',
  children: [
    { type: 'one', rules: [{ in: 'RB', out: 'RG' }], steps: 5 },
    { type: 'all', rules: [{ in: 'G', out: 'R' }] },
  ],
};
/** In three dimensions, with every kind of rule node and a symmetry. */
const CORAL: Node3 = {
  type: 'sequence',
  children: [
    { type: 'one', rules: [{ in: 'RB', out: 'RR' }], steps: 400, symmetry: 'all' },
    { type: 'prl', rules: [{ in: 'RB', out: 'UB', p: 0.2 }, { in: 'RB', out: 'PB', p: 0.1 }] },
    { type: 'all', rules: [{ in: 'UR', out: 'UU' }], steps: 2 },
  ],
};

describe('the Stepper of the engine', () => {
  const cases: Array<[string, () => Grid3, Node3, string]> = [
    ['the maze, in two dimensions', () => grid(31, 21, 1, 'BWASP', 'B', [[15 + 10 * 31 - 1, 'W']]), MAZE, 'BWASP'],
    ['a markov node that starts its children again', () => grid(24, 24, 1, 'BRG', 'B', [[12 + 12 * 24, 'R']]), SPREAD, 'BRG'],
    ['a coral in three dimensions', () => grid(15, 15, 15, 'BRUP', 'B', [[7 + 7 * 15, 'R']]), CORAL, 'BRUP'],
  ];

  it.each(cases)('advance cut in pieces is the run of runOn, voxel for voxel: %s', (_name, make, program, codes) => {
    for (const seed of [1, 42, 4242]) {
      const whole = make();
      const all = runOn(whole, { palette: palette(codes), program }, seed, 1_000_000);
      const cut = make();
      const stepper = new Stepper(cut, { palette: palette(codes), program }, seed);
      let made = 0;
      for (let k = 0; k < 100_000; k++) {
        const piece = 1 + (k % 7);
        const n = stepper.advance(piece);
        made += n;
        if (n < piece) break;
      }
      expect(made).toBe(all.steps);
      expect(stepper.steps).toBe(all.steps);
      expect(Buffer.from(cut.cells).equals(Buffer.from(whole.cells))).toBe(true);
    }
  });

  it('tick runs the program again at every call, on matches kept up to date', () => {
    // One cell a tick turns from B to C: a stale match would write a cell that is C already, and fewer would turn.
    const g = grid(40, 30, 1, 'BC', 'B');
    const stepper = new Stepper(g, { palette: palette('BC'), program: { type: 'sequence', children: [{ type: 'one', steps: 1, rules: [{ in: 'B', out: 'C' }] }] } }, 7);
    const C = g.alphabet.indexOf('C');
    for (let t = 1; t <= 1200; t++) {
      expect(stepper.tick(16)).toBe(1);
      if (t % 100 === 0) expect(g.cells.filter((c) => c === C).length).toBe(t);
    }
    expect(stepper.tick(16)).toBe(0);
  });

  it('tick keeps the log of the grid bounded', () => {
    const g = grid(8, 8, 1, 'AB', 'A');
    const flip: Node3 = { type: 'sequence', children: [{ type: 'all', steps: 1, rules: [{ in: 'A', out: 'B' }] }, { type: 'all', steps: 1, rules: [{ in: 'B', out: 'A' }] }] };
    const stepper = new Stepper(g, { palette: palette('AB'), program: flip }, 3);
    for (let t = 0; t < 500; t++) stepper.tick(4);
    expect(g.log.length).toBeLessThanOrEqual(4096 + 2 * 64);
    expect(g.cells.every((c) => c === g.alphabet.indexOf('A'))).toBe(true);
  });

  it('leaves the runs of runOn as they were, in between its ticks', () => {
    const maze = () => grid(31, 21, 1, 'BWASP', 'B', [[15 + 10 * 31 - 1, 'W']]);
    const alone = maze();
    runOn(alone, { palette: palette('BWASP'), program: MAZE }, 99);
    const other = grid(24, 24, 1, 'BRG', 'B', [[12 + 12 * 24, 'R']]);
    const stepper = new Stepper(other, { palette: palette('BRG'), program: SPREAD }, 5);
    stepper.tick(3);
    const between = maze();
    runOn(between, { palette: palette('BWASP'), program: MAZE }, 99);
    stepper.tick(3);
    expect(Buffer.from(between.cells).equals(Buffer.from(alone.cells))).toBe(true);
  });
});
