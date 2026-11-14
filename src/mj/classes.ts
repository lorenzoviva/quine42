// One scale for everything the lab sculpts, so that assets never look out of proportion: a tile of the
// game is TILE voxels a side, and every class of asset has a fixed box (in tiles) that all its members
// share — every tree the same maximum height and width, every person the same box.
//
// TILE comes from the resolution study on people (lab/scripts/resolution.ts): below ~24 voxels of height
// a face does not read; a person of ~28-30 voxels is 1.5 tiles tall at 20 voxels a tile. In the game
// (40 px a tile) that is 2 px per voxel.

import type { Vec3 } from './engine';

export const TILE = 20;

export interface AssetClass {
  id: string;
  name: string;
  /** Box in tiles: width (x), depth (y), height (z). */
  tiles: [number, number, number];
  /** The model must reach at least this share of the box height (all members look the same size). */
  minHeight?: number;
  /** The size a member of the class has if nobody says (ADR-0092): the class's box is the box of this size. */
  taglia: SizeTier;
  /** Animation the kernel makes from the model. */
  animation?: 'walk' | 'wind';
  hint: string;
}

export const CLASSES: AssetClass[] = [
  { id: 'pebble', taglia: 'tiny', name: 'sasso', tiles: [0.5, 0.5, 0.4], hint: 'a thing that fits in a hand or little more' },
  { id: 'rock', taglia: 'small', name: 'roccia o masso', tiles: [1, 1, 0.8], minHeight: 0.5, hint: 'takes one tile; wider than tall' },
  { id: 'bush', taglia: 'small', name: 'cespuglio o pianta bassa', tiles: [1, 1, 0.8], minHeight: 0.5, animation: 'wind', hint: 'takes one tile' },
  { id: 'tree', taglia: 'large', name: 'albero', tiles: [2, 2, 3], minHeight: 0.8, animation: 'wind', hint: 'the trunk takes the central tile, the crown juts over the neighbouring ones' },
  { id: 'object', taglia: 'tiny', name: 'oggetto piccolo', tiles: [0.6, 0.6, 0.6], hint: 'jar, bucket, lantern, sack' },
  { id: 'furniture', taglia: 'medium', name: 'mobile o contenitore', tiles: [1, 1, 1], hint: 'chest, barrel, bed, counter: one tile' },
  { id: 'person', taglia: 'medium', name: 'persona', tiles: [1, 0.75, 1.5], minHeight: 0.8, animation: 'walk', hint: 'standing, facing front; big head (chibi style)' },
  { id: 'animal', taglia: 'small', name: 'animale piccolo', tiles: [0.75, 1, 0.75], minHeight: 0.6, animation: 'walk', hint: 'cat, dog, fox, hen; the snout toward the front' },
  { id: 'beast', taglia: 'large', name: 'animale grande o mostro', tiles: [1.25, 2, 1.5], minHeight: 0.6, animation: 'walk', hint: 'wolf, horse, bear, troll' },
  { id: 'monument', taglia: 'medium', name: 'colonna, statua, portale', tiles: [1, 1, 3], minHeight: 0.6, hint: 'one tile at the base, tall' },
  { id: 'building', taglia: 'medium', name: 'edificio piccolo', tiles: [2.5, 2.5, 2.5], minHeight: 0.6, hint: 'well, fountain, hut' },
  { id: 'structure', taglia: 'large', name: 'struttura grande', tiles: [5, 5, 4], minHeight: 0.5, hint: 'house with a courtyard, mill, tower, temple: a single model over several tiles, that one enters' },
];

// The sizes of D&D (ADR-0092), one scale for creatures and structures: the class gives the shape and the box
// of its usual size, the size scales it. A Medium creature takes one tile, a Large one 2 × 2, a Huge one 3 × 3, a
// Gargantuan one 4 × 4: the box of a class grows by the ratio of those spaces (a Medium structure is a house, larger
// than a Medium person, because its class is). Gargantuan is the largest; the two largest are rare in the world.

export type SizeTier = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export interface SizeDef {
  id: SizeTier;
  name: string;
  /** Linear scale against Medium: the side of the space a creature of this size takes in D&D, in tiles. */
  scala: number;
}

