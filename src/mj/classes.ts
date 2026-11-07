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

export const classOf = (id: string | undefined) => CLASSES.find((c) => c.id === id);

/** The box of a class in voxels (at a size, if given: at the density that size runs at). */
export function boxOf(c: AssetClass, taglia?: string): Vec3 {
  const tiles = tilesOf(c, taglia);
  const vpt = taglia ? densityOf(tiles) : TILE;
  return tiles.map((t) => Math.max(4, Math.round(t * vpt))) as Vec3;
}

/** A guess from the name and description, for assets that do not say. */
export function guessClass(text: string, category?: string): AssetClass {
  const t = text.toLowerCase();
  const by = (re: RegExp, id: string) => (re.test(t) ? classOf(id) : undefined);
  return (
    by(/\b(gatto|cane|volpe|gallina|coniglio|topo|corvo|gufo|anatra|slime)\b/, 'animal') ??
    by(/\b(lupo|cavallo|orso|cervo|troll|drago|bue|mucca|cinghiale|mostro)\b/, 'beast') ??
    (category === 'figure' ? classOf('person') : undefined) ??
    by(/\b(sasso|ciottolo)\b/, 'pebble') ??
    by(/(roccia|masso|pietr|rocce|macigno|sperone|scoglio)/, 'rock') ??
    by(/(albero|pino|quercia|betulla|salice|palma|abete|faggio|bosco|giungla)/, 'tree') ??
    by(/(cespuglio|felce|siepe|arbusto|fungo|fiore|ceppo|canneto)/, 'bush') ??
    by(/(colonna|statua|portale|porta|obelisco|totem|menhir)/, 'monument') ??
    by(/(pozzo|fontana|capanna|casetta|torre|edicola|forno)/, 'building') ??
    by(/(vaso|secchio|lanterna|sacco|brocca|candela|libro)/, 'object') ??
    classOf('furniture')!
  );
}
