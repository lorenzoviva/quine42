// The model that goes down (T52b, ADR-0091): a structure with `sotto: 1` in its index entry has a cellar under the
// ground. One goes down its stair and up again, from the cellar one gets out only by the stair, a jump does not
// fall into the stairwell, and a cellar no stair reaches is no cellar (the earth fills it). At 20 voxels a tile, as it
// was measured, and at 16, the structures' density today (ADR-0209, T415): there the cellar's edges are not on the tiles'
// edges, and the terrain opens on the whole footprint of the cellar, sub-cell by sub-cell (`holeCover`).

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { Forms, HOLE_CELLS, InlineRunner, cellarOf, type FormComp } from '../src/kernel/forms';
import { buildChunk, buildCut } from '../src/render/terrain';
import { CUT_ABOVE, CUT_RADIUS, CUT_STRETCH, cutDisc, dimAt, DIM_FLOOR, inCutDisc, towardsCamera, undergroundAt, type Towards } from '../src/kernel/underground';

// A box from voxel x0..x1, y0..y1, z0..z1 (inclusive): `at` is the middle in x and y, the bottom in z.
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  `  <box at="${(x0 + x1) / 2} ${(y0 + y1) / 2} ${z0}" size="${x1 - x0 + 1} ${y1 - y0 + 1} ${z1 - z0 + 1}" color="S"/>`;

// The steps of the stairwell (x 30-69, y 40-59), 8 voxels long, each `rise` lower: from the ground (20) to the cellar (2).
const stairOf = (n: number, rise: number) => Array.from({ length: n }, (_, i) => box(30 + 8 * i, 37 + 8 * i, 40, 59, 0, 19 - rise * (i + 1)));

// The class `grande` (100 × 100 × 80 voxels: 5 × 5 × 4 tiles at 20 voxels a tile, 6,25 × 6,25 × 5 at 16) and one cellar
// under the ground: the lowest 20 voxels. The cellar: a floor 2 voxels thick, walls up to the ground, the house's floor at
// the ground (z 18-19) over it, with a stairwell where the steps go down from the ground (20) to the cellar (2): four of 4
// voxels at 20 voxels a tile, five of 3 at 16 (a step is `stepOf(vpt)`).
const house = (stair: boolean, vpt: number) => `<sequence values="BS" name="Casa con cantina">
  <color symbol="S" value="8a8070" name="pietra"/>
${box(20, 79, 20, 79, 0, 1)}
${box(20, 21, 20, 79, 0, 19)}
${box(78, 79, 20, 79, 0, 19)}
${box(22, 77, 20, 21, 0, 19)}
${box(22, 77, 78, 79, 0, 19)}
${stair
  ? [box(22, 29, 22, 77, 18, 19), box(70, 77, 22, 77, 18, 19), box(30, 69, 22, 39, 18, 19), box(30, 69, 60, 77, 18, 19),
     ...(vpt === 20 ? stairOf(4, 4) : stairOf(5, 3))].join('\n')
  : box(22, 77, 22, 77, 18, 19)}
</sequence>`;

const files = () => {
  const index = JSON.parse(bundledFiles['models/index.json']!);
  // At 20 voxels a tile, as the cellar was measured (T405: a structure that does not say its density is at 16).
  index['cantina-prova'] = { classe: 'structure', vpt: 20, nome: 'casa con cantina', sotto: 1 };
  index['chiusa-prova'] = { classe: 'structure', vpt: 20, nome: 'cantina senza scala', sotto: 1 };
  // At 16 (T415), as a structure is today.
  index['cantina-16'] = { classe: 'structure', nome: 'casa con cantina', sotto: 1 };
  index['chiusa-16'] = { classe: 'structure', nome: 'cantina senza scala', sotto: 1 };
  return {
    ...bundledFiles,
    'models/cantina-prova.xml': house(true, 20),
    'models/chiusa-prova.xml': house(false, 20),
    'models/cantina-16.xml': house(true, 16),
    'models/chiusa-16.xml': house(false, 16),
    'models/index.json': JSON.stringify(index),
  };
};

