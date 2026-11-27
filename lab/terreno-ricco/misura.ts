// T509 (docs/design/terreno-ricco.md): the measures of the rich ground, offline, with no calls and nothing written but --json and --md.
//
//   npx vite-node lab/terreno-ricco/misura.ts -- [--universi <cartella con gli universi>] [--solo aurora,mesa] [--json f.json] [--md f.md]
//
// 1. What the Landscaper does today and why the vegetation is thin: for the seed and for every universe of `--universi` (read from its git,
//    its plans from maps/ as the kernel asks them: nothing is written there), a kernel on the local models settles the window around the
//    start; for the start's place and for every planned place of the window, the tiles by layer, the instances of the terrains' models
//    (the rule of `place` in src/render/terrainmesh.ts: a wood one tile in two, a rock every tile), the things of the plan and the entities
//    by class, the bare ground (walkable ground tiles with nothing on them). The models of the trade (tree, bush, rock, pebble) of each
//    universe through the engine, three seeds: time, voxels, triangles as `meshVoxels` makes them and as a greedy mesher would (T523).
// 2. The undergrowth as small models reused by seed: the cover programs of lab/terreno-ricco/modelli/ (four seeds each), the instances,
//    triangles and bytes of the window at five densities, the time to scatter a place's instances, the draw calls of three ways.
//    What moves in the wind: tumbleweeds rolled by a Lua system on the wind of T484 (ADR-0255), 8 to 256 of them, the time per tick.
// 3. The roads, sidewalks and rails the universes already have as flat ground: tiles, the edges between road and sidewalk (the curb an
//    inset would draw), the shapes of the rail lines (straight, curve, end, crossing), what an aligned model would need.
//
// The plans of a universe are read as they are, with the local models a universe of the Council is not planned anew (ADR-0222): the
// window is what the universe has. The forms of everything but the trade's run as a stub (an empty voxel): the census does not need them.

import { promises as fsp, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundledFiles } from '../../src/kernel/bundle';
import { prepareUniverse } from '../../src/kernel/universes';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { runForm, type FormRequest, type FormResult, type FormRunner } from '../../src/kernel/forms';
import type { ChunkRecord, ChunkStore } from '../../src/kernel/chunks';
import type { FileMap } from '../../src/kernel/types';
import { formMeshes } from '../../src/render/formmeshes';
import { DEFAULT_NATURE } from '../../src/kernel/nature';
import type { AutomatonSpec } from '../../src/kernel/automata';
import type { PaletteEntry } from '../../src/mj/engine';
import type { VoxelGrid } from '../../src/mj/mesh';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LAND = new Set(['tree', 'bush', 'rock', 'pebble']);
const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[xs.length >> 1]! : 0);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const r1 = (x: number) => Math.round(x * 10) / 10;
const pct = (a: number, b: number) => (b ? r1((100 * a) / b) : 0);
const out: Record<string, any> = { date: new Date().toISOString().slice(0, 10), universes: [] };
const md: string[] = [];
const say = (s = '') => {
  console.log(s);
  md.push(s);
};

// --- A greedy mesher, counting only: the quads of the exposed faces merged by colour in each slice (what T523 would do) ---------------

function visibleTable(g: VoxelGrid, pal: Record<string, PaletteEntry>): Int16Array {
  const t = new Int16Array(g.alphabet.length).fill(-1);
  g.alphabet.forEach((ch, i) => {
    const e = pal[ch];
    if (i && e && !e.hidden && (e as any).value !== undefined) t[i] = i;
    else if (i && e && !e.hidden) t[i] = i;
  });
  return t;
}

