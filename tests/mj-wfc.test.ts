// MarkovJunior's wfc (tiles and overlap), convchain and the fractional map (T335, ADR-0174): small tilesets and samples whose result is
// known, a contradiction and a new try, determinism, the ceilings, the folders of rule files, unions that belong to their grid, and what
// the original (MarkovJunior's C#, run with lab/banco/wfc/originale) gives on its own tilesets: the same patterns and the same neighbours.

import { describe, expect, it } from 'vitest';
import { Rng } from '../src/kernel/rng';
import { modelErrors } from '../src/kernel/validator';
import { run, type Grid3, type Node3 } from '../src/mj/engine';
import { compileMjx, mjxIncludes, newNodesIn } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { traceText } from '../src/mj/trace';
import { WFC_LIMITS, WfcSolver } from '../src/mj/wfc';
import { OFFICIAL } from '../lab/mjx/official';

const letters = (g: Grid3, bg = 'B') => Array.from(g.cells, (c) => (c === 0 ? bg : g.alphabet[c])).join('');
const count = (g: Grid3, bg = 'B') => {
  const n: Record<string, number> = {};
  for (const ch of letters(g, bg)) n[ch] = (n[ch] ?? 0) + 1;
  return n;
};
/** The wfc nodes of a compiled program. */
const wfcs = (n: Node3): Array<Extract<Node3, { type: 'wfc' }>> => (n.type === 'sequence' || n.type === 'markov' ? n.children.flatMap(wfcs) : n.type === 'wfc' ? [n] : []);

/** Two one-cell tiles, each beside only itself: a whole grid is one of them. */
const DAMA = `<tileset values="BXY">
  <tiles><tile name="X">X</tile><tile name="Y" weight="3">Y</tile></tiles>
  <neighbors>
    <neighbor left="X" right="X"/><neighbor left="Y" right="Y"/>
    <neighbor top="X" bottom="X"/><neighbor top="Y" bottom="Y"/>
  </neighbors>
</tileset>`;

