// The grid in pieces (T339, ADR-0178): a program decides on a plan what the whole model must agree on, a map brings it to the
// voxels, and `<pieces>` runs the detail one piece at a time. What must hold: the parts fit at the borders, the run is the same at
// every seed, a piece has its own time, and nothing of a piece goes where it may not.

import { describe, expect, it } from 'vitest';
import { hasPieces, run, type GridLimits, type Grid3, type RunResult } from '../src/mj/engine';
import { compileMjx } from '../src/mj/model';
import { FORM_LIMITS, FORM_PIECES } from '../src/mj/run';
import { FormCache, Forms, InlineRunner } from '../src/kernel/forms';

const LIMITS: GridLimits = { ...FORM_LIMITS, pieces: FORM_PIECES };

/**
 * A plan on a coarse grid (a cell is 6 voxels): walls across the lot, buildings anywhere (so across the borders of the pieces), a stair
 * seed, a path from the centre to the edge; mapped up by 6, then a detail in pieces (or the same nodes on the whole grid).
 */
function program(detail: string, pieces: string | undefined): string {
  return `<sequence values="BNE" symmetry="(xy)" ground="E" origin="bottom">
  <map scale="1/6 1/6 1/6" values="BENzWRxHS">
    <rule in="E" out="E"/>
    <rule in="N" out="N"/>
    <prl in="***/*E*/***" out="***/*z*/***"/>
    <one in="E/z" out="*/W" steps="2" symmetry="()"/>
    <all in="W/z" out="*/W" symmetry="()"/>
    <path from="N" to="E" on="z" color="R"/>
    <one in="zzzzzz" out="*S****" steps="2" symmetry="()"/>
    <one steps="3">
      <rule in="zzzzzzz/zzzzzzz/zzzzzzz/zzzzzzz/zzzzzzz" out="*******/*HHHHH*/*HHHHH*/*HHHHH*/*******"/>
      <rule in="zzzzzzzz/zzzzzzzz/zzzzzzzz/zzzzzzzz/zzzzzzzz/zzzzzzzz" out="********/*HHHHHH*/*HHHHHH*/*HHHHHH*/*HHHHHH*/********"/>
    </one>
    <map scale="6 6 6" values="BgwrUxhSTqoesV">
      <rule in="z" out="gggggg/gggggg/gggggg/gggggg/gggggg/gggggg"/>
      <rule in="E" out="gggggg/gggggg/gggggg/gggggg/gggggg/gggggg"/>
      <rule in="N" out="rrrrrr/rrrrrr/rrrrrr/rrrrrr/rrrrrr/rrrrrr"/>
      <rule in="R" out="rrrrrr/rrrrrr/rrrrrr/rrrrrr/rrrrrr/rrrrrr"/>
      <rule in="W" out="gggggg/gggggg/ggwwgg/ggwwgg/gggggg/gggggg"/>
      <rule in="W/W" out="gggggg/gggggg/ggwwgg/ggwwgg/ggwwgg/ggwwgg/ggwwgg/ggwwgg/ggwwgg/ggwwgg/gggggg/gggggg" symmetry="()"/>
      <rule in="H" out="hhhhhh/hhhhhh/hhhhhh/hhhhhh/hhhhhh/hhhhhh"/>
      <rule in="S" out="gggggg/gggggg/gggggg/gggSgg/gggggg/gggggg"/>
      ${pieces === undefined ? `<sequence>${detail}</sequence>` : `<pieces ${pieces}>${detail}</pieces>`}
    </map>
  </map>
  <color symbol="g" value="7da35a"/><color symbol="w" value="8a8a86"/><color symbol="r" value="c2ad84"/><color symbol="U" value="5a5a56"/>
  <color symbol="x" value="9a9a94"/><color symbol="s" value="9a8c74"/><color symbol="o" value="b0aca2"/><color symbol="q" value="6b4a2e"/>
  <color symbol="h" value="e8dcc0"/><color symbol="S" value="a5482e"/><color symbol="T" value="b9a77f"/><color symbol="e" value="7d766c"/>
  <color symbol="V" value="d4b45a"/>
</sequence>`;
}

