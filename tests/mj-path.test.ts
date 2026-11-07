// The `path` node runs as it did before T315 rewrote it without allocations (ADR-0142, ADR-0164): the same grid and the same steps on
// the same seed. The fingerprints were taken with the engine before the change; the models of the seed with a path (circuito-3D,
// fattoria, sound-melodic-path) are in tests/mj-engine-determinism.test.ts as well.

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { runOn } from '../src/mj/engine';
import { PATH_CASES } from './mj-path-cases';

const BEFORE: Record<string, string> = {
  'labirinto, la via più lunga #1': 'b09120da670da515',
  'labirinto, la via più lunga #2': 'cdf57f6259c8ca2d',
  'labirinto, la via più lunga #3': 'ab3a841a362f4d71',
  'labirinto, la via più lunga #42': '0a469344914472f1',
  'labirinto, la via più lunga #4242': '9f0484a372e8bc83',
  'labirinto, una via qualunque con inerzia #5': 'f887a111ab12dd1b',
  'labirinto, una via qualunque con inerzia #6': '4aa4490447583ea1',
  'labirinto, una via qualunque con inerzia #7': '405bcefb1e60fb0e',
  'campo aperto, molte partenze, la più lunga con inerzia #1': '834dbac272c8dc5e',
  'campo aperto, molte partenze, la più lunga con inerzia #9': '834dbac272c8dc5e',
  'campo aperto, molte partenze, la più lunga, senza inerzia #1': '6592690720eb5bcf',
  'campo aperto, molte partenze, la più lunga, senza inerzia #9': 'b153f8a33966a6b6',
  'campo aperto, molte partenze, la più lunga, senza inerzia #23': '8e46637ddccaa907',
  'tre dimensioni, intorno a un muro #3': '02d0d02a21714e89',
  'tre dimensioni, intorno a un muro #11': '58483456f31839fe',
  'tre dimensioni, intorno a un muro #12': '8a27ba02bb114196',
  'nessuna via #1': '004b8d826388d633',
};

describe('il nodo path non cambia un voxel', () => {
  for (const c of PATH_CASES)
    for (const seed of c.seeds)
      it(`${c.name} #${seed}`, () => {
        const g = c.grid();
        const r = runOn(g, { palette: c.palette, program: c.program }, seed, 1_000_000);
        expect(createHash('sha1').update(g.cells).update(`|${r.steps}`).digest('hex').slice(0, 16)).toBe(BEFORE[`${c.name} #${seed}`]);
      });
});
