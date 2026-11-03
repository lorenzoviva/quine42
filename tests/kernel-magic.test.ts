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
    expect(ia.routine?.map((r) => r.quando)).toEqual(['mattina', 'giorno', 'sera', 'notte']);
    const b = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1.5, pc.y, undefined, 'test#b');
    const ib = (await k.ensureIdentity(b))!;
    // The second is related to someone already known, and that individual knows it too.
    const people = JSON.parse(k.files['world/people.json']);
    const relName = ib.family?.[0].nome;
    const relative = people.persone.find((p: { nome: string }) => p.nome === relName);
    // Either someone already met (who now knows it too) or a relative not met yet (awaited).
    if (relative) expect(relative.famiglia.some((f: { nome: string }) => f.nome === ib.name)).toBe(true);
    else expect(people.attesi.some((x: { nome: string }) => x.nome === relName)).toBe(true);
    expect(people.persone.map((p: { nome: string }) => p.nome)).toEqual(expect.arrayContaining([ia.name, ib.name]));
    expect(k.council.context('narratore')).toBeTruthy();
    // Met again (same origin), no new call: the same individual.
    k.ecs.destroy(a);
    const calls = k.ai.usage.text;
    const again = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1, pc.y, undefined, 'test#a');
    expect((await k.ensureIdentity(again))!.name).toBe(ia.name);
    expect(k.ai.usage.text).toBe(calls);
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
    // Runes go into the rune pouch, not the slots.
    expect(countItem(k.bag(pouch)!, 'rune:luce')).toBe(2);
    expect(k.composeRune('luce')).toBe(true);
    expect(k.composeRune('x')).toBe(true);
    expect(k.incantation()).toEqual(['luce']);
    expect(await k.castSpell()).toBe(true);
    expect(k.ecs.query('luce', 'effimero').length).toBe(1);
    expect(n.mana).toBe(96);
    expect(countItem(k.inventory(), 'rune:luce')).toBe(1);
    expect(k.phrase().tokens).toEqual(['x']);

    // A new sequence: named once by the Council, then known.
    giveRunes(k, ['vita', 'scudo', 'vita', 'scudo']);
    k.phrase().tokens = ['vita', 'scudo'];
    const calls = k.ai.usage.text;
    expect(await k.castSpell()).toBe(true);
    expect(k.ai.usage.text).toBe(calls + 1);
    expect(k.content.spells['vita scudo']).toBeTruthy();
    expect(k.repo.head().message).toMatch(/incantesimo: vita scudo/);
    expect(k.ecs.get(k.wandererEntity, 'scudo')?.fino).toBeGreaterThan(k.time);
    k.phrase().tokens = ['vita', 'scudo'];
    await k.castSpell();
    expect(k.ai.usage.text).toBe(calls + 1);
    // Spent: no runes left, nothing to cast.
    k.phrase().tokens = ['vita', 'scudo'];
    expect(await k.castSpell()).toBe(false);

    // Long incantations burn a magic crystal; without mana nothing happens.
    giveRunes(k, ['fuoco', 'fuoco', 'vento']);
    k.phrase().tokens = ['fuoco', 'fuoco', 'vento'];
    expect(await k.castSpell()).toBe(false);
    k.give('item.cristallo-magico', 1);
    expect(await k.castSpell()).toBe(true);
    expect(countItem(k.inventory(), 'item.cristallo-magico')).toBe(0);
    n.mana = 1;
    giveRunes(k, ['luce']);
    k.phrase().tokens = ['luce'];
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
    const ab = await cast(['terra', 'vento']);
    const ba = await cast(['vento', 'terra']);
    // Two incantations, each under its own key, doing different things.
    expect(ab).toBeTruthy();
    expect(ba).toBeTruthy();
    expect(ba.name).not.toBe(ab.name);
    expect(JSON.stringify(ba.effects)).not.toBe(JSON.stringify(ab.effects));
    expect(ab.effects[0]).toMatchObject({ tipo: 'terreno' });
    expect(ba.effects[0]).toMatchObject({ tipo: 'spingi' });
    // Repetition strengthens: «vento vento terra» pushes harder than «vento terra».
    const vvt = await cast(['vento', 'vento', 'terra']);
    expect((vvt.effects[0] as { forza: number }).forza).toBeGreaterThan((ba.effects[0] as { forza: number }).forza);
    // The seed's example is a real spell, not a message: «terra fuoco» is a fireball.
    expect(k.content.spells['terra fuoco'].effects[0]).toMatchObject({ tipo: 'fuoco', raggio: 2 });
    expect(k.content.spells['acqua fuoco']).toBeUndefined();
  });

  it('the Narrator learns how runes compose and which reorderings already exist (T57a)', async () => {
    const asked: string[] = [];
    const models = { text: async (r: { prompt: string }) => (asked.push(r.prompt), JSON.stringify({ nome: 'Frana', descrizione: 'x', costo: 10, effetti: [] })) } as unknown as AiModels;
    const c = new Council(models, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const runes = (seq: string[]) => seq.map((t) => ({ token: t, name: t, element: t, description: t }));
    await nameSpell(c, runes(['fuoco', 'terra']), [{ sequence: 'terra fuoco', name: 'Palla di fuoco', description: 'boom' }], ['erba']);
    expect(asked[0]).toContain("l'ordine conta");
    expect(asked[0]).toMatch(/Le stesse rune in un altro ordine[^\n]*terra fuoco → Palla di fuoco/);
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
    expect(atlas.regioni.length).toBeGreaterThan(8);
    const r = atlas.regioni.find((x: { ambiente: string }) => x.ambiente === 'castello');
    expect((k as any).environmentsFor({ cx: r.centro[0], cy: r.centro[1] }).layouts.map((l: { id: string }) => l.id)).toEqual(['castello']);
    // Elsewhere, regional environments are not used at random.
    expect((k as any).environmentsFor({ cx: 0, cy: 1 }).layouts.some((l: { id: string }) => l.id === 'castello')).toBe(false);
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
    const pc = k.wandererCarpet();
    expect(k.directionsAt(pc.x, pc.y).join(' ')).toMatch(/Bosco degli Elfi.*nord-est/);
    // The cartographer in the corona routes requests to environments, not objects.
    const chat = await k.talkToAgent('cartografo', 'crea un bosco incantato degli elfi');
    expect(chat.forged).toMatch(/Bosco degli Elfi/);
  });
});
