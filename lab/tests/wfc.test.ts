import { describe, expect, it } from 'vitest';
import { compose, DEFAULT_STRUCT, sculptBlocks } from '../mj3d/architect';
import { renderStructure } from '../mj3d/composite';
import { run, type Program3 } from '../mj3d/engine';
import { LabMockModels } from '../mj3d/mock';
import { buildBlocks, catalogue, mendBlockset, mendLayout, runLayout, unclosable } from '../mj3d/structure';
import { solve, words } from '../mj3d/wfc';
import { castle, CASTELLO } from '../programs/castello';
import { ROCCA } from '../programs/rocca';

describe('codes', () => {
  it('runs a program with a hundred different codes (no 31-code limit)', () => {
    const codes = Array.from({ length: 100 }, (_, i) => String.fromCharCode(0x100 + i));
    const p: Program3 = {
      size: [10, 10, 1],
      palette: Object.fromEntries(codes.map((c) => [c, { color: '#888888' }])),
      program: { type: 'sequence', children: codes.map((c, i) => ({ type: 'shape' as const, shape: 'box' as const, at: [i % 10, Math.floor(i / 10), 0], size: [1, 1, 1], color: c })) },
    };
    const r = run(p, 1);
    expect(new Set(r.grid.cells).size).toBe(100);
    // A rule whose set holds codes past the 31st still matches.
    const q: Program3 = { ...p, program: { type: 'sequence', children: [p.program, { type: 'all', rules: [{ in: `[${codes.slice(60).join('')}]`, out: codes[0] }] }] } };
    const r2 = run(q, 1);
    expect(r2.grid.cells.filter((c) => r2.grid.alphabet[c] === codes[0]).length).toBe(41);
  });
});

describe('collapse', () => {
  it('solves a simple tiling and refuses an impossible one', () => {
    // Two variants besides empty: A may touch A only, B touches nothing but empty.
    const K = 3, W = words(K);
    const compat = Array.from({ length: 6 }, () => new Uint32Array(K * W));
    for (let d = 0; d < 6; d++) {
      compat[d][0] = 0b111; // empty next to anything
      compat[d][1] = 0b011; // A next to empty or A
      compat[d][2] = 0b001; // B only next to empty
    }
    const X = 6, Y = 6, Z = 1, N = X * Y;
    const domain = new Uint32Array(N * W).fill(0b110);
    const r = solve({ X, Y, Z, K, compat, domain, zone: new Uint16Array(N), weights: [new Float64Array([1, 1, 1])], seed: 1 });
    expect(r.ok).toBe(true);
    // B never touches A.
    for (let i = 0; i < N; i++)
      if (r.assign[i] === 2)
        for (const j of [i - 1, i + 1, i - X, i + X]) if (j >= 0 && j < N && Math.abs((j % X) - (i % X)) <= 1) expect(r.assign[j]).not.toBe(1);
    // A cell fixed to A between two cells fixed to B cannot stand.
    const fixed = new Uint32Array(3 * W);
    fixed[0] = 0b100;
    fixed[1] = 0b010;
    fixed[2] = 0b100;
    const bad = solve({ X: 3, Y: 1, Z: 1, K, compat, domain: fixed, zone: new Uint16Array(3), weights: [new Float64Array([1, 1, 1])], seed: 1, budget: 500 });
    expect(bad.ok).toBe(false);
  });

  it('turns walls and finds the towers of the castle from the sockets alone', () => {
    const b = buildBlocks(CASTELLO, 1);
    const cat = catalogue(CASTELLO, b.built);
    expect(cat.K - 1).toBeGreaterThan(CASTELLO.blocks.length);
    const l = castle([12, 9, 3]);
    const r = runLayout(l, CASTELLO, 2, b.built);
    expect(r.wfc?.ok).toBe(true);
    expect(r.mismatches).toEqual([]);
    expect(r.seams).toEqual([]);
    // The four corners of the ring are towers, turned towards their walls.
    const at = (x: number, y: number, z = 0) => r.placements.find((p) => p.x === x && p.y === y && p.z === z);
    expect([at(1, 1), at(10, 1), at(10, 7), at(1, 7)].map((p) => [p?.block.code, p?.rot])).toEqual([['T', 0], ['T', 1], ['T', 2], ['T', 3]]);
    // Tower tops above the towers only, the roof in four turned quarters.
    expect(r.placements.filter((p) => p.block.code === 'U').length).toBe(4);
    expect(new Set(r.placements.filter((p) => p.block.code === 'R').map((p) => p.rot)).size).toBe(4);
  });

  it('says where an exact piece cannot stand', () => {
    const b = buildBlocks(CASTELLO, 1);
    const notes: string[] = [];
    // A gate in the middle of nowhere: its sides want walls and a bridge.
    const l = mendLayout({ size: [3, 3, 1], palette: { G: { block: 'G', rot: 0 } }, program: { type: 'shape', shape: 'box', at: [1, 1, 0], size: [1, 1, 1], color: 'G' } }, CASTELLO, notes)!;
    const r = runLayout(l, CASTELLO, 1, b.built, 1000);
    expect(r.mismatches.join()).toMatch(/senza alcun blocco possibile|non è riuscito|contro/);
  });

  it('photographs a large castle block by block', () => {
    const b = buildBlocks(CASTELLO, 1);
    const l = castle([40, 40, 3]);
    const r = runLayout(l, CASTELLO, 1, b.built);
    expect(r.wfc?.ok).toBe(true);
    const pic = renderStructure(r.placements, l.size, { seed: 1, view: 1 });
    expect(pic.w).toBeGreaterThan(40 * 20 * 0.9);
    expect(pic.data.some((v, i) => i % 4 === 3 && v === 255)).toBe(true);
  });
});

