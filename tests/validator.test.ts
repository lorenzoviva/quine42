import { describe, expect, it } from 'vitest';
import { Sandbox } from '../src/kernel/sandbox';
import { Validator, apiErrors, validateEffects } from '../src/kernel/validator';
import { extractLines } from '../src/kernel/runes';
import { Repo, memoryStore } from '../src/kernel/repo';
import { addItem, moveSlot, newInventory, removeItem, totalWeight } from '../src/kernel/inventory';
import { Content } from '../src/kernel/content';
import { Rng } from '../src/kernel/rng';
import { assemblePack, toItemDef } from '../src/kernel/agents/content';
import { fakeHost } from './helpers';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { ItemSpec, EnvironmentDef, TerrainDef } from '../src/kernel/types';

const palette: Record<string, TerrainDef> = {
  g: { name: 'prato', color: '#4f9a45', solid: false, layer: 'ground' },
  p: { name: 'sentiero', color: '#c8a868', solid: false, layer: 'ground' },
  t: { name: 'bosco', color: '#1f5a2a', solid: true, layer: 'vegetation' },
  h: { name: 'muro', color: '#8c4a32', solid: true, layer: 'wall' },
  f: { name: 'pavimento', color: '#a07850', solid: false, layer: 'floor', indoor: true },
  d: { name: 'porta', color: '#e0c040', solid: false, layer: 'door' },
};
const plan = (p: Partial<ChunkPlan>): ChunkPlan => ({ place: { name: 'Radura', description: 'Una radura.' }, layout: 'bosco', objects: [], ground: [], fresh: [], runes: [], ...p });
const layouts = new Set(['bosco', 'borgo']);
const placeable = new Set(['npc.a', 'obj.chest']);
const S = 18;
const drafts = [Array.from({ length: S }, () => 'g'.repeat(S)), Array.from({ length: S }, (_, r) => (r % 3 ? 'g' : 't').repeat(S))];

describe('validator', async () => {
  const v = new Validator(await Sandbox.create(fakeHost().host));

  it('accepts a good plan and normalizes runes written without spaces', () => {
    const r = v.validatePlan(plan({ runes: ['carpet.active', 'speed=speed'], objects: [{ module: 'npc.a', where: 'outside' }, { module: 'obj.chest', where: 'inside' }] }), layouts, placeable);
    expect(r.errors).toEqual([]);
    expect(r.dropped).toEqual([]);
    expect(r.plan.runes).toEqual(['carpet . active', 'speed = speed']);
  });

  it('rejects unknown environments and missing places (fatal)', () => {
    expect(v.validatePlan(plan({ layout: 'luna' }), layouts, placeable).errors[0]).toMatch(/ambiente sconosciuto/);
    expect(v.validatePlan(plan({ place: { name: '', description: '' } }), layouts, placeable).errors[0]).toMatch(/nome/);
  });

  it('drops invalid code and unknown modules one by one, keeping the rest', () => {
    const r = v.validatePlan(plan({ runes: ['carpet . strength =', 'carpet . active = false', 'print ( x )', 'x', 'time'], objects: [{ module: 'npc.nope', where: 'outside' }, { module: 'npc.a', where: 'anywhere' }] }), layouts, placeable);
    expect(r.errors).toEqual([]);
    const dropped = r.dropped.join(' | ');
    expect(dropped).toMatch(/non compila/);
    expect(dropped).toMatch(/effetti/);
    expect(dropped).toMatch(/funzione/);
    expect(dropped).toMatch(/inesistente/);
    expect(r.plan.runes).toEqual(['x', 'time']);
    expect(r.plan.objects).toEqual([{ module: 'npc.a', where: 'anywhere' }]);
  });

  it('test-runs layout programs on real drafts before accepting them', () => {
    const good: EnvironmentDef = { name: 'Borgo', description: 'case', environment: 'mixed', program: { type: 'one', rules: [{ in: 'gggg/gggg/gggg/gggg', out: 'hhhh/hffh/hffh/hdhh' }], steps: 2 } };
    expect(v.validateLayout('borgo', good, palette, drafts)).toEqual([]);
    const unknownCode: EnvironmentDef = { ...good, program: { type: 'all', rules: [{ in: 'g', out: 'Z' }] } };
    expect(v.validateLayout('x', unknownCode, palette, drafts).join()).toMatch(/codici inesistenti Z/);
    const walls: EnvironmentDef = { ...good, program: { type: 'all', rules: [{ in: 'g', out: 'h' }] } };
    expect(v.validateLayout('x', walls, palette, drafts).join()).toMatch(/troppo poco spazio/);
    const broken = { ...good, program: { type: 'one', rules: [{ in: 'gg', out: 'g' }] } } as EnvironmentDef;
    expect(v.validateLayout('x', broken, palette, drafts).join()).toMatch(/stessa forma/);
  });

  it('validates manifests, items and characters', () => {
    expect(v.parseManifest('m', '{"id":"npc.a","name":"A","kind":"entity","appearance":{"glyph":"a","color":"#fff"}}').errors).toEqual([]);
    expect(v.parseManifest('m', '{"id":"npc.a","name":"A","kind":"entity","appearance":{"glyph":"a","color":"#fff"},"interaction":{"type":"talk"}}').errors.join()).toMatch(/persona/);
    expect(v.validateItems([{ id: 'item.a', name: 'A', category: 'food', weight: 1, stack: 5, tags: [] }])).toEqual([]);
    // A manifest the Council wrote with the categories of 0.1 is read with the internal ones (T307a).
    expect(v.parseManifest('m', '{"id":"items.a","name":"A","kind":"data","items":[{"id":"item.a","name":"A","category":"cibo","weight":1,"stack":5,"tags":[]}]}').manifest?.items?.[0].category).toBe('food');
    expect(v.validateItems([{ id: 'bad', name: '', category: 'boh', weight: 99, stack: 0, tags: [] }]).length).toBeGreaterThan(3);
  });

  it('dry-loads forged code and rejects calls to functions that do not exist', () => {
    const m = { id: 'obj.prova', name: 'Prova', kind: 'entity' as const, appearance: { glyph: 'p', color: '#fff' } };
    expect(v.validateForged(m, 'return {}', new Set())).toEqual([]);
    expect(v.validateForged(m, 'error("boom") return {}', new Set()).join()).toMatch(/boom/);
    expect(v.validateForged(m, 'local M = {} function M.on_act() world.teleport(1) end return M', new Set()).join()).toMatch(/world\.teleport non esiste/);
    expect(apiErrors('-- world.nope nei commenti non conta\nlocal s = "ecs.niente"\nreturn items.find("x")')).toEqual([]);
    expect(apiErrors('os.exit()').join()).toMatch(/os/);
  });
});

