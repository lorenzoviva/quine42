// A dungeon on two levels, written by hand: corridor blocks with sockets, and a layout where the wave
// function collapse does most of the work (the program only fixes the rock border, the entrance hall and
// one staircase). Sockets:
//   "corridoio" rock up to z 11 with the channel x 6..13 open above a floor at z 0..1
//   "roccia"    rock up to z 11, full
//   up/down     "piano" for every block; a staircase says "scala" upwards, its landing "scala" downwards,
//               so the collapse must put one on top of the other.

import type { Node3, PaletteEntry } from '../mj3d/engine';
import type { Block, Blockset, Layout } from '../mj3d/structure';

const P: Record<string, PaletteEntry> = {
  R: { name: 'roccia', color: '#5b5560' },
  S: { name: 'roccia chiara', color: '#726b78' },
  D: { name: 'roccia scura', color: '#423d47' },
  F: { name: 'lastricato', color: '#8a7f6c' },
  G: { name: 'lastricato scuro', color: '#6f6556' },
  Y: { name: 'torcia', color: '#ffb347' },
  W: { name: 'legno', color: '#7a5532' },
  I: { name: 'ferro', color: '#3e3e48' },
};

const box = (at: [number, number, number], size: [number, number, number], color: string, on?: string): Node3 => ({ type: 'shape', shape: 'box', at, size, color, ...(on ? { on } : {}) });
const rock: Node3 = box([9.5, 9.5, 0], [20, 20, 12], 'R');
const floor: Node3 = box([9.5, 9.5, 0], [20, 20, 2], 'F', 'R');
/** Carves the channel from the centre to a side (or the centre itself). */
const arm = (side: 'n' | 'e' | 's' | 'w' | 'c'): Node3 =>
  side === 'n' ? box([9.5, 4, 2], [8, 9, 10], '.') : side === 's' ? box([9.5, 15, 2], [8, 9, 10], '.') : side === 'w' ? box([4, 9.5, 2], [9, 8, 10], '.') : side === 'e' ? box([15, 9.5, 2], [9, 8, 10], '.') : box([9.5, 9.5, 2], [8, 8, 10], '.');
/** Flagstones with dark joints, stones of different shades, a torch now and then on a wall over the floor. */
const finish: Node3[] = [
  { type: 'prl', rules: [{ in: 'F', out: 'G', p: 0.25 }, { in: 'R', out: 'S', p: 0.1 }, { in: 'R', out: 'D', p: 0.1 }] },
  { type: 'one', rules: [{ in: '[RSD]. [RSD].', out: '** Y*' }], steps: 1 },
];
const floorOnly = (children: Node3[]): Node3 => ({ type: 'sequence', children: [rock, floor, ...children, ...finish] });

const corridor = (code: string, name: string, sides: Array<'n' | 'e' | 's' | 'w'>): Block => ({
  code,
  name,
  role: 'corridoio',
  walk: true,
  sockets: { n: sides.includes('n') ? 'corridoio' : 'roccia', e: sides.includes('e') ? 'corridoio' : 'roccia', s: sides.includes('s') ? 'corridoio' : 'roccia', w: sides.includes('w') ? 'corridoio' : 'roccia', u: 'piano', d: 'piano' },
  program: { size: [20, 20, 20], palette: P, program: floorOnly([arm('c'), ...sides.map(arm)]) },
});

