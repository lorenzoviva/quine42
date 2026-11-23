// V-048 (T482, ADR-0254): cellular automata for Lua (`world.field`, `world.field_add`) and the fixed load budget.
// A Lua module cannot flood the world, poison buffers with NaN/Infinity, allocate grids outside loaded chunks or mutate
// internal state; mirror clients cannot write fields; universe.json automata stay within MAX_AUTOMATA, MAX_CELLS and LOAD_BUDGET_MS;
// in multiplayer only the master defines or removes automata.

import { describe, expect, it } from 'vitest';
import {
  DIFFUSE_LIMITS,
  FIELD_ADD_LIMITS,
  FLOW_LIMITS,
  LOAD_BUDGET_MS,
  MAX_AUTOMATA,
  MAX_CELLS_PER_AUTOMATON,
  repairAutomata,
  rulesProgramErrors,
  totalLoadMs,
  validateAutomata,
  WIND_LIMITS,
  type AutomatonSpec,
  type FlowSample,
  type WindSample,
} from '../../src/kernel/automata';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { DEFAULT_NATURE } from '../../src/kernel/nature';
import { memoryStore } from '../../src/kernel/repo';
import type { FileMap } from '../../src/kernel/types';

const DT = 1 / 60;

const SPECS: AutomatonSpec[] = [
  { id: 'water', family: 'flow', cell: 0.5, hz: 60 },
  { id: 'wind', family: 'wind', cell: 3, hz: 10, prevailing: [0.04, 0] },
  { id: 'smoke', family: 'diffuse', cell: 1, hz: 10, rate: 0, decay: 0 },
  { id: 'fire', family: 'table', cell: 1, hz: 10, states: 3, counted: 1, rules: [{ from: 0, min: 1, max: 8, to: 1, p: 0 }] },
];

const FLOOD_LUA = `local M = {}
function M.update(dt)
  local water_ok, smoke_ok, wind_ok, fire_ok = 0, 0, 0, 0
  for i = 1, 200 do
    if world.field_add("water", 4.2, 4.2, 1e9) then water_ok = water_ok + 1 end
    if world.field_add("smoke", 4.5, 4.5, 1e9) then smoke_ok = smoke_ok + 1 end
    if world.field_add("wind", 4.5, 4.5, 1e9, 1e9) then wind_ok = wind_ok + 1 end
    if world.field_add("fire", (i % 16) + 0.5, math.floor(i / 16) + 0.5, 1) then fire_ok = fire_ok + 1 end
  end
  local bad_nan = world.field_add("water", 4.2, 4.2, 0/0)
  local bad_inf = world.field_add("smoke", 4.5, 4.5, 1/0)
  local bad_str = world.field_add("water", "x", 4.2, 1)
  local bad_id = world.field_add("unknown", 4.2, 4.2, 1)
  local bad_far = world.field_add("water", 1e7, 1e7, 1)
  local bad_state = world.field_add("fire", 1.5, 1.5, 99)
  local w = world.field("water", 4.2, 4.2)
  if w then w.depth = 9999; w.vx = 9999 end
  local w_again = world.field("water", 4.2, 4.2)
  ecs.set(world.player(), "probe", {
    water_ok = water_ok, smoke_ok = smoke_ok, wind_ok = wind_ok, fire_ok = fire_ok,
    bad_nan = bad_nan, bad_inf = bad_inf, bad_str = bad_str, bad_id = bad_id, bad_far = bad_far, bad_state = bad_state,
    mutated_depth = w_again and w_again.depth or -1,
    mutated_vx = w_again and w_again.vx or -1,
  })
end
return M
`;