describe('content', () => {
  it('turns model output into items, recipes and loot, resolving names', () => {
    const taken = new Set<string>();
    const pack = assemblePack(
      {
        items: [
          { name: 'Corda', description: 'fune', category: 'materiale', weight: 1, stack: 5, tags: ['Bottega'], look: 'corda' },
          { name: 'Rete da pesca', description: 'rete', category: 'attrezzo', weight: 2, stack: 1, tags: [], look: 'rete' },
        ],
        recipes: [{ name: 'Rete', inputs: [{ item: 'corda', quantity: 3 }], result: { item: 'Rete da pesca', quantity: 1 } }, { name: 'Impossibile', inputs: [{ item: 'unobtainium', quantity: 1 }], result: { item: 'Corda', quantity: 1 } }],
        loot: [{ table: 'Bottega', entries: [{ tag: 'materiale', weight: 2 }, { item: 'Corda', weight: 1 }] }],
      },
      new Map(),
      taken,
    );
    expect(pack.items.map((d) => d.id)).toEqual(['item.corda', 'item.rete-da-pesca']);
    expect(pack.items[0].tags).toEqual(['bottega']);
    expect(pack.recipes).toHaveLength(1);
    expect(pack.recipes[0].inputs[0]).toEqual({ item: 'item.corda', count: 3 });
    expect(pack.loot.bottega.entries).toHaveLength(2);
  });

  it('finds items by loose names and rolls loot by tag, favouring what was talked about', () => {
    const c = new Content();
    const taken = new Set<string>();
    const items = ['Pane di segale', 'Formaggio', 'Coltello'].map((n, i) => toItemDef({ name: n, description: '', category: i < 2 ? 'cibo' : 'attrezzo', weight: 1, stack: 3, tags: ['cucina'], look: n }, taken)!);
    c.rebuild([{ manifest: { id: 'items.t', name: 't', kind: 'data', items, loot: { cucina: { rolls: [3, 3], entries: [{ tag: 'cibo', weight: 1 }] } } }, dir: '', manifestPath: '' }]);
    expect(c.byName('il pane di segale')?.id).toBe('item.pane-di-segale');
    expect(c.byName('un formaggio')?.id).toBe('item.formaggio');
    const rolled = c.roll('cucina', new Rng(1), ['item.formaggio']);
    expect(rolled).toHaveLength(3);
    expect(rolled.every((r) => r.item !== 'item.coltello')).toBe(true);
  });
});

describe('runes', () => {
  it('groups touching runes (one cell each) into lines in reading order', () => {
    const r = (id: number, token: string, col: number, row: number) => ({ id, rune: { token, col, row, source: 'gen' as const } });
    const lines = extractLines([r(1, 'carpet', 0, 0), r(2, '.', 1, 0), r(3, 'active', 2, 0), r(4, 'x', 4, 0), r(5, 'y', 0, 1)]);
    expect(lines.map((l) => l.src)).toEqual(['carpet . active', 'x', 'y']);
  });
});

