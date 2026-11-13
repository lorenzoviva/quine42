// What a structure holds at a size (T338, T346, README.md): the parts one lives in (`habitableParts`), what it contains
// (`compositionOf`), the kernel's checks on them (`partErrors`), the areas its ground marks (`areasOf`) and the regularity of its
// battlements, at a seed, with the time.

import { areasOf, type AreaMap } from '../../../src/mj/areas';
import { compositionOf, partErrors, type Composition } from '../../../src/mj/check';
import { partVoxels } from '../../../src/mj/classes';
import type { Grid3, PaletteEntry } from '../../../src/mj/engine';
import type { MjxModel } from '../../../src/mj/model';
import { runMjx } from '../../../src/mj/run';
import { habitableParts, type HabitableMeasure } from '../../../src/kernel/forms';

/** A program at a box and a density, at a seed: what it holds and what it costs. */
export interface Giro {
  seme: number;
  ms: number;
  voxel: number;
  parti: HabitableMeasure;
  composizione: Composition;
  /** The areas of the ground, each with how many tiles (T346). */
  aree: Record<string, number>;
  errori: string[];
}

export function giro(model: MjxModel, vpt: number, seme: number): Giro & { grid: ReturnType<typeof runMjx>['grid'] } {
  const t0 = performance.now();
  const r = runMjx(model, seme, { deadline: 30_000 });
  const ms = Math.round(performance.now() - t0);
  const parti = habitableParts(r.grid, model.program.palette, vpt, partVoxels(vpt).storey.clear, 0, model.actions, seme);
  const composizione = compositionOf(r.grid, model.program.palette);
  const aree = conta(areasOf(r.grid, model.program.palette, vpt));
  return { seme, ms, voxel: composizione.voxels, parti, composizione, aree, errori: [...(r.finished ? [] : ['non finisce']), ...partErrors(parti, vpt)], grid: r.grid };
}

export const conta = (a: AreaMap): Record<string, number> => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.length]));

/** One line for the console and the report. */
export const riga = (g: Giro, vpt: number) =>
  `seme ${g.seme}: ${g.ms} ms, ${g.voxel} voxel, parti ${g.composizione.parts} (${g.composizione.letters} lettere); piani ${g.parti.storeys.join(',') || '—'}; stanze ${g.parti.rooms
    .map((s) => `z${s.z} lato ${s.room} (${(s.room / vpt).toFixed(2)} c) soffitto ${s.clear}`)
    .join(' · ')}; porte ${g.parti.doors.map((d) => `${d.width}×${d.height}`).join(' ') || '—'}; aree ${Object.entries(g.aree).map(([k, n]) => `${k} ${n}`).join(', ') || '—'}${g.errori.length ? `\n      ✗ ${g.errori.join('; ')}` : ''}`;

/**
 * The runs of merlons along the crests (T346): every maximal run of the letter in a row or a column at a height, by length; a
 * regular battlement has almost all its runs of one length (the corners and where two runs meet make a few longer).
 */
export function merlonRuns(g: Grid3, letter: string): Record<number, number> {
  const code = g.alphabet.indexOf(letter);
  const out: Record<number, number> = {};
  if (code < 0) return out;
  const XY = g.X * g.Y;
  const note = (n: number) => { if (n > 0) out[n] = (out[n] ?? 0) + 1; };
  // The lowest layer of every merlon: a merlon cell with nothing of the letter below it.
  const base = (i: number, z: number) => g.cells[i + z * XY] === code && (z === 0 || g.cells[i + (z - 1) * XY] !== code);
  for (let z = 0; z < g.Z; z++) {
    for (let y = 0; y < g.Y; y++) {
      let n = 0;
      for (let x = 0; x < g.X; x++) {
        if (base(x + y * g.X, z)) n++;
        else { if (n > 1) note(n); n = 0; }
      }
      if (n > 1) note(n);
    }
    for (let x = 0; x < g.X; x++) {
      let n = 0;
      for (let y = 0; y < g.Y; y++) {
        if (base(x + y * g.X, z)) n++;
        else { if (n > 1) note(n); n = 0; }
      }
      if (n > 1) note(n);
    }
  }
  return out;
}

/** The letters of a palette whose names say an animal (T346: a structure draws none). */
export const animalLetters = (palette: Record<string, PaletteEntry>): string[] =>
  Object.entries(palette).filter(([, p]) => /lana|muso|mucca|pecora|zampe|macchie|animal|sheep|cow|wool/i.test(p.name ?? '')).map(([k]) => k);
