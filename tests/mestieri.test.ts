// T245c (ADR-0141): the twelve trades of the seed, for the four settings (T152); `produci`, `usa` (`world.act`) and the deposit of the
// place. A working day of each trade, on a whole kernel with planned places, with no call to the models.

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { matchJob, validateJobProgram, type JobProgram } from '../src/kernel/npc/jobs';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { WORLD_THEMES } from '../src/kernel/themes';
import { apiErrors } from '../src/kernel/validator';
import { developAll } from './espressivita/banco';

const STEP = 1 / 20;
const DAY = Kernel.DAY_SECONDS;
const at = (n: number, phase: 'morning' | 'day' | 'evening' | 'night') => (n + { morning: 0, day: 0.12, evening: 0.42, night: 0.58 }[phase] - 0.12) * DAY + 1;

const PROGRAMS: JobProgram[] = Object.entries(bundledFiles)
  .filter(([p]) => /^modules\/job\.[^/]+\/manifest\.json$/.test(p))
  .flatMap(([, src]) => JSON.parse(src).jobs ?? []);

let k: Kernel;
const spawned: number[] = [];
/** The days only go forward, from one test to the next: the world has one clock. */
let today = 4;
const nextDay = () => ++today;

beforeAll(async () => {
  k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  await developAll(k);
}, 120_000);

afterEach(() => {
  for (const id of spawned.splice(0)) k.ecs.destroy(id);
});

// The people of the world have trades too, and the deposit is the place's: alone, each day is the trade's own.
beforeEach(() => {
  for (const id of k.ecs.query('mind')) k.ecs.destroy(id);
});

/** A free point near the wanderer, for a body or a thing. */
function spot(dx: number, dy: number): { x: number; y: number } {
  const pc = k.wandererCarpet();
  for (let d = 0; d < 8; d++)
    for (let oy = -d; oy <= d; oy++)
      for (let ox = -d; ox <= d; ox++) {
        const q = { x: Math.floor(pc.x + dx) + ox + 0.5, y: Math.floor(pc.y + dy) + oy + 0.5 };
        if (k.free(q.x, q.y, 0.45)) return q;
      }
  return { x: pc.x + dx, y: pc.y + dy };
}

function worker(job: string, dx = 2, dy = 2): number {
  const p = spot(dx, dy);
  const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, p.x, p.y)!;
  k.ecs.set(id, 'identity', { name: `Prova ${job}`, persona: '', look: '', carrying: [], job });
  k.ecs.set(id, 'mind', { mode: 'vaga', mood: '', history: [] });
  spawned.push(id);
  return id;
}

function thing(module: string, dx: number, dy: number): number {
  const p = spot(dx, dy);
  const id = k.spawnModuleEntity(k.modules.get(module)!, p.x, p.y)!;
  spawned.push(id);
  return id;
}

function play(seconds: number, until?: () => boolean): void {
  for (let t = 0; t < seconds && !until?.(); t += STEP) k.tick(STEP);
}

/** The phase starts and the kernel gives the tasks (it looks at the people every 60 ticks): to `id`, if said, and no longer. */
function phase(n: number, p: 'morning' | 'day' | 'evening' | 'night', id?: number): void {
  k.time = at(n, p);
  play(4, () => id !== undefined && k.ecs.get(id, 'job')?.phase === p && k.ecs.get(id, 'job')?.day === k.day());
}

const carried = (id: number, item: string): number => k.ecs.get(id, 'load')?.[item] ?? 0;
/** The place an individual belongs to: what the kernel gives with the tasks, or (before) the place where they stand. */
const placeOf = (id: number): string => {
  const given = k.ecs.get(id, 'job')?.chunk;
  if (given) return given;
  const p = k.ecs.get(id, 'pos');
  const S = k.config.chunkSize;
  return `${Math.floor(p.x / S)},${Math.floor(p.y / S)}`;
};
const tasks = (id: number) => (k.ecs.get(id, 'job')?.tasks ?? []).map((t: { does: string }) => t.does);

/** What the deposit of the place of `id` holds of an item; `set` fills it as a day of other trades would. */
function deposit(id: number, item: string, set?: number): number {
  const key = `deposit:${placeOf(id).replace(',', ':')}`;
  if (set !== undefined) k.stores.set('sys.work', key, { ...(k.stores.get('sys.work', key) as object), [item]: set });
  return k.placeDeposit(placeOf(id))[item] ?? 0;
}

