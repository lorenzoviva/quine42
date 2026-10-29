// MarkovJunior Model Editor: Rule and Substitution Generator (T59d).
// Provides tools for generating, configuring, and inserting MarkovJunior rewrite rules (<all>, <one>, <prl>).

import { MJ_PALETTE } from '../../src/mj/palette';
import { parseColorsFromXml } from './cad';

export type RuleNodeType =
  | 'all'
  | 'one'
  | 'prl'
  | 'markov'
  | 'sequence'
  | 'path'
  | 'convolution'
  | 'map'
  | 'shape';

export type SymmetryType = '(xy)' | '()' | '(x)' | '(y)' | '(z)' | '(xyz+)' | '(xyz)';

export interface SingleRuleItem {
  in: string;
  out: string;
  p?: number;
  comment?: string;
}

export interface RuleBlockConfig {
  type: 'all' | 'one' | 'prl';
  steps?: number;
  p?: number;
  symmetry?: SymmetryType;
  rules: SingleRuleItem[];
  comment?: string;
}

export interface MarkovBlockConfig {
  type: 'markov';
  steps?: number;
  symmetry?: SymmetryType;
  rules: SingleRuleItem[];
  comment?: string;
}

export interface SequenceBlockConfig {
  type: 'sequence';
  steps?: number;
  rules: SingleRuleItem[];
  comment?: string;
}

export interface PathConfig {
  type: 'path';
  from: string;
  to: string;
  on: string;
  color: string;
  steps?: number;
  inertia?: boolean;
  longest?: boolean;
  comment?: string;
}

export interface ConvConfig {
  type: 'convolution';
  neighborhood: 'Moore' | 'VonNeumann' | 'NoCorners';
  in: string;
  out: string;
  values?: string;
  sum?: string;
  p?: number;
  steps?: number;
  periodic?: boolean;
  comment?: string;
}

export interface MapConfig {
  type: 'map';
  scale: [number, number, number];
  values: string;
  rules: SingleRuleItem[];
  comment?: string;
}

export interface ShapeConfig {
  type: 'shape';
  shape: 'box' | 'cylinder' | 'ellipsoid' | 'cone' | 'line';
  at: [number, number, number];
  size?: [number, number, number];
  to?: [number, number, number];
  r?: number;
  color: string;
  on?: string;
  comment?: string;
}

export type AnyMjNodeConfig =
  | RuleBlockConfig
  | MarkovBlockConfig
  | SequenceBlockConfig
  | PathConfig
  | ConvConfig
  | MapConfig
  | ShapeConfig;

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
 * Generates formatted MarkovJunior XML for any supported node type
 * (<all>, <one>, <prl>, <markov>, <sequence>, <path>, <convolution>, <map>, <box|shape>).
 */
