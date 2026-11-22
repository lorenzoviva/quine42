// The reach (T488, ADR-0245): what the Council makes for a place it makes only when a wanderer can reach it soon. The places in reach (near the
// wanderer, or on the way they are going) are planned, the nearest first; the others are only looked up for what costs nothing (a plan the universe
// has, the open sea) and stay drafts; the things named on the ground of a planned place are defined when it comes in reach; the Sculptor of the
// structures only for a place in reach; with more wanderers, around each; the pace of the world and the lobby's quota still hold.
// This file does not import tests/world.ts: it runs with the reach of the game (`REACH`), which the other tests of the kernel widen.
import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { MemoryChunks } from '../src/kernel/chunks';
import type { TextCall } from '../src/kernel/ai/models';
import { inReach, inReachOf, JUMP_PACE, nearestCentre, nextPace, REACH, squareDistance } from '../src/kernel/reach';
import { HOUR, hourlyEstimate } from '../src/kernel/coefficients';
import { readConfig } from '../src/kernel/universe';
import { readFileSync } from 'node:fs';

const DT = 1 / 60;
const S = 18;
const middleOf = (cx: number, cy: number) => ({ x: cx * S + S / 2, y: cy * S + S / 2 });
const flush = () => new Promise<void>((r) => setTimeout(r, 1));

/** The local models, writing down every call and where each plan was asked. */
class Recording extends MockAiModels {
  calls: string[] = [];
  plans: string[] = [];
  defined: string[] = [];
  /** Names put on the ground of the plans asked for these places (a thing no one knows). */
  ground = new Map<string, string[]>();
  async text(call: TextCall): Promise<string> {
    this.calls.push(call.task ?? '?');
    const d = call.data as { cx?: number; cy?: number; names?: string[] } | undefined;
    if (call.task === 'chunk.plan') this.plans.push(`${d?.cx},${d?.cy}`);
    if (call.task === 'content.define') this.defined.push(...((call.data as { names?: string[] })?.names ?? []));
    const answer = await super.text(call);
    const extra = call.task === 'chunk.plan' ? this.ground.get(`${d?.cx},${d?.cy}`) : undefined;
    if (!extra) return answer;
    const plan = JSON.parse(answer);
    return JSON.stringify({ ...plan, ground: [...(plan.ground ?? []), ...extra] });
  }
}

async function boot(opts: { many?: boolean; chunks?: MemoryChunks; ai?: Record<string, unknown> } = {}) {
  Kernel.REACH = REACH;
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const game = opts.many ? { mode: 'multiplayer', death: 3 } : cfg.game;
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, ai: { ...cfg.ai, ...opts.ai }, game }, null, 2) };
  const models = new Recording();
  const k = await Kernel.boot({ files, store: memoryStore(), ai: models, chunks: opts.chunks ?? new MemoryChunks() });
  k.view = { w: 64, h: 33 };
  return { k, models };
}

/** The wanderer acting (or `id`) at a point of the world, the carpet moved under them. */
function put(k: Kernel, to: { x: number; y: number }, id?: string) {
  const go = () => {
    const p = k.wandererPos();
    Object.assign(k.carpet()!, { ox: to.x - p.x, oy: to.y - p.y });
  };
  if (id) k.as(id, go);
  else go();
}

async function ticks(k: Kernel, n: number, each?: (i: number) => void) {
  for (let i = 0; i < n; i++) {
    each?.(i);
    k.tick(DT);
    await flush();
  }
}

/** Ticks until no place in reach is a draft or being planned (at most `n` ticks). */
async function settle(k: Kernel, n = 600) {
  for (let i = 0; i < n; i++) {
    k.tick(DT);
    await flush();
    const open = [...k.chunks.values()].some((c) => (c.stage === 'draft' && k.placeInReach(c.cx, c.cy)) || c.developing);
    if (!open && i > 5) return;
  }
}

