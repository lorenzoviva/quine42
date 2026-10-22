// The skeleton of a figure: the kernel moves its parts (legs and arms swing round their joints) to walk,
// turns the head, wags the tail; the renderer does it on the meshes of each limb.
//
// Parts come from the palette (`part`: gamba, braccio, testa, coda). Each connected piece of a part is
// a limb; its joint is where it meets the body (top for legs and arms, bottom for the head, the end
// nearest the body for a tail). Without parts, the lowest quarter of a figure is taken as its legs.

import { AIR, type Grid3, type PaletteEntry, type Part, type Vec3 } from './engine';

export interface Limb {
  part: Part;
  cells: number[];
  joint: Vec3;
  /** +1 or -1: which half of the gait the limb belongs to. */
  phase: number;
}

export interface Rig {
  limbs: Limb[];
  /** True when the parts were guessed (no `part` in the palette). */
  guessed: boolean;
}

const visible = (g: Grid3, palette: Record<string, PaletteEntry>) => g.alphabet.map((c) => c !== AIR && !!palette[c]?.color && !palette[c]?.hidden);

function components(g: Grid3, cells: Set<number>): number[][] {
  const XY = g.X * g.Y;
  const seen = new Set<number>();
  const out: number[][] = [];
  for (const start of cells) {
    if (seen.has(start)) continue;
    const comp: number[] = [];
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const c = stack.pop()!;
      comp.push(c);
      const x = c % g.X, y = Math.floor(c / g.X) % g.Y, z = Math.floor(c / XY);
      for (let dz = -1; dz <= 1; dz++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy, nz = z + dz;
            if (nx < 0 || ny < 0 || nz < 0 || nx >= g.X || ny >= g.Y || nz >= g.Z) continue;
            const n = nx + ny * g.X + nz * XY;
            if (cells.has(n) && !seen.has(n)) {
              seen.add(n);
              stack.push(n);
            }
          }
    }
    out.push(comp);
  }
  return out;
}

const coords = (g: Grid3, c: number): Vec3 => [c % g.X, Math.floor(c / g.X) % g.Y, Math.floor(c / (g.X * g.Y))];

export function rig(g: Grid3, palette: Record<string, PaletteEntry>): Rig {
  const vis = visible(g, palette);
  const byPart = new Map<Part, Set<number>>();
  const body: number[] = [];
  for (let i = 0; i < g.cells.length; i++) {
    if (!vis[g.cells[i]]) continue;
    const part = palette[g.alphabet[g.cells[i]]]?.part;
    if (part) (byPart.get(part) ?? byPart.set(part, new Set()).get(part)!).add(i);
    else body.push(i);
  }
  let guessed = false;
  if (!byPart.size) {
    // No skeleton given: the lowest quarter of the figure are its legs.
    const all = [...body];
    if (!all.length) return { limbs: [], guessed: true };
    const zs = all.map((c) => coords(g, c)[2]);
    const top = Math.max(...zs);
    const hip = Math.max(1, Math.round(top * 0.27));
    const legs = new Set(all.filter((c) => coords(g, c)[2] < hip));
    byPart.set('gamba', legs);
    body.length = 0;
    body.push(...all.filter((c) => !legs.has(c)));
    guessed = true;
  }
  const centre = (cells: number[]) => {
    const s = [0, 0, 0];
    for (const c of cells) coords(g, c).forEach((v, a) => (s[a] += v));
    return s.map((v) => v / Math.max(1, cells.length)) as Vec3;
  };
  const all = [...body, ...[...byPart.values()].flatMap((s) => [...s])];
  const [cx, cy] = centre(all);
  const limbs: Limb[] = [];
  for (const [part, set] of byPart) {
    let pieces = components(g, set);
    // A skirt or two legs touching: split the piece down the middle.
    if (part === 'gamba' && pieces.length === 1) {
      const left = pieces[0].filter((c) => coords(g, c)[0] < cx);
      const right = pieces[0].filter((c) => coords(g, c)[0] >= cx);
      if (left.length && right.length) pieces = [left, right];
    }
    const quadruped = part === 'gamba' && pieces.length >= 3;
    for (const cells of pieces) {
      const pts = cells.map((c) => coords(g, c));
      const [mx, my] = centre(cells);
      let joint: Vec3;
      if (part === 'testa') joint = [mx, my, Math.min(...pts.map((p) => p[2])) - 0.5];
      else if (part === 'coda') {
        const b = centre(body);
        const near = pts.reduce((a, p) => ((p[0] - b[0]) ** 2 + (p[1] - b[1]) ** 2 + (p[2] - b[2]) ** 2 < (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 ? p : a));
        joint = near;
      } else joint = [mx, my, Math.max(...pts.map((p) => p[2])) + 0.5];
      const side = mx < cx ? 1 : -1;
      const phase = part === 'braccio' ? -side : quadruped ? side * (my < cy ? 1 : -1) : side;
      limbs.push({ part, cells, joint, phase });
    }
  }
  return { limbs, guessed };
}
