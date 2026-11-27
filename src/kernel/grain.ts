// The grain of the ground (T547, C3 of docs/design/terreno-ricco.md, ADR-0267): the specks of one voxel a terrain's material shows over its
// colour (gravel, the ballast of a railway, dry leaves), drawn by the fragment shader of the ground from a hash of the position at
// 1/`GRAIN_CELLS` of a tile: no triangle more, no entity, nothing in the state nor on the wire. Only how a terrain looks.
//
// `TerrainDef.grain` says it (`{ color, density }`), read without trusting (`readGrain`); a terrain that does not say it takes the one its
// name says (`grainByName`: the repair of the universes of before, without calls, never written to disk); `density: 0` says none.
// Pure and lean: the worker of the ground imports it.

/** The specks of a terrain: their colour (#rrggbb) and how many of the cells of a tile carry one (0-`GRAIN_LIMITS.density[1]`). */
export interface Grain {
  color: string;
  density: number;
}

/** The cells of a speck along a tile's side: one voxel at 20 voxels a tile, the density of the terrains' models. */
export const GRAIN_CELLS = 20;

/** The step of the density (what the vertex attribute keeps: 4 bits) and its range: at most three cells in four. */
export const GRAIN_STEP = 0.05;
export const GRAIN_LIMITS = { density: [0, 15 * GRAIN_STEP] as const };

const HEX = /^#[0-9a-f]{6}$/i;

const round = (d: number) => Math.round(d / GRAIN_STEP) * GRAIN_STEP;

/**
 * A grain as it is said, without trusting it: an object with a colour #rrggbb and a finite density, clamped to the range and to its step.
 * `null` where it says none (density 0), undefined where what is there is not a grain (the terrain then has none either).
 */
export function readGrain(raw: unknown): Grain | null | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const { color, density } = raw as { color?: unknown; density?: unknown };
  if (typeof density !== 'number' || !Number.isFinite(density)) return undefined;
  const d = Math.min(GRAIN_LIMITS.density[1], Math.max(0, round(density)));
  if (d <= 0) return null;
  if (typeof color !== 'string' || !HEX.test(color)) return undefined;
  return { color: color.toLowerCase(), density: Number(d.toFixed(2)) };
}

/** What is wrong with a grain a manifest says (the validator): nothing if it is one (or says none). */
export function grainErrors(code: string, raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [`tile "${code}": grain è {color, density}`];
  const { color, density } = raw as { color?: unknown; density?: unknown };
  const errors: string[] = [];
  const [lo, hi] = GRAIN_LIMITS.density;
  if (typeof density !== 'number' || !Number.isFinite(density) || density < lo || density > hi) errors.push(`tile "${code}": grain.density fra ${lo} e ${hi}`);
  else if (density > 0 && (typeof color !== 'string' || !HEX.test(color))) errors.push(`tile "${code}": grain.color #rrggbb`);
  return errors;
}

/** The kinds of grain a terrain's name says: the words (it and en, accents off) and the specks' colour, mixed with the terrain's. */
const KINDS: ReadonlyArray<{ kind: string; words: RegExp; color: string; mix: number; density: number }> = [
  // The ballast of a railway first: «binari sulla massicciata» is not gravel of a path.
  { kind: 'ballast', words: /massicciat|\bbinar|ferrovi|\brotai|ballast|railway|railroad|\brails?\b|\btracks?\b/, color: '#8e8b84', mix: 0.75, density: 0.45 },
  { kind: 'gravel', words: /brecciol|ghiai|pietrisc|\bbreccia|gravel|shingle|\bgrit\b/, color: '#e0dacd', mix: 0.55, density: 0.35 },
  { kind: 'leaves', words: /foglie secch|foglie mort|fogli[ea] cadut|fogliame|lettiera|dead leaves|dry leaves|fallen leaves|leaf litter/, color: '#b0662c', mix: 0.8, density: 0.3 },
];

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/** `a` towards `b` by `t`, as #rrggbb. */
function mixHex(a: string, b: string, t: number): string {
  const x = hex(a), y = hex(b);
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** What a terrain says to its grain: its name, its id, where it is drawn, its colour. */
export interface GrainedTerrain {
  name?: unknown;
  id?: unknown;
  layer?: unknown;
  solid?: unknown;
  color?: unknown;
  grain?: unknown;
}

/** The kind of grain a terrain's name (or its id) says, if any: only of the ground one walks (not a wall, a floor, the water). */
export function grainKind(t: GrainedTerrain): string | undefined {
  const ground = t.layer === 'ground' || (t.layer === undefined && t.solid === false);
  if (!ground) return undefined;
  const words = fold([t.name, t.id].filter((s): s is string => typeof s === 'string').join(' '));
  return KINDS.find((k) => k.words.test(words))?.kind;
}

/** The grain a terrain's name says (the repair of the universes of before, T547): its kind's specks, mixed with the terrain's colour. */
export function grainByName(t: GrainedTerrain): Grain | undefined {
  const kind = KINDS.find((k) => k.kind === grainKind(t));
  if (!kind) return undefined;
  const base = typeof t.color === 'string' && HEX.test(t.color) ? t.color.toLowerCase() : kind.color;
  return { color: mixHex(base, kind.color, kind.mix), density: kind.density };
}

/** A terrain's grain: what it says (none with density 0), or, where it says nothing, what its name says. */
export function grainOf(t: GrainedTerrain | undefined): Grain | undefined {
  if (!t) return undefined;
  if (t.grain !== undefined) return readGrain(t.grain) ?? undefined;
  return grainByName(t);
}

/**
 * The fourth byte of the vertex attribute of a grained top (`terrainmesh.ts`): the density in steps in the high nibble (1-15) and the tile's
 * salt in the low one, so that two tiles at the same place of two chunks seldom have the same specks. 0 never: no grain.
 */
export function grainByte(g: Grain, salt: number): number {
  const level = Math.min(15, Math.max(1, Math.round(g.density / GRAIN_STEP)));
  return (level << 4) | (salt & 15);
}
