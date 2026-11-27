// The way B (T543): the kernel's weaver of T522 (lab/strutture-modulari/tessuto.ts) with the large set, on the same massing as the way A.
// The bays of the grid are woven in regions on the grid of places, each a pure function of the seed and of its position: the corners where
// four places meet, the edges between two, the inside of a place; every region is a wave of MarkovJunior's solver (`WfcSolver`) with the
// letters of the massing banning what may not stand there, the regions before it fixed, and a margin around it fixed to the base fabric;
// a region whose solution leaves a room unreached in its window is tried again from another seed, and keeps the base fabric if none
// passes (Boris the Brave's «modifying in blocks»); with `stitch`, a solution is first stitched in its window (ricucitura.ts, on its own bays).
// The order in which the places are woven never changes a bay.
//
// The base fabric (`baseFabric`) is the massing dressed without a wave, valid by construction: the cores turned so that their doors open
// on the storey and the turret's on the roof; on every storey a building is rooms whose open sides meet and, where no room bay fits (walls on
// two opposite sides, as behind a core, or on three), corridors whose doorways meet a door of the rooms beside them; a street door on the
// ground and a door onto the terrace above where one fits; the roofs open, with a parapet only towards the air and the side of a bridge.

import { performance } from 'node:perf_hooks';
import { hash32, Rng } from '../../../src/kernel/rng';
import { DX, DY, DZ, WfcSolver } from '../../../src/mj/wfc';
import { moveCell, type BrickSet, type Face, type Pattern } from './facce';
import { goes, walkable, type Fabric } from './misure';
import { stitch } from './ricucitura';
import { PLACE } from './massa';
import { masksOf } from './via-a';

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
const OUT = (z: number) => (z === 0 ? 'S' : 'A');

/** The letter of the massing at a bay of the grid, and beyond it (the streets and the air of the places around). */
export type LetterAt = (x: number, y: number, z: number) => string;

// ---------------------------------------------------------------- the base fabric

const BUILDING = 'HB';
const OUTSIDE_GROUND = 'SYP';

export interface Base {
  at: (x: number, y: number, z: number) => number;
  /** Bays the base could not dress with a pattern that meets its neighbours (none, for a set that passes its checks). */
  misfits: string[];
  /** Storeys of buildings dressed with rooms only, or with some corridors too. */
  rooms: number;
  corridors: number;
}

/** The face classes a base bay wants on its four sides: P inside, D, W; `D?` a door or a wall. */
type Want = 'P' | 'D' | 'W' | 'D?';

const fits = (f: Face, w: Want) => (w === 'P' ? f.k === 'P' && f.io === 'i' : w === 'D' ? f.k === 'D' : w === 'W' ? f.k === 'W' : f.k === 'W' || f.k === 'D');

