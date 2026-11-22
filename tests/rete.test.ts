// The network of a place and its enclaves (T474, ADR-0250: the rule 10 of the steps, the row 1 of T459). The pure part, on synthetic
// places: two tiles beside each other are joined within a step (`STEP`, two levels) or both swum; what the world gives as reachable is
// joined to the first gate with ramps the kernel evens; what only a cliff parts from the network is an enclave, kept where the roughness
// concedes it and joined otherwise; the roughness measured from the relief; the ramps as the wire says them. No kernel, no models.

import { describe, expect, it } from 'vitest';
import { addMoved, CLIMB, ENCLAVE_TILES, evenRamp, JUMP, keptPass, meansOf, placeNetwork, readMoved, readRoughness, roughnessOf, ROUGHNESS_QUOTA, STEP, steepOf, type PlaceGround } from '../src/kernel/network';

const S = 18;
const at = (c: number, r: number) => r * S + c;

/** A place of land (`.`), water (`~`), what blocks (`#`) and the levels `level(c, r)` gives; the border and the water fixed. */
function place(level: (c: number, r: number) => number, map?: string[]): PlaceGround {
  const code = (i: number) => map?.[Math.floor(i / S)]?.[i % S] ?? '.';
  return {
    size: S,
    levels: Int16Array.from({ length: S * S }, (_, i) => level(i % S, Math.floor(i / S))),
    walked: (i) => code(i) === '.',
    swum: (i) => code(i) === '~',
    fixed: (i) => {
      const c = i % S, r = Math.floor(i / S);
      return c === 0 || r === 0 || c === S - 1 || r === S - 1 || code(i) === '~';
    },
  };
}

/** Whether every step between two cells of a path is walked (within a step, or both swum). */
const walkedAlong = (g: PlaceGround, lv: Int16Array, path: number[]) =>
  path.every((c, i) => i === 0 || (g.swum(c) && g.swum(path[i - 1])) || Math.abs(lv[c] - lv[path[i - 1]]) <= STEP);

/** The tiles joined to `from` on the steps of the levels `lv`. */
function joinedTo(g: PlaceGround, lv: Int16Array, from: number): Set<number> {
  const open = (i: number) => g.walked(i) || g.swum(i);
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const i = q.pop()!;
    const c = i % S, r = Math.floor(i / S);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= S || nr >= S) continue;
      const n = at(nc, nr);
      if (seen.has(n) || !open(n) || !((g.swum(i) && g.swum(n)) || Math.abs(lv[i] - lv[n]) <= STEP)) continue;
      seen.add(n);
      q.push(n);
    }
  }
  return seen;
}

const WEST = at(0, 9), EAST = at(S - 1, 9);

