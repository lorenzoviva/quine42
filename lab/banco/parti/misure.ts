// What the bench of the parts of the trades measures (T471, lab/banco/parti/README.md), from the voxels alone: the pieces a set of letters
// makes (the wheels, the panes of the windows, the leaves open), each with its box and how many cells it has. The test and the bench read
// the same numbers.

import type { Grid3 } from '../../../src/mj/engine';
import { numberedSymbol } from '../../../src/mj/symbols';

export type Box3 = [number, number, number];
export interface Piece {
  cells: number;
  min: Box3;
  max: Box3;
}

/** The engine's character of a symbol as a program writes it: `G`, `#81`. */
const charOf = (symbol: string): string => (symbol.startsWith('#') ? numberedSymbol(Number(symbol.slice(1))) : symbol);

/** How many cells of the grid have one of the symbols. */
export function count(g: Grid3, symbols: string[]): number {
  const codes = new Set(symbols.map((s) => g.alphabet.indexOf(charOf(s))).filter((c) => c > 0));
  let n = 0;
  for (const c of g.cells) if (codes.has(c)) n++;
  return n;
}

/** The pieces the cells of some symbols make, joined by their faces (6 neighbours), largest first. */
export function pieces(g: Grid3, symbols: string[]): Piece[] {
  const codes = new Set(symbols.map((s) => g.alphabet.indexOf(charOf(s))).filter((c) => c > 0));
  const { X, Y, Z } = g;
  const seen = new Uint8Array(g.cells.length);
  const out: Piece[] = [];
  for (let i = 0; i < g.cells.length; i++) {
    if (seen[i] || !codes.has(g.cells[i])) continue;
    const p: Piece = { cells: 0, min: [X, Y, Z], max: [-1, -1, -1] };
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop()!;
      const x = j % X, y = Math.floor(j / X) % Y, z = Math.floor(j / (X * Y));
      p.cells++;
      [x, y, z].forEach((v, a) => {
        p.min[a] = Math.min(p.min[a], v);
        p.max[a] = Math.max(p.max[a], v);
      });
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const [a, b, c] = [x + dx, y + dy, z + dz];
        if (a < 0 || b < 0 || c < 0 || a >= X || b >= Y || c >= Z) continue;
        const k = a + b * X + c * X * Y;
        if (!seen[k] && codes.has(g.cells[k])) {
          seen[k] = 1;
          stack.push(k);
        }
      }
    }
    out.push(p);
  }
  return out.sort((a, b) => b.cells - a.cells || a.min[0] - b.min[0] || a.min[1] - b.min[1] || a.min[2] - b.min[2]);
}

/** A piece's size along each axis. */
export const sizeOf = (p: Piece): Box3 => [0, 1, 2].map((a) => p.max[a] - p.min[a] + 1) as Box3;

/** The letter of a cell, as a program writes it (`.` the empty one). */
export function letterAt(g: Grid3, x: number, y: number, z: number): string {
  const c = g.cells[x + y * g.X + z * g.X * g.Y];
  if (!c) return '.';
  const ch = g.alphabet[c];
  const n = ch.charCodeAt(0);
  return n >= 0xf000 ? `#${n - 0xf000}` : n >= 48 && n <= 57 ? `#${n - 48}` : ch;
}
