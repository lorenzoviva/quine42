// Before the Sculptor, the library (T349, ADR-0157 §4.1): `model.reuse` asks Jev whether a model that is there already shows a missing one;
// today's rule (sculpt it) is the floor. Offline: the bench's cases with Jev's recorded answers (tests/fixtures/model-reuse.json, from
// lab/banco/jev, T313) through a fake TypeSafe; no call leaves the machine.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { JevDecisionModels, JEV_MODEL, type DecisionCall, type DecisionModels, type Decisions } from '../src/kernel/ai/decisions';
import { FULL_DETAIL, hourlyEstimate, REUSE_SHARE } from '../src/kernel/coefficients';
import { readConfig } from '../src/kernel/universe';
import { isCommonTask } from '../src/kernel/cards';
import { REUSE_CLASSES, REUSE_NEW, REUSE_RULE } from '../src/kernel/modeldirector';
import type { SculptRequest } from '../src/kernel/agents/sculptor';

interface Fixture {
  id: string;
  thing: { name: string; kind: string; description: string };
  class: string;
  accept: string[];
  jev: { model: string; fits: number };
}
const CASES: Fixture[] = JSON.parse(readFileSync(new URL('./fixtures/model-reuse.json', import.meta.url), 'utf8')).cases;

/** TypeSafe as the gate answers it, from the bench's record: the case is found by the thing's name in the state. */
function recordedJev() {
  const asked: any[] = [];
  const impl = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    asked.push(body);
    const c = CASES.find((x) => x.thing.name === body.state.thing.name);
    const answers = c ? { model: { choice: c.jev.model }, fits: { noul: c.jev.fits } } : {};
    return new Response(JSON.stringify({ model: JEV_MODEL, answers, usage: { input_tokens: Math.ceil(String(init.body).length / 4), output_tokens: 40 } }), { status: 200 });
  }) as unknown as typeof fetch;
  return { asked, jev: new JevDecisionModels({ fetchImpl: impl }) };
}

const request = (c: Fixture): SculptRequest => ({ id: `prova-${c.id}`, nome: c.thing.name, aspetto: c.thing.description, classe: c.class });

describe('il riuso dei modelli con i casi del banco', () => {
  it('riusa dove il banco riusa, mai un modello sbagliato, e mai per persone, animali e oggetti', async () => {
    const { asked, jev } = recordedJev();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), decisions: jev });
    let right = 0;
    let asks = 0;
    for (const c of CASES) {
      const before = asked.length;
      const req = request(c);
      const reused = await k.sculpting.reuse(req);
      if (!REUSE_CLASSES.includes(c.class)) {
        // People, animals, beasts and small things: nobody is asked.
        expect(asked.length, c.id).toBe(before);
        expect(reused, c.id).toBe(false);
        continue;
      }
      asks++;
      expect(asked.length, c.id).toBe(before + 1);
      // Only the library of its class, never the request itself; «new» always an option.
      const options = Object.keys(asked[before].questions.model.criteria);
      expect(options, c.id).toContain(REUSE_NEW);
      for (const id of options.filter((o) => o !== REUSE_NEW)) expect(k.forms.info(id)?.class, `${c.id}: ${id}`).toBe(c.class);
      expect(asked[before].questions.fits.type).toBe('noul');
      if (reused) {
        // No wrong reuse: what it wears is one of the answers the bench accepts, its program copied under the request's id.
        const worn = c.accept.find((a) => a !== REUSE_NEW && k.files[`models/${a}.xml`] === k.files[`models/${req.id}.xml`]);
        expect(worn, c.id).toBeDefined();
        expect(k.forms.info(req.id), c.id).toMatchObject({ class: c.class, name: c.thing.name });
        right++;
      } else {
        expect(k.forms.info(req.id), c.id).toBeUndefined();
        if (c.accept.includes(REUSE_NEW)) right++;
      }
    }
    // The bench's cases of these classes: almost all right, as the bench measured (T313: 97 % with the companion Noul).
    expect(asks).toBeGreaterThanOrEqual(25);
    expect(right / asks).toBeGreaterThanOrEqual(0.9);
    expect(k.sculpting.reusedCount).toBe(right - CASES.filter((c) => REUSE_CLASSES.includes(c.class) && c.accept.includes(REUSE_NEW) && !(c.jev.fits >= 0.5 && c.jev.model !== REUSE_NEW)).length);
    // The reuse is paid by the world and is in the ledger under its task.
    expect(isCommonTask('model.reuse')).toBe(true);
    expect(k.usage.tasks().find((t) => t.model === JEV_MODEL && t.task === 'model.reuse')?.tally.calls).toBe(asks);
    expect(k.repo.log().some((c) => /della libreria/.test(c.message))).toBe(true);
  }, 60_000);

  it('una richiesta di riscolpire, un capo da indossare o una forma comune non si riusano', async () => {
    const { asked, jev } = recordedJev();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), decisions: jev });
    const botte = request(CASES.find((c) => c.id === 'botte')!);
    expect(await k.sculpting.reuse({ ...botte, previous: '<sequence/>' })).toBe(false);
    expect(await k.sculpting.reuse({ ...botte, desiderio: 'più grande' })).toBe(false);
    expect(await k.sculpting.reuse({ ...botte, tinta: true })).toBe(false);
    expect(asked).toHaveLength(0);
    expect(await k.sculpting.reuse(botte)).toBe(true);
  });

  it('senza la chiave, con la manopola a 0 o in sola lettura vale la regola: si scolpisce', async () => {
    const plain = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    const local = plain.council.localAiModels as MockAiModels;
    const botte = request(CASES.find((c) => c.id === 'botte')!);
    expect(await plain.sculpting.reuse(botte)).toBe(false);
    expect(local.decided).toBe(1);
    const { asked, jev } = recordedJev();
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), decisions: jev });
    expect(k.setAi({ coefficients: { ...FULL_DETAIL, models: 0 } })).toBe(true);
    expect(await k.sculpting.reuse(botte)).toBe(false);
    expect(k.setAi({ coefficients: FULL_DETAIL })).toBe(true);
    k.council.readOnly = () => 'prova';
    expect(await k.sculpting.reuse(botte)).toBe(false);
    expect(asked).toHaveLength(0);
  });

  it('una risposta fuori dalle opzioni, o una scelta senza la Noul compagna, non riusa', async () => {
    let answer: Partial<Decisions> = {};
    const fake: DecisionModels = { name: 'finto', decide: async (_c: DecisionCall) => answer };
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), decisions: fake });
    const botte = request(CASES.find((c) => c.id === 'botte')!);
    for (const a of [{ model: 'barile', fits: false }, { model: 'barile' }, { model: 'contadina', fits: true }, { model: REUSE_NEW, fits: true }, { model: 'struttura-locanda', fits: true }]) {
      answer = a;
      expect(await k.sculpting.reuse(botte), JSON.stringify(a)).toBe(false);
    }
    expect(REUSE_RULE).toEqual({ model: REUSE_NEW, fits: false });
  });
});

