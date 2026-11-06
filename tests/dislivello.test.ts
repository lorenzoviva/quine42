// T299: the way goes where a body walks. In the check of T280 a walker stopped on a rise: the way (`findRoute`) looked at each tile by
// itself, a box in its middle, and a rise of a model higher than a step (a platform, a thin wall) standing on the edge between two
// tiles is in neither box; walking (`free` along the way, as `stepWanderer` and `sys.wander` do) meets it, and stops. Now a step of
// the way is taken only where the body passes between the two middles; the walker heads for the farthest point of the way it reaches
// in a straight line; a goal no way reaches is reached as near as one gets, and one with nothing near makes the task fail at once
// (`fallito:nessuna via`): the day goes on with the next task. No call to the models.

import { describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { bundledFiles } from '../src/kernel/bundle';
import { MemoryChunks } from '../src/kernel/chunks';
import { type FormComp } from '../src/kernel/forms';
import { Kernel, ROUTE_NEAR } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import { findRoute, type Cell } from '../src/kernel/route';
import type { FileMap } from '../src/kernel/types';
import { developAll } from './espressivita/banco';

const STEP = 1 / 20;
const DAY = Kernel.DAY_SECONDS;
const at = (n: number, phase: 'morning' | 'day' | 'evening' | 'night') => (n + { morning: 0, day: 0.12, evening: 0.42, night: 0.58 }[phase] - 0.12) * DAY + 1;

describe('the way, tile by tile and step by step', () => {
  const open = (c: number, r: number) => c >= 0 && c < 10 && r >= 0 && r < 10;

  it('a step the body cannot take (a rise on the edge between two free tiles) is gone round, not through', () => {
    // A rise along the edge between columns 4 and 5, from row 0 to row 7: every tile is free, the step across is not.
    const edge = (c: number, r: number, nc: number) => !(Math.min(c, nc) === 4 && Math.max(c, nc) === 5 && r < 8);
    const step = (c: number, r: number, nc: number, nr: number) => edge(c, r, nc) && edge(c, nr, nc);
    const blind = findRoute([2, 2], [8, 2], open)!;
    expect(blind.length).toBe(7);
    const way = findRoute([2, 2], [8, 2], open, step)!;
    expect(way.at(-1)).toEqual([8, 2]);
    for (let i = 1; i < way.length; i++) expect(step(way[i - 1][0], way[i - 1][1], way[i][0], way[i][1])).toBe(true);
    expect(way.some(([, r]) => r >= 8)).toBe(true);
  });

  it('a goal no way reaches: as near as one gets within `near`, else no way', () => {
    // The goal in the middle of a solid block 5 × 5: its nearest free tiles are 3 away.
    const block = (c: number, r: number) => open(c, r) && !(c >= 3 && c <= 7 && r >= 3 && r <= 7);
    expect(findRoute([0, 5], [5, 5], block)).toBeUndefined();
    expect(findRoute([0, 5], [5, 5], block, undefined, 2.5)).toBeUndefined();
    const near = findRoute([0, 5], [5, 5], block, undefined, 3)!;
    expect(near.at(-1)).toEqual([2, 5]);
    // A block 3 × 3: the goal's middle is 2 away from a free tile.
    const small = (c: number, r: number) => open(c, r) && !(c >= 4 && c <= 6 && r >= 4 && r <= 6);
    expect(findRoute([0, 5], [5, 5], small, undefined, ROUTE_NEAR)!.at(-1)).toEqual([3, 5]);
  });
});

// A model of the class `structure` (5 × 5 × 4 tiles, 20 voxels a tile) that is all a rise: a platform 10 voxels high (half a tile, a step
// is 4) over the tiles east of the middle one, its edge on the edge of two tiles. With `scala`, along its northern row, steps 2 voxels
// apart that go up to it from the west: good steps. With `chiusa`, the platform is the whole model, with no stair.
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  `  <box at="${(x0 + x1) / 2} ${(y0 + y1) / 2} ${z0}" size="${x1 - x0 + 1} ${y1 - y0 + 1} ${z1 - z0 + 1}" color="S"/>`;
const platform = (kind: 'scala' | 'chiusa') => `<sequence values="BS" name="Platea">
  <color symbol="S" value="8a8070" name="pietra"/>
${kind === 'chiusa' ? box(0, 99, 0, 99, 0, 9) : [box(60, 99, 0, 99, 0, 9), ...[1, 3, 5, 7].map((h, i) => box(44 + 4 * i, 47 + 4 * i, 0, 19, 0, h))].join('\n')}
</sequence>`;

const files = () => {
  const index = JSON.parse(bundledFiles['models/index.json']!);
  index['platea-scala'] = { classe: 'structure', nome: 'platea con la scala' };
  index['platea-chiusa'] = { classe: 'structure', nome: 'platea senza scala' };
  return { ...bundledFiles, 'models/platea-scala.xml': platform('scala'), 'models/platea-chiusa.xml': platform('chiusa'), 'models/index.json': JSON.stringify(index) };
};

/** A kernel with the platform on a clear patch of flat ground (its 5 × 5 tiles and a column west of it), its middle at the middle of a tile. */
async function scene(model: 'platea-scala' | 'platea-chiusa') {
  const k = await Kernel.boot({ files: files(), store: memoryStore(), ai: new MockAiModels() });
  await developAll(k);
  k.carpet()!.active = false;
  for (const id of k.ecs.query('mind')) k.ecs.destroy(id);
  let spot: [number, number] | undefined;
  const S = k.config.chunkSize;
  const tiles = [...k.chunks.values()].filter((ch) => ch.stage === 'planned').flatMap((ch) => Array.from({ length: S * S }, (_, i) => [ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S)]));
  tiles.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]) || a[1] - b[1] || a[0] - b[0]);
  for (const [x, y] of tiles) {
    if (spot) break;
    {
      let ok = true;
      const g = k.groundAt(x + 0.5, y + 0.5);
      for (let dy = -2; dy <= 2 && ok; dy++)
        for (let dx = -3; dx <= 2 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.45) && k.groundAt(x + dx + 0.5, y + dy + 0.5) === g && !!k.chunkAt(x + dx, y + dy)?.plan;
      if (ok) spot = [x, y];
    }
  }
  expect(spot).toBeDefined();
  const [c, r] = spot!;
  const id = k.spawnModuleEntity(k.modules.get('object.well')!, c + 0.5, r + 0.5, undefined, `test#${model}`);
  Object.assign(k.ecs.get(id, 'form') as FormComp, { model, seed: 1, yaw: 0 });
  expect((await k.forms.wait(model, 1))?.status).toBe('ready');
  k.tick(1 / 60);
  return { k, c, r, ground: k.groundAt(c + 0.5, r + 0.5) };
}

