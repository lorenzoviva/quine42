import { beforeEach, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { countItem } from '../src/kernel/inventory';

const DT = 1 / 60;

export async function boot(models = new MockModels()) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models });
  await develop(k);
  return k;
}

/** Ticks until every loaded chunk has been planned by the Cartographer. */
export async function develop(k: Kernel) {
  for (let i = 0; i < 60; i++) {
    k.tick(DT);
    await settle(25);
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(DT);
}

export function run(k: Kernel, seconds: number) {
  for (let t = 0; t < seconds; t += DT) k.tick(DT);
}

export const settle = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Moves the player next to a run of free cells and faces right, so inscriptions always fit. */
export function clearArea(k: Kernel, width = 24) {
  const { ox, oy } = k.offset();
  const free = (c: number, r: number) => (k as any).freeCell(c, r) && !k.runeCells.has(`${c},${r}`) && k.tileAt(c, r) !== undefined;
  for (let d = 0; d < 20; d++)
    for (const row of [d, -d]) {
      for (let col = -20; col < 0; col++) {
        let ok = true;
        for (let i = 0; i <= width && ok; i++) ok = free(col + i, row);
        if (!ok) continue;
        const p = k.playerPos();
        p.x = col + 0.5 - ox;
        p.y = row + 0.5 - oy;
        k.playerComp().facing = 'right';
        k.carpet()!.active = false;
        k.tick(DT);
        k.carpet()!.active = true;
        return { col, row };
      }
    }
  throw new Error('nessuno spazio libero trovato');
}

describe('kernel', () => {
  let k: Kernel;
  beforeEach(async () => {
    k = await boot();
  });

  it('boots the bundled universe without faults', () => {
    expect(k.faults.list()).toEqual([]);
    expect(k.modules.size).toBeGreaterThanOrEqual(12);
    expect(k.repo.head().message).toBe('genesi');
    expect(k.chunks.size).toBeGreaterThan(0);
    expect(k.needsGenesis()).toBe(true);
  });

  it('every chunk is planned by the Cartographer and its runes are valid live code', () => {
    expect([...k.chunks.values()].every((c) => c.stage !== 'draft')).toBe(true);
    expect([...k.chunks.values()].every((c) => c.place?.name)).toBe(true);
    expect(k.lines.size).toBeGreaterThan(0);
    for (const st of k.lines.values()) expect(st.compiled).toBe(true);
    expect(k.feed().some((e) => e.from === 'cartografo' && e.kind === 'propone')).toBe(true);
  });

  it('the carpet keeps the player at the centre and the corona stays hidden', () => {
    k.input.setHeld('right', true);
    run(k, 6);
    k.input.setHeld('right', false);
    const p = k.playerPos();
    expect(Math.abs(p.x)).toBeLessThan(2);
    expect(k.offset().ox).toBeGreaterThan(5);
    expect(k.coronaRevealed()).toBe(false);
    // Beyond the circle there is just more carpet: no code is exposed to the cursor.
    const hover = k.hoverAt(k.config.circleRadius + 2, 0);
    expect(hover?.kind).not.toBe('code');
  });

  it('runes that stop the carpet reveal the corona and let the player reach it', () => {
    clearArea(k);
    expect(k.inscribe(['carpet', '.', 'active', '=', 'false'])).toBe(true);
    run(k, DT * 2);
    expect(k.carpet()!.active).toBe(false);
    expect(k.faults.size).toBe(0);
    k.playerPos().x = k.config.circleRadius + 0.5;
    run(k, DT * 2);
    expect(k.zone).toBe('corona');
    expect(k.coronaRevealed()).toBe(true);
    expect(k.hoverAt(k.config.circleRadius + 1, 0)?.kind).toBe('code');
  });

  it('a broken phrase breaks the world; rollback repairs it and returns the runes', () => {
    clearArea(k);
    k.inscribe(['carpet', '.', 'strength', '=']);
    run(k, DT * 2);
    expect(k.faults.list().some((f) => f.key.startsWith('rune:'))).toBe(true);
    expect(k.brokenness()).toBeGreaterThan(0);
    k.rollback();
    run(k, DT * 2);
    expect(k.faults.size).toBe(0);
    expect(k.hand().tokens).toEqual(['carpet', '.', 'strength', '=']);
  });

  it('severing a binding breaks the system that depends on it', () => {
    clearArea(k);
    k.inscribe(['carpet', '=', 'nil']);
    run(k, DT * 3);
    expect(k.faults.has('module:core.carpet:update')).toBe(true);
    k.rollback();
    run(k, DT * 2);
    expect(k.faults.size).toBe(0);
  });

  it('the kernel survives absurd values', () => {
    clearArea(k);
    k.inscribe(['carpet', '.', 'ox', '=', 'nil']);
    run(k, DT * 2);
    expect(Number.isFinite(k.offset().ox)).toBe(true);
    expect(k.faults.has('kernel:sanitize')).toBe(true);
  });

  it('valid edits are hot reloaded and committed; invalid ones are refused unless forced', () => {
    const path = 'modules/core.carpet/logic.lua';
    const bad = k.saveFile(path, 'local M = {} function M.update( return M');
    expect(bad.written).toBe(false);
    const forced = k.saveFile(path, 'local M = {} function M.update( return M', true);
    expect(forced.committed).toBe(false);
    expect(k.faults.has('module:core.carpet:load')).toBe(true);
    k.rollback();
    expect(k.faults.size).toBe(0);
    const good = k.saveFile(path, k.files[path].replace('carpet.strength *', '0.5 * carpet.strength *'));
    expect(good.committed).toBe(true);
  });

  it('the corona maps every universe file', () => {
    const seen = new Set<string>();
    for (let y = -k.corona.outer; y < k.corona.outer; y++)
      for (let x = -k.corona.outer; x < k.corona.outer; x++) {
        const c = k.corona.at(x, y);
        if (c?.path) seen.add(c.path);
      }
    expect([...seen].sort()).toEqual(Object.keys(k.files).sort());
  });
});

describe('items and inventory', () => {
  let k: Kernel;
  beforeEach(async () => {
    k = await boot();
  });

  const spawnInFront = (id: string, dist = 0.9) => {
    const pc = k.playerCarpet();
    k.playerComp().facing = 'right';
    return k.spawnModuleEntity(k.modules.get(id)!, pc.x + dist, pc.y);
  };

  it('items on the ground are picked up, stacked and used', async () => {
    clearArea(k);
    spawnInFront('item.mela', 0.5);
    spawnInFront('item.mela', 0.6);
    await k.interact();
    await k.interact();
    const inv = k.inventory();
    expect(countItem(inv, 'item.mela')).toBe(2);
    expect(inv.slots.filter(Boolean).length).toBe(1);
    k.useSlot(inv.slots.findIndex((s) => s?.item === 'item.mela'));
    expect(countItem(inv, 'item.mela')).toBe(1);
  });

  it('an equipped tool acts on the world: scissors cut a bush, which drops an apple', () => {
    clearArea(k);
    const inv = k.inventory();
    inv.slots[0] = { item: 'item.forbici', count: 1 };
    k.equipSlot(0);
    expect(inv.equipped).toBe(0);
    const bush = spawnInFront('object.bush');
    k.action();
    expect(k.ecs.alive.has(bush)).toBe(false);
    expect(k.ecs.query('pickup').some((id) => k.ecs.get(id, 'pickup').item === 'item.mela')).toBe(true);
  });

  it('dropping puts the item back in the world', () => {
    clearArea(k);
    const inv = k.inventory();
    inv.slots[3] = { item: 'item.mela', count: 4 };
    k.dropSlot(3, 1);
    expect(inv.slots[3]!.count).toBe(3);
    expect(k.ecs.query('pickup').some((id) => k.ecs.get(id, 'pickup').item === 'item.mela')).toBe(true);
  });

  it('pushable things move when walked into', () => {
    const { col, row } = clearArea(k);
    const { ox, oy } = k.offset();
    k.carpet()!.active = false;
    const crate = k.spawnModuleEntity(k.modules.get('object.crate')!, col + 2.5, row + 0.5);
    const before = k.ecs.get(crate, 'pos').x;
    expect(k.playerPos().x + ox).toBeCloseTo(col + 0.5);
    k.input.setHeld('right', true);
    run(k, 0.8);
    k.input.setHeld('right', false);
    run(k, 0.5);
    expect(k.ecs.get(crate, 'pos').x).toBeGreaterThan(before + 0.3);
    expect(oy).toBeDefined();
  });

  it('NPCs answer in character and their actions are carried out', async () => {
    clearArea(k);
    const npc = spawnInFront('npc.villager', 1);
    const give = await k.talk(npc, 'Buongiorno! Hai qualcosa da darmi?');
    expect(give.action).toBe('dai');
    expect(countItem(k.inventory(), 'item.mela')).toBe(1);
    const follow = await k.talk(npc, 'Seguimi, ti prego');
    expect(follow.action).toBe('segui');
    expect(k.ecs.get(npc, 'mind').mode).toBe('segui');
    expect(k.ecs.get(npc, 'mind').history.length).toBe(4);
    expect(k.bubbles.has(npc)).toBe(true);
  });
});

describe('the Council', () => {
  it('forges a module: validated, committed, hot loaded and recorded in the bible', async () => {
    const k = await boot();
    const r = await k.askAgent('un fabbro che parla di spade');
    expect(r.ok).toBe(true);
    expect(k.modules.get('npc.fabbro')?.manifest.persona).toBeTruthy();
    expect(k.repo.head().author).toBe('agent');
    expect(JSON.parse(k.files['world/bible.json']).personaggi.some((p: string) => p.startsWith('Fabbro'))).toBe(true);
    const kinds = k.feed().map((e) => `${e.from}:${e.kind}`);
    for (const step of ['narratore:propone', 'fisico:propone', 'ingegnere:propone', 'arbitro:approva']) expect(kinds).toContain(step);
  });

  it('the Arbiter sends incoherent work back to the responsible agent', async () => {
    class Picky extends MockModels {
      reviews = 0;
      physicsCalls = 0;
      async text(call: Parameters<MockModels['text']>[0]) {
        if (call.task === 'forge.review' && this.reviews++ === 0)
          return JSON.stringify({ approvato: false, problemi: [{ agente: 'fisico', problema: 'una mela non pesa 40 kg' }] });
        if (call.task === 'forge.physics') this.physicsCalls++;
        return super.text(call);
      }
    }
    const models = new Picky();
    const k = await boot(models);
    const r = await k.askAgent('una mela dorata');
    expect(r.ok).toBe(true);
    expect(models.physicsCalls).toBe(2);
    const feed = k.feed();
    expect(feed.some((e) => e.from === 'arbitro' && e.kind === 'obietta' && e.to === 'fisico')).toBe(true);
    expect(feed.some((e) => e.from === 'fisico' && e.kind === 'corregge')).toBe(true);
  });

  it('code that does not load is sent back to the Engineer', async () => {
    class Sloppy extends MockModels {
      first = true;
      async text(call: Parameters<MockModels['text']>[0]) {
        if (call.task === 'forge.code' && this.first) {
          this.first = false;
          return JSON.stringify({ logic: 'local M = {} function M.on_use( return M' });
        }
        return super.text(call);
      }
    }
    const k = await boot(new Sloppy());
    const r = await k.askAgent('una pagnotta di pane');
    expect(r.ok).toBe(true);
    expect(k.feed().some((e) => e.from === 'kernel' && e.kind === 'scarta' && e.to === 'ingegnere')).toBe(true);
  });

  it('calls to functions that do not exist are rejected before the code ever runs', async () => {
    class Inventive extends MockModels {
      first = true;
      async text(call: Parameters<MockModels['text']>[0]) {
        if (call.task === 'forge.code' && this.first) {
          this.first = false;
          return JSON.stringify({ logic: 'local M = {}\nfunction M.on_interact(id) world.teleport(id, 0, 0) return "puf" end\nreturn M' });
        }
        return super.text(call);
      }
    }
    const k = await boot(new Inventive());
    const r = await k.askAgent('una statua che parla');
    expect(r.ok).toBe(true);
    expect(k.feed().some((e) => e.kind === 'scarta' && /world\.teleport non esiste/.test(e.text))).toBe(true);
  });

  it('generated code that fails at runtime is repaired by the Engineer; the player\'s breakage is respected', async () => {
    const k = await boot();
    const r = await k.askAgent('un fabbro che parla di spade');
    expect(r.ok).toBe(true);
    const path = 'modules/npc.fabbro/logic.lua';
    // Simulate a Council mistake that slipped through: committed by the agent, fails when run.
    k.repo.write(path, 'local M = {}\nfunction M.on_spawn(id) local t = nil; return t.x end\nreturn M\n');
    k.applyFiles({ ...k.repo.working });
    k.repo.commit('agente: versione difettosa', 'agent');
    const pc = k.playerCarpet();
    k.spawnModuleEntity(k.modules.get('npc.fabbro')!, pc.x + 2, pc.y);
    await settle(100);
    expect(k.faults.list().filter((f) => f.key.startsWith('module:npc.fabbro:'))).toEqual([]);
    expect(k.repo.head().message).toBe('riparazione: npc.fabbro');
    // Now the player breaks it: no repair, the fault stays.
    k.saveFile(path, 'local M = {}\nfunction M.on_spawn(id) error("mio") end\nreturn M\n');
    k.spawnModuleEntity(k.modules.get('npc.fabbro')!, pc.x + 3, pc.y);
    await settle(100);
    expect(k.faults.has('module:npc.fabbro:on_spawn')).toBe(true);
    expect(k.repo.head().author).toBe('player');
  });

  it('a unique character appears only once in the world', async () => {
    const k = await boot();
    const forged = await k.forgeModule('un vecchio eremita', 'agente');
    const m = k.modules.get(forged.id!)!;
    expect(m.manifest.unique).toBe(true);
    const plan = { place: { name: 'A', description: 'B' }, grid: Array.from({ length: k.config.chunkSize }, () => 'g'.repeat(k.config.chunkSize)), objects: [{ module: m.manifest.id, col: 4, row: 4 }, { module: m.manifest.id, col: 6, row: 6 }], fresh: [], runes: [] };
    const ch = [...k.chunks.values()][0];
    (k as any).applyPlan(ch, plan, plan.grid);
    expect(k.ecs.query('module').filter((id) => k.ecs.get(id, 'module').id === m.manifest.id).length).toBe(1);
  });

  it('genesis replaces the example content with a generated world', async () => {
    const k = await boot();
    const ok = await k.runGenesis('un regno di pastori sulle colline');
    expect(ok).toBe(true);
    expect(k.generationHeld).toBe(false);
    await develop(k);
    expect(k.needsGenesis()).toBe(false);
    expect(k.modules.has('npc.villager')).toBe(false);
    expect(k.modules.has('core.carpet')).toBe(true);
    expect([...k.modules.values()].some((m) => m.manifest.origin === 'genesi')).toBe(true);
    expect(k.faults.list()).toEqual([]);
  });

  it('invalid chunk plans are discarded and regenerated, invalid runes are dropped one by one', async () => {
    class Careless extends MockModels {
      plans = 0;
      async text(call: Parameters<MockModels['text']>[0]) {
        if (call.task === 'chunk.plan' && this.plans++ === 0) return JSON.stringify({ luogo: { nome: 'X', descrizione: '' }, griglia: ['ggg'], oggetti: [], rune: [] });
        return super.text(call);
      }
    }
    const k = await boot(new Careless());
    expect(k.feed().some((e) => e.from === 'kernel' && e.kind === 'scarta' && e.to === 'cartografo')).toBe(true);
    expect([...k.chunks.values()].every((c) => c.place?.name)).toBe(true);
    for (const st of k.lines.values()) expect(st.compiled).toBe(true);
  });
});
