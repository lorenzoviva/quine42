// A set of bricks extracted from a static model (T557, docs/design/strutture-modulari.md § 12): the bays of the source at several seeds,
// counted where they are the same; the bricks of more bays (the stairs) kept whole; and what the program needs (programma.ts):
//
// - the **signatures**: bays whose six faces meet the same faces, with the same passages and the same letters of the massing, are one
//   signature. The faces decide who meets whom, so a wave over the signatures and then a choice of a bay inside every signature is the
//   wave over the bays: the first wave of the program (`sig`) is the one MarkovJunior solves, a cell a bay, its patterns the signatures;
//   the stitching works on them; the second (`voxels`) chooses the bay of each signature and writes its voxels;
// - the propagator of the first wave, from the pairs of faces the source shows (estrattore.ts);
// - the **copies the stitching dresses a bay with** (the bay is the same, its faces stay those of its signature): a door carved in the
//   middle of a side the bay does not pass; a straight stair (a ramp of a step and a half a voxel) from the floor of a room to the floor
//   above; the hole in the slab of the room above it. The stitching (ricucitura.ts) says where, in the state of the bay; the second wave
//   writes the copy the state asks for.

import { C, H, type Source } from './sorgente';
import { BODY_H, readSource, STEP, pairsOf, type Role, type SourceRead } from './estrattore';

