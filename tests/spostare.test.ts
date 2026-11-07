// T292 (ADR-0168): taking furniture and putting it down elsewhere. Some things of the world say `takeable`: taken, they are an item
// of the inventory (`thing:<module>`) with who they are and their state; put down, they come back as themselves where they were put,
// if the ground holds them, nothing is there, they are not in front of a door and the place stays whole (rule 10, ADR-0064); the save
// keeps them there, and the place they were born in no longer makes them. In a game of many the world is the server's: what one takes
// is gone for the others, two cannot take the same thing.

import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { assembleManifest, TAKEABLE_CLASSES, type Concept, type PhysicsSpec } from '../src/kernel/agents/forge';
import { bundledFiles } from '../src/kernel/bundle';
import { Content } from '../src/kernel/content';
import { metaBreak } from '../src/kernel/fourthwall';
import { InlineRunner, runForm, type FormComp, type FormRequest, type FormResult, type FormRunner } from '../src/kernel/forms';
import { countItem, shownInventory, type Inventory } from '../src/kernel/inventory';
import { Kernel, PUT_DOWN } from '../src/kernel/kernel';
import {
  facingYaw,
  isThing,
  KERNEL_PARTS,
  MAX_THING_PARTS,
  putRefusal,
  readMoved,
  readParts,
  readThing,
  splits,
  takeRefusal,
  thingItem,
  thingModule,
  thingWeight,
  walkGroups,
  type PutFailure,
  type TakeFailure,
  type TileArea,
  type Walk,
} from '../src/kernel/moving';
import { memoryStore } from '../src/kernel/repo';
import { Validator } from '../src/kernel/validator';
import { Sandbox } from '../src/kernel/sandbox';
import type { ModuleEntry } from '../src/kernel/types';
import { boxOf, handsOf, OVERHEAD, overheadPose, overheadTurn, raisedHand } from '../src/mj/hold';
import { colorTable } from '../src/mj/mesh';
import { Wanderer } from '../src/render/entities';
import { formMeshes } from '../src/render/formmeshes';
import { boxFor, heldBy, heldSeedOf } from '../src/render/held';
import { geoOf } from '../src/render/models';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionClient } from '../src/session/client';
import { LIMITS, SessionServer } from '../src/session/server';
import { ThinClient } from '../src/session/thin';
import { playerFiles } from '../src/session/files';
import { boot, DT, run } from './world';
import { fakeHost } from './helpers';
import { closeWorld, newLasting, open, pause } from './espressivita/banco';

// --- The thing, the item, what follows it ---------------------------------------------------------------------------------------

describe('the item of a thing carried, and what follows it', () => {
  it('a thing of the world is the item thing:<module>, and nothing else is', () => {
    expect(thingItem('obj.cupboard')).toBe('thing:obj.cupboard');
    expect(thingModule('thing:obj.cupboard')).toBe('obj.cupboard');
    for (const v of ['item.coltello', 'rune:x', 'thing:', '', null, undefined, 5, {}, 'thing:' + 'x'.repeat(200)]) expect(thingModule(v), String(v)).toBeUndefined();
    expect(isThing('thing:obj.bed')).toBe(true);
    expect(isThing('item.letto')).toBe(false);
  });

  it('its state is its components that are not the kernel’s, plain data, not too much of it', () => {
    const parts = readParts({ pos: { x: 1, y: 2 }, body: { r: 1 }, form: { model: 'x' }, container: { inv: {} }, origin: { key: 'o' }, light: { lit: true, radius: 3 }, mio_stato: { n: 4 }, fn: () => 1, nulla: null });
    expect(parts).toEqual({ light: { lit: true, radius: 3 }, mio_stato: { n: 4 } });
    for (const k of ['pos', 'module', 'body', 'form', 'container', 'origin', 'chunk', 'placed', 'pickup', 'player', 'remote', 'identity', 'mind']) expect(KERNEL_PARTS.has(k), k).toBe(true);
    expect(readParts({ big: { text: 'x'.repeat(MAX_THING_PARTS) } })).toBeUndefined();
    expect(readParts(JSON.parse('{"__proto__": {"x": 1}, "ok": {"y": 2}}'))).toEqual({ ok: { y: 2 } });
    expect(readParts({ 'a b': {}, '1x': {} })).toBeUndefined();
    for (const v of [null, 5, 'x', [], undefined]) expect(readParts(v)).toBeUndefined();
  });

  it('a carried thing and a moved one are read from a file without trusting it', () => {
    expect(readThing({ origin: '0,0#o3', seed: 2, parts: { light: { lit: false } } })).toEqual({ origin: '0,0#o3', seed: 2, parts: { light: { lit: false } } });
    expect(readThing({ origin: '0,0#o3', seed: 1.5 })).toEqual({ origin: '0,0#o3' });
    for (const v of [null, {}, { origin: '' }, { origin: 5 }, { origin: 'x'.repeat(500) }, []]) expect(readThing(v), JSON.stringify(v)).toBeUndefined();
    const list = [null, 7, { module: 'obj.bed', origin: 'a', x: 'qui', y: 0 }, { module: 'obj.bed', origin: 'b', x: 1e9, y: 0 }, { module: '', origin: 'c', x: 1, y: 1 }, { module: 'obj.bed', origin: 'd', x: 1.5, y: 2.5, yaw: 'su' }, { module: 'obj.chest', origin: 'd', x: 3.5, y: 4.5, yaw: 1, parts: { pos: {}, luce: { on: 1 } } }];
    expect(readMoved(list)).toEqual([{ module: 'obj.chest', origin: 'd', x: 3.5, y: 4.5, yaw: 1, parts: { luce: { on: 1 } } }]);
    expect(readMoved('no')).toEqual([]);
  });

  it('it weighs half its mass, between 2 and 20; 10 when the manifest does not say', () => {
    expect(thingWeight(undefined)).toBe(10);
    expect(thingWeight(40)).toBe(20);
    expect(thingWeight(100)).toBe(20);
    expect(thingWeight(1)).toBe(2);
    expect(thingWeight(NaN)).toBe(10);
  });

  it('what is put down faces who put it down, in quarter turns', () => {
    // The front of a model turned by yaw looks toward (sin yaw, cos yaw).
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.9, 0.3], [-0.2, -2]]) {
      const yaw = facingYaw(dx, dy);
      expect(Math.abs(yaw / (Math.PI / 2) - Math.round(yaw / (Math.PI / 2)))).toBeLessThan(1e-9);
      const front = [Math.sin(yaw), Math.cos(yaw)];
      expect(front[0] * dx + front[1] * dy).toBeGreaterThan(0);
    }
    expect(facingYaw(0, 0)).toBe(0);
  });

  it('the words of the world say why, with no word of the game', () => {
    const take: TakeFailure[] = ['fixed', 'nowhere', 'far', 'full', 'on-top', 'someone', 'no-room'];
    const put: PutFailure[] = ['nothing', 'nowhere', 'down', 'far', 'ground', 'taken', 'you', 'someone', 'lying', 'rune', 'door', 'split'];
    const said = [...take.map((w) => takeRefusal(w, 'Credenza')), ...put.map((w) => putRefusal(w, 'Credenza'))];
    expect(new Set(said).size).toBe(said.length);
    for (const s of said) {
      expect(metaBreak(s), s).toBeFalsy();
      expect(s, s).not.toMatch(/casell|connes|articolaz|tile|chunk|entit|modul|inventario|slot/i);
    }
  });
});

// --- The place stays whole, on worlds by hand ---------------------------------------------------------------------------------

