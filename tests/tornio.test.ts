// T48a: The Sculptor's lathe in the Artist's gallery (galleria).
// A rotating pedestal on the ground floor where the chosen model turns;
// its MarkovJunior program executes step by step (intermediate snapshots from src/mj/run.ts);
// «<» «>» cycle through the library;
// the ui:tornio panel displays 4 3/4 photos from four sides, the Artist's vote and advice,
// the MarkovJunior XML program, and "Riscolpisci" button.

import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import { DEVICE_MARGIN, TORNIO_AT } from '../src/kernel/corona';
import { tornioExecute, tornioModels } from '../src/kernel/tornio';

const boot = () => Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });

function stand(k: Kernel, x: number, y: number): void {
  Object.assign(k.playerPos(), { x, y });
  k.zone = 'studio';
}

describe("the Sculptor's lathe (tornio)", () => {
  it('collects all models from the universe library in alphabetical order', async () => {
    const k = await boot();
    const models = tornioModels(k.repo.working, k.forms);

    expect(models.length).toBeGreaterThan(0);
    // Verified alphabetical sort
    for (let i = 1; i < models.length; i++) {
      expect(models[i].id.localeCompare(models[i - 1].id)).toBeGreaterThanOrEqual(0);
    }

    const first = models[0];
    expect(first.id).toBeTruthy();
    expect(first.name).toBeTruthy();
    expect(first.classe).toBeTruthy();
    expect(first.xml).toMatch(/<(model|sequence)/);
    expect(Array.isArray(first.consigli)).toBe(true);
    expect(Array.isArray(first.problemi)).toBe(true);
  });

  it('executes a model step-by-step from seed, ending in the final grid', async () => {
    const k = await boot();
    const models = tornioModels(k.repo.working, k.forms);
    // Find a lightweight model such as sasso or lampione
    const candidate = models.find((m) => m.id === 'sasso' || m.id === 'lampione') ?? models[0];

    const shown = tornioExecute(candidate, k.forms, 8, 42, 0, models.length);

    expect(shown.entry.id).toBe(candidate.id);
    expect(shown.count).toBe(models.length);
    expect(shown.snapshots.length).toBeGreaterThan(0);

    // The intermediate snapshots lead up to the final grid cells
    const lastSnapshot = shown.snapshots[shown.snapshots.length - 1];
    expect(lastSnapshot.cells).toEqual(shown.grid.cells);

    // 4 photos from 4 angles (fronte, destra, retro, sinistra)
    expect(shown.photos.length).toBe(4);
    for (const pic of shown.photos) {
      expect(pic.w).toBeGreaterThan(0);
      expect(pic.h).toBeGreaterThan(0);
      expect(pic.data.length).toBe(pic.w * pic.h * 4);
    }
  });

  it('stands in the middle of the Artist gallery with DEVICE_MARGIN clearance', async () => {
    const k = await boot();
    const b = k.corona.building('galleria')!;
    const f = b.floors[0];

    const lathe = f.items.find((i) => i.kind === 'tornio');
    expect(lathe).toBeDefined();
    expect(lathe!.x - f.ox).toBe(TORNIO_AT.x);
    expect(lathe!.y - f.oy).toBe(TORNIO_AT.y);
    expect(lathe!.w).toBe(3);
    expect(lathe!.h).toBe(3);

    // Navigation arrows next to the lathe
    const prevArrow = f.items.find((i) => i.kind === 'prev' && i.target === 'tornio');
    const nextArrow = f.items.find((i) => i.kind === 'next' && i.target === 'tornio');
    expect(prevArrow).toBeDefined();
    expect(nextArrow).toBeDefined();
    expect(prevArrow!.x - f.ox).toBe(TORNIO_AT.x - 1);
    expect(prevArrow!.y - f.oy).toBe(TORNIO_AT.y + 1);
    expect(nextArrow!.x - f.ox).toBe(TORNIO_AT.x + lathe!.w!);
    expect(nextArrow!.y - f.oy).toBe(TORNIO_AT.y + 1);

    // Collision: the 3x3 lathe blocks
    for (let x = lathe!.x; x < lathe!.x + lathe!.w!; x++) {
      for (let y = lathe!.y; y < lathe!.y + lathe!.h!; y++) {
        expect(k.corona.free(x + 0.5, y + 0.5), `blocked at ${x},${y}`).toBe(false);
      }
    }

    // Cells around the lathe are free (DEVICE_MARGIN clearance), excluding the arrow pillars
    const arrows = [prevArrow!, nextArrow!];
    for (let y = lathe!.y - DEVICE_MARGIN; y <= lathe!.y + lathe!.h! + DEVICE_MARGIN; y++) {
      for (let x = lathe!.x - DEVICE_MARGIN; x <= lathe!.x + lathe!.w! + DEVICE_MARGIN; x++) {
        // Skip outer boundary walls
        if (x <= f.ox || x >= f.ox + 23 || y <= f.oy || y >= f.oy + 14) continue;
        const isLathe = x >= lathe!.x && x < lathe!.x + lathe!.w! && y >= lathe!.y && y < lathe!.y + lathe!.h!;
        const isArrow = arrows.some((a) => a.x === x && a.y === y);
        if (!isLathe && !isArrow) {
          expect(k.corona.free(x + 0.5, y + 0.5), `free at ${x},${y}`).toBe(true);
        }
      }
    }
  });

  it('cycles through the library with stepTornio wrapping modulo count', async () => {
    const k = await boot();
    const count = k.tornioModels().length;
    expect(count).toBeGreaterThan(1);

    expect(k.tornioOf()!.index).toBe(0);

    // Step forward advances index
    k.stepTornio(1);
    expect(k.tornioOf()!.index).toBe(1);

    // Step backward wraps around to count - 1
    k.stepTornio(-1);
    expect(k.tornioOf()!.index).toBe(0);
    k.stepTornio(-1);
    expect(k.tornioOf()!.index).toBe(count - 1);

    // Step forward from count - 1 wraps to 0
    k.stepTornio(1);
    expect(k.tornioOf()!.index).toBe(0);
  });

  it('opens ui:tornio upon E interaction or click within reach', async () => {
    const k = await boot();
    const b = k.corona.building('galleria')!;
    const lathe = b.floors[0].items.find((i) => i.kind === 'tornio')!;

    const opened: unknown[] = [];
    k.bus.on('ui:tornio', (e) => opened.push(e));

    // Stand in front of the lathe (south side)
    stand(k, lathe.x + 1.5, lathe.y + lathe.h! + 0.5);
    await k.interact();
    expect(opened.length).toBe(1);

    // Click on the lathe within reach
    expect(k.clickStudio(lathe.x + 1.5, lathe.y + 1.5)).toBe(true);
    expect(opened.length).toBe(2);

    // Click from too far away fails
    stand(k, lathe.x + 1.5, lathe.y + lathe.h! + 6.0);
    expect(k.clickStudio(lathe.x + 1.5, lathe.y + 1.5)).toBe(false);
    expect(opened.length).toBe(2);
  });

  it('steps through the library when clicking navigation arrows', async () => {
    const k = await boot();
    const b = k.corona.building('galleria')!;
    const nextArrow = b.floors[0].items.find((i) => i.kind === 'next' && i.target === 'tornio')!;

    stand(k, nextArrow.x + 0.5, nextArrow.y + 1.0);
    expect(k.tornioOf()!.index).toBe(0);

    const stepped: unknown[] = [];
    k.bus.on('studio:tornio', (e) => stepped.push(e));

    expect(k.clickStudio(nextArrow.x + 0.5, nextArrow.y + 0.5)).toBe(true);
    expect(k.tornioOf()!.index).toBe(1);
    expect(stepped.length).toBe(1);
  });

  it('supports requesting resculpt for models on the lathe', async () => {
    const k = await boot();
    const shown = k.tornioOf()!;

    // Request resculpt directly with model target
    const ok = k.requestResculpt(`model:${shown.entry.id}`, 'piu slanciato');
    expect(ok).toBe(true);
  });
});