/** Quads of the faces a mesh would draw (never the bottom ones at z 0, as the forms of the game), merged greedily by cell symbol. */
export function greedyQuads(g: VoxelGrid, pal: Record<string, PaletteEntry>): number {
  const { X, Y, Z, cells } = g;
  const vis = visibleTable(g, pal);
  const at = (x: number, y: number, z: number) => (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? -1 : vis[cells[x + y * X + z * X * Y]!]!);
  let quads = 0;
  const dims = [X, Y, Z];
  for (let axis = 0; axis < 3; axis++)
    for (const dir of [-1, 1]) {
      const u = (axis + 1) % 3, v = (axis + 2) % 3;
      const U = dims[u]!, V = dims[v]!, A = dims[axis]!;
      const mask = new Int16Array(U * V);
      for (let a = 0; a < A; a++) {
        if (axis === 2 && dir === -1 && a === 0) continue;
        for (let j = 0; j < V; j++)
          for (let i = 0; i < U; i++) {
            const p = [0, 0, 0];
            p[axis] = a;
            p[u] = i;
            p[v] = j;
            const c = at(p[0]!, p[1]!, p[2]!);
            p[axis] = a + dir;
            const n = at(p[0]!, p[1]!, p[2]!);
            mask[i + j * U] = c >= 0 && n < 0 ? c : -1;
          }
        for (let j = 0; j < V; j++)
          for (let i = 0; i < U; ) {
            const c = mask[i + j * U]!;
            if (c < 0) {
              i++;
              continue;
            }
            let w = 1;
            while (i + w < U && mask[i + w + j * U] === c) w++;
            let h = 1;
            grow: while (j + h < V) {
              for (let k = 0; k < w; k++) if (mask[i + k + (j + h) * U] !== c) break grow;
              h++;
            }
            for (let jj = 0; jj < h; jj++) for (let k = 0; k < w; k++) mask[i + k + (j + jj) * U] = -1;
            quads++;
            i += w;
          }
      }
    }
  return quads;
}

function voxelsOf(g: VoxelGrid, pal: Record<string, PaletteEntry>): number {
  const vis = visibleTable(g, pal);
  let n = 0;
  for (const c of g.cells) if (c && vis[c]! >= 0) n++;
  return n;
}

/** A program through the engine and the meshes of the game (`formMeshes`), a few seeds: time, voxels, triangles, greedy triangles. */
function measureProgram(req0: Omit<FormRequest, 'seed'>, seeds: number[]) {
  const rows = seeds.map((seed) => {
    const req = { ...req0, seed } as FormRequest;
    const t0 = performance.now();
    const r = runForm(req);
    const ms = performance.now() - t0;
    const m = formMeshes(r, req);
    const tris = m.body.indices.length / 3 + sum(m.limbs.map((l) => l.mesh.indices.length / 3));
    return { seed, ms, voxels: voxelsOf(r.grid, r.palette), tris, greedy: 2 * greedyQuads(r.grid, r.palette), bytes: m.body.positions.byteLength * 3 + m.body.indices.byteLength, box: [r.grid.X, r.grid.Y, r.grid.Z] };
  });
  return { ms: median(rows.map((r) => r.ms)), voxels: median(rows.map((r) => r.voxels)), tris: median(rows.map((r) => r.tris)), greedy: median(rows.map((r) => r.greedy)), bytes: median(rows.map((r) => r.bytes)), box: rows[0]!.box, rows };
}

// --- Opening a universe -------------------------------------------------------------------------------------------------------------

/** Everything but the trade's models runs as an empty voxel: the census does not need their shapes, and a structure may take seconds. */
class StubRunner implements FormRunner {
  async run(_q: FormRequest): Promise<FormResult> {
    return { grid: { X: 1, Y: 1, Z: 1, cells: new Uint8Array(1), alphabet: ['B'] }, palette: {}, actions: [], animations: [] };
  }
}

async function openUniverse(dir?: string): Promise<{ name: string; k: Kernel; files: FileMap }> {
  let files: FileMap = { ...bundledFiles };
  let chunks: ChunkStore | undefined;
  if (dir) {
    const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 }).split('\0').filter(Boolean);
    const raw: FileMap = {};
    for (const p of tracked) if (!p.startsWith('maps/') && !p.startsWith('.')) raw[p] = await fsp.readFile(path.join(dir, p), 'utf8');
    files = prepareUniverse(raw, bundledFiles).files;
    chunks = {
      async load(key) {
        const t = await fsp.readFile(path.join(dir, 'maps', `${key.replace(/[:,]/g, '_')}.json`), 'utf8').catch(() => undefined);
        return t ? (JSON.parse(t) as ChunkRecord) : undefined;
      },
      async save() {},
      async clear() {},
    };
  }
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), forms: new StubRunner(), ...(chunks ? { chunks } : {}) });
  return { name: dir ? path.basename(dir) : 'seme', k, files };
}

