// The cellar furnished (T419, `docs/design/scenografo.md` § 10.4): the cellar as a kind of room of the Scenografo's way of data, only a rule
// that names it furnishes it; the pieces brought up to its ceiling, their back to the wall, made safe for the cellar's ground (no top under the
// ground a body could stand on and not reach); the guard of T409 keeps the cellar holding, exactly as the kernel's ground measures it; the
// storeys the kernel's walk reaches stay (the guard does not walk the jumps); offline the country house with its cellar furnished by the
// local models' rules, its stair and its way walked as a body walks them, the chest that goes under beside the furniture.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { CELLAR_FURNITURE, CELLAR_HOUSE, CELLAR_THING, MockAiModels } from '../src/kernel/ai/mock';
import { MOCK_STRUCTURE_PROGRAM } from '../src/kernel/ai/mockStructure';
import type { TextCall } from '../src/kernel/ai/models';
import { describeBuilding, interiorSchema, INTERIOR_TASK } from '../src/kernel/agents/scenographer';
import { structureModel } from '../src/kernel/modeldirector';
import { FormCache, Forms, groundOfForm, habitableParts, InlineRunner, solidAtGround, stepOf, storeysOf, walkIn, type FormComp, type ModelInfo } from '../src/kernel/forms';
import { CELLAR_GROWTH, cellarSafe, furnishWithRules, furniturePiece, interiorRooms, readRules, ruleFor, toHeight, type InteriorRule } from '../src/kernel/furnish';
import { interiorPlan } from '../src/kernel/interior';

const HOUSE = 'villetta-cantina';
/** The rules the local models give over the seed's catalogue: their cellar rule too. */
async function offlineRules(forms: Forms): Promise<InteriorRule[]> {
  const mock = new MockAiModels();
  mock.latency = 0;
  const catalogue = forms.furniture();
  return readRules(JSON.parse(await mock.text({ agent: 'scenographer', task: INTERIOR_TASK, system: '', prompt: '', data: { catalogue } })), (id) => catalogue.includes(id)).rules;
}

/** The seed with the offline country house and its cellar of one tile, with an interior if given. */
function library(interior?: unknown): Forms {
  const index = JSON.parse(bundledFiles['models/index.json']!) as Record<string, ModelInfo>;
  index[HOUSE] = { class: 'structure', name: 'la villetta con la cantina', cellar: 1, seeds: 4, ...(interior ? { interior } : {}) } as ModelInfo;
  const forms = new Forms(new InlineRunner(new FormCache()));
  forms.load({ ...bundledFiles, 'models/index.json': JSON.stringify(index), [`models/${HOUSE}.xml`]: MOCK_STRUCTURE_PROGRAM });
  return forms;
}

