// T183: what lasts. The bench is a few seconds with no restart: months of a living universe ask other questions, answered here on a whole kernel
// that closes and opens again from its files and its places. A test named LIMIT says what the kernel lacks.

import { describe, expect, it } from 'vitest';
import { apiErrors } from '../../src/kernel/validator';
import { cleanPanel } from '../../src/kernel/agents/mechanics';
import { fakeLink, type ServerMsg } from '../../src/session/protocol';
import { SessionServer } from '../../src/session/server';
import { SessionClient } from '../../src/session/client';
import type { Kernel } from '../../src/kernel/kernel';
import { closeWorld, DT, manyPlayers, newLasting, open, play, universeWith, type Lasting } from './banco';

const SITE = { x: -2, y: -6 };
const BLUEPRINT = ['bbbbb', 'bfffb', 'bfffb', 'bfffb', 'bbdbb'];

/** How many tiles of the house are as the blueprint wants them. */
function finished(k: Kernel): number {
  let n = 0;
  BLUEPRINT.forEach((row, r) => [...row].forEach((c, i) => void (k.tileAt(SITE.x + i, SITE.y + r) === c && n++)));
  return n;
}

const phase = (k: Kernel) => k.ecs.get(k.ecs.query('cantiere')[0], 'cantiere').fase as string;
const placed = (k: Kernel) => k.ecs.get(k.ecs.query('cantiere')[0], 'cantiere').posati as number;

/** Plays until `done` says so, at most `seconds`. */
function playUntil(k: Kernel, done: () => boolean, seconds = 120): void {
  for (let t = 0; t < seconds && !done(); t += DT) k.tick(DT);
}

describe('the building site over a long session', () => {
  it('the work is its own memory: closed halfway, reopened, it goes on from where it was; slab, walls, finishes, in this order', async () => {
    const w: Lasting = newLasting(universeWith('mech.cantiere', 'npc.muratore', 'cantiere.catasta'));
    const first = await open(w);
    const seen = new Set<string>();
    playUntil(first, () => {
      seen.add(phase(first));
      return phase(first) === 'muri' && placed(first) >= 28;
    });
    expect([...seen]).toEqual(['platea', 'muri']);
    const atClose = BLUEPRINT.flatMap((row, r) => [...row].map((_, i) => first.tileAt(SITE.x + i, SITE.y + r))).join('');
    await closeWorld(first, w);

    const second = await open(w);
    second.tick(DT);
    // The tiles are all there: what was built, was built.
    expect(BLUEPRINT.flatMap((row, r) => [...row].map((_, i) => second.tileAt(SITE.x + i, SITE.y + r))).join('')).toBe(atClose);
    // LIMIT (lasting state): the masons are those the plan of the place puts there, back at their start with nothing in hand; the counter of the site is back to zero.
    expect(placed(second)).toBe(0);
    expect(phase(second)).toBe('muri');
    playUntil(second, () => {
      seen.add(phase(second));
      return phase(second) === 'finita';
    });
    expect([...seen]).toEqual(['platea', 'muri', 'finiture', 'finita']);
    expect(finished(second)).toBe(25);
  });

  it('with no material the site says so and waits; with no mason it finds another', async () => {
    const k = await open(newLasting(universeWith('mech.cantiere', 'npc.muratore', 'cantiere.catasta')));
    const ofModule = (id: string) => k.ecs.query('module').filter((e) => k.ecs.get(e, 'module').id === id);
    for (const e of ofModule('cantiere.catasta')) k.ecs.destroy(e);
    for (const e of ofModule('npc.muratore')) k.ecs.destroy(e);
    k.tick(DT);
    expect(ofModule('npc.muratore').length).toBe(1);
    k.tick(DT);
    expect(phase(k)).toBe('manca il materiale');
  });

  it('months of world time do not change the rule: the clock of the world survives the restart', async () => {
    const w = newLasting(universeWith('mech.stagioni'));
    const first = await open(w);
    const season = 90 * 600;
    first.time = 3 * season + 10;
    first.tick(DT);
    expect(first.ecs.get(first.wandererEntity, 'calendario')).toMatchObject({ giorno: 270, stagione: 'inverno' });
    await closeWorld(first, w);
    const second = await open(w);
    expect(second.time).toBeGreaterThanOrEqual(3 * season + 10);
    second.tick(DT);
    expect(second.ecs.get(second.wandererEntity, 'calendario')).toMatchObject({ stagione: 'inverno' });
  });

  it('LIMIT (out of sight): no tile changes where nobody is, a place away from every wanderer does not exist for Lua', async () => {
    const k = await open(newLasting(universeWith('mech.cantiere', 'npc.muratore', 'cantiere.catasta')));
    expect(k.setTile(5000, 5000, 'b')).toBe(false);
    expect(k.tileAt(5000, 5000)).toBeUndefined();
  });
});

