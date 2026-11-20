// The spaceships and the capsules (T448, ADR-0234, `docs/design/acqua-spazio.md` § 2.2 and § 2.6): the vehicle of T439/T442 on the void
// (`medium: void`: it moves only over the void, never over a land), the landing of every land of the void (`dockOf`: a function of the
// seed), the seed's capsule the kernel puts there when its place comes (rule 10: between two lands of the void one goes only by capsule),
// the flat world of the void (the deck a step over the land), «Entra» from the edge (`boardDeck`), «Esci» onto the land only, the idle
// capsule that goes back to its landing.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { CAPSULE, Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { DEFAULT_NATURE, isVoid, voidTerrain } from '../src/kernel/nature';
import { CAPSULE_TILES, DOCK_OVERLAP, dockOf, groundAt, islandOf, islandsNear, voidGates } from '../src/kernel/islands';
import { carries, vehicleSpecErrors, vehicleSpecOf, VEHICLE_WORDS } from '../src/kernel/vehicle';
import { toLocal } from '../src/kernel/forms';
import type { Action } from '../src/kernel/input';

const S = 18;
const SEEDS = Array.from({ length: 30 }, (_, i) => 11 + i * 7919);

function voidFiles(seed?: number) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ...(seed !== undefined ? { seed } : {}), nature: { ...DEFAULT_NATURE, geography: 'void', sky: 'stars' } }, null, 2) + '\n' };
}

const isLand = (seed: number, x: number, y: number) => {
  const g = groundAt(islandsNear(seed, x + 0.5, y + 0.5, 1, 'void'), x + 0.5, y + 0.5).ground;
  return g === 'land' || g === 'beach';
};

describe('the vehicle of the void (T448)', () => {
  it('is data: `medium: void`, carried only by the void', () => {
    expect(vehicleSpecOf({ medium: 'void', speed: 6 })).toMatchObject({ medium: 'void', speed: 6 });
    expect(vehicleSpecErrors({ medium: 'void' })).toEqual([]);
    expect(vehicleSpecErrors({ medium: 'void', draught: 'deep' })).toHaveLength(1);
    const spec = vehicleSpecOf({ medium: 'void' })!;
    expect(carries(spec, voidTerrain())).toBe(true);
    expect(carries(spec, { name: 'lamiera', color: '#888', solid: false, layer: 'ground' })).toBe(false);
    expect(carries(spec, { name: 'mare', color: '#00f', solid: true, layer: 'liquid', cross: 'swim', depth: 'deep' })).toBe(false);
    expect(carries(vehicleSpecOf({ medium: 'water', draught: 'deep' })!, voidTerrain())).toBe(false);
    expect(VEHICLE_WORDS.void.board).toBe('Entra');
  });
});

