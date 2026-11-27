// The inset of the terrains, the curb and the wide streets (T548, C4 of docs/design/terreno-ricco.md, ADR-0270). The inset: how much lower
// or higher a terrain's top is drawn (a road under its sidewalk, the ballast of a railway), said by `TerrainDef.inset` or by its name (the
// repair of the universes of before), read without trusting, drawn by the place's mesh with its curb and the same in the worker; the kernel
// never reads it: its levels, its collision and its network are the same. The wide streets: where the layout's path is a road by its name,
// the roads of the plans with the mark are 2-4 tiles wide with the sidewalk at their sides; only codes of the ground one walks change, so
// what is walked, what is reached and the network are the same. No call to the models.

import { describe, expect, it } from 'vitest';
import { Kernel, type Chunk } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { INSET_LIMITS, insetByName, insetErrors, insetKind, insetOf, readInset } from '../src/kernel/inset';
import { MIN_ROAD, readStreet, streetErrors, streetOf, widenStreets, type Street } from '../src/kernel/streets';
import { layout } from '../src/kernel/layout';
import { toPalette } from '../src/kernel/agents/genesis';
import { Validator } from '../src/kernel/validator';
import { chunkInput } from '../src/render/terrain';
import { answerChunk, chunkArrays, inputSource } from '../src/render/terrainmesh';
import type { TerrainDef } from '../src/kernel/types';
import { developAll } from './espressivita/banco';

const ground = (name: string, extra: object = {}) => ({ name, layer: 'ground', solid: false, color: '#5e5e64', ...extra });

