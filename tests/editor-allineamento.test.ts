import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { highlightXml } from '../lab/editor/syntax';

/**
 * The model editor draws the coloured text under a transparent textarea (T517): the two must put every letter at the same place, or
 * the text the author sees is not where the caret and the selection are. Two things decide it, and both are tested here without a
 * browser: the coloured layer holds exactly the source, letter for letter (no glyph of its own, no whitespace lost), and no token of
 * it is wider or narrower than the letters it shows (no width, padding, margin, gap, letter spacing or font size of its own).
 */

/** The text a browser shows for the markup: the tags dropped, the entities read. */
function shownText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

const PALETTE = { A: { color: 'ff0000', name: 'rosso' }, B: { color: '#00ff00', name: 'verde' } };

function expectSameText(src: string): void {
  expect(shownText(highlightXml(src, { colorChips: true, palette: PALETTE }))).toBe(src);
  expect(shownText(highlightXml(src))).toBe(src);
}

describe("l'editor dei modelli: il testo colorato sta sotto l'area di testo (T517)", () => {
  it('il forte dell’autore, lettera per lettera', () => {
    const fort = readFileSync(join('lab', 'mjx', 'models', 'handmade', 'forte-handmade.xml'), 'utf8');
    expect(fort.length).toBeGreaterThan(1000);
    expectSameText(fort);
  });

  it('ogni modello del seme', () => {
    const dir = join('universe', 'models');
    const files = readdirSync(dir).filter((f) => f.endsWith('.xml'));
    expect(files.length).toBeGreaterThan(10);
    for (const f of files) expectSameText(readFileSync(join(dir, f), 'utf8'));
  });

  it('gli spazi attorno a «=» e nei tag di chiusura, il filtro e i colori esadecimali', () => {
    expectSameText('<one in = "AB" out =\'B*\' p= 0.5 />');
    expectSameText('<sequence values="AB">\n\t<prl in="A.*" out="BB."></prl >\n</ sequence>');
    expectSameText('<color symbol="A" value="#ff0000"/>\n<color symbol="B" value="00ff00" />');
    expectSameText('<rule>\n  <in>AB\n# una nota\nBA</in>\n  <out>BB</out>\n</rule>');
    expectSameText('<one in=\'A"B\' out="BB"/>');
    expectSameText('<!-- ▦ commento -->\n<?xml version="1.0"?>\n< non un tag');
  });

  it('il pulsante del filtro non ha testo e non ha larghezza nel flusso', () => {
    const html = highlightXml('<one in="AB" out="BB"/>', { colorChips: true, palette: PALETTE });
    expect(html).toContain('<span class="tok-filter-anchor"><button class="tok-filter-btn"');
    expect(html).not.toContain('▦');
  });

  it('nessun token del CSS aggiunge o toglie larghezza alle sue lettere', () => {
    const css = readFileSync(join('lab', 'editor', 'editor.css'), 'utf8');
    const rule = (selector: string): Record<string, string> => {
      const at = css.indexOf(`\n${selector} {`);
      expect(at, selector).toBeGreaterThanOrEqual(0);
      const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
      const props: Record<string, string> = {};
      for (const decl of body.replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
        const colon = decl.indexOf(':');
        if (colon > 0) props[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim();
      }
      return props;
    };
    const px = (v: string | undefined, i: number): number => parseFloat((v ?? '0').split(/\s+/)[i] ?? '0') || 0;
    const horizontal = (v: string | undefined, right: boolean): number => {
      const parts = (v ?? '0').split(/\s+/);
      const i = parts.length === 1 ? 0 : right ? 1 : parts.length === 4 ? 3 : 1;
      return px(v, i);
    };

    // The two layers: the same font, size, spacing and tabs, nothing shaped differently.
    const layers = rule('.highlight-layer,\n.input-layer');
    expect(layers['letter-spacing']).toBe('2.5px');
    expect(layers['font-variant-ligatures']).toBe('none');
    expect(layers['font-kerning']).toBe('none');

    for (const selector of ['.tok-color-chip', '.tok-hex-code']) {
      const p = rule(selector);
      expect(p.width, selector).toBeUndefined();
      expect(p.gap, selector).toBeUndefined();
      expect(p.border, selector).toBeUndefined();
      expect(p['font-size'] ?? 'inherit', selector).toBe('inherit');
      expect(p['letter-spacing'] ?? 'inherit', selector).toBe('inherit');
      // On the baseline, as the textarea has its letters.
      expect(p['vertical-align'] ?? 'baseline', selector).toBe('baseline');
      // Padding and margin may not change the advance (nor, with the letter at the left of its box, move it).
      const advance =
        horizontal(p.padding, false) + horizontal(p.padding, true) + horizontal(p.margin, false) + horizontal(p.margin, true);
      expect(advance, selector).toBe(0);
    }
    for (const selector of ['.tok-comment', '.tok-meta', '.tok-tag', '.tok-mj-node', '.tok-attr', '.tok-mj-attr', '.tok-val', '.tok-punct']) {
      const p = rule(selector);
      for (const prop of ['width', 'padding', 'margin', 'gap', 'border', 'letter-spacing', 'font-size', 'font-family']) {
        expect(p[prop], `${selector} ${prop}`).toBeUndefined();
      }
    }

    const anchor = rule('.tok-filter-anchor');
    expect(anchor.width).toBe('0');
    expect(rule('.tok-filter-btn').position).toBe('absolute');
  });
});
