// The sea that is swum, everywhere (T438, ADR-0224): the layout of a plan with the mark joins a place through the water one swims and never
// digs it (0 water tiles dug), a plan of before keeps its paths on the water; the wanderer's body swims (the tile's pace, the kernel's
// fatigue, drowning as a death of the game), is stopped at the shore when too loaded, jumps into the water and out of it; NPCs and things do
// not swim; the server's step lets a client swim at the swimming pace, never walk on the water.

import { describe, expect, it } from 'vitest';
import fixture from './fixtures/luoghi-campione.json';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { layout } from '../src/kernel/layout';
import { DROWNED, swimTick, tooLoadedToSwim, WALK_ENERGY } from '../src/kernel/swim';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { Action } from '../src/kernel/input';

const waterOf = (g: string[]) => g.join('').split('').filter((c) => c === 'w' || c === 'o').length;

async function boot() {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  return k;
}

describe('the layout that swims (T438)', () => {
  it('digs no water on the three sample places, and reaches every gate on foot or swimming', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    for (const f of fixture) {
      const swum = layout(f.draft, k.palette, { cx: f.cx, cy: f.cy, seed: k.config.seed, pathCode: 'p', swim: true });
      expect(waterOf(swum.grid), `l'acqua di ${f.name}`).toBe(waterOf(f.draft));
      expect(swum.carved).toBeLessThanOrEqual(f.bare.carved);
      // Nothing is placed on the water.
      for (const i of swum.reachable) expect(k.palette[swum.grid.join('')[i]].solid).toBe(false);
      // Every gate is ground reached or water that joins the place.
      const S = f.draft.length;
      for (const g of swum.gates) {
        const code = swum.grid[Math.floor(g / S)][g % S];
        expect(swum.reachable.has(g) || k.palette[code].cross === 'swim', `il varco ${g} di ${f.name}`).toBe(true);
      }
    }
    // The coast and the sea: 16 and 37 water tiles dug before, none now.
    const [, coast, sea] = fixture;
    expect([waterOf(coast.draft) - waterOf(coast.bare.grid), waterOf(sea.draft) - waterOf(sea.bare.grid)]).toEqual([16, 37]);
  }, 60_000);

  it('joins an islet in the sea without piers, and an islet ringed by rocks through the rock, not the water', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const S = 18;
    const islet = Array.from({ length: S }, (_, r) => Array.from({ length: S }, (_, c) => (r >= 6 && r < 12 && c >= 6 && c < 12 ? 'g' : 'o')).join(''));
    const before = layout(islet, k.palette, { cx: 3, cy: 3, seed: 7, pathCode: 'p' });
    expect(before.carved).toBeGreaterThan(0);
    const now = layout(islet, k.palette, { cx: 3, cy: 3, seed: 7, pathCode: 'p', swim: true });
    expect(now.carved).toBe(0);
    expect(waterOf(now.grid)).toBe(waterOf(islet));
    expect(now.reachable.size).toBe(36);
    // Ringed by rocks: dug through the rock to the water, the water untouched.
    const rock = Object.keys(k.palette).find((c) => k.palette[c].layer === 'rock')!;
    const ringed = islet.map((row, r) => [...row].map((ch, c) => (ch === 'o' && r >= 5 && r < 13 && c >= 5 && c < 13 ? rock : ch)).join(''));
    const dug = layout(ringed, k.palette, { cx: 3, cy: 3, seed: 7, pathCode: 'p', swim: true });
    expect(waterOf(dug.grid)).toBe(waterOf(ringed));
    expect(dug.carved).toBeGreaterThan(0);
    expect(dug.reachable.size).toBeGreaterThan(36);
  }, 60_000);

  it('is the layout of the plans the kernel makes from now on; a plan of before keeps its paths on the water', async () => {
    const k = await boot();
    expect(k.chunks.get('0,0')!.plan!.swim).toBe(true);
    const sea = fixture[2];
    const plan: ChunkPlan = { place: { name: 'mare', description: '' }, layout: '', objects: [], ground: [], fresh: [], runes: [] };
    const tilesOf = (p: ChunkPlan) => {
      const { tiles } = (k as unknown as { layoutOf(ch: object, plan: ChunkPlan, path: string): { tiles: string } }).layoutOf({ cx: sea.cx, cy: sea.cy, draft: sea.draft.join('') }, p, 'p');
      return Array.from({ length: 18 }, (_, r) => tiles.slice(r * 18, r * 18 + 18));
    };
    expect(waterOf(sea.draft) - waterOf(tilesOf(plan))).toBe(37);
    expect(waterOf(sea.draft) - waterOf(tilesOf({ ...plan, swim: true }))).toBe(0);
  }, 60_000);
});

