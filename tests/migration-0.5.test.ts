// The migration 0.4 → 0.5 (T308b, ADR-0153, ADR-0163): the wire and Lua. The components Lua sees and their fields take their English
// names (`luce {raggio, accesa}` → `light {radius, lit}`, `stati` → `states` with `{speed, weight, light, expires}`, `mestiere` → `job`…),
// the API of the ventures (`world.impresa` → `world.venture`), the event of death (`morte` → `death`), the deposits of `sys.work`
// (`deposito:` → `deposit:`). A universe of 0.4 opens ported: its manifests (the components they give, their panels' fields, their
// cases), the states its wanderers keep, the store of the work, the Lua of the Council's modules; the player's Lua stays as it was
// (rule 3). The protocol changed too, but nothing of it lies on the disk (session.test.ts and the others speak it).

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { internalComponent, internalComponents, internalFieldPath, internalManifest0_5 } from '../src/kernel/internalNames';
import { luaFor0_5, migrateUniverse, MIGRATIONS } from '../src/kernel/migrations';
import { prepareUniverse, SEED_FILE } from '../src/kernel/universes';
import { checkKernelVersion } from '../src/kernel/version';
import { apiErrors } from '../src/kernel/validator';
import { hashStr, hex } from '../src/kernel/rng';
import type { FileMap } from '../src/kernel/types';

/** The kernel of the contract 0.5: what this migration gives, before the next one (0.5 → 0.6, T342) takes it on. */
const TO_0_5 = '0.5.0';
const json = (s: string | undefined) => JSON.parse(s ?? 'null');
const write = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
const h = (s: string) => hex(hashStr(s));

/** A Council module of 0.4: a lamp that lights the wanderer, burns, shields, and says when they die. */
const LAMP_LUA = [
  '-- Una lanterna: accende il viandante; "luce" in un commento resta com\'è.',
  'local M = {}',
  'function M.update(dt)',
  '  local pl = world.player()',
  '  local l = ecs.get(pl, "luce") or { accesa = false, raggio = 1 }',
  '  l.accesa = true',
  '  l.raggio = 3',
  '  ecs.set(pl, "luce", l)',
  '  local s = ecs.get(pl, "scudo")',
  '  if s and time > s.fino then ecs.set(pl, "scudo", { fino = 0, spento = true }) end',
  '  local st = ecs.get(pl, "stati") or {}',
  '  st.lanterna = { velocita = 1, peso = 0.5, luce = 3, fino = 0 }',
  '  ecs.set(pl, "stati", st)',
  '  ecs.each("effimero, pos", function(id, e, p) if time > e.fino then ecs.destroy(id) end end)',
  '  local n = ecs.get(pl, "needs")',
  '  if n and n.health <= 0 and not n.morto then bus.emit("morte", { fame = true, sete = false }) end',
  '  local nome = "luce"',
  '  return nome',
  'end',
  'function M.on_act(id, user, action)',
  '  ecs.spawn({ pos = { x = 0, y = 0 }, fuoco = { raggio = 2 }, effimero = { fino = time + 5 } })',
  '  local passo = world.impresa(user)',
  '  if passo then world.impresa_porta(user, passo.item) end',
  '  local a = ecs.get(id, "attivita")',
  '  if a and a.ferma then return a.tipo end',
  '  return ecs.get(id, "struttura").stadio',
  'end',
  'return M',
].join('\n');

/** The same module, as the kernel of 0.5 reads it. */
const LAMP_LUA_0_5 = [
  '-- Una lanterna: accende il viandante; "luce" in un commento resta com\'è.',
  'local M = {}',
  'function M.update(dt)',
  '  local pl = world.player()',
  '  local l = ecs.get(pl, "light") or { lit = false, radius = 1 }',
  '  l.lit = true',
  '  l.radius = 3',
  '  ecs.set(pl, "light", l)',
  '  local s = ecs.get(pl, "shield")',
  '  if s and time > s.expires then ecs.set(pl, "shield", { expires = 0, off = true }) end',
  '  local st = ecs.get(pl, "states") or {}',
  '  st.lanterna = { speed = 1, weight = 0.5, light = 3, expires = 0 }',
  '  ecs.set(pl, "states", st)',
  '  ecs.each("ephemeral, pos", function(id, e, p) if time > e.expires then ecs.destroy(id) end end)',
  '  local n = ecs.get(pl, "needs")',
  '  if n and n.health <= 0 and not n.dead then bus.emit("death", { hunger = true, thirst = false }) end',
  '  local nome = "luce"',
  '  return nome',
  'end',
  'function M.on_act(id, user, action)',
  '  ecs.spawn({ pos = { x = 0, y = 0 }, fire = { radius = 2 }, ephemeral = { expires = time + 5 } })',
  '  local passo = world.venture(user)',
  '  if passo then world.venture_bring(user, passo.item) end',
  '  local a = ecs.get(id, "activity")',
  '  if a and a.still then return a.kind end',
  '  return ecs.get(id, "structure").stage',
  'end',
  'return M',
].join('\n');