async function bootProbe(opts: { mirror?: boolean; multiplayer?: boolean } = {}) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files: FileMap = {
    ...bundledFiles,
    'universe.json': JSON.stringify(
      {
        ...cfg,
        ...(opts.multiplayer ? { game: { mode: 'multiplayer', death: 3 } } : {}),
        nature: { ...DEFAULT_NATURE, automata: SPECS },
      },
      null,
      2,
    ),
    'modules/sys.sonda/manifest.json': JSON.stringify({ id: 'sys.sonda', name: 'Sonda Automi', kind: 'system', logic: 'logic.lua', order: 95 }),
    'modules/sys.sonda/logic.lua': FLOOD_LUA,
  };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), mirror: opts.mirror });
  if (!opts.mirror) {
    for (let i = 0; i < 60 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      k.tick(DT);
      await new Promise((r) => setTimeout(r, 15));
    }
  }
  return k;
}

describe('gli automi per Lua e il carico fisso (T482)', () => {
  it('V-048 world.field_add rispetta i tetti per chiamata e per tick su tutte le famiglie: un ciclo Lua non inonda il mondo', async () => {
    const k = await bootProbe();
    // Reset cleanly before one measured tick so we read exact per-tick deposits.
    k.automata.reset();
    k.automata.syncWindow();
    k.tick(DT);
    const p = k.ecs.get(k.wandererEntity, 'probe');
    // Water: perCall=2, perTick=8 -> at most 4 successful calls (2 * 4 = 8), never 200.
    expect(p.water_ok).toBe(Math.floor(FIELD_ADD_LIMITS.flow.perTick / FIELD_ADD_LIMITS.flow.perCall));
    // Smoke: perCall=10, perTick=50 -> at most 5 successful calls (10 * 5 = 50).
    expect(p.smoke_ok).toBe(Math.floor(FIELD_ADD_LIMITS.diffuse.perTick / FIELD_ADD_LIMITS.diffuse.perCall));
    // Wind: perCall=0.04, perTick=0.4 -> at most 10 successful calls.
    expect(p.wind_ok).toBeLessThanOrEqual(Math.ceil(FIELD_ADD_LIMITS.wind.perTick / FIELD_ADD_LIMITS.wind.perCall));
    // Discrete table: capped at perTick (64) cells per tick.
    expect(p.fire_ok).toBe(FIELD_ADD_LIMITS.discrete.perTick);
    // Stored values never exceed caps or become non-finite.
    const w = k.automatonField('water', 4.2, 4.2) as FlowSample;
    expect(w.depth).toBeLessThanOrEqual(FIELD_ADD_LIMITS.flow.perTick + 1e-4);
    expect(w.depth).toBeLessThanOrEqual(FLOW_LIMITS.maxDepth);
    expect(Number.isFinite(w.depth) && Number.isFinite(w.vx) && Number.isFinite(w.vy)).toBe(true);
    const s = k.automatonField('smoke', 4.5, 4.5) as number;
    expect(s).toBeCloseTo(FIELD_ADD_LIMITS.diffuse.perTick, 3);
    expect(s).toBeLessThanOrEqual(DIFFUSE_LIMITS.maxValue);
    const wind = k.automatonField('wind', 4.5, 4.5) as WindSample;
    expect(Math.abs(wind.vx)).toBeLessThanOrEqual(WIND_LIMITS.maxSpeed + 1e-4);
    expect(Math.abs(wind.vy)).toBeLessThanOrEqual(WIND_LIMITS.maxSpeed + 1e-4);
  }, 60_000);

  it('V-048 world.field_add ignora NaN, Infinity, tipi errati, id ignoti e coordinate fuori finestra senza corrompere né allocare', async () => {
    const k = await bootProbe();
    const chunksBefore = k.chunks.size;
    k.tick(DT);
    const p = k.ecs.get(k.wandererEntity, 'probe');
    expect(p.bad_nan).toBe(false);
    expect(p.bad_inf).toBe(false);
    expect(p.bad_str).toBe(false);
    expect(p.bad_id).toBe(false);
    expect(p.bad_far).toBe(false);
    expect(p.bad_state).toBe(false);
    expect(k.chunks.size).toBe(chunksBefore);
    // Every Float32 cell in flow, wind and diffuse remains finite after hostile calls.
    for (const id of ['water', 'wind', 'smoke']) {
      for (const g of k.automata.gridsOf(id)) {
        const arr = 'depth' in g ? g.depth : 'f' in g ? g.f : 'value' in g ? g.value : undefined;
        if (arr) for (let i = 0; i < arr.length; i++) expect(Number.isFinite(arr[i])).toBe(true);
      }
    }
  }, 60_000);

  it('V-048 world.field restituisce copie fresche e uno specchio (client) rifiuta sempre field_add', async () => {
    const k = await bootProbe();
    k.automata.reset();
    k.automata.syncWindow();
    k.tick(DT);
    const p = k.ecs.get(k.wandererEntity, 'probe');
    // Mutating the table returned by `world.field("water", ...)` in Lua did not alter the kernel's field.
    expect(p.mutated_depth).toBeLessThan(100);
    expect(p.mutated_vx).toBeLessThan(100);

    // Mirror client: field_add is always false.
    const mirror = await bootProbe({ mirror: true });
    expect(mirror.fieldAdd('smoke', 4.5, 4.5, 5)).toBe(false);
    expect(mirror.fieldAdd('water', 4.2, 4.2, 1)).toBe(false);
  }, 60_000);

  it('V-048 i tetti statici (MAX_AUTOMATA, LOAD_BUDGET_MS, MAX_CELLS_PER_AUTOMATON e nodi rules) valgono in validate e repair', () => {
    const tooMany = Array.from({ length: MAX_AUTOMATA + 3 }, (_, i) => ({ id: `a${i}`, family: 'diffuse', cell: 3, hz: 2 }));
    expect(validateAutomata(tooMany).ok).toBe(false);
    expect(repairAutomata(tooMany)).toHaveLength(MAX_AUTOMATA);

    const overBudget = [
      { id: 'w1', family: 'flow', cell: 0.5, hz: 60 },
      { id: 'w2', family: 'flow', cell: 0.5, hz: 60 },
      { id: 'w3', family: 'flow', cell: 0.5, hz: 60 },
    ];
    expect(validateAutomata(overBudget).ok).toBe(false);
    const repaired = repairAutomata(overBudget);
    expect(totalLoadMs(repaired)).toBeLessThanOrEqual(LOAD_BUDGET_MS + 1e-9);
    expect(repaired).toHaveLength(1);

    // Hostile MarkovJunior XML in `rules`: WFC, imports, search, missing symmetry, >16 states are all rejected.
    expect(rulesProgramErrors('<sequence values="AB" symmetry="(xy)"><wfc sample="x" values="AB" tries="1"/></sequence>').length).toBeGreaterThan(0);
    expect(rulesProgramErrors('<sequence values="AB" symmetry="(xy)"><import file="tree"/></sequence>').length).toBeGreaterThan(0);
    expect(rulesProgramErrors('<sequence values="AB" symmetry="(xy)"><one in="A" out="B" search="True" limit="10"/></sequence>').length).toBeGreaterThan(0);
    expect(rulesProgramErrors('<sequence values="ABCDEFGHIJKLMNOPQR" symmetry="(xy)"><prl in="AB" out="BB" steps="1"/></sequence>').length).toBeGreaterThan(0);
    expect(MAX_CELLS_PER_AUTOMATON).toBeLessThanOrEqual(50_000);
  });

  it('V-048 in multigiocatore un non-master non può dichiarare né rimuovere automi', async () => {
    const k = await bootProbe({ multiplayer: true });
    k.addWanderer('anna', 'Anna');
    const res = await k.as('anna', () => k.defineAutomaton('aggiungi un automa per il vento'));
    expect(res.ok).toBe(false);
    expect(!res.ok && res.reason).toMatch(/solo il master/);
    expect(k.automataSpecs().map((s) => s.id)).toEqual(SPECS.map((s) => s.id));
  }, 60_000);
});
