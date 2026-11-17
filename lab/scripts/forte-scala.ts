// The scale of the author's fort (T403, D60): its parts measured on the grid its program makes, in voxels, then in tiles and in
// wanderers at 20, 10 and 5 voxels a tile (the wanderer is 30 voxels at 20, 1.5 tiles: `viandante.xml`, PARTS). Nothing by eye:
// every number is read from the places where one stands (a voxel with something under it and air over it) and the letters of the
// palette: the paving A, the road V, the walls S, their walk D and merlons M, the gatehouse G, the keep's wood f and floors F, its
// walls K (also the barracks', solid), the towers T, the stairs Q.
//
//   npx vite-node lab/scripts/forte-scala.ts -- [--semi 1,2,3] [--json lab/banco/riferimento/forte-scala.json] [--file <xml>]

import fs from 'node:fs';
import { compileMjx } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import type { Grid3 } from '../../src/mj/engine';

const args = process.argv.slice(2);
const opt = (name: string, fallback?: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
const FILE = opt('file', 'lab/mjx/models/handmade/forte-handmade.xml')!;
const SEEDS = opt('semi', '1')!.split(',').map(Number);
const JSON_OUT = opt('json');
const DENSITIES = [20, 10, 5];
/** The wanderer: 30 voxels tall at 20 a tile (lab/mjx/models/viandante.xml, size 20 15 30), 1.5 tiles. */
const WANDERER_TILES = 1.5;

/** A place where one stands: the column, the height of the feet, the clear height over them and the letters under and over. */
interface Stand {
  x: number;
  y: number;
  z: number;
  clear: number;
  under: string;
  over: string;
}

function stands(g: Grid3): { list: Stand[]; has: (x: number, y: number, l: string) => boolean } {
  const XY = g.X * g.Y;
  const name = (c: number) => (c ? g.alphabet[c] : '');
  const list: Stand[] = [];
  const letters: Array<Set<string>> = [];
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++) {
      const i = x + y * g.X;
      const set = new Set<string>();
      for (let z = 0; z < g.Z; z++) {
        const c = g.cells[i + z * XY];
        if (c) set.add(name(c));
        if (z === 0 || c || !g.cells[i + (z - 1) * XY]) continue;
        let top = z;
        while (top < g.Z && !g.cells[i + top * XY]) top++;
        list.push({ x, y, z, clear: top - z, under: name(g.cells[i + (z - 1) * XY]), over: top < g.Z ? name(g.cells[i + top * XY]) : '' });
      }
      letters[i] = set;
    }
  return { list, has: (x, y, l) => letters[x + y * g.X].has(l) };
}

/** The most frequent value. */
function mode(values: number[]): number {
  const count = new Map<number, number>();
  for (const v of values) count.set(v, (count.get(v) ?? 0) + 1);
  let best = { value: NaN, n: 0 };
  for (const [value, n] of count) if (n > best.n) best = { value, n };
  return best.value;
}

interface Piece {
  n: number;
  /** The longer and the shorter side of its box. */
  w: number;
  d: number;
  cx: number;
  cy: number;
  /** The axis of its longer side. */
  ax: 'x' | 'y';
}

