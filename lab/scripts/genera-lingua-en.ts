// Translates the 244 cases (group 1 + mestiere) into English using Gemini 3.1 Flash-Lite,
// saving the canonical translations to lab/banco/jev/casi/lingua-en.json.
// Also measures the exact token usage, dollar cost and latency of translating with Flash-Lite.

import fs from 'node:fs';
import path from 'node:path';
import { direct, readKey } from './gemini';
import { UsageLog } from '../../src/kernel/ai/usage';
import { loadCases } from '../banco/jev/banco';
import { costOf } from '../../src/kernel/ai/prices';

const root = path.resolve('.');
const envRoot = 'H:/projects/rune';
const key = readKey(envRoot);
const usage = new UsageLog();
const model = direct('gemini-3.1-flash-lite', key, usage, { thinking: 'low', max: 500 });

const targetKinds = ['azione', 'referente', 'modello', 'combinazione', 'fabbricazione', 'quarta-parete', 'mestiere'];
const cases = loadCases().filter((c) => targetKinds.includes(c.kind));
console.log(`Casi da tradurre: ${cases.length}`);

interface TranslationResult {
  state: any;
  expected?: any;
}

const out: Record<string, TranslationResult> = {};
const outFile = path.join(root, 'lab/banco/jev/lingua-en.json');
if (fs.existsSync(outFile)) {
  try {
    Object.assign(out, JSON.parse(fs.readFileSync(outFile, 'utf8')));
  } catch {}
}

const missing = cases.filter((c) => !out[c.id]);
console.log(`Casi mancanti: ${missing.length}`);

let totalInputTokens = 0;
let totalOutputTokens = 0;
let totalThoughtsTokens = 0;
let totalMs = 0;
const latencies: number[] = [];

async function translateCase(c: typeof cases[0]): Promise<void> {
  const t0 = Date.now();
  let prompt = '';
  if (c.kind === 'azione') {
    prompt = `Translate this video game free action state from Italian to natural English.
Preserve exact JSON types and structure. Translate player_writes, target (name, description, under_target, place), carrying items, and holding.
If expected.requires has an item name, translate it to exactly match the translated item in carrying. Keep 'none' as 'none'.
Input:
${JSON.stringify({ state: c.state, expected: { requires: c.expected.requires } }, null, 2)}`;
  } else if (c.kind === 'referente') {
    prompt = `Translate this Council liaison request from Italian to natural English.
Preserve exact JSON structure. Translate request and history if present.
Input:
${JSON.stringify({ state: c.state }, null, 2)}`;
  } else if (c.kind === 'modello') {
    prompt = `Translate this 3D model lookup case from Italian to natural English.
Translate thing.name and thing.description. Keep library as is.
Input:
${JSON.stringify({ state: c.state }, null, 2)}`;
  } else if (c.kind === 'combinazione') {
    prompt = `Translate this crafting combination case from Italian to natural English.
Translate items a and b (name and description). If known_items is an array of names, translate them.
If expected.result contains an item name, translate it to match known_items. Keep 'nessuno' as 'nessuno'.
Input:
${JSON.stringify({ state: c.state, expected: { result: c.expected.result } }, null, 2)}`;
  } else if (c.kind === 'fabbricazione') {
    prompt = `Translate this crafting case from Italian to natural English.
Translate wants_to_make, carrying items. If known_items is an array of names, translate them.
If expected.result contains an item name, translate it to match known_items. Keep 'nuovo' as 'nuovo'.
Input:
${JSON.stringify({ state: c.state, expected: { result: c.expected.result } }, null, 2)}`;
  } else if (c.kind === 'quarta-parete') {
    prompt = `Translate this fourth-wall evaluation text from Italian to natural English.
Preserve the exact tone, mystery, lore or fourth-wall breaking aspects.
Input:
${JSON.stringify({ state: c.state }, null, 2)}`;
  } else if (c.kind === 'mestiere') {
    prompt = `Translate this NPC trade matching case from Italian to natural English.
Translate trade name. In programs, translate the synonym names in each program's nomi array to English.
Input:
${JSON.stringify({ state: c.state }, null, 2)}`;
  }

  const sys = 'You are a precise video game localization translator. Return a JSON object with { "state": ..., "expected": ... (if expected was in input) }. Output JSON only.';
  let callRecord: any;
  const originalOnCall = (model as any).onCall;
  (model as any).onCall = (r: any) => {
    callRecord = r;
    originalOnCall?.(r);
  };

  const res = await model.text({
    agent: 'banco',
    task: `traduzione.${c.kind}`,
    system: sys,
    prompt,
    temperature: 0.1,
  });

  const ms = Date.now() - t0;
  latencies.push(ms);
  totalMs += ms;
  if (callRecord) {
    totalInputTokens += callRecord.prompt ?? 0;
    totalOutputTokens += callRecord.output ?? 0;
    totalThoughtsTokens += callRecord.thoughts ?? 0;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(res.replace(/^```(?:json)?\s*|```\s*$/g, '').trim());
  } catch (e) {
    console.error(`Errore parse per ${c.id}:`, res);
    throw e;
  }

  out[c.id] = {
    state: parsed.state ?? parsed,
    ...(parsed.expected ? { expected: parsed.expected } : {}),
  };
}

async function main() {
  const concurrency = 6;
  let idx = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < missing.length) {
      const c = missing[idx++];
      try {
        await translateCase(c);
        if (idx % 20 === 0 || idx === missing.length) {
          console.log(`Avanzamento: ${idx}/${missing.length} (${c.id})`);
          fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
        }
      } catch (e) {
        console.error(`Fallito ${c.id}:`, e);
      }
    }
  });

  await Promise.all(workers);
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`Completato. Tradotti ${Object.keys(out).length} casi.`);

  const usd = costOf('gemini-3.1-flash-lite', {
    prompt: totalInputTokens,
    cached: 0,
    output: totalOutputTokens,
    thoughts: totalThoughtsTokens,
  }) ?? 0;

  latencies.sort((a, b) => a - b);
  const medianMs = latencies[Math.floor(latencies.length / 2)] ?? 0;

  console.log('\n--- METRICHE DI TRADUZIONE CON FLASH-LITE ---');
  console.log(`Casi tradotti in questa esecuzione: ${missing.length}`);
  console.log(`Token input: ${totalInputTokens}`);
  console.log(`Token output: ${totalOutputTokens}`);
  console.log(`Token ragionamento: ${totalThoughtsTokens}`);
  console.log(`Spesa totale traduzione: $${usd.toFixed(6)}`);
  if (missing.length > 0) {
    console.log(`Costo per 1000 traduzioni: $${((usd * 1000) / missing.length).toFixed(4)}`);
    console.log(`Token medi input a traduzione: ${Math.round(totalInputTokens / missing.length)}`);
    console.log(`Token medi output a traduzione: ${Math.round(totalOutputTokens / missing.length)}`);
    console.log(`Latenza mediana traduzione: ${medianMs} ms`);
  }
}

main().catch(console.error);
