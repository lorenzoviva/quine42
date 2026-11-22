// The vehicles of the Council (T487, ADR-0244): what looks like a vehicle behaves as one. The words that say a boat, a barge, a cart (the
// head of a name, a wreck and a model are not one), the validator that refuses a forged thing presenting itself as a vehicle without
// `vehicle`, the Forge that writes it (a barge asked for is steered), the repair of the universes made before (the barge of `orichalcum`),
// the catalogue that offers a vehicle only where it can move, and where it comes into a place: afloat with all of its hull, by a shore.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import type { TextCall } from '../src/kernel/ai/models';
import { conceptMedium, vehicleRefusal } from '../src/kernel/agents/forge';
import { carries, VEHICLE_LIMITS, vehicleSpecOf } from '../src/kernel/vehicle';
import { claimedMedium, MEDIUM_DEFAULTS, repairVehicleClaims, vehicleClaimErrors, vehicleFor, vehicleMediumIn, vehicleSpot, worldMedia } from '../src/kernel/vehicleclaim';
import type { FileMap, Manifest } from '../src/kernel/types';

/** The barge of `orichalcum` (T457's run), as the Forge made it then: a thing of the world, a «chiatta», no `vehicle`. */
const BARGE = 'obj.chiatta-a-vapore-della-d';
const bargeManifest = (extra: Record<string, unknown> = {}) => ({
  id: BARGE,
  name: 'Chiatta a vapore della darsena',
  kind: 'entity',
  version: '0.1.0',
  description: 'Una chiatta di lamiera rivettata, bassa sull’acqua, ormeggiata alla passerella.',
  context: 'ormeggiata alle passerelle della darsena',
  tags: ['chiatta', 'vapore', 'canale', 'darsena'],
  origin: 'cartografo',
  logic: 'logic.lua',
  appearance: { glyph: 'C', color: 'hsl(214 65% 68%)', look: 'uno scafo piatto e lungo di lamiera grigia', model: 'obj-chiatta-a-vapore-della-d', class: 'object', taglia: 'large' },
  physics: { solid: true, radius: 0.5, pushable: false, mass: 100, friction: 1, speed: 0 },
  components: { chiatta: { pressione: 0 } },
  spawn: { tiles: ['g'], chance: 0.15, max: 1 },
  actions: [{ id: 'blow-whistle', label: 'Tira il fischio del fumaiolo' }],
  ...extra,
});

const asManifest = (m: Record<string, unknown>) => m as unknown as Manifest;