/** The 4-connected pieces of a set of columns, each with its box and its centre, the largest first. */
function pieces(cols: Array<[number, number]>): Piece[] {
  const key = (x: number, y: number) => x * 65536 + y;
  const left = new Set(cols.map(([x, y]) => key(x, y)));
  const out: Piece[] = [];
  for (const [sx, sy] of cols) {
    if (!left.delete(key(sx, sy))) continue;
    const stack: Array<[number, number]> = [[sx, sy]];
    let n = 0, x0 = sx, x1 = sx, y0 = sy, y1 = sy;
    while (stack.length) {
      const [x, y] = stack.pop()!;
      n++;
      (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (left.delete(key(x + dx, y + dy))) stack.push([x + dx, y + dy]);
    }
    const a = x1 - x0 + 1, b = y1 - y0 + 1;
    out.push({ n, w: Math.max(a, b), d: Math.min(a, b), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, ax: a >= b ? 'x' : 'y' });
  }
  return out.sort((p, q) => q.n - p.n);
}

/** A storey: the height of its floor over the courtyard's paving and its clear height, in voxels. */
interface Storey {
  floor: number;
  clear: number;
}

export interface FortMeasures {
  seed: number;
  ms: number;
  box: [number, number, number];
  /** Where one stands on the paving, voxels from the bottom of the grid. */
  ground: number;
  /** In voxels over the courtyard's paving: the walk on the walls, the top of their merlons; the corridor inside them, its clear height. */
  walls: { walk: number; merlons: number; corridor: number };
  gate: { width: number; height: number };
  hall: Storey;
  keepDoor: { width: number; height: number; depth: number };
  /** The keep's storeys over the hall, and its top (the terrace one stands on). */
  keepStoreys: Storey[];
  keepTop: number;
  towerStoreys: Storey[];
  towerTop: number;
  /** The stairs: the rise of a step (voxels) and how high the longest flights climb. */
  stair: { rise: number; flights: number[] };
  /** Where to look, in grid voxels (x, y, z): for the photos of lab/scripts/foto-scala.mjs. */
  spots: Record<'keepDoor' | 'hall' | 'wall' | 'tower' | 'gate', [number, number, number]>;
  /** Out of the keep's door, towards the courtyard: a unit step in the grid (x, y). */
  keepDoorOut: [number, number];
}

function measure(xml: string, seed: number): FortMeasures {
  const t0 = performance.now();
  const r = runMjx(compileMjx(xml, {}), seed, { deadline: 600_000 });
  const ms = Math.round(performance.now() - t0);
  const g = r.grid;
  const { list, has } = stands(g);
  // The ground: where one stands on the courtyard's paving (A) and the road (V).
  const ground = mode(list.filter((s) => s.under === 'A' || s.under === 'V').map((s) => s.z));
  const over = (z: number) => z - ground;
  const byZ = (where: Stand[], least: number): Storey[] => {
    const at = new Map<number, Stand[]>();
    for (const s of where) (at.get(s.z) ?? at.set(s.z, []).get(s.z)!).push(s);
    return [...at.entries()].filter(([, ss]) => ss.length >= least).sort((a, b) => a[0] - b[0]).map(([z, ss]) => ({ floor: over(z), clear: mode(ss.filter((s) => s.over).map((s) => s.clear)) }));
  };

  // The walls (S, the outer face O): the walk on them (D), the merlons over it (M), the corridor inside them (on S, under D).
  const wallCol = (s: Stand) => has(s.x, s.y, 'S') && !has(s.x, s.y, 'T') && !has(s.x, s.y, 'K') && !has(s.x, s.y, 'G');
  const walks = list.filter((s) => s.under === 'D' && wallCol(s));
  const walkZ = mode(walks.map((s) => s.z));
  const onWalk = walks.filter((s) => s.z === walkZ);
  const merlonTops = list.filter((s) => s.under === 'M' && wallCol(s) && s.z > walkZ).map((s) => s.z);
  const corridor = mode(list.filter((s) => s.under === 'S' && s.over === 'D' && wallCol(s)).map((s) => s.clear));
  const wallSpot = onWalk[Math.floor(onWalk.length / 3)];

  // The gate of the fort: on the road (V) under the gatehouse (G).
  const gateCols = list.filter((s) => s.under === 'V' && s.over === 'G' && s.z === ground);
  const gateH = mode(gateCols.map((s) => s.clear));
  const gate = pieces(gateCols.filter((s) => s.clear === gateH).map((s) => [s.x, s.y]))[0];

  // The keep: where its wooden floor (f) is on the ground, and a wall's thickness around (K is also the barracks', which are solid).
  const keep = new Uint8Array(g.X * g.Y);
  const R = 6;
  for (const s of list)
    if (s.z === ground && s.under === 'f')
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) {
          const x = s.x + dx, y = s.y + dy;
          if (x >= 0 && y >= 0 && x < g.X && y < g.Y) keep[x + y * g.X] = 1;
        }
  const inKeep = list.filter((s) => keep[s.x + s.y * g.X]);
  // The hall is its ground floor: on the wood, under the first floor (F).
  const hallStands = inKeep.filter((s) => s.z === ground && s.under === 'f');
  const hallClear = mode(hallStands.filter((s) => s.over === 'F').map((s) => s.clear));
  const hallCovered = hallStands.filter((s) => s.over === 'F' && s.clear === hallClear);
  // Its door: on the hall's floor, under the keep's wall (K) and lower than the hall.
  const doorCols = hallStands.filter((s) => s.over === 'K' && s.clear < hallClear);
  const doorH = mode(doorCols.map((s) => s.clear));
  const door = pieces(doorCols.filter((s) => s.clear === doorH).map((s) => [s.x, s.y]))[0];
  // Which way is out: across the wall, the side where the hall is not.
  const hallSet = new Set(hallStands.map((s) => s.x * 65536 + s.y));
  const [nx, ny] = door?.ax === 'x' ? [0, 1] : [1, 0];
  const inHall = (k: number) => !!door && hallSet.has(Math.round(door.cx + nx * k) * 65536 + Math.round(door.cy + ny * k));
  const outSign = inHall(8) ? -1 : 1;
  // The storeys over it: on a floor (F) under another floor or the terrace; the top: on the terrace (D), open above.
  const keepStoreys = byZ(inKeep.filter((s) => s.under === 'F' && (s.over === 'F' || s.over === 'D')), 50);
  const keepTop = over(Math.max(...inKeep.filter((s) => s.under === 'D' && !s.over).map((s) => s.z)));
  // The hall's spot: the covered column nearest to its middle.
  const mid = hallCovered.reduce((a, s) => [a[0] + s.x / hallCovered.length, a[1] + s.y / hallCovered.length], [0, 0]);
  const dist = (s: Stand) => Math.hypot(s.x - mid[0], s.y - mid[1]);
  const hallSpot = hallCovered.reduce((b, s) => (dist(s) < dist(b) ? s : b), hallCovered[0]);

  // The towers: their columns have T and are not the keep's; the room's base is on T, the floors are D, the top is open.
  const inTower = list.filter((s) => has(s.x, s.y, 'T') && !keep[s.x + s.y * g.X]);
  const towerStoreys = byZ(inTower.filter((s) => (s.under === 'T' || s.under === 'D') && s.over === 'D'), 100);
  const towerTops = inTower.filter((s) => s.under === 'D' && !s.over);
  const towerTopZ = mode(towerTops.map((s) => s.z));
  const tower = pieces(towerTops.filter((s) => s.z === towerTopZ).map((s) => [s.x, s.y]))[0];

  // The stairs (Q): every step is a stand on Q; the rise between neighbouring steps.
  const qs = list.filter((s) => s.under === 'Q');
  const at = new Map(qs.map((s) => [s.x * 65536 + s.y, s.z]));
  const rises: number[] = [];
  for (const s of qs)
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const z = at.get((s.x + dx) * 65536 + s.y + dy);
      if (z !== undefined && z !== s.z) rises.push(Math.abs(z - s.z));
    }
  // A flight: a piece of Q columns; how high it climbs, its highest step over its lowest.
  const flights = pieces(qs.map((s) => [s.x, s.y]))
    .slice(0, 6)
    .map((p) => {
      const zs = qs.filter((s) => Math.abs(s.x - p.cx) <= p.w / 2 && Math.abs(s.y - p.cy) <= p.w / 2).map((s) => s.z);
      return Math.max(...zs) - Math.min(...zs);
    });

  return {
    seed,
    ms,
    box: [g.X, g.Y, g.Z],
    ground,
    walls: { walk: over(walkZ), merlons: over(mode(merlonTops)), corridor },
    gate: { width: gate?.w ?? 0, height: gateH },
    hall: { floor: 0, clear: hallClear },
    keepDoor: { width: door?.w ?? 0, depth: door?.d ?? 0, height: doorH },
    keepStoreys,
    keepTop,
    towerStoreys,
    towerTop: over(towerTopZ),
    stair: { rise: mode(rises), flights },
    spots: {
      keepDoor: [door?.cx ?? 0, door?.cy ?? 0, ground],
      hall: [hallSpot?.x ?? 0, hallSpot?.y ?? 0, ground],
      wall: [wallSpot?.x ?? 0, wallSpot?.y ?? 0, walkZ],
      tower: [tower?.cx ?? 0, tower?.cy ?? 0, towerTopZ],
      gate: [gate?.cx ?? 0, gate?.cy ?? 0, ground],
    },
    keepDoorOut: [nx * outSign, ny * outSign],
  };
}

