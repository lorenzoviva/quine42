// The corona as the studio of a game company: a campus on the ring around the simulation, one
// building per folder of the universe (and a gallery; the terrains and the atlas in the Office of places), with a door on the walkway.
// Inside, buildings are bigger than outside (ADR-0022): rooms on several floors joined by stairs,
// shelves with every file (book = manifest, crystal = Lua, scroll = text, tablet = data), framed
// sprites and painted terrains, the history screen the Council's teams stand at, a notice board with the latest
// changes. Interiors live in their own region of real space, far from the ring; doors teleport.
// Deterministic: same files → same studio.

import { footBlocks, toLocal, type Form } from './forms';
import type { FileMap, Rule } from './types';
import { SCREEN_NAME, type ScreenField } from './screens';
import { AGENTS } from './agents/council';

export type FileLook = 'libro' | 'cristallo' | 'pergamena' | 'tavoletta';
export type ItemKind = 'file' | 'sprite' | 'tile' | 'layout' | 'screen' | 'up' | 'down' | 'exit' | 'desk' | 'portal' | 'table' | 'atlas' | 'showcase' | 'prev' | 'next' | 'less' | 'more' | 'grafo' | 'situazione' | 'parete' | 'console' | 'stazione' | 'banco' | 'leggio' | 'lastra' | 'tornio';
/** What a showcase shows (T21): the runes and spells, the people, the things, the objects of the packs, the places planned (T26). */
export type ShowcaseSource = 'rune' | 'persone' | 'cose' | 'oggetti' | 'luoghi';
/** How a showcase looks: a screen, a silo of liquid, a 3D printer, a holographic table with a place in miniature. */
export type ShowcaseDevice = 'schermo' | 'silos' | 'stampante' | 'plastico';

/**
 * The showcases of the interiors (T21): a device with «<» «>» at its sides that picks what it shows; E or a
 * click on it opens a panel with what it is. One per building, on the ground floor.
 */
export const SHOWCASES: Record<string, { source: ShowcaseSource; device: ShowcaseDevice; label: string }> = {
  magia: { source: 'rune', device: 'schermo', label: 'lo schermo delle rune' },
  persone: { source: 'persone', device: 'silos', label: 'il silos dei personaggi' },
  cose: { source: 'cose', device: 'stampante', label: 'la stampante delle cose' },
  oggetti: { source: 'oggetti', device: 'stampante', label: 'la stampante degli oggetti' },
  luoghi: { source: 'luoghi', device: 'plastico', label: 'il plastico dei luoghi' },
};
/**
 * Where a showcase stands in its room (left cell, row of its arrows) and how wide it is; the arrows are at its sides.
 * The printer (T24) is square: `PRINTER` rows deep, centred on the arrows' row, the thing on its middle cell; the model of
 * places (T26) is as big, the place on all of it, with the pads «−» «+» of its phases on the floor in front (under its
 * outer columns: one walks on them, and the front of the table stays free).
 * Every device stands in the middle of its room, its block (arrows and pads included) centred on the exit's column, with
 * `DEVICE_MARGIN` free cells on every side (T49b): the ground floor's shelves are at the sides (`DEVICE_SLOTS`).
 */
export const SHOWCASE_AT = { x: 11, y: 6, w: 3 };
export const PRINTER = 3;
/**
 * The Nucleus's graph of the world (T28): a pedestal with the graph turning above it, where the other buildings have
 * their showcase; E or a click opens it, navigable (src/ui/graph.ts).
 */
export const GRAPH_AT = { x: 11, y: 5, w: 3, h: 3 };
/**
 * The Direction's situation table (T46a): 5 × 3 cells in the middle of its war room, where the others have their showcase;
 * the operations under way on the world seen from above (`Kernel.situation`), E or a click opens them in a panel.
 */
export const SITUATION_AT = { x: 10, y: 6, w: 5, h: 3 };
/** The free cells around a room's device, on every side (T49b). */
export const DEVICE_MARGIN = 3;
/**
 * The Direction's wall of screens (T46b): against the back wall, the one in front of whoever comes in, as wide as the room,
 * in three fields (`ScreenField`, src/kernel/screens.ts); «<» «>» stand under the ends of the timeline.
 */
export const WALL_AT: Array<{ field: ScreenField; x: number; w: number }> = [
  { field: 'tempo', x: 2, w: 7 },
  { field: 'registro', x: 9, w: 6 },
  { field: 'costi', x: 15, w: 7 },
];
export const WALL_Y = 1;
/**
 * The Direction's consoles (T46c): a row of desks in front of the wall of screens, one per agent of the Council, from under
 * the live log on (the row in front of the film stays free between its arrows); who works sits at theirs (`Archive.consoles`).
 */
export const CONSOLES_AT = { x: 9, y: WALL_Y + 1 };
/**
 * The chain of the Systems Room (T27a, src/kernel/chain.ts): against its back wall, a station per system in the order of
 * the tick, side by side on a belt of light, centred on the exit's column; as wide as they fit (`CHAIN.w` at most), the
 * first `CHAIN.x1 - CHAIN.x0 + 1` of them (the panel lists them all).
 */
export const CHAIN = { x0: 2, x1: 21, w: 3, room: 'sistemi' };
/**
 * The bench of the Systems Room (T27b, src/kernel/bench.ts): a glass case of 3 × 3 cells where the others have their
 * showcase, a case of a system running in it with the real code, a screen with the lines that matter above it; «<» «>» at
 * its sides pick the case (all the cases of all the systems, in the order of the tick).
 */
export const BENCH_AT = { x: SHOWCASE_AT.x, y: SHOWCASE_AT.y - 1, w: 3, h: 3, room: CHAIN.room };
/**
 * The Library of the World (T47a): the lectern on a dark water basin, where the other buildings have their showcase;
 * an open holographic book above it, «<» «>» at its sides to flip through the world's bible (src/kernel/bible.ts).
 */
export const LEGGIO_AT = { x: SHOWCASE_AT.x, y: SHOWCASE_AT.y - 1, w: 3, h: 3, room: 'mondo' };
/**
 * The Artist's Gallery (T48a): the Sculptor's lathe, a rotating turntable pedestal where the others have their showcase;
 * the model chosen from the library executed step by step, «<» «>» at its sides to step through the models.
 */