export function baseFabric(set: BrickSet, letter: LetterAt, X: number, Y: number, Z: number): Base {
  const byName = (suffix: string) => set.patterns.filter((p) => p.brick.name.endsWith(`/${suffix}`) || p.brick.name === suffix);
  const one = (suffix: string) => {
    const p = byName(suffix)[0];
    if (!p) throw new Error(`il tessuto di base vuole "${suffix}": il set non l'ha`);
    return p.index;
  };
  const out = new Map<string, number>();
  const misfits: string[] = [];
  const masks = masksOf(set);
  const inGrid = (x: number, y: number) => x >= 0 && y >= 0 && x < X && y < Y;
  const L = (x: number, y: number, z: number) => (inGrid(x, y) && z >= 0 && z < Z ? letter(x, y, z) : z < 0 ? 'X' : OUT(z));

  // The cores: a landing (q k T) and its flights (Q K V) beside it, turned once for the whole column (the shaft), the door at the end of
  // the landing: on the storey's building, on the ground also onto a street, a yard or a portico, above onto a terrace; the turret's onto
  // the roof (of the two turns that keep the flights where they are, the mirror swaps the lanes).
  const coreOf: Record<string, [string, string]> = { q: ['nucleo-terra', '0,0,0'], Q: ['nucleo-terra', '0,1,0'], k: ['nucleo-piano', '0,0,0'], K: ['nucleo-piano', '0,1,0'], T: ['torrino', '0,0,0'], V: ['torrino', '0,1,0'] };
  const coreChoice = new Map<string, Pattern>();
  const corePattern = (name: string, orig: string, t: number) => set.patterns.find((p) => p.brick.name.endsWith(`/${name}`) && p.orig === orig && p.t === t);
  const goodDoor = (l: string, n: string, z: number) => (l === 'T' ? n === 'R' : BUILDING.includes(n) || (z === 0 && OUTSIDE_GROUND.includes(n)) || n === 'R');
  const paired = new Set<string>();
  // How many storeys a column of the core has (its letters from the ground up), to pair a landing with the flights of its own core.
  const height = (x: number, y: number, letters: string) => {
    let z = 0;
    while (z < Z && letters.includes(L(x, y, z))) z++;
    return z;
  };
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      if (L(x, y, 0) !== 'q') continue;
      const h = height(x, y, 'qkT');
      const dir = [0, 1, 2, 3].find((d) => L(x + DX[d], y + DY[d], 0) === 'Q' && !paired.has(key(x + DX[d], y + DY[d], 0)) && height(x + DX[d], y + DY[d], 'QKV') === h);
      if (dir === undefined) {
        misfits.push(`nucleo senza rampe in ${x},${y}`);
        continue;
      }
      const fx = x + DX[dir], fy = y + DY[dir];
      paired.add(key(fx, fy, 0));
      let best: Array<[Pattern, Pattern]> = [], bestScore = -Infinity;
      for (let t = 0; t < 8; t++) {
        const a = moveCell(0, 0, 1, 2, t), b = moveCell(0, 1, 1, 2, t);
        if (b[0] - a[0] !== DX[dir] || b[1] - a[1] !== DY[dir]) continue;
        let score = 0;
        const picks: Array<[Pattern, Pattern]> = [];
        for (let z = 0; z < Z; z++) {
          const l = L(x, y, z);
          if (!'qkT'.includes(l)) break;
          // Of the two segments of this storey, the one whose doors all open where they should (the passing one first), else the one door.
          let pick: [Pattern, Pattern] | undefined, pickScore = -Infinity;
          for (const name of [coreOf[l][0]]) {
            const p = corePattern(name, '0,0,0', t), q = corePattern(name, '0,1,0', t);
            if (!p || !q) continue;
            const doors = [0, 1, 2, 3].filter((d) => p.faces[d].k === 'D');
            const ok = doors.filter((d) => goodDoor(l, L(x + DX[d], y + DY[d], z), z)).length;
            const sc = ok === doors.length ? 2 * ok : ok - 10;
            if (sc > pickScore) (pickScore = sc), (pick = [p, q]);
          }
          if (pick) picks.push(pick), (score += pickScore);
        }
        if (score > bestScore) (bestScore = score), (best = picks);
      }
      best.forEach(([p, q], z) => {
        coreChoice.set(key(x, y, z), p);
        coreChoice.set(key(fx, fy, z), q);
      });
    }
  const coreAt = (x: number, y: number, z: number): Pattern | undefined => coreChoice.get(key(x, y, z));

  // What stands beside a bay of a building, on each side: what it wants there.
  const side = (x: number, y: number, z: number, d: number): 'in' | 'door' | 'wall' | 'out' => {
    const nx = x + DX[d], ny = y + DY[d];
    const n = L(nx, ny, z);
    if (BUILDING.includes(n)) return 'in';
    const core = coreAt(nx, ny, z);
    if (core) return core.faces[(d + 2) % 4].k === 'D' ? 'door' : 'wall';
    if (z === 0 && OUTSIDE_GROUND.includes(n)) return 'out';
    if (n === 'R') return 'out';
    if (n === 'N') {
      const along = [0, 2].every((e) => L(nx + DX[e], ny + DY[e], z) !== 'A') ? 'x' : 'y';
      return (along === 'x') === (d === 0 || d === 2) ? 'out' : 'wall';
    }
    return 'wall';
  };

  // Every storey of every building, as one room or as corridors.
  let rooms = 0, corridors = 0;
  const done = new Set<string>();
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        if (!BUILDING.includes(L(x, y, z)) || done.has(key(x, y, z))) continue;
        const comp: Array<[number, number]> = [];
        const stack: Array<[number, number]> = [[x, y]];
        done.add(key(x, y, z));
        while (stack.length) {
          const [cx, cy] = stack.pop()!;
          comp.push([cx, cy]);
          for (let d = 0; d < 4; d++) {
            const nx = cx + DX[d], ny = cy + DY[d];
            if (inGrid(nx, ny) && BUILDING.includes(L(nx, ny, z)) && !done.has(key(nx, ny, z))) done.add(key(nx, ny, z)), stack.push([nx, ny]);
          }
        }
        const sides = comp.map(([cx, cy]) => [0, 1, 2, 3].map((d) => side(cx, cy, z, d)));
        // A bay is a corridor where no room bay fits it (walls on two opposite sides, or on three), and so is a bay that would need two
        // doors or a door and two walls (the room bays have at most a door and a wall beside it); a corridor's doorways meet a door of
        // the rooms beside it. Decided until nothing changes; the rest are rooms whose open sides meet.
        const index = new Map(comp.map(([cx, cy], i) => [`${cx},${cy}`, i]));
        const neighbour = (i: number, d: number) => index.get(`${comp[i][0] + DX[d]},${comp[i][1] + DY[d]}`);
        const corridor = new Uint8Array(comp.length);
        const roomFits = (walls: number[], doors: number[]) =>
          doors.length === 0 ? walls.length <= 1 || (walls.length === 2 && (walls[0] + walls[1]) % 2 === 1) : doors.length === 1 && (walls.length === 0 || (walls.length === 1 && (walls[0] + doors[0]) % 2 === 1));
        for (let changed = true; changed; ) {
          changed = false;
          for (let i = 0; i < comp.length; i++) {
            if (corridor[i]) continue;
            const walls = [0, 1, 2, 3].filter((d) => sides[i][d] === 'wall' || sides[i][d] === 'out');
            const doors = [0, 1, 2, 3].filter((d) => sides[i][d] === 'door' || (sides[i][d] === 'in' && corridor[neighbour(i, d)!]));
            if (!roomFits(walls, doors)) (corridor[i] = 1), (changed = true);
          }
        }
        // One door out: on the ground onto a street, a yard or a portico (or the storey is not reached), above onto a terrace if there
        // is one (the core reaches it anyway): the first bay and side where it fits.
        const wantOf = (i: number, door?: [number, number]): Want[] =>
          sides[i].map((s, d) => (s === 'in' ? (corridor[i] || corridor[neighbour(i, d)!] ? 'D' : 'P') : s === 'door' ? 'D' : s === 'wall' ? 'W' : door && door[0] === i && door[1] === d ? 'D' : 'W'));
        const pick = (i: number, door?: [number, number]) => {
          const [cx, cy] = comp[i];
          const mask = masks.get(L(cx, cy, z))!;
          const want = wantOf(i, door);
          const fam = corridor[i] ? 'corridor' : 'room';
          return set.patterns
            .filter((q) => mask[q.index] && q.brick.family === fam && q.brick.size.every((n) => n === 1) && want.every((w, d) => fits(q.faces[d], w)))
            .sort((p, q) => q.weight - p.weight)[0];
        };
        const outs: Array<[number, number]> = [];
        sides.forEach((ss, i) => ss.forEach((sd, d) => sd === 'out' && outs.push([i, d])));
        const door = outs.find((o) => pick(o[0], o));
        let picks: number[] | undefined = [];
        for (let i = 0; i < comp.length && picks; i++) {
          const p = pick(i, door && door[0] === i ? door : undefined);
          if (p) picks.push(p.index);
          else picks = undefined;
        }
        const asRoom = !corridor.some((c) => c);
        if (z === 0 && outs.length && !door) misfits.push(`nessun ingresso al piano terra in ${comp[0].join(',')}`);
        if (picks) {
          if (asRoom) rooms++;
          else corridors++;
          comp.forEach(([cx, cy], i) => out.set(key(cx, cy, z), picks![i]));
        } else {
          // A bay no piece of the set fits (a bay shut in by walls on every side): the first pattern its letter allows, said.
          comp.forEach(([cx, cy]) => {
            out.set(key(cx, cy, z), [...masks.get(L(cx, cy, z))!.keys()].find((t) => masks.get(L(cx, cy, z))![t])!);
            misfits.push(`${cx},${cy},${z}`);
          });
        }
      }

  const strada = one('strada'), cortile = one('cortile'), portico = one('portico'), aria = one('aria');
  const roofs = set.patterns.filter((p) => p.brick.family === 'roof' && rolesFree(p));
  const bridges = set.patterns.filter((p) => p.brick.family === 'bridge');
  const at = (x: number, y: number, z: number): number => {
    const k = key(x, y, z);
    const hit = out.get(k);
    if (hit !== undefined) return hit;
    const l = L(x, y, z);
    let v: number;
    const core = coreAt(x, y, z);
    if (core) v = core.index;
    else if (l === 'A') v = aria;
    else if (l === 'S') v = strada;
    else if (l === 'Y') v = cortile;
    else if (l === 'P') v = portico;
    else if (l === 'R') {
      // Open towards everything but the air and the side of a bridge, a parapet there.
      const want = [0, 1, 2, 3].map((d) => {
        const nx = x + DX[d], ny = y + DY[d], n = L(nx, ny, z);
        if (n === 'A') return 'R';
        if (n === 'N') return ([0, 2].every((e) => L(nx + DX[e], ny + DY[e], z) !== 'A') ? d === 0 || d === 2 : d === 1 || d === 3) ? 'P' : 'R';
        return 'P';
      });
      const p = roofs.filter((q) => want.every((w, d) => q.faces[d].k === w)).sort((a, b) => b.weight - a.weight)[0];
      v = p ? p.index : roofs[0].index;
      if (!p) misfits.push(`tetto ${k}`);
    } else if (l === 'N') {
      const alongX = [0, 2].every((e) => L(x + DX[e], y + DY[e], z) !== 'A');
      v = bridges.find((q) => (q.faces[0].k === 'P') === alongX)!.index;
    } else {
      v = aria;
      misfits.push(`${l} in ${k}`);
    }
    out.set(k, v);
    return v;
  };
  return { at, misfits, rooms, corridors };
}

