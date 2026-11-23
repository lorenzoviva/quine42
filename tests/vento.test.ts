// The wind (T484, A2 of T459, ADR-0255): the resolution D3 asks (the finest the fixed load holds beside the water at two cells a tile side),
// the step cut in the ticks between two and the same field byte for byte, the prevailing wind from the world's time, the coarse view to
// the clients (read without trusting it), the sail that reads it, `world.wind` for Lua, the fire that goes downwind, and in a game of many
// the view on the wire at most twice a second.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AutomataEngine,
  DEFAULT_CELL,
  LOAD_BUDGET_MS,
  PREVAILING,
  prevailingAt,
  totalLoadMs,
  validateAutomaton,
  WIND_LIMITS,
  WindField,
  type AutomataWorld,
  type AutomatonSpec,
} from '../src/kernel/automata';
import {
  fromBase64,
  readWindView,
  relativeWind,
  sailPolar,
  sailPush,
  toBase64,
  viewBytes,
  viewCorner,
  WIND_MAX,
  WIND_VIEW,
  windHere,
  windInView,
  windSpecOf,
  windViewOf,
} from '../src/kernel/wind';
import { saysSail, SAIL, vehicleFor } from '../src/kernel/vehicleclaim';
import { vehicleSpecErrors, vehicleSpecOf, vehicleStep, newVehicle } from '../src/kernel/vehicle';
import { bundledFiles } from '../src/kernel/bundle';
import { DEFAULT_NATURE } from '../src/kernel/nature';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { apiErrors, LUA_API } from '../src/kernel/validator';
import { toWorld } from '../src/kernel/vehicle';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import type { FileMap } from '../src/kernel/types';

const DT = 1 / 60;

const bytesOf = (a: ArrayBufferView) => Buffer.from(a.buffer, a.byteOffset, a.byteLength);

function world(days = 0, seed = 7): AutomataWorld & { t: number } {
  const w = {
    seed,
    chunkSize: 18,
    t: days,
    loadedChunks: () => [[0, 0], [1, 0], [0, 1], [1, 1]] as Array<[number, number]>,
    tileAt: () => 'g',
    groundAt: (c: number, r: number) => (Math.hypot(c - 20, r - 16) < 4 ? 9 : 1),
    seaLevel: () => 0,
    days: () => w.t,
  };
  return w;
}

describe('the resolution of the wind (D3, T484)', () => {
  it('one cell a tile is the finest the fixed load holds beside the water at two cells a tile side, with smoke and fire too', () => {
    expect(DEFAULT_CELL.wind).toBe(1);
    const water: AutomatonSpec = { id: 'water', family: 'flow', cell: 0.5, hz: 60 };
    const at = (cell: 0.5 | 1 | 2 | 3) => totalLoadMs([water, { id: 'wind', family: 'wind', cell, hz: 10 }]);
    expect(at(1)).toBeLessThanOrEqual(LOAD_BUDGET_MS);
    expect(at(0.5)).toBeGreaterThan(LOAD_BUDGET_MS);
    expect(at(1)).toBeGreaterThan(at(2));
    const all: AutomatonSpec[] = [
      water,
      { id: 'wind', family: 'wind' },
      { id: 'smoke', family: 'diffuse', advect: 'wind' },
      { id: 'fire', family: 'table', states: 3, counted: 1, rules: [{ from: 0, min: 1, max: 8, to: 1, p: 0.2 }] },
    ];
    expect(totalLoadMs(all)).toBeLessThanOrEqual(LOAD_BUDGET_MS);
    // The wind at the default is valid beside the water; at two cells a tile side the validator still refuses it.
    expect(validateAutomaton({ id: 'wind', family: 'wind' }, { existing: [water] }).ok).toBe(true);
    expect(validateAutomaton({ id: 'wind', family: 'wind', cell: 0.5 }).ok).toBe(false);
  });

  it('a step cut in any pieces is the whole step byte for byte, and the engine spreads it over the ticks between two', () => {
    const make = () => {
      const f = new WindField(0, 0, 30, 20, 1, { tau: 0.6, prevailing: [0.07, -0.02] });
      for (let y = 6; y < 12; y++) f.solid[y * 30 + 14] = 1;
      return f;
    };
    const whole = make(), cut = make();
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) % 37) + 1;
    for (let s = 0; s < 25; s++) {
      whole.step();
      while (!cut.work(rnd()));
      expect(bytesOf(cut.f).equals(bytesOf(whole.f))).toBe(true);
    }
    expect(cut.done).toBe(0);

    // The engine: every tick a share of the step, whole in the tick its accumulator says; the same field as whole steps would make.
    const specs: AutomatonSpec[] = [{ id: 'wind', family: 'wind', cell: 1, hz: 10 }];
    const eng = new AutomataEngine(world(0.4), specs);
    eng.syncWindow();
    const grid = eng.gridsOf('wind')[0] as WindField;
    const mirror = new WindField(grid.ox, grid.oy, grid.W, grid.H, grid.cell, { prevailing: prevailingAt(7, 0.4, specs[0] as never) });
    mirror.solid.set(grid.solid);
    mirror.f.set(grid.f);
    const dones: number[] = [];
    for (let t = 0; t < 60; t++) {
      eng.tick(false);
      dones.push(grid.done);
      if (grid.done === 0) {
        mirror.inflow = prevailingAt(7, 0.4, specs[0] as never);
        mirror.step();
        expect(bytesOf(grid.f).equals(bytesOf(mirror.f))).toBe(true);
      }
    }
    expect(eng.stepCount('wind')).toBe(10);
    // Six ticks a step at 10 Hz, an even share in each.
    expect(dones.slice(0, 6)).toEqual([grid.H / 3, (2 * grid.H) / 3, grid.H, (4 * grid.H) / 3, (5 * grid.H) / 3, 0]);
  });
});

