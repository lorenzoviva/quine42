// The gravity (T447, ADR-0226, `docs/design/acqua-spazio.md` § 2.5): `universe.json → nature.gravity` (0.2-2) scales the jump with 1/g,
// how high, how far and how long, never below the earth's (what the kernel guarantees reachable stays so); the gait barely; the earth's
// gravity changes nothing.

import { describe, expect, it } from 'vitest';
import { Kernel, JUMP_FAR, JUMP_UP } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { DEFAULT_NATURE, gaitOf, gravityOf, leapOf } from '../src/kernel/nature';
import { masterRegion, regionGravity, type Atlas } from '../src/kernel/atlas';

describe('the gravity, as numbers (T447)', () => {
  it('is the nature\'s within 0.2-2, the earth\'s otherwise', () => {
    expect(gravityOf(DEFAULT_NATURE)).toBe(1);
    expect(gravityOf({ gravity: 0.3 })).toBe(0.3);
    expect(gravityOf({ gravity: 2 })).toBe(2);
    for (const g of [0, 0.1, 3, NaN, Infinity, -1, '0.5' as never, undefined as never]) expect(gravityOf({ gravity: g })).toBe(1);
    expect(gravityOf(undefined)).toBe(1);
  });

  it('scales the jump with 1/g, never below the earth\'s; the gait barely, the same on the earth', () => {
    expect(leapOf(1)).toEqual({ reach: 1, time: 1 });
    expect(leapOf(0.25)).toEqual({ reach: 4, time: 4 });
    // Heavy: the same reach (rule 10: what the kernel checks with the earth's jump), a quicker arc.
    expect(leapOf(2)).toEqual({ reach: 1, time: 0.5 });
    expect(leapOf(NaN)).toEqual({ reach: 1, time: 1 });
    expect(gaitOf(1)).toBe(1);
    expect(gaitOf(0.2)).toBeCloseTo(0.9, 9);
    expect(gaitOf(2)).toBeGreaterThan(0.9);
    expect(gaitOf(2)).toBeLessThan(1);
    expect(gaitOf(NaN)).toBe(1);
  });
});

// `away`: the row on the place west of the first one (a region of the master may cover it; the first place is nobody's).
async function scene(gravity?: number, away = false) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = gravity === undefined ? bundledFiles : { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, gravity } }, null, 2) + '\n' };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  const wanted = away ? ['0,0', '-1,0', '-1,-1'] : ['0,0'];
  for (let i = 0; i < 240 && wanted.some((c) => k.chunks.get(c)?.stage !== 'planned'); i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  k.carpet()!.active = false;
  // A clear row of ground, 9 tiles long and 3 wide, on the planned chunks near the origin.
  let spot: [number, number] | undefined;
  for (let y = -10; y <= 10 && !spot; y++)
    for (let x = away ? -17 : -10; x <= (away ? -9 : 6) && !spot; x++) {
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = 0; dx <= 8 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.45) && !!k.chunkAt(x + dx, y + dy)?.plan;
      if (ok) spot = [x + 0.5, y + 0.5];
    }
  expect(spot).toBeDefined();
  const [x0, y0] = spot!;
  const stand = (x: number, y: number) => {
    const { ox, oy } = k.offset();
    Object.assign(k.wandererPos(), { x: x - ox, y: y - oy });
    k.wandererComp().facing = 'right';
  };
  // A river four tiles wide across the row: wider than the earth's jump.
  const water = Object.keys(k.palette).find((c) => k.palette[c].layer === 'liquid')!;
  const col = Math.floor(x0), row = Math.floor(y0);
  for (let c = 2; c <= 5; c++) expect(k.setTile(col + c, row, water)).toBe(true);
  // Jumps and says how long it stayed in the air and how high it went.
  const leap = () => {
    stand(x0 + 0.5, y0);
    expect(k.jump()).toBe(true);
    let ticks = 0, top = 0;
    while (k.jumping() && ticks < 600) {
      top = Math.max(top, k.jumping()!.y);
      k.tick(1 / 60);
      ticks++;
    }
    return { seconds: ticks / 60, top, x: k.wandererCarpet().x };
  };
  return { k, x0, y0, leap, stand };
}

describe('the gravity in the world (T447)', () => {
  it('on the earth: the jump of before, the river not jumped over (T438: into it)', async () => {
    const { k, x0, leap } = await scene();
    expect(k.gravity()).toBe(1);
    expect([k.jumpUp(), k.jumpFar()]).toEqual([JUMP_UP, JUMP_FAR]);
    const j = leap();
    // Not over the river: into it, a tile ahead (T438, the jump into the water), with the earth's arc.
    expect(j.x).toBeCloseTo(x0 + 1.5, 5);
    expect(k.swimsAt(j.x, k.wandererCarpet().y)).toBe(true);
    expect(j.seconds).toBeLessThan(0.5);
    expect((k.wandererComp() as { step?: number }).step).toBe(1);
  }, 30_000);

  it('light (0.4): the jump goes over the river, higher and slower; the gait a little slower', async () => {
    const { k, x0, leap } = await scene(0.4);
    expect(k.nature().gravity).toBe(0.4);
    expect(k.jumpFar()).toBeCloseTo(JUMP_FAR / 0.4, 9);
    const j = leap();
    expect(j.x).toBeGreaterThan(x0 + 5.5);
    expect(j.seconds).toBeGreaterThan(0.9);
    expect(j.top - k.groundAt(x0 + 0.5, k.wandererCarpet().y)).toBeGreaterThan(1.05);
    expect((k.wandererComp() as { step?: number }).step).toBeCloseTo(gaitOf(0.4), 9);
  }, 30_000);

  it('heavy (2): the reach of the earth, a quicker arc', async () => {
    const { k, x0, leap } = await scene(2);
    expect([k.jumpUp(), k.jumpFar()]).toEqual([JUMP_UP, JUMP_FAR]);
    const j = leap();
    // The reach of the earth: into the river a tile ahead, not over it (T438); the arc quicker than the earth's for the same tile.
    expect(j.x).toBeCloseTo(x0 + 1.5, 5);
    expect(j.seconds).toBeLessThan(0.32);
    expect((k.wandererComp() as { step?: number }).step).toBeCloseTo(gaitOf(2), 9);
  }, 30_000);
});

