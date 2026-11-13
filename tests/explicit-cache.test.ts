import { describe, expect, it } from 'vitest';
import { CACHE_MARGIN, ExplicitCaches, MAX_CACHES } from '../src/kernel/ai/cache';
import { CACHE_PAYER, CACHE_TASK, GeminiAiModels } from '../src/kernel/ai/gemini';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { cacheable, costOf, EXPLICIT_CACHE, priceOf } from '../src/kernel/ai/prices';
import { UsageLog, tallyLine, type CallRecord } from '../src/kernel/ai/usage';
import { CACHED_AGENTS, Council } from '../src/kernel/agents/council';
import { npcDialogue, npcReply } from '../src/kernel/agents/minds';
import { buildGraph } from '../src/kernel/graph';
import { hourlyEstimate } from '../src/kernel/coefficients';
import type { FileMap } from '../src/kernel/types';

// T351, ADR-0186: the Actor's system instructions in an explicit cache of Gemini 3.8 Flash. Offline: a fake Gemini, nothing leaves.

const ACTOR = 'gemini-3.8-flash';
const LONG = 'Sei l’Attore del mondo. '.repeat(400);
const DAY = '2026-11-13';

type Sent = { url: string; body: any };

/** A Gemini that writes caches and answers, and remembers what it was sent. */
function fakeGemini(o: { refuse?: boolean; gone?: () => boolean } = {}) {
  const sent: Sent[] = [];
  let n = 0;
  const impl = (async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    sent.push({ url, body });
    const answer = (status: number, json: unknown) => ({ ok: status < 400, status, statusText: '', json: async () => json }) as Response;
    if (url.endsWith('/cachedContents')) return o.refuse ? answer(400, { error: { message: 'troppo corta' } }) : answer(200, { name: `cachedContents/c${++n}`, usageMetadata: { totalTokenCount: 5000 } });
    if (body.cachedContent && o.gone?.()) return answer(404, { error: { message: 'cache sconosciuta' } });
    return answer(200, { candidates: [{ content: { parts: [{ text: '{"dice":"ciao","azione":"nessuna","umore":"calmo"}' }] } }], usageMetadata: { promptTokenCount: 6000, cachedContentTokenCount: body.cachedContent ? 5000 : 0, candidatesTokenCount: 50 } });
  }) as unknown as typeof fetch;
  return { sent, impl };
}

function models(impl: typeof fetch, now: () => number) {
  const g = new GeminiAiModels({ textModel: 'gemini-3.1-flash-lite', limits: { text: 50 }, fetchImpl: impl, now });
  const seen: CallRecord[] = [];
  g.onCall = (r) => seen.push({ ...r, day: DAY });
  return { g, seen };
}

const actorCall = (prompt = 'il viandante dice: ciao'): TextCall => ({ agent: 'actor', task: 'npc.reply', system: LONG, prompt, model: ACTOR, cache: true, chi: 'anna' });

