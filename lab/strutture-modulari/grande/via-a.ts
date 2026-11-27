// The way A (T543): the complex inside one program of the Architect, as MarkovJunior's Apartemazements does it: the massing (massa.ts, a
// MarkovJunior program) and then a `wfc` whose tiles are the bays of the set, on the grid the massing wrote, one wave for the whole lot.
//
// The node is the game's own (`WfcNode`, src/mj/engine.ts, the `WfcRunner` that runs it): its patterns are the bays of the set with their
// eight symmetries, its propagator the one the faces read from the voxels give (facce.ts), its rules (`map`) say which bays each letter of
// the massing may become. A tileset of MarkovJunior written by hand would say the same with its tiles as text and its neighbours one by one:
// `tilesetText` measures how long that text would be (what today's ceilings on a file of models/ would have to take).
//
// `viaA` runs the wave as the engine runs it (the same bans in the same order, the same solver, the run's generator `new Rng(seed)`) so as
// to keep the pattern of every bay for the measures; `engineRun` runs the node in the engine itself, within the world's ceilings or not, and
// says whether the grid it writes is the one `viaA` found.

import { performance } from 'node:perf_hooks';
import { Rng } from '../../../src/kernel/rng';
import { runOn, type Grid3, type GridLimits, type NodeCeilings, type WfcNode } from '../../../src/mj/engine';
import { waveBytes, WFC_LIMITS, WfcSolver } from '../../../src/mj/wfc';
import { type BrickSet, type Pattern } from './facce';
import { ROLES } from './massa';
import { ALPHABET, C, H, PALETTE } from './tasselli';

/** The letters of the massing a pattern may stand on. */
export const rolesOf = (p: Pattern) => p.brick.roles[p.orig] ?? p.brick.roles['*'] ?? '';

/** For every letter of the massing, the patterns it may become (a mask over the set's patterns). */
export function masksOf(set: BrickSet): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  for (const L of ROLES) out.set(L, Uint8Array.from(set.patterns, (p) => (rolesOf(p).includes(L) ? 1 : 0)));
  for (const [L, m] of out) if (!m.some((v) => v)) throw new Error(`nessun tassello del set sta su "${L}"`);
  return out;
}

/** The letters of a pattern's voxels, x fastest, then y, then z from the bottom: a pattern of the engine's `WfcNode`. */
const textOf = (p: Pattern) => {
  let s = '';
  for (const v of p.voxels.cells) s += ALPHABET[v];
  return s;
};

/** The game's `wfc` node for a set: what the compiler would make of a tileset with these tiles and these neighbours. */
export function wfcNode(set: BrickSet, tries: number): WfcNode {
  const masks = masksOf(set);
  const map: Record<string, number[]> = {};
  for (const [L, m] of masks) map[L === 'A' ? '.' : L] = [...m.keys()].filter((t) => m[t]);
  return { type: 'wfc', model: 'tile', patterns: set.patterns.map(textOf), dims: [C, C, H], weights: set.weights, propagator: set.propagator, map, tries };
}

export interface Woven {
  X: number;
  Y: number;
  Z: number;
  /** The pattern of every bay (x + y·X + z·X·Y), if the wave found one. */
  observed?: Int32Array;
  ms: number;
  /** Tries made: the one that found it is the last (MarkovJunior starts again from nothing after a contradiction). */
  tries: number;
  /** Bytes of the two waves (what the engine checks against `WFC_LIMITS.waveBytes` and the world's `waveBytes`). */
  bytes: number;
  why?: string;
  late?: boolean;
}

/** The wave of the way A on a massing, as the engine's `WfcRunner` makes it from the run's generator. */
export function viaA(set: BrickSet, massing: Grid3, letter: (x: number, y: number, z: number) => string, seed: number, tries = 100, deadlineMs = 120_000): Woven {
  const { X, Y, Z } = massing;
  const P = set.patterns.length;
  const masks = masksOf(set);
  const t0 = performance.now();
  const solver = new WfcSolver({ MX: X, MY: Y, MZ: Z, weights: set.weights, propagator: set.propagator, periodic: false, shannon: false });
  for (let z = 0, i = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++, i++) {
        const mask = masks.get(letter(x, y, z))!;
        for (let t = 0; t < P; t++) if (!mask[t] && solver.allows(i, t)) solver.ban(i, t);
      }
  const out = solver.solve(new Rng(seed), tries, performance.now() + deadlineMs, () => performance.now());
  const ms = performance.now() - t0;
  const bytes = waveBytes(X * Y * Z, P, 6, false);
  return { X, Y, Z, ms, bytes, tries: out.observed ? out.tries + 1 : out.tries, ...(out.observed ? { observed: out.observed } : {}), ...(out.why ? { why: out.why } : {}), ...(out.late ? { late: true } : {}) };
}

