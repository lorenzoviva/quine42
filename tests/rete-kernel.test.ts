// The rule 10 of the steps in the kernel (T474, ADR-0250): inert with the relief of today, at work on a synthetic rise (`syntheticRise`,
// the tests' and the console's: levels over the land, never saved). With the relief of today no place has a rise beyond a step, a ramp or
// an enclave, and the network is the flood of its tiles. On a plateau eight levels over the land the wanderer and the people stop at its
// edge (up and down), the kernel joins what the world gives as reachable with ramps every step of which is walked, the jump clears a tile and
// not two, the way of the people goes round; a mesa a jump high stays an enclave where the place is mountainous, and what the Cartographer
// puts `enclave` stands up there; a region of the master says the roughness; a thin client has the server's ramps. No call to the models.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel, type Chunk } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { LEVEL } from '../src/kernel/relief';
import { gates } from '../src/kernel/layout';
import { STEP, type Network } from '../src/kernel/network';
import { SOLO } from '../src/kernel/wandererIds';
import { findRoute } from '../src/kernel/npc/route';
import type { TextCall } from '../src/kernel/ai/models';
import { fakeLink, type ChunkView } from '../src/session/protocol';
import { SessionServer } from '../src/session/server';
import { SessionClient } from '../src/session/client';
import { ThinClient } from '../src/session/thin';
import { developAll } from './espressivita/banco';

const S = 18;
/** A plateau in the middle of every place: tiles 6-11 of its columns and rows, `h` levels up (its border is the relief's). */
const plateau = (h: number, lo = 6, hi = 11) => (c: number, r: number) => {
  const a = ((c % S) + S) % S, b = ((r % S) + S) % S;
  return a >= lo && a <= hi && b >= lo && b <= hi ? h : 0;
};
const onPlateau = (c: number, r: number) => plateau(1)(c, r) === 1;

/** The level of a tile of the simulation, as the collision reads it. */
const level = (k: Kernel, c: number, r: number) => Math.round(k.groundAt(c + 0.5, r + 0.5) / LEVEL);
const planned = (k: Kernel) => [...k.chunks.values()].filter((ch) => ch.stage === 'planned' && ch.plan);
const walked = (k: Kernel, c: number, r: number) => k.palette[k.tileAt(c, r) ?? '']?.solid === false;

async function boot(rise?: (c: number, r: number) => number, ai = new MockAiModels()) {
  const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai });
  if (rise) k.syntheticRise(rise);
  await developAll(k);
  k.carpet()!.active = false;
  return k;
}

/** Puts the wanderer at a point of the carpet, on the ground there. */
function standAt(k: Kernel, x: number, y: number) {
  const p = k.wandererPos();
  Object.assign(k.carpet()!, { ox: x - p.x, oy: y - p.y });
  p.z = k.floorAt(x, y);
}

/** Walks the wanderer toward a point as the server walks a client's steps (`stepWanderer`), and says where they got. */
function walkTo(k: Kernel, x: number, y: number, steps = 80) {
  for (let i = 0; i < steps; i++) k.stepWanderer(SOLO, { x, y }, 0.2);
  return k.wandererCarpet();
}

/**
 * A row of a planned place where the plateau's west edge is clean: three walked tiles below it and three on it, none on a lot or a ramp,
 * each side at one level, the plateau `h` levels up. World coordinates: the row and the column of the plateau's first tile.
 */
function edgeOf(k: Kernel, h: number, want?: (ch: Chunk, cell: number) => boolean, lo = 6, hi = 11): { row: number; col: number } | undefined {
  for (const ch of planned(k)) {
    const onRamp = new Set(Object.keys(ch.ramps ?? {}).map(Number));
    const inLot = (c: number, r: number) => ch.lots.some((b) => c >= b.x0 && c <= b.x1 && r >= b.y0 && r <= b.y1);
    for (let r = lo; r <= hi; r++) {
      const cols = [lo - 3, lo - 2, lo - 1, lo, lo + 1, lo + 2];
      const ok = cols.every((c) => walked(k, ch.cx * S + c, ch.cy * S + r) && !onRamp.has(r * S + c) && !inLot(c, r));
      const lv = cols.map((c) => level(k, ch.cx * S + c, ch.cy * S + r));
      if (ok && lv[0] === lv[1] && lv[1] === lv[2] && lv[3] === lv[4] && lv[4] === lv[5] && lv[3] - lv[2] === h && (!want || want(ch, r * S + lo))) return { row: ch.cy * S + r, col: ch.cx * S + lo };
    }
  }
  return undefined;
}

