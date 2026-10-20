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
import type { ItemSpec, LayoutDef, TileDef } from '../src/kernel/types';

const palette: Record<string, TileDef> = {
  g: { name: 'prato', color: '#4f9a45', solid: false, layer: 'ground' },
  p: { name: 'sentiero', color: '#c8a868', solid: false, layer: 'ground' },
  t: { name: 'bosco', color: '#1f5a2a', solid: true, layer: 'vegetation' },
  h: { name: 'muro', color: '#8c4a32', solid: true, layer: 'wall' },
  f: { name: 'pavimento', color: '#a07850', solid: false, layer: 'floor', indoor: true },
  d: { name: 'porta', color: '#e0c040', solid: false, layer: 'door' },
};
const plan = (p: Partial<ChunkPlan>): ChunkPlan => ({ place: { name: 'Radura', description: 'Una radura.' }, layout: 'bosco', objects: [], ground: [], fresh: [], runes: [], ...p });
const layouts = new Set(['bosco', 'borgo']);
const placeable = new Set(['npc.a', 'obj.cassa']);
const S = 18;
const drafts = [Array.from({ length: S }, () => 'g'.repeat(S)), Array.from({ length: S }, (_, r) => (r % 3 ? 'g' : 't').repeat(S))];

describe('validator', async () => {
  const v = new Validator(await Sandbox.create(fakeHost().host));

  it('accepts a good plan and normalizes runes written without spaces', () => {
    const r = v.validatePlan(plan({ runes: ['carpet.active', 'speed=speed'], objects: [{ module: 'npc.a', where: 'fuori' }, { module: 'obj.cassa', where: 'dentro' }] }), layouts, placeable);
    expect(r.errors).toEqual([]);
    expect(r.dropped).toEqual([]);
    expect(r.plan.runes).toEqual(['carpet . active', 'speed = speed']);
  });

  it('rejects unknown environments and missing places (fatal)', () => {
    expect(v.validatePlan(plan({ layout: 'luna' }), layouts, placeable).errors[0]).toMatch(/ambiente sconosciuto/);
    expect(v.validatePlan(plan({ place: { name: '', description: '' } }), layouts, placeable).errors[0]).toMatch(/nome/);
  });

  it('drops invalid code and unknown modules one by one, keeping the rest', () => {
    const r = v.validatePlan(plan({ runes: ['carpet . strength =', 'carpet . active = false', 'print ( x )', 'x', 'time'], objects: [{ module: 'npc.nope', where: 'fuori' }, { module: 'npc.a', where: 'ovunque' }] }), layouts, placeable);
    expect(r.errors).toEqual([]);
    const dropped = r.dropped.join(' | ');
    expect(dropped).toMatch(/non compila/);
    expect(dropped).toMatch(/effetti/);
    expect(dropped).toMatch(/funzione/);
    expect(dropped).toMatch(/inesistente/);
    expect(r.plan.runes).toEqual(['x', 'time']);
    expect(r.plan.objects).toEqual([{ module: 'npc.a', where: 'ovunque' }]);
  });

  it('test-runs layout programs on real drafts before accepting them', () => {
    const good: LayoutDef = { name: 'Borgo', description: 'case', environment: 'misto', program: { type: 'one', rules: [{ in: 'gggg/gggg/gggg/gggg', out: 'hhhh/hffh/hffh/hdhh' }], steps: 2 } };
    expect(v.validateLayout('borgo', good, palette, drafts)).toEqual([]);
    const unknownCode: LayoutDef = { ...good, program: { type: 'all', rules: [{ in: 'g', out: 'Z' }] } };
    expect(v.validateLayout('x', unknownCode, palette, drafts).join()).toMatch(/codici inesistenti Z/);
    const walls: LayoutDef = { ...good, program: { type: 'all', rules: [{ in: 'g', out: 'h' }] } };
    expect(v.validateLayout('x', walls, palette, drafts).join()).toMatch(/troppo poco spazio/);
    const broken = { ...good, program: { type: 'one', rules: [{ in: 'gg', out: 'g' }] } } as LayoutDef;
    expect(v.validateLayout('x', broken, palette, drafts).join()).toMatch(/stessa forma/);
  });

  it('validates manifests, items and characters', () => {
    expect(v.parseManifest('m', '{"id":"npc.a","name":"A","kind":"entity","appearance":{"glyph":"a","color":"#fff"}}').errors).toEqual([]);
    expect(v.parseManifest('m', '{"id":"npc.a","name":"A","kind":"entity","appearance":{"glyph":"a","color":"#fff"},"interaction":{"type":"talk"}}').errors.join()).toMatch(/persona/);
    expect(v.validateItems([{ id: 'item.a', name: 'A', category: 'cibo', weight: 1, stack: 5, tags: [] }])).toEqual([]);
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
          { nome: 'Corda', descrizione: 'fune', categoria: 'materiale', peso: 1, pila: 5, tag: ['Bottega'], aspetto: 'corda' },
          { nome: 'Rete da pesca', descrizione: 'rete', categoria: 'attrezzo', peso: 2, pila: 1, tag: [], aspetto: 'rete' },
        ],
        recipes: [{ nome: 'Rete', ingredienti: [{ oggetto: 'corda', quantita: 3 }], risultato: { oggetto: 'Rete da pesca', quantita: 1 } }, { nome: 'Impossibile', ingredienti: [{ oggetto: 'unobtainium', quantita: 1 }], risultato: { oggetto: 'Corda', quantita: 1 } }],
        loot: [{ tabella: 'Bottega', voci: [{ tag: 'materiale', peso: 2 }, { oggetto: 'Corda', peso: 1 }] }],
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
    const items = ['Pane di segale', 'Formaggio', 'Coltello'].map((n, i) => toItemDef({ nome: n, descrizione: '', categoria: i < 2 ? 'cibo' : 'attrezzo', peso: 1, pila: 3, tag: ['cucina'], aspetto: n }, taken)!);
    c.rebuild([{ manifest: { id: 'items.t', name: 't', kind: 'data', items, loot: { cucina: { rolls: [3, 3], entries: [{ tag: 'cibo', weight: 1 }] } } }, dir: '', manifestPath: '' }]);
    expect(c.byName('il pane di segale')?.id).toBe('item.pane-di-segale');
    expect(c.byName('un formaggio')?.id).toBe('item.formaggio');
    const rolled = c.roll('cucina', new Rng(1), ['item.formaggio']);
    expect(rolled).toHaveLength(3);
    expect(rolled.every((r) => r.item !== 'item.coltello')).toBe(true);
  });
});

