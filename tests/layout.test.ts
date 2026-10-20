import { describe, expect, it } from 'vitest';
import { run, compile, writtenCodes, type MjNode } from '../src/kernel/mj';
import { gates, layout } from '../src/kernel/layout';
import type { TileDef } from '../src/kernel/types';

const palette: Record<string, TileDef> = {
  g: { name: 'prato', color: '#4f9a45', solid: false, layer: 'ground' },
  p: { name: 'sentiero', color: '#c8a868', solid: false, layer: 'ground' },
  t: { name: 'bosco', color: '#1f5a2a', solid: true, layer: 'vegetation' },
  w: { name: 'acqua', color: '#3a78c8', solid: true, layer: 'liquid' },
  r: { name: 'roccia', color: '#8a8a92', solid: true, layer: 'rock' },
  h: { name: 'muro', color: '#8c4a32', solid: true, layer: 'wall' },
  f: { name: 'pavimento', color: '#a07850', solid: false, layer: 'floor', indoor: true },
  d: { name: 'porta', color: '#e0c040', solid: false, layer: 'door' },
};

const grid = (rows: string[]) => ({ w: rows[0].length, h: rows.length, cells: rows.join('').split('') });

describe('MarkovJunior engine', () => {
  it('one: grows a random walk until it cannot', () => {
    const g = grid(['ggggg', 'ggggg', 'ggpgg', 'ggggg', 'ggggg']);
    run({ type: 'one', rules: [{ in: 'pg', out: 'pp' }] }, g, 1);
    expect(g.cells.every((c) => c === 'p')).toBe(true);
  });

  it('respects steps, symmetry and wildcards', () => {
    const g = grid(['gggggggg', 'gggggggg', 'gggggggg', 'gggggggg']);
    run({ type: 'one', rules: [{ in: 'ggg/ggg', out: 'hhh/hdh' }], steps: 2, symmetry: 'none' }, g, 3);
    expect(g.cells.filter((c) => c === 'd').length).toBe(2);
    const h = grid(['gtg', 'ttt', 'gtg']);
    run({ type: 'all', rules: [{ in: 't', out: 'g' }] }, h, 1);
    expect(h.cells.join('')).toBe('ggggggggg');
    const k = grid(['gtg']);
    run({ type: 'one', rules: [{ in: '[gt]*', out: 'w*' }], steps: 1, symmetry: 'none' }, k, 1);
    expect(k.cells.filter((c) => c === 'w').length).toBe(1);
  });

  it('sequence runs children in order; markov goes back to the first that applies', () => {
    const g = grid(['gggg', 'gggg']);
    run({ type: 'sequence', children: [{ type: 'all', rules: [{ in: 'g', out: 't' }] }, { type: 'one', rules: [{ in: 't', out: 'r' }], steps: 3 }] }, g, 2);
    expect(g.cells.filter((c) => c === 'r').length).toBe(3);
    expect(g.cells.filter((c) => c === 't').length).toBe(5);
  });

  it('path connects cells over allowed terrain and never writes fixed cells', () => {
    const open = grid(['dgggg', 'ttttg', 'ggggp']);
    run({ type: 'path', from: 'd', to: 'p', on: 'g', color: 'p' }, open, 1);
    expect(open.cells.join('')).toBe('dppppttttpggggp');
    // The only route passes through a fixed cell: nothing is drawn.
    const blocked = { ...grid(['dgggg', 'ttttg', 'ggggp']), fixed: new Set([2]) };
    run({ type: 'path', from: 'd', to: 'p', on: 'g', color: 'p' }, blocked, 1);
    expect(blocked.cells.join('')).toBe('dggggttttgggggp');
  });

  it('rejects malformed programs and lists what they write', () => {
    expect(() => compile({ type: 'one', rules: [{ in: 'gg', out: 'g' }] })).toThrow(/forma/);
    expect(() => compile({ type: 'sequence', children: [] })).toThrow(/figli/);
    expect(() => compile({ type: 'boh' } as unknown as MjNode)).toThrow(/sconosciuto/);
    expect([...writtenCodes({ type: 'sequence', children: [{ type: 'one', rules: [{ in: 'g', out: 'h' }] }, { type: 'path', from: 'd', to: 'p', on: 'g', color: 'p' }] })].sort()).toEqual(['h', 'p']);
  });
});

