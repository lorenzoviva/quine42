// The strata of the ground (T418, ADR-0091 point 5, T52d reduced): what lies under every tile, as rows of terrains a tile deep.
// The terrains of the strata are the generator's `strata` (layer `stratum`), the seed's when a universe has none; the draft of the strata
// is written column by column from the tile and its biome (the procedural draft's code), deterministic from the world's seed. A plan keeps
// them (`ChunkPlan.strata`), a plan of before has them again from its draft. They are only a look: they block nothing and nobody stands
// in them (a body under the ground stands in a model). Pure functions: no kernel, no three.js.
//
// The strata as rules (T478, ADR-0249, the row 5 of T459): an environment may have a program of the strata (`EnvironmentDef.strata`), a
// MarkovJunior program in 3D on the place's box, S × S tiles and `STRATA_DEPTH` rows deep under a top layer the kernel writes, the surface:
// every column's code of the procedural draft (the nature that was there before the environment). Its rules say what lies under what, a
// layer at a time; what it leaves undecided, or writes that is not a stratum, is the draft's (`programStrata`). Only rules and their order
// (`one all prl sequence markov`), a symmetry that keeps the up and the down, a ceiling of steps: the validator tries it on the drafts of trial
// (`strataProgramErrors`). A new plan says how its strata are made (`strataDepth`) and has 6 rows; a plan of before the draft's 4.

import { hash32 } from './rng';
import type { TerrainDef } from './types';
import { compileMjx, type MjxModel } from '../mj/model';
import { runOn, type Grid3, type Node3, type Sym } from '../mj/engine';
import { isSymbolCode, symbolName } from '../mj/symbols';

/**
 * How many rows of strata a new plan has under its ground (tiles, T478): the 4 of before and two more, for the deepest cellars of the rare
 * sizes and the sides of the cliffs of a relief that will have them (T459 § 3).
 */
export const STRATA_DEPTH = 6;
/** How many a plan of before has (T418): one that does not say `strataDepth`, drafted again from its draft. */
export const STRATA_DEPTH_BEFORE = 4;

/** The rows of strata a plan has: a plan that says `strataDepth` (a new one, T478) the new depth, any other the 4 of before. */
export const strataDepthOf = (plan: { strataDepth?: unknown } | undefined): number => (plan?.strataDepth === STRATA_DEPTH ? STRATA_DEPTH : STRATA_DEPTH_BEFORE);

/** What a stratum is in the draft, whatever the world calls it: the ids the draft looks for. */
export const STRATUM_ROLES = ['topsoil', 'clay', 'sandbed', 'mud', 'bedrock'] as const;
export type StratumRole = (typeof STRATUM_ROLES)[number];

/** The seed's strata (`world.terrain → strata`): what a universe without its own has. The names are the world's words (Italian). */
export const SEED_STRATA: Readonly<Record<string, TerrainDef>> = Object.freeze({
  '1': { id: 'topsoil', name: 'terra', description: 'terra scura con radici e sassi', color: '#6b4a30', solid: true, layer: 'stratum' },
  '2': { id: 'clay', name: 'argilla', description: 'argilla rossiccia, compatta e umida', color: '#a0643f', solid: true, layer: 'stratum' },
  '3': { id: 'sandbed', name: 'sabbia compatta', description: 'sabbia pressata in falde chiare', color: '#bfa064', solid: true, layer: 'stratum' },
  '4': { id: 'mud', name: 'fango', description: 'fango nero sotto le acque', color: '#463a2e', solid: true, layer: 'stratum' },
  '5': { id: 'bedrock', name: 'roccia viva', description: 'la roccia su cui poggia tutto', color: '#6d6a68', solid: true, layer: 'stratum' },
  // What the programs of the seed's environments write besides the draft (T478): the water under the ground, the ore, the roots of the woods.
  '6': { id: 'aquifer', name: 'falda', description: "ghiaia intrisa d'acqua dove scorre la falda", color: '#3768b0', solid: true, layer: 'stratum' },
  '7': { id: 'ore', name: 'vena', description: 'una vena di minerale scuro e lucente nella roccia', color: '#b08d3c', solid: true, layer: 'stratum' },
  '8': { id: 'roots', name: 'radici', description: 'terra fitta di radici sotto il bosco', color: '#4a3522', solid: true, layer: 'stratum' },
});

