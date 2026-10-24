// What the 3D sandbox knows: the MarkovJunior models of lab/mjx/models (hand-written and ported from
// the earlier sessions) and a few of MarkovJunior's own 3D models, with the part each plays in the world.

import type { Vec3 } from '../../src/mj/engine';
import { OFFICIAL } from '../mjx/official';

export type Role = 'player' | 'npc' | 'animal' | 'tree' | 'plant' | 'rock' | 'prop' | 'structure' | 'official';

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
}

const files = import.meta.glob('../mjx/models/*.xml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

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
];

const sourceOf = (xml: string) => /^\s*<!--\s*([\s\S]*?)-->/.exec(xml)?.[1].replace(/\s+/g, ' ').trim() ?? '';

export const CATALOG: Entry[] = [
  ...MODELS.map(([id, name, role, vpt]) => {
    const xml = files[`../mjx/models/${id}.xml`];
    return { id, name, role, xml, vpt: vpt ?? 20, source: sourceOf(xml), ...(id === 'fiore' ? { grows: true } : {}) };
  }),
  ...['Growth', 'MazeGrowth', 'NoDeadEnds', 'OpenCave3D', 'StrangeDungeon', 'OddScale3D', 'Hills', 'MazeTrail']
    .map((n) => OFFICIAL.find((o) => o.name === n)!)
    .map((o) => ({ id: `mj:${o.name}`, name: o.name, role: 'official' as const, xml: o.xml, vpt: 20, size: o.size, source: 'MarkovJunior (github.com/mxgmn/MarkovJunior, models/' + o.name + '.xml), invariato', grows: true, ...(o.steps ? { steps: o.steps } : {}) })),
];

// The step 8.2A trial: what each Gemini model wrote for the same targets (<target>.<model>.xml).
const trial = import.meta.glob('../mjx/models/gemini/*.xml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const TRIAL_ROLE: Record<string, Role> = { mulino: 'structure', pino: 'tree', quercia: 'tree', betulla: 'tree', 'masso-muschioso': 'rock', 'cespuglio-con-bacche': 'plant', barile: 'prop', pozzo: 'structure', casetta: 'structure', viandante: 'npc', contadina: 'npc', gatto: 'animal', lupo: 'animal' };
for (const [file, xml] of Object.entries(trial)) {
  const base = file.replace(/^.*\//, '').replace(/\.xml$/, '');
  const target = base.split('.')[0];
  const model = base.slice(target.length + 1) || '?';
  // The windmill of step 8.2B is a large structure: its box is the class's (5 × 5 × 4 tiles).
  CATALOG.push({ id: `g:${target}.${model}`, name: `${target} · ${model}`, role: TRIAL_ROLE[target] ?? 'prop', xml, vpt: 20, source: sourceOf(xml) || `scolpito da ${model} nello step 8.2A`, trial: true, ...(target === 'mulino' ? { size: [100, 100, 80] as Vec3 } : {}) });
}

export const byId = (id: string) => CATALOG.find((e) => e.id === id);
export const GROUPS: Array<[string, (e: Entry) => boolean]> = [
  ['Persone e animali', (e) => !e.trial && ['player', 'npc', 'animal'].includes(e.role)],
  ['Piante e rocce', (e) => !e.trial && ['tree', 'plant', 'rock'].includes(e.role)],
  ['Oggetti e strutture', (e) => !e.trial && ['prop', 'structure'].includes(e.role)],
  ['MarkovJunior (originali)', (e) => e.role === 'official'],
  ['Gemini: prove degli step 8.2A e 8.2B', (e) => !!e.trial],
];