/** Every step of a place's ramps walked on the kernel's levels (with the earth they moved). */
function rampsWalked(k: Kernel, ch: Chunk): boolean {
  const lv = (c: number) => level(k, ch.cx * S + (c % S), ch.cy * S + Math.floor(c / S));
  return (ch.network?.ramps ?? []).every((r) => r.every((c, i) => i === 0 || Math.abs(lv(c) - lv(r[i - 1])) <= STEP));
}

describe('the rule 10 of the steps, inert with the relief of today (T474)', () => {
  it('no place has a rise beyond a step, a ramp, an enclave or something stranded; its network is the flood of its tiles', async () => {
    const k = await boot();
    const list = planned(k);
    expect(list.length).toBeGreaterThan(4);
    for (const ch of list) {
      const net = ch.network as Network;
      expect(net, ch.key).toBeDefined();
      expect([net.ramps.length, Object.keys(net.moved).length, net.enclaves.length, net.stranded.length, ch.ramps], ch.key).toEqual([0, 0, 0, 0, undefined]);
      expect(['flat', 'hilly'], ch.key).toContain(net.roughness);
      for (let r = 0; r < S; r++)
        for (let c = 0; c < S; c++) {
          const col = ch.cx * S + c, row = ch.cy * S + r;
          for (const [dc, dr] of [[1, 0], [0, 1]]) if (k.chunkAt(col + dc, row + dr)?.stage === 'planned') expect(Math.abs(level(k, col, row) - level(k, col + dc, row + dr)), `${col},${row}`).toBeLessThanOrEqual(STEP);
        }
      // The network is what a flood of the tiles reaches from it, with no rise in the way: the same tiles.
      const open = (i: number) => k.palette[ch.tiles[i]]?.solid === false || (ch.plan!.swim === true && k.palette[ch.tiles[i]]?.cross === 'swim');
      const first = net.reach.indexOf(1);
      expect(first, ch.key).toBeGreaterThanOrEqual(0);
      const seen = new Uint8Array(S * S);
      const q = [first];
      seen[first] = 1;
      while (q.length) {
        const i = q.pop()!;
        const c = i % S, r = Math.floor(i / S);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = (r + dr) * S + c + dc;
          if (c + dc < 0 || r + dr < 0 || c + dc >= S || r + dr >= S || seen[n] || !open(n)) continue;
          seen[n] = 1;
          q.push(n);
        }
      }
      expect([...net.reach], ch.key).toEqual([...seen]);
    }
  }, 120_000);
});

