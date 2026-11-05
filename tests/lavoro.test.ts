// T245b (ADR-0140): the trades. A program of a trade is data, validated by reference; sys.lavoro carries out its day; the field changes
// for real, with no call to the models. On a whole kernel with planned places (what the bench of T183 could not do).

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { matchJob, normalTrade, validateJobProgram, type JobProgram } from '../src/kernel/jobs';
import { Kernel } from '../src/kernel/kernel';
import { findRoute } from '../src/kernel/route';
import { memoryStore } from '../src/kernel/repo';
import { apiErrors } from '../src/kernel/validator';
import { developAll } from './espressivita/banco';

const STEP = 1 / 20;
const DAY = Kernel.DAY_SECONDS;
/** A phase of day `n` (`dayPhase`, `Kernel.day`): a day begins inside its morning, at 0, and the morning lasts until 0.12. */
const at = (n: number, phase: 'mattina' | 'giorno' | 'sera' | 'notte') => (n + { mattina: 0, giorno: 0.12, sera: 0.42, notte: 0.58 }[phase] - 0.12) * DAY + 1;

const seedPrograms = (): JobProgram[] =>
  Object.entries(bundledFiles)
    .filter(([p]) => /^modules\/lavoro\.[^/]+\/manifest\.json$/.test(p))
    .flatMap(([, src]) => JSON.parse(src).mestieri ?? []);

async function world(): Promise<Kernel> {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
  await developAll(k);
  return k;
}

/** An individual with a trade, near the wanderer, in a planned place. */
function worker(k: Kernel, job: string, dx = 2, dy = 2): number {
  const pc = k.wandererCarpet();
  // Where the body fits: the nearest free point to the one asked for.
  let spot = { x: pc.x + dx, y: pc.y + dy };
  search: for (let d = 0; d < 6; d++)
    for (let oy = -d; oy <= d; oy++)
      for (let ox = -d; ox <= d; ox++) {
        const q = { x: Math.floor(pc.x + dx) + ox + 0.5, y: Math.floor(pc.y + dy) + oy + 0.5 };
        if (k.free(q.x, q.y, 0.4)) {
          spot = q;
          break search;
        }
      }
  const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, spot.x, spot.y)!;
  k.ecs.set(id, 'identity', { name: `Prova ${job}`, persona: '', look: '', carrying: [], job });
  k.ecs.set(id, 'mind', { mode: 'vaga', mood: '', history: [] });
  return id;
}

function play(k: Kernel, seconds: number, until?: () => boolean): void {
  for (let t = 0; t < seconds && !until?.(); t += STEP) k.tick(STEP);
}

/** How many tiles of a code within r of a point. */
function count(k: Kernel, code: string, x: number, y: number, r = 12): number {
  let n = 0;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (k.tileAt(Math.floor(x) + dx, Math.floor(y) + dy) === code) n++;
  return n;
}

describe('the programs of the trades', () => {
  const world0 = () => {
    const terrain = JSON.parse(bundledFiles['modules/world.terrain/manifest.json']).tiles;
    const items = new Set(Object.entries(bundledFiles).filter(([p]) => p.endsWith('manifest.json')).flatMap(([, src]) => (JSON.parse(src).items ?? []).map((i: { id: string }) => i.id)));
    return { codes: new Set(Object.keys(terrain)), items };
  };

  it('the three of the seed are valid, by reference to the tiles and the items of the universe', () => {
    const programs = seedPrograms();
    expect(programs.map((p) => p.id).sort()).toEqual(expect.arrayContaining(['boscaiolo', 'contadino', 'pescatore']));
    for (const p of programs) expect(validateJobProgram(p, world0()).errors, p.id).toEqual([]);
  });

  it('a task outside the closed list, a tile or an item that does not exist, a duration out of range: refused with the reason', () => {
    const bad = {
      id: 'mago',
      nomi: ['mago'],
      giornata: { mattina: [{ fa: 'vola' }, { fa: 'trasforma', da: 'g', a: '§' }, { fa: 'raccogli', casella: 'g', oggetto: 'item.oro' }, { fa: 'aspetta', durata: 9000 }], giorno: [], sera: [{ fa: 'vai', dove: 'luna' }], notte: [] },
    };
    const { program, errors } = validateJobProgram(bad, world0());
    expect(program).toBeUndefined();
    expect(errors.join('\n')).toMatch(/vola.*non è un comportamento/);
    expect(errors.join('\n')).toMatch(/§.*non è un terreno/);
    expect(errors.join('\n')).toMatch(/item\.oro.*non è un oggetto/);
    expect(errors.join('\n')).toMatch(/durata fuori/);
    expect(errors.join('\n')).toMatch(/luna.*non è un posto/);
  });

  it('a trade finds its program by name, then by a word of it; otherwise none, and the individual lives as before', () => {
    const programs = seedPrograms();
    expect(normalTrade('La Contadina')).toBe('contadina');
    expect(matchJob('contadina', programs)?.id).toBe('contadino');
    expect(matchJob('il boscaiolo del Rovo', programs)?.id).toBe('boscaiolo');
    expect(matchJob('Pescatrice di lago', programs)?.id).toBe('pescatore');
    expect(matchJob('sarto', programs)).toBeUndefined();
    expect(matchJob(undefined, programs)).toBeUndefined();
  });
});

