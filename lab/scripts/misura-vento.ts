// La risoluzione del vento (T484, A2 di T459, D3 di D67): quanto costa il `wind` del kernel a ogni cella (0,5, 1, 2, 3 caselle per cella)
// accanto all'acqua a due celle per lato di casella (`flow` a `cell: 0.5`, 60 Hz), sull'implementazione vera (`src/kernel/automata.ts`) e
// sulla finestra di riferimento di T459 (6 × 5 luoghi, 108 × 90 caselle); il passo intero contro il passo spezzato nei tick fra due
// (`WindField.work`, il picco di un tick); il carico statico (`totalLoadMs`) contro il bilancio fisso; la vista grossolana ai client
// (`windViewOf`: quanto costa farla, quanti byte a messaggio e al secondo). Senza modelli, senza browser.
//
//   npx vite-node lab/scripts/misura-vento.ts -- [--ripeti 60] [--json lab/terreno-3d/misure/vento.json] [--md lab/terreno-3d/misure/vento.md]

import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import {
  AutomataEngine,
  automatonLoadMs,
  LOAD_BUDGET_MS,
  REF_WINDOW,
  TICK_HZ,
  totalLoadMs,
  WindField,
  type AutomataWorld,
  type AutomatonSpec,
  type CellSize,
} from '../../src/kernel/automata';
import { relativeWind, WIND_VIEW, windViewOf } from '../../src/kernel/wind';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const REPEAT = Number(opt('--ripeti') ?? 60);

/** The reference window: 6 × 5 places of 18 tiles, a massif in the north-east the wind goes round, the sea on the west edge. */
function refWorld(): AutomataWorld {
  const chunks: Array<[number, number]> = [];
  for (let cy = 0; cy < 5; cy++) for (let cx = 0; cx < 6; cx++) chunks.push([cx, cy]);
  return {
    seed: 4242,
    chunkSize: 18,
    loadedChunks: () => chunks,
    tileAt: (c) => (c < 6 ? 'o' : 'g'),
    groundAt: (c, r) => {
      const dx = c - 78, dy = r - 30;
      const d = Math.sqrt(dx * dx + dy * dy);
      return c < 6 ? -1 : 1 + Math.max(0, 9 - d * 0.6) + ((c * 7 + r * 13) % 5) * 0.25;
    },
    seaLevel: () => 0,
    days: () => 0.3,
  };
}

const stats = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]!;
  return { median: q(0.5), p95: q(0.95), max: s[s.length - 1]! };
};
const r3 = (v: number) => Math.round(v * 1000) / 1000;

// 1. A whole step of the wind at every cell, by itself.
const cells: CellSize[] = [0.5, 1, 2, 3];
const stepRows = cells.map((cell) => {
  const W = Math.round(REF_WINDOW.w / cell), H = Math.round(REF_WINDOW.h / cell);
  const f = new WindField(0, 0, W, H, cell, { tau: 0.58, prevailing: [0.06, 0.02] });
  const world = refWorld();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f.solid[y * W + x] = world.groundAt(Math.floor((x + 0.5) * cell), Math.floor((y + 0.5) * cell)) > 3 ? 1 : 0;
  for (let i = 0; i < 20; i++) f.step();
  const times: number[] = [];
  for (let i = 0; i < REPEAT; i++) {
    const t0 = performance.now();
    f.step();
    times.push(performance.now() - t0);
  }
  const st = stats(times);
  const spec: AutomatonSpec = { id: 'wind', family: 'wind', cell, hz: 10 };
  return { cell, cells: W * H, ...st, nsPerCell: (st.median * 1e6) / (W * H), msPerTick10Hz: (st.median * 10) / TICK_HZ, staticMsPerTick: automatonLoadMs(spec) };
});

// 2. The water at two cells a tile side and the wind beside it, a tick at a time: whole steps against steps cut in the ticks between two.
function ticks(windCell: CellSize, sliced: boolean): { median: number; p95: number; max: number; windPeak: number } {
  const specs: AutomatonSpec[] = [
    { id: 'water', family: 'flow', cell: 0.5, hz: 60, sources: ['o'] },
    { id: 'wind', family: 'wind', cell: windCell, hz: 10 },
  ];
  const eng = new AutomataEngine(refWorld(), specs);
  eng.syncWindow();
  for (let t = 0; t < 60; t++) eng.tick(false);
  const grid = eng.gridsOf('wind')[0] as WindField;
  // As before T484: the wind whole in the tick its accumulator says, nothing in the ticks between (the same engine, the same flow).
  if (!sliced) {
    const whole = WindField.prototype.work;
    grid.work = function (this: WindField, units: number) {
      return units >= this.units - this.done ? whole.call(this, units) : false;
    };
  }
  const times: number[] = [];
  let windPeak = 0;
  for (let t = 0; t < REPEAT * 6; t++) {
    const before = grid.done;
    const t0 = performance.now();
    eng.tick(false);
    const dt = performance.now() - t0;
    times.push(dt);
    if (!sliced && before === 0 && eng.stepCount('wind') > 0 && t % 6 === 5) windPeak = Math.max(windPeak, dt);
  }
  return { ...stats(times), windPeak };
}
const tickRows = ([1, 2, 3] as CellSize[]).flatMap((cell) => [
  { cell, sliced: false, ...ticks(cell, false) },
  { cell, sliced: true, ...ticks(cell, true) },
]);
const half = { cell: 0.5 as CellSize, sliced: true, ...ticks(0.5, true) };

