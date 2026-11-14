// The layer of closed decisions (T348, ADR-0157): today's rule is the floor and the local models' answer; Jev through its gate answers
// within the options or not at all. Offline: a fake TypeSafe, no call leaves the machine.
import { beforeAll, describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { BudgetError } from '../src/kernel/ai/models';
import { costOf, DECISION_PRICES, priceOf } from '../src/kernel/ai/prices';
import { JEV_MAX_BODY, JEV_MODEL, JEV_MODELS, JevDecisionModels, readJevAnswers, ruleDecisions, settleDecisions, type DecisionCall, type DecisionQuestion } from '../src/kernel/ai/decisions';
import { CENSUS, decisionKnob, FULL_DETAIL } from '../src/kernel/coefficients';
import type { CallRecord } from '../src/kernel/ai/usage';
import { OPENROUTER_JEV } from '../src/kernel/ai/openrouter';

const QUESTIONS: Record<string, DecisionQuestion> = {
  model: { type: 'choice', instructions: 'Which model of the library fits?', criteria: { barrel: 'a wooden barrel', crate: 'a crate', none: 'none fits' } },
  fits: { type: 'noul', instructions: 'Does the chosen model really fit?' },
  detail: { type: 'score', instructions: 'How detailed must it be?', criteria: ['little', 'some', 'much'] },
};
const RULE = { model: 'none', fits: false, detail: 1 };
const CALL: DecisionCall = { agent: 'sculptor', task: 'model.reuse', state: { asked: 'botte di rovere', library: ['barrel', 'crate'] }, questions: QUESTIONS, rule: RULE };

/** TypeSafe as the gate answers it: what was asked, and an answer of the caller's. */
function fakeJev(answer: (n: number) => Response | Promise<Response>) {
  const asked: Array<{ url: string; body: any; headers: Record<string, string> }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    asked.push({ url, body: JSON.parse(String(init.body)), headers: init.headers as Record<string, string> });
    return answer(asked.length);
  }) as unknown as typeof fetch;
  return { asked, impl };
}
const ok = (answers: unknown, input = 800) => new Response(JSON.stringify({ model: JEV_MODEL, answers, usage: { input_tokens: input, output_tokens: 90 } }), { status: 200 });
const JEV_RIGHT = { model: { choice: 'barrel', probabilities: { barrel: 0.9, crate: 0.08, none: 0.02 }, confidence: 0.8 }, fits: { noul: 0.83 }, detail: { score: 1.7, probabilities: { '0': 0.1, '1': 0.2, '2': 0.7 } } };

describe('le risposte dentro le scelte', () => {
  it('la regola risponde dove il modello esce dalle opzioni, e nulla oltre le domande', () => {
    expect(settleDecisions(CALL, { model: 'barrel', fits: true, detail: 2 })).toEqual({ model: 'barrel', fits: true, detail: 2 });
    expect(settleDecisions(CALL, { model: 'castle', fits: 0.9, detail: 3, extra: 'x' })).toEqual(RULE);
    expect(settleDecisions(CALL, { model: 'toString', detail: -1 })).toEqual(RULE);
    expect(settleDecisions(CALL, { detail: 1.5 })).toEqual(RULE);
    expect(settleDecisions(CALL, null)).toEqual(RULE);
    expect(ruleDecisions(CALL)).toEqual(RULE);
  });

  it('le risposte di Jev si leggono senza fidarsi', () => {
    expect(readJevAnswers(JEV_RIGHT, QUESTIONS)).toEqual({ model: 'barrel', fits: true, detail: 2 });
    expect(readJevAnswers({ model: { choice: 3 }, fits: { noul: 'sì' }, detail: { score: 'molto' } }, QUESTIONS)).toEqual({});
    expect(readJevAnswers({ fits: { noul: 1.4 }, detail: { score: 0.4 } }, QUESTIONS)).toEqual({ detail: 0 });
    expect(readJevAnswers('niente', QUESTIONS)).toEqual({});
  });

  it('i modelli locali rispondono con la regola', async () => {
    const local = new MockAiModels();
    expect(await local.decide(CALL)).toEqual(RULE);
    expect(local.decided).toBe(1);
  });

  it('ogni versione di Jev ammessa ha un prezzo, e la risposta è gratis', () => {
    for (const m of JEV_MODELS) expect(priceOf(m), m).toBeDefined();
    // Every version of Jev, from TypeSafe and through OpenRouter (T362), and nothing else.
    expect(Object.keys(DECISION_PRICES).sort()).toEqual([...JEV_MODELS, ...JEV_MODELS.map((m) => OPENROUTER_JEV[m])].sort());
    expect(costOf(JEV_MODEL, { prompt: 1e6, output: 1e6 })).toBeCloseTo(0.042, 6);
  });

  it('ogni decisione del censimento ha una manopola', () => {
    const decisions = CENSUS.filter((c) => c.via === 'decide');
    expect(decisions.map((c) => c.compito)).toContain('model.reuse');
    for (const c of decisions) expect(decisionKnob(c.compito), c.compito).toBe(c.coefficiente);
    expect(decisionKnob('npc.reply')).toBeUndefined();
  });
});

