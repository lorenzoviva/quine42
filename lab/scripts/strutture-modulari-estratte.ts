// The third trial of the modular structures (T557, docs/design/strutture-modulari.md § 12, lab/strutture-modulari/estratti/README.md): two
// sets of bricks extracted from static models of the universes on the disk (the palazzina of tufo of `neapolis`, the inn of `mesa`), each
// one program with its massing, its wave and its stitching written in MarkovJunior, run by the game's engine within the world's ceilings
// on a lot and on the lot of a block, measured at several seeds (rule 10 with and without the stitching, beside T543's stitching in the
// kernel on the same wave; the rooms; the times; the variance of the massing and of the bricks between seeds), photographed beside T543
// and the static models they come from. No calls to a model, nothing of the game changes.
//
//   npx vite-node lab/scripts/strutture-modulari-estratte.ts -- [--semi 8] [--universi <cartella>] [--foto] [--json lab/strutture-modulari/estratti/misure.json]

import fs from 'node:fs';
import path from 'node:path';
import { WORLD_NODE_LIMITS, worldNodeErrors } from '../../src/kernel/validator';
import { FORM_LIMITS } from '../../src/mj/run';
import { DEFAULT_RENDER, render, sheet, shrink, type Picture } from '../../src/mj/photo';
import type { Grid3, PaletteEntry } from '../../src/mj/engine';
import { C, H, loadSource, modelsOf, type Source } from '../strutture-modulari/estratti/sorgente';
import { buildSet, buildingBricks, type ExtractedSet } from '../strutture-modulari/estratti/insieme';
import { MESA, NEAPOLIS, massing, massingText, type Ground, type MassingSpec } from '../strutture-modulari/estratti/masse';
import { buildComplex, runComplex, type Complex } from '../strutture-modulari/estratti/programma';
import { bricksUsed, fabricOf, kernelStitch, kernelWalk, looks, motifsOf, reachBy, reachOf, roomsOf, spread, type Fab, type Reach, type Rooms } from '../strutture-modulari/estratti/misure';
import { brickSet as t543Set } from '../strutture-modulari/grande/facce';
import { massing as t543Massing } from '../strutture-modulari/grande/massa';
import { AIR as T543_AIR, PALETTE as T543_PALETTE, SETS as T543_SETS } from '../strutture-modulari/grande/tasselli';
import { viaA as t543ViaA } from '../strutture-modulari/grande/via-a';
import { voxelsOf as t543Voxels } from '../strutture-modulari/grande/misure';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string, d: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const SEEDS = Number(opt('semi', '8'));
const universes = path.resolve(opt('universi', path.join('..', 'step8.2A-lab3d', 'universes')));
const photos = args.includes('--foto');
const jsonOut = opt('json', '');
const here = path.resolve('lab/strutture-modulari/estratti');
const seeds = [...Array(SEEDS).keys()].map((k) => k + 1);
const pct = (r: [number, number]) => `${r[0]}/${r[1]} (${r[1] ? Math.round((100 * r[0]) / r[1]) : 100} %)`;
const out: Record<string, unknown> = {};

// ---------------------------------------------------------------- the sets: which model, which seeds

interface SetSpec {
  key: string;
  universe: string;
  model: string;
  seeds: number[];
  massing: MassingSpec;
}
const SPECS: SetSpec[] = [
  { key: 'neapolis', universe: 'neapolis', model: 'casa-comune-structure-f2e1f8de', seeds: [1, 2, 3, 4], massing: NEAPOLIS },
  { key: 'mesa', universe: 'mesa', model: 'struttura-locanda', seeds: [1, 2, 3], massing: MESA },
];

