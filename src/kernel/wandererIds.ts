// Who a wanderer is, as an id (T34, ADR-0054; T327): `me` when playing alone, the account's id later, «Viandante» for whoever is not
// known, and the wanderer a relation or a memory is about. Pure and with no other import of the kernel than the reserved names, so
// that the people of the world (`npc/`) and the wanderers (`wanderers.ts`) both read it and neither imports the other.

import { reservedName } from './paths';

/** The wanderer of a game alone (and of every universe before T34). */
export const SOLO = 'me';
/** The name people use for a wanderer they know nothing more of. */
export const WANDERER_NAME = 'Viandante';

/** An id is a short slug (it names a file). */
export function validWandererId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) && !reservedName(id);
}

/** The wanderer a relation or a memory is about: its id, or `me` for the old ones that name «Viandante». */
export function wandererOf(x: { name?: string; with?: string; wanderer?: string }): string | undefined {
  if (validWandererId(x.wanderer)) return x.wanderer;
  const name = (x.name ?? x.with ?? '').trim().toLowerCase();
  return name === 'viandante' ? SOLO : undefined;
}
