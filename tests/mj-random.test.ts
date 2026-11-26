// The switch of the semantics and System.Random in the engine (T526, A1-1, ADR-0263; docs/design/markov-allineamento.md § 2, § 7).
//
// - System.Random of .NET in src/mj/random.ts draws what .NET printed (lab/banco/conformita/uscite.json, caso/Program.cs) and what the
//   reference's own copy draws (lab/banco/conformita/dotnet-random.ts, kept apart: the oracle does not lean on the engine).
// - Off, the default: nothing compiles to `mj` unless told, and a run of ours is the run of before (the fingerprints of every program are
//   in tests/mj-engine-determinism.test.ts, ADR-0142).
// - On: a run draws from System.Random with its seed, and its generators of their own from one `Next()`; where our order of the matches is
//   already the original's (one rule on a line) the grid is the original's, voxel for voxel, as the reference (the oracle) gives it.

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { casoLine } from '../lab/banco/conformita/casi';
import { DotnetRandom } from '../lab/banco/conformita/dotnet-random';
import { runReference } from '../lab/banco/conformita/riferimento';
import { OFFICIAL_FILES } from '../lab/mjx/official/index';
import { Rng } from '../src/kernel/rng';
import { run, runOn, Stepper, type Grid3, type Program3 } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';
import { randomFor, semanticsOf, SystemRandom } from '../src/mj/random';

const recorded = JSON.parse(fs.readFileSync('lab/banco/conformita/uscite.json', 'utf8')) as { caso: { seeds: number[]; draws: number; lines: string[] } };

/** What SystemRandom draws, in the order caso/Program.cs prints (Next, Next(n), NextDouble as its 64 bits), as `casoLine` of the bench. */
function line(seed: number, draws: number): string {
  const maxima = [1, 2, 3, 7, 10, 100, 1000, 65536, 1 << 30, 2147483647];
  const r = new SystemRandom(seed);
  const buf = new DataView(new ArrayBuffer(8));
  let out = `SEED ${seed}`;
  for (let k = 0; k < draws; k++) {
    if (k % 3 === 0) out += ` N${r.nextInt()}`;
    else if (k % 3 === 1) out += ` M${r.int(maxima[k % maxima.length])}`;
    else {
      buf.setFloat64(0, r.next());
      out += ` D${buf.getBigInt64(0)}`;
    }
  }
  return out;
}

/** A run from a grid written in letters (the first value is the empty cell), as the original starts from it. */
function ours(xml: string, size: [number, number, number], seed: number, steps: number, start: string, semantics?: 'mj') {
  const m = compileMjx(xml, { size, ...(semantics ? { semantics } : {}) });
  const values = /values="([^"]*)"/.exec(xml)![1];
  const alphabet = ['.', ...[...values].slice(1)];
  const g: Grid3 = { X: size[0], Y: size[1], Z: size[2], cells: new Uint8Array(size[0] * size[1] * size[2]), alphabet, log: [], epoch: 0 };
  for (let i = 0; i < start.length; i++) g.cells[i] = Math.max(0, alphabet.indexOf(start[i] === values[0] ? '.' : start[i]));
  const r = runOn(g, m.program, seed, steps);
  return { letters: Array.from(r.grid.cells, (c) => (c === 0 ? values[0] : r.grid.alphabet[c])).join(''), steps: r.steps };
}

describe('System.Random di .NET nel motore', () => {
  it('tira ciò che .NET ha stampato, bit per bit (dieci semi, anche 0, −5, −2³¹ e 2³¹ − 1)', () => {
    expect(recorded.caso.lines).toHaveLength(recorded.caso.seeds.length);
    for (let i = 0; i < recorded.caso.seeds.length; i++) expect(line(recorded.caso.seeds[i], recorded.caso.draws), String(recorded.caso.seeds[i])).toBe(recorded.caso.lines[i]);
  });

  it('tira ciò che tira la copia del riferimento, che resta a parte', () => {
    for (const seed of [1, 99, 0, -7, 2147483647, -2147483648]) {
      const a = new SystemRandom(seed);
      const b = new DotnetRandom(seed);
      for (let k = 0; k < 2000; k++) {
        if (k % 3 === 0) expect(a.seed()).toBe(b.next());
        else if (k % 3 === 1) expect(a.int(1 + (k % 97))).toBe(b.nextMax(1 + (k % 97)));
        else expect(a.next()).toBe(b.nextDouble());
      }
    }
    expect(casoLine(5, 30)).toBe(line(5, 30));
  });

  it('un seme senza segno oltre 2³¹ − 1 è lo stesso int di C#', () => {
    const a = new SystemRandom(0xffffffff);
    const b = new SystemRandom(-1);
    for (let k = 0; k < 100; k++) expect(a.next()).toBe(b.next());
  });

  it('un generatore suo nasce da un Next() e resta System.Random', () => {
    const r = new SystemRandom(3);
    const s = new SystemRandom(3).nextInt();
    const child = r.spawn(r.seed());
    expect(child).toBeInstanceOf(SystemRandom);
    const twin = new SystemRandom(s);
    for (let k = 0; k < 50; k++) expect(child.next()).toBe(twin.next());
  });
});

