import { describe, expect, it } from 'vitest';
import { rig, sway, walk } from '../mj3d/animate';
import { run, type Grid3 } from '../mj3d/engine';
import { EXAMPLES } from '../mj3d/examples';
import { LabMockModels } from '../mj3d/mock';
import { render, DAY } from '../mj3d/render';
import { boxOf, classOf, CLASSES, guessClass, TILE } from '../mj3d/scale';
import { DEFAULT_SCULPT, sculpt } from '../mj3d/sculptor';
import { compose, DEFAULT_STRUCT, sculptBlocks } from '../mj3d/architect';
import { act, buildBlocks, checkSockets, expand, faceMatch, mendLayout, rotateGrid, rotateSockets, runLayout, tileMap, type Blockset } from '../mj3d/structure';
import { CASTELLO, CASTELLO_PIANTA } from '../programs/castello';
import { SOTTERRANEO, SOTTERRANEO_PIANTA } from '../programs/sotterraneo';
import { viandante } from '../programs/viandante';
import { CRIPTA } from '../programs/cripta';

const differs = (a: Grid3, b: Grid3) => a.cells.some((c, i) => c !== b.cells[i]);

describe('scale', () => {
  it('gives every class one box, so similar things share proportions', () => {
    expect(boxOf(classOf('albero')!)).toEqual([2 * TILE, 2 * TILE, 3 * TILE]);
    expect(guessClass('Una quercia frondosa').id).toBe('albero');
    expect(guessClass('Il fabbro', 'figura').id).toBe('persona');
    expect(guessClass('un lupo grigio', 'figura').id).toBe('bestia');
    // The JSON programs of steps 8A-8E stay within 64 voxels a side; large structures are for the XML sculptor.
    for (const c of CLASSES.filter((c) => c.id !== 'grande')) for (const v of boxOf(c)) expect(v).toBeLessThanOrEqual(64);
    expect(boxOf(classOf('grande')!)).toEqual([5 * TILE, 5 * TILE, 4 * TILE]);
  });

  it('forces the class box on the program and refuses a tree too short', async () => {
    const short = { ...EXAMPLES.find((e) => e.id === 'masso')!.program, size: [10, 10, 10] };
    let n = 0;
    const m = new LabMockModels();
    m.text = async () => JSON.stringify(n++ ? EXAMPLES.find((e) => e.id === 'pino')!.program : short);
    const s = await sculpt(m, { id: 't', name: 'Pino', category: 'semplice', kind: 'albero' }, DEFAULT_SCULPT);
    expect(s.attempts[0].notes.join()).toContain('scatola della classe');
    expect(s.attempts[0].error).toContain('troppo basso');
    expect(s.program?.size).toEqual([40, 40, 60]);
    expect(s.analysis?.errors).toEqual([]);
  });
});

describe('frames', () => {
  it('finds the skeleton of the wanderer and walks it', () => {
    const p = viandante(28, [20, 15, 30]);
    const g = run(p, 1).grid;
    const r = rig(g, p.palette);
    expect(r.limbs.filter((l) => l.part === 'gamba')).toHaveLength(2);
    expect(r.guessed).toBe(false);
    const { frames } = walk(g, p.palette);
    expect(frames).toHaveLength(3);
    expect(differs(frames[0], g)).toBe(true);
    expect(differs(frames[1], g)).toBe(false);
    expect(differs(frames[0], frames[2])).toBe(true);
  });

  it('guesses the legs when the palette has no parts, bends trees, moves shadows', () => {
    const p = EXAMPLES.find((e) => e.id === 'quercia')!.program;
    const g = run(p, 1).grid;
    expect(rig(g, p.palette).guessed).toBe(true);
    const wind = sway(g, 3);
    expect(wind).toHaveLength(4);
    expect(differs(wind[2], g)).toBe(true);
    const [morning, , , evening] = DAY.map((d) => render(g, p.palette, 0, { px: 1, top: 1, front: 1, outline: false, shadow: true, light: true, crop: false, sun: d.sun }));
    expect(morning.data.join()).not.toEqual(evening.data.join());
  });
});

