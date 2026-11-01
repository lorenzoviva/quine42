// Running MarkovJunior models in the lab: whole models (not tiles), so the grids are larger than the
// sculptor's boxes of steps 8A-8E, and a run is bounded by time rather than by a small step budget.

import { run, runOn, type Grid3, type GridLimits, type RunResult, type Snapshot } from './engine';
import type { MjxClip, MjxModel } from './model';

/** A house of 3×3 tiles at 20 voxels a tile is 60×60×50; a castle a few hundred a side. */
export const MJX_LIMITS: GridLimits = { side: 512, cells: 24_000_000 };

/**
 * What a model of the game may be, on the server as in the browser (ADR-0103): its XML can say its own `size` and `map` can
 * grow it, and everything runs in line. The largest model of the seed is under 2 million cells.
 */
export const FORM_LIMITS: GridLimits = { side: 512, cells: 8_000_000 };
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
}

export function runMjx(m: MjxModel, seed: number, opts: MjxRunOptions = {}): RunResult & { snapshots?: Snapshot[] } {
  return run(m.program, seed, opts.maxSteps ?? 5_000_000, opts.limits ?? MJX_LIMITS, { deadline: opts.deadline ?? 20_000, snapshots: opts.snapshots });
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
