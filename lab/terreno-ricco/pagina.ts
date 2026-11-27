// T509: the undergrowth in the page, for the frame (`node lab/scripts/misura-frame.mjs <port> --sottobosco`). Bundled by esbuild into a
// script the measuring tool evaluates in the page (the cover programs of lab/terreno-ricco/modelli/ inlined as text, `?raw`); nothing of the game
// changes: the instances are put beside the game's, with its classes (taken from a tree of the terrains already drawn), its swaying
// material (the wind of T484 bends them as it bends the trees), its shadows and its ink, so what is drawn costs what the game's would.
//
//   window.__t509.prepare()             the cover programs through the engine, four seeds each: the geometries (and how long it took)
//   window.__t509.cover({ way, perTile, shadow, ink })
//        way 'chunk'   one InstancedMesh per form and per loaded place (as the terrains' models are today)
//            'window'  one InstancedMesh per form for every loaded place
//            'merged'  one mesh per place, the instances baked into its vertices
//        perTile       instances per tile of walkable ground (not paths, roads, rails, lots)
//        shadow        whether they cast shadows; ink 'thing' (an outline round every tuft, as a tree) or 'ground' (one with the ground)
//   window.__t509.restore()             the game as it was

import { runForm } from '../../src/kernel/forms';
import { formMeshes } from '../../src/render/formmeshes';
import ciuffo from './modelli/ciuffo-erba.xml?raw';
import foglie from './modelli/foglie-secche.xml?raw';
import sassolini from './modelli/sassolini.xml?raw';
import arbusto from './modelli/arbusto.xml?raw';
import spighe from './modelli/spighe.xml?raw';

type Any = any;
const w = window as Any;
const SEEDS = 4;
const PROGRAMS: Record<string, string> = { ciuffo, foglie, sassolini, arbusto, spighe };
/** What grows on which ground, by the base code (the names change by universe, the codes keep their meaning). */
const MIX: Record<string, Array<[string, number]>> = {
  g: [['ciuffo', 0.6], ['foglie', 0.15], ['sassolini', 0.1], ['arbusto', 0.15]],
  s: [['sassolini', 1]],
  n: [['sassolini', 1]],
  u: [['spighe', 1]],
  e: [['ciuffo', 1]],
  x: [['foglie', 0.7], ['ciuffo', 0.3]],
};
const ROADISH = /strad|asfalt|marciapied|binar|parchegg|pista|selciat|lastric|carreggiat|rotai|ferrovi|banchin|sentier/i;

interface Geo {
  geo: Any;
  tris: number;
  mesh: Any;
}
let geos: Record<string, Geo[]> | undefined;
let C: ReturnType<typeof classes> | undefined;
let added: Array<{ parent: Any; obj: Any }> = [];