/** A universe of the contract 0.4, born among many, with a Council's module, a player's module and the work's store. */
function universe04(): FileMap {
  return {
    'universe.json': write({ name: 'vecchio', kernel: '0.4.2', kernels: { from: '0.4' }, seed: 7 }),
    'modules/mech.lanterna/manifest.json': write({
      id: 'mech.lanterna', name: 'Lanterna', kind: 'system', logic: 'logic.lua', origin: 'engineer',
      components: { luce: { raggio: 2, accesa: false, colore: '#ffcc00' } },
      ui: { id: 'lanterna', title: 'Lanterna', elements: [{ type: 'bar', label: 'Luce', field: 'luce.raggio' }, { type: 'text', label: 'Stato', field: 'attivita.tipo' }, { type: 'text', label: 'Difesa', field: 'difesa.valore' }] },
      cases: [
        {
          title: 'Si accende', story: 'la lanterna',
          wanderer: { components: { stati: { cavallo: { velocita: 1.8, peso: 30, luce: 0, fino: 0 } }, needs: { health: 10, morto: false } } },
          entities: [{ module: 'npc.villager', x: 1, y: 0, components: { meta: { x: 2, y: 2 }, mestiere: { id: 'farmer', fase: 'morning', giorno: 0, luogo: '0,0', compiti: [{ fa: 'go', dove: 'work' }] } } }],
          duration: 2, watch: ['luce.raggio', '0:meta.x', '0:attivita.ferma', 'scudo.fino', 'needs.health'], lines: [5],
        },
      ],
    }),
    'modules/mech.lanterna/logic.lua': LAMP_LUA,
    // A module the player wrote: no origin. Their Lua is theirs.
    'modules/mio.lume/manifest.json': write({ id: 'mio.lume', name: 'Lume', kind: 'system', logic: 'logic.lua', singleton: { luce: { raggio: 1 } } }),
    'modules/mio.lume/logic.lua': 'local M = {}\nfunction M.update(dt) local l = ecs.get(world.player(), "luce") end\nreturn M\n',
    'modules/sys.work/manifest.json': write({
      id: 'sys.work', name: 'Il lavoro', kind: 'system', logic: 'logic.lua',
      ui: { id: 'cantiere', title: 'Il cantiere', elements: [{ type: 'text', label: 'Che cosa', field: 'cantiere.titolo' }, { type: 'text', label: 'Chi', field: 'cantiere.squadra' }, { type: 'button', id: 'porta', label: 'Porta' }] },
    }),
    'world/players/me.json': write({ name: 'Io', states: { cavallo: { velocita: 1.8, peso: 30, luce: 0, fino: 0 } }, needs: { health: 90 } }),
    'world/players/anna.json': write({ name: 'Anna', states: { benedizione: { velocita: 1.2, peso: 0, luce: 2, fino: 40 } } }),
    'world/stores/sys.work.json': write({ 'deposito:0:0': { 'item.grano': 3 }, 'deposito:-1:2': { 'item.ciocco': 1 }, altro: 5 }),
    // Another module's own keys are its own: nothing of the work.
    'world/stores/mech.lanterna.json': write({ 'deposito:x': 1 }),
  };
}

