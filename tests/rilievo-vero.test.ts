// True relief (T475, ADR-0256, `docs/design/terreno-3d.md` § 3.1, § 6):
// - `nature.relief: 'true'` chosen at Genesis from the theme (western, pirates, space; medieval stays hilly) and fixed like `game`;
// - `generate_relief(cx, cy, seed, size)` in the seed generator producing massifs, terraces, cliffs, passes, basins and underwater bed;
// - `TrueRelief` reading Lua without trusting it (`parseRelief`, bounds `[-RELIEF_DEPTH, RELIEF_PEAK]`), eliminating tiny deep pits
//   (`mendPits`), aligning gate levels across chunk edges (`gateEdgeLevel`), falling back cleanly on fault (rule 7);
// - `worldLevels`, `chunkLevels` and `blockLevel` with `keepCliffs` keeping cliffs intact while keeping water flat and lots flat on their
//   terrace (block lots as mountain plateaus);
// - lots placed by stamps and rewrite rules stay on terraces and never straddle cliffs (`onTerrace`);
// - `k` becomes walkable bare mountain rock in true-relief worlds (no boulder model), while `r` stays solid boulder;
// - Cartographer request (`PlanContext.relief` / `reliefLine`) carries elevation, terraces and cliffs (`enclave` in schema only when kept);
// - multiplayer thin clients receive `ChunkView.relief` (validated by `readRelief`) and match server ground levels without generator Lua.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel, type Chunk } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { memoryStore } from '../src/kernel/repo';
import {
  chunkLevels,
  gateEdgeLevel,
  LEVEL,
  mendPits,
  onTerrace,
  parseRelief,
  readRelief,
  RELIEF_DEPTH,
  RELIEF_PEAK,
  TrueRelief,
  worldLevels,
} from '../src/kernel/relief';
import { blockLevel } from '../src/kernel/block';
import { gates, layout } from '../src/kernel/layout';
import { placeNetwork, STEP } from '../src/kernel/network';
import { DEFAULT_NATURE, hasTrueRelief, repairNature, sameNature } from '../src/kernel/nature';
import { keptNature } from '../src/kernel/reshape';
import { natureOfBand, planetPlace } from '../src/kernel/planets';
import { WORLD_THEMES } from '../src/kernel/themes';
import { baseCodesFor, toPalette } from '../src/kernel/agents/genesis';
import { reliefLine } from '../src/kernel/agents/cartography';
import { defaultCodes, stamp } from '../src/kernel/stamps';
import { Rng } from '../src/kernel/rng';
import type { MjNode } from '../src/kernel/mj';
import type { TerrainDef } from '../src/kernel/types';
import { fakeLink, type ChunkView } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { playerFiles } from '../src/session/files';

const S = 18;

function trueReliefFiles(extraNature: Record<string, unknown> = {}, extraCfg: Record<string, unknown> = {}) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const terrain = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']);
  // Make k walkable bare rock in the manifest (as Genesis writes it for true-relief worlds).
  terrain.tiles.k = { id: 'mountain', name: 'monte', description: 'roccia nuda di montagna', color: '#6e6a66', solid: false, cross: 'walk', layer: 'ground', speed: 0.9 };
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, ...extraCfg, nature: { ...DEFAULT_NATURE, relief: 'true', ...extraNature } }, null, 2) + '\n',
    'modules/world.terrain/manifest.json': JSON.stringify(terrain, null, 2) + '\n',
  };
}

const levelOf = (k: Kernel, c: number, r: number) => Math.round(k.groundAt(c + 0.5, r + 0.5) / LEVEL);