function hash32(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** The page's three.js classes and the trees' material, shadow and ink, from an instanced tree of a drawn place. */
function classes() {
  const v = w.view;
  for (const tv of v.chunks.values())
    for (const o of tv.group.children)
      if (o.isInstancedMesh) {
        const ground = tv.group.children[0];
        return {
          Instanced: o.constructor,
          Mesh: ground.constructor,
          Geometry: o.geometry.constructor,
          Floats: o.geometry.getAttribute('position').constructor,
          Index: o.geometry.index.constructor,
          material: Array.isArray(o.material) ? o.material[0] : o.material,
          depth: o.customDepthMaterial,
          userData: { ...o.userData },
          groundInk: ground.userData.inkThing,
        };
      }
  throw new Error('nessun albero dei terreni disegnato: serve un luogo con un bosco');
}

function geometryOf(m: Any): Any {
  const g = new C!.Geometry();
  g.setAttribute('position', new C!.Floats(m.positions, 3));
  g.setAttribute('normal', new C!.Floats(m.normals, 3));
  g.setAttribute('color', new C!.Floats(m.colors, 3));
  if (m.sway) g.setAttribute('sway', new C!.Floats(m.sway, 1));
  if (m.part) g.setAttribute('part', new C!.Floats(m.part, 1));
  g.setIndex(new C!.Index(m.indices, 1));
  g.computeBoundingSphere();
  return g;
}

export function prepare(): Any {
  C = classes();
  const t0 = performance.now();
  geos = {};
  let tris = 0;
  for (const [id, xml] of Object.entries(PROGRAMS)) {
    geos[id] = [];
    for (let s = 1; s <= SEEDS; s++) {
      const req = { xml, seed: s, vpt: 20, sway: true, model: `t509-${id}` };
      const m = formMeshes(runForm(req), req).body;
      geos[id]!.push({ geo: geometryOf(m), tris: m.indices.length / 3, mesh: m });
      tris += m.indices.length / 3;
    }
  }
  return { ms: Math.round(performance.now() - t0), forms: Object.keys(PROGRAMS).length * SEEDS, meanTris: Math.round(tris / (Object.keys(PROGRAMS).length * SEEDS)) };
}

interface Inst {
  kind: string;
  seed: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
}

/** The instances of a loaded place: on its walkable ground, never on paths, roads, rails or lots; the same at every load (a hash). */
function instancesOf(ch: Any, perTile: number): Inst[] {
  const k = w.quine;
  const S = k.config.chunkSize;
  const lot = new Set<number>();
  for (const l of ch.lots ?? []) for (let r = l.y0; r <= l.y1; r++) for (let c = l.x0; c <= l.x1; c++) lot.add(r * S + c);
  const out: Inst[] = [];
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      if (lot.has(r * S + c)) continue;
      const code = ch.tiles[r * S + c];
      const t = k.palette[code];
      if (!t || t.solid || (t.layer ?? 'ground') !== 'ground' || code === 'p' || ROADISH.test(t.name ?? '')) continue;
      const mix = MIX[code] ?? MIX.g!;
      const x = ch.cx * S + c, z = ch.cy * S + r;
      const h = hash32(x, z, 911);
      const n = Math.floor(perTile) + ((h & 1023) / 1024 < perTile % 1 ? 1 : 0);
      const y = k.groundAt(x, z);
      for (let i = 0; i < n; i++) {
        const q = hash32(x, z, 913 + i);
        let u = ((q >>> 20) & 1023) / 1024, kind = mix[0]![0];
        for (const [id, wgt] of mix) {
          if (u < wgt) {
            kind = id;
            break;
          }
          u -= wgt;
        }
        out.push({ kind, seed: (q >>> 3) % SEEDS, x: x + 0.12 + ((q & 255) / 255) * 0.76, y, z: z + 0.12 + (((q >>> 8) & 255) / 255) * 0.76, yaw: ((q >>> 11) % 628) / 100, scale: 0.8 + ((q >>> 17) % 40) / 100 });
      }
    }
  return out;
}

function matrixInto(a: Float32Array, o: number, i: Inst, dx: number, dz: number): void {
  const c = Math.cos(i.yaw) * i.scale, s = Math.sin(i.yaw) * i.scale;
  a.set([c, 0, -s, 0, 0, i.scale, 0, 0, s, 0, c, 0, i.x - dx, i.y, i.z - dz, 1], o);
}

function dress(o: Any, shadow: boolean, ink: string): Any {
  o.castShadow = shadow;
  o.receiveShadow = true;
  if (shadow && C!.depth) o.customDepthMaterial = C!.depth;
  Object.assign(o.userData, C!.userData, { t509: true });
  if (ink === 'ground') o.userData.inkThing = C!.groundInk;
  return o;
}

function instanced(list: Inst[], form: Geo, shadow: boolean, ink: string, dx: number, dz: number): Any {
  const im = new C!.Instanced(form.geo, C!.material, list.length);
  const a = im.instanceMatrix.array as Float32Array;
  list.forEach((i, n) => matrixInto(a, n * 16, i, dx, dz));
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  return dress(im, shadow, ink);
}