describe('wfc a tessere', () => {
  it('due tessere che stanno solo accanto a sé stesse fanno una griglia di una sola, nelle lettere del nodo', () => {
    const xml = '<sequence values="BW"><all in="B" out="W"/><wfc values="BAC" tileset="dama"><rule in="W" out="X|Y"/></wfc></sequence>';
    const m = compileMjx(xml, { size: [5, 4, 3], files: { 'dama.xml': DAMA } });
    const seen = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const r = run(m.program, seed);
      expect(r.finished).toBe(true);
      expect([r.grid.X, r.grid.Y, r.grid.Z]).toEqual([5, 4, 3]);
      const n = count(r.grid);
      // The tileset's X and Y are the node's A and C: its letters go on the node's by their place in `values`.
      expect(Object.keys(n).length).toBe(1);
      seen.add(Object.keys(n)[0]);
    }
    expect([...seen].sort()).toEqual(['A', 'C']);
  });

  it('le regole dicono quali tessere può avere una lettera della griglia', () => {
    const xml = '<sequence values="BW"><all in="B" out="W"/><wfc values="BAC" tileset="dama"><rule in="W" out="X"/></wfc></sequence>';
    const m = compileMjx(xml, { size: [4, 4, 2], files: { 'dama.xml': DAMA } });
    for (let seed = 1; seed <= 5; seed++) expect(count(run(m.program, seed).grid)).toEqual({ A: 32 });
    expect(() => compileMjx(xml.replace('out="X"', 'out="Z"'), { size: [4, 4, 2], files: { 'dama.xml': DAMA } })).toThrow(/tessera sconosciuta "Z"/);
  });

  it('le tessere stanno a S - overlap una dall\'altra: con overlap negativo restano spazi vuoti', () => {
    const tiles = `<tileset values="BX"><tiles><tile name="T">XX/XX XX/XX</tile></tiles><neighbors><neighbor left="T" right="T"/><neighbor top="T" bottom="T"/></neighbors></tileset>`;
    const files = { 'blocco.xml': tiles };
    const flat = run(compileMjx('<sequence values="B"><wfc values="BX" tileset="blocco"/></sequence>', { size: [3, 2, 1], files }).program, 1).grid;
    expect([flat.X, flat.Y, flat.Z]).toEqual([6, 4, 2]);
    expect(count(flat)).toEqual({ X: 48 });
    const gaps = run(compileMjx('<sequence values="B"><wfc values="BX" tileset="blocco" overlap="-1" overlapz="-1"/></sequence>', { size: [3, 2, 1], files }).program, 1).grid;
    // (2 + 1)·3 - 1 = 8 wide, 5 deep, 2 high: six blocks of 2×2×2 with a cell between them.
    expect([gaps.X, gaps.Y, gaps.Z]).toEqual([8, 5, 2]);
    expect(count(gaps).X).toBe(48);
    expect(letters(gaps).slice(0, 8)).toBe('XXBXXBXX');
  });

  it('una tessera dal suo file, da <tiles>-<nome>, o mancante: il motivo dice quale', () => {
    const tiles = `<tileset values="BX"><tiles><tile name="T" file="pezzo"/><tile name="U"/></tiles><neighbors><neighbor left="T" right="U"/></neighbors></tileset>`;
    const xml = '<sequence values="B"><wfc values="BXZ" tileset="set" tiles="mio"/></sequence>';
    const files = mjxIncludes(xml, (f) => ({ 'set.xml': tiles, 'pezzo.txt': '# una nota\nX', 'mio-U.txt': 'B' })[f]);
    expect(Object.keys(files).sort()).toEqual(['mio-U.txt', 'pezzo.txt', 'set.xml']);
    expect(() => compileMjx(xml, { size: [2, 1, 1], files })).not.toThrow();
    const { 'mio-U.txt': _, ...missing } = files;
    expect(() => compileMjx(xml, { size: [2, 1, 1], files: missing })).toThrow(/models\/set\.xml.*manca il file models\/mio-U\.txt/);
    expect(() => compileMjx(xml.replace('tileset="set"', 'tileset="../set"'), { size: [2, 1, 1], files })).toThrow(/nome semplice/);
    expect(() => compileMjx(xml, { size: [2, 1, 1], files: { ...files, 'set.xml': '<sequence values="B"/>' } })).toThrow(/non è un tileset/);
  });

  it('come l\'originale: le tessere con le loro rotazioni e i vicini dei tileset di MarkovJunior', () => {
    // The original's "P = …" and the number of neighbours per direction (MarkovJunior's C#, lab/banco/wfc/README.md).
    const expected: Record<string, Array<[number, number[]]>> = {
      Surface: [[48, [370, 370, 370, 370, 370, 370]]],
      Escher: [[55, [687, 687, 687, 687, 687, 687]]],
      EscherSurface: [[31, [447, 447, 447, 447, 447, 447]]],
      OrientedEscher: [[64, [650, 650, 650, 650, 650, 650]]],
      PillarsOfEternity: [[26, [95, 95, 95, 95, 266, 266]]],
      Apartemazements: [[16, [114, 114, 114, 114, 148, 148]]],
      Partitioning: [[7, [14, 14, 14, 14, 21, 21]]],
      ModernHouse: [[7, [14, 14, 14, 14, 21, 21]], [49, [180, 180, 180, 180, 365, 365]]],
      SeaVilla: [[14, [37, 37, 37, 37, 63, 63]]],
      WaveDungeon: [[84, [251, 251, 251, 251]]],
    };
    for (const [name, want] of Object.entries(expected)) {
      const o = OFFICIAL.find((m) => m.name === name)!;
      const m = compileMjx(o.xml, { size: o.size, files: o.files });
      expect(wfcs(m.program.program).map((n) => [n.patterns.length, n.propagator.map((d) => d.reduce((s, l) => s + l.length, 0))]), name).toEqual(want);
    }
  });
});

