// The cover of a terrain with the world on (T545, ADR-0269, D1 of T509): a request (the Referente's: «more grass on the meadow», «small
// stones on the sand») becomes the whole cover of one terrain, chosen by the Cartographer among the programs of the class `cover` the
// library has. The kernel reads it within its limits (`Kernel.setCover`, `COVER_LIMITS`) and commits it; what it refuses comes back here
// once, with the reason. A cover the library does not have is not invented here: it is a refusal, and the Landscaper sculpts new ones
// (C2 of docs/design/terreno-ricco.md).

import type { Schema } from '../ai/models';
import type { Council } from './council';
import type { TerrainDef } from '../types';
import { COVER_LIMITS, coverOf, coversGround } from '../cover';

export const COVER_TASK = 'terrain.cover';

const COVER_SCHEMA: Schema = {
  type: 'OBJECT',
  properties: {
    code: { type: 'STRING', description: 'the code of the terrain whose cover changes (one of the list)' },
    cover: {
      type: 'ARRAY',
      description: `its whole cover after the change, the kinds it keeps too: at most ${COVER_LIMITS.kinds}, each a program of the list and how many stand on a tile on average, ${COVER_LIMITS.density.join('-')}; an empty list takes it all away`,
      items: { type: 'OBJECT', properties: { model: { type: 'STRING' }, density: { type: 'NUMBER' } }, required: ['model', 'density'] },
    },
    note: { type: 'STRING', description: 'in one sentence, in the language of the world, what one sees there now' },
    refusal: { type: 'STRING', description: 'only if no terrain of the list or no cover of the list fits the request: why not' },
  },
  required: ['code', 'cover'],
};

export interface CoverAnswer {
  code: string;
  cover: unknown;
  note?: string;
  refusal?: string;
}

/**
 * The Cartographer gives a terrain the cover the request asks: among the ground one walks (`coversGround`) and the programs of the class
 * `cover` of the library (`library`: id and name). `sentBack` is what the kernel refused of its first answer.
 */
export async function askCover(c: Council, request: string, palette: Record<string, TerrainDef>, library: ReadonlyArray<{ id: string; name: string }>, opts: { chi?: string; sentBack?: string } = {}): Promise<CoverAnswer> {
  const terrains = Object.entries(palette).filter(([code, t]) => code !== '?' && coversGround(t));
  const shown = (code: string, t: TerrainDef) => {
    const cover = coverOf(t);
    return `${code} ${t.name}${t.description ? ` (${t.description})` : ''}: ${cover?.length ? cover.map((k) => `${k.model} ${k.density}`).join(', ') : 'nothing grows on it'}`;
  };
  const r = await c.ask<{ code?: unknown; cover?: unknown; note?: unknown; refusal?: unknown }>(
    'cartographer',
    COVER_TASK,
    [
      `The world is already alive. A member of the Council asks to change what grows or lies on a terrain (its cover: tufts, small stones, shrubs, wheat, scattered over its tiles; only how it looks, never something one takes): «${request}».`,
      `The terrains one walks on, with their cover now (program and how many a tile):\n${terrains.map(([code, t]) => shown(code, t)).join('\n')}`,
      `The covers the world has (program: name):\n${library.map((m) => `${m.id}: ${m.name}`).join('\n')}`,
      `Answer the terrain's code and its whole cover after the change: at most ${COVER_LIMITS.kinds} kinds, only programs of this list, each ${COVER_LIMITS.density.join('-')} a tile (1 a living meadow, 2 a thick one, 4 a dense undergrowth). Never on a road, a path, a floor, the water or a wall. A cover the list does not have, or a thing to take (a key, a stone that hides something), is not yours: say so in "refusal".`,
      opts.sentBack ? `The kernel refused your answer: ${opts.sentBack}. Answer again within the rules, or give a refusal with the reason.` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    COVER_SCHEMA,
    { data: { request, terrains: terrains.map(([code, t]) => ({ code, name: t.name, cover: coverOf(t) ?? [] })), library, ...(opts.sentBack ? { sentBack: opts.sentBack } : {}) }, temperature: 0.3, chi: opts.chi },
  );
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 400) : undefined);
  return { code: typeof r.code === 'string' ? r.code.trim() : '', cover: r.cover, note: text(r.note), refusal: text(r.refusal) };
}