/** A roof without what changes it from seed to seed: the base wants the plain ones (the WFC chooses the rest). */
const rolesFree = (p: Pattern) => /\/tetto(-bordo|-angolo|-corridoio|-testa|-isola)?$/.test(p.brick.name);

// ---------------------------------------------------------------- the weaver

export interface Options {
  seed: number;
  /** A region is taken only if every room, corridor, stair and core of it is reached in its window; with `roofs` its roofs too. */
  rule10?: boolean;
  roofs?: boolean;
  tries?: number;
  /** Seeds tried after the first, when a region has no solution or fails rule 10. */
  retries?: number;
  /** A region's solution is stitched in its window before the check (`ricucitura.ts`: walls of its own bays become doors). */
  stitch?: boolean;
}

export interface RegionLog {
  kind: string;
  at: string;
  cells: number;
  ms: number;
  tries: number;
  attempts: number;
  failed: boolean;
  why?: string;
}

/** A bay rule 10 wants reached in a region: a room, a corridor, a stair, a core, the turret; with `roofs` a roof. */
const wanted = (p: Pattern, roofs: boolean) => walkable(p) && ['room', 'corridor', 'stair', 'core', 'turret', ...(roofs ? ['roof'] : [])].includes(p.brick.family);

/**
 * The weaver over the grid of a massing whose bays 1..9N are N × N places of 9 bays (the grid's ring is the street around them, as the
 * district of the lab is made). `place(i, j)` weaves a place: its corners and its edges first (each once, from its own seed), then its inside.
 */
