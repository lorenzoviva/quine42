// `<markov>` and `<sequence>` in our engine against MarkovJunior of mxgmn (T498, docs/design/markov.md, lab/banco/markov/README.md).
// Each case is a small program on a row of cells whose run does not depend on the random numbers (one match at a time): `it` fixes what our
// engine does, `it.fails` says what the original does with the same program and the same start (what it printed, built from
// github.com/mxgmn/MarkovJunior at 42aaf24 with lab/banco/markov/originale/, recorded in lab/banco/markov/originale.json). Nothing here
// changes the engine: the day the engine runs a case as the original, its `it.fails` passes and fails the suite.
//
// The original, in short (Node.cs, Interpreter.cs): the branch at work has the turn; a branch that finishes gives it back to its parent
// with a step that does nothing and starts anew (its children's steps from zero); its parent asks it again, so a sequence or a markov that
// is not the root runs again as long as, from its beginning, it finds something to do; a markov asks from its first child at every step and
// counts its children's steps until it finishes. Ours (MarkovRunner, SequenceRunner): a markov gives one step to the first child that can,
// and all its children start again when the last one works; a branch runs once.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { run, runOn, type Grid3 } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';

interface Outcome {
  letters: string;
  steps: number;
  finished: boolean;
}
interface Case {
  name: string;
  /** What the case shows, in a few words. */
  what: string;
  xml: string;
  start: string;
  ours: Outcome;
  original: Outcome;
}

const R12 = 'RBBBBBBBBBBG';
const CASES: Case[] = [
  {
    name: 'd1-contatori-radice',
    what: 'in un markov radice i passi dei figli si contano fino alla fine del ciclo',
    xml: '<markov values="BRG" symmetry="()"><one in="RB" out="*R" steps="2"/><one in="BG" out="G*" steps="1"/></markov>',
    start: R12,
    // Ours: R twice, G once (the last child) starts all again: two of R, one of G, until they meet.
    ours: { letters: 'RRRRRRRRGGGG', steps: 10, finished: true },
    // The original: R twice, G once, and both have used their steps: the loop is over.
    original: { letters: 'RRRBBBBBBBGG', steps: 4, finished: true },
  },
  {
    name: 'd1b-contatori-annidati',
    what: 'lo stesso ciclo dentro una sequenza: la stessa griglia, ma l’originale vi arriva rientrando nel ciclo',
    xml: '<sequence values="BRG" symmetry="()"><markov><one in="RB" out="*R" steps="2"/><one in="BG" out="G*" steps="1"/></markov></sequence>',
    start: R12,
    ours: { letters: 'RRRRRRRRGGGG', steps: 10, finished: true },
    // The finished markov starts anew, its parent asks it again: the same grid, with a step for every time the loop ends.
    original: { letters: 'RRRRRRRRGGGG', steps: 15, finished: true },
  },
  {
    name: 'd2-sequenza-nel-ciclo',
    what: 'markov con dentro una sequenza: da noi il primo figlio che può, nell’originale la sequenza intera a ogni giro',
    xml: '<sequence values="BRG" symmetry="()"><markov><sequence><one in="RB" out="*R" steps="1"/><one in="BG" out="G*" steps="1"/></sequence></markov></sequence>',
    start: R12,
    // Ours (T469): the sequence starts again at every step, R grows while it can.
    ours: { letters: 'RRRRRRRRRRRG', steps: 10, finished: true },
    // The original: one of R, one of G at every pass: they meet in the middle.
    original: { letters: 'RRRRRRGGGGGG', steps: 17, finished: true },
  },
  {
    name: 'd3-sequenza-nella-sequenza',
    what: 'una sequenza dentro una sequenza: da noi una volta, nell’originale finché trova da fare',
    xml: '<sequence values="BRG" symmetry="()"><sequence><one in="RB" out="*R" steps="1"/></sequence><one in="BG" out="G*" steps="1"/></sequence>',
    start: R12,
    ours: { letters: 'RRBBBBBBBBGG', steps: 2, finished: true },
    // The inner sequence finishes, starts anew, is asked again: its steps="1" is one step a pass, and R reaches G.
    original: { letters: 'RRRRRRRRRRRG', steps: 21, finished: true },
  },
  {
    name: 'd4-il-ramo-tiene-il-turno',
    what: 'nell’originale una sequenza che ha cominciato tiene il turno: il figlio di prima del markov aspetta che finisca',
    xml: '<sequence values="BRac" symmetry="()"><markov><one in="Ra" out="Rc"/><sequence><one in="RB" out="Ra" steps="1"/><one in="aB" out="aa" steps="3"/></sequence></markov></sequence>',
    start: 'RBBBBBBBBB',
    // Ours: the a the sequence writes is at once taken by the first child (Ra → Rc), and the sequence has nothing more to grow.
    ours: { letters: 'RcBBBBBBBB', steps: 2, finished: true },
    // The original: the sequence keeps the turn and grows aaaa, then Ra → Rc, then the sequence again (a pass of three a), to the end.
    original: { letters: 'Rcaaaaaaaa', steps: 15, finished: true },
  },
  {
    name: 'd5-sequenza-rientrata',
    what: 'una sequenza che non è l’ultimo figlio di un markov: da noi un passo e poi tocca al resto, nell’originale finché trova da fare',
    xml: '<sequence values="BRG" symmetry="()"><markov><sequence><one in="RB" out="*R" steps="1"/></sequence><one in="BG" out="G*" steps="1"/></markov></sequence>',
    start: R12,
    // Ours: R once (the sequence keeps its place), G once (the last child: all again): one each, they meet in the middle.
    ours: { letters: 'RRRRRRGGGGGG', steps: 10, finished: true },
    original: { letters: 'RRRRRRRRRRRG', steps: 22, finished: true },
  },
  {
    name: 'd6-prl-conta-i-giri-vuoti',
    what: 'nell’originale una prl conta tra i suoi steps anche i giri in cui non ha applicato niente',
    xml: '<markov values="BWGX" symmetry="()"><prl in="G" out="W" steps="2"/><one in="WB" out="WG"/><one in="X" out="B"/></markov>',
    start: 'WBBBB',
    // Ours: the prl turns G into W twice (its two steps), the one writes a G three times; the last child never works.
    ours: { letters: 'WWWGB', steps: 5, finished: true },
    // The original: the first turn of the prl, with no G, is already one of its two steps.
    original: { letters: 'WWGBB', steps: 4, finished: true },
  },
  {
    name: 'd6b-prl-annidata',
    what: 'la stessa prl in un ciclo dentro una sequenza: l’originale rientra nel ciclo e le ridà i suoi steps',
    xml: '<sequence values="BWGX" symmetry="()"><markov><prl in="G" out="W" steps="2"/><one in="WB" out="WG"/><one in="X" out="B"/></markov></sequence>',
    start: 'WBBBB',
    ours: { letters: 'WWWGB', steps: 5, finished: true },
    original: { letters: 'WWWWW', steps: 13, finished: true },
  },
  {
    name: 'd7-one-che-non-cambia',
    what: 'nell’originale una regola applica anche dove non cambia niente (un passo vuoto per corrispondenza)',
    xml: '<sequence values="BRG" symmetry="()"><one in="RB" out="R*"/><one in="RB" out="*G"/></sequence>',
    start: 'RBBB',
    // Ours: a match is only where the rule changes something; the first node never works.
    ours: { letters: 'RGBB', steps: 1, finished: true },
    original: { letters: 'RGBB', steps: 3, finished: true },
  },
  {
    name: 'd10-prl-p-zero',
    what: 'p="0": da noi vale 1, nell’originale la regola non applica mai',
    xml: '<sequence values="BRG" symmetry="()"><prl in="RB" out="RG" p="0"/></sequence>',
    start: 'RBBB',
    ours: { letters: 'RGBB', steps: 1, finished: true },
    original: { letters: 'RBBB', steps: 1, finished: true },
  },
];