export const SIZE_TIERS: SizeDef[] = [
  { id: 'tiny', name: 'Minuscola', scala: 0.5 },
  { id: 'small', name: 'Piccola', scala: 0.75 },
  { id: 'medium', name: 'Media', scala: 1 },
  { id: 'large', name: 'Grande', scala: 2 },
  { id: 'huge', name: 'Enorme', scala: 3 },
  { id: 'gargantuan', name: 'Gargantuesca', scala: 4 },
];

export const sizeOf = (id: string | undefined): SizeDef | undefined => SIZE_TIERS.find((t) => t.id === id);

/** The rare sizes (ADR-0092): one Huge thing per zone of the world, one Gargantuan per realm (4 × 4 zones). */
export const RARE_SIZES: SizeTier[] = ['huge', 'gargantuan'];

/** A size's place in the scale (0 Tiny … 5 Gargantuan). */
export const sizeRank = (t: SizeTier) => SIZE_TIERS.findIndex((x) => x.id === t);

/** The box in tiles of a class at a size (its own if none): the class's box scaled by the ratio of the spaces. */
export function tilesOf(c: AssetClass, taglia?: string): [number, number, number] {
  const to = sizeOf(taglia), from = sizeOf(c.taglia)!;
  if (!to || to.id === from.id) return c.tiles;
  const k = to.scala / from.scala;
  return c.tiles.map((t) => Math.round(t * k * 4) / 4) as [number, number, number];
}

/** The largest side, in voxels, a model is run at: past it the model is written coarser (ADR-0049). */
export const MAX_SIDE = 120;

/** Voxels per tile for a box in tiles: the usual TILE, fewer for the boxes that would pass MAX_SIDE. */
export const densityOf = (tiles: [number, number, number]) => Math.min(TILE, Math.floor(MAX_SIDE / Math.max(...tiles)));

/**
 * The largest side, in voxels, a structure that grows by rules runs at (T338, ADR-0179): up to it a tile stays TILE voxels at
 * every size, so a larger size is a larger area at the same scale, where more fits, and not the same building drawn bigger.
 */
export const STRUCTURE_SIDE = 200;

/** The structures that grow by rules (ADR-0160): the class `structure` from Large up. Their parts keep their size in tiles. */
export const growsByRules = (c: AssetClass, taglia?: string): boolean => c.id === 'structure' && sizeRank(sizeOf(taglia)?.id ?? c.taglia) >= sizeRank('large');

/** Voxels per tile a class runs at, at a size: `densityOf`, but a structure that grows by rules keeps TILE up to STRUCTURE_SIDE (ADR-0179). */
export function densityFor(c: AssetClass, taglia?: string): number {
  const tiles = tilesOf(c, taglia);
  if (growsByRules(c, taglia)) return Math.min(TILE, Math.floor(STRUCTURE_SIDE / Math.max(...tiles)));
  return taglia ? densityOf(tiles) : TILE;
}

export const classOf = (id: string | undefined) => CLASSES.find((c) => c.id === id);

/** A box in tiles at a density, in voxels. */
export const voxelsOf = (tiles: readonly number[], vpt: number): Vec3 => tiles.map((t) => Math.max(4, Math.round(t * vpt))) as Vec3;

/**
 * The box of a class at a size at the density under MAX_SIDE (`densityOf`), as every class had it before ADR-0179: the handmade cards
 * keep it, their ceilings were measured there (ADR-0161).
 */
export function boxUnderMaxSide(c: AssetClass, taglia?: string): Vec3 {
  const tiles = tilesOf(c, taglia);
  return voxelsOf(tiles, taglia ? densityOf(tiles) : TILE);
}

/** The box of a class in voxels (at a size, if given: at the density that size runs at, `densityFor`). */
export function boxOf(c: AssetClass, taglia?: string): Vec3 {
  return voxelsOf(tilesOf(c, taglia), densityFor(c, taglia));
}

/**
 * The parts one lives in (T338, ADR-0179), their least measures in tiles: the same at every size. A small structure does not get
 * a smaller door, a lower storey or a narrower room: what does not fit is left out (a small fort is a tower, a small farm a house
 * with a lean-to). A person is 1 × 0.75 × 1.5 tiles and passes where the body (0.44 tiles) does; a room is the side of the largest
 * square of covered floor where one stands, the bays of the skeleton (29 voxels at 20) are the least.
 */