describe('what Lua can leave behind for the next opening of the world', () => {
  it('LIMIT (lasting state): a singleton of a module goes back to its manifest, the market forgets its price', async () => {
    const w = newLasting(universeWith('mech.mercato'));
    const first = await open(w);
    for (let i = 0; i < 5; i++) first.uiAction('mercato', 'compra');
    const market = (k: Kernel) => k.ecs.get(k.ecs.query('mercato')[0], 'mercato');
    expect(market(first).prezzo).toBe(15);
    first.uiAction('mercato', 'ricorda');
    await closeWorld(first, w);
    const second = await open(w);
    expect(market(second).prezzo).toBe(10);
    expect(market(second).scorta).toBe(100);
    // Only a state of the wanderer lasts: one wanderer's notebook, not the market's. In the file of that wanderer.
    expect((second.states() as any).taccuino.prezzo).toBe(15);
  });

  it('LIMIT (lasting state): a component on the wanderer does not last either, the same mechanic loses it', async () => {
    const w = newLasting(universeWith('mech.mercato'));
    const first = await open(w);
    first.ecs.set(first.wandererEntity, 'reputazione', { valore: 42 });
    first.tick(DT);
    await closeWorld(first, w);
    const second = await open(w);
    expect(second.ecs.get(second.wandererEntity, 'reputazione')).toBeUndefined();
  });

  it('what a player builds: the wall lasts, the piece of furniture does not, and neither says who made it', async () => {
    const w = newLasting(universeWith('mech.posa'));
    const first = await open(w);
    first.wandererComp().facing = 'down';
    const at = first.wandererCarpet();
    const [col, row] = [Math.floor(at.x), Math.floor(at.y + 2)];
    first.uiAction('posa', 'muro');
    first.uiAction('posa', 'mobile');
    expect(first.tileAt(col, row)).toBe('b');
    const built = first.ecs.query('costruito_da');
    expect(built.length).toBe(1);
    await closeWorld(first, w);
    const second = await open(w);
    expect(second.tileAt(col, row)).toBe('b');
    expect(second.ecs.query('costruito_da')).toEqual([]);
  });

  it('LIMIT (lasting state): the shape of an instance written by Lua is not saved, only what the kernel did itself', async () => {
    const w = newLasting(universeWith('mech.posa'));
    const first = await open(w);
    const pc = first.wandererCarpet();
    const m = first.modules.get('object.crate')!;
    const key = [...first.chunks.keys()][0];
    const id = first.spawnModuleEntity(m, pc.x + 1, pc.y + 1, key, `${key}#o-prova`);
    // What Lua can do to a form: its list of what was done to it (Lua sees the same table).
    first.ecs.get(id, 'form').done = ['alza-i-muri'];
    first.tick(DT);
    await closeWorld(first, w);
    expect(JSON.parse(w.files['world/stato.json']).forme ?? {}).toEqual({});
  });

  it('a fault anywhere does not stop the saves (T262, once a LIMIT): it invalidates code, not the data of the game', async () => {
    const k = await open(newLasting(universeWith('mech.posa')));
    k.give('item.pane', 1);
    k.faults.raise('module:mech.qualsiasi:update', 'rotto');
    expect(k.saveState()).toBe(true);
    k.give('item.pane', 1);
    k.faults.clear('module:mech.qualsiasi:update');
    expect(k.saveState()).toBe(true);
  });
});

