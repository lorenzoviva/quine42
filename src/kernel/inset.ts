// The inset of a terrain (T548, C4 of docs/design/terreno-ricco.md § 3.2 A, ADR-0269): how much lower (or higher) than the relief the top
// of its tiles is drawn, in tiles, always less than a level of the relief (0.25). Only how it looks: the renderer draws the top of the tile
// and what stands on it with the same shift, and where a lower terrain meets a higher one the side it draws is the curb (a road under its
// sidewalk, the ballast of a railway over the ground, a ditch with its banks). The kernel never reads it: the body's level is the relief's,
// the network, the rule 10 of the steps, the water, nothing changes (`tests/rientro.test.ts`).
//
// `TerrainDef.inset` says it, read without trusting (`readInset`); a terrain that does not say it takes the one its name says (`insetByName`:
// the repair of the universes of before, without calls, never written to disk); `inset: 0` says none. The base ground (`g`) is the level
// of the world and has none. Pure and lean: the worker of the ground imports it.

/** The range of an inset in tiles: under a level of the relief (0.25), so it is never a step. */
export const INSET_LIMITS = [-0.2, 0.2] as const;

/** The step it is kept at (what the mesh shows: a hundredth of a tile). */
const STEP = 0.01;

/** The code of the base ground: the level of the world, never inset (lowering it would lower the world, and everything else would rise). */
export const BASE_GROUND = 'g';

/** An inset as it is said, without trusting: a finite number clamped to the range at its step; undefined where it is not one. */
export function readInset(raw: unknown): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
  const v = Math.round(Math.min(INSET_LIMITS[1], Math.max(INSET_LIMITS[0], raw)) / STEP) * STEP;
  return Number(v.toFixed(2)) || 0;
}

/** What is wrong with an inset a manifest says (the validator): nothing if it is a number in the range. */
export function insetErrors(code: string, raw: unknown): string[] {
  if (raw === undefined) return [];
  const [lo, hi] = INSET_LIMITS;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < lo || raw > hi) return [`tile "${code}": inset fra ${lo} e ${hi}`];
  if (code === BASE_GROUND && raw !== 0) return [`tile "${code}": il suolo di base non ha inset`];
  return [];
}

/** The kinds of inset a terrain's name says: the words (it and en, accents off) and how much. The road under its sidewalk is the curb. */
const KINDS: ReadonlyArray<{ kind: string; words: RegExp; inset: number }> = [
  // The ballast of a railway first: «binari sulla massicciata» stands over the ground beside it.
  { kind: 'ballast', words: /massicciat|\bbinar|ferrovi|\brotai|ballast|railway|railroad|\brails?\b|\btracks?\b/, inset: 0.06 },
  { kind: 'ditch', words: /\bfoss[oi]\b|\bfossett|canalett|cunett|\bscolin|\bditch|\btrench|\bgull(?:y|ies)\b|\bgutter/, inset: -0.18 },
  {
    kind: 'road',
    words: /\bstrad[ae]|asfalt|carreggiat|parchegg|\bcorso\b|\bviale\b|\bvia carrabil|\broads?\b|\bstreets?\b|asphalt|\bavenue|boulevard|carriageway|parking|\btarmac/,
    inset: -0.12,
  },
];

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** What a terrain says to its inset: its name, its id, where it is drawn, whether it is walked, what it says. */
export interface InsetTerrain {
  name?: unknown;
  id?: unknown;
  layer?: unknown;
  solid?: unknown;
  inset?: unknown;
}

/** The kind of inset a terrain's name (or its id) says, if any: only of the ground one walks (not a wall, a floor, the water, a wood). */
export function insetKind(t: InsetTerrain, code?: string): string | undefined {
  if (code === BASE_GROUND) return undefined;
  const ground = t.layer === 'ground' || (t.layer === undefined && t.solid === false);
  if (!ground || t.solid === true) return undefined;
  const words = fold([t.name, t.id].filter((s): s is string => typeof s === 'string').join(' '));
  return KINDS.find((k) => k.words.test(words))?.kind;
}

/** The inset a terrain's name says (the repair of the universes of before, T548), if any. */
export function insetByName(t: InsetTerrain, code?: string): number | undefined {
  const kind = insetKind(t, code);
  return KINDS.find((k) => k.kind === kind)?.inset;
}

/**
 * A terrain's inset as it is drawn: what it says (0 none), or, where it says nothing, what its name says; 0 for the base ground, for what
 * is not the ground one walks, and where nothing says it.
 */
export function insetOf(t: InsetTerrain | undefined, code?: string): number {
  if (!t || code === BASE_GROUND) return 0;
  const ground = t.layer === 'ground' || (t.layer === undefined && t.solid === false);
  if (!ground) return 0;
  if (t.inset !== undefined) return readInset(t.inset) ?? 0;
  return insetByName(t, code) ?? 0;
}
