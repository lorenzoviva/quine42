// T291 (ADR-0150): putting things down on furniture. Where a thing lies is decided by the true shapes of both (the furniture's
// floors, the item's model seen from above); it stays there in the save and for every wanderer, blocks nothing, and is not lost when
// the furniture goes.

import { beforeAll, describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Forms, InlineRunner, toLocal, type Form, type FormComp } from '../src/kernel/forms';
import { countItem } from '../src/kernel/inventory';
import { Kernel, placeRefusal } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { cellsOf, findSpot, itemShape, shelvesOf, turned, type ItemShape, type Spot, type Support } from '../src/kernel/placing';
import { colorTable, surfaces, type VoxelGrid } from '../src/mj/mesh';
import type { PaletteEntry } from '../src/mj/engine';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { boot, clearArea, DT, run, spawnInFront } from './world';
import { closeWorld, newLasting, open, pause } from './espressivita/banco';

// --- The shapes, on the seed's own models ------------------------------------------------------

const forms = new Forms(new InlineRunner());
forms.load(bundledFiles);

async function formOf(model: string, seed = 1): Promise<Form> {
  const f = await forms.wait(model, seed);
  expect(f?.status, model).toBe('ready');
  return f!;
}

const supportOf = (f: Form): Support => ({ levels: f.levels!, X: f.result!.grid.X, Y: f.result!.grid.Y, vpt: f.vpt, base: f.base });
const shapeOf = (f: Form): ItemShape => itemShape(f.result!.grid, f.result!.palette, f.vpt)!;
const OPEN = { from: { x: 0, y: 1.5 }, reach: 3, top: 999, bottom: -999 };

