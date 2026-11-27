// The mesh of the places in a worker (T486, the point 3 of T331): the worker makes a place's arrays from a copy of what its mesh reads of the
// kernel (`chunkInput`), and the meshes made of them are the page's (`buildChunk`, which reads the kernel itself) byte for byte: every
// attribute, the instances' matrices, the order of the children, materials, shadows. With the terrains' models ready and without them,
// on water whose waves read the corners beyond the place's far edge, over the void, over the holes of cellars (whole tiles and sub-cells, on
// the place and across its edge). The copy goes as `postMessage` sends it (`structuredClone`), the arrays come back as it gives them
// (transferred). The worker is one at a time a place, forgets what is of a world before, and is given up when it stops or does not answer.

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Kernel, type Chunk } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { HOLE_CELLS, InlineRunner, runForm, type FormRequest, type FormResult, type FormRunner, type TileHole } from '../src/kernel/forms';
import { formMeshes } from '../src/render/formmeshes';
import { buildChunk, chunkInput, chunkSig, chunkView, Builder } from '../src/render/terrain';
import { answerChunk, CHUNK_MARGIN, chunkArrays, inputSource, MeshBuilder, type ChunkAnswer, type ChunkInput } from '../src/render/terrainmesh';
import { ChunkMesher } from '../src/render/chunkmesher';

const digest = (a: ArrayBufferView) => createHash('sha256').update(new Uint8Array(a.buffer, a.byteOffset, a.byteLength)).digest('hex');

/** What a place's group is, line by line: each child in order, what it is and draws with, every attribute's bytes, the instances. */
function print(group: THREE.Group): string[] {
  const out = [`group at ${group.position.toArray().join(',')}`];
  group.children.forEach((o, n) => {
    const m = o as THREE.Mesh;
    const mats = (Array.isArray(m.material) ? m.material : [m.material]).map((x) => x.uuid).join('+');
    out.push(`${n} ${o.type} ${mats} cast=${m.castShadow} receive=${m.receiveShadow} order=${o.renderOrder} ${JSON.stringify(o.userData)} depth=${m.customDepthMaterial?.uuid}`);
    if (o instanceof THREE.InstancedMesh) {
      out.push(`${n} instances ${o.count} ${digest(o.instanceMatrix.array as Float32Array)} geometry ${o.geometry.uuid} sphere ${o.boundingSphere?.center.toArray()} ${o.boundingSphere?.radius}`);
      return;
    }
    const g = m.geometry;
    for (const [name, a] of Object.entries(g.attributes)) {
      const at = a as THREE.BufferAttribute;
      out.push(`${n} ${name} ${at.itemSize} ${at.normalized} ${at.array.constructor.name} ${at.count} ${digest(at.array as ArrayBufferView)}`);
    }
    out.push(`${n} index ${g.index ? digest(g.index.array as ArrayBufferView) : '-'} groups ${g.groups.length} sphere ${g.boundingSphere?.center.toArray()} ${g.boundingSphere?.radius}`);
  });
  return out;
}

/** A place's meshes as the worker makes them: the copy cloned as `postMessage` clones it, the arrays transferred back. */
function throughWorker(k: Kernel, ch: Chunk): THREE.Group {
  const sent = structuredClone(chunkInput(k, ch));
  const { answer, transfer } = answerChunk(7, sent);
  if (!answer.ok) throw new Error(answer.error);
  const back = structuredClone(answer, { transfer });
  // What was transferred is the page's now: the worker's buffers are gone.
  for (const b of transfer) expect(b.byteLength).toBe(0);
  return chunkView(k, ch, back.arrays, chunkSig(k, ch))!.group;
}