export const TORNIO_AT = { x: SHOWCASE_AT.x, y: SHOWCASE_AT.y - 1, w: 3, h: 3, room: 'galleria' };
/**
 * The Library of the World (T47b): tablets of the rules (world/rules.json) along its back wall;
 * the newest 12 rules (FOCUSED_RULES) shine, clicking one opens its judgement in a panel.
 * When rules exceed what the wall holds (TABLETS_MAX), «<» «>» at the sides step through them.
 */
export const TABLETS_WALL = { x0: 3, x1: 20, y: 1 };
export const TABLETS_MAX = 16;
export const FOCUSED_RULES = 12;

export function chainSlots(n: number): Array<{ x: number; w: number }> {
  const span = CHAIN.x1 - CHAIN.x0 + 1;
  const shown = Math.min(n, span);
  const w = Math.max(1, Math.min(CHAIN.w, Math.floor(span / Math.max(1, shown))));
  // On the exit's cell when the chain is odd (like the showcases), across the middle of the room when it is even.
  const x = Math.max(CHAIN.x0, Math.floor(ROOM_W / 2 + 0.5 - (shown * w) / 2));
  return Array.from({ length: shown }, (_, i) => ({ x: x + i * w, w }));
}
/**
 * The Office of places is also the Cartographer's studio (T26c, ADR-0051): the atlas on a table against its back wall,
 * the terrains in the sample room, which starts on its own floor after the files; after them, from a shelf of their own, a
 * sample for each environment (T26d): its program run on a trial draft, in miniature (`Kernel.layoutSample`).
 */
export const ATLAS_AT = { x: 10, y: 1, w: 4 };
export const SAMPLES = 'luoghi';

/**
 * Builds the tablet items for the rules wall (T47b).
 * When rules fit (<= TABLETS_MAX), all are placed (centered along the wall) without arrows.
 * When exceeding the wall's capacity, TABLETS_MAX tablets are shown with «<» «>» arrows at the sides.
 * The newest 12 rules across all established rules are marked (shine).
 */
export function ruleTablets(ox: number, oy: number, allRules: Rule[], offset = 0): StudioItem[] {
  const count = allRules.length;
  if (!count) return [];
  const items: StudioItem[] = [];
  const max = TABLETS_MAX;

  if (count <= max) {
    const startX = Math.floor((ROOM_W - count) / 2);
    for (let i = 0; i < count; i++) {
      const r = allRules[i];
      const marked = i >= count - FOCUSED_RULES;
      items.push({
        kind: 'lastra',
        label: `la tavola della regola: «${r.testo}»`,
        target: r.chiave,
        rule: r,
        marked,
        color: marked ? '#ffcf5c' : '#7dd87d',
        x: ox + startX + i,
        y: oy + TABLETS_WALL.y,
      });
    }
  } else {
    const safeOffset = Math.max(0, Math.min(count - max, offset));
    const visible = allRules.slice(safeOffset, safeOffset + max);

    items.push({
      kind: 'prev',
      label: '«<» le regole precedenti',
      target: 'regole',
      x: ox + TABLETS_WALL.x0 - 1,
      y: oy + TABLETS_WALL.y,
    });

    for (let i = 0; i < visible.length; i++) {
      const r = visible[i];
      const globalIndex = safeOffset + i;
      const marked = globalIndex >= count - FOCUSED_RULES;
      items.push({
        kind: 'lastra',
        label: `la tavola della regola: «${r.testo}»`,
        target: r.chiave,
        rule: r,
        marked,
        color: marked ? '#ffcf5c' : '#7dd87d',
        x: ox + TABLETS_WALL.x0 + i,
        y: oy + TABLETS_WALL.y,
      });
    }

    items.push({
      kind: 'next',
      label: '«>» le regole successive',
      target: 'regole',
      x: ox + TABLETS_WALL.x0 + max,
      y: oy + TABLETS_WALL.y,
    });
  }

  return items;
}

/** «del Narratore», «dello Scultore», «dell'Artista». */
export const ofThe = (name: string) => (/^[aeiou]/i.test(name) ? `dell'${name}` : /^(s[^aeiou]|z|gn|ps|x)/i.test(name) ? `dello ${name}` : `del ${name}`);

/** The cell of a (wide or deep) studio item nearest to a point: distances are measured from it. */
export function cellNear(it: StudioItem, x: number, y: number): { x: number; y: number } {
  return { x: Math.max(it.x, Math.min(it.x + (it.w ?? 1) - 1, Math.floor(x))), y: Math.max(it.y, Math.min(it.y + (it.h ?? 1) - 1, Math.floor(y))) };
}

/** The Council at its round table: who sits where, and the room behind each seat's teleport. */
export const SEATS: Array<{ agent: string; room: string }> = [
  { agent: 'narratore', room: 'persone' },
  { agent: 'cartografo', room: 'luoghi' },
  { agent: 'artista', room: 'galleria' },
  { agent: 'scultore', room: 'galleria' },
  { agent: 'fisico', room: 'oggetti' },
  { agent: 'ingegnere', room: 'sistemi' },
  { agent: 'arbitro', room: 'universo' },
  { agent: 'referente', room: '' },
];
const TABLE = { cx: 12, cy: 8.5, rx: 3.4, ry: 2.3 };

export interface StudioItem {
  kind: ItemKind;
  x: number;
  y: number;
  label: string;
  path?: string;
  look?: FileLook;
  lines?: number;
  /** Colour of a terrain or a thing on display. */
  /** A thing on display: its model (and tint). */
  model?: string;
  tint?: string;
  color?: string;
  /** What to re-sculpt when asked (module id, item id, tile code); for seats the agent, for portals the room. */
  target?: string;
  /** Width in cells (screens are wide). */
  w?: number;
  /** Depth in cells (the printer is square), from `y` down. */
  h?: number;
  /** A showcase: what it shows and how it looks; its arrows point to it with `target` (the building). */
  source?: ShowcaseSource;
  device?: ShowcaseDevice;
  /** Whether the tablet shines / is marked as one of the recent rules (T47b). */
  marked?: boolean;
  /** For a rule tablet (T47b): the rule itself. */
  rule?: Rule;
}

