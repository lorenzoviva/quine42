// T459: the ways of the ground and the automata in the page, for the frame (`node lab/scripts/misura-frame.mjs <port> --terreno`). Bundled
// by esbuild into a script the measuring tool evaluates in the page; nothing of the game changes: the meshes of the loaded places are put
// beside the game's and the game's ground is hidden, the automata run after the kernel's tick. It uses the page's own three.js (the
// classes of the meshes already in the scene) and the ground's material, so what is drawn costs what the game's ground would.
//
//   window.__t459.where()            the place with the most relief near the start: where the comparison is worth making
//   window.__t459.ground('columns' | 'voxels2' | 'voxels4')   the loaded places in that way; what it took, per place, and the bytes
//   window.__t459.automata(true)     the water as virtual pipes (a cell a tile, every tick) and the wind (a cell every 3 tiles, 10 Hz)
//   window.__t459.restore()          the game's ground again, the automata off

import { columnsMesh, LbmWind, LEVEL, PipesWater, strataMj, surfaceLetter, TERRAIN_PALETTE, trueRelief, voxelMesh, voxelPlace, type Column, type Tris } from './vie';

type Any = any;
const w = window as Any;

interface Installed {
  meshes: Array<{ group: Any; mesh: Any; hidden: Any[] }>;
  tick?: Any;
  timer?: number;
}
let now: Installed | undefined;
let way: string | undefined;

/** The page's three.js classes, from a ground mesh of the game. */
function classes() {
  const v = w.view;
  for (const tv of v.chunks.values()) {
    const g = tv.group.children[0];
    if (g?.isMesh && g.geometry?.getAttribute('part')) {
      return {
        Mesh: g.constructor,
        Geometry: g.geometry.constructor,
        Floats: g.geometry.getAttribute('position').constructor,
        Bytes: g.geometry.getAttribute('part').constructor,
        material: g.material,
        userData: { ...g.userData },
      };
    }
  }
  throw new Error('nessun luogo disegnato');
}

function geometryOf(t: Tris, X0: number, Z0: number, C: ReturnType<typeof classes>): Any {
  const pos = new Float32Array(t.pos.length);
  for (let i = 0; i < t.pos.length; i += 3) {
    pos[i] = t.pos[i] - X0;
    pos[i + 1] = t.pos[i + 1];
    pos[i + 2] = t.pos[i + 2] - Z0;
  }
  const g = new C.Geometry();
  g.setAttribute('position', new C.Floats(pos, 3));
  g.setAttribute('normal', new C.Floats(new Float32Array(t.nor), 3));
  g.setAttribute('color', new C.Floats(new Float32Array(t.col), 3));
  g.setAttribute('part', new C.Bytes(new Uint8Array(t.prt), 1));
  g.computeBoundingSphere();
  return g;
}

/** The place with the most relief within `r` places of the wanderer, sampled every third tile. */
export function where(r = 12): { cx: number; cy: number; span: number } {
  const k = w.quine;
  const S = k.config.chunkSize, seed = k.config.seed, sea = k.seaLevel;
  const p = k.wandererCarpet();
  const pcx = Math.floor(p.x / S), pcy = Math.floor(p.y / S);
  let best = { cx: pcx, cy: pcy, span: -1 };
  for (let cy = pcy - r; cy <= pcy + r; cy++)
    for (let cx = pcx - r; cx <= pcx + r; cx++) {
      let lo = Infinity, hi = -Infinity;
      for (let y = 0; y < S; y += 3)
        for (let x = 0; x < S; x += 3) {
          const t = trueRelief(cx * S + x, cy * S + y, seed, (c, rr) => k.relief.level(c, rr), 'g', sea);
          lo = Math.min(lo, t.level);
          hi = Math.max(hi, t.level);
        }
      if (hi - lo > best.span) best = { cx, cy, span: hi - lo };
    }
  return best;
}

