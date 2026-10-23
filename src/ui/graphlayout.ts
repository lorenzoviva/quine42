// The layout of the world graph in the Nucleus (T28): a force simulation in the plane, without the DOM
// (so it is tested in Node). Edges pull like springs, nodes push each other away (only within a few
// spacings, found with a grid: thousands of nodes stay fast), a weak gravity keeps the pieces together.
// Deterministic: the same nodes and edges give the same picture; the most connected start in the middle.

export interface LayoutOptions {
  /** The length of an edge at rest. */
  spacing?: number;
}

export class ForceLayout {
  readonly n: number;
  readonly x: Float64Array;
  readonly y: Float64Array;
  private vx: Float64Array;
  private vy: Float64Array;
  private degree: Int32Array;
  /** How much the nodes still move: from 1 down to `MIN_ALPHA`, when the layout is done. */
  alpha = 1;
  private spacing: number;

  constructor(
    count: number,
    private links: ReadonlyArray<readonly [number, number]>,
    opts: LayoutOptions = {},
  ) {
    this.n = count;
    this.spacing = opts.spacing ?? 30;
    this.x = new Float64Array(count);
    this.y = new Float64Array(count);
    this.vx = new Float64Array(count);
    this.vy = new Float64Array(count);
    this.degree = new Int32Array(count);
    for (const [a, b] of links) {
      this.degree[a]++;
      this.degree[b]++;
    }
    // A sunflower spiral, the most connected first: hubs in the middle, leaves outside.
    const order = [...Array(count).keys()].sort((a, b) => this.degree[b] - this.degree[a] || a - b);
    const golden = Math.PI * (3 - Math.sqrt(5));
    order.forEach((i, k) => {
      const r = this.spacing * Math.sqrt(k + 0.5);
      this.x[i] = Math.cos(k * golden) * r;
      this.y[i] = Math.sin(k * golden) * r;
    });
  }

  get done(): boolean {
    return this.alpha < MIN_ALPHA;
  }

  /** Some steps of the simulation; returns whether it is still moving. */
  step(iterations = 1): boolean {
    for (let it = 0; it < iterations && !this.done; it++) this.tick();
    return !this.done;
  }

  /** Runs until the layout is done. */
  run(): this {
    while (!this.done) this.tick();
    return this;
  }

  private tick(): void {
    const { n, x, y, vx, vy, alpha } = this;
    const S = this.spacing;
    // Repulsion within CUT spacings, through a grid of cells that size.
    const cut = S * CUT;
    const grid = new Map<number, number[]>();
    const key = (gx: number, gy: number) => gx * 73856093 + gy * 19349663;
    for (let i = 0; i < n; i++) {
      const k = key(Math.floor(x[i] / cut), Math.floor(y[i] / cut));
      const cell = grid.get(k);
      if (cell) cell.push(i);
      else grid.set(k, [i]);
    }
    const rep = REPULSION * S * S * alpha;
    for (let i = 0; i < n; i++) {
      const gx = Math.floor(x[i] / cut), gy = Math.floor(y[i] / cut);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const cell = grid.get(key(gx + dx, gy + dy));
          if (!cell) continue;
          for (const j of cell) {
            if (j <= i) continue;
            let ex = x[i] - x[j], ey = y[i] - y[j];
            let d2 = ex * ex + ey * ey;
            if (d2 >= cut * cut) continue;
            // Two nodes on the same point: apart along a direction of their own.
            if (d2 < 1e-6) {
              ex = Math.cos(i * 2.4 + j);
              ey = Math.sin(i * 2.4 + j);
              d2 = 1;
            }
            const f = rep / d2;
            vx[i] += ex * f; vy[i] += ey * f;
            vx[j] -= ex * f; vy[j] -= ey * f;
          }
        }
    }
    // Springs: a hub pulls each of its many leaves less (as d3 does).
    for (const [a, b] of this.links) {
      if (a === b) continue;
      const ex = x[b] + vx[b] - x[a] - vx[a], ey = y[b] + vy[b] - y[a] - vy[a];
      const d = Math.hypot(ex, ey) || 1e-3;
      const f = ((d - S) / d) * alpha * (SPRING / Math.min(this.degree[a], this.degree[b]));
      const wa = this.degree[b] / (this.degree[a] + this.degree[b]);
      vx[b] -= ex * f * (1 - wa); vy[b] -= ey * f * (1 - wa);
      vx[a] += ex * f * wa; vy[a] += ey * f * wa;
    }
    for (let i = 0; i < n; i++) {
      vx[i] = (vx[i] - x[i] * GRAVITY * alpha) * DECAY;
      vy[i] = (vy[i] - y[i] * GRAVITY * alpha) * DECAY;
      // A step never jumps more than a few spacings.
      const v = Math.hypot(vx[i], vy[i]);
      if (v > S * 3) {
        vx[i] *= (S * 3) / v;
        vy[i] *= (S * 3) / v;
      }
      x[i] += vx[i];
      y[i] += vy[i];
    }
    this.alpha *= 1 - ALPHA_DECAY;
  }

  /** The box around every node: [minX, minY, maxX, maxY]. */
  bounds(only?: (i: number) => boolean): [number, number, number, number] {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < this.n; i++) {
      if (only && !only(i)) continue;
      x0 = Math.min(x0, this.x[i]); y0 = Math.min(y0, this.y[i]);
      x1 = Math.max(x1, this.x[i]); y1 = Math.max(y1, this.y[i]);
    }
    return x0 === Infinity ? [0, 0, 0, 0] : [x0, y0, x1, y1];
  }
}

const REPULSION = 0.1;
const CUT = 2.5;
const SPRING = 0.5;
const GRAVITY = 0.03;
const DECAY = 0.6;
const ALPHA_DECAY = 0.0228;
const MIN_ALPHA = 0.001;
