// Structures that take more than one tile (castles, dungeons, houses, bridges): a third layer.
//
// 1. Blocks: the block sculptor writes a set of blocks, each one tile wide and one level tall
//    (TILE × TILE × LEVEL voxels), with a socket on every side (a label for what that side looks like:
//    "muro", "vuoto", "acqua"…), whether one can walk on it, and actions that turn it into another block
//    (a drawbridge lowered and raised, a door open and shut).
// 2. Catalogue: the kernel turns the blocks into variants (block × quarter turn, without duplicates) and
//    computes once which variant may touch which in each of the six directions: the sockets must agree
//    and the voxels of the two faces must continue each other. These are the only combinations there are.
// 3. Layout: the architect paints zones with a MarkovJunior program at the scale of blocks (moat, walls,
//    courtyard…) and says which blocks each zone admits; unique pieces it may place exactly. The kernel's
//    wave function collapse (wfc.ts) picks block and turn for every zone cell among the catalogue's
//    combinations, so that every touching pair fits by construction.
// 4. Detail: like the rules MarkovJunior runs inside its "wfc" node once the tiles are down, the layout
//    may carry a program that runs on the composed voxels of the whole structure, where rules see across
//    the borders of blocks: ivy that climbs several walls, moss at the foot of every wall in the water,
//    a gravel road painted by the layout (paint) and worn at its edges.
// 5. The kernel keeps the tile map for the game (per tile and level: the block, walkable or not, its
//    actions) and photographs the structure block by block (composite.ts).

import { mendNode, mendProgram, mendUnions } from './check';
import { AIR, Mj3Error, run, runOn, type Grid3, type GridLimits, type Node3, type PaletteEntry, type Program3, type Vec3 } from './engine';
import { hash32 } from '../../src/kernel/rng';
import { TILE } from './scale';
import { DIR6, solve, words, type WfcResult } from './wfc';
import { classOf, commission as commissionOf, planCells, resolveServes, type Commission, type Config } from './commission';

export const LEVEL = TILE;
export const SIDES = ['n', 'e', 's', 'w'] as const;
export type Side = (typeof SIDES)[number];
export type Sockets = Record<Side, string> & { u?: string; d?: string };

/** Layouts are grids of blocks: they may be much wider than a voxel model. */
export const LAYOUT_LIMITS: GridLimits = { side: 128, cells: 128 * 128 * 8 };

export interface BlockAction {
  label: string;
  /** Code of the block this one becomes. */
  to: string;
}

export interface Block {
  /** One character: how layouts refer to it. */
  code: string;
  /** The code the sculptor wrote, when it was longer than one character and the kernel gave it another. */
  alias?: string;
  name: string;
  role?: string;
  walk: boolean;
  sockets: Sockets;
  actions?: BlockAction[];
  /**
   * What the block was made for (commission.ts): zone codes (every configuration of the zone) or the
   * signatures of single configurations. Zones of a layout without an explicit list take their blocks
   * from here, configuration by configuration.
   */
  serves?: string[];
  /** How often the collapse picks it among the blocks of a cell (1 by default; an accent, like a boat, much less). */
  weight?: number;
  /** The sculptor left the sockets out: the kernel takes them from each configuration served (commission.ts). */
  auto?: boolean;
  /** For a block the kernel derived (sockets of one configuration): the code of the block drawn. */
  base?: string;
  program: Program3;
}

export interface Blockset {
  name: string;
  /** What each socket's face looks like, in voxels: the protocol every block keeps to. */
  faces?: Record<string, string>;
  /** Sockets that may face the outside (nothing): "vuoto" always may; water, a bridge's end… */
  open?: string[];
  blocks: Block[];
}

export interface LayoutEntry {
  block: string;
  /** Quarter turns clockwise seen from above (north → east). */
  rot?: number;
}

export interface Zone {
  name?: string;
  /** What the zone is for, in words: the sculptor reads it in the commission. */
  describe?: string;
  /** Block codes the zone admits, in every turn; "." admits the empty cell. A repeated code weighs more. */
  blocks?: string;
  /** Exact variants (palette codes), for zones that want given turns. */
  codes?: string;
}

/** A zone that names its blocks (or exact variants); otherwise its blocks are those made for it (the commission). */
export const listsBlocks = (z: Zone) => [...(z.blocks ?? '')].some((c) => c !== AIR) || !!z.codes;

export interface Layout {
  name?: string;
  /** In blocks: tiles across, tiles deep, levels. */
  size: Vec3;
  /** Code → zone: the kernel chooses block and turn. */
  zones?: Record<string, Zone>;
  /** Code → exact block and turn. */
  palette: Record<string, LayoutEntry>;
  origin?: string;
  ground?: string;
  /** Symbol → codes, for the rules of the layout program. */
  unions?: Record<string, string>;
  /**
   * Marks of the program painted on the ground of their tile, one voxel thick (roads, paving, a lawn);
   * `under` lists zone codes whose tiles get the same ground (a well or a tree in the courtyard).
   */
  paint?: Record<string, PaletteEntry & { under?: string }>;
  /**
   * Marks that are empty cells of a kind of their own, with the sockets they accept: a courtyard accepts
   * "vuoto" and a house front but not water, while the land outside (any mark not listed) accepts the
   * blockset's open sockets. Without it, every empty cell is the same to the collapse.
   */
  open?: Record<string, string[]>;
  /** Rules on the composed voxels of the whole structure (see the header). */
  detail?: Detail;
  /**
   * The materials of the structure, chosen by the architect with the plan: letter → name and colour. The
   * block sculptor uses these letters for these materials, and the detail program names them.
   */
  materials?: Record<string, PaletteEntry>;
  program: Node3;
}

/** A program on the composed structure: its codes are the blocks' materials and the painted marks. */
export interface Detail {
  /** New codes the rules write (ivy, moss, gravel…). */
  palette?: Record<string, PaletteEntry>;
  unions?: Record<string, string>;
  program: Node3;
}

export interface Placement {
  x: number;
  y: number;
  z: number;
  code: string;
  block: Block;
  rot: number;
}

// ------------------------------------------------------------------ mending

const isSocket = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
const label = (v: unknown) => String(v).trim().toLowerCase();

const CODE_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Sculptors write codes like "MC" or "K2": a code is one character, so a long or repeated one gets a free
 * character (its own letters first) and is kept as alias. With `prior`, codes and aliases of that set mean
 * its blocks (a block rewritten with the same code replaces it), and new blocks never take their codes.
 */
