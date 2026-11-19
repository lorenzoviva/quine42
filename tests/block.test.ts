// The lot of 2 × 2 places of the Gargantuan structures (T370, ADR-0206): the geometry of a block, the layout of its places (the lot
// reserved, the gates inside the block in the ring, the edge of the lot walked), its ground flat at one level, the pieces of a structure
// that grows by rules joined by the ground, and the kernel: a Gargantuan structure asked by a new plan takes the block, its four places
// are connected (rule 10), saved and loaded again as they were; without a free block it goes down to what its own lots take.

import { describe, expect, it } from 'vitest';
import { BLOCK, blockGates, blockShapeFor, blockKey, blockLevel, blockLot, blockPlaces, blocksAround, inBlock, lotIn, readBlockMark, readBlocks, reservedCells, type BlockMark } from '../src/kernel/block';
import { gates, layout } from '../src/kernel/layout';
import { chunkLevels } from '../src/kernel/relief';
import { analyse } from '../src/mj/check';
import { boxOf, classOf, densityFor, GARGANTUAN_LOT, STRUCTURE_SIDE, STRUCTURE_VPT, TILE, tilesOf } from '../src/mj/classes';
import { FORM_LIMITS } from '../src/mj/run';
import { Kernel, realmOf } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MemoryChunks } from '../src/kernel/chunks';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import type { PlanContext } from '../src/kernel/agents/cartography';
import { entryBox, type FormComp } from '../src/kernel/forms';
import { migrateUniverse } from '../src/kernel/migrations';
import { structureModel } from '../src/kernel/modeldirector';
import type { FileMap, TerrainDef } from '../src/kernel/types';

const S = 18;

describe('the geometry of a block', () => {
  const b: BlockMark = { x: 4, y: -3 };

  it('is four places from its top-left one, and a place is in the four blocks around it', () => {
    expect(BLOCK).toBe(2);
    expect(blockPlaces(b)).toEqual([[4, -3], [5, -3], [4, -2], [5, -2]]);
    expect(blocksAround(5, -2)).toEqual([{ x: 5, y: -2 }, { x: 4, y: -2 }, { x: 5, y: -3 }, { x: 4, y: -3 }]);
    for (const [cx, cy] of blockPlaces(b)) expect(blocksAround(cx, cy)).toContainEqual(b);
    expect(inBlock(b, 6, -3)).toBe(false);
    expect(blockKey(b)).toBe('4,-3');
  });

  it('has its lot of 25 tiles in the middle of the 36, five tiles of ring before it and six after', () => {
    const l = blockLot(b, S);
    expect(GARGANTUAN_LOT).toBe(25);
    expect([l.x1 - l.x0 + 1, l.y1 - l.y0 + 1]).toEqual([25, 25]);
    expect([l.x0 - b.x * S, (b.x + 2) * S - 1 - l.x1]).toEqual([5, 6]);
    // Each place has its quarter of it: 13 × 13 cells before the middle, 12 × 13 or 13 × 12 or 12 × 12 after.
    expect(blockPlaces(b).map(([cx, cy]) => reservedCells(b, S, cx, cy).size)).toEqual([169, 156, 156, 144]);
    expect(lotIn(b, S, 5, -2)).toEqual({ x0: -13, y0: -13, x1: 11, y1: 11 });
  });

  it('moves the gates of the edges inside the block into the ring, the same for the two places that share them, and leaves the outer ones', () => {
    for (const seed of [1, 7, 1337]) {
      const g = new Map(blockPlaces(b).map(([cx, cy]) => [`${cx},${cy}`, blockGates(gates(cx, cy, S, seed), b, S, seed, cx, cy)]));
      for (const [cx, cy] of blockPlaces(b)) {
        const own = g.get(`${cx},${cy}`)!, plain = gates(cx, cy, S, seed);
        const reserved = reservedCells(b, S, cx, cy);
        for (const t of own) expect(reserved.has(t), `${cx},${cy} varco ${t}`).toBe(false);
        // The outer edges keep `gates`: the places outside the block agree.
        if (cx === b.x) expect(own[0]).toBe(plain[0]);
        if (cx === b.x + 1) expect(own[1]).toBe(plain[1]);
        if (cy === b.y) expect(own[2]).toBe(plain[2]);
        if (cy === b.y + 1) expect(own[3]).toBe(plain[3]);
      }
      // West-east inside the block: the same row on both sides; north-south: the same column.
      const row = (t: number) => Math.floor(t / S), col = (t: number) => t % S;
      expect(row(g.get('4,-3')![1])).toBe(row(g.get('5,-3')![0]));
      expect(row(g.get('4,-2')![1])).toBe(row(g.get('5,-2')![0]));
      expect(col(g.get('4,-3')![3])).toBe(col(g.get('4,-2')![2]));
      expect(col(g.get('5,-3')![3])).toBe(col(g.get('5,-2')![2]));
    }
  });

  it('lies flat at one level from the relief alone, within two levels a tile of the borders around it', () => {
    // A gentle relief, two levels up and down: the lot can lie flat within the bounds of every border.
    const relief = (c: number, r: number) => Math.round(Math.sin(c / 9) + Math.cos(r / 11));
    const level = blockLevel(b, S, relief, -10);
    expect(blockLevel(b, S, relief, -10)).toBe(level);
    const l = blockLot(b, S);
    for (const [cx, cy] of blockPlaces(b))
      for (let i = 0; i < S; i++)
        for (const [c, r] of [[i, 0], [i, S - 1], [0, i], [S - 1, i]]) {
          const col = cx * S + c, row = cy * S + r;
          const d = Math.max(0, l.x0 - col, col - l.x1) + Math.max(0, l.y0 - row, row - l.y1);
          if (d) expect(Math.abs(level - relief(col, row))).toBeLessThanOrEqual(2 * d);
        }
    // Never under the sea.
    expect(blockLevel(b, S, () => -5, 0)).toBe(0);
  });

  it('reads its marks and the state, and nothing else', () => {
    expect(readBlockMark({ x: 2, y: -1 })).toEqual({ x: 2, y: -1 });
    for (const v of [null, 'x', [1, 2], { x: 1.5, y: 0 }, { x: '1', y: 0 }, { y: 0 }]) expect(readBlockMark(v)).toBeUndefined();
    expect(readBlocks({ '2,3': '3,4', '0,0': '5,5', 'x': '1,1', '1,1': 7 })).toEqual([{ x: 2, y: 3, anchor: '3,4' }]);
    expect(readBlocks(['2,3'])).toEqual([]);
  });
});

