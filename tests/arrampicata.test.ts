// The climb (T477, ADR-0251: the row 4 of T459, R3): a movement of the kernel as the jump, up or down a cliff beside the wanderer within the
// reach of their means (a rope, a climbing pick: `bonus.climb`; a state «Altro…» gives: `climb`), slow and tiring, interrupted by a blow or
// by the energy at zero. On the synthetic rise of the tests (`syntheticRise`, never saved): the menu of the tile says what is missing, the rope
// of the seed climbs eight levels, the face takes time and energy, nothing climbs beyond three tiles. In a game of many the jump and the climb
// are the server's: the thin client makes them at once as alone and tells the server, which makes them on its world, carries the body and
// takes no step meanwhile; where it lands is the server's. No call to the models.

import { describe, expect, it } from 'vitest';
import { LEVEL } from '../src/kernel/relief';
import { CLIMB, STEP } from '../src/kernel/network';
import { CLIMB_ACTION, CLIMB_WORDS, climbLine, climbOf, climbPoint, climbDuration, faceSeconds, fallPoint, saneClimb, startClimb } from '../src/kernel/climb';
import { validateEffects } from '../src/kernel/validator';
import { boot, climbOption, edgeOf, holdRope, level, many, near, planned, plateau, run, standAt } from './cliff';

describe('the climb, pure (T477)', () => {
  it('the means: the largest climb of what is worn or held and of the states, whole levels within three tiles', () => {
    expect(climbOf([undefined, { defense: 2 }])).toBe(0);
    expect(climbOf([{ climb: 8 }, { climb: 4 }])).toBe(8);
    expect(climbOf([{ climb: 40 }])).toBe(CLIMB);
    expect(climbOf([{ climb: 'molto' }, { climb: NaN }, { climb: -3 }])).toBe(0);
    expect(climbOf([], [{ climb: 6.7 }, null, false, { speed: 2 }])).toBe(6);
  });

  it('the line: the foot of the face on the low side, the top on the far tile; slower up than down; a body falls to the foot', () => {
    // East, up: the face on the near tile against the edge x = 4, the top inside tile 4.
    const up = climbLine({ x: 3.5, y: 7.9 }, 0.3, 3, 7, 4, 7, true)!;
    expect(up.face.x).toBeCloseTo(4 - 0.32);
    expect(up.to.x).toBeCloseTo(4.5);
    expect(up.face.y).toBeCloseTo(7.68);
    // West, down: the face and the top both on the far (low) tile, by the edge x = 3.
    const down = climbLine({ x: 3.5, y: 7.5 }, 0.3, 3, 7, 2, 7, false)!;
    expect(down.face.x).toBeCloseTo(3 - 0.32);
    expect(down.to.x).toBeCloseTo(2.5);
    expect(climbLine({ x: 3.5, y: 7.5 }, 0.3, 3, 7, 4, 8, true)).toBeUndefined();
    expect(faceSeconds(8)).toBeGreaterThan(faceSeconds(-8));
    expect(faceSeconds(8, 2)).toBeCloseTo(2 * faceSeconds(8));
    const c = startClimb({ x: 3.5, y: 7.5 }, up, 1, 3, 8);
    expect(saneClimb(c)).toBe(c);
    c.t = c.approach + c.climb / 2;
    const half = climbPoint(c);
    expect([half.x, half.y, half.z]).toEqual([up.face.x, up.face.y, 2]);
    c.t = climbDuration(c);
    const end = climbPoint(c);
    expect(end.x).toBeCloseTo(up.to.x);
    expect(end.y).toBeCloseTo(up.to.y);
    expect([end.z, end.s]).toEqual([3, 1]);
    expect(fallPoint(c)).toEqual({ x: 3.5, y: 7.5, z: 1 });
    expect(saneClimb({ ...c, t: NaN })).toBeUndefined();
    expect(saneClimb({ ...c, from: null })).toBeUndefined();
  });

  it('a state climbs: whole levels within three tiles; the Narrator is told of it', () => {
    const ctx = { palette: {}, item: () => undefined, module: () => undefined, loot: new Set<string>() };
    const got = validateEffects([{ type: 'state', name: 'In arrampicata', climb: 40, duration: 20 }, { type: 'state', name: 'presa', climb: 3.6 }], ctx);
    expect(got.effects).toEqual([
      { type: 'state', name: 'in arrampicata', climb: CLIMB, duration: 20 },
      { type: 'state', name: 'presa', climb: 4, duration: 0 },
    ]);
  });
});