const HEX = /^#[0-9a-f]{6}$/i;
const BAD_CODES = '?*/[]';

/** Why a generator's `strata` is not good (in words), or nothing: codes of one character, a name, a colour, the layer `stratum`. */
export function strataErrors(strata: unknown): string[] {
  if (!strata || typeof strata !== 'object' || Array.isArray(strata)) return ['strata deve essere un oggetto codice → terreno'];
  const errors: string[] = [];
  const entries = Object.entries(strata as Record<string, unknown>);
  if (entries.length > 16) errors.push('strata: al massimo 16 strati');
  for (const [code, raw] of entries) {
    const t = raw as Partial<TerrainDef> | null;
    if (code.length !== 1 || BAD_CODES.includes(code)) errors.push(`codice di strato "${code}" non valido`);
    if (!t || typeof t !== 'object' || typeof t.name !== 'string' || !t.name || typeof t.color !== 'string' || !HEX.test(t.color)) errors.push(`strato "${code}" incompleto (name, color #rrggbb)`);
    else if (t.layer !== 'stratum') errors.push(`strato "${code}": layer deve essere stratum`);
    else if (t.id !== undefined && (typeof t.id !== 'string' || !/^[a-z][a-z0-9_]{0,31}$/.test(t.id))) errors.push(`strato "${code}": id non valido`);
  }
  return errors;
}

/**
 * The terrains of the strata a world has: the seed's, with the generator's own over them code by code (a stratum that is not good is left
 * out, never the rest). So every role of the draft is always there, and a world that names its own strata sees them.
 */
export function strataPalette(own: unknown): Record<string, TerrainDef> {
  const out: Record<string, TerrainDef> = { ...SEED_STRATA };
  if (!own || typeof own !== 'object' || Array.isArray(own)) return out;
  for (const [code, t] of Object.entries(own as Record<string, unknown>))
    if (!strataErrors({ [code]: t }).length) out[code] = { ...(t as TerrainDef), solid: true, layer: 'stratum' };
  return out;
}

/** The code of a role in a palette of strata: the world's own first (the last with that id), the seed's otherwise. */
export function roleCodes(palette: Record<string, TerrainDef>): Record<StratumRole, string> {
  const seed = (role: StratumRole) => Object.keys(SEED_STRATA).find((c) => SEED_STRATA[c]!.id === role)!;
  const out = {} as Record<StratumRole, string>;
  for (const role of STRATUM_ROLES) {
    const own = Object.keys(palette).filter((c) => palette[c]!.id === role && palette[c] !== SEED_STRATA[c]);
    out[role] = own.at(-1) ?? seed(role);
  }
  return out;
}

/** What a column is, for the draft of its strata: from its tile of the procedural draft. */
export type Biome = 'wet' | 'rock' | 'sand' | 'soil';

/** The biome of a code of the procedural draft (and of its terrain): water and sea, rock and mountain, sand, the rest. */
export function biomeOf(code: string, terrain: TerrainDef | undefined): Biome {
  if (terrain?.layer === 'liquid' || code === 'o' || code === 'w') return 'wet';
  if (terrain?.layer === 'rock' || code === 'r' || code === 'k') return 'rock';
  if (code === 's' || terrain?.id === 'sand') return 'sand';
  return 'soil';
}

/**
 * The column of strata under a tile, from the top (the first tile under the ground) down: the roles, from its biome and a hash of the tile
 * and the world's seed. Soil: earth one or two tiles deep, clay, the bedrock from two or three; sand: packed sand, clay, bedrock; under
 * water: mud, then clay and bedrock; rock: bedrock all the way.
 */
export function columnRoles(biome: Biome, x: number, y: number, seed: number, depth = STRATA_DEPTH): StratumRole[] {
  const h = hash32(seed, x, y, 4513);
  const top = 1 + (h & 1);
  const rock = Math.max(top, 2 + ((h >> 1) & 1));
  const out: StratumRole[] = [];
  for (let d = 0; d < depth; d++) {
    if (biome === 'rock') out.push('bedrock');
    else if (d >= rock + (biome === 'wet' ? 1 : 0)) out.push('bedrock');
    else if (d < top) out.push(biome === 'wet' ? 'mud' : biome === 'sand' ? 'sandbed' : 'topsoil');
    else out.push('clay');
  }
  return out;
}

