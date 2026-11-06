import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { countItem } from '../src/kernel/inventory';
import { AGENTS } from '../src/kernel/agents/council';
import { ROOM_H, ROOM_W, type StudioItem } from '../src/kernel/corona';
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

  it('the Actor has its place in the studio, on or off (T158): gerboa, seat, console and a post in the Studio of the Characters', async () => {
    const k = await boot();
    expect(k.actor().on).toBe(false);
    const hall = k.corona.building('concilio')!.storeys[0].items;
    const seats = hall.filter((i) => i.kind === 'desk').map((s) => s.target);
    expect(seats.indexOf('actor')).toBe(seats.indexOf('narrator') + 1);
    expect(hall.find((i) => i.kind === 'desk' && i.target === 'actor')?.label).toBe("il posto dell'Attore");
    expect(hall.filter((i) => i.kind === 'portal' && i.target === 'persone').length).toBe(2);
    expect(k.corona.building('universo')!.storeys[0].items.find((i) => i.kind === 'console' && i.target === 'actor')?.label).toBe("la console dell'Attore");
    expect(k.forms.info('corona-gerboa-actor')).toBeTruthy();

    // Its post: a step along from the Narrator's, on a free cell, in the room of the people.
    const studio = k.corona.building('persone')!;
    const post = k.archive.avatars.get('actor@persone')!;
    const narrator = k.archive.avatars.get('narrator@persone')!;
    expect(post).toMatchObject({ agent: 'actor', name: 'Attore', color: AGENTS.actor.color, sigil: AGENTS.actor.sigil, building: studio.id });
    expect(post.x).toBeGreaterThan(narrator.x);
    expect(k.corona.free(post.x, post.y)).toBe(true);

    // Off, nobody calls it: at rest at the table and at its post, the console empty; the hall does not move when the option does.
    const before = JSON.stringify(hall);
    k.archive.consoles(k.working());
    expect(k.archive.avatars.has('actor@universo#console')).toBe(false);
    k.setAi({ actor: true });
    expect(JSON.stringify(k.corona.building('concilio')!.storeys[0].items)).toBe(before);

    // On, it works: speaks from its post when no file is at stake, and sits at its console.
    const x = post.x;
    k.council.say('actor', 'info', 'una battuta di Lena', undefined, 'npc.reply');
    expect(k.working()).toContain('actor');
    const speaking = k.archive.avatars.get('actor@persone')!;
    expect(speaking.say).toContain('una battuta');
    expect(speaking.tx).toBe(x);
    k.archive.consoles(k.working());
    expect(k.archive.avatars.has('actor@universo#console')).toBe(true);

    // A file of the people's room: it goes to the shelf, then back to its own post, not the Narrator's.
    const [id, file] = [...k.modules.entries()].find(([, m]) => m.manifestPath.startsWith('modules/npc.'))!;
    k.council.say('actor', 'info', `recita ${id}`, undefined, 'npc.reply');
    expect(speaking.path).toBe(file.manifestPath);
    k.archive.tick(25);
    k.archive.tick(25);
    expect([speaking.x, speaking.y]).toEqual([x, post.y]);
  });

  it('the Council sits at the round table; behind each seat a teleport to its room; every room leads back', async () => {
    const k = await boot();
    const hall = k.corona.building('concilio')!;
    const f0 = hall.storeys[0].items;
    expect(f0.some((i) => i.kind === 'table')).toBe(true);
    const seats = f0.filter((i) => i.kind === 'desk' && i.target);
    expect(seats.map((s) => s.target).sort()).toEqual(['actor', 'arbiter', 'artist', 'cartographer', 'engineer', 'liaison', 'musician', 'narrator', 'physicist', 'sculptor']);
    for (const s of seats) expect([...k.archive.avatars.values()].some((a) => a.agent === s.target && a.building === 'concilio')).toBe(true);
    const portals = f0.filter((i) => i.kind === 'portal');
    expect(portals.length).toBe(10);
    // Ten at the table and nothing collides: every item on its own cell, in the room, off the table, the teleports walkable.
    const footprints = f0.map((i) => `${i.x},${i.y}`);
    expect(new Set(footprints).size).toBe(footprints.length);
    const f = hall.storeys[0];
    for (const i of [...seats, ...portals]) {
      expect(i.x - f.ox).toBeGreaterThan(0);
      expect(i.x - f.ox).toBeLessThan(ROOM_W - 1);
      expect(i.y - f.oy).toBeGreaterThan(0);
      expect(i.y - f.oy).toBeLessThan(ROOM_H - 1);
    }
    for (const p of portals) expect(f0.some((i) => i.kind === 'desk' && i.x === p.x && i.y === p.y)).toBe(false);
    // The exit is left alone: nothing stands on its column in front of it, and from it one walks to every teleport.
    const exit = f0.find((i) => i.kind === 'exit')!;
    for (const i of [...seats, ...portals]) expect(i.x === exit.x && i.y > exit.y - 4, i.label).toBe(false);
    const seen = new Set([`${exit.x},${exit.y}`]);
    const queue = [[exit.x, exit.y]];
    for (const [x, y] of queue) {
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (seen.has(`${nx},${ny}`) || !k.corona.roomAt(nx, ny) || !k.corona.free(nx + 0.5, ny + 0.5)) continue;
        seen.add(`${nx},${ny}`);
        queue.push([nx, ny]);
      }
    }
    for (const p of portals) expect(seen.has(`${p.x},${p.y}`), p.label).toBe(true);
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
    expect(f0items.some((i) => i.kind === 'showcase' && i.device === 'diorama')).toBe(true);
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
    const box = k.spawnModuleEntity(k.modules.get('obj.cupboard')!, col + 0.5, row + 0.5);
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
    // The seed has one panel, the site of the ventures (T245d).
    expect(k.uiPanels().map((x) => x.module)).toEqual(['sys.work']);
    const r = await k.forgeMechanic('equipaggiamento: slot per indossare e impugnare');
    expect(r.ok).toBe(true);
    const p = k.uiPanels().find((x) => x.module !== 'sys.work')!;
    expect(p.panel.elements.filter((e) => e.type === 'slot').map((e) => e.id)).toEqual(['testa', 'corpo', 'piedi', 'arma']);
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
