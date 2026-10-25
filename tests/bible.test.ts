// T47a: The Library of the World, inside: the lectern.
// An open holographic book on a dark water basin on the ground floor;
// «<» «>» flip through the world bible (one entry per page, edges stop);
// E or a click opens the page in a panel with touching graph nodes.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { DEVICE_MARGIN, LEGGIO_AT, SHOWCASE_AT } from '../src/kernel/corona';
import { biblePages, touchingNodes, type BiblePage } from '../src/kernel/bible';
import type { Bible } from '../src/kernel/agents/council';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

function stand(k: Kernel, x: number, y: number): void {
  Object.assign(k.playerPos(), { x, y });
  k.zone = 'studio';
}

const sampleBible: Bible = {
  titolo: 'Regno di Valmora',
  tono: 'quieto e vivo',
  sintesi: 'Un regno di boschi e colline.',
  storia: 'Nato attorno alla piazza dei carrettieri.',
  luoghi: ['Piazza di Valmora', 'Bosco dei Sussurri', 'Lago del Re Muto'],
  personaggi: ['Mastro Elio — fabbro laborioso', 'Selva — pastorella dei colli'],
  fatti: ['Il mercato si tiene ogni settimana in piazza.', 'Mastro Elio forgia attrezzi per i contadini.'],
  misteri: ['Le rune mandano una luce tenue nella notte.'],
};

describe('the bible pages', () => {
  it('cover the whole bible: prologue, places, characters, facts, and mysteries', () => {
    const pages = biblePages(sampleBible);

    // 1 prologo + 3 luoghi + 2 personaggi + 2 fatti + 1 mistero = 9 pages
    expect(pages.length).toBe(9);

    // First page is the prologue with title, summary and story
    expect(pages[0].sezione).toBe('prologo');
    expect(pages[0].titolo).toBe('Regno di Valmora');
    expect(pages[0].testo).toContain('Un regno di boschi e colline.');
    expect(pages[0].testo).toContain('Nato attorno alla piazza dei carrettieri.');

    // Places: one page per place
    const luoghiPages = pages.filter((p) => p.sezione === 'luoghi');
    expect(luoghiPages.length).toBe(3);
    expect(luoghiPages.map((p) => p.titolo)).toEqual(['Piazza di Valmora', 'Bosco dei Sussurri', 'Lago del Re Muto']);

    // Characters: one page per character
    const personaggiPages = pages.filter((p) => p.sezione === 'personaggi');
    expect(personaggiPages.length).toBe(2);
    expect(personaggiPages.map((p) => p.titolo)).toEqual(['Mastro Elio', 'Selva']);
    expect(personaggiPages[0].testo).toBe('Mastro Elio — fabbro laborioso');

    // Facts: one page per fact
    const fattiPages = pages.filter((p) => p.sezione === 'fatti');
    expect(fattiPages.length).toBe(2);
    expect(fattiPages[0].testo).toBe('Il mercato si tiene ogni settimana in piazza.');

    // Mysteries: one page per mystery
    const misteriPages = pages.filter((p) => p.sezione === 'misteri');
    expect(misteriPages.length).toBe(1);
    expect(misteriPages[0].testo).toBe('Le rune mandano una luce tenue nella notte.');
  });

  it('a page that names a person finds their node in the graph', async () => {
    const k = await boot();
    // Add a person to people.json and rebuild graph to test direct node discovery
    const people = JSON.parse(k.repo.working['world/people.json'] ?? '{"persone":[]}');
    people.persone.push({
      nome: 'Mastro Elio',
      tipo: 'npc.smith',
      mestiere: 'fabbro',
      specie: 'persona',
      genere: 'maschile',
      eta: 45,
      luogo: 'Piazza di Valmora',
    });
    k.repo.write('world/people.json', JSON.stringify(people, null, 2) + '\n');
    const g = k.graph();

    // Verify the node exists in the graph
    const personNode = g.find('Mastro Elio', 'persona')[0];
    expect(personNode).toBeDefined();

    // Create a bible page mentioning Mastro Elio
    const page: BiblePage = {
      index: 1,
      sezione: 'fatti',
      titolo: 'Fucina',
      testo: 'Nella bottega Mastro Elio forgia chiodi e aratri per tutti.',
      voceIndex: 0,
    };

    const nodes = touchingNodes(page, g, sampleBible);
    expect(nodes.some((n) => n.id === personNode.id)).toBe(true);
  });
});

