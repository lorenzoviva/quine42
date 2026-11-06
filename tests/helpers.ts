import { italianName } from '../src/kernel/internalNames';
﻿import type { Host } from '../src/kernel/sandbox';

/** A host with a fake player and carpet, recording faults and logs. */
export function fakeHost() {
  const player = { x: 0, y: 0, speed: 6 };
  const carpet = { strength: 1, rate: 6, active: true, ox: 0, oy: 0 };
  const faults: Record<string, string> = {};
  const logs: string[] = [];
  const host: Host = {
    query: () => '',
    get: () => undefined,
    set: () => false,
    spawn: () => undefined,
    destroy: () => {},
    first: () => undefined,
    held: () => false,
    wanderers: () => [],
    path: () => undefined,
    find_tile: () => undefined,
    act: () => undefined,
    venture: () => undefined,
    venture_bring: () => 0,
    store_get: () => undefined,
    store_set: () => false,
    free: () => true,
    free_real: () => true,
    tile: () => 'g',
    player_get: (k) => (player as any)[k],
    player_set: (k, v) => {
      if (typeof v !== 'number' || !Number.isFinite(v)) return `${k} deve essere un numero`;
      (player as any)[k] = v;
      return undefined;
    },
    carpet: () => carpet,
    time: () => 1.5,
    log: (m) => logs.push(m),
    emit: () => {},
    describe: (v) => (v === carpet ? 'carpet{...}' : typeof v),
    speed_at: () => 1,
    spawn_module: () => undefined,
    player_id: () => 1,
    player_pos: () => ({ x: player.x, y: player.y }),
    nearest: () => undefined,
    has_tag: () => false,
    break_entity: () => {},
    say: (m) => logs.push(m),
    speak: () => {},
    inv_add: () => 0,
    inv_remove: () => 0,
    inv_count: () => 0,
    inv_equipped: () => undefined,
    item_find: () => undefined,
    item_def: () => undefined,
    set_tile: () => false,
    open: () => false,
    make_container: () => false,
    item_bonus: () => 0,
    slot_get: () => undefined,
    fault: (k, m) => {
      faults[k] = m;
    },
  };
  return { host, player, carpet, faults, logs };
}

/**
 * Programs of the seed that do not pass the sound analysis and stay as they are, because the author chose them by ear: what the thresholds say of them, so that nothing else slips in.
 * «morte» is the same on every seed (ADR-0125 calls it `ripetitivo`); the game plays one seed of it. To change it, ask the author.
 */
const SOUNDS_KEPT_BY_THE_AUTHOR: Record<string, string[]> = { 'sound-effect-death': ['repetitive'] };
export const keptByTheAuthor = (id: string): string[] => SOUNDS_KEPT_BY_THE_AUTHOR[id] ?? [];
/** What the validator says of a program of the seed: nothing, or the defects of the author's choice. */
export const expectedModelErrors = (id: string): RegExp[] => keptByTheAuthor(id).map((defect) => new RegExp(`^models/${id}\.xml: suono ${italianName('solo-codice', defect)}: `));
