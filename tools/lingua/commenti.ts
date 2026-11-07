// The comments of the seed's Lua and XML (T309, ADR-0153): where they are, which ones are still Italian, and the check that a file
// whose comments changed has the same code. Lua: the same tokens once the comments are gone. XML: the same tree of elements and
// attributes (the reader of the game, `src/mj/xml.ts`, drops comments). The voxels are `tests/mj-engine-determinism.test.ts`.

import { parseXml, type XmlElement } from '../../src/mj/xml';

/** A comment in a source: where it starts and ends (`end` excluded; a Lua line comment ends before its newline). */
export interface Span {
  start: number;
  end: number;
}

/** What a Lua source is made of: its comments and the tokens of its code, as they are written. */
export function luaScan(src: string): { comments: Span[]; tokens: string[] } {
  const comments: Span[] = [];
  const tokens: string[] = [];
  const longEnd = (at: number): number => {
    const m = /^\[(=*)\[/.exec(src.slice(at, at + 64));
    if (!m) return -1;
    const close = src.indexOf(`]${m[1]}]`, at + m[0].length);
    return close < 0 ? src.length : close + m[1].length + 2;
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (src.startsWith('--', i)) {
      const long = longEnd(i + 2);
      let end = long;
      if (end < 0) {
        const nl = src.indexOf('\n', i);
        end = nl < 0 ? src.length : nl;
        if (src[end - 1] === '\r') end--;
      }
      comments.push({ start: i, end });
      i = end;
      continue;
    }
    if (c === '[' && /^\[=*\[/.test(src.slice(i, i + 64))) {
      const end = longEnd(i);
      tokens.push(src.slice(i, end));
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      const end = Math.min(src.length, j + 1);
      tokens.push(src.slice(i, end));
      i = end;
      continue;
    }
    const word = /^[A-Za-z_][A-Za-z0-9_]*|^0[xX][0-9A-Fa-f.pP+-]+|^[0-9][0-9.eE]*(?:[eE][+-]?[0-9]+)?/.exec(src.slice(i, i + 200));
    if (word) {
      tokens.push(word[0]);
      i += word[0].length;
      continue;
    }
    const op = /^(==|~=|<=|>=|\/\/|<<|>>|\.\.\.|\.\.|::)/.exec(src.slice(i, i + 3));
    const t = op ? op[0] : c;
    tokens.push(t);
    i += t.length;
  }
  return { comments, tokens };
}

/** The comments of an XML program, `<!--` to `-->` included. */
export function xmlComments(src: string): Span[] {
  return [...src.matchAll(/<!--[\s\S]*?-->/g)].map((m) => ({ start: m.index!, end: m.index! + m[0].length }));
}

/**
 * The comments of a source as one translates them: in Lua the comments on lines of their own that follow each other (no blank line
 * between) are one unit, a comment after code or a long comment is a unit by itself; in XML every comment is a unit.
 */
export function commentUnits(src: string, kind: 'lua' | 'xml'): Span[] {
  if (kind === 'xml') return xmlComments(src);
  const own = (s: Span) => /^[ \t]*$/.test(src.slice(src.lastIndexOf('\n', s.start - 1) + 1, s.start));
  const out: Span[] = [];
  let prevOwnLine = false;
  for (const s of luaScan(src).comments) {
    const line = own(s) && !/^--\[=*\[/.test(src.slice(s.start, s.start + 64));
    const last = out[out.length - 1];
    if (line && prevOwnLine && last && /^\r?\n[ \t]*$/.test(src.slice(last.end, s.start))) last.end = s.end;
    else out.push({ ...s });
    prevOwnLine = line;
  }
  return out;
}

const tree = (e: XmlElement): unknown => ({ name: e.name, attrs: e.attrs, children: e.children.map(tree) });

/** Why two versions of a source do not have the same code, or undefined if they do (comments and spacing aside). */
export function codeDifference(before: string, after: string, kind: 'lua' | 'xml'): string | undefined {
  if (kind === 'lua') {
    const a = luaScan(before).tokens;
    const b = luaScan(after).tokens;
    const at = a.findIndex((t, k) => t !== b[k]);
    if (at < 0 && a.length === b.length) return undefined;
    const k = at < 0 ? Math.min(a.length, b.length) : at;
    return `token ${k}: ${JSON.stringify(a[k])} → ${JSON.stringify(b[k])}`;
  }
  const a = JSON.stringify(parseXml(before).map(tree));
  const b = JSON.stringify(parseXml(after).map(tree));
  if (a === b) return undefined;
  let k = 0;
  while (a[k] === b[k]) k++;
  return `albero diverso: …${a.slice(Math.max(0, k - 60), k + 60)}… → …${b.slice(Math.max(0, k - 60), k + 60)}…`;
}

// Italian, as a heuristic: function words English does not have, and accented letters. Quoted text («…», "…") is skipped: a comment
// may quote what the world says, in the language of its universe.
const ITALIAN = new Set(
  ('il la le lo gli di un della delle dello degli del dei che non con una uno sono nella nelle nel negli alla alle allo ai dal dalla dalle dai sul sulla ' +
    'sulle sui quando dove anche più perché ogni questo questa questi queste quello quella si ci tra fra già sempre poi solo ma ' +
    'cosa tutto tutti tutte senza sopra sotto dentro fuori dopo prima ancora oppure cioè ecco qui qua così').split(' '),
);

/** The Italian words of a comment (empty if it reads as English or has no words). */
export function italianWords(comment: string): string[] {
  const text = comment.replace(/«[^»]*»|"[^"\n]*"|“[^”]*”/g, ' ');
  const words = text.toLowerCase().match(/[a-zàèéìòù']+/g) ?? [];
  const out = words.flatMap((w) => w.split("'")).filter((w) => ITALIAN.has(w) || /[àèéìòù]/.test(w));
  return [...new Set(out)];
}

/** Whether a comment is still Italian: two different Italian words (one alone is a name, «DEL», or chance). */
export function isItalian(comment: string): boolean {
  return italianWords(comment).length >= 2;
}
