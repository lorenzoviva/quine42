// The scale of the structures that grow by rules (T403, D60): the parts one lives in, measured by the kernel (`habitableParts`, the
// same as the Sculptor's checks: the storeys reached on foot, the rooms with their clear height, the doors the action `open` takes
// away) and the rise of the stairs (the steps between neighbouring places where one stands), in voxels, then in wanderers at 20, 10 and
// 5 voxels a tile. The wanderer is 30 voxels at 20 (1.5 tiles); a game's body steps up `stepOf` voxels (a fifth of a tile).
//
//   npx vite-node lab/scripts/strutture-scala.ts -- [--seme 1] [--json lab/banco/riferimento/strutture-scala.json] [--densita 16,15,14]
//
// `--densita` (T405): the densities of the table (20, 10, 5 if not said), and at each the storeys the game's body reaches on foot from
// the ground (`habitableParts` at that density: its step, its body), the doors and the rooms as the checks measure them there.

import fs from 'node:fs';
import { compileMjx, mjxIncludes, type MjxFiles } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import { partVoxels } from '../../src/mj/classes';
import type { Grid3, Vec3 } from '../../src/mj/engine';
import { habitableParts, stepOf } from '../../src/kernel/forms';
import { MOCK_STRUCTURE_PROGRAM } from '../../src/kernel/ai/mockStructure';

const args = process.argv.slice(2);
const opt = (name: string, fallback?: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
const SEED = Number(opt('seme', '1'));
const JSON_OUT = opt('json');
const DENSITIES = opt('densita')?.split(',').map(Number).filter((n) => Number.isInteger(n) && n >= 4) ?? [20, 10, 5];
const WANDERER_TILES = 1.5;

/** The structures of the photos (the ids of the lab 3D's catalogue), at the box the lab shows them at, 20 voxels a tile. */
const STRUCTURES: Array<{ id: string; name: string; xml: () => string; box: Vec3 }> = [
  { id: 'taglie:scultore-villetta-large', name: 'Villetta (risposta offline dello Scultore, T354), Grande', xml: () => MOCK_STRUCTURE_PROGRAM, box: [100, 100, 80] },
  { id: 'taglie:scultore-rocca-large', name: 'Rocca (come la scrive lo Scultore, T354), Grande', xml: () => fs.readFileSync('lab/banco/taglie/scultore-rocca.xml', 'utf8'), box: [100, 100, 80] },
  { id: 'taglie:forte-gargantuan', name: 'Forte del banco (T346), Gargantuesca a 10 × 10', xml: () => fs.readFileSync('lab/banco/taglie/forte.xml', 'utf8'), box: [200, 200, 160] },
  {
    id: 'scultori:openrouter/claude-opus-5-5/giro1/fattoria-huge',
    name: 'Fattoria di Opus 5.5 via OpenRouter (T402, giro 1, voto 8), Enorme',
    xml: () => fs.readFileSync('lab/banco/taglie/modelli/openrouter/claude-opus-5-5/giro1/fattoria-huge/programma.xml', 'utf8'),
    box: [150, 150, 120],
  },
];

/** The files of the seed's models/ a program reads (the parts, T346), as the game gives them to the compiler. */
const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));

/**
 * The rise of the steps of part-stair (its letter k, T346): between neighbouring places where one stands on a step, the height
 * differences up to half a tile, the most frequent.
 */
function stairRise(g: Grid3, vpt: number): { rise: number; n: number } {
  const XY = g.X * g.Y;
  const step = g.alphabet.indexOf('k');
  const tops = new Map<number, number[]>();
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x < g.X; x++) {
      const i = x + y * g.X;
      const zs: number[] = [];
      for (let z = 1; z < g.Z; z++) if (!g.cells[i + z * XY] && step > 0 && g.cells[i + (z - 1) * XY] === step) zs.push(z);
      tops.set(i, zs);
    }
  const count = new Map<number, number>();
  for (let y = 0; y < g.Y; y++)
    for (let x = 0; x + 1 < g.X; x++)
      for (const [nx, ny] of [[x + 1, y], [x, y + 1]]) {
        if (ny >= g.Y) continue;
        for (const a of tops.get(x + y * g.X)!)
          for (const b of tops.get(nx + ny * g.X)!) {
            const d = Math.abs(a - b);
            if (d > 0 && d <= vpt / 2) count.set(d, (count.get(d) ?? 0) + 1);
          }
      }
  let best = { rise: 0, n: 0 };
  for (const [rise, n] of count) if (n > best.n) best = { rise, n };
  return best;
}

