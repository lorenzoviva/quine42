// Tests for generation coefficients and «Low Detail» (T45b, ADR-0085)
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import type { TextCall } from '../src/kernel/ai/models';
import { readConfig } from '../src/kernel/universe';
import { CENSUS, COEFFICIENT_KEYS, FULL_DETAIL, hourlyEstimate, LOW_DETAIL, modelGap, onBeat, repairCoefficients, sculptPlan, stretch } from '../src/kernel/coefficients';
import { sculpt } from '../src/kernel/agents/sculptor';

const DT = 1 / 60;
const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The local models, counting the calls of every task; named as if they were online, so the world grows by itself. */
class Counting extends MockAiModels {
  calls = new Map<string, number>();
  constructor() {
    super();
    Object.defineProperty(this, 'name', { value: 'prova' });
  }
  async text(call: TextCall): Promise<string> {
    this.calls.set(call.task, (this.calls.get(call.task) ?? 0) + 1);
    return super.text(call);
  }
  count(...tasks: string[]): number {
    return tasks.reduce((s, t) => s + (this.calls.get(t) ?? 0), 0);
  }
}

async function bootWith(ai: Record<string, unknown>): Promise<{ k: Kernel; models: Counting }> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, maxPacks: 99, maxCast: 99, maxForges: 99, ...ai } }, null, 2) };
  const models = new Counting();
  return { k: await Kernel.boot({ files, store: memoryStore(), ai: models }), models };
}

async function develop(k: Kernel) {
  for (let i = 0; i < 60; i++) {
    k.tick(DT);
    await settle(10);
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
}

/** A walk of the world: the carpet carries the wanderer east place after place, so many new places are planned. */
async function walk(k: Kernel, steps: number) {
  for (let i = 0; i < steps; i++) {
    k.carpet()!.ox += k.config.chunkSize;
    await develop(k);
  }
  await settle(300);
}

const planned = (k: Kernel): number => (k as any).plannedCount;

describe('the coefficients of generation (T45b)', () => {
  it('are repaired: numbers, words, percentages, presets; what is missing is 1, but the lives of the people, which are 0', () => {
    expect(repairCoefficients(undefined)).toEqual({ ...FULL_DETAIL, lives: 0 });
    const c = repairCoefficients({ sessioni: 2, dialoghi: -1, trame: '0,5', revisioni: '25%', modelli: '40', persone: 'tanti', ignoto: 0.1 });
    expect(c).toMatchObject({ sessions: 1, dialogues: 0, plots: 0.5, reviews: 0.25, models: 0.4, people: 1, inhabitants: 1 });
    expect(Object.keys(c).sort()).toEqual([...COEFFICIENT_KEYS].sort());
    expect(repairCoefficients('Low Detail')).toEqual(LOW_DETAIL.coefficients);
    expect(repairCoefficients('low-detail')).toEqual(LOW_DETAIL.coefficients);
    expect(repairCoefficients('chissà')).toEqual({ ...FULL_DETAIL, lives: 0 });
    expect(repairCoefficients('pieno')).toEqual(FULL_DETAIL);
    expect(readConfig({ 'universe.json': JSON.stringify({ ai: { coefficienti: 'low detail' } }) }).config.ai.coefficients).toEqual(LOW_DETAIL.coefficients);
  });

  it('stretch the rhythms, thin the Sculptor and pause between models', () => {
    expect(stretch(12, 1)).toBe(12);
    expect(stretch(12, 0.25)).toBe(48);
    expect(stretch(12, 0)).toBe(Infinity);
    expect([12, 24, 36, 48].filter((n) => onBeat(n, 12, 0.5))).toEqual([24, 48]);
    expect(onBeat(12, 12, 0)).toBe(false);
    expect(sculptPlan(1)).toEqual({ semplici: 2, revisione: true, giudizio: true });
    expect(sculptPlan(0.25)).toEqual({ semplici: 1, revisione: false, giudizio: true });
    expect(sculptPlan(0)).toEqual({ semplici: 1, revisione: false, giudizio: false });
    expect([modelGap(1), modelGap(0.5), modelGap(0)]).toEqual([0, 60, Infinity]);
  });

  it('every call of the census is regulated or said not to be', () => {
    for (const c of CENSUS) {
      if (c.modo === 'non regolabile') expect(c.coefficiente).toBeUndefined();
      else expect(COEFFICIENT_KEYS).toContain(c.coefficiente);
    }
    expect(CENSUS.length).toBe(42);
    expect(new Set(CENSUS.map((c) => c.compito)).size).toBe(42);
  });

  it('an hour of «Low Detail» costs a fraction of the full one', () => {
    const cfg = readConfig(bundledFiles).config.ai;
    const full = hourlyEstimate({ ...cfg, coefficients: FULL_DETAIL });
    const low = hourlyEstimate({ ...cfg, coefficients: LOW_DETAIL.coefficients, sculptors: LOW_DETAIL.sculptors });
    expect(full.dollari).toBeGreaterThan(0);
    expect(low.chiamate).toBeLessThan(full.chiamate * 0.6);
    expect(low.dollari).toBeLessThan(full.dollari * 0.5);
    // What the wanderer asks costs the same.
    const fixed = (h: typeof full) => h.righe.filter((r) => r.modo === 'non regolabile').reduce((s, r) => s + r.chiamate, 0);
    expect(fixed(low)).toBe(fixed(full));
  });

  it('the Sculptor with fewer revisions makes fewer calls', async () => {
    const { k, models } = await bootWith({});
    const run = async (c: number) => {
      models.calls.clear();
      await sculpt(k.council, { id: 'prova-sasso', nome: 'sasso', aspetto: 'un sasso grigio', classe: 'rock' }, k.sculptors(), sculptPlan(c));
      return models.count('model.sculpt', 'model.judge');
    };
    const full = await run(1);
    const low = await run(0);
    expect(full).toBeGreaterThanOrEqual(4);
    expect(low).toBe(1);
  });

  it('with «Low Detail» a walk of the world asks the model less, by what the coefficients say', async () => {
    const full = await bootWith({});
    const low = await bootWith({ coefficienti: 'low detail', scultori: LOW_DETAIL.sculptors });
    expect(low.k.coefficients()).toEqual(LOW_DETAIL.coefficients);
    await walk(full.k, 12);
    await walk(low.k, 12);
    // The places are the same (what the wanderer explores is not regulated)...
    expect(planned(low.k)).toBe(planned(full.k));
    expect(planned(full.k)).toBeGreaterThanOrEqual(36);
    // ...what the world adds by itself is not: sessions every 48 places instead of 12, packs every 40 instead of 10, new kinds every 28 instead of 7.
    expect(full.models.count('council.session')).toBeGreaterThanOrEqual(2);
    const beats = (base: number, c: number) => Array.from({ length: planned(low.k) }, (_, i) => i + 1).filter((n) => onBeat(n, base, c)).length;
    expect(low.models.count('council.session')).toBe(1 + beats(12, LOW_DETAIL.coefficients.sessions));
    expect(full.models.count('content.items')).toBeGreaterThanOrEqual(3);
    expect(low.models.count('content.items')).toBe(beats(10, LOW_DETAIL.coefficients.packs));
    const grown = (m: Counting) => m.count('council.session', 'content.items', 'content.physics', 'content.review', 'content.recipes', 'forge.concept', 'npc.individuate', 'content.define');
    expect(grown(low.models)).toBeLessThan(grown(full.models) * 0.5);
    const all = (m: Counting) => [...m.calls.values()].reduce((s, n) => s + n, 0);
    expect(all(low.models)).toBeLessThan(all(full.models));
  }, 120_000);
});
