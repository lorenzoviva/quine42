// The paid proof of the queue on Anthropic's API credits (T542, ADR-0262): one small request of the Sculptor (Opus 5.5, effort low) in a
// queue of its own in a temporary folder, served once by `serve` with `--api`, the key read from the `.env` (never printed); then the
// ledger of that queue, to set beside the cost the console of Anthropic says for the same minute. Nothing of the real queue is touched.
//
//   npx vite-node lab/scripts/coda-api-prova.ts -- [--env <file .env>] [--tetto 0.5]
//
// It costs: a few cents at the list (the ceiling stops it before a second request, there is none).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { enqueue, look } from '../../server/subscriptionQueue';
import { apiSettings, readLedger } from '../../tools/abbonamenti/api';
import { serve } from '../../tools/abbonamenti/servi';

const argv = process.argv.slice(2);
const opt = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
const cap = Number(opt('--tetto') ?? 0.5);

const api = apiSettings({ api: true, cap, envFile: opt('--env') });
if (!api || typeof api === 'string') {
  console.error(String(api));
  process.exit(1);
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coda-prova-api-'));
try {
  const id = await enqueue(dir, {
    provider: 'claude',
    agent: 'sculptor',
    task: 'model.sculpt',
    system: 'You write tiny MarkovJunior programs. Answer with the XML only.',
    prompt: 'Write a MarkovJunior program for a 5x5x5 stone block: one <sequence> with values="BS".',
    model: 'claude-opus-5-5',
    effort: 'low',
  });
  const t0 = new Date();
  await serve({ provider: 'claude', dir, pollMs: 100, beatMs: 10_000, once: true, timeoutMs: 5 * 60_000, api }).catch((e) => console.error(`[prova] ${(e as Error).message}`));
  const a = await look(dir, id);
  console.log(`[prova] richiesta ${a.stato}${a.errore ? `: ${a.errore}` : ''}`);
  if (a.text) console.log(a.text.slice(0, 400));
  const l = readLedger(dir);
  console.log(JSON.stringify({ dal: t0.toISOString(), al: new Date().toISOString(), mesi: l.mesi, ultime: l.ultime }, null, 1));
  const files = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  console.log(`[prova] la chiave nei file della coda: ${files.includes(api.key) ? 'SÌ (da non succedere)' : 'no'}`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
