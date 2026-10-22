// A castle with a moat and a drawbridge, written by hand as blocks + layout (structure.ts): the example
// of the third rendering layer, and the measure of what a hand-written MarkovJunior program gives.
//
// Blocks are 20×20×20 voxels; walls run through the middle of their block along x, with the moat's
// water on their outer (south) half, so that sides with the same socket have the same face:
//   "muro"  the wall slab (y 6..13, full height) plus the water strip outside it
//   "acqua" water only (z 0..1, full width)
//   "ponte" water plus the planks of the passage (x 4..15, z 2..3)
//   "mastio" the full stone face of the keep

import type { Node3, PaletteEntry } from '../mj3d/engine';
import type { Blockset, Layout } from '../mj3d/structure';

const STONE: Record<string, PaletteEntry> = {
  R: { name: 'pietra', color: '#8f8e96' },
  S: { name: 'pietra chiara', color: '#aaa9b1' },
  D: { name: 'pietra scura', color: '#686770' },
  A: { name: 'acqua', color: '#3c7cc8' },
  B: { name: 'acqua chiara', color: '#5d98da' },
};
const WOOD: Record<string, PaletteEntry> = {
  W: { name: 'legno', color: '#8a5d34' },
  K: { name: 'legno scuro', color: '#5e3d21' },
  I: { name: 'ferro', color: '#3e3e48' },
};

const box = (at: [number, number, number], size: [number, number, number], color: string, on?: string): Node3 => ({ type: 'shape', shape: 'box', at, size, color, ...(on ? { on } : {}) });
/** Water on the outer half (y 14..19), z 0..1. */
const moatSouth = box([9.5, 16.5, 0], [20, 6, 2], 'A', '.');
/** Stones of different shades, then glints on the water. */
const weather: Node3[] = [
  { type: 'prl', rules: [{ in: 'R', out: 'S', p: 0.14 }, { in: 'R', out: 'D', p: 0.08 }] },
  { type: 'prl', rules: [{ in: 'A .', out: 'B .', p: 0.12 }] },
];
/** Merlons on a wall top along x: half a merlon at each end, so that two walls make a whole one. */
const merlons = (z: number, y0 = 9.5, depth = 8): Node3[] => [0.5, 9.5, 18.5].map((x, i) => box([x, y0, z], [i === 1 ? 4 : 2, depth, 4], 'R', '.'));

const wall: Node3[] = [box([9.5, 9.5, 0], [20, 8, 16], 'R'), ...merlons(16), moatSouth];