/** A world of tiles by hand: `#` walls, `.` floor; `x` where something is put down. */
function grid(rows: string[]): { area: TileArea; walk: (extra?: Set<string>) => Walk } {
  const area: TileArea = { col: 0, row: 0, cols: rows[0].length, rows: rows.length };
  const walk = (extra = new Set<string>()): Walk => ({
    passable: (c, r) => rows[r]?.[c] !== undefined && rows[r][c] !== '#' && !extra.has(`${c},${r}`),
    step: () => true,
  });
  return { area, walk };
}

describe('the place stays whole', () => {
  it('a corridor one tile wide is cut by what stands in it; two tiles wide, it is not', () => {
    const narrow = grid(['#######', '#.....#', '###.###', '#.....#', '#######']);
    expect(splits(narrow.area, narrow.walk(), narrow.walk(new Set(['3,2'])))).toBe(true);
    expect(splits(narrow.area, narrow.walk(), narrow.walk(new Set(['1,1'])))).toBe(false);
    const wide = grid(['########', '#......#', '###..###', '#......#', '########']);
    expect(splits(wide.area, wide.walk(), wide.walk(new Set(['3,2'])))).toBe(false);
    expect(splits(wide.area, wide.walk(), wide.walk(new Set(['3,2', '4,2'])))).toBe(true);
  });

  it('a room with one door: the tile in front of it closes the room, a corner of it does not', () => {
    const room = grid(['#######', '#.....#', '#.....#', '###.###', '#.....#', '#######']);
    expect(splits(room.area, room.walk(), room.walk(new Set(['3,3'])))).toBe(true);
    expect(splits(room.area, room.walk(), room.walk(new Set(['1,1'])))).toBe(false);
    expect(splits(room.area, room.walk(), room.walk(new Set(['3,4'])))).toBe(true);
  });

  it('what was already cut off stays so: only what was joined counts, and a pocket filled whole is no split', () => {
    const two = grid(['#####', '#.#.#', '#####']);
    expect(splits(two.area, two.walk(), two.walk(new Set(['1,1'])))).toBe(false);
    const groups = walkGroups(two.area, two.walk());
    expect(groups[1 + 1 * 5]).not.toBe(groups[3 + 1 * 5]);
  });

  it('a step that goes only one way does not join (one steps down from there, never back up)', () => {
    const rows = ['....'];
    const area: TileArea = { col: 0, row: 0, cols: 4, rows: 1 };
    const walk: Walk = { passable: () => true, step: (c, _r, nc) => !(c === 1 && nc === 2) };
    const g = walkGroups(area, walk);
    expect(g[0]).toBe(g[1]);
    expect(g[1]).not.toBe(g[2]);
    expect(rows[0].length).toBe(4);
  });
});

// --- The kernel ---------------------------------------------------------------------------------------------------------------

/** Waits for the forms of entities, then a tick: the solids index them. */
async function settleForms(k: Kernel, ids: number[]): Promise<void> {
  for (const id of ids) {
    const fc: FormComp | undefined = k.ecs.get(id, 'form');
    if (fc) await k.forms.wait(fc.model, fc.seed, fc.tint);
  }
  run(k, 0.1);
}

/** A run of free tiles of the ground around the wanderer acting, out of every lot: they stand at its middle, facing right. */
function openGround(k: Kernel, half = 3): { col: number; row: number } {
  const ok = (c: number, r: number) => k.tileAt(c, r) !== undefined && !k.lotAt(c + 0.5, r + 0.5) && k.free(c + 0.5, r + 0.5, 0.45) && !k.runeTiles.has(`${c},${r}`) && !k.palette[k.tileAt(c, r)!]?.solid;
  for (let d = 0; d < 40; d++)
    for (const row of [d, -d])
      for (let col = -30; col < 30; col++) {
        let good = true;
        for (let dr = -half; dr <= half && good; dr++) for (let dc = -half; dc <= half && good; dc++) good = ok(col + dc, row + dr);
        if (!good) continue;
        stand(k, { x: col + 0.5, y: row + 0.5 });
        k.wandererComp().facing = 'right';
        for (const id of k.ecs.query('pickup', 'pos')) {
          const p = k.ecs.get(id, 'pos');
          if (Math.abs(p.x - (col + 0.5)) < half + 2 && Math.abs(p.y - (row + 0.5)) < half + 2) k.ecs.destroy(id);
        }
        for (const id of k.ecs.query('mind', 'pos')) {
          const p = k.ecs.get(id, 'pos');
          if (Math.abs(p.x - (col + 0.5)) < half + 3 && Math.abs(p.y - (row + 0.5)) < half + 3) k.ecs.destroy(id);
        }
        return { col, row };
      }
  throw new Error('nessun tratto libero');
}

/** Puts the wanderer acting where the world has them at (x, y), on the ground. */
function stand(k: Kernel, to: { x: number; y: number }): void {
  const p = k.wandererPos();
  Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  delete p.z;
}

const carriedSlot = (k: Kernel) => k.inventory().slots.findIndex((s) => isThing(s?.item));
const byOrigin = (k: Kernel, origin: string) => k.ecs.query('origin').find((id) => k.ecs.get(id, 'origin').key === origin);

describe('taking a thing and putting it down', () => {
  let k: Kernel;
  const said: string[] = [];
  beforeAll(async () => {
    k = await boot();
    k.bus.on('ui:message', (m) => said.push(String(m.text)));
  }, 120_000);

  const fresh = () => {
    for (const id of k.ecs.query('module', 'pos', 'form')) if (!k.ecs.has(id, 'player') && !k.ecs.has(id, 'carpet') && (!k.ecs.has(id, 'origin') || String(k.ecs.get(id, 'origin').key).includes('@'))) k.ecs.destroy(id);
    for (const id of k.ecs.query('placed')) k.ecs.destroy(id);
    const inv = k.inventory();
    inv.slots.forEach((_, i) => (inv.slots[i] = null));
    inv.equipped = null;
    return openGround(k);
  };

  it('a cupboard is taken into the hand, as itself; a well, a sign, a person are not', async () => {
    const at = fresh();
    const cupboard = k.spawnModuleEntity(k.modules.get('obj.cupboard')!, at.col + 1.5, at.row + 0.5);
    const well = k.spawnModuleEntity(k.modules.get('object.well')!, at.col - 1.5, at.row + 0.5);
    await settleForms(k, [cupboard, well]);
    expect(k.actionsFor(cupboard)).toContainEqual({ id: 'prendi', label: 'Prendi', enabled: true });
    expect(k.actionsFor(well).map((o) => o.id)).not.toContain('prendi');
    expect(k.takeThing(well)).toBe(false);
    expect(said.at(-1)).toBe('Pozzo non si può portare via.');
    const fc: FormComp = k.ecs.get(cupboard, 'form');
    // Opened and emptied first: a chest with something in it is not taken.
    const box = k.openContainer(cupboard)!;
    if (box.inv.slots.some(Boolean)) {
      expect(k.takeThing(cupboard)).toBe(false);
      expect(said.at(-1)).toBe("Dentro Credenza c'è ancora qualcosa: toglilo prima.");
      box.inv.slots.forEach((_, i) => (box.inv.slots[i] = null));
    }
    await k.perform(cupboard, 'prendi');
    expect(k.ecs.alive.has(cupboard)).toBe(false);
    expect(said.at(-1)).toBe('Prendi Credenza.');
    const i = carriedSlot(k);
    const s = k.inventory().slots[i]!;
    expect(s.item).toBe('thing:obj.cupboard');
    expect(k.inventory().equipped).toBe(i);
    expect(s.thing?.origin).toMatch(/^obj\.cupboard@/);
    expect(s.thing?.seed).toBe(fc.seed);
    // As an item: its name, its look (its own model, the seed it had), carried in hand.
    const info = k.itemInfo(s.item);
    expect(info.name).toBe('Credenza');
    expect(info.spec.equippable).toBe(true);
    expect(info.spec.stackable).toBe(false);
    const look = k.itemLook(s.item, s.thing?.seed);
    expect([look.model, look.seed]).toEqual([fc.model, fc.seed]);
    expect(k.content.items.has(s.item)).toBe(false);
    expect(k.content.byName('Credenza')).toBeUndefined();
  });

  it('it goes down in front, as itself, facing who put it down; the hand is empty again', async () => {
    const i = carriedSlot(k);
    const origin = k.inventory().slots[i]!.thing!.origin;
    const c = k.wandererCarpet();
    k.wandererComp().facing = 'right';
    await k.placeCarried(i);
    expect(said.at(-1)).toBe('Posi Credenza.');
    expect(carriedSlot(k)).toBe(-1);
    expect(k.inventory().equipped).toBe(null);
    const back = byOrigin(k, origin)!;
    expect(back).toBeDefined();
    expect(k.ecs.get(back, 'module').id).toBe('obj.cupboard');
    const p = k.ecs.get(back, 'pos');
    expect([p.x, p.y]).toEqual([Math.floor(c.x + 1.2) + 0.5, Math.floor(c.y) + 0.5]);
    // Its front toward the wanderer.
    const yaw = k.ecs.get(back, 'form').yaw;
    expect(Math.sin(yaw)).toBeCloseTo(-1, 6);
    // Its container as it was left: empty, and it does not fill again.
    expect(k.openContainer(back)!.inv.slots.every((x) => !x)).toBe(true);
    expect(k.ecs.get(back, 'container').filled).toBe(true);
    // Solid where it stands, at once (no tick in between).
    expect(k.free(p.x, p.y, 0.2)).toBe(false);
  });
});