/**
 * The draft of the strata of a place (ADR-0091 point 5): `depth` rows of `S × S` codes of the palette of the strata, the first row the
 * first tile under the ground (`STRATA_DEPTH` for a new plan, `STRATA_DEPTH_BEFORE` for one of before: its first rows are the same).
 * Deterministic from the place, its procedural draft and the world's seed.
 */
export function draftStrata(
  draft: string,
  cx: number,
  cy: number,
  S: number,
  seed: number,
  palette: Record<string, TerrainDef>,
  strata: Record<string, TerrainDef>,
  depth = STRATA_DEPTH,
): string[] {
  const codes = roleCodes(strata);
  const rows: string[][] = Array.from({ length: depth }, () => []);
  for (let i = 0; i < S * S; i++) {
    const code = draft[i] ?? '';
    const roles = columnRoles(biomeOf(code, palette[code]), cx * S + (i % S), cy * S + Math.floor(i / S), seed, depth);
    roles.forEach((r, d) => rows[d]!.push(codes[r]));
  }
  return rows.map((r) => r.join(''));
}

/**
 * The strata of a plan or of a place sent over the wire, read without trusting them: `depth` strings of `S × S` codes the palette of the
 * strata has (a plan's, `strataDepthOf`; over the wire either of the two depths). Anything else is undefined (the draft says them again).
 */
export function readStrata(value: unknown, S: number, strata: Record<string, TerrainDef>, depth?: number): string[] | undefined {
  if (!Array.isArray(value) || (depth === undefined ? value.length !== STRATA_DEPTH && value.length !== STRATA_DEPTH_BEFORE : value.length !== depth)) return undefined;
  for (const row of value) {
    if (typeof row !== 'string' || row.length !== S * S) return undefined;
    for (const c of row) if (!Object.hasOwn(strata, c)) return undefined;
  }
  return value.slice() as string[];
}

/**
 * The row of strata at a depth under the ground (tiles), of a place with `rows` of them: the one it falls in, the last one deeper down, the
 * first one above the ground.
 */
export const stratumRow = (depth: number, rows = STRATA_DEPTH): number => (Number.isFinite(depth) ? Math.min(rows - 1, Math.max(0, Math.floor(depth))) : 0);

// ---------------------------------------------------------------------------------------------------------------- the strata as rules (T478)

/**
 * What a program of the strata may do (T478, ADR-0249): its text; the steps of a run (the validator wants it finished within them on every
 * draft of trial, and a run cut by its steps is the same on every machine); the milliseconds of a run, a safety a program the validator took
 * never meets (a run cut by the time is not the same everywhere: the place keeps the draft's strata).
 */
export const STRATA_LIMITS = { chars: 8000, steps: 20_000, ms: 500 } as const;

/**
 * The symmetries that keep the up and the down: turns and mirrors in the plane. MarkovJunior's default in 3D turns a rule every way of the
 * cube, and «under the grass the earth» becomes «beside the grass the earth» (T459 § 4.1).
 */
const UPRIGHT: ReadonlySet<Sym> = new Set<Sym>(['xy', 'x', 'y', 'none']);
/** The nodes a program of the strata is made of: rules and their order. Nothing that reads files, infers, draws paths, maps or makes waves. */
const STRATA_NODES: ReadonlySet<string> = new Set(['one', 'all', 'prl', 'sequence', 'markov']);
/** The colour a numbered symbol of a program of the strata has to compile (`#1` is the seed's earth): only the strata's own colours are drawn. */
const DIGIT_COLOURS: Readonly<Record<string, string>> = Object.freeze(Object.fromEntries([...'0123456789'].map((d) => [d, '#808080'])));
/** The base code of the draft a biome stands for, to a program that does not read a code of the draft (the sea is water to it, the mountain rock). */
const BIOME_BASE: Readonly<Record<Biome, string>> = { wet: 'w', rock: 'r', sand: 's', soil: 'g' };

/** A program of the strata compiled for a box: the model, the grid's alphabet (the empty cell, its first value, then its symbols), its first value. */
interface StrataProgram {
  model: MjxModel;
  alphabet: string[];
  background: string;
}

/** The programs compiled, by box and text (a world has a few, one an environment). */
const compiled = new Map<string, StrataProgram | { error: string }>();

