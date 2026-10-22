import { describe, expect, it } from 'vitest';
import { emptyUsage, type Models, type TextCall } from '../../src/kernel/ai/models';
import { analyse, mendProgram } from '../mj3d/check';
import { at, Mj3Error, run, type Program3 } from '../mj3d/engine';
import { EXAMPLES } from '../mj3d/examples';
import { LabMockModels } from '../mj3d/mock';
import { render, turn } from '../mj3d/render';
import { review, sculpt, sculptorSystem, DEFAULT_SCULPT, type Target } from '../mj3d/sculptor';
import { PRESETS, universeTargets } from '../mj3d/targets';

const count = (p: Program3, seed = 1) => {
  const r = run(p, seed);
  const n: Record<string, number> = {};
  for (const c of r.grid.cells) n[r.grid.alphabet[c]] = (n[r.grid.alphabet[c]] ?? 0) + 1;
  return { r, n };
};
const prog = (size: [number, number, number], program: Program3['program'], extra: Partial<Program3> = {}): Program3 => ({ size, palette: { A: { color: '#888' }, B: { color: '#444' } }, program, ...extra });

describe('MarkovJunior 3D', () => {
  it('grows a column upwards from the origin, one voxel per step', () => {
    const { r, n } = count(prog([5, 5, 10], { type: 'one', rules: [{ in: 'A .', out: 'A A' }], steps: 6 }, { origin: 'A' }));
    expect(n.A).toBe(7);
    for (let z = 0; z < 7; z++) expect(at(r.grid, 2, 2, z)).toBe('A');
  });

  it('keeps gravity with symmetry xy and grows everywhere with all', () => {
    const flat = run(prog([9, 9, 9], { type: 'one', rules: [{ in: 'A.', out: 'AA' }], steps: 30 }, { origin: 'A' }), 1);
    for (let i = 0; i < flat.grid.cells.length; i++) if (flat.grid.cells[i]) expect(Math.floor(i / 81)).toBe(0);
    const round = run(prog([9, 9, 9], { type: 'one', rules: [{ in: 'A.', out: 'AA' }], steps: 60, symmetry: 'all' }, { origin: 'A' }), 1);
    expect([...round.grid.cells].some((c, i) => c && Math.floor(i / 81) > 0)).toBe(true);
  });

  it('runs to completion when nothing matches, and stops at the step budget when it never does', () => {
    const fill = run(prog([4, 4, 4], { type: 'all', rules: [{ in: '.', out: 'A' }] }), 1);
    expect(fill.finished).toBe(true);
    expect(fill.grid.cells.every((c) => c === 1)).toBe(true);
    const flip = run(prog([2, 2, 2], { type: 'markov', children: [{ type: 'one', rules: [{ in: '.', out: 'A' }, { in: 'A', out: '.' }], symmetry: 'none' }] }), 1, 500);
    expect(flip.finished).toBe(false);
  });

  it('is deterministic for a seed', () => {
    const p = EXAMPLES[0].program;
    expect([...run(p, 7).grid.cells]).toEqual([...run(p, 7).grid.cells]);
    expect([...run(p, 7).grid.cells]).not.toEqual([...run(p, 8).grid.cells]);
  });

  it('draws shapes resting on their base centre', () => {
    const box = count(prog([10, 10, 10], { type: 'shape', shape: 'box', at: [5, 5, 0], size: [3, 5, 2], color: 'A' })).n;
    expect(box.A).toBe(30);
    const { r } = count(prog([12, 12, 12], { type: 'shape', shape: 'ellipsoid', at: [6, 6, 0], size: [7, 7, 7], color: 'A' }));
    expect(at(r.grid, 6, 6, 0)).toBe('A');
    expect(at(r.grid, 6, 6, 6)).toBe('A');
    expect(at(r.grid, 6, 6, 7)).toBe('.');
    const line = count(prog([10, 10, 10], { type: 'shape', shape: 'line', at: [1, 1, 1], to: [8, 1, 1], color: 'A' })).n;
    expect(line.A).toBe(8);
  });

  it('smooths with conv and connects with path', () => {
    const conv = count(
      prog([5, 5, 5], {
        type: 'sequence',
        children: [
          { type: 'shape', shape: 'box', at: [2, 2, 0], size: [5, 5, 5], color: 'A' },
          { type: 'shape', shape: 'box', at: [2, 2, 2], size: [1, 1, 1], color: '.' },
          { type: 'conv', rules: [{ in: '.', out: 'A', neighbors: 'A', min: 20 }] },
        ],
      }),
    ).n;
    expect(conv['.'] ?? 0).toBe(0);
    const { r } = count(
      prog([9, 3, 3], {
        type: 'sequence',
        children: [
          { type: 'shape', shape: 'box', at: [0, 1, 0], size: [1, 1, 1], color: 'A' },
          { type: 'shape', shape: 'box', at: [8, 1, 0], size: [1, 1, 1], color: 'B' },
          { type: 'path', from: 'A', to: 'B', on: '.', color: 'A' },
        ],
      }),
    );
    const analysis = analyse({ grid: r.grid, steps: 0, finished: true, ms: 0 }, { A: { color: '#888' }, B: { color: '#444' } });
    expect(analysis.parts).toBe(1);
  });

  it('refuses what it cannot run and mends what it can', () => {
    expect(() => run(prog([4, 4, 4], { type: 'one', rules: [{ in: 'AB', out: 'A' }] }), 1)).toThrow(Mj3Error);
    expect(() => run({ ...prog([4, 4, 4], { type: 'one', rules: [{ in: 'A', out: 'B' }] }), size: [99, 4, 4] }, 1)).toThrow(Mj3Error);
    const notes: string[] = [];
    const p = mendProgram({ size: [8, 8, 8], palette: { A: '#888' }, program: [{ type: 'one', rules: [{ in: 'A ..', out: 'A A' }], steps: 3 }, { type: 'boh' }] }, notes)!;
    expect(p.program.type).toBe('sequence');
    expect(() => run(p, 1)).not.toThrow();
    expect(notes.some((n) => n.includes('riparata'))).toBe(true);
    expect(notes.some((n) => n.includes('boh'))).toBe(true);
  });

  it('measures floating, detached and empty models', () => {
    const palette = { A: { color: '#888' } };
    const floating = analyse(run(prog([6, 6, 6], { type: 'shape', shape: 'box', at: [3, 3, 2], size: [3, 3, 2], color: 'A' }), 1), palette);
    expect(floating.errors.join()).toContain('non tocca terra');
    const hidden = analyse(run(prog([6, 6, 6], { type: 'shape', shape: 'box', at: [3, 3, 0], size: [3, 3, 2], color: 'S' }), 1), palette);
    expect(hidden.errors.join()).toContain('vuoto');
  });
});

