// MarkovJunior Model Editor: Rule and Substitution Generator (T59d).
// Provides tools for generating, configuring, and inserting MarkovJunior rewrite rules (<all>, <one>, <prl>).

import { MJ_PALETTE } from '../../src/mj/palette';
import { parseColorsFromXml } from './cad';

export type RuleNodeType = 'all' | 'one' | 'prl';

export type SymmetryType = '(xy)' | '()' | '(x)' | '(y)' | '(z)' | '(xyz+)' | '(xyz)';

export interface SingleRuleItem {
  in: string;
  out: string;
  p?: number;
  comment?: string;
}

export interface RuleBlockConfig {
  type: RuleNodeType;
  steps?: number;
  p?: number;
  symmetry?: SymmetryType;
  rules: SingleRuleItem[];
  comment?: string;
}

export interface PaletteSymbolInfo {
  symbol: string;
  color: string;
  name?: string;
  glow?: boolean;
}

/**
 * Extracts palette symbols available in the given MarkovJunior XML string.
 * Combines symbols from `<sequence values="...">` and `<color symbol="...">` declarations,
 * falling back to default colors from MJ_PALETTE if unspecified.
 */
export function getPaletteSymbols(xml: string): PaletteSymbolInfo[] {
  const result: PaletteSymbolInfo[] = [];
  const seen = new Set<string>();

  // 1. Explicit <color> definitions
  const customColors = parseColorsFromXml(xml);
  for (const c of Object.values(customColors)) {
    if (!seen.has(c.symbol)) {
      seen.add(c.symbol);
      const defaultHex = MJ_PALETTE[c.symbol]?.color ?? '#888888';
      const hex = c.value ? (c.value.startsWith('#') ? c.value : `#${c.value}`) : defaultHex;
      result.push({
        symbol: c.symbol,
        color: hex,
        name: c.name ?? MJ_PALETTE[c.symbol]?.name ?? `Colore ${c.symbol}`,
        glow: c.glow,
      });
    }
  }

  // 2. Symbols in values="..." attribute
  const valuesMatch = /\bvalues\s*=\s*["']([^"']+)["']/i.exec(xml);
  if (valuesMatch) {
    const rawValues = valuesMatch[1].replace(/\s+/g, '');
    for (const char of rawValues) {
      if (!seen.has(char)) {
        seen.add(char);
        const pal = MJ_PALETTE[char];
        result.push({
          symbol: char,
          color: pal?.color ?? '#aaaaaa',
          name: pal?.name ?? `Colore ${char}`,
          glow: false,
        });
      }
    }
  }

  // If no symbols found, provide standard fallback symbols
  if (result.length === 0) {
    for (const char of ['B', 'W', 'R', 'G', 'Y', 'P', 'S', 'D']) {
      const pal = MJ_PALETTE[char];
      if (pal) {
        result.push({
          symbol: char,
          color: pal.color ?? '#888888',
          name: pal.name ?? char,
          glow: false,
        });
      }
    }
  }

  return result;
}

/**
 * Generates formatted MarkovJunior XML for a rule block (<all>, <one>, <prl>).
 */
export function generateRuleXml(config: RuleBlockConfig, indent: string = '  '): string {
  const { type, steps, p, symmetry, rules, comment } = config;

  const validRules = rules.filter((r) => r.in.trim() && r.out.trim());
  if (validRules.length === 0) {
    return '';
  }

  // Build node attributes
  const attrs: string[] = [];
  if (steps !== undefined && steps !== null && steps > 0) {
    attrs.push(`steps="${steps}"`);
  }
  if (type === 'prl' && p !== undefined && p !== null && p > 0 && p <= 1) {
    attrs.push(`p="${p}"`);
  }
  if (symmetry && symmetry !== '()') {
    attrs.push(`symmetry="${symmetry}"`);
  }

  const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  const lines: string[] = [];

  if (comment) {
    lines.push(`${indent}<!-- ${comment} -->`);
  }

  // Concise single-line form if exactly 1 rule, no sub-rule comments, and sub-rule has no unique attributes
  if (validRules.length === 1 && !validRules[0].p && !validRules[0].comment) {
    const r = validRules[0];
    lines.push(`${indent}<${type} in="${r.in}" out="${r.out}"${attrString}/>`);
    return lines.join('\n');
  }

  // Block form with child <rule> elements
  lines.push(`${indent}<${type}${attrString}>`);
  for (const r of validRules) {
    const rAttrs: string[] = [];
    rAttrs.push(`in="${r.in}"`);
    rAttrs.push(`out="${r.out}"`);
    if (r.p !== undefined && r.p !== null && r.p > 0 && r.p <= 1) {
      rAttrs.push(`p="${r.p}"`);
    }
    const rComment = r.comment ? ` <!-- ${r.comment} -->` : '';
    lines.push(`${indent}  <rule ${rAttrs.join(' ')}/>${rComment}`);
  }
  lines.push(`${indent}</${type}>`);

  return lines.join('\n');
}

/**
 * Inserts a rule string into XML at the specified character cursor position.
 */
export function insertRuleIntoXmlAt(
  xml: string,
  ruleXml: string,
  cursorPos: number,
): { newXml: string; newCursor: number } {
  const safePos = Math.max(0, Math.min(xml.length, cursorPos));

  // Ensure leading and trailing line breaks if not already present
  const before = xml.slice(0, safePos);
  const after = xml.slice(safePos);

  const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
  const suffix = after.length > 0 && !after.startsWith('\n') && !after.startsWith('\r') ? '\n' : '';

  const insertion = `${prefix}${ruleXml}${suffix}`;
  const newXml = before + insertion + after;
  const newCursor = safePos + insertion.length;

  return { newXml, newCursor };
}

/**
 * Inserts a rule string right before the closing tag of the root <sequence> or <markov>.
 */
export function insertRuleAtEndOfSequence(
  xml: string,
  ruleXml: string,
): { newXml: string; newCursor: number } {
  // Search for </sequence> or </markov> from the end
  const match = /<\/(sequence|markov)>\s*$/i.exec(xml);
  if (match) {
    const insertIdx = match.index;
    return insertRuleIntoXmlAt(xml, ruleXml, insertIdx);
  }

  // Fallback: append at end
  return insertRuleIntoXmlAt(xml, ruleXml, xml.length);
}