export function mendBlockset(raw: unknown, notes: string[] = [], prior?: Blockset, orders?: Commission): Blockset | null {
  const r = raw as any;
  const list = Array.isArray(r?.blocks) ? r.blocks : Array.isArray(r) ? r : [];
  const blocks: Block[] = [];
  const used = new Set<string>();
  const known = new Map<string, string>();
  for (const b of prior?.blocks ?? []) {
    known.set(b.code, b.code);
    if (b.alias) known.set(b.alias, b.code);
  }
  const taken = (c: string) => used.has(c) || known.has(c) || c === AIR || c === '*';
  const aliases = new Map(known);
  for (const b of list) {
    const written = typeof b?.code === 'string' ? b.code.trim() : '';
    if (!written) {
      notes.push('blocco senza codice ignorato');
      continue;
    }
    let code = known.get(written);
    if (code && used.has(code)) code = undefined;
    if (!code && written.length === 1 && !taken(written)) code = written;
    if (!code) {
      const mine = [...[...written].map((ch) => ch.toUpperCase()), ...[...written].map((ch) => ch.toLowerCase())];
      code = [...mine, ...CODE_POOL].find((ch) => ch.length === 1 && !taken(ch));
      for (let i = 0; !code && i < 200; i++) if (!taken(String.fromCharCode(0xc0 + i))) code = String.fromCharCode(0xc0 + i);
      if (!code) {
        notes.push(`troppi blocchi: ${written} ignorato`);
        continue;
      }
      notes.push(`il codice «${written}» diventa «${code}» (un carattere)`);
    }
    if (!aliases.has(written)) aliases.set(written, code);
    const pn: string[] = [];
    const program = mendProgram({ ...(b.program ?? {}), size: [TILE, TILE, LEVEL] }, pn);
    notes.push(...pn.map((n) => `${code}: ${n}`));
    if (!program) {
      notes.push(`${code}: programma incomprensibile, blocco ignorato`);
      continue;
    }
    const s = b.sockets ?? {};
    const sockets = Object.fromEntries(SIDES.map((k) => [k, isSocket(s[k]) ? label(s[k]) : '*'])) as Sockets;
    if (isSocket(s.u)) sockets.u = label(s.u);
    if (isSocket(s.d)) sockets.d = label(s.d);
    const auto = !!orders && SIDES.every((k) => !isSocket(s[k]));
    if (!auto && SIDES.some((k) => !isSocket(s[k]))) notes.push(`${code}: lati senza presa diventano "*" (qualsiasi)`);
    const actions = (Array.isArray(b.actions) ? b.actions : [])
      .filter((a: any) => typeof a?.label === 'string' && typeof a?.to === 'string' && a.to.trim().length >= 1)
      .map((a: any) => ({ label: a.label, to: a.to.trim() }));
    used.add(code);
    const serves = resolveServes(b.serves ?? b.serve ?? b.ordini, orders);
    blocks.push({ code, ...(code !== written ? { alias: written } : {}), name: String(b.name ?? code), ...(b.role ? { role: String(b.role) } : {}), walk: b.walk === true || b.walk === 'true', sockets, ...(actions.length ? { actions } : {}), ...(serves.length ? { serves } : {}), ...(auto ? { auto: true } : {}), ...(Number(b.weight) > 0 && Number(b.weight) !== 1 ? { weight: Math.max(0.01, Math.min(10, Number(b.weight))) } : {}), program });
  }
  for (const b of blocks) for (const a of b.actions ?? []) a.to = aliases.get(a.to) ?? a.to;
  for (const b of blocks) for (const a of b.actions ?? []) if (!used.has(a.to) && !known.has(a.to)) notes.push(`${b.code}: l'azione «${a.label}» porta a un blocco che non c'è (${a.to})`);
  const open = (Array.isArray(r?.open) ? r.open : Array.isArray(r?.aperte) ? r.aperte : []).filter(isSocket).map(label);
  const faces = r?.faces && typeof r.faces === 'object' ? Object.fromEntries(Object.entries(r.faces).map(([k, v]) => [label(k), String(v)])) : undefined;
  return blocks.length ? { name: String(r?.name ?? 'struttura'), ...(faces ? { faces } : {}), ...(open.length ? { open } : {}), blocks } : null;
}

/**
 * Mends a layout. Without a blockset (a plan written before the blocks, ADR-0035) zones need no blocks:
 * the commission asks the sculptor for them.
 */
export function mendLayout(raw: unknown, set: Blockset | undefined, notes: string[] = []): Layout | null {
  const r = raw as any;
  const size = Array.isArray(r?.size) && r.size.length >= 3 ? (r.size.slice(0, 3).map((v: unknown, i: number) => Math.max(1, Math.min(i < 2 ? LAYOUT_LIMITS.side : 8, Math.round(Number(v) || 1)))) as Vec3) : null;
  if (!size) return notes.push('manca "size": [caselle in x, caselle in y, livelli]'), null;
  const codes = new Set((set?.blocks ?? []).map((b) => b.code));
  const palette: Record<string, LayoutEntry> = {};
  for (const [k, v] of Object.entries(r.palette ?? {})) {
    const e = (typeof v === 'string' ? { block: v } : v) as any;
    if (k.length !== 1 || k === AIR || !e || !codes.has(e.block)) {
      notes.push(`codice di palette "${k}" ignorato: blocco sconosciuto (${e?.block ?? '?'})`);
      continue;
    }
    palette[k] = { block: e.block, rot: ((Math.round(Number(e.rot) || 0) % 4) + 4) % 4 };
  }
  const zones: Record<string, Zone> = {};
  for (const [k, v] of Object.entries(r.zones ?? {})) {
    const z = (typeof v === 'string' ? { blocks: v } : v) as any;
    const blocks = typeof z?.blocks === 'string' ? [...z.blocks].filter((c) => c === AIR || codes.has(c)).join('') : '';
    const exact = typeof z?.codes === 'string' ? [...z.codes].filter((c) => palette[c]).join('') : '';
    if (k.length !== 1 || k === AIR || !z || typeof z !== 'object') {
      notes.push(`zona "${k}" ignorata`);
      continue;
    }
    // A zone whose listed blocks are all unknown is served by the blocks made for it (the commission).
    if (set && typeof z.blocks === 'string' && z.blocks && !blocks && !exact) notes.push(`zona "${k}": nessuno dei blocchi elencati esiste, vale ciò che lo Scultore ha fatto per lei`);
    if (palette[k]) notes.push(`"${k}" è sia una zona sia un codice esatto: vale la zona`);
    const describe = z.describe ?? z.descrizione;
    zones[k] = { ...(z.name ? { name: String(z.name) } : {}), ...(typeof describe === 'string' ? { describe } : {}), ...(blocks ? { blocks } : {}), ...(exact ? { codes: exact } : {}) };
  }
  // The old form: cells marked `on` filled from `from` (palette codes).
  if (typeof r.wfc?.on === 'string' && typeof r.wfc?.from === 'string') zones[r.wfc.on[0]] ??= { codes: [...r.wfc.from].filter((c) => palette[c] || c === AIR).join('') };
  // A block code used in the program with no entry is that block in any turn (a zone of one block).
  for (const c of codes) if (!palette[c] && !zones[c]) zones[c] = { blocks: c };
  const program = mendNode(r.program, notes);
  if (!program) return notes.push('nessun nodo valido nel programma'), null;
  const unions = mendUnions(r.unions, notes, { ...palette, ...zones });
  const colours = (raw: unknown, what: string): Record<string, PaletteEntry & { under?: string }> | undefined => {
    if (!raw || typeof raw !== 'object') return undefined;
    const out: Record<string, PaletteEntry & { under?: string }> = {};
    for (const [k, v] of Object.entries(raw as Record<string, any>)) {
      const color = typeof v === 'string' ? v : v?.color;
      if (k.length !== 1 || k === AIR || typeof color !== 'string') {
        notes.push(`${what}: "${k}" ignorato (vuole un codice e un colore)`);
        continue;
      }
      out[k] = { ...(v?.name ? { name: String(v.name) } : {}), color, ...(v?.hidden ? { hidden: true } : {}), ...(typeof v?.under === 'string' && v.under ? { under: v.under } : {}) };
    }
    return Object.keys(out).length ? out : undefined;
  };
  const paint = colours(r.paint, 'paint');
  const materials = colours(r.materials ?? r.materiali, 'materials');
  let open: Record<string, string[]> | undefined;
  for (const [k, v] of Object.entries(r.open ?? {})) {
    const list = (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[s,]+/) : []).filter(isSocket).map(label);
    if (k.length !== 1 || k === AIR || !list.length || zones[k] || palette[k]) {
      notes.push(`open: "${k}" ignorato (vuole un segno del programma e le prese che accetta)`);
      continue;
    }
    (open ??= {})[k] = list;
  }
  let detail: Detail | undefined;
  if (r.detail) {
    const dn: string[] = [];
    const dp = mendNode(r.detail.program ?? r.detail, dn);
    notes.push(...dn.map((n) => `detail: ${n}`));
    const du = mendUnions(r.detail.unions, notes);
    const dc = colours(r.detail.palette, 'detail');
    if (dp) detail = { ...(dc ? { palette: dc } : {}), ...(du ? { unions: du } : {}), program: dp };
  }
  return {
    ...(r.name ? { name: String(r.name) } : {}),
    ...(unions ? { unions } : {}),
    ...(paint ? { paint } : {}),
    ...(open ? { open } : {}),
    ...(materials ? { materials } : {}),
    ...(detail ? { detail } : {}),
    size,
    zones,
    palette,
    ...(typeof r.origin === 'string' && r.origin.length === 1 ? { origin: r.origin } : {}),
    ...(typeof r.ground === 'string' && r.ground.length === 1 ? { ground: r.ground } : {}),
    program,
  };
}

