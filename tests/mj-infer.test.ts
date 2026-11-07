// Inference in MarkovJunior's rule nodes (T334, ADR-0172): `field` (to, from, on, recompute, essential), `temperature`, `observe`
// (value, from, to) and `search` (limit, depthCoefficient), each in a small case whose result is known; the ceilings; determinism; and
// what the original (MarkovJunior's C#, run with lab/banco/inferenza/originale) gave on the same models.

import fs from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { run, runOn, Mj3Error, type Grid3, type RunOptions } from '../src/mj/engine';
import { INFERENCE_LIMITS } from '../src/mj/infer';
import { compileMjx, inferenceIn } from '../src/mj/model';
import { traceProgram, traceText } from '../src/mj/trace';
import { modelErrors } from '../src/kernel/validator';

const official = (name: string) => fs.readFileSync(`lab/mjx/official/${name}.xml`, 'utf8');

/** A program of one grid run on the rows given (`/` between rows, the program's own letters): the rows it ends with. */
function play(xml: string, rows: string, seed = 1, maxSteps = 10_000, opts: RunOptions = {}, files?: Record<string, string>) {
  const lines = rows.split('/');
  const X = lines[0].length, Y = lines.length;
  const m = compileMjx(xml, { size: [X, Y, 1], ...(files ? { files } : {}) });
  const bg = m.background;
  const letters = [...new Set(lines.join(''))].filter((c) => c !== bg);
  const alphabet = ['.', ...letters];
  const cells = Uint8Array.from(lines.join(''), (c) => (c === bg ? 0 : alphabet.indexOf(c)));
  const g: Grid3 = { X, Y, Z: 1, cells, alphabet, log: [], epoch: 0 };
  const r = runOn(g, m.program, seed, maxSteps, undefined, opts);
  const text = Array.from({ length: Y }, (_, y) => Array.from({ length: X }, (_, x) => g.alphabet[g.cells[x + y * X]]).join('').replace(/\./g, bg)).join('/');
  return { r, text };
}

const count = (g: Grid3) => {
  const out: Record<string, number> = {};
  for (const c of g.cells) out[g.alphabet[c]] = (out[g.alphabet[c]] ?? 0) + 1;
  return out;
};

const saved = { ...INFERENCE_LIMITS };
afterEach(() => Object.assign(INFERENCE_LIMITS, saved));