describe('inventory', () => {
  const apple: ItemSpec = { stackable: true, maxStack: 3, weight: 0.5, equippable: false };
  const sword: ItemSpec = { stackable: false, maxStack: 1, weight: 4, equippable: true };
  const lookup = (id: string) => (id === 'apple' ? apple : sword);

  it('stacks, overflows into new slots, removes and weighs', () => {
    const inv = newInventory(4);
    expect(addItem(inv, 'apple', 5, apple)).toBe(5);
    expect(inv.slots.map((s) => s?.count ?? 0)).toEqual([3, 2, 0, 0]);
    expect(addItem(inv, 'sword', 3, sword)).toBe(2);
    expect(totalWeight(inv, lookup)).toBe(2.5 + 8);
    expect(removeItem(inv, 'apple', 4)).toBe(4);
    expect(inv.slots.filter(Boolean).length).toBe(3);
  });

  it('moves and merges slots, keeping the equipped mark on its item', () => {
    const inv = newInventory(4);
    addItem(inv, 'sword', 1, sword);
    addItem(inv, 'apple', 2, apple);
    inv.equipped = 0;
    moveSlot(inv, 0, 3, lookup);
    expect(inv.slots[3]?.item).toBe('sword');
    expect(inv.equipped).toBe(3);
    inv.slots[2] = { item: 'apple', count: 2 };
    moveSlot(inv, 2, 1, lookup);
    expect(inv.slots[1]?.count).toBe(3);
    expect(inv.slots[2]?.count).toBe(1);
  });
});

describe('repo', () => {
  it('commits, restores and syncs from disk', () => {
    const store = memoryStore();
    const { repo } = Repo.open('t', { 'a.lua': '1' }, store);
    repo.write('a.lua', '2');
    expect(repo.isDirty()).toBe(true);
    repo.commit('due', 'player');
    repo.write('a.lua', 'rotto');
    expect(repo.restore()['a.lua']).toBe('2');
    expect(Repo.open('t', { 'a.lua': '1' }, store).repo.working['a.lua']).toBe('2');
    const changed = Repo.open('t', { 'a.lua': '3' }, store);
    expect(changed.synced).toBe(true);
    expect(changed.repo.working['a.lua']).toBe('3');
  });
});

describe('effects', () => {
  const palette = { g: { name: 'erba', color: '#3a6', solid: false }, p: { name: 'sentiero', color: '#a86', solid: false }, w: { name: 'acqua', color: '#36a', solid: true } };
  const ctx = { palette, item: (n: string) => (/mela/i.test(n) ? 'item.mela' : undefined), module: (n: string) => (n === 'Gatto' ? 'npc.cat' : undefined), loot: new Set(['cassa']) };

  it('keeps only the closed set, clamps numbers and resolves names', () => {
    const v = validateEffects(
      [
        { type: 'needs', hunger: 500, health: -3 },
        { type: 'terrain', to: 'Sentiero', radius: 99 },
        { type: 'create_item', item: 'una mela rossa', quantity: 40 },
        { type: 'fire', duration: 1e9 },
        { type: 'create_item', item: 'Spada di vetro' },
        { type: 'summon', module: 'Drago' },
        { tipo: 'teletrasporto' },
        'rubbish',
      ],
      ctx,
    );
    expect(v.effects).toEqual([
      { type: 'needs', hunger: 40, health: -3 },
      { type: 'terrain', to: 'p', radius: 3 },
      { type: 'create_item', item: 'item.mela', quantity: 5 },
      { type: 'fire', radius: 1, duration: 30 },
    ]);
    expect(v.unknownItems).toEqual(['Spada di vetro']);
    expect(v.dropped.join(' ')).toMatch(/Drago.*teletrasporto/);
  });
});

describe('kernel seed updates', () => {
  it('a universe gets new kernel files and the new terrains of a manifest it rewrote, keeping its own', async () => {
    const { upgradeFromSeed, seedHashes } = await import('../src/kernel/universes');
    const oldSeed = { 'modules/t/manifest.json': JSON.stringify({ id: 't', tiles: { g: { name: 'prato' } } }), 'a.md': 'vecchio' };
    const mine = { ...oldSeed, 'modules/t/manifest.json': JSON.stringify({ id: 't', tiles: { g: { name: 'pascolo' }, x: { name: 'mio' } } }), 'seed.json': JSON.stringify(seedHashes(oldSeed)) };
    const newSeed = { 'modules/t/manifest.json': JSON.stringify({ id: 't', tiles: { g: { name: 'prato' }, s: { name: 'sabbia' } } }), 'a.md': 'nuovo', 'b.md': 'aggiunto' };
    const up = upgradeFromSeed(mine, newSeed);
    expect(up.files['a.md']).toBe('nuovo');
    expect(up.files['b.md']).toBe('aggiunto');
    const tiles = JSON.parse(up.files['modules/t/manifest.json']).tiles;
    expect(tiles.g.name).toBe('pascolo');
    expect(tiles.x.name).toBe('mio');
    expect(tiles.s.name).toBe('sabbia');
  });
});
