// T245e (ADR-0148): a building that rises by stages. The program of a structure runs once; its finished grid is shown filtered by the
// stage of its venture (a pure function of the grid), with the kernel's site around it; the footprint and the floors follow the stage;
// the plan of the place says the stage, so it survives a reopening, and a client sees it on the wire.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { MemoryChunks } from '../src/kernel/chunks';
import type { Form, FormComp } from '../src/kernel/forms';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { addWork, bring, type Venture } from '../src/kernel/ventures';
import type { PaletteEntry } from '../src/mj/engine';
import { SCAFFOLD_LETTER, STAKE_LETTER, stageGrid, stageHeight, stageHeights, type VoxelGrid } from '../src/mj/mesh';
import { SessionServer } from '../src/session/server';
import { developAll, manyPlayers, pause } from './espressivita/banco';

const PAL: Record<string, PaletteEntry> = { B: { color: '#000000' }, W: { color: '#ffffff' }, Y: { color: '#ffff00', glow: true } };

/** A house of 10 × 10 × 12 voxels: a slab of two, walls of one on the edge up to 10, a window that gives light, a roof of two. */
function house(): VoxelGrid {
  const X = 10, Y = 10, Z = 12;
  const alphabet = ['.', 'B', 'W', 'Y'];
  const cells = new Uint8Array(X * Y * Z);
  for (let z = 0; z < Z; z++)
    for (let y = 0; y < Y; y++)
      for (let x = 0; x < X; x++) {
        const edge = x === 0 || y === 0 || x === X - 1 || y === Y - 1;
        if (z < 2 || z >= 10 || edge) cells[x + y * X + z * X * Y] = z >= 10 ? 2 : 1;
      }
  cells[0 + 5 * X + 6 * X * Y] = 3;
  return { X, Y, Z, cells, alphabet };
}

const count = (g: VoxelGrid, pred: (z: number, letter: string) => boolean) => {
  let n = 0;
  const XY = g.X * g.Y;
  for (let i = 0; i < g.cells.length; i++) if (g.cells[i] && pred(Math.floor(i / XY), g.alphabet[g.cells[i]])) n++;
  return n;
};

describe('the stages of a grid', () => {
  it('the heights come from the grid alone: the top of the ground floor, the base of the roof, the top', () => {
    expect(stageHeights(house(), PAL)).toEqual({ floor: 2, roof: 10, top: 12 });
    const h = stageHeights(house(), PAL);
    expect([0, 0.2, 0.45, 0.7, 0.9, 1].map((s) => stageHeight(h, s))).toEqual([0, 2, 6, 10, 12, 12]);
  });

  it('0 shows nothing of the building, 0.2 the ground floor, 0.7 the walls up to the roof, 0.9 the whole with the lights off, 1 the grid as it is', () => {
    const g = house();
    expect(count(stageGrid(g, PAL, 0).grid, () => true)).toBe(0);
    expect(count(stageGrid(g, PAL, 0.2).grid, (z) => z >= 2)).toBe(0);
    expect(count(stageGrid(g, PAL, 0.2).grid, () => true)).toBe(200);
    const walls = stageGrid(g, PAL, 0.7);
    expect(count(walls.grid, (z) => z >= 10)).toBe(0);
    expect(count(walls.grid, (z) => z === 9)).toBe(36);
    const roofed = stageGrid(g, PAL, 0.9);
    expect(count(roofed.grid, () => true)).toBe(count(g, () => true));
    expect(roofed.palette.Y.glow).toBe(false);
    const whole = stageGrid(g, PAL, 1);
    expect(whole.grid).toBe(g);
    expect(whole.palette).toBe(PAL);
    // Pure: the grid it came from is as it was.
    expect(count(g, () => true)).toBe(10 * 10 * 4 + 36 * 8);
  });

  it('the site around it: stakes and a rope at 0, scaffolding up to above what stands while it rises, nothing at 1; one voxel more on every side', () => {
    const g = house();
    const marked = stageGrid(g, PAL, 0, { site: true, vpt: 8 });
    expect([marked.grid.X, marked.grid.Y, marked.grid.Z]).toEqual([12, 12, 12]);
    expect(count(marked.grid, (_, l) => l === STAKE_LETTER)).toBeGreaterThan(4);
    expect(count(marked.grid, (_, l) => l !== STAKE_LETTER)).toBe(0);
    const rising = stageGrid(g, PAL, 0.7, { site: true, vpt: 8 });
    expect(count(rising.grid, (_, l) => l === SCAFFOLD_LETTER)).toBeGreaterThan(20);
    expect(count(rising.grid, (z, l) => l === SCAFFOLD_LETTER && z >= 10)).toBeGreaterThan(0);
    expect(rising.palette[SCAFFOLD_LETTER].color).toBeDefined();
    // The building itself is where it was, one voxel in.
    expect(count(rising.grid, (_, l) => l === 'B')).toBe(count(stageGrid(g, PAL, 0.7).grid, (_, l) => l === 'B'));
    expect(stageGrid(g, PAL, 1, { site: true }).grid).toBe(g);
  });
});

async function world(files = bundledFiles, chunks = new MemoryChunks()): Promise<Kernel> {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), chunks });
  await developAll(k);
  for (const id of k.ecs.query('mind')) k.ecs.destroy(id);
  return k;
}

const live = (k: Kernel) => (k as unknown as { ventureList: Venture[] }).ventureList;
const structureOf = (k: Kernel, origin: string) => k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key === origin);