describe('field', () => {
  const walk = (field: string, rows: string, steps = 4, seed = 1) => play(`<one values="BRGW" in="RB" out="BR" steps="${steps}">${field}</one>`, rows, seed);

  it('to: a temperatura 0 il viandante scende il potenziale, dritto verso G', () => {
    for (const seed of [1, 2, 3, 4, 5]) expect(walk('<field for="R" to="G" on="BR"/>', 'BRBBBBG', 4, seed).text).toBe('BBBBBRG');
  });

  it('from: il campo rovesciato lo allontana da G', () => {
    for (const seed of [1, 2, 3]) expect(walk('<field for="R" from="G" on="BR"/>', 'BBBRBBG', 3, seed).text).toBe('RBBBBBG');
  });

  it('on: il potenziale si propaga solo sulle celle dette; fuori è -1 e quella mossa non si fa', () => {
    const blocked = walk('<field for="R" to="G" on="B"/>', 'RBWBG', 1);
    expect(blocked.text).toBe('RBWBG');
    expect(blocked.r.unused?.join(' ')).toMatch(/potenziale è -1/);
    expect(walk('<field for="R" to="G" on="BW"/>', 'RBWBG', 1).text).toBe('BRWBG');
  });

  it('recompute: chi mangia il primo bersaglio va al secondo; senza, oscilla su un campo vecchio', () => {
    const eat = (recompute: boolean) =>
      play(`<one values="BRG"><rule in="RB" out="BR"/><rule in="RG" out="BR"/><field for="R" to="G" on="B" recompute="${recompute ? 'True' : 'False'}"/></one>`, 'GBRBBBG', 1, 200);
    const fresh = eat(true);
    expect(fresh.text).toBe('BBBBBBR');
    expect(fresh.r.finished).toBe(true);
    // Two to the first G, six to the other: then no G is left and the field has nowhere to start.
    expect(fresh.r.steps).toBe(8);
    const stale = eat(false);
    expect(stale.r.finished).toBe(false);
    expect(stale.r.steps).toBe(200);
  });

  it('essential: un campo essenziale senza celle di partenza ferma il nodo; uno non essenziale no', () => {
    const two = (essential: boolean) => walk(`<field for="R" to="G" on="BR"/><field for="W" to="W" on="B" essential="${essential ? 'True' : 'False'}"/>`, 'BRBBBBG', 2);
    // W is nowhere on the row: its field cannot start.
    expect(two(true).text).toBe('BRBBBBG');
    expect(two(false).text).toBe('BBBRBBG');
    // A node whose only field cannot start does nothing, as in MarkovJunior (anycomputation && !anysuccess).
    expect(walk('<field for="R" to="W" on="B"/>', 'BRBBBBG', 2).text).toBe('BRBBBBG');
  });

  it('un campo senza celle di partenza: il nodo non fa niente e la traccia dice perché', () => {
    const t = traceProgram(compileMjx('<one values="BRG" size="7 1 1" origin="True" in="RB" out="BR" steps="2"><field for="R" to="G" on="B"/></one>'), 1);
    // No G on the grid: the field cannot start, the node does nothing and says why.
    expect(t.nodes[0].runs).toBe(0);
    expect(t.nodes[0].why).toMatch(/nessun campo/);
  });
});

describe('temperature', () => {
  /** Where the walker goes at its first step, over many seeds: right is towards G. */
  const rights = (T: number, seeds: number) => {
    let n = 0;
    for (let seed = 1; seed <= seeds; seed++)
      if (play(`<one values="BRG" in="RB" out="BR" steps="1" temperature="${T}"><field for="R" to="G" on="BR"/></one>`, 'BBBRBBBBG', seed).text === 'BBBBRBBBG') n++;
    return n;
  };

  it('a 0 sceglie sempre il migliore', () => {
    expect(rights(0, 40)).toBe(40);
  });

  it('sopra 0 sceglie con probabilità ∝ exp(-h/T): con T = 1 e h = -1 contro +1, verso G l’88 %', () => {
    // e / (e + 1/e) = 0.881; 400 draws: 352 ± 20 at three deviations.
    const n = rights(1, 400);
    expect(n).toBeGreaterThan(330);
    expect(n).toBeLessThan(375);
  });

  it('molto alta è quasi a caso', () => {
    const n = rights(1000, 200);
    expect(n).toBeGreaterThan(70);
    expect(n).toBeLessThan(130);
  });
});

describe('observe', () => {
  const path = (node: string, inner = '') =>
    `<${node} values="BRG" in="RB" out="BR">${inner || '<observe value="G" from="B" to="R"/><observe value="R" to="B"/>'}</${node}>`;

  it('value, from, to: la cella di G diventa B e il viandante ci arriva per la via più corta, poi il nodo si ferma', () => {
    for (const seed of [1, 2, 3]) {
      const { r, text } = play(path('one'), 'RBBBG', seed);
      expect(text).toBe('BBBBR');
      expect(r.steps).toBe(4);
      expect(r.finished).toBe(true);
    }
  });

  it('in 2D: un cammino più corto attorno a un muro', () => {
    const { r, text } = play('<one values="BRGWA" in="RB" out="AR"><observe value="G" from="B" to="R"/><observe value="R" to="A"/><observe value="B" to="BA"/></one>', 'BBBBB/RBWBG/BBBBB', 1);
    expect(text.replace(/[^R]/g, '')).toBe('R');
    expect(text.split('/')[1][4]).toBe('R');
    // Around the wall: six moves.
    expect(r.steps).toBe(6);
    expect(text.split('').filter((c) => c === 'A').length).toBe(6);
  });

  it('un valore osservato che non c’è ferma il nodo (e i cambi delle altre osservazioni restano, come nell’originale)', () => {
    const { r, text } = play('<one values="BRGY" in="RB" out="BR"><observe value="G" from="B" to="R"/><observe value="Y" from="B" to="B"/></one>', 'RBBYB', 1);
    expect(text).toBe('RBBBB');
    expect(r.unused?.join(' ')).toMatch(/"G" non erano nella griglia/);
  });

  it('in un prl le osservazioni cambiano solo le celle osservate', () => {
    const { text } = play('<prl values="BRGW" in="W" out="B"><observe value="G" from="R" to="R"/></prl>', 'WBGBW', 1);
    expect(text).toBe('BBRBB');
  });
});

