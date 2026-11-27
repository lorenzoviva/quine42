// T509: roads, sidewalks and rails as the study proposes them (docs/design/terreno-ricco.md § 3), drawn in the page beside the game's
// ground for a photo (`node lab/scripts/misura-frame.mjs <port> --strade <universo> --foto <cartella>`). Nothing of the game changes: the
// sidewalks get a slab of `curb` tiles (the same look as a road `curb` lower: the inset of § 3.2, a curb where they meet), the rails two
// steel bars and the sleepers along the line their neighbours draw (the aligned model of § 3.4), with the ground's material and ink.
//
//   window.__t509s.score()        the loaded places by how much of the road and rails they show (rail tiles, sidewalk-road edges)
//   window.__t509s.focus(key)     where to look in a place: the middle of its rails, else of its curbs
//   window.__t509s.street({ curb }) the slabs and the rails on every loaded place
//   window.__t509s.restore()

type Any = any;
const w = window as Any;
const SIDEWALK = /marciapied|banchin/i;
const ROAD = /strad|asfalt|carreggiat|parchegg/i;
const RAILS = /binar|rotai|ferrovi/i;
let added: Array<{ parent: Any; obj: Any }> = [];

const kind = (code: string | undefined): 'sidewalk' | 'road' | 'rails' | undefined => {
  const n = code ? w.quine.palette[code]?.name ?? '' : '';
  return RAILS.test(n) ? 'rails' : SIDEWALK.test(n) ? 'sidewalk' : ROAD.test(n) ? 'road' : undefined;
};

function rgb(hex: string, k = 1): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(((n >> 16) & 255) / 255) * k, (((n >> 8) & 255) / 255) * k, ((n & 255) / 255) * k];
}

class Boxes {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  part: number[] = [];
  quad(a: number[], b: number[], c: number[], d: number[], n: number[], color: number[], part: number): void {
    for (const p of [a, b, c, a, c, d]) {
      this.pos.push(p[0]!, p[1]!, p[2]!);
      this.nor.push(n[0]!, n[1]!, n[2]!);
      this.col.push(color[0]!, color[1]!, color[2]!);
      this.part.push(part);
    }
  }
  /** A box without its bottom; `sides` false: only the top (a slab whose sides another slab hides is drawn by its neighbours' test). */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: number[], part: number, sides = [true, true, true, true]): void {
    const dark = c.map((v) => v * 0.78);
    this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], c, part);
    if (sides[0]) this.quad([x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [x1, y0, z0], [1, 0, 0], dark, part);
    if (sides[1]) this.quad([x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [-1, 0, 0], dark, part);
    if (sides[2]) this.quad([x1, y1, z1], [x0, y1, z1], [x0, y0, z1], [x1, y0, z1], [0, 0, 1], dark, part);
    if (sides[3]) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0], [0, 0, -1], dark, part);
  }
}

export function score(): Array<{ key: string; rails: number; edges: number; name?: string }> {
  const k = w.quine;
  const S = k.config.chunkSize;
  const out: Array<{ key: string; rails: number; edges: number; name?: string }> = [];
  for (const ch of k.chunks.values()) {
    let rails = 0, edges = 0;
    for (let r = 0; r < S; r++)
      for (let c = 0; c < S; c++) {
        const a = kind(ch.tiles[r * S + c]);
        if (a === 'rails') rails++;
        if (a === 'sidewalk' && c + 1 < S && kind(ch.tiles[r * S + c + 1]) === 'road') edges++;
        if (a === 'sidewalk' && r + 1 < S && kind(ch.tiles[(r + 1) * S + c]) === 'road') edges++;
        if (a === 'road' && c + 1 < S && kind(ch.tiles[r * S + c + 1]) === 'sidewalk') edges++;
        if (a === 'road' && r + 1 < S && kind(ch.tiles[(r + 1) * S + c]) === 'sidewalk') edges++;
      }
    out.push({ key: ch.key, rails, edges, name: ch.place?.name });
  }
  return out.sort((a, b) => b.rails * 4 + b.edges - (a.rails * 4 + a.edges));
}

