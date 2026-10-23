// T20 (ADR-0049): a model says its density (voxels per tile) in the library's index, and the buildings of the
// campus that have a program of their own (`models/corona-<id>.xml`) wear it: front towards the avenue, the door
// on the letter named `porta`, collision from the voxels.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { footBlocks } from '../src/kernel/forms';
import { compileMjx } from '../src/mj/model';
import { clipFrames } from '../src/mj/run';
import type { Grid3 } from '../src/mj/engine';

/** A small building at 8 voxels per tile: 6 × 5 × 4 tiles, a body 5.5 × 4.25, a door in the middle of its front. */
const BUILDING = `<sequence values="BMO" size="48 40 32" name="Prova">
  <color symbol="M" value="1d1e26" name="metallo"/>
  <color symbol="O" value="ff2a6d" name="porta"/>
  <box at="24 19 0" size="44 34 28" color="M"/>
  <box at="24 35 0" size="8 2 16" color="O"/>
</sequence>`;

function withModel(id: string, vpt?: number) {
  const index = JSON.parse(bundledFiles['models/index.json']);
  index[id] = { classe: 'edificio', nome: 'Prova', autore: 'test', ...(vpt ? { vpt } : {}) };
  return { ...bundledFiles, 'models/index.json': JSON.stringify(index), [`models/${id}.xml`]: BUILDING };
}

const boot = (files: Record<string, string>) => Kernel.boot({ files, store: memoryStore(), models: new MockModels() });

describe('the density of a model', () => {
  it('is 20 voxels per tile unless the index says another one: collision, reach and floors follow it', async () => {
    const k = await boot(withModel('prova', 8));
    const f = (await k.forms.wait('prova', 1))!;
    expect(f.status).toBe('ready');
    expect(f.vpt).toBe(8);
    expect(f.reach).toBeCloseTo(Math.hypot(48, 40) / 2 / 8);
    // The body spans 2.75 tiles each side of the middle at 8 voxels per tile (1.1 at 20).
    expect(footBlocks(f, f.foot!, 2.6, 0)).toBe(true);
    expect(footBlocks(f, f.foot!, 2.9, 0)).toBe(false);
    const k20 = await boot(withModel('prova'));
    const g = (await k20.forms.wait('prova', 1))!;
    expect(g.vpt).toBe(20);
    expect(footBlocks(g, g.foot!, 1.0, 0)).toBe(true);
    expect(footBlocks(g, g.foot!, 1.2, 0)).toBe(false);
  });
});

describe('the buildings of the campus as models', () => {
  it('stand with the front to the avenue, the door where the model has it, blocking with their voxels', async () => {
    const k = await boot(withModel('corona-magia', 8));
    const plain = k.corona.buildings.filter((b) => b.id !== 'magia');
    await k.forms.wait('corona-magia', 1);
    k.placeCampus();
    const b = k.corona.building('magia')!;
    const s = b.structure!;
    expect(s.model).toBe('corona-magia');
    // The others stay plain blocks.
    expect(plain.every((p) => !p.structure && p.cells.size > 0)).toBe(true);
    // The door is on the avenue, between the circle and the model, on the middle of the sector.
    const mid = (b.from + b.to) / 2;
    const door = { x: b.door.x + 0.5, y: b.door.y + 0.5 };
    expect(Math.abs(Math.hypot(door.x, door.y) - (k.corona.radius + 6.5))).toBeLessThan(1);
    expect(Math.hypot(s.x, s.y)).toBeGreaterThan(Math.hypot(door.x, door.y) + 2);
    expect(Math.abs(Math.atan2(s.x, -s.y) - (mid > Math.PI ? mid - Math.PI * 2 : mid))).toBeLessThan(0.05);
    expect(k.corona.at(b.door.x, b.door.y)?.kind).toBe('door');
    expect(k.corona.doorNear(door.x, door.y)?.id).toBe('magia');
    // From the avenue to the door nothing is in the way; the model's middle blocks.
    const out = k.corona.exitPoint(b);
    for (let i = 0; i <= 20; i++) expect(k.corona.free(out.x + ((door.x - out.x) * i) / 20, out.y + ((door.y - out.y) * i) / 20)).toBe(true);
    expect(k.corona.free(s.x, s.y)).toBe(false);
    // Its voxels block, not its cells: just past the side of the body (2.75 tiles from the middle) one walks.
    const side = (d: number) => ({ x: s.x + Math.cos(s.yaw) * d, y: s.y - Math.sin(s.yaw) * d });
    expect(k.corona.free(side(2.5).x, side(2.5).y)).toBe(false);
    expect(k.corona.free(side(3.1).x, side(3.1).y)).toBe(true);
    // What was block and is not covered by the model is ground again; the cells it covers are the building's.
    expect(b.cells.size).toBeGreaterThan(15);
    expect(b.cells.size).toBeLessThan(40);
    expect([...b.cells].every((key) => k.corona.at(...(key.split(',').map(Number) as [number, number]))?.kind === 'building')).toBe(true);
  });

  it('wears the model again after the studio is rebuilt (a file changed)', async () => {
    const k = await boot(withModel('corona-magia', 8));
    await k.forms.wait('corona-magia', 1);
    k.placeCampus();
    k.corona.build(k.files);
    expect(k.corona.building('magia')!.structure).toBeUndefined();
    k.placeCampus();
    expect(k.corona.building('magia')!.structure?.model).toBe('corona-magia');
  });
});

