// Rough per-tick cost breakdown. Run with: npx vitest run tests/perf.bench.test.ts
import { it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';

it('perf', async () => {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models: new MockModels() });
  for (let i = 0; i < 40; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  const time = (label: string, f: () => void, n = 120) => {
    const t0 = performance.now();
    for (let i = 0; i < n; i++) f();
    console.log(label.padEnd(20), ((performance.now() - t0) / n).toFixed(3), 'ms');
  };
  time('tick', () => k.tick(1 / 60));
  for (const s of k.systems) time(`sys ${s.manifest.id}`, () => k.runModule(s.manifest.id, 'update', 1 / 60));
  time('genTiles', () => (k as any).genTiles(99, 99), 20);
  console.log('entities', k.ecs.count(), 'lines', k.lines.size, 'chunks', k.chunks.size);
});