const kernelOf = (k: Kernel) =>
  k as unknown as {
    routeStep(x: number, y: number, tx: number, ty: number, r?: number): { x: number; y: number } | undefined;
    walkable(x0: number, y0: number, x1: number, y1: number, r: number): boolean;
  };

/** A body that walks as sys.wander does (axis by axis, `free` at the height of its feet) toward a point, a tick at a time. */
function stepToward(k: Kernel, p: { x: number; y: number; z?: number }, to: { x: number; y: number }, r = 0.35, v = 0.05): void {
  const dx = to.x - p.x, dy = to.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return;
  const ux = (dx / d) * Math.min(v, d), uy = (dy / d) * Math.min(v, d);
  if (k.free(p.x + ux, p.y, r, p.z)) p.x += ux;
  if (k.free(p.x, p.y + uy, r, p.z)) p.y += uy;
  p.z = k.floorAt(p.x, p.y, p.z);
}

describe('a rise of a model, in the kernel', () => {
  it('the case of T280: two free tiles, a rise between them; the way of before goes straight and the walk stops there, the way now goes up the stair', async () => {
    const { k, c, r, ground } = await scene('platea-scala');
    // West of the platform and on it, in the middle row: both free, the edge between them a rise of half a tile.
    const from: Cell = [c - 1, r];
    const goal: Cell = [c + 2, r];
    expect(k.free(c + 0.5, r + 0.5, 0.35) && k.free(c + 1.5, r + 0.5, 0.35)).toBe(true);
    expect(k.floorAt(c + 1.5, r + 0.5) - ground).toBeCloseTo(0.5);
    expect(kernelOf(k).walkable(c + 0.5, r + 0.5, c + 1.5, r + 0.5, 0.35)).toBe(false);
    // The way of before: tile by tile, straight across the edge. Walking it stops at the edge.
    const blind = findRoute(from, goal, (cc, rr) => k.free(cc + 0.5, rr + 0.5, 0.3))!;
    expect(blind.map(([, rr]) => rr)).toEqual([r, r, r, r]);
    const p: { x: number; y: number; z?: number } = { x: c - 0.5, y: r + 0.5, z: ground };
    for (let i = 1; i < blind.length; i++) for (let t = 0; t < 60; t++) stepToward(k, p, { x: blind[i][0] + 0.5, y: blind[i][1] + 0.5 });
    expect(p.x).toBeLessThan(c + 1);
    // Now: the way goes round, by the stair on the northern row, and a body that follows it gets up there.
    const q: { x: number; y: number; z?: number } = { x: c - 0.5, y: r + 0.5, z: ground };
    const rows = new Set<number>();
    for (let t = 0; t < 2000 && Math.hypot(q.x - (c + 2.5), q.y - (r + 0.5)) > 0.4; t++) {
      const next = kernelOf(k).routeStep(q.x, q.y, c + 2.5, r + 0.5, 0.35);
      expect(next).toBeDefined();
      stepToward(k, q, next!);
      rows.add(Math.floor(q.y));
    }
    expect(Math.hypot(q.x - (c + 2.5), q.y - (r + 0.5))).toBeLessThanOrEqual(0.4);
    expect(q.z! - ground).toBeCloseTo(0.5);
    // By the stair: two tiles north of the middle row, where the steps are.
    expect(rows.has(r - 2)).toBe(true);
    // And down again by the same steps.
    for (let t = 0; t < 2000 && Math.hypot(q.x - (c - 0.5), q.y - (r + 0.5)) > 0.4; t++) stepToward(k, q, kernelOf(k).routeStep(q.x, q.y, c - 0.5, r + 0.5, 0.35)!);
    expect(Math.hypot(q.x - (c - 0.5), q.y - (r + 0.5))).toBeLessThanOrEqual(0.4);
    expect(q.z! - ground).toBeCloseTo(0);
  }, 60_000);

  it('a villager with a trade walks up there by the stair (sys.wander, sys.lavoro); with a platform that has none, she gives up at once and the day goes on', async () => {
    for (const model of ['platea-scala', 'platea-chiusa'] as const) {
      const { k, c, r, ground } = await scene(model);
      const id = k.spawnModuleEntity(k.modules.get('npc.villager')!, c - 2.5, r + 0.5)!;
      k.ecs.set(id, 'identity', { name: 'Prova', persona: '', look: '', carrying: [], job: 'fabbro' });
      k.ecs.set(id, 'mind', { mode: 'vaga', mood: '', history: [] });
      k.time = at(3, 'morning');
      for (let t = 0; t < 4 && !k.ecs.get(id, 'mestiere'); t += STEP) k.tick(STEP);
      const m = k.ecs.get(id, 'mestiere');
      expect(m).toBeDefined();
      // Her work this morning: up on the platform (with no stair, in its middle: 3 tiles from any she can stand on), then a while at the bench.
      const work = model === 'platea-scala' ? { x: c + 2.5, y: r + 0.5 } : { x: c + 0.5, y: r + 0.5 };
      Object.assign(m, { work, compiti: [{ does: 'go', where: 'work' }, { does: 'wait', duration: 30 }] });
      k.ecs.set(id, 'lavoro', { fase: m.fase, giorno: m.giorno, passo: 1 });
      const p = k.ecs.get(id, 'pos');
      let took = 0;
      for (; took < 40 && (k.ecs.get(id, 'lavoro')?.passo ?? 1) < 2; took += STEP) k.tick(STEP);
      const s = k.ecs.get(id, 'lavoro');
      if (model === 'platea-scala') {
        expect(s.passo, JSON.stringify(s)).toBe(2);
        expect(s.motivo).toBeUndefined();
        expect(Math.hypot(p.x - work.x, p.y - work.y)).toBeLessThan(1.3);
        expect(k.floorAt(p.x, p.y) - ground).toBeCloseTo(0.5);
      } else {
        // No way and nothing near it: the task fails with its reason within a second, she does not push at the edge for long.
        expect(s.passo).toBe(2);
        expect(s.motivo).toBe('failed:no_way');
        expect(took).toBeLessThan(1.5);
        expect(k.floorAt(p.x, p.y) - ground).toBeCloseTo(0);
        // The day goes on: the next task, a while at work where she is.
        for (let t = 0; t < 1; t += STEP) k.tick(STEP);
        expect(k.ecs.get(id, 'lavoro').passo).toBe(2);
        expect(k.ecs.get(id, 'attivita')).toMatchObject({ tipo: 'work', ferma: true });
      }
    }
  }, 120_000);
});