describe('contraddizioni e nuovi tentativi', () => {
  // Three colours, neighbours always different, on a periodic grid: some tries contradict, a later one finds.
  const differ = [0, 1, 2].map((t) => [0, 1, 2].filter((u) => u !== t));
  const any = [0, 1, 2].map(() => [0, 1, 2]);

  it('un tentativo che contraddice lascia il posto al successivo, e la soluzione rispetta i vicini', () => {
    const tries: number[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      const s = new WfcSolver({ MX: 5, MY: 5, MZ: 1, weights: [1, 1, 1], propagator: [differ, differ, differ, differ, any, any], periodic: true, shannon: seed % 2 === 0 });
      const out = s.solve(new Rng(seed), 1000, Infinity);
      expect(out.observed, `seme ${seed}`).toBeDefined();
      const o = out.observed!;
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) expect(o[x + y * 5]).not.toBe(o[((x + 1) % 5) + y * 5]), expect(o[x + y * 5]).not.toBe(o[x + ((y + 1) % 5) * 5]);
      tries.push(out.tries);
    }
    expect(Math.max(...tries)).toBeGreaterThan(0);
  });

  it('senza soluzione la wfc non fa niente: la griglia resta, i suoi nodi non girano', () => {
    // Two colours always different along a periodic row of three: never.
    const two = `<tileset values="BXY"><tiles><tile name="X">X</tile><tile name="Y">Y</tile></tiles><neighbors><neighbor left="X" right="Y"/><neighbor left="Y" right="X"/><neighbor top="X" bottom="X"/><neighbor top="Y" bottom="Y"/><neighbor top="X" bottom="Y"/><neighbor top="Y" bottom="X"/></neighbors></tileset>`;
    const xml = '<sequence values="BW"><all in="B" out="W"/><wfc values="BXYQ" tileset="due" periodic="True" tries="5"><all in="X" out="Q"/></wfc></sequence>';
    const m = compileMjx(xml, { size: [3, 3, 1], files: { 'due.xml': two } });
    const r = run(m.program, 1);
    expect(r.finished).toBe(true);
    expect(count(r.grid)).toEqual({ W: 9 });
    expect(r.unused?.join()).toMatch(/wfc a tessere.*nessun tentativo senza contraddizioni su 5/);
    // A letter the rules give only tiles that cannot stand together: contradictory from the start.
    const start = '<sequence values="BWV"><all in="B" out="W"/><one in="W" out="V" steps="1"/><wfc values="BAC" tileset="dama"><rule in="W" out="X"/><rule in="V" out="Y"/></wfc></sequence>';
    const s = run(compileMjx(start, { size: [3, 1, 1], files: { 'dama.xml': DAMA } }).program, 1);
    expect(count(s.grid)).toEqual({ W: 2, V: 1 });
    expect(s.unused?.join()).toMatch(/condizioni iniziali sono contraddittorie/);
  });
});

describe('wfc a sovrapposizione', () => {
  it('le finestre di un campione a righe fanno righe: ogni colonna di una lettera, le colonne alterne', () => {
    const xml = '<sequence values="B" symmetry="()"><wfc values="BAC" sample="righe" n="2"/></sequence>';
    const m = compileMjx(xml, { size: [6, 4, 1], files: { 'righe.txt': 'AC/AC' } });
    for (let seed = 1; seed <= 6; seed++) {
      const g = run(m.program, seed).grid;
      const t = letters(g);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) expect(t[x + y * 6]).toBe(t[x]), expect(t[x]).not.toBe(t[(x + 1) % 6]);
    }
  });

  it('è piana, come nell\'originale, e le lettere del campione sono quelle del nodo', () => {
    const xml = '<sequence values="B"><wfc values="BAC" sample="righe" n="2"/></sequence>';
    expect(() => run(compileMjx(xml, { size: [4, 4, 2], files: { 'righe.txt': 'AC/AC' } }).program, 1)).toThrow(/piana/);
    expect(() => compileMjx(xml, { size: [4, 4, 1], files: { 'righe.txt': 'AZ/AC' } })).toThrow(/"Z" non è tra i values del nodo/);
    expect(() => compileMjx(xml, { size: [4, 4, 1], files: { 'righe.txt': 'AC/AC AC/AC' } })).toThrow(/uno strato solo/);
  });
});

describe('convchain', () => {
  it('un campione tutto bianco porta al bianco le celle on, e non tocca le altre', () => {
    const xml = '<sequence values="BODA"><all in="B" out="O"/><one in="O" out="D" steps="20"/><convchain sample="bianco" on="O" black="D" white="A" n="2" steps="40"/></sequence>';
    const m = compileMjx(xml, { size: [12, 12, 1], files: { 'bianco.txt': 'AAA/AAA/AAA' } });
    const r = run(m.program, 3);
    const n = count(r.grid);
    expect(n.O ?? 0).toBe(0);
    expect(n.A).toBeGreaterThan(0.85 * (144 - 20));
    // The D written before ConvChain is not under it: only `on` cells change.
    expect(n.D).toBeGreaterThanOrEqual(20);
  });

  it('è piana, il campione è di black e white, n ha un tetto', () => {
    const files = { 'c.txt': 'AD/DA' };
    const ok = '<sequence values="BAD"><convchain sample="c" on="B" black="D" white="A"/></sequence>';
    expect(() => run(compileMjx(ok, { size: [4, 4, 2], files }).program, 1, 3)).toThrow(/piana/);
    expect(() => compileMjx(ok, { size: [4, 4, 1], files: { 'c.txt': 'AQ/DA' } })).toThrow(/"Q" non è né black/);
    expect(() => compileMjx(ok.replace('white', 'n="5" white'), { size: [4, 4, 1], files })).toThrow(/da 1 a 4/);
    // Without steps it goes on until the run's budget: the steps are its sweeps.
    expect(run(compileMjx(ok, { size: [4, 4, 1], files }).program, 1, 30).steps).toBe(30);
    expect(run(compileMjx(ok.replace('white="A"', 'white="A" steps="3"'), { size: [4, 4, 1], files }).program, 1, 30).steps).toBe(3);
  });
});

