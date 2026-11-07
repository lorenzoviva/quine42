// Space in scales (ADR-0043): the plan's lots become structures — whole models set on their lots,
// facing their doors — what goes indoors stands on their floors, and the world has one Huge structure per
// zone and one Gargantuan per realm (ADR-0092).

import { describe, expect, it } from 'vitest';
import { Kernel, IMPORTANT_ZONE, INDOOR_R, REALM, realmOf, zoneOf } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { BODY_R, InlineRunner, type FormComp, type FormRequest, type FormRunner } from '../src/kernel/forms';
import type { ChunkPlan } from '../src/kernel/agents/cartography';

/** A kernel whose loaded chunks have all been planned by the Cartographer. */
async function boot(files = bundledFiles, forms?: FormRunner) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), ...(forms ? { forms } : {}) });
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
  return k;
}

/** The structures of a planned chunk, by lot index. */
const structuresOf = (k: Kernel, key: string) => {
  const out: number[] = [];
  for (const id of k.ecs.query('structure', 'origin')) {
    const m = new RegExp(`^${key}#s(\\d+)$`).exec(k.ecs.get(id, 'origin').key);
    if (m) out[Number(m[1])] = id;
  }
  return out;
};

describe('lots and structures', () => {
  it('turns every lot of the village into a structure on its lot, facing its door', async () => {
    const k = await boot();
    const ch = k.chunks.get('0,0')!;
    const S = k.config.chunkSize;
    expect(ch.lots.length).toBeGreaterThan(0);
    const structures = structuresOf(k, ch.key);
    for (const [i, b] of ch.lots.entries()) {
      const sid = structures[i];
      expect(sid, `edificio ${i}`).toBeDefined();
      // In the middle of its lot.
      const p = k.ecs.get(sid, 'pos');
      expect(p.x).toBeCloseTo(ch.cx * S + (b.x0 + b.x1 + 1) / 2);
      expect(p.y).toBeCloseTo(ch.cy * S + (b.y0 + b.y1 + 1) / 2);
      // Its front looks towards the door (south is yaw 0, as the camera sees it).
      const door = b.doors[0];
      const dc = door % S, dr = Math.floor(door / S);
      const yaw = dr === b.y1 ? 0 : dr === b.y0 ? Math.PI : dc === b.x0 ? -Math.PI / 2 : Math.PI / 2;
      expect((k.ecs.get(sid, 'form') as FormComp).yaw).toBeCloseTo(yaw);
      // The lot is ground again: no walls of tiles, the model is the wall.
      for (const c of [...b.walls, ...b.floor, ...b.doors]) {
        const t = k.palette[ch.tiles[c]];
        expect(t?.solid, `casella ${c}`).toBeFalsy();
        expect(t?.layer ?? 'ground').toBe('ground');
      }
    }
    // The Cartographer's structure goes on the largest lot and waits for its model; the others are houses.
    const area = (i: number) => (ch.lots[i].x1 - ch.lots[i].x0 + 1) * (ch.lots[i].y1 - ch.lots[i].y0 + 1);
    const largest = ch.lots.map((_, i) => i).sort((a, b) => area(b) - area(a) || a - b)[0];
    const s = k.ecs.get(structures[largest], 'structure');
    expect(s.concept).toBe('il forno del borgo');
    expect(s.model).toBe('struttura-il-forno-del-borgo');
    const fc = k.ecs.get(structures[largest], 'form') as FormComp;
    expect(fc.model).toBe(s.class);
    expect(fc.wanted).toBe('struttura-il-forno-del-borgo');
    expect(k.sculpting.missing().some((r) => r.id === 'struttura-il-forno-del-borgo' && r.classe === s.class)).toBe(true);
    for (const [i, sid] of structures.entries()) if (i !== largest) expect(k.ecs.get(sid, 'structure').concept).toMatch(/^una cas/);
  });

  it('puts what goes indoors on the floor of the model, never inside its walls nor inside what already stands there', async () => {
    const k = await boot();
    const kk = k as any;
    const ch = k.chunks.get('0,0')!;
    const structures = structuresOf(k, ch.key).filter((id) => id !== undefined);
    // Every model of the place built: the houses and what the plan put in them (a counter, a chest: they block with their voxels).
    for (const id of k.ecs.query('form', 'chunk')) {
      const fc = k.ecs.get(id, 'form') as FormComp;
      if (k.ecs.get(id, 'chunk').key === ch.key) await k.forms.wait(fc.model, fc.seed, fc.tint);
    }
    for (let i = 0; i < 5; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 10));
    }
    // The seed's half-timbered house is the procedural one (T281), and the place has some.
    expect(k.files['models/structure.xml']).toMatch(/Half-timbered house, procedural/);
    expect(structures.filter((sid) => (k.ecs.get(sid, 'form') as FormComp).model === 'structure').length).toBeGreaterThan(0);
    kk.rebuildSolids();
    // What the plan put inside a structure stands on its floor, where nothing else stands (itself out of the way).
    const inside = k.ecs.query('pos', 'chunk').filter((id) => !k.ecs.has(id, 'structure') && k.ecs.get(id, 'chunk').key === ch.key && k.structureAt(k.ecs.get(id, 'pos').x, k.ecs.get(id, 'pos').y) !== undefined);
    expect(inside.length).toBeGreaterThan(0);
    for (const id of inside) {
      const p = k.ecs.get(id, 'pos');
      const body = k.ecs.get(id, 'body');
      const solid = body?.solid;
      if (body) body.solid = false;
      kk.rebuildSolids();
      expect(k.floorAt(p.x, p.y), `${id}`).toBeGreaterThan(k.groundAt(p.x, p.y));
      expect(k.free(p.x, p.y, INDOOR_R), `${k.ecs.get(id, 'module')?.id ?? id} at ${p.x},${p.y}`).toBe(true);
      if (body) body.solid = solid;
    }
    // Every point of every structure, with what stands inside out of the way: on its floor, inside it, where a thing and a body stand.
    const solids = k.ecs.query('body').filter((id) => !k.ecs.has(id, 'structure') && k.ecs.get(id, 'body').solid);
    for (const id of solids) k.ecs.get(id, 'body').solid = false;
    kk.rebuildSolids();
    let points = 0;
    for (const sid of structures) {
      for (const p of kk.interiorPoints(sid) as Array<{ x: number; y: number }>) {
        points++;
        const at = `${(k.ecs.get(sid, 'form') as FormComp).model} ${p.x},${p.y}`;
        expect(k.structureAt(p.x, p.y), at).toBe(sid);
        expect(k.floorAt(p.x, p.y), at).toBeGreaterThan(k.groundAt(p.x, p.y));
        expect(k.free(p.x, p.y, INDOOR_R), at).toBe(true);
        expect(k.free(p.x, p.y, BODY_R), at).toBe(true);
      }
    }
    expect(points).toBeGreaterThan(structures.length);
    for (const id of solids) k.ecs.get(id, 'body').solid = true;
    // With them back, what goes indoors still finds a free point of the floor, not the lot.
    const fallback = { x: 1e6, y: 1e6 };
    for (const sid of structures) {
      if (!kk.interiorPoints(sid).length) continue;
      let p = fallback;
      await kk.placeInside(ch, sid, fallback, (x: number, y: number) => (p = { x, y }));
      expect(p).not.toEqual(fallback);
      expect(k.structureAt(p.x, p.y)).toBe(sid);
      expect(k.free(p.x, p.y, INDOOR_R), `${p.x},${p.y}`).toBe(true);
    }
    // Outside the structure one stands on the ground.
    const sid = structures[0];
    const far = k.ecs.get(sid, 'pos');
    expect(k.structureAt(far.x + 40, far.y + 40)).toBeUndefined();
    expect(k.floorAt(far.x + 40, far.y + 40)).toBe(k.groundAt(far.x + 40, far.y + 40));
  }, 30_000);

  it('waits for a structure as long as its program runs: what goes in it is on its floor even when the form comes late', async () => {
    // As in the browser, where a structure comes from a worker in tens of seconds: the houses arrive after eight seconds, longer than
    // `Forms.wait` waits (400 timers of 5 ms: two to six seconds, as the timers of the machine go). Before T281 what the plan put in
    // them went where the plan said, inside their walls.
    const inline = new InlineRunner();
    const late: FormRunner = { run: (q: FormRequest) => (q.model === 'structure' ? inline.run(q).then((r) => new Promise((ok) => setTimeout(() => ok(r), 8_000))) : inline.run(q)) };
    const k = await boot(bundledFiles, late);
    const kk = k as any;
    const ch = k.chunks.get('0,0')!;
    const houses = structuresOf(k, ch.key).filter((id) => id !== undefined && (k.ecs.get(id, 'form') as FormComp).model === 'structure');
    expect(houses.length).toBeGreaterThan(0);
    for (const sid of houses) {
      const fc = k.ecs.get(sid, 'form') as FormComp;
      expect((await k.forms.settled(fc.model, fc.seed, fc.tint))?.status).toBe('ready');
    }
    for (let i = 0; i < 10; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 20));
    }
    const inside = k.ecs.query('pos', 'chunk').filter((id) => !k.ecs.has(id, 'structure') && k.ecs.get(id, 'chunk').key === ch.key && houses.includes(k.structureAt(k.ecs.get(id, 'pos').x, k.ecs.get(id, 'pos').y)!));
    expect(inside.length).toBeGreaterThan(0);
    for (const id of inside) {
      const p = k.ecs.get(id, 'pos');
      const body = k.ecs.get(id, 'body');
      const solid = body?.solid;
      if (body) body.solid = false;
      kk.rebuildSolids();
      expect(k.free(p.x, p.y, INDOOR_R), `${k.ecs.get(id, 'module')?.id ?? id} at ${p.x},${p.y}`).toBe(true);
      if (body) body.solid = solid;
    }
  }, 30_000);

  it('never gives a tile of a lot as the nearest tile of a terrain (world.find_tile): the grass under a house is not a pasture', async () => {
    const k = await boot();
    const ch = k.chunks.get('0,0')!;
    const S = k.config.chunkSize;
    const b = ch.lots[0];
    const lotTiles = new Set(ch.lots.flatMap((l) => [...l.floor, ...l.walls, ...l.doors]));
    // The lot is ground again: the terrain of the tiles around it.
    const code = ch.tiles[b.floor[0]];
    const mid = { x: ch.cx * S + (b.x0 + b.x1 + 1) / 2, y: ch.cy * S + (b.y0 + b.y1 + 1) / 2 };
    expect(k.tileAt(Math.floor(mid.x), Math.floor(mid.y))).toBe(code);
    const t = k.findTile(code, mid.x, mid.y, 12)!;
    expect(t).toBeDefined();
    expect(lotTiles.has((Math.floor(t.y) - ch.cy * S) * S + (Math.floor(t.x) - ch.cx * S))).toBe(false);
    // Within the lot alone there is none.
    const r = Math.floor(Math.min(b.x1 - b.x0, b.y1 - b.y0) / 2) - 1;
    if (r >= 0) expect(k.findTile(code, mid.x, mid.y, r)).toBeUndefined();
  }, 30_000);

  it('finds no point of a floor that the house itself blocks: a wall one voxel thin, a beam at head height', async () => {
    // A house of 3 × 3 tiles (20 voxels a tile): a floor two voxels high, its four walls, a partition one voxel thick on an odd
    // column (x = 29) and a beam over the floor between a step and a head above it (z = 14..15, x = 40). Before T281
    // `interiorPoints` looked at one column in two and, without a cellar, not at where a body cannot stand: it gave points beside both.
    const house = `<sequence values="BWF" size="60 60 40">
  <color symbol="W" value="aa8866" name="wall"/>
  <color symbol="F" value="776655" name="floor"/>
  <box at="30 30 0" size="57 57 2" color="F"/>
  <box at="2 30 2" size="1 57 30" color="W"/>
  <box at="58 30 2" size="1 57 30" color="W"/>
  <box at="30 2 2" size="57 1 30" color="W"/>
  <box at="30 58 2" size="57 1 30" color="W"/>
  <box at="29 30 2" size="1 41 30" color="W"/>
  <box at="40 30 14" size="1 41 2" color="W"/>
</sequence>`;
    const k = await boot({ ...bundledFiles, 'models/structure.xml': house });
    const kk = k as any;
    const ch = k.chunks.get('0,0')!;
    const houses = structuresOf(k, ch.key).filter((id) => id !== undefined && (k.ecs.get(id, 'form') as FormComp).model === 'structure');
    expect(houses.length).toBeGreaterThan(0);
    for (const sid of houses) {
      const fc = k.ecs.get(sid, 'form') as FormComp;
      await k.forms.wait(fc.model, fc.seed, fc.tint);
    }
    k.tick(1 / 60);
    // Only the house: what stands inside it out of the way.
    for (const id of k.ecs.query('body')) if (!k.ecs.has(id, 'structure')) k.ecs.get(id, 'body').solid = false;
    kk.rebuildSolids();
    for (const sid of houses) {
      const points = kk.interiorPoints(sid) as Array<{ x: number; y: number }>;
      // Both rooms have points, away from the partition and the beam.
      expect(points.length).toBeGreaterThan(8);
      for (const p of points) {
        expect(k.free(p.x, p.y, INDOOR_R), `${p.x},${p.y}`).toBe(true);
        expect(k.free(p.x, p.y, BODY_R), `${p.x},${p.y}`).toBe(true);
      }
    }
  }, 30_000);

  it('keeps one Huge structure per zone and one Gargantuan per realm, fitted to their lots, and remembers which', async () => {
    const k = await boot();
    // Lots of 12 × 12 tiles (they hold a Gargantuan box) and of 6 × 6 (a Large one: 5 × 5).
    const lot = (n: number) => ({ x0: 0, y0: 0, x1: n - 1, y1: n - 1, walls: [], floor: [], doors: [] });
    const claim = (key: string, cx: number, cy: number, plan: Partial<ChunkPlan>, sides = [12, 6]) => (k as any).claimSizes({ key, cx, cy, lots: sides.map(lot) }, plan);
    // Zones are about a thousand tiles wide, centred on the start; realms are 4 × 4 zones.
    expect(IMPORTANT_ZONE * k.config.chunkSize).toBeGreaterThanOrEqual(1000);
    expect(zoneOf(0, 0)).toBe(zoneOf(IMPORTANT_ZONE / 2 - 1, -IMPORTANT_ZONE / 2));
    expect(zoneOf(0, 0)).not.toBe(zoneOf(IMPORTANT_ZONE / 2, 0));
    expect(realmOf(0, 0)).toBe(realmOf(IMPORTANT_ZONE * (REALM / 2) - IMPORTANT_ZONE / 2 - 1, 0));
    expect(realmOf(0, 0)).not.toBe(realmOf(IMPORTANT_ZONE * (REALM / 2) + IMPORTANT_ZONE / 2, 0));
    // The plans before ADR-0092 said «importante»: that castle is Huge.
    const a: Partial<ChunkPlan> = { structures: [{ concetto: 'il castello', importante: true } as any, { concept: 'la torre', size: 'huge' }] };
    claim('5,5', 5, 5, a);
    // One rare per place: the second goes down to Large (and fits its lot of 6).
    expect(a.structures!.map((s) => s.size)).toEqual(['huge', 'large']);
    // Another place of the same zone may not have a Huge one, but may have the Gargantuan one of the realm.
    const b: Partial<ChunkPlan> = { structures: [{ concept: 'il tempio', size: 'huge' }] };
    claim('6,5', 6, 5, b);
    expect(b.structures![0].size).toBe('large');
    expect(k.rareAllowed({ key: '6,5', cx: 6, cy: 5 })).toEqual(['gargantuan']);
    expect(k.rareAllowed({ key: '5,5', cx: 5, cy: 5 })).toEqual(['huge', 'gargantuan']);
    const g: Partial<ChunkPlan> = { structures: [{ concept: 'la cittadella', size: 'gargantuan' }] };
    claim('7,5', 7, 5, g);
    expect(g.structures![0].size).toBe('gargantuan');
    // In another zone of the same realm: a Huge one yes, the Gargantuan one no (it goes down to Huge).
    const c: Partial<ChunkPlan> = { structures: [{ concept: 'la piramide', size: 'gargantuan' }] };
    claim(`${IMPORTANT_ZONE},0`, IMPORTANT_ZONE, 0, c);
    expect(c.structures![0].size).toBe('huge');
    // A size that does not fit its lot goes down to the largest that does: Huge (7.5 tiles) on a lot of 6 is Large.
    const d: Partial<ChunkPlan> = { structures: [{ concept: 'la rocca', size: 'huge' }] };
    claim(`${2 * IMPORTANT_ZONE},0`, 2 * IMPORTANT_ZONE, 0, d, [6]);
    expect(d.structures![0].size).toBe('large');
    expect(k.rareAllowed({ key: '0,0', cx: 2 * IMPORTANT_ZONE, cy: 0 })).toContain('huge');
    // The structure carries its size.
    const ch = { ...k.chunks.get('0,0')!, lots: [lot(12)] };
    const lots = (k as any).lotsOf(ch, { ...k.chunks.get('0,0')!.plan!, structures: [{ concept: 'la cittadella', size: 'gargantuan' }] }, '.').lots;
    expect(lots[0].structure).toMatchObject({ concept: 'la cittadella', class: 'structure', size: 'gargantuan' });
    // Saved with the game, and read back; the important ones of an old state are the Huge ones.
    expect(k.saveState()).toBe(true);
    const saved = JSON.parse(k.repo.head().files['world/state.json']!).rares;
    expect(saved).toEqual({ huge: { [zoneOf(5, 5)]: '5,5', [zoneOf(IMPORTANT_ZONE, 0)]: `${IMPORTANT_ZONE},0` }, gargantuan: { [realmOf(7, 5)]: '7,5' } });
    for (const m of (k as any).rari.values()) m.clear();
    k.loadState();
    expect(k.rareAllowed({ key: '6,5', cx: 6, cy: 5 })).toEqual([]);
    for (const m of (k as any).rari.values()) m.clear();
    (k as any).files = { ...(k as any).files, 'world/state.json': JSON.stringify({ importanti: { [zoneOf(5, 5)]: '5,5' } }) };
    k.loadState();
    expect(k.rareAllowed({ key: '6,5', cx: 6, cy: 5 })).toEqual(['gargantuan']);
  });

  it('a structure wears its own model as soon as the Sculptor writes it', async () => {
    const k = await boot();
    const ch = k.chunks.get('0,0')!;
    const sid = structuresOf(k, ch.key).find((id) => id !== undefined && k.ecs.get(id, 'form').wanted)!;
    expect(sid).toBeDefined();
    const fc = k.ecs.get(sid, 'form') as FormComp;
    const own = fc.wanted!;
    const generic = fc.model;
    // The Sculptor's program (here the generic one of its class, under its own name) enters the library.
    expect(k.addModel(own, bundledFiles[`models/${generic}.xml`], { class: generic, name: 'il forno del borgo' }, `scultore: ${own}`)).toBe(true);
    expect(fc.model).toBe(own);
    expect(fc.wanted).toBeUndefined();
    expect(fc.seed).toBe(k.forms.seedFor(own, k.ecs.get(sid, 'origin').key));
    expect(k.sculpting.missing().some((r) => r.id === own)).toBe(false);
  }, 30_000);
});
