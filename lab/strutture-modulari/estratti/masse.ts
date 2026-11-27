// The massings of T557 (docs/design/strutture-modulari.md § 12): a MarkovJunior program each, part of the model (the author's correction 4:
// the seed changes the layout too), run by the game's engine on a grid of bays (a cell a bay, a layer a storey) that the kernel prepares
// with what the world says: the streets of the gates and the ring around the lot. Its letters are those the set's bays stand on:
//
//   @ air · S the ground outside (a street, a yard) · H a bay of a building on the ground · B one above · R the roof over the top storey
//
// `neapolis`: palazzine on their own, rectangles of 2 × 2 to 4 × 4 bays (the source is 3 × 3), never touching (a yard or a street between
// them), of one to three storeys (the source has two: the third climbs on a stair of the stitching).
// `mesa` (a Far West town, the author: «no huge buildings: taverns, bars, inns, three storeys at most»): small buildings (2 × 2 and 3 × 2
// bays, what the inn's bricks put together most often) that face the main street with their front, a gap between them, some lots left empty,
// one or two storeys and now and then three; a few set back.
// Every building takes its height from one seed of its own (one cell, then the whole footprint), as T543's massing did.

import { compileMjx } from '../../../src/mj/model';
import { runOn, type Grid3 } from '../../../src/mj/engine';
import { hash32 } from '../../../src/kernel/rng';

/** What the kernel prepares: a lot of one place (5 × 5 bays), or the lot of a block of places (13 × 13 bays, within today's 500 voxels). */
export type Ground = 'lotto' | 'blocco';

export interface MassingSpec {
  name: string;
  /** Storeys the grid has: the tallest building and its roof. */
  storeys: number;
  /** The program, with `@` for the air (the kernel's background letter goes there). */
  xml: string;
  /** The streets of a block: a cross (the gates of four places), or one main street along x. */
  streets: 'cross' | 'main';
}

export const NEAPOLIS: MassingSpec = {
  name: 'palazzine',
  storeys: 4,
  streets: 'cross',
  xml: `<sequence values="@SUOYhabcHBR" symmetry="(xy)">
  <union symbol="~" values="SOUY"/>
  <!-- the footprints: rectangles of 2-4 × 2-4 bays of free ground, one at a time at random, with a margin of ground all around; the margin
       of a footprint is a yard at once, so that the next one does not touch it -->
  <markov>
    <all>
      <rule in="hU" out="*Y"/>
      <rule in="h*/*U" out="**/*Y"/>
    </all>
    <one>
      <rule in="~~~~~~/~UUUU~/~UUUU~/~UUUU~/~UUUU~/~~~~~~" out="******/*hhhh*/*hhhh*/*hhhh*/*hhhh*/******" p="0.5"/>
      <rule in="~~~~~~/~UUUU~/~UUUU~/~UUUU~/~~~~~~" out="******/*hhhh*/*hhhh*/*hhhh*/******" p="1"/>
      <rule in="~~~~~/~UUU~/~UUU~/~UUU~/~~~~~" out="*****/*hhh*/*hhh*/*hhh*/*****" p="1.2"/>
      <rule in="~~~~~/~UUU~/~UUU~/~~~~~" out="*****/*hhh*/*hhh*/*****" p="0.8"/>
      <rule in="~~~~/~UU~/~UU~/~~~~" out="****/*hh*/*hh*/****" p="0.4"/>
    </one>
  </markov>
  <!-- the height of every palazzo: one cell of it at random, then the whole footprint -->
  <markov>
    <all>
      <rule in="ah" out="aa"/>
      <rule in="bh" out="bb"/>
      <rule in="ch" out="cc"/>
    </all>
    <one>
      <rule in="h" out="a" p="0.25"/>
      <rule in="h" out="b" p="0.5"/>
      <rule in="h" out="c" p="0.25"/>
    </one>
  </markov>
  <!-- up: the storeys and the roof over them -->
  <prl>
    <rule in="@ a" out="R H"/>
    <rule in="@ @ b" out="R B H"/>
    <rule in="@ @ @ c" out="R B B H"/>
  </prl>
  <prl>
    <rule in="U" out="S"/>
    <rule in="O" out="S"/>
    <rule in="Y" out="S"/>
  </prl>
</sequence>`,
};

