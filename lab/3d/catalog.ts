// What the 3D sandbox knows: the MarkovJunior models of lab/mjx/models (hand-written and ported from
// the earlier sessions) and a few of MarkovJunior's own 3D models, with the part each plays in the world.

import type { Vec3 } from '../../src/mj/engine';
import { mjxIncludes, rootVptOf } from '../../src/mj/model';
import { boxOf, classOf, densityFor, sizeOf, STRUCTURE_VPT, VESSEL_TILES, VESSEL_VPT, type SizeTier } from '../../src/mj/classes';
import { MOCK_STRUCTURE_PROGRAM } from '../../src/kernel/ai/mockStructure';
import { mockVesselProgram } from '../../src/kernel/ai/mockVessel';
import { OFFICIAL, OFFICIAL_FILES } from '../mjx/official';
import { villettaWithWindows } from '../banco/parti/villetta';

export type Role = 'player' | 'npc' | 'animal' | 'tree' | 'plant' | 'rock' | 'prop' | 'structure' | 'official' | 'handmade' | 'bench';

export interface Entry {
  id: string;
  name: string;
  role: Role;
  xml: string;
  /** Voxels per tile: 20 at the lab's scale, 8 for the models of step 8A. */
  vpt: number;
  /** Where it comes from (the comment at the top of the file). */
  source: string;
  /** The box, for MarkovJunior's models (their programs do not say). */
  size?: Vec3;
  /** Grows in front of you when placed (the run itself is the animation). */
  grows?: boolean;
  /** A step limit (models.xml's, for MarkovJunior's own models). */
  steps?: number;
  /** Written by Gemini in the step 8.2A trial (kept out of the world, shown in the panel). */
  trial?: boolean;
  /** Written by Human in the editor */
  handmade?: boolean;
  /** Written for the bench */
  bench?: boolean;
  /** The files of lab/mjx/models it reads (`<import>`, rule files; T333). */
  files?: Record<string, string>;
  /** A large model of the bench of the grid in pieces (T339, lab/banco/pezzi/): only for the developers. */
  pieces?: boolean;
  /** A structure of the bench of the sizes (T338, T346, lab/banco/taglie/) at one of its three sizes: only for the developers. */
  sizes?: boolean;
  /** A program a Sculptor wrote on the bench of the sizes (T391, T402, lab/banco/taglie/modelli/): only for the developers. */
  sculpted?: boolean;
  /** A vessel of the bench of the vessels (T440, lab/banco/navi/) at one of its sizes. */
  vessels?: boolean;
  /** A part of the seed alone, or a model that includes the parts of its trade (T471, lab/banco/parti/): only for the developers. */
  parts?: boolean;
  /** A program of the paid trial of the Sculptor's specialties (T473, lab/banco/specialita/): only for the developers. */
  specialties?: boolean;
}

