// The Scenografo furnishes the buildings the Sculptor writes (T410, ADR-0214; `docs/design/scenografo.md` § 10.2), the way of data: it
// does not draw, it chooses for each kind of room of a type of building which pieces of the library's furniture go there and how many.
// It receives what the kernel measures of the building made (the plan of its interior, `interiorPlan`: storeys, door, the parts one
// lives in, the rooms with their kind and the area under them, the place of the animals), seed by seed, never its program; it answers
// with rules (`InteriorRule`), which the kernel places on every seed through the guard (`furnishWithRules`). One answer for the type,
// as a model is one program (rule 11); what the kernel cannot use goes back once with the reason (rule 2).

import type { Schema } from '../ai/models';
import { BODY_R, habitablePartsOf, stepOf } from '../forms';
import { interiorRooms, INTERIOR_LIMITS, readRules, ROOM_KINDS, ROOM_LEAST, type InteriorRule } from '../furnish';
import { ANIMAL_AREAS, type InteriorPlan } from '../interior';
import { areasOf } from '../../mj/areas';
import { partVoxels } from '../../mj/classes';
import type { Council } from './council';

export const INTERIOR_TASK = 'interior.design';

/** A piece of the catalogue as the Scenografo reads it: its id, its name, its size in tiles at the building's density. */
export interface CataloguePiece {
  id: string;
  name: string;
  size: [number, number, number];
}

/** A seed of the building measured by the kernel: what the Scenografo is told of it. */
export interface MeasuredSeed {
  seed: number;
  plan: InteriorPlan;
}

export interface InteriorDesignRequest {
  /** Its id in the library and what the people would call it. */
  model: string;
  name: string;
  /** The box of the building in voxels and its density. */
  box: [number, number, number];
  vpt: number;
  seeds: MeasuredSeed[];
  catalogue: CataloguePiece[];
}

export interface InteriorDesign {
  rules: InteriorRule[];
  /** Calls made: one, two when the first answer went back. */
  calls: number;
}

/** The schema of the answer: the ids of the catalogue as an enum, so a model that keeps to the schema names only what exists. */
export function interiorSchema(ids: readonly string[]): Schema {
  return {
    type: 'OBJECT',
    properties: {
      rules: {
        type: 'ARRAY',
        description: `at most ${INTERIOR_LIMITS.rules} rules; the first that matches a room decides`,
        items: {
          type: 'OBJECT',
          properties: {
            storey: { type: 'INTEGER', description: '0 the ground floor, 1 the one above…; left out, every storey' },
            area: { type: 'STRING', description: 'the area of the ground under the room, as the request names it; left out, every area' },
            room: { type: 'STRING', enum: [...ROOM_KINDS], description: `hall the largest room of its storey, room another of at least ${ROOM_LEAST} tiles², small the others; left out, every room` },
            furniture: { type: 'ARRAY', items: { type: 'STRING', ...(ids.length ? { enum: [...ids] } : {}) }, description: 'ids of the list; for each piece one of them at random' },
            count: { type: 'INTEGER', description: `how many pieces, 1 to ${INTERIOR_LIMITS.count}` },
          },
          required: ['furniture', 'count'],
        },
      },
    },
    required: ['rules'],
  };
}

const n1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

/** The catalogue as the instructions say it (the bench's `prompt-dati.md`, `@@CATALOGO@@`). */
export function catalogueText(catalogue: readonly CataloguePiece[]): string {
  const lines = catalogue.map((c) => `- \`${c.id}\`: ${c.name}, ${n1(c.size[0])} × ${n1(c.size[1])} tiles, ${n1(c.size[2])} tall`);
  return `## The furniture of the world\n${lines.join('\n') || '(none)'}`;
}

/**
 * What the kernel tells the Scenografo of a building, seed by seed (the bench's `descrivi`, T303): its box, the body's measures, and for every
 * seed the storeys reached, the door, the parts one lives in, the rooms as the rules see them, the areas of the ground, the animals.
 */