// ------------------------------------------------------------------ geometry

/** Turns a block's voxels a quarter clockwise seen from above, r times: (x, y) → (T-1-y, x). */
export function rotateGrid(g: Grid3, r: number): Grid3 {
  let cur = g;
  for (let k = 0; k < ((r % 4) + 4) % 4; k++) {
    const X = cur.Y, Y = cur.X;
    const cells = new Uint8Array(cur.cells.length);
    for (let z = 0; z < cur.Z; z++)
      for (let y = 0; y < cur.Y; y++)
        for (let x = 0; x < cur.X; x++) cells[cur.Y - 1 - y + x * X + z * X * Y] = cur.cells[x + y * cur.X + z * cur.X * cur.Y];
    cur = { ...cur, X, Y, cells, log: [], epoch: 0 };
  }
  return cur;
}

export function rotateSockets(s: Sockets, r: number): Sockets {
  let cur = s;
  for (let k = 0; k < ((r % 4) + 4) % 4; k++) cur = { ...cur, n: cur.w, e: cur.n, s: cur.e, w: cur.s };
  return cur;
}

/**
 * The face of a side as a mask (TILE wide, LEVEL tall), read clockwise round the block, so that two
 * touching sides line up once one of them is reversed.
 */
export function profile(g: Grid3, visible: boolean[], side: Side): Uint8Array {
  const T = g.X;
  const out = new Uint8Array(T * g.Z);
  for (let z = 0; z < g.Z; z++)
    for (let i = 0; i < T; i++) {
      const [x, y] = side === 'n' ? [i, 0] : side === 'e' ? [T - 1, i] : side === 's' ? [T - 1 - i, T - 1] : [0, T - 1 - i];
      out[i + z * T] = visible[g.cells[x + y * g.X + z * g.X * g.Y]] ? 1 : 0;
    }
  return out;
}

/**
 * How well two touching faces continue each other (one of them reversed): the share of the smaller face
 * that the other covers. A tower bulging onto a side of water still continues the water; a wall at the
 * wrong height does not.
 */
export function faceMatch(a: Uint8Array, b: Uint8Array, T: number): number {
  let inter = 0, na = 0, nb = 0;
  const Z = a.length / T;
  for (let z = 0; z < Z; z++)
    for (let i = 0; i < T; i++) {
      const p = a[i + z * T], q = b[T - 1 - i + z * T];
      if (p && q) inter++;
      if (p) na++;
      if (q) nb++;
    }
  const small = Math.min(na, nb);
  return small ? inter / small : na === nb ? 1 : 0;
}

// ------------------------------------------------------------------ blocks

export interface BuiltBlock {
  block: Block;
  grid: Grid3;
  visible: boolean[];
  voxels: number;
}

export interface BlockReport {
  built: Map<string, BuiltBlock>;
  errors: string[];
  warnings: string[];
}

const visibleOf = (g: Grid3, palette: Record<string, PaletteEntry>) => g.alphabet.map((c) => c !== AIR && !!palette[c]?.color && !palette[c]?.hidden);

export function buildBlocks(set: Blockset, seed = 1): BlockReport {
  const built = new Map<string, BuiltBlock>();
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const b of set.blocks) {
    try {
      const r = run(b.program, seed);
      const visible = visibleOf(r.grid, b.program.palette);
      const voxels = r.grid.cells.reduce((s, c) => s + (visible[c] ? 1 : 0), 0);
      if (!r.finished) errors.push(`${b.code} (${b.name}): il programma non termina`);
      if (!voxels && b.role !== 'vuoto') errors.push(`${b.code} (${b.name}): il blocco è vuoto`);
      built.set(b.code, { block: b, grid: r.grid, visible, voxels });
    } catch (e) {
      errors.push(`${b.code} (${b.name}): ${(e as Error).message}`);
    }
  }
  // Sides with the same label must look the same: compare every pair of faces that claim it.
  const faces = new Map<string, Array<{ code: string; side: Side; mask: Uint8Array }>>();
  for (const { block, grid, visible } of built.values())
    for (const side of SIDES) {
      const label = block.sockets[side];
      const mask = profile(grid, visible, side);
      if (label === 'vuoto') {
        const fill = mask.reduce((s, v) => s + v, 0) / mask.length;
        if (fill > 0.25) warnings.push(`${block.code}: il lato ${side} dice "vuoto" ma è pieno al ${Math.round(fill * 100)}%`);
        continue;
      }
      if (label === '*') continue;
      (faces.get(label) ?? faces.set(label, []).get(label)!).push({ code: block.code, side, mask });
    }
  for (const [label, list] of faces)
    for (let i = 0; i < list.length; i++)
      for (let j = i; j < list.length; j++) {
        const m = faceMatch(list[i].mask, list[j].mask, TILE);
        // Advisory: whether two sides ever touch is up to the layout, which checks the real faces.
        if (m < 0.6) warnings.push(`presa "${label}": il lato ${list[i].side} di ${list[i].code} e il lato ${list[j].side} di ${list[j].code} si continuano solo al ${Math.round(m * 100)}%`);
      }
  return { built, errors, warnings };
}