describe('the prevailing wind from the world’s time (T484)', () => {
  it('turns slowly with the day and the seed, within the limits, never with a clock', () => {
    const spec = { prevailing: [0.06, 0] as [number, number] };
    expect(prevailingAt(1, 0.3, spec)).toEqual(prevailingAt(1, 0.3, spec));
    expect(prevailingAt(1, 0.3, spec)).not.toEqual(prevailingAt(2, 0.3, spec));
    let turned = 0;
    let prev = prevailingAt(1, 0, spec);
    for (let i = 1; i <= 400; i++) {
      const days = i / 100;
      const [x, y] = prevailingAt(1, days, spec);
      const len = Math.hypot(x, y);
      expect(len).toBeLessThanOrEqual(WIND_LIMITS.inflow + 1e-9);
      expect(len).toBeGreaterThanOrEqual(0.06 * (1 - PREVAILING.calm) - 1e-9);
      // Never more than the veer from the mean (east).
      expect(Math.abs(Math.atan2(y, x))).toBeLessThanOrEqual(PREVAILING.veer + 1e-3);
      // Slow: a hundredth of a day turns it little.
      const step = Math.abs(Math.atan2(y, x) - Math.atan2(prev[1], prev[0]));
      expect(step).toBeLessThan(0.1);
      turned = Math.max(turned, Math.abs(Math.atan2(y, x)));
      prev = [x, y];
    }
    expect(turned).toBeGreaterThan(0.15);
    // Without a mean, a point of the compass from the seed; a mean of nothing stays still; a time that is not a number is the dawn.
    const free = prevailingAt(99, 0);
    expect(Math.hypot(...free)).toBeGreaterThan(0.02);
    expect(prevailingAt(1, 3, { prevailing: [0, 0] })).toEqual([0, 0]);
    expect(prevailingAt(1, Number.NaN, spec)).toEqual(prevailingAt(1, 0, spec));
  });

  it('a step of the engine begins with the prevailing wind of the world’s time', () => {
    const w = world(0);
    const eng = new AutomataEngine(w, [{ id: 'wind', family: 'wind', prevailing: [0.05, 0.03] }]);
    eng.syncWindow();
    const grid = eng.gridsOf('wind')[0] as WindField;
    w.t = 0.6;
    for (let t = 0; t < 6; t++) eng.tick(false);
    expect(grid.inflow).toEqual(prevailingAt(7, 0.6, { prevailing: [0.05, 0.03] }));
    expect(eng.prevailing('wind')).toEqual(grid.inflow);
    expect(eng.prevailing('nothing')).toBeUndefined();
  });
});