const fmt = (v: number) => v.toLocaleString('it', { maximumFractionDigits: 2 });
const results: unknown[] = [];
const lines: string[] = [];
for (const s of STRUCTURES) {
  const xml = s.xml();
  const model = compileMjx(xml.replace(/\ssize="[^"]*"/, ''), { size: s.box, files: seedFiles(xml) });
  const t0 = performance.now();
  const r = runMjx(model, SEED, { deadline: 60_000 });
  const ms = Math.round(performance.now() - t0);
  const parts = habitableParts(r.grid, model.program.palette, 20, partVoxels(20).storey.clear, 0, model.actions, SEED);
  const storeyGaps = parts.storeys.slice(1).map((z, i) => z - parts.storeys[i]);
  const door = parts.doors.reduce((b, d) => (d.height > b.height ? d : b), { width: 0, height: 0 });
  const clear = parts.rooms.filter((r) => r.room > 0).map((r) => r.clear);
  const stair = stairRise(r.grid, 20);
  // At each density, what the game measures (T405): the storeys reached on foot with its step and its body, the least room and door.
  const at = DENSITIES.map((d) => {
    const p = habitableParts(r.grid, model.program.palette, d, partVoxels(d).storey.clear, 0, model.actions, SEED);
    return { vpt: d, step: stepOf(d), storeys: p.storeys, rooms: p.rooms.filter((x) => x.room > 0).length, doors: p.doors.length };
  });
  results.push({ id: s.id, seed: SEED, ms, box: s.box, storeys: parts.storeys, storeyGaps, door, rooms: parts.rooms, stair, at });
  for (const a of at) console.log(`  a ${a.vpt}: gradino ${a.step}, piani a piedi ${a.storeys.join(', ')}, stanze ${a.rooms}, porte ${a.doors}`);
  console.log(`${s.id}: ${ms} ms, piani ${parts.storeys.join(', ')}, porte ${parts.doors.map((d) => `${d.width}×${d.height}`).join(' ') || '—'}, alzata ${stair.rise} (${stair.n})`);
  const all: Array<[string, number]> = [
    ['porta, luce', door.height],
    ['porta, larghezza', door.width],
    ...storeyGaps.map((g, i): [string, number] => [`piano ${i + 1} → ${i + 2}, da pavimento a pavimento`, g]),
    ['stanza più alta, luce', Math.max(0, ...clear)],
    ['gradino della scala (part-stair), alzata', stair.rise],
  ];
  const rows = all.filter(([, v]) => v > 0);
  lines.push(`**${s.name}** (\`${s.id}\`, ${s.box.join(' × ')} voxel, seme ${SEED})`, '');
  lines.push(`| misura | voxel | ${DENSITIES.map((d) => `a ${d}: caselle · **viandanti**`).join(' | ')} |`, `|---|---|${DENSITIES.map(() => '---').join('|')}|`);
  for (const [label, v] of rows) lines.push(`| ${label} | ${v} | ${DENSITIES.map((d) => `${fmt(v / d)} · **${fmt(v / d / WANDERER_TILES)}**`).join(' | ')} |`);
  lines.push('', `| densità | gradino (voxel) | piani raggiunti a piedi (voxel dal suolo) | stanze | porte |`, '|---|---|---|---|---|');
  for (const a of at) lines.push(`| ${a.vpt} | ${a.step} | ${a.storeys.join(', ')} | ${a.rooms} | ${a.doors} |`);
  lines.push('');
}
lines.push(`Il corpo del gioco sale un gradino di \`stepOf\`: ${DENSITIES.map((d) => `${stepOf(d)} voxel a ${d}`).join(', ')} (un quinto di casella).`);
console.log(lines.join('\n'));
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ wandererTiles: WANDERER_TILES, densities: DENSITIES, structures: results }, null, 1) + '\n');
