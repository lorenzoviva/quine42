// T459 (docs/design/terreno-3d.md § 5): what the ways of the ground and the automata cost, measured in Node on the seed's offline
// kernel, not estimated. Per place: the time to make it (the draft in Lua, the layout, the levels, the strata; the true relief, the rule
// 10 on the steps, the strata in MarkovJunior; the voxels at 1, 2, 4 and 8 a tile, their program, their floors, their mesh), the
// memory of what it keeps and of its mesh, its triangles; per step: the water as virtual pipes, the wind as a lattice Boltzmann, the
// fire as a table, as MarkovJunior and as Lua, the water of today (water.ts). The frame in the browser is misura-frame.mjs --terreno.
// No calls, nothing written but the report:
//
//   npx vite-node lab/terreno-3d/misura.ts -- [--luoghi 300] [--voxel 12] [--json lab/terreno-3d/misure/node.json] [--md lab/terreno-3d/misure/node.md]

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { LuaFactory } from 'wasmoon';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { memoryStore } from '../../src/kernel/repo';
import { layout } from '../../src/kernel/layout';
import { chunkLevels, HILLS, Relief } from '../../src/kernel/relief';
import { draftStrata, strataPalette, STRATA_DEPTH } from '../../src/kernel/strata';
import { WaterFlow, type WaterWorld } from '../../src/kernel/water';
import { buildChunk } from '../../src/render/terrain';
import { compileMjx } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import { Stepper } from '../../src/mj/engine';
import { meshVoxels } from '../../src/mj/mesh';
import {
  columnsMesh,
  columnsWalk,
  Diffuse,
  FIRE_LUA_CELL,
  FIRE_LUA_STEP,
  FIRE_XML,
  fireRules,
  gatesOf,
  hiddenFromCamera,
  LbmWind,
  LEVEL,
  PipesWater,
  RuleTable,
  stepGraph,
  strataMj,
  surfaceLetter,
  TERRAIN_PALETTE,
  trueRelief,
  voxelFloors,
  voxelMesh,
  voxelPlace,
  type Column,
} from './vie';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const PLACES = Number(opt('luoghi', '300'));
const VOXEL_PLACES = Number(opt('voxel', '12'));
const jsonOut = opt('json', 'lab/terreno-3d/misure/node.json')!;
const mdOut = opt('md', 'lab/terreno-3d/misure/node.md')!;

const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
const median = (xs: number[]) => sorted(xs)[Math.floor(xs.length / 2)] ?? 0;
const p95 = (xs: number[]) => sorted(xs)[Math.min(xs.length - 1, Math.floor(xs.length * 0.95))] ?? 0;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '—');
const time = <T>(fn: () => T): [T, number] => {
  const t0 = performance.now();
  const v = fn();
  return [v, performance.now() - t0];
};

const md: string[] = [];
const out: Record<string, unknown> = {};
const log = (s = '') => {
  console.log(s);
  md.push(s);
};

log(`# Le misure in Node di T459 (${new Date().toISOString().slice(0, 10)})`);
log('');
log(`Node ${process.version}, ${process.platform}; i tempi sono in millisecondi, la mediana e il 95° percentile su più luoghi o passi.`);

// ------------------------------------------------------------------------------------------------------------ the kernel of the seed
const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
k.tick(1 / 60);
const S = k.config.chunkSize;
const seed = k.config.seed;
const pal = k.palette;
const relief = k.relief;
const sea = k.seaLevel;
const genDraft = (cx: number, cy: number) => (k as unknown as { genDraft(cx: number, cy: number): string }).genDraft(cx, cy);
const liquid = (c: string) => pal[c]?.layer === 'liquid';
const solid = (c: string) => pal[c]?.solid !== false;
const swim = (c: string) => pal[c]?.cross === 'swim';
const strata = strataPalette(undefined);
const environments = Object.entries(k.content.layouts).filter(([, e]) => e.program);

/** The places measured: a square of `PLACES` places spread over the world (every fifth place), the start among them. */
const side = Math.ceil(Math.sqrt(PLACES));
const places: Array<[number, number]> = [];
for (let j = 0; j < side; j++) for (let i = 0; i < side && places.length < PLACES; i++) places.push([(i - (side >> 1)) * 5, (j - (side >> 1)) * 5]);

// The drafts, once (the Lua of the seed's generator, in the kernel's sandbox).
const drafts = new Map<string, string>();
const draftMs: number[] = [];
for (const [cx, cy] of places) {
  const [d, ms] = time(() => genDraft(cx, cy));
  drafts.set(`${cx},${cy}`, d);
  draftMs.push(ms);
}
const draftOf = (cx: number, cy: number) => {
  const key = `${cx},${cy}`;
  let d = drafts.get(key);
  if (!d) drafts.set(key, (d = genDraft(cx, cy)));
  return d;
};
const codeAt = (col: number, row: number) => {
  const cx = Math.floor(col / S), cy = Math.floor(row / S);
  return draftOf(cx, cy)[(row - cy * S) * S + (col - cx * S)] ?? 'g';
};
const rows = (d: string) => Array.from({ length: S }, (_, r) => d.slice(r * S, (r + 1) * S));

