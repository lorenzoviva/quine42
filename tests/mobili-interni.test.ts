// The furniture of the interiors is used (T514, ADR-0270): every piece the Scenografo's rules place in a building (voxels of the building,
// ADR-0214) has beside it a thing of the world the kernel makes and does not draw: of the module that wears the piece's model (its actions,
// its container, `takeable`), or a thing with the menu of every thing; found by its box on its storey (E, the right button, the cursor);
// a chest opens, what is put in it is saved by the piece's origin; a piece taken leaves the building's voxels (`FormComp.out`) and comes out
// as itself, with the seed it had there; something goes down on its shelves; in a game of many the clients get it as the other things.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import type { FormComp } from '../src/kernel/forms';
import { outList, overPiece, PIECE_SEED, PIECE_STORE, pieceFrame, pieceKeys, pieceLevels, pieceModule, pieceOrigin, readFitted, shownFitted, storeNamed, withoutPieces, type FittedComp } from '../src/kernel/fitted';
import { countItem } from '../src/kernel/inventory';
import { Kernel } from '../src/kernel/kernel';
import { isThing, readMoved } from '../src/kernel/moving';
import { memoryStore } from '../src/kernel/repo';
import type { Manifest } from '../src/kernel/types';
import type { Levels } from '../src/mj/mesh';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionClient } from '../src/session/client';
import { SessionServer } from '../src/session/server';
import { ThinClient } from '../src/session/thin';
import { DT, pause } from './espressivita/banco';

const HOUSE = 'struttura-casa-del-borgomastro';
/** The bench's offline rules (`lab/banco/scenografo/offline/dati.json`): a hall with sideboards and barrels, beds and chests in the rooms. */
const RULES = {
  rules: [
    { storey: 0, room: 'hall', furniture: ['banco', 'credenza', 'barile'], count: 3 },
    { room: 'room', furniture: ['letto', 'furniture'], count: 2 },
    { furniture: ['barile'], count: 1 },
  ],
};
const ORIGIN = 'test#casa';

/** The seed with the mayor's house furnished from the rules. */
function furnishedFiles(extra: Record<string, unknown> = {}) {
  const index = JSON.parse(bundledFiles['models/index.json']);
  index[HOUSE] = { ...index[HOUSE], interior: RULES };
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return { ...bundledFiles, 'models/index.json': JSON.stringify(index), 'universe.json': JSON.stringify({ ...cfg, ...extra }, null, 2) };
}

/** The house standing at (x, y) as a structure of the world, its form ready, a tick: its pieces are things of the world. */
async function putHouse(k: Kernel, x = 5.5, y = 5.5) {
  const house = k.spawnModuleEntity(k.modules.get('object.well')!, x, y, undefined, ORIGIN);
  Object.assign(k.ecs.get(house, 'form') as FormComp, { model: HOUSE, seed: 1, yaw: 0 });
  k.ecs.set(house, 'structure', { concept: 'la casa di prova', class: 'structure' });
  const form = (await k.forms.settled(HOUSE, 1))!;
  k.tick(DT);
  return { house, form };
}

async function furnishedHouse(files: Record<string, string> = furnishedFiles()) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  return { k, ...(await putHouse(k)) };
}

const pieces = (k: Kernel) => k.ecs.query('fitted');
const pieceOf = (k: Kernel, module: string | undefined) => pieces(k).find((id) => k.ecs.get(id, 'module')?.id === module);
const comp = (k: Kernel, id: number): FittedComp => k.ecs.get(id, 'fitted');

/** Puts the wanderer where the world has them at (x, y), on the floor at height z. */
function stand(k: Kernel, x: number, y: number, z: number): void {
  const p = k.wandererPos();
  Object.assign(k.carpet()!, { ox: x - p.x, oy: y - p.y });
  p.z = z;
}

