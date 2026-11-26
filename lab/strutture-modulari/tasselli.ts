// The prototype of the modular structures (T522, docs/design/strutture-modulari.md): a set of bricks (the study's «tasselli») in the style of Neapolis's houses,
// written here by hand as the stand-in of what the Sculptor would write (in the game every brick is a MarkovJunior program, rule 11; here
// a few boxes in TypeScript, so that the prototype measures the composition and not the drawing).
//
// A cell is 2 × 2 tiles and one storey: 32 × 32 × 32 voxels at 16 voxels a tile (`STRUCTURE_VPT`), the floor slab at z 0-1, walls 2 thick
// inside the cell, a storey of 32 from floor to floor (the `PARTS` of the Architect). A brick may be more cells (the stair: 1 × 2 × 2), cut
// by the composer into cells whose inner faces only meet each other. The faces are never declared: the composer reads them from the voxels
// (facce.ts), as the kernel would.

export const VPT = 16;
/** Voxels of a cell side (2 tiles) and of a storey. */
export const C = 32;
export const H = 32;

/** The letters, with the colours of Neapolis's «Palazzina di tufo» (casa-comune-structure-f2e1f8de) and a bare concrete for the brutalist notes. */
export const PALETTE: Record<string, { name: string; color: string }> = {
  W: { name: 'intonaco ocra', color: 'd9a54a' },
  Z: { name: 'intonaco rosa', color: 'e6a8a0' },
  K: { name: 'cemento a vista', color: 'a39d90' },
  C: { name: 'cornicione di tufo', color: 'e6cf96' },
  F: { name: 'solaio', color: 'a89880' },
  R: { name: 'tetto piano', color: 'cbbfae' },
  L: { name: 'vetro', color: '4f7fa8' },
  G: { name: 'persiana verde', color: '2a6b34' },
  N: { name: 'stipite', color: '2e2a26' },
  Y: { name: 'ringhiera', color: '2a2a2a' },
  r: { name: 'basolato', color: '9a9690' },
  k: { name: 'gradino di tufo', color: '8c7a5e' },
  A: { name: 'antenna', color: 'e8e8e8' },
  p: { name: 'panni stesi', color: 'd8443a' },
};
/** The letters a body may not walk into are all of them: the air is "." (index 0). */
export const ALPHABET = ['.', ...Object.keys(PALETTE)];
const code = (ch: string) => {
  const i = ALPHABET.indexOf(ch);
  if (i < 0) throw new Error(`lettera sconosciuta ${ch}`);
  return i;
};

/** A block of voxels, x fastest, then y, then z from the bottom. */
export class Block {
  readonly cells: Uint8Array;
  constructor(readonly X: number, readonly Y: number, readonly Z: number) {
    this.cells = new Uint8Array(X * Y * Z);
  }
  get(x: number, y: number, z: number): number {
    return this.cells[x + y * this.X + z * this.X * this.Y];
  }
  set(x: number, y: number, z: number, ch: string | number): void {
    if (x < 0 || y < 0 || z < 0 || x >= this.X || y >= this.Y || z >= this.Z) return;
    this.cells[x + y * this.X + z * this.X * this.Y] = typeof ch === 'number' ? ch : code(ch);
  }
  /** Fills the box [x0, x1] × [y0, y1] × [z0, z1], ends included. */
  fill(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, ch: string | number): void {
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, z, ch);
  }
}

/** The four sides of a cell, as the directions of the solver (src/mj/wfc.ts: +x, +y, -x, -y). */
export type Side = 0 | 1 | 2 | 3;
export const PX: Side = 0, PY: Side = 1, NX: Side = 2, NY: Side = 3;

/** What a wall on a side holds: a plain wall with windows, a door, a loggia with its railing. */
type WallKind = 'window' | 'door' | 'loggia' | 'blind';

