// The planets and the voyage (T449, ADR-0236, `docs/design/acqua-spazio.md` § 2.7, the way C1 of D64): far bands of the same plane, the orbit
// the band 0; a planet's draft its generator's around its own centre with its own seed, its relief its own with its sea at the world's level,
// its gravity its own; the spaceport's pad with its capsule; the voyage that moves the scroll of the carpet of whoever is aboard and never where
// they stand in the circle; the levels of detail of a planet's globe, filled from the coarsest to the tile, the last one the draft's.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { CAPSULE, Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { DEFAULT_NATURE, MAX_PLANETS, repairNature, sameNature } from '../src/kernel/nature';
import { dockOf, islandOf } from '../src/kernel/islands';
import {
  altitudeAt,
  bandOfPlace,
  cellHeight,
  destinations,
  globePoint,
  GLOBE_RADIUS,
  LOD_CELLS,
  LOD_LEVELS,
  lodCell,
  lodPoint,
  lodWanted,
  natureOfBand,
  onGlobe,
  padTiles,
  PlanetLod,
  planetDock,
  planetName,
  planetPitch,
  planetPlace,
  PLANET_SPAN,
  saneTransit,
  TRAVEL_SECONDS,
  transitView,
} from '../src/kernel/planets';
import { readVehicleView } from '../src/kernel/vehicle';
import { badRootOf, cleanCoined, COINED_ROOTS, foldName } from '../src/kernel/coined';
import { freshName } from '../src/kernel/npc/model';

const S = 18;
const PLANETS = [
  { name: 'Aldora', gravity: 0.5, day: 300 },
  { name: 'Velmar', gravity: 1.5, sky: 'earth', seed: 777, sea: 6 },
];

function planetFiles(planets: unknown = PLANETS, seed = 11) {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  return { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, seed, nature: { ...DEFAULT_NATURE, geography: 'void', sky: 'stars', planets } }, null, 2) + '\n' };
}

describe('the planets of the nature (T449)', () => {
  it('only around the void, at most eight, each within what the kernel accepts', () => {
    const n = repairNature({ geography: 'void', sky: 'stars', planets: [{ name: ' Aldora ', gravity: 9, day: 5, sky: 'mars', sea: 99, seed: 1.5, extra: 1 }, 'x', null, { name: '<b>' }] });
    expect(n.planets).toEqual([{ name: 'Aldora', geography: 'continent', sky: 'earth', day: 600, gravity: 1 }, { geography: 'continent', sky: 'earth', day: 600, gravity: 1 }]);
    expect(repairNature({ geography: 'continent', planets: [{}] }).planets).toBeUndefined();
    expect(repairNature({ geography: 'void', planets: Array.from({ length: 20 }, () => ({})) }).planets).toHaveLength(MAX_PLANETS);
    // A world of today: no planets, the same nature as before.
    expect(repairNature({})).toEqual(DEFAULT_NATURE);
    expect(sameNature(repairNature({ geography: 'void', planets: [{}] }), repairNature({ geography: 'void' }))).toBe(false);
  });

  it('a band is about 2^20 tiles of whole places; the band 0 is the orbit and whatever lies beyond the planets', () => {
    expect(planetPitch(S) * S).toBeGreaterThan(PLANET_SPAN - S);
    expect(planetPitch(S) * S).toBeLessThan(PLANET_SPAN + S);
    expect(bandOfPlace(0, S, 2)).toBe(0);
    expect(bandOfPlace(planetPitch(S), S, 2)).toBe(1);
    expect(bandOfPlace(planetPitch(S) * 2 + 1000, S, 2)).toBe(2);
    expect(bandOfPlace(planetPitch(S) * 3, S, 2)).toBe(0);
    expect(bandOfPlace(-planetPitch(S), S, 2)).toBe(0);
    // Without planets everything is the orbit (the world of today does not notice).
    expect(bandOfPlace(planetPitch(S), S, 0)).toBe(0);
    const n = repairNature({ geography: 'void', sky: 'stars', planets: PLANETS });
    expect(natureOfBand(n, 1)).toMatchObject({ geography: 'continent', sky: 'earth', day: 300, gravity: 0.5 });
    expect(natureOfBand(n, 0)).toMatchObject({ geography: 'void', sky: 'stars' });
    expect(natureOfBand(n, 0).planets).toBeUndefined();
    expect(destinations(n, 11).map((d) => d.name)).toEqual(['l’orbita', 'Aldora', 'Velmar']);
    expect(planetName(5)).toMatch(/^[A-Z][a-z]+$/);
  });
});

