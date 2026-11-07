// The hero of the site's landing page (T101): its MarkovJunior programs compile, grow and show voxels; what the worker sends the stage (T315) is what it would draw.
import { describe, expect, it } from 'vitest';
import { HERO_PROGRAMS, runHero, showOf, visibleCells } from '../site/hero-programs';

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
  it('ciò che il worker manda al palco sono le celle che si vedono, fotogramma per fotogramma', () => {
    const run = runHero(HERO_PROGRAMS[1], 7);
    const show = showOf(run);
    expect(show.cells.length).toBe(run.frames.length);
    run.frames.forEach((f, k) => {
      expect([...show.cells[k]]).toEqual(visibleCells(f));
      expect([...show.codes[k]]).toEqual(visibleCells(f).map((i) => f.cells[i]));
      expect(show.steps[k]).toBe(f.step);
    });
    expect(show.colors.every((c) => Number.isInteger(c) && c >= 0 && c <= 0xffffff)).toBe(true);
  });
  it('un seme diverso fa crescere il labirinto in un altro modo', () => {
    const a = runHero(HERO_PROGRAMS[0], 1).frames.at(-1)!.cells;
    const b = runHero(HERO_PROGRAMS[0], 2).frames.at(-1)!.cells;
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});
