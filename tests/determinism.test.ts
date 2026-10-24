import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { Sandbox } from '../src/kernel/sandbox';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockModels } from '../src/kernel/ai/mock';
import type { Action } from '../src/kernel/input';
import type { FileMap } from '../src/kernel/types';
import { fakeHost } from './helpers';

/** A system that throws dice every tick for whoever wanders and for the wanderer: the dice are written on them. */
const DICE: FileMap = {
  'modules/sys.dadi/manifest.json':
    JSON.stringify({ id: 'sys.dadi', name: 'Dadi', kind: 'system', version: '0.1.0', description: 'Tira i dadi per chi vaga.', logic: 'logic.lua', order: 90 }, null, 2) + '\n',
  'modules/sys.dadi/logic.lua':
    'local M = {}\nfunction M.update(dt)\n  ecs.each("wander", function(id)\n    ecs.set(id, "dado", { v = math.random(1, 1000000) })\n  end)\n  local p = world.player()\n  if p then ecs.set(p, "dado", { v = math.random() }) end\nend\nreturn M\n',
};

/** Ticks until every loaded chunk has been planned (the offline models answer after a few ms). */
async function develop(k: Kernel) {
  for (let i = 0; i < 80; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
    if ([...k.chunks.values()].every((c) => c.stage !== 'draft')) break;
  }
}

/** What the world is: every entity (module, place, where it is, what the dice said), the people, the wanderer. */
function snapshot(k: Kernel) {
  const things = k.ecs
    .query('pos')
    .map((id) => {
      const p = k.ecs.get(id, 'pos');
      return [k.ecs.get(id, 'module')?.id ?? '', k.ecs.get(id, 'origin')?.key ?? '', p.x.toFixed(5), p.y.toFixed(5), k.ecs.get(id, 'identity')?.name ?? '', k.ecs.get(id, 'dado')?.v ?? ''].join('|');
    })
    .sort();
  return { things, player: k.playerPos(), carpet: k.offset(), time: k.time };
}

/** The same input, tick by tick: walking, stopping, turning. */
const SCRIPT: Array<[number, Action, boolean]> = [
  [0, 'right', true],
  [40, 'up', true],
  [70, 'right', false],
  [110, 'up', false],
  [120, 'left', true],
  [170, 'left', false],
];

function play(k: Kernel, ticks: number) {
  for (let t = 0; t < ticks; t++) {
    for (const [at, a, down] of SCRIPT) if (at === t) k.input.setHeld(a, down);
    k.tick(1 / 60);
  }
}

describe('shared seeds and determinism (T35)', () => {
  it('math.random of universe code draws what the kernel seeds, and randomseed() never reads the clock', async () => {
    const { host } = fakeHost();
    const sb = await Sandbox.create(host);
    sb.loadModule('d', 'local M = {} function M.roll() return math.random(1, 1000000) end function M.clock() math.randomseed() return math.random(1, 1000000) end return M');
    const roll = (seed: number) => {
      sb.seed(seed);
      return [sb.run('d', 'roll'), sb.run('d', 'roll'), sb.run('d', 'roll')];
    };
    const a = roll(42);
    expect(roll(42)).toEqual(a);
    expect(roll(43)).not.toEqual(a);
    // Without arguments it is a fixed seed, not the time of the machine.
    const other = await Sandbox.create(fakeHost().host);
    other.loadModule('d', 'local M = {} function M.clock() math.randomseed() return math.random(1, 1000000) end return M');
    expect(sb.run('d', 'clock')).toBe(other.run('d', 'clock'));
  });

  it('two kernels with the same universe and the same input reach the same state after N ticks', async () => {
    const files = { ...bundledFiles, ...DICE };
    const a = await Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
    const b = await Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
    // The generation is asynchronous: both worlds are planned before they start to live.
    await develop(a);
    await develop(b);
    const before = snapshot(a);
    expect(snapshot(b)).toEqual(before);
    play(a, 240);
    play(b, 240);
    const sa = snapshot(a);
    expect(snapshot(b)).toEqual(sa);
    // The dice were thrown, the wanderer moved, people lived.
    expect(a.ecs.get(a.playerId, 'dado')?.v).toBeGreaterThan(0);
    expect(sa.things.filter((t) => t.split('|')[5] !== '').length).toBeGreaterThan(1);
    expect(sa.carpet).not.toEqual(before.carpet);
    expect(sa.things.filter((t) => !before.things.includes(t)).length).toBeGreaterThan(1);
  });

  it('the dice of a tick depend on the seed of the universe', async () => {
    const files = { ...bundledFiles, ...DICE };
    const other = { ...files, 'universe.json': JSON.stringify({ ...JSON.parse(files['universe.json']), seed: 12345 }) };
    const a = await Kernel.boot({ files, store: memoryStore(), models: new MockModels() });
    const b = await Kernel.boot({ files: other, store: memoryStore(), models: new MockModels() });
    a.tick(1 / 60);
    b.tick(1 / 60);
    expect(a.ecs.get(a.playerId, 'dado')?.v).not.toBe(b.ecs.get(b.playerId, 'dado')?.v);
  });
});
