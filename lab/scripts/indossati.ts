// The bench of what is worn (T289, lab/banco/indossati.md): three ways (A, B, C) on the same three things (a helmet, a cuirass, a
// cloak) and on the same bodies (the wanderer and the wolf of the seed), photographed from four sides as the world draws them
// (cartoon), timed and weighed; then the same outfit on every figure of the seed and on the creatures of Cantiere 8, the bodies
// that were generated. No model is called: the things are written by hand as the Sculptor would write them.
//
//   npx vite-node lab/scripts/indossati.ts              everything: photographs, measures.json, riepilogo.md
//   npx vite-node lab/scripts/indossati.ts -- --rapido  the two main bodies only

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SCULPTORS } from '../../src/kernel/agents/sculptor';
import { costOf } from '../../src/kernel/ai/prices';
import { rootTag } from '../../src/kernel/forms';
import { boxOf, classOf } from '../../src/mj/classes';
import { compileMjx } from '../../src/mj/model';
import { cartoonRender, render, sheet, type Picture } from '../../src/mj/photo';
import { FORM_LIMITS, runMjx } from '../../src/mj/run';
import { CATALOGO } from '../banco/fauna-biomi-cloud/catalogo';
import { ITEM_NAMES, itemsFrom, measure, thingMesh, type Measure } from '../banco/indossati/bench';
import { bodyOf, zoneMap, ZONES } from '../banco/indossati/body';
import { ITEMS, prepare, runProgram, WAYS, type Dressed, type ItemId, type WayId } from '../banco/indossati/ways';
import { png } from './png';

const OUT = 'lab/banco/indossati';
const PHOTOS = join(OUT, 'foto');
const VPT = 20;
const quick = process.argv.includes('--rapido');
const BACKGROUND: [number, number, number] = [196, 206, 186];

// --- Bodies -----------------------------------------------------------------------------------------------------------------------

interface BodySpec {
  name: string;
  /** Where it comes from: the seed or Cantiere 8. */
  from: 'seme' | 'cantiere 8';
  cls: string;
  seed: number;
  xml: string;
}

const index = JSON.parse(readFileSync('universe/models/index.json', 'utf8')) as Record<string, { class: string; name?: string }>;
const seedSpec = (id: string, seed: number): BodySpec => ({ name: id, from: 'seme', cls: index[id]?.class ?? 'person', seed, xml: readFileSync(`universe/models/${id}.xml`, 'utf8') });

/** A figure as the game runs it: its own box if it says one, else its class's. */
function bodyGrid(s: BodySpec): Dressed {
  const own = /\ssize="/.test(rootTag(s.xml));
  const cls = classOf(s.cls);
  const m = compileMjx(s.xml, own || !cls ? {} : { size: boxOf(cls) });
  const r = runMjx(m, s.seed, { limits: FORM_LIMITS, deadline: 8_000 });
  return { grid: r.grid, palette: m.program.palette };
}

/** The figures of the seed that walk, and the creatures of Cantiere 8 (not its vehicles). */
function allBodies(): BodySpec[] {
  const seed = Object.entries(index)
    .filter(([id, info]) => ['person', 'animal', 'beast'].includes(info.class) && !id.startsWith('sound'))
    .map(([id]) => seedSpec(id, 1));
  const vehicles = new Set(['locomotiva-vapore', 'furgone-consegne', 'motocicletta-stradale', 'rover-esplorazione']);
  const creatures = CATALOGO.filter((v) => v.collezione === 'creature-veicoli' && ['person', 'animal', 'beast'].includes(v.classe) && !vehicles.has(v.nome)).map(
    (v): BodySpec => ({ name: v.nome, from: 'cantiere 8', cls: v.classe, seed: 1, xml: readFileSync(join('lab/banco/fauna-biomi-cloud', v.collezione, v.ambientazione, `${v.nome}.xml`), 'utf8') }),
  );
  return [...seed, ...creatures];
}

// --- Things -----------------------------------------------------------------------------------------------------------------------

const ITEMS_DIR = join(OUT, 'items');
const files = Object.fromEntries(readdirSync(ITEMS_DIR).map((f) => [f, readFileSync(join(ITEMS_DIR, f), 'utf8')]));
const items = itemsFrom(files);
const prepared = prepare(items);

// --- Pictures ---------------------------------------------------------------------------------------------------------------------