describe('what looks like a vehicle (T487)', () => {
  it('reads the head of a name, in Italian and in English: a boat, a barge, a cart; not a wreck, a model, a boatman, a mine cart', () => {
    const said = (name: string, tags: string[] = []) => vehicleMediumIn(name, tags);
    expect(said('Chiatta a vapore della darsena')).toBe('water');
    expect(said('Vecchia barca da pesca')).toBe('water');
    expect(said('La zattera di tronchi')).toBe('water');
    expect(said("L'imbarcazione del traghettatore")).toBe('water');
    expect(said('Vecchio carro del fieno')).toBe('land');
    expect(said('Carretto del gelataio')).toBe('land');
    expect(said('Steam barge of the dock')).toBe('water');
    expect(said('Old fishing boat')).toBe('water');
    expect(said('Hay cart')).toBe('land');
    // What only looks like one, and says so; what the kernel cannot make move (rails, air); a word that only begins like one.
    for (const name of ['Relitto della chiatta', 'Chiatta arenata', 'Nave in bottiglia', 'Modellino di galeone', 'Ship in a bottle', 'Wrecked boat', 'Carro rotto', 'Barcaiolo', 'Carrozzeria del borgo', 'Navigatore', 'Carrello del minerale', "Dirigibile all'ormeggio", 'Argano a vapore'])
      expect(said(name), name).toBeUndefined();
    // The tags: one that declares a vehicle, the medium from the others; a tag that says a boat alone does not make a winch one.
    expect(said('La Rondine', ['veicolo', 'barca'])).toBe('water');
    expect(said('Argano a vapore', ['chiatta', 'porto'])).toBeUndefined();
    expect(said('La Rondine', ['veicolo', 'relitto', 'barca'])).toBeUndefined();
    // The void only in a world of the void.
    expect(said('Capsula di salvataggio')).toBeUndefined();
    expect(vehicleMediumIn('Capsula di salvataggio', [], worldMedia('void'))).toBe('void');
    expect(worldMedia(undefined)).toEqual(['water', 'land']);
  });

  it('is a thing of the world: not someone, not an item', () => {
    expect(claimedMedium(asManifest(bargeManifest()))).toBe('water');
    expect(claimedMedium(asManifest({ ...bargeManifest(), persona: 'Sei la chiatta' }))).toBeUndefined();
    expect(claimedMedium(asManifest({ ...bargeManifest(), kind: 'item' }))).toBeUndefined();
  });

  it('gives a vehicle the medium’s numbers, within the kernel’s limits, the draught only on the water', () => {
    expect(vehicleFor('water')).toEqual({ ...MEDIUM_DEFAULTS.water, medium: 'water', draught: 'shallow' });
    expect(vehicleFor('land', { speed: 99, accel: -3, turn: 'x', draught: 'deep' })).toEqual({ medium: 'land', speed: VEHICLE_LIMITS.speed[1], accel: VEHICLE_LIMITS.accel[0], turn: MEDIUM_DEFAULTS.land.turn });
    expect(vehicleFor('water', { draught: 'deep', speed: 4 })).toMatchObject({ draught: 'deep', speed: 4 });
    for (const m of ['water', 'land', 'void'] as const) expect(vehicleSpecOf(vehicleFor(m))).toBeDefined();
  });

  it('the validator refuses a thing that presents itself as a vehicle without one, with the reason; a wreck or a vehicle passes', async () => {
    expect(vehicleClaimErrors(asManifest(bargeManifest()))).toHaveLength(1);
    expect(vehicleClaimErrors(asManifest(bargeManifest()))[0]).toMatch(/si presenta come un mezzo che si guida.*vehicle \{ medium: "water" \}/);
    expect(vehicleClaimErrors(asManifest(bargeManifest({ vehicle: vehicleFor('water') })))).toEqual([]);
    expect(vehicleClaimErrors(asManifest(bargeManifest({ name: 'Relitto della chiatta' })))).toEqual([]);
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const logic = 'local M = {}\nreturn M\n';
    expect(k.validator.validateForged(asManifest(bargeManifest({ id: 'obj.chiatta-prova' })), logic, new Set()).join(' ')).toMatch(/obj\.chiatta-prova.*si presenta come un mezzo/);
    expect(k.validator.validateForged(asManifest(bargeManifest({ id: 'obj.chiatta-prova', vehicle: vehicleFor('water') })), logic, new Set())).toEqual([]);
  }, 60_000);

  it('the Forge says the medium of a concept: the Narrator’s, else its name’s; a name that says a barge said «none» goes back', () => {
    const base = { type: 'object' as const, name: 'Chiatta del canale', tags: [] };
    expect(conceptMedium({ ...base, vehicle: 'water' })).toBe('water');
    expect(conceptMedium({ ...base })).toBe('water');
    expect(conceptMedium({ ...base, name: 'Il Rondone', vehicle: 'water' })).toBe('water');
    expect(conceptMedium({ ...base, vehicle: 'none' })).toBeUndefined();
    expect(conceptMedium({ ...base, type: 'npc' })).toBeUndefined();
    // A capsule in a world without the void is none: there it would never move.
    expect(conceptMedium({ ...base, name: 'Capsula', vehicle: 'void' })).toBeUndefined();
    expect(vehicleRefusal({ ...base, vehicle: 'none' })).toMatch(/Scrivi "vehicle": "water"/);
    expect(vehicleRefusal({ ...base, name: 'Relitto della chiatta', vehicle: 'none' })).toBeUndefined();
    expect(vehicleRefusal({ ...base })).toBeUndefined();
  });
});

