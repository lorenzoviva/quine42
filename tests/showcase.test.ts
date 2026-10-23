// T21: the showcases of the studio. A device with «<» «>» at its sides picks what it shows (runes and spells,
// people, things, objects); E or a click on it opens a panel with what it is.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { PRINTER, SHOWCASES, type StudioItem } from '../src/kernel/corona';

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
      // The arrows on its middle row (the printer is PRINTER rows deep, T24).
      const h = show.h ?? 1;
      expect(h, id).toBe(SHOWCASES[id].device === 'stampante' ? PRINTER : 1);
      const row = show.y + Math.floor(h / 2);
      expect([prev.x, prev.y, next.x, next.y]).toEqual([show.x - 1, row, show.x + show.w!, row]);
      // Nothing else on its cells; they block, the row in front is free, and the entrance is not in the way.
      for (let x = prev.x; x <= next.x; x++) {
        for (let y = show.y; y < show.y + h; y++) {
          if (y !== row && (x === prev.x || x === next.x)) continue;
          const here = f.items.filter((i) => y >= i.y && y < i.y + (i.h ?? 1) && x >= i.x && x < i.x + (i.w ?? 1));
          expect(here.length, `${id} ${x},${y}`).toBe(1);
          expect(k.corona.free(x + 0.5, y + 0.5)).toBe(false);
        }
        expect(k.corona.free(x + 0.5, show.y + h + 0.5), `${id} ${x}`).toBe(true);
      }
      const door = k.corona.entrance(k.corona.building(id)!);
      expect(Math.floor(door.y) < show.y || Math.floor(door.y) >= show.y + h || Math.floor(door.x) < prev.x || Math.floor(door.x) > next.x).toBe(true);
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

