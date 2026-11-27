// The second trial of the modular structures (T543, docs/design/strutture-modulari.md § 10-11, lab/strutture-modulari/grande/README.md): the
// large set (three styles of 53 bricks, 160 with the air), the massing as a MarkovJunior program of the Architect, the way A (the massing
// and a `wfc` in one program, run by the game's engine) and the way B (the kernel's weaver of T522 in regions over the places), measured on
// the same massings at several seeds: rule 10 on the graph of the bricks and with the kernel's own walk, the rooms, the contradictions, the
// time and the memory, the variance between seeds and between sets; the photos beside T522's. No calls, nothing of the game changes.
//
//   npx vite-node lab/scripts/strutture-modulari-grandi.ts [-- --semi 6] [--foto] [--json lab/strutture-modulari/grande/misure.json]

import fs from 'node:fs';
import path from 'node:path';
import { walkIn } from '../../src/kernel/forms';
import { hash32 } from '../../src/kernel/rng';
import { WORLD_NODE_LIMITS } from '../../src/kernel/validator';
import { FORM_LIMITS } from '../../src/mj/run';
import { STRUCTURE_SIDE } from '../../src/mj/classes';
import { DEFAULT_RENDER, render, sheet, shrink, type Picture } from '../../src/mj/photo';
import type { Grid3 } from '../../src/mj/engine';
import { brickSet, propagatorEntries, type BrickSet } from '../strutture-modulari/grande/facce';
import { massing, massingText, STOREYS, type Ground } from '../strutture-modulari/grande/massa';
import { AIR, ALPHABET, Block, C, H, PALETTE, SETS, STYLES, VPT, type Style } from '../strutture-modulari/grande/tasselli';
import { ENGINE_WAVE, engineRun, tilesetText, viaA } from '../strutture-modulari/grande/via-a';
import { Weaver } from '../strutture-modulari/grande/via-b';
import { stitch, wantedBays } from '../strutture-modulari/grande/ricucitura';
import { bricksUsed, difference, looks, reachedBays, reachOf, roomsOf, spread, violations, voxelsOf, type Fabric, type Reach, type Rooms } from '../strutture-modulari/grande/misure';
import { brickSet as t522Set } from '../strutture-modulari/facce';
import { BRICKS as T522_BRICKS, PALETTE as T522_PALETTE } from '../strutture-modulari/tasselli';
import { baseFabric as t522Base, isStreet as t522Street, PLACE as T522_PLACE, voxels as t522Voxels, Weaver as T522Weaver } from '../strutture-modulari/tessuto';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string, d: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const SEEDS = Number(opt('semi', '6'));
const photos = args.includes('--foto');
const jsonOut = opt('json', '');
const dir = path.resolve('lab/strutture-modulari/grande/foto');
const palette = PALETTE as Record<string, { name: string; color: string }>;
const seeds = [...Array(SEEDS).keys()].map((k) => k + 1);
const pct = (r: [number, number]) => `${r[0]}/${r[1]} (${r[1] ? Math.round((100 * r[0]) / r[1]) : 0} %)`;
const mb = (b: number) => `${(b / 2 ** 20).toFixed(1)} MB`;
const heap = () => process.memoryUsage().rss;
const out: Record<string, unknown> = {};

// ---------------------------------------------------------------- the sets

const sets = new Map<Style | 'unione', BrickSet>();
const setReport: Record<string, unknown> = {};
for (const s of [...STYLES, 'unione'] as const) {
  const t0 = performance.now();
  const set = brickSet(s === 'unione' ? [...STYLES.flatMap((x) => SETS[x]), AIR] : [...SETS[s], AIR]);
  const ms = performance.now() - t0;
  sets.set(s, set);
  const text = tilesetText(set);
  setReport[s] = { bricks: set.bricks.length, bays: set.faces.length, patterns: set.patterns.length, propagator: propagatorEntries(set), ms: Math.round(ms), problems: set.problems, tileset: text };
  console.log(`set ${s}: ${set.bricks.length} tasselli (aria compresa), ${set.faces.length} vani, ${set.patterns.length} motivi con le simmetrie, ${propagatorEntries(set)} coppie nel propagatore, ${ms.toFixed(0)} ms; problemi ${set.problems.length}`);
  console.log(`  come tileset di MarkovJunior scritto a mano: ${text.tiles} tessere, ${(text.tileChars / 1e6).toFixed(1)} milioni di caratteri di tessere, ${text.neighborLines} righe <neighbor> (${(text.neighborChars / 1e6).toFixed(2)} milioni di caratteri): ${(text.total / 1e6).toFixed(1)} milioni contro ${WORLD_NODE_LIMITS.fileChars} (fileChars) e 100000 (un file di models/)`);
  for (const p of set.problems) console.log('  problema:', p);
}
out.sets = setReport;
console.log('facce dei tasselli della palazzina (+x +y -x -y sopra sotto):');
for (const f of sets.get('palazzina')!.faces) console.log(`  ${f.brick.padEnd(38)} ${f.cell.padEnd(6)} ${f.faces.join(' ')}`);

