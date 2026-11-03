import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { countItem } from '../src/kernel/inventory';
import type { StudioItem } from '../src/kernel/corona';
import { DT, boot, run, clearArea } from './world';

describe('new mechanics', () => {
  it('a saddled horse can be ridden: a state that makes you faster and carry more, learned as an action', async () => {
    const k = await boot();
    clearArea(k);
    const pc = k.wandererCarpet();
    const horse = k.spawnModuleEntity(k.modules.get('object.crate')!, pc.x + 0.9, pc.y);
    const cap = k.carryCapacity();
    await k.freeAction(horse, 'monto in sella al cavallo');
    expect(k.states()['a cavallo'].velocita).toBeCloseTo(1.8);
    expect(k.carryCapacity()).toBe(cap + 30);
    expect(k.actionsFor(horse).some((a) => a.label === 'Monta in sella')).toBe(true);
    await k.freeAction(horse, 'scendo dal cavallo');
    expect(k.states()['a cavallo']).toBeUndefined();
  });
});

describe('death and transcendence', () => {
  it('dying of thirst ends the session; one can continue in the same universe; after the corona nothing is lost', async () => {
    const k = await boot();
    clearArea(k);
    let died = '';
    k.bus.on('ui:death', ({ cause }: { cause: string }) => (died = cause));
    const n = k.needs()!;
    Object.assign(n, { thirst: 0, health: 0.5 });
    k.give('item.coltello', 1);
    run(k, 2);
    expect(died).toBe('sete');
    expect(k.dead).toBe(true);
    const t = k.time;
    run(k, 1);
    expect(k.time).toBe(t);
    await k.continueAfterDeath();
    expect(k.dead).toBe(false);
    expect(k.needs()!.health).toBeGreaterThan(50);
    expect(countItem(k.inventory(), 'item.coltello')).toBe(0);
    expect(k.inventory().slots.some((s) => s?.item === 'item.borsa-rune')).toBe(true);
    // Transcended: needs stay full, no death.
    k.exitedOnce = true;
    Object.assign(k.needs()!, { thirst: 0, hunger: 0, health: 1 });
    run(k, 2);
    expect(k.dead).toBe(false);
    expect(k.needs()!.thirst).toBeGreaterThan(99.9);
  });
});

describe('the neon studio', () => {
  it('no desks outside the Council hall (T49a): the cells before the history screen are free, the team stands there', async () => {
    const k = await boot();
    // Whoever went to a shelf during the Genesis is back at its post.
    k.archive.tick(30);
    k.archive.tick(30);
    for (const b of k.corona.buildings) {
      for (const f of b.storeys) if (b.id !== 'concilio') expect(f.items.filter((i) => i.kind === 'desk'), b.id).toEqual([]);
      if (b.id === 'concilio') continue;
      const screen = b.storeys[0].items.find((i) => i.kind === 'screen')!;
      for (let x = screen.x; x < screen.x + (screen.w ?? 1); x++) expect(k.corona.free(x + 0.5, screen.y - 0.5), `${b.id} ${x}`).toBe(true);
      const m = k.archive.avatars.get(`${b.teams[0]}@${b.id}`)!;
      expect([m.x, m.y], b.id).toEqual([screen.x + 1.5, screen.y - 0.5]);
      expect(k.corona.free(m.x, m.y), b.id).toBe(true);
    }
  });

  it('the Council sits at the round table; behind each seat a teleport to its room; every room leads back', async () => {
    const k = await boot();
    const hall = k.corona.building('concilio')!;
    const f0 = hall.storeys[0].items;
    expect(f0.some((i) => i.kind === 'table')).toBe(true);
    const seats = f0.filter((i) => i.kind === 'desk' && i.target);
    expect(seats.map((s) => s.target).sort()).toEqual(['arbitro', 'artista', 'cartografo', 'fisico', 'ingegnere', 'musicista', 'narratore', 'referente', 'scultore']);
    for (const s of seats) expect([...k.archive.avatars.values()].some((a) => a.agent === s.target && a.building === 'concilio')).toBe(true);
    const portals = f0.filter((i) => i.kind === 'portal');
    expect(portals.length).toBe(9);
    for (const b of k.corona.buildings) if (b.id !== 'concilio') expect(b.storeys[0].items.some((i) => i.kind === 'portal' && i.target === 'concilio'), b.id).toBe(true);
    for (const b of k.corona.buildings) if (b.id !== 'concilio') expect(b.storeys[0].items.some((i) => i.kind === 'screen'), b.id).toBe(true);
    // Through the cartographer's teleport, into the Office of places, where the atlas is, by the model of places.
    k.exitedOnce = true;
    k.carpet()!.active = false;
    const pad = portals.find((p) => p.target === 'luoghi')!;
    expect(portals.some((p) => p.target === 'cartografia')).toBe(false);
    Object.assign(k.wandererPos(), { x: pad.x + 0.5, y: pad.y + 0.5 });
    run(k, DT);
    await k.interact();
    expect(k.corona.roomAt(k.wandererPos().x, k.wandererPos().y)?.building.id).toBe('luoghi');
    const f0items = k.corona.building('luoghi')!.storeys[0].items;
    const atlasItem = f0items.find((i) => i.kind === 'atlas')!;
    expect(f0items.some((i) => i.kind === 'showcase' && i.device === 'plastico')).toBe(true);
    // Nothing of the room overlaps the atlas, and one can stand in front of it.
    const cells = (i: StudioItem) => Array.from({ length: (i.w ?? 1) * (i.h ?? 1) }, (_, n) => `${i.x + (n % (i.w ?? 1))},${i.y + Math.floor(n / (i.w ?? 1))}`);
    const taken = new Set(f0items.filter((i) => i !== atlasItem).flatMap(cells));
    for (const c of cells(atlasItem)) expect(taken.has(c), c).toBe(false);
    expect(k.corona.free(atlasItem.x + 1.5, atlasItem.y + 1.5)).toBe(true);
    let opened = false;
    k.bus.on('ui:atlas', () => (opened = true));
    Object.assign(k.wandererPos(), { x: atlasItem.x + 1.5, y: atlasItem.y + 1.5 });
    await k.interact();
    expect(opened).toBe(true);
    const view = await k.atlasView();
    expect(view.planned.length).toBeGreaterThan(0);
    expect(view.regions.length).toBeGreaterThan(5);
  });
});