describe('the coarse view to the clients (T484)', () => {
  it('encodes the wind of every cell in two signed bytes and reads it back, and base64 goes both ways', () => {
    const bytes = new Uint8Array(257).map((_, i) => (i * 37) & 255);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    expect(fromBase64(toBase64(new Uint8Array(0)))).toEqual(new Uint8Array(0));
    expect(fromBase64('ab$=')).toBeUndefined();
    expect(fromBase64('abc')).toBeUndefined();

    const view = windViewOf(40, 30, [0.5, 0.2], (x, y) => (x < 40 ? [0.8, -0.3] : [-0.4, 0.6 + y / 1000]));
    expect([view.x, view.y]).toEqual(viewCorner(40, 30));
    expect(((view.x % WIND_VIEW.cell) + WIND_VIEW.cell) % WIND_VIEW.cell).toBe(0);
    expect(view.w * view.cell).toBe(WIND_VIEW.tiles[0]);
    const read = readWindView(JSON.parse(JSON.stringify(view)))!;
    expect(read).toEqual(view);
    const b = viewBytes(read)!;
    const west = windInView(read, b, 20.5, 30.5);
    expect(west[0]).toBeCloseTo(0.8, 1);
    expect(west[1]).toBeCloseTo(-0.3, 1);
    const east = windInView(read, b, 60.5, 30.5);
    expect(east[0]).toBeCloseTo(-0.4, 1);
    // Beyond the window the prevailing wind.
    expect(windInView(read, b, 1e5, 0)).toEqual([0.5, 0.2]);
    // Where the automaton has no window, the prevailing wind blows.
    const blank = windViewOf(0, 0, [0.3, 0.1], () => undefined);
    const bb = viewBytes(blank)!;
    expect(windInView(blank, bb, 2, 2)[0]).toBeCloseTo(0.3, 1);
  });

  it('a view from the wire is read without trusting it', () => {
    const good = windViewOf(0, 0, [0.1, 0], () => [0.2, 0.2]);
    expect(readWindView(good)).toBeDefined();
    for (const bad of [
      null,
      [],
      'wind',
      { ...good, w: 0 },
      { ...good, w: 1.5 },
      { ...good, w: 4096, h: 4096 },
      { ...good, cell: 9 },
      { ...good, x: Number.NaN },
      { ...good, p: [Infinity, 0] },
      { ...good, p: [5, 0] },
      { ...good, p: [0] },
      { ...good, data: 'AAAA' },
      { ...good, data: '!!!!' },
      { ...good, data: 'A'.repeat(1e6) },
      { ...good, data: 42 },
    ])
      expect(readWindView(bad), JSON.stringify(bad)?.slice(0, 60)).toBeUndefined();
  });
});

