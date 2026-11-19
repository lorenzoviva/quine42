// The bed of the seed (T429): the blanket lies on the bed and ends where the frame ends. It used to be laid after the cut of the length, so
// on a short bed it went on past the foot over nothing, and the piece a building is furnished with (`pieceOf`, cropped to what is drawn) was
// as long as the blanket while the frame under it was shorter: in neapolis a frame of one tile under a blanket of one and a half.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { runForm } from '../src/kernel/forms';
import { pieceOf } from '../src/kernel/furnish';

const XML = bundledFiles['models/letto.xml'];
const BLANKET = new Set(['C', 'R']);

describe('the bed', () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    it(`seed ${seed}: blanket, frame and the piece have the same length, and the blanket has something under it`, () => {
      const r = runForm({ xml: XML, seed, vpt: 20 });
      expect(r.finished).toBe(true);
      const g = r.grid, XY = g.X * g.Y;
      const drawn = (c: number) => c !== 0 && !!r.palette[g.alphabet[c]]?.color && !r.palette[g.alphabet[c]]?.hidden;
      const rows = (keep: (s: string, z: number) => boolean) => {
        let y0 = g.Y, y1 = -1;
        for (let i = 0; i < g.cells.length; i++) {
          const c = g.cells[i];
          if (!drawn(c) || !keep(g.alphabet[c], Math.floor(i / XY))) continue;
          const y = Math.floor(i / g.X) % g.Y;
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
        return [y0, y1];
      };
      const frame = rows((_, z) => z === 0);
      const blanket = rows((s) => BLANKET.has(s));
      expect(blanket[1], 'the blanket ends where the frame ends').toBe(frame[1]);
      expect(blanket[1] - frame[0] + 1, 'a body lies on it: from 14 rows of 20').toBeGreaterThanOrEqual(14);
      // Every voxel of the blanket rests on something drawn: the mattress, the frame or the blanket falling down a side.
      for (let i = XY; i < g.cells.length; i++)
        if (drawn(g.cells[i]) && BLANKET.has(g.alphabet[g.cells[i]])) expect(drawn(g.cells[i - XY]), `voxel ${i} of the blanket`).toBe(true);
      // The piece of a furnished building is as long as its frame.
      const piece = pieceOf('letto', r, 20, 20)!;
      expect(piece.Y).toBe(frame[1] - frame[0] + 1);
    });
  }
});