/** The local models, counting the calls of every task; named as if they were online, so the directors work. */
class Counting extends MockAiModels {
  calls: TextCall[] = [];
  constructor() {
    super();
    Object.defineProperty(this, 'name', { value: 'prova' });
  }
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
  count(...tasks: string[]): number {
    return this.calls.filter((c) => tasks.includes(c.task)).length;
  }
}
const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function sculptAll(k: Kernel): Promise<void> {
  for (let i = 0; i < 400 && k.sculpting.missing().length; i++) {
    k.sculpting.pump();
    await settle(2);
  }
  await settle(20);
}

/** A Jev that finds every model of the library fits, the generic of the class first: the upper bound of the saving. */
const askedClasses = new Set<string>();
const always: DecisionModels = {
  name: 'sempre',
  decide: async (c: DecisionCall) => {
    const criteria = (c.questions.model as { criteria: Record<string, string> }).criteria;
    const ids = Object.keys(criteria).filter((x) => x !== REUSE_NEW);
    for (const id of ids) askedClasses.add(/\[(\w+)\]$/.exec(criteria[id])?.[1] ?? '?');
    return { model: ids[0], fits: true };
  },
};

describe('una Genesi offline con il riuso', () => {
  it('lo Scultore è chiamato meno, le persone sono scolpite come prima', async () => {
    const run = async (decisions?: DecisionModels) => {
      const ai = new Counting();
      const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai, ...(decisions ? { decisions } : {}) });
      expect(await k.runGenesis('un regno di pastori')).toBe(true);
      await sculptAll(k);
      return { k, ai };
    };
    const rule = await run();
    const reuse = await run(always);
    expect(rule.k.sculpting.reusedCount).toBe(0);
    expect(reuse.k.sculpting.reusedCount).toBeGreaterThan(0);
    expect(reuse.ai.count('model.sculpt')).toBeLessThan(rule.ai.count('model.sculpt'));
    // What wore the library is of the classes that may; the people of the cast are sculpted in both.
    const worn = reuse.k.repo.log().filter((c) => /della libreria/.test(c.message)).length;
    expect(worn).toBe(reuse.k.sculpting.reusedCount);
    const sculptedPeople = (k: Kernel) => Object.values<{ class: string; author?: string }>(JSON.parse(k.files['models/index.json'])).filter((i) => i.class === 'person' && i.author && i.author !== 'a mano').length;
    expect(sculptedPeople(reuse.k)).toBe(sculptedPeople(rule.k));
    expect(askedClasses.size).toBeGreaterThan(0);
    for (const c of askedClasses) expect(REUSE_CLASSES).toContain(c);
  }, 120_000);
});

describe('la stima della lobby', () => {
  it('con Jev lo Scultore costa meno e il riuso ha la sua riga; senza, niente cambia', () => {
    const cfg = { ...readConfig(bundledFiles).config.ai, coefficients: FULL_DETAIL };
    const plain = hourlyEstimate(cfg);
    const jev = hourlyEstimate(cfg, undefined, { decisions: true });
    expect(plain.righe.some((r) => /riuso/i.test(r.voce))).toBe(false);
    const row = jev.righe.find((r) => /riuso/i.test(r.voce))!;
    expect(row.chiamate).toBeGreaterThan(0);
    expect(row.dollari).toBeLessThan(0.01);
    const models = (h: typeof plain) => h.righe.find((r) => r.voce === 'Modelli nuovi')!;
    expect(models(jev).dollari).toBeLessThan(models(plain).dollari);
    // The sculptures saved are the share of the estimate, and only them.
    expect(models(jev).dollari).toBeCloseTo(models(plain).dollari * (1 - REUSE_SHARE), 9);
    expect(jev.dollari).toBeLessThan(plain.dollari);
  });
});