describe('the sail (T484)', () => {
  it('draws most abeam, less running, less close-hauled, nothing head to wind; without a sail or a wind, all of its way', () => {
    expect(sailPolar(0)).toBe(1);
    expect(sailPolar(1)).toBeCloseTo(0.7);
    expect(sailPolar(-0.7)).toBeGreaterThan(0.4);
    expect(sailPolar(-1)).toBe(0);
    const east = windHere(1, 0);
    // The bow toward (sin h, cos h): h = π/2 is east (running), 0 is south (abeam), −π/2 west (head to wind).
    const running = sailPush(SAIL, Math.PI / 2, east), abeam = sailPush(SAIL, 0, east), irons = sailPush(SAIL, -Math.PI / 2, east);
    expect(abeam).toBeGreaterThan(running);
    expect(running).toBeGreaterThan(irons);
    expect(irons).toBeCloseTo(1 - SAIL, 5);
    expect(sailPush(0, 0, east)).toBe(1);
    expect(sailPush(SAIL, 0, undefined)).toBe(1);
    expect(sailPush(SAIL, 0, windHere(0, 0))).toBeCloseTo(1 - SAIL);
    // A gust never gives more than WIND_MAX of the sail's share.
    expect(sailPush(1, 0, windHere(50, 0))).toBeLessThanOrEqual(WIND_MAX + 1e-9);
    expect(windHere(Number.NaN, 2).vx).toBe(0);
    // The step: the push multiplies what the helm asks.
    const spec = vehicleSpecOf({ medium: 'water', speed: 2, accel: 4, sail: 0.5 })!;
    expect(spec.sail).toBe(0.5);
    const v = { ...newVehicle(0), anchored: false, thrust: 1 };
    expect(vehicleStep(v, spec, 1, 0.5).speed).toBeCloseTo(1);
    expect(vehicleStep(v, spec, 1).speed).toBeCloseTo(2);
    expect(vehicleStep(v, spec, 1, Number.NaN).speed).toBeCloseTo(2);
  });

  it('a manifest says its sail on the water only; a name that says a sail gets one from the kernel', () => {
    expect(vehicleSpecOf({ medium: 'water' })!.sail).toBe(0);
    expect(vehicleSpecOf({ medium: 'land', sail: 1 })!.sail).toBe(0);
    expect(vehicleSpecOf({ medium: 'water', sail: 7 })!.sail).toBe(1);
    expect(vehicleSpecErrors({ medium: 'water', sail: 0.6 })).toEqual([]);
    expect(vehicleSpecErrors({ medium: 'land', sail: 0.6 }).join(' ')).toMatch(/sail/);
    expect(vehicleSpecErrors({ medium: 'water', sail: 2 }).join(' ')).toMatch(/sail/);
    for (const name of ['Barca a vela del porto', 'Veliero dei mercanti', 'Old galleon', 'Il brigantino', 'Fishing sloop']) expect(saysSail(name), name).toBe(true);
    for (const name of ['Chiatta a vapore', 'Barca a remi', 'Zattera', 'Velluto rosso', 'Rowboat']) expect(saysSail(name), name).toBe(false);
    expect(vehicleFor('water', {}, 'Veliero').sail).toBe(SAIL);
    expect(vehicleFor('water', {}, 'Chiatta').sail).toBeUndefined();
    expect(vehicleFor('land', {}, 'Carro a vela').sail).toBeUndefined();
  });
});

// --- In the kernel ------------------------------------------------------------------------------------------------------------------

const BOAT_XML = readFileSync(new URL('./fixtures/barca-prova.xml', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const BOAT = 'veicolo.vela';

function filesWith(opts: { wind?: [number, number]; sail?: number; extra?: FileMap; multiplayer?: boolean } = {}): FileMap {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const automata: AutomatonSpec[] = opts.wind ? [{ id: 'wind', family: 'wind', cell: 1, hz: 10, prevailing: opts.wind, layerHeight: 32 }] : [];
  const next = { ...cfg, ...(opts.multiplayer ? { game: { mode: 'multiplayer', death: 3 } } : {}), ...(automata.length ? { nature: { ...DEFAULT_NATURE, automata } } : {}) };
  const index = JSON.parse(bundledFiles['models/index.json']);
  index['barca-prova'] = { class: 'object', name: 'Barca di prova' };
  const manifest = {
    id: BOAT,
    name: 'Barca a vela',
    kind: 'entity',
    appearance: { glyph: 'B', color: '#8a5a2b', model: 'barca-prova', class: 'object' },
    physics: { solid: true, radius: 0.5 },
    vehicle: { medium: 'water', speed: 0.5, accel: 4, turn: 1, ...(opts.sail !== undefined ? { sail: opts.sail } : {}) },
  };
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify(next, null, 2) + '\n',
    'models/index.json': JSON.stringify(index, null, 1),
    'models/barca-prova.xml': BOAT_XML,
    [`modules/${BOAT}/manifest.json`]: JSON.stringify(manifest, null, 1),
    ...(opts.extra ?? {}),
  };
}

async function boot(files: FileMap) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(DT);
    await new Promise((r) => setTimeout(r, 15));
  }
  k.tick(DT);
  return k;
}

