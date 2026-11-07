// The way between two tiles (T245b, ADR-0140; primitive N of T183): A* on the tiles of the places loaded, in eight directions without
// cutting corners, with a cap on the tiles looked at. The kernel asks it for `world.path` and keeps what it found for a while, so a
// walker asks once per way and not at every tick. Pure: the passable test comes from whoever calls, and so does the test of a step
// (T299): two free tiles are not enough when what stops a body stands between their middles (a thin wall on the edge, a rise of
// a model higher than a step), so a step is taken only where the body really passes.

export type Cell = readonly [number, number];

/** The half-size of a body a way is for when who asks does not say (a villager's, T299), and how far ahead of it the next point is. */
export const ROUTE_BODY = 0.35;
export const ROUTE_AHEAD = 1.6;
/** How near a goal no way reaches one goes, at most this far from it (tiles): a bench in a wall, the middle of a workshop (T299). */
export const ROUTE_NEAR = 2.5;

/** Tiles looked at, at most, for one way: beyond, there is no way (a place is 18×18, a few of them fit). */
export const ROUTE_NODES = 4000;

const DIRS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

const key = (c: number, r: number) => `${c},${r}`;

/** A binary heap of keys by cost. */
class Heap {
  private items: Array<{ k: string; f: number }> = [];
  get size(): number {
    return this.items.length;
  }
  push(k: string, f: number): void {
    const a = this.items;
    a.push({ k, f });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): string {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top.k;
  }
}

/** Whether a body goes from the middle of one tile to the middle of the next (both passable already). */
export type StepTest = (col: number, row: number, toCol: number, toRow: number) => boolean;

/**
 * The tiles from `from` to `to`, both included, or undefined when there is no way within `ROUTE_NODES`. A goal that is not passable
 * (water to fish in, a tree to cut) is reached at a passable tile next to it. With `step`, a move between two passable tiles is
 * taken only if it says so. With `near`, a goal no way reaches (the middle of a building, a bench in a wall) is reached as near as
 * one gets, if that is within `near` tiles of it: the way to the tile looked at nearest to it (T299).
 */
export function findRoute(from: Cell, to: Cell, passable: (col: number, row: number) => boolean, step?: StepTest, near = 0, maxNodes = ROUTE_NODES): Cell[] | undefined {
  const [gc, gr] = to;
  const goalOk = passable(gc, gr);
  const isGoal = (c: number, r: number) => (goalOk ? c === gc && r === gr : Math.max(Math.abs(c - gc), Math.abs(r - gr)) === 1);
  const h = (c: number, r: number) => {
    const dx = Math.abs(c - gc);
    const dy = Math.abs(r - gr);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  const start = key(from[0], from[1]);
  if (isGoal(from[0], from[1])) return [from];
  const g = new Map<string, number>([[start, 0]]);
  const came = new Map<string, string>();
  const cells = new Map<string, Cell>([[start, from]]);
  const open = new Heap();
  open.push(start, h(from[0], from[1]));
  const wayTo = (k: string): Cell[] => {
    const path: Cell[] = [];
    for (let at: string | undefined = k; at; at = came.get(at)) path.unshift(cells.get(at)!);
    return path;
  };
  let seen = 0;
  let best = start;
  let bestH = h(from[0], from[1]);
  while (open.size && seen < maxNodes) {
    const k = open.pop();
    const [c, r] = cells.get(k)!;
    seen++;
    if (isGoal(c, r)) return wayTo(k);
    const hk = h(c, r);
    if (hk < bestH) (best = k), (bestH = hk);
    const base = g.get(k)!;
    for (const [dc, dr, w] of DIRS) {
      const nc = c + dc;
      const nr = r + dr;
      if (!passable(nc, nr)) continue;
      // No corner cut: both sides of a diagonal step are free.
      if (dc && dr && (!passable(c + dc, r) || !passable(c, r + dr))) continue;
      if (step && !step(c, r, nc, nr)) continue;
      const nk = key(nc, nr);
      const cost = base + w;
      if (cost >= (g.get(nk) ?? Infinity)) continue;
      g.set(nk, cost);
      came.set(nk, k);
      cells.set(nk, [nc, nr]);
      open.push(nk, cost + h(nc, nr));
    }
  }
  return bestH <= near ? wayTo(best) : undefined;
}

/**
 * The ways found, for a while: by start and goal tile, forgotten after `ttl` ticks or when the tiles change (`clear`). A walker already
 * on a way it was given to the same goal goes on with the rest of it, with no search (T299: a search for each tile walked costs); the
 * steps tried are kept as long, since the next search near there tries them again.
 */
export class RouteCache {
  private ways = new Map<string, { cells: Cell[] | undefined; at: number }>();
  /** The ways found to each goal (and body), the newest last: where a walker may already be. */
  private toGoal = new Map<string, Array<{ cells: Cell[]; at: number }>>();
  private steps = new Map<string, boolean>();
  private stepsAt = 0;
  constructor(
    private ttl = 600,
    private max = 512,
  ) {}

  /** `body` tells apart the ways of bodies of different sizes. */
  get(from: Cell, to: Cell, now: number, find: () => Cell[] | undefined, body = ''): Cell[] | undefined {
    const goal = `${to[0]},${to[1]}${body && `@${body}`}`;
    const k = `${from[0]},${from[1]}>${goal}`;
    const hit = this.ways.get(k);
    if (hit && now - hit.at <= this.ttl) return hit.cells;
    const known = (this.toGoal.get(goal) ?? []).filter((w) => now - w.at <= this.ttl);
    let cells: Cell[] | undefined;
    for (let j = known.length - 1; j >= 0 && !cells; j--) {
      const i = known[j].cells.findIndex(([c, r]) => c === from[0] && r === from[1]);
      if (i >= 0) cells = known[j].cells.slice(i);
    }
    const found = !cells;
    cells ??= find();
    if (this.ways.size >= this.max) this.ways.delete(this.ways.keys().next().value!);
    this.ways.set(k, { cells, at: now });
    if (found && cells) {
      known.push({ cells, at: now });
      if (known.length > 8) known.shift();
      this.toGoal.delete(goal);
      if (this.toGoal.size >= this.max) this.toGoal.delete(this.toGoal.keys().next().value!);
      this.toGoal.set(goal, known);
    }
    return cells;
  }

  /** Whether a body steps from one tile to the next, as `test` says, kept as long as the ways. */
  step(c: number, r: number, nc: number, nr: number, body: string, now: number, test: () => boolean): boolean {
    if (now - this.stepsAt > this.ttl || this.steps.size > 200_000) this.steps.clear(), (this.stepsAt = now);
    const k = `${c},${r}>${nc},${nr}@${body}`;
    let ok = this.steps.get(k);
    if (ok === undefined) this.steps.set(k, (ok = test()));
    return ok;
  }

  clear(): void {
    this.ways.clear();
    this.toGoal.clear();
    this.steps.clear();
  }
}