export const PARTS = {
  /** A door: as wide as a body passes and as tall as a person. */
  door: { width: 0.55, height: 1.5 },
  /** A storey: the clear height where one stands, floor to ceiling. */
  storey: { clear: 1.5 },
  /** A room: the side of the largest square of covered floor where one stands. */
  room: { side: 1.4 },
  /** A lean-to (a roof on posts, open on the sides): one stands under it, and it is deep enough to keep something dry. */
  shelter: { clear: 1.5, depth: 1 },
} as const;

/** The least measures of the parts in voxels at a density (rounded up: never under the measure in tiles). */
export function partVoxels(vpt: number) {
  const v = (t: number) => Math.ceil(t * vpt - 1e-9);
  return {
    door: { width: v(PARTS.door.width), height: v(PARTS.door.height) },
    storey: { clear: v(PARTS.storey.clear) },
    room: { side: v(PARTS.room.side) },
    shelter: { clear: v(PARTS.shelter.clear), depth: v(PARTS.shelter.depth) },
  };
}

/**
 * The words of a name or a description that say a class, by language (T310b): the Forge's schema says the class itself, this is the
 * fallback for what does not say it. Italian and English (the words a model may slip into); the other languages are T239's. The order
 * decides: the first class whose words are there wins.
 */
const CLASS_WORDS: Record<'it' | 'en', Array<[string, RegExp]>> = {
  it: [
    ['animal', /\b(gatto|cane|volpe|gallina|coniglio|topo|corvo|gufo|anatra|slime)\b/],
    ['beast', /\b(lupo|cavallo|orso|cervo|troll|drago|bue|mucca|cinghiale|mostro)\b/],
    ['person', /^$/],
    ['pebble', /\b(sasso|ciottolo)\b/],
    ['rock', /(roccia|masso|pietr|rocce|macigno|sperone|scoglio)/],
    ['tree', /(albero|pino|quercia|betulla|salice|palma|abete|faggio|bosco|giungla)/],
    ['bush', /(cespuglio|felce|siepe|arbusto|fungo|fiore|ceppo|canneto)/],
    ['monument', /(colonna|statua|portale|porta|obelisco|totem|menhir)/],
    ['building', /(pozzo|fontana|capanna|casetta|torre|edicola|forno)/],
    ['object', /(vaso|secchio|lanterna|sacco|brocca|candela|libro)/],
  ],
  en: [
    ['animal', /\b(cat|dog|fox|hen|chicken|rabbit|mouse|rat|crow|owl|duck|slime)\b/],
    ['beast', /\b(wolf|horse|bear|deer|stag|troll|dragon|ox|cow|boar|monster)\b/],
    ['person', /^$/],
    ['pebble', /\b(pebble|stone)\b/],
    ['rock', /\b(rocks?|boulders?|crag|outcrop|reef)\b/],
    ['tree', /\b(trees?|pine|oak|birch|willow|palm|fir|beech|woods?|jungle)\b/],
    ['bush', /\b(bush|fern|hedge|shrub|mushroom|flower|stump|reeds)\b/],
    ['monument', /\b(column|statue|portal|gate|obelisk|totem|menhir)\b/],
    ['building', /\b(well|fountain|hut|cottage|tower|shrine|oven|kiln)\b/],
    ['object', /\b(vase|jar|bucket|lantern|sack|jug|candle|book)\b/],
  ],
};

/** A guess from the name and description, for assets that do not say: the first class, in the order of the table, whose words (Italian or English) are there. */
export function guessClass(text: string, category?: string): AssetClass {
  const t = text.toLowerCase();
  const order = CLASS_WORDS.it.map(([id]) => id);
  for (const id of order) {
    if (id === 'person') {
      if (category === 'figure') return classOf('person')!;
      continue;
    }
    if ((['it', 'en'] as const).some((lang) => CLASS_WORDS[lang].find(([c]) => c === id)![1].test(t))) return classOf(id)!;
  }
  return classOf('furniture')!;
}
