// The Cartographer and the Sculptor ask for cellars (T417, T52f, ADR-0091 point 4): a structure of a plan says `cellar`, the things that go
// down there say `under`; the ModelDirector asks its model with a cellar of one tile (two for the rare sizes), the Sculptor digs it with the
// part of the seed `part-cellar` and the checks want it to hold and to be reached from the door, or the building comes in without it; a cellar
// is not a storey (ADR-0162); what goes under stands on the cellar's floor, away from its stair.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { CELLAR_HOUSE, CELLAR_THING, MockAiModels } from '../src/kernel/ai/mock';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';
import type { TextCall } from '../src/kernel/ai/models';
import { Council } from '../src/kernel/agents/council';
import { checkProgram, filesOf, partResources, sculpt, withMeaning } from '../src/kernel/agents/sculptor';
import { readStructure, whereOf, type ChunkPlan } from '../src/kernel/agents/cartography';
import { cellarFor, hasCellar, modelSize, structureModel } from '../src/kernel/modeldirector';
import { cellarStoreys, groundOfForm, habitableParts, reachableStoreys, solidAtGround, stepOf, walkIn, type FormComp } from '../src/kernel/forms';
import { compileMjx } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { analyse } from '../src/mj/check';
import { classOf } from '../src/mj/classes';

const structure = classOf('structure')!;
const PART = bundledFiles['models/part-cellar.xml']!;

/** The part alone in its own box, with `base` voxels under its soil. */
function partAlone(base: number, seed = 1) {
  const m = compileMjx(PART, base ? { base } : {});
  const r = runMjx(m, seed, { deadline: 8_000 });
  return { m, r, pal: m.program.palette };
}

describe('the part of the seed that digs a cellar (part-cellar)', () => {
  it('alone digs a cellar of one tile that holds and is reached from the door; without room under the soil it digs nothing', () => {
    for (const seed of [1, 2, 3]) {
      const { m, r, pal } = partAlone(20, seed);
      expect(r.finished).toBe(true);
      expect(analyse(r, pal, { grounded: true, base: 20 }).errors).toEqual([]);
      // It holds: every floor under the ground is reached from the ground floor (T52b), and the walk from the door goes down (T417).
      expect(groundOfForm(r.grid, pal, 16, 20).hole).toBeDefined();
      const h = habitableParts(r.grid, pal, 16, 30, 20, m.actions, seed);
      expect(h.cellar.length).toBeGreaterThan(0);
      expect(h.cellar.every((z) => z < 20 - stepOf(16))).toBe(true);
    }
    const flat = partAlone(0);
    expect(flat.r.finished).toBe(true);
    const k = flat.r.grid.alphabet.indexOf('k');
    expect(flat.r.grid.cells.includes(k)).toBe(false);
    expect(groundOfForm(flat.r.grid, flat.pal, 16, 0).hole).toBeUndefined();
  });

  it('a cellar is not a storey (ADR-0162): the storeys over the ground only, the floors down there apart', () => {
    const { m, r, pal } = partAlone(20);
    const storeys = reachableStoreys(r.grid, pal, 16, 20, m.actions, 1);
    expect(storeys.length).toBeGreaterThan(0);
    expect(storeys.every((z) => z >= 20 - stepOf(16))).toBe(true);
    const below = cellarStoreys(walkIn(r.grid, pal, 16, 20, m.actions, 1), 20, 16);
    expect(below).toEqual(habitableParts(r.grid, pal, 16, 30, 20, m.actions, 1).cellar);
    expect(below.length).toBe(1);
  });

  it('is listed in the Sculptor’s request with its contract, as the other parts', () => {
    const part = partResources(bundledFiles).find((p) => p.includes('part-cellar'))!;
    expect(part).toMatch(/You mark with D the first\s+layer under the soil/);
    expect(part).not.toMatch(/Alone it builds/);
    expect(JSON.parse(bundledFiles['models/index.json']!)['part-cellar']).toMatchObject({ class: 'structure', cellar: 1 });
  });
});