export const CASTELLO: Blockset = {
  name: 'Castello con fossato',
  faces: {
    muro: 'lastra di pietra da y 6 a 13 (in mezzo al blocco), alta 16, merli fino a 20; acqua alta 2 sulla metà esterna (y 14..19)',
    acqua: 'acqua alta 2 (z 0..1) su tutta la larghezza',
    ponte: "acqua alta 2 su tutta la larghezza e il tavolato del passaggio (x 4..15, z 2..3)",
    mastio: 'pietra piena su tutta la faccia',
    tetto: 'la falda del tetto, a gradini, che sale verso il colmo',
    torre: 'sopra: la torre continua al livello di sopra',
  },
  // Water may run to the edge of the map; the bridge ends on the bank; the keep and its roof face the courtyard.
  open: ['acqua', 'ponte', 'mastio'],
  blocks: [
    {
      code: 'M',
      name: 'muro',
      role: 'muro',
      walk: false,
      sockets: { n: 'vuoto', e: 'muro', s: 'acqua', w: 'muro', u: 'vuoto' },
      program: { size: [20, 20, 20], palette: STONE, program: { type: 'sequence', children: [...wall, ...weather] } },
    },
    {
      code: 'T',
      name: 'torre',
      role: 'torre',
      walk: false,
      // The north-west corner of the ring: walls leave east and south, water outside (north and west).
      sockets: { n: 'acqua', e: 'muro', s: 'muro', w: 'acqua', u: 'torre' },
      program: {
        size: [20, 20, 20],
        palette: STONE,
        program: {
          type: 'sequence',
          children: [
            { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 0], size: [20, 20, 20], color: 'R' },
            box([9.5, 2.5, 0], [20, 6, 2], 'A', '.'),
            box([2.5, 9.5, 0], [6, 20, 2], 'A', '.'),
            // Feritoie: tagli scuri sul cilindro.
            box([9.5, 0, 8], [2, 2, 5], 'D', 'R'),
            box([0, 9.5, 8], [2, 2, 5], 'D', 'R'),
            ...weather,
          ],
        },
      },
    },
    {
      code: 'U',
      name: 'cima della torre',
      role: 'tetto',
      walk: false,
      sockets: { n: 'vuoto', e: 'vuoto', s: 'vuoto', w: 'vuoto', d: 'torre' },
      program: {
        size: [20, 20, 20],
        palette: { ...STONE, T: { name: 'coppi', color: '#a8473a' }, L: { name: 'coppi al sole', color: '#c8604c' } },
        program: {
          type: 'sequence',
          children: [
            { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 0], size: [20, 20, 6], color: 'R' },
            // Merli tutto attorno: si scava l'anello in alto a intervalli.
            { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 6], size: [20, 20, 3], color: 'R' },
            { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 6], size: [16, 16, 3], color: '.' },
            box([9.5, 0.5, 6], [4, 4, 3], '.', 'R'),
            box([9.5, 18.5, 6], [4, 4, 3], '.', 'R'),
            box([0.5, 9.5, 6], [4, 4, 3], '.', 'R'),
            box([18.5, 9.5, 6], [4, 4, 3], '.', 'R'),
            { type: 'shape', shape: 'cone', at: [9.5, 9.5, 6], size: [15, 15, 14], color: 'T' },
            { type: 'prl', rules: [{ in: 'T .', out: 'L .', p: 0.5 }] },
            ...weather,
          ],
        },
      },
    },
    {
      code: 'G',
      name: 'portone chiuso',
      role: 'porta',
      walk: false,
      sockets: { n: 'vuoto', e: 'muro', s: 'ponte', w: 'muro', u: 'vuoto' },
      actions: [{ label: 'apri il portone', to: 'H' }],
      program: {
        size: [20, 20, 20],
        palette: { ...STONE, ...WOOD },
        program: {
          type: 'sequence',
          children: [
            ...wall,
            // L'arco: un passaggio scavato nel muro, con la volta tonda.
            box([9.5, 9.5, 0], [10, 8, 9], '.', 'R'),
            { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 5], size: [10, 8, 9], color: '.', on: 'R' },
            box([9.5, 16.5, 2], [12, 6, 2], 'W', '.'),
            // Il battente: assi verticali con borchie, sul filo del muro.
            box([9.5, 12.5, 0], [10, 2, 12], 'W', '.'),
            { type: 'prl', rules: [{ in: 'W/.', out: 'K/.', p: 0.18 }], symmetry: 'none' },
            box([7, 13, 5], [1, 1, 1], 'I', 'W'),
            box([12, 13, 5], [1, 1, 1], 'I', 'W'),
            ...weather,
          ],
        },
      },
    },
    {
      code: 'H',
      name: 'portone aperto',
      role: 'porta',
      walk: true,
      sockets: { n: 'vuoto', e: 'muro', s: 'ponte', w: 'muro', u: 'vuoto' },
      actions: [{ label: 'chiudi il portone', to: 'G' }],
      program: {
        size: [20, 20, 20],
        palette: { ...STONE, ...WOOD },
        program: {
          type: 'sequence',
          children: [
            ...wall,
            box([9.5, 9.5, 0], [10, 8, 9], '.', 'R'),
            { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 5], size: [10, 8, 9], color: '.', on: 'R' },
            box([9.5, 16.5, 2], [12, 6, 2], 'W', '.'),
            // Ante spalancate contro i lati del passaggio, dentro.
            box([5, 4, 0], [1, 5, 12], 'W', '.'),
            box([14, 4, 0], [1, 5, 12], 'W', '.'),
            ...weather,
          ],
        },
      },
    },
    {
      code: 'P',
      name: 'ponte levatoio abbassato',
      role: 'ponte',
      walk: true,
      sockets: { n: 'ponte', e: 'acqua', s: 'ponte', w: 'acqua', u: 'vuoto' },
      actions: [{ label: 'alza il ponte', to: 'Q' }],
      program: {
        size: [20, 20, 20],
        palette: { ...STONE, ...WOOD },
        program: {
          type: 'sequence',
          children: [
            box([9.5, 9.5, 0], [20, 20, 2], 'A'),
            box([9.5, 9.5, 2], [12, 20, 2], 'W'),
            // Assi: una ogni tre più scura.
            { type: 'all', rules: [{ in: 'WWW', out: 'KWW' }], symmetry: 'none', steps: 1 },
            // Catene dai bordi verso la torre del portone.
            { type: 'shape', shape: 'line', at: [4, 18, 4], to: [4, 0, 14], color: 'I' },
            { type: 'shape', shape: 'line', at: [15, 18, 4], to: [15, 0, 14], color: 'I' },
            ...weather,
          ],
        },
      },
    },
    {
      code: 'Q',
      name: 'ponte levatoio alzato',
      role: 'ponte',
      walk: false,
      sockets: { n: 'ponte', e: 'acqua', s: 'ponte', w: 'acqua', u: 'vuoto' },
      actions: [{ label: 'abbassa il ponte', to: 'P' }],
      program: {
        size: [20, 20, 20],
        palette: { ...STONE, ...WOOD },
        program: {
          type: 'sequence',
          children: [
            box([9.5, 9.5, 0], [20, 20, 2], 'A'),
            // Il tavolato ritto contro il portone.
            box([9.5, 1, 2], [12, 2, 18], 'W'),
            { type: 'all', rules: [{ in: 'W W W', out: 'K W W' }], symmetry: 'none', steps: 1 },
            ...weather,
          ],
        },
      },
    },
    {
      code: 'A',
      name: 'fossato',
      role: 'acqua',
      walk: false,
      sockets: { n: 'acqua', e: 'acqua', s: 'acqua', w: 'acqua', u: 'vuoto' },
      program: { size: [20, 20, 20], palette: STONE, program: { type: 'sequence', children: [box([9.5, 9.5, 0], [20, 20, 2], 'A'), ...weather] } },
    },
    {
      code: 'K',
      name: 'mastio',
      role: 'muro',
      walk: false,
      sockets: { n: 'mastio', e: 'mastio', s: 'mastio', w: 'mastio' },
      program: {
        size: [20, 20, 20],
        palette: { ...STONE, F: { name: 'finestra', color: '#2a2430' }, Y: { name: 'luce alla finestra', color: '#e8c060' } },
        program: {
          type: 'sequence',
          children: [
            box([9.5, 9.5, 0], [20, 20, 20], 'R'),
            // Finestre al centro di ogni faccia (quelle tra due blocchi del mastio restano dentro).
            box([9.5, 0.5, 9], [4, 2, 6], 'F'),
            box([9.5, 18.5, 9], [4, 2, 6], 'F'),
            box([0.5, 9.5, 9], [2, 4, 6], 'F'),
            box([18.5, 9.5, 9], [2, 4, 6], 'F'),
            { type: 'prl', rules: [{ in: 'F', out: 'Y', p: 0.15 }] },
            // Cornice di pietra chiara in cima.
            box([9.5, 9.5, 18], [20, 20, 1], 'S', 'R'),
            ...weather,
          ],
        },
      },
    },
    {
      code: 'R',
      name: 'falda del tetto',
      role: 'tetto',
      walk: false,
      // The north-west quarter of a hipped roof: it rises towards the south-east corner.
      sockets: { n: 'vuoto', e: 'tetto', s: 'tetto', w: 'vuoto' },
      program: {
        size: [20, 20, 20],
        palette: { T: { name: 'coppi', color: '#a8473a' }, L: { name: 'coppi al sole', color: '#c8604c' }, E: { name: 'gronda', color: '#6e2e26' } },
        program: {
          type: 'sequence',
          children: [
            ...Array.from({ length: 10 }, (_, k) => box([(2 * k + 19) / 2, (2 * k + 19) / 2, 2 * k], [20 - 2 * k, 20 - 2 * k, 2], 'T')),
            { type: 'prl', rules: [{ in: 'T .', out: 'L .', p: 0.55 }] },
            box([9.5, 9.5, 0], [20, 20, 1], 'E', 'T'),
          ],
        },
      },
    },
  ],
};

