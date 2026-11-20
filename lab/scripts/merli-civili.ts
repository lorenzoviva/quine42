// T455: the structures and buildings a universe on disk wears that are not fortifications (`fortifiedOf`, T434) and whose program still
// includes the fort's parts (`part-battlements`, `part-slits`), and the ones the Sculptor could not sculpt again (`world/shortfalls.json`),
// without calls and without writing anything:
//   npx vite-node lab/scripts/merli-civili.ts -- universes/<nome> [universes/<nome>…] [--tipi]
// With `--tipi` only the list of ids, comma separated, for `npm run genera -- <nome> --rigenera modelli --tipi <elenco>`.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import type { ChunkRecord, ChunkStore } from '../../src/kernel/chunks';
import { regenerationTargets } from '../../src/kernel/regenerate';
import { fortifiedOf } from '../../src/kernel/agents/sculptor';
import { readShortfalls } from '../../src/kernel/shortfalls';

/** The fort's parts a program includes (`<import file="part-battlements">` or the name anywhere in it). */
export const FORT_PARTS = ['part-battlements', 'part-slits'] as const;
export const fortPartsIn = (program: string): string[] => FORT_PARTS.filter((p) => program.includes(p));

const args = process.argv.slice(2).filter((a) => a !== '--');
const onlyIds = args.includes('--tipi');
for (const arg of args.filter((a) => !a.startsWith('--'))) {
  const dir = path.resolve(arg);
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
  const places = await k.plannedPlaces();
  const targets = regenerationTargets(k, places, { classes: ['structure', 'building'] });
  const civil = targets
    .map((t) => ({ t, parts: fortPartsIn(k.files[`models/${t.id}.xml`] ?? ''), fortified: fortifiedOf(t.request) }))
    .filter((x) => !x.fortified && x.parts.length);
  const fortified = targets.filter((t) => fortifiedOf(t.request));
  // A structure the Sculptor could not sculpt again: the shortfall names the entry by its name («…» rigenerato).
  const models = k.forms.models();
  const failed: Array<{ id?: string; name: string; reason: string; after?: string }> = [];
  // Sculpted again since (a run that came later, T436): a commit of the Sculptor or of the regeneration on its program the day of the
  // shortfall or after. The shortfall stays in the file (nothing takes one out); the type is no longer one to do.
  const sculptedSince = (id: string, day: string) =>
    execFileSync('git', ['log', '--format=%cs %s', '--', `models/${id}.xml`], { cwd: dir, encoding: 'utf8' })
      .split('\n')
      .find((l) => /^\S+ (rigenerazione|scultore):/.test(l) && l.slice(0, 10) >= day)
      ?.slice(0, 10);
  for (const e of readShortfalls(up.files['world/shortfalls.json'])) {
    if (e.task !== 'model.sculpt') continue;
    const name = /«(.+)»/.exec(e.request)?.[1];
    if (!name) continue;
    const id = Object.entries(models).find(([, info]) => info.name === name)?.[0];
    const after = id ? sculptedSince(id, e.last) : undefined;
    failed.push({ id, name, reason: e.reason ?? '', ...(after ? { after } : {}) });
  }
  const ids = [...new Set([...civil.map((x) => x.t.id), ...failed.flatMap((f) => (f.id && !f.after ? [f.id] : []))])];
  if (onlyIds) {
    console.log(`${path.basename(dir)}: ${ids.join(',')}`);
    continue;
  }
  console.log(`== ${path.basename(dir)}: ${targets.length} strutture ed edifici indossati, ${fortified.length} fortificati (${fortified.map((t) => t.id).join(', ') || '-'})`);
  for (const x of civil) console.log(`  merli: ${x.t.id} (${x.t.info.class}${x.t.info.size ? ` ${x.t.info.size}` : ''}, «${x.t.request.nome}», ${x.t.wearers} indossano) — ${x.parts.join(', ')}`);
  for (const f of failed) console.log(`  mancanza: ${f.id ?? '(nessuna voce)'} «${f.name}»${f.after ? ` (riscolpito dopo, il ${f.after})` : ''} — ${f.reason.slice(0, 160)}`);
  console.log(`  tipi: ${ids.join(',') || '-'}`);
}
process.exit(0);
