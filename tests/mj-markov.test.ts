// `<markov>` and `<sequence>` as our engine runs them (T469, S3 of T458 § 5.1), fixed voxel by voxel: a program that uses them must not
// change under its feet (ADR-0142). `MarkovRunner.go`: at every step the first child that finds something works, and when the LAST child
// works all the children start again (their steps counted anew, a sequence from its first child); it ends when no child finds anything.
// `SequenceRunner.go`: its current child as long as it can, then the next. So `<markov><sequence>…</sequence></markov>` is a loop whose body
// starts again from its first child at every step: one step a turn, of the first child that finds something (MarkovJunior of mxgmn runs a
// sequence inside a markov to its end first: here it does not). A sequence that is not the last child of a markov keeps its place across
// the steps, until the last child works. The two idioms of the author's fort (`lab/mjx/models/handmade/forte-handmade.xml`, read but never
// written here: its keep that grows until a mark stops it, its storeys at a coin) are copied as small programs and fixed by fingerprint.

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { run, runOn, type Grid3 } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';

const AIR = '.';
const hash = (g: Grid3) => createHash('sha1').update(`${g.X}x${g.Y}x${g.Z}|${g.alphabet.join('')}|`).update(g.cells).digest('hex').slice(0, 16);
/** The letters of a grid, a layer after the other from the bottom, rows from the back (`bg` for the empty cell). */
const text = (g: Grid3, bg = 'B') => Array.from(g.cells, (c) => (c === 0 ? bg : g.alphabet[c])).join('');
/** A flat grid from its rows (from the back to the front), the empty cell `B`. */
function gridOf(rows: string[]): Grid3 {
  const Y = rows.length, X = rows[0].length;
  const alphabet = [AIR];
  const cells = new Uint8Array(X * Y);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'B') return;
      let i = alphabet.indexOf(ch);
      if (i < 0) i = alphabet.push(ch) - 1;
      cells[x + y * X] = i;
    }),
  );
  return { X, Y, Z: 1, cells, alphabet, log: [], epoch: 0 };
}
const program = (xml: string, size: [number, number, number]) => compileMjx(xml, { size }).program;

