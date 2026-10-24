import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { countItem } from '../src/kernel/inventory';

const DT = 1 / 60;

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
}

/** A browser of a game of many, without the browser: a session, and a mirror kernel filled by the thin client. */
async function thin(server: SessionServer, id: string, nome?: string): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  server.connect(s);
  const session = new SessionClient(c, { id, nome });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), models: new MockModels(), mirror: true });
  return new ThinClient(k, session);
}

/** Frames of the clients (their kernels walk, then they send) and ticks of the server, as in time. */
function run(server: SessionServer, clients: ThinClient[], frames: number) {
  for (let i = 0; i < frames; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

async function settle(server: SessionServer, clients: ThinClient[]) {
  for (let i = 0; i < 80; i++) {
    run(server, clients, 1);
    await new Promise((r) => setTimeout(r, 25));
    if ([...server.kernel.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  run(server, clients, 12);
}

/** A run of free tiles toward east, at least 10 tiles from where the wanderer is (the server carries them there). */
function freeRunAway(k: Kernel, id: string, length: number): { x: number; y: number } {
  const at = k.wandererAt(id)!;
  for (let d = 10; d < 40; d++)
    for (const row of [Math.floor(at.y) + d, Math.floor(at.y) - d])
      for (let col = Math.floor(at.x) - 20; col < Math.floor(at.x) + 20; col++) {
        let ok = true;
        for (let i = -1; i <= length + 1 && ok; i++) ok = k.free(col + i + 0.5, row + 0.5, 0.4) && k.tileAt(col + i, row) !== undefined;
        if (ok) return { x: col + 0.5, y: row + 0.5 };
      }
  throw new Error('nessun tratto libero');
}

function put(k: Kernel, id: string, to: { x: number; y: number }) {
  k.as(id, () => {
    const p = k.playerPos();
    Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  });
}

/** The entity of a mirror that stands for another wanderer. */
const avatarOf = (c: ThinClient, id: string) => c.k.ecs.query('remote').find((e) => c.k.ecs.get(e, 'remote').id === id);

describe('the thin client (T39)', () => {
  it('two clients see each other walk, each with their look; the mirror makes nothing of its own', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna', 'Anna');
    const bruno = await thin(server, 'bruno', 'Bruno');
    await settle(server, [anna, bruno]);
    // The mirror has the server's places, and nothing it made itself.
    expect(anna.k.chunks.size).toBeGreaterThan(0);
    for (const [key, ch] of anna.k.chunks) expect(ch.tiles).toBe(anna.session.places.get(key)!.tiles);
    expect(anna.k.ecs.query('pickup').length).toBe([...anna.session.things.values()].filter((t) => t.c?.pickup).length);
    // Each sees the other as a wanderer of their own colour.
    const b = avatarOf(anna, 'bruno');
    expect(b).toBeDefined();
    expect(anna.k.ecs.get(b!, 'identity').name).toBe('Bruno');
    expect(anna.k.ecs.get(b!, 'form')).toMatchObject({ model: 'viandante', tint: k.ecs.get(k.wandererAt('bruno')!.entity, 'form').tint });
    expect(anna.k.ecs.get(b!, 'form').tint).not.toBe(anna.k.ecs.get(anna.k.playerId, 'form').tint);
    expect(anna.k.ecs.get(anna.k.playerId, 'form').tint).toBe(k.ecs.get(k.wandererAt('anna')!.entity, 'form').tint);
    // Her first steps from where she came in reach the server (walked, or corrected where she cannot go).
    const entered = k.wandererAt('anna')!;
    anna.k.input.setHeld('left', true);
    run(server, [anna, bruno], 10);
    anna.k.input.setHeld('left', false);
    run(server, [anna, bruno], 6);
    const moved = k.wandererAt('anna')!;
    expect(Math.hypot(moved.x - entered.x, moved.y - entered.y) > 0.05 || anna.session.corrections > 0).toBe(true);
    expect(anna.k.playerCarpet().x).toBeCloseTo(moved.x, 1);
    // The server carries Anna to a stretch of open ground: her client follows.
    const start = freeRunAway(k, 'anna', 6);
    put(k, 'anna', start);
    run(server, [anna, bruno], 12);
    expect(anna.k.playerCarpet().x).toBeCloseTo(start.x, 1);
    // Anna walks east, the keys held in her browser: she moves at once, the server lets every step through.
    const was = anna.session.corrections;
    anna.k.input.setHeld('right', true);
    run(server, [anna, bruno], 30);
    anna.k.input.setHeld('right', false);
    run(server, [anna, bruno], 12);
    const there = k.wandererAt('anna')!;
    expect(there.x - start.x).toBeGreaterThan(2);
    expect(anna.session.corrections).toBe(was);
    expect(anna.k.playerCarpet().x).toBeCloseTo(there.x, 1);
    // Bruno sees her where she is, if she is near enough to be seen.
    const near = Math.hypot(there.x - k.wandererAt('bruno')!.x, there.y - k.wandererAt('bruno')!.y) <= server.near;
    const a = avatarOf(bruno, 'anna');
    if (near) {
      expect(a).toBeDefined();
      const p = bruno.k.ecs.get(a!, 'pos');
      expect(Math.hypot(p.x - there.x, p.y - there.y)).toBeLessThan(0.2);
    } else expect(a).toBeUndefined();
    // What she says is above her head for the other.
    put(k, 'anna', { x: k.wandererAt('bruno')!.x + 1, y: k.wandererAt('bruno')!.y });
    k.bubbles.set(k.wandererAt('anna')!.entity, { text: 'ciao', until: k.time + 10 });
    run(server, [anna, bruno], 12);
    expect(bruno.k.bubbles.get(avatarOf(bruno, 'anna')!)?.text).toBe('ciao');
    // Who leaves is gone from the other's world.
    bruno.session.leave();
    run(server, [anna], 12);
    expect(avatarOf(anna, 'bruno')).toBeUndefined();
  });

  it('a client that runs ahead of its pace is put back where the server has it', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna');
    await settle(server, [anna]);
    const start = freeRunAway(k, 'anna', 6);
    put(k, 'anna', start);
    run(server, [anna], 12);
    // Five tiles in one frame (a carpet pushed by hand, as a cheat would).
    const c = anna.k.carpet()!;
    c.ox += 5;
    run(server, [anna], 20);
    expect(anna.session.corrections).toBeGreaterThan(0);
    const server_ = k.wandererAt('anna')!;
    expect(anna.k.playerCarpet().x).toBeCloseTo(server_.x, 1);
    expect(server_.x - start.x).toBeLessThan(5);
  });

  it('what the wanderer does shows at once, and is undone if the server refuses', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna');
    await settle(server, [anna]);
    const start = freeRunAway(k, 'anna', 8);
    put(k, 'anna', start);
    run(server, [anna], 12);
    // Something on the ground next to her, and something out of reach.
    const item = [...anna.k.content.items.keys()].find((i) => !i.startsWith('rune:'))!;
    const close = k.spawnItem(item, start.x + 1, start.y);
    const far = k.spawnItem(item, start.x + 7, start.y);
    run(server, [anna], 12);
    const mirrorOf = (sid: number) => anna.k.ecs.query('pickup').find((e) => {
      const p = anna.k.ecs.get(e, 'pos');
      const t = anna.session.things.get(sid);
      return t && Math.abs(p.x - t.x) < 0.01 && Math.abs(p.y - t.y) < 0.01;
    });
    const near = mirrorOf(close)!;
    const away = mirrorOf(far)!;
    expect(near).toBeDefined();
    expect(away).toBeDefined();
    // Picked up: gone at once in her world, then in her bag as the server says.
    void anna.k.perform(near, 'raccogli');
    expect(anna.k.ecs.alive.has(near)).toBe(false);
    run(server, [anna], 12);
    await new Promise((r) => setTimeout(r, 0));
    run(server, [anna], 12);
    expect(k.ecs.alive.has(close)).toBe(false);
    expect(anna.k.inventory().slots.some((s) => s?.item === item)).toBe(true);
    expect(anna.k.ecs.query('pickup').some((e) => anna.k.ecs.get(e, 'pos').x === anna.session.things.get(close)?.x)).toBe(false);
    // Out of reach: it vanishes, the server says no, it is back.
    void anna.k.perform(away, 'raccogli');
    expect(anna.k.ecs.alive.has(away)).toBe(false);
    run(server, [anna], 3);
    await new Promise((r) => setTimeout(r, 0));
    run(server, [anna], 12);
    expect(k.ecs.alive.has(far)).toBe(true);
    expect(mirrorOf(far)).toBeDefined();
    // The phrase: composed here, inscribed at once; at the end the hand is what the server has.
    k.as('anna', () => k.give('rune:luce', 2));
    run(server, [anna], 12);
    expect(anna.k.composeRune('luce')).toBe(true);
    run(server, [anna], 12);
    expect(k.as('anna', () => k.hand().tokens)).toEqual(['luce']);
    anna.k.inscribeHand();
    expect(anna.k.hand().tokens).toEqual([]);
    run(server, [anna], 3);
    await new Promise((r) => setTimeout(r, 0));
    run(server, [anna], 12);
    expect(anna.k.hand().tokens).toEqual(k.as('anna', () => k.hand().tokens));
    // What a game of many does not do yet says so, and changes nothing.
    const before = JSON.stringify(anna.k.inventory());
    anna.k.rollback();
    expect(JSON.stringify(anna.k.inventory())).toBe(before);
  });
});

/** Frames and ticks until what was asked has its answer, then the update after it. */
async function until<T>(server: SessionServer, clients: ThinClient[], p: Promise<T>): Promise<T> {
  let done = false;
  let value: T | undefined;
  void p.then((v) => {
    done = true;
    value = v;
  });
  for (let i = 0; i < 400 && !done; i++) {
    run(server, clients, 1);
    await new Promise((r) => setTimeout(r, 0));
  }
  expect(done).toBe(true);
  await flush(server, clients);
  return value as T;
}

/** A few rounds of messages, answers and updates (for what the kernel does without a promise). */
async function flush(server: SessionServer, clients: ThinClient[]) {
  for (let i = 0; i < 4; i++) {
    run(server, clients, 4);
    await new Promise((r) => setTimeout(r, 0));
  }
  run(server, clients, 8);
}

/** Anna in a game of many, on open ground, with what the test gives her. */
async function annaAlone(prepare?: (k: Kernel) => Promise<void>) {
  const k = await bootMany();
  await prepare?.(k);
  const server = new SessionServer(k);
  const anna = await thin(server, 'anna');
  await settle(server, [anna]);
  const start = freeRunAway(k, 'anna', 8);
  put(k, 'anna', start);
  run(server, [anna], 12);
  const said: string[] = [];
  anna.k.bus.on('ui:message', (m) => said.push(m.text));
  const dialogs: string[] = [];
  anna.k.bus.on('ui:dialog', (d) => dialogs.push(d.text));
  return { k, server, anna, start, said, dialogs };
}

const slotOf = (k: Kernel, item: string) => k.inventory().slots.findIndex((s) => s?.item === item);

describe('what is carried, among many (T39b)', () => {
  it('pockets: a slot moves at once, held, used, dropped, put into and taken from a bag, a learned action', async () => {
    const { k, server, anna, start, said } = await annaAlone();
    const serverInv = () => k.as('anna', () => k.inventory());
    k.as('anna', () => {
      k.give('item.mela-rossa', 3);
      k.give('item.coltello', 1);
      k.give('item.sacca', 1);
      k.give('item.pane', 2);
    });
    const changed: number[] = [];
    anna.k.bus.on('inventory:changed', () => changed.push(1));
    run(server, [anna], 12);
    expect(changed.length).toBeGreaterThan(0);
    expect(countItem(anna.k.inventory(), 'item.mela-rossa')).toBe(3);
    // Moved: in the new pocket at once here, then on the server too; the updates meanwhile do not move it back.
    const apple = slotOf(anna.k, 'item.mela-rossa');
    const free = anna.k.inventory().slots.findIndex((x, i) => !x && i > 6);
    anna.k.moveSlot(apple, free);
    expect(anna.k.inventory().slots[free]?.item).toBe('item.mela-rossa');
    run(server, [anna], 1);
    expect(anna.k.inventory().slots[free]?.item).toBe('item.mela-rossa');
    await flush(server, [anna]);
    expect(serverInv().slots[free]?.item).toBe('item.mela-rossa');
    expect(anna.k.inventory().slots[free]?.item).toBe('item.mela-rossa');
    // Held: at once here, with the server's words.
    const knife = slotOf(anna.k, 'item.coltello');
    anna.k.equipSlot(knife);
    expect(anna.k.inventory().equipped).toBe(knife);
    await flush(server, [anna]);
    expect(serverInv().equipped).toBe(knife);
    expect(said.some((m) => m.startsWith('Impugni'))).toBe(true);
    // Eaten: one apple less, when the server says so.
    anna.k.useSlot(free);
    await flush(server, [anna]);
    expect(countItem(serverInv(), 'item.mela-rossa')).toBe(2);
    expect(countItem(anna.k.inventory(), 'item.mela-rossa')).toBe(2);
    // Dropped: gone from the pocket at once, on the ground in front of her for the server and for her.
    const before = anna.k.ecs.query('pickup').length;
    anna.k.dropSlot(free, 1);
    expect(countItem(anna.k.inventory(), 'item.mela-rossa')).toBe(1);
    await flush(server, [anna]);
    expect(countItem(serverInv(), 'item.mela-rossa')).toBe(1);
    expect(countItem(anna.k.inventory(), 'item.mela-rossa')).toBe(1);
    expect(anna.k.ecs.query('pickup').length).toBe(before + 1);
    const dropped = anna.k.ecs.query('pickup').find((e) => anna.k.ecs.get(e, 'pickup').item === 'item.mela-rossa')!;
    expect(Math.hypot(anna.k.ecs.get(dropped, 'pos').x - start.x, anna.k.ecs.get(dropped, 'pos').y - start.y)).toBeLessThan(1.5);
    // The bag opens here; the bread goes in at once and on the server; then it comes out again.
    const bag = slotOf(anna.k, 'item.sacca');
    const bags: number[] = [];
    anna.k.bus.on('ui:bag', ({ slot }) => bags.push(slot));
    anna.k.useSlot(bag);
    expect(bags).toEqual([bag]);
    anna.k.putIntoBag(bag, slotOf(anna.k, 'item.pane'));
    expect(countItem(anna.k.bag(bag)!, 'item.pane')).toBe(2);
    await flush(server, [anna]);
    expect(countItem(k.as('anna', () => k.bag(bag)!), 'item.pane')).toBe(2);
    expect(countItem(anna.k.bag(bag)!, 'item.pane')).toBe(2);
    anna.k.takeFromBag(bag, 0);
    await flush(server, [anna]);
    expect(countItem(serverInv(), 'item.pane')).toBe(2);
    expect(countItem(anna.k.inventory(), 'item.pane')).toBe(2);
    // A learned action of something carried: the server does it, its words come back.
    k.content.get('item.pane')!.actions = [{ id: 'spezza', label: 'Spezza', effects: [{ tipo: 'messaggio', testo: 'Lo spezzi a metà.' }] }];
    anna.k.itemAct(slotOf(anna.k, 'item.pane'), 'spezza');
    await flush(server, [anna]);
    expect(said.some((m) => m.includes('Lo spezzi a metà.'))).toBe(true);
    // «Altro…» on it: the Council's answer.
    expect(typeof (await until(server, [anna], anna.k.freeItemAction(slotOf(anna.k, 'item.pane'), 'lo annuso')))).toBe('string');
    // A pocket that does not exist is refused, and nothing changes.
    const was = JSON.stringify(serverInv());
    const r = await until(server, [anna], anna.session.act({ t: 'oggetto', op: 'sposta', slot: 99, verso: 0 }));
    expect(r.ok).toBe(false);
    expect(JSON.stringify(serverInv())).toBe(was);
  }, 30_000);

  it('crafting: a known recipe, a free one, two things put together', async () => {
    const { k, server, anna } = await annaAlone();
    k.as('anna', () => {
      k.give('item.stoffa', 2);
      k.give('item.coltello', 1);
      k.give('item.mela-rossa', 1);
    });
    run(server, [anna], 12);
    expect(anna.k.recipes().available.has('ricetta.benda')).toBe(true);
    expect(anna.k.craft('ricetta.benda')).toBe(true);
    await flush(server, [anna]);
    expect(countItem(k.as('anna', () => k.inventory()), 'item.benda')).toBe(2);
    expect(countItem(anna.k.inventory(), 'item.benda')).toBe(2);
    // Without what it takes, it is not even asked.
    expect(anna.k.craft('ricetta.benda')).toBe(false);
    const free = await until(server, [anna], anna.k.freeCraft('un fazzoletto con la stoffa che resta'));
    expect(typeof free.story).toBe('string');
    expect(typeof free.ok).toBe('boolean');
    const a = slotOf(anna.k, 'item.coltello');
    const b = slotOf(anna.k, 'item.mela-rossa');
    expect(typeof (await until(server, [anna], anna.k.combine(a, b)))).toBe('string');
  }, 30_000);

  it('a container: opened with what is in it, taken from and put into; out of reach it does not open', async () => {
    const { k, server, anna, start } = await annaAlone();
    const cassa = k.modules.get('obj.cassa')!;
    const near = k.spawnModuleEntity(cassa, start.x + 1.2, start.y);
    const far = k.spawnModuleEntity(cassa, start.x + 7, start.y);
    k.container(near)!.filled = true;
    k.container(near)!.inv.slots[0] = { item: 'item.pane', count: 3 };
    run(server, [anna], 12);
    const mirror = (sid: number) => anna.k.ecs.query('container').find((e) => {
      const p = anna.k.ecs.get(e, 'pos');
      return Math.abs(p.x - k.ecs.get(sid, 'pos').x) < 0.01 && Math.abs(p.y - k.ecs.get(sid, 'pos').y) < 0.01;
    })!;
    const box = mirror(near);
    expect(box).toBeDefined();
    expect(anna.k.container(box)!.inv).toBeUndefined();
    const opened: number[] = [];
    anna.k.bus.on('ui:container', ({ id }) => opened.push(id));
    // E on it: the server opens it, and what is inside comes with the answer.
    void anna.k.perform(box, 'apri');
    await flush(server, [anna]);
    expect(opened).toEqual([box]);
    expect(anna.k.container(box)!.inv.slots[0]).toEqual({ item: 'item.pane', count: 3 });
    // Taken: at once here, then as the server has it.
    anna.k.takeFromContainer(box, 0);
    expect(countItem(anna.k.inventory(), 'item.pane')).toBe(3);
    await flush(server, [anna]);
    expect(countItem(k.container(near)!.inv, 'item.pane')).toBe(0);
    expect(countItem(k.as('anna', () => k.inventory()), 'item.pane')).toBe(3);
    expect(anna.k.container(box)!.inv.slots.some(Boolean)).toBe(false);
    expect(countItem(anna.k.inventory(), 'item.pane')).toBe(3);
    // Put back.
    anna.k.putIntoContainer(box, slotOf(anna.k, 'item.pane'));
    await flush(server, [anna]);
    expect(countItem(k.container(near)!.inv, 'item.pane')).toBe(3);
    expect(countItem(anna.k.container(box)!.inv, 'item.pane')).toBe(3);
    expect(countItem(anna.k.inventory(), 'item.pane')).toBe(0);
    // Too far: the server does not open it.
    const r = await until(server, [anna], anna.session.act({ t: 'contenitore', entita: far, op: 'apri' }));
    expect(r).toMatchObject({ ok: false, motivo: 'è troppo lontano' });
    expect(k.container(far)!.filled).toBeFalsy();
  }, 30_000);

  it('a panel of a mechanic and the actions on a tile', async () => {
    const { k, server, anna, start, said, dialogs } = await annaAlone(async (k) => {
      expect((await k.forgeMechanic('equipaggiamento: slot per indossare e impugnare')).ok).toBe(true);
      const items = JSON.parse(k.files['modules/items.base/manifest.json']);
      items.items.push({ id: 'item.elmo', name: 'Elmo di ferro', description: 'un elmo', category: 'vestiario', weight: 2, stack: 1, tags: ['metallo'], glyph: 'Ʌ', color: '#999999', slot: 'testa', bonus: { difesa: 3 } });
      k.saveFile('modules/items.base/manifest.json', JSON.stringify(items, null, 2) + '\n');
    });
    // The mirror has the panel too (the same files).
    const panel = anna.k.uiPanels()[0].panel.id;
    expect(panel).toBe(k.uiPanels()[0].panel.id);
    k.as('anna', () => k.give('item.elmo', 1));
    run(server, [anna], 12);
    expect(anna.k.equip(panel, 'testa', slotOf(anna.k, 'item.elmo'))).toBe(true);
    await flush(server, [anna]);
    expect(k.as('anna', () => k.slots()[panel].testa?.item)).toBe('item.elmo');
    expect(anna.k.slots()[panel].testa?.item).toBe('item.elmo');
    expect(countItem(anna.k.inventory(), 'item.elmo')).toBe(0);
    expect(k.as('anna', () => k.uiValue('difesa.valore'))).toBe(3);
    anna.k.unequip(panel, 'testa');
    await flush(server, [anna]);
    expect(anna.k.slots()[panel].testa ?? null).toBeNull();
    expect(countItem(anna.k.inventory(), 'item.elmo')).toBe(1);
    // A button of the panel reaches the server (with nothing to do, it answers all the same).
    expect((await until(server, [anna], anna.session.act({ t: 'pannello', pannello: panel, op: 'pulsante', azione: 'nulla' }))).ok).toBe(true);
    // A learned action of the terrain under her: the server does it on that tile.
    const col = Math.floor(start.x);
    const row = Math.floor(start.y);
    const code = k.tileAt(col, row)!;
    k.palette[code].actions = [{ id: 'scava', label: 'Scava', effects: [{ tipo: 'messaggio', testo: 'Scavi un poco.' }] }];
    await until(server, [anna], anna.k.performMenu('t:scava', -1, col, row));
    expect(dialogs.some((d) => d.includes('Scavi un poco.'))).toBe(true);
    // Too far from her, it is refused.
    await until(server, [anna], anna.k.performMenu('t:scava', -1, col + 6, row));
    expect(said).toContain('è troppo lontano');
    // «Altro…» on the tile: the Council's answer.
    expect(typeof (await until(server, [anna], anna.k.freeTileAction(col, row, 'tocco la terra')))).toBe('string');
  }, 30_000);
});

