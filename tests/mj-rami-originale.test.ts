// The branches of MarkovJunior of mxgmn in our engine (T528, A1-3, ADR-0273; docs/design/markov-allineamento.md § 3.2, § 8).
//
// With the switch of the semantics on (`semantics: 'mj'`, T526, ADR-0263) sequences and markovs are the original's Branch (Node.cs,
// Interpreter.cs; `OriginalBranch` in src/mj/engine.ts): the branch at work has the turn (`ip.current`), a branch that finishes gives it
// back to its parent with a step that does nothing and starts anew with its children, its parent asks it again from its beginning, a markov
// asks from its first child at every step and its children's steps count until it finishes, a map's or a wfc's branch has no parent and
// ends the run. The oracle is the reference (lab/banco/conformita/riferimento.ts, the original line by line): the same grid voxel by voxel,
// the same steps, the same end. The cases of T498 (d1-d5, d6b) and the loops of the author's fort are in tests/mj-markov-originale.test.ts,
// c2 and the models of mxgmn in tests/mj-conformita.test.ts. With the switch off nothing changes (tests/mj-engine-determinism.test.ts).

import { describe, expect, it } from 'vitest';
import { runReference } from '../lab/banco/conformita/riferimento';
import { run, Stepper, type Grid3, type Node3, type Program3 } from '../src/mj/engine';
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

const NESTED: Program = {
  name: 'un ciclo dentro una sequenza dentro un ciclo',
  xml: '<sequence values="BWRG" origin="True"><markov><sequence><one in="WB" out="WW" steps="3"/><one in="WB" out="WR" steps="1"/></sequence><all in="RB" out="RG"/></markov><one in="WB" out="WG"/></sequence>',
  size: [15, 15, 1],
  steps: 50_000,
};
const KEEPS: Program = {
  name: 'il ramo che tiene il turno: il primo figlio del markov aspetta che la sequenza finisca',
  xml: '<markov values="BRac" origin="True"><one in="Ra" out="Rc"/><sequence><one in="RB" out="Ra" steps="1"/><one in="aB" out="aa" steps="3"/></sequence></markov>',
  size: [11, 11, 1],
  steps: 50_000,
};

describe('i rami dell’originale (A1-3)', () => {
  it('rami annidati: il turno, il passo vuoto di un ramo che finisce, il ramo chiesto di nuovo dal suo inizio', () => {
    for (const p of [NESTED, KEEPS]) for (const seed of SEEDS) expect(ours(p, seed), `${p.name}, seme ${seed}`).toEqual(original(p, seed));
  });

  it('prl a moneta in rami annidati, in 3D: i passi dei figli contano finché il ramo dura', () => {
    const p: Program = {
      name: 'prl in una sequenza in una sequenza in un markov',
      xml: '<sequence values="BWRG" origin="True"><markov><sequence><sequence><prl in="WB" out="WW" p="0.3" steps="2"/></sequence><one in="WB" out="WR" steps="2"/></sequence><all in="RB" out="RG"/></markov></sequence>',
      size: [7, 7, 7],
      steps: 50_000,
    };
    for (const seed of SEEDS) expect(ours(p, seed), `${p.name}, seme ${seed}`).toEqual(original(p, seed));
  });

  it('una map dentro un markov: quando i suoi nodi finiscono, la corsa è finita', () => {
    const p: Program = {
      name: 'map in un markov',
      xml: '<markov values="BW" origin="True"><one in="WB" out="WW" steps="6"/><map scale="2 2 1" values="BRG"><rule in="W" out="RR/RR"/><one in="RB" out="RG" steps="20"/></map></markov>',
      size: [9, 9, 1],
      steps: 50_000,
    };
    for (const seed of SEEDS) expect(ours(p, seed), `${p.name}, seme ${seed}`).toEqual(original(p, seed));
  });

  it('una map senza nodi in una sequenza è un ramo senza genitore: ciò che viene dopo non gira', () => {
    const p: Program = {
      name: 'map sola, poi un all',
      xml: '<sequence values="BW" origin="True"><one in="WB" out="WW" steps="8"/><map scale="2 2 1" values="BRG"><rule in="W" out="RG/GR"/></map><all in="B" out="W"/></sequence>',
      size: [9, 9, 1],
      steps: 50_000,
    };
    for (const seed of SEEDS) {
      const o = original(p, seed);
      expect(ours(p, seed), `${p.name}, seme ${seed}`).toEqual(o);
      // The all would turn every empty cell into W: it never runs.
      expect(o.text).toContain('B');
    }
    // Ours (the switch off): what follows the map runs.
    expect(ours(p, 1, 'ours').text).not.toContain('B');
  });

  it('spento, la corsa è la nostra di sempre: un ramo gira una volta, il markov fa ripartire i figli', () => {
    for (const seed of [1, 2]) expect(ours(KEEPS, seed, 'ours')).not.toEqual(original(KEEPS, seed));
  });

  it('il segno della map coi suoi nodi (grid) non cambia la nostra corsa', () => {
    const xml = '<sequence values="BW" origin="True"><one in="WB" out="WW" steps="8"/><map scale="2 2 1" values="BRG"><rule in="W" out="RG/GR"/><all in="RB" out="RR"/></map><all in="B" out="G"/></sequence>';
    const m = compileMjx(xml, { size: [9, 9, 1] });
    const strip = (n: Node3): Node3 => (n.type === 'sequence' || n.type === 'markov' ? { type: n.type, children: n.children.map(strip), ...(n.gated ? { gated: true } : {}) } : n);
    const marked = (n: Node3): boolean => (n.type === 'sequence' || n.type === 'markov') && (n.grid === true || n.children.some(marked));
    expect(marked(m.program.program)).toBe(true);
    const bare = { ...m.program, program: strip(m.program.program) } as Program3;
    expect(marked(bare.program)).toBe(false);
    for (const seed of [1, 2, 3]) expect(run(bare, seed).grid.cells).toEqual(run(m.program as Program3, seed).grid.cells);
  });
});