/**
 * Only rules that give the same grid in any order, looking far: walls and buildings up, a hip roof on the buildings (a voxel in from
 * every side at every layer, so the top of a roof depends on cells up to half the building away), a stair that climbs one voxel a step
 * writing three cells (the tread, what holds it, the next head), thirty steps long.
 */
const DETERMINISTIC = `
  <all steps="9"><rule in="B w" out="w *"/><rule in="B h" out="h *"/></all>
  <all in="B h" out="x *"/>
  <all in="B x" out="x *" steps="20"/>
  <all in="*/x B/*" out="*/B */*"/>
  <all in="B S" out="S T" steps="1"/>
  <all in="*B SB" out="*S Tq" steps="30" symmetry="()"/>`;

/** With chance in it: stones on the path, battlements packed at random on the walls, a mark somewhere in every piece. */
const RANDOM = `
  <all in="B w" out="w *" steps="9"/>
  <prl in="r" out="s" p="0.2" steps="1"/>
  <all in="B w" out="o *" steps="1"/>
  <all in="ooo" out="B**"/>
  <one in="B g" out="V *" steps="1"/>`;

const run1 = (xml: string, seed: number, size: [number, number, number] = [96, 96, 24]): RunResult => run(compileMjx(xml, { size }).program, seed, 2_000_000, LIMITS, { deadline: 60_000 });

const diff = (a: Grid3, b: Grid3) => {
  let n = 0;
  for (let i = 0; i < a.cells.length; i++) if (a.alphabet[a.cells[i]] !== b.alphabet[b.cells[i]]) n++;
  return n;
};