// ------------------------------------------------------------------ catalogue

export interface Variant {
  id: number;
  /** null for an empty cell (variant 0, the outside, and one per kind of empty cell of the layout). */
  block: Block | null;
  /** For an empty cell of its own kind: the sockets it accepts (the outside accepts the blockset's open ones). */
  accepts?: Set<string>;
  /** For an empty cell: its class in the plan; it also accepts the sockets the plan derived for it ("W~<class>"). */
  cls?: string;
  rot: number;
  sockets: Sockets;
  /** The four side faces (n e s w), as placed. */
  faces: Uint8Array[];
}

export interface Catalogue {
  variants: Variant[];
  K: number;
  W: number;
  /** compat[d][a * W + w] (wfc.ts directions): which variants may be the neighbour of `a` in direction d. */
  compat: Uint32Array[];
  /** "code#rot" → variant (turns that look the same share one); "§" + accepted sockets → a kind of empty cell. */
  byTurn: Map<string, number>;
  open: Set<string>;
}

/** What may face the ground below the first level or the sky above the last, or an empty cell above or below. */
const OPEN_V = new Set([undefined, '*', 'vuoto', 'piano']);
const fits = (a: string | undefined, b: string | undefined) => a === undefined || b === undefined || a === '*' || b === '*' || a === b;
const OPPOSITE: Record<Side, Side> = { n: 's', s: 'n', e: 'w', w: 'e' };
const DIRS: Array<[Side, number, number]> = [['n', 0, -1], ['e', 1, 0], ['s', 0, 1], ['w', -1, 0]];

/** Two faces continue each other: one of them (nearly) empty, or the smaller mostly inside the other. */
function continues(a: Uint8Array, b: Uint8Array): boolean {
  const few = TILE * LEVEL * 0.02;
  let na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    na += a[i];
    nb += b[i];
  }
  if (na <= few || nb <= few) return true;
  return faceMatch(a, b, TILE) >= 0.6;
}

/** The key of a kind of empty cell in Catalogue.byTurn. */
export const kindKey = (accepts: string[]) => `§${[...new Set(accepts.map(label))].sort().join(',')}`;

/**
 * Variants and their compatibility. `kinds` are the kinds of empty cell of a layout (Layout.open): each is
 * an empty variant that accepts only its sockets, so a courtyard never gets the water side of a wall.
 */
export function catalogue(set: Blockset, built: Map<string, BuiltBlock>, kinds: Array<string[] | { accepts: string[]; cls: string }> = []): Catalogue {
  const open = new Set(['vuoto', '*', ...(set.open ?? [])]);
  const empty = SIDES.map(() => new Uint8Array(TILE * LEVEL));
  const blank: Sockets = { n: 'vuoto', e: 'vuoto', s: 'vuoto', w: 'vuoto' };
  const variants: Variant[] = [{ id: 0, block: null, rot: 0, sockets: blank, faces: empty }];
  const byTurn = new Map<string, number>();
  variants[0].cls = 'fuori';
  for (const kind of kinds) {
    const k = Array.isArray(kind) ? kind : kind.accepts;
    const key = kindKey(k);
    if (byTurn.has(key)) continue;
    byTurn.set(key, variants.push({ id: variants.length, block: null, rot: 0, sockets: blank, faces: empty, accepts: new Set(['*', ...k.map(label)]), ...(Array.isArray(kind) ? {} : { cls: kind.cls }) }) - 1);
  }
  for (const b of set.blocks) {
    const bb = built.get(b.base ?? b.code);
    if (!bb) continue;
    const seen = new Map<string, number>();
    for (let rot = 0; rot < 4; rot++) {
      const g = rotateGrid(bb.grid, rot);
      const sockets = rotateSockets(b.sockets, rot);
      const faces = SIDES.map((s) => profile(g, bb.visible, s));
      const key = `${JSON.stringify(sockets)}|${faces.map((f) => f.join('')).join('|')}`;
      let id = seen.get(key);
      if (id === undefined) {
        id = variants.push({ id: variants.length, block: b, rot, sockets, faces }) - 1;
        seen.set(key, id);
      }
      byTurn.set(`${b.code}#${rot}`, id);
    }
  }
  const K = variants.length;
  const W = words(K);
  const allowed = (a: Variant, b: Variant, d: number): boolean => {
    if (d === 5) return allowed(b, a, 4);
    if (d === 4) {
      // b on top of a.
      if (!a.block && !b.block) return true;
      if (!b.block) return OPEN_V.has(a.sockets.u);
      if (!a.block) return OPEN_V.has(b.sockets.d);
      return fits(a.sockets.u, b.sockets.d);
    }
    const side = SIDES[d];
    const opp = OPPOSITE[side];
    if (!a.block && !b.block) return true;
    const takes = (e: Variant, s: string | undefined) => (e.accepts ?? open).has(s!) || (!!e.cls && !!s && s.endsWith(`~${e.cls}`));
    if (!a.block) return takes(a, b.sockets[opp]);
    if (!b.block) return takes(b, a.sockets[side]);
    return fits(a.sockets[side], b.sockets[opp]) && continues(a.faces[d], b.faces[SIDES.indexOf(opp)]);
  };
  const compat = Array.from({ length: 6 }, () => new Uint32Array(K * W));
  for (let d = 0; d < 6; d++)
    for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) if (allowed(variants[a], variants[b], d)) compat[d][a * W + (b >>> 5)] |= 1 << (b & 31);
  return { variants, K, W, compat, byTurn, open };
}

// ------------------------------------------------------------------ layout

export interface LayoutResult {
  layout: Layout;
  placements: Placement[];
  /** The layout program's code in every cell (x + y·X + z·X·Y): zones, exact pieces, marks. */
  cells: string[];
  /** What does not hold: touching sides whose sockets differ, cells the collapse could not fill. */
  mismatches: string[];
  /** Configurations that need a block no one has made (the late order for the block sculptor). */
  missing: Config[];
  /** Sides that are not open but face nothing. */
  open: number;
  /** Touching faces whose voxels do not continue each other. */
  seams: string[];
  steps: number;
  wfc?: Pick<WfcResult, 'ok' | 'repairs' | 'ms'> & { cells: number; variants: number; zoneCells: number };
}

function socketsAt(p: Placement): Sockets {
  return rotateSockets(p.block.sockets, p.rot);
}

/**
 * Runs the architect's program on the grid of blocks, then the collapse on the zones: the result has
 * every touching pair right by construction (or says where it could not be done).
 */
