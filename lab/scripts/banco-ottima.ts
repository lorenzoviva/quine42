// The bench of the reference of «done well» (T371, D53; lab/banco/riferimento/ottima/README.md): the author's fort measured as the
// standard (`--riferimento`: the traits of three seeds, the hash of the file, the four sides at cartoon, the views in text the Sculptor
// would see), and every fort the Sculptors wrote on the bench of the sizes, with those of the bench itself, held against it with the scale
// of `lab/banco/riferimento/ottima.ts`: a number out of 10 and every item beside the reference's. No model is called: cost in dollars zero.
//
//   npx vite-node lab/scripts/banco-ottima.ts -- --riferimento [--versione v1] [--semi 1,2,3]          # the author's fort: forte-<v>.json, .png, -viste.txt (8 s a seed)
//   npx vite-node lab/scripts/banco-ottima.ts -- [--solo argon-giro2,rocca] [--semi 1,2,3] [--taglia gargantuan] [--json f] [--tabella f]

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { cartoonRender, render, sheet } from '../../src/mj/photo';
import type { Vec3 } from '../../src/mj/engine';
import { compileMjx, mjxIncludes, type MjxFiles } from '../../src/mj/model';
import { runMjx } from '../../src/mj/run';
import { planDistance, sectionHeights, viewsText } from '../../src/mj/views';
import { SIZE_TIERS, structureVoxels, classOf, type SizeTier } from '../../src/mj/classes';
import { vptOf } from '../../src/kernel/forms';
import { MOCK_STRUCTURE_PROGRAM } from '../../src/kernel/ai/mockStructure';
import { fortTraits, meanTraits, REFERENCE_DIR, REFERENCE_FILE, REFERENCE_VERSION, REFERENCE_VPT, referencePath, scoreHead, scoreOf, scoreRow, sha256, type FortTraits, type Reference } from '../banco/riferimento/ottima';
import { png } from './png';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const SEEDS = (opt('semi') ?? '1,2,3').split(',').map(Number);
const STRUCTURE = classOf('structure')!;

/** The files of the seed's models/ a program reads (the parts, T346), as the game gives them to the compiler. */
const seedFiles = (xml: string): MjxFiles => mjxIncludes(xml, (f) => (fs.existsSync(`universe/models/${f}`) ? fs.readFileSync(`universe/models/${f}`, 'utf8') : undefined));

interface Run {
  seed: number;
  ms: number;
  traits: FortTraits;
}

/** A program at a box and a density, at some seeds: the traits of each, their mean, how much the plans differ. */
function measure(xml: string, box: Vec3 | undefined, vpt: number, seeds: number[], deadline = 60_000): { runs: Run[]; traits: FortTraits; variety: number; box: Vec3; grids: ReturnType<typeof runMjx>[]; palette: ReturnType<typeof compileMjx>['program']['palette']; actions: ReturnType<typeof compileMjx>['actions'] } {
  const model = compileMjx(xml, { ...(box ? { size: box } : {}), files: seedFiles(xml) });
  const runs: Run[] = [];
  const grids: ReturnType<typeof runMjx>[] = [];
  for (const seed of seeds) {
    const t0 = performance.now();
    const r = runMjx(model, seed, { deadline });
    const ms = Math.round(performance.now() - t0);
    if (!r.finished) console.log(`   seme ${seed}: non finisce in ${deadline} ms`);
    grids.push(r);
    runs.push({ seed, ms, traits: fortTraits(r.grid, model.program.palette, vpt, model.actions, seed) });
  }
  const d: number[] = [];
  grids.forEach((a, i) => grids.slice(i + 1).forEach((b) => d.push(planDistance(a.grid, b.grid, model.program.palette))));
  const g = grids[0].grid;
  return { runs, traits: meanTraits(runs.map((r) => r.traits)), variety: d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0, box: [g.X, g.Y, g.Z], grids, palette: model.program.palette, actions: model.actions };
}