describe('the landing of a land of the void (T448)', () => {
  it('stands beyond the edge on the axis toward the nearest neighbour, its stern over the edge, every point of its hull over the void', () => {
    for (const seed of SEEDS)
      for (const [i, j] of [[0, 0], [1, 0], [0, 1], [-1, 2], [3, -2]]) {
        const land = islandOf(seed, i, j, 'void');
        const d = dockOf(seed, land)!;
        expect(d, `${seed} ${i},${j}`).toBeDefined();
        // The bow away from the land, the land at the hatch on the axis behind the stern.
        const bow = [Math.sin(d.heading), Math.cos(d.heading)];
        expect(isLand(seed, d.land[0], d.land[1])).toBe(true);
        expect(bow[0] * (d.x - land.x) + bow[1] * (d.y - land.y)).toBeGreaterThan(0);
        // The hull: every point of its box, a thirty-second in, over the void.
        const [W, L] = CAPSULE_TILES;
        for (let a = -W / 2 + 1 / 32; a <= W / 2 - 1 / 32 + 1e-9; a += W / 2 - 1 / 32)
          for (let b = -L / 2 + 1 / 32; b <= L / 2 - 1 / 32 + 1e-9; b += 1 / 8) {
            const x = d.x + a * Math.cos(d.heading) + b * Math.sin(d.heading);
            const y = d.y - a * Math.sin(d.heading) + b * Math.cos(d.heading);
            expect(isLand(seed, Math.floor(x), Math.floor(y)), `${seed} ${i},${j} ${a},${b}`).toBe(false);
          }
        // The stern touches the land at the hatch, unless the edge made the kernel move it out.
        const stern = [d.x - bow[0] * (L / 2), d.y - bow[1] * (L / 2)];
        const gap = Math.hypot(stern[0] - (d.land[0] + 0.5), stern[1] - (d.land[1] + 0.5));
        expect(gap).toBeLessThan(5);
      }
    // A station of the start, its stern flush: the edge minus the overlap.
    const seed = SEEDS[0];
    const d = dockOf(seed, islandOf(seed, 0, 0, 'void'))!;
    const stern = d.heading === Math.PI / 2 ? d.x - 2 : d.heading === Math.PI ? d.y + 2 : d.heading === 0 ? d.y - 2 : d.x + 2;
    expect(Math.abs(stern - Math.round(stern))).toBeCloseTo(DOCK_OVERLAP, 6);
    // Not in the archipelago: an island is reached swimming.
    expect(dockOf(seed, islandOf(seed, 1, 0))).toBeUndefined();
  });
});

async function voidWorld(seed = SEEDS[0]) {
  const k = await Kernel.boot({ files: voidFiles(seed), store: memoryStore(), ai: new MockAiModels() });
  k.carpet()!.active = false;
  const d = dockOf(k.config.seed, islandOf(k.config.seed, 0, 0, 'void'))!;
  // The places of the landing and around it, planned and in the world.
  const cx = Math.floor(d.x / S), cy = Math.floor(d.y / S);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) await k.planAhead(cx + a, cy + b);
  return { k, d };
}

const capsules = (k: Kernel) => k.ecs.query('vehicle').filter((e) => k.ecs.get(e, 'module').id === CAPSULE);

describe('the capsule at the landing (T448)', () => {
  it('a world of the void is flat; the seed has the capsule; the kernel docks it at the landing when its place comes', async () => {
    const { k, d } = await voidWorld();
    expect(k.modules.get(CAPSULE)).toBeDefined();
    expect(k.relief.max).toBe(0);
    const [c] = capsules(k);
    expect(c).toBeDefined();
    const p = k.ecs.get(c, 'pos');
    expect([p.x, p.y]).toEqual([d.x, d.y]);
    expect(k.ecs.get(c, 'vehicle')).toMatchObject({ heading: d.heading, anchored: true });
    expect(k.ecs.get(c, 'origin').key).toBe('dock:0,0');
    // The land at the hatch is walked (rule 10).
    const t = k.tileAt(d.land[0], d.land[1])!;
    expect(isVoid(k.palette[t])).toBe(false);
    expect(k.palette[t].solid).toBe(false);
    // Its place again does not make another.
    await k.planAhead(Math.floor(d.x / S), Math.floor(d.y / S));
    expect(capsules(k)).toHaveLength(1);
  }, 60_000);
});

/** The capsule of the start's landing with its form ready, and the wanderer put at a point of the carpet. */
async function docked(seed = SEEDS[0]) {
  const { k, d } = await voidWorld(seed);
  const [c] = capsules(k);
  const fc = k.ecs.get(c, 'form');
  await k.forms.wait(fc.model, fc.seed, fc.tint);
  k.tick(1 / 60);
  // The carpet under the landing (the start is the origin, the landing some forty tiles off: at the edge of the circle), still.
  Object.assign(k.carpet()!, { ox: Math.round(d.x), oy: Math.round(d.y) });
  const put = (x: number, y: number) => {
    const { ox, oy } = k.offset();
    const p = k.wandererPos();
    delete p.z;
    Object.assign(p, { x: x - ox, y: y - oy });
    k.tick(1 / 60);
  };
  const hold = (keys: Action[], s: number) => {
    for (const key of keys) k.input.setHeld(key, true);
    for (let i = 0; i < s * 60; i++) k.tick(1 / 60);
    for (const key of keys) k.input.setHeld(key, false);
  };
  const said: string[] = [];
  k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
  /** Where the wanderer stands in the capsule's own frame. */
  const onDeck = () => {
    const b = k.ecs.get(c, 'pos'), w = k.wandererCarpet();
    return toLocal(w.x - b.x, w.y - b.y, k.ecs.get(c, 'vehicle').heading);
  };
  const menu = () => k.actionsFor(c).map((o) => o.id).filter((o) => ['board', 'helm', 'unhelm', 'anchor', 'weigh', 'over'].includes(o));
  return { k, d, c, put, hold, said, onDeck, menu };
}

