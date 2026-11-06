// T183: the cost of a primitive added later, measured on a universe made with the kernel of before. The universes here come from the git history of the seed:
// they were made by a kernel that had no models, no lots, no sound, no water. See «Il costo di una primitiva aggiunta dopo» in docs/design/espressivita.md.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { bundledFiles } from '../../src/kernel/bundle';
import { MemoryChunks } from '../../src/kernel/chunks';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import type { FileMap } from '../../src/kernel/types';
import { prepareUniverse, seedHashes, upgradeFromSeed } from '../../src/kernel/universes';
import { compileMjx } from '../../src/mj/model';
import { closeWorld, developAll, DT, newLasting, open, play, universeWith } from './banco';

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });

/** The seed as it was at a commit, as a universe made from it (its `seed.json` says so). */
function universeAt(commit: string): FileMap {
  const files: FileMap = {};
  for (const n of git('ls-tree', '-r', '--name-only', commit, 'universe/').split('\n').filter(Boolean)) files[n.slice('universe/'.length)] = git('show', `${commit}:${n}`).replace(/\r\n/g, '\n');
  return { ...files, 'seed.json': JSON.stringify(seedHashes(files)) };
}

const hasHistory = (() => {
  try {
    return git('cat-file', '-t', '6f2d8df').trim() === 'commit';
  } catch {
    return false;
  }
})();

const boot = (files: FileMap) => Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });

const madeFrom = (seed: FileMap): FileMap => ({ ...seed, 'seed.json': JSON.stringify(seedHashes(seed)) });

describe('a universe made with an older kernel', () => {
  // The last of the 20th of October, before models, lots, sound and water; one of the 26th; the last before the renames.
  it.skipIf(!hasHistory).each(['6f2d8df', '7ced571', '0d773f2'])('%s opens with no fault, as it is and after the update from the seed', async (commit) => {
    // Of the contract 0.1: ported, then given the seed of today, as a load does (T307a); as it is, the kernel ports it at boot.
    const old = universeAt(commit);
    const { files, updated } = prepareUniverse(old, bundledFiles);
    expect(updated.length).toBeGreaterThan(0);
    for (const f of [old, files]) {
      const k = await boot(f);
      await developAll(k);
      play(k, 1);
      expect(k.faults.list()).toEqual([]);
      expect([...k.chunks.values()].some((c) => c.stage === 'planned')).toBe(true);
    }
  });

  it.skipIf(!hasHistory)('what the universe wrote itself stays: the update never touches it, and the module keeps working', async () => {
    const old = universeAt('6f2d8df');
    const mine = '-- Riscritto dal Concilio.\nlocal M = {}\nfunction M.update(dt) end\nreturn M\n';
    const { files } = prepareUniverse({ ...old, 'modules/sys.needs/logic.lua': mine }, bundledFiles);
    expect(files['modules/sys.needs/logic.lua']).toBe(mine);
    const k = await boot(files);
    k.tick(DT);
    expect(k.faults.list()).toEqual([]);
  });
});

describe('a new field', () => {
  it('in a manifest: unknown, the validator lets it pass and it stays in the file', async () => {
    const k = await boot(bundledFiles);
    const raw = JSON.stringify({ id: 'mech.futura', name: 'Futura', kind: 'entity', appearance: { glyph: 'F', color: '#ffffff' }, campo_di_domani: { a: 1 } });
    const { manifest, errors } = k.validator.parseManifest('modules/mech.futura/manifest.json', raw);
    expect(errors).toEqual([]);
    expect((manifest as any).campo_di_domani).toEqual({ a: 1 });
  });

  it('TRAP: a field the seed adds to a manifest does not reach a universe that rewrote that manifest; only four keyed lists do', () => {
    const seedManifest = JSON.parse(bundledFiles['modules/sys.needs/manifest.json']);
    const rewritten = { ...madeFrom(bundledFiles), 'modules/sys.needs/manifest.json': JSON.stringify({ ...seedManifest, description: 'la nostra' }) };
    const next = { ...bundledFiles, 'modules/sys.needs/manifest.json': JSON.stringify({ ...seedManifest, campo_nuovo: 1, runes: { nuova: { nome: 'x' } } }) };
    const up = JSON.parse(upgradeFromSeed(rewritten, next).files['modules/sys.needs/manifest.json']);
    expect(up.campo_nuovo).toBeUndefined();
    expect(up.runes.nuova).toBeDefined();
    expect(up.description).toBe('la nostra');
  });

  it('in the saved state, what the kernel does not know stays at the next save (T245a: once a TRAP, it was thrown away)', async () => {
    const w = newLasting({
      ...bundledFiles,
      'world/state.json': JSON.stringify({ consumati: [], ora: 5, di_domani: { x: 1 } }),
      'world/players/me.json': JSON.stringify({ needs: { hunger: 50, thirst: 50, energy: 50, health: 50, mana: 50 }, di_domani: 1 }),
    });
    const k = await open(w);
    k.give('item.pane', 1);
    await closeWorld(k, w);
    expect(JSON.parse(w.files['world/state.json']).di_domani).toEqual({ x: 1 });
    expect(JSON.parse(w.files['world/players/me.json']).di_domani).toBe(1);
  });
});

