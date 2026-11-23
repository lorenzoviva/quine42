// Harbours, piers and reefs (T443, ADR-0230): the stamp `harbour` finds a shore and lays a pier from it out to where the water is deep, its head
// always touching the water (lengthened by one tile where it would not, a shore where even so it does not is not taken); the reefs off it are
// rock just under the water, swum over, where a hull runs aground; the seed has a pier, a reef and the environment of the harbour; the
// Cartographer is told of them in an archipelago.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { memoryStore } from '../src/kernel/repo';
import { layout } from '../src/kernel/layout';
import { run, type MjNode } from '../src/kernel/mj';
import { Rng } from '../src/kernel/rng';
import { defaultCodes, harbour, MAX_PIER, PIER_INTO_DEEP, pierTouches, SHALLOW_PIER, stampGround, type StampCodes } from '../src/kernel/stamps';
import { crossingOf, physicsOf, terrainPhysics, terrainPhysicsErrors } from '../src/kernel/nature';
import { carries, toWorld } from '../src/kernel/vehicle';
import { Council } from '../src/kernel/agents/council';
import { ARCHIPELAGO_ENVIRONMENTS, designLayouts, planChunk, SHORE_LINE, type ChunkPlan } from '../src/kernel/agents/cartography';
import { BASE_CODES, toPalette } from '../src/kernel/agents/genesis';
import { STEP } from '../src/kernel/network';
import { TIMELESS_LAYOUTS, WORLD_THEMES } from '../src/kernel/themes';
import { internalName } from '../src/kernel/internalNames';
import type { Action } from '../src/kernel/input';
import type { FileMap, TerrainDef } from '../src/kernel/types';

const S = 18;
const palette: Record<string, TerrainDef> = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']).tiles;
const layouts = JSON.parse(bundledFiles['modules/world.layouts/manifest.json']).layouts;
const codes: StampCodes = defaultCodes(palette);
const ground = stampGround(palette);

/** A coast: `land` columns of meadow and sand, then `shallow` of shallow water, the deep sea beyond; turned `turn` quarters. */
function coast(land: number, shallow: number, turn = 0, seed = 1): string[] {
  const rng = new Rng(seed);
  const rows = Array.from({ length: S }, () =>
    Array.from({ length: S }, (_, x) => (x < land ? (rng.next() < 0.15 ? 't' : x === land - 1 ? 's' : 'g') : x < land + shallow ? 'w' : 'o')),
  );
  let g = rows;
  for (let t = 0; t < turn; t++) g = g[0].map((_, x) => g.map((r) => r[x]).reverse());
  return g.map((r) => r.join(''));
}

/** The stamp alone on a grid, with the ground of the seed's palette. */
function lay(rows: string[], seed: number, c: StampCodes = codes) {
  const cells = rows.join('').split('');
  const border = new Set<number>();
  for (let i = 0; i < S; i++) for (const b of [i, (S - 1) * S + i, i * S, i * S + S - 1]) border.add(b);
  const pier = harbour(cells, S, S, border, c, new Rng(seed), { vpt: 16, claimed: new Set(), ground });
  return { cells, pier };
}

const xy = (i: number) => [i % S, Math.floor(i / S)];

describe('the reef, a depth of the water (T443)', () => {
  it('is swum over and carries no hull, whatever its draught; the validator and the Physicist know it', () => {
    const reef = palette.y;
    expect(reef.name).toBe('secca');
    expect(crossingOf(reef)).toBe('swim');
    expect(terrainPhysics(reef).depth).toBe('reef');
    expect(carries({ medium: 'water', draught: 'shallow' }, reef)).toBe(false);
    expect(carries({ medium: 'water', draught: 'deep' }, reef)).toBe(false);
    // The rest as before: a shallow hull on the shallows, a deep one only on the sea.
    expect(carries({ medium: 'water', draught: 'shallow' }, palette.w)).toBe(true);
    expect(carries({ medium: 'water', draught: 'deep' }, palette.w)).toBe(false);
    expect(carries({ medium: 'water', draught: 'deep' }, palette.o)).toBe(true);
    expect(terrainPhysicsErrors('y', reef as unknown as Record<string, unknown>)).toEqual([]);
    expect(terrainPhysicsErrors('y', { ...reef, layer: 'ground', cross: 'walk', solid: false } as unknown as Record<string, unknown>)).not.toEqual([]);
    expect(physicsOf('liquid', { cross: 'swim', depth: 'reef' }).depth).toBe('reef');
  });
});