const sets = new Map<string, { spec: SetSpec; set: ExtractedSet; cx: Complex; sources: Source[] }>();
for (const spec of SPECS) {
  const dir = path.join(universes, spec.universe);
  const files = modelsOf(dir);
  const t0 = performance.now();
  // Every seed as the Concilio drew it, and the same building without its stairs (sorgente.ts).
  const sources = spec.seeds.flatMap((s) => [loadSource(dir, spec.model, s, files), loadSource(dir, spec.model, s, files, { stairless: true })]);
  const set = buildSet(`${spec.universe}/${spec.model}`, sources, { target: 50 });
  const cx = buildComplex(set, spec.massing);
  const bb = buildingBricks(set);
  const fam: Record<string, number> = {};
  for (const v of bb.values()) fam[v.family] = (fam[v.family] ?? 0) + 1;
  const errors = worldNodeErrors({ program: cx.program as never }, cx.xml);
  const report = {
    universe: spec.universe,
    model: spec.model,
    name: sources[0].name,
    seeds: spec.seeds,
    sources: set.sources,
    fit: sources[0].fit,
    bays: `${sources[0].nx}×${sources[0].ny}×${sources[0].nz}`,
    removed: sources[0].removed,
    bricks: bb.size,
    families: fam,
    multiBay: [...bb.values()].filter((v) => v.size.some((n) => n > 1)).map((v) => v.size.join('×')),
    dropped: set.dropped,
    motifs: set.motifs.length,
    natural: set.motifs.filter((m) => !m.variant).length,
    copies: { doors: set.motifs.filter((m) => m.variant?.kind === 'door').length, up: set.motifs.filter((m) => m.variant?.kind === 'up').length, down: set.motifs.filter((m) => m.variant?.kind === 'down').length },
    signatures: set.sigs.length,
    dressed: cx.dressed.length,
    symbols: cx.symbols,
    pairs: set.pairs.map((p) => p.size),
    propagator: set.propagator.reduce((n, d) => n + d.reduce((m, l) => m + l.length, 0), 0),
    xmlChars: cx.xml.length,
    worldErrors: errors,
    ms: { ...set.ms, total: Math.round(performance.now() - t0) },
  };
  sets.set(spec.key, { spec, set, cx, sources });
  out.sets = { ...(out.sets as Record<string, unknown> | undefined), [spec.key]: report };
  console.log(
    `set ${spec.key} (${spec.universe}/${spec.model}, «${sources[0].name}», semi ${spec.seeds.join(',')}, con e senza scale): ${bb.size} tasselli (${Object.entries(fam).map(([k, v]) => `${v} ${k}`).join(', ')}; di più vani ${report.multiBay.join(' ') || 'nessuno'}; tolti come gemelli ${set.dropped}), ` +
      `${report.natural} vani e ${report.motifs - report.natural} copie per la ricucitura (${report.copies.doors} porte, ${report.copies.up} rampe, ${report.copies.down} fori), ${set.sigs.length} firme, ${cx.dressed.length} lettere vestite, ${cx.symbols} simboli; ` +
      `il programma ${cx.xml.length} caratteri; i tetti del mondo: ${errors.length ? errors.join('; ') : 'rispettati'}; ${report.ms.total} ms`,
  );
  fs.mkdirSync(path.join(here, 'programmi'), { recursive: true });
  fs.writeFileSync(path.join(here, 'programmi', `${spec.key}.xml`), cx.xml + '\n');
  // The set as the kernel would keep it: a line a brick, where it comes from (model, seed, with or without the stairs, its bays).
  const describe = {
    set: set.name,
    model: spec.model,
    universe: spec.universe,
    seeds: spec.seeds,
    bay: { tiles: 2, voxels: [C, C, H], vpt: 16 },
    keys: 'faces in blocks of 8 voxels along a side and 8 in height, solid or not, the floor inside or outside; top and bottom solid or not in blocks of 4',
    bricks: set.bricks.map((b) => ({ canon: b.canon, size: b.size, family: b.family, weight: b.weight, seeds: [...b.seeds], bays: b.motifs.length })),
    signatures: set.sigs.map((s) => ({ roles: [...s.roles].join(''), family: s.family, start: s.start, weight: s.weight, bays: s.motifs.length, doors: s.doors.map((d) => d.length), up: s.up.length, down: s.down.length })),
  };
  fs.mkdirSync(path.join(here, 'insiemi'), { recursive: true });
  fs.writeFileSync(path.join(here, 'insiemi', `${spec.key}.json`), JSON.stringify(describe, null, 1) + '\n');
}