describe('the Library lectern device', () => {
  it('stands on the ground floor of the Library with dark basin and navigation arrows', async () => {
    const k = await boot();
    const b = k.corona.building('mondo')!;
    const f = b.floors[0];

    const lectern = f.items.find((i) => i.kind === 'leggio')!;
    expect(lectern).toBeDefined();
    expect(lectern.label).toContain('leggio');
    expect(lectern.w).toBe(3);
    expect(lectern.h).toBe(3);

    const arrows = f.items.filter((i) => (i.kind === 'prev' || i.kind === 'next') && i.target === 'leggio');
    expect(arrows.length).toBe(2);

    const prev = arrows.find((a) => a.kind === 'prev')!;
    const next = arrows.find((a) => a.kind === 'next')!;
    expect(prev.x - f.ox).toBe(LEGGIO_AT.x - 1);
    expect(prev.y - f.oy).toBe(SHOWCASE_AT.y);
    expect(next.x - f.ox).toBe(LEGGIO_AT.x + LEGGIO_AT.w);
    expect(next.y - f.oy).toBe(SHOWCASE_AT.y);

    // Collision: the 3x3 basin blocks, while the surrounding cells are free
    for (let x = lectern.x; x < lectern.x + lectern.w!; x++) {
      for (let y = lectern.y; y < lectern.y + lectern.h!; y++) {
        expect(k.corona.free(x + 0.5, y + 0.5), `blocked at ${x},${y}`).toBe(false);
      }
    }

    // Cells around the lectern are free (margin DEVICE_MARGIN), excluding the arrow pillars
    for (let y = lectern.y - DEVICE_MARGIN; y <= lectern.y + lectern.h! + DEVICE_MARGIN; y++) {
      for (let x = lectern.x - DEVICE_MARGIN; x <= lectern.x + lectern.w! + DEVICE_MARGIN; x++) {
        const isBasin = x >= lectern.x && x < lectern.x + lectern.w! && y >= lectern.y && y < lectern.y + lectern.h!;
        const isArrow = arrows.some((a) => a.x === x && a.y === y);
        if (!isBasin && !isArrow) {
          expect(k.corona.free(x + 0.5, y + 0.5), `free at ${x},${y}`).toBe(true);
        }
      }
    }
  });

  it('stops at the ends ("i bordi fermano") when flipping pages', async () => {
    const k = await boot();
    const info = k.bibleOf();
    expect(info).toBeDefined();
    const count = info!.count;
    expect(count).toBeGreaterThan(1);

    // Initial state: page 0
    expect(k.bibleOf()!.index).toBe(0);

    // Stepping backward at start: stops at 0 ("i bordi fermano")
    k.stepBible(-1);
    expect(k.bibleOf()!.index).toBe(0);

    // Stepping forward advances page by page
    k.stepBible(1);
    expect(k.bibleOf()!.index).toBe(1);

    // Step to the end
    for (let i = 1; i < count; i++) {
      k.stepBible(1);
    }
    expect(k.bibleOf()!.index).toBe(count - 1);

    // Stepping forward at end: stops at count - 1 ("i bordi fermano")
    k.stepBible(1);
    expect(k.bibleOf()!.index).toBe(count - 1);

    // Step back once
    k.stepBible(-1);
    expect(k.bibleOf()!.index).toBe(count - 2);
  });

  it('opens the panel on E in front of the lectern or a click within reach', async () => {
    const k = await boot();
    const b = k.corona.building('mondo')!;
    const f = b.floors[0];
    const lectern = f.items.find((i) => i.kind === 'leggio')!;

    const opened: unknown[] = [];
    k.bus.on('ui:bible', (e) => opened.push(e));

    // Stand in front of the lectern (south side)
    stand(k, lectern.x + 1.5, lectern.y + lectern.h! + 0.5);
    await k.interact();
    expect(opened.length).toBe(1);

    // Click on the lectern within reach
    expect(k.clickStudio(lectern.x + 1.5, lectern.y + 1.5)).toBe(true);
    expect(opened.length).toBe(2);

    // Too far away: click does not trigger
    stand(k, lectern.x + 1.5, lectern.y + lectern.h! + 6.0);
    expect(k.clickStudio(lectern.x + 1.5, lectern.y + 1.5)).toBe(false);
    expect(opened.length).toBe(2);
  });

  it('clicking arrows flips pages via clickStudio', async () => {
    const k = await boot();
    const b = k.corona.building('mondo')!;
    const f = b.floors[0];
    const nextArrow = f.items.find((i) => i.kind === 'next' && i.target === 'leggio')!;

    stand(k, nextArrow.x + 0.5, nextArrow.y + 1.0);
    expect(k.bibleOf()!.index).toBe(0);

    const flipped: unknown[] = [];
    k.bus.on('studio:bible', (e) => flipped.push(e));

    // Click next arrow
    expect(k.clickStudio(nextArrow.x + 0.5, nextArrow.y + 0.5)).toBe(true);
    expect(k.bibleOf()!.index).toBe(1);
    expect(flipped.length).toBe(1);
  });
});
