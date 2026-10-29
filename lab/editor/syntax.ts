// XML tokenizer, syntax highlighter, and validator for MarkovJunior models in the editor.

import { compileMjx, type MjxModel } from '../../src/mj/model';
import type { Vec3 } from '../../src/mj/engine';
import { MJ_PALETTE } from '../../src/mj/palette';

export interface ValidationSuccess {
  ok: true;
  model: MjxModel;
  warnings: string[];
}

export interface ValidationError {
  ok: false;
  error: string;
  line: number;
}

export type ValidationResult = ValidationSuccess | ValidationError;

export interface PaletteColorInfo {
  color: string;
  name?: string;
  glow?: boolean;
  alpha?: number;
}

export interface HighlightOptions {
  palette?: Record<string, PaletteColorInfo>;
  colorChips?: boolean;
}

export const COLOR_ATTRS = new Set([
  'color',
  'on',
  'values',
  'in',
  'out',
  'from',
  'to',
  'symbol',
  'ground',
]);

export function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return '#ffffff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#0c0e14' : '#ffffff';
}

export const MJ_NODES = new Set([
  'sequence',
  'markov',
  'one',
  'all',
  'prl',
  'rule',
  'color',
  'animation',
  'action',
  'box',
  'cylinder',
  'cone',
  'ellipsoid',
  'line',
  'convolution',
  'path',
  'map',
  'union',
  'wfc',
  'overlapping',
  'tileset',
  'tile',
  'tiles',
  'rules',
]);

export const MJ_ATTRS = new Set([
  'values',
  'size',
  'in',
  'out',
  'symbol',
  'value',
  'glow',
  'part',
  'steps',
  'frames',
  'name',
  'label',
  'file',
  'origin',
  'ground',
  'symmetry',
  'on',
  'at',
  'to',
  'r',
  'sample',
  'tilesize',
  'periodic',
  'overlap',
  'd',
  'n',
  'weight',
  'comment',
]);

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function extractLineFromError(msg: string): number {
  const m = /(?:riga|line)\s+(\d+)/i.exec(msg);
  return m ? parseInt(m[1], 10) : 1;
}

/**
 * Validates a MarkovJunior XML model string.
 * Returns { ok: true, model, warnings } or { ok: false, error, line }.
 */
export function validateMjx(xml: string, sizeOverride?: Vec3): ValidationResult {
  const trimmed = xml.trim();
  if (!trimmed) {
    return { ok: false, error: 'Il codice XML è vuoto', line: 1 };
  }
  try {
    const model = compileMjx(xml, sizeOverride ? { size: sizeOverride } : {});
    return { ok: true, model, warnings: model.warnings };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const line = extractLineFromError(message);
    return { ok: false, error: message, line };
  }
}

/**
 * Tokenizes and highlights XML code with HTML markup for syntax highlighting.
 */