export interface Floor {
  index: number;
  /** Top-left of the room in real space. */
  ox: number;
  oy: number;
  items: StudioItem[];
}

export interface Building {
  index: number;
  id: string;
  name: string;
  color: string;
  /** Council agent whose team works here. */
  team: string;
  /** Angles (radians, clockwise from the top) of its sector of the ring. */
  from: number;
  to: number;
  /** Exterior: the door (real-space cell) and the cells of its walls/roof. */
  door: { x: number; y: number };
  cells: Set<string>;
  floors: Floor[];
  /**
   * The building as a model (T20, ADR-0049): `models/corona-<id>.xml`, its middle (real space) and how it is
   * turned (its front towards the avenue). Without one, `cells` is a plain block.
   */
  structure?: CampusStructure;
}

export interface CampusStructure {
  model: string;
  x: number;
  y: number;
  yaw: number;
  form: Form;
  /** Plinto location and bounds for sculpture display (T48b, e.g. Galleria). */
  plinto?: {
    x: number;
    y: number;
    z: number;
    width: number;
    depth: number;
  };
}

/** Urban furniture, trees and logistics props in the campus (T50b, T50e). */
export interface CampusProp {
  id: string;
  kind: 'lampione' | 'albero' | 'panchina' | 'totem';
  model: string;
  x: number;
  y: number;
  yaw: number;
  seed: number;
  solid: boolean;
}

/** The model of a building of the campus, if the library has one. */
export const campusModel = (id: string) => `corona-${id}`;

export interface CoronaCell {
  kind: 'floor' | 'building' | 'door' | 'room' | 'wall' | 'item';
  /** Outside, what kind of ground a floor cell is: the avenue, an alley between sectors, a lawn, the edge. */
  ground?: 'viale' | 'vicolo' | 'prato' | 'bordo';
  building?: string;
  item?: StudioItem;
  /** Compatibility with the hover/editor: the file under the cell. */
  path?: string;
  look?: FileLook;
  lines?: number;
  line?: number;
  folder?: string;
}

/** Something to show in the gallery or the map room. */
export interface Exhibit {
  label: string;
  color?: string;
  path: string;
  target: string;
  /** The model on show, and the colour it is tinted with. */
  model?: string;
  tint?: string;
}

/**
 * The campus on the ring, in cells from the circle's edge (T18: four times the 2D one, the circle stays):
 * the avenue along the circle with its neon line, the doors, the buildings (deep and wide enough for a
 * model), lawns behind them, alleys between the sectors, a glowing edge.
 */
export const CAMPUS = { ring: 36, avenue: 6, line: 3, door: 6.5, front: 7, back: 23, span: 0.36, alley: 1.2 };

export const ROOM_W = 24;
export const ROOM_H = 15;
/** Interiors start here (real space); each building has its column, each floor its row. */
export const INTERIOR_X = 30000;
const BUILDING_STRIDE = 80;
const FLOOR_STRIDE = 40;
const SHELF_ROWS = [3, 6, 9];
const SHELF_X0 = 3;
const SHELF_X1 = ROOM_W - 4;
const SHELF_W = SHELF_X1 - SHELF_X0 + 1;
/** The ground floor of a room with a device: short shelves left and right of it (T49b), mirrored about the exit's column. */
const SIDE_W = 4;

const ROOMS: Record<string, { name: string; color: string; team: string }> = {
  universo: { name: 'Direzione', color: '#ffcf5c', team: 'arbitro' },
  mondo: { name: 'Biblioteca del Mondo', color: '#7dd87d', team: 'narratore' },
  concilio: { name: 'Sala del Concilio', color: '#ff8ad8', team: 'arbitro' },
  nucleo: { name: 'Il Nucleo', color: '#6fc3ff', team: 'ingegnere' },
  sistemi: { name: 'Sala Sistemi', color: '#b9a6ff', team: 'ingegnere' },
  luoghi: { name: 'Ufficio dei Luoghi', color: '#9ad27a', team: 'cartografo' },
  oggetti: { name: 'Magazzino degli Oggetti', color: '#e0b070', team: 'fisico' },
  cose: { name: 'Laboratorio delle Cose', color: '#d89a6a', team: 'fisico' },
  persone: { name: 'Studio dei Personaggi', color: '#ffb38a', team: 'narratore' },
  magia: { name: 'Torre della Magia', color: '#c48aff', team: 'narratore' },
  altro: { name: 'Archivio', color: '#9fb2a8', team: 'ingegnere' },
  galleria: { name: "Galleria dell'Artista", color: '#ff8ad8', team: 'artista' },
};

/** Which building a file lives in. */
export function folderOf(path: string): string {
  const m = /^modules\/([a-z]+)\./.exec(path);
  if (m) {
    const p = m[1];
    if (p === 'core') return 'nucleo';
    // The forged mechanics are systems too (T27d): the Archive keeps only unknown prefixes.
    if (p === 'sys' || p === 'mech') return 'sistemi';
    if (p === 'world') return 'luoghi';
    if (p === 'items' || p === 'item') return 'oggetti';
    if (p === 'obj' || p === 'object') return 'cose';
    if (p === 'npc') return 'persone';
    if (p === 'runes' || p === 'magic') return 'magia';
    return 'altro';
  }
  if (path.startsWith('prompts/')) return 'concilio';
  // The programs of the models: in the Artist's gallery, with the models on show.
  if (path.startsWith('models/')) return 'galleria';
  if (path.startsWith('world/')) return 'mondo';
  return 'universo';
}

export function lookOf(path: string): FileLook {
  if (path.endsWith('.lua')) return 'cristallo';
  if (path.endsWith('manifest.json')) return 'libro';
  if (path.endsWith('.md')) return 'pergamena';
  return 'tavoletta';
}

const ORDER = Object.keys(ROOMS);

/** Real-space cell at radius r and angle t (clockwise from the top). */
export function polarCell(r: number, t: number): { x: number; y: number } {
  return { x: Math.floor(Math.sin(t) * r), y: Math.floor(-Math.cos(t) * r) };
}