describe('rule 10 at the landing (T448)', () => {
  it('the land at the hatch is walked and joined to the gates of its place that stand on land', async () => {
    for (const seed of SEEDS.slice(0, 4)) {
      const k = await Kernel.boot({ files: voidFiles(seed), store: memoryStore(), ai: new MockAiModels() });
      for (const [i, j] of [[0, 0], [1, 0], [0, 1]]) {
        const d = dockOf(seed, islandOf(seed, i, j, 'void'))!;
        const [cx, cy] = [Math.floor(d.land[0] / S), Math.floor(d.land[1] / S)];
        await k.planAhead(cx, cy);
        const ch = k.chunks.get(`${cx},${cy}`)!;
        const walk = (c: number) => !isVoid(k.palette[ch.tiles[c]]) && !k.palette[ch.tiles[c]].solid;
        const start = (d.land[1] - cy * S) * S + (d.land[0] - cx * S);
        expect(walk(start), `${seed} ${i},${j}`).toBe(true);
        // From the hatch, over what one walks in the place, to its gates on land (`voidGates`).
        const seen = new Set([start]);
        const todo = [start];
        while (todo.length) {
          const c = todo.pop()!;
          const [x, y] = [c % S, Math.floor(c / S)];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const n = (y + dy) * S + x + dx;
            if (x + dx < 0 || y + dy < 0 || x + dx >= S || y + dy >= S || seen.has(n) || !walk(n)) continue;
            seen.add(n);
            todo.push(n);
          }
        }
        const gates = [...new Set(voidGates(seed, cx, cy, S))];
        for (const g of gates) if (walk(g)) expect(seen.has(g), `${seed} ${i},${j} gate ${g}`).toBe(true);
      }
    }
  }, 120_000);
});