describe('a new effect', () => {
  const next = (files: FileMap) => ({
    ...files,
    'modules/core.effects/logic.lua': files['modules/core.effects/logic.lua'].replace('function M.apply(', 'function F.vento(_, _, e) return "Tira vento: " .. e.force end\n\nfunction M.apply('),
  });
  const apply = async (files: FileMap) => {
    const k = await boot(files);
    const { value, failed } = k.runModule('core.effects', 'apply', k.wandererEntity, k.wandererEntity, { type: 'vento', force: 3 });
    return { value, failed };
  };

  it('arrives in the universes that did not touch core.effects', async () => {
    const { files } = upgradeFromSeed(madeFrom(bundledFiles), next(bundledFiles));
    expect(await apply(files)).toEqual({ value: 'Tira vento: 3', failed: false });
  });

  it('in a universe that rewrote core.effects the new effect does not happen, and a fault says so (T260: once it was a silence)', async () => {
    const mine = `${bundledFiles['modules/core.effects/logic.lua']}\n-- ritoccato\n`;
    const { files } = upgradeFromSeed({ ...madeFrom(bundledFiles), 'modules/core.effects/logic.lua': mine }, next(bundledFiles));
    expect(files['modules/core.effects/logic.lua']).toBe(mine);
    const r = await apply(files);
    expect(r.failed).toBe(false);
    expect(r.value ?? null).toBeNull();
    const k = await boot(files);
    expect(k.applyEffects([{ type: 'vento', force: 3 } as any], k.wandererEntity)).toEqual([]);
    expect(k.faults.get('effect:vento')?.message).toMatch(/non ha chi lo applica/);
  });

  it('where it arrived, the kernel applies it with no fault', async () => {
    const { files } = upgradeFromSeed(madeFrom(bundledFiles), next(bundledFiles));
    const k = await boot(files);
    expect(k.applyEffects([{ type: 'vento', force: 3 } as any], k.wandererEntity)).toEqual(['Tira vento: 3']);
    expect(k.faults.has('effect:vento')).toBe(false);
  });
});

describe('a new node of MarkovJunior', () => {
  const xml = '<sequence values="BW" size="5 5 5"><volo/></sequence>';

  it('is refused by the kernel that does not know it, with the name: a universe never meets one before the kernel has it', () => {
    expect(() => compileMjx(xml)).toThrow(/nodo sconosciuto/);
  });

  it('a program that does not compile leaves the world standing', async () => {
    const k = await boot({
      ...bundledFiles,
      'models/futuro.xml': xml,
      'modules/cosa.futura/manifest.json': JSON.stringify({ id: 'cosa.futura', name: 'Futura', kind: 'entity', appearance: { glyph: 'F', color: '#ffffff', model: 'futuro' } }),
    });
    const pc = k.wandererCarpet();
    k.spawnModuleEntity(k.modules.get('cosa.futura')!, pc.x + 1, pc.y);
    k.tick(DT);
    expect(k.faults.list().map((f) => f.key).filter((key) => key.startsWith('module:') || key.startsWith('kernel:'))).toEqual([]);
  });
});

describe('a Lua API taken away (what is not additive)', () => {
  it('TRAP: every module that calls it faults at once; with the fault open the world still saves its data (T262)', async () => {
    const universe = universeWith('mech.posa');
    const k = await boot({ ...universe, 'modules/mech.posa/logic.lua': 'local M = {}\nfunction M.update(dt) world.tolta() end\nreturn M\n' });
    await developAll(k);
    k.tick(DT);
    expect(k.faults.list().map((f) => f.key)).toContain('module:mech.posa:update');
    k.give('item.pane', 1);
    expect(k.saveState()).toBe(true);
    expect(k.repo.head().files['modules/mech.posa/logic.lua']).toContain('world.tolta');
  });
});

/** A universe really played, read and never written: `QUINE_UNIVERSO_VECCHIO=<folder>`. On this machine `universes/valmora`, of the 22nd of October. */
const PLAYED = process.env.QUINE_UNIVERSO_VECCHIO;

function readUniverse(root: string): { files: FileMap; maps: Array<[string, unknown]> } {
  const files: FileMap = {};
  const walk = (rel: string) => {
    for (const name of readdirSync(path.join(root, rel))) {
      const p = rel ? `${rel}/${name}` : name;
      if (name === '.git' || p === 'assets' || p === 'maps') continue;
      if (statSync(path.join(root, p)).isDirectory()) walk(p);
      else files[p] = readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
    }
  };
  walk('');
  const maps = readdirSync(path.join(root, 'maps')).map((m) => [m.replace(/\.json$/, ''), JSON.parse(readFileSync(path.join(root, 'maps', m), 'utf8'))] as [string, unknown]);
  return { files, maps };
}

describe('a universe really played', () => {
  it.skipIf(!PLAYED)('opens in memory, its plans and its state used as they are', async () => {
    const { files, maps } = readUniverse(PLAYED!);
    const { files: up, updated } = upgradeFromSeed(files, bundledFiles);
    const chunks = new MemoryChunks();
    const loaded: string[] = [];
    const store = { ...chunks, load: async (key: string) => { const rec = maps.find(([m]) => m === key.replace(/[:,]/g, '_'))?.[1] as any; if (rec) loaded.push(key); return rec ?? chunks.load(key); }, save: async () => undefined, clear: async () => undefined };
    const k = await Kernel.boot({ files: up, store: memoryStore(), ai: new MockAiModels(), chunks: store as any });
    await developAll(k);
    play(k, 1);
    console.log(`[T183] universo giocato: ${Object.keys(files).length} file, ${maps.length} piani, ${updated.length} file dal seme, ${updated.filter((p) => !(p in files)).length} nuovi; luoghi caricati ${k.chunks.size}, dai piani salvati ${loaded.length}; guasti: ${k.faults.list().map((x) => `${x.key}: ${x.message.slice(0, 80)}`).join(' | ') || 'nessuno'}; tempo ${Math.round(k.time)} s`);
    expect(k.wanderer().id).toBe('me');
    expect(loaded.length).toBeGreaterThan(0);
    expect(k.faults.list().filter((x) => x.key.startsWith('universe:') || x.key.startsWith('kernel:'))).toEqual([]);
  });
});