// ------------------------------------------------------------------------------------------------------------ today
log('');
log('## 1. Oggi: un livello per casella');
const layoutMs: number[] = [], levelsMs: number[] = [], strataMs: number[] = [];
let carved = 0;
places.forEach(([cx, cy], n) => {
  const d = draftOf(cx, cy);
  const env = environments[n % environments.length]?.[1];
  const [res, ms] = time(() => layout(rows(d), pal, { cx, cy, seed, pathCode: 'p', program: env?.program, swim: true }));
  layoutMs.push(ms);
  carved += res.carved;
  const tiles = res.grid.join('');
  levelsMs.push(time(() => chunkLevels(tiles, S, liquid, (c, r) => relief.level(cx * S + c, cy * S + r), []))[1]);
  strataMs.push(time(() => draftStrata(d, cx, cy, S, seed, pal, strata))[1]);
});
// The meshes of the places the kernel has loaded around the start, as the renderer builds them.
const loaded = [...k.chunks.values()];
const meshMs: number[] = [], meshTris: number[] = [], meshBytes: number[] = [];
// Once untimed (the code compiled, the terrains' colours made), then measured.
for (const ch of loaded) buildChunk(k, ch);
for (const ch of loaded) {
  const [view, ms] = time(() => buildChunk(k, ch));
  meshMs.push(ms);
  let tris = 0, bytes = 0;
  view.group.traverse((o: any) => {
    const g = o.geometry;
    if (!g || o.isInstancedMesh) return;
    const pos = g.getAttribute('position');
    tris += pos.count / 3;
    for (const a of Object.values(g.attributes) as any[]) bytes += a.array.byteLength;
  });
  meshTris.push(tris);
  meshBytes.push(bytes);
}
const today = {
  places: places.length,
  draftMs: { median: median(draftMs), p95: p95(draftMs) },
  layoutMs: { median: median(layoutMs), p95: p95(layoutMs) },
  levelsMs: { median: median(levelsMs), p95: p95(levelsMs) },
  strataMs: { median: median(strataMs), p95: p95(strataMs) },
  carvedPerPlace: carved / places.length,
  keptBytes: S * S + STRATA_DEPTH * S * S + 2 * S * S,
  mesh: { places: loaded.length, ms: median(meshMs), p95: p95(meshMs), triangles: median(meshTris), trianglesP95: p95(meshTris), bytes: median(meshBytes) },
};
out.today = today;
log(`${places.length} luoghi (uno ogni cinque, su ${side} × ${side}); gli ambienti del seme a turno nel layout.`);
log('');
log('| passo | mediana | p95 |');
log('|---|---:|---:|');
log(`| la bozza (Lua del seme, nella sandbox) | ${f(today.draftMs.median)} | ${f(today.draftMs.p95)} |`);
log(`| il layout (programma dell'ambiente, connessione, nuoto) | ${f(today.layoutMs.median)} | ${f(today.layoutMs.p95)} |`);
log(`| i livelli del luogo (\`chunkLevels\`) | ${f(today.levelsMs.median)} | ${f(today.levelsMs.p95)} |`);
log(`| gli strati (\`draftStrata\`, 4 righe) | ${f(today.strataMs.median)} | ${f(today.strataMs.p95)} |`);
log(`| la mesh del luogo (\`buildChunk\`, ${loaded.length} luoghi caricati) | ${f(today.mesh.ms)} | ${f(today.mesh.p95)} |`);
log('');
log(`Mesh di un luogo: ${Math.round(today.mesh.triangles)} triangoli in mediana (p95 ${Math.round(today.mesh.trianglesP95)}), ${(today.mesh.bytes / 1024).toFixed(0)} KB di buffer (senza le istanze di alberi e rocce). Ciò che il luogo tiene: caselle, strati e livelli, ${(today.keptBytes / 1024).toFixed(1)} KB. Sentieri scavati: ${f(today.carvedPerPlace, 1)} caselle a luogo.`);

