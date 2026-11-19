// T422: what the regeneration of the models (T411, ADR-0216) would do to a universe on disk, without calls and without writing anything:
//   npx vite-node lab/scripts/piano-rigenerazione.ts -- universes/<nome> [--progresso universes/.generation/<nome>.rigenera-modelli.json] [--ambienti <id,…>] [--lotti] [--bozze <cx,cy/cx,cy…>] [--prova <ambiente> <programma.json>]
// Its tracked files as the store gives them (the migrations, the seed), its plans from maps/ (the working tree: what a run saved and did not commit
// yet too), the types sculpted again, then `regenerationPlan`: each environment with places whose lots would not hold a structure at 16, how it is
// cut again or why it is kept; the structures that would stay at 20. With `--progresso` the steps a run did are done (as `regenerationSteps` reads
// them); with `--ambienti` the environments the Cartographer writes again whatever the kernel could do (T436); with `--prova` a program of an environment checked on its places as the
// Cartographer's is (the validator, `recutFaults`, the places laid out by it; T436); with `--bozze` the drafts of these places, as the Cartographer is told them, and their lots; with `--lotti` every planned place, its structures and the lots they stand on now.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import type { ChunkRecord, ChunkStore } from '../../src/kernel/chunks';
import type { MjNode } from '../../src/kernel/mj';
import { readStructure } from '../../src/kernel/agents/cartography';
import { recutFaults, regenerationPlan, regenerationTargets } from '../../src/kernel/regenerate';
import { classOf, tilesOf } from '../../src/mj/classes';

const args = process.argv.slice(2).filter((a) => a !== '--');
const dir = path.resolve(args[0]);
const opt = (k: string) => (args.indexOf(k) >= 0 ? args[args.indexOf(k) + 1] : undefined);
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 }).split('\0').filter(Boolean);
const files: Record<string, string> = {};
for (const p of tracked) if (!p.startsWith('maps/') && !p.startsWith('.')) files[p] = await fs.readFile(path.join(dir, p), 'utf8');
const up = prepareUniverse(files, bundledFiles);
const mapsDir = path.join(dir, 'maps');
const store: ChunkStore = {
  async load(key) {
    const t = await fs.readFile(path.join(mapsDir, `${key.replace(/[:,]/g, '_')}.json`), 'utf8').catch(() => undefined);
    return t ? (JSON.parse(t) as ChunkRecord) : undefined;
  },
  async save() {},
  async clear() {},
};
const backend = {
  name: path.basename(dir),
  async listMaps() {
    const out: Array<{ file: string; name: string; layout: string }> = [];
    for (const f of await fs.readdir(mapsDir)) if (f.endsWith('.json')) out.push({ file: f.slice(0, -5), name: '', layout: '' });
    return out;
  },
  commit: async () => null,
  checkout: async () => null,
  reset: async () => {},
};
const k = await Kernel.boot({ files: up.files, store: memoryStore(), ai: new MockAiModels(), chunks: store, backend });
const progress = opt('--progresso');
const done = new Set<string>(progress ? (JSON.parse(await fs.readFile(progress, 'utf8')).passi ?? []) : []);
const places = await k.plannedPlaces();
const targets = regenerationTargets(k, places);
const seed: Record<string, { program?: MjNode }> = {};
for (const [p, text] of Object.entries(bundledFiles)) if (p.endsWith('manifest.json')) Object.assign(seed, JSON.parse(text).layouts ?? {});
const plan = regenerationPlan(k, places, targets, seed, done, new Set(opt('--ambienti')?.split(',').filter(Boolean) ?? []));
const S = classOf('structure')!;
console.log(`${places.length} luoghi pianificati; ${targets.length} tipi (strutture: ${targets.filter((t) => t.info.class === 'structure').map((t) => t.id).join(', ')}); passi fatti: ${done.size}`);
if (args.includes('--lotti'))
  for (const p of places) {
    const lots = k.structureLotSizes(p.cx, p.cy, p.plan);
    const ss = (p.plan.structures ?? []).map(readStructure).map((s) => `${k.structureModelOf(s.concept, s.size)} (${s.size ?? '-'}, ${tilesOf(S, s.size)?.join('×') ?? '?'})`);
    console.log(`  ${p.cx},${p.cy} ${p.plan.layout}${p.plan.vpt ? ` vpt ${p.plan.vpt}` : ''}: ${ss.join(', ') || '-'} | lotti ${lots.map((l) => `${l.w}×${l.h}`).join(' ') || '-'}`);
  }
const tried = opt('--prova');
if (tried) {
  const program = JSON.parse(await fs.readFile(path.resolve(args[args.indexOf('--prova') + 2]), 'utf8')) as MjNode;
  const def = k.content.layouts[tried];
  const errs = def ? k.validator.validateLayout(tried, { ...def, program }, k.palette, k.sampleDrafts()) : [`ambiente sconosciuto: ${tried}`];
  const on = places.filter((p) => p.plan.layout === tried);
  console.log(`prova di ${tried}: validatore ${errs.length ? errs.join('; ') : 'ok'}; controlli ${errs.length ? '-' : recutFaults(k, on, program, targets).join('; ') || 'ok'}`);
  for (const p of on) {
    const lots = k.structureLotSizes(p.cx, p.cy, { ...p.plan, vpt: 16 }, program).map((l) => `${l.w}×${l.h}`).join(' ') || '-';
    console.log(`  ${p.cx},${p.cy} ${p.plan.place?.name ?? '?'}: strutture ${(p.plan.structures ?? []).length}, edifici ${lots}`);
    if (p.plan.structures?.length || args.includes('--tutte')) for (const r of k.placeLaidOut(p.cx, p.cy, { ...p.plan, vpt: 16 }, program)) console.log(`    ${r}`);
  }
}
for (const at of opt('--bozze')?.split('/').filter(Boolean) ?? []) {
  const [cx, cy] = at.split(',').map(Number);
  const p = places.find((q) => q.cx === cx && q.cy === cy);
  console.log(`bozza ${cx},${cy} ${p?.plan.place?.name ?? '?'} (${p?.plan.layout ?? '-'}): lotti ${p ? k.structureLotSizes(cx, cy, p.plan).map((l) => `${l.w}×${l.h}`).join(' ') || '-' : '-'}`);
  for (const r of k.placeDraft(cx, cy)) console.log(`    ${r}`);
}
for (const e of plan.environments) console.log(`ambiente ${e.id}: ${e.how}${e.why ? ` (${e.why})` : ''}; luoghi ${e.places.length}; strutture sui lotti che le tengono ${e.held}/${e.total} (prima ${e.before})`);
for (const [id, why] of plan.at20) console.log(`a 20: ${id} — ${why}`);
process.exit(0);