export function highlightXml(src: string, options?: HighlightOptions): string {
  let i = 0;
  const n = src.length;
  let out = '';

  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt === -1) {
      out += escapeHtml(src.slice(i));
      break;
    }

    if (lt > i) {
      out += escapeHtml(src.slice(i, lt));
      i = lt;
    }

    // Comment <!-- ... -->
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end === -1) {
        out += `<span class="tok-comment">${escapeHtml(src.slice(i))}</span>`;
        break;
      } else {
        out += `<span class="tok-comment">${escapeHtml(src.slice(i, end + 3))}</span>`;
        i = end + 3;
        continue;
      }
    }

    // Declaration or processing instruction <?...?> or <!DOCTYPE...>
    if (src.startsWith('<?', i) || src.startsWith('<!', i)) {
      const end = src.indexOf('>', i);
      if (end === -1) {
        out += `<span class="tok-meta">${escapeHtml(src.slice(i))}</span>`;
        break;
      } else {
        out += `<span class="tok-meta">${escapeHtml(src.slice(i, end + 1))}</span>`;
        i = end + 1;
        continue;
      }
    }

    // Closing tag </name>
    if (src.startsWith('</', i)) {
      const gt = src.indexOf('>', i);
      if (gt === -1) {
        out += `<span class="tok-punct">&lt;/</span>${escapeHtml(src.slice(i + 2))}`;
        break;
      }
      const tagContent = src.slice(i + 2, gt).trim();
      const isMj = MJ_NODES.has(tagContent.toLowerCase());
      const tagCls = isMj ? 'tok-tag tok-mj-node' : 'tok-tag';
      out += `<span class="tok-punct">&lt;/</span><span class="${tagCls}">${escapeHtml(tagContent)}</span><span class="tok-punct">&gt;</span>`;
      i = gt + 1;
      continue;
    }

    // Opening or self-closing tag <name ...>
    const gt = src.indexOf('>', i);
    if (gt === -1) {
      out += `<span class="tok-punct">&lt;</span>${escapeHtml(src.slice(i + 1))}`;
      break;
    }

    // Inside tag from i+1 to gt
    const fullTag = src.slice(i + 1, gt);
    const selfClosing = fullTag.endsWith('/');
    const tagBody = selfClosing ? fullTag.slice(0, -1) : fullTag;

    // Split tag name from attributes
    const nameMatch = /^([\w:.-]+)/.exec(tagBody);
    if (!nameMatch) {
      out += `<span class="tok-punct">&lt;</span>${escapeHtml(src.slice(i + 1, gt + 1))}`;
      i = gt + 1;
      continue;
    }

    const tagName = nameMatch[1];
    const isMjNode = MJ_NODES.has(tagName.toLowerCase());
    const tagCls = isMjNode ? 'tok-tag tok-mj-node' : 'tok-tag';

    out += `<span class="tok-punct">&lt;</span><span class="${tagCls}">${escapeHtml(tagName)}</span>`;

    // Process attributes inside tagBody
    let attrStr = tagBody.slice(nameMatch[0].length);
    const attrRegex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = attrRegex.exec(attrStr)) !== null) {
      if (match.index > lastIdx) {
        out += escapeHtml(attrStr.slice(lastIdx, match.index));
      }
      const attrName = match[1];
      const isMjAttr = MJ_ATTRS.has(attrName.toLowerCase());
      const attrCls = isMjAttr ? 'tok-attr tok-mj-attr' : 'tok-attr';

      const attrStrStart = i + 1 + nameMatch[0].length;
      const attrStartInSrc = attrStrStart + match.index;
      const eqIdx = match[0].indexOf('=');
      const quote = match[2] !== undefined ? '"' : match[3] !== undefined ? "'" : '';
      const quoteIdx = quote ? match[0].indexOf(quote, eqIdx) : -1;
      const rawVal = match[2] ?? match[3] ?? match[4];
      const valStartInSrc = quoteIdx >= 0 ? attrStartInSrc + quoteIdx + 1 : attrStartInSrc;

      const isFilterAttr = ['in', 'out', 'from', 'to'].includes(attrName.toLowerCase());
      let filterBtn = '';
      if (isFilterAttr && options?.colorChips && rawVal !== undefined) {
        filterBtn = `<button class="tok-filter-btn" type="button" data-tag="${escapeHtml(tagName)}" data-attr="${escapeHtml(attrName)}" data-pos="${valStartInSrc}" data-len="${rawVal.length}" data-val="${escapeHtml(rawVal)}" title="Apri '${escapeHtml(attrName)}' nel Filtro 3D">▦</button>`;
      }

      out += `<span class="${attrCls}">${escapeHtml(attrName)}${filterBtn}</span>`;

      if (match[2] !== undefined || match[3] !== undefined || match[4] !== undefined) {
        out += '<span class="tok-punct">=</span>';

        const isSymbolDef = tagName.toLowerCase() === 'color' && attrName.toLowerCase() === 'symbol';
        if (options?.colorChips && quote && COLOR_ATTRS.has(attrName.toLowerCase()) && !isSymbolDef) {
          let chipsHtml = '';
          for (let k = 0; k < rawVal.length; k++) {
            const ch = rawVal[k];
            const charPos = valStartInSrc + k;

            if (/\s/.test(ch) || ch === '/' || ch === '[' || ch === ']') {
              chipsHtml += escapeHtml(ch);
              continue;
            }

            const pal = options.palette?.[ch] ?? MJ_PALETTE[ch];
            if (pal?.color) {
              const hex = pal.color.startsWith('#') ? pal.color : `#${pal.color}`;
              const fg = getContrastColor(hex);
              const isGlowing = 'glow' in pal ? !!(pal as PaletteColorInfo).glow : false;
              const isGlass = 'alpha' in pal ? (pal as PaletteColorInfo).alpha !== undefined && (pal as PaletteColorInfo).alpha! < 1.0 : false;
              const glowClass = isGlowing ? ' tok-glow' : '';
              const glassClass = isGlass ? ' tok-glass' : '';
              const title = `${escapeHtml(ch)}: ${escapeHtml(pal.name ?? ch)} (${hex}${isGlass ? ' · Vetro' : ''}) · Clicca per cambiare`;
              chipsHtml += `<span class="tok-color-chip${glowClass}${glassClass}" data-letter="${escapeHtml(ch)}" data-attr="${escapeHtml(attrName)}" data-pos="${charPos}" style="--chip-bg:${hex};--chip-text:${fg};" title="${title}">${escapeHtml(ch)}</span>`;
            } else if (ch === '*') {
              chipsHtml += `<span class="tok-color-chip tok-wildcard" data-letter="*" data-attr="${escapeHtml(attrName)}" data-pos="${charPos}" title="Wildcard (*): qualsiasi voxel">*</span>`;
            } else if (ch === '.') {
              chipsHtml += `<span class="tok-color-chip tok-air" data-letter="." data-attr="${escapeHtml(attrName)}" data-pos="${charPos}" title="Aria (.)">.</span>`;
            } else {
              chipsHtml += `<span class="tok-color-chip tok-unknown" data-letter="${escapeHtml(ch)}" data-attr="${escapeHtml(attrName)}" data-pos="${charPos}">${escapeHtml(ch)}</span>`;
            }
          }
          out += `<span class="tok-val">${quote}${chipsHtml}${quote}</span>`;
        } else if (options?.colorChips && quote && (attrName.toLowerCase() === 'value' || tagName.toLowerCase() === 'color')) {
          const cleanHex = rawVal.replace(/^#/, '');
          if (/^[0-9a-fA-F]{6}$/i.test(cleanHex)) {
            const hash = rawVal.startsWith('#') ? '#' : '';
            const title = `Colore hex #${cleanHex} · Clicca per aprire il color picker`;
            out += `<span class="tok-val">${quote}<span class="tok-hex-code" data-tag="${escapeHtml(tagName)}" data-attr="${escapeHtml(attrName)}" data-pos="${valStartInSrc}" data-len="${rawVal.length}" data-hex="${cleanHex}" title="${title}"><span class="tok-hex-swatch" style="--swatch-hex:#${cleanHex};"></span>${hash}${cleanHex}</span>${quote}</span>`;
          } else {
            out += `<span class="tok-val">${quote}${escapeHtml(rawVal)}${quote}</span>`;
          }
        } else {
          out += `<span class="tok-val">${quote}${escapeHtml(rawVal)}${quote}</span>`;
        }
      }

      lastIdx = attrRegex.lastIndex;
    }

    if (lastIdx < attrStr.length) {
      out += escapeHtml(attrStr.slice(lastIdx));
    }

    if (selfClosing) {
      out += '<span class="tok-punct">/&gt;</span>';
    } else {
      out += '<span class="tok-punct">&gt;</span>';
    }

    i = gt + 1;
  }

  return out;
}

