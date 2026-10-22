// The wanderer (the player) written by hand, at any height: used to find how many voxels a person needs
// (lab/scripts/resolution.ts) and as an example of a figure with a skeleton.
// Faces +y. Legs and the free arm carry `part`, so the kernel can walk them; the arm holding the staff
// has no part (the staff would swing like a pendulum).

import type { Node3, Program3 } from '../mj3d/engine';

export function viandante(H: number, box?: [number, number, number]): Program3 {
  const u = H / 28;
  const r = (v: number) => Math.max(1, Math.round(v * u));
  const [X, Y, Z] = box ?? [r(16) + 2, r(12) + 2, H + 2];
  const cx = Math.floor(X / 2), cy = Math.floor(Y / 2);
  const shape = (shape: 'box' | 'ellipsoid' | 'cylinder' | 'cone', at: [number, number, number], size: [number, number, number], color: string, on?: string): Node3 => ({ type: 'shape', shape, at, size, color, ...(on ? { on } : {}) });
  return {
    name: `Viandante (${H} voxel)`,
    size: [X, Y, Z],
    palette: {
      G: { name: 'stivali', color: '#4a3424', part: 'gamba' },
      M: { name: 'mantello', color: '#3f6470' },
      N: { name: 'mantello al sole', color: '#5a8592' },
      O: { name: 'piega del mantello', color: '#2c4952' },
      C: { name: 'cappuccio', color: '#46707d' },
      S: { name: 'viso', color: '#e0b48c' },
      E: { name: 'occhi', color: '#1e1a22' },
      A: { name: 'braccio libero', color: '#3f6470', part: 'braccio' },
      Q: { name: 'mano libera', color: '#e0b48c', part: 'braccio' },
      H: { name: 'braccio col bastone', color: '#3f6470' },
      P: { name: 'mano', color: '#e0b48c' },
      W: { name: 'bastone', color: '#7a5532' },
      L: { name: 'cintura', color: '#6b4626' },
      K: { name: 'fibbia', color: '#d8b048' },
    },
    program: {
      type: 'sequence',
      children: [
        // Gambe: due colonne di stivali.
        shape('box', [cx - r(2), cy, 0], [r(2.5), r(3), r(9)], 'G'),
        shape('box', [cx + r(2), cy, 0], [r(2.5), r(3), r(9)], 'G'),
        // Mantello: una campana che si allarga in basso, sopra le gambe.
        shape('cone', [cx, cy, r(7)], [r(12), r(9), r(16)], 'M', '.'),
        shape('cylinder', [cx, cy, r(7)], [r(10), r(8), r(10)], 'M', '.'),
        // Braccia lungo i fianchi; mani in fondo.
        shape('cylinder', [cx - r(5.5), cy, r(10)], [r(3), r(3), r(7)], 'A', '.'),
        shape('box', [cx - r(5.5), cy, r(8.5)], [r(2), r(2), r(2)], 'Q', '.'),
        shape('cylinder', [cx + r(5.5), cy + r(1), r(10)], [r(3), r(3), r(7)], 'H', '.'),
        shape('box', [cx + r(5.5), cy + r(1.5), r(9)], [r(2), r(2), r(2)], 'P', '.'),
        // Testa: il cappuccio pieno, dentro il viso, poi un'apertura sul davanti che lo scopre.
        shape('ellipsoid', [cx, cy - r(0.5), r(16)], [r(12), r(10), r(12)], 'C', '.'),
        shape('ellipsoid', [cx, cy, r(16)], [r(10), r(8), r(10)], 'S', 'C'),
        shape('box', [cx, cy + r(4.5), r(16.5)], [r(8), r(3), r(5)], '.', 'C'),
        // Occhi: due voxel scuri sul davanti del viso.
        shape('box', [cx - r(2), cy + r(4), r(19)], [Math.max(1, r(1.2)), r(5), Math.max(1, r(1.5))], 'E', 'S'),
        shape('box', [cx + r(2), cy + r(4), r(19)], [Math.max(1, r(1.2)), r(5), Math.max(1, r(1.5))], 'E', 'S'),
        // Cintura con fibbia attorno alla vita del mantello.
        shape('cylinder', [cx, cy, r(11)], [r(10) + 1, r(8) + 1, Math.max(1, r(1))], 'L', 'M'),
        shape('box', [cx, cy + r(4), r(11)], [r(2), r(2), Math.max(1, r(1))], 'K', 'L'),
        // Bastone nella mano destra, da terra a sopra la testa.
        { type: 'shape', shape: 'line', at: [cx + r(5.5), cy + r(2.5), 0], to: [cx + r(5.5), cy + r(2.5), r(25)], r: u > 1.2 ? 0.6 : 0, color: 'W', on: '.' },
        // Pieghe: semi sul davanti del mantello che scendono verso il basso.
        { type: 'prl', rules: [{ in: 'M/.', out: 'O/.', p: 0.12 }], symmetry: 'none' },
        { type: 'one', rules: [{ in: 'M O', out: 'O O' }], steps: r(30), symmetry: 'none' },
        // Luce sulle spalle e sul cappuccio.
        { type: 'prl', rules: [{ in: 'M .', out: 'N .', p: 0.8 }] },
      ],
    },
  };
}
