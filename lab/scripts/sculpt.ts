// Runs the sculptor (and optionally the artist) on a batch of targets, headless, and saves what comes
// out to lab/out/<run>/: the four views per target, the program, the measures, the review.
//
//   npx vite-node lab/scripts/sculpt.ts -- --step 1 [--only "Pino,Sasso"] [--universe valmora]
//        [--model gemini-3.1-flash-lite] [--no-examples] [--rules-only] [--review] [--refine 1]
//        [--seeds 3] [--offline] [--run nome]
//
// The key is read from .env and sent only to Google; it is never printed.

import fs from 'node:fs';
import path from 'node:path';
import { GeminiModels } from '../../src/kernel/ai/gemini';
import { meteredFetch, meterLine, newMeter } from '../mj3d/meter';
import type { Models } from '../../src/kernel/ai/models';
import { run } from '../mj3d/engine';
import { LabMockModels } from '../mj3d/mock';
import { DEFAULT_RENDER, render, sheet } from '../mj3d/render';
import { DIRECTION_VIEW, sway, walk } from '../mj3d/animate';
import { classFor, contactSheet, DEFAULT_SCULPT, review, sculpt, type Critique, type SculptOptions, type Target } from '../mj3d/sculptor';
import { PRESETS, styleOf, universeTargets } from '../mj3d/targets';
import { png } from './png';

const meter = newMeter();

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const opt = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

function readKey(): string | undefined {
  try {
    const env = fs.readFileSync('.env', 'utf8');
    return /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(env)?.[1]?.trim();
  } catch {
    return undefined;
  }
}

function readUniverse(name: string): Record<string, string> {
  const root = path.resolve('universes', name);
  const out: Record<string, string> = {};
  const walk = (dir: string, rel: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git' || (!rel && (e.name === 'assets' || e.name === 'maps'))) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else if (/\.(json|md|lua)$/.test(e.name)) out[r] = fs.readFileSync(path.join(dir, e.name), 'utf8');
    }
  };
  walk(root, '');
  return out;
}

const universe = opt('universe') ?? 'valmora';
const files = fs.existsSync(path.resolve('universes', universe)) ? readUniverse(universe) : {};
const style = styleOf(files);
const asset = (ref?: string) => {
  if (!ref) return undefined;
  const f = path.resolve('universes', universe, 'assets', `${ref.replace(/:/g, '_')}.txt`);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : undefined;
};

const step = Number(opt('step') ?? 1);
const category = (['semplice', 'struttura', 'figura'] as const)[step - 1] ?? 'semplice';
let targets: Target[] = [...PRESETS, ...(flag('from-universe') ? universeTargets(files) : [])].filter((t) => t.category === category);
const only = opt('only');
if (only) {
  const names = only.split(',').map((s) => s.trim().toLowerCase());
  targets = [...PRESETS, ...universeTargets(files)].filter((t) => names.some((n) => t.name.toLowerCase() === n || t.id.toLowerCase() === n));
}

const key = readKey();
const textModel = opt('model') ?? 'gemini-3.5-flash';
const models: Models =
  flag('offline') || !key
    ? new LabMockModels()
    : new GeminiModels({
        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
        textModel,
        imageModel: 'none',
        limits: { text: Number(opt('max') ?? 200), images: 0 },
        fetchImpl: meteredFetch(meter, { timeout: 240_000, thinking: opt('thinking') as 'low' | 'medium' | 'high' | undefined, headers: { 'x-goog-api-key': key! } }),
      });

const opts: SculptOptions = { ...DEFAULT_SCULPT, examples: !flag('no-examples'), shapes: !flag('rules-only'), style, retries: Number(opt('retries') ?? 2) };
const seeds = Number(opt('seeds') ?? 3);
const refine = Number(opt('refine') ?? 0);
const doReview = flag('review') || refine > 0;
const runName = opt('run') ?? `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}-step${step}-${models.name === 'offline' ? 'offline' : textModel}${opts.shapes ? '' : '-regole'}${opts.examples ? '' : '-senza-esempi'}`;
const outDir = path.resolve('lab/out', runName);
fs.mkdirSync(outDir, { recursive: true });
const dataUrl = (p: Parameters<typeof png>[0]) => `data:image/png;base64,${png(p).toString('base64')}`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

