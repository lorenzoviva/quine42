// The model that goes down (T52b, ADR-0091): a structure with `sotto: 1` in its index entry has a cellar under the
// ground. One goes down its stair and up again, from the cellar one gets out only by the stair, a jump does not
// fall into the stairwell, and a cellar no stair reaches is no cellar (the earth fills it).

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { Forms, InlineRunner, sottoOf, type FormComp } from '../src/kernel/forms';

// A box from voxel x0..x1, y0..y1, z0..z1 (inclusive): `at` is the middle in x and y, the bottom in z.
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  `  <box at="${(x0 + x1) / 2} ${(y0 + y1) / 2} ${z0}" size="${x1 - x0 + 1} ${y1 - y0 + 1} ${z1 - z0 + 1}" color="S"/>`;

// The class `grande` (5 × 5 × 4 tiles, 20 voxels a tile) and one tile under the ground: the lowest 20 voxels.
// The cellar: a floor 2 voxels thick, walls up to the ground, the house's floor at the ground (z 18-19) over it,
// with a stairwell (x 30-69, y 40-59) where four steps go down from the ground (20) to the cellar (2).
const house = (stair: boolean) => `<sequence values="BS" name="Casa con cantina">
  <color symbol="S" value="8a8070" name="pietra"/>
${box(20, 79, 20, 79, 0, 1)}
${box(20, 21, 20, 79, 0, 19)}
${box(78, 79, 20, 79, 0, 19)}
${box(22, 77, 20, 21, 0, 19)}
${box(22, 77, 78, 79, 0, 19)}
${stair
  ? [box(22, 29, 22, 77, 18, 19), box(70, 77, 22, 77, 18, 19), box(30, 69, 22, 39, 18, 19), box(30, 69, 60, 77, 18, 19),
     ...Array.from({ length: 4 }, (_, i) => box(30 + 8 * i, 37 + 8 * i, 40, 59, 0, 15 - 4 * i))].join('\n')
  : box(22, 77, 22, 77, 18, 19)}
</sequence>`;

const files = () => {
  const index = JSON.parse(bundledFiles['models/index.json']!);
  index['cantina-prova'] = { classe: 'grande', nome: 'casa con cantina', sotto: 1 };
  index['chiusa-prova'] = { classe: 'grande', nome: 'cantina senza scala', sotto: 1 };
  return { ...bundledFiles, 'models/cantina-prova.xml': house(true), 'models/chiusa-prova.xml': house(false), 'models/index.json': JSON.stringify(index) };
};

async function scene(model: string) {
  const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  k.carpet()!.active = false;
  // A clear patch of flat ground (the house's 5 × 5 tiles) on a planned place near the origin.
  let spot: [number, number] | undefined;
  for (let y = -20; y <= 20 && !spot; y++)
    for (let x = -20; x <= 20 && !spot; x++) {
      let ok = true;
      const g = k.groundAt(x + 0.5, y + 0.5);
      for (let dy = -2; dy <= 2 && ok; dy++)
        for (let dx = -2; dx <= 2 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.45) && k.groundAt(x + dx + 0.5, y + dy + 0.5) === g && !!k.chunkAt(x + dx, y + dy)?.plan;
      if (ok) spot = [x + 0.5, y + 0.5];
    }
  expect(spot).toBeDefined();
  const [cx, cy] = spot!;
  const id = k.spawnModuleEntity(k.modules.get('object.well')!, cx, cy, undefined, `test#${model}`);
  Object.assign(k.ecs.get(id, 'form') as FormComp, { model, seed: 1, yaw: 0 });
  // A structure of the place, as the lots make them (the renderer cuts the one the wanderer is in).
  k.ecs.set(id, 'struttura', {});
  const form = await k.forms.wait(model, 1);
  expect(form?.status).toBe('ready');
  k.tick(1 / 60);
  // Local voxel → world point (the grid centred on the thing).
  const at = (vx: number, vy: number) => [cx + (vx + 0.5 - 50) / 20, cy + (vy + 0.5 - 50) / 20] as const;
  return { k, id, cx, cy, at, ground: k.groundAt(cx, cy), form: form! };
}