// ---------------------------------------------------------------- the runs

interface Run {
  set: string;
  ground: Ground;
  seed: number;
  ok: boolean;
  why?: string;
  ms: { massing: number; wave: number; stitch: number; voxels: number; total: number };
  voxels?: number;
  none?: Reach;
  mj?: Reach;
  kernel?: Reach;
  doors?: number;
  stairs?: number;
  /** Stairs outside (from a street to a door a storey up). */
  outside?: number;
  kernelOpened?: number;
  kernelMs?: number;
  rooms?: Rooms;
  used?: number;
  of?: number;
  entropy?: number;
  buildings?: number;
}
const runs: Run[] = [];
const kept = new Map<string, { cx: Complex; fab2: Fab; fab3: Fab; grid: Grid3; motifs: Int32Array; massing: Grid3 }>();
for (const [key, { set, cx }] of sets)
  for (const ground of ['lotto', 'blocco'] as Ground[])
    for (const seed of seeds) {
      const s1 = runComplex(cx, ground, seed, { upTo: 1 });
      const s2 = runComplex(cx, ground, seed, { upTo: 2 });
      const s3 = runComplex(cx, ground, seed, { upTo: 3 });
      const full = runComplex(cx, ground, seed, { limits: FORM_LIMITS, ceilings: WORLD_NODE_LIMITS, deadline: 30_000 });
      const fab2 = fabricOf(cx, s2.grid), fab3 = fabricOf(cx, s3.grid);
      const ms = { massing: Math.round(s1.ms), wave: Math.max(0, Math.round(s2.ms - s1.ms)), stitch: Math.max(0, Math.round(s3.ms - s2.ms)), voxels: Math.max(0, Math.round(full.ms - s3.ms)), total: Math.round(full.ms) };
      const ok = !!fab2 && !!fab3 && full.finished && full.grid.X === s1.grid.X * C;
      const r: Run = { set: key, ground, seed, ok, ms, ...(ok ? {} : { why: (full.why ?? s2.why ?? '').slice(0, 300) }) };
      // Buildings: footprints of the massing (columns of H joined on the ground).
      {
        const g = s1.grid;
        const seen = new Uint8Array(g.X * g.Y);
        let n = 0;
        for (let i = 0; i < g.X * g.Y; i++) {
          if (seen[i] || g.alphabet[g.cells[i]] !== 'H') continue;
          n++;
          const st = [i];
          seen[i] = 1;
          while (st.length) {
            const a = st.pop()!;
            for (const b of [a + 1, a - 1, a + g.X, a - g.X]) if (b >= 0 && b < g.X * g.Y && !seen[b] && g.alphabet[g.cells[b]] === 'H' && (Math.abs(b - a) === g.X || Math.floor(b / g.X) === Math.floor(a / g.X))) (seen[b] = 1), st.push(b);
          }
        }
        r.buildings = n;
      }
      if (ok && fab2 && fab3) {
        r.voxels = full.grid.cells.length;
        r.none = reachBy(set, fab2, reachOf(set, fab2));
        r.mj = reachBy(set, fab3, reachOf(set, fab3));
        const ks = kernelStitch(set, fab2);
        r.kernel = reachBy(set, ks.fab, reachOf(set, ks.fab, { doors: false }));
        r.kernelOpened = ks.opened;
        r.kernelMs = Math.round(ks.ms);
        r.doors = fab3.state.filter((s) => 'ESWNeswn'.includes(s) && s).length;
        r.stairs = fab3.state.filter((s) => s === 'U').length;
        r.outside = fab3.state.filter((s) => s !== '' && 'FGJK'.includes(s)).length;
        r.rooms = roomsOf(set, fab3);
        const motifs = motifsOf(cx, full.grid, fab3.X, fab3.Y, fab3.Z);
        const u = bricksUsed(set, motifs);
        r.used = u.used;
        r.of = u.of;
        r.entropy = Math.round(u.entropy * 100) / 100;
        if (seed <= 3) kept.set(`${key}|${ground}|${seed}`, { cx, fab2, fab3, grid: full.grid, motifs, massing: s1.grid });
      }
      runs.push(r);
      console.log(
        `${key} ${ground} seme ${seed}: ${ok ? 'fatto' : `NO (${r.why})`} in ${ms.total} ms (massa ${ms.massing}, onda ${ms.wave}, ricucitura ${ms.stitch}, vestizione e voxel ${ms.voxels}); ${r.buildings} edifici` +
          (ok
            ? `; senza ricucitura terra ${pct(r.none!.ground)}, sopra ${pct(r.none!.above)}, scale ${pct(r.none!.stairs)}, tetti ${pct(r.none!.roofs)}; ricucitura MJ (${r.doors} porte, ${r.stairs} scale dentro, ${r.outside} fuori) terra ${pct(r.mj!.ground)}, sopra ${pct(r.mj!.above)}, scale ${pct(r.mj!.stairs)}, tetti ${pct(r.mj!.roofs)}; ricucitura del kernel di T543 (${r.kernelOpened} vani rivestiti, ${r.kernelMs} ms) terra ${pct(r.kernel!.ground)}, sopra ${pct(r.kernel!.above)}, tetti ${pct(r.kernel!.roofs)}; stanze ${r.rooms!.rooms} (la più grande ${r.rooms!.largest} vani); tasselli ${r.used}/${r.of}, ${r.entropy} bit`
            : ''),
      );
    }