export class Weaver {
  readonly cells = new Map<string, number>();
  readonly log: RegionLog[] = [];
  private done = new Set<string>();
  private masks: Map<string, Uint8Array>;
  readonly base: Base;

  constructor(readonly set: BrickSet, readonly letter: LetterAt, readonly X: number, readonly Y: number, readonly Z: number, readonly o: Options) {
    this.masks = masksOf(set);
    this.base = baseFabric(set, letter, X, Y, Z);
  }

  /** The letter of the massing anywhere (beyond the grid: the streets and the air of the places around). */
  private L(x: number, y: number, z: number): string {
    return x >= 0 && y >= 0 && x < this.X && y < this.Y ? this.letter(x, y, z) : OUT(z);
  }

  /** The first bay of place i along an axis (the grid's ring is bay 0). */
  private static first = (i: number) => 1 + PLACE * i;

  private solve(kind: string, at: string, todo: Array<[number, number]>, ring: Array<[number, number]>, seedParts: number[], margin: Array<[number, number]>): void {
    const t0 = performance.now();
    const Z = this.Z;
    const all = [...todo, ...ring, ...margin];
    const x0 = Math.min(...all.map((c) => c[0])), x1 = Math.max(...all.map((c) => c[0]));
    const y0 = Math.min(...all.map((c) => c[1])), y1 = Math.max(...all.map((c) => c[1]));
    const MX = x1 - x0 + 1, MY = y1 - y0 + 1;
    const P = this.set.patterns.length;
    const fixed = new Map<string, number>();
    for (const [gx, gy] of ring) for (let z = 0; z < Z; z++) fixed.set(key(gx, gy, z), this.cells.get(key(gx, gy, z))!);
    for (const [gx, gy] of margin) for (let z = 0; z < Z; z++) fixed.set(key(gx, gy, z), this.base.at(gx, gy, z));
    const inRegion = new Set(all.map(([x, y]) => `${x},${y}`));
    let attempts = 0, tries = 0, why = '';
    for (let attempt = 0; attempt <= (this.o.retries ?? 8); attempt++) {
      attempts++;
      const solver = new WfcSolver({ MX, MY, MZ: Z, weights: this.set.weights, propagator: this.set.propagator, periodic: false, shannon: false });
      for (let y = 0; y < MY; y++)
        for (let x = 0; x < MX; x++) {
          const gx = x0 + x, gy = y0 + y;
          if (!inRegion.has(`${gx},${gy}`)) throw new Error(`la regione ${kind} ${at} non è un rettangolo`);
          for (let z = 0; z < Z; z++) {
            const i = x + y * MX + z * MX * MY;
            const f = fixed.get(key(gx, gy, z));
            const mask = this.masks.get(this.L(gx, gy, z))!;
            for (let t = 0; t < P; t++) if ((f !== undefined ? t !== f : !mask[t]) && solver.allows(i, t)) solver.ban(i, t);
          }
        }
      const out = solver.solve(new Rng(hash32(this.o.seed, ...seedParts, attempt)), this.o.tries ?? 50, performance.now() + 20_000, () => performance.now());
      tries += out.tries;
      if (!out.observed) {
        why = out.why ?? (out.late ? 'tempo' : '');
        continue;
      }
      const obs = out.observed;
      const get = (gx: number, gy: number, gz: number) => obs[gx - x0 + (gy - y0) * MX + gz * MX * MY];
      if (this.o.stitch) {
        // The region alone as a fabric: its window, the streets and the edge of the window as what is reached, only its own bays changed.
        const own = new Uint8Array(MX * MY * Z);
        for (const [gx, gy] of todo) for (let z = 0; z < Z; z++) own[gx - x0 + (gy - y0) * MX + z * MX * MY] = 1;
        const mini: Fabric = { set: this.set, X: MX, Y: MY, Z, at: obs, letter: (x, y, z) => this.L(x0 + x, y0 + y, z) };
        stitch(mini, (p) => wanted(p, !!this.o.roofs), { window: { x0: 0, y0: 0, x1: MX - 1, y1: MY - 1, edge: 'all' }, mutable: (i) => own[i] === 1 });
      }
      if (this.o.rule10) {
        const seen = this.reach(get, x0, y0, x1, y1);
        const lost = todo.some(([gx, gy]) => [...Array(Z).keys()].some((z) => wanted(this.set.patterns[get(gx, gy, z)], !!this.o.roofs) && !seen.has(key(gx, gy, z))));
        if (lost) {
          why = 'regola 10: un vano non si raggiunge';
          continue;
        }
      }
      for (const [gx, gy] of todo) for (let z = 0; z < Z; z++) this.cells.set(key(gx, gy, z), get(gx, gy, z));
      this.log.push({ kind, at, cells: todo.length * Z, ms: performance.now() - t0, tries, attempts, failed: false });
      return;
    }
    for (const [gx, gy] of todo) for (let z = 0; z < Z; z++) this.cells.set(key(gx, gy, z), this.base.at(gx, gy, z));
    this.log.push({ kind, at, cells: todo.length * Z, ms: performance.now() - t0, tries, attempts, failed: true, why });
  }