describe('nature.relief and themes (T475)', () => {
  it('repairs, compares and locks relief at Genesis (never reshaped afterwards)', () => {
    const plain = repairNature({});
    const tr = repairNature({ relief: 'true' });
    expect(hasTrueRelief(plain)).toBe(false);
    expect(hasTrueRelief(tr)).toBe(true);
    expect(plain.relief).toBeUndefined();
    expect(tr.relief).toBe('true');
    expect(sameNature(plain, tr)).toBe(false);
    expect(sameNature(tr, { ...DEFAULT_NATURE, relief: 'true' })).toBe(true);
    // keptNature preserves the Genesis relief and rejects later changes to it.
    expect(keptNature(tr, { ...DEFAULT_NATURE, gravity: 0.5 }).relief).toBe('true');
    expect(keptNature(plain, { ...DEFAULT_NATURE, relief: 'true', gravity: 0.5 }).relief).toBeUndefined();
    // Planets carry optional relief through repairNature and natureOfBand.
    const withPlanet = repairNature({ geography: 'void', planets: [{ name: 'Rupi', relief: 'true' }, { name: 'Piana' }] });
    expect(withPlanet.planets?.[0].relief).toBe('true');
    expect(withPlanet.planets?.[1].relief).toBeUndefined();
    expect(natureOfBand(withPlanet, 1).relief).toBe('true');
    expect(natureOfBand(withPlanet, 2).relief).toBeUndefined();
  });

  it('western, pirates and space themes bring true relief; medieval stays hilly', () => {
    const byId = Object.fromEntries(WORLD_THEMES.map((t) => [t.id, repairNature(t.nature)]));
    expect(byId.western.relief).toBe('true');
    expect(byId.pirates.relief).toBe('true');
    expect(byId.pirates.geography).toBe('archipelago');
    expect(byId.space.relief).toBe('true');
    for (const id of ['medievale', 'steampunk', 'moderno', 'futuristico']) expect(byId[id].relief, id).toBeUndefined();
  });

  it('keepNature writes universe.json back if someone tries to flip relief after boot', async () => {
    const k = await Kernel.boot({ files: trueReliefFiles(), store: memoryStore(), ai: new MockAiModels() });
    expect(k.nature().relief).toBe('true');
    const changed = {
      ...k.files,
      'universe.json': JSON.stringify({ ...JSON.parse(k.files['universe.json']), nature: DEFAULT_NATURE }, null, 2) + '\n',
    };
    k.applyFiles(changed);
    expect(k.nature().relief).toBe('true');
    expect(JSON.parse(k.repo.working['universe.json']).nature.relief).toBe('true');
  });
});

describe('pure relief primitives: parseRelief, readRelief, gateEdgeLevel, mendPits, onTerrace (T475)', () => {
  it('parseRelief parses 1-line and 2-line strings, clamps to kernel bounds and rejects garbage', () => {
    const one = parseRelief('0,5,999,-999', 2);
    expect(one).toBeDefined();
    expect([...one!.levels]).toEqual([0, 5, RELIEF_PEAK, -RELIEF_DEPTH]);
    expect([...one!.bed]).toEqual([0, 5, RELIEF_PEAK, -RELIEF_DEPTH]);

    const two = parseRelief('10,0,4,0\n10,-15,1,50', 2);
    expect(two).toBeDefined();
    expect([...two!.levels]).toEqual([10, 0, 4, 0]);
    // Bed is never above surface level.
    expect([...two!.bed]).toEqual([10, -15, 1, 0]);

    for (const bad of [null, undefined, 123, '', '1,2,3', '1,NaN,3,4', '1,Infinity,3,4', '1,2,3,4\n1,2']) {
      expect(parseRelief(bad, 2), String(bad)).toBeUndefined();
    }
  });

  it('readRelief validates wire arrays strictly without trusting them', () => {
    expect([...readRelief([0, 10, -5, 64], 2)!]).toEqual([0, 10, -5, 64]);
    for (const bad of [null, '0,0,0,0', [0, 0, 0], [0, 1.5, 0, 0], [0, RELIEF_PEAK + 1, 0, 0], [0, -RELIEF_DEPTH - 1, 0, 0], [0, NaN, 0, 0]]) {
      expect(readRelief(bad, 2)).toBeUndefined();
    }
  });

  it('gateEdgeLevel is symmetric across chunk edges and keeps every gate within STEP', () => {
    expect(gateEdgeLevel(10, 12, 0)).toBe(10);
    expect(gateEdgeLevel(12, 10, 0)).toBe(12);
    const a = gateEdgeLevel(16, 4, 0);
    const b = gateEdgeLevel(4, 16, 0);
    expect(a).toBe(b);
    expect(a).toBe(10);
    // Coastal cliff meeting sea: land side steps down to sea + STEP, sea stays sea.
    expect(gateEdgeLevel(14, -12, 0)).toBe(STEP);
    expect(gateEdgeLevel(-12, 14, 0)).toBe(-12);
  });

  it('mendPits raises 1-3 tile deep traps while keeping >=4 tile valleys and borders untouched', () => {
    const lv = new Int16Array(64).fill(12);
    // 2-tile deep pit in the interior: depth 12 > JUMP (4).
    lv[2 * 8 + 2] = 0;
    lv[2 * 8 + 3] = 0;
    // 4-tile valley in the interior: kept as a real enclave/basin.
    for (const i of [5 * 8 + 2, 5 * 8 + 3, 6 * 8 + 2, 6 * 8 + 3]) lv[i] = 0;
    // Border tile at 0: untouched.
    lv[0] = 0;
    mendPits(lv, 8, 0);
    expect(lv[2 * 8 + 2]).toBe(10);
    expect(lv[2 * 8 + 3]).toBe(10);
    for (const i of [5 * 8 + 2, 5 * 8 + 3, 6 * 8 + 2, 6 * 8 + 3]) expect(lv[i]).toBe(0);
    expect(lv[0]).toBe(0);
  });

  it('onTerrace accepts gentle terraces and rejects footprints straddling cliffs', () => {
    const flat = new Int16Array(100).fill(8);
    expect(onTerrace(flat, 10, 2, 2, 4, 4)).toBe(true);
    const cliff = new Int16Array(100);
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) cliff[r * 10 + c] = c >= 5 ? 16 : 8;
    expect(onTerrace(cliff, 10, 1, 2, 4, 4)).toBe(true);
    expect(onTerrace(cliff, 10, 5, 2, 4, 4)).toBe(true);
    expect(onTerrace(cliff, 10, 3, 2, 4, 4)).toBe(false);
  });
});

