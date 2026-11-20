// The bench of the vessels (T440, lab/banco/navi/README.md): the class `vessel` at every size (`VESSEL_TILES` at `VESSEL_VPT`), the boat the
// local models write for each box (`mockVesselProgram`; at Large the seed's generic `universe/models/vessel.xml`) and any program given,
// with the kernel's checks (`checkProgram`) and what `src/mj/vessel.ts` measures: the hull at the waterline, the bow, the deck reached from
// where one boards, the helm, the areas; in tiles and in wanderers, so the boxes are measured with the wanderer beside. No calls.
//
//   npx vite-node lab/scripts/banco-navi.ts -- [--foto] [--taglie medium,large] [--programma file.xml --taglia large] [--md lab/banco/navi/misure.md]

import fs from 'node:fs';
import path from 'node:path';
import { boxOf, classOf, SIZE_TIERS, VESSEL_TILES, VESSEL_VPT, type SizeTier } from '../../src/mj/classes';
import { cartoonRender, render, sheet } from '../../src/mj/photo';
import { checkProgram } from '../../src/kernel/agents/sculptor';
import { mockVesselProgram, mockVesselShape } from '../../src/kernel/ai/mockVessel';
import { waterlineOf } from '../../src/kernel/forms';
import { measureVessel } from '../../src/mj/vessel';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const DIR = path.resolve('lab/banco/navi');
const V = classOf('vessel')!;
/** The wanderer's height in tiles (PARTS' person, lab/3d/scale.ts). */
const WANDERER = 1.5;
const NAMES: Partial<Record<SizeTier, string>> = { tiny: 'modellino', small: 'canoa', medium: 'scialuppa', large: 'barca a vela', huge: 'brigantino', gargantuan: 'galeone' };

const sizes = (opt('taglie')?.split(',') as SizeTier[] | undefined) ?? SIZE_TIERS.map((t) => t.id);
const given = opt('programma');
const rows: string[] = [];
const f = (v: number) => v.toLocaleString('it', { maximumFractionDigits: 2 });
fs.mkdirSync(DIR, { recursive: true });

for (const t of given ? [(opt('taglia') ?? 'large') as SizeTier] : sizes) {
  const box = boxOf(V, t);
  const xml = given ? fs.readFileSync(given, 'utf8') : mockVesselProgram(box, NAMES[t]);
  const t0 = performance.now();
  const c = checkProgram(xml, V, t);
  const ms = Math.round(performance.now() - t0);
  const tiles = VESSEL_TILES[t];
  const line = [`${t} (${NAMES[t] ?? ''})`, `${tiles.join(' × ')} caselle`, `${box.join(' × ')} voxel`, `${f(tiles[2] / WANDERER)} viandanti`];
  if (!c.result || !c.model) {
    console.log(`${line.join(' · ')}\n   non gira: ${c.error}`);
    rows.push(`| ${line[0]} | ${tiles.join(' × ')} | — | — | — | — | — | — | ${c.error} |`);
    continue;
  }
  const wl = waterlineOf(xml);
  const m = measureVessel(c.result.grid, c.model.program.palette, VESSEL_VPT, wl);
  const shape = given ? undefined : mockVesselShape(box);
  const deckUp = shape ? (shape.decked ? shape.deck : shape.waterline + 1) - wl : undefined;
  console.log(line.join(' · '));
  console.log(`   linea di galleggiamento ${wl} voxel (${f(wl / VESSEL_VPT)} caselle)${deckUp !== undefined ? `, il ponte ${f(deckUp / VESSEL_VPT)} caselle sopra l'acqua` : ''}`);
  console.log(`   scafo alla linea: ${f(m.length / VESSEL_VPT)} × ${f(m.width / VESSEL_VPT)} caselle (lungo ${f(m.length / Math.max(1, m.width))} volte la larghezza), prua ${Math.round(m.bow * 100)}%`);
  console.log(`   ponte dall'imbarco: ${f(m.deck / VESSEL_VPT ** 2)} caselle², il ${Math.round(m.deckOverHull * 100)}% sopra lo scafo; timone sul ponte: ${m.helmOnDeck ? 'sì' : 'no'}`);
  console.log(`   aree: ${Object.entries(m.areas).map(([k, v]) => `${k} ${v.length}`).join(', ') || '—'}`);
  console.log(`   controlli: ${c.error ?? 'passa'} (${ms} ms)`);
  rows.push(`| ${line[0]} | ${tiles.join(' × ')} | ${box.join(' × ')} | ${f(tiles[2] / WANDERER)} | ${wl} | ${f(m.length / VESSEL_VPT)} × ${f(m.width / VESSEL_VPT)} | ${Math.round(m.bow * 100)}% | ${f(m.deck / VESSEL_VPT ** 2)} (${Math.round(m.deckOverHull * 100)}%) | ${c.error ?? 'passa'} |`);
  if (args.includes('--foto')) {
    const scale = Math.max(1, Math.min(6, Math.floor(400 / Math.max(box[0], box[1]))));
    const sides = [0, 1, 2, 3].map((v) => render(c.result!.grid, c.model!.program.palette, v, cartoonRender(scale)));
    const file = `${given ? path.basename(given, '.xml') : 'offline'}-${t}.png`;
    fs.writeFileSync(path.join(DIR, file), png(sheet(sides, 1, 8, [70, 120, 170])));
    console.log(`   foto: lab/banco/navi/${file}`);
  }
}

const md = opt('md');
if (md)
  fs.writeFileSync(
    md,
    [
      '| taglia | caselle | voxel | alta (viandanti) | linea (voxel) | scafo alla linea (caselle) | prua | ponte (caselle², sopra lo scafo) | controlli |',
      '|---|---|---|---:|---:|---|---:|---|---|',
      ...rows,
      '',
    ].join('\n'),
  );
