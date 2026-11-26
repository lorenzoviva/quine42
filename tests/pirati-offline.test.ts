// The offline Genesis of the Pirates (T540): with the local models an archipelago has the seed's pier `i` and reef `y` in its palette, the
// harbour's stamp lays its pier of `i` out to the deep water and its reefs of `y`, the first things have a ship's chest that the plan of a
// place with a seabed sinks (`where: 'underwater'`, the kernel lays it on the bed with `below`) and a rowing boat that moors by a shore;
// every other theme, and the seed, keeps the offline palette and cast it had.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { WORLD_THEMES } from '../src/kernel/themes';
import { pierTouches, stampGround } from '../src/kernel/stamps';
import { crossingOf, terrainPhysics } from '../src/kernel/nature';
import { KEEL, underKeel } from '../src/kernel/vehicle';
import { internalName } from '../src/kernel/internalNames';

const S = 18;

async function genesisOf(theme: string) {
  const ai = new MockAiModels();
  ai.latency = 0;
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
  expect(await k.runGenesis(WORLD_THEMES.find((t) => t.id === theme)!.text)).toBe(true);
  return k;
}

/** Walks the wanderer (the carpet stopped) to the middle of each place until it is planned, a little more for the neighbours in flight. */
async function visit(k: Kernel, places: Array<[number, number]>, each: () => void) {
  k.carpet()!.active = false;
  for (const [cx, cy] of places) {
    const p = k.wandererPos();
    const { ox, oy } = k.offset();
    p.x = cx * S + 9 - ox;
    p.y = cy * S + 9 - oy;
    for (let i = 0; i < 200 && k.chunks.get(`${cx},${cy}`)?.stage !== 'planned'; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 2));
    }
    for (let i = 0; i < 20; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 2));
    }
    each();
  }
}

