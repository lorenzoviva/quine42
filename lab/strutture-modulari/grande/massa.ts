// The massing as the Architect would write it (T543, the author's answer D3 B to T522): a MarkovJunior program, run by the game's engine
// (src/mj/model.ts, src/mj/engine.ts), on a grid of bays (one cell a bay, one layer a storey) that the kernel prepares with what the world
// already says: the streets of the places' gates (the cross through the middle of every place, as in T522) and the ring around the lot.
// It writes, cell by cell, what the bricks of the fabric may be there (the letters below): which bays are rooms, roofs, streets, yards,
// porticoes, bridges and the stair cores (the turret on the roof). The same massing serves both ways: the way A goes on with a `wfc` in the
// same program, the way B (the kernel's weaver) reads it.
//
// The program: «insulae» around a courtyard, as the old city of Naples. Along every street a ring of building two bays deep (4 tiles);
// the ring is cut into palazzi of one to four storeys, side by side (seeds along the front grown in turn, so the cuts are random); each
// palazzo of two storeys or more gets one stair core (a 1 × 2 pair of cells, from the ground to the turret on the roof) along one row of
// the ring, the door at the end of its landing onto the next bay of the palazzo and the other row passing behind it (T543: across the
// ring a core cut the palazzo in two), where three by two bays of it stand; a palazzo that has no room for one stays of one storey; a bay
// that no other bay of its storey touches is the roof of its column; then the courtyard, the «androne» (a covered passage from the street to
// the courtyard, two bays of portico), some porticoes on the streets, bridges over a street on the first storey and between two roofs.

import { compileMjx } from '../../../src/mj/model';
import { runOn, type Grid3 } from '../../../src/mj/engine';
import { hash32 } from '../../../src/kernel/rng';

/** Bays of a place along a side: 18 tiles at 2 tiles a bay. */
export const PLACE = 9;
/** Storeys of the grid: rooms up to four, the roofs and turrets on top. */
export const STOREYS = 5;

/**
 * The letters of the massing, as the bricks' `roles` name them: A air, S street, Y yard (also the ring of a lot), P portico, H a bay of a
 * building on the ground, B one above, R a roof, q Q the stair core on the ground (the landing, the flights), k K on a storey, T V the turret,
 * N a bridge.
 */
export const ROLES = 'ASYPHBRqQkKTVN';

export const MASSING_XML = `<sequence values="ASUYOwxsabcdmnoefgEFGHBRqQkKTVPNZ" symmetry="(xy)">
  <union symbol="~" values="SO"/>
  <!-- the ring of building along the streets, two bays deep; the rest of the lot is the courtyard -->
  <prl in="~U" out="*w"/>
  <prl in="wU" out="wx"/>
  <!-- palazzi along the front: seeds of four heights, grown in turn along the front, the back row as its front -->
  <prl in="w" out="s" p="0.13" steps="1"/>
  <prl in="s" out="d" p="0.2" steps="1"/>
  <prl in="s" out="c" p="0.35" steps="1"/>
  <prl in="s" out="b" p="0.5" steps="1"/>
  <prl in="s" out="a"/>
  <one>
    <rule in="aw" out="aa"/>
    <rule in="bw" out="bb"/>
    <rule in="cw" out="cc"/>
    <rule in="dw" out="dd"/>
  </one>
  <prl in="w" out="a"/>
  <all>
    <rule in="ax" out="aa"/>
    <rule in="bx" out="bb"/>
    <rule in="cx" out="cc"/>
    <rule in="dx" out="dd"/>
  </all>
  <prl in="x" out="a"/>
  <!-- one stair core per palazzo of two storeys or more, where three bays of it stand side by side; the palazzo is marked as served -->
  <markov>
    <all>
      <rule in="Gd" out="Go"/>
      <rule in="gd" out="go"/>
      <rule in="od" out="oo"/>
      <rule in="Fc" out="Fn"/>
      <rule in="fc" out="fn"/>
      <rule in="nc" out="nn"/>
      <rule in="Eb" out="Em"/>
      <rule in="eb" out="em"/>
      <rule in="mb" out="mm"/>
    </all>
    <one>
      <rule in="ddd/ddd" out="ogG/ooo"/>
      <rule in="ccc/ccc" out="nfF/nnn"/>
      <rule in="bbb/bbb" out="meE/mmm"/>
    </one>
  </markov>
  <!-- a palazzo with no room for a core stays of one storey -->
  <prl>
    <rule in="b" out="a"/>
    <rule in="c" out="a"/>
    <rule in="d" out="a"/>
  </prl>
  <!-- up: every bay of a palazzo its storeys and its roof, the core its segments and the turret on the roof -->
  <prl>
    <rule in="A a" out="R H"/>
    <rule in="A A m" out="R B H"/>
    <rule in="A A A n" out="R B B H"/>
    <rule in="A A A A o" out="R B B B H"/>
    <rule in="A A e" out="T k q"/>
    <rule in="A A E" out="V K Q"/>
    <rule in="A A A f" out="T k k q"/>
    <rule in="A A A F" out="V K K Q"/>
    <rule in="A A A A g" out="T k k k q"/>
    <rule in="A A A A G" out="V K K K Q"/>
  </prl>
  <!-- a bay of a palazzo that no other bay of its storey touches (a core beside it, the air around) is the roof of its column: it would
       have no way in; what stood above it is air -->
  <union symbol="!" values="ARKQVNT"/>
  <markov>
    <all in="*!*/!B!/*!*" out="***/*R*/***"/>
    <all in="R R" out="A R"/>
    <all in="B A" out="A A"/>
    <all in="R A" out="A A"/>
  </markov>
  <!-- the courtyard, and the androne that reaches it from the street, one for every courtyard that can have one -->
  <prl in="U" out="Y"/>
  <markov>
    <all in="ZY" out="ZZ"/>
    <one in="~/H/H/Y" out="*/P/P/Z"/>
  </markov>
  <prl in="Z" out="Y"/>
  <!-- some porticoes on the streets; bridges over a street on the first storey and between two roofs, only where the air is on their two sides (never two crossing) -->
  <prl in="SH" out="SP" p="0.12" steps="1"/>
  <prl in="PHP" out="PPP" steps="1"/>
  <prl in="*A*/BAB/*A* ***/*S*/***" out="***/BNB/*** ***/***/***" p="0.3" steps="1"/>
  <prl in="*A*/RAR/*A*" out="***/RNR/***" p="0.35" steps="1"/>
  <prl in="NN" out="AA" steps="1"/>
  <prl in="O" out="Y"/>
</sequence>`;