export function generateNodeXml(config: AnyMjNodeConfig, indent: string = '  '): string {
  switch (config.type) {
    case 'all':
    case 'one':
    case 'prl':
      return generateRuleXml(config, indent);
    case 'markov':
      return generateMarkovXml(config, indent);
    case 'sequence':
      return generateSequenceXml(config, indent);
    case 'path':
      return generatePathXml(config, indent);
    case 'convolution':
      return generateConvXml(config, indent);
    case 'map':
      return generateMapXml(config, indent);
    case 'shape':
      return generateShapeXml(config, indent);
    default:
      return '';
  }
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
 * Generates XML for a <markov> composite node.
 * Loops through child rules from top to bottom while at least one rule matches.
 */
export function generateMarkovXml(config: MarkovBlockConfig, indent: string = '  '): string {
  const { steps, symmetry, rules, comment } = config;
  const validRules = rules.filter((r) => r.in.trim() && r.out.trim());
  if (validRules.length === 0) return '';

  const attrs: string[] = [];
  if (steps !== undefined && steps !== null && steps > 0) attrs.push(`steps="${steps}"`);
  if (symmetry && symmetry !== '()') attrs.push(`symmetry="${symmetry}"`);
  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

  const lines: string[] = [];
  if (comment) lines.push(`${indent}<!-- ${comment} -->`);
  lines.push(`${indent}<markov${attrStr}>`);
  for (const r of validRules) {
    const rAttrs = [`in="${r.in}"`, `out="${r.out}"`];
    if (r.p !== undefined && r.p > 0 && r.p <= 1) rAttrs.push(`p="${r.p}"`);
    const rComm = r.comment ? ` <!-- ${r.comment} -->` : '';
    lines.push(`${indent}  <one ${rAttrs.join(' ')}/>${rComm}`);
  }
  lines.push(`${indent}</markov>`);
  return lines.join('\n');
}

/**
 * Generates XML for a <sequence> composite node.
 */
export function generateSequenceXml(config: SequenceBlockConfig, indent: string = '  '): string {
  const { steps, rules, comment } = config;
  const validRules = rules.filter((r) => r.in.trim() && r.out.trim());
  if (validRules.length === 0) return '';

  const attrs: string[] = [];
  if (steps !== undefined && steps !== null && steps > 0) attrs.push(`steps="${steps}"`);
  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

  const lines: string[] = [];
  if (comment) lines.push(`${indent}<!-- ${comment} -->`);
  lines.push(`${indent}<sequence${attrStr}>`);
  for (const r of validRules) {
    const rAttrs = [`in="${r.in}"`, `out="${r.out}"`];
    if (r.p !== undefined && r.p > 0 && r.p <= 1) rAttrs.push(`p="${r.p}"`);
    const rComm = r.comment ? ` <!-- ${r.comment} -->` : '';
    lines.push(`${indent}  <all ${rAttrs.join(' ')}/>${rComm}`);
  }
  lines.push(`${indent}</sequence>`);
  return lines.join('\n');
}

/**
 * Generates XML for a <path> pathfinding node.
 */
export function generatePathXml(config: PathConfig, indent: string = '  '): string {
  const { from, to, on, color, steps, inertia, longest, comment } = config;
  if (!from.trim() || !to.trim() || !on.trim() || !color.trim()) return '';

  const attrs: string[] = [
    `from="${from.trim()}"`,
    `to="${to.trim()}"`,
    `on="${on.trim()}"`,
    `color="${color.trim()}"`,
  ];
  if (steps !== undefined && steps !== null && steps > 0) attrs.push(`steps="${steps}"`);
  if (inertia) attrs.push('inertia="True"');
  if (longest) attrs.push('longest="True"');

  const lines: string[] = [];
  if (comment) lines.push(`${indent}<!-- ${comment} -->`);
  lines.push(`${indent}<path ${attrs.join(' ')}/>`);
  return lines.join('\n');
}

/**
 * Generates XML for a <convolution> cellular automaton node.
 */
export function generateConvXml(config: ConvConfig, indent: string = '  '): string {
  const { neighborhood, in: inSym, out: outSym, values, sum, p, steps, periodic, comment } = config;
  if (!inSym.trim() || !outSym.trim()) return '';

  const nodeAttrs: string[] = [`neighborhood="${neighborhood || 'Moore'}"`];
  if (steps !== undefined && steps !== null && steps > 0) nodeAttrs.push(`steps="${steps}"`);
  if (periodic) nodeAttrs.push('periodic="True"');

  const ruleAttrs: string[] = [`in="${inSym.trim()}"`, `out="${outSym.trim()}"`];
  if (values && values.trim()) ruleAttrs.push(`values="${values.trim()}"`);
  if (sum && sum.trim()) ruleAttrs.push(`sum="${sum.trim()}"`);
  if (p !== undefined && p > 0 && p <= 1) ruleAttrs.push(`p="${p}"`);

  const lines: string[] = [];
  if (comment) lines.push(`${indent}<!-- ${comment} -->`);
  lines.push(`${indent}<convolution ${nodeAttrs.join(' ')}>`);
  lines.push(`${indent}  <rule ${ruleAttrs.join(' ')}/>`);
  lines.push(`${indent}</convolution>`);
  return lines.join('\n');
}

/**
 * Generates XML for a <map> grid scaling node.
 */
export function generateMapXml(config: MapConfig, indent: string = '  '): string {
  const { scale, values, rules, comment } = config;
  const sStr = scale ? `${scale[0]} ${scale[1]} ${scale[2]}` : '2 2 2';
  const valStr = values ? values.trim() : 'BW';

  const validRules = rules.filter((r) => r.in.trim() && r.out.trim());
  const lines: string[] = [];
  if (comment) lines.push(`${indent}<!-- ${comment} -->`);
  lines.push(`${indent}<map scale="${sStr}" values="${valStr}">`);
  for (const r of validRules) {
    lines.push(`${indent}  <rule in="${r.in}" out="${r.out}"/>`);
  }
  lines.push(`${indent}</map>`);
  return lines.join('\n');
}

/**
 * Generates XML for geometric primitive shapes (<box>, <ellipsoid>, <cylinder>, <cone>, <line>).
 */
export function generateShapeXml(config: ShapeConfig, indent: string = '  '): string {
  const { shape, at, size, to, r, color, on, comment } = config;
  const attrs: string[] = [`at="${at[0]} ${at[1]} ${at[2]}"`];

  if (shape === 'line') {
    const toCoord = to ?? [at[0] + 4, at[1], at[2]];
    attrs.push(`to="${toCoord[0]} ${toCoord[1]} ${toCoord[2]}"`);
    if (r !== undefined) attrs.push(`r="${r}"`);
  } else {
    const sz = size ?? [4, 4, 4];
    attrs.push(`size="${sz[0]} ${sz[1]} ${sz[2]}"`);
  }

  attrs.push(`color="${color.trim() || 'W'}"`);
  if (on && on.trim()) attrs.push(`on="${on.trim()}"`);

  const lines: string[] = [];
  if (comment) lines.push(`${indent}<!-- ${comment} -->`);
  lines.push(`${indent}<${shape} ${attrs.join(' ')}/>`);
  return lines.join('\n');
}

// ------------------------------------------------------------------ Multi-Dimensional Filter 3D Engine

export interface ParsedPattern3D {
  x: number;
  y: number;
  z: number;
  /** layers[z][y][x]: layer 0 is TOP in XML text, row 0 is top row */
  layers: string[][][];
}

/**
 * Parses a MarkovJunior pattern string (layers separated by spaces, rows by slashes)
 * into a structured 3D grid representation [z][y][x].
 */
export function parsePattern3D(patternStr: string): ParsedPattern3D {
  const trimmed = patternStr.trim();
  if (!trimmed) {
    return { x: 1, y: 1, z: 1, layers: [[['*']]] };
  }

  const rawLayers = trimmed.split(/\s+/);
  const z = rawLayers.length;

  let maxY = 1;
  let maxX = 1;

  const parsedLayers: string[][][] = rawLayers.map((lStr) => {
    const rows = lStr.split('/');
    if (rows.length > maxY) maxY = rows.length;
    return rows.map((rStr) => {
      const cells = rStr.match(/\[[^\]]*\]|./g) ?? [];
      if (cells.length > maxX) maxX = cells.length;
      return cells;
    });
  });

  // Normalize all layers to exactly maxY rows and maxX cols
  const normalizedLayers: string[][][] = parsedLayers.map((layer) => {
    const normRows: string[][] = [];
    for (let y = 0; y < maxY; y++) {
      const srcRow = layer[y] ?? [];
      const rowCells: string[] = [];
      for (let x = 0; x < maxX; x++) {
        rowCells.push(srcRow[x] ?? '*');
      }
      normRows.push(rowCells);
    }
    return normRows;
  });

  return { x: maxX, y: maxY, z, layers: normalizedLayers };
}