describe('where it goes down, and where not (rule 10)', () => {
  let k: Kernel;
  const said: string[] = [];
  beforeAll(async () => {
    k = await boot();
    k.bus.on('ui:message', (m) => said.push(String(m.text)));
  }, 120_000);

  /** A cupboard carried, empty, its form ready: as if taken a moment ago. */
  async function carrying(module = 'obj.cupboard'): Promise<number> {
    const inv = k.inventory();
    inv.slots.forEach((_, i) => (inv.slots[i] = null));
    const fc = k.itemLook(thingItem(module));
    await k.forms.wait(fc.model, fc.seed, fc.tint);
    inv.slots[0] = { item: thingItem(module), count: 1 };
    inv.equipped = 0;
    return 0;
  }

  const putAt = (col: number, row: number) => k.placeCarried(k.inventory().equipped!, { col, row });
  const cleared = () => {
    for (const id of k.ecs.query('module', 'pos', 'form')) if (!k.ecs.has(id, 'player') && !k.ecs.has(id, 'carpet') && String(k.ecs.get(id, 'origin')?.key ?? '@').includes('@')) k.ecs.destroy(id);
    for (const id of k.ecs.query('placed')) k.ecs.destroy(id);
    run(k, 0.05);
  };

  it('not on water, a wall, another thing, the wanderer, someone, something lying, a rune; not too far, not from a floor above', async () => {
    cleared();
    const at = openGround(k, 4);
    await carrying();
    const { col, row } = at;
    // Water and a wall.
    k.setTile(col + 2, row, 'w');
    expect(await putAt(col + 2, row)).toBe(false);
    expect(said.at(-1)).toBe('Lì il terreno non regge Credenza.');
    k.setTile(col + 2, row, 'h');
    expect(await putAt(col + 2, row)).toBe(false);
    expect(said.at(-1)).toBe('Lì Credenza non ci sta.');
    k.setTile(col + 2, row, 'g');
    // Another thing standing there.
    const chest = k.spawnModuleEntity(k.modules.get('obj.chest')!, col + 0.5, row + 2.5);
    await settleForms(k, [chest]);
    expect(await putAt(col, row + 2)).toBe(false);
    expect(said.at(-1)).toBe('Lì Credenza non ci sta.');
    k.ecs.destroy(chest);
    run(k, 0.05);
    // The wanderer, someone, something lying, a rune.
    expect(await putAt(col, row)).toBe(false);
    expect(said.at(-1)).toBe('Ci sei tu in mezzo: fai un passo indietro.');
    const who = k.ecs.spawn({ pos: { x: col + 0.5, y: row - 1.5 }, body: { r: 0.3, solid: false }, identity: { name: 'Tobia' }, glyph: { ch: 'T', color: '#fff' } });
    expect(await putAt(col, row - 2)).toBe(false);
    expect(said.at(-1)).toBe("C'è qualcuno in mezzo.");
    k.ecs.destroy(who);
    const apple = k.spawnItem('item.mela-rossa', col - 1.5, row + 0.5);
    expect(await putAt(col - 2, row)).toBe(false);
    expect(said.at(-1)).toBe("Lì c'è qualcosa a terra: raccoglilo prima.");
    k.ecs.destroy(apple);
    k.ecs.spawn({ rune: { token: 'x', col: col + 1, row: row + 1, source: 'gen', origin: 'prova' } });
    (k as unknown as { runesDirty: boolean }).runesDirty = true;
    run(k, 0.05);
    expect(await putAt(col + 1, row + 1)).toBe(false);
    expect(said.at(-1)).toBe("Lì c'è una runa nel terreno.");
    // Too far; and from a floor above (the feet over the ground).
    expect(await putAt(col + 4, row)).toBe(false);
    expect(said.at(-1)).toBe('È troppo lontano: avvicinati.');
    k.wandererPos().z = k.groundAt(col + 0.5, row + 0.5) + 1;
    expect(await putAt(col + 2, row)).toBe(false);
    expect(said.at(-1)).toBe('Scendi a terra per posare Credenza.');
    delete k.wandererPos().z;
    // Nothing of that: it goes.
    expect(await putAt(col + 2, row)).toBe('Posi Credenza.');
    expect(carriedSlot(k)).toBe(-1);
  });

  it('not in front of a door, nor in a passage it would close; in a corner it goes, and the place stays whole after every one', async () => {
    cleared();
    const at = openGround(k, 6);
    const { col, row } = at;
    // A room of walls, 5 × 3 inside, with one opening in its south wall at (col, row + 2): a door at first.
    const x0 = col - 3, x1 = col + 3, y0 = row - 2, y1 = row + 2;
    for (let c = x0; c <= x1; c++) for (const r of [y0, y1]) k.setTile(c, r, 'h');
    for (let r = y0; r <= y1; r++) for (const c of [x0, x1]) k.setTile(c, r, 'h');
    k.setTile(col, y1, 'd');
    run(k, 0.05);
    // The wanderer inside, in the middle of the room.
    stand(k, { x: col + 0.5, y: row + 0.5 });
    await carrying();
    expect(await putAt(col, y1)).toBe(false);
    expect(said.at(-1)).toBe('Davanti a una porta Credenza chiuderebbe il passaggio.');
    expect(await putAt(col, y1 - 1)).toBe(false);
    expect(said.at(-1)).toBe('Davanti a una porta Credenza chiuderebbe il passaggio.');
    // Without the door, the opening is still the only way: what stands in it, or in front of it, cuts the room off.
    k.setTile(col, y1, 'g');
    run(k, 0.05);
    stand(k, { x: col + 0.5, y: y1 + 1.5 });
    expect(await putAt(col, y1)).toBe(false);
    expect(said.at(-1)).toBe('Lì Credenza chiuderebbe il passaggio.');
    stand(k, { x: col - 1.5, y: row + 0.5 });
    expect(await putAt(col, y1 - 1)).toBe(false);
    expect(said.at(-1)).toBe('Lì Credenza chiuderebbe il passaggio.');
    // Every other tile of the room, one cupboard after the other, from where the wanderer can reach it: whatever goes, the place
    // stays whole (an oracle of its own: the free tiles a body walks between, four ways).
    const area = { col: col - 8, row: row - 8, cols: 17, rows: 17 };
    const oracle = (): Int32Array => walkGroups(area, { passable: (c, r) => k.tileAt(c, r) !== undefined && k.free(c + 0.5, r + 0.5, 0.35), step: () => true });
    let put = 0;
    let refused = 0;
    for (let r = y0 + 1; r <= y1 - 1; r++)
      for (let c = x0 + 1; c <= x1 - 1; c++) {
        // The wanderer on a free tile of the room near the target, not on it.
        const spot = [[c, r + 1], [c, r - 1], [c - 1, r], [c + 1, r], [c - 1, r + 1], [c + 1, r + 1]].find(([sc, sr]) => sc > x0 && sc < x1 && sr > y0 && sr < y1 + 2 && k.free(sc + 0.5, sr + 0.5, 0.3));
        if (!spot) continue;
        stand(k, { x: spot[0] + 0.5, y: spot[1] + 0.5 });
        await carrying();
        const before = oracle();
        const ok = await putAt(c, r);
        run(k, 0.02);
        if (!ok) {
          refused++;
          expect(said.at(-1), `${c},${r}`).toMatch(/chiuderebbe il passaggio|Ci sei tu|non ci sta/);
          continue;
        }
        put++;
        const after = oracle();
        // Whatever was joined is joined still, but where the cupboard stands.
        const joined = new Map<number, number>();
        for (let i = 0; i < before.length; i++) {
          if (before[i] < 0 || after[i] < 0) continue;
          if (!joined.has(before[i])) joined.set(before[i], after[i]);
          expect(joined.get(before[i]), `dopo ${c},${r}`).toBe(after[i]);
        }
      }
    expect(put).toBeGreaterThanOrEqual(3);
    expect(refused).toBeGreaterThanOrEqual(1);
  }, 60_000);
});

