// How much `model.reuse` saves (T349, ADR-0157 §4.1): an offline Genesis, and the models its world asks for until none is missing, three
// times: with today's rule (every model sculpted), with a Jev that always finds one (the upper bound) and with the bench's rate. No browser,
// no model is called: the local models answer the Council, a fake Jev the decisions.
//
//   npx vite-node lab/scripts/riuso-modelli.ts [-- --tema "un regno di pastori"] [--luoghi 8] [--scrivi lab/banco/jev/riuso.md]
//
// It says: how many models the world asked for, how many were asked to Jev (a class that may wear one of the library, with one to wear),
// the calls of the Sculptor and the Artist with and without, the tokens of a question; and the dollars, on the prices of today.

import fs from 'node:fs';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import type { TextCall } from '../../src/kernel/ai/models';
import { costOf } from '../../src/kernel/ai/prices';
import { JEV_MODEL, jevBody, type DecisionCall, type DecisionModels } from '../../src/kernel/ai/decisions';
import { DEFAULT_SCULPTORS } from '../../src/kernel/agents/sculptor';
import { REUSE_ASKED, REUSE_HIT } from '../../src/kernel/coefficients';
import { REUSE_NEW } from '../../src/kernel/modeldirector';
import { spiral } from '../../src/kernel/deferred';

const arg = (name: string, d?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const theme = arg('tema', 'un regno di pastori')!;
const out = arg('scrivi');
const places = Number(arg('luoghi', '8'));

/** The local models, counting the calls of every task; named as if they were online, so the directors work. */
class Counting extends MockAiModels {
  calls: TextCall[] = [];
  constructor() {
    super();
    Object.defineProperty(this, 'name', { value: 'misura' });
  }
  async text(call: TextCall): Promise<string> {
    this.calls.push(call);
    return super.text(call);
  }
  count(...tasks: string[]): number {
    return this.calls.filter((c) => tasks.includes(c.task)).length;
  }
}

/** A Jev that answers every question the same way, and keeps what it was asked. */
class FakeJev implements DecisionModels {
  readonly name = 'jev-finto';
  asked: Array<{ thing: string; cls: string; options: number; bytes: number }> = [];
  constructor(private fits: (n: number) => boolean) {}
  async decide(c: DecisionCall) {
    const criteria = (c.questions.model as { criteria: Record<string, string> }).criteria;
    const ids = Object.keys(criteria).filter((x) => x !== REUSE_NEW);
    const body = JSON.stringify(jevBody(c, JEV_MODEL));
    this.asked.push({ thing: (c.state as any).thing.name, cls: /\[(\w+)\]$/.exec(criteria[ids[0]])?.[1] ?? '?', options: ids.length, bytes: body.length });
    return this.fits(this.asked.length) ? { model: ids[0], fits: true } : { model: REUSE_NEW, fits: false };
  }
}

const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run(decisions?: FakeJev) {
  const ai = new Counting();
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai, ...(decisions ? { decisions } : {}) });
  if (!(await k.runGenesis(theme))) throw new Error('la Genesi non è riuscita');
  // The places of the first hour, planned as the deferred generation does (ADR-0143): their new things ask for models too.
  for (const [cx, cy] of spiral(places)) await k.planAhead(cx, cy);
  const asked = new Set<string>();
  for (let i = 0; i < 600 && k.sculpting.missing().length; i++) {
    for (const r of k.sculpting.missing()) asked.add(r.id);
    k.sculpting.pump();
    await settle(2);
  }
  await settle(30);
  return { k, ai, requests: asked.size, sculpt: ai.count('model.sculpt'), judge: ai.count('model.judge'), reused: k.sculpting.reusedCount };
}

// What a sculpture and a judgement usually weigh (coefficients.ts → hourlyEstimate): on the default models, half simple, half figures.
const W = { prompt: 7000, cached: 2500, output: 3000 };
const sculptCall = 0.5 * (costOf(DEFAULT_SCULPTORS.simple, W) ?? 0) + 0.5 * (costOf(DEFAULT_SCULPTORS.figure, W) ?? 0);
const judgeCall = costOf(DEFAULT_SCULPTORS.artist, { prompt: 3800, cached: 0, output: 300 }) ?? 0;