/** A row of cells from its letters, the first letter of `values` the empty cell. */
function rowOf(start: string, empty: string): Grid3 {
  const alphabet = ['.'];
  const cells = new Uint8Array(start.length);
  [...start].forEach((ch, x) => {
    if (ch === empty) return;
    let i = alphabet.indexOf(ch);
    if (i < 0) i = alphabet.push(ch) - 1;
    cells[x] = i;
  });
  return { X: start.length, Y: 1, Z: 1, cells, alphabet, log: [], epoch: 0 };
}
function go(c: Pick<Case, 'xml' | 'start'>, seed = 1, maxSteps = 200): Outcome {
  const empty = /values="(.)/.exec(c.xml)![1];
  const p = compileMjx(c.xml, { size: [c.start.length, 1, 1] }).program;
  const r = runOn(rowOf(c.start, empty), p, seed, maxSteps);
  return { letters: Array.from(r.grid.cells, (v) => (v === 0 ? empty : r.grid.alphabet[v])).join(''), steps: r.steps, finished: r.finished };
}

describe('<markov> e <sequence> nel nostro motore contro MarkovJunior di mxgmn (T498)', () => {
  for (const c of CASES) {
    it(`${c.name}, il nostro motore: ${c.what}`, () => {
      expect(go(c)).toEqual(c.ours);
    });
    it.fails(`${c.name}, come l’originale`, () => {
      expect(go(c)).toEqual(c.original);
    });
  }

  // A rule that matches and changes nothing, in a prl: the original finds it at every turn and never ends.
  const noop = { xml: '<sequence values="BRG" symmetry="()"><prl in="R" out="R"/><one in="RB" out="*G"/></sequence>', start: 'RBBB' };
  it('d8-prl-che-non-cambia, il nostro motore: una prl che non cambia niente non trova niente, e si va avanti', () => {
    expect(go(noop)).toEqual({ letters: 'RGBB', steps: 1, finished: true });
  });
  it.fails('d8-prl-che-non-cambia, come l’originale: la prl trova R a ogni giro e la corsa non finisce', () => {
    expect(go(noop)).toEqual({ letters: 'RBBB', steps: 200, finished: false });
  });

  // `p` on the rules of a one: the original does not read it (OneNode.RandomMatch), we weigh the matches by it.
  const weighed = { xml: '<sequence values="BRG" symmetry="()"><one steps="6"><rule in="RB" out="*R" p="0.001"/><rule in="BG" out="G*"/></one></sequence>', start: R12 };
  const seeds = [1, 2, 3, 4, 5];
  it('d9-one-e-p, il nostro motore: la regola di R, con p 0,001, non tocca mai', () => {
    expect(seeds.map((s) => go(weighed, s).letters)).toEqual(seeds.map(() => 'RBBBBGGGGGGG'));
  });
  it.fails('d9-one-e-p, come l’originale: p non conta nella one, R e G crescono a caso', () => {
    // What the original printed for seeds 1-5: R grows by 2-4 cells.
    expect(seeds.some((s) => go(weighed, s).letters.startsWith('RR'))).toBe(true);
  });

  // The storeys of the author's fort (lines 197-261 of docs/userchats/forte-handmade-2026-11-22.xml, reduced as in mj-markov.test.ts):
  // with the original the sequence, asked again, finds the top of the tower to build on and never lets the coin decide; at the top the
  // mark goes from N to M and back for ever.
  const storeys = `<sequence values="BtwFMN" symmetry="()" ground="t">
    <one in="t" out="M" steps="1"/>
    <markov>
      <sequence>
        <all in="M" out="N" steps="1"/>
        <all in="B t" out="t w" steps="3"/>
        <all in="B t" out="t F" steps="1"/>
      </sequence>
      <prl p="0.5" in="N" out="M"/>
      <all in="N" out="M" steps="1"/>
    </markov>
  </sequence>`;
  const tower = (seed: number, xml = storeys) => {
    const p = compileMjx(xml, { size: [2, 2, 64] }).program;
    const r = run(p, seed, 20_000);
    const F = r.grid.alphabet.indexOf('F');
    return { storeys: Array.from(r.grid.cells).filter((c) => c === F).length / 3, finished: r.finished };
  };
  it.fails('i piani del forte come l’originale: sempre fino in cima (15 su una torre di 64), e il ciclo non finisce', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((s) => tower(s))).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map(() => ({ storeys: 15, finished: false })));
  });
  it('il nostro motore: la moneta da sola come ultimo figlio basta a uscire (testa un piano in più, croce il ciclo finisce)', () => {
    // The author's belief (22/11) is that a final prl does not stop a loop: here what stops it is a step in which no child changes
    // anything, whatever the last child is. Heads, the coin turns N back into M: the last child worked, all start again, one storey more;
    // tails, it changes nothing, the sequence is done, nobody can: the loop ends.
    const coin = storeys.replace('      <all in="N" out="M" steps="1"/>\n', '');
    expect(coin).not.toBe(storeys);
    const n = new Map<number, number>();
    for (let s = 1; s <= 400; s++) {
      const t = tower(s, coin);
      expect(t.finished).toBe(true);
      n.set(t.storeys, (n.get(t.storeys) ?? 0) + 1);
    }
    // One storey, two, three…, each half as likely as the one before: about 200, 100, 50 of 400.
    expect(n.get(1)!).toBeGreaterThan(160);
    expect(n.get(1)!).toBeLessThan(240);
    expect(n.get(2)!).toBeGreaterThan(70);
    expect(n.get(2)!).toBeLessThan(130);
    expect(n.get(3)!).toBeGreaterThan(28);
    expect(n.get(3)!).toBeLessThan(75);
  });

  it('i casi sono i programmi del banco e le uscite che l’originale vi ha stampato', () => {
    const dir = 'lab/banco/markov/programmi';
    const recorded = JSON.parse(fs.readFileSync('lab/banco/markov/originale.json', 'utf8')) as Record<string, Record<string, Outcome>>;
    const bench = (name: string) => ({ xml: fs.readFileSync(`${dir}/${name}.xml`, 'utf8').trim(), start: fs.readFileSync(`${dir}/${name}.txt`, 'utf8').trim() });
    for (const c of CASES) {
      expect(bench(c.name)).toEqual({ xml: c.xml, start: c.start });
      expect(recorded[c.name]['1']).toEqual(c.original);
    }
    expect(bench('d8-prl-che-non-cambia')).toEqual(noop);
    expect(recorded['d8-prl-che-non-cambia']['1']).toEqual({ letters: 'RBBB', steps: 200, finished: false });
    expect(bench('d9-one-e-p')).toEqual(weighed);
    expect(Object.values(recorded['d9-one-e-p']).every((o) => /^RR/.test(o.letters))).toBe(true);
    // The tower of the storeys: at every seed the original reached 15 storeys and did not finish.
    expect(Object.values(recorded['l4-piani']).every((o) => (o as unknown as { outcome: number }).outcome === 15 && !o.finished)).toBe(true);
  });
});