describe('il raggio, funzioni pure (T488)', () => {
  it('la distanza da un punto al quadrato di un luogo: zero dentro, al bordo più vicino fuori', () => {
    expect(squareDistance(9, 9, 0, 0, S)).toBe(0);
    expect(squareDistance(20, 9, 0, 0, S)).toBe(2);
    expect(squareDistance(-3, -4, 0, 0, S)).toBe(5);
    expect(squareDistance(NaN, 0, 0, 0, S)).toBe(Infinity);
  });

  it('fermo: solo i luoghi entro «near» caselle; dal mezzo di un luogo solo quello', () => {
    const still = { ...middleOf(0, 0), vx: 0, vy: 0 };
    expect(inReachOf(still, 0, 0, S)).toBe(true);
    for (const [cx, cy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]]) expect(inReachOf(still, cx, cy, S)).toBe(false);
    // Near the edge, the place beside too.
    const edge = { x: 16, y: 9, vx: 0, vy: 0 };
    expect(inReachOf(edge, 1, 0, S)).toBe(true);
    expect(inReachOf(edge, -1, 0, S)).toBe(false);
  });

  it('in cammino: i luoghi sulla via davanti, per «ahead» secondi del suo passo, non quelli dietro né lontani di lato', () => {
    const walking = { ...middleOf(0, 0), vx: 6, vy: 0 };
    // 60 tiles ahead from the middle of (0, 0), to x = 69, and 4 beside: (1, 0) to (3, 0) and the edge of (4, 0), which starts at 72.
    for (const cx of [1, 2, 3, 4]) expect(inReachOf(walking, cx, 0, S)).toBe(true);
    expect(inReachOf(walking, 5, 0, S)).toBe(false);
    expect(inReachOf(walking, -1, 0, S)).toBe(false);
    expect(inReachOf(walking, 2, 1, S)).toBe(false);
    expect(inReachOf(walking, 2, -1, S)).toBe(false);
    // Slower, less of the way: at 2 tiles a second, 20 tiles, to x = 29.
    const slow = { ...middleOf(0, 0), vx: 2, vy: 0 };
    expect(inReachOf(slow, 1, 0, S)).toBe(true);
    expect(inReachOf(slow, 2, 0, S)).toBe(false);
    // A vehicle that goes fast: never more than `aheadMax` tiles.
    const fast = { ...middleOf(0, 0), vx: 20, vy: 0 };
    expect(inReachOf(fast, 4, 0, S)).toBe(true);
    expect(inReachOf(fast, 5, 0, S)).toBe(false);
    // Of more wanderers, any.
    expect(inReach([walking, { ...middleOf(10, 10), vx: 0, vy: 0 }], 10, 10, S)).toBe(true);
    expect(inReach([walking, { ...middleOf(10, 10), vx: 0, vy: 0 }], 10, 12, S)).toBe(false);
    expect(inReach([], 0, 0, S)).toBe(false);
  });

  it("l'ordine: fermo, dal centro più vicino (come prima); in cammino, i luoghi davanti prima di quelli alle spalle", () => {
    const still = { x: 20, y: 9, vx: 0, vy: 0 };
    // Standing near the edge between (0, 0) and (1, 0): (1, 0) is nearer by its centre.
    expect(nearestCentre([still], 1, 0, S)).toBeLessThan(nearestCentre([still], 0, 0, S));
    // Walking west from there: (0, 0), ahead, comes before (1, 0), behind.
    const west = { ...still, vx: -6 };
    expect(nearestCentre([west], 0, 0, S)).toBeLessThan(nearestCentre([west], 1, 0, S));
  });

  it('il passo è una media del cammino; un salto (un teletrasporto, una rinascita) non è un passo', () => {
    let v = { vx: 0, vy: 0 };
    let at = { x: 0, y: 0 };
    // Three seconds at 6 tiles a second: the average is there.
    for (let i = 0; i < 180; i++) {
      const to = { x: at.x + 6 * DT, y: at.y };
      v = nextPace(v, at, to, DT);
      at = to;
    }
    expect(v.vx).toBeCloseTo(6, 1);
    expect(v.vy).toBeCloseTo(0, 5);
    expect(nextPace(v, at, { x: at.x + (JUMP_PACE + 1) * DT * 10, y: 0 }, DT)).toEqual({ vx: 0, vy: 0 });
    expect(nextPace(v, at, { x: NaN, y: 0 }, DT)).toEqual(v);
    expect(nextPace(v, at, at, 0)).toEqual(v);
  });
});