describe('the roles of a harbour (T443)', () => {
  it('the seed has a pier and a reef; a world without them has the bridge for a pier and no reef', () => {
    expect([codes.pier, codes.reef]).toEqual(['i', 'y']);
    expect(palette.i).toMatchObject({ id: 'pier', name: 'molo', layer: 'floor', solid: false });
    expect(palette.i.indoor).toBeUndefined();
    const { i: _i, y: _y, ...without } = palette;
    const bare = defaultCodes(without);
    expect([bare.pier, bare.reef]).toEqual([bare.bridge, '']);
    expect(bare.bridge).toBe('z');
    // A world of its own: a jetty by its name, a reef by its depth, whatever their codes.
    const own = defaultCodes({ ...without, J: { name: 'pontile', color: '#a80', solid: false, cross: 'walk', layer: 'floor' }, R: { name: 'barriera', color: '#2a8', solid: true, cross: 'swim', layer: 'liquid', depth: 'reef' } });
    expect([own.pier, own.reef]).toEqual(['J', 'R']);
    // The Cartographer's words of before are the roles they mean.
    expect([internalName('timbri', 'porto'), internalName('ruoli-timbri', 'molo'), internalName('ruoli-timbri', 'secca')]).toEqual(['harbour', 'pier', 'reef']);
  });
});

describe('the pier of a harbour (T443)', () => {
  it('goes straight from a shore out until two of its tiles stand in the deep water, its head touching it; never on the border', () => {
    for (const turn of [0, 1, 2, 3])
      for (const shallow of [0, 1, 2, 4])
        for (let seed = 1; seed <= 12; seed++) {
          const rows = coast(7, shallow, turn, seed);
          const { cells, pier } = lay(rows, seed);
          const where = `turn ${turn}, shallow ${shallow}, seed ${seed}`;
          expect(pier, where).toBeDefined();
          const p = pier!;
          const flat = rows.join('');
          // Every tile was water one swims, and now is the pier.
          for (const i of p.cells) expect(ground.swum, where).toContain(flat[i]);
          for (const i of p.cells) expect(cells[i], where).toBe('i');
          // Straight, one tile after the other.
          for (let k = 1; k < p.cells.length; k++) expect(p.cells[k] - p.cells[k - 1], where).toBe(p.dy * S + p.dx);
          // It starts from a tile walked, with another walked behind it.
          const [x0, y0] = xy(p.cells[0]);
          expect(ground.walked, where).toContain(flat[(y0 - p.dy) * S + x0 - p.dx]);
          expect(ground.walked, where).toContain(flat[(y0 - 2 * p.dy) * S + x0 - 2 * p.dx]);
          // Into the deep water by two tiles, no longer than it must.
          expect(p.cells.filter((i) => flat[i] === 'o').length, where).toBe(PIER_INTO_DEEP);
          expect(p.cells.length, where).toBe(shallow + PIER_INTO_DEEP);
          expect(pierTouches(cells, S, S, p.cells, ground.deep), where).toBe(true);
          for (const i of p.cells) {
            const [x, y] = xy(i);
            expect(x > 0 && y > 0 && x < S - 1 && y < S - 1, where).toBe(true);
          }
        }
  });

  it('where the water is shallow all the way, a short jetty that touches it; inland or by a canal, nothing', () => {
    // A lake: meadow around a pond of shallow water.
    const lake = Array.from({ length: S }, (_, y) => Array.from({ length: S }, (_, x) => (x >= 6 && x <= 12 && y >= 5 && y <= 12 ? 'w' : 'g')).join(''));
    for (let seed = 1; seed <= 10; seed++) {
      const { cells, pier } = lay(lake, seed);
      expect(pier!.cells.length).toBeLessThanOrEqual(SHALLOW_PIER);
      expect(pier!.cells.length).toBeGreaterThanOrEqual(2);
      expect(pierTouches(cells, S, S, pier!.cells, ground.swum)).toBe(true);
    }
    // Inland: nothing is drawn.
    const meadow = Array.from({ length: S }, () => 'g'.repeat(S));
    const inland = lay(meadow, 3);
    expect(inland.pier).toBeUndefined();
    expect(inland.cells.join('')).toBe(meadow.join(''));
    // A ditch one tile wide and two long: a pier there would touch no water, even lengthened; the shore is not taken.
    const canal = meadow.map((r, y) => (y >= 4 && y <= 5 ? r.slice(0, 8) + 'w' + r.slice(9) : r));
    expect(lay(canal, 5).pier).toBeUndefined();
    expect(MAX_PIER).toBeGreaterThan(PIER_INTO_DEEP);
  });

  it('lays reefs off its head, beside the way in, where the world has a reef; none where it has not', () => {
    let seen = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { cells, pier } = lay(coast(6, 2, seed % 4, seed), seed);
      const p = pier!;
      seen += p.reefs.length;
      expect(p.reefs.length).toBeLessThanOrEqual(3);
      const [hx, hy] = xy(p.cells[p.cells.length - 1]);
      for (const r of p.reefs) {
        expect(cells[r]).toBe('y');
        const [x, y] = xy(r);
        // Never by the pier, never on its line.
        for (const c of p.cells) {
          const [cx, cy] = xy(c);
          expect(Math.max(Math.abs(cx - x), Math.abs(cy - y))).toBeGreaterThanOrEqual(2);
        }
        expect(Math.abs(p.dx ? y - hy : x - hx)).toBeGreaterThanOrEqual(3);
        // On the sea's side of the shore.
        const [rx, ry] = xy(p.cells[0]);
        expect((x - rx) * p.dx + (y - ry) * p.dy).toBeGreaterThanOrEqual(0);
      }
    }
    expect(seen).toBeGreaterThan(30);
    const { pier } = lay(coast(6, 2), 1, { ...codes, reef: '' });
    expect(pier!.reefs).toEqual([]);
  });

  it('in a layout: the pier is walked and reached, the water stays water, and the program after it does not lose it', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const draft = coast(8, 2, seed % 4, seed);
      const r = layout(draft, palette, { cx: seed, cy: 0, seed: 9, pathCode: 'p', swim: true, program: layouts.harbour.program as MjNode });
      const piers = [...r.grid.join('')].map((c, i) => (c === 'i' ? i : -1)).filter((i) => i >= 0);
      expect(piers.length, `seme ${seed}`).toBeGreaterThanOrEqual(2 + PIER_INTO_DEEP);
      for (const i of piers) expect(r.reachable.has(i), `seme ${seed}`).toBe(true);
      // Its houses stand on the land, never on the water.
      for (const b of r.lots) for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) expect('wo', `seme ${seed}`).not.toContain(draft[y][x]);
      // The sea is not dug: no path on it.
      expect(r.carved).toBe(0);
      // Doors and gates are reached (rule 10).
      for (const d of [...r.lots.flatMap((b) => b.doors), ...r.gates]) expect(r.reachable.has(d) || palette[r.grid[Math.floor(d / S)][d % S]].solid, `seme ${seed}`).toBe(true);
    }
  });

  it('a stamp alone, without a layout, lays it on the base codes', () => {
    const g = { w: S, h: S, cells: coast(7, 2).join('').split('') };
    run({ type: 'stamp', shape: 'harbour' } as MjNode, g, 4);
    expect(g.cells.filter((c) => c === 'p').length).toBeGreaterThanOrEqual(2);
  });
});

