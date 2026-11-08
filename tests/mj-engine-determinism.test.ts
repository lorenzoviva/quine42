// The engine runs every program as it did before its optimisation (D33, T258): the same grid, voxel by voxel, on the same seed. The
// fingerprints in the fixture were taken with the engine before the change (`lab/scripts/mj-hashes.ts -- --scrivi`); a change of the
// engine that moves one voxel of one model, one step, one action or one frame of an animation fails here. The programs of the seed written
// with the symbols `#n` (T342, ADR-0175) give the grids and the samples their text of 0.5 gave: the fixtures are of before. One line
// only was written again, the text of a node that never acts in `fattoria#2`: it names its union, `#` before and `^` now.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIXTURE, SOUND_FIXTURE, suoni, voci } from '../lab/scripts/mj-hashes';

const attese: Record<string, string> = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', FIXTURE), 'utf8'));
const tutte = voci();
// The sound programs of the seed, sample by sample (T342: the symbols `#n` changed the text of the programs, not what they play).
const suonate: Record<string, string> = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', SOUND_FIXTURE), 'utf8'));

describe('il motore MarkovJunior non cambia un voxel', () => {
  it('la fixture ha ogni programma', () => {
    expect(Object.keys(attese).sort()).toEqual(tutte.map((v) => v.nome).sort());
  });
  it('i modelli dell\'universo, con azioni e animazioni', () => {
    const diversi = tutte.filter((v) => v.nome.startsWith('universe/')).filter((v) => v.run() !== attese[v.nome]).map((v) => v.nome);
    expect(diversi).toEqual([]);
  }, 300_000);
  it('i suoni del seme, campione per campione', () => {
    const tutti = suoni();
    expect(Object.keys(suonate).sort()).toEqual(tutti.map((v) => v.nome).sort());
    expect(tutti.filter((v) => v.run() !== suonate[v.nome]).map((v) => v.nome)).toEqual([]);
  }, 300_000);
  for (const v of tutte.filter((v) => !v.nome.startsWith('universe/')))
    it(v.nome, () => {
      expect(v.run()).toBe(attese[v.nome]);
    }, 120_000);
});