export const SOTTERRANEO: Blockset = {
  name: 'Sotterraneo',
  faces: {
    corridoio: 'roccia alta 12 con il canale x 6..13 aperto sopra un pavimento a z 0..1',
    roccia: 'roccia piena alta 12',
    scala: 'sopra: la scala continua al livello di sopra',
  },
  // The rock may face the edge of the map.
  open: ['roccia'],
  blocks: [
    {
      code: 'X',
      name: 'roccia',
      role: 'roccia',
      walk: false,
      sockets: { n: 'roccia', e: 'roccia', s: 'roccia', w: 'roccia', u: 'piano', d: 'piano' },
      program: { size: [20, 20, 20], palette: P, program: { type: 'sequence', children: [rock, ...finish] } },
    },
    corridor('I', 'corridoio', ['n', 's']),
    corridor('L', 'curva', ['n', 'e']),
    corridor('T', 'bivio', ['e', 's', 'w']),
    corridor('+', 'crocevia', ['n', 'e', 's', 'w']),
    corridor('E', 'vicolo cieco', ['n']),
    {
      code: 'H',
      name: 'sala',
      role: 'stanza',
      walk: true,
      sockets: { n: 'corridoio', e: 'corridoio', s: 'corridoio', w: 'corridoio', u: 'piano', d: 'piano' },
      actions: [{ label: 'apri lo scrigno', to: 'O' }],
      program: {
        size: [20, 20, 20],
        palette: P,
        program: floorOnly([
          box([9.5, 9.5, 2], [16, 16, 10], '.'),
          ...(['n', 'e', 's', 'w'] as const).map(arm),
          // Quattro pilastri e uno scrigno chiuso nel mezzo.
          ...[[4, 4], [15, 4], [4, 15], [15, 15]].map(([x, y]) => box([x, y, 2], [2, 2, 10], 'S')),
          box([9.5, 9.5, 2], [4, 3, 3], 'W'),
          box([9.5, 9.5, 4], [4, 3, 1], 'I', 'W'),
        ]),
      },
    },
    {
      code: 'O',
      name: 'sala con lo scrigno aperto',
      role: 'stanza',
      walk: true,
      sockets: { n: 'corridoio', e: 'corridoio', s: 'corridoio', w: 'corridoio', u: 'piano', d: 'piano' },
      program: {
        size: [20, 20, 20],
        palette: { ...P, K: { name: 'oro', color: '#f2c94c' } },
        program: floorOnly([
          box([9.5, 9.5, 2], [16, 16, 10], '.'),
          ...(['n', 'e', 's', 'w'] as const).map(arm),
          ...[[4, 4], [15, 4], [4, 15], [15, 15]].map(([x, y]) => box([x, y, 2], [2, 2, 10], 'S')),
          box([9.5, 9.5, 2], [4, 3, 3], 'W'),
          box([9.5, 9.5, 4], [2, 1, 1], 'K', '.'),
          box([9.5, 8, 4], [4, 1, 4], 'W', '.'),
        ]),
      },
    },
    {
      code: 'U',
      name: 'scala che sale',
      role: 'scala',
      walk: true,
      sockets: { n: 'corridoio', e: 'roccia', s: 'roccia', w: 'roccia', u: 'scala', d: 'piano' },
      program: {
        size: [20, 20, 20],
        palette: P,
        program: {
          type: 'sequence',
          children: [
            rock,
            box([9.5, 14.5, 12], [20, 10, 8], 'R'),
            floor,
            arm('n'),
            // Il pozzo della scala, aperto fino al livello di sopra, e i gradini che salgono verso sud.
            box([9.5, 12.5, 2], [8, 14, 18], '.'),
            ...Array.from({ length: 7 }, (_, k) => box([9.5, 7 + 2 * k, 2], [8, 2, 3 * (k + 1)], 'F', '.')),
            ...finish,
          ],
        },
      },
    },
    {
      code: 'V',
      name: 'arrivo della scala',
      role: 'scala',
      walk: true,
      sockets: { n: 'roccia', e: 'roccia', s: 'corridoio', w: 'roccia', u: 'piano', d: 'scala' },
      program: {
        size: [20, 20, 20],
        palette: P,
        program: {
          type: 'sequence',
          children: [
            rock,
            // Si vede giù nel pozzo: il pavimento c'è solo in cima ai gradini, a sud.
            box([9.5, 17.5, 0], [8, 4, 2], 'F'),
            box([9.5, 9.5, 0], [8, 15, 12], '.'),
            arm('s'),
            box([9.5, 17.5, 0], [8, 4, 2], 'F'),
            ...finish,
          ],
        },
      },
    },
  ],
};

/** 8 × 8 tiles, 2 levels: rock all round, the hall and a staircase fixed, the rest chosen by the collapse. */
export const SOTTERRANEO_PIANTA: Layout = {
  name: 'Sotterraneo su due livelli',
  size: [8, 8, 2],
  palette: {
    X: { block: 'X' },
    I: { block: 'I', rot: 0 },
    i: { block: 'I', rot: 1 },
    L: { block: 'L', rot: 0 },
    l: { block: 'L', rot: 1 },
    J: { block: 'L', rot: 2 },
    j: { block: 'L', rot: 3 },
    T: { block: 'T', rot: 0 },
    t: { block: 'T', rot: 1 },
    Y: { block: 'T', rot: 2 },
    y: { block: 'T', rot: 3 },
    '+': { block: '+' },
    E: { block: 'E', rot: 0 },
    e: { block: 'E', rot: 1 },
    F: { block: 'E', rot: 2 },
    f: { block: 'E', rot: 3 },
    H: { block: 'H' },
    U: { block: 'U', rot: 0 },
    u: { block: 'U', rot: 2 },
    V: { block: 'V', rot: 0 },
    v: { block: 'V', rot: 2 },
  },
  program: {
    type: 'sequence',
    children: [
      // Tutto da decidere (?), dentro un bordo di roccia.
      { type: 'shape', shape: 'box', at: [3.5, 3.5, 0], size: [8, 8, 2], color: 'X' },
      { type: 'shape', shape: 'box', at: [3.5, 3.5, 0], size: [6, 6, 2], color: '?' },
      // La sala d'ingresso, e una scala (con il suo arrivo sopra) in un punto a caso.
      { type: 'shape', shape: 'box', at: [2, 4, 0], size: [1, 1, 1], color: 'H' },
      { type: 'one', rules: [{ in: '? ?', out: 'U V' }, { in: '? ?', out: 'u v' }], symmetry: 'none', steps: 1 },
    ],
  },
  // Everything marked ? is chosen by the collapse, among these exact turns (rock weighs four times).
  zones: { '?': { name: 'sotterraneo', codes: 'XXXXIiLlJjTtYy+EeFfHUuVv' } },
};
