import { beforeEach, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { countItem } from '../src/kernel/inventory';

const DT = 1 / 60;

export async function boot(models = new MockModels()) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models });
  await develop(k);
  return k;
}

/** Ticks until every loaded chunk has been planned by the Cartographer. */
export async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(DT);
    await settle(25);
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(DT);
}

export function run(k: Kernel, seconds: number) {
  for (let t = 0; t < seconds; t += DT) k.tick(DT);
}

export const settle = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Moves the player next to a run of free cells and faces right, so inscriptions always fit. */
export function clearArea(k: Kernel, width = 24) {
  const { ox, oy } = k.offset();
  const free = (c: number, r: number) => (k as any).freeCell(c, r) && !k.runeCells.has(`${c},${r}`) && k.tileAt(c, r) !== undefined && !k.buildingAt(c + 0.5, r + 0.5);
  for (let d = 0; d < 30; d++)
    for (const row of [d, -d]) {
      for (let col = -30; col < 0; col++) {
        let ok = true;
        for (let i = 0; i <= width && ok; i++) ok = free(col + i, row);
        if (!ok) continue;
        const p = k.playerPos();
        p.x = col + 0.5 - ox;
        p.y = row + 0.5 - oy;
        k.playerComp().facing = 'right';
        k.carpet()!.active = false;
        k.tick(DT);
        k.carpet()!.active = true;
        return { col, row };
      }
    }
  throw new Error('nessuno spazio libero trovato');
}

/** Runes are things the player carries: tests put them in the pouch first. */
export const giveRunes = (k: Kernel, tokens: string[]) => tokens.forEach((t) => k.give(`rune:${t}`, 1));

/** Stacks carried, in the pockets and inside bags (bags themselves not counted). */
const carried = (k: Kernel) =>
  k.inventory().slots.reduce((n, s) => n + (!s ? 0 : k.content.get(s.item)?.container ? (s.inv?.slots.filter(Boolean).length ?? 0) : 1), 0);

const spawnInFront = (k: Kernel, id: string, dist = 0.9) => {
  const pc = k.playerCarpet();
  k.playerComp().facing = 'right';
  return k.spawnModuleEntity(k.modules.get(id)!, pc.x + dist, pc.y);
};

