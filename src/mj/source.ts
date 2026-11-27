// A MarkovJunior program's text rebuilt piece by piece (T342, moved here by T531): what holds symbols, attribute by attribute, and the
// rewriter that changes only those. The migration 0.5 → 0.6 (src/kernel/migrations.ts, `programFor0_6`) and the reading of the original's
// text (src/mj/original.ts, `originalProgram`) both pass through it: everything stays as it is but the symbols.

/** The attributes that hold symbols, element by element (T342); `values`, `ground` and `soil` everywhere. */
export const SYMBOL_ATTRS: Readonly<Record<string, readonly string[]>> = {
  one: ['in', 'out'],
  all: ['in', 'out'],
  prl: ['in', 'out'],
  rule: ['in', 'out'],
  convolution: ['in', 'out'],
  union: ['symbol'],
  color: ['symbol'],
  path: ['from', 'to', 'on', 'color'],
  box: ['color', 'on'],
  ellipsoid: ['color', 'on'],
  cylinder: ['color', 'on'],
  cone: ['color', 'on'],
  line: ['color', 'on'],
  field: ['for', 'from', 'to', 'on'],
  observe: ['value', 'from', 'to'],
  convchain: ['on', 'black', 'white'],
};
export const SYMBOL_ATTRS_EVERYWHERE = ['values', 'ground', 'soil', 'suolo'];
/** The elements whose text is a pattern: a rule's sides (T333), a tile (T335). */
export const PATTERN_TEXTS = new Set(['in', 'out', 'tile']);
/** The signs a union "#" may take, in order: none is a mark of a pattern, nor "|" (the separator of a wfc's out). */
export const UNION_SIGNS = ['~', '^', '!', '$', '%', '@', '+', '=', '_', ';', ':', ','];

export interface OpenElement {
  name: string;
  attrs: Record<string, string>;
}

/**
 * A MarkovJunior program rebuilt piece by piece, everything as it is but what `attr` and `text` give back: an attribute's value (with
 * its element and the elements it is inside, outermost first), the text inside an element. What does not read as XML stays as it is.
 */
export function rewriteMjxSource(
  xml: string,
  attr: (el: OpenElement, outer: readonly OpenElement[], name: string, value: string) => string,
  text: (el: OpenElement, value: string) => string,
): string {
  let out = '';
  let i = 0;
  const stack: OpenElement[] = [];
  /** Where what starts at `i` ends, `close` included (the end of the text if it is not there). */
  const endOf = (close: string) => {
    const end = xml.indexOf(close, i);
    return end < 0 ? xml.length : end + close.length;
  };
  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    const top = stack[stack.length - 1];
    if (lt < 0) {
      out += xml.slice(i);
      break;
    }
    if (lt > i) out += top ? text(top, xml.slice(i, lt)) : xml.slice(i, lt);
    i = lt;
    if (xml.startsWith('<!--', i) || xml.startsWith('<?', i) || xml.startsWith('<!', i) || xml.startsWith('</', i)) {
      const end = endOf(xml.startsWith('<!--', i) ? '-->' : '>');
      if (xml.startsWith('</', i)) stack.pop();
      out += xml.slice(i, end);
      i = end;
      continue;
    }
    const m = /^<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)(\s*\/?>)/.exec(xml.slice(i));
    if (!m) {
      out += '<';
      i++;
      continue;
    }
    const el: OpenElement = { name: m[1], attrs: {} };
    for (const a of m[2].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) el.attrs[a[1]] = a[2] ?? a[3];
    const outer = [...stack];
    const attrs = m[2].replace(/([\w:.-]+)(\s*=\s*)(?:"([^"]*)"|'([^']*)')/g, (all: string, name: string, eq: string, dq: string | undefined, sq: string | undefined) => {
      const value = dq ?? sq ?? '';
      const next = attr(el, outer, name, value);
      const q = dq !== undefined ? '"' : "'";
      return next === value ? all : `${name}${eq}${q}${next}${q}`;
    });
    out += `<${m[1]}${attrs}${m[3]}`;
    i += m[0].length;
    if (!m[3].trim().startsWith('/')) stack.push(el);
  }
  return out;
}

/** Whether an attribute of an element holds symbols: the end of a line is a point, a wfc's tiles in `out` are names. */
export function holdsSymbols(el: OpenElement, outer: readonly OpenElement[], name: string): boolean {
  if (el.name === 'line' && name === 'to') return false;
  if (SYMBOL_ATTRS_EVERYWHERE.includes(name)) return true;
  if (!SYMBOL_ATTRS[el.name]?.includes(name)) return false;
  const parent = outer[outer.length - 1];
  return !(el.name === 'rule' && name === 'out' && parent?.name === 'wfc' && parent.attrs.tileset !== undefined);
}
