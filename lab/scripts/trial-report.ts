// The step 8.2B trial, all runs together: a markdown table (tokens, votes, USD with the explicit
// formula) and a montage of each run's best model (front and side, re-rendered from its XML).
// npx vite-node lab/scripts/trial-report.ts   → stdout, lab/out/trial-montage.png

import fs from 'node:fs';
import path from 'node:path';
import { priceOf } from '../mj3d/prices';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../mj3d/render';
import { compileMjx } from '../mjx/model';
import { runMjx } from '../mjx/run';
import { png } from './png';

const out = path.resolve('lab/out');
const runs = fs
  .readdirSync(out)
  .filter((d) => d.startsWith('trial-') && fs.existsSync(path.join(out, d, 'summary.json')))
  .map((d) => JSON.parse(fs.readFileSync(path.join(out, d, 'summary.json'), 'utf8')));
const ORDER = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-4-argon'];
runs.sort((a, b) => ORDER.indexOf(a.model) - ORDER.indexOf(b.model) || a.run.localeCompare(b.run));

const n = (v: number) => v.toLocaleString('it-IT');
/** The cost written out: (input − cache) × price + cache × price + (answer + reasoning) × price. */
function formula(model: string, t: { prompt: number; cached: number; output: number; thoughts: number }): string {
  const p = priceOf(model);
  if (!p) return 'prezzo non pubblicato';
  const usd = ((t.prompt - t.cached) * p.input + t.cached * p.cached + (t.output + t.thoughts) * p.output) / 1e6;
  return `(${n(t.prompt - t.cached)} × ${p.input} + ${n(t.cached)} × ${p.cached} + ${n(t.output + t.thoughts)} × ${p.output}) / 10⁶ = **$${usd.toFixed(4)}**`;
}

console.log('| run | campioni × giri | validi | voti (in ordine) | migliore | chiamate | input (cache) | risposta + ragionamento | costo scultore | costo giudice | minuti |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
const pics: Picture[] = [];
for (const r of runs) {
  const s = r.sculptor;
  const votes = r.versions.map((v: { vote?: number; valid: boolean }) => (v.valid ? (v.vote ?? '?') : '✗')).join(' → ');
  console.log(
    `| ${r.run} | ${r.samples} × ${r.rounds} | ${r.versions.filter((v: { valid: boolean }) => v.valid).length}/${r.versions.length} | ${votes} | ${r.best?.vote ?? '—'} | ${s.calls} | ${n(s.prompt)} (${n(s.cached)}) | ${n(s.output)} + ${n(s.thoughts)} | ${formula(r.model, s)} | ${formula(r.judge, r.judgeUsage)} | ${r.minutes.toFixed(1)} |`,
  );
  if (r.best) {
    const xml = fs.readFileSync(path.join(out, r.run, `${r.best.tag}.xml`), 'utf8');
    const m = compileMjx(xml, { size: [100, 100, 80] });
    const g = runMjx(m, 1).grid;
    pics.push(sheet([0, 1].map((v) => render(g, m.program.palette, v, DEFAULT_RENDER)), 1, 4, [112, 150, 84]));
  }
}
if (pics.length) {
  // Rows of four, stacked (sheet() only lays pictures side by side).
  const cols = 4;
  const rows: Picture[] = [];
  for (let i = 0; i < pics.length; i += cols) rows.push(sheet(pics.slice(i, i + cols), 2, 8, [60, 70, 50]));
  const w = Math.max(...rows.map((r) => r.w));
  const h = rows.reduce((a, r) => a + r.h + 8, 8);
  const data = new Uint8ClampedArray(w * h * 4).fill(40);
  let y = 8;
  for (const r of rows) {
    for (let j = 0; j < r.h; j++) data.set(r.data.subarray(j * r.w * 4, (j + 1) * r.w * 4), (y + j) * w * 4);
    y += r.h + 8;
  }
  fs.writeFileSync(path.join(out, 'trial-montage.png'), png({ w, h, data }));
  console.log(`\nmosaico: lab/out/trial-montage.png (${pics.length} modelli, ${cols} per riga, nell'ordine della tabella)`);
}