describe('the harbour of the seed (T443)', () => {
  it('is an environment of no age, with a pier where the place has a coast', () => {
    expect(layouts.harbour).toMatchObject({ name: 'Porto', environment: 'mixed' });
    expect(TIMELESS_LAYOUTS.has('harbour')).toBe(true);
  });

  it('is the offline Cartographer’s only on the shore of an island, and never a region of the atlas', async () => {
    const m = new MockAiModels();
    const ask = (data: Record<string, unknown>) => m.text({ task: 'chunk.plan', prompt: '', schema: {}, data } as unknown as TextCall).then((t) => JSON.parse(t).environment);
    const ctx = (cx: number, island: boolean, terrain: string) => ({ cx, cy: 0, attempt: 0, terrain, neighbors: [], layouts: Object.keys(layouts).map((id) => ({ id })), catalog: [], fragments: [], wanted: [], start: false, ...(island ? { island: { name: 'Isola' } } : {}) });
    const shore: string[] = [];
    for (let cx = 1; cx <= 30; cx++) {
      expect(await ask(ctx(cx, false, 'mare 50%, prato 50%'))).not.toBe('harbour');
      expect(await ask(ctx(cx, true, 'prato 100%'))).not.toBe('harbour');
      shore.push(await ask(ctx(cx, true, 'mare 40%, acqua 10%, prato 50%')));
    }
    expect(shore.filter((e) => e === 'harbour').length).toBeGreaterThan(5);
    const atlas = JSON.parse(await m.text({ task: 'genesis.atlas', prompt: '', schema: {}, data: { layouts: Object.entries(layouts).map(([id, l]: [string, any]) => ({ id, name: l.name, description: l.description })) } } as unknown as TextCall));
    expect(atlas.regions.map((r: { environment: string }) => r.environment)).not.toContain('harbour');
  });
});