/** The meshes of one loaded place in a way, with the time it took to make them. */
function placeMeshes(ch: Any, mode: string): { tris: Tris; ms: { make: number; mesh: number } } {
  const k = w.quine;
  const S = k.config.chunkSize, seed = k.config.seed, sea = k.seaLevel;
  const code = (c: number, r: number) => k.tileAt(c, r) ?? 'g';
  const hills = (c: number, r: number) => k.relief.level(c, r);
  const cache = new Map<number, ReturnType<typeof trueRelief>>();
  const tr = (c: number, r: number) => {
    const key = (c + 0x8000) * 0x10000 + (r + 0x8000);
    let t = cache.get(key);
    if (!t) cache.set(key, (t = trueRelief(c, r, seed, hills, code(c, r), sea)));
    return t;
  };
  const t0 = performance.now();
  if (mode === 'columns') {
    const strata = strataMj(ch.tiles, S, 6, seed + ch.cx * 31 + ch.cy, 1).grid;
    const strataAt = (col: number, row: number, depth: number) => {
      const c = col - ch.cx * S, r = row - ch.cy * S;
      if (c < 0 || r < 0 || c >= S || r >= S) return undefined;
      return strata.alphabet[strata.cells[c + r * S + (strata.Z - 2 - Math.min(5, depth)) * S * S]];
    };
    const t1 = performance.now();
    const colour = (c: string) => k.palette[c]?.color ?? TERRAIN_PALETTE[c]?.color;
    const tris = columnsMesh(S, ch.cx, ch.cy, (c, r) => tr(c, r).level, code, colour, strataAt, 6);
    return { tris, ms: { make: t1 - t0, mesh: performance.now() - t1 } };
  }
  const r = mode === 'voxels4' ? 4 : 2;
  const columnsAt = (x: number, y: number): Column => {
    const col = ch.cx * S + Math.floor(x / r), row = ch.cy * S + Math.floor(y / r);
    const t = tr(col, row);
    const vox = (lv: number) => Math.round(lv * LEVEL * r);
    return { ground: vox(t.level), water: t.surface !== undefined ? vox(t.surface) : undefined, letter: surfaceLetter(code(col, row)) };
  };
  const made = voxelPlace(S, r, columnsAt, seed + ch.cx * 31 + ch.cy, 4, false);
  const t1 = performance.now();
  const outside = (x: number, y: number, z: number) => z + made.base < columnsAt(x, y).ground;
  const tris = voxelMesh(made.grid, r, ch.cx * S, ch.cy * S, made.base, TERRAIN_PALETTE, outside, true);
  return { tris, ms: { make: t1 - t0, mesh: performance.now() - t1 } };
}

/** The loaded places in a way: the game's ground of each hidden, the way's mesh beside it. */
export function ground(mode: 'columns' | 'voxels2' | 'voxels4'): Any {
  restore();
  way = mode;
  const k = w.quine, v = w.view;
  const C = classes();
  const inst: Installed = { meshes: [] };
  now = inst;
  const make: number[] = [], mesh: number[] = [];
  let tris = 0, bytes = 0, places = 0;
  const put = (tv: Any, ch: Any) => {
    const S = k.config.chunkSize;
    const made = placeMeshes(ch, mode);
    make.push(made.ms.make);
    mesh.push(made.ms.mesh);
    tris += made.tris.triangles;
    bytes += made.tris.bytes;
    places++;
    const m = new C.Mesh(geometryOf(made.tris, ch.cx * S, ch.cy * S, C), C.material);
    Object.assign(m.userData, C.userData, { t459: true });
    m.receiveShadow = true;
    // The game's ground of the place (its tops and sides) goes; water, walls, trees and rocks stay.
    const hidden = [tv.group.children[0]].filter(Boolean);
    for (const h of hidden) h.visible = false;
    tv.group.add(m);
    inst.meshes.push({ group: tv.group, mesh: m, hidden });
  };
  for (const ch of k.chunks.values()) {
    const tv = v.chunks.get(ch.key);
    if (tv) put(tv, ch);
  }
  // A place the renderer builds again (its models arrived) loses the way's mesh: put it back.
  inst.timer = window.setInterval(() => {
    if (now !== inst) return;
    for (const ch of k.chunks.values()) {
      const tv = v.chunks.get(ch.key);
      if (tv && !tv.group.children.some((o: Any) => o.userData?.t459)) put(tv, ch);
    }
  }, 500);
  const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
  return { mode, places, triangles: tris, bytes, makeMs: { median: sorted(make)[make.length >> 1], max: Math.max(...make) }, meshMs: { median: sorted(mesh)[mesh.length >> 1], max: Math.max(...mesh) } };
}

/**
 * The automata on the loaded window: the water as virtual pipes, a cell a tile, a step every tick (the bed from the true relief, the
 * sea a source, a spring at the window's highest water); the wind as a lattice Boltzmann, a cell every 3 tiles, a step every 6 ticks; the
 * water's surface as a mesh whose heights follow the pipes every tick. Their time goes into the measuring tool's tick (`kernel: automi`).
 */
