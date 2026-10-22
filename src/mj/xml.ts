// A small XML reader for MarkovJunior programs: elements, attributes, comments, the five entities.
// No namespaces, no DTDs, no text content (MarkovJunior uses none). Errors carry the line.

export interface XmlElement {
  name: string;
  attrs: Record<string, string>;
  children: XmlElement[];
  line: number;
}

export class XmlError extends Error {}

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
const decode = (s: string) => s.replace(/&(lt|gt|amp|quot|apos);/g, (_, e: string) => ENTITIES[e]);

/** Reads every top-level element (a program may have several: the model, its animations, its actions). */
export function parseXml(src: string): XmlElement[] {
  let i = 0;
  let line = 1;
  const roots: XmlElement[] = [];
  const stack: XmlElement[] = [];
  const advance = (to: number) => {
    for (let k = i; k < to; k++) if (src.charCodeAt(k) === 10) line++;
    i = to;
  };
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) {
      advance(src.length);
      break;
    }
    advance(lt);
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end < 0) throw new XmlError(`riga ${line}: commento non chiuso`);
      advance(end + 3);
      continue;
    }
    if (src.startsWith('<?', i) || src.startsWith('<!', i)) {
      const end = src.indexOf('>', i);
      if (end < 0) throw new XmlError(`riga ${line}: dichiarazione non chiusa`);
      advance(end + 1);
      continue;
    }
    if (src.startsWith('</', i)) {
      const m = /^<\/\s*([\w:.-]+)\s*>/.exec(src.slice(i));
      if (!m) throw new XmlError(`riga ${line}: tag di chiusura non valido`);
      const open = stack.pop();
      if (!open) throw new XmlError(`riga ${line}: </${m[1]}> senza apertura`);
      if (open.name !== m[1]) throw new XmlError(`riga ${line}: </${m[1]}> chiude <${open.name}> (aperto alla riga ${open.line})`);
      advance(i + m[0].length);
      continue;
    }
    const m = /^<([\w:.-]+)/.exec(src.slice(i));
    if (!m) throw new XmlError(`riga ${line}: "<" non seguito da un nome`);
    const el: XmlElement = { name: m[1], attrs: {}, children: [], line };
    advance(i + m[0].length);
    // Attributes, up to ">" or "/>".
    for (;;) {
      const ws = /^\s*/.exec(src.slice(i))![0];
      advance(i + ws.length);
      if (src.startsWith('/>', i)) {
        advance(i + 2);
        (stack.length ? stack[stack.length - 1].children : roots).push(el);
        break;
      }
      if (src[i] === '>') {
        advance(i + 1);
        (stack.length ? stack[stack.length - 1].children : roots).push(el);
        stack.push(el);
        break;
      }
      const a = /^([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/.exec(src.slice(i));
      if (!a) throw new XmlError(`riga ${line}: attributo non valido in <${el.name}> (si scrive nome="valore")`);
      if (a[1] in el.attrs) throw new XmlError(`riga ${line}: attributo "${a[1]}" ripetuto in <${el.name}>`);
      el.attrs[a[1]] = decode(a[3] ?? a[4]);
      advance(i + a[0].length);
      if (i >= src.length) throw new XmlError(`riga ${line}: <${el.name}> non chiuso`);
    }
  }
  if (stack.length) throw new XmlError(`<${stack[stack.length - 1].name}> (riga ${stack[stack.length - 1].line}) non è mai chiuso`);
  return roots;
}

/** Back to text, two spaces of indent, attributes in the given order. */
export function writeXml(el: XmlElement, indent = ''): string {
  const attrs = Object.entries(el.attrs)
    .map(([k, v]) => ` ${k}="${v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"`)
    .join('');
  if (!el.children.length) return `${indent}<${el.name}${attrs}/>`;
  return `${indent}<${el.name}${attrs}>\n${el.children.map((c) => writeXml(c, indent + '  ')).join('\n')}\n${indent}</${el.name}>`;
}