describe('a planet in the world (T449)', () => {
  it('its places are its generator’s around its own centre, with its own seed; its relief its own, its sea the world’s; its gravity its own', async () => {
    const k = await Kernel.boot({ files: planetFiles(), store: memoryStore(), ai: new MockAiModels() });
    const k2 = await Kernel.boot({ files: planetFiles(PLANETS, 999), store: memoryStore(), ai: new MockAiModels() });
    const draft = (kk: Kernel, cx: number, cy: number) => (kk as unknown as { genDraft(cx: number, cy: number): string }).genDraft(cx, cy);
    const P = planetPitch(S);
    // The centre of the planet 2 (its own seed): the same draft in two worlds of different seeds, and the starting square clear.
    expect(draft(k, 2 * P, 0)).toBe(draft(k2, 2 * P, 0));
    expect(draft(k, 2 * P, 0)[0]).toBe('g');
    // The planet 1 (the seed of the world and its band) is another ground in another world.
    expect(draft(k, P + 7, 3)).not.toBe(draft(k2, P + 7, 3));
    // No void on a planet; the orbit is the void's.
    expect(draft(k, P + 3, 2)).not.toContain('~');
    // A tile of the planet as its levels of detail read it is the tile of its draft.
    const d = draft(k, P + 2, 1);
    for (const [c, r] of [[0, 0], [5, 7], [17, 17]]) expect(k.planetTile(1, 2 * S + c, S + r)).toBe(d[r * S + c]);
    // The relief: the orbit flat, the planet's hills, every sea at the world's level.
    expect(k.relief.level(10, 10) === 0).toBe(true);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < 400; i++) {
      const v = k.relief.level(planetPlace(1, S) * S + i * 7, i * 3);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    expect(hi).toBeGreaterThan(0);
    expect(lo).toBeLessThan(0);
    expect(k.seaLevel).toBe(0);
    // The gravity of a band.
    expect(k.gravityAt(planetPlace(1, S) * S + 5, 5)).toBe(0.5);
    expect(k.gravityAt(planetPlace(2, S) * S + 5, 5)).toBe(1.5);
    expect(k.gravityAt(5, 5)).toBe(1);
  }, 60_000);

  it('the spaceport: the pad of its first place walked and clear, a capsule docked there when the place comes', async () => {
    const k = await Kernel.boot({ files: planetFiles(), store: memoryStore(), ai: new MockAiModels() });
    const cx = planetPlace(1, S);
    await k.planAhead(cx, 0);
    const ch = k.chunks.get(`${cx},0`)!;
    for (const [x, y] of padTiles(1, S)) expect(k.palette[ch.tiles[y * S + x - cx * S]].solid, `${x},${y}`).toBe(false);
    const d = planetDock(1, S);
    const caps = k.ecs.query('vehicle').filter((e) => k.ecs.get(e, 'module').id === CAPSULE);
    const at = caps.map((e) => k.ecs.get(e, 'pos')).filter((p) => Math.hypot(p.x - d.x, p.y - d.y) < 0.01);
    expect(at).toHaveLength(1);
    // Nothing of the plan stands on the pad.
    const pad = new Set(padTiles(1, S).map(([x, y]) => `${x},${y}`));
    for (const e of k.ecs.query('chunk', 'pos')) {
      if (k.ecs.has(e, 'vehicle') || k.ecs.get(e, 'chunk').key !== ch.key) continue;
      const p = k.ecs.get(e, 'pos');
      expect(pad.has(`${Math.floor(p.x)},${Math.floor(p.y)}`), String(k.ecs.get(e, 'module')?.id)).toBe(false);
    }
  }, 60_000);
});

