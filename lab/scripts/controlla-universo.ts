// T421: how a universe on disk opens, without opening it in a browser and without writing anything:
//   npx vite-node lab/scripts/controlla-universo.ts -- universes/<nome>
// Its tracked files as the browser takes them (`prepareUniverse` with this kernel's seed: the migrations, then the seed), the name and the seed
// its universe.json says, then a kernel on the local models asks every plan of that name and seed in maps/ (`planAhead`: `noto` is a plan read
// from the disk). Plans of another name or seed are listed: the kernel never reads them. It found neapolis opening as «aurora», seed 1337.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { readConfig } from '../../src/kernel/universe';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import type { ChunkRecord, ChunkStore } from '../../src/kernel/chunks';

const dir = path.resolve(process.argv.filter((a) => a !== '--')[2]);
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 }).split('\0').filter(Boolean);
const files: Record<string, string> = {};
for (const p of tracked) if (!p.startsWith('maps/') && !p.startsWith('.')) files[p] = await fs.readFile(path.join(dir, p), 'utf8');
const up = prepareUniverse(files, bundledFiles);
const cfg = readConfig(up.files).config;
console.log(`universe.json: ${cfg.name} seme ${cfg.seed}; migrazioni: ${up.applied.map((a) => a.split(':')[0]).join(', ') || 'nessuna'}; file cambiati al caricamento: ${Object.keys(up.changes).length}`);
const maps = (await fs.readdir(path.join(dir, 'maps'))).filter((f) => f.endsWith('.json'));
const loaded = new Set<string>();
const store: ChunkStore = {
  async load(key) {
    const f = path.join(dir, 'maps', `${key.replace(/[:,]/g, '_')}.json`);
    const t = await fs.readFile(f, 'utf8').catch(() => undefined);
    if (t) loaded.add(path.basename(f));
    return t ? (JSON.parse(t) as ChunkRecord) : undefined;
  },
  async save() {},
  async clear() {},
};
const k = await Kernel.boot({ files: up.files, store: memoryStore(), ai: new MockAiModels(), chunks: store });
const prefix = `${cfg.name}_${cfg.seed}_`;
const mine = maps.filter((f) => f.startsWith(prefix));
const said: Record<string, number> = {};
for (const f of mine) {
  const m = /_(-?\d+)_(-?\d+)\.json$/.exec(f)!;
  const r = await k.planAhead(Number(m[1]), Number(m[2]));
  said[r] = (said[r] ?? 0) + 1;
}
const structures = mine.filter((f) => loaded.has(f)).length;
console.log(`piani su disco: ${maps.length}; col prefisso ${prefix}: ${mine.length}; letti dal kernel: ${structures}; planAhead: ${JSON.stringify(said)}; guasti: ${k.faults?.list?.().length ?? '?'}`);
const others = maps.filter((f) => !f.startsWith(prefix)).map((f) => f.replace(/_-?\d+_-?\d+\.json$/, ''));
if (others.length) console.log(`piani di un altro nome o seme: ${[...new Set(others)].join(', ')} (${others.length})`);
process.exit(0);
