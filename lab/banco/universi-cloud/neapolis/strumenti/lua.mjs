// Da valori JS a letterali Lua (stringhe tra virgolette, tabelle).
export const lstr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
const key = (k) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : `[${lstr(k)}]`);
export function lua(v, indent = '') {
  if (typeof v === 'string') return lstr(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `{\n${v.map((x) => `${indent}  ${lua(x, indent + '  ')},`).join('\n')}\n${indent}}`;
  return `{\n${Object.entries(v).map(([k, x]) => `${indent}  ${key(k)} = ${lua(x, indent + '  ')},`).join('\n')}\n${indent}}`;
}
