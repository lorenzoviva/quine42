// The people dressed (T353, ADR-0181): what an individual wears comes from the Narrator's card (`indossa` of `npc.individuate`, kept in
// `world/people.json → wears`) and, for the zones the card leaves bare, from their trade among the garments of the world, with no
// call; the marks are the inventory's, as the wanderer's, so the renderer dresses them (T290) and the wire says it (`EntityView.worn`,
// the ids only); met again, after a place was left and seen again, they are dressed the same.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { garmentOfTrade, outfitOf, readPeople, tradeStems, type Garment, type Individual } from '../src/kernel/npc/model';
import { memoryStore } from '../src/kernel/repo';
import { dressInventory, wornItems } from '../src/kernel/wearing';
import { newInventory } from '../src/kernel/inventory';
import { wornBy } from '../src/render/dressed';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionClient } from '../src/session/client';
import { SessionServer } from '../src/session/server';
import { ThinClient } from '../src/session/thin';
import { boot, DT, develop, settle } from './world';

const GARMENTS: Garment[] = [
  { id: 'item.cappello-paglia', name: 'Cappello di paglia', description: 'A tesa larga: lo portano contadini e pastori.', tags: ['paglia'], zone: 'head' },
  { id: 'item.grembiule-cuoio', name: 'Grembiule di cuoio', description: 'Il grembiule del fabbro e del fornaio.', tags: ['cuoio'], zone: 'torso' },
  { id: 'item.grembiule-tela', name: 'Grembiule di tela', description: 'Bianco di farina.', tags: ['fornaio'], zone: 'torso' },
  { id: 'item.mantello', name: 'Mantello di lana', description: 'Un mantello pesante, rattoppato.', tags: ['stoffa', 'viaggio'], zone: 'back' },
  { id: 'item.elmo', name: 'Elmo di ferro', description: 'Un elmo.', tags: [], zone: 'head' },
];

describe('the outfit of an individual, as data', () => {
  it('the stems of a trade: long words only, in their gender and number', () => {
    expect(tradeStems('la contadina')).toEqual(['contadi']);
    expect(tradeStems('Fabbro')).toEqual(['fabb']);
    expect(tradeStems('caccia topi')).toEqual(['cacc', 'topi']);
    expect(tradeStems('blacksmith')).toEqual(['blacksm']);
    expect(tradeStems(undefined)).toEqual([]);
    expect(tradeStems('')).toEqual([]);
  });

  it('a garment is of a trade when its name, description or tags say it', () => {
    expect(garmentOfTrade(GARMENTS[0], tradeStems('contadina'))).toBe(true);
    expect(garmentOfTrade(GARMENTS[0], tradeStems('pastore'))).toBe(true);
    expect(garmentOfTrade(GARMENTS[2], tradeStems('fornaia'))).toBe(true);
    expect(garmentOfTrade(GARMENTS[3], tradeStems('contadina'))).toBe(false);
    expect(garmentOfTrade(GARMENTS[0], [])).toBe(false);
  });

  it('the card first, one per zone; the trade for the zones left bare; the same individual the same way; nothing for a trade without garments', () => {
    // The card names a cloak and two things for the head: the first wins; the trade gives the apron.
    expect(outfitOf(['item.mantello', 'item.elmo', 'item.cappello-paglia'], 'fabbro', GARMENTS, 'Ada')).toEqual({ head: 'item.elmo', back: 'item.mantello', torso: 'item.grembiule-cuoio' });
    // A baker has two aprons to choose from: one of them, always the same one for her, and not everyone the same.
    const ada = outfitOf([], 'fornaia', GARMENTS, 'Ada');
    expect(['item.grembiule-cuoio', 'item.grembiule-tela']).toContain(ada.torso);
    expect(outfitOf([], 'fornaia', GARMENTS, 'Ada')).toEqual(ada);
    const choices = new Set(['Ada', 'Bruno', 'Cora', 'Dino', 'Elia', 'Fede', 'Gino', 'Hera'].map((who) => outfitOf([], 'fornaia', GARMENTS, who).torso));
    expect(choices.size).toBe(2);
    // A weaver has no garment of her own in this world: nothing, not everyone in the same cloak.
    expect(outfitOf([], 'tessitrice', GARMENTS, 'Cora')).toEqual({});
    expect(outfitOf([], undefined, GARMENTS, 'Cora')).toEqual({});
    // An id the world does not have is left out.
    expect(outfitOf(['item.nothing'], undefined, GARMENTS, 'Cora')).toEqual({});
  });

  it('dressing an inventory: the thing in the slot it is in or added, the mark on its zone; a zone not in the outfit keeps what it had', () => {
    const inv = newInventory(6);
    inv.slots[2] = { item: 'item.mantello', count: 1 };
    inv.worn = { head: 0 };
    inv.slots[0] = { item: 'item.elmo', count: 1 };
    expect(dressInventory(inv, { back: 'item.mantello', torso: 'item.grembiule-cuoio' }, () => undefined)).toEqual(['torso', 'back']);
    expect(inv.worn).toEqual({ head: 0, back: 2, torso: 1 });
    expect(inv.slots[1]).toEqual({ item: 'item.grembiule-cuoio', count: 1 });
  });
});

const villager = (k: Kernel, origin: string, dx = 1) => {
  const pc = k.wandererCarpet();
  return k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + dx, pc.y, undefined, origin);
};

const outfit = (k: Kernel, id: number) => wornItems(k.ecs.get(id, 'inventory'), (item) => k.wornZone(item));