const fnv = (data: Uint8Array, seed: number) => {
  let h = seed >>> 0;
  for (let i = 0; i < data.length; i++) {
    h ^= data[i];
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
export const hashOf = (data: Uint8Array) => `${fnv(data, 2166136261).toString(36)}${fnv(data, 0x9747b28c).toString(36)}`;

/** What a bay is, for the measures: the families of T543. */
export type Family = 'air' | 'street' | 'yard' | 'room' | 'stair' | 'roof';
export const familyOf = (roles: Set<Role>): Family =>
  roles.has('q') || roles.has('Q') ? 'stair' : roles.has('H') || roles.has('B') ? 'room' : roles.has('R') ? 'roof' : roles.has('Y') ? 'yard' : roles.has('S') ? 'street' : 'air';

/** What a copy for the stitching opens: a door on a side, the ramp up to the next storey, the hole the ramp comes up through. */
export type Variant = { kind: 'door'; side: number } | { kind: 'up' } | { kind: 'down' } | { kind: 'out'; side: number };

export interface Motif {
  index: number;
  /** The brick it belongs to (as it stands, not turned), and where in it. */
  brick: number;
  at: [number, number, number];
  roles: Set<Role>;
  keys: string[];
  pass: boolean[];
  node: boolean;
  indoor: boolean;
  /** Times it stands in the sources (0 for a copy: only the stitching puts it there). */
  weight: number;
  voxels: Uint8Array;
  family: Family;
  /** A copy for the stitching: of which bay, and what it opens. */
  variant?: Variant & { from: number };
  /** The signature it belongs to (a copy, its bay's). */
  sig: number;
}

export interface Brick {
  index: number;
  /** The same brick in any turn: what «a brick» counts. */
  canon: string;
  size: [number, number, number];
  /** Its bays (motifs), x fastest, then y, then z. */
  motifs: number[];
  weight: number;
  family: Family;
  /** The sources' seeds it stands in. */
  seeds: Set<number>;
}

/** The state of a bay before the stitching: reached (a street, a yard), to reach (a room, a stair, a terrace), or neither. */
export type Start = 'r' | 'u' | 'x';

export interface Signature {
  index: number;
  /** Its bays as the sources have them (the copies are in `doors`, `up`, `down`). */
  motifs: number[];
  roles: Set<Role>;
  keys: string[];
  pass: boolean[];
  weight: number;
  family: Family;
  node: boolean;
  indoor: boolean;
  start: Start;
  /** The copies with a door on each side (+x, +y, -x, -y), with the ramp up, with the hole down. */
  doors: number[][];
  up: number[];
  down: number[];
  /** On a street: the copies with an outdoor stair rising to the storey above against the facade on each side. */
  out: number[][];
}

export interface ExtractedSet {
  name: string;
  sources: Array<{ universe: string; model: string; name: string; seed: number; nx: number; ny: number; nz: number; ms: number; removed: Record<string, number>; reached: [number, number] }>;
  alphabet: string[];
  palette: Source['palette'];
  doors: Set<number>;
  paving: string;
  /** The letter of the stitched stairs (the source's own stair, or its floor). */
  rampLetter: number;
  motifs: Motif[];
  bricks: Brick[];
  sigs: Signature[];
  /** The pairs of faces seen: x, y, z (`lower|upper`). */
  pairs: [Set<string>, Set<string>, Set<string>];
  /** The signatures the first wave places, its patterns in this order; and its propagator. */
  wave: number[];
  propagator: number[][][];
  /** The source's actions (the doors open and close in the program that wears the bricks). */
  actions: Source['actions'];
  /** Bricks dropped by the reduction to `target` (near twins of a brick kept). */
  dropped: number;
  ms: { read: number; build: number };
}

/**
 * The classes of the faces: for every side (+x, +y, -x, -y, top, bottom) a key's class is the set of keys it is seen meeting. Two keys with
 * the same partners stand for each other everywhere (the partners of an equivalent key are the same set, so one level is enough).
 */
export function faceClasses(pairs: ExtractedSet['pairs']): Array<Map<string, string>> {
  const out = [0, 1, 2, 3, 4, 5].map(() => new Map<string, string>());
  // Axis a: its pairs are lower|upper; the lower key is on side a (+x, +y, top), the upper on its opposite.
  for (const [a, lower, upper] of [[0, 0, 2], [1, 1, 3], [2, 4, 5]] as const) {
    const up = new Map<string, Set<string>>(), down = new Map<string, Set<string>>();
    for (const p of pairs[a]) {
      const [l, u] = p.split('|');
      (up.get(l) ?? up.set(l, new Set()).get(l)!).add(u);
      (down.get(u) ?? down.set(u, new Set()).get(u)!).add(l);
    }
    const name = (set: Set<string>) => hashOf(new TextEncoder().encode([...set].sort().join('\n')));
    for (const [l, set] of up) out[lower].set(l, `c${name(set)}`);
    for (const [u, set] of down) out[upper].set(u, `c${name(set)}`);
  }
  return out;
}

/** The voxels of a block turned a quarter counter-clockwise (x → y). */
function turnBlock(v: Uint8Array, X: number, Y: number, Z: number): Uint8Array {
  const out = new Uint8Array(v.length);
  for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) out[Y - 1 - y + x * Y + z * X * Y] = v[x + y * X + z * X * Y];
  return out;
}

/** The whole block of a brick of a read, from its bays. */
function blockOf(r: SourceRead, bays: number[], size: [number, number, number]): Uint8Array {
  const [sx, sy, sz] = size;
  const X = sx * C, Y = sy * C;
  const out = new Uint8Array(X * Y * sz * H);
  const ox = Math.min(...bays.map((b) => r.bays[b].i)), oy = Math.min(...bays.map((b) => r.bays[b].j)), oz = Math.min(...bays.map((b) => r.bays[b].k));
  for (const b of bays) {
    const bay = r.bays[b];
    const bx = (bay.i - ox) * C, by = (bay.j - oy) * C, bz = (bay.k - oz) * H;
    for (let z = 0; z < H; z++) for (let y = 0; y < C; y++) out.set(bay.voxels.subarray(y * C + z * C * C, y * C + z * C * C + C), bx + (by + y) * X + (bz + z) * X * Y);
  }
  return out;
}

const solidIn = (v: Uint8Array) => (x: number, y: number, z: number) => z < 0 || (z < H && v[x + y * C + z * C * C] !== 0);

/** Where a body stands in a column near the bottom of a bay, if it does: solid under, a body's height (or the bay's top) free above. */
function standAt(v: Uint8Array, x: number, y: number): number | undefined {
  const solid = solidIn(v);
  for (let z = 0; z <= 8; z++) {
    if (!solid(x, y, z - 1) || solid(x, y, z)) continue;
    let free = 0;
    while (z + free < H && free < BODY_H && !solid(x, y, z + free)) free++;
    if (free >= Math.min(BODY_H, H - z)) return z;
  }
  return undefined;
}

/**
 * A door carved in the middle of side `side` of a bay: a passage 12 voxels wide and as tall as a body, from the side to the middle of the
 * bay, over something to stand on all along, onto the floor of the room beyond its inner end. Undefined if the bay has no room for it.
 */
export function carveDoor(v: Uint8Array, side: number): Uint8Array | undefined {
  // u along the side, w from the side inwards (the side's own frame, as sideKey's); under the bay is the ground.
  const xy = (u: number, w: number): [number, number] => (side === 0 ? [C - 1 - w, u] : side === 2 ? [w, u] : side === 1 ? [u, C - 1 - w] : [u, w]);
  const solid = solidIn(v);
  const U0 = C / 2 - 6, U1 = C / 2 + 5, DEEP = C / 2;
  let lo = H, hi = -1;
  for (let w = DEEP; w < DEEP + 4; w++)
    for (let u = U0 + 2; u <= U1 - 2; u++) {
      const t = standAt(v, ...xy(u, w));
      if (t === undefined) return undefined;
      lo = Math.min(lo, t);
      hi = Math.max(hi, t);
    }
  if (hi - lo > STEP) return undefined;
  const level = hi;
  // Where the way has nothing to stand on (the strip of air before an upper facade) the door gets a threshold, the floor of the room
  // carried out to the side: a small landing that a stair outside reaches.
  const [fx, fy] = xy(C / 2, DEEP + 1);
  const floorLetter = v[fx + fy * C + (level - 1) * C * C] || v[fx + fy * C];
  const out = new Uint8Array(v);
  let sill = 0;
  for (let w = 0; w < DEEP; w++)
    for (let u = U0; u <= U1; u++) {
      const [x, y] = xy(u, w);
      let held = false;
      for (let z = Math.max(0, level - 1 - STEP); z <= level - 1 && !held; z++) held = solid(x, y, z);
      if (!held) {
        if (level < 1 || !floorLetter) return undefined;
        for (let z = Math.max(0, level - 2); z < level; z++) out[x + y * C + z * C * C] = floorLetter;
        sill++;
      }
    }
  void sill;
  for (let w = 0; w < DEEP; w++)
    for (let u = U0; u <= U1; u++) {
      const [x, y] = xy(u, w);
      for (let z = level; z < Math.min(H, level + BODY_H + 2); z++) out[x + y * C + z * C * C] = 0;
    }
  return out;
}

/**
 * A street with a stair outside (the stitching's stair to a storey above, as the saloons of a western town have it): a ramp 12 voxels wide in
 * the middle of the bay, from the street at its far side up to a storey (its top a step under the next storey's floor) at side `side`, against
 * the facade of the building there; the room above that facade has a door with its threshold. Undefined if the street is not free.
 */
export function rampOut(v: Uint8Array, side: number, letter: number): Uint8Array | undefined {
  const xy = (u: number, w: number): [number, number] => (side === 0 ? [C - 1 - w, u] : side === 2 ? [w, u] : side === 1 ? [u, C - 1 - w] : [u, w]);
  const U0 = C / 2 - 6, U1 = C / 2 + 5;
  for (let w = 0; w < C; w++)
    for (let u = U0; u <= U1; u++) {
      const t = standAt(v, ...xy(u, w));
      if (t === undefined || t > 3) return undefined;
    }
  const out = new Uint8Array(v);
  for (let w = 0; w < C; w++) {
    // From the far side (w = C - 1) to the side (w = 0): a step and a half a voxel at most, the top at H - 1.
    const top = Math.min(H - 1, Math.round(((C - w) * (H - 1)) / C));
    for (let u = U0; u <= U1; u++) {
      const [x, y] = xy(u, w);
      for (let z = 0; z <= top; z++) out[x + y * C + z * C * C] = letter;
    }
  }
  return out;
}

/** The stitched stair, the same in every bay: a ramp along +x in the middle of the bay, from its floor to the floor above. */
export const RAMP = { x0: 6, x1: 26, y0: 11, y1: 21 };

/** A room with the ramp (the bottom of a stitched stair), if its floor is there and the room over the ramp is free. */
export function rampUp(v: Uint8Array, letter: number): Uint8Array | undefined {
  const { x0, x1, y0, y1 } = RAMP;
  let f = -1;
  for (let y = y0; y < y1; y++)
    for (let x = x0 - 4; x < x1; x++) {
      const t = standAt(v, x, y);
      if (t === undefined || t > 3 || (f >= 0 && t !== f)) return undefined;
      f = t;
    }
  for (let z = f; z < H; z++) for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 4; x < x1 + 2; x++) if (v[x + y * C + z * C * C]) return undefined;
  const out = new Uint8Array(v);
  const rise = H - f;
  for (let x = x0; x < x1; x++) {
    const top = f + Math.floor(((x - x0 + 1) * rise) / (x1 - x0)) - 1;
    for (let z = f; z <= Math.min(H - 1, top); z++) for (let y = y0; y < y1; y++) out[x + y * C + z * C * C] = letter;
  }
  return out;
}

