// MarkovJunior of mxgmn, the reference and our engine (T500, docs/design/markov-allineamento.md, lab/banco/conformita/README.md).
//
// The reference (lab/banco/conformita/riferimento.ts) is the original line by line in TypeScript, with System.Random of .NET
// (dotnet-random.ts). What the original printed, built from github.com/mxgmn/MarkovJunior at 42aaf24 (lab/banco/markov/README.md) and run
// by lab/scripts/conformita-mj.ts, is in lab/banco/conformita/uscite.json and lab/banco/markov/originale.json (T498): here the reference
// is held to it, voxel by voxel, steps and end included. Then our engine: an `it` fixes what it does today, an `it.fails` says what the
// original does with the same program, the same start and the same seed. Nothing here changes the engine: the day the engine runs a case
// as the original (the alignment, T500's chain), its `it.fails` passes and fails the suite, and the pair becomes one `it`.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CASES, casoLine, EXAMPLES, gridHash, REPO_3D } from '../lab/banco/conformita/casi';
import { runReference } from '../lab/banco/conformita/riferimento';
import { OFFICIAL_FILES } from '../lab/mjx/official/index';
import { run, runOn, type Grid3, type Program3 } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';

interface Outcome {
  letters: string;
  steps: number;
  finished: boolean;
}
interface Recorded {
  caso: { seeds: number[]; draws: number; lines: string[] };
  programmi: Record<string, Record<string, Outcome | string>>;
  modelli: Record<string, { size: [number, number, number]; steps: number; seeds: Record<string, { steps: number; finished: boolean; hash: string }> }>;
  esempi: Record<string, Record<string, { steps: number; finished: boolean; hash: string }>>;
}

const BENCH = 'lab/banco/conformita';
const recorded = JSON.parse(fs.readFileSync(`${BENCH}/uscite.json`, 'utf8')) as Recorded;
const flat = (t: string) => t.replace(/\s+/g, '');
const program = (name: string) => ({ xml: fs.readFileSync(`${BENCH}/programmi/${name}.xml`, 'utf8').trim(), start: flat(fs.readFileSync(`${BENCH}/programmi/${name}.txt`, 'utf8')) });

/** The reference from a grid written in letters: its letters, steps and end. */
function reference(xml: string, size: [number, number, number], seed: number, steps: number, start?: string): Outcome {
  const r = runReference(xml, size, seed, steps, {}, start);
  return { letters: flat(r.text), steps: r.steps, finished: r.finished };
}

/** Our engine from a grid written in letters (the first value is the empty cell), as the original starts from it. */
function ours(xml: string, size: [number, number, number], seed: number, steps: number, start: string): Outcome {
  const m = compileMjx(xml, { size });
  const values = /values="([^"]*)"/.exec(xml)![1];
  const alphabet = ['.', ...[...values].slice(1)];
  const g: Grid3 = { X: size[0], Y: size[1], Z: size[2], cells: new Uint8Array(size[0] * size[1] * size[2]), alphabet, log: [], epoch: 0 };
  for (let i = 0; i < start.length; i++) g.cells[i] = Math.max(0, alphabet.indexOf(start[i] === values[0] ? '.' : start[i]));
  const r = runOn(g, m.program, seed, steps);
  return { letters: Array.from(r.grid.cells, (c) => (c === 0 ? values[0] : r.grid.alphabet[c])).join(''), steps: r.steps, finished: r.finished };
}

describe('System.Random di .NET', () => {
  it('la copia tira gli stessi numeri di .NET: Next, Next(n) e NextDouble, bit per bit, anche coi semi negativi', () => {
    expect(recorded.caso.lines).toHaveLength(recorded.caso.seeds.length);
    for (let i = 0; i < recorded.caso.seeds.length; i++) expect(casoLine(recorded.caso.seeds[i], recorded.caso.draws)).toBe(recorded.caso.lines[i]);
  });
});

