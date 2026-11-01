// The hero of the site's landing page (T101): its MarkovJunior programs compile, grow and show voxels.
import { describe, expect, it } from 'vitest';
import { HERO_PROGRAMS, runHero, visibleCells } from '../site/landing';

describe('la landing del sito', () => {
  for (const prog of HERO_PROGRAMS) {
    it(`il programma ${prog.name} cresce e si vede`, () => {
      const run = runHero(prog, 4242);
      expect(run.frames.length).toBeGreaterThan(1);
      const last = run.frames[run.frames.length - 1];
      const shown = visibleCells(last);
      expect(shown.length).toBeGreaterThan(50);
      expect(shown.length).toBeLessThan(40_000);
      expect(run.colors.length).toBe(run.glow.length);
      // It grows: the first state has fewer voxels than the last.
      expect(run.frames[0].cells.filter((c) => c).length).toBeLessThan(last.cells.filter((c) => c).length);
    });
  }
  it('un seme diverso fa crescere il labirinto in un altro modo', () => {
    const a = runHero(HERO_PROGRAMS[0], 1).frames.at(-1)!.cells;
    const b = runHero(HERO_PROGRAMS[0], 2).frames.at(-1)!.cells;
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});
