// The vehicle, alone (T439, ADR-0227): a primitive of the kernel. A boat of the tests (`fixtures/barca-prova.xml`: a hull under its waterline, a
// deck a step over the water, a low rail, a mast) floats in a pool; who stands on its deck does not swim and goes and turns with it; who
// holds the helm steers with the keys that walk and does not walk; the shore stops it; the anchor holds it; nobody aboard, it anchors; the
// save keeps it of no place. The pure functions first: the limits, the step, the frame of the deck, the save read without trusting it.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { toLocal, waterlineOf } from '../src/kernel/forms';
import { carried, carries, facingOf, helmOrders, hullPoints, MAX_VEHICLES, newVehicle, readVehicles, saneVehicle, toWorld, VEHICLE_LIMITS, vehicleSpecErrors, vehicleSpecOf, vehicleStep } from '../src/kernel/vehicle';
import { HELM_VIEW, ZOOM, pinchDistance, zoomDistance } from '../src/render/camera';
import type { Action } from '../src/kernel/input';
import type { FileMap, TerrainDef } from '../src/kernel/types';

const BOAT_XML = readFileSync(new URL('./fixtures/barca-prova.xml', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const BOAT = 'veicolo.prova';

describe('the vehicle, as data (T439)', () => {
  it('reads a manifest within the kernel limits, and the validator says what is wrong', () => {
    expect(vehicleSpecOf({ medium: 'water' })).toEqual({ medium: 'water', speed: 3, accel: 1.5, turn: 0.8, draught: 'shallow' });
    expect(vehicleSpecOf({ medium: 'land', speed: 99, accel: -1, turn: Number.NaN })).toEqual({ medium: 'land', speed: VEHICLE_LIMITS.speed[1], accel: VEHICLE_LIMITS.accel[0], turn: 0.8, draught: 'shallow' });
    // What the kernel cannot do is not said: the void is not a terrain yet (T445).
    expect(vehicleSpecOf({ medium: 'void' })).toBeUndefined();
    expect(vehicleSpecOf('water')).toBeUndefined();
    expect(vehicleSpecErrors({ medium: 'water', speed: 3, draught: 'deep' })).toEqual([]);
    expect(vehicleSpecErrors({ medium: 'void' })).toHaveLength(1);
    expect(vehicleSpecErrors({ medium: 'water', speed: 20 })).toHaveLength(1);
    expect(vehicleSpecErrors({ medium: 'land', draught: 'deep' })).toHaveLength(1);
    expect(vehicleSpecErrors([])).toHaveLength(1);
  });

  it('floats a hull on the water one swims (a deep one only on the deep), rolls a cart on what one walks', () => {
    const w: TerrainDef = { name: 'acqua', color: '#33f', solid: true, layer: 'liquid', cross: 'swim', depth: 'shallow' };
    const o: TerrainDef = { ...w, depth: 'deep' };
    const lava: TerrainDef = { name: 'lava', color: '#f30', solid: true, layer: 'liquid' };
    const g: TerrainDef = { name: 'erba', color: '#3f3', solid: false };
    expect([carries({ medium: 'water', draught: 'shallow' }, w), carries({ medium: 'water', draught: 'shallow' }, o)]).toEqual([true, true]);
    expect([carries({ medium: 'water', draught: 'deep' }, w), carries({ medium: 'water', draught: 'deep' }, o)]).toEqual([false, true]);
    expect([carries({ medium: 'water', draught: 'shallow' }, lava), carries({ medium: 'water', draught: 'shallow' }, g), carries({ medium: 'land', draught: 'shallow' }, g), carries({ medium: 'land', draught: 'shallow' }, w)]).toEqual([false, false, true, false]);
    expect(carries({ medium: 'water', draught: 'shallow' }, undefined)).toBe(false);
  });

  it('gathers way within its acceleration, makes half astern, turns a little at rest; the anchor stops it', () => {
    const spec = vehicleSpecOf({ medium: 'water', speed: 4, accel: 2, turn: 1 })!;
    const v = { ...newVehicle(Math.PI / 2), anchored: false, thrust: 1 };
    let s = vehicleStep(v, spec, 0.5);
    expect(s.speed).toBeCloseTo(1);
    expect(s.dx).toBeCloseTo(0.5);
    expect(Math.abs(s.dy)).toBeLessThan(1e-9);
    for (let i = 0; i < 20; i++) Object.assign(v, (s = vehicleStep(v, spec, 0.5)));
    expect(v.speed).toBeCloseTo(4);
    // At rest a third of its turn, and the left key turns the bow to its left: the heading grows.
    expect(vehicleStep({ ...newVehicle(0), anchored: false, steer: 1 }, spec, 1).dyaw).toBeCloseTo(0.35);
    expect(vehicleStep({ ...newVehicle(0), anchored: false, thrust: -1, speed: -2 }, spec, 1).speed).toBeCloseTo(-2);
    // At anchor: no turn, and the way goes three times as fast as it came.
    const held = vehicleStep({ ...v, anchored: true, steer: 1 }, spec, 0.5);
    expect([held.speed, held.dyaw]).toEqual([1, 0]);
    expect(helmOrders((a) => a === 'up' || a === 'left')).toEqual({ thrust: 1, steer: 1 });
    expect(facingOf(Math.PI / 2)).toBe('right');
    expect(facingOf(Math.PI)).toBe('up');
  });

  it('keeps its state sane, and the frame of its deck is the frame of its form', () => {
    const spec = vehicleSpecOf({ medium: 'water' })!;
    const raw: Record<string, unknown> = { heading: Number.NaN, speed: 1e9, thrust: 'x', power: 7, anchored: 'no', helm: 3, bumped: 1 };
    expect(saneVehicle(raw, spec)).toEqual({ heading: 0, speed: 3, turn: 0, thrust: 0, steer: 0, power: 1, anchored: true });
    // `toWorld` undoes `toLocal`, and a point carried keeps its place on the deck.
    const [lx, lz] = toLocal(0.3, -1.2, 1.1);
    const [wx, wy] = toWorld(lx, lz, 1.1);
    expect([wx, wy].map((n) => Math.round(n * 1e9) / 1e9)).toEqual([0.3, -1.2]);
    const from = { x: 10, y: 5, heading: 0.4 }, to = { x: 11, y: 7, heading: 1.3 };
    const [cx, cy] = carried(10.5, 6, from, to);
    const before = toLocal(10.5 - from.x, 6 - from.y, from.heading), after = toLocal(cx - to.x, cy - to.y, to.heading);
    expect(after[0]).toBeCloseTo(before[0]);
    expect(after[1]).toBeCloseTo(before[1]);
  });

  it('samples a hull every quarter of a tile with its edges, and reads a save without trusting it', () => {
    const cols = new Uint8Array(20 * 40).fill(1);
    const pts = hullPoints(cols, 20, 40, 20);
    const xs = [], ys = [];
    for (let i = 0; i < pts.length; i += 2) xs.push(pts[i]), ys.push(pts[i + 1]);
    [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)].forEach((v, i) => expect(v).toBeCloseTo([-0.475, 0.475, -0.975, 0.975][i]));
    const list = [{ module: 'a', origin: 'o1', x: 1, y: 2, heading: 7, anchored: false }, { module: 'a', origin: 'o1', x: 1, y: 2 }, { module: 1, origin: 'o2', x: 1, y: 2 }, { module: 'a', origin: 'o3', x: Number.NaN, y: 2 }, 'nonsense'];
    expect(readVehicles(list)).toEqual([{ module: 'a', origin: 'o1', x: 1, y: 2, heading: 7 % (2 * Math.PI), anchored: false }]);
    expect(readVehicles(Array.from({ length: 100 }, (_, i) => ({ module: 'a', origin: `o${i}`, x: i, y: 0 })))).toHaveLength(MAX_VEHICLES);
    expect(readVehicles({})).toEqual([]);
  });

  it('reads the waterline of a hull from the root of its program', () => {
    expect(waterlineOf(BOAT_XML)).toBe(6);
    expect(waterlineOf('<sequence values="BA" waterline="0"/>')).toBe(0);
    expect(waterlineOf('<sequence values="BA" waterline="400"/>')).toBe(0);
    expect(waterlineOf('<sequence values="BA"><box waterline="3"/></sequence>')).toBe(0);
  });

  it('lets the camera go further at the helm, never past its limit', () => {
    expect(zoomDistance(15, 1.12, false)).toBe(ZOOM.max);
    expect(zoomDistance(28, 1.12, false, true)).toBe(ZOOM.helm);
    expect(zoomDistance(28, 1.12, true, true)).toBeCloseTo(31.36);
    expect(pinchDistance(20, 100, 50, false, true)).toBe(ZOOM.helm);
    expect(HELM_VIEW).toBeGreaterThan(ZOOM.max);
    expect(HELM_VIEW).toBeLessThan(ZOOM.helm);
  });
});

/** The seed with the boat of the tests: its program, its entry, its module. */
function withBoat(): FileMap {
  const index = JSON.parse(bundledFiles['models/index.json']);
  index['barca-prova'] = { class: 'object', name: 'Barca di prova' };
  const manifest = {
    id: BOAT,
    name: 'Barca',
    kind: 'entity',
    description: 'Una barca a vela per le prove.',
    appearance: { glyph: 'B', color: '#8a5a2b', model: 'barca-prova', class: 'object' },
    physics: { solid: true, radius: 0.5 },
    vehicle: { medium: 'water', speed: 3, accel: 2, turn: 1 },
  };
  return { ...bundledFiles, 'models/index.json': JSON.stringify(index, null, 1), 'models/barca-prova.xml': BOAT_XML, [`modules/${BOAT}/manifest.json`]: JSON.stringify(manifest, null, 1) };
}

/** What the menu of a vehicle offers of its own (T439). */
const menuOf = (k: Kernel, id: number) => k.actionsFor(id).map((o) => o.id).filter((o) => ['helm', 'unhelm', 'anchor', 'weigh'].includes(o));

async function boot(files: FileMap) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  return k;
}

