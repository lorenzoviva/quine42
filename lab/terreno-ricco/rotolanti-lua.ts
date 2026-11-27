// T509: where the time of a Lua system that rolls things in the wind goes (lab/terreno-ricco/misura.ts measures the whole): 32 entities
// with `drift` on the seed with the wind of T484, the tick with the system minus the tick without, for four bodies of the same loop.
//   npx vite-node lab/terreno-ricco/rotolanti-lua.ts
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { DEFAULT_NATURE } from '../../src/kernel/nature';
import type { FileMap } from '../../src/kernel/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BODIES: Record<string, string> = {
  'solo ecs.each': 'local x = p.x',
  'ecs.each e due world.free': 'if world.free(p.x + 0.01, p.y, b.r, p.z) then end; if world.free(p.x, p.y + 0.01, b.r, p.z) then end',
  'ecs.each e world.wind': 'local w = world.wind(p.x, p.y)',
  'ecs.each e scrivere pos': 'p.x = p.x + 0.0001',
  'il sistema intero': 'local w = world.wind(p.x, p.y); if not w or w.speed < 0.05 then return end; local nx, ny = p.x + w.vx * 2.5 * dt, p.y + w.vy * 2.5 * dt; if world.free(nx, p.y, b.r, p.z) then p.x = nx end; if world.free(p.x, ny, b.r, p.z) then p.y = ny end',
};
async function tick(body?: string, n = 32): Promise<number> {
  const cfg = JSON.parse(bundledFiles['universe.json']!);
  const files: FileMap = {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, automata: [{ id: 'wind', family: 'wind', cell: 1, hz: 10, prevailing: [0.075, 0.02], layerHeight: 32 }] } }),
    ...(body ? { 'modules/sys.prova/manifest.json': JSON.stringify({ id: 'sys.prova', name: 'Prova', kind: 'system', version: '0.1.0', logic: 'logic.lua', order: 26 }), 'modules/sys.prova/logic.lua': `local M = {}\nfunction M.update(dt)\n  ecs.each("drift, pos, body", function(id, d, p, b)\n    ${body}\n  end)\nend\nreturn M\n` } : {}),
  };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 240 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await sleep(5);
  }
  for (let i = 0; i < n; i++) k.ecs.spawn({ pos: { x: (i % 8) - 4, y: Math.floor(i / 8) - 2 }, body: { r: 0.3, solid: false }, drift: { k: 1 } });
  for (let i = 0; i < 120; i++) k.tick(1 / 60);
  let t = 0;
  for (let i = 0; i < 600; i++) {
    const t0 = performance.now();
    k.tick(1 / 60);
    t += performance.now() - t0;
  }
  return t / 600;
}
const base = await tick();
console.log(`il tick senza sistema, 32 entità: ${base.toFixed(3)} ms`);
for (const [name, body] of Object.entries(BODIES)) {
  const ms = await tick(body);
  console.log(`${name}: +${(ms - base).toFixed(3)} ms a tick, ${(((ms - base) / 32) * 1000).toFixed(0)} µs a entità`);
}
process.exit(0);
