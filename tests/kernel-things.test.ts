import { beforeEach, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { countItem } from '../src/kernel/inventory';
import { boot, run, settle, clearArea, carried, spawnInFront } from './world';

describe('items, containers, actions, needs', () => {
  let k: Kernel;
  beforeEach(async () => {
    k = await boot();
    clearArea(k);
  });

  it('items on the ground are picked up, stacked and eaten', async () => {
    const pc = k.wandererCarpet();
    k.spawnItem('item.mela-rossa', pc.x + 0.5, pc.y);
    k.spawnItem('item.mela-rossa', pc.x + 0.6, pc.y);
    await k.interact();
    await k.interact();
    const inv = k.inventory();
    expect(countItem(inv, 'item.mela-rossa')).toBe(2);
    k.needs()!.hunger = 40;
    k.useSlot(inv.slots.findIndex((s) => s?.item === 'item.mela-rossa'));
    expect(countItem(inv, 'item.mela-rossa')).toBe(1);
    expect(k.needs()!.hunger).toBe(52);
  });

  it('an equipped tool acts on the world: scissors cut a bramble, which leaves wood', () => {
    const inv = k.inventory();
    inv.slots[0] = { item: 'item.scissors', count: 1 };
    k.equipSlot(0);
    const bush = spawnInFront(k, 'object.bush');
    k.action();
    expect(k.ecs.alive.has(bush)).toBe(false);
    expect(k.ecs.query('pickup').some((id) => k.ecs.get(id, 'pickup').item === 'item.ciocco')).toBe(true);
  });

  it('containers are filled from their loot table the first time and can be emptied', () => {
    const box = spawnInFront(k, 'obj.cupboard');
    expect(k.actionsFor(box).map((a) => a.id)).toEqual(expect.arrayContaining(['apri', 'esamina']));
    const c = k.openContainer(box)!;
    const found = new Map<string, number>();
    for (const s of c.inv.slots) if (s) found.set(s.item, (found.get(s.item) ?? 0) + s.count);
    expect(found.size).toBeGreaterThan(0);
    c.inv.slots.forEach((s, i) => s && k.takeFromContainer(box, i));
    expect(c.inv.slots.filter(Boolean).length).toBe(0);
    for (const [item, n] of found) expect(countItem(k.inventory(), item)).toBe(n);
    k.openContainer(box);
    expect(c.inv.slots.filter(Boolean).length).toBe(0);
  });

  it('objects offer their own actions, with requirements', async () => {
    const bed = spawnInFront(k, 'obj.bed');
    k.needs()!.energy = 10;
    await k.perform(bed, 'act:sleep');
    expect(k.needs()!.energy).toBe(100);
    const well = spawnInFront(k, 'object.well', 2.5);
    const attingi = () => k.actionsFor(well).find((a) => a.id === 'act:draw')!;
    expect(attingi().enabled).toBe(false);
    expect(attingi().reason).toMatch(/Secchio/);
    k.inventory().slots[5] = { item: 'item.secchio', count: 1 };
    expect(attingi().enabled).toBe(true);
    await k.perform(well, 'act:draw');
    expect(countItem(k.inventory(), 'item.otre-acqua')).toBe(1);
  });

  it('recipes turn what you carry into new things', () => {
    const inv = k.inventory();
    inv.slots[0] = { item: 'item.stoffa', count: 2 };
    inv.slots[1] = { item: 'item.coltello', count: 1 };
    expect(k.recipes().available.has('ricetta.benda')).toBe(true);
    expect(k.craft('ricetta.benda')).toBe(true);
    expect(countItem(inv, 'item.benda')).toBe(2);
    expect(countItem(inv, 'item.coltello')).toBe(1);
    expect(k.craft('ricetta.benda')).toBe(false);
  });

  it('needs decay with time and walking', () => {
    const before = { ...k.needs()! };
    run(k, 10);
    expect(k.needs()!.hunger).toBeLessThan(before.hunger);
    expect(k.needs()!.thirst).toBeLessThan(before.thirst);
  });

  it('pushable things move when walked into', () => {
    const { col, row } = clearArea(k);
    k.carpet()!.active = false;
    const crate = k.spawnModuleEntity(k.modules.get('object.crate')!, col + 2.5, row + 0.5);
    const before = k.ecs.get(crate, 'pos').x;
    k.input.setHeld('right', true);
    run(k, 0.8);
    k.input.setHeld('right', false);
    run(k, 0.5);
    expect(k.ecs.get(crate, 'pos').x).toBeGreaterThan(before + 0.3);
  });
});

describe('characters', () => {
  let k: Kernel;
  beforeEach(async () => {
    k = await boot();
    clearArea(k);
  });

  it('every NPC is an individual with a name and pockets; they give, follow and remember', async () => {
    const npc = spawnInFront(k, 'npc.villager', 1);
    const give = await k.talk(npc, 'Buongiorno! Hai qualcosa da darmi?');
    const identity = k.ecs.get(npc, 'identity');
    expect(identity.name).not.toBe('Abitante');
    expect(k.nameOf(npc)).toBe(identity.name);
    expect(give.action).toBe('dai');
    expect(carried(k)).toBe(1);
    const follow = await k.talk(npc, 'Seguimi, ti prego');
    expect(follow.action).toBe('segui');
    expect(k.ecs.get(npc, 'mind').history.length).toBe(4);
    // A second NPC of the same kind is somebody else.
    const other = spawnInFront(k, 'npc.villager', 2);
    await k.ensureIdentity(other);
    expect(k.ecs.get(other, 'identity')).toBeTruthy();
  });

  it('things mentioned in conversation become real and turn up more often', async () => {
    const npc = spawnInFront(k, 'npc.villager', 1);
    await k.talk(npc, 'Sai dove trovare una lanterna?');
    await settle(80);
    expect(k.wanted.has('item.lanterna')).toBe(true);
    await k.talk(npc, 'E uno zufolo?');
    await settle(120);
    const zufolo = k.content.byName('zufolo');
    expect(zufolo).toBeTruthy();
    expect(k.wanted.has(zufolo!.id)).toBe(true);
    expect(k.files['modules/items.citati/manifest.json']).toContain('Zufolo');
  });

  it('examining something asks the Narrator once, then remembers', async () => {
    const box = spawnInFront(k, 'obj.chest');
    let said = '';
    k.bus.on('ui:dialog', ({ text }: { text: string }) => (said = text));
    await k.perform(box, 'esamina');
    expect(said).toMatch(/Cassapanca/);
    const calls = k.ai.usage.text;
    await k.perform(box, 'esamina');
    expect(k.ai.usage.text).toBe(calls);
  });
});

describe('free actions and effects', () => {
  let k: Kernel;
  let said = '';
  beforeEach(async () => {
    k = await boot();
    clearArea(k);
    k.bus.on('ui:dialog', ({ text }: { text: string }) => (said = text));
  });

  it('every menu offers "Altro…"; a judged action happens and, if repeatable, the object learns it', async () => {
    const bush = spawnInFront(k, 'object.bush');
    expect(k.actionsFor(bush).at(-1)?.id).toBe('altro');
    await k.freeAction(bush, 'rompo il rovo a calci');
    expect(k.ecs.alive.has(bush)).toBe(false);
    expect(said).toMatch(/pezzi/);
    const learned = k.modules.get('object.bush')!.manifest.actions!.find((a) => a.effects?.length);
    expect(learned?.label).toMatch(/Rompo il rovo/);
    expect(k.repo.head().message).toMatch(/azione imparata/);
    // The learned action is in the menu of every bramble, and runs without asking the Council again.
    const other = spawnInFront(k, 'object.bush');
    expect(k.actionsFor(other).some((a) => a.id === `act:${learned!.id}`)).toBe(true);
    const calls = k.ai.usage.text;
    await k.perform(other, `act:${learned!.id}`);
    expect(k.ecs.alive.has(other)).toBe(false);
    expect(k.ai.usage.text).toBe(calls);
  });

  it('what is not possible does not happen; a closed thing can be forced open', async () => {
    const crate = spawnInFront(k, 'object.crate');
    await k.freeAction(crate, 'lo faccio volare sulla luna');
    expect(k.ecs.alive.has(crate)).toBe(true);
    let opened = false;
    k.bus.on('ui:container', () => (opened = true));
    await k.freeAction(crate, 'forzo il coperchio');
    expect(k.container(crate)).toBeTruthy();
    expect(opened).toBe(true);
  });

  it('decisions become rules: things carried or on the ground learn actions; impossible ones are not asked twice', async () => {
    const inv = k.inventory();
    inv.slots[8] = { item: 'item.secchio', count: 1 };
    k.needs()!.thirst = 20;
    await k.freeItemAction(8, 'bevo dal secchio');
    expect(k.needs()!.thirst).toBe(35);
    const learned = k.content.get('item.secchio')!.actions!.find((a) => a.effects?.length)!;
    expect(learned.label).toMatch(/Bevo dal secchio/);
    expect(k.rules().some((r) => r.possible && /bevo dal secchio/.test(r.text))).toBe(true);
    const calls = k.ai.usage.text;
    k.itemAct(8, learned.id);
    expect(k.needs()!.thirst).toBe(50);
    // A careless judgement that "spends" the thing you act on does not take it from you.
    await k.freeItemAction(8, 'riempio il secchio e bevo');
    expect(countItem(inv, 'item.secchio')).toBe(1);
    expect(k.needs()!.thirst).toBe(60);
    // On the ground, the same item offers the learned action in its menu.
    const pc = k.wandererCarpet();
    const dropped = k.spawnItem('item.secchio', pc.x + 0.9, pc.y);
    expect(k.actionsFor(dropped).some((a) => a.label === learned.label)).toBe(true);
    // What is impossible stays impossible, without asking again.
    await k.freeItemAction(8, 'lo faccio volare sulla luna');
    const after = k.ai.usage.text;
    await k.freeItemAction(8, 'lo faccio volare sulla luna');
    expect(k.ai.usage.text).toBe(after);
    expect(after).toBe(calls + 2);
    // The Council sees the rules in every later judgement.
    expect(k.council.context('narrator')).toMatch(/Rules the Council has already established[\s\S]*bevo dal secchio/);
  });

  it('free crafting: the Council decides from what you carry; a possible recipe becomes a known recipe', async () => {
    const inv = k.inventory();
    inv.slots[8] = { item: 'item.stoffa', count: 2 };
    const r = await k.freeCraft('una fascia da polso');
    expect(r.ok).toBe(true);
    const made = k.content.byName('Fascia da polso')!;
    expect(countItem(inv, made.id)).toBe(1);
    expect(countItem(inv, 'item.stoffa')).toBe(1);
    expect(k.content.recipes.some((x) => x.output.item === made.id && x.inputs[0].item === 'item.stoffa')).toBe(true);
    expect(k.repo.head().message).toMatch(/ricetta scoperta/);
    const no = await k.freeCraft("un drago d'oro");
    expect(no.ok).toBe(false);
    const calls = k.ai.usage.text;
    await k.freeCraft("un drago d'oro");
    expect(k.ai.usage.text).toBe(calls);
  });

  it('fire burns what is flammable and goes out; digging changes the terrain, and the change persists', async () => {
    const bush = spawnInFront(k, 'object.bush', 1.2);
    const crate = spawnInFront(k, 'object.crate', 2.2);
    await k.freeAction(crate, 'brucio la cassa');
    const fires = () => k.ecs.query('fire');
    expect(fires().length).toBe(1);
    run(k, 0.5);
    expect(k.ecs.alive.has(bush)).toBe(false);
    run(k, 9);
    expect(fires().length).toBe(0);

    const pc = k.wandererCarpet();
    const col = Math.floor(pc.x);
    const row = Math.floor(pc.y);
    const target = spawnInFront(k, 'object.crate', 1);
    const before = k.tileAt(col + 1, row);
    await k.freeAction(target, 'scavo qui attorno');
    const code = Object.keys(k.palette).find((c) => /sentier|terra|strada/.test(k.palette[c].name))!;
    expect(k.tileAt(col + 1, row)).toBe(code);
    expect(before === code || Object.keys(k.chunkAt(col + 1, row)!.plan!.edits ?? {}).length > 0).toBe(true);
  });
});
