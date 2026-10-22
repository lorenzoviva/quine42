// Keeps the last valid program of each target of a trial run (lab/out/<run>) in lab/mjx/models/gemini,
// named <target>.<model>.xml, with the Artist's vote in a comment: the sandbox shows them side by side.
// npx vite-node lab/scripts/mjx-keep.ts -- mjx-31-flash-lite-2 mjx-38-flash-2

import fs from 'node:fs';
import path from 'node:path';

const dest = path.resolve('lab/mjx/models/gemini');
fs.mkdirSync(dest, { recursive: true });
for (const run of process.argv.slice(2).filter((a) => a !== '--')) {
  const dir = path.resolve('lab/out', run);
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf8'));
  const tag = String(summary.model).replace(/^gemini-/, '');
  for (const row of summary.rows as Array<{ target: string; votes: number[] }>) {
    const slug = row.target.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    // The last version that was photographed (a .png next to it) is the last valid one.
    const versions = fs.readdirSync(dir).filter((f) => new RegExp(`^${slug}(\\.v\\d+)?\\.png$`).test(f)).sort();
    const last = versions.at(-1);
    if (!last) continue;
    const xml = fs.readFileSync(path.join(dir, last.replace(/\.png$/, '.xml')), 'utf8').trim();
    const head = `<!-- ${row.target}: scolpito da ${summary.model} nello step 8.2A (lab/out/${run}), voti dell'Artista ${row.votes.join(' → ')}/10 -->`;
    fs.writeFileSync(path.join(dest, `${slug}.${tag}.xml`), `${head}\n${xml.replace(/^<!--[\s\S]*?-->\s*/, '')}\n`);
    console.log(`${slug}.${tag}.xml`, row.votes.join(' → '));
  }
}