describe('search', () => {
  it('one: la traiettoria più corta, rigiocata un passo alla volta', () => {
    const xml = '<one values="BRG" in="RB" out="BR" search="True"><observe value="G" from="B" to="R"/><observe value="R" to="B"/></one>';
    const { r, text } = play(xml, 'RBBBG', 1);
    expect(text).toBe('BBBBR');
    expect(r.steps).toBe(4);
    const traced = traceText(compileMjx(`<sequence values="BRG" size="5 1 1"><one in="BBBBB" out="RBBBG" steps="1"/>${xml.replace(' values="BRG"', '')}</sequence>`), 1, { forma: 'nodes' });
    expect(traced).toMatch(/ricerca: traiettoria di 4 passi/);
  });

  it('all: gli stati figli sono gli insiemi massimali di corrispondenze che non si sovrappongono', () => {
    // Two walkers on two rows reach their two targets together: an all step moves both.
    const xml = '<all values="BRG" in="RB" out="BR" search="True"><observe value="G" from="B" to="R"/><observe value="R" to="B"/></all>';
    const { r, text } = play(xml, 'RBBG/RBBG', 1);
    expect(text).toBe('BBBR/BBBR');
    expect(r.steps).toBe(3);
  });

  it('limit e depthCoefficient: CompleteSAW trova il cammino che tocca ogni punto del reticolo', () => {
    const m = compileMjx(official('CompleteSAW'), { size: [9, 9, 1] });
    for (const seed of [1, 2]) {
      const r = run(m.program, seed, 50_000);
      expect(r.finished).toBe(true);
      // 25 points of the lattice, 24 moves of two cells (the original: «found a trajectory of length 24»).
      expect(count(r.grid)).toMatchObject({ W: 48, R: 1 });
    }
  });

  it('una ricerca che non trova lascia il nodo com’è nell’originale: sceglie a caso', () => {
    const xml = '<one values="BRG" in="RB" out="BR" search="True" limit="1" steps="3"><observe value="G" from="B" to="R"/><observe value="R" to="B"/></one>';
    const { r, text } = play(xml, 'RBBBBBBBG', 1);
    expect(r.finished).toBe(true);
    expect(text.replace(/[^R]/g, '')).toBe('R');
    const t = traceText(compileMjx(`<sequence values="BRG" size="9 1 1"><one in="BBBBBBBBB" out="RBBBBBBBG" steps="1"/>${xml.replace(' values="BRG"', '')}</sequence>`), 1, { forma: 'nodes' });
    expect(t).toMatch(/ricerca senza traiettoria: tetto di 1 stati/);
  });
});

