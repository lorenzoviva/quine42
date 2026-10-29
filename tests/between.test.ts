import { describe, expect, it } from 'vitest';
import { GIVE_REACH, Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { countItem } from '../src/kernel/inventory';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';

// Between wanderers (T43a): words with a bubble, things given, to whoever is near.

const DT = 1 / 60;

async function bootMany(game: Record<string, unknown> = {}): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3, ...game } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

async function thin(server: SessionServer, id: string, nome: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, nome });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), models: new MockModels(), mirror: true });
  return new ThinClient(k, session);
}

function run(server: SessionServer, clients: ThinClient[], frames: number) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

/** Puts a wanderer of the session somewhere in the world (their carpet under them). */
function put(k: Kernel, id: string, to: { x: number; y: number }) {
  k.as(id, () => {
    const p = k.playerPos();
    Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  });
}

/** Waits for an answer while the world goes on (the server answers when it ticks). */
async function ask<T>(server: SessionServer, clients: ThinClient[], p: Promise<T>): Promise<T> {
  let done = false;
  void p.finally(() => (done = true));
  for (let i = 0; i < 200 && !done; i++) {
    run(server, clients, 1);
    await new Promise((r) => setTimeout(r, 0));
  }
  return p;
}

const avatarOf = (c: ThinClient, id: string) => c.k.ecs.query('remote').find((e) => c.k.ecs.get(e, 'remote').id === id);

/** Anna and Bruno side by side, Carlo far from both, each with a browser of their own. */
async function three(game: Record<string, unknown> = {}) {
  const k = await bootMany(game);
  const server = new SessionServer(k);
  const anna = await thin(server, 'anna', 'Anna');
  const bruno = await thin(server, 'bruno', 'Bruno');
  const carlo = await thin(server, 'carlo', 'Carlo');
  const at = k.wandererAt('anna')!;
  put(k, 'bruno', { x: at.x + 1, y: at.y });
  put(k, 'carlo', { x: at.x + server.near + 6, y: at.y });
  const all = [anna, bruno, carlo];
  run(server, all, 12);
  return { k, server, anna, bruno, carlo, all };
}

/** A stackable item of the universe that is not a rune nor a bag. */
function stackable(k: Kernel): string {
  const d = [...k.content.items.values()].find((i) => i.stack > 1 && !i.id.startsWith('rune:') && !i.container);
  if (!d) throw new Error('nessun oggetto da impilare');
  return d.id;
}