out.runs = runs;

// The summaries: by set and ground.
const sum = (rs: Run[], k: 'none' | 'mj' | 'kernel', f: keyof Reach) => rs.reduce((a, r) => [a[0] + (r[k]?.[f][0] ?? 0), a[1] + (r[k]?.[f][1] ?? 0)], [0, 0]) as [number, number];
const summary: Array<Record<string, unknown>> = [];
for (const key of sets.keys())
  for (const ground of ['lotto', 'blocco'] as Ground[]) {
    const rs = runs.filter((r) => r.set === key && r.ground === ground);
    const ok = rs.filter((r) => r.ok);
    const mean = (f: (r: Run) => number) => (ok.length ? Math.round((10 * ok.reduce((a, r) => a + f(r), 0)) / ok.length) / 10 : 0);
    const s = {
      set: key, ground, seeds: rs.length, ok: ok.length,
      ms: { total: mean((r) => r.ms.total), massing: mean((r) => r.ms.massing), wave: mean((r) => r.ms.wave), stitch: mean((r) => r.ms.stitch), voxels: mean((r) => r.ms.voxels), max: Math.max(0, ...ok.map((r) => r.ms.total)) },
      none: { ground: sum(ok, 'none', 'ground'), above: sum(ok, 'none', 'above'), stairs: sum(ok, 'none', 'stairs'), roofs: sum(ok, 'none', 'roofs') },
      mj: { ground: sum(ok, 'mj', 'ground'), above: sum(ok, 'mj', 'above'), stairs: sum(ok, 'mj', 'stairs'), roofs: sum(ok, 'mj', 'roofs') },
      kernel: { ground: sum(ok, 'kernel', 'ground'), above: sum(ok, 'kernel', 'above'), stairs: sum(ok, 'kernel', 'stairs'), roofs: sum(ok, 'kernel', 'roofs') },
      doors: mean((r) => r.doors ?? 0), stairs: mean((r) => r.stairs ?? 0), outside: mean((r) => r.outside ?? 0), kernelOpened: mean((r) => r.kernelOpened ?? 0),
      rooms: mean((r) => r.rooms?.rooms ?? 0), largest: Math.max(0, ...ok.map((r) => r.rooms?.largest ?? 0)), used: mean((r) => r.used ?? 0), of: ok[0]?.of, entropy: mean((r) => r.entropy ?? 0), buildings: mean((r) => r.buildings ?? 0),
    };
    summary.push(s);
    console.log(
      `RIASSUNTO ${key} ${ground}: ${ok.length}/${rs.length} semi fatti; ${s.ms.total} ms in media (massa ${s.ms.massing}, onda ${s.ms.wave}, ricucitura ${s.ms.stitch}, voxel ${s.ms.voxels}; al più ${s.ms.max}); ${s.buildings} edifici; ` +
        `senza ricucitura terra ${pct(s.none.ground)}, sopra ${pct(s.none.above)}, scale ${pct(s.none.stairs)}, tetti ${pct(s.none.roofs)}; ricucitura MJ terra ${pct(s.mj.ground)}, sopra ${pct(s.mj.above)}, scale ${pct(s.mj.stairs)}, tetti ${pct(s.mj.roofs)} (${s.doors} porte, ${s.stairs} scale dentro, ${s.outside} fuori); ` +
        `kernel di T543 terra ${pct(s.kernel.ground)}, sopra ${pct(s.kernel.above)}, tetti ${pct(s.kernel.roofs)} (${s.kernelOpened} vani rivestiti); stanze ${s.rooms}, la più grande ${s.largest} vani; tasselli ${s.used} di ${s.of}, ${s.entropy} bit`,
    );
  }