describe('the layout of a place of a block', () => {
  const palette: Record<string, TerrainDef> = {
    '.': { name: 'erba', color: '#4a4', solid: false },
    t: { name: 'albero', color: '#262', solid: true, layer: 'vegetation' },
    p: { name: 'sentiero', color: '#ca8', solid: false },
  };
  const b: BlockMark = { x: 0, y: 0 };
  // A dense wood: what is walked is what the kernel digs.
  const draft = Array.from({ length: S }, (_, r) => Array.from({ length: S }, (_, c) => ((c * 7 + r * 3) % 5 ? 't' : '.')).join(''));

  it('never touches the lot, reaches every gate and the whole edge of the lot, and the program does not write either', () => {
    for (const [cx, cy] of blockPlaces(b)) {
      const reserved = reservedCells(b, S, cx, cy);
      const l = lotIn(b, S, cx, cy);
      const apron = new Set<number>();
      for (let r = Math.max(0, l.y0 - 1); r <= Math.min(S - 1, l.y1 + 1); r++) for (let c = Math.max(0, l.x0 - 1); c <= Math.min(S - 1, l.x1 + 1); c++) if (!reserved.has(r * S + c)) apron.add(r * S + c);
      const g = blockGates(gates(cx, cy, S, 5), b, S, 5, cx, cy);
      // A program that would fill everything with trees.
      const program = { type: 'all', rules: [{ in: '.', out: 't' }, { in: 'p', out: 't' }] } as any;
      const out = layout(draft, palette, { cx, cy, seed: 5, pathCode: 'p', reserved, gates: g, apron, program });
      expect(out.gates).toEqual(g);
      for (const i of reserved) {
        expect(out.reachable.has(i)).toBe(false);
        expect(out.grid[Math.floor(i / S)][i % S]).toBe(draft[Math.floor(i / S)][i % S]);
      }
      for (const i of [...g, ...apron]) {
        expect(out.reachable.has(i), `${cx},${cy} cella ${i}`).toBe(true);
        expect(palette[out.grid[Math.floor(i / S)][i % S]].solid).toBe(false);
      }
    }
  });

  it('a place outside any block is laid out as before', () => {
    const a = layout(draft, palette, { cx: 3, cy: 1, seed: 5, pathCode: 'p' });
    const c = layout(draft, palette, { cx: 3, cy: 1, seed: 5, pathCode: 'p', reserved: new Set(), apron: new Set() });
    expect(c.grid).toEqual(a.grid);
    expect([...c.reachable].sort()).toEqual([...a.reachable].sort());
  });

  it('its ground lies at the block\'s level on the lot, its border too, and the rest climbs to it', () => {
    const tiles = '.'.repeat(S * S);
    const relief = (c: number, r: number) => (c + r) % 3;
    const lot = { ...lotIn(b, S, 1, 1), level: 2 };
    const levels = chunkLevels(tiles, S, () => false, relief, [lot]);
    for (const i of reservedCells(b, S, 1, 1)) expect(levels[i]).toBe(2);
    for (let i = 0; i < S * S; i++) {
      const c = i % S, r = Math.floor(i / S);
      if (c + 1 < S) expect(Math.abs(levels[i] - levels[i + 1])).toBeLessThanOrEqual(2);
      if (r + 1 < S) expect(Math.abs(levels[i] - levels[i + S])).toBeLessThanOrEqual(2);
    }
  });
});

