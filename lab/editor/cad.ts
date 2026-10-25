// CAD logic and geometric utilities for MarkovJunior Model Editor (T59b).
// Handles interactive voxel shapes, color palettes, glow properties, and XML synchronization.

import { MJ_PALETTE } from '../../src/mj/palette';

export type ShapeKind = 'box' | 'cylinder' | 'ellipsoid' | 'cone' | 'line';

export interface CadShape {
  id: number;
  kind: ShapeKind;
  at: [number, number, number];
  size: [number, number, number];
  to?: [number, number, number];
  r?: number;
  color: string;
  on?: string;
  line: number;
  rawTag: string;
  startIndex: number;
  endIndex: number;
}

export interface CadColorDef {
  symbol: string;
  value?: string;
  glow?: boolean;
  part?: string;
  name?: string;
  line?: number;
}

export interface CadShapeInput {
  kind: ShapeKind;
  at: [number, number, number];
  size: [number, number, number];
  to?: [number, number, number];
  r?: number;
  color: string;
  on?: string;
}

// ------------------------------------------------------------------ XML Parsing Helpers

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(attrStr)) !== null) {
    attrs[match[1]] = match[2] ?? match[3] ?? '';
  }
  return attrs;
}

function parseVec3(str?: string, def: [number, number, number] = [0, 0, 0]): [number, number, number] {
  if (!str) return def;
  const parts = str.trim().split(/[\s,]+/).map(Number);
  if (parts.length === 1 && Number.isFinite(parts[0])) {
    return [parts[0], parts[0], parts[0]];
  }
  if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
    return [parts[0], parts[1], parts[2]];
  }
  return def;
}

function getLineNumber(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }
  return line;
}

// ------------------------------------------------------------------ Shape Parsing

const SHAPE_TAG_RE = /<(box|cylinder|ellipsoid|cone|line)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;

export function parseShapesFromXml(xml: string): CadShape[] {
  const shapes: CadShape[] = [];
  SHAPE_TAG_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  let id = 0;
  while ((match = SHAPE_TAG_RE.exec(xml)) !== null) {
    const rawTag = match[0];
    const kind = match[1].toLowerCase() as ShapeKind;
    const attrStr = match[2] || '';
    const attrs = parseAttrs(attrStr);

    const at = parseVec3(attrs.at, [0, 0, 0]);
    const size = parseVec3(attrs.size, [1, 1, 1]);
    const color = (attrs.color || 'B').slice(0, 1);
    const on = attrs.on || undefined;
    const to = attrs.to ? parseVec3(attrs.to) : undefined;
    const r = attrs.r !== undefined ? Number(attrs.r) : undefined;

    const startIndex = match.index;
    const endIndex = startIndex + rawTag.length;
    const line = getLineNumber(xml, startIndex);

    shapes.push({
      id: ++id,
      kind,
      at,
      size,
      to,
      r,
      color,
      on,
      line,
      rawTag,
      startIndex,
      endIndex,
    });
  }

  return shapes;
}

// ------------------------------------------------------------------ Color Parsing

const COLOR_TAG_RE = /<color\b([^>]*?)(?:\/>|>[\s\S]*?<\/color>)/gi;

export function parseColorsFromXml(xml: string): Record<string, CadColorDef> {
  const colors: Record<string, CadColorDef> = {};
  COLOR_TAG_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = COLOR_TAG_RE.exec(xml)) !== null) {
    const attrStr = match[1] || '';
    const attrs = parseAttrs(attrStr);
    const symbol = attrs.symbol || '';
    if (!symbol || symbol.length !== 1) continue;

    const value = attrs.value?.replace(/^#/, '').toLowerCase();
    const glow = /^true$/i.test(attrs.glow || '');
    const part = attrs.part || undefined;
    const name = attrs.name || attrs.comment || undefined;
    const line = getLineNumber(xml, match.index);

    colors[symbol] = {
      symbol,
      value: value ? `#${value}` : undefined,
      glow,
      part,
      name,
      line,
    };
  }

  return colors;
}

// ------------------------------------------------------------------ Root Values Management

export function ensureValueInRoot(xml: string, symbol: string): string {
  if (!symbol || symbol.length !== 1) return xml;

  const rootMatch = /<([a-zA-Z0-9_-]+)\b([^>]*?)>/i.exec(xml);
  if (!rootMatch) return xml;

  const rootTag = rootMatch[0];
  const rootAttrs = rootMatch[2];
  const valuesMatch = /\bvalues\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(rootAttrs);

  if (valuesMatch) {
    const currentValues = valuesMatch[1] ?? valuesMatch[2] ?? '';
    if (currentValues.includes(symbol)) return xml;
    const newValuesAttr = `values="${currentValues}${symbol}"`;
    const newRootTag = rootTag.replace(valuesMatch[0], newValuesAttr);
    return xml.replace(rootTag, newRootTag);
  }

  // If no values attribute, add it
  const insertPos = rootTag.length - 1;
  const newRootTag = rootTag.slice(0, insertPos) + ` values="0${symbol}"` + rootTag.slice(insertPos);
  return xml.replace(rootTag, newRootTag);
}

