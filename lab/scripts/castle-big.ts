// The hand-written castle at the size of a city (100 × 100 tiles, 3 levels), offline: how long the
// layout, the collapse and the photograph take. Writes lab/out/strutture/castello-grande*.png.
// npx vite-node lab/scripts/castle-big.ts -- [100]

import fs from 'node:fs';
import path from 'node:path';
import { renderStructure } from '../mj3d/composite';
import { DEFAULT_RENDER, sheet } from '../mj3d/render';
import { buildBlocks, catalogue, runLayout } from '../mj3d/structure';
import { castle, CASTELLO } from '../programs/castello';
import { png } from './png';

const n = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 100);
const dir = path.resolve('lab/out/strutture');
fs.mkdirSync(dir, { recursive: true });
let t = Date.now();
const b = buildBlocks(CASTELLO, 1);
const cat = catalogue(CASTELLO, b.built);
console.log(`blocchi ${CASTELLO.blocks.length} → varianti ${cat.K - 1}, compatibilità in ${Date.now() - t} ms`);
t = Date.now();
const layout = castle([n, n, 3]);
const r = runLayout(layout, CASTELLO, 1, b.built, 60000);
console.log(`pianta ${n}×${n}×3: ${r.steps} passi, wfc su ${r.wfc?.zoneCells} celle (${r.wfc?.cells} in tutto) in ${r.wfc?.ms} ms, riparazioni ${r.wfc?.repairs}, riuscito ${r.wfc?.ok}; ${r.placements.length} blocchi; prese sbagliate ${r.mismatches.length}${r.mismatches.length ? ` (${r.mismatches.slice(0, 2).join(' | ')})` : ''}; totale ${Date.now() - t} ms`);
t = Date.now();
const pic = renderStructure(r.placements, layout.size, { seed: 1, render: DEFAULT_RENDER });
console.log(`foto ${pic.w}×${pic.h} px in ${Date.now() - t} ms`);
fs.writeFileSync(path.join(dir, `castello-grande-${n}.png`), png(pic));
// A corner at 3×, to see the detail.
const w = 360, h = 300;
const data = new Uint8ClampedArray(w * h * 4);
for (let y = 0; y < h; y++) data.set(pic.data.subarray(((pic.h - h - 40 + y) * pic.w + 20) * 4, ((pic.h - h - 40 + y) * pic.w + 20 + w) * 4), y * w * 4);
fs.writeFileSync(path.join(dir, `castello-grande-${n}-angolo.png`), png(sheet([{ w, h, data }], 3, 0, [112, 150, 84])));