describe('l’interruttore della semantica, spento', () => {
  const xml = '<sequence values="BWR"><one in="B" out="W" steps="7"/><prl in="B" out="R" p="0.4"/></sequence>';

  it('il compilatore non scrive la semantica se nessuno la chiede', () => {
    const m = compileMjx(xml, { size: [12, 12, 1] });
    expect('semantics' in m.program).toBe(false);
    expect(semanticsOf(m.program)).toBe('ours');
    expect(compileMjx(xml, { size: [12, 12, 1], semantics: 'mj' }).program.semantics).toBe('mj');
  });

  it('la nostra corsa è quella di prima: mulberry32 col seme', () => {
    expect(randomFor(undefined, 9)).toBeInstanceOf(Rng);
    expect(randomFor('ours', 9)).toBeInstanceOf(Rng);
    expect(randomFor('mj', 9)).toBeInstanceOf(SystemRandom);
    const p = compileMjx(xml, { size: [12, 12, 1] }).program as Program3;
    for (const seed of [1, 2, 3]) expect(run(p, seed).grid.cells).toEqual(run(p, seed, 20000, undefined, { semantics: 'ours' }).grid.cells);
  });

  it('un Rng tira i suoi generatori come prima (`new Rng(rng.int(0x7fffffff))`)', () => {
    const a = new Rng(11);
    const b = new Rng(11);
    const child = a.spawn(a.seed());
    const before = new Rng(b.int(0x7fffffff));
    for (let k = 0; k < 50; k++) expect(child.next()).toBe(before.next());
  });
});

describe('l’interruttore della semantica, acceso', () => {
  // One rule on a line: the order of the matches is already the original's, so the only difference left is the generator.
  const LINE: Array<[string, number]> = [
    ['<prl values="BW" in="B" out="W" p="0.5"/>', 1],
    ['<prl values="BW" in="B" out="W" p="0.3" symmetry="()"/>', 1],
    ['<one values="BW" in="B" out="W" steps="1"/>', 1],
    ['<one values="BW" in="B" out="W" steps="5"/>', 5],
  ];
  const start = 'B'.repeat(24);

  it('dove il nostro ordine è già quello dell’originale, la griglia è la sua, voxel per voxel', () => {
    for (const [xml, steps] of LINE)
      for (const seed of [1, 2, 3]) {
        const ref = runReference(xml, [24, 1, 1], seed, steps, {}, start);
        expect(ours(xml, [24, 1, 1], seed, steps, start, 'mj'), `${xml} ${seed}`).toEqual({ letters: ref.text.replace(/\s+/g, ''), steps: ref.steps });
        // Ours, with mulberry32, is another grid.
        expect(ours(xml, [24, 1, 1], seed, steps, start).letters, `${xml} ${seed}`).not.toBe(ref.text.replace(/\s+/g, ''));
      }
  });

  it('la corsa lo dice sopra il programma, e il passo persistente lo segue', () => {
    const xml = '<prl values="BW" in="B" out="W" p="0.5"/>';
    const p = compileMjx(xml, { size: [24, 1, 1] }).program as Program3;
    const ref = runReference(xml, [24, 1, 1], 2, 1, {}, start).text.replace(/\s+/g, '');
    const letters = (g: Grid3) => Array.from(g.cells, (c) => (c === 0 ? 'B' : g.alphabet[c])).join('');
    expect(letters(run(p, 2, 1, undefined, { semantics: 'mj' }).grid)).toBe(ref);
    const g: Grid3 = { X: 24, Y: 1, Z: 1, cells: new Uint8Array(24), alphabet: ['.'], log: [], epoch: 0 };
    new Stepper(g, compileMjx(xml, { size: [24, 1, 1], semantics: 'mj' }).program, 2).advance(1);
    expect(letters(g)).toBe(ref);
  });

  it('la wfc tira da generatori suoi, deterministici dal seme', () => {
    const xml = fs.readFileSync('lab/banco/conformita/mxgmn/Apartemazements.xml', 'utf8');
    const p = compileMjx(xml, { size: [8, 8, 8], files: OFFICIAL_FILES, semantics: 'mj' }).program as Program3;
    const a = run(p, 1, 50_000);
    expect(run(p, 1, 50_000).grid.cells).toEqual(a.grid.cells);
    const q = compileMjx(xml, { size: [8, 8, 8], files: OFFICIAL_FILES }).program as Program3;
    expect(run(q, 1, 50_000).grid.cells).not.toEqual(a.grid.cells);
  });
});
