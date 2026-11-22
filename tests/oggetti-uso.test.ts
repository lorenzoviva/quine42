// Things one understands (T489, ADR-0251): every thing of the world has a use the kernel knows how to do, or is kept as a decoration.
// The uses read from the data (an effect, a place on the body, a bag, an action with effects, a recipe it goes into, a trade, a building
// site, a mission, what an action of the world wants carried), the words of the world that say them (never a word of the game), the rule
// of the validator, the Narrator who gives a use and hears why when it did not (once more, then the thing is left out or, if the wanderer
// made it, kept), the things of before marked by the kernel without calls, and the recipes a thing opens where it is held.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import type { TextCall } from '../src/kernel/ai/models';
import { assemblePack, declaredRecipes, declaredUse, toItemDef } from '../src/kernel/agents/content';
import { madeBy, markedPacks, opened, roleOf, useError, usesOf, useWords, workingUses, type ItemUse, type UseWorld } from '../src/kernel/itemuse';
import { countItem } from '../src/kernel/inventory';
import type { ItemDef, Recipe } from '../src/kernel/types';
import type { JobProgram } from '../src/kernel/npc/model';

const thing = (o: Partial<ItemDef> & { id: string }): ItemDef => ({ name: o.id.replace(/^item\./, ''), description: '', category: 'misc', weight: 1, stack: 1, tags: [], glyph: '•', color: '#fff', ...o });
const none: UseWorld = { recipes: [] };
const kinds = (d: ItemDef, w: UseWorld = none) => usesOf(d, w).map((u) => u.kind);
const recipe = (id: string, inputs: string[], output: string, tools: string[] = []): Recipe => ({ id, name: id, inputs: inputs.map((item) => ({ item, count: 1 })), tools, output: { item: output, count: 1 } });
const names: Record<string, string> = { 'item.ago': 'Ago', 'item.toppa': 'Toppa di tela', 'item.stoffa': 'Pezza di stoffa', 'item.martello': 'Martello', 'item.secchio': 'Secchio' };
const words = (uses: ItemUse[], has?: (id: string) => number) => useWords(uses, { name: (id) => names[id] ?? id, has });

/** What a world of the game says, never: the words of the game (ADR-0025). */
const META = /\b(ricett[ae]|modul[oi]|kernel|concilio|codice|simulazion[ei]|uso del gioco|decorazione|categoria|slot|effett[oi])\b/i;