// ---------------------------------------------------------------- the stairs with the kernel's walk (the check 5 of a set)

const stairs: Array<{ what: string; top: number; want: number; climbs: boolean; roof?: boolean }> = [];
{
  const find = (n: string) => SETS.palazzina.find((b) => b.name === `palazzina/${n}`)!;
  const walkTop = (g: Block, inside: (x: number, y: number) => boolean) => {
    const w = walkIn({ X: g.X, Y: g.Y, Z: g.Z, cells: g.cells, alphabet: [...ALPHABET] }, palette, VPT, 0, [], 1);
    let top = 0;
    for (const c of w.celle) if (inside(c.x, c.y)) top = Math.max(top, c.z);
    return { top, w };
  };
  for (const names of [['nucleo-terra', 'nucleo-piano', 'torrino'], ['nucleo-terra', 'nucleo-piano', 'nucleo-piano', 'nucleo-piano', 'torrino']]) {
    const blocks = names.map((n) => find(n).build());
    const bx = blocks[0].X, by = blocks[0].Y;
    const g = new Block(bx + 2 * C, by + 2 * C, names.length * H);
    g.fill(0, g.X - 1, 0, g.Y - 1, 0, 0, 'r');
    blocks.forEach((b, s) => {
      for (let z = 0; z < H; z++) for (let y = 0; y < by; y++) for (let x = 0; x < bx; x++) if (b.get(x, y, z)) g.set(x + C, y + C, s * H + z, b.get(x, y, z));
    });
    // The roof around the turret, as on a roof.
    const z0 = (names.length - 1) * H;
    for (let y = 0; y < g.Y; y++) for (let x = 0; x < g.X; x++) if (x < C || x >= C + bx || y < C || y >= C + by) g.fill(x, x, y, y, z0, z0 + 1, 'R');
    const { top, w } = walkTop(g, (x, y) => x >= C && x < C + bx && y >= C && y < C + by);
    const roof = w.celle.some((c) => (c.x < C || c.x >= C + bx) && c.z >= z0);
    const want = z0 + 2;
    stairs.push({ what: names.join(' + '), top, want, climbs: top >= want - 3, roof });
  }
  for (const n of ['scala', 'scala-esterna']) {
    const b = find(n).build();
    const g = new Block(b.X + 2 * C, b.Y + 2 * C, b.Z);
    g.fill(0, g.X - 1, 0, g.Y - 1, 0, 0, 'r');
    for (let z = 0; z < b.Z; z++) for (let y = 0; y < b.Y; y++) for (let x = 0; x < b.X; x++) if (b.get(x, y, z)) g.set(x + C, y + C, z, b.get(x, y, z));
    // The floor it climbs to, beyond its top (+y), a storey up.
    g.fill(C - 8, C + b.X + 7, C + b.Y, g.Y - 1, H, H + 1, 'R');
    const { top } = walkTop(g, () => true);
    stairs.push({ what: n, top, want: H + 2, climbs: top >= H + 2 - 3 });
  }
  for (const s of stairs) console.log(`scala col cammino del kernel: ${s.what}: i piedi fino a ${s.top}, l'ultimo piano a ${s.want}: ${s.climbs ? 'si sale' : 'NON si sale'}${s.roof !== undefined ? `; fuori sul tetto: ${s.roof ? 'sì' : 'no'}` : ''}`);
}
out.stairs = stairs;

// ---------------------------------------------------------------- the runs

