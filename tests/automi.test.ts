// Cellular automata primitive (T482, row 9 of T459, ADR-0254, D67 D3):
// - Five kernel families (`flow` at 2 cells/tile side under D3, `wind` D2Q9, `diffuse` with optional advection, `table`, `rules` on Stepper)
// - Parameters as data within fixed limits and static load budget (`LOAD_BUDGET_MS`), never wall-clock capped
// - Byte-for-byte determinism across independent engines and kernels, seeded from the world's seed
// - World pace (`pace: hold`) stops all automata; `physics.automaton` via the Physicist and Referente; `world.field` / `world.field_add`

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  AutomataEngine,
  automatonLoadMs,
  clusterChunks,
  DEFAULT_CELL,
  DiffuseField,
  FlowField,
  LOAD_BUDGET_MS,
  MAX_AUTOMATA,
  MAX_CELLS_PER_AUTOMATON,
  REF_WINDOW,
  refCellsOf,
  repairAutomata,
  RulesField,
  rulesProgramErrors,
  TableField,
  totalLoadMs,
  validateAutomata,
  validateAutomaton,
  WindField,
  type AutomataWorld,
  type AutomatonSpec,
  type FlowSample,
  type WindSample,
} from '../src/kernel/automata';
import { AUTOMATON_TASK } from '../src/kernel/agents/physicist';
import { bundledFiles } from '../src/kernel/bundle';
import { CENSUS } from '../src/kernel/coefficients';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { DEFAULT_NATURE, repairNature } from '../src/kernel/nature';
import { memoryStore } from '../src/kernel/repo';
import { apiErrors, LUA_API } from '../src/kernel/validator';
import { fakeLink } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';

const DT = 1 / 60;

const FIRE_RULES_XML = `<sequence values="FBA" symmetry="(xy)">
  <convolution neighborhood="Moore" steps="1">
    <rule in="F" out="B" sum="1..8" values="B" p="0.35"/>
    <rule in="B" out="A"/>
  </convolution>
</sequence>`;

const PRL_RULES_XML = `<sequence values="AB" symmetry="(xy)">
  <prl in="AB" out="BB" p="0.5" steps="1"/>
</sequence>`;

const FULL_FIVE: AutomatonSpec[] = [
  { id: 'water', family: 'flow', cell: 0.5, hz: 60, gravity: 9.8, damp: 0.995, sources: ['o'] },
  { id: 'wind', family: 'wind', cell: 3, hz: 10, tau: 0.58, prevailing: [0.06, 0.02], layerHeight: 3 },
  { id: 'smoke', family: 'diffuse', cell: 1, hz: 10, rate: 0.2, decay: 0.005, advect: 'wind', advectScale: 1 },
  {
    id: 'fire',
    family: 'table',
    cell: 1,
    hz: 10,
    states: 3,
    counted: 1,
    rules: [
      { from: 0, min: 1, max: 8, to: 1, p: 0.25 },
      { from: 1, min: 0, max: 8, to: 2, p: 1 },
    ],
    walls: ['w', 'o'],
  },
  { id: 'moss', family: 'rules', cell: 1, hz: 10, program: FIRE_RULES_XML, steps: 1 },
];

function makeWorld(opts: { seed?: number; chunks?: Array<[number, number]>; tile?: (c: number, r: number) => string; ground?: (c: number, r: number) => number; sea?: number } = {}): AutomataWorld {
  const chunks = opts.chunks ?? [[0, 0]];
  return {
    seed: opts.seed ?? 42,
    chunkSize: 18,
    loadedChunks: () => chunks,
    tileAt: opts.tile ?? (() => 'g'),
    groundAt: opts.ground ?? (() => 1),
    seaLevel: () => opts.sea ?? 0,
  };
}

function bytesOf(arr: ArrayBufferView): Uint8Array {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}

