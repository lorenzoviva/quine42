// T245a (ADR-0138): the lasting store of the modules, `world.store_get/set`; the save that keeps what it does not know.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { councilMayWrite } from '../src/kernel/paths';
import { memoryStore } from '../src/kernel/repo';
import { ModuleStores, STORE_KEYS, STORE_MODULE_BYTES, STORE_UNIVERSE_BYTES, storePath } from '../src/kernel/store';
import { apiErrors } from '../src/kernel/validator';
import { playerFiles, publicFiles } from '../src/session/files';
import { closeWorld, DT, newLasting, open, play } from './espressivita/banco';

const COUNTER = `-- Conta i giri del mondo e li ricorda.
local M = {}
function M.update(dt)
  local n = world.store_get("giri") or 0
  world.store_set("giri", n + 1)
  world.store_set("ultimo", { quando = n, chi = "contatore" })
end
return M
`;

const counter = (logic = COUNTER) => ({
  'modules/sys.contatore/manifest.json': JSON.stringify({ id: 'sys.contatore', name: 'Contatore', kind: 'system', logic: 'logic.lua', order: 95 }),
  'modules/sys.contatore/logic.lua': logic,
});

describe('ModuleStores', () => {
  it('keeps plain data under simple keys, gives copies, and nil takes a key away', () => {
    const s = new ModuleStores();
    expect(s.set('mech.a', 'prezzo', { v: 3, lista: [1, 'x', true] })).toBe(true);
    const got = s.get('mech.a', 'prezzo') as { v: number };
    got.v = 99;
    expect(s.get('mech.a', 'prezzo')).toEqual({ v: 3, lista: [1, 'x', true] });
    expect(s.get('mech.b', 'prezzo')).toBeUndefined();
    expect(s.set('mech.a', 'prezzo', null)).toBe(true);
    expect(s.get('mech.a', 'prezzo')).toBeUndefined();
  });

  it('refuses keys that are not simple and values that are not data', () => {
    const s = new ModuleStores();
    for (const key of ['', '../x', 'a b', 'x'.repeat(65), 3, '__proto__/x']) expect(s.set('mech.a', key, 1), String(key)).toBe(false);
    for (const value of [NaN, Infinity, () => 1, { f: () => 1 }, Symbol('x')]) expect(s.set('mech.a', 'k', value)).toBe(false);
    expect(s.set('../fuori', 'k', 1)).toBe(false);
    expect(s.size()).toBe(0);
  });

  it('has a cap per module, per universe, and on the keys: a full store says no and keeps what it had', () => {
    const s = new ModuleStores();
    const big = 'x'.repeat(STORE_MODULE_BYTES / 2);
    expect(s.set('mech.a', 'uno', big)).toBe(true);
    expect(s.set('mech.a', 'due', big)).toBe(false);
    expect(s.get('mech.a', 'uno')).toBe(big);
    const many = Math.ceil(STORE_UNIVERSE_BYTES / (STORE_MODULE_BYTES / 2)) + 1;
    let refused = false;
    for (let i = 0; i < many; i++) refused ||= !s.set(`mech.m${i}`, 'k', big);
    expect(refused).toBe(true);
    expect(s.size()).toBeLessThanOrEqual(STORE_UNIVERSE_BYTES);
    const t = new ModuleStores();
    for (let i = 0; i < STORE_KEYS; i++) expect(t.set('mech.k', `k${i}`, i)).toBe(true);
    expect(t.set('mech.k', 'una-di-troppo', 1)).toBe(false);
  });

  it('reads its files, and a file that does not read is an empty store', () => {
    const s = new ModuleStores();
    s.load({ [storePath('mech.a')]: '{"k":1}', [storePath('mech.b')]: '{ rotto', 'world/altro.json': '{"k":2}' });
    expect(s.get('mech.a', 'k')).toBe(1);
    expect(s.get('mech.b', 'k')).toBeUndefined();
    expect(s.takeChanged()).toEqual({});
    s.set('mech.b', 'k', 2);
    expect(Object.keys(s.takeChanged())).toEqual([storePath('mech.b')]);
    expect(s.takeChanged()).toEqual({});
  });
});