function fallen(k: Kernel): { origin: string; key: string } {
  const pc = k.wandererCarpet();
  const S = k.config.chunkSize;
  const key = `${Math.floor(pc.x / S)},${Math.floor(pc.y / S)}`;
  const id = k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key.startsWith(`${key}#s`))!;
  const origin = k.ecs.get(id, 'origin').key;
  (k as unknown as { breakEntity(id: number): void }).breakEntity(id);
  return { origin, key };
}

describe('a building that rises in a world', () => {
  it('a phase done raises the building a stage: in the world, in the plan of the place, for the footprint; reopened it is where it was', async () => {
    const chunks = new MemoryChunks();
    let k = await world(bundledFiles, chunks);
    const { origin, key } = fallen(k);
    const sid = structureOf(k, origin)!;
    expect(k.ecs.get(sid, 'struttura').stadio).toBe(0);
    expect(k.chunks.get(key)!.plan!.stadi).toEqual({ [origin]: 0 });
    // What a body meets follows the stage: nothing at 0, the walls when they are up.
    const fc: FormComp = k.ecs.get(sid, 'form');
    const f = (await k.forms.wait(fc.model, fc.seed, fc.tint)) as Form;
    expect(f.status).toBe('ready');
    const ground = (k as unknown as { groundOf(id: number, fc: FormComp, f: Form): { foot: Uint8Array } }).groundOf.bind(k);
    const blocked = () => ground(sid, fc, f).foot.reduce((n, x) => n + x, 0);
    expect(blocked()).toBe(0);
    const whole = f.foot!.reduce((n, x) => n + x, 0);
    expect(whole).toBeGreaterThan(0);

    const v = live(k)[0];
    const step = (it: Record<string, number>, work: number) => {
      for (const [i, n] of Object.entries(it)) bring(v, i, n);
      (k as unknown as { phasesClosed(v: Venture, c: number[]): void }).phasesClosed(v, addWork(v, work));
    };
    step({ 'item.ciocco': 4 }, 200);
    expect(k.ecs.get(sid, 'struttura').stadio).toBe(0.2);
    step({ 'item.ciocco': 6, 'item.chiodi': 4 }, 600);
    expect(k.ecs.get(sid, 'struttura').stadio).toBe(0.7);
    expect(blocked()).toBeGreaterThan(0);
    expect(blocked()).toBeLessThanOrEqual(whole);
    // No rooms before the roof: the individuals of the house live elsewhere until then.
    expect((k as unknown as { interiorPoints(id: number): unknown[] }).interiorPoints(sid)).toEqual([]);
    expect(k.chunks.get(key)!.plan!.stadi).toEqual({ [origin]: 0.7 });

    // On the wire: a client sees the stage of the structure, and nothing else of it.
    const many = await Kernel.boot({ files: manyPlayers(bundledFiles), store: memoryStore(), ai: new MockAiModels() });
    await developAll(many);
    const server = new SessionServer(many);
    const look = (server as unknown as { lookOf(id: number): { c?: Record<string, unknown> } }).lookOf.bind(server);
    const there = many.ecs.query('struttura')[0];
    many.ecs.get(there, 'struttura').stadio = 0.7;
    expect(look(there).c?.struttura).toEqual({ stadio: 0.7 });
    delete many.ecs.get(there, 'struttura').stadio;
    expect(look(there).c?.struttura).toBeUndefined();

    // Saved and reopened: the plan of the place says the stage.
    expect(k.saveState()).toBe(true);
    await pause(700);
    k = await Kernel.boot({ files: { ...k.files }, store: memoryStore(), ai: new MockAiModels(), chunks });
    await developAll(k);
    expect(k.ecs.get(structureOf(k, origin)!, 'struttura').stadio).toBe(0.7);
    // Finished: the stage goes from the plan and from the structure.
    const w = live(k)[0];
    for (const it of ['item.ciocco', 'item.chiodi']) bring(w, it, 100);
    addWork(w, 1e6);
    k.tick(1 / 60);
    for (let i = 0; i < 70; i++) k.tick(1 / 60);
    expect(k.ventures()[0].stato).toBe('finita');
    expect(k.ecs.get(structureOf(k, origin)!, 'struttura').stadio).toBeUndefined();
    expect(k.chunks.get(key)!.plan!.stadi).toBeUndefined();
  }, 120000);

  it('a plan saved ahead of the file of the ventures (a tab closed in between): without a venture no scaffolding stays for ever', async () => {
    const chunks = new MemoryChunks();
    const k = await world(bundledFiles, chunks);
    const { origin, key } = fallen(k);
    const v = live(k)[0];
    bring(v, 'item.ciocco', 4);
    (k as unknown as { phasesClosed(v: Venture, c: number[]): void }).phasesClosed(v, addWork(v, 200));
    const plan = k.chunks.get(key)!.plan!;
    expect(plan.stadi).toEqual({ [origin]: 0.2 });
    plan.case = [{ origine: `${key}#v1`, x: 2, y: 2, modello: 'grande', seme: 1, yaw: 0, classe: 'edificio', concetto: 'una casetta', stadio: 0.2 }];
    (k as unknown as { saveChunkSoon(c: unknown): void }).saveChunkSoon(k.chunks.get(key));
    await pause(700);
    // The world files are those of before the fall: no venture.
    const again = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks });
    await developAll(again);
    expect(again.ventures()).toEqual([]);
    expect(again.ecs.get(structureOf(again, origin)!, 'struttura').stadio).toBeUndefined();
    expect(again.chunks.get(key)!.plan!.stadi).toBeUndefined();
    expect(again.chunks.get(key)!.plan!.case ?? []).toEqual([]);
    expect(structureOf(again, `${key}#v1`)).toBeUndefined();
  }, 120000);
});
