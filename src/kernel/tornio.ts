// The Sculptor's lathe in the Artist's gallery (T48a): browses the library of models,
// runs the chosen model step by step (MarkovJunior snapshots), renders four 3/4 photos,
// and presents the Artist's critique (vote and advice) and XML code for resculpting.

import { boxOf } from '../mj/classes';
import type { PaletteEntry, Snapshot } from '../mj/engine';
import type { VoxelGrid } from '../mj/mesh';
import { compileMjx, type MjxModel } from '../mj/model';
import { render, type Picture } from '../mj/photo';
import { runMjx } from '../mj/run';
import type { Forms, ModelInfo } from './forms';
import type { FileMap } from './types';

export interface TornioModelEntry {
  id: string;
  name: string;
  classe: string;
  autore: string;
  voto?: number;
  consigli: string[];
  problemi: string[];
  xml: string;
  path: string;
  info: ModelInfo;
}

export interface TornioShown {
  entry: TornioModelEntry;
  index: number;
  count: number;
  grid: VoxelGrid;
  palette: Record<string, PaletteEntry>;
  snapshots: Snapshot[];
  photos: Picture[];
}

/**
 * Collects and sorts all models available in the universe library (models/*.xml).
 */
export function tornioModels(files: FileMap, forms: Forms): TornioModelEntry[] {
  const ids: string[] = [];
  for (const path of Object.keys(files)) {
    const m = /^models\/([a-z0-9-]+)\.xml$/.exec(path);
    if (m) ids.push(m[1]);
  }
  ids.sort();

  return ids.map((id) => {
    const path = `models/${id}.xml`;
    const xml = files[path] ?? '';
    const info = forms.info(id) ?? { classe: 'oggetto' };
    const name = info.nome ?? id;
    const classe = info.classe ?? forms.classOf(id).id;
    const autore = info.autore ?? 'autore sconosciuto';
    const voto = info.voto;

    let consigli = info.consigli ? [...info.consigli] : [];
    let problemi = info.problemi ? [...info.problemi] : [];

    if (!consigli.length) {
      if (voto !== undefined && voto >= 8) {
        consigli = ['Volumi equilibrati e conformi alla classe', 'Palette cromatica armoniosa e silhouette leggibile'];
      } else if (voto !== undefined && voto < 7) {
        consigli = [
          'Migliorare la silhouette per una maggiore leggibilità dai quattro lati',
          'Aggiungere sfumature per enfatizzare profondità e dettagli',
        ];
        if (!problemi.length) {
          problemi = ['Proporzioni migliorabili', 'Dettagli poco evidenti da alcune angolazioni'];
        }
      } else if (voto !== undefined) {
        consigli = ['Rifinire i raccordi tra i volumi e variare i toni di luce per accentuare le forme'];
      } else {
        consigli = ['Modello conforme allo stile voxel del canone di QUINE42'];
      }
    }

    return {
      id,
      name,
      classe,
      autore,
      voto,
      consigli,
      problemi,
      xml,
      path,
      info,
    };
  });
}

/**
 * Runs a model step by step with snapshots and produces the 4 views.
 */
export function tornioExecute(
  entry: TornioModelEntry,
  forms: Forms,
  snapshotsCount = 20,
  seed = 1,
  index = 0,
  count = 1,
): TornioShown & { model: MjxModel } {
  const cls = forms.classOf(entry.id);
  const root = /<(?!!)[a-z]+\b[^>]*>/i.exec(entry.xml)?.[0] ?? '';
  const size = /\ssize="/.test(root) ? undefined : boxOf(cls);
  const m = compileMjx(entry.xml, size ? { size } : {});

  const r = runMjx(m, seed, { snapshots: snapshotsCount, deadline: 10_000 });
  const g = r.grid;

  let snapshots = r.snapshots ? [...r.snapshots] : [];
  if (!snapshots.length) {
    snapshots = [{ X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), step: r.steps }];
  }
  const last = snapshots[snapshots.length - 1];
  if (last.step !== r.steps || last.cells !== g.cells) {
    snapshots.push({ X: g.X, Y: g.Y, Z: g.Z, cells: new Uint8Array(g.cells), step: r.steps });
  }

  const photos: Picture[] = [];
  for (let view = 0; view < 4; view++) {
    photos.push(render(g, m.program.palette, view, { px: 2, top: 2, front: 2, outline: true, shadow: true, light: true, crop: true }));
  }

  const grid: VoxelGrid = { X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: g.alphabet };

  return {
    entry,
    index,
    count,
    grid,
    palette: m.program.palette,
    snapshots,
    photos,
    model: m,
  };
}