out.summary = summary;

// ---------------------------------------------------------------- variance: the massing between seeds, the wave alone, the bricks

{
  const variance: Record<string, unknown> = {};
  const mean = (xs: number[]) => (xs.length ? Math.round((1000 * xs.reduce((a, b) => a + b, 0)) / xs.length) / 1000 : 0);
  const pairs = <T,>(xs: T[], f: (a: T, b: T) => number) => {
    const o: number[] = [];
    for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) o.push(f(xs[i], xs[j]));
    return o;
  };
  for (const [key, { spec, set, cx }] of sets) {
    // The massing: the share of bays whose letter differs between two seeds (the layout changes with the seed).
    const ms = seeds.map((s) => massing(spec.massing, 'blocco', s));
    const massingDiff = mean(pairs(ms, (a, b) => {
      let d = 0;
      for (let i = 0; i < a.grid.cells.length; i++) if (a.grid.alphabet[a.grid.cells[i]] !== b.grid.alphabet[b.grid.cells[i]]) d++;
      return d / a.grid.cells.length;
    }));
    // The wave alone: one massing, several seeds of the rest of the program (the signatures and the bays that change).
    // The massing of the first seed whose wave the set takes (a seed it refuses has no wave to vary).
    const good = seeds.find((s) => !!fabricOf(cx, runComplex(cx, 'blocco', s, { upTo: 2 }).grid)) ?? 1;
    const base = runComplex(cx, 'blocco', good, { upTo: 1 }).grid;
    const waves = seeds.slice(0, 6).map((s) => runComplex(cx, 'blocco', 1000 + s, { upTo: 3, from: base })).map((r) => fabricOf(cx, r.grid)).filter((f): f is Fab => !!f);
    const waveDiff = mean(pairs(waves, (a, b) => {
      let n = 0, d = 0;
      for (let i = 0; i < a.sig.length; i++) {
        if (set.sigs[a.sig[i]].family === 'air' && set.sigs[b.sig[i]].family === 'air') continue;
        n++;
        if (a.sig[i] !== b.sig[i]) d++;
      }
      return n ? d / n : 0;
    }));
    // The bricks and the colours between seeds of the whole program.
    const fulls = [...kept.entries()].filter(([k]) => k.startsWith(`${key}|blocco|`)).map(([, v]) => v);
    const brickDiff = mean(pairs(fulls.map((f) => bricksUsed(set, f.motifs).counts), spread));
    const lookDiff = mean(pairs(fulls.map((f) => looks(f.grid)), spread));
    variance[key] = { massing: massingDiff, wave: waveDiff, wavesFound: waves.length, bricks: brickDiff, looks: lookDiff };
    console.log(`VARIANZA ${key}: la massa cambia il ${Math.round(100 * massingDiff)} % dei vani fra due semi; l'onda sola (stessa massa) la firma del ${Math.round(100 * waveDiff)} % dei vani; l'uso dei tasselli dista ${brickDiff}, i colori ${lookDiff} (da 0, uguali, a 1)`);
    if (key === 'mesa' || key === 'neapolis') console.log(`la massa di ${key}, blocco, seme 1:\n${massingText(ms[0])}`);
  }
  // Between the two sets: the colours of their blocks.
  const a = [1, 2, 3].map((s) => kept.get(`neapolis|blocco|${s}`)).find(Boolean), b = [1, 2, 3].map((s) => kept.get(`mesa|blocco|${s}`)).find(Boolean);
  if (a && b) variance.betweenSets = { looks: Math.round(1000 * spread(looks(a.grid), looks(b.grid))) / 1000 };
  out.variance = variance;
}

