// The measure between concepts and between seeds and the views in text (T337): what they see and what they do not.

import { describe, expect, it } from 'vitest';
import type { Grid3, PaletteEntry } from '../../src/mj/engine';
import { colore, confronta, distanza, formaDi, voxel, type Forma } from '../banco/concetti';
import { vistaAlzato, vistaPianta, vistaSezione } from '../banco/viste';

const PALETTE: Record<string, PaletteEntry> = { A: { color: '#888888' }, C: { color: '#aa4444' }, M: { hidden: true } };

/** A grid of X·Y·Z with the cells `fill` returns a letter for. */
function griglia(X: number, Y: number, Z: number, fill: (x: number, y: number, z: number) => string | undefined): Grid3 {
  const alphabet = ['B', 'A', 'C', 'M'];
  const cells = new Uint8Array(X * Y * Z);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const l = fill(x, y, z);
        if (l) cells[x + y * X + z * X * Y] = alphabet.indexOf(l);
      }
  return { X, Y, Z, cells, alphabet, log: [], epoch: 0 };
}

const forma = (g: Grid3, nome = 'p', seme = 1): Forma => formaDi(nome, seme, g, PALETTE);
/** A low block over most of the plan, a slender tower, a hollow ring around a courtyard. */
const blocco = (l = 'A') => griglia(24, 24, 24, (x, y, z) => (x >= 3 && x < 21 && y >= 3 && y < 21 && z < 8 ? l : undefined));
const torre = () => griglia(24, 24, 24, (x, y) => (x >= 9 && x < 15 && y >= 9 && y < 15 ? 'A' : undefined));
const anello = () => griglia(24, 24, 24, (x, y, z) => (x >= 3 && x < 21 && y >= 3 && y < 21 && !(x >= 6 && x < 18 && y >= 6 && y < 18) && z < 10 ? 'A' : undefined));

describe('la misura tra concetti (concetti.ts)', () => {
  it('non vede i colori: lo stesso edificio ridipinto è a distanza zero, e il colore lo dice a parte', () => {
    const a = forma(blocco('A')), b = forma(blocco('C'));
    expect(distanza(a, b).distanza).toBe(0);
    expect(voxel(a, b)).toBe(0);
    expect(colore(a, b)).toBe(1);
  });

  it('distingue una torre da un blocco basso nella pianta, nella sagoma e nei pieni', () => {
    const d = distanza(forma(blocco()), forma(torre()));
    expect(d.impronta).toBeGreaterThan(0.8);
    expect(d.profilo).toBeGreaterThan(0.5);
    expect(d.pieni).toBeGreaterThan(0.3);
  });

  it('dice il cortile chiuso, i picchi e il pieno', () => {
    const r = forma(anello());
    expect(r.cortile).toBeCloseTo(144 / 324, 2);
    // A tower over a low body is a peak; a tower alone is its own median.
    const conTorre = griglia(24, 24, 24, (x, y, z) => ((x >= 3 && x < 21 && y >= 3 && y < 21 && z < 6) || (x >= 9 && x < 15 && y >= 9 && y < 15) ? 'A' : undefined));
    expect(forma(conTorre).torri).toBe(1);
    expect(forma(torre()).torri).toBe(0);
    expect(forma(blocco()).pieno).toBe(1);
  });

  it('separazione: due concetti diversi più lontani di due semi dello stesso', () => {
    const spostato = (dx: number) => griglia(24, 24, 24, (x, y, z) => (x >= 3 + dx && x < 21 + dx && y >= 3 && y < 21 && z < 8 ? 'A' : undefined));
    const c = confronta([
      { nome: 'blocco', concetto: 'blocco', forme: [forma(spostato(0), 'blocco', 1), forma(spostato(1), 'blocco', 2), forma(spostato(2), 'blocco', 3)] },
      { nome: 'torre', concetto: 'torre', forme: [forma(torre(), 'torre', 1), forma(torre(), 'torre', 2)] },
    ]);
    expect(c.fra.distanza).toBeGreaterThan(c.dentro.distanza);
    expect(c.separazione.distanza).toBeGreaterThan(2);
    expect(c.vicini).toBe(1);
    expect(c.matrice.concetti).toEqual(['blocco', 'torre']);
  });
});

describe('le viste in testo (viste.ts)', () => {
  // A wall along the back (y = 0) two cells high, a marker at the front: the back is drawn at the top.
  const g = griglia(4, 3, 3, (x, y, z) => (y === 0 && z < 2 ? 'A' : y === 2 && x === 1 && z === 0 ? 'M' : undefined));

  it('la pianta mette il retro in alto e mostra anche i marcatori', () => {
    const p = vistaPianta(g, PALETTE, { passo: 1 });
    expect(p.pianta.split('\n')).toEqual(['AAAA', '....', '.M..']);
    expect(p.altezze.split('\n')[0]).toMatch(/^(\w)\1\1\1$/);
  });

  it('il fronte e la sezione', () => {
    expect(vistaAlzato(g, PALETTE, 'fronte', { passo: 1 }).testo.split('\n')).toEqual(['AAAA', 'AMAA']);
    expect(vistaSezione(g, PALETTE, 1, { passo: 1 }).testo.split('\n')).toEqual(['AAAA', '....', '....']);
  });
});