describe('where a vehicle comes into a place (T487)', () => {
  // A place of 12: a pool of water 4 × 8 in its middle (columns 4-7, rows 2-9), the ground around it.
  const S = 12;
  const pool = (c: number, r: number) => c >= 4 && c <= 7 && r >= 2 && r <= 9;
  const ground = (water: (c: number, r: number) => boolean) => ({ side: S, carries: water, walks: (c: number, r: number) => !water(c, r) });

  it('stands with its whole box on what carries it, by a shore, the bow along the place; nowhere without water', () => {
    const spot = vehicleSpot(ground(pool), [2.5, 6])!;
    expect(spot).toBeDefined();
    expect(spot.heading).toBe(0);
    // The box with its margin inside the pool.
    expect(spot.x - 1.5).toBeGreaterThanOrEqual(4);
    expect(spot.x + 1.5).toBeLessThanOrEqual(8);
    expect(spot.y - 3.25).toBeGreaterThanOrEqual(2);
    expect(spot.y + 3.25).toBeLessThanOrEqual(10);
    // Too long for the pool across: along it; too large for it: nowhere. Nor where nothing carries it.
    expect(vehicleSpot(ground((_c, r) => r >= 4 && r <= 7), [2.5, 6])!.heading).toBeCloseTo(Math.PI / 2);
    expect(vehicleSpot(ground(pool), [5, 6])).toBeUndefined();
    expect(vehicleSpot(ground(() => false), [1, 1])).toBeUndefined();
    // The nearest to the tile the plan gave it.
    const lake = (c: number, r: number) => c >= 1 && c <= 10 && r >= 1 && r <= 10;
    const nearTop = vehicleSpot(ground(lake), [1, 2], [5, 1])!, nearBottom = vehicleSpot(ground(lake), [1, 2], [5, 10])!;
    expect(nearTop.y).toBeLessThan(nearBottom.y);
  });

  it('prefers where one boards from the ground: in a sea, by its shore', () => {
    // Everything water but a strip of ground on the left: the boat by it, not in the open.
    const sea = (c: number) => c >= 2;
    const spot = vehicleSpot({ side: S, carries: (c) => sea(c), walks: (c) => !sea(c) }, [1, 2], [11, 11])!;
    expect(spot.x).toBeLessThanOrEqual(5);
  });
});