describe('the uses of a thing (T489)', () => {
  it('reads what the thing does by itself: eaten, drunk, lit, a bag, worn on the body', () => {
    expect(kinds(thing({ id: 'item.pane', category: 'food', effects: { hunger: 20 } }))).toEqual(['consume']);
    // Food that feeds nothing is not eaten for anything.
    expect(kinds(thing({ id: 'item.pane-finto', category: 'food' }))).toEqual([]);
    expect(kinds(thing({ id: 'item.pane-finto', category: 'food', effects: { hunger: 0, thirst: 0 } }))).toEqual([]);
    // A tank is breathed only where the world counts the breath.
    const tank = thing({ id: 'item.bombola', category: 'misc', effects: { oxygen: 60 } });
    expect(kinds(tank)).toEqual([]);
    expect(usesOf(tank, { recipes: [], breath: true })).toEqual([{ kind: 'consume', verb: 'breathe', effects: { oxygen: 60 } }]);
    expect(kinds(thing({ id: 'item.lume', category: 'light' }))).toEqual(['light']);
    expect(usesOf(thing({ id: 'item.borsa', category: 'container', container: { size: 6 } }), none)).toEqual([{ kind: 'bag', size: 6 }]);
    // A container without room is not a bag.
    expect(kinds(thing({ id: 'item.sacco-vuoto', category: 'container' }))).toEqual([]);
    expect(usesOf(thing({ id: 'item.cappello', category: 'clothing', slot: 'head' }), none)).toEqual([{ kind: 'wear', zone: 'head' }]);
    // A cloak by the words of its name; boots have no zone of the body.
    expect(usesOf(thing({ id: 'item.mantello', name: 'Mantello di lana', category: 'clothing' }), none)).toEqual([{ kind: 'wear', zone: 'back' }]);
    expect(kinds(thing({ id: 'item.stivali', name: 'Stivali', category: 'clothing', slot: 'feet' }))).toEqual([]);
  });

  it('reads what the world does with it: a slot of a panel, its actions, what an action wants, what cuts, recipes, trades, sites, missions', () => {
    const slots = [{ panel: 'Equipaggiamento', label: 'Ai piedi', accepts: ['feet', 'legs'] }, { panel: 'Equipaggiamento', label: 'In mano', accepts: ['hands', 'tool'] }];
    // By its place; by a category or a tag only when it gives the mechanic something to read.
    expect(usesOf(thing({ id: 'item.stivali', category: 'clothing', slot: 'feet' }), { recipes: [], slots })).toEqual([{ kind: 'wear', panel: 'Equipaggiamento', slot: 'Ai piedi' }]);
    expect(kinds(thing({ id: 'item.pinza', category: 'tool' }), { recipes: [], slots })).toEqual([]);
    expect(kinds(thing({ id: 'item.pinza', category: 'tool', bonus: { attack: 0, speed: 1 } }), { recipes: [], slots })).toEqual([]);
    expect(kinds(thing({ id: 'item.pinza', category: 'tool', bonus: { attack: 2 } }), { recipes: [], slots })).toEqual(['wear']);
    // Its own action, with effects; an action without effects is no use; its module, when it reacts.
    expect(usesOf(thing({ id: 'item.fischietto', actions: [{ id: 'soffia', label: 'Soffia', effects: [{ type: 'light', radius: 2, duration: 5 }] }] }), none)).toEqual([{ kind: 'action', label: 'Soffia' }]);
    expect(kinds(thing({ id: 'item.fischietto', actions: [{ id: 'soffia', label: 'Soffia' }] }))).toEqual([]);
    expect(kinds(thing({ id: 'item.chiave', module: 'item.chiave' }), { recipes: [], scripted: (d) => d.module === 'item.chiave' })).toEqual(['action']);
    // What an action of the world wants carried, by id or by tag.
    const wants = [{ label: 'Attingi acqua', on: 'Pozzo', requires: 'item.secchio' }, { label: 'Attizza', on: 'Caldaia', requires: 'carbone' }];
    expect(usesOf(thing({ id: 'item.secchio' }), { recipes: [], wants })).toEqual([{ kind: 'needed', label: 'Attingi acqua', on: 'Pozzo' }]);
    expect(kinds(thing({ id: 'item.antracite', tags: ['carbone'] }), { recipes: [], wants })).toEqual(['needed']);
    // What cuts, where something can be cut.
    expect(kinds(thing({ id: 'item.ascia', tags: ['taglio'] }), { recipes: [], cuttable: true })).toEqual(['cuts']);
    expect(kinds(thing({ id: 'item.ascia', tags: ['taglio'] }))).toEqual([]);
    // Recipes: used up, or a tool; coming out of one is how it is made, not a use.
    const recipes = [recipe('r.toppa', ['item.stoffa', 'item.filo'], 'item.toppa', ['item.ago'])];
    expect(usesOf(thing({ id: 'item.stoffa' }), { recipes })).toEqual([{ kind: 'ingredient', recipe: 'r.toppa', makes: 'item.toppa', with: ['item.filo'], tools: ['item.ago'] }]);
    expect(usesOf(thing({ id: 'item.ago' }), { recipes })).toEqual([{ kind: 'tool', recipe: 'r.toppa', makes: 'item.toppa', with: ['item.stoffa', 'item.filo'], tools: [] }]);
    expect(kinds(thing({ id: 'item.toppa' }), { recipes })).toEqual([]);
    expect(madeBy(thing({ id: 'item.toppa' }), { recipes }).recipes.map((r) => r.id)).toEqual(['r.toppa']);
    // A trade works with what it uses up, takes or eats; not with what it makes and carries.
    const jobs = [{ id: 'smith', names: ['fabbro', 'fabbra'], day: { morning: [{ does: 'take', item: 'item.ciocco' }], day: [{ does: 'produce', item: 'item.chiodi', with: 'item.ferro' }], evening: [{ does: 'carry', item: 'item.chiodi' }], night: [{ does: 'eat', item: 'item.pane' }] } }] as unknown as JobProgram[];
    for (const id of ['item.ciocco', 'item.ferro', 'item.pane']) expect(usesOf(thing({ id }), { recipes: [], jobs }), id).toEqual([{ kind: 'trade', job: 'smith', word: 'fabbro' }]);
    expect(kinds(thing({ id: 'item.chiodi' }), { recipes: [], jobs })).toEqual([]);
    expect(madeBy(thing({ id: 'item.chiodi' }), { recipes: [], jobs }).trades).toEqual(['fabbro']);
    expect(kinds(thing({ id: 'item.chiodi' }), { recipes: [], materials: new Set(['item.chiodi']) })).toEqual(['venture']);
    expect(usesOf(thing({ id: 'item.lettera', name: 'La lettera di Ada' }), { recipes: [], awaited: new Map([['lettera ada', 'Bruno']]) })).toEqual([{ kind: 'quest', to: 'Bruno' }]);
    // The mark, last; what has another use keeps it, and the words say the use.
    expect(kinds(thing({ id: 'item.ritratto', decoration: true }))).toEqual(['decoration']);
    expect(workingUses(usesOf(thing({ id: 'item.pane', category: 'food', effects: { hunger: 5 }, decoration: true }), none)).map((u) => u.kind)).toEqual(['consume']);
  });

  it('says them in words of the world, never of the game, with what the wanderer has and lacks', () => {
    const recipes = [recipe('r.toppa', ['item.stoffa'], 'item.toppa', ['item.ago']), recipe('r.secchio', ['item.asse'], 'item.secchio', ['item.martello'])];
    const all: Array<[ItemDef, UseWorld]> = [
      [thing({ id: 'item.pane', category: 'food', effects: { hunger: 20, thirst: -5 } }), none],
      [thing({ id: 'item.sidro', category: 'drink', effects: { thirst: 20, energy: 5 } }), none],
      [thing({ id: 'item.benda', category: 'medicine', effects: { health: 20 } }), none],
      [thing({ id: 'item.lume', category: 'light' }), none],
      [thing({ id: 'item.borsa', container: { size: 4 } }), none],
      [thing({ id: 'item.cappello', slot: 'head', category: 'clothing' }), none],
      [thing({ id: 'item.stoffa' }), { recipes }],
      [thing({ id: 'item.martello' }), { recipes }],
      [thing({ id: 'item.ascia', tags: ['taglio'] }), { recipes: [], cuttable: true }],
      [thing({ id: 'item.ritratto', decoration: true }), none],
      [thing({ id: 'item.sasso' }), none],
    ];
    const said = all.map(([d, w]) => words(usesOf(d, w)));
    for (const lines of said) {
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) expect(l, l).not.toMatch(META);
    }
    expect(said[0]).toEqual(['Si mangia: sazia e mette sete.']);
    expect(said[1]).toEqual(['Si beve: disseta e dà forza.']);
    expect(said[2]).toEqual(['Si usa su di sé: cura.']);
    expect(said[4]).toEqual(['Ci stanno dentro 4 cose.']);
    expect(said[5]).toEqual(['Si indossa sulla testa.']);
    expect(said[6]).toEqual(['Con questo, usando Ago, si fa: Toppa di tela.']);
    expect(said[7]).toEqual(['Serve a fare Secchio con item.asse.']);
    // The mark and nothing say the same: kept, for what it is.
    expect(said[9]).toEqual(said[10]);
    expect(said[9][0]).toMatch(/si tiene/);
    // What the wanderer already has.
    expect(words(usesOf(thing({ id: 'item.stoffa' }), { recipes }), (id) => (id === 'item.ago' ? 1 : 0))).toEqual(['Con questo, usando Ago (ce l’hai), si fa: Toppa di tela.']);
    // The recipes a thing opens: ready first, with what is missing.
    const open = opened(thing({ id: 'item.stoffa' }), [...recipes, recipe('r.benda', ['item.stoffa'], 'item.benda')], (id) => (id === 'item.stoffa' ? 1 : 0));
    expect(open.map((o) => [o.recipe.id, o.missing.map((m) => m.item)])).toEqual([['r.benda', []], ['r.toppa', ['item.ago']]]);
  });

  it('gives a role to every thing, a key by its name', () => {
    expect(roleOf(thing({ id: 'item.k', name: 'Chiave della Fonderia', category: 'tool' }))).toBe('key');
    expect(roleOf(thing({ id: 'item.p', category: 'drink' }))).toBe('food');
    expect(roleOf(thing({ id: 'item.m', name: 'Mantello', category: 'misc', slot: 'back' }))).toBe('garment');
    expect(roleOf(thing({ id: 'item.f', category: 'material' }))).toBe('material');
    expect(roleOf(thing({ id: 'item.s' }))).toBe('other');
  });

  it('refuses with the reason a thing without a use, unless it is a decoration', () => {
    const v = (d: ItemDef, declared?: string) => useError(d, none, declared);
    expect(v(thing({ id: 'item.sasso', name: 'Sasso' }))).toMatch(/«Sasso» si prende ma non ha un uso/);
    expect(v(thing({ id: 'item.sasso', name: 'Sasso', decoration: true }))).toBeUndefined();
    expect(v(thing({ id: 'item.pane', name: 'Pane', category: 'food' }), 'consume')).toMatch(/«Pane» dice «consume» ma non nutre/);
    expect(v(thing({ id: 'item.toppa', name: 'Toppa' }), 'craft')).toMatch(/non entra in nessuna ricetta/);
    expect(v(thing({ id: 'item.guanto', name: 'Guanto', category: 'clothing', slot: 'hands' }), 'wear')).toMatch(/non ha un posto addosso/);
    // A thing whose declared use fell but has another holds: a drink whose recipe fell is still drunk.
    expect(v(thing({ id: 'item.sidro', name: 'Sidro', category: 'drink', effects: { thirst: 10 } }), 'craft')).toBeUndefined();
  });
});