/** The boat in a pool of deep water in the first place, the wanderer at its helm, its bow toward `heading`; how fast it goes after half a second. */
async function sailing(files: FileMap, heading: number) {
  const k = await boot(files);
  k.carpet()!.active = false;
  const c = k.wandererCarpet();
  const x0 = Math.floor(c.x) + 3, y0 = Math.floor(c.y) + 3;
  const ground = Object.keys(k.palette).find((t) => t !== '?' && !k.palette[t].solid && (k.palette[t].layer ?? 'ground') === 'ground')!;
  for (let r = 0; r <= 12; r++) for (let col = 0; col <= 12; col++) k.setTile(x0 + col, y0 + r, r >= 1 && r <= 11 && col >= 1 && col <= 11 ? 'o' : ground);
  for (const id of k.ecs.query('pos')) {
    const p = k.ecs.get(id, 'pos');
    if (id !== k.wandererEntity && Math.abs(p.x - (x0 + 6.5)) < 14 && Math.abs(p.y - (y0 + 6.5)) < 14) k.ecs.destroy(id);
  }
  const boat = k.spawnModuleEntity(k.modules.get(BOAT)!, x0 + 6.5, y0 + 6.5);
  k.ecs.get(boat, 'vehicle').heading = heading;
  const fc = k.ecs.get(boat, 'form');
  fc.yaw = heading;
  await k.forms.wait(fc.model, fc.seed, fc.tint);
  k.tick(DT);
  const b = k.ecs.get(boat, 'pos');
  const [wx, wy] = toWorld(0, -0.75, heading);
  const { ox, oy } = k.offset();
  const p = k.wandererPos();
  delete p.z;
  Object.assign(p, { x: b.x + wx - ox, y: b.y + wy - oy });
  k.tick(DT);
  await k.perform(boat, 'helm');
  k.input.setHeld('up', true);
  for (let i = 0; i < 30; i++) k.tick(DT);
  k.input.setHeld('up', false);
  const pos = k.ecs.get(boat, 'pos');
  return { k, boat, speed: k.ecs.get(boat, 'vehicle').speed as number, wind: k.worldWind(pos.x, pos.y) };
}