describe('il raggio nel kernel (T488)', () => {
  it('fermo nel mezzo di un luogo: il Cartografo pianifica solo i luoghi in raggio; gli altri caricati restano bozze, guardati e basta', async () => {
    const { k, models } = await boot();
    put(k, middleOf(3, 3));
    await settle(k);
    await ticks(k, 120);
    expect(k.chunks.get('3,3')?.stage).toBe('planned');
    expect(models.plans).toEqual(['3,3']);
    const drafts = [...k.chunks.values()].filter((c) => c.stage === 'draft');
    expect(drafts.length).toBeGreaterThan(10);
    for (const c of drafts) {
      expect(k.placeInReach(c.cx, c.cy)).toBe(false);
      expect(c.far).toBe(true);
    }
  }, 60_000);

  it("in cammino i luoghi davanti si pianificano prima di arrivarci, il più vicino per primo; niente bozza sotto i piedi", async () => {
    const { k, models } = await boot();
    put(k, middleOf(3, 3));
    await settle(k);
    const before = models.plans.length;
    const from = middleOf(3, 3);
    let onDraft = 0;
    // Eastwards at 6 tiles a second for 12 seconds: 72 tiles, four places.
    await ticks(k, 12 * 60, (i) => {
      put(k, { x: from.x + 6 * i * DT, y: from.y });
      const here = k.chunkAt(from.x + 6 * i * DT, from.y);
      if (!here || here.stage === 'draft') onDraft++;
    });
    expect(onDraft).toBe(0);
    const asked = models.plans.slice(before);
    // The places ahead, in the order they come: (4, 3) first.
    expect(asked[0]).toBe('4,3');
    expect(asked.indexOf('5,3')).toBeLessThan(asked.indexOf('6,3'));
    // Nothing behind, nothing on the sides beyond a step.
    for (const key of asked) {
      const [cx, cy] = key.split(',').map(Number);
      expect(cx).toBeGreaterThanOrEqual(4);
      expect(cy).toBe(3);
    }
  }, 60_000);

  it('un luogo che l’universo ha già si applica anche fuori raggio: non costa niente', async () => {
    const chunks = new MemoryChunks();
    const first = await boot({ chunks });
    put(first.k, middleOf(5, 1));
    await settle(first.k);
    expect(first.k.chunks.get('5,1')?.stage).toBe('planned');
    // Another session over the same plans, standing three places away: (5, 1) is loaded, out of reach, and comes with its plan.
    const { k, models } = await boot({ chunks });
    put(k, middleOf(2, 1));
    await settle(k);
    await ticks(k, 120);
    expect(k.placeInReach(5, 1)).toBe(false);
    expect(k.chunks.get('5,1')?.stage).toBe('planned');
    expect(models.plans).not.toContain('5,1');
  }, 60_000);

  it('le cose nominate a terra di un luogo si definiscono quando il luogo entra in raggio, non quando si carica', async () => {
    const chunks = new MemoryChunks();
    const first = await boot({ chunks });
    first.models.ground.set('6,2', ['Qwertz Plimbo']);
    put(first.k, middleOf(6, 2));
    // The first session plans it and goes away before its things are asked: they are asked when it is in reach, at once here.
    await settle(first.k);
    await ticks(first.k, 30);
    expect(first.models.defined).toContain('Qwertz Plimbo');
    // Another session, where nobody defined it yet (a fresh store of the files): it loads the plan out of reach and asks nothing.
    const { k, models } = await boot({ chunks });
    put(k, middleOf(3, 2));
    await settle(k);
    await ticks(k, 120);
    expect(k.chunks.get('6,2')?.stage).toBe('planned');
    expect(models.defined).not.toContain('Qwertz Plimbo');
    // Walking to it: asked now.
    put(k, middleOf(6, 2));
    await ticks(k, 60);
    expect(models.defined).toContain('Qwertz Plimbo');
  }, 60_000);

  it('con più viandanti: i luoghi attorno a ognuno', async () => {
    const { k, models } = await boot({ many: true });
    k.giveCredits('me', 100);
    k.addWanderer('anna', 'Anna');
    k.giveCredits('anna', 100);
    put(k, middleOf(3, 3));
    put(k, middleOf(-4, 5), 'anna');
    await settle(k, 900);
    await ticks(k, 120);
    expect(k.chunks.get('3,3')?.stage).toBe('planned');
    expect(k.chunks.get('-4,5')?.stage).toBe('planned');
    expect(new Set(models.plans)).toEqual(new Set(['3,3', '-4,5']));
  }, 60_000);

  it('il ritmo del mondo e la quota della lobby valgono ancora: in pausa niente, lento non oltre i luoghi al minuto', async () => {
    const { k, models } = await boot({ many: true, ai: { placesPerMinute: 1 } });
    k.giveCredits('me', 100);
    put(k, middleOf(3, 3));
    await settle(k);
    expect(models.plans).toEqual(['3,3']);
    // One a minute: walking east, the places ahead wait for the minute.
    const from = middleOf(3, 3);
    await ticks(k, 6 * 60, (i) => put(k, { x: from.x + 6 * i * DT, y: from.y }));
    expect(models.plans.length).toBe(1);
    expect((await k.setPace({ mode: 'hold' }, k.masterId())).ok).toBe(true);
    k.time += 61;
    await ticks(k, 120);
    expect(models.plans.length).toBe(1);
  }, 60_000);

  it('lo Scultore delle strutture solo per ciò che sta in un luogo in raggio', async () => {
    const { k } = await boot();
    put(k, middleOf(0, 0));
    await settle(k);
    await ticks(k, 60);
    // The start has its bakery, a structure without a model (the local models do not sculpt it).
    const bakery = k.sculpting.missing(true).find((r) => r.classe === 'structure');
    expect(bakery).toBeDefined();
    expect(k.sculpting.missing().some((r) => r.id === bakery!.id)).toBe(true);
    // Far from it: still loaded, no longer in reach, no longer asked.
    put(k, { x: middleOf(0, 0).x + 40, y: middleOf(0, 0).y });
    await ticks(k, 30);
    expect(k.chunks.get('0,0')?.stage).toBe('planned');
    expect(k.placeInReach(0, 0)).toBe(false);
    expect(k.sculpting.missing().some((r) => r.id === bakery!.id)).toBe(false);
    expect(k.sculpting.missing(true).some((r) => r.id === bakery!.id)).toBe(true);
  }, 60_000);
});

