import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { readPeople } from '../src/kernel/npc/society';
import { bondWith } from '../src/kernel/wanderers';
import { readPlots } from '../src/kernel/npc/plots';
import { MockAiModels } from '../src/kernel/ai/mock';
import { countItem } from '../src/kernel/inventory';
import { boot, develop, settle, clearArea } from './world';

describe('the Council', () => {
  it('forges a module: validated, committed, hot loaded and recorded in the bible', async () => {
    const k = await boot();
    const r = await k.askAgent('un fabbro che parla di spade');
    expect(r.ok).toBe(true);
    const m = k.modules.get('npc.fabbro')!.manifest;
    expect(m.persona).toBeTruthy();
    expect(m.inventory?.length).toBeGreaterThan(0);
    expect(k.repo.head().author).toBe('agent');
    const kinds = k.feed().map((e) => `${e.from}:${e.kind}`);
    for (const step of ['narrator:propone', 'physicist:propone', 'engineer:propone', 'arbiter:approva']) expect(kinds).toContain(step);
  });

  it('forged objects get actions and containers', async () => {
    const k = await boot();
    const r = await k.forgeModule('una madia di legno per il pane', 'agente', 'oggetto');
    const m = k.modules.get(r.id!)!.manifest;
    expect(m.actions?.length).toBeGreaterThan(0);
    expect(m.container?.loot).toBe('cucina');
  });

  it('the Arbiter sends incoherent work back to the responsible agent', async () => {
    class Picky extends MockAiModels {
      reviews = 0;
      physicsCalls = 0;
      async text(call: Parameters<MockAiModels['text']>[0]) {
        if (call.task === 'forge.review' && this.reviews++ === 0) return JSON.stringify({ approvato: false, problemi: [{ agente: 'physicist', problema: 'una mela non pesa 40 kg' }] });
        if (call.task === 'forge.physics') this.physicsCalls++;
        return super.text(call);
      }
    }
    const models = new Picky();
    const k = await boot(models);
    expect((await k.askAgent('una mela dorata')).ok).toBe(true);
    expect(models.physicsCalls).toBe(2);
    expect(k.feed().some((e) => e.from === 'arbiter' && e.kind === 'obietta' && e.to === 'physicist')).toBe(true);
  });

  it('code that does not load, or calls functions that do not exist, goes back to the Engineer', async () => {
    class Sloppy extends MockAiModels {
      n = 0;
      async text(call: Parameters<MockAiModels['text']>[0]) {
        if (call.task === 'forge.code' && this.n++ < 2) return JSON.stringify({ logic: this.n === 1 ? 'local M = {} function M.on_use( return M' : 'local M = {}\nfunction M.on_use(u, i) world.teleport(u) end\nreturn M' });
        return super.text(call);
      }
    }
    const k = await boot(new Sloppy());
    expect((await k.askAgent('una pagnotta di pane')).ok).toBe(true);
    const rejected = k.feed().filter((e) => e.from === 'kernel' && e.kind === 'scarta' && e.to === 'engineer');
    expect(rejected.length).toBe(2);
    expect(rejected[1].text).toMatch(/world\.teleport non esiste/);
  });

  it('generated code that fails at runtime is repaired; the player\'s breakage is respected', async () => {
    const k = await boot();
    await k.askAgent('un fabbro che parla di spade');
    const path = 'modules/npc.fabbro/logic.lua';
    k.repo.write(path, 'local M = {}\nfunction M.on_spawn(id) local t = nil; return t.x end\nreturn M\n');
    k.applyFiles({ ...k.repo.working });
    k.repo.commit('agente: versione difettosa', 'agent');
    const pc = k.wandererCarpet();
    k.spawnModuleEntity(k.modules.get('npc.fabbro')!, pc.x + 2, pc.y);
    await settle(100);
    expect(k.repo.head().message).toBe('riparazione: npc.fabbro');
    k.saveFile(path, 'local M = {}\nfunction M.on_spawn(id) error("mio") end\nreturn M\n');
    k.spawnModuleEntity(k.modules.get('npc.fabbro')!, pc.x + 3, pc.y);
    await settle(100);
    expect(k.faults.has('module:npc.fabbro:on_spawn')).toBe(true);
  });

  it('the world grows: a content pack of items, recipes and loot', async () => {
    const k = await boot();
    const before = k.content.items.size;
    expect(await k.growContent('prova', 6, true)).toBe(true);
    expect(k.content.items.size).toBeGreaterThan(before);
    expect(k.repo.head().message).toMatch(/pacchetto 1/);
  });

  it('genesis writes terrains, environments (test-running them), items and inhabitants', async () => {
    const k = await boot();
    expect(await k.runGenesis('un regno di pastori sulle colline')).toBe(true);
    expect(k.needsGenesis()).toBe(false);
    expect(k.modules.has('npc.villager')).toBe(false);
    expect(k.modules.has('items.base')).toBe(false);
    expect(k.modules.has('core.carpet')).toBe(true);
    expect(Object.keys(k.content.layouts)).toEqual(expect.arrayContaining(['macchia', 'stazzo']));
    expect(k.feed().some((e) => e.kind === 'scarta' && /rotto/.test(e.text))).toBe(true);
    expect(k.palette.f.indoor).toBe(true);
    expect(k.content.items.size).toBeGreaterThan(3);
    expect([...k.modules.values()].some((m) => m.manifest.origin === 'genesi')).toBe(true);
    await develop(k);
    expect(k.faults.list()).toEqual([]);
    const planned = [...k.chunks.values()].filter((c) => c.stage === 'planned');
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((c) => k.content.layouts[c.plan!.layout])).toBe(true);
  });

  it('invalid plans are discarded and regenerated, invalid runes dropped one by one', async () => {
    class Careless extends MockAiModels {
      plans = 0;
      async text(call: Parameters<MockAiModels['text']>[0]) {
        if (call.task === 'chunk.plan' && this.plans++ === 0) return JSON.stringify({ luogo: { nome: 'X', descrizione: '' }, ambiente: 'luna', oggetti: [], rune: [] });
        return super.text(call);
      }
    }
    const k = await boot(new Careless());
    expect(k.feed().some((e) => e.from === 'kernel' && e.kind === 'scarta' && /ambiente sconosciuto/.test(e.text))).toBe(true);
    for (const st of k.lines.values()) expect(st.compiled).toBe(true);
  });
});

