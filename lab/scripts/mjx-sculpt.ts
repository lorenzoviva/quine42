// Step 8.2A: the sculptor writes MarkovJunior XML for whole models; one model under test, one fixed
// judge (the Artist), so that two sculptors can be compared on the same targets.
//
//   npx vite-node lab/scripts/mjx-sculpt.ts -- --model gemini-3.1-flash-lite [--judge gemini-3.5-flash]
//        [--set confronto|semplici|strutture|figure] [--only "Pino,Gatto"] [--improve 1] [--retries 2]
//        [--thinking low] [--root H:/projects/rune] [--run nome]
//
// --root is where .env and universes/ are (a git worktree has neither). The key is read from .env and
// sent only to Google; it is never printed.

import fs from 'node:fs';
import path from 'node:path';
import { tallyLine, UsageLedger } from '../../src/kernel/ai/usage';
import { direct, readKey } from './gemini';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import { contactSheet, review, type Critique, type Target } from '../mjx/target';
import { PRESETS, styleOf } from '../mjx/targets';
import { sculptMjx, type MjxSculpture } from '../mjx/sculptor';
import { runMjx } from '../../src/mj/run';
import { png } from './png';

const argv = process.argv.slice(2);
const opt = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const root = path.resolve(opt('root') ?? (fs.existsSync('.env') ? '.' : '../../..'));
const key = readKey(root);

const thinking = (opt('thinking') ?? 'low') as 'low' | 'medium' | 'high';
const gemini = (model: string, ledger: UsageLedger) => direct(model, key, ledger, { thinking, max: Number(opt('max') ?? 200) });

const model = opt('model') ?? 'gemini-3.1-flash-lite';
const judgeModel = opt('judge') ?? 'gemini-3.5-flash';
const sculptMeter = new UsageLedger();
const judgeMeter = new UsageLedger();
const sculptor = gemini(model, sculptMeter);
const judge = gemini(judgeModel, judgeMeter);

// The universe's style guide, as the previous sessions used it.
const styleFile = path.join(root, 'universes', opt('universe') ?? 'valmora', 'world', 'style.md');
const style = fs.existsSync(styleFile) ? styleOf({ 'world/style.md': fs.readFileSync(styleFile, 'utf8') }) : undefined;

const SETS: Record<string, string[]> = {
  confronto: ['Pino', 'Quercia', 'Betulla', 'Masso muschioso', 'Cespuglio con bacche', 'Barile', 'Pozzo', 'Casetta', 'Viandante', 'Contadina', 'Gatto', 'Lupo'],
};
const set = opt('set') ?? 'confronto';
const names = (opt('only')?.split(',') ?? SETS[set] ?? []).map((s) => s.trim().toLowerCase());
const targets: Target[] = names.length
  ? names.map((n) => PRESETS.find((t) => t.name.toLowerCase() === n)!).filter(Boolean)
  : PRESETS.filter((t) => t.category === ({ semplici: 'semplice', strutture: 'struttura', figure: 'figura' } as const)[set as 'semplici']);

const runName = opt('run') ?? `mjx-${model}`;
const outDir = path.resolve('lab/out', runName);
fs.mkdirSync(outDir, { recursive: true });
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dataUrl = (p: Picture) => `data:image/png;base64,${png(p).toString('base64')}`;
const improve = Number(opt('improve') ?? 1);
const retries = Number(opt('retries') ?? 2);

console.log(`${targets.length} bersagli · scultore ${model} · Artista ${judgeModel} · ragionamento ${thinking} → ${outDir}`);

interface Row {
  target: string;
  calls: number;
  firstTry: boolean;
  valid: boolean;
  errors: string[];
  votes: number[];
  final?: Critique;
}

const lastPicture = new Map<string, Picture>();

/** Four views of seed 1, then three more seeds from the front: what the montage shows. */
function pictures(s: MjxSculpture): Picture {
  const views = [0, 1, 2, 3].map((v) => render(s.result!.grid, s.model!.program.palette, v, DEFAULT_RENDER));
  for (const seed of [2, 3, 4]) views.push(render(runMjx(s.model!, seed).grid, s.model!.program.palette, 0, DEFAULT_RENDER));
  return sheet(views, 3, 4, [112, 150, 84]);
}

