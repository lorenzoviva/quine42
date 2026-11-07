// The four themes of the Genesis (T152, ADR-0134): each gives a universe that starts, none touches a universe that exists.
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { COUNCIL_PRINCIPLES, metaBreak } from '../src/kernel/fourthwall';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { commonHouseModel } from '../src/kernel/modeldirector';
import { themeOfText, WORLD_THEMES } from '../src/kernel/themes';
import { seedHashes, SEED_FILE, upgradeFromSeed } from '../src/kernel/universes';
import { wordsOf } from '../src/kernel/agents/council';
import { develop } from './world';

const fresh = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });

/** Models offline that remember what they were asked, and can answer the Artist with houses of their own. */
class Listening extends MockAiModels {
  asked = new Map<string, string>();
  constructor(private house?: string) {
    super();
  }
  async text(call: Parameters<MockAiModels['text']>[0]) {
    this.asked.set(call.task ?? '', String(call.prompt));
    const answer = await super.text(call);
    return call.task === 'genesis.style' && this.house ? JSON.stringify({ ...JSON.parse(answer), case_comuni: this.house }) : answer;
  }
}

describe('the themes of the Genesis', () => {
  it('the medieval theme is the seed as it was; the others are not', () => {
    expect(WORLD_THEMES.map((t) => t.id)).toEqual(['medievale', 'steampunk', 'moderno', 'futuristico']);
    expect(themeOfText(bundledFiles['prompts/theme.md'])?.id).toBe('medievale');
    expect(themeOfText(`  ${WORLD_THEMES[2].text.replace(/\n/g, '\r\n')}\n`)?.id).toBe('moderno');
    expect(themeOfText(`${WORLD_THEMES[2].text} E il mare.`)).toBeUndefined();
  });

  it.each(WORLD_THEMES.map((t) => [t.id, t.text]))('%s stays inside the world and says the runes as the canon does', (_, text) => {
    expect(metaBreak(text, wordsOf(bundledFiles))).toBeUndefined();
    expect(text).toMatch(/slabs carved with a sign that gives off a faint light/);
    expect(text).toMatch(/canon of the runes/);
  });

  it('the principles go with every request and say that a world has its age', () => {
    expect(COUNCIL_PRINCIPLES).toContain('Every world has its own age');
  });

  it('only the medieval one needs magic of the middle ages', () => {
    for (const t of WORLD_THEMES.slice(1)) expect(t.text).not.toMatch(/\bmages?\b|medieval|castle|\bkingdom\b/i);
  });

  it.each(WORLD_THEMES.map((t) => [t.id, t.text]))('a Genesis offline with %s: the right files, a universe that starts', async (_, text) => {
    const models = new Listening();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: models });
    expect(await k.runGenesis(text)).toBe(true);
    expect(k.needsGenesis()).toBe(false);
    expect(k.repo.working['prompts/theme.md']).toBe(`${text.trim()}\n`);
    for (const f of ['world/bible.json', 'world/style.md', 'modules/world.terrain/manifest.json', 'modules/world.layouts/manifest.json']) expect(k.repo.working[f], f).toBeTruthy();
    expect(k.modules.has('npc.villager')).toBe(false);
    // What holds in every theme is still there.
    for (const m of ['core.carpet', 'magic.runes']) expect(k.modules.has(m), m).toBe(true);
    expect(k.repo.working['world/lexicon.md']).toBe(bundledFiles['world/lexicon.md']);
    expect(k.repo.working['world/canon.md']).toBe(bundledFiles['world/canon.md']);
    // The theme reaches who writes the look and the land, not only the bible.
    for (const task of ['genesis.bible', 'genesis.style', 'genesis.terrain']) expect(models.asked.get(task), task).toContain(text);
    await develop(k);
    expect(k.faults.list()).toEqual([]);
    expect([...k.chunks.values()].some((c) => c.stage === 'planned')).toBe(true);
  });

  it('a Genesis that wrote too few environments keeps those of no age, never a castle', async () => {
    class FewPlaces extends MockAiModels {
      async text(call: Parameters<MockAiModels['text']>[0]) {
        return call.task === 'genesis.layouts' ? JSON.stringify({ ambienti: [{ id: 'darsena', nome: 'Darsena', descrizione: 'moli e gru', tipo: 'esterno', programma_json: JSON.stringify({ type: 'prl', rules: [{ in: 't', out: 'g', p: 0.5 }] }) }] }) : super.text(call);
      }
    }
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new FewPlaces() });
    expect(await k.runGenesis(WORLD_THEMES[3].text)).toBe(true);
    const ids = Object.keys(k.content.layouts);
    expect(ids).toContain('darsena');
    expect(ids).toContain('woods');
    for (const old of ['castle', 'wizard_tower', 'dragon_lair', 'huts', 'inn', 'village']) expect(ids).not.toContain(old);
  });
});

