// The cases of the conformance bench (T500, lab/banco/conformita/README.md): shared by lab/scripts/conformita-mj.ts and tests/mj-conformita.test.ts.

import { DotnetRandom } from './dotnet-random';

type Vec3 = [number, number, number];

/** The programs of the differences (programmi/c*): their box and the interpreter's steps (1: only the first step). */
export const CASES: Array<{ name: string; size: Vec3; steps: number }> = [
  { name: 'c1-d-ignorato', size: [2, 1, 2], steps: 1000 },
  { name: 'c2-la-map-chiude', size: [4, 1, 1], steps: 1000 },
  { name: 'c3-path-dal-vicino', size: [10, 1, 1], steps: 1 },
  { name: 'c4-path-senza-colore', size: [4, 1, 1], steps: 1000 },
  { name: 'c5-conv-passi', size: [60, 1, 1], steps: 1000 },
  { name: 'c6-conv-moore-3d', size: [2, 2, 2], steps: 1000 },
  { name: 'c7-conv-non-registra', size: [2, 1, 1], steps: 1000 },
  { name: 'c8-unione-nel-nodo', size: [3, 1, 1], steps: 1000 },
  { name: 'c9-conv-2d-periodica', size: [5, 5, 1], steps: 1000 },
  { name: 'c10-prl-sovrapposte', size: [3, 1, 1], steps: 1 },
  { name: 'c11-path-per-spigoli', size: [3, 3, 1], steps: 1 },
];
export const SEEDS_OF_CASES = [1, 2, 3];

/** FNV-1a of a grid's text: what uscite.json keeps of a large grid. */
export function gridHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** The seeds caso/Program.cs is run with. */
export const CASO_SEEDS = [1, 2, 0, 42, 7, 123456789, 2147483647, -5, -2147483648, 1000000];

/** What DotnetRandom draws, in the order caso/Program.cs prints (Next, Next(n), NextDouble as its 64 bits). */
export function casoLine(seed: number, draws: number): string {
  const maxima = [1, 2, 3, 7, 10, 100, 1000, 65536, 1 << 30, 2147483647];
  const r = new DotnetRandom(seed);
  const buf = new DataView(new ArrayBuffer(8));
  let line = `SEED ${seed}`;
  for (let k = 0; k < draws; k++) {
    if (k % 3 === 0) line += ` N${r.next()}`;
    else if (k % 3 === 1) line += ` M${r.nextMax(maxima[k % maxima.length])}`;
    else {
      buf.setFloat64(0, r.nextDouble());
      line += ` D${buf.getBigInt64(0)}`;
    }
  }
  return line;
}

/** The examples of the bench (esempi/): programs written for both engines, with their box and steps. */
export const EXAMPLES: Array<{ name: string; size: Vec3; steps: number; seeds: number[] }> = [{ name: 'borgo-sentieri', size: [40, 40, 1], steps: 50000, seeds: [1, 2, 3] }];

/**
 * The 3D models of the original's repository (models.xml: the first line of each with d="3" or a height), their box and the interpreter's
 * steps (50000 where it says none, as its Program.cs; -1 is no limit). Their text is in mxgmn/, unchanged.
 */
export const REPO_3D: Array<{ name: string; size: Vec3; steps: number }> = [
  { name: 'Apartemazements', size: [8, 8, 8], steps: 50000 },
  { name: 'CarmaTower', size: [12, 12, 18], steps: 50000 },
  { name: 'ClosedSurface', size: [12, 12, 12], steps: 50000 },
  { name: 'ColoredKnots', size: [12, 12, 12], steps: 50000 },
  { name: 'Counting', size: [8, 8, 8], steps: 50000 },
  { name: 'DualRetraction3D', size: [27, 27, 27], steps: 50000 },
  { name: 'Escher', size: [8, 8, 8], steps: 50000 },
  { name: 'EscherSurface', size: [8, 8, 8], steps: 50000 },
  { name: 'Growth', size: [29, 29, 29], steps: 3000 },
  { name: 'Hills', size: [40, 40, 12], steps: 50000 },
  { name: 'Keys', size: [23, 23, 23], steps: 50000 },
  { name: 'Knots3D', size: [8, 8, 8], steps: 50000 },
  { name: 'MazeGrowth', size: [27, 27, 27], steps: 50000 },
  { name: 'MazeTrail', size: [27, 27, 27], steps: 1000 },
  { name: 'ModernHouse', size: [9, 9, 4], steps: 50000 },
  { name: 'NoDeadEnds', size: [19, 19, 19], steps: 50000 },
  { name: 'Noise', size: [24, 24, 24], steps: 50000 },
  { name: 'OddScale3D', size: [8, 8, 8], steps: 50000 },
  { name: 'OpenCave3D', size: [40, 40, 40], steps: 50000 },
  { name: 'OrientedEscher', size: [6, 6, 6], steps: 50000 },
  { name: 'ParallelGrowth', size: [29, 29, 29], steps: 24 },
  { name: 'Partitioning', size: [11, 11, 3], steps: 50000 },
  { name: 'PeriodicEscher', size: [8, 8, 8], steps: 50000 },
  { name: 'PillarsOfEternity', size: [9, 9, 9], steps: 50000 },
  { name: 'RegularSAW', size: [19, 19, 19], steps: 50000 },
  { name: 'RegularSAWRestart', size: [19, 19, 19], steps: 50000 },
  { name: 'River', size: [20, 20, 20], steps: 50000 },
  { name: 'SeaVilla', size: [10, 10, 4], steps: 50000 },
  { name: 'SelectLongKnots', size: [10, 10, 10], steps: 50000 },
  { name: 'SoftPath', size: [80, 80, 80], steps: 50000 },
  { name: 'StairsPath', size: [33, 33, 33], steps: 50000 },
  { name: 'StochasticVoronoi', size: [50, 50, 50], steps: -1 },
  { name: 'StrangeDungeon', size: [29, 29, 29], steps: 50000 },
  { name: 'SubmergedKnots', size: [12, 12, 12], steps: 50000 },
  { name: 'Surface', size: [10, 10, 10], steps: 50000 },
  { name: 'Voronoi', size: [60, 60, 60], steps: 50000 },
];
