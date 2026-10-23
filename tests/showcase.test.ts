// T21: the showcases of the studio. A device with «<» «>» at its sides picks what it shows (runes and spells,
// people, things, objects); E or a click on it opens a panel with what it is.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { SHOWCASES, type StudioItem } from '../src/kernel/corona';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

/** Puts the wanderer in the studio at a real-space point. */
function stand(k: Kernel, x: number, y: number): void {
  Object.assign(k.playerPos(), { x, y });
  k.zone = 'studio';
}

describe('the showcases of the studio', () => {
  it('stand on the ground floor of their buildings, with an arrow on each side and room in front', async () => {
    const k = await boot();
    const ids = k.corona.buildings.map((b) => b.id).filter((id) => SHOWCASES[id]);
    expect(ids.sort()).toEqual(['cose', 'magia', 'oggetti', 'persone']);
    for (const id of ids) {
      const f = k.corona.building(id)!.floors[0];
      const show = f.items.find((i) => i.kind === 'showcase')!;
      const prev = f.items.find((i) => i.kind === 'prev')!;
      const next = f.items.find((i) => i.kind === 'next')!;
      expect(show.source, id).toBe(SHOWCASES[id].source);
      expect([prev.x, prev.y, next.x, next.y]).toEqual([show.x - 1, show.y, show.x + show.w!, show.y]);
      // Nothing else on its cells; they block, the row in front is free, and the entrance is not in the way.
      for (let x = prev.x; x <= next.x; x++) {
        const here = f.items.filter((i) => i.y === show.y && x >= i.x && x < i.x + (i.w ?? 1));
        expect(here.length, `${id} ${x}`).toBe(1);
        expect(k.corona.free(x + 0.5, show.y + 0.5)).toBe(false);
        expect(k.corona.free(x + 0.5, show.y + 1.5), `${id} ${x}`).toBe(true);
      }
      const door = k.corona.entrance(k.corona.building(id)!);
      expect(Math.floor(door.y) !== show.y || Math.floor(door.x) < prev.x || Math.floor(door.x) > next.x).toBe(true);
    }
  });

  it('has something to show from every source, with a model where things have one', async () => {
    const k = await boot();
    const runes = k.showcaseEntries('rune');
    expect(runes.some((e) => e.id === 'rune:luce' && e.runes?.[0] === 'luce')).toBe(true);
    expect(runes.every((e) => e.facts.some(([w]) => w === 'Effetto'))).toBe(true);
    const people = k.showcaseEntries('persone');
    expect(people.map((e) => e.id)).toContain('module:npc.villager');
    expect(people.every((e) => e.model && e.path?.startsWith('modules/npc.'))).toBe(true);
    const things = k.showcaseEntries('cose');
    expect(things.length).toBeGreaterThan(1);
    expect(things.every((e) => e.model)).toBe(true);
    const objects = k.showcaseEntries('oggetti');
    expect(objects.length).toBeGreaterThan(3);
    expect(objects.every((e) => e.model && e.facts.length >= 3)).toBe(true);
  });

  it('changes what it shows with the arrows (round the list) and opens the panel on what it shows', async () => {
    const k = await boot();
    const f = k.corona.building('persone')!.floors[0];
    const at = (kind: StudioItem['kind']) => f.items.find((i) => i.kind === kind)!;
    const shown: string[] = [];
    const panels: any[] = [];
    k.bus.on('studio:showcase', (e: any) => shown.push(e.entry.id));
    k.bus.on('ui:showcase', (e: any) => panels.push(e));
    const first = k.showcaseOf('persone')!;
    expect(first.index).toBe(0);
    // E in front of «>»: the next one.
    stand(k, at('next').x + 0.5, at('next').y + 1.5);
    await k.interact();
    expect(k.showcaseOf('persone')!.index).toBe(1 % first.count);
    // A click on «<» twice: round to the end of the list.
    stand(k, at('showcase').x + 1.5, at('showcase').y + 1.5);
    expect(k.clickStudio(at('prev').x + 0.5, at('prev').y + 0.5)).toBe(true);
    expect(k.clickStudio(at('prev').x + 0.5, at('prev').y + 0.5)).toBe(true);
    expect(k.showcaseOf('persone')!.index).toBe(first.count - 1);
    expect(shown.length).toBe(3);
    // E in front of the silo, and a click on it: the panel with what it shows now.
    await k.interact();
    expect(k.clickStudio(at('showcase').x + 0.5, at('showcase').y + 0.5)).toBe(true);
    expect(panels.length).toBe(2);
    expect(panels[0].entry.id).toBe(k.showcaseEntries('persone')[first.count - 1].id);
    expect(panels[0].name).toBe('Studio dei Personaggi');
    // A click on the tall device falls on the ground behind it: it still counts.
    expect(k.clickStudio(at('showcase').x + 1.5, at('showcase').y - 0.4)).toBe(true);
    expect(panels.length).toBe(3);
    // Too far, or outside the studio, a click does nothing.
    stand(k, at('showcase').x + 0.5, at('showcase').y - 6);
    expect(k.clickStudio(at('showcase').x + 0.5, at('showcase').y + 0.5)).toBe(false);
    k.zone = 'sim';
    expect(k.clickStudio(at('showcase').x + 0.5, at('showcase').y + 0.5)).toBe(false);
  });
});
