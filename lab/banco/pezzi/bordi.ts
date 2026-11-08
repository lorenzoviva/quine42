// The checks on the borders between the pieces (T339): what a model in pieces has where two pieces meet, against the same program run
// on the whole grid. The plan and the maps are the same in both (the same seed draws the same numbers until `<pieces>`): what differs
// is only what the detail does. Three checks, none of which knows the program:
// - `strutture`: the voxels of the letters the detail builds without chance (roofs, rails, stairs) that are not where the whole grid has
//   them. 0 means the parts fit as if the grid had never been cut.
// - `salti`: where two pieces meet, neighbouring columns of something tall (a wall, a roof, a tower: eight voxels or more) whose tops
//   differ by more than a voxel; the same count on the lines half a piece away, inside the pieces, says what is normal for the model.
// - `pezzi di`: how many 4-connected pieces a letter set makes at a height (the tracks on the ground, the rails of the fences): the same
//   number as the whole grid, or a path broken where the pieces meet.

import type { Grid3, PaletteEntry } from '../../../src/mj/engine';

/** The text of a program as it is measured on the whole grid: its `<pieces>` is a `<sequence>` (the attributes go). */
export function senzaPezzi(xml: string): string {
  return xml.replace(/<pieces\b[^>]*>/g, '<sequence>').replace(/<\/pieces>/g, '</sequence>');
}

const visibleOf =(g: Grid3, palette: Record<string, PaletteEntry>) => g.alphabet.map((c) => c !== '.' && !!palette[c]?.color && !palette[c]?.hidden);

/** Voxels where one grid has a letter of `letters` and the other has not the same letter. */
export function strutture(a: Grid3, b: Grid3, letters: string): number {
  let n = 0;
  const set = new Set(letters);
  for (let i = 0; i < a.cells.length; i++) {
    const x = a.alphabet[a.cells[i]], y = b.alphabet[b.cells[i]];
    if ((set.has(x) || set.has(y)) && x !== y) n++;
  }
  return n;
}

/** The top of every column (the highest visible voxel + 1, 0 if none). */
function tops(g: Grid3, palette: Record<string, PaletteEntry>): Int16Array {
  const vis = visibleOf(g, palette);
  const XY = g.X * g.Y;
  const h = new Int16Array(XY);
  for (let i = 0; i < XY; i++)
    for (let z = g.Z - 1; z >= 0; z--)
      if (vis[g.cells[i + z * XY]]) {
        h[i] = z + 1;
        break;
      }
  return h;
}

export interface Salti {
  /** Jumps on the lines where the pieces meet. */
  bordi: number;
  /** Jumps on as many lines inside the pieces, half a piece away. */
  dentro: number;
  /** How many pairs of tall columns each count looked at. */
  coppie: [number, number];
}

/**
 * Jumps of the tops of tall things (`tall` voxels or more) between neighbouring columns: across the lines where pieces of `piece` cells
 * meet, and across the lines half a piece inside, as many.
 */
export function salti(g: Grid3, palette: Record<string, PaletteEntry>, piece: [number, number], tall = 8): Salti {
  const h = tops(g, palette);
  const out: Salti = { bordi: 0, dentro: 0, coppie: [0, 0] };
  const look = (x0: number, y0: number, x1: number, y1: number, k: 0 | 1) => {
    const a = h[x0 + y0 * g.X], b = h[x1 + y1 * g.X];
    if (a < tall || b < tall) return;
    out.coppie[k]++;
    if (Math.abs(a - b) > 1) k === 0 ? out.bordi++ : out.dentro++;
  };
  const [PX, PY] = piece;
  for (let s = PX; s < g.X; s += PX) {
    const c = s - (PX >> 1);
    for (let y = 0; y < g.Y; y++) {
      look(s - 1, y, s, y, 0);
      look(c - 1, y, c, y, 1);
    }
  }
  for (let s = PY; s < g.Y; s += PY) {
    const c = s - (PY >> 1);
    for (let x = 0; x < g.X; x++) {
      look(x, s - 1, x, s, 0);
      look(x, c - 1, x, c, 1);
    }
  }
  return out;
}

/** How many 4-connected pieces the voxels of `letters` make at height `z`. */
export function pezziDi(g: Grid3, letters: string, z: number): number {
  const set = new Set(letters);
  const XY = g.X * g.Y;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < g.X && y < g.Y && set.has(g.alphabet[g.cells[x + y * g.X + z * XY]]);
  const seen = new Uint8Array(XY);
  let n = 0;
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++) {
      if (seen[x + y * g.X] || !on(x, y)) continue;
      n++;
      const stack = [x + y * g.X];
      seen[x + y * g.X] = 1;
      while (stack.length) {
        const i = stack.pop()!;
        const cx = i % g.X, cy = (i - cx) / g.X;
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (!on(nx, ny) || seen[nx + ny * g.X]) continue;
          seen[nx + ny * g.X] = 1;
          stack.push(nx + ny * g.X);
        }
      }
    }
  return n;
}

/** A box of a grid as a grid of its own (for a photograph of where two pieces meet). */
export function riquadro(g: Grid3, x0: number, y0: number, w: number, h: number): Grid3 {
  const X = Math.min(w, g.X - x0), Y = Math.min(h, g.Y - y0);
  const cells = new Uint8Array(X * Y * g.Z);
  for (let z = 0; z < g.Z; z++)
    for (let y = 0; y < Y; y++) cells.set(g.cells.subarray(x0 + (y0 + y) * g.X + z * g.X * g.Y, x0 + X + (y0 + y) * g.X + z * g.X * g.Y), y * X + z * X * Y);
  return { X, Y, Z: g.Z, cells, alphabet: g.alphabet, log: [], epoch: 0 };
}