describe('the climb on a plateau eight levels high (T477, the synthetic rise)', () => {
  it('the menu says what is missing; with the rope the wanderer climbs, slowly and tiring, up and down; the people do not', async () => {
    const k = await boot(plateau(8));
    const edge = edgeOf(k, 8);
    expect(edge, 'a clean edge of the plateau').toBeDefined();
    const { col: e, row } = edge!;
    const y = row + 0.5;
    standAt(k, e - 0.5, y);
    // Beside the cliff, no means: the climb is in the menu, disabled, with what is missing.
    const none = climbOption(k, e, row);
    expect(none).toMatchObject({ label: CLIMB_WORDS.up, enabled: false, reason: CLIMB_WORDS.refusal.means });
    // A tile a step away, or not beside the wanderer: no climb.
    expect(climbOption(k, e - 2, row)).toBeUndefined();
    expect(climbOption(k, e + 1, row)).toBeUndefined();
    expect(k.climbTo(e, row)).toBe(false);
    holdRope(k);
    expect(k.climbReach()).toBe(12);
    expect(climbOption(k, e, row)).toMatchObject({ enabled: true });
    const energy = k.needs()!.energy;
    await k.performMenu(`t:${CLIMB_ACTION}`, -1, e, row);
    expect(k.climbing()).toBeDefined();
    // Meanwhile nothing else: no jump, no other climb, no menu.
    expect(k.jump()).toBe(false);
    expect(k.contextAt(0, 0)).toBe(false);
    // Halfway up the face the feet are between the two levels, the body at the foot of the face.
    run(k, 0.3 + faceSeconds(8) / 2);
    const mid = k.climbing()!;
    expect(mid.face).toBe(true);
    expect(mid.y).toBeGreaterThan(level(k, e - 1, row) * LEVEL);
    expect(mid.y).toBeLessThan(level(k, e, row) * LEVEL);
    expect(k.wandererCarpet().x).toBeLessThan(e);
    run(k, 3);
    expect(k.climbing()).toBeUndefined();
    const top = k.wandererCarpet();
    expect(top.x).toBeGreaterThan(e + 0.2);
    expect(level(k, Math.floor(top.x), row)).toBe(level(k, e, row));
    // About a level of energy for every level of the face (and the little the needs take).
    expect(energy - k.needs()!.energy).toBeGreaterThan(7);
    // Down again: «Calati giù», faster.
    const down = climbOption(k, e - 1, row);
    expect(down).toMatchObject({ label: CLIMB_WORDS.down, enabled: true });
    expect(k.climbTo(e - 1, row)).toBe(true);
    run(k, 0.6 + faceSeconds(-8) + 0.1);
    expect(k.climbing()).toBeUndefined();
    expect(k.wandererCarpet().x).toBeLessThan(e);
    expect(level(k, Math.floor(k.wandererCarpet().x), row)).toBe(level(k, e - 1, row));
  }, 120_000);

  it('a blow or the energy at zero and the body falls back to the foot; tired, loaded or beyond three tiles nobody climbs', async () => {
    const k = await boot(plateau(8));
    const { col: e, row } = edgeOf(k, 8)!;
    const y = row + 0.5;
    holdRope(k);
    // The energy runs out on the face: back to the foot, said.
    standAt(k, e - 0.5, y);
    const said: string[] = [];
    k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
    k.needs()!.energy = 3;
    expect(k.climbTo(e, row)).toBe(true);
    run(k, 5);
    expect(k.climbing()).toBeUndefined();
    expect(k.wandererCarpet().x).toBeLessThan(e);
    expect(said).toContain(CLIMB_WORDS.fell);
    // Too tired to start.
    k.needs()!.energy = 0.5;
    expect(climbOption(k, e, row)).toMatchObject({ enabled: false, reason: CLIMB_WORDS.refusal.tired });
    // A blow on the face.
    k.needs()!.energy = 100;
    standAt(k, e - 0.5, y);
    expect(k.climbTo(e, row)).toBe(true);
    run(k, 1);
    k.needs()!.health -= 10;
    run(k, 0.1);
    expect(k.climbing()).toBeUndefined();
    expect(k.wandererCarpet().x).toBeLessThan(e);
    // A thing of the world over the head: the hands are needed.
    k.inventory().slots[k.inventory().slots.findIndex((s) => !s)] = { item: 'thing:obj.chest', count: 1 };
    expect(climbOption(k, e, row)).toMatchObject({ enabled: false, reason: CLIMB_WORDS.refusal.load });
    // Sixteen levels (four tiles): beyond any climb.
    const k2 = await boot(plateau(16));
    const high = edgeOf(k2, 16);
    expect(high).toBeDefined();
    standAt(k2, high!.col - 0.5, high!.row + 0.5);
    holdRope(k2);
    expect(climbOption(k2, high!.col, high!.row)).toMatchObject({ enabled: false, reason: CLIMB_WORDS.refusal.high });
    expect(k2.climbTo(high!.col, high!.row)).toBe(false);
  }, 180_000);

  it('«Altro…: mi arrampico» gives a state that climbs, and the climb begins', async () => {
    const k = await boot(plateau(8));
    const { col: e, row } = edgeOf(k, 8)!;
    standAt(k, e - 0.5, row + 0.5);
    expect(k.climbReach()).toBe(0);
    await k.freeTileAction(e, row, 'mi arrampico sulla parete');
    expect(Object.values(k.states()).some((s) => (s as { climb?: number }).climb === 12)).toBe(true);
    expect(k.climbReach()).toBe(12);
    expect(k.climbing()).toBeDefined();
    run(k, 5);
    expect(k.wandererCarpet().x).toBeGreaterThan(e);
  }, 120_000);

  it('a mountainous place keeps an enclave a climb reaches: every world climbs (R3)', async () => {
    const k = await boot(plateau(8));
    const kept = planned(k).flatMap((ch) => ch.network!.enclaves.filter((x) => x.kept).map((x) => ({ ch, x })));
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.some(({ x }) => x.pass > 4 && x.pass <= CLIMB && x.means === 'climb')).toBe(true);
    // The people still go only on the network: a step across the cliff is never theirs.
    const { col: e, row } = edgeOf(k, 8)!;
    expect(k.riseOnStep(e - 1, row, e, row)).toBe(true);
    expect(Math.abs(level(k, e, row) - level(k, e - 1, row))).toBeGreaterThan(STEP);
  }, 120_000);
});


