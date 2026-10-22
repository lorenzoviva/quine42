// Keeps the best windmill of the chosen trial runs in lab/mjx/models/gemini (the sandbox shows them) and the
// montage in docs/reports/img. npx vite-node lab/scripts/trial-keep.ts -- trial-4-argon-1 trial-3.8-flash-1 …

import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('lab/out');
fs.mkdirSync('docs/reports/img', { recursive: true });
if (fs.existsSync(path.join(out, 'trial-montage.png'))) fs.copyFileSync(path.join(out, 'trial-montage.png'), 'docs/reports/img/step8.2B-mulini.png');
for (const run of process.argv.slice(2).filter((a) => a !== '--')) {
  const s = JSON.parse(fs.readFileSync(path.join(out, run, 'summary.json'), 'utf8'));
  if (!s.best) continue;
  const tag = String(s.model).replace(/^gemini-/, '');
  const xml = fs.readFileSync(path.join(out, run, `${s.best.tag}.xml`), 'utf8').trim().replace(/^<!--[\s\S]*?-->\s*/, '');
  const head = `<!-- Mulino a vento: scolpito da ${s.model} nello step 8.2B (lab/out/${run}, ${s.best.tag}), voto del giudice ${s.judge} ${s.best.vote}/10 -->`;
  fs.writeFileSync(path.join('lab/mjx/models/gemini', `mulino.${tag}.xml`), `${head}\n${xml}\n`);
  console.log(`mulino.${tag}.xml`, s.best.vote);
}
