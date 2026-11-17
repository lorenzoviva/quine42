// The block as large as its structure (T404, ADR-0208, D61): the author's fort, 500 × 500 voxels at 10 voxels a tile, is 50 × 50 tiles and
// stands on a block of 3 × 3 places with a lot of 50 tiles (two tiles of ring a side). The geometry of a block of any side (2 × 2 as T370
// made it, unchanged), the layout of its places (the middle one all under the lot, the gates of the edges between places on the edge of
// the lot one walks), and the kernel: the side the entry the structure wears asks for, nine places planned with one call, connected,
// saved and loaded again as they were; a structure larger than the largest block goes down a size.

import { describe, expect, it } from 'vitest';
import { BLOCK, blockGates, blockKey, blockLot, blockPlaces, blockRecord, blockShapeFor, blocksAround, inBlock, lotIn, lotSideOf, markOf, MAX_BLOCK, readBlockMark, readBlocks, reservedCells, RING, type BlockMark } from '../src/kernel/block';
import { gates, layout } from '../src/kernel/layout';
import { Kernel, realmOf } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MemoryChunks } from '../src/kernel/chunks';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import type { PlanContext } from '../src/kernel/agents/cartography';
import { structureModel } from '../src/kernel/modeldirector';
import { GARGANTUAN_LOT } from '../src/mj/classes';
import type { FileMap, TerrainDef } from '../src/kernel/types';

const S = 18;

describe('the shape of a block', () => {
  it('is as large as its structure: 2 × 2 with the lot of 25 up to 25 tiles, 3 × 3 up to 50, none past', () => {
    expect([BLOCK, MAX_BLOCK, RING]).toEqual([2, 3, 2]);
    expect(blockShapeFor(10, S)).toEqual({ side: 2, lot: GARGANTUAN_LOT });
    expect(blockShapeFor(25, S)).toEqual({ side: 2, lot: 25 });
    expect(blockShapeFor(30, S)).toEqual({ side: 2, lot: 30 });
    expect(blockShapeFor(33.4, S)).toEqual({ side: 3, lot: 34 });
    // The author's fort at 10 voxels a tile.
    expect(blockShapeFor(500 / 10, S)).toEqual({ side: 3, lot: 50 });
    // At 5 (the factor 4 of D60) it would want 6 × 6 places: none.
    expect(blockShapeFor(500 / 5, S)).toBeUndefined();
    expect(blockShapeFor(51, S)).toBeUndefined();
    for (const v of [0, -3, NaN, Infinity]) expect(blockShapeFor(v, S)).toBeUndefined();
  });

  it('keeps the marks of 2 × 2 with the lot of 25 as T370 wrote them, and says the side and the lot of the others', () => {
    expect(markOf({ x: 1, y: 2, side: 2, lot: 25 })).toEqual({ x: 1, y: 2 });
    expect(markOf({ x: 1, y: 2, side: 3, lot: 50 })).toEqual({ x: 1, y: 2, side: 3, lot: 50 });
    expect(blockRecord({ x: 1, y: 2, anchor: '2,3' })).toBe('2,3');
    expect(blockRecord({ x: 1, y: 2, side: 3, lot: 50, anchor: '1,2' })).toEqual({ anchor: '1,2', side: 3, lot: 50 });
    expect(readBlockMark({ x: 1, y: 2, side: 3, lot: 50 })).toEqual({ x: 1, y: 2, side: 3, lot: 50 });
    expect(readBlockMark({ x: 1, y: 2, side: 2, lot: 25 })).toEqual({ x: 1, y: 2 });
    for (const v of [{ x: 1, y: 2, side: 4 }, { x: 1, y: 2, side: 1 }, { x: 1, y: 2, side: 2.5 }, { x: 1, y: 2, lot: 0 }, { x: 1, y: 2, lot: '50' }, { x: 1, y: 2, side: null }]) expect(readBlockMark(v), JSON.stringify(v)).toBeUndefined();
    expect(readBlocks({ '2,3': '3,4', '5,5': { anchor: '7,7', side: 3, lot: 50 }, '9,9': { anchor: '11,11' }, '0,0': { anchor: '1,1', side: 9 }, '4,4': { side: 3 } })).toEqual([
      { x: 2, y: 3, anchor: '3,4' },
      { x: 5, y: 5, side: 3, lot: 50, anchor: '7,7' },
    ]);
  });
});

