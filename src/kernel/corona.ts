// The corona: a still ring around the simulation circle holding the universe's entire source, laid
// out as an archive. Every folder is a sector of the ring (a room with its own floor and a sign at the
// threshold); every file is an object on the floor of its sector: a book (manifest), a crystal (Lua
// code), a scroll (text), a tablet (other data). E next to a file opens it in the editor.
// Deterministic: same files → same archive.

import type { FileMap } from './types';

export type CoronaCellKind = 'file' | 'folder' | 'floor' | 'empty';
export type FileLook = 'libro' | 'cristallo' | 'pergamena' | 'tavoletta';

export interface CoronaCell {
  kind: CoronaCellKind;
  /** Sector (folder) this cell belongs to. */
  folder?: string;
  /** For files. */
  path?: string;
  look?: FileLook;
  /** Lines of the file (files only). */
  lines?: number;
  /** For compatibility with the editor (opens at the first line). */
  line?: number;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  /** Angles (radians, clockwise from the top) the sector spans. */
  from: number;
  to: number;
  files: string[];
  /** Where its sign stands (real-space cell). */
  sign: { x: number; y: number };
}

const FOLDERS: Record<string, { name: string; color: string }> = {
  universo: { name: 'Universo', color: '#ffcf5c' },
  mondo: { name: 'Mondo', color: '#7dd87d' },
  concilio: { name: 'Concilio', color: '#ff8ad8' },
  nucleo: { name: 'Nucleo', color: '#6fc3ff' },
  sistemi: { name: 'Sistemi', color: '#b9a6ff' },
  luoghi: { name: 'Luoghi', color: '#9ad27a' },
  oggetti: { name: 'Oggetti', color: '#e0b070' },
  cose: { name: 'Cose', color: '#d89a6a' },
  persone: { name: 'Persone', color: '#ffb38a' },
  magia: { name: 'Magia', color: '#c48aff' },
  altro: { name: 'Altro', color: '#9fb2a8' },
};

/** Which room of the archive a file lives in. */
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
  if (path.startsWith('world/')) return 'mondo';
  return 'universo';
}

export function lookOf(path: string): FileLook {
  if (path.endsWith('.lua')) return 'cristallo';
  if (path.endsWith('manifest.json')) return 'libro';
  if (path.endsWith('.md')) return 'pergamena';
  return 'tavoletta';
}

const ORDER = Object.keys(FOLDERS);
/** Rings of the archive: a walkway, then shelves of files every other ring. */
const SHELF_RINGS = [2, 4, 6];
const SLOT_SPACING = 2;

export class Corona {
  outer: number;
  folders: Folder[] = [];
  private cells = new Map<string, CoronaCell>();
  private slots = new Map<string, { x: number; y: number }>();
  private files: FileMap = {};

  constructor(readonly radius: number) {
    this.outer = radius + 8;
  }