describe('Jev attraverso il varco', () => {
  it('manda solo il modello, lo stato e le domande, e conta la chiamata', async () => {
    const { asked, impl } = fakeJev(() => ok(JEV_RIGHT));
    const jev = new JevDecisionModels({ fetchImpl: impl });
    const calls: CallRecord[] = [];
    jev.onCall = (r) => calls.push(r);
    expect(await jev.decide({ ...CALL, chi: 'w1' })).toEqual({ model: 'barrel', fits: true, detail: 2 });
    expect(asked[0].url).toBe('/api/typesafe/v1/systemone');
    expect(Object.keys(asked[0].body).sort()).toEqual(['model', 'questions', 'state']);
    expect(asked[0].body.model).toBe(JEV_MODEL);
    expect(asked[0].body.questions.detail).toEqual({ type: 'score', instructions: QUESTIONS.detail.instructions, criteria: ['little', 'some', 'much'] });
    // No key here: the gate adds it.
    expect(Object.keys(asked[0].headers)).toEqual(['Content-Type']);
    expect(calls).toEqual([{ model: JEV_MODEL, agent: 'sculptor', task: 'model.reuse', prompt: 800, cached: 0, output: 90, thoughts: 0, who: 'w1', retries: 0 }]);
  });

  it('ripete 429 e 529, non il resto; il tetto del varco è un BudgetError', async () => {
    const busy = fakeJev((n) => (n === 1 ? new Response('{}', { status: 429 }) : n === 2 ? new Response('{}', { status: 529 }) : ok(JEV_RIGHT)));
    expect(await new JevDecisionModels({ fetchImpl: busy.impl }).decide(CALL)).toMatchObject({ model: 'barrel' });
    expect(busy.asked).toHaveLength(3);
    const broken = fakeJev(() => new Response('{"error":{"message":"guasto"}}', { status: 500 }));
    await expect(new JevDecisionModels({ fetchImpl: broken.impl }).decide(CALL)).rejects.toThrow(/500/);
    expect(broken.asked).toHaveLength(1);
    const capped = fakeJev(() => new Response('{}', { status: 402 }));
    await expect(new JevDecisionModels({ fetchImpl: capped.impl }).decide(CALL)).rejects.toBeInstanceOf(BudgetError);
  });

  it('una richiesta troppo grande non parte', async () => {
    const { asked, impl } = fakeJev(() => ok(JEV_RIGHT));
    await expect(new JevDecisionModels({ fetchImpl: impl }).decide({ ...CALL, state: 'x'.repeat(JEV_MAX_BODY) })).rejects.toThrow(/troppo grande/);
    expect(asked).toHaveLength(0);
  });
});

describe('il Concilio decide', () => {
  let k: Kernel;
  let answer: (n: number) => Response | Promise<Response> = () => ok(JEV_RIGHT);
  const jev = fakeJev((n) => answer(n));
  beforeAll(async () => {
    k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), decisions: new JevDecisionModels({ fetchImpl: jev.impl }) });
  });
  const decide = (task = 'model.reuse', chi?: string) => k.council.decide('sculptor', task, { state: CALL.state, questions: QUESTIONS, rule: RULE, ...(chi ? { chi } : {}) });

  it('con la chiave decide Jev, e la chiamata sta nel registro dei consumi con il suo prezzo', async () => {
    answer = () => ok(JEV_RIGHT, 1000);
    const before = jev.asked.length;
    expect(await decide('model.reuse', 'w1')).toEqual({ model: 'barrel', fits: true, detail: 2 });
    expect(jev.asked.length).toBe(before + 1);
    const line = k.usage.tasks().find((t) => t.model === JEV_MODEL && t.task === 'model.reuse');
    expect(line?.tally.calls).toBeGreaterThanOrEqual(1);
    expect(line?.tally.usd).toBeCloseTo((1000 * 0.042) / 1e6, 9);
    expect(k.usage.payers().w1?.calls).toBe(1);
  });

  it('una risposta fuori dalle scelte, o nessuna, lascia la regola', async () => {
    answer = () => ok({ model: { choice: 'castle' }, fits: { noul: 0.9 } });
    expect(await decide()).toEqual({ model: 'none', fits: true, detail: 1 });
    answer = () => Promise.reject(new Error('rete giù'));
    expect(await decide()).toEqual(RULE);
    expect(k.feed().some((e) => e.task === 'model.reuse' && /vale la regola/.test(e.text))).toBe(true);
  });

  it('un compito che il censimento non dice decisione non arriva a Jev', async () => {
    const before = jev.asked.length;
    expect(await decide('npc.reply')).toEqual(RULE);
    expect(jev.asked.length).toBe(before);
  });

  it('la manopola a 0 e l’universo in sola lettura danno la regola senza chiamare', async () => {
    answer = () => ok(JEV_RIGHT);
    const before = jev.asked.length;
    expect(k.setAi({ coefficients: { ...FULL_DETAIL, models: 0 } })).toBe(true);
    expect(await decide()).toEqual(RULE);
    expect(k.setAi({ coefficients: FULL_DETAIL })).toBe(true);
    const sealed = k.council.readOnly;
    k.council.readOnly = () => 'prova';
    expect(await decide()).toEqual(RULE);
    k.council.readOnly = sealed;
    expect(jev.asked.length).toBe(before);
    expect(await decide()).toMatchObject({ model: 'barrel' });
  });

  it('senza la chiave decidono i modelli locali: la regola', async () => {
    const plain = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    expect(plain.council.decisions).toBe(plain.council.localAiModels);
    expect(await plain.council.decide('sculptor', 'model.reuse', { state: {}, questions: QUESTIONS, rule: RULE })).toEqual(RULE);
  });
});