function angleOf(x: number, y: number): number {
  let t = Math.atan2(y + 0.5, x + 0.5) + Math.PI / 2;
  if (t < 0) t += Math.PI * 2;
  return t;
}

/** The ground of an outside cell at distance d from the centre and angle t, with n sectors around a circle of radius R. */
function groundAt(d: number, R: number, t: number, n: number): CoronaCell['ground'] {
  if (d - R < CAMPUS.avenue) return 'viale';
  if (d - R >= CAMPUS.ring - 1) return 'bordo';
  const sector = (Math.PI * 2) / Math.max(1, n);
  const off = ((t % sector) + sector) % sector;
  return Math.min(off, sector - off) * d < CAMPUS.alley ? 'vicolo' : 'prato';
}

/** Shelf positions of a floor, in reading order. */
function shelfSlots(sides = false): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  const xs = sides ? Array.from({ length: SIDE_W * 2 }, (_, i) => (i < SIDE_W ? SHELF_X0 + i : ROOM_W - SHELF_X0 - (SIDE_W * 2 - 1 - i))) : Array.from({ length: SHELF_W }, (_, i) => SHELF_X0 + i);
  for (const y of SHELF_ROWS) for (const x of xs) out.push({ x, y });
  return out;
}
const SLOTS = shelfSlots();
const DEVICE_SLOTS = shelfSlots(true);
/** The buildings with a device in the middle of their ground floor. */
const DEVICES = new Set([...Object.keys(SHOWCASES), 'nucleo', 'universo', BENCH_AT.room, LEGGIO_AT.room, TORNIO_AT.room]);

export class Corona {
  outer: number;
  buildings: Building[] = [];
  props: CampusProp[] = [];
  private propCells = new Map<string, CampusProp>();
  private slots = new Map<string, { x: number; y: number }>();
  private exterior = new Map<string, CoronaCell>();
  private files: FileMap = {};

  constructor(readonly radius: number) {
    this.outer = radius + CAMPUS.ring;
  }

  /** Compatibility: the folders are the buildings. */
  get folders(): Array<{ id: string; name: string; color: string; from: number; to: number; files: string[] }> {
    return this.buildings.map((b) => ({ id: b.id, name: b.name, color: b.color, from: b.from, to: b.to, files: b.floors.flatMap((f) => f.items.filter((i) => i.kind === 'file').map((i) => i.path!)) }));
  }

