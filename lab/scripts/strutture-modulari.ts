// The prototype of the modular structures (T522, docs/design/strutture-modulari.md, lab/strutture-modulari/README.md): a set of bricks in the
// style of Neapolis's houses, the faces read from the voxels, the composition over 3 × 3 places with MarkovJunior's solver in corners,
// edges and insides (the same cells whatever order the places come in), free or on a massing with its cores decided first, rule 10 on the
// graph of the modules and with the kernel's own walk (`walkIn`), the overlay on houses that stand already, the photos. No calls, nothing of
// the game changes.
//
//   npx vite-node lab/scripts/strutture-modulari.ts [-- --semi 10] [--piani 5] [--foto] [--json lab/out/strutture-modulari.json]

import fs from 'node:fs';
import path from 'node:path';
import { walkIn } from '../../src/kernel/forms';
import { hash32 } from '../../src/kernel/rng';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import type { Grid3 } from '../../src/mj/engine';
import { brickSet } from '../strutture-modulari/facce';
import { Weaver, baseFabric, isStreet, PLACE, reached, reachOf, violations, voxels, type Massing, type Options, type Reach } from '../strutture-modulari/tessuto';
import { ALPHABET, Block, BRICKS, C, H, PALETTE, VPT } from '../strutture-modulari/tasselli';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string, d: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const seeds = Number(opt('semi', '10'));
const storeys = Number(opt('piani', '5'));
const photos = args.includes('--foto');
const jsonOut = opt('json', '');
const dir = path.resolve('lab/strutture-modulari/foto');
const palette = PALETTE as Record<string, { name: string; color: string }>;
const mod = (a: number, n: number) => ((a % n) + n) % n;

const t0 = performance.now();
const set = brickSet(BRICKS);
const tSet = performance.now() - t0;
const props = set.propagator.reduce((n, d) => n + d.reduce((m, l) => m + l.length, 0), 0);
console.log(`set: ${BRICKS.length} tasselli, ${set.faces.length} vani, ${set.patterns.length} motivi con le rotazioni, ${props} coppie nel propagatore, ${tSet.toFixed(0)} ms`);
for (const p of set.problems) console.log('  problema:', p);
console.log('facce (+x +y -x -y sopra sotto):');
for (const f of set.faces) console.log(`  ${f.brick.padEnd(18)} ${f.cell.padEnd(6)} ${f.faces.join(' ')}`);

/**
 * The massing: the lots between the streets in blocks of 2 × 2 cells (4 × 4 tiles), each with a height from the seed (0 a courtyard, up to
 * 4 storeys), and the core of concrete (a stair tower of 1 × 2 cells) on the left column of every block of two storeys or more. A function of the cell and the seed only.
 */
const massing = (seed: number) => (gx: number, gy: number): Massing => {
  if (isStreet(gx, gy)) return { h: 0 };
  const ix = mod(gx - 5, PLACE), iy = mod(gy - 5, PLACE);
  const r = hash32(seed, 77, Math.floor((gx - 5) / PLACE), Math.floor((gy - 5) / PLACE), ix >> 1, iy >> 1) % 100;
  const h = r < 15 ? 0 : r < 30 ? 1 : r < 55 ? 2 : r < 80 ? 3 : 4;
  const block = `${Math.floor((gx - 5) / PLACE)},${Math.floor((gy - 5) / PLACE)},${ix >> 1},${iy >> 1}`;
  return { h, block, ...(h >= 2 && ix % 2 === 0 ? { core: `nucleo-${h}`, half: (iy % 2) as 0 | 1 } : {}) };
};

// ---------------------------------------------------------------- the district, in two orders

const N = 3;
const order = (shuffle: boolean, seed: number) => {
  const all: Array<[number, number]> = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) all.push([i, j]);
  if (!shuffle) return all;
  return [...all].sort((a, b) => ((a[0] * 7 + a[1] * 13 + seed) % 9) - ((b[0] * 7 + b[1] * 13 + seed) % 9));
};
/** Free; on the massing with a free margin (what the regions see around them may not be what will stand there); on the massing with the background. */
type Mode = 'libera' | 'massa, margine libero' | 'massa' | 'massa e regola 10';
const MODES: Mode[] = ['libera', 'massa, margine libero', 'massa', 'massa e regola 10'];
const district = (seed: number, shuffle: boolean, mode: Mode, extra: Partial<Options> = {}) => {
  const ms = mode === 'libera' ? undefined : massing(seed);
  const background = mode === 'massa, margine libero' ? undefined : baseFabric(set, ms);
  const comp = new Weaver(set, { seed, storeys, ...(ms ? { massing: ms } : {}), ...(background ? { background } : {}), ...(mode === 'massa e regola 10' ? { rule10: true } : {}), ...extra });
  for (const [i, j] of order(shuffle, seed)) comp.place(i, j);
  return comp;
};
const differences = (a: Weaver, b: Weaver) => {
  let diff = 0;
  for (let z = 0; z < storeys; z++) for (let gy = 0; gy < N * PLACE; gy++) for (let gx = 0; gx < N * PLACE; gx++) if (a.pattern(gx, gy, z) !== b.pattern(gx, gy, z)) diff++;
  return diff;
};
const W = N * PLACE - 1;

