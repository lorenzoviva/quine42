// The cut towards the camera (T476, ADR-0257, row 3 of T459): how many open tiles the ground hides from the 3/4 camera on the places of the
// seed, with the relief of today and with the true relief (ADR-0256), at each of the camera's four quarters; how many are still hidden once
// the cut has lowered the columns of its disc to the head (`cameraCutAt`, `inCutDisc` not `around`); how long the test takes. The seed's
// kernel offline (the local models plan the places), the wanderer taken over a grid of points so that the places in reach are planned. No call
// to the models, nothing written but the report:
//
//   npx vite-node lab/scripts/taglio-camera.ts -- [--punti 6] [--vero] [--arcipelago] [--distanza 15] [--json f]

import { writeFileSync } from 'node:fs';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel, type Chunk } from '../../src/kernel/kernel';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { memoryStore } from '../../src/kernel/repo';
import { DEFAULT_NATURE } from '../../src/kernel/nature';
import { cameraCutAt, CUT_REACH, hiddenFromCamera, inCutDisc, type CameraLine, type Towards } from '../../src/kernel/underground';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const POINTS = Number(opt('punti', '6'));
const TRUE_RELIEF = argv.includes('--vero');
const ARCHIPELAGO = argv.includes('--arcipelago');
/** The camera's distance (tiles): 15 the simulation's view (renderer.ts, `ZOOM.max`), 30 at the helm, 45 the free orbit. */
const DISTANCE = Number(opt('distanza', '15'));
const out = opt('json');
const PITCH = 0.95;

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const files = (() => {
  if (!TRUE_RELIEF && !ARCHIPELAGO) return bundledFiles;
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const terrain = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']);
  if (TRUE_RELIEF) terrain.tiles.k = { id: 'mountain', name: 'monte', description: 'roccia nuda di montagna', color: '#6e6a66', solid: false, cross: 'walk', layer: 'ground', speed: 0.9 };
  return {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, ...(ARCHIPELAGO ? { geography: 'archipelago' } : {}), ...(TRUE_RELIEF ? { relief: 'true' } : {}) } }, null, 2) + '\n',
    'modules/world.terrain/manifest.json': JSON.stringify(terrain, null, 2) + '\n',
  };
})();
const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
const S = k.config.chunkSize;
k.carpet()!.active = false;
const pal = k.palette;
const open = (code: string | undefined) => !!code && pal[code]?.solid === false;
const planned = (ch: Chunk | undefined) => ch?.stage === 'planned';
const QUARTERS: Towards[] = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }];
const line = (towards: Towards): CameraLine => ({ towards, rise: Math.tan(PITCH), reach: Math.cos(PITCH) * DISTANCE });
const top = (x: number, y: number) => k.groundAt(x + 0.5, y + 0.5);
// The top of a column once the cut has lowered those of its disc to the head (what the shaders and the caps do).
const cutTop = (cut: { cut: number; tile: { x: number; y: number } }, towards: Towards) => (x: number, y: number) =>
  inCutDisc(x - cut.tile.x, y - cut.tile.y, towards, false) ? Math.min(top(x, y), cut.cut) : top(x, y);
// Still hidden by what is past the disc (`CUT_REACH`): the line asked as far as the camera, with the disc cut.
const stillHidden = (cut: { cut: number; tile: { x: number; y: number } }, towards: Towards, mid: number) => {
  const far = Math.cos(PITCH) * DISTANCE;
  for (let s = 1; s <= Math.round(far); s++) {
    const x = cut.tile.x + towards.x * s, y = cut.tile.y + towards.y * s;
    if (cutTop(cut, towards)(x, y) > mid + Math.tan(PITCH) * (s - 0.5)) return true;
  }
  return false;
};

const seen = new Set<string>();
const counts = { places: 0, tiles: 0, views: 0, hidden: 0, after: 0, beyond: 0 };
const byQuarter = QUARTERS.map(() => 0);
const ms: number[] = [];
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
      for (let r = 0; r < S; r++)
        for (let c = 0; c < S; c++) {
          const col = ch.cx * S + c, row = ch.cy * S + r;
          if (!open(k.tileAt(col, row))) continue;
          counts.tiles++;
          const floor = k.floorAt(col + 0.5, row + 0.5);
          QUARTERS.forEach((towards, q) => {
            counts.views++;
            const a = performance.now();
            const cut = cameraCutAt(col + 0.5, row + 0.5, floor, top, line(towards));
            ms.push(performance.now() - a);
            // Hidden as far as the camera, the disc's reach or not.
            const far = { ...line(towards), reach: Math.min(line(towards).reach, 64) };
            const tile = { x: col, y: row };
            const mid = floor + 0.6;
            let hiddenFar = false;
            for (let s = 1; s <= Math.round(far.reach) && !hiddenFar; s++) hiddenFar = top(col + towards.x * s, row + towards.y * s) > mid + far.rise * (s - 0.5);
            if (!cut) {
              if (hiddenFar) counts.beyond++;
              return;
            }
            counts.hidden++;
            byQuarter[q]!++;
            if (hiddenFromCamera(cutTop(cut, towards), tile, mid, line(towards)) || stillHidden(cut, towards, mid)) counts.after++;
          });
        }
    }
  }
const sorted = [...ms].sort((a, b) => a - b);
const pct = (n: number) => Math.round((1000 * n) / Math.max(1, counts.views)) / 10;
const report = {
  trueRelief: TRUE_RELIEF,
  archipelago: ARCHIPELAGO,
  distance: DISTANCE,
  reachTiles: Math.round(Math.cos(PITCH) * DISTANCE * 10) / 10,
  cutReach: CUT_REACH,
  ...counts,
  hiddenPct: pct(counts.hidden),
  afterPct: pct(counts.after),
  beyondPct: pct(counts.beyond),
  byQuarter: { south: byQuarter[0], east: byQuarter[1], north: byQuarter[2], west: byQuarter[3] },
  testMs: { median: sorted[sorted.length >> 1] ?? 0, p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0 },
  seconds: Math.round((performance.now() - t0) / 100) / 10,
};
console.log(JSON.stringify(report, null, 2));
if (out) writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
process.exit(0);
