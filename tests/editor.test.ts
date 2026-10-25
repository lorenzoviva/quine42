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
import {
  parseShapesFromXml,
  insertShapeIntoXml,
  updateShapeInXml,
  deleteShapeFromXml,
  duplicateShapeInXml,
  parseColorsFromXml,
  setLetterColorInXml,
  voxelToThree,
  threeToVoxel,
  isVoxelInsideShape,
  findShapeAtVoxel,
} from '../lab/editor/cad';

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

  describe('CAD voxel tools & manipulation (T59b)', () => {
    const SAMPLE_XML = `<sequence values="0BGY" size="12 12 12">
  <box at="6 6 0" size="10 10 2" color="B"/>
  <box at="6 6 2" size="8 8 4" color="G"/>
  <cylinder at="6 6 6" size="6 6 4" color="Y"/>
</sequence>`;

    it('parses existing shapes from XML with lines and dimensions', () => {
      const shapes = parseShapesFromXml(SAMPLE_XML);
      expect(shapes).toHaveLength(3);

      expect(shapes[0].kind).toBe('box');
      expect(shapes[0].at).toEqual([6, 6, 0]);
      expect(shapes[0].size).toEqual([10, 10, 2]);
      expect(shapes[0].color).toBe('B');
      expect(shapes[0].line).toBe(2);

      expect(shapes[1].kind).toBe('box');
      expect(shapes[1].at).toEqual([6, 6, 2]);
      expect(shapes[1].color).toBe('G');

      expect(shapes[2].kind).toBe('cylinder');
      expect(shapes[2].at).toEqual([6, 6, 6]);
      expect(shapes[2].size).toEqual([6, 6, 4]);
      expect(shapes[2].color).toBe('Y');
    });

    it('inserts a new shape into XML and updates root values', () => {
      const { newXml, line } = insertShapeIntoXml(SAMPLE_XML, {
        kind: 'cone',
        at: [6, 6, 10],
        size: [4, 4, 2],
        color: 'R',
      });

      expect(newXml).toContain('values="0BGYR"');
      expect(newXml).toContain('<cone at="6 6 10" size="4 4 2" color="R"/>');
      expect(line).toBeGreaterThan(3);

      const parsed = parseShapesFromXml(newXml);
      expect(parsed).toHaveLength(4);
      expect(parsed[3].kind).toBe('cone');
      expect(parsed[3].color).toBe('R');
    });

    it('updates position, size, and color of an existing shape', () => {
      const updated = updateShapeInXml(SAMPLE_XML, 1, {
        at: [7, 7, 3],
        size: [6, 6, 3],
        color: 'W',
      });

      expect(updated).toContain('values="0BGYW"');
      expect(updated).toContain('<box at="7 7 3" size="6 6 3" color="W"/>');

      const shapes = parseShapesFromXml(updated);
      expect(shapes[1].at).toEqual([7, 7, 3]);
      expect(shapes[1].size).toEqual([6, 6, 3]);
      expect(shapes[1].color).toBe('W');
    });

    it('deletes a shape from XML cleanly', () => {
      const deleted = deleteShapeFromXml(SAMPLE_XML, 1);
      const shapes = parseShapesFromXml(deleted);
      expect(shapes).toHaveLength(2);
      expect(shapes[0].color).toBe('B');
      expect(shapes[1].color).toBe('Y');
      expect(deleted).not.toContain('size="8 8 4"');
    });

    it('duplicates a shape with coordinate offset', () => {
      const { newXml } = duplicateShapeInXml(SAMPLE_XML, 0, [0, 0, 8]);
      const shapes = parseShapesFromXml(newXml);
      expect(shapes).toHaveLength(4);
      expect(shapes[1].at).toEqual([6, 6, 8]);
      expect(shapes[1].size).toEqual([10, 10, 2]);
      expect(shapes[1].color).toBe('B');
    });

    it('manages palette, custom colors and glow properties', () => {
      const withGlow = setLetterColorInXml(SAMPLE_XML, 'R', {
        value: '#ff0055',
        glow: true,
        part: 'testa',
      });

      expect(withGlow).toContain('values="0BGYR"');
      expect(withGlow).toContain('glow="True"');
      expect(withGlow).toContain('value="ff0055"');
      expect(withGlow).toContain('part="testa"');

      const colors = parseColorsFromXml(withGlow);
      expect(colors.R).toBeDefined();
      expect(colors.R.glow).toBe(true);
      expect(colors.R.value).toBe('#ff0055');
      expect(colors.R.part).toBe('testa');
    });

    it('converts between voxel coordinates and Three.js 3D coordinates', () => {
      const grid = { X: 12, Y: 12, Z: 12 };
      const vpt = 20;

      // Center of floor: (6, 6, 0) in voxel space -> (0, 0, 0) in Three.js space
      const threePos = voxelToThree([6, 6, 0], grid, vpt);
      expect(threePos).toEqual([0, 0, 0]);

      // Roundtrip back to voxel
      const voxelPos = threeToVoxel(threePos, grid, vpt);
      expect(voxelPos).toEqual([6, 6, 0]);

      // Elevated voxel
      const elevatedThree = voxelToThree([8, 10, 4], grid, vpt);
      const roundtripElevated = threeToVoxel(elevatedThree, grid, vpt);
      expect(roundtripElevated).toEqual([8, 10, 4]);
    });

    it('tests voxel containment inside shapes for hit testing', () => {
      const shapes = parseShapesFromXml(SAMPLE_XML);
      const box0 = shapes[0]; // at="6 6 0" size="10 10 2"
      // Voxel (6, 6, 0) is inside box0
      expect(isVoxelInsideShape(6, 6, 0, box0)).toBe(true);
      // Voxel (6, 6, 3) is outside box0 (z=3 > bz+h=2)
      expect(isVoxelInsideShape(6, 6, 3, box0)).toBe(false);

      const hit = findShapeAtVoxel(6, 6, 0, shapes);
      expect(hit).not.toBeNull();
      expect(hit?.shape.color).toBe('B');

      const hitCylinder = findShapeAtVoxel(6, 6, 7, shapes);
      expect(hitCylinder).not.toBeNull();
      expect(hitCylinder?.shape.kind).toBe('cylinder');
      expect(hitCylinder?.shape.color).toBe('Y');
    });
  });
});
