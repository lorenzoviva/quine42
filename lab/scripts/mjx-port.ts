// Ports the models of the previous sessions (steps 8A-8B, JSON programs saved in lab/out, which git
// ignores) to MarkovJunior XML in lab/mjx/models, with where they come from in a comment.
// npx vite-node lab/scripts/mjx-port.ts -- <the lab/out folder that holds them>

import fs from 'node:fs';
import path from 'node:path';
import type { Program3 } from '../mj3d/engine';
import { EXAMPLES } from '../mj3d/examples';
import { toMjx } from '../mjx/convert';
import { compileMjx } from '../mjx/model';
import { runMjx } from '../mjx/run';

const from = process.argv.slice(2).filter((a) => a !== '--')[0] ?? 'lab/out';
const dir = path.resolve('lab/mjx/models');
fs.mkdirSync(dir, { recursive: true });

/** id ← file in lab/out (the best version of each by the Artist's vote), and what made it. */
const GEMINI: Array<[string, string, string]> = [
  ['viandante-gemini', 'b-figure-flash38/viandante.json', 'step 8B, gemini-3.8-flash'],
  ['contadina', 'b-figure-flash38/contadina.json', 'step 8B, gemini-3.8-flash'],
  ['fabbro', 'b-figure-flash38/fabbro.v2.json', 'step 8B, gemini-3.8-flash, rivisto'],
  ['gatto', 'b-figure-flash38/gatto.v2.json', 'step 8B, gemini-3.8-flash, rivisto'],
  ['lupo', 'b-figure-flash38/lupo.v2.json', 'step 8B, gemini-3.8-flash, rivisto'],
  ['slime', 'b-figure-flash38/slime.v2.json', 'step 8B, gemini-3.8-flash, rivisto'],
  ['pino-gemini', 'b-semplici-flash38/pino.json', 'step 8B, gemini-3.8-flash'],
  ['palma', 'b-semplici-flash38/palma.json', 'step 8B, gemini-3.8-flash'],
  ['betulla', 'b-semplici-flash38/betulla.json', 'step 8B, gemini-3.8-flash'],
  ['quercia-gemini', 'b-semplici-flash38/quercia.v2.json', 'step 8B, gemini-3.8-flash, rivisto'],
  ['barile', 'b-semplici-flash38/barile.json', 'step 8B, gemini-3.8-flash'],
  ['masso-gemini', 'b-semplici-flash38/masso-muschioso.v2.json', 'step 8B, gemini-3.8-flash, rivisto'],
  ['cespuglio-con-bacche', 'b-semplici-flash38/cespuglio-con-bacche.v2.json', 'step 8B, gemini-3.8-flash, rivisto'],
  ['sasso', 'b-semplici-flash38/sasso.json', 'step 8B, gemini-3.8-flash'],
  // Step 8A: the old scale (8 voxels a tile).
  ['casetta', 's2-flash38/casetta.json', 'step 8A (8 voxel per casella), gemini-3.8-flash'],
  ['fontana', 's2-flash38/fontana.json', 'step 8A (8 voxel per casella), gemini-3.8-flash'],
  ['pozzo', 's2-flash38/pozzo.v2.json', 'step 8A (8 voxel per casella), gemini-3.8-flash, rivisto'],
  ['torre-di-guardia', 's2-flash38/torre-di-guardia.v2.json', 'step 8A (8 voxel per casella), gemini-3.8-flash, rivisto'],
  ['ceppo', 's1-flash38/ceppo.json', 'step 8A (8 voxel per casella), gemini-3.8-flash'],
  ['fungo-gigante', 's1-flash38/fungo-gigante.json', 'step 8A (8 voxel per casella), gemini-3.8-flash'],
];

function save(id: string, p: Program3, origin: string): void {
  const xml = `<!-- ${p.name ?? id}: ${origin}. Convertito dal JSON (lab/mjx/convert.ts): stessi voxel. -->\n${toMjx(p)}\n`;
  const m = compileMjx(xml);
  const r = runMjx(m, 1, { maxSteps: 20000 });
  fs.writeFileSync(path.join(dir, `${id}.xml`), xml);
  console.log(id.padEnd(22), p.size.join('×'), `${xml.length} caratteri`, r.finished ? '' : '(non finisce)');
}

for (const [id, file, origin] of GEMINI) {
  const f = path.resolve(from, file);
  if (!fs.existsSync(f)) {
    console.log(id.padEnd(22), 'manca', f);
    continue;
  }
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const review = f.replace(/\.json$/, '.review.json');
  const voto = fs.existsSync(review) ? JSON.parse(fs.readFileSync(review, 'utf8')).voto : undefined;
  save(id, j.program, `${origin} (${file}${voto !== undefined ? `, voto dell'Artista ${voto}/10` : ''})`);
}
for (const e of EXAMPLES) save(e.id, e.program, `scritto a mano da Claude Code, step 8B (${e.id === 'viandante' ? 'lab/programs/viandante.ts' : 'lab/mj3d/examples.ts'})`);
