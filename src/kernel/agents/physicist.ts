// The Physicist with the world on (T452, ADR-0235): a request (the Referente's, or a rule of the world that changes the physics) becomes the
// terrains reshaped and the gravity of the world, within the kernel's limits. The kernel reads the answer (`src/kernel/reshape.ts`), measures
// whether it would cut a place (rule 10) and commits it; what it refuses comes back here once, with the reasons.

import type { Schema } from '../ai/models';
import type { Council } from './council';
import { CROSSINGS, DEPTHS, NATURE_ACCEPTS, TERRAIN_LIMITS, crossingOf, terrainPhysics } from '../nature';
import { BASE_CODES } from './genesis';
import type { TerrainDef } from '../types';
import type { TerrainChange } from '../reshape';
import {
  AUTOMATON_FAMILIES,
  automatonLoadMs,
  CELL_SIZES,
  cellOf,
  DIFFUSE_LIMITS,
  FLOW_LIMITS,
  HZ_LIMITS,
  hzOf,
  LOAD_BUDGET_MS,
  MAX_AUTOMATA,
  RULES_LIMITS,
  TABLE_LIMITS,
  totalLoadMs,
  WIND_LIMITS,
  type AutomatonSpec,
} from '../automata';

export const RESHAPE_TASK = 'physics.reshape';

const RESHAPE_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    terrains: {
      type: 'ARRAY',
      description: 'only the terrains that change, each with only the fields that change',
      items: {
        type: 'OBJECT',
        properties: {
          code: { type: 'STRING' },
          cross: { type: 'STRING', enum: [...CROSSINGS], description: 'how a body crosses it: on foot, swimming (only a liquid), not at all' },
          speed: { type: 'NUMBER', description: `the pace, a multiplier: on foot ${TERRAIN_LIMITS.walkPace.join('-')}, swimming ${TERRAIN_LIMITS.swimPace.join('-')}` },
          fatigue: { type: 'NUMBER', description: `only where one swims: how many times the energy against walking, ${TERRAIN_LIMITS.fatigue.join('-')}` },
          depth: { type: 'STRING', enum: [...DEPTHS], description: 'only where one swims: how deep the water is; reef: rock just under the surface' },
          air: { type: 'BOOLEAN', description: 'whether a body breathes there' },
        },
        required: ['code'],
      },
    },
    gravity: { type: 'NUMBER', description: `only if the weight of bodies in the whole world changes: ${NATURE_ACCEPTS.gravity.join('-')}, the earth's is 1` },
    note: { type: 'STRING', description: 'in one sentence, in the language of the world, what changes for those who live there' },
    refusal: { type: 'STRING', description: 'only if nothing of the request can be done within the fixed rules: why not' },
  },
  required: ['terrains'],
};

export interface ReshapeAnswer {
  terrains: TerrainChange[];
  gravity?: unknown;
  note?: string;
  refusal?: string;
}

/** A terrain as the Physicist is shown it: its physics as the kernel reads it, and what of it is fixed. */
function shown(code: string, t: TerrainDef): string {
  const p = terrainPhysics(t);
  const fixed = BASE_CODES[code] ? ' [base code: only the pace (and the fatigue of the water)]' : t.layer === 'wall' || t.layer === 'vegetation' || t.layer === 'rock' ? ' [never crossed]' : t.layer === 'floor' || t.layer === 'door' ? ' [always walked]' : '';
  return `${code} ${t.name} [${t.layer ?? 'ground'}]: ${crossingOf(t)}, pace ${p.pace}${p.cross === 'swim' ? `, fatigue ${p.fatigue}, ${p.depth}` : ''}${t.air === false ? ', no air' : ''}${fixed}`;
}

/**
 * The Physicist reshapes the physics with the world on: the terrains that the request changes (crossing, pace, fatigue, depth, air) and,
 * if it says so, the gravity of the whole world. `sentBack` is what the kernel refused of its first answer.
 */