describe('the Gargantuan structure, 25 × 25 tiles', () => {
  const structure = classOf('structure')!;

  it('is 500 × 500 × 160 voxels, within the ceilings of the forms: 25 × 25 tiles at 20, 31.25 at 16 since T405', () => {
    expect(STRUCTURE_SIDE).toBe(500);
    expect(tilesOf(structure, 'gargantuan')).toEqual([31.25, 31.25, 10]);
    expect(densityFor(structure, 'gargantuan')).toBe(STRUCTURE_VPT);
    expect(GARGANTUAN_LOT * TILE).toBe(500);
    // On a block of 2 × 2 places still: a lot of 32, a ring of two tiles.
    expect(blockShapeFor(tilesOf(structure, 'gargantuan')[0], 18)).toEqual({ side: 2, lot: 32 });
    expect(boxOf(structure, 'gargantuan')).toEqual([500, 500, 160]);
    expect(500 * 500 * 160).toBeLessThanOrEqual(FORM_LIMITS.cells);
    // The other classes keep the scale of D&D.
    expect(tilesOf(classOf('building')!, 'gargantuan')).toEqual([10, 10, 10]);
    expect(tilesOf(structure, 'huge')).toEqual([9.375, 9.375, 7.5]);
  });

  it('is a whole of parts on the ground: what rests on the bottom is one body, what floats is detached', () => {
    // Two houses far apart on the ground, and a cloud.
    const X = 40, Y = 10, Z = 10;
    const cells = new Uint8Array(X * Y * Z);
    const set = (x: number, y: number, z: number) => (cells[x + y * X + z * X * Y] = 1);
    for (let z = 0; z < 5; z++) for (let y = 2; y < 6; y++) for (let x = 2; x < 8; x++) set(x, y, z);
    for (let z = 0; z < 5; z++) for (let y = 2; y < 6; y++) for (let x = 30; x < 36; x++) set(x, y, z);
    const r = { grid: { X, Y, Z, cells, alphabet: ['.', 'W'] }, steps: 1, finished: true, ms: 1 } as any;
    const palette = { W: { color: '#888' } } as any;
    expect(analyse(r, palette, { grounded: true }).errors.join()).toMatch(/pezzi staccati/);
    expect(analyse(r, palette, { grounded: true, groundJoins: true }).errors).toEqual([]);
    for (let y = 2; y < 6; y++) for (let x = 15; x < 25; x++) set(x, y, 8);
    for (let y = 2; y < 6; y++) for (let x = 15; x < 25; x++) set(x, y, 9);
    expect(analyse(r, palette, { grounded: true, groundJoins: true }).errors.join()).toMatch(/non poggia a terra/);
  });
});

/** The Cartographer of the mock, who asks for a citadel at the places listed. */
class Citadels extends MockAiModels {
  constructor(private at: Set<string>) {
    super();
    this.corruptRate = 0;
  }
  async text(call: TextCall): Promise<string> {
    const out = await super.text(call);
    const d = call.data as PlanContext | undefined;
    if (call.task !== 'chunk.plan' || !d || !this.at.has(`${d.cx},${d.cy}`)) return out;
    const a = JSON.parse(out);
    a.structures = [{ concept: 'il mulino' }, { concept: 'la cittadella', size: 'gargantuan' }];
    return JSON.stringify(a);
  }
}

