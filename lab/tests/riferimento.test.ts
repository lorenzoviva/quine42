// The reference programs of T181 (lab/banco/riferimento/): written by hand with the method of the building site (lab/banco/pattern.md),
// they must run in the game's engine, pass src/mj/check.ts and the bench's threshold, and not be static: another seed is another building.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bersaglio } from '../banco/bersagli';
import { esegui, giudica, misura } from '../banco/misure';
import { prova, SOGLIA_VARIANZA } from '../banco/varianza';

const RIFERIMENTI = [
  { file: 'palazzina', bersaglio: 'moderna' },
  { file: 'forte', bersaglio: 'rocca' },
  { file: 'tempio', bersaglio: 'tempio' },
  // The short skeleton the prompt starts from (T182): small rules and `steps` instead of long patterns.
  { file: 'cantiere', bersaglio: 'moderna' },
];

describe('i programmi di riferimento del cantiere', () => {
  for (const r of RIFERIMENTI) {
    const xml = fs.readFileSync(`lab/banco/riferimento/${r.file}.xml`, 'utf8');
    const b = bersaglio(r.bersaglio)!;

    it(`${r.file}: gira nel motore, passa check.ts e la soglia del banco al seme 1`, () => {
      const e = esegui(xml, b, 1);
      expect(e.result.finished).toBe(true);
      const m = misura(e, b);
      expect(m.analisi.errors).toEqual([]);
      const g = giudica(m, e.scatola);
      expect(g.difetti).toEqual([]);
      expect(m.piani.length).toBeGreaterThanOrEqual(2);
    }, 60_000);

    it(`${r.file}: tre semi alla taglia del bersaglio non sono lo stesso edificio`, () => {
      const p = prova(xml, b, { semi: 3, taglie: [b.taglia ?? 'large'] });
      const t = p.taglie[0];
      expect(t.regge, t.semi.map((s) => `${s.seme}: ${s.difetti.join(', ')}`).join(' | ')).toBe(true);
      expect(t.varianza?.statico).toBe(false);
      expect(t.varianza!.voxel).toBeGreaterThanOrEqual(SOGLIA_VARIANZA.voxel);
    }, 120_000);
  }
});