describe('il rientro dei terreni: il campo e la riparazione dal nome (T548)', () => {
  it('si legge senza fidarsi: un numero nell’intervallo, al centesimo', () => {
    expect(readInset(-0.12)).toBe(-0.12);
    expect(readInset(-0.123)).toBe(-0.12);
    expect(readInset(1)).toBe(INSET_LIMITS[1]);
    expect(readInset(-3)).toBe(INSET_LIMITS[0]);
    expect(readInset(0)).toBe(0);
    for (const bad of [undefined, null, 'basso', NaN, Infinity, {}, []]) expect(readInset(bad), String(bad)).toBeUndefined();
    // Always under a level of the relief (0.25): never a step.
    expect(Math.max(-INSET_LIMITS[0], INSET_LIMITS[1])).toBeLessThan(0.25);
  });

  it('il nome dice il rientro del suolo che si cammina: la strada sotto il marciapiede, il fosso, la massicciata sopra', () => {
    expect(insetKind(ground('strada'))).toBe('road');
    expect(insetKind(ground('asfalto del parcheggio'))).toBe('road');
    expect(insetKind(ground('strada lastricata'))).toBe('road');
    expect(insetKind(ground('main street'))).toBe('road');
    expect(insetKind(ground('binari'))).toBe('ballast');
    expect(insetKind(ground('railway tracks'))).toBe('ballast');
    expect(insetKind(ground('fosso di scolo'))).toBe('ditch');
    expect(insetByName(ground('strada'))).toBeLessThan(0);
    expect(insetByName(ground('binari'))).toBeGreaterThan(0);
    // Not the paths, the tracks, the sidewalks, the meadows; not what is not the ground one walks.
    for (const name of ['sentiero', 'pista battuta', 'marciapiede', 'prato', 'passerella', 'terra battuta'])
      expect(insetKind(ground(name)), name).toBeUndefined();
    expect(insetKind({ name: 'muro della strada', layer: 'wall', solid: true })).toBeUndefined();
    expect(insetKind({ name: 'pavimento stradale', layer: 'floor', solid: false })).toBeUndefined();
    expect(insetKind({ name: 'strada allagata', layer: 'liquid', solid: true })).toBeUndefined();
    // The base ground is the level of the world: never inset, whatever its name (in sidera it is «asfalto bagnato»).
    expect(insetOf(ground('asfalto bagnato'), 'g')).toBe(0);
    expect(insetOf(ground('asfalto bagnato'), 'e')).toBe(-0.12);
  });

  it('ciò che il terreno dice vince sul nome, e 0 lo toglie', () => {
    expect(insetOf({ ...ground('strada'), inset: -0.05 }, 'p')).toBe(-0.05);
    expect(insetOf({ ...ground('strada'), inset: 0 }, 'p')).toBe(0);
    expect(insetOf({ ...ground('prato'), inset: 0.1 }, 'm')).toBe(0.1);
    expect(insetOf({ ...ground('strada'), inset: 'tanto' }, 'p')).toBe(0);
    expect(insetOf(ground('strada'), 'p')).toBe(insetByName(ground('strada')));
    expect(insetOf(undefined)).toBe(0);
  });

  it('il validatore vuole un rientro nell’intervallo e mai sul suolo di base', () => {
    expect(insetErrors('p', undefined)).toEqual([]);
    expect(insetErrors('p', -0.12)).toEqual([]);
    expect(insetErrors('p', -0.5)).toHaveLength(1);
    expect(insetErrors('p', 'basso')).toHaveLength(1);
    expect(insetErrors('g', -0.1)).toHaveLength(1);
    expect(insetErrors('g', 0)).toEqual([]);
    const manifest = (inset: unknown) =>
      JSON.stringify({ id: 'world.prova', name: 'prova', kind: 'generator', tiles: { p: { name: 'strada', color: '#5e5e64', solid: false, layer: 'ground', cross: 'walk', inset } } });
    const v = new Validator({ check: () => undefined } as never);
    expect(v.parseManifest('modules/world.prova/manifest.json', manifest(-0.12)).errors).toEqual([]);
    expect(v.parseManifest('modules/world.prova/manifest.json', manifest(0.4)).errors.join(' ')).toMatch(/inset/);
  });

  it('la Genesi passa il rientro che il Cartografo dice solo al suolo che si cammina, mai al suolo di base', () => {
    const raw = (code: string, name: string, layer: string, inset?: unknown) => ({ code, name, description: '', color: '#5e5e64', layer, solid: layer !== 'ground', speed: 1, inset }) as never;
    const p = toPalette([raw('g', 'asfalto bagnato', 'ground', -0.12), raw('p', 'strada', 'ground', -0.14), raw('h', 'muro', 'wall', -0.1), raw('a', 'binari', 'ground', 7), raw('m', 'aiuola', 'ground', 'su')]);
    expect(p.p!.inset).toBe(-0.14);
    expect(p.a!.inset).toBe(INSET_LIMITS[1]);
    expect(p.g!.inset).toBeUndefined();
    expect(p.h!.inset).toBeUndefined();
    expect(p.m!.inset).toBeUndefined();
  });
});

/** The seed with its path called a road: the inset by name and the wide streets of a new place. */
function roadSeed(name = 'strada'): Record<string, string> {
  const files = { ...bundledFiles };
  const path = 'modules/world.terrain/manifest.json';
  const m = JSON.parse(files[path]!);
  m.tiles.p.name = name;
  files[path] = JSON.stringify(m);
  return files;
}

const S = 18;
/** A plateau in the middle of every place, `h` levels up: the network has ramps to make. */
const plateau = (h: number) => (c: number, r: number) => {
  const a = ((c % S) + S) % S, b = ((r % S) + S) % S;
  return a >= 6 && a <= 11 && b >= 6 && b <= 11 ? h : 0;
};

async function boot(files: Record<string, string>, rise?: (c: number, r: number) => number) {
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
  if (rise) k.syntheticRise(rise);
  await developAll(k);
  return k;
}

const planned = (k: Kernel) => new Map([...k.chunks.values()].filter((c) => c.stage === 'planned' && c.plan).map((c) => [c.key, c] as const));
const walkedOf = (k: Kernel, ch: Chunk) => [...ch.tiles].map((c) => (k.palette[c]?.solid === false ? 1 : 0)).join('');