describe('layout', () => {
  const S = 18;
  const forest = Array.from({ length: S }, () => 't'.repeat(S));
  const village: MjNode = {
    type: 'sequence',
    children: [
      { type: 'prl', rules: [{ in: 't', out: 'g', p: 1 }] },
      { type: 'one', rules: [{ in: 'ggggg/ggggg/ggggg/ggggg/ggggg', out: 'hhhhh/hfffh/hfffh/hfffh/hhdhh' }], steps: 2 },
    ],
  };

  it('gates agree between neighbours', () => {
    const a = gates(0, 0, S, 7);
    const right = gates(1, 0, S, 7);
    const below = gates(0, 1, S, 7);
    expect(Math.floor(a[1] / S)).toBe(Math.floor(right[0] / S)); // east of (0,0) = west of (1,0)
    expect(a[3] % S).toBe(below[2] % S); // south of (0,0) = north of (0,1)
  });

  it('carves paths so every gate is reachable, even in a solid forest', () => {
    const r = layout(forest, palette, { cx: 3, cy: -2, seed: 1, pathCode: 'p' });
    for (const g of r.gates) expect(r.reachable.has(g)).toBe(true);
    expect(r.carved).toBeGreaterThan(0);
    // The border stays the draft except at gates: chunks join seamlessly.
    for (let i = 1; i < S - 1; i++) if (!r.gates.includes(i)) expect(r.grid[0][i]).toBe('t');
  });

  it('runs the program, keeps the border, finds buildings and makes their doors reachable', () => {
    const r = layout(forest, palette, { cx: 0, cy: 0, seed: 5, program: village, pathCode: 'p' });
    expect(r.buildings.length).toBe(2);
    for (const b of r.buildings) {
      expect(b.floor.length).toBe(9);
      expect(b.doors.length).toBe(1);
      expect(r.reachable.has(b.doors[0])).toBe(true);
    }
    expect(r.grid[0].replace(/p/g, 't')).toBe('t'.repeat(S));
  });
});

describe('program repair', () => {
  it('mends rows of different lengths, drops unknown nodes and oversized rules', async () => {
    const { repairProgram } = await import('../src/kernel/mj');
    const notes: string[] = [];
    const p = repairProgram(
      {
        type: 'sequence',
        children: [
          { type: 'one', rules: [{ in: 'ggggg/ggggg/ggggg', out: 'hhhh/hfh/hhdhhh' }], steps: 1 },
          { type: 'add_objects', what: 'trees' },
          { type: 'all', rules: [{ in: 'g'.repeat(13), out: 't'.repeat(13) }] },
        ],
      },
      notes,
    )!;
    expect(p).toEqual({ type: 'sequence', children: [{ type: 'one', rules: [{ in: 'ggggg/ggggg/ggggg', out: 'hhhh*/hfh**/hhdhh' }], steps: 1 }, { type: 'all', rules: [{ in: 'g'.repeat(13), out: 't'.repeat(13) }] }] });
    expect(notes.join()).toMatch(/add_objects/);
    expect(() => compile(p)).not.toThrow();
    expect(repairProgram({ type: 'boh' })).toBeNull();
  });
});

describe('structure stamps', () => {
  it('a castle has its moat, walls, a drawbridge at the gate and a keep, in the world codes', () => {
    const rows = Array.from({ length: 18 }, () => 'g'.repeat(18));
    const pal = { ...palette, b: { name: 'muro di pietra', color: '#888888', solid: true, layer: 'wall' as const }, z: { name: 'ponte levatoio', color: '#8b6a42', solid: false, layer: 'floor' as const }, l: { name: 'pavimento di pietra', color: '#999999', solid: false, layer: 'floor' as const, indoor: true } };
    const r = layout(rows, pal, { cx: 3, cy: 2, seed: 9, pathCode: 'p', program: { type: 'stamp', shape: 'castello', codes: { muro: 'b', pavimento: 'l', ponte: 'z' } } as MjNode });
    const all = r.grid.join('');
    expect(all).toMatch(/w/);
    expect(all).toMatch(/z/);
    expect((all.match(/b/g) ?? []).length).toBeGreaterThan(30);
    expect(r.buildings.length).toBeGreaterThan(0);
    // The keep's door is reachable: the gate crosses the moat on the drawbridge.
    expect(r.buildings.every((b) => b.doors.some((d) => r.reachable.has(d)))).toBe(true);
  });

  it('every stamp fits an 18×18 place', () => {
    for (const shape of ['casa', 'castello', 'fortezza', 'torre', 'tempio', 'piramide', 'capanne', 'recinto', 'caserma', 'dungeon', 'tana', 'pozzo']) {
      const g = { w: 18, h: 18, cells: Array(18 * 18).fill('g') };
      expect(run({ type: 'stamp', shape } as MjNode, g, 4), shape).toBeGreaterThan(0);
    }
  });
});