describe('a plateau eight levels high (T474, the synthetic rise)', () => {
  it('the wanderer stops at its edge, going up and coming down; on the plateau and below they walk; a rise of a step is walked', async () => {
    const k = await boot(plateau(8));
    const edge = edgeOf(k, 8);
    expect(edge, 'a clean edge of the plateau').toBeDefined();
    const { col: e, row } = edge!;
    const y = row + 0.5;
    // Straddling the edge: no box stands there, for the wanderer, the people and the things.
    expect(k.bodyFree(e, y, 0.3)).toBe(false);
    expect(k.free(e, y, 0.3)).toBe(false);
    expect(k.bodyFree(e - 0.5, y, 0.3) && k.bodyFree(e + 0.5, y, 0.3)).toBe(true);
    // Up: from below, east into the cliff: stopped before it.
    standAt(k, e - 2.5, y);
    const up = walkTo(k, e + 2.5, y);
    expect(up.x).toBeLessThan(e - 0.3 + 1e-6);
    expect(up.x).toBeGreaterThan(e - 0.5);
    // Down: from the plateau, west: stopped at its edge.
    standAt(k, e + 2.5, y);
    const down = walkTo(k, e - 2.5, y);
    expect(down.x).toBeGreaterThan(e + 0.3 - 1e-6);
    expect(down.x).toBeLessThan(e + 0.5);
    // A rise of a step only is walked across.
    k.syntheticRise(plateau(STEP));
    expect(level(k, e, row) - level(k, e - 1, row)).toBe(STEP);
    standAt(k, e - 2.5, y);
    expect(walkTo(k, e + 2.5, y).x).toBeGreaterThan(e + 2.3);
  }, 120_000);

  it('the kernel joins what the world gives as reachable: ramps every step of which is walked, nothing stranded, the borders kept', async () => {
    const k = await boot(plateau(8));
    let ramps = 0;
    for (const ch of planned(k)) {
      const net = ch.network!;
      expect(net.stranded, ch.key).toEqual([]);
      ramps += net.ramps.length;
      expect(rampsWalked(k, ch), ch.key).toBe(true);
      // The border is the relief's: the gates meet the next place as before.
      for (const g of gates(ch.cx, ch.cy, S, k.config.seed)) expect(onPlateau(ch.cx * S + (g % S), ch.cy * S + Math.floor(g / S))).toBe(false);
      // What the world gives as reachable (the paths) is on the network.
      const path = (k as unknown as { pathCode(): string }).pathCode();
      for (let i = 0; i < S * S; i++) if (ch.tiles[i] === path) expect(net.reach[i], `${ch.key} ${i}`).toBe(1);
    }
    expect(ramps).toBeGreaterThan(0);
  }, 120_000);

  it('the jump clears a tile and not two; the way of the people never crosses a cliff: round by a ramp, or none to an enclave', async () => {
    const k = await boot(plateau(4));
    const edge = edgeOf(k, 4);
    expect(edge, 'a clean edge of the plateau').toBeDefined();
    const { col: e, row } = edge!;
    const y = row + 0.5;
    // Four levels (a tile): the wanderer jumps up onto it.
    standAt(k, e - 1.1, y);
    k.wandererComp().facing = 'right';
    expect(k.jump()).toBe(true);
    for (let i = 0; i < 120; i++) k.tick(1 / 60);
    expect(k.wandererCarpet().x).toBeGreaterThan(e);
    expect(level(k, Math.floor(k.wandererCarpet().x), row)).toBe(level(k, e, row));
    // Eight levels (two tiles): no jump lands up there.
    k.syntheticRise(plateau(8));
    const high = edgeOf(k, 8);
    expect(high).toBeDefined();
    standAt(k, high!.col - 1.1, high!.row + 0.5);
    k.wandererComp().facing = 'right';
    k.jump();
    for (let i = 0; i < 120; i++) k.tick(1 / 60);
    expect(k.wandererCarpet().x).toBeLessThan(high!.col);
    // The way of the people: every step of it walked, none across the edge of the plateau. A plateau of 36 tiles is kept as an enclave a
    // climb reaches (T477: every world climbs) and no way of theirs goes up; one of 100 (31 % of the place, beyond the mountainous quota) is
    // joined, and the way goes round by a ramp.
    const kept = edgeOf(k, 8, (ch, cell) => ch.network!.enclaves.some((e) => e.kept && e.cells.includes(cell)));
    expect(kept, 'a plateau kept as an enclave').toBeDefined();
    const people = (a: { col: number; row: number }) => findRoute([a.col - 3, a.row], [a.col + 2, a.row], (c, r) => k.free(c + 0.5, r + 0.5, 0.35), (c, r, nc, nr) => !k.riseOnStep(c, r, nc, nr), 0, 4000);
    expect(people(kept!), 'the people do not climb to an enclave').toBeUndefined();
    k.syntheticRise(plateau(8, 4, 13));
    const joined = edgeOf(k, 8, (ch, cell) => ch.network!.reach[cell] === 1, 4, 13);
    expect(joined, 'a plateau the network joins').toBeDefined();
    const h = joined!;
    expect(k.riseOnStep(h.col - 1, h.row, h.col, h.row)).toBe(true);
    expect(k.riseOnStep(h.col - 1, h.row - 1, h.col, h.row)).toBe(true);
    const way = people(h);
    expect(way, 'the plateau is joined: a way goes round, by a ramp').toBeDefined();
    for (let i = 1; i < way!.length; i++) expect(k.riseOnStep(way![i - 1][0], way![i - 1][1], way![i][0], way![i][1])).toBe(false);
    expect(way!.length).toBeGreaterThan(6);
  }, 120_000);
});

/** The local models, with the plans they were asked kept. */
class Recording extends MockAiModels {
  plans: TextCall[] = [];
  override async text(call: TextCall): Promise<string> {
    if (call.task === 'chunk.plan') this.plans.push(call);
    return super.text(call);
  }
}