describe('the geometry of a block of 3 × 3', () => {
  const b: BlockMark = { x: 4, y: -3, side: 3, lot: 50 };

  it('is nine places from its top-left one, and a place is in the nine blocks of that shape around it', () => {
    expect(blockPlaces(b)).toHaveLength(9);
    expect(blockPlaces(b)[8]).toEqual([6, -1]);
    expect(inBlock(b, 6, -1)).toBe(true);
    expect(inBlock(b, 7, -1)).toBe(false);
    const around = blocksAround(6, -1, { side: 3, lot: 50 });
    expect(around).toHaveLength(9);
    expect(around[0]).toEqual({ x: 6, y: -1, side: 3, lot: 50 });
    expect(around).toContainEqual(b);
    // The blocks of T370 by default.
    expect(blocksAround(5, -2)).toEqual([{ x: 5, y: -2 }, { x: 4, y: -2 }, { x: 5, y: -3 }, { x: 4, y: -3 }]);
    expect(blockKey(b)).toBe('4,-3');
  });

  it('has its lot of 50 tiles in the middle of the 54, two tiles of ring on every side; the middle place is all lot', () => {
    const l = blockLot(b, S);
    expect(lotSideOf(b, S)).toBe(50);
    expect([l.x1 - l.x0 + 1, l.y1 - l.y0 + 1]).toEqual([50, 50]);
    expect([l.x0 - b.x * S, (b.x + 3) * S - 1 - l.x1, l.y0 - b.y * S, (b.y + 3) * S - 1 - l.y1]).toEqual([2, 2, 2, 2]);
    // Corners 16 × 16, edges 16 × 18, the middle 18 × 18.
    expect(blockPlaces(b).map(([cx, cy]) => reservedCells(b, S, cx, cy).size)).toEqual([256, 288, 256, 288, 324, 288, 256, 288, 256]);
    // A lot that says more than its places hold is cut to them, less the ring.
    expect(lotSideOf({ ...b, lot: 80 }, S)).toBe(50);
  });

  it('moves a gate between two places onto the edge of the lot, the same for both, and keeps under the lot only the edges it covers whole', () => {
    for (const seed of [1, 7, 1337]) {
      const g = new Map(blockPlaces(b).map(([cx, cy]) => [`${cx},${cy}`, blockGates(gates(cx, cy, S, seed), b, S, seed, cx, cy)]));
      const l = blockLot(b, S);
      for (const [cx, cy] of blockPlaces(b)) {
        const own = g.get(`${cx},${cy}`)!, plain = gates(cx, cy, S, seed);
        const reserved = reservedCells(b, S, cx, cy);
        // The outer edges keep `gates`: the places outside the block agree.
        if (cx === b.x) expect(own[0]).toBe(plain[0]);
        if (cx === b.x + 2) expect(own[1]).toBe(plain[1]);
        if (cy === b.y) expect(own[2]).toBe(plain[2]);
        if (cy === b.y + 2) expect(own[3]).toBe(plain[3]);
        own.forEach((t, i) => {
          const r = Math.floor(t / S), c = t % S;
          // Not a corner cell of the place.
          expect([r, c].some((v) => v > 0 && v < S - 1), `${cx},${cy} varco ${i}`).toBe(true);
          if (!reserved.has(t)) {
            // Out of the lot, a gate between places is on its edge (one tile from it).
            const wx = cx * S + c, wy = cy * S + r;
            const d = Math.max(0, l.x0 - wx, wx - l.x1) + Math.max(0, l.y0 - wy, wy - l.y1);
            expect(d, `${cx},${cy} varco ${i}`).toBeLessThanOrEqual(2);
            return;
          }
          // Under the lot only an edge it covers whole: the middle place's, and the edges towards it.
          const middle = cx === b.x + 1 && cy === b.y + 1;
          const towards = (i === 0 && cx === b.x + 2 && cy === b.y + 1) || (i === 1 && cx === b.x && cy === b.y + 1) || (i === 2 && cx === b.x + 1 && cy === b.y + 2) || (i === 3 && cx === b.x + 1 && cy === b.y);
          expect(middle || towards, `${cx},${cy} varco ${i} sotto il lotto`).toBe(true);
        });
      }
      // West-east inside the block: the same row on both sides; north-south: the same column.
      const row = (t: number) => Math.floor(t / S), col = (t: number) => t % S;
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) expect(row(g.get(`${b.x + dx},${b.y + dy}`)![1])).toBe(row(g.get(`${b.x + dx + 1},${b.y + dy}`)![0]));
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) expect(col(g.get(`${b.x + dx},${b.y + dy}`)![3])).toBe(col(g.get(`${b.x + dx},${b.y + dy + 1}`)![2]));
    }
  });

  it('lays its places out: nothing on the lot, every gate out of it and the whole edge of the lot reached from one of them', () => {
    const palette: Record<string, TerrainDef> = {
      '.': { name: 'erba', color: '#4a4', solid: false },
      t: { name: 'albero', color: '#262', solid: true, layer: 'vegetation' },
      p: { name: 'sentiero', color: '#ca8', solid: false },
    };
    const draft = Array.from({ length: S }, (_, r) => Array.from({ length: S }, (_, c) => ((c * 7 + r * 3) % 5 ? 't' : '.')).join(''));
    for (const [cx, cy] of blockPlaces(b)) {
      const reserved = reservedCells(b, S, cx, cy);
      const l = lotIn(b, S, cx, cy);
      const apron = new Set<number>();
      for (let r = Math.max(0, l.y0 - 1); r <= Math.min(S - 1, l.y1 + 1); r++) for (let c = Math.max(0, l.x0 - 1); c <= Math.min(S - 1, l.x1 + 1); c++) if (!reserved.has(r * S + c)) apron.add(r * S + c);
      const g = blockGates(gates(cx, cy, S, 5), b, S, 5, cx, cy);
      const program = { type: 'all', rules: [{ in: '.', out: 't' }, { in: 'p', out: 't' }] } as any;
      const out = layout(draft, palette, { cx, cy, seed: 5, pathCode: 'p', reserved, gates: g, apron, program });
      for (const i of reserved) {
        expect(out.reachable.has(i)).toBe(false);
        expect(out.grid[Math.floor(i / S)][i % S]).toBe(draft[Math.floor(i / S)][i % S]);
      }
      for (const i of [...g.filter((t) => !reserved.has(t)), ...apron]) {
        expect(out.reachable.has(i), `${cx},${cy} cella ${i}`).toBe(true);
        expect(palette[out.grid[Math.floor(i / S)][i % S]].solid).toBe(false);
      }
      if (reserved.size === S * S) expect(out.reachable.size).toBe(0);
    }
  });
});

