// The rule 10 of the steps on the places of the seed (T474, ADR-0250): whether it is inert with the relief of today, and what it does on a
// synthetic plateau. The seed's kernel offline (the local models plan the places), the wanderer taken over a grid of points so that the places
// in reach are planned; for every planned place: the pairs of open tiles beside each other (walked or swum) and those more than a step apart
// on the kernel's levels (`groundAt`, as the collision reads them), the diagonals apart (not an edge: not counted by the rule), its network
// (ramps, enclaves kept and stranded, what only a rise parts from it, its roughness), the time to make it. With --rialzo N every place has a
// plateau N levels high in its middle (`syntheticRise`). No call to the models, nothing written but the report:
//
//   npx vite-node lab/scripts/rete-gradini.ts -- [--punti 18] [--rialzo 8] [--json f]

import { writeFileSync } from 'node:fs';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel, type Chunk } from '../../src/kernel/kernel';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { memoryStore } from '../../src/kernel/repo';
import { LEVEL } from '../../src/kernel/relief';
import { STEP, type Network } from '../../src/kernel/network';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const POINTS = Number(opt('punti', '18'));
const RISE = Number(opt('rialzo', '0'));
const out = opt('json');

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
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
const counts = { places: 0, pairs: 0, over: 0, diagonals: 0, ramps: 0, kept: 0, stranded: 0, apart: 0 };
const roughness: Record<string, number> = {};
const netMs: number[] = [];
const t0 = performance.now();
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
            if (!(swum(t) && swum(u)) && Math.abs(level(col, row) - level(col + dc, row + dr)) > STEP) counts.over++;
          }
          const d = k.tileAt(col + 1, row + 1);
          if (open(d) && planned(k.chunkAt(col + 1, row + 1)) && !(swum(t) && swum(d)) && Math.abs(level(col, row) - level(col + 1, row + 1)) > STEP) counts.diagonals++;
        }
    }
  }
const sorted = [...netMs].sort((a, b) => a - b);
const report = {
  rise: RISE,
  ...counts,
  roughness,
  networkMs: { median: sorted[sorted.length >> 1] ?? 0, p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0 },
  seconds: Math.round((performance.now() - t0) / 100) / 10,
};
console.log(JSON.stringify(report, null, 2));
if (out) writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
process.exit(0);