describe('map frazionaria', () => {
  it('1/2 dimezza: la griglia nuova è M·N/D, ogni regola scrive a x·N/D', () => {
    const xml = '<sequence values="BA"><one in="B" out="A" steps="1"/><map scale="1/2 1/2 1/2" values="BC"><rule in="A" out="C"/></map></sequence>';
    const m = compileMjx(xml, { size: [4, 4, 2] });
    const g = run(m.program, 2).grid;
    expect([g.X, g.Y, g.Z]).toEqual([2, 2, 1]);
    expect(count(g)).toEqual({ B: 3, C: 1 });
  });

  it('5/3 cresce, e una frazione vuole la griglia nuova vuota', () => {
    const xml = '<sequence values="BA"><all in="B" out="A"/><map scale="5/3 5/3 1" values="BC"><rule in="A" out="C"/></map></sequence>';
    const g = run(compileMjx(xml, { size: [3, 3, 1] }).program, 1).grid;
    expect([g.X, g.Y, g.Z]).toEqual([5, 5, 1]);
    // x·5/3 for x = 0, 1, 2: cells 0, 1, 3 of each row, and the same rows.
    expect(letters(g)).toBe('CCBCB' + 'CCBCB' + 'BBBBB' + 'CCBCB' + 'BBBBB');
    expect(() => compileMjx(xml.replace('values="BC"', 'values="BC" clear="False"'), { size: [3, 3, 1] })).toThrow(/frazionaria/);
    expect(() => compileMjx(xml.replace('5/3 5/3 1', '5/0 1 1'), { size: [3, 3, 1] })).toThrow(/da 1 a 32/);
    // An integer scale compiles as it always did: no `divide`.
    expect(compileMjx(xml.replace('5/3 5/3 1', '2 2 1'), { size: [3, 3, 1] }).program.program).not.toHaveProperty('children.1.divide');
  });
});

describe('cartelle e unioni', () => {
  it('folder: le regole da file di una griglia sono models/<folder>-<nome>.txt', () => {
    const xml = '<sequence values="BA"><all in="B" out="A"/><map scale="2 2 1" values="BC" folder="Scale" symmetry="()"><rule in="A" fout="Piano"/></map></sequence>';
    const files = mjxIncludes(xml, (f) => ({ 'Scale-Piano.txt': 'CB/BC', 'Piano.txt': 'CC/CC' })[f]);
    expect(Object.keys(files)).toEqual(['Scale-Piano.txt']);
    const g = run(compileMjx(xml, { size: [1, 1, 1], files }).program, 1).grid;
    expect(letters(g)).toBe('CBBC');
  });

  it('la stessa unione in due griglie vale per la sua; anche "." è un\'unione', () => {
    const xml = `<sequence values="BXY">
      <union symbol="?" values="X"/>
      <one in="B" out="X" steps="1"/>
      <all in="?" out="Y"/>
      <map scale="1 1 1" values="BPQ">
        <union symbol="?" values="Q"/>
        <union symbol="." values="P"/>
        <rule in="Y" out="P"/>
        <all in="." out="Q"/>
        <all in="?" out="P"/>
      </map>
    </sequence>`;
    const m = compileMjx(xml, { size: [3, 1, 1] });
    // In the root "?" is X: the X turned Y; in the map "." is P, then "?" is Q.
    const g = run(m.program, 1).grid;
    expect(count(g)).toEqual({ P: 1, B: 2 });
  });
});

