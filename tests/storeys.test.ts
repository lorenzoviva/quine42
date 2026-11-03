// Structures with more storeys (T53b, ADR-0043): a column has a floor for each run of solid, a body stands on the
// one nearest to its feet (`pos.z`); a tower of two storeys is walked from the door up a stair to the floor above,
// up another to the roof, and under the floor above one still walks on the ground floor. The jump (T70, with T56b)
// goes from the floor one stands on, over a crate, onto the same floor.

import { describe, expect, it } from 'vitest';
import { Kernel, JUMP_UP } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bodyGround, InlineRunner, Forms, stepOf, type FormComp } from '../src/kernel/forms';

// A box of voxels, bounds included.
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: string) =>
  `  <box at="${(x0 + x1) / 2} ${(y0 + y1) / 2} ${z0}" size="${x1 - x0 + 1} ${y1 - y0 + 1} ${z1 - z0 + 1}" color="${c}"/>`;

// A tower 6 × 6 tiles (20 voxels per tile): walls 6 voxels thick up to the roof, a door to the south (y high), the
// ground floor (top 3), the floor above (top 54), the roof (top 104). Stair A goes up along x from the ground floor
// to the floor above (y 10..29, through a well in it); stair B, on the floor above, back along x to the roof (y
// 60..79, through a well in the roof). Steps 4 voxels high (a step) and 6 deep.
const TOWER = [
  `<sequence values="BS" size="120 120 110" name="Torre di prova">`,
  `  <color symbol="S" value="8a8070" name="pietra"/>`,
  box(0, 119, 0, 119, 0, 103, 'S'),
  box(6, 113, 6, 113, 3, 49, 'B'),
  box(6, 113, 6, 113, 54, 99, 'B'),
  box(50, 69, 114, 119, 0, 40, 'B'),
  box(14, 97, 10, 29, 50, 53, 'B'),
  box(20, 105, 60, 79, 100, 103, 'B'),
  ...Array.from({ length: 13 }, (_, i) => box(20 + 6 * i, 97, 10, 29, 3, 4 * (i + 1) - 1, 'S')),
  ...Array.from({ length: 13 }, (_, i) => box(20, 97 - 6 * i, 60, 79, 54, 54 + 4 * (i + 1) - 1, 'S')),
  `</sequence>`,
].join('\n');
// The same tower with a crate 0.8 tiles high on each storey, along x at y 85..104: on the ground floor, on the floor above (T70).
const CRATES = TOWER.replace('</sequence>', [box(50, 69, 85, 104, 3, 18, 'S'), box(50, 69, 85, 104, 54, 69, 'S'), '</sequence>'].join('\n'));

const files = () => {
  const index = JSON.parse(bundledFiles['models/index.json']!);
  index.torre = { classe: 'grande', nome: 'torre di prova' };
  index['torre-casse'] = { classe: 'grande', nome: 'torre con le casse' };
  return { ...bundledFiles, 'models/torre.xml': TOWER, 'models/torre-casse.xml': CRATES, 'models/index.json': JSON.stringify(index) };
};

// A clear and nearly flat patch of ground (the relief may poke a level through the ground floor) for the tower (6 × 6 tiles) and around it.
function flatSpot(k: Kernel): [number, number] | undefined {
  for (let y = -14; y <= 14; y++)
    for (let x = -14; x <= 14; x++) {
      const h = k.groundAt(x + 0.5, y + 0.5);
      let ok = true;
      for (let dy = -4; dy <= 4 && ok; dy++)
        for (let dx = -4; dx <= 4 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.25) && Math.abs(k.groundAt(x + dx + 0.5, y + dy + 0.5) - h) <= 0.25;
      if (ok) return [x + 0.5, y + 0.5];
    }
  return undefined;
}