export async function askReshape(c: Council, request: string, palette: Record<string, TerrainDef>, gravity: number, opts: { chi?: string; sentBack?: string } = {}): Promise<ReshapeAnswer> {
  const terrains = Object.entries(palette).filter(([code, t]) => code !== '?' && t.layer !== 'void');
  const r = await c.ask<{ terrains?: unknown; gravity?: unknown; note?: unknown; refusal?: unknown }>(
    'physicist',
    RESHAPE_TASK,
    [
      `The world is already alive, with its places and the people who walk them. A member of the Council asks to change its physics: «${request}».`,
      `Its terrains now:\n${terrains.map(([code, t]) => shown(code, t)).join('\n')}\nThe gravity of the world: ${gravity} (the earth's is 1).`,
      `Say only what changes: for each terrain that changes its code and the fields that change (cross: walk, swim, none; speed: on foot ${TERRAIN_LIMITS.walkPace.join('-')}, swimming ${TERRAIN_LIMITS.swimPace.join('-')}; fatigue ${TERRAIN_LIMITS.fatigue.join('-')} and depth only where one swims; air), and the gravity (${NATURE_ACCEPTS.gravity.join('-')}) only if the weight of every body changes. Fixed rules: walls, vegetation and rock are never crossed, floors and doors always walked, only a liquid is swum; of a base code only the pace changes, and of the water the fatigue; the void, the geography, the day and the sky do not change. A change that would leave a place cut off is refused: then make it milder, or say what else to do. A new terrain, or a tile that changes, is not yours: say so in "refusal".`,
      opts.sentBack ? `The kernel refused your answer: ${opts.sentBack}. Answer again within the rules, or give a refusal with the reason.` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    RESHAPE_SCHEMA,
    { data: { request, terrains: terrains.map(([code, t]) => ({ code, ...t })), gravity, ...(opts.sentBack ? { sentBack: opts.sentBack } : {}) }, temperature: 0.3, chi: opts.chi },
  );
  const list = Array.isArray(r.terrains) ? r.terrains.filter((t): t is TerrainChange => !!t && typeof t === 'object' && !Array.isArray(t)) : [];
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 400) : undefined);
  return { terrains: list, ...(r.gravity !== undefined && r.gravity !== null ? { gravity: r.gravity } : {}), note: text(r.note), refusal: text(r.refusal) };
}

// --- Cellular automata (T482, ADR-0254) ----------------------------------------------------------------------------------------------

export const AUTOMATON_TASK = 'physics.automaton';

const AUTOMATON_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    action: { type: 'STRING', enum: ['set', 'remove'], description: '"set" adds a new automaton or replaces one with the same id; "remove" removes one by id' },
    id: { type: 'STRING', description: 'lowercase identifier (letters, digits, _ or -), e.g. water, wind, smoke, fire, lava, moss' },
    family: { type: 'STRING', enum: [...AUTOMATON_FAMILIES], description: 'for "set": flow (virtual pipes), wind (D2Q9), diffuse (scalar), table (discrete table), rules (MarkovJunior XML)' },
    cell: { type: 'NUMBER', description: 'tile size of one cell: flow 0.5 (default, 2 cells/tile side) or 1; wind 3 (default), 2 or 1; diffuse 0.5|1|2|3; table/rules 0.5|1|2' },
    hz: { type: 'INTEGER', description: 'steps per second: flow 1-60 (default 60), all other families 1-10 (default 10)' },
    gravity: { type: 'NUMBER', description: `flow only: ${FLOW_LIMITS.gravity.join('-')}, default 9.8` },
    damp: { type: 'NUMBER', description: `flow only: ${FLOW_LIMITS.damp.join('-')}, default 0.995` },
    level: { type: 'NUMBER', description: `flow only: source surface level in tiles (${FLOW_LIMITS.level.join('-')}); omit for the world sea level` },
    sources: { type: 'ARRAY', items: { type: 'STRING' }, description: 'flow only: single-char terrain codes that hold a constant level (e.g. ["o"])' },
    walls: { type: 'ARRAY', items: { type: 'STRING' }, description: 'flow, diffuse or table: single-char terrain codes that block the field' },
    tau: { type: 'NUMBER', description: `wind only: relaxation time ${WIND_LIMITS.tau.join('-')}, default 0.58` },
    prevailingX: { type: 'NUMBER', description: `wind only: prevailing ux (|u| <= ${WIND_LIMITS.inflow}), default 0.06` },
    prevailingY: { type: 'NUMBER', description: `wind only: prevailing uy (|u| <= ${WIND_LIMITS.inflow}), default 0.02` },
    layerHeight: { type: 'NUMBER', description: `wind only: height above sea in tiles that blocks wind (${WIND_LIMITS.layerHeight.join('-')}), default 3` },
    obstacles: { type: 'ARRAY', items: { type: 'STRING' }, description: 'wind only: single-char terrain codes that always block the wind' },
    rate: { type: 'NUMBER', description: `diffuse only: diffusion rate ${DIFFUSE_LIMITS.rate.join('-')}, default 0.2` },
    decay: { type: 'NUMBER', description: `diffuse only: decay fraction per step ${DIFFUSE_LIMITS.decay.join('-')}, default 0.002` },
    scalarSources: {
      type: 'ARRAY',
      description: 'diffuse only: terrain codes that emit a constant scalar value',
      items: { type: 'OBJECT', properties: { tile: { type: 'STRING' }, value: { type: 'NUMBER' } }, required: ['tile', 'value'] },
    },
    advect: { type: 'STRING', description: 'diffuse only: id of an existing wind or flow automaton that carries this scalar' },
    advectScale: { type: 'NUMBER', description: `diffuse only: advection strength ${DIFFUSE_LIMITS.advectScale.join('-')}, default 1` },
    states: { type: 'INTEGER', description: `table only: number of discrete states (${TABLE_LIMITS.states.join('-')})` },
    counted: { type: 'INTEGER', description: 'table only: neighbour state index (0..states-1) counted in Moore neighbourhood' },
    rules: {
      type: 'ARRAY',
      description: 'table only: transition rules {from, min, max, to, p}',
      items: {
        type: 'OBJECT',
        properties: {
          from: { type: 'INTEGER' },
          min: { type: 'INTEGER' },
          max: { type: 'INTEGER' },
          to: { type: 'INTEGER' },
          p: { type: 'NUMBER' },
        },
        required: ['from', 'min', 'max', 'to', 'p'],
      },
    },
    initial: {
      type: 'ARRAY',
      description: 'table or rules: terrain codes initialized to a given state index',
      items: { type: 'OBJECT', properties: { tile: { type: 'STRING' }, state: { type: 'INTEGER' } }, required: ['tile', 'state'] },
    },
    program: { type: 'STRING', description: 'rules only: MarkovJunior XML with symmetry="(xy)" on root, only sequence/markov/convolution/prl/all/one, 2-16 states, no imports' },
    steps: { type: 'INTEGER', description: `rules only: Stepper steps per automaton step (${RULES_LIMITS.steps.join('-')}), default 1` },
    note: { type: 'STRING', description: 'in one sentence, in the language of the world, what field is now active or gone' },
    refusal: { type: 'STRING', description: 'only if the request cannot be made within the families or load budget: why not' },
  },
  required: ['action'],
};

