// Where Jev saves us more (T325, lab/banco/jev/casi-d-uso.md): what the Council sends today and how much of it is context, and the trials
// of the use cases (guardrails before the Council, the people's lines reused, the context chosen by Jev). Every call to TypeSafe and to
// Gemini goes to lab/banco/jev/casi-d-uso/consumi.jsonl, the caps summed over that ledger (TypeSafe 0,50 $, Gemini 0,80 $). The keys are
// read here only, from the .env files, never printed nor written anywhere.
//
//   npx vite-node lab/scripts/jev-casi-d-uso.ts -- --offline                         # everything without keys: estimates and fake answers
//   npx vite-node lab/scripts/jev-casi-d-uso.ts -- --contesto [--conta] [--universi neapolis,orichalcum,sidera,valmora]
//   npx vite-node lab/scripts/jev-casi-d-uso.ts -- --gruppi guardia,battute [--modelli jev-1.13.0,gemini-3.1-flash-lite] [--env <.env>]
//   npx vite-node lab/scripts/jev-casi-d-uso.ts -- --scelta [--casi …] [--taglio largo] [--riusa-intero]   # (c): the whole context and Jev's
//   npx vite-node lab/scripts/jev-casi-d-uso.ts -- --rapporto                        # the tables from the ledger and the measures

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const opts = (n: string) => argv.flatMap((a, i) => (a === `--${n}` && argv[i + 1] ? [argv[i + 1]] : []));
const list = (n: string) => (opt(n) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const log = (s: string) => console.log(s);

/** The .env files to read: the ones given, else this checkout's, the main checkout's and every worktree's (a worktree has none of its own). */
export function envFiles(): string[] {
  const given = opts('env');
  if (given.length) return given;
  const out = [path.resolve('.env')];
  try {
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim();
    const root = path.resolve(common, '..');
    out.push(path.join(root, '.env'));
    const wtDir = path.join(root, '.claude', 'worktrees');
    if (fs.existsSync(wtDir)) for (const d of fs.readdirSync(wtDir)) if (fs.existsSync(path.join(wtDir, d, '.env'))) out.push(path.join(wtDir, d, '.env'));
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

const offline = flag('offline');
const geminiKey = () => (offline ? undefined : readKey('GEMINI_API_KEY'));
const typesafeKey = () => (offline ? undefined : readKey('TYPESAFE_KEY'));

if (flag('prepara')) {
  // The case files from their sources: the texts and the lines written for the bench, the requests recorded in the universes.
  for (const what of list('prepara')) {
    if (what === 'guardia') log(`scritto ${(await import('../banco/jev/casi-d-uso/scrivi-guardia')).writeGuardCases()}`);
    else if (what === 'battute') log(`scritto ${(await import('../banco/jev/casi-d-uso/scrivi-battute')).writeReuseCases()}`);
    else if (what === 'scelta') log(`scritto ${await (await import('../banco/jev/casi-d-uso/scelta')).writeChoiceCases(log)}`);
    else throw new Error('--prepara guardia,battute,scelta');
  }
  process.exit(0);
}

if (flag('contesto') || (offline && !flag('solo-prove'))) {
  const { runContext } = await import('../banco/jev/casi-d-uso/misura');
  const key = flag('conta') ? geminiKey() : undefined;
  if (flag('conta') && !key && !offline) throw new Error(`nessuna GEMINI_API_KEY in ${envFiles().join(', ')} (passa --env): countTokens non genera e non costa, ma vuole la chiave`);
  await runContext({ universes: list('universi'), countKey: key, offline, log, out: opt('misure') });
}

if (list('gruppi').length || flag('scelta') || (offline && !flag('solo-contesto'))) {
  const { runTrials } = await import('../banco/jev/casi-d-uso/prove');
  await runTrials({
    groups: offline && !list('gruppi').length ? ['guardia', 'battute', 'scelta'] : flag('scelta') ? [...list('gruppi'), 'scelta'] : list('gruppi'),
    models: list('modelli'),
    cases: list('casi'),
    run: opt('run') ?? `r${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`,
    offline,
    typesafeKey: typesafeKey(),
    geminiKey: geminiKey(),
    caps: { typesafe: Number(opt('tetto-typesafe') ?? 0.5), gemini: Number(opt('tetto-gemini') ?? 0.8) },
    ledger: opt('registro'),
    dry: flag('prova'),
    show: flag('mostra'),
    cut: opt('taglio') === 'largo' ? 'largo' : 'stretto',
    reuseFull: flag('riusa-intero'),
    log,
  });
}

if (flag('rapporto') || offline) {
  const { writeUseReport } = await import('../banco/jev/casi-d-uso/rapporto');
  log(`scritto ${writeUseReport({ offline, ledger: opt('registro'), measures: opt('misure') })}`);
}
