// Web Worker for MarkovJunior Model Editor: compiles, runs, and meshes off-thread.

import { Mj3Error, type Grid3, type PaletteEntry, type Vec3 } from '../../src/mj/engine';
import { compileMjx } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import { meshVoxels, type MeshData } from '../../src/mj/mesh';
import { extractLineFromError } from './syntax';

export interface EditorBuildRequest {
  id: number;
  xml: string;
  seed: number;
  vpt: number;
  size?: Vec3;
  steps?: number;
}

export interface EditorBuildSuccess {
  id: number;
  ok: true;
  mesh: MeshData;
  grid: {
    X: number;
    Y: number;
    Z: number;
    solidCount: number;
    alphabet: string[];
  };
  palette: Record<string, PaletteEntry>;
  info: {
    steps: number;
    ms: number;
    finished: boolean;
    unused: string[];
    warnings: string[];
    triangles: number;
  };
  actions: Array<{ name: string; label?: string }>;
  animations: Array<{ name: string; frames: number }>;
}

export interface EditorBuildFailure {
  id: number;
  ok: false;
  error: string;
  errorLine: number;
}

export type EditorBuildResponse = EditorBuildSuccess | EditorBuildFailure;

const buffers = (m: MeshData) => [
  m.positions.buffer,
  m.normals.buffer,
  m.colors.buffer,
  m.indices.buffer,
  ...(m.sway ? [m.sway.buffer] : []),
  ...(m.glow ? [m.glow.buffer] : []),
];

self.onmessage = (ev: MessageEvent<EditorBuildRequest>) => {
  const q = ev.data;
  try {
    const m = compileMjx(q.xml, q.size ? { size: q.size } : {});
    const r = runMjx(m, q.seed, {
      deadline: 20_000,
      ...(q.steps ? { maxSteps: q.steps } : {}),
    });

    const g: Grid3 = r.grid;
    const pal = m.program.palette;
    const mesh = meshVoxels(g, pal, { vpt: q.vpt });

    let solidCount = 0;
    for (let i = 0; i < g.cells.length; i++) {
      if (g.cells[i] !== 0) {
        const symbol = g.alphabet[g.cells[i]];
        if (symbol && pal[symbol]?.color && !pal[symbol].hidden) {
          solidCount++;
        }
      }
    }

    const triangles = mesh.indices.length / 3;

    const res: EditorBuildSuccess = {
      id: q.id,
      ok: true,
      mesh,
      grid: {
        X: g.X,
        Y: g.Y,
        Z: g.Z,
        solidCount,
        alphabet: g.alphabet,
      },
      palette: pal,
      info: {
        steps: r.steps,
        ms: r.ms,
        finished: r.finished,
        unused: r.unused ?? [],
        warnings: m.warnings,
        triangles,
      },
      actions: m.actions.map((a) => ({ name: a.name, label: a.label })),
      animations: m.animations.map((a) => ({ name: a.name, frames: a.frames })),
    };

    const transfer = [g.cells.buffer, ...buffers(mesh)];
    (self as unknown as Worker).postMessage(res, transfer);
  } catch (e: unknown) {
    const msg = e instanceof Mj3Error ? e.message : e instanceof Error ? e.message : `errore: ${String(e)}`;
    const errorLine = extractLineFromError(msg);
    const failure: EditorBuildFailure = {
      id: q.id,
      ok: false,
      error: msg,
      errorLine,
    };
    (self as unknown as Worker).postMessage(failure);
  }
};