describe('the jump and the climb in a game of many (T477): the server makes them', () => {
  it('the thin client jumps at once and tells the server, which jumps on its world: both land on the ledge; no step meanwhile', async () => {
    const w = await many(plateau(4));
    const edge = edgeOf(w.k, 4, near);
    expect(edge, 'a clean edge near the start').toBeDefined();
    const { col: e, row } = edge!;
    w.put(e - 1.1, row + 0.5);
    const before = w.sent.length;
    expect(w.mirror.jump()).toBe(true);
    const jumped = w.sent.slice(before).find((m) => m.t === 'jump') as { dx: number; dy: number } | undefined;
    expect(jumped).toMatchObject({ dx: 1, dy: 0 });
    // While the body is in the air, the client sends no step; the server carries it.
    w.frames(10);
    expect(w.sent.slice(before).filter((m) => m.t === 'step')).toEqual([]);
    expect(w.k.carriedBody('anna')).toBe(true);
    w.frames(60);
    const { server, mirror } = w.where();
    expect(server.x).toBeGreaterThan(e);
    expect(mirror.x).toBeGreaterThan(e);
    expect(Math.hypot(server.x - mirror.x, server.y - mirror.y)).toBeLessThan(0.1);
    expect(level(w.k, Math.floor(server.x), row)).toBe(level(w.k, e, row));
  }, 120_000);

  it('the climb from the mirror’s menu: made here, asked of the server, which climbs and carries; refused there, it ends here', async () => {
    const w = await many(plateau(8));
    const edge = edgeOf(w.k, 8, near);
    expect(edge).toBeDefined();
    const { col: e, row } = edge!;
    w.put(e - 0.5, row + 0.5);
    // Without a rope on the server, a rope the mirror thinks it holds: the server refuses, the mirror's climb ends where it began.
    holdRope(w.mirror);
    const start = w.mirror.wandererCarpet();
    const asked = w.mirror.performMenu(`t:${CLIMB_ACTION}`, -1, e, row);
    expect(w.mirror.climbing()).toBeDefined();
    w.frames(2);
    await asked;
    expect(w.mirror.climbing()).toBeUndefined();
    expect(Math.hypot(w.mirror.wandererCarpet().x - start.x, w.mirror.wandererCarpet().y - start.y)).toBeLessThan(0.05);
    expect(w.k.carriedBody('anna')).toBe(false);
    // The rope on the server too, held: the server climbs, the mirror with it.
    w.k.as('anna', () => holdRope(w.k));
    w.frames(12);
    const climbed = w.mirror.performMenu(`t:${CLIMB_ACTION}`, -1, e, row);
    w.frames(2);
    await climbed;
    expect(w.k.carriedBody('anna')).toBe(true);
    w.frames(60 * 5);
    const { server, mirror } = w.where();
    expect(server.x).toBeGreaterThan(e + 0.2);
    expect(Math.hypot(server.x - mirror.x, server.y - mirror.y)).toBeLessThan(0.1);
    expect(level(w.k, Math.floor(server.x), row)).toBe(level(w.k, e, row));
  }, 120_000);
});
