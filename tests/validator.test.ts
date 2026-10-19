import { describe, expect, it } from 'vitest';
import { Sandbox } from '../src/kernel/sandbox';
import { Validator } from '../src/kernel/validator';
import { extractLines } from '../src/kernel/runes';
import { Repo, memoryStore } from '../src/kernel/repo';
import { fakeHost } from './helpers';
import type { TileDef } from '../src/kernel/types';

const S = 16;
const tiles = 'g'.repeat(S * S);
const palette: Record<string, TileDef> = { g: { name: 'prato', glyph: ',', color: '', bg: '', solid: false } };

describe('validator', async () => {
  const v = new Validator(await Sandbox.create(fakeHost().host));
  const place = { name: 'Radura', description: 'Una radura.' };

  it('accepts harmless valid runes', () => {
    expect(v.validateChunkContent({ place, runes: [{ line: 'carpet . active', col: 2, row: 2 }, { line: 'speed = speed', col: 2, row: 4 }] }, tiles, S, palette)).toEqual([]);
  });

  it('rejects runes that do not compile', () => {
    const e = v.validateChunkContent({ place, runes: [{ line: 'carpet . strength =', col: 2, row: 2 }] }, tiles, S, palette);
    expect(e.join()).toMatch(/non compila/);
  });

  it('rejects statements with effects and function calls', () => {
    expect(v.validateChunkContent({ place, runes: [{ line: 'carpet . active = false', col: 2, row: 2 }] }, tiles, S, palette).join()).toMatch(/effetti/);
    expect(v.validateChunkContent({ place, runes: [{ line: 'print ( x )', col: 2, row: 2 }] }, tiles, S, palette).join()).toMatch(/funzione/);
  });

  it('rejects touching lines and border lines', () => {
    expect(v.validateChunkContent({ place, runes: [{ line: 'x', col: 2, row: 2 }, { line: 'y', col: 3, row: 2 }] }, tiles, S, palette).join()).toMatch(/tocca/);
    expect(v.validateChunkContent({ place, runes: [{ line: 'x', col: 0, row: 2 }] }, tiles, S, palette).join()).toMatch(/bordo/);
  });

  it('validates manifests', () => {
    expect(v.parseManifest('m', '{"id":"npc.a","name":"A","kind":"entity","appearance":{"glyph":"a","color":"#fff"}}').errors).toEqual([]);
    expect(v.parseManifest('m', '{"id":"A","kind":"nope"}').errors.length).toBeGreaterThan(1);
    expect(v.parseManifest('m', '{').errors[0]).toMatch(/JSON/);
  });
});

describe('runes', () => {
  it('groups touching runes into lines in reading order', () => {
    const r = (id: number, token: string, col: number, row: number) => ({ id, rune: { token, col, row, source: 'gen' as const } });
    const lines = extractLines([r(1, 'carpet', 0, 0), r(2, '.', 6, 0), r(3, 'active', 7, 0), r(4, 'x', 20, 0), r(5, 'y', 0, 1)]);
    expect(lines.map((l) => l.src)).toEqual(['carpet . active', 'x', 'y']);
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
    const reopened = Repo.open('t', { 'a.lua': '1' }, store);
    expect(reopened.synced).toBe(false);
    expect(reopened.repo.working['a.lua']).toBe('2');
    const changed = Repo.open('t', { 'a.lua': '3' }, store);
    expect(changed.synced).toBe(true);
    expect(changed.repo.working['a.lua']).toBe('3');
  });
});