const photo = (d: Dressed, view: number, px = 4) => render({ ...d.grid, log: [], epoch: 0 }, d.palette, view, cartoonRender(px));
const row = (pics: Picture[], gap = 6) => sheet(pics, 1, gap, BACKGROUND);
/** Rows one under the other, left-aligned, on the background. */
function column(rows: Picture[]): Picture {
  const W = Math.max(...rows.map((r) => r.w));
  const H = rows.reduce((s, r) => s + r.h, 0);
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) data.set([...BACKGROUND, 255], i * 4);
  let oy = 0;
  for (const r of rows) {
    for (let y = 0; y < r.h; y++) data.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), ((oy + y) * W) * 4);
    oy += r.h;
  }
  return { w: W, h: H, data };
}
const save = (name: string, p: Picture) => {
  writeFileSync(join(PHOTOS, name), png(p));
  console.log(`scritto ${join(PHOTOS, name)} (${p.w} × ${p.h})`);
};

// --- The run ----------------------------------------------------------------------------------------------------------------------

mkdirSync(PHOTOS, { recursive: true });
const MAIN: Array<{ label: string; spec: BodySpec }> = [
  { label: 'viandante', spec: seedSpec('viandante', 2) },
  { label: 'lupo', spec: seedSpec('beast', 1) },
];
const OUTFITS: Array<{ label: string; items: ItemId[] }> = [
  { label: 'elmo', items: ['helmet'] },
  { label: 'corazza', items: ['cuirass'] },
  { label: 'mantello', items: ['cloak'] },
  { label: 'tutto', items: ['cloak', 'cuirass', 'helmet'] },
];
const ALL: ItemId[] = ['cloak', 'cuirass', 'helmet'];
const measures: Measure[] = [];

// The things on the ground, four sides, and the worn programs of A (front, back).
{
  const rows = (['helmet', 'cuirass', 'cloak'] as ItemId[]).map((id) => {
    const it = items.find((i) => i.id === id)!;
    const ground = runProgram(it.ground);
    const worn = it.wornProgram ? runProgram(it.wornProgram) : undefined;
    return row([0, 1, 2, 3].map((v) => photo(ground, v, 6)).concat(worn ? [0, 2].map((v) => photo(worn, v, 6)) : []), 10);
  });
  save('oggetti.png', column(rows));
}

for (const { label, spec } of MAIN) {
  const base = bodyGrid(spec);
  const body = bodyOf(base.grid, base.palette, VPT);
  const zm = zoneMap(body);
  save(`${label}-zone.png`, row([0, 1, 2, 3].map((v) => photo(zm, v))));
  const bare = row([0, 1, 2, 3].map((v) => photo(base, v)));
  const compare: Picture[] = [];
  const dressedAll: Partial<Record<WayId, Dressed>> = {};
  for (const outfit of OUTFITS) {
    const rows = [bare];
    for (const way of WAYS) {
      const m = measure(label, spec.seed, base, VPT, outfit.items, way, prepared);
      measures.push(m.measure);
      rows.push(row([0, 1, 2, 3].map((v) => photo(m.dressed, v))));
      if (outfit.label === 'tutto') dressedAll[way] = m.dressed;
    }
    save(`${label}-${outfit.label}.png`, column(rows));
  }
  // Side by side: per way, the helmet and the cuirass from the front, the cloak from behind, everything from the front, the side, behind.
  for (const way of WAYS) {
    const pics: Picture[] = [];
    for (const [items, view] of [[['helmet'], 0], [['cuirass'], 0], [['cloak'], 2]] as Array<[ItemId[], number]>) pics.push(photo(measure(label, spec.seed, base, VPT, items, way, prepared, 1).dressed, view));
    for (const v of [0, 1, 2]) pics.push(photo(dressedAll[way]!, v));
    compare.push(row(pics));
  }
  save(`${label}-confronto.png`, column(compare));
}

// Every seed of the wanderer and of the wolf: the same outfit, for the times and for what changes from a seed to another.
for (const [label, id, seeds] of [['viandante', 'viandante', [1, 2, 3, 4, 5, 6, 7, 8]], ['lupo', 'beast', [1, 2, 3, 4]]] as const) {
  const pics: Picture[][] = [[], [], [], []];
  for (const seed of seeds) {
    const base = bodyGrid(seedSpec(id, seed));
    pics[0].push(photo(base, label === 'lupo' ? 1 : 0, 3));
    WAYS.forEach((way, k) => {
      const m = measure(`${label}#${seed}`, seed, base, VPT, ALL, way, prepared);
      measures.push(m.measure);
      pics[k + 1].push(photo(m.dressed, label === 'lupo' ? 1 : 0, 3));
    });
  }
  save(`${label}-semi.png`, column(pics.map((p) => row(p))));
}

