import { describe, expect, it } from 'vitest';
import {
  generateNodeXml,
  parsePattern3D,
  formatPattern3D,
  resizePattern3D,
  countColorSymbolOccurrences,
  refactorColorSymbol,
  extractRuleAtPos,
  replaceRuleInCode,
  insertRuleIntoXmlAt,
} from '../editor/rules';

describe('MarkovJunior Editor Rules & Methods Generator', () => {
  it('generates <all>, <one>, <prl> blocks', () => {
    const allXml = generateNodeXml({
      type: 'all',
      steps: 2,
      symmetry: '(xy)',
      rules: [{ in: 'A', out: 'B' }],
    });
    expect(allXml).toBe('  <all in="A" out="B" steps="2" symmetry="(xy)"/>');

    const prlXml = generateNodeXml({
      type: 'prl',
      p: 0.5,
      rules: [{ in: 'A', out: 'B', p: 0.2 }, { in: 'C', out: 'D' }],
    });
    expect(prlXml).toContain('<prl p="0.5">');
    expect(prlXml).toContain('<rule in="A" out="B" p="0.2"/>');
    expect(prlXml).toContain('<rule in="C" out="D"/>');
  });

  it('generates <markov> composite node', () => {
    const markovXml = generateNodeXml({
      type: 'markov',
      steps: 10,
      symmetry: '(xyz)',
      rules: [
        { in: 'DaGG', out: 'DPAG' },
        { in: 'PAG', out: 'PPA' },
      ],
      comment: 'Loop di connessioni',
    });
    expect(markovXml).toContain('<!-- Loop di connessioni -->');
    expect(markovXml).toContain('<markov steps="10" symmetry="(xyz)">');
    expect(markovXml).toContain('<one in="DaGG" out="DPAG"/>');
    expect(markovXml).toContain('<one in="PAG" out="PPA"/>');
    expect(markovXml).toContain('</markov>');
  });

  it('generates <sequence> composite node', () => {
    const seqXml = generateNodeXml({
      type: 'sequence',
      rules: [{ in: 'B', out: 'W' }],
    });
    expect(seqXml).toContain('<sequence>');
    expect(seqXml).toContain('<all in="B" out="W"/>');
    expect(seqXml).toContain('</sequence>');
  });

  it('generates <path> node', () => {
    const pathXml = generateNodeXml({
      type: 'path',
      from: 'a',
      to: 'u',
      on: 'E',
      color: 'G',
      inertia: true,
      steps: 1,
    });
    expect(pathXml).toBe('  <path from="a" to="u" on="E" color="G" steps="1" inertia="True"/>');
  });

  it('generates <convolution> node', () => {
    const convXml = generateNodeXml({
      type: 'convolution',
      neighborhood: 'Moore',
      in: 'B',
      out: 'W',
      values: 'BR',
      sum: '5..8',
      periodic: true,
    });
    expect(convXml).toContain('<convolution neighborhood="Moore" periodic="True">');
    expect(convXml).toContain('<rule in="B" out="W" values="BR" sum="5..8"/>');
    expect(convXml).toContain('</convolution>');
  });

  it('generates <map> node', () => {
    const mapXml = generateNodeXml({
      type: 'map',
      scale: [2, 2, 2],
      values: 'BWRP',
      rules: [{ in: 'B', out: 'BB/BB BB/BB' }],
    });
    expect(mapXml).toContain('<map scale="2 2 2" values="BWRP">');
    expect(mapXml).toContain('<rule in="B" out="BB/BB BB/BB"/>');
    expect(mapXml).toContain('</map>');
  });

  it('generates <shape> nodes', () => {
    const boxXml = generateNodeXml({
      type: 'shape',
      shape: 'box',
      at: [2, 2, 0],
      size: [35, 35, 45],
      color: 'E',
    });
    expect(boxXml).toBe('  <box at="2 2 0" size="35 35 45" color="E"/>');

    const lineXml = generateNodeXml({
      type: 'shape',
      shape: 'line',
      at: [0, 0, 0],
      to: [10, 10, 10],
      r: 2,
      color: 'R',
      on: 'E',
    });
    expect(lineXml).toBe('  <line at="0 0 0" to="10 10 10" r="2" color="R" on="E"/>');
  });
});