  build(files: FileMap, gallery: Exhibit[] = [], terrains: Exhibit[] = [], layouts: Exhibit[] = [], systems: Array<{ id: string; name: string }> = []): void {
    this.files = files;
    this.slots.clear();
    this.exterior.clear();
    this.props = [];
    this.propCells.clear();
    const R = this.radius;
    this.outer = R + CAMPUS.ring;
    const groups = new Map<string, Array<Omit<StudioItem, 'x' | 'y'>>>();
    const add = (room: string, item: Omit<StudioItem, 'x' | 'y'>) => {
      if (!groups.has(room)) groups.set(room, []);
      groups.get(room)!.push(item);
    };
    for (const path of Object.keys(files).sort()) add(folderOf(path), { kind: 'file', path, label: path, look: lookOf(path), lines: files[path].split('\n').length });
    for (const g of gallery) add('galleria', { kind: 'sprite', label: g.label, color: g.color, path: g.path, target: g.target, model: g.model, tint: g.tint });
    const samples: Array<Omit<StudioItem, 'x' | 'y'> | undefined> = terrains.map((t) => ({ kind: 'tile', label: t.label, color: t.color, path: t.path, target: t.target }));
    // The environments start a shelf of their own (the empty slots before them stay empty).
    if (layouts.length) samples.push(...Array<undefined>((SHELF_W - (samples.length % SHELF_W)) % SHELF_W), ...layouts.map((l): Omit<StudioItem, 'x' | 'y'> => ({ kind: 'layout', label: l.label, path: l.path, target: l.target })));
    if (samples.length && !groups.has(SAMPLES)) groups.set(SAMPLES, []);
    const ids = [...groups.keys()].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const total = ids.length;
    this.buildings = ids.map((id, index) => {
      const def = ROOMS[id] ?? ROOMS.altro;
      const from = (index / total) * Math.PI * 2;
      const to = ((index + 1) / total) * Math.PI * 2;
      const mid = (from + to) / 2;
      const perFloor = SLOTS.length;
      const chunk = <T,>(list: T[]) => Array.from({ length: Math.ceil(list.length / perFloor) }, (_, i) => list.slice(i * perFloor, (i + 1) * perFloor));
      // With a device, the ground floor holds fewer files (at the sides): the rest go upstairs.
      const ground = DEVICES.has(id) ? DEVICE_SLOTS.length : perFloor;
      const files = groups.get(id)!;
      const filePages = files.length ? [files.slice(0, ground), ...chunk(files.slice(ground))] : [];
      // The files floor by floor; the terrains of the sample room after them, from a floor of their own.
      const pages = [...filePages, ...(id === SAMPLES ? chunk(samples) : [])];
      const firstSample = id === SAMPLES && samples.length ? pages.length - Math.ceil(samples.length / perFloor) : -1;
      const floors: Floor[] = [];
      const nFloors = Math.max(1, pages.length);
      for (let f = 0; f < nFloors; f++) {
        const ox = INTERIOR_X + index * BUILDING_STRIDE;
        const oy = f * FLOOR_STRIDE;
        const council = id === 'concilio';
        // The Council's hall: its files on one shelf along the wall, the round table in the middle.
        const slots = council ? Array.from({ length: perFloor }, (_, i) => ({ x: SHELF_X0 + (i % (SHELF_X1 - SHELF_X0 + 1)), y: 2 + Math.floor(i / (SHELF_X1 - SHELF_X0 + 1)) })) : f === 0 && DEVICES.has(id) ? DEVICE_SLOTS : SLOTS;
        const placed: StudioItem[] = (pages[f] ?? []).flatMap((it, i) => (it ? [{ ...it, x: ox + slots[i].x, y: oy + slots[i].y }] : []));
        if (council && f === 0) {
          placed.push({ kind: 'table', label: "il tavolo del Concilio: al centro, l'universo", x: ox + Math.floor(TABLE.cx), y: oy + Math.floor(TABLE.cy) });
          SEATS.forEach((s, i) => {
            const a = -Math.PI / 2 + (i / SEATS.length) * Math.PI * 2;
            placed.push({ kind: 'desk', label: `il posto del ${s.agent}`, target: s.agent, x: ox + Math.round(TABLE.cx + Math.cos(a) * 5), y: oy + Math.round(TABLE.cy + Math.sin(a) * 3.4) });
            placed.push({ kind: 'portal', label: s.room ? `teletrasporto: ${ROOMS[s.room]?.name ?? s.room}` : 'teletrasporto: fuori, sul viale', target: s.room, x: ox + Math.round(TABLE.cx + Math.cos(a) * 7.6), y: oy + Math.max(1, Math.min(ROOM_H - 2, Math.round(TABLE.cy + Math.sin(a) * 4.9))) });
          });
        } else if (f === 0) {
          // A wall of screens with the room's history; the team stands in front of it (no desks: T49a).
          placed.push({ kind: 'screen', label: 'schermo: la storia di questa sala', x: ox + 3, y: oy + ROOM_H - 3, w: 6 });
          placed.push({ kind: 'portal', label: 'teletrasporto: Sala del Concilio', target: 'concilio', x: ox + ROOM_W - 3, y: oy + ROOM_H - 3 });
          if (id === SAMPLES) placed.push({ kind: 'atlas', label: "l'atlante del mondo", ...ATLAS_AT, x: ox + ATLAS_AT.x, y: oy + ATLAS_AT.y });
          if (id === 'nucleo') placed.push({ kind: 'grafo', label: 'il grafo del mondo', ...GRAPH_AT, x: ox + GRAPH_AT.x, y: oy + GRAPH_AT.y });
          if (id === 'universo') {
            placed.push({ kind: 'situazione', label: 'il tavolo della situazione', ...SITUATION_AT, x: ox + SITUATION_AT.x, y: oy + SITUATION_AT.y });
            for (const f of WALL_AT) placed.push({ kind: 'parete', label: `la parete di schermi: ${SCREEN_NAME[f.field]}`, target: f.field, x: ox + f.x, y: oy + WALL_Y, w: f.w });
            const film = WALL_AT[0];
            placed.push({ kind: 'prev', label: '«<» indietro nel tempo', target: film.field, x: ox + film.x, y: oy + WALL_Y + 1 });
            placed.push({ kind: 'next', label: '«>» avanti nel tempo', target: film.field, x: ox + film.x + film.w - 1, y: oy + WALL_Y + 1 });
            Object.entries(AGENTS).forEach(([agent, a], i) => placed.push({ kind: 'console', label: `la console ${ofThe(a.name)}`, target: agent, color: a.color, x: ox + CONSOLES_AT.x + i, y: oy + CONSOLES_AT.y }));
          }
          if (id === CHAIN.room) chainSlots(systems.length).forEach((s, i) => placed.push({ kind: 'stazione', label: `la catena dei sistemi: ${systems[i].name}`, target: systems[i].id, x: ox + s.x, y: oy + WALL_Y, w: s.w }));
          if (id === BENCH_AT.room) {
            placed.push({ kind: 'banco', label: 'il banco di prova', target: 'banco', x: ox + BENCH_AT.x, y: oy + BENCH_AT.y, w: BENCH_AT.w, h: BENCH_AT.h });
            placed.push({ kind: 'prev', label: '«<» il caso precedente', target: 'banco', x: ox + BENCH_AT.x - 1, y: oy + SHOWCASE_AT.y });
            placed.push({ kind: 'next', label: '«>» il caso successivo', target: 'banco', x: ox + BENCH_AT.x + BENCH_AT.w, y: oy + SHOWCASE_AT.y });
          }
          if (id === LEGGIO_AT.room) {
            placed.push({ kind: 'leggio', label: 'il leggio della Biblioteca: la bibbia del mondo', target: 'leggio', x: ox + LEGGIO_AT.x, y: oy + LEGGIO_AT.y, w: LEGGIO_AT.w, h: LEGGIO_AT.h });
            placed.push({ kind: 'prev', label: '«<» la pagina precedente', target: 'leggio', x: ox + LEGGIO_AT.x - 1, y: oy + SHOWCASE_AT.y });
            placed.push({ kind: 'next', label: '«>» la pagina successiva', target: 'leggio', x: ox + LEGGIO_AT.x + LEGGIO_AT.w, y: oy + SHOWCASE_AT.y });

            // The Library of the World (T47b): tablets of the rules (world/rules.json) along the back wall
            let allRules: Rule[] = [];
            try {
              allRules = (JSON.parse(this.files['world/rules.json'] ?? '{}').regole ?? []) as Rule[];
            } catch {}
            this.rulesOffset = Math.max(0, allRules.length - TABLETS_MAX);
            placed.push(...ruleTablets(ox, oy, allRules, this.rulesOffset));
          }
          if (id === TORNIO_AT.room) {
            placed.push({ kind: 'tornio', label: 'il tornio dello Scultore', target: 'tornio', x: ox + TORNIO_AT.x, y: oy + TORNIO_AT.y, w: TORNIO_AT.w, h: TORNIO_AT.h });
            placed.push({ kind: 'prev', label: '«<» il modello precedente', target: 'tornio', x: ox + TORNIO_AT.x - 1, y: oy + SHOWCASE_AT.y });
            placed.push({ kind: 'next', label: '«>» il modello successivo', target: 'tornio', x: ox + TORNIO_AT.x + TORNIO_AT.w, y: oy + SHOWCASE_AT.y });
          }
          const show = SHOWCASES[id];
          if (show) {
            const { x, y, w } = SHOWCASE_AT;
            const h = show.device === 'stampante' || show.device === 'plastico' ? PRINTER : 1;
            placed.push({ kind: 'showcase', label: show.label, source: show.source, device: show.device, target: id, x: ox + x, y: oy + y - Math.floor(h / 2), w, h });
            placed.push({ kind: 'prev', label: '«<» il precedente', target: id, x: ox + x - 1, y: oy + y });
            placed.push({ kind: 'next', label: '«>» il successivo', target: id, x: ox + x + w, y: oy + y });
            if (show.device === 'plastico') {
              placed.push({ kind: 'less', label: '«−» la fase prima', target: id, x: ox + x, y: oy + y + 2 });
              placed.push({ kind: 'more', label: '«+» la fase dopo', target: id, x: ox + x + w - 1, y: oy + y + 2 });
            }
          }
        }
        if (f === 0) placed.push({ kind: 'exit', label: 'uscita', x: ox + Math.floor(ROOM_W / 2), y: oy + ROOM_H - 1 });
        if (f < nFloors - 1) placed.push({ kind: 'up', label: `scala al piano ${f + 2}${f + 1 === firstSample ? `: il campionario dei terreni${layouts.length ? ' e degli ambienti' : ''}` : ''}`, x: ox + ROOM_W - 2, y: oy + 1 });
        if (f > 0) placed.push({ kind: 'down', label: `scala al piano ${f}`, x: ox + 1, y: oy + 1 });
        for (const it of placed) if (it.kind === 'file' && it.path) this.slots.set(it.path, { x: it.x, y: it.y });
        floors.push({ index: f, ox, oy, items: placed });
      }
      // Outside: a block in the middle of the sector, the door towards the avenue.
      const span = (to - from) * CAMPUS.span;
      const cells = new Set<string>();
      for (let r = R + CAMPUS.front; r < R + CAMPUS.back; r += 0.5)
        for (let a = mid - span; a <= mid + span; a += 0.35 / r) {
          const c = polarCell(r, a);
          cells.add(`${c.x},${c.y}`);
        }
      const door = polarCell(R + CAMPUS.door, mid);
      cells.delete(`${door.x},${door.y}`);
      return { index, id, name: def.name, color: def.color, team: def.team, from, to, door, cells, floors };
    });
    // The avenue, the alleys between the sectors, the lawns and the edge of the campus.
    const max = Math.ceil(this.outer) + 1;
    for (let y = -max; y < max; y++)
      for (let x = -max; x < max; x++) {
        const d = Math.hypot(x + 0.5, y + 0.5);
        if (d < R || d >= this.outer) continue;
        const t = angleOf(x, y);
        const b = this.buildings.find((bb) => t >= bb.from && t < bb.to) ?? this.buildings[this.buildings.length - 1];
        const key = `${x},${y}`;
        if (b?.cells.has(key)) this.exterior.set(key, { kind: 'building', building: b.id });
        else if (b && b.door.x === x && b.door.y === y) this.exterior.set(key, { kind: 'door', building: b.id });
        else this.exterior.set(key, { kind: 'floor', ground: groundAt(d, R, t, total), building: b?.id, folder: b?.id });
      }

    // Campus props (T50b, T50e): lampioni along the avenue, light trees on lawns, benches and totems
    const addProp = (kind: CampusProp['kind'], model: string, x: number, y: number, yaw: number, seed: number, solid: boolean) => {
      const cx = Math.floor(x), cy = Math.floor(y);
      const key = `${cx},${cy}`;
      const cell = this.exterior.get(key);
      if (!cell || cell.kind !== 'floor') return;
      if (this.buildings.some((b) => Math.hypot(b.door.x - cx, b.door.y - cy) < 2.0)) return;
      const prop: CampusProp = { id: `${kind}_${cx}_${cy}`, kind, model, x, y, yaw, seed, solid };
      this.props.push(prop);
      if (solid) this.propCells.set(key, prop);
    };

    for (const b of this.buildings) {
      const mid = (b.from + b.to) / 2;
      const sector = b.to - b.from;

      // Lampioni along the inner side of the avenue neon line (2 per sector)
      for (const da of [-0.28, 0.28]) {
        const a = mid + da * sector;
        const r = R + CAMPUS.line - 0.8;
        addProp('lampione', 'corona-lampione', Math.sin(a) * r + 0.5, -Math.cos(a) * r + 0.5, -a, 1, true);
      }

      // Light trees on lawns (3 per sector with varying seeds for generative diversity)
      const treeConfigs = [
        { r: R + 27, a: mid - sector * 0.20, seed: 1 + (b.index * 3) % 7 },
        { r: R + 31, a: mid + sector * 0.20, seed: 1 + (b.index * 3 + 1) % 7 },
        { r: R + 18, a: mid + sector * 0.36, seed: 1 + (b.index * 3 + 2) % 7 },
      ];
      for (const tc of treeConfigs) {
        addProp('albero', 'corona-albero-luce', Math.sin(tc.a) * tc.r + 0.5, -Math.cos(tc.a) * tc.r + 0.5, (b.index * 1.7) % (Math.PI * 2), tc.seed, true);
      }

      // Panchine in alley and rear lawn
      const alleyAngle = b.from + 0.025;
      addProp('panchina', 'corona-panchina', Math.sin(alleyAngle) * (R + 14) + 0.5, -Math.cos(alleyAngle) * (R + 14) + 0.5, -alleyAngle + Math.PI / 2, 1, true);
      const benchRearA = mid - sector * 0.08;
      addProp('panchina', 'corona-panchina', Math.sin(benchRearA) * (R + 25) + 0.5, -Math.cos(benchRearA) * (R + 25) + 0.5, -benchRearA + Math.PI, 1, true);

      // Totem at alley entrance from avenue
      addProp('totem', 'corona-totem', Math.sin(alleyAngle) * (R + CAMPUS.avenue + 0.8) + 0.5, -Math.cos(alleyAngle) * (R + CAMPUS.avenue + 0.8) + 0.5, -alleyAngle, 1, true);
    }
  }

