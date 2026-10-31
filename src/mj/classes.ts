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
  taglia: Taglia;
  /** Animation the kernel makes from the model. */
  animation?: 'camminata' | 'vento';
  hint: string;
}

export const CLASSES: AssetClass[] = [
  { id: 'sasso', taglia: 'minuscola', name: 'sasso', tiles: [0.5, 0.5, 0.4], hint: 'un oggetto che sta in una mano o poco più' },
  { id: 'roccia', taglia: 'piccola', name: 'roccia o masso', tiles: [1, 1, 0.8], minHeight: 0.5, hint: 'occupa una casella; più largo che alto' },
  { id: 'cespuglio', taglia: 'piccola', name: 'cespuglio o pianta bassa', tiles: [1, 1, 0.8], minHeight: 0.5, animation: 'vento', hint: 'occupa una casella' },
  { id: 'albero', taglia: 'grande', name: 'albero', tiles: [2, 2, 3], minHeight: 0.8, animation: 'vento', hint: 'il tronco occupa la casella centrale, la chioma sporge sulle vicine' },
  { id: 'oggetto', taglia: 'minuscola', name: 'oggetto piccolo', tiles: [0.6, 0.6, 0.6], hint: 'vaso, secchio, lanterna, sacco' },
  { id: 'mobile', taglia: 'media', name: 'mobile o contenitore', tiles: [1, 1, 1], hint: 'cassa, barile, letto, banco: una casella' },
  { id: 'persona', taglia: 'media', name: 'persona', tiles: [1, 0.75, 1.5], minHeight: 0.8, animation: 'camminata', hint: 'in piedi, di fronte; testa grande (stile chibi)' },
  { id: 'animale', taglia: 'piccola', name: 'animale piccolo', tiles: [0.75, 1, 0.75], minHeight: 0.6, animation: 'camminata', hint: 'gatto, cane, volpe, gallina; il muso verso il davanti' },
  { id: 'bestia', taglia: 'grande', name: 'animale grande o mostro', tiles: [1.25, 2, 1.5], minHeight: 0.6, animation: 'camminata', hint: 'lupo, cavallo, orso, troll' },
  { id: 'monumento', taglia: 'media', name: 'colonna, statua, portale', tiles: [1, 1, 3], minHeight: 0.6, hint: 'una casella di base, alto' },
  { id: 'edificio', taglia: 'media', name: 'edificio piccolo', tiles: [2.5, 2.5, 2.5], minHeight: 0.6, hint: 'pozzo, fontana, capanna' },
  { id: 'grande', taglia: 'grande', name: 'struttura grande', tiles: [5, 5, 4], minHeight: 0.5, hint: 'casa con cortile, mulino, torre, tempio: un solo modello su più caselle, in cui si entra' },
];

// The sizes of D&D (ADR-0092), one scale for creatures and structures: the class gives the shape and the box
// of its usual size, the size scales it. A Medium creature takes one tile, a Large one 2 × 2, a Huge one 3 × 3, a
// Gargantuan one 4 × 4: the box of a class grows by the ratio of those spaces (a Medium structure is a house, larger
// than a Medium person, because its class is). Gargantuan is the largest; the two largest are rare in the world.

export type Taglia = 'minuscola' | 'piccola' | 'media' | 'grande' | 'enorme' | 'gargantuesca';

export interface SizeDef {
  id: Taglia;
  name: string;
  /** Linear scale against Medium: the side of the space a creature of this size takes in D&D, in tiles. */
  scala: number;
}

export const TAGLIE: SizeDef[] = [
  { id: 'minuscola', name: 'Minuscola', scala: 0.5 },
  { id: 'piccola', name: 'Piccola', scala: 0.75 },
  { id: 'media', name: 'Media', scala: 1 },
  { id: 'grande', name: 'Grande', scala: 2 },
  { id: 'enorme', name: 'Enorme', scala: 3 },
  { id: 'gargantuesca', name: 'Gargantuesca', scala: 4 },
];

export const sizeOf = (id: string | undefined): SizeDef | undefined => TAGLIE.find((t) => t.id === id);

/** The rare sizes (ADR-0092): one Huge thing per zone of the world, one Gargantuan per realm (4 × 4 zones). */
export const RARE_SIZES: Taglia[] = ['enorme', 'gargantuesca'];

/** A size's place in the scale (0 Tiny … 5 Gargantuan). */
export const sizeRank = (t: Taglia) => TAGLIE.findIndex((x) => x.id === t);

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
    by(/\b(gatto|cane|volpe|gallina|coniglio|topo|corvo|gufo|anatra|slime)\b/, 'animale') ??
    by(/\b(lupo|cavallo|orso|cervo|troll|drago|bue|mucca|cinghiale|mostro)\b/, 'bestia') ??
    (category === 'figura' ? classOf('persona') : undefined) ??
    by(/\b(sasso|ciottolo)\b/, 'sasso') ??
    by(/(roccia|masso|pietr|rocce|macigno|sperone|scoglio)/, 'roccia') ??
    by(/(albero|pino|quercia|betulla|salice|palma|abete|faggio|bosco|giungla)/, 'albero') ??
    by(/(cespuglio|felce|siepe|arbusto|fungo|fiore|ceppo|canneto)/, 'cespuglio') ??
    by(/(colonna|statua|portale|porta|obelisco|totem|menhir)/, 'monumento') ??
    by(/(pozzo|fontana|capanna|casetta|torre|edicola|forno)/, 'edificio') ??
    by(/(vaso|secchio|lanterna|sacco|brocca|candela|libro)/, 'oggetto') ??
    classOf('mobile')!
  );
}