describe('what is not taken, and what follows the thing', () => {
  let k: Kernel;
  const said: string[] = [];
  beforeAll(async () => {
    k = await boot();
    k.bus.on('ui:message', (m) => said.push(String(m.text)));
  }, 120_000);

  it('a full chest, something lying on it, someone standing on it, no room, too far: it stays where it is', async () => {
    const at = openGround(k, 4);
    const inv = k.inventory();
    inv.slots.forEach((_, i) => (inv.slots[i] = null));
    inv.equipped = null;
    const chest = k.spawnModuleEntity(k.modules.get('obj.chest')!, at.col + 1.5, at.row + 0.5);
    await settleForms(k, [chest]);
    // Never opened: taking it fills it as opening it would, and the same things are in it after.
    const box = k.container(chest)!;
    box.inv.slots[0] = { item: 'item.mela-rossa', count: 2 };
    box.filled = true;
    expect(k.takeThing(chest)).toBe(false);
    expect(said.at(-1)).toBe("Dentro Cassapanca c'è ancora qualcosa: toglilo prima.");
    k.takeFromContainer(chest, 0);
    expect(countItem(inv, 'item.mela-rossa')).toBe(2);
    // A knife lying on its lid.
    inv.slots[5] = { item: 'item.coltello', count: 1 };
    inv.equipped = 5;
    expect(await k.placeOn(chest)).toBeTruthy();
    expect(k.takeThing(chest)).toBe(false);
    expect(said.at(-1)).toBe("Sopra Cassapanca c'è ancora qualcosa: toglilo prima.");
    const [knife] = k.ecs.query('placed', 'pickup');
    await k.perform(knife, 'raccogli');
    // Someone standing on it.
    const fc: FormComp = k.ecs.get(chest, 'form');
    const f = k.forms.ready(fc.model, fc.seed, fc.tint)!;
    const cp = k.ecs.get(chest, 'pos');
    const g = f.result!.grid;
    const colors = colorTable(g.alphabet, f.result!.palette);
    let top = 0;
    for (let z = 0; z < g.Z; z++) if (colors[g.cells[Math.floor(g.X / 2) + Math.floor(g.Y / 2) * g.X + z * g.X * g.Y]]) top = z + 1;
    const who = k.ecs.spawn({ pos: { x: cp.x, y: cp.y, z: k.groundAt(cp.x, cp.y) + top / f.vpt }, body: { r: 0.3, solid: false }, identity: { name: 'Tobia' } });
    run(k, 0.05);
    expect(k.takeThing(chest)).toBe(false);
    expect(said.at(-1)).toBe("Sopra Cassapanca c'è qualcuno.");
    k.ecs.destroy(who);
    // No room, then too far.
    const before = inv.slots.map((s) => s);
    inv.slots.forEach((s, i) => (inv.slots[i] = s ?? { item: 'item.ciocco', count: 1 }));
    expect(k.takeThing(chest)).toBe(false);
    expect(said.at(-1)).toBe('Non hai posto per Cassapanca.');
    before.forEach((s, i) => (inv.slots[i] = s));
    stand(k, { x: cp.x + 4, y: cp.y });
    expect(k.takeThing(chest)).toBe(false);
    expect(said.at(-1)).toBe('Avvicinati a Cassapanca.');
    stand(k, { x: cp.x - 1.2, y: cp.y });
    expect(k.takeThing(chest)).toBe('Prendi Cassapanca.');
  });

  it('its state follows it: its own components, its container as it was left, who it is; the kernel’s are made again', async () => {
    const at = openGround(k, 4);
    const inv = k.inventory();
    inv.slots.forEach((_, i) => (inv.slots[i] = null));
    inv.equipped = null;
    const bench = k.spawnModuleEntity(k.modules.get('obj.counter')!, at.col + 1.5, at.row + 0.5);
    await settleForms(k, [bench]);
    // State as Lua writes it: a component of its own, and a light lit.
    k.ecs.set(bench, 'attrezzi', { affilati: 3, ultimo: 'pialla' });
    k.ecs.set(bench, 'light', { radius: 2, lit: true });
    const box = k.openContainer(bench)!;
    box.inv.slots.forEach((_, i) => (box.inv.slots[i] = null));
    expect(k.takeThing(bench)).toBe('Prendi Banco da lavoro.');
    const slot = k.inventory().slots[carriedSlot(k)]!;
    expect(slot.thing?.parts).toEqual({ attrezzi: { affilati: 3, ultimo: 'pialla' }, light: { radius: 2, lit: true } });
    // It moves with the slot inside the inventory, never into a bag or a chest; and goes whole to who it is given.
    k.inventory().slots[20] = { item: 'item.borsa-rune', count: 1 };
    k.putIntoBag(20, carriedSlot(k));
    expect(said.at(-1)).toMatch(/^Banco da lavoro non ci va, in /);
    expect(k.bagAccepts(20, slot.item)).toBe(false);
    k.putIntoContainer(k.ecs.query('container').find((id) => id !== bench)!, carriedSlot(k));
    expect(said.at(-1)).toMatch(/^Banco da lavoro non ci va, in /);
    expect(carriedSlot(k)).toBeGreaterThanOrEqual(0);
    k.moveSlot(carriedSlot(k), 10);
    expect(k.inventory().slots[10]?.thing?.parts?.attrezzi).toEqual({ affilati: 3, ultimo: 'pialla' });
    k.inventory().equipped = 10;
    await k.placeCarried(10, { col: at.col + 2, row: at.row });
    const back = byOrigin(k, slot.thing!.origin)!;
    expect(k.ecs.get(back, 'attrezzi')).toEqual({ affilati: 3, ultimo: 'pialla' });
    expect(k.ecs.get(back, 'light')).toEqual({ radius: 2, lit: true });
    expect(k.ecs.get(back, 'body')).toMatchObject({ solid: true });
    expect(k.ecs.get(back, 'container').filled).toBe(true);
    expect(k.container(back)!.inv.slots.every((s) => !s)).toBe(true);
  });

  it('dropped from the inventory or put down with F it goes in front; another thing in hand puts nothing down on a tile', async () => {
    const at = openGround(k, 4);
    const inv = k.inventory();
    inv.slots.forEach((_, i) => (inv.slots[i] = null));
    const crate = k.spawnModuleEntity(k.modules.get('object.crate')!, at.col + 1.5, at.row + 0.5);
    await settleForms(k, [crate]);
    expect(k.takeThing(crate)).toBe('Prendi Cassa di legno.');
    const origin = k.inventory().slots[carriedSlot(k)]!.thing!.origin;
    // The menu of the tile in front offers to put it down there, and nothing to put it on a shelf.
    const menu = k.tileMenu(at.col + 1, at.row);
    expect(menu.options[0]).toEqual({ id: `t:${PUT_DOWN}`, label: 'Posa Cassa di legno qui', enabled: true });
    k.dropSlot(carriedSlot(k));
    await pause(0);
    expect(said.at(-1)).toBe('Posi Cassa di legno.');
    const again = byOrigin(k, origin)!;
    expect(again).toBeDefined();
    expect(k.takeThing(again)).toBe('Prendi Cassa di legno.');
    k.wandererComp().facing = 'down';
    k.action();
    await pause(0);
    expect(said.at(-1)).toBe('Posi Cassa di legno.');
    const c = k.wandererCarpet();
    const p = k.ecs.get(byOrigin(k, origin)!, 'pos');
    expect([p.x, p.y]).toEqual([Math.floor(c.x) + 0.5, Math.floor(c.y + 1.2) + 0.5]);
    // A knife in hand: nothing to put down on a tile.
    inv.slots[0] = { item: 'item.coltello', count: 1 };
    inv.equipped = 0;
    expect(k.tileMenu(at.col - 1, at.row).options.map((o) => o.id)).not.toContain(`t:${PUT_DOWN}`);
    await k.performMenu(`t:${PUT_DOWN}`, -1, at.col - 1, at.row);
    expect(said.at(-1)).toBe('Non porti niente da posare.');
  });
});