  /** The room (building and floor) containing a real-space point, if it is inside. */
  roomAt(x: number, y: number): { building: Building; floor: Floor } | undefined {
    if (x < INTERIOR_X - 10) return undefined;
    const b = this.buildings[Math.floor((x - INTERIOR_X + 10) / BUILDING_STRIDE)];
    if (!b) return undefined;
    const f = b.floors[Math.floor((y + 10) / FLOOR_STRIDE)];
    if (!f) return undefined;
    return { building: b, floor: f };
  }

  isInterior(x: number): boolean {
    return x >= INTERIOR_X - 10;
  }

  /** Cell at integer real-space coordinates, or null outside the ring and the rooms. */
  at(cx: number, cy: number): CoronaCell | null {
    const room = this.roomAt(cx, cy);
    if (room) {
      const lx = cx - room.floor.ox;
      const ly = cy - room.floor.oy;
      if (lx < 0 || ly < 0 || lx >= ROOM_W || ly >= ROOM_H) return null;
      const item = room.floor.items.find((i) => cy >= i.y && cy < i.y + (i.h ?? 1) && cx >= i.x && cx < i.x + (i.w ?? 1));
      // The round table fills an ellipse in the middle of the Council's hall.
      if (!item && room.building.id === 'concilio' && room.floor.index === 0 && ((lx + 0.5 - TABLE.cx) / TABLE.rx) ** 2 + ((ly + 0.5 - TABLE.cy) / TABLE.ry) ** 2 <= 1) {
        const table = room.floor.items.find((i) => i.kind === 'table');
        if (table) return { kind: 'item', building: room.building.id, item: table, folder: room.building.id };
      }
      if (item) return { kind: 'item', building: room.building.id, item, path: item.path, look: item.look, lines: item.lines, line: 1, folder: room.building.id };
      if (lx === 0 || ly === 0 || lx === ROOM_W - 1 || ly === ROOM_H - 1) return { kind: 'wall', building: room.building.id };
      return { kind: 'room', building: room.building.id };
    }
    return this.exterior.get(`${cx},${cy}`) ?? null;
  }