/** Where to look in a place: the middle of its rails, else of the edges between sidewalk and road (world tiles). */
export function focus(key: string): { x: number; y: number } | undefined {
  const k = w.quine;
  const S = k.config.chunkSize;
  const ch = k.chunks.get(key);
  if (!ch) return undefined;
  const pick = (want: (c: number, r: number) => boolean) => {
    let sx = 0, sy = 0, n = 0;
    for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) if (want(c, r)) (sx += c, sy += r, n++);
    return n ? { x: ch.cx * S + sx / n + 0.5, y: ch.cy * S + sy / n + 0.5 } : undefined;
  };
  return pick((c, r) => kind(ch.tiles[r * S + c]) === 'rails') ?? pick((c, r) => kind(ch.tiles[r * S + c]) === 'sidewalk' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => kind(ch.tiles[(r + dy!) * S + c + dx!]) === 'road'));
}

export function street(o: { curb?: number } = {}): Any {
  restore();
  const k = w.quine, v = w.view;
  const S = k.config.chunkSize;
  const curb = o.curb ?? 0.12;
  const steel = rgb('#a7adb3'), wood = rgb('#5b4330');
  let slabs = 0, rails = 0, tris = 0;
  const at = (x: number, z: number) => kind(k.tileAt(x, z));
  for (const ch of k.chunks.values()) {
    const tv = v.chunks.get(ch.key);
    if (!tv) continue;
    const ground = tv.group.children[0];
    const X0 = ch.cx * S, Z0 = ch.cy * S;
    const b = new Boxes();
    for (let r = 0; r < S; r++)
      for (let c = 0; c < S; c++) {
        const x = X0 + c, z = Z0 + r;
        const here = at(x, z);
        if (here === 'sidewalk') {
          const g = k.groundAt(x, z);
          const col = rgb(k.palette[k.tileAt(x, z)].color, 1.04);
          // A side only where the neighbour is not a sidewalk too: the curb.
          const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => at(x + dx!, z + dz!) !== 'sidewalk');
          b.box(c, g, r, c + 1, g + curb, r + 1, col, 9, side);
          slabs++;
        } else if (here === 'rails') {
          const g = k.groundAt(x, z);
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => at(x + dx!, z + dz!) === 'rails');
          const arms = dirs.length ? dirs : [[1, 0], [-1, 0]];
          if (dirs.length === 1) arms.push([-dirs[0]![0]!, -dirs[0]![1]!]);
          for (const [dx, dz] of arms) {
            // From the middle of the tile to its edge: sleepers across, two bars along.
            const cx = c + 0.5, cz = r + 0.5;
            for (let t = 0.125; t < 0.5; t += 0.25) {
              const sx = cx + dx! * t, sz = cz + dz! * t;
              if (dx) b.box(sx - 0.06, g, sz - 0.36, sx + 0.06, g + 0.05, sz + 0.36, wood, 11);
              else b.box(sx - 0.36, g, sz - 0.06, sx + 0.36, g + 0.05, sz + 0.06, wood, 11);
            }
            const ex = cx + dx! * 0.5, ez = cz + dz! * 0.5;
            for (const off of [-0.24, 0.24]) {
              if (dx) b.box(Math.min(cx, ex), g + 0.05, cz + off - 0.03, Math.max(cx, ex), g + 0.11, cz + off + 0.03, steel, 10);
              else b.box(cx + off - 0.03, g + 0.05, Math.min(cz, ez), cx + off + 0.03, g + 0.11, Math.max(cz, ez), steel, 10);
            }
          }
          rails++;
        }
      }
    if (!b.pos.length) continue;
    const C = ground.constructor, G = ground.geometry.constructor, F = ground.geometry.getAttribute('position').constructor;
    const g = new G();
    g.setAttribute('position', new F(new Float32Array(b.pos), 3));
    g.setAttribute('normal', new F(new Float32Array(b.nor), 3));
    g.setAttribute('color', new F(new Float32Array(b.col), 3));
    g.setAttribute('part', new F(new Uint8Array(b.part), 1));
    g.computeBoundingSphere();
    const m = new C(g, ground.material);
    m.receiveShadow = true;
    m.castShadow = true;
    Object.assign(m.userData, ground.userData, { t509: true });
    tv.group.add(m);
    added.push({ parent: tv.group, obj: m });
    tris += b.pos.length / 9;
  }
  return { slabs, rails, tris };
}

export function restore(): void {
  for (const { parent, obj } of added) {
    parent.remove(obj);
    obj.geometry?.dispose?.();
  }
  added = [];
}

w.__t509s = { score, focus, street, restore };
