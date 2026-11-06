// The trace of a program (T179): on fixed XML it says the right nodes and cells for every kind of node, it does not change the run, the ceiling holds.
// Nothing here calls a model.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { run, type Node3 } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { FORM_LIMITS } from '../../src/mj/run';
import { boxesOf, diffLines, estimateTokens, framesAt, renderTrace, sectionLines, TRACE_FORMS, traceProgram, traceText, type NodeTrace } from '../../src/mj/trace';
import { bersaglio } from '../banco/bersagli';
import { esegui } from '../banco/misure';
import { daCorreggere, testoSeconda } from '../banco/seconda';
import { OFFICIAL } from '../mjx/official';

const COLORS = 'BRGYW';
const model = (body: string, size = '5 5 3', extra = '') => compileMjx(`<sequence values="${COLORS}" size="${size}" ${extra}>${body}</sequence>`);
const leaf = (nodes: NodeTrace[], type: Node3['type']) => nodes.find((n) => n.node.type === type)!;

describe('la traccia dice cosa ha fatto ogni nodo', () => {
  it('box: una volta, le sue celle, la sua scatola', () => {
    const t = traceProgram(model('<box at="2 2.5 0" size="3 2 1" color="R"/>'), 1);
    const n = leaf(t.nodes, 'shape');
    expect(n).toMatchObject({ runs: 1, cells: 6, first: 1, last: 1 });
    expect(n.box).toEqual({ x0: 1, x1: 3, y0: 2, y1: 3, z0: 0, z1: 0 });
    expect([...n.changes]).toEqual([['.→R', 6]]);
    expect(t.steps).toBe(1);
  });

  it('one: una cella per passo fino a dove dice steps', () => {
    const n = leaf(traceProgram(model('<one in="B" out="R" steps="7"/>'), 1).nodes, 'one');
    expect(n).toMatchObject({ runs: 7, cells: 7 });
    expect(n.fired).toEqual([7]);
  });

  it('all: un passo solo se copre tutto, tante applicazioni', () => {
    const n = leaf(traceProgram(model('<all in="B" out="G"/>'), 1).nodes, 'all');
    expect(n).toMatchObject({ runs: 1, cells: 75 });
    expect(n.fired).toEqual([75]);
    expect(n.box).toEqual({ x0: 0, x1: 4, y0: 0, y1: 4, z0: 0, z1: 2 });
  });

  it('prl: le celle sono quelle scritte, e ogni regola ha il suo conto', () => {
    const t = traceProgram(model('<prl steps="1"><rule in="B" out="R" p="0.5"/><rule in="B" out="G" p="0.5"/></prl>'), 3);
    const n = leaf(t.nodes, 'prl');
    expect(n.runs).toBe(1);
    expect(n.fired).toHaveLength(2);
    const grid = t.result.grid;
    const written = grid.cells.reduce((s, c) => s + (c ? 1 : 0), 0);
    expect(n.cells).toBe(written);
  });

  it('una regola che non si applica mai ha conto 0', () => {
    const n = leaf(traceProgram(model('<all><rule in="B" out="R"/><rule in="Y" out="W"/></all>'), 1).nodes, 'all');
    expect(n.fired).toEqual([75, 0]);
    expect(traceText(model('<all><rule in="B" out="R"/><rule in="Y" out="W"/></all>'), 1, { forma: 'nodes' })).toContain('r2 Y → W ×0');
  });

  it('convolution: i passi e le celle dell’automa', () => {
    // The floor becomes green: from one red cell, red spreads one ring of neighbours per step.
    const m = compileMjx(`<sequence values="BR" size="5 5 1" origin="True"><convolution neighborhood="VonNeumann" steps="2"><rule in="B" out="R" sum="1..6" values="R"/></convolution></sequence>`);
    const n = leaf(traceProgram(m, 1).nodes, 'conv');
    expect(n.runs).toBe(2);
    expect(n.cells).toBe(4 + 8);
    expect(n.fired).toEqual([12]);
  });

  it('path: le celle del cammino, partenza e arrivo escluse', () => {
    const t = traceProgram(compileMjx(`<sequence values="BRGW" size="7 1 1"><box at="0 0 0" size="1 1 1" color="R"/><box at="6 0 0" size="1 1 1" color="G"/><path from="R" to="G" on="B" color="W"/></sequence>`), 1);
    const n = leaf(t.nodes, 'path');
    expect(n).toMatchObject({ runs: 1, cells: 5 });
    expect(n.box).toMatchObject({ x0: 1, x1: 5 });
    expect([...n.changes]).toEqual([['.→W', 5]]);
  });

  it('map: la griglia cambia e la traccia lo dice', () => {
    const m = compileMjx(`<sequence values="BR" size="2 2 1"><all in="B" out="R"/><map values="BG" scale="2 2 1"><rule in="R" out="GG/GG"/><all in="G" out="B"/></map></sequence>`);
    const t = traceProgram(m, 1);
    expect(t.size).toEqual([2, 2, 1]);
    expect(t.finalSize).toEqual([4, 4, 1]);
    expect(leaf(t.nodes, 'map')).toMatchObject({ runs: 1, cells: 16 });
    expect(traceText(m, 1)).toContain('griglia da 2×2×1 a 4×4×1');
    // What comes after the map is counted on the new grid.
    expect(t.nodes.filter((n) => n.node.type === 'all').map((n) => n.cells)).toEqual([4, 16]);
  });

  it('sequence e markov: i figli in ordine, un markov è un\'unità sola', () => {
    const t = traceProgram(model('<all in="B" out="R"/><markov><one in="R" out="G" steps="2"/><one in="R" out="Y" steps="1"/></markov>'), 1);
    expect(t.nodes.map((n) => n.node.type)).toEqual(['sequence', 'all', 'markov', 'one', 'one']);
    expect(t.phases).toHaveLength(2);
    expect(t.nodes[1].unit).not.toBe(t.nodes[2].unit);
    expect(t.nodes[3].unit).toBe(t.nodes[4].unit);
    expect(t.phases[1]).toMatchObject({ from: 1, cells: t.nodes[3].cells + t.nodes[4].cells });
  });

  it('un nodo che non fa nulla sta in fondo, con il perché', () => {
    const text = traceText(model('<one in="Y" out="W"/><box at="2 2 0" size="1 1 1" color="B"/><all in="B" out="R"/>'), 1, { forma: 'nodes' });
    expect(text).toMatch(/Senza effetto[^\n]*\n#2 one Y → W: in quel momento nella griglia non c'erano celle "Y"\n#3 box/);
  });

  it('i pattern si leggono come li scrive l’XML: lo strato più alto per primo', () => {
    expect(traceText(model('<one in="R B" out="R B"/><one in="B" out="R" steps="1"/><one in="R B" out="G B" steps="1"/>'), 1, { forma: 'nodes' })).toContain('R . → G .');
  });

  it('un passo che scrive più di quanto il registro tiene si conta lo stesso', () => {
    // The engine's log is emptied past 2 million writes.
    const m = compileMjx(`<sequence values="BR" size="130 130 130"><box at="64.5 64.5 0" size="130 130 130" color="R"/></sequence>`);
    const n = leaf(traceProgram(m, 1).nodes, 'shape');
    expect(n.cells).toBe(130 ** 3);
    expect(n.box).toEqual({ x0: 0, x1: 129, y0: 0, y1: 129, z0: 0, z1: 129 });
  });
});

describe('la traccia non cambia il risultato', () => {
  it.each(OFFICIAL.filter((o) => o.name !== 'MazeTrail'))('$name: griglia e passi identici', (o) => {
    const m = compileMjx(o.xml, { size: o.size });
    const plain = run(m.program, 7, 5_000_000, FORM_LIMITS);
    const t = traceProgram(m, 7);
    expect(t.steps).toBe(plain.steps);
    expect(Buffer.compare(t.result.grid.cells, plain.grid.cells)).toBe(0);
  });

  it('un modello del banco: griglia identica a quella che le misure guardano', () => {
    const xml = fs.readFileSync('lab/banco/conferma/moderna/1/modello.xml', 'utf8');
    const e = esegui(xml, bersaglio('moderna')!);
    const t = traceProgram(e.model, 1);
    expect(Buffer.compare(t.result.grid.cells, e.result.grid.cells)).toBe(0);
    expect(t.steps).toBe(e.result.steps);
  });

  it('un fotogramma è la griglia di quel passo: l’ultimo è il risultato', () => {
    const m = model('<one in="B" out="R" steps="10"/>');
    const t = traceProgram(m, 5);
    const frames = framesAt(m, 5, [0, 4, 10]);
    expect(frames.get(0)!.cells.reduce((s, c) => s + c, 0)).toBe(0);
    expect(frames.get(4)!.cells.filter(Boolean).length).toBe(4);
    expect(Buffer.compare(frames.get(10)!.cells, t.result.grid.cells)).toBe(0);
  });

  it('due giri con lo stesso seme: lo stesso testo, tranne il tempo', () => {
    const m = compileMjx(OFFICIAL.find((o) => o.name === 'StrangeDungeon')!.xml, { size: [15, 15, 9] });
    const noTime = (s: string) => s.replace(/in \d+ ms/, '');
    expect(noTime(traceText(m, 2))).toBe(noTime(traceText(m, 2)));
  });
});

describe('le forme', () => {
  const house = model('<box at="2 2 0" size="3 3 2" color="R"/><box at="2 2 0" size="1 1 2" color="G"/>');

  it('(a) le sezioni: una fila è una lettera per il suo conto, righe e piani uguali piegati', () => {
    const f = framesAt(house, 1, [1]).get(1)!;
    const lines = sectionLines(f).flat();
    expect(lines).toEqual(['z0-1:', 'y1-3 . R×3 .']);
    // Without folding: every plane, every row, one letter per cell.
    expect(sectionLines(f, { plain: true }).flat().filter((l) => l.includes('R'))[0]).toBe('y1 .RRR.');
  });

  it('(b) le differenze: per coppia di lettere, le celle e le scatole', () => {
    const frames = framesAt(house, 1, [1, 2]);
    expect(diffLines(frames.get(1)!, frames.get(2)!, 4)).toEqual(['  R→G 2: x2 y2 z0-1']);
    expect(traceText(house, 1, { forma: 'diffs' })).toContain('  R→G 2: x2 y2 z0-1');
  });

  it('(c) le scatole coprono ogni cella una volta sola', () => {
    const m = compileMjx(OFFICIAL.find((o) => o.name === 'StrangeDungeon')!.xml, { size: [15, 15, 9] });
    const g = traceProgram(m, 1).result.grid;
    const boxes = boxesOf(g.X, g.Y, g.Z, g.cells);
    const seen = new Uint8Array(g.cells.length);
    for (const b of boxes)
      for (let z = b.z0; z <= b.z1; z++)
        for (let y = b.y0; y <= b.y1; y++)
          for (let x = b.x0; x <= b.x1; x++) {
            const i = x + y * g.X + z * g.X * g.Y;
            expect(g.cells[i]).toBe(b.label);
            seen[i]++;
          }
    for (let i = 0; i < g.cells.length; i++) expect(seen[i]).toBe(g.cells[i] ? 1 : 0);
  });

  it('(c) nel testo: ogni lettera con le sue scatole', () => {
    expect(traceText(house, 1, { forma: 'boxes' })).toMatch(/R 16: /);
    expect(traceText(house, 1, { forma: 'boxes', passo: 1 })).toMatch(/R 18: x1-3 y1-3 z0-1/);
  });
});

describe('il tetto', () => {
  const programs = [
    { id: 'rocca', m: () => esegui(fs.readFileSync('lab/banco/conferma/rocca/1/modello.xml', 'utf8'), bersaglio('rocca')!).model },
    { id: 'steampunk', m: () => esegui(fs.readFileSync('lab/banco/conferma/steampunk/1/modello.xml', 'utf8'), bersaglio('steampunk')!).model },
    { id: 'StrangeDungeon', m: () => compileMjx(OFFICIAL.find((o) => o.name === 'StrangeDungeon')!.xml, { size: OFFICIAL.find((o) => o.name === 'StrangeDungeon')!.size }) },
  ];

  it.each(programs)('$id: ogni forma resta sotto ogni tetto', ({ m }) => {
    const model = m();
    const t = traceProgram(model, 1);
    for (const forma of TRACE_FORMS)
      for (const tetto of [300, 1500, 4000]) {
        const text = renderTrace(t, model, { forma, tetto });
        expect(estimateTokens(text), `${forma} a ${tetto}`).toBeLessThanOrEqual(tetto);
        expect(text.length).toBeGreaterThan(0);
      }
  }, 240_000);

  it('ciò che si fonde sono prima i box: i nodi di regole restano leggibili', () => {
    const boxes = Array.from({ length: 60 }, (_, i) => `<box at="${i % 10} ${(i / 10) | 0} 0" size="1 1 1" color="R"/>`).join('');
    const m = compileMjx(`<sequence values="BRG" size="10 10 2">${boxes}<one in="R" out="G" steps="3"/></sequence>`);
    const text = traceText(m, 1, { forma: 'nodes', tetto: 400 });
    expect(text).toMatch(/one R → G passi=3: ×3, 3 celle/);
    expect(text).toMatch(/#\d+-\d+ box×\d+/);
  });

  it('ciò che si taglia si dice', () => {
    const m = compileMjx(`<sequence values="BRG" size="10 10 2"><one in="B" out="R" steps="40"/><one in="R" out="G" steps="3"/></sequence>`);
    expect(traceText(m, 1, { forma: 'diffs', tetto: 120 })).toMatch(/tagliato/);
  });
});

describe('la seconda richiesta', () => {
  const scheda = { passa: false, difetti: ['piani: 1 (≥ 2)'] };

  it('la traccia di un modello del banco ci sta dentro, sotto il tetto', () => {
    const xml = fs.readFileSync('lab/banco/conferma/moderna/1/modello.xml', 'utf8');
    const traccia = traceText(esegui(xml, bersaglio('moderna')!).model, 1, { tetto: 4000 });
    expect(estimateTokens(traccia)).toBeLessThanOrEqual(4000);
    expect(traccia).toMatch(/L→R 8880/);
    expect(testoSeconda('Bersaglio', xml, { difetti: ['piani: 1'], traccia })).toContain(traccia);
  });

  it('porta la traccia, quando c’è, e senza non cambia', () => {
    const esame = daCorreggere(scheda)!;
    const senza = testoSeconda('Bersaglio', '<one/>', esame);
    expect(senza).not.toContain('nodo per nodo');
    const con = testoSeconda('Bersaglio', '<one/>', { ...esame, traccia: 'Traccia, seme 1: griglia 2×2×2' });
    expect(con).toContain('nodo per nodo');
    expect(con).toContain('Traccia, seme 1: griglia 2×2×2');
    expect(con.indexOf('nodo per nodo')).toBeLessThan(con.indexOf('Correggi questi difetti'));
  });
});