interface Run {
  mode: Mode;
  seed: number;
  ms: number;
  sameInOtherOrder: boolean;
  regions: number;
  failed: number;
  attempts: number;
  reach: Reach;
  invalid: number;
}
const runs: Run[] = [];
const pct = (r: [number, number]) => `${r[0]}/${r[1]}`;
for (const mode of MODES)
  for (let seed = 1; seed <= seeds; seed++) {
    const a0 = performance.now();
    const a = district(seed, false, mode);
    const ms = performance.now() - a0;
    const b = district(seed, true, mode);
    const reach = reachOf(a, reached(a, 0, 0, W, W), 0, 0, W, W);
    const failed = a.log.filter((l) => l.failed).length;
    const diff = differences(a, b);
    const invalid = violations(a, 0, 0, W, W);
    runs.push({ mode, seed, ms, sameInOtherOrder: diff === 0, regions: a.log.length, failed, attempts: a.log.reduce((n, l) => n + l.attempts, 0), reach, invalid });
    console.log(`${mode} seme ${seed}: ${ms.toFixed(0)} ms, regioni ${a.log.length} (${failed} senza soluzione, ${a.log.reduce((n, l) => n + l.attempts, 0)} semi provati), coppie incompatibili ${invalid}, uguale nell'altro ordine: ${diff === 0 ? 'sì' : `NO (${diff} celle)`}; raggiunte: stanze a terra ${pct(reach.rooms0)}, stanze sopra ${pct(reach.roomsUp)}, tetti ${pct(reach.roofs)}, scale e nuclei ${pct(reach.stairs)}`);
  }
const total = (mode: Mode, k: keyof Reach) => runs.filter((r) => r.mode === mode).reduce((acc, r) => [acc[0] + r.reach[k][0], acc[1] + r.reach[k][1]], [0, 0]);
for (const mode of MODES) {
  const rs = runs.filter((r) => r.mode === mode);
  const share = (k: keyof Reach) => {
    const [a, b] = total(mode, k);
    return `${a}/${b} (${b ? Math.round((100 * a) / b) : 0} %)`;
  };
  console.log(`${mode}, ${rs.length} semi: ${(rs.reduce((n, r) => n + r.ms, 0) / rs.length).toFixed(0)} ms per 3 × 3 luoghi; regioni senza soluzione ${rs.reduce((n, r) => n + r.failed, 0)} su ${rs.reduce((n, r) => n + r.regions, 0)}, coppie incompatibili ${rs.reduce((n, r) => n + r.invalid, 0)}; stesso risultato nell'altro ordine ${rs.filter((r) => r.sameInOtherOrder).length}/${rs.length}; raggiunte: stanze a terra ${share('rooms0')}, sopra ${share('roomsUp')}, tetti ${share('roofs')}, scale e nuclei ${share('stairs')}`);
}
{
  const bg = baseFabric(set, massing(1));
  const only = { set, o: { storeys }, pattern: (gx: number, gy: number, gz: number) => set.patterns[bg(gx, gy, gz)] };
  const seen = reached(only as unknown as Weaver, 0, 0, W, W);
  const r = reachOf(only as unknown as Weaver, seen, 0, 0, W, W);
  console.log(`il tessuto di base da solo (seme 1): coppie incompatibili ${violations(only, 0, 0, W, W)}; raggiunte: stanze a terra ${pct(r.rooms0)}, sopra ${pct(r.roomsUp)}, tetti ${pct(r.roofs)}, nuclei ${pct(r.stairs)}`);
}
const byKind = new Map<string, { n: number; ms: number[]; attempts: number; failed: number }>();
for (const l of district(1, false, 'massa e regola 10').log) {
  const k = byKind.get(l.kind) ?? { n: 0, ms: [], attempts: 0, failed: 0 };
  k.n++;
  k.ms.push(l.ms);
  k.attempts += l.attempts;
  k.failed += l.failed ? 1 : 0;
  byKind.set(l.kind, k);
}
for (const [kind, k] of byKind) console.log(`  massa e regola 10, seme 1, ${kind}: ${k.n}, ${(k.ms.reduce((a, b) => a + b, 0) / k.n).toFixed(1)} ms in media, ${Math.max(...k.ms).toFixed(1)} al più, semi ${k.attempts}, senza soluzione ${k.failed}`);

