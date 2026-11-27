// The rule 10 of the steps on the places of the seed (T474, ADR-0250): whether it is inert with the relief of today, and what it does on a
// synthetic plateau. The seed's kernel offline (the local models plan the places), the wanderer taken over a grid of points so that the places
// in reach are planned; for every planned place: the pairs of open tiles beside each other (walked or swum) and those more than a step apart
// on the kernel's levels (`groundAt`, as the collision reads them), the diagonals apart (not an edge: not counted by the rule), its network
// (ramps, enclaves kept and stranded, what only a rise parts from it, its roughness), the time to make it. With --rialzo N every place has a
// plateau N levels high in its middle (`syntheticRise`). No call to the models, nothing written but the report.
// The wanderer's walk plans the places as the game does, so two runs plan them differently (the timing of the local models): with
// --griglia R the places of a square of (2R + 1)² around the origin are planned one by one (`planAhead`) and stay loaded, the same at every
// run, so that two versions of the kernel can be compared pair by pair (`overPairs` in the JSON). Both count too the tiles where the
// network's level is not the feet's (`netDiff`, T504: none since the true relief levels each place alone) and the falls of the water
// between two places (`falls`: tiles of water beside each other across a border more than a step apart, swum as ever; the highest, `maxFall`):
//
//   npx vite-node lab/scripts/rete-gradini.ts -- [--punti 18 | --griglia 6] [--rialzo 8] [--vero] [--arcipelago] [--strada] [--json f]

import { writeFileSync } from 'node:fs';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel, type Chunk } from '../../src/kernel/kernel';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { memoryStore } from '../../src/kernel/repo';
import { LEVEL } from '../../src/kernel/relief';
import { STEP, type Network } from '../../src/kernel/network';
import { DEFAULT_NATURE } from '../../src/kernel/nature';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const POINTS = Number(opt('punti', '18'));
const RISE = Number(opt('rialzo', '0'));
const TRUE_RELIEF = argv.includes('--vero');
const ARCHIPELAGO = argv.includes('--arcipelago');
// With --strada the seed's path is called a road (T548): its new places have wide streets, which must leave the network as it was.
const ROAD = argv.includes('--strada');
const out = opt('json');
const GRID = opt('griglia') === undefined ? undefined : Number(opt('griglia'));

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const files = (() => {
  if (!TRUE_RELIEF && !ARCHIPELAGO && !ROAD) return bundledFiles;
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const terrain = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']);
  if (ROAD) terrain.tiles.p.name = 'strada';
  if (TRUE_RELIEF) terrain.tiles.k = { id: 'mountain', name: 'monte', description: 'roccia nuda di montagna', color: '#6e6a66', solid: false, cross: 'walk', layer: 'ground', speed: 0.9 };
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, ...(ARCHIPELAGO ? { geography: 'archipelago' } : {}), ...(TRUE_RELIEF ? { relief: 'true' } : {}) } }, null, 2) + '\n',
    'modules/world.terrain/manifest.json': JSON.stringify(terrain, null, 2) + '\n',
  };
})();
const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
const S = k.config.chunkSize;
if (RISE) {
  k.syntheticRise((c, r) => {
    const a = ((c % S) + S) % S, b = ((r % S) + S) % S;
    return a >= 6 && a <= 11 && b >= 6 && b <= 11 ? RISE : 0;
  });
}
k.carpet()!.active = false;
const pal = k.palette;
const open = (code: string | undefined) => !!code && (pal[code]?.solid === false || pal[code]?.cross === 'swim');
const swum = (code: string | undefined) => !!code && pal[code]?.cross === 'swim';
const level = (c: number, r: number) => Math.round(k.groundAt(c + 0.5, r + 0.5) / LEVEL);
const planned = (ch: Chunk | undefined) => ch?.stage === 'planned';