/** Writes a wall of the cell on `side`, two voxels thick inside the cell, from the slab to the top of the storey. */
function wall(b: Block, side: Side, kind: WallKind, z0: number, material = 'W'): void {
  // Draw as if the wall were on -y (y 0-1), then turn the coordinates.
  const put = (u: number, v: number, z: number, ch: string) => {
    // u along the wall (x for -y), v the depth into the cell (0 the outer face).
    const [x, y] = side === NY ? [u, v] : side === PY ? [C - 1 - u, C - 1 - v] : side === NX ? [v, C - 1 - u] : [C - 1 - v, u];
    b.set(x, y, z, ch);
  };
  const depth = kind === 'loggia' ? 8 : 0;
  for (let z = z0; z < H; z++)
    for (let u = 0; u < C; u++)
      for (let v = depth; v < depth + 2; v++) put(u, v, z, material);
  if (kind === 'loggia') {
    // The loggia: the wall set back by 8 on the slab, a railing on the face, the laundry hung across.
    for (let u = 0; u < C; u++) for (let z = z0; z < z0 + 6; z++) put(u, 0, z, 'Y');
    for (let u = 4; u < C - 4; u += 3) put(u, 3, z0 + 20, 'p');
  }
  if (kind === 'window' || kind === 'loggia') {
    // A window of 10 × 14 in the middle, with the green shutters open on both sides of it (on the outer face).
    for (let z = z0 + 8; z < z0 + 22; z++)
      for (let u = 11; u < 21; u++) {
        put(u, depth, z, 'L');
        put(u, depth + 1, z, '.');
      }
    if (kind === 'window') for (let z = z0 + 8; z < z0 + 22; z++) for (const u of [9, 10, 21, 22]) put(u, 0, z, 'G');
  }
  // The string course of tufo near the top of the storey, on the outer face (not across a doorway).
  if (kind !== 'loggia') for (let u = 0; u < C; u++) if (kind !== 'door' || u < 9 || u > 22) put(u, 0, H - 3, 'C');
  if (kind === 'door') {
    // A doorway of 12 × 27 (the Architect's door is 11 × 30 at 16; a body is 24 tall): the leaves open, the frame of dark wood.
    for (let z = z0; z < z0 + 27; z++) for (let u = 10; u < 22; u++) for (let v = 0; v < 2; v++) put(u, v, z, '.');
    for (let z = z0; z < z0 + 28; z++) for (const u of [9, 22]) put(u, 0, z, 'N');
    for (let u = 9; u < 23; u++) put(u, 0, z0 + 27, 'N');
  }
}

/** A parapet of tufo on a side of a roof, 6 high, capped. */
function parapet(b: Block, side: Side): void {
  const put = (u: number, v: number, z: number, ch: string) => {
    const [x, y] = side === NY ? [u, v] : side === PY ? [C - 1 - u, C - 1 - v] : side === NX ? [v, C - 1 - u] : [C - 1 - v, u];
    b.set(x, y, z, ch);
  };
  for (let u = 0; u < C; u++) for (let v = 0; v < 2; v++) for (let z = 2; z < 8; z++) put(u, v, z, z === 7 ? 'C' : 'W');
}

/** A brick: one cell (a bay of the fabric), or more cells (`size` in cells), and how often the weaver should draw it. */
export interface Brick {
  name: string;
  /** Cells along x, y, z. */
  size: [number, number, number];
  weight: number;
  /** Only on the ground storey, never there, or anywhere. */
  where: 'ground' | 'above' | 'any';
  /** A walkable cell whose top needs a ceiling (a room); otherwise the top is open (a roof, the sky). */
  covered: boolean;
  build: () => Block;
}

const cell = () => new Block(C, C, H);

/** A room cell: the slab, walls on `walls` (of their kinds), nothing on the other sides (the room goes on into the next cell). */
function room(walls: Partial<Record<Side, WallKind>>, material = 'W'): () => Block {
  return () => {
    const b = cell();
    b.fill(0, C - 1, 0, C - 1, 0, 1, 'F');
    for (const [s, kind] of Object.entries(walls)) wall(b, Number(s) as Side, kind!, 2, material);
    return b;
  };
}

/** A roof cell: the roof slab, a parapet on `edges`, an antenna or the laundry now and then. */
function roof(edges: Side[], extra?: 'antenna' | 'laundry'): () => Block {
  return () => {
    const b = cell();
    b.fill(0, C - 1, 0, C - 1, 0, 1, 'R');
    for (const s of edges) parapet(b, s);
    if (extra === 'antenna') b.fill(24, 24, 24, 24, 2, 20, 'A'), b.fill(20, 28, 24, 24, 18, 18, 'A');
    if (extra === 'laundry') for (let x = 6; x < 26; x += 3) b.set(x, 16, 14, 'p');
    return b;
  };
}

/** The street or the open ground of the ground storey: the paving. */
function street(): Block {
  const b = cell();
  b.fill(0, C - 1, 0, C - 1, 0, 0, 'r');
  return b;
}