// ------------------------------------------------------------------------------------------------------------ the way "columns"
log('');
log('## 2. A colonne (2.5D): il rilievo vero, la regola 10 sui gradini, gli strati in MarkovJunior');
const hills = (c: number, r: number) => relief.level(c, r);
const reliefMs: number[] = [], graphMs: number[] = [], strataMj1: number[] = [], strataMj2: number[] = [], strataMj4: number[] = [];
const colMeshMs: number[] = [], colTris: number[] = [], colBytes: number[] = [];
const stats = { massif: 0, ramps: 0, earthworks: 0, strictRamps: 0, strictEarthworks: 0, strictEnclaves: 0, hidden: 0, hiddenToday: 0, standing: 0, pockets: 0, enclaves: 0, enclaveTiles: 0, byJump: 0, byClimb: 0, beyond: 0, open: 0, reached: 0, edges: { step: 0, jump: 0, climb: 0, cliff: 0 }, maxLevel: -Infinity, minBed: Infinity };
const walk = columnsWalk(solid, swim);
const levelAt = new Map<string, number>();
const tr = (col: number, row: number) => {
  const key = `${col},${row}`;
  let v = levelAt.get(key);
  if (v === undefined) levelAt.set(key, (v = trueRelief(col, row, seed, hills, codeAt(col, row), sea).level));
  return v;
};
places.forEach(([cx, cy], n) => {
  const d = draftOf(cx, cy);
  // The drafts of the places around are the kernel's anyway (loaded with it): made before the clock starts.
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) draftOf(cx + dx, cy + dy);
  // The relief of the place and its ring (S + 2 a side).
  const [lv, ms] = time(() => {
    const a = new Int16Array((S + 2) * (S + 2));
    let massif = 0;
    for (let r = -1; r <= S; r++)
      for (let c = -1; c <= S; c++) {
        const t = trueRelief(cx * S + c, cy * S + r, seed, hills, c >= 0 && r >= 0 && c < S && r < S ? d[r * S + c] : codeAt(cx * S + c, cy * S + r), sea);
        a[(r + 1) * (S + 2) + (c + 1)] = t.level;
        if (c >= 0 && r >= 0 && c < S && r < S && t.massif > 0.2) massif++;
      }
    stats.massif += massif;
    return a;
  });
  reliefMs.push(ms);
  for (const v of lv) {
    stats.maxLevel = Math.max(stats.maxLevel, v);
    stats.minBed = Math.min(stats.minBed, v);
  }
  const [g, gms] = time(() => stepGraph(d, lv, S, walk, gatesOf(cx, cy, S, seed)));
  graphMs.push(gms);
  stats.ramps += g.ramps;
  stats.earthworks += g.earthworks;
  stats.open += g.open;
  stats.reached += g.reached;
  stats.pockets += g.pockets;
  for (const e of g.enclaves) {
    stats.enclaves++;
    stats.enclaveTiles += e.tiles;
    if (e.jump) stats.byJump++;
    else if (e.climb) stats.byClimb++;
    else stats.beyond++;
  }
  for (const key of ['step', 'jump', 'climb', 'cliff'] as const) stats.edges[key] += g.edges[key];
  // Today's rule to the letter: every enclave joined with a ramp too.
  const strict = stepGraph(d, lv, S, walk, gatesOf(cx, cy, S, seed), true);
  stats.strictRamps += strict.ramps;
  stats.strictEarthworks += strict.earthworks;
  stats.strictEnclaves += strict.enclaves.length;
  // The 3/4 camera from the south: where a body standing would be hidden by the ground towards it, with the true relief and with today's.
  for (let i = 0; i < S * S; i++) {
    if (walk.solid(d[i]) && !walk.swim(d[i])) continue;
    const x = cx * S + (i % S), y = cy * S + Math.floor(i / S);
    stats.standing++;
    if (hiddenFromCamera(tr, x, y)) stats.hidden++;
    if (hiddenFromCamera((c, r) => Math.max(sea, hills(c, r)), x, y)) stats.hiddenToday++;
  }
  if (n < 60) {
    strataMj1.push(strataMj(d, S, 6, seed + n, 1).ms);
    if (n < 30) strataMj2.push(strataMj(d, S, 6, seed + n, 2).ms);
    if (n < 12) strataMj4.push(strataMj(d, S, 6, seed + n, 4).ms);
    const st = strataMj(d, S, 6, seed + n, 1).grid;
    const strataAt = (col: number, row: number, depth: number) => {
      const c = col - cx * S, r = row - cy * S;
      if (c < 0 || r < 0 || c >= S || r >= S) return undefined;
      const z = st.Z - 2 - Math.min(5, depth);
      return st.alphabet[st.cells[c + r * S + z * S * S]];
    };
    const colour = (code: string) => pal[code]?.color ?? TERRAIN_PALETTE[code]?.color;
    const [mesh, mms] = time(() => columnsMesh(S, cx, cy, tr, codeAt, colour, strataAt, 6));
    colMeshMs.push(mms);
    colTris.push(mesh.triangles);
    colBytes.push(mesh.bytes);
  }
});
const columns = {
  reliefMs: { median: median(reliefMs), p95: p95(reliefMs) },
  graphMs: { median: median(graphMs), p95: p95(graphMs) },
  strataMj: { r1: { median: median(strataMj1), p95: p95(strataMj1) }, r2: { median: median(strataMj2), p95: p95(strataMj2) }, r4: { median: median(strataMj4), p95: p95(strataMj4) } },
  mesh: { ms: median(colMeshMs), p95: p95(colMeshMs), triangles: median(colTris), trianglesP95: p95(colTris), bytes: median(colBytes) },
  stats: { ...stats, hiddenShare: stats.hidden / Math.max(1, stats.standing), hiddenTodayShare: stats.hiddenToday / Math.max(1, stats.standing), massifShare: stats.massif / (places.length * S * S), reachedShare: stats.reached / Math.max(1, stats.open), rampsPerPlace: stats.ramps / places.length, earthworksPerPlace: stats.earthworks / places.length, enclavesPerPlace: stats.enclaves / places.length },
  keptBytes: S * S + 6 * S * S + 2 * S * S + 2 * S * S,
};
out.columns = columns;
log(`Gli stessi ${places.length} luoghi; il rilievo con il luogo e l'anello attorno (${(S + 2) ** 2} caselle). Gli strati in MarkovJunior su 6 righe (\`STRATA_XML\`).`);
log('');
log('| passo | mediana | p95 |');
log('|---|---:|---:|');
log(`| il rilievo vero (\`trueRelief\`, in TypeScript) | ${f(columns.reliefMs.median)} | ${f(columns.reliefMs.p95)} |`);
log(`| la regola 10 sui gradini, con le rampe (\`stepGraph\`) | ${f(columns.graphMs.median)} | ${f(columns.graphMs.p95)} |`);
log(`| gli strati in MarkovJunior, una cella a casella (18 × 18 × 7) | ${f(columns.strataMj.r1.median)} | ${f(columns.strataMj.r1.p95)} |`);
log(`| gli strati in MarkovJunior, 2 celle a casella (36 × 36 × 13) | ${f(columns.strataMj.r2.median)} | ${f(columns.strataMj.r2.p95)} |`);
log(`| gli strati in MarkovJunior, 4 celle a casella (72 × 72 × 25) | ${f(columns.strataMj.r4.median)} | ${f(columns.strataMj.r4.p95)} |`);
log(`| la mesh a colonne con le bande degli strati | ${f(columns.mesh.ms)} | ${f(columns.mesh.p95)} |`);
log('');
const st = columns.stats;
log(`Mesh: ${Math.round(columns.mesh.triangles)} triangoli in mediana (p95 ${Math.round(columns.mesh.trianglesP95)}), ${(columns.mesh.bytes / 1024).toFixed(0)} KB. Ciò che il luogo tiene: caselle, 6 righe di strati, livelli e letto, ${(columns.keptBytes / 1024).toFixed(1)} KB.`);
log(`Il rilievo: livelli da ${st.minBed} (il letto del mare più fondo) a ${st.maxLevel} (${(st.maxLevel * LEVEL).toFixed(1)} caselle), massicci sul ${(100 * st.massifShare).toFixed(0)} % delle caselle. Fra due caselle aperte vicine: ${st.edges.step} entro un gradino, ${st.edges.jump} entro un salto, ${st.edges.climb} entro un'arrampicata di 3 caselle, ${st.edges.cliff} oltre.`);
log(`La regola 10 alla lettera (anche ogni enclave unita con una rampa): ${f(st.strictRamps / places.length, 2)} rampe a luogo, ${f(st.strictEarthworks / places.length, 1)} livelli mossi a luogo, ${st.strictEnclaves} enclavi che nessuna rampa raggiunge.`);
log(`La camera di 3/4 da sud: un corpo in piedi è nascosto dal terreno verso la camera sul ${(100 * st.hiddenShare).toFixed(1)} % delle caselle aperte col rilievo vero, sul ${(100 * st.hiddenTodayShare).toFixed(2)} % con quello di oggi.`);
log(`La regola 10: dal primo varco si raggiunge il ${(100 * st.reachedShare).toFixed(1)} % delle caselle aperte; rampe scavate ${f(st.rampsPerPlace, 2)} a luogo (${f(st.earthworksPerPlace, 1)} livelli mossi); sacche di 4 caselle o più divise da caselle solide (il layout di oggi le unisce con un sentiero) ${f(st.pockets / places.length, 2)} a luogo; enclavi di 4 caselle o più divise da un dirupo ${f(st.enclavesPerPlace, 2)} a luogo (${st.enclaves} in tutto, ${st.enclaveTiles} caselle): ${st.byJump} col salto, ${st.byClimb} con un'arrampicata di 3 caselle, ${st.beyond} oltre.`);

