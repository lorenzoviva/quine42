// The programs written from the procedural prompt (T182, lab/banco/procedurale/): those the bench passed must keep running in the game's engine,
// pass src/mj/check.ts and today's measures. One seed per program here: the seeds and sizes are in each `varianza.json`, the suite only guards the engine.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bersaglio } from '../banco/bersagli';
import { esegui, giudica, misura } from '../banco/misure';

const RADICE = 'lab/banco/procedurale';
const passati = fs.existsSync(RADICE)
  ? fs.readdirSync(RADICE).flatMap((b) => {
      if (!bersaglio(b)) return [];
      return fs.readdirSync(path.join(RADICE, b)).flatMap((n) => {
        const dir = path.join(RADICE, b, n);
        const finale = ['seconda', ''].map((s) => path.join(dir, s)).find((d) => fs.existsSync(path.join(d, 'modello.xml')));
        if (!finale) return [];
        const scheda = JSON.parse(fs.readFileSync(path.join(finale, 'misure.json'), 'utf8')) as { passa: boolean };
        return scheda.passa ? [{ b, n, finale }] : [];
      });
    })
  : [];

describe('i programmi del prompt procedurale (T182)', () => {
  it('ce ne sono', () => expect(passati.length).toBeGreaterThan(0));
  for (const { b, n, finale } of passati) {
    it(`${b}/${n}: gira nel motore e passa le misure al seme 1`, () => {
      const t = bersaglio(b)!;
      const e = esegui(fs.readFileSync(path.join(finale, 'modello.xml'), 'utf8'), t, 1);
      const m = misura(e, t);
      expect(m.analisi.errors.filter((x) => !/termina|tempo/.test(x))).toEqual([]);
      // The time limit depends on what else the machine is doing: the bench measured it alone.
      expect(giudica(m, e.scatola).difetti.filter((d) => !/^(finisce|valido)/.test(d))).toEqual([]);
    }, 120_000);
  }
});
