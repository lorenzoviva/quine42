// The lights of the futuristic skin as a MarkovJunior program (T284): the game's own engine (src/mj/engine.ts) runs it once per tick on
// the grid of the surface, as the game runs an animation clip on the frame before (src/mj/run.ts, `clipFrames`). The states are the
// grid's codes (surface.ts, STATES), so nothing is translated: what the program writes is what the page paints.

import { runOn, type Grid3, type Node3, type Program3 } from '../../../src/mj/engine';
import { OUT, RATES, STATES, restingStates, type LightsMaker, type Surface } from './surface';

/**
 * One tick. A row of the grid is a row of small letters; '.' is outside the letters (and the border round the surface).
 * Heads (H) run right along their row like a cursor over a line being compiled, leaving a trail (T) that fades (F) back to rest (D);
 * now and then a letter at rest becomes the front (S) of a wave that lights the big letter it is in, ring after ring (N, then W).
 */
export const PROGRAM: Node3 = {
  type: 'sequence',
  children: [
    // Fading, decided on the grid as it was: nothing fades twice in a tick.
    {
      type: 'prl',
      rules: [
        { in: 'T', out: 'F', p: RATES.trail },
        { in: 'F', out: 'D', p: RATES.fade },
        { in: 'W', out: 'F', p: RATES.wake },
      ],
    },
    // The heads move one place right; at the end of their run of letters they leave a trail and stop.
    {
      type: 'all',
      steps: 1,
      symmetry: 'none',
      rules: [
        { in: 'H[DFW]', out: 'TH' },
        { in: 'H.', out: 'T.' },
      ],
    },
    // The wave: the front lights the letters at rest beside it (all four ways), becomes the wake, and the new ring is the front.
    // Only letters at rest: what is still fading is not lit again, so a wave goes out and never comes back.
    { type: 'all', steps: 1, rules: [{ in: 'SD', out: '*N' }] },
    { type: 'all', steps: 1, rules: [{ in: 'S', out: 'W' }] },
    { type: 'all', steps: 1, rules: [{ in: 'N', out: 'S' }] },
    // New heads at the start of a run of letters, and now and then a wave.
    {
      type: 'prl',
      rules: [
        { in: '.D', out: '.H', p: RATES.head, symmetry: 'none' },
        { in: 'D', out: 'S', p: RATES.wave },
      ],
    },
  ],
};

const PALETTE: Program3['palette'] = Object.fromEntries([...STATES.slice(1)].map((c) => [c, {}]));
/** A tick is at most one step of each node of the sequence. */
const MAX_STEPS = 16;

/** The grid of a surface with a border of '.' all round, so that a run of letters at the edge still starts and ends. */
function gridOf(s: Surface): Grid3 {
  const X = s.X + 2;
  const Y = s.Y + 2;
  const cells = new Uint8Array(X * Y);
  const rest = restingStates(s);
  for (let y = 0; y < s.Y; y++) cells.set(rest.subarray(y * s.X, (y + 1) * s.X), (y + 1) * X + 1);
  return { X, Y, Z: 1, cells, alphabet: [...STATES], log: [], epoch: 0 };
}

export const mjLights: LightsMaker = (s, seed) => {
  const grid = gridOf(s);
  const states = restingStates(s);
  const program = { palette: PALETTE, program: PROGRAM };
  let tick = 0;
  return {
    states,
    step() {
      tick++;
      runOn(grid, program, (seed * 31 + tick * 7919) >>> 0, MAX_STEPS, { side: 4096, cells: 1 << 20 });
      // The codes never move (the grid's alphabet comes first): copy the inside back.
      const X = grid.X;
      for (let y = 0; y < s.Y; y++) states.set(grid.cells.subarray((y + 1) * X + 1, (y + 1) * X + 1 + s.X), y * s.X);
      for (let i = 0; i < states.length; i++) if (!s.mask[i]) states[i] = OUT;
    },
  };
};