// ------------------------------------------------------------------ Shape XML Generation & Insertion

export function createShapeXml(input: CadShapeInput): string {
  const parts: string[] = [`<${input.kind}`];
  parts.push(`at="${input.at[0]} ${input.at[1]} ${input.at[2]}"`);

  if (input.kind === 'line') {
    if (input.to) parts.push(`to="${input.to[0]} ${input.to[1]} ${input.to[2]}"`);
    if (input.r !== undefined) parts.push(`r="${input.r}"`);
  } else {
    parts.push(`size="${input.size[0]} ${input.size[1]} ${input.size[2]}"`);
  }

  parts.push(`color="${input.color}"`);
  if (input.on) parts.push(`on="${input.on}"`);

  return parts.join(' ') + '/>';
}

export function insertShapeIntoXml(xml: string, shape: CadShapeInput): { newXml: string; line: number } {
  const updatedXml = ensureValueInRoot(xml, shape.color);
  const shapeStr = createShapeXml(shape);

  // Look for closing root tag, e.g. </sequence> or </markov>
  const closingMatch = /<\/(sequence|markov|all|one|prl)>/i.exec(updatedXml);
  if (closingMatch) {
    const index = closingMatch.index;
    const indent = '  ';
    const before = updatedXml.slice(0, index);
    const after = updatedXml.slice(index);
    const insertion = `${indent}${shapeStr}\n`;
    const newXml = before + insertion + after;
    const line = getLineNumber(newXml, index);
    return { newXml, line };
  }

  // Fallback: append inside root or at end
  const openMatch = /<([a-zA-Z0-9_-]+)\b[^>]*>/i.exec(updatedXml);
  if (openMatch) {
    const index = openMatch.index + openMatch[0].length;
    const before = updatedXml.slice(0, index);
    const after = updatedXml.slice(index);
    const insertion = `\n  ${shapeStr}`;
    const newXml = before + insertion + after;
    const line = getLineNumber(newXml, index + 2);
    return { newXml, line };
  }

  return { newXml: updatedXml + `\n${shapeStr}`, line: 1 };
}

// ------------------------------------------------------------------ Shape Updating & Deletion

export function updateShapeInXml(
  xml: string,
  shapeIndex: number,
  updates: Partial<CadShapeInput>,
): string {
  let updatedXml = xml;
  if (updates.color) {
    updatedXml = ensureValueInRoot(updatedXml, updates.color);
  }

  const shapes = parseShapesFromXml(updatedXml);
  const shape = shapes[shapeIndex];
  if (!shape) return updatedXml;

  const merged: CadShapeInput = {
    kind: updates.kind ?? shape.kind,
    at: updates.at ?? shape.at,
    size: updates.size ?? shape.size,
    to: updates.to ?? shape.to,
    r: updates.r ?? shape.r,
    color: updates.color ?? shape.color,
    on: updates.on !== undefined ? updates.on : shape.on,
  };

  const newTag = createShapeXml(merged);
  return updatedXml.slice(0, shape.startIndex) + newTag + updatedXml.slice(shape.endIndex);
}

export function deleteShapeFromXml(xml: string, shapeIndex: number): string {
  const shapes = parseShapesFromXml(xml);
  const shape = shapes[shapeIndex];
  if (!shape) return xml;

  let start = shape.startIndex;
  let end = shape.endIndex;

  // Trim leading whitespace up to newline
  while (start > 0 && (xml[start - 1] === ' ' || xml[start - 1] === '\t')) {
    start--;
  }
  // Trim trailing newline if whole line is deleted
  if (xml[end] === '\r' && xml[end + 1] === '\n') {
    end += 2;
  } else if (xml[end] === '\n') {
    end += 1;
  }

  return xml.slice(0, start) + xml.slice(end);
}

export function duplicateShapeInXml(
  xml: string,
  shapeIndex: number,
  offset: [number, number, number] = [0, 0, 1],
): { newXml: string; newLine: number } {
  const shapes = parseShapesFromXml(xml);
  const shape = shapes[shapeIndex];
  if (!shape) return { newXml: xml, newLine: 1 };

  const cloneInput: CadShapeInput = {
    kind: shape.kind,
    at: [shape.at[0] + offset[0], shape.at[1] + offset[1], shape.at[2] + offset[2]],
    size: [...shape.size],
    color: shape.color,
    on: shape.on,
    to: shape.to ? [shape.to[0] + offset[0], shape.to[1] + offset[1], shape.to[2] + offset[2]] : undefined,
    r: shape.r,
  };

  const cloneTag = createShapeXml(cloneInput);
  const insertionPoint = shape.endIndex;
  const before = xml.slice(0, insertionPoint);
  const after = xml.slice(insertionPoint);

  const indentMatch = /(^|\n)([ \t]*)$/.exec(before.slice(0, shape.startIndex));
  const indent = indentMatch ? indentMatch[2] : '  ';

  const newXml = before + `\n${indent}${cloneTag}` + after;
  const newLine = getLineNumber(newXml, insertionPoint + indent.length + 1);
  return { newXml, newLine };
}