/** Why a program's nodes are not those of the strata (only rules and their order, upright), into `out`. */
function shapeErrors(node: Node3, out: Set<string>): void {
  if (!STRATA_NODES.has(node.type)) {
    out.add(`<${node.type === 'conv' ? 'convolution' : node.type === 'shape' ? node.shape : node.type}> non serve agli strati: solo one, all, prl, sequence e markov`);
    return;
  }
  if (node.type === 'sequence' || node.type === 'markov') {
    for (const c of node.children) shapeErrors(c, out);
    return;
  }
  if (node.type !== 'one' && node.type !== 'all' && node.type !== 'prl') return;
  if (!UPRIGHT.has(node.symmetry ?? 'all') || node.rules.some((r) => r.symmetry !== undefined && !UPRIGHT.has(r.symmetry)))
    out.add('la simmetria tiene l\'alto e il basso: symmetry="(xy)" sulla radice (senza, MarkovJunior in 3D gira una regola in ogni verso del cubo e «sotto l\'erba la terra» diventa «accanto all\'erba la terra»)');
  if (node.fields?.length || node.observe?.length || node.search) out.add('niente field, observe né search: gli strati sono regole');
}

/** A program of the strata compiled for a place of side S and `depth` rows (one more layer on top, the surface), or why not. */
function compileStrata(xml: string, S: number, depth: number): StrataProgram | { error: string } {
  const key = `${S}|${depth}|${xml}`;
  const known = compiled.get(key);
  if (known) return known;
  let out: StrataProgram | { error: string };
  try {
    const model = compileMjx(xml, { size: [S, S, depth + 1], colors: DIGIT_COLOURS });
    const errors = new Set<string>();
    shapeErrors(model.program.program, errors);
    const unions = model.program.unions ?? {};
    out = errors.size
      ? { error: [...errors].join('; ') }
      : { model, alphabet: ['.', ...Object.keys(model.program.palette).filter((c) => c !== '.' && !Object.hasOwn(unions, c))], background: model.background };
  } catch (e) {
    out = { error: (e as Error).message };
  }
  if (compiled.size >= 64) compiled.clear();
  compiled.set(key, out);
  return out;
}

/**
 * What a program of the strata did on a place's draft (T478): per row (the first one under the ground) the stratum it decided per cell, '' where
 * it decided none; the cells it decided; the codes it wrote under the ground that are not strata; whether it finished, and whether its time ran out.
 */
export interface StrataRun {
  rows: string[][];
  decided: number;
  foreign: string[];
  finished: boolean;
  late: boolean;
}

/**
 * Runs a program of the strata on a place's draft (T478, ADR-0249): a grid S × S × (depth + 1), its top layer the surface (each column's
 * code of the draft where the program reads it, else the base code of its biome, else nothing, the program's first value), under it the
 * program's first value, the earth not yet decided. Never throws: what does not compile or run says why.
 */
export function runStrata(
  xml: unknown,
  draft: string,
  S: number,
  seed: number,
  palette: Record<string, TerrainDef>,
  strata: Record<string, TerrainDef>,
  depth = STRATA_DEPTH,
): StrataRun | { error: string } {
  if (typeof xml !== 'string' || !xml.trim()) return { error: 'strata è il testo XML di un programma MarkovJunior' };
  if (xml.length > STRATA_LIMITS.chars) return { error: `strata: al più ${STRATA_LIMITS.chars} caratteri` };
  if (!Number.isInteger(S) || S < 1 || S > 64 || !Number.isInteger(depth) || depth < 1 || depth > 16) return { error: 'strata: luogo fuori misura' };
  const p = compileStrata(xml, S, depth);
  if ('error' in p) return p;
  const index = new Map(p.alphabet.map((c, i) => [c, i] as const));
  const layer = S * S;
  const g: Grid3 = { X: S, Y: S, Z: depth + 1, cells: new Uint8Array(layer * (depth + 1)), alphabet: p.alphabet.slice(), log: [], epoch: 0 };
  for (let i = 0; i < layer; i++) {
    const code = draft[i] ?? '';
    g.cells[depth * layer + i] = (code !== '.' ? index.get(code) : undefined) || index.get(BIOME_BASE[biomeOf(code, palette[code])]) || 0;
  }
  let finished: boolean, steps: number;
  try {
    ({ finished, steps } = runOn(g, p.model.program, seed, STRATA_LIMITS.steps, { side: 64, cells: 64 * 64 * 64 }, { deadline: STRATA_LIMITS.ms }));
  } catch (e) {
    return { error: (e as Error).message };
  }
  const rows: string[][] = [];
  const foreign = new Set<string>();
  let decided = 0;
  for (let d = 0; d < depth; d++) {
    const row: string[] = [];
    const z = (depth - 1 - d) * layer;
    for (let i = 0; i < layer; i++) {
      const c = g.alphabet[g.cells[z + i]!] ?? '.';
      if (c !== '.' && Object.hasOwn(strata, c)) {
        row.push(c);
        decided++;
      } else {
        row.push('');
        if (c !== '.') foreign.add(c);
      }
    }
    rows.push(row);
  }
  return { rows, decided, foreign: [...foreign], finished, late: !finished && steps < STRATA_LIMITS.steps };
}

