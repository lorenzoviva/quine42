// `map`, `path`, `convolution`, `convchain` of MarkovJunior of mxgmn in our engine (T529, A1-4; docs/design/markov-allineamento.md § 3.5, § 8).
//
// With the switch of the semantics on (`semantics: 'mj'`, T526, ADR-0263) these nodes are the original's (PathNode, ConvolutionNode,
// ConvChainNode): `path` starts from the nearest reached `from` (the farthest with `longest`) with a generator of its own seeded by one
// `Next()` of the run's, goes down the distances in the original's order of directions, by edges and corners with `edges` and `vertices`,
// draws with the first symbol of `from` when it has no `color`, puts every cell it draws in the list of changes and succeeds whenever a start
// is reached; the `convolution` runs the steps it says (none: until nothing changes), counting one that changes nothing, with the kernels of
// its grid (VonNeumann and Moore on a flat one, VonNeumann and NoCorners on the others), the chance drawn as `Next() < p·(2³¹ − 1)` only if
// `p` is not 1, the listed values summed as many times as they are listed; neither it nor a `convchain` puts what it writes in the list of
// changes (a rule node that has already looked does not see it); a `convchain` without `on` cells counts its first step and sweeps
// afterwards; `d` is ignored. The oracle is the reference (lab/banco/conformita/riferimento.ts, the original line by line): the same grid
// voxel by voxel, the same steps, the same end. The cases of the differences (c1, c3-c7, c9, c11) and the models of mxgmn (StrangeDungeon,
// CarmaTower) are in tests/mj-conformita.test.ts; with the switch off nothing changes (tests/mj-engine-determinism.test.ts, the «oggi» cases).

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXAMPLES, gridHash } from '../lab/banco/conformita/casi';
import { runReference, type Files } from '../lab/banco/conformita/riferimento';
import { OFFICIAL_FILES } from '../lab/mjx/official/index';
import { Mj3Error, run, type Grid3, type Program3 } from '../src/mj/engine';
import { compileMjx, mjxIncludes } from '../src/mj/model';
import { MJX_LIMITS } from '../src/mj/run';