/** The top of every column with something in it (voxels), read from the grid itself: the commonest one is the furniture's top. */
function commonestTop(f: Form): number {
  const g = f.result!.grid;
  const colors = colorTable(g.alphabet, f.result!.palette);
  const count = new Map<number, number>();
  for (let i = 0; i < g.X * g.Y; i++) {
    let top = 0;
    for (let z = 0; z < g.Z; z++) if (colors[g.cells[i + z * g.X * g.Y]]) top = z + 1;
    if (top) count.set(top, (count.get(top) ?? 0) + 1);
  }
  return [...count].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

/**
 * Checked on the voxels, not on the floors the kernel derived: under every column of the item the furniture is solid just below the
 * spot's height and empty for the item's whole height above it (or the grid ends there).
 */
function liesFlat(support: Form, item: Form, spot: Spot): boolean {
  const g = support.result!.grid, ig = item.result!.grid;
  const solid = colorTable(g.alphabet, support.result!.palette);
  const at = (x: number, y: number, z: number) => z >= 0 && z < g.Z && !!solid[g.cells[x + y * g.X + z * g.X * g.Y]];
  const shape = shapeOf(item);
  const k = support.vpt / item.vpt;
  for (let iy = 0; iy < ig.Y; iy++)
    for (let ix = 0; ix < ig.X; ix++) {
      if (!shape.mask[ix + iy * ig.X]) continue;
      const [u, v] = turned((ix + 0.5 - ig.X / 2) * k, (iy + 0.5 - ig.Y / 2) * k, spot.turns);
      const cx = Math.floor(spot.x * support.vpt + g.X / 2 + u), cy = Math.floor(spot.y * support.vpt + g.Y / 2 + v);
      if (cx < 0 || cy < 0 || cx >= g.X || cy >= g.Y || !at(cx, cy, spot.h - 1)) return false;
      for (let z = spot.h; z < spot.h + Math.ceil(shape.height * k); z++) if (at(cx, cy, z)) return false;
    }
  return true;
}

/** Puts items one after the other, as the kernel does, until the furniture says no: the spots and the reason. */
function fill(support: Form, item: Form, from = OPEN.from): { spots: Spot[]; last: string } {
  const s = supportOf(support);
  const things = new Map<number, Set<number>>();
  const spots: Spot[] = [];
  for (let n = 0; n < 50; n++) {
    const r = findSpot(s, shapeOf(item), { ...OPEN, from, things });
    if ('fail' in r) return { spots, last: r.fail };
    spots.push(r.spot);
    const taken = things.get(r.spot.h) ?? new Set<number>();
    for (const c of r.spot.cells) taken.add(c);
    things.set(r.spot.h, taken);
  }
  return { spots, last: 'mai' };
}

const FURNITURE: Array<[string, number]> = [
  ['banco', 1],
  ['banco', 2],
  ['credenza', 1],
  ['credenza', 2],
  ['furniture', 1],
  ['furniture', 2],
  ['letto', 1],
  ['letto', 2],
  ['barile', 1],
];

describe('the spot, on the true shapes of the seed', () => {
  it('on every piece of furniture of the seed a thing lies on its top, every column of it on wood with room above', async () => {
    const pot = await formOf('object');
    for (const [model, seed] of FURNITURE) {
      const f = await formOf(model, seed);
      const r = findSpot(supportOf(f), shapeOf(pot), OPEN);
      expect('spot' in r, `${model} ${seed}`).toBe(true);
      const spot = (r as { spot: Spot }).spot;
      expect(spot.h, `${model} ${seed}`).toBe(commonestTop(f));
      expect(liesFlat(f, pot, spot), `${model} ${seed}`).toBe(true);
      // What the kernel takes again for a thing already there is what the spot took.
      expect(cellsOf(supportOf(f), shapeOf(pot), spot.x, spot.y, spot.turns).sort((a, b) => a - b)).toEqual([...spot.cells].sort((a, b) => a - b));
    }
  });

  it('a sign, a fire, a barrel with a bump on its lid: no shelf holds the thing', async () => {
    const pot = await formOf('object');
    for (const [model, seed] of [['cartello', 1], ['falo', 1], ['barile', 2]] as Array<[string, number]>) {
      expect(findSpot(supportOf(await formOf(model, seed)), shapeOf(pot), OPEN), `${model} ${seed}`).toEqual({ fail: 'no-shelf' });
    }
  });

  it('how many fit is how many footprints fit: they never overlap, each lies flat, then the furniture is full', async () => {
    const pot = await formOf('object');
    const scissors = await formOf('forbici');
    for (const item of [pot, scissors])
      for (const [model, seed] of FURNITURE) {
        const f = await formOf(model, seed);
        const { spots, last } = fill(f, item);
        // The pot goes on every one; the scissors, wide at the handles, not on a round lid.
        if (item === pot) expect(spots.length, `${item.model} su ${model} ${seed}`).toBeGreaterThanOrEqual(1);
        expect(last, `${item.model} su ${model} ${seed}`).toBe(spots.length ? 'full' : 'no-shelf');
        const seen = new Set<string>();
        for (const s of spots) {
          expect(liesFlat(f, item, s)).toBe(true);
          for (const c of s.cells) {
            expect(seen.has(`${s.h}:${c}`), `${item.model} su ${model} ${seed}`).toBe(false);
            seen.add(`${s.h}:${c}`);
          }
        }
      }
    // The chest's lid is 19 voxels wide and a pot 9: two side by side, not a third.
    expect(fill(await formOf('furniture', 1), pot).spots.length).toBe(2);
  });

  it('the first goes in the corner nearest to who puts it down, the next beside it', async () => {
    const f = await formOf('furniture', 1);
    const pot = await formOf('object');
    const near = fill(f, pot, { x: 0, y: 2 }).spots;
    const far = fill(f, pot, { x: 0, y: -2 }).spots;
    // From the front (+y) the first lies further forward than from behind.
    expect(near[0].y).toBeGreaterThan(far[0].y);
    expect(near[1].y).toBeCloseTo(near[0].y, 5);
    expect(Math.sign(near[1].x)).toBe(-Math.sign(near[0].x));
  });
});

/** A plain support drawn by hand: a 20 × 20 grid, a shelf `w` columns wide and `d` deep at `h` voxels, under a board at `ceiling` if given. */
function slab(w: number, d: number, h: number, ceiling?: number): Support {
  const X = 20, Y = 20, Z = 20;
  const cells = new Uint8Array(X * Y * Z);
  for (let z = 0; z < h; z++) for (let y = 0; y < d; y++) for (let x = 0; x < w; x++) cells[x + y * X + z * X * Y] = 1;
  if (ceiling !== undefined) for (let y = 0; y < d; y++) for (let x = 0; x < w; x++) cells[x + y * X + ceiling * X * Y] = 1;
  const g: VoxelGrid = { X, Y, Z, cells, alphabet: ['.', 'W'] };
  const palette: Record<string, PaletteEntry> = { W: { color: '#8a5a34' } as PaletteEntry };
  return { levels: surfaces(g, palette, 0, 0), X, Y, vpt: 20, base: 0 };
}

/** A thing 12 voxels long and 2 wide, 3 tall. */
function stick(): ItemShape {
  const X = 12, Y = 12;
  const mask = new Uint8Array(X * Y);
  for (let x = 0; x < 12; x++) for (let y = 5; y < 7; y++) mask[x + y * X] = 1;
  return { mask, X, Y, vpt: 20, height: 3 };
}

describe('the spot, by hand', () => {
  it('a long thing on a narrow shelf lies turned', () => {
    const r = findSpot(slab(3, 20, 10), stick(), OPEN);
    expect('spot' in r && r.spot.turns % 2).toBe(1);
    expect(shelvesOf(slab(3, 20, 10)).has(10)).toBe(true);
  });

  it('why not: too high, too far, full, someone there', () => {
    const s = slab(20, 20, 10);
    expect(findSpot(s, stick(), { ...OPEN, top: 9 })).toEqual({ fail: 'high' });
    expect(findSpot(s, stick(), { ...OPEN, bottom: 11 })).toEqual({ fail: 'high' });
    expect(findSpot(s, stick(), { ...OPEN, from: { x: 0, y: 30 }, reach: 2 })).toEqual({ fail: 'far' });
    const all = new Set(Array.from({ length: 400 }, (_, i) => i));
    expect(findSpot(s, stick(), { ...OPEN, things: new Map([[10, all]]) })).toEqual({ fail: 'full' });
    expect(findSpot(s, stick(), { ...OPEN, bodies: new Map([[10, all]]) })).toEqual({ fail: 'taken' });
    // Someone stands on another shelf, or the thing is not on this one: it changes nothing here.
    expect('spot' in findSpot(s, stick(), { ...OPEN, bodies: new Map([[4, all]]) })).toBe(true);
    // Under a board lower than the thing is tall, nothing goes; under a higher one it does, and so on the board.
    expect(findSpot(slab(20, 20, 10, 13), { ...stick(), height: 4 }, OPEN)).toEqual({ spot: expect.objectContaining({ h: 14 }) });
    const under = findSpot(slab(20, 20, 10, 19), { ...stick(), height: 4 }, { ...OPEN, top: 12 });
    expect(under).toEqual({ spot: expect.objectContaining({ h: 10 }) });
    expect(findSpot(slab(20, 20, 10, 13), { ...stick(), height: 4 }, { ...OPEN, top: 12 })).toEqual({ fail: 'high' });
  });

  it('the words of the world say why, with no word of the game', () => {
    for (const why of ['no-shelf', 'high', 'far', 'full', 'taken'] as const) {
      const said = placeRefusal(why, 'Credenza', 'Coltello');
      expect(said.length).toBeGreaterThan(10);
      expect(said).not.toMatch(/voxel|kernel|codice|simulazion|tile|casell/i);
    }
  });
});

// --- In the world -------------------------------------------------------------------------------

/** Ticks with time for the forms to arrive. */
async function settleForms(k: Kernel, ids: number[]): Promise<void> {
  for (const id of ids) {
    const fc: FormComp | undefined = k.ecs.get(id, 'form');
    if (fc) await k.forms.wait(fc.model, fc.seed, fc.tint);
  }
  run(k, 0.1);
}

const holding = (k: Kernel, item: string) => {
  const inv = k.inventory();
  const i = inv.slots.findIndex((s) => !s);
  inv.slots[i] = { item, count: 1 };
  inv.equipped = i;
  return i;
};

const placed = (k: Kernel) => k.ecs.query('placed', 'pickup');

describe('putting down in the world', () => {
  let k: Kernel;
  const said: string[] = [];
  beforeAll(async () => {
    k = await boot();
    k.bus.on('ui:message', (m) => said.push(String(m.text)));
  }, 120_000);

  const spawned: number[] = [];
  const furniture = (id: string, dist = 1.1) => {
    const e = spawnInFront(k, id, dist);
    spawned.push(e);
    return e;
  };
  const fresh = () => {
    for (const id of k.ecs.query('placed')) k.ecs.destroy(id);
    for (const id of spawned.splice(0)) k.ecs.destroy(id);
    clearArea(k);
    const inv = k.inventory();
    inv.slots.forEach((_, i) => i > 0 && (inv.slots[i] = null));
    inv.equipped = null;
  };

  it('what is held goes onto the furniture in front, at the height of its top, and is taken back as from the ground', async () => {
    fresh();
    const bench = furniture('obj.counter', 1.1);
    await settleForms(k, [bench]);
    holding(k, 'item.coltello');
    expect(k.actionsFor(bench)).toContainEqual({ id: 'posa', label: 'Posa Coltello qui sopra', enabled: true });
    await k.perform(bench, 'posa');
    const [knife] = placed(k);
    expect(knife).toBeDefined();
    expect(k.ecs.get(knife, 'pickup').item).toBe('item.coltello');
    expect(countItem(k.inventory(), 'item.coltello')).toBe(0);
    expect(k.inventory().equipped).toBe(null);
    run(k, 0.1);
    const fc: FormComp = k.ecs.get(bench, 'form');
    const f = k.forms.ready(fc.model, fc.seed, fc.tint)!;
    const bp = k.ecs.get(bench, 'pos');
    const p = k.ecs.get(knife, 'pos');
    expect(p.z).toBeCloseTo(k.groundAt(bp.x, bp.y) + commonestTop(f) / f.vpt, 6);
    // On the bench, turned as the bench.
    const [lx, ly] = toLocal(p.x - bp.x, p.y - bp.y, fc.yaw);
    expect(Math.abs(lx)).toBeLessThan(0.5);
    expect(Math.abs(ly)).toBeLessThan(0.5);
    const quarters = (k.ecs.get(knife, 'form').yaw - fc.yaw) / (Math.PI / 2);
    expect(Math.abs(quarters - Math.round(quarters))).toBeLessThan(1e-9);
    expect(k.supportOf(knife)).toBe(bench);
    expect(said.at(-1)).toBe('Posi Coltello su Banco da lavoro.');
    // Something else in hand: the menu of what lies there puts it beside, on the same furniture.
    holding(k, 'item.ascia');
    expect(k.actionsFor(knife)).toContainEqual({ id: 'posa', label: 'Posa Ascia accanto', enabled: true });
    // Taken back as from the ground.
    await k.perform(knife, 'raccogli');
    expect(k.ecs.alive.has(knife)).toBe(false);
    expect(countItem(k.inventory(), 'item.coltello')).toBe(1);
  });

  it('it says no in words of the world: a well, a crate that moves, a sign, nothing in hand, a full chest, someone standing on it', async () => {
    fresh();
    const well = furniture('object.well', 2.5);
    await settleForms(k, [well]);
    holding(k, 'item.coltello');
    expect(await k.placeOn(well)).toBe(false);
    expect(said.at(-1)).toBe('Pozzo non è un mobile: lì sopra non si posa niente.');
    k.ecs.destroy(well);
    const crate = furniture('object.crate', 1.1);
    await settleForms(k, [crate]);
    expect(await k.placeOn(crate)).toBe(false);
    expect(said.at(-1)).toBe('Cassa di legno si muove: lì sopra non resterebbe fermo niente.');
    k.ecs.destroy(crate);
    const sign = furniture('object.sign', 1.1);
    await settleForms(k, [sign]);
    expect(await k.placeOn(sign)).toBe(false);
    expect(said.at(-1)).toBe('Cartello non ha un piano dove stia Coltello.');
    k.ecs.destroy(sign);
    const chest = furniture('obj.chest', 1.1);
    await settleForms(k, [chest]);
    k.inventory().equipped = null;
    expect(await k.placeOn(chest)).toBe(false);
    expect(said.at(-1)).toBe('Non impugni nulla da posare (1–6 o inventario).');
    // As many as the lid holds, then no more.
    let n = 0;
    for (const item of ['item.coltello', 'item.ascia', 'item.martello', 'item.bastone']) {
      holding(k, item);
      if (await k.placeOn(chest)) n++;
      else break;
    }
    expect(n).toBeGreaterThanOrEqual(1);
    expect(said.at(-1)).toMatch(/^Su Cassapanca non c'è più posto per /);
    for (const id of placed(k)) k.ecs.destroy(id);
    // Someone standing on the lid: there is no room for anything.
    const fc: FormComp = k.ecs.get(chest, 'form');
    const f = k.forms.ready(fc.model, fc.seed, fc.tint)!;
    const cp = k.ecs.get(chest, 'pos');
    const top = k.groundAt(cp.x, cp.y) + commonestTop(f) / f.vpt;
    const who = k.ecs.spawn({ pos: { x: cp.x, y: cp.y, z: top }, body: { r: 0.5, solid: false }, identity: { name: 'Tobia' } });
    run(k, 0.05);
    expect(k.ecs.get(who, 'pos').z).toBeCloseTo(top, 6);
    holding(k, 'item.martello');
    expect(await k.placeOn(chest)).toBe(false);
    expect(said.at(-1)).toBe("Sopra Cassapanca c'è già qualcuno.");
    k.ecs.destroy(who);
    expect(await k.placeOn(chest)).toMatch(/^Posi Martello su Cassapanca/);
  });

  it('what lies on furniture blocks nothing (rule 10), and is not lost when the furniture goes', async () => {
    fresh();
    const chest = furniture('obj.chest', 1.1);
    await settleForms(k, [chest]);
    const cp = k.ecs.get(chest, 'pos');
    const probes: Array<[number, number]> = [];
    for (let dx = -1.5; dx <= 1.5; dx += 0.25) for (let dy = -1.5; dy <= 1.5; dy += 0.25) probes.push([cp.x + dx, cp.y + dy]);
    const before = probes.map(([x, y]) => [k.free(x, y, 0.22), k.floorAt(x, y)]);
    holding(k, 'item.lanterna');
    expect(await k.placeOn(chest)).toBeTruthy();
    run(k, 0.1);
    const [lamp] = placed(k);
    expect(k.ecs.get(lamp, 'body').solid).toBe(false);
    expect(probes.map(([x, y]) => [k.free(x, y, 0.22), k.floorAt(x, y)])).toEqual(before);
    const shelf = k.ecs.get(lamp, 'pos').z;
    expect(shelf).toBeGreaterThan(k.groundAt(cp.x, cp.y));
    // The chest breaks: the lantern lies on the ground under where it was, and can still be taken.
    (k as unknown as { breakEntity(id: number): void }).breakEntity(chest);
    run(k, 0.1);
    expect(k.ecs.alive.has(lamp)).toBe(true);
    const p = k.ecs.get(lamp, 'pos');
    expect(p.z).toBeCloseTo(k.groundAt(p.x, p.y), 6);
    expect(k.supportOf(lamp)).toBeUndefined();
    await k.perform(lamp, 'raccogli');
    expect(countItem(k.inventory(), 'item.lanterna')).toBe(1);
  });
});

/** Puts the wanderer acting where the world has them at (x, y), on the ground. */
function carry(k: Kernel, to: { x: number; y: number }): void {
  const p = k.wandererPos();
  Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  delete p.z;
}

/** A free point of the ground beside a thing, out of every lot, a little more than a tile from its middle. */
function beside(k: Kernel, id: number): { x: number; y: number } {
  const c = k.ecs.get(id, 'pos');
  for (const d of [1.1, 1.2, 1.3])
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const x = c.x + dx * d, y = c.y + dy * d;
      if (k.free(x, y, 0.25) && !k.lotAt(x, y) && k.tileAt(Math.floor(x), Math.floor(y)) !== undefined) return { x, y };
    }
  throw new Error('nessun posto libero accanto');
}

describe('saved, and opened again', () => {
  it('a thing put down on a piece of furniture of a place is there again after a restart, on the same shelf', async () => {
    const w = newLasting(bundledFiles);
    const k = await open(w);
    // A chest the place itself put there, in the open: it comes back with the place.
    const chest = k.ecs.query('module', 'origin').find((id) => {
      const c = k.ecs.get(id, 'pos');
      return k.ecs.get(id, 'module').id === 'obj.chest' && !k.lotAt(c.x, c.y) && Math.hypot(c.x, c.y) < 40;
    })!;
    expect(chest).toBeDefined();
    const origin = k.ecs.get(chest, 'origin').key;
    // The wanderer beside it.
    carry(k, beside(k, chest));
    await settleForms(k, [chest]);
    holding(k, 'item.coltello');
    expect(await k.placeOn(chest)).toBeTruthy();
    run(k, 0.1);
    const [knife] = placed(k);
    const was = { ...k.ecs.get(knife, 'pos'), yaw: k.ecs.get(knife, 'form').yaw };
    await closeWorld(k, w);
    expect(JSON.parse(w.files['world/state.json']).placed).toHaveLength(1);

    const again = await open(w);
    const [back] = placed(again);
    expect(back).toBeDefined();
    expect(again.ecs.get(back, 'pickup').item).toBe('item.coltello');
    const q = again.ecs.get(back, 'pos');
    expect(q.x).toBeCloseTo(was.x, 3);
    expect(q.y).toBeCloseTo(was.y, 3);
    expect(again.ecs.get(back, 'form').yaw).toBeCloseTo(was.yaw, 3);
    const chestAgain = again.ecs.query('origin').find((id) => again.ecs.get(id, 'origin').key === origin)!;
    await settleForms(again, [chestAgain]);
    expect(again.ecs.get(back, 'pos').z).toBeCloseTo(was.z!, 3);
    expect(again.supportOf(back)).toBe(chestAgain);
    // Taken, it is no longer saved.
    await again.perform(back, 'raccogli');
    expect(again.saveState()).toBe(true);
    expect(JSON.parse(again.repo.working['world/state.json']).posati).toBeUndefined();
  });

  it('a place left out of sight (ADR-0149) comes back with what lay on its furniture, on the same shelf, and the save keeps it meanwhile', async () => {
    const w = newLasting(bundledFiles);
    const k = await open(w);
    for (const id of k.ecs.query('mind')) k.ecs.destroy(id);
    const chest = k.ecs.query('module', 'origin').find((id) => {
      const c = k.ecs.get(id, 'pos');
      return k.ecs.get(id, 'module').id === 'obj.chest' && !k.lotAt(c.x, c.y) && Math.hypot(c.x, c.y) < 40;
    })!;
    expect(chest).toBeDefined();
    const origin = k.ecs.get(chest, 'origin').key;
    const S = k.config.chunkSize;
    const key = (k.ecs.get(chest, 'chunk') as { key: string }).key;
    carry(k, beside(k, chest));
    await settleForms(k, [chest]);
    holding(k, 'item.coltello');
    expect(await k.placeOn(chest)).toBeTruthy();
    run(k, 0.1);
    const [knife] = placed(k);
    const was = { ...k.ecs.get(knife, 'pos') };
    const loaded = () => k.chunks.get(key)?.stage === 'planned';
    // Away, far enough that the place unloads: its chest goes with it, the knife waits where it was put.
    let gone = 0;
    for (let jump = 0; jump < 3 && loaded(); jump++) {
      k.carpet()!.ox += 12 * S;
      gone += 12;
      for (let i = 0; i < 400 && loaded(); i++) {
        k.tick(1 / 20);
        await pause(2);
      }
    }
    expect(loaded()).toBe(false);
    expect(k.ecs.alive.has(chest)).toBe(false);
    expect(k.ecs.alive.has(knife)).toBe(true);
    k.saveState();
    expect(JSON.parse(k.repo.working['world/state.json']).placed).toEqual([expect.objectContaining({ item: 'item.coltello' })]);
    // A day goes by out of sight, then back: the chest is there again and the knife on its shelf.
    k.time += Kernel.DAY_SECONDS;
    run(k, 0.5);
    k.carpet()!.ox -= gone * S;
    for (let i = 0; i < 400 && !loaded(); i++) {
      k.tick(1 / 20);
      await pause(2);
    }
    expect(loaded()).toBe(true);
    const chestAgain = k.ecs.query('origin').find((id) => k.ecs.get(id, 'origin').key === origin)!;
    expect(chestAgain).toBeDefined();
    await settleForms(k, [chestAgain]);
    const q = k.ecs.get(knife, 'pos');
    expect(q.x).toBeCloseTo(was.x, 6);
    expect(q.y).toBeCloseTo(was.y, 6);
    expect(q.z).toBeCloseTo(was.z!, 3);
    expect(k.supportOf(knife)).toBe(chestAgain);
    expect(placed(k)).toEqual([knife]);
  }, 120_000);

  it('a save written by hand with nonsense in it opens anyway, keeping only what makes sense', async () => {
    const st = { posati: [null, 7, { item: 'item.coltello', x: 'qui', y: 0, z: 0 }, { item: 'nessuno', x: 1, y: 1, z: 1 }, { item: 'item.ascia', x: 1e9, y: 0, z: 0 }, { item: 'item.martello', count: -3, x: 2.5, y: 3.5, z: 0.6, yaw: 'su', inv: { slots: 'no' } }, { item: 'item.sacco', x: 4.5, y: 4.5, z: 0.5, inv: { slots: [{ item: 'item.mela-rossa', count: 2 }, { item: 5 }, null] } }] };
    const k = await Kernel.boot({ files: { ...bundledFiles, 'world/state.json': JSON.stringify(st) }, store: memoryStore(), ai: new MockAiModels() });
    const items = placed(k).map((id) => k.ecs.get(id, 'pickup'));
    expect(items.map((pk) => pk.item).sort()).toEqual(['item.martello', 'item.sacco']);
    expect(items.find((pk) => pk.item === 'item.martello')!.count).toBe(1);
    expect(items.find((pk) => pk.item === 'item.sacco')!.inv).toEqual({ slots: [{ item: 'item.mela-rossa', count: 2 }, null, null], equipped: null });
  });
});

// --- Two wanderers ----------------------------------------------------------------------------------

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

async function thin(server: SessionServer, id: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
  return new ThinClient(k, session);
}

function frames(server: SessionServer, clients: ThinClient[], n: number) {
  for (let i = 0; i < n; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

async function settleMany(server: SessionServer, clients: ThinClient[]) {
  for (let i = 0; i < 80; i++) {
    frames(server, clients, 1);
    await new Promise((r) => setTimeout(r, 25));
    if ([...server.kernel.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  frames(server, clients, 12);
}

/** A run of free tiles toward east, at least 10 tiles from where the wanderer is, out of lots. */
function freeRun(k: Kernel, id: string, length: number): { x: number; y: number } {
  const at = k.wandererAt(id)!;
  for (let d = 10; d < 40; d++)
    for (const row of [Math.floor(at.y) + d, Math.floor(at.y) - d])
      for (let col = Math.floor(at.x) - 20; col < Math.floor(at.x) + 20; col++) {
        let ok = true;
        for (let i = -1; i <= length + 1 && ok; i++) ok = k.free(col + i + 0.5, row + 0.5, 0.45) && k.tileAt(col + i, row) !== undefined && !k.lotAt(col + i + 0.5, row + 0.5);
        if (ok) return { x: col + 0.5, y: row + 0.5 };
      }
  throw new Error('nessun tratto libero');
}

/** The mirror's entity standing for an entity of the server. */
const mirrorOf = (c: ThinClient, k: Kernel, sid: number) => {
  const p = k.ecs.get(sid, 'pos');
  return c.k.ecs.query('pos').find((e) => (c.k.ecs.has(e, 'module') || c.k.ecs.has(e, 'pickup')) && Math.hypot(c.k.ecs.get(e, 'pos').x - p.x, c.k.ecs.get(e, 'pos').y - p.y) < 0.01);
};

describe('two wanderers', () => {
  it('what one puts down the other sees on the same shelf, and can take', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna');
    const bruno = await thin(server, 'bruno');
    await settleMany(server, [anna, bruno]);
    // Anna on a free run of tiles, a chest beside her, Bruno a little further: he sees it.
    const at = freeRun(k, 'anna', 6);
    k.as('anna', () => carry(k, at));
    k.as('bruno', () => carry(k, { x: at.x + 2.4, y: at.y }));
    const chest = k.spawnModuleEntity(k.modules.get('obj.chest')!, at.x + 1.1, at.y);
    k.as('anna', () => (k.wandererComp().facing = 'right'));
    k.as('anna', () => holding(k, 'item.coltello'));
    await settleForms(k, [chest]);
    frames(server, [anna, bruno], 12);
    const mine = mirrorOf(anna, k, chest)!;
    expect(mine).toBeDefined();
    await settleForms(anna.k, [mine]);
    expect(anna.k.actionsFor(mine)).toContainEqual({ id: 'posa', label: 'Posa Coltello qui sopra', enabled: true });
    const asked = anna.k.performMenu('e:posa', mine, 0, 0);
    frames(server, [anna, bruno], 6);
    for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
    frames(server, [anna, bruno], 12);
    await asked;
    const [knife] = placed(k);
    expect(knife).toBeDefined();
    expect(k.as('anna', () => countItem(k.inventory(), 'item.coltello'))).toBe(0);
    const shelf = k.ecs.get(knife, 'pos').z;
    expect(shelf).toBeGreaterThan(k.groundAt(at.x + 1.1, at.y));
    // Bruno's world has it too, resting on his copy of the chest at the same height.
    const theirs = mirrorOf(bruno, k, knife)!;
    expect(theirs).toBeDefined();
    expect(bruno.k.ecs.get(theirs, 'placed')).toEqual({ z: shelf });
    const brunoChest = mirrorOf(bruno, k, chest)!;
    await settleForms(bruno.k, [brunoChest]);
    frames(server, [anna, bruno], 3);
    expect(bruno.k.ecs.get(theirs, 'pos').z).toBeCloseTo(shelf, 6);
    // Bruno takes it.
    const taking = bruno.k.perform(theirs, 'raccogli');
    frames(server, [anna, bruno], 6);
    for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
    frames(server, [anna, bruno], 12);
    await taking;
    expect(k.ecs.alive.has(knife)).toBe(false);
    expect(k.as('bruno', () => countItem(k.inventory(), 'item.coltello'))).toBe(1);
    expect(anna.k.ecs.query('placed')).toEqual([]);
  });

  it('whatever comes on the wire with `posa`, the world answers and goes on (rule 8i)', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const { server: s, client } = fakeLink();
    const got: ServerMsg[] = [];
    client.onMessage((m) => got.push(m));
    server.connect(s);
    client.send({ t: 'join', id: 'cleo' });
    for (let i = 0; i < 80; i++) {
      server.tick(DT);
      await new Promise((r) => setTimeout(r, 25));
      if (k.chunks.size && [...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
    }
    const run0 = freeRun(k, 'cleo', 6);
    k.as('cleo', () => carry(k, run0));
    server.tick(DT);
    const at = k.wandererAt('cleo')!;
    const chest = k.spawnModuleEntity(k.modules.get('obj.chest')!, at.x + 1.1, at.y);
    const loose = k.spawnItem('item.mela-rossa', at.x - 1, at.y);
    await settleForms(k, [chest]);
    const shapes: unknown[] = [chest, loose, at.entity, 'x', NaN, -1, 1e12, {}, null, [chest], { toString: () => String(chest) }];
    let seq = 0;
    for (const entita of shapes) {
      const before = k.ticks;
      client.send({ t: 'action', seq: ++seq, entita, action: 'posa' } as never);
      expect(() => server.tick(DT)).not.toThrow();
      expect(k.ticks).toBe(before + 1);
    }
    // Even holding something, on a thing on the ground or on oneself nothing goes.
    k.as('cleo', () => holding(k, 'item.coltello'));
    client.send({ t: 'action', seq: ++seq, entity: loose, action: 'posa' });
    client.send({ t: 'action', seq: ++seq, entity: at.entity, action: 'posa' });
    server.tick(DT);
    for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
    server.tick(DT);
    const answers = got.filter((m): m is Extract<ServerMsg, { t: 'result' }> => m.t === 'result');
    expect(new Set(answers.map((a) => a.seq)).size).toBe(seq);
    expect(placed(k)).toEqual([]);
    expect(k.as('cleo', () => countItem(k.inventory(), 'item.coltello'))).toBe(1);
    // Then, on the chest, it goes.
    client.send({ t: 'action', seq: ++seq, entity: chest, action: 'posa' });
    server.tick(DT);
    for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
    expect(placed(k)).toHaveLength(1);
  });
});