export interface EngineRun {
  ok: boolean;
  error?: string;
  ms: number;
  /** Whether every bay of the grid the engine wrote is the pattern `viaA` found there. */
  same?: boolean;
  voxels?: number;
}

/**
 * The node in the game's engine (`runOn`) on a copy of the massing, within `limits` and, if given, the world's `ceilings`: what it says
 * (or why it refuses), and whether its grid is the one of `viaA` (`woven`).
 */
export function engineRun(set: BrickSet, massing: Grid3, seed: number, woven: Woven | undefined, o: { limits: GridLimits; ceilings?: NodeCeilings; tries: number; deadline: number }): EngineRun {
  const g: Grid3 = { ...massing, cells: new Uint8Array(massing.cells), alphabet: [...massing.alphabet], log: [], epoch: 0 };
  const node = wfcNode(set, o.tries);
  const t0 = performance.now();
  try {
    const r = runOn(g, { palette: PALETTE, program: node }, seed, 4, o.limits, { deadline: o.deadline, ...(o.ceilings ? { ceilings: o.ceilings } : {}) });
    const ms = performance.now() - t0;
    if (!r.finished) return { ok: false, ms, error: `non finita (${(r.unused ?? []).join('; ') || 'tempo'})` };
    if (g.X === massing.X) return { ok: false, ms, error: `nessuna soluzione (${(r.unused ?? []).join('; ')})` };
    let same: boolean | undefined;
    if (woven?.observed) {
      same = true;
      const code = ALPHABET.map((ch) => (ch === '.' ? 0 : g.alphabet.indexOf(ch)));
      const { X, Y } = massing;
      outer: for (let i = 0; i < woven.observed.length; i++) {
        const bx = i % X, by = Math.floor(i / X) % Y, bz = Math.floor(i / (X * Y));
        const v = set.patterns[woven.observed[i]].voxels.cells;
        // A sample of every bay: its diagonal and two faces (the whole would cost a few seconds more and say the same).
        for (let k = 0; k < C; k++)
          for (const [x, y, z] of [[k, k, k], [0, k, (k * 7) % H], [k, C - 1, (k * 5) % H]] as const) {
            const want = code[v[x + y * C + z * C * C]];
            if (g.cells[bx * C + x + (by * C + y) * g.X + (bz * H + z) * g.X * g.Y] !== want) {
              same = false;
              break outer;
            }
          }
      }
    }
    return { ok: true, ms, voxels: g.cells.length, ...(same !== undefined ? { same } : {}) };
  } catch (e) {
    return { ok: false, ms: performance.now() - t0, error: (e as Error).message };
  }
}

/**
 * How long a tileset of MarkovJunior with this set would be, written by hand: every tile (a bay) as text, a character a voxel and a line
 * a row, and the neighbours one by one (`<neighbor left="z a" right="b"/>`: a line covers the pairs the tile model makes of it by turning
 * and mirroring, at most four on a side, eight on top). A lower bound: the pairs the propagator holds divided by what a line covers.
 */
export function tilesetText(set: BrickSet): { tiles: number; tileChars: number; pairsSide: number; pairsTop: number; neighborLines: number; neighborChars: number; total: number } {
  const tiles = new Set(set.patterns.map((p) => `${p.brick.name}|${p.orig}`)).size;
  const tileChars = tiles * (C * C * H + C * H + H + 40);
  const pairsSide = set.propagator[0].reduce((n, l) => n + l.length, 0);
  const pairsTop = set.propagator[4].reduce((n, l) => n + l.length, 0);
  const neighborLines = Math.ceil(pairsSide / 4) + Math.ceil(pairsTop / 8);
  const neighborChars = neighborLines * 48;
  return { tiles, tileChars, pairsSide, pairsTop, neighborLines, neighborChars, total: tileChars + neighborChars };
}

/** The engine's own ceilings on a wave, for the report. */
export const ENGINE_WAVE = { patterns: WFC_LIMITS.patterns, waveBytes: WFC_LIMITS.waveBytes, ms: WFC_LIMITS.ms, propagator: WFC_LIMITS.propagator };
