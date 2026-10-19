import { describe, expect, it } from 'vitest';
import { Sandbox } from '../src/kernel/sandbox';
import { Validator } from '../src/kernel/validator';
import { extractLines } from '../src/kernel/runes';
import { Repo, memoryStore } from '../src/kernel/repo';
import { addItem, moveSlot, newInventory, removeItem, totalWeight } from '../src/kernel/inventory';
import { fakeHost } from './helpers';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { ItemSpec, TileDef } from '../src/kernel/types';

const S = 18;
const palette: Record<string, TileDef> = {
  g: { name: 'prato', color: '#4f9a45', solid: false },
  w: { name: 'acqua', color: '#3a78c8', solid: true },
};
const grid = Array.from({ length: S }, (_, r) => (r === 9 ? 'w'.repeat(S) : 'g'.repeat(S)));
const plan = (p: Partial<ChunkPlan>): ChunkPlan => ({ place: { name: 'Radura', description: 'Una radura.' }, grid, objects: [], fresh: [], runes: [], ...p });
const placeable = new Map([['npc.a', ['g']]]);

describe('validator', async () => {
  const v = new Validator(await Sandbox.create(fakeHost().host));

  it('accepts a good plan', () => {
    const r = v.validatePlan(plan({ runes: [{ line: 'carpet . active', col: 2, row: 2 }, { line: 'speed = speed', col: 2, row: 4 }], objects: [{ module: 'npc.a', col: 5, row: 5 }] }), S, palette, placeable, false);
    expect(r.errors).toEqual([]);
    expect(r.dropped).toEqual([]);
    expect(r.plan.runes.length).toBe(2);
  });

  it('rejects malformed grids and blocked starting squares (fatal)', () => {
    expect(v.validatePlan(plan({ grid: ['ggg'] }), S, palette, placeable, false).errors[0]).toMatch(/righe/);
    expect(v.validatePlan(plan({ grid: grid.map((r, i) => (i === 3 ? 'gx' + r.slice(2) : r)) }), S, palette, placeable, false).errors[0]).toMatch(/sconosciuto/);
    const blocked = grid.map((r, i) => (i === 0 ? 'w' + r.slice(1) : r));
    expect(v.validatePlan(plan({ grid: blocked }), S, palette, placeable, true).errors[0]).toMatch(/partenza/);
  });

  it('drops invalid code, snaps misplaced runes and objects to the nearest valid cell', () => {
    const r = v.validatePlan(
      plan({
        runes: [
          { line: 'carpet . strength =', col: 2, row: 2 },
          { line: 'carpet . active = false', col: 2, row: 3 },
          { line: 'print ( x )', col: 2, row: 4 },
          { line: 'x', col: 2, row: 9 },
          { line: 'y', col: 0, row: 5 },
          { line: 'time', col: 4, row: 5 },
        ],
        objects: [{ module: 'npc.nope', col: 1, row: 1 }, { module: 'npc.a', col: 1, row: 9 }, { module: 'npc.a', col: 1, row: 1 }],
      }),
      S,
      palette,
      placeable,
      false,
    );
    expect(r.errors).toEqual([]);
    const dropped = r.dropped.join(' | ');
    expect(dropped).toMatch(/non compila/);
    expect(dropped).toMatch(/effetti/);
    expect(dropped).toMatch(/funzione/);
    expect(dropped).toMatch(/inesistente/);
    expect(r.plan.runes.map((x) => x.line)).toEqual(['x', 'y', 'time']);
    // x was on water (row 9), y on the border, time touching y: all moved to valid cells.
    expect(r.moved).toBeGreaterThanOrEqual(3);
    for (const x of r.plan.runes) {
      expect(x.row).not.toBe(9);
      expect(x.col).toBeGreaterThanOrEqual(1);
    }
    expect(r.plan.objects.length).toBe(2);
    expect(r.plan.objects.every((o) => o.row !== 9)).toBe(true);
  });

  it('normalizes generated runes written without spaces', () => {
    const r = v.validatePlan(plan({ runes: [{ line: 'carpet.active', col: 2, row: 2 }, { line: 'speed=speed', col: 2, row: 4 }] }), S, palette, placeable, false);
    expect(r.dropped).toEqual([]);
    expect(r.plan.runes.map((x) => x.line)).toEqual(['carpet . active', 'speed = speed']);
  });

  it('validates manifests, including items and characters', () => {
    expect(v.parseManifest('m', '{"id":"npc.a","name":"A","kind":"entity","appearance":{"glyph":"a","color":"#fff"}}').errors).toEqual([]);
    expect(v.parseManifest('m', '{"id":"npc.a","name":"A","kind":"entity","appearance":{"glyph":"a","color":"#fff"},"interaction":{"type":"talk"}}').errors.join()).toMatch(/persona/);
    expect(v.parseManifest('m', '{"id":"item.a","name":"A","kind":"item","appearance":{"glyph":"a","color":"#fff"}}').errors.join()).toMatch(/item/);
    expect(v.parseManifest('m', '{"id":"A","kind":"nope"}').errors.length).toBeGreaterThan(1);
  });

  it('dry-loads forged code without touching the universe', () => {
    const m = { id: 'obj.prova', name: 'Prova', kind: 'entity' as const, appearance: { glyph: 'p', color: '#fff' } };
    expect(v.validateForged(m, 'return {}', new Set())).toEqual([]);
    expect(v.validateForged(m, 'error("boom") return {}', new Set()).join()).toMatch(/boom/);
    expect(v.validateForged(m, 'return 42', new Set()).join()).toMatch(/tabella/);
    expect(v.validateForged(m, 'return {}', new Set(['obj.prova'])).join()).toMatch(/già esistente/);
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
