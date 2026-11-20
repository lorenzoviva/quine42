// The void, the sky and the day (T445, ADR-0233, `docs/design/acqua-spazio.md` § 2.1-2.3): the void as the absence of a floor (not walked,
// not swum, not jumped over, never carved nor a gate, nothing on it, no air), the stations and the asteroids on the lattice of T441, the
// places of the void planned by the kernel without a call, the sky of stars and the day of the nature (a still light: always full day,
// the clock of the earth for the routines). A world of today does not notice: no void in its palette, its nature the same.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { memoryStore } from '../src/kernel/repo';
import { clockDay, crossingOf, DEFAULT_NATURE, isVoid, repairNature, stillLight, terrainPhysics, terrainPhysicsErrors, VOID_CODE, voidTerrain } from '../src/kernel/nature';
import { ASTEROID_ONE_IN, groundAt, islandOf, islandsNear, OPEN_VOID, shoreAt, voidDraft, voidGates } from '../src/kernel/islands';
import { gates, layout } from '../src/kernel/layout';
import { islandRegion, readAtlas } from '../src/kernel/atlas';
import { terrainErrors } from '../src/kernel/agents/genesis';
import { WORLD_THEMES } from '../src/kernel/themes';
import { apiErrors } from '../src/kernel/validator';
import type { MjNode } from '../src/kernel/mj';
import type { TerrainDef } from '../src/kernel/types';

const S = 18;
const SEEDS = Array.from({ length: 40 }, (_, i) => 3 + i * 7919);

class Recording extends MockAiModels {
  plans: string[] = [];
  async text(call: TextCall): Promise<string> {
    if (call.task === 'chunk.plan') {
      const d = call.data as { cx: number; cy: number };
      this.plans.push(`${d.cx},${d.cy}`);
    }
    return super.text(call);
  }
}

function voidFiles(nature: Record<string, unknown> = {}) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, geography: 'void', sky: 'stars', ...nature } }, null, 2) + '\n' };
}

const palette: Record<string, TerrainDef> = {
  g: { name: 'prato', color: '#4f9a45', solid: false, layer: 'ground' },
  p: { name: 'lamiera', color: '#c8a868', solid: false, layer: 'ground' },
  r: { name: 'roccia', color: '#8a8a92', solid: true, layer: 'rock' },
  [VOID_CODE]: voidTerrain(),
};

describe('the void as a terrain (T445)', () => {
  it('is not walked, swum nor breathed; its physics is the kernel’s, and no manifest says it', () => {
    const v = voidTerrain();
    expect(isVoid(v)).toBe(true);
    expect(crossingOf(v)).toBe('none');
    // Whatever it would say, it stays the void.
    expect(crossingOf({ ...v, solid: false, cross: 'walk' })).toBe('none');
    expect(terrainPhysics(v)).toMatchObject({ cross: 'none', air: false });
    expect(voidTerrain('en').name).toBe('void');
    // The Genesis never names a terrain with the void's code; a manifest cannot say the layer.
    expect(terrainErrors([{ code: VOID_CODE, name: 'x', color: '#000000' } as never]).join()).toMatch(/codice non valido/);
    expect(terrainPhysicsErrors(VOID_CODE, { layer: 'void', solid: true })).toEqual([]);
  });
});

describe('the sky and the day of the nature (T445)', () => {
  it('are accepted and repaired: stars, a day of 2 minutes to an hour, or 0 for a still light', () => {
    expect(repairNature({ geography: 'void', sky: 'stars', day: 0 })).toEqual({ ...DEFAULT_NATURE, geography: 'void', sky: 'stars', day: 0 });
    expect(repairNature({ day: 300 }).day).toBe(300);
    for (const day of [60, 7200, -1, NaN, '300']) expect(repairNature({ day }).day).toBe(600);
    expect(clockDay({ day: 0 })).toBe(600);
    expect(clockDay({ day: 300 })).toBe(300);
    expect(stillLight({ day: 0 })).toBe(true);
    expect(stillLight(DEFAULT_NATURE)).toBe(false);
  });

  it('no theme brings the void yet (T448 brings the capsule that joins its lands, rule 10), nor the stars to a world with air', () => {
    for (const t of WORLD_THEMES) {
      const n = repairNature(t.nature);
      expect(n.geography, t.id).not.toBe('void');
      expect(n.sky, t.id).toBe('earth');
    }
  });
});