describe('i tetti', () => {
  const saw = () => compileMjx(official('CompleteSAW'), { size: [9, 9, 1] });

  it('il tempo: una ricerca che lo supera ferma la corsa, che non è finita', () => {
    INFERENCE_LIMITS.searchMs = -1;
    const r = run(saw().program, 1, 50_000);
    expect(r.finished).toBe(false);
  });

  it('anche la scadenza della corsa ferma la ricerca', () => {
    const r = run(saw().program, 1, 50_000, undefined, { deadline: 1e-9 });
    expect(r.finished).toBe(false);
  });

  it('gli stati: oltre il tetto la ricerca non trova, ogni volta allo stesso modo', () => {
    INFERENCE_LIMITS.boards = 3;
    const a = run(saw().program, 1, 50_000);
    const b = run(saw().program, 1, 50_000);
    expect(Buffer.compare(a.grid.cells, b.grid.cells)).toBe(0);
    expect(count(a.grid).W ?? 0).toBeLessThan(48);
  });

  it('i byte: potenziali troppo grandi sono un errore del programma', () => {
    INFERENCE_LIMITS.potentialBytes = 64;
    expect(() => run(compileMjx('<one values="BRG" size="9 9 1" origin="True" in="RB" out="BR"><field for="R" to="G" on="B"/></one>').program, 1)).toThrow(Mj3Error);
  });

  it('più di 32 valori non si osservano', () => {
    const values = 'B' + 'ACDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
    const colors = [...values.slice(1)].map((c) => `<color symbol="${c}" value="808080"/>`).join('');
    expect(() => run(compileMjx(`<one values="${values}" size="3 1 1" in="AB" out="BA">${colors}<observe value="C" to="A"/></one>`).program, 1)).toThrow(/al più 32/);
  });
});

describe('con <import> e i figli <in>/<out> (T333, T340)', () => {
  const walker = '<one values="BRG" steps="4"><in>RB</in><out>BR</out><field for="R" to="G" on="BR"/></one>';

  it('un campo in un nodo con le regole nei figli scende il potenziale come con gli attributi', () => {
    for (const seed of [1, 2, 3]) expect(play(walker, 'BRBBBBG', seed).text).toBe('BBBBBRG');
  });

  it('un programma incluso che inferisce gira dentro chi lo include, e il validatore lo vede', () => {
    const files = { 'walker.xml': walker };
    const host = '<sequence values="BRG"><import file="walker"/></sequence>';
    for (const seed of [1, 2]) expect(play(host, 'BRBBBBG', seed, 10_000, {}, files).text).toBe('BBBBBRG');
    expect(inferenceIn(compileMjx(host, { size: [7, 1, 1], files }))).toEqual(['field']);
    expect(modelErrors('models/torre.xml', host, 8_000, [7, 1, 1], files).join(' ')).toMatch(/<field> non è ancora ammesso/);
  });
});

describe('determinismo', () => {
  it('lo stesso seme dà la stessa griglia, semi diversi griglie diverse', () => {
    for (const [name, size] of [['Keys', [11, 11, 11]], ['SoftPath', [16, 16, 16]], ['StairsPath', [21, 21, 21]], ['RegularPath', [31, 31, 1]]] as const) {
      const m = compileMjx(official(name), { size: [...size] });
      const a = run(m.program, 3, 200_000);
      const b = run(m.program, 3, 200_000);
      const c = run(m.program, 4, 200_000);
      expect(a.finished, name).toBe(true);
      expect(Buffer.compare(a.grid.cells, b.grid.cells), name).toBe(0);
      expect(a.steps, name).toBe(b.steps);
      expect(Buffer.compare(a.grid.cells, c.grid.cells), name).not.toBe(0);
    }
  });

  it('la traccia non cambia la corsa di un nodo che inferisce', () => {
    const m = compileMjx(official('Keys'), { size: [11, 11, 11] });
    const plain = run(m.program, 5, 200_000);
    const t = traceProgram(m, 5);
    expect(Buffer.compare(t.result.grid.cells, plain.grid.cells)).toBe(0);
    expect(t.steps).toBe(plain.steps);
  });
});

