// The Physicist with the world on (T452, ADR-0235): a request (the Referente's, or a rule of the world that changes the physics) becomes the
// terrains reshaped and the gravity of the world, within the kernel's limits. The kernel reads the answer (`src/kernel/reshape.ts`), measures
// whether it would cut a place (rule 10) and commits it; what it refuses comes back here once, with the reasons.

import type { Schema } from '../ai/models';
import type { Council } from './council';
import { CROSSINGS, DEPTHS, NATURE_ACCEPTS, TERRAIN_LIMITS, crossingOf, terrainPhysics } from '../nature';
import { BASE_CODES } from './genesis';
import type { TerrainDef } from '../types';
import type { TerrainChange } from '../reshape';

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
