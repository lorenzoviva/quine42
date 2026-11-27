// The rules and the matches of MarkovJunior of mxgmn in our engine (T527, A1-2, ADR-0268; docs/design/markov-allineamento.md § 3.3, § 8).
//
// With the switch of the semantics on (`semantics: 'mj'`, T526, ADR-0263): the variants of every rule in SymmetryHelper's order (the
// square's subgroups on a flat grid, the cube's on the others), a match wherever the input fits, the original's lazy list (a scan at the
// pattern's stride with its shifts, the cells written since the turn the node last matched in, `matchMask`), `one` uniform without `p`,
// `all` with the «inside-out» shuffle and every cell it writes in the list of changes, `prl` with a NextDouble per match on the grid as
// it was, its empty turns and `p="0"`, every turn a step. The oracle is the reference (lab/banco/conformita/riferimento.ts, the original
// line by line in TypeScript): the same grid voxel by voxel, the same steps, the same end. With the switch off nothing changes: the
// fingerprints of every program of today are in tests/mj-engine-determinism.test.ts (ADR-0142).

import { describe, expect, it } from 'vitest';
import { runReference } from '../lab/banco/conformita/riferimento';
import { run, Stepper, type Grid3, type Program3 } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';

type Vec3 = [number, number, number];
interface Program {
  name: string;
  xml: string;
  size: Vec3;
  steps: number;
}

const SEEDS = [1, 2, 3, 4];

/** The grid as the reference writes it: a line per row, the layers from the bottom with a blank line between them. */
function text(g: Grid3, empty: string): string {
  const layers: string[] = [];
  for (let z = 0; z < g.Z; z++) {
    const rows: string[] = [];
    for (let y = 0; y < g.Y; y++) {
      let row = '';
      for (let x = 0; x < g.X; x++) {
        const c = g.cells[x + y * g.X + z * g.X * g.Y];
        row += c === 0 ? empty : g.alphabet[c];
      }
      rows.push(row);
    }
    layers.push(rows.join('\n'));
  }
  return layers.join('\n\n');
}

/** Our engine from an empty box with the original's origin, the switch on unless told `ours`: its grid, steps and end. */
function ours(p: Program, seed: number, semantics: 'mj' | 'ours' = 'mj') {
  const m = compileMjx(p.xml, { size: p.size, original: true, strict: true, ...(semantics === 'mj' ? { semantics } : {}) });
  const r = run(m.program as Program3, seed, p.steps);
  return { text: text(r.grid, m.background), steps: r.steps, finished: r.finished };
}

/** The reference, the original line by line. */
function original(p: Program, seed: number) {
  const r = runReference(p.xml, p.size, seed, p.steps);
  return { text: r.text, steps: r.steps, finished: r.finished };
}

function asTheOriginal(programs: Program[]): void {
  for (const p of programs) for (const seed of SEEDS) expect(ours(p, seed), `${p.name}, seme ${seed}`).toEqual(original(p, seed));
}

describe('le simmetrie dell’originale (SymmetryHelper)', () => {
  it('su una griglia piana il gruppo del quadrato, nel suo ordine: (xy), (x)(y), (xy+)', () => {
    asTheOriginal([
      { name: 'il labirinto in 2D', xml: '<one values="BWA" in="WBB" out="WAW" origin="True"/>', size: [21, 21, 1], steps: 50_000 },
      { name: 'una regola 2 × 2 senza simmetrie sue', xml: '<sequence values="BWRG" origin="True"><one in="WB/BB" out="WR/GB" steps="40"/><one in="RB" out="RR" steps="30"/></sequence>', size: [17, 17, 1], steps: 50_000 },
      { name: '(x)(y): i due specchi e il mezzo giro', xml: '<one values="BWR" origin="True" symmetry="(x)(y)"><rule in="WB/BB" out="WR/RW"/></one>', size: [25, 25, 1], steps: 50_000 },
      { name: '(xy+): i quattro giri', xml: '<one values="BWR" origin="True" symmetry="(xy+)" in="WBB/BBB" out="WRW/BBB" steps="60"/>', size: [19, 19, 1], steps: 50_000 },
    ]);
  });

  it('su una griglia di più strati il gruppo del cubo: (xyz+), (xy), (z), e la simmetria di una regola', () => {
    asTheOriginal([
      { name: '(xyz+) su una regola 2 × 2 × 2', xml: '<one values="BWR" origin="True" symmetry="(xyz+)" in="WB/BB BB/BB" out="WR/BB BB/BW" steps="40"/>', size: [11, 11, 11], steps: 50_000 },
      { name: '(xy) in 3D, una regola piana e una di due strati', xml: '<one values="BWR" origin="True" symmetry="(xy)"><rule in="WB/BB" out="WR/RW"/><rule in="BB WB" out="BW WR"/></one>', size: [13, 13, 9], steps: 50_000 },
      { name: '(z), e (x) su una regola sola', xml: '<sequence values="BWRG" origin="True" symmetry="(z)"><one steps="40"><rule in="BB WB" out="BW WR"/><rule in="WB" out="WG" symmetry="(x)"/></one></sequence>', size: [13, 5, 13], steps: 50_000 },
    ]);
  });
});