  /** The bays reached in a window, from its streets and from its edge (what lies beyond may reach them). */
  private reach(get: (x: number, y: number, z: number) => number, x0: number, y0: number, x1: number, y1: number): Set<string> {
    const seen = new Set<string>();
    const stack: Array<[number, number, number]> = [];
    const P = this.set.patterns;
    for (let gy = y0; gy <= y1; gy++)
      for (let gx = x0; gx <= x1; gx++)
        for (let gz = 0; gz < this.Z; gz++) {
          const p = P[get(gx, gy, gz)];
          const rim = gx === x0 || gy === y0 || gx === x1 || gy === y1;
          if (walkable(p) && ((gz === 0 && this.L(gx, gy, 0) === 'S') || rim)) seen.add(key(gx, gy, gz)), stack.push([gx, gy, gz]);
        }
    while (stack.length) {
      const [x, y, z] = stack.pop()!;
      const p = P[get(x, y, z)];
      for (let d = 0; d < 6; d++) {
        const nx = x + DX[d], ny = y + DY[d], nz = z + DZ[d];
        if (nx < x0 || ny < y0 || nx > x1 || ny > y1 || nz < 0 || nz >= this.Z || seen.has(key(nx, ny, nz))) continue;
        if (!goes(p, P[get(nx, ny, nz)], d)) continue;
        seen.add(key(nx, ny, nz));
        stack.push([nx, ny, nz]);
      }
    }
    return seen;
  }