/**
 * The strata of a place by its environment's program (T478, ADR-0249): the program's stratum where it decided one, the draft's (`draftStrata`)
 * in every other cell; the draft's everywhere, with the reason, where the program does not compile or run or its time ran out. Deterministic
 * from the place, its draft, the program and the world's seed.
 */
export function programStrata(
  xml: unknown,
  draft: string,
  cx: number,
  cy: number,
  S: number,
  seed: number,
  palette: Record<string, TerrainDef>,
  strata: Record<string, TerrainDef>,
  depth = STRATA_DEPTH,
): { rows: string[]; error?: string } {
  const fallback = draftStrata(draft, cx, cy, S, seed, palette, strata, depth);
  const run = runStrata(xml, draft, S, hash32(seed, cx, cy, 4519), palette, strata, depth);
  if ('error' in run) return { rows: fallback, error: run.error };
  if (run.late) return { rows: fallback, error: `non finisce in ${STRATA_LIMITS.ms} ms` };
  return {
    rows: fallback.map((row, d) => {
      let out = '';
      for (let i = 0; i < row.length; i++) out += run.rows[d]![i] || row[i];
      return out;
    }),
  };
}

/**
 * The program of the strata the Genesis shows the Cartographer as an example (T478): what lies under what in a temperate land, with the codes
 * of its strata (T topsoil, C clay, A packed sand, M mud, B bedrock, V a vein); offline the local models answer it.
 */
export const STRATA_EXAMPLE = `<sequence values="EgtjswokrTCAMBV" symmetry="(xy)">
  <union symbol="?" values="gtj"/>
  <all in="? E" out="* T"/>
  <all in="s E" out="s A"/>
  <all in="w E" out="w M"/>
  <all in="o E" out="o M"/>
  <all in="k E" out="k B"/>
  <all in="r E" out="r B"/>
  <prl in="T E" out="T T" p="0.5" steps="1"/>
  <all in="T E" out="T C"/>
  <all in="A E" out="A C"/>
  <all in="M E" out="M C"/>
  <prl in="C E" out="C C" p="0.5" steps="2"/>
  <all in="C E" out="C B"/>
  <all in="B E" out="B B"/>
  <one in="B" out="V" steps="3"/>
  <prl in="VB" out="VV" p="0.3" steps="3"/>
</sequence>`;

/** The strata a program may write, as it writes them (`#1 terra`), at most twelve: what the validator and the Genesis tell the Cartographer. */
export function strataLine(strata: Record<string, TerrainDef>): string {
  const codes = Object.keys(strata).filter(isSymbolCode);
  return codes.slice(0, 12).map((c) => `${symbolName(c)} ${strata[c]!.name}`).join(', ') + (codes.length > 12 ? ', …' : '');
}

/**
 * Why an environment's program of the strata is not good (T478, ADR-0249), or nothing: run as the world runs it on every draft of trial
 * (`sampleDrafts`, a draft its rows), it is made of rules and their order with a symmetry that keeps the up and the down, its first value is
 * the earth not yet decided (neither a stratum nor a code of the drafts), it finishes within its steps, it writes under the ground only strata,
 * and on the drafts it decides some.
 */
