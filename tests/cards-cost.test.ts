// The cost of every card and the server that measured it (T365, ADR-0194).
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { CARD_MAKERS, CARDS_FILE, CardCosts, allCards, readServer, stampFiles, type CardStamp } from '../src/kernel/cards';
import { CENSUS } from '../src/kernel/coefficients';
import { broughtEntry } from '../src/kernel/bring';
import { callCost } from '../src/kernel/ai/usage';

/** Offline models that report every call as OpenRouter would: with the dollars it said (`usd`), a different amount per task. */
class Said extends MockAiModels {
  said = 0;
  async text(call: TextCall): Promise<string> {
    const out = await super.text(call);
    const usd = 0.001 + (call.task.length % 7) / 10000;
    this.said += usd;
    (this as { onCall?: (r: object) => void }).onCall?.({ model: 'google/gemini-3.8-flash', agent: call.agent, task: call.task, prompt: 100, cached: 0, output: 20, thoughts: 0, usd, who: call.chi });
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

const SERVER = 'https://quine42.example';

describe('the cost of every card (T365)', () => {
  it('the calls of a group wait for the next card of the group; what makes no card stays out', () => {
    const c = new CardCosts();
    c.note('forge.concept', 0.002);
    c.note('forge.code', 0.004);
    c.note('npc.reply', 1); // a chat makes no card
    c.note('text.guard', 1);
    c.note('model.sculpt', undefined); // no price: a call of the group all the same
    expect(c.take('forge.concept', 2)).toBe(0.003);
    expect(c.take('forge.concept', 1)).toBeUndefined();
    expect(c.take('model.sculpt', 1)).toBe(0);
    expect(c.take('npc.reply', 1)).toBeUndefined();
    expect(c.take('chunk.plan', 1)).toBeUndefined();
  });

  it('requests of a group running together: each stamp takes its part of what is pending, its own request included', () => {
    const c = new CardCosts();
    const ends = [c.begin('forge.concept'), c.begin('forge.concept'), c.begin('forge.concept')];
    for (let i = 0; i < 3; i++) for (const t of ['forge.concept', 'forge.code']) c.note(t, 0.001);
    expect(c.take('forge.concept', 1)).toBe(0.002);
    ends[0]();
    ends[0](); // once
    expect(c.take('forge.concept', 1)).toBe(0.002);
    ends[1]();
    // The third one failed: what it cost goes to the next card of the group.
    ends[2]();
    c.note('forge.concept', 0.001);
    expect(c.take('forge.concept', 1)).toBe(0.003);
  });

  it('every task that makes a card is a task of the census, and belongs to one group only', () => {
    const tasks = new Set(CENSUS.map((t) => t.compito));
    const calls = Object.values(CARD_MAKERS).flat();
    expect(calls.filter((t) => !tasks.has(t))).toEqual([]);
    expect(new Set(calls).size).toBe(calls.length);
  });

  it('stampFiles shares among all the cards it signs, in every file, before writing them', () => {
    const head = { 'modules/a/manifest.json': '{"id":"a","kind":"data"}', 'world/plots.json': '{"plots":[]}' };
    const working = {
      'modules/a/manifest.json': JSON.stringify({ id: 'a', kind: 'data', items: [{ id: 'x', name: 'X' }, { id: 'y', name: 'Y' }] }),
      'world/plots.json': JSON.stringify({ plots: [{ id: 'p', title: 'P' }] }),
    };
    let seen = 0;
    const out = stampFiles(working, head, () => ({ author: 'narrator', payer: 'comune', holder: 'me' }), (signed: CardStamp[]) => {
      seen = signed.length;
      for (const s of signed) s.usd = 0.01;
    });
    expect(seen).toBe(3);
    expect(JSON.parse(out['modules/a/manifest.json']).items.map((i: { card: CardStamp }) => i.card.usd)).toEqual([0.01, 0.01]);
    expect(JSON.parse(out['world/plots.json']).plots[0].card.usd).toBe(0.01);
  });

  it('a Genesis and two places on a server: every card made says what it cost and where; the sum is what the calls of the cards cost', async () => {
    const ai = new Said();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai, server: SERVER });
    expect(await k.runGenesis('un regno di pastori sulle colline')).toBe(true);
    await develop(k);
    const cards = k.cardsOf();
    expect(cards.length).toBeGreaterThan(5);
    // Made here: each one names the server.
    expect(cards.every((c) => c.server === SERVER)).toBe(true);
    // The places: what planning them cost, each its own.
    const chunks = cards.filter((c) => c.tipo === 'chunk');
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.every((c) => (c.usd ?? 0) > 0)).toBe(true);
    // What the Genesis made shares its calls.
    const genesis = cards.filter((c) => c.tipo === 'module' && c.payer === 'comune');
    expect(genesis.length).toBeGreaterThan(0);
    expect(genesis.every((c) => (c.usd ?? 0) > 0)).toBe(true);
    // Never more than what was spent, and nothing of a call that made no card.
    const total = cards.reduce((s, c) => s + (c.usd ?? 0), 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(ai.said + 1e-6);
    // Into the universe with the next commit, and read back as it was written.
    k.saveUsage();
    const file = JSON.parse(k.repo.head().files[CARDS_FILE]);
    const first = chunks[0].id.slice('chunk:'.length);
    expect(file.chunks[first]).toMatchObject({ usd: chunks[0].usd, server: SERVER });
    expect(allCards(k.repo.head().files).find((c) => c.id === chunks[0].id)).toMatchObject({ usd: chunks[0].usd, server: SERVER });
  }, 60000);

  it('without a server (a browser, development) the cards say what they cost but not where', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new Said() });
    expect(await k.runGenesis('un regno di pastori sulle colline')).toBe(true);
    const cards = k.cardsOf();
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some((c) => (c.usd ?? 0) > 0)).toBe(true);
    expect(cards.every((c) => c.server === undefined)).toBe(true);
  }, 60000);

  it('the local models report nothing: no cost on the cards', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(await k.runGenesis('un regno di pastori sulle colline')).toBe(true);
    expect(k.cardsOf().every((c) => c.usd === undefined)).toBe(true);
  }, 60000);

  it('read without trusting the file: a cost that is not a number ≥ 0 and a server that is not an origin are not there', () => {
    expect(readServer('https://quine42.example')).toBe(SERVER);
    expect(readServer('http://localhost:8080')).toBe('http://localhost:8080');
    for (const bad of ['http://quine42.example', 'https://a.b/percorso', 'javascript:alert(1)', 42, '']) expect(readServer(bad)).toBeUndefined();
    const stamp = (extra: object) => ({ author: 'cartographer', payer: 'me', holder: 'me', name: 'Valle', ...extra });
    const files = {
      ...bundledFiles,
      [CARDS_FILE]: JSON.stringify({ uses: {}, chunks: { '1_0': stamp({ usd: 0.0123456789, server: SERVER }), '2_0': stamp({ usd: -1, server: 'ftp://x' }), '3_0': stamp({ usd: 'molto' }) } }),
    };
    const byId = Object.fromEntries(allCards(files).map((c) => [c.id, c]));
    expect(byId['chunk:1_0']).toMatchObject({ usd: 0.012346, server: SERVER });
    expect(byId['chunk:2_0'].usd).toBeUndefined();
    expect(byId['chunk:2_0'].server).toBeUndefined();
    expect(byId['chunk:3_0'].usd).toBeUndefined();
  });

  it('a card brought from another universe keeps what it cost and where, as that universe says it', () => {
    const card = { author: 'sculptor', payer: 'comune', holder: 'anna', usd: 0.0042, server: SERVER };
    const made = broughtEntry({ kind: 'model', universe: 'fonte', id: 'barile', entry: { class: 'furniture', name: 'Barile', card }, xml: '<x/>', name: 'Barile' }, 'me');
    if ('error' in made) throw new Error(made.error);
    expect(made.info.card).toMatchObject({ holder: 'me', usd: 0.0042, server: SERVER });
    const odd = broughtEntry({ kind: 'model', universe: 'fonte', id: 'barile', entry: { class: 'furniture', name: 'Barile', card: { ...card, usd: Infinity, server: 'x' } }, xml: '<x/>', name: 'Barile' }, 'me');
    if ('error' in odd) throw new Error(odd.error);
    expect(odd.info.card.usd).toBeUndefined();
    expect(odd.info.card.server).toBeUndefined();
  });

  it('the dollars said are the ones a card takes, not the price list', () => {
    const r = { model: 'google/gemini-3.8-flash', agent: 'cartographer', task: 'chunk.plan', prompt: 1_000_000, cached: 0, output: 0, thoughts: 0, usd: 0.5 };
    const c = new CardCosts();
    c.note(r.task, callCost(r));
    expect(c.take('chunk.plan', 1)).toBe(0.5);
  });
});
