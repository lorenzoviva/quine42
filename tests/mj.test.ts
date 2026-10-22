// MarkovJunior in the game (src/mj): the engine's nodes, the measures of a model, the photographs, the
// classes and the skeleton. The conformance tests on MarkovJunior's own models are in lab/tests/mjx.test.ts.

import { describe, expect, it } from 'vitest';
import { analyse } from '../src/mj/check';
import { boxOf, classOf, CLASSES, guessClass, TILE } from '../src/mj/classes';
import { at, Mj3Error, run, runOn, type Program3 } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';
import { DAY, render, turn } from '../src/mj/photo';
import { rig } from '../src/mj/rig';
import { runMjx } from '../src/mj/run';

const prog = (size: [number, number, number], program: Program3['program'], extra: Partial<Program3> = {}): Program3 => ({ size, palette: { A: { color: '#888' }, B: { color: '#444' } }, program, ...extra });
const counts = (cells: Uint8Array, alphabet: string[]) => {
  const n: Record<string, number> = {};
  for (const c of cells) n[alphabet[c]] = (n[alphabet[c]] ?? 0) + 1;
  return n;
};
const count = (p: Program3, seed = 1) => {
  const r = run(p, seed);
  return { r, n: counts(r.grid.cells, r.grid.alphabet) };
};

// A small figure with legs and arms marked as parts (the way the Sculptor writes them).
const FIGURE = `
<sequence values="BSLAH" size="12 8 20" origin="True" symmetry="(x)">
  <color symbol="S" value="5a6a8a" name="tunica"/>
  <color symbol="L" value="4a3a2a" part="gamba" name="gambe"/>
  <color symbol="A" value="d9a066" part="braccio" name="braccia"/>
  <color symbol="H" value="e0b090" part="testa" name="testa"/>
  <box at="4 4 0" size="2 2 8" color="L"/>
  <box at="8 4 0" size="2 2 8" color="L"/>
  <box at="6 4 8" size="6 3 7" color="S"/>
  <box at="2 4 9" size="2 2 6" color="A"/>
  <box at="10 4 9" size="2 2 6" color="A"/>
  <box at="6 4 15" size="4 4 4" color="H"/>
</sequence>`;