export function runLayout(layout: Layout, set: Blockset, seed = 1, built?: Map<string, BuiltBlock>, budget = 20000): LayoutResult {
  const b = built ?? buildBlocks(set, 1).built;
  // Only the codes the program uses enter the engine's alphabet; zones and exact codes are looked up after.
  const r = planCells(layout, seed);
  const [X, Y, Z] = layout.size;
  const N = X * Y * Z;
  const cells = r.cells;
  // Zones that do not list their blocks take them from the blocks' orders, configuration by configuration.
  // Also zones that list blocks without sockets: those blocks take the sockets of each configuration.
  const autoCodes = new Set(set.blocks.filter((x) => x.auto).map((x) => x.code));
  const byConfig = (z: Zone) => !listsBlocks(z) || [...(z.blocks ?? '')].some((c) => autoCodes.has(c));
  const byOrder = Object.values(layout.zones ?? {}).some(byConfig);
  const orders: Commission | undefined = byOrder ? commissionOf(layout, seed, r) : undefined;
  // Blocks without sockets get those of each configuration they serve: one derived block per block and
  // set of sockets (configurations with the same sides share it).
  const derived = new Map<string, Block>();
  const forConfig = new Map<string, string[]>();
  for (const k of orders?.configs ?? []) {
    const z = layout.zones?.[k.zone];
    if (!z || !byConfig(z)) continue;
    let served = listsBlocks(z) ? set.blocks.filter((x) => z.blocks!.includes(x.code)) : set.blocks.filter((x) => x.serves?.includes(k.sig));
    if (!served.length) served = set.blocks.filter((x) => x.serves?.includes(k.zone));
    forConfig.set(
      k.sig,
      served.map((x) => {
        if (!x.auto) return x.code;
        const key = `${x.code}|${JSON.stringify(k.sockets)}`;
        let d = derived.get(key);
        if (!d) derived.set(key, (d = { ...x, code: `${x.code}·${derived.size}`, base: x.code, sockets: k.sockets, auto: false }));
        return d.code;
      }),
    );
  }
  const composed: Blockset = derived.size ? { ...set, blocks: [...set.blocks.filter((x) => !x.auto), ...derived.values()] } : set;
  const kinds = Object.entries(layout.open ?? {}).map(([m, accepts]) => ({ accepts, cls: classOf(layout, m) }));
  const cat = catalogue(composed, b, kinds);
  const { K, W } = cat;
  const zoneNames = Object.keys(layout.zones ?? {});
  // Group 0 is "fixed"; the others are a zone, or a zone and one of its configurations. Bitsets and weights per group.
  const zoneSets: Uint32Array[] = [new Uint32Array(W)];
  const weights: Float64Array[] = [new Float64Array(K).fill(1)];
  const zoneIndex = new Map<string, number>();
  const addBlock = (set: Uint32Array, w: Float64Array, c: string, k = 1) => {
    const turns = new Set([0, 1, 2, 3].map((rot) => cat.byTurn.get(`${c}#${rot}`)).filter((v): v is number => v !== undefined));
    for (const v of turns) {
      set[v >>> 5] |= 1 << (v & 31);
      w[v] += k / turns.size;
    }
  };
  const zoneSet = (name: string, sig?: string): number => {
    const key = sig ?? name;
    let zi = zoneIndex.get(key);
    if (zi !== undefined) return zi;
    const z = layout.zones![name];
    const bits = new Uint32Array(W);
    const w = new Float64Array(K);
    const add = (v: number, k = 1) => {
      bits[v >>> 5] |= 1 << (v & 31);
      w[v] += k;
    };
    if (listsBlocks(z) && !sig) {
      for (const c of z.blocks ?? '') c === AIR ? add(0) : addBlock(bits, w, c);
      for (const c of z.codes ?? '') {
        if (c === AIR) add(0);
        else {
          const e = layout.palette[c];
          const v = e && cat.byTurn.get(`${e.block}#${e.rot ?? 0}`);
          if (v !== undefined) add(v);
        }
      }
    } else {
      // The blocks made for this configuration; if none, those made for the whole zone.
      if (z.blocks?.includes(AIR)) add(0);
      let chosen = (sig && forConfig.get(sig)) || [];
      if (!chosen.length) chosen = set.blocks.filter((x) => !x.auto && x.serves?.includes(name)).map((x) => x.code);
      for (const c of chosen) addBlock(bits, w, c, composed.blocks.find((x) => x.code === c)?.weight ?? 1);
    }
    zi = zoneSets.push(bits) - 1;
    weights.push(w);
    zoneIndex.set(key, zi);
    return zi;
  };
  const domain = new Uint32Array(N * W);
  const zone = new Uint16Array(N);
  const notes: string[] = [];
  let zoneCells = 0;
  // What each cell may hold, by group (a zone, an exact piece, the empty cell): to check the neighbours.
  const groupOf = new Map<string, number>();
  const groupSets: Uint32Array[] = [];
  const groupNames: string[] = [];
  const cellGroup = new Int32Array(N);
  const group = (key: string, name: string, set: Uint32Array) => {
    let g = groupOf.get(key);
    if (g === undefined) {
      g = groupSets.push(set) - 1;
      groupNames.push(name);
      groupOf.set(key, g);
    }
    return g;
  };
  /** Signatures of the configurations that cause the failure (no block at all, or none that fits). */
  const causes = new Set<string>();
  const orderName = new Map((orders?.configs ?? []).map((k) => [k.sig, k.id]));
  for (let i = 0; i < N; i++) {
    const ch = cells[i];
    if (zoneNames.includes(ch)) {
      const z = layout.zones![ch];
      const sig = byConfig(z) ? orders?.sigs[i] : undefined;
      const zi = zoneSet(ch, sig);
      domain.set(zoneSets[zi], i * W);
      zone[i] = zi;
      zoneCells++;
      const what = `la zona ${ch}${z.name ? ` (${z.name})` : ''}${sig ? `, configurazione ${orderName.get(sig)}` : ''}`;
      if (!zoneSets[zi].some((w) => w) && sig) causes.add(sig);
      if (!zoneSets[zi].some((w) => w)) notes.push(`nessun blocco per ${what}: va commissionato allo Scultore`);
      cellGroup[i] = group(`z${zi}`, what, zoneSets[zi]);
      continue;
    }
    const e = layout.palette[ch];
    const kind = !e && layout.open?.[ch] ? cat.byTurn.get(kindKey(layout.open[ch])) : undefined;
    const v = e ? cat.byTurn.get(`${e.block}#${e.rot ?? 0}`) : (kind ?? 0);
    domain[i * W + ((v ?? 0) >>> 5)] = 1 << ((v ?? 0) & 31);
    const one = new Uint32Array(W);
    one[(v ?? 0) >>> 5] = 1 << ((v ?? 0) & 31);
    cellGroup[i] = group(`v${v ?? 0}`, v && cat.variants[v].block ? `il pezzo esatto ${ch} (${cat.variants[v].block!.name}, rot ${cat.variants[v].rot})` : kind ? `il vuoto «${layout.paint?.[ch]?.name ?? ch}»` : 'il fuori', one);
  }
  const conflicts = zoneConflicts(cellGroup, groupNames, groupSets, layout.size, cat);
  if (conflicts.length) notes.push(...conflicts.slice(0, 10), ...(conflicts.length > 10 ? [`…e altri ${conflicts.length - 10} incontri impossibili tra zone`] : []));
  // Before the collapse, the constraints are propagated to the end (arc consistency): a cell left with no
  // block at all names the configuration that needs a block of its own (or a plan that does not create it).
  // Each neighbour alone may fit while all of them together do not: three walls meeting the moat at a cell.
  {
    const dead = firstDead(domain, layout.size, cat);
    if (dead >= 0) {
      const c = orders ?? commissionOf(layout, seed, r);
      const k = c.sigs[dead] ? c.configs.find((x) => x.sig === c.sigs[dead]) : undefined;
      if (k) causes.add(k.sig);
      const where = `(${dead % X},${Math.floor(dead / X) % Y},${Math.floor(dead / (X * Y))})`;
      notes.push(
        k
          ? `nessun blocco della zona ${k.zone} (${layout.zones?.[k.zone]?.name ?? k.zone}) può stare in ${where}, configurazione ${k.id} (${k.count} volte nella pianta): ${k.text}; serve un blocco commissionato per questa configurazione, o una pianta che non la crei`
          : `in ${where} (${cells[dead]}) non può stare niente con i vicini che ha`,
      );
    }
  }
  const s = solve({ X, Y, Z, K, compat: cat.compat, domain, zone, weights, seed: hash32(seed, 77), budget });
  const at = (c: number) => `(${c % X},${Math.floor(c / X) % Y},${Math.floor(c / (X * Y))})`;
  if (s.impossible.length) notes.push(`${s.impossible.length} celle senza alcun blocco possibile già all'inizio (blocchi fissati che non possono stare lì o accanto ai vicini), per esempio ${s.impossible.slice(0, 5).map(at).join(' ')}`);
  else if (!s.ok) notes.push(`il wfc non è riuscito a riempire tutte le zone (${s.repairs} riparazioni${s.ms >= budget ? ', tempo scaduto' : ''}): ${[...s.assign].filter((v) => v < 0).length} celle restano vuote`);
  if (!s.ok || s.impossible.length) {
    // Where it failed, by configuration: the order a block is missing for (commission.ts).
    const c = orders ?? commissionOf(layout, seed, r);
    const failed = new Map<string, number>();
    for (let i = 0; i < N; i++) if (s.assign[i] < 0 && c.sigs[i]) failed.set(c.sigs[i]!, (failed.get(c.sigs[i]!) ?? 0) + 1);
    const worst = [...failed].sort((p, q) => q[1] - p[1]);
    // The cells left empty are often victims of a contradiction elsewhere: they are the order only when no
    // cause was found before the collapse.
    if (!causes.size) for (const [sig] of worst.slice(0, 3)) causes.add(sig);
    for (const [sig, n] of worst.slice(0, 6)) {
      const k = c.configs.find((x) => x.sig === sig)!;
      notes.push(`la configurazione ${k.id} della zona ${k.zone} (${layout.zones?.[k.zone]?.name ?? k.zone}) resta vuota in ${n} caselle, per esempio in (${k.at.join(',')}): ${k.text}; nessun blocco della zona va bene lì: serve un blocco commissionato per questa configurazione, o una pianta che non la crei`);
    }
  }
  const placements: Placement[] = [];
  for (let i = 0; i < N; i++) {
    const v = cat.variants[s.assign[i]];
    if (!v?.block) continue;
    placements.push({ x: i % X, y: Math.floor(i / X) % Y, z: Math.floor(i / (X * Y)), code: v.block.base ?? v.block.code, block: v.block, rot: v.rot });
  }
  const { mismatches, open } = checkSockets(placements, layout.size, cat.open);
  if (!r.finished) mismatches.unshift(`il programma della pianta non termina dopo ${r.steps} passi`);
  return {
    layout,
    placements,
    cells,
    mismatches: [...notes, ...mismatches],
    missing: (() => {
      if (!causes.size) return [];
      const c = orders ?? commissionOf(layout, seed, r);
      return c.configs.filter((k) => causes.has(k.sig));
    })(),
    open,
    seams: N <= 20000 ? checkSeams(placements, layout.size, b) : [],
    steps: r.steps,
    wfc: { ok: s.ok, repairs: s.repairs, ms: s.ms, cells: N, variants: K, zoneCells },
  };
}