describe('world.store_get and world.store_set', () => {
  it('are in the API of Lua, and the validator takes them', () => {
    expect(apiErrors(COUNTER)).toEqual([]);
  });

  it('a module keeps its data across the openings of the world, in its own file', async () => {
    const w = newLasting({ ...bundledFiles, ...counter() });
    const first = await open(w);
    play(first, 0.5);
    const giri = first.stores.get('sys.contatore', 'giri') as number;
    expect(giri).toBeGreaterThan(10);
    await closeWorld(first, w);
    expect(JSON.parse(w.files['world/magazzino/sys.contatore.json'])).toMatchObject({ giri, ultimo: { chi: 'contatore' } });
    // Opening ticks while the places are drawn: the count goes on from where it was, never from zero.
    const second = await open(w);
    const after = second.stores.get('sys.contatore', 'giri') as number;
    expect(after).toBeGreaterThan(giri);
    second.tick(DT);
    expect(second.stores.get('sys.contatore', 'giri')).toBe(after + 1);
    const fresh = await Kernel.boot({ files: { ...bundledFiles, ...counter() }, store: memoryStore(), ai: new MockAiModels() });
    fresh.tick(DT);
    expect(fresh.stores.get('sys.contatore', 'giri')).toBe(1);
  });

  it('each module sees only its own', async () => {
    const peek = 'local M = {}\nfunction M.update(dt) ecs.set(world.player(), "visto", { v = world.store_get("giri") or -1 }) end\nreturn M\n';
    const k = await Kernel.boot({
      files: { ...bundledFiles, ...counter(), 'modules/sys.curioso/manifest.json': JSON.stringify({ id: 'sys.curioso', name: 'Curioso', kind: 'system', logic: 'logic.lua', order: 96 }), 'modules/sys.curioso/logic.lua': peek },
      store: memoryStore(),
      ai: new MockAiModels(),
    });
    k.tick(DT);
    k.tick(DT);
    expect(k.stores.get('sys.contatore', 'giri')).toBe(2);
    expect(k.ecs.get(k.wandererEntity, 'visto').v).toBe(-1);
  });

  it('a value too big or not data is refused without a fault', async () => {
    const greedy = `local M = {}\nfunction M.update(dt) ecs.set(world.player(), "esito", { ok = world.store_set("tanto", string.rep("x", ${STORE_MODULE_BYTES + 10})) }) end\nreturn M\n`;
    const k = await Kernel.boot({ files: { ...bundledFiles, ...counter(greedy) }, store: memoryStore(), ai: new MockAiModels() });
    k.tick(DT);
    expect(k.ecs.get(k.wandererEntity, 'esito').ok).toBe(false);
    expect(k.faults.list().filter((f) => f.key.startsWith('module:sys.contatore'))).toEqual([]);
  });

  it('goes back with a rollback, as every file of the universe', async () => {
    const k = await Kernel.boot({ files: { ...bundledFiles, ...counter() }, store: memoryStore(), ai: new MockAiModels() });
    k.tick(DT);
    k.give('item.pane', 1);
    k.saveState();
    const saved = k.stores.get('sys.contatore', 'giri') as number;
    play(k, 0.2);
    expect(k.stores.get('sys.contatore', 'giri')).toBeGreaterThan(saved);
    k.rollback();
    expect(k.stores.get('sys.contatore', 'giri')).toBe(saved);
  });

  it('never leaves for a client, and the Council does not write it', async () => {
    const w = newLasting({ ...bundledFiles, ...counter() });
    const k = await open(w);
    k.tick(DT);
    await closeWorld(k, w);
    const path = 'world/magazzino/sys.contatore.json';
    expect(w.files[path]).toBeDefined();
    expect(playerFiles(w.files)[path]).toBeUndefined();
    expect(publicFiles(w.files)[path]).toBeUndefined();
    expect(Object.keys(playerFiles(w.files)).some((p) => p.startsWith('world/magazzino/'))).toBe(false);
    // A path of the world like any other: what fences the Council in is that it never writes it, and what it did not change goes back.
    expect(councilMayWrite(path)).toBe(true);
  });
});

describe('the save keeps what it does not know', () => {
  it('in world/stato.json and in a wanderer’s file, but never credits', async () => {
    const w = newLasting({
      ...bundledFiles,
      'world/stato.json': JSON.stringify({ consumati: [], ora: 5, di_domani: { x: 1 } }),
      'world/giocatori/io.json': JSON.stringify({ needs: { hunger: 50, thirst: 50, energy: 50, health: 50, mana: 50 }, di_domani: [1, 2], crediti: 40 }),
    });
    const k = await open(w);
    k.give('item.pane', 1);
    await closeWorld(k, w);
    expect(JSON.parse(w.files['world/stato.json'])).toMatchObject({ di_domani: { x: 1 } });
    const me = JSON.parse(w.files['world/giocatori/io.json']);
    expect(me.di_domani).toEqual([1, 2]);
    expect(me.crediti).toBeUndefined();
  });
});