/** A room (or a terrace) with the hole the stitched stair comes up through, if its slab is there and the room over it is free. */
export function holeDown(v: Uint8Array): Uint8Array | undefined {
  const { x0, x1, y0, y1 } = RAMP;
  const out = new Uint8Array(v);
  for (let y = y0; y < y1; y++)
    for (let x = x0 + 2; x < x1; x++) {
      const t = standAt(v, x, y);
      if (t === undefined || t > 3) return undefined;
      for (let z = t; z < BODY_H; z++) if (v[x + y * C + z * C * C]) return undefined;
      for (let z = 0; z < t; z++) out[x + y * C + z * C * C] = 0;
    }
  return out;
}

/**
 * The set of bricks of some sources (the same model at several seeds), read in the turns asked for (by default as the Concilio drew it:
 * the source already has its facades in the four directions). `target` bricks at most (air and street apart): a brick whose signature
 * keeps another brick at least as frequent, and whose voxels differ from it least, goes first (the wave does not lose a face).
 */
export function buildSet(name: string, sources: Source[], o: { turns?: number[]; target?: number } = {}): ExtractedSet {
  const t0 = performance.now();
  const reads: Array<{ s: Source; r: SourceRead }> = [];
  for (const s of sources) for (const t of o.turns ?? [0]) reads.push({ s, r: readSource(s, t) });
  const t1 = performance.now();
  // One alphabet: the sources are the same model, so their letters are the same; a letter one has and another does not is added.
  const alphabet = [...sources[0].alphabet];
  const palette = { ...sources[0].palette };
  for (const s of sources.slice(1)) for (const ch of s.alphabet) if (!alphabet.includes(ch)) (alphabet.push(ch), (palette[ch] = s.palette[ch]));
  const doors = new Set<number>();
  for (const s of sources) for (const d of s.doors) doors.add(alphabet.indexOf(s.alphabet[d]));
  let bricks: Brick[] = [];
  const brickByContent = new Map<string, number>();
  let motifs: Motif[] = [];
  const motifByKey = new Map<string, number>();
  const pairs: ExtractedSet['pairs'] = [new Set(), new Set(), new Set()];
  for (const { s, r } of reads) {
    const map = Uint8Array.from(s.alphabet, (ch) => alphabet.indexOf(ch));
    if (map.some((c, i) => c !== i)) for (const b of r.bays) b.voxels = Uint8Array.from(b.voxels, (c) => map[c]);
    // Every brick: its content (as it stands) names its inner faces, and its canon (any turn) says which brick it is.
    for (const br of r.bricks) {
      const order = [...br.bays].sort((a, b) => r.bays[a].k - r.bays[b].k || r.bays[a].j - r.bays[b].j || r.bays[a].i - r.bays[b].i);
      const block = blockOf(r, order, br.size);
      const content = `${br.size.join('x')}:${hashOf(block)}`;
      let turnedBlock = block, X = br.size[0] * C, Y = br.size[1] * C;
      const canons = [content];
      for (let q = 1; q < 4; q++) {
        turnedBlock = turnBlock(turnedBlock, X, Y, br.size[2] * H);
        [X, Y] = [Y, X];
        canons.push(`${q % 2 ? `${br.size[1]}x${br.size[0]}` : `${br.size[0]}x${br.size[1]}`}x${br.size[2]}:${hashOf(turnedBlock)}`);
      }
      const canon = canons.sort()[0];
      for (const b of br.bays) r.bays[b].keys = r.bays[b].keys.map((k) => (k.startsWith('L') ? `L:${content}:${k.slice(1)}` : k));
      let id = brickByContent.get(content);
      const isNew = id === undefined;
      if (id === undefined) {
        id = bricks.length;
        brickByContent.set(content, id);
        bricks.push({ index: id, canon, size: br.size, motifs: [], weight: 0, family: 'air', seeds: new Set() });
      }
      const brick = bricks[id];
      brick.weight++;
      brick.seeds.add(s.seed);
      for (const b of order) {
        const bay = r.bays[b];
        const key = `${id}|${bay.at.join(',')}|${bay.keys.join('§')}|${bay.pass.map(Number).join('')}`;
        let m = motifByKey.get(key);
        if (m === undefined) {
          m = motifs.length;
          motifByKey.set(key, m);
          motifs.push({ index: m, brick: id, at: bay.at, roles: new Set(), keys: bay.keys, pass: bay.pass, node: bay.node, indoor: bay.indoor, weight: 0, voxels: bay.voxels, family: 'air', sig: -1 });
          if (isNew) brick.motifs.push(m);
        }
        motifs[m].roles.add(bay.role);
        // A stair stands where a room of its storey would, too: the wave may put it in any building (and where the massing asks for one).
        if (bay.role === 'q') motifs[m].roles.add(bay.k === 0 ? 'H' : 'B');
        if (bay.role === 'Q') motifs[m].roles.add('B');
        motifs[m].weight++;
      }
    }
    pairsOf(r, pairs);
  }
  for (const m of motifs) m.family = familyOf(m.roles);
  for (const b of bricks) b.family = b.motifs.map((m) => motifs[m].family).find((f) => f !== 'air') ?? 'air';
  // The signatures: bays whose faces meet the same faces (the same partners in the pairs the source shows), with the same passages and
  // letters, are one signature.
  const classes = faceClasses(pairs);
  const classOf = (m: Motif, d: number) => classes[d].get(m.keys[d]) ?? `none:${m.keys[d]}`;
  const sigKey = (m: Motif) => `${[...m.roles].sort().join('')}|${[0, 1, 2, 3, 4, 5].map((d) => classOf(m, d)).join('§')}|${m.pass.map(Number).join('')}`;
  // The reduction: near twins first, a brick of a single bay whose signature keeps a brick at least as frequent.
  let dropped = 0;
  const target = o.target ?? Infinity;
  const counted = () => new Set(bricks.filter((b) => b.family !== 'air' && b.family !== 'street').map((b) => b.canon)).size;
  if (counted() > target) {
    const bySig = new Map<string, number[]>();
    for (const b of bricks) if (b.size.every((n) => n === 1)) (bySig.get(sigKey(motifs[b.motifs[0]])) ?? bySig.set(sigKey(motifs[b.motifs[0]]), []).get(sigKey(motifs[b.motifs[0]]))!).push(b.index);
    const differ = (a: Uint8Array, b: Uint8Array) => {
      let n = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
      return n;
    };
    const candidates: Array<{ brick: number; cost: number }> = [];
    for (const group of bySig.values()) {
      if (group.length < 2) continue;
      for (const b of group) {
        const others = group.filter((c) => c !== b && bricks[c].weight >= bricks[b].weight);
        if (!others.length) continue;
        candidates.push({ brick: b, cost: Math.min(...others.map((c) => differ(motifs[bricks[b].motifs[0]].voxels, motifs[bricks[c].motifs[0]].voxels))) });
      }
    }
    candidates.sort((a, b) => a.cost - b.cost || bricks[a.brick].weight - bricks[b.brick].weight);
    const gone = new Set<number>();
    const kept = (g: number[]) => g.filter((c) => !gone.has(c)).length;
    for (const c of candidates) {
      if (counted() - gone.size <= target) break;
      const g = bySig.get(sigKey(motifs[bricks[c.brick].motifs[0]]))!;
      if (kept(g) < 2) continue;
      gone.add(c.brick);
    }
    dropped = gone.size;
    // Keep the rest, renumbered.
    const keepMotif = motifs.filter((m) => !gone.has(m.brick));
    const newBrick = new Map<number, number>();
    bricks = bricks.filter((b) => !gone.has(b.index)).map((b, i) => (newBrick.set(b.index, i), { ...b, index: i }));
    const newMotif = new Map<number, number>();
    motifs = keepMotif.map((m, i) => (newMotif.set(m.index, i), { ...m, index: i, brick: newBrick.get(m.brick)! }));
    for (const b of bricks) b.motifs = b.motifs.map((m) => newMotif.get(m)!);
  }
  // The letter of the stitched stairs: the source's stair (its name says it), or the floor the rooms stand on.
  const named = alphabet.findIndex((ch, c) => c > 0 && /scal|gradin|stair|step/i.test(palette[ch]?.name ?? ''));
  let rampLetter = named;
  if (rampLetter <= 0) {
    const count = new Map<number, number>();
    for (const m of motifs) if (m.family === 'room') for (let i = 0; i < C * C; i++) if (m.voxels[i]) count.set(m.voxels[i], (count.get(m.voxels[i]) ?? 0) + 1);
    rampLetter = [...count].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 1;
  }
  // The signatures of the bays as the sources have them.
  const sigs: Signature[] = [];
  const sigByKey = new Map<string, number>();
  for (const m of motifs) {
    const k = sigKey(m);
    let s = sigByKey.get(k);
    if (s === undefined) {
      s = sigs.length;
      sigByKey.set(k, s);
      const source = [...m.roles].every((r) => r === 'S' || r === 'Y') && m.node && !m.indoor;
      const start: Start = source ? 'r' : m.node && (m.family === 'room' || m.family === 'stair' || m.family === 'roof') ? 'u' : 'x';
      sigs.push({ index: s, motifs: [], roles: m.roles, keys: m.keys, pass: m.pass, weight: 0, family: m.family, node: m.node, indoor: m.indoor, start, doors: [[], [], [], []], up: [], down: [], out: [[], [], [], []] });
    }
    sigs[s].motifs.push(m.index);
    sigs[s].weight += m.weight;
    m.sig = s;
  }
  // The copies for the stitching: of the bays of a brick of their own with floor (a stair's bays stay as they are).
  const natural = motifs.length;
  // The streets: an outdoor stair toward each side (the plain paving the massing's streets stand on, ring or yard).
  for (let m = 0; m < natural; m++) {
    const mo = motifs[m];
    if (!mo.roles.has('S') || !mo.pass.slice(0, 4).every(Boolean)) continue;
    for (let d = 0; d < 4; d++) {
      const v = rampOut(mo.voxels, d, rampLetter);
      if (!v) continue;
      const index = motifs.length;
      motifs.push({ ...mo, index, roles: new Set(mo.roles), weight: 0, voxels: v, variant: { kind: 'out', side: d, from: m } });
      sigs[mo.sig].out[d].push(index);
    }
  }
  for (let m = 0; m < natural; m++) {
    const mo = motifs[m];
    if (!mo.node || bricks[mo.brick].size.some((n) => n !== 1) || mo.family === 'street' || mo.family === 'air') continue;
    const sig = sigs[mo.sig];
    const copy = (v: Uint8Array, variant: Variant): number => {
      const index = motifs.length;
      motifs.push({ ...mo, index, roles: new Set(mo.roles), weight: 0, voxels: v, variant: { ...variant, from: m } });
      return index;
    };
    for (let d = 0; d < 4; d++) {
      if (mo.pass[d] || mo.keys[d].startsWith('L')) continue;
      const v = carveDoor(mo.voxels, d);
      if (v) sig.doors[d].push(copy(v, { kind: 'door', side: d }));
    }
    if (mo.indoor && (mo.roles.has('H') || mo.roles.has('B'))) {
      const v = rampUp(mo.voxels, rampLetter);
      if (v) sig.up.push(copy(v, { kind: 'up' }));
    }
    if (mo.roles.has('B') || mo.roles.has('R')) {
      const v = holeDown(mo.voxels);
      if (v) sig.down.push(copy(v, { kind: 'down' }));
    }
  }
  // The first wave: every signature, its neighbours as the pairs of faces say.
  const wave = sigs.map((s) => s.index);
  const meets = (a: Signature, d: number, b: Signature) =>
    d === 0 ? pairs[0].has(`${a.keys[0]}|${b.keys[2]}`)
    : d === 2 ? pairs[0].has(`${b.keys[0]}|${a.keys[2]}`)
    : d === 1 ? pairs[1].has(`${a.keys[1]}|${b.keys[3]}`)
    : d === 3 ? pairs[1].has(`${b.keys[1]}|${a.keys[3]}`)
    : d === 4 ? pairs[2].has(`${a.keys[4]}|${b.keys[5]}`)
    : pairs[2].has(`${b.keys[4]}|${a.keys[5]}`);
  const propagator = [0, 1, 2, 3, 4, 5].map((d) => wave.map((a) => wave.flatMap((b, t) => (meets(sigs[a], d, sigs[b]) ? [t] : []))));
  // Only the letters the bays use (a model's palette names many more), the air first.
  const usedCodes = new Set<number>([0]);
  for (const m of motifs) for (const c of m.voxels) usedCodes.add(c);
  usedCodes.add(rampLetter);
  const kept = [...usedCodes].sort((a, b) => a - b);
  const recode = new Uint8Array(256);
  kept.forEach((c, i) => (recode[c] = i));
  for (const m of motifs) m.voxels = Uint8Array.from(m.voxels, (c) => recode[c]);
  const compact = kept.map((c) => alphabet[c]);
  const compactPalette = Object.fromEntries(compact.slice(1).map((ch) => [ch, palette[ch]]));
  const compactDoors = new Set([...doors].filter((d) => usedCodes.has(d)).map((d) => recode[d]));
  return {
    name,
    sources: reads.filter(({ r }) => r.t === (o.turns ?? [0])[0]).map(({ s, r }) => ({ universe: s.universe, model: s.model, name: s.name, seed: s.seed, nx: s.nx, ny: s.ny, nz: s.nz, ms: Math.round(s.ms), removed: s.removed, reached: r.reached })),
    alphabet: compact,
    palette: compactPalette,
    doors: compactDoors,
    paving: sources[0].paving,
    rampLetter: recode[rampLetter],
    motifs,
    bricks,
    sigs,
    pairs,
    wave,
    propagator,
    actions: sources[0].actions,
    dropped,
    ms: { read: Math.round(t1 - t0), build: Math.round(performance.now() - t1) },
  };
}

/** The bricks of a set that are not air nor the plain street: what «~50 bricks a building» counts (any turn of a brick is the same brick). */
export function buildingBricks(set: ExtractedSet): Map<string, { weight: number; family: Family; size: [number, number, number] }> {
  const out = new Map<string, { weight: number; family: Family; size: [number, number, number] }>();
  for (const b of set.bricks) {
    if (b.family === 'air' || b.family === 'street') continue;
    const e = out.get(b.canon) ?? { weight: 0, family: b.family, size: b.size };
    e.weight += b.weight;
    out.set(b.canon, e);
  }
  return out;
}