describe('worldLevels, chunkLevels and blockLevel with keepCliffs (T475)', () => {
  it('worldLevels with keepCliffs preserves land cliffs while flattening water and keeping water <= land', () => {
    // 6x6 chunk: left column water, columns 1..2 low shore (0), columns 3..5 cliff plateau (14).
    const tiles = Array.from({ length: 36 }, (_, i) => (i % 6 === 0 ? 'w' : 'g')).join('');
    const lv = (col: number) => (col === 0 ? 4 : col <= 2 ? 0 : 14);
    const cliffs = worldLevels([{ cx: 0, cy: 0, tiles, draft: tiles }], 6, (c) => c === 'w', (c) => lv(c), 0, undefined, true)[0];
    // Water drops to adjacent low shore (0), plateau keeps full height 14!
    expect(cliffs[0]).toBe(0);
    expect(cliffs[3]).toBe(14);
    expect(cliffs[5]).toBe(14);
    // Without keepCliffs (Hills mode), land bends down by +2 per tile from the shore.
    const smooth = worldLevels([{ cx: 0, cy: 0, tiles, draft: tiles }], 6, (c) => c === 'w', (c) => lv(c), 0, undefined, false)[0];
    expect(smooth[3]).toBe(2);
    expect(smooth[5]).toBe(6);
  });

  it('worldLevels with keepCliffs lowers structures built over draft water (piers, stilt huts) within a step of water without eroding natural cliffs', () => {
    // 6x6 chunk: draft has water on col 0..2 and natural cliff on col 3..5 (14). A pier/stilt hut replaces col 1..2 with floor `p`.
    const draft = Array.from({ length: 36 }, (_, i) => (i % 6 <= 2 ? 'w' : 'g')).join('');
    const tiles = Array.from({ length: 36 }, (_, i) => (i % 6 === 0 ? 'w' : i % 6 <= 2 ? 'p' : 'g')).join('');
    const lv = (col: number) => (col === 0 ? 0 : col <= 2 ? 10 : 14);
    const out = worldLevels([{ cx: 0, cy: 0, tiles, draft }], 6, (c) => c === 'w', (c) => lv(c), 0, undefined, true)[0];
    // Former-water pier/hut tiles step smoothly (+2 per tile) out of level-0 water; natural land cliff stays at 14.
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(2);
    expect(out[2]).toBe(4);
    expect(out[3]).toBe(14);
    expect(out[5]).toBe(14);
  });

  it('placeNetwork connects an aligned border gate sitting next to lower already-reached interior land via last-resort regrade', () => {
    // 6x6 place: flat interior at level 5 (reached from west gate (0, 3)), south border gate (3, 5) aligned to level 9 (diff = 4 > STEP).
    const size = 6;
    const levels = new Int16Array(size * size).fill(5);
    const northGate = 3 * size; // (0, 3)
    const southGate = 5 * size + 3; // (3, 5)
    levels[southGate] = 9;
    const net = placeNetwork(
      {
        size,
        levels,
        walked: () => true,
        swum: () => false,
        fixed: (i) => {
          const c = i % size, r = Math.floor(i / size);
          return c === 0 || r === 0 || c === size - 1 || r === size - 1;
        },
      },
      northGate,
      [southGate],
      { roughness: 'mountainous', climb: true },
    );
    expect(net.stranded).toEqual([]);
    expect(net.reach[southGate]).toBe(1);
    expect(net.levels[southGate]).toBe(9);
    // Interior tile (3, 4) was gently graded to 7 so 9 -> 7 -> 5 is walked in steps of 2.
    expect(Math.abs(net.levels[4 * size + 3] - 9)).toBeLessThanOrEqual(STEP);
    expect(Math.abs(net.levels[4 * size + 3] - net.levels[3 * size + 3])).toBeLessThanOrEqual(STEP);
  });

  it('chunkLevels with keepCliffs flattens a lot on its terrace without eroding surrounding cliffs', () => {
    // 10x10 chunk: west half terrace at 16 (with a slight bump 17), east half valley at 4.
    const tiles = 'g'.repeat(100);
    const field = (c: number, r: number) => (c < 5 ? (c === 2 && r === 2 ? 17 : 16) : 4);
    const lot = { x0: 1, y0: 1, x1: 3, y1: 3 };
    const out = chunkLevels(tiles, 10, () => false, field, [lot], true);
    // Lot is flat at 16; valley stays at 4 (cliff preserved at c=4 -> c=5!).
    for (let r = 1; r <= 3; r++) for (let c = 1; c <= 3; c++) expect(out[r * 10 + c]).toBe(16);
    expect(out[2 * 10 + 4]).toBe(16);
    expect(out[2 * 10 + 5]).toBe(4);
  });

  it('blockLevel with keepCliffs places a Gargantuan lot as a plateau at its own median', () => {
    const b = { x: 0, y: 0 };
    // High mountain plateau at 36 inside the block lot (5..29), valley 0 at the block outer borders.
    const lv = (col: number, row: number) => (col >= 5 && col <= 29 && row >= 5 && row <= 29 ? 36 : 0);
    expect(blockLevel(b, S, lv, 0, true)).toBe(36);
    // Without keepCliffs it is pulled down by 2 * d from the places' borders outside the lot (d = 1 -> 2).
    expect(blockLevel(b, S, lv, 0, false)).toBe(2);
  });
});