describe('the offline Genesis of the Pirates (T540)', () => {
  it('has the pier and the reef, harbours whose pier touches the deep water, a chest on the seabed and a boat at its mooring', async () => {
    const k = await genesisOf('pirates');
    expect(k.config.nature.geography).toBe('archipelago');
    expect(k.config.nature.relief).toBe('true');
    // The seed's pier and reef: an outdoor walked floor, and rock just under the water, swum over.
    expect(k.palette.i).toMatchObject({ name: 'molo', layer: 'floor', solid: false, cross: 'walk' });
    expect(k.palette.i.indoor).toBeUndefined();
    expect(k.palette.y).toMatchObject({ name: 'secca', layer: 'liquid', cross: 'swim' });
    expect(crossingOf(k.palette.y)).toBe('swim');
    expect(terrainPhysics(k.palette.y).depth).toBe('reef');
    // The harbour stays among the environments, and its first things are a ship's chest and a rowing boat that is steered.
    expect(Object.keys(JSON.parse(k.files['modules/world.layouts/manifest.json']).layouts)).toContain('harbour');
    const chest = k.catalog().find((c) => /^(cassa|forziere|baule)/i.test(c.name));
    expect(chest?.kind).toBe('furniture');
    // Ids the migration of a plan read again leaves as they are (`obj.cassa` was the seed's chest before T307b, and would become `obj.chest`).
    expect(internalName('moduli-seme', chest!.id)).toBe(chest!.id);
    expect(internalName('moduli-seme', 'obj.barca')).toBe('obj.barca');
    const boat = JSON.parse(k.files['modules/obj.barca/manifest.json']);
    expect(boat.vehicle).toMatchObject({ medium: 'water' });
    expect(boat.appearance.class).toBe('vessel');

    const kk = k as any;
    const deep = stampGround(k.palette).deep;
    const harbours: string[] = [];
    const sunk = new Map<string, { z: number; bed: number; tile: string }>();
    let boats = 0;
    // Enough places for a chest sunk in open water (T510: without the snow, the Pirates' drafts lay their chests elsewhere).
    await visit(k, [[0, 0], [1, 0], [2, 0], [2, 1], [1, -2], [-3, -1], [-3, 0], [3, 1], [2, 2], [-2, -2]], () => {
      for (const ch of k.chunks.values()) {
        if (ch.stage !== 'planned' || ch.plan?.layout !== 'harbour' || harbours.includes(ch.key)) continue;
        const { result } = kk.layoutOf(ch, ch.plan, kk.pathCode(), true);
        const cells = String(ch.tiles).split('');
        const pier = [...result.piers] as number[];
        // The pier is of `i`, and its head touches the deep water; the reefs off it of `y`.
        if (pier.length && pier.every((i) => cells[i] === 'i') && pierTouches(cells, S, S, pier, deep) && cells.includes('y')) harbours.push(ch.key);
      }
      for (const id of k.ecs.query('below')) {
        const m = k.ecs.get(id, 'module');
        if (m?.id !== chest!.id) continue;
        const pos = k.ecs.get(id, 'pos');
        sunk.set(k.ecs.get(id, 'origin')?.key ?? String(id), { z: k.ecs.get(id, 'below').z, bed: k.bedAt(pos.x, pos.y), tile: kk.tileAt(Math.floor(pos.x), Math.floor(pos.y)) });
      }
      boats = Math.max(boats, k.ecs.query('vehicle').length);
    });
    expect(harbours.length).toBeGreaterThanOrEqual(1);
    // A place with a seabed asked the chest underwater, and the kernel laid it on the bed, under the water one swims.
    const asked = [...k.chunks.values()].some((ch) => ch.plan?.objects.some((o) => o.module === chest!.id && o.where === 'underwater'));
    expect(asked).toBe(true);
    expect(sunk.size).toBeGreaterThanOrEqual(1);
    for (const s of sunk.values()) {
      expect(s.z).toBe(s.bed);
      expect(s.z).toBeLessThan(0);
      expect(crossingOf(k.palette[s.tile])).toBe('swim');
    }
    expect(boats).toBeGreaterThanOrEqual(1);

    // The hull goes over the sunken chest, as a swimmer does (T540): over it, the chest stops it no more than if it were not there; the same
    // chest afloat (no height under the surface) stops it.
    const boatId = k.ecs.query('vehicle')[0];
    const spec = kk.vehicleOf(boatId).spec;
    const chests = [...kk.solidForms.values()].flat().filter((s: any) => s.stand !== undefined && k.ecs.get(s.id, 'module')?.id === chest!.id);
    let over = 0;
    for (const s of new Set(chests) as Set<any>) {
      // The chest under the middle of the hull or a little towards its bow or its stern, in a few headings (T510: wherever the draft lays it).
      const poses = [0, Math.PI / 2, Math.PI / 4, (3 * Math.PI) / 4].flatMap((heading) => [0, 0.5, -0.5].map((d) => ({ x: s.x + Math.cos(heading) * d, y: s.y + Math.sin(heading) * d, heading })));
      for (const pose of poses) {
        if (!kk.hullFits(boatId, spec, pose, new Set([boatId, s.id]))) continue;
        // A chest on a bed too shallow reaches above the keel and stops it, as it should (`underKeel`): another pose, or another chest.
        if (!kk.hullFits(boatId, spec, pose, new Set([boatId]))) continue;
        const { stand, ...afloat } = s;
        expect(stand).toBeLessThan(0);
        for (const list of kk.solidForms.values()) for (let i = 0; i < list.length; i++) if (list[i] === s) list[i] = afloat;
        expect(kk.hullFits(boatId, spec, pose, new Set([boatId]))).toBe(false);
        for (const list of kk.solidForms.values()) for (let i = 0; i < list.length; i++) if (list[i] === afloat) list[i] = s;
        over++;
        break;
      }
    }
    expect(over).toBeGreaterThanOrEqual(1);
  }, 120_000);

  it('a thing under the surface passes under the keel, never what reaches above it', () => {
    const boat = { medium: 'water' as const, draught: 'shallow' as const };
    expect(underKeel(boat, -6.25 + 0.6, 0)).toBe(true);
    expect(underKeel(boat, -0.25, 0)).toBe(false);
    expect(underKeel({ ...boat, draught: 'deep' }, -0.75, 0)).toBe(false);
    expect(underKeel({ medium: 'land', draught: 'shallow' }, -0.1, 0)).toBe(true);
    expect(underKeel(boat, Number.NaN, 0)).toBe(false);
    expect(KEEL.deep).toBeGreaterThan(KEEL.shallow);
  });

  it('every other theme keeps the offline palette and the first things it had', async () => {
    const k = await genesisOf('medievale');
    expect(k.palette.i).toBeUndefined();
    expect(k.palette.y).toBeUndefined();
    expect(k.files['modules/obj.barca/manifest.json']).toBeUndefined();
    expect(k.catalog().some((c) => /^(cassa|forziere|baule)/i.test(c.name))).toBe(false);
  }, 60_000);
});
