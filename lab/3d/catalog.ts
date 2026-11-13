// What the 3D sandbox knows: the MarkovJunior models of lab/mjx/models (hand-written and ported from
// the earlier sessions) and a few of MarkovJunior's own 3D models, with the part each plays in the world.

import type { Vec3 } from '../../src/mj/engine';
import { mjxIncludes } from '../../src/mj/model';
import { OFFICIAL, OFFICIAL_FILES } from '../mjx/official';

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
  ['casa', 'Casa a graticcio', 'structure'],
  ['fattoria', 'Fattoria (5 × 5 caselle)', 'structure'],
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

// The bench of the sizes (T338, T346, lab/banco/taglie/): the farm and the fort that fit their size, each at its three sizes at 20
// voxels a tile, with the seed's parts included. Only for the developers.
const sized = (import.meta.env.MODE !== 'production' ? import.meta.glob('../banco/taglie/*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
const SIZED: Record<string, string> = { fattoria: 'Fattoria', forte: 'Forte' };
const SIZES: Array<[string, string, Vec3]> = [['large', 'Grande, 5 × 5', [100, 100, 80]], ['huge', 'Enorme, 7,5 × 7,5', [150, 150, 120]], ['gargantuan', 'Gargantuesca, 10 × 10', [200, 200, 160]]];
for (const [file, xml] of Object.entries(sized)) {
  const base = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const name = SIZED[base];
  if (name) for (const [id, label, size] of SIZES) CATALOG.push({ id: `taglie:${base}-${id}`, name: `${name} che si adatta alla taglia (${label} caselle)`, role: 'structure', xml, vpt: 20, size, source: sourceOf(xml), sizes: true });
}

// Hand drawn models
const handmade = (import.meta.env.MODE !== 'production' ? import.meta.glob('../mjx/models/handmade/*.xml', { query: '?raw', import: 'default', eager: true }) : {}) as Record<string, string>;
for (const [file, xml] of Object.entries(handmade)) {
  const base = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const target = base.split('.')[0];
  // The windmill of step 8.2B is a large structure: its box is the class's (5 × 5 × 4 tiles).
  CATALOG.push({ id: `${target}`, name: `${target}`, role: 'handmade', xml, vpt: 20, source: sourceOf(xml) || `scolpito a mano da un autore umano`, handmade: true });
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
  ['Persone e animali', (e) => !e.trial && ['player', 'npc', 'animal'].includes(e.role)],
  ['Piante e rocce', (e) => !e.trial && ['tree', 'plant', 'rock'].includes(e.role)],
  ['Oggetti e strutture', (e) => !e.trial && !e.pieces && !e.sizes && ['prop', 'structure'].includes(e.role)],
  ...(DEV_TOOLS
    ? ([
      ['MarkovJunior (originali)', (e) => e.role === 'official'],
      ['Banco: modelli grandi a pezzi (T339)', (e) => !!e.pieces],
      ['Banco: strutture che si adattano alla taglia (T338, T346)', (e) => !!e.sizes],
      ['Gemini: prove degli step 8.2A e 8.2B', (e) => !!e.trial],
      ['Modelli dell\'editor', (e) => !!e.handmade],
      ['Modelli del banco', (e) => !!e.bench],
    ] as Array<[string, (e: Entry) => boolean]>)
    : []),
];
