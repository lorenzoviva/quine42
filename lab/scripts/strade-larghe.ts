// T548: what the wide streets would change in a universe on disk, without writing anything:
//   npx vite-node lab/scripts/strade-larghe.ts -- universes/<nome> [--mostra 2] [--json f]
// Its tracked files as the browser takes them, a kernel on the local models, then every plan of its name and seed in maps/ laid out twice on
// its own draft: as it is (a plan of before, no mark) and with the mark of the wide streets (`streets: true`, what a new place of it gets).
// Per place: the cells the street changed, the road and the sidewalk before and after, and whether what is walked and what is reached are
// the same (they must be: only codes of the ground one walks change). Then the street of the world (its road, its width, its sidewalk) and,
// with --mostra N, the grids of the N places that change most, before and after. The insets its terrains get by name (C4) are listed too.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { readConfig } from '../../src/kernel/universe';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { defaultCodes } from '../../src/kernel/stamps';
import { streetOf } from '../../src/kernel/streets';
import { insetOf } from '../../src/kernel/inset';
import type { ChunkPlan } from '../../src/kernel/agents/cartography';

const args = process.argv.filter((a) => a !== '--').slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dir = path.resolve(args[0]!);
const show = Number(opt('--mostra') ?? 0);
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 }).split('\0').filter(Boolean);
const files: Record<string, string> = {};
for (const p of tracked) if (!p.startsWith('maps/') && !p.startsWith('.')) files[p] = await fs.readFile(path.join(dir, p), 'utf8');
const up = prepareUniverse(files, bundledFiles);
const cfg = readConfig(up.files).config;
const k = await Kernel.boot({ files: up.files, store: memoryStore(), ai: new MockAiModels() });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const kk = k as any;
const pal = k.palette;
const pathCode: string = kk.pathCode();
const base = defaultCodes(pal, pathCode).ground;
console.log(`# ${path.basename(dir)} (${cfg.name}, seme ${cfg.seed})`);
console.log(`la via del layout: "${pathCode}" ${pal[pathCode]?.name}; il suolo di base: "${base}" ${pal[base]?.name}`);
const insets = Object.entries(pal).filter(([c, t]) => insetOf(t, c)).map(([c, t]) => `"${c}" ${t.name} ${insetOf(t, c)}`);
console.log(`il rientro dal nome: ${insets.join(', ') || 'nessun terreno'}`);
const ways = Object.entries(k.content.layouts).map(([id, def]) => [id, streetOf(pal, pathCode, base, def)] as const);
const any = ways.find(([, s]) => s)?.[1];
console.log(any ? `la strada: larga ${any.width}, marciapiede ${any.sidewalk ? `"${any.sidewalk}" ${pal[any.sidewalk]?.name}` : `il suolo di base "${base}"`}` : 'nessuna strada larga: la via del layout non è una strada');
const S = k.config.chunkSize;
const maps = (await fs.readdir(path.join(dir, 'maps'))).filter((f) => f.startsWith(`${cfg.name}_${cfg.seed}_`) && f.endsWith('.json'));
type Row = { key: string; name: string; layout: string; changed: number; roadBefore: number; roadAfter: number; sideBefore: number; sideAfter: number; same: boolean; before: string; after: string };
const rows: Row[] = [];
const count = (t: string, c: string | undefined) => (c ? [...t].filter((x) => x === c).length : 0);
for (const f of maps) {
  const m = /_(-?\d+)_(-?\d+)\.json$/.exec(f)!;
  const cx = Number(m[1]), cy = Number(m[2]);
  const rec = JSON.parse(await fs.readFile(path.join(dir, 'maps', f), 'utf8')) as { plan?: ChunkPlan };
  if (!rec.plan) continue;
  const plan = { ...rec.plan };
  delete plan.streets;
  const draft: string = kk.genDraft(cx, cy, plan);
  const ch = { cx, cy, draft };
  const a = kk.layoutOf(ch, plan, pathCode, true);
  const b = kk.layoutOf(ch, { ...plan, streets: true }, pathCode, true);
  const walked = (t: string) => [...t].map((c) => (pal[c]?.solid === false ? 1 : 0)).join('');
  const same = walked(a.tiles) === walked(b.tiles) && [...a.result.reachable].sort().join() === [...b.result.reachable].sort().join();
  let changed = 0;
  for (let i = 0; i < a.tiles.length; i++) if (a.tiles[i] !== b.tiles[i]) changed++;
  const side = any?.sidewalk ?? base;
  rows.push({ key: `${cx},${cy}`, name: plan.place?.name ?? '', layout: plan.layout, changed, roadBefore: count(a.tiles, pathCode), roadAfter: count(b.tiles, pathCode), sideBefore: count(a.tiles, side), sideAfter: count(b.tiles, side), same, before: a.tiles, after: b.tiles });
}
const sum = (f: (r: Row) => number) => rows.reduce((s, r) => s + f(r), 0);
console.log(`luoghi: ${rows.length}; che cambiano: ${rows.filter((r) => r.changed).length}; caselle cambiate: ${sum((r) => r.changed)} (${(sum((r) => r.changed) / Math.max(1, rows.length)).toFixed(1)} a luogo)`);
console.log(`strada: ${sum((r) => r.roadBefore)} → ${sum((r) => r.roadAfter)} caselle; marciapiede: ${sum((r) => r.sideBefore)} → ${sum((r) => r.sideAfter)}`);
console.log(`ciò che si cammina e ciò che si raggiunge uguali in ogni luogo: ${rows.every((r) => r.same) ? 'sì' : `NO (${rows.filter((r) => !r.same).map((r) => r.key).join(' ')})`}`);
const byLayout = new Map<string, number>();
for (const r of rows) byLayout.set(r.layout, (byLayout.get(r.layout) ?? 0) + r.changed);
console.log(`per ambiente: ${[...byLayout].sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} ${n}`).join(', ')}`);
for (const r of [...rows].sort((a, b) => b.changed - a.changed).slice(0, show)) {
  console.log(`\n## ${r.key} «${r.name}» (${r.layout}): ${r.changed} caselle`);
  for (let y = 0; y < S; y++) console.log(`${r.before.slice(y * S, y * S + S)}   ${r.after.slice(y * S, y * S + S)}`);
}
const out = opt('--json');
if (out) await fs.writeFile(out, JSON.stringify(rows.map(({ before, after, ...r }) => r), null, 1));
process.exit(0);