describe('la cantina, una stanza dello Scenografo (T419)', () => {
  it('solo una regola che la nomina la arreda; le regole di prima non ci arrivano', () => {
    const { rules } = readRules({ rules: [{ storey: 0, room: 'hall', furniture: ['banco'], count: 2 }, { furniture: ['barile'], count: 1 }, { room: 'cellar', furniture: ['cellar-shelf'], count: 3 }] }, () => true);
    expect(rules.map((r) => r.room)).toEqual(['hall', undefined, 'cellar']);
    expect(ruleFor(rules, { storey: 1, kind: 'room' })?.furniture).toEqual(['barile']);
    expect(ruleFor(rules, { storey: -1, kind: 'cellar' })?.furniture).toEqual(['cellar-shelf']);
    expect(ruleFor(rules.slice(0, 2), { storey: -1, kind: 'cellar' })).toBeUndefined();
    expect(interiorSchema(['banco']).properties!.rules.items!.properties!.room.enum).toContain('cellar');
  });

  it('il seme ha lo scaffale e la rastrelliera dello Scultore, alti fino al soffitto; i modelli locali li mettono in cantina', async () => {
    const forms = library();
    expect(forms.furniture()).toEqual(expect.arrayContaining(['cellar-shelf', 'cellar-rack']));
    for (const id of ['cellar-shelf', 'cellar-rack']) {
      expect(forms.info(id)).toMatchObject({ class: 'furniture', size: 'large' });
      // Two tiles tall at a building's 16 voxels a tile: taller than a cellar of one tile, under one of two.
      expect(furniturePiece(id, forms.request(id, 1, undefined, { bare: true })!, 16)!.Z).toBe(32);
    }
    const rules = await offlineRules(forms);
    expect(rules.at(-1)).toEqual({ room: 'cellar', furniture: CELLAR_FURNITURE, count: 4 });
  });

  it('un mobile si porta al soffitto della cantina: tagliato se è più alto, stirato se gli manca un gradino; un tavolo in una cantina profonda no', () => {
    const forms = library();
    const piece = (id: string) => furniturePiece(id, forms.request(id, 1, undefined, { bare: true })!, 16)!;
    const shelf = piece('cellar-shelf');
    expect(toHeight(shelf, 19).Z).toBe(19);
    expect(toHeight(shelf, 19).cells).toEqual(shelf.cells.slice(0, shelf.X * shelf.Y * 19));
    expect(toHeight(piece('barile'), 17).Z).toBe(17);
    const ceiling = (h: number) => () => h;
    const safe = cellarSafe(toHeight(shelf, 19), ceiling(19), stepOf(16) + 1, Math.ceil(0.7 * 16))!;
    expect(safe.Z).toBe(19);
    // Every top of it is one the ground does not count (`surfaces`): something of it or the ceiling between 4 and 12 voxels over it.
    const XY = safe.X * safe.Y;
    for (let i = 0; i < XY; i++)
      for (let z = 1; z < 19; z++)
        if (safe.cells[i + (z - 1) * XY] && !safe.cells[i + z * XY]) {
          let covered = false;
          for (let k = z + 4; k < z + 12; k++) if (k >= 19 || safe.cells[i + k * XY]) covered = true;
          expect(covered, `${i},${z}`).toBe(true);
        }
    // A bench in a cellar two tiles deep would be a floor nobody reaches: a pillar up to the ceiling, more than the piece may grow.
    expect(CELLAR_GROWTH).toBeLessThan(1);
    expect(cellarSafe(piece('banco'), ceiling(39), 4, 12)).toBeUndefined();
    expect(cellarSafe(piece('barile'), ceiling(19), 4, 12)).toBeDefined();
  });
});