describe('the life of people', () => {
  const individual = async (k: Kernel, origin: string, dx: number) => {
    const pc = k.wandererCarpet();
    const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, pc.x + dx, pc.y, undefined, origin);
    const identity = (await k.ensureIdentity(id))!;
    return { id, name: identity.name };
  };

  it('they remember what you promised and what you are to them; a spouse can give you a child', async () => {
    const k = await boot();
    clearArea(k);
    const a = await individual(k, 'vita#a', 1);
    await k.talk(a.id, 'Ti prometto che tornerò con una lanterna');
    expect(k.individualOf(a.name)!.memories!.some((m) => m.weight === 3 && /promesso/.test(m.text))).toBe(true);
    const r = await k.talk(a.id, 'Ti ricordi cosa ti ho detto?');
    expect(r.say).toMatch(/lanterna/);
    await k.talk(a.id, 'Ti amo. Sposami!');
    expect(k.bondOf(a.name)).toBe('moglie');
    expect(k.rules().some((x) => x.key === `legame|${a.name}`)).toBe(true);
    // "Altro…" on an individual: judged by the Council, with social effects.
    await k.freeAction(a.id, 'vorrei avere un figlio con te');
    const child = readPeople(k.files).people.find((p) => /^figli[oa]$/.test(bondWith(p, 'me') ?? ''))!;
    expect(child.family.map((f) => f.name)).toEqual(expect.arrayContaining([a.name, 'Viandante']));
    expect(k.ecs.query('identity').some((id) => k.ecs.get(id, 'identity').name === child.name)).toBe(true);
  });

  it('they live their routine visibly: at night they go to bed and sleep there', async () => {
    const k = await boot();
    clearArea(k);
    const a = await individual(k, 'vita#b', 1);
    const pc = k.wandererCarpet();
    // Only the bed next to them: the places' own beds may be anywhere around.
    for (const id of k.ecs.query('module')) if (k.ecs.get(id, 'module').id === 'obj.bed') k.ecs.destroy(id);
    // Off the straight line from them to the side of the bed they lie on: who walks there does not have to go round it (T307b).
    k.spawnModuleEntity(k.modules.get('obj.bed')!, pc.x + 1.5, pc.y + 2);
    // Deep night.
    k.time = Kernel.DAY_SECONDS * 0.7;
    for (let i = 0; i < 60 * 8; i++) k.tick(1 / 60);
    const att = k.ecs.get(a.id, 'activity');
    expect(att.kind).toBe('sleep');
    expect(att.still).toBe(true);
  });

  it('people who meet talk to each other and remember it', async () => {
    const k = await boot();
    clearArea(k);
    const a = await individual(k, 'vita#c', 1);
    const b = await individual(k, 'vita#d', 1.6);
    for (const id of [a.id, b.id]) k.ecs.get(id, 'mind').mode = 'resta';
    for (let i = 0; i < 70; i++) k.tick(1 / 60);
    await settle(100);
    for (let i = 0; i < 60 * 6; i++) k.tick(1 / 60);
    expect(k.feed().some((e) => e.task === 'npc.dialogue')).toBe(true);
    expect(k.individualOf(a.name)!.memories?.length).toBeGreaterThan(0);
  });

  it('the Narrator weaves a plot among them; beats happen; a quest is given, done and rewarded', async () => {
    const k = await boot();
    clearArea(k);
    const x = await individual(k, 'trama#x', 1);
    const y = await individual(k, 'trama#y', 2);
    const z = await individual(k, 'trama#z', 3);
    void y;
    const plot = (await k.weaveStory(true))!;
    expect(plot.involved.length).toBeGreaterThan(1);
    expect(plot.quest?.state).toBe('offered');
    const giver = plot.quest!.from;
    const giverId = [x, y, z].find((p) => p.name === giver)!.id;
    await k.talk(giverId, 'Posso aiutarti in qualche modo?');
    expect(k.quests().length).toBe(1);
    // The night comes: the first beat happens, and its individual remembers it.
    k.time = Kernel.DAY_SECONDS * (k.day() + 0.7);
    for (let i = 0; i < 61; i++) k.tick(1 / 60);
    const first = readPlots(k.files)[0].beats[0];
    expect(first.done).toBe(true);
    // Talking to whom the quest names completes it, with a reward.
    const target = plot.quest!.goal.to!;
    await k.talk([x, y, z].find((p) => p.name === target)!.id, 'Ciao, mi manda qualcuno.');
    await settle(100);
    expect(k.quests().length).toBe(0);
    expect(countItem(k.inventory(), k.content.byName('Lanterna')!.id)).toBe(1);
  });
});