/**
 * Formats a 3D grid [z][y][x] into MarkovJunior string format (rows by '/', layers by ' ').
 */
export function formatPattern3D(layers: string[][][]): string {
  if (!layers || layers.length === 0) return '*';
  return layers
    .map((layer) => layer.map((row) => row.join('')).join('/'))
    .join(' ');
}

/**
 * Resizes a 3D grid [z][y][x] to new dimensions (newX, newY, newZ),
 * preserving existing voxel data at (z, y, x) and padding new cells with padChar.
 */
export function resizePattern3D(
  src: string[][][],
  newX: number,
  newY: number,
  newZ: number,
  padChar: string = '*',
): string[][][] {
  const safeX = Math.max(1, Math.min(64, newX));
  const safeY = Math.max(1, Math.min(64, newY));
  const safeZ = Math.max(1, Math.min(64, newZ));

  const result: string[][][] = [];
  for (let z = 0; z < safeZ; z++) {
    const layer: string[][] = [];
    for (let y = 0; y < safeY; y++) {
      const row: string[] = [];
      for (let x = 0; x < safeX; x++) {
        const val = src[z]?.[y]?.[x];
        row.push(val !== undefined ? val : padChar);
      }
      layer.push(row);
    }
    result.push(layer);
  }
  return result;
}