/**
 * The layout, 10 × 10 tiles and 3 levels, in zones: moat all round, a ring of walls, the courtyard empty.
 * Which wall goes where, and turned how, and that the corners are towers, is not written here: the
 * collapse finds it from the sockets (water outside, courtyard inside). Only the unique pieces are
 * exact: the gate at a random point of the south wall with the drawbridge in front, the keep.
 */
export const CASTELLO_PIANTA: Layout = castle([10, 10, 3]);

/** The same castle at any size: concentric walls and several keeps when there is room. */
export function castle(size: [number, number, number]): Layout {
  const [X, Y] = size;
  const cx = (X - 1) / 2, cy = (Y - 1) / 2;
  // The keep covers whole tiles even when a side is odd.
  const kx = Math.floor(cx) + 0.5, ky = Math.floor(cy) + 0.5;
  const ring = (inset: number, code: string, w = X - 2 * inset, h = Y - 2 * inset): Node3 => ({ type: 'shape', shape: 'box', at: [cx, cy, 0], size: [w, h, 1], color: code });
  const big = X >= 30 && Y >= 30;
  return {
    name: 'Castello con fossato',
    size,
    zones: {
      A: { name: 'fossato', blocks: 'A' },
      W: { name: 'mura', blocks: 'MT' },
      V: { name: 'sopra le mura', blocks: 'U.' },
      R: { name: 'tetto del mastio', blocks: 'R' },
    },
    palette: { G: { block: 'G', rot: 0 }, B: { block: 'P', rot: 0 }, K: { block: 'K' } },
    program: {
      type: 'sequence',
      children: [
        // Fossato ovunque al piano terra, poi l'anello delle mura e il cortile vuoto.
        ring(0, 'A'),
        ring(1, 'W'),
        ring(2, '.'),
        // In un castello grande, un secondo fossato e una seconda cinta dentro il cortile.
        ...(big ? [ring(Math.floor(X / 4), 'A'), ring(Math.floor(X / 4) + 1, 'W'), ring(Math.floor(X / 4) + 2, '.')] : []),
        // Il portone in un punto a caso di un muro sud, con il ponte levatoio sul fossato davanti.
        { type: 'one', rules: [{ in: 'WWW/AAA', out: '*G*/*B*' }], symmetry: 'none', steps: big ? 2 : 1 },
        // Sopra le mura: la zona dove le torri continuano (il wfc mette le cime solo sulle torri).
        { type: 'all', rules: [{ in: 'W .', out: '* V' }], symmetry: 'none' },
        // Il mastio: 2 × 2 caselle, due piani, il tetto a padiglione sopra (le falde le gira il wfc);
        // in un castello grande, qualche mastio in più dove il cortile è libero.
        { type: 'shape', shape: 'box', at: [kx, ky, 0], size: [2, 2, 2], color: 'K' },
        { type: 'shape', shape: 'box', at: [kx, ky, 2], size: [2, 2, 1], color: 'R' },
        ...(big
          ? [
              {
                type: 'one' as const,
                symmetry: 'none' as const,
                steps: 6,
                rules: [{ in: '..../..../..../.... ..../..../..../.... ..../..../..../....', out: '..../.KK./.KK./.... ..../.KK./.KK./.... ..../.RR./.RR./....' }],
              },
            ]
          : []),
      ],
    },
  };
}
