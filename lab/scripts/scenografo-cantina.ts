// The cellar on the Scenografo's bench (T419, `docs/design/scenografo.md` § 10.4): the buildings of the seed with a cellar and the offline
// country house with its cellar (`MOCK_STRUCTURE_PROGRAM`, as the Sculptor gives it offline), furnished as the game furnishes them (the way of
// data, `furnishWithRules`, with the local models' rules: their cellar rule is the seed's shelf, rack and barrel), every seed. For each: the
// pieces in the cellar and above, what the guard refused, whether the cellar still holds, the storeys and the cellar still reached, the foot
// of its stair kept, the time; and the cellar cut under the ground, bare and furnished. No model is called.
//
//   npx vite-node lab/scripts/scenografo-cantina.ts -- [--semi 4] [--solo villetta,struttura-locanda] [--out lab/banco/scenografo/cantina]
//
// → <out>/riepilogo.md, riepilogo.json, <out>/<edificio>.png (a column per seed: the cellar bare, then furnished, cut at the ground and seen
// from the front in 3/4).

import fs from 'node:fs';
import path from 'node:path';
import { bundledFiles } from '../../src/kernel/bundle';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { MOCK_STRUCTURE_PROGRAM } from '../../src/kernel/ai/mockStructure';
import { INTERIOR_TASK } from '../../src/kernel/agents/scenographer';
import { FormCache, Forms, groundOfForm, habitableParts, InlineRunner, storeysOf, walkIn, type ModelInfo } from '../../src/kernel/forms';
import { furnishWithRules, furniturePiece, furnitureOf, interiorRooms, readRules, type InteriorRule } from '../../src/kernel/furnish';
import { interiorPlan } from '../../src/kernel/interior';
import type { Grid3 } from '../../src/mj/engine';
import { DEFAULT_RENDER, render, sheet, type Picture } from '../../src/mj/photo';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const seeds = Number(opt('semi') ?? 4);
const only = opt('solo')?.split(',');
const out = path.resolve(opt('out') ?? 'lab/banco/scenografo/cantina');

// The library: the seed's, and the country house the Sculptor gives offline, with a cellar of one tile.
const VILLA = 'villetta';
const index = JSON.parse(bundledFiles['models/index.json']!) as Record<string, ModelInfo>;
index[VILLA] = { class: 'structure', name: 'la villetta offline con la cantina', cellar: 1, seeds: 4 } as ModelInfo;
const files = { ...bundledFiles, 'models/index.json': JSON.stringify(index), [`models/${VILLA}.xml`]: MOCK_STRUCTURE_PROGRAM };
const forms = new Forms(new InlineRunner(new FormCache()));
forms.load(files);
const buildings = [VILLA, ...Object.keys(index).filter((id) => index[id]!.cellar && id.startsWith('struttura-'))].filter((id) => !only || only.includes(id));

// The rules the local models give (MockAiModels), over the catalogue the game offers.
const mock = new MockAiModels();
mock.latency = 0;
const catalogue = forms.furniture();
const rules: InteriorRule[] = readRules(JSON.parse(await mock.text({ agent: 'scenographer', task: INTERIOR_TASK, system: '', prompt: '', data: { catalogue } })), (id) => catalogue.includes(id)).rules;
console.log(`Regole offline: ${JSON.stringify(rules)}`);

const SKY: [number, number, number] = [112, 150, 84];
const n2 = (v: number) => v.toFixed(2).replace('.', ',');

/** A grid cut at a height (voxels), seen from the front. */
function cut(g: Grid3 | { X: number; Y: number; Z: number; cells: Uint8Array; alphabet: string[] }, palette: Record<string, import('../../src/mj/engine').PaletteEntry>, top: number): Picture {
  const grid: Grid3 = { X: g.X, Y: g.Y, Z: top, cells: g.cells.slice(0, g.X * g.Y * top), alphabet: g.alphabet, log: [], epoch: 0 } as Grid3;
  return render(grid, palette, 0, { ...DEFAULT_RENDER, px: 3, top: 3, front: 3 });
}

/** Rows one under the other. */
function pile(rs: Picture[]): Picture {
  const gap = 6;
  const w = Math.max(...rs.map((r) => r.w));
  const h = rs.reduce((s, r) => s + r.h, 0) + gap * (rs.length - 1);
  const data = new Uint8ClampedArray(w * h * 4).fill(240);
  let y0 = 0;
  for (const r of rs) {
    for (let y = 0; y < r.h; y++) data.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), (y0 + y) * w * 4);
    y0 += r.h + gap;
  }
  return { w, h, data };
}

interface Row {
  edificio: string;
  seme: number;
  base: number;
  cantina: number;
  soffitto: number;
  pezzi: number;
  pezziCantina: number;
  voxelCantina: number;
  mobiliCantina: string[];
  rifiutati: Record<string, number>;
  regge: boolean;
  piani: [number[], number[]];
  cantine: [number[], number[]];
  piedeLibero: boolean;
  ms: number;
}