describe('seasons', () => {
  it('snow comes tile by tile, and each tile stays forever in the plan of its place', async () => {
    const k = await open(newLasting(universeWith('mech.stagioni')));
    const season = 90 * 600;
    k.time = 3 * season + 1;
    play(k, 1);
    const planned = [...k.chunks.values()].filter((c) => c.plan?.edits);
    const before = planned.reduce((n, c) => n + Object.keys(c.plan!.edits!).length, 0);
    expect(before).toBeGreaterThan(50);
    k.time = 4 * season + 1;
    play(k, 1);
    const after = [...k.chunks.values()].reduce((n, c) => n + Object.keys(c.plan?.edits ?? {}).length, 0);
    // Spring puts the grass back: the edits stay, every year on every place seen.
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

describe('many wanderers in the same world', () => {
  it('a panel is each one’s: who presses is the first argument, the common table is the same, turns can be taken', async () => {
    const w = newLasting(manyPlayers(universeWith('mech.torneo')));
    const k = await open(w);
    k.addWanderer('bea');
    const board = () => k.ecs.get(k.ecs.query('torneo')[0], 'torneo');
    k.uiAction('torneo', 'iscriviti');
    k.as('bea', () => k.uiAction('torneo', 'iscriviti'));
    expect(board().tabellone).toBe('in gioco');
    k.tick(DT);
    const seen = (id: string) => k.as(id, () => k.uiValue('torneo_visto.tocca'));
    expect(seen('io')).toBe('a te');
    expect(seen('bea')).toBe('aspetti');
    // Out of turn: no effect.
    k.as('bea', () => k.uiAction('torneo', 'tira'));
    expect(board().punti_b).toBe(0);
    for (let i = 0; i < 12 && board().turno !== 0; i++) {
      k.uiAction('torneo', 'tira');
      k.as('bea', () => k.uiAction('torneo', 'tira'));
    }
    expect(board().tabellone).toMatch(/^vince/);
  });

  it('a vehicle with more people: the cart carries both bodies by how much, and only one wanderer’s keys exist', async () => {
    const k = await open(newLasting(manyPlayers(universeWith('mech.carro'))));
    k.addWanderer('bea');
    const cart = () => k.ecs.get(k.ecs.query('carro')[0], 'carro');
    k.as('bea', () => k.uiAction('carro', 'sali'));
    k.uiAction('carro', 'sali');
    k.as('bea', () => k.uiAction('carro', 'guida'));
    const before = { io: k.wandererAt('io')!.x, bea: k.wandererAt('bea')!.x };
    for (const c of [k.carpet()]) if (c) c.active = false;
    play(k, 1);
    expect(cart().visti).toBe(2);
    expect(k.wandererAt('bea')!.x - before.bea).toBeGreaterThan(1);
    expect(k.wandererAt('io')!.x - before.io).toBeGreaterThan(1);
    // LIMIT (multiplayer): the system runs once, as whoever holds the default body; bea’s keys do not reach it.
    const io = k.wandererAt('io')!.entity;
    expect(cart().chi).toBe(io);
    k.inputFor = 'bea';
    k.input.setHeld('right', true);
    const keys = cart().tasti;
    play(k, 0.2);
    k.input.releaseAll();
    expect(cart().tasti).toBe(keys);
  });
});

describe('a game on the server, seen from a client', () => {
  it('LIMIT (multiplayer): what a panel shows does not reach the client, nor do the components of a mechanic', async () => {
    const k = await open(newLasting(manyPlayers(universeWith('mech.torneo'))));
    const server = new SessionServer(k);
    const { server: there, client: here } = fakeLink();
    server.connect(there);
    const heard: ServerMsg[] = [];
    here.onMessage((m) => heard.push(m));
    const bea = new SessionClient(here, { id: 'bea' });
    await bea.ready;
    for (let i = 0; i < 30; i++) server.tick(DT);
    // On the server the value is there, on the wire never.
    expect(k.as('bea', () => k.uiValue('torneo_visto.tabellone'))).toBe('aperto');
    const wire = JSON.stringify(heard.filter((m) => m.t === 'ingresso' || m.t === 'aggiorna').map((m) => ({ ...m, files: undefined })));
    expect(wire).toContain('needs');
    expect(wire).not.toContain('torneo_visto');
  });
});

describe('what the Forge of mechanics can write', () => {
  it('LIMIT (the Forge): a system and nothing else, no singleton; common state is an entity spawned at the first use', async () => {
    const k = await open(newLasting(universeWith('mech.posa')));
    const r = await k.forgeMechanic('una meccanica di prova');
    expect(r.ok).toBe(true);
    const manifest = JSON.parse(k.files[`modules/${r.id}/manifest.json`]);
    expect(manifest.singleton).toBeUndefined();
    expect(Object.keys(manifest).sort()).toEqual(expect.arrayContaining(['id', 'kind', 'logic', 'ui']));
  });

  it('the way around, in the Engineer’s reach: the first who needs it spawns it, then everybody finds it', async () => {
    const lazy = 'local M = {}\nfunction M.on_ui(user, a)\n  local id = ecs.first("comune") or ecs.spawn({ comune = { n = 0 } })\n  local c = ecs.get(id, "comune")\n  c.n = c.n + 1\n  return nil\nend\nfunction M.update(dt) end\nreturn M\n';
    const k = await open(newLasting(manyPlayers({ ...universeWith('mech.posa'), 'modules/mech.posa/logic.lua': lazy })));
    k.addWanderer('bea');
    k.uiAction('posa', 'muro');
    k.as('bea', () => k.uiAction('posa', 'muro'));
    expect(k.ecs.query('comune').length).toBe(1);
    expect(k.ecs.get(k.ecs.query('comune')[0], 'comune').n).toBe(2);
  });
});

describe('what a panel and the API cannot say', () => {
  it('LIMIT (panels): a board is not possible, sixteen elements at most; a text field is not an element', () => {
    const board = Array.from({ length: 64 }, (_, i) => ({ tipo: 'pulsante', id: `c${i}`, etichetta: '' }));
    expect(cleanPanel({ titolo: 'Scacchi', elementi: board }, 'scacchi').panel!.elementi.length).toBe(16);
    expect(cleanPanel({ titolo: 'x', elementi: [{ tipo: 'campo', id: 'riga', etichetta: 'Comando' }, { tipo: 'griglia', id: 'g', etichetta: '' }] }, 'x').errors).toEqual(['il pannello non ha elementi validi']);
  });

  it('LIMIT (events): what the API refuses, each a thing a scenario asked for', () => {
    const asked: Array<[string, string]> = [
      ['bus.on("morte", f)', 'bus.on'],
      ['ui.open("terminale")', 'ui.open'],
      ['world.path(0, 0, 5, 5)', 'world.path'],
      ['world.daylight()', 'world.daylight'],
      ['world.store("mercato")', 'world.store'],
      ['world.wanderers()', 'world.wanderers'],
      ['input.pressed("action")', 'input.pressed'],
      ['ecs.save(id)', 'ecs.save'],
    ];
    for (const [code, name] of asked) expect(apiErrors(code).join()).toContain(`${name} non esiste`);
  });

  it('LIMIT (Council): Lua has no way to ask the Council for anything: what a module emits reaches the kernel\'s bus, and no agent listens', async () => {
    const asks = 'local M = {}\nfunction M.update(dt) bus.emit("concilio", { chiede = "un ponte" }) end\nreturn M\n';
    const k = await open(newLasting({ ...universeWith('mech.posa'), 'modules/mech.posa/logic.lua': asks }));
    const heard: unknown[] = [];
    k.bus.on('lua:concilio', (d) => heard.push(d));
    play(k, 0.2);
    expect(heard.length).toBeGreaterThan(0);
    expect(k.feed().some((e) => e.text.includes('un ponte'))).toBe(false);
  });
});