/** A world with planets, the wanderer at the controls of the capsule docked at the start's station. */
async function atTheControls() {
  const k = await Kernel.boot({ files: planetFiles(), store: memoryStore(), ai: new MockAiModels() });
  k.carpet()!.active = false;
  const d = dockOf(k.config.seed, islandOf(k.config.seed, 0, 0, 'void'))!;
  const cx = Math.floor(d.x / S), cy = Math.floor(d.y / S);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) await k.planAhead(cx + a, cy + b);
  const c = k.ecs.query('vehicle').find((e) => k.ecs.get(e, 'module').id === CAPSULE)!;
  const fc = k.ecs.get(c, 'form');
  await k.forms.wait(fc.model, fc.seed, fc.tint);
  k.tick(1 / 60);
  Object.assign(k.carpet()!, { ox: Math.round(d.x), oy: Math.round(d.y) });
  const bow = [Math.sin(d.heading), Math.cos(d.heading)];
  const p = k.wandererPos();
  delete p.z;
  Object.assign(p, { x: d.x + bow[0] * 0.8 - k.offset().ox, y: d.y + bow[1] * 0.8 - k.offset().oy });
  k.tick(1 / 60);
  await k.perform(c, 'board');
  await k.perform(c, 'helm');
  const said: string[] = [];
  k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
  return { k, c, d, said };
}

describe('the voyage (T449)', () => {
  it('«Rotta per …» at the controls; halfway the vehicle and who is aboard at the pad, by the scroll of the carpet only; at the end, at anchor', async () => {
    const { k, c, said } = await atTheControls();
    expect(k.aboard()).toBe(c);
    const courses = k.actionsFor(c).filter((o) => o.id.startsWith('travel:'));
    expect(courses.map((o) => o.label)).toEqual(['Rotta per Aldora', 'Rotta per Velmar']);
    const circle = { ...k.wandererPos() };
    const onDeck = () => {
      const b = k.ecs.get(c, 'pos'), w = k.wandererCarpet();
      return [w.x - b.x, w.y - b.y];
    };
    const before = onDeck();
    await k.perform(c, 'travel:1');
    expect(k.transitOf(c)).toMatchObject({ from: 0, to: 1, t: 0, total: TRAVEL_SECONDS });
    expect(said.some((s) => s.includes('rotta per Aldora'))).toBe(true);
    // Under way: no way out, no other course, the vehicle does not drive.
    expect(k.actionsFor(c).find((o) => o.id === 'transit')?.label).toBe('In viaggio verso Aldora');
    await k.perform(c, 'over');
    expect(k.aboard()).toBe(c);
    for (let i = 0; i < 60 * TRAVEL_SECONDS * 0.5 + 2; i++) k.tick(1 / 60);
    const d = planetDock(1, S);
    const p = k.ecs.get(c, 'pos');
    expect([p.x, p.y]).toEqual([d.x, d.y]);
    expect(k.transitOf(c)?.jumped).toBe(true);
    // Who is aboard is where they were on the deck (turned with it), and where they were in the circle.
    const now = onDeck();
    expect(Math.hypot(now[0], now[1])).toBeCloseTo(Math.hypot(before[0], before[1]), 3);
    expect(k.wandererPos().x).toBeCloseTo(circle.x, 6);
    expect(k.wandererPos().y).toBeCloseTo(circle.y, 6);
    expect(k.bandAt(k.wandererCarpet().x)).toBe(1);
    expect(k.gravity()).toBe(0.5);
    // The places of the planet come around the wanderer; its pad's capsule is the one that came.
    for (let i = 0; i < 60 * TRAVEL_SECONDS; i++) k.tick(1 / 60);
    expect(k.transitOf(c)).toBeUndefined();
    expect(k.ecs.get(c, 'vehicle').anchored).toBe(true);
    expect(said).toContain('Siete arrivati: Aldora.');
    expect(k.aboard()).toBe(c);
    await k.planAhead(planetPlace(1, S), 0);
    const near = k.ecs.query('vehicle', 'pos').filter((e) => Math.hypot(k.ecs.get(e, 'pos').x - d.x, k.ecs.get(e, 'pos').y - d.y) < 2.5);
    expect(near).toEqual([c]);
    // Back to the orbit: the course is there, the planet's is not.
    expect(k.actionsFor(c).filter((o) => o.id.startsWith('travel:')).map((o) => o.label)).toEqual(['Rotta per l’orbita', 'Rotta per Velmar']);
  }, 120_000);

  it('only at the controls of a vehicle of the void, in a world with planets; the wire says the voyage, read without trusting it', async () => {
    const { k, c } = await atTheControls();
    await k.perform(c, 'unhelm');
    expect(k.actionsFor(c).some((o) => o.id.startsWith('travel:'))).toBe(false);
    expect(k.travelTo(c, 1)).toBe(false);
    await k.perform(c, 'helm');
    expect(k.travelTo(c, 7)).toBe(false);
    expect(k.travelTo(c, 0)).toBe(false);
    expect(k.travelTo(c, 2)).toBe(true);
    expect(k.vehicleSeen(c)?.transit).toMatchObject({ from: 0, to: 2, total: TRAVEL_SECONDS });
    expect(readVehicleView({ heading: 0, transit: { from: 0, to: 2, t: 3, total: 16 } })?.transit).toEqual({ from: 0, to: 2, t: 3, total: 16 });
    expect(readVehicleView({ heading: 0, transit: { from: 0, to: 0, t: 3 } })?.transit).toBeUndefined();
    expect(saneTransit({ from: 1, to: 99 }, 2)).toBeUndefined();
    expect(saneTransit({ from: 1, to: 0, t: 1e9, total: 1e9 }, 2)).toEqual({ from: 1, to: 0, t: 120, total: 120 });
  }, 120_000);
});