// ------------------------------------------------------------------ Color Symbol Refactoring Engine

export interface ColorSymbolOccurrences {
  symbol: string;
  total: number;
  colorDecl: number;
  valuesDecl: number;
  rulePatterns: number;
  shapesAndOther: number;
  details: string[];
}

/**
 * Scans an XML string for all occurrences of a color symbol and reports a detailed breakdown.
 */
export function countColorSymbolOccurrences(xml: string, symbol: string): ColorSymbolOccurrences {
  if (!symbol || symbol.length !== 1) {
    return { symbol, total: 0, colorDecl: 0, valuesDecl: 0, rulePatterns: 0, shapesAndOther: 0, details: [] };
  }

  let colorDecl = 0;
  let valuesDecl = 0;
  let rulePatterns = 0;
  let shapesAndOther = 0;
  const details: string[] = [];

  // 1. In <color ... symbol="S">
  const colorRegex = new RegExp(`<color\\b[^>]*?\\bsymbol=["']${escapeRegex(symbol)}["']`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = colorRegex.exec(xml)) !== null) {
    colorDecl++;
  }

  // 2. In values="..."
  const valuesRegex = /\bvalues\s*=\s*["']([^"']+)["']/gi;
  while ((m = valuesRegex.exec(xml)) !== null) {
    const val = m[1];
    let occ = 0;
    for (const ch of val) if (ch === symbol) occ++;
    if (occ > 0) {
      valuesDecl += occ;
    }
  }

  // 3. In in="..." and out="..."
  const patternRegex = /\b(in|out)\s*=\s*["']([^"']+)["']/gi;
  while ((m = patternRegex.exec(xml)) !== null) {
    const attrVal = m[2];
    let occ = 0;
    for (const ch of attrVal) if (ch === symbol) occ++;
    if (occ > 0) {
      rulePatterns += occ;
    }
  }

  // 4. In color="S", on="...", from="S", to="S", ground="S"
  const shapeRegex = /\b(color|on|from|to|ground)\s*=\s*["']([^"']+)["']/gi;
  while ((m = shapeRegex.exec(xml)) !== null) {
    const attrVal = m[2];
    let occ = 0;
    for (const ch of attrVal) if (ch === symbol) occ++;
    if (occ > 0) {
      shapesAndOther += occ;
    }
  }

  const total = colorDecl + valuesDecl + rulePatterns + shapesAndOther;
  if (colorDecl > 0) details.push(`${colorDecl} in dichiarazioni <color>`);
  if (valuesDecl > 0) details.push(`${valuesDecl} in valori di griglia (values)`);
  if (rulePatterns > 0) details.push(`${rulePatterns} in pattern di regole (in / out)`);
  if (shapesAndOther > 0) details.push(`${shapesAndOther} in forme geometriche o parametri (color / on / path)`);

  return { symbol, total, colorDecl, valuesDecl, rulePatterns, shapesAndOther, details };
}

/**
 * Safely refactors a color symbol across the entire XML MarkovJunior model:
 * Replaces oldSym with newSym ONLY in color-relevant contexts:
 * - <color symbol="oldSym" ...>
 * - values="...oldSym..."
 * - in="...oldSym...", out="...oldSym..."
 * - color="oldSym", on="...oldSym...", from="oldSym", to="oldSym", ground="oldSym"
 * - <union symbol="oldSym" values="...oldSym...">
 *
 * Never touches XML tag names, attribute names, hex color values (#rrggbb), or comments.
 */
