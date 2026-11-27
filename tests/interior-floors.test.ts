// The interiors by storey (T431): the guard keeps the way when two pieces stand corner to corner (a body does not pass between them), a
// solid thing put indoors stays off the foot of the stairs and square to the walls, and `E`, the right button and the cursor find only what
// is on the storey the wanderer stands on, the furniture the kernel placed in a building too (voxels of the building, found by its box;
// since T514 the thing beside it says what it is, `tests/mobili-interni.test.ts`).

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import type { FormComp } from '../src/kernel/forms';
import { InteriorGuard, interiorPlan } from '../src/kernel/interior';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import type { VoxelGrid } from '../src/mj/mesh';

/** A room of 38 × 38 voxels at 10 a tile with a roof, its door in the front wall: what the guard walks. */
function room() {
  const X = 40, Y = 40, Z = 30;
  const cells = new Uint8Array(X * Y * Z);
  const set = (x: number, y: number, z: number) => (cells[x + y * X + z * X * Y] = 1);
  for (let z = 0; z < 25; z++)
    for (let i = 0; i < X; i++) {
      set(i, 0, z);
      set(0, i, z);
      set(X - 1, i, z);
      if (!(i >= 16 && i <= 23 && z < 20)) set(i, Y - 1, z);
    }
  for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) set(x, y, 25);
  const grid = { X, Y, Z, cells, alphabet: ['.', 'W'] } as unknown as VoxelGrid;
  return interiorPlan({ grid, palette: { W: { color: '888888' } }, vpt: 10, base: 0, actions: [], seed: 1 });
}