describe('the body that swims (T438)', () => {
  /** A row of ground with a pool of deep sea to its right, 5 tiles long and 3 wide; the wanderer on the ground, facing it. */
  async function shore() {
    const k = await boot();
    k.carpet()!.active = false;
    let spot: [number, number] | undefined;
    for (let y = -10; y <= 10 && !spot; y++)
      for (let x = -10; x <= 2 && !spot; x++) {
        let ok = true;
        for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 9 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.45) && !!k.chunkAt(x + dx, y + dy)?.plan;
        if (ok) spot = [x, y];
      }
    expect(spot).toBeDefined();
    const [col, row] = spot!;
    for (let c = 3; c <= 7; c++) for (let r = -1; r <= 1; r++) expect(k.setTile(col + c, row + r, 'o')).toBe(true);
    const stand = (x: number, y: number) => {
      const { ox, oy } = k.offset();
      Object.assign(k.wandererPos(), { x: x - ox, y: y - oy });
      k.wandererComp().facing = 'right';
    };
    const hold = (key: Action, s: number) => {
      k.input.setHeld(key, true);
      for (let i = 0; i < s * 60; i++) k.tick(1 / 60);
      k.input.setHeld(key, false);
    };
    stand(col + 0.5, row + 0.5);
    return { k, col, row, stand, hold };
  }

  it('goes into the water, swims slower, tires three times as fast; NPCs and things do not swim', async () => {
    const { k, col, row, stand, hold } = await shore();
    expect(k.swimming()).toBe(false);
    const x0 = k.wandererCarpet().x;
    const e0 = k.needs()!.energy;
    hold('right', 0.25);
    const walked = k.wandererCarpet().x - x0, walkCost = e0 - k.needs()!.energy;
    expect(walked).toBeGreaterThan(0.5);
    // Into the sea: it swims.
    stand(col + 4.5, row + 0.5);
    k.tick(1 / 60);
    expect(k.swimming()).toBe(true);
    const x1 = k.wandererCarpet().x, e1 = k.needs()!.energy;
    hold('right', 0.25);
    const swum = k.wandererCarpet().x - x1, swimCost = e1 - k.needs()!.energy;
    expect(swum / walked).toBeGreaterThan(0.3);
    expect(swum / walked).toBeLessThan(0.5);
    expect(swimCost / walkCost).toBeGreaterThan(2.5);
    expect(swimCost / walkCost).toBeLessThan(3.5);
    // From the shore, walking right, the wanderer enters the water.
    stand(col + 1.5, row + 0.5);
    hold('right', 1);
    expect(k.swimming()).toBe(true);
    // And back to the shore, walking left: out of the water.
    hold('left', 2);
    expect(k.swimming()).toBe(false);
    // NPCs and things: the water is solid for them; the wanderer's body swims it.
    expect(k.free(col + 5.5, row + 0.5, 0.3)).toBe(false);
    expect(k.bodyFree(col + 5.5, row + 0.5, 0.3)).toBe(true);
  }, 60_000);

  it('drowns out of energy in the water, a death of the game', async () => {
    const { k, col, row, stand } = await shore();
    const deaths: string[] = [];
    k.bus.on('ui:death', (d: { cause: string }) => deaths.push(d.cause));
    stand(col + 5.5, row + 0.5);
    Object.assign(k.needs()!, { energy: 0, health: 0.5 });
    for (let i = 0; i < 120 && !deaths.length; i++) k.tick(1 / 60);
    expect(deaths).toEqual([DROWNED]);
  }, 60_000);

  it('is stopped at the shore of the deep water with a thing over the head, and told so', async () => {
    const { k, col, row, hold, stand } = await shore();
    const said: string[] = [];
    k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
    k.inventory().slots[0] = { item: 'thing:object.well', count: 1 };
    stand(col + 1.5, row + 0.5);
    hold('right', 1.5);
    expect(k.swimming()).toBe(false);
    expect(k.wandererCarpet().x).toBeLessThan(col + 3);
    expect(said.filter((t) => /troppo carico per nuotare/i.test(t))).toHaveLength(1);
    // The server's step stops the same body at the same shore; put down, it swims.
    const at = k.wandererCarpet();
    expect(k.stepWanderer('me', { x: col + 5.5, y: at.y }, 4)!.x).toBeLessThan(col + 3);
    k.inventory().slots[0] = null as never;
    expect(k.stepWanderer('me', { x: col + 5.5, y: at.y }, 4)!.x).toBeCloseTo(col + 5.5, 5);
    expect(k.swimming()).toBe(true);
  }, 60_000);

  it('gives the server a swimming pace in open water, the walk at the shore', async () => {
    const { k, col, row, stand } = await shore();
    const speed = Number(k.wandererComp().speed);
    stand(col + 5.5, row + 0.5);
    expect(k.paceOf('me')).toBeCloseTo(speed * 0.4, 5);
    stand(col + 3.2, row + 0.5);
    expect(k.paceOf('me')).toBeGreaterThanOrEqual(speed);
  }, 60_000);
});

describe('the fatigue and the drowning, as numbers (T438)', () => {
  it('takes fatigue − 1 walks of energy, then the health, and never what is not a number', () => {
    const n = { energy: 10, health: 100 };
    expect(swimTick(n, 3, 1)).toBe(false);
    expect(n.energy).toBeCloseTo(10 - 2 * WALK_ENERGY, 9);
    const out = { energy: 0, health: 0.3 };
    expect(swimTick(out, 3, 1)).toBe(true);
    expect(out).toEqual({ energy: 0, health: 0, dead: true });
    const broken = { energy: NaN, health: NaN };
    expect(swimTick(broken, NaN, 1)).toBe(false);
    expect(swimTick({ energy: 5, health: 5 }, 3, NaN)).toBe(false);
    expect([tooLoadedToSwim(0.5, false), tooLoadedToSwim(0.51, false), tooLoadedToSwim(0, true), tooLoadedToSwim(NaN, false)]).toEqual([false, true, true, false]);
  });
});
