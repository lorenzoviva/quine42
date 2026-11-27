// The ground that flickered (T492): every commit of the Council reloads the universe's files (`universe:reloaded`), and the renderer took away
// every place's meshes there and made them again a few a frame (in the worker since T486: a dozen frames), so for those frames only the sky
// was where the ground, the pier and the sea had been. The invariant, frame by frame, with the renderer's own `reset` and `syncChunks` and
// no GPU: a place loaded that had its meshes on screen has them in the next frame too, after a reload as when walking from place to place;
// the meshes of the files before are made again and replaced, each in the same frame its new one comes; a place no longer loaded goes.

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { ChunkMesher } from '../src/render/chunkmesher';
import { Renderer } from '../src/render/renderer';
import { STALE_SIG, chunkSig, modelsSig, type TerrainView } from '../src/render/terrain';
import { answerChunk, type ChunkAnswer, type ChunkInput } from '../src/render/terrainmesh';

const DT = 1 / 60;

/** A worker of the test that answers as terrainworker.ts does, a little later (as in terreno-worker.test.ts). */
class LateWorker {
  onmessage?: (ev: MessageEvent<ChunkAnswer>) => void;
  onerror?: (ev: ErrorEvent) => void;
  postMessage(msg: { id: number; chunk: ChunkInput }): void {
    const copy = structuredClone(msg);
    setTimeout(() => {
      const { answer, transfer } = answerChunk(copy.id, copy.chunk);
      this.onmessage?.({ data: structuredClone(answer, { transfer }) } as MessageEvent<ChunkAnswer>);
    }, 1);
  }
  terminate(): void {}
}

/** The renderer's places without a GPU: its own `reset` and `syncChunks` on a group, with the worker or without (the page makes them). */
function places(k: Kernel, worker: boolean) {
  const world = new THREE.Group();
  const r = Object.assign(Object.create(Renderer.prototype), {
    kernel: k,
    world,
    chunks: new Map<string, TerrainView>(),
    mesher: worker ? new ChunkMesher(() => new LateWorker() as unknown as Worker) : new ChunkMesher(),
    entities: { clear() {} },
    yawGoal: 0,
  }) as Renderer;
  const inner = r as unknown as { chunks: Map<string, TerrainView>; syncChunks(): void; reset(): void; mesher: ChunkMesher };
  k.bus.on('universe:reloaded', () => inner.reset());
  /** The places loaded whose meshes are on screen. */
  const shown = () => new Set([...k.chunks.keys()].filter((key) => inner.chunks.get(key)?.group.parent === world));
  let before = new Set<string>();
  const lost: string[] = [];
  let frames = 0;
  /** A frame: the kernel's tick, the worker's answers, the renderer's places; and what was on screen and is not, of a place still loaded. */
  const frame = async (tick = true) => {
    if (tick) k.tick(DT);
    if (worker) await new Promise((res) => setTimeout(res, 2));
    inner.syncChunks();
    frames++;
    const now = shown();
    for (const key of before) if (k.chunks.has(key) && !now.has(key)) lost.push(`fotogramma ${frames}: ${key}`);
    before = now;
  };
  /** Frames until every place loaded is on screen with the meshes of what it is now. */
  const settle = async () => {
    for (let i = 0; i < 400; i++) {
      await frame(false);
      if ([...k.chunks.values()].every((ch) => inner.chunks.get(ch.key)?.sig === chunkSig(k, ch, models()))) return;
    }
    throw new Error('i luoghi non arrivano a schermo');
  };
  // The renderer's signature of the terrains' models and of the covers' programs (T545), as syncChunks makes it.
  const models = () => modelsSig(k);
  return { r: inner, world, shown, frame, settle, lost };
}

async function world() {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 400 && ![...k.chunks.values()].every((c) => c.stage === 'planned' || c.held); i++) {
    k.tick(DT);
    await new Promise((r) => setTimeout(r, 5));
  }
  k.tick(DT);
  return k;
}

describe('the ground on screen through a reload of the files (T492)', () => {
  for (const worker of [false, true]) {
    it(`keeps every place on screen until its new meshes replace it, ${worker ? 'with the worker' : 'made on the page'}`, async () => {
      const k = await world();
      const p = places(k, worker);
      await p.settle();
      const loaded = k.chunks.size;
      expect(loaded).toBeGreaterThan(8);
      expect(p.shown().size).toBe(loaded);
      const groups = new Map([...p.r.chunks].map(([key, v]) => [key, v.group]));
      // What a commit of the Council does (a pack, a model, a place planned): the files again, the event the renderer listens to.
      k.applyFiles({ ...k.repo.working });
      // Every place stays: stale, made again.
      expect(p.shown().size).toBe(loaded);
      expect([...p.r.chunks.values()].every((v) => v.sig === STALE_SIG)).toBe(true);
      await p.frame(false);
      expect(p.shown().size, 'il fotogramma dopo la ricarica').toBe(loaded);
      // A few a frame: more than one frame goes by with some of them stale, never one with a hole.
      expect([...p.r.chunks.values()].some((v) => v.sig === STALE_SIG)).toBe(true);
      await p.settle();
      expect(p.lost).toEqual([]);
      // Made again of the files now, each in the place of the one before, which is no longer on screen.
      for (const [key, g] of groups) {
        expect(p.r.chunks.get(key)!.group).not.toBe(g);
        expect(g.parent).toBeNull();
      }
      expect(p.world.children.filter((o) => [...p.r.chunks.values()].some((v) => v.group === o)).length).toBe(p.world.children.length);
      expect(p.world.children.length).toBe(loaded);
      p.r.mesher.dispose();
    }, 60_000);
  }

  it('walking from place to place: a place loaded never loses its meshes, those of the places left go', async () => {
    const k = await world();
    const p = places(k, true);
    await p.settle();
    k.carpet()!.active = false;
    const S = k.config.chunkSize;
    let reloads = 0;
    k.bus.on('universe:reloaded', () => reloads++);
    // Four places east, then four north: the places ahead load (and the Council plans them, with its commits), those behind go.
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      for (let i = 0; i < 4 * S; i++) {
        const w = k.wandererPos();
        w.x += dx;
        w.y += dy;
        await p.frame();
      }
    }
    await p.settle();
    expect(p.lost).toEqual([]);
    // Only the places loaded are on screen.
    expect(p.world.children.length).toBe(k.chunks.size);
    expect(p.shown().size).toBe(k.chunks.size);
    expect(reloads, 'il Concilio offline ha pianificato e salvato luoghi nuovi strada facendo').toBeGreaterThan(0);
    p.r.mesher.dispose();
  }, 120_000);
});