export function strataProgramErrors(xml: unknown, drafts: string[][], palette: Record<string, TerrainDef>, strata: Record<string, TerrainDef>, depth = STRATA_DEPTH): string[] {
  if (typeof xml !== 'string' || !xml.trim()) return ['strata è il testo XML di un programma MarkovJunior'];
  if (xml.length > STRATA_LIMITS.chars) return [`strata: al più ${STRATA_LIMITS.chars} caratteri`];
  const S = drafts[0]?.length ?? 18;
  const p = compileStrata(xml, S, depth);
  if ('error' in p) return [p.error];
  const errors = new Set<string>();
  const first = symbolName(p.background);
  if (Object.hasOwn(strata, p.background)) errors.add(`il primo valore («${first}») è la terra ancora da decidere, non uno strato`);
  if (drafts.some((d) => d.some((row) => row.includes(p.background)))) errors.add(`il primo valore («${first}») è la terra ancora da decidere, non un codice della superficie`);
  let decided = 0;
  drafts.forEach((rows, i) => {
    const r = runStrata(xml, rows.join(''), rows.length, 1 + i, palette, strata, depth);
    if ('error' in r) {
      errors.add(r.error);
      return;
    }
    if (!r.finished) errors.add(r.late ? `non finisce in ${STRATA_LIMITS.ms} ms` : `non finisce in ${STRATA_LIMITS.steps} passi: usa "steps"`);
    if (r.foreign.length) errors.add(`scrive sotto il suolo ${r.foreign.map(symbolName).join(', ')}, che non sono strati (gli strati: ${strataLine(strata)})`);
    decided += r.decided;
  });
  if (!decided && !errors.size) errors.add('non decide nessuno strato sulle bozze di prova: le regole leggono la superficie (i codici della bozza) e scrivono gli strati sotto');
  return [...errors];
}

// ------------------------------------------------------------------------------------------------------------- the strata in the Council (T479)

const ROLE_SET: ReadonlySet<string> = new Set<string>(STRATUM_ROLES);

/**
 * The canonical key of a stratum (T479, ADR-0253), used in interior rules and on building forms: its internal `id` when it has one (`clay`,
 * `bedrock`, `aquifer`, `ore`, `roots`…), else an ASCII slug of its name (for custom Genesis strata with `role: 'other'`), else its code.
 */
export function stratumKey(def: Pick<TerrainDef, 'id' | 'name'>, code: string): string {
  if (def.id) return def.id;
  const slug = def.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return slug || code.toLowerCase();
}

/** Whether two stratum keys (or names) match, ignoring case and outer spaces. */
export const sameStratum = (a: string | undefined, b: string | undefined): boolean => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Concise list of the strata of a world for Council prompts (Engineer, unfocused Narrator). */
export function strataSummary(strata: Record<string, TerrainDef>): string {
  return Object.entries(strata)
    .filter(([code]) => isSymbolCode(code))
    .map(([code, t]) => `- ${stratumKey(t, code)} (${symbolName(code)}) = ${t.name} (${t.color})${t.description ? `: ${t.description}` : ''}`)
    .join('\n');
}

/**
 * The strata present under a place, as short names in the world's language (T479, ADR-0253), for the graph and the Narrator's context:
 * non-draft strata (aquifers, ore veins, roots, custom Genesis strata) come first so the Narrator always knows what is special beneath a
 * place; the remaining slots up to `max` take the most common strata (leaving generic topsoil for last when slots are tight), then ordered
 * from shallowest to deepest by mean depth.
 */
export function summarizePlaceStrata(rows: readonly string[], strata: Record<string, TerrainDef>, max = 4): string[] {
  if (!rows.length || max <= 0) return [];
  const stats = new Map<string, { name: string; count: number; depthSum: number; special: boolean; topsoil: boolean }>();
  for (let d = 0; d < rows.length; d++) {
    const row = rows[d]!;
    for (let i = 0; i < row.length; i++) {
      const def = strata[row[i]!];
      if (!def?.name) continue;
      const key = def.name.trim().toLowerCase();
      const special = !def.id || !ROLE_SET.has(def.id);
      const topsoil = def.id === 'topsoil';
      const cur = stats.get(key);
      if (cur) {
        cur.count++;
        cur.depthSum += d;
        if (special) cur.special = true;
        if (!topsoil) cur.topsoil = false;
      } else {
        stats.set(key, { name: def.name, count: 1, depthSum: d, special, topsoil });
      }
    }
  }
  const all = [...stats.values()];
  const specials = all.filter((s) => s.special).sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : 1));
  const common = all.filter((s) => !s.special).sort((a, b) => Number(a.topsoil) - Number(b.topsoil) || b.count - a.count || (a.name < b.name ? -1 : 1));
  const picked = [...specials, ...common].slice(0, max);
  picked.sort((a, b) => a.depthSum / a.count - b.depthSum / b.count || b.count - a.count || (a.name < b.name ? -1 : 1));
  return picked.map((s) => s.name);
}