describe('the model that goes down (T52b)', () => {
  it('reads `sotto` from the index entry, from 1 to 3', () => {
    expect(sottoOf({ classe: 'grande', sotto: 2 })).toBe(2);
    for (const sotto of [0, 4, 1.5, -1, '1' as unknown as number, undefined]) expect(sottoOf({ classe: 'grande', sotto })).toBe(0);
  });

  it('grows the box down and lays the model lower; models without `sotto` stand on the ground as before', async () => {
    const forms = new Forms(new InlineRunner());
    forms.load(files());
    const f = (await forms.wait('cantina-prova', 1))!;
    expect(f.status).toBe('ready');
    expect(f.result!.grid.Z).toBe(100);
    expect(f.base).toBe(20);
    expect(f.hole).toBeDefined();
    const plain = (await forms.wait('grande', 1))!;
    expect(plain.base).toBe(0);
    expect(plain.hole).toBeUndefined();
  });

  it('goes down the stair to the cellar and up again; from the cellar one gets out only by the stair', async () => {
    const { k, id, at, ground } = await scene('cantina-prova');
    expect(k.sunk(id)).toBeCloseTo(1, 9);
    const r = 0.2;
    // Outside the house, on the ground; then along the middle of the stairwell, down.
    let [x, y] = at(10, 50);
    let z = k.floorAt(x, y);
    expect(z).toBeCloseTo(ground, 9);
    const [stairEnd] = at(66, 50);
    let lowest = z;
    while (x < stairEnd) {
      expect(k.free(x + 0.05, y, r, z), `giù, a ${x.toFixed(2)}`).toBe(true);
      x += 0.05;
      z = k.floorAt(x, y, z);
      lowest = Math.min(lowest, z);
    }
    // The cellar's floor: 2 voxels over the bottom of the model, a tile under the ground.
    expect(z - ground).toBeCloseTo(-0.9, 9);
    expect(lowest - ground).toBeCloseTo(-0.9, 9);
    expect(k.structureAt(x, y)).toBe(id);
    // Under the house's floor the cellar goes on, up to its wall.
    let blocked = false;
    for (let n = 0; n < 60 && !blocked; n++) {
      if (k.free(x + 0.05, y, r, z)) (x += 0.05), (z = k.floorAt(x, y, z));
      else blocked = true;
    }
    expect(blocked).toBe(true);
    expect(x + r).toBeLessThan(at(78, 50)[0] + 1e-9);
    expect(z - ground).toBeCloseTo(-0.9, 9);
    // Towards the side wall, under the house's floor: a wall, never up to the ground.
    let [sx, sy] = at(72, 50);
    let sz = k.floorAt(sx, sy, z);
    blocked = false;
    for (let n = 0; n < 80 && !blocked; n++) {
      if (k.free(sx, sy - 0.05, r, sz)) (sy -= 0.05), (sz = k.floorAt(sx, sy, sz));
      else blocked = true;
    }
    expect(blocked).toBe(true);
    expect(sy - r).toBeGreaterThan(at(0, 21)[1]);
    expect(sz - ground).toBeCloseTo(-0.9, 9);
    // And up the stair again, out of the house.
    [x, y] = at(66, 50);
    z = k.floorAt(x, y, z);
    const [out] = at(10, 50);
    while (x > out) {
      expect(k.free(x - 0.05, y, r, z), `su, a ${x.toFixed(2)}`).toBe(true);
      x -= 0.05;
      z = k.floorAt(x, y, z);
    }
    expect(z).toBeCloseTo(ground, 9);
    // On the house's floor over the cellar one stands at the ground, and the house's floor is the ground floor.
    expect(k.floorAt(...at(74, 30))).toBeCloseTo(ground, 9);
    expect(k.floorAt(...at(74, 30), ground)).toBeCloseTo(ground, 9);
    // Over the stairwell, at the ground, is air: one does not walk there.
    expect(k.free(...at(66, 50), r, ground)).toBe(false);
    expect(k.free(...at(66, 50), r)).toBe(false);
  }, 30_000);

  it('the renderer lowers the terrain over the cellar to its bottom', async () => {
    const { k, at } = await scene('cantina-prova');
    const [x, y] = at(50, 50);
    const ch = k.chunkAt(Math.floor(x), Math.floor(y))!;
    const S = k.config.chunkSize;
    const holes = k.holesIn(ch);
    const cell = (Math.floor(y) - ch.cy * S) * S + (Math.floor(x) - ch.cx * S);
    expect(holes.get(cell)).toBeCloseTo(1, 9);
    // Outside the house the terrain is whole.
    const [ox, oy] = at(5, 5);
    const och = k.chunkAt(Math.floor(ox), Math.floor(oy))!;
    expect(k.holesIn(och).get((Math.floor(oy) - och.cy * S) * S + (Math.floor(ox) - och.cx * S))).toBeUndefined();
  }, 30_000);

  it('a jump crosses the stairwell and never falls into the cellar', async () => {
    const { k, at, ground } = await scene('cantina-prova');
    const { ox, oy } = k.offset();
    const [x, y] = at(25, 50);
    Object.assign(k.wandererPos(), { x: x - ox, y: y - oy, z: ground });
    k.wandererComp().facing = 'right';
    k.tick(1 / 60);
    expect(k.jump()).toBe(true);
    for (let i = 0; i < 90; i++) k.tick(1 / 60);
    expect(k.jumping()).toBeUndefined();
    const p = k.wandererPos();
    expect(p.z ?? k.groundAt(p.x + ox, p.y + oy)).toBeGreaterThan(ground - 0.05);
  }, 30_000);

  it('a cellar no stair reaches is no cellar: the earth fills it, the house stands on the ground', async () => {
    const { k, id, at, ground, form } = await scene('chiusa-prova');
    expect(form.base).toBe(20);
    expect(form.hole).toBeUndefined();
    // Still laid a tile lower (its cellar is inside the earth), with nothing under the ground to stand on.
    expect(k.sunk(id)).toBeCloseTo(1, 9);
    expect(k.floorAt(...at(50, 50))).toBeCloseTo(ground, 9);
    expect(k.floorAt(...at(50, 50), ground - 0.9)).toBeCloseTo(ground, 9);
    const [x, y] = at(50, 50);
    const ch = k.chunkAt(Math.floor(x), Math.floor(y))!;
    expect(k.holesIn(ch).size).toBe(0);
  }, 30_000);
});