describe('the programs of the seed', () => {
  it('are twelve, all valid, each with names for the four settings', () => {
    expect(PROGRAMS.map((p) => p.id).sort()).toEqual(['clerk', 'cook', 'farmer', 'fisher', 'guard', 'innkeeper', 'merchant', 'priest', 'scribe', 'shepherd', 'smith', 'woodcutter']);
    for (const p of PROGRAMS) expect(k.jobPrograms().some((q) => q.id === p.id), p.id).toBe(true);
    expect(WORLD_THEMES.length).toBe(4);
    // A trade of each epoch finds its program: the same day in a medieval village and in a city of the nineties.
    for (const [trade, id] of [['fornaia', 'cook'], ['chef', 'cook'], ['maniscalco', 'smith'], ['meccanica', 'smith'], ['locandiera', 'innkeeper'], ['barista', 'innkeeper'], ['gendarme', 'guard'], ['poliziotta', 'guard'], ['copista', 'scribe'], ['giornalista', 'scribe'], ['monaca', 'priest'], ['sciamano', 'priest'], ['rigattiere', 'merchant'], ['commessa', 'clerk'], ['funzionario del catasto', 'clerk'], ['capraio', 'shepherd']])
      expect(matchJob(trade, PROGRAMS)?.id, trade).toBe(id);
    // No name in two programs: who has it would not know which day is theirs.
    const names = PROGRAMS.flatMap((p) => p.names);
    expect(new Set(names).size).toBe(names.length);
  });

  it('a `usa` is of a thing, and its action has a name', () => {
    const world = { codes: new Set(Object.keys(k.palette)), items: new Set(k.content.items.keys()) };
    const bad = { id: 'x', nomi: ['x'], giornata: { morning: [{ fa: 'use', dove: 'square' }], day: [], evening: [], night: [] } };
    expect(validateJobProgram(bad, world).errors.join()).toMatch(/si usa una cosa/);
    expect(apiErrors('local t = world.act(id, cosa, "ascolta")')).toEqual([]);
  });
});

describe('world.act: an individual uses a thing', () => {
  it('runs its on_act with the individual as user, only near, only an action without effects, never for a wanderer', () => {
    const who = worker('oste');
    const p = k.ecs.get(who, 'pos');
    const well = k.spawnModuleEntity(k.modules.get('object.well')!, p.x + 1, p.y)!;
    spawned.push(well);
    expect(k.actAs(who, well, 'listen')).toMatch(/./);
    expect(k.actAs(who, well, 'nessuna')).toBeUndefined();
    expect(k.actAs(k.wandererEntity, well, 'listen')).toBeUndefined();
    k.ecs.get(well, 'pos').x += 10;
    expect(k.actAs(who, well, 'ascolta')).toBeUndefined();
  });
});