describe('il rientro e le strade larghe non toccano il kernel (T548)', () => {
  it('i livelli, la collisione e la rete sono gli stessi: solo i codici del suolo che si cammina cambiano, e il rientro non si legge', async () => {
    const before = await boot(bundledFiles, plateau(8));
    const after = await boot(roadSeed(), plateau(8));
    // The road is a road for the mesh (-0.12), not for the kernel.
    expect(insetOf(after.palette.p, 'p')).toBe(-0.12);
    const a = planned(before), b = planned(after);
    expect(a.size).toBeGreaterThan(0);
    expect([...b.keys()].sort()).toEqual([...a.keys()].sort());
    let widened = 0;
    for (const [key, ca] of a) {
      const cb = b.get(key)!;
      expect(cb.plan!.streets, key).toBe(true);
      // What is walked is the same tile by tile; what changed is the base ground become the road.
      expect(walkedOf(after, cb), key).toBe(walkedOf(before, ca));
      for (let i = 0; i < ca.tiles.length; i++) if (ca.tiles[i] !== cb.tiles[i]) (expect(`${ca.tiles[i]}→${cb.tiles[i]}`).toBe('g→p'), widened++);
      // The network: the same levels, the same reach, the same ramps and enclaves.
      expect(cb.network, key).toBeDefined();
      expect(Array.from(cb.network!.levels), key).toEqual(Array.from(ca.network!.levels));
      expect(Array.from(cb.network!.reach), key).toEqual(Array.from(ca.network!.reach));
      expect(cb.network!.ramps, key).toEqual(ca.network!.ramps);
      expect(cb.network!.moved, key).toEqual(ca.network!.moved);
      expect(cb.network!.enclaves.map((e) => e.cells), key).toEqual(ca.network!.enclaves.map((e) => e.cells));
      expect(cb.network!.stranded, key).toEqual(ca.network!.stranded);
      // The ground and the floor the kernel reads, the collision: the inset is not there.
      for (let r = 0; r < S; r++)
        for (let c = 0; c < S; c++) {
          const x = ca.cx * S + c + 0.5, y = ca.cy * S + r + 0.5;
          expect(after.groundAt(x, y)).toBe(before.groundAt(x, y));
          expect(after.floorAt(x, y)).toBe(before.floorAt(x, y));
          expect(after.free(x, y, 0.3)).toBe(before.free(x, y, 0.3));
        }
    }
    expect(widened).toBeGreaterThan(0);
  }, 60_000);

  it('la mesh disegna la strada più bassa del marciapiede col cordolo dove si toccano, uguale nel worker', async () => {
    const k = await boot(roadSeed());
    const ch = [...planned(k).values()].find((c) => c.tiles.includes('p') && c.tiles.includes('g'))!;
    expect(ch).toBeDefined();
    const a = chunkArrays(inputSource(chunkInput(k, ch)));
    const { answer } = answerChunk(1, structuredClone(chunkInput(k, ch)));
    if (!answer.ok) throw new Error(answer.error);
    expect(answer.arrays.ground.position).toEqual(a.ground.position);
    // Every top of a road tile is 0.12 under the ground the kernel says there.
    const X0 = ch.cx * S, Z0 = ch.cy * S;
    const pos = a.ground.position, nor = a.ground.normal;
    let roadTops = 0, curbs = 0;
    for (let v = 0; v < pos.length / 3; v += 6) {
      const x = pos[v * 3]! + X0, y = pos[v * 3 + 1]!, z = pos[v * 3 + 2]! + Z0;
      if (nor[v * 3 + 1] === 1) {
        // The tile of this top: the middle of its first triangle's corners.
        const cx = Math.floor((x + pos[(v + 2) * 3]! + X0) / 2), cz = Math.floor((z + pos[(v + 2) * 3 + 2]! + Z0) / 2);
        if (k.tileAt(cx, cz) === 'p') {
          expect(y).toBeCloseTo(k.groundAt(cx, cz) - 0.12, 6);
          roadTops++;
        }
      } else if (nor[v * 3 + 1] === 0) {
        // A side as tall as the inset: the curb.
        const ys = [0, 1, 2].map((j) => pos[(v + j) * 3 + 1]!);
        if (Math.abs(Math.max(...ys) - Math.min(...ys) - 0.12) < 1e-6) curbs++;
      }
    }
    expect(roadTops).toBe([...ch.tiles].filter((c) => c === 'p').length);
    expect(curbs).toBeGreaterThan(0);
    // Said 0, the road is level with its sidewalk: no curb, fewer triangles.
    k.palette.p!.inset = 0;
    try {
      const flat = chunkArrays(inputSource(chunkInput(k, ch)));
      expect(flat.ground.position.length).toBeLessThan(a.ground.position.length);
    } finally {
      delete k.palette.p!.inset;
    }
  }, 60_000);
});

