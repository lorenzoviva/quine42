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
  /** Animation the kernel makes from the model. */
  animation?: 'camminata' | 'vento';
  hint: string;
}

export const CLASSES: AssetClass[] = [
  { id: 'sasso', name: 'sasso', tiles: [0.5, 0.5, 0.4], hint: 'un oggetto che sta in una mano o poco più' },
  { id: 'roccia', name: 'roccia o masso', tiles: [1, 1, 0.8], minHeight: 0.5, hint: 'occupa una casella; più largo che alto' },
  { id: 'cespuglio', name: 'cespuglio o pianta bassa', tiles: [1, 1, 0.8], minHeight: 0.5, animation: 'vento', hint: 'occupa una casella' },
  { id: 'albero', name: 'albero', tiles: [2, 2, 3], minHeight: 0.8, animation: 'vento', hint: 'il tronco occupa la casella centrale, la chioma sporge sulle vicine' },
  { id: 'oggetto', name: 'oggetto piccolo', tiles: [0.6, 0.6, 0.6], hint: 'vaso, secchio, lanterna, sacco' },
  { id: 'mobile', name: 'mobile o contenitore', tiles: [1, 1, 1], hint: 'cassa, barile, letto, banco: una casella' },
  { id: 'persona', name: 'persona', tiles: [1, 0.75, 1.5], minHeight: 0.8, animation: 'camminata', hint: 'in piedi, di fronte; testa grande (stile chibi)' },
  { id: 'animale', name: 'animale piccolo', tiles: [0.75, 1, 0.75], minHeight: 0.6, animation: 'camminata', hint: 'gatto, cane, volpe, gallina; il muso verso il davanti' },
  { id: 'bestia', name: 'animale grande o mostro', tiles: [1.25, 2, 1.5], minHeight: 0.6, animation: 'camminata', hint: 'lupo, cavallo, orso, troll' },
  { id: 'monumento', name: 'colonna, statua, portale', tiles: [1, 1, 3], minHeight: 0.6, hint: 'una casella di base, alto' },
  { id: 'edificio', name: 'edificio piccolo', tiles: [2.5, 2.5, 2.5], minHeight: 0.6, hint: 'pozzo, fontana, capanna' },
  { id: 'grande', name: 'struttura grande', tiles: [5, 5, 4], minHeight: 0.5, hint: 'casa con cortile, mulino, torre, tempio: un solo modello su più caselle, in cui si entra' },
];

export const classOf = (id: string | undefined) => CLASSES.find((c) => c.id === id);

/** The box of a class in voxels. */
export const boxOf = (c: AssetClass): Vec3 => c.tiles.map((t) => Math.max(4, Math.round(t * TILE))) as Vec3;

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
