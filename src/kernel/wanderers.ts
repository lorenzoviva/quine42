// The wanderers (T34, ADR-0054): every wanderer has a stable id — `io` when playing alone, the account's
// id later (T44) — and a state of their own in `world/giocatori/<id>.json` (what they carry, needs, states,
// slots, the rune sentence). People's bonds and memories, children and quests say which wanderer they are
// about with that id, so two wanderers in the same world are remembered apart. Pure functions: the kernel
// keeps the entities.

import type { FileMap } from './types';

/** The wanderer of a game alone (and of every universe before T34). */
export const SOLO = 'io';
/** The name people use for a wanderer they know nothing more of. */
export const WANDERER_NAME = 'Viandante';

export interface Wanderer {
  id: string;
  nome: string;
}

/** What a wanderer carries and is, between sessions. */
export interface WandererState {
  nome?: string;
  inventory?: any;
  needs?: Record<string, number>;
  hand?: { tokens: string[]; sel: number };
  stati?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  trasceso?: boolean;
}

export const PLAYERS_DIR = 'world/giocatori/';

/** An id is a short slug (it names a file). */
export function validWandererId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/.test(id);
}

export function playerFile(id: string): string {
  return `${PLAYERS_DIR}${id}.json`;
}

function parse(src: string | undefined): any {
  try {
    return JSON.parse(src ?? 'null');
  } catch {
    return null;
  }
}

/** A wanderer's saved state: their own file, or (for `io`) the wanderer of the old `world/stato.json`. */
export function readWandererState(files: FileMap, id: string): WandererState | undefined {
  const own = parse(files[playerFile(id)]);
  if (own && typeof own === 'object') return own;
  if (id !== SOLO) return undefined;
  const old = parse(files['world/stato.json'])?.viandante;
  return old && typeof old === 'object' ? old : undefined;
}

/** The wanderers the universe knows: one per player file, and `io` if an old state speaks of them. */
export function wanderersIn(files: FileMap): Wanderer[] {
  const out = new Map<string, Wanderer>();
  if (parse(files['world/stato.json'])?.viandante) out.set(SOLO, { id: SOLO, nome: WANDERER_NAME });
  for (const p of Object.keys(files).sort()) {
    if (!p.startsWith(PLAYERS_DIR) || !p.endsWith('.json')) continue;
    const id = p.slice(PLAYERS_DIR.length, -5);
    if (!validWandererId(id)) continue;
    const nome = parse(files[p])?.nome;
    out.set(id, { id, nome: typeof nome === 'string' && nome.trim() ? nome.trim().slice(0, 40) : WANDERER_NAME });
  }
  return [...out.values()];
}

/** The wanderer a relation or a memory is about: its id, or `io` for the old ones that name «Viandante». */
export function wandererOf(x: { nome?: string; con?: string; viandante?: string }): string | undefined {
  if (validWandererId(x.viandante)) return x.viandante;
  const name = (x.nome ?? x.con ?? '').trim().toLowerCase();
  return name === 'viandante' ? SOLO : undefined;
}

/** What a person is to a wanderer, if anything. */
export function bondWith(p: { famiglia?: Array<{ nome: string; legame: string; viandante?: string }>; legameViandante?: string }, id: string): string | undefined {
  const r = (p.famiglia ?? []).find((f) => wandererOf(f) === id);
  return r?.legame ?? (id === SOLO ? p.legameViandante : undefined);
}

/** The memories a person brings to a talk with a wanderer: theirs together and those of the others in the world, not of other wanderers. */
export function memoriesFor<T extends { con?: string; viandante?: string }>(list: T[] | undefined, id: string): T[] {
  return (list ?? []).filter((m) => {
    const w = wandererOf(m);
    return !w || w === id;
  });
}