describe('the Sculptor with a cellar', () => {
  const files = filesOf(MOCK_STRUCTURE_PROGRAM, bundledFiles);

  it('the offline country house digs its cellar of one tile at every seed and at the next size, and passes as before without one', () => {
    expect(checkProgram(MOCK_STRUCTURE_PROGRAM, structure, undefined, files, { cellar: 1 }).error).toBeUndefined();
    expect(checkProgram(MOCK_STRUCTURE_PROGRAM, structure, undefined, files).error).toBeUndefined();
  }, 120_000);

  it('a cellar too deep for its room does not hold: only the cellar is wrong, and the reason says what it measures', () => {
    const c = checkProgram(MOCK_STRUCTURE_PROGRAM, structure, undefined, files, { cellar: 2 });
    expect(c.error).toMatch(/^taglia Grande, seme 1: cantina: /);
    expect(c.cellarOnly).toBe(true);
    expect(withMeaning(c.error!)).toMatch(/— the cellar under the ground/);
    // A program that digs nothing does not pass with one.
    const none = checkProgram(MOCK_STRUCTURE_PROGRAM.replace('<import file="part-cellar"/>', '').replace(/<all in="[^"]*" out="\* D"\/>/, ''), structure, undefined, files, { cellar: 1 });
    expect(none.error).toMatch(/cantina: niente sotto il suolo/);
  }, 120_000);

  it('asks for it in the request, and gives back the cellar it holds or comes in without (ADR-0091 point 3)', async () => {
    const m = new MockAiModels();
    const calls: TextCall[] = [];
    const text = m.text.bind(m);
    m.text = async (call: TextCall) => (calls.push(call), text(call));
    const c = new Council(m, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const plan = { semplici: 1, revisione: false, giudizio: false };
    const one = await sculpt(c, { id: structureModel('una casa'), nome: 'una casa', aspetto: 'una casa con la cantina', classe: 'structure', cellar: 1 }, undefined, plan);
    expect(one?.cellar).toBe(1);
    expect(calls[0].prompt).toMatch(/It has a cellar under it: the box goes 20 voxels \(1\.25 tiles\) under the soil/);
    const two = await sculpt(c, { id: structureModel('un forte'), nome: 'un forte', aspetto: 'un forte con la cripta', classe: 'structure', cellar: 2 }, undefined, plan);
    expect(two).toBeDefined();
    expect(two!.cellar).toBeUndefined();
  }, 240_000);
});

describe('the Cartographer asks for cellars', () => {
  it('reads `cellar` only when it is said true, and `under` as a place of a plan', () => {
    expect(readStructure({ concept: 'la locanda', cellar: true })).toEqual({ concept: 'la locanda', cellar: true });
    expect(readStructure({ concept: 'la locanda', cellar: 'sì' })).toEqual({ concept: 'la locanda' });
    expect(whereOf('under')).toBe('under');
    expect(whereOf('sotto')).toBe('under');
    expect(cellarFor()).toBe(1);
    expect(cellarFor('large')).toBe(1);
    expect(cellarFor('huge')).toBe(2);
    expect(cellarFor('gargantuan')).toBe(2);
    expect(hasCellar('structure')).toBe(true);
    expect(hasCellar('structure', 'medium')).toBe(false);
    expect(hasCellar('building')).toBe(false);
    expect(modelSize({ classe: 'structure' })).toEqual({});
  });

  it('the validator keeps what goes under only with a structure that has a cellar: without one it goes inside', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const layouts = new Set(['village']);
    const plan: ChunkPlan = {
      place: { name: 'Le Botti', description: 'una locanda con la cantina' },
      layout: 'village',
      objects: [{ module: CELLAR_THING, where: 'under' }],
      ground: [],
      fresh: [{ concept: 'una botte grande', where: 'under' }],
      runes: [],
      structures: [{ concept: 'la locanda', cellar: 'sì' as unknown as boolean }],
    };
    const placeable = new Set([CELLAR_THING]);
    const without = k.validator.validatePlan(plan, layouts, placeable);
    expect(without.plan.structures).toEqual([{ concept: 'la locanda' }]);
    expect(without.plan.objects[0].where).toBe('inside');
    expect(without.plan.fresh[0].where).toBe('inside');
    const withCellar = k.validator.validatePlan({ ...plan, structures: [{ concept: 'la locanda', cellar: true }] }, layouts, placeable);
    expect(withCellar.plan.structures).toEqual([{ concept: 'la locanda', cellar: true }]);
    expect(withCellar.plan.objects[0].where).toBe('under');
  });
});

/** Local models whose plan of the start asks its bakery with a cellar, and a chest down there. */
class CellarPlans extends MockAiModels {
  async text(call: TextCall): Promise<string> {
    const a = await super.text(call);
    if (call.task !== 'chunk.plan' || !(call.data as { start?: boolean })?.start) return a;
    const plan = JSON.parse(a);
    plan.structures = [{ concept: CELLAR_HOUSE, cellar: true }];
    plan.objects = [...plan.objects, { module: CELLAR_THING, where: 'under' }];
    return JSON.stringify(plan);
  }
}

async function boot(files = bundledFiles) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new CellarPlans() });
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
  return k;
}