/** The terrains' models (trees, rocks) with their meshes, as the browser's worker makes them: in Node a form has only its grid. */
const TERRAIN_MODELS = new Set(
  Object.values(JSON.parse(bundledFiles['modules/world.terrain/manifest.json']!).tiles as Record<string, { model?: string }>).flatMap((t) => (t.model ? [t.model] : [])),
);
class Meshing implements FormRunner {
  private inline = new InlineRunner();
  async run(q: FormRequest): Promise<FormResult> {
    if (!q.model || !TERRAIN_MODELS.has(q.model)) return this.inline.run(q);
    const r = runForm(q);
    const { model: _m, finished: _f, ...result } = r;
    return { ...result, meshes: formMeshes(r, q) };
  }
}

async function world() {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), forms: new Meshing() });
  for (let i = 0; i < 400 && ![...k.chunks.values()].every((c) => c.stage === 'planned' || c.held); i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 5));
  }
  k.tick(1 / 60);
  return k;
}

const same = (k: Kernel, ch: Chunk, what: string) => expect(print(throughWorker(k, ch)), `${what} ${ch.key}`).toEqual(print(buildChunk(k, ch).group));

describe('the mesh of the places in a worker (T486)', () => {
  it('is the page’s byte for byte: with the models of the terrains and without, on the water, over the void, over the holes', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const chunks = [...k.chunks.values()];
    expect(chunks.length).toBeGreaterThan(8);
    // While the forms are being made, then with every model of the terrains ready (trees and rocks as instances), then without them (the stand-ins).
    for (const ch of chunks) same(k, ch, 'all’inizio');
    expect(TERRAIN_MODELS.size).toBeGreaterThan(1);
    for (const t of Object.values(k.palette)) if (t.model) for (let s = 1; s <= k.forms.seedsOf(t.model); s++) await k.forms.wait(t.model, s);
    k.tick(1 / 60);
    let instanced = 0;
    for (const ch of chunks) {
      same(k, ch, 'coi modelli');
      instanced += buildChunk(k, ch).group.children.filter((o) => o instanceof THREE.InstancedMesh).length;
    }
    expect(instanced).toBeGreaterThan(0);
    const kept = Object.entries(k.palette).filter(([, t]) => t.model).map(([code, t]) => [code, t.model] as const);
    for (const [code] of kept) delete k.palette[code]!.model;
    try {
      for (const ch of chunks) same(k, ch, 'senza i modelli');
    } finally {
      for (const [code, model] of kept) k.palette[code]!.model = model;
    }

    // Water all around a place with an islet in it: its waves read the tiles two beyond its far edges (`CHUNK_MARGIN`), the foam the shore.
    const liquid = Object.keys(k.palette).find((c) => k.palette[c]!.layer === 'liquid')!;
    const land = Object.keys(k.palette).find((c) => k.palette[c]!.layer === 'ground' && !k.palette[c]!.solid)!;
    const mid = chunks.find((c) => [-1, 0, 1].every((dy) => [-1, 0, 1].every((dx) => k.chunks.has(`${c.cx + dx},${c.cy + dy}`))))!;
    expect(mid).toBeDefined();
    for (const dy of [-1, 0, 1])
      for (const dx of [-1, 0, 1]) {
        const c = k.chunks.get(`${mid.cx + dx},${mid.cy + dy}`)!;
        c.tiles = Array.from({ length: S * S }, (_, i) => (dx === 0 && dy === 0 && i % S >= 7 && i % S < 11 && Math.floor(i / S) >= 7 && Math.floor(i / S) < 11 ? land : liquid)).join('');
        c.version++;
      }
    const water = buildChunk(k, mid).group.children.find((o) => (o as THREE.Mesh).geometry?.getAttribute('wave'))!;
    expect(water).toBeDefined();
    for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) same(k, k.chunks.get(`${mid.cx + dx},${mid.cy + dy}`)!, 'sull’acqua');

    // A land over the void beside the water (T445): its edge is a slab.
    k.palette['~'] ??= { id: 'void', name: 'vuoto', color: '#000000', solid: true, layer: 'void' } as (typeof k.palette)[string];
    const east = k.chunks.get(`${mid.cx + 1},${mid.cy}`)!;
    east.tiles = Array.from({ length: S * S }, (_, i) => (Math.abs((i % S) - S / 2) + Math.abs(Math.floor(i / S) - S / 2) < 6 ? land : '~')).join('');
    east.version++;
    same(k, east, 'sul vuoto');
    same(k, mid, 'accanto al vuoto');

    // The holes of cellars (T52b, T415): a whole tile and sub-cells on the place, sub-cells on the next one at the edge between them.
    const cover = (f: (s: number, t: number) => boolean) => Uint8Array.from({ length: HOLE_CELLS ** 2 }, (_, i) => (f(i % HOLE_CELLS, Math.floor(i / HOLE_CELLS)) ? 1 : 0));
    const west = k.chunks.get(`${mid.cx - 1},${mid.cy}`)!;
    for (const c of [mid, west, east]) {
      c.tiles = Array.from({ length: S * S }, () => land).join('');
      c.version++;
    }
    const holes = new Map<string, Map<number, TileHole>>([
      [mid.key, new Map<number, TileHole>([[5 * S, { depth: 1.25, cover: cover((s) => s < 9) }], [5 * S + 1, { depth: 1.25 }], [6 * S + 4, { depth: 0.75, cover: cover((s, t) => s > 3 && t < 12) }]])],
      [west.key, new Map<number, TileHole>([[5 * S + S - 1, { depth: 1.25, cover: cover((s) => s >= 9) }]])],
    ]);
    const real = k.holesIn.bind(k);
    k.holesIn = (ch: Chunk) => holes.get(ch.key) ?? real(ch);
    try {
      for (const c of [mid, west, east]) same(k, c, 'sulle cantine');
      // The copy carries its holes, and copies of their covers: the worker never touches the kernel's.
      const input = chunkInput(k, mid);
      expect(input.holes.length).toBe(4);
      const kept = holes.get(mid.key)!.get(5 * S)!.cover!;
      expect(input.holes.some(([, , c]) => c === kept)).toBe(false);
    } finally {
      k.holesIn = real;
    }
  }, 60_000);

  it('reads nothing off its copy: beyond the window the ground is not a number and the mesh shows it', async () => {
    const k = await world();
    const ch = [...k.chunks.values()].find((c) => k.chunks.has(`${c.cx + 1},${c.cy}`))!;
    const input = chunkInput(k, ch);
    const S = k.config.chunkSize;
    expect(input.w).toBe(S + 2 * CHUNK_MARGIN);
    const src = inputSource(input);
    expect(src.groundAt(input.x0 - 1, input.z0)).toBeNaN();
    expect(src.tileAt(input.x0 + input.w, input.z0)).toBeUndefined();
    expect(src.groundAt(input.x0, input.z0)).toBe(k.groundAt(input.x0, input.z0));
    // A copy of the place alone, without the tiles around it: its sides across the edge read a ground that is not a number, and the mesh shows it.
    const M = CHUNK_MARGIN;
    const inside = (i: number) => (Math.floor(i / S) + M) * input.w + (i % S) + M;
    const alone: ChunkInput = { ...input, x0: ch.cx * S, z0: ch.cy * S, w: S, codes: Array.from({ length: S * S }, (_, i) => input.codes[inside(i)]!), ground: Float64Array.from({ length: S * S }, (_, i) => input.ground[inside(i)]!), holes: [] };
    expect([...chunkArrays(inputSource(alone)).ground.position].some(Number.isNaN)).toBe(true);
    expect([...chunkArrays(inputSource(input)).ground.position].some(Number.isNaN)).toBe(false);
  }, 30_000);

  it('has in its window every tile the page’s mesh reads of the kernel: the far corners of the waves are the farthest', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const ch = [...k.chunks.values()].find((c) => [-1, 0, 1].every((dy) => [-1, 0, 1].every((dx) => k.chunks.has(`${c.cx + dx},${c.cy + dy}`))))!;
    // The sea all around, so that the waves read the corners beyond the far edges.
    const liquid = Object.keys(k.palette).find((c) => k.palette[c]!.layer === 'liquid')!;
    for (const dy of [-1, 0, 1])
      for (const dx of [-1, 0, 1]) {
        const c = k.chunks.get(`${ch.cx + dx},${ch.cy + dy}`)!;
        c.tiles = liquid.repeat(S * S);
        c.version++;
      }
    const reads: Array<[number, number]> = [];
    const tileAt = k.tileAt.bind(k), groundAt = k.groundAt.bind(k);
    k.tileAt = (x: number, z: number) => (reads.push([x, z]), tileAt(x, z));
    k.groundAt = (x: number, z: number) => (reads.push([x, z]), groundAt(x, z));
    try {
      buildChunk(k, ch);
    } finally {
      k.tileAt = tileAt;
      k.groundAt = groundAt;
    }
    const { x0, z0, w } = chunkInput(k, ch);
    expect(reads.length).toBeGreaterThan(S * S);
    for (const [x, z] of reads) expect(x >= x0 && z >= z0 && x < x0 + w && z < z0 + w, `${x},${z}`).toBe(true);
    // Its farthest reads are at the window's far edge and corner: the margin is all used.
    expect(Math.max(...reads.map(([x]) => x))).toBe(x0 + w - 1);
    expect(reads.some(([x, z]) => x === x0 + w - 1 && z === z0 + w - 1)).toBe(true);
  }, 30_000);

  it('makes the same arrays as the builder the other meshes use (`Builder` is `MeshBuilder` with its geometry)', () => {
    const a = new Builder(), b = new MeshBuilder();
    for (const x of [a, b]) {
      x.box(0, 0, 0, 1, 2, 1, [0.2, 0.4, 0.6]);
      x.fixedPart = 3;
      x.cylinder(5, 0, 5, 0.5, 1, [0.1, 0.2, 0.3], 8);
    }
    const g = a.geometry([2, 3]);
    const arr = b.arrays([2, 3]);
    expect(digest(g.getAttribute('position').array as Float32Array)).toBe(digest(arr.position));
    expect(digest(g.getAttribute('part').array as Uint8Array)).toBe(digest(arr.part));
    expect(g.getAttribute('part').array).toBeInstanceOf(Uint8Array);
  });
});

