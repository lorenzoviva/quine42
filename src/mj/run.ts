// Running MarkovJunior models in the lab: whole models (not tiles), so the grids are larger than the
// sculptor's boxes of steps 8A-8E, and a run is bounded by time rather than by a small step budget.

import { run, runOn, type Grid3, type GridLimits, type NodeCeilings, type PieceLimits, type RunResult, type Snapshot } from './engine';
import type { MjxClip, MjxModel } from './model';

/** A house of 3×3 tiles at 20 voxels a tile is 60×60×50; a castle a few hundred a side; a structure of 20 × 20 tiles 400 × 400 × 160 (T356). */
export const MJX_LIMITS: GridLimits = { side: 1024, cells: 64_000_000 };

/**
 * What a model of the game may be, on the server as in the browser (ADR-0105): its XML can say its own `size` and `map` can
 * grow it, and everything runs in line. The largest model of the seed is under 2 million cells; a structure that grows by rules at
 * 20 × 20 tiles is 400 × 400 × 160, 25.6 million (T356, ADR-0185: the grid is a byte a cell, the time stays the validator's).
 */
export const FORM_LIMITS: GridLimits = { side: 512, cells: 32_000_000 };
/**
 * What a model of the game may be when it runs its detail in pieces (T339, ADR-0178), only where the game makes its forms (`runForm`):
 * a larger grid (a farm of 50 x 50 tiles at 10 voxels a tile is 12.5 million cells; twice `FORM_LIMITS` since T356), each piece within
 * its time, all of them within theirs, outside the model's own time. The validator does not give it: a program it checks runs within
 * `FORM_LIMITS` and its time.
 */
export const FORM_PIECES: PieceLimits = { side: 1024, cells: 64_000_000, pieceMs: 4_000, totalMs: 45_000, count: 1024, steps: 5_000_000 };
/** The limits the game makes its forms with (`runForm`): `FORM_LIMITS`, and `FORM_PIECES` for a program with `<pieces>` (T339). */
export const FORM_RUN_LIMITS: GridLimits = { ...FORM_LIMITS, pieces: FORM_PIECES };
/** The longest `tempo` an index entry may ask for, in milliseconds. */
export const MAX_FORM_TIME = 30_000;
/** The longest program, in characters. */
export const MAX_FORM_XML = 1_000_000;

export interface MjxRunOptions {
  /** Default 5 million: a `one` node rewrites one match per step, so growth takes many steps. */
  maxSteps?: number;
  /** Milliseconds, default 20 s. */
  deadline?: number;
  /** Keep about this many states of the run (the model growing). */
  snapshots?: number;
  /** Default `MJX_LIMITS`, the lab's. */
  limits?: GridLimits;
  /** The world's ceilings on waves and potentials (`WORLD_NODE_LIMITS`, T336), for the validator: past one the run throws. */
  ceilings?: NodeCeilings;
}

export function runMjx(m: MjxModel, seed: number, opts: MjxRunOptions = {}): RunResult & { snapshots?: Snapshot[] } {
  return run(m.program, seed, opts.maxSteps ?? 5_000_000, opts.limits ?? MJX_LIMITS, { deadline: opts.deadline ?? 20_000, snapshots: opts.snapshots, ...(opts.ceilings ? { ceilings: opts.ceilings } : {}) });
}

const copy = (g: Grid3): Grid3 => ({ ...g, cells: new Uint8Array(g.cells), alphabet: [...g.alphabet], log: [], epoch: 0 });

/** The frames of an animation: frame 0 is the model, each next one the clip run on the one before. */
export function clipFrames(g: Grid3, clip: MjxClip, seed: number): Grid3[] {
  const frames = [copy(g)];
  for (let k = 1; k < clip.frames; k++) {
    const next = copy(frames[k - 1]);
    runOn(next, clip.program, seed * 31 + k, 200_000, MJX_LIMITS, { deadline: 2_000 });
    frames.push(next);
  }
  return frames;
}

/** Runs an action on the model (in place): the door opens, the chest empties. */
export function act(g: Grid3, clip: MjxClip, seed: number): RunResult {
  return runOn(g, clip.program, seed, 200_000, MJX_LIMITS, { deadline: 2_000 });
}