describe('kernel', () => {
  let k: Kernel;
  beforeEach(async () => {
    k = await boot();
  });

  it('boots the bundled universe without faults', () => {
    expect(k.faults.list()).toEqual([]);
    expect(k.modules.size).toBeGreaterThanOrEqual(20);
    expect(k.content.items.size).toBeGreaterThanOrEqual(30);
    expect(Object.keys(k.content.layouts)).toEqual(expect.arrayContaining(['borgo', 'bosco', 'campi', 'rovine', 'locanda']));
    expect(k.repo.head().message).toBe('genesi');
    expect(k.needsGenesis()).toBe(true);
  });

  it('every chunk gets an environment from the Cartographer; the start is a village with buildings', () => {
    const chunks = [...k.chunks.values()];
    expect(chunks.every((c) => c.stage === 'planned' && c.place?.name && k.content.layouts[c.plan!.layout])).toBe(true);
    const start = k.chunks.get('0,0')!;
    expect(start.plan!.layout).toBe('borgo');
    expect(start.buildings.length).toBeGreaterThan(0);
    const b = start.buildings[0];
    const S = k.config.chunkSize;
    expect(k.buildingAt((b.floor[0] % S) + 0.5, Math.floor(b.floor[0] / S) + 0.5)?.building).toBe(b);
    for (const st of k.lines.values()) expect(st.compiled).toBe(true);
    expect(k.feed().some((e) => e.from === 'cartografo' && e.kind === 'propone')).toBe(true);
  });

  it('the world is full of things: furniture with contents, items on the ground', () => {
    expect(k.ecs.query('container').length).toBeGreaterThan(0);
    expect(k.ecs.query('pickup').length).toBeGreaterThan(0);
  });

  it('the carpet keeps the player at the centre and the corona stays hidden', () => {
    k.input.setHeld('right', true);
    run(k, 6);
    k.input.setHeld('right', false);
    expect(Math.abs(k.playerPos().x)).toBeLessThan(2);
    expect(k.coronaRevealed()).toBe(false);
    expect(k.hoverAt(k.config.circleRadius + 2, 0)?.kind).not.toBe('code');
  });

  it('runes that stop the carpet reveal the corona and let the player reach it', () => {
    clearArea(k);
    expect(k.inscribe(['carpet', '.', 'active', '=', 'false'])).toBe(false);
    giveRunes(k, ['carpet', '.', 'active', '=', 'false']);
    expect(k.inscribe(['carpet', '.', 'active', '=', 'false'])).toBe(true);
    expect(countItem(k.inventory(), 'rune:carpet')).toBe(0);
    run(k, DT * 2);
    expect(k.carpet()!.active).toBe(false);
    k.playerPos().x = k.config.circleRadius + 0.5;
    run(k, DT * 2);
    expect(k.zone).toBe('corona');
    const slot = k.corona.slotOf('modules/sys.physics/logic.lua')!;
    expect(k.hoverAt(slot.x + 0.5, slot.y + 0.5)?.kind).toMatch(/code|agent/);
  });

  it('the corona is an archive: folders are rooms, files are objects; the Council walks to its work', async () => {
    const files = Object.keys(k.files);
    for (const f of files) expect(k.corona.slotOf(f), f).toBeTruthy();
    const rooms = k.corona.folders.map((f) => f.name);
    expect(rooms).toEqual(expect.arrayContaining(['Concilio', 'Persone', 'Sistemi', 'Magia']));
    const room = (p: string) => k.corona.at(k.corona.slotOf(p)!.x, k.corona.slotOf(p)!.y)!.folder;
    expect(room('modules/npc.cat/manifest.json')).toBe(room('modules/npc.villager/manifest.json'));
    expect(room('modules/npc.cat/manifest.json')).not.toBe(room('modules/sys.needs/logic.lua'));
    // An agent working on a module walks to its book and says what it is doing.
    k.council.say('ingegnere', 'propone', 'ritocco object.well: secchio più capiente');
    const a = k.archive.avatars.get('ingegnere')!;
    expect(a.say).toMatch(/object.well/);
    for (let i = 0; i < 300; i++) k.archive.tick(1 / 30);
    const s = k.corona.slotOf('modules/object.well/manifest.json')!;
    expect(Math.hypot(a.x - (s.x + 0.5), a.y - (s.y + 0.5))).toBeLessThan(1.5);
    expect(Math.hypot(a.x, a.y)).toBeGreaterThanOrEqual(k.config.circleRadius);
    // Talking to an agent: it answers in its role and can send a request to the Forge.
    const r = await k.talkToAgent('narratore', 'crea un mugnaio che parla del vento');
    expect(r.forged).toMatch(/ugnaio|crea/i);
  });

  it('a broken phrase breaks the world; rollback repairs it and returns the runes', () => {
    clearArea(k);
    giveRunes(k, ['carpet', '.', 'strength', '=']);
    k.inscribe(['carpet', '.', 'strength', '=']);
    run(k, DT * 2);
    expect(k.faults.list().some((f) => f.key.startsWith('rune:'))).toBe(true);
    k.rollback();
    run(k, DT * 2);
    expect(k.faults.size).toBe(0);
    expect(k.hand().tokens).toEqual(['carpet', '.', 'strength', '=']);
  });

  it('severing a binding breaks the system that depends on it; the kernel survives absurd values', () => {
    clearArea(k);
    giveRunes(k, ['carpet', '=', 'nil']);
    k.inscribe(['carpet', '=', 'nil']);
    run(k, DT * 3);
    expect(k.faults.has('module:core.carpet:update')).toBe(true);
    k.rollback();
    clearArea(k);
    giveRunes(k, ['carpet', '.', 'ox', '=', 'nil']);
    k.inscribe(['carpet', '.', 'ox', '=', 'nil']);
    run(k, DT * 2);
    expect(Number.isFinite(k.offset().ox)).toBe(true);
  });

  it('valid edits are hot reloaded and committed; invalid ones are refused unless forced', () => {
    const path = 'modules/core.carpet/logic.lua';
    expect(k.saveFile(path, 'local M = {} function M.update( return M').written).toBe(false);
    expect(k.saveFile(path, 'local M = {} function M.update( return M', true).committed).toBe(false);
    k.rollback();
    expect(k.saveFile(path, k.files[path].replace('carpet.strength *', '0.5 * carpet.strength *')).committed).toBe(true);
  });

  it('the corona maps every universe file', () => {
    const seen = new Set<string>();
    for (let y = -k.corona.outer; y < k.corona.outer; y++)
      for (let x = -k.corona.outer; x < k.corona.outer; x++) {
        const c = k.corona.at(x, y);
        if (c?.path) seen.add(c.path);
      }
    expect([...seen].sort()).toEqual(Object.keys(k.files).sort());
  });
});