function setPeople(k: Kernel, list: Array<{ nome: string; mestiere: string; origine: string }>): void {
  const src = JSON.stringify({ persone: list.map((p) => ({ tipo: 'npc.villager', routine: [], famiglia: [], ...p })), attesi: [] }, null, 2) + '\n';
  (k as unknown as { repo: { write(p: string, s: string): void } }).repo.write('world/people.json', src);
  (k as unknown as { files: FileMap }).files = { ...k.files, 'world/people.json': src };
}

const loaded = (k: Kernel, key: string) => k.chunks.get(key)?.stage === 'planned';

/** The middle of the free tile nearest to a point, within 4 tiles. */
function free(k: Kernel, x: number, y: number, r: number): { x: number; y: number } | undefined {
  for (let d = 0; d <= 4; d++)
    for (let dy = -d; dy <= d; dy++)
      for (let dx = -d; dx <= d; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
        const q = { x: Math.floor(x) + dx + 0.5, y: Math.floor(y) + dy + 0.5 };
        if (k.free(q.x, q.y, r)) return q;
      }
  return undefined;
}

describe('on a whole world', () => {
  it('every step a way may take between two tiles, a walk takes; the tiles alone let through some no walk takes (furniture, a wall on an edge)', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks: new MemoryChunks() });
    await developAll(k);
    const step = (k as unknown as { stepFree(c: number, r: number, nc: number, nr: number, body: number): boolean }).stepFree.bind(k);
    const S = k.config.chunkSize;
    const body = 0.35;
    /** The walk of `stepWanderer`: a tenth of a tile at a time, axis by axis, the feet on the floor under them. */
    const walks = (ax: number, ay: number, bx: number, by: number) => {
      let x = ax, y = ay;
      let z: number | undefined = k.floorAt(x, y);
      for (let i = 1; i <= 15; i++) {
        const tx = (bx - ax) / 10, ty = (by - ay) / 10;
        const stuck = !k.free(x, y, body, z);
        if (Math.abs(bx - x) > 1e-9 && (stuck || k.free(x + tx, y, body, z))) x += tx;
        if (Math.abs(by - y) > 1e-9 && (stuck || k.free(x, y + ty, body, z))) y += ty;
        z = k.floorAt(x, y, z);
      }
      return Math.hypot(x - bx, y - by) < 0.05;
    };
    let steps = 0;
    const bad: string[] = [];
    let blind = 0;
    for (const ch of k.chunks.values()) {
      if (ch.stage !== 'planned') continue;
      for (let i = 0; i < S * S; i++) {
        const c = ch.cx * S + (i % S), r = ch.cy * S + Math.floor(i / S);
        if (!k.free(c + 0.5, r + 0.5, body)) continue;
        for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
          if (!k.free(c + dc + 0.5, r + dr + 0.5, body)) continue;
          if (dc && dr && (!k.free(c + dc + 0.5, r + 0.5, body) || !k.free(c + 0.5, r + dr + 0.5, body))) continue;
          const ok = walks(c + 0.5, r + 0.5, c + dc + 0.5, r + dr + 0.5) && walks(c + dc + 0.5, r + dr + 0.5, c + 0.5, r + 0.5);
          if (!ok) blind++;
          if (!step(c, r, c + dc, r + dr, body) || !step(c + dc, r + dr, c, r, body)) continue;
          steps++;
          if (!ok) bad.push(`${c},${r} → ${c + dc},${r + dr}`);
        }
      }
    }
    expect(steps).toBeGreaterThan(10_000);
    // The tiles alone would let through steps no walk takes; the way now takes none of them.
    expect(blind).toBeGreaterThan(0);
    expect(bad).toEqual([]);
  }, 120_000);
});

