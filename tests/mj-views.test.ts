// The views in text (T354, ADR-0183): what the Sculptor «sees» of a grid without photographs — the plan and the heights from above, the
// front and the right elevations, a cut at a height, the legend, whether two plans differ. Small enough to go back after every block.

import { describe, expect, it } from 'vitest';
import { compileMjx } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { elevationView, isFlat, legend, planDistance, planView, sectionHeights, sectionView, sideBySide, viewsText } from '../src/mj/views';

/** A wall of 4 × 2 × 3 on a hidden ground, with a dark cell D in its middle at the bottom; W has a name, the ground none. */
const WALL = '<sequence values="BEWD" size="8 6 4" ground="E"><color symbol="E" hidden="True"/><color symbol="W" value="aabbcc" name="muro"/><color symbol="D" value="112233"/><box at="4 3 0" size="4 2 3" color="W"/><box at="4 3 0" size="1 1 1" color="D"/></sequence>';
const run = (xml: string, seed = 1) => {
  const m = compileMjx(xml);
  return { g: runMjx(m, seed, { deadline: 5_000 }).grid, pal: m.program.palette };
};

describe('the views in text (T354)', () => {
  it('draws the plan, the heights, the elevations and a cut, one character a cell, the back at the top', () => {
    const { g, pal } = run(WALL);
    const p = planView(g, pal, { step: 1 });
    expect(p.step).toBe(1);
    expect(p.plan.split('\n')).toHaveLength(6);
    expect(p.plan.split('\n').every((r) => r.length === 8)).toBe(true);
    // The wall shows as W from above (the hidden ground does not, without `hidden`), its height as a digit above 0; the rest is empty.
    expect(planView(g, pal, { step: 1, hidden: false }).plan).toMatch(/W/);
    expect(planView(g, pal, { step: 1, hidden: false }).plan).not.toMatch(/E/);
    expect(planView(g, pal, { step: 1, hidden: true }).plan).toMatch(/E/);
    const wallRows = p.heights.split('\n').filter((r) => /[1-9a-z]/.test(r));
    expect(wallRows.length).toBeGreaterThan(0);
    expect(elevationView(g, pal, 'front', { step: 1 }).text.split('\n')[0]).toMatch(/W/);
    expect(elevationView(g, pal, 'right', { step: 1 }).text).toMatch(/W/);
    // The cut at the bottom shows the dark cell inside the wall; higher up only the wall.
    expect(sectionView(g, pal, 0, { step: 1 }).text).toMatch(/D/);
    expect(sectionView(g, pal, 2, { step: 1 }).text).not.toMatch(/D/);
    expect(isFlat(g)).toBe(false);
  });

  it('names the letters: a name where the program gives one, «marker» for a hidden letter with only the palette\'s name', () => {
    const { g, pal } = run(WALL);
    const l = legend(g, pal);
    expect(l).toContain('W muro');
    expect(l).toContain('E marker');
    expect(l).toMatch(/\bD\b/);
  });

  it('keeps the whole within a width: a character is a square of cells', () => {
    const { g, pal } = run(WALL);
    const p = planView(g, pal, { width: 4 });
    expect(p.step).toBe(2);
    expect(p.plan.split('\n')).toHaveLength(3);
    expect(p.plan.split('\n')[0]).toHaveLength(4);
  });

  it('a flat grid (a plan on a coarse grid) gives only its plan; the cuts fall a third up every storey', () => {
    const flat = run('<sequence values="BEW" size="6 6 10" ground="E"><color symbol="E" hidden="True"/><all in="E" out="W" steps="3"/></sequence>');
    expect(isFlat(flat.g)).toBe(true);
    const t = viewsText(flat.g, flat.pal, 'a plan', { step: 1 });
    expect(t).toContain('Plan (the letter of every cell)');
    expect(t).not.toContain('Heights');
    const { g, pal } = run(WALL);
    const whole = viewsText(g, pal, 'Seed 1', { step: 1, sections: [0] });
    for (const s of ['Plan (the letter on top of every column)', 'Heights', 'Front', 'Right side', 'Cut at z=0']) expect(whole).toContain(s);
    expect(sectionHeights({ Z: 80 } as never)).toEqual([11, 43, 75]);
    expect(sectionHeights({ Z: 40 } as never)).toEqual([11]);
  });

  it('says how much two plans differ, and puts two blocks side by side', () => {
    const a = run(WALL);
    const b = run('<sequence values="BEWD" size="8 6 4" ground="E"><color symbol="E" hidden="True"/><color symbol="W" value="aabbcc" name="muro"/><color symbol="D" value="112233"/><box at="2 2 0" size="2 2 3" color="W"/></sequence>');
    expect(planDistance(a.g, a.g, a.pal)).toBe(0);
    const d = planDistance(a.g, b.g, a.pal);
    expect(d).toBeGreaterThan(0.3);
    expect(d).toBeLessThanOrEqual(1);
    expect(sideBySide('ab\ncd', 'x')).toBe('ab   x\ncd   ');
  });
});