/** One mesh with every instance of a place baked in (positions and normals turned, the sway and colours copied). */
function merged(list: Inst[], shadow: boolean, ink: string, dx: number, dz: number): { mesh: Any; tris: number } {
  let V = 0, I = 0;
  for (const i of list) {
    const m = geos![i.kind]![i.seed]!.mesh;
    V += m.positions.length / 3;
    I += m.indices.length;
  }
  const pos = new Float32Array(V * 3), nor = new Float32Array(V * 3), col = new Float32Array(V * 3), sway = new Float32Array(V), part = new Uint8Array(V);
  const idx = new Uint32Array(I);
  let v = 0, ii = 0;
  for (const i of list) {
    const m = geos![i.kind]![i.seed]!.mesh;
    const c = Math.cos(i.yaw), s = Math.sin(i.yaw), k = i.scale;
    const n = m.positions.length / 3;
    for (let j = 0; j < n; j++) {
      const x = m.positions[j * 3], y = m.positions[j * 3 + 1], z = m.positions[j * 3 + 2];
      pos[(v + j) * 3] = (c * x + s * z) * k + i.x - dx;
      pos[(v + j) * 3 + 1] = y * k + i.y;
      pos[(v + j) * 3 + 2] = (-s * x + c * z) * k + i.z - dz;
      const nx = m.normals[j * 3], ny = m.normals[j * 3 + 1], nz = m.normals[j * 3 + 2];
      nor[(v + j) * 3] = c * nx + s * nz;
      nor[(v + j) * 3 + 1] = ny;
      nor[(v + j) * 3 + 2] = -s * nx + c * nz;
      col[(v + j) * 3] = m.colors[j * 3];
      col[(v + j) * 3 + 1] = m.colors[j * 3 + 1];
      col[(v + j) * 3 + 2] = m.colors[j * 3 + 2];
      sway[v + j] = m.sway ? m.sway[j] : 0;
      part[v + j] = m.part ? m.part[j] : 0;
    }
    for (let j = 0; j < m.indices.length; j++) idx[ii + j] = m.indices[j] + v;
    v += n;
    ii += m.indices.length;
  }
  const g = new C!.Geometry();
  g.setAttribute('position', new C!.Floats(pos, 3));
  g.setAttribute('normal', new C!.Floats(nor, 3));
  g.setAttribute('color', new C!.Floats(col, 3));
  g.setAttribute('sway', new C!.Floats(sway, 1));
  g.setAttribute('part', new C!.Floats(part, 1));
  g.setIndex(new C!.Index(idx, 1));
  g.computeBoundingSphere();
  return { mesh: dress(new C!.Mesh(g, C!.material), shadow, ink), tris: I / 3 };
}

export function cover(o: { way: 'chunk' | 'window' | 'merged'; perTile: number; shadow?: boolean; ink?: 'thing' | 'ground' }): Any {
  restore();
  if (!geos) prepare();
  const k = w.quine, v = w.view;
  const S = k.config.chunkSize;
  const t0 = performance.now();
  let instances = 0, tris = 0, objects = 0, bytes = 0;
  const shadow = !!o.shadow, ink = o.ink ?? 'thing';
  const byForm = new Map<string, Inst[]>();
  let parent: Any;
  for (const ch of k.chunks.values()) {
    const tv = v.chunks.get(ch.key);
    // Drafts too: their tiles are drawn, and the window is what the camera sees.
    if (!tv) continue;
    parent ??= tv.group.parent;
    const list = instancesOf(ch, o.perTile);
    instances += list.length;
    const X0 = ch.cx * S, Z0 = ch.cy * S;
    if (o.way === 'merged') {
      if (!list.length) continue;
      const m = merged(list, shadow, ink, X0, Z0);
      tv.group.add(m.mesh);
      added.push({ parent: tv.group, obj: m.mesh });
      tris += m.tris;
      objects++;
      const g = m.mesh.geometry;
      bytes += g.index.array.byteLength + Object.values(g.attributes).reduce((n: number, at: Any) => n + at.array.byteLength, 0);
      continue;
    }
    for (const i of list) {
      const key = `${i.kind}#${i.seed}`;
      const target = o.way === 'chunk' ? `${ch.key}|${key}` : key;
      (byForm.get(target) ?? byForm.set(target, []).get(target)!).push(i);
      tris += geos![i.kind]![i.seed]!.tris;
    }
  }
  for (const [target, list] of byForm) {
    const [where, key] = o.way === 'chunk' ? target.split('|') : [undefined, target];
    const [kind, seed] = key!.split('#');
    const form = geos![kind!]![Number(seed)]!;
    if (o.way === 'chunk') {
      const ch = k.chunks.get(where);
      const tv = v.chunks.get(where);
      const im = instanced(list, form, shadow, ink, ch.cx * S, ch.cy * S);
      tv.group.add(im);
      added.push({ parent: tv.group, obj: im });
    } else {
      const im = instanced(list, form, shadow, ink, 0, 0);
      parent.add(im);
      added.push({ parent, obj: im });
    }
    objects++;
    bytes += list.length * 64;
  }
  return { ...o, instances, tris, objects, bytes: Math.round(bytes), ms: Math.round(performance.now() - t0) };
}

export function restore(): void {
  for (const { parent, obj } of added) {
    parent.remove(obj);
    if (!obj.isInstancedMesh) obj.geometry?.dispose?.();
    else obj.dispose?.();
  }
  added = [];
}

w.__t509 = { prepare, cover, restore };
