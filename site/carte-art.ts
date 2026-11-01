// The picture of a card (T104): a model's program run and photographed in 3/4 with the game's own code, as plain RGBA.
// No WebGL: a gallery of cards would need a context each, and the photo is what the Artist looks at too. Pure, so it
// runs in the worker of the page (carte-worker.ts) and in the tests.

import { runForm, type FormRequest } from '../src/kernel/forms';
import { DEFAULT_RENDER, render, shrink, type Picture } from '../src/mj/photo';

/** The width of a picture at most; the box of the card scales it, with no smoothing. */
const WIDTH = 240;
/** How many pixels a small model's voxel takes, at most. */
const MAX_PX = 6;

export function cardPicture(req: FormRequest): Picture {
  const { grid, palette } = runForm({ ...req, rig: false, sway: false });
  const px = Math.max(1, Math.min(MAX_PX, Math.floor(WIDTH / Math.max(grid.X, grid.Y + grid.Z, 1))));
  const pic = render({ ...grid, log: [], epoch: 0 }, palette, 0, { ...DEFAULT_RENDER, px, top: px, front: px, shadow: false });
  return shrink(pic, WIDTH);
}
