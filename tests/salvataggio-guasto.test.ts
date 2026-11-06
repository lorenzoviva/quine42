// T262 (ADR-0137): a fault invalidates code, not the data of the game. With a fault open the state, the wanderers and the places are
// saved; code written without a commit never enters one; R goes back as before.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import type { FileMap } from '../src/kernel/types';
import { developAll, DT, manyPlayers, newLasting, open, pause, universeWith, type Lasting } from './espressivita/banco';

const BROKEN = 'local M = {}\nfunction M.update(dt) world.tolta() end\nreturn M\n';
const count = (k: Kernel, item: string) => k.inventory().slots.reduce((n, s) => n + (s?.item === item ? s.count : 0), 0);

/** Closes as a restart sees it: what the commits hold, never the working files. */
async function closeCommitted(k: Kernel, w: Lasting): Promise<void> {
  await pause(700);
  w.files = { ...k.repo.head().files };
}

describe('a fault open', () => {
  it('a module in fault: the state and the wanderer are saved, and they open again; the module is as it was', async () => {
    const universe = universeWith('mech.posa');
    const w = newLasting({ ...universe, 'modules/mech.posa/logic.lua': BROKEN });
    const k = await open(w);
    k.tick(DT);
    expect(k.faults.has('module:mech.posa:update')).toBe(true);
    const before = count(k, 'item.pane');
    k.give('item.pane', 2);
    expect(k.saveState()).toBe(true);
    await closeCommitted(k, w);
    const again = await open(w);
    expect(count(again, 'item.pane')).toBe(before + 2);
    expect(again.repo.head().files['modules/mech.posa/logic.lua']).toBe(BROKEN);
  });

  it('code the player wrote without a commit stays out of every commit: data saved, the code where it was', async () => {
    const w = newLasting(universeWith('mech.posa'));
    const k = await open(w);
    const valid = k.repo.head().files['modules/mech.posa/manifest.json'];
    const r = k.saveFile('modules/mech.posa/manifest.json', '{ rotto', true);
    expect(r).toMatchObject({ written: true, committed: false });
    expect(k.faults.size).toBeGreaterThan(0);
    k.give('item.pane', 1);
    expect(k.saveState()).toBe(true);
    const head = k.repo.head();
    expect(head.message).toBe('salvataggio della partita');
    expect(head.files['modules/mech.posa/manifest.json']).toBe(valid);
    expect(k.repo.working['modules/mech.posa/manifest.json']).toBe('{ rotto');
    // Another commit of the world while it is broken does not carry it either.
    k.repo.write('world/prova.txt', 'x\n');
    k.repo.commit('altro', 'kernel');
    expect(k.repo.head().files['modules/mech.posa/manifest.json']).toBe(valid);
    // The repair of the Engineer does not touch it: the player wrote it (rule 3).
    expect(k.repo.lastAuthorOf('modules/mech.posa/manifest.json')).toBe('player');
    await closeCommitted(k, w);
    const again = await open(w);
    expect(again.faults.list().filter((f) => f.key.startsWith('manifest:'))).toEqual([]);
    expect(count(again, 'item.pane')).toBeGreaterThan(0);
  });

  it('once the player makes it valid, it is committed as before', async () => {
    const k = await open(newLasting(universeWith('mech.posa')));
    const valid = k.repo.head().files['modules/mech.posa/manifest.json'];
    k.saveFile('modules/mech.posa/manifest.json', '{ rotto', true);
    const fixed = JSON.stringify({ ...JSON.parse(valid), name: 'Posa nuova' }, null, 2) + '\n';
    expect(k.saveFile('modules/mech.posa/manifest.json', fixed).committed).toBe(true);
    expect(k.repo.head().files['modules/mech.posa/manifest.json']).toBe(fixed);
  });

  it('the fault of one player does not stop the saves of the others', async () => {
    const k = await Kernel.boot({ files: manyPlayers(universeWith('mech.posa')), store: memoryStore(), ai: new MockAiModels() });
    await developAll(k);
    k.addWanderer('bea');
    k.faults.raise('rune:bea:1', 'la frase di bea non si esegue');
    k.as('bea', () => k.give('item.pane', 3));
    k.give('item.pane', 1);
    expect(k.saveState()).toBe(true);
    const files = k.repo.head().files;
    expect(files['world/giocatori/bea.json']).toContain('item.pane');
    expect(files['world/giocatori/io.json']).toContain('item.pane');
  });

  it('R goes back as before: to the last commit, which now has the data saved with the fault open', async () => {
    const k = await open(newLasting(universeWith('mech.posa')));
    const valid = k.repo.head().files['modules/mech.posa/manifest.json'];
    k.saveFile('modules/mech.posa/manifest.json', '{ rotto', true);
    k.give('item.pane', 4);
    k.saveState();
    const saved = k.repo.head().files['world/giocatori/io.json'];
    k.rollback();
    expect(k.faults.list().filter((f) => f.key.startsWith('manifest:'))).toEqual([]);
    expect(k.repo.working['modules/mech.posa/manifest.json']).toBe(valid);
    expect(k.repo.working['world/giocatori/io.json']).toBe(saved);
    expect(k.repo.isDirty()).toBe(false);
  });

  it('a universe that is not this world’s saves nothing: of another kernel, or with universe.json unreadable', async () => {
    const other = (u: FileMap): FileMap => ({ ...u, 'universe.json': JSON.stringify({ ...JSON.parse(u['universe.json']), kernel: '0.3.0' }) });
    const k = await Kernel.boot({ files: other(bundledFiles), store: memoryStore(), ai: new MockAiModels() });
    k.give('item.pane', 1);
    expect(k.saveState()).toBe(false);
    expect(k.saveUsage()).toBe(false);
  });
});
