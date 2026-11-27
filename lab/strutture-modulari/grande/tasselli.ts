// The large set of bricks of the second trial of the modular structures (T543, docs/design/strutture-modulari.md § 10-11): 50 bricks in each
// of three styles in the spirit of Neapolis (the «palazzina» of plastered tufo, the «case popolari» of bare concrete all alike, the white
// «villa»), 151 with the air. Written here as parametric TypeScript models, the stand-in of the programs the Sculptor would write (in the
// game every brick is a MarkovJunior program, rule 11); the faces are never declared: facce.ts reads them from the voxels, as the kernel would.
//
// The bay (the study's «vano») is 2 × 2 tiles and one storey, 32 × 32 × 32 voxels at 16 a tile, as in T522: the floor slab at z 0-1, walls
// 2 thick inside the bay. What changes from T522: rooms are made of several bays (a 9-slice of corner, edge and middle bays whose open sides
// meet: rooms of 2 × 2 bays, 4 × 4 tiles, and more), corridors whose ends are doorways (so a corridor never melts into a room), a stair core
// in segments that stack to any height and ends in a turret on the roof (the roofs reached), an outdoor stair that climbs to a low roof,
// bridges, porticoes, roofs with parapets on any of their sides and what stands on them.

export const VPT = 16;
/** Voxels of a bay side (2 tiles) and of a storey. */
export const C = 32;
export const H = 32;

export type Style = 'palazzina' | 'popolare' | 'villa';
export const STYLES: Style[] = ['palazzina', 'popolare', 'villa'];

/** The letters of the three styles, one alphabet (the air is "." , index 0). */
export const PALETTE: Record<string, { name: string; color: string }> = {
  // shared
  F: { name: 'solaio', color: 'a89880' },
  L: { name: 'vetro', color: '4f7fa8' },
  N: { name: 'telaio', color: '2e2a26' },
  Y: { name: 'ringhiera', color: '2a2a2a' },
  A: { name: 'antenna', color: 'e8e8e8' },
  p: { name: 'panni stesi', color: 'd8443a' },
  q: { name: 'panni bianchi', color: 'f4f1e8' },
  g: { name: 'prato', color: '6f9a4a' },
  h: { name: 'chioma', color: '3f7a3a' },
  n: { name: 'tronco', color: '6b4a2e' },
  e: { name: 'lampione', color: 'f6d878' },
  // the palazzina of tufo
  W: { name: 'intonaco ocra', color: 'd9a54a' },
  Z: { name: 'intonaco rosa', color: 'e6a8a0' },
  C: { name: 'cornicione di tufo', color: 'e6cf96' },
  G: { name: 'persiana verde', color: '2a6b34' },
  R: { name: 'lastrico', color: 'cbbfae' },
  T: { name: 'tufo', color: 'c9a86a' },
  k: { name: 'gradino di piperno', color: '6e6a64' },
  r: { name: 'basolato', color: '8e8a84' },
  // the case popolari of bare concrete
  K: { name: 'cemento a vista', color: 'a39d90' },
  J: { name: 'cemento scuro', color: '7d786e' },
  U: { name: 'pannello azzurro', color: '5b8aa0' },
  E: { name: 'guaina del tetto', color: '8a8278' },
  a: { name: 'asfalto', color: '5c5a58' },
  s: { name: 'scalino di cemento', color: '918b80' },
  // the villa
  V: { name: 'intonaco bianco', color: 'f2efe6' },
  S: { name: 'pietra', color: 'b8ad98' },
  X: { name: 'cotto', color: 'c0683e' },
  w: { name: 'legno', color: '8a5a32' },
  b: { name: 'balaustra', color: 'e0dbcf' },
  v: { name: 'bouganville', color: 'b0407a' },
  m: { name: 'maiolica', color: '3a7ab8' },
  c: { name: 'ghiaia', color: 'd8cdb4' },
};
export const ALPHABET = ['.', ...Object.keys(PALETTE)];
const CODE = new Map(ALPHABET.map((ch, i) => [ch, i]));
const code = (ch: string) => {
  const i = CODE.get(ch);
  if (i === undefined) throw new Error(`lettera sconosciuta ${ch}`);
  return i;
};

