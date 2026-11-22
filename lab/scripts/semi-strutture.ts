// T495: how the seeds of a structure hold past the ones the Sculptor tried (`STRUCTURE_SEEDS`, ADR-0160): every structure of a universe on the
// disk that the Cartographer may wear again (`reusableStructures`), run at seeds 1..N of its size with the Sculptor's checks (`checkSeed`):
//   npx vite-node lab/scripts/semi-strutture.ts -- universes/<nome> [--semi 24] [--solo id,…] [--json f]
// No calls, writes nothing in the universe.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { checkSeed, filesOf } from '../../src/kernel/agents/sculptor';
import { classOf } from '../../src/mj/classes';
import { cellarOf, type ModelInfo } from '../../src/kernel/forms';
import { reusableStructures } from '../../src/kernel/reuse';
import type { FileMap } from '../../src/kernel/types';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string, def?: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const dir = path.resolve(args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true) ?? 'universe');
const seeds = Number(opt('--semi', '24'));
const only = opt('--solo')?.split(',');

const files: Record<string, string> = {};
for (const f of await fs.readdir(path.join(dir, 'models'))) files[`models/${f}`] = await fs.readFile(path.join(dir, 'models', f), 'utf8');
const index = JSON.parse(files['models/index.json'] ?? '{}') as Record<string, ModelInfo>;
const list = reusableStructures(files as FileMap, () => true, () => 0, true).flatMap((s) => s.entries.map((e) => ({ id: e.id, concept: s.concept, size: e.size })));
const out: Array<{ id: string; concept: string; size?: string; failed: Array<{ seed: number; error: string }>; ms: number }> = [];
for (const e of list) {
  if (only && !only.includes(e.id)) continue;
  const info = index[e.id];
  const xml = files[`models/${e.id}.xml`];
  const cls = classOf(info?.class);
  if (!info || !xml || !cls) continue;
  const t0 = performance.now();
  const failed: Array<{ seed: number; error: string }> = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const error = checkSeed(xml, cls, info.size, seed, filesOf(xml, files as FileMap), { ...(cellarOf(info, xml) ? { cellar: cellarOf(info, xml) } : {}) });
    if (error) failed.push({ seed, error: error.slice(0, 160) });
  }
  const ms = Math.round(performance.now() - t0);
  out.push({ id: e.id, concept: e.concept, ...(e.size ? { size: e.size } : {}), failed, ms });
  console.log(`${e.id} (${info.size ?? cls.taglia}, ${info.author ?? '?'}): ${seeds - failed.length}/${seeds} semi reggono, ${(ms / seeds).toFixed(0)} ms a seme${failed.length ? `; cadono ${failed.map((f) => f.seed).join(', ')}: ${failed[0].error}` : ''}`);
}
const tried = out.length * seeds, fell = out.reduce((s, o) => s + o.failed.length, 0);
const firstFour = out.reduce((s, o) => s + o.failed.filter((f) => f.seed <= 4).length, 0);
console.log(`\n${out.length} strutture, ${tried} semi: ${fell} cadono (${((fell / Math.max(1, tried)) * 100).toFixed(1)} %), di cui ${firstFour} fra i primi 4`);
const json = opt('--json');
if (json) await fs.writeFile(json, JSON.stringify({ universe: path.basename(dir), seeds, structures: out }, null, 1) + '\n');
