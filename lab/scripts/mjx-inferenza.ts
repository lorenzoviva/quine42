// The models of MarkovJunior's repository that infer (T334: field, temperature, observe, search), photographed with the lab's engine
// and, beside them, the grids the original gives (MarkovJunior's C#, run with lab/banco/inferenza/originale), with the same renderer:
// the same model, two engines, two random generators. A 3D model from its four sides, a 2D one from above.
//   npx vite-node lab/scripts/mjx-inferenza.ts [-- --dir lab/banco/inferenza] [--originale lab/out/inferenza-originale] [--seme 1] [Keys …]
// The original's outputs are `<model>-<seed>.txt` files of that harness (see lab/banco/inferenza/README.md).

import fs from 'node:fs';
import path from 'node:path';
import type { Grid3 } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import { runMjx } from '../../src/mj/run';
import { OFFICIAL } from '../mjx/official';
import { png } from './png';

export const INFERENCE_MODELS = ['Keys', 'SoftPath', 'StairsPath', 'Dwarves', 'Division', 'RegularPath', 'GrowTo', 'CompleteSAW'];

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : fallback;
};
const dir = path.resolve(opt('dir', 'lab/out/mjx-inferenza'));
const originals = path.resolve(opt('originale', 'lab/out/inferenza-originale'));
const seed = Number(opt('seme', '1'));
const only = args;
fs.mkdirSync(dir, { recursive: true });

const counts = (g: Grid3, bg: string) => {
  const n: Record<string, number> = {};
  for (const c of g.cells) {
    const k = g.alphabet[c] === '.' ? bg : g.alphabet[c];
    n[k] = (n[k] ?? 0) + 1;
  }
  return Object.entries(n).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}:${v}`).join(',');
};

/** The grid the original printed (`GRID X Y Z` and a line of letters), in the codes of our grid; undefined if it is not there. */
function originalGrid(file: string, like: Grid3, bg: string): { grid: Grid3; steps: string } | undefined {
  if (!fs.existsSync(file)) return undefined;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const at = lines.findIndex((l) => l.startsWith('GRID '));
  if (at < 0) return undefined;
  const [X, Y, Z] = lines[at].split(' ').slice(1).map(Number);
  const letters = lines[at + 1];
  const alphabet = [...like.alphabet];
  const cells = new Uint8Array(X * Y * Z);
  for (let i = 0; i < cells.length; i++) {
    const ch = letters[i] === bg ? '.' : letters[i];
    let c = alphabet.indexOf(ch);
    if (c < 0) c = alphabet.push(ch) - 1;
    cells[i] = c;
  }
  return { grid: { X, Y, Z, cells, alphabet, log: [], epoch: 0 }, steps: lines.find((l) => l.startsWith('STEPS '))?.slice(6) ?? '?' };
}

const photo = (g: Grid3, palette: Parameters<typeof render>[1]): Picture => {
  const views = g.Z === 1 ? [0] : [0, 1, 2, 3];
  const pics = views.map((v) => render(g, palette, v, { ...DEFAULT_RENDER, shadow: false, crop: false }));
  return sheet(pics, Math.max(1, Math.floor((g.Z === 1 ? 360 : 220) / pics[0].w)), 6, [40, 40, 48]);
};

for (const name of INFERENCE_MODELS) {
  if (only.length && !only.includes(name)) continue;
  const o = OFFICIAL.find((m) => m.name === name)!;
  const m = compileMjx(o.xml, { size: o.size, ...(o.files ? { files: o.files } : {}) });
  const r = runMjx(m, seed, { maxSteps: o.steps ?? 5_000_000, deadline: 120_000 });
  const ours = photo(r.grid, m.program.palette);
  fs.writeFileSync(path.join(dir, `${name}.png`), png(ours));
  const orig = originalGrid(path.join(originals, `${name}-${seed}.txt`), r.grid, m.background);
  if (orig) fs.writeFileSync(path.join(dir, `${name}-originale.png`), png(photo(orig.grid, m.program.palette)));
  console.log(
    `| ${name} | ${o.size.join('×')} | ${r.steps}${r.finished ? '' : ' (interrotto)'} | ${r.ms} ms | ${counts(r.grid, m.background)} | ${orig ? `${orig.steps} | ${counts(orig.grid, m.background)}` : '— | —'} |`,
  );
}