interface Run {
  via: string;
  style: string;
  kind: Ground;
  seed: number;
  ms: number;
  massingMs: number;
  tries?: number;
  regions?: number;
  failed?: number;
  attempts?: number;
  waveBytes?: number;
  found: boolean;
  invalid?: number;
  reach?: Reach;
  rooms?: Rooms;
  used?: number;
  of?: number;
  entropy?: number;
  sameInOtherOrder?: boolean;
  /** The stitching after the wave: walls opened, wanted bays still not reached, milliseconds. */
  opened?: number;
  lost?: number;
  stitchMs?: number;
}
const runs: Run[] = [];
const fabrics = new Map<string, Fabric>();
const measure = (r: Run, f: Fabric) => {
  r.invalid = violations(f);
  r.reach = reachOf(f, reachedBays(f));
  r.rooms = roomsOf(f);
  const u = bricksUsed(f);
  r.used = u.used;
  r.of = u.of;
  r.entropy = Math.round(u.entropy * 100) / 100;
};
const line = (r: Run) =>
  `${r.via} ${r.style} ${r.kind} seme ${r.seed}: ${r.ms.toFixed(0)} ms (massa ${r.massingMs.toFixed(0)})${r.tries !== undefined ? `, tentativi ${r.tries}` : ''}${r.regions !== undefined ? `, regioni ${r.regions} (${r.failed} alla base, ${r.attempts} semi)` : ''}${r.waveBytes ? `, onda ${mb(r.waveBytes)}` : ''}` +
  (r.reach ? `; incompatibili ${r.invalid}; raggiunti: terra ${pct(r.reach.ground)}, sopra ${pct(r.reach.above)}, scale ${pct(r.reach.stairs)}, tetti ${pct(r.reach.roofs)}, ponti ${pct(r.reach.bridges)}, cortili ${pct(r.reach.yards)}; stanze ${r.rooms!.rooms} (${r.rooms!.square} con 2 × 2 vani, la più grande ${r.rooms!.largest}); tasselli ${r.used}/${r.of}, ${r.entropy} bit` : ' — nessuna soluzione') +
  (r.sameInOtherOrder !== undefined ? `; uguale nell'altro ordine: ${r.sameInOtherOrder ? 'sì' : 'NO'}` : '') +
  (r.opened !== undefined ? `; ricucitura: ${r.opened} muri aperti in ${r.stitchMs!.toFixed(0)} ms, ${r.lost} vani ancora fuori` : '');
/** The same fabric stitched after its wave (a copy): the kernel's connection on the bays, rooms, stairs, cores and roofs wanted. */
const stitched = (r: Run, f: Fabric, via: string): [Run, Fabric] => {
  const g: Fabric = { ...f, at: Int32Array.from(f.at) };
  const s = stitch(g, wantedBays(true));
  const out: Run = { ...r, via, opened: s.opened, lost: s.lost, stitchMs: s.ms, ms: r.ms + s.ms };
  measure(out, g);
  return [out, g];
};

const massings = new Map<string, ReturnType<typeof massing>>();
const massingOf = (kind: Ground, seed: number) => {
  const k = `${kind}|${seed}`;
  if (!massings.has(k)) massings.set(k, massing(kind, seed));
  return massings.get(k)!;
};
console.log(`la massa del quartiere, seme 1:\n${massingText(massingOf('quartiere', 1))}`);

// The way A: the massing and the wave in one program, on a lot, on the lot of a block, on 3 × 3 places (beyond today's 500 voxels).
for (const style of STYLES)
  for (const kind of ['lotto', 'blocco', 'quartiere'] as Ground[])
    for (const seed of seeds) {
      const set = sets.get(style)!;
      const m = massingOf(kind, seed);
      const w = viaA(set, m.grid, m.letter, seed, 100, 300_000);
      const r: Run = { via: 'A', style, kind, seed, ms: w.ms, massingMs: m.ms, tries: w.tries, waveBytes: w.bytes, found: !!w.observed };
      if (w.observed) {
        const f: Fabric = { set, X: w.X, Y: w.Y, Z: w.Z, at: w.observed, letter: m.letter };
        measure(r, f);
        fabrics.set(`A|${style}|${kind}|${seed}`, f);
        const [rs, g] = stitched(r, f, 'A+ricucitura');
        fabrics.set(`A+ricucitura|${style}|${kind}|${seed}`, g);
        runs.push(r, rs);
        console.log(line(r));
        console.log(line(rs));
      } else {
        runs.push(r);
        console.log(line(r));
      }
    }

