// T48b: The plinto in the piazza of the Artist's gallery (galleria).
// On the letter `plinto` (Q) of the Galleria model, the kernel places an instance of a library model,
// chosen on each visit to the corona (seed from arrival tick), reduced to fit on the plinto;
// no IA generation, no new collision beyond the plinto itself.
// The model changes between visits, stands above the plinto letter, and the door remains reachable.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

describe('the plinto in the piazza of the Galleria (T48b)', () => {
  it('detects the plinto on the Galleria structure from the letter plinto', async () => {
    const k = await boot();
    await k.forms.wait('corona-galleria', 1);
    k.placeCampus();

    const b = k.corona.building('galleria')!;
    const s = b.structure!;
    expect(s.model).toBe('corona-galleria');
    expect(s.plinto).toBeDefined();

    const pl = s.plinto!;
    // Top surface of the plinto is 1 unit high (8 voxels at 8 vpt)
    expect(pl.z).toBeCloseTo(1.0, 2);
    // 16x16 voxels = 2.0 x 2.0 tiles
    expect(pl.width).toBeCloseTo(2.0, 2);
    expect(pl.depth).toBeCloseTo(2.0, 2);

    // In world coordinates, plinto is situated in the front piazzale to the left
    expect(Number.isFinite(pl.x)).toBe(true);
    expect(Number.isFinite(pl.y)).toBe(true);
  });

  it('places a library model on the plinto when visiting corona, reduced to fit', async () => {
    const k = await boot();
    await k.forms.wait('corona-galleria', 1);
    k.placeCampus();

    const b = k.corona.building('galleria')!;
    const s = b.structure!;

    k.visitCorona(42);
    const sculpture = k.plinto();
    expect(sculpture).toBeDefined();
    expect(sculpture!.arrivalTick).toBe(42);

    // Chosen model is a universe library model and not campus infrastructure
    expect(sculpture!.model).toBeTruthy();
    expect(sculpture!.model.startsWith('corona-')).toBe(false);

    // Located precisely at the plinto's top surface
    expect(sculpture!.x).toBeCloseTo(s.plinto!.x, 4);
    expect(sculpture!.y).toBeCloseTo(s.plinto!.y, 4);
    expect(sculpture!.z).toBeCloseTo(s.plinto!.z, 4);
    expect(sculpture!.yaw).toBeCloseTo(s.yaw, 4);

    // Scaled down if larger than the plinto (reduced to fit)
    expect(sculpture!.scale).toBeGreaterThan(0);
    expect(sculpture!.scale).toBeLessThanOrEqual(1.0);
  });

  it('changes the model between two visits', async () => {
    const k = await boot();
    await k.forms.wait('corona-galleria', 1);
    k.placeCampus();

    // First visit at tick 100
    k.visitCorona(100);
    const first = k.plinto();
    expect(first).toBeDefined();
    const model1 = first!.model;

    // Second visit at tick 200
    k.visitCorona(200);
    const second = k.plinto();
    expect(second).toBeDefined();
    const model2 = second!.model;

    // The model changes between visits!
    expect(model2).not.toBe(model1);
    expect(second!.arrivalTick).toBe(200);
    // Still stands exactly on top of the plinto
    expect(second!.x).toBeCloseTo(first!.x, 4);
    expect(second!.y).toBeCloseTo(first!.y, 4);
    expect(second!.z).toBeCloseTo(first!.z, 4);
  });

  it('keeps the door reachable from the avenue without extra collisions', async () => {
    const k = await boot();
    await k.forms.wait('corona-galleria', 1);
    k.placeCampus();

    k.visitCorona(77);

    const b = k.corona.building('galleria')!;
    const door = { x: b.door.x + 0.5, y: b.door.y + 0.5 };
    const out = k.corona.exitPoint(b);

    // From the avenue exit point to the door, every step along the line is free
    for (let i = 0; i <= 20; i++) {
      const stepX = out.x + ((door.x - out.x) * i) / 20;
      const stepY = out.y + ((door.y - out.y) * i) / 20;
      expect(k.corona.free(stepX, stepY)).toBe(true);
    }
    expect(k.corona.doorNear(door.x, door.y)?.id).toBe('galleria');
  });

  it('triggers visitCorona automatically on zone transition to corona', async () => {
    const k = await boot();
    await k.forms.wait('corona-galleria', 1);
    k.placeCampus();

    // Player starts at origin (sim zone)
    expect(k.zone).toBe('sim');
    expect(k.plinto()).toBeUndefined();

    // Deactivate carpet so wanderer is not pulled back to center
    k.carpet()!.active = false;
    Object.assign(k.playerPos(), { x: 46, y: 0 });
    k.tick(0.016);

    expect(k.zone).toBe('corona');
    const pl = k.plinto();
    expect(pl).toBeDefined();
    expect(pl!.arrivalTick).toBe(k.ticks);
  });
});
