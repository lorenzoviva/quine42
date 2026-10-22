// Running MarkovJunior models in the lab: whole models (not tiles), so the grids are larger than the
// sculptor's boxes of steps 8A-8E, and a run is bounded by time rather than by a small step budget.

import { run, runOn, type Grid3, type GridLimits, type RunResult, type Snapshot } from './engine';
import type { MjxClip, MjxModel } from './model';

/** A house of 3×3 tiles at 20 voxels a tile is 60×60×50; a castle a few hundred a side. */
export const MJX_LIMITS: GridLimits = { side: 512, cells: 24_000_000 };

export interface MjxRunOptions {
  /** Default 5 million: a `one` node rewrites one match per step, so growth takes many steps. */
  maxSteps?: number;
  /** Milliseconds, default 20 s. */
  deadline?: number;
  /** Keep about this many states of the run (the model growing). */
  snapshots?: number;
}

export function runMjx(m: MjxModel, seed: number, opts: MjxRunOptions = {}): RunResult & { snapshots?: Snapshot[] } {
  return run(m.program, seed, opts.maxSteps ?? 5_000_000, MJX_LIMITS, { deadline: opts.deadline ?? 20_000, snapshots: opts.snapshots });
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