describe('il riferimento è l’originale', () => {
  it('sui programmi delle differenze: la stessa griglia, gli stessi passi, la stessa fine, gli stessi errori', () => {
    for (const c of CASES) {
      const { xml, start } = program(c.name);
      for (const [seed, o] of Object.entries(recorded.programmi[c.name])) {
        if (typeof o === 'string') expect(() => reference(xml, c.size, Number(seed), c.steps, start), `${c.name} ${seed}`).toThrow();
        else expect(reference(xml, c.size, Number(seed), c.steps, start), `${c.name} ${seed}`).toEqual(o);
      }
    }
  });

  it('sui programmi di T498 (lab/banco/markov/): ciò che l’originale vi ha stampato', () => {
    const rec = JSON.parse(fs.readFileSync('lab/banco/markov/originale.json', 'utf8')) as Record<string, Record<string, Outcome>>;
    let n = 0;
    for (const name of Object.keys(rec).filter((k) => k.startsWith('d'))) {
      const xml = fs.readFileSync(`lab/banco/markov/programmi/${name}.xml`, 'utf8').trim();
      const start = flat(fs.readFileSync(`lab/banco/markov/programmi/${name}.txt`, 'utf8'));
      for (const [seed, o] of Object.entries(rec[name])) {
        expect(reference(xml, [start.length, 1, 1], Number(seed), name.startsWith('d8') ? 200 : 1000, start), `${name} ${seed}`).toEqual(o);
        n++;
      }
    }
    expect(n).toBe(16);
  });

  // The 3D models of the original's repository (their text in lab/banco/conformita/mxgmn/, the resources as text in lab/mjx/official/resources/)
  // that the reference runs in a moment; all 36 it reads, on 3 seeds, are checked by lab/scripts/conformita-mj.ts -- --modelli --originale.
  const QUICK = ['Growth', 'MazeGrowth', 'MazeTrail', 'NoDeadEnds', 'Noise', 'OddScale3D', 'ParallelGrowth', 'RegularSAW', 'RegularSAWRestart', 'River', 'StrangeDungeon', 'Counting', 'Keys', 'Hills', 'Voronoi', 'StochasticVoronoi', 'Partitioning', 'Surface', 'ClosedSurface', 'EscherSurface', 'Apartemazements', 'PillarsOfEternity', 'ModernHouse', 'SeaVilla', 'SoftPath', 'StairsPath', 'Knots3D', 'ColoredKnots', 'SelectLongKnots', 'SubmergedKnots', 'CarmaTower', 'DualRetraction3D'];
  it(`sui modelli 3D di mxgmn (${QUICK.length}, seme 1): la stessa griglia voxel per voxel dell’originale, gli stessi passi`, { timeout: 120_000 }, () => {
    for (const name of QUICK) {
      const m = REPO_3D.find((o) => o.name === name)!;
      const r = recorded.modelli[name];
      expect(r.size, name).toEqual(m.size);
      expect(r.steps, name).toBe(m.steps);
      const out = runReference(fs.readFileSync(`${BENCH}/mxgmn/${name}.xml`, 'utf8'), m.size, 1, r.steps, OFFICIAL_FILES);
      expect({ steps: out.steps, finished: out.finished, hash: gridHash(out.text.trim()) }, name).toEqual(r.seeds['1']);
    }
  });

  it('sull’esempio del borgo coi sentieri (path): la stessa griglia dell’originale su tre semi', () => {
    for (const e of EXAMPLES) {
      const xml = fs.readFileSync(`${BENCH}/esempi/${e.name}.xml`, 'utf8');
      for (const seed of e.seeds) {
        const out = runReference(xml, e.size, seed, e.steps);
        expect({ steps: out.steps, finished: out.finished, hash: gridHash(out.text.trim()) }, `${e.name} ${seed}`).toEqual(recorded.esempi[e.name][String(seed)]);
      }
    }
  });
});