const xml = fs.readFileSync(FILE, 'utf8');
const all: FortMeasures[] = [];
for (const seed of SEEDS) {
  const m = measure(xml, seed);
  all.push(m);
  console.log(JSON.stringify(m));
}

// The table: voxels (every seed, when they differ), then tiles and wanderers at each density, from the first seed.
const fmt = (v: number) => v.toLocaleString('it', { maximumFractionDigits: 2 });
const rowsOf = (m: FortMeasures): Array<[string, number]> => [
  ['camminatoio delle mura (dal selciato)', m.walls.walk],
  ['parapetto sul camminatoio, la sua cima (dal selciato)', m.walls.merlons],
  ['corridoio dentro le mura, luce', m.walls.corridor],
  ['porta del forte (sotto la torre della porta), luce', m.gate.height],
  ['porta del forte, larghezza', m.gate.width],
  ['sala del trono (piano terra del mastio), luce', m.hall.clear],
  ['porta del mastio, luce', m.keepDoor.height],
  ['porta del mastio, larghezza', m.keepDoor.width],
  ...m.keepStoreys.map((s, i): [string, number] => [`mastio, piano ${i + 2}, luce`, s.clear]),
  ['mastio, terrazza in cima (dal selciato)', m.keepTop],
  ...m.towerStoreys.map((s, i): [string, number] => [`torre, piano ${i + 1}, luce`, s.clear]),
  ['torre, terrazza in cima (dal selciato)', m.towerTop],
  ['scale, alzata di un gradino', m.stair.rise],
  ['scale, la rampa più lunga sale di', Math.max(...m.stair.flights)],
];
const first = rowsOf(all[0]);
const others = all.slice(1).map(rowsOf);
const lines = [
  `| misura | voxel (semi ${SEEDS.join(', ')}) | ${DENSITIES.map((d) => `a ${d}: caselle · **viandanti**`).join(' | ')} |`,
  `|---|---|${DENSITIES.map(() => '---').join('|')}|`,
  ...first.map(([label, v], i) => {
    const seen = [v, ...others.map((o) => o.find(([l]) => l === label)?.[1] ?? NaN)];
    const voxels = new Set(seen).size === 1 ? String(v) : seen.map((x) => (Number.isNaN(x) ? '—' : String(x))).join(' · ');
    void i;
    return `| ${label} | ${voxels} | ${DENSITIES.map((d) => `${fmt(v / d)} · **${fmt(v / d / WANDERER_TILES)}**`).join(' | ')} |`;
  }),
];
console.log(lines.join('\n'));
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ file: FILE, wandererTiles: WANDERER_TILES, densities: DENSITIES, seeds: all }, null, 1) + '\n');