// ---------------------------------------------------------------- the stairs, with the kernel's walk (the check 5 of a set)

/** Every brick of more storeys alone in a yard of paving: how high the kernel's walk gets in it, against the floor of its top storey. */
for (const b of BRICKS.filter((x) => x.size[2] > 1)) {
  const blk = b.build();
  const X = blk.X + 2 * C, Y = blk.Y + 2 * C;
  const yard = new Block(X, Y, blk.Z);
  yard.fill(0, X - 1, 0, Y - 1, 0, 0, 'r');
  for (let z = 0; z < blk.Z; z++) for (let y = 0; y < blk.Y; y++) for (let x = 0; x < blk.X; x++) if (blk.get(x, y, z)) yard.set(x + C, y + C, z, blk.get(x, y, z));
  const w = walkIn({ X, Y, Z: blk.Z, cells: yard.cells, alphabet: [...ALPHABET] }, palette, VPT, 0, [], 1);
  let top = 0;
  for (const c of w.celle) if (c.x >= C && c.x < C + blk.X && c.y >= C && c.y < C + blk.Y) top = Math.max(top, c.z);
  const want = H * (b.size[2] - 1) + 2;
  console.log(`scala col cammino del kernel: ${b.name}, i piedi fino a ${top} voxel, l'ultimo piano a ${want}: ${top >= want - 3 ? 'si sale' : 'NON si sale'}`);
}

// ---------------------------------------------------------------- the overlay: houses that stand already

const villetta = set.patterns.filter((p) => p.brick.name === 'villetta');
/** A house stands on some lots by a street (the single-cell house of the set, its door towards the street). */
const standing = (gx: number, gy: number): number | undefined => {
  const lx = mod(gx, PLACE), ly = mod(gy, PLACE);
  if (lx === 0 || ly === 0 || lx === PLACE - 1 || ly === PLACE - 1 || isStreet(gx, gy)) return undefined;
  if ((lx * 5 + ly * 3 + gx + gy) % 4 !== 0) return undefined;
  const towards = isStreet(gx, gy - 1) ? 3 : isStreet(gx, gy + 1) ? 1 : isStreet(gx - 1, gy) ? 2 : isStreet(gx + 1, gy) ? 0 : undefined;
  if (towards === undefined) return undefined;
  return villetta.find((p) => p.faces[towards].k === 'D')?.index;
};
const over = district(1, false, 'libera', { standing });
let kept = 0, raised = 0, houses = 0;
for (let gy = 0; gy <= W; gy++)
  for (let gx = 0; gx <= W; gx++) {
    const lx = mod(gx, PLACE), ly = mod(gy, PLACE);
    if (standing(gx, gy) === undefined || lx === 0 || ly === 0 || lx === PLACE - 1 || ly === PLACE - 1) continue;
    houses++;
    if (over.pattern(gx, gy, 0)!.brick.name === 'villetta') kept++;
    if (over.pattern(gx, gy, 1)!.faces[4].k === 'needs') raised++;
  }
const overReach = reachOf(over, reached(over, 0, 0, W, W), 0, 0, W, W);
console.log(`sovraimpressione: ${houses} villette in piedi, ${kept} tenute, ${raised} con una stanza sopra; senza soluzione ${over.log.filter((l) => l.failed).length}; raggiunte: stanze a terra ${pct(overReach.rooms0)}, sopra ${pct(overReach.roomsUp)}, tetti ${pct(overReach.roofs)}`);

// ---------------------------------------------------------------- rule 10 with the kernel's walk, on the middle place