describe('the stations and the asteroids (T445)', () => {
  it('are the lattice of T441: the start is a station at the origin, one land in three an asteroid, smaller; no islets', () => {
    let asteroids = 0, lands = 0;
    for (const seed of SEEDS) {
      const start = islandOf(seed, 0, 0, 'void');
      expect(start).toMatchObject({ x: 0, y: 0, body: 'station' });
      for (let i = -2; i <= 2; i++)
        for (let j = -2; j <= 2; j++) {
          if (!i && !j) continue;
          const f = islandOf(seed, i, j, 'void');
          // The same centres as the islands of an archipelago: the lattice is one.
          expect([f.x, f.y]).toEqual([islandOf(seed, i, j).x, islandOf(seed, i, j).y]);
          lands++;
          if (f.body === 'asteroid') {
            asteroids++;
            expect(f.radius).toBeLessThanOrEqual(24);
          }
        }
      expect(islandsNear(seed, 0, 0, 400, 'void').some((f) => f.islet)).toBe(false);
    }
    expect(asteroids / lands).toBeGreaterThan(1 / ASTEROID_ONE_IN - 0.1);
    expect(asteroids / lands).toBeLessThan(1 / ASTEROID_ONE_IN + 0.1);
  });

  it('a station is squared: its edge farther at the corners than on the axes, and every ray crosses it once', () => {
    const st = islandOf(5, 0, 0, 'void');
    expect(shoreAt(st, 0)).toBeCloseTo(st.radius, 5);
    expect(shoreAt(st, Math.PI / 4)).toBeGreaterThan(st.radius * 1.15);
  });

  it('draw the draft: the void outside, the plating of a station, the rock, dust and ice of an asteroid', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const grass = 'g'.repeat(S * S);
      // The start's place is all station: its floor is the path of the palette.
      expect(voidDraft(grass, seed, 0, 0, S)).toBe('p'.repeat(S * S));
      // Between the cells, the void.
      expect(voidDraft(grass, seed, 5, 5, S)).toBe(VOID_CODE.repeat(S * S));
    }
    // An asteroid has no meadow nor water: dust and ice.
    const seed = SEEDS.find((s) => islandOf(s, 1, 0, 'void').body === 'asteroid')!;
    const a = islandOf(seed, 1, 0, 'void');
    const d = voidDraft('gw'.repeat((S * S) / 2), seed, Math.floor(a.x / S), Math.floor(a.y / S), S);
    expect(d).not.toMatch(/[gw]/);
    expect(d).toMatch(/[sn]/);
  });

  it('the gates of a place of the void stand on land on both sides of the edge, and the two places agree', () => {
    for (const seed of SEEDS.slice(0, 8))
      for (let cx = -3; cx <= 3; cx++)
        for (let cy = -3; cy <= 3; cy++) {
          const here = voidGates(seed, cx, cy, S);
          const east = voidGates(seed, cx + 1, cy, S);
          const south = voidGates(seed, cx, cy + 1, S);
          expect(Math.floor(here[1] / S)).toBe(Math.floor(east[0] / S));
          expect(here[3] % S).toBe(south[2] % S);
          // Moved only where the gate of the hash was on the void, onto land on both sides.
          const base = gates(cx, cy, S, seed);
          const features = islandsNear(seed, cx * S + S / 2, cy * S + S / 2, S * 2, 'void');
          const land = (x: number, y: number) => ['land', 'beach'].includes(groundAt(features, x + 0.5, y + 0.5).ground);
          const g = here[1];
          const row = Math.floor(g / S);
          if (g !== base[1]) expect(land(cx * S + S - 1, cy * S + row) && land(cx * S + S, cy * S + row)).toBe(true);
        }
  });
});

describe('the layout over the void (T445)', () => {
  // A station on the west half, the void on the east; a rock wall across the station.
  const rows = Array.from({ length: S }, (_, r) => Array.from({ length: S }, (_, c) => (c >= 10 ? VOID_CODE : c === 5 && r > 0 && r < S - 1 ? 'r' : 'p')).join(''));

  it('never carves the void nor makes a gate of it; it joins the land and only the land', () => {
    const r = layout(rows, palette, { cx: 0, cy: 0, seed: 11, pathCode: 'p', gates: voidGates(11, 0, 0, S) });
    for (let i = 0; i < S * S; i++) if (rows[Math.floor(i / S)][i % S] === VOID_CODE) expect(r.grid[Math.floor(i / S)][i % S]).toBe(VOID_CODE);
    // The rock across the station is carved: both halves of the land are one.
    const walk = [...r.grid.join('')].map((c, i) => (c === 'p' ? i : -1)).filter((i) => i >= 0);
    for (const i of walk) expect(r.reachable.has(i)).toBe(true);
    for (const i of r.reachable) expect(r.grid.join('')[i]).not.toBe(VOID_CODE);
  });

  it('a program neither builds on the void nor opens it in the land', () => {
    const program = { type: 'all', rules: [{ in: VOID_CODE, out: 'g' }, { in: 'p', out: VOID_CODE }] } as unknown as MjNode;
    const r = layout(rows, palette, { cx: 0, cy: 0, seed: 11, pathCode: 'p', program });
    for (let i = 0; i < S * S; i++) expect(isVoid(palette[r.grid[Math.floor(i / S)][i % S]])).toBe(rows[Math.floor(i / S)][i % S] === VOID_CODE);
  });

  it('a place with no gate on its land is joined from the land nearest its middle', () => {
    const island = Array.from({ length: S }, (_, r) => Array.from({ length: S }, (_, c) => (Math.abs(c - 8.5) < 4 && Math.abs(r - 8.5) < 4 ? 'p' : VOID_CODE)).join(''));
    const r = layout(island, palette, { cx: 0, cy: 0, seed: 3, pathCode: 'p' });
    expect(r.reachable.size).toBe(64);
  });
});