describe('the way between two tiles', () => {
  const wall = (c: number, r: number) => c >= 0 && c < 10 && r >= 0 && r < 10 && !(c === 5 && r < 8);

  it('goes around what is in the way, without cutting corners', () => {
    const way = findRoute([2, 2], [8, 2], wall)!;
    expect(way[0]).toEqual([2, 2]);
    expect(way.at(-1)).toEqual([8, 2]);
    expect(way.every(([c, r]) => wall(c, r))).toBe(true);
    expect(way.some(([, r]) => r >= 8)).toBe(true);
  });

  it('a goal that is not passable is reached next to it; no way, no answer', () => {
    const way = findRoute([2, 2], [5, 3], wall)!;
    expect(Math.max(Math.abs(way.at(-1)![0] - 5), Math.abs(way.at(-1)![1] - 3))).toBe(1);
    expect(findRoute([2, 2], [8, 2], (c, r) => wall(c, r) && r < 8)).toBeUndefined();
  });

  it('world.path and world.find_tile are in the API of Lua', () => {
    expect(apiErrors('local q = world.path(0, 0, 3, 3)\nlocal t = world.find_tile("g", 0, 0, 5)')).toEqual([]);
  });
});

describe('a day of work, in a planned place', () => {
  it('a farmer ploughs the meadow in the morning and sows the furrows by day; the sown field ripens; she reaps the wheat', async () => {
    const k = await world();
    k.time = at(2, 'mattina');
    const id = worker(k, 'contadina');
    // The kernel looks at the people once a second of ticks (60 of them).
    play(k, 4);
    const m = k.ecs.get(id, 'mestiere');
    expect(m).toMatchObject({ id: 'contadino', fase: 'mattina' });
    const site = m.lavoro ?? k.ecs.get(id, 'pos');
    const meadow = count(k, 'g', site.x, site.y);
    const ploughed = count(k, 'm', site.x, site.y);
    play(k, 60, () => count(k, 'g', site.x, site.y) <= meadow - 2);
    expect(count(k, 'g', site.x, site.y)).toBeLessThan(meadow);
    expect(count(k, 'm', site.x, site.y)).toBeGreaterThan(ploughed);
    // By day: the furrows are sown.
    k.time = at(2, 'giorno');
    play(k, 60, () => count(k, 'e', site.x, site.y) >= 2);
    const sown = count(k, 'e', site.x, site.y);
    expect(sown).toBeGreaterThanOrEqual(1);
    // A day later the sown field is ripe wheat, by itself (the kernel, `matura`).
    k.time = at(3, 'mattina');
    play(k, 4);
    expect(count(k, 'u', site.x, site.y)).toBeGreaterThanOrEqual(sown);
    // And by day she reaps it: wheat in what she carries, the field ploughed again.
    k.time = at(3, 'giorno');
    play(k, 120, () => (k.ecs.get(id, 'carico')?.['item.grano'] ?? 0) >= 1);
    expect(k.ecs.get(id, 'carico')?.['item.grano']).toBeGreaterThanOrEqual(1);
  }, 120_000);

  it('a woodcutter fells a tree, takes the log, and leaves a stump that grows back into the wood in three days', async () => {
    const k = await world();
    k.time = at(2, 'mattina');
    const pc = k.wandererCarpet();
    const [c, r] = [Math.floor(pc.x) + 4, Math.floor(pc.y) + 4];
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) expect(k.setTile(c + dx, r + dy, 't')).toBe(true);
    const id = worker(k, 'taglialegna', 2, 2);
    play(k, 4);
    expect(k.ecs.get(id, 'mestiere')).toMatchObject({ id: 'boscaiolo' });
    play(k, 70, () => (k.ecs.get(id, 'carico')?.['item.ciocco'] ?? 0) >= 1);
    expect(k.ecs.get(id, 'carico')?.['item.ciocco']).toBeGreaterThanOrEqual(1);
    const stumps = count(k, 'x', c, r, 3);
    expect(stumps).toBeGreaterThanOrEqual(1);
    k.time = at(4, 'mattina');
    play(k, 4);
    expect(count(k, 'x', c, r, 3)).toBe(stumps);
    k.time = at(5, 'mattina');
    play(k, 4);
    expect(count(k, 'x', c, r, 3)).toBeLessThan(stumps);
  }, 120_000);

  it('a fisherwoman goes to the bank and fishes: fish in what she carries, the water as it was', async () => {
    const k = await world();
    k.time = at(2, 'mattina');
    const pc = k.wandererCarpet();
    const [c, r] = [Math.floor(pc.x) - 5, Math.floor(pc.y) + 3];
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) expect(k.setTile(c + dx, r + dy, 'w')).toBe(true);
    const id = worker(k, 'pescatrice', -2, 2);
    play(k, 4);
    expect(k.ecs.get(id, 'mestiere')).toMatchObject({ id: 'pescatore' });
    play(k, 70, () => (k.ecs.get(id, 'carico')?.['item.pesce'] ?? 0) >= 1);
    expect(k.ecs.get(id, 'carico')?.['item.pesce']).toBeGreaterThanOrEqual(1);
    expect(count(k, 'w', c, r, 1)).toBe(4);
    expect(k.ecs.get(id, 'attivita')?.tipo).toBe('pesca');
  }, 120_000);

  it('in the evening to the square, at night home; who follows the wanderer stops working and lives as before', async () => {
    const k = await world();
    k.time = at(2, 'sera');
    const id = worker(k, 'contadino');
    play(k, 4);
    expect(k.ecs.get(id, 'mestiere')).toMatchObject({ fase: 'sera' });
    expect(k.ecs.get(id, 'mestiere').compiti.map((t: { fa: string }) => t.fa)).toEqual(['vai', 'porta', 'chiacchiera']);
    k.time = at(2, 'notte');
    play(k, 4);
    expect(k.ecs.get(id, 'mestiere').compiti.map((t: { fa: string }) => t.fa)).toEqual(['vai', 'riposa']);
    k.ecs.get(id, 'mind').mode = 'segui';
    play(k, 4);
    expect(k.ecs.get(id, 'mestiere')).toBeUndefined();
  }, 120_000);

  it('the day of every edit is in the plan of its place, and the edits of before (without one) ripen from today', async () => {
    const k = await world();
    k.time = at(2, 'giorno');
    const pc = k.wandererCarpet();
    const [c, r] = [Math.floor(pc.x) + 3, Math.floor(pc.y) - 3];
    expect(k.setTile(c, r, 'e')).toBe(true);
    const ch = [...k.chunks.values()].find((x) => x.plan?.giorni && Object.values(x.plan.edits ?? {}).includes('e'))!;
    const idx = Object.entries(ch.plan!.edits!).find(([, code]) => code === 'e')![0];
    expect(ch.plan!.giorni![idx]).toBe(2);
    // A plan of before: the edit without its day. It counts from the first look.
    delete ch.plan!.giorni![idx];
    k.time = at(3, 'mattina');
    play(k, 4);
    expect(k.tileAt(c, r)).toBe('e');
    expect(ch.plan!.giorni![idx]).toBe(3);
    k.time = at(4, 'mattina');
    play(k, 4);
    expect(k.tileAt(c, r)).toBe('u');
  }, 120_000);
});