const filesWithoutSculpting = (): FileMap => {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, maxModels: 0 } }, null, 2) + '\n' };
};

const boot = (files: FileMap = filesWithoutSculpting(), chunks = new MemoryChunks(), at = new Set<string>()) => Kernel.boot({ files, store: memoryStore(), ai: new Citadels(at), chunks });

/** The cells of a place one walks on from its first gate (4-neighbourhood, by its tiles). */
function walked(k: Kernel, key: string, from: number): Set<number> {
  const ch = k.chunks.get(key)!;
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.pop()!;
    const x = cur % S, y = Math.floor(cur / S);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * S + nx;
      if (nx < 0 || ny < 0 || nx >= S || ny >= S || seen.has(n) || k.palette[ch.tiles[n]]?.solid !== false) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return seen;
}

describe('a Gargantuan structure in the world', () => {
  // A block on land (the lot of a block may have a quarter of water at most) in one region of the atlas, far from the start.
  const b = { x: 20, y: 24 };
  const key = (cx: number, cy: number) => `${cx},${cy}`;
  const A = key(b.x, b.y);

  it('takes the lot of 2 × 2 places: four plans marked, the structure in the middle, every place connected; saved and loaded again as it was', async () => {
    // Its tiles at 16 voxels a tile (T405): 31.25, a lot of 32 on the 2 × 2 places, two tiles of ring.
    const m: BlockMark = { ...b, lot: 32 };
    const chunks = new MemoryChunks();
    const k = await boot(undefined, chunks, new Set([A]));
    expect(k.config.chunkSize).toBe(S);
    expect(await k.planAhead(b.x, b.y)).toBe('nuovo');
    expect(k.blockOfPlace(b.x + 1, b.y + 1)).toEqual({ ...m, anchor: A });
    expect(k.rareAllowed({ key: key(b.x + 2, b.y + 2), cx: b.x + 2, cy: b.y + 2 })).not.toContain('gargantuan');
    // The other three: the kernel's plans, saved at once, without a call to the Cartographer.
    const calls = k.ai.usage.text;
    for (const [cx, cy] of blockPlaces(b).slice(1)) expect(await k.planAhead(cx, cy)).toBe('noto');
    expect(k.ai.usage.text).toBe(calls);
    const anchor = k.chunks.get(A)!;
    expect(anchor.plan!.block).toEqual(m);
    expect(anchor.plan!.structures!.map((s) => s.concept)).toEqual(['la cittadella', 'il mulino']);
    for (const [cx, cy] of blockPlaces(b).slice(1)) {
      const p = k.chunks.get(key(cx, cy))!.plan!;
      expect(p).toMatchObject({ block: m, place: anchor.plan!.place, layout: anchor.plan!.layout, objects: [], runes: [] });
      expect(p.structures).toBeUndefined();
    }
    // One structure, Gargantuan, in the middle of the lot, kept by the place that asked for it.
    const sids = k.ecs.query('structure', 'origin').filter((id) => k.ecs.get(id, 'structure').size === 'gargantuan');
    expect(sids).toHaveLength(1);
    const sid = sids[0];
    expect(k.ecs.get(sid, 'origin').key).toBe(`${A}#s${anchor.lots.length}`);
    expect(k.ecs.get(sid, 'chunk').key).toBe(A);
    expect(k.ecs.get(sid, 'structure')).toMatchObject({ concept: 'la cittadella', class: 'structure', size: 'gargantuan', model: 'struttura-la-cittadella-gargantuan' });
    // The lot has two tiles of ring on every side: its middle is the corner of the four places.
    const ml = blockLot(m, S);
    const mid = { x: (ml.x0 + ml.x1 + 1) / 2, y: (ml.y0 + ml.y1 + 1) / 2 };
    expect(mid).toEqual({ x: (b.x + 1) * S, y: (b.y + 1) * S });
    expect(k.ecs.get(sid, 'pos')).toEqual(mid);
    // Rule 10: in every place the gates and the edge of the lot are walked from the first gate, the lot is ground nobody is put on.
    const level = k.groundAt(mid.x, mid.y);
    for (const [cx, cy] of blockPlaces(b)) {
      const here = key(cx, cy), ch = k.chunks.get(here)!;
      const reserved = reservedCells(m, S, cx, cy);
      const g = blockGates(gates(cx, cy, S, k.config.seed), m, S, k.config.seed, cx, cy);
      const reach = walked(k, here, g[0]);
      for (const t of g) expect(reach.has(t), `${here}: varco ${t}`).toBe(true);
      const l = lotIn(m, S, cx, cy);
      for (let r = Math.max(0, l.y0 - 1); r <= Math.min(S - 1, l.y1 + 1); r++)
        for (let c = Math.max(0, l.x0 - 1); c <= Math.min(S - 1, l.x1 + 1); c++) {
          const i = r * S + c;
          if (!reserved.has(i)) expect(reach.has(i), `${here}: bordo del lotto ${c},${r}`).toBe(true);
        }
      for (const i of reserved) {
        const t = k.palette[ch.tiles[i]];
        expect(t?.solid, `${here} cella ${i}`).toBeFalsy();
        expect(t?.layer ?? 'ground').toBe('ground');
        expect(k.groundAt(cx * S + (i % S) + 0.5, cy * S + Math.floor(i / S) + 0.5)).toBe(level);
      }
      // Nothing of the plan stands on the lot, nor on its edge, where the structure's doors open.
      for (const id of k.ecs.query('chunk', 'pos')) {
        if (k.ecs.has(id, 'structure') || k.ecs.get(id, 'chunk').key !== here) continue;
        const p = k.ecs.get(id, 'pos');
        const c = Math.floor(p.x) - cx * S, r = Math.floor(p.y) - cy * S;
        if (Math.floor(p.x / S) !== cx || Math.floor(p.y / S) !== cy) continue;
        const near = c >= l.x0 - 1 && c <= l.x1 + 1 && r >= l.y0 - 1 && r <= l.y1 + 1;
        expect(near, `${here}: ${JSON.stringify(k.ecs.get(id, 'origin'))} a ${c},${r}`).toBe(false);
      }
    }
    // The ring goes round: the edge of the lot crosses the edges between the places of the block.
    const tileAt = (x: number, y: number) => {
      const cx = Math.floor(x / S), cy = Math.floor(y / S);
      return k.chunks.get(key(cx, cy))!.tiles[(y - cy * S) * S + (x - cx * S)];
    };
    const lot = blockLot(m, S);
    for (const x of [lot.x0 - 1, lot.x1 + 1]) for (let y = lot.y0 - 1; y <= lot.y1 + 1; y++) expect(k.palette[tileAt(x, y)].solid, `${x},${y}`).toBe(false);
    for (const y of [lot.y0 - 1, lot.y1 + 1]) for (let x = lot.x0 - 1; x <= lot.x1 + 1; x++) expect(k.palette[tileAt(x, y)].solid, `${x},${y}`).toBe(false);
    // The structure looks one of four ways.
    expect([-Math.PI, -Math.PI / 2, 0, Math.PI / 2]).toContain((k.ecs.get(sid, 'form') as FormComp).yaw);
    // Saved with the game, and loaded again in another kernel from the same plans: the same places, the same structure.
    expect(k.saveState()).toBe(true);
    const state = JSON.parse(k.repo.head().files['world/state.json']!);
    expect(state.blocks).toEqual({ [A]: { anchor: A, lot: 32 } });
    expect(state.rares.gargantuan).toEqual({ [realmOf(b.x, b.y)]: A });
    const again = await boot(k.repo.head().files, chunks);
    expect(again.blockOfPlace(b.x, b.y + 1)).toEqual({ ...m, anchor: A });
    for (const [cx, cy] of [...blockPlaces(b)].reverse()) expect(await again.planAhead(cx, cy)).toBe('noto');
    for (const [cx, cy] of blockPlaces(b)) expect(again.chunks.get(key(cx, cy))!.tiles).toBe(k.chunks.get(key(cx, cy))!.tiles);
    const sid2 = again.ecs.query('structure', 'origin').find((id) => again.ecs.get(id, 'structure').size === 'gargantuan')!;
    expect(again.ecs.get(sid2, 'pos')).toEqual(k.ecs.get(sid, 'pos'));
    expect(again.ecs.get(sid2, 'form')).toMatchObject({ seed: (k.ecs.get(sid, 'form') as FormComp).seed, yaw: (k.ecs.get(sid, 'form') as FormComp).yaw });
    expect(again.groundAt(mid.x, mid.y)).toBe(level);
    // Even without the state (a save that did not happen): the plans know the block.
    const files = { ...k.repo.head().files };
    delete files['world/state.json'];
    const bare = await boot(files, chunks);
    const other = key(b.x + 1, b.y);
    expect(bare.blockOfPlace(b.x + 1, b.y)).toBeUndefined();
    expect(await bare.planAhead(b.x + 1, b.y)).toBe('noto');
    expect(bare.blockOfPlace(b.x + 1, b.y)).toEqual({ ...m, anchor: '' });
    expect(await bare.planAhead(b.x, b.y)).toBe('noto');
    expect(bare.blockOfPlace(b.x + 1, b.y)).toEqual({ ...m, anchor: A });
    expect(bare.chunks.get(other)!.tiles).toBe(k.chunks.get(other)!.tiles);
  }, 60_000);

  it('without a free block it goes down to the size its own lots take, and the places around keep their plans', async () => {
    const at = { x: 30, y: 28 };
    const k = await boot(undefined, new MemoryChunks(), new Set([key(at.x, at.y)]));
    // Every place around is planned first: no block is free.
    for (let cy = at.y - 1; cy <= at.y + 1; cy++) for (let cx = at.x - 1; cx <= at.x + 1; cx++) if (cx !== at.x || cy !== at.y) await k.planAhead(cx, cy);
    expect(await k.planAhead(at.x, at.y)).toBe('nuovo');
    const ch = k.chunks.get(key(at.x, at.y))!;
    expect(ch.plan!.block).toBeUndefined();
    expect(k.blockOfPlace(at.x, at.y)).toBeUndefined();
    expect(ch.blockLot).toBeUndefined();
    expect(ch.plan!.structures!.map((s) => s.concept)).toEqual(['il mulino', 'la cittadella']);
    expect(ch.plan!.structures!.map((s) => s.size)).not.toContain('gargantuan');
    expect(k.rareAllowed({ key: key(at.x, at.y + 1), cx: at.x, cy: at.y + 1 })).toContain('gargantuan');
  }, 60_000);
});

