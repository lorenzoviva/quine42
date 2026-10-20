import { beforeEach, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { readPeople } from '../src/kernel/society';
import { readPlots } from '../src/kernel/plots';
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
    // Outside: the studio's campus. A door leads into a building, bigger inside than outside.
    const b = k.corona.buildingOf('modules/sys.physics/logic.lua')!;
    Object.assign(k.playerPos(), { x: b.door.x + 0.5, y: b.door.y + 0.5 });
    run(k, DT);
    void k.interact();
    run(k, DT);
    expect(k.zone).toBe('studio');
    const slot = k.corona.slotOf('modules/sys.physics/logic.lua')!;
    expect(k.hoverAt(slot.x + 0.5, slot.y + 0.5)?.kind).toMatch(/studio|agent/);
  });

  it('the corona is a studio: a building per folder, rooms on floors, galleries; teams go to the files they change', async () => {
    for (const f of Object.keys(k.files)) expect(k.corona.slotOf(f), f).toBeTruthy();
    const names = k.corona.buildings.map((b) => b.name);
    expect(names).toEqual(expect.arrayContaining(['Sala del Concilio', 'Studio dei Personaggi', 'Sala Sistemi', 'Torre della Magia', "Galleria dell'Artista", 'Studio del Cartografo']));
    const bOf = (p: string) => k.corona.buildingOf(p)!.id;
    expect(bOf('modules/npc.cat/manifest.json')).toBe(bOf('modules/npc.villager/manifest.json'));
    expect(bOf('modules/npc.cat/manifest.json')).not.toBe(bOf('modules/sys.needs/logic.lua'));
    // The gallery shows every sprite and icon; the map room every terrain.
    const gallery = k.corona.building('galleria')!.floors.flatMap((f) => f.items.filter((i) => i.kind === 'sprite'));
    expect(gallery.some((i) => i.label === 'Mela rossa' || i.target?.startsWith('item:'))).toBe(true);
    const tiles = k.corona.building('cartografia')!.floors.flatMap((f) => f.items.filter((i) => i.kind === 'tile'));
    expect(tiles.length).toBeGreaterThanOrEqual(Object.keys(k.palette).length - 1);
    // Big buildings have several floors joined by stairs.
    const big = k.corona.buildings.find((b) => b.floors.length > 1);
    if (big) expect(big.floors[0].items.some((i) => i.kind === 'up')).toBe(true);
    // A member of the Engineers' team goes to the book of the module it changes.
    k.council.say('ingegnere', 'propone', 'ritocco object.well: secchio più capiente');
    const s0 = k.corona.slotOf('modules/object.well/manifest.json')!;
    const member = [...k.archive.avatars.values()].find((a) => a.agent === 'ingegnere' && a.path === 'modules/object.well/manifest.json')!;
    expect(member.say).toMatch(/object.well/);
    for (let i = 0; i < 300; i++) k.archive.tick(1 / 30);
    expect(Math.hypot(member.x - (s0.x + 0.5), member.y - (s0.y + 0.5))).toBeLessThan(1.6);
    // Only who is actually talking is seen together: the one called in appears beside the caller.
    k.council.say('arbitro', 'obietta', 'object.well: la corda è troppo corta', 'narratore');
    const called = [...k.archive.avatars.values()].find((a) => a.agent === 'narratore' && a.building === bOf('modules/object.well/manifest.json'))!;
    const caller = [...k.archive.avatars.values()].find((a) => a.agent === 'arbitro' && a.building === bOf('modules/object.well/manifest.json'))!;
    expect(Math.hypot(called.x - caller.tx, called.y - caller.ty)).toBeLessThan(1.5);
    // Changed files glow: the latest commits are known file by file.
    k.saveFile('modules/object.well/manifest.json', k.files['modules/object.well/manifest.json'].replace('"name"', '"name"'), true);
    // Talking to an agent: it answers in its role and can send a request to the Forge.
    const r = await k.talkToAgent('narratore', 'crea un mugnaio che parla del vento');
    expect(r.forged).toMatch(/ugnaio|crea/i);
    expect(k.recentChanges().size).toBeGreaterThan(0);
  });

  it('the Referente takes the transcended wanderer\'s requests to the right team', async () => {
    const env = await k.talkToAgent('referente', 'vorrei un bosco degli elfi a nord');
    expect(env.forged).toMatch(/Bosco degli Elfi/);
    const rule = await k.talkToAgent('referente', 'stabilisci una regola: di notte i lupi cantano');
    expect(rule.forged).toMatch(/regola/i);
    expect(k.rules().some((r) => /lupi/.test(r.testo))).toBe(true);
    const art = await k.talkToAgent('referente', 'ridipingi il gatto più arancione');
    expect(art.forged).toMatch(/ridipinge|non trova/i);
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

  it('the studio holds every universe file, each on a shelf of a room', () => {
    const seen = new Set<string>();
    for (const b of k.corona.buildings) for (const f of b.floors) for (const i of f.items) if (i.kind === 'file' && i.path) seen.add(i.path);
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

  it('decisions become rules: things carried or on the ground learn actions; impossible ones are not asked twice', async () => {
    const inv = k.inventory();
    inv.slots[8] = { item: 'item.secchio', count: 1 };
    k.needs()!.thirst = 20;
    await k.freeItemAction(8, 'bevo dal secchio');
    expect(k.needs()!.thirst).toBe(35);
    const learned = k.content.get('item.secchio')!.actions!.find((a) => a.effects?.length)!;
    expect(learned.label).toMatch(/Bevo dal secchio/);
    expect(k.rules().some((r) => r.possibile && /bevo dal secchio/.test(r.testo))).toBe(true);
    const calls = k.models.usage.text;
    k.itemAct(8, learned.id);
    expect(k.needs()!.thirst).toBe(50);
    // A careless judgement that "spends" the thing you act on does not take it from you.
    await k.freeItemAction(8, 'riempio il secchio e bevo');
    expect(countItem(inv, 'item.secchio')).toBe(1);
    expect(k.needs()!.thirst).toBe(60);
    // On the ground, the same item offers the learned action in its menu.
    const pc = k.playerCarpet();
    const dropped = k.spawnItem('item.secchio', pc.x + 0.9, pc.y);
    expect(k.actionsFor(dropped).some((a) => a.label === learned.label)).toBe(true);
    // What is impossible stays impossible, without asking again.
    await k.freeItemAction(8, 'lo faccio volare sulla luna');
    const after = k.models.usage.text;
    await k.freeItemAction(8, 'lo faccio volare sulla luna');
    expect(k.models.usage.text).toBe(after);
    expect(after).toBe(calls + 2);
    // The Council sees the rules in every later judgement.
    expect(k.council.context('narratore')).toMatch(/Regole già stabilite[\s\S]*bevo dal secchio/);
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
    const calls = k.models.usage.text;
    await k.freeCraft("un drago d'oro");
    expect(k.models.usage.text).toBe(calls);
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

describe('a society', () => {
  it('people have jobs, families among those already known, routines; met again they are the same', async () => {
    const k = await boot();
    clearArea(k);
    const pc = k.playerCarpet();
    const a = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1, pc.y, undefined, 'test#a');
    const ia = (await k.ensureIdentity(a))!;
    expect(ia.job).toBeTruthy();
    expect(ia.routine?.map((r) => r.quando)).toEqual(['mattina', 'giorno', 'sera', 'notte']);
    const b = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1.5, pc.y, undefined, 'test#b');
    const ib = (await k.ensureIdentity(b))!;
    // The second is related to someone already known, and that person knows it too.
    const people = JSON.parse(k.files['world/people.json']);
    const relative = people.persone.find((p: { nome: string }) => p.nome === ib.family?.[0].nome);
    expect(relative).toBeTruthy();
    expect(relative.famiglia.some((f: { nome: string }) => f.nome === ib.name)).toBe(true);
    expect(people.persone.map((p: { nome: string }) => p.nome)).toEqual(expect.arrayContaining([ia.name, ib.name]));
    expect(k.council.context('narratore')).toBeTruthy();
    // Met again (same origin), no new call: the same person.
    k.ecs.destroy(a);
    const calls = k.models.usage.text;
    const again = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1, pc.y, undefined, 'test#a');
    expect((await k.ensureIdentity(again))!.name).toBe(ia.name);
    expect(k.models.usage.text).toBe(calls);
    // Routines give them somewhere to go; relatives who meet greet each other.
    for (let i = 0; i < 70; i++) k.tick(1 / 60);
    expect(k.ecs.get(again, 'meta') ?? k.ecs.get(b, 'meta')).toBeTruthy();
    expect(k.bubbles.has(again) || k.bubbles.has(b)).toBe(true);
  });
});

describe('the Council keeps governing', () => {
  it('a session of the Council reads what happened and may add to the world', async () => {
    const k = await boot();
    const before = k.modules.size;
    expect(await k.holdSession(true)).toBe('abitante');
    expect(k.modules.size).toBeGreaterThan(before);
    expect([...k.modules.values()].some((m) => m.manifest.persona && /guaritrice/i.test(m.manifest.description ?? m.manifest.name))).toBe(true);
    expect(k.feed().some((e) => /Sessione del Concilio/.test(e.text))).toBe(true);
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

describe('the atlas', () => {
  it('every environment of the seed passes the validator; regions shape the places inside them', async () => {
    const k = await boot();
    for (const [id, def] of Object.entries(k.content.layouts)) expect(k.validator.validateLayout(id, def, k.palette, k.sampleDrafts()), id).toEqual([]);
    const atlas = JSON.parse(k.files['world/atlas.json']);
    expect(atlas.regioni.length).toBeGreaterThan(8);
    const r = atlas.regioni.find((x: { ambiente: string }) => x.ambiente === 'castello');
    expect((k as any).layoutsFor({ cx: r.centro[0], cy: r.centro[1] }).layouts.map((l: { id: string }) => l.id)).toEqual(['castello']);
    // Elsewhere, regional environments are not used at random.
    expect((k as any).layoutsFor({ cx: 0, cy: 1 }).layouts.some((l: { id: string }) => l.id === 'castello')).toBe(false);
  });

  it('asked for an elves wood, the Cartographer writes it, adds its terrain and places it on the map; locals know the way', async () => {
    const k = await boot();
    const r = await k.createEnvironment('un bosco degli elfi');
    expect(r.ok).toBe(true);
    expect(r.summary).toMatch(/Bosco degli Elfi[\s\S]*nord-est/);
    expect(k.content.layouts.bosco_elfi).toBeTruthy();
    expect(Object.values(k.palette).some((t) => t.name === 'albero argenteo')).toBe(true);
    const region = JSON.parse(k.files['world/atlas.json']).regioni.find((x: { nome: string }) => x.nome === 'Bosco degli Elfi');
    expect(region.ambiente).toBe('bosco_elfi');
    const pc = k.playerCarpet();
    expect(k.directionsAt(pc.x, pc.y).join(' ')).toMatch(/Bosco degli Elfi.*nord-est/);
    // The cartographer in the corona routes requests to environments, not objects.
    const chat = await k.talkToAgent('cartografo', 'crea un bosco incantato degli elfi');
    expect(chat.forged).toMatch(/Bosco degli Elfi/);
  });
});

describe('the life of people', () => {
  const person = async (k: Kernel, origin: string, dx: number) => {
    const pc = k.playerCarpet();
    const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + dx, pc.y, undefined, origin);
    const identity = (await k.ensureIdentity(id))!;
    return { id, name: identity.name };
  };

  it('they remember what you promised and what you are to them; a spouse can give you a child', async () => {
    const k = await boot();
    clearArea(k);
    const a = await person(k, 'vita#a', 1);
    await k.talk(a.id, 'Ti prometto che tornerò con una lanterna');
    expect(k.personOf(a.name)!.ricordi!.some((m) => m.peso === 3 && /promesso/.test(m.testo))).toBe(true);
    const r = await k.talk(a.id, 'Ti ricordi cosa ti ho detto?');
    expect(r.say).toMatch(/lanterna/);
    await k.talk(a.id, 'Ti amo. Sposami!');
    expect(k.personOf(a.name)!.legameViandante).toBe('moglie');
    expect(k.rules().some((x) => x.chiave === `legame|${a.name}`)).toBe(true);
    // "Altro…" on a person: judged by the Council, with social effects.
    await k.freeAction(a.id, 'vorrei avere un figlio con te');
    const child = readPeople(k.files).persone.find((p) => p.legameViandante === 'figlio')!;
    expect(child.famiglia.map((f) => f.nome)).toEqual(expect.arrayContaining([a.name, 'Viandante']));
    expect(k.ecs.query('identity').some((id) => k.ecs.get(id, 'identity').name === child.nome)).toBe(true);
  });

  it('they live their routine visibly: at night they go to bed and sleep there', async () => {
    const k = await boot();
    clearArea(k);
    const a = await person(k, 'vita#b', 1);
    const pc = k.playerCarpet();
    k.spawnModuleEntity(k.modules.get('obj.letto')!, pc.x + 2.5, pc.y);
    // Deep night.
    k.time = Kernel.DAY_SECONDS * 0.7;
    for (let i = 0; i < 60 * 8; i++) k.tick(1 / 60);
    const att = k.ecs.get(a.id, 'attivita');
    expect(att.tipo).toBe('dorme');
    expect(att.ferma).toBe(true);
  });

  it('people who meet talk to each other and remember it', async () => {
    const k = await boot();
    clearArea(k);
    const a = await person(k, 'vita#c', 1);
    const b = await person(k, 'vita#d', 1.6);
    for (const id of [a.id, b.id]) k.ecs.get(id, 'mind').mode = 'resta';
    for (let i = 0; i < 70; i++) k.tick(1 / 60);
    await settle(100);
    for (let i = 0; i < 60 * 6; i++) k.tick(1 / 60);
    expect(k.feed().some((e) => e.task === 'npc.dialogue')).toBe(true);
    expect(k.personOf(a.name)!.ricordi?.length).toBeGreaterThan(0);
  });

  it('the Narrator weaves a plot among them; beats happen; a quest is given, done and rewarded', async () => {
    const k = await boot();
    clearArea(k);
    const x = await person(k, 'trama#x', 1);
    const y = await person(k, 'trama#y', 2);
    const z = await person(k, 'trama#z', 3);
    void y;
    const plot = (await k.weaveStory(true))!;
    expect(plot.coinvolti.length).toBeGreaterThan(1);
    expect(plot.missione?.stato).toBe('offerta');
    const giver = plot.missione!.da;
    const giverId = [x, y, z].find((p) => p.name === giver)!.id;
    await k.talk(giverId, 'Posso aiutarti in qualche modo?');
    expect(k.quests().length).toBe(1);
    // The night comes: the first beat happens, and its person remembers it.
    k.time = Kernel.DAY_SECONDS * (k.day() + 0.7);
    for (let i = 0; i < 61; i++) k.tick(1 / 60);
    const first = readPlots(k.files)[0].tappe[0];
    expect(first.fatto).toBe(true);
    // Talking to whom the quest names completes it, with a reward.
    const target = plot.missione!.obiettivo.a!;
    await k.talk([x, y, z].find((p) => p.name === target)!.id, 'Ciao, mi manda qualcuno.');
    await settle(100);
    expect(k.quests().length).toBe(0);
    expect(countItem(k.inventory(), k.content.byName('Lanterna')!.id)).toBe(1);
  });
});