describe('le strade larghe (T548)', () => {
  const pal = (extra: Record<string, Partial<TerrainDef>> = {}): Record<string, TerrainDef> =>
    ({
      g: { name: 'prato', color: '#5a9e48', solid: false, layer: 'ground' },
      p: { name: 'strada', color: '#5e5e64', solid: false, layer: 'ground' },
      h: { id: 'wall', name: 'muro', color: '#d8b88a', solid: true, layer: 'wall' },
      t: { name: 'platani', color: '#3e7a3a', solid: true, layer: 'vegetation' },
      w: { id: 'water', name: 'acqua', color: '#3c7cc8', solid: true, layer: 'liquid', cross: 'swim' },
      ...extra,
    }) as Record<string, TerrainDef>;

  it('la strada è la via del layout quando il suo nome la dice: non un sentiero; la larghezza dell’ambiente, letta senza fidarsi', () => {
    expect(streetOf(pal(), 'p', 'g')).toEqual({ road: 'p', width: 3, base: 'g' });
    expect(streetOf(pal({ p: { name: 'sentiero', color: '#aa8855', solid: false, layer: 'ground' } }), 'p', 'g')).toBeUndefined();
    expect(streetOf(pal(), 'p', 'g', { street: { width: 2 } })?.width).toBe(2);
    expect(streetOf(pal(), 'p', 'g', { street: { width: 9 } })?.width).toBe(4);
    expect(streetOf(pal(), 'p', 'g', { street: { width: 1 } })).toBeUndefined();
    expect(streetOf(pal(), 'p', 'g', { street: 'larga' })?.width).toBe(3);
    // The sidewalk: the terrain named so, or the environment's if it is ground one walks; never a wall.
    const withSide = pal({ m: { name: 'marciapiede', color: '#b8b0a2', solid: false, layer: 'ground' } });
    expect(streetOf(withSide, 'p', 'g')?.sidewalk).toBe('m');
    expect(streetOf(withSide, 'p', 'g', { street: { sidewalk: 'h' } })?.sidewalk).toBe('m');
    expect(streetOf(pal(), 'p', 'g', { street: { sidewalk: 'h' } })?.sidewalk).toBeUndefined();
    expect(readStreet({ width: 2.6, sidewalk: 'mm' })).toEqual({ width: 3 });
    expect(streetErrors('corso', { width: 3, sidewalk: 'm' })).toEqual([]);
    expect(streetErrors('corso', { width: 7 })).toHaveLength(1);
    expect(streetErrors('corso', 'larga')).toHaveLength(1);
  });

  /** A place of 18 with a road down column 9 from the north gate, a house, a pond, trees, and a bit of road alone. */
  function place(): string[][] {
    const rows = Array.from({ length: S }, () => Array<string>(S).fill('g'));
    for (let y = 0; y < S - 1; y++) rows[y]![9] = 'p';
    for (let x = 3; x <= 6; x++) rows[4]![x] = rows[7]![x] = 'h';
    for (let y = 4; y <= 7; y++) rows[y]![3] = rows[y]![6] = 'h';
    rows[10]![10] = 'w';
    rows[12]![8] = 't';
    rows[15]![3] = 'p';
    return rows;
  }
  const north = 9, gatesOf = [8 * S, 8 * S + S - 1, north, (S - 1) * S + 2];

  it('si allarga sul suolo di base, mai su muri, acqua, alberi, né sul bordo fuori dal varco; il pezzo di strada da solo resta', () => {
    const cells = place();
    const street: Street = { road: 'p', width: 3, base: 'g' };
    const changed = widenStreets(cells, S, street, gatesOf);
    const at = (x: number, y: number) => cells[y]![x];
    // Three wide down the line, where the base ground was.
    for (let y = 1; y < S - 1; y++) if (y !== 10 && y !== 12) expect([at(8, y), at(9, y), at(10, y)].join(''), `riga ${y}`).toBe('ppp');
    expect(at(10, 10)).toBe('w');
    expect(at(8, 12)).toBe('t');
    // Along the gate on the north edge, never elsewhere on the border.
    expect([at(8, 0), at(9, 0), at(10, 0)].join('')).toBe('ppp');
    expect(at(7, 0)).toBe('g');
    expect(at(8, S - 1)).toBe('g');
    // The bit of road alone (fewer than MIN_ROAD tiles, no gate) stays a bit.
    expect(MIN_ROAD).toBeGreaterThan(1);
    expect([at(2, 15), at(3, 15), at(4, 15)].join('')).toBe('gpg');
    // The house is untouched.
    expect(at(3, 4) + at(6, 7)).toBe('hh');
    expect([...changed].every((i) => cells[Math.floor(i / S)]![i % S] === 'p')).toBe(true);
  });

  it('larga 2 e 4: metà verso le x e le y minori, il resto verso le maggiori; il marciapiede ai lati, dentro il bordo', () => {
    const two = place();
    widenStreets(two, S, { road: 'p', width: 2, base: 'g' }, gatesOf);
    expect(two[5]!.slice(8, 11).join('')).toBe('gpp');
    const four = place();
    const side = widenStreets(four, S, { road: 'p', width: 4, base: 'g', sidewalk: 'm' }, gatesOf);
    expect(four[5]![7]).toBe('m');
    expect(four[5]!.slice(8, 12).join('')).toBe('pppp');
    expect(four[5]![12]).toBe('m');
    // Never on the border ring.
    expect(four[0]![7]).toBe('g');
    expect([...side].some((i) => four[Math.floor(i / S)]![i % S] === 'm')).toBe(true);
  });

  it('nel layout: solo col segno, ciò che si cammina e ciò che si raggiunge restano gli stessi, il varco va avanti largo dai due lati', () => {
    const p = pal();
    const draft = Array.from({ length: S }, (_, y) => Array.from({ length: S }, (_, x) => ((x * 7 + y * 3) % 11 === 0 ? 't' : 'g')).join(''));
    const opts = { cx: 2, cy: 3, seed: 7, pathCode: 'p', swim: true };
    const narrow = layout(draft, p, opts);
    const wide = layout(draft, p, { ...opts, street: {} });
    expect(narrow.widened).toBeUndefined();
    expect(wide.widened?.size).toBeGreaterThan(0);
    const walked = (g: string[]) => g.join('').split('').map((c) => (p[c]!.solid ? 0 : 1)).join('');
    expect(walked(wide.grid)).toBe(walked(narrow.grid));
    expect([...wide.reachable].sort((a, b) => a - b)).toEqual([...narrow.reachable].sort((a, b) => a - b));
    expect(wide.lots).toEqual(narrow.lots);
    // The place beside on the east: its west gate is this one's east gate, widened along the edge by the same rule.
    const east = layout(draft, p, { ...opts, cx: 3, street: {} });
    const e = wide.gates[1]!, w = east.gates[0]!;
    expect(Math.floor(e / S)).toBe(Math.floor(w / S));
    if (wide.grid[Math.floor(e / S)]![S - 1] === 'p' && east.grid[Math.floor(w / S)]![0] === 'p') {
      const edge = (g: string[], col: number) => g.map((r) => r[col]).join('');
      const a = edge(wide.grid, S - 1), b = edge(east.grid, 0);
      const row = Math.floor(e / S);
      expect(a.slice(row - 1, row + 2).replace(/[^p]/g, '')).toBe(b.slice(row - 1, row + 2).replace(/[^p]/g, ''));
    }
  });
});