describe('regression: walking with states', () => {
  it('the wanderer walks with no state, an empty state table, or on horseback (and faster then)', async () => {
    const moved: number[] = [];
    for (const st of [undefined, {}, { 'a cavallo': { velocita: 1.8, peso: 0, luce: 0, fino: 0 } }]) {
      const k = await boot();
      clearArea(k);
      if (st) k.ecs.set(k.wandererEntity, 'stati', JSON.parse(JSON.stringify(st)));
      k.carpet()!.active = false;
      (k.input as any).held.add('right');
      const x = k.wandererPos().x;
      run(k, 0.3);
      expect(k.faults.size).toBe(0);
      moved.push(k.wandererPos().x - x);
    }
    expect(moved[1]).toBeGreaterThan(1);
    expect(moved[2]).toBeGreaterThan(moved[1] * 1.5);
  });
});

describe('tile context menus', () => {
  it('every tile has a menu with "Altro…"; what stands on it adds its actions; a terrain learns', async () => {
    const k = await boot();
    clearArea(k);
    const pc = k.wandererCarpet();
    const col = Math.floor(pc.x) + 1;
    const row = Math.floor(pc.y);
    const plain = k.tileMenu(col, row);
    expect(plain.options.map((o) => o.id)).toEqual(['t:altro']);
    const box = k.spawnModuleEntity(k.modules.get('obj.credenza')!, col + 0.5, row + 0.5);
    const withBox = k.tileMenu(col, row);
    expect(withBox.entity).toBe(box);
    expect(withBox.options.some((o) => o.id === 'e:apri')).toBe(true);
    expect(withBox.options.at(-1)!.id).toBe('t:altro');
    // "Altro…" on the tile: judged, applied there, learned by the terrain.
    const code = k.tileAt(col + 1, row)!;
    await k.freeTileAction(col + 1, row, 'scavo qui una buca');
    const learned = k.palette[code].actions?.find((a) => a.effects?.length);
    expect(learned).toBeTruthy();
    const calls = k.ai.usage.text;
    const again = k.tileMenu(col + 2, row);
    const opt = again.options.find((o) => o.id === `t:${learned!.id}`);
    if (k.tileAt(col + 2, row) === code) {
      expect(opt).toBeTruthy();
      await k.performMenu(opt!.id, -1, col + 2, row);
      expect(k.ai.usage.text).toBe(calls);
    }
  });
});

describe('mechanics with interfaces', () => {
  it('the Council adds equipment slots as a module with a panel; wearing a helmet gives defence', async () => {
    const k = await boot();
    clearArea(k);
    expect(k.uiPanels().length).toBe(0);
    const r = await k.forgeMechanic('equipaggiamento: slot per indossare e impugnare');
    expect(r.ok).toBe(true);
    const p = k.uiPanels()[0];
    expect(p.panel.elementi.filter((e) => e.tipo === 'slot').map((e) => e.id)).toEqual(['testa', 'corpo', 'piedi', 'arma']);
    // A helmet from a pack of the Narrator (with its place and bonus).
    const items = JSON.parse(k.files['modules/items.base/manifest.json']);
    items.items.push({ id: 'item.elmo', name: 'Elmo di ferro', description: 'un elmo', category: 'vestiario', weight: 2, stack: 1, tags: ['metallo'], glyph: 'Ʌ', color: '#999999', slot: 'testa', bonus: { difesa: 3, velocita: 0.95 } });
    k.saveFile('modules/items.base/manifest.json', JSON.stringify(items, null, 2) + '\n');
    k.give('item.elmo', 1);
    const at = k.inventory().slots.findIndex((s) => s?.item === 'item.elmo');
    expect(k.equip(p.panel.id, 'piedi', at)).toBe(false);
    expect(k.equip(p.panel.id, 'testa', at)).toBe(true);
    expect(k.uiValue('difesa.valore')).toBe(3);
    expect(k.states().equipaggiamento.velocita).toBeCloseTo(0.95);
    expect(countItem(k.inventory(), 'item.elmo')).toBe(0);
    // The game is saved and resumed: the helmet is still on, the defence rebuilt.
    expect(k.saveState()).toBe(true);
    const k2 = await Kernel.boot({ files: { ...bundledFiles, ...k.files }, store: memoryStore(), ai: new MockAiModels() });
    expect(k2.slots()[p.panel.id].testa?.item).toBe('item.elmo');
    expect(k2.uiValue('difesa.valore')).toBe(3);
    expect(k.unequip(p.panel.id, 'testa')).toBe(true);
    expect(countItem(k.inventory(), 'item.elmo')).toBe(1);
    expect(k.uiValue('difesa.valore')).toBe(0);
  });
});
