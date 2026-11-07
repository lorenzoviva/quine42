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
//
// With images (T324, lab/banco/jev/README.md «Le immagini»):
//   npx vite-node lab/scripts/jev-banco.ts -- --prepara immagini                          # the photographs (lab/out/jev/foto) and casi/immagini.json
//   npx vite-node lab/scripts/jev-banco.ts -- --gruppi immagini --varianti lati4,griglia --run img-1 \
//        --tetti-giri img,prova-immagini --tetto-typesafe 0.5 --tetto-gemini 0.5      # a form of the photographs is a variant
//   npx vite-node lab/scripts/jev-banco.ts -- --gruppi immagini --oggi-artista --run img-oggi …  # the game's Artist (gemini-3.5-flash)

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { direct } from './gemini';
import { UsageLog } from '../../src/kernel/ai/usage';
import type { Thinking } from '../../src/kernel/ai/models';
import { Budget, FLASH_LITE, GeminiJudge, JevJudge, LEDGER, loadCases, OfflineJudge, readLedger, reversed, runBench, type Case, type Judge, type LedgerLine } from '../banco/jev/banco';
import { writeReport } from '../banco/jev/rapporto';
import { second, SECOND } from '../banco/jev/domande';
import { toItalian, toEnglish, toFreeTextEnglish } from '../banco/jev/lingua';

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
    const root = path.resolve(common, '..');
    out.push(path.join(root, '.env'));
    const wtDir = path.join(root, '.claude', 'worktrees');
    if (fs.existsSync(wtDir)) {
      for (const d of fs.readdirSync(wtDir)) {
        const e = path.join(wtDir, d, '.env');
        if (fs.existsSync(e)) out.push(e);
      }
    }
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
  else if (what === 'immagini') (await import('../banco/jev/immagini')).prepare(log);
  else throw new Error('--prepara scultura | vita | immagini');
  process.exit(0);
}

if (flag('rapporto')) {
  log(`scritto ${writeReport(readLedger())}`);
  log(`scritto ${(await import('../banco/jev/rapporto-immagini')).writeImageReport(readLedger())}`);
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
// `--tetti-giri img,prova-immagini`: the caps of a task of its own (T324) sum only its runs, not the whole ledger.
const capRuns = list('tetti-giri');
const budget = new Budget(caps, readLedger(ledger).filter((l) => !capRuns.length || capRuns.some((r) => l.run.startsWith(r))));
const groups = list('gruppi');
const kinds = list('compiti');
const only = list('casi');
// The cases with images (T324) only when asked by their group: they want their photographs on the disk.
const IMAGE_CASES = path.resolve('lab/banco/jev/casi-immagini');
let cases: Case[] = [...loadCases(), ...(list('gruppi').includes('immagini') ? loadCases(IMAGE_CASES) : [])].filter((c) => (!groups.length || groups.includes(c.group)) && (!kinds.length || kinds.includes(c.kind)) && (!only.length || only.includes(c.id)));
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

/** The variants that are a form of the photographs (T324): a run of one asks only the cases cut that way. */
const IMAGE_VARIANTS = ['lati4', 'lato1', 'griglia', 'separate', 'nomi8', 'foto8', 'foto50'];
const variantCases = (variant: string) =>
  IMAGE_VARIANTS.includes(variant) ? cases.filter((c) => c.form === variant) : variant === 'domande-2' ? cases.filter((c) => SECOND[c.kind]) : cases.filter((c) => !c.form);

// The photographs are generated, not committed: a case that needs them and does not find them has them made first (the same pictures).
if (cases.some((c) => c.images)) {
  const { photosReady } = await import('../banco/jev/immagini');
  if (!photosReady(cases)) {
    log('foto mancanti in lab/out/jev/foto: le preparo (--prepara immagini)');
    (await import('../banco/jev/immagini')).prepare(log);
  }
}

if (flag('oggi-artista')) {
  // The Artist of the game (sculptor.ts → judge: its prompt, its photograph, its model) on the rubric cases in the game's own photograph.
  const artist = opt('artista') ?? 'gemini-3.5-flash';
  if (!offline && !geminiKey) throw new Error("nessuna GEMINI_API_KEY: --oggi-artista chiama l'Artista del gioco");
  const { runArtistToday } = await import('../banco/jev/artista-oggi');
  await runArtistToday({ run, cases: cases.filter((c) => c.kind === 'artista' && c.form === 'lati4'), ledger, budget, offline, log, model: artist, models: offline ? undefined : () => direct(artist, geminiKey!, ledgerSink, { thinking: 'low', timeout: 120_000 }), dry: flag('prova') });
} else if (flag('oggi')) {
  if (!offline && !geminiKey) throw new Error('nessuna GEMINI_API_KEY: --oggi chiama Flash-Lite con i prompt del gioco');
  const { runToday } = await import('../banco/jev/oggi');
  await runToday({ run, cases, ledger, budget, offline, log, models: offline ? undefined : () => direct(FLASH_LITE, geminiKey!, ledgerSink, { thinking: 'low', timeout: 120_000 }), dry: flag('prova') });
} else {
  const variants = list('varianti').length ? list('varianti') : ['base'];
  for (const variant of variants) {
    await runBench({
      run,
      judges: models.map(judgeOf),
      cases: variantCases(variant),
      variant,
      transform:
        variant === 'rovescio'
          ? reversed
          : variant === 'domande-2'
          ? second
          : variant === 'italiano' || variant === 'tutto-italiano'
          ? toItalian
          : variant === 'inglese' || variant === 'tutto-inglese'
          ? toEnglish
          : variant === 'testo-libero-en'
          ? toFreeTextEnglish
          : undefined,
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
if (!flag('prova') && !offline) {
  log(`scritto ${writeReport(readLedger(ledger))}`);
  log(`scritto ${(await import('../banco/jev/rapporto-immagini')).writeImageReport(readLedger(ledger))}`);
}