describe('the two agents, protocol', () => {
  it('writes the catalogue first, then the programs a few at a time, then the zones', async () => {
    const m = new LabMockModels();
    const t = { id: 'c', name: 'Castello', description: 'un castello', tiles: [30, 30, 3] as [number, number, number] };
    const b = await sculptBlocks(m, t, { ...DEFAULT_STRUCT, batch: 4 });
    expect(b.attempts[0].phase).toBe('catalogo');
    expect(b.attempts.filter((a) => a.phase === 'programmi')).toHaveLength(Math.ceil(ROCCA.blocks.length / 4));
    expect(b.set?.blocks.length).toBe(ROCCA.blocks.length);
    expect(b.report?.errors).toEqual([]);
    const c = await compose(m, t, b.set!, b.report!, DEFAULT_STRUCT);
    expect(c.attempts.at(-1)?.error).toBeUndefined();
    expect(c.layout?.size).toEqual([30, 30, 3]);
    expect(c.result?.wfc?.ok).toBe(true);
  });
});

describe('what the kernel refuses before building', () => {
  it('terminates with more than 32 variants (bit 31 of a word)', () => {
    const K = 40, W = words(K);
    const compat = Array.from({ length: 6 }, () => {
      const c = new Uint32Array(K * W);
      for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) if (a === 0 || b === 0 || Math.abs(a - b) <= 1) c[a * W + (b >>> 5)] |= 1 << (b & 31);
      return c;
    });
    const X = 8, Y = 8, Z = 1, N = X * Y;
    const domain = new Uint32Array(N * W);
    for (let c = 0; c < N; c++) {
      domain[c * W] = 0xffffffff;
      domain[c * W + 1] = (1 << (K - 32)) - 1;
    }
    const r = solve({ X, Y, Z, K, compat, domain, zone: new Uint16Array(N), weights: [new Float64Array(K).fill(1)], seed: 3, budget: 3000 });
    expect(r.ms).toBeLessThan(3000);
    expect(r.ok).toBe(true);
  });

  it('finds blocks that can never close, and zones that can never touch', () => {
    const keep = { ...CASTELLO.blocks.find((b) => b.code === 'K')! };
    const set = { ...CASTELLO, open: ['acqua', 'ponte'], blocks: CASTELLO.blocks.map((b) => (b.code === 'K' ? keep : b)) };
    // Without "mastio" among the open sockets, a keep needs keeps on every side, for ever.
    expect(unclosable(set).map((d) => d.code)).toContain('K');
    expect(unclosable(CASTELLO)).toEqual([]);
    const b = buildBlocks(CASTELLO, 1);
    const notes: string[] = [];
    const l = mendLayout({ size: [4, 1, 1], zones: { A: { blocks: 'A' }, R: { blocks: 'R' } }, palette: {}, program: { type: 'sequence', children: [{ type: 'shape', shape: 'box', at: [0.5, 0, 0], size: [2, 1, 1], color: 'A' }, { type: 'shape', shape: 'box', at: [2.5, 0, 0], size: [2, 1, 1], color: 'R' }] } }, CASTELLO, notes)!;
    const r = runLayout(l, CASTELLO, 1, b.built, 500);
    expect(r.mismatches.join()).toContain('non può avere la zona R');
  });
});

describe('codes the sculptor writes', () => {
  it('keeps blocks with long codes, giving them a free character', () => {
    const prog = { palette: {}, program: { type: 'shape', shape: 'box', at: [9.5, 9.5, 0], size: [1, 1, 1], color: '.' } };
    const notes: string[] = [];
    const set = mendBlockset(
      {
        blocks: [
          { code: 'M', name: 'muro', sockets: { n: 'a', e: 'm', s: 'a', w: 'm' }, program: prog },
          { code: 'MC', name: 'angolo', sockets: { n: 'a', e: 'm', s: 'a', w: 'a' }, program: prog },
          { code: 'K2', name: 'porta', sockets: { n: 'a', e: 'm', s: 'a', w: 'm' }, actions: [{ label: 'apri', to: 'K3' }], program: prog },
          { code: 'K3', name: 'porta aperta', sockets: { n: 'a', e: 'm', s: 'a', w: 'm' }, program: prog },
        ],
      },
      notes,
    )!;
    expect(set.blocks.map((b) => b.code)).toEqual(['M', 'C', 'K', '3']);
    expect(set.blocks[1].alias).toBe('MC');
    // Actions follow the new codes; a later answer may refer to a block by the code it wrote.
    expect(set.blocks[2].actions?.[0].to).toBe('3');
    const more = mendBlockset({ blocks: [{ code: 'K3', name: 'porta aperta 2', sockets: {}, program: prog }, { code: 'MT', name: 'testata', sockets: {}, program: prog }] }, [], set)!;
    expect(more.blocks.map((b) => b.code)).toEqual(['3', 'T']);
  });
});
