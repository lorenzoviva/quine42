// 3D models from MarkovJunior's repository (github.com/mxgmn/MarkovJunior/tree/main/models, MIT licence,
// © 2022 Maxim Gumin), copied unchanged, with the size and steps that models.xml gives them. Only those
// that need no rule files or tiles (wfc): the lab's front-end must run them as they are. Since T334 also those
// that infer (field, temperature, observe, search), the 2D ones as slabs one voxel thick; `note` says what differs.

import type { Vec3 } from '../../../src/mj/engine';

const files = import.meta.glob('./*.xml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const xml = (name: string) => files[`./${name}.xml`];

export interface OfficialModel {
  name: string;
  xml: string;
  size: Vec3;
  /** models.xml's step limit (the GUI's animation length), when it gives one. */
  steps?: number;
  /** What is not as in the repository (a smaller box, a node the engine does not have yet). */
  note?: string;
}

const cube = (n: number): Vec3 => [n, n, n];

export const OFFICIAL: OfficialModel[] = ([
  { name: 'Growth', size: cube(29), steps: 3000 },
  { name: 'ParallelGrowth', size: cube(29), steps: 24 },
  { name: 'MazeGrowth', size: cube(27) },
  { name: 'MazeTrail', size: cube(27), steps: 1000 },
  { name: 'NoDeadEnds', size: cube(19) },
  { name: 'RegularSAW', size: cube(19) },
  { name: 'RegularSAWRestart', size: cube(19) },
  { name: 'OpenCave3D', size: cube(40) },
  { name: 'Hills', size: [40, 40, 12] },
  { name: 'River', size: cube(20) },
  { name: 'Voronoi', size: cube(60) },
  { name: 'StochasticVoronoi', size: cube(50) },
  { name: 'StrangeDungeon', size: cube(29) },
  { name: 'Noise', size: cube(24) },
  { name: 'Counting', size: cube(8) },
  { name: 'OddScale3D', size: cube(8) },
  // They infer (T334): potential fields with temperature, observations, a search.
  { name: 'Keys', size: cube(23) },
  { name: 'SoftPath', size: cube(80) },
  { name: 'StairsPath', size: cube(33), note: 'senza il map finale, che disegna le scale con tessere da file (fout)' },
  { name: 'Dwarves', size: [20, 20, 1], steps: 85 },
  { name: 'Division', size: [75, 75, 1] },
  { name: 'RegularPath', size: [79, 79, 1] },
  { name: 'GrowTo', size: [120, 120, 1], steps: 2000 },
  { name: 'CompleteSAW', size: [19, 19, 1] },
] as Array<Omit<OfficialModel, 'xml'>>).map((m) => ({ ...m, xml: xml(m.name) }));