/** The portico of the ground storey: the paving and four pillars of bare concrete; the room above is its ceiling. */
function portico(): Block {
  const b = street();
  for (const [x, y] of [[0, 0], [C - 4, 0], [0, C - 4], [C - 4, C - 4]]) b.fill(x, x + 3, y, y + 3, 1, H - 1, 'K');
  return b;
}

/**
 * The stair: 1 × 2 cells and two storeys. A ramp of tufo from the floor of the lower storey at y 0 to the floor of the upper one at y 63
 * (one voxel up every two: the step of the body is three), walls on its two sides, the stairwell open above it, closed behind (-y) on the
 * upper storey; one comes in from -y below and goes out at +y above.
 */
function stair(): Block {
  const b = new Block(C, 2 * C, 2 * H);
  for (let y = 0; y < 2 * C; y++) {
    const top = 2 + Math.floor((y * 32) / (2 * C - 1)); // 2 at y 0, 34 at y 63: the upper floor (32 + 2)
    b.fill(2, C - 3, y, y, 0, top - 1, 'k');
  }
  // The side walls, through both storeys, of bare concrete with a slit every storey.
  for (const x0 of [0, C - 2]) {
    b.fill(x0, x0 + 1, 0, 2 * C - 1, 0, 2 * H - 1, 'K');
    for (const z0 of [12, 12 + H]) b.fill(x0, x0 + 1, 26, 37, z0, z0 + 10, '.');
  }
  // Behind, on the upper storey: the wall that closes the stairwell.
  b.fill(0, C - 1, 0, 1, H, 2 * H - 1, 'K');
  return b;
}

/**
 * The core: a stair of two flights a storey in a tower of bare concrete, 1 × 2 cells and `storeys` storeys. On every storey the landing at
 * -y (y 2-13) with its door on +x; the first flight goes up along +y on the lane at -x to the half landing at +y, the second comes back on
 * the lane at +x to the landing of the storey above (16 up over 40: the body, 7 wide, never has more than a step under it). The top storey
 * has only its landing, with a railing on the stairwell. (A spiral in one cell of 2 × 2 tiles was tried first: the kernel's walk does not
 * climb it, it is too steep under a body; see the README.)
 */
function core(storeys: number): () => Block {
  return () => {
    const L = 2 * C;
    const b = new Block(C, L, storeys * H);
    for (let s = 0; s < storeys; s++) {
      const z0 = s * H;
      const top = s === storeys - 1;
      // The walls, with a slit on every side but the door's.
      b.fill(0, 1, 0, L - 1, z0, z0 + H - 1, 'K');
      b.fill(C - 2, C - 1, 0, L - 1, z0, z0 + H - 1, 'K');
      b.fill(0, C - 1, 0, 1, z0, z0 + H - 1, 'K');
      b.fill(0, C - 1, L - 2, L - 1, z0, z0 + H - 1, 'K');
      b.fill(0, 1, 30, 33, z0 + 12, z0 + 24, '.');
      b.fill(14, 17, L - 2, L - 1, z0 + 12, z0 + 24, '.');
      // The door on +x by the landing, with its frame.
      b.fill(C - 2, C - 1, 2, 13, z0 + 2, z0 + 28, '.');
      for (const y of [1, 14]) b.fill(C - 1, C - 1, y, y, z0 + 2, z0 + 29, 'N');
      b.fill(C - 1, C - 1, 1, 14, z0 + 29, z0 + 29, 'N');
      // The landing.
      b.fill(2, C - 3, 2, 13, z0, z0 + 1, 'k');
      if (top) {
        // The railing over the first lane's well and the parapet between the lanes; the second lane comes up free at x 17-29.
        b.fill(2, 14, 14, 14, z0 + 2, z0 + 7, 'Y');
        b.fill(15, 16, 14, 49, z0, z0 + 7, 'K');
        continue;
      }
      // The wall between the lanes, the flights and the half landing (12 deep: a body's box is 9 voxels, it turns there).
      b.fill(15, 16, 14, 49, z0, z0 + H - 1, 'K');
      for (let y = 14; y <= 49; y++) {
        const up = 2 + Math.round((16 * (y - 14)) / 35); // 2 → 18 on the first lane
        // On the ground storey the first flight is solid down to the ground: a floor with a hand of headroom under it would be one the
        // kernel's walk can take for the flight (T522: it stops there).
        b.fill(2, 14, y, y, s === 0 ? z0 : z0 + up - 2, z0 + up - 1, 'k');
        const back = 18 + Math.round((16 * (49 - y)) / 35); // 18 → 34 on the second, coming back
        b.fill(17, C - 3, y, y, z0 + back - 2, z0 + back - 1, 'k');
      }
      b.fill(2, C - 3, 50, L - 3, z0 + 16, z0 + 17, 'k');
    }
    return b;
  };
}