describe('words and gifts between wanderers (T43a)', () => {
  it('words to who is near: a bubble the near see, heard in the chat; no filter of the fourth wall; too far, refused', async () => {
    const { k, server, anna, bruno, carlo, all } = await three();
    // The menu of another wanderer: to talk, and (with something in hand) to give.
    const b = avatarOf(anna, 'bruno')!;
    expect(b).toBeDefined();
    expect(anna.k.actionsFor(b)[0].id).toBe('parla');
    const heard: Array<{ name: string; text: string }> = [];
    bruno.k.bus.on('ui:heard', (e) => heard.push(e));
    // Between people, words are theirs: nothing is filtered, not even the game itself.
    const words = 'ciao Bruno, questa simulazione del Concilio è strana';
    const reply = await ask(server, all, anna.k.talk(b, words));
    expect(reply.say).toBe('');
    run(server, all, 8);
    expect(bruno.session.notices).toEqual([{ tipo: 'dici', da: 'anna', nome: 'Anna', testo: words }]);
    expect(heard).toEqual([{ id: avatarOf(bruno, 'anna'), name: 'Anna', text: words }]);
    // The bubble: above Anna for Bruno, above herself for Anna; Carlo is too far to see her.
    expect(bruno.k.bubbles.get(avatarOf(bruno, 'anna')!)?.text).toBe(words);
    expect(anna.k.bubbles.get(anna.k.playerId)?.text).toBe(words);
    expect(carlo.session.others.has('anna')).toBe(false);
    expect(carlo.session.notices).toEqual([]);
    // Words to someone too far do not reach them.
    const far = await ask(server, all, anna.session.act({ t: 'dici', viandante: 'carlo', testo: 'mi senti?' }));
    expect(far.ok).toBe(false);
    expect(far.messaggi?.join(' ')).toMatch(/troppo lontano/);
    // To nobody, or to oneself, nothing.
    expect((await ask(server, all, anna.session.act({ t: 'dici', viandante: 'nessuno', testo: 'ehi' }))).ok).toBe(false);
    expect((await ask(server, all, anna.session.act({ t: 'dici', viandante: 'anna', testo: 'ehi' }))).ok).toBe(false);
    run(server, all, 8);
    expect(carlo.session.notices).toEqual([]);
    // The server's own word on what was said: the bubble is on Anna's body.
    expect(k.bubbles.get(k.wandererAt('anna')!.entity)?.text).toBe(words);
  }, 60000);

  it('a gift goes to who is beside: part of a stack, a whole bag with its runes (the phrase forgets them); too far or no room, refused', async () => {
    const { k, server, anna, bruno, all } = await three();
    const item = stackable(k);
    k.as('anna', () => {
      k.give(item, 3);
      const inv = k.inventory();
      inv.equipped = inv.slots.findIndex((s) => s?.item === item);
    });
    run(server, all, 8);
    // What is at hand (the hotbar), the menu offers to give.
    const b = avatarOf(anna, 'bruno')!;
    const slot = k.as('anna', () => k.inventory().equipped)!;
    expect(anna.k.actionsFor(b).find((o) => o.id === `dai:${slot}`)?.label).toMatch(/ ×3$/);
    const two = await ask(server, all, anna.session.act({ t: 'dai', viandante: 'bruno', slot, quanti: 2 }));
    expect(two.ok).toBe(true);
    expect(k.as('anna', () => countItem(k.inventory(), item))).toBe(1);
    expect(k.as('bruno', () => countItem(k.inventory(), item))).toBe(2);
    // From the menu, what is left in hand: all of it.
    await ask(server, all, anna.k.perform(b, `dai:${slot}`));
    expect(k.as('anna', () => countItem(k.inventory(), item))).toBe(0);
    expect(k.as('bruno', () => countItem(k.inventory(), item))).toBe(3);
    run(server, all, 8);
    expect(bruno.session.notices.map((n) => [n.tipo, n.da])).toEqual([
      ['dai', 'anna'],
      ['dai', 'anna'],
    ]);
    // What Bruno's browser has is what the server says.
    expect(countItem(bruno.k.inventory(), item)).toBe(3);
    // The pouch of runes, whole: the rune goes with it, and leaves Anna's phrase.
    k.as('anna', () => {
      k.give('rune:luce', 1);
      Object.assign(k.hand(), { tokens: ['luce'], sel: 0 });
    });
    const pouch = k.as('anna', () => k.inventory().slots.findIndex((s) => !!s?.inv && countItem(s.inv, 'rune:luce') > 0));
    expect(pouch).toBeGreaterThanOrEqual(0);
    const bags = k.as('bruno', () => k.inventory().slots.filter((s) => s?.inv).length);
    expect((await ask(server, all, anna.session.act({ t: 'dai', viandante: 'bruno', slot: pouch }))).ok).toBe(true);
    expect(k.as('anna', () => [countItem(k.inventory(), 'rune:luce'), k.hand().tokens.length])).toEqual([0, 0]);
    expect(k.as('bruno', () => [k.inventory().slots.filter((s) => s?.inv).length, countItem(k.inventory(), 'rune:luce')])).toEqual([bags + 1, 1]);
    // Too far: nothing moves.
    k.as('anna', () => k.give(item, 1));
    const one = k.as('anna', () => k.inventory().slots.findIndex((s) => s?.item === item));
    const at = k.wandererAt('anna')!;
    put(k, 'bruno', { x: at.x + GIVE_REACH + 2, y: at.y });
    run(server, all, 4);
    const far = await ask(server, all, anna.session.act({ t: 'dai', viandante: 'bruno', slot: one }));
    expect(far.ok).toBe(false);
    expect(far.messaggi?.join(' ')).toMatch(/Avvicinati/);
    // No room: Bruno's pockets are all full of something else.
    put(k, 'bruno', { x: at.x + 1, y: at.y });
    run(server, all, 4);
    k.as('bruno', () => k.inventory().slots.fill({ item: 'rune:x', count: 1 }));
    const full = await ask(server, all, anna.session.act({ t: 'dai', viandante: 'bruno', slot: one }));
    expect(full.ok).toBe(false);
    expect(full.messaggi?.join(' ')).toMatch(/non ha posto/);
    expect(k.as('anna', () => countItem(k.inventory(), item))).toBe(1);
    // A pocket that is not there: refused before the kernel.
    expect((await ask(server, all, anna.session.act({ t: 'dai', viandante: 'bruno', slot: 99 }))).ok).toBe(false);
  }, 60000);
});

