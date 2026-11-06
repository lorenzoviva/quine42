// The jump (T56b): Space carries the wanderer over a crate on a path, not over a wall, not into deep water; the
// small rises of the relief are still walked up.

import { describe, expect, it } from 'vitest';
import { Kernel, JUMP_UP } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { LEVEL } from '../src/kernel/relief';
import type { FormComp } from '../src/kernel/forms';

// A crate 0.8 tiles high and a wall 3 tiles high, each a tile wide and deep (20 voxels per tile).
const box = (h: number, name: string) => `<sequence values="BS" size="20 20 ${h + 4}" name="${name}">
  <color symbol="S" value="8a6a40" name="legno"/>
  <box at="9.5 9.5 0" size="20 20 ${h}" color="S"/>
</sequence>`;

const files = () => {
  const index = JSON.parse(bundledFiles['models/index.json']!);
  index['cassa-prova'] = { classe: 'furniture', nome: 'cassa di prova' };
  index['muro-prova'] = { classe: 'structure', nome: 'muro di prova' };
  return { ...bundledFiles, 'models/cassa-prova.xml': box(16, 'Cassa'), 'models/muro-prova.xml': box(60, 'Muro'), 'models/index.json': JSON.stringify(index) };
};

async function scene() {
  const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  k.carpet()!.active = false;
  // A clear row of ground, 7 tiles long and 3 wide, on the planned chunks near the origin.
  let spot: [number, number] | undefined;
  for (let y = -10; y <= 10 && !spot; y++)
    for (let x = -10; x <= 6 && !spot; x++) {
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = 0; dx <= 6 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.45) && !!k.chunkAt(x + dx, y + dy)?.plan;
      if (ok) spot = [x + 0.5, y + 0.5];
    }
  expect(spot).toBeDefined();
  const [x0, y0] = spot!;
  const put = (model: string, x: number, y: number) => {
    const id = k.spawnModuleEntity(k.modules.get('object.well')!, x, y, undefined, `test#${model}#${x}`);
    Object.assign(k.ecs.get(id, 'form') as FormComp, { model, seed: 1, yaw: 0 });
    return id;
  };
  // Where the wanderer stands, in carpet space (the carpet is stopped: its offset stays).
  const stand = (x: number, y: number) => {
    const { ox, oy } = k.offset();
    Object.assign(k.wandererPos(), { x: x - ox, y: y - oy });
    k.wandererComp().facing = 'right';
  };
  const run = (s: number) => {
    for (let i = 0; i < s * 60; i++) k.tick(1 / 60);
  };
  return { k, x0, y0, put, stand, run };
}

describe('the jump', () => {
  it('goes over a crate on a path, where walking stops', async () => {
    const { k, x0, y0, put, stand, run } = await scene();
    put('cassa-prova', x0 + 2, y0);
    await k.forms.wait('cassa-prova', 1);
    k.tick(1 / 60);
    // Walking right, one stops before the crate.
    const r = 0.3;
    let x = x0;
    while (k.free(x + 0.05, y0, r) && x < x0 + 5) x += 0.05;
    expect(x).toBeLessThan(x0 + 2);
    stand(x0 + 0.5, y0);
    expect(k.jump()).toBe(true);
    expect(k.jump()).toBe(false); // already in the air
    expect(k.jumping()!.y).toBeGreaterThanOrEqual(k.floorAt(x0 + 0.5, y0) - 1e-9);
    let highest = 0;
    for (let i = 0; i < 60; i++) {
      k.tick(1 / 60);
      highest = Math.max(highest, (k.jumping()?.y ?? 0) - k.groundAt(x0, y0));
    }
    expect(k.jumping()).toBeUndefined();
    const at = k.wandererCarpet();
    expect(at.x).toBeGreaterThan(x0 + 2.5);
    expect(at.y).toBeCloseTo(y0, 5);
    expect(k.free(at.x, at.y, r)).toBe(true);
    // The arc goes over the crate (0.8 tiles).
    expect(highest).toBeGreaterThan(0.8);
    run(0.2);
    expect(k.wandererCarpet().x).toBeCloseTo(at.x, 5);
  }, 30_000);

  it('does not go over a wall: a jump on the spot', async () => {
    const { k, x0, y0, put, stand } = await scene();
    put('muro-prova', x0 + 2, y0);
    await k.forms.wait('muro-prova', 1);
    k.tick(1 / 60);
    expect(3).toBeGreaterThan(JUMP_UP);
    stand(x0 + 0.5, y0);
    expect(k.jump()).toBe(true);
    for (let i = 0; i < 60; i++) k.tick(1 / 60);
    expect(k.wandererCarpet().x).toBeCloseTo(x0 + 0.5, 5);
  }, 30_000);

  it('jumps a narrow stream, not into deep water', async () => {
    const { k, x0, y0, stand } = await scene();
    const water = Object.keys(k.palette).find((c) => k.palette[c].layer === 'liquid')!;
    expect(water).toBeDefined();
    const col = Math.floor(x0), row = Math.floor(y0);
    expect(k.setTile(col + 2, row, water)).toBe(true);
    stand(x0 + 0.5, y0);
    k.jump();
    for (let i = 0; i < 60; i++) k.tick(1 / 60);
    expect(k.wandererCarpet().x).toBeGreaterThan(x0 + 2.5);
    // A wide water: nowhere to land within reach.
    stand(x0 + 0.5, y0);
    for (let c = 2; c <= 5; c++) expect(k.setTile(col + c, row, water)).toBe(true);
    k.jump();
    for (let i = 0; i < 60; i++) k.tick(1 / 60);
    expect(k.wandererCarpet().x).toBeCloseTo(x0 + 0.5, 5);
  }, 30_000);

  it('still walks up a rise of a level, and does nothing in the corona', async () => {
    const { k } = await scene();
    // Two neighbouring free tiles a level (or two) apart: walking from one to the other is never stopped.
    let found = false;
    for (let y = -20; y <= 20 && !found; y++)
      for (let x = -20; x <= 20 && !found; x++) {
        const a = k.groundAt(x + 0.5, y + 0.5), b = k.groundAt(x + 1.5, y + 0.5);
        if (b - a < LEVEL - 1e-9 || !k.free(x + 0.5, y + 0.5, 0.3) || !k.free(x + 1.5, y + 0.5, 0.3)) continue;
        found = true;
        for (let s = 0; s <= 1; s += 0.05) expect(k.free(x + 0.5 + s, y + 0.5, 0.3)).toBe(true);
      }
    expect(found).toBe(true);
    // In the corona Space is what E is: no jump.
    Object.assign(k.wandererPos(), { x: k.config.circleRadius + 6, y: 0 });
    k.tick(1 / 60);
    expect(k.zone).not.toBe('sim');
    expect(k.jump()).toBe(false);
  }, 30_000);
});
