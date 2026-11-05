// The way between two tiles (T245b, ADR-0140; primitive N of T183): A* on the tiles of the places loaded, in eight directions without
// cutting corners, with a cap on the tiles looked at. The kernel asks it for `world.path` and keeps what it found for a while, so a
// walker asks once per way and not at every tick. Pure: the passable test comes from whoever calls.

export type Cell = readonly [number, number];

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

/**
 * The tiles from `from` to `to`, both included, or undefined when there is no way within `ROUTE_NODES`. A goal that is not passable
 * (water to fish in, a tree to cut) is reached at a passable tile next to it.
 */
export function findRoute(from: Cell, to: Cell, passable: (col: number, row: number) => boolean, maxNodes = ROUTE_NODES): Cell[] | undefined {
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
  let seen = 0;
  while (open.size && seen < maxNodes) {
    const k = open.pop();
    const [c, r] = cells.get(k)!;
    seen++;
    if (isGoal(c, r)) {
      const path: Cell[] = [];
      for (let at: string | undefined = k; at; at = came.get(at)) path.unshift(cells.get(at)!);
      return path;
    }
    const base = g.get(k)!;
    for (const [dc, dr, w] of DIRS) {
      const nc = c + dc;
      const nr = r + dr;
      if (!passable(nc, nr)) continue;
      // No corner cut: both sides of a diagonal step are free.
      if (dc && dr && (!passable(c + dc, r) || !passable(c, r + dr))) continue;
      const nk = key(nc, nr);
      const cost = base + w;
      if (cost >= (g.get(nk) ?? Infinity)) continue;
      g.set(nk, cost);
      came.set(nk, k);
      cells.set(nk, [nc, nr]);
      open.push(nk, cost + h(nc, nr));
    }
  }
  return undefined;
}

/** The ways found, for a while: by start and goal tile, forgotten after `ttl` ticks or when the tiles change (`clear`). */
export class RouteCache {
  private ways = new Map<string, { cells: Cell[] | undefined; at: number }>();
  constructor(
    private ttl = 600,
    private max = 512,
  ) {}

  get(from: Cell, to: Cell, now: number, find: () => Cell[] | undefined): Cell[] | undefined {
    const k = `${from[0]},${from[1]}>${to[0]},${to[1]}`;
    const hit = this.ways.get(k);
    if (hit && now - hit.at <= this.ttl) return hit.cells;
    const cells = find();
    if (this.ways.size >= this.max) this.ways.delete(this.ways.keys().next().value!);
    this.ways.set(k, { cells, at: now });
    return cells;
  }

  clear(): void {
    this.ways.clear();
  }
}
