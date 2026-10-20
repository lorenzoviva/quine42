// Image operations the kernel needs but cannot do itself (they need a canvas). The browser provides
// an implementation (src/render/imagetools.ts); headless (tests) there is none and nothing is painted.

export interface ImageTools {
  /**
   * Cuts a cols×rows sheet into cells of px×px. `key` removes the flat background and trims each cell;
   * a cell that cannot be cleanly keyed comes back as '' (never show a magenta square).
   */
  cutGrid(dataUrl: string, cols: number, rows: number, px: number, opts?: { key?: boolean }): Promise<string[]>;
  /** Makes a texture tile seamlessly (offset-and-blend), resized to px×px. */
  makeSeamless(dataUrl: string, px: number): Promise<string>;
  /** Removes the flat background colour, trims, fits into px×px with transparency ('' if it cannot). */
  cutSprite(dataUrl: string, px: number): Promise<string>;
  downscale(dataUrl: string, px: number): Promise<string>;
}

/** Size of stored textures and sprites. */
export const TEXTURE_PX = 128;
export const SPRITE_PX = 128;
export const ICON_PX = 64;