describe('the Cartographer of an archipelago (T443)', () => {
  /** The local models, keeping the prompts. */
  function recording() {
    const m = new MockAiModels();
    const prompts: Record<string, string> = {};
    const text = m.text.bind(m);
    m.text = async (call: TextCall) => ((prompts[call.task] = call.prompt), text(call));
    return { c: new Council(m, () => ({ files: bundledFiles, palette, catalog: [] })), prompts };
  }

  it('writes the environments of the shores at the Genesis of an archipelago, and the harbour among the stamps', async () => {
    const { c, prompts } = recording();
    await designLayouts(c, palette, '', [], 'archipelago');
    expect(prompts['genesis.layouts']).toContain(ARCHIPELAGO_ENVIRONMENTS);
    expect(prompts['genesis.layouts']).toMatch(/harbour/);
    const other = recording();
    await designLayouts(other.c, palette);
    expect(other.prompts['genesis.layouts']).not.toContain(ARCHIPELAGO_ENVIRONMENTS);
  });

  it('is told of the harbour on the places of an island', async () => {
    const { c, prompts } = recording();
    const ctx = { cx: 2, cy: 1, terrain: 'mare 50%, prato 50%', neighbors: [], layouts: [{ id: 'harbour', name: 'Porto', description: '', environment: 'mixed' }], catalog: [], fragments: [], wanted: [], start: false, attempt: 0 };
    await planChunk(c, { ...ctx, island: { name: 'Isola del Granchio', description: 'sabbia' } } as any);
    expect(prompts['chunk.plan']).toContain(SHORE_LINE);
    await planChunk(c, ctx as any);
    expect(prompts['chunk.plan']).not.toContain(SHORE_LINE);
  });

  it('says the reef among the depths the Physicist may give, and a pier and a reef among the terrains of the islands', () => {
    const src = readFileSync(new URL('../src/kernel/agents/genesis.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/planks \(for the piers\), a reef/);
    expect(src).toMatch(/shallow, deep or a reef/);
  });
});

// --- A ship on a reef, in the kernel --------------------------------------------------------------------------------------------------

const BOAT_XML = readFileSync(new URL('./fixtures/barca-prova.xml', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const BOAT = 'veicolo.prova';

function withBoat(): FileMap {
  const index = JSON.parse(bundledFiles['models/index.json']);
  index['barca-prova'] = { class: 'object', name: 'Barca di prova' };
  const manifest = {
    id: BOAT,
    name: 'Barca',
    kind: 'entity',
    appearance: { glyph: 'B', color: '#8a5a2b', model: 'barca-prova', class: 'object' },
    physics: { solid: true, radius: 0.5 },
    vehicle: { medium: 'water', speed: 3, accel: 2, turn: 1 },
  };
  return { ...bundledFiles, 'models/index.json': JSON.stringify(index, null, 1), 'models/barca-prova.xml': BOAT_XML, [`modules/${BOAT}/manifest.json`]: JSON.stringify(manifest, null, 1) };
}

describe('a ship on a reef (T443)', () => {
  it('runs aground: it stops where the reef begins, the helmsman is told; a swimmer goes on over it', async () => {
    const k = await Kernel.boot({ files: withBoat(), store: memoryStore(), ai: new MockAiModels() });
    for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
    }
    k.tick(1 / 60);
    k.carpet()!.active = false;
    const c = k.wandererCarpet();
    const x0 = Math.floor(c.x) + 3, y0 = Math.floor(c.y) + 4;
    // A pool of deep water 11 × 7 with a reef across it, six tiles east of the boat's middle.
    for (let r = 0; r <= 8; r++)
      for (let col = 0; col <= 12; col++) expect(k.setTile(x0 + col, y0 + r, r >= 1 && r <= 7 && col >= 1 && col <= 11 ? (col === 10 ? 'y' : 'o') : 'g')).toBe(true);
    for (const id of k.ecs.query('pos')) {
      const p = k.ecs.get(id, 'pos');
      if (id !== k.wandererEntity && Math.abs(p.x - (x0 + 6.5)) < 14 && Math.abs(p.y - (y0 + 4.5)) < 12) k.ecs.destroy(id);
    }
    const boat = k.spawnModuleEntity(k.modules.get(BOAT)!, x0 + 4.5, y0 + 4.5);
    k.ecs.get(boat, 'vehicle').heading = Math.PI / 2;
    const fc = k.ecs.get(boat, 'form');
    fc.yaw = Math.PI / 2;
    await k.forms.wait(fc.model, fc.seed, fc.tint);
    k.tick(1 / 60);
    const b = k.ecs.get(boat, 'pos');
    const [wx, wy] = toWorld(0, -0.75, Math.PI / 2);
    const { ox, oy } = k.offset();
    const p = k.wandererPos();
    delete p.z;
    Object.assign(p, { x: b.x + wx - ox, y: b.y + wy - oy });
    k.tick(1 / 60);
    const said: string[] = [];
    k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
    const bumps: unknown[] = [];
    k.bus.on('vehicle:bumped', (e: unknown) => bumps.push(e));
    await k.perform(boat, 'helm');
    const hold = (keys: Action[], s: number) => {
      for (const key of keys) k.input.setHeld(key, true);
      for (let i = 0; i < s * 60; i++) k.tick(1 / 60);
      for (const key of keys) k.input.setHeld(key, false);
    };
    hold(['up'], 4);
    expect(k.ecs.get(boat, 'vehicle').bumped).toBe(true);
    // The bow (1.775 tiles ahead of its middle) at the reef's edge, not over it.
    expect(k.ecs.get(boat, 'pos').x + 1.775).toBeLessThanOrEqual(x0 + 10);
    expect(k.ecs.get(boat, 'pos').x + 1.775).toBeGreaterThan(x0 + 9.9);
    expect(said).toContain('Lo scafo tocca la secca e si ferma.');
    expect(bumps).toContainEqual({ id: boat, reef: true });
    // A body swims over it: the reef is water one swims.
    expect(k.bodyFree(x0 + 10.5, y0 + 4.5, 0.22)).toBe(true);
  }, 60_000);
});

describe('from the pier aboard (T443)', () => {
  it('the deck of the seed’s vessel is walked from where one boards, and a jump from the head of a pier lands on it', async () => {
    const id = 'veicolo.vela';
    const manifest = { id, name: 'Barca a vela', kind: 'entity', appearance: { glyph: 'B', color: '#8a5a2b', model: 'vessel', class: 'vessel', size: 'large' }, physics: { solid: true, radius: 0.5 }, vehicle: { medium: 'water', speed: 3, draught: 'deep' } };
    const k = await Kernel.boot({ files: { ...bundledFiles, [`modules/${id}/manifest.json`]: JSON.stringify(manifest, null, 1) }, store: memoryStore(), ai: new MockAiModels() });
    for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
    }
    k.tick(1 / 60);
    k.carpet()!.active = false;
    const c = k.wandererCarpet();
    const x0 = Math.floor(c.x) + 2, y0 = Math.floor(c.y) + 2;
    // A sea 9 × 11 with a pier of four tiles from the shore (x0) out to x0 + 4, on the row y0 + 5.
    for (let r = 0; r <= 10; r++) for (let col = 0; col <= 10; col++) expect(k.setTile(x0 + col, y0 + r, col === 0 ? 'g' : r === 5 && col <= 4 ? 'i' : 'o')).toBe(true);
    for (const e of k.ecs.query('pos')) {
      const p = k.ecs.get(e, 'pos');
      if (e !== k.wandererEntity && Math.abs(p.x - (x0 + 5)) < 14 && Math.abs(p.y - (y0 + 5)) < 14) k.ecs.destroy(e);
    }
    // The boat with its side against the head of the pier, the bow to the south: its boarding (amidships) by the pier.
    const boat = k.spawnModuleEntity(k.modules.get(id)!, x0 + 5 + 1.35, y0 + 5.5);
    k.ecs.get(boat, 'vehicle').heading = 0;
    const fc = k.ecs.get(boat, 'form');
    fc.yaw = 0;
    await k.forms.wait(fc.model, fc.seed, fc.tint);
    k.tick(1 / 60);
    const f = k.forms.ready(fc.model, fc.seed)!;
    expect(f.base).toBeGreaterThan(0);
    // Its deck: a body stands on it (before T443 every floor of it was out of reach from the water).
    const b = k.ecs.get(boat, 'pos');
    const deck = k.floorAt(b.x, b.y - 0.5, 9);
    expect(k.deckAt(b.x, b.y - 0.5, deck)).toBe(boat);
    expect((k as any).formBlocks(b.x - 0.4, b.y - 0.5, 0.22, deck)).toBe(false);
    // On the head of the pier, a little under the deck: a jump towards the boat lands aboard.
    const { ox, oy } = k.offset();
    const p = k.wandererPos();
    delete p.z;
    Object.assign(p, { x: x0 + 4.75 - ox, y: y0 + 5.5 - oy });
    k.tick(1 / 60);
    const pier = k.wandererPos().z!;
    expect(deck - pier).toBeGreaterThan(0.1);
    expect(deck - pier).toBeLessThan(0.5);
    k.wandererComp().facing = 'right';
    expect(k.jump()).toBe(true);
    for (let i = 0; i < 60; i++) k.tick(1 / 60);
    expect(k.aboard()).toBe(boat);
    expect(k.swimming()).toBe(false);
  }, 60_000);
});

// --- T505: nothing solid on a 1-tile-wide pier (rule 10, ADR-0064, ADR-0230) ---------------------------------------------------------

/**
 * Checks that every pier tile of a chunk is free of solid entities and that its head (the tile farthest into the water) is reachable on foot
 * from a non-pier walkable shore tile (4-connected walk through free, non-solid tiles, within `STEP` in levels when `levels` is provided).
 */
function assertPierWalkableOnFoot(k: Kernel, cx: number, cy: number, pierTiles: ReadonlySet<number>, label: string): void {
  const S = k.config.chunkSize;
  const ch = k.chunks.get(`${cx},${cy}`)!;
  expect(pierTiles.size, `${label}: deve avere almeno un molo`).toBeGreaterThanOrEqual(2);

  // No building lot overlaps any pier tile.
  for (const lot of ch.lots) {
    for (const c of [...lot.floor, ...lot.walls, ...lot.doors]) {
      expect(pierTiles.has(c), `${label}: lotto sul molo alla casella ${c}`).toBe(false);
    }
  }

  // No solid entity (building, furniture, obstacle) stands on any pier tile.
  const solidTiles = new Set<number>();
  for (const id of k.ecs.query('chunk', 'pos', 'body')) {
    if (k.ecs.get(id, 'chunk').key !== ch.key) continue;
    if (!k.ecs.get(id, 'body')?.solid) continue;
    const p = k.ecs.get(id, 'pos');
    const lx = Math.floor(p.x) - cx * S;
    const ly = Math.floor(p.y) - cy * S;
    if (lx >= 0 && ly >= 0 && lx < S && ly < S) {
      const idx = ly * S + lx;
      expect(pierTiles.has(idx), `${label}: entità solida (${k.ecs.get(id, 'module')?.id ?? k.ecs.get(id, 'form')?.model}) sul molo a (${lx},${ly})`).toBe(false);
      solidTiles.add(idx);
    }
  }

  // Every pier tile itself is walked and free of solid bodies.
  for (const idx of pierTiles) {
    const lx = idx % S, ly = Math.floor(idx / S);
    const def = k.palette[ch.tiles[idx]];
    expect(def?.solid, `${label}: casella molo (${lx},${ly}) non calpestabile`).toBe(false);
    expect(k.free(cx * S + lx + 0.5, cy * S + ly + 0.5, 0.2), `${label}: casella molo (${lx},${ly}) bloccata`).toBe(true);
  }

  // BFS on foot (walkable, non-solid, step <= STEP) from all non-pier shore tiles adjacent to the pier.
  const levels = ch.network?.levels;
  const walkable = (i: number) => {
    if (solidTiles.has(i)) return false;
    const def = k.palette[ch.tiles[i]];
    if (!def || def.solid) return false;
    const lx = i % S, ly = Math.floor(i / S);
    return k.free(cx * S + lx + 0.5, cy * S + ly + 0.5, 0.2);
  };
  const DIRS: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const shoreStarts: number[] = [];
  for (const p of pierTiles) {
    const x = p % S, y = Math.floor(p / S);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
      const n = ny * S + nx;
      if (!pierTiles.has(n) && walkable(n) && (!levels || Math.abs(levels[n] - levels[p]) <= STEP)) shoreStarts.push(n);
    }
  }
  expect(shoreStarts.length, `${label}: il molo non tocca nessuna riva libera a piedi`).toBeGreaterThan(0);

  const reached = new Set<number>(shoreStarts);
  const queue = [...shoreStarts];
  while (queue.length) {
    const cur = queue.pop()!;
    const x = cur % S, y = Math.floor(cur / S);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
      const n = ny * S + nx;
      if (reached.has(n) || !walkable(n)) continue;
      if (levels && Math.abs(levels[n] - levels[cur]) > STEP) continue;
      reached.add(n);
      queue.push(n);
    }
  }

  // Every pier tile — including its head — is reached on foot from the shore.
  for (const p of pierTiles) {
    expect(reached.has(p), `${label}: casella molo (${p % S},${Math.floor(p / S)}) non raggiungibile a piedi dalla riva`).toBe(true);
  }
}