/** The author's fort as the reference: measured, photographed, shown in text, saved under its version. */
function reference(): void {
  const version = opt('versione') ?? REFERENCE_VERSION;
  const xml = fs.readFileSync(REFERENCE_FILE, 'utf8');
  fs.mkdirSync(REFERENCE_DIR, { recursive: true });
  console.log(`il forte dell'autore (${REFERENCE_FILE}, ${version}) a ${REFERENCE_VPT} voxel per casella, semi ${SEEDS.join(', ')}`);
  const m = measure(xml, undefined, REFERENCE_VPT, SEEDS, 600_000);
  for (const r of m.runs) console.log(`   seme ${r.seed}: ${r.ms} ms · ${JSON.stringify(r.traits)}`);
  let commit: string | undefined;
  try {
    commit = execSync(`git log -1 --format=%h -- "${REFERENCE_FILE}"`, { encoding: 'utf8' }).trim() || undefined;
  } catch {
    commit = undefined;
  }
  const ref: Reference = { version, file: REFERENCE_FILE, sha256: sha256(xml), ...(commit ? { commit } : {}), date: new Date().toISOString().slice(0, 10), vpt: REFERENCE_VPT, box: m.box, seeds: m.runs, traits: m.traits, variety: Math.round(m.variety * 1000) / 1000 };
  fs.writeFileSync(referencePath(version), JSON.stringify(ref, null, 1) + '\n');
  console.log(`scritto ${referencePath(version)} (varietà fra i semi ${ref.variety})`);
  // The four sides at cartoon, a pixel a voxel (500 wide each), the first seed.
  const g = m.grids[0].grid;
  const lati = [0, 1, 2, 3].map((v) => render(g, m.palette, v, cartoonRender(1)));
  fs.writeFileSync(path.join(REFERENCE_DIR, `forte-${version}.png`), png(sheet(lati, 1, 8, [112, 150, 84])));
  // What the Sculptor would see of it (the views in text at the kernel's width: a character a tile at 10 voxels a tile), the first seed,
  // with cuts a third of the way up the walls' walk, the keep's second floor and the towers' terrace.
  const views = viewsText(g, m.palette, `Il forte dell'autore ${version}, seme ${SEEDS[0]}`, { width: 50, sections: sectionHeights(g, 24) });
  fs.writeFileSync(path.join(REFERENCE_DIR, `forte-${version}-viste.txt`), views + '\n');
  console.log(`scritti forte-${version}.png e forte-${version}-viste.txt (${Math.round(views.length / 3.26)} token stimati)`);
  const self = scoreOf(m.traits, m.traits);
  console.log(`contro sé stesso: ${self.total}/10`);
}

/** The forts to judge: the Sculptors' on the bench of the sizes (the Artist's vote beside), and the bench's own. */
const FORTS: Array<{ id: string; who: string; file?: string; xml?: string; taglia?: SizeTier; box?: Vec3; vpt?: number; vote?: number }> = [
  { id: 'argon-giro2', who: 'Argon, T355 giro2 (voto 9)', file: 'lab/banco/taglie/gemini/giro2/forte-huge/programma.xml', taglia: 'huge', vote: 9 },
  { id: 'argon-giro3', who: 'Argon, T355 giro3 (voto 7)', file: 'lab/banco/taglie/gemini/giro3/forte-huge/programma.xml', taglia: 'huge', vote: 7 },
  { id: 'carbon-giro2', who: 'Carbon, T391 giro2 (voto 9)', file: 'lab/banco/taglie/modelli/gemini-4-carbon/giro2/forte-huge/programma.xml', taglia: 'huge', vote: 9 },
  { id: 'carbon-giro3', who: 'Carbon, T391 giro3 (voto 7)', file: 'lab/banco/taglie/modelli/gemini-4-carbon/giro3/forte-huge/programma.xml', taglia: 'huge', vote: 7 },
  { id: 'carbon-giro1-grande', who: 'Carbon, T391 giro1, Grande (voto 8)', file: 'lab/banco/taglie/modelli/gemini-4-carbon/giro1/forte-large/programma.xml', taglia: 'large', vote: 8 },
  { id: 'hydrogen-giro3-grande', who: 'Hydrogen, T391 giro3, Grande (voto 7)', file: 'lab/banco/taglie/modelli/gemini-4-hydrogen/giro3/forte-large/programma.xml', taglia: 'large', vote: 7 },
  { id: 'opus-giro1', who: 'Opus 5.5, T392 giro1 (voto 9)', file: 'lab/banco/taglie/modelli/claude-opus-5-5/giro1/forte-huge/programma.xml', taglia: 'huge', vote: 9 },
  { id: 'opus-giro2', who: 'Opus 5.5, T392 giro2 (voto 9)', file: 'lab/banco/taglie/modelli/claude-opus-5-5/giro2/forte-huge/programma.xml', taglia: 'huge', vote: 9 },
  { id: 'opus-openrouter-giro1', who: 'Opus 5.5 via OpenRouter, T402 giro1 (voto 6)', file: 'lab/banco/taglie/modelli/openrouter/claude-opus-5-5/giro1/forte-huge/programma.xml', taglia: 'huge', vote: 6 },
  { id: 'sonnet-giro1', who: 'Sonnet 5.5, T392 giro1 (voto 9)', file: 'lab/banco/taglie/modelli/claude-sonnet-5-5/giro1/forte-huge/programma.xml', taglia: 'huge', vote: 9 },
  { id: 'fable-giro2', who: 'Fable 5.1, T392 giro2 (voto 8)', file: 'lab/banco/taglie/modelli/claude-fable-5-1/giro2/forte-huge/programma.xml', taglia: 'huge', vote: 8 },
  { id: 'forte-taglie', who: 'il forte del banco delle taglie (T346, a mano)', file: 'lab/banco/taglie/forte.xml', taglia: 'huge' },
  { id: 'rocca', who: 'la rocca scritta come lo Scultore (T354, a mano)', file: 'lab/banco/taglie/scultore-rocca.xml', taglia: 'huge' },
  { id: 'forte-pezzi', who: 'il forte grande di T339 (a mano, il riferimento di prima)', file: 'lab/banco/pezzi/forte.xml', box: [384, 384, 96], vpt: 12 },
  { id: 'rocca-cantiere', who: 'la rocca di frontiera del cantiere (T181, a mano)', file: 'lab/banco/riferimento/forte.xml', box: [120, 120, 96], vpt: 16 },
  { id: 'villetta', who: 'la villetta, la risposta offline (T354): non un forte', xml: MOCK_STRUCTURE_PROGRAM, taglia: 'huge' },
];

