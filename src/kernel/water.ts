// The water that flows (T51b, ADR-0094): a cellular automaton of the kernel on the loaded places.
// MarkovJunior generates the relief and the water of a place (ADR-0048); when the ground changes later (a
// dig, a spell that lowers or raises it) the water moves: every tile holds an amount of water over its
// bed, and each step a tile gives to its lower neighbours a share of the difference of their surfaces. It
// runs only where something changed and stops when nothing moves any more; the water a body loses is the
// water the new hollow gets (the amount is kept), and the open sea is a source that never runs dry.
//
// Pure and deterministic: the world comes in through `WaterWorld`, what changed goes out through `changed()`;
// the same steps on the same world give the same water (ADR-0055), in Node and in the browser.

/** The depth (levels) of the water of a tile that has never flowed: a body of water holds this much on each tile. */
export const DEEP = 2;
/** Above this amount (levels) a tile is water; below it, land that is wet at most. */
export const WET = 0.5;
/** What a tile gives each step to a lower neighbour, of the difference of their surfaces (≤ 1/4 keeps it stable). */
const RATE = 0.2;
/** Below this the water has settled. */
const EPS = 1e-4;
/** The floor: at most this many tiles in one flow (a lake larger than the loaded world does not exist, but still). */
const MAX_CELLS = 40_000;

/** What the automaton knows of the world. Levels are those of the relief (a level = a quarter of a tile). */
export interface WaterWorld {
  /** Whether a tile belongs to a loaded, planned place: water flows only there. */
  loaded(col: number, row: number): boolean;
  /** Whether a tile is water now. */
  wet(col: number, row: number): boolean;
  /** The level of a tile in the world's field (T51a): the surface of the water for water. */
  surface(col: number, row: number): number;
  /** The ground of a tile of land: the relief, dug or raised, never below the sea. */
  ground(col: number, row: number): number;
  /** What a tile that has flowed keeps: its bed and its water (levels). */
  record(col: number, row: number): readonly [number, number, ...unknown[]] | undefined;
  /** The sea's level: water there is the sea, it neither rises nor sinks. */
  sea(): number;
}

interface Cell {
  col: number;
  row: number;
  /** Bed (levels). */
  g: number;
  /** Water over it (levels). */
  w: number;
  /** The open sea: its surface stays at the sea's level. */
  src: boolean;
  /** Water when the flow found it, as a tile (for what it was, if it dries). */
  wasWet: boolean;
  /** Where its water came from, when it was land: the tile it took it from first. */
  from?: [number, number];
  /** What `changed()` last said of it: water or not, and its surface rounded. */
  said?: string;
}

/** A tile the flow has changed: its bed, its water, whether it is water now, and the tile its water came from. */
export interface WaterChange {
  col: number;
  row: number;
  bed: number;
  water: number;
  wet: boolean;
  /** For land that became water: the tile (col, row) it took its water from, whose kind of water it is. */
  from?: [number, number];
}

