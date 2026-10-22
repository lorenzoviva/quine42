// The structure chain, headless: architect's plan → kernel's commission → block sculptor → kernel
// (composition, checks, voxels) → artist, on the
// structure presets (or --only "Castello con ponte levatoio,…"). Writes lab/out/<run>/.
// npx vite-node lab/scripts/build.ts -- [--model gemini-3.5-flash] [--thinking low] [--set nuove] [--only …] [--review] [--improve] [--offline] [--run nome]

import fs from 'node:fs';
import path from 'node:path';
import { GeminiModels } from '../../src/kernel/ai/gemini';
import { meteredFetch, meterLine, newMeter } from '../mj3d/meter';
import type { Models } from '../../src/kernel/ai/models';
import { buildStructure, DEFAULT_STRUCT, improveStructure, STRUCTURE_PRESETS, STRUCTURE_TRIALS, type BuildResult } from '../mj3d/architect';
import { commissionText } from '../mj3d/commission';
import { LabMockModels } from '../mj3d/mock';
import { renderStructure } from '../mj3d/composite';
import { DEFAULT_RENDER, region, render, sheet, shrink, type Picture } from '../mj3d/render';
import { review } from '../mj3d/sculptor';
import { catalogue, DETAIL_CELLS, finish, LEVEL } from '../mj3d/structure';
import { TILE } from '../mj3d/scale';
import { styleOf } from '../mj3d/targets';
import { png } from './png';

const meter = newMeter();

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const key = (() => {
  try {
    return /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync('.env', 'utf8'))?.[1]?.trim();
  } catch {
    return undefined;
  }
})();
const textModel = opt('model') ?? 'gemini-3.5-flash';
const models: Models =
  flag('offline') || !key
    ? new LabMockModels()
    : new GeminiModels({
        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
        textModel,
        imageModel: 'none',
        limits: { text: 120, images: 0 },
        fetchImpl: meteredFetch(meter, { timeout: 240_000, thinking: opt('thinking') as 'low' | 'medium' | 'high' | undefined, headers: { 'x-goog-api-key': key! } }),
      });
const styleFile = path.resolve('universes/valmora/world/style.md');
const style = fs.existsSync(styleFile) ? styleOf({ 'world/style.md': fs.readFileSync(styleFile, 'utf8') }) : undefined;
const only = opt('only')?.split(',').map((s) => s.trim().toLowerCase());
// --set prove (the presets of the page, default) or --set nuove (the trials of step 8E).
const pool = opt('set') === 'nuove' ? STRUCTURE_TRIALS : STRUCTURE_PRESETS;
const targets = pool.filter((t) => !only || only.includes(t.name.toLowerCase()));
const run = opt('run') ?? `strutture-${models.name === 'offline' ? 'offline' : textModel}`;
const dir = path.resolve('lab/out', run);
fs.mkdirSync(dir, { recursive: true });
const opts = { ...DEFAULT_STRUCT, style, ...(opt('seed') ? { seed: Number(opt('seed')) } : {}) };
const GRASS: [number, number, number] = [112, 150, 84];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const url = (p: Picture) => `data:image/png;base64,${png(p).toString('base64')}`;

/** Photographs a composed structure (with its detail when it fits), saves the views, and lets the artist judge. */
async function shoot(t: (typeof targets)[number], r: BuildResult, name: string, say: (s: string) => void) {
  const [X, Y, Z] = r.layout!.size;
  const whole = X * Y * Z * TILE * TILE * LEVEL <= DETAIL_CELLS;
  const t0 = Date.now();
  const f = whole ? finish(r.result!, { seed: opts.seed }) : undefined;
  if (f?.detail) say(`dettaglio: ${'error' in f.detail && f.detail.error ? f.detail.error : `${(f.detail as { steps: number }).steps} passi, ${(f.detail as { ms: number }).ms} ms`}`);
  const views = [0, 1, 2, 3].map((v) => (f ? render(f.grid, f.palette, v, DEFAULT_RENDER) : renderStructure(r.result!.placements, r.layout!.size, { seed: 1, view: v, render: DEFAULT_RENDER })));
  say(`foto ${views[0].w}×${views[0].h} px × 4 in ${Date.now() - t0} ms`);
  views.forEach((v, i) => fs.writeFileSync(path.join(dir, `${name}.${i}.png`), png(v)));
  fs.writeFileSync(path.join(dir, `${name}.zoom.png`), png(sheet([region(views[0], views[0].w / 2 - 130, views[0].h / 2 - 90, 260, 180)], 4, 0, GRASS)));
  fs.writeFileSync(path.join(dir, `${name}.pianta.json`), JSON.stringify(r.layout, null, 2));
  const front = views[0];
  const whole1 = url(sheet([shrink(front, 1200)], 1, 4, GRASS));
  if (!flag('review')) return { whole: whole1 };
  // The whole (shrunk) and two details at twice the size: the artist must see the detail too.
  const details = [sheet([region(front, Math.floor(front.w * 0.35), Math.floor(front.h * 0.7), 360, 240)], 2, 0, GRASS), sheet([region(front, Math.floor(front.w * 0.45), Math.floor(front.h * 0.4), 360, 240)], 2, 0, GRASS)].map(url);
  const rv = await review(models, { id: t.id, name: t.name, category: 'struttura', kind: 'struttura', description: `${t.description}. La prima immagine è la struttura intera vista da sud, le altre due sono dettagli ingranditi.` }, whole1, undefined, style, details).catch((e) => (console.log(`  revisione fallita: ${e.message}`), null));
  if (rv) fs.writeFileSync(path.join(dir, `${name}.review.json`), JSON.stringify(rv, null, 2));
  if (rv) say(`Artista ${rv.voto}/10 — ${rv.problemi.slice(0, 3).join('; ')}`);
  return { whole: whole1, review: rv };
}