/** A point of the piece's storey beside it, where a body stands (`free` there, its floor within a step of that storey's), facing the piece. */
function beside(k: Kernel, id: number): { x: number; y: number; z: number; facing: 'left' | 'right' | 'up' | 'down' } {
  const p = k.ecs.get(id, 'pos');
  const f = comp(k, id);
  for (const d of [0.35, 0.45, 0.6, 0.8])
    for (const [dx, dy, facing] of [[-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down'], [0, 1, 'up']] as const) {
      const x = p.x + dx * (f.hx + d), y = p.y + dy * (f.hy + d);
      const z = k.floorAt(x, y, f.z);
      if (Math.abs(z - f.z) <= 0.25 && k.free(x, y, 0.3, z)) return { x, y, z, facing };
    }
  throw new Error('nessun posto accanto al mobile');
}

function standBeside(k: Kernel, id: number): void {
  const at = beside(k, id);
  stand(k, at.x, at.y, at.z);
  k.wandererComp().facing = at.facing;
}

describe('the pieces of an interior, as data (T514)', () => {
  const list = [
    { id: 'letto', box: [3, 4, 2, 9, 9, 8] as [number, number, number, number, number, number], cells: [1, 2, 3] },
    { id: 'letto', box: [3, 4, 2, 5, 6, 8] as [number, number, number, number, number, number], cells: [4] },
    { id: 'barile', box: [12, 4, 2, 14, 6, 8] as [number, number, number, number, number, number] },
  ];
  it('every piece has a key of its own, the same on every machine; its origin is its building’s and its key, never too long', () => {
    expect(pieceKeys(list)).toEqual(['letto@3,4,2', 'letto@3,4,2#2', 'barile@12,4,2']);
    expect(pieceKeys(undefined)).toEqual([]);
    expect(pieceOrigin('0,0#s1', 'letto@3,4,2')).toBe('0,0#s1~letto@3,4,2');
    const long = pieceOrigin('0,0#s1', `${'x'.repeat(200)}@1,2,3`);
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long).toBe(pieceOrigin('0,0#s1', `${'x'.repeat(200)}@1,2,3`));
    expect(long).not.toBe(pieceOrigin('0,0#s1', `${'x'.repeat(200)}@1,2,4`));
  });

  it('what a building lost is a sorted list of keys; its grid without them is empty where they were, and only there', () => {
    expect(outList(['b', 'a', 'b', 5, '', 'x'.repeat(300)])).toEqual(['a', 'b']);
    for (const v of [null, 'a', {}, [], [3]]) expect(outList(v)).toBeUndefined();
    const cells = new Uint8Array(8).fill(7);
    withoutPieces(cells, list, ['letto@3,4,2']);
    expect([...cells]).toEqual([7, 0, 0, 0, 7, 7, 7, 7]);
    // A piece of a form of before, which does not say its voxels, stays.
    withoutPieces(cells, list, ['barile@12,4,2', 'nessuno']);
    expect([...cells]).toEqual([7, 0, 0, 0, 7, 7, 7, 7]);
  });

  it('a piece stands in the world where the building’s grid has it, turned as the building', () => {
    const box = [10, 20, 16, 13, 23, 31] as [number, number, number, number, number, number];
    const at = pieceFrame(box, { X: 40, Y: 40 }, 16, 0, { x: 5, y: 5, yaw: 0, stand: 1 });
    expect(at).toEqual({ x: 5 + (12 - 20) / 16, y: 5 + (22 - 20) / 16, z: 2, top: 3, hx: 4 / 32, hy: 4 / 32 });
    // A quarter turn: the same point of the grid, where `toLocal` sends it back.
    const turned = pieceFrame(box, { X: 40, Y: 40 }, 16, 0, { x: 5, y: 5, yaw: Math.PI / 2, stand: 1 });
    const c = Math.cos(Math.PI / 2), s = Math.sin(Math.PI / 2);
    const dx = turned.x - 5, dy = turned.y - 5;
    expect(dx * c - dy * s).toBeCloseTo((12 - 20) / 16, 9);
    expect(dx * s + dy * c).toBeCloseTo((22 - 20) / 16, 9);
    expect(overPiece({ yaw: Math.PI / 2, hx: at.hx, hy: at.hy }, turned, turned.x + 0.1, turned.y)).toBe(true);
    expect(overPiece({ yaw: Math.PI / 2, hx: at.hx, hy: at.hy }, turned, turned.x + 0.2, turned.y)).toBe(false);
  });

  it('the thing of a piece is the module that wears its model and does something; none for a model no module wears', () => {
    const m = (id: string, model: string, more: Partial<Manifest> = {}) => ({ id, name: id, kind: 'entity', appearance: { model }, ...more }) as Manifest;
    const all = [m('b.crate', 'cassa', { physics: { pushable: true } }), m('a.box', 'cassa'), m('c.chest', 'cassa', { container: { size: 4, loot: 'x' } }), m('d.cat', 'cassa', { persona: 'gatto' }), m('e.one', 'cassa', { unique: true, container: { size: 1, loot: 'x' } })];
    expect(pieceModule(all, 'cassa')?.id).toBe('c.chest');
    expect(pieceModule(all.slice(0, 2), 'cassa')?.id).toBe('a.box');
    expect(pieceModule(all, 'barile')).toBeUndefined();
    const seed = Object.keys(bundledFiles).filter((p) => /^modules\/[^/]+\/manifest\.json$/.test(p)).map((p) => JSON.parse(bundledFiles[p]) as Manifest);
    expect(pieceModule(seed, 'furniture')?.id).toBe('obj.chest');
    expect(pieceModule(seed, 'credenza')?.id).toBe('obj.cupboard');
    expect(pieceModule(seed, 'letto')?.id).toBe('obj.bed');
    expect(pieceModule(seed, 'barile')).toBeUndefined();
  });

  it('a piece no module wears holds things when its name says so: a chest, a cupboard, a barrel; not a shelf, a bed, a bench', () => {
    for (const n of ['Cassa', 'Credenza', 'Barile', 'Archivio pneumatico', 'Grande baule', 'Old sea chest', 'Steam cabinet', 'Cassaforte di ghisa']) expect(storeNamed(n), n).toBe(true);
    for (const n of ['Scaffale della cantina', 'Rastrelliera delle botti', 'Letto', 'Banco da lavoro', 'Stufa in ghisa', 'Cassiere', 'Bed of the chest-maker', '']) expect(storeNamed(n), n).toBe(false);
  });

  it('a client reads a piece without trusting it, and gets what it is and where, never who it is', () => {
    const f: FittedComp = { of: '0,0#s1', key: 'letto@3,4,2', model: 'letto', name: 'Letto', yaw: 0, hx: 0.3, hy: 0.4, z: 1, top: 1.5 };
    const shown = shownFitted(f);
    expect(shown).toEqual({ model: 'letto', name: 'Letto', yaw: 0, hx: 0.3, hy: 0.4, z: 1, top: 1.5 });
    expect(readFitted(shown)).toEqual(shown);
    for (const v of [null, [], 'x', { ...shown, z: NaN }, { ...shown, hx: -1 }, { ...shown, hy: 1e9 }, { ...shown, model: '' }]) expect(readFitted(v), JSON.stringify(v)).toBeUndefined();
    expect(readFitted({ ...shown, name: 5, top: 0, extra: 'x' })).toEqual({ ...shown, name: 'letto', top: 1 });
  });

  it('the shelves of a piece are its building’s floors over its box alone', () => {
    // Two columns: a floor at 2 and one at 9; the other two columns are outside the box.
    const levels: Levels = { start: Uint32Array.from([0, 1, 3, 5, 6]), z: Uint16Array.from([1, 2, 9, 2, 9, 4]), base: Uint16Array.from([0, 0, 7, 0, 7, 0]), block: Uint8Array.from([0, 0, 0, 0, 0, 0]) };
    const crop = pieceLevels(levels, 4, [1, 0, 0, 2, 0, 5]);
    expect([...crop.start]).toEqual([0, 2, 4]);
    expect([...crop.z]).toEqual([2, 9, 2, 9]);
    expect([...crop.base]).toEqual([0, 7, 0, 7]);
  });
});

describe('the pieces of a furnished building are things of the world (T514)', () => {
  it('every piece has its thing: its module’s actions, container and takeable; none drawn, none solid, each on its storey', async () => {
    const { k, form } = await furnishedHouse();
    const list = form.result!.furniture!;
    expect(list.length).toBeGreaterThan(3);
    const ids = pieces(k);
    expect(ids.length).toBe(list.length);
    const keys = pieceKeys(list);
    for (const id of ids) {
      const f = comp(k, id);
      expect(keys).toContain(f.key);
      expect(k.ecs.get(id, 'origin').key).toBe(pieceOrigin(ORIGIN, f.key!));
      // Not drawn (the building draws it), stops nobody (the building's voxels do), on the floor of its storey.
      expect(k.ecs.has(id, 'glyph')).toBe(false);
      expect(k.ecs.get(id, 'body').solid).toBe(false);
      expect(k.ecs.get(id, 'pos').z).toBe(f.z);
      expect(k.ecs.get(id, 'form').seed).toBe(PIECE_SEED);
      const m = k.modules.get(k.ecs.get(id, 'module')?.id)?.manifest;
      const actions = k.actionsFor(id).map((a) => a.id);
      if (!m) {
        // A thing with the menu of every thing; one whose name says it holds things opens (the barrel of the seed).
        expect(actions).toEqual([...(storeNamed(f.name) ? ['apri'] : []), 'esamina', 'altro']);
        expect(k.nameOf(id)).toBe(k.forms.info(f.model)!.name);
        continue;
      }
      expect(m.appearance?.model).toBe(f.model);
      for (const a of m.actions ?? []) expect(actions).toContain(`act:${a.id}`);
      expect(actions.includes('apri')).toBe(!!m.container);
      expect(actions.includes('prendi')).toBe(m.takeable === true);
      if (m.container) expect(k.container(id)?.inv.slots.length).toBe(m.container.size);
    }
    // In the seed: the beds sleep, the cupboards and chests open, the barrel (no module wears it) opens as a container of the kernel's.
    expect(k.actionsFor(pieceOf(k, 'obj.bed')!).map((a) => a.id)).toEqual(expect.arrayContaining(['act:sleep', 'act:search', 'prendi']));
    expect(k.actionsFor(pieceOf(k, 'obj.chest')!).map((a) => a.id)).toEqual(expect.arrayContaining(['apri', 'prendi']));
    expect(pieceOf(k, undefined)).toBeDefined();
    // Ticks after, the same things: nothing is made twice.
    for (let i = 0; i < 30; i++) k.tick(DT);
    expect(pieces(k).sort()).toEqual(ids.sort());
  }, 240_000);

  it('E, the right button and the cursor find a piece by its box, from its storey only', async () => {
    const { k } = await furnishedHouse();
    const bed = pieceOf(k, 'obj.bed')!;
    const f = comp(k, bed);
    const p = k.ecs.get(bed, 'pos');
    standBeside(k, bed);
    expect(k.targetInFront()).toBe(bed);
    const menu = k.tileMenu(Math.floor(p.x), Math.floor(p.y));
    expect(menu.entity).toBe(bed);
    expect(menu.options.map((o) => o.id)).toEqual(expect.arrayContaining(['e:act:sleep', 'e:prendi']));
    const { ox, oy } = k.offset();
    // The cursor on an end of the bed, not its middle: the thing of the module, with what E does.
    const end = { x: p.x + f.hx * 0.8, y: p.y + f.hy * 0.8 };
    expect(k.hoverAt(end.x - ox, end.y - oy)).toMatchObject({ kind: 'entity', name: 'Letto di paglia', extra: 'E: Dormi, Fruga sotto il letto' });
    // From the storey over it, nothing of it.
    stand(k, k.carpet()!.ox + k.wandererPos().x, k.carpet()!.oy + k.wandererPos().y, f.z + 2.4);
    expect(k.hoverAt(end.x - ox, end.y - oy)).not.toMatchObject({ name: 'Letto di paglia' });
    expect(k.targetInFront()).not.toBe(bed);
    // Sleeping in it: its module's Lua, as for any bed.
    standBeside(k, bed);
    k.needs()!.energy = 10;
    await k.perform(bed, 'act:sleep');
    expect(k.needs()!.energy).toBe(100);
  }, 240_000);

  it('a chest inside a house opens; what is put in it stays, by the piece’s origin, after the game is saved and opened again', async () => {
    const files = furnishedFiles();
    const { k } = await furnishedHouse(files);
    const chest = pieceOf(k, 'obj.chest')!;
    const origin = k.ecs.get(chest, 'origin').key;
    const opened: Array<{ id: number; name: string }> = [];
    k.bus.on('ui:container', (e) => opened.push(e));
    standBeside(k, chest);
    await k.perform(chest, 'apri');
    expect(opened).toEqual([{ id: chest, name: 'Cassapanca' }]);
    const box = k.container(chest)!;
    expect(box.filled).toBe(true);
    box.inv.slots.fill(null);
    const inv = k.inventory();
    inv.slots[0] = { item: 'item.coltello', count: 1 };
    k.putIntoContainer(chest, 0);
    expect(countItem(box.inv, 'item.coltello')).toBe(1);
    expect(k.saveState()).toBe(true);
    const st = JSON.parse(k.files['world/state.json']);
    expect(st.containers[origin].inv.slots.filter(Boolean)).toEqual([expect.objectContaining({ item: 'item.coltello', count: 1 })]);

    const again = await Kernel.boot({ files: { ...k.files }, store: memoryStore(), ai: new MockAiModels() });
    await putHouse(again);
    const back = again.ecs.query('origin').find((e) => again.ecs.get(e, 'origin').key === origin)!;
    expect(back).toBeDefined();
    expect(again.ecs.has(back, 'fitted')).toBe(true);
    expect(countItem(again.container(back)!.inv, 'item.coltello')).toBe(1);
    expect(again.container(back)!.filled).toBe(true);
  }, 240_000);

  it('a piece taken leaves the building, comes out as itself with the seed it had there, and stays out after a restart', async () => {
    const files = furnishedFiles();
    const { k, house, form } = await furnishedHouse(files);
    const cupboard = pieceOf(k, 'obj.cupboard')!;
    const f = comp(k, cupboard);
    const origin = k.ecs.get(cupboard, 'origin').key;
    const p = { ...k.ecs.get(cupboard, 'pos') };
    k.openContainer(cupboard);
    k.container(cupboard)!.inv.slots.fill(null);
    const g = form.result!.grid;
    const piece = form.result!.furniture![pieceKeys(form.result!.furniture).indexOf(f.key!)];
    // A column of the piece under its highest voxel: its top is a floor of the building before.
    const top = piece.cells!.find((v) => Math.floor(v / (g.X * g.Y)) === piece.box[5])!;
    const col = top % (g.X * g.Y);
    const floorsAt = () => {
      const ground = (k as any).groundOf(house, k.ecs.get(house, 'form'), form);
      return [...ground.levels.z.slice(ground.levels.start[col], ground.levels.start[col + 1])];
    };
    expect(floorsAt()).toContain(piece.box[5] + 1);
    standBeside(k, cupboard);
    expect(k.takeThing(cupboard)).toBe('Prendi Credenza.');
    // In hand, as itself, with the seed it had in the building.
    const slot = k.inventory().slots.find((s) => isThing(s?.item))!;
    expect(slot).toMatchObject({ item: 'thing:obj.cupboard', thing: { origin, seed: PIECE_SEED } });
    // Its voxels are gone from the building: the instance has no floor where its top was, and its thing does not come back.
    expect((k.ecs.get(house, 'form') as FormComp).out).toEqual([f.key]);
    expect(floorsAt()).not.toContain(piece.box[5] + 1);
    for (const v of piece.cells!) expect(form.result!.grid.cells[v]).not.toBe(0);
    for (let i = 0; i < 20; i++) k.tick(DT);
    expect(pieces(k).some((id) => comp(k, id).key === f.key)).toBe(false);
    const { ox, oy } = k.offset();
    expect(k.hoverAt(p.x - ox, p.y - oy)).not.toMatchObject({ name: 'Credenza' });
    // Put down outside the house, it looks as it did inside.
    const out = { x: 5.5 + 9.5, y: 5.5 };
    stand(k, out.x - 1.6, out.y, k.groundAt(out.x - 1.6, out.y));
    expect(await k.placeCarried(k.inventory().slots.indexOf(slot), { col: Math.floor(out.x), row: Math.floor(out.y) })).toBe('Posi Credenza.');
    const moved = k.ecs.query('origin').find((e) => k.ecs.get(e, 'origin').key === origin)!;
    expect(k.ecs.has(moved, 'fitted')).toBe(false);
    expect(k.ecs.has(moved, 'glyph')).toBe(true);
    expect(k.ecs.get(moved, 'form').seed).toBe(PIECE_SEED);
    expect(k.saveState()).toBe(true);
    const st = JSON.parse(k.files['world/state.json']);
    expect(st.consumed).toContain(origin);
    const record = readMoved(st.moved).find((r) => r.origin === origin)!;
    expect(record).toBeDefined();
    expect(record.seed ?? (k as any).formFor(k.modules.get('obj.cupboard')!.manifest, origin).seed).toBe(PIECE_SEED);

    const again = await Kernel.boot({ files: { ...k.files }, store: memoryStore(), ai: new MockAiModels() });
    const { house: there } = await putHouse(again);
    expect((again.ecs.get(there, 'form') as FormComp).out).toEqual([f.key]);
    expect(again.ecs.query('fitted').some((id) => comp(again, id).key === f.key)).toBe(false);
    const ones = again.ecs.query('origin').filter((e) => again.ecs.get(e, 'origin').key === origin);
    expect(ones).toHaveLength(1);
    expect(again.ecs.get(ones[0], 'form').seed).toBe(PIECE_SEED);
    expect(again.ecs.has(ones[0], 'glyph')).toBe(true);
  }, 240_000);

  it('something goes down on a piece’s shelf; then the piece is not taken, and its thing says what lies on it', async () => {
    const { k } = await furnishedHouse();
    const chest = pieceOf(k, 'obj.chest')!;
    const f = comp(k, chest);
    standBeside(k, chest);
    const inv = k.inventory();
    inv.slots[0] = { item: 'item.coltello', count: 1 };
    inv.equipped = 0;
    expect(k.actionsFor(chest)).toContainEqual({ id: 'posa', label: 'Posa Coltello qui sopra', enabled: true });
    await k.perform(chest, 'posa');
    const [knife] = k.ecs.query('placed', 'pickup');
    expect(knife).toBeDefined();
    const z = k.ecs.get(knife, 'placed').z;
    expect(z).toBeGreaterThan(f.z);
    expect(z).toBeLessThanOrEqual(f.top + 1e-9);
    expect(overPiece(f, k.ecs.get(chest, 'pos'), k.ecs.get(knife, 'pos').x, k.ecs.get(knife, 'pos').y)).toBe(true);
    expect(k.supportOf(knife)).toBe(chest);
    k.tick(DT);
    expect(k.ecs.get(knife, 'pos').z).toBeCloseTo(z, 6);
    k.openContainer(chest);
    k.container(chest)!.inv.slots.fill(null);
    expect(k.takeThing(chest)).toBe(false);
    expect(k.ecs.alive.has(chest)).toBe(true);
  }, 240_000);
});

describe('in a world whose modules do not wear the seed’s furniture (the Council’s, T514)', () => {
  it('the chest and the sideboard of a house still open, with the kernel’s container; what is put in them stays', async () => {
    const files = Object.fromEntries(Object.entries(furnishedFiles()).filter(([p]) => !/^modules\/(obj\.(chest|cupboard|bed|counter)|object\.crate)\//.test(p)));
    const { k } = await furnishedHouse(files);
    const all = pieces(k);
    expect(all.length).toBeGreaterThan(3);
    expect(all.every((id) => !k.ecs.has(id, 'module'))).toBe(true);
    const chest = all.find((id) => comp(k, id).model === 'furniture')!;
    const bed = all.find((id) => comp(k, id).model === 'letto')!;
    expect(k.nameOf(chest)).toBe('Cassa');
    expect(k.actionsFor(chest).map((a) => a.id)).toEqual(['apri', 'esamina', 'altro']);
    expect(k.actionsFor(bed).map((a) => a.id)).toEqual(['esamina', 'altro']);
    expect(k.container(chest)?.inv.slots.length).toBe(PIECE_STORE);
    const p = k.ecs.get(chest, 'pos');
    standBeside(k, chest);
    const { ox, oy } = k.offset();
    expect(k.hoverAt(p.x - ox, p.y - oy)).toMatchObject({ kind: 'entity', name: 'Cassa', description: 'Arredo — la casa di prova', extra: 'E per aprire' });
    const opened: Array<{ id: number }> = [];
    k.bus.on('ui:container', (e) => opened.push(e));
    await k.perform(chest, 'apri');
    expect(opened.map((e) => e.id)).toEqual([chest]);
    const box = k.container(chest)!;
    box.inv.slots.fill(null);
    k.inventory().slots[0] = { item: 'item.coltello', count: 1 };
    k.putIntoContainer(chest, 0);
    const origin = k.ecs.get(chest, 'origin').key;
    expect(k.saveState()).toBe(true);
    const again = await Kernel.boot({ files: { ...k.files }, store: memoryStore(), ai: new MockAiModels() });
    await putHouse(again);
    const back = again.ecs.query('origin').find((e) => again.ecs.get(e, 'origin').key === origin)!;
    expect(countItem(again.container(back)!.inv, 'item.coltello')).toBe(1);
    // Not a thing one takes: no module says it.
    expect(k.actionsFor(chest).map((a) => a.id)).not.toContain('prendi');
    expect(k.takeThing(chest)).toBe(false);
  }, 240_000);
});

describe('in a game of many (T514)', () => {
  it('a client gets the pieces as the other things, opens a chest through the world and sees the building without what was taken', async () => {
    const k = await Kernel.boot({ files: furnishedFiles({ game: { mode: 'multiplayer', death: 3 } }), store: memoryStore(), ai: new MockAiModels() });
    const server = new SessionServer(k);
    const heard: ServerMsg[] = [];
    const { server: s, client: c } = fakeLink();
    c.onMessage((m) => heard.push(m));
    server.connect(s);
    const session = new SessionClient(c, { id: 'anna' });
    await session.ready;
    const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    const thin = new ThinClient(mirror, session);
    const frames = async (n: number) => {
      for (let i = 0; i < n; i++) {
        mirror.tick(DT);
        thin.frame(DT);
        server.tick(DT);
        await pause(0);
      }
    };
    await frames(10);
    const at = k.as('anna', () => k.wandererCarpet());
    const { house } = await putHouse(k, Math.floor(at.x) + 0.5, Math.floor(at.y) + 4.5);
    await mirror.forms.settled(HOUSE, 1);
    await frames(20);
    const chest = pieces(k).find((id) => k.ecs.get(id, 'module')?.id === 'obj.chest')!;
    const cp = k.ecs.get(chest, 'pos');
    // On the wire: the module, the body, the container's size, what the piece is and where; never who it is, nor a glyph.
    const views = heard.flatMap((m) => (m.t === 'update' || m.t === 'welcome' ? (m.entities ?? []) : [])).filter((e) => (e.c as { fitted?: unknown } | undefined)?.fitted);
    expect(views.length).toBeGreaterThanOrEqual(pieces(k).length);
    for (const v of views) {
      expect(v.glyph).toBeUndefined();
      expect(Object.keys(v.c!.fitted as object).sort()).toEqual(['hx', 'hy', 'model', 'name', 'top', 'yaw', 'z']);
    }
    expect(JSON.stringify(heard)).not.toContain(pieceOrigin(ORIGIN, ''));
    const mine = mirror.ecs.query('fitted', 'pos').find((e) => Math.hypot(mirror.ecs.get(e, 'pos').x - cp.x, mirror.ecs.get(e, 'pos').y - cp.y) < 0.01)!;
    expect(mine).toBeDefined();
    expect(mirror.ecs.get(mine, 'module').id).toBe('obj.chest');
    expect(mirror.ecs.has(mine, 'glyph')).toBe(false);
    mirror.tick(DT);
    expect(mirror.ecs.get(mine, 'pos').z).toBe(comp(k, chest).z);
    // The menu of the client finds it from beside it, as alone.
    const spot = beside(k, chest);
    k.as('anna', () => stand(k, spot.x, spot.y, spot.z));
    stand(mirror, spot.x, spot.y, spot.z);
    mirror.wandererComp().facing = spot.facing;
    expect(mirror.targetInFront()).toBe(mine);
    expect(mirror.actionsFor(mine).map((a) => a.id)).toEqual(expect.arrayContaining(['apri', 'prendi']));
    // Opened through the world: the world fills it.
    const opening = mirror.perform(mine, 'apri');
    await frames(20);
    await opening;
    expect(k.container(chest)!.filled).toBe(true);
    // Emptied and taken: the client's building has the piece out, and the piece is gone from the client.
    k.container(chest)!.inv.slots.fill(null);
    const key = comp(k, chest).key!;
    const taking = mirror.perform(mine, 'prendi');
    await frames(30);
    await taking;
    expect(k.ecs.alive.has(chest)).toBe(false);
    expect((k.ecs.get(house, 'form') as FormComp).out).toEqual([key]);
    const theirs = mirror.ecs.query('form', 'pos').find((e) => (mirror.ecs.get(e, 'form') as FormComp).model === HOUSE)!;
    expect((mirror.ecs.get(theirs, 'form') as FormComp).out).toEqual([key]);
    expect(mirror.ecs.alive.has(mine)).toBe(false);
  }, 240_000);
});