describe('the kernel dresses the people', () => {
  it('an individual of the card: the garment the Narrator named is on, written in the registry; met again after the place was left, the same', async () => {
    const k = await boot();
    const npc = villager(k, 'test#vestito');
    const identity = (await k.ensureIdentity(npc))!;
    expect(identity.wearing.length).toBe(1);
    const on = outfit(k, npc);
    expect(Object.keys(on).length).toBeGreaterThanOrEqual(1);
    const named = k.content.byName(identity.wearing[0])!;
    expect(Object.values(on)).toContain(named.id);
    expect(wornBy(k, npc)).toEqual(on);
    // The registry keeps what the card said, not what the trade chose.
    const me = readPeople(k.files).people.find((p) => p.name === identity.name)!;
    expect(me.wears).toEqual(identity.wearing);
    // The place is left and seen again: the same person, in the same clothes, with no call.
    const calls = k.ai.usage.text;
    k.ecs.destroy(npc);
    const again = villager(k, 'test#vestito');
    const back = (await k.ensureIdentity(again))!;
    expect(back.name).toBe(identity.name);
    expect(outfit(k, again)).toEqual(on);
    expect(k.ai.usage.text).toBe(calls);
  }, 60_000);

  it('an individual of the trade: a smith of the registry without a card of clothes wears the seed\'s apron; a cat wears nothing', async () => {
    const people: Individual[] = [
      { name: 'Tazio', kind: 'npc.villager', species: 'person', gender: 'male', job: 'fabbro', family: [], routine: [], origin: 'test#fabbro', carries: ['Moneta di rame'] },
      { name: 'Bice', kind: 'npc.villager', species: 'person', gender: 'female', job: 'tessitrice', family: [], routine: [], origin: 'test#tessitrice', carries: [] },
      { name: 'Fiocco', kind: 'npc.cat', species: 'animal', gender: 'male', job: 'caccia topi', family: [], routine: [], origin: 'test#gatto', carries: [] },
    ];
    const files = { ...bundledFiles, 'world/people.json': JSON.stringify({ people, expected: [] }) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    await develop(k);
    const calls = k.ai.usage.text;
    const tazio = villager(k, 'test#fabbro');
    expect((await k.ensureIdentity(tazio))!.name).toBe('Tazio');
    expect(outfit(k, tazio)).toEqual({ torso: 'item.grembiule-cuoio' });
    // The apron was not in his pockets: it is now, worn; the coin still is.
    const inv = k.ecs.get(tazio, 'inventory');
    expect(inv.slots.some((s: { item: string } | null) => s?.item === 'item.moneta')).toBe(true);
    const bice = villager(k, 'test#tessitrice', 2);
    expect((await k.ensureIdentity(bice))!.name).toBe('Bice');
    expect(outfit(k, bice)).toEqual({});
    const pc = k.wandererCarpet();
    const cat = k.spawnModuleEntity(k.modules.get('npc.cat')!, pc.x + 3, pc.y, undefined, 'test#gatto');
    expect((await k.ensureIdentity(cat))!.name).toBe('Fiocco');
    expect(outfit(k, cat)).toEqual({});
    // Dressing from the registry and the trade costs nothing.
    expect(k.ai.usage.text).toBe(calls);
  }, 60_000);

  it('in the tick: a villager near the wanderer gets an individual and is dressed, without anyone talking to them', async () => {
    const k = await boot();
    const npc = villager(k, 'test#tick', 2);
    expect(k.ecs.get(npc, 'identity')).toBeUndefined();
    for (let i = 0; i < 40 && !k.ecs.get(npc, 'identity'); i++) {
      for (let t = 0; t < 60; t++) k.tick(DT);
      await settle(25);
    }
    expect(k.ecs.get(npc, 'identity')).toBeDefined();
    expect(Object.keys(outfit(k, npc)).length).toBeGreaterThanOrEqual(1);
  }, 60_000);
});

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

describe('on the wire', () => {
  it('a client sees what an individual wears, by zone and id, and nothing else of what it carries; taken off, it goes', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const server = new SessionServer(k);
    const heard: ServerMsg[] = [];
    const anna = await thin(server, 'anna', heard);
    for (let i = 0; i < 60; i++) {
      frames(server, [anna], 1);
      await new Promise((r) => setTimeout(r, 10));
    }
    const at = k.wandererAt('anna')!;
    const inv = newInventory(6);
    inv.slots[0] = { item: 'item.cappello-paglia', count: 1 };
    inv.slots[1] = { item: 'item.coltello', count: 1 };
    inv.worn = { head: 0 };
    const npc = k.ecs.spawn({ pos: { x: at.x + 2, y: at.y }, module: { id: 'npc.villager' }, glyph: { ch: '&', color: '#fff' }, body: { r: 0.3, solid: false }, identity: { name: 'Prova' }, inventory: inv });
    frames(server, [anna], 6);
    const mine = () => [...anna.k.ecs.query('worn')];
    expect(mine()).toHaveLength(1);
    expect(wornBy(anna.k, mine()[0])).toEqual({ head: 'item.cappello-paglia' });
    const views = heard.flatMap((m) => (m.t === 'update' || m.t === 'welcome' ? (m.entities ?? []) : [])).filter((e) => e.id === npc);
    expect(views[views.length - 1].worn).toEqual({ head: 'item.cappello-paglia' });
    expect(JSON.stringify(views)).not.toContain('item.coltello');
    expect(JSON.stringify(views)).not.toContain('inventory');
    // Taken off on the server (a thing given away): the client's figure is bare again.
    delete inv.worn;
    frames(server, [anna], 6);
    expect(mine()).toHaveLength(0);
  }, 120_000);
});