// The engine itself: within the world's ceilings on the lot and on the block's lot, beyond them on the district; the union of the three sets.
const engine: Array<Record<string, unknown>> = [];
for (const [style, kind, ceilings] of [
  ['palazzina', 'lotto', true],
  ['palazzina', 'blocco', true],
  ['popolare', 'blocco', true],
  ['villa', 'blocco', true],
  ['palazzina', 'quartiere', true],
  ['palazzina', 'quartiere', false],
  ['unione', 'blocco', true],
  ['unione', 'blocco', false],
] as Array<[Style | 'unione', Ground, boolean]>) {
  const set = sets.get(style)!;
  const m = massingOf(kind, 1);
  const lab = style === 'unione' ? viaA(set, m.grid, m.letter, 1, 100, 600_000) : undefined;
  const woven = lab ?? (() => {
    const f = fabrics.get(`A|${style}|${kind}|1`);
    return f ? { X: f.X, Y: f.Y, Z: f.Z, observed: f.at, ms: 0, tries: 0, bytes: 0 } : undefined;
  })();
  const limits = ceilings ? FORM_LIMITS : { side: 1024, cells: 160_000_000 };
  const before = heap();
  const e = engineRun(set, m.grid, 1, woven, { limits, ...(ceilings ? { ceilings: WORLD_NODE_LIMITS } : {}), tries: 100, deadline: ceilings ? 30_000 : 600_000 });
  const rec = { style, kind, ceilings: ceilings ? 'mondo' : 'laboratorio', voxelSide: m.grid.X * C, patterns: set.patterns.length, waveCells: m.grid.X * m.grid.Y * m.grid.Z, waveBytes: lab?.bytes ?? woven?.bytes, labMs: lab ? Math.round(lab.ms) : undefined, labTries: lab?.tries, rssGrowth: heap() - before, ...e };
  engine.push(rec);
  console.log(`motore, ${style} ${kind} (${m.grid.X * C} voxel di lato, ${set.patterns.length} motivi), tetti del ${rec.ceilings}: ${e.ok ? `fatto in ${e.ms.toFixed(0)} ms, ${(e.voxels! / 1e6).toFixed(1)} milioni di voxel, uguale al laboratorio: ${e.same ? 'sì' : 'NO'}` : `rifiutato: ${e.error}`}${lab ? ` (l'onda nel laboratorio: ${lab.observed ? `${lab.ms.toFixed(0)} ms, ${lab.tries} tentativi` : `nessuna soluzione, ${lab.why}`}, ${mb(lab.bytes)})` : ''}`);
}
out.engine = engine;
out.ceilings = { world: WORLD_NODE_LIMITS, form: FORM_LIMITS, structureSide: STRUCTURE_SIDE, engine: ENGINE_WAVE };

// The way A choosing its seed: what the kernel could do with one structure (the best of eight seeds of the Architect's program).
const bestOf: Array<Record<string, unknown>> = [];
for (const style of STYLES) {
  const set = sets.get(style)!;
  const m = massingOf('blocco', 1);
  const shares: number[] = [];
  for (let s = 1; s <= 8; s++) {
    const w = viaA(set, m.grid, m.letter, 1000 + s, 100, 120_000);
    if (!w.observed) continue;
    const f: Fabric = { set, X: w.X, Y: w.Y, Z: w.Z, at: w.observed, letter: m.letter };
    const r = reachOf(f, reachedBays(f));
    const want = r.ground[1] + r.above[1] + r.stairs[1];
    shares.push(want ? (r.ground[0] + r.above[0] + r.stairs[0]) / want : 1);
  }
  const best = Math.max(...shares);
  bestOf.push({ style, shares: shares.map((s) => Math.round(s * 1000) / 1000), best: Math.round(best * 1000) / 1000, full: shares.filter((s) => s === 1).length });
  console.log(`via A, ${style}, blocco, la massa del seme 1 a otto semi dell'onda: vani coperti raggiunti ${shares.map((s) => `${Math.round(100 * s)} %`).join(', ')}; il migliore ${Math.round(100 * best)} %, tutti raggiunti in ${shares.filter((s) => s === 1).length} su ${shares.length}`);
}
out.bestOf = bestOf;

// The way B: the weaver over the 3 × 3 places, on the same massings; for the palazzina every mode, for the others the base and the full check.
const MODES = ['base', 'libera', 'libera+ricucitura', 'regola10', 'regola10+tetti'] as const;
type Mode = (typeof MODES)[number];
const order = (shuffle: boolean, seed: number) => {
  const all: Array<[number, number]> = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) all.push([i, j]);
  return shuffle ? [...all].sort((a, b) => ((a[0] * 7 + a[1] * 13 + seed) % 9) - ((b[0] * 7 + b[1] * 13 + seed) % 9)) : all;
};
const weave = (set: BrickSet, m: ReturnType<typeof massing>, seed: number, mode: Mode, shuffle = false) => {
  const { X, Y, Z } = m.grid;
  const w = new Weaver(set, m.letter, X, Y, Z, { seed, rule10: mode.startsWith('regola10'), roofs: mode === 'regola10+tetti' || mode === 'libera+ricucitura', stitch: mode === 'libera+ricucitura' });
  if (mode !== 'base') for (const [i, j] of order(shuffle, seed)) w.place(i, j);
  return w;
};
for (const style of STYLES)
  for (const mode of style === 'palazzina' ? MODES : (['base', 'regola10+tetti'] as const))
    for (const seed of seeds) {
      const set = sets.get(style)!;
      const m = massingOf('quartiere', seed);
      const t0 = performance.now();
      const w = weave(set, m, seed, mode);
      const ms = performance.now() - t0;
      const at = w.grid();
      const r: Run = { via: `B ${mode}`, style, kind: 'quartiere', seed, ms, massingMs: m.ms, regions: w.log.length, failed: w.log.filter((l) => l.failed).length, attempts: w.log.reduce((n, l) => n + l.attempts, 0), found: true };
      const f: Fabric = { set, X: m.grid.X, Y: m.grid.Y, Z: m.grid.Z, at, letter: m.letter };
      measure(r, f);
      if (mode === 'regola10+tetti' && style === 'palazzina') {
        const other = weave(set, m, seed, mode, true).grid();
        r.sameInOtherOrder = other.every((v, i) => v === at[i]);
      }
      fabrics.set(`B ${mode}|${style}|quartiere|${seed}`, f);
      runs.push(r);
      console.log(line(r));
      if (mode === 'regola10+tetti') {
        // Stitched after the whole weave: what a stitch over the places loaded together gives (no longer the same in every order).
        const [rs, g] = stitched(r, f, 'B regola10+tetti+ricucitura');
        rs.sameInOtherOrder = undefined;
        fabrics.set(`B regola10+tetti+ricucitura|${style}|quartiere|${seed}`, g);
        runs.push(rs);
        console.log(line(rs));
      }
    }
out.runs = runs;

// The summaries: by way, style, kind.
const groups = new Map<string, Run[]>();
for (const r of runs) {
  const k = `${r.via}|${r.style}|${r.kind}`;
  groups.set(k, [...(groups.get(k) ?? []), r]);
}
const summary: Array<Record<string, unknown>> = [];
for (const [k, rs] of groups) {
  const found = rs.filter((r) => r.found && r.reach);
  const sum = (key: keyof Reach) => found.reduce((acc, r) => [acc[0] + r.reach![key][0], acc[1] + r.reach![key][1]], [0, 0]) as [number, number];
  const rooms = found.reduce((acc, r) => [acc[0] + r.rooms!.rooms, acc[1] + r.rooms!.square, acc[2] + r.rooms!.bays], [0, 0, 0]);
  const [via, style, kind] = k.split('|');
  const s = {
    via, style, kind, seeds: rs.length, found: found.length,
    ms: Math.round(rs.reduce((n, r) => n + r.ms, 0) / rs.length),
    tries: rs[0].tries !== undefined ? rs.map((r) => r.tries) : undefined,
    failedRegions: rs[0].regions !== undefined ? `${rs.reduce((n, r) => n + r.failed!, 0)}/${rs.reduce((n, r) => n + r.regions!, 0)}` : undefined,
    attempts: rs[0].attempts !== undefined ? rs.reduce((n, r) => n + r.attempts!, 0) : undefined,
    invalid: found.reduce((n, r) => n + r.invalid!, 0),
    ground: sum('ground'), above: sum('above'), stairs: sum('stairs'), roofs: sum('roofs'), bridges: sum('bridges'), yards: sum('yards'),
    rooms: rooms[0], roomsSquare: rooms[1], baysPerRoom: rooms[0] ? Math.round((10 * rooms[2]) / rooms[0]) / 10 : 0,
    used: found.length ? Math.round((10 * found.reduce((n, r) => n + r.used!, 0)) / found.length) / 10 : 0,
    entropy: found.length ? Math.round((100 * found.reduce((n, r) => n + r.entropy!, 0)) / found.length) / 100 : 0,
    sameInOtherOrder: rs[0].sameInOtherOrder !== undefined ? `${rs.filter((r) => r.sameInOtherOrder).length}/${rs.length}` : undefined,
    waveMB: rs[0].waveBytes ? Math.round((10 * rs[0].waveBytes) / 2 ** 20) / 10 : undefined,
    opened: rs[0].opened !== undefined ? rs.reduce((n, r) => n + (r.opened ?? 0), 0) : undefined,
    lost: rs[0].lost !== undefined ? rs.reduce((n, r) => n + (r.lost ?? 0), 0) : undefined,
    stitchMs: rs[0].stitchMs !== undefined ? Math.round(rs.reduce((n, r) => n + (r.stitchMs ?? 0), 0) / rs.length) : undefined,
  };
  summary.push(s);
  console.log(`RIASSUNTO ${via} ${style} ${kind}, ${rs.length} semi: ${s.ms} ms in media${s.tries ? `, tentativi ${s.tries.join(' ')}` : ''}${s.failedRegions ? `, regioni alla base ${s.failedRegions}, semi ${s.attempts}` : ''}; incompatibili ${s.invalid}; terra ${pct(s.ground)}, sopra ${pct(s.above)}, scale ${pct(s.stairs)}, tetti ${pct(s.roofs)}, ponti ${pct(s.bridges)}; stanze ${s.rooms} (${s.roomsSquare} con 2 × 2 vani, ${s.baysPerRoom} vani in media); tasselli ${s.used}, ${s.entropy} bit${s.sameInOtherOrder ? `; uguale nell'altro ordine ${s.sameInOtherOrder}` : ''}${s.opened !== undefined ? `; ricucitura ${s.opened} muri aperti, ${s.lost} vani fuori, ${s.stitchMs} ms` : ''}`);
}
out.summary = summary;

// ---------------------------------------------------------------- variance

{
  const histo = (f: Fabric) => {
    const u = bricksUsed(f);
    const total = [...u.counts.values()].reduce((a, b) => a + b, 0);
    const m = new Map<string, number>();
    for (const [k, v] of u.counts) m.set(k.replace(/^[a-z]+\//, ''), v / total);
    return m;
  };
  const hdist = (a: Map<string, number>, b: Map<string, number>) => {
    let s = 0;
    for (const k of new Set([...a.keys(), ...b.keys()])) s += Math.abs((a.get(k) ?? 0) - (b.get(k) ?? 0));
    return s / 2;
  };
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const pairs = <T,>(xs: T[], f: (a: T, b: T) => number) => {
    const out: number[] = [];
    for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) out.push(f(xs[i], xs[j]));
    return out;
  };
  const variance: Record<string, unknown> = {};
  for (const via of ['A', 'A+ricucitura', 'B regola10+tetti']) {
    // Between seeds of one set (the massing changes with the seed too): how the bricks are used, and how it looks.
    for (const style of STYLES) {
      const fs = seeds.map((s) => fabrics.get(`${via}|${style}|quartiere|${s}`)).filter((f): f is Fabric => !!f);
      variance[`${via}|${style}|semi`] = { bricks: Math.round(mean(pairs(fs.map(histo), hdist)) * 1000) / 1000, look: Math.round(mean(pairs(fs.map(looks), spread)) * 1000) / 1000 };
    }
    // Between sets: the same massings, the three styles.
    const between = seeds.map((s) => {
      const fs = STYLES.map((st) => fabrics.get(`${via}|${st}|quartiere|${s}`)).filter((f): f is Fabric => !!f);
      return { bricks: mean(pairs(fs.map(histo), hdist)), look: mean(pairs(fs.map(looks), spread)) };
    });
    variance[`${via}|stili`] = { bricks: Math.round(mean(between.map((b) => b.bricks)) * 1000) / 1000, look: Math.round(mean(between.map((b) => b.look)) * 1000) / 1000 };
  }
  // The wave alone: one massing, the waves of several seeds (the bays whose brick or symmetry changes).
  {
    const set = sets.get('palazzina')!;
    const m = massingOf('quartiere', 1);
    const a: Fabric[] = [];
    for (const s of seeds) {
      const w = viaA(set, m.grid, m.letter, 500 + s, 100, 300_000);
      if (w.observed) a.push({ set, X: w.X, Y: w.Y, Z: w.Z, at: w.observed, letter: m.letter });
    }
    const b = seeds.map((s) => {
      const w = new Weaver(set, m.letter, m.grid.X, m.grid.Y, m.grid.Z, { seed: 500 + s, rule10: true, roofs: true });
      for (const [i, j] of order(false, 0)) w.place(i, j);
      return { set, X: m.grid.X, Y: m.grid.Y, Z: m.grid.Z, at: w.grid(), letter: m.letter } as Fabric;
    });
    variance['A|onda'] = Math.round(mean(pairs(a, difference)) * 1000) / 1000;
    variance['B|onda'] = Math.round(mean(pairs(b, difference)) * 1000) / 1000;
  }
  out.variance = variance;
  console.log('VARIANZA (distanza fra gli usi dei tasselli, fra i colori, 0-1):', JSON.stringify(variance));
}

// ---------------------------------------------------------------- rule 10 with the kernel's own walk, on the middle place

const walks: Record<string, unknown> = {};
for (const key of ['A|palazzina|quartiere|1', 'A+ricucitura|palazzina|quartiere|1', 'B regola10+tetti|palazzina|quartiere|1']) {
  const f = fabrics.get(key)!;
  // The middle place (grid bays 10-18) and one bay around: 11 × 11 bays.
  const x0 = 9, x1 = 19;
  const g = voxelsOf(f, x0, x0, x1, x1);
  const t0 = performance.now();
  const walked = walkIn(g, palette, VPT, 0, [], 1);
  const ms = performance.now() - t0;
  const byWalk = new Set<string>();
  for (const c of walked.celle) byWalk.add(`${x0 + Math.floor(c.x / C)},${x0 + Math.floor(c.y / C)},${Math.min(STOREYS - 1, Math.floor(c.z / H))}`);
  // The graph in the same window, from what the walk enters: the bays of its edge on the ground that open out of it.
  const seen = reachedBays(f, { x0, y0: x0, x1, y1: x1, edge: 'ground' });
  let both = 0;
  const onlyGraph: string[] = [], onlyWalk: string[] = [];
  for (let z = 0; z < f.Z; z++)
    for (let y = x0 + 1; y < x1; y++)
      for (let x = x0 + 1; x < x1; x++) {
        const p = f.set.patterns[f.at[x + y * f.X + z * f.X * f.Y]];
        if (p.brick.family === 'air' || (p.brick.family === 'stair' && p.orig === '0,0,1') || (p.brick.family === 'turret' && p.orig === '0,1,0')) continue;
        const k = `${x},${y},${z}`;
        const a = !!seen[x + y * f.X + z * f.X * f.Y], b = byWalk.has(k);
        if (a && b) both++;
        else if (a) onlyGraph.push(`${k} ${p.brick.name.split('/')[1]}`);
        else if (b) onlyWalk.push(`${k} ${p.brick.name.split('/')[1]}`);
      }
  walks[key] = { ms: Math.round(ms), voxels: g.X * g.Y * g.Z, both, onlyGraph, onlyWalk };
  console.log(`cammino del kernel, ${key}, luogo di mezzo (${g.X}×${g.Y}×${g.Z} voxel): ${ms.toFixed(0)} ms; vani raggiunti dai due ${both}, solo dal grafo ${onlyGraph.length}, solo dal cammino ${onlyWalk.length}`);
  if (onlyGraph.length) console.log('  solo dal grafo:', onlyGraph.slice(0, 12).join('; '));
  if (onlyWalk.length) console.log('  solo dal cammino:', onlyWalk.slice(0, 12).join('; '));
}
out.walks = walks;

// ---------------------------------------------------------------- T522 for comparison: its set, its massing, its fabric with the check

{
  const set = t522Set(T522_BRICKS);
  const mod = (a: number, n: number) => ((a % n) + n) % n;
  const P9 = T522_PLACE;
  const ms = (seed: number) => (gx: number, gy: number) => {
    if (t522Street(gx, gy)) return { h: 0 };
    const ix = mod(gx - 5, P9), iy = mod(gy - 5, P9);
    const r = hash32(seed, 77, Math.floor((gx - 5) / P9), Math.floor((gy - 5) / P9), ix >> 1, iy >> 1) % 100;
    const h = r < 15 ? 0 : r < 30 ? 1 : r < 55 ? 2 : r < 80 ? 3 : 4;
    return { h, ...(h >= 2 && ix % 2 === 0 ? { core: `nucleo-${h}`, half: (iy % 2) as 0 | 1 } : {}) };
  };
  const used: number[] = [], ent: number[] = [];
  let photo: Grid3 | undefined;
  for (const seed of seeds.slice(0, 3)) {
    const background = t522Base(set, ms(seed));
    const w = new T522Weaver(set, { seed, storeys: 5, massing: ms(seed), background, rule10: true });
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) w.place(i, j);
    const counts = new Map<string, number>();
    for (let z = 0; z < 5; z++) for (let gy = 0; gy < 27; gy++) for (let gx = 0; gx < 27; gx++) {
      const p = w.pattern(gx, gy, z)!;
      if (p.brick.name !== 'aria') counts.set(p.brick.name, (counts.get(p.brick.name) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    used.push(counts.size);
    ent.push([...counts.values()].reduce((e, n) => e - (n / total) * Math.log2(n / total), 0));
    if (seed === 1 && photos) photo = t522Voxels(w, 0, 0, 26, 26, 2);
  }
  out.t522 = { bricks: T522_BRICKS.length, patterns: set.patterns.length, used, entropy: ent.map((e) => Math.round(e * 100) / 100) };
  console.log(`T522 (25 tasselli, ${set.patterns.length} motivi), quartiere col collaudo: tasselli usati ${used.join(', ')}; entropia ${ent.map((e) => e.toFixed(2)).join(', ')} bit`);

  // ---------------------------------------------------------------- photos

  if (photos) {
    fs.mkdirSync(dir, { recursive: true });
    const bg: [number, number, number] = [236, 233, 226];
    const write = (pic: Picture, name: string) => fs.writeFileSync(path.join(dir, name), png(pic));
    const shot = (g: Grid3, view = 0, pal: Record<string, { name: string; color: string }> = palette) => render(g, pal, view, DEFAULT_RENDER);
    // The catalogue of every style: two rows.
    for (const style of STYLES) {
      const pics = SETS[style].map((b) => {
        const blk = b.build();
        return shot({ X: blk.X, Y: blk.Y, Z: blk.Z, cells: blk.cells, alphabet: [...ALPHABET], log: [], epoch: 0 });
      });
      const half = Math.ceil(pics.length / 2);
      const a = sheet(pics.slice(0, half), 1, 6, bg), b = sheet(pics.slice(half), 1, 6, bg);
      const w = Math.max(a.w, b.w), h = a.h + b.h;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) data.set([...bg, 255], i * 4);
      for (let y = 0; y < a.h; y++) data.set(a.data.subarray(y * a.w * 4, (y + 1) * a.w * 4), y * w * 4);
      for (let y = 0; y < b.h; y++) data.set(b.data.subarray(y * b.w * 4, (y + 1) * b.w * 4), (a.h + y) * w * 4);
      write({ w, h, data }, `catalogo-${style}.png`);
    }
    const district = (key: string, step = 2) => {
      const f = fabrics.get(key)!;
      return shot(voxelsOf(f, 1, 1, f.X - 2, f.Y - 2, step));
    };
    write(district('A|palazzina|quartiere|1'), 'via-a-quartiere.png');
    write(district('A+ricucitura|palazzina|quartiere|1'), 'via-a-ricucita-quartiere.png');
    write(district('B regola10+tetti|palazzina|quartiere|1'), 'via-b-quartiere.png');
    write(district('B base|palazzina|quartiere|1'), 'tessuto-di-base.png');
    write(sheet([district('A|popolare|quartiere|1'), district('A|villa|quartiere|1')], 1, 8, bg), 'via-a-popolare-villa.png');
    write(sheet([district('B regola10+tetti|popolare|quartiere|1'), district('B regola10+tetti|villa|quartiere|1')], 1, 8, bg), 'via-b-popolare-villa.png');
    {
      const f = fabrics.get('A|palazzina|blocco|1')!;
      write(sheet([shot(voxelsOf(f, 0, 0, f.X - 1, f.Y - 1, 1), 0), shot(voxelsOf(f, 0, 0, f.X - 1, f.Y - 1, 1), 2)], 1, 8, bg), 'via-a-blocco.png');
    }
    {
      const f = fabrics.get('B regola10+tetti|palazzina|quartiere|1')!;
      write(sheet([shot(voxelsOf(f, 10, 10, 18, 18, 1), 0), shot(voxelsOf(f, 10, 10, 18, 18, 1), 2)], 1, 8, bg), 'via-b-luogo-di-mezzo.png');
    }
    // Beside T522: its district with the check (re-run here), the way A and the way B, at half the voxels, the same width.
    if (photo) {
      const t522pic = render(photo, T522_PALETTE as Record<string, { name: string; color: string }>, 0, DEFAULT_RENDER);
      const w = Math.min(t522pic.w, 520);
      write(sheet([shrink(t522pic, w), shrink(district('A|palazzina|quartiere|1'), w), shrink(district('B regola10+tetti|palazzina|quartiere|1'), w)], 1, 10, bg), 'accanto-a-t522.png');
    }
    console.log(`foto in ${path.relative(process.cwd(), dir)}`);
  }
}

if (jsonOut) {
  fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true });
  fs.writeFileSync(path.resolve(jsonOut), JSON.stringify(out, (_k, v) => (v instanceof Map ? Object.fromEntries(v) : v), 1));
  console.log(`misure in ${jsonOut}`);
}
