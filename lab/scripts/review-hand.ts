// The artist (Gemini) on the programs written by hand by Claude Code, to compare them with the
// sculptor's on the same terms. npx vite-node lab/scripts/review-hand.ts -- [--model gemini-3.5-flash] [--thinking low]

import fs from 'node:fs';
import path from 'node:path';
import { GeminiModels } from '../../src/kernel/ai/gemini';
import { meteredFetch, meterLine, newMeter } from '../mj3d/meter';
import { run } from '../mj3d/engine';
import { EXAMPLES } from '../mj3d/examples';
import { DEFAULT_RENDER, render, sheet } from '../mj3d/render';
import { contactSheet, review, type Category } from '../mj3d/sculptor';
import { buildBlocks, expand, runLayout } from '../mj3d/structure';
import { styleOf } from '../mj3d/targets';
import { CASTELLO, CASTELLO_PIANTA } from '../programs/castello';
import { SOTTERRANEO, SOTTERRANEO_PIANTA } from '../programs/sotterraneo';
import { png } from './png';

const meter = newMeter();

const argv = process.argv.slice(2);
const model = argv.includes('--model') ? argv[argv.indexOf('--model') + 1] : 'gemini-3.5-flash';
const key = /^GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync('.env', 'utf8'))?.[1]?.trim();
if (!key) throw new Error('manca GEMINI_API_KEY in .env');
const models = new GeminiModels({
  endpoint: 'https://generativelanguage.googleapis.com/v1beta',
  textModel: model,
  imageModel: 'none',
  limits: { text: 20, images: 0 },
  fetchImpl: meteredFetch(meter, { timeout: 240_000, thinking: undefined, headers: { 'x-goog-api-key': key! } }),
});
const style = styleOf({ 'world/style.md': fs.readFileSync('universes/valmora/world/style.md', 'utf8') });
const dir = path.resolve('lab/out/claude-artista');
fs.mkdirSync(dir, { recursive: true });
const url = (p: Parameters<typeof png>[0]) => `data:image/png;base64,${png(p).toString('base64')}`;
const CAT: Record<string, Category> = { persona: 'figura' };

const jobs: Array<Promise<string>> = EXAMPLES.map(async (e) => {
  const r = run(e.program, 1);
  const c = await review(models, { id: e.id, name: e.program.name ?? e.ask, category: CAT[e.kind] ?? 'semplice', kind: e.kind, description: e.ask }, url(contactSheet(r, e.program)), undefined, style);
  fs.writeFileSync(path.join(dir, `${e.id}.json`), JSON.stringify(c, null, 2));
  return `${e.id}: ${c.voto}/10 ${c.verdetto} — ${c.problemi.slice(0, 2).join('; ')}`;
});
for (const [id, set, layout, desc] of [
  ['castello', CASTELLO, CASTELLO_PIANTA, 'Un castello di pietra con mura merlate, quattro torri, un fossato tutto attorno e un ponte levatoio davanti al portone; un mastio nel cortile'],
  ['sotterraneo', SOTTERRANEO, SOTTERRANEO_PIANTA, 'Un sotterraneo scavato nella roccia: corridoi, curve, bivi, sale con pilastri e scrigni, scale tra due livelli'],
] as const)
  jobs.push(
    (async () => {
      const b = buildBlocks(set, 1);
      const l = runLayout(layout, set, 1, b.built);
      const e = expand(l.placements, layout.size, { seed: 1 });
      const pics = [0, 1, 2, 3].map((v) => render(e.grid, e.palette, v, DEFAULT_RENDER));
      const c = await review(models, { id, name: set.name, category: 'struttura', kind: 'struttura', description: desc }, url(sheet(pics, 1, 6, [112, 150, 84])), undefined, style);
      fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(c, null, 2));
      return `${id}: ${c.voto}/10 ${c.verdetto} — ${c.problemi.slice(0, 2).join('; ')}`;
    })(),
  );
for (const line of await Promise.all(jobs)) console.log(line);
console.log(`chiamate ${models.usage.text}`);

console.log(meterLine(meter));