const rows = [];
// One structure at a time: easier to follow, and kinder to the rate limits.
for (const t of targets) {
  rows.push(
    await (async () => {
      const base = slug(t.name);
      const say = (s: string) => console.log(`${t.name}: ${s}`);
      let r = await buildStructure(models, t, opts, say);
      fs.writeFileSync(path.join(dir, `${base}.piano.json`), JSON.stringify({ attempts: r.plan.attempts, layout: r.plan.layout }, null, 2));
      if (r.plan.layout && r.plan.commission) fs.writeFileSync(path.join(dir, `${base}.commissione.txt`), commissionText(r.plan.layout, r.plan.commission, 100));
      if (r.blocks) fs.writeFileSync(path.join(dir, `${base}.blocchi.json`), JSON.stringify({ ...r.blocks, report: undefined, orders: r.orders.map((o) => o.attempts), set: r.set }, null, 2));
      if (r.repair) fs.writeFileSync(path.join(dir, `${base}.ritocco.json`), JSON.stringify({ ...r.repair, result: undefined }, null, 2));
      if (!r.set || !r.report || !r.layout || !r.result?.placements.length) return { target: t.name, calls: r.calls, ok: false };
      fs.writeFileSync(path.join(dir, `${base}.blocchi.png`), png(sheet([...r.report.built.values()].map((x) => render(x.grid, x.block.program.palette, 0, DEFAULT_RENDER)), 3, 4, GRASS)));
      const first = await shoot(t, r, base, say);
      let voto = first.review?.voto;
      const votes = [voto];
      // A round of improvement when the artist is not convinced: the architect sees image and judgement.
      if (flag('improve') && first.review && first.review.voto < 6) {
        const critique = [`voto ${first.review.voto}/10`, ...first.review.problemi, ...first.review.consigli.map((c) => `consiglio: ${c}`)].join('; ');
        const better = await improveStructure(models, t, opts, r, critique, first.whole, say);
        if (better.layout !== r.layout) {
          r = better;
          if (r.report) fs.writeFileSync(path.join(dir, `${base}.v2.blocchi.png`), png(sheet([...r.report.built.values()].map((x) => render(x.grid, x.block.program.palette, 0, DEFAULT_RENDER)), 3, 4, GRASS)));
          const second = await shoot(t, r, `${base}.v2`, say);
          voto = second.review?.voto ?? voto;
          votes.push(second.review?.voto);
        } else r = { ...r, calls: better.calls };
      }
      const cat = catalogue(r.set!, r.report!.built, Object.values(r.layout!.open ?? {}));
      return { target: t.name, calls: r.calls, ok: !r.result!.mismatches.length, problems: r.result!.mismatches.slice(0, 5), orders: r.orders.length, repaired: !!r.repair, blocks: r.set!.blocks.length, variants: cat.K - 1, configs: r.plan.commission?.configs.length, size: r.layout!.size, placed: r.result!.placements.length, wfc: r.result!.wfc, votes, voto };
    })(),
  );
  console.log(meterLine(meter));
}
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify({ models: models.name === 'offline' ? 'offline' : textModel, usage: models.usage, meter, rows }, null, 2));
console.log(`chiamate di testo ${models.usage.text}, token ${models.usage.inputTokens}+${models.usage.outputTokens}`);

console.log(meterLine(meter));
