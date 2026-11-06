// T325, point 2: the trials. (a) `guardia` and (b) `battute` are typed questions with right answers, asked to Jev and to Flash-Lite with the
// bench of T313 (banco.ts: the same questions, the ledger, the caps); (c) `scelta` asks Gemini the Council's real requests with the whole
// context and with the context Jev chose (scelta.ts). Every call goes to this folder's ledger, `consumi.jsonl`: the caps of T325 are summed
// over it alone (TypeSafe 0,50 $, Gemini 0,80 $), not over T313's.

import fs from 'node:fs';
import path from 'node:path';
import { Budget, FLASH_LITE, GeminiJudge, JevJudge, OfflineJudge, readLedger, runBench, type Case, type CaseFile, type Judge, type LedgerLine } from '../banco';
import { direct } from '../../../scripts/gemini';
import { UsageLog } from '../../../../src/kernel/ai/usage';
import { withUseQuestions } from './domande';
import { USE_DIR } from './misura';

export const USE_LEDGER = path.join(USE_DIR, 'consumi.jsonl');
export const USE_CASES = path.join(USE_DIR, 'casi');

export function loadUseCases(dir = USE_CASES): Case[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as CaseFile)
    // The typed cases only (guardia.json, battute.json): scelta.json holds requests, not questions.
    .filter((file) => file.group === ('guardia' as never) || file.group === ('battute' as never))
    .flatMap((file) => file.cases.map(withUseQuestions));
}

export interface TrialOptions {
  groups: string[];
  models: string[];
  cases: string[];
  run: string;
  offline: boolean;
  typesafeKey?: string;
  geminiKey?: string;
  caps: { typesafe: number; gemini: number };
  ledger?: string;
  dry?: boolean;
  show?: boolean;
  log: (s: string) => void;
  /** Another fetch (the test). */
  fetchImpl?: typeof fetch;
  /** (c): how much Jev's choice keeps, and whether the whole requests are taken from an earlier run. */
  cut?: 'stretto' | 'largo';
  reuseFull?: boolean;
  /** (c): where its results go. */
  results?: string;
}

export function judgeFor(label: string, o: Pick<TrialOptions, 'offline' | 'typesafeKey' | 'geminiKey' | 'fetchImpl'>, sink = new UsageLog()): Judge {
  if (o.offline) return new OfflineJudge(label);
  if (label.startsWith('jev-')) {
    if (!o.typesafeKey) throw new Error('nessuna TYPESAFE_KEY (passa --env)');
    return new JevJudge({ key: o.typesafeKey, model: label, fetchImpl: o.fetchImpl });
  }
  if (!o.geminiKey) throw new Error('nessuna GEMINI_API_KEY (passa --env)');
  return new GeminiJudge({ model: label, thinking: 'low', models: () => direct(label, o.geminiKey!, sink, { thinking: 'low', timeout: 120_000 }) });
}

export async function runTrials(o: TrialOptions): Promise<LedgerLine[]> {
  // Fake answers never go to the real ledger: what they cost is nothing, and the caps sum the real one.
  const ledger = o.ledger ?? (o.offline ? path.resolve('lab/out/jev/casi-d-uso-offline.jsonl') : USE_LEDGER);
  const budget = new Budget(o.caps, readLedger(ledger));
  o.log(`spesi finora (registro di T325): typesafe $${budget.get('typesafe').toFixed(4)} su ${o.caps.typesafe}, gemini $${budget.get('gemini').toFixed(4)} su ${o.caps.gemini}`);
  const out: LedgerLine[] = [];
  const typed = o.groups.filter((g) => g === 'guardia' || g === 'battute');
  if (typed.length) {
    const cases = loadUseCases().filter((c) => (typed as string[]).includes(c.group) && (!o.cases.length || o.cases.includes(c.id)));
    const models = o.models.length ? o.models : ['jev-1.13.0', 'jev-1.14.0', FLASH_LITE];
    out.push(
      ...(await runBench({
        run: o.run,
        judges: models.map((m) => judgeFor(m, o)),
        cases,
        variant: 'base',
        ledger,
        budget,
        concurrency: 4,
        dry: o.dry,
        log: o.log,
        onLine: (l) => o.show && o.log(`${l.model} ${l.case} ${l.ok ? Object.entries(l.answers ?? {}).map(([q, a]) => `${q}=${String(a.v)}${a.p !== undefined ? `(${a.p})` : ''}${l.right?.[q] === undefined ? '' : l.right[q] ? '✓' : '✗'}`).join(' ') : `ERRORE ${l.error}`}`),
      })),
    );
  }
  if (o.groups.includes('scelta')) {
    const { runChoice } = await import('./scelta');
    out.push(...(await runChoice({ ...o, ledger, budget })));
  }
  o.log(`spesi in tutto (registro di T325): typesafe $${budget.get('typesafe').toFixed(4)}, gemini $${budget.get('gemini').toFixed(4)}`);
  return out;
}