describe('the screen of the Tower of Magic (T22)', () => {
  it('shows every magic rune, then every known combination, with what speaking it does', async () => {
    const k = await boot();
    // A combination of three (it burns a crystal) and a rune nobody has spoken yet.
    k.content.spells['luce fuoco vento'] = { name: 'Cometa', description: 'Una scia di fuoco e luce.', cost: 20, effects: [{ tipo: 'fuoco', raggio: 1, durata: 5 }, { tipo: 'luce', raggio: 4, durata: 30 }] };
    delete k.content.spells.vita;
    const all = k.showcaseEntries('rune');
    const tokens = Object.keys(k.content.runes);
    expect(all.slice(0, tokens.length).map((e) => e.id)).toEqual(tokens.map((t) => `rune:${t}`));
    expect(all.slice(tokens.length).map((e) => e.id)).toEqual(['spell:acqua fuoco', 'spell:luce fuoco vento']);
    const fact = (id: string, what: string) => all.find((e) => e.id === id)!.facts.find(([w]) => w === what)?.[1];
    // A single rune with its spell: what it means, the spell, what it really does, its cost.
    expect(all.find((e) => e.id === 'rune:acqua')!.label).toBe('Laguz · Polla');
    expect(fact('rune:acqua', 'Significato')).toBe(k.content.runes.acqua.description);
    expect(fact('rune:acqua', 'Cosa fa')).toContain(`diventa ${k.palette.w.name}`);
    expect(fact('rune:acqua', 'Mana')).toBe('10');
    expect(fact('rune:acqua', 'Cristallo')).toBeUndefined();
    // Not spoken yet: no effect, the Narrator will name it.
    expect(fact('rune:vita', 'Effetto')).toMatch(/Nessuno ancora/);
    expect(fact('rune:vita', 'Incantesimo')).toBeUndefined();
    // A combination: its runes in order, each with its name, all the effects, the crystal from three runes up.
    const comet = all.find((e) => e.id === 'spell:luce fuoco vento')!;
    expect(comet.runes).toEqual(['luce', 'fuoco', 'vento']);
    expect(fact(comet.id, 'Rune')).toMatch(/Sowilo.*Kenaz.*Ansuz/);
    expect(fact(comet.id, 'Cosa fa')).toBe('fuoco per 5 s, raggio 1; luce per 30 s, raggio 4');
    expect(fact(comet.id, 'Cristallo')).toBe('ne consuma uno');
    expect(all.every((e) => e.path === 'modules/magic.runes/manifest.json' && e.facts.some(([w]) => w === 'Effetto'))).toBe(true);
  });

  it('shows each individual after its type, with the look it has in the world, the individual and the module (T23)', async () => {
    const routine = [{ quando: 'mattina', fa: 'impasta il pane', dove: 'lavoro' }];
    const persone = [
      { nome: 'Mara', specie: 'persona', genere: 'femmina', tipo: 'npc.villager', mestiere: 'fornaia', famiglia: [{ nome: 'Teo', legame: 'madre' }], routine, storia: 'Ha aperto il forno del borgo.', origine: '0,0#3', aspetto: 'grembiule infarinato' },
      { nome: 'Teo', specie: 'persona', genere: 'maschio', tipo: 'npc.villager', mestiere: 'garzone', famiglia: [{ nome: 'Mara', legame: 'figlio' }], routine },
    ];
    const k = await Kernel.boot({ files: { ...bundledFiles, 'world/people.json': JSON.stringify({ persone, attesi: [] }) }, store: memoryStore(), models: new MockModels() });
    const all = k.showcaseEntries('persone');
    const at = all.findIndex((e) => e.id === 'module:npc.villager');
    expect(all.slice(at + 1, at + 3).map((e) => e.id)).toEqual(['person:Mara', 'person:Teo']);
    const type = all[at], mara = all[at + 1], teo = all[at + 2];
    expect(type.facts.find(([w]) => w === 'Individui')?.[1]).toBe('Mara (fornaia), Teo (garzone)');
    // The seed of the entity met in the world (its origin), or of the name if it has none.
    expect(mara.model).toBe(type.model);
    expect(mara.seed).toBe(k.forms.seedFor(type.model!, '0,0#3'));
    expect(teo.seed).toBe(k.forms.seedFor(type.model!, 'Teo'));
    expect(mara.label).toBe('Mara · fornaia');
    const fact = (what: string) => mara.facts.find(([w]) => w === what)?.[1];
    expect(fact('Individuo')).toBe('Mara');
    expect(fact('Famiglia')).toBe('madre di Teo');
    expect(fact('Giornata')).toBe('mattina: impasta il pane');
    expect(fact('Aspetto')).toBe('grembiule infarinato');
    // Then the module: the same facts as its type, without the list of individuals.
    expect(fact('Modulo')).toBe('npc.villager');
    expect(fact('Individui')).toBeUndefined();
    expect(mara.path).toBe(type.path);
  });
});

describe('the printers of the things and of the objects (T24)', () => {
  it('are 3 × 3, near and clickable from any side, and open what they print', async () => {
    const k = await boot();
    for (const id of ['cose', 'oggetti']) {
      const f = k.corona.building(id)!.floors[0];
      const show = f.items.find((i) => i.kind === 'showcase')!;
      expect([show.device, show.w, show.h], id).toEqual(['stampante', 3, 3]);
      // The middle cell is the printer, from the kernel's point of view.
      const mid = { x: show.x + 1, y: show.y + 1 };
      expect(k.corona.at(mid.x, mid.y)?.item, id).toBe(show);
      // E from beside it (the far side from the arrows' row, or the row in front) finds it.
      for (const [x, y] of [[show.x + 1.5, show.y + 3.5], [show.x - 0.5, show.y + 2.5], [show.x + 3.5, show.y + 0.5]]) {
        stand(k, x, y);
        expect(k.corona.itemNear(x, y, 1.6, ['showcase'])?.target, `${id} ${x},${y}`).toBe(id);
      }
      const panels: any[] = [];
      k.bus.on('ui:showcase', (e: any) => panels.push(e));
      stand(k, show.x + 1.5, show.y + 3.5);
      // A click on its middle cell, where the thing is printed.
      expect(k.clickStudio(mid.x + 0.5, mid.y + 0.5)).toBe(true);
      expect(panels.at(-1).entry.id).toBe(k.showcaseOf(id)!.entry.id);
      expect(panels.at(-1).entry.model).toBeTruthy();
    }
  });
});
