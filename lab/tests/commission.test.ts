import { describe, expect, it } from 'vitest';
import { buildStructure, compose, DEFAULT_STRUCT, planStructure, sculptBlocks } from '../mj3d/architect';
import { commission, uncovered } from '../mj3d/commission';
import { LabMockModels } from '../mj3d/mock';
import { buildBlocks, expand, rotateSockets, runLayout, type Layout } from '../mj3d/structure';
import { TILE } from '../mj3d/scale';
import { ROCCA, rocca } from '../programs/rocca';

const box = (x: number, y: number, w: number, h: number, color: string) => ({ type: 'shape' as const, shape: 'box' as const, at: [x + (w - 1) / 2, y + (h - 1) / 2, 0] as [number, number, number], size: [w, h, 1] as [number, number, number], color });

describe('the architect commissions the blocks (ADR-0035)', () => {
  it('never shows the water side of a wall to the courtyard', () => {
    const built = buildBlocks(ROCCA, 1).built;
    const inside = new Set(['c', 's', 'o']);
    for (let seed = 1; seed <= 8; seed++) {
      const l = rocca([24, 24, 3]);
      const r = runLayout(l, ROCCA, seed, built);
      expect(r.wfc?.ok).toBe(true);
      const [X, Y] = l.size;
      for (const p of r.placements) {
        const s = rotateSockets(p.block.sockets, p.rot);
        for (const [side, dx, dy] of [['n', 0, -1], ['e', 1, 0], ['s', 0, 1], ['w', -1, 0]] as const) {
          if (s[side] !== 'acqua') continue;
          const x = p.x + dx, y = p.y + dy;
          if (x < 0 || y < 0 || x >= X || y >= Y) continue;
          expect(inside.has(r.cells[x + y * X + p.z * X * Y]), `${p.block.name} a (${p.x},${p.y}) lato ${side}`).toBe(false);
        }
      }
    }
  });

  it('reads the configurations off the plan, the same in every turn', () => {
    // A ring of walls round a courtyard: four corners alike, four middles alike; the cells beside the
    // corners are two configurations, mirror images of each other (a turn cannot make one the other).
    const plan: Layout = { size: [5, 5, 1], palette: {}, zones: { W: { name: 'mura' } }, open: { c: ['vuoto'] }, program: { type: 'sequence', children: [box(0, 0, 5, 5, 'W'), box(1, 1, 3, 3, 'c')] } };
    const c = commission(plan, 1);
    expect(c.configs.map((k) => k.count)).toEqual([4, 4, 4, 4]);
    const corner = c.configs.find((k) => k.sig === c.sigs[0])!;
    expect(c.sigs[4]).toBe(corner.sig);
    expect(c.sigs[24]).toBe(corner.sig);
    expect(corner.text).toMatch(/fuori.*fuori/);
  });

  it('tells which configuration no block can take, and why the collapse would fail', () => {
    // A tee of walls with only straight walls to fill it.
    const plan: Layout = { size: [5, 3, 1], palette: {}, zones: { W: { name: 'mura', blocks: 'M' } }, open: { c: ['vuoto'] }, program: { type: 'sequence', children: [box(0, 0, 5, 3, 'c'), box(0, 1, 5, 1, 'W'), box(2, 0, 1, 1, 'W')] } };
    const r = runLayout(plan, ROCCA, 1, undefined, 500);
    // The first dead end is named with its configuration (here the wall's end at the edge of the map)…
    expect(r.mismatches[0]).toMatch(/^nessun blocco della zona W \(mura\) può stare in \(\d,\d,0\), configurazione W\d/);
    // …and the tee is among the configurations left empty, with what it has round it.
    expect(r.mismatches.join()).toContain('n c · e mura · s mura · o mura');
  });

  it('runs the whole chain offline: plan, commission, blocks to order, composition', async () => {
    const m = new LabMockModels();
    const t = { id: 'r', name: 'Rocca', description: 'un borgo fortificato', tiles: [18, 18, 3] as [number, number, number] };
    const plan = await planStructure(m, t, DEFAULT_STRUCT);
    expect(plan.attempts.at(-1)?.error).toBeUndefined();
    // The plan names no blocks: the zones are served by what the sculptor makes for them.
    expect(Object.values(plan.layout!.zones!).every((z) => !z.blocks || z.blocks === '.')).toBe(true);
    const b = await sculptBlocks(m, t, DEFAULT_STRUCT, undefined, { layout: plan.layout!, commission: plan.commission! });
    expect(b.report?.errors).toEqual([]);
    expect(uncovered(plan.layout!, b.set!, plan.commission!)).toEqual([]);
    const c = await compose(m, t, b.set!, b.report!, DEFAULT_STRUCT, undefined, plan.layout!);
    expect(c.attempts).toHaveLength(1);
    expect(c.result?.wfc?.ok).toBe(true);
    expect(c.result?.mismatches).toEqual([]);
    // Without the knot tower, its orders stay open and the sculptor is told which.
    const lacking = { ...b.set!, blocks: b.set!.blocks.filter((x) => x.code !== 'C') };
    const knots = plan.commission!.configs.filter((k) => k.zone === 'Q');
    expect(uncovered(plan.layout!, lacking, plan.commission!).map((k) => k.id)).toEqual(knots.map((k) => k.id));
  });

  it('orders the blocks the composition finds missing, keeping the plan', async () => {
    const m = new LabMockModels();
    const t = { id: 'r', name: 'Rocca', description: 'un borgo fortificato', tiles: [24, 24, 3] as [number, number, number] };
    // A sculptor whose knot tower has the water sides of a corner tower: it serves the order but cannot stand there…
    const forgetful = new LabMockModels();
    const text = forgetful.text.bind(forgetful);
    forgetful.text = async (call) => {
      const raw = await text(call);
      if (call.task !== 'lab.catalog' && call.task !== 'lab.programs') return raw;
      const j = JSON.parse(raw);
      if (j.blocks) j.blocks = j.blocks.map((b: { code: string }) => (b.code === 'C' ? { ...b, sockets: { n: 'acqua', e: 'muro', s: 'muro', w: 'acqua', u: 'torre' } } : b));
      return JSON.stringify(j);
    };
    // Seeds whose plan has a knot between two courtyards.
    let seed = 1;
    while (!(await planStructure(m, t, { ...DEFAULT_STRUCT, seed })).commission!.configs.some((k) => k.zone === 'Q')) seed++;
    const opts = { ...DEFAULT_STRUCT, seed, retries: 0 };
    const r = await buildStructure(forgetful, t, opts);
    // …the composition finds the knot without a block, a late order brings it, the plan is not touched.
    expect(r.orders.length).toBeGreaterThan(0);
    expect(r.repair).toBeUndefined();
    expect(r.result?.mismatches).toEqual([]);
    expect(r.layout).toBe(r.plan.layout);
    expect(r.result?.placements.some((p) => p.block.code === 'C')).toBe(true);
  });

  it('gives sockets from the plan to blocks that leave them out: neighbouring zones fit by construction', async () => {
    const m = new LabMockModels();
    const t = { id: 'r', name: 'Rocca', description: 'un borgo fortificato', tiles: [18, 18, 3] as [number, number, number] };
    const plan = await planStructure(m, t, DEFAULT_STRUCT);
    // The same blocks, sockets and all labels gone (and no actions: they change one block into another).
    const auto = { ...ROCCA, blocks: ROCCA.blocks.map((b) => ({ ...b, sockets: { n: '*', e: '*', s: '*', w: '*' }, auto: true, actions: undefined, serves: Object.entries(plan.layout!.zones ?? {}).filter(([k]) => rocca([18, 18, 3]).zones![k]?.blocks?.includes(b.code)).map(([k]) => k) })) };
    const r = runLayout(plan.layout!, auto, 1);
    expect(r.wfc?.ok).toBe(true);
    expect(r.mismatches).toEqual([]);
    // Derived blocks keep the code of the block drawn.
    expect(new Set(r.placements.map((p) => p.code))).toContain('M');
    // A water tile next to a wall has, on that side, the name of the meeting of the two zones.
    const wall = r.placements.find((p) => p.code === 'M')!;
    expect(Object.values(wall.block.sockets)).toContain('z:A|z:W');
  });

  it('paints the courtyard under the well and the trees', () => {
    const built = buildBlocks(ROCCA, 1).built;
    const l = rocca();
    let seed = 1;
    let r = runLayout(l, ROCCA, seed, built);
    while (!r.placements.some((p) => p.block.code === 'O')) r = runLayout(l, ROCCA, ++seed, built);
    const well = r.placements.find((p) => p.block.code === 'O')!;
    const e = expand(r.placements, l.size, { seed, cells: r.cells, paint: l.paint });
    const X = e.grid.X;
    // The corners of the well's tile, at ground level, are courtyard.
    for (const [i, j] of [[0, 0], [TILE - 1, TILE - 1], [TILE - 1, 0], [0, TILE - 1]]) expect(e.grid.alphabet[e.grid.cells[well.x * TILE + i + (well.y * TILE + j) * X]]).toBe('c');
  });
});