  build(files: FileMap): void {
    this.files = files;
    this.cells.clear();
    this.slots.clear();
    const R = this.radius;
    const groups = new Map<string, string[]>();
    for (const path of Object.keys(files).sort()) {
      const f = folderOf(path);
      if (!groups.has(f)) groups.set(f, []);
      groups.get(f)!.push(path);
    }
    const ids = [...groups.keys()].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    // Enough rings for every file: slots per ring ≈ circumference / spacing.
    let rings = [...SHELF_RINGS];
    const capacity = (rs: number[]) => rs.reduce((n, r) => n + Math.floor((2 * Math.PI * (R + r)) / SLOT_SPACING), 0) - ids.length * rs.length;
    while (capacity(rings) < Object.keys(files).length) rings.push(rings[rings.length - 1] + 2);
    this.outer = R + rings[rings.length - 1] + 2;

    // Sectors proportional to the number of files (with a minimum, so small folders are rooms too).
    const total = ids.reduce((n, id) => n + groups.get(id)!.length + 2, 0);
    let a = 0;
    this.folders = ids.map((id) => {
      const span = ((groups.get(id)!.length + 2) / total) * Math.PI * 2;
      const def = FOLDERS[id] ?? FOLDERS.altro;
      const from = a;
      a += span;
      const mid = from + 0.6 / (R + 1);
      return { id, name: def.name, color: def.color, from, to: a, files: groups.get(id)!, sign: polarCell(R + 1.5, mid) };
    });

    const angleOf = (x: number, y: number) => {
      let t = Math.atan2(y + 0.5, x + 0.5) + Math.PI / 2;
      if (t < 0) t += Math.PI * 2;
      return t;
    };
    const max = Math.ceil(this.outer) + 1;
    for (let y = -max; y < max; y++)
      for (let x = -max; x < max; x++) {
        const d = Math.hypot(x + 0.5, y + 0.5);
        if (d < R || d >= this.outer) continue;
        const t = angleOf(x, y);
        const folder = this.folders.find((f) => t >= f.from && t < f.to) ?? this.folders[this.folders.length - 1];
        this.cells.set(`${x},${y}`, { kind: 'floor', folder: folder?.id });
      }

    for (const f of this.folders) {
      this.cells.set(`${f.sign.x},${f.sign.y}`, { kind: 'folder', folder: f.id });
      // Files stand in columns across the shelves (a module's files side by side), centred in the room.
      const queue = [...f.files];
      const mid = R + rings[Math.floor(rings.length / 2)] + 0.5;
      const step = SLOT_SPACING / mid;
      const pad = 1.4 / mid;
      const columns = Math.ceil(queue.length / rings.length);
      const centre = (f.from + f.to) / 2;
      let t = Math.max(f.from + pad, centre - ((columns - 1) * step) / 2);
      for (; t < f.to - pad && queue.length; t += step)
        for (const r of rings) {
          if (!queue.length) break;
          const c = polarCell(R + r + 0.5, t);
          const key = `${c.x},${c.y}`;
          if (this.cells.get(key)?.kind !== 'floor') continue;
          const path = queue.shift()!;
          this.cells.set(key, { kind: 'file', folder: f.id, path, look: lookOf(path), lines: files[path].split('\n').length, line: 1 });
          this.slots.set(path, c);
        }
      // A sector too narrow for its files: the rest go wherever there is floor in it.
      for (const [key, cell] of this.cells) {
        if (!queue.length) break;
        if (cell.kind !== 'floor' || cell.folder !== f.id) continue;
        const [x, y] = key.split(',').map(Number);
        const d = Math.hypot(x + 0.5, y + 0.5) - R;
        if (d < 1.5 || (x + y) % 2) continue;
        const path = queue.shift()!;
        this.cells.set(key, { kind: 'file', folder: f.id, path, look: lookOf(path), lines: files[path].split('\n').length, line: 1 });
        this.slots.set(path, { x, y });
      }
    }
  }

  /** Cell at integer real-space coordinates, or null outside the ring. */
  at(cx: number, cy: number): CoronaCell | null {
    return this.cells.get(`${cx},${cy}`) ?? null;
  }

  /** Where a file lies (real-space cell), if it is in the archive. */
  slotOf(path: string): { x: number; y: number } | undefined {
    return this.slots.get(path);
  }

  /** The nearest file within r cells of a real-space point. */
  nearestFile(x: number, y: number, r = 1.6): string | undefined {
    let best: string | undefined;
    let bd = r;
    for (const [path, s] of this.slots) {
      const d = Math.hypot(s.x + 0.5 - x, s.y + 0.5 - y);
      if (d < bd) [best, bd] = [path, d];
    }
    return best;
  }

  folder(id: string | undefined): Folder | undefined {
    return this.folders.find((f) => f.id === id);
  }

  inRing(x: number, y: number): boolean {
    const d = Math.hypot(x, y);
    return d >= this.radius && d < this.outer;
  }

  fileCount(): number {
    return Object.keys(this.files).length;
  }
}

/** Real-space cell at radius r and angle t (clockwise from the top). */
export function polarCell(r: number, t: number): { x: number; y: number } {
  return { x: Math.floor(Math.sin(t) * r), y: Math.floor(-Math.cos(t) * r) };
}