export function automata(on: boolean): Any {
  restore();
  if (!on) return { on: false };
  const k = w.quine, v = w.view;
  const C = classes();
  const S = k.config.chunkSize, seed = k.config.seed, sea = k.seaLevel;
  const keys = [...k.chunks.values()];
  const x0 = Math.min(...keys.map((c: Any) => c.cx)) * S, y0 = Math.min(...keys.map((c: Any) => c.cy)) * S;
  const W = (Math.max(...keys.map((c: Any) => c.cx)) + 1) * S - x0, H = (Math.max(...keys.map((c: Any) => c.cy)) + 1) * S - y0;
  const water = new PipesWater(W, H, 1);
  water.sea = sea * LEVEL;
  const wind = new LbmWind(Math.ceil(W / 3), Math.ceil(H / 3), 3);
  let spring = -1, springTop = -Infinity;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const code = k.tileAt(x0 + x, y0 + y) ?? 'g';
      const t = trueRelief(x0 + x, y0 + y, seed, (c: number, r: number) => k.relief.level(c, r), code, sea);
      const i = y * W + x;
      water.bed[i] = t.level * LEVEL;
      if (t.surface !== undefined) {
        water.depth[i] = (t.surface - t.level) * LEVEL;
        if (code === 'o') water.source[i] = 1;
        else if (t.surface > springTop) [spring, springTop] = [i, t.surface];
      }
      if (x % 3 === 0 && y % 3 === 0) wind.solid[(y / 3) * wind.W + x / 3] = t.level * LEVEL > sea * LEVEL + 3 ? 1 : 0;
    }
  // The surface: a vertex at every corner of a tile, its height the water's around it (where there is any).
  const pos = new Float32Array((W + 1) * (H + 1) * 3);
  for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) pos.set([x, -10, y], (y * (W + 1) + x) * 3);
  const index: number[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const a = y * (W + 1) + x;
      index.push(a, a + W + 1, a + 1, a + 1, a + W + 1, a + W + 2);
    }
  const g = new C.Geometry();
  const posAttr = new C.Floats(pos, 3);
  g.setAttribute('position', posAttr);
  g.setAttribute('normal', new C.Floats(new Float32Array((W + 1) * (H + 1) * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('color', new C.Floats(new Float32Array((W + 1) * (H + 1) * 3).map((_, i) => [0.05, 0.2, 0.6][i % 3]), 3));
  g.setAttribute('part', new C.Bytes(new Uint8Array((W + 1) * (H + 1)).fill(5), 1));
  g.setIndex(index);
  const mesh = new C.Mesh(g, C.material);
  Object.assign(mesh.userData, C.userData, { t459: true });
  mesh.frustumCulled = false;
  const group = v.world;
  const holder = new (group.constructor as Any)();
  holder.position.set(x0, 0, y0);
  holder.add(mesh);
  group.add(holder);
  const inst: Installed = { meshes: [{ group, mesh: holder, hidden: [] }] };
  now = inst;
  way = 'automata';
  const surface = () => {
    for (let y = 0; y <= H; y++)
      for (let x = 0; x <= W; x++) {
        let h = 0, n = 0;
        for (const [dx, dy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const i = yy * W + xx;
          if (water.depth[i] > 0.05) {
            h += water.bed[i] + water.depth[i];
            n++;
          }
        }
        pos[(y * (W + 1) + x) * 3 + 1] = n ? h / n - 0.18 : -10;
      }
    posAttr.needsUpdate = true;
  };
  const tick = k.tick;
  let ticks = 0;
  k.tick = function (...a: Any[]) {
    const out = tick.apply(this, a);
    const m = w.__misura;
    const t0 = performance.now();
    if (spring >= 0) water.depth[spring] += 0.05;
    water.step(1 / 60);
    if (ticks++ % 6 === 0) wind.step();
    surface();
    const el = performance.now() - t0;
    if (m?.cur) {
      m.cur.parts['kernel: automi (T459)'] = (m.cur.parts['kernel: automi (T459)'] ?? 0) + el;
      m.cur.tick += el;
    }
    return out;
  };
  inst.tick = tick;
  return { on: true, cells: W * H, windCells: wind.n, surfaceVertices: (W + 1) * (H + 1), x0, y0, W, H };
}

/** The game's ground again, the automata off. */
export function restore(): void {
  const inst = now;
  now = undefined;
  way = undefined;
  if (!inst) return;
  if (inst.timer) window.clearInterval(inst.timer);
  if (inst.tick) w.quine.tick = inst.tick;
  for (const { group, mesh, hidden } of inst.meshes) {
    group.remove(mesh);
    mesh.traverse?.((o: Any) => o.geometry?.dispose?.());
    for (const h of hidden) h.visible = true;
  }
}

w.__t459 = { where, ground, automata, restore, get way() { return way; } };