describe('MarkovJunior 3D (src/mj)', () => {
  it('grows a column upwards from the origin, one voxel per step', () => {
    const { r, n } = count(prog([5, 5, 10], { type: 'one', rules: [{ in: 'A .', out: 'A A' }], steps: 6 }, { origin: 'A' }));
    expect(n.A).toBe(7);
    for (let z = 0; z < 7; z++) expect(at(r.grid, 2, 2, z)).toBe('A');
  });

  it('keeps gravity with symmetry xy and grows everywhere with all', () => {
    const flat = run(prog([9, 9, 9], { type: 'one', rules: [{ in: 'A.', out: 'AA' }], steps: 30 }, { origin: 'A' }), 1);
    for (let i = 0; i < flat.grid.cells.length; i++) if (flat.grid.cells[i]) expect(Math.floor(i / 81)).toBe(0);
    const round = run(prog([9, 9, 9], { type: 'one', rules: [{ in: 'A.', out: 'AA' }], steps: 60, symmetry: 'all' }, { origin: 'A' }), 1);
    expect([...round.grid.cells].some((c, i) => c && Math.floor(i / 81) > 0)).toBe(true);
  });

  it('runs to completion when nothing matches, and stops at the step budget when it never does', () => {
    const fill = run(prog([4, 4, 4], { type: 'all', rules: [{ in: '.', out: 'A' }] }), 1);
    expect(fill.finished).toBe(true);
    expect(fill.grid.cells.every((c) => c === 1)).toBe(true);
    const flip = run(prog([2, 2, 2], { type: 'markov', children: [{ type: 'one', rules: [{ in: '.', out: 'A' }, { in: 'A', out: '.' }], symmetry: 'none' }] }), 1, 500);
    expect(flip.finished).toBe(false);
  });

  it('is deterministic for a seed', () => {
    const m = compileMjx(FIGURE.replace('<box at="6 4 15"', '<prl in="B" out="H" p="0.01" steps="1"/><box at="6 4 15"'));
    expect([...runMjx(m, 7).grid.cells]).toEqual([...runMjx(m, 7).grid.cells]);
    expect([...runMjx(m, 7).grid.cells]).not.toEqual([...runMjx(m, 8).grid.cells]);
  });

  it('draws shapes resting on their base centre', () => {
    expect(count(prog([10, 10, 10], { type: 'shape', shape: 'box', at: [5, 5, 0], size: [3, 5, 2], color: 'A' })).n.A).toBe(30);
    const { r } = count(prog([12, 12, 12], { type: 'shape', shape: 'ellipsoid', at: [6, 6, 0], size: [7, 7, 7], color: 'A' }));
    expect(at(r.grid, 6, 6, 0)).toBe('A');
    expect(at(r.grid, 6, 6, 6)).toBe('A');
    expect(at(r.grid, 6, 6, 7)).toBe('.');
    expect(count(prog([10, 10, 10], { type: 'shape', shape: 'line', at: [1, 1, 1], to: [8, 1, 1], color: 'A' })).n.A).toBe(8);
  });

  it('smooths with conv and connects with path', () => {
    const conv = count(
      prog([5, 5, 5], {
        type: 'sequence',
        children: [
          { type: 'shape', shape: 'box', at: [2, 2, 0], size: [5, 5, 5], color: 'A' },
          { type: 'shape', shape: 'box', at: [2, 2, 2], size: [1, 1, 1], color: '.' },
          { type: 'conv', rules: [{ in: '.', out: 'A', neighbors: 'A', min: 20 }] },
        ],
      }),
    ).n;
    expect(conv['.'] ?? 0).toBe(0);
    const { r } = count(
      prog([9, 3, 3], {
        type: 'sequence',
        children: [
          { type: 'shape', shape: 'box', at: [0, 1, 0], size: [1, 1, 1], color: 'A' },
          { type: 'shape', shape: 'box', at: [8, 1, 0], size: [1, 1, 1], color: 'B' },
          { type: 'path', from: 'A', to: 'B', on: '.', color: 'A' },
        ],
      }),
    );
    expect(analyse({ grid: r.grid, steps: 0, finished: true, ms: 0 }, { A: { color: '#888' }, B: { color: '#444' } }).parts).toBe(1);
  });

  it('refuses what it cannot run', () => {
    expect(() => run(prog([4, 4, 4], { type: 'one', rules: [{ in: 'AB', out: 'A' }] }), 1)).toThrow(Mj3Error);
    expect(() => run({ ...prog([4, 4, 4], { type: 'one', rules: [{ in: 'A', out: 'B' }] }), size: [99, 4, 4] }, 1)).toThrow(Mj3Error);
  });

  it('unions name sets of codes in rule inputs', () => {
    const p: Program3 = {
      size: [3, 1, 1],
      palette: { R: { color: '#888' }, S: { color: '#aaa' }, M: { color: '#4a4' } },
      unions: { '#': 'RS' },
      program: { type: 'sequence', children: [{ type: 'shape', shape: 'box', at: [0, 0, 0], size: [1, 1, 1], color: 'R' }, { type: 'shape', shape: 'box', at: [1, 0, 0], size: [1, 1, 1], color: 'S' }, { type: 'all', rules: [{ in: '#', out: 'M' }] }] },
    };
    const g = run(p, 1).grid;
    expect([at(g, 0, 0, 0), at(g, 1, 0, 0), at(g, 2, 0, 0)]).toEqual(['M', 'M', '.']);
    expect(() => run({ ...p, program: { type: 'all', rules: [{ in: 'R', out: '#' }] } }, 1)).toThrow(/unione/);
  });

  it('map scales the grid, then rules go on at the new resolution', () => {
    const p: Program3 = {
      size: [2, 1, 1],
      palette: { A: { color: '#888' }, B: { color: '#444' }, C: { color: '#f00' } },
      program: {
        type: 'sequence',
        children: [
          { type: 'shape', shape: 'box', at: [0, 0, 0], size: [1, 1, 1], color: 'A' },
          { type: 'shape', shape: 'box', at: [1, 0, 0], size: [1, 1, 1], color: 'B' },
          { type: 'map', scale: [3, 3, 1], rules: [{ in: 'B', out: 'BBB/B.B/BBB' }] },
          { type: 'all', rules: [{ in: 'A', out: 'C' }] },
        ],
      },
    };
    const g = run(p, 1, 20000, { side: 64, cells: 64 ** 3 }).grid;
    expect([g.X, g.Y, g.Z]).toEqual([6, 3, 1]);
    const n = counts(g.cells, g.alphabet);
    expect(n.C).toBe(9);
    expect(at(g, 4, 1, 0)).toBe('.');
    expect(n.B).toBe(8);
  });

  it('runs more rules on a grid that already exists', () => {
    const g = run({ size: [3, 1, 1], palette: { R: { color: '#888' } }, program: { type: 'all', rules: [{ in: '.', out: 'R' }] } }, 1).grid;
    runOn(g, { palette: { M: { color: '#4a4' } }, program: { type: 'one', rules: [{ in: 'R', out: 'M' }], steps: 2 } }, 1);
    const n = counts(g.cells, g.alphabet);
    expect(n.M).toBe(2);
    expect(n.R).toBe(1);
  });

  it('measures floating and empty models', () => {
    const palette = { A: { color: '#888' } };
    expect(analyse(run(prog([6, 6, 6], { type: 'shape', shape: 'box', at: [3, 3, 2], size: [3, 3, 2], color: 'A' }), 1), palette).errors.join()).toContain('non tocca terra');
    expect(analyse(run(prog([6, 6, 6], { type: 'shape', shape: 'box', at: [3, 3, 0], size: [3, 3, 2], color: 'S' }), 1), palette).errors.join()).toContain('vuoto');
  });
});