describe('Multi-Dimensional Filter 3D Engine', () => {
  it('parses 1D/single voxel pattern', () => {
    const res = parsePattern3D('P');
    expect(res.x).toBe(1);
    expect(res.y).toBe(1);
    expect(res.z).toBe(1);
    expect(res.layers).toEqual([[['P']]]);
  });

  it('parses 2D pattern with rows (slashes)', () => {
    const res = parsePattern3D('BBB/B*B/BBB');
    expect(res.x).toBe(3);
    expect(res.y).toBe(3);
    expect(res.z).toBe(1);
    expect(res.layers[0]).toEqual([
      ['B', 'B', 'B'],
      ['B', '*', 'B'],
      ['B', 'B', 'B'],
    ]);
  });

  it('parses 3D pattern with layers (spaces) and rows (slashes)', () => {
    const res = parsePattern3D('tEt/EEE tEt/EEE');
    expect(res.x).toBe(3);
    expect(res.y).toBe(2);
    expect(res.z).toBe(2);
    expect(formatPattern3D(res.layers)).toBe('tEt/EEE tEt/EEE');
  });

  it('resizes 3D grid with padding', () => {
    const parsed = parsePattern3D('B');
    const expanded = resizePattern3D(parsed.layers, 3, 3, 1, '*');
    expect(expanded.length).toBe(1);
    expect(expanded[0].length).toBe(3);
    expect(expanded[0][0].length).toBe(3);
    expect(expanded[0][0][0]).toBe('B');
    expect(expanded[0][0][1]).toBe('*');
    expect(formatPattern3D(expanded)).toBe('B**/***/' + '***');
  });
});

