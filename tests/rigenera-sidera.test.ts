import { describe, expect, it } from 'vitest';
import { layout } from '../src/kernel/layout';
import { STRUCTURE_VPT } from '../src/mj/classes';
import type { MjNode } from '../src/kernel/mj';
import type { TerrainDef } from '../src/kernel/types';
import { Validator } from '../src/kernel/validator';
import sidera from '../lab/banco/rigenerazione/sidera-ambienti.json';
import plaza from '../lab/banco/rigenerazione/sidera-piazza.json';
import { losesStructure } from '../src/kernel/regenerate';

// T422: the two environments of sidera that the kernel could not grow for the structures at 16 (`vicoli_pioggia`, `cantiere_fusione`), as the
// Cartographer wrote them again on the subscription's queue, cut offline on the real drafts of their places: every place gets a building that
// holds a Large at 16 (7 × 7, walls included) for each structure of its plan, and every building of a structure's size holds a common house.
// The programs of before did not: that is why they were written again.

interface Place {
  cx: number;
  cy: number;
  layout: string;
  name: string;
  structures: Array<{ concept: string; size?: string }>;
  draft: string[];
}

const palette = sidera.palette as unknown as Record<string, TerrainDef>;
const places = sidera.places as Place[];
const NEED = 7;
const STRUCTURE_LOT = 5;

/** The buildings a program makes on a place, largest first (as `structureLotSizes` gives them out). */
function lots(p: Place, program: MjNode): Array<{ w: number; h: number }> {
  const r = layout(p.draft, palette, { cx: p.cx, cy: p.cy, seed: sidera.seed, pathCode: sidera.pathCode, program, stages: true, vpt: STRUCTURE_VPT });
  return r.lots
    .map((b, i) => ({ i, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 }))
    .sort((a, b) => b.w * b.h - a.w * a.h || a.i - b.i)
    .map(({ w, h }) => ({ w, h }));
}

const holds = (l: { w: number; h: number } | undefined) => !!l && Math.max(l.w, l.h) >= STRUCTURE_LOT && Math.min(l.w, l.h) >= NEED;

describe('sidera dopo T422: i due ambienti riscritti dal Cartografo tengono le strutture a 16', () => {
  it('le bozze sono quelle dei 15 luoghi dei due ambienti, 5 con una struttura', () => {
    expect(places).toHaveLength(15);
    expect(places.filter((p) => p.structures.length).map((p) => `${p.cx},${p.cy}`)).toEqual(['-2,-2', '-1,-1', '0,-1', '-1,0', '1,0']);
    expect(places.every((p) => p.draft.length === 18 && p.draft.every((r) => r.length === 18))).toBe(true);
  });

  it.each(places.map((p) => [`${p.name} (${p.cx}, ${p.cy}), ${p.layout}`, p] as const))('%s', (_, p) => {
    const after = lots(p, sidera.after[p.layout as keyof typeof sidera.after] as MjNode);
    // A building of 7 × 7 for each structure, in the order the lots give them out.
    for (let i = 0; i < p.structures.length; i++) expect(holds(after[i]), `${p.structures[i].concept}: ${JSON.stringify(after)}`).toBe(true);
    // Every other building is a structure's (7 × 7 or more: a common house at 16) or a small house (at most 4 × 4).
    for (const l of after) expect(Math.max(l.w, l.h) < STRUCTURE_LOT || Math.min(l.w, l.h) >= NEED, JSON.stringify(after)).toBe(true);
    expect(after.some((l) => holds(l))).toBe(true);
  });

  it('i programmi di prima no: case di 5 × 6 e 7 × 5, che una struttura a 16 non tiene', () => {
    const odd = places.flatMap((p) => lots(p, sidera.before[p.layout as keyof typeof sidera.before] as MjNode)).filter((l) => Math.max(l.w, l.h) >= STRUCTURE_LOT && Math.min(l.w, l.h) < NEED);
    expect(odd.length).toBeGreaterThan(10);
  });

  it('il validatore li prende, come li ha presi il kernel prima di scriverli', () => {
    const v = new Validator({ check: () => undefined } as never);
    const drafts = places.slice(0, 4).map((p) => p.draft);
    for (const id of ['vicoli_pioggia', 'cantiere_fusione'] as const) {
      expect(v.validateLayout(id, { name: id, description: id, environment: 'mixed', program: sidera.after[id] as MjNode }, palette, drafts)).toEqual([]);
    }
  });
});