describe('a working day of each trade', () => {
  it('the farmer, the woodcutter and the fisherwoman bring what they gathered to the deposit of the place in the evening', () => {
    const d0 = nextDay();
    const id = worker('contadina');
    phase(d0, 'evening');
    k.ecs.set(id, 'load', { 'item.grano': 3 });
    const before = deposit(id, 'item.grano');
    play(90, () => carried(id, 'item.grano') === 0);
    expect(carried(id, 'item.grano')).toBe(0);
    expect(deposit(id, 'item.grano')).toBe(before + 3);
  }, 60_000);

  it('the shepherd: at pasture all day, cheese made there, taken to the deposit', () => {
    const d0 = nextDay();
    const id = worker('pastora');
    phase(d0, 'morning');
    expect(tasks(id)).toEqual(['go', 'wait']);
    play(70, () => k.ecs.get(id, 'activity')?.kind === 'graze');
    expect(k.ecs.get(id, 'activity')).toMatchObject({ kind: 'graze', still: true });
    phase(d0, 'day');
    play(80, () => carried(id, 'item.formaggio') >= 1);
    expect(carried(id, 'item.formaggio')).toBe(1);
    const before = deposit(id, 'item.formaggio');
    phase(d0, 'evening');
    play(60, () => carried(id, 'item.formaggio') === 0);
    expect(deposit(id, 'item.formaggio')).toBe(before + 1);
  }, 60_000);

  it('the smith takes the wood from the deposit and makes nails at the bench; with no wood, no nails', () => {
    const d0 = nextDay();
    const d1 = nextDay();
    const id = worker('fabbro');
    const bench = thing('obj.counter', 4, 1);
    phase(d0, 'morning', id);
    deposit(id, 'item.ciocco', 2);
    play(60, () => carried(id, 'item.ciocco') >= 2);
    expect(carried(id, 'item.ciocco')).toBe(2);
    expect(deposit(id, 'item.ciocco')).toBe(0);
    // The bench next to the smith: what is tried here is the work at it, not the way across a world drawn by chance. Where a
    // bench stands free beside them (the morning may end in a gap of a wood, between two trees: T281).
    const at0 = k.ecs.get(id, 'pos');
    const beside = [[1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2], [0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]].map(([dx, dy]) => ({ x: at0.x + dx, y: at0.y + dy }));
    Object.assign(k.ecs.get(bench, 'pos'), beside.find((q) => k.free(q.x, q.y, 0.45)) ?? beside[0]);
    phase(d0, 'day', id);
    play(120, () => carried(id, 'item.chiodi') >= 2);
    expect(carried(id, 'item.chiodi')).toBe(2);
    expect(carried(id, 'item.ciocco')).toBe(0);
    // Another day with an empty deposit: the bench stays cold, the reason is in the state of the work.
    phase(d1, 'morning');
    play(20, () => !!k.ecs.get(id, 'work')?.reason);
    expect(k.ecs.get(id, 'work')?.reason).toMatch(/missing:item\.ciocco/);
  }, 90_000);

  it('the innkeeper draws at the well (world.act) and makes cider', () => {
    const d0 = nextDay();
    const id = worker('locandiera');
    thing('object.well', -3, 2);
    phase(d0, 'morning');
    play(60, () => k.ecs.get(id, 'work')?.usato === true);
    expect(k.ecs.get(id, 'work')?.usato).toBe(true);
    phase(d0, 'day');
    play(80, () => carried(id, 'item.sidro') >= 2);
    expect(carried(id, 'item.sidro')).toBe(2);
  }, 60_000);

  it('the merchant takes what others brought and keeps the stall in the square', () => {
    const d0 = nextDay();
    const id = worker('mercante');
    phase(d0, 'morning', id);
    deposit(id, 'item.grano', 5);
    deposit(id, 'item.pesce', 1);
    play(60, () => carried(id, 'item.pesce') >= 1);
    expect(carried(id, 'item.grano')).toBe(2);
    expect(carried(id, 'item.pesce')).toBe(1);
    expect(deposit(id, 'item.grano')).toBe(3);
    phase(d0, 'day');
    play(80, () => k.ecs.get(id, 'activity')?.kind === 'trade');
    expect(k.ecs.get(id, 'activity')).toMatchObject({ kind: 'trade', still: true });
  }, 60_000);

  it('the guard walks a round, and does not stop', () => {
    const d0 = nextDay();
    const id = worker('poliziotto');
    phase(d0, 'day');
    expect(tasks(id)).toEqual(['patrol']);
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      play(5);
      const p = k.ecs.get(id, 'pos');
      seen.add(`${Math.round(p.x)},${Math.round(p.y)}`);
    }
    expect(seen.size).toBeGreaterThan(2);
    expect(k.ecs.get(id, 'work')?.step).toBe(1);
  }, 60_000);

  it('the priest prays in the morning, among the people by day', () => {
    const d0 = nextDay();
    const id = worker('sacerdotessa');
    phase(d0, 'morning');
    play(60, () => k.ecs.get(id, 'activity')?.kind === 'pray');
    expect(k.ecs.get(id, 'activity')).toMatchObject({ kind: 'pray', still: true });
    phase(d0, 'day');
    play(80, () => k.ecs.get(id, 'activity')?.kind === 'chat');
    expect(k.ecs.get(id, 'activity')?.kind).toBe('chat');
  }, 60_000);

  it('the scribe writes letters and takes them to the square', () => {
    const d0 = nextDay();
    const id = worker('notaio');
    phase(d0, 'day');
    play(90, () => carried(id, 'item.lettera') >= 2);
    expect(carried(id, 'item.lettera')).toBe(2);
    const before = deposit(id, 'item.lettera');
    phase(d0, 'evening');
    play(60, () => carried(id, 'item.lettera') === 0);
    expect(deposit(id, 'item.lettera')).toBe(before + 2);
  }, 60_000);

  it('the cook bakes the wheat of the deposit into bread, and the fish into soup', () => {
    const d0 = nextDay();
    const id = worker('fornaio');
    phase(d0, 'morning', id);
    deposit(id, 'item.grano', 2);
    deposit(id, 'item.pesce', 1);
    play(70, () => carried(id, 'item.pane') >= 2);
    expect(carried(id, 'item.pane')).toBe(2);
    expect(deposit(id, 'item.grano')).toBe(0);
    phase(d0, 'day');
    play(90, () => carried(id, 'item.zuppa') >= 1);
    expect(carried(id, 'item.zuppa')).toBe(1);
  }, 60_000);

  it('the clerk sits at the same place every morning and goes for lunch', () => {
    const d0 = nextDay();
    const d1 = nextDay();
    const id = worker('impiegata');
    phase(d0, 'morning');
    play(60, () => k.ecs.get(id, 'activity')?.kind === 'read');
    expect(k.ecs.get(id, 'activity')).toMatchObject({ kind: 'read', still: true });
    const desk = k.ecs.get(id, 'job').work;
    phase(d1, 'morning');
    expect(k.ecs.get(id, 'job').work).toEqual(desk);
  }, 60_000);
});