describe('blocks and sockets', () => {
  it('turns voxels and sockets the same way', () => {
    const p = { size: [4, 4, 1] as [number, number, number], palette: { A: { color: '#888' } }, program: { type: 'shape' as const, shape: 'box' as const, at: [1, 0, 0] as [number, number, number], size: [1, 1, 1] as [number, number, number], color: 'A' } };
    // A voxel on the north edge goes to the east edge after a quarter turn.
    const g = rotateGrid(run(p, 1).grid, 1);
    const i = g.cells.findIndex((c) => c > 0);
    expect([i % 4, Math.floor(i / 4)]).toEqual([3, 1]);
    expect(rotateSockets({ n: 'a', e: 'b', s: 'c', w: 'd' }, 1)).toMatchObject({ n: 'd', e: 'a', s: 'b', w: 'c' });
  });

  it('measures how two faces continue each other', () => {
    const a = new Uint8Array([1, 1, 0, 0]);
    expect(faceMatch(a, new Uint8Array([0, 0, 1, 1]), 4)).toBe(1);
    expect(faceMatch(a, new Uint8Array([1, 1, 0, 0]), 4)).toBe(0);
  });

  it('builds the hand-written castle with every socket and seam right', () => {
    const b = buildBlocks(CASTELLO, 1);
    expect(b.errors).toEqual([]);
    const r = runLayout(CASTELLO_PIANTA, CASTELLO, 1, b.built);
    expect(r.mismatches).toEqual([]);
    expect(r.seams).toEqual([]);
    expect(r.placements.filter((p) => p.block.code === 'G')).toHaveLength(1);
    expect(r.placements.filter((p) => p.block.code === 'T')).toHaveLength(4);
    // The gate opens and the bridge goes up: other blocks, same places.
    const tiles = tileMap(r.placements);
    const gate = r.placements.find((p) => p.block.code === 'G')!;
    expect(tiles.find((t) => t.x === gate.x && t.y === gate.y && t.z === 0)!.walk).toBe(false);
    const opened = act(CASTELLO, r.placements, gate, gate.block.actions![0]);
    expect(tileMap(opened).find((t) => t.x === gate.x && t.y === gate.y && t.z === 0)!.walk).toBe(true);
    const e = expand(opened, CASTELLO_PIANTA.size, { seed: 1, cut: 1 });
    expect(e.grid.Z).toBe(TILE);
    expect(e.grid.cells.some((c) => c > 0)).toBe(true);
  });

  it('fills the dungeon with the collapse, stairs always under their landing', () => {
    const b = buildBlocks(SOTTERRANEO, 1);
    for (const seed of [1, 2, 3]) {
      const r = runLayout(SOTTERRANEO_PIANTA, SOTTERRANEO, seed, b.built);
      expect(r.mismatches).toEqual([]);
      expect(r.placements).toHaveLength(8 * 8 * 2);
      for (const p of r.placements.filter((q) => q.block.code === 'U')) expect(r.placements.find((q) => q.x === p.x && q.y === p.y && q.z === p.z + 1)?.block.code).toBe('V');
    }
  });

  it('reports sockets that do not fit, and mends layouts', () => {
    const notes: string[] = [];
    const l = mendLayout({ size: [2, 1, 1], palette: { a: { block: 'M', rot: 0 }, b: { block: 'Z' } }, program: { type: 'shape', shape: 'box', at: [0, 0, 0], size: [1, 1, 1], color: 'a' } }, CASTELLO, notes)!;
    expect(notes.join()).toContain('blocco sconosciuto');
    expect(l.palette.a).toEqual({ block: 'M', rot: 0 });
    const M = CASTELLO.blocks.find((b) => b.code === 'M')!;
    const A = CASTELLO.blocks.find((b) => b.code === 'A')!;
    // A wall's east side ("muro") against water ("acqua").
    const { mismatches } = checkSockets([{ x: 0, y: 0, z: 0, code: 'M', block: M, rot: 0 }, { x: 1, y: 0, z: 0, code: 'A', block: A, rot: 0 }], [2, 1, 1]);
    expect(mismatches).toHaveLength(1);
  });

  it('runs the two agents offline', async () => {
    const m = new LabMockModels();
    const t = { id: 's', name: 'Sotterraneo', description: 'corridoi' };
    const b = await sculptBlocks(m, t, DEFAULT_STRUCT);
    expect(b.set?.blocks.length).toBe(CRIPTA.blocks.length);
    const c = await compose(m, t, b.set as Blockset, b.report!, DEFAULT_STRUCT);
    expect(c.attempts.at(-1)?.error).toBeUndefined();
    expect(c.result?.placements.length).toBe(20 * 20 * 2);
  });
});
