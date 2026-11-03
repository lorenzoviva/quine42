import { beforeEach, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { countItem } from '../src/kernel/inventory';
import { DT, boot, run, clearArea, giveRunes } from './world';

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

  it('every chunk gets an environment from the Cartographer; the start is a village with lots', () => {
    const chunks = [...k.chunks.values()];
    expect(chunks.every((c) => c.stage === 'planned' && c.place?.name && k.content.layouts[c.plan!.layout])).toBe(true);
    const start = k.chunks.get('0,0')!;
    expect(start.plan!.layout).toBe('borgo');
    expect(start.lots.length).toBeGreaterThan(0);
    const b = start.lots[0];
    const S = k.config.chunkSize;
    expect(k.lotAt((b.floor[0] % S) + 0.5, Math.floor(b.floor[0] / S) + 0.5)?.lot).toBe(b);
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
    expect(k.config.circleRadius).toBe(42);
    clearArea(k);
    expect(k.inscribe(['carpet', '.', 'active', '=', 'false'])).toBe(false);
    giveRunes(k, ['carpet', '.', 'active', '=', 'false']);
    expect(k.inscribe(['carpet', '.', 'active', '=', 'false'])).toBe(true);
    expect(countItem(k.inventory(), 'rune:carpet')).toBe(0);
    run(k, DT * 2);
    expect(k.carpet()!.active).toBe(false);
    // At 41 steps from (0,0) the wanderer is still inside the simulation; at 42 steps they cross the circle into the corona.
    k.playerPos().x = 41;
    run(k, DT * 2);
    expect(k.zone).toBe('sim');
    k.playerPos().x = 42;
    run(k, DT * 2);
    expect(k.zone).toBe('corona');
    expect(k.coronaRevealed()).toBe(true);
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
    expect(names).toEqual(expect.arrayContaining(['Sala del Concilio', 'Studio dei Personaggi', 'Sala Sistemi', 'Torre della Magia', "Galleria dell'Artista", 'Ufficio dei Luoghi']));
    // The Cartographer's studio is the Office of places (T26c): one building for its work.
    expect(names).not.toContain('Studio del Cartografo');
    const bOf = (p: string) => k.corona.buildingOf(p)!.id;
    expect(bOf('modules/npc.cat/manifest.json')).toBe(bOf('modules/npc.villager/manifest.json'));
    expect(bOf('modules/npc.cat/manifest.json')).not.toBe(bOf('modules/sys.needs/logic.lua'));
    // The gallery shows every sprite and icon; the Office of places every terrain, from a floor after its files.
    const gallery = k.corona.building('galleria')!.floors.flatMap((f) => f.items.filter((i) => i.kind === 'sprite'));
    expect(gallery.some((i) => i.label === 'Mela rossa' || i.target?.startsWith('item:'))).toBe(true);
    const office = k.corona.building('luoghi')!;
    const tiles = office.floors.flatMap((f) => f.items.filter((i) => i.kind === 'tile'));
    expect(tiles.length).toBeGreaterThanOrEqual(Object.keys(k.palette).length - 1);
    const sampleFloor = office.floors.findIndex((f) => f.items.some((i) => i.kind === 'tile'));
    expect(sampleFloor).toBeGreaterThan(0);
    expect(office.floors[sampleFloor].items.some((i) => i.kind === 'file')).toBe(false);
    expect(office.floors[sampleFloor - 1].items.find((i) => i.kind === 'up')?.label).toMatch(/campionario/);
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
    const art = await k.talkToAgent('referente', 'riscolpisci il gatto più arancione');
    expect(art.forged).toMatch(/riscolpirà/i);
    expect(JSON.parse(k.repo.head().files['modules/npc.cat/manifest.json']!).appearance.aspetto).toMatch(/arancione/);
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