/** What the kernel prepares: where the massing works (U), the streets of the gates (S), the ring around (S around a district, O around a lot). */
export type Ground = 'quartiere' | 'blocco' | 'lotto';

/**
 * The grid the massing starts from, a cell a bay and a layer a storey: `quartiere` 3 × 3 places (27 × 27 bays, the streets of their gates,
 * a ring of street around: 29 × 29); `blocco` the lot of a block of places within today's 500 voxels (13 × 13 bays with a cross of streets
 * through it, a ring of yard around it: 15 × 15 = 480 voxels); `lotto` the lot of one place (5 × 5 bays, its ring: 7 × 7 = 224 voxels).
 */
export function prepared(kind: Ground): Grid3 {
  const inner = kind === 'quartiere' ? 3 * PLACE : kind === 'blocco' ? 13 : 5;
  const X = inner + 2, Y = X, Z = STOREYS;
  const alphabet = ['.', 'S', 'U', 'O'];
  const cells = new Uint8Array(X * Y * Z);
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      const ring = x === 0 || y === 0 || x === X - 1 || y === Y - 1;
      const bx = x - 1, by = y - 1;
      const street = kind === 'quartiere' ? bx % PLACE === 4 || by % PLACE === 4 : kind === 'blocco' ? bx === 6 || by === 6 : false;
      cells[x + y * X] = ring ? (kind === 'quartiere' ? 1 : 3) : street ? 1 : 2;
    }
  return { X, Y, Z, cells, alphabet, log: [], epoch: 0 };
}

const compiled = new Map<string, ReturnType<typeof compileMjx>>();
const program = (g: Grid3) => {
  const k = `${g.X},${g.Y},${g.Z}`;
  if (!compiled.has(k)) compiled.set(k, compileMjx(MASSING_XML, { size: [g.X, g.Y, g.Z] }));
  return compiled.get(k)!;
};

/** The massing of a grid at a seed: the grid it writes, its letters as `ROLES` names them (air is "A"). */
export function massing(kind: Ground, seed: number): { grid: Grid3; ms: number; letter: (x: number, y: number, z: number) => string } {
  const grid = prepared(kind);
  const t0 = performance.now();
  const r = runOn(grid, program(grid).program, hash32(seed, 4321), 2_000_000, { side: 1024, cells: 64_000_000 }, { deadline: 20_000 });
  if (!r.finished) throw new Error(`la massa non finisce (${r.steps} passi)`);
  const ms = performance.now() - t0;
  const letter = (x: number, y: number, z: number) => {
    if (x < 0 || y < 0 || x >= grid.X || y >= grid.Y || z < 0 || z >= grid.Z) return z === 0 ? 'S' : 'A';
    const ch = grid.alphabet[grid.cells[x + y * grid.X + z * grid.X * grid.Y]];
    return ch === '.' ? 'A' : ch;
  };
  for (let z = 0; z < grid.Z; z++)
    for (let y = 0; y < grid.Y; y++)
      for (let x = 0; x < grid.X; x++) if (!ROLES.includes(letter(x, y, z))) throw new Error(`la massa lascia "${letter(x, y, z)}" in ${x},${y},${z}`);
  return { grid, ms, letter };
}

/** The massing as text, one storey after the other (for the report). */
export function massingText(m: { grid: Grid3; letter: (x: number, y: number, z: number) => string }): string {
  const out: string[] = [];
  for (let z = 0; z < m.grid.Z; z++) {
    out.push(`piano ${z}:`);
    for (let y = m.grid.Y - 1; y >= 0; y--) {
      let row = '';
      for (let x = 0; x < m.grid.X; x++) row += m.letter(x, y, z).replace('A', '.');
      out.push(row);
    }
  }
  return out.join('\n');
}