describe('a world of the void in the kernel (T445)', () => {
  it('a universe of today has no void in its palette, and its drafts stay', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(k.palette[VOID_CODE]).toBeUndefined();
    expect(k.config.nature.sky).toBe('earth');
    expect(k.daySeconds()).toBe(600);
  });

  it('has the void in its palette, the start on a station, the void planned by the kernel without a call, a station named once', async () => {
    const models = new Recording();
    const k = await Kernel.boot({ files: voidFiles(), store: memoryStore(), ai: models });
    expect(k.nature()).toMatchObject({ geography: 'void', sky: 'stars' });
    expect(isVoid(k.palette[VOID_CODE])).toBe(true);
    expect(k.placeDraft(0, 0).join('')).not.toContain(VOID_CODE);
    expect(k.placeDraft(5, 5).join('')).toBe(VOID_CODE.repeat(S * S));
    // The void: the kernel's plan, no call, its name, nothing in it.
    expect(await k.planAhead(5, 5)).toBe('nuovo');
    const empty = k.chunks.get('5,5')!;
    expect(empty.stage).toBe('planned');
    expect(empty.place?.name).toBe(OPEN_VOID.it.name);
    expect(empty.tiles).toBe(VOID_CODE.repeat(S * S));
    expect(models.plans).not.toContain('5,5');
    // A land of the lattice: the Cartographer plans it and names it.
    const land = islandOf(k.config.seed, 1, 0, 'void');
    const at = [Math.floor(land.x / S), Math.floor(land.y / S)];
    expect(await k.planAhead(at[0], at[1])).toBe('nuovo');
    expect(models.plans).toContain(`${at[0]},${at[1]}`);
    const named = islandRegion(readAtlas(k.files), '1,0');
    expect(named?.name).toMatch(land.body === 'station' ? /Stazione|Anello|Molo|Cantiere/ : /Scoglio|Masso|Pietra|Sasso/);
    // The tiles of the void stayed void in the planned place, and nothing stands on them.
    const placed = k.chunks.get(`${at[0]},${at[1]}`)!;
    const draft = k.placeDraft(at[0], at[1]).join('');
    for (let i = 0; i < S * S; i++) expect(placed.tiles[i] === VOID_CODE).toBe(draft[i] === VOID_CODE);
    // Lua sees the station or the asteroid, with its body.
    expect(k.islandsSeen(0, 0, 300)[0]).toMatchObject({ id: '0,0', body: 'station' });
    expect(k.regionInfoAt(1, 1)?.island).toBe('0,0');
  }, 60_000);

  it('the body stops at the edge; no effect builds on the void nor opens it; the water does not flow there', async () => {
    const k = await Kernel.boot({ files: voidFiles(), store: memoryStore(), ai: new MockAiModels() });
    const land = islandOf(k.config.seed, 1, 0, 'void');
    const at = [Math.floor(land.x / S), Math.floor(land.y / S)];
    await k.planAhead(at[0], at[1]);
    await k.planAhead(5, 5);
    const ch = k.chunks.get('5,5')!;
    const [x, y] = [5 * S + 3, 5 * S + 3];
    expect(k.tileAt(x, y)).toBe(VOID_CODE);
    expect(k.free(x + 0.5, y + 0.5, 0.22)).toBe(false);
    expect(k.setTile(x, y, 'p')).toBe(false);
    expect(ch.tiles[3 * S + 3]).toBe(VOID_CODE);
    const placed = k.chunks.get(`${at[0]},${at[1]}`)!;
    const ground = [...placed.tiles].findIndex((c) => c !== VOID_CODE && !k.palette[c].solid);
    const [gx, gy] = [at[0] * S + (ground % S), at[1] * S + Math.floor(ground / S)];
    expect(k.setTile(gx, gy, VOID_CODE)).toBe(false);
    expect((k.water as unknown as { world: { loaded(c: number, r: number): boolean } }).world.loaded(x, y)).toBe(false);
  }, 60_000);

  it('the day of the nature: a still light is always full day, the clock keeps the earth’s; a short day turns faster', async () => {
    const still = await Kernel.boot({ files: voidFiles({ day: 0 }), store: memoryStore(), ai: new MockAiModels() });
    expect(still.daySeconds()).toBe(600);
    for (const t of [0, 150, 300, 450]) {
      still.time = t;
      expect(still.daylight()).toBe(1);
    }
    still.time = 1200;
    expect(still.day()).toBe(2);
    const short = await Kernel.boot({ files: voidFiles({ day: 300 }), store: memoryStore(), ai: new MockAiModels() });
    expect(short.daySeconds()).toBe(300);
    short.time = 600;
    expect(short.day()).toBe(2);
  }, 60_000);

  it('Lua reads the nature as it is: the void and the stars', () => {
    expect(apiErrors('local n = world.nature(); log(n.geography .. n.sky .. n.day)')).toEqual([]);
  });
});