describe('the levels of detail of a planet (T449)', () => {
  it('from the whole planet to the tile; the globe is the flat map near the centre and curves away', () => {
    expect(lodCell(0) * LOD_CELLS).toBe(PLANET_SPAN);
    expect(lodCell(LOD_LEVELS - 1)).toBe(1);
    // The last level: a cell per tile, around the centre.
    expect(lodPoint(LOD_LEVELS - 1, LOD_CELLS / 2, LOD_CELLS / 2)).toEqual([0.5, 0.5]);
    expect(lodPoint(LOD_LEVELS - 1, 0, 0)).toEqual([-15.5, -15.5]);
    const [x, y, z] = globePoint(10, -5, 0.5);
    expect(x).toBeCloseTo(10, 3);
    expect(z).toBeCloseTo(-5, 3);
    expect(y).toBeCloseTo(0.5, 3);
    // At the antipode the map ends: the corners of the coarsest level are off the globe.
    expect(onGlobe(0, 0, 0)).toBe(false);
    expect(onGlobe(0, LOD_CELLS / 2, LOD_CELLS / 2)).toBe(true);
    const far = globePoint(Math.PI * GLOBE_RADIUS * 0.5, 0, 0);
    expect(far[1]).toBeCloseTo(-GLOBE_RADIUS, 0);
    // Water lies at 0, what grows higher; the heights shrink with the cell.
    expect(cellHeight({ layer: 'liquid', solid: true }, 1)).toBe(0);
    expect(cellHeight({ layer: 'rock', solid: true }, 1)).toBeGreaterThan(cellHeight({ layer: 'ground', solid: false }, 1));
    expect(cellHeight({ layer: 'ground', solid: false }, 1024)).toBeGreaterThan(cellHeight({ layer: 'ground', solid: false }, 1));
    // Nearer, finer: about a level a halving of the distance.
    expect(lodWanted(100, 1e-3)).toBeGreaterThan(lodWanted(1e5, 1e-3));
    expect(lodWanted(200, 1e-3) - lodWanted(400, 1e-3)).toBeCloseTo(1, 5);
    // The voyage seen: up from the body left, down onto the one reached, on the ground at the end.
    expect(altitudeAt(0, 1000)).toBe(1000);
    expect(altitudeAt(1, 1000)).toBe(0);
    expect(transitView({ from: 0, to: 1, t: 0, total: 16 }, () => 100)).toMatchObject({ band: 0, altitude: 0, leaving: true });
    expect(transitView({ from: 0, to: 1, t: 16, total: 16 }, () => 100)).toMatchObject({ band: 1, altitude: 0, leaving: false });
    expect(transitView({ from: 0, to: 1, t: 8, total: 16 }, () => 100).altitude).toBe(100);
  });

  it('filled from the coarsest, a few cells at a time, kept and read again; the last level is the draft at the centre', async () => {
    const k = await Kernel.boot({ files: planetFiles(), store: memoryStore(), ai: new MockAiModels() });
    const lod = new PlanetLod();
    let budget = 1500;
    const sampled = lod.fill((x, y) => k.planetTile(1, x, y), () => budget-- > 0);
    expect(sampled).toBeGreaterThan(1000);
    expect(lod.ready).toBe(1);
    // Every level, for the rest of the test (one sample a cell).
    lod.fill((x, y) => k.planetTile(1, x, y), () => true);
    expect(lod.done).toBe(true);
    const again = new PlanetLod(lod.codes);
    expect(again.done).toBe(true);
    expect(new PlanetLod([lod.codes[0], 'short']).ready).toBe(1);
    const last = lod.codes[LOD_LEVELS - 1]!;
    const draft = (k as unknown as { genDraft(cx: number, cy: number): string }).genDraft(planetPlace(1, S), 0);
    // The cell (16 + c, 16 + r) of the last level is the tile (c, r) of the planet's first place.
    for (const [c, r] of [[0, 0], [3, 9], [15, 15]]) expect(last[(LOD_CELLS / 2 + r) * LOD_CELLS + LOD_CELLS / 2 + c]).toBe(draft[r * S + c]);
  }, 120_000);
});