const seen = new Set<string>();
const counts = { places: 0, pairs: 0, over: 0, diagonals: 0, ramps: 0, kept: 0, stranded: 0, apart: 0, netDiff: 0, netPlaces: 0, falls: 0, maxFall: 0 };
const overPairs: string[] = [];
const roughness: Record<string, number> = {};
const netMs: number[] = [];
const t0 = performance.now();
/** The places as the wanderer's walk plans them (the game's way), or a square planned one by one (--griglia: the same at every run). */
async function* stations(): AsyncGenerator<void> {
  if (GRID !== undefined) {
    for (let cy = -GRID; cy <= GRID; cy++) for (let cx = -GRID; cx <= GRID; cx++) await k.planAhead(cx, cy);
    yield;
    return;
  }
  for (let j = 0; j < POINTS; j++)
    for (let i = 0; i < POINTS; i++) {
      const X = (i - (POINTS >> 1)) * 3 * S, Y = (j - (POINTS >> 1)) * 3 * S;
      const p = k.wandererPos();
      Object.assign(k.carpet()!, { ox: X - p.x, oy: Y - p.y });
      for (let n = 0; n < 400; n++) {
        k.tick(1 / 60);
        await pause(20);
        if ([...k.chunks.values()].filter((c) => k.inReach(c.cx * S + 1, c.cy * S + 1)).every((c) => c.stage !== 'draft')) break;
      }
      yield;
    }
}
for await (const _ of stations()) {
  for (const ch of k.chunks.values()) {
    if (!planned(ch) || seen.has(ch.key)) continue;
    seen.add(ch.key);
    counts.places++;
    const net = ch.network as Network | undefined;
    if (net) {
      counts.ramps += net.ramps.length;
      counts.kept += net.enclaves.filter((e) => e.kept).length;
      counts.stranded += net.stranded.length;
      counts.apart += net.apart.reduce((a, v) => a + v, 0);
      roughness[net.roughness] = (roughness[net.roughness] ?? 0) + 1;
      // The time of the network of the place again, as `applyPlan` makes it.
      const kk = k as unknown as { layoutOf(ch: Chunk, plan: unknown, path: string, quiet: boolean): { result: unknown }; networkOf(...a: unknown[]): Network; pathCode(): string };
      const { result } = kk.layoutOf(ch, ch.plan, kk.pathCode(), false);
      const lots = ch.blockLot ? [ch.blockLot, ...ch.lots] : ch.lots;
      const a = performance.now();
      kk.networkOf(ch, ch.plan, result, ch.tiles, lots);
      netMs.push(performance.now() - a);
      // The network's level against the feet's, tile by tile (T504).
      let diff = 0;
      for (let i = 0; i < S * S; i++) if (net.levels[i] !== level(ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S))) diff++;
      counts.netDiff += diff;
      if (diff) counts.netPlaces++;
    }
    for (let r = 0; r < S; r++)
      for (let c = 0; c < S; c++) {
        const col = ch.cx * S + c, row = ch.cy * S + r;
        const t = k.tileAt(col, row);
        if (!open(t)) continue;
        for (const [dc, dr] of [[1, 0], [0, 1]]) {
          const u = k.tileAt(col + dc, row + dr);
          if (!open(u) || !planned(k.chunkAt(col + dc, row + dr))) continue;
          counts.pairs++;
          const gap = Math.abs(level(col, row) - level(col + dc, row + dr));
          if (swum(t) && swum(u)) {
            if (gap > STEP && k.chunkAt(col + dc, row + dr) !== ch) (counts.falls++, (counts.maxFall = Math.max(counts.maxFall, gap)));
          } else if (gap > STEP) {
            counts.over++;
            overPairs.push(`${col},${row}>${col + dc},${row + dr}`);
          }
        }
        const d = k.tileAt(col + 1, row + 1);
        if (open(d) && planned(k.chunkAt(col + 1, row + 1)) && !(swum(t) && swum(d)) && Math.abs(level(col, row) - level(col + 1, row + 1)) > STEP) counts.diagonals++;
      }
  }
}
const sorted = [...netMs].sort((a, b) => a - b);
let reliefMs: { median: number; p95: number } | undefined;
if (TRUE_RELIEF) {
  const gen = (k as unknown as { genRelief(cx: number, cy: number, band: number): unknown }).genRelief.bind(k);
  const rms: number[] = [];
  for (let j = -4; j <= 4; j++)
    for (let i = -4; i <= 4; i++) {
      const a = performance.now();
      gen(i * 3, j * 3, 0);
      rms.push(performance.now() - a);
    }
  rms.sort((a, b) => a - b);
  reliefMs = { median: rms[rms.length >> 1] ?? 0, p95: rms[Math.floor(rms.length * 0.95)] ?? 0 };
}
const report = {
  rise: RISE,
  ...(GRID !== undefined ? { grid: GRID } : {}),
  trueRelief: TRUE_RELIEF,
  archipelago: ARCHIPELAGO,
  ...counts,
  roughness,
  networkMs: { median: sorted[sorted.length >> 1] ?? 0, p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0 },
  ...(reliefMs ? { reliefMs } : {}),
  seconds: Math.round((performance.now() - t0) / 100) / 10,
};
console.log(JSON.stringify(report, null, 2));
if (out) writeFileSync(out, JSON.stringify({ ...report, overPairs }, null, 2) + '\n');
process.exit(0);