// T31: the buildings Gemini wrote for the campus (lab/mjx/models/corona-<id>.xml, then in the seed).
describe('the buildings of the seed', () => {
  const written = Object.keys(bundledFiles).map((p) => /^models\/corona-([a-z]+)\.xml$/.exec(p)?.[1]).filter((id): id is string => !!id);

  it('are in the library at 8 voxels per tile', () => {
    expect(written).toContain('magia');
    const index = JSON.parse(bundledFiles['models/index.json']);
    for (const id of written) expect(index[`corona-${id}`]).toMatchObject({ classe: 'edificio', vpt: 8 });
  });

  for (const id of ['magia']) {
    it(`${id}: runs in time, stands in its sector, its door reached from the avenue, its animation a loop`, async () => {
      const k = await boot(bundledFiles);
      const t = Date.now();
      const f = (await k.forms.wait(`corona-${id}`, 1))!;
      expect(f.status).toBe('ready');
      expect(Date.now() - t).toBeLessThan(5_000);
      k.placeCampus();
      const b = k.corona.building(id)!;
      const s = b.structure!;
      expect(s.model).toBe(`corona-${id}`);
      // Within its sector: every corner of the model's box is between the sector's edges.
      const half = Math.max(f.result!.grid.X, f.result!.grid.Y) / 2 / f.vpt;
      const ang = (x: number, y: number) => { const a = Math.atan2(x, -y); return a < 0 ? a + Math.PI * 2 : a; };
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const a = ang(s.x + dx * half, s.y + dy * half);
        expect(a).toBeGreaterThan(b.from);
        expect(a).toBeLessThan(b.to);
      }
      // From the avenue to the door nothing is in the way.
      const door = { x: b.door.x + 0.5, y: b.door.y + 0.5 };
      const out = k.corona.exitPoint(b);
      for (let i = 0; i <= 20; i++) expect(k.corona.free(out.x + ((door.x - out.x) * i) / 20, out.y + ((door.y - out.y) * i) / 20)).toBe(true);
      expect(k.corona.doorNear(door.x, door.y)?.id).toBe(id);
      // The animation changes the model and comes back to it (the renderer shows its frames in a ring).
      const m = compileMjx(bundledFiles[`models/corona-${id}.xml`]);
      for (const clip of m.animations) {
        const frames = clipFrames(f.result!.grid as Grid3, clip, 1);
        expect(frames.some((g) => g.cells.some((c, i) => c !== frames[0].cells[i]))).toBe(true);
      }
    }, 30_000);
  }

  it('reach a universe whose library index the Sculptor rewrote', async () => {
    const { upgradeFromSeed, seedHashes } = await import('../src/kernel/universes');
    const index = JSON.parse(bundledFiles['models/index.json']);
    const old = Object.fromEntries(Object.entries(index).filter(([id]) => !id.startsWith('corona-')));
    const oldSeed: Record<string, string> = { ...bundledFiles, 'models/index.json': JSON.stringify(old) };
    for (const p of Object.keys(oldSeed)) if (/^models\/corona-/.test(p)) delete oldSeed[p];
    const mine = { ...old, mulino: { classe: 'edificio', nome: 'Mulino', autore: 'scultore' } };
    const files = { ...oldSeed, 'models/index.json': JSON.stringify(mine), 'seed.json': JSON.stringify(seedHashes(oldSeed)) };
    const up = upgradeFromSeed(files, bundledFiles).files;
    const now = JSON.parse(up['models/index.json']);
    expect(now.mulino.autore).toBe('scultore');
    expect(now['corona-magia']).toMatchObject({ vpt: 8 });
    expect(up['models/corona-magia.xml']).toBe(bundledFiles['models/corona-magia.xml']);
  });
});
