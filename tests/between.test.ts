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

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, partita: { modalita: 'multigiocatore', morte: 3 } }, null, 2) };
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
async function three() {
  const k = await bootMany();
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