describe('3/4 photographs', () => {
  it('turns the model so its front faces each side', () => {
    // A single voxel on the front edge (+y) in the middle.
    const r = run(prog([3, 3, 1], { type: 'shape', shape: 'box', at: [1, 2, 0], size: [1, 1, 1], color: 'A' }), 1);
    const where = (v: number) => {
      const t = turn(r.grid, v);
      const i = t.cells.findIndex((c) => c > 0);
      return [i % t.X, Math.floor(i / t.X) % t.Y];
    };
    expect(where(0)).toEqual([1, 2]); // front towards the camera
    expect(where(1)).toEqual([2, 1]); // facing right
    expect(where(2)).toEqual([1, 0]); // back
    expect(where(3)).toEqual([0, 1]); // facing left
  });

  it('renders every example from four sides', () => {
    for (const e of EXAMPLES) {
      const r = run(e.program, 1);
      expect(analyse(r, e.program.palette).errors).toEqual([]);
      for (let v = 0; v < 4; v++) {
        const p = render(r.grid, e.program.palette, v);
        expect(p.w).toBeGreaterThan(8);
        expect(p.data.some((x, i) => i % 4 === 3 && x === 255)).toBe(true);
      }
    }
  });
});

describe('the sculptor', () => {
  const target: Target = { id: 'preset:pino', name: 'Pino', category: 'semplice', description: 'un pino alto' };

  it('answers offline with the closest example, and the artist reviews it', async () => {
    const m = new LabMockModels();
    const s = await sculpt(m, target, DEFAULT_SCULPT);
    expect(s.program?.name).toBe('Pino');
    expect(s.analysis?.errors).toEqual([]);
    const c = await review(m, target, 'data:image/png;base64,');
    expect(['approvato', 'da rifare']).toContain(c.verdetto);
  });

  it('sends an invalid program back with the reason', async () => {
    const prompts: string[] = [];
    let n = 0;
    const m: Models = {
      name: 'stub',
      canPaint: false,
      usage: emptyUsage(),
      limits: { text: 10, images: 0 },
      async text(call: TextCall) {
        prompts.push(call.prompt);
        return n++ === 0 ? JSON.stringify({ size: [8, 8, 8], palette: { A: { color: '#888' } }, program: { type: 'shape', shape: 'box', at: [4, 4, 3], size: [2, 2, 2], color: 'A' } }) : JSON.stringify(EXAMPLES.find((e) => e.id === 'pino')!.program);
      },
      async image() {
        return null;
      },
    };
    const s = await sculpt(m, target, DEFAULT_SCULPT);
    expect(s.attempts).toHaveLength(2);
    expect(s.attempts[0].error).toContain('non tocca terra');
    expect(prompts[1]).toContain('Non va: non tocca terra');
    expect(s.analysis?.errors).toEqual([]);
  });

  it('leaves shapes out of the prompt and the examples when only rules are allowed', () => {
    const s = sculptorSystem({ ...DEFAULT_SCULPT, shapes: false });
    expect(s).toContain('NON esiste');
    expect(s).not.toContain('"type":"shape"');
  });
});

describe('targets', () => {
  it('has presets for the three steps and reads the assets of a universe', () => {
    for (const c of ['semplice', 'struttura', 'figura']) expect(PRESETS.some((t) => t.category === c)).toBe(true);
    const files = {
      'modules/world.terrain/manifest.json': JSON.stringify({ tiles: { r: { name: 'Roccia', layer: 'rock', sprites: ['img:1'] }, g: { name: 'Prato', layer: 'ground' } } }),
      'modules/npc.fabbro/manifest.json': JSON.stringify({ id: 'npc.fabbro', name: 'Fabbro', kind: 'entity', appearance: { imagePrompt: 'un fabbro', sprite: 'img:2' } }),
      'modules/object.well/manifest.json': JSON.stringify({ id: 'object.well', name: 'Pozzo', kind: 'entity', appearance: {} }),
    };
    const ts = universeTargets(files);
    expect(ts.map((t) => [t.name, t.category])).toEqual([
      ['Roccia', 'semplice'],
      ['Fabbro', 'figura'],
      ['Pozzo', 'struttura'],
    ]);
  });
});
