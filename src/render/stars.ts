// The sky of stars (T445, ADR-0233, `docs/design/acqua-spazio.md` § 2.8): in a world whose nature says `sky: stars`, behind and under
// everything. Two layers of points: a sphere that follows the camera (the stars at infinity, above and below the floor, which show through
// the void where no ground is drawn), and a slower field under the plane of the floor, which moves with the world at a share of its way
// (the carpet's scroll and the camera's), so that walking along the edge of a station the depth shows. The field repeats with a period, so
// it never runs out however far one goes. Neither the fog nor the light touches them; only drawing: nothing of the world reads them.

import * as THREE from 'three';

/** How many stars on the sphere, and how far (tiles). Inside the camera's far plane (400). */
const SPHERE = { count: 1800, radius: 320 } as const;
/** The field below: a tile of `period` tiles repeated 4 × 4, `count` stars a tile, `depth` under the floor. */
const FIELD = { count: 110, period: 120, depth: 70 } as const;
/** How much of the world's way the field below moves with: the parallax that shows its depth. */
export const FIELD_PARALLAX = 0.4;
/** The colour of the sky of stars, behind them. */
export const STAR_SKY = new THREE.Color('#020308');

/** A small deterministic generator: the same sky on every machine, and no `Math.random` in what is drawn. */
function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function layer(positions: number[], colours: number[], size: number): THREE.Points {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  const m = new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true, opacity: 0.95 });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  p.renderOrder = -10;
  return p;
}

/** A star's colour: mostly white, some bluish, some warm, of different brightness. */
function starColour(r: () => number, out: number[]): void {
  const b = 0.45 + r() * 0.55;
  const tint = r();
  const [cr, cg, cb] = tint < 0.15 ? [0.75, 0.85, 1] : tint < 0.25 ? [1, 0.85, 0.7] : [1, 1, 1];
  out.push(cr * b, cg * b, cb * b);
}

/** `v` into [−p/2, p/2). */
const wrap = (v: number, p: number) => v - p * Math.floor(v / p + 0.5);

export class Stars {
  readonly root = new THREE.Group();
  private sphere: THREE.Points;
  private field: THREE.Points;

  constructor(seed = 42) {
    const r = lcg(seed);
    const pos: number[] = [], col: number[] = [];
    for (let i = 0; i < SPHERE.count; i++) {
      // Uniform on the sphere.
      const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      pos.push(SPHERE.radius * s * Math.cos(a), SPHERE.radius * u, SPHERE.radius * s * Math.sin(a));
      starColour(r, col);
    }
    this.sphere = layer(pos, col, 1.6);
    // One tile of the field, then the same tile 4 × 4 around the middle: periodic, so it can be wrapped.
    const tile: Array<[number, number, number]> = [];
    const tc: number[] = [];
    for (let i = 0; i < FIELD.count; i++) {
      tile.push([r() * FIELD.period, -FIELD.depth * (0.6 + r() * 0.8), r() * FIELD.period]);
      starColour(r, tc);
    }
    const fp: number[] = [], fc: number[] = [];
    for (let i = -2; i < 2; i++)
      for (let j = -2; j < 2; j++)
        tile.forEach(([x, y, z], n) => {
          fp.push(x + i * FIELD.period, y, z + j * FIELD.period);
          fc.push(tc[n * 3], tc[n * 3 + 1], tc[n * 3 + 2]);
        });
    this.field = layer(fp, fc, 2.2);
    this.root.add(this.sphere, this.field);
    this.root.visible = false;
  }

  /**
   * Shown or not. The sphere stays at the camera; the field stays under it but slides back by a share of where the camera is on the carpet
   * (`ox`, `oy` the carpet's scroll: the ground moves by all of it), wrapped by its period.
   */
  /**
   * The sphere alone around a camera whose planes are far apart (T449, a planet's pass): `distance` from the eye, between them; the field,
   * which belongs under a floor, hidden.
   */
  around(camera: THREE.Camera, distance: number): void {
    this.root.visible = true;
    this.root.position.copy(camera.position);
    this.root.scale.setScalar(distance / SPHERE.radius);
    this.sphere.position.set(0, 0, 0);
    this.field.visible = false;
  }

  update(visible: boolean, camera: THREE.Camera, ox: number, oy: number): void {
    this.root.visible = visible;
    if (!visible) return;
    const c = camera.position;
    this.sphere.position.copy(c);
    this.field.position.set(c.x - wrap((c.x + ox) * FIELD_PARALLAX, FIELD.period), 0, c.z - wrap((c.z + oy) * FIELD_PARALLAX, FIELD.period));
  }
}
