// Image operations the kernel needs but cannot do itself (they need a canvas). The browser provides
// an implementation (src/render/imagetools.ts); headless (tests) there is none and nothing is painted.

import type { TileDef } from './types';

/** Painted neighbours by direction: n, s, e, w, ne, nw, se, sw → data URL of their inner image. */
export type Neighbours = Partial<Record<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw', string>>;

export interface ImageTools {
  /** A (size+2·margin)² tile canvas: neighbours' borders (or black) around the colour-coded layout. */
  composeLayout(grid: string[], palette: Record<string, TileDef>, neighbours: Neighbours, margin: number): Promise<string>;
  /** The inner size×size tiles of a painted canvas, resized to px×px. */
  cropInner(dataUrl: string, size: number, margin: number, px: number): Promise<string>;
  /** Removes the flat background colour, trims, fits into px×px with transparency. */
  cutSprite(dataUrl: string, px: number): Promise<string>;
  downscale(dataUrl: string, px: number): Promise<string>;
}

/** Tiles of painted context around a chunk on the canvas sent to the image model. */
export const PAINT_MARGIN = 2;
/** Resolution of a stored chunk image, per tile. */
export const TILE_PX = 48;
