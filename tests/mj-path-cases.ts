// Programs with a `path` node, for tests/mj-path.test.ts (T315): a maze lit along its longest way (the site's maze), a way that keeps
// straight, ways from many starts, a way in three dimensions round a wall, and a field with no way through.

import type { Grid3, Node3, Program3 } from '../src/mj/engine';

export interface PathCase {
  name: string;
  grid: () => Grid3;
  palette: Program3['palette'];
  program: Node3;
  seeds: number[];
}

const palette = (codes: string): Program3['palette'] => Object.fromEntries([...codes].map((c) => [c, {}]));

function grid(X: number, Y: number, Z: number, alphabet: string, fill: string, marks: Array<[number, string]> = []): Grid3 {
  const codes = ['.', ...alphabet];
  const cells = new Uint8Array(X * Y * Z).fill(codes.indexOf(fill));
  for (const [i, c] of marks) cells[i] = codes.indexOf(c);
  return { X, Y, Z, cells, alphabet: codes, log: [], epoch: 0 };
}

/** A 3D box of E with a wall of B across the middle, a hole in it, starts on one side and an end on the other. */
function walled(): Grid3 {
  const X = 13;
  const Y = 11;
  const Z = 7;
  const g = grid(X, Y, Z, 'EBSTP', 'E');
  const B = g.alphabet.indexOf('B');
  for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) if (!(y === 8 && z === 5)) g.cells[6 + y * X + z * X * Y] = B;
  g.cells[1 + 1 * X + 1 * X * Y] = g.alphabet.indexOf('S');
  g.cells[2 + 9 * X + 4 * X * Y] = g.alphabet.indexOf('S');
  g.cells[11 + 2 * X + 3 * X * Y] = g.alphabet.indexOf('T');
  return g;
}

export const PATH_CASES: PathCase[] = [
  {
    name: 'labirinto, la via più lunga',
    grid: () => grid(31, 21, 1, 'BWASP', 'B', [[14 + 10 * 31, 'W']]),
    palette: palette('BWASP'),
    program: {
      type: 'sequence',
      children: [
        { type: 'one', rules: [{ in: 'WBB', out: 'WAW' }] },
        { type: 'one', steps: 1, rules: [{ in: 'W', out: 'S' }] },
        { type: 'path', from: 'W', to: 'S', on: 'WA', color: 'P', longest: true, steps: 1 },
      ],
    },
    seeds: [1, 2, 3, 42, 4242],
  },
  {
    name: 'labirinto, una via qualunque con inerzia',
    grid: () => grid(25, 25, 1, 'BWASP', 'B', [[12 + 12 * 25, 'W']]),
    palette: palette('BWASP'),
    program: {
      type: 'sequence',
      children: [
        { type: 'one', rules: [{ in: 'WBB', out: 'WAW' }] },
        { type: 'one', steps: 2, rules: [{ in: 'W', out: 'S' }] },
        { type: 'path', from: 'W', to: 'S', on: 'WA', color: 'P', inertia: true, steps: 3 },
      ],
    },
    seeds: [5, 6, 7],
  },
  {
    name: 'campo aperto, molte partenze, la più lunga con inerzia',
    grid: () => grid(20, 14, 1, 'ESTP', 'E', [[0, 'S'], [19, 'S'], [5 + 13 * 20, 'S'], [10 + 7 * 20, 'T'], [11 + 7 * 20, 'T']]),
    palette: palette('ESTP'),
    program: { type: 'path', from: 'S', to: 'T', on: 'E', color: 'P', inertia: true, longest: true, steps: 2 },
    seeds: [1, 9],
  },
  {
    name: 'campo aperto, molte partenze, la più lunga, senza inerzia',
    grid: () => grid(20, 14, 1, 'ESTP', 'E', [[0, 'S'], [19, 'S'], [5 + 13 * 20, 'S'], [10 + 7 * 20, 'T'], [11 + 7 * 20, 'T']]),
    palette: palette('ESTP'),
    program: { type: 'path', from: 'S', to: 'T', on: 'E', color: 'P', longest: true, steps: 3 },
    seeds: [1, 9, 23],
  },
  {
    name: 'tre dimensioni, intorno a un muro',
    grid: walled,
    palette: palette('EBSTP'),
    program: { type: 'path', from: 'S', to: 'T', on: 'E', color: 'P', steps: 2 },
    seeds: [3, 11, 12],
  },
  {
    name: 'nessuna via',
    grid: () => grid(9, 9, 1, 'EBSTP', 'E', [[0, 'S'], [80, 'T'], ...Array.from({ length: 9 }, (_, y): [number, string] => [4 + y * 9, 'B'])]),
    palette: palette('EBSTP'),
    program: { type: 'path', from: 'S', to: 'T', on: 'E', color: 'P', steps: 1 },
    seeds: [1],
  },
];