describe('Color Symbol Refactoring Engine', () => {
  const sampleXml = `
<sequence values="BtEDGANYOWUa" size="37 37 47">
  <color symbol="t" value="7a66b8" name="Piazzola chip"/>
  <color symbol="E" value="9f97ba" name="Pista"/>
  <box at="2 2 0" size="35 35 45" color="E"/>
  <one in="tEE" out="tEt"/>
  <path from="a" to="u" on="E" color="G" steps="1"/>
</sequence>
`.trim();

  it('counts symbol occurrences accurately', () => {
    const infoE = countColorSymbolOccurrences(sampleXml, 'E');
    expect(infoE.colorDecl).toBe(1);
    expect(infoE.valuesDecl).toBe(1);
    expect(infoE.rulePatterns).toBe(3); // in="tEE" (2) + out="tEt" (1)
    expect(infoE.shapesAndOther).toBe(2); // color="E" in box + on="E" in path
    expect(infoE.total).toBe(7);
  });

  it('safely refactors color symbol without altering tag names or comments', () => {
    const { newXml, count } = refactorColorSymbol(sampleXml, 'E', 'X');
    expect(count).toBe(7);
    expect(newXml).toContain('values="BtXDGANYOWUa"');
    expect(newXml).toContain('<color symbol="X"');
    expect(newXml).toContain('color="X"');
    expect(newXml).toContain('in="tXX"');
    expect(newXml).toContain('out="tXt"');
    expect(newXml).toContain('on="X"');
    // Ensure <sequence>, <box>, etc. tags and hex colors were not broken
    expect(newXml).toContain('<sequence');
    expect(newXml).toContain('<box');
    expect(newXml).toContain('value="9f97ba"');
  });

  describe('Code Rule Extraction & In-place Replacement', () => {
    const code = `<model>
  <color symbol="E" value="9f97ba"/>
  <all in="***/*T*/***" out="***/*E*/***" steps="1"/>
  <one in="P" out="S" p="0.5"/>
  <path from="W" to="B" on="G" color="R"/>
</model>`;

    it('extracts rule attributes when cursor is on or inside rule tag', () => {
      const allPos = code.indexOf('<all');
      const rule = extractRuleAtPos(code, allPos + 5);
      expect(rule).not.toBeNull();
      expect(rule?.tag).toBe('all');
      expect(rule?.line).toBe(3);
      expect(rule?.inAttr?.value).toBe('***/*T*/***');
      expect(rule?.outAttr?.value).toBe('***/*E*/***');
    });

    it('extracts path from/to when cursor is on path node', () => {
      const pathPos = code.indexOf('<path');
      const rule = extractRuleAtPos(code, pathPos + 2);
      expect(rule).not.toBeNull();
      expect(rule?.tag).toBe('path');
      expect(rule?.inAttr?.name).toBe('from');
      expect(rule?.inAttr?.value).toBe('W');
      expect(rule?.outAttr?.name).toBe('to');
      expect(rule?.outAttr?.value).toBe('B');
    });

    it('returns null when cursor is on a tag with no filter attributes', () => {
      const colorPos = code.indexOf('<color');
      const rule = extractRuleAtPos(code, colorPos + 3);
      expect(rule).toBeNull();
    });

    it('replaces rule in code cleanly while preserving other attributes', () => {
      const allPos = code.indexOf('<all');
      const rule = extractRuleAtPos(code, allPos + 4)!;
      const updated = replaceRuleInCode(code, rule, '***/*A*/***', '***/*B*/***');
      expect(updated).toContain('<all in="***/*A*/***" out="***/*B*/***" steps="1"/>');
      expect(updated).toContain('<one in="P" out="S" p="0.5"/>');
      expect(updated).toContain('<color symbol="E" value="9f97ba"/>');
    });

    it('extracts all attributes for path tag into attrs record', () => {
      const pathPos = code.indexOf('<path');
      const rule = extractRuleAtPos(code, pathPos + 2);
      expect(rule).not.toBeNull();
      expect(rule?.attrs?.['from']).toBe('W');
      expect(rule?.attrs?.['to']).toBe('B');
      expect(rule?.attrs?.['on']).toBe('G');
      expect(rule?.attrs?.['color']).toBe('R');
    });

    it('replaces existing rule in place when inserting at cursor inside the rule', () => {
      const onePos = code.indexOf('<one');
      const ruleToReplace = extractRuleAtPos(code, onePos + 2);
      expect(ruleToReplace).not.toBeNull();

      const newRuleXml = '<all in="PPP" out="SSS"/>';
      const { newXml } = insertRuleIntoXmlAt(code, newRuleXml, onePos + 5, ruleToReplace);

      // The old <one> tag should be replaced, not broken or duplicated
      expect(newXml).not.toContain('<one in="P" out="S" p="0.5"/>');
      expect(newXml).toContain('<all in="PPP" out="SSS"/>');
      expect(newXml).toContain('<path from="W" to="B" on="G" color="R"/>');
    });
  });

  describe('Tag Inspector & Schema parsing', () => {
    const xml = `<sequence values="BW" size="10 10 10" origin="True">
  <color symbol="B" value="000000" name="Nero"/>
  <path from="a" to="u" on="E" color="G" steps="2"/>
</sequence>`;

    it('parses tag at cursor with declared attributes and boundaries', async () => {
      const { parseTagAtCursor } = await import('../editor/syntax');
      const pathPos = xml.indexOf('<path') + 6;
      const parsed = parseTagAtCursor(xml, pathPos);

      expect(parsed).not.toBeNull();
      expect(parsed?.tag).toBe('path');
      expect(parsed?.isSelfClosing).toBe(true);
      expect(parsed?.isClosing).toBe(false);

      const names = parsed?.declaredAttrs.map((a) => a.name);
      expect(names).toEqual(['from', 'to', 'on', 'color', 'steps']);
    });

    it('detects closing tags properly', async () => {
      const { parseTagAtCursor } = await import('../editor/syntax');
      const closePos = xml.indexOf('</sequence') + 3;
      const parsed = parseTagAtCursor(xml, closePos);

      expect(parsed).not.toBeNull();
      expect(parsed?.tag).toBe('sequence');
      expect(parsed?.isClosing).toBe(true);
    });

    it('TAG_SCHEMAS provides defaults for common MarkovJunior tags', async () => {
      const { TAG_SCHEMAS } = await import('../editor/syntax');
      expect(TAG_SCHEMAS.path).toBeDefined();
      expect(TAG_SCHEMAS.all).toBeDefined();
      expect(TAG_SCHEMAS.sequence).toBeDefined();

      const pathSchema = TAG_SCHEMAS.path;
      const fromDef = pathSchema.find((d) => d.name === 'from');
      const inertiaDef = pathSchema.find((d) => d.name === 'inertia');
      expect(fromDef).toBeDefined();
      expect(inertiaDef?.default).toBe('False');
    });
  });
});