describe('the steps (T474)', () => {
  it('a step is half a tile, a jump a tile, a climb three; the means of a pass follow', () => {
    expect([STEP, JUMP, CLIMB, ENCLAVE_TILES]).toEqual([2, 4, 12, 4]);
    expect([meansOf(3), meansOf(4), meansOf(5), meansOf(12), meansOf(13), meansOf(Infinity)]).toEqual(['jump', 'jump', 'climb', 'climb', 'build', 'build']);
    expect([keptPass('flat'), keptPass('hilly'), keptPass('mountainous'), keptPass('mountainous', true), keptPass('rugged')]).toEqual([-1, -1, JUMP, CLIMB, Infinity]);
    expect(ROUGHNESS_QUOTA).toEqual({ flat: 0, hilly: 0, mountainous: 0.15, rugged: 0.35 });
  });

  it('a place of today (neighbours within two levels): the network is the flood, no ramp, no enclave, nothing moved', () => {
    // A slope of a level a tile east-west and a hill: every tile beside the next within a step.
    const g = place((c, r) => c + (r > 5 && r < 12 ? 2 : 0));
    const net = placeNetwork(g, WEST, [EAST, at(9, 0), at(9, S - 1)], { roughness: roughnessOf(g) });
    expect(net.ramps).toEqual([]);
    expect(net.enclaves).toEqual([]);
    expect(net.stranded).toEqual([]);
    expect([...net.levels]).toEqual(Array.from(g.levels));
    expect(net.reach.reduce((a, v) => a + v, 0)).toBe(S * S);
    expect(net.apart.every((v) => v === 0)).toBe(true);
    expect(steepOf(g.levels, S, () => false)).toBe(false);
    expect(roughnessOf(g)).toBe('hilly');
    expect(roughnessOf(place(() => 3))).toBe('flat');
  });

  it('a gate behind a cliff of eight levels: a ramp the kernel evens joins it, every step within a step, the two ends kept', () => {
    // The east half of the place stands 8 levels over the west: the east gate is up there.
    const g = place((c) => (c >= 9 ? 8 : 0));
    expect(steepOf(g.levels, S, () => false)).toBe(true);
    const net = placeNetwork(g, WEST, [EAST], { roughness: 'hilly' });
    expect(net.stranded).toEqual([]);
    expect(net.ramps).toHaveLength(1);
    const ramp = net.ramps[0];
    // From the gate up there to the network below, both ends at their level.
    expect(ramp[0]).toBe(EAST);
    expect(net.levels[ramp[0]]).toBe(8);
    expect(net.levels[ramp.at(-1)!]).toBe(g.levels[ramp.at(-1)!]);
    expect(walkedAlong(g, net.levels, ramp)).toBe(true);
    // Long enough for the climb: at least four steps for eight levels, and no tile of the border moved.
    expect(ramp.length - 1).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < S * S; i++) if (g.fixed(i)) expect(net.levels[i], `${i}`).toBe(g.levels[i]);
    expect(joinedTo(g, net.levels, WEST).has(EAST)).toBe(true);
    expect(net.reach[EAST]).toBe(1);
    // The upper half is joined now: no enclave is left of it.
    expect(net.enclaves).toEqual([]);
  });

  it('a mesa of 16 tiles four levels high: an enclave a jump reaches, kept where the place is mountainous, joined where it is hilly', () => {
    const mesa = (c: number, r: number) => c >= 7 && c <= 10 && r >= 7 && r <= 10;
    const g = place((c, r) => (mesa(c, r) ? 4 : 0));
    const mountain = placeNetwork(g, WEST, [EAST], { roughness: 'mountainous' });
    expect(mountain.ramps).toEqual([]);
    expect(mountain.enclaves).toHaveLength(1);
    expect(mountain.enclaves[0]).toMatchObject({ walked: 16, pass: 4, means: 'jump', kept: true });
    expect(mountain.enclaves[0].cells.every((i) => mesa(i % S, Math.floor(i / S)))).toBe(true);
    expect(mountain.reach[at(8, 8)]).toBe(0);
    // What only the cliff parts from the network: the mesa, and nothing else (what the world gives as reachable stands elsewhere).
    expect([...mountain.apart].flatMap((v, i) => (v ? [i] : []))).toEqual(mountain.enclaves[0].cells);
    // Hilly: the same mesa joined with a ramp, no enclave.
    const hill = placeNetwork(g, WEST, [EAST], { roughness: 'hilly' });
    expect(hill.enclaves).toEqual([]);
    expect(hill.ramps).toHaveLength(1);
    expect(hill.reach[at(8, 8)]).toBe(1);
    expect(walkedAlong(g, hill.levels, hill.ramps[0])).toBe(true);
  });

  it('a mesa twelve levels high: no jump reaches it, the mountainous joins it too (no climb in the world yet), the rugged keeps it', () => {
    const mesa = (c: number, r: number) => c >= 6 && c <= 11 && r >= 6 && r <= 11;
    const g = place((c, r) => (mesa(c, r) ? 12 : 0));
    const mountain = placeNetwork(g, WEST, [EAST], { roughness: 'mountainous' });
    expect(mountain.enclaves).toEqual([]);
    expect(mountain.ramps).toHaveLength(1);
    expect(walkedAlong(g, mountain.levels, mountain.ramps[0])).toBe(true);
    // With the climb (R3) the mountainous keeps it.
    const climbing = placeNetwork(g, WEST, [EAST], { roughness: 'mountainous', climb: true });
    expect(climbing.enclaves).toHaveLength(1);
    expect(climbing.enclaves[0]).toMatchObject({ pass: 12, means: 'climb', kept: true });
    const rugged = placeNetwork(g, WEST, [EAST], { roughness: 'rugged' });
    expect(rugged.enclaves[0]).toMatchObject({ walked: 36, pass: 12, means: 'climb', kept: true });
  });

  it('the quota: a mountainous place keeps enclaves for at most 15 % of its walked tiles, the rest is joined', () => {
    // Two mesas of 36 tiles (11 % of the 324 each): the first is kept, the second would pass the quota and is joined.
    const a = (c: number, r: number) => c >= 2 && c <= 7 && r >= 2 && r <= 7;
    const b = (c: number, r: number) => c >= 10 && c <= 15 && r >= 10 && r <= 15;
    const g = place((c, r) => (a(c, r) || b(c, r) ? 4 : 0));
    const net = placeNetwork(g, WEST, [EAST], { roughness: 'mountainous' });
    const kept = net.enclaves.filter((e) => e.kept);
    expect(kept).toHaveLength(1);
    expect(kept[0].walked).toBe(36);
    expect(net.reach[at(12, 12)] + net.reach[at(4, 4)]).toBe(1);
    expect(net.ramps).toHaveLength(1);
  });

  it('a target is never an enclave: a door on a mesa the roughness would keep is joined', () => {
    const mesa = (c: number, r: number) => c >= 7 && c <= 10 && r >= 7 && r <= 10;
    const g = place((c, r) => (mesa(c, r) ? 4 : 0));
    const net = placeNetwork(g, WEST, [EAST, at(8, 8)], { roughness: 'rugged' });
    expect(net.enclaves).toEqual([]);
    expect(net.reach[at(8, 8)]).toBe(1);
  });

  it('the water joins the water whatever its levels; a wall of water and land is not crossed at a cliff', () => {
    // A river along row 9 falling four levels in the middle; the land each side at the river's level.
    const map = Array.from({ length: S }, (_, r) => (r === 9 ? '~'.repeat(S) : '.'.repeat(S)));
    const g = place((c) => (c >= 9 ? 0 : 4), map);
    const net = placeNetwork(g, at(0, 9), [at(S - 1, 9)], { roughness: 'hilly' });
    // Swum from west to east down the fall; the land of the west half 4 levels over the river's east half is joined by the river.
    expect(net.reach[at(S - 1, 9)]).toBe(1);
    expect(net.stranded).toEqual([]);
  });

  it('what is not open is passed over: a start on what blocks takes the first target; nothing open, nothing', () => {
    const map = Array.from({ length: S }, () => '#'.repeat(S));
    const none = placeNetwork(place(() => 0, map), WEST, [EAST], { roughness: 'flat' });
    expect(none.reach.reduce((a, v) => a + v, 0)).toBe(0);
    expect(none.ramps).toEqual([]);
    const half = map.map((row, r) => (r === 9 ? '.'.repeat(S) : row));
    const g = place(() => 0, half);
    const net = placeNetwork(g, at(0, 0), [EAST], { roughness: 'flat' });
    expect(net.reach[EAST]).toBe(1);
    expect(net.reach[WEST]).toBe(1);
  });

  it('a target no ramp can reach (on a ledge of the border, rock behind it) is stranded, said, never thrown', () => {
    // The east gate on a ledge of three tiles of the border, 12 levels up, rock beside it inside the place: the tiles join it to the rest
    // along the border, but the border is the next place's to meet and no tile the network may move leads up there.
    const map = Array.from({ length: S }, (_, r) => (r >= 8 && r <= 10 ? '.'.repeat(S - 2) + '#.' : '.'.repeat(S)));
    const g = place((c, r) => (c === S - 1 && r >= 8 && r <= 10 ? 12 : 0), map);
    const net = placeNetwork(g, WEST, [EAST], { roughness: 'hilly' });
    expect(net.stranded).toEqual([EAST]);
    expect(net.reach[EAST]).toBe(0);
    expect(net.apart[EAST]).toBe(1);
    // What the tiles alone part from the start (rock all round) is the layout's: neither stranded nor an enclave.
    const shut = Array.from({ length: S }, (_, r) => (r >= 7 && r <= 11 ? '.'.repeat(S - 3) + '###' : '.'.repeat(S)).split(''));
    shut[9][S - 1] = '.';
    shut[9][S - 2] = '.';
    const alone = placeNetwork(place((c, r) => (c >= S - 2 && r === 9 ? 12 : 0), shut.map((r) => r.join(''))), WEST, [EAST], { roughness: 'hilly' });
    expect([alone.stranded, alone.enclaves, alone.reach[EAST], alone.apart[EAST]]).toEqual([[], [], 0, 0]);
  });
});

