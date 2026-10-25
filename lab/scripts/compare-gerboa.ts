import fs from 'node:fs';
import path from 'node:path';
import { compileMjx } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import { render, sheet, DEFAULT_RENDER, type Picture } from '../../src/mj/photo';
import { png } from './png';

const models = [
  { id: 'corona-gerboa', title: 'Base (in avanti)' },
  { id: 'corona-gerboa-45', title: 'Variante 45° (avanti-esterno)' },
  { id: 'corona-gerboa-laterale', title: 'Variante Laterale (90° destra/sinistra)' },
];

const dir = path.resolve('lab/out/mjx');
const artifactDir = 'C:/Users/lollouno/.gemini/antigravity-ide/brain/1a973a26-8415-4090-b4b3-da5b7a764689';

// Render all 4 views (fronte, destra, retro, sinistra) for each of the 3 models
const allPics: Picture[] = [];

for (const mInfo of models) {
  const xml = fs.readFileSync(path.resolve('lab/mjx/models', `${mInfo.id}.xml`), 'utf8');
  const m = compileMjx(xml);
  const r = runMjx(m, 1);
  const views = [0, 1, 2, 3].map((v) => render(r.grid, m.program.palette, v, DEFAULT_RENDER));
  allPics.push(...views);

  // Also save a dedicated 4-view strip for each
  const strip = sheet(views, 4, 4, [120, 150, 90]);
  const stripBuf = png(strip);
  fs.writeFileSync(path.join(dir, `${mInfo.id}-strip.png`), stripBuf);
  fs.writeFileSync(path.join(artifactDir, `${mInfo.id}-strip.png`), stripBuf);
}

// 3 rows of 4 views
const fullComparison = sheet(allPics, 4, 4, [120, 150, 90]);
const fullBuf = png(fullComparison);
fs.writeFileSync(path.join(dir, 'gerboa-confronto.png'), fullBuf);
fs.writeFileSync(path.join(artifactDir, 'gerboa-confronto.png'), fullBuf);

console.log('Saved comparison sheets successfully.');
