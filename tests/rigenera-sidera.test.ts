import { describe, expect, it } from 'vitest';
import { layout } from '../src/kernel/layout';
import { STRUCTURE_VPT } from '../src/mj/classes';
import type { MjNode } from '../src/kernel/mj';
import type { TerrainDef } from '../src/kernel/types';
import { Validator } from '../src/kernel/validator';
import sidera from '../lab/banco/rigenerazione/sidera-ambienti.json';

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
