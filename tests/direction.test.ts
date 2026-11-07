// T46a: the Direction, inside. The situation table stands in the middle of its war room: the operations under way on
// the world seen from above (the wanderer, the places being generated, the open plots at their beat, the quests, the
// faults where they happened), each on its region of the atlas; E or a click opens them in a panel.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { writePlots, PLOTS_FILE, type Plot } from '../src/kernel/npc/plots';
import type { FileMap } from '../src/kernel/types';

const individual = (nome: string, extra: Record<string, unknown> = {}) => ({
  nome,
  tipo: 'npc.villager',
  specie: 'person',
  genere: 'female',
  mestiere: 'pescatrice',
  famiglia: [],
  routine: [{ quando: 'day', fa: 'lavora', dove: 'work' }],
  ...extra,
});

/** The seed with an atlas (a region east of the first place, one far north), two people, an open plot with a quest. */
function files(): FileMap {
  const plots: Plot[] = [
    {
      id: 'trama-reti',
      title: 'Le reti sparite',
      mystery: 'Qualcuno taglia le reti di Nereo.',
      involved: ['Nereo', 'Ilde'],
      beats: [
        { day: 0, moment: 'morning', who: 'Nereo', where: 'work', what: 'conta le reti', done: true },
        { day: 1, moment: 'evening', who: 'Ilde', where: 'square', what: 'aspetta qualcuno' },
      ],
      quest: { from: 'Nereo', text: 'Trova chi taglia le reti.', goal: { type: 'go', place: 'Paludi del Nord' }, state: 'accepted' },
      start: 0,
      state: 'active',
    },
  ];
  return {
    ...bundledFiles,
    'world/atlas.json': JSON.stringify({
      regioni: [
        { id: 'colline', nome: 'Colline del Vento', descrizione: 'colline spoglie', ambiente: 'borgo', centro: [2, 0], raggio: 1 },
        { id: 'paludi', nome: 'Paludi del Nord', descrizione: 'acqua ferma', ambiente: 'borgo', centro: [0, -6], raggio: 1 },
      ],
    }),
    'world/people.json': JSON.stringify({ persone: [individual('Nereo', { origine: '2,1#o0' }), individual('Ilde', { origine: '1,0#o3' })] }),
    [PLOTS_FILE]: writePlots(plots),
  };
}

const boot = (f: FileMap = bundledFiles) => Kernel.boot({ files: f, store: memoryStore(), ai: new MockAiModels() });

function stand(k: Kernel, x: number, y: number): void {
  Object.assign(k.wandererPos(), { x, y });
  k.zone = 'studio';
}