describe('«Altro…» and PvP between wanderers (T43b)', () => {
  const health = (k: Kernel, id: string) => k.ecs.get(k.wandererAt(id)!.entity, 'needs').health as number;
  const hurt = (k: Kernel, id: string, to: number) => (k.ecs.get(k.wandererAt(id)!.entity, 'needs').health = to);

  it('without PvP: judged as on a person, what helps arrives on the other, what harms the kernel takes away', async () => {
    const { k, server, anna, bruno, all } = await three({ pvp: false });
    const b = avatarOf(anna, 'bruno')!;
    expect(anna.k.actionsFor(b).map((o) => o.id)).toContain('altro');
    hurt(k, 'bruno', 50);
    const before = k.wandererAt('bruno')!;
    await ask(server, all, anna.k.freeAction(b, 'colpisci'));
    expect(health(k, 'bruno')).toBeCloseTo(50, 0);
    await ask(server, all, anna.k.freeAction(b, 'spingi'));
    const after = k.wandererAt('bruno')!;
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(0.3);
    expect(k.feed().some((e) => e.task === 'action.judge' && /tra viandanti non ci si ferisce/.test(e.text))).toBe(true);
    // Care is not harm: it heals Bruno, not Anna.
    hurt(k, 'anna', 40);
    await ask(server, all, anna.k.freeAction(b, 'curi le ferite'));
    expect(health(k, 'bruno')).toBeCloseTo(65, 0);
    expect(health(k, 'anna')).toBeCloseTo(40, 0);
    run(server, all, 8);
    expect(bruno.session.notices.filter((n) => n.tipo === 'altro').map((n) => n.da)).toEqual(['anna', 'anna', 'anna']);
  }, 60000);

  it('with PvP: a blow hurts the other, a push moves them on their carpet; the master in god mode takes only words', async () => {
    const { k, server, anna, all } = await three({ pvp: true });
    const b = avatarOf(anna, 'bruno')!;
    hurt(k, 'bruno', 50);
    hurt(k, 'anna', 50);
    await ask(server, all, anna.k.freeAction(b, 'colpisci'));
    expect(health(k, 'bruno')).toBeCloseTo(30, 0);
    expect(health(k, 'anna')).toBeCloseTo(50, 0);
    const before = k.wandererAt('bruno')!;
    k.as('anna', () => k.touchWanderer('bruno', [{ tipo: 'spingi', forza: 2 }]));
    const after = k.wandererAt('bruno')!;
    expect(after.x - before.x).toBeGreaterThan(0.5);
    // The master: nothing but words reach them, PvP or not.
    const master = k.partita().master ?? 'io';
    const at = k.wandererAt('anna')!;
    put(k, master, { x: at.x, y: at.y + 1 });
    const m = k.wandererAt(master)!;
    k.ecs.get(m.entity, 'needs').health = 100;
    const out = k.as('anna', () => k.touchWanderer(master, [{ tipo: 'bisogni', salute: -30 }, { tipo: 'spingi', forza: 3 }, { tipo: 'messaggio', testo: 'Prendi!' }]));
    expect(out).toContain('Prendi!');
    expect(k.ecs.get(m.entity, 'needs').health).toBe(100);
    const still = k.wandererAt(master)!;
    expect(Math.hypot(still.x - m.x, still.y - m.y)).toBeLessThan(1e-6);
  }, 60000);

  it('without «Altro…» between players: not in the menu, refused by the server, no call to the Council', async () => {
    const { k, server, anna, all } = await three({ pvp: true, altroTraGiocatori: false });
    const b = avatarOf(anna, 'bruno')!;
    expect(anna.k.actionsFor(b).map((o) => o.id)).not.toContain('altro');
    hurt(k, 'bruno', 50);
    const r = await ask(server, all, anna.session.act({ t: 'altro', viandante: 'bruno', testo: 'colpisci' }));
    expect(r.messaggi?.join(' ')).toMatch(/non si fa «Altro…»/);
    expect(health(k, 'bruno')).toBeCloseTo(50, 0);
    expect(k.feed().some((e) => e.task === 'action.judge')).toBe(false);
  }, 60000);
});