/**
 * Ticks until every loaded place is planned, held or out of reach (the seed plans its own on the local models, a universe of the Council
 * reads them from disk) and the set has stayed the same for a while; at most three minutes.
 */
async function settle(k: Kernel): Promise<void> {
  let last = '', still = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 180_000) {
    k.tick(1 / 60);
    await sleep(4);
    const now = [...k.chunks.values()].map((c) => `${c.key}:${c.stage}:${c.version}`).sort().join('|');
    still = now === last ? still + 1 : 0;
    last = now;
    const done = [...k.chunks.values()].every((c) => c.stage === 'planned' || c.held || c.far);
    if ((done && still >= 60) || still >= 1500) return;
  }
}

// --- 1. The census of a place -------------------------------------------------------------------------------------------------------

interface PlaceCensus {
  key: string;
  name?: string;
  layout?: string;
  stage: string;
  layers: Record<string, number>;
  codes: Record<string, number>;
  instances: number;
  instancesByModel: Record<string, number>;
  entities: Record<string, number>;
  landscaperEntities: number;
  planObjects: number;
  planGround: number;
  planStructures: number;
  walkableGround: number;
  bareGround: number;
  /** Walkable ground that is not a path, a road, a sidewalk or rails: where an undergrowth could grow. */
  coverable: number;
}

function classOfEntity(k: Kernel, id: number): string {
  const e = (c: string) => k.ecs.get(id, c) as any;
  if (e('pickup')) return 'oggetto a terra';
  if (e('rune')) return 'runa';
  if (e('structure')) return 'struttura';
  if (e('mind')) return 'persona o animale';
  const model = e('form')?.model as string | undefined;
  const cls = model ? k.forms.info(model)?.class : undefined;
  if (cls) return cls;
  const mod = e('module')?.id as string | undefined;
  const man = mod ? (k.modules.get(mod) as any)?.manifest : undefined;
  return man?.appearance?.class ?? (e('pickup') ? 'oggetto a terra' : 'altro');
}

function censusOf(k: Kernel, ch: any): PlaceCensus {
  const S = k.config.chunkSize;
  const X0 = ch.cx * S, Z0 = ch.cy * S;
  const layers: Record<string, number> = {}, codes: Record<string, number> = {}, byModel: Record<string, number> = {};
  let instances = 0;
  const groundTiles = new Set<number>();
  let coverable = 0;
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const code = ch.tiles[r * S + c] as string;
      const t = k.palette[code];
      const layer = t?.layer ?? '?';
      layers[layer] = (layers[layer] ?? 0) + 1;
      codes[code] = (codes[code] ?? 0) + 1;
      const x = X0 + c, z = Z0 + r;
      // The rule of `place` (src/render/terrainmesh.ts): a wood one tile in two (trees are two tiles wide), a rock every tile.
      if (t?.model && ((layer === 'vegetation' && (x + z) % 2 === 0) || layer === 'rock')) {
        instances++;
        byModel[t.model] = (byModel[t.model] ?? 0) + 1;
      }
      if (layer === 'ground' && t?.cross !== 'none' && !t?.solid) {
        groundTiles.add(r * S + c);
        if (code !== 'p' && !ROADISH.test(t?.name ?? '')) coverable++;
      }
    }
  const entities: Record<string, number> = {};
  let landscaper = 0;
  const covered = new Set<number>();
  for (const id of k.ecs.query('chunk')) {
    if ((k.ecs.get(id, 'chunk') as any)?.key !== ch.key) continue;
    const cls = classOfEntity(k, id);
    entities[cls] = (entities[cls] ?? 0) + 1;
    if (LAND.has(cls)) landscaper++;
    const p = k.ecs.get(id, 'pos') as { x: number; y: number } | undefined;
    if (p) {
      const { ox, oy } = k.offset();
      const c = Math.floor(p.x + ox) - X0, r = Math.floor(p.y + oy) - Z0;
      if (c >= 0 && r >= 0 && c < S && r < S) covered.add(r * S + c);
    }
  }
  let bare = 0;
  for (const i of groundTiles) if (!covered.has(i)) bare++;
  return {
    key: ch.key,
    name: ch.place?.name,
    layout: ch.plan?.layout,
    stage: ch.stage,
    layers,
    codes,
    instances,
    instancesByModel: byModel,
    entities,
    landscaperEntities: landscaper,
    planObjects: ch.plan?.objects?.length ?? 0,
    planGround: ch.plan?.ground?.length ?? 0,
    planStructures: ch.plan?.structures?.length ?? 0,
    walkableGround: groundTiles.size,
    bareGround: bare,
    coverable,
  };
}

