// Space in scales (ADR-0043): the plan's buildings become structures — whole models set on their lots,
// facing their doors — what goes indoors stands on their floors, and the world has one important
// structure per zone.

import { describe, expect, it } from 'vitest';
import { Kernel, IMPORTANT_ZONE, zoneOf } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import type { FormComp } from '../src/kernel/forms';
import type { ChunkPlan } from '../src/kernel/agents/cartography';

/** A kernel whose loaded chunks have all been planned by the Cartographer. */
async function boot() {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
  return k;
}

/** The structures of a planned chunk, by building index. */
const structuresOf = (k: Kernel, key: string) => {
  const out: number[] = [];
  for (const id of k.ecs.query('struttura', 'origin')) {
    const m = new RegExp(`^${key}#s(\\d+)$`).exec(k.ecs.get(id, 'origin').key);
    if (m) out[Number(m[1])] = id;
  }
  return out;
};

describe('lots and structures', () => {
  it('turns every building of the village into a structure on its lot, facing its door', async () => {
    const k = await boot();
    const ch = k.chunks.get('0,0')!;
    const S = k.config.chunkSize;
    expect(ch.buildings.length).toBeGreaterThan(0);
    const structures = structuresOf(k, ch.key);
    for (const [i, b] of ch.buildings.entries()) {
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
    const area = (i: number) => (ch.buildings[i].x1 - ch.buildings[i].x0 + 1) * (ch.buildings[i].y1 - ch.buildings[i].y0 + 1);
    const largest = ch.buildings.map((_, i) => i).sort((a, b) => area(b) - area(a) || a - b)[0];
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

  it('keeps one important structure per zone of the world, and remembers which', async () => {
    const k = await boot();
    const claim = (key: string, cx: number, cy: number, plan: Partial<ChunkPlan>) => (k as any).claimImportant({ key, cx, cy }, plan);
    // Zones are about a thousand tiles wide, centred on the start.
    expect(IMPORTANT_ZONE * k.config.chunkSize).toBeGreaterThanOrEqual(1000);
    expect(zoneOf(0, 0)).toBe(zoneOf(IMPORTANT_ZONE / 2 - 1, -IMPORTANT_ZONE / 2));
    expect(zoneOf(0, 0)).not.toBe(zoneOf(IMPORTANT_ZONE / 2, 0));
    const a = { strutture: [{ concetto: 'il castello', importante: true }, { concetto: 'la torre', importante: true }] };
    claim('5,5', 5, 5, a);
    // One per place: the second is ordinary.
    expect(a.strutture.map((s) => !!s.importante)).toEqual([true, false]);
    // Another place of the same zone may not have one; the place that has it may (planned again).
    const b = { strutture: [{ concetto: 'il tempio', importante: true }] };
    claim('6,5', 6, 5, b);
    expect(b.strutture[0].importante).toBeUndefined();
    expect(k.importantAllowed({ key: '6,5', cx: 6, cy: 5 })).toBe(false);
    expect(k.importantAllowed({ key: '5,5', cx: 5, cy: 5 })).toBe(true);
    // Another zone may.
    const c = { strutture: [{ concetto: 'la piramide', importante: true }] };
    claim(`${IMPORTANT_ZONE},0`, IMPORTANT_ZONE, 0, c);
    expect(c.strutture[0].importante).toBe(true);
    // Saved with the game, and read back.
    expect(k.saveState()).toBe(true);
    const saved = JSON.parse(k.repo.head().files['world/stato.json']!).importanti;
    expect(saved).toEqual({ [zoneOf(5, 5)]: '5,5', [zoneOf(IMPORTANT_ZONE, 0)]: `${IMPORTANT_ZONE},0` });
    (k as any).importanti.clear();
    k.loadState();
    expect(k.importantAllowed({ key: '6,5', cx: 6, cy: 5 })).toBe(false);
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
    expect(k.addModel(own, bundledFiles[`models/${generic}.xml`], { classe: generic, nome: 'il forno del borgo' }, `scultore: ${own}`)).toBe(true);
    expect(fc.model).toBe(own);
    expect(fc.wanted).toBeUndefined();
    expect(fc.seed).toBe(k.forms.seedFor(own, k.ecs.get(sid, 'origin').key));
    expect(k.sculpting.missing().some((r) => r.id === own)).toBe(false);
  }, 30_000);
});