describe('determinismo e tetti', () => {
  const escher = OFFICIAL.find((m) => m.name === 'Escher')!;

  it('lo stesso seme dà la stessa griglia, semi diversi griglie diverse', () => {
    const m = compileMjx(escher.xml, { size: escher.size, files: escher.files });
    const a = run(m.program, 5), b = run(m.program, 5), c = run(m.program, 6);
    expect(Buffer.compare(a.grid.cells, b.grid.cells)).toBe(0);
    expect(Buffer.compare(a.grid.cells, c.grid.cells)).not.toBe(0);
    const cc = OFFICIAL.find((m) => m.name === 'ChainDungeon')!;
    const d = compileMjx(cc.xml, { size: [30, 30, 1], files: cc.files });
    expect(Buffer.compare(run(d.program, 2).grid.cells, run(d.program, 2).grid.cells)).toBe(0);
  });

  it('i tetti: tentativi, onda, tempo', () => {
    expect(() => compileMjx(`<sequence values="B"><wfc values="BAC" tileset="dama" tries="${WFC_LIMITS.tries + 1}"/></sequence>`, { size: [2, 2, 1], files: { 'dama.xml': DAMA } })).toThrow(/tries/);
    const surface = OFFICIAL.find((m) => m.name === 'Surface')!;
    // 60³ cells, 48 patterns, six directions: past the bytes of a wave.
    expect(() => runMjx(compileMjx(surface.xml, { size: [60, 60, 60], files: surface.files }), 1)).toThrow(/onda è troppo grande/);
    // Out of time the run stops and is not finished, never another grid.
    const late = runMjx(compileMjx(surface.xml, { size: [24, 24, 24], files: surface.files }), 1, { deadline: 5 });
    expect(late.finished).toBe(false);
    const s = new WfcSolver({ MX: 4, MY: 4, MZ: 1, weights: [1, 1, 1], propagator: [[[0, 1, 2], [0, 1, 2], [0, 1, 2]], [[0, 1, 2], [0, 1, 2], [0, 1, 2]], [[0, 1, 2], [0, 1, 2], [0, 1, 2]], [[0, 1, 2], [0, 1, 2], [0, 1, 2]]], periodic: false, shannon: false });
    expect(s.solve(new Rng(1), 10, 100, () => 101).late).toBe(true);
  });

  it('il mondo non li prende ancora: il validatore dice quali', () => {
    const files = { 'dama.xml': DAMA };
    const xml = '<sequence values="BW" size="3 3 2"><all in="B" out="W"/><wfc values="BAC" tileset="dama"/></sequence>';
    expect(newNodesIn(compileMjx(xml, { files }))).toEqual(['wfc']);
    expect(modelErrors('models/x.xml', xml, 8_000, undefined, files).join()).toMatch(/<wfc> non è ancora ammesso/);
    const chain = '<sequence values="BAD" size="4 4 1"><convchain sample="c" on="B" black="D" white="A" steps="2"/></sequence>';
    expect(modelErrors('models/x.xml', chain, 8_000, undefined, { 'c.txt': 'AD/DA' }).join()).toMatch(/<convchain> non è ancora ammesso/);
  });

  it('la traccia dice cosa ha fatto la wfc', () => {
    const m = compileMjx('<sequence values="BW"><all in="B" out="W"/><wfc values="BAC" tileset="dama"><rule in="W" out="X|Y"/></wfc></sequence>', { size: [3, 3, 1], files: { 'dama.xml': DAMA } });
    expect(traceText(m, 1)).toMatch(/wfc a tessere 1×1×1, 2 motivi/);
  });
});

describe('come l\'originale (MarkovJunior in C#, lab/banco/wfc/originale)', () => {
  it('ModernHouse: o la casa intera (51×51×24) o, se la seconda onda contraddice, la pianta di 17×17×4, come l\'originale', () => {
    const o = OFFICIAL.find((m) => m.name === 'ModernHouse')!;
    const m = compileMjx(o.xml, { size: o.size, files: o.files });
    const sizes = new Set<string>();
    for (let seed = 1; seed <= 8; seed++) {
      const g = runMjx(m, seed).grid;
      sizes.add(`${g.X}×${g.Y}×${g.Z}`);
    }
    expect([...sizes].sort()).toEqual(['17×17×4', '51×51×24']);
  }, 60_000);

  it('StairsPath disegna le scale con le tessere del map 5/3 lette da file di testo', () => {
    const o = OFFICIAL.find((m) => m.name === 'StairsPath')!;
    const r = runMjx(compileMjx(o.xml, { size: [21, 21, 21], files: o.files }), 2);
    expect([r.grid.X, r.grid.Y, r.grid.Z]).toEqual([35, 35, 35]);
    // As the original: W the stairs and the corridors, A their sides, R the two ends.
    expect(count(r.grid)).toMatchObject({ R: 2 });
    expect(count(r.grid).W).toBeGreaterThan(20);
  });
});