describe('structures with more storeys', () => {
  it('a column has a floor for each storey, each reached by the stairs', async () => {
    const forms = new Forms(new InlineRunner());
    forms.load(files());
    const f = (await forms.wait('torre', 1))!;
    expect(f.status).toBe('ready');
    const { grid, palette } = f.result!;
    const { levels, floor } = bodyGround(grid, palette, f.vpt);
    const col = (x: number, y: number) => {
      const i = x + y * grid.X;
      return Array.from({ length: levels.start[i + 1] - levels.start[i] }, (_, k) => [levels.z[levels.start[i] + k], levels.block[levels.start[i] + k]]);
    };
    // In a room: the ground floor, the floor above, the roof; all three stood on.
    expect(col(40, 45)).toEqual([[3, 0], [54, 0], [104, 0]]);
    expect(floor[40 + 45 * grid.X]).toBe(3);
    // A wall: its top is the roof. The door: the ground, and the wall above it.
    expect(col(3, 45)).toEqual([[104, 0]]);
    expect(col(60, 117)).toEqual([[0, 0], [104, 0]]);
    expect(stepOf(f.vpt)).toBe(4);
  }, 30_000);

  it('a tower of two storeys is walked from the door up to the roof, and under the floor above', async () => {
    const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    const spot = flatSpot(k);
    expect(spot).toBeDefined();
    const [cx, cy] = spot!;
    const id = k.spawnModuleEntity(k.modules.get('object.well')!, cx, cy, undefined, 'test#torre');
    Object.assign(k.ecs.get(id, 'form') as FormComp, { model: 'torre', seed: 1, yaw: 0 });
    expect((await k.forms.wait('torre', 1))?.status).toBe('ready');
    k.tick(1 / 60);
    // Local voxel → world point (the grid centred on the thing); heights in voxels above its base.
    const at = (vx: number, vy: number) => [cx + (vx - 60) / 20, cy + (vy - 60) / 20] as const;
    const base = k.groundAt(cx, cy);
    const level = (z: number) => Math.round((z - base) * 20);
    // Which storey a height is: the ground floor (with the relief that may poke through it), the floor above, the roof.
    const storey = (z: number) => (level(z) < 30 ? 0 : level(z) < 80 ? 1 : 2);
    const r = 0.22;
    // A body that walks in small paces, its feet on the floor nearest to where they were.
    let [x, y] = at(60, 130);
    let z = k.floorAt(x, y);
    const walk = (vx: number, vy: number) => {
      const [tx, ty] = at(vx, vy);
      for (let n = 0; n < 400 && Math.hypot(tx - x, ty - y) > 0.01; n++) {
        const d = Math.hypot(tx - x, ty - y), s = Math.min(0.05, d);
        const nx = x + ((tx - x) / d) * s, ny = y + ((ty - y) / d) * s;
        expect(k.free(nx, ny, r, z), `verso ${vx},${vy}: fermo a ${((x - cx) * 20 + 60).toFixed(0)},${((y - cy) * 20 + 60).toFixed(0)} a ${level(z)}`).toBe(true);
        (x = nx), (y = ny);
        z = k.floorAt(x, y, z);
      }
    };
    // In by the door, along the ground floor under the floor above, to the foot of stair A.
    walk(60, 100);
    walk(60, 45);
    expect(storey(z)).toBe(0);
    walk(12, 45);
    walk(12, 20);
    // Up stair A to the floor above.
    walk(106, 20);
    expect(level(z)).toBe(54);
    // Along the floor above, up stair B to the roof.
    walk(106, 70);
    expect(level(z)).toBe(54);
    walk(12, 70);
    expect(level(z)).toBe(104);
    expect(level(k.floorAt(x, y, z))).toBe(104);
    // From the roof the edge of the stair well, beyond the stair, is a drop: one stops before it.
    expect(k.free(...at(100, 50), r, z)).toBe(true);
    expect(k.free(...at(100, 60), r, z)).toBe(false);
    // The same point, from below and from above: the ground floor and the floor above.
    const [px, py] = at(40, 45);
    expect(storey(k.floorAt(px, py))).toBe(0);
    expect(storey(k.floorAt(px, py, base + 3 / 20))).toBe(0);
    expect(level(k.floorAt(px, py, base + 54 / 20))).toBe(54);
    expect(k.free(px, py, r, base + 3 / 20)).toBe(true);
    expect(k.free(px, py, r, base + 54 / 20)).toBe(true);
    // And back down: stair B, then stair A, out of the door.
    walk(106, 70);
    expect(level(z)).toBe(54);
    walk(106, 20);
    walk(12, 20);
    expect(storey(z)).toBe(0);
    walk(12, 45);
    walk(60, 45);
    walk(60, 130);
    expect(z).toBeCloseTo(k.groundAt(x, y), 5);
  }, 60_000);

  it('the kernel keeps every body on its floor (pos.z), and the floor above under whoever went up', async () => {
    const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    const spot = flatSpot(k);
    const [cx, cy] = spot!;
    const id = k.spawnModuleEntity(k.modules.get('object.well')!, cx, cy, undefined, 'test#torre');
    Object.assign(k.ecs.get(id, 'form') as FormComp, { model: 'torre', seed: 1, yaw: 0 });
    await k.forms.wait('torre', 1);
    k.tick(1 / 60);
    const base = k.groundAt(cx, cy);
    const [px, py] = [cx + (40 - 60) / 20, cy + (45 - 60) / 20];
    // A thing with a body put in the room: the ground floor; lifted to the floor above, it stays there.
    const thing = k.ecs.spawn();
    k.ecs.set(thing, 'pos', { x: px, y: py });
    k.ecs.set(thing, 'body', { r: 0.2, solid: false });
    k.tick(1 / 60);
    expect(Math.round((k.ecs.get(thing, 'pos').z - base) * 20)).toBeLessThan(30);
    k.ecs.get(thing, 'pos').z = base + 55 / 20;
    k.tick(1 / 60);
    expect(Math.round((k.ecs.get(thing, 'pos').z - base) * 20)).toBe(54);
  }, 60_000);

  it('a jump inside the tower goes over a crate and lands on the floor it started from, below and above', async () => {
    const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
    for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
    }
    k.tick(1 / 60);
    k.carpet()!.active = false;
    const spot = flatSpot(k);
    expect(spot).toBeDefined();
    const [cx, cy] = spot!;
    const id = k.spawnModuleEntity(k.modules.get('object.well')!, cx, cy, undefined, 'test#torre-casse');
    Object.assign(k.ecs.get(id, 'form') as FormComp, { model: 'torre-casse', seed: 1, yaw: 0 });
    expect((await k.forms.wait('torre-casse', 1))?.status).toBe('ready');
    k.tick(1 / 60);
    const at = (vx: number, vy: number) => [cx + (vx - 60) / 20, cy + (vy - 60) / 20] as const;
    const base = k.groundAt(cx, cy);
    const level = (z: number) => Math.round((z - base) * 20);
    // On a floor (voxels): the relief may poke a level or so through the ground floor.
    const on = (z: number | undefined, floor: number) => expect(Math.abs(level(z!) - floor)).toBeLessThanOrEqual(5);
    const r = Number(k.ecs.get(k.wandererEntity, 'body')?.r) || 0.3;
    // The wanderer at a point of the tower (carpet space, the carpet is stopped), on the floor nearest to z (voxels).
    const stand = (vx: number, vy: number, z: number) => {
      const [x, y] = at(vx, vy);
      const { ox, oy } = k.offset();
      Object.assign(k.wandererPos(), { x: x - ox, y: y - oy, z: base + z / 20 });
      k.wandererComp().facing = 'right';
      k.tick(1 / 60);
    };
    expect(0.8).toBeLessThan(JUMP_UP);
    for (const floor of [3, 54]) {
      stand(30, 95, floor);
      on(k.wandererPos().z, floor);
      const [x0, y0] = at(30, 95);
      // Walking right, the crate stops the body.
      expect(k.free(...at(50, 95), r, base + floor / 20)).toBe(false);
      expect(k.jump()).toBe(true);
      let highest = -Infinity;
      for (let i = 0; i < 60; i++) {
        k.tick(1 / 60);
        highest = Math.max(highest, (k.jumping()?.y ?? -Infinity) - base - floor / 20);
      }
      expect(k.jumping()).toBeUndefined();
      const c = k.wandererCarpet();
      // Over the crate (the ceiling above does not count), beyond it, on the same floor.
      expect(highest).toBeGreaterThan(0.8);
      expect(c.x).toBeGreaterThan(cx + (70 - 60) / 20);
      expect(c.y).toBeCloseTo(y0, 5);
      expect(c.x - x0).toBeLessThanOrEqual(2.6 + 1e-6);
      on(k.wandererPos().z, floor);
      on(k.floorAt(c.x, c.y, k.wandererPos().z), floor);
      expect(k.free(c.x, c.y, r, k.wandererPos().z)).toBe(true);
    }
    // A sign on the ground floor stops who walks there, not who walks on the floor above it.
    const sign = k.spawnModuleEntity(k.modules.get('object.sign')!, ...at(85, 45), undefined, 'test#cartello');
    expect((await k.forms.wait((k.ecs.get(sign, 'form') as FormComp).model, (k.ecs.get(sign, 'form') as FormComp).seed))?.status).toBe('ready');
    k.tick(1 / 60);
    expect(k.free(...at(85, 45), r, base + 3 / 20)).toBe(false);
    expect(k.free(...at(85, 45), r, base + 54 / 20)).toBe(true);
    // Against the outer wall (up to the roof): a jump on the spot, on either floor.
    for (const floor of [3, 54]) {
      stand(100, 95, floor);
      const before = k.wandererCarpet().x;
      k.jump();
      for (let i = 0; i < 60; i++) k.tick(1 / 60);
      expect(k.wandererCarpet().x).toBeCloseTo(before, 5);
      on(k.wandererPos().z, floor);
    }
  }, 60_000);
});