// 2b. The wind alone, cut in the ticks between two: what each tick pays of it.
const alone = ([1, 2, 3] as CellSize[]).map((cell) => {
  const eng = new AutomataEngine(refWorld(), [{ id: 'wind', family: 'wind', cell, hz: 10 }]);
  eng.syncWindow();
  for (let t = 0; t < 60; t++) eng.tick(false);
  const times: number[] = [];
  for (let t = 0; t < REPEAT * 6; t++) {
    const t0 = performance.now();
    eng.tick(false);
    times.push(performance.now() - t0);
  }
  return { cell, ...stats(times) };
});

// 3. The static load against the fixed budget.
const loads = cells.map((cell) => {
  const specs: AutomatonSpec[] = [
    { id: 'water', family: 'flow', cell: 0.5, hz: 60 },
    { id: 'wind', family: 'wind', cell, hz: 10 },
  ];
  const withSmoke: AutomatonSpec[] = [...specs, { id: 'smoke', family: 'diffuse', cell: 1, hz: 10, advect: 'wind' }, { id: 'fire', family: 'table', cell: 1, hz: 10, states: 3, counted: 1, rules: [{ from: 0, min: 1, max: 8, to: 1, p: 0.2 }, { from: 1, min: 0, max: 8, to: 2, p: 1 }] }];
  return { cell, waterAndWind: totalLoadMs(specs), withSmokeAndFire: totalLoadMs(withSmoke), fits: totalLoadMs(specs) <= LOAD_BUDGET_MS + 1e-9, fitsAll: totalLoadMs(withSmoke) <= LOAD_BUDGET_MS + 1e-9 };
});

// 4. The coarse view a client gets.
const view = (() => {
  const eng = new AutomataEngine(refWorld(), [{ id: 'wind', family: 'wind', cell: 1, hz: 10 }]);
  eng.syncWindow();
  for (let t = 0; t < 120; t++) eng.tick(false);
  const p = relativeWind(...(eng.prevailing('wind') ?? [0, 0]));
  const times: number[] = [];
  let bytes = 0;
  for (let i = 0; i < REPEAT; i++) {
    const t0 = performance.now();
    const v = windViewOf(54, 45, p, (x, y) => {
      const s = eng.sample('wind', x, y);
      return s && typeof s === 'object' ? relativeWind(s.vx, s.vy) : undefined;
    });
    times.push(performance.now() - t0);
    bytes = JSON.stringify({ wind: v }).length;
  }
  return { ...stats(times), cells: (WIND_VIEW.tiles[0] / WIND_VIEW.cell) * (WIND_VIEW.tiles[1] / WIND_VIEW.cell), bytesPerMessage: bytes, bytesPerSecond: bytes * WIND_VIEW.hz };
})();

const out = { date: new Date().toISOString().slice(0, 10), node: process.version, repeat: REPEAT, window: REF_WINDOW, budget: LOAD_BUDGET_MS, step: stepRows, ticks: [...tickRows, half], alone, loads, view };

const lines: string[] = [];
lines.push(`# La risoluzione del vento (T484)`, '', `Node ${process.version}, ${REPEAT} ripetizioni, finestra ${REF_WINDOW.w} × ${REF_WINDOW.h} caselle, bilancio ${LOAD_BUDGET_MS} ms/tick.`, '');
lines.push('## Il passo intero del vento, da solo', '', '| cella (caselle) | celle | mediana ms | p95 ms | ns/cella | ms/tick a 10 Hz | statico ms/tick |', '|---:|---:|---:|---:|---:|---:|---:|');
for (const r of stepRows) lines.push(`| ${r.cell} | ${r.cells} | ${r3(r.median)} | ${r3(r.p95)} | ${r3(r.nsPerCell)} | ${r3(r.msPerTick10Hz)} | ${r3(r.staticMsPerTick)} |`);
lines.push('', '## Un tick con l’acqua a due celle (60 Hz) e il vento accanto (10 Hz)', '', '| vento, cella | passo | tick mediana ms | p95 ms | massimo ms |', '|---:|---|---:|---:|---:|');
for (const r of [...tickRows, half]) lines.push(`| ${r.cell} | ${r.sliced ? 'spezzato' : 'intero'} | ${r3(r.median)} | ${r3(r.p95)} | ${r3(r.max)} |`);
lines.push('', '## Il vento da solo, spezzato nei tick fra due passi', '', '| cella | ms a tick, mediana | p95 | massimo |', '|---:|---:|---:|---:|');
for (const r of alone) lines.push(`| ${r.cell} | ${r3(r.median)} | ${r3(r.p95)} | ${r3(r.max)} |`);
lines.push('', '## Il carico statico contro il bilancio', '', '| vento, cella | acqua + vento ms/tick | entra | + fumo e fuoco ms/tick | entra |', '|---:|---:|---|---:|---|');
for (const r of loads) lines.push(`| ${r.cell} | ${r3(r.waterAndWind)} | ${r.fits ? 'sì' : 'no'} | ${r3(r.withSmokeAndFire)} | ${r.fitsAll ? 'sì' : 'no'} |`);
lines.push('', '## La vista grossolana ai client', '', `${view.cells} celle (una ogni ${WIND_VIEW.cell} caselle su ${WIND_VIEW.tiles.join(' × ')}), farla ${r3(view.median)} ms (p95 ${r3(view.p95)}), ${view.bytesPerMessage} byte a messaggio, ${view.bytesPerSecond} al secondo a ${WIND_VIEW.hz} Hz.`);
const md = lines.join('\n') + '\n';
console.log(md);
const json = opt('--json');
if (json) writeFileSync(json, JSON.stringify(out, null, 2) + '\n');
const mdOut = opt('--md');
if (mdOut) writeFileSync(mdOut, md);