describe('the repair of the universes made before (T487)', () => {
  const files = (extra: FileMap = {}): FileMap => ({
    'universe.json': JSON.stringify({ name: 'prova' }),
    'models/index.json': JSON.stringify({ 'obj-chiatta-a-vapore-della-d': { class: 'object', size: 'large' } }),
    [`modules/${BARGE}/manifest.json`]: JSON.stringify(bargeManifest(), null, 2),
    ...extra,
  });

  it('gives the barge its vehicle from the kernel, keeps its sculpted model, and leaves the rest as it is', () => {
    const hand = { ...bargeManifest(), id: 'obj.barca-a-mano', name: 'Barca a mano', origin: undefined };
    const boatman = { ...bargeManifest(), id: 'npc.barcaiolo', name: 'Barca del barcaiolo', persona: 'Sei il barcaiolo' };
    const wreck = { ...bargeManifest(), id: 'obj.relitto', name: 'Relitto della chiatta' };
    const already = { ...bargeManifest(), id: 'obj.zattera', name: 'Zattera', vehicle: { medium: 'water', speed: 1 } };
    const fresh = { ...bargeManifest(), id: 'obj.barca-nuova', name: 'Barca nuova', appearance: { ...bargeManifest().appearance, model: 'obj-barca-nuova' } };
    const all = files({
      'modules/obj.barca-a-mano/manifest.json': JSON.stringify(hand),
      'modules/npc.barcaiolo/manifest.json': JSON.stringify(boatman),
      'modules/obj.relitto/manifest.json': JSON.stringify(wreck),
      'modules/obj.zattera/manifest.json': JSON.stringify(already),
      'modules/obj.barca-nuova/manifest.json': JSON.stringify(fresh),
    });
    const { changes, repaired } = repairVehicleClaims(all);
    expect(repaired.sort()).toEqual(['obj.barca-nuova', BARGE]);
    const barge = JSON.parse(changes[`modules/${BARGE}/manifest.json`]);
    expect(barge.vehicle).toEqual(vehicleFor('water'));
    expect(barge.appearance.class).toBe('object');
    expect(barge.physics).toMatchObject({ solid: true, pushable: false });
    expect(barge.components).toEqual({ chiatta: { pressione: 0 } });
    // A boat whose model is not sculpted yet takes the vessels' class: the Sculptor makes it float.
    expect(JSON.parse(changes['modules/obj.barca-nuova/manifest.json']).appearance.class).toBe('vessel');
    // Repaired, the files ask nothing more: the repair is done once.
    expect(repairVehicleClaims({ ...all, ...changes }).repaired).toEqual([]);
  });

  it('a universe opened by the kernel is repaired in a commit of its own, and its barge is a vehicle', async () => {
    const k = await Kernel.boot({ files: { ...bundledFiles, [`modules/${BARGE}/manifest.json`]: JSON.stringify(bargeManifest(), null, 2), [`modules/${BARGE}/logic.lua`]: 'local M = {}\nreturn M\n' }, store: memoryStore(), ai: new MockAiModels() });
    expect(k.modules.get(BARGE)?.manifest.vehicle).toMatchObject({ medium: 'water' });
    expect(k.repo.log().some((c) => c.message.startsWith('riparazione: si guidano') && c.message.includes(BARGE))).toBe(true);
    expect(JSON.parse(k.repo.working[`modules/${BARGE}/manifest.json`]).vehicle.medium).toBe('water');
    // The catalogue of a place with water offers it, as a vehicle; a dry one, and the general one, do not.
    const S = k.config.chunkSize;
    expect(k.catalogFor({ cx: 7, cy: 7, draft: 'o'.repeat(S * S) }).find((c) => c.id === BARGE)?.kind).toBe('vehicle');
    expect(k.catalogFor({ cx: 7, cy: 7, draft: 'g'.repeat(S * S) }).map((c) => c.id)).not.toContain(BARGE);
    expect(k.catalog().map((c) => c.id)).not.toContain(BARGE);
    // Nor the seed's capsule, which the landings have, nor a vehicle written by hand.
    expect(k.catalogFor({ cx: 7, cy: 7, draft: 'o'.repeat(S * S) }).map((c) => c.id)).not.toContain('vehicle.capsule');
    const hand = await Kernel.boot({ files: { ...bundledFiles, 'modules/obj.barca-a-mano/manifest.json': JSON.stringify({ ...bargeManifest(), id: 'obj.barca-a-mano', origin: undefined, vehicle: vehicleFor('water') }) }, store: memoryStore(), ai: new MockAiModels() });
    expect(hand.catalogFor({ cx: 7, cy: 7, draft: 'o'.repeat(S * S) }).map((c) => c.id)).not.toContain('obj.barca-a-mano');
  }, 60_000);

  it('a plan keeps one vehicle a place', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const plan = { place: { name: 'Darsena', description: 'Una darsena.' }, layout: Object.keys(k.content.layouts)[0], objects: [{ module: 'a', where: 'outside' as const }, { module: 'a', where: 'outside' as const }, { module: 'b', where: 'inside' as const }], ground: [], fresh: [], runes: [] };
    const v = k.validator.validatePlan(plan, new Set([plan.layout]), new Set(['a', 'b']), new Set(['a']));
    expect(v.plan.objects.map((o) => o.module)).toEqual(['a', 'b']);
    expect(v.dropped.join(' ')).toMatch(/un veicolo per luogo/);
  }, 60_000);
});

/** A Narrator who says the barge is not ridden (`none`), or says nothing of it (`null`), the first `forgets` times. */
class Forgetful extends MockAiModels {
  concepts = 0;
  constructor(private forgets: number, private said: string | null = 'none') {
    super();
  }
  override async text(call: TextCall): Promise<string> {
    const out = await super.text(call);
    if (call.task !== 'forge.concept') return out;
    const c = JSON.parse(out);
    if (this.concepts++ < this.forgets) {
      if (this.said === null) delete c.vehicle;
      else c.vehicle = this.said;
    }
    return JSON.stringify(c);
  }
}

