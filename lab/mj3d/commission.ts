// The architect commissions the blocks (step 8E, ADR-0035). The plan comes first: the architect's program
// paints zones and marks, and the kernel reads off it every configuration each zone needs. A configuration
// is a cell of a zone with what lies round it: the four sides, the four diagonals, above and below, each
// as a zone or a kind of empty cell (a courtyard is not the land outside). Configurations that differ only
// by a quarter turn are one (blocks turn). The sculptor gets this list as an order and says, block by
// block, which configurations it serves; at composition a cell may only take the blocks of its own
// configuration. So a corner tower with the moat outside and a knot of walls between two courtyards are
// two orders, even if their four sides look alike to the sockets.
//
// The sockets can come from the plan too (socketsOf): a side facing another zone gets the name of that
// meeting ("A|W": water and houses on stilts), a side facing an empty cell the name of the kind of empty
// ("W~k:…", "W~fuori"). A block that leaves its sockets out (Block.auto) gets, for each configuration it
// serves, the sockets of that configuration as written (its canonical turn), so two zones that touch fit
// by construction and the sculptor only draws.

import { run, type Vec3 } from './engine';
import type { Blockset, Layout, Sockets, Zone } from './structure';

/** Grids of blocks may be much wider than a voxel model (same limits as structure.ts). */
const PLAN_LIMITS = { side: 128, cells: 128 * 128 * 8 };

export interface Config {
  /** Short name for the prompts: zone code and rank by frequency ("W1", "W2"…). */
  id: string;
  zone: string;
  /** Canonical signature: zone, then the classes round the cell in the turn that sorts first. */
  sig: string;
  count: number;
  /** One cell with this configuration (x, y, level). */
  at: Vec3;
  text: string;
  /** The classes round the cell, in the canonical turn (the order of AROUND). */
  parts: string[];
  /** The sockets a block drawn in this turn gets from the plan. */
  sockets: Sockets;
}

export interface Commission {
  /** The plan program's code in every cell. */
  cells: string[];
  /** Signature of every zone cell (undefined elsewhere). */
  sigs: Array<string | undefined>;
  configs: Config[];
  finished: boolean;
  steps: number;
  /** Nodes of the plan program that never did anything. */
  unused: string[];
}

export function planCells(layout: Layout, seed: number): { cells: string[]; finished: boolean; steps: number; unused: string[] } {
  const r = run({ size: layout.size, palette: {}, program: layout.program, ...(layout.unions ? { unions: layout.unions } : {}), ...(layout.origin ? { origin: layout.origin } : {}), ...(layout.ground ? { ground: layout.ground } : {}) }, seed, 50000, PLAN_LIMITS);
  return { cells: [...r.grid.cells].map((c) => r.grid.alphabet[c]), finished: r.finished, steps: r.steps, unused: r.unused ?? [] };
}

/** What a cell is, for its neighbours: a zone, an exact piece, a kind of empty cell, the outside. */
export function classOf(layout: Layout, ch: string | undefined): string {
  if (ch === undefined) return 'fuori';
  if (layout.zones?.[ch]) return `z:${ch}`;
  if (layout.palette?.[ch]) return `p:${ch}`;
  const open = layout.open?.[ch];
  return open ? `k:${[...open].sort().join(',')}` : 'fuori';
}

/** Words for a class, as the sculptor reads them. */
function nameOf(layout: Layout, cls: string): string {
  if (cls.startsWith('z:')) return layout.zones?.[cls.slice(2)]?.name ?? cls.slice(2);
  if (cls.startsWith('p:')) return `pezzo ${layout.palette[cls.slice(2)]?.block ?? cls.slice(2)}`;
  if (cls.startsWith('k:')) {
    const marks = Object.entries(layout.open ?? {}).filter(([, o]) => `k:${[...o].sort().join(',')}` === cls).map(([m]) => layout.paint?.[m]?.name ?? m);
    return [...new Set(marks)].join('/') || 'vuoto';
  }
  return cls;
}

// Order of the neighbours in a signature, and what a quarter turn clockwise does to it (north goes east).
const AROUND: Array<[string, number, number, number]> = [
  ['n', 0, -1, 0], ['e', 1, 0, 0], ['s', 0, 1, 0], ['o', -1, 0, 0],
  ['ne', 1, -1, 0], ['se', 1, 1, 0], ['so', -1, 1, 0], ['no', -1, -1, 0],
  ['sopra', 0, 0, 1], ['sotto', 0, 0, -1],
];
const TURN = [3, 0, 1, 2, 7, 4, 5, 6, 8, 9];
const turnOnce = (parts: string[]) => TURN.map((i) => parts[i]);
/** The canonical turn is chosen on the four sides first, then above and below, then the diagonals: so
 * configurations with the same sides share their turn, and one block drawn for them fits them all. */
const sortKey = (p: string[]) => [0, 1, 2, 3, 8, 9, 4, 5, 6, 7].map((i) => p[i]).join('|');