// --- 3. Roads, sidewalks and rails -------------------------------------------------------------------------------------------------

const ROADISH = /strad|asfalt|marciapied|binar|parchegg|pista|selciat|lastric|carreggiat|rotai|ferrovi|banchin/i;

function roadsOf(k: Kernel, places: any[]) {
  const S = k.config.chunkSize;
  const tile = new Map<string, string>();
  for (const ch of places) for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) tile.set(`${ch.cx * S + c},${ch.cy * S + r}`, ch.tiles[r * S + c]);
  const codes = Object.entries(k.palette).filter(([, t]) => ROADISH.test(t.name ?? '')).map(([code, t]) => ({ code, name: t.name, layer: t.layer, color: t.color, speed: t.speed }));
  const counts: Record<string, number> = {};
  for (const v of tile.values()) counts[v] = (counts[v] ?? 0) + 1;
  // Edges between two road-ish codes that differ (a road beside its sidewalk: where an inset would draw a curb), and road-ish beside other ground.
  const edges: Record<string, number> = {};
  const rails = codes.filter((c) => /binar|rotai|ferrovi/i.test(c.name));
  const shapes: Record<string, Record<string, number>> = {};
  for (const [key, code] of tile) {
    const [x, y] = key.split(',').map(Number) as [number, number];
    for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
      const n = tile.get(`${x + dx},${y + dy}`);
      if (!n || n === code) continue;
      const a = k.palette[code], b = k.palette[n];
      if (!a || !b) continue;
      if (!ROADISH.test(a.name ?? '') && !ROADISH.test(b.name ?? '')) continue;
      const pair = [`${code} ${a.name}`, `${n} ${b.name}`].sort().join(' | ');
      edges[pair] = (edges[pair] ?? 0) + 1;
    }
    if (rails.some((r) => r.code === code)) {
      const same = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => tile.get(`${x + dx!},${y + dy!}`) === code);
      const n = same.filter(Boolean).length;
      const shape = n === 0 ? 'isolato' : n === 1 ? 'fine' : n === 2 ? ((same[0] && same[1]) || (same[2] && same[3]) ? 'dritto' : 'curva') : n === 3 ? 'a T' : 'incrocio o binario largo';
      (shapes[code] ??= {})[shape] = (shapes[code]![shape] ?? 0) + 1;
    }
  }
  return { codes: codes.map((c) => ({ ...c, tiles: counts[c.code] ?? 0 })), edges: Object.entries(edges).sort((a, b) => b[1] - a[1]).slice(0, 10), rails: shapes, tilesInWindow: tile.size };
}

// --- The run --------------------------------------------------------------------------------------------------------------------------

const only = opt('solo')?.split(',');
const root = opt('universi');
const dirs: Array<string | undefined> = [undefined];
if (root) for (const n of readdirSync(root).sort()) if (!n.startsWith('.') && existsSync(path.join(root, n, 'universe.json')) && (!only || only.includes(n))) dirs.push(path.join(root, n));