// The bodies that were generated: every figure of the seed and the creatures of Cantiere 8, the whole outfit.
const robust: Array<{ body: string; from: string; cls: string; upright: boolean; neck: string; zones: Record<string, number>; ways: Record<WayId, Pick<Measure, 'added' | 'recoloured' | 'overlapped' | 'gap' | 'unfinished' | 'wearMs' | 'meshMs'>> }> = [];
if (!quick) {
  const groups: Record<'persone' | 'bestie', Picture[][]> = { persone: [[], [], [], []], bestie: [[], [], [], []] };
  for (const spec of allBodies()) {
    let base: Dressed;
    try {
      base = bodyGrid(spec);
    } catch (e) {
      console.log(`${spec.name}: ${(e as Error).message}`);
      continue;
    }
    const b = bodyOf(base.grid, base.palette, VPT);
    const group = spec.cls === 'person' ? 'persone' : 'bestie';
    const view = group === 'persone' ? 0 : 1;
    const zm = zoneMap(b);
    groups[group][0].push(photo(zm, view, 2));
    const entry = { body: spec.name, from: spec.from, cls: spec.cls, upright: b.upright, neck: b.neck.found, zones: Object.fromEntries(ZONES.map((z) => [z, b.zones[z]?.cells.length ?? 0])), ways: {} as (typeof robust)[number]['ways'] };
    WAYS.forEach((way, k) => {
      const m = measure(spec.name, 1, base, VPT, ALL, way, prepared, 1);
      groups[group][k + 1].push(photo(m.dressed, view, 2));
      const { added, recoloured, overlapped, gap, unfinished, wearMs, meshMs } = m.measure;
      entry.ways[way] = { added, recoloured, overlapped, gap, unfinished, wearMs, meshMs };
    });
    robust.push(entry);
  }
  for (const [g, rows] of Object.entries(groups)) save(`corpi-generati-${g}.png`, column(rows.map((r) => row(r, 4))));
}

// --- What a thing costs -------------------------------------------------------------------------------------------------------------

const perItem = Object.fromEntries(
  items.map((it) => {
    const worn = prepared.mesh[it.id];
    const wornMesh = worn ? thingMesh(worn, VPT) : undefined;
    return [
      it.id,
      {
        name: ITEM_NAMES[it.id],
        groundChars: it.ground.length,
        wornSectionChars: it.worn?.length ?? 0,
        wornProgramChars: it.wornProgram?.length ?? 0,
        wornProgramMs: worn?.ms ?? 0,
        wornMeshBytes: wornMesh?.bytes ?? 0,
        wornMeshMs: wornMesh?.ms ?? 0,
        colors: prepared.colors[it.id]?.map((c) => c.color),
      },
    ];
  }),
) as Record<ItemId, { name: string; groundChars: number; wornSectionChars: number; wornProgramChars: number; wornProgramMs: number; wornMeshBytes: number; wornMeshMs: number; colors?: Array<string | undefined> }>;

// The Sculptor's request for a simple thing, as the hourly estimate counts it (src/kernel/coefficients.ts, WEIGHT): two programs on the
// simple model and the Artist's judgement of each, at the prices of src/kernel/ai/prices.ts. Characters → tokens at 3.5 a token (XML).
const SCULPT = { prompt: 7000, cached: 2500, output: 3000 };
const JUDGE = { prompt: 3800, cached: 0, output: 300 };
const CHARS_PER_TOKEN = 3.5;
/** The words the Sculptor's prompt would need for each way, in tokens: B's draft in indossati.md (§ «Il prompt», 1151 characters, about 290), A a paragraph as long on the box of a zone. */
const PROMPT_EXTRA = { A: 300, B: 300, C: 0 } as const;
const simple = DEFAULT_SCULPTORS.simple;
const artist = DEFAULT_SCULPTORS.artist;
const oneModel = 2 * (costOf(simple, SCULPT) ?? 0) + 2 * (costOf(artist, JUDGE) ?? 0);
const meanWorn = ITEMS.reduce((s, id) => s + perItem[id].wornSectionChars, 0) / ITEMS.length / CHARS_PER_TOKEN;
const sculptor = {
  simple,
  artist,
  oneModel,
  perWearable: {
    A: oneModel + 2 * (costOf(simple, { prompt: PROMPT_EXTRA.A, cached: 0, output: 0 }) ?? 0),
    B: 2 * (costOf(simple, { prompt: PROMPT_EXTRA.B, cached: 0, output: Math.round(meanWorn) }) ?? 0),
    C: 0,
  },
  wornTokens: Math.round(meanWorn),
};

// --- Summaries --------------------------------------------------------------------------------------------------------------------

const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);
const r1 = (v: number) => Math.round(v * 10) / 10;
const kb = (v: number) => `${r1(v / 1024)} KB`;
const lines: string[] = ['# Banco degli indossati: le misure', '', 'Scritto da `npx vite-node lab/scripts/indossati.ts`: non a mano. Il commento è in [`../indossati.md`](../indossati.md).', ''];