export function checkSockets(placements: Placement[], size: Vec3, open: Set<string> = new Set(['vuoto', '*'])): { mismatches: string[]; open: number } {
  const [X, Y] = size;
  const at = new Map<number, Placement>();
  for (const p of placements) at.set(p.x + p.y * X + p.z * X * Y, p);
  const mismatches: string[] = [];
  let facing = 0;
  for (const p of placements) {
    const s = socketsAt(p);
    for (const [side, dx, dy] of DIRS) {
      const n = p.x + dx >= 0 && p.y + dy >= 0 && p.x + dx < X && p.y + dy < Y ? at.get(p.x + dx + (p.y + dy) * X + p.z * X * Y) : undefined;
      if (!n) {
        if (!open.has(s[side])) facing++;
        continue;
      }
      if (side === 'w' || side === 'n') continue; // each pair once
      const t = socketsAt(n);
      if (!fits(s[side], t[OPPOSITE[side]])) mismatches.push(`(${p.x},${p.y},${p.z}) ${p.block.name} lato ${side} "${s[side]}" contro (${n.x},${n.y},${n.z}) ${n.block.name} lato ${OPPOSITE[side]} "${t[OPPOSITE[side]]}"`);
    }
    const up = at.get(p.x + p.y * X + (p.z + 1) * X * Y);
    const down = p.z > 0 ? at.get(p.x + p.y * X + (p.z - 1) * X * Y) : undefined;
    if (!up && !OPEN_V.has(s.u)) mismatches.push(`(${p.x},${p.y},${p.z}) ${p.block.name}: sopra vuole "${s.u}" ma non c'è niente`);
    if (!down && p.z > 0 && !OPEN_V.has(s.d)) mismatches.push(`(${p.x},${p.y},${p.z}) ${p.block.name}: sotto vuole "${s.d}" ma non c'è niente`);
    if (p.z === 0 && !OPEN_V.has(s.d)) mismatches.push(`(${p.x},${p.y},0) ${p.block.name}: sotto vuole "${s.d}" ma è il primo livello`);
    if (up && !fits(s.u, socketsAt(up).d)) mismatches.push(`(${p.x},${p.y},${p.z}) ${p.block.name} sopra "${s.u}" contro ${up.block.name} sotto "${socketsAt(up).d}"`);
  }
  return { mismatches, open: facing };
}

