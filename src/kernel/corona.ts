// The corona as the studio of a game company: a campus on the ring around the simulation, one
// building per folder of the universe (and a gallery, a map room), with a door on the walkway.
// Inside, buildings are bigger than outside (ADR-0022): rooms on several floors joined by stairs,
// shelves with every file (book = manifest, crystal = Lua, scroll = text, tablet = data), framed
// sprites and painted terrains, desks where the Council's teams work, a notice board with the latest
// changes. Interiors live in their own region of real space, far from the ring; doors teleport.
// Deterministic: same files → same studio.

import type { FileMap } from './types';

export type FileLook = 'libro' | 'cristallo' | 'pergamena' | 'tavoletta';
export type ItemKind = 'file' | 'sprite' | 'tile' | 'screen' | 'up' | 'down' | 'exit' | 'desk' | 'portal' | 'table' | 'atlas' | 'showcase' | 'prev' | 'next';
/** What a showcase shows (T21): the runes and spells, the people, the things, the objects of the packs. */
export type ShowcaseSource = 'rune' | 'persone' | 'cose' | 'oggetti';
/** How a showcase looks: a screen, a silo of liquid, a 3D printer. */
export type ShowcaseDevice = 'schermo' | 'silos' | 'stampante';

/**
 * The showcases of the interiors (T21): a device with «<» «>» at its sides that picks what it shows; E or a
 * click on it opens a panel with what it is. One per building, on the ground floor.
 */
export const SHOWCASES: Record<string, { source: ShowcaseSource; device: ShowcaseDevice; label: string }> = {
  magia: { source: 'rune', device: 'schermo', label: 'lo schermo delle rune' },
  persone: { source: 'persone', device: 'silos', label: 'il silos dei personaggi' },
  cose: { source: 'cose', device: 'stampante', label: 'la stampante delle cose' },
  oggetti: { source: 'oggetti', device: 'stampante', label: 'la stampante degli oggetti' },
};
/** Where a showcase stands in its room (left cell, row) and how wide it is; the arrows are at its sides. */
export const SHOWCASE_AT = { x: 15, y: 11, w: 3 };

/** The Council at its round table: who sits where, and the room behind each seat's teleport. */
export const SEATS: Array<{ agent: string; room: string }> = [
  { agent: 'narratore', room: 'persone' },
  { agent: 'cartografo', room: 'cartografia' },
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
  /** A showcase: what it shows and how it looks; its arrows point to it with `target` (the building). */
  source?: ShowcaseSource;
  device?: ShowcaseDevice;
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
}

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
  cartografia: { name: 'Studio del Cartografo', color: '#7dd87d', team: 'cartografo' },
};

