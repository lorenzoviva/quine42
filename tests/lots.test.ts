// Space in scales (ADR-0043): the plan's lots become structures — whole models set on their lots,
// facing their doors — what goes indoors stands on their floors, and the world has one Huge structure per
// zone and one Gargantuan per realm (ADR-0092).

import { describe, expect, it } from 'vitest';
import { Kernel, IMPORTANT_ZONE, REALM, realmOf, zoneOf } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { FormComp } from '../src/kernel/forms';
import type { ChunkPlan } from '../src/kernel/agents/cartography';

/** A kernel whose loaded chunks have all been planned by the Cartographer. */
async function boot() {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
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
  for (const id of k.ecs.query('struttura', 'origin')) {
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
    const s = k.ecs.get(structures[largest], 'struttura');
    expect(s.concetto).toBe('il forno del borgo');
    expect(s.model).toBe('struttura-il-forno-del-borgo');
    const fc = k.ecs.get(structures[largest], 'form') as FormComp;
    expect(fc.model).toBe(s.classe);
    expect(fc.wanted).toBe('struttura-il-forno-del-borgo');
    expect(k.sculpting.missing().some((r) => r.id === 'struttura-il-forno-del-borgo' && r.classe === s.classe)).toBe(true);
    for (const [i, sid] of structures.entries()) if (i !== largest) expect(k.ecs.get(sid, 'struttura').concetto).toMatch(/^una cas/);
  });

  it('puts what goes indoors on the floor of the model, never inside its walls', async () => {
    const k = await boot();
    const ch = k.chunks.get('0,0')!;
    const sid = structuresOf(k, ch.key).find((id) => id !== undefined)!;
    const fc = k.ecs.get(sid, 'form') as FormComp;
    const form = await k.forms.wait(fc.model, fc.seed);
    expect(form?.floor).toBeDefined();
    k.tick(1 / 60);
    const placed: Array<{ x: number; y: number }> = [];
    const fallback = { x: 1e6, y: 1e6 };
    for (let n = 0; n < 4; n++) await (k as any).placeInside(ch, sid, fallback, (x: number, y: number) => placed.push({ x, y }));
    expect(placed).toHaveLength(4);
    for (const p of placed) {
      expect(p).not.toEqual(fallback);
      // On its floor, inside it, where one can stand.
      expect(k.structureAt(p.x, p.y)).toBe(sid);
      expect(k.floorAt(p.x, p.y)).toBeGreaterThan(k.groundAt(p.x, p.y));
      expect(k.free(p.x, p.y, 0.15), `${p.x},${p.y}`).toBe(true);
    }
    // Outside the structure one stands on the ground.
    const far = k.ecs.get(sid, 'pos');
    expect(k.structureAt(far.x + 40, far.y + 40)).toBeUndefined();
    expect(k.floorAt(far.x + 40, far.y + 40)).toBe(k.groundAt(far.x + 40, far.y + 40));
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
    expect(lots[0].struttura).toMatchObject({ concetto: 'la cittadella', classe: 'structure', taglia: 'gargantuan' });
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