/** Compares the voxels of every pair of touching faces, as placed (turned). */
export function checkSeams(placements: Placement[], size: Vec3, built: Map<string, BuiltBlock>): string[] {
  const [X, Y] = size;
  const at = new Map<number, Placement>();
  for (const p of placements) at.set(p.x + p.y * X + p.z * X * Y, p);
  const faces = new Map<string, Uint8Array>();
  const face = (p: Placement, side: Side) => {
    const key = `${p.block.code}#${p.rot}#${side}`;
    let f = faces.get(key);
    if (!f) {
      const b = built.get(p.block.base ?? p.block.code);
      f = b ? profile(rotateGrid(b.grid, p.rot), b.visible, side) : new Uint8Array(TILE * LEVEL);
      faces.set(key, f);
    }
    return f;
  };
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of placements)
    for (const [side, dx, dy] of DIRS) {
      if (side === 'w' || side === 'n') continue;
      const n = at.get(p.x + dx + (p.y + dy) * X + p.z * X * Y);
      if (!n || p.x + dx >= X || p.y + dy >= Y) continue;
      if (continues(face(p, side), face(n, OPPOSITE[side]))) continue;
      const kind = `${p.block.name}/${p.rot} ${side} → ${n.block.name}/${n.rot}`;
      if (!seen.has(kind)) {
        seen.add(kind);
        out.push(`(${p.x},${p.y},${p.z}) ${p.block.name} lato ${side} e ${n.block.name}: i voxel non si continuano (${Math.round(faceMatch(face(p, side), face(n, OPPOSITE[side]), TILE) * 100)}%)`);
      }
    }
  return out;
}

// ------------------------------------------------------------------ closure and zone checks

/**
 * Blocks that cannot be part of any finished structure: for each block the kernel tries a small collapse
 * (7 × 7 × 3, the block in the middle of the middle level, anything or nothing around, nothing outside). A keep whose four
 * sides all want another keep, a house with three sides that only another house closes, never close.
 * Without `built` only the sockets are compared (the catalogue, before the programs).
 */
export function unclosable(set: Blockset, built?: Map<string, BuiltBlock>): Array<{ code: string; name: string }> {
  const b = built ?? new Map(set.blocks.map((x) => [x.code, { block: x, grid: { X: TILE, Y: TILE, Z: LEVEL, cells: new Uint8Array(TILE * TILE * LEVEL), alphabet: [AIR], log: [], epoch: 0 }, visible: [false], voxels: 0 } as BuiltBlock]));
  const cat = catalogue(set, b);
  const { K, W } = cat;
  const X = 7, Y = 7, Z = 3, N = X * Y * Z;
  const out: Array<{ code: string; name: string }> = [];
  for (const blk of set.blocks) {
    const v = cat.byTurn.get(`${blk.code}#0`);
    if (v === undefined) continue;
    const domain = new Uint32Array(N * W);
    for (let c = 0; c < N; c++) for (let w = 0; w < W; w++) domain[c * W + w] = w === W - 1 && K % 32 ? (1 << K % 32) - 1 : 0xffffffff;
    // In the middle level: a tower top needs its tower below, a staircase its landing above.
    const centre = 3 + 3 * X + X * Y;
    domain.fill(0, centre * W, centre * W + W);
    domain[centre * W + (v >>> 5)] = 1 << (v & 31);
    const r = solve({ X, Y, Z, K, compat: cat.compat, domain, zone: new Uint16Array(N), weights: [new Float64Array(K).fill(1)], seed: 7, budget: 400 });
    if (!r.ok) out.push({ code: blk.code, name: blk.name });
  }
  return out;
}

/**
 * Arc consistency over the initial domains (outside the grid is the empty variant): the first cell left
 * with no variant, or -1. The collapse would fail somewhere later, often far from the cause; this points
 * at the cause.
 */
function firstDead(start: Uint32Array, size: Vec3, cat: Catalogue): number {
  const [X, Y, Z] = size;
  const { W, K, compat } = cat;
  const N = X * Y * Z;
  const dom = new Uint32Array(start);
  const near = (c: number, d: number) => {
    const x = (c % X) + DIR6[d][0], y = (Math.floor(c / X) % Y) + DIR6[d][1], z = Math.floor(c / (X * Y)) + DIR6[d][2];
    return x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? -1 : x + y * X + z * X * Y;
  };
  const empty = (c: number) => dom.subarray(c * W, c * W + W).every((w) => !w);
  for (let c = 0; c < N; c++)
    for (let d = 0; d < 4; d++)
      if (near(c, d) < 0) for (let v = 0; v < K; v++) if (dom[c * W + (v >>> 5)] & (1 << (v & 31)) && !(compat[d][v * W] & 1)) dom[c * W + (v >>> 5)] &= ~(1 << (v & 31));
  for (let c = 0; c < N; c++) if (empty(c)) return c;
  const queue = Array.from({ length: N }, (_, i) => i);
  const queued = new Uint8Array(N).fill(1);
  const allowed = new Uint32Array(W);
  while (queue.length) {
    const c = queue.pop()!;
    queued[c] = 0;
    for (let d = 0; d < 6; d++) {
      const n = near(c, d);
      if (n < 0) continue;
      allowed.fill(0);
      for (let v = 0; v < K; v++) if (dom[c * W + (v >>> 5)] & (1 << (v & 31))) for (let w = 0; w < W; w++) allowed[w] |= compat[d][v * W + w];
      let changed = false;
      for (let w = 0; w < W; w++) {
        const keep = (dom[n * W + w] & allowed[w]) >>> 0;
        if (keep !== dom[n * W + w]) {
          dom[n * W + w] = keep;
          changed = true;
        }
      }
      if (!changed) continue;
      if (empty(n)) return n;
      if (!queued[n]) {
        queued[n] = 1;
        queue.push(n);
      }
    }
  }
  return -1;
}

/** Pairs of zones (or exact pieces) that touch in the layout but have no variants that can touch. */
function zoneConflicts(cellZone: Int32Array, names: string[], sets: Uint32Array[], size: Vec3, cat: Catalogue): string[] {
  const [X, Y, Z] = size;
  const { W, K } = cat;
  const seen = new Set<string>();
  const out: string[] = [];
  const DIRV: Array<[number, number, number, string]> = [[1, 0, 0, 'est'], [0, 1, 0, 'sud'], [0, 0, 1, 'sopra']];
  const DIDX = [1, 2, 4];
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const a = cellZone[x + y * X + z * X * Y];
        DIRV.forEach(([dx, dy, dz, word], k) => {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (nx >= X || ny >= Y || nz >= Z) return;
          const b = cellZone[nx + ny * X + nz * X * Y];
          const key = `${a}>${b}>${k}`;
          if (seen.has(key)) return;
          seen.add(key);
          const d = DIDX[k];
          let ok = false;
          for (let v = 0; v < K && !ok; v++) {
            if (!(sets[a][v >>> 5] & (1 << (v & 31)))) continue;
            for (let w = 0; w < W && !ok; w++) if (cat.compat[d][v * W + w] & sets[b][w]) ok = true;
          }
          if (!ok) out.push(`${names[a]} non può avere ${names[b]} a ${word} (per esempio in (${x},${y},${z})): nessuna coppia dei loro blocchi combacia`);
        });
      }
  return out;
}