export function describeBuilding(req: Pick<InteriorDesignRequest, 'name' | 'box' | 'vpt' | 'seeds'>): string {
  const { vpt, box } = req;
  const body = Math.round(2 * BODY_R * vpt);
  const lines = [
    `Building: ${req.name} (${n1(box[0] / vpt)} × ${n1(box[1] / vpt)} tiles, box ${box.join(' × ')} voxels, ${vpt} voxels a tile; x left to right, y from the back to the front where the door is, z up).`,
    `A body needs a passage ${body} voxels wide, a person is ${Math.ceil(1.5 * vpt)} tall, a step is ${stepOf(vpt)}. The program of the building is one for every seed: what follows changes from seed to seed, and your choice must serve all of them.`,
  ];
  for (const { seed, plan } of req.seeds) {
    const { X, Y } = plan;
    const parts = habitablePartsOf(plan.walked, vpt, partVoxels(plan.partsVpt).storey.clear, plan.base);
    const areas = areasOf(plan.built, plan.palette, vpt, plan.base);
    const rooms = interiorRooms(plan, areas);
    const above = plan.storeys.filter((p) => !p.cellar);
    const cellar = plan.storeys.filter((p) => p.cellar).reduce((s, p) => s + p.area, 0);
    lines.push('', `Seed ${seed}:`);
    lines.push(`- storeys one reaches on foot (z of the floor, covered tiles²): ${above.map((p) => `z=${p.z} (${n1(p.area)})`).join(', ') || 'none'}${cellar ? `; a cellar of ${n1(cellar)} tiles² (it stays empty)` : ''}`);
    if (plan.door) lines.push(`- the door: x=${plan.door.x}, y=${plan.door.y} (tile ${Math.floor(plan.door.x / vpt)}, ${Math.floor(plan.door.y / vpt)})`);
    lines.push(`- habitable parts (kernel): ${parts.storeys.length} storeys reached; rooms ${parts.rooms.map((r) => `z=${r.z} side ${r.room} ceiling ${r.clear}`).join(', ') || 'none'}; doors ${parts.doors.map((d) => `${d.width} × ${d.height}`).join(', ') || 'none'}`);
    lines.push('- rooms (where a body stands, cut at the narrow passages; a hall is the largest of its storey; tiles x0,y0 → x1,y1):');
    const count = new Map<number, number>();
    for (const r of rooms) {
      const n = (count.get(r.storey) ?? 0) + 1;
      count.set(r.storey, n);
      let x0 = X, y0 = Y, x1 = 0, y1 = 0;
      const heads: number[] = [];
      const z0 = plan.storeys[r.at].z;
      for (const i of r.cells) {
        const x = i % X, y = Math.floor(i / X);
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
        let z = z0;
        while (z < plan.Z && plan.built.cells[i + z * X * Y] === 0) z++;
        heads.push(z >= plan.Z ? Infinity : z - z0);
      }
      heads.sort((a, b) => a - b);
      const ceiling = heads[Math.floor(heads.length / 2)];
      const where = [x0 / vpt, y0 / vpt, (x1 + 1) / vpt, (y1 + 1) / vpt].map((v) => Math.round(v * 10) / 10).join(',');
      lines.push(`  ${r.storey}.${n}: storey ${r.storey} (z=${z0}), ${r.kind === 'small' ? 'small room' : r.kind}, ${n1(r.tiles)} tiles², ceiling ${ceiling === Infinity ? 'open sky' : ceiling}, area ${r.area ?? '—'}, ${where}`);
    }
    const named = Object.entries(areas).map(([a, ts]) => `${a} ${ts.length} (${ts.slice(0, 24).map(([x, y]) => `${x},${y}`).join(' ')}${ts.length > 24 ? ' …' : ''})`);
    lines.push(`- areas of the ground (tiles of ${vpt} × ${vpt}): ${named.join('; ') || 'none'}`);
    const animals = Object.keys(areas).filter((a) => ANIMAL_AREAS.test(a));
    lines.push(`- the animals stand on: ${animals.length ? `${animals.join(', ')}: their floor stays free` : 'no area of animals'}`);
  }
  return lines.join('\n');
}

/**
 * Asks the Scenografo for the interior of a type of building (`interior.design`): the catalogue in the instructions, the building in the
 * prompt. An answer without a rule the kernel can use goes back once with the reason; undefined if the second has none either.
 */
export async function designInterior(council: Council, req: InteriorDesignRequest, opts: { chi?: string } = {}): Promise<InteriorDesign | undefined> {
  const ids = req.catalogue.map((c) => c.id);
  const known = new Set(ids);
  const system = catalogueText(req.catalogue);
  const description = describeBuilding(req);
  const data = { model: req.model, catalogue: ids, rooms: req.seeds.flatMap((s) => interiorRooms(s.plan).map((r) => ({ storey: r.storey, kind: r.kind, area: r.area, tiles: r.tiles }))) };
  let prompt = `${description}\n\nFurnish this building.`;
  for (let calls = 1; calls <= 2; calls++) {
    const answer = await council.ask<unknown>('scenographer', INTERIOR_TASK, prompt, interiorSchema(ids), { system, data, ...(opts.chi ? { chi: opts.chi } : {}) });
    const { rules, unknown } = readRules(answer, (id) => known.has(id));
    if (rules.length) {
      council.say('scenographer', 'propone', `interni di «${req.name}»: ${rules.length} regole, ${[...new Set(rules.flatMap((r) => r.furniture))].join(', ')}`, undefined, INTERIOR_TASK);
      return { rules, calls };
    }
    const why = `no rule the kernel can use: every rule needs ids of the list and a count from 1 to ${INTERIOR_LIMITS.count}${unknown.length ? `; not in the list: ${unknown.join(', ')}` : ''}`;
    council.say('kernel', 'scarta', `interni di «${req.name}»: ${why}`, 'scenographer', INTERIOR_TASK);
    prompt = `${description}\n\nFurnish this building.\n\nYour answer before could not be used: ${why}. Answer again.`;
  }
  return undefined;
}
