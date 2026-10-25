// XML tokenizer, syntax highlighter, and validator for MarkovJunior models in the editor.

import { compileMjx, type MjxModel } from '../../src/mj/model';
import type { Vec3 } from '../../src/mj/engine';

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
export function highlightXml(src: string): string {
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
      out += `<span class="${attrCls}">${escapeHtml(attrName)}</span>`;

      if (match[2] !== undefined || match[3] !== undefined || match[4] !== undefined) {
        out += '<span class="tok-punct">=</span>';
        const rawVal = match[2] ?? match[3] ?? match[4];
        const quote = match[2] !== undefined ? '"' : match[3] !== undefined ? "'" : '';
        out += `<span class="tok-val">${quote}${escapeHtml(rawVal)}${quote}</span>`;
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