// ---------------------------------------------------------------- the kernel's walk on the voxels, beside the graph

/** The first seed of a set and a ground whose program finished (a seed the wave refuses is one the kernel would not take). */
const firstKey = (set: string, ground: Ground) => [1, 2, 3].map((s) => `${set}|${ground}|${s}`).find((k) => kept.has(k));
const firstKept = (set: string, ground: Ground) => {
  const k = firstKey(set, ground);
  return k ? kept.get(k) : undefined;
};

{
  const walks: Record<string, unknown> = {};
  for (const [set, ground] of [['neapolis', 'lotto'], ['neapolis', 'blocco'], ['mesa', 'lotto'], ['mesa', 'blocco']] as const) {
    const k = firstKey(set, ground);
    const v = k ? kept.get(k) : undefined;
    if (!v || !k) continue;
    const graph = reachOf(v.cx.set, v.fab3);
    const w = kernelWalk(v.cx, v.grid, v.fab3, graph);
    walks[k] = { ms: Math.round(w.ms), both: w.both, onlyGraph: w.onlyGraph, onlyWalk: w.onlyWalk };
    console.log(`cammino del kernel, ${k} (${v.grid.X}×${v.grid.Y}×${v.grid.Z}): ${w.ms.toFixed(0)} ms; vani da raggiungere raggiunti dai due ${w.both}, solo dal grafo ${w.onlyGraph}, solo dal cammino ${w.onlyWalk}`);
  }
  out.walks = walks;
}

// ---------------------------------------------------------------- photos