describe('the ramps on the wire and evened again (T474)', () => {
  it('evenRamp keeps both ends and every step within a step; where the ends moved too far, as near as a step allows', () => {
    // Each tile as near as it was while the rest can still climb to the end: the earth is moved at the foot of the cliff.
    const lv = Int16Array.from([0, 0, 0, 8, 8, 8]);
    const moved = evenRamp(lv, [0, 1, 2, 3, 4, 5]);
    expect([...lv]).toEqual([0, 0, 2, 4, 6, 8]);
    expect(moved).toBe(2 + 4 + 2);
    // Too short for its ends (the ground moved since it was found): every tile within a step of the one before, as near as it was; the last as it is.
    const short = Int16Array.from([0, 5, 20]);
    evenRamp(short, [0, 1, 2]);
    expect([...short]).toEqual([0, 2, 20]);
    // Out of the place: nothing.
    const out = Int16Array.from([0, 9]);
    expect(evenRamp(out, [0, 1, 5])).toBe(0);
    expect([...out]).toEqual([0, 9]);
  });

  it('readMoved takes only tiles of the place and whole levels within 64 either way; anything else is left out, never thrown', () => {
    expect(readMoved({ 0: 2, 5: -3, 323: 64 }, S)).toEqual({ 0: 2, 5: -3, 323: 64 });
    expect(readMoved({ 0: 2, 324: 1, '-1': 1, '01': 1, 1.5: 1, 2: 0, 3: 65, 4: 2.5, 6: '2', 7: null }, S)).toEqual({ 0: 2 });
    for (const bad of [undefined, null, 'ramps', 3, [], [1, 2], {}, { x: 1 }]) expect(readMoved(bad, S)).toBeUndefined();
    // Added to a place's levels as they come: the ground of a thin client is the server's.
    const lv = new Int16Array(S * S);
    addMoved(lv, { 0: 2, 5: -3, 999: 4 });
    expect([lv[0], lv[5], lv.reduce((a, v) => a + v, 0)]).toEqual([2, -3, -1]);
  });

  it('the earth a network moved is what its levels differ from the place\'s, tile by tile', () => {
    const g = place((c) => (c >= 9 ? 8 : 0));
    const net = placeNetwork(g, WEST, [EAST], { roughness: 'hilly' });
    const lv = Int16Array.from(g.levels);
    addMoved(lv, net.moved);
    expect([...lv]).toEqual([...net.levels]);
    expect(Object.keys(net.moved).length).toBeGreaterThan(0);
    expect(Object.values(net.moved).every((d) => Number.isInteger(d) && d !== 0)).toBe(true);
  });

  it('readRoughness: one of the four, else none', () => {
    expect(['flat', 'hilly', 'mountainous', 'rugged', 'Rugged', 'piana', 3, undefined].map(readRoughness)).toEqual(['flat', 'hilly', 'mountainous', 'rugged', undefined, undefined, undefined, undefined]);
  });
});

describe('the roughness (T474)', () => {
  it('flat, hilly, mountainous, rugged: from the share of the edges beyond a step and an edge beyond a climb', () => {
    expect(roughnessOf(place(() => 0))).toBe('flat');
    // The span of the land over a tile: hilly, though no cliff.
    expect(roughnessOf(place((c) => Math.floor(c / 2)))).toBe('hilly');
    // One column of cliffs: 18 of the 612 edges (3 %): mountainous.
    expect(roughnessOf(place((c) => (c >= 9 ? 3 : 0)))).toBe('mountainous');
    // A cliff beyond a climb anywhere: rugged.
    expect(roughnessOf(place((c, r) => (c === 9 && r === 9 ? 13 : 0)))).toBe('rugged');
    // Terraces every two columns: a cliff on half the edges across: rugged.
    expect(roughnessOf(place((c) => 3 * Math.floor(c / 2)))).toBe('rugged');
  });
});