const files = import.meta.glob('../mjx/models/*.xml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const ruleFiles = import.meta.glob('../mjx/models/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/**
 * The lab's models/ (T333, ADR-0171): what `<import file>` and the rule files of a program written in the lab may read, by name there.
 * For the developers also the original's tilesets, rule files and samples as text (T335, lab/mjx/official/resources/: empty in the
 * players' build), so a program written in the lab may use them too; the lab's own files win.
 */
// The seed's parts one lives in (T346, ADR-0182): what the structures of the bench of the sizes include; for the developers.
const seedParts = (import.meta.env.MODE !== 'production' ? import.meta.glob('../../universe/models/part-*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
export const LAB_FILES: Readonly<Record<string, string>> = { ...OFFICIAL_FILES, ...Object.fromEntries(Object.entries({ ...seedParts, ...files, ...ruleFiles }).map(([k, v]) => [k.replace(/^.*\//, ''), v])) };
/** The files of the lab's models/ a program reads, imports of imports too. */
export const labIncludes = (xml: string): Record<string, string> => mjxIncludes(xml, (f) => LAB_FILES[f]);
/** `files` for compileMjx, only if the program reads any. */
export const withIncludes = (xml: string): { files?: Record<string, string> } => {
  const inc = labIncludes(xml);
  return Object.keys(inc).length ? { files: inc } : {};
};

const MODELS: Array<[string, string, Role, number?]> = [
  ['viandante', 'Viandante (a mano)', 'player'],
  ['viandante-gemini', 'Viandante (Gemini)', 'npc'],
  ['contadina', 'Contadina', 'npc'],
  ['fabbro', 'Fabbro', 'npc'],
  ['gatto', 'Gatto', 'animal'],
  ['lupo', 'Lupo', 'animal'],
  ['slime', 'Slime', 'animal'],
  ['pino', 'Pino (a mano)', 'tree'],
  ['pino-gemini', 'Pino (Gemini)', 'tree'],
  ['quercia', 'Quercia (a mano)', 'tree'],
  ['quercia-gemini', 'Quercia (Gemini)', 'tree'],
  ['betulla', 'Betulla', 'tree'],
  ['palma', 'Palma', 'tree'],
  ['cespuglio', 'Cespuglio (a mano)', 'plant'],
  ['cespuglio-con-bacche', 'Cespuglio con bacche', 'plant'],
  ['fiore', 'Girasole', 'plant'],
  ['fungo-gigante', 'Fungo gigante', 'plant', 8],
  ['ceppo', 'Ceppo', 'plant', 8],
  ['masso', 'Masso (a mano)', 'rock'],
  ['masso-gemini', 'Masso (Gemini)', 'rock'],
  ['sasso', 'Sasso', 'rock'],
  ['barile', 'Barile', 'prop'],
  ['falo', 'Falò', 'prop'],
  ['casa', 'Casa a graticcio', 'structure', STRUCTURE_VPT],
  ['fattoria', 'Fattoria (6,25 × 6,25 caselle, T405)', 'structure', STRUCTURE_VPT],
  ['casetta', 'Casetta', 'structure', 8],
  ['pozzo', 'Pozzo', 'structure', 8],
  ['fontana', 'Fontana', 'structure', 8],
  ['torre-di-guardia', 'Torre di guardia', 'structure', 8],
  ['torre-merlata', 'Torre merlata (include merli.xml e torre-porta.txt)', 'structure', 8],
  ['merli', 'Merli (il sottoblocco della torre merlata)', 'structure', 8],
  ['corona-magia', 'Torre della magia (corona)', 'structure', 8],
  ['corona-persone', 'Studio dei personaggi (corona)', 'structure', 8],
  ['corona-cose', 'Laboratorio delle cose (corona)', 'structure', 8],
  ['corona-oggetti', 'Magazzino degli oggetti (corona)', 'structure', 8],
  ['corona-concilio', 'Sala del Concilio (corona)', 'structure', 8],
  ['corona-universo', 'La Direzione (corona)', 'structure', 8],
  ['corona-mondo', 'Biblioteca del Mondo (corona)', 'structure', 8],
  ['corona-galleria', "Galleria dell'Artista (corona)", 'structure', 8],
  ['corona-luoghi', 'Ufficio dei luoghi (corona)', 'structure', 8],
  ['corona-sistemi', 'Sala sistemi (corona)', 'structure', 8],
  ['corona-nucleo', 'Il Nucleo (corona)', 'structure', 8],
  ['corona-albero-luce', 'Albero di luce (corona)', 'tree', 8],
  ['corona-lampione', 'Lampione (corona)', 'prop', 8],
  ['corona-panchina', 'Panchina (corona)', 'prop', 8],
  ['corona-totem', 'Totem (corona)', 'prop', 8],
  ['corona-drone', 'Drone (corona)', 'prop', 8],
  ['corona-treno', 'Treno pod (corona)', 'prop', 8],
  ['corona-gerboa', 'Gerboa base (corona)', 'npc', 20],
  ['corona-gerboa-laterale', 'Gerboa (orecchie laterali)', 'npc', 20],
  ['corona-gerboa-45', 'Gerboa (orecchie a 45°)', 'npc', 20],
  ['corona-gerboa-narratore', 'Gerboa Narratore (corona)', 'npc', 20],
  ['corona-gerboa-cartografo', 'Gerboa Cartografo (corona)', 'npc', 20],
  ['corona-gerboa-artista', 'Gerboa Artista (corona)', 'npc', 20],
  ['corona-gerboa-scultore', 'Gerboa Scultore (corona)', 'npc', 20],
  ['corona-gerboa-fisico', 'Gerboa Fisico (corona)', 'npc', 20],
  ['corona-gerboa-ingegnere', 'Gerboa Ingegnere (corona)', 'npc', 20],
  ['corona-gerboa-arbitro', 'Gerboa Arbitro (corona)', 'npc', 20],
  ['corona-gerboa-referente', 'Gerboa Referente (corona)', 'npc', 20],
  ['corona-gerboa-attore', 'Gerboa Attore (corona)', 'npc', 20],
];

const sourceOf = (xml: string) => /^\s*<!--\s*([\s\S]*?)-->/.exec(xml)?.[1].replace(/\s+/g, ' ').trim() ?? '';

export const CATALOG: Entry[] = [
  ...MODELS.map(([id, name, role, vpt]) => {
    const xml = files[`../mjx/models/${id}.xml`];
    return { id, name, role, xml, vpt: vpt ?? 20, source: sourceOf(xml), ...(id === 'fiore' ? { grows: true } : {}), ...withIncludes(xml) };
  }),
  // The first eight stand on the plinths of the gallery; the others, which infer (T334) or read tiles and samples (T335), are in the list.
  ...['Growth', 'MazeGrowth', 'NoDeadEnds', 'OpenCave3D', 'StrangeDungeon', 'OddScale3D', 'Hills', 'MazeTrail', 'Keys', 'SoftPath', 'StairsPath', 'Dwarves', 'Division', 'RegularPath', 'GrowTo', 'CompleteSAW',
    'ModernHouse', 'SeaVilla', 'Apartemazements', 'PillarsOfEternity', 'Partitioning', 'Surface', 'Escher', 'EscherSurface', 'OrientedEscher', 'PeriodicEscher', 'ChainDungeon', 'ChainDungeonMaze', 'WaveDungeon']
    .map((n) => OFFICIAL.find((o) => o.name === n)!)
    .map((o) => ({ id: `mj:${o.name}`, name: o.name, role: 'official' as const, xml: o.xml, vpt: 20, size: o.size, source: `MarkovJunior (github.com/mxgmn/MarkovJunior, models/${o.name}.xml), ${o.note ?? 'invariato'}`, grows: true, ...(o.steps ? { steps: o.steps } : {}), ...(o.files ? { files: o.files } : {}) })),
];

// The step 8.2A trial: what each Gemini model wrote for the same targets (<target>.<model>.xml).
// Only for the developers (T294): in the build the players get, the comparisons are not there at all.
const trial = (import.meta.env.MODE !== 'production' ? import.meta.glob('../mjx/models/gemini/*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
const TRIAL_ROLE: Record<string, Role> = { mulino: 'structure', pino: 'tree', quercia: 'tree', betulla: 'tree', 'masso-muschioso': 'rock', 'cespuglio-con-bacche': 'plant', barile: 'prop', pozzo: 'structure', casetta: 'structure', viandante: 'npc', contadina: 'npc', gatto: 'animal', lupo: 'animal' };
for (const [file, xml] of Object.entries(trial)) {
  const base = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const target = base.split('.')[0];
  const model = base.slice(target.length + 1) || '?';
  // The windmill of step 8.2B is a large structure: its box is the class's (5 × 5 × 4 tiles).
  CATALOG.push({ id: `g:${target}.${model}`, name: `${target} · ${model}`, role: TRIAL_ROLE[target] ?? 'prop', xml, vpt: 20, source: sourceOf(xml) || `scolpito da ${model} nello step 8.2A`, trial: true, ...(target === 'mulino' ? { size: [100, 100, 80] as Vec3 } : {}) });
}


// The bench of the grid in pieces (T339, lab/banco/pezzi/): the farm of 50 × 50 tiles at 10 voxels a tile and the large fort, whole
// models of millions of cells. Only for the developers: in the players' build there is no bench.
const pieced = (import.meta.env.MODE !== 'production' ? import.meta.glob('../banco/pezzi/*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
const PIECED: Record<string, { name: string; vpt: number; size: Vec3 }> = {
  fattoria: { name: 'Fattoria di 50 × 50 caselle (a pezzi)', vpt: 10, size: [500, 500, 50] },
  forte: { name: 'Forte grande (a pezzi)', vpt: 12, size: [384, 384, 96] },
};
for (const [file, xml] of Object.entries(pieced)) {
  const base = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const p = PIECED[base];
  if (p) CATALOG.push({ id: `pezzi:${base}`, name: p.name, role: 'structure', xml, vpt: p.vpt, size: p.size, source: sourceOf(xml), pieces: true });
}

// The bench of the sizes (T338, T346, lab/banco/taglie/): the farm and the fort that fit their size, each at its three sizes at the
// density of the structures in the game (`STRUCTURE_VPT`, 16 since T405, ADR-0209), with the seed's parts included. Only for the developers.
const sized = (import.meta.env.MODE !== 'production' ? import.meta.glob('../banco/taglie/*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
const SIZED: Record<string, string> = { fattoria: 'Fattoria', forte: 'Forte', 'scultore-rocca': 'Rocca, come la scrive lo Scultore (T354)', 'scultore-villetta': 'Villetta, come la scrive lo Scultore (la risposta offline, T354)' };
// The fourth box is past today's Gargantuan (T356): the same program at 20 × 20 tiles, what a lot of several places would hold.
const tilesAt = (v: number) => (v / STRUCTURE_VPT).toLocaleString('it', { maximumFractionDigits: 2 });
const SIZES: Array<[string, string, Vec3]> = [
  ['large', `Grande, ${tilesAt(100)} × ${tilesAt(100)}`, [100, 100, 80]],
  ['huge', `Enorme, ${tilesAt(150)} × ${tilesAt(150)}`, [150, 150, 120]],
  ['gargantuan', `Gargantuesca di prima (200 voxel), ${tilesAt(200)} × ${tilesAt(200)}`, [200, 200, 160]],
  ['gargantuan-20', `400 voxel (T356), ${tilesAt(400)} × ${tilesAt(400)}`, [400, 400, 160]],
];
// The offline answer of the Sculptor (T354, ADR-0183): the country house written as the prompt without a skeleton asks, from its constant.
const sizedPrograms: Array<[string, string]> = [...Object.entries(sized), ...(import.meta.env.MODE !== 'production' ? [['scultore-villetta.xml', MOCK_STRUCTURE_PROGRAM] as [string, string]] : [])];
for (const [file, xml] of sizedPrograms) {
  const base = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const name = SIZED[base];
  if (name) for (const [id, label, size] of SIZES) CATALOG.push({ id: `taglie:${base}-${id}`, name: `${name} che si adatta alla taglia (${label} caselle)`, role: 'structure', xml, vpt: STRUCTURE_VPT, size, source: sourceOf(xml), sizes: true });
}

// The Sculptors at the sizes (T391, T402, lab/banco/taglie/modelli/): every program a model wrote for the farm and the fort, at the box
// of its size, shown at the density of the structures in the game (16 since T405), to see them beside the wanderer and at other densities
// (T403). Only for the developers.
const sculpted = (import.meta.env.MODE !== 'production' ? import.meta.glob('../banco/taglie/modelli/**/programma.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
const SIZE_BOX: Record<string, Vec3> = { large: [100, 100, 80], huge: [150, 150, 120], gargantuan: [200, 200, 160] };
for (const [file, xml] of Object.entries(sculpted)) {
  const path = /modelli\/(.+)\/([a-z]+)-([a-z]+)\/programma\.xml$/.exec(file);
  const box = path && SIZE_BOX[path[3]];
  if (!path || !box) continue;
  const [, run, concept, size] = path;
  const who = run.replace(/^openrouter\/(.+?)\//, '$1 via OpenRouter/').replace(/\//g, ' · ');
  CATALOG.push({ id: `scultori:${run}/${concept}-${size}`, name: `${concept} ${size} · ${who}`, role: 'structure', xml, vpt: STRUCTURE_VPT, size: box, source: sourceOf(xml), sculpted: true, ...withIncludes(xml) });
}

// The bench of the vessels (T440, lab/banco/navi/): the boat the local models write for the box of every size of the class `vessel` (the
// dinghy, the sailing boat, the brig, the galleon), at its density in the game (`VESSEL_VPT`), to see it beside the wanderer. In the players'
// labs too: they are the seed's boat (`universe/models/vessel.xml`) at every size, nothing of the developers.
const VESSEL_NAMES: Partial<Record<SizeTier, string>> = { medium: 'scialuppa', large: 'barca a vela', huge: 'brigantino', gargantuan: 'galeone' };
for (const [t, name] of Object.entries(VESSEL_NAMES) as Array<[SizeTier, string]>) {
  const box = boxOf(classOf('vessel')!, t);
  const xml = mockVesselProgram(box, name);
  CATALOG.push({ id: `navi:offline-${t}`, name: `Nave dei modelli locali, ${sizeOf(t)!.name}: ${name} (${VESSEL_TILES[t].join(' × ')} caselle)`, role: 'structure', xml, vpt: VESSEL_VPT, size: box, source: sourceOf(xml), vessels: true });
}

// The parts of the seed (T471, lab/banco/parti/README.md): each alone, as its own scene shows it, and the models of the bench that include
// those of their trade (the wardrobe and the cart of the joiner, the cottage of the mason, the Sculptor's country house with part-window), at
// the density they are drawn for. Only for the developers: the players' labs have no parts of the seed.
const PART_NAMES: Record<string, string> = {
  'part-stair': 'la scala',
  'part-door': 'la porta',
  'part-battlements': 'i merli',
  'part-slits': 'le feritoie',
  'part-cellar': 'la cantina',
  'part-window': 'le finestre',
  'part-leaf': 'le ante e i coperchi',
  'part-wheel': 'la ruota',
};
const FURNITURE_PARTS = new Set(['part-leaf', 'part-wheel']);
for (const [file, xml] of Object.entries(seedParts)) {
  const id = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  CATALOG.push({ id: `parti:${id}`, name: `Parte del seme: ${PART_NAMES[id] ?? id} (da sola)`, role: FURNITURE_PARTS.has(id) ? 'prop' : 'structure', xml, vpt: FURNITURE_PARTS.has(id) ? 20 : STRUCTURE_VPT, source: sourceOf(xml), parts: true });
}
const partModels = (import.meta.env.MODE !== 'production' ? import.meta.glob('../banco/parti/*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
const PART_MODELS: Record<string, { name: string; role: Role; size: Vec3; vpt: number }> = {
  armadio: { name: 'Armadio con le ante (part-leaf, il Mobiliere)', role: 'prop', size: [20, 20, 20], vpt: 20 },
  carretto: { name: 'Carretto a quattro ruote (part-wheel, il Mobiliere)', role: 'prop', size: [40, 40, 40], vpt: 20 },
  casetta: { name: 'Casetta con le finestre e la porta che si apre (part-window, part-leaf, il Capomastro)', role: 'structure', size: [50, 50, 50], vpt: 20 },
};
for (const [file, xml] of Object.entries(partModels)) {
  const id = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const p = PART_MODELS[id];
  if (p) CATALOG.push({ id: `parti:${id}`, name: p.name, role: p.role, xml, vpt: p.vpt, size: p.size, source: sourceOf(xml), parts: true, ...withIncludes(xml) });
}
// The offline house rewritten (lab/banco/parti/villetta.ts): if the house changed under it the lab goes on without it (the test says so).
const villetta = (): string | undefined => {
  try {
    return villettaWithWindows();
  } catch {
    return undefined;
  }
};
const xmlVilletta = import.meta.env.MODE !== 'production' ? villetta() : undefined;
if (xmlVilletta) {
  const xml = xmlVilletta;
  CATALOG.push({ id: 'parti:villetta', name: 'Villetta dello Scultore con le finestre di part-window (l’Architetto, Grande)', role: 'structure', xml, vpt: STRUCTURE_VPT, size: [100, 100, 80], source: sourceOf(xml), parts: true, ...withIncludes(xml) });
}

// The paid trial of the Sculptor's specialties (T473, lab/banco/specialita/): every program kept, with the prompt of before T468 (`prima`) and
// today's (`dopo`), at the density of its class in the game and, where the program has no box of its own (the cupboard of the seed with its
// action, the structure that grows by rules), in its class's at its size. Only for the developers.
const trade = (import.meta.env.MODE !== 'production' ? import.meta.glob('../banco/specialita/**/programma.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
const TRADE_CONCEPTS: Record<string, { name: string; cls: string; size?: SizeTier; role: Role }> = {
  castagno: { name: 'Castagno', cls: 'tree', role: 'tree' },
  baule: { name: 'Baule da viaggio', cls: 'furniture', role: 'prop' },
  credenza: { name: 'Credenza con «Apri le ante»', cls: 'furniture', role: 'prop' },
  cappello: { name: 'Cappello di paglia', cls: 'object', role: 'prop' },
  mugnaia: { name: 'Mugnaia', cls: 'person', role: 'npc' },
  gatto: { name: 'Gatto rosso', cls: 'animal', role: 'animal' },
  casetta: { name: 'Casetta del pastore', cls: 'building', role: 'structure' },
  barca: { name: 'Barca da pesca', cls: 'vessel', size: 'large', role: 'structure' },
  rocca: { name: 'Rocca di confine', cls: 'structure', size: 'large', role: 'structure' },
};
for (const [file, xml] of Object.entries(trade)) {
  const m = /specialita\/([^/]+)\/(prima|dopo)\/([a-z]+)\/programma\.xml$/.exec(file);
  const c = m && TRADE_CONCEPTS[m[3]];
  const cls = c && classOf(c.cls);
  if (!m || !c || !cls) continue;
  const sized = /<(?!!)[a-z]+\b[^>]*\ssize="/i.test(xml.replace(/<!--[\s\S]*?-->/g, ''));
  CATALOG.push({ id: `specialita:${m[1]}/${m[2]}/${m[3]}`, name: `${c.name} · ${m[2] === 'prima' ? 'prompt di prima' : 'specialità'} · ${m[1]}`, role: c.role, xml, vpt: densityFor(cls, c.size), ...(sized ? {} : { size: boxOf(cls, c.size) }), source: sourceOf(xml), specialties: true, ...withIncludes(xml) });
}

/**
 * The density a hand drawn model is drawn for, if not the lab's 20 (T404, D61): the author's fort, 500 × 500 voxels, is 50 × 50 tiles at
 * 10 voxels a tile, as its entry says in a world (`vpt: 10`, ADR-0208); the «voxel per casella» of the inspector starts from it.
 */
export const HANDMADE_VPT: Readonly<Record<string, number>> = { 'forte-handmade': 10 };

// Hand drawn models
const handmade = (import.meta.env.MODE !== 'production' ? import.meta.glob('../mjx/models/handmade/*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
for (const [file, xml] of Object.entries(handmade)) {
  const base = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const target = base.split('.')[0];
  // The windmill of step 8.2B is a large structure: its box is the class's (5 × 5 × 4 tiles).
  CATALOG.push({ id: `${target}`, name: `${target}`, role: 'handmade', xml, vpt: rootVptOf(xml) ?? HANDMADE_VPT[target] ?? 20, source: sourceOf(xml) || `scolpito a mano da un autore umano`, handmade: true });
}


// Hand drawn models
const bench = (import.meta.env.MODE !== 'production' ? import.meta.glob('../mjx/models/banco/*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
for (const [file, xml] of Object.entries(bench)) {
  const base = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const target = base.split('.')[0];
  // The windmill of step 8.2B is a large structure: its box is the class's (5 × 5 × 4 tiles).
  CATALOG.push({ id: `${target}`, name: `${target}`, role: 'bench', xml, vpt: 20, source: sourceOf(xml) || `modelli del banco`, bench: true });
}





/**
 * Whether the page has the developers' tools (T294, ADR-0169): `npm run dev`. The build is the players' labs (served by the production
 * server only with `laboratori` on): no Gemini, no comparisons with MarkovJunior's own models or the trials, no files from the disk.
 * `MODE`, not `DEV`: every build has the mode `production`, while `DEV` follows NODE_ENV, and a build with NODE_ENV=development has it on.
 */
export const DEV_TOOLS: boolean = import.meta.env.MODE !== 'production';

export const byId = (id: string) => CATALOG.find((e) => e.id === id);
export const GROUPS: Array<[string, (e: Entry) => boolean]> = [
  ['Persone e animali', (e) => !e.trial && !e.specialties && ['player', 'npc', 'animal'].includes(e.role)],
  ['Piante e rocce', (e) => !e.trial && !e.specialties && ['tree', 'plant', 'rock'].includes(e.role)],
  ['Oggetti e strutture', (e) => !e.trial && !e.pieces && !e.sizes && !e.sculpted && !e.vessels && !e.parts && !e.specialties && ['prop', 'structure'].includes(e.role)],
  ['Navi alle taglie (T440)', (e) => !!e.vessels],
  ...(DEV_TOOLS
    ? ([
      ['MarkovJunior (originali)', (e) => e.role === 'official'],
      ['Banco: modelli grandi a pezzi (T339)', (e) => !!e.pieces],
      ['Banco: le parti del seme, da sole e nei modelli (T471)', (e) => !!e.parts],
      ['Banco: strutture che si adattano alla taglia (T338, T346)', (e) => !!e.sizes],
      ['Banco: gli Scultori sulle taglie (T391, T402)', (e) => !!e.sculpted],
      ['Banco: le specialità dello Scultore, prima e dopo (T473)', (e) => !!e.specialties],
      ['Gemini: prove degli step 8.2A e 8.2B', (e) => !!e.trial],
      ['Modelli dell\'editor', (e) => !!e.handmade],
      ['Modelli del banco', (e) => !!e.bench],
    ] as Array<[string, (e: Entry) => boolean]>)
    : []),
];
