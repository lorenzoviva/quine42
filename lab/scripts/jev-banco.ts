// The Jev bench (T313, lab/banco/jev/README.md): the same typed questions to TypeSafe's Jev and to Gemini 3.1 Flash-Lite, every
// call in lab/banco/jev/consumi.jsonl, the caps summed over the whole ledger. The keys are read here only, from the .env files, never
// printed nor written anywhere.
//
//   npx vite-node lab/scripts/jev-banco.ts -- --offline                                   # fake answers, no key, nothing spent
//   npx vite-node lab/scripts/jev-banco.ts -- --gruppi decisioni --modelli jev-1.13.0,jev-1.14.0,gemini-3.1-flash-lite \
//        --env H:/projects/rune/.claude/worktrees/step8.2A-lab3d/.env --env H:/projects/rune/.env [--varianti base,rovescio]
//   npx vite-node lab/scripts/jev-banco.ts -- --oggi --compiti azione,referente ...        # the game's own prompts on Flash-Lite
//   npx vite-node lab/scripts/jev-banco.ts -- --prepara scultura|vita                     # writes casi/scultura.json, casi/vita.json
//   npx vite-node lab/scripts/jev-banco.ts -- --rapporto                                  # the tables from the ledger → riepilogo.md

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { direct } from './gemini';
import { UsageLog } from '../../src/kernel/ai/usage';
import type { Thinking } from '../../src/kernel/ai/models';
import { Budget, FLASH_LITE, GeminiJudge, JevJudge, LEDGER, loadCases, OfflineJudge, readLedger, reversed, runBench, type Case, type Judge, type LedgerLine } from '../banco/jev/banco';
import { writeReport } from '../banco/jev/rapporto';
import { second, SECOND } from '../banco/jev/domande';

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const opts = (n: string) => argv.flatMap((a, i) => (a === `--${n}` && argv[i + 1] ? [argv[i + 1]] : []));
const list = (n: string) => (opt(n) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const log = (s: string) => console.log(s);

/** The .env files to read: the ones given, else this checkout's and the main checkout's (a worktree has none of its own). */
function envFiles(): string[] {
  const given = opts('env');
  if (given.length) return given;
  const out = [path.resolve('.env')];
  try {
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim();
    out.push(path.join(path.resolve(common), '..', '.env'));
  } catch {
    /* not a repository */
  }
  return out;
}

/** A key from the first .env that has it: only its presence is ever told, never its value. */
function readKey(name: string): string | undefined {
  for (const f of envFiles()) {
    try {
      const v = new RegExp(`^${name}\\s*=\\s*"?([^"\\r\\n]+)"?`, 'm').exec(fs.readFileSync(f, 'utf8'))?.[1]?.trim();
      if (v) return v;
    } catch {
      /* missing file */
    }
  }
  return undefined;
}

if (flag('prepara')) {
  const what = opt('prepara');
  if (what === 'scultura') (await import('../banco/jev/scultura')).prepare(log);
  else if (what === 'vita') (await import('../banco/jev/vita')).prepare(log);
  else throw new Error('--prepara scultura | vita');
  process.exit(0);
}

if (flag('rapporto')) {
  log(`scritto ${writeReport(readLedger())}`);
  process.exit(0);
}

const offline = flag('offline');
// Fake answers never go to the real ledger: what they cost is nothing, and the caps sum the real one.
const ledger = opt('registro') ?? (offline ? path.resolve('lab/out/jev/consumi-offline.jsonl') : LEDGER);
const show = (l: LedgerLine) =>
  flag('mostra') &&
  log(
    `${l.model} ${l.case} [${l.variant}] ${l.ok ? '' : `ERRORE ${l.error} `}${Object.entries(l.answers ?? {})
      .map(([q, a]) => `${q}=${String(a.v)}${a.p !== undefined && typeof a.v !== 'number' ? `(${a.p})` : ''}${l.right?.[q] === undefined ? '' : l.right[q] ? '✓' : '✗'}`)
      .join(' ')} · ${l.input_tokens}+${l.output_tokens}${l.thought_tokens ? `+${l.thought_tokens}` : ''} tok · $${l.usd.toFixed(6)} · ${l.ms} ms`,
  );
const caps = { typesafe: Number(opt('tetto-typesafe') ?? 3), gemini: Number(opt('tetto-gemini') ?? 1) };
const budget = new Budget(caps, readLedger(ledger));
const groups = list('gruppi');
const kinds = list('compiti');
const only = list('casi');
let cases: Case[] = loadCases().filter((c) => (!groups.length || groups.includes(c.group)) && (!kinds.length || kinds.includes(c.kind)) && (!only.length || only.includes(c.id)));
const limit = Number(opt('quanti') ?? 0);
if (limit > 0) cases = cases.slice(0, limit);
const run = opt('run') ?? `r${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`;
log(`casi: ${cases.length} (${[...new Set(cases.map((c) => c.kind))].join(', ')}); spesi finora: typesafe $${budget.get('typesafe').toFixed(4)} su ${caps.typesafe}, gemini $${budget.get('gemini').toFixed(4)} su ${caps.gemini}`);

const models = list('modelli').length ? list('modelli') : ['jev-1.13.0', 'jev-1.14.0', FLASH_LITE];
const typesafeKey = offline ? undefined : readKey('TYPESAFE_KEY');
const geminiKey = offline ? undefined : readKey('GEMINI_API_KEY');
const ledgerSink = new UsageLog();

function judgeOf(label: string): Judge {
  if (offline) return new OfflineJudge(label);
  if (label.startsWith('jev-')) {
    if (!typesafeKey) throw new Error(`nessuna TYPESAFE_KEY in ${envFiles().join(', ')} (passa --env)`);
    return new JevJudge({ key: typesafeKey, model: label });
  }
  if (label.startsWith('gemini-')) {
    if (!geminiKey) throw new Error(`nessuna GEMINI_API_KEY in ${envFiles().join(', ')} (passa --env)`);
    const [model, thinking] = label.split(':') as [string, Thinking | undefined];
    return new GeminiJudge({ model, thinking: thinking ?? 'low', models: () => direct(model, geminiKey, ledgerSink, { thinking: thinking ?? 'low', timeout: 120_000 }) });
  }
  throw new Error(`modello sconosciuto: ${label}`);
}

if (flag('oggi')) {
  if (!offline && !geminiKey) throw new Error('nessuna GEMINI_API_KEY: --oggi chiama Flash-Lite con i prompt del gioco');
  const { runToday } = await import('../banco/jev/oggi');
  await runToday({ run, cases, ledger, budget, offline, log, models: offline ? undefined : () => direct(FLASH_LITE, geminiKey!, ledgerSink, { thinking: 'low', timeout: 120_000 }), dry: flag('prova') });
} else {
  const variants = list('varianti').length ? list('varianti') : ['base'];
  for (const variant of variants) {
    await runBench({
      run,
      judges: models.map(judgeOf),
      cases: variant === 'domande-2' ? cases.filter((c) => SECOND[c.kind]) : cases,
      variant,
      transform: variant === 'rovescio' ? reversed : variant === 'domande-2' ? second : undefined,
      derive: variant === 'domande-2' ? (c, a) => SECOND[c.kind]?.derive(c, a) ?? {} : undefined,
      ledger,
      budget,
      concurrency: Number(opt('concorrenza') ?? 4),
      dry: flag('prova'),
      log,
      onLine: show,
    });
  }
}
log(`spesi in tutto: typesafe $${budget.get('typesafe').toFixed(4)}, gemini $${budget.get('gemini').toFixed(4)}`);
if (!flag('prova') && !offline) log(`scritto ${writeReport(readLedger(ledger))}`);