/** One row of strata under a structure's lot (T479, ADR-0253), for the Sculptor Architect's request. */
export interface LotStratum {
  /** Row index below the soil (0 = 0–1 tiles, 1 = 1–2 tiles…). */
  depth: number;
  code: string;
  key: string;
  name: string;
  description?: string;
  color: string;
  /** Other notable (non-draft) strata also present in this row under the lot (e.g. an aquifer or an ore vein). */
  also?: Array<{ name: string; color: string; description?: string }>;
}

/**
 * Samples the strata row by row under an integer tile box `[x0..x1] × [y0..y1]` (T479, ADR-0253): for each row `0 .. depth - 1`, the
 * dominant stratum under the lot plus any non-draft stratum (aquifer, vein, roots, custom) also present in that row.
 */
export function sampleLotStrata(
  read: (col: number, row: number, depth: number) => { code: string; def: TerrainDef } | undefined,
  box: { x0: number; y0: number; x1: number; y1: number },
  depth = STRATA_DEPTH,
): LotStratum[] {
  const out: LotStratum[] = [];
  for (let d = 0; d < depth; d++) {
    const counts = new Map<string, { code: string; def: TerrainDef; n: number }>();
    for (let r = box.y0; r <= box.y1; r++)
      for (let c = box.x0; c <= box.x1; c++) {
        const hit = read(c, r, d);
        if (!hit) continue;
        const cur = counts.get(hit.code);
        if (cur) cur.n++;
        else counts.set(hit.code, { code: hit.code, def: hit.def, n: 1 });
      }
    if (!counts.size) continue;
    const ranked = [...counts.values()].sort((a, b) => b.n - a.n || (a.code < b.code ? -1 : 1));
    const top = ranked[0]!;
    const seenNames = new Set([top.def.name.toLowerCase()]);
    const also: Array<{ name: string; color: string; description?: string }> = [];
    for (const item of ranked.slice(1)) {
      const special = !item.def.id || !ROLE_SET.has(item.def.id);
      const low = item.def.name.toLowerCase();
      if (!special || seenNames.has(low)) continue;
      seenNames.add(low);
      also.push({ name: item.def.name, color: item.def.color, ...(item.def.description ? { description: item.def.description } : {}) });
    }
    out.push({
      depth: d,
      code: top.code,
      key: stratumKey(top.def, top.code),
      name: top.def.name,
      ...(top.def.description ? { description: top.def.description } : {}),
      color: top.def.color,
      ...(also.length ? { also } : {}),
    });
  }
  return out;
}

/**
 * The dominant stratum a cellar is dug into under an integer tile box (T479, ADR-0253), for the Scenografo's per-stratum cellar rules:
 * sampled at row `Math.floor(cellarTiles)` (for a 1-tile cellar, 20 voxels = 1.25 tiles at 16 vpt, row 1 is where clay, aquifer, roots or
 * bedrock sit; for deeper cellars row 2 or 3). Undefined without a cellar or without loaded tiles.
 */
export function dominantCellarStratum(
  read: (col: number, row: number, depth: number) => { code: string; def: TerrainDef } | undefined,
  box: { x0: number; y0: number; x1: number; y1: number },
  cellarTiles: number,
): { code: string; key: string; def: TerrainDef } | undefined {
  if (!Number.isFinite(cellarTiles) || cellarTiles <= 0) return undefined;
  const d = Math.max(1, Math.floor(cellarTiles));
  const counts = new Map<string, { code: string; def: TerrainDef; n: number }>();
  for (let r = box.y0; r <= box.y1; r++)
    for (let c = box.x0; c <= box.x1; c++) {
      const hit = read(c, r, d);
      if (!hit) continue;
      const cur = counts.get(hit.code);
      if (cur) cur.n++;
      else counts.set(hit.code, { code: hit.code, def: hit.def, n: 1 });
    }
  if (!counts.size) return undefined;
  const top = [...counts.values()].sort((a, b) => b.n - a.n || (a.code < b.code ? -1 : 1))[0]!;
  return { code: top.code, key: stratumKey(top.def, top.code), def: top.def };
}