if (photos) {
  const dir = path.join(here, 'foto');
  fs.mkdirSync(dir, { recursive: true });
  const bg: [number, number, number] = [236, 233, 226];
  const write = (pic: Picture, name: string) => fs.writeFileSync(path.join(dir, name), png(pic));
  const shot = (g: Grid3, palette: Record<string, PaletteEntry>, view = 0) => render(g, palette, view, DEFAULT_RENDER);
  const gridOf = (s: Source): Grid3 => ({ X: s.X, Y: s.Y, Z: s.Z, cells: s.cells, alphabet: s.alphabet, log: [], epoch: 0 });
  const pics = new Map<string, Picture>();
  for (const [key, { set, cx, sources }] of sets) {
    // The static models they come from, fitted to the bays (the ring of street around), as the Concilio drew them.
    const src = sources.filter((_s, i) => i % 2 === 0).map((s) => shot(gridOf(s), s.palette));
    pics.set(`${key}|sorgenti`, sheet(src, 1, 8, bg));
    write(pics.get(`${key}|sorgenti`)!, `sorgenti-${key}.png`);
    // The catalogue: every brick (any turn is the same brick) once, as the set has it.
    const seen = new Set<string>();
    const cat: Picture[] = [];
    for (const b of set.bricks) {
      if (seen.has(b.canon) || b.family === 'air') continue;
      seen.add(b.canon);
      const [sx, sy, sz] = b.size;
      const X = sx * C, Y = sy * C, Z = sz * H;
      const cells = new Uint8Array(X * Y * Z);
      for (const mi of b.motifs) {
        const m = set.motifs[mi];
        const [ax, ay, az] = m.at;
        for (let z = 0; z < H; z++) for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) cells[ax * C + x + (ay * C + y) * X + (az * H + z) * X * Y] = m.voxels[x + y * C + z * C * C];
      }
      cat.push(shot({ X, Y, Z, cells, alphabet: set.alphabet, log: [], epoch: 0 }, set.palette));
    }
    const rows: Picture[] = [];
    for (let i = 0; i < cat.length; i += 10) rows.push(sheet(cat.slice(i, i + 10), 1, 6, bg));
    const w = Math.max(...rows.map((r) => r.w)), h = rows.reduce((a, r) => a + r.h, 0);
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) data.set([...bg, 255], i * 4);
    let oy = 0;
    for (const r of rows) {
      for (let y = 0; y < r.h; y++) data.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), (oy + y) * w * 4);
      oy += r.h;
    }
    write({ w, h, data }, `catalogo-${key}.png`);
    // The complexes: three seeds on a lot, three on the lot of a block.
    for (const ground of ['lotto', 'blocco'] as Ground[]) {
      const ps = [1, 2, 3].map((s) => kept.get(`${key}|${ground}|${s}`)).filter((v): v is NonNullable<typeof v> => !!v).map((v) => shot(v.grid, cx.program.palette));
      if (!ps.length) continue;
      const pic = sheet(ps, 1, 10, bg);
      pics.set(`${key}|${ground}`, pic);
      write(pic, `${key}-${ground}.png`);
    }
    // The lot of seed 1 from two sides, before the stitching's doors and stairs are written (the plain dressing) and after.
    const v = firstKept(key, 'blocco');
    if (v) write(sheet([shot(v.grid, cx.program.palette, 0), shot(v.grid, cx.program.palette, 2)], 1, 10, bg), `${key}-blocco-due-lati.png`);
  }
  // Beside T543: its way A on the lot of a block (the palazzina of the large set, seed 1), the two sets of T557, the sources.
  {
    const set543 = t543Set([...T543_SETS.palazzina, T543_AIR]);
    const m = t543Massing('blocco', 1);
    const w = t543ViaA(set543, m.grid, m.letter, 1);
    if (w.observed) {
      const g = t543Voxels({ set: set543, X: w.X, Y: w.Y, Z: w.Z, at: w.observed, letter: m.letter }, 0, 0, w.X - 1, w.Y - 1, 1);
      const p543 = render(g, T543_PALETTE as Record<string, PaletteEntry>, 0, DEFAULT_RENDER);
      const width = 560;
      write(sheet([shrink(p543, width), ...['neapolis', 'mesa'].map((k) => firstKept(k, 'blocco')).filter((x): x is NonNullable<typeof x> => !!x).map((x) => shrink(shot(x.grid, x.cx.program.palette), width))], 1, 12, bg), 'accanto-a-t543.png');
      const srcRow = ['neapolis', 'mesa'].map((k) => pics.get(`${k}|sorgenti`)).filter((p): p is Picture => !!p);
      write(sheet(srcRow.map((p) => shrink(p, Math.min(p.w, 840))), 1, 16, bg), 'sorgenti.png');
    }
  }
  console.log(`foto in ${path.relative(process.cwd(), dir)}`);
}

if (jsonOut) {
  fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true });
  fs.writeFileSync(path.resolve(jsonOut), JSON.stringify(out, (_k, v) => (v instanceof Map ? Object.fromEntries(v) : v instanceof Set ? [...v] : v), 1) + '\n');
  console.log(`misure in ${jsonOut}`);
}