function judge(): void {
  const ref = JSON.parse(fs.readFileSync(referencePath(), 'utf8')) as Reference;
  if (ref.sha256 !== sha256(fs.readFileSync(REFERENCE_FILE, 'utf8'))) console.log(`attenzione: ${REFERENCE_FILE} non è più il forte di ${ref.version}: rifai il riferimento con --riferimento --versione <nuova>`);
  const solo = opt('solo')?.split(',');
  const taglia = opt('taglia') as SizeTier | undefined;
  const out: Record<string, unknown> = {};
  const rows: string[] = [];
  console.log(`il riferimento: il forte dell'autore ${ref.version} (${ref.date}), ${ref.box.join(' × ')} a ${ref.vpt} voxel per casella, ${ref.seeds.length} semi; varietà ${ref.variety}`);
  for (const f of FORTS.filter((x) => !solo || solo.includes(x.id))) {
    const xml = f.xml ?? fs.readFileSync(f.file!, 'utf8');
    const t = taglia ?? f.taglia;
    // A size is the box the game gives a structure that grows by rules, at the density of its entry (T405, ADR-0209: the same voxels
    // as at 20, at 16 a tile).
    const box: Vec3 | undefined = t ? structureVoxels(STRUCTURE, t) : f.box;
    const vpt = t ? vptOf({ class: 'structure', size: t }) : (f.vpt ?? 20);
    const label = t ? `${SIZE_TIERS.find((s) => s.id === t)!.name}, ${box!.join(' × ')}` : `${box!.join(' × ')} a ${vpt}`;
    const t0 = performance.now();
    let m: ReturnType<typeof measure>;
    try {
      m = measure(xml.replace(/\ssize="[^"]*"/, ''), box, vpt, SEEDS);
    } catch (e) {
      console.log(`${f.id} (${f.who}): ${(e as Error).message}`);
      continue;
    }
    const s = scoreOf(m.traits, ref.traits);
    console.log(`${f.id} (${f.who}) · ${label} · ${Math.round(performance.now() - t0)} ms: ${s.total}/10, varietà ${m.variety.toFixed(2)}`);
    console.log(`   ${s.items.map((i) => `${i.name} ${Math.round(i.value * 100) / 100}/${Math.round(i.reference * 100) / 100} (${Math.round(i.score * 100)} %)`).join(' · ')}`);
    rows.push(`| ${f.who} · ${label} | ${scoreRow(s)} | ${m.variety.toFixed(2)} |`);
    out[f.id] = { who: f.who, size: label, vote: f.vote, total: s.total, variety: Math.round(m.variety * 1000) / 1000, traits: m.traits, runs: m.runs };
  }
  const table = [scoreHead(ref.traits)[0].replace(/ \|$/, ' | varietà |'), scoreHead(ref.traits)[1] + '---|', `| **il forte dell'autore ${ref.version}** · ${ref.box.join(' × ')} a ${ref.vpt} | ${scoreRow(scoreOf(ref.traits, ref.traits))} | ${ref.variety.toFixed(2)} |`, ...rows];
  console.log(table.join('\n'));
  const json = opt('json');
  if (json) fs.writeFileSync(json, JSON.stringify({ reference: ref.version, seeds: SEEDS, ...(taglia ? { taglia } : {}), forts: out }, null, 1) + '\n');
  const md = opt('tabella');
  if (md) fs.writeFileSync(md, table.join('\n') + '\n');
}

if (args.includes('--riferimento')) reference();
else judge();
