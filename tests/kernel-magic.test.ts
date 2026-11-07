import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { countItem } from '../src/kernel/inventory';
import { Council } from '../src/kernel/agents/council';
import { nameSpell } from '../src/kernel/agents/effects';
import type { AiModels } from '../src/kernel/ai/models';
import { boot, clearArea, giveRunes } from './world';

describe('a society', () => {
  it('people have jobs, families among those already known, routines; met again they are the same', async () => {
    const k = await boot();
    clearArea(k);
    const pc = k.wandererCarpet();
    const a = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1, pc.y, undefined, 'test#a');
    const ia = (await k.ensureIdentity(a))!;
    expect(ia.job).toBeTruthy();
    expect(ia.routine?.map((r) => r.when)).toEqual(['morning', 'day', 'evening', 'night']);
    const b = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1.5, pc.y, undefined, 'test#b');
    const ib = (await k.ensureIdentity(b))!;
    // The second is related to someone already known, and that individual knows it too.
    const people = JSON.parse(k.files['world/people.json']);
    const relName = ib.family?.[0].name;
    const relative = people.people.find((p: { name: string }) => p.name === relName);
    // Either someone already met (who now knows it too) or a relative not met yet (awaited).
    if (relative) expect(relative.family.some((f: { name: string }) => f.name === ib.name)).toBe(true);
    else expect(people.expected.some((x: { name: string }) => x.name === relName)).toBe(true);
    expect(people.people.map((p: { name: string }) => p.name)).toEqual(expect.arrayContaining([ia.name, ib.name]));
    expect(k.council.context('narrator')).toBeTruthy();
    // Met again (same origin), no new call: the same individual.
    k.ecs.destroy(a);
    const calls = k.ai.usage.text;
    const again = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1, pc.y, undefined, 'test#a');
    expect((await k.ensureIdentity(again))!.name).toBe(ia.name);
    expect(k.ai.usage.text).toBe(calls);
    // Routines give them somewhere to go; relatives who meet greet each other.
    for (let i = 0; i < 70; i++) k.tick(1 / 60);
    expect(k.ecs.get(again, 'goal') ?? k.ecs.get(b, 'goal')).toBeTruthy();
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
    expect(runes.some((r) => r.token === 'lux')).toBe(true);
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
    giveRunes(k, ['lux', 'lux', 'x']);
    // Runes go into the rune pouch, not the slots.
    expect(countItem(k.bag(pouch)!, 'rune:lux')).toBe(2);
    expect(k.composeRune('lux')).toBe(true);
    expect(k.composeRune('x')).toBe(true);
    expect(k.incantation()).toEqual(['lux']);
    expect(await k.castSpell()).toBe(true);
    expect(k.ecs.query('light', 'ephemeral').length).toBe(1);
    expect(n.mana).toBe(96);
    expect(countItem(k.inventory(), 'rune:lux')).toBe(1);
    expect(k.phrase().tokens).toEqual(['x']);

    // A new sequence: named once by the Council, then known.
    giveRunes(k, ['vita', 'scutum', 'vita', 'scutum']);
    k.phrase().tokens = ['vita', 'scutum'];
    // The calls that name incantations (a place the cleared row brings in may be planned meanwhile).
    const named: string[] = [];
    const text = k.ai.text.bind(k.ai);
    k.ai.text = (c) => (c.task === 'spell.name' && named.push(c.task), text(c));
    expect(await k.castSpell()).toBe(true);
    expect(named.length).toBe(1);
    expect(k.content.spells['vita scutum']).toBeTruthy();
    expect(k.repo.head().message).toMatch(/incantesimo: vita scutum/);
    expect(k.ecs.get(k.wandererEntity, 'shield')?.expires).toBeGreaterThan(k.time);
    k.phrase().tokens = ['vita', 'scutum'];
    await k.castSpell();
    expect(named.length).toBe(1);
    // Spent: no runes left, nothing to cast.
    k.phrase().tokens = ['vita', 'scutum'];
    expect(await k.castSpell()).toBe(false);

    // Long incantations burn a magic crystal; without mana nothing happens.
    giveRunes(k, ['ignis', 'ignis', 'ventus']);
    k.phrase().tokens = ['ignis', 'ignis', 'ventus'];
    expect(await k.castSpell()).toBe(false);
    k.give('item.cristallo-magico', 1);
    expect(await k.castSpell()).toBe(true);
    expect(countItem(k.inventory(), 'item.cristallo-magico')).toBe(0);
    n.mana = 1;
    giveRunes(k, ['lux']);
    k.phrase().tokens = ['lux'];
    expect(await k.castSpell()).toBe(false);
  });

  it('a sequence of runes is a program: the order matters, a repeated rune is stronger (T57a)', async () => {
    const k = await boot();
    clearArea(k);
    k.needs()!.mana = 100;
    k.give('item.cristallo-magico', 2);
    const cast = async (seq: string[]) => {
      giveRunes(k, seq);
      k.phrase().tokens = [...seq];
      k.needs()!.mana = 100;
      expect(await k.castSpell()).toBe(true);
      return k.content.spells[seq.join(' ')];
    };
    const ab = await cast(['terra', 'ventus']);
    const ba = await cast(['ventus', 'terra']);
    // Two incantations, each under its own key, doing different things.
    expect(ab).toBeTruthy();
    expect(ba).toBeTruthy();
    expect(ba.name).not.toBe(ab.name);
    expect(JSON.stringify(ba.effects)).not.toBe(JSON.stringify(ab.effects));
    expect(ab.effects[0]).toMatchObject({ type: 'terrain' });
    expect(ba.effects[0]).toMatchObject({ type: 'push' });
    // Repetition strengthens: «ventus ventus terra» pushes harder than «ventus terra».
    const vvt = await cast(['ventus', 'ventus', 'terra']);
    expect((vvt.effects[0] as { force: number }).force).toBeGreaterThan((ba.effects[0] as { force: number }).force);
    // The seed's example is a real spell, not a message: «terra ignis» is a fireball.
    expect(k.content.spells['terra ignis'].effects[0]).toMatchObject({ type: 'fire', radius: 2 });
    expect(k.content.spells['aqua ignis']).toBeUndefined();
  });

  it('the Narrator learns how runes compose and which reorderings already exist (T57a)', async () => {
    const asked: string[] = [];
    const models = { text: async (r: { prompt: string }) => (asked.push(r.prompt), JSON.stringify({ nome: 'Frana', descrizione: 'x', costo: 10, effetti: [] })) } as unknown as AiModels;
    const c = new Council(models, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const runes = (seq: string[]) => seq.map((t) => ({ token: t, name: t, element: t, description: t }));
    await nameSpell(c, runes(['fuoco', 'terra']), [{ sequence: 'terra fuoco', name: 'Palla di fuoco', description: 'boom' }], ['erba']);
    expect(asked[0]).toContain('the order matters');
    expect(asked[0]).toMatch(/The same runes in another order[^\n]*terra fuoco → Palla di fuoco/);
    await nameSpell(c, runes(['acqua']), [{ sequence: 'terra fuoco', name: 'Palla di fuoco', description: 'boom' }], ['erba']);
    expect(asked[1]).not.toContain('Le stesse rune in un altro ordine');
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

describe('the atlas', () => {
  it('every environment of the seed passes the validator; regions shape the places inside them', async () => {
    const k = await boot();
    for (const [id, def] of Object.entries(k.content.layouts)) expect(k.validator.validateLayout(id, def, k.palette, k.sampleDrafts()), id).toEqual([]);
    const atlas = JSON.parse(k.files['world/atlas.json']);
    expect(atlas.regions.length).toBeGreaterThan(8);
    const r = atlas.regions.find((x: { environment: string }) => x.environment === 'castle');
    expect((k as any).environmentsFor({ cx: r.center[0], cy: r.center[1] }).layouts.map((l: { id: string }) => l.id)).toEqual(['castle']);
    // Elsewhere, regional environments are not used at random.
    expect((k as any).environmentsFor({ cx: 0, cy: 1 }).layouts.some((l: { id: string }) => l.id === 'castle')).toBe(false);
  });

  it('asked for an elves wood, the Cartographer writes it, adds its terrain and places it on the map; locals know the way', async () => {
    const k = await boot();
    const r = await k.createEnvironment('un bosco degli elfi');
    expect(r.ok).toBe(true);
    expect(r.summary).toMatch(/Bosco degli Elfi[\s\S]*nord-est/);
    expect(k.content.layouts.bosco_elfi).toBeTruthy();
    expect(Object.values(k.palette).some((t) => t.name === 'albero argenteo')).toBe(true);
    const region = JSON.parse(k.files['world/atlas.json']).regions.find((x: { name: string }) => x.name === 'Bosco degli Elfi');
    expect(region.environment).toBe('bosco_elfi');
    const pc = k.wandererCarpet();
    expect(k.directionsAt(pc.x, pc.y).join(' ')).toMatch(/Bosco degli Elfi.*nord-est/);
    // The cartographer in the corona routes requests to environments, not objects.
    const chat = await k.talkToAgent('cartographer', 'crea un bosco incantato degli elfi');
    expect(chat.forged).toMatch(/Bosco degli Elfi/);
  });
});
