import type { Host } from '../src/kernel/sandbox';

/** A host with a fake player and carpet, recording faults and logs. */
export function fakeHost() {
  const player = { x: 0, y: 0, speed: 6 };
  const carpet = { strength: 1, rate: 6, active: true, ox: 0, oy: 0 };
  const faults: Record<string, string> = {};
  const logs: string[] = [];
  const host: Host = {
    query: () => '',
    get: () => undefined,
    spawn: () => undefined,
    destroy: () => {},
    first: () => undefined,
    held: () => false,
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
    fault: (k, m) => {
      faults[k] = m;
    },
  };
  return { host, player, carpet, faults, logs };
}