async function scene(model: string, vpt: number) {
  const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  k.carpet()!.active = false;
  // A clear patch of flat ground (the house: 3 × 3 tiles at 20, 3,75 × 3,75 at 16) on a planned place near the origin.
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
  k.ecs.set(id, 'structure', {});
  const form = await k.forms.wait(model, 1);
  expect(form?.status).toBe('ready');
  expect(form!.vpt).toBe(vpt);
  k.tick(1 / 60);
  // Local voxel → world point (the grid centred on the entity).
  const at = (vx: number, vy: number) => [cx + (vx + 0.5 - 50) / vpt, cy + (vy + 0.5 - 50) / vpt] as const;
  return { k, id, cx, cy, at, ground: k.groundAt(cx, cy), form: form! };
}

/** Whether the terrain is open at a point of the world (`holesIn`: the tile, and its sub-cell if the tile is only partly open). */
function openAt(k: Kernel, x: number, y: number): boolean {
  const S = k.config.chunkSize;
  const ch = k.chunkAt(Math.floor(x), Math.floor(y))!;
  const h = k.holesIn(ch).get((Math.floor(y) - ch.cy * S) * S + (Math.floor(x) - ch.cx * S));
  if (!h) return false;
  if (!h.cover) return true;
  const s = Math.floor((x - Math.floor(x)) * HOLE_CELLS), t = Math.floor((y - Math.floor(y)) * HOLE_CELLS);
  return !!h.cover[t * HOLE_CELLS + s];
}

/** The area of a mesh's triangles facing `n` (a unit axis), and the heights they stand at. */
function facing(mesh: THREE.Mesh, n: [number, number, number]) {
  const pos = mesh.geometry.getAttribute('position'), nor = mesh.geometry.getAttribute('normal');
  let area = 0;
  const ys = new Set<number>();
  for (let i = 0; i < pos.count; i += 3) {
    if (nor.getX(i) !== n[0] || nor.getY(i) !== n[1] || nor.getZ(i) !== n[2]) continue;
    const a = new THREE.Vector3().fromBufferAttribute(pos, i), b = new THREE.Vector3().fromBufferAttribute(pos, i + 1), d = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    area += b.clone().sub(a).cross(d.clone().sub(a)).length() / 2;
    for (const v of [a, b, d]) ys.add(Math.round(v.y * 1e6) / 1e6);
  }
  return { area, ys };
}

describe('the disc of the cut under the ground (T416)', () => {
  it('is whole tiles within the radius, stretched towards the camera', () => {
    const south: Towards = { x: 0, y: 1 };
    expect(inCutDisc(0, 0, south)).toBe(true);
    expect(inCutDisc(CUT_RADIUS, 0, south)).toBe(true);
    expect(inCutDisc(CUT_RADIUS + 1, 0, south)).toBe(false);
    expect(inCutDisc(0, -CUT_RADIUS, south)).toBe(true);
    expect(inCutDisc(0, -CUT_RADIUS - 1, south)).toBe(false);
    // Towards the camera it goes `CUT_STRETCH` tiles further.
    expect(inCutDisc(0, CUT_RADIUS + CUT_STRETCH, south)).toBe(true);
    expect(inCutDisc(0, CUT_RADIUS + CUT_STRETCH + 1, south)).toBe(false);
    expect(inCutDisc(CUT_RADIUS, CUT_STRETCH, south)).toBe(true);
    // Turned with the camera: the same disc, a quarter turn on.
    for (const t of [south, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }] as Towards[]) {
      const tiles = cutDisc({ x: 10, y: -4 }, t);
      expect(tiles.length).toBe(cutDisc({ x: 0, y: 0 }, south).length);
      expect(tiles.every(({ x, y }) => inCutDisc(x - 10, y + 4, t))).toBe(true);
      expect(tiles.some(({ x, y }) => x === 10 + t.x * (CUT_RADIUS + CUT_STRETCH) && y === -4 + t.y * (CUT_RADIUS + CUT_STRETCH))).toBe(true);
    }
  });

  it('turns with the camera by quarters, and dims the sun down to a third', () => {
    expect(towardsCamera(0)).toEqual({ x: 0, y: 1 });
    expect(towardsCamera(Math.PI / 2)).toEqual({ x: 1, y: 0 });
    expect(towardsCamera(Math.PI)).toEqual({ x: 0, y: -1 });
    expect(towardsCamera(-Math.PI / 2)).toEqual({ x: -1, y: 0 });
    expect(towardsCamera(0.6)).toEqual({ x: 0, y: 1 });
    expect(towardsCamera(5 * Math.PI)).toEqual({ x: 0, y: -1 });
    expect(dimAt(0)).toBe(1);
    expect(dimAt(NaN)).toBe(1);
    expect(dimAt(1)).toBeGreaterThan(DIM_FLOOR);
    expect(dimAt(1)).toBeLessThan(1);
    expect(dimAt(50)).toBeCloseTo(DIM_FLOOR, 9);
  });

  it('is under the ground only more than a step under it', () => {
    expect(undergroundAt(3.5, -2.5, 0, 0)).toBeUndefined();
    expect(undergroundAt(3.5, -2.5, -0.2, 0)).toBeUndefined();
    expect(undergroundAt(3.5, -2.5, NaN, 0)).toBeUndefined();
    expect(undergroundAt(3.5, -2.5, 0.5, 0)).toBeUndefined();
    const u = undergroundAt(3.5, -2.5, 0.75, 2)!;
    expect(u.depth).toBeCloseTo(1.25, 9);
    expect(u.cut).toBeCloseTo(0.75 + CUT_ABOVE, 9);
    expect(u.tile).toEqual({ x: 3, y: -3 });
  });
});