describe('the Narrator gives a use (T489)', () => {
  it('reads the use, the action and the recipe a thing declares', () => {
    const taken = new Set<string>();
    const deco = toItemDef({ name: 'Ritratto', description: '', category: 'misc', weight: 0.5, stack: 1, tags: [], look: 'un ritratto', shape: 'book', use: 'decoration' }, taken)!;
    expect(deco.decoration).toBe(true);
    const act = toItemDef({ name: 'Acciarino a ruota', description: '', category: 'tool', weight: 0.1, stack: 1, tags: [], look: 'x', shape: 'tool', use: 'action', action: { label: 'Accendi', effects: [{ type: 'light', radius: 3 }] } }, taken)!;
    expect(act.actions).toEqual([{ id: 'uso-accendi', label: 'Accendi', effects: [{ type: 'light', radius: 3 }] }]);
    expect(act.decoration).toBeUndefined();
    expect(declaredUse({ use: 'Craft ' })).toBe('craft');
    expect(declaredUse({ use: 'mangia' })).toBeUndefined();
    // A thing used up with the others, or the tool of it.
    expect(declaredRecipes([{ name: 'Filo', recipe: { result: 'Toppa', with: ['Stoffa'] } } as never, { name: 'Ago', recipe: { result: 'Toppa', with: ['Stoffa', 'Filo'], tool: true } } as never])).toEqual([
      { name: 'Toppa', inputs: [{ item: 'Filo', quantity: 1 }, { item: 'Stoffa', quantity: 1 }], tools: [], result: { item: 'Toppa', quantity: 1 } },
      { name: 'Toppa', inputs: [{ item: 'Stoffa', quantity: 1 }, { item: 'Filo', quantity: 1 }], tools: ['Ago'], result: { item: 'Toppa', quantity: 1 } },
    ]);
    // The pack resolves them with the things of the world and of the answer; the same recipe said twice is one.
    const pack = assemblePack(
      {
        items: [
          { name: 'Filo di canapa', description: '', category: 'material', weight: 0.1, stack: 10, tags: [], look: 'x', shape: 'rope', use: 'craft', recipe: { result: 'Toppa', with: ['Pezza di stoffa'] } },
          { name: 'Toppa', description: '', category: 'clothing', weight: 0.1, stack: 1, tags: [], look: 'x', shape: 'garment', use: 'decoration' },
        ],
        recipes: [{ name: 'Toppa', inputs: [{ item: 'Filo di canapa', quantity: 1 }, { item: 'Pezza di stoffa', quantity: 1 }], tools: [], result: { item: 'Toppa', quantity: 1 } }],
        loot: [],
      },
      new Map([['pezza stoffa', 'item.stoffa']]),
      new Set(),
    );
    expect(pack.recipes).toHaveLength(1);
    expect(pack.recipes[0]).toMatchObject({ inputs: [{ item: 'item.filo-di-canapa', count: 1 }, { item: 'item.stoffa', count: 1 }], output: { item: 'item.toppa', count: 1 } });
    expect(pack.declared.get('item.filo-di-canapa')).toBe('craft');
  });

  /** The local models, with what the Narrator answers to `content.define` in the order given; the rest as they are. */
  class Narrator extends MockAiModels {
    calls: TextCall[] = [];
    constructor(private readonly answers: unknown[][]) {
      super();
    }
    async text(call: TextCall): Promise<string> {
      if (call.task !== 'content.define') return super.text(call);
      this.calls.push(call);
      return JSON.stringify({ items: this.answers[Math.min(this.calls.length - 1, this.answers.length - 1)] });
    }
  }
  const stone = { name: 'Sasso levigato', description: 'un sasso liscio', category: 'misc', weight: 0.3, stack: 1, tags: ['fiume'], look: 'un sasso', shape: 'sack' };
  const boot = async (answers: unknown[][]) => {
    const models = new Narrator(answers);
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: models });
    return { k, models };
  };

  it('asks for the use with the places of the world and the things a recipe may name', async () => {
    const { k, models } = await boot([[{ ...stone, use: 'decoration' }]]);
    await k.introduceItems(['Sasso levigato'], 'trovati a terra');
    const prompt = models.calls[0].prompt;
    expect(prompt).toMatch(/Every thing needs a use the world knows/);
    expect(prompt).toMatch(/the places of this world: head, torso, back/);
    expect(prompt).toMatch(/Pezza di stoffa/);
    const schema = JSON.stringify(models.calls[0].schema);
    expect(schema).toMatch(/"use"/);
    expect(schema).toMatch(/"recipe"/);
  });

  it('sends back a thing without a use with the reason, once, and takes the use the Narrator gives then', async () => {
    const { k, models } = await boot([[stone], [{ ...stone, use: 'craft', recipe: { result: 'Benda', with: ['Pezza di stoffa'] } }]]);
    const defs = await k.introduceItems(['Sasso levigato'], 'trovati a terra');
    expect(models.calls).toHaveLength(2);
    expect(models.calls[1].prompt).toMatch(/«Sasso levigato» si prende ma non ha un uso/);
    expect(defs.map((d) => d.name)).toEqual(['Sasso levigato']);
    const pack = JSON.parse(k.repo.working['modules/items.citati/manifest.json']);
    expect(pack.recipes).toEqual([expect.objectContaining({ inputs: [{ item: defs[0].id, count: 1 }, { item: 'item.stoffa', count: 1 }], output: { item: 'item.benda', count: 1 } })]);
    expect(k.itemUseWords(defs[0].id)).toEqual(['Con questo e Pezza di stoffa si fa: Benda di lino.']);
    expect(k.council.feed.some((e) => e.from === 'kernel' && e.kind === 'scarta' && e.task === 'content.define')).toBe(true);
  });

  it('leaves out what has no use after the reasons, with a shortfall; keeps as a decoration what the wanderer made', async () => {
    const { k } = await boot([[stone]]);
    expect(await k.introduceItems(['Sasso levigato'], 'trovati a terra')).toEqual([]);
    expect(k.content.byName('Sasso levigato')).toBeUndefined();
    expect(k.shortfalls.list().some((s) => s.task === 'content.define' && s.outcome === 'invalid' && /non ha un uso/.test(s.reason))).toBe(true);
    const made = await k.introduceItems(['Sasso levigato'], 'fabbricato dal viandante', undefined, { keep: true });
    expect(made).toHaveLength(1);
    expect(made[0].decoration).toBe(true);
    expect(k.itemUseWords(made[0].id)[0]).toMatch(/si tiene/);
  });

  it('takes an action only with effects the world knows, not with words alone', async () => {
    const words = { ...stone, use: 'action', action: { label: 'Guardalo', effects: [{ type: 'message', text: 'È liscio.' }] } };
    const lit = { ...stone, name: 'Pietra di luna', use: 'action', action: { label: 'Sfregala', effects: [{ type: 'message', text: 'Si accende.' }, { type: 'light', radius: 2, duration: 30 }] } };
    const { k, models } = await boot([[words, lit], [{ ...words, use: 'decoration' }]]);
    const defs = await k.introduceItems(['Sasso levigato', 'Pietra di luna'], 'trovati a terra');
    expect(models.calls).toHaveLength(2);
    const moon = defs.find((d) => d.name === 'Pietra di luna')!;
    expect(moon.actions?.[0].effects?.map((e) => e.type)).toEqual(['message', 'light']);
    expect(k.itemUseWords(moon.id)).toEqual(['Puoi: «Sfregala».']);
    expect(defs.find((d) => d.name === 'Sasso levigato')?.decoration).toBe(true);
  });

  it('drops from a pack what has no use, with the recipes it was in, and writes the rest', async () => {
    class Pack extends MockAiModels {
      async text(call: TextCall): Promise<string> {
        if (call.task === 'content.items') return JSON.stringify({ items: [stone, { name: 'Torta di mele', description: 'dolce', category: 'food', weight: 0.5, stack: 2, tags: ['cucina'], look: 'una torta', shape: 'bread', effects: { hunger: 25 }, use: 'consume' }] });
        if (call.task === 'content.recipes') return JSON.stringify({ recipes: [{ name: 'Torta', inputs: [{ item: 'Mela rossa', quantity: 2 }], tools: [], result: { item: 'Torta di mele', quantity: 1 } }], loot: [{ table: 'cucina', entries: [{ item: 'Sasso levigato', weight: 1 }, { item: 'Torta di mele', weight: 2 }] }] });
        return super.text(call);
      }
    }
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Pack() });
    expect(await k.growContent('prova', 2, true)).toBe(true);
    const path = Object.keys(k.repo.working).find((p) => p.startsWith('modules/items.pacco-'))!;
    const pack = JSON.parse(k.repo.working[path]);
    expect(pack.items.map((d: ItemDef) => d.name)).toEqual(['Torta di mele']);
    expect(pack.recipes).toHaveLength(1);
    expect(pack.loot.cucina.entries).toEqual([{ item: 'item.torta-di-mele', weight: 2 }]);
    expect(k.council.feed.some((e) => e.from === 'kernel' && e.kind === 'scarta' && e.task === 'content.items' && /Sasso levigato/.test(e.text))).toBe(true);
  });
});