describe('nothing solid on a 1-tile-wide pier (T505)', () => {
  it('reproduces the T503 shed-on-pier case: outdoor floors are never indoor, legacy indoor bridges never become lots', () => {
    // 1. toPalette never marks outdoor floor terrains (bridges, piers, jetties) as `indoor: true`, while indoor floors stay `indoor: true`.
    const raw = [
      ...Object.entries(BASE_CODES).map(([code, b]) => ({ code, name: code === 'f' ? 'pavimento di cotto' : b.meaning, description: b.meaning, color: '#888888', layer: b.layer, solid: b.solid, speed: 1 })),
      { code: 'l', name: 'lastricato', description: 'pietre lisce', color: '#9c958c', layer: 'floor' as const, solid: false, speed: 1 },
      { code: 'z', name: 'ponte levatoio', description: 'assi sul fossato', color: '#8b6a42', layer: 'floor' as const, solid: false, speed: 1 },
      { code: 'i', name: 'molo', description: 'tavole su pali', color: '#9c7a4e', layer: 'floor' as const, solid: false, speed: 1 },
    ];
    const pal = toPalette(raw, true);
    expect(pal.f.indoor).toBe(true);
    expect(pal.l.indoor).toBe(true);
    expect(pal.z.indoor).toBeUndefined();
    expect(pal.i.indoor).toBeUndefined();

    // 2. Legacy palette where `z` (ponte levatoio) erroneously carried `indoor: true` (exact T503 bug):
    //    `defaultCodes` refuses `z` for pier/bridge, and `findLots` ignores wall-less/door-less floors.
    const legacyPal: Record<string, TerrainDef> = {
      ...palette,
      z: { ...palette.z, indoor: true },
    };
    delete legacyPal.i;
    const legacyCodes = defaultCodes(legacyPal, 'p');
    expect(legacyCodes.bridge).toBe('p');
    expect(legacyCodes.pier).toBe('p');

    // Even if a program explicitly forces an `indoor: true` code (`z`) onto the harbour pier, `findLots` excludes `piers` and creates no lot.
    const forcedPier = layout(coast(7, 2, 0, 3), legacyPal, { cx: -3, cy: 0, seed: 1337, pathCode: 'p', swim: true, program: { type: 'stamp', shape: 'harbour', codes: { pier: 'z' } } as MjNode });
    expect(forcedPier.piers.size).toBeGreaterThanOrEqual(2);
    expect(forcedPier.lots).toEqual([]);

    // Running the harbour layout on the legacy palette produces pier cells in `result.piers` and ZERO lots on the pier.
    const res = layout(coast(7, 2, 0, 3), legacyPal, { cx: -3, cy: 0, seed: 1337, pathCode: 'p', swim: true, program: layouts.harbour.program as MjNode });
    expect(res.piers.size).toBeGreaterThanOrEqual(2);
    for (const b of res.lots) {
      for (const c of [...b.floor, ...b.walls, ...b.doors]) expect(res.piers.has(c)).toBe(false);
    }

    // A rule after the harbour stamp cannot overwrite pier tiles with walls or trees.
    const hostile: MjNode = {
      type: 'sequence',
      children: [
        { type: 'stamp', shape: 'harbour' },
        { type: 'all', rules: [{ in: 'i', out: 'h' }] },
      ],
    };
    const rHostile = layout(coast(7, 2, 0, 5), palette, { cx: 1, cy: 1, seed: 7, pathCode: 'p', swim: true, program: hostile });
    expect(rHostile.piers.size).toBeGreaterThanOrEqual(2);
    for (const c of rHostile.piers) expect(rHostile.grid[Math.floor(c / S)][c % S]).toBe('i');
  });

  it('never places a solid entity on the leaf head of a 1-tile-wide pier, even when it is the only non-articulation tile', async () => {
    const ai = new MockAiModels();
    ai.latency = 0;
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
    const cx = 30, cy = 30;
    const g = (await import('../src/kernel/layout')).gates(cx, cy, S, k.config.seed);
    const westRow = Math.floor(g[0] / S);
    const eastRow = Math.floor(g[1] / S);
    const mid = 12;
    // Everything is deep sea, except a 1-tile-wide road joining westGate to eastGate (both gates are `occupied`, all interior tiles are
    // articulation points) and a 3-tile pier (`i`) sticking out from (5, westRow): the pier's head is the ONLY non-articulation walkable tile!
    const dir = westRow + 3 < S - 1 ? 1 : -1;
    const draftRows = Array.from({ length: S }, (_, r) =>
      Array.from({ length: S }, (_, c) => {
        if (r === westRow && c <= mid) return 'p';
        if (c === mid && r >= Math.min(westRow, eastRow) && r <= Math.max(westRow, eastRow)) return 'p';
        if (r === eastRow && c >= mid) return 'p';
        if (c === 5 && [1, 2, 3].some((step) => r === westRow + dir * step)) return 'i';
        return 'o';
      }).join(''),
    );
    const res = layout(draftRows, palette, { cx, cy, seed: k.config.seed, pathCode: 'p', swim: true });
    const head = (westRow + dir * 3) * S + 5;
    expect(res.piers.has(head)).toBe(true);
    const plan: ChunkPlan = {
      place: { name: 'Molo Stretto', description: 'Un molo sottile nel mare.' },
      layout: 'harbour',
      vpt: 16,
      swim: true,
      objects: [{ module: 'obj.chest', where: 'outside' }, { module: 'object.sign', where: 'anywhere' }],
      ground: ['Mela rossa'],
      fresh: [],
      runes: [],
    };
    const place = (k as any).placementsOf({ cx, cy, key: `${cx},${cy}` }, plan, res);
    for (const o of place.objects) expect(o.cell, 'nessun solido sulla testa foglia del molo').toBeUndefined();
    // Non-solid ground items may still be placed.
    expect(place.ground[0].cell).toBeDefined();
  });

  it('on seed harbours: no solid obstacle sits on any pier tile (including its head) and the head is reachable on foot', async () => {
    const ai = new MockAiModels();
    ai.latency = 0;
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
    for (let i = 0; i < 60 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 5));
    }
    const kk = k as any;

    // Stress-test across all 4 coast orientations and many solid objects (chests, counters, signs, wells) to try to hit even the leaf head of the pier.
    const solidPlan = (cx: number): ChunkPlan => ({
      place: { name: `Porto di prova ${cx}`, description: 'Un molo sul mare.' },
      layout: 'harbour',
      vpt: 16,
      swim: true,
      objects: [
        { module: 'obj.chest', where: 'outside' },
        { module: 'obj.counter', where: 'outside' },
        { module: 'object.sign', where: 'outside' },
        { module: 'object.well', where: 'outside' },
        { module: 'obj.bed', where: 'anywhere' },
        { module: 'obj.cupboard', where: 'outside' },
        { module: 'object.bush', where: 'outside' },
        { module: 'obj.chest', where: 'outside' },
        { module: 'object.sign', where: 'anywhere' },
        { module: 'object.well', where: 'anywhere' },
      ],
      ground: ['Mela rossa'],
      fresh: [],
      runes: [],
    });

    for (let idx = 0; idx < 8; idx++) {
      const cx = 20 + idx, cy = 20;
      const draftRows = coast(7, idx % 2 === 0 ? 2 : 3, idx % 4, idx + 1);
      const key = `${cx},${cy}`;
      const ch = { cx, cy, key, draft: draftRows.join(''), tiles: draftRows.join(''), lots: [], stage: 'draft' as const, version: 0 };
      k.chunks.set(key, ch as any);
      const plan = solidPlan(idx);
      const { result } = kk.layoutOf(ch, plan, kk.pathCode());
      expect(result.piers.size, `porto seme ${idx}`).toBeGreaterThanOrEqual(2);
      kk.applyPlan(ch, plan);
      assertPierWalkableOnFoot(k, cx, cy, result.piers, `porto seme ${idx}`);
    }
  }, 30_000);

  it('on offline Pirates harbours (true relief + archipelago): no shed or solid on any pier, every pier head reachable on foot', async () => {
    const ai = new MockAiModels();
    ai.latency = 0;
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
    const pirates = WORLD_THEMES.find((t) => t.id === 'pirates')!;
    expect(await k.runGenesis(pirates.text)).toBe(true);
    expect(k.config.nature.relief).toBe('true');
    expect(k.config.nature.geography).toBe('archipelago');
    // The drawbridge/pier code `z` generated by Genesis must not be `indoor`.
    expect(k.palette.z?.indoor).toBeUndefined();

    // Plan chunks across the archipelago to cover multiple offline harbours (including 0,2 and -3,-1 where T503's shed appeared).
    k.carpet()!.active = false;
    const coords: Array<[number, number]> = [[0, 0], [0, 2], [-3, 0], [-3, -1], [-2, 0], [2, 0]];
    for (const [cx, cy] of coords) {
      const p = k.wandererPos();
      const { ox, oy } = k.offset();
      p.x = cx * S + 9 - ox;
      p.y = cy * S + 9 - oy;
      for (let i = 0; i < 200 && k.chunks.get(`${cx},${cy}`)?.stage !== 'planned'; i++) {
        k.tick(1 / 60);
        await new Promise((r) => setTimeout(r, 5));
      }
    }
    // Keep stepping briefly so neighbouring harbours in flight also finish planning.
    for (let i = 0; i < 40; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 5));
    }

    const kk = k as any;
    let harboursWithPier = 0;
    for (const ch of k.chunks.values()) {
      if (ch.stage !== 'planned' || ch.plan?.layout !== 'harbour') continue;
      const { result } = kk.layoutOf(ch, ch.plan, kk.pathCode(), true);
      if (!result.piers.size) continue;
      harboursWithPier++;
      assertPierWalkableOnFoot(k, ch.cx, ch.cy, result.piers, `porto Pirati (${ch.key})`);
    }
    expect(harboursWithPier).toBeGreaterThanOrEqual(2);
  }, 60_000);
});