/**
 * A pool of deep water 11 × 7 tiles ringed by ground, in the first place, everything else taken away; the boat in its middle,
 * its bow toward the east (+x), its form ready; the wanderer on its deck, behind the mast.
 */
async function harbour(files = withBoat()) {
  const k = await boot(files);
  k.carpet()!.active = false;
  const c = k.wandererCarpet();
  // Inside the first place (the wanderer starts at its corner, 0, 0): the only one planned so soon.
  const x0 = Math.floor(c.x) + 3, y0 = Math.floor(c.y) + 4;
  const ground = Object.keys(k.palette).find((t) => t !== '?' && !k.palette[t].solid && (k.palette[t].layer ?? 'ground') === 'ground')!;
  for (let r = 0; r <= 8; r++) for (let col = 0; col <= 12; col++) expect(k.setTile(x0 + col, y0 + r, r >= 1 && r <= 7 && col >= 1 && col <= 11 ? 'o' : ground)).toBe(true);
  for (const id of k.ecs.query('pos')) {
    const p = k.ecs.get(id, 'pos');
    if (id !== k.wandererEntity && Math.abs(p.x - (x0 + 6.5)) < 14 && Math.abs(p.y - (y0 + 4.5)) < 12) k.ecs.destroy(id);
  }
  const boat = k.spawnModuleEntity(k.modules.get(BOAT)!, x0 + 6.5, y0 + 4.5);
  k.ecs.get(boat, 'vehicle').heading = Math.PI / 2;
  const fc = k.ecs.get(boat, 'form');
  fc.yaw = Math.PI / 2;
  await k.forms.wait(fc.model, fc.seed, fc.tint);
  k.tick(1 / 60);
  const board = (lx: number, lz: number) => {
    const b = k.ecs.get(boat, 'pos');
    const [wx, wy] = toWorld(lx, lz, k.ecs.get(boat, 'vehicle').heading);
    const { ox, oy } = k.offset();
    const p = k.wandererPos();
    delete p.z;
    Object.assign(p, { x: b.x + wx - ox, y: b.y + wy - oy });
    k.tick(1 / 60);
  };
  board(0, -0.75);
  const hold = (keys: Action[], s: number) => {
    for (const key of keys) k.input.setHeld(key, true);
    for (let i = 0; i < s * 60; i++) k.tick(1 / 60);
    for (const key of keys) k.input.setHeld(key, false);
  };
  /** Where the wanderer stands in the boat's own frame. */
  const onDeck = () => {
    const b = k.ecs.get(boat, 'pos'), w = k.wandererCarpet();
    return toLocal(w.x - b.x, w.y - b.y, k.ecs.get(boat, 'vehicle').heading);
  };
  const said: string[] = [];
  k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
  return { k, boat, x0, y0, board, hold, onDeck, said };
}