describe('D3 resolution, load budget and strict validation (T482)', () => {
  it('flow defaults to 2 cells per tile side (D3) and the fixed load budget fits all five families while blocking two D3 flows', () => {
    expect(DEFAULT_CELL.flow).toBe(0.5);
    expect(refCellsOf({ family: 'flow' })).toBe(REF_WINDOW.tiles * 4);
    expect(MAX_CELLS_PER_AUTOMATON).toBeGreaterThanOrEqual(7 * 5 * 18 * 18 * 4);
    // All 5 families together at D3 defaults fit in the re-measured budget (2.0 ms/tick) and exceed the old D1 1.5 ms budget.
    const fiveLoad = totalLoadMs(FULL_FIVE);
    expect(fiveLoad).toBeGreaterThan(1.5);
    expect(fiveLoad).toBeLessThanOrEqual(LOAD_BUDGET_MS);
    expect(validateAutomata(FULL_FIVE).ok).toBe(true);
    // Two full-resolution D3 flows (2 × ~1.36 ms/tick) exceed the budget and are refused with reason.
    const twoFlows = validateAutomata([
      { id: 'water', family: 'flow', cell: 0.5, hz: 60 },
      { id: 'lava', family: 'flow', cell: 0.5, hz: 60 },
    ]);
    expect(twoFlows.ok).toBe(false);
    expect(!twoFlows.ok && twoFlows.reasons.join(' ')).toMatch(/carico totale/);
    // A second flow at cell=1 fits alongside the D3 water flow.
    const waterAndLava = validateAutomata([
      { id: 'water', family: 'flow', cell: 0.5, hz: 60 },
      { id: 'lava', family: 'flow', cell: 1, hz: 60 },
    ]);
    expect(waterAndLava.ok).toBe(true);
    // Single flow at 0.5, 60 Hz load matches D3 scale.
    expect(automatonLoadMs({ id: 'w', family: 'flow' })).toBeGreaterThan(1.1);
    expect(automatonLoadMs({ id: 'w', family: 'flow' })).toBeLessThan(1.5);
  });

  it('validateAutomaton refuses invalid specs without clamping; rules validates symmetry and allowed nodes', () => {
    const why = (raw: unknown, existing?: AutomatonSpec[]) => {
      const r = validateAutomaton(raw, existing ? { existing } : {});
      return r.ok ? '' : r.reasons.join(' | ');
    };
    expect(why({ id: 'Bad Id', family: 'flow' })).toMatch(/id deve essere/);
    expect(why({ id: 'x', family: 'plasma' })).toMatch(/family/);
    expect(why({ id: 'x', family: 'flow', cell: 3 })).toMatch(/cell/);
    expect(why({ id: 'x', family: 'wind', cell: 0.5 })).toMatch(/cell/);
    expect(why({ id: 'x', family: 'wind', hz: 60 })).toMatch(/hz/);
    expect(why({ id: 'x', family: 'flow', gravity: 99 })).toMatch(/gravity/);
    expect(why({ id: 'x', family: 'flow', damp: 1.1 })).toMatch(/damp/);
    expect(why({ id: 'x', family: 'wind', tau: 0.4 })).toMatch(/tau/);
    expect(why({ id: 'x', family: 'wind', prevailing: [0.2, 0] })).toMatch(/prevailing/);
    expect(why({ id: 'x', family: 'diffuse', rate: 0.3 })).toMatch(/rate/);
    expect(why({ id: 'x', family: 'diffuse', advect: 'missing' }, [])).toMatch(/advect/);
    expect(why({ id: 'x', family: 'table', states: 20, counted: 1, rules: [{ from: 0, min: 1, max: 8, to: 1, p: 1 }] })).toMatch(/states/);
    expect(why({ id: 'x', family: 'table', states: 3, counted: 1, rules: [] })).toMatch(/almeno una regola/);
    // Rules program checks: missing symmetry, 3D symmetry, forbidden nodes, imports.
    expect(rulesProgramErrors('<sequence values="FBA"><convolution neighborhood="Moore" steps="1"><rule in="F" out="B" sum="1..8" values="B"/></convolution></sequence>').join(' ')).toMatch(/symmetry/);
    expect(rulesProgramErrors('<sequence values="FBA" symmetry="(xyz)"><prl in="FB" out="BB" steps="1"/></sequence>').join(' ')).toMatch(/symmetry/);
    expect(rulesProgramErrors('<sequence values="FBA" symmetry="(xy)"><import file="part-stair"/></sequence>').join(' ')).toMatch(/import/);
    expect(rulesProgramErrors('<sequence values="FBA" symmetry="(xy)"><map scale="2 2 1" values="FBA"/></sequence>').join(' ')).toMatch(/non è ammesso/);
    expect(rulesProgramErrors('<sequence values="FBA" symmetry="(xy)"><all in="F B" out="B B"/></sequence>').join(' ')).toMatch(/2D/);
    expect(rulesProgramErrors(FIRE_RULES_XML)).toEqual([]);
    expect(rulesProgramErrors(PRL_RULES_XML)).toEqual([]);
    // Max automata cap (6).
    const six: AutomatonSpec[] = Array.from({ length: MAX_AUTOMATA }, (_, i) => ({ id: `d${i}`, family: 'diffuse', cell: 2, hz: 5 }));
    expect(why({ id: 'd7', family: 'diffuse', cell: 2, hz: 5 }, six)).toMatch(/al più 6 automi/);
  });

  it('repairAutomata and repairNature drop invalid or over-budget entries safely without touching worlds without automata', () => {
    expect(repairNature(undefined)).toEqual(DEFAULT_NATURE);
    expect('automata' in repairNature({})).toBe(false);
    const repaired = repairAutomata([
      { id: 'bad', family: 'nope' },
      { id: 'water', family: 'flow', cell: 0.5, hz: 60 },
      { id: 'water', family: 'flow', cell: 1, hz: 30 }, // duplicate id dropped
      { id: 'water2', family: 'flow', cell: 0.5, hz: 60 }, // over budget dropped
      { id: 'smoke', family: 'diffuse', advect: 'nonexistent' }, // valid, broken advect stripped
    ]);
    expect(repaired.map((s) => s.id)).toEqual(['water', 'smoke']);
    expect(repaired[1]?.family === 'diffuse' && repaired[1].advect).toBeUndefined();
  });
});