/** A worker of the test: it answers as terrainworker.ts does, a little later, or not at all, or stops. */
class FakeWorker {
  onmessage?: (ev: MessageEvent<ChunkAnswer>) => void;
  onerror?: (ev: ErrorEvent) => void;
  sent: Array<{ id: number; chunk: ChunkInput }> = [];
  terminated = false;
  constructor(private mode: 'answer' | 'silent' | 'fail' = 'answer') {}
  postMessage(msg: { id: number; chunk: ChunkInput }): void {
    const copy = structuredClone(msg);
    this.sent.push(copy);
    if (this.mode === 'silent') return;
    setTimeout(() => {
      const { answer, transfer } = this.mode === 'fail' ? { answer: { id: copy.id, ok: false as const, error: 'rotto' }, transfer: [] } : answerChunk(copy.id, copy.chunk);
      this.onmessage?.({ data: structuredClone(answer, { transfer }) } as MessageEvent<ChunkAnswer>);
    }, 1);
  }
  terminate(): void {
    this.terminated = true;
  }
}

describe('the worker of the places (T486, ChunkMesher)', () => {
  const input = (k: Kernel) => chunkInput(k, [...k.chunks.values()][0]!);

  it('has a place out once at a time, gives back what it made with the signature it was asked with, and forgets a world before', async () => {
    const k = await world();
    const w = new FakeWorker();
    const m = new ChunkMesher(() => w as unknown as Worker);
    expect(m.working).toBe(true);
    m.ask('0,0', 'a', input(k));
    expect(m.asking('0,0')).toBe(true);
    expect(m.take()).toEqual([]);
    await new Promise((r) => setTimeout(r, 20));
    const got = m.take();
    expect(got.map((g) => [g.key, g.sig, !!g.arrays])).toEqual([['0,0', 'a', true]]);
    expect(m.asking('0,0')).toBe(false);
    expect(m.made).toBe(1);
    // A reset: what comes back after it is of the files before.
    m.ask('0,0', 'b', input(k));
    m.forget();
    expect(m.asking('0,0')).toBe(false);
    await new Promise((r) => setTimeout(r, 20));
    expect(m.take()).toEqual([]);
    m.dispose();
    expect(w.terminated).toBe(true);
    expect(m.working).toBe(false);
  }, 30_000);

  it('says what failed, and is given up when it stops, when it does not answer, or when it does not start', async () => {
    const k = await world();
    const failing = new ChunkMesher(() => new FakeWorker('fail') as unknown as Worker);
    failing.ask('0,0', 'a', input(k));
    await new Promise((r) => setTimeout(r, 20));
    expect(failing.take()).toEqual([{ key: '0,0', sig: 'a', error: 'rotto' }]);
    expect(failing.working).toBe(true);

    const silent = new FakeWorker('silent');
    const stuck = new ChunkMesher(() => silent as unknown as Worker, 30);
    stuck.ask('0,0', 'a', input(k));
    // Asking more does not wind the watchdog again: only an answer does.
    await new Promise((r) => setTimeout(r, 15));
    stuck.ask('1,0', 'a', input(k));
    await new Promise((r) => setTimeout(r, 25));
    expect(stuck.working).toBe(false);
    expect(stuck.gaveUp).toMatch(/non risponde/);
    expect(silent.terminated).toBe(true);
    expect(stuck.asking('0,0')).toBe(false);

    const crash = new FakeWorker();
    const crashed = new ChunkMesher(() => crash as unknown as Worker);
    crashed.ask('0,0', 'a', input(k));
    crash.onerror?.({ message: 'memoria' } as ErrorEvent);
    expect(crashed.working).toBe(false);
    expect(crashed.gaveUp).toMatch(/memoria/);
    await new Promise((r) => setTimeout(r, 20));
    expect(crashed.take()).toEqual([]);

    const never = new ChunkMesher(() => {
      throw new Error('niente worker');
    });
    expect(never.working).toBe(false);
    expect(never.gaveUp).toMatch(/niente worker/);
    // In Node there is no Worker: the page makes the meshes itself.
    expect(new ChunkMesher().working).toBe(false);
  }, 30_000);

  it('uses per-class TILE_SEEDS (4 for trees and rocks, 3 for bush) across page and worker (T552)', async () => {
    const k = await world();
    expect(k.forms.seedsOf('tree')).toBe(4);
    expect(k.forms.seedsOf('rock')).toBe(4);
    expect(k.forms.seedsOf('bush')).toBe(3);
    for (const t of Object.values(k.palette)) if (t.model) for (let s = 1; s <= k.forms.seedsOf(t.model); s++) await k.forms.wait(t.model, s);
    k.tick(1 / 60);
    const ch = [...k.chunks.values()].find((c) => c.stage === 'planned' && c.tiles.includes('t'))!;
    const S = k.config.chunkSize;
    ch.tiles = Array.from({ length: S * S }, (_, i) => (i < S * (S / 2) ? 't' : 'r')).join('');
    ch.version++;
    const a = chunkArrays(inputSource(structuredClone(chunkInput(k, ch))));
    const treeSeeds = new Set(a.instances.filter((i) => i.code === 't').map((i) => i.seed));
    const rockSeeds = new Set(a.instances.filter((i) => i.code === 'r').map((i) => i.seed));
    expect([...treeSeeds].sort()).toEqual([0, 1, 2, 3]);
    expect([...rockSeeds].sort()).toEqual([0, 1, 2, 3]);
    expect(print(throughWorker(k, ch))).toEqual(print(buildChunk(k, ch).group));
  }, 60_000);
});