say('# Il terreno ricco: le misure (T509)');
say();
say(`Data ${out.date}; Node ${process.version}; universi ${root ? `di \`${root}\`` : 'solo il seme'} (letti dal loro git, i piani da maps/, niente scritto).`);
for (const dir of dirs) {
  const t0 = performance.now();
  const { name, k } = await openUniverse(dir);
  await settle(k);
  const S = k.config.chunkSize;
  const pc = k.wandererCarpet();
  const start = k.chunks.get(`${Math.floor(pc.x / S)},${Math.floor(pc.y / S)}`);
  const startCensus = start?.stage === 'planned' ? censusOf(k, start) : undefined;
  // The start's window, then three more spots three places away (the wanderer there, the carpet still): every planned place once.
  const seen = new Map<string, { census: PlaceCensus; chunk: { cx: number; cy: number; tiles: string } }>();
  const take = () => {
    for (const c of k.chunks.values()) if (c.stage === 'planned' && !seen.has(c.key)) seen.set(c.key, { census: censusOf(k, c), chunk: { cx: c.cx, cy: c.cy, tiles: c.tiles } });
  };
  take();
  const pcx = Math.floor(pc.x / S), pcy = Math.floor(pc.y / S);
  for (const [dx, dy] of [[3, 0], [0, 3], [-3, -3]] as const) {
    const cp = k.carpet()!;
    cp.active = false;
    Object.assign(k.wandererPos(), { x: 0, y: 0 });
    cp.ox = (pcx + dx) * S + S / 2;
    cp.oy = (pcy + dy) * S + S / 2;
    await settle(k);
    take();
  }
  const places = [...seen.values()].map((s) => s.census);
  const planned = [...seen.values()].map((s) => s.chunk);
  const tiles = S * S;
  const tot = (f: (p: PlaceCensus) => number) => sum(places.map(f));
  const layersAll: Record<string, number> = {};
  for (const p of places) for (const [l, n] of Object.entries(p.layers)) layersAll[l] = (layersAll[l] ?? 0) + n;
  const entAll: Record<string, number> = {};
  for (const p of places) for (const [l, n] of Object.entries(p.entities)) entAll[l] = (entAll[l] ?? 0) + n;
  // The trade's models of the universe, and the terrains' models.
  const index = JSON.parse(k.files['models/index.json'] ?? '{}') as Record<string, { class?: string; size?: string; score?: number }>;
  const terrainModels = Object.entries(k.palette).filter(([, t]) => t.model).map(([code, t]) => ({ code, name: t.name, layer: t.layer, model: t.model! }));
  const trade = Object.entries(index).filter(([id, e]) => LAND.has(e.class ?? '') && !id.startsWith('corona-'));
  const models: any[] = [];
  for (const [id, e] of trade) {
    const req = k.forms.request(id, 1);
    if (!req) continue;
    const { seed: _s, ...rest } = req;
    try {
      const m = measureProgram(rest, [1, 2, 3]);
      models.push({ id, class: e.class, size: e.size, score: e.score, terrain: terrainModels.filter((t) => t.model === id).map((t) => t.code).join(''), ...m, rows: undefined });
    } catch (err) {
      models.push({ id, class: e.class, error: (err as Error).message });
    }
  }
  const roads = roadsOf(k, planned);
  const u = {
    name,
    theme: k.config.name,
    relief: k.nature().relief ?? 'hills',
    window: { places: k.chunks.size, planned: planned.length, spots: 4 },
    start: startCensus,
    totals: {
      tiles: planned.length * tiles,
      layers: layersAll,
      instances: tot((p) => p.instances),
      entities: entAll,
      landscaperEntities: tot((p) => p.landscaperEntities),
      planObjects: tot((p) => p.planObjects),
      planGround: tot((p) => p.planGround),
      walkableGround: tot((p) => p.walkableGround),
      bareGround: tot((p) => p.bareGround),
      coverable: tot((p) => p.coverable),
    },
    terrainModels,
    models,
    roads,
    ms: Math.round(performance.now() - t0),
  };
  out.universes.push(u);
  const T = u.totals;
  say();
  say(`## ${name}${name !== u.theme ? ` (universe.json: ${u.theme})` : ''} — rilievo ${u.relief}`);
  say();
  say(`Quattro finestre (la partenza e tre posti a tre luoghi): ${u.window.planned} luoghi pianificati (${T.tiles} caselle). Partenza: ${startCensus ? `${startCensus.key} «${startCensus.name ?? '—'}» (${startCensus.layout ?? '—'})` : '—'}.`);
  say();
  say(`- caselle per strato: ${Object.entries(T.layers).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} ${pct(n, T.tiles)} %`).join(', ')}`);
  say(`- istanze dei modelli dei terreni: ${T.instances} (${r1(T.instances / Math.max(1, planned.length))} a luogo, ${pct(T.instances, T.tiles)} % delle caselle)`);
  say(`- entità per classe: ${Object.entries(T.entities).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} ${n}`).join(', ') || 'nessuna'}; del Paesaggista ${T.landscaperEntities}`);
  say(`- cose del piano (objects) ${r1(T.planObjects / Math.max(1, planned.length))} a luogo, oggetti a terra ${r1(T.planGround / Math.max(1, planned.length))} a luogo`);
  say(`- terra che si cammina (strato ground): ${T.walkableGround} caselle, nuda ${T.bareGround} (${pct(T.bareGround, T.tiles)} % del luogo, ${pct(T.bareGround, T.walkableGround)} % della terra); senza sentieri, strade e binari ${T.coverable} (${pct(T.coverable, T.tiles)} %)`);
  if (startCensus) say(`- il luogo della partenza: ${Object.entries(startCensus.codes).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} «${k.palette[c]?.name ?? '?'}» ${n}`).join(', ')}; ${startCensus.instances} istanze, ${Object.values(startCensus.entities).reduce((a, b) => a + b, 0)} entità, nuda ${pct(startCensus.bareGround, tiles)} %`);
  say(`- modelli dei terreni: ${terrainModels.map((t) => `${t.code} «${t.name}» → ${t.model}`).join(', ') || 'nessuno'}`);
  say();
  say('| modello del Paesaggista | classe | terreno | voto | scatola | ms (seme 1-3) | voxel | triangoli | triangoli fusi (T523) |');
  say('|---|---|---|---:|---|---:|---:|---:|---:|');
  for (const m of models) say(m.error ? `| ${m.id} | ${m.class} | | | errore: ${m.error} | | | | |` : `| ${m.id} | ${m.class} | ${m.terrain || ''} | ${m.score ?? ''} | ${m.box.join('×')} | ${r1(m.ms)} | ${m.voxels} | ${m.tris} | ${m.greedy} |`);
  if (roads.codes.length) {
    say();
    say(`Strade e binari: ${roads.codes.map((c) => `${c.code} «${c.name}» (${c.layer}, ${c.color}) ${c.tiles}`).join(', ')}; bordi: ${roads.edges.map(([p, n]) => `${p} ${n}`).join('; ') || 'nessuno'}; forme dei binari: ${Object.entries(roads.rails).map(([c, s]) => `${c}: ${Object.entries(s).map(([a, n]) => `${a} ${n}`).join(', ')}`).join('; ') || 'nessun binario nella finestra'}.`);
  }

}

// --- 2. The undergrowth ------------------------------------------------------------------------------------------------------------

const coverDir = path.resolve('lab/terreno-ricco/modelli');
const covers: any[] = [];
const coverClass: Record<string, [number, number, number]> = {};
for (const f of readdirSync(coverDir).filter((x) => x.endsWith('.xml')).sort()) {
  const xml = readFileSync(path.join(coverDir, f), 'utf8');
  const m = measureProgram({ xml, vpt: 20, sway: true, model: f.replace('.xml', '') }, [1, 2, 3, 4]);
  covers.push({ id: f.replace('.xml', ''), ...m, rows: undefined });
  coverClass[f] = m.box as [number, number, number];
}
out.covers = covers;
say();
say('## Il sottobosco: i programmi del laboratorio');
say();
say('| programma | scatola (voxel) | ms (4 semi) | voxel | triangoli | triangoli fusi (T523) | byte della mesh |');
say('|---|---|---:|---:|---:|---:|---:|');
for (const c of covers) say(`| ${c.id} | ${c.box.join('×')} | ${r1(c.ms)} | ${c.voxels} | ${c.tris} | ${c.greedy} | ${c.bytes} |`);

// Density scenarios on the browser's window (35 places, T459 § 1.4), from the walkable ground the universes have on average.
const unis = out.universes as any[];
const groundShare = sum(unis.map((u) => u.totals.coverable)) / Math.max(1, sum(unis.map((u) => u.totals.tiles)));
const WINDOW = 35;
const groundPerWindow = Math.round(groundShare * WINDOW * 18 * 18);
const mix = covers.filter((c) => ['ciuffo-erba', 'foglie-secche', 'sassolini', 'arbusto'].includes(c.id));
const mixTris = mix.length ? sum(mix.map((c) => c.tris)) / mix.length : 0;
const mixGreedy = mix.length ? sum(mix.map((c) => c.greedy)) / mix.length : 0;
const densities = [0.25, 0.5, 1, 2, 4];
out.scenarios = densities.map((d) => {
  const n = Math.round(groundPerWindow * d);
  return { perTile: d, instances: n, tris: Math.round(n * mixTris), greedyTris: Math.round(n * mixGreedy), matrixBytes: n * 64 };
});
say();
say(`Scenari sulla finestra del browser (${WINDOW} luoghi; la terra che si cammina senza sentieri, strade e binari è il ${r1(groundShare * 100)} % delle caselle negli universi misurati: ${groundPerWindow} caselle), il miscuglio ciuffo, foglie, sassolini, arbusto (${Math.round(mixTris)} triangoli in media, ${Math.round(mixGreedy)} fusi):`);
say();
say('| istanze a casella | istanze | triangoli | triangoli fusi (T523) | matrici delle istanze |');
say('|---:|---:|---:|---:|---:|');
for (const s of out.scenarios) say(`| ${s.perTile} | ${s.instances} | ${(s.tris / 1e6).toFixed(2)} M | ${(s.greedyTris / 1e6).toFixed(2)} M | ${(s.matrixBytes / 2 ** 20).toFixed(2)} MB |`);

// The time to scatter a place's instances (the rule a renderer or the terrain's worker would follow, as `place` does for trees).
function hash32(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
function scatter(S: number, cx: number, cy: number, perTile: number, kinds: number): Float32Array {
  const m: number[] = [];
  for (let r = 0; r < S; r++)
    for (let c = 0; c < S; c++) {
      const x = cx * S + c, z = cy * S + r;
      const h = hash32(x, z, 911);
      const n = Math.floor(perTile) + ((h & 1023) / 1024 < perTile % 1 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const q = hash32(x, z, 913 + i);
        const yaw = ((q >>> 7) % 628) / 100, s = 0.8 + ((q >>> 13) % 40) / 100;
        const px = x + 0.1 + ((q & 255) / 255) * 0.8, pz = z + 0.1 + (((q >>> 8) & 255) / 255) * 0.8;
        const cs = Math.cos(yaw) * s, sn = Math.sin(yaw) * s;
        m.push(cs, 0, -sn, 0, 0, s, 0, 0, sn, 0, cs, 0, px, 0, pz, (q >>> 20) % kinds);
      }
    }
  return new Float32Array(m);
}
const scatterMs = densities.map((d) => {
  const t: number[] = [];
  for (let i = 0; i < 40; i++) {
    const t0 = performance.now();
    scatter(18, i, -i, d, 4 * 4);
    t.push(performance.now() - t0);
  }
  return { perTile: d, ms: median(t) };
});
out.scatterMs = scatterMs;
say();
say(`Spargere le istanze di un luogo (una regola di hash come \`place\`, posizione, verso, scala, quale dei 16 modelli e semi): ${scatterMs.map((s) => `${s.perTile} a casella ${s.ms.toFixed(2)} ms`).join(', ')}.`);
const forms = 4 * 4;
say(`Draw call a passata del sottobosco sulla finestra (4 programmi × 4 semi = ${forms} forme): una InstancedMesh per forma e per luogo ${forms * WINDOW} (oggi l'intera scena ne fa 165, T459 § 1.4); una per forma sulla finestra ${forms}; una mesh fusa per luogo ${WINDOW} (i vertici ripetuti a ogni istanza).`);