describe('la stima della lobby col ritmo di T488, il riuso e il tetto di T495, la cache di T496', () => {
  it('i luoghi, le cose a terra, gli individui, i modelli e le strutture di un’ora sono quelli della sessione del cammino, e la stima le segue', () => {
    // The walk of the first run, offline, with the reach and the reuse (lab/scripts/sessione-cammino.ts → lab/banco/run-1/sessione-t496.json;
    // with the ceiling out of the way, sessione-t496-tetto60.json).
    type Walk = { minutes: number; calls: Record<string, number>; sculpted: Record<string, number>; perHourList: number };
    const walk = JSON.parse(readFileSync('lab/banco/run-1/sessione-t496.json', 'utf8')) as Walk;
    const free = JSON.parse(readFileSync('lab/banco/run-1/sessione-t496-tetto60.json', 'utf8')) as Walk;
    const hour = (n: number, w = walk) => (n * 60) / w.minutes;
    expect(HOUR.luoghi).toBeCloseTo(hour(walk.calls['chunk.plan']), -1);
    expect(HOUR.luoghi * HOUR.ignoti).toBeCloseTo(hour(walk.calls['content.define']), -1);
    expect(HOUR.luoghi * HOUR.persone * 1.2).toBeCloseTo(hour(walk.calls['npc.individuate']), -1);
    expect(HOUR.modelliCose).toBeCloseTo(walk.sculpted.simple / walk.calls['content.define'], 1);
    expect(HOUR.modelliPersone).toBeCloseTo(walk.sculpted.figure / walk.calls['npc.individuate'], 1);
    expect(HOUR.strutture).toBeCloseTo(hour(free.sculpted.structure, free), 0);
    // The lobby's estimate at full detail with the seed's models is what the walk cost at the estimate's prices, within a sixth (the lobby
    // caps the models at `ai.maxModels` a session and the new structures at two an hour, the walk sculpted at its pace).
    const ai = readConfig(bundledFiles).config.ai;
    const h = hourlyEstimate(ai, '2026-11-22', { decisions: true });
    expect(Math.abs(h.dollari - walk.perHourList) / walk.perHourList).toBeLessThan(1 / 6);
  });
});