  /** The corner where places (i-1, j-1), (i, j-1), (i-1, j), (i, j) meet: 2 × 2 bays, a margin of one bay around. */
  corner(i: number, j: number): void {
    const k = `c${i},${j}`;
    if (this.done.has(k)) return;
    this.done.add(k);
    const cx = Weaver.first(i), cy = Weaver.first(j);
    const cells: Array<[number, number]> = [];
    const margin: Array<[number, number]> = [];
    for (let gx = cx - 2; gx <= cx + 1; gx++) for (let gy = cy - 2; gy <= cy + 1; gy++) ((gx === cx - 1 || gx === cx) && (gy === cy - 1 || gy === cy) ? cells : margin).push([gx, gy]);
    this.solve('angolo', `${i},${j}`, cells, [], [1, i, j], margin);
  }

  /** The edge between places (i-1, j) and (i, j) (`vertical`), or between (i, j-1) and (i, j). */
  edge(i: number, j: number, vertical: boolean): void {
    const k = `${vertical ? 'v' : 'h'}${i},${j}`;
    if (this.done.has(k)) return;
    this.done.add(k);
    const todo: Array<[number, number]> = [], ring: Array<[number, number]> = [], margin: Array<[number, number]> = [];
    const fi = Weaver.first(i), fj = Weaver.first(j);
    if (vertical) {
      this.corner(i, j);
      this.corner(i, j + 1);
      for (const gx of [fi - 1, fi]) {
        for (let gy = fj + 1; gy <= fj + PLACE - 2; gy++) todo.push([gx, gy]);
        ring.push([gx, fj], [gx, fj + PLACE - 1]);
      }
      for (const gx of [fi - 2, fi + 1]) for (let gy = fj; gy <= fj + PLACE - 1; gy++) margin.push([gx, gy]);
    } else {
      this.corner(i, j);
      this.corner(i + 1, j);
      for (const gy of [fj - 1, fj]) {
        for (let gx = fi + 1; gx <= fi + PLACE - 2; gx++) todo.push([gx, gy]);
        ring.push([fi, gy], [fi + PLACE - 1, gy]);
      }
      for (const gy of [fj - 2, fj + 1]) for (let gx = fi; gx <= fi + PLACE - 1; gx++) margin.push([gx, gy]);
    }
    this.solve(vertical ? 'bordo-v' : 'bordo-o', `${i},${j}`, todo, ring, [vertical ? 2 : 3, i, j], margin);
  }

  /** A place: its edges and corners first, then its inside (7 × 7 bays with its ring fixed). */
  place(i: number, j: number): void {
    const k = `p${i},${j}`;
    if (this.done.has(k)) return;
    this.edge(i, j, true);
    this.edge(i + 1, j, true);
    this.edge(i, j, false);
    this.edge(i, j + 1, false);
    this.done.add(k);
    const todo: Array<[number, number]> = [], ring: Array<[number, number]> = [];
    const fi = Weaver.first(i), fj = Weaver.first(j);
    for (let ly = 0; ly < PLACE; ly++)
      for (let lx = 0; lx < PLACE; lx++) {
        const c: [number, number] = [fi + lx, fj + ly];
        (lx === 0 || ly === 0 || lx === PLACE - 1 || ly === PLACE - 1 ? ring : todo).push(c);
      }
    this.solve('luogo', `${i},${j}`, todo, ring, [4, i, j], []);
  }

  /** The pattern of every bay of the grid (the ring of the grid, outside the places, is the base fabric's). */
  grid(): Int32Array {
    const out = new Int32Array(this.X * this.Y * this.Z);
    for (let z = 0; z < this.Z; z++)
      for (let y = 0; y < this.Y; y++) for (let x = 0; x < this.X; x++) out[x + y * this.X + z * this.X * this.Y] = this.cells.get(key(x, y, z)) ?? this.base.at(x, y, z);
    return out;
  }
}
