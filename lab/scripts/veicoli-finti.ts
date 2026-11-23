// T487: the vehicles of the Council in a universe on disk, without opening it in a browser and without writing anything:
//   npx vite-node lab/scripts/veicoli-finti.ts -- universes/<nome> [--luoghi 4]
// What the repair of the kernel would do (`repairVehicleClaims`: the modules the Council forged that present themselves as vehicles and have
// no `vehicle`, the barge of `orichalcum`), then a kernel on the local models opens it with the plans of maps/, around where its wanderer
// stands, and says where every vehicle of a place came in: the place, the tile under it, whether its hull floats, whether a shore is near.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { readConfig } from '../../src/kernel/universe';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { carries, vehicleSpecOf } from '../../src/kernel/vehicle';
import { repairVehicleClaims } from '../../src/kernel/vehicleclaim';
import type { ChunkRecord, ChunkStore } from '../../src/kernel/chunks';

const args = process.argv.slice(2).filter((a) => a !== '--');
const dir = path.resolve(args.find((a) => !a.startsWith('--'))!);
const reach = Number(args[args.indexOf('--luoghi') + 1]) || 4;
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 }).split('\0').filter(Boolean);
const files: Record<string, string> = {};
for (const p of tracked) if (!p.startsWith('maps/') && !p.startsWith('.')) files[p] = await fs.readFile(path.join(dir, p), 'utf8');
const up = prepareUniverse(files, bundledFiles);
const cfg = readConfig(up.files).config;
const { repaired, changes } = repairVehicleClaims(up.files);
console.log(`${cfg.name}: ${repaired.length ? `la riparazione dà vehicle a ${repaired.join(', ')}` : 'niente da riparare'}`);
for (const [p, c] of Object.entries(changes)) console.log(`  ${p}: vehicle ${JSON.stringify(JSON.parse(c).vehicle)}, classe ${JSON.parse(c).appearance?.class}`);
const store: ChunkStore = {
  async load(key) {
    const t = await fs.readFile(path.join(dir, 'maps', `${key.replace(/[:,]/g, '_')}.json`), 'utf8').catch(() => undefined);
    return t ? (JSON.parse(t) as ChunkRecord) : undefined;
  },
  async save() {},
  async clear() {},
};
const k = await Kernel.boot({ files: up.files, store: memoryStore(), ai: new MockAiModels(), chunks: store });
console.log(`commit della riparazione: ${k.repo.log().filter((c) => c.message.startsWith('riparazione: si guidano')).map((c) => c.message).join('; ') || 'nessuno'}`);
const S = k.config.chunkSize;
const w = k.wandererCarpet();
const [wx, wy] = [Math.floor(w.x / S), Math.floor(w.y / S)];
const placed: Array<{ id: number; place: string; module?: string }> = [];
k.bus.on('vehicle:placed', (e: { id: number; place: string }) => placed.push({ ...e, module: k.ecs.get(e.id, 'module')?.id }));
for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) await k.planAhead(wx + dx, wy + dy);
// The places near the wanderer come into the world as the game loads them.
for (let i = 0; i < 400; i++) {
  k.tick(1 / 30);
  if (i % 20 === 0) await new Promise((r) => setTimeout(r, 5));
}
console.log(`il viandante è nel luogo ${wx},${wy}; veicoli nel mondo: ${k.ecs.query('vehicle').length}`);
for (const { id, place, module } of placed) {
  const p = k.ecs.get(id, 'pos');
  const m = k.modules.get(module ?? '')?.manifest;
  const spec = vehicleSpecOf(m?.vehicle);
  const name = k.chunks.get(place)?.place?.name ?? place;
  // At its berth a vehicle is of its place (ADR-0244): it leaves the world with it (a wanderer saved dead wakes in the square, T501).
  if (!p) {
    console.log(`  ${module ?? '?'} in «${name}» (${place}): nato e uscito dal mondo col suo luogo`);
    continue;
  }
  const t = k.tileAt(Math.floor(p.x), Math.floor(p.y));
  const shore = [...Array(7)].some((_, a) => [...Array(7)].some((_, b) => ((x) => !!x && !k.palette[x]?.solid)(k.tileAt(Math.floor(p.x) + a - 3, Math.floor(p.y) + b - 3))));
  console.log(`  ${m?.id} in «${name}» (${place}) a ${p.x.toFixed(1)},${p.y.toFixed(1)}: su «${t}» ${k.palette[t ?? '']?.name ?? '?'}, galleggia ${spec ? carries(spec, k.palette[t ?? '']) : '?'}, riva vicina ${shore}, menu ${k.actionsFor(id).map((o) => o.id).join(',') || '-'}`);
}
process.exit(0);