/** The sockets a configuration gives a block of its zone (see the header). */
export function socketsOf(zone: string, parts: string[]): Sockets {
  const me = `z:${zone}`;
  const pair = (c: string) => [me, c].sort().join('|');
  const side = (c: string) => (c.startsWith('z:') || c.startsWith('p:') ? pair(c) : `${zone}~${c}`);
  const vert = (c: string) => (c.startsWith('z:') || c.startsWith('p:') ? pair(c) : 'vuoto');
  return { n: side(parts[0]), e: side(parts[1]), s: side(parts[2]), w: side(parts[3]), u: vert(parts[8]), d: vert(parts[9]) };
}

/** The configurations of every zone of a plan, most frequent first within each zone. */
export function commission(layout: Layout, seed = 1, plan = planCells(layout, seed)): Commission {
  const [X, Y, Z] = layout.size;
  const { cells } = plan;
  const sigs: Array<string | undefined> = new Array(cells.length);
  const found = new Map<string, { zone: string; parts: string[]; count: number; at: Vec3 }>();
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const i = x + y * X + z * X * Y;
        const ch = cells[i];
        if (!layout.zones?.[ch]) continue;
        let parts = AROUND.map(([, dx, dy, dz]) => {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (nz < 0) return 'terra';
          if (nz >= Z) return 'cielo';
          return nx < 0 || ny < 0 || nx >= X || ny >= Y ? 'fuori' : classOf(layout, cells[nx + ny * X + nz * X * Y]);
        });
        // The turn that sorts first stands for all four.
        let best = parts;
        for (let k = 0; k < 3; k++) {
          parts = turnOnce(parts);
          if (sortKey(parts) < sortKey(best)) best = parts;
        }
        const sig = `${ch}§${best.join('|')}`;
        sigs[i] = sig;
        const f = found.get(sig);
        if (f) f.count++;
        else found.set(sig, { zone: ch, parts: best, count: 1, at: [x, y, z] });
      }
  const configs: Config[] = [];
  const byZone = new Map<string, Array<[string, { zone: string; parts: string[]; count: number; at: Vec3 }]>>();
  for (const e of found) (byZone.get(e[1].zone) ?? byZone.set(e[1].zone, []).get(e[1].zone)!).push(e);
  for (const [zone, list] of byZone) {
    list.sort((a, b) => b[1].count - a[1].count || (a[0] < b[0] ? -1 : 1));
    list.forEach(([sig, f], k) => {
      const w = f.parts.map((c) => nameOf(layout, c));
      const text = `${AROUND.slice(0, 4).map(([d], j) => `${d} ${w[j]}`).join(' · ')} | ${AROUND.slice(4, 8).map(([d], j) => `${d} ${w[4 + j]}`).join(' · ')} | sopra ${w[8]} · sotto ${w[9]}`;
      configs.push({ id: `${zone}${k + 1}`, zone, sig, count: f.count, at: f.at, text, parts: f.parts, sockets: socketsOf(zone, f.parts) });
    });
  }
  return { cells, sigs, configs, finished: plan.finished, steps: plan.steps, unused: plan.unused };
}

/** The order as the sculptor reads it: zone by zone, what each configuration has round it. */
export function commissionText(layout: Layout, c: Commission, perZone = 12): string {
  const lines: string[] = [];
  for (const [code, z] of Object.entries(layout.zones ?? {})) {
    const list = c.configs.filter((k) => k.zone === code);
    if (!list.length) continue;
    const total = list.reduce((s, k) => s + k.count, 0);
    lines.push(`Zona ${code} «${z.name ?? code}»${z.describe ? `: ${z.describe}` : ''} (${total} caselle, ${list.length} configurazioni)`);
    for (const k of list.slice(0, perZone)) lines.push(`  ${k.id} ×${k.count} (per esempio in ${k.at.join(',')}): ${k.text}`);
    if (list.length > perZone) {
      const rest = list.slice(perZone);
      lines.push(`  …e altre ${rest.length} configurazioni rare (${rest.reduce((s, k) => s + k.count, 0)} caselle): ${rest.map((k) => k.id).join(' ')}`);
    }
  }
  return lines.join('\n');
}

/** Short names ("W2") and zone codes the sculptor wrote, turned into what blocks keep (signatures, zones). */
export function resolveServes(serves: unknown, c?: Commission): string[] {
  const list = Array.isArray(serves) ? serves : typeof serves === 'string' ? serves.split(/[\s,]+/) : [];
  const byId = new Map((c?.configs ?? []).map((k) => [k.id, k.sig]));
  return [...new Set(list.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => byId.get(s.trim()) ?? s.trim()))];
}

// Same as structure.ts listsBlocks (kept here so that this module needs only types from there).
const lists = (z: Zone) => [...(z.blocks ?? '')].some((c) => c !== '.') || !!z.codes;

/** Orders no block serves: neither its configuration nor its whole zone. Zones listing their blocks are served. */
export function uncovered(layout: Layout, set: Blockset, c: Commission): Config[] {
  return c.configs.filter((k) => {
    const z = layout.zones?.[k.zone];
    if (z && lists(z)) return false;
    return !set.blocks.some((b) => b.serves?.includes(k.sig) || b.serves?.includes(k.zone));
  });
}