async function bootWith(ai: MockAiModels) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  return k;
}

describe('a barge asked of the Forge is steered (T487)', () => {
  it('the Forge writes the vehicle: medium, the Physicist’s numbers, the vessels’ class; the summary says it', async () => {
    const k = await bootWith(new MockAiModels());
    const r = await k.forgeModule('una chiatta per attraversare il canale', 'agente', 'object');
    expect(r.ok).toBe(true);
    const m = k.modules.get(r.id!)!.manifest;
    expect(m.vehicle).toEqual({ medium: 'water', speed: 2.5, accel: 1, turn: 0.7, draught: 'shallow' });
    expect(m.appearance?.class).toBe('vessel');
    expect(m.physics).toMatchObject({ solid: true, pushable: false });
    expect(m.takeable).toBeUndefined();
    expect(r.summary).toMatch(/Nuovo mezzo «Chiatta».*si guida \(sull'acqua\)/);
    // Not a ride: a thing like before.
    const s = await k.forgeModule('una panca di legno', 'agente', 'object');
    expect(k.modules.get(s.id!)!.manifest.vehicle).toBeUndefined();
  }, 60_000);

  it('a Narrator who forgets the medium: the kernel’s word; one who says none: back to them once, then refused', async () => {
    const quiet = await bootWith(new Forgetful(9, null));
    const a = await quiet.forgeModule('una chiatta per il canale', 'agente', 'object');
    expect(quiet.modules.get(a.id!)!.manifest.vehicle?.medium).toBe('water');
    const once = new Forgetful(1);
    const k = await bootWith(once);
    const b = await k.forgeModule('una chiatta per il canale', 'agente', 'object');
    expect(b.ok).toBe(true);
    expect(once.concepts).toBe(2);
    expect(k.modules.get(b.id!)!.manifest.vehicle?.medium).toBe('water');
    expect(k.council.feed.some((e) => e.from === 'kernel' && e.to === 'narrator' && /si presenta come un mezzo che si guida/.test(e.text))).toBe(true);
    const stubborn = await bootWith(new Forgetful(9));
    const c = await stubborn.forgeModule('una chiatta per il canale', 'agente', 'object');
    expect(c.ok).toBe(false);
    expect(c.summary).toMatch(/si presenta come un mezzo/);
  }, 60_000);

  it('comes into a place afloat by the shore, and whoever boards it takes the helm and moves it', async () => {
    const k = await bootWith(new MockAiModels());
    const r = await k.forgeModule('una chiatta per attraversare il canale', 'agente', 'object');
    const m = k.modules.get(r.id!)!;
    k.carpet()!.active = false;
    // A pool of deep water in the first place, 9 × 12 tiles, ringed by ground; everything else taken away.
    const c = k.wandererCarpet();
    const x0 = Math.floor(c.x) + 2, y0 = Math.floor(c.y) + 2;
    const S = k.config.chunkSize;
    const ch = k.chunks.get('0,0')!;
    const ground = Object.keys(k.palette).find((t) => t !== '?' && !k.palette[t].solid && (k.palette[t].layer ?? 'ground') === 'ground')!;
    for (let row = 0; row < S; row++) for (let col = 0; col < S; col++) k.setTile(col, row, ground);
    for (let row = 0; row <= 13; row++) for (let col = 0; col <= 10; col++) if (row >= 1 && row <= 12 && col >= 1 && col <= 9) expect(k.setTile(x0 + col, y0 + row, 'o')).toBe(true);
    for (const id of k.ecs.query('pos')) if (id !== k.wandererEntity && !k.ecs.has(id, 'player')) k.ecs.destroy(id);
    const spec = vehicleSpecOf(m.manifest.vehicle)!;
    const id = (k as unknown as { placeVehicle(ch: unknown, m: unknown, s: unknown, o: string): number | undefined }).placeVehicle(ch, m, spec, 'prova#o0');
    expect(id).toBeDefined();
    // Afloat: every tile under its box carries it; of no place, kept by the save.
    const p = k.ecs.get(id!, 'pos');
    expect(carries(spec, k.palette[k.tileAt(Math.floor(p.x), Math.floor(p.y))!])).toBe(true);
    expect(k.ecs.has(id!, 'chunk')).toBe(false);
    // At its berth: of its place until someone moves it, not consumed (the place makes it again), not saved.
    const inner = k as unknown as { berths: Map<number, unknown>; consumed: Set<string>; vehiclesToSave(): Array<{ origin: string }> };
    expect(inner.berths.has(id!)).toBe(true);
    expect(inner.consumed.has('prova#o0')).toBe(false);
    expect(inner.vehiclesToSave().map((r) => r.origin)).not.toContain('prova#o0');
    const fc = k.ecs.get(id!, 'form');
    await k.forms.wait(fc.model, fc.seed, fc.tint);
    k.tick(1 / 60);
    // From the shore beside it: «Sali a bordo», then the helm, then ahead.
    const { ox, oy } = k.offset();
    const w = k.wandererPos();
    delete w.z;
    Object.assign(w, { x: x0 - ox + 0.5, y: p.y - oy });
    k.tick(1 / 60);
    for (let i = 0; i < 8 && !k.actionsFor(id!).some((o) => o.id === 'board'); i++) {
      w.x += 0.5;
      k.tick(1 / 60);
    }
    expect(k.actionsFor(id!).map((o) => o.id)).toContain('board');
    await k.perform(id!, 'board');
    expect(k.aboard()).toBe(id);
    await k.perform(id!, 'helm');
    expect(k.atHelm()).toBe(id);
    const y = k.ecs.get(id!, 'pos').y, x = k.ecs.get(id!, 'pos').x;
    k.input.setHeld('up', true);
    for (let i = 0; i < 60; i++) k.tick(1 / 60);
    k.input.setHeld('up', false);
    const q = k.ecs.get(id!, 'pos');
    expect(Math.hypot(q.x - x, q.y - y)).toBeGreaterThan(0.3);
    expect(k.aboard()).toBe(id);
    // Moved: of no place, its origin consumed, the save keeps it.
    expect(inner.berths.has(id!)).toBe(false);
    expect(inner.consumed.has('prova#o0')).toBe(true);
    expect(inner.vehiclesToSave().map((r) => r.origin)).toContain('prova#o0');
  }, 90_000);

  it('at its berth it goes with its place and comes back with it; never in a place without water, nor twice', async () => {
    const k = await bootWith(new MockAiModels());
    const r = await k.forgeModule('una chiatta per attraversare il canale', 'agente', 'object');
    const m = k.modules.get(r.id!)!;
    const spec = vehicleSpecOf(m.manifest.vehicle)!;
    const inner = k as unknown as { placeVehicle(ch: unknown, m: unknown, s: unknown, o: string): number | undefined; unloadChunk(ch: unknown): void; berths: Map<number, unknown> };
    const S = k.config.chunkSize;
    const ch = k.chunks.get('0,0')!;
    const ground = Object.keys(k.palette).find((t) => t !== '?' && !k.palette[t].solid && (k.palette[t].layer ?? 'ground') === 'ground')!;
    for (let row = 0; row < S; row++) for (let col = 0; col < S; col++) k.setTile(col, row, ground);
    expect(inner.placeVehicle(ch, m, spec, 'secco#o0')).toBeUndefined();
    for (let row = 2; row < 14; row++) for (let col = 2; col < 10; col++) k.setTile(col, row, 'o');
    const id = inner.placeVehicle(ch, m, spec, 'darsena#o0')!;
    expect(id).toBeDefined();
    expect(inner.placeVehicle(ch, m, spec, 'darsena#o0')).toBeUndefined();
    inner.unloadChunk(ch);
    expect(k.ecs.alive.has(id)).toBe(false);
    expect(inner.berths.size).toBe(0);
  }, 90_000);
});