describe('aboard a capsule (T448)', () => {
  it('from the edge of the land: «Entra» at the hatch; the deck is a step over the land, walked onto and off', async () => {
    const { k, d, c, put, said, menu, onDeck } = await docked();
    put(d.land[0] + 0.5, d.land[1] + 0.5);
    expect(k.aboard()).toBeUndefined();
    expect(menu()).toEqual(['board']);
    expect(k.actionsFor(c).find((o) => o.id === 'board')?.label).toBe('Entra');
    await k.perform(c, 'board');
    expect(k.aboard()).toBe(c);
    expect(said).toContain('Entri nella capsula.');
    // At the hatch: the stern of the deck, a step over the land.
    expect(onDeck()[1]).toBeLessThan(-1);
    expect(k.wandererPos().z! - k.groundAt(d.land[0] + 0.5, d.land[1] + 0.5)).toBeLessThan(0.2);
    expect(menu()).toEqual(['helm', 'weigh', 'over']);
    // Far from the controls: the menu says where they are.
    expect(k.actionsFor(c).find((o) => o.id === 'helm')?.reason).toBe('I comandi sono più in là.');
    // Out of the hatch, onto the land.
    await k.perform(c, 'over');
    expect(k.aboard()).toBeUndefined();
    expect(said).toContain('Esci dalla capsula.');
    // Walking back in through the hatch: the stern touches the land.
    const bow = [Math.sin(d.heading), Math.cos(d.heading)];
    put(d.land[0] + 0.5, d.land[1] + 0.5);
    const keys: Array<[Action, [number, number]]> = [['up', [0, -1]], ['down', [0, 1]], ['left', [-1, 0]], ['right', [1, 0]]];
    for (const [key, v] of keys) {
      // The key that walks toward the bow.
      if (v[0] * bow[0] + v[1] * bow[1] < 0.5) continue;
      k.input.setHeld(key, true);
      for (let i = 0; i < 40 && k.aboard() === undefined; i++) k.tick(1 / 60);
      k.input.setHeld(key, false);
    }
    expect(k.aboard()).toBe(c);
  }, 60_000);

  it('at the controls it flies over the void only: the land stops it, who is aboard goes with it, nobody steps out into the void', async () => {
    const { k, d, c, put, hold, said, menu, onDeck } = await docked();
    // Before the controls, on the deck.
    const bow = [Math.sin(d.heading), Math.cos(d.heading)];
    put(d.x + bow[0] * 0.8, d.y + bow[1] * 0.8);
    expect(k.aboard()).toBe(c);
    await k.perform(c, 'helm');
    expect(k.atHelm()).toBe(c);
    expect(said).toContain('Prendi i comandi.');
    expect(k.ecs.get(c, 'vehicle').anchored).toBe(false);
    const at = onDeck();
    hold(['up'], 1.5);
    const p = k.ecs.get(c, 'pos');
    const gone = (p.x - d.x) * bow[0] + (p.y - d.y) * bow[1];
    expect(gone).toBeGreaterThan(0.5);
    // Who is aboard went with it, at the same place of the deck.
    expect(k.aboard()).toBe(c);
    expect(onDeck()[0]).toBeCloseTo(at[0], 3);
    expect(onDeck()[1]).toBeCloseTo(at[1], 3);
    // Out in the void there is nowhere to put a foot.
    await k.perform(c, 'over');
    expect(k.aboard()).toBe(c);
    expect(said).toContain('Fuori c’è solo il vuoto: niente su cui posare i piedi.');
    // Astern, back to the land: the edge stops it.
    hold(['down'], 6);
    const back = (k.ecs.get(c, 'pos').x - d.x) * bow[0] + (k.ecs.get(c, 'pos').y - d.y) * bow[1];
    expect(back).toBeGreaterThan(-0.2);
    expect(back).toBeLessThan(0.2);
    expect(said).toContain('La capsula urta e si ferma.');
    expect(menu()).toContain('unhelm');
    await k.perform(c, 'anchor');
    expect(said).toContain('Spegni i motori.');
  }, 60_000);
});

describe('the capsule left idle (T448)', () => {
  it('is not kept in the save and goes back to its landing; one taken away leaves a new one at the landing', async () => {
    const { k, d, c, put, hold } = await docked();
    // Idle at its landing: the save does not keep it.
    expect(((k as unknown as { vehiclesToSave(): unknown[] }).vehiclesToSave())).toEqual([]);
    // Someone at its controls takes it away: kept, with its origin.
    const bow = [Math.sin(d.heading), Math.cos(d.heading)];
    put(d.x + bow[0] * 0.8, d.y + bow[1] * 0.8);
    await k.perform(c, 'helm');
    hold(['up'], 4);
    const saved = (k as unknown as { vehiclesToSave(): Array<{ origin: string }> }).vehiclesToSave();
    expect(saved.map((r) => r.origin)).toEqual(['dock:0,0']);
    // The place of the landing again: another capsule docks there.
    const ch = k.chunks.get(`${Math.floor(d.x / S)},${Math.floor(d.y / S)}`)!;
    const un = k as unknown as { unloadChunk(c: unknown): void };
    un.unloadChunk(ch);
    await k.planAhead(Math.floor(d.x / S), Math.floor(d.y / S));
    const all = capsules(k);
    expect(all).toHaveLength(2);
    expect(all.map((e) => k.ecs.get(e, 'origin').key).sort()).toEqual(['dock:0,0', 'dock:0,0/2']);
  }, 60_000);
});