// --- What the wind moves: tumbleweeds rolled by a Lua system ------------------------------------------------------------------------

const ROLL_LUA = `-- The wind rolls what is light and dry (T509, lab): every entity with a \`drift\` goes where the world's wind blows, as fast as it is
-- strong times its \`k\`, and stops against what is solid.
local M = {}
function M.update(dt)
  ecs.each("drift, pos, body", function(id, d, p, b)
    local w = world.wind(p.x, p.y)
    if not w or w.speed < 0.05 then return end
    local k = (d.k or 1) * 2.5
    local nx, ny = p.x + w.vx * k * dt, p.y + w.vy * k * dt
    if world.free(nx, p.y, b.r, p.z) then p.x = nx end
    if world.free(p.x, ny, b.r, p.z) then p.y = ny end
  end)
end
return M
`;
async function rolling(n: number, withSystem: boolean): Promise<{ msPerTick: number; moved: number; tsMsPerTick: number }> {
  const cfg = JSON.parse(bundledFiles['universe.json']!);
  const automata: AutomatonSpec[] = [{ id: 'wind', family: 'wind', cell: 1, hz: 10, prevailing: [0.075, 0.02], layerHeight: 32 } as AutomatonSpec];
  const files: FileMap = {
    ...bundledFiles,
    'universe.json': JSON.stringify({ ...cfg, nature: { ...DEFAULT_NATURE, automata } }, null, 2),
    ...(withSystem
      ? {
          'modules/sys.rotolanti/manifest.json': JSON.stringify({ id: 'sys.rotolanti', name: 'Rotolanti', kind: 'system', version: '0.1.0', logic: 'logic.lua', order: 26 }),
          'modules/sys.rotolanti/logic.lua': ROLL_LUA,
        }
      : {}),
  };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), forms: new StubRunner() });
  for (let i = 0; i < 240 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await sleep(5);
  }
  const ids: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / Math.max(1, n)) * Math.PI * 2, rr = 2 + (i % 9);
    ids.push(k.ecs.spawn({ pos: { x: Math.cos(a) * rr, y: Math.sin(a) * rr }, body: { r: 0.3, solid: false, pushable: false, mass: 0.2, friction: 0.2 }, drift: { k: 1 }, glyph: { ch: '*', color: '#c2a06a' } }));
  }
  const start = ids.map((id) => ({ ...(k.ecs.get(id, 'pos') as { x: number; y: number }) }));
  for (let i = 0; i < 120; i++) k.tick(1 / 60);
  const t: number[] = [];
  for (let i = 0; i < 600; i++) {
    const t0 = performance.now();
    k.tick(1 / 60);
    t.push(performance.now() - t0);
  }
  const moved = median(ids.map((id, i) => {
    const p = k.ecs.get(id, 'pos') as { x: number; y: number };
    return Math.hypot(p.x - start[i]!.x, p.y - start[i]!.y);
  }));
  // The same work in the kernel's TypeScript (what a `drift` of the manifest's physics would cost): the wind, two free checks, a step.
  const free = (k as any).free.bind(k) as (x: number, y: number, r: number) => boolean;
  const tt: number[] = [];
  for (let i = 0; i < 600; i++) {
    const t0 = performance.now();
    for (const id of ids) {
      const p = k.ecs.get(id, 'pos') as { x: number; y: number };
      const w = k.worldWind(p.x, p.y);
      if (!w || w.speed < 0.05) continue;
      const nx = p.x + w.vx * 2.5 / 60, ny = p.y + w.vy * 2.5 / 60;
      if (free(nx, p.y, 0.3)) p.x = nx;
      if (free(p.x, ny, 0.3)) p.y = ny;
    }
    tt.push(performance.now() - t0);
  }

  return { msPerTick: sum(t) / t.length, moved, tsMsPerTick: sum(tt) / tt.length };
}
const roll: any[] = [];
for (const n of [8, 32, 128, 256]) {
  const without = await rolling(n, false);
  const w = await rolling(n, true);
  roll.push({ n, msPerTick: w.msPerTick, without: without.msPerTick, extra: w.msPerTick - without.msPerTick, moved: w.moved, ts: without.tsMsPerTick });
}
out.tumbleweeds = { roll };
say();
say(`Cespugli rotolanti mossi da un sistema Lua sul vento del mondo (T484, prevalente 0,075 · 0,02, al più 0,08), il tick con le stesse entità con e senza il sistema: ${roll.map((r) => `${r.n} rotolanti +${r.extra.toFixed(3)} ms a tick in Lua (${r.moved.toFixed(1)} caselle in 12 s), lo stesso lavoro in TypeScript ${r.ts.toFixed(3)} ms`).join('; ')}.`);

if (opt('json')) writeFileSync(opt('json')!, JSON.stringify(out, null, 1));
if (opt('md')) writeFileSync(opt('md')!, md.join('\n') + '\n');
process.exit(0);