describe('la villetta con la cantina arredata dai dati (T419)', () => {
  it('la cantina ha i suoi mobili contro i muri; regge, si raggiunge, il piede della scala resta libero, i piani restano', async () => {
    const forms = library();
    const rules = await offlineRules(forms);
    for (const seed of [1, 2, 3]) {
      const bare = (await forms.settled(HOUSE, seed, undefined, undefined, { bare: true }))!;
      const g = bare.result!.grid, pal = bare.result!.palette, vpt = bare.vpt, base = bare.base;
      expect(base).toBe(20);
      const actions = forms.compiled(HOUSE)!.actions;
      const plan = interiorPlan({ grid: g, palette: pal, vpt, base, actions, seed });
      const rooms = interiorRooms(plan);
      expect(rooms.filter((r) => r.kind === 'cellar').length).toBeGreaterThan(0);
      expect(rooms.findIndex((r) => r.kind === 'cellar')).toBe(rooms.length - rooms.filter((r) => r.kind === 'cellar').length);
      const pieces = new Map(['banco', 'credenza', 'barile', 'letto', 'furniture', 'cellar-shelf', 'cellar-rack'].map((id) => [id, furniturePiece(id, forms.request(id, 1, undefined, { bare: true })!, vpt)!]));
      const f = furnishWithRules(plan, rules, pieces, seed);
      const XY = g.X * g.Y;
      const down = f.items!.filter((x) => x.room === 'cellar');
      expect(down.length, `seme ${seed}`).toBeGreaterThanOrEqual(2);
      expect(down.every((x) => CELLAR_FURNITURE.includes(x.id))).toBe(true);
      const under = [...f.voxels].filter((v) => Math.floor(v / XY) < base);
      expect(under.length).toBeGreaterThan(1500);
      // Nothing on the building, nothing on what is kept: the foot of the cellar's stair and the way from it.
      expect([...f.voxels].every((v) => g.cells[v] === 0)).toBe(true);
      const cellar = plan.storeys.find((p) => p.cellar)!;
      const kept = [...cellar.kept.keys()].filter((i) => cellar.kept[i]);
      expect(kept.length).toBeGreaterThan(100);
      expect(kept.every((i) => !f.voxels.has(i + cellar.z * XY))).toBe(true);
      // The cellar holds as the kernel's ground measures it, is reached from the door, and the storeys are those of the bare house.
      expect(groundOfForm(f.grid, f.palette, vpt, base).hole).toBeDefined();
      const w0 = walkIn(g, pal, vpt, base, actions, seed), w1 = walkIn(f.grid, f.palette, vpt, base, actions, seed);
      expect(storeysOf(w1, vpt)).toEqual(storeysOf(w0, vpt));
      expect(habitableParts(f.grid, f.palette, vpt, 30, base, actions, seed).cellar).toEqual(habitableParts(g, pal, vpt, 30, base, actions, seed).cellar);
      // A shelf or a rack goes up to the ceiling: no top of it under the cellar's ceiling where a body could stand.
      expect(f.refused.cellar).toBe(0);
    }
  }, 300_000);

  it('il kernel dà indietro i piani che si raggiungono solo saltando: un pezzo che li toglie se ne va (il seme 3 di T410)', async () => {
    const forms = library();
    const seed = 3;
    const bare = (await forms.settled(HOUSE, seed, undefined, undefined, { bare: true }))!;
    const actions = forms.compiled(HOUSE)!.actions;
    const plan = interiorPlan({ grid: bare.result!.grid, palette: bare.result!.palette, vpt: bare.vpt, base: bare.base, actions, seed });
    const pieces = new Map(['banco', 'credenza', 'barile', 'letto', 'furniture'].map((id) => [id, furniturePiece(id, forms.request(id, 1, undefined, { bare: true })!, bare.vpt)!]));
    // T410's rules: a barrel at the foot of the jump to the upper floor took it away.
    const rules = readRules({ rules: [{ storey: 0, room: 'hall', furniture: ['banco', 'credenza', 'barile'], count: 3 }, { room: 'room', furniture: ['letto', 'furniture'], count: 2 }, { furniture: ['barile'], count: 1 }] }, () => true).rules;
    const f = furnishWithRules(plan, rules, pieces, seed);
    expect(f.pieces).toBeGreaterThan(3);
    expect(f.items!.length).toBe(f.pieces);
    const w0 = walkIn(bare.result!.grid, bare.result!.palette, bare.vpt, bare.base, actions, seed);
    expect(storeysOf(walkIn(f.grid, f.palette, bare.vpt, bare.base, actions, seed), bare.vpt)).toEqual(storeysOf(w0, bare.vpt));
  }, 240_000);

  it('allo Scenografo si dice la cantina come una stanza da arredare', async () => {
    const forms = library();
    const bare = (await forms.settled(HOUSE, 1, undefined, undefined, { bare: true }))!;
    const plan = interiorPlan({ grid: bare.result!.grid, palette: bare.result!.palette, vpt: bare.vpt, base: bare.base, actions: forms.compiled(HOUSE)!.actions, seed: 1 });
    const text = describeBuilding({ name: 'la villetta', box: [100, 100, 100], vpt: 16, seeds: [{ seed: 1, plan }] });
    expect(text).toMatch(/a cellar of [\d.]+ tiles² under the ground, reached by its stair/);
    expect(text).toMatch(/c\.1: the cellar \(z=1\), cellar, /);
    expect(text).not.toMatch(/stays empty/);
  }, 120_000);
});

/** Local models whose plan of the start asks its bakery with a cellar, and a chest down there (as `cellar-asked.test.ts`). */
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