type Vec3 = [number, number, number];
interface Program {
  name: string;
  xml: string;
  size: Vec3;
  steps: number;
  files?: Files;
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

/** Our engine from an empty box with the original's origin, from the original's text, the switch on: its grid, steps and end. */
function ours(p: Program, seed: number) {
  const files = p.files ? mjxIncludes(p.xml, (f) => p.files![f], { original: true }) : undefined;
  const m = compileMjx(p.xml, { size: p.size, original: true, strict: true, semantics: 'mj', ...(files ? { files } : {}) });
  const r = run(m.program as Program3, seed, p.steps, MJX_LIMITS);
  return { text: text(r.grid, m.background), steps: r.steps, finished: r.finished };
}

/** The reference, the original line by line. */
function original(p: Program, seed: number) {
  const r = runReference(p.xml, p.size, seed, p.steps, p.files ?? {});
  return { text: r.text, steps: r.steps, finished: r.finished };
}

const same = (programs: Program[], seeds = SEEDS) => {
  for (const p of programs) for (const seed of seeds) expect(ours(p, seed), `${p.name}, seme ${seed}`).toEqual(original(p, seed));
};

describe('path dell’originale (A1-4)', () => {
  it('per facce, con inertia, ripetuto: dal from più vicino col suo generatore, le direzioni dell’originale, in 3D', () => {
    same([
      {
        name: 'path in 3D, ripetuto da una sequenza',
        xml: '<sequence values="BRGWK" symmetry="()"><one in="B" out="K" steps="60"/><one in="B" out="R" steps="3"/><one in="B" out="G" steps="2"/><path from="R" to="G" on="B" color="W" inertia="True"/></sequence>',
        size: [9, 9, 9],
        steps: 120,
      },
      {
        name: 'path in 2D con longest',
        xml: '<sequence values="BRGWK"><prl in="B" out="K" p="0.25" steps="1"/><one in="B" out="R" steps="5"/><one in="B" out="G" steps="2"/><path from="R" to="G" on="B" color="W" longest="True"/></sequence>',
        size: [24, 24, 1],
        steps: 60,
      },
    ]);
  });

  it('per spigoli e vertici, con inertia e longest: il coseno più vicino col suo rumore, in 2D e in 3D', () => {
    same([
      {
        name: 'path in 3D con edges e vertices',
        xml: '<sequence values="BRGWK"><prl in="B" out="K" p="0.2" steps="1"/><one in="B" out="R" steps="4"/><one in="B" out="G" steps="2"/><path from="R" to="G" on="B" color="W" edges="True" vertices="True" inertia="True" longest="True"/></sequence>',
        size: [10, 10, 10],
        steps: 40,
      },
      {
        name: 'path in 2D con edges, in un ciclo che toglie le partenze collegate',
        xml: '<sequence values="BGRWK" origin="True"><prl in="B" out="K" p="0.2" steps="1"/><one in="B" out="R" steps="8"/><markov><one in="RW" out="GW"/><one in="RG" out="GG"/><one in="R*/*W" out="G*/*W"/><one in="R*/*G" out="G*/*G"/><path from="R" to="G" on="B" color="W" edges="True" inertia="True"/></markov></sequence>',
        size: [30, 30, 1],
        steps: 5000,
      },
      {
        name: 'path in 3D con edges senza inertia',
        xml: '<sequence values="BRGWK"><prl in="B" out="K" p="0.2" steps="1"/><one in="B" out="R" steps="3"/><one in="B" out="G" steps="3"/><path from="R" to="G" on="B" color="W" edges="True"/></sequence>',
        size: [9, 9, 9],
        steps: 30,
      },
    ]);
  });

  it('senza color disegna col primo simbolo di from, e riesce anche senza disegnare niente: in una sequenza non finisce', () => {
    const p: Program = {
      name: 'path senza color',
      xml: '<sequence values="BRAGK"><one in="B" out="K" steps="20"/><one in="B" out="A" steps="2"/><one in="B" out="R" steps="2"/><one in="B" out="G" steps="1"/><path from="AR" to="G" on="B"/></sequence>',
      size: [12, 12, 1],
      steps: 40,
    };
    same([p]);
    for (const seed of SEEDS) expect(ours(p, seed).finished, `seme ${seed}`).toBe(false);
  });

  it('il borgo coi sentieri (lab/banco/conformita/esempi/) è la griglia che il C# ha stampato, sui suoi tre semi', () => {
    const recorded = JSON.parse(fs.readFileSync('lab/banco/conformita/uscite.json', 'utf8')) as { esempi: Record<string, Record<string, { steps: number; finished: boolean; hash: string }>> };
    for (const e of EXAMPLES) {
      const xml = fs.readFileSync(`lab/banco/conformita/esempi/${e.name}.xml`, 'utf8');
      for (const seed of e.seeds) {
        const o = ours({ name: e.name, xml, size: e.size, steps: e.steps }, seed);
        expect({ steps: o.steps, finished: o.finished, hash: gridHash(o.text.trim()) }, `${e.name} ${seed}`).toEqual(recorded.esempi[e.name][String(seed)]);
      }
    }
  });
});

describe('convolution dell’originale (A1-4)', () => {
  it('i vicinati della sua griglia, le monete, i valori contati quante volte sono scritti, i passi che dice', () => {
    same([
      {
        name: 'NoCorners periodica in 3D con le monete, poi VonNeumann coi valori ripetuti',
        xml: '<sequence values="BRG"><prl in="B" out="R" p="0.3" steps="1"/><convolution neighborhood="NoCorners" periodic="True" steps="6"><rule in="B" out="R" values="R" sum="5..18" p="0.7"/><rule in="R" out="G" values="G" sum="0..2"/></convolution><convolution neighborhood="VonNeumann" steps="4"><rule in="G" out="B" values="RR" sum="4,6,8"/><rule in="B" out="G" values="GB" sum="3..4" p="0.5"/></convolution></sequence>',
        size: [10, 10, 10],
        steps: 1000,
      },
      {
        name: 'la caverna: Moore periodica su una griglia piana, finché cambia',
        xml: '<sequence values="DA"><prl in="D" out="A" p="0.45" steps="1"/><convolution neighborhood="Moore" periodic="True"><rule in="D" out="A" values="A" sum="5..8"/><rule in="A" out="D" values="D" sum="6..8"/></convolution></sequence>',
        size: [30, 30, 1],
        steps: 300,
      },
      {
        name: 'VonNeumann su una griglia piana senza bordi che girano, una moneta oltre 1',
        xml: '<sequence values="BRG" origin="True"><convolution neighborhood="VonNeumann" steps="7"><rule in="B" out="R" values="R" sum="1..4" p="0.6"/><rule in="R" out="G" p="1.5"/></convolution></sequence>',
        size: [15, 15, 1],
        steps: 1000,
      },
    ]);
  });

  it('ciò che scrive non va nella lista dei cambi: un nodo che ha già cercato non lo vede, in 2D e in 3D', () => {
    const xml = '<markov values="BRGW" origin="True"><one in="G" out="W"/><one in="RB" out="RR" steps="8"/><convolution neighborhood="VonNeumann" steps="2"><rule in="B" out="G" values="R" sum="1..6"/></convolution></markov>';
    const flat: Program = { name: 'in 2D', xml, size: [11, 11, 1], steps: 1000 };
    same([flat, { name: 'in 3D', xml, size: [7, 7, 7], steps: 1000 }]);
    // The G the convolution writes stay G: the `one` that turns them into W had looked before and does not see them.
    for (const seed of SEEDS) expect(ours(flat, seed).text, `seme ${seed}`).not.toContain('W');
  });

  it('i vicinati che l’originale non carica (Moore in 3D, NoCorners su una griglia piana): con strict un errore, senza una riparazione che tiene i nostri', () => {
    const moore = '<convolution values="BR" neighborhood="Moore"><rule in="B" out="R" values="R" sum="1..26"/></convolution>';
    const corners = '<convolution values="BR" neighborhood="NoCorners"><rule in="B" out="R" values="R" sum="1..8"/></convolution>';
    expect(() => compileMjx(moore, { size: [2, 2, 2], original: true, strict: true, semantics: 'mj' })).toThrow(Mj3Error);
    expect(() => compileMjx(corners, { size: [3, 3, 1], original: true, strict: true, semantics: 'mj' })).toThrow(Mj3Error);
    const mended = compileMjx(moore, { size: [2, 2, 2], original: true, semantics: 'mj' });
    expect(mended.warnings.some((w) => w.includes('Moore'))).toBe(true);
    // Ours: the 26 of the cube, every cell next to the first R.
    const g = run({ ...(mended.program as Program3), origin: 'R' }, 1, 100, MJX_LIMITS).grid;
    expect(Array.from(g.cells).every((c) => g.alphabet[c] === 'R')).toBe(true);
    // With the switch off the original's kernels are not asked for: Moore in 3D is ours, as it always was.
    expect(() => compileMjx(moore, { size: [2, 2, 2], original: true, strict: true })).not.toThrow();
  });
});

describe('convchain dell’originale (A1-4)', () => {
  it('ChainDungeon e ChainDungeonMaze (path, convchain e le regole dopo) come l’originale, sui campioni del repository', () => {
    same(
      ['ChainDungeon', 'ChainDungeonMaze'].map((name) => ({ name, xml: fs.readFileSync(`lab/mjx/official/${name}.xml`, 'utf8'), size: [60, 60, 1] as Vec3, steps: 50_000, files: OFFICIAL_FILES })),
      [1, 2, 3],
    );
  });

  it('ciò che dipinge non va nella lista dei cambi: un nodo che ha già cercato non lo vede', () => {
    const p: Program = {
      name: 'convchain dopo una one che ha cercato',
      xml: '<markov values="BDAC"><one in="AD/DA" out="AD/AA"/><convchain sample="Room" on="B" black="D" white="A" steps="3"/></markov>',
      size: [16, 16, 1],
      steps: 1000,
      files: OFFICIAL_FILES,
    };
    same([p]);
  });

  it('senza celle on il primo passo conta e i passi dopo spazzano una griglia senza niente da cambiare, tirando i numeri', () => {
    same([
      {
        name: 'convchain senza celle on, in un ciclo',
        xml: '<markov values="BDAC"><convchain sample="Room" on="C" black="D" white="A" steps="4"/><one in="B" out="C" steps="3"/></markov>',
        size: [12, 12, 1],
        steps: 1000,
        files: OFFICIAL_FILES,
      },
    ]);
  });

  it('su una griglia di più strati (nostra, ADR-0240) con l’interruttore acceso: con strict un errore, senza una riparazione', () => {
    const xml = '<sequence values="BDA"><convchain sample="Room" on="B" black="D" white="A" steps="3"/></sequence>';
    const files = mjxIncludes(xml, (f) => OFFICIAL_FILES[f], { original: true });
    expect(() => compileMjx(xml, { size: [8, 8, 2], files, original: true, strict: true, semantics: 'mj' })).toThrow(Mj3Error);
    expect(compileMjx(xml, { size: [8, 8, 2], files, original: true, semantics: 'mj' }).warnings.some((w) => w.includes('convchain'))).toBe(true);
  });
});

describe('d ignorato (A1-4)', () => {
  it('un nodo e una regola con d="2" girano anche in 3D, come nell’originale', () => {
    same([
      {
        name: 'd sui nodi e sulle regole',
        xml: '<sequence values="BRGW" origin="True"><one in="RB" out="RR" steps="6" d="2"/><prl d="3"><rule in="RB" out="RG" d="2"/><rule in="GB" out="GW"/></prl></sequence>',
        size: [7, 7, 7],
        steps: 1000,
      },
    ]);
  });
});