/** The set: Neapolis's houses taken apart (rooms with windows, doors, loggie, roofs with parapets), the portico and the stair. */
export const BRICKS: Brick[] = [
  { name: 'strada', size: [1, 1, 1], weight: 3, where: 'ground', covered: false, build: street },
  { name: 'aria', size: [1, 1, 1], weight: 6, where: 'above', covered: false, build: cell },
  { name: 'portico', size: [1, 1, 1], weight: 0.6, where: 'ground', covered: true, build: portico },
  { name: 'sala', size: [1, 1, 1], weight: 1.2, where: 'any', covered: true, build: room({}) },
  { name: 'stanza-muro', size: [1, 1, 1], weight: 2, where: 'any', covered: true, build: room({ [NY]: 'window' }) },
  { name: 'stanza-angolo', size: [1, 1, 1], weight: 2, where: 'any', covered: true, build: room({ [NY]: 'window', [PX]: 'window' }) },
  { name: 'stanza-corridoio', size: [1, 1, 1], weight: 0.8, where: 'any', covered: true, build: room({ [NY]: 'window', [PY]: 'window' }) },
  { name: 'stanza-testa', size: [1, 1, 1], weight: 0.8, where: 'any', covered: true, build: room({ [NY]: 'window', [PX]: 'window', [PY]: 'window' }) },
  { name: 'porta-muro', size: [1, 1, 1], weight: 0.8, where: 'any', covered: true, build: room({ [NY]: 'door' }) },
  { name: 'porta-angolo', size: [1, 1, 1], weight: 0.8, where: 'any', covered: true, build: room({ [NY]: 'door', [PX]: 'window' }) },
  // Its image in a mirror: a door and a wall side by side are not the same turned (the composer turns, it does not mirror).
  { name: 'porta-angolo-specchio', size: [1, 1, 1], weight: 0.8, where: 'any', covered: true, build: room({ [NY]: 'door', [NX]: 'window' }) },
  { name: 'porta-testa', size: [1, 1, 1], weight: 0.5, where: 'any', covered: true, build: room({ [NY]: 'door', [PX]: 'window', [PY]: 'window' }) },
  { name: 'villetta', size: [1, 1, 1], weight: 0.3, where: 'any', covered: true, build: room({ [NY]: 'door', [PX]: 'window', [PY]: 'window', [NX]: 'window' }) },
  { name: 'loggia', size: [1, 1, 1], weight: 0.8, where: 'above', covered: true, build: room({ [NY]: 'loggia' }) },
  { name: 'cemento-muro', size: [1, 1, 1], weight: 0.6, where: 'any', covered: true, build: room({ [NY]: 'blind' }, 'K') },
  { name: 'tetto', size: [1, 1, 1], weight: 1, where: 'above', covered: false, build: roof([]) },
  { name: 'tetto-bordo', size: [1, 1, 1], weight: 1.5, where: 'above', covered: false, build: roof([NY], 'laundry') },
  { name: 'tetto-angolo', size: [1, 1, 1], weight: 1.5, where: 'above', covered: false, build: roof([NY, PX], 'antenna') },
  { name: 'ponte', size: [1, 1, 1], weight: 0.6, where: 'above', covered: false, build: roof([NY, PY]) },
  { name: 'tetto-testa', size: [1, 1, 1], weight: 0.8, where: 'above', covered: false, build: roof([NY, PX, PY]) },
  { name: 'scala', size: [1, 2, 2], weight: 0.5, where: 'any', covered: true, build: stair },
  // The cores: only where the massing puts them (tessuto.ts), from the ground to the top of their block.
  { name: 'nucleo-2', size: [1, 2, 2], weight: 1, where: 'any', covered: true, build: core(2) },
  { name: 'nucleo-3', size: [1, 2, 3], weight: 1, where: 'any', covered: true, build: core(3) },
  { name: 'nucleo-4', size: [1, 2, 4], weight: 1, where: 'any', covered: true, build: core(4) },
];
