// The situation table of the Direction (T46a): the world seen from above, not as geography (that is the atlas) but
// as operations — the wanderer, the places the Council is generating now, the open plots at the beat they are at, the
// quests of the diary, the faults where they happened. Everything comes from what the kernel already has; looking
// changes nothing. Positions are chunks (carpet space), as in the atlas. In a multiplayer game the master sees the
// players connected too, each on their chunk (T42c).

import { normName } from './content';
import { regionAt, type Atlas } from './atlas';
import type { Plot } from './plots';
import type { Fault } from './faults';
import { italianName } from './internalNames';

export type OperationKind = 'wanderer' | 'player' | 'chunk' | 'plot' | 'quest' | 'fault';

/** Another wanderer connected now (T42c): who, and where in the world (carpet space). */
export interface PlayerSpot {
  id: string;
  name: string;
  x: number;
  y: number;
}

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
  /** A player connected: their id, to follow them. */
  who?: string;
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
  /** The other wanderers connected (a multiplayer game). */
  players?: PlayerSpot[];
  chunks: Array<{ cx: number; cy: number; stage: 'draft' | 'planned'; developing?: boolean; name?: string }>;
  /** Where an individual is (their chunk), if anyone knows. */
  locate: (name: string) => { cx: number; cy: number } | undefined;
  chunkSize: number;
}

export const OPERATION_NAME: Record<OperationKind, string> = {
  wanderer: 'il viandante',
  player: 'giocatori collegati',
  chunk: 'luoghi in generazione',
  plot: 'trame aperte',
  quest: 'missioni',
  fault: 'guasti',
};

/** The colours of the marks, on the table and in the panel: faults in red. */
export const OPERATION_COLOR: Record<OperationKind, string> = {
  wanderer: '#ffffff',
  player: '#c77dff',
  chunk: '#05d9e8',
  plot: '#ffcf5c',
  quest: '#7dd87d',
  fault: '#ff3b3b',
};

export function situation(s: SituationInput): Situation {
  const ops: Operation[] = [];
  const names = new Map(s.chunks.filter((c) => c.name).map((c) => [`${c.cx},${c.cy}`, c.name!]));
  const at = (op: Operation, c: { cx: number; cy: number } | undefined): Operation => {
    if (!c) return op;
    // The first place is nobody's region (as for the Cartographer).
    const region = c.cx === 0 && c.cy === 0 ? undefined : regionAt(s.atlas, c.cx, c.cy)?.name;
    return { ...op, cx: c.cx, cy: c.cy, ...(region ? { region } : {}), ...(names.has(`${c.cx},${c.cy}`) ? { place: names.get(`${c.cx},${c.cy}`) } : {}) };
  };
  // A place or a region by its name (a quest to «go to»).
  const named = (name: string | undefined): { cx: number; cy: number } | undefined => {
    const n = normName(name ?? '');
    if (!n) return undefined;
    const ch = s.chunks.find((c) => c.name && normName(c.name) === n);
    if (ch) return ch;
    const r = s.atlas.regions.find((x) => normName(x.name) === n || n.includes(normName(x.name)));
    return r ? { cx: r.center[0], cy: r.center[1] } : undefined;
  };

  ops.push(at({ kind: 'wanderer', label: 'il viandante', detail: 'è qui' }, s.wanderer));
  for (const p of s.players ?? [])
    ops.push(at({ kind: 'player', label: p.name, detail: `collegato, a ${Math.floor(p.x)},${Math.floor(p.y)}`, who: p.id }, { cx: Math.floor(p.x / s.chunkSize), cy: Math.floor(p.y / s.chunkSize) }));
  for (const c of s.chunks) {
    if (c.stage !== 'draft') continue;
    ops.push(at({ kind: 'chunk', label: `luogo ${c.cx},${c.cy}`, detail: c.developing ? 'il Cartografo lo sta pianificando' : 'in coda', ...(c.developing ? { live: true } : {}) }, c));
  }
  for (const p of s.plots) {
    if (p.state !== 'active') continue;
    const i = p.beats.findIndex((b) => !b.done);
    const beat = p.beats[i < 0 ? p.beats.length - 1 : i];
    const where = (beat && s.locate(beat.who)) ?? p.involved.map(s.locate).find(Boolean);
    const tappa = beat ? `tappa ${(i < 0 ? p.beats.length - 1 : i) + 1}/${p.beats.length}${i < 0 ? ' (fatte tutte)' : ''}: ${beat.who} ${beat.what} (${italianName('dove', beat.where)}, ${italianName('momenti', beat.moment)}, giorno ${p.start + beat.day})` : 'nessuna tappa';
    ops.push(at({ kind: 'plot', label: p.title, detail: tappa }, where));
    const q = p.quest;
    if (q?.state === 'accepted') {
      const o = q.goal;
      const goal = o.type === 'bring' ? `porta ${o.item ?? 'ciò che serve'} a ${o.to ?? q.from}` : o.type === 'go' ? `vai a ${o.place ?? '?'}` : `parla con ${o.to ?? '?'}`;
      ops.push(at({ kind: 'quest', label: p.title, detail: `${q.from}: ${goal}` }, (o.type === 'go' ? named(o.place) : undefined) ?? s.locate(o.to ?? q.from)));
    }
  }
  for (const f of s.faults) {
    const c = f.at ? { cx: Math.floor(f.at.x / s.chunkSize), cy: Math.floor(f.at.y / s.chunkSize) } : undefined;
    ops.push(at({ kind: 'fault', label: f.key, detail: f.count > 1 ? `${f.message} (×${f.count})` : f.message }, c));
  }

  const regions = s.atlas.regions.map((r) => ({ nome: r.name, centro: r.center, raggio: r.radius }));
  const xs = [...ops.flatMap((o) => (o.cx === undefined ? [] : [o.cx])), ...regions.flatMap((r) => [r.centro[0] - r.raggio, r.centro[0] + r.raggio])];
  const ys = [...ops.flatMap((o) => (o.cy === undefined ? [] : [o.cy])), ...regions.flatMap((r) => [r.centro[1] - r.raggio, r.centro[1] + r.raggio])];
  const bounds = { x0: Math.min(...xs) - 1, y0: Math.min(...ys) - 1, x1: Math.max(...xs) + 1, y1: Math.max(...ys) + 1 };
  return { ops, regions, bounds };
}