describe('lots on terraces (T475)', () => {
  const palette: Record<string, TerrainDef> = {
    g: { name: 'prato', color: '#4f9a45', solid: false, layer: 'ground' },
    p: { name: 'sentiero', color: '#c8a868', solid: false, layer: 'ground' },
    h: { name: 'muro', color: '#8a7a62', solid: true, layer: 'wall' },
    f: { name: 'pavimento', color: '#b06a4a', solid: false, layer: 'floor', indoor: true },
    d: { name: 'porta', color: '#d8a040', solid: false, layer: 'door' },
    w: { name: 'acqua', color: '#3a78c8', solid: true, cross: 'swim', depth: 'shallow', layer: 'liquid' },
    o: { name: 'mare', color: '#1d4f8a', solid: true, cross: 'swim', depth: 'deep', layer: 'liquid' },
  };

  it('stamps and building rewrite rules land on flat terraces and never straddle a cliff', () => {
    // 18x18 chunk split at c = 9|10 (c <= 9 at 0, c >= 10 at 12): an 8-wide interior terrace (c = 2..9) where a house fits, and a 12-level cliff beside it.
    const draft = Array.from({ length: S }, () => 'g'.repeat(S));
    const levels = new Int16Array(S * S);
    for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) levels[r * S + c] = c >= 10 ? 12 : 0;

    // 1. Stamp: house (7x7 or 8x8) fits on the west terrace (c = 2..9) and never straddles c = 9|10.
    const stampProg: MjNode = { type: 'stamp', shape: 'house', count: 3 };
    const sr = layout(draft, palette, { cx: 0, cy: 0, seed: 7, pathCode: 'p', program: stampProg, swim: true, levels });
    expect(sr.lots.length).toBeGreaterThan(0);
    for (const lot of sr.lots) {
      expect(onTerrace(levels, S, lot.x0, lot.y0, lot.x1 - lot.x0 + 1, lot.y1 - lot.y0 + 1)).toBe(true);
    }

    // 2. Rewrite rule drawing a 4x4 house: never straddles c = 9|10.
    const ruleProg: MjNode = { type: 'one', rules: [{ in: 'gggg/gggg/gggg/gggg', out: 'hhhh/hffh/hffh/hhdh' }], steps: 4 };
    const rr = layout(draft, palette, { cx: 0, cy: 0, seed: 11, pathCode: 'p', program: ruleProg, swim: true, levels });
    expect(rr.lots.length).toBeGreaterThan(0);
    for (const lot of rr.lots) {
      expect(onTerrace(levels, S, lot.x0, lot.y0, lot.x1 - lot.x0 + 1, lot.y1 - lot.y0 + 1)).toBe(true);
    }

    // 3. A huge 15x15 castle cannot fit on either half without straddling the cliff -> rejected cleanly.
    const castleCells = Array(S * S).fill('g');
    const codes = defaultCodes(palette, 'p');
    const placed = stamp(castleCells, S, S, undefined, 'castle', codes, new Rng(1), undefined, { vpt: 16, claimed: new Set(), levels });
    expect(placed).toBe(false);
  });

  it('harbour pier refuses a sheer sea cliff and launches from a walkable shore', () => {
    const cells = Array.from({ length: S * S }, (_, i) => (i % S >= 10 ? 'o' : 'g'));
    const levels = new Int16Array(S * S);
    for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) levels[r * S + c] = c >= 10 ? 0 : 12; // 12-level cliff everywhere on shore
    const codes = defaultCodes(palette, 'p');
    const cut = { vpt: 16, claimed: new Set<number>(), ground: { walked: 'gpfd', swum: 'wo', deep: 'o' }, levels };
    expect(stamp([...cells], S, S, undefined, 'harbour', codes, new Rng(3), undefined, cut)).toBe(false);
    // Open a low walkable beach cove at row 8..10 -> pier launches there.
    for (let r = 8; r <= 10; r++) for (let c = 7; c <= 9; c++) levels[r * S + c] = 1;
    const okCells = [...cells];
    expect(stamp(okCells, S, S, undefined, 'harbour', codes, new Rng(3), undefined, { ...cut, claimed: new Set() })).toBe(true);
    const pierRows = okCells.flatMap((v, i) => (v === codes.pier ? [Math.floor(i / S)] : []));
    expect(pierRows.length).toBeGreaterThanOrEqual(2);
    expect(pierRows.every((r) => r >= 8 && r <= 10)).toBe(true);
  });
});

