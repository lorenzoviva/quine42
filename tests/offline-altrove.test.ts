// The local models over a world that is not theirs (T433): `?offline` on a universe the Council made plans no place of Valmora and makes no
// individual of its trades, and saves none in the universe's repository; the seed's world (Valmora, aurora, a Genesis offline) as before.
// And the seed's environments of an age (castle, fortress, the dragon's lair) never come back by themselves into a universe of another theme.
import { describe, expect, it } from 'vitest';
import { LOCAL_WORLD, MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { MemoryChunks, type ChunkRecord } from '../src/kernel/chunks';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { seedHashes, SEED_FILE, upgradeFromSeed } from '../src/kernel/universes';
import { TIMELESS_LAYOUTS, WORLD_THEMES } from '../src/kernel/themes';
import type { FileMap } from '../src/kernel/types';
import { develop } from './world';

const TITLE = 'Le Città del Vapore di Oricalco';

/** The bundled universe as the Council would have made it: another bible (the title is what tells a world). */
function councilFiles(): FileMap {
  const bible = JSON.parse(bundledFiles['world/bible.json']);
  return { ...bundledFiles, 'world/bible.json': JSON.stringify({ ...bible, title: TITLE }, null, 2) + '\n' };
}

/** The store of the plans, counting what is written to it. */
class Counting extends MemoryChunks {
  saved: string[] = [];
  async save(key: string, record: ChunkRecord): Promise<void> {
    this.saved.push(key);
    return super.save(key, record);
  }
}

/** The models of the world (the Council), played by the local ones that write any world. */
function councilModels(): MockAiModels {
  const m = new MockAiModels();
  m.world = undefined;
  return m;
}

/** Characters of the places loaded, by entity. */
function characters(k: Kernel): number[] {
  return k.ecs.query('module').filter((id) => !!k.modules.get(k.ecs.get(id, 'module')?.id)?.manifest.persona);
}

describe('i modelli locali sopra un mondo del Concilio (T433)', () => {
  it('offline: i luoghi nuovi restano bozze, gli individui nuovi archetipi; niente arriva al repository', async () => {
    // The universe as the Council left it: its places around the start planned, by the models of the world.
    const chunks = new Counting();
    const made = await Kernel.boot({ files: councilFiles(), store: memoryStore(), ai: councilModels(), chunks });
    await develop(made);
    const planned = [...made.chunks.values()].filter((c) => c.stage === 'planned').map((c) => [c.cx, c.cy] as const);
    expect(planned.length).toBeGreaterThan(0);
    made.repo.commit('il mondo del Concilio', 'kernel');
    const files = { ...made.repo.working };
    const people = files['world/people.json'];

    // Then a session `?offline` on it.
    chunks.saved = [];
    const ai = new MockAiModels();
    const asked: string[] = [];
    const text = ai.text.bind(ai);
    ai.text = (call) => (asked.push(call.task ?? ''), text(call));
    const k = await Kernel.boot({ files, store: memoryStore(), ai, chunks });
    expect(k.localModelsAbroad()).toBe(true);
    // What the Council planned is read as always.
    for (const [cx, cy] of planned) expect(await k.planAhead(cx, cy)).toBe('noto');
    // A place far away, never planned: a draft, not a place of Valmora.
    expect(await k.planAhead(9, 9)).toBe('no');
    expect(await k.planAhead(-7, 4)).toBe('no');
    for (let i = 0; i < 30; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 5));
    }
    expect(k.chunks.get('9,9')?.stage).toBe('draft');
    expect(asked.filter((t) => t === 'chunk.plan')).toEqual([]);
    expect(chunks.saved).toEqual([]);
    // The characters of the planned places: their archetype, no individual of Valmora's trades.
    let n = 0;
    for (const [cx, cy] of planned) n += await k.peopleOf(cx, cy);
    for (const id of characters(k)) {
      const who = k.ecs.get(id, 'identity');
      if (who) expect(who.name).toBe(k.modules.get(k.ecs.get(id, 'module').id)!.manifest.name);
    }
    expect(asked.filter((t) => t === 'npc.individuate')).toEqual([]);
    expect(n).toBeGreaterThan(0);
    // And the player's save takes none of it: people as the Council left them, no new plan.
    expect(k.saveState()).toBe(true);
    expect(k.repo.head().files['world/people.json']).toBe(people);
    expect(chunks.saved).toEqual([]);
    // No place stays asked again at every tick (the held draft).
    expect([...k.chunks.values()].filter((c) => c.stage === 'draft').every((c) => c.held)).toBe(true);
  });

  it('offline: un luogo del Concilio che entra nel raggio non chiede niente ai modelli locali (T501)', async () => {
    // `mesa` offline (T501): a place planned by the Council with a new thing still to forge (`fresh`) came in reach, and the local
    // models forged «Erba» with the description of a signpost, saved in the universe with the plan rewritten.
    const chunks = new Counting();
    const made = await Kernel.boot({ files: councilFiles(), store: memoryStore(), ai: councilModels(), chunks });
    await develop(made);
    const here = made.chunks.get('0,0')!;
    expect(here.stage).toBe('planned');
    const key = chunks.saved.find((s) => /[^\d-]0,0$/.test(s))!;
    const record = (await chunks.load(key))!;
    await chunks.save(key, { plan: { ...record.plan, fresh: [{ concept: 'Cartello della gilda dei carrettieri, un palo con due frecce', where: 'outside' }] } });
    made.repo.commit('il mondo del Concilio', 'kernel');
    const files = { ...made.repo.working };

    chunks.saved = [];
    const ai = new MockAiModels();
    const asked: string[] = [];
    const text = ai.text.bind(ai);
    ai.text = (call) => (asked.push(call.task ?? ''), text(call));
    const k = await Kernel.boot({ files, store: memoryStore(), ai, chunks });
    expect(k.localModelsAbroad()).toBe(true);
    for (let i = 0; i < 120; i++) {
      k.tick(1 / 30);
      await new Promise((r) => setTimeout(r, 5));
    }
    expect(k.chunks.get('0,0')?.stage).toBe('planned');
    // Nothing asked of them: no new thing forged, no thing found on the ground defined, no pack, inhabitant or session.
    expect(asked.filter((t) => /^(forge|content|council)\./.test(t))).toEqual([]);
    expect(Object.keys(k.repo.working).filter((p) => p.startsWith('modules/') && !(p in files))).toEqual([]);
    expect(chunks.saved).toEqual([]);
  });

  it('il mondo dei modelli locali (Valmora, aurora, la Genesi offline) pianifica e salva come prima', async () => {
    const chunks = new Counting();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks });
    expect(JSON.parse(bundledFiles['world/bible.json']).title).toBe(LOCAL_WORLD);
    expect(k.localModelsAbroad()).toBe(false);
    await develop(k);
    expect(await k.planAhead(9, 9)).toBe('nuovo');
    expect(chunks.saved.length).toBeGreaterThan(1);
  });

  it('i modelli del mondo (Gemini, OpenRouter, la coda) pianificano ogni mondo', async () => {
    const chunks = new Counting();
    const k = await Kernel.boot({ files: councilFiles(), store: memoryStore(), ai: councilModels(), chunks });
    expect(k.localModelsAbroad()).toBe(false);
    expect(await k.planAhead(9, 9)).toBe('nuovo');
    expect(chunks.saved).toContain(chunks.saved.find((s) => s.endsWith('9,9')));
  });
});