describe('i nodi di regola dell’originale', () => {
  it('all: l’ordine mescolato «dall’interno», le corrispondenze che si coprono, l’ingresso non ricontrollato', () => {
    asTheOriginal([{ name: 'all che si coprono', xml: '<sequence values="BWRG" origin="True"><one in="WB" out="WW" steps="25"/><all in="WB" out="RG"/><all in="GB" out="GR"/></sequence>', size: [15, 15, 1], steps: 50_000 }]);
  });

  it('prl: una moneta per corrispondenza nell’ordine della scansione, sulla griglia di prima, in 2D e in 3D', () => {
    asTheOriginal([
      { name: 'prl a moneta in 2D', xml: '<sequence values="BWRG" origin="True"><prl in="WB" out="WW" p="0.4" steps="6"/><prl><rule in="WB" out="WR" p="0.5"/><rule in="BW" out="GW" p="0.5"/></prl></sequence>', size: [15, 15, 1], steps: 50_000 },
      { name: 'prl a moneta in 3D', xml: '<sequence values="BWRG" origin="True"><prl in="WB" out="WW" p="0.3" steps="8"/><prl in="WBB" out="WRG" p="0.5"/></sequence>', size: [9, 9, 9], steps: 50_000 },
    ]);
  });

  it('map: le regole nell’ordine di SymmetryHelper, e dove si coprono resta l’ultima', () => {
    asTheOriginal([{ name: 'map con regole che si coprono', xml: '<sequence values="BW" origin="True"><one in="WB" out="WW" steps="12"/><map scale="2 2 1" values="BRGY"><rule in="WB" out="RG/YB"/><rule in="WW" out="GR/BY"/></map></sequence>', size: [9, 9, 1], steps: 50_000 }]);
  });

  it('markov: con un ultimo figlio che non lavora mai, le liste dei figli sono quelle dell’originale', () => {
    asTheOriginal([{ name: 'markov di all e one', xml: '<markov values="BWRAX" origin="True"><all in="RBW" out="RAW"/><one in="WBB" out="WAR"/><one in="RBB" out="RAR"/><one in="X" out="B"/></markov>', size: [15, 15, 1], steps: 2000 }]);
  });

  // Our markov starts all its children again when the last one works, and their lists from a scan of the grid: the original's markov
  // never does, and with the switch on neither does ours (T528, A1-3, ADR-0272; `d1` of T498).
  it('markov: quando lavora l’ultimo figlio, come l’originale (i rami, A1-3)', () => {
    asTheOriginal([{ name: 'markov di all e one', xml: '<markov values="BWRA" origin="True"><all in="RBW" out="RAW"/><one in="WBB" out="WAR"/><one in="RBB" out="RAR"/></markov>', size: [15, 15, 1], steps: 2000 }]);
  });
});

describe('l’interruttore', () => {
  const maze: Program = { name: 'il labirinto in 2D', xml: '<one values="BWA" in="WBB" out="WAW" origin="True"/>', size: [21, 21, 1], steps: 50_000 };

  it('spento, la corsa è la nostra di sempre: un altro caso e i passi in cui si è fatto qualcosa', () => {
    for (const seed of [1, 2, 3]) {
      const off = ours(maze, seed, 'ours');
      expect(off.text).not.toBe(original(maze, seed).text);
      // The original counts the last turn too, in which nothing is left to do; ours does not.
      expect(off.steps).toBe(original(maze, seed).steps - 1);
    }
  });

  it('acceso, il passo persistente fa la corsa di run a pezzi: le liste aspettano i cambi da dove è cominciato il turno', () => {
    const m = compileMjx(maze.xml, { size: maze.size, original: true, semantics: 'mj' });
    for (const seed of [1, 2]) {
      const whole = run(m.program as Program3, seed, maze.steps);
      const g: Grid3 = { X: 21, Y: 21, Z: 1, cells: new Uint8Array(21 * 21), alphabet: ['.'], log: [], epoch: 0 };
      // The origin, as `run` lays it (the second value at the centre).
      g.alphabet = whole.grid.alphabet.slice();
      g.cells[10 + 10 * 21] = g.alphabet.indexOf('W');
      const s = new Stepper(g, m.program, seed);
      let made = 0;
      for (let k = 0; k < 40; k++) made += s.advance(7);
      expect(text(g, 'B')).toBe(text(whole.grid, 'B'));
      // The Stepper counts the steps in which something was done: the run's, less the last turn.
      expect(made).toBe(whole.steps - 1);
    }
  });

  it('acceso, i pezzi (nostri) girano coi loro turni e la stessa griglia a ogni corsa', () => {
    const xml = '<sequence values="BWA" origin="True"><one in="WBB" out="WAW" steps="30"/><pieces piece="8 8" margin="2"><one in="WBB" out="WAW"/></pieces></sequence>';
    const m = compileMjx(xml, { size: [24, 24, 1], semantics: 'mj' });
    const a = run(m.program as Program3, 5, 50_000);
    const b = run(m.program as Program3, 5, 50_000);
    expect(a.finished).toBe(true);
    expect(Array.from(b.grid.cells)).toEqual(Array.from(a.grid.cells));
  });
});
