// The cellars of the seed (T412): every library entry with `cellar`, run as the game runs it (`Forms`, inline), each seed;
// whether the form keeps its cellar (`hole`), how deep and how large the floor under the ground one reaches from the ground
// floor, and why a cellar is lost (floors under the ground the stair does not reach). No models, no browser.
//
//   npx vite-node lab/scripts/misura-cantine.ts -- [--universo <cartella>] [--solo id] [--json f]
// With --universo, the entries of a universe on the disk (its `models/` and `universe.json`, ported to this contract by the migrations).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { portedFiles } from '../../src/kernel/migrations';
import { bundledFiles } from '../../src/kernel/bundle';
import { Forms, InlineRunner, bodyGround, holesOf, stepOf, cellarVoxels, reachableStoreys, type ModelInfo } from '../../src/kernel/forms';
import { surfaces } from '../../src/mj/mesh';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt('--solo');

const dir = opt('--universo');
const read = (d: string): Record<string, string> => {
  const out: Record<string, string> = { 'universe.json': readFileSync(join(d, 'universe.json'), 'utf8') };
  for (const f of readdirSync(join(d, 'models'))) out[`models/${f}`] = readFileSync(join(d, 'models', f), 'utf8');
  return out;
};
const files = dir ? { ...bundledFiles, ...portedFiles(read(dir)) } : bundledFiles;
const index = JSON.parse(files['models/index.json']!) as Record<string, ModelInfo>;
const ids = Object.keys(index).filter((id) => index[id]!.cellar !== undefined && (!only || id === only));
const forms = new Forms(new InlineRunner());
forms.load(files);

const rows: Record<string, unknown>[] = [];
for (const id of ids) {
  const info = index[id]!;
  for (let seed = 1; seed <= forms.seedsOf(id); seed++) {
    const t0 = Date.now();
    const f = await forms.settled(id, seed, undefined, 600_000);
    const ms = Date.now() - t0;
    if (!f || f.status !== 'ready' || !f.result) {
      rows.push({ id, seed, status: f?.status ?? 'none', error: f?.error });
      continue;
    }
    const g = f.result.grid;
    const { vpt, base } = f;
    const step = stepOf(vpt);
    // The cellar as `groundOfForm` tries it, whether it holds or not: floors under the ground, those a body stands on, those reached.
    const hole = holesOf(g, f.result.palette, base);
    let holeCols = 0, under = 0, reached = 0, lowest = Infinity;
    if (hole) {
      // Where a body could stand (before the reach), with the same fill as `cellarGround`; then what the reach leaves open.
      const fill = new Uint16Array(hole.length);
      for (let i = 0; i < hole.length; i++) fill[i] = hole[i] ? 0 : base;
      const standing = surfaces(g, f.result.palette, step + 1, Math.ceil(0.7 * vpt), fill).block;
      const { start, z, block } = bodyGround(g, f.result.palette, vpt, base, hole).levels;
      for (let i = 0; i < hole.length; i++) {
        if (!hole[i]) continue;
        holeCols++;
        for (let l = start[i]; l < start[i + 1]; l++) {
          if (z[l] >= base - step || standing[l]) continue;
          under++;
          if (!block[l]) (reached++, (lowest = Math.min(lowest, z[l])));
        }
      }
    }
    const storeys = reachableStoreys(g, f.result.palette, vpt, base).map((h) => +(h / vpt).toFixed(2));
    rows.push({
      id,
      seed,
      size: info.size ?? '-',
      vpt,
      vptEntry: info.vpt ?? '-',
      cellarVoxels: cellarVoxels(info),
      grid: `${g.X}×${g.Y}×${g.Z}`,
      base,
      baseTiles: +(base / vpt).toFixed(3),
      held: !!f.hole,
      holeTiles: +(holeCols / (vpt * vpt)).toFixed(2),
      underFloorCols: under,
      reachedFloorCols: reached,
      reachedTiles: +(reached / (vpt * vpt)).toFixed(2),
      floorBelowGround: Number.isFinite(lowest) ? +((lowest - base) / vpt).toFixed(3) : undefined,
      storeys: storeys.join(' '),
      ms,
    });
  }
}

for (const r of rows) console.log(JSON.stringify(r));
const out = opt('--json');
if (out) writeFileSync(out, JSON.stringify(rows, null, 1) + '\n');