export function refactorColorSymbol(
  xml: string,
  oldSym: string,
  newSym: string,
): { newXml: string; count: number } {
  if (!oldSym || !newSym || oldSym.length !== 1 || newSym.length !== 1 || oldSym === newSym) {
    return { newXml: xml, count: 0 };
  }

  let count = 0;

  // We process attributes in opening/self-closing XML tags without modifying tag names or comments
  const newXml = xml.replace(/(<[\w:.-]+)([^>]*?)(\/?>)/g, (_, openTag: string, attrs: string, closeTag: string) => {
    // Inside tag attributes, replace target attributes
    const replacedAttrs = attrs.replace(
      /\b([\w:.-]+)\s*=\s*(["'])([^"']*?)\2/g,
      (attrMatch: string, attrName: string, quote: string, attrVal: string) => {
        const lowerName = attrName.toLowerCase();

        // 1. symbol attribute (in <color> or <union>)
        if (lowerName === 'symbol' && attrVal === oldSym) {
          count++;
          return `${attrName}=${quote}${newSym}${quote}`;
        }

        // 2. values attribute (in <sequence>, <markov>, <map>, <union>, <convolution>)
        if (lowerName === 'values' && attrVal.includes(oldSym)) {
          let replaced = '';
          for (let k = 0; k < attrVal.length; k++) {
            if (attrVal[k] === oldSym) {
              replaced += newSym;
              count++;
            } else {
              replaced += attrVal[k];
            }
          }
          return `${attrName}=${quote}${replaced}${quote}`;
        }

        // 3. in and out patterns
        if ((lowerName === 'in' || lowerName === 'out') && attrVal.includes(oldSym)) {
          let replaced = '';
          for (let k = 0; k < attrVal.length; k++) {
            if (attrVal[k] === oldSym) {
              replaced += newSym;
              count++;
            } else {
              replaced += attrVal[k];
            }
          }
          return `${attrName}=${quote}${replaced}${quote}`;
        }

        // 4. color, on, from, to, ground
        if (['color', 'on', 'from', 'to', 'ground'].includes(lowerName) && attrVal.includes(oldSym)) {
          let replaced = '';
          for (let k = 0; k < attrVal.length; k++) {
            if (attrVal[k] === oldSym) {
              replaced += newSym;
              count++;
            } else {
              replaced += attrVal[k];
            }
          }
          return `${attrName}=${quote}${replaced}${quote}`;
        }

        return attrMatch;
      },
    );

    return `${openTag}${replacedAttrs}${closeTag}`;
  });

  return { newXml, count };
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Inserts or replaces a rule string into XML.
 * If ruleToReplace is provided (or if cursorPos is inside an existing rule node),
 * cleanly replaces the existing rule node, preserving indentation.
 * Otherwise, inserts cleanly without breaking surrounding XML tags.
 */
export function insertRuleIntoXmlAt(
  xml: string,
  ruleXml: string,
  cursorPos: number,
  ruleToReplace?: CodeRuleInfo | null,
): { newXml: string; newCursor: number } {
  const safePos = Math.max(0, Math.min(xml.length, cursorPos));

  // Determine target rule to replace
  const targetRule = ruleToReplace ?? extractRuleAtPos(xml, safePos);

  if (targetRule) {
    const shouldReplace =
      !!ruleToReplace || (safePos > targetRule.tagStart && safePos < targetRule.tagEnd);

    if (shouldReplace) {
      const lineStart = xml.lastIndexOf('\n', targetRule.tagStart - 1) + 1;
      const indentMatch = xml.slice(lineStart, targetRule.tagStart).match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : '';

      // Indent ruleXml lines
      const ruleLines = ruleXml.trim().split('\n');
      const indentedRule = ruleLines
        .map((line, idx) => (idx === 0 ? line : indent + line.trimStart()))
        .join('\n');

      const before = xml.slice(0, targetRule.tagStart);
      const after = xml.slice(targetRule.tagEnd);
      const newXml = before + indentedRule + after;
      const newCursor = targetRule.tagStart + indentedRule.length;
      return { newXml, newCursor };
    }
  }

  // If not replacing a specific rule, check if cursor is strictly inside an opening tag <...>
  let insertPos = safePos;
  for (let i = safePos - 1; i >= 0; i--) {
    if (xml[i] === '<') {
      const close = xml.indexOf('>', i);
      if (close !== -1 && safePos < close) {
        if (!xml.slice(i, close).startsWith('</')) {
          insertPos = close + 1;
        }
      }
      break;
    }
    if (xml[i] === '>') break;
  }

  const before = xml.slice(0, insertPos);
  const after = xml.slice(insertPos);

  const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
  const suffix = after.length > 0 && !after.startsWith('\n') && !after.startsWith('\r') ? '\n' : '';

  const insertion = `${prefix}${ruleXml}${suffix}`;
  const newXml = before + insertion + after;
  const newCursor = insertPos + insertion.length;

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

// ------------------------------------------------------------------ Code Rule Extraction & Replacement (T59d)

export interface CodeRuleInfo {
  tag: string;
  tagStart: number;
  tagEnd: number;
  line: number;
  inAttr?: { name: 'in' | 'from'; value: string; start: number; end: number };
  outAttr?: { name: 'out' | 'to'; value: string; start: number; end: number };
  rawTag: string;
  attrs?: Record<string, string>;
}

/**
 * Inspects XML code at or around a character position to extract any rule node
 * that defines in/out/from/to patterns.
 */
export function extractRuleAtPos(code: string, pos: number): CodeRuleInfo | null {
  if (!code || code.length === 0) return null;
  const safePos = Math.max(0, Math.min(code.length, pos));

  let tagStart = -1;
  let tagEnd = -1;

  // Search backward for '<'
  for (let i = safePos; i >= 0; i--) {
    if (code[i] === '<') {
      if (code.slice(i, i + 4) === '<!--' || code.slice(i, i + 2) === '<?' || code.slice(i, i + 2) === '</') {
        continue;
      }
      tagStart = i;
      break;
    }
    if (code[i] === '>') {
      break;
    }
  }

  if (tagStart !== -1) {
    const closeIdx = code.indexOf('>', tagStart);
    if (closeIdx !== -1 && safePos <= closeIdx + 1) {
      tagEnd = closeIdx + 1;
    } else {
      tagStart = -1;
    }
  }

  // Fallback: check current line
  if (tagStart === -1) {
    const lineStart = code.lastIndexOf('\n', safePos - 1) + 1;
    let lineEnd = code.indexOf('\n', safePos);
    if (lineEnd === -1) lineEnd = code.length;
    const lineText = code.slice(lineStart, lineEnd);

    const match = /<([a-zA-Z0-9_-]+)[^>]*?(?:in|out|from|to)\s*=\s*[^>]*>/i.exec(lineText);
    if (match) {
      tagStart = lineStart + match.index;
      tagEnd = tagStart + match[0].length;
    }
  }

  if (tagStart === -1 || tagEnd === -1) return null;

  const rawTag = code.slice(tagStart, tagEnd);
  const nameMatch = /^<([a-zA-Z0-9_-]+)/.exec(rawTag);
  if (!nameMatch) return null;
  const tag = nameMatch[1];

  const line = code.slice(0, tagStart).split('\n').length;

  let inAttr: CodeRuleInfo['inAttr'] = undefined;
  let outAttr: CodeRuleInfo['outAttr'] = undefined;
  const attrs: Record<string, string> = {};

  const attrRegex = /\b([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(rawTag)) !== null) {
    const attrName = m[1].toLowerCase();
    const val = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] ?? '';
    attrs[attrName] = val;

    if (attrName === 'in' || attrName === 'from' || attrName === 'out' || attrName === 'to') {
      const quote = m[2] !== undefined ? '"' : m[3] !== undefined ? "'" : '';
      const quoteIdx = quote ? m[0].indexOf(quote, m[1].length) : m[0].indexOf('=') + 1;
      const absStart = tagStart + m.index + quoteIdx + (quote ? 1 : 0);
      const absEnd = absStart + val.length;

      if (attrName === 'in' || attrName === 'from') {
        inAttr = { name: attrName as 'in' | 'from', value: val, start: absStart, end: absEnd };
      } else if (attrName === 'out' || attrName === 'to') {
        outAttr = { name: attrName as 'out' | 'to', value: val, start: absStart, end: absEnd };
      }
    }
  }

  if (!inAttr && !outAttr && tag !== 'path') return null;

  return {
    tag,
    tagStart,
    tagEnd,
    line,
    inAttr,
    outAttr,
    rawTag,
    attrs,
  };
}

/**
 * Replaces the in/from and out/to attribute values in code without altering
 * other attributes or surrounding XML structure.
 */
export function replaceRuleInCode(
  code: string,
  ruleInfo: CodeRuleInfo,
  newIn: string,
  newOut: string,
): string {
  const replacements: Array<{ start: number; end: number; val: string }> = [];

  if (ruleInfo.inAttr) {
    replacements.push({
      start: ruleInfo.inAttr.start,
      end: ruleInfo.inAttr.end,
      val: newIn,
    });
  }
  if (ruleInfo.outAttr) {
    replacements.push({
      start: ruleInfo.outAttr.start,
      end: ruleInfo.outAttr.end,
      val: newOut,
    });
  }

  // Sort descending by start offset so prior replacements don't shift offsets
  replacements.sort((a, b) => b.start - a.start);

  let result = code;
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.val + result.slice(r.end);
  }
  return result;
}