describe('offline: la casa con la cantina scolpita, arredata dallo Scenografo, percorsa (T419, la verifica nel browser)', () => {
  it('lo Scenografo offline arreda anche la cantina; si scende e si risale come un corpo, la cassapanca sta giù fra i mobili', async () => {
    const k = await boot();
    const id = structureModel(CELLAR_HOUSE);
    const req = k.sculpting.missing().find((r) => r.id === id)!;
    expect(await k.sculpting.make(req)).toBe(true);
    // The local models do not furnish by themselves: the director by hand, as from the console.
    const r = await k.furnishing.make(id);
    expect(r.ok).toBe(true);
    expect(k.forms.interiorSpec(id)?.rules.some((x) => x.room === 'cellar')).toBe(true);
    // The place again, with the furnished house in the library: the chest goes down beside the furniture.
    const k2 = await boot(k.repo.head().files);
    const sid = k2.ecs.query('structure', 'chunk').find((e) => k2.ecs.get(e, 'structure').model === id)!;
    const fc = k2.ecs.get(sid, 'form') as FormComp;
    const f = (await k2.forms.settled(fc.model, fc.seed, fc.tint))!;
    expect(f.furnished).toBe(true);
    expect(f.hole).toBeDefined();
    const g = f.result!.grid, XY = g.X * g.Y;
    const bareGrid = (await k2.forms.settled(fc.model, fc.seed, fc.tint, undefined, { bare: true }))!.result!.grid;
    const under = [...g.cells.keys()].filter((v) => g.cells[v] && !bareGrid.cells[v] && Math.floor(v / XY) < f.base);
    expect(under.length).toBeGreaterThan(1000);
    // The chest the plan put under comes when the furnished form is ready, on the cellar's floor, not in a piece of furniture.
    const ch = k2.chunks.get('0,0')!;
    const index = ch.plan!.objects.findIndex((o) => o.module === CELLAR_THING && o.where === 'under');
    let chest: number | undefined;
    for (let i = 0; i < 200 && chest === undefined; i++) {
      k2.tick(1 / 60);
      await new Promise((res) => setTimeout(res, 10));
      chest = k2.ecs.query('module', 'origin').find((e) => k2.ecs.get(e, 'origin').key === `${ch.key}#o${index}`);
    }
    expect(chest).toBeDefined();
    const p = k2.ecs.get(chest!, 'pos');
    expect(p.z!).toBeLessThan(k2.groundAt(p.x, p.y) - 0.5);
    expect(k2.floorAt(p.x, p.y, p.z)).toBeCloseTo(p.z!, 5);
    // Down and up the stair as a body does, step by step (it climbs toward large x), on the furnished house: nothing stops it.
    const kk = k2 as any;
    const gr = kk.groundOf(sid, fc, f);
    const cols: number[] = [];
    for (let i = 0; i < XY; i++) if (gr.hole?.[i] && !solidAtGround(gr.levels, i, f.base, stepOf(f.vpt))) cols.push(i);
    expect(cols.length).toBeGreaterThan(0);
    const x0 = Math.min(...cols.map((i) => i % g.X)), x1 = Math.max(...cols.map((i) => i % g.X));
    const ys = cols.map((i) => Math.floor(i / g.X));
    const row = (Math.min(...ys) + Math.max(...ys) + 1) / 2;
    const sp = k2.ecs.get(sid, 'pos');
    const world = (vx: number) => {
      const lx = (vx + 0.5 - g.X / 2) / f.vpt, lz = (row - g.Y / 2) / f.vpt;
      return { x: sp.x + lx * Math.cos(fc.yaw) + lz * Math.sin(fc.yaw), y: sp.y - lx * Math.sin(fc.yaw) + lz * Math.cos(fc.yaw) };
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
    // The furniture stops a body down there: some point of the cellar's floor is not free any more, and the chest is not inside a piece.
    kk.rebuildSolids();
    const points = kk.cellarPoints(sid) as Array<{ x: number; y: number; z: number }>;
    expect(points.length).toBeGreaterThan(0);
    expect(points.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 1e-6)).toBe(true);
  }, 300_000);
});