const rows: Row[] = await Promise.all(
  targets.map(async (t): Promise<Row> => {
    const base = slug(t.name);
    const votes: number[] = [];
    let final: Critique | undefined;
    let s = await sculptMjx(sculptor, t, { retries, style });
    let calls = s.attempts.length;
    const firstTry = s.attempts.length === 1 && !s.attempts[0].error;
    const errors = s.attempts.map((a) => a.error).filter(Boolean) as string[];
    for (let round = 0; ; round++) {
      const tag = round ? `${base}.v${round + 1}` : base;
      if (s.xml) fs.writeFileSync(path.join(outDir, `${tag}.xml`), s.xml + '\n');
      fs.writeFileSync(path.join(outDir, `${tag}.tentativi.json`), JSON.stringify(s.attempts.map((a) => ({ error: a.error, analysis: a.analysis && { voxels: a.analysis.voxels, errors: a.analysis.errors, warnings: a.analysis.warnings } })), null, 2));
      if (!s.result || !s.model || s.attempts.at(-1)?.error) break;
      const pic = pictures(s);
      lastPicture.set(t.name, pic);
      fs.writeFileSync(path.join(outDir, `${tag}.png`), png(pic));
      const views = dataUrl(contactSheet(s.result, s.model.program));
      const c = await review(judge, t, views, undefined, style).catch((e) => (console.warn(`${t.name}: revisione fallita: ${e.message}`), undefined));
      if (!c) break;
      votes.push(c.voto);
      final = c;
      fs.writeFileSync(path.join(outDir, `${tag}.review.json`), JSON.stringify(c, null, 2));
      if (round >= improve || c.verdetto === 'approvato') break;
      const next = await sculptMjx(sculptor, t, { retries, style }, { xml: s.xml!, critique: c, views });
      calls += next.attempts.length;
      if (!next.result || next.attempts.at(-1)?.error) break;
      s = next;
    }
    console.log(`${t.name}: ${calls} chiamate${firstTry ? ' (al primo colpo)' : ''}${errors.length ? ` — errori: ${errors.map((e) => e.slice(0, 90)).join(' / ')}` : ''}${votes.length ? ` — Artista: ${votes.join(' → ')}` : ' — NESSUN MODELLO VALIDO'}`);
    return { target: t.name, calls, firstTry, valid: votes.length > 0, errors, votes, final };
  }),
);

// The montage: the last picture of each target, one under the other.
const pics = rows.map((r) => lastPicture.get(r.target)).filter(Boolean) as Picture[];
if (pics.length) {
  const w = Math.max(...pics.map((p) => p.w));
  const h = pics.reduce((a, p) => a + p.h + 6, 6);
  const data = new Uint8ClampedArray(w * h * 4).fill(255);
  let y = 6;
  for (const p of pics) {
    for (let j = 0; j < p.h; j++) data.set(p.data.subarray(j * p.w * 4, (j + 1) * p.w * 4), ((y + j) * w) * 4);
    y += p.h + 6;
  }
  fs.writeFileSync(path.join(outDir, 'montage.png'), png({ w, h, data }));
}

const valid = rows.filter((r) => r.valid);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const summary = {
  run: runName,
  model,
  judge: judgeModel,
  thinking,
  valid: valid.length,
  total: rows.length,
  firstTry: rows.filter((r) => r.firstTry).length,
  approved: rows.filter((r) => r.final?.verdetto === 'approvato').length,
  meanFirstVote: mean(valid.map((r) => r.votes[0])),
  meanFinalVote: mean(valid.map((r) => r.votes.at(-1)!)),
  sculptor: sculptMeter.session,
  judgeUsage: judgeMeter.session,
  rows,
};
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`validi ${summary.valid}/${summary.total} · al primo colpo ${summary.firstTry} · approvati ${summary.approved} · voto medio ${summary.meanFirstVote.toFixed(1)} → ${summary.meanFinalVote.toFixed(1)}`);
console.log(`scultore: ${tallyLine(sculptMeter.session)}`);
console.log(`Artista:  ${tallyLine(judgeMeter.session)}`);
