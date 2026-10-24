import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { countItem } from '../src/kernel/inventory';
import { readPeople } from '../src/kernel/society';
import { activeQuests, type Plot } from '../src/kernel/plots';
import { memoriesFor, readWandererState, wanderersIn } from '../src/kernel/wanderers';
import type { FileMap } from '../src/kernel/types';

/** Ticks until every loaded chunk has been planned. */
async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
}

/** Offline models that remember every call. */
class Recording extends MockModels {
  calls: TextCall[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
}

async function boot(files: FileMap = bundledFiles, models = new Recording()) {
  const k = await Kernel.boot({ files, store: memoryStore(), models });
  await develop(k);
  return { k, models };
}

/** Someone to talk to, next to the wanderer. */
async function villager(k: Kernel, origin: string) {
  const pc = k.playerCarpet();
  const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1, pc.y, undefined, origin);
  return { id, name: (await k.ensureIdentity(id))!.name };
}

describe('the wanderer with an id (T34)', () => {
  it('an old universe loads the same: the wanderer of stato.json and «Viandante» in the registry are io', async () => {
    const { k: first } = await boot();
    first.give('item.pane', 3);
    const files: FileMap = {
      ...bundledFiles,
      'world/stato.json': JSON.stringify({ viandante: { inventory: first.inventory(), trasceso: false }, consumati: [], ora: 120 }),
      'world/people.json': JSON.stringify({
        persone: [
          {
            nome: 'Berta', tipo: 'npc.villager', specie: 'persona', genere: 'femmina', mestiere: 'fornaia', routine: [],
            famiglia: [{ nome: 'Viandante', legame: 'amica' }], legameViandante: 'amica',
            ricordi: [{ quando: 'giorno 1, mattina', testo: 'il viandante mi ha aiutata col forno', con: 'Viandante', peso: 2 }],
          },
        ],
        attesi: [],
      }),
    };
    const { k } = await boot(files);
    expect(k.wanderer()).toEqual({ id: 'io', nome: 'Viandante' });
    expect(countItem(k.inventory(), 'item.pane')).toBe(countItem(first.inventory(), 'item.pane'));
    expect(k.bondOf('Berta')).toBe('amica');
    const berta = readPeople(k.files).persone.find((p) => p.nome === 'Berta')!;
    expect(berta.famiglia).toEqual([{ nome: 'Viandante', legame: 'amica', viandante: 'io' }]);
    expect(berta.ricordi![0].viandante).toBe('io');
    expect(berta.legameViandante).toBeUndefined();
    const g = k.graph();
    expect(g.node('persona:viandante')?.giocatore).toBe('io');
    expect(g.links.some((l) => l.source === 'persona:berta' && l.target === 'persona:viandante' && l.legame === 'amica')).toBe(true);

    // The next save moves the wanderer into their own file; it loads back the same.
    expect(k.saveState()).toBe(true);
    const saved = k.repo.head().files;
    expect(JSON.parse(saved['world/stato.json']!).viandante).toBeUndefined();
    expect(JSON.parse(saved['world/stato.json']!).ora).toBeGreaterThanOrEqual(120);
    expect(countItem(readWandererState(saved, 'io')!.inventory, 'item.pane')).toBe(countItem(first.inventory(), 'item.pane'));
    const { k: again } = await boot(saved);
    expect(countItem(again.inventory(), 'item.pane')).toBe(countItem(first.inventory(), 'item.pane'));
  }, 30_000);

  it('two wanderers in the same kernel: each is remembered apart, by name, with their own bond and state', async () => {
    const { k, models } = await boot();
    expect(k.addWanderer('lia', 'Lia')).toBeDefined();
    expect(k.addWanderer('../fuori', 'X')).toBeUndefined();
    expect(k.wanderers()).toEqual([{ id: 'io', nome: 'Viandante' }, { id: 'lia', nome: 'Lia' }]);
    const { id, name } = await villager(k, 'due#a');

    await k.talk(id, 'Ti prometto che tornerò con una lanterna');
    const toLia = await k.talk(id, 'Ti ricordi cosa ti ho detto?', 'lia');
    expect(toLia.say).not.toMatch(/lanterna/);
    // The Narrator knows who is talking.
    const asked = models.calls.filter((c) => c.task === 'npc.reply').pop()!;
    expect(asked.prompt).toMatch(/Parli con Lia/);
    expect(asked.prompt).not.toMatch(/lanterna/);

    await k.talk(id, 'Ti prometto che tornerò con una spada', 'lia');
    const toMe = await k.talk(id, 'Ti ricordi cosa ti ho detto?');
    expect(toMe.say).toMatch(/lanterna/);
    expect(models.calls.filter((c) => c.task === 'npc.reply').pop()!.prompt).not.toMatch(/spada|Lia/);
    const memories = readPeople(k.files).persone.find((p) => p.nome === name)!.ricordi!;
    expect(memories.filter((m) => /lanterna/.test(m.testo)).map((m) => m.viandante)).toEqual(['io']);
    expect(memories.filter((m) => /spada/.test(m.testo)).map((m) => m.viandante)).toEqual(['lia']);
    expect(memoriesFor(memories, 'lia').some((m) => /lanterna/.test(m.testo))).toBe(false);

    // A bond is with one wanderer.
    await k.talk(id, 'Ti amo. Sposami!', 'lia');
    expect(k.as('lia', () => k.bondOf(name))).toBe('moglie');
    expect(k.bondOf(name)).toBeUndefined();
    const g = k.graph();
    expect(g.node('persona:viandante-lia')?.label).toBe('Lia');
    expect(g.links.some((l) => l.relation === 'legame' && l.target === 'persona:viandante-lia' && l.legame === 'moglie')).toBe(true);

    // Each carries their own things, saved in their own file.
    const mine = countItem(k.inventory(), 'item.formaggio');
    expect(k.as('lia', () => k.give('item.formaggio', 2))).toBe(2);
    expect(countItem(k.inventory(), 'item.formaggio')).toBe(mine);
    expect(k.saveState()).toBe(true);
    const saved = k.repo.head().files;
    expect(wanderersIn(saved).map((w) => w.id)).toEqual(['io', 'lia']);
    expect(JSON.parse(saved['world/giocatori/lia.json']!).nome).toBe('Lia');
    const { k: again } = await boot(saved);
    expect(again.wanderers().map((w) => w.id)).toEqual(['io']);
    again.addWanderer('lia');
    expect(again.wanderers()[1]).toEqual({ id: 'lia', nome: 'Lia' });
    expect(again.as('lia', () => countItem(again.inventory(), 'item.formaggio'))).toBe(countItem(k.as('lia', () => k.inventory()), 'item.formaggio'));
    expect(again.graph().node('persona:viandante-lia')).toBeDefined();
  }, 30_000);

  it('a quest belongs to who accepted it (io when the plot is older)', () => {
    const quest = (viandante?: string): Plot => ({
      id: `t-${viandante ?? 'vecchia'}`, titolo: 't', mistero: '', coinvolti: [], tappe: [], inizio: 0, stato: 'attiva',
      missione: { da: 'Berta', testo: 'porta il pane', obiettivo: { tipo: 'porta', oggetto: 'pane' }, stato: 'accettata', ...(viandante ? { viandante } : {}) },
    });
    const plots = [quest(), quest('lia'), quest('io')];
    expect(activeQuests(plots, 'io').map((q) => q.plot.id)).toEqual(['t-vecchia', 't-io']);
    expect(activeQuests(plots, 'lia').map((q) => q.plot.id)).toEqual(['t-lia']);
    expect(activeQuests(plots)).toHaveLength(3);
  });
});