/** A block of voxels, x fastest, then y, then z from the bottom. */
export class Block {
  readonly cells: Uint8Array;
  constructor(readonly X: number, readonly Y: number, readonly Z: number, cells?: Uint8Array) {
    this.cells = cells ?? new Uint8Array(X * Y * Z);
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
    const v = typeof ch === 'number' ? ch : code(ch);
    for (let z = Math.max(0, z0); z <= Math.min(this.Z - 1, z1); z++)
      for (let y = Math.max(0, y0); y <= Math.min(this.Y - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(this.X - 1, x1); x++) this.cells[x + y * this.X + z * this.X * this.Y] = v;
  }
}

/** The four sides of a bay, as the directions of the solver (src/mj/wfc.ts: +x, +y, -x, -y). */
export type Side = 0 | 1 | 2 | 3;
export const PX: Side = 0, PY: Side = 1, NX: Side = 2, NY: Side = 3;

/** Draws on side `side` of the bay at (ox, oy, oz) voxels of a block: u along the side (0-31), v the depth from the outer face. */
const onSide = (b: Block, side: Side, ox = 0, oy = 0, oz = 0) => (u: number, v: number, z: number, ch: string) => {
  const [x, y] = side === NY ? [u, v] : side === PY ? [C - 1 - u, C - 1 - v] : side === NX ? [v, C - 1 - u] : [C - 1 - v, u];
  b.set(ox + x, oy + y, oz + z, ch);
};

// ---------------------------------------------------------------- the three styles

interface Kit {
  style: Style;
  /** Plaster of the walls, and a second one for some bricks. */
  wall: string;
  wall2: string;
  /** The string course near the top of a storey, and the cap of a parapet. */
  trim: string;
  slab: string;
  roof: string;
  parapet: string;
  /** The stair cores and the stairs. */
  core: string;
  tread: string;
  paving: string;
  yard: string;
  pillar: string;
  railing: string;
  /** How a window looks: green shutters, a ribbon of glass, a tall French window. */
  window: 'shutters' | 'ribbon' | 'tall';
}

export const KITS: Record<Style, Kit> = {
  palazzina: { style: 'palazzina', wall: 'W', wall2: 'Z', trim: 'C', slab: 'F', roof: 'R', parapet: 'W', core: 'T', tread: 'k', paving: 'r', yard: 'r', pillar: 'T', railing: 'Y', window: 'shutters' },
  popolare: { style: 'popolare', wall: 'K', wall2: 'U', trim: 'J', slab: 'J', roof: 'E', parapet: 'K', core: 'K', tread: 's', paving: 'a', yard: 'a', pillar: 'J', railing: 'Y', window: 'ribbon' },
  villa: { style: 'villa', wall: 'V', wall2: 'S', trim: 'S', slab: 'F', roof: 'X', parapet: 'V', core: 'V', tread: 'S', paving: 'c', yard: 'g', pillar: 'V', railing: 'b', window: 'tall' },
};

/** What a wall on a side of a room holds. */
type WallKind = 'window' | 'window2' | 'balcony' | 'loggia' | 'blind' | 'niche' | 'door' | 'portone' | 'glass';

/** The window of a style on a wall drawn with `put` (v = depth of the wall's outer face). */
function windowOf(k: Kit, put: (u: number, v: number, z: number, ch: string) => void, z0: number, depth: number, alt = false): void {
  if (k.window === 'ribbon') {
    // A ribbon of glass across most of the bay, a concrete sill under it.
    const u0 = alt ? 6 : 3, u1 = alt ? 25 : 28;
    for (let z = z0 + 11; z < z0 + 20; z++) for (let u = u0; u <= u1; u++) put(u, depth, z, 'L'), put(u, depth + 1, z, '.');
    for (let u = u0 - 1; u <= u1 + 1; u++) put(u, depth, z0 + 10, 'J');
    return;
  }
  if (k.window === 'tall') {
    // A tall window with a white frame and a small balustrade before it.
    for (let z = z0 + 3; z < z0 + 25; z++) for (let u = 11; u < 21; u++) put(u, depth, z, 'L'), put(u, depth + 1, z, '.');
    for (let z = z0 + 2; z < z0 + 26; z++) for (const u of [10, 21]) put(u, depth, z, 'b');
    if (alt) for (let u = 10; u < 22; u++) for (let z = z0 + 26; z < z0 + 29; z++) put(u, depth, z, 'v');
    return;
  }
  // The palazzina: a window of 10 × 14 with the green shutters open on both sides.
  for (let z = z0 + 8; z < z0 + 22; z++)
    for (let u = 11; u < 21; u++) {
      put(u, depth, z, 'L');
      put(u, depth + 1, z, '.');
    }
  for (let z = z0 + 8; z < z0 + 22; z++) for (const u of [9, 10, 21, 22]) put(u, depth, z, 'G');
  if (alt) for (let u = 9; u < 23; u++) put(u, depth, z0 + 7, 'C');
}

/** Writes a wall of a room on `side`, two voxels thick inside the bay, from the slab to the top of the storey. */
function wall(b: Block, k: Kit, side: Side, kind: WallKind, z0 = 2, material = k.wall): void {
  const put = onSide(b, side);
  const depth = kind === 'loggia' ? 8 : kind === 'balcony' ? 6 : 0;
  for (let z = z0; z < H; z++) for (let u = 0; u < C; u++) for (let v = depth; v < depth + 2; v++) put(u, v, z, material);
  if (kind === 'loggia' || kind === 'balcony') {
    // Set back behind its railing: a cheek of one voxel on each end (one voxel, or the side reads as a door), the railing on the face.
    for (let v = 0; v < depth; v++) for (let z = z0; z < H; z++) put(0, v, z, material), put(C - 1, v, z, material);
    for (let u = 1; u < C - 1; u++) for (let z = z0; z < z0 + 6; z++) put(u, 0, z, k.railing);
    if (kind === 'loggia') for (let u = 4; u < C - 4; u += 3) put(u, 3, z0 + 20, k.style === 'popolare' ? 'q' : 'p');
  }
  if (kind === 'window' || kind === 'window2' || kind === 'loggia') windowOf(k, put, z0, depth, kind === 'window2');
  if (kind === 'balcony') {
    // A French window behind the balcony (glass: one sees through, one does not walk through).
    for (let z = z0; z < z0 + 26; z++) for (let u = 11; u < 21; u++) put(u, depth, z, 'L'), put(u, depth + 1, z, '.');
    for (let z = z0; z < z0 + 27; z++) for (const u of [10, 21]) put(u, depth, z, 'N');
  }
  if (kind === 'glass') {
    // A glass wall (the villa's veranda): frames every 8 voxels.
    for (let z = z0; z < H - 2; z++) for (let u = 1; u < C - 1; u++) put(u, 0, z, u % 8 === 0 ? 'b' : 'L'), put(u, 1, z, '.');
  }
  if (kind === 'niche') {
    // A votive niche (the palazzina), or a coloured panel (the case popolari), or a plaque of maiolica (the villa).
    const ch = k.style === 'palazzina' ? 'C' : k.style === 'popolare' ? 'U' : 'm';
    for (let z = z0 + 10; z < z0 + 22; z++) for (let u = 12; u < 20; u++) put(u, 0, z, ch);
    if (k.style === 'palazzina') for (let z = z0 + 13; z < z0 + 19; z++) for (let u = 14; u < 18; u++) put(u, 0, z, '.');
  }
  // The string course near the top of the storey, on the outer face (not over a doorway, not on a set-back wall).
  if (depth === 0 && kind !== 'glass') for (let u = 0; u < C; u++) if ((kind !== 'door' && kind !== 'portone') || u < 8 || u > 23) put(u, 0, H - 3, k.trim);
  if (kind === 'door' || kind === 'portone') {
    // A doorway of 12 × 27 (the Architect's door is 11 × 30 at 16; a body is 24 tall), open, with its frame; the street door is wider.
    const [u0, u1, top] = kind === 'portone' ? [9, 22, 28] : [10, 21, 27];
    for (let z = z0; z < z0 + top; z++) for (let u = u0; u <= u1; u++) for (let v = 0; v < 2; v++) put(u, v, z, '.');
    const frame = kind === 'portone' ? (k.style === 'palazzina' ? 'T' : k.style === 'popolare' ? 'J' : 'S') : 'N';
    for (let z = z0; z <= z0 + top; z++) for (const u of [u0 - 1, u1 + 1]) put(u, 0, z, frame);
    for (let u = u0 - 1; u <= u1 + 1; u++) put(u, 0, z0 + top, frame);
  }
}

/** A parapet on a side of a roof, 6 high, capped. */
function parapet(b: Block, k: Kit, side: Side): void {
  const put = onSide(b, side);
  for (let u = 0; u < C; u++) for (let v = 0; v < 2; v++) for (let z = 2; z < 8; z++) put(u, v, z, z === 7 ? k.trim : k.parapet);
}

/** The ends of a corridor bay: two stubs of wall either side of a doorway 12 wide, a lintel over it (the end reads as a doorway). */
function corridorEnd(b: Block, k: Kit, side: Side): void {
  const put = onSide(b, side);
  for (let z = 2; z < H; z++)
    for (let u = 0; u < C; u++)
      for (let v = 0; v < 2; v++) if (u < 10 || u > 21 || z >= 29) put(u, v, z, k.wall);
}

// ---------------------------------------------------------------- bricks

export type Family = 'street' | 'yard' | 'portico' | 'room' | 'corridor' | 'stair' | 'core' | 'turret' | 'roof' | 'bridge' | 'xstair' | 'air';

/**
 * A brick: one bay or more (`size` in bays), and how often the weaver should draw it. `roles` are the letters of the massing (massa.ts) a
 * bay of it may stand on, per bay of the brick in its own frame (`x,y,z`, or `*` for every bay). The faces are the kernel's (facce.ts).
 */
export interface Brick {
  name: string;
  style: Style | 'shared';
  family: Family;
  size: [number, number, number];
  weight: number;
  /** A room, a corridor, a stair, a core: its open sides are inside (they never meet a street or a roof without a door). */
  indoor: boolean;
  /** Its top needs a ceiling (a room); otherwise it is open (a roof, the sky). */
  covered: boolean;
  /** A slab that may stand over an open top (a bridge spans a street). */
  spans?: boolean;
  /** The top or the bottom of its bays is the shaft of a stair core, which only another segment of the same core meets. */
  shaft?: { top?: boolean; bottom?: boolean };
  roles: Record<string, string>;
  /** The inner seams a body walks through (pairs of its bays), for the graph of rule 10. */
  walk?: Array<[string, string]>;
  build: () => Block;
}

const bay = () => new Block(C, C, H);

/** A room bay: the slab, walls on `walls` (of their kinds), nothing on the other sides (the room goes on into the next bay). */
function room(k: Kit, walls: Partial<Record<Side, WallKind>>, extra?: (b: Block) => void): () => Block {
  return () => {
    const b = bay();
    b.fill(0, C - 1, 0, C - 1, 0, 1, k.slab);
    for (const [s, kind] of Object.entries(walls)) wall(b, k, Number(s) as Side, kind!);
    extra?.(b);
    return b;
  };
}

/** A corridor bay: walls on `walls`, a doorway on `ends`, nothing else. */
function corridor(k: Kit, walls: Side[], ends: Side[], doors: Side[] = []): () => Block {
  return () => {
    const b = bay();
    b.fill(0, C - 1, 0, C - 1, 0, 1, k.slab);
    for (const s of walls) wall(b, k, s, 'blind');
    for (const s of doors) wall(b, k, s, 'door');
    for (const s of ends) corridorEnd(b, k, s);
    return b;
  };
}

/** A roof bay: the roof slab, a parapet on `edges`, and what stands on it. */
type RoofThing = 'antenna' | 'laundry' | 'tank' | 'pergola' | 'skylight' | 'solar' | 'chimney' | 'plants';
function roof(k: Kit, edges: Side[], thing?: RoofThing): () => Block {
  return () => {
    const b = bay();
    b.fill(0, C - 1, 0, C - 1, 0, 1, k.roof);
    for (const s of edges) parapet(b, k, s);
    // Everything stands at least four voxels inside the bay: its faces stay what the parapets say.
    if (thing === 'antenna') b.fill(22, 23, 22, 23, 2, 22, 'A'), b.fill(17, 27, 22, 23, 20, 20, 'A'), b.fill(22, 23, 17, 27, 16, 16, 'A');
    if (thing === 'laundry') {
      for (const x of [6, 25]) b.fill(x, x, 15, 15, 2, 16, 'n');
      for (let x = 7; x < 25; x += 2) b.set(x, 15, 15, x % 4 === 1 ? 'p' : 'q'), b.set(x, 15, 14, x % 4 === 1 ? 'p' : 'q');
    }
    if (thing === 'tank') b.fill(10, 21, 10, 21, 2, 3, k.core), b.fill(11, 20, 11, 20, 4, 13, k.style === 'popolare' ? 'J' : 'S');
    if (thing === 'pergola') {
      for (const [x, y] of [[5, 5], [5, 25], [25, 5], [25, 25]]) b.fill(x, x + 1, y, y + 1, 2, 26, 'w');
      for (let y = 5; y <= 26; y += 3) b.fill(5, 26, y, y, 27, 27, 'w');
      for (let x = 6; x < 26; x += 2) b.set(x, 12 + (x % 5), 28, 'v');
    }
    if (thing === 'skylight') b.fill(9, 22, 9, 22, 2, 3, k.trim), b.fill(10, 21, 10, 21, 4, 4, 'L');
    if (thing === 'solar') for (let x = 6; x < 26; x += 5) b.fill(x, x + 3, 8, 23, 4, 5, 'L'), b.fill(x, x + 3, 8, 8, 2, 3, 'J');
    if (thing === 'chimney') b.fill(6, 9, 20, 23, 2, 14, k.wall), b.fill(5, 10, 19, 24, 15, 15, k.trim);
    if (thing === 'plants') for (const [x, y] of [[6, 6], [6, 22], [22, 22]]) b.fill(x, x + 3, y, y + 3, 2, 4, 'X'), b.fill(x, x + 3, y, y + 3, 5, 8, 'h');
    return b;
  };
}

/** Street, yard, garden: the paving, and what stands on it, four voxels inside. */
type GroundThing = 'lamp' | 'tree' | 'well' | 'bench' | 'grass' | 'fountain' | 'laundry';
function ground(k: Kit, paving: string, thing?: GroundThing): () => Block {
  return () => {
    const b = bay();
    b.fill(0, C - 1, 0, C - 1, 0, 0, paving);
    if (thing === 'lamp') b.fill(25, 26, 25, 26, 1, 26, 'N'), b.fill(23, 28, 23, 28, 27, 28, 'e');
    if (thing === 'tree') b.fill(14, 17, 14, 17, 1, 18, 'n'), b.fill(6, 25, 6, 25, 19, 29, 'h');
    if (thing === 'well') b.fill(11, 20, 11, 20, 1, 6, k.trim), b.fill(13, 18, 13, 18, 6, 6, '.'), b.fill(15, 16, 11, 11, 7, 18, 'N'), b.fill(15, 16, 20, 20, 7, 18, 'N'), b.fill(15, 16, 11, 20, 18, 18, 'N');
    if (thing === 'bench') b.fill(6, 25, 22, 25, 1, 4, k.style === 'popolare' ? 'J' : 'w');
    if (thing === 'grass') b.fill(4, 27, 4, 27, 0, 0, 'g'), b.fill(8, 11, 8, 11, 1, 6, 'h'), b.fill(20, 23, 18, 21, 1, 5, 'v');
    if (thing === 'fountain') b.fill(9, 22, 9, 22, 1, 4, 'S'), b.fill(10, 21, 10, 21, 3, 4, 'm'), b.fill(15, 16, 15, 16, 5, 12, 'S');
    if (thing === 'laundry') {
      for (const x of [6, 25]) b.fill(x, x, 15, 15, 1, 22, 'n');
      for (let x = 7; x < 25; x += 2) b.set(x, 15, 21, 'q'), b.set(x, 15, 20, 'p');
    }
    return b;
  };
}

/** The portico of the ground storey: paving and four pillars, the room above its ceiling; arches across the top of two sides. */
function portico(k: Kit, arches: boolean): () => Block {
  return () => {
    const b = ground(k, k.paving)();
    for (const [x, y] of [[0, 0], [C - 3, 0], [0, C - 3], [C - 3, C - 3]]) b.fill(x, x + 2, y, y + 2, 1, H - 1, k.pillar);
    if (arches) for (const side of [NY, PY] as Side[]) {
      const put = onSide(b, side);
      for (let u = 3; u < C - 3; u++) for (let z = 28; z < H; z++) if (z >= 28 + Math.round(3 * (1 - Math.abs(u - 15.5) / 12.5))) put(u, 0, z, k.trim);
    }
    return b;
  };
}

/**
 * The straight stair (T522): 1 × 2 bays and two storeys, a ramp from the floor of the lower storey at y 0 to the floor of the upper one at
 * y 63 (a voxel up every two: the body's step is three), solid under it; inside, walls on its sides; outside, the ramp the whole width of
 * the bay with a railing on its edges: its sides read as walls, so a yard ends on them and a room never stands beside it.
 */
function stair(k: Kit, outdoor: boolean): () => Block {
  return () => {
    const b = new Block(C, 2 * C, 2 * H);
    const [x0, x1] = outdoor ? [0, C - 1] : [2, C - 3];
    for (let y = 0; y < 2 * C; y++) {
      const top = 2 + Math.floor((y * 32) / (2 * C - 1)); // 2 at y 0, 34 at y 63: the upper floor (32 + 2)
      b.fill(x0, x1, y, y, 0, top - 1, outdoor ? k.pillar : k.tread);
      if (outdoor) for (const x of [x0, x1]) b.fill(x, x, y, y, top, top + 5, k.railing);
    }
    if (outdoor) {
      // The top landing over the last bay, so the stair gives onto the roof it climbs to.
      b.fill(x0, x1, 2 * C - 4, 2 * C - 1, 32, 33, k.tread);
      return b;
    }
    for (const xw of [0, C - 2]) {
      b.fill(xw, xw + 1, 0, 2 * C - 1, 0, 2 * H - 1, k.core);
      for (const z0 of [12, 12 + H]) b.fill(xw, xw + 1, 26, 37, z0, z0 + 10, '.');
    }
    // Behind, on the upper storey: the wall that closes the stairwell.
    b.fill(0, C - 1, 0, 1, H, 2 * H - 1, k.core);
    return b;
  };
}

/**
 * A segment of the stair core, one storey of 1 × 2 bays (T522's core cut by storeys, so that it stacks to any height): the landing at -y
 * (y 2-13) with its door in the middle of the end wall (T543: in the middle of the side as every door of the set, or a door and the one it
 * meets are not a way through; T522 had it on the flank), the first flight up along +y on the lane at -x to the half landing (12 deep: a
 * body turns there), the second back on the lane at +x to the landing of the segment above (whose bottom carries the last voxels of it).
 * `ground`: the first flight solid to the ground (T522: a floor with little headroom under a flight is one the kernel's walk takes).
 * `turret`: the top, on the roof: the landing, a railing over the well, the door onto the roof, its own roof.
 */
function core(k: Kit, kind: 'ground' | 'storey' | 'turret'): () => Block {
  return () => {
    const L = 2 * C;
    const b = new Block(C, L, H);
    // Walls, with a slit on the -x side and on the +y end.
    b.fill(0, 1, 0, L - 1, 0, H - 1, k.core);
    b.fill(C - 2, C - 1, 0, L - 1, 0, H - 1, k.core);
    b.fill(0, C - 1, 0, 1, 0, H - 1, k.core);
    b.fill(0, C - 1, L - 2, L - 1, 0, H - 1, k.core);
    b.fill(0, 1, 30, 33, 12, 24, '.');
    b.fill(C - 2, C - 1, 30, 33, 12, 24, '.');
    b.fill(14, 17, L - 2, L - 1, 12, 24, '.');
    // The door in the middle of the end wall, onto the landing, with its frame.
    b.fill(10, 21, 0, 1, 2, 28, '.');
    for (const x of [9, 22]) b.fill(x, x, 0, 0, 2, 29, 'N');
    b.fill(9, 22, 0, 0, 29, 29, 'N');
    // The landing, and the last voxels of the flight of the segment below (none under the ground segment: there is the ground).
    b.fill(2, C - 3, 2, 13, 0, 1, k.tread);
    if (kind !== 'ground') b.fill(17, C - 3, 14, 15, 0, 1, k.tread), b.fill(17, C - 3, 16, 17, 0, 0, k.tread);
    if (kind === 'turret') {
      b.fill(2, 14, 14, 14, 2, 7, k.railing);
      b.fill(15, 16, 14, 49, 0, 7, k.core);
      b.fill(0, C - 1, 0, L - 1, H - 2, H - 1, k.trim);
      return b;
    }
    b.fill(15, 16, 14, 49, 0, H - 1, k.core);
    for (let y = 14; y <= 49; y++) {
      const up = 2 + Math.round((16 * (y - 14)) / 35); // 2 → 18 on the first lane
      b.fill(2, 14, y, y, kind === 'ground' ? 0 : up - 2, up - 1, k.tread);
      const back = 18 + Math.round((16 * (49 - y)) / 35); // 18 → 34 on the second, coming back (what passes 31 is the next segment's)
      b.fill(17, C - 3, y, y, back - 2, Math.min(H - 1, back - 1), k.tread);
    }
    b.fill(2, C - 3, 50, L - 3, 16, 17, k.tread);
    return b;
  };
}

/** A bridge over a street: the walkway, a railing or a parapet on its two sides, open at its two ends. */
function bridge(k: Kit): () => Block {
  return () => {
    const b = bay();
    b.fill(0, C - 1, 0, C - 1, 0, 1, k.slab);
    for (const s of [PX, NX] as Side[]) {
      const put = onSide(b, s);
      for (let u = 0; u < C; u++) for (let z = 2; z < 8; z++) put(u, 0, z, z === 7 ? k.trim : k.style === 'palazzina' ? 'Y' : k.parapet);
    }
    // Under it, a beam on each side (it reads from below as a bridge, not a slab).
    b.fill(0, 2, 0, C - 1, 0, 0, k.trim);
    b.fill(C - 3, C - 1, 0, C - 1, 0, 0, k.trim);
    return b;
  };
}

/** Rooms, corridors, roofs and the rest of one style: 50 bricks. */
function styleSet(k: Kit): Brick[] {
  const s = k.style;
  const name = (n: string) => `${s}/${n}`;
  const all = (letters: string) => ({ '*': letters });
  const B: Brick[] = [];
  const add = (n: string, family: Family, weight: number, build: () => Block, more: Partial<Brick> = {}) =>
    B.push({ name: name(n), style: s, family, size: [1, 1, 1], weight, indoor: false, covered: false, roles: all(''), build, ...more });
  const groundRoles = all('SYP');
  // The ground outside: streets, yards, gardens, porticoes.
  add('strada', 'street', 3, ground(k, k.paving), { roles: all('SY') });
  add('strada-lampione', 'street', 0.5, ground(k, k.paving, 'lamp'), { roles: all('S') });
  add('strada-panchina', 'street', 0.3, ground(k, k.paving, 'bench'), { roles: all('S') });
  add('cortile', 'yard', 2, ground(k, k.yard), { roles: all('Y') });
  add('cortile-albero', 'yard', 0.6, ground(k, k.yard, 'tree'), { roles: all('Y') });
  add(s === 'villa' ? 'giardino' : s === 'palazzina' ? 'cortile-pozzo' : 'cortile-panni', 'yard', 0.5, ground(k, k.yard, s === 'villa' ? 'grass' : s === 'palazzina' ? 'well' : 'laundry'), { roles: all('Y') });
  add(s === 'villa' ? 'fontana' : 'cortile-fiori', 'yard', 0.3, ground(k, k.yard, s === 'villa' ? 'fountain' : 'grass'), { roles: all('Y') });
  add('portico', 'portico', 1, portico(k, false), { roles: all('P'), covered: true });
  add('portico-archi', 'portico', 1, portico(k, true), { roles: all('P'), covered: true });
  void groundRoles;
  // The rooms: a 9-slice whose open sides meet, so a room is of 2 × 2 bays and more; their walls with windows, balconies, loggias, doors.
  const R = { indoor: true, covered: true, roles: all('HB') };
  const up = { ...R, roles: all('B') };
  const down = { ...R, roles: all('H') };
  add('sala', 'room', 1.2, room(k, {}), R);
  add('sala-pilastro', 'room', 0.3, room(k, {}, (b) => b.fill(14, 17, 14, 17, 2, H - 1, k.pillar)), R);
  add('stanza-finestra', 'room', 2, room(k, { [NY]: 'window' }), R);
  add('stanza-finestra-2', 'room', 0.8, room(k, { [NY]: 'window2' }), R);
  add('stanza-balcone', 'room', 1, room(k, { [NY]: 'balcony' }), up);
  add('stanza-loggia', 'room', 0.6, room(k, { [NY]: 'loggia' }), up);
  add('stanza-cieca', 'room', 0.8, room(k, { [NY]: 'blind' }), R);
  add('stanza-nicchia', 'room', 0.3, room(k, { [NY]: 'niche' }), R);
  add('angolo-finestre', 'room', 1.5, room(k, { [NY]: 'window', [PX]: 'window' }), R);
  add('angolo-finestra-cieco', 'room', 1, room(k, { [NY]: 'window', [PX]: 'blind' }), R);
  add('angolo-balcone', 'room', 0.8, room(k, { [NY]: 'balcony', [PX]: 'window' }), up);
  add('angolo-ciechi', 'room', 0.5, room(k, { [NY]: 'blind', [PX]: 'blind' }), R);
  add(s === 'villa' ? 'veranda' : s === 'popolare' ? 'angolo-loggia' : 'angolo-loggia', 'room', 0.4, room(k, s === 'villa' ? { [NY]: 'glass', [PX]: 'glass' } : { [NY]: 'loggia', [PX]: 'window2' }), s === 'villa' ? R : up);
  add('ingresso', 'room', 1, room(k, { [NY]: 'portone' }), down);
  add('ingresso-angolo', 'room', 0.8, room(k, { [NY]: 'portone', [PX]: 'window' }), down);
  add('porta', 'room', 2, room(k, { [NY]: 'door' }), R);
  add('porta-angolo', 'room', 1.5, room(k, { [NY]: 'door', [PX]: 'window' }), R);
  add('porta-angolo-cieco', 'room', 1, room(k, { [NY]: 'door', [PX]: 'blind' }), R);
  // The corridors: their ends are doorways, so a corridor opens into a room and never melts into one.
  const Co = { indoor: true, covered: true, roles: all('HB') };
  add('corridoio', 'corridor', 0.6, corridor(k, [PX, NX], [PY, NY]), Co);
  add('corridoio-curva', 'corridor', 0.5, corridor(k, [PX, NY], [PY, NX]), Co);
  add('corridoio-t', 'corridor', 0.4, corridor(k, [NY], [PX, PY, NX]), Co);
  add('corridoio-croce', 'corridor', 0.2, corridor(k, [], [PX, PY, NX, NY]), Co);
  add('corridoio-porta', 'corridor', 0.5, corridor(k, [NX], [PY, NY], [PX]), Co);
  add('corridoio-fondo', 'corridor', 0.2, corridor(k, [PX, NX, NY], [PY]), Co);
  // The stairs: inside a building, and outside up to a low roof.
  B.push({ name: name('scala'), style: s, family: 'stair', size: [1, 2, 2], weight: 0.3, indoor: true, covered: true, roles: { '0,0,0': 'HB', '0,1,0': 'HB', '0,0,1': 'B', '0,1,1': 'B' }, walk: [['0,0,0', '0,1,0'], ['0,1,0', '0,1,1']], build: stair(k, false) });
  B.push({ name: name('scala-esterna'), style: s, family: 'xstair', size: [1, 2, 2], weight: 0.2, indoor: false, covered: false, roles: { '0,0,0': 'YR', '0,1,0': 'YR', '0,0,1': 'A', '0,1,1': 'A' }, walk: [['0,0,0', '0,1,0'], ['0,1,0', '0,1,1']], build: stair(k, true) });
  // The core in segments: on the ground, on every storey, the turret on the roof.
  const shaftWalk: Array<[string, string]> = [['0,0,0', '0,1,0']];
  B.push({ name: name('nucleo-terra'), style: s, family: 'core', size: [1, 2, 1], weight: 1, indoor: true, covered: true, shaft: { top: true }, roles: { '0,0,0': 'q', '0,1,0': 'Q' }, walk: shaftWalk, build: core(k, 'ground') });
  B.push({ name: name('nucleo-piano'), style: s, family: 'core', size: [1, 2, 1], weight: 1, indoor: true, covered: true, shaft: { top: true, bottom: true }, roles: { '0,0,0': 'k', '0,1,0': 'K' }, walk: shaftWalk, build: core(k, 'storey') });
  B.push({ name: name('torrino'), style: s, family: 'turret', size: [1, 2, 1], weight: 1, indoor: true, covered: false, shaft: { bottom: true }, roles: { '0,0,0': 'T', '0,1,0': 'V' }, walk: shaftWalk, build: core(k, 'turret') });
  // The roofs: a parapet on any of their sides, and what stands on them.
  const Ro = { roles: all('R') };
  add('tetto', 'roof', 2, roof(k, []), Ro);
  add('tetto-bordo', 'roof', 1, roof(k, [NY]), Ro);
  add('tetto-angolo', 'roof', 1, roof(k, [NY, PX]), Ro);
  add('tetto-corridoio', 'roof', 0.3, roof(k, [NY, PY]), Ro);
  add('tetto-testa', 'roof', 0.4, roof(k, [NY, PX, PY]), Ro);
  add('tetto-isola', 'roof', 0.2, roof(k, [NY, PX, PY, NX]), Ro);
  add('tetto-antenna', 'roof', 0.5, roof(k, [NY, PX], 'antenna'), Ro);
  add('tetto-panni', 'roof', 0.6, roof(k, [NY], 'laundry'), Ro);
  add('tetto-cisterna', 'roof', 0.6, roof(k, [], 'tank'), Ro);
  add(s === 'villa' ? 'tetto-pergola' : s === 'popolare' ? 'tetto-pannelli' : 'tetto-lucernario', 'roof', 0.4, roof(k, s === 'villa' ? [NY] : [], s === 'villa' ? 'pergola' : s === 'popolare' ? 'solar' : 'skylight'), Ro);
  add(s === 'villa' ? 'tetto-vasi' : 'tetto-camino', 'roof', 0.3, roof(k, [NY, PX], s === 'villa' ? 'plants' : 'chimney'), Ro);
  // The bridge over a street, where the massing puts one.
  add('ponte', 'bridge', 1, bridge(k), { roles: all('N'), spans: true });
  return B;
}

/** The air, shared by every style. */
export const AIR: Brick = { name: 'aria', style: 'shared', family: 'air', size: [1, 1, 1], weight: 1, indoor: false, covered: false, roles: { '*': 'A' }, build: bay };

/** The three sets of the large set (50 bricks each), by style. */
export const SETS: Record<Style, Brick[]> = { palazzina: styleSet(KITS.palazzina), popolare: styleSet(KITS.popolare), villa: styleSet(KITS.villa) };