const rows: Row[] = [];
fs.mkdirSync(out, { recursive: true });
for (const id of buildings) {
  const pics: Picture[] = [];
  const furnished: Picture[] = [];
  for (let seed = 1; seed <= Math.min(seeds, forms.seedsOf(id)); seed++) {
    const f = await forms.settled(id, seed, undefined, 600_000, { bare: true });
    if (!f?.result || !f.base) continue;
    const g = f.result.grid, pal = f.result.palette, vpt = f.vpt, base = f.base;
    const actions = forms.compiled(id)?.actions ?? [];
    const plan = interiorPlan({ grid: g, palette: pal, vpt, base, actions, seed });
    const pieces = new Map(furnitureOf(rules).flatMap((p) => {
      const piece = furniturePiece(p, forms.request(p, 1, undefined, { bare: true })!, vpt);
      return piece ? [[p, piece] as const] : [];
    }));
    const t0 = Date.now();
    const r = furnishWithRules(plan, rules, pieces, seed);
    const ms = Date.now() - t0;
    const XY = g.X * g.Y;
    const below = [...r.voxels].filter((v) => Math.floor(v / XY) < base);
    const down = (r.items ?? []).filter((x) => x.room === 'cellar');
    const names = [...new Set(down.map((x) => x.id))];
    const cellarStorey = plan.storeys.find((p) => p.cellar);
    const w0 = walkIn(g, pal, vpt, base, actions, seed), w1 = walkIn(r.grid, r.palette, vpt, base, actions, seed);
    const clear = Math.round(cellarStorey ? (() => {
      const hs: number[] = [];
      for (const i of cellarStorey.centres) {
        let z = cellarStorey.z;
        while (z < g.Z && !g.cells[i + z * XY]) z++;
        hs.push(z - cellarStorey.z);
      }
      return hs.sort((a, b) => a - b)[hs.length >> 1] ?? 0;
    })() : 0);
    const kept = cellarStorey ? [...cellarStorey.kept.keys()].filter((i) => cellarStorey.kept[i]) : [];
    const row: Row = {
      edificio: id,
      seme: seed,
      base,
      cantina: interiorRooms(plan).filter((x) => x.kind === 'cellar').reduce((s, x) => s + x.tiles, 0),
      soffitto: clear,
      pezzi: r.pieces,
      pezziCantina: down.length,
      voxelCantina: below.length,
      mobiliCantina: names,
      rifiutati: r.refused,
      regge: !!groundOfForm(r.grid, r.palette, vpt, base).hole,
      piani: [storeysOf(w0, vpt), storeysOf(w1, vpt)],
      cantine: [habitableParts(g, pal, vpt, 30, base, actions, seed).cellar, habitableParts(r.grid, r.palette, vpt, 30, base, actions, seed).cellar],
      piedeLibero: kept.length > 0 && kept.every((i) => !r.voxels.has(i + cellarStorey!.z * XY)),
      ms,
    };
    rows.push(row);
    console.log(`${id} seme ${seed}: ${row.pezziCantina} pezzi in cantina (${row.voxelCantina} voxel; ${names.join(', ') || '—'}), ${row.pezzi} in tutto, rifiutati ${JSON.stringify(r.refused)}, regge ${row.regge}, piani ${row.piani[0]} → ${row.piani[1]}, ${ms} ms`);
    pics.push(cut(g, pal, base));
    furnished.push(cut(r.grid, r.palette, base));
  }
  if (pics.length) fs.writeFileSync(path.join(out, `${id}.png`), png(pile([sheet(pics, 1, 4, SKY), sheet(furnished, 1, 4, SKY)])));
}

const table = [
  '| edificio | seme | cantina (caselle²) | soffitto (voxel) | pezzi in cantina | voxel | mobili | pezzi in tutto | rifiutati (cellar, cut, room) | regge | piani prima → dopo | cantina raggiunta | piede della scala libero | ms |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.edificio} | ${r.seme} | ${n2(r.cantina)} | ${r.soffitto} | ${r.pezziCantina} | ${r.voxelCantina} | ${r.mobiliCantina.join(', ') || '—'} | ${r.pezzi} | ${r.rifiutati.cellar}, ${r.rifiutati.cut}, ${r.rifiutati.room} | ${r.regge ? 'sì' : '**no**'} | ${r.piani[0].join(' ')} → ${r.piani[1].join(' ')} | ${r.cantine[1].length === r.cantine[0].length ? 'sì' : '**no**'} | ${r.piedeLibero ? 'sì' : '**no**'} | ${r.ms} |`,
  ),
];
const md = [
  `# La cantina sul banco dello Scenografo (T419): ${new Set(rows.map((r) => r.edificio)).size} edifici, ${seeds} semi, la via dei dati`,
  '',
  `Le regole dei modelli locali: \`${JSON.stringify(rules)}\`. Il tempo è quello dell'arredo intero (piano terra, piani di sopra, cantina e la verifica dei piani), senza le misure.`,
  '',
  ...table,
  '',
].join('\n');
fs.writeFileSync(path.join(out, 'riepilogo.md'), md);
fs.writeFileSync(path.join(out, 'riepilogo.json'), JSON.stringify({ rules, rows }, null, 1) + '\n');
console.log(md);
