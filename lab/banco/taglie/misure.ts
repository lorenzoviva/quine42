// What a structure holds at a size (T338, README.md): the parts one lives in (`habitableParts`), what it contains
// (`compositionOf`) and the kernel's checks on them (`partErrors`), at a seed, with the time.

import { compositionOf, partErrors, type Composition } from '../../../src/mj/check';
import { partVoxels } from '../../../src/mj/classes';
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
  errori: string[];
}

export function giro(model: MjxModel, vpt: number, seme: number): Giro & { grid: ReturnType<typeof runMjx>['grid'] } {
  const t0 = performance.now();
  const r = runMjx(model, seme, { deadline: 30_000 });
  const ms = Math.round(performance.now() - t0);
  const parti = habitableParts(r.grid, model.program.palette, vpt, partVoxels(vpt).storey.clear, 0, model.actions, seme);
  const composizione = compositionOf(r.grid, model.program.palette);
  return { seme, ms, voxel: composizione.voxels, parti, composizione, errori: [...(r.finished ? [] : ['non finisce']), ...partErrors(parti, vpt)], grid: r.grid };
}

/** One line for the console and the report. */
export const riga = (g: Giro, vpt: number) =>
  `seme ${g.seme}: ${g.ms} ms, ${g.voxel} voxel, parti ${g.composizione.parts} (${g.composizione.letters} lettere); piani ${g.parti.storeys.join(',') || '—'}; stanze ${g.parti.rooms
    .map((s) => `z${s.z} lato ${s.room} (${(s.room / vpt).toFixed(2)} c) soffitto ${s.clear}`)
    .join(' · ')}; porte ${g.parti.doors.map((d) => `${d.width}×${d.height}`).join(' ') || '—'}${g.errori.length ? `\n      ✗ ${g.errori.join('; ')}` : ''}`;