describe('family physics, conservation and sub-tile D3 resolution (T482)', () => {
  it('flow at cell=0.5 resolves four sub-cells per tile, flows downhill, stops at walls and conserves volume to <1e-6', () => {
    const f = new FlowField(0, 0, 20, 20, 0.5, { gravity: 9.8, damp: 0.995, level: 0 });
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        f.bed[y * 20 + x] = x < 10 ? 2 : 1;
        if (x === 14) {
          f.wall[y * 20 + x] = 1;
          f.hasWalls = true;
        }
      }
    }
    f.add(4, 10, 2);
    f.add(5, 10, 1);
    const v0 = f.volume();
    for (let i = 0; i < 400; i++) f.step(1 / 60);
    const drift = Math.abs(f.volume() - v0) / v0;
    expect(drift).toBeLessThan(1e-6);
    // Water moved downhill into x=10..13, never crossed wall at x=14.
    expect(f.sample(11, 10).depth).toBeGreaterThan(0.01);
    expect(f.sample(14, 10).depth).toBe(0);
    expect(f.sample(16, 10).depth).toBe(0);

    // Sub-tile independence through AutomataEngine: (2.2, 2.2) and (2.7, 2.2) map to different cells inside tile (2, 2).
    const eng = new AutomataEngine(makeWorld(), [{ id: 'water', family: 'flow', cell: 0.5, hz: 60 }]);
    eng.syncWindow();
    expect(eng.add('water', 2.2, 2.2, 1.5)).toBe(true);
    const a = eng.sample('water', 2.2, 2.2) as FlowSample;
    const b = eng.sample('water', 2.7, 2.2) as FlowSample;
    expect(a.depth).toBeCloseTo(1.5, 4);
    expect(b.depth).toBe(0);
  });

  it('wind flows around obstacles; diffuse spreads, decays and advects downwind; table & rules transition properly', () => {
    const w = new WindField(0, 0, 24, 16, 1, { tau: 0.58, prevailing: [0.06, 0] });
    for (let y = 6; y <= 9; y++) w.solid[y * 24 + 10] = 1;
    for (let i = 0; i < 60; i++) w.step();
    const open = w.sample(4, 8);
    const lee = w.sample(11, 8);
    expect(open.vx).toBeGreaterThan(0.03);
    expect(lee.vx).toBeLessThan(open.vx);
    expect(w.sample(10, 8)).toEqual({ vx: 0, vy: 0 });

    // Diffuse advected by wind: downwind (east) gets strictly more scalar than upwind (west).
    const eng = new AutomataEngine(makeWorld(), [
      { id: 'wind', family: 'wind', cell: 1, hz: 10, prevailing: [0.07, 0] },
      { id: 'smoke', family: 'diffuse', cell: 1, hz: 10, rate: 0.1, decay: 0.005, advect: 'wind', advectScale: 2 },
    ]);
    eng.syncWindow();
    eng.add('smoke', 9.5, 9.5, 10);
    for (let t = 0; t < 60; t++) eng.tick(false);
    const east = eng.sample('smoke', 11.5, 9.5) as number;
    const west = eng.sample('smoke', 7.5, 9.5) as number;
    expect(east).toBeGreaterThan(west);

    // Table spreads fire from center cell and turns center to ash (state 2).
    const tf = new TableField(0, 0, 12, 12, 1, 3, 1, [
      { from: 0, min: 1, max: 8, to: 1, p: 1 },
      { from: 1, min: 0, max: 8, to: 2, p: 1 },
    ], 7);
    tf.add(6, 6, 1);
    tf.step();
    expect(tf.sample(6, 6)).toBe(2);
    expect(tf.sample(7, 6)).toBe(1);

    // Rules (MarkovJunior Stepper): external cell write via `add` updates census so convolution ignites neighbours.
    const rf = new RulesField(0, 0, 12, 12, 1, `<sequence values="FBA" symmetry="(xy)"><convolution neighborhood="Moore" steps="1"><rule in="F" out="B" sum="1..8" values="B" p="1"/><rule in="B" out="A"/></convolution></sequence>`, 1, 7);
    expect(rf.add(6, 6, 1)).toBe(true);
    rf.step();
    expect(rf.sample(6, 6)).toBe(2);
    expect(rf.sample(7, 6)).toBe(1);
    // Also works with `<prl>`.
    const prl = new RulesField(0, 0, 12, 12, 1, PRL_RULES_XML, 1, 9);
    prl.add(5, 5, 1);
    for (let i = 0; i < 10; i++) prl.step();
    expect(prl.cells.reduce((s, v) => s + v, 0)).toBeGreaterThan(1);
  });
});

