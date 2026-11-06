import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { allCards, CARDS_FILE, moduleCardId, readCards, receivedBy } from '../src/kernel/cards';
import { cloneChanges } from '../src/kernel/clone';
import { changeOf, contentText, fingerprint, repairHeritage, sharesOf } from '../src/kernel/heritage';
import type { FileMap } from '../src/kernel/types';

const CARPET = 'modules/core.carpet/manifest.json';
const LOGIC = 'modules/core.carpet/logic.lua';
const CARPET_ID = moduleCardId({ id: 'core.carpet', kind: 'system' });

/** A multiplayer game whose master is `io`: the carpet is `io`'s card, the square a common one drawn to `io`. */
function prima(): FileMap {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const carpet = JSON.parse(bundledFiles[CARPET]);
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, name: 'prima', game: { mode: 'multiplayer', death: 2, pvp: false, freeActionsBetweenPlayers: true, master: 'me' } }, null, 2) + '\n',
    [CARPET]: JSON.stringify({ ...carpet, card: { author: 'engineer', payer: 'me', holder: 'me' } }, null, 2) + '\n',
    [CARDS_FILE]: JSON.stringify({ uses: { 'chunk:0_0': { chunks: 1, plots: 0, prompt: 3 } }, chunks: { '0_0': { author: 'cartographer', payer: 'comune', holder: 'me', name: 'La piazza' } } }, null, 1) + '\n',
  };
}

/** prima → seconda (master anna) → terza (master bruno), each time the old master's cards pass to the new one. */
function terza(): FileMap {
  const a = prima();
  const b = { ...a, ...cloneChanges(a, { nome: 'seconda', master: 'anna', titolari: 'master' }).changes };
  return { ...b, ...cloneChanges(b, { nome: 'terza', master: 'bruno', titolari: 'master' }).changes };
}

const card = (files: FileMap, id: string) => allCards(files, true).find((c) => c.id === id)!;

/** The carpet's manifest with `edit` applied (its card untouched). */
const editCarpet = (files: FileMap, edit: (m: any) => any): FileMap => ({ ...files, [CARPET]: JSON.stringify(edit(JSON.parse(files[CARPET])), null, 2) + '\n' });