// T435: the start of sidera, «Piazza dei Viadotti» (0, 0), had no lots for its two structures. Its environment `piazza_neon` drew houses of
// 5 × 4 (at 20 they showed the bar and the shrine, though they held neither); the regeneration grew them to 7 × 7 (`stretchBoxes`), and on the
// draft of (0, 0), puddles everywhere, no 7 × 7 of paving is free. The kernel took it because it counted only the structures held: 0 before,
// 0 after. Now it counts those that stand on a lot too (`losesStructure`), and the environment has a second node, a pair of houses that may
// stand on the puddles, which acts only where the first left room for them: (0, 0) gets its two lots, (-1, 1) stays as it was.
describe('sidera dopo T435: la Piazza dei Viadotti e i lotti delle sue due strutture', () => {
  const PLAZA = plaza.palette as unknown as Record<string, TerrainDef>;
  const at = (cx: number, cy: number) => (plaza.places as Place[]).find((p) => p.cx === cx && p.cy === cy)!;
  const run = (p: Place, program: unknown, vpt = STRUCTURE_VPT) => layout(p.draft, PLAZA, { cx: p.cx, cy: p.cy, seed: plaza.seed, pathCode: plaza.pathCode, program: program as MjNode, stages: true, vpt });
  const sizes = (r: ReturnType<typeof run>) =>
    r.lots
      .map((b, i) => ({ i, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 }))
      .sort((a, b) => b.w * b.h - a.w * a.h || a.i - b.i)
      .map(({ w, h }) => ({ w, h }));
  const start = at(0, 0), stop = at(-1, 1);
  const LARGE = { now: 5, after: NEED };

  it('le bozze sono quelle dei due luoghi di piazza_neon; la partenza vuole il bar orbitale e il santuario della luce', () => {
    expect(start.name).toBe('Piazza dei Viadotti');
    expect(start.structures.map((s) => s.concept)).toEqual(['bar orbitale', 'santuario della luce']);
    expect(stop.structures.map((s) => s.concept)).toEqual(['santuario quantico']);
  });

  it('il programma di prima mostrava le due strutture sulla partenza; allargato, non le mostra più: la rigenerazione lo vede ora', () => {
    const before = sizes(run(start, plaza.before, 20));
    expect(before).toHaveLength(3);
    expect(before.every((l) => !holds(l))).toBe(true);
    const stretched = sizes(run(start, plaza.stretched));
    expect(stretched).toEqual([]);
    // Held before: none (5 × 4 does not hold a Large at 20 either); standing before: both. The check of before let it through.
    expect(losesStructure([LARGE, LARGE], before, stretched)).toBe(true);
    expect(losesStructure([LARGE], sizes(run(stop, plaza.before, 20)), sizes(run(stop, plaza.stretched)))).toBe(false);
  });

  it('con la riserva la partenza ha due edifici 7 × 7, le porte raggiungibili; la Fermata del Treno Sospeso resta com’era', () => {
    const r = run(start, plaza.after);
    const lots = sizes(r);
    expect(lots.filter((l) => holds(l))).toHaveLength(2);
    const S = start.draft.length, grid = r.grid.join('');
    const doors = [...grid].flatMap((c, i) => (PLAZA[c]?.layer === 'door' ? [i] : []));
    expect(doors).toHaveLength(2);
    // Each door opens onto a tile reached from the gates, outside the buildings; every gate is reached.
    for (const d of doors) expect([d - 1, d + 1, d - S, d + S].some((n) => r.reachable.has(n) && !PLAZA[grid[n]]?.indoor && PLAZA[grid[n]]?.layer !== 'wall')).toBe(true);
    for (const g of r.gates) expect(r.reachable.has(g)).toBe(true);
    // The two buildings do not touch: a row or a column between them.
    const [a, b] = r.lots;
    expect(a.x1 < b.x0 - 1 || b.x1 < a.x0 - 1 || a.y1 < b.y0 - 1 || b.y1 < a.y0 - 1).toBe(true);
    expect(run(stop, plaza.after).grid).toEqual(run(stop, plaza.stretched).grid);
    expect(losesStructure([LARGE, LARGE], sizes(run(start, plaza.before, 20)), lots)).toBe(false);
  });

  it('il validatore lo prende', () => {
    const v = new Validator({ check: () => undefined } as never);
    expect(v.validateLayout('piazza_neon', { name: 'piazza_neon', description: 'piazza_neon', environment: 'mixed', program: plaza.after as MjNode }, PLAZA, [start.draft, stop.draft])).toEqual([]);
  });
});