/** The voxels of a box of the room, both ends inside. */
const box = (x0: number, x1: number, y0: number, y1: number, z1 = 12) => {
  const out: number[] = [];
  for (let z = 0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push(x + y * 40 + z * 1600);
  return out;
};

describe('la guardia degli interni con due mobili in diagonale (T431)', () => {
  // Two pieces from wall to wall, the first along y 14-17 up to x = a, the second from x = b at y from c: the back of the room is reached
  // only between them.
  const pair = (a: number, b: number, c: number) => {
    const guard = new InteriorGuard(room());
    return [guard.refusal(box(1, a, 14, 17)), guard.refusal(box(b, 38, c, c + 3))];
  };

  it('due mobili che si toccano d’angolo chiudono la via: il secondo è rifiutato', () => {
    expect(pair(19, 20, 18)).toEqual([undefined, 'cut']);
  });

  it('fra due mobili in diagonale con un varco più stretto di un corpo nessuno passa: il secondo è rifiutato', () => {
    // A voxel apart, three, a slit two voxels high: a body is 4.4 voxels wide at 10 a tile.
    expect(pair(18, 20, 18)).toEqual([undefined, 'cut']);
    expect(pair(16, 20, 18)).toEqual([undefined, 'cut']);
    expect(pair(16, 20, 20)).toEqual([undefined, 'cut']);
    expect(pair(14, 21, 21)).toEqual([undefined, 'cut']);
  });

  it('con un varco largo un corpo il secondo resta', () => {
    expect(pair(14, 22, 20)).toEqual([undefined, undefined]);
  });
});

const HOUSE = 'struttura-casa-del-borgomastro';
/** The bench's offline rules (`lab/banco/scenografo/offline/dati.json`): a hall with a counter, a sideboard and barrels, beds in the rooms. */
const RULES = {
  rules: [
    { storey: 0, room: 'hall', furniture: ['banco', 'credenza', 'barile'], count: 3 },
    { room: 'room', furniture: ['letto', 'furniture'], count: 2 },
    { furniture: ['barile'], count: 1 },
  ],
};

/** A kernel with the mayor's house of the seed furnished from the rules, standing at (5.5, 5.5) as a structure. */
async function furnishedHouse() {
  const index = JSON.parse(bundledFiles['models/index.json']);
  index[HOUSE] = { ...index[HOUSE], interior: RULES };
  const k = await Kernel.boot({ files: { ...bundledFiles, 'models/index.json': JSON.stringify(index) }, store: memoryStore(), ai: new MockAiModels() });
  const [x, y] = [5.5, 5.5];
  const house = k.spawnModuleEntity(k.modules.get('object.well')!, x, y, undefined, 'test#casa');
  Object.assign(k.ecs.get(house, 'form') as FormComp, { model: HOUSE, seed: 1, yaw: 0 });
  k.ecs.set(house, 'structure', { concept: 'la casa di prova', class: 'structure' });
  const form = (await k.forms.settled(HOUSE, 1))!;
  k.tick(1 / 60);
  return { k, house, form, x, y };
}

describe('E, il tasto destro e il cursore sul piano del viandante (T431)', () => {
  it('due cose una sopra l’altra su due piani: si trova quella del piano su cui si sta', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const chest = k.modules.get('object.well')!;
    const [x, y] = [8.5, 8.5];
    const below = k.spawnModuleEntity(chest, x, y, undefined, 'test#sotto');
    const above = k.spawnModuleEntity(chest, x, y, undefined, 'test#sopra');
    k.tick(1 / 60);
    const ground = k.groundAt(x, y);
    // Heights as the kernel keeps them where a building stands (`settleHeights`): the ground floor and the storey 2.4 tiles over it.
    k.ecs.get(below, 'pos').z = ground;
    k.ecs.get(above, 'pos').z = ground + 2.4;
    const stand = (feet: number) => {
      const { ox, oy } = k.offset();
      Object.assign(k.wandererPos(), { x: x - ox, y: y + 1 - oy, z: feet });
      k.wandererComp().facing = 'up';
    };
    stand(ground + 2.4);
    expect(k.targetInFront()).toBe(above);
    expect(k.tileMenu(Math.floor(x), Math.floor(y)).entity).toBe(above);
    const { ox, oy } = k.offset();
    const hover = () => k.hoverAt(x - ox, y - oy);
    expect(hover()).toMatchObject({ kind: 'entity' });
    // The one below is not found from upstairs: the storey above alone has nothing in front.
    k.ecs.destroy(above);
    expect(k.targetInFront()).toBeUndefined();
    expect(k.tileMenu(Math.floor(x), Math.floor(y)).entity).toBeUndefined();
    expect(hover()?.kind).not.toBe('entity');
    // On the ground floor it is.
    stand(ground);
    expect(k.targetInFront()).toBe(below);
    expect(k.tileMenu(Math.floor(x), Math.floor(y)).entity).toBe(below);
    expect(hover()).toMatchObject({ kind: 'entity' });
  }, 60_000);

  it('i mobili che il kernel ha posato in un edificio hanno il loro nome sotto il cursore, solo dal loro piano', async () => {
    const { k, form, x, y } = await furnishedHouse();
    expect(form.furnished).toBe(true);
    const pieces = form.result!.furniture!;
    expect(pieces.length).toBeGreaterThan(2);
    const g = form.result!.grid;
    for (const p of pieces) {
      const [x0, y0, z0, x1, y1, z1] = p.box;
      expect(x0).toBeLessThanOrEqual(x1);
      expect(y0).toBeLessThanOrEqual(y1);
      expect(z0).toBeLessThanOrEqual(z1);
      expect(x1).toBeLessThan(g.X);
      expect(z1).toBeLessThan(g.Z);
    }
    // A piece a module wears (the sideboard) says what its thing is (T514); one no module wears (the barrel), its name in the library.
    const barrel = pieces.find((p) => p.id === 'barile')!;
    expect(barrel).toBeDefined();
    for (const piece of [pieces[0], barrel]) {
      const [x0, y0, z0, x1, y1] = piece.box;
      // The middle of its box in the simulation (yaw 0), and the height of its storey's floor.
      const px = x + ((x0 + x1 + 1) / 2 - g.X / 2) / form.vpt, py = y + ((y0 + y1 + 1) / 2 - g.Y / 2) / form.vpt;
      const floor = k.groundAt(x, y) + (z0 - form.base) / form.vpt;
      const module = [...k.modules.values()].map((m) => m.manifest).find((m) => m.appearance?.model === piece.id && m.kind === 'entity');
      const name = module?.name ?? k.forms.info(piece.id)!.name!;
      const stand = (feet: number) => {
        const { ox, oy } = k.offset();
        Object.assign(k.wandererPos(), { x: x - ox, y: y - oy, z: feet });
      };
      const { ox, oy } = k.offset();
      stand(floor);
      expect(k.hoverAt(px - ox, py - oy)).toMatchObject({ kind: 'entity', name, description: module?.description ?? 'Arredo — la casa di prova', ...(module?.container ? { extra: 'E per aprire' } : {}) });
      // From a storey 2.4 tiles over or under it, not.
      stand(floor + 2.4);
      expect(k.hoverAt(px - ox, py - oy)).not.toMatchObject({ name });
      stand(floor - 2.4);
      expect(k.hoverAt(px - ox, py - oy)).not.toMatchObject({ name });
    }
  }, 240_000);

  it('una cosa solida messa dentro sta lontana dal piede della scala e in squadra con i muri', async () => {
    const { k, house, form, x, y } = await furnishedHouse();
    const g = form.result!.grid;
    const ground = (k as any).groundOf(house, k.ecs.get(house, 'form'), form);
    const { levels } = ground;
    // The first treads of the stair up: floors a body reaches more than a step over the ground floor and no more than a tile.
    const step = Math.round(0.2 * form.vpt);
    const treads: Array<[number, number]> = [];
    for (let i = 0; i < g.X * g.Y; i++)
      for (let l = levels.start[i]; l < levels.start[i + 1]; l++) {
        const up = levels.z[l] - form.base;
        if (!levels.block[l] && up > step && up <= form.vpt) {
          treads.push([i % g.X, Math.floor(i / g.X)]);
          break;
        }
      }
    expect(treads.length).toBeGreaterThan(0);
    const points: Array<{ x: number; y: number }> = (k as any).interiorPoints(house, 1.2, 1.2);
    // People are not kept off the stair: where they stand stops nobody for long.
    expect((k as any).interiorPoints(house, 1.2).length).toBeGreaterThan(points.length);
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) {
      const vx = (p.x - x) * form.vpt + g.X / 2 - 0.5, vy = (p.y - y) * form.vpt + g.Y / 2 - 0.5;
      const d = Math.min(...treads.map(([tx, ty]) => Math.hypot(tx - vx, ty - vy)));
      expect(d).toBeGreaterThanOrEqual(1.2 * form.vpt - 1e-6);
    }
    // Square to the walls: the turn of a thing put indoors is a quarter.
    const thing = k.spawnModuleEntity(k.modules.get('object.well')!, points[0].x, points[0].y, undefined, 'test#banco');
    const fc = k.ecs.get(thing, 'form') as FormComp;
    fc.yaw = 1;
    (k as any).squareIndoors(thing);
    expect(fc.yaw).toBeCloseTo(Math.PI / 2);
  }, 240_000);
});