describe('il nostro motore contro l’originale, una differenza alla volta', () => {
  // What our engine does today with seed 1 (lab/banco/conformita/README.md, the table of the differences).
  const TODAY: Record<string, Outcome | 'errore'> = {
    'c1-d-ignorato': { letters: 'BBBB', steps: 0, finished: true },
    'c2-la-map-chiude': { letters: 'WWWW', steps: 3, finished: true },
    'c3-path-dal-vicino': { letters: 'RBBGWWWWWR', steps: 1, finished: false },
    'c4-path-senza-colore': 'errore',
    'c5-conv-passi': { letters: `${'R'.repeat(31)}${'B'.repeat(29)}`, steps: 30, finished: true },
    'c6-conv-moore-3d': { letters: 'RRRRRRRR', steps: 1, finished: true },
    'c7-conv-non-registra': { letters: 'BB', steps: 3, finished: true },
    'c8-unione-nel-nodo': { letters: 'BGB', steps: 1, finished: true },
    'c9-conv-2d-periodica': { letters: 'BBBBBBRRRBBRRRBBRRRBBBBBB', steps: 1, finished: true },
    'c10-prl-sovrapposte': { letters: 'RBB', steps: 1, finished: false },
    'c11-path-per-spigoli': { letters: 'RWBBWBBWG', steps: 1, finished: false },
  };
  const WHAT: Record<string, string> = {
    'c1-d-ignorato': 'l’originale ignora d="2": i due nodi girano anche in 3D',
    'c2-la-map-chiude': 'quando i nodi di una map finiscono, la corsa è finita: ciò che viene dopo non gira',
    'c3-path-dal-vicino': 'path parte dal from più vicino all’arrivo (un poco di rumore solo fra i pari)',
    'c4-path-senza-colore': 'path senza color disegna col primo simbolo di from',
    'c5-conv-passi': 'una convolution gira tutti i passi che dice, non al più 30',
    'c6-conv-moore-3d': 'Moore in 3D non c’è (VonNeumann e NoCorners): l’originale non carica il programma',
    'c7-conv-non-registra': 'ciò che una convolution scrive non lo vede un nodo di regole che ha già cercato: un’eredità dell’originale',
    'c8-unione-nel-nodo': 'un’unione dentro un nodo di regole non è della griglia: l’originale non carica il programma',
    'c9-conv-2d-periodica': 'su una griglia piana e periodica la convolution conta i vicini del piano, una volta sola',
    'c10-prl-sovrapposte': 'una prl scrive solo dove la cella cambia rispetto a com’era: due regole sulla stessa cella non si coprono a caso',
    'c11-path-per-spigoli': 'path con edges va anche per spigoli: in diagonale, una cella invece di tre',
  };
  for (const c of CASES) {
    const { xml, start } = program(c.name);
    const original = recorded.programmi[c.name]['1'];
    it(`${c.name}, il nostro motore oggi`, () => {
      const today = TODAY[c.name];
      if (today === 'errore') expect(() => ours(xml, c.size, 1, c.steps, start)).toThrow();
      else expect(ours(xml, c.size, 1, c.steps, start)).toEqual(today);
    });
    it.fails(`${c.name}, come l’originale: ${WHAT[c.name]}`, () => {
      if (typeof original === 'string') expect(() => ours(xml, c.size, 1, c.steps, start)).toThrow();
      else expect(ours(xml, c.size, 1, c.steps, start)).toEqual(original);
    });
  }

  it.fails('Growth come l’originale, voxel per voxel (lo stesso caso, lo stesso ordine delle corrispondenze)', () => {
    const m = REPO_3D.find((o) => o.name === 'Growth')!;
    const p = compileMjx(fs.readFileSync(`${BENCH}/mxgmn/Growth.xml`, 'utf8'), { size: m.size }).program as Program3;
    const r = run(p, 1, recorded.modelli.Growth.steps);
    const text = Array.from({ length: r.grid.Z }, (_, z) => Array.from({ length: r.grid.Y }, (_, y) => Array.from({ length: r.grid.X }, (_, x) => { const c = r.grid.cells[x + y * r.grid.X + z * r.grid.X * r.grid.Y]; return c === 0 ? 'B' : r.grid.alphabet[c]; }).join('')).join('\n')).join('\n\n');
    expect({ steps: r.steps, finished: r.finished, hash: gridHash(text) }).toEqual(recorded.modelli.Growth.seeds['1']);
  });

  it.fails('Surface come l’originale: la wfc osserva una cella per passo (509 passi col seme 1, da noi 1)', () => {
    const m = REPO_3D.find((o) => o.name === 'Surface')!;
    const copy = OFFICIAL_FILES;
    const xml = fs.readFileSync(`${BENCH}/mxgmn/Surface.xml`, 'utf8');
    const p = compileMjx(xml, { size: m.size, files: copy }).program as Program3;
    const r = run(p, 1, 50_000);
    expect(r.steps).toBe(recorded.modelli.Surface.seeds['1'].steps);
  });

  it('il borgo coi sentieri gira anche da noi: ogni porta collegata alla rete (con un altro caso)', () => {
    const e = EXAMPLES[0];
    const xml = fs.readFileSync(`${BENCH}/esempi/${e.name}.xml`, 'utf8');
    const m = compileMjx(xml, { size: e.size });
    for (const seed of e.seeds) {
      const r = run(m.program as Program3, seed, e.steps);
      const count = (ch: string) => Array.from(r.grid.cells).filter((c) => r.grid.alphabet[c] === ch).length;
      expect(r.finished).toBe(true);
      expect(count('H') / 20).toBe(10);
      expect(count('d')).toBe(10);
      expect(count('D')).toBe(0);
      expect(count('W')).toBeGreaterThan(40);
    }
  });
});