describe('the migration 0.4 → 0.5: a universe of 0.4, file by file', () => {
  const before = universe04();
  const { files, applied } = migrateUniverse(before, TO_0_5);

  it('is the fourth migration of the chain, it says what it does, and the universe runs on this kernel', () => {
    expect(MIGRATIONS.map((m) => `${m.from}→${m.to}`)).toEqual(['0.1→0.2', '0.2→0.3', '0.3→0.4', '0.4→0.5', '0.5→0.6', '0.6→0.7']);
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatch(/^0\.4→0\.5: .*world\.venture/);
    const cfg = json(files['universe.json']);
    expect(cfg).toMatchObject({ kernel: TO_0_5, kernels: { from: '0.5' } });
    expect(checkKernelVersion(cfg.kernel, TO_0_5, cfg.kernels).ok).toBe(true);
    // The same files give the same files, and a universe of 0.5 stays as it is (for the kernel of 0.5; this one ports it on, T342).
    expect(migrateUniverse(universe04(), TO_0_5).files).toEqual(files);
    expect(migrateUniverse(files, TO_0_5).applied).toEqual([]);
    expect(migrateUniverse(files).applied).toHaveLength(2);
  });

  it('the manifests: the components they give, their panels\' fields, their cases; the work\'s panel and button', () => {
    const lamp = json(files['modules/mech.lanterna/manifest.json']);
    expect(lamp.components).toEqual({ light: { radius: 2, lit: false, color: '#ffcc00' } });
    expect(lamp.ui.elements.map((e: { field?: string }) => e.field)).toEqual(['light.radius', 'activity.kind', 'difesa.valore']);
    expect(lamp.cases[0].wanderer.components).toEqual({ states: { cavallo: { speed: 1.8, weight: 30, light: 0, expires: 0 } }, needs: { health: 10, dead: false } });
    expect(lamp.cases[0].entities[0].components).toEqual({ goal: { x: 2, y: 2 }, job: { id: 'farmer', phase: 'morning', day: 0, chunk: '0,0', tasks: [{ does: 'go', where: 'work' }] } });
    expect(lamp.cases[0].watch).toEqual(['light.radius', '0:goal.x', '0:activity.still', 'shield.expires', 'needs.health']);
    // A module the player wrote: its data is ported (the kernel reads it), its Lua is not.
    expect(json(files['modules/mio.lume/manifest.json']).singleton).toEqual({ light: { radius: 1 } });
    const work = json(files['modules/sys.work/manifest.json']);
    expect(work.ui.id).toBe('worksite');
    expect(work.ui.elements.map((e: { field?: string; id?: string }) => e.field ?? e.id)).toEqual(['worksite.title', 'worksite.team', 'bring']);
  });

  it('the Lua of the Council\'s modules where the kernel reads a name; the player\'s stays as it was', () => {
    expect(files['modules/mech.lanterna/logic.lua']).toBe(LAMP_LUA_0_5);
    expect(apiErrors(files['modules/mech.lanterna/logic.lua'])).toEqual([]);
    expect(apiErrors(before['modules/mech.lanterna/logic.lua']).join()).toMatch(/world\.impresa non esiste/);
    expect(files['modules/mio.lume/logic.lua']).toBe(before['modules/mio.lume/logic.lua']);
  });

  it('the states the wanderers keep, and the deposits of the work under their keys of 0.5', () => {
    expect(json(files['world/players/me.json'])).toEqual({ name: 'Io', states: { cavallo: { speed: 1.8, weight: 30, light: 0, expires: 0 } }, needs: { health: 90 } });
    expect(json(files['world/players/anna.json']).states).toEqual({ benedizione: { speed: 1.2, weight: 0, light: 2, expires: 40 } });
    expect(json(files['world/stores/sys.work.json'])).toEqual({ 'deposit:0:0': { 'item.grano': 3 }, 'deposit:-1:2': { 'item.ciocco': 1 }, altro: 5 });
    expect(files['world/stores/mech.lanterna.json']).toBe(before['world/stores/mech.lanterna.json']);
  });

  it('seed.json follows: a file of the seed the universe kept as it was stays the seed\'s', () => {
    const u = universe04();
    u[SEED_FILE] = JSON.stringify({ 'modules/sys.work/manifest.json': h(u['modules/sys.work/manifest.json']), 'modules/mio.lume/manifest.json': 'cambiato' }, null, 1) + '\n';
    const out = migrateUniverse(u).files;
    const seed = json(out[SEED_FILE]);
    expect(seed['modules/sys.work/manifest.json']).toBe(h(out['modules/sys.work/manifest.json']));
    expect(seed['modules/mio.lume/manifest.json']).toBe('cambiato');
  });

  it('prepareUniverse: the chain (0.4 → 0.5 → 0.6 → 0.7), then the seed of today (its sys.work, its Lua)', () => {
    const out = prepareUniverse(universe04(), bundledFiles);
    expect(out.applied).toHaveLength(3);
    expect(json(out.files['universe.json']).kernels).toEqual({ from: '0.7' });
  });
});

describe('a universe of 0.4 opens on this kernel and its Council\'s code works', () => {
  it('the lantern lights the wanderer with the fields of 0.5, the wanderer keeps their states, nothing faults', async () => {
    const files: FileMap = { ...bundledFiles, 'universe.json': write({ ...json(bundledFiles['universe.json']), kernel: '0.4.0', kernels: { from: '0.4' } }) };
    const old = universe04();
    for (const p of ['modules/mech.lanterna/manifest.json', 'modules/mech.lanterna/logic.lua', 'world/players/me.json']) files[p] = old[p];
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    expect(k.faults.has('universe:kernel')).toBe(false);
    for (let i = 0; i < 10; i++) k.tick(1 / 60);
    expect(k.faults.list().filter((f) => f.key.startsWith('module:mech.lanterna'))).toEqual([]);
    expect(k.ecs.get(k.wandererEntity, 'light')).toMatchObject({ lit: true, radius: 3 });
    expect(k.ecs.get(k.wandererEntity, 'luce')).toBeUndefined();
    expect(k.states().cavallo).toMatchObject({ speed: 1.8, weight: 30 });
    expect(k.states().lanterna).toMatchObject({ speed: 1, weight: 0.5, light: 3 });
    // The states' pace is the kernel's: on horseback the wanderer steps 1.8 times as far.
    expect(k.wandererComp() as unknown as { step: number }).toMatchObject({ step: 1.8 });
  });
});

