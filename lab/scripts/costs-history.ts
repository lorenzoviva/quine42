// What the lab's runs with Gemini cost, from what they recorded (summary.json and the meter lines in the
// logs), with the prices of lab/mj3d/prices.ts. Prints a markdown table for the report.
// npx vite-node lab/scripts/costs-history.ts -- <lab/out folder> [<another>]
//
// Where something was not recorded the table says what was assumed:
// - steps 8A-8B did not count reasoning: "min" assumes none, "stima" assumes 2.96× the answer (the ratio
//   measured in step 8C, gemini-3.5-flash with the default reasoning: 45,369 / 15,347);
// - gemini-3.5-flash has no published price: "min" uses gemini-3-flash-preview's, "stima" gemini-3.6-flash's.

import fs from 'node:fs';
import path from 'node:path';
import { costOf, priceOf } from '../mj3d/prices';

interface Run {
  run: string;
  step: string;
  model: string;
  calls: number;
  prompt: number;
  cached: number;
  output: number;
  /** undefined: not recorded. */
  thoughts?: number;
}

const THINK_RATIO = 45369 / 15347;
const STEP: Array<[RegExp, string]> = [
  [/^s[123]-|^g1-/, '8A'],
  [/^b-/, '8B'],
  [/^c-/, '8C'],
  [/^g8e/, '8E'],
  [/^mjx-/, '8.2A'],
];
const MODEL: Array<[RegExp, string]> = [
  [/flash-lite|^g1-/, 'gemini-3.1-flash-lite'],
  [/flash38|38-flash/, 'gemini-3.8-flash'],
  [/flash35|^g8e/, 'gemini-3.5-flash'],
];

/** The last meter line of a log: "N chiamate · input P token (di cui in cache C) · risposta O · ragionamento T". */
function meterLines(text: string): Array<{ calls: number; prompt: number; cached: number; output: number; thoughts: number; who?: string }> {
  const out = [];
  for (const m of text.matchAll(/(?:(scultore|Artista):\s*)?(\d+) chiamate · input (\d+) token \(di cui in cache (\d+)\) · risposta (\d+) · ragionamento (\d+)/g))
    out.push({ who: m[1], calls: +m[2], prompt: +m[3], cached: +m[4], output: +m[5], thoughts: +m[6] });
  return out;
}

const runs: Run[] = [];
for (const root of process.argv.slice(2).filter((a) => a !== '--')) {
  for (const d of fs.readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const name = d.name;
    const step = STEP.find(([re]) => re.test(name))?.[1];
    if (!step || /offline|^mjx-official$/.test(name)) continue;
    const log = path.join(root, `${name}.log`);
    const sumFile = path.join(root, name, 'summary.json');
    const summary = fs.existsSync(sumFile) ? JSON.parse(fs.readFileSync(sumFile, 'utf8')) : undefined;
    // Step 8.2A: the sculptor and the judge have their own meters in summary.json.
    if (summary?.sculptor) {
      for (const [who, m, model] of [['scultore', summary.sculptor, summary.model], ['Artista', summary.judgeUsage, summary.judge]] as const)
        runs.push({ run: `${name} (${who})`, step, model, calls: m.calls, prompt: m.prompt, cached: m.cached, output: m.output, thoughts: m.thoughts });
      continue;
    }
    const model = summary?.models ?? summary?.model ?? MODEL.find(([re]) => re.test(name))?.[1] ?? '?';
    const lines = fs.existsSync(log) ? meterLines(fs.readFileSync(log, 'utf8')) : [];
    const last = lines.at(-1);
    if (last) runs.push({ run: name, step, model, ...last });
    else if (summary?.usage?.text) runs.push({ run: name, step, model, calls: summary.usage.text, prompt: summary.usage.inputTokens, cached: 0, output: summary.usage.outputTokens });
    else runs.push({ run: name, step, model, calls: NaN, prompt: NaN, cached: 0, output: NaN });
  }
}

const proxy = (model: string, high: boolean) => (model === 'gemini-3.5-flash' ? (high ? 'gemini-3.6-flash' : 'gemini-3-flash-preview') : model);
const fmt = (v: number) => (Number.isFinite(v) ? v.toLocaleString('it-IT') : '—');
const money = (v: number | undefined) => (v === undefined || !Number.isFinite(v) ? '—' : `$${v.toFixed(3)}`);
console.log('| run | step | modello | chiamate | input (di cui in cache) | risposta | ragionamento | costo min | costo stima |');
console.log('|---|---|---|---|---|---|---|---|---|');
const tot = { min: 0, max: 0, calls: 0 };
const byStep: Record<string, { min: number; max: number; calls: number }> = {};
for (const r of runs.sort((a, b) => a.step.localeCompare(b.step) || a.run.localeCompare(b.run))) {
  const known = r.thoughts !== undefined;
  const min = costOf(proxy(r.model, false), { prompt: r.prompt, cached: r.cached, output: r.output, thoughts: r.thoughts ?? 0 });
  const max = costOf(proxy(r.model, true), { prompt: r.prompt, cached: r.cached, output: r.output, thoughts: r.thoughts ?? r.output * THINK_RATIO });
  console.log(`| ${r.run} | ${r.step} | ${r.model} | ${fmt(r.calls)} | ${fmt(r.prompt)} (${fmt(r.cached)}) | ${fmt(r.output)} | ${known ? fmt(r.thoughts!) : 'non contato'} | ${money(min)} | ${money(max)} |`);
  if (Number.isFinite(min) && Number.isFinite(max)) {
    const s = (byStep[r.step] ??= { min: 0, max: 0, calls: 0 });
    s.min += min!;
    s.max += max!;
    s.calls += r.calls;
    tot.min += min!;
    tot.max += max!;
    tot.calls += r.calls;
  }
}
console.log('');
for (const [step, s] of Object.entries(byStep)) console.log(`- step ${step}: ${s.calls} chiamate, ${money(s.min)} – ${money(s.max)}`);
console.log(`- totale registrato: ${tot.calls} chiamate, ${money(tot.min)} – ${money(tot.max)}`);
console.log(`\nPrezzi usati (USD per milione: input / output / cache): ${['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-3.6-flash'].map((m) => `${m} ${priceOf(m)!.input} / ${priceOf(m)!.output} / ${priceOf(m)!.cached}`).join('; ')}`);