describe('the Direction', () => {
  it('has the situation table in the middle of its ground floor, 5 × 3, with room in front', async () => {
    const k = await boot();
    const f = k.corona.building('universo')!.storeys[0];
    const t = f.items.find((i) => i.kind === 'situation')!;
    expect(t.label).toBe('il tavolo della situazione');
    expect([t.w, t.h]).toEqual([5, 3]);
    expect(k.corona.buildings.filter((b) => b.storeys.some((fl) => fl.items.some((i) => i.kind === 'situation'))).map((b) => b.id)).toEqual(['universo']);
    for (let x = t.x; x < t.x + 5; x++)
      for (let y = t.y; y < t.y + 3; y++) {
        expect(f.items.filter((i) => y >= i.y && y < i.y + (i.h ?? 1) && x >= i.x && x < i.x + (i.w ?? 1)), `${x},${y}`).toEqual([t]);
        expect(k.corona.free(x + 0.5, y + 0.5)).toBe(false);
      }
    // The front and the sides are free to walk.
    for (let x = t.x - 1; x <= t.x + 5; x++) expect(k.corona.free(x + 0.5, t.y + 3.5), `${x}`).toBe(true);
    for (let y = t.y; y < t.y + 3; y++) expect(k.corona.free(t.x - 0.5, y + 0.5) && k.corona.free(t.x + 5.5, y + 0.5), `${y}`).toBe(true);
  });

  it('opens with E in front of it or a click within reach, changing nothing', async () => {
    const k = await boot();
    const t = k.corona.building('universo')!.storeys[0].items.find((i) => i.kind === 'situation')!;
    const opened: any[] = [];
    k.bus.on('ui:situation', (e) => opened.push(e));
    const head = k.repo.head().id;
    stand(k, t.x + 2.5, t.y + 3.5);
    await k.interact();
    expect(opened.length).toBe(1);
    expect(opened[0].situation.ops.some((o: any) => o.kind === 'wanderer')).toBe(true);
    expect(k.clickStudio(t.x + 2.5, t.y + 1.5)).toBe(true);
    expect(opened.length).toBe(2);
    stand(k, t.x + 2.5, t.y + 9.5);
    expect(k.clickStudio(t.x + 2.5, t.y + 1.5)).toBe(false);
    expect(k.repo.head().id).toBe(head);
  });

  it('lists the plots, the quests, a fault and the places in the queue, each in its region', async () => {
    const k = await boot(files());
    const S = k.config.chunkSize;
    // A fault of code running in the world, while the wanderer is in the hills.
    Object.assign(k.wandererPos(), { x: 2 * S + 5 - (k.wandererCarpet().x - k.wandererPos().x), y: 5 - (k.wandererCarpet().y - k.wandererPos().y) });
    k.zone = 'sim';
    // The first tick loads the drafts around; the Cartographer has not planned any yet.
    k.tick(1 / 60);
    for (const c of k.chunks.values()) c.developing = false;
    k.faults.raise('module:sys.prova:update', 'attempt to index a nil value');
    // One of manifests is nowhere in the world.
    k.faults.raise('manifest:modules/x/manifest.json', 'json non valido');
    const s = k.situation();
    const of = (kind: string) => s.ops.filter((o) => o.kind === kind);

    const plot = of('plot')[0];
    expect(plot.label).toBe('Le reti sparite');
    // The beat it is at: the second, Ilde's, where Ilde lives (chunk 1,0, in the hills).
    expect(plot.detail).toMatch(/^tappa 2\/2: Ilde aspetta qualcuno/);
    expect([plot.cx, plot.cy, plot.region]).toEqual([1, 0, 'Colline del Vento']);

    const quest = of('quest')[0];
    expect(quest.detail).toBe('Nereo: vai a Paludi del Nord');
    expect([quest.cx, quest.cy, quest.region]).toEqual([0, -6, 'Paludi del Nord']);

    const fault = of('fault').find((o) => o.label === 'module:sys.prova:update')!;
    expect([fault.cx, fault.cy, fault.region]).toEqual([2, 0, 'Colline del Vento']);
    const code = of('fault').find((o) => o.label.startsWith('manifest:'))!;
    expect(code.cx).toBeUndefined();

    // The places not yet planned are in the queue.
    const drafts = [...k.chunks.values()].filter((c) => c.stage === 'draft');
    expect(drafts.length).toBeGreaterThan(0);
    expect(of('chunk').length).toBe(drafts.length);
    const hill = of('chunk').find((o) => o.cx === 1 && o.cy === 1);
    if (drafts.some((c) => c.cx === 1 && c.cy === 1)) expect(hill?.region).toBe('Colline del Vento');
    expect(of('chunk').every((o) => !o.live && o.detail === 'in coda')).toBe(true);
    // The first place is nobody's region.
    expect(of('chunk').find((o) => o.cx === 0 && o.cy === 0)?.region).toBeUndefined();

    expect(of('wanderer')[0]).toMatchObject({ cx: 2, cy: 0, region: 'Colline del Vento' });
    // The table shows all of it, the regions too.
    expect(s.bounds.y0).toBeLessThanOrEqual(-8);
    expect(s.bounds.x1).toBeGreaterThanOrEqual(4);
  });

  it('a place the Cartographer is planning pulses', async () => {
    const k = await boot(files());
    k.tick(1 / 60);
    const ch = [...k.chunks.values()].find((c) => c.stage === 'draft')!;
    ch.developing = true;
    const op = k.situation().ops.find((o) => o.kind === 'chunk' && o.cx === ch.cx && o.cy === ch.cy)!;
    expect(op.live).toBe(true);
    expect(op.detail).toBe('il Cartografo lo sta pianificando');
  });
});
