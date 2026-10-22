import { describe, expect, it } from 'vitest';
import { mendProgram } from '../mj3d/check';
import { at, run, runOn, type Program3 } from '../mj3d/engine';
import { buildBlocks, finish, mendLayout, runLayout } from '../mj3d/structure';
import { CRIPTA, cripta } from '../programs/cripta';
import { ROCCA, rocca } from '../programs/rocca';

const count = (cells: Uint8Array, alphabet: string[], ch: string) => cells.reduce((s, c) => s + (alphabet[c] === ch ? 1 : 0), 0);

describe('MarkovJunior nodes of step 8D', () => {
  it('unions name sets of codes in rule inputs', () => {
    const p: Program3 = {
      size: [3, 1, 1],
      palette: { R: { color: '#888' }, S: { color: '#aaa' }, M: { color: '#4a4' } },
      unions: { '#': 'RS' },
      program: { type: 'sequence', children: [{ type: 'shape', shape: 'box', at: [0, 0, 0], size: [1, 1, 1], color: 'R' }, { type: 'shape', shape: 'box', at: [1, 0, 0], size: [1, 1, 1], color: 'S' }, { type: 'all', rules: [{ in: '#', out: 'M' }] }] },
    };
    const g = run(p, 1).grid;
    expect([at(g, 0, 0, 0), at(g, 1, 0, 0), at(g, 2, 0, 0)]).toEqual(['M', 'M', '.']);
    // A union in an output is an error, and the mender keeps unions that are not palette codes.
    expect(() => run({ ...p, program: { type: 'all', rules: [{ in: 'R', out: '#' }] } }, 1)).toThrow(/unione/);
    const notes: string[] = [];
    expect(mendProgram({ ...p, unions: { '#': 'RS', R: 'S' } }, notes)?.unions).toEqual({ '#': 'RS' });
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
          // B becomes a 3 × 3 ring with a hole; A is just scaled.
          { type: 'map', scale: [3, 3, 1], rules: [{ in: 'B', out: 'BBB/B.B/BBB' }] },
          { type: 'all', rules: [{ in: 'A', out: 'C' }] },
        ],
      },
    };
    const g = run(p, 1, 20000, { side: 64, cells: 64 ** 3 }).grid;
    expect([g.X, g.Y, g.Z]).toEqual([6, 3, 1]);
    expect(count(g.cells, g.alphabet, 'C')).toBe(9);
    expect(at(g, 4, 1, 0)).toBe('.');
    expect(count(g.cells, g.alphabet, 'B')).toBe(8);
  });

  it('path with inertia goes straight, longest starts from the farthest cell', () => {
    const base = (node: object): Program3 => ({
      size: [7, 7, 1],
      palette: { S: { color: '#f00' }, T: { color: '#00f' }, P: { color: '#0f0' } },
      program: { type: 'sequence', children: [{ type: 'shape', shape: 'box', at: [0, 0, 0], size: [1, 1, 1], color: 'S' }, { type: 'shape', shape: 'box', at: [6, 6, 0], size: [1, 1, 1], color: 'T' }, { type: 'shape', shape: 'box', at: [6, 0, 0], size: [1, 1, 1], color: 'S' }, node as never] },
    });
    for (let seed = 1; seed <= 5; seed++) {
      const g = run(base({ type: 'path', from: 'S', to: 'T', on: '.', color: 'P', inertia: true, longest: true }), seed).grid;
      // From (0,0), the farther start: a path with one turn only (an L), 11 cells long.
      expect(count(g.cells, g.alphabet, 'P')).toBe(11);
      // Walk the path from the start and count its turns: with inertia, at most two (no staircase).
      const on = (x: number, y: number) => at(g, x, y, 0) === 'P';
      let [x, y, dx, dy, turns] = [0, 0, 0, 0, 0];
      const seen = new Set(['0,0']);
      for (;;) {
        const next = [[1, 0], [0, 1], [-1, 0], [0, -1]].find(([u, v]) => on(x + u, y + v) && !seen.has(`${x + u},${y + v}`));
        if (!next) break;
        if ((dx || dy) && (next[0] !== dx || next[1] !== dy)) turns++;
        [dx, dy] = next;
        x += dx;
        y += dy;
        seen.add(`${x},${y}`);
      }
      expect(seen.size).toBe(12);
      expect(turns).toBeLessThanOrEqual(2);
    }
  });

  it('runs more rules on a grid that already exists', () => {
    const g = run({ size: [3, 1, 1], palette: { R: { color: '#888' } }, program: { type: 'all', rules: [{ in: '.', out: 'R' }] } }, 1).grid;
    runOn(g, { palette: { M: { color: '#4a4' } }, program: { type: 'one', rules: [{ in: 'R', out: 'M' }], steps: 2 } }, 1);
    expect(count(g.cells, g.alphabet, 'M')).toBe(2);
    expect(count(g.cells, g.alphabet, 'R')).toBe(1);
  });
});

