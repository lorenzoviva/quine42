// How much of the stable prefix Google's implicit cache served, model by model, in the ledger of a world that played (T496, D68.2a): the
// tokens `cached` over the `prompt` of every task of `world/usage.json`, and over the prefix the lobby's estimate gives that task
// (`CALL_TOKENS`), next to what the estimate takes (`implicitCacheShare`). Without calls; it writes nothing but `--json`.
//
//   npx vite-node lab/scripts/cache-registro.ts -- <universo>… [--da 2026-11-20] [--json f]

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CALL_TOKENS, implicitCacheShare } from '../../src/kernel/coefficients';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const from = opt('--da') ?? '';
const json = opt('--json');
if (!args.length) {
  console.log('uso: cache-registro.ts <universo>… [--da AAAA-MM-GG] [--json f]');
  process.exit(1);
}

interface Row { calls: number; prompt: number; cached: number; estimated: number; prefix: number }
const models: Record<string, Row> = {};
for (const dir of args) {
  const u = JSON.parse(readFileSync(path.join(dir, 'world/usage.json'), 'utf8')) as { days: Record<string, Record<string, Record<string, { calls: number; prompt: number; cached: number }>>> };
  for (const [day, byModel] of Object.entries(u.days ?? {})) {
    if (day < from) continue;
    for (const [model, tasks] of Object.entries(byModel)) {
      // Only Google's models: the subscriptions and Jev have no implicit cache of theirs to measure.
      if (!model.startsWith('gemini-')) continue;
      for (const [task, t] of Object.entries(tasks)) {
        const w = CALL_TOKENS[task];
        if (!w || !t.calls || !t.prompt) continue;
        const r = (models[model] ??= { calls: 0, prompt: 0, cached: 0, estimated: 0, prefix: 0 });
        r.calls += t.calls;
        r.prompt += t.prompt;
        r.cached += t.cached;
        // The share of this task's input served, on the estimate's prompt; over the estimate's prefix below.
        r.estimated += (t.cached / t.prompt) * t.calls * w.prompt;
        r.prefix += t.calls * w.prefix;
      }
    }
  }
}
const out = Object.entries(models).map(([model, r]) => ({
  model,
  calls: r.calls,
  ofInput: Math.round((r.cached / r.prompt) * 1000) / 1000,
  ofPrefix: Math.round((r.estimated / Math.max(1, r.prefix)) * 1000) / 1000,
  estimate: implicitCacheShare(model),
}));
for (const r of out) console.log(`${r.model.padEnd(24)} ${String(r.calls).padStart(5)} chiamate · in cache ${(r.ofInput * 100).toFixed(1)} % dell'ingresso, ${(r.ofPrefix * 100).toFixed(0)} % del prefisso · la stima ${(r.estimate * 100).toFixed(0)} %`);
if (json) writeFileSync(json, JSON.stringify({ universes: args.map((d) => path.basename(d)), from: from || undefined, models: out }, null, 1) + '\n');