describe('the model that goes down (T52b)', () => {
  it('reads `sotto` from the index entry, from 1 to 3', () => {
    expect(cellarOf({ class: 'structure', cellar: 2 })).toBe(2);
    for (const sotto of [0, 4, 1.5, -1, '1' as unknown as number, undefined]) expect(cellarOf({ class: 'structure', cellar: sotto })).toBe(0);
  });

  it('grows the box down and lays the model lower; models without `sotto` stand on the ground as before', async () => {
    const forms = new Forms(new InlineRunner());
    forms.load(files());
    for (const model of ['cantina-prova', 'cantina-16']) {
      const f = (await forms.wait(model, 1))!;
      expect(f.status).toBe('ready');
      expect(f.result!.grid.Z).toBe(100);
      expect(f.base).toBe(20);
      expect(f.hole).toBeDefined();
    }
    const plain = (await forms.wait('structure', 1))!;
    expect(plain.base).toBe(0);
    expect(plain.hole).toBeUndefined();
  });

  describe.each([
    { vpt: 20, model: 'cantina-prova', closed: 'chiusa-prova' },
    { vpt: 16, model: 'cantina-16', closed: 'chiusa-16' },
  ])('at $vpt voxels a tile', ({ vpt, model, closed }) => {
    // The cellar's floor: 2 voxels over the bottom of the model, 18 voxels under the ground.
    const floor = -18 / vpt;

    it('goes down the stair to the cellar and up again; from the cellar one gets out only by the stair', async () => {
      const { k, id, at, ground } = await scene(model, vpt);
      expect(k.sunk(id)).toBeCloseTo(20 / vpt, 9);
      const r = 0.2;
      // Outside the house, on the ground; then along the middle of the stairwell, down, past the last step.
      let [x, y] = at(10, 50);
      let z = k.floorAt(x, y);
      expect(z).toBeCloseTo(ground, 9);
      const [stairEnd] = at(71, 50);
      let lowest = z;
      while (x < stairEnd) {
        expect(k.free(x + 0.05, y, r, z), `giù, a ${x.toFixed(2)}`).toBe(true);
        x += 0.05;
        z = k.floorAt(x, y, z);
        lowest = Math.min(lowest, z);
      }
      expect(z - ground).toBeCloseTo(floor, 9);
      expect(lowest - ground).toBeCloseTo(floor, 9);
      expect(k.structureAt(x, y)).toBe(id);
      // Under the house's floor the cellar goes on, up to its wall.
      let blocked = false;
      for (let n = 0; n < 60 && !blocked; n++) {
        if (k.free(x + 0.05, y, r, z)) (x += 0.05), (z = k.floorAt(x, y, z));
        else blocked = true;
      }
      expect(blocked).toBe(true);
      expect(x + r).toBeLessThan(at(78, 50)[0] + 1e-9);
      expect(z - ground).toBeCloseTo(floor, 9);
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
      expect(sz - ground).toBeCloseTo(floor, 9);
      // And up the stair again, out of the house.
      [x, y] = at(71, 50);
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

    it('the terrain opens on the whole cellar, and only there (T415)', async () => {
      const { k, at, cx, cy } = await scene(model, vpt);
      const [x, y] = at(50, 50);
      const ch = k.chunkAt(Math.floor(x), Math.floor(y))!;
      const S = k.config.chunkSize;
      const tile = (Math.floor(y) - ch.cy * S) * S + (Math.floor(x) - ch.cx * S);
      expect(k.holesIn(ch).get(tile)!.depth).toBeCloseTo(20 / vpt, 9);
      // Every voxel column of the cellar (the house's footprint, x and y 20-79) is under open terrain.
      let closed = 0;
      for (let vy = 20; vy <= 79; vy++) for (let vx = 20; vx <= 79; vx++) if (!openAt(k, ...at(vx, vy))) closed++;
      expect(closed).toBe(0);
      // Around it the terrain is whole, in the tiles the cellar only partly covers too.
      for (let v = 0; v < 100; v += 3)
        for (const [vx, vy] of [[v, 18], [v, 81], [18, v], [81, v]] as const) expect(openAt(k, ...at(vx, vy)), `${vx},${vy}`).toBe(false);
      expect(openAt(k, ...at(5, 5))).toBe(false);
      // The open area is the cellar's footprint: 60 × 60 voxels.
      let area = 0, tiles = 0, partly = 0;
      for (const c of k.chunks.values())
        for (const h of k.holesIn(c).values()) {
          tiles++;
          if (h.cover) partly++;
          area += h.cover ? h.cover.reduce((a, b) => a + b, 0) / HOLE_CELLS ** 2 : 1;
        }
      expect(area).toBeCloseTo((60 * 60) / (vpt * vpt), 9);
      // At 20 the cellar's edges are on the tiles' edges (3 × 3 whole tiles); at 16 they are not: 5 × 5 tiles, 16 of them in part
      // (with the middle of the tile alone, 3 × 3 would open and the rest of the cellar would stay under the ground).
      expect([tiles, partly]).toEqual(vpt === 20 ? [9, 0] : [25, 16]);

      // The renderer lowers the terrain there and only there: the tops under the ground cover the cellar's footprint.
      let low = 0;
      for (const c of k.chunks.values()) {
        if (!k.holesIn(c).size) continue;
        const mesh = buildChunk(k, c).group.children[0] as THREE.Mesh;
        const pos = mesh.geometry.getAttribute('position'), nor = mesh.geometry.getAttribute('normal');
        for (let i = 0; i < pos.count; i += 3) {
          if (nor.getY(i) !== 1 || pos.getY(i) > k.groundAt(cx, cy) - 10 / vpt || Math.abs(pos.getX(i) - cx) > 4 || Math.abs(pos.getZ(i) - cy) > 4) continue;
          const a = new THREE.Vector3().fromBufferAttribute(pos, i), b = new THREE.Vector3().fromBufferAttribute(pos, i + 1), d = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
          low += b.sub(a).cross(d.sub(a)).length() / 2;
        }
      }
      expect(low).toBeCloseTo((60 * 60) / (vpt * vpt), 6);
    }, 30_000);

    it('in the cellar one is under the ground, and the cut caps the terrain in the disc (T416)', async () => {
      const { k, at, ground } = await scene(model, vpt);
      const { ox, oy } = k.offset();
      const put = (x: number, y: number, z: number) => Object.assign(k.wandererPos(), { x: x - ox, y: y - oy, z });
      // Outside, on the ground; on the house's floor over the cellar: not under the ground.
      put(...at(10, 50), ground);
      expect(k.underground()).toBeUndefined();
      put(...at(74, 30), ground);
      expect(k.underground()).toBeUndefined();
      // In the cellar, past the stair: under the ground, the cut over the head.
      const [x, y] = at(74, 50);
      put(x, y, ground + floor);
      const u = k.underground()!;
      expect(u).toBeDefined();
      expect(u.depth).toBeCloseTo(-floor, 9);
      expect(u.cut).toBeCloseTo(ground + floor + CUT_ABOVE, 9);
      expect(u.tile).toEqual({ x: Math.floor(x), y: Math.floor(y) });
      // The same point asked for, as the master following a player does; and nothing out of the simulation.
      expect(k.underground({ x, y, z: ground + floor })).toEqual(u);
      k.zone = 'corona';
      expect(k.underground()).toBeUndefined();
      k.zone = 'sim';

      const towards: Towards = { x: 0, y: 1 };
      // Under a deeper cellar the cut is under the ground: every tile of the disc over it has its cap at the cut, the hole has none.
      const cut = ground - 0.5;
      const mesh = buildCut(k, { ...u, cut }, towards)!;
      expect(mesh).toBeDefined();
      const caps = facing(mesh, [0, 1, 0]);
      expect([...caps.ys]).toEqual([Math.round(cut * 1e6) / 1e6]);
      // What should be capped, tile by tile: the tops over the cut (the water lower, the hole on its sub-cells).
      const S = k.config.chunkSize;
      let expected = 0;
      for (const t of cutDisc(u.tile, towards)) {
        const code = k.tileAt(t.x, t.y);
        if (code === undefined) continue;
        const layer = k.palette[code]?.layer;
        const top = k.groundAt(t.x, t.y) + (layer === 'liquid' ? -0.18 : layer === 'floor' ? 0.02 : 0);
        if (top <= cut + 0.01) continue;
        const ch = k.chunkAt(t.x, t.y)!;
        const h = k.holesIn(ch).get((t.y - ch.cy * S) * S + (t.x - ch.cx * S));
        expected += !h ? 1 : h.cover ? h.cover.reduce((a, b) => a + (b ? 0 : 1), 0) / HOLE_CELLS ** 2 : 0;
      }
      expect(caps.area).toBeCloseTo(expected, 6);
      // The cellar's 60 × 60 voxels are not capped: the disc is around it.
      const tiles = cutDisc(u.tile, towards).filter((t) => k.tileAt(t.x, t.y) !== undefined).length;
      expect(expected).toBeLessThanOrEqual(tiles - (60 * 60) / (vpt * vpt) + 1e-9);
      // The tiles around the disc show their sides towards it, down to the cut, never under it.
      const sides = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].map((n) => facing(mesh, n as [number, number, number]));
      expect(sides.reduce((a, s) => a + s.area, 0)).toBeGreaterThan(0);
      for (const s of sides) expect(Math.min(...s.ys)).toBeCloseTo(cut, 6);
      // Over the cut nothing to cap: no mesh.
      expect(buildCut(k, { ...u, cut: ground + 5 }, towards)).toBeUndefined();
    }, 30_000);

    it('a jump crosses the stairwell and never falls into the cellar', async () => {
      const { k, at, ground } = await scene(model, vpt);
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
      const { k, id, at, ground, form } = await scene(closed, vpt);
      expect(form.base).toBe(20);
      expect(form.hole).toBeUndefined();
      // Still laid lower (its cellar is inside the earth), with nothing under the ground to stand on.
      expect(k.sunk(id)).toBeCloseTo(20 / vpt, 9);
      expect(k.floorAt(...at(50, 50))).toBeCloseTo(ground, 9);
      expect(k.floorAt(...at(50, 50), ground + floor)).toBeCloseTo(ground, 9);
      const [x, y] = at(50, 50);
      const ch = k.chunkAt(Math.floor(x), Math.floor(y))!;
      expect(k.holesIn(ch).size).toBe(0);
    }, 30_000);
  });
});