describe('the migration 0.7 → 0.8', () => {
  it('a Gargantuan structure of before says the density it was sculpted at: its box, its lot and its place stay', async () => {
    const id = structureModel('la torre', 'gargantuan');
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const index = JSON.parse(bundledFiles['models/index.json']);
    const files: FileMap = {
      ...bundledFiles,
      'universe.json': JSON.stringify({ ...cfg, kernel: '0.7.14', kernels: { from: '0.7' }, ai: { ...cfg.ai, maxModels: 0 } }, null, 2) + '\n',
      'models/index.json': JSON.stringify({ ...index, [id]: { class: 'structure', size: 'gargantuan' }, 'struttura-la-rocca-huge': { class: 'structure', size: 'huge' } }, null, 2) + '\n',
      [`models/${id}.xml`]: '<sequence values="BW" origin="bottom"><box at="0 0 0" size="20 20 60" color="W"/></sequence>',
    };
    const { files: out, applied } = migrateUniverse(files);
    expect(applied.map((a) => a.slice(0, 8))).toEqual(['0.7→0.8:', '0.8→0.9:', '0.9→0.10']);
    const after = JSON.parse(out['models/index.json']);
    expect(after[id]).toEqual({ class: 'structure', size: 'gargantuan', vpt: 20 });
    // Then 0.8 → 0.9 (T405): the Huge one of then says its 20 too.
    expect(after['struttura-la-rocca-huge']).toEqual({ class: 'structure', size: 'huge', vpt: 20 });
    // Its box is the one it was sculpted in; a new one has the lot of more places.
    const structure = classOf('structure')!;
    expect(entryBox(structure, after[id])).toEqual([200, 200, 160]);
    expect(entryBox(structure, { size: 'gargantuan' })).toEqual([500, 500, 160]);
    // Its place keeps it on a lot of 12 tiles: the tiles of the entry it wears are 10.
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    expect(k.forms.info(id)).toMatchObject({ vpt: 20 });
    const lot = (n: number) => ({ x0: 0, y0: 0, x1: n - 1, y1: n - 1, walls: [], floor: [], doors: [] });
    const plan = { structures: [{ concept: 'la torre', size: 'gargantuan' }] };
    (k as any).claimSizes({ key: '40,40', cx: 40, cy: 40, lots: [lot(12)] }, plan);
    expect(plan.structures[0].size).toBe('gargantuan');
    const other = { structures: [{ concept: 'la reggia', size: 'gargantuan' }] };
    (k as any).claimSizes({ key: '41,40', cx: 41, cy: 40, lots: [lot(12)] }, other);
    expect(other.structures[0].size).not.toBe('gargantuan');
  });
});