describe('<markov> e <sequence> nel nostro motore (T469)', () => {
  it('il corpo di un ciclo riparte dal suo primo figlio a ogni passo: chi viene prima cresce finché può', () => {
    // R grows to the right, G to the left, one cell a step each. In the loop the first child works at every turn while it finds
    // something: R reaches G and only then does G try. (In MarkovJunior of mxgmn the sequence would run to its end, one step of R and
    // one of G, and they would meet in the middle.)
    const loop = '<markov><sequence><one in="RB" out="*R" steps="1"/><one in="BG" out="G*" steps="1"/></sequence></markov>';
    const p = program(`<sequence values="BRG" symmetry="()">${loop}</sequence>`, [12, 1, 1]);
    const r = runOn(gridOf(['RBBBBBBBBBBG']), p, 1);
    expect(text(r.grid)).toBe('RRRRRRRRRRRG');
    expect(r.steps).toBe(10);
    // The steps of a node inside the loop are counted again at every turn: the same `steps="1"` outside a loop grows one cell.
    const once = program('<sequence values="BRG" symmetry="()"><one in="RB" out="*R" steps="1"/><one in="BG" out="G*" steps="1"/></sequence>', [12, 1, 1]);
    expect(text(runOn(gridOf(['RBBBBBBBBBBG']), once, 1).grid)).toBe('RRBBBBBBBBGG');
  });

  it('i figli di un markov: il primo che trova qualcosa, e solo l’ultimo fa ripartire tutti', () => {
    // Without the sequence: R works while it can (its steps="2" are not counted again, R is not the last child), then G, the last, which
    // makes R start again: two of R, one of G, two of R, one of G…
    const p = program('<sequence values="BRG" symmetry="()"><markov><one in="RB" out="*R" steps="2"/><one in="BG" out="G*" steps="1"/></markov></sequence>', [12, 1, 1]);
    expect(text(runOn(gridOf(['RBBBBBBBBBBG']), p, 1).grid)).toBe('RRRRRRRRGGGG');
    // A sequence that is not the last child keeps its place across the steps: it runs through, child after child (R twice, then G once:
    // not R until it touches G, as when the sequence is the last child, above), and the children after it work when it is done; the last
    // one (W grows by one, until the wall X) starts all again.
    const q = program(
      '<sequence values="BRGWX" symmetry="()"><markov><sequence><one in="RB" out="*R" steps="2"/><one in="BG" out="G*" steps="1"/></sequence><one in="WB" out="*W" steps="1"/></markov></sequence>',
      [12, 2, 1],
    );
    const r = runOn(gridOf(['RBBBBBBBBBBG', 'WBBBXXXXXXXX']), q, 1);
    expect(text(r.grid)).toBe('RRRRRRRRGGGG' + 'WWWWXXXXXXXX');
    // Three turns started again (W from 1 to 3 cells more), the fourth finds nothing: 3 × (2 + 1 + 1) steps, and the last R.
    expect(r.steps).toBe(13);
  });

  it('il mastio del forte cresce un anello a giro finché la strada o il segno raro non lo ferma (voxel per voxel)', () => {
    // Lines 85-103 of forte-handmade.xml, on a courtyard x of 30 × 30 with the road v from the gate (the front edge) to the centre: the
    // keep K as far from the road as the yard allows, a square around it, then the loop: the exit first (a k becomes the mark z, rarely),
    // what spreads the mark next (while it spreads, nothing grows), the growth last (a ring a turn; touching the road it marks itself).
    const keep = (p: string, first: number) => `<sequence values="BxvkzK" symmetry="(xy)">
      <one in="x" out="K" steps="1"><field for="K" from="v" on="xv"/></one>
      <all steps="${first}">
        <rule in="[Kk]x" out="*k"/>
        <rule in="[Kk]*/*x" out="**/*k"/>
      </all>
      <markov>
        <sequence>
          <prl p="${p}" in="k" out="z"/>
          <prl in="kz" out="zz" steps="100"/>
          <all steps="1">
            <rule in="[Kk]x" out="*k"/>
            <rule in="[Kk]*/*x" out="**/*k"/>
            <rule in="vk" out="vz"/>
          </all>
        </sequence>
      </markov>
      <prl in="z" out="k"/>
    </sequence>`;
    const yard = Array.from({ length: 30 }, (_, y) => Array.from({ length: 30 }, (_, x) => (y === 29 || (x >= 14 && x <= 15 && y >= 15) ? 'v' : 'x')).join(''));
    /** The side of the keep (its first row from the corner) and the fingerprint of the grid, for four seeds. */
    const runs = (xml: string) =>
      [1, 2, 3, 4].map((seed) => {
        const r = runOn(gridOf(yard), program(xml, [30, 30, 1]), seed);
        expect(r.finished).toBe(true);
        const t = text(r.grid);
        // The mark is gone (turned back into keep), the road is as it was.
        expect(t).not.toContain('z');
        expect([...t].filter((c) => c === 'v').length).toBe(30 + 2 * 14);
        return `${/^[Kk]*/.exec(t)![0].length}:${hash(r.grid)}`;
      });
    // As the author wrote it: the mark is so rare that on this yard the keep always reaches the road (16 × 16 from the far corner).
    expect(runs(keep('0.00005', 9))).toEqual(KEEP_PRINTS.author);
    // A likelier mark on a smaller first square: the size is the seeds' (the chance and p decide it, not a number of steps).
    const likelier = runs(keep('0.003', 4));
    expect(likelier).toEqual(KEEP_PRINTS.likelier);
    expect(new Set(likelier.map((s) => s.split(':')[0])).size).toBeGreaterThan(1);
  });

  it('i piani a moneta: la sequenza fa un piano, testa il ciclo finisce, croce l’ultimo figlio ne fa un altro (voxel per voxel)', () => {
    // The shape of lines 194-257 of forte-handmade.xml: the mark #6 opens a storey, the sequence (not the last child) builds it and
    // turns the mark into #7; the coin `<prl p="0.5" in="#7" out="#6"/>`, heads, turns it back and nothing else can work: the loop ends;
    // tails, the last child turns it back and starts all again: one storey more. Here a storey is a tower of 4 layers, its slab on top.
    const xml = `<sequence values="BtwFMN" symmetry="()" ground="t">
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
    const p = program(xml, [2, 2, 64]);
    const storeys = (g: Grid3) => [...text(g)].filter((c) => c === 'F').length / 3;
    const counts = new Map<number, number>();
    const prints: string[] = [];
    for (let seed = 1; seed <= 400; seed++) {
      const r = run(p, seed);
      expect(r.finished).toBe(true);
      const n = storeys(r.grid);
      expect(Number.isInteger(n) && n >= 1).toBe(true);
      counts.set(n, (counts.get(n) ?? 0) + 1);
      if (seed <= 4) prints.push(`${n}:${hash(r.grid)}`);
    }
    // One storey, two, three…, each half as likely as the one before: about 200, 100, 50 of 400.
    expect(counts.get(1)!).toBeGreaterThan(160);
    expect(counts.get(1)!).toBeLessThan(240);
    expect(counts.get(2)!).toBeGreaterThan(70);
    expect(counts.get(2)!).toBeLessThan(130);
    expect(counts.get(3)!).toBeGreaterThan(28);
    expect(counts.get(3)!).toBeLessThan(75);
    expect(prints).toEqual(STOREY_PRINTS);
  });
});

/** The side and the fingerprint of the keep at seeds 1-4, taken with the engine of kernel 0.10.16 (T469). */
const KEEP_PRINTS: { author: string[]; likelier: string[] } = {
  author: ['16:8c01dde576ca8f4d', '16:8c01dde576ca8f4d', '16:8c01dde576ca8f4d', '16:8c01dde576ca8f4d'],
  likelier: ['5:6ccbd7112121afb9', '6:0172c4c23870000b', '7:51a54ec18f44d84b', '10:0ca1a57ae3559b4c'],
};
/** The storeys and the fingerprints of the tower at seeds 1-4, taken with the engine of kernel 0.10.16 (T469). */
const STOREY_PRINTS: string[] = ['2:5f21f20b48056cb6', '1:dbfcf35a2292a1be', '2:5f21f20b48056cb6', '3:3b9e563c1de9f549'];