describe('gli ambienti del seme in un mondo di un altro tema (T433)', () => {
  const LAYOUTS = 'modules/world.layouts/manifest.json';
  const seedLayouts = Object.keys(JSON.parse(bundledFiles[LAYOUTS]).layouts);
  const aged = seedLayouts.filter((id) => !TIMELESS_LAYOUTS.has(id));

  /** A universe whose Genesis wrote its own environments (and kept none of the seed's), under a theme. */
  function genesisOf(theme: string): FileMap {
    const m = JSON.parse(bundledFiles[LAYOUTS]);
    const own = { piazza_pesa: m.layouts.village, fonderia: m.layouts.huts, scalo: m.layouts.fields };
    return {
      ...bundledFiles,
      [SEED_FILE]: JSON.stringify(seedHashes(bundledFiles), null, 1) + '\n',
      'prompts/theme.md': `${theme.trim()}\n`,
      [LAYOUTS]: JSON.stringify({ ...m, layouts: own }, null, 2) + '\n',
    };
  }

  it('lo steampunk (o un tema scritto a mano) riceve dal seme solo gli ambienti senza epoca', () => {
    expect(aged).toEqual(expect.arrayContaining(['castle', 'fortress', 'dragon_lair', 'pyramid', 'barracks']));
    for (const theme of [WORLD_THEMES[1].text, WORLD_THEMES[3].text, '# Tema: La Grande Città, anni Novanta\n\nCondomini e tram.']) {
      const up = upgradeFromSeed(genesisOf(theme), bundledFiles);
      const ids = Object.keys(JSON.parse(up.files[LAYOUTS]).layouts);
      expect(ids).toEqual(expect.arrayContaining(['piazza_pesa', 'fonderia', 'scalo', ...seedLayouts.filter((id) => TIMELESS_LAYOUTS.has(id))]));
      for (const id of aged) expect(ids, id).not.toContain(id);
      // And again at the next load: nothing more comes.
      expect(upgradeFromSeed(up.files, bundledFiles).changes[LAYOUTS]).toBeUndefined();
    }
  });

  it('il medievale del seme riceve ancora tutti gli ambienti nuovi del seme', () => {
    const up = upgradeFromSeed(genesisOf(WORLD_THEMES[0].text), bundledFiles);
    expect(Object.keys(JSON.parse(up.files[LAYOUTS]).layouts)).toEqual(expect.arrayContaining(seedLayouts));
  });
});