describe('back on foot (what T280 could not try)', () => {
  it('far away the house goes up by accounts; the wanderer walks back on the ways of the kernel, the place comes back as it is reached, the house at its stage', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks: new MemoryChunks() });
    await developAll(k);
    for (const id of k.ecs.query('mind')) k.ecs.destroy(id);
    const S = k.config.chunkSize;
    const me = k.wanderer().id;
    const home = k.wandererCarpet();
    const key = `${Math.floor(home.x / S)},${Math.floor(home.y / S)}`;
    setPeople(k, [{ nome: 'Baldo', mestiere: 'fabbro', origine: `${key}#t0` }]);
    const sid = k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key.startsWith(`${key}#s`))!;
    const origin = k.ecs.get(sid, 'origin').key;
    (k as unknown as { breakEntity(id: number): void }).breakEntity(sid);
    k.stores.set('sys.work', `deposito:${key.replace(',', ':')}`, { 'item.ciocco': 4 });
    // Away, in one go (the carpet jumps), until the place is let go.
    for (let jump = 0; jump < 3 && loaded(k, key); jump++) {
      k.carpet()!.ox += 12 * S;
      for (let i = 0; i < 400 && loaded(k, key); i++) {
        k.tick(STEP);
        await new Promise((r) => setTimeout(r, 2));
      }
    }
    expect(loaded(k, key)).toBe(false);
    const day0 = k.day();
    for (let d = 1; d <= 2; d++) {
      k.time = at(day0 + d, 'evening');
      for (let t = 0; t < 3.5; t += STEP) k.tick(STEP);
    }
    expect(k.ventures().find((x) => x.origin === origin)!.worked).toBeGreaterThanOrEqual(200);
    // Back on foot: a step of the walk at every tick (`stepWanderer`, what the server does with a client's steps), toward the next
    // point of the way to a goal at most 40 tiles ahead on the road home; the places load as they are reached.
    const r = Number(k.ecs.get(k.wandererEntity, 'body')?.r) || 0.22;
    const route = (k as unknown as { routeStep(x: number, y: number, tx: number, ty: number, r?: number): { x: number; y: number } | undefined }).routeStep.bind(k);
    const start = k.wandererCarpet();
    let stuck = 0;
    let last = start;
    for (let i = 0; i < 6000 && Math.hypot(k.wandererCarpet().x - home.x, k.wandererCarpet().y - home.y) > 2; i++) {
      const p = k.wandererCarpet();
      const d = Math.hypot(home.x - p.x, home.y - p.y);
      // A goal ahead where one can stand (not in a thicket): 40 tiles on, or nearer if no way gets there.
      let goal = home;
      let next = d <= 40 ? route(p.x, p.y, home.x, home.y, r) : undefined;
      for (const ahead of [40, 24, 12, 6]) {
        if (next || ahead >= d) break;
        const ax = p.x + ((home.x - p.x) / d) * ahead, ay = p.y + ((home.y - p.y) / d) * ahead;
        const spot = free(k, ax, ay, r);
        if (spot) (goal = spot), (next = route(p.x, p.y, spot.x, spot.y, r));
      }
      next ??= goal;
      k.stepWanderer(me, next, 0.2);
      k.tick(STEP);
      if (i % 10 === 0) await new Promise((res) => setTimeout(res, 2));
      const now = k.wandererCarpet();
      stuck = Math.hypot(now.x - last.x, now.y - last.y) < 0.01 ? stuck + 1 : 0;
      last = now;
      expect(stuck, `fermo a ${now.x.toFixed(2)},${now.y.toFixed(2)}`).toBeLessThan(100);
    }
    const end = k.wandererCarpet();
    expect(Math.hypot(end.x - home.x, end.y - home.y)).toBeLessThanOrEqual(2);
    expect(Math.hypot(start.x - home.x, start.y - home.y)).toBeGreaterThan(10 * S);
    for (let i = 0; i < 200 && !loaded(k, key); i++) {
      k.tick(STEP);
      await new Promise((res) => setTimeout(res, 2));
    }
    expect(loaded(k, key)).toBe(true);
    const back = k.ecs.query('struttura', 'origin').find((e) => k.ecs.get(e, 'origin').key === origin)!;
    expect(k.ecs.get(back, 'struttura').stadio).toBeGreaterThan(0);
  }, 240_000);
});
