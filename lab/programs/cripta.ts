// A dungeon on two levels written like MarkovJunior's DungeonGrowth (step 8D). Rooms are stamps cut in the
// rock with a margin round them; a markov loop floods what is connected and, when the flood stops, draws a
// path from the nearest room not yet connected, until every room is; a door wherever a corridor enters a
// room straight; a staircase joins the levels, and the upper level grows its corridors from where the
// stairs arrive. The blocks are few and plain (rock, floor, pillar, door, chest, stairs, puddle): the
// rest is a detail program on the composed voxels: rough rock faces, torches along the walls, rubble and
// bones on the floor, moss round the puddles.
//
// Blocks are 20 × 20 × 20 voxels: rock is 12 voxels tall, floors are flagstones 2 voxels thick. Rock has
// "*" on every side (it may touch anything); a door has rock on its flanks ("roccia"), so the collapse
// turns it across the corridor.

import type { Node3, PaletteEntry, Rule3, Vec3 } from '../mj3d/engine';
import type { Block, Blockset, Layout } from '../mj3d/structure';

const MAT: Record<string, PaletteEntry> = {
  R: { name: 'roccia', color: '#5d5763' },
  S: { name: 'roccia chiara', color: '#77707d' },
  D: { name: 'roccia scura', color: '#433e48' },
  F: { name: 'lastricato', color: '#8a7f6c' },
  G: { name: 'fughe', color: '#756a58' },
  W: { name: 'legno', color: '#7a5532' },
  K: { name: 'legno scuro', color: '#563a20' },
  I: { name: 'ferro', color: '#3c3c46' },
  O: { name: 'oro', color: '#f2c94c' },
  A: { name: 'acqua', color: '#2f5f8a' },
  B: { name: 'acqua chiara', color: '#4b82b0' },
};
const pal = (codes: string) => Object.fromEntries([...codes].map((c) => [c, MAT[c]]));
const span = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string, on?: string): Node3 => ({
  type: 'shape',
  shape: 'box',
  at: [(x0 + x1) / 2, (y0 + y1) / 2, z0],
  size: [x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1],
  color,
  ...(on ? { on } : {}),
});
const seq = (...children: Array<Node3 | Node3[]>): Node3 => ({ type: 'sequence', children: children.flat() });

const rock: Node3[] = [span(0, 19, 0, 19, 0, 11, 'R'), { type: 'prl', rules: [{ in: 'R', out: 'S', p: 0.1 }, { in: 'R', out: 'D', p: 0.12 }] }];
/** Flagstones: joints every five voxels, a few stones darker or lighter than the rest. */
const floor: Node3[] = [
  span(0, 19, 0, 19, 0, 1, 'F'),
  ...[0, 5, 10, 15].flatMap((v) => [span(v, v, 0, 19, 1, 1, 'G'), span(0, 19, v, v, 1, 1, 'G')]),
  // Some joints vanish (two stones become one), some stones are worn darker.
  { type: 'prl', rules: [{ in: 'G .', out: 'F .', p: 0.3 }] },
  { type: 'prl', rules: [{ in: 'F .', out: 'G .', p: 0.04 }] },
];

const block = (code: string, name: string, role: string, walk: boolean, sockets: Block['sockets'], palette: string, children: Node3[], actions?: Block['actions']): Block => ({
  code,
  name,
  role,
  walk,
  sockets,
  ...(actions ? { actions } : {}),
  program: { size: [20, 20, 20], palette: pal(palette), program: seq(children) },
});
const FLOOR = { n: 'pavimento', e: 'pavimento', s: 'pavimento', w: 'pavimento', u: 'piano', d: 'piano' };
/** A door across a corridor running north–south: rock on its flanks, the doorway x 6..13. */
const doorway: Node3[] = [...rock, span(6, 13, 0, 19, 0, 11, '.'), ...floor.map((n) => n), span(0, 5, 0, 19, 0, 11, 'R', 'FG'), span(14, 19, 0, 19, 0, 11, 'R', 'FG'), span(5, 14, 8, 11, 10, 11, 'S'), span(5, 5, 8, 11, 0, 9, 'S'), span(14, 14, 8, 11, 0, 9, 'S')];