describe('the origin that moves (T449)', () => {
  it('a place a million tiles away keeps its sixty-fourths of a tile: its vertices relative to its corner, the group there in double precision', async () => {
    const THREE = await import('three');
    const { buildChunk } = await import('../src/render/terrain');
    const { swellPhases, swellAt } = await import('../src/render/sea');
    const k = await Kernel.boot({ files: planetFiles(), store: memoryStore(), ai: new MockAiModels() });
    const cx = planetPlace(1, S);
    await k.planAhead(cx, 0);
    const view = buildChunk(k, k.chunks.get(`${cx},0`)!);
    expect([view.group.position.x, view.group.position.z]).toEqual([cx * S, 0]);
    let far = 0;
    view.group.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || o instanceof THREE.InstancedMesh) return;
      const pos = o.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) far = Math.max(far, Math.abs(pos.getX(i)), Math.abs(pos.getZ(i)));
    });
    expect(far).toBeLessThanOrEqual(S + 1);
    // What a float keeps there: a sixty-fourth of a tile is lost in the carpet's coordinates, kept in the place's.
    const x = cx * S + 1 / 64;
    expect(Math.fround(x) - x).not.toBe(0);
    expect(Math.abs(Math.fround(x - cx * S) - (x - cx * S))).toBe(0);
    // The swell's phases in double precision: the same waves the shader shows, a million tiles away.
    const [p] = swellPhases(x, 7);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThan(2 * Math.PI);
    expect(swellAt(x, 7, 1)).toBeCloseTo(0.026 * Math.sin(p + 1.1) + 0.014 * Math.sin(swellPhases(x, 7)[1] + 1.7) + 0.02 * Math.sin(swellPhases(x, 7)[2] + 0.75), 9);
  }, 60_000);

  it('a level of a planet is voxels on its globe: a top for every cell, the sea at its level, the planet’s centre at the origin', async () => {
    const { levelGeometry } = await import('../src/render/planet');
    const k = await Kernel.boot({ files: planetFiles(), store: memoryStore(), ai: new MockAiModels() });
    const lod = new PlanetLod();
    lod.fill((x, y) => k.planetTile(1, x, y), () => lod.ready < LOD_LEVELS);
    const g = levelGeometry(k, 1, LOD_LEVELS - 1, lod.codes[LOD_LEVELS - 1]!);
    const pos = g.getAttribute('position');
    expect(pos.count).toBeGreaterThanOrEqual(LOD_CELLS * LOD_CELLS * 6);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      lo = Math.min(lo, pos.getX(i));
      hi = Math.max(hi, pos.getX(i));
    }
    expect(lo).toBeCloseTo(-LOD_CELLS / 2, 1);
    expect(hi).toBeCloseTo(LOD_CELLS / 2, 1);
    expect(g.getAttribute('cell').count).toBe(pos.count);
    const whole = levelGeometry(k, 1, 0, lod.codes[0]!);
    whole.computeBoundingSphere();
    expect(whole.boundingSphere!.radius).toBeGreaterThan(GLOBE_RADIUS * 0.9);
  }, 120_000);
});