// ------------------------------------------------------------------ voxels and tiles

export interface Expanded {
  grid: Grid3;
  palette: Record<string, PaletteEntry>;
}

export interface ExpandOptions {
  seed?: number;
  /** Seed variants per block, so that walls are not all alike. */
  variants?: number;
  /** Levels shown (to look inside); all by default. */
  cut?: number;
  /** The layout's codes per cell and the marks to paint on the ground (LayoutResult.cells, Layout.paint). */
  cells?: string[];
  paint?: Record<string, PaletteEntry>;
}

/** Codes for materials whose letter is already taken by another colour. */
const SPARE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * The whole structure in voxels. Each placement runs its block with a seed of its own (`variants`
 * seeds per block, so walls are not all alike); levels above `cut` are left out (to look inside).
 * Materials keep the letter the blocks give them (R stone in every block stays R), so that detail rules
 * can name them; a letter with two colours gets a spare code for the second.
 */
export function expand(placements: Placement[], size: Vec3, opts: ExpandOptions = {}): Expanded {
  const [BX, BY, BZ] = size;
  const levels = Math.min(BZ, opts.cut ?? BZ);
  const X = BX * TILE, Y = BY * TILE, Z = Math.max(1, levels) * LEVEL;
  const cells = new Uint8Array(X * Y * Z);
  const alphabet: string[] = [AIR];
  const palette: Record<string, PaletteEntry> = {};
  const byKey = new Map<string, number>();
  const codeOf = (letter: string, e: PaletteEntry): number => {
    const key = `${letter}|${e.color!.toLowerCase()}`;
    let i = byKey.get(key);
    if (i !== undefined) return i;
    if (alphabet.length >= 255) return 0;
    const code = !palette[letter] && letter !== AIR ? letter : ([...SPARE].find((c) => !palette[c]) ?? String.fromCharCode(0x100 + alphabet.length));
    i = alphabet.push(code) - 1;
    palette[code] = { ...(e.name ? { name: e.name } : {}), color: e.color };
    byKey.set(key, i);
    return i;
  };
  // Painted marks first: they claim their letters (a road "S" is the road even if a block has an "S").
  if (opts.cells && opts.paint) {
    const marks = new Map(Object.entries(opts.paint).filter(([, e]) => e.color && !e.hidden).map(([k, e]) => [k, codeOf(k, e)]));
    // Zones with the same ground underneath (a well or a tree in the courtyard).
    for (const [k, e] of Object.entries(opts.paint as Record<string, PaletteEntry & { under?: string }>)) for (const z of e.under ?? '') if (!marks.has(z) && marks.has(k)) marks.set(z, marks.get(k)!);
    for (let z = 0; z < levels; z++)
      for (let y = 0; y < BY; y++)
        for (let x = 0; x < BX; x++) {
          const v = marks.get(opts.cells[x + y * BX + z * BX * BY]);
          if (!v) continue;
          for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) cells[x * TILE + i + (y * TILE + j) * X + z * LEVEL * X * Y] = v;
        }
  }
  const cache = new Map<string, { grid: Grid3; map: number[] }>();
  const variants = Math.max(1, opts.variants ?? 3);
  for (const p of placements) {
    if (p.z >= levels) continue;
    const v = hash32(p.x, p.y, p.z, opts.seed ?? 1) % variants;
    const key = `${p.block.code}#${p.rot}#${v}`;
    let c = cache.get(key);
    if (!c) {
      let r;
      try {
        r = run(p.block.program, (opts.seed ?? 1) + v * 101);
      } catch (e) {
        if (e instanceof Mj3Error) continue;
        throw e;
      }
      const grid = rotateGrid(r.grid, p.rot);
      const map = grid.alphabet.map((ch) => {
        const e = p.block.program.palette[ch];
        return ch === AIR || !e?.color || e.hidden ? 0 : codeOf(ch, e);
      });
      c = { grid, map };
      cache.set(key, c);
    }
    const { grid, map } = c;
    for (let z = 0; z < LEVEL; z++)
      for (let y = 0; y < TILE; y++)
        for (let x = 0; x < TILE; x++) {
          const v2 = map[grid.cells[x + y * TILE + z * TILE * TILE]];
          if (v2) cells[p.x * TILE + x + (p.y * TILE + y) * X + (p.z * LEVEL + z) * X * Y] = v2;
        }
  }
  return { grid: { X, Y, Z, cells, alphabet, log: [], epoch: 0 }, palette };
}

/** Voxels a structure may have for the detail pass to run on it (beyond, it is photographed block by block). */
export const DETAIL_CELLS = 24_000_000;

export interface Finished extends Expanded {
  /** Steps and time of the detail program, or why it did not run. */
  detail?: { steps: number; ms: number; finished: boolean; error?: undefined } | { error: string };
}

/**
 * The structure as the game would show it: blocks composed, marks painted, then the layout's detail
 * program over the whole (see the header).
 */
export function finish(r: Pick<LayoutResult, 'placements' | 'cells' | 'layout'>, opts: Omit<ExpandOptions, 'cells' | 'paint'> = {}): Finished {
  const { layout } = r;
  const [BX, BY, BZ] = layout.size;
  const levels = Math.min(BZ, opts.cut ?? BZ);
  const e = expand(r.placements, layout.size, { ...opts, cells: r.cells, paint: layout.paint });
  if (!layout.detail) return e;
  if (BX * BY * levels * TILE * TILE * LEVEL > DETAIL_CELLS) return { ...e, detail: { error: `struttura troppo grande per il dettaglio (oltre ${DETAIL_CELLS / 1e6} milioni di voxel)` } };
  const palette = { ...e.palette, ...(layout.detail.palette ?? {}) };
  try {
    const d = runOn(e.grid, { palette, unions: layout.detail.unions, program: layout.detail.program }, (opts.seed ?? 1) * 7919 + 13, 200000);
    return { grid: d.grid, palette, detail: { steps: d.steps, ms: d.ms, finished: d.finished } };
  } catch (err) {
    if (!(err instanceof Mj3Error)) throw err;
    return { ...e, detail: { error: err.message } };
  }
}

export interface TileCell {
  x: number;
  y: number;
  z: number;
  code: string;
  name: string;
  walk: boolean;
  actions: BlockAction[];
}

/** What the game would see: per tile and level, the block, walkable or not, and what one can do there. */
export function tileMap(placements: Placement[]): TileCell[] {
  return placements.map((p) => ({ x: p.x, y: p.y, z: p.z, code: p.block.code, name: p.block.name, walk: p.block.walk, actions: p.block.actions ?? [] }));
}

/** Does an action of a placed block: it becomes the other block, same place, same turn. */
export function act(set: Blockset, placements: Placement[], at: { x: number; y: number; z: number }, action: BlockAction): Placement[] {
  const to = set.blocks.find((b) => b.code === action.to);
  if (!to) return placements;
  return placements.map((p) => (p.x === at.x && p.y === at.y && p.z === at.z ? { ...p, block: to, code: to.code } : p));
}