describe('structures written the MarkovJunior way', () => {
  it('grows a different castle from every seed, always closed and with every socket right', () => {
    const built = buildBlocks(ROCCA, 1);
    expect(built.errors).toEqual([]);
    const shapes = new Set<string>();
    for (let seed = 1; seed <= 6; seed++) {
      const r = runLayout(rocca([18, 18, 3]), ROCCA, seed, built.built);
      expect(r.wfc?.ok).toBe(true);
      expect(r.mismatches).toEqual([]);
      expect(r.seams).toEqual([]);
      const codes = r.placements.map((p) => p.block.code);
      for (const c of ['G', 'P', 'K', 'R', 'T', 'U', 'M', 'A']) expect(codes).toContain(c);
      // Towers on every turn of the walls, and a top above every tower.
      expect(codes.filter((c) => c === 'U').length).toBe(codes.filter((c) => c === 'T' || c === 'I').length);
      shapes.add(r.cells.slice(0, 18 * 18).join(''));
    }
    expect(shapes.size).toBe(6);
  });

  it('connects every room of the crypt, on both levels', () => {
    const built = buildBlocks(CRIPTA, 1).built;
    for (let seed = 1; seed <= 6; seed++) {
      const r = runLayout(cripta([16, 16, 2]), CRIPTA, seed, built);
      expect(r.wfc?.ok).toBe(true);
      expect(r.mismatches).toEqual([]);
      // No room or corridor is left unconnected: those marks are gone.
      expect(r.cells.filter((c) => 'rqkj'.includes(c))).toEqual([]);
      const codes = r.placements.map((p) => p.block.code);
      expect(codes.filter((c) => c === 'U')).toHaveLength(1);
      // Walkable floor of each level is one piece (4-connected over walkable blocks and stairs).
      for (const z of [0, 1]) {
        const walk = new Set(r.placements.filter((p) => p.z === z && (p.block.walk || p.block.code === 'D' || p.block.code === 'P')).map((p) => `${p.x},${p.y}`));
        const [first] = walk;
        const seen = new Set([first]);
        const stack = [first];
        while (stack.length) {
          const [x, y] = stack.pop()!.split(',').map(Number);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const k = `${x + dx},${y + dy}`;
            if (walk.has(k) && !seen.has(k)) seen.add(k), stack.push(k);
          }
        }
        expect(seen.size).toBe(walk.size);
      }
    }
  });

  it('runs the detail program on the composed voxels, across blocks', () => {
    const built = buildBlocks(CRIPTA, 1).built;
    const r = runLayout(cripta([10, 10, 2]), CRIPTA, 3, built);
    const f = finish(r, { seed: 3 });
    expect(f.detail && 'steps' in f.detail ? f.detail.finished : false).toBe(true);
    // Torches (bracket and flame) and their light, which no block has.
    expect(count(f.grid.cells, f.grid.alphabet, 'T')).toBeGreaterThan(0);
    expect(count(f.grid.cells, f.grid.alphabet, 'l')).toBeGreaterThan(0);
    // Materials keep their letter across blocks.
    expect(f.palette.R?.color).toBe(CRIPTA.blocks[0].program.palette.R.color);
  });

  it('mends paint, detail and unions of a layout written by a model', () => {
    const notes: string[] = [];
    const l = mendLayout({ size: [4, 4, 1], paint: { c: '#a3916c', zz: '#000' }, unions: { '?': 'cs' }, program: { type: 'all', rules: [{ in: '.', out: 'c' }] }, detail: { palette: { V: { color: '#3d7438' } }, program: { type: 'prl', rules: [{ in: 'c', out: 'V', p: 0.5 }] } } }, ROCCA, notes)!;
    expect(l.paint).toEqual({ c: { color: '#a3916c' } });
    expect(l.unions).toEqual({ '?': 'cs' });
    expect(l.detail?.palette?.V.color).toBe('#3d7438');
    expect(notes.join()).toContain('"zz" ignorato');
  });
});