/** A free point of the ground beside a thing, out of every lot, a little more than a tile from its middle. */
function beside(k: Kernel, id: number): { x: number; y: number } {
  const c = k.ecs.get(id, 'pos');
  for (const d of [1.1, 1.2, 1.3, 1.5])
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const x = c.x + dx * d, y = c.y + dy * d;
      if (k.free(x, y, 0.3) && !k.lotAt(x, y) && k.tileAt(Math.floor(x), Math.floor(y)) !== undefined) return { x, y };
    }
  throw new Error('nessun posto libero accanto');
}

/** A takeable thing a place of the world made, in the open, near the start. */
function placeThing(k: Kernel): number {
  const id = k.ecs.query('module', 'origin', 'chunk').find((e) => {
    const c = k.ecs.get(e, 'pos');
    return k.modules.get(k.ecs.get(e, 'module').id)?.manifest.takeable === true && !k.lotAt(c.x, c.y) && Math.hypot(c.x, c.y) < 40 && String(k.ecs.get(e, 'origin').key).includes('#o');
  });
  expect(id).toBeDefined();
  return id!;
}

/** Takes a thing of a place: beside it, emptied. */
async function takeIt(k: Kernel, id: number): Promise<string> {
  stand(k, beside(k, id));
  await settleForms(k, [id]);
  const box = k.container(id);
  if (box) {
    k.openContainer(id);
    box.inv.slots.forEach((_, i) => (box.inv.slots[i] = null));
  }
  const origin = k.ecs.get(id, 'origin').key;
  expect(k.takeThing(id)).toMatch(/^Prendi /);
  return origin;
}

describe('saved, and opened again', () => {
  it('a thing of a place put down elsewhere is there after a restart; its place does not make it again, nor when it comes back', async () => {
    const w = newLasting(bundledFiles);
    const k = await open(w);
    const thing = placeThing(k);
    const was = { ...k.ecs.get(thing, 'pos') };
    const key = (k.ecs.get(thing, 'chunk') as { key: string }).key;
    const origin = await takeIt(k, thing);
    // Elsewhere: a free stretch of ground, and down in front.
    openGround(k, 2);
    const slot = carriedSlot(k);
    expect(await k.placeCarried(slot)).toBeTruthy();
    const moved = byOrigin(k, origin)!;
    const to = { ...k.ecs.get(moved, 'pos') };
    expect(Math.hypot(to.x - was.x, to.y - was.y)).toBeGreaterThan(1);
    await closeWorld(k, w);
    const st = JSON.parse(w.files['world/state.json']);
    expect(st.moved).toEqual([expect.objectContaining({ module: k.ecs.get(moved, 'module').id, origin, x: to.x, y: to.y })]);
    expect(st.consumed).toContain(origin);

    const again = await open(w);
    const ones = again.ecs.query('origin').filter((e) => again.ecs.get(e, 'origin').key === origin);
    expect(ones).toHaveLength(1);
    const p = again.ecs.get(ones[0], 'pos');
    expect([p.x, p.y]).toEqual([to.x, to.y]);
    expect(again.ecs.get(ones[0], 'form').yaw).toBeCloseTo(k.ecs.get(moved, 'form').yaw, 4);
    if (again.container(ones[0])) {
      expect(again.container(ones[0])!.filled).toBe(true);
      expect(again.container(ones[0])!.inv.slots.every((s) => !s)).toBe(true);
    }
    // Away, far enough that its place unloads, and back: still one, where it was put.
    const S = again.config.chunkSize;
    const loaded = () => again.chunks.get(key)?.stage === 'planned';
    let gone = 0;
    for (let jump = 0; jump < 3 && loaded(); jump++) {
      again.carpet()!.ox += 12 * S;
      gone += 12;
      for (let i = 0; i < 400 && loaded(); i++) {
        again.tick(1 / 20);
        await pause(2);
      }
    }
    expect(loaded()).toBe(false);
    again.carpet()!.ox -= gone * S;
    for (let i = 0; i < 400 && !loaded(); i++) {
      again.tick(1 / 20);
      await pause(2);
    }
    expect(loaded()).toBe(true);
    run(again, 0.2);
    const still = again.ecs.query('origin').filter((e) => again.ecs.get(e, 'origin').key === origin);
    expect(still).toHaveLength(1);
    expect([again.ecs.get(still[0], 'pos').x, again.ecs.get(still[0], 'pos').y]).toEqual([to.x, to.y]);
  }, 180_000);

  it('carried when the game is saved, it is carried after a restart, and nowhere in the world until it is put down', async () => {
    const w = newLasting(bundledFiles);
    const k = await open(w);
    const thing = placeThing(k);
    const origin = await takeIt(k, thing);
    const slot = k.inventory().slots[carriedSlot(k)]!;
    await closeWorld(k, w);
    const me = JSON.parse(w.files['world/players/me.json']);
    expect(me.inventory.slots.find((s: { item?: string } | null) => s?.item === slot.item)).toMatchObject({ item: slot.item, count: 1, thing: { origin } });

    const again = await open(w);
    expect(byOrigin(again, origin)).toBeUndefined();
    const i = carriedSlot(again);
    expect(again.inventory().slots[i]?.thing?.origin).toBe(origin);
    openGround(again, 2);
    again.inventory().equipped = i;
    expect(await again.placeCarried(i)).toBeTruthy();
    expect(again.ecs.query('origin').filter((e) => again.ecs.get(e, 'origin').key === origin)).toHaveLength(1);
  }, 120_000);

  it('a save written by hand with nonsense in it opens anyway, keeping only what makes sense', async () => {
    const st = { moved: [null, 7, { module: 'obj.chest', origin: 'a', x: 'qui', y: 0 }, { module: 'nessuno', origin: 'b', x: 1.5, y: 1.5, yaw: 0 }, { module: 'obj.bed', origin: 'mano#1', x: 3.5, y: 2.5, yaw: 'su', parts: { pos: { x: 99 }, coperta: { colore: 'rossa' } } }] };
    const k = await Kernel.boot({ files: { ...bundledFiles, 'world/state.json': JSON.stringify(st) }, store: memoryStore(), ai: new MockAiModels() });
    const bed = byOrigin(k, 'mano#1')!;
    expect(bed).toBeDefined();
    expect(k.ecs.get(bed, 'pos')).toMatchObject({ x: 3.5, y: 2.5 });
    expect(k.ecs.get(bed, 'coperta')).toEqual({ colore: 'rossa' });
    expect(byOrigin(k, 'b')).toBeUndefined();
    // The module that is not there waits in the save; the rest is as it was read.
    k.saveState();
    expect(JSON.parse(k.repo.working['world/state.json']).moved.map((r: { origin: string }) => r.origin).sort()).toEqual(['b', 'mano#1']);
  });
});