describe('come l’originale (MarkovJunior in C#, lab/banco/inferenza/originale)', () => {
  it('Dwarves: i nani scavano una volta e restano col carico (B 376, E 2, N 12, W 10, come l’originale)', () => {
    const m = compileMjx(official('Dwarves'), { size: [20, 20, 1] });
    for (const seed of [1, 2, 3]) expect(count(run(m.program, seed, 85).grid)).toEqual({ '.': 376, E: 2, N: 12, W: 10 });
  });

  it('GrowTo: 2000 passi, 1999 N e una U (come l’originale)', () => {
    const m = compileMjx(official('GrowTo'), { size: [64, 64, 1] });
    expect(count(run(m.program, 1, 2000).grid)).toEqual({ '.': 2096, N: 1999, U: 1 });
  });

  it('Keys: il reticolo intero tranne il raro nodo isolato, una porta per ogni chiave (B 11140, G 1, R 1, P = U, come l’originale)', () => {
    const m = compileMjx(official('Keys'), { size: [23, 23, 23] });
    for (const seed of [1, 2]) {
      const n = count(run(m.program, seed, 200_000).grid);
      expect(n['.']).toBe(11140);
      expect(n).toMatchObject({ G: 1, R: 1 });
      expect(n.P).toBe(n.U);
      expect(n.F + n.P + n.U).toBe(1025);
    }
  });

  it('CompleteSAW 19×19: il cammino completo sugli 81 punti (l’originale lo trova con limit 1000)', () => {
    const r = run(compileMjx(official('CompleteSAW'), { size: [19, 19, 1] }).program, 1, 50_000);
    expect(count(r.grid)).toMatchObject({ W: 160, R: 1 });
  });
});

describe('il programma', () => {
  it('field e observe stanno solo dentro one, all e prl, con i loro attributi', () => {
    expect(() => compileMjx('<sequence values="BR" size="3 3 3"><field for="R" to="B" on="B"/></sequence>')).toThrow(/va dentro one, all o prl/);
    expect(() => compileMjx('<one values="BR" size="3 3 3" in="R" out="B"><field for="R" on="B"/></one>')).toThrow(/to/);
    expect(() => compileMjx('<one values="BR" size="3 3 3" in="R" out="B"><field for="R" to="B"/></one>')).toThrow(/on/);
    expect(() => compileMjx('<one values="BR" size="3 3 3" in="R" out="B"><observe value="R"/></one>')).toThrow(/to/);
    expect(() => compileMjx('<one values="BR" size="3 3 3" in="R" out="B" temperature="-1"><field for="R" to="B" on="B"/></one>')).toThrow(/temperature/);
    const m = compileMjx('<one values="BRG" size="3 3 3" in="R" out="B" temperature="2" search="True" limit="50" depthCoefficient="-1"><field for="R" from="G" on="B" recompute="True" essential="True"/><observe value="G" from="B" to="R"/></one>');
    expect(m.program.program).toMatchObject({ temperature: 2, search: true, limit: 50, depthCoefficient: -1, fields: [{ for: 'R', from: 'G', on: '.', recompute: true, essential: true }], observe: [{ value: 'G', from: '.', to: 'R' }] });
    expect(inferenceIn(m)).toEqual(['field', 'observe']);
    expect(compileMjx('<one values="BR" size="3 3 3" in="R" out="B" temperature="2"/>').warnings.join(' ')).toMatch(/temperature senza field/);
  });

  it('il validatore del gioco non li prende ancora (T336)', () => {
    expect(modelErrors('models/prova.xml', '<sequence values="BRG" size="9 9 9" origin="True"><one in="RB" out="BR" steps="3"><field for="R" to="G" on="B"/></one></sequence>').join(' ')).toMatch(/<field> non è ancora ammesso/);
  });

  it('la traccia dice cosa inferisce un nodo', () => {
    const text = traceText(compileMjx(official('Keys'), { size: [11, 11, 11] }), 1, { forma: 'nodes' });
    expect(text).toMatch(/campo R da G su RDA/);
    expect(text).toMatch(/temperatura=2/);
  });
});