describe('two tables', () => {
  it('what breaks the fourth wall is retired once, duplicates too; new concepts are asked again', async () => {
    const k = await boot();
    const manifest = (id: string, name: string, persona: string) =>
      JSON.stringify({ id, name, kind: 'entity', origin: 'agente', description: 'una figura', persona, appearance: { glyph: 'C', color: '#888888' } }, null, 2) + '\n';
    k.repo.write('modules/npc.censore/manifest.json', manifest('npc.censore', 'Censore delle Identità', 'Sorvegli il tessuto della realtà.'));
    k.repo.write('modules/npc.fornaia/manifest.json', manifest('npc.fornaia', 'Fornaia', 'Impasti il pane prima dell’alba.'));
    k.repo.write('modules/npc.fornaia-2/manifest.json', manifest('npc.fornaia-2', 'Fornaia', 'Un’altra fornaia.'));
    k.applyFiles({ ...k.repo.working });
    const gone = await k.reviewFourthWall();
    expect(gone.sort()).toEqual(['Censore delle Identità', 'Fornaia']);
    expect(k.modules.has('npc.fornaia')).toBe(true);
    expect(k.modules.has('npc.censore')).toBe(false);
    expect(await k.reviewFourthWall()).toEqual([]);
    // The principles go with every request to the Council.
    expect(k.council.context('narrator')).not.toMatch(/Crepe/);
  });
});
