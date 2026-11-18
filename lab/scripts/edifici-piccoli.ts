// T428 (ADR-0219): the buildings drawn as small as furniture. For every universe given (a folder of `universes/`), the entries of the library of
// the classes `building` and `structure` that the world wears (the modules, the common houses of the lots, the structures of the plans on disk),
// run at seed 1 as the game runs them (`Forms.request`, bare, `runForm`) and measured against the box of their class at their size (`classFit`):
//   npx vite-node lab/scripts/edifici-piccoli.ts -- universes/neapolis universes/aurora …   [--tutti] [--soglia 0.6] [--ripara]
// `--tutti` lists every entry, not only those under the threshold (the share of the class's side and height they reach). Without calls.
// `--ripara` writes in the universe the density that shows every small one at its class's measure (`vpt` in `models/index.json`, `classFit.fit`,
// the same program drawn larger) and commits it in the universe's repository: a repair without calls, until the regeneration of the models
// sculpts them again (`npm run genera -- <universo> --rigenera modelli --tipi <id,…>`). Without it, nothing is written.
// It found neapolis's small common house and newsstand, handmade programs of T273 at 25 × 25 × 24 voxels: under one tile on a lot of 4 × 4.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { MODELS_INDEX, runForm, vptOf } from '../../src/kernel/forms';
import { commonHouseModel } from '../../src/kernel/modeldirector';
import { classOf, tilesOf } from '../../src/mj/classes';
import { classFit } from '../../src/mj/check';
import type { ChunkStore } from '../../src/kernel/chunks';

const args = process.argv.slice(2).filter((a) => a !== '--');
const all = args.includes('--tutti');
const repair = args.includes('--ripara');
const at = args.indexOf('--soglia');
const threshold = at >= 0 ? Number(args[at + 1]) : 0.6;
const dirs = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--soglia');
const CLASSES = ['building', 'structure'];
const t = (v: readonly number[]) => v.map((x) => Math.round(x * 100) / 100).join(' × ');

for (const d of dirs) {
  const dir = path.resolve(d);
  const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 });
  const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
  const files: Record<string, string> = {};
  for (const p of tracked) if (!p.startsWith('maps/') && !p.startsWith('.')) files[p] = await fs.readFile(path.join(dir, p), 'utf8');
  const up = prepareUniverse(files, bundledFiles);
  const none: ChunkStore = { async load() { return undefined; }, async save() {}, async clear() {} };
  const k = await Kernel.boot({ files: up.files, store: memoryStore(), ai: new MockAiModels(), chunks: none });
  // Who wears what: the modules, the common houses of the lots, the structures of the plans on disk.
  const worn = new Map<string, string[]>();
  const wear = (id: string | undefined, who: string) => id && worn.set(id, [...(worn.get(id) ?? []), who]);
  for (const m of k.modules.values()) wear(m.manifest.appearance?.model, `modulo ${m.manifest.id}`);
  const house = k.commonHouse();
  if (house) for (const c of ['structure', 'building']) wear(commonHouseModel(house, c), `casa comune (lotti ${c === 'building' ? 'sotto 5' : 'da 5'})`);
  const maps = await fs.readdir(path.join(dir, 'maps')).catch(() => [] as string[]);
  for (const f of maps.filter((f) => f.endsWith('.json'))) {
    const rec = JSON.parse(await fs.readFile(path.join(dir, 'maps', f), 'utf8'));
    for (const s of rec.plan?.structures ?? []) {
      const concept = typeof s === 'string' ? s : s.concept;
      wear(k.structureModelOf(concept, typeof s === 'string' ? undefined : s.size), `struttura «${concept}» (${f.replace(/\.json$/, '')})`);
    }
  }
  console.log(`\n## ${path.basename(dir)}`);
  const fits: Record<string, number> = {};
  for (const [id, info] of Object.entries(k.forms.models())) {
    if (!CLASSES.includes(info.class) || /^(corona-|schermo-|circuito-|part-)/.test(id) || !worn.has(id)) continue;
    const req = k.forms.request(id, 1, undefined, { bare: true });
    if (!req) continue;
    let fit;
    try {
      const r = runForm(req);
      fit = classFit(r.grid, r.palette, vptOf(info), tilesOf(classOf(info.class)!, info.size), threshold);
    } catch (e) {
      console.log(`- ${id}: non gira (${(e as Error).message})`);
      continue;
    }
    if (fit.small) fits[id] = fit.fit;
    if (!all && !fit.small) continue;
    const who = worn.get(id)!;
    console.log(
      `- ${fit.small ? '**piccolo** ' : ''}${id} (${info.class}${info.size ? ` ${info.size}` : ''}, vpt ${vptOf(info)}, «${info.name ?? ''}», ${info.author ?? '?'}): ${t(fit.tiles)} caselle, la classe ${t(fit.box)} (${Math.round(fit.side * 100)} % del lato, ${Math.round(fit.height * 100)} % dell'altezza)${fit.small ? `; alla misura della classe a vpt ${fit.fit}` : ''}; lo indossano: ${who.slice(0, 4).join('; ')}${who.length > 4 ? ` e altri ${who.length - 4}` : ''}`,
    );
  }
  const ids = Object.keys(fits);
  if (!repair || !ids.length) continue;
  // The index as it is on the disk (a universe of before keeps its own field names until a load migrates it: the entry is found by its id).
  const file = path.join(dir, MODELS_INDEX);
  const index = JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, Record<string, unknown>>;
  for (const id of ids) if (index[id]) index[id] = { ...index[id], vpt: fits[id] };
  await fs.writeFile(file, `${JSON.stringify(index, null, 1)}\n`);
  git('add', '--', MODELS_INDEX);
  git('-c', 'user.name=Kernel', '-c', 'user.email=kernel@rune.local', 'commit', '-q', '-m', `riparazione (T428): ${ids.map((id) => `${id} a vpt ${fits[id]}`).join(', ')}, alla misura della classe`);
  console.log(`riparato: ${ids.map((id) => `${id} → vpt ${fits[id]}`).join(', ')} (commit ${git('rev-parse', '--short', 'HEAD').trim()})`);
}
process.exit(0);