export const MESA: MassingSpec = {
  name: 'taverne',
  storeys: 4,
  streets: 'main',
  xml: `<sequence values="@SUOYhzabcHBR" symmetry="(xy)">
  <union symbol="~" values="SOUY"/>
  <!-- the front on the main street: small footprints whose front row touches the street, one at a time at random, a yard around them at
       once (so they never touch); then, fewer, some set back -->
  <markov>
    <all>
      <rule in="hU" out="*Y"/>
      <rule in="h*/*U" out="**/*Y"/>
    </all>
    <one>
      <rule in="SSSSS/~UUU~/~UUU~/~~~~~" out="*****/*hhh*/*hhh*/*****" p="1"/>
      <rule in="SSSS/~UU~/~UU~/~~~~" out="****/*hh*/*hh*/****" p="1"/>
    </one>
  </markov>
  <markov>
    <all>
      <rule in="hU" out="*Y"/>
      <rule in="h*/*U" out="**/*Y"/>
    </all>
    <one>
      <rule in="~~~~/~UU~/~UU~/~~~~" out="****/*hh*/*hh*/****" p="1"/>
    </one>
  </markov>
  <!-- the height of every building: none (the lot stays empty), one, two, three storeys -->
  <markov>
    <all>
      <rule in="zh" out="zz"/>
      <rule in="ah" out="aa"/>
      <rule in="bh" out="bb"/>
      <rule in="ch" out="cc"/>
    </all>
    <one>
      <rule in="h" out="z" p="0.3"/>
      <rule in="h" out="a" p="0.35"/>
      <rule in="h" out="b" p="0.25"/>
      <rule in="h" out="c" p="0.1"/>
    </one>
  </markov>
  <prl>
    <rule in="@ a" out="R H"/>
    <rule in="@ @ b" out="R B H"/>
    <rule in="@ @ @ c" out="R B B H"/>
  </prl>
  <prl>
    <rule in="U" out="S"/>
    <rule in="O" out="S"/>
    <rule in="Y" out="S"/>
    <rule in="z" out="S"/>
  </prl>
</sequence>`,
};

/** The roles of the massing's output, as the bays of a set stand on them. */
export const OUT = '@SHBR';

/**
 * The grid the massing starts from, a cell a bay and a layer a storey: `lotto` the lot of one place (5 × 5 bays, its ring: 7 × 7, 224
 * voxels); `blocco` the lot of a block of places within today's 500 voxels (13 × 13 bays and a ring: 15 × 15, 480 voxels), with the
 * streets the spec says. `S` a street, `O` the ring, `U` free ground; the layers above are air.
 */
export function prepared(spec: MassingSpec, kind: Ground): Grid3 {
  const inner = kind === 'blocco' ? 13 : 5;
  const X = inner + 2, Y = X, Z = spec.storeys;
  const alphabet = ['.', 'S', 'U', 'O'];
  const cells = new Uint8Array(X * Y * Z);
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      const ring = x === 0 || y === 0 || x === X - 1 || y === Y - 1;
      const bx = x - 1, by = y - 1;
      const street = kind === 'blocco' && (spec.streets === 'cross' ? bx === 6 || by === 6 : by === 6);
      cells[x + y * X] = ring ? 3 : street ? 1 : 2;
    }
  return { X, Y, Z, cells, alphabet, log: [], epoch: 0 };
}

/** The massing program as text for a background letter (the air of the program it goes in). */
export const massingXml = (spec: MassingSpec, air: string) => spec.xml.replaceAll('@', air);

const compiled = new Map<string, ReturnType<typeof compileMjx>>();

/** The massing alone (for the measures of its variance): the grid it writes from a seed, its letters as `OUT` names them. */
export function massing(spec: MassingSpec, kind: Ground, seed: number): { grid: Grid3; ms: number; letter: (x: number, y: number, z: number) => string } {
  const grid = prepared(spec, kind);
  const key = `${spec.name}|${grid.X},${grid.Y},${grid.Z}`;
  if (!compiled.has(key)) compiled.set(key, compileMjx(massingXml(spec, 'A'), { size: [grid.X, grid.Y, grid.Z] }));
  const t0 = performance.now();
  const r = runOn(grid, compiled.get(key)!.program, hash32(seed, 4321), 2_000_000, { side: 1024, cells: 64_000_000 }, { deadline: 20_000 });
  if (!r.finished) throw new Error(`la massa non finisce (${r.steps} passi)`);
  const ms = performance.now() - t0;
  const letter = (x: number, y: number, z: number) => {
    if (x < 0 || y < 0 || x >= grid.X || y >= grid.Y || z < 0 || z >= grid.Z) return z === 0 ? 'S' : '@';
    const ch = grid.alphabet[grid.cells[x + y * grid.X + z * grid.X * grid.Y]];
    return ch === '.' ? '@' : ch;
  };
  return { grid, ms, letter };
}

/** The massing as text, one storey after the other (for the report). */
export function massingText(m: { grid: Grid3; letter: (x: number, y: number, z: number) => string }): string {
  const out: string[] = [];
  for (let z = 0; z < m.grid.Z; z++) {
    out.push(`piano ${z}:`);
    for (let y = 0; y < m.grid.Y; y++) {
      let row = '';
      for (let x = 0; x < m.grid.X; x++) row += m.letter(x, y, z).replace('@', '.');
      out.push(row);
    }
  }
  return out.join('\n');
}