// --- Two wanderers ----------------------------------------------------------------------------------

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

async function thin(server: SessionServer, id: string, heard: ServerMsg[] = []): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  c.onMessage((m) => heard.push(m));
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
    await pause(25);
    if ([...server.kernel.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  frames(server, clients, 12);
}

/** Lets the answers of the server come and go: frames, then the promises waiting for them. */
async function flush(server: SessionServer, clients: ThinClient[]) {
  for (let i = 0; i < 6; i++) {
    frames(server, clients, 3);
    for (let j = 0; j < 10; j++) await pause(0);
  }
}

/** The mirror's entity standing for an entity of the server. */
const mirrorOf = (c: ThinClient, k: Kernel, sid: number) => {
  const p = k.ecs.get(sid, 'pos');
  return c.k.ecs.query('pos').find((e) => c.k.ecs.has(e, 'module') && Math.hypot(c.k.ecs.get(e, 'pos').x - p.x, c.k.ecs.get(e, 'pos').y - p.y) < 0.01);
};

/** The cupboards a world has at a point. */
const cupboardsAt = (k: Kernel, x: number, y: number) => k.ecs.query('module', 'pos').filter((e) => k.ecs.get(e, 'module').id === 'obj.cupboard' && Math.hypot(k.ecs.get(e, 'pos').x - x, k.ecs.get(e, 'pos').y - y) < 0.01);

describe('two wanderers', () => {
  it('both take the same cupboard at once: one has it, the other is told; it is gone for both, and comes back where it is put', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const heardAnna: ServerMsg[] = [];
    const heardBruno: ServerMsg[] = [];
    const anna = await thin(server, 'anna', heardAnna);
    const bruno = await thin(server, 'bruno', heardBruno);
    await settleMany(server, [anna, bruno]);
    // Both on open ground, the cupboard between them.
    const at = k.as('anna', () => openGround(k, 4));
    k.as('anna', () => stand(k, { x: at.col + 0.5, y: at.row + 0.5 }));
    k.as('bruno', () => stand(k, { x: at.col + 2.5, y: at.row + 0.5 }));
    const cupboard = k.spawnModuleEntity(k.modules.get('obj.cupboard')!, at.col + 1.5, at.row + 1.5);
    k.openContainer(cupboard);
    k.container(cupboard)!.inv.slots.fill(null);
    await settleForms(k, [cupboard]);
    await flush(server, [anna, bruno]);
    const hers = mirrorOf(anna, k, cupboard)!;
    const his = mirrorOf(bruno, k, cupboard)!;
    expect(hers).toBeDefined();
    expect(his).toBeDefined();
    // Each client's menu offers it: the manifest says so to every client.
    expect(anna.k.actionsFor(hers)).toContainEqual({ id: 'prendi', label: 'Prendi', enabled: true });
    expect(bruno.k.actionsFor(his)).toContainEqual({ id: 'prendi', label: 'Prendi', enabled: true });
    const before = { anna: heardAnna.length, bruno: heardBruno.length };
    const a = anna.k.perform(hers, 'prendi');
    const b = bruno.k.perform(his, 'prendi');
    await flush(server, [anna, bruno]);
    await Promise.all([a, b]);
    const has = (id: string) => k.as(id, () => k.inventory().slots.filter((s) => s?.item === 'thing:obj.cupboard').length);
    expect(has('anna') + has('bruno')).toBe(1);
    expect(k.ecs.alive.has(cupboard)).toBe(false);
    const winnerId = has('anna') ? 'anna' : 'bruno';
    const [winner, loser] = winnerId === 'anna' ? [anna, bruno] : [bruno, anna];
    const [heardWinner, heardLoser] = winnerId === 'anna' ? [heardAnna, heardBruno] : [heardBruno, heardAnna];
    // The other heard no: the thing was not there any more.
    const answers = heardLoser.slice(winnerId === 'anna' ? before.bruno : before.anna).filter((m): m is Extract<ServerMsg, { t: 'result' }> => m.t === 'result');
    expect(answers.length).toBeGreaterThan(0);
    expect(answers.every((r) => !(r.messages ?? []).some((t) => t.startsWith('Prendi')))).toBe(true);
    expect(answers.some((r) => !r.ok)).toBe(true);
    // Gone from both worlds.
    expect(cupboardsAt(winner.k, at.col + 1.5, at.row + 1.5)).toEqual([]);
    expect(cupboardsAt(loser.k, at.col + 1.5, at.row + 1.5)).toEqual([]);
    // On the wire to who carries it: the item and the seed of its look, never who it is nor its state.
    const carried = heardWinner.flatMap((m) => ((m.t === 'update' || m.t === 'welcome') && m.state?.inventory ? [(m.state.inventory as Inventory).slots.find((s) => s?.item === 'thing:obj.cupboard')] : [])).filter(Boolean);
    expect(carried.length).toBeGreaterThan(0);
    for (const s of carried) expect(s).toEqual({ item: 'thing:obj.cupboard', count: 1, thing: { seed: expect.any(Number) } });
    const mine = k.as(winnerId, () => k.inventory().slots.find((s) => s?.thing)!.thing!);
    expect(JSON.stringify(heardWinner)).not.toContain(mine.origin);
    expect(JSON.stringify(heardLoser)).not.toContain(mine.origin);
    // The other sees it over their head, with its own look; who carries it sees the same.
    const them = loser.k.ecs.query('remote').find((e) => loser.k.ecs.get(e, 'remote').id === winnerId)!;
    expect(heldBy(loser.k, them)).toBe('thing:obj.cupboard');
    expect(heldSeedOf(loser.k, them)).toBe(mine.seed);
    expect(heldSeedOf(winner.k, winner.k.wandererEntity)).toBe(mine.seed);
    // Put down by the one who has it, from their own client: the other sees it there.
    const spot = { col: at.col + 1, row: at.row - 2 };
    k.as(winnerId, () => stand(k, { x: spot.col + 0.5, y: spot.row + 2.5 }));
    await flush(server, [anna, bruno]);
    const put = winner.k.performMenu(`t:${PUT_DOWN}`, -1, spot.col, spot.row);
    await flush(server, [anna, bruno]);
    await put;
    expect(has(winnerId)).toBe(0);
    const [back] = cupboardsAt(k, spot.col + 0.5, spot.row + 0.5);
    expect(back).toBeDefined();
    expect(k.ecs.get(back, 'origin').key).toBe(mine.origin);
    await flush(server, [anna, bruno]);
    expect(mirrorOf(loser, k, back)).toBeDefined();
    expect(heldBy(loser.k, them)).toBeUndefined();
  }, 120_000);

  it('whatever comes on the wire to put down, the world answers and goes on (rule 8i)', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const { server: s, client } = fakeLink();
    const got: ServerMsg[] = [];
    client.onMessage((m) => got.push(m));
    server.connect(s);
    client.send({ t: 'join', id: 'cleo' });
    for (let i = 0; i < 80; i++) {
      server.tick(DT);
      await pause(25);
      if (k.chunks.size && [...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
    }
    const at = k.as('cleo', () => openGround(k, 3));
    let seq = 0;
    for (const [col, row] of [[at.col + 1, at.row], ['x', 0], [NaN, 1], [1e12, 0], [null, null], [at.col + 0.5, at.row]] as Array<[unknown, unknown]>) {
      client.send({ t: 'tile', seq: ++seq, col, row, action: PUT_DOWN } as never);
      expect(() => server.tick(DT)).not.toThrow();
    }
    // Carrying what is not a thing of the world, then a thing whose module is gone: nothing comes into the world, nothing is lost.
    k.as('cleo', () => {
      const inv = k.inventory();
      inv.slots[0] = { item: 'item.coltello', count: 1 };
      inv.slots[1] = { item: 'thing:modulo.che-non-c-e', count: 1, thing: { origin: 'x' } };
      inv.equipped = 0;
    });
    client.send({ t: 'tile', seq: ++seq, col: at.col + 1, row: at.row, action: PUT_DOWN });
    client.send({ t: 'item', seq: ++seq, op: 'put_down', slot: 1 });
    for (let i = 0; i < 4; i++) {
      server.tick(DT);
      await pause(0);
    }
    const answers = got.filter((m): m is Extract<ServerMsg, { t: 'result' }> => m.t === 'result');
    expect(new Set(answers.map((a) => a.seq)).size).toBe(seq);
    expect(k.as('cleo', () => k.inventory().slots[1]?.item)).toBe('thing:modulo.che-non-c-e');
    expect(k.as('cleo', () => k.inventory().slots[0]?.item)).toBe('item.coltello');
    // Many at once: what walks the ways again has a pace of its own (LIMITS.moveRate), past which the world is not even asked.
    const from = seq;
    for (let i = 0; i < 30; i++) client.send({ t: 'tile', seq: ++seq, col: at.col + 1, row: at.row, action: PUT_DOWN });
    for (let i = 0; i < 4; i++) {
      server.tick(DT);
      await pause(0);
    }
    const flood = got.filter((m): m is Extract<ServerMsg, { t: 'result' }> => m.t === 'result' && m.seq > from);
    const slowed = flood.filter((r) => r.reason === 'stai andando troppo in fretta: aspetta un momento');
    expect(flood).toHaveLength(30);
    expect(slowed.length).toBeGreaterThanOrEqual(30 - LIMITS.moveBurst);
    expect(LIMITS.moveRate).toBeLessThanOrEqual(5);
    expect(k.ecs.query('pickup').filter((e) => String(k.ecs.get(e, 'pickup').item).startsWith('thing:'))).toEqual([]);
  }, 120_000);
});

// --- The Council decides what can be taken ----------------------------------------------------------------------------------------

describe('who decides what can be taken', () => {
  const physics: PhysicsSpec = { solido: true, spingibile: false, massa: 30, attrito: 0.6, raggio: 0.45, velocita: 0, peso: 0, impilabile: false, max_pila: 1, equipaggiabile: false };
  const concept = (o: Partial<Concept>): Concept => ({ nome: 'Madia', tipo: 'oggetto', descrizione: 'una madia', lore: '', aspetto: 'una madia di legno', classe: 'furniture', contesto: { terreni: ['g'], luoghi: 'case', rarita: 0.2 }, interazione: 'usa', comandi: [], tags: [], ...o });

  it('the manifest says it only for a thing one lifts: furniture or something small, not a building, not someone, not large', () => {
    const m = (o: Partial<Concept>) => assembleManifest('obj.prova', concept(o), physics, { logic: 'local M = {}\nreturn M\n' }, ['g'], 'agente');
    expect(m({ takeable: true }).takeable).toBe(true);
    expect(m({ takeable: false }).takeable).toBeUndefined();
    expect(m({}).takeable).toBeUndefined();
    expect(m({ takeable: true, classe: 'building', nome: 'Pozzo' }).takeable).toBeUndefined();
    expect(m({ takeable: true, classe: 'monument' }).takeable).toBeUndefined();
    expect(m({ takeable: true, taglia: 'large' }).takeable).toBeUndefined();
    expect(m({ takeable: true, tipo: 'npc', persona: 'un fornaio' }).takeable).toBeUndefined();
    expect([...TAKEABLE_CLASSES].sort()).toEqual(['furniture', 'object', 'pebble']);
  });

  it('the Narrator decides it in the Forge, and who asked for the thing has the last word (the Cartographer, for what a place calls for)', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const madia = await k.forgeModule('una madia di legno per il pane', 'agente', 'oggetto');
    expect(madia.ok).toBe(true);
    expect(k.modules.get(madia.id!)!.manifest.takeable).toBe(true);
    expect(madia.summary).toMatch(/si può spostare/);
    const pozzo = await k.forgeModule('un pozzo di pietra coperto', 'agente', 'oggetto');
    expect(pozzo.ok).toBe(true);
    expect(k.modules.get(pozzo.id!)!.manifest.takeable).toBeUndefined();
    const fixed = await k.forgeModule('una credenza murata nella parete', 'cartografo', undefined, false, undefined, false);
    expect(fixed.ok).toBe(true);
    expect(k.modules.get(fixed.id!)!.manifest.takeable).toBeUndefined();
    // Once in the world, its item is there: what a thing of it is while carried.
    expect(k.content.get(thingItem(madia.id!))?.name).toBe(k.modules.get(madia.id!)!.manifest.name);
    expect(k.content.get(thingItem(pozzo.id!))).toBeUndefined();
  }, 60_000);

  it('the validator wants a boolean, and a thing of the world: not someone, not an item', async () => {
    const v = new Validator(await Sandbox.create(fakeHost().host));
    const base = { id: 'obj.prova', name: 'Prova', kind: 'entity', appearance: { glyph: 'P', color: '#ffffff' } };
    expect(v.parseManifest('m.json', JSON.stringify({ ...base, takeable: true })).errors).toEqual([]);
    expect(v.parseManifest('m.json', JSON.stringify({ ...base, takeable: 'sì' })).errors.join()).toMatch(/takeable/);
    expect(v.parseManifest('m.json', JSON.stringify({ ...base, takeable: true, interaction: { type: 'talk' }, persona: 'un oste' })).errors.join()).toMatch(/takeable/);
    expect(v.parseManifest('m.json', JSON.stringify({ ...base, kind: 'item', item: { stackable: false, equippable: true, maxStack: 1, weight: 1 }, takeable: true })).errors.join()).toMatch(/takeable/);
    expect(v.parseManifest('m.json', JSON.stringify(base)).manifest?.takeable).toBeUndefined();
  });

  it('in the seed a cupboard, a chest, a bed, a bench and a crate are taken; the well, the sign, the bush, the cat are not', () => {
    const takeable = Object.entries(bundledFiles)
      .filter(([p]) => /^modules\/[^/]+\/manifest\.json$/.test(p))
      .map(([, t]) => JSON.parse(t))
      .filter((m) => m.takeable === true)
      .map((m) => m.id)
      .sort();
    expect(takeable).toEqual(['obj.bed', 'obj.chest', 'obj.counter', 'obj.cupboard', 'object.crate']);
    // A client knows it too: its menu offers «Prendi».
    const shown = JSON.parse(playerFiles(bundledFiles)['modules/obj.cupboard/manifest.json']);
    expect(shown.takeable).toBe(true);
  });

  it('a thing carried is an item no pack, loot table or name finds, never in a chest', () => {
    const c = new Content();
    const entry = (manifest: object) => ({ manifest, dir: '', manifestPath: '' }) as unknown as ModuleEntry;
    c.rebuild([
      entry({ id: 'obj.armadio', name: 'Armadio', kind: 'entity', takeable: true, description: 'Un armadio.', tags: ['legno'], physics: { mass: 60 }, appearance: { glyph: 'A', color: '#884422', model: 'credenza' } }),
      entry({ id: 'npc.oste', name: 'Oste', kind: 'entity', takeable: true, persona: 'un oste', appearance: { glyph: 'O', color: '#fff' } }),
      entry({ id: 'items.prova', name: 'Prova', kind: 'data', items: [{ id: 'item.mela', name: 'Mela', description: '', category: 'food', weight: 1, stack: 5, tags: [], glyph: 'm', color: '#f00' }], loot: { cassa: { rolls: [3, 3], entries: [{ item: 'thing:obj.armadio', weight: 100 }, { item: 'item.mela', weight: 1 }] } } }),
    ]);
    expect(c.get('thing:obj.armadio')).toMatchObject({ id: 'thing:obj.armadio', name: 'Armadio', category: 'misc', weight: 20, stack: 1, equippable: true, model: 'credenza', tags: ['legno'] });
    expect(c.get('thing:npc.oste')).toBeUndefined();
    expect(c.items.has('thing:obj.armadio')).toBe(false);
    expect(c.byName('Armadio')).toBeUndefined();
    expect(c.withTag('legno')).toEqual([]);
    for (let i = 0; i < 20; i++) expect(c.roll('cassa', new (class { next = () => Math.random(); int = (n: number) => Math.floor(Math.random() * n); })() as never).map((l) => l.item)).not.toContain('thing:obj.armadio');
    // What a client sees of a slot that carries one.
    const inv: Inventory = { slots: [{ item: 'thing:obj.armadio', count: 1, thing: { origin: '0,0#o1', seed: 2, parts: { segreto: { n: 1 } } } }, { item: 'item.mela', count: 2 }, null], equipped: 0 };
    expect(shownInventory(inv)).toEqual({ slots: [{ item: 'thing:obj.armadio', count: 1, thing: { seed: 2 } }, { item: 'item.mela', count: 2 }, null], equipped: 0 });
  });
});

