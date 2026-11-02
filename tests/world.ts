// A world made ready for the tests of the kernel (kernel*.test.ts): the bundled universe, its places planned.

import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';

export const DT = 1 / 60;

export async function boot(models = new MockModels()) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models });
  await develop(k);
  return k;
}

/** Ticks until every loaded chunk has been planned by the Cartographer. */
export async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(DT);
    await settle(25);
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
  k.tick(DT);
}

export function run(k: Kernel, seconds: number) {
  for (let t = 0; t < seconds; t += DT) k.tick(DT);
}

export const settle = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Moves the player next to a run of free cells and faces right, so inscriptions always fit. */
export function clearArea(k: Kernel, width = 24) {
  const { ox, oy } = k.offset();
  const free = (c: number, r: number) => (k as any).freeCell(c, r) && !k.runeCells.has(`${c},${r}`) && k.tileAt(c, r) !== undefined && !k.buildingAt(c + 0.5, r + 0.5);
  for (let d = 0; d < 30; d++)
    for (const row of [d, -d]) {
      for (let col = -30; col < 0; col++) {
        let ok = true;
        for (let i = 0; i <= width && ok; i++) ok = free(col + i, row);
        if (!ok) continue;
        const p = k.playerPos();
        p.x = col + 0.5 - ox;
        p.y = row + 0.5 - oy;
        k.playerComp().facing = 'right';
        k.carpet()!.active = false;
        k.tick(DT);
        k.carpet()!.active = true;
        return { col, row };
      }
    }
  throw new Error('nessuno spazio libero trovato');
}

/** Runes are things the player carries: tests put them in the pouch first. */
export const giveRunes = (k: Kernel, tokens: string[]) => tokens.forEach((t) => k.give(`rune:${t}`, 1));

/** Stacks carried, in the pockets and inside bags (bags themselves not counted). */
export const carried = (k: Kernel) =>
  k.inventory().slots.reduce((n, s) => n + (!s ? 0 : k.content.get(s.item)?.container ? (s.inv?.slots.filter(Boolean).length ?? 0) : 1), 0);

export const spawnInFront = (k: Kernel, id: string, dist = 0.9) => {
  const pc = k.playerCarpet();
  k.playerComp().facing = 'right';
  return k.spawnModuleEntity(k.modules.get(id)!, pc.x + dist, pc.y);
};