describe('the vehicle in the kernel (T439)', () => {
  it('floats on its waterline; who stands on its deck is aboard and does not swim, even too loaded for the deep water', async () => {
    const { k, boat } = await harbour();
    // Not a thing a place puts on its ground: the Cartographer's catalogue does not offer it.
    expect(k.catalog().map((c) => c.id)).not.toContain(BOAT);
    expect(k.catalog().length).toBeGreaterThan(0);
    const f = k.forms.ready(k.ecs.get(boat, 'form').model, k.ecs.get(boat, 'form').seed)!;
    expect(f.base).toBe(6);
    expect(k.sunk(boat)).toBeCloseTo(0.3);
    const b = k.ecs.get(boat, 'pos');
    // The deck: three voxels over the water's surface.
    expect(k.wandererPos().z).toBeCloseTo(k.groundAt(b.x, b.y) + 0.15);
    expect(k.aboard()).toBe(boat);
    expect(k.swimming()).toBe(false);
    expect(menuOf(k, boat)).toEqual(['helm', 'weigh']);
    // Too loaded for the deep water, the deck still carries them: they walk on it.
    k.inventory().slots[0] = { item: 'thing:object.well', count: 1 };
    const x = k.wandererCarpet().x;
    k.input.setHeld('left', true);
    for (let i = 0; i < 10; i++) k.tick(1 / 60);
    k.input.setHeld('left', false);
    expect(k.wandererCarpet().x).toBeLessThan(x - 0.2);
    expect(k.aboard()).toBe(boat);
  }, 60_000);

  it('steers from the helm: the keys push and turn it, who is aboard goes and turns with it and does not walk', async () => {
    const { k, boat, hold, onDeck, said } = await harbour();
    await k.perform(boat, 'helm');
    expect(k.atHelm()).toBe(boat);
    expect(k.ecs.get(boat, 'vehicle').anchored).toBe(false);
    expect(said).toContain('Prendi il timone.');
    const x0 = k.ecs.get(boat, 'pos').x, deck0 = onDeck();
    hold(['up'], 1);
    const moved = k.ecs.get(boat, 'pos').x - x0;
    expect(moved).toBeGreaterThan(0.5);
    // Carried, not walked: the same place of the deck.
    expect(onDeck()[0]).toBeCloseTo(deck0[0], 4);
    expect(onDeck()[1]).toBeCloseTo(deck0[1], 4);
    expect(k.wandererComp().facing).toBe('right');
    // Turning: the heading changes, the wanderer turns with the deck.
    const h0 = k.ecs.get(boat, 'vehicle').heading;
    hold(['left'], 1);
    expect(k.ecs.get(boat, 'vehicle').heading).toBeGreaterThan(h0 + 0.2);
    expect(k.ecs.get(boat, 'form').yaw).toBe(k.ecs.get(boat, 'vehicle').heading);
    expect(onDeck()[0]).toBeCloseTo(deck0[0], 4);
    expect(onDeck()[1]).toBeCloseTo(deck0[1], 4);
    expect(k.aboard()).toBe(boat);
    // At the helm Space does not jump; E and Space open the vehicle's menu.
    expect(k.jump()).toBe(false);
    expect(menuOf(k, boat)).toEqual(['unhelm', 'anchor']);
  }, 60_000);

  it('stops at the shore, said once, without breaking; it turns away and goes on', async () => {
    const { k, boat, x0, hold, said } = await harbour();
    await k.perform(boat, 'helm');
    hold(['up'], 6);
    const v = k.ecs.get(boat, 'vehicle');
    const b = k.ecs.get(boat, 'pos');
    expect(v.bumped).toBe(true);
    expect(v.speed).toBe(0);
    // The bow (its last column, 1.775 tiles ahead of its middle) at the ground's edge, not over it.
    expect(b.x + 1.775).toBeLessThanOrEqual(x0 + 12);
    expect(b.x + 1.775).toBeGreaterThan(x0 + 11.9);
    expect(said.filter((s) => s === 'Lo scafo urta e si ferma.')).toHaveLength(1);
    expect(k.aboard()).toBe(boat);
    // Astern it comes off the shore.
    const stuck = b.x;
    hold(['down'], 1);
    expect(k.ecs.get(boat, 'pos').x).toBeLessThan(stuck - 0.2);
    expect(k.ecs.get(boat, 'vehicle').bumped).toBeUndefined();
  }, 60_000);

  it('holds at anchor; let go, the helm is nobody’s and who held it walks again; nobody aboard, it anchors by itself', async () => {
    const { k, boat, hold, board } = await harbour();
    await k.perform(boat, 'helm');
    hold(['up'], 0.5);
    await k.perform(boat, 'anchor');
    expect(k.ecs.get(boat, 'vehicle').anchored).toBe(true);
    hold([], 0.5);
    const x = k.ecs.get(boat, 'pos').x;
    hold(['up'], 1);
    expect(k.ecs.get(boat, 'pos').x).toBe(x);
    await k.perform(boat, 'unhelm');
    expect(k.atHelm()).toBeUndefined();
    const w = k.wandererCarpet().y;
    hold(['down'], 0.2);
    expect(k.wandererCarpet().y).toBeGreaterThan(w + 0.1);
    // Taken again and weighed, then the wanderer off the deck: the helm is let go and the anchor comes down.
    board(0, -0.75);
    await k.perform(boat, 'helm');
    expect(k.ecs.get(boat, 'vehicle').anchored).toBe(false);
    board(0, -4);
    k.tick(1 / 60);
    expect(k.ecs.get(boat, 'vehicle').helm).toBeUndefined();
    expect(k.ecs.get(boat, 'vehicle').anchored).toBe(true);
    expect(k.aboard()).toBeUndefined();
  }, 60_000);

  it('is of no place: the save keeps it where it is and how it heads, and it comes back there', async () => {
    const { k, boat, hold } = await harbour();
    await k.perform(boat, 'helm');
    hold(['up', 'left'], 1.5);
    const { x, y } = k.ecs.get(boat, 'pos');
    const heading = k.ecs.get(boat, 'vehicle').heading;
    const origin = k.ecs.get(boat, 'origin').key;
    expect(k.ecs.has(boat, 'chunk')).toBe(false);
    k.saveState();
    const saved = JSON.parse(k.repo.working['world/state.json']);
    expect(saved.vehicles).toEqual([{ module: BOAT, origin, x: expect.closeTo(x, 3), y: expect.closeTo(y, 3), heading: expect.closeTo(heading, 3), anchored: false }]);
    expect(saved.consumed).toContain(origin);
    const again = await Kernel.boot({ files: { ...k.repo.working }, store: memoryStore(), ai: new MockAiModels() });
    const back = again.ecs.query('vehicle');
    expect(back).toHaveLength(1);
    expect(again.ecs.get(back[0], 'pos').x).toBeCloseTo(x, 3);
    expect(again.ecs.get(back[0], 'vehicle').heading).toBeCloseTo(heading, 3);
    expect(again.ecs.get(back[0], 'form').yaw).toBeCloseTo(heading, 3);
    expect(again.ecs.get(back[0], 'vehicle').helm).toBeUndefined();
    // A module gone: the record waits in the save, nothing comes into the world.
    const files = { ...k.repo.working };
    delete files[`modules/${BOAT}/manifest.json`];
    const without = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    expect(without.ecs.query('vehicle')).toHaveLength(0);
    without.saveState();
    expect(JSON.parse(without.repo.working['world/state.json']).vehicles).toHaveLength(1);
  }, 60_000);
});