describe('la griglia a pezzi (T339)', () => {
  it('il compilatore la riconosce e rifiuta ciò che non ci sta dentro', () => {
    const ok = compileMjx(program(DETERMINISTIC, 'piece="24 32" margin="6" halo="written" edge="grow" time="500"'), { size: [96, 96, 24] });
    expect(hasPieces(ok.program.program)).toBe(true);
    const bad = (inner: string, attrs = 'piece="24"') => () => compileMjx(program(inner, attrs), { size: [96, 96, 24] });
    expect(bad('<map scale="2 2 2" values="Bg"><rule in="g" out="gg/gg gg/gg"/></map>')).toThrow(/dentro pieces: <map>/);
    expect(bad('<box at="5 5 0" size="3 3 3" color="w"/>')).toThrow(/coordinate della griglia intera/);
    expect(bad('<pieces piece="8"><all in="B w" out="w *"/></pieces>')).toThrow(/pieces non va dentro un altro pieces/);
    expect(bad('<one in="g" out="w"><observe value="g" to="w"/></one>')).toThrow(/observe e search/);
    expect(bad('<all in="B w" out="w *"/>', 'piece="0 8"')).toThrow(/piece vuole uno o due interi/);
    expect(bad('<all in="B w" out="w *"/>', 'piece="8" halo="dopo"')).toThrow(/halo è before/);
    expect(bad('<all in="B w" out="w *"/>', 'piece="8" margin="99"')).toThrow(/margin/);
    expect(() => compileMjx(`<sequence values="Bw" size="8 8 8"><all in="B w" out="w *"/><action name="open"><pieces piece="4"><all in="w" out="B"/></pieces></action></sequence>`)).toThrow(/pieces va nel programma/);
  });

  it('con regole che non dipendono dall\'ordine, i pezzi danno la griglia intera voxel per voxel, a ogni seme', () => {
    for (const seed of [1, 2, 3, 4]) {
      const whole = run1(program(DETERMINISTIC, undefined), seed);
      expect(whole.finished).toBe(true);
      for (const attrs of ['piece="32" margin="32"', 'piece="24 40" margin="32" halo="before" edge="grow"', 'piece="17" margin="32"']) {
        const pieced = run1(program(DETERMINISTIC, attrs), seed);
        expect(pieced.finished, attrs).toBe(true);
        expect(diff(pieced.grid, whole.grid), `seme ${seed}, ${attrs}`).toBe(0);
      }
    }
  });

  it('la seconda via, i pezzi che leggono ciò che hanno scritto quelli prima, spezza una scala che passa nel pezzo dopo', () => {
    // The piece before ends the stair in its margin, which it throws away; the piece after reads it finished, without its head.
    let broken = 0;
    for (const seed of [1, 2, 3, 4]) broken += diff(run1(program(DETERMINISTIC, 'piece="24 40" margin="32" halo="written"'), seed).grid, run1(program(DETERMINISTIC, undefined), seed).grid);
    expect(broken).toBeGreaterThan(0);
  });

  it('con il margine fermo il tetto e le scale si spezzano ai bordi: per questo il margine cresce', () => {
    let broken = 0;
    for (const seed of [1, 2, 3]) {
      const whole = run1(program(DETERMINISTIC, undefined), seed);
      broken += diff(run1(program(DETERMINISTIC, 'piece="32" margin="32" edge="frozen"'), seed).grid, whole.grid);
    }
    expect(broken).toBeGreaterThan(0);
  });

  it('con un margine più corto di ciò che le regole guardano, i bordi si vedono; abbastanza largo, no', () => {
    const seed = 2;
    const whole = run1(program(DETERMINISTIC, undefined), seed);
    expect(diff(run1(program(DETERMINISTIC, 'piece="32" margin="2" edge="grow"'), seed).grid, whole.grid)).toBeGreaterThan(0);
    expect(diff(run1(program(DETERMINISTIC, 'piece="32" margin="32" edge="grow"'), seed).grid, whole.grid)).toBe(0);
  });

  it('con il caso dentro, le parti combaciano: i muri sono interi e il sentiero continuo a ogni seme', () => {
    for (const halo of ['before', 'written'])
      for (const seed of [1, 2, 3, 4, 5]) {
        const r = run1(program(RANDOM, `piece="30" margin="8" halo="${halo}" edge="grow"`), seed);
        expect(r.finished).toBe(true);
        const g = r.grid;
        const at = (x: number, y: number, z: number) => g.alphabet[g.cells[x + y * g.X + z * g.X * g.Y]];
        // Every wall column of the plan stands ten voxels: none cut where two pieces meet.
        let columns = 0;
        for (let y = 0; y < g.Y; y++)
          for (let x = 0; x < g.X; x++) {
            if (at(x, y, 0) !== 'w') continue;
            columns++;
            for (let z = 1; z <= 9; z++) expect(at(x, y, z), `seme ${seed} ${halo}: colonna ${x},${y} a ${z}`).toBe('w');
          }
        expect(columns).toBeGreaterThan(0);
        // The path at the ground (gravel or stones) is one piece, 4-connected, from the centre.
        const path = (x: number, y: number) => x >= 0 && y >= 0 && x < g.X && y < g.Y && (at(x, y, 0) === 'r' || at(x, y, 0) === 's');
        const seen = new Set<number>();
        const stack = [[g.X >> 1, g.Y >> 1]];
        expect(path(g.X >> 1, g.Y >> 1)).toBe(true);
        while (stack.length) {
          const [x, y] = stack.pop()!;
          if (!path(x, y) || seen.has(x + y * g.X)) continue;
          seen.add(x + y * g.X);
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        let all = 0;
        for (let y = 0; y < g.Y; y++) for (let x = 0; x < g.X; x++) if (path(x, y)) all++;
        expect(seen.size, `seme ${seed} ${halo}: sentiero spezzato`).toBe(all);
      }
  });

  it('è deterministica dal seme, e un seme diverso dà un altro modello', () => {
    for (const halo of ['before', 'written']) {
      const xml = program(RANDOM, `piece="30" margin="8" halo="${halo}" edge="grow"`);
      const a = run1(xml, 7), b = run1(xml, 7), c = run1(xml, 8);
      expect(diff(a.grid, b.grid)).toBe(0);
      expect(diff(a.grid, c.grid)).toBeGreaterThan(0);
    }
  });

  it('one sceglie nel suo pezzo: un passo per pezzo, ognuno dentro il suo', () => {
    const r = run1(program('<one in="B g" out="V *" steps="1"/>', 'piece="32" margin="8" edge="grow"'), 3);
    const g = r.grid;
    const marks: Array<[number, number]> = [];
    for (let i = 0; i < g.cells.length; i++) if (g.alphabet[g.cells[i]] === 'V') marks.push([i % g.X, Math.floor(i / g.X) % g.Y]);
    // 96 / 32 = 3 x 3 pieces, one mark each.
    expect(marks.length).toBe(9);
    const cells = new Set(marks.map(([x, y]) => `${Math.floor(x / 32)},${Math.floor(y / 32)}`));
    expect(cells.size).toBe(9);
    expect(r.pieces?.length).toBe(9);
  });

  it('un pezzo che non finisce si ferma al suo tempo, gli altri girano, e la corsa non è finita', () => {
    // A rule that never stops (a cell that flips forever) only in the piece at the centre: the others end at once.
    const endless = `<all in="B r" out="* U"/><all><rule in="U" out="o"/><rule in="o" out="U"/></all>`;
    const xml = program(endless, 'piece="32" margin="0" time="300"');
    const t0 = Date.now();
    const r = run(compileMjx(xml, { size: [96, 96, 24] }).program, 1, 50_000_000, LIMITS, { deadline: 60_000 });
    const ms = Date.now() - t0;
    expect(r.finished).toBe(false);
    expect(r.pieces?.length).toBe(9);
    const late = r.pieces!.filter((p) => !p.finished);
    expect(late.length).toBeGreaterThan(0);
    for (const p of late) expect(p.ms).toBeLessThan(1_500);
    expect(ms).toBeLessThan(9 * 1_500);
  });

  it('il tempo dei pezzi non è quello del modello quando chi lo fa girare dà loro il loro', () => {
    const slow = `<all in="B r" out="* U"/><all steps="4000"><rule in="U" out="o"/><rule in="o" out="U"/></all>`;
    const xml = program(slow, 'piece="96" margin="0" time="3000"');
    const m = compileMjx(xml, { size: [96, 96, 24] });
    // A deadline shorter than the piece: with the pieces' own time the model finishes, without it the run's deadline stops it.
    const own = run(m.program, 1, 50_000_000, LIMITS, { deadline: 30 });
    const shared = run(m.program, 1, 50_000_000, FORM_LIMITS, { deadline: 30 });
    expect(own.finished).toBe(true);
    expect(shared.finished).toBe(false);
  });

  it('con halo="written" un pezzo non tocca ciò che hanno scritto i pezzi prima di lui', () => {
    // Every piece paints its own cells and, if it could, the margin: a cell painted twice would show the second piece's mark.
    const r = run1(program('<all in="g" out="s"/><one in="s" out="o" steps="1"/>', 'piece="24" margin="6" halo="written" edge="grow"'), 4);
    const g = r.grid;
    let marks = 0;
    for (let i = 0; i < g.cells.length; i++) if (g.alphabet[g.cells[i]] === 'o') marks++;
    expect(marks).toBe(16);
  });

  it("nel gioco una forma a pezzi può essere più grande di FORM_LIMITS, con l'impronta; la stessa a griglia intera no", async () => {
    // 320 × 320 × 80 is 8.2 million cells: past FORM_LIMITS (8 million), within FORM_PIECES (32 million).
    const box = (inner: string) => `<sequence values="BGw" size="320 320 80" ground="G">${inner}<color symbol="G" value="7da35a"/><color symbol="w" value="8a8a86"/></sequence>`;
    const forms = new Forms(new InlineRunner(new FormCache()));
    forms.load({
      'models/grande.xml': box('<pieces piece="160" margin="0"><all in="B G" out="w *" steps="1"/><all in="B w" out="w *" steps="6"/></pieces>'),
      'models/intera.xml': box('<all in="B G" out="w *" steps="1"/><all in="B w" out="w *" steps="6"/>'),
      'models/index.json': JSON.stringify({ grande: { class: 'structure', vpt: 10 }, intera: { class: 'structure', vpt: 10 } }),
    });
    const big = await forms.settled('grande', 1);
    expect(big?.status, big?.error).toBe('ready');
    expect([big!.result!.grid.X, big!.result!.grid.Y, big!.result!.grid.Z]).toEqual([320, 320, 80]);
    // A block seven voxels high everywhere: the whole footprint blocks (between a step, 2, and a head, 7, at 10 voxels a tile).
    expect(big!.foot!.every((v) => v === 1)).toBe(true);
    const whole = await forms.settled('intera', 1);
    expect(whole?.status).toBe('failed');
    expect(whole?.error).toMatch(/troppo grande/);
  });
});
