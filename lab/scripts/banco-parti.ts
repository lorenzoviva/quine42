// The bench of the parts of the seed (T471, lab/banco/parti/README.md): the eight parts alone, as their own scenes build them, and the models
// of the bench that include the parts of their trade (the joiner's wardrobe and cart, the mason's cottage, the Sculptor's country house with
// part-window), with what the voxels say of them: the wheels (their box: across the axle, as large as the hub is high, on the ground), the
// panes of the windows (one piece of glass a window), the leaves open (one piece a leaf, after `open` too), the time, the validator, and the
// photographs from four sides. Offline, no models: the cost in dollars is zero.
//
//   npx vite-node lab/scripts/banco-parti.ts                 # the measures, in text
//   npx vite-node lab/scripts/banco-parti.ts -- --foto       # and lab/banco/parti/parti.png, modelli.png

import fs from 'node:fs';
import path from 'node:path';
import { analyse } from '../../src/mj/check';
import { compileMjx, mjxIncludes, type MjxFiles } from '../../src/mj/model';
import { cartoonRender, render, sheet, type Picture } from '../../src/mj/photo';
import { act, runMjx } from '../../src/mj/run';
import type { Grid3 } from '../../src/mj/engine';
import { modelErrors } from '../../src/kernel/validator';
import { checkProgram, filesOf, partResources, SPECIALTIES } from '../../src/kernel/agents/sculptor';
import { bundledFiles } from '../../src/kernel/bundle';
import { classOf } from '../../src/mj/classes';
import { pieces, sizeOf } from '../banco/parti/misure';
import { villettaWithWindows } from '../banco/parti/villetta';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const DIR = path.resolve('lab/banco/parti');
const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));

const PARTS = ['part-stair', 'part-door', 'part-battlements', 'part-slits', 'part-cellar', 'part-window', 'part-leaf', 'part-wheel'];
const MODELS: Array<{ id: string; xml: () => string; size?: [number, number, number]; check?: 'structure' }> = [
  { id: 'armadio', xml: () => fs.readFileSync(path.join(DIR, 'armadio.xml'), 'utf8') },
  { id: 'carretto', xml: () => fs.readFileSync(path.join(DIR, 'carretto.xml'), 'utf8') },
  { id: 'casetta', xml: () => fs.readFileSync(path.join(DIR, 'casetta.xml'), 'utf8') },
  { id: 'villetta', xml: () => villettaWithWindows(), size: [100, 100, 80], check: 'structure' },
];

const piecesText = (g: Grid3, symbols: string[], least = 1) => {
  const ps = pieces(g, symbols).filter((p) => p.cells >= least);
  return ps.length ? `${ps.length} (${ps.slice(0, 8).map((p) => sizeOf(p).join('×')).join(', ')}${ps.length > 8 ? ', …' : ''})` : '0';
};

function measure(id: string, xml: string, size?: [number, number, number]): { line: string; views: Picture[] } {
  const m = compileMjx(xml, { ...(size ? { size } : {}), files: seedFiles(xml) });
  const t0 = performance.now();
  const r = runMjx(m, 1, { deadline: 30_000 });
  const ms = Math.round(performance.now() - t0);
  const a = analyse(r, m.program.palette, { grounded: true });
  const g = r.grid;
  const said: string[] = [];
  if (/wheel|carretto/.test(id)) said.push(`ruote ${piecesText(g, ['I', 'J'], 20)}`);
  if (/window|casetta|villetta/.test(id)) said.push(`vetri ${piecesText(g, ['G'])}`);
  if (/leaf|armadio|casetta/.test(id)) {
    said.push(`ante aperte ${piecesText(g, ['#81'])}`);
    const open = m.actions.find((x) => x.name === 'open');
    if (open) {
      const opened = act({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 }, open, 1).grid;
      said.push(`dopo open ${piecesText(opened, ['#83'])} visibili, chiuse ${piecesText(opened, ['L'])}`);
    }
  }
  const valid = modelErrors(`models/${id}.xml`, xml, 8_000, size, seedFiles(xml)).join('; ') || 'passa';
  const line = `${id}: ${ms} ms, ${a.voxels} voxel, validatore: ${valid}${a.errors.length ? `, analisi: ${a.errors.join('; ')}` : ''}${said.length ? ` · ${said.join(' · ')}` : ''}`;
  const views = args.includes('--foto') ? [0, 1, 2, 3].map((v) => render(g, m.program.palette, v, cartoonRender(id === 'villetta' ? 2 : 4))) : [];
  return { line, views };
}

console.log('## Le parti da sole\n');
const alone: Picture[] = [];
for (const id of PARTS) {
  const { line, views } = measure(id, fs.readFileSync(`universe/models/${id}.xml`, 'utf8'));
  console.log(`- ${line}`);
  alone.push(...views);
}
console.log('\n## Nei modelli\n');
const inModels: Picture[] = [];
for (const m of MODELS) {
  const xml = m.xml();
  const { line, views } = measure(m.id, xml, m.size);
  let check = '';
  if (m.check) {
    const t0 = performance.now();
    const c = checkProgram(xml, classOf(m.check)!, 'large', filesOf(xml, bundledFiles));
    check = ` · controlli dello Scultore a Grande: ${c.error ?? 'passa'} (${Math.round(performance.now() - t0)} ms)`;
  }
  console.log(`- ${line}${check}`);
  inModels.push(...views);
}
console.log('\n## Le parti per specialità (`partResources`)\n');
for (const s of SPECIALTIES) {
  const lines = partResources(bundledFiles, s);
  const chars = lines.reduce((n, l) => n + l.length, 0);
  console.log(`- ${s}: ${lines.map((l) => /file="([^"]+)"/.exec(l)![1]).join(', ') || '—'}${chars ? ` (${chars} caratteri, circa ${Math.round(chars / 3.3)} token)` : ''}`);
}
if (args.includes('--foto')) {
  fs.writeFileSync(path.join(DIR, 'parti.png'), png(sheet(alone, 1, 8, [112, 150, 84])));
  fs.writeFileSync(path.join(DIR, 'modelli.png'), png(sheet(inModels, 1, 8, [112, 150, 84])));
  console.log('\nfoto: lab/banco/parti/parti.png, modelli.png');
}