// ------------------------------------------------------------------ Color / Palette Tag Management

export function setLetterColorInXml(
  xml: string,
  symbol: string,
  opts: { value?: string; glow?: boolean; part?: string; name?: string },
): string {
  if (!symbol || symbol.length !== 1) return xml;
  let updatedXml = ensureValueInRoot(xml, symbol);

  const colors = parseColorsFromXml(updatedXml);
  const existing = colors[symbol];

  const valHex = opts.value ? opts.value.replace(/^#/, '').toLowerCase() : undefined;
  const glowVal = opts.glow !== undefined ? opts.glow : existing?.glow;
  const partVal = opts.part !== undefined ? opts.part : existing?.part;
  const nameVal = opts.name !== undefined ? opts.name : existing?.name;

  const parts = [`<color symbol="${symbol}"`];
  if (valHex) {
    parts.push(`value="${valHex}"`);
  } else if (existing?.value) {
    parts.push(`value="${existing.value.replace(/^#/, '')}"`);
  } else if (MJ_PALETTE[symbol]) {
    parts.push(`value="${MJ_PALETTE[symbol].color.replace(/^#/, '').toLowerCase()}"`);
  }

  if (glowVal) parts.push('glow="True"');
  if (partVal) parts.push(`part="${partVal}"`);
  if (nameVal) parts.push(`name="${nameVal}"`);

  const colorTag = parts.join(' ') + '/>';

  // If existing color tag, replace it
  if (existing && existing.line) {
    const lines = updatedXml.split('\n');
    const lineIdx = existing.line - 1;
    if (lineIdx >= 0 && lineIdx < lines.length) {
      lines[lineIdx] = lines[lineIdx].replace(/<color\b[^>]*\/>/i, colorTag);
      return lines.join('\n');
    }
  }

  // Otherwise insert right after opening sequence/markov tag
  const openMatch = /<([a-zA-Z0-9_-]+)\b[^>]*>/i.exec(updatedXml);
  if (openMatch) {
    const idx = openMatch.index + openMatch[0].length;
    const before = updatedXml.slice(0, idx);
    const after = updatedXml.slice(idx);
    return before + `\n  ${colorTag}` + after;
  }

  return updatedXml + `\n${colorTag}`;
}

// ------------------------------------------------------------------ Coordinate Transformations

export function voxelToThree(
  v: [number, number, number],
  grid: { X: number; Y: number; Z: number },
  vpt = 20,
): [number, number, number] {
  const s = 1 / vpt;
  const px = grid.X / 2;
  const py = grid.Y / 2;
  const pz = 0;
  // Three.js: x = (vx - px)*s, y = (vz - pz)*s, z = (vy - py)*s
  return [(v[0] - px) * s, (v[2] - pz) * s, (v[1] - py) * s];
}

export function threeToVoxel(
  t: [number, number, number],
  grid: { X: number; Y: number; Z: number },
  vpt = 20,
): [number, number, number] {
  const s = 1 / vpt;
  const px = grid.X / 2;
  const py = grid.Y / 2;
  const pz = 0;
  return [
    Math.round(t[0] / s + px),
    Math.round(t[2] / s + py),
    Math.round(t[1] / s + pz),
  ];
}

// ------------------------------------------------------------------ Shape Hit Testing

export function isVoxelInsideShape(
  vx: number,
  vy: number,
  vz: number,
  shape: CadShape,
): boolean {
  const [cx, cy, bz] = shape.at;
  const [w, d, h] = shape.size;

  if (shape.kind === 'box') {
    return (
      Math.abs(vx - cx) <= (w - 1) / 2 &&
      Math.abs(vy - cy) <= (d - 1) / 2 &&
      vz >= bz &&
      vz < bz + h
    );
  }

  const a = w / 2;
  const b = d / 2;
  const u = (vx - cx) / a;
  const v = (vy - cy) / b;

  if (shape.kind === 'cylinder') {
    return u * u + v * v < 1 && vz >= bz && vz < bz + h;
  }

  if (shape.kind === 'ellipsoid') {
    const c = h / 2;
    const s = (vz - (bz + (h - 1) / 2)) / c;
    return u * u + v * v + s * s < 1;
  }

  if (shape.kind === 'cone') {
    if (vz < bz || vz >= bz + h) return false;
    const k = 1 - (vz - bz) / h;
    return u * u + v * v < k * k;
  }

  return false;
}

export function findShapeAtVoxel(
  vx: number,
  vy: number,
  vz: number,
  shapes: CadShape[],
): { shape: CadShape; index: number } | null {
  // Search in reverse order (topmost / last declared first)
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (isVoxelInsideShape(vx, vy, vz, shapes[i])) {
      return { shape: shapes[i], index: i };
    }
  }
  return null;
}
