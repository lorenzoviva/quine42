// The programs of the landing's 3D stage (T101, T315): real MarkovJunior programs (the game's engine, src/mj/), run with a seed and kept
// as the states of their growth. No three.js here: the worker that runs them (hero-worker.ts), the stage (hero-stage.ts) and the tests
// read this file.

import { compileMjx, type MjxModel } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import type { Snapshot } from '../src/mj/engine';
import { MJ_PALETTE } from '../src/mj/palette';
import pino from '../universe/models/tree.xml?raw';

/** A program of the hero: its MarkovJunior source and the line under the stage. */
export interface HeroProgram {
  name: string;
  src: string;
}

// A labyrinth that grows from the centre of the box (MarkovJunior's MazeGrowth, in 3D), then lights its ends.
const LABIRINTO = `<sequence values="BWAY" origin="True" size="17 17 17">
  <color symbol="W" value="ff2a85" glow="True"/>
  <color symbol="A" value="00f0ff" glow="True"/>
  <color symbol="Y" value="ffe600" glow="True"/>
  <one in="WBB" out="WAW"/>
  <all in="W" out="Y"/>
</sequence>`;

// A coral that grows from the middle of the floor, one cell at a time, then speckles its skin with light.
const CORALLO = `<sequence values="BRUP" origin="bottom" size="21 21 21">
  <color symbol="R" value="9d00ff"/>
  <color symbol="U" value="00f0ff" glow="True"/>
  <color symbol="P" value="ff2a85" glow="True"/>
  <one in="RB" out="RR" steps="1400"/>
  <prl steps="1">
    <rule in="RB" out="UB" p="0.18"/>
    <rule in="RB" out="PB" p="0.12"/>
  </prl>
</sequence>`;

export const HERO_PROGRAMS: HeroProgram[] = [
  { name: 'LABIRINTO', src: LABIRINTO },
  { name: 'CORALLO', src: CORALLO },
  { name: 'PINO', src: pino },
];

/** How many states of a run the hero shows while it grows. */
const FRAMES = 90;

export interface HeroRun {
  name: string;
  size: [number, number, number];
  frames: Snapshot[];
  /** Colour (0xrrggbb, sRGB) and glow of every code of the grid (index 0 is air). */
  colors: number[];
  glow: boolean[];
}

/** Runs a program of the hero with a seed and keeps the states of its growth. */
export function runHero(prog: HeroProgram, seed: number): HeroRun {
  const model: MjxModel = compileMjx(prog.src);
  const res = runMjx(model, seed, { snapshots: FRAMES, deadline: 1500, maxSteps: 200_000 });
  const pal = model.program.palette;
  const colors: number[] = [];
  const glow: boolean[] = [];
  for (const code of res.grid.alphabet) {
    const own = pal[code];
    const hex = own?.color ?? MJ_PALETTE[code]?.color ?? '#ffffff';
    colors.push(parseInt(hex.replace('#', ''), 16) || 0);
    glow.push(!!own?.glow);
  }
  // A code that is hidden is air, for the stage: one table read per cell.
  const hidden = Uint8Array.from(res.grid.alphabet, (c) => (pal[c]?.hidden ? 1 : 0));
  const frames = (res.snapshots ?? [res.grid]).map((s) => ({ X: s.X, Y: s.Y, Z: s.Z, cells: hideCodes(s.cells, hidden), step: 'step' in s ? s.step : res.steps }));
  return { name: prog.name, size: [res.grid.X, res.grid.Y, res.grid.Z], frames, colors, glow };
}

function hideCodes(cells: Uint8Array, hidden: Uint8Array): Uint8Array {
  if (!hidden.includes(1)) return cells;
  const out = new Uint8Array(cells);
  for (let i = 0; i < out.length; i++) if (hidden[out[i]]) out[i] = 0;
  return out;
}

/** The cells of a frame that touch air (the inside of a solid model is never seen). */
export function visibleCells(f: Snapshot): number[] {
  const { X, Y, Z, cells } = f;
  const out: number[] = [];
  const air = (x: number, y: number, z: number) => x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z || cells[x + y * X + z * X * Y] === 0;
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        if (!cells[x + y * X + z * X * Y]) continue;
        if (air(x - 1, y, z) || air(x + 1, y, z) || air(x, y - 1, z) || air(x, y + 1, z) || air(x, y, z - 1) || air(x, y, z + 1)) out.push(x + y * X + z * X * Y);
      }
  return out;
}

/**
 * What the stage draws of a run, and all it needs: per frame the cells that touch air and their codes, and the step it shows. The
 * worker sends it (its arrays move, they are not copied); the page then only places voxels.
 */
export interface HeroShow {
  name: string;
  size: [number, number, number];
  colors: number[];
  glow: boolean[];
  cells: Int32Array[];
  codes: Uint8Array[];
  steps: number[];
}

export function showOf(run: HeroRun): HeroShow {
  const cells: Int32Array[] = [];
  const codes: Uint8Array[] = [];
  for (const f of run.frames) {
    const seen = Int32Array.from(visibleCells(f));
    cells.push(seen);
    codes.push(Uint8Array.from(seen, (i) => f.cells[i]));
  }
  return { name: run.name, size: run.size, colors: run.colors, glow: run.glow, cells, codes, steps: run.frames.map((f) => f.step) };
}

/** The arrays of a show, to move them to the page instead of copying them. */
export const transferOf = (show: HeroShow): ArrayBuffer[] => [...show.cells, ...show.codes].map((a) => a.buffer as ArrayBuffer);