describe('determinism, window clustering and overlap preservation (T482)', () => {
  it('two independent engines with the same seed and steps produce bit-for-bit identical grids across all 5 families', () => {
    const runEngine = (seed: number) => {
      const world = makeWorld({
        seed,
        chunks: [[0, 0], [1, 0]],
        tile: (c, r) => (c === 0 ? 'o' : c === 10 && r > 5 ? 'w' : 'g'),
        ground: (c, r) => (c > 22 && r > 10 ? 5 : 1 + ((c + r) % 3) * 0.25),
        sea: 2,
      });
      const eng = new AutomataEngine(world, FULL_FIVE);
      eng.syncWindow();
      eng.add('water', 6.2, 6.2, 1.8);
      eng.add('wind', 12, 8, 0.03, -0.01);
      eng.add('smoke', 12.5, 8.5, 9);
      eng.add('fire', 14.5, 8.5, 1);
      eng.add('moss', 14.5, 8.5, 1);
      for (let t = 0; t < 120; t++) {
        eng.beginTick();
        if (t === 30) eng.add('water', 15.7, 9.2, 1.2);
        if (t === 45) eng.add('smoke', 12.5, 8.5, 5);
        eng.tick(false);
      }
      return eng;
    };

    const a = runEngine(777);
    const b = runEngine(777);
    const c = runEngine(778);

    for (const spec of FULL_FIVE) {
      expect(a.stepCount(spec.id)).toBe(b.stepCount(spec.id));
      expect(a.stepCount(spec.id)).toBeGreaterThan(0);
      const ga = a.gridsOf(spec.id)[0]!;
      const gb = b.gridsOf(spec.id)[0]!;
      if (ga instanceof FlowField && gb instanceof FlowField) {
        expect(bytesOf(ga.depth)).toEqual(bytesOf(gb.depth));
        expect(bytesOf(ga.fx0)).toEqual(bytesOf(gb.fx0));
        expect(bytesOf(ga.fy0)).toEqual(bytesOf(gb.fy0));
      } else if (ga instanceof WindField && gb instanceof WindField) {
        expect(bytesOf(ga.f)).toEqual(bytesOf(gb.f));
      } else if (ga instanceof DiffuseField && gb instanceof DiffuseField) {
        expect(bytesOf(ga.value)).toEqual(bytesOf(gb.value));
      } else if (ga instanceof TableField && gb instanceof TableField) {
        expect(bytesOf(ga.cells)).toEqual(bytesOf(gb.cells));
        // Different seed diverges on stochastic transitions.
        const gc = c.gridsOf(spec.id)[0] as TableField;
        expect(Buffer.from(ga.cells).equals(Buffer.from(gc.cells))).toBe(false);
      } else if (ga instanceof RulesField && gb instanceof RulesField) {
        expect(bytesOf(ga.cells)).toEqual(bytesOf(gb.cells));
        const gc = c.gridsOf(spec.id)[0] as RulesField;
        expect(Buffer.from(ga.cells).equals(Buffer.from(gc.cells))).toBe(false);
      }
    }
  });

  it('distant chunk clusters get separate windows and shifting a window preserves overlapping cell values', () => {
    const boxes = clusterChunks([[0, 0], [1, 0], [20, 20], [21, 20]]);
    expect(boxes).toEqual([
      { minCx: 0, minCy: 0, maxCx: 1, maxCy: 0 },
      { minCx: 20, minCy: 20, maxCx: 21, maxCy: 20 },
    ]);
    let chunks: Array<[number, number]> = [[0, 0], [1, 0]];
    const eng = new AutomataEngine(
      { seed: 1, chunkSize: 18, loadedChunks: () => chunks, tileAt: () => 'g', groundAt: () => 0, seaLevel: () => 0 },
      [{ id: 'smoke', family: 'diffuse', cell: 1, hz: 10, rate: 0, decay: 0 }],
    );
    eng.syncWindow();
    expect(eng.add('smoke', 20.5, 5.5, 7)).toBe(true);
    // Shift window right: chunk (0,0) unloads, (2,0) loads; (20.5, 5.5) in chunk (1,0) stays!
    chunks = [[1, 0], [2, 0]];
    eng.syncWindow();
    expect(eng.sample('smoke', 20.5, 5.5)).toBe(7);
    expect(eng.sample('smoke', 2.5, 5.5)).toBeUndefined();
  });
});

