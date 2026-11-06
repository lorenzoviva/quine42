import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { CARDS_FILE, COMUNE, isCommonTask, payerOf, stampFiles, cardHolderOf } from '../src/kernel/cards';
import { USAGE_FILE } from '../src/kernel/ai/usage';

/** Offline models that report every call to the ledger as if it had cost a few tokens. */
class Billed extends MockAiModels {
  async text(call: TextCall): Promise<string> {
    const out = await super.text(call);
    (this as { onCall?: (r: object) => void }).onCall?.({ model: 'gemini-3.1-flash-lite', agent: call.agent, task: call.task, prompt: 100, cached: 0, output: 20, thoughts: 0, who: call.chi });
    return out;
  }
}

async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(1 / 60);
}

describe('the cards (T36)', () => {
  it('who pays: the world for the Genesis, the sessions and the plots; the wanderer for the rest', () => {
    for (const t of ['genesis.bible', 'genesis.cast', 'council.session', 'plot.weave', 'review.society', 'npc.dialogue', 'model.sculpt', 'content.items']) expect(isCommonTask(t)).toBe(true);
    for (const t of ['chunk.plan', 'npc.reply', 'action.judge', 'craft.free', 'referente.coordinate', 'items.citati', 'forge.concept']) expect(payerOf(t, 'anna')).toBe('anna');
  });

  it('a Genesis and two places: cards with author, payer and uses; the ledger knows who paid', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Billed() });
    expect(await k.runGenesis('un regno di pastori sulle colline')).toBe(true);
    await develop(k);
    const cards = k.cardsOf();
    // What the Genesis made is common; with one wanderer, every common card is theirs.
    const forged = cards.filter((c) => c.tipo === 'module' || (c.tipo === 'item' && c.file.startsWith('modules/items.pacco')));
    expect(forged.length).toBeGreaterThan(3);
    expect(forged.every((c) => c.payer === COMUNE && c.holder === 'me')).toBe(true);
    expect(cards.filter((c) => c.tipo === 'module').every((c) => c.author === 'narrator')).toBe(true);
    const envs = cards.filter((c) => c.tipo === 'environment');
    expect(envs.length).toBeGreaterThan(0);
    expect(envs.every((c) => c.author === 'cartographer' && c.payer === COMUNE)).toBe(true);
    // The places are the explorer's.
    const chunks = cards.filter((c) => c.tipo === 'chunk');
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.every((c) => c.author === 'cartographer' && c.payer === 'me' && c.holder === 'me' && c.nome)).toBe(true);
    // The content of the seed is nobody's card.
    expect(cards.some((c) => c.id === 'kind:core.carpet')).toBe(false);
    // Uses: the environments of the places, what stands in them.
    expect(cards.some((c) => c.tipo === 'environment' && c.uses.chunks > 0)).toBe(true);
    // A prompt that is about a card counts it.
    const item = forged.find((c) => c.tipo === 'item')!;
    k.council.focusContext([item.id]);
    expect(k.cards.uses(item.id).prompt).toBe(1);
    // The collection of the wanderer: all of it here.
    expect(k.cardsOf('me').length).toBe(cards.length);
    expect(k.cardsOf('anna')).toEqual([]);
    // Everything goes into the universe with the next commit.
    k.saveUsage();
    const file = JSON.parse(k.repo.head().files[CARDS_FILE]);
    expect(Object.keys(file.chunks).length).toBe(chunks.length);
    expect(file.uses[item.id].prompt).toBe(1);
    const usage = JSON.parse(k.repo.head().files[USAGE_FILE]);
    const payers = Object.values(usage.payers)[0] as Record<string, { calls: number }>;
    expect(payers[COMUNE].calls).toBeGreaterThan(5);
    expect(payers.me.calls).toBeGreaterThanOrEqual(2);
    expect(k.usage.sessionByPayer.me.calls).toBe(payers.me.calls);
  }, 60000);

  it('common cards go to one of the wanderers, drawn with the seed; the same in every kernel', async () => {
    const ids = Array.from({ length: 40 }, (_, i) => `item:cosa-${i}`);
    const draw = (seed: number) => ids.map((id) => cardHolderOf(id, COMUNE, ['me', 'anna'], seed));
    expect(draw(7)).toEqual(draw(7));
    expect(new Set(draw(7))).toEqual(new Set(['me', 'anna']));
    expect(draw(7)).not.toEqual(draw(8));
    expect(cardHolderOf('chunk:1_0', 'anna', ['me', 'anna'], 7)).toBe('anna');
    // In the kernel: the wanderers it has (the order they joined in does not matter).
    const a = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const b = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    a.addWanderer('anna');
    b.addWanderer('anna');
    const signs = (k: Kernel) => ids.map((id) => k.sign(id, 'plot.weave', 'narrator').holder);
    expect(signs(a)).toEqual(signs(b));
    expect(new Set(signs(a))).toEqual(new Set(['me', 'anna']));
    // What a wanderer pays for is theirs, whoever else is there.
    expect(a.as('anna', () => a.sign('chunk:3_3', 'chunk.plan', 'cartographer'))).toEqual({ author: 'cartographer', payer: 'anna', holder: 'anna' });
  });

  it('only what a change brings is stamped; a card lost in a rewrite comes back', () => {
    const carta = { author: 'sculptor', payer: COMUNE, holder: 'me' };
    const head = {
      'models/index.json': JSON.stringify({ seme: { class: 'object' }, vecchio: { class: 'object', card: carta } }, null, 1),
      'modules/items.base/manifest.json': JSON.stringify({ id: 'items.base', kind: 'data', items: [{ id: 'pane', name: 'Pane' }] }, null, 2),
    };
    const working = {
      ...head,
      'models/index.json': JSON.stringify({ seme: { class: 'object', score: 5 }, vecchio: { class: 'object', score: 7 }, nuovo: { class: 'figura' } }, null, 1),
      'modules/items.base/manifest.json': JSON.stringify({ id: 'items.base', kind: 'data', items: [{ id: 'pane', name: 'Pane' }, { id: 'vino', name: 'Vino' }] }, null, 2),
      'modules/npc.oste/manifest.json': JSON.stringify({ id: 'npc.oste', name: 'Oste', kind: 'entity' }, null, 2),
    };
    const signed: string[] = [];
    const out = stampFiles(working, head, (id) => (signed.push(id), { author: 'narrator', payer: 'me', holder: 'me' }));
    expect(signed.sort()).toEqual(['item:vino', 'kind:npc.oste', 'model:nuovo']);
    const index = JSON.parse(out['models/index.json']);
    expect(index.seme.card).toBeUndefined();
    expect(index.vecchio.card).toEqual(carta);
    expect(index.nuovo.card.payer).toBe('me');
    expect(out['models/index.json']).toMatch(/^\{\n "seme"/);
    expect(JSON.parse(out['modules/items.base/manifest.json']).items[0].card).toBeUndefined();
    expect(JSON.parse(out['modules/npc.oste/manifest.json']).card.author).toBe('narrator');
    // Nothing new, nothing rewritten.
    expect(stampFiles(head, head, () => carta)).toEqual({});
  });
});
