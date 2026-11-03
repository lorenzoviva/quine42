// Stairs as ramps (T53a, ADR-0043): a column higher than the one a body stands on by no more than a step is
// climbed; a stair of small steps takes one up and down again, a wall stays a wall, and the seed's structures are
// walkable as before.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bodyFoot, bodyGround, InlineRunner, Forms, stepOf, type FormComp } from '../src/kernel/forms';
import { floors } from '../src/mj/mesh';

// Ten steps along x, each 0.2 tiles high and half a tile deep, a tile wide (y 20..39), up to a landing 2 tiles high.
const STAIR = `<sequence values="BS" size="140 60 60" name="Scala di prova">
  <color symbol="S" value="8a8070" name="pietra"/>
${Array.from({ length: 10 }, (_, i) => `  <box at="${(20 + 10 * i + 139) / 2} 29.5 0" size="${120 - 10 * i} 20 ${4 * (i + 1)}" color="S"/>`).join('\n')}
</sequence>`;

const files = () => {
  const index = JSON.parse(bundledFiles['models/index.json']!);
  index.scala = { classe: 'grande', nome: 'scala di prova' };
  return { ...bundledFiles, 'models/scala.xml': STAIR, 'models/index.json': JSON.stringify(index) };
};

describe('stairs as ramps', () => {
  it('a stair of small steps is climbed to the top and walked down again; its side is a wall', async () => {
    const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
    k.tick(1 / 60);
    // A clear patch of ground for the stair (7 × 3 tiles) and around it.
    let spot: [number, number] | undefined;
    for (let y = -12; y <= 12 && !spot; y++)
      for (let x = -12; x <= 12 && !spot; x++) {
        let ok = true;
        for (let dy = -3; dy <= 3 && ok; dy++) for (let dx = -5; dx <= 5 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.25);
        if (ok) spot = [x + 0.5, y + 0.5];
      }
    expect(spot).toBeDefined();
    const [cx, cy] = spot!;
    const id = k.spawnModuleEntity(k.modules.get('object.well')!, cx, cy, undefined, 'test#scala');
    const fc = k.ecs.get(id, 'form') as FormComp;
    Object.assign(fc, { model: 'scala', seed: 1, yaw: 0 });
    const form = await k.forms.wait('scala', 1);
    expect(form?.status).toBe('ready');
    k.tick(1 / 60);
    // Local voxel → world point (20 voxels per tile, the grid centred on the entity).
    const at = (vx: number, vy: number) => [cx + (vx - 70) / 20, cy + (vy - 30) / 20] as const;
    const r = 0.22;
    const base = k.floorAt(...at(5, 30));
    // Up: from the ground in front of the first step to the landing, in small paces.
    let [x, y] = at(5, 30);
    const [top] = at(130, 30);
    let highest = base;
    while (x < top) {
      expect(k.free(x + 0.05, y, r), `su, a ${x.toFixed(2)}`).toBe(true);
      x += 0.05;
      highest = Math.max(highest, k.floorAt(x, y));
    }
    expect(k.floorAt(x, y) - k.groundAt(cx, cy)).toBeCloseTo(2, 5);
    expect(highest - k.groundAt(cx, cy)).toBeCloseTo(2, 5);
    // And down again.
    const [bottom] = at(5, 30);
    while (x > bottom) {
      expect(k.free(x - 0.05, y, r), `giù, a ${x.toFixed(2)}`).toBe(true);
      x -= 0.05;
    }
    expect(k.floorAt(x, y)).toBeCloseTo(base, 5);
    // From the side, beside the high steps, the stair is a wall: one stops before it.
    [x, y] = at(115, 52);
    let blocked = false;
    for (let n = 0; n < 40 && !blocked; n++) {
      if (k.free(x, y - 0.05, r)) y -= 0.05;
      else blocked = true;
    }
    expect(blocked).toBe(true);
    expect(y - r).toBeGreaterThan(at(0, 39)[1]);
    // The landing is a floor (reached by the stair).
    expect(k.free(...at(125, 30), 0.001)).toBe(true);
  }, 30_000);

  it('a wall more than a step high is not climbed, a doorstep is', async () => {
    const forms = new Forms(new InlineRunner());
    const wall = `<sequence values="BS" size="60 20 40"><color symbol="S" value="777777"/>
      <box at="14.5 9.5 0" size="10 20 3" color="S"/><box at="44.5 9.5 0" size="10 20 12" color="S"/></sequence>`;
    forms.load({ 'models/index.json': JSON.stringify({ muro: { classe: 'grande' } }), 'models/muro.xml': wall });
    const f = (await forms.wait('muro', 1))!;
    const step = stepOf(f.vpt);
    const g = f.result!.grid;
    const col = (vx: number) => vx + 10 * g.X;
    // The doorstep (3 voxels ≤ a step) is a floor one stands on; the wall (12) is out of reach.
    expect(f.floor![col(14)]).toBe(3);
    expect(3).toBeLessThanOrEqual(step);
    expect(f.block![col(14)]).toBe(0);
    expect(f.floor![col(44)]).toBe(12);
    expect(f.block![col(44)]).toBe(1);
  });

  it('keeps the seed structures walkable where they were', async () => {
    const forms = new Forms(new InlineRunner());
    forms.load(bundledFiles);
    for (const model of ['grande', 'edificio'])
      for (const seed of [1, 2, 3]) {
        const f = (await forms.wait(model, seed))!;
        expect(f.status, `${model}#${seed}`).toBe('ready');
        const { grid, palette } = f.result!;
        // Before T53a: a floor no higher than a step, nothing at body height above the ground.
        const old = floors(grid, palette, stepOf(f.vpt));
        const foot = bodyFoot(grid, palette, f.vpt);
        const { floor, block } = bodyGround(grid, palette, f.vpt);
        let lost = 0, walkable = 0;
        for (let i = 0; i < old.length; i++) {
          const before = !foot[i] && (old[i] > 0 || floor[i] === 0);
          if (!before) continue;
          walkable++;
          if (block[i]) lost++;
        }
        expect(walkable, `${model}#${seed}`).toBeGreaterThan(0);
        expect(lost / walkable, `${model}#${seed}`).toBeLessThan(0.01);
      }
  }, 60_000);
});