const key = (col: number, row: number) => `${col},${row}`;
const SIDES: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class WaterFlow {
  private cells = new Map<string, Cell>();
  private active = new Set<string>();
  /** Steps run since the last equilibrium. */
  steps = 0;

  constructor(private world: WaterWorld) {}

  /** Whether the water is still moving somewhere. */
  get moving(): boolean {
    return this.active.size > 0;
  }

  /** The water of a tile as the flow has it (levels), if it is in the flow. */
  water(col: number, row: number): { bed: number; water: number } | undefined {
    const c = this.cells.get(key(col, row));
    return c && { bed: c.g, water: c.w };
  }

  /**
   * A tile of the flow, taken from the world the first time. A tile of water brings in its whole body (the water
   * it touches, as far as the loaded places go) at once, before anything flows: what the world says of its
   * surface is what it was, not what the flow has made of the water beside it.
   */
  private cell(col: number, row: number): Cell | undefined {
    const c = this.take(col, row);
    if (!c?.wasWet || c.src) return c;
    for (const queue = [c]; queue.length; ) {
      const a = queue.pop()!;
      for (const [dc, dr] of SIDES) {
        const k = key(a.col + dc, a.row + dr);
        if (this.cells.has(k) || !this.world.wet(a.col + dc, a.row + dr)) continue;
        const b = this.take(a.col + dc, a.row + dr);
        if (b && !b.src) queue.push(b);
      }
    }
    return c;
  }

  private take(col: number, row: number): Cell | undefined {
    const k = key(col, row);
    let c = this.cells.get(k);
    if (c) return c;
    const w = this.world;
    if (!w.loaded(col, row) || this.cells.size >= MAX_CELLS) return undefined;
    const rec = w.record(col, row);
    const wet = w.wet(col, row);
    if (wet && w.surface(col, row) <= w.sea()) c = { col, row, g: w.sea() - DEEP, w: DEEP, src: true, wasWet: true };
    else if (rec && Number.isFinite(rec[0]) && Number.isFinite(rec[1])) c = { col, row, g: rec[0], w: Math.max(0, rec[1]), src: false, wasWet: wet };
    else if (wet) c = { col, row, g: w.surface(col, row) - DEEP, w: DEEP, src: false, wasWet: true };
    else c = { col, row, g: w.ground(col, row), w: 0, src: false, wasWet: false };
    c.said = this.say(c);
    this.cells.set(k, c);
    return c;
  }

  private say(c: Cell): string {
    const wet = c.src || c.w > WET;
    return wet ? `w${Math.round(c.g + c.w)}` : 'l';
  }

  /**
   * The ground of a tile changed by `delta` levels (a dig is negative): its bed moves, its water stays on it and
   * flows from there. The tile and its neighbours start to move.
   */
  dig(col: number, row: number, delta: number): void {
    const c = this.cell(col, row);
    if (!c || !Number.isFinite(delta)) return;
    if (c.src) return;
    c.g += delta;
    this.wake(col, row);
  }

  /** Something changed at a tile: it and its neighbours look again. */
  wake(col: number, row: number): void {
    if (this.cell(col, row)) this.active.add(key(col, row));
    for (const [dc, dr] of SIDES) if (this.cell(col + dc, row + dr)) this.active.add(key(col + dc, row + dr));
  }

  /** At rest, after its water went into the plans: the next flow takes the world again from them. */
  rest(): void {
    if (!this.active.size) this.cells.clear();
  }

  /** Forgets the tiles of places no longer loaded (what they had is already in their plans). */
  forget(): void {
    for (const [k, c] of this.cells)
      if (!this.world.loaded(c.col, c.row)) {
        this.cells.delete(k);
        this.active.delete(k);
      }
  }

  /** One step of the automaton on the tiles that move; true while something still moves. */
  step(): boolean {
    if (!this.active.size) return false;
    this.steps++;
    const delta = new Map<string, number>();
    const add = (k: string, v: number) => delta.set(k, (delta.get(k) ?? 0) + v);
    for (const k of this.active) {
      const a = this.cells.get(k);
      if (!a || a.w <= 0) continue;
      const ha = a.g + a.w;
      const outs: Array<[Cell, number]> = [];
      let total = 0;
      for (const [dc, dr] of SIDES) {
        const b = this.cell(a.col + dc, a.row + dr);
        if (!b) continue;
        const hb = b.g + b.w;
        if (hb >= ha) continue;
        // Never more than would bring the two level; never more than it has (scaled below).
        const f = (ha - hb) * RATE;
        outs.push([b, f]);
        total += f;
      }
      if (!total) continue;
      const scale = a.src ? 1 : Math.min(1, a.w / total);
      for (const [b, f] of outs) {
        const v = f * scale;
        add(k, -v);
        const bk = key(b.col, b.row);
        add(bk, v);
        if (!b.src && !b.wasWet && b.from === undefined) b.from = a.wasWet ? [a.col, a.row] : a.from;
      }
    }
    const next = new Set<string>();
    for (const [k, v] of delta) {
      const c = this.cells.get(k)!;
      if (c.src) continue;
      c.w = Math.max(0, c.w + v);
      if (Math.abs(v) > EPS) {
        next.add(k);
        for (const [dc, dr] of SIDES) if (this.cells.has(key(c.col + dc, c.row + dr))) next.add(key(c.col + dc, c.row + dr));
      }
    }
    this.active = next;
    if (!next.size) this.steps = 0;
    return next.size > 0;
  }

  /**
   * The tiles whose water changed what one sees (water or land, the surface rounded to a level) since the last
   * call, or all those the flow holds when `all` (at rest: their exact amounts go into the plans).
   */
  changed(all = false): WaterChange[] {
    const out: WaterChange[] = [];
    for (const c of this.cells.values()) {
      if (c.src) continue;
      const said = this.say(c);
      if (!all && said === c.said) continue;
      c.said = said;
      const wet = c.w > WET;
      out.push({ col: c.col, row: c.row, bed: c.g, water: c.w, wet, ...(wet && !c.wasWet && c.from ? { from: c.from } : {}) });
    }
    return out;
  }

  /** All the water the flow holds, the sea apart (levels × tiles): what flows is kept. */
  volume(): number {
    let v = 0;
    for (const c of this.cells.values()) if (!c.src) v += c.w;
    return v;
  }
}