describe('i nomi coniati dal kernel senza parole offensive o ridicole (T462)', () => {
  it('il filtro sente le radici senza accenti, doppie, k/c e th/t', () => {
    expect(foldName('Thétta')).toBe('teta');
    expect(foldName('Kakka')).toBe(foldName('cacca'));
    for (const bad of ['Teruna', 'Terrone', 'Pene', 'Kaka', 'Cacca', 'Ruto', 'Kazzo', 'Thetta', 'Culoo', 'Nigero', 'Merde', 'Fuck', 'Puttana', 'Mierda', 'Salope', 'Ano'])
      expect(badRootOf(bad), bad).toBeDefined();
    for (const good of ['Velmar', 'Aldora', 'Doveldo', 'Ornali', 'Marisol', 'Adelina', 'Teodora']) expect(cleanCoined(good), good).toBe(true);
    // A root is written as the filter hears it.
    for (const r of COINED_ROOTS) expect(foldName(r)).toBe(r);
  });

  it("nessun pianeta senza nome ha una radice dell'elenco né una sillaba ripetuta, e i nomi restano tanti e fermi", () => {
    const names = new Set<string>();
    for (let seed = -5000; seed < 20000; seed++) {
      const name = planetName(seed);
      expect(badRootOf(name), name).toBeUndefined();
      expect(name).toMatch(/^[A-Z][a-z]+$/);
      expect(/^(?:(..)\1|(...)\2)/i.test(name), name).toBe(false);
      names.add(name);
    }
    expect(names.size).toBeGreaterThan(4000);
    expect(planetName(123456)).toBe(planetName(123456));
    // The planets of a nature without names, in many worlds.
    const n = repairNature({ geography: 'void', sky: 'stars', planets: Array.from({ length: MAX_PLANETS }, () => ({})) });
    for (let world = 0; world < 500; world++) for (const d of destinations(n, world).slice(1)) expect(cleanCoined(d.name), d.name).toBe(true);
  });

  it('neppure le persone coniate a sillabe quando i nomi del mondo sono finiti', () => {
    const taken: string[] = [];
    for (let i = 0; i < 30; i++) taken.push(freshName('person', 'female', taken, 'f'), freshName('person', 'male', taken, 'm'));
    const coined = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const name = freshName('person', i % 2 ? 'female' : 'male', taken, `seme${i}`);
      expect(cleanCoined(name), name).toBe(true);
      expect(name).toMatch(/^[A-Z][a-z]+$/);
      coined.add(name);
    }
    expect(coined.size).toBeGreaterThan(1000);
  });
});
