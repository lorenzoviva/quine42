// Hand-written voxel programs, at the lab's scale (scale.ts: 20 voxels a tile, one box per class):
// few-shot examples for the sculptor and answers of the offline models. Each one shows a different way
// of building with rules (growth, cellular automata, paths) rather than drawing everything with shapes.

import type { Program3 } from './engine';
import { viandante } from '../programs/viandante';

export interface Example {
  id: string;
  /** Asset class (scale.ts). */
  kind: string;
  /** What it is, as a sculptor would be asked. */
  ask: string;
  keywords: string[];
  program: Program3;
}

export const EXAMPLES: Example[] = [
  {
    id: 'masso',
    kind: 'roccia',
    ask: 'Masso di granito coperto di muschio',
    keywords: ['roccia', 'masso', 'pietra', 'sasso', 'granito', 'rock', 'boulder', 'scoglio', 'macigno'],
    program: {
      name: 'Masso muschioso',
      size: [20, 20, 16],
      palette: {
        R: { name: 'granito', color: '#8c8d95' },
        S: { name: 'granito chiaro', color: '#a9aab2' },
        D: { name: 'crepa', color: '#5d5e68' },
        M: { name: 'muschio', color: '#5a8a3c' },
      },
      origin: 'R',
      program: {
        type: 'sequence',
        children: [
          // Crescita di Eden: la roccia si allarga a caso da un seme in tutte le direzioni (symmetry all:
          // anche in alto), poi ancora un po' solo di lato, perché un masso è più largo che alto.
          { type: 'one', rules: [{ in: 'R.', out: 'RR' }], steps: 900, symmetry: 'all' },
          { type: 'one', rules: [{ in: 'R.', out: 'RR' }], steps: 450, symmetry: 'xy' },
          // Levigatura: riempie i buchi, toglie le punte isolate.
          {
            type: 'conv',
            neighborhood: 'moore',
            steps: 3,
            rules: [
              { in: '.', out: 'R', neighbors: 'R', min: 14 },
              { in: 'R', out: '.', neighbors: 'R', max: 7 },
            ],
          },
          // Venature chiare e crepe scure.
          { type: 'prl', rules: [{ in: 'R', out: 'S', p: 0.1 }, { in: 'R', out: 'D', p: 0.04 }] },
          // Il muschio nasce in pochi punti in cima e si allarga a chiazze sulla pietra scoperta.
          { type: 'prl', rules: [{ in: '[RSD] .', out: 'M .', p: 0.03 }] },
          { type: 'one', rules: [{ in: 'M[RSD] ..', out: 'MM ..' }], steps: 160 },
        ],
      },
    },
  },
  {
    id: 'pino',
    kind: 'albero',
    ask: 'Pino alto con chioma a palchi',
    keywords: ['pino', 'abete', 'conifera', 'larice', 'cipresso', 'pine', 'fir'],
    program: {
      name: 'Pino',
      size: [40, 40, 60],
      palette: {
        T: { name: 'tronco', color: '#6b4a2e' },
        F: { name: 'aghi', color: '#2f6b3a' },
        L: { name: 'aghi al sole', color: '#4b8f4a' },
        N: { name: 'aghi in ombra', color: '#1f4a2c' },
      },
      program: {
        type: 'sequence',
        children: [
          // Il fusto: dritto, fino quasi alla cima.
          { type: 'shape', shape: 'cylinder', at: [20, 20, 0], size: [3, 3, 52], color: 'T' },
          // Palchi di aghi: coni sovrapposti, sempre più stretti verso la cima.
          { type: 'shape', shape: 'cone', at: [20, 20, 8], size: [32, 32, 16], color: 'F', on: '.' },
          { type: 'shape', shape: 'cone', at: [20, 20, 19], size: [26, 26, 14], color: 'F', on: '.' },
          { type: 'shape', shape: 'cone', at: [20, 20, 30], size: [20, 20, 13], color: 'F', on: '.' },
          { type: 'shape', shape: 'cone', at: [20, 20, 40], size: [13, 13, 12], color: 'F', on: '.' },
          { type: 'shape', shape: 'cone', at: [20, 20, 49], size: [7, 7, 10], color: 'F', on: '.' },
          // Bordi sfrangiati: gli aghi esposti all'aria cadono a caso, due volte.
          { type: 'conv', steps: 2, rules: [{ in: 'F', out: '.', neighbors: '.', min: 13, p: 0.45 }] },
          // Luce sopra, ombra sotto i palchi.
          { type: 'prl', rules: [{ in: 'F .', out: 'L .', p: 0.7 }, { in: '. F', out: '. N', p: 0.8 }] },
        ],
      },
    },
  },
  {
    id: 'quercia',
    kind: 'albero',
    ask: 'Quercia frondosa dal tronco robusto',
    keywords: ['quercia', 'albero', 'faggio', 'castagno', 'acero', 'olmo', 'tiglio', 'tree', 'oak', 'bosco', 'frutteto', 'melo'],
    program: {
      name: 'Quercia',
      size: [40, 40, 60],
      palette: {
        T: { name: 'corteccia', color: '#6e4b2f' },
        K: { name: 'corteccia scura', color: '#4e3420' },
        L: { name: 'foglie', color: '#3f7f3a' },
        H: { name: 'foglie al sole', color: '#68a84a' },
        S: { name: 'seme di ramo', hidden: true },
      },
      program: {
        type: 'sequence',
        children: [
          // Fusto largo alla base, poi qualche punto della chioma: da ciascuno un ramo scende fino al
          // legno più vicino (path).
          { type: 'shape', shape: 'cylinder', at: [20, 20, 0], size: [6, 6, 3], color: 'T' },
          { type: 'shape', shape: 'cylinder', at: [20, 20, 0], size: [4, 4, 26], color: 'T' },
          { type: 'shape', shape: 'box', at: [9, 21, 32], size: [1, 1, 1], color: 'S' },
          { type: 'shape', shape: 'box', at: [31, 18, 34], size: [1, 1, 1], color: 'S' },
          { type: 'shape', shape: 'box', at: [21, 9, 37], size: [1, 1, 1], color: 'S' },
          { type: 'shape', shape: 'box', at: [22, 31, 30], size: [1, 1, 1], color: 'S' },
          { type: 'shape', shape: 'box', at: [19, 20, 44], size: [1, 1, 1], color: 'S' },
          { type: 'path', from: 'S', to: 'T', on: '.', color: 'T', steps: 5 },
          // Chiome tonde attorno ai rami e in cima.
          { type: 'shape', shape: 'ellipsoid', at: [20, 20, 22], size: [28, 28, 26], color: 'L', on: '.' },
          { type: 'shape', shape: 'ellipsoid', at: [10, 21, 24], size: [16, 16, 14], color: 'L', on: '.S' },
          { type: 'shape', shape: 'ellipsoid', at: [30, 18, 26], size: [16, 16, 14], color: 'L', on: '.S' },
          { type: 'shape', shape: 'ellipsoid', at: [21, 10, 28], size: [16, 14, 14], color: 'L', on: '.S' },
          { type: 'shape', shape: 'ellipsoid', at: [22, 30, 22], size: [16, 14, 14], color: 'L', on: '.S' },
          { type: 'shape', shape: 'ellipsoid', at: [19, 20, 36], size: [16, 16, 14], color: 'L', on: '.S' },
          // Fronde irregolari: si erode la superficie, poi si chiudono i buchi.
          { type: 'conv', steps: 3, rules: [{ in: 'L', out: '.', neighbors: '.', min: 11, p: 0.55 }] },
          { type: 'conv', steps: 1, rules: [{ in: '.', out: 'L', neighbors: 'L', min: 16 }] },
          { type: 'prl', rules: [{ in: 'L .', out: 'H .', p: 0.75 }, { in: 'T', out: 'K', p: 0.3 }] },
        ],
      },
    },
  },
  {
    id: 'cespuglio',
    kind: 'cespuglio',
    ask: 'Cespuglio basso e folto con bacche rosse',
    keywords: ['cespuglio', 'siepe', 'arbusto', 'bush', 'rovo', 'macchia', 'felce', 'bacche'],
    program: {
      name: 'Cespuglio con bacche',
      size: [20, 20, 16],
      palette: {
        L: { name: 'foglie', color: '#3d7a35' },
        H: { name: 'foglie chiare', color: '#62a447' },
        D: { name: 'foglie scure', color: '#28552a' },
        B: { name: 'bacche', color: '#c8323c' },
      },
      origin: 'L',
      program: {
        type: 'sequence',
        children: [
          // Cresce in ogni direzione da un seme, poi ancora solo di lato: più largo che alto.
          { type: 'one', rules: [{ in: 'L.', out: 'LL' }], steps: 650, symmetry: 'all' },
          { type: 'one', rules: [{ in: 'L.', out: 'LL' }], steps: 350, symmetry: 'xy' },
          { type: 'conv', steps: 2, rules: [{ in: '.', out: 'L', neighbors: 'L', min: 14 }, { in: 'L', out: '.', neighbors: 'L', max: 6 }] },
          { type: 'prl', rules: [{ in: 'L .', out: 'H .', p: 0.6 }, { in: 'L', out: 'D', p: 0.2 }] },
          // Bacche solo in superficie: un voxel con aria accanto.
          { type: 'prl', rules: [{ in: '[LH].', out: 'B.', p: 0.05 }] },
        ],
      },
    },
  },
  {
    id: 'viandante',
    kind: 'persona',
    ask: 'Viandante con mantello e cappuccio grigio-blu petrolio e un bastone',
    keywords: ['viandante', 'persona', 'uomo', 'donna', 'pellegrino', 'mantello', 'contadin', 'fabbro', 'villag', 'mercante', 'cacciatore'],
    program: viandante(28, [20, 15, 30]),
  },
];

export function exampleFor(text: string, kind?: string): Example {
  const t = text.toLowerCase();
  return EXAMPLES.find((e) => e.keywords.some((k) => t.includes(k))) ?? EXAMPLES.find((e) => e.kind === kind) ?? EXAMPLES[0];
}