describe('a mesa a jump high: an enclave (T474)', () => {
  it('kept where the place is mountainous, with what the Cartographer puts there; told in the request, with `enclave` in the schema', async () => {
    const ai = new Recording();
    const k = await boot(plateau(4), ai);
    // The places whose network keeps the mesa: an enclave with its pass, the means a jump.
    const kept = planned(k).filter((ch) => ch.network!.enclaves.some((e) => e.kept));
    expect(kept.length).toBeGreaterThan(0);
    for (const ch of kept) {
      expect(ch.network!.roughness).toBe('mountainous');
      for (const e of ch.network!.enclaves.filter((x) => x.kept)) {
        // Four levels over the hills of today, which differ by at most two between neighbours: a pass a jump clears.
        expect(e.pass).toBeGreaterThan(STEP);
        expect(e.pass).toBeLessThanOrEqual(4);
        expect(e.means).toBe('jump');
        expect(e.cells.every((i) => onPlateau(ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S)))).toBe(true);
      }
    }
    // The Cartographer heard of it: the relief in the request, the place `enclave` offered.
    const told = ai.plans.filter((p) => (p.data as { relief?: unknown })?.relief);
    expect(told.length).toBeGreaterThan(0);
    expect(told[0].prompt).toMatch(/"where": enclave/);
    expect(JSON.stringify(told[0].schema)).toContain('"enclave"');
    // A place of today is told nothing: no relief, no `enclave` in its schema.
    const plain = ai.plans.filter((p) => !(p.data as { relief?: unknown })?.relief);
    for (const p of plain) expect(JSON.stringify(p.schema)).not.toContain('enclave');
    // The chest the local Cartographer put up there (where the plan says `enclave`) stands on the mesa.
    const withChest = kept.filter((ch) => ch.plan!.objects.some((o) => o.where === 'enclave'));
    expect(withChest.length).toBeGreaterThan(0);
    for (const ch of withChest) {
      const i = ch.plan!.objects.findIndex((o) => o.where === 'enclave');
      const id = k.ecs.query('origin').find((x) => (k.ecs.get(x, 'origin') as { key: string }).key === `${ch.key}#o${i}`);
      expect(id, ch.key).toBeDefined();
      const p = k.ecs.get(id!, 'pos') as { x: number; y: number };
      expect(onPlateau(Math.floor(p.x), Math.floor(p.y)), ch.key).toBe(true);
    }
  }, 120_000);

  it('a region of the master says the roughness of its new places, a word of the four; the plan keeps it', async () => {
    const k = await boot();
    const env = Object.keys(k.content.layouts)[0];
    const ok = await k.declareRegion({ name: 'Piana', center: [3, 0], radius: 1, kind: 'filler', environment: env, roughness: 'flat' });
    expect(ok.ok && ok.region.roughness).toBe('flat');
    const bad = await k.declareRegion({ name: 'Rupi', center: [-3, 0], radius: 1, kind: 'filler', environment: env, roughness: 'scoscesa' });
    expect(bad.ok).toBe(false);
    expect(!bad.ok && bad.reasons.join(' ')).toMatch(/asprezza/);
    const held = await k.declareRegion({ name: 'Ferma', center: [0, 4], radius: 1, kind: 'held', roughness: 'rugged' });
    expect(held.ok).toBe(false);
    // A place of the region planned from now on says the roughness in its plan.
    const S0 = k.config.chunkSize;
    standAtPlace(k, 3, 0);
    for (let i = 0; i < 60 && k.chunks.get('3,0')?.stage !== 'planned'; i++) {
      k.tick(1 / 60);
      await new Promise((r) => setTimeout(r, 25));
    }
    const ch = k.chunks.get('3,0');
    expect(ch?.stage, `${S0}`).toBe('planned');
    expect(ch!.plan!.roughness).toBe('flat');
  }, 120_000);
});

/** Puts the wanderer in the middle of a place. */
function standAtPlace(k: Kernel, cx: number, cy: number) {
  standAt(k, cx * S + S / 2, cy * S + S / 2);
}

describe('the ramps over the wire (T474)', () => {
  it('a thin client gets the server’s ramps with the place, and its ground is the server’s', async () => {
    const cfg = JSON.parse(bundledFiles['universe.json']!);
    const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    k.syntheticRise(plateau(8));
    const server = new SessionServer(k);
    const { server: s, client: c } = fakeLink();
    const views: ChunkView[] = [];
    c.onMessage((m) => void views.push(...((m as { chunks?: ChunkView[] }).chunks ?? [])));
    server.connect(s);
    const session = new SessionClient(c, { id: 'anna', name: 'Anna' });
    await session.ready;
    const mirror = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
    mirror.syntheticRise(plateau(8));
    const thin = new ThinClient(mirror, session);
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        mirror.tick(1 / 60);
        thin.frame(1 / 60);
        server.tick(1 / 60);
      }
    };
    for (let i = 0; i < 80 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
      run(1);
      await new Promise((r) => setTimeout(r, 25));
    }
    run(6);
    const ch = k.chunks.get('0,0')!;
    expect(Object.keys(ch.ramps ?? {}).length).toBeGreaterThan(0);
    expect(views.find((v) => v.key === '0,0' && v.ramps)?.ramps).toEqual(ch.ramps);
    expect(mirror.chunks.get('0,0')!.ramps).toEqual(ch.ramps);
    for (let cell = 0; cell < S * S; cell++) expect(mirror.groundAt((cell % S) + 0.5, Math.floor(cell / S) + 0.5), `${cell}`).toBe(k.groundAt((cell % S) + 0.5, Math.floor(cell / S) + 0.5));
  }, 90_000);
});