/** Which building a file lives in. */
export function folderOf(path: string): string {
  const m = /^modules\/([a-z]+)\./.exec(path);
  if (m) {
    const p = m[1];
    if (p === 'core') return 'nucleo';
    if (p === 'sys') return 'sistemi';
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
function shelfSlots(): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (const y of SHELF_ROWS) for (let x = SHELF_X0; x <= SHELF_X1; x++) out.push({ x, y });
  return out;
}
const SLOTS = shelfSlots();

export class Corona {
  outer: number;
  buildings: Building[] = [];
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

  build(files: FileMap, gallery: Exhibit[] = [], terrains: Exhibit[] = []): void {
    this.files = files;
    this.slots.clear();
    this.exterior.clear();
    const R = this.radius;
    this.outer = R + CAMPUS.ring;
    const groups = new Map<string, Array<Omit<StudioItem, 'x' | 'y'>>>();
    const add = (room: string, item: Omit<StudioItem, 'x' | 'y'>) => {
      if (!groups.has(room)) groups.set(room, []);
      groups.get(room)!.push(item);
    };
    for (const path of Object.keys(files).sort()) add(folderOf(path), { kind: 'file', path, label: path, look: lookOf(path), lines: files[path].split('\n').length });
    for (const g of gallery) add('galleria', { kind: 'sprite', label: g.label, color: g.color, path: g.path, target: g.target, model: g.model, tint: g.tint });
    for (const t of terrains) add('cartografia', { kind: 'tile', label: t.label, color: t.color, path: t.path, target: t.target });
    const ids = [...groups.keys()].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const total = ids.length;
    this.buildings = ids.map((id, index) => {
      const def = ROOMS[id] ?? ROOMS.altro;
      const from = (index / total) * Math.PI * 2;
      const to = ((index + 1) / total) * Math.PI * 2;
      const mid = (from + to) / 2;
      const items = groups.get(id)!;
      const perFloor = SLOTS.length;
      const floors: Floor[] = [];
      const nFloors = Math.max(1, Math.ceil(items.length / perFloor));
      for (let f = 0; f < nFloors; f++) {
        const ox = INTERIOR_X + index * BUILDING_STRIDE;
        const oy = f * FLOOR_STRIDE;
        const council = id === 'concilio';
        // The Council's hall: its files on one shelf along the wall, the round table in the middle.
        const slots = council ? Array.from({ length: perFloor }, (_, i) => ({ x: SHELF_X0 + (i % (SHELF_X1 - SHELF_X0 + 1)), y: 2 + Math.floor(i / (SHELF_X1 - SHELF_X0 + 1)) })) : SLOTS;
        const placed: StudioItem[] = items.slice(f * perFloor, (f + 1) * perFloor).map((it, i) => ({ ...it, x: ox + slots[i].x, y: oy + slots[i].y }));
        if (council && f === 0) {
          placed.push({ kind: 'table', label: "il tavolo del Concilio: al centro, l'universo", x: ox + Math.floor(TABLE.cx), y: oy + Math.floor(TABLE.cy) });
          SEATS.forEach((s, i) => {
            const a = -Math.PI / 2 + (i / SEATS.length) * Math.PI * 2;
            placed.push({ kind: 'desk', label: `il posto del ${s.agent}`, target: s.agent, x: ox + Math.round(TABLE.cx + Math.cos(a) * 5), y: oy + Math.round(TABLE.cy + Math.sin(a) * 3.4) });
            placed.push({ kind: 'portal', label: s.room ? `teletrasporto: ${ROOMS[s.room]?.name ?? s.room}` : 'teletrasporto: fuori, sul viale', target: s.room, x: ox + Math.round(TABLE.cx + Math.cos(a) * 7.6), y: oy + Math.max(1, Math.min(ROOM_H - 2, Math.round(TABLE.cy + Math.sin(a) * 4.9))) });
          });
        } else if (f === 0) {
          // A wall of screens with the room's history; the team works in front of it.
          placed.push({ kind: 'screen', label: 'schermo: la storia di questa sala', x: ox + 3, y: oy + ROOM_H - 3, w: 6 });
          for (let d = 0; d < 3; d++) placed.push({ kind: 'desk', label: 'postazione', x: ox + 4 + d * 2, y: oy + ROOM_H - 4 });
          placed.push({ kind: 'portal', label: 'teletrasporto: Sala del Concilio', target: 'concilio', x: ox + ROOM_W - 3, y: oy + ROOM_H - 3 });
          if (id === 'cartografia') placed.push({ kind: 'atlas', label: "l'atlante del mondo", x: ox + ROOM_W - 7, y: oy + ROOM_H - 3, w: 3 });
          const show = SHOWCASES[id];
          if (show) {
            const { x, y, w } = SHOWCASE_AT;
            placed.push({ kind: 'showcase', label: show.label, source: show.source, device: show.device, target: id, x: ox + x, y: oy + y, w });
            placed.push({ kind: 'prev', label: '«<» il precedente', target: id, x: ox + x - 1, y: oy + y });
            placed.push({ kind: 'next', label: '«>» il successivo', target: id, x: ox + x + w, y: oy + y });
          }
        }
        if (f === 0) placed.push({ kind: 'exit', label: 'uscita', x: ox + Math.floor(ROOM_W / 2), y: oy + ROOM_H - 1 });
        if (f < nFloors - 1) placed.push({ kind: 'up', label: `scala al piano ${f + 2}`, x: ox + ROOM_W - 2, y: oy + 1 });
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
      const item = room.floor.items.find((i) => i.y === cy && cx >= i.x && cx < i.x + (i.w ?? 1));
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

  /** Can one stand there? Walls, shelves, desks and the buildings' outside walls block. */
  free(x: number, y: number): boolean {
    const c = this.at(Math.floor(x), Math.floor(y));
    if (!c) return false;
    if (c.kind === 'floor' || c.kind === 'door' || c.kind === 'room') return true;
    if (c.kind === 'item') return ['exit', 'up', 'down', 'portal'].includes(c.item!.kind);
    return false;
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
      // Wide things (screens, the atlas) are near from any of their cells; the table from its rim.
      const cx = Math.max(it.x, Math.min(it.x + (it.w ?? 1) - 1, Math.floor(x)));
      const d = it.kind === 'table' ? Math.hypot((x - TABLE.cx - this.roomAt(x, y)!.floor.ox) / TABLE.rx, (y - TABLE.cy - this.roomAt(x, y)!.floor.oy) / TABLE.ry) * 1.2 - 0.2 : Math.hypot(cx + 0.5 - x, it.y + 0.5 - y);
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
}