describe('the things of before (T489)', () => {
  const oldPack = {
    id: 'items.vecchi',
    name: 'Oggetti di prima',
    kind: 'data',
    version: '0.1.0',
    items: [
      { id: 'item.matita', name: 'Matita grassa', description: 'una matita', category: 'tool', weight: 0.05, stack: 10, tags: ['scrittura'], glyph: '⚒', color: '#999' },
      { id: 'item.galletta', name: 'Galletta', description: 'secca', category: 'food', weight: 0.2, stack: 10, tags: ['cucina'], glyph: 'ò', color: '#ca8', effects: { hunger: 12 } },
      { id: 'item.ritaglio', name: 'Ritaglio di latta', description: 'latta', category: 'material', weight: 0.2, stack: 10, tags: ['latta'], glyph: '▪', color: '#aaa' },
    ],
    recipes: [{ id: 'ricetta.lume-di-latta', name: 'Lume', inputs: [{ item: 'item.ritaglio', count: 1 }, { item: 'item.candela', count: 1 }], output: { item: 'item.lanterna', count: 1 } }],
    loot: {},
  };
  const files = (extra: Record<string, string> = {}) => ({ ...bundledFiles, 'modules/items.vecchi/manifest.json': JSON.stringify(oldPack, null, 2) + '\n', ...extra });

  it('are marked as decorations by the kernel when they have no use, in a commit of its own, without calls, once', async () => {
    let calls = 0;
    class Counting extends MockAiModels {
      async text(call: TextCall): Promise<string> {
        calls++;
        return super.text(call);
      }
    }
    const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new Counting() });
    const pack = JSON.parse(k.repo.working['modules/items.vecchi/manifest.json']);
    expect(pack.items.map((d: ItemDef) => [d.id, !!d.decoration])).toEqual([['item.matita', true], ['item.galletta', false], ['item.ritaglio', false]]);
    expect(k.repo.log().filter((c) => c.message.startsWith('riparazione: 1 oggetto da tenere'))).toHaveLength(1);
    expect(calls).toBe(0);
    expect(k.content.get('item.matita')?.decoration).toBe(true);
    // Booting again on what it wrote: nothing more to mark.
    const again = await Kernel.boot({ files: { ...k.repo.working }, store: memoryStore(), ai: new MockAiModels() });
    expect(again.repo.log().some((c) => c.message.includes('da tenere'))).toBe(false);
  });

  it('leave the seed alone: its things all have a use, and a pack the seed gave is never touched', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(k.repo.log().some((c) => c.message.includes('da tenere'))).toBe(false);
    const world = k.useWorld();
    for (const d of k.content.items.values()) expect(usesOf(d, world).length, d.id).toBeGreaterThan(0);
    // A pack listed in seed.json is the seed's.
    const { marked } = markedPacks(files({ 'seed.json': JSON.stringify({ 'modules/items.vecchi/manifest.json': 'abc' }) }), () => false);
    expect(marked.filter((id) => id.startsWith('item.matita'))).toEqual([]);
    expect(markedPacks(files(), () => false).marked).toContain('item.matita');
  });
});

