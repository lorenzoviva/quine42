import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  extractLineFromError,
  highlightXml,
  validateMjx,
  MJ_NODES,
  MJ_ATTRS,
} from '../lab/editor/syntax';
import { CATALOG } from '../lab/3d/catalog';

describe('MarkovJunior Editor (T59a)', () => {
  describe('syntax highlighting & tokenizer', () => {
    it('escapes special characters', () => {
      expect(escapeHtml('<div id="a&b">')).toBe('&lt;div id="a&amp;b"&gt;');
    });

    it('highlights XML comments and meta declarations', () => {
      const xml = '<!-- Questo è un commento -->\n<?xml version="1.0"?>';
      const html = highlightXml(xml);
      expect(html).toContain('<span class="tok-comment">&lt;!-- Questo è un commento --&gt;</span>');
      expect(html).toContain('<span class="tok-meta">&lt;?xml version="1.0"?&gt;</span>');
    });

    it('highlights tags, MarkovJunior nodes and attributes', () => {
      const xml = '<sequence values="BW" size="10 10 10">\n  <one>\n    <rule in="B" out="W"/>\n  </one>\n</sequence>';
      const html = highlightXml(xml);

      // Node tags
      expect(html).toContain('<span class="tok-tag tok-mj-node">sequence</span>');
      expect(html).toContain('<span class="tok-tag tok-mj-node">one</span>');
      expect(html).toContain('<span class="tok-tag tok-mj-node">rule</span>');

      // Attributes
      expect(html).toContain('<span class="tok-attr tok-mj-attr">values</span>');
      expect(html).toContain('<span class="tok-attr tok-mj-attr">size</span>');
      expect(html).toContain('<span class="tok-attr tok-mj-attr">in</span>');
      expect(html).toContain('<span class="tok-attr tok-mj-attr">out</span>');

      // Attribute values
      expect(html).toContain('<span class="tok-val">"BW"</span>');
      expect(html).toContain('<span class="tok-val">"10 10 10"</span>');
    });

    it('identifies MarkovJunior nodes and attributes in predefined sets', () => {
      expect(MJ_NODES.has('sequence')).toBe(true);
      expect(MJ_NODES.has('markov')).toBe(true);
      expect(MJ_NODES.has('all')).toBe(true);
      expect(MJ_NODES.has('prl')).toBe(true);
      expect(MJ_NODES.has('box')).toBe(true);
      expect(MJ_NODES.has('cylinder')).toBe(true);
      expect(MJ_NODES.has('action')).toBe(true);

      expect(MJ_ATTRS.has('values')).toBe(true);
      expect(MJ_ATTRS.has('size')).toBe(true);
      expect(MJ_ATTRS.has('in')).toBe(true);
      expect(MJ_ATTRS.has('out')).toBe(true);
      expect(MJ_ATTRS.has('glow')).toBe(true);
    });
  });

  describe('XML validation and line error extraction', () => {
    it('extracts line number from error message', () => {
      expect(extractLineFromError('riga 14: tag di chiusura non valido')).toBe(14);
      expect(extractLineFromError('riga 3, <rule>: pattern errato')).toBe(3);
      expect(extractLineFromError('Error at line 42: unexpected token')).toBe(42);
      expect(extractLineFromError('errore generico senza riga')).toBe(1);
    });

    it('rejects empty XML with line 1', () => {
      const res = validateMjx('   ');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.line).toBe(1);
        expect(res.error).toContain('vuoto');
      }
    });

    it('validates a correct MarkovJunior XML', () => {
      const validXml = `
<sequence values="BW" size="10 10 10">
  <one>
    <rule in="B" out="W"/>
  </one>
</sequence>`;
      const res = validateMjx(validXml);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.model).toBeDefined();
        expect(res.warnings).toBeInstanceOf(Array);
      }
    });

    it('detects unclosed tags and indicates the exact line', () => {
      const brokenXml = `<sequence values="BW" size="10 10 10">
  <one>
    <rule in="B" out="W"/>
</sequence>`;
      const res = validateMjx(brokenXml);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.line).toBe(4);
        expect(res.error).toContain('chiude');
      }
    });

    it('detects invalid MJ attributes / missing values', () => {
      const brokenXml = `<sequence size="10 10 10">
  <one>
    <rule in="B" out="W"/>
  </one>
</sequence>`;
      const res = validateMjx(brokenXml);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.line).toBe(1);
        expect(res.error).toContain('values');
      }
    });
  });

  describe('catalog and templates', () => {
    it('has valid catalog entries available for the editor', () => {
      expect(CATALOG.length).toBeGreaterThan(10);
      const barile = CATALOG.find((e) => e.id === 'barile');
      expect(barile).toBeDefined();
      if (barile) {
        const res = validateMjx(barile.xml);
        expect(res.ok).toBe(true);
      }

      const casetta = CATALOG.find((e) => e.id === 'casetta');
      expect(casetta).toBeDefined();
      if (casetta) {
        const res = validateMjx(casetta.xml);
        expect(res.ok).toBe(true);
      }
    });
  });
});