const walks: Record<string, unknown> = {};
const comp = district(1, false, 'massa e regola 10');
for (const mode of ['massa e regola 10', 'libera'] as Mode[]) {
  const c = mode === 'massa e regola 10' ? comp : district(1, false, 'libera');
  const m0 = PLACE - 1, m1 = 2 * PLACE; // the middle place and one cell around it
  const g = voxels(c, m0, m0, m1, m1);
  const w0 = performance.now();
  const walked = walkIn(g, palette, VPT, 0, [], 1);
  const wMs = performance.now() - w0;
  const walkedCells = new Set<string>();
  for (const cell of walked.celle) walkedCells.add(`${m0 + Math.floor(cell.x / C)},${m0 + Math.floor(cell.y / C)},${Math.min(storeys - 1, Math.floor(cell.z / H))}`);
  const graph = reached(c, 0, 0, W, W);
  let both = 0;
  const onlyGraph: string[] = [], onlyWalk: string[] = [];
  for (let z = 0; z < storeys; z++)
    for (let gy = PLACE; gy < 2 * PLACE; gy++)
      for (let gx = PLACE; gx < 2 * PLACE; gx++) {
        const p = c.pattern(gx, gy, z)!;
        if (p.brick.name === 'aria' || (p.brick.name === 'scala' && p.cell[2] === 1)) continue;
        const k = `${gx},${gy},${z}`;
        const a = graph.has(k), b = walkedCells.has(k);
        if (a && b) both++;
        else if (a) onlyGraph.push(`${k} ${p.brick.name}`);
        else if (b) onlyWalk.push(`${k} ${p.brick.name}`);
      }
  walks[mode] = { ms: Math.round(wMs), voxels: g.X * g.Y * g.Z, both, onlyGraph, onlyWalk };
  console.log(`cammino del kernel, ${mode}, luogo di mezzo (${g.X}×${g.Y}×${g.Z} voxel): ${wMs.toFixed(0)} ms; celle raggiunte dai due ${both}, solo dal grafo ${onlyGraph.length}, solo dal cammino ${onlyWalk.length}`);
  if (onlyGraph.length) console.log('  solo dal grafo:', onlyGraph.slice(0, 10).join('; '));
  if (onlyWalk.length) console.log('  solo dal cammino:', onlyWalk.slice(0, 10).join('; '));
}

// ---------------------------------------------------------------- what it weighs

let instances = 0;
const used = new Set<number>();
for (let z = 0; z < storeys; z++)
  for (let gy = PLACE; gy < 2 * PLACE; gy++)
    for (let gx = PLACE; gx < 2 * PLACE; gx++) {
      const p = comp.pattern(gx, gy, z)!;
      if (p.brick.name === 'aria') continue;
      instances++;
      used.add(p.index);
    }
console.log(`un luogo (massa e regola 10, seme 1): ${PLACE * PLACE * storeys} vani, ${instances} vani non vuoti di ${used.size} motivi diversi (${new Set([...used].map((i) => set.patterns[i].brick.name)).size} tasselli); i dati: ${PLACE * PLACE * storeys * 2} byte (un indice di motivo a vano)`);

// ---------------------------------------------------------------- photos

if (photos) {
  fs.mkdirSync(dir, { recursive: true });
  const shot = (grid: Grid3, views: number[], name: string, scale = 1) => {
    const pics: Picture[] = views.map((v) => render(grid, palette, v, DEFAULT_RENDER));
    fs.writeFileSync(path.join(dir, name), png(sheet(pics, scale, 8, [236, 233, 226])));
  };
  shot(voxels(comp, 0, 0, W, W, 2), [0], 'quartiere-massa.png');
  shot(voxels(district(1, false, 'libera'), 0, 0, W, W, 2), [0], 'quartiere-libero.png');
  shot(voxels(over, 0, 0, W, W, 2), [0], 'quartiere-sovraimpressione.png');
  shot(voxels(comp, PLACE, PLACE, 2 * PLACE - 1, 2 * PLACE - 1), [0, 2], 'luogo-di-mezzo.png');
  const cat: Picture[] = [];
  for (const m of BRICKS) {
    const b = m.build();
    const grid: Grid3 = { X: b.X, Y: b.Y, Z: b.Z, cells: b.cells, alphabet: [...ALPHABET], log: [], epoch: 0 };
    if (b.cells.some((v) => v)) cat.push(render(grid, palette, 0, DEFAULT_RENDER));
  }
  fs.writeFileSync(path.join(dir, 'tasselli.png'), png(sheet(cat, 2, 6, [236, 233, 226])));
  console.log(`foto in ${path.relative(process.cwd(), dir)}`);
}

if (jsonOut) {
  fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true });
  fs.writeFileSync(path.resolve(jsonOut), JSON.stringify({ patterns: set.patterns.length, props, faces: set.faces, problems: set.problems, runs, overlay: { houses, kept, raised, reach: overReach }, walks, instances, distinct: used.size }, null, 1));
}