// --- Over the head ----------------------------------------------------------------------------------------------------------------

/** A runner that also makes the meshes, as the worker does, for the models a test draws. */
class Meshing implements FormRunner {
  private inline = new InlineRunner();
  constructor(private drawn: Set<string>) {}
  async run(q: FormRequest): Promise<FormResult> {
    if (!q.model || !this.drawn.has(q.model)) return this.inline.run(q);
    const r = runForm(q);
    const { model: _m, finished: _f, ...result } = r;
    return { ...result, meshes: formMeshes(r, q) };
  }
}

describe('over the head', () => {
  let k: Kernel;
  beforeAll(async () => {
    k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), forms: new Meshing(new Set(['viandante', 'credenza', 'letto', 'furniture'])) });
  }, 120_000);

  it('a cupboard rides on the raised hands of the wanderer, upright, over its head and between its hands, small enough for it', async () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const body = (await k.forms.wait('viandante', seed))!;
      const hands = handsOf(body.result!.grid, body.result!.palette, body.vpt);
      expect(hands.length, `seme ${seed}`).toBeGreaterThan(0);
      for (const model of ['credenza', 'letto', 'furniture']) {
        const f = (await k.forms.wait(model, 1))!;
        const box = boxOf(f.result!.grid, f.result!.palette, f.vpt)!;
        const pose = overheadPose(box, hands);
        const height = Math.max(...hands.map((h) => h.height));
        // Its floor over the head and the raised hands; its widest side and its height within the body's share.
        expect(pose.position[1], `${model} ${seed}`).toBeGreaterThanOrEqual(height);
        for (const h of hands) expect(pose.position[1]).toBeGreaterThanOrEqual(raisedHand(h)[1]);
        const k1 = pose.scale;
        expect(Math.max(box.max[0] - box.min[0], box.max[2] - box.min[2]) * k1).toBeLessThanOrEqual(OVERHEAD.width * height + 1e-9);
        expect((box.max[1] - box.min[1]) * k1).toBeLessThanOrEqual(OVERHEAD.tall * height + 1e-9);
        expect(pose.quaternion).toEqual([0, 0, 0, 1]);
        // Its bottom in the middle of the holder.
        expect(pose.offset[1]).toBeCloseTo(-box.min[1], 9);
        // A hand that hangs is turned up; a raised one stays as it is.
        for (const h of hands) expect(overheadTurn(h)).toBe(h.raised ? 0 : OVERHEAD.arms);
        for (const h of hands.filter((x) => !x.raised)) expect(raisedHand(h)[1]).toBeGreaterThan(h.joint[1]);
      }
    }
  });

  it('the wanderer carries it on its body, its arms go up and stay up; put down, they swing again; nothing is made twice', async () => {
    const scene = new THREE.Scene();
    const w = new Wanderer(scene);
    const fc = k.ecs.get(k.wandererEntity, 'form');
    await k.forms.wait(fc.model, fc.seed, fc.tint);
    const item = thingItem('obj.cupboard');
    const look = k.itemLook(item, 2);
    const f = (await k.forms.wait(look.model, look.seed, look.tint))!;
    expect(geoOf(f)).toBeDefined();
    w.update(k, DT, 0);
    const inv = k.inventory();
    const i = inv.slots.findIndex((s) => !s);
    inv.slots[i] = { item, count: 1, thing: { origin: 'prova#1', seed: 2 } };
    inv.equipped = i;
    for (let t = 0; t < 1; t += DT) w.update(k, DT, t);
    const holder = w.view.holding?.holder;
    expect(holder).toBeDefined();
    expect(w.view.holding?.overhead).toBe(true);
    expect(holder!.parent).toBe(w.view.body);
    const mesh = holder!.children.find((o) => (o as THREE.Mesh).isMesh) as THREE.Mesh;
    // The mesh of the ground of that very cupboard: its own seed.
    expect(mesh.geometry).toBe(geoOf(f)!.body);
    expect(boxFor(f)).toEqual(boxOf(f.result!.grid, f.result!.palette, f.vpt));
    const arms = w.view.limbs.filter((l) => l.part === 'arm');
    expect(arms.length).toBeGreaterThan(0);
    for (const a of arms) expect(a.pivot.rotation.x).toBeCloseTo(overheadTurn(a.hand), 2);
    // Over the head, in the world: higher than the top of the body.
    scene.updateMatrixWorld(true);
    const where = new THREE.Box3().setFromObject(mesh);
    const top = Math.max(...w.view.limbs.flatMap((l) => (l.hand ? [l.hand.height] : [])));
    expect(where.min.y - w.view.root.position.y).toBeGreaterThan(top * 0.95);
    // Another seed: another mesh; the same one again: nothing made.
    const same = holder;
    w.update(k, DT, 1.1);
    expect(w.view.holding?.holder).toBe(same);
    inv.equipped = null;
    for (let t = 0; t < 1; t += DT) w.update(k, DT, 1.2 + t);
    expect(w.view.holding?.holder).toBeUndefined();
    expect(holder!.parent).toBe(null);
    for (const a of arms) expect(Math.abs(a.pivot.rotation.x)).toBeLessThan(0.5);
    inv.slots[i] = null;
  });
});