export const CRIPTA: Blockset = {
  name: 'Cripta',
  faces: {
    pavimento: 'lastricato alto 2 su tutta la faccia, aria sopra',
    roccia: 'roccia piena alta 12',
    scala: 'sopra: la scala continua al livello di sopra',
  },
  open: ['roccia', 'pavimento'],
  blocks: [
    block('X', 'roccia', 'roccia', false, { n: '*', e: '*', s: '*', w: '*', u: 'piano', d: 'piano' }, 'RSD', rock),
    block('O', 'pavimento', 'pavimento', true, FLOOR, 'FG', floor),
    block('P', 'pilastro', 'pavimento', false, FLOOR, 'FGRSD', [
      ...floor,
      { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 2], size: [8, 8, 2], color: 'S' },
      { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 2], size: [6, 6, 10], color: 'R' },
      { type: 'shape', shape: 'cylinder', at: [9.5, 9.5, 10], size: [8, 8, 2], color: 'S' },
      { type: 'prl', rules: [{ in: 'R', out: 'D', p: 0.15 }] },
    ]),
    block('A', 'pozza', 'pavimento', true, FLOOR, 'FGAB', [...floor, { type: 'shape', shape: 'ellipsoid', at: [9.5, 9.5, 1], size: [13, 10, 1], color: 'A' }, { type: 'prl', rules: [{ in: 'A', out: 'B', p: 0.2 }] }]),
    block('C', 'scrigno chiuso', 'pavimento', true, FLOOR, 'FGWKIO', [...floor, span(7, 12, 8, 11, 2, 5, 'W'), span(7, 12, 8, 11, 5, 5, 'K'), span(7, 7, 8, 11, 2, 5, 'I'), span(12, 12, 8, 11, 2, 5, 'I'), span(9, 10, 11, 11, 3, 4, 'O')], [{ label: 'apri lo scrigno', to: 'H' }]),
    block('H', 'scrigno aperto', 'pavimento', true, FLOOR, 'FGWKIO', [...floor, span(7, 12, 8, 11, 2, 4, 'W'), span(8, 11, 9, 10, 4, 4, 'O'), span(7, 12, 7, 7, 5, 9, 'K'), span(7, 7, 8, 11, 2, 4, 'I'), span(12, 12, 8, 11, 2, 4, 'I')]),
    block('D', 'porta chiusa', 'porta', false, { n: 'pavimento', e: 'roccia', s: 'pavimento', w: 'roccia', u: 'piano', d: 'piano' }, 'RSDFGWKI', [
      ...doorway,
      span(6, 13, 9, 10, 2, 9, 'W'),
      { type: 'all', rules: [{ in: 'WW', out: 'KW' }], symmetry: 'none', steps: 1 },
      span(6, 13, 10, 10, 4, 4, 'I', 'WK'),
      span(6, 13, 10, 10, 7, 7, 'I', 'WK'),
    ], [{ label: 'apri la porta', to: 'E' }]),
    block('E', 'porta aperta', 'porta', true, { n: 'pavimento', e: 'roccia', s: 'pavimento', w: 'roccia', u: 'piano', d: 'piano' }, 'RSDFGWKI', [...doorway, span(6, 7, 3, 10, 2, 9, 'W')], [{ label: 'chiudi la porta', to: 'D' }]),
    block('U', 'scala che scende', 'scala', true, { n: 'pavimento', e: 'roccia', s: 'roccia', w: 'roccia', u: 'scala', d: 'piano' }, 'RSDFG', [
      ...rock,
      span(0, 19, 10, 19, 12, 19, 'R'),
      ...floor.slice(0, 1),
      span(0, 19, 0, 19, 0, 1, 'R', 'F'),
      // The well of the stairs, open up to the level above, and the steps rising towards the south.
      span(6, 13, 0, 19, 2, 19, '.'),
      span(6, 13, 0, 19, 0, 1, 'F'),
      ...Array.from({ length: 9 }, (_, k) => span(6, 13, 2 + 2 * k, 19, 2, 1 + 2 * (k + 1), 'F', '.')),
      { type: 'prl', rules: [{ in: 'F .', out: 'G .', p: 0.15 }] },
    ]),
    block('V', 'arrivo della scala', 'scala', true, { n: 'roccia', e: 'roccia', s: 'pavimento', w: 'roccia', u: 'piano', d: 'scala' }, 'RSDFG', [
      ...rock,
      // Looking down the well: there is floor only at the top of the steps, to the south.
      span(6, 13, 0, 15, 0, 11, '.'),
      span(6, 13, 16, 19, 0, 11, '.'),
      span(6, 13, 16, 19, 0, 1, 'F'),
      span(5, 5, 0, 15, 2, 4, 'I', 'RSD'),
      span(14, 14, 0, 15, 2, 4, 'I', 'RSD'),
    ]),
  ],
};