describe('luaFor0_5, case by case', () => {
  it('names a component only where `ecs` reads one, and a field only of the component that has it', () => {
    expect(luaFor0_5('local x = ecs.first("cantiere")')).toBe('local x = ecs.first("worksite")');
    expect(luaFor0_5("ecs.set(id, 'raccolto', { si = true })")).toBe("ecs.set(id, 'harvested', { yes = true })");
    // `tipo` is `kind` in `attivita`, and stays in another component, or in a table that is not one.
    expect(luaFor0_5('ecs.set(id, "attivita", { tipo = "work", ferma = true })')).toBe('ecs.set(id, "activity", { kind = "work", still = true })');
    expect(luaFor0_5('ecs.set(id, "mio", { tipo = 1, ferma = 2 })')).toBe('ecs.set(id, "mio", { tipo = 1, ferma = 2 })');
    expect(luaFor0_5('local t = { raggio = 1 }; core.effects.apply(u, u, { type = "light", radius = 2 })')).toBe('local t = { raggio = 1 }; core.effects.apply(u, u, { type = "light", radius = 2 })');
    // A variable that does not come from `ecs` keeps its fields; one that does has the component's.
    expect(luaFor0_5('local s = {}; s.fino = 1')).toBe('local s = {}; s.fino = 1');
    expect(luaFor0_5('local m = ecs.get(id, "mestiere"); return m.compiti[m.passo or 1], m.luogo, m.impresa_posto')).toBe('local m = ecs.get(id, "job"); return m.tasks[m.passo or 1], m.chunk, m.venture_spot');
    expect(luaFor0_5('ecs.each("lavoro, pos", function(id, w, p) w.passo = w.passo + 1; p.x = 1 end)')).toBe('ecs.each("work, pos", function(id, w, p) w.step = w.step + 1; p.x = 1 end)');
    expect(luaFor0_5('local pl = ecs.get(world.player(), "player"); return pl.passo')).toBe('local pl = ecs.get(world.player(), "player"); return pl.step');
    // A state of `stati` built where it is put, by name or by key.
    expect(luaFor0_5('local st = ecs.get(u, "stati") or {}; st[e.name] = { velocita = 2, fino = 3, prezzo = 4 }')).toBe('local st = ecs.get(u, "states") or {}; st[e.name] = { speed = 2, expires = 3, prezzo = 4 }');
    expect(luaFor0_5('ecs.set(u, "stati", { a = { peso = 1 } })')).toBe('ecs.set(u, "states", { a = { weight = 1 } })');
  });

  it('the API, the event, and nothing in comments, long strings or other strings', () => {
    expect(luaFor0_5('local p = world.impresa(id) or world:impresa_porta(id)')).toBe('local p = world.venture(id) or world:venture_bring(id)');
    expect(luaFor0_5('local impresa = 1; x.impresa = 2')).toBe('local impresa = 1; x.impresa = 2');
    expect(luaFor0_5('bus.emit("morte", { fame = true })')).toBe('bus.emit("death", { hunger = true })');
    expect(luaFor0_5('bus.emit("altro", { fame = true })')).toBe('bus.emit("altro", { fame = true })');
    const quiet = '-- ecs.get(id, "luce")\nlocal s = [[ ecs.get(id, "luce").raggio ]]\nlocal t = "luce"\nreturn M';
    expect(luaFor0_5(quiet)).toBe(quiet);
    // Idempotent: Lua of 0.5 stays as it is.
    expect(luaFor0_5(LAMP_LUA_0_5)).toBe(LAMP_LUA_0_5);
  });

  it('the names of the table, one at a time', () => {
    expect(internalComponents({ luce: { raggio: 1 }, pos: { x: 1 }, light: { radius: 2 } })).toEqual({ pos: { x: 1 }, light: { radius: 2 } });
    expect(internalComponent('salto', { da: { x: 0, y: 0 }, a: { x: 1, y: 1 }, alto: 1, t: 0, dur: 1 })).toEqual({ from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, peak: 1, t: 0, dur: 1 });
    expect(internalComponent('carico', { 'item.fino': 2 })).toEqual({ 'item.fino': 2 });
    expect(internalFieldPath('cantiere.squadra')).toBe('worksite.team');
    expect(internalFieldPath('1:struttura.stadio')).toBe('1:structure.stage');
    expect(internalFieldPath('difesa.tipo')).toBe('difesa.tipo');
    const m = internalManifest0_5({ id: 'x', components: { scudo: { fino: 1 } } });
    expect(internalManifest0_5(m)).toEqual(m);
  });
});