export interface TagAttrDef {
  name: string;
  default?: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'color';
}

export const TAG_SCHEMAS: Record<string, TagAttrDef[]> = {
  sequence: [
    { name: 'values', default: 'BW', description: 'Simboli colori usati nel modello' },
    { name: 'size', default: '20 20 20', description: 'Dimensioni griglia X Y Z' },
    { name: 'scale', default: '1 1 1', description: 'Fattore di scala' },
    { name: 'origin', default: 'False', description: 'Centrato nell\'origine' },
    { name: 'name', default: '', description: 'Nome modello' },
    { name: 'steps', default: '', description: 'Limite passi esecuzione' },
  ],
  markov: [
    { name: 'steps', default: '', description: 'Iterazioni massime del loop' },
    { name: 'symmetry', default: '(xy)', description: 'Simmetria di rotazione/riflessione' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  all: [
    { name: 'in', default: '*', description: 'Pattern di ricerca' },
    { name: 'out', default: '*', description: 'Pattern di sostituzione' },
    { name: 'steps', default: '1', description: 'Numero di passi' },
    { name: 'symmetry', default: '(xy)', description: 'Simmetria pattern' },
    { name: 'p', default: '1.0', description: 'Probabilità' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  one: [
    { name: 'in', default: '*', description: 'Pattern di ricerca' },
    { name: 'out', default: '*', description: 'Pattern di sostituzione' },
    { name: 'steps', default: '1', description: 'Numero di passi' },
    { name: 'symmetry', default: '(xy)', description: 'Simmetria pattern' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  prl: [
    { name: 'in', default: '*', description: 'Pattern di ricerca' },
    { name: 'out', default: '*', description: 'Pattern di sostituzione' },
    { name: 'steps', default: '1', description: 'Numero di passi' },
    { name: 'symmetry', default: '(xy)', description: 'Simmetria pattern' },
    { name: 'p', default: '0.5', description: 'Probabilità parallela stocastica' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  path: [
    { name: 'from', default: 'a', description: 'Simbolo/pattern di partenza' },
    { name: 'to', default: 'u', description: 'Simbolo/pattern di destinazione' },
    { name: 'on', default: 'E', description: 'Simboli substrato transitabile' },
    { name: 'color', default: 'G', description: 'Colore del sentiero scavato' },
    { name: 'steps', default: '1', description: 'Numero iterazioni' },
    { name: 'inertia', default: 'False', description: 'Privilegia linee rette' },
    { name: 'longest', default: 'False', description: 'Cerca il percorso più lungo' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  convolution: [
    { name: 'neighborhood', default: 'Moore', description: 'Tipo vicinato (Moore, VonNeumann, NoCorners)' },
    { name: 'in', default: 'B', description: 'Voxel centrale da considerare' },
    { name: 'out', default: 'W', description: 'Voxel trasformato' },
    { name: 'values', default: '', description: 'Simboli contati nel vicinato' },
    { name: 'sum', default: '', description: 'Intervallo conteggio es. 4..8' },
    { name: 'steps', default: '1', description: 'Numero di passi' },
    { name: 'p', default: '1.0', description: 'Probabilità' },
    { name: 'periodic', default: 'False', description: 'Bordi periodici' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  map: [
    { name: 'scale', default: '2 2 2', description: 'Moltiplicatore risoluzione X Y Z' },
    { name: 'values', default: 'BW', description: 'Simboli considerati' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  rule: [
    { name: 'in', default: '*', description: 'Pattern di match' },
    { name: 'out', default: '*', description: 'Pattern di sostituzione' },
    { name: 'p', default: '1.0', description: 'Probabilità individuale' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  color: [
    { name: 'symbol', default: '', description: 'Carattere univoco identificativo' },
    { name: 'value', default: 'ffffff', description: 'Colore esadecimale RRGGBB' },
    { name: 'name', default: '', description: 'Nome descrittivo' },
    { name: 'alpha', default: '1.0', description: 'Trasparenza / vetro (0.0..1.0)' },
    { name: 'glow', default: 'False', description: 'Emissione luminosa bloom' },
    { name: 'part', default: '', description: 'Arto per animazione rig' },
  ],
  box: [
    { name: 'at', default: '0 0 0', description: 'Posizione minima angolo' },
    { name: 'size', default: '4 4 4', description: 'Larghezza, profondità, altezza' },
    { name: 'color', default: 'W', description: 'Colore voxel' },
    { name: 'on', default: '', description: 'Filtro substrato (opzionale)' },
    { name: 'comment', default: '', description: 'Descrizione opzionale' },
  ],
  cylinder: [
    { name: 'at', default: '0 0 0', description: 'Posizione base' },
    { name: 'size', default: '4 4 4', description: 'Dimensioni raggio/altezza' },
    { name: 'color', default: 'W', description: 'Colore voxel' },
    { name: 'on', default: '', description: 'Filtro substrato' },
  ],
  cone: [
    { name: 'at', default: '0 0 0', description: 'Posizione vertice/base' },
    { name: 'size', default: '4 4 4', description: 'Dimensioni cono' },
    { name: 'color', default: 'W', description: 'Colore voxel' },
    { name: 'on', default: '', description: 'Filtro substrato' },
  ],
  ellipsoid: [
    { name: 'at', default: '0 0 0', description: 'Posizione centro' },
    { name: 'size', default: '4 4 4', description: 'Semiassi ellissoide' },
    { name: 'color', default: 'W', description: 'Colore voxel' },
    { name: 'on', default: '', description: 'Filtro substrato' },
  ],
  line: [
    { name: 'at', default: '0 0 0', description: 'Punto di partenza' },
    { name: 'to', default: '4 0 0', description: 'Punto di arrivo' },
    { name: 'r', default: '1', description: 'Raggio spessore' },
    { name: 'color', default: 'W', description: 'Colore voxel' },
    { name: 'on', default: '', description: 'Filtro substrato' },
  ],
  wfc: [
    { name: 'sample', default: '', description: 'Modello sorgente di esempio' },
    { name: 'tilesize', default: '3', description: 'Dimensione pattern sovrapposti' },
    { name: 'periodic', default: 'False', description: 'Bordi periodici' },
    { name: 'name', default: '', description: 'Identificativo' },
  ],
  overlapping: [
    { name: 'sample', default: '', description: 'File o nome campione di input' },
    { name: 'n', default: '3', description: 'Dimensione N×N×N dei blocchi' },
    { name: 'periodic', default: 'False', description: 'Wrap periodico' },
    { name: 'symmetry', default: '8', description: 'Simmetrie usate' },
  ],
  animation: [
    { name: 'name', default: '', description: 'Nome traccia animazione' },
    { name: 'frames', default: '16', description: 'Numero di fotogrammi totali' },
  ],
  action: [
    { name: 'name', default: '', description: 'Identificativo azione Concilio' },
    { name: 'label', default: '', description: 'Etichetta visualizzata nel gioco' },
    { name: 'steps', default: '1', description: 'Passi di esecuzione' },
  ],
};

export interface ParsedTagAtCursor {
  tag: string;
  tagStart: number;
  tagEnd: number;
  declaredAttrs: Array<{ name: string; value: string; raw: string }>;
  isSelfClosing: boolean;
  isClosing: boolean;
}

/**
 * Inspects XML around the cursor position to find if it is on/inside an XML tag.
 */
export function parseTagAtCursor(xml: string, pos: number): ParsedTagAtCursor | null {
  if (!xml || pos < 0 || pos > xml.length) return null;

  // Search backward for '<'
  let tagStart = -1;
  for (let i = pos; i >= 0; i--) {
    if (xml[i] === '<') {
      // Check if it's a comment
      if (xml.slice(i, i + 4) === '<!--') {
        const commentEnd = xml.indexOf('-->', i);
        if (commentEnd !== -1 && pos <= commentEnd + 3) {
          return null;
        }
      }
      tagStart = i;
      break;
    }
    if (xml[i] === '>' && i < pos) {
      // Cursor is after a tag close
      break;
    }
  }

  if (tagStart === -1) {
    // Check if cursor is right before or on a '<'
    if (xml[pos] === '<') {
      tagStart = pos;
    } else {
      return null;
    }
  }

  const closeIdx = xml.indexOf('>', tagStart);
  if (closeIdx === -1) return null;
  const tagEnd = closeIdx + 1;

  // Verify pos is within tagStart and tagEnd
  if (pos < tagStart || pos > tagEnd) return null;

  const rawTag = xml.slice(tagStart, tagEnd);
  const isClosing = rawTag.startsWith('</');
  const isSelfClosing = rawTag.endsWith('/>');

  const nameMatch = isClosing ? /^<\/([\w:.-]+)/.exec(rawTag) : /^<([\w:.-]+)/.exec(rawTag);
  if (!nameMatch) return null;

  const tag = nameMatch[1];
  const declaredAttrs: Array<{ name: string; value: string; raw: string }> = [];

  if (!isClosing) {
    const attrBody = rawTag.slice(nameMatch[0].length, isSelfClosing ? -2 : -1);
    const attrRegex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(attrBody)) !== null) {
      const name = m[1];
      const value = m[2] ?? m[3] ?? m[4] ?? '';
      declaredAttrs.push({ name, value, raw: m[0] });
    }
  }

  return {
    tag,
    tagStart,
    tagEnd,
    declaredAttrs,
    isSelfClosing,
    isClosing,
  };
}