describe('a place with a structure with a cellar, things down there (T417)', () => {
  it('the structure asks its model with a cellar, the Sculptor digs it, and the chest stands on the cellar’s floor, reached and off the stair', async () => {
    const k = await boot();
    const ch = k.chunks.get('0,0')!;
    const id = structureModel(CELLAR_HOUSE);
    const sid = k.ecs.query('structure', 'chunk').find((e) => k.ecs.get(e, 'structure').model === id)!;
    expect(sid).toBeDefined();
    expect(k.ecs.get(sid, 'structure')).toMatchObject({ concept: CELLAR_HOUSE, class: 'structure', cellar: 1 });
    const req = k.sculpting.missing().find((r) => r.id === id)!;
    expect(req).toMatchObject({ classe: 'structure', cellar: 1 });
    expect(req.aspetto).toMatch(/with a cellar under it/);
    // Sculpted offline: the country house with its cellar; the entry says it, so the library runs it under the ground.
    expect(await k.sculpting.make(req)).toBe(true);
    expect(k.forms.info(id)).toMatchObject({ class: 'structure', cellar: 1 });
    // The place again, with the model in the library: the chest goes down.
    const k2 = await boot(k.repo.head().files);
    const ch2 = k2.chunks.get(ch.key)!;
    const sid2 = k2.ecs.query('structure', 'chunk').find((e) => k2.ecs.get(e, 'structure').model === id)!;
    const fc = k2.ecs.get(sid2, 'form') as FormComp;
    expect(fc.model).toBe(id);
    const f = (await k2.forms.wait(fc.model, fc.seed, fc.tint))!;
    expect(f.base).toBe(20);
    expect(f.hole).toBeDefined();
    // The chest the plan put under (its last thing) comes when its structure's form is ready.
    const index = ch2.plan!.objects.findIndex((o) => o.module === CELLAR_THING && o.where === 'under');
    expect(index).toBeGreaterThanOrEqual(0);
    let chest: number | undefined;
    for (let i = 0; i < 200 && chest === undefined; i++) {
      k2.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 10));
      chest = k2.ecs.query('module', 'origin').find((e) => k2.ecs.get(e, 'origin').key === `${ch2.key}#o${index}`);
    }
    expect(chest).toBeDefined();
    k2.tick(1 / 60);
    const p = k2.ecs.get(chest!, 'pos');
    const ground = k2.groundAt(p.x, p.y);
    // Down there, on the cellar's floor: under the ground, where the cut of T416 shows it.
    expect(p.z).toBeDefined();
    expect(p.z!).toBeLessThan(ground - 0.5);
    expect(k2.floorAt(p.x, p.y, p.z)).toBeCloseTo(p.z!, 5);
    expect(k2.underground({ x: p.x, y: p.y, z: p.z })).toBeDefined();
    expect(k2.structureAt(p.x, p.y)).toBe(sid2);
    // Reached: the walk from the door goes down to the cellar, and the chest's floor is one a body reaches from the ground floor.
    const g = f.result!.grid;
    const m = k2.forms.compiled(fc.model)!;
    expect(habitableParts(g, f.result!.palette, f.vpt, 30, f.base, m.actions, fc.seed).cellar.length).toBeGreaterThan(0);
    // Off the stair: the way up stays free (a tile from every column of the stair).
    const kk = k2 as any;
    const points = kk.cellarPoints(sid2) as Array<{ x: number; y: number; z: number }>;
    expect(points.length).toBeGreaterThan(0);
    expect(points.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 1e-6)).toBe(true);
    expect(points.every((q) => q.z === p.z)).toBe(true);
    // Nothing of the ground floor stands at the stairwell, where it would hang over the way down (three quarters of a tile from it).
    const gr = kk.groundOf(sid2, fc, f);
    const sp2 = k2.ecs.get(sid2, 'pos');
    const well: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < g.X * g.Y; i++)
      if (gr.hole?.[i] && !solidAtGround(gr.levels, i, f.base, stepOf(f.vpt))) {
        const lx = ((i % g.X) + 0.5 - g.X / 2) / f.vpt, lz = (Math.floor(i / g.X) + 0.5 - g.Y / 2) / f.vpt;
        well.push({ x: sp2.x + lx * Math.cos(fc.yaw) + lz * Math.sin(fc.yaw), y: sp2.y - lx * Math.sin(fc.yaw) + lz * Math.cos(fc.yaw) });
      }
    expect(well.length).toBeGreaterThan(0);
    // One goes down the stair and up again as a body does, step by step (the stair of part-cellar climbs toward large x): nothing of the
    // cellar nor of the ground floor stops it, and it ends on the cellar's floor.
    const cols = [] as number[];
    for (let i = 0; i < g.X * g.Y; i++) if (gr.hole?.[i] && !solidAtGround(gr.levels, i, f.base, stepOf(f.vpt))) cols.push(i);
    const x0 = Math.min(...cols.map((i) => i % g.X)), x1 = Math.max(...cols.map((i) => i % g.X));
    const ys = cols.map((i) => Math.floor(i / g.X));
    const row = (Math.min(...ys) + Math.max(...ys) + 1) / 2;
    const world = (vx: number) => {
      const lx = (vx + 0.5 - g.X / 2) / f.vpt, lz = (row - g.Y / 2) / f.vpt;
      return { x: sp2.x + lx * Math.cos(fc.yaw) + lz * Math.sin(fc.yaw), y: sp2.y - lx * Math.sin(fc.yaw) + lz * Math.cos(fc.yaw) };
    };
    let at = k2.floorAt(world(x1 + 7).x, world(x1 + 7).y, k2.groundAt(world(x1 + 7).x, world(x1 + 7).y));
    const walk = (from: number, to: number) => {
      for (let vx = from; from > to ? vx >= to : vx <= to; vx += from > to ? -0.25 : 0.25) {
        const q = world(vx);
        const z = k2.floorAt(q.x, q.y, at);
        expect(Math.abs(z - at), `${vx}`).toBeLessThanOrEqual(0.2);
        expect(k2.free(q.x, q.y, 0.22, z), `${vx}`).toBe(true);
        at = z;
      }
    };
    walk(x1 + 7, x0 - 12);
    expect(at).toBeCloseTo(p.z!, 5);
    walk(x0 - 12, x1 + 7);
    expect(at).toBeGreaterThan(k2.groundAt(world(x1 + 7).x, world(x1 + 7).y) - 0.01);
    for (const q of kk.interiorPoints(sid2) as Array<{ x: number; y: number }>) expect(Math.min(...well.map((w) => Math.hypot(w.x - q.x, w.y - q.y)))).toBeGreaterThan(0.7);
    // It stands at its height for the renderer and for who bumps into it, and its height goes to the clients (`below`, ENTITY_PARTS).
    expect(k2.restsAt(chest!)).toBeCloseTo(p.z!, 5);
    expect(k2.ecs.get(chest!, 'below')).toEqual({ z: p.z });
    kk.rebuildSolids();
    const solid = (kk.solidForms.get(`${Math.floor(p.x)},${Math.floor(p.y)}`) as Array<{ id: number; stand?: number }>).find((s) => s.id === chest);
    expect(solid?.stand).toBeCloseTo(p.z!, 5);
    // Down there a body is stopped by the chest, not by what stands on the floor over the cellar, and stays on the cellar's floor.
    for (const q of points) if (Math.hypot(q.x - p.x, q.y - p.y) > 1.2) {
      expect(k2.free(q.x, q.y, 0.22, q.z), `${q.x},${q.y}`).toBe(true);
      expect(k2.floorAt(q.x, q.y, q.z)).toBeCloseTo(q.z, 5);
    }
  }, 240_000);
});