describe('la wfc è un ramo senza genitore (WFCNode)', () => {
  /** Two one-cell tiles, each beside only itself: a whole grid is one of them (tests/mj-wfc.test.ts). */
  const DAMA = `<tileset values="BXY">
  <tiles><tile name="X">X</tile><tile name="Y" weight="3">Y</tile></tiles>
  <neighbors>
    <neighbor left="X" right="X"/><neighbor left="Y" right="Y"/>
    <neighbor top="X" bottom="X"/><neighbor top="Y" bottom="Y"/>
  </neighbors>
</tileset>`;
  const files = { 'dama.xml': DAMA };
  const letters = (g: Grid3) => [...new Set(Array.from(g.cells, (c) => (c === 0 ? '.' : g.alphabet[c])))].sort().join('');

  it('quando i suoi nodi finiscono, la corsa è finita: ciò che viene dopo la wfc non gira', () => {
    const xml = '<sequence values="BW"><all in="B" out="W"/><wfc values="BAC" tileset="dama"><rule in="W" out="X|Y"/><all in="A" out="C"/></wfc><all in="C" out="A"/></sequence>';
    for (const seed of [1, 2, 3]) {
      const on = run(compileMjx(xml, { size: [4, 3, 2], files, semantics: 'mj' }).program, seed);
      expect(on.finished).toBe(true);
      expect(letters(on.grid)).toBe('C');
      // Ours: the last all runs after the wave's nodes.
      expect(letters(run(compileMjx(xml, { size: [4, 3, 2], files }).program, seed).grid)).toBe('A');
    }
  });

  it('un’onda senza soluzione non finisce il suo ramo e tiene il turno: chiesta di nuovo, sulla griglia cambiata, la trova', () => {
    // W must be X and R must be Y, side by side: no solution. The sequence goes on (W → B), and the turn, still the wave's, asks it again:
    // R alone now, the whole grid becomes Y (C), and the run ends with the wave's branch. Ours leaves the wave out and ends.
    const xml = '<sequence values="BWR"><all in="B" out="W"/><one in="W" out="R" steps="1"/><wfc values="BAC" tileset="dama" tries="2"><rule in="W" out="X"/><rule in="R" out="Y"/></wfc><all in="W" out="B"/></sequence>';
    for (const seed of [1, 2]) {
      const on = run(compileMjx(xml, { size: [3, 3, 1], files, semantics: 'mj' }).program, seed);
      expect({ letters: letters(on.grid), steps: on.steps, finished: on.finished }).toEqual({ letters: 'C', steps: 5, finished: true });
      const off = run(compileMjx(xml, { size: [3, 3, 1], files }).program, seed);
      expect({ letters: letters(off.grid), finished: off.finished }).toEqual({ letters: '.R', finished: true });
    }
  });
});

describe('i rami e il passo persistente, i pezzi', () => {
  it('lo Stepper fa la corsa di run a pezzi, coi turni dei rami', () => {
    for (const p of [NESTED, KEEPS]) {
      const m = compileMjx(p.xml, { size: p.size, original: true, semantics: 'mj' });
      for (const seed of [1, 2]) {
        const whole = run(m.program as Program3, seed, p.steps);
        expect(whole.finished).toBe(true);
        const g: Grid3 = { X: p.size[0], Y: p.size[1], Z: 1, cells: new Uint8Array(p.size[0] * p.size[1]), alphabet: whole.grid.alphabet.slice(), log: [], epoch: 0 };
        // The origin, as `run` lays it (the second value at the centre).
        g.cells[(p.size[0] >> 1) + (p.size[1] >> 1) * p.size[0]] = 1;
        const s = new Stepper(g, m.program, seed);
        let made = 0;
        for (let k = 0; k < 400 && made < whole.steps; k++) made += s.advance(5);
        expect(text(g, 'B'), `${p.name}, seme ${seed}`).toBe(text(whole.grid, 'B'));
        // Every turn of the run is a step of the Stepper, the empty steps of the branches too, but for the last one, in which the run ends.
        expect(made).toBe(whole.steps - 1);
        expect(s.advance(5)).toBe(0);
      }
    }
  });

  it('un markov dentro i pezzi gira coi turni dei rami, la stessa griglia a ogni corsa', () => {
    const xml = '<sequence values="BWA" origin="True"><one in="WBB" out="WAW" steps="30"/><pieces piece="8 8" margin="2"><markov><one in="WBB" out="WAW" steps="4"/><one in="ABW" out="AAW"/></markov></pieces></sequence>';
    const m = compileMjx(xml, { size: [24, 24, 1], semantics: 'mj' });
    const a = run(m.program as Program3, 3, 50_000);
    const b = run(m.program as Program3, 3, 50_000);
    expect(a.finished).toBe(true);
    expect(a.pieces?.every((p) => p.finished)).toBe(true);
    expect(Array.from(b.grid.cells)).toEqual(Array.from(a.grid.cells));
  });
});