console.log(`${targets.length} bersagli · modelli: ${models.name}${models.name === 'offline' ? '' : ` (${textModel})`} · esempi: ${opts.examples} · shape: ${opts.shapes} → ${outDir}`);

interface Row {
  target: string;
  attempts: number;
  /** Attempts of the first request (before any review). */
  first: number;
  ok: boolean;
  errors: string[];
  warnings: string[];
  voxels?: number;
  critiques: Critique[];
}

const rows = await Promise.all(
  targets.map(async (t): Promise<Row> => {
    const base = slug(t.name);
    const critiques: Critique[] = [];
    let s = await sculpt(models, t, opts);
    let attempts = s.attempts.length;
    const first = attempts;
    for (let round = 0; ; round++) {
      const tag = round ? `${base}.v${round + 1}` : base;
      fs.writeFileSync(path.join(outDir, `${tag}.json`), JSON.stringify({ target: t, attempts: s.attempts, program: s.program, analysis: s.analysis && { ...s.analysis } }, null, 2));
      if (!s.program || !s.result) break;
      // Several seeds of the same program: variety at no cost.
      const pics = [];
      for (let k = 0; k < seeds; k++) {
        const r = k ? run(s.program, opts.seed + k) : s.result;
        pics.push(...[0, 1, 2, 3].map((v) => render(r.grid, s.program!.palette, v, DEFAULT_RENDER)));
      }
      fs.writeFileSync(path.join(outDir, `${tag}.png`), png(sheet(pics, 3, 4, [112, 150, 84])));
      // The frames the kernel makes from the model: a walk (4 directions × 3) or the wind.
      const anim = classFor(t).cls.animation;
      if (anim) {
        const frames = anim === 'camminata' ? walk(s.result.grid, s.program.palette).frames : sway(s.result.grid);
        const dirs = anim === 'camminata' ? (['down', 'left', 'right', 'up'] as const) : (['down'] as const);
        const rows = dirs.map((d) => sheet(frames.map((g) => render(g, s.program!.palette, DIRECTION_VIEW[d], DEFAULT_RENDER)), 1, 2));
        fs.writeFileSync(path.join(outDir, `${tag}.${anim}.png`), png(sheet(rows, 2, 2, [112, 150, 84])));
      }
      if (!doReview || s.analysis?.errors.length) break;
      const views = dataUrl(contactSheet(s.result, s.program));
      const c = await review(models, t, views, asset(t.sprite), style).catch((e) => (console.warn(`${t.name}: revisione fallita: ${e.message}`), null));
      if (!c) break;
      critiques.push(c);
      fs.writeFileSync(path.join(outDir, `${tag}.review.json`), JSON.stringify(c, null, 2));
      if (round >= refine || c.verdetto === 'approvato') break;
      const next = await sculpt(models, t, opts, undefined, { program: s.program, critique: c, views });
      attempts += next.attempts.length;
      if (!next.program || !next.result) break;
      s = next;
    }
    const a = s.analysis;
    console.log(`${t.name}: ${s.attempts.length} tentativi${a ? `, ${a.voxels} voxel` : ''}${s.attempts.at(-1)?.error ? ` — ${s.attempts.at(-1)!.error}` : ''}${critiques.length ? ` — Artista: ${critiques.map((c) => c.voto).join(' → ')}` : ''}`);
    return { target: t.name, attempts, first, ok: !!a && !a.errors.length, errors: s.attempts.map((x) => x.error).filter(Boolean) as string[], warnings: a?.warnings ?? [], voxels: a?.voxels, critiques };
  }),
);

const summary = {
  run: runName,
  models: models.name === 'offline' ? 'offline' : textModel,
  options: { ...opts, style: !!opts.style },
  usage: models.usage,
  valid: rows.filter((r) => r.ok).length,
  total: rows.length,
  firstTry: rows.filter((r) => r.first === 1 && !r.errors.length).length,
  approved: rows.filter((r) => r.critiques.at(-1)?.verdetto === 'approvato').length,
  rows,
};
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`validi ${summary.valid}/${summary.total} (al primo colpo ${summary.firstTry})${doReview ? `, approvati dall'Artista ${summary.approved}` : ''} · chiamate di testo ${models.usage.text}, token ${models.usage.inputTokens}+${models.usage.outputTokens}`);

console.log(meterLine(meter));
