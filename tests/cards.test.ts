import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { CARDS_FILE, COMUNE, isCommonTask, payerOf, stampFiles, titolareOf } from '../src/kernel/cards';
import { USAGE_FILE } from '../src/kernel/ai/usage';

/** Offline models that report every call to the ledger as if it had cost a few tokens. */
class Billed extends MockModels {
  async text(call: TextCall): Promise<string> {
    const out = await super.text(call);
    (this as { onCall?: (r: object) => void }).onCall?.({ model: 'gemini-3.1-flash-lite', agent: call.agent, task: call.task, prompt: 100, cached: 0, output: 20, thoughts: 0, chi: call.chi });
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
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new Billed() });
    expect(await k.runGenesis('un regno di pastori sulle colline')).toBe(true);
    await develop(k);
    const cards = k.cardsOf();
    // What the Genesis made is common; with one wanderer, every common card is theirs.
    const forged = cards.filter((c) => c.tipo === 'modulo' || (c.tipo === 'oggetto' && c.file.startsWith('modules/items.pacco')));
    expect(forged.length).toBeGreaterThan(3);
    expect(forged.every((c) => c.pagante === COMUNE && c.titolare === 'io')).toBe(true);
    expect(cards.filter((c) => c.tipo === 'modulo').every((c) => c.autore === 'narratore')).toBe(true);
    const envs = cards.filter((c) => c.tipo === 'ambiente');
    expect(envs.length).toBeGreaterThan(0);
    expect(envs.every((c) => c.autore === 'cartografo' && c.pagante === COMUNE)).toBe(true);
    // The places are the explorer's.
    const places = cards.filter((c) => c.tipo === 'luogo');
    expect(places.length).toBeGreaterThanOrEqual(2);
    expect(places.every((c) => c.autore === 'cartografo' && c.pagante === 'io' && c.titolare === 'io' && c.nome)).toBe(true);
    // The content of the seed is nobody's card.
    expect(cards.some((c) => c.id === 'tipo:core.carpet')).toBe(false);
    // Uses: the environments of the places, what stands in them.
    expect(cards.some((c) => c.tipo === 'ambiente' && c.utilizzi.luoghi > 0)).toBe(true);
    // A prompt that is about a card counts it.
    const item = forged.find((c) => c.tipo === 'oggetto')!;
    k.council.focusContext([item.id]);
    expect(k.cards.uses(item.id).prompt).toBe(1);
    // The collection of the wanderer: all of it here.
    expect(k.cardsOf('io').length).toBe(cards.length);
    expect(k.cardsOf('anna')).toEqual([]);
    // Everything goes into the universe with the next commit.
    k.saveUsage();
    const file = JSON.parse(k.repo.head().files[CARDS_FILE]);
    expect(Object.keys(file.luoghi).length).toBe(places.length);
    expect(file.utilizzi[item.id].prompt).toBe(1);
    const usage = JSON.parse(k.repo.head().files[USAGE_FILE]);
    const payers = Object.values(usage.paganti)[0] as Record<string, { calls: number }>;
    expect(payers[COMUNE].calls).toBeGreaterThan(5);
    expect(payers.io.calls).toBeGreaterThanOrEqual(2);
    expect(k.usage.sessionByPayer.io.calls).toBe(payers.io.calls);
  }, 60000);

  it('common cards go to one of the wanderers, drawn with the seed; the same in every kernel', async () => {
    const ids = Array.from({ length: 40 }, (_, i) => `oggetto:cosa-${i}`);
    const draw = (seed: number) => ids.map((id) => titolareOf(id, COMUNE, ['io', 'anna'], seed));
    expect(draw(7)).toEqual(draw(7));
    expect(new Set(draw(7))).toEqual(new Set(['io', 'anna']));
    expect(draw(7)).not.toEqual(draw(8));
    expect(titolareOf('luogo:1_0', 'anna', ['io', 'anna'], 7)).toBe('anna');
    // In the kernel: the wanderers it has (the order they joined in does not matter).
    const a = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    const b = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
    a.addWanderer('anna');
    b.addWanderer('anna');
    const signs = (k: Kernel) => ids.map((id) => k.sign(id, 'plot.weave', 'narratore').titolare);
    expect(signs(a)).toEqual(signs(b));
    expect(new Set(signs(a))).toEqual(new Set(['io', 'anna']));
    // What a wanderer pays for is theirs, whoever else is there.
    expect(a.as('anna', () => a.sign('luogo:3_3', 'chunk.plan', 'cartografo'))).toEqual({ autore: 'cartografo', pagante: 'anna', titolare: 'anna' });
  });

  it('only what a change brings is stamped; a card lost in a rewrite comes back', () => {
    const carta = { autore: 'scultore', pagante: COMUNE, titolare: 'io' };
    const head = {
      'models/index.json': JSON.stringify({ seme: { classe: 'oggetto' }, vecchio: { classe: 'oggetto', carta } }, null, 1),
      'modules/items.base/manifest.json': JSON.stringify({ id: 'items.base', kind: 'data', items: [{ id: 'pane', name: 'Pane' }] }, null, 2),
    };
    const working = {
      ...head,
      'models/index.json': JSON.stringify({ seme: { classe: 'oggetto', voto: 5 }, vecchio: { classe: 'oggetto', voto: 7 }, nuovo: { classe: 'figura' } }, null, 1),
      'modules/items.base/manifest.json': JSON.stringify({ id: 'items.base', kind: 'data', items: [{ id: 'pane', name: 'Pane' }, { id: 'vino', name: 'Vino' }] }, null, 2),
      'modules/npc.oste/manifest.json': JSON.stringify({ id: 'npc.oste', name: 'Oste', kind: 'entity' }, null, 2),
    };
    const signed: string[] = [];
    const out = stampFiles(working, head, (id) => (signed.push(id), { autore: 'narratore', pagante: 'io', titolare: 'io' }));
    expect(signed.sort()).toEqual(['modello:nuovo', 'oggetto:vino', 'tipo:npc.oste']);
    const index = JSON.parse(out['models/index.json']);
    expect(index.seme.carta).toBeUndefined();
    expect(index.vecchio.carta).toEqual(carta);
    expect(index.nuovo.carta.pagante).toBe('io');
    expect(out['models/index.json']).toMatch(/^\{\n "seme"/);
    expect(JSON.parse(out['modules/items.base/manifest.json']).items[0].carta).toBeUndefined();
    expect(JSON.parse(out['modules/npc.oste/manifest.json']).carta.autore).toBe('narratore');
    // Nothing new, nothing rewritten.
    expect(stampFiles(head, head, () => carta)).toEqual({});
  });
});