lines.push('## Tempi e memoria, l\'abito intero (mantello, corazza, elmo)', '', 'Mediane sui semi (viandante 1-8, lupo 1-4), tre esecuzioni ciascuno. «Zone» si fa una volta per forma del corpo; «cambio» è il lavoro della via a ogni vestizione; «mesh» le mesh che la vestizione rifà (B e C: il corpo intero con gli arti; A: nessuna, quelle dei pezzi si fanno una volta per oggetto).', '');
lines.push('| corpo | via | zone ms | cambio ms | mesh ms | byte nuovi per chi si veste | mesh disegnate | voxel aggiunti | voxel ricolorati | voxel attraversati | distanza media dal corpo | voxel a 3 o più dal corpo |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const label of ['viandante', 'lupo']) {
  for (const way of WAYS) {
    const ms = measures.filter((m) => m.body.startsWith(`${label}#`) && m.way === way);
    lines.push(`| ${label} | ${way} | ${r1(median(ms.map((m) => m.bodyMs)))} | ${r1(median(ms.map((m) => m.wearMs)))} | ${r1(median(ms.map((m) => m.meshMs)))} | ${way === 'A' ? '0' : kb(median(ms.map((m) => m.meshBytes)))} (nudo ${kb(median(ms.map((m) => m.bareBytes)))}) | ${median(ms.map((m) => m.meshes))} | ${median(ms.map((m) => m.added))} | ${median(ms.map((m) => m.recoloured))} | ${median(ms.map((m) => m.overlapped))} | ${r1(median(ms.map((m) => m.gap.mean)))} | ${Math.round(100 * median(ms.map((m) => m.gap.far)))} % |`);
  }
}
lines.push('', '## Per oggetto', '', '| oggetto | programma a terra (caratteri) | sezione `<worn>` (B, caratteri) | programma indossato (A, caratteri) | A: tempo del programma indossato | A: mesh indossata (una per tutti) | C: colori presi |', '|---|---|---|---|---|---|---|');
for (const id of ITEMS) {
  const p = perItem[id];
  lines.push(`| ${p.name} | ${p.groundChars} | ${p.wornSectionChars} | ${p.wornProgramChars} | ${r1(p.wornProgramMs)} ms | ${kb(p.wornMeshBytes)}, ${r1(p.wornMeshMs)} ms | ${(p.colors ?? []).join(', ')} |`);
}
lines.push('', '## Lo Scultore', '', `Una cosa semplice costa due programmi su \`${simple}\` e due giudizi dell'Artista su \`${artist}\`, con i pesi della stima oraria (\`src/kernel/coefficients.ts\`): ${oneModel.toFixed(4)} $ a modello. Sezione \`<worn>\` media: ${sculptor.wornTokens} token in uscita.`, '');
lines.push('| via | modelli in più per oggetto da indossare | $ in più per oggetto | 10 oggetti | 30 oggetti | 100 oggetti |', '|---|---|---|---|---|---|');
for (const way of WAYS) {
  const c = sculptor.perWearable[way];
  lines.push(`| ${way} | ${way === 'A' ? 1 : 0} | ${c.toFixed(4)} | ${(10 * c).toFixed(3)} | ${(30 * c).toFixed(3)} | ${(100 * c).toFixed(3)} |`);
}
if (robust.length) {
  lines.push('', '## I corpi generati: l\'abito intero', '', 'Ogni figura del seme che cammina (seme 1) e le creature del Cantiere 8 (non i veicoli). Zone: voxel di testa, busto, schiena; «collo» dice come è stata trovata la testa (`rig`: la palette la nomina; `narrowing`: la fetta più stretta; `share`: una quota del corpo). Per ogni via: voxel aggiunti / ricolorati / attraversati, distanza media dal corpo.', '');
  lines.push('| corpo | da | classe | in piedi | collo | testa | busto | schiena | A | B | C |', '|---|---|---|---|---|---|---|---|---|---|---|');
  for (const e of robust) {
    const w = (k: WayId) => `${e.ways[k].added}/${e.ways[k].recoloured}/${e.ways[k].overlapped}, ${r1(e.ways[k].gap.mean)}${e.ways[k].unfinished ? ' (non finito)' : ''}`;
    lines.push(`| ${e.body} | ${e.from} | ${e.cls} | ${e.upright ? 'sì' : 'no'} | ${e.neck} | ${e.zones.head} | ${e.zones.torso} | ${e.zones.back} | ${w('A')} | ${w('B')} | ${w('C')} |`);
  }
}
writeFileSync(join(OUT, 'riepilogo.md'), lines.join('\n') + '\n');
writeFileSync(join(OUT, 'misure.json'), JSON.stringify({ items: perItem, sculptor, measures: measures.map(({ changes, ...m }) => ({ ...m, changes: changes.map((c) => ({ ...c, ms: r1(c.ms) })) })), robust }, null, 1) + '\n');
console.log(`scritto ${join(OUT, 'riepilogo.md')} e misure.json`);
