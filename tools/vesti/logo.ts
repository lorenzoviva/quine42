// The logo and the icon of the sober skin (T286): proposal 04 «Il cerchio e il tappeto» of Claude, v2 after the votes, the one the
// author chose for this skin (`landing-tests/4-claude-2.png`), taken from the page as it is. `npx vite-node --script tools/vesti/estrai.ts`
// writes site/skins/sobria/{scritta.svg, icona.svg}; tests/site-skin-sobria.test.ts checks that they are the proposal's drawings, element by element.
//
// The drawing is SVG already, so nothing is redrawn: the elements of the drawing go into a file of their own in the same order and with the same
// attributes, inside an `<svg>` that says only its viewBox and its text. What changes is only what the page around them said (`id`, `style`,
// `width`, `height`): the place and the size are the skin's.

import fs from 'node:fs';
import path from 'node:path';
import { PROPOSAL, sectionOf, svgOf, unbundle } from './scritta';

/** Its section, the drawing on the dark ground and the icon. */
export const LOGO_SECTION = 'dir4';
export const LOGO_DRAWING = 'dir4-scuro';
export const LOGO_ICON = 'dir4-icona';
/** The ground the proposal draws them on: the bowl of the Q is filled with it. */
export const LOGO_GROUND = '#090514';

export interface Drawing {
  viewBox: string;
  label: string;
  /** What is inside the `<svg>`, as the page wrote it. */
  body: string;
}

/** A drawing of the page: its viewBox, its text and its elements. */
export function drawingOf(page: string, id: string): Drawing {
  const svg = svgOf(page, id);
  const open = svg.match(/^<svg([^>]*)>/);
  if (!open) throw new Error(`il disegno ${id} non si apre`);
  const viewBox = open[1].match(/viewBox="([^"]+)"/)?.[1];
  const label = open[1].match(/aria-label="([^"]+)"/)?.[1];
  if (!viewBox || viewBox.split(/\s+/).map(Number).some((v) => !Number.isFinite(v))) throw new Error(`${id}: viewBox illeggibile`);
  if (!label) throw new Error(`${id}: il disegno non dice il suo testo`);
  const body = svg.slice(open[0].length, -'</svg>'.length);
  // Only shapes: nothing that runs, loads or points elsewhere.
  const tags = new Set([...body.matchAll(/<([a-z]+)\b/gi)].map((m) => m[1].toLowerCase()));
  const shapes = new Set(['circle', 'rect', 'path', 'g']);
  for (const tag of tags) if (!shapes.has(tag)) throw new Error(`${id}: un elemento che non è una forma, <${tag}>`);
  if (/\b(on[a-z]+|href|style|class)\s*=/i.test(body)) throw new Error(`${id}: un attributo che non disegna`);
  return { viewBox, label, body };
}

/** The proposal's logo and icon. */
export function extractLogo(html: string): { scritta: Drawing; icona: Drawing } {
  const section = sectionOf(unbundle(html), LOGO_SECTION);
  const scritta = drawingOf(section, LOGO_DRAWING);
  const icona = drawingOf(section, LOGO_ICON);
  if (scritta.label !== 'QUINE42' || icona.label !== 'QUINE42') throw new Error('non è il logo di QUINE42');
  // The proposal shows it on its dark ground: that is the colour of the bowl, and of the sober skin.
  const ground = section.match(new RegExp(`background:(#[0-9a-f]{6})[^>]*>\\s*<svg[^>]*id="${LOGO_DRAWING}"`, 'i'))?.[1]?.toLowerCase();
  if (ground !== LOGO_GROUND) throw new Error(`il fondo del disegno è ${ground}, non ${LOGO_GROUND}`);
  return { scritta, icona };
}

/** A drawing as a file of its own. */
export function drawingSvg(d: Drawing): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${d.viewBox}" role="img" aria-label="${d.label}">${d.body}</svg>\n`;
}

/** Writes the two files of the sober skin; gives back their paths. */
export function writeLogo(root: string): string[] {
  const { scritta, icona } = extractLogo(fs.readFileSync(path.join(root, PROPOSAL), 'utf8'));
  const files: Record<string, string> = { 'scritta.svg': drawingSvg(scritta), 'icona.svg': drawingSvg(icona) };
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(root, 'site', 'skins', 'sobria', name), text);
  return Object.keys(files).map((f) => path.join('site', 'skins', 'sobria', f));
}
