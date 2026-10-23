// The situation table of the Direction (T46a): the world seen from above, not as geography (that is the atlas) but
// as operations — the wanderer, the places the Council is generating now, the open plots at the beat they are at, the
// quests of the diary, the faults where they happened. Everything comes from what the kernel already has; looking
// changes nothing. Positions are chunks (carpet space), as in the atlas.

import { normName } from './content';
import { regionAt, type Atlas } from './atlas';
import type { Plot } from './plots';
import type { Fault } from './faults';

export type OperationKind = 'viandante' | 'luogo' | 'trama' | 'missione' | 'guasto';

export interface Operation {
  kind: OperationKind;
  label: string;
  detail: string;
  /** The chunk it is at; without one it is listed in the panel but not on the table. */
  cx?: number;
  cy?: number;
  /** The region of the atlas it falls in, and the place there if it is planned. */
  region?: string;
  place?: string;
  /** A place being generated now: it pulses. */
  live?: boolean;
}

export interface Situation {
  ops: Operation[];
  regions: Array<{ nome: string; centro: [number, number]; raggio: number }>;
  /** The chunks the table shows (all the operations and the regions, with a margin). */
  bounds: { x0: number; y0: number; x1: number; y1: number };
}

export interface SituationInput {
  atlas: Atlas;
  plots: Plot[];
  faults: Fault[];
  wanderer: { cx: number; cy: number };
  chunks: Array<{ cx: number; cy: number; stage: 'draft' | 'planned'; developing?: boolean; name?: string }>;
  /** Where a person is (their chunk), if anyone knows. */
  locate: (name: string) => { cx: number; cy: number } | undefined;
  chunkSize: number;
}

export const OPERATION_NAME: Record<OperationKind, string> = {
  viandante: 'il viandante',
  luogo: 'luoghi in generazione',
  trama: 'trame aperte',
  missione: 'missioni',
  guasto: 'guasti',
};

/** The colours of the marks, on the table and in the panel: faults in red. */
export const OPERATION_COLOR: Record<OperationKind, string> = {
  viandante: '#ffffff',
  luogo: '#05d9e8',
  trama: '#ffcf5c',
  missione: '#7dd87d',
  guasto: '#ff3b3b',
};

export function situation(s: SituationInput): Situation {
  const ops: Operation[] = [];
  const names = new Map(s.chunks.filter((c) => c.name).map((c) => [`${c.cx},${c.cy}`, c.name!]));
  const at = (op: Operation, c: { cx: number; cy: number } | undefined): Operation => {
    if (!c) return op;
    // The first place is nobody's region (as for the Cartographer).
    const region = c.cx === 0 && c.cy === 0 ? undefined : regionAt(s.atlas, c.cx, c.cy)?.nome;
    return { ...op, cx: c.cx, cy: c.cy, ...(region ? { region } : {}), ...(names.has(`${c.cx},${c.cy}`) ? { place: names.get(`${c.cx},${c.cy}`) } : {}) };
  };
  // A place or a region by its name (a quest to «go to»).
  const named = (name: string | undefined): { cx: number; cy: number } | undefined => {
    const n = normName(name ?? '');
    if (!n) return undefined;
    const ch = s.chunks.find((c) => c.name && normName(c.name) === n);
    if (ch) return ch;
    const r = s.atlas.regioni.find((x) => normName(x.nome) === n || n.includes(normName(x.nome)));
    return r ? { cx: r.centro[0], cy: r.centro[1] } : undefined;
  };

  ops.push(at({ kind: 'viandante', label: 'il viandante', detail: 'è qui' }, s.wanderer));
  for (const c of s.chunks) {
    if (c.stage !== 'draft') continue;
    ops.push(at({ kind: 'luogo', label: `luogo ${c.cx},${c.cy}`, detail: c.developing ? 'il Cartografo lo sta pianificando' : 'in coda', ...(c.developing ? { live: true } : {}) }, c));
  }
  for (const p of s.plots) {
    if (p.stato !== 'attiva') continue;
    const i = p.tappe.findIndex((b) => !b.fatto);
    const beat = p.tappe[i < 0 ? p.tappe.length - 1 : i];
    const where = (beat && s.locate(beat.chi)) ?? p.coinvolti.map(s.locate).find(Boolean);
    const tappa = beat ? `tappa ${(i < 0 ? p.tappe.length - 1 : i) + 1}/${p.tappe.length}${i < 0 ? ' (fatte tutte)' : ''}: ${beat.chi} ${beat.cosa} (${beat.dove}, ${beat.momento}, giorno ${p.inizio + beat.giorno})` : 'nessuna tappa';
    ops.push(at({ kind: 'trama', label: p.titolo, detail: tappa }, where));
    const q = p.missione;
    if (q?.stato === 'accettata') {
      const o = q.obiettivo;
      const goal = o.tipo === 'porta' ? `porta ${o.oggetto ?? 'ciò che serve'} a ${o.a ?? q.da}` : o.tipo === 'vai' ? `vai a ${o.luogo ?? '?'}` : `parla con ${o.a ?? '?'}`;
      ops.push(at({ kind: 'missione', label: p.titolo, detail: `${q.da}: ${goal}` }, (o.tipo === 'vai' ? named(o.luogo) : undefined) ?? s.locate(o.a ?? q.da)));
    }
  }
  for (const f of s.faults) {
    const c = f.at ? { cx: Math.floor(f.at.x / s.chunkSize), cy: Math.floor(f.at.y / s.chunkSize) } : undefined;
    ops.push(at({ kind: 'guasto', label: f.key, detail: f.count > 1 ? `${f.message} (×${f.count})` : f.message }, c));
  }

  const regions = s.atlas.regioni.map((r) => ({ nome: r.nome, centro: r.centro, raggio: r.raggio }));
  const xs = [...ops.flatMap((o) => (o.cx === undefined ? [] : [o.cx])), ...regions.flatMap((r) => [r.centro[0] - r.raggio, r.centro[0] + r.raggio])];
  const ys = [...ops.flatMap((o) => (o.cy === undefined ? [] : [o.cy])), ...regions.flatMap((r) => [r.centro[1] - r.raggio, r.centro[1] + r.raggio])];
  const bounds = { x0: Math.min(...xs) - 1, y0: Math.min(...ys) - 1, x1: Math.max(...xs) + 1, y1: Math.max(...ys) + 1 };
  return { ops, regions, bounds };
}