const rule = await run();
const alwaysJev = new FakeJev(() => true);
const always = await run(alwaysJev);
const neverJev = new FakeJev(() => false);
const never = await run(neverJev);
// The rate of the estimate on what is asked: REUSE_HIT of the questions find a model (deterministic: the n-th when the share crosses a whole).
const benchJev = new FakeJev((n) => Math.floor(n * REUSE_HIT) > Math.floor((n - 1) * REUSE_HIT));
const bench = await run(benchJev);

const tokens = (bytes: number) => Math.round(bytes / 3.4);
const avgBytes = neverJev.asked.reduce((s, a) => s + a.bytes, 0) / Math.max(1, neverJev.asked.length);
const byClass: Record<string, number> = {};
for (const a of neverJev.asked) byClass[a.cls] = (byClass[a.cls] ?? 0) + 1;
const usd = (n: number) => `${n.toFixed(4)} $`;
const cost = (r: typeof rule) => r.sculpt * sculptCall + r.judge * judgeCall;
const jevCost = (n: number) => n * (costOf(JEV_MODEL, { prompt: tokens(avgBytes), cached: 0, output: 0 }) ?? 0);
const share = neverJev.asked.length / Math.max(1, never.requests);

const lines = [
  `# Il riuso dei modelli su una Genesi offline (T349)`,
  ``,
  `Generato da \`npx vite-node lab/scripts/riuso-modelli.ts\` (tema «${theme}», la Genesi e ${places} luoghi, modelli locali, un Jev finto). I dollari sono le chiamate`,
  `contate per i prezzi di oggi, con i pesi della stima della lobby: una scultura ${usd(sculptCall)}, un giudizio ${usd(judgeCall)}.`,
  ``,
  `| variante | modelli chiesti | domande a Jev | riusati | \`model.sculpt\` | \`model.judge\` | Scultore e Artista | Jev |`,
  `|---|---|---|---|---|---|---|---|`,
  `| regola di oggi (senza chiave) | ${rule.requests} | 0 | 0 | ${rule.sculpt} | ${rule.judge} | ${usd(cost(rule))} | — |`,
  `| Jev dice sempre «nessuno» | ${never.requests} | ${neverJev.asked.length} | 0 | ${never.sculpt} | ${never.judge} | ${usd(cost(never))} | ${usd(jevCost(neverJev.asked.length))} |`,
  `| Jev riusa il ${Math.round(REUSE_HIT * 100)} % delle domande (\`REUSE_HIT\`) | ${bench.requests} | ${benchJev.asked.length} | ${bench.reused} | ${bench.sculpt} | ${bench.judge} | ${usd(cost(bench))} | ${usd(jevCost(benchJev.asked.length))} |`,
  `| Jev riusa sempre (il tetto) | ${always.requests} | ${alwaysJev.asked.length} | ${always.reused} | ${always.sculpt} | ${always.judge} | ${usd(cost(always))} | ${usd(jevCost(alwaysJev.asked.length))} |`,
  ``,
  `- **Chiesti a Jev**: ${neverJev.asked.length} modelli su ${never.requests} (${Math.round(share * 100)} %; \`REUSE_ASKED\` nella stima è ${REUSE_ASKED}), per classe: ${Object.entries(byClass).map(([c, n]) => `${c} ${n}`).join(', ')}.`,
  `  Le persone, gli animali, le bestie e gli oggetti non si chiedono (D45.2).`,
  `- **Una domanda** pesa in media ${Math.round(avgBytes)} byte, circa ${tokens(avgBytes)} token: ${jevCost(1).toFixed(6)} $ a domanda.`,
  `- **Il risparmio** con il tasso del banco: ${usd(cost(rule) - cost(bench) - jevCost(benchJev.asked.length))} su ${usd(cost(rule))} (${Math.round((1 - (cost(bench) + jevCost(benchJev.asked.length)) / Math.max(1e-9, cost(rule))) * 100)} %); il tetto: ${usd(cost(rule) - cost(always) - jevCost(alwaysJev.asked.length))}.`,
  ``,
];
console.log(lines.join('\n'));
if (out) fs.writeFileSync(out, lines.join('\n'));
process.exit(0);