describe('photographs, classes, skeleton', () => {
  it('turns the model so its front faces each side, and photographs it from four sides', () => {
    const r = run(prog([3, 3, 1], { type: 'shape', shape: 'box', at: [1, 2, 0], size: [1, 1, 1], color: 'A' }), 1);
    const where = (v: number) => {
      const t = turn(r.grid, v);
      const i = t.cells.findIndex((c) => c > 0);
      return [i % t.X, Math.floor(i / t.X) % t.Y];
    };
    expect([0, 1, 2, 3].map(where)).toEqual([[1, 2], [2, 1], [1, 0], [0, 1]]);
    const m = compileMjx(FIGURE);
    const g = runMjx(m, 1).grid;
    for (let v = 0; v < 4; v++) {
      const p = render(g, m.program.palette, v);
      expect(p.w).toBeGreaterThan(8);
      expect(p.data.some((x, i) => i % 4 === 3 && x === 255)).toBe(true);
    }
    const [morning, , , evening] = DAY.map((d) => render(g, m.program.palette, 0, { px: 1, top: 1, front: 1, outline: false, shadow: true, light: true, crop: false, sun: d.sun }));
    expect(morning.data.join()).not.toEqual(evening.data.join());
  });

  it('gives every class one box, so similar things share proportions', () => {
    expect(boxOf(classOf('albero')!)).toEqual([2 * TILE, 2 * TILE, 3 * TILE]);
    expect(boxOf(classOf('grande')!)).toEqual([5 * TILE, 5 * TILE, 4 * TILE]);
    expect(guessClass('Una quercia frondosa').id).toBe('albero');
    expect(guessClass('Il fabbro', 'figura').id).toBe('persona');
    expect(guessClass('un lupo grigio', 'figura').id).toBe('bestia');
    expect(new Set(CLASSES.map((c) => c.id)).size).toBe(CLASSES.length);
  });

  it('finds the limbs of a figure from the parts in its palette', () => {
    const m = compileMjx(FIGURE);
    const r = rig(runMjx(m, 1).grid, m.program.palette);
    expect(r.guessed).toBe(false);
    expect(r.limbs.filter((l) => l.part === 'gamba')).toHaveLength(2);
    expect(r.limbs.filter((l) => l.part === 'braccio')).toHaveLength(2);
    expect(new Set(r.limbs.filter((l) => l.part === 'gamba').map((l) => l.phase)).size).toBe(2);
  });
});