describe('the gravity and the swimming body (T453: T447 with T438)', () => {
  it("out of the river with the light gravity's push: over the far bank, from the water", async () => {
    const { k, x0, y0, stand } = await scene(0.4);
    // In the river, at its near edge (the column col + 2): swimming, then a jump towards the far bank, four tiles away and more.
    stand(x0 + 1.6, y0);
    k.tick(1 / 60);
    expect(k.swimming()).toBe(true);
    expect(k.jump()).toBe(true);
    let ticks = 0;
    while (k.jumping() && ticks < 600) {
      k.tick(1 / 60);
      ticks++;
    }
    const x = k.wandererCarpet().x;
    expect(x).toBeGreaterThan(x0 + 5.5);
    expect(k.swimsAt(x, k.wandererCarpet().y)).toBe(false);
    // The swimming pace in the water carries the gait of the gravity as the walk does (`player.step`).
    expect((k.wandererComp() as { step?: number }).step).toBeCloseTo(gaitOf(0.4), 9);
  }, 30_000);
});

describe('the gravity of a region of the master (T447)', () => {
  const envs = { forest: {} };
  const ask = (more: Record<string, unknown>) => masterRegion({ regions: [] }, { name: 'Lo scoglio', center: [5, 0], radius: 1, kind: 'filler', environment: 'forest', ...more }, envs);

  it("is a number within the kernel's range, never on a held region", () => {
    const light = ask({ gravity: 0.3 });
    expect('region' in light && light.region.gravity).toBe(0.3);
    const none = ask({});
    expect('region' in none && none.region.gravity).toBeUndefined();
    for (const g of [0.1, 3, NaN, '0.5', true]) expect(ask({ gravity: g })).toHaveProperty('errors');
    expect(ask({ gravity: 0.5, kind: 'held' })).toHaveProperty('errors');
  });

  it("is read only from a region of the master that is the world's", () => {
    expect(regionGravity({ id: 'a', name: 'a', description: '', environment: 'forest', center: [1, 1], radius: 1, master: true, gravity: 0.5 })).toBe(0.5);
    expect(regionGravity({ id: 'a', name: 'a', description: '', environment: 'forest', center: [1, 1], radius: 1, gravity: 0.5 })).toBeUndefined();
    expect(regionGravity({ id: 'a', name: 'a', description: '', environment: '', center: [1, 1], radius: 1, master: true, kind: 'held', gravity: 0.5 })).toBeUndefined();
    expect(regionGravity({ id: 'a', name: 'a', description: '', environment: 'forest', center: [1, 1], radius: 1, master: true, gravity: 7 })).toBeUndefined();
    expect(regionGravity(undefined)).toBeUndefined();
  });

  it("changes the jump in its places only: the first place and the rest of the world keep the world's", async () => {
    const { k, x0, y0, leap } = await scene(1.5, true);
    const S = k.config.chunkSize;
    const here = { x: x0, y: y0 };
    const cx = Math.floor(here.x / S), cy = Math.floor(here.y / S);
    // A region over a place away from the first one; then one over the wanderer's place, if it is not the first.
    const env = Object.keys(k.content.layouts)[0];
    const away = await k.declareRegion({ name: 'Lo scoglio', center: [cx + 6, cy], radius: 1, kind: 'filler', environment: env, gravity: 0.25 });
    expect(away.ok).toBe(true);
    expect(k.gravityAt((cx + 6) * S + 1, cy * S + 1)).toBe(0.25);
    expect(k.gravityAt(here.x, here.y)).toBe(1.5);
    expect(k.gravityAt(1, 1)).toBe(1.5);
    // The row the scene finds is not on the first place (nobody's region): a region may cover it.
    expect(cx === 0 && cy === 0).toBe(false);
    const atlas: Atlas = JSON.parse(k.files['world/atlas.json']);
    expect(atlas.regions.some((r) => r.gravity === 0.25)).toBe(true);
    const over = await k.declareRegion({ name: 'La luna', center: [cx, cy], radius: 0, kind: 'filler', environment: env, gravity: 0.4 });
    expect(over.ok).toBe(true);
    expect(k.gravityAt(x0, y0)).toBe(0.4);
    expect(leap().x).toBeGreaterThan(x0 + 5.5);
  }, 30_000);
});