describe('items, containers, actions, needs', () => {
  let k: Kernel;
  beforeEach(async () => {
    k = await boot();
    clearArea(k);
  });

  it('items on the ground are picked up, stacked and eaten', async () => {
    const pc = k.playerCarpet();
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
    inv.slots[0] = { item: 'item.forbici', count: 1 };
    k.equipSlot(0);
    const bush = spawnInFront(k, 'object.bush');
    k.action();
    expect(k.ecs.alive.has(bush)).toBe(false);
    expect(k.ecs.query('pickup').some((id) => k.ecs.get(id, 'pickup').item === 'item.ciocco')).toBe(true);
  });

  it('containers are filled from their loot table the first time and can be emptied', () => {
    const box = spawnInFront(k, 'obj.credenza');
    expect(k.actionsFor(box).map((a) => a.id)).toEqual(expect.arrayContaining(['apri', 'esamina']));
    const c = k.openContainer(box)!;
    const found = c.inv.slots.filter(Boolean).length;
    expect(found).toBeGreaterThan(0);
    c.inv.slots.forEach((s, i) => s && k.takeFromContainer(box, i));
    expect(c.inv.slots.filter(Boolean).length).toBe(0);
    expect(carried(k)).toBe(found);
    k.openContainer(box);
    expect(c.inv.slots.filter(Boolean).length).toBe(0);
  });

  it('objects offer their own actions, with requirements', async () => {
    const bed = spawnInFront(k, 'obj.letto');
    k.needs()!.energy = 10;
    await k.perform(bed, 'act:dormi');
    expect(k.needs()!.energy).toBe(100);
    const well = spawnInFront(k, 'object.well', 2.5);
    const attingi = () => k.actionsFor(well).find((a) => a.id === 'act:attingi')!;
    expect(attingi().enabled).toBe(false);
    expect(attingi().reason).toMatch(/Secchio/);
    k.inventory().slots[5] = { item: 'item.secchio', count: 1 };
    expect(attingi().enabled).toBe(true);
    await k.perform(well, 'act:attingi');
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
    const box = spawnInFront(k, 'obj.cassa');
    let said = '';
    k.bus.on('ui:dialog', ({ text }: { text: string }) => (said = text));
    await k.perform(box, 'esamina');
    expect(said).toMatch(/Cassapanca/);
    const calls = k.models.usage.text;
    await k.perform(box, 'esamina');
    expect(k.models.usage.text).toBe(calls);
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
    const calls = k.models.usage.text;
    await k.perform(other, `act:${learned!.id}`);
    expect(k.ecs.alive.has(other)).toBe(false);
    expect(k.models.usage.text).toBe(calls);
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

  it('fire burns what is flammable and goes out; digging changes the terrain, and the change persists', async () => {
    const bush = spawnInFront(k, 'object.bush', 1.2);
    const crate = spawnInFront(k, 'object.crate', 2.2);
    await k.freeAction(crate, 'brucio la cassa');
    const fires = () => k.ecs.query('fuoco');
    expect(fires().length).toBe(1);
    run(k, 0.5);
    expect(k.ecs.alive.has(bush)).toBe(false);
    run(k, 9);
    expect(fires().length).toBe(0);

    const pc = k.playerCarpet();
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

describe('variety of people', () => {
  it('never more than a couple of the same kind in the loaded world; the world forges new kinds', async () => {
    const k = await boot();
    const counts = new Map<string, number>();
    for (const id of k.ecs.query('mind')) {
      const m = k.ecs.get(id, 'module').id;
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    for (const n of counts.values()) expect(n).toBeLessThanOrEqual(Kernel.NPC_CAP);
    const before = [...k.modules.values()].filter((m) => m.manifest.persona).length;
    expect(await k.growCast({ name: 'Piazza', description: 'una piazza' }, true)).toBe(true);
    expect([...k.modules.values()].filter((m) => m.manifest.persona).length).toBe(before + 1);
  });
});

describe('runes and magic', () => {
  it('one rune per cell; the start has magic, carpet runes only far away', async () => {
    const k = await boot();
    const runes = k.ecs.query('rune').map((id) => k.ecs.get(id, 'rune'));
    expect(runes.some((r) => r.token === 'luce')).toBe(true);
    const S = k.config.chunkSize;
    for (const r of runes) {
      const near = Math.max(Math.abs(Math.floor(r.col / S)), Math.abs(Math.floor(r.row / S))) < 3;
      if (near) expect(['carpet', 'active', 'strength', 'rate']).not.toContain(r.token);
    }
    // Inscribed runes take one cell each.
    clearArea(k);
    giveRunes(k, ['speed', '=', 'speed']);
    k.inscribe(['speed', '=', 'speed']);
    const mine = k.ecs.query('rune').map((id) => k.ecs.get(id, 'rune')).filter((r) => r.source === 'player');
    expect(mine.map((r) => r.col - mine[0].col)).toEqual([0, 1, 2]);
  });

  it('runes are things: picked into the pouch, composed into a phrase, spent when spoken', async () => {
    const k = await boot();
    clearArea(k);
    const n = k.needs()!;
    n.mana = 100;
    const pouch = k.inventory().slots.findIndex((s) => s?.item === 'item.borsa-rune');
    expect(pouch).toBeGreaterThanOrEqual(0);
    giveRunes(k, ['luce', 'luce', 'x']);
    // Runes go into the rune pouch, not the pockets.
    expect(countItem(k.bag(pouch)!, 'rune:luce')).toBe(2);
    expect(k.composeRune('luce')).toBe(true);
    expect(k.composeRune('x')).toBe(true);
    expect(k.incantation()).toEqual(['luce']);
    expect(await k.castSpell()).toBe(true);
    expect(k.ecs.query('luce', 'effimero').length).toBe(1);
    expect(n.mana).toBe(96);
    expect(countItem(k.inventory(), 'rune:luce')).toBe(1);
    expect(k.hand().tokens).toEqual(['x']);

    // A new sequence: named once by the Council, then known.
    giveRunes(k, ['vita', 'scudo', 'vita', 'scudo']);
    k.hand().tokens = ['vita', 'scudo'];
    const calls = k.models.usage.text;
    expect(await k.castSpell()).toBe(true);
    expect(k.models.usage.text).toBe(calls + 1);
    expect(k.content.spells['vita scudo']).toBeTruthy();
    expect(k.repo.head().message).toMatch(/incantesimo: vita scudo/);
    expect(k.ecs.get(k.playerId, 'scudo')?.fino).toBeGreaterThan(k.time);
    k.hand().tokens = ['vita', 'scudo'];
    await k.castSpell();
    expect(k.models.usage.text).toBe(calls + 1);
    // Spent: no runes left, nothing to cast.
    k.hand().tokens = ['vita', 'scudo'];
    expect(await k.castSpell()).toBe(false);

    // Long incantations burn a magic crystal; without mana nothing happens.
    giveRunes(k, ['fuoco', 'fuoco', 'vento']);
    k.hand().tokens = ['fuoco', 'fuoco', 'vento'];
    expect(await k.castSpell()).toBe(false);
    k.give('item.cristallo-magico', 1);
    expect(await k.castSpell()).toBe(true);
    expect(countItem(k.inventory(), 'item.cristallo-magico')).toBe(0);
    n.mana = 1;
    giveRunes(k, ['luce']);
    k.hand().tokens = ['luce'];
    expect(await k.castSpell()).toBe(false);
  });

  it('bags are containers you carry: open them, put things in, take them out; dropped, they keep their contents', async () => {
    const k = await boot();
    clearArea(k);
    const inv = k.inventory();
    k.give('item.sacca', 1);
    const sacca = inv.slots.findIndex((s) => s?.item === 'item.sacca');
    const pouch = inv.slots.findIndex((s) => s?.item === 'item.borsa-rune');
    inv.slots[10] = { item: 'item.coltello', count: 1 };
    // The rune pouch takes only runes.
    k.putIntoBag(pouch, 10);
    expect(inv.slots[10]?.item).toBe('item.coltello');
    k.putIntoBag(sacca, 10);
    expect(inv.slots[10]).toBeNull();
    expect(countItem(inv, 'item.coltello')).toBe(1);
    // Dropped and picked up again, the bag still holds the knife.
    k.dropSlot(sacca);
    expect(countItem(inv, 'item.coltello')).toBe(0);
    const dropped = k.ecs.query('pickup').find((id) => k.ecs.get(id, 'pickup').item === 'item.sacca')!;
    expect((k as any).pickUpEntity(dropped)).toBe(true);
    expect(countItem(inv, 'item.coltello')).toBe(1);
    const again = inv.slots.findIndex((s) => s?.item === 'item.sacca');
    k.takeFromBag(again, k.bag(again)!.slots.findIndex(Boolean));
    expect(inv.slots.some((s) => s?.item === 'item.coltello' && !s.inv)).toBe(true);
  });

  it('the day turns into night', () => {
    const k0 = { time: 0 } as unknown as Kernel;
    const light = (t: number) => Kernel.prototype.daylight.call({ ...k0, time: t });
    expect(light(0)).toBeGreaterThan(0.6);
    const night = Array.from({ length: 60 }, (_, i) => light((i / 60) * Kernel.DAY_SECONDS));
    expect(Math.min(...night)).toBe(0);
  });
});

describe('the Council', () => {
  it('forges a module: validated, committed, hot loaded and recorded in the bible', async () => {
    const k = await boot();
    const r = await k.askAgent('un fabbro che parla di spade');
    expect(r.ok).toBe(true);
    const m = k.modules.get('npc.fabbro')!.manifest;
    expect(m.persona).toBeTruthy();
    expect(m.inventory?.length).toBeGreaterThan(0);
    expect(k.repo.head().author).toBe('agent');
    const kinds = k.feed().map((e) => `${e.from}:${e.kind}`);
    for (const step of ['narratore:propone', 'fisico:propone', 'ingegnere:propone', 'arbitro:approva']) expect(kinds).toContain(step);
  });

  it('forged objects get actions and containers', async () => {
    const k = await boot();
    const r = await k.forgeModule('una madia di legno per il pane', 'agente', 'oggetto');
    const m = k.modules.get(r.id!)!.manifest;
    expect(m.actions?.length).toBeGreaterThan(0);
    expect(m.container?.loot).toBe('cucina');
  });

  it('the Arbiter sends incoherent work back to the responsible agent', async () => {
    class Picky extends MockModels {
      reviews = 0;
      physicsCalls = 0;
      async text(call: Parameters<MockModels['text']>[0]) {
        if (call.task === 'forge.review' && this.reviews++ === 0) return JSON.stringify({ approvato: false, problemi: [{ agente: 'fisico', problema: 'una mela non pesa 40 kg' }] });
        if (call.task === 'forge.physics') this.physicsCalls++;
        return super.text(call);
      }
    }
    const models = new Picky();
    const k = await boot(models);
    expect((await k.askAgent('una mela dorata')).ok).toBe(true);
    expect(models.physicsCalls).toBe(2);
    expect(k.feed().some((e) => e.from === 'arbitro' && e.kind === 'obietta' && e.to === 'fisico')).toBe(true);
  });

  it('code that does not load, or calls functions that do not exist, goes back to the Engineer', async () => {
    class Sloppy extends MockModels {
      n = 0;
      async text(call: Parameters<MockModels['text']>[0]) {
        if (call.task === 'forge.code' && this.n++ < 2) return JSON.stringify({ logic: this.n === 1 ? 'local M = {} function M.on_use( return M' : 'local M = {}\nfunction M.on_use(u, i) world.teleport(u) end\nreturn M' });
        return super.text(call);
      }
    }
    const k = await boot(new Sloppy());
    expect((await k.askAgent('una pagnotta di pane')).ok).toBe(true);
    const rejected = k.feed().filter((e) => e.from === 'kernel' && e.kind === 'scarta' && e.to === 'ingegnere');
    expect(rejected.length).toBe(2);
    expect(rejected[1].text).toMatch(/world\.teleport non esiste/);
  });

  it('generated code that fails at runtime is repaired; the player\'s breakage is respected', async () => {
    const k = await boot();
    await k.askAgent('un fabbro che parla di spade');
    const path = 'modules/npc.fabbro/logic.lua';
    k.repo.write(path, 'local M = {}\nfunction M.on_spawn(id) local t = nil; return t.x end\nreturn M\n');
    k.applyFiles({ ...k.repo.working });
    k.repo.commit('agente: versione difettosa', 'agent');
    const pc = k.playerCarpet();
    k.spawnModuleEntity(k.modules.get('npc.fabbro')!, pc.x + 2, pc.y);
    await settle(100);
    expect(k.repo.head().message).toBe('riparazione: npc.fabbro');
    k.saveFile(path, 'local M = {}\nfunction M.on_spawn(id) error("mio") end\nreturn M\n');
    k.spawnModuleEntity(k.modules.get('npc.fabbro')!, pc.x + 3, pc.y);
    await settle(100);
    expect(k.faults.has('module:npc.fabbro:on_spawn')).toBe(true);
  });

  it('the world grows: a content pack of items, recipes and loot', async () => {
    const k = await boot();
    const before = k.content.items.size;
    expect(await k.growContent('prova', 6, true)).toBe(true);
    expect(k.content.items.size).toBeGreaterThan(before);
    expect(k.repo.head().message).toMatch(/pacchetto 1/);
  });

  it('genesis writes terrains, environments (test-running them), items and inhabitants', async () => {
    const k = await boot();
    expect(await k.runGenesis('un regno di pastori sulle colline')).toBe(true);
    expect(k.needsGenesis()).toBe(false);
    expect(k.modules.has('npc.villager')).toBe(false);
    expect(k.modules.has('items.base')).toBe(false);
    expect(k.modules.has('core.carpet')).toBe(true);
    expect(Object.keys(k.content.layouts)).toEqual(expect.arrayContaining(['macchia', 'stazzo']));
    expect(k.feed().some((e) => e.kind === 'scarta' && /rotto/.test(e.text))).toBe(true);
    expect(k.palette.f.indoor).toBe(true);
    expect(k.content.items.size).toBeGreaterThan(3);
    expect([...k.modules.values()].some((m) => m.manifest.origin === 'genesi')).toBe(true);
    await develop(k);
    expect(k.faults.list()).toEqual([]);
    const planned = [...k.chunks.values()].filter((c) => c.stage === 'planned');
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((c) => k.content.layouts[c.plan!.layout])).toBe(true);
  });

  it('invalid plans are discarded and regenerated, invalid runes dropped one by one', async () => {
    class Careless extends MockModels {
      plans = 0;
      async text(call: Parameters<MockModels['text']>[0]) {
        if (call.task === 'chunk.plan' && this.plans++ === 0) return JSON.stringify({ luogo: { nome: 'X', descrizione: '' }, ambiente: 'luna', oggetti: [], rune: [] });
        return super.text(call);
      }
    }
    const k = await boot(new Careless());
    expect(k.feed().some((e) => e.from === 'kernel' && e.kind === 'scarta' && /ambiente sconosciuto/.test(e.text))).toBe(true);
    for (const st of k.lines.values()) expect(st.compiled).toBe(true);
  });
});