  /** Returns the campus prop on cell (cx, cy), if any. */
  propAt(cx: number, cy: number): CampusProp | undefined {
    return this.propCells.get(`${cx},${cy}`);
  }

  /** Can one stand there? Walls, shelves, the Council's seats and the buildings' outside walls block. */
  free(x: number, y: number): boolean {
    const cx = Math.floor(x), cy = Math.floor(y);
    const c = this.at(cx, cy);
    if (!c) return false;
    // Outside, solid campus props (lamp posts, tree trunks, benches, totems) block
    const prop = this.propCells.get(`${cx},${cy}`);
    if (prop?.solid) return false;
    // Outside, a building that is a model blocks with its voxels (and only with them).
    if (c.kind === 'floor' || c.kind === 'building' || c.kind === 'door') {
      const s = c.building ? this.building(c.building)?.structure : undefined;
      if (s) return !this.structureBlocks(s, x, y);
    }
    if (c.kind === 'floor' || c.kind === 'door' || c.kind === 'room') return true;
    if (c.kind === 'item') return ['exit', 'up', 'down', 'portal', 'less', 'more'].includes(c.item!.kind);
    return false;
  }

  private structureBlocks(s: CampusStructure, x: number, y: number): boolean {
    const [lx, lz] = toLocal(x - s.x, y - s.y, s.yaw);
    return Math.abs(lx) < s.form.reach + 1 && Math.abs(lz) < s.form.reach + 1 && footBlocks(s.form, s.form.foot!, lx, lz);
  }

  /**
   * A building of the campus becomes its model (T20): its front (y large in MarkovJunior) towards the circle, the
   * door (the letter named `porta`, or the middle of the front) on the avenue where the block's door was; its
   * cells are the ones its voxels cover, the rest of the block is lawn again.
   */
  placeStructure(id: string, model: string, form: Form): CampusStructure | undefined {
    const b = this.building(id);
    const r = form.result;
    if (!b || !r || !form.foot) return undefined;
    const g = r.grid, XY = g.X * g.Y;
    const door = new Set(g.alphabet.map((sym, i) => (r.palette[sym]?.name === 'porta' ? i : -1)).filter((i) => i >= 0));
    let sx = 0, sy = 0, n = 0, front = 0;
    for (let i = 0; i < g.cells.length; i++) {
      if (!door.has(g.cells[i])) continue;
      sx += i % g.X;
      sy += Math.floor((i % XY) / g.X);
      n++;
    }
    for (let i = 0; i < XY; i++) if (form.foot[i]) front = Math.max(front, Math.floor(i / g.X));
    // The door's voxels, or the middle of the front; one step outside it is where one stands to go in.
    const [dx, dy] = n ? [sx / n, sy / n] : [g.X / 2, front];
    const lx = (dx + 0.5 - g.X / 2) / form.vpt, lz = (Math.max(dy, front) + 1 - g.Y / 2) / form.vpt + 0.5;
    const mid = (b.from + b.to) / 2;
    const yaw = -mid;
    const c = Math.cos(yaw), sn = Math.sin(yaw);
    const R = this.radius + CAMPUS.door;
    const px = Math.sin(mid) * R + 0.5, py = -Math.cos(mid) * R + 0.5;
    const s: CampusStructure = { model, x: px - (lx * c + lz * sn), y: py - (-lx * sn + lz * c), yaw, form };
    b.structure = s;
    b.door = { x: Math.floor(px), y: Math.floor(py) };
    // Letter named `plinto` (T48b): location and surface bounds of the plinto in the building's forecourt
    const plintoSymbols = new Set(g.alphabet.map((sym, i) => (r.palette[sym]?.name === 'plinto' ? i : -1)).filter((i) => i >= 0));
    if (plintoSymbols.size > 0) {
      let px_sum = 0, py_sum = 0, pz_max = 0, pn = 0;
      let min_x = Infinity, max_x = -Infinity, min_y = Infinity, max_y = -Infinity;
      for (let i = 0; i < g.cells.length; i++) {
        if (!plintoSymbols.has(g.cells[i])) continue;
        const vx = i % g.X;
        const vy = Math.floor((i % XY) / g.X);
        const vz = Math.floor(i / XY);
        px_sum += vx;
        py_sum += vy;
        pz_max = Math.max(pz_max, vz);
        min_x = Math.min(min_x, vx);
        max_x = Math.max(max_x, vx);
        min_y = Math.min(min_y, vy);
        max_y = Math.max(max_y, vy);
        pn++;
      }
      if (pn > 0) {
        const avg_vx = px_sum / pn + 0.5;
        const avg_vy = py_sum / pn + 0.5;
        const plx = (avg_vx - g.X / 2) / form.vpt;
        const plz = (avg_vy - g.Y / 2) / form.vpt;
        const ply = (pz_max + 1) / form.vpt;
        s.plinto = {
          x: s.x + (plx * c + plz * sn),
          y: s.y + (-plx * sn + plz * c),
          z: ply,
          width: (max_x - min_x + 1) / form.vpt,
          depth: (max_y - min_y + 1) / form.vpt,
        };
      }
    }
    // Its cells: those it blocks; what was block and is not covered goes back to the ground of the campus.
    const total = this.buildings.length;
    for (const key of b.cells) {
      const [x, y] = key.split(',').map(Number);
      this.exterior.set(key, { kind: 'floor', ground: groundAt(Math.hypot(x + 0.5, y + 0.5), this.radius, angleOf(x, y), total), building: b.id, folder: b.id });
    }
    b.cells = new Set();
    const reach = Math.ceil(form.reach) + 1;
    for (let y = Math.floor(s.y) - reach; y <= Math.floor(s.y) + reach; y++)
      for (let x = Math.floor(s.x) - reach; x <= Math.floor(s.x) + reach; x++) {
        const key = `${x},${y}`;
        const cell = this.exterior.get(key);
        if (!cell || cell.kind !== 'floor' || cell.building !== b.id || !this.structureBlocks(s, x + 0.5, y + 0.5)) continue;
        b.cells.add(key);
        this.exterior.set(key, { kind: 'building', building: b.id });
      }
    this.exterior.set(`${b.door.x},${b.door.y}`, { kind: 'door', building: b.id });
    return s;
  }

