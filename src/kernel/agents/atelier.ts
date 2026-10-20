// The Atelier: the Artist's toolkit. Images are the expensive part of the universe, so the Atelier
// paints in batches (4 textures, 4 obstacles, 16 icons per image) and always paints in context:
//   - few-shot: example pairs (description → image already in the game) are sent along, so a new
//     character comes out in the same style, scale and palette;
//   - animation: either a whole walk sheet in one image, or frame by frame, each frame painted
//     looking at all the previous ones.
// The kernel cuts the sheets, keys out the background and makes textures seamless.

import type { Council } from './council';

export interface StylePair {
  description: string;
  /** Data URL of an image already in the game. */
  image: string;
}

export const DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export type Direction = (typeof DIRECTIONS)[number];
const DIR_WORDS: Record<Direction, string> = { down: 'walking towards the viewer (facing down)', left: 'walking to the left', right: 'walking to the right', up: 'walking away from the viewer (facing up)' };

const style = (c: Council) => `ART DIRECTION:\n${c.files['world/style.md'] ?? ''}`;
const KEY = 'Background: one flat uniform pure magenta (#FF00FF) colour everywhere around the subject, nothing else, so it can be cut out.';

export class Atelier {
  constructor(private c: Council) {}

  /** Up to 4 seamless ground textures in a 2×2 grid (top-left, top-right, bottom-left, bottom-right). */
  textures(terrains: Array<{ name: string; description: string }>): Promise<string | null> {
    const cells = ['TOP-LEFT', 'TOP-RIGHT', 'BOTTOM-LEFT', 'BOTTOM-RIGHT'];
    return this.c.paint(
      'art.textures',
      [
        style(this.c),
        'Paint a 2x2 grid of square, seamless, tileable top-down ground textures for a 2D game (each quadrant is one texture, edge to edge, no borders, no gaps, no labels).',
        ...terrains.slice(0, 4).map((t, i) => `${cells[i]}: ${t.name} — ${t.description}. Strictly top-down, uniform density, no single focal object, no shadows from outside, it must tile seamlessly when repeated.`),
        terrains.length < 4 ? `${cells.slice(terrains.length).join(', ')}: plain neutral grey.` : '',
      ].join('\n'),
      [],
      { terrains },
    );
  }

  /** Up to 4 obstacle sprites (trees, boulders, furniture…) in a 2×2 grid. */
  obstacles(things: Array<{ name: string; description: string }>): Promise<string | null> {
    const cells = ['TOP-LEFT', 'TOP-RIGHT', 'BOTTOM-LEFT', 'BOTTOM-RIGHT'];
    return this.c.paint(
      'art.obstacles',
      [
        style(this.c),
        'Paint a 2x2 grid of separate game sprites, each centred in its quadrant and filling about 75% of it, seen from a high top-down angle, crisp edges, no ground, no cast shadow, no text.',
        ...things.slice(0, 4).map((t, i) => `${cells[i]}: ${t.name} — ${t.description}.`),
        KEY,
      ].join('\n'),
      [],
      { things },
    );
  }

  /** A new sprite in the style of the examples (few-shot: each example image is described). */
  sprite(description: string, kind: 'npc' | 'oggetto' | 'strumento', examples: StylePair[]): Promise<string | null> {
    const shots = examples.slice(0, 3);
    return this.c.paint(
      'art.sprite',
      [
        style(this.c),
        shots.length ? `The ${shots.length} input image(s) are sprites already in the game. ${shots.map((s, i) => `Image ${i + 1}: ${s.description}.`).join(' ')}` : '',
        shots.length ? 'Paint a NEW sprite in exactly the same style, scale, line weight, palette and viewing angle as the examples.' : 'Paint a game sprite.',
        `New sprite: ${description}.`,
        kind === 'npc' ? 'A single character, full body, seen from a high top-down angle, facing down, standing.' : 'A single object seen from above, as it lies or stands on the ground.',
        'Centred, filling about 70% of the frame, no ground, no cast shadow, no text, no frame.',
        KEY,
      ]
        .filter(Boolean)
        .join('\n'),
      shots.map((s) => s.image),
      { description, kind },
    );
  }

  /** A whole walk cycle in one image: 4 rows (down, left, right, up) × 3 frames. */
  walkSheet(base: string, description: string): Promise<string | null> {
    return this.c.paint(
      'art.walksheet',
      [
        style(this.c),
        `The input image is the character "${description}".`,
        'Paint its walking animation as a sprite sheet: a grid of 4 rows and 3 columns of equal cells.',
        'Row 1: walking towards the viewer (down). Row 2: walking left. Row 3: walking right. Row 4: walking away (up).',
        'Columns: three successive frames of the walk cycle (left foot forward, passing, right foot forward).',
        'Same character, same size and position in every cell, same style as the input, no text, no grid lines.',
        KEY,
      ].join('\n'),
      [base],
      { description },
    );
  }

  /**
   * Frame-by-frame animation: every new frame is painted looking at the base sprite and all the frames
   * painted so far (more consistent, costs one image per frame).
   */
  async walkFrames(base: string, description: string, dir: Direction, count = 3, process: (raw: string) => Promise<string> = async (x) => x): Promise<string[]> {
    const frames: string[] = [];
    for (let i = 0; i < count; i++) {
      const raw = await this.c.paint(
        'art.frame',
        [
          style(this.c),
          `Input image 1 is the character "${description}" standing.${frames.length ? ` Input images 2-${frames.length + 1} are the first ${frames.length} frame(s) of its walk cycle, ${DIR_WORDS[dir]}.` : ''}`,
          `Paint frame ${i + 1} of ${count} of the walk cycle, ${DIR_WORDS[dir]}: it must continue the motion of the previous frames and keep exactly the same character, size, framing and style.`,
          KEY,
        ].join('\n'),
        [base, ...frames],
        { description, dir, frame: i },
      );
      if (!raw) break;
      frames.push(await process(raw));
    }
    return frames;
  }

  /** Up to 16 item icons in a 4×4 grid, in reading order; a previous sheet can anchor the style. */
  icons(items: Array<{ name: string; description: string }>, reference?: string): Promise<string | null> {
    return this.c.paint(
      'art.icons',
      [
        style(this.c),
        reference ? 'The input image is a sheet of icons already in the game: match its style exactly.' : '',
        'Paint a 4x4 grid of game item icons (16 equal cells, reading order left to right, top to bottom). Each icon centred in its cell, filling about 70% of it, seen from slightly above, crisp, no text, no grid lines.',
        ...items.slice(0, 16).map((it, i) => `Cell ${i + 1}: ${it.name} — ${it.description}.`),
        items.length < 16 ? `Cells ${items.length + 1}-16: empty.` : '',
        KEY,
      ]
        .filter(Boolean)
        .join('\n'),
      reference ? [reference] : [],
      { items },
    );
  }
}