export interface AutomatonAnswer {
  action: 'set' | 'remove';
  id: string;
  /** Raw unvalidated spec assembled from the Physicist's answer (only for `set`). */
  raw?: Record<string, unknown>;
  note?: string;
  refusal?: string;
}

function shownAutomaton(s: AutomatonSpec): string {
  return `- ${s.id}: ${s.family}, cell=${cellOf(s)}, hz=${hzOf(s)}, load=${automatonLoadMs(s).toFixed(3)} ms/tick`;
}

/**
 * The Physicist declares, tunes or removes a cellular automaton of the world (`physics.automaton`, T482, ADR-0254).
 * The kernel validates the answer strictly without clamping (`validateAutomaton`) and sends any refusal back once.
 */
export async function askAutomaton(
  c: Council,
  request: string,
  current: readonly AutomatonSpec[],
  palette: Record<string, TerrainDef>,
  opts: { chi?: string; sentBack?: string } = {},
): Promise<AutomatonAnswer> {
  const terrains = Object.entries(palette).filter(([code, t]) => code !== '?' && t.layer !== 'void');
  const used = totalLoadMs(current);
  const r = await c.ask<Record<string, unknown>>(
    'physicist',
    AUTOMATON_TASK,
    [
      `A member of the Council asks to add, tune or remove a cellular automaton field in this world: «${request}».`,
      current.length
        ? `Active automata (${current.length}/${MAX_AUTOMATA}, total load ${used.toFixed(2)} / ${LOAD_BUDGET_MS.toFixed(2)} ms/tick):\n${current.map(shownAutomaton).join('\n')}`
        : `No automata active yet (0/${MAX_AUTOMATA}, load budget ${LOAD_BUDGET_MS.toFixed(2)} ms/tick).`,
      `Terrains of this world (single-char codes):\n${terrains.map(([code, t]) => `${code} ${t.name} [${t.layer ?? 'ground'}]`).join(', ')}`,
      [
        `Five kernel families (never Lua):`,
        `- flow (virtual pipes: water, lava, quicksand): cell ${CELL_SIZES.flow.join('|')} (default 0.5 = 2 cells/tile side), hz 1-${HZ_LIMITS.flow.max}, gravity ${FLOW_LIMITS.gravity.join('-')}, damp ${FLOW_LIMITS.damp.join('-')}, sources, walls, level.`,
        `- wind (D2Q9): cell ${CELL_SIZES.wind.join('|')} (default 3), hz 1-${HZ_LIMITS.wind.max}, tau ${WIND_LIMITS.tau.join('-')}, prevailingX/Y (|u| <= ${WIND_LIMITS.inflow}), layerHeight ${WIND_LIMITS.layerHeight.join('-')}, obstacles.`,
        `- diffuse (scalar: heat, smoke, scent, damp): cell ${CELL_SIZES.diffuse.join('|')} (default 1), hz 1-${HZ_LIMITS.diffuse.max}, rate ${DIFFUSE_LIMITS.rate.join('-')}, decay ${DIFFUSE_LIMITS.decay.join('-')}, scalarSources, walls, advect (id of a wind/flow automaton), advectScale ${DIFFUSE_LIMITS.advectScale.join('-')}.`,
        `- table (discrete states 2-${TABLE_LIMITS.states[1]}: fire, growth, rot, blight): cell ${CELL_SIZES.table.join('|')} (default 1), hz 1-${HZ_LIMITS.table.max}, states, counted, rules [{from, min, max, to, p}], initial, walls.`,
        `- rules (MarkovJunior XML on a Stepper): cell ${CELL_SIZES.rules.join('|')} (default 1), hz 1-${HZ_LIMITS.rules.max}, program with symmetry="(xy)" on root, only sequence/markov/convolution/prl/all/one, 2-${RULES_LIMITS.states[1]} states, no <import>, steps ${RULES_LIMITS.steps.join('-')}, initial.`,
        `Keep total load within ${LOAD_BUDGET_MS.toFixed(2)} ms/tick and at most ${MAX_AUTOMATA} automata. Use action="remove" with id to delete an automaton.`,
      ].join('\n'),
      opts.sentBack ? `The kernel refused your previous answer: ${opts.sentBack}. Fix every issue within the limits, or give a refusal with the reason.` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    AUTOMATON_SCHEMA,
    {
      data: {
        request,
        current,
        terrains: terrains.map(([code, t]) => ({ code, name: t.name, layer: t.layer })),
        ...(opts.sentBack ? { sentBack: opts.sentBack } : {}),
      },
      temperature: 0.3,
      chi: opts.chi,
    },
  );
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 400) : undefined);
  const action = r.action === 'remove' ? 'remove' : 'set';
  const id = typeof r.id === 'string' ? r.id.trim() : '';
  const refusal = text(r.refusal);
  const note = text(r.note);
  if (action === 'remove') return { action, id, note, refusal };
  // Assemble raw spec object for `validateAutomaton` without clamping anything.
  const raw: Record<string, unknown> = { id, family: r.family };
  if (r.cell !== undefined && r.cell !== null) raw.cell = r.cell;
  if (r.hz !== undefined && r.hz !== null) raw.hz = r.hz;
  if (r.family === 'flow') {
    if (r.gravity !== undefined && r.gravity !== null) raw.gravity = r.gravity;
    if (r.damp !== undefined && r.damp !== null) raw.damp = r.damp;
    if (r.level !== undefined && r.level !== null) raw.level = r.level;
    if (r.sources !== undefined && r.sources !== null) raw.sources = r.sources;
    if (r.walls !== undefined && r.walls !== null) raw.walls = r.walls;
  } else if (r.family === 'wind') {
    if (r.tau !== undefined && r.tau !== null) raw.tau = r.tau;
    if ((r.prevailingX !== undefined && r.prevailingX !== null) || (r.prevailingY !== undefined && r.prevailingY !== null)) {
      raw.prevailing = [r.prevailingX ?? 0, r.prevailingY ?? 0];
    }
    if (r.layerHeight !== undefined && r.layerHeight !== null) raw.layerHeight = r.layerHeight;
    if (r.obstacles !== undefined && r.obstacles !== null) raw.obstacles = r.obstacles;
  } else if (r.family === 'diffuse') {
    if (r.rate !== undefined && r.rate !== null) raw.rate = r.rate;
    if (r.decay !== undefined && r.decay !== null) raw.decay = r.decay;
    if (r.scalarSources !== undefined && r.scalarSources !== null) raw.sources = r.scalarSources;
    if (r.walls !== undefined && r.walls !== null) raw.walls = r.walls;
    if (r.advect !== undefined && r.advect !== null && r.advect !== '') raw.advect = r.advect;
    if (r.advectScale !== undefined && r.advectScale !== null) raw.advectScale = r.advectScale;
  } else if (r.family === 'table') {
    if (r.states !== undefined && r.states !== null) raw.states = r.states;
    if (r.counted !== undefined && r.counted !== null) raw.counted = r.counted;
    if (r.rules !== undefined && r.rules !== null) raw.rules = r.rules;
    if (r.initial !== undefined && r.initial !== null) raw.initial = r.initial;
    if (r.walls !== undefined && r.walls !== null) raw.walls = r.walls;
  } else if (r.family === 'rules') {
    if (r.program !== undefined && r.program !== null) raw.program = r.program;
    if (r.steps !== undefined && r.steps !== null) raw.steps = r.steps;
    if (r.initial !== undefined && r.initial !== null) raw.initial = r.initial;
  }
  return { action, id, raw, note, refusal };
}