  /** Where a file stands (real-space cell), if it is in the studio. */
  slotOf(path: string): { x: number; y: number } | undefined {
    return this.slots.get(path);
  }

  /** The nearest thing within r cells of a point (in the room you are in). */
  itemNear(x: number, y: number, r = 1.6, kinds?: ItemKind[]): StudioItem | undefined {
    const room = this.roomAt(x, y);
    if (!room) return undefined;
    let best: StudioItem | undefined;
    let bd = r;
    for (const it of room.floor.items) {
      if (it.kind === 'desk' || (kinds && !kinds.includes(it.kind))) continue;
      // Wide or deep things (screens, the atlas, the printer) are near from any of their cells; the table from its rim; the
      // Direction's wall of screens (T46b) and the chain's stations (T27a) from the foot of their screens, at the front of their cells.
      const c = cellNear(it, x, y);
      const d = it.kind === 'table' ? Math.hypot((x - TABLE.cx - this.roomAt(x, y)!.floor.ox) / TABLE.rx, (y - TABLE.cy - this.roomAt(x, y)!.floor.oy) / TABLE.ry) * 1.2 - 0.2 : Math.hypot(c.x + 0.5 - x, c.y + (it.kind === 'parete' || it.kind === 'stazione' ? 1 : 0.5) - y);
      if (d < bd) [best, bd] = [it, d];
    }
    return best;
  }

  nearestFile(x: number, y: number, r = 1.6): string | undefined {
    return this.itemNear(x, y, r, ['file'])?.path;
  }

  /** The building whose door is near a point outside. */
  doorNear(x: number, y: number, r = 1.6): Building | undefined {
    return this.buildings.find((b) => Math.hypot(b.door.x + 0.5 - x, b.door.y + 0.5 - y) < r);
  }

  /** Where you appear entering a building (floor 0, just inside the door) or a floor by the stairs. */
  entrance(b: Building, floor = 0, from: 'door' | 'up' | 'down' = 'door'): { x: number; y: number } {
    const f = b.floors[Math.max(0, Math.min(b.floors.length - 1, floor))];
    if (from === 'up') return { x: f.ox + 2.5, y: f.oy + 2.5 };
    if (from === 'down') return { x: f.ox + ROOM_W - 2.5, y: f.oy + 2.5 };
    return { x: f.ox + ROOM_W / 2 + 0.5, y: f.oy + ROOM_H - 2.5 };
  }

  /** Where you come out of a building: on the avenue, in front of its door. */
  exitPoint(b: Building): { x: number; y: number } {
    const mid = (b.from + b.to) / 2;
    const r = this.radius + CAMPUS.avenue - 1.5;
    return { x: Math.sin(mid) * r + 0.5, y: -Math.cos(mid) * r + 0.5 };
  }

  building(id: string | undefined): Building | undefined {
    return this.buildings.find((b) => b.id === id);
  }

  /** Compatibility with the old archive: a folder is a building. */
  folder(id: string | undefined): Building | undefined {
    return this.building(id);
  }

  /** The building that holds a file. */
  buildingOf(path: string): Building | undefined {
    const s = this.slots.get(path);
    return s ? this.roomAt(s.x, s.y)?.building : undefined;
  }

  inRing(x: number, y: number): boolean {
    const d = Math.hypot(x, y);
    return d >= this.radius && d < this.outer;
  }

  fileCount(): number {
    return Object.keys(this.files).length;
  }

  /** Current window offset of the rules wall in the Library (T47b). */
  rulesOffset = 0;

  /** Updates the visible rule tablets on the ground floor of the Library (T47b). */
  setRulesOffset(offset: number): void {
    this.rulesOffset = offset;
    const b = this.buildings.find((x) => x.id === 'mondo');
    if (!b || !b.floors[0]) return;
    const f = b.floors[0];
    let allRules: Rule[] = [];
    try {
      allRules = (JSON.parse(this.files['world/rules.json'] ?? '{}').regole ?? []) as Rule[];
    } catch {}
    // Remove existing rule tablets and rule arrows
    f.items = f.items.filter((it) => it.kind !== 'lastra' && !(it.target === 'regole' && (it.kind === 'prev' || it.kind === 'next')));
    const tablets = ruleTablets(f.ox, f.oy, allRules, this.rulesOffset);
    f.items.push(...tablets);
  }
}
