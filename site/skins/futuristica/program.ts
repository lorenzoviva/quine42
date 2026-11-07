// The maze of the futuristic skin (T284, T315): a MarkovJunior program in two dimensions, run by the game's engine in this page, drawn
// with the small letters of the lettering. A maze grows from the middle (MarkovJunior's MazeGrowth, the flat sister of the landing's
// LABIRINTO), then the longest path through it is lit, then it starts again with another seed. Its colours are the other way round
// from the lettering's (the author, T315): the walls are faint letters, the free paths are bands of light with their letters cut in them.
// It has a section of its own on the landing, under the hero (effects.ts).

import { Stepper, type Node3, type Program3 } from '../../../src/mj/engine';
import { mix, rgba, type Ink, type Lights, type Surface } from './surface';

/** The grid's codes: unwritten (and the walls), a room, a passage, the start of the path, the path. */
const CODES = '.BWASP';
const PALETTE: Program3['palette'] = Object.fromEntries([...CODES.slice(1)].map((c) => [c, {}]));

/** Grows the maze: a room carves the wall to a room not yet visited, one at a time. */
export const GROW: Node3 = { type: 'one', rules: [{ in: 'WBB', out: 'WAW' }] };
/** Then a room becomes the start, and the way to it from the room farthest from it is lit. */
export const SOLVE: Node3[] = [
  { type: 'one', steps: 1, rules: [{ in: 'W', out: 'S' }] },
  { type: 'path', from: 'W', to: 'S', on: 'WA', color: 'P', longest: true, steps: 1 },
];
export const MAZE_PROGRAM: Node3 = { type: 'sequence', children: [GROW, ...SOLVE] };

/** What the page paints for each place: the states of the maze's ink. */
export const UNWRITTEN = 1;
export const MAZE = 2;
export const WARM = 3;
export const FRESH = 4;
export const PATH = 5;
export const END = 6;

/** Ticks the maze takes to grow, whatever its size (a phone's is a quarter of a desktop's), and ticks the finished maze stays lit. */
const GROW_TICKS = 40;
const HOLD_TICKS = 44;

export interface MazeLights extends Lights {
  /** Steps of the program so far, for the meter. */
  readonly steps: number;
  /** The maze finished and its path lit, at once (reduced motion: the picture stands still). */
  settle(): void;
}

/**
 * The maze's ink. The walls and what is not written yet: faint letters. A free path: a band of the lettering's cyan, its letters cut in
 * dark and its small Qs pink; the newest rooms white, then light; the path yellow, its start white.
 */
export function mazeInk(colors: { text: string; q: string }, wave = '#ffe600'): Ink {
  const ground = '#090514';
  const states = END + 1;
  const letter = [new Uint32Array(states), new Uint32Array(states)];
  const block = new Uint32Array(states);
  const halo = new Uint32Array(states);
  const faint = rgba(colors.text, 0.17);
  letter[0][UNWRITTEN] = faint;
  letter[1][UNWRITTEN] = faint;
  const lit: Array<[number, string, number, number]> = [
    [MAZE, colors.text, 0.62, 0.12],
    [WARM, mix(colors.text, '#ffffff', 0.5), 0.85, 0.3],
    [FRESH, '#ffffff', 0.92, 0.5],
    [PATH, wave, 0.88, 0.45],
    [END, '#ffffff', 0.95, 0.8],
  ];
  for (const [state, color, a, glow] of lit) {
    block[state] = rgba(color, a);
    letter[0][state] = state === MAZE ? rgba(colors.q) : rgba(ground, 0.6);
    letter[1][state] = rgba(ground, 0.6);
    halo[state] = rgba(color, glow);
  }
  return { letter, halo, block };
}

export function programLights(s: Surface, seed: number): MazeLights {
  const { X, Y } = s;
  const N = X * Y;
  const states = new Uint8Array(N);
  const age = new Uint8Array(N);
  const before = new Uint8Array(N);
  const B = CODES.indexOf('B');
  const S = CODES.indexOf('S');
  const P = CODES.indexOf('P');
  /** Rooms carved per tick: one a step. */
  const perTick = Math.max(6, Math.round((Math.ceil(X / 2) * Math.ceil(Y / 2)) / GROW_TICKS));
  let program: Stepper;
  let run = 0;
  let held = 0;
  let done = false;
  const start = () => {
    const cells = new Uint8Array(N).fill(B);
    // The first room in the middle, on the lattice of rooms that reaches the edges.
    const x = X >> 1;
    const y = Y >> 1;
    cells[x - (x % 2) + (y - (y % 2)) * X] = CODES.indexOf('W');
    program = new Stepper({ X, Y, Z: 1, cells, alphabet: [...CODES], log: [], epoch: 0 }, { palette: PALETTE, program: MAZE_PROGRAM }, (seed * 7919 + run * 104729) >>> 0);
    run++;
    held = 0;
    done = false;
    age.fill(255);
  };
  /** The states of the places, from the grid: what changed this tick is new, then warm, then settles. */
  const look = () => {
    const cells = program.grid.cells;
    for (let i = 0; i < N; i++) {
      const code = cells[i];
      if (code !== before[i]) age[i] = 0;
      else if (age[i] < 255) age[i]++;
      states[i] = code === B ? UNWRITTEN : code === S ? END : age[i] < 2 ? FRESH : code === P ? PATH : age[i] < 5 ? WARM : MAZE;
    }
  };
  start();
  const lights: MazeLights = {
    states,
    get steps() {
      return program.steps;
    },
    step() {
      before.set(program.grid.cells);
      if (!done) done = program.advance(perTick) < perTick;
      else if (++held > HOLD_TICKS) {
        start();
        before.set(program.grid.cells);
      }
      look();
    },
    settle() {
      if (!done) {
        program.advance(N * 4);
        done = true;
      }
      before.set(program.grid.cells);
      age.fill(255);
      look();
    },
  };
  lights.step();
  return lights;
}
