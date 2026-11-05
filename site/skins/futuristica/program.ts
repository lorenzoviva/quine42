// The variant of the futuristic skin without the 3D stage (T284, a proposal: the choice is the author's). In the stage's place a
// MarkovJunior program in two dimensions, run by the game's engine in this page as the landing says, drawn with the small letters of the
// lettering: a maze grows from the middle (MarkovJunior's MazeGrowth, the flat sister of the landing's LABIRINTO), then a path is lit
// from one end to the other, then it starts again with another seed. Loaded only by `?fx=mj-pagina`.

import { runOn, type Grid3, type Node3, type Program3 } from '../../../src/mj/engine';
import { mix, rgba, type Ink, type Lights, type Surface } from './surface';

/** The grid's codes: unwritten, a room, a passage, the start of the path, the path. */
const CODES = '.BWASP';
const PALETTE: Program3['palette'] = Object.fromEntries([...CODES.slice(1)].map((c) => [c, {}]));

/** Grows the maze: a room carves the wall to a room not yet visited, one at a time. */
export const GROW: Node3 = { type: 'one', rules: [{ in: 'WBB', out: 'WAW' }] };
/** A room becomes the start, and the way to it from the room farthest from it is lit. */
export const SOLVE: Node3 = {
  type: 'sequence',
  children: [
    { type: 'one', steps: 1, rules: [{ in: 'W', out: 'S' }] },
    { type: 'path', from: 'W', to: 'S', on: 'WA', color: 'P', longest: true, steps: 1 },
  ],
};

/** What the page paints for each place: the states of the panel's ink. */
export const UNWRITTEN = 1;
export const MAZE = 2;
export const WARM = 3;
export const FRESH = 4;
export const PATH = 5;
export const END = 6;

/** Rooms carved per tick while the maze grows, and ticks the finished maze stays lit. */
const STEPS_PER_TICK = 24;
const HOLD_TICKS = 44;

export interface ProgramLights extends Lights {
  /** Steps of the program so far, for the meter. */
  readonly steps: number;
  readonly name: string;
}

/** The panel's ink: what is not written yet barely there, the maze in the lettering's colours, the newest rooms white, the path yellow. */
export function programInk(colors: { text: string; q: string }, wave = '#ffe600'): Ink {
  const by: Array<[string, string, number]> = [];
  by[0] = ['#000000', '#000000', 0];
  by[UNWRITTEN] = [colors.q, colors.text, 0.13];
  by[MAZE] = [colors.q, colors.text, 1];
  by[WARM] = [mix(colors.q, '#ffffff', 0.5), mix(colors.text, '#ffffff', 0.5), 1];
  by[FRESH] = ['#ffffff', '#ffffff', 1];
  by[PATH] = [mix(colors.q, wave, 0.6), wave, 1];
  by[END] = ['#ffffff', '#ffffff', 1];
  const letter = [Uint32Array.from(by.map(([q, , a]) => rgba(q, a))), Uint32Array.from(by.map(([, t, a]) => rgba(t, a)))];
  const halo = new Uint32Array(by.length);
  halo[FRESH] = rgba('#ffffff', 0.6);
  halo[WARM] = rgba(colors.text, 0.3);
  halo[PATH] = rgba(wave, 0.45);
  halo[END] = rgba('#ffffff', 0.8);
  return { letter, halo };
}

export function programLights(s: Surface, seed: number): ProgramLights {
  const { X, Y } = s;
  const N = X * Y;
  const states = new Uint8Array(N);
  const age = new Uint8Array(N);
  let grid: Grid3;
  let run = 0;
  let steps = 0;
  let phase: 'grow' | 'solve' | 'hold' = 'grow';
  let held = 0;
  const start = () => {
    const cells = new Uint8Array(N).fill(CODES.indexOf('B'));
    // The first room in the middle, on the lattice of rooms that reaches the edges.
    const x = X >> 1;
    const y = Y >> 1;
    cells[(x - (x % 2)) + (y - (y % 2)) * X] = CODES.indexOf('W');
    grid = { X, Y, Z: 1, cells, alphabet: [...CODES], log: [], epoch: 0 };
    steps = 0;
    phase = 'grow';
    held = 0;
    age.fill(255);
    run++;
  };
  start();
  const before = new Uint8Array(N);
  const seedOf = () => (seed * 7919 + run * 104729 + steps) >>> 0;
  const lights: ProgramLights = {
    states,
    get steps() {
      return steps;
    },
    name: 'LABIRINTO',
    step() {
      before.set(grid.cells);
      if (phase === 'grow') {
        const r = runOn(grid, { palette: PALETTE, program: GROW }, seedOf(), STEPS_PER_TICK, { side: 4096, cells: 1 << 20 });
        steps += r.steps;
        if (r.finished) phase = 'solve';
      } else if (phase === 'solve') {
        const r = runOn(grid, { palette: PALETTE, program: SOLVE }, seedOf(), 16, { side: 4096, cells: 1 << 20 });
        steps += r.steps;
        phase = 'hold';
      } else if (++held > HOLD_TICKS) start();
      for (let i = 0; i < N; i++) {
        if (grid.cells[i] !== before[i]) age[i] = 0;
        else if (age[i] < 255) age[i]++;
        const code = CODES[grid.cells[i]];
        states[i] = code === 'B' ? UNWRITTEN : code === 'S' ? END : age[i] < 2 ? FRESH : code === 'P' ? PATH : age[i] < 5 ? WARM : MAZE;
      }
    },
  };
  lights.step();
  return lights;
}