describe('death and reconnection among many (T43c)', () => {
  const thirst = (k: Kernel, id: string) =>
    k.as(id, () => Object.assign(k.needs()!, { thirst: 0, health: 0.2 }));

  async function tickUntil(server: SessionServer, clients: ThinClient[], done: () => boolean) {
    for (let i = 0; i < 240 && !done(); i++) {
      run(server, clients, 1);
      await new Promise((r) => setTimeout(r, 0));
    }
    run(server, clients, 8);
  }

  it('a player dies of thirst with the punishment of the game while the others go on; the master never dies', async () => {
    const { k, server, anna, bruno, all } = await three({ morte: 3 });
    const item = stackable(k);
    put(k, 'anna', { x: 5.5, y: 0.5 });
    k.as('anna', () => {
      k.give(item, 2);
      k.give('rune:luce', 1);
      Object.assign(k.hand(), { tokens: ['luce'], sel: 0 });
      k.applyEffects([{ tipo: 'stato', nome: 'febbre', velocita: 0.9 }]);
    });
    k.as('bruno', () => k.give(item, 1));
    run(server, all, 8);
    const said: string[] = [];
    anna.k.bus.on('ui:message', (m) => said.push(m.text));
    const calls: Array<{ task: string; chi?: string; data?: unknown }> = [];
    const origText = k.models.text.bind(k.models);
    k.models.text = (c) => {
      calls.push({ task: c.task, chi: c.chi, data: c.data });
      return origText(c);
    };
    const brunoBefore = k.time;
    // Both the master and Anna run out of water and health: only the player dies, the world does not stop.
    thirst(k, 'io');
    thirst(k, 'anna');
    await tickUntil(server, all, () => anna.session.notices.some((n) => n.tipo === 'morte'));
    expect(k.dead).toBe(false);
    expect(k.as('io', () => k.needs())).toMatchObject({ hunger: 100, thirst: 100, health: 100, morto: false });
    expect(k.time).toBeGreaterThan(brunoBefore);
    expect(countItem(bruno.k.inventory(), item)).toBe(1);
    expect(calls.find((c) => c.task === 'player.death')).toMatchObject({ chi: 'anna' });
    // Punishment 3 (dura): back at the square (0, 0), nothing left of what she carried or her states, fresh needs.
    expect(k.wandererAt('anna')).toMatchObject({ x: 0, y: 0 });
    expect(anna.k.playerCarpet()).toMatchObject({ x: 0, y: 0 });
    expect(countItem(anna.k.inventory(), item)).toBe(0);
    expect(anna.k.hand().tokens).toEqual([]);
    expect(anna.k.states()).toEqual({});
    expect(anna.k.needs()!.health).toBeGreaterThan(50);
    expect(anna.k.needs()!.thirst).toBeGreaterThan(50);
    expect(said.some((m) => /Sei morto di sete/.test(m))).toBe(true);

    // Punishment 0 (nessuna): she wakes up where she fell, with what she carried.
    const mild = await three({ morte: 0 });
    put(mild.k, 'anna', { x: 6.5, y: -3.5 });
    mild.k.as('anna', () => mild.k.give(item, 2));
    run(mild.server, mild.all, 8);
    thirst(mild.k, 'anna');
    await tickUntil(mild.server, mild.all, () => mild.anna.session.notices.some((n) => n.tipo === 'morte'));
    expect(mild.anna.k.playerCarpet()).toMatchObject({ x: 6.5, y: -3.5 });
    expect(countItem(mild.anna.k.inventory(), item)).toBe(2);
    expect(mild.anna.k.needs()!.health).toBeGreaterThan(50);
  }, 60000);

  it('who leaves and comes back finds their position, inventory, phrase, states, card and bonds as they left them', async () => {
    const { k, server, anna, bruno, carlo, all } = await three();
    const item = stackable(k);
    put(k, 'anna', { x: 6.5, y: -2.5 });
    const npc = k.spawnModuleEntity(k.modules.get('npc.villager')!, 6.5, -1.5, undefined, 't43c#v');
    const vName = (await k.ensureIdentity(npc))!.name;
    k.as('anna', () => {
      k.give(item, 2);
      k.give('rune:luce', 1);
      Object.assign(k.hand(), { tokens: ['luce'], sel: 0 });
      k.applyEffects([{ tipo: 'stato', nome: 'benedizione', velocita: 1.2 }]);
      k.setBond(vName, 'amica');
      k.recordRule({ chiave: 'azione|canto', testo: 'cantare', possibile: true, racconto: 'canti' }, true, { task: 'action.judge', autore: 'narratore' });
    });
    run(server, all, 8);
    expect(k.cardsOf('anna').some((c) => c.id === 'regola:azione-canto')).toBe(true);

    // Anna leaves while Bruno and Carlo stay in the world.
    anna.session.leave();
    run(server, [bruno, carlo], 8);
    expect(server.connected()).toEqual(['bruno', 'carlo']);
    expect(JSON.parse(k.files['world/giocatori/anna.json']).pos).toEqual({ x: 6.5, y: -2.5 });

    // Anna reconnects: her state, card and bond are all there.
    const back = await thin(server, 'anna', 'Anna');
    run(server, [back, bruno, carlo], 8);
    expect(k.wandererAt('anna')).toMatchObject({ x: 6.5, y: -2.5 });
    expect(back.k.playerCarpet()).toMatchObject({ x: 6.5, y: -2.5 });
    expect(countItem(back.k.inventory(), item)).toBe(2);
    expect(countItem(back.k.inventory(), 'rune:luce')).toBe(1);
    expect(back.k.hand().tokens).toEqual(['luce']);
    expect(back.k.states().benedizione).toMatchObject({ velocita: 1.2 });
    expect(k.cardsOf('anna').some((c) => c.id === 'regola:azione-canto')).toBe(true);
    expect(k.as('anna', () => k.bondOf(vName))).toBe('amica');
  }, 60000);
});
