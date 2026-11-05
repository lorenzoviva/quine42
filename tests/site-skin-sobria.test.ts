// The sober skin (T286): its logo and its icon are the drawings of proposal 04 of Claude (v2), element by element, as the tool writes
// them; the skin wears them in the bar, in the footer and as the favicon, and no longer the comic lettering.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROPOSAL, sectionOf, svgOf, unbundle } from '../tools/vesti/scritta';
import { LOGO_DRAWING, LOGO_ICON, LOGO_SECTION, drawingOf, drawingSvg, extractLogo } from '../tools/vesti/logo';

const ROOT = path.resolve(__dirname, '..');
const skinFile = (name: string) => fs.readFileSync(path.join(ROOT, 'site/skins/sobria', name), 'utf8');
const html = fs.readFileSync(path.join(ROOT, PROPOSAL), 'utf8');
const section = sectionOf(unbundle(html), LOGO_SECTION);
const extracted = extractLogo(html);

/** The elements of a drawing, each as the page wrote it. */
const elements = (body: string) => body.match(/<[a-z]+\b[^>]*>/g) ?? [];

describe('the logo of the sober skin', () => {
  it('is what the tool writes: the files are not edited by hand', () => {
    expect(skinFile('scritta.svg')).toBe(drawingSvg(extracted.scritta));
    expect(skinFile('icona.svg')).toBe(drawingSvg(extracted.icona));
  });

  it('is the proposal\'s drawing on the dark ground, element by element, in the same order', () => {
    for (const [file, id] of [['scritta.svg', LOGO_DRAWING], ['icona.svg', LOGO_ICON]] as const) {
      const proposal = svgOf(section, id);
      const ours = skinFile(file);
      expect(elements(ours).slice(1), file).toEqual(elements(proposal).slice(1));
      expect(ours.match(/viewBox="([^"]+)"/)?.[1]).toBe(proposal.match(/viewBox="([^"]+)"/)?.[1]);
    }
    // The Q as a circle with the carpet's rings, the six other letters as strokes: what the author saw in landing-tests/4-claude-2.png.
    expect(elements(extracted.scritta.body).filter((e) => e.startsWith('<circle'))).toHaveLength(7);
    expect(extracted.scritta.label).toBe('QUINE42');
  });

  it('holds only shapes', () => {
    expect(() => drawingOf('<svg id="x" viewBox="0 0 1 1" aria-label="QUINE42"><script>1</script></svg>', 'x')).toThrow(/forma/);
    expect(() => drawingOf('<svg id="x" viewBox="0 0 1 1" aria-label="QUINE42"><rect onclick="1"/></svg>', 'x')).toThrow(/attributo/);
    expect(() => drawingOf('<svg id="x" viewBox="0 0 1 1" aria-label="QUINE42"><g style="a"/></svg>', 'x')).toThrow(/attributo/);
    for (const file of ['scritta.svg', 'icona.svg']) expect(skinFile(file)).not.toMatch(/<script|\bon[a-z]+=|href=|style=/i);
  });

  it('is what the skin wears: the bar and the footer at the drawing\'s proportions, the icon as favicon, no comic lettering', () => {
    const css = skinFile('skin.css');
    expect(css).toContain("url('scritta.svg')");
    const [, , w, h] = extracted.scritta.viewBox.split(/\s+/);
    expect(css).toContain(`aspect-ratio: ${w} / ${h};`);
    expect(JSON.parse(skinFile('skin.json')).icona).toBe('icona.svg');
    expect(css).not.toMatch(/Bangers|skew\(/);
  });
});
