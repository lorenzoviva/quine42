// The strata of the ground (T418, ADR-0091 point 5, T52d reduced): what lies under every tile, as rows of terrains a tile deep.
// The terrains of the strata are the generator's `strata` (layer `stratum`), the seed's when a universe has none; the draft of the strata
// is written column by column from the tile and its biome (the procedural draft's code), deterministic from the world's seed. A plan keeps
// them (`ChunkPlan.strata`), a plan of before has them again from its draft. They are only a look: they block nothing and nobody stands
// in them (a body under the ground stands in a model). Pure functions: no kernel, no three.js.

import { hash32 } from './rng';
import type { TerrainDef } from './types';

/** How many rows of strata a place has under its ground (tiles): the seed's deepest cellar (3) and one more. */
export const STRATA_DEPTH = 4;

/** What a stratum is in the draft, whatever the world calls it: the ids the draft looks for. */
export type StratumRole = 'topsoil' | 'clay' | 'sandbed' | 'mud' | 'bedrock';

/** The seed's strata (`world.terrain → strata`): what a universe without its own has. The names are the world's words (Italian). */
export const SEED_STRATA: Readonly<Record<string, TerrainDef>> = Object.freeze({
  '1': { id: 'topsoil', name: 'terra', description: 'terra scura con radici e sassi', color: '#6b4a30', solid: true, layer: 'stratum' },
  '2': { id: 'clay', name: 'argilla', description: 'argilla rossiccia, compatta e umida', color: '#a0643f', solid: true, layer: 'stratum' },
  '3': { id: 'sandbed', name: 'sabbia compatta', description: 'sabbia pressata in falde chiare', color: '#bfa064', solid: true, layer: 'stratum' },
  '4': { id: 'mud', name: 'fango', description: 'fango nero sotto le acque', color: '#463a2e', solid: true, layer: 'stratum' },
  '5': { id: 'bedrock', name: 'roccia viva', description: 'la roccia su cui poggia tutto', color: '#6d6a68', solid: true, layer: 'stratum' },
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
  for (const role of ['topsoil', 'clay', 'sandbed', 'mud', 'bedrock'] as const) {
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
 * The draft of the strata of a place (ADR-0091 point 5): `STRATA_DEPTH` rows of `S × S` codes of the palette of the strata, the first
 * row the first tile under the ground. Deterministic from the place, its procedural draft and the world's seed.
 */
export function draftStrata(
  draft: string,
  cx: number,
  cy: number,
  S: number,
  seed: number,
  palette: Record<string, TerrainDef>,
  strata: Record<string, TerrainDef>,
): string[] {
  const codes = roleCodes(strata);
  const rows: string[][] = Array.from({ length: STRATA_DEPTH }, () => []);
  for (let i = 0; i < S * S; i++) {
    const code = draft[i] ?? '';
    const roles = columnRoles(biomeOf(code, palette[code]), cx * S + (i % S), cy * S + Math.floor(i / S), seed);
    roles.forEach((r, d) => rows[d]!.push(codes[r]));
  }
  return rows.map((r) => r.join(''));
}

/**
 * The strata of a plan or of a place sent over the wire, read without trusting them: `STRATA_DEPTH` strings of `S × S` codes the palette
 * of the strata has. Anything else is undefined (the draft says them again).
 */
export function readStrata(value: unknown, S: number, strata: Record<string, TerrainDef>): string[] | undefined {
  if (!Array.isArray(value) || value.length !== STRATA_DEPTH) return undefined;
  for (const row of value) {
    if (typeof row !== 'string' || row.length !== S * S) return undefined;
    for (const c of row) if (!Object.hasOwn(strata, c)) return undefined;
  }
  return value.slice() as string[];
}

/** The row of strata at a depth under the ground (tiles): the one it falls in, the last one deeper down, the first one above the ground. */
export const stratumRow = (depth: number): number => (Number.isFinite(depth) ? Math.min(STRATA_DEPTH - 1, Math.max(0, Math.floor(depth))) : 0);
