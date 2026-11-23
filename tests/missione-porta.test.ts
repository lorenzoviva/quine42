// T501: a «bring» quest. Whoever gives it hands over what is to be carried only when it goes to someone else («take this to Berta»);
// what is to be brought back to the giver is to be found. Before, the giver handed it over anyway and, the wanderer talking to the one
// it goes to, the quest was done as soon as it was accepted (seen in the copy of `neapolis` with Gemini: «Portami una prova dal
// cantiere» given, delivered and rewarded in the same breath).
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { handsOver, PLOTS_FILE, readPlots, writePlots, type Plot, type Quest } from '../src/kernel/npc/model';

async function boot() {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  return k;
}

/** Someone next to the wanderer with a quest for them, and whoever it may go to. */
async function giver(k: Kernel, goal: (name: string) => Quest['goal']) {
  const pc = k.wandererCarpet();
  const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + 1, pc.y, undefined, 'missione-porta');
  const name = (await k.ensureIdentity(id))!.name;
  const plot: Plot = {
    id: 'trama-porta', title: 'La prova', mystery: '', involved: [name], beats: [], start: 0, state: 'active',
    quest: { from: name, text: 'Portami una prova.', goal: goal(name), reward: 'Pane', state: 'offered' },
  };
  expect(k.saveFile(PLOTS_FILE, writePlots([...readPlots(k.files), plot])).written).toBe(true);
  return { id, name };
}

const carried = (k: Kernel, item: string) => k.inventory().slots.some((s) => s && k.itemInfo(s.item).name === item);
const questOf = (k: Kernel) => readPlots(k.files).find((p) => p.id === 'trama-porta')!.quest!;

describe('a «bring» quest (T501)', () => {
  it('hands over only a delivery to someone else', () => {
    expect(handsOver('Berta', 'Bastiano')).toBe(true);
    expect(handsOver('Bastiano', 'Bastiano')).toBe(false);
    expect(handsOver(' bastiano  ', 'Bastiano')).toBe(false);
    expect(handsOver(undefined, 'Bastiano')).toBe(false);
    expect(handsOver('', 'Bastiano')).toBe(false);
  });

  it('what is to be brought back to the giver is to be found: the quest stays to do', async () => {
    const k = await boot();
    const { id, name } = await giver(k, (me) => ({ type: 'bring', item: 'Coccio antico', to: me }));
    const reply = await k.talk(id, 'Posso fare qualcosa per te?');
    expect(reply.action).toBe('quest');
    expect(questOf(k)).toMatchObject({ state: 'accepted', wanderer: 'me' });
    expect(carried(k, 'Coccio antico')).toBe(false);
    // Talking again does not complete it: there is nothing to deliver yet.
    await k.talk(id, 'Ciao di nuovo');
    expect(questOf(k).state).toBe('accepted');
    expect(k.quests().map((q) => q.da)).toContain(name);
  }, 60_000);

  it('the same without a «to»: it goes back to the giver', async () => {
    const k = await boot();
    const { id } = await giver(k, () => ({ type: 'bring', item: 'Coccio antico' }));
    await k.talk(id, 'Posso fare qualcosa per te?');
    expect(questOf(k).state).toBe('accepted');
    expect(carried(k, 'Coccio antico')).toBe(false);
  }, 60_000);

  it('a delivery to someone else is handed over, and stays to do until it is delivered', async () => {
    const k = await boot();
    const { id } = await giver(k, () => ({ type: 'bring', item: 'Lettera sigillata', to: 'Berta' }));
    await k.talk(id, 'Posso fare qualcosa per te?');
    expect(questOf(k).state).toBe('accepted');
    expect(carried(k, 'Lettera sigillata')).toBe(true);
  }, 60_000);
});