// ------------------------------------------------------------------------------------------------------------ the way "voxels"
log('');
log('## 3. In voxel (3D): la grande scala dal kernel, il dettaglio in MarkovJunior');
// The places of voxels: those with the most relief first (massifs, sea), then the start: what costs most is what matters.
const ranked = places
  .map(([cx, cy]) => {
    let lo = Infinity, hi = -Infinity;
    for (let r = 0; r < S; r += 3) for (let c = 0; c < S; c += 3) {
      const v = tr(cx * S + c, cy * S + r);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    return { cx, cy, span: hi - lo };
  })
  .sort((a, b) => b.span - a.span);
const chosen = [...ranked.slice(0, VOXEL_PLACES - 2), ranked[Math.floor(ranked.length / 2)], ranked.find((p) => p.cx === 0 && p.cy === 0) ?? ranked[ranked.length - 1]];
const voxels: Record<string, unknown> = {};
for (const r of [1, 2, 4, 8]) {
  const rowsOf: Array<Record<string, number>> = [];
  const list = r === 8 ? chosen.slice(0, 2) : chosen;
  for (const { cx, cy } of list) {
    // The large scale at voxels: the true relief of the tile (at 4 voxels a tile a level is a voxel), and the water's surface.
    const columnsAt = (x: number, y: number): Column => {
      const col = cx * S + Math.floor(x / r), row = cy * S + Math.floor(y / r);
      const t = trueRelief(col, row, seed, hills, codeAt(col, row), sea);
      const toVox = (lv: number) => Math.round(lv * LEVEL * r);
      return { ground: toVox(t.level), water: t.surface !== undefined ? toVox(t.surface) : undefined, letter: surfaceLetter(codeAt(col, row)) };
    };
    const outside = (x: number, y: number, z: number, base: number) => {
      const c = columnsAt(x, y);
      return z + base < c.ground;
    };
    for (const kernelStrata of [false, true]) {
      const made = voxelPlace(S, r, columnsAt, seed + cx * 31 + cy, 4, kernelStrata);
      const g = made.grid;
      const fl = voxelFloors(g, Math.round(1.6 * r) || 1, Math.max(1, Math.round(0.5 * r)), [gatesOf(cx, cy, S, seed)[0] % S * r, Math.floor(gatesOf(cx, cy, S, seed)[0] / S) * r]);
      const row: Record<string, number> = { cx, cy, r, kernelStrata: Number(kernelStrata), X: g.X, Z: g.Z, cells: g.cells.length, fillMs: made.fillMs, programMs: made.programMs, floorsMs: fl.ms, floors: fl.floors, reached: fl.reached };
      if (!kernelStrata) {
        const [greedy, gms] = time(() => voxelMesh(g, r, cx * S, cy * S, made.base, TERRAIN_PALETTE, (x, y, z) => outside(x, y, z, made.base), true));
        row.greedyMs = gms;
        row.greedyTris = greedy.triangles;
        row.greedyBytes = greedy.bytes;
        if (r <= 4) {
          const [faces, fms] = time(() => voxelMesh(g, r, cx * S, cy * S, made.base, TERRAIN_PALETTE, (x, y, z) => outside(x, y, z, made.base), false));
          row.facesMs = fms;
          row.facesTris = faces.triangles;
          row.facesBytes = faces.bytes;
        }
        if (r === 4 && rowsOf.length < 4) {
          // The game's own mesher of models (with its occlusion and grain), on the same grid: the faces at the place's border too.
          const [m, mms] = time(() => meshVoxels(g, TERRAIN_PALETTE, { vpt: r, underside: false }));
          row.modelMeshMs = mms;
          row.modelMeshTris = m.indices.length / 3;
          row.modelMeshBytes = m.positions.byteLength + m.normals.byteLength + m.colors.byteLength + m.indices.byteLength + (m.part?.byteLength ?? 0);
        }
      }
      rowsOf.push(row);
    }
  }
  const of = (key: string, ks = 0) => rowsOf.filter((x) => x.kernelStrata === ks && Number.isFinite(x[key])).map((x) => x[key]);
  const summary = {
    places: list.length,
    side: list.length ? rowsOf[0].X : 0,
    z: { median: median(of('Z')), max: Math.max(...of('Z')) },
    cells: { median: median(of('cells')), max: Math.max(...of('cells')) },
    fillMs: median(of('fillMs')),
    programMs: { median: median(of('programMs')), p95: p95(of('programMs')), max: Math.max(...of('programMs')) },
    programKernelStrataMs: { median: median(of('programMs', 1)), p95: p95(of('programMs', 1)) },
    floorsMs: median(of('floorsMs')),
    floors: median(of('floors')),
    reachedShare: mean(rowsOf.filter((x) => x.kernelStrata === 0).map((x) => x.reached / Math.max(1, x.floors))),
    greedy: { ms: median(of('greedyMs')), triangles: median(of('greedyTris')), trianglesMax: Math.max(...of('greedyTris')), bytes: median(of('greedyBytes')) },
    faces: of('facesTris').length ? { ms: median(of('facesMs')), triangles: median(of('facesTris')), bytes: median(of('facesBytes')) } : undefined,
    modelMesh: of('modelMeshTris').length ? { ms: median(of('modelMeshMs')), triangles: median(of('modelMeshTris')), bytes: median(of('modelMeshBytes')) } : undefined,
  };
  voxels[`r${r}`] = { summary, rows: rowsOf };
}
out.voxels = voxels;
log(`${chosen.length} luoghi: i ${VOXEL_PLACES - 2} con più dislivello (massicci, mare), uno di mezzo e la partenza; a 8 voxel per casella solo i primi due. Lo scatolo è alto quanto il luogo chiede: dal letto o dal suolo più basso meno 4 caselle di strati fino al punto più alto.`);
log('');
log('| voxel a casella | lato × altezza (mediana, max) | celle (mediana) | il programma MJ (mediana, p95, max) | con gli strati del kernel | i pavimenti 3D | mesh fusa: ms, triangoli (mediana, max), KB | una faccia a quad: ms, triangoli | la mesh dei modelli (`meshVoxels`): ms, triangoli |');
log('|---:|---|---:|---|---:|---:|---|---|---|');
for (const r of [1, 2, 4, 8]) {
  const s = (voxels[`r${r}`] as { summary: any }).summary;
  log(`| ${r} | ${s.side} × ${s.z.median} (${s.z.max}) | ${Math.round(s.cells.median).toLocaleString('it-IT')} | ${f(s.programMs.median, 1)}, ${f(s.programMs.p95, 1)}, ${f(s.programMs.max, 1)} | ${f(s.programKernelStrataMs.median, 1)} | ${f(s.floorsMs, 1)} | ${f(s.greedy.ms, 1)}, ${Math.round(s.greedy.triangles)} (${Math.round(s.greedy.trianglesMax)}), ${(s.greedy.bytes / 1024).toFixed(0)} | ${s.faces ? `${f(s.faces.ms, 1)}, ${Math.round(s.faces.triangles)}` : '—'} | ${s.modelMesh ? `${f(s.modelMesh.ms, 1)}, ${Math.round(s.modelMesh.triangles)}` : '—'} |`);
}
{
  const s4 = (voxels.r4 as { summary: any }).summary;
  log('');
  log(`A 4 voxel per casella un luogo tiene ${(s4.cells.median / 1024).toFixed(0)} KB di voxel in mediana (un byte a voxel; ${(s4.cells.max / 1024).toFixed(0)} KB il più alto); i pavimenti 3D raggiunti dal primo varco sono il ${(100 * s4.reachedShare).toFixed(0)} % in media (le grotte e le terrazze no).`);
}
// The relief itself in MarkovJunior, per place (the "all in MJ" of the author): Hills on the box of a place at 4 voxels a tile.
{
  const box: [number, number, number] = [72, 72, 48];
  const xml = HILLS.replace(/steps="(\d+)"/g, (_, s) => `steps="${Math.round((Number(s) * 72 * 72) / 1600)}"`);
  const m = compileMjx(xml, { size: box });
  const [, ms] = time(() => runMjx(m, 7, { deadline: 60_000 }));
  const [, ms2] = time(() => runMjx(m, 8, { deadline: 60_000 }));
  out.hillsPerPlace = { box, ms: [ms, ms2] };
  const [, once] = time(() => new Relief(seed + 1));
  out.reliefOnce = once;
  log('');
  log(`Il rilievo stesso in MarkovJunior, luogo per luogo (\`Hills\` su 72 × 72 × 48, i passi scalati all'area): ${f(ms, 0)} e ${f(ms2, 0)} ms; oggi \`Relief\` fa le sue due piastrelle una volta per universo in ${f(once, 0)} ms. Un programma per luogo ha i suoi bordi: due luoghi vicini non si incontrerebbero.`);
}

// ------------------------------------------------------------------------------------------------------------ Lua for the large scale
log('');
log('## 4. Il Lua per la grande scala');
{
  const lua = await new LuaFactory().createEngine({ openStandardLibs: true });
  // The seed's value noise and fbm, with an integer hash of Lua 5.4: the relief's noise computed by a generator, a tile at a time.
  await lua.doString(`
local function hash(a, b, c)
  local h = 2166136261
  for _, v in ipairs({a, b, c}) do
    h = (h ~ (v & 0xffffffff)) * 16777619 & 0xffffffff
    h = h ~ (h >> 13)
    h = (h * 0x5bd1e995) & 0xffffffff
    h = h ~ (h >> 15)
  end
  return h / 4294967296
end
local function smooth(t) return t * t * (3 - 2 * t) end
local function vnoise(x, y, s)
  local ix, iy = math.floor(x), math.floor(y)
  local fx, fy = smooth(x - ix), smooth(y - iy)
  local a, b, c, d = hash(ix, iy, s), hash(ix + 1, iy, s), hash(ix, iy + 1, s), hash(ix + 1, iy + 1, s)
  return a + (b - a) * fx + (c - a + (a - b + d - c) * fx) * fy
end
local function ridge(x, y, s) return 1 - math.abs(2 * vnoise(x, y, s) - 1) end
function relief_chunk(cx, cy, seed, size)
  local out = {}
  for row = 0, size - 1 do
    for col = 0, size - 1 do
      local x, y = cx * size + col, cy * size + row
      local m = 0.65 * ridge(x / 150, y / 150, seed + 911) + 0.35 * vnoise(x / 50, y / 50, seed + 912)
      local p = ridge(x / 46, y / 46, seed + 913)
      local d = vnoise(x / 11, y / 11, seed + 915)
      out[#out + 1] = math.floor(m * 56 + p + d)
    end
  end
  return out
end`);
  const fn = lua.global.get('relief_chunk') as (cx: number, cy: number, seed: number, size: number) => unknown;
  const ms: number[] = [];
  for (let i = 0; i < 40; i++) ms.push(time(() => fn(i, -i, seed, S))[1]);
  // The same with the levels handed back as a string (one character a level), as generate_chunk hands back its codes.
  await lua.doString(`function relief_string(cx, cy, seed, size) local t = relief_chunk(cx, cy, seed, size); local s = {} for i = 1, #t do s[i] = string.char(48 + (t[i] % 64)) end return table.concat(s) end`);
  const fs = lua.global.get('relief_string') as (cx: number, cy: number, seed: number, size: number) => unknown;
  const ms2: number[] = [];
  for (let i = 0; i < 40; i++) ms2.push(time(() => fs(i, i, seed, S))[1]);
  out.lua = { reliefChunkMs: median(ms.slice(5)), reliefStringMs: median(ms2.slice(5)), draftMs: today.draftMs.median };
  log(`Il rumore del rilievo vero in Lua (wasmoon senza la sandbox del kernel, un hash di Lua 5.4): ${f(median(ms.slice(5)))} ms a luogo restituito come tabella, ${f(median(ms2.slice(5)))} ms come stringa; la bozza di oggi (il generatore del seme, nella sandbox) ${f(today.draftMs.median)} ms.`);
  lua.global.close();
}

// ------------------------------------------------------------------------------------------------------------ the automata
log('');
log('## 5. Gli automi cellulari');
const W0 = 6 * S, H0 = 5 * S; // the loaded window: about 6 × 5 places at the camera's widest
const automata: Record<string, unknown> = {};
// A window of the world for the water: the true relief's bed, the sea where the draft says, a spring upstream.
const window0: [number, number] = [ranked[0].cx - 3, ranked[0].cy - 2];
const bench = (step: () => void, n: number) => {
  for (let i = 0; i < Math.min(20, n); i++) step();
  const ms: number[] = [];
  for (let i = 0; i < n; i++) ms.push(time(step)[1]);
  return { median: median(ms), p95: p95(ms) };
};
for (const per of [1, 2, 4]) {
  const W = W0 * per, H = H0 * per;
  const w = new PipesWater(W, H, 1 / per);
  w.sea = sea * LEVEL;
  let maxDepth = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const col = window0[0] * S + Math.floor(x / per), row = window0[1] * S + Math.floor(y / per);
      const code = codeAt(col, row);
      const t = trueRelief(col, row, seed, hills, code, sea);
      const i = y * W + x;
      w.bed[i] = t.level * LEVEL;
      if (t.surface !== undefined) w.depth[i] = Math.max(0, (t.surface - t.level) * LEVEL);
      if (code === 'o') w.source[i] = 1;
      maxDepth = Math.max(maxDepth, w.depth[i]);
    }
  const dt = Math.min(1 / 60, w.stableDt(maxDepth));
  const perSecond = Math.ceil(1 / dt);
  const before = w.volume();
  const r = bench(() => w.step(dt), per === 4 ? 60 : 200);
  automata[`pipes${per}`] = { W, H, cells: W * H, dt, stepsPerSecond: perSecond, step: r, msPerSecond: r.median * perSecond, volumeDrift: (w.volume() - before) / Math.max(1e-9, before) };
  if (per === 1) {
    // The amount kept: the same window closed (no sea), a thousand steps.
    const c = new PipesWater(W, H, 1);
    c.bed.set(w.bed);
    c.depth.set(w.depth);
    const v0 = c.volume();
    for (let i = 0; i < 1000; i++) c.step(dt);
    automata.pipesClosed = { steps: 1000, drift: (c.volume() - v0) / Math.max(1e-9, v0) };
  }
}
for (const cell of [1, 3]) {
  const W = Math.ceil(W0 / cell), H = Math.ceil(H0 / cell);
  const lb = new LbmWind(W, H, cell);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const col = window0[0] * S + x * cell, row = window0[1] * S + y * cell;
      // What stands higher than the wind's layer (3 tiles over the sea) blocks it.
      lb.solid[y * W + x] = trueRelief(col, row, seed, hills, codeAt(col, row), sea).level * LEVEL > sea * LEVEL + 3 ? 1 : 0;
    }
  const r = bench(() => lb.step(), 200);
  automata[`lbm${cell}`] = { W, H, cells: W * H, step: r, msPerSecondAt10Hz: r.median * 10, msPerSecondAt60Hz: r.median * 60 };
}
{
  const W = W0, H = H0;
  const rt = new RuleTable(W, H, 3, 1, fireRules(), seed);
  for (let i = 0; i < W * H; i += 97) rt.cells[i] = 1;
  automata.table = { W, H, step: bench(() => rt.step(), 200) };
  // The family `diffuse`: smoke from a few fires, the relief over the wind's layer a wall.
  const df = new Diffuse(W, H);
  for (let i = 0; i < W * H; i += 501) df.source[i] = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) df.wall[y * W + x] = trueRelief(window0[0] * S + x, window0[1] * S + y, seed, hills, codeAt(window0[0] * S + x, window0[1] * S + y), sea).level * LEVEL > sea * LEVEL + 3 ? 1 : 0;
  automata.diffuse = { W, H, step: bench(() => df.step(), 200) };
  // The same fire as MarkovJunior on a persistent stepper (a tick is the program once).
  const m = compileMjx(FIRE_XML, { size: [W, H, 1] });
  const grid = { X: W, Y: H, Z: 1, cells: new Uint8Array(W * H), alphabet: ['F', 'B', 'A'], log: [] as number[], epoch: 0 };
  for (let i = 0; i < W * H; i += 97) grid.cells[i] = 1;
  const stepper = new Stepper(grid, m.program, seed);
  automata.mj = { W, H, step: bench(() => stepper.tick(1), 200) };
  // The same fire in Lua: a call from the kernel for every cell, and the whole step in Lua.
  const lua = await new LuaFactory().createEngine({ openStandardLibs: true });
  await lua.doString(FIRE_LUA_CELL + '\n' + FIRE_LUA_STEP);
  const cellFn = lua.global.get('fire_cell') as (s: number, c: number, r: number) => number;
  const cells = rt.cells;
  const perCell = bench(() => {
    for (let i = 0; i < W * H; i++) cellFn(cells[i], (i * 7) % 4, (i % 100) / 100);
  }, 10);
  await lua.doString(`cells, nextc = {}, {} for i = 1, ${W * H} do cells[i] = (i % 97 == 0) and 1 or 0; nextc[i] = 0 end`);
  // The tables stay in Lua (handed through the bridge, every access would cross it): a step called with numbers only.
  await lua.doString(`function fire_tick(W, H, seed) fire_step(cells, nextc, W, H, seed); cells, nextc = nextc, cells end`);
  const tickFn = lua.global.get('fire_tick') as (W: number, H: number, seed: number) => void;
  const whole = bench(() => tickFn(W, H, seed), 20);
  automata.lua = { W, H, perCellCall: perCell, wholeStep: whole };
  lua.global.close();
}
{
  // Today's water (water.ts): a dig beside a lake of the window, the cells it moves and the ms a step while it moves.
  const W = W0, H = H0;
  const ground = new Float64Array(W * H), wet = new Uint8Array(W * H), surface = new Float64Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      ground[i] = Math.max(sea, relief.level(window0[0] * S + x, window0[1] * S + y));
      const lake = Math.hypot(x - W / 2, y - H / 2) < 14;
      wet[i] = lake ? 1 : 0;
      surface[i] = lake ? sea + 6 : ground[i];
    }
  const world: WaterWorld = {
    loaded: (c, r) => c >= 0 && r >= 0 && c < W && r < H,
    wet: (c, r) => !!wet[r * W + c],
    surface: (c, r) => surface[r * W + c],
    ground: (c, r) => ground[r * W + c],
    record: () => undefined,
    sea: () => sea,
  };
  const flow = new WaterFlow(world);
  for (let a = -4; a <= 4; a++) for (let b = 14; b <= 22; b++) flow.dig(W / 2 + a, H / 2 + b, -8);
  const ms: number[] = [], active: number[] = [];
  let steps = 0;
  while (flow.moving && steps < 3000) {
    active.push((flow as unknown as { active: Set<string> }).active.size);
    ms.push(time(() => flow.step())[1]);
    steps++;
  }
  automata.today = { steps, step: { median: median(ms), p95: p95(ms) }, totalMs: ms.reduce((a, b) => a + b, 0), active: median(active), usPerActive: (1000 * ms.reduce((a, b) => a + b, 0)) / Math.max(1, active.reduce((a, b) => a + b, 0)) };
}
out.automata = automata;
const A = automata as Record<string, any>;
log(`La finestra caricata: ${W0} × ${H0} caselle (6 × 5 luoghi, la camera più lontana), sulla costa del luogo con più dislivello. Millisecondi per passo (mediana, p95) e per secondo di gioco.`);
log('');
log('| automa | celle | ms per passo (mediana, p95) | passi al secondo | ms per secondo |');
log('|---|---:|---|---:|---:|');
for (const per of [1, 2, 4]) {
  const a = A[`pipes${per}`];
  log(`| acqua a tubi virtuali, ${per} cell${per === 1 ? 'a' : 'e'} per casella | ${a.cells.toLocaleString('it-IT')} | ${f(a.step.median, 3)}, ${f(a.step.p95, 3)} | ${a.stepsPerSecond} | ${f(a.msPerSecond, 1)} |`);
}
for (const cell of [1, 3]) {
  const a = A[`lbm${cell}`];
  log(`| vento D2Q9, una cella ogni ${cell} casell${cell === 1 ? 'a' : 'e'} | ${a.cells.toLocaleString('it-IT')} | ${f(a.step.median, 3)}, ${f(a.step.p95, 3)} | 10 (60) | ${f(a.msPerSecondAt10Hz, 1)} (${f(a.msPerSecondAt60Hz, 1)}) |`);
}
log(`| fumo che si spande (\`diffuse\`, la primitiva parametrica) | ${(W0 * H0).toLocaleString('it-IT')} | ${f(A.diffuse.step.median, 3)}, ${f(A.diffuse.step.p95, 3)} | 10 | ${f(A.diffuse.step.median * 10, 1)} |`);
log(`| fuoco a tabella (la primitiva parametrica) | ${(W0 * H0).toLocaleString('it-IT')} | ${f(A.table.step.median, 3)}, ${f(A.table.step.p95, 3)} | 10 | ${f(A.table.step.median * 10, 1)} |`);
log(`| lo stesso in MarkovJunior (\`convolution\`, \`Stepper\`) | ${(W0 * H0).toLocaleString('it-IT')} | ${f(A.mj.step.median, 3)}, ${f(A.mj.step.p95, 3)} | 10 | ${f(A.mj.step.median * 10, 1)} |`);
log(`| lo stesso in Lua, una chiamata a cella | ${(W0 * H0).toLocaleString('it-IT')} | ${f(A.lua.perCellCall.median, 1)}, ${f(A.lua.perCellCall.p95, 1)} | 10 | ${f(A.lua.perCellCall.median * 10, 0)} |`);
log(`| lo stesso in Lua, il passo intero in Lua | ${(W0 * H0).toLocaleString('it-IT')} | ${f(A.lua.wholeStep.median, 1)}, ${f(A.lua.wholeStep.p95, 1)} | 10 | ${f(A.lua.wholeStep.median * 10, 0)} |`);
log(`| l'acqua di oggi (\`water.ts\`), mentre si muove dopo uno scavo | — | ${f(A.today.step.median, 3)}, ${f(A.today.step.p95, 3)} | 100 | ${f(A.today.step.median * 100, 1)} |`);
log('');
log(`L'acqua a tubi conserva la quantità: nella stessa finestra chiusa (senza mare) dopo ${A.pipesClosed.steps} passi lo scarto è ${A.pipesClosed.drift.toExponential(1)} (relativo); con il mare aperto la finestra ha perso il ${(-100 * A.pipes1.volumeDrift).toFixed(0)} % dell'acqua dei passi misurati: i laghi del rilievo vero non sono in piano (la superficie della bozza) e scendono al mare. L'acqua di oggi: uno scavo accanto a un lago di 600 caselle su un rilievo, ${A.today.steps >= 3000 ? 'ancora in moto dopo' : 'fermo dopo'} ${A.today.steps} passi, ${Math.round(A.today.active)} caselle attive in mediana, ${f(A.today.usPerActive, 2)} µs a casella attiva per passo (i tubi: ${f((1000 * A.pipes1.step.median) / A.pipes1.cells, 3)} µs a cella).`);

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, JSON.stringify(out, null, 1));
writeFileSync(mdOut, md.join('\n') + '\n');
console.log(`\nscritti ${jsonOut} e ${mdOut}`);
process.exit(0);