async function bootWith(automata?: AutomatonSpec[], extraFiles: Record<string, string> = {}, multiplayer = false) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const nextCfg = {
    ...cfg,
    ...(multiplayer ? { game: { mode: 'multiplayer', death: 3 } } : {}),
    ...(automata ? { nature: { ...DEFAULT_NATURE, automata } } : {}),
  };
  const files = { ...bundledFiles, 'universe.json': JSON.stringify(nextCfg, null, 2) + '\n', ...extraFiles };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 60 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(DT);
    await new Promise((r) => setTimeout(r, 15));
  }
  k.tick(DT);
  return k;
}

describe('Kernel integration, Lua API, pace: hold and Physicist (T482)', () => {
  it('registers physics.automaton in CENSUS, world.field/field_add in LUA_API and prompts; worlds without automata stay inert', async () => {
    expect(CENSUS.find((c) => c.compito === AUTOMATON_TASK)).toMatchObject({ agente: 'physicist', modo: 'diretta', coefficiente: 'studio' });
    expect(LUA_API.world).toEqual(expect.arrayContaining(['field', 'field_add']));
    expect(apiErrors('local v = world.field("water", 1, 2); world.field_add("smoke", 1, 2, 3)')).toEqual([]);
    expect(readFileSync('universe/prompts/agents/engineer.md', 'utf8')).toMatch(/world\.field\(id, x, y\)/);
    expect(readFileSync('universe/prompts/agents/engineer.md', 'utf8')).toMatch(/world\.field_add/);
    expect(readFileSync('universe/prompts/agents/physicist.md', 'utf8')).toMatch(/Cellular automata/);

    const k = await bootWith();
    expect(k.automata.active).toBe(false);
    expect(k.automataSpecs()).toEqual([]);
    expect(k.nature()).toEqual(DEFAULT_NATURE);
    expect(k.automatonField('water', 0, 0)).toBeUndefined();
    expect(k.fieldAdd('water', 0, 0, 1)).toBe(false);
  }, 60_000);

  it('two Kernels with identical seed, automata and Lua system produce identical field samples; pace: hold freezes all automata', async () => {
    const sysFiles = {
      'modules/sys.campi/manifest.json': JSON.stringify({ id: 'sys.campi', name: 'Campi', kind: 'system', logic: 'logic.lua', order: 92 }),
      'modules/sys.campi/logic.lua': `local M = {}
function M.update(dt)
  world.field_add("smoke", 4.5, 4.5, 1)
  world.field_add("water", 4.2, 4.2, 0.2)
  local s = world.field("smoke", 4.5, 4.5)
  local w = world.field("water", 4.2, 4.2)
  local v = world.field("wind", 4.5, 4.5)
  ecs.set(world.player(), "probe", { smoke = s or -1, depth = w and w.depth or -1, vx = v and v.vx or -1 })
end
return M
`,
    };
    const specs: AutomatonSpec[] = [
      { id: 'water', family: 'flow', cell: 0.5, hz: 60 },
      { id: 'wind', family: 'wind', cell: 3, hz: 10, prevailing: [0.05, 0.01] },
      { id: 'smoke', family: 'diffuse', cell: 1, hz: 10, rate: 0.18, decay: 0.01, advect: 'wind' },
      { id: 'fire', family: 'table', cell: 1, hz: 10, states: 3, counted: 1, rules: [{ from: 0, min: 1, max: 8, to: 1, p: 0.3 }, { from: 1, min: 0, max: 8, to: 2, p: 1 }] },
      { id: 'moss', family: 'rules', cell: 1, hz: 10, program: FIRE_RULES_XML, steps: 1 },
    ];
    const runKernel = async () => {
      const k = await bootWith(specs, sysFiles);
      k.automata.reset();
      k.automata.syncWindow();
      k.fieldAdd('fire', 5.5, 5.5, 1);
      k.fieldAdd('moss', 5.5, 5.5, 1);
      for (let i = 0; i < 60; i++) k.tick(DT);
      return k;
    };
    const k1 = await runKernel();
    const k2 = await runKernel();
    const p1 = k1.ecs.get(k1.wandererEntity, 'probe');
    const p2 = k2.ecs.get(k2.wandererEntity, 'probe');
    expect(p1.smoke).toBeGreaterThan(0);
    expect(p1.depth).toBeGreaterThan(0);
    expect(p1).toEqual(p2);
    expect(k1.automatonField('water', 4.2, 4.2)).toEqual(k2.automatonField('water', 4.2, 4.2));
    expect(k1.automatonField('smoke', 5.5, 4.5)).toEqual(k2.automatonField('smoke', 5.5, 4.5));
    expect(k1.automatonField('wind', 4.5, 4.5)).toEqual(k2.automatonField('wind', 4.5, 4.5));

    // Pace `hold` stops all automata; `normal` resumes them.
    const stepsBefore = Object.fromEntries(specs.map((s) => [s.id, k1.automata.stepCount(s.id)]));
    const windBefore = k1.automatonField('wind', 4.5, 4.5) as WindSample;
    expect((await k1.setPace({ mode: 'hold' })).ok).toBe(true);
    for (let i = 0; i < 60; i++) k1.tick(DT);
    for (const s of specs) expect(k1.automata.stepCount(s.id), s.id).toBe(stepsBefore[s.id]);
    expect(k1.automatonField('wind', 4.5, 4.5)).toEqual(windBefore);
    expect((await k1.setPace({ mode: 'normal' })).ok).toBe(true);
    for (let i = 0; i < 30; i++) k1.tick(DT);
    for (const s of specs) expect(k1.automata.stepCount(s.id), s.id).toBeGreaterThan(stepsBefore[s.id]!);
  }, 60_000);

  it('the Physicist adds, retries invalid XML, keeps across applyFiles and removes automata via Referente and defineAutomaton', async () => {
    const k = await bootWith();
    const commits0 = k.repo.log().length;
    const r1 = await k.talkToAgent('liaison', 'aggiungi un automa per il vento che soffia sui monti');
    expect(r1.forged).toMatch(/Il Fisico aggiorna gli automi: aggiunto wind/);
    expect(k.automataSpecs().map((s) => s.id)).toEqual(['wind']);
    expect(k.repo.log().length).toBe(commits0 + 1);
    expect(k.feed().some((e) => e.task === AUTOMATON_TASK && e.from === 'physicist')).toBe(true);

    // Adding smoke automatically references `wind` in offline mock and persists across applyFiles.
    const r2 = await k.defineAutomaton('un campo di fumo che si spande col vento');
    expect(r2.ok).toBe(true);
    expect(k.automataSpecs().map((s) => s.id)).toEqual(['wind', 'smoke']);
    // Retry on invalid MarkovJunior XML (missing symmetry on round 1 -> kernel scarta -> Physicist fixes on round 2).
    const r3 = await k.defineAutomaton('automa di muffa con regole MarkovJunior senza simmetria');
    expect(r3.ok).toBe(true);
    expect(k.automataSpecs().map((s) => s.id)).toEqual(['wind', 'smoke', 'moss']);
    expect(k.feed().some((e) => e.from === 'kernel' && e.kind === 'scarta' && e.task === AUTOMATON_TASK && /symmetry/.test(e.text))).toBe(true);

    // Persists across applyFiles while immutable geography reverts.
    const raw = JSON.parse(k.repo.working['universe.json']!);
    k.applyFiles({ ...k.repo.working, 'universe.json': JSON.stringify({ ...raw, nature: { ...raw.nature, geography: 'void' } }) });
    expect(k.config.nature.geography).toBe('continent');
    expect(k.automataSpecs().map((s) => s.id)).toEqual(['wind', 'smoke', 'moss']);

    // Removing `wind` cleans up `smoke.advect`.
    const r4 = await k.defineAutomaton('rimuovi l’automa wind');
    expect(r4.ok).toBe(true);
    expect(k.automataSpecs().map((s) => s.id)).toEqual(['smoke', 'moss']);
    const smoke = k.automataSpecs().find((s) => s.id === 'smoke');
    expect(smoke?.family === 'diffuse' && smoke.advect).toBeUndefined();
  }, 60_000);

  it('in multiplayer the master defines automata on their branch and publishes them; players cannot', async () => {
    const k = await bootWith(undefined, {}, true);
    const server = new SessionServer(k);
    const connect = async (id: string) => {
      const { server: s, client: c } = fakeLink();
      server.connect(s);
      const session = new SessionClient(c, { id });
      await session.ready;
      const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
      return new ThinClient(mirror, session);
    };
    const master = await connect('me');
    const anna = await connect('anna');
    const stepAll = (n: number) => {
      for (let i = 0; i < n; i++) {
        master.k.tick(DT);
        master.frame(DT);
        anna.k.tick(DT);
        anna.frame(DT);
        server.tick(DT);
      }
    };
    const until = async <T,>(p: Promise<T>): Promise<T> => {
      let done = false;
      let out!: T;
      void p.then((v) => ((done = true), (out = v)));
      for (let i = 0; i < 400 && !done; i++) {
        stepAll(2);
        await new Promise((r) => setTimeout(r, 0));
      }
      expect(done).toBe(true);
      return out;
    };
    stepAll(6);
    const r = await until(master.k.talkToAgent('liaison', 'aggiungi un automa per il vento'));
    expect(r.forged).toMatch(/Il Fisico aggiorna gli automi: aggiunto wind/);
    stepAll(10);
    // On the branch only until published.
    expect(k.automataSpecs()).toEqual([]);
    const refused = await until(anna.session.act({ t: 'agent', agent: 'liaison', text: 'aggiungi un automa per il vento' }));
    expect(refused.ok).toBe(false);
    const pub = await until(master.k.publisher!.publish());
    expect(pub.ok).toBe(true);
    stepAll(10);
    expect(k.automataSpecs().map((s) => s.id)).toEqual(['wind']);
    expect(anna.k.automataSpecs().map((s) => s.id)).toEqual(['wind']);
  }, 60_000);
});