describe('the common houses of a world', () => {
  const lots = (k: Kernel) => [...k.chunks.values()].flatMap((c) => (k as any).lotsOf(c, c.plan ?? { strutture: [] }, 'p').lots as Array<{ form: { wanted?: string }; structure: { concept: string; class: string; model?: string } }>);

  it('a world of cottages keeps the models of the seed', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Listening() });
    expect(await k.runGenesis(WORLD_THEMES[0].text)).toBe(true);
    expect(k.terrain?.manifest.commonHouse).toBeUndefined();
    await develop(k);
    expect(lots(k).some((l) => l.structure.model?.startsWith('casa-comune-'))).toBe(false);
  });

  it('a world of condominiums asks the Sculptor for its own, before anything else, and a new Genesis for others', async () => {
    const house = 'un condominio di quattro piani con i balconi';
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Listening(house) });
    expect(await k.runGenesis(WORLD_THEMES[2].text)).toBe(true);
    expect(k.terrain?.manifest.commonHouse).toBe(house);
    await develop(k);
    const common = lots(k).filter((l) => l.structure.concept === house);
    expect(common.length).toBeGreaterThan(0);
    for (const l of common) expect(l.structure.model).toBe(commonHouseModel(house, l.structure.class));
    expect(commonHouseModel('una baracca', 'edificio')).not.toBe(commonHouseModel(house, 'edificio'));
  });

  it('a description that breaks the fourth wall is not taken', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Listening('una casa di pixel sul server') });
    expect(await k.runGenesis(WORLD_THEMES[3].text)).toBe(true);
    expect(k.terrain?.manifest.commonHouse).toBeUndefined();
  });
});

describe('a universe that exists', () => {
  it('does not change what it wrote when the seed moves on', () => {
    const seed = { ...bundledFiles };
    const own: Record<string, string> = {
      ...seed,
      [SEED_FILE]: JSON.stringify(seedHashes(seed)),
      'prompts/theme.md': '# Tema: le isole\n',
      'world/bible.json': '{"titolo":"Le isole"}\n',
      'world/style.md': '# Guida di stile\n',
    };
    const moved = { ...seed, 'prompts/agents/cartographer.md': `${seed['prompts/agents/cartographer.md']}\nAltro.\n` };
    const { files, updated } = upgradeFromSeed(own, moved);
    for (const f of ['prompts/theme.md', 'world/bible.json', 'world/style.md']) {
      expect(files[f]).toBe(own[f]);
      expect(updated).not.toContain(f);
    }
    expect(updated).toContain('prompts/agents/cartographer.md');
  });

  it('keeps its houses, its environments and its theme when it starts', async () => {
    const before = await fresh();
    expect(before.terrain?.manifest.commonHouse).toBeUndefined();
    expect(before.repo.working['prompts/theme.md']).toBe(bundledFiles['prompts/theme.md']);
    expect(before.repo.working['modules/world.layouts/manifest.json']).toBe(bundledFiles['modules/world.layouts/manifest.json']);
    expect(before.needsGenesis()).toBe(true);
    expect(Object.keys(before.content.layouts)).toContain('castle');
  });
});