describe('seed generate_relief, TrueRelief, gate alignment and fallback (T475)', () => {
  it('generates massifs, cliffs, terraces, underwater bed, gentle start and aligned gates across chunks', async () => {
    const k = await Kernel.boot({ files: trueReliefFiles(), store: memoryStore(), ai: new MockAiModels() });
    expect(k.relief).toBeInstanceOf(TrueRelief);
    expect(k.relief.hasCliffs()).toBe(true);
    expect(k.seaLevel).toBe(0);

    // Sample a spread of places across the world: verify massifs, cliffs, underwater bed and determinism.
    let maxLv = -Infinity, minBed = Infinity, cliffEdges = 0, totalEdges = 0, shallowBeds = 0;
    for (let cy = -6; cy <= 6; cy++) {
      for (let cx = -6; cx <= 6; cx++) {
        for (let r = 0; r < S; r++) {
          for (let c = 0; c < S; c++) {
            const wx = cx * S + c, wy = cy * S + r;
            const lv = k.relief.level(wx, wy);
            const bd = k.relief.bed(wx, wy);
            expect(lv).toBeGreaterThanOrEqual(-RELIEF_DEPTH);
            expect(lv).toBeLessThanOrEqual(RELIEF_PEAK);
            expect(bd).toBeLessThanOrEqual(lv);
            if (lv > maxLv) maxLv = lv;
            if (bd < minBed) minBed = bd;
            if (lv >= 0 && bd < lv) shallowBeds++;
            if (c + 1 < S) {
              const lv2 = k.relief.level(wx + 1, wy);
              if (lv >= 0 && lv2 >= 0) {
                totalEdges++;
                if (Math.abs(lv - lv2) > STEP) cliffEdges++;
              }
            }
          }
        }
      }
    }
    expect(maxLv).toBeGreaterThanOrEqual(24);
    expect(minBed).toBeLessThanOrEqual(-8);
    expect(shallowBeds).toBeGreaterThan(0);
    expect(cliffEdges).toBeGreaterThan(0);
    expect(cliffEdges / totalEdges).toBeLessThan(0.2);

    // Starting square (-2..2, -2..2) is gentle (no cliffs).
    for (let y = -2; y <= 2; y++)
      for (let x = -2; x <= 2; x++) {
        expect(k.relief.level(x, y)).toBeGreaterThanOrEqual(0);
        expect(Math.abs(k.relief.level(x, y) - k.relief.level(x + 1, y))).toBeLessThanOrEqual(STEP);
        expect(Math.abs(k.relief.level(x, y) - k.relief.level(x, y + 1))).toBeLessThanOrEqual(STEP);
      }

    // Every shared gate across chunk borders is within STEP on both sides.
    for (let cy = -4; cy <= 4; cy++) {
      for (let cx = -4; cx <= 4; cx++) {
        const g = gates(cx, cy, S, k.config.seed);
        // East gate meets west gate of (cx + 1, cy)
        const er = Math.floor(g[1] / S);
        const aE = Math.max(0, k.relief.level(cx * S + S - 1, cy * S + er));
        const bW = Math.max(0, k.relief.level((cx + 1) * S, cy * S + er));
        expect(Math.abs(aE - bW), `east gate ${cx},${cy}`).toBeLessThanOrEqual(STEP);
        // South gate meets north gate of (cx, cy + 1)
        const sc = g[3] % S;
        const aS = Math.max(0, k.relief.level(cx * S + sc, cy * S + S - 1));
        const bN = Math.max(0, k.relief.level(cx * S + sc, (cy + 1) * S));
        expect(Math.abs(aS - bN), `south gate ${cx},${cy}`).toBeLessThanOrEqual(STEP);
      }
    }

    // Determinism: a second kernel with the same seed gives identical levels and beds.
    const k2 = await Kernel.boot({ files: trueReliefFiles(), store: memoryStore(), ai: new MockAiModels() });
    for (const [wx, wy] of [[0, 0], [37, -51], [-90, 42], [115, 88]]) {
      expect(k2.relief.level(wx, wy)).toBe(k.relief.level(wx, wy));
      expect(k2.relief.bed(wx, wy)).toBe(k.relief.bed(wx, wy));
    }
  });

  it('falls back cleanly and raises a fault if generate_relief returns invalid data (rule 7)', async () => {
    const broken = {
      ...trueReliefFiles(),
      'modules/world.terrain/logic.lua': bundledFiles['modules/world.terrain/logic.lua'].replace(
        'function M.generate_relief(cx, cy, seed, size)',
        'function M.generate_relief(cx, cy, seed, size)\n  if true then return "not,valid" end',
      ),
    };
    const k = await Kernel.boot({ files: broken, store: memoryStore(), ai: new MockAiModels() });
    const lv = k.relief.level(5, 5);
    expect(Number.isFinite(lv)).toBe(true);
    expect(k.faults.list().some((f) => f.key === 'module:world.terrain:generate_relief')).toBe(true);
  });

  it('archipelago with true relief keeps beaches walkable from the sea and raises island interiors', async () => {
    const k = await Kernel.boot({ files: trueReliefFiles({ geography: 'archipelago' }), store: memoryStore(), ai: new MockAiModels() });
    let beachChecked = 0, seaChecked = 0, peakOnIsland = 0;
    for (let cy = -2; cy <= 2; cy++) {
      for (let cx = -2; cx <= 2; cx++) {
        const draft = k.placeDraft(cx, cy).join('');
        for (let i = 0; i < S * S; i++) {
          const wx = cx * S + (i % S), wy = cy * S + Math.floor(i / S);
          const lv = k.relief.level(wx, wy);
          const bd = k.relief.bed(wx, wy);
          if (draft[i] === 'o') {
            seaChecked++;
            expect(bd).toBeLessThan(0);
          } else if (draft[i] === 's') {
            beachChecked++;
            expect(lv).toBeGreaterThanOrEqual(0);
            expect(lv).toBeLessThanOrEqual(STEP);
          } else if (draft[i] !== 'w') {
            if (lv > peakOnIsland) peakOnIsland = lv;
          }
        }
      }
    }
    expect(seaChecked).toBeGreaterThan(50);
    expect(beachChecked).toBeGreaterThan(20);
    expect(peakOnIsland).toBeGreaterThanOrEqual(8);
  });

  it('planets with relief: true use TrueRelief on their band while orbit stays flat', async () => {
    const files = trueReliefFiles({ geography: 'void', sky: 'stars', planets: [{ name: 'Canyon', relief: 'true', seed: 19 }, { name: 'Colli', seed: 23 }] });
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const p1x = planetPlace(1, S) * S;
    const p2x = planetPlace(2, S) * S;
    expect(k.relief.hasCliffs(0)).toBe(false);
    expect(k.relief.hasCliffs(p1x)).toBe(true);
    expect(k.relief.hasCliffs(p2x)).toBe(false);
    // Planet 1 has true relief variation and cliffs.
    let lo = Infinity, hi = -Infinity;
    for (let dy = -40; dy <= 40; dy += 4)
      for (let dx = -40; dx <= 40; dx += 4) {
        const v = k.relief.level(p1x + dx, dy);
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    expect(hi - lo).toBeGreaterThanOrEqual(6);
  });
});

describe('walkable k at Genesis (T475)', () => {
  it('baseCodesFor and toPalette make k walkable ground without a boulder model only with true relief', () => {
    expect(baseCodesFor(false).k).toMatchObject({ layer: 'rock', solid: true, cross: 'none' });
    expect(baseCodesFor(true).k).toMatchObject({ layer: 'ground', solid: false, cross: 'walk' });
    const raw = Object.keys(baseCodesFor(false)).map((code) => ({
      code,
      name: code === 'k' ? 'monte' : code === 'r' ? 'roccia' : code,
      description: 'test',
      color: '#666666',
      layer: 'rock' as const,
      solid: true,
      speed: 0.9,
    }));
    const hillsPal = toPalette(raw, false);
    const truePal = toPalette(raw, true);
    expect(hillsPal.k).toMatchObject({ layer: 'rock', solid: true, cross: 'none', model: 'terreno-monte' });
    expect(truePal.k).toMatchObject({ layer: 'ground', solid: false, cross: 'walk' });
    expect(truePal.k.model).toBeUndefined();
    expect(truePal.r).toMatchObject({ layer: 'rock', solid: true, cross: 'none', model: 'terreno-roccia' });
  });

  it('Genesis with western produces walkable k and nature.relief: true; medievale keeps k solid', async () => {
    const kWest = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(await kWest.runGenesis(WORLD_THEMES.find((t) => t.id === 'western')!.text)).toBe(true);
    expect(kWest.nature().relief).toBe('true');
    expect(kWest.palette.k).toMatchObject({ layer: 'ground', solid: false, cross: 'walk' });
    expect(kWest.palette.k.model).toBeUndefined();
    expect(kWest.palette.r).toMatchObject({ layer: 'rock', solid: true, cross: 'none' });

    const kMed = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(await kMed.runGenesis(WORLD_THEMES.find((t) => t.id === 'medievale')!.text)).toBe(true);
    expect(kMed.nature().relief).toBeUndefined();
    expect(kMed.palette.k).toMatchObject({ layer: 'rock', solid: true, cross: 'none' });
  }, 60_000);
});

class Recording extends MockAiModels {
  plans: TextCall[] = [];
  override async text(call: TextCall): Promise<string> {
    if (call.task === 'chunk.plan') this.plans.push(call);
    return super.text(call);
  }
}

describe('Cartographer request with true relief (T475)', () => {
  it('reliefLine describes elevation, terraces and cliffs, and adds enclave wording only when enclaves exist', () => {
    const noEnc = reliefLine({ roughness: 'mountainous', enclaves: 0, share: 0, means: 'jump', low: 4, high: 28, cliffs: 12, terraces: 3 });
    expect(noEnc).toMatch(/1\.0 to 7\.0 tiles above sea level/);
    expect(noEnc).toMatch(/3 terraces/);
    expect(noEnc).toMatch(/flat terraces/);
    expect(noEnc).not.toMatch(/"where": enclave/);

    const withEnc = reliefLine({ roughness: 'mountainous', enclaves: 2, share: 0.12, means: 'climb', low: 0, high: 32, cliffs: 18, terraces: 4 });
    expect(withEnc).toMatch(/4 terraces/);
    expect(withEnc).toMatch(/"where": enclave/);
    expect(withEnc).toMatch(/climbing/);
  });

  it('sends relief info to Cartographer on rough true-relief places and gates `enclave` in schema on kept enclaves', async () => {
    const ai = new Recording();
    const k = await Kernel.boot({ files: trueReliefFiles(), store: memoryStore(), ai });
    // Plan a handful of places across different relief zones (including mountains).
    for (let cx = -3; cx <= 3; cx++) await k.planAhead(cx, 2);
    expect(ai.plans.length).toBeGreaterThan(0);
    const withRelief = ai.plans.filter((p) => (p.data as { relief?: { high?: number } })?.relief?.high !== undefined);
    expect(withRelief.length).toBeGreaterThan(0);
    expect(withRelief[0].prompt).toMatch(/Relief of this place/);
    for (const p of ai.plans) {
      const r = (p.data as { relief?: { enclaves: number } })?.relief;
      const hasEnclave = JSON.stringify(p.schema).includes('"enclave"');
      expect(hasEnclave).toBe(!!(r && r.enclaves > 0));
    }
  }, 90_000);
});

describe('multiplayer thin client with true relief (T475)', () => {
  it('sends ChunkView.relief to thin clients (without generator Lua) and matches server ground levels identically', async () => {
    const files = trueReliefFiles({}, { game: { mode: 'multiplayer', death: 3 } });
    // Confirm generator Lua is never exposed to clients (rule 8f).
    expect(playerFiles(files)['modules/world.terrain/logic.lua']).toBeUndefined();

    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    // Move wanderer to a hilly/mountainous place so cliffs and relief are non-trivial.
    const targetCx = 2, targetCy = 2;
    await k.planAhead(targetCx, targetCy);
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    const views: ChunkView[] = [];
    c.onMessage((m) => void views.push(...((m as { chunks?: ChunkView[] }).chunks ?? [])));
    server.connect(s);
    const session = new SessionClient(c, { id: 'anna', name: 'Anna' });
    await session.ready;
    const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    expect(mirror.files['modules/world.terrain/logic.lua']).toBeUndefined();
    const thin = new ThinClient(mirror, session);
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        mirror.tick(1 / 60);
        thin.frame(1 / 60);
        server.tick(1 / 60);
      }
    };
    for (let i = 0; i < 80 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      run(1);
      await new Promise((r) => setTimeout(r, 25));
    }
    run(8);
    const ch = k.chunks.get('0,0') as Chunk;
    expect(ch).toBeDefined();
    expect(views.some((v) => v.key === '0,0' && Array.isArray(v.relief) && v.relief.length === S * S)).toBe(true);
    const mch = mirror.chunks.get('0,0')!;
    expect(mch.relief).toBeDefined();
    for (let cell = 0; cell < S * S; cell++) {
      const col = cell % S, row = Math.floor(cell / S);
      expect(mirror.groundAt(col + 0.5, row + 0.5), `cell ${cell}`).toBe(k.groundAt(col + 0.5, row + 0.5));
      expect(levelOf(mirror, col, row)).toBe(levelOf(k, col, row));
    }
  }, 90_000);
});