describe('the explicit cache of the Actor (T351)', () => {
  it('only a model with a storage price may hold one; the storage is in the prices and in the cost', () => {
    expect(cacheable(ACTOR, DAY)).toBe(true);
    expect(cacheable('gemini-3.1-flash-lite', DAY)).toBe(false);
    expect(priceOf(ACTOR, DAY)?.storage).toBe(0.5);
    expect(priceOf(ACTOR, '2027-01-02')?.storage).toBe(1.0);
    // A million tokens kept an hour: the write as prompt, the storage at its price.
    expect(costOf(ACTOR, { prompt: 1e6, output: 0, stored: 1e6 }, DAY)).toBeCloseTo(0.75 + 0.5);
    expect(EXPLICIT_CACHE.ttl).toBeLessThanOrEqual(EXPLICIT_CACHE.maxTtl);
  });

  it('the first call goes whole, the second writes the cache and names it, the next ones only name it', async () => {
    const { sent, impl } = fakeGemini();
    const { g, seen } = models(impl, () => 0);
    await g.text(actorCall());
    expect(sent).toHaveLength(1);
    expect(sent[0].body.systemInstruction.parts[0].text).toBe(LONG);
    await g.text(actorCall());
    expect(sent.map((s) => s.url)).toEqual(['/api/gemini/models/gemini-3.8-flash:generateContent', '/api/gemini/cachedContents', '/api/gemini/models/gemini-3.8-flash:generateContent']);
    const write = sent[1].body;
    expect(write).toEqual({ model: `models/${ACTOR}`, systemInstruction: { parts: [{ text: LONG }] }, ttl: `${EXPLICIT_CACHE.ttl}s` });
    // A call that names the cache does not send the system instructions again.
    expect(sent[2].body.cachedContent).toBe('cachedContents/c1');
    expect(sent[2].body.systemInstruction).toBeUndefined();
    expect(sent[2].body.contents[0].parts[0].text).toBe('il viandante dice: ciao');
    await g.text(actorCall('altro'));
    expect(sent).toHaveLength(4);
    expect(sent[3].body.cachedContent).toBe('cachedContents/c1');
    // The ledger: the write paid by everybody, with its storage; the calls by whoever spoke, the prefix at the cache price.
    const w = seen.find((r) => r.task === CACHE_TASK)!;
    expect(w).toMatchObject({ model: ACTOR, agent: 'actor', prompt: 5000, cached: 0, who: CACHE_PAYER, stored: (5000 * EXPLICIT_CACHE.ttl) / 3600 });
    expect(seen.filter((r) => r.task === 'npc.reply').map((r) => [r.cached, r.who])).toEqual([[0, 'anna'], [5000, 'anna'], [5000, 'anna']]);
    const log = new UsageLog();
    seen.forEach((r) => log.record(r));
    const write$ = costOf(ACTOR, { prompt: 5000, output: 0, stored: (5000 * EXPLICIT_CACHE.ttl) / 3600 }, DAY)!;
    expect(log.tasks(DAY).find((t) => t.task === CACHE_TASK)!.tally.usd).toBeCloseTo(write$, 8);
    expect(log.payers(DAY)[CACHE_PAYER].usd).toBeCloseTo(write$, 8);
    expect(log.day(DAY).total.stored).toBeCloseTo(2500);
    expect(tallyLine(log.day(DAY).total)).toMatch(/cache esplicita 2500 token·ora/);
    // The usage file keeps the storage, and reads it back.
    const again = new UsageLog();
    again.load(log.toJson());
    expect(again.day(DAY).total.stored).toBeCloseTo(2500);
    expect(again.day(DAY).total.usd).toBeCloseTo(log.day(DAY).total.usd, 5);
  });

  it('at the end of its life a new one is written at the next call; a prefix that changes has its own', async () => {
    let now = 0;
    const { sent, impl } = fakeGemini();
    const { g } = models(impl, () => now);
    await g.text(actorCall());
    await g.text(actorCall());
    now = (EXPLICIT_CACHE.ttl - CACHE_MARGIN) * 1000 - 1;
    await g.text(actorCall());
    expect(sent.filter((s) => s.url.endsWith('/cachedContents'))).toHaveLength(1);
    now += 2;
    await g.text(actorCall());
    expect(sent.filter((s) => s.url.endsWith('/cachedContents'))).toHaveLength(2);
    expect(sent.at(-1)!.body.cachedContent).toBe('cachedContents/c2');
    // Another prefix (a new rule, a focus): once whole, then its own cache.
    await g.text({ ...actorCall(), system: `${LONG} Una regola nuova.` });
    expect(sent.at(-1)!.body.systemInstruction).toBeDefined();
  });

  it('a cache that is gone sends the call whole, once; a refused write is not asked again for a while', async () => {
    let gone = false;
    const { sent, impl } = fakeGemini({ gone: () => gone });
    const { g } = models(impl, () => 0);
    await g.text(actorCall());
    await g.text(actorCall());
    gone = true;
    const out = await g.text(actorCall());
    expect(out).toMatch(/ciao/);
    expect(sent.at(-2)!.body.cachedContent).toBe('cachedContents/c1');
    expect(sent.at(-1)!.body.systemInstruction.parts[0].text).toBe(LONG);
    expect(sent.at(-1)!.body.cachedContent).toBeUndefined();

    const refused = fakeGemini({ refuse: true });
    const r = models(refused.impl, () => 0);
    for (let i = 0; i < 4; i++) await r.g.text(actorCall());
    expect(refused.sent.filter((s) => s.url.endsWith('/cachedContents'))).toHaveLength(1);
    expect(refused.sent.filter((s) => s.url.endsWith(':generateContent') && s.body.systemInstruction)).toHaveLength(4);
    // A refused write costs nothing.
    expect(r.seen.some((x) => x.task === CACHE_TASK)).toBe(false);
  });

  it('no cache for a model without one, for a prefix too short, or for a call that does not ask', async () => {
    const { sent, impl } = fakeGemini();
    const { g } = models(impl, () => 0);
    for (let i = 0; i < 3; i++) {
      await g.text({ ...actorCall(), model: 'gemini-3.1-flash-lite' });
      await g.text({ ...actorCall(), system: 'corto' });
      await g.text({ ...actorCall(), cache: undefined });
    }
    expect(sent.every((s) => !s.url.endsWith('/cachedContents') && s.body.systemInstruction)).toBe(true);
  });

  it('calls asked together wait for the same write; few prefixes are followed at once', async () => {
    let writes = 0;
    const c = new ExplicitCaches({ write: async () => ({ name: `cachedContents/w${++writes}` }), now: () => 0 });
    expect(await c.nameFor(ACTOR, LONG)).toBeUndefined();
    const names = await Promise.all([c.nameFor(ACTOR, LONG), c.nameFor(ACTOR, LONG), c.nameFor(ACTOR, LONG)]);
    expect(names).toEqual(['cachedContents/w1', 'cachedContents/w1', 'cachedContents/w1']);
    expect(writes).toBe(1);
    for (let i = 0; i < MAX_CACHES + 4; i++) await c.nameFor(ACTOR, `${LONG}${i}`);
    expect(c.live().length).toBeLessThanOrEqual(MAX_CACHES);
    // A write that throws is a refusal, never an error of the call.
    const broken = new ExplicitCaches({ write: async () => { throw new Error('rete'); }, now: () => 0 });
    await broken.nameFor(ACTOR, LONG);
    expect(await broken.nameFor(ACTOR, LONG)).toBeUndefined();
  });
});