describe('runes', () => {
  it('groups touching runes into lines in reading order', () => {
    const r = (id: number, token: string, col: number, row: number) => ({ id, rune: { token, col, row, source: 'gen' as const } });
    const lines = extractLines([r(1, 'carpet', 0, 0), r(2, '.', 6, 0), r(3, 'active', 7, 0), r(4, 'x', 20, 0), r(5, 'y', 0, 1)]);
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
        { tipo: 'bisogni', fame: 500, salute: -3 },
        { tipo: 'terreno', a: 'Sentiero', raggio: 99 },
        { tipo: 'crea_oggetto', oggetto: 'una mela rossa', quantita: 40 },
        { tipo: 'fuoco', durata: 1e9 },
        { tipo: 'crea_oggetto', oggetto: 'Spada di vetro' },
        { tipo: 'evoca', modulo: 'Drago' },
        { tipo: 'teletrasporto' },
        'rubbish',
      ],
      ctx,
    );
    expect(v.effects).toEqual([
      { tipo: 'bisogni', fame: 40, salute: -3 },
      { tipo: 'terreno', a: 'p', raggio: 3 },
      { tipo: 'crea_oggetto', oggetto: 'item.mela', quantita: 5 },
      { tipo: 'fuoco', raggio: 1, durata: 30 },
    ]);
    expect(v.unknownItems).toEqual(['Spada di vetro']);
    expect(v.dropped.join(' ')).toMatch(/Drago.*teletrasporto/);
  });
});