describe('where a thing is held (T489)', () => {
  it('the bag shows the recipes what one carries opens, with what is missing, never those of the world', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(k.recipes().opened).toEqual([]);
    expect(k.recipes().all.length).toBeGreaterThan(5);
    k.give('item.stoffa', 2);
    const open = k.recipes().opened;
    expect(open.length).toBeGreaterThan(0);
    for (const { recipe } of open) expect([...recipe.inputs.map((i) => i.item), ...(recipe.tools ?? [])]).toContain('item.stoffa');
    expect(open.find((o) => o.recipe.id === 'ricetta.benda')?.missing).toEqual([{ item: 'item.coltello', count: 1 }]);
  });

  it('a thing taken that completes a recipe makes the wanderer think of it, once', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const said: string[] = [];
    k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
    k.give('item.stoffa', 2);
    const pc = k.wandererCarpet();
    const pick = (item: string) => (k as unknown as { pickUpEntity(id: number): boolean }).pickUpEntity(k.spawnItem(item, pc.x, pc.y));
    pick('item.coltello');
    expect(said).toContain('Con Pezza di stoffa e Coltello potresti fare: Benda di lino.');
    const n = said.length;
    pick('item.coltello');
    expect(said.slice(n).some((t) => t.startsWith('Con '))).toBe(false);
  });

  it('«Esamina» on a thing lying there and «Usa» on what is not used say what one does with it', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const dialogs: string[] = [];
    const said: string[] = [];
    k.bus.on('ui:dialog', (d: { text: string }) => dialogs.push(d.text));
    k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
    const pc = k.wandererCarpet();
    await k.perform(k.spawnItem('item.martello', pc.x + 1, pc.y), 'esamina');
    expect(dialogs.at(-1)).toMatch(/Serve a fare Secchio con Asse di legno e Corda\./);
    k.give('item.corda', 1);
    const slot = k.inventory().slots.findIndex((s) => s?.item === 'item.corda');
    k.useSlot(slot);
    expect(said.at(-1)).toBe('Corda: Con questo e Asse di legno, usando Martello, si fa: Secchio.');
    expect(countItem(k.inventory(), 'item.corda')).toBe(1);
  });
});