describe('the heritage of clones (T45c)', () => {
  it('a clone of a clone carries the chain of the holders before', () => {
    const c = card(terza(), CARPET_ID);
    expect(c).toMatchObject({ author: 'engineer', payer: 'me', holder: 'bruno' });
    expect(c.origins!.map((o) => `${o.holder}@${o.universe}`)).toEqual(['me@prima', 'anna@seconda']);
    const chunk = card(terza(), 'chunk:0_0');
    expect(chunk.origins!.map((o) => `${o.holder}@${o.universe}`)).toEqual(['me@prima', 'anna@seconda']);
    // The uses so far are kept apart: the clone owes only what comes after.
    expect(readCards(terza()).atBirth).toEqual({ 'chunk:0_0': { chunks: 1, plots: 0, prompt: 3 } });
  });

  it('content never changed: half of every use goes back along the chain, at every link', () => {
    const q = card(terza(), CARPET_ID).quote!;
    expect(q.bruno).toBeCloseTo(0.5);
    expect(q.anna).toBeCloseTo(0.25);
    expect(q.me).toBeCloseTo(0.25);
    expect(Object.values(q).reduce((a, b) => a + b)).toBeCloseTo(1);
  });

  it('changed a little, the first holders get less; rewritten, only the base', () => {
    const files = terza();
    const little = card(editCarpet(files, (m) => ({ ...m, lore: 'Il tappeto riporta al centro.' })), CARPET_ID).quote!;
    expect(little.bruno).toBeGreaterThan(0.5);
    expect(little.bruno).toBeLessThan(0.65);
    // Between the two clones nothing changed: anna and io still split what goes back.
    expect(little.anna).toBeCloseTo(little.me);

    const rewritten = { ...editCarpet(files, (m) => ({ id: m.id, kind: m.kind, card: m.card, name: 'Altro', logic: m.logic, order: 99, tags: ['nuovo', 'diverso', 'riscritto'] })), [LOGIC]: '-- tutto diverso\nfunction update(dt)\n  log("nulla")\nend\n' };
    const much = card(rewritten, CARPET_ID).quote!;
    expect(much.bruno).toBeGreaterThan(0.85);
    expect(much.anna + much.me).toBeCloseTo(1 - much.bruno);
    expect(much.anna + much.me).toBeGreaterThanOrEqual(0.1 - 1e-9);
  });

  it('a change made in the middle clone: the second holder keeps more of what goes back', () => {
    const a = prima();
    const b0 = { ...a, ...cloneChanges(a, { nome: 'seconda', master: 'anna', titolari: 'master' }).changes };
    const b = { ...editCarpet(b0, (m) => ({ id: m.id, kind: m.kind, card: m.card, name: 'Di anna', logic: m.logic, tags: ['suo'] })), [LOGIC]: 'function update(dt) end\n' };
    const c = { ...b, ...cloneChanges(b, { nome: 'terza', master: 'bruno', titolari: 'master' }).changes };
    const q = card(c, CARPET_ID).quote!;
    expect(q.bruno).toBeCloseTo(0.5);
    expect(q.anna).toBeGreaterThan(0.4);
    expect(q.me).toBeLessThan(0.1);
  });

  it('who held a card before receives their share of the uses since the clone', () => {
    const files = terza();
    const ledger = JSON.parse(files[CARDS_FILE]);
    ledger.uses['chunk:0_0'] = { chunks: 3, plots: 1, prompt: 10 };
    const used = { ...files, [CARDS_FILE]: JSON.stringify(ledger) };
    const io = receivedBy(used, 'me');
    const square = io.find((r) => r.card.id === 'chunk:0_0')!;
    expect(square).toMatchObject({ universe: 'prima', uses: 10 });
    expect(square.received).toBeCloseTo(2.5);
    expect(io.find((r) => r.card.id === CARPET_ID)).toMatchObject({ universe: 'prima', uses: 0, received: 0 });
    expect(receivedBy(used, 'anna').find((r) => r.card.id === 'chunk:0_0')!.universe).toBe('seconda');
    // Who holds it now does not receive it as heritage.
    expect(receivedBy(used, 'bruno')).toEqual([]);
  });

  it('the base and the copy share come from universe.json, repaired', () => {
    expect(repairHeritage(undefined)).toEqual({ base: 0.1, copy: 0.4 });
    expect(repairHeritage({ base: 2, copy: 'x' })).toEqual({ base: 1, copy: 0 });
    expect(repairHeritage({ base: 0.3, copy: 0.9 })).toEqual({ base: 0.3, copy: 0.7 });
    const files = terza();
    const cfg = JSON.parse(files['universe.json']);
    const all = { ...files, 'universe.json': JSON.stringify({ ...cfg, heritage: { base: 0.2, copy: 0.8 } }) };
    expect(card(all, CARPET_ID).quote).toEqual({ me: 1 });
  });

  it('fingerprints measure change without keeping the content', () => {
    const text = contentText(JSON.parse(bundledFiles[CARPET]));
    expect(changeOf(fingerprint(text), fingerprint(text))).toBe(0);
    expect(changeOf(fingerprint(text), fingerprint('qualcosa di completamente diverso'))).toBeGreaterThan(0.9);
    expect(contentText({ b: 1, a: { card: { x: 1 }, c: 2 } })).toBe(contentText({ a: { c: 2 }, b: 1 }));
    expect(sharesOf('me', [], fingerprint(text))).toEqual({ me: 1 });
  });

  it('the kernel of the clone keeps the chain and the uses at birth, and tells what goes back', async () => {
    const files = terza();
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    const ledger = JSON.parse(k.cards.toJson());
    expect(ledger.atBirth['chunk:0_0']).toEqual({ chunks: 1, plots: 0, prompt: 3 });
    expect(ledger.chunks['0_0'].origins).toHaveLength(2);
    expect(k.received('me').map((r) => r.card.id)).toEqual(expect.arrayContaining([CARPET_ID, 'chunk:0_0']));
  });
});
