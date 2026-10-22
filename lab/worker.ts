// Runs voxel programs off the main thread: a program that grows for too long freezes only the worker,
// which the page terminates. Structures are photographed here too (they can be large): with a detail
// program (or painted marks) the whole is composed in voxels and the program runs on it, otherwise
// block by block.

import { Mj3Error, run, type Program3 } from './mj3d/engine';
import { render, type RenderOptions } from './mj3d/render';
import { renderStructure } from './mj3d/composite';
import { DETAIL_CELLS, finish, LEVEL, type Blockset, type Layout, type Placement } from './mj3d/structure';
import { TILE } from './mj3d/scale';
import type { Vec3 } from './mj3d/engine';

type Job =
  | { id: number; kind?: 'run'; program: Program3; seed: number }
  | { id: number; kind: 'structure'; set: Blockset; placements: Array<{ x: number; y: number; z: number; rot: number; block: string }>; size: Vec3; seed: number; cut?: number; views: number[]; render: RenderOptions; layout?: Layout; cells?: string[] };

const post = (msg: unknown, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(msg, transfer);

self.onmessage = (e: MessageEvent<Job>) => {
  const job = e.data;
  try {
    if (job.kind === 'structure') {
      const byCode = new Map(job.set.blocks.map((b) => [b.code, b]));
      const placements: Placement[] = job.placements.flatMap((p) => {
        const block = byCode.get(p.block);
        return block ? [{ ...p, code: p.block, block }] : [];
      });
      const [X, Y, Z] = job.size;
      const levels = Math.min(Z, job.cut || Z);
      const whole = job.layout && job.cells && (job.layout.detail || job.layout.paint) && X * Y * levels * TILE * TILE * LEVEL <= DETAIL_CELLS;
      let pictures;
      if (whole) {
        const f = finish({ placements, cells: job.cells!, layout: job.layout! }, { seed: job.seed, cut: job.cut });
        pictures = job.views.map((view) => render(f.grid, f.palette, view, job.render));
      } else {
        // Block by block (composite.ts): never the structure's voxels all at once.
        pictures = job.views.map((view) => renderStructure(placements, job.size, { seed: job.seed, cut: job.cut, view, render: job.render }));
      }
      post({ id: job.id, pictures }, pictures.map((p) => p.data.buffer));
      return;
    }
    const r = run(job.program, job.seed);
    const { cells, alphabet, X, Y, Z } = r.grid;
    post({ id: job.id, grid: { X, Y, Z, cells, alphabet }, steps: r.steps, finished: r.finished, ms: r.ms }, [cells.buffer]);
  } catch (err) {
    post({ id: job.id, error: err instanceof Mj3Error ? err.message : `errore di esecuzione: ${(err as Error).message}`, mj: err instanceof Mj3Error });
  }
};