describe('the wind in the kernel (T484)', () => {
  it('a sail goes as the wind blows at it: running more than head to wind; without wind or without a sail, as before', async () => {
    // The wind blows east; the bow toward the east (running) and toward the west (head to wind).
    const run = await sailing(filesWith({ wind: [0.08, 0], sail: SAIL }), Math.PI / 2);
    const irons = await sailing(filesWith({ wind: [0.08, 0], sail: SAIL }), -Math.PI / 2);
    expect(run.k.windId()).toBe('wind');
    expect(run.wind!.speed).toBeGreaterThan(0.3);
    expect(run.speed).toBeCloseTo(0.5 * sailPush(SAIL, Math.PI / 2, run.wind), 1);
    expect(irons.speed).toBeCloseTo(0.5 * sailPush(SAIL, -Math.PI / 2, irons.wind), 1);
    expect(run.speed).toBeGreaterThan(irons.speed);
    const calm = await sailing(filesWith({ sail: SAIL }), -Math.PI / 2);
    expect(calm.k.windId()).toBeUndefined();
    expect(calm.k.worldWind(0, 0)).toBeUndefined();
    expect(calm.speed).toBeCloseTo(0.5, 2);
    const oars = await sailing(filesWith({ wind: [0.08, 0] }), -Math.PI / 2);
    expect(oars.speed).toBeCloseTo(0.5, 2);
  }, 120_000);

  it('Lua reads the wind with world.wind, a copy; nil without wind; the fire reaches farther downwind', async () => {
    expect(LUA_API.world).toContain('wind');
    expect(apiErrors('local w = world.wind(1, 2); if w then log(w.vx + w.vy + w.speed) end')).toEqual([]);
    expect(readFileSync('universe/prompts/agents/engineer.md', 'utf8')).toMatch(/world\.wind\(x, y\)/);
    const probe = {
      'modules/sys.sonda/manifest.json': JSON.stringify({ id: 'sys.sonda', name: 'Sonda', kind: 'system', logic: 'logic.lua', order: 93 }),
      'modules/sys.sonda/logic.lua': `local M = {}
function M.update(dt)
  local w = world.wind(4.5, 4.5)
  if w then w.vx = 99 end
  local again = world.wind(4.5, 4.5)
  ecs.set(world.player(), "probe", { has = w ~= nil, vx = again and again.vx or 0, speed = again and again.speed or 0, bad = world.wind("a", 1) == nil })
end
return M
`,
    };
    const windy = await boot(filesWith({ wind: [0.07, 0], extra: probe }));
    for (let i = 0; i < 12; i++) windy.tick(DT);
    const p = windy.ecs.get(windy.wandererEntity, 'probe');
    expect(p.has).toBe(true);
    expect(p.vx).not.toBe(99);
    expect(p.vx).toBeGreaterThan(0.2);
    expect(p.speed).toBeGreaterThan(0.2);
    expect(p.bad).toBe(true);
    const still = await boot(filesWith({ extra: probe }));
    still.tick(DT);
    expect(still.ecs.get(still.wandererEntity, 'probe').has).toBe(false);

    // The fire (sys.fire): a bush 1.8 tiles downwind burns, one as far upwind stays; without wind neither.
    const burns = async (files: FileMap) => {
      const k = await boot(files);
      k.carpet()!.active = false;
      const c = k.wandererCarpet();
      const fx = Math.floor(c.x) + 9.5, fy = Math.floor(c.y) + 9.5;
      for (const id of k.ecs.query('pos')) {
        const q = k.ecs.get(id, 'pos');
        if (id !== k.wandererEntity && Math.abs(q.x - fx) < 6 && Math.abs(q.y - fy) < 6) k.ecs.destroy(id);
      }
      const down = k.spawnModuleEntity(k.modules.get('object.bush')!, fx + 1.8, fy);
      const up = k.spawnModuleEntity(k.modules.get('object.bush')!, fx - 1.8, fy);
      k.ecs.spawn({ pos: { x: fx, y: fy }, fire: { radius: 1 }, ephemeral: { expires: k.time + 10 } });
      for (let i = 0; i < 20; i++) k.tick(DT);
      return { down: !k.ecs.alive.has(down), up: !k.ecs.alive.has(up) };
    };
    expect(await burns(filesWith({ wind: [0.08, 0] }))).toEqual({ down: true, up: false });
    expect(await burns(filesWith())).toEqual({ down: false, up: false });
  }, 120_000);

  it('in a game of many the coarse wind goes to the clients, at most twice a second, and the mirror reads it as the server', async () => {
    const k = await boot(filesWith({ wind: [0.06, 0.03], multiplayer: true }));
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    const winds: unknown[] = [];
    server.connect(s);
    const session = new SessionClient(c, { id: 'anna' });
    await session.ready;
    expect(session.wind).toBeDefined();
    const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    const thin = new ThinClient(mirror, session);
    const heard = session.onMessage;
    session.onMessage = (m: ServerMsg) => {
      if (m.t === 'update' && m.wind !== undefined) winds.push(m.wind);
      heard?.(m);
    };
    const run = (n: number) => {
      for (let i = 0; i < n; i++) {
        thin.k.tick(DT);
        thin.frame(DT);
        server.tick(DT);
      }
    };
    run(60);
    // The world's time goes on (the prevailing wind turns): three seconds more, at most a view each half second, and only when it changed.
    k.time += 200;
    run(180);
    expect(winds.length).toBeGreaterThan(0);
    expect(winds.length).toBeLessThanOrEqual(Math.ceil((240 / 60) * WIND_VIEW.hz) + 1);
    for (const w of winds) expect(readWindView(w)).toBeDefined();
    // The mirror runs no automaton: it reads what the server said.
    expect(mirror.automata.stepCount('wind')).toBe(0);
    const at = k.wandererAt('anna')!;
    const there = mirror.worldWind(at.x, at.y)!;
    const here = k.worldWind(at.x, at.y)!;
    expect(there).toBeDefined();
    expect(Math.abs(there.vx - here.vx)).toBeLessThan(0.25);
    expect(Math.abs(there.vy - here.vy)).toBeLessThan(0.25);
    expect(mirror.windView()).toEqual(session.wind);
    // The world loses its wind: the clients forget it.
    mirror.applyWind(null);
    expect(mirror.windView()).toBeUndefined();
    mirror.applyWind({ junk: true });
    expect(mirror.windView()).toBeUndefined();
    expect(windSpecOf(k.automataSpecs())?.id).toBe('wind');
    expect(relativeWind(WIND_LIMITS.inflow, 0)[0]).toBeCloseTo(1);
  }, 120_000);
});