/** Offline models that keep every call. */
class Recording extends MockAiModels {
  calls: TextCall[] = [];
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
}

function council() {
  const files: FileMap = {
    'universe.json': JSON.stringify({ name: 'prova' }),
    'modules/npc.villager/manifest.json': JSON.stringify({ version: '0.1.0', id: 'npc.villager', name: 'Abitante', kind: 'entity', persona: 'Sei un abitante.' }),
    'world/canon.md': '# Canone\n\nLe rune restano ferme dove sono.',
    'world/people.json': JSON.stringify({ persone: [{ nome: 'Bastiano', tipo: 'npc.villager', mestiere: 'pescatore', famiglia: [], routine: [], luogo: 'Piazza' }], attesi: [] }),
    'world/bible.json': JSON.stringify({ titolo: 'Prova', tono: 'quieto', sintesi: 'Un borgo sul lago.' }),
  };
  const graph = buildGraph(files, [{ cx: 0, cy: 0, nome: 'Piazza', cose: ['npc.villager'] }], () => 'person');
  const models = new Recording();
  return { models, c: new Council(models, () => ({ files, palette: {}, catalog: [], graph: () => graph })) };
}

const npc = { name: 'Bastiano', persona: 'Sei Bastiano.', scheda: 'Sei Bastiano, parli piano.', mood: 'calmo', mode: 'vaga', carrying: [], place: 'Piazza', history: [], facts: {} };
const person = (nome: string) => ({ nome, mestiere: 'pescatore', scheda: `Sei ${nome}.`, fa: 'ripara le reti', ricordi: '', segreti: '' });

describe('the Council asks the cache for the Actor only (T351)', () => {
  it('the Actor: the focus opens the prompt, the system is the same for every person; the Narrator as before', async () => {
    expect([...CACHED_AGENTS]).toEqual(['actor']);
    const { c, models } = council();
    await npcReply(c, npc, 'ciao', ['Bastiano'], { agent: 'actor', model: ACTOR });
    await npcReply(c, { ...npc, name: 'Altro' }, 'ciao', ['Bastiano'], { agent: 'actor', model: ACTOR });
    await npcDialogue(c, person('Bastiano'), person('Nereo'), 'Piazza', ['Bastiano'], { agent: 'actor', model: ACTOR });
    await npcReply(c, npc, 'ciao', ['Bastiano']);
    const [a, b, d, narrator] = models.calls;
    for (const x of [a, b, d]) {
      expect(x.cache).toBe(true);
      expect(x.system).not.toMatch(/What the world knows about this task/);
      expect(x.prompt.startsWith('## What the world knows about this task')).toBe(true);
    }
    // The sheet stays in the prompt: the prefix is the same whoever plays.
    expect(a.system).toBe(b.system);
    expect(a.system).toBe(d.system);
    expect(a.prompt).toMatch(/Sei Bastiano, parli piano\./);
    expect(narrator.cache).toBeUndefined();
    expect(narrator.system).toMatch(/What the world knows about this task/);
  });
});

describe('the hour of the lobby with the Actor and its cache (T351)', () => {
  it('the Actor pays the prefix at the cache price, and the cache has its row', () => {
    const base = { textModel: 'gemini-3.1-flash-lite', budget: { text: 100 }, maxForges: 4 } as never;
    const off = hourlyEstimate({ ...(base as object), actor: { on: true, model: 'gemini-3.5-flash-lite' } } as never, DAY);
    const on = hourlyEstimate({ ...(base as object), actor: { on: true, model: ACTOR } } as never, DAY);
    expect(off.righe.some((r) => /Cache dell'Attore/.test(r.voce))).toBe(false);
    const row = on.righe.find((r) => /Cache dell'Attore/.test(r.voce))!;
    expect(row.modo).toBe('non regolabile');
    expect(row.chiamate).toBeCloseTo(3600 / EXPLICIT_CACHE.ttl, 1);
    expect(row.dollari).toBeGreaterThan(0);
    expect(row.dollari).toBeLessThan(0.05);
  });
});