// ------------------------------------------------------------------ layout

/** A room w × d cut in the rock `rock`, with a margin of rock round it: its cells become `mark`. */
const room = (w: number, d: number, rock: string, mark: string, p = 1): Rule3 => {
  const rows = (f: (i: number, j: number) => string) => Array.from({ length: d + 2 }, (_, j) => Array.from({ length: w + 2 }, (_, i) => f(i, j)).join('')).join('/');
  return { in: rows(() => rock), out: rows((i, j) => (i > 0 && j > 0 && i <= w && j <= d ? mark : '*')), p };
};

/**
 * Rooms and corridors of one level, DungeonGrowth style. Codes of the level: `rock`, `r` rooms not yet
 * connected, `m` connected rooms, `k` corridors drawn, `n` connected corridors.
 */
const connect = (rock: string, r: string, m: string, k: string, n: string): Node3 => ({
  type: 'markov',
  children: [
    { type: 'all', rules: [{ in: `[${m}${n}]${r}`, out: `*${m}` }, { in: `[${m}${n}]${k}`, out: `*${n}` }] },
    { type: 'path', from: r, to: `${m}${n}`, on: rock, color: k, inertia: true, steps: 1000 },
  ],
});

/** X × Y tiles, two levels. Level 0: rock X, rooms r/m, corridors k/n; level 1: rock Y, rooms q/p, corridors j/o. */
export function cripta(size: Vec3 = [20, 20, 2]): Layout {
  const [X, Y] = size;
  const rooms = Math.max(4, Math.round((X * Y) / 45));
  const sizes = (rock: string, mark: string): Rule3[] => [room(3, 3, rock, mark), room(4, 3, rock, mark), room(3, 5, rock, mark), room(5, 4, rock, mark, 0.7), room(2, 2, rock, mark, 0.6), room(6, 3, rock, mark, 0.4)];
  return {
    name: 'Cripta',
    size,
    zones: {
      X: { name: 'roccia', blocks: 'X' },
      Y: { name: 'roccia di sopra', blocks: 'X' },
      x: { name: 'roccia della scala', blocks: 'X' },
      y: { name: 'roccia della scala', blocks: 'X' },
      M: { name: 'stanze', blocks: 'OOOOOOOOOA' },
      P: { name: 'pilastri', blocks: 'P' },
      C: { name: 'scrigni', blocks: 'C' },
      N: { name: 'corridoi', blocks: 'OOOOOOOOOOA' },
      d: { name: 'porte', blocks: 'DE' },
      U: { name: 'scala', blocks: 'U' },
      V: { name: 'arrivo della scala', blocks: 'V' },
    },
    palette: {},
    materials: MAT,
    program: seq(
      { type: 'shape', shape: 'box', at: [(X - 1) / 2, (Y - 1) / 2, 0], size: [X, Y, 1], color: 'X' },
      { type: 'shape', shape: 'box', at: [(X - 1) / 2, (Y - 1) / 2, 1], size: [X, Y, 1], color: 'Y' },
      // Rooms on both levels, each with rock round it.
      { type: 'one', rules: sizes('X', 'r'), steps: rooms },
      { type: 'one', rules: sizes('Y', 'q'), steps: rooms },
      // The staircase: its foot opens north onto level 0, its top opens south onto level 1; the rock round it
      // (x, y) is kept out of the corridors' way.
      { type: 'one', rules: [{ in: '*[Xr]*/XXX/XXX YYY/YYY/*[Yq]*', out: '*r*/xUx/xxx yyy/yVy/*p*' }], steps: 1 },
      // Level 0 grows from one room, level 1 from the top of the stairs.
      { type: 'one', rules: [{ in: 'r', out: 'm' }], steps: 1 },
      connect('X', 'r', 'm', 'k', 'n'),
      connect('Y', 'q', 'p', 'j', 'o'),
      // A door where a corridor enters a room straight, between rock.
      { type: 'prl', rules: [{ in: '*m*/XnX/*n*', out: '***/*d*/***', p: 0.7 }, { in: '*p*/YoY/*o*', out: '***/*d*/***', p: 0.7 }] },
      // The two levels speak the same language from here on.
      { type: 'all', rules: [{ in: '[mp]', out: 'M' }, { in: '[no]', out: 'N' }] },
      // Pillars in rows wherever a room is wide enough round them; a chest in a few rooms.
      { type: 'all', rules: [{ in: 'MMM/MMM/MMM', out: '***/*P*/***' }] },
      { type: 'one', rules: [{ in: 'MMM/MMM', out: '***/*C*' }], steps: Math.max(1, Math.round(rooms / 3)) },
    ),
    detail: {
      palette: {
        T: { name: 'fiamma', color: '#ffb347' },
        b: { name: 'ossa', color: '#e8e0cc' },
        M: { name: 'muschio', color: '#4f6a3e' },
        l: { name: 'luce sul pavimento', color: '#b8a070' },
      },
      unions: { '#': 'RSD', '_': 'FG' },
      program: seq(
        // Torches on the walls, at head height above the floor: a bracket and a flame.
        {
          type: 'one',
          rules: [{ in: ['#_', ...Array(7).fill('#.')].join(' '), out: ['*l', '**', '**', '**', '**', '*I', '*T', '*T'].join(' ') }],
          steps: Math.max(12, Math.round((X * Y) / 8)),
        },
        // The light of each torch on the floor below it.
        { type: 'prl', rules: [{ in: 'l_', out: '*l', p: 0.7 }], steps: 4 },
        // Rough rock: exposed faces lose stones, twice, so walls are never straight.
        { type: 'prl', rules: [{ in: '#.', out: '..', p: 0.25 }], steps: 3 },
        { type: 'prl', rules: [{ in: '# .', out: '. .', p: 0.2 }], steps: 2 },
        // Fallen stones at the foot of the walls, a few bones.
        { type: 'prl', rules: [{ in: '#_ ..', out: '** D*', p: 0.08 }] },
        { type: 'prl', rules: [{ in: '_ .', out: '* b', p: 0.0008 }] },
        // Moss round the puddles and up the nearest rock.
        { type: 'prl', rules: [{ in: '[AB]_', out: '*M', p: 0.5 }], steps: 2 },
        { type: 'prl', rules: [{ in: 'M[_#]', out: '*M', p: 0.3 }], steps: 2 },
      ),
    },
  };
}

export const CRIPTA_PIANTA: Layout = cripta();