/** The Cartographer of the mock, who asks for a Gargantuan citadel at the places listed. */
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

/** The seed with the citadel in the library as the author's fort is (500 × 500 voxels, its own box) at a density, and no sculpting. */
function withCitadel(vpt: number): FileMap {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const index = JSON.parse(bundledFiles['models/index.json']);
  const id = structureModel('la cittadella', 'gargantuan');
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, maxModels: 0 } }, null, 2) + '\n',
    'models/index.json': JSON.stringify({ ...index, [id]: { class: 'structure', size: 'gargantuan', vpt, time: 30_000, name: 'la cittadella' } }, null, 1) + '\n',
    // A low wall all round, so the program costs nothing: what matters here is its box, 500 × 500 voxels.
    [`models/${id}.xml`]: '<sequence values="BW" size="500 500 8" origin="bottom"><box at="0 0 0" size="500 500 2" color="W"/></sequence>',
  };
}

/** The cells of a place one walks on from a cell (4-neighbourhood, by its tiles). */
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

describe('the author\'s fort at 10 voxels a tile in the world', () => {
  const key = (cx: number, cy: number) => `${cx},${cy}`;

  it('takes a block of 3 × 3 places: nine plans marked, one call, the lot of 50, every place but the middle one connected; saved and loaded again', async () => {
    const b = { x: 20, y: 24, side: 3, lot: 50 };
    const A = key(b.x, b.y);
    const chunks = new MemoryChunks();
    const k = await Kernel.boot({ files: withCitadel(10), store: memoryStore(), ai: new Citadels(new Set([A])), chunks });
    const id = structureModel('la cittadella', 'gargantuan');
    expect(k.forms.entryTiles(id)).toEqual([50, 50, 0.8]);
    expect(await k.planAhead(b.x, b.y)).toBe('nuovo');
    expect(k.blockOfPlace(b.x + 2, b.y + 2)).toEqual({ ...b, anchor: A });
    expect(k.blockOfPlace(b.x + 3, b.y)).toBeUndefined();
    // The other eight: the kernel's plans, saved at once, without a call to the Cartographer.
    const calls = k.ai.usage.text;
    for (const [cx, cy] of blockPlaces(b).slice(1)) expect(await k.planAhead(cx, cy)).toBe('noto');
    expect(k.ai.usage.text).toBe(calls);
    const anchor = k.chunks.get(A)!;
    expect(anchor.plan!.block).toEqual(b);
    expect(anchor.plan!.structures!.map((s) => [s.concept, s.size])).toEqual([['la cittadella', 'gargantuan'], ['il mulino', undefined]]);
    for (const [cx, cy] of blockPlaces(b).slice(1)) expect(k.chunks.get(key(cx, cy))!.plan).toMatchObject({ block: b, place: anchor.plan!.place, objects: [], runes: [] });
    // The structure wears the entry, in the middle of the lot: the middle of the middle place.
    const sid = k.ecs.query('structure', 'origin').find((i) => k.ecs.get(i, 'structure').size === 'gargantuan')!;
    expect(k.ecs.get(sid, 'structure')).toMatchObject({ concept: 'la cittadella', model: id });
    expect(k.ecs.get(sid, 'chunk').key).toBe(A);
    const mid = { x: (b.x + 1) * S + S / 2, y: (b.y + 1) * S + S / 2 };
    expect(k.ecs.get(sid, 'pos')).toEqual(mid);
    // Rule 10: in every place the gates out of the lot and the edge of the lot are walked from one gate; the lot is ground at one level.
    const level = k.groundAt(mid.x, mid.y);
    for (const [cx, cy] of blockPlaces(b)) {
      const here = key(cx, cy), ch = k.chunks.get(here)!;
      const reserved = reservedCells(b, S, cx, cy);
      for (const i of reserved) {
        const t = k.palette[ch.tiles[i]];
        expect(t?.solid, `${here} cella ${i}`).toBeFalsy();
        expect(t?.layer ?? 'ground').toBe('ground');
        expect(k.groundAt(cx * S + (i % S) + 0.5, cy * S + Math.floor(i / S) + 0.5)).toBe(level);
      }
      if (reserved.size === S * S) continue;
      const g = blockGates(gates(cx, cy, S, k.config.seed), b, S, k.config.seed, cx, cy).filter((t) => !reserved.has(t));
      const reach = walked(k, here, g[0]);
      for (const t of g) expect(reach.has(t), `${here}: varco ${t}`).toBe(true);
      const l = lotIn(b, S, cx, cy);
      for (let r = Math.max(0, l.y0 - 1); r <= Math.min(S - 1, l.y1 + 1); r++)
        for (let c = Math.max(0, l.x0 - 1); c <= Math.min(S - 1, l.x1 + 1); c++) {
          const i = r * S + c;
          if (!reserved.has(i)) expect(reach.has(i), `${here}: bordo del lotto ${c},${r}`).toBe(true);
        }
    }
    // The ring goes round the 50 tiles through the eight places around the middle one.
    const tileAt = (x: number, y: number) => {
      const cx = Math.floor(x / S), cy = Math.floor(y / S);
      return k.chunks.get(key(cx, cy))!.tiles[(y - cy * S) * S + (x - cx * S)];
    };
    const lot = blockLot(b, S);
    expect(lot.x1 - lot.x0 + 1).toBe(50);
    for (const x of [lot.x0 - 1, lot.x1 + 1]) for (let y = lot.y0 - 1; y <= lot.y1 + 1; y++) expect(k.palette[tileAt(x, y)].solid, `${x},${y}`).toBe(false);
    for (const y of [lot.y0 - 1, lot.y1 + 1]) for (let x = lot.x0 - 1; x <= lot.x1 + 1; x++) expect(k.palette[tileAt(x, y)].solid, `${x},${y}`).toBe(false);
    // Saved with its shape, and loaded again in another kernel: the same places, the same structure.
    expect(k.saveState()).toBe(true);
    const state = JSON.parse(k.repo.head().files['world/state.json']!);
    expect(state.blocks).toEqual({ [A]: { anchor: A, side: 3, lot: 50 } });
    expect(state.rares.gargantuan).toEqual({ [realmOf(b.x, b.y)]: A });
    const again = await Kernel.boot({ files: k.repo.head().files, store: memoryStore(), ai: new Citadels(new Set()), chunks });
    expect(again.blockOfPlace(b.x + 1, b.y + 2)).toEqual({ ...b, anchor: A });
    for (const [cx, cy] of [...blockPlaces(b)].reverse()) expect(await again.planAhead(cx, cy)).toBe('noto');
    for (const [cx, cy] of blockPlaces(b)) expect(again.chunks.get(key(cx, cy))!.tiles, key(cx, cy)).toBe(k.chunks.get(key(cx, cy))!.tiles);
    const sid2 = again.ecs.query('structure', 'origin').find((i) => again.ecs.get(i, 'structure').size === 'gargantuan')!;
    expect(again.ecs.get(sid2, 'pos')).toEqual(mid);
    // Without the state, the plans know the block and its shape.
    const files = { ...k.repo.head().files };
    delete files['world/state.json'];
    const bare = await Kernel.boot({ files, store: memoryStore(), ai: new Citadels(new Set()), chunks });
    expect(await bare.planAhead(b.x + 2, b.y + 1)).toBe('noto');
    expect(bare.blockOfPlace(b.x + 1, b.y + 1)).toEqual({ ...b, anchor: '' });
    expect(bare.chunks.get(key(b.x + 2, b.y + 1))!.tiles).toBe(k.chunks.get(key(b.x + 2, b.y + 1))!.tiles);
  }, 120_000);

  it('the places of a block of 3 × 3 come and go together', async () => {
    const b = { x: 20, y: 24, side: 3, lot: 50 };
    const k = await Kernel.boot({ files: withCitadel(10), store: memoryStore(), ai: new Citadels(new Set([key(b.x, b.y)])), chunks: new MemoryChunks() });
    expect(await k.planAhead(b.x, b.y)).toBe('nuovo');
    const want = new Set<string>();
    // The wanderer looks at one corner place: the block brings the other eight.
    (k as any).wantChunks = (w: Set<string>) => ((k as any).ensureChunk(b.x + 2, b.y + 2), w.add(key(b.x + 2, b.y + 2)), true);
    (k as any).updateChunks();
    for (const [cx, cy] of blockPlaces(b)) want.add(key(cx, cy));
    for (const p of want) expect(k.chunks.has(p), p).toBe(true);
  }, 60_000);

  it('the place that asks is never the middle one, all lot: its plan keeps ground of its own', async () => {
    // The middle place of the block 20,24-22,26. Four places planned first leave free only the block where it would be in the middle.
    const at = { x: 21, y: 25 };
    const k = await Kernel.boot({ files: withCitadel(10), store: memoryStore(), ai: new Citadels(new Set([key(at.x, at.y)])), chunks: new MemoryChunks() });
    for (const [cx, cy] of [[at.x + 2, at.y], [at.x - 2, at.y], [at.x, at.y + 2], [at.x, at.y - 2]]) await k.planAhead(cx, cy);
    expect(await k.planAhead(at.x, at.y)).toBe('nuovo');
    expect(k.chunks.get(key(at.x, at.y))!.plan!.block).toBeUndefined();
    expect(k.blockOfPlace(at.x, at.y)).toBeUndefined();
    expect(k.chunks.get(key(at.x, at.y))!.plan!.structures!.map((s) => s.size)).not.toContain('gargantuan');
  }, 60_000);

  it('at 5 voxels a tile it is 100 tiles, larger than the largest block: no block, it goes down a size', async () => {
    const at = { x: 20, y: 24 };
    const k = await Kernel.boot({ files: withCitadel(5), store: memoryStore(), ai: new Citadels(new Set([key(at.x, at.y)])), chunks: new MemoryChunks() });
    expect(await k.planAhead(at.x, at.y)).toBe('nuovo');
    const ch = k.chunks.get(key(at.x, at.y))!;
    expect(ch.plan!.block).toBeUndefined();
    expect(k.blockOfPlace(at.x, at.y)).toBeUndefined();
    expect(ch.plan!.structures!.map((s) => s.size)).not.toContain('gargantuan');
    expect(k.feed().map((f) => f.text).join('\n')).toMatch(/più grande del blocco più grande/);
  }, 60_000);

  it('at 20 voxels a tile the same entry is 25 tiles and takes the block of 2 × 2 of T370', async () => {
    const at = { x: 20, y: 24 };
    const k = await Kernel.boot({ files: withCitadel(20), store: memoryStore(), ai: new Citadels(new Set([key(at.x, at.y)])), chunks: new MemoryChunks() });
    expect(await k.planAhead(at.x, at.y)).toBe('nuovo');
    expect(k.chunks.get(key(at.x, at.y))!.plan!.block).toEqual({ x: at.x, y: at.y });
    expect(k.blockOfPlace(at.x + 1, at.y + 1)).toEqual({ x: at.x, y: at.y, anchor: key(at.x, at.y) });
  }, 60_000);
});
