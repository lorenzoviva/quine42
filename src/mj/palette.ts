// MarkovJunior's palette (resources/palette.xml in github.com/mxgmn/MarkovJunior, MIT licence): every
// letter has a colour, so a program needs no palette of its own. The upper case letters are the PICO-8
// colours; lower case are darker or shifted companions. A program may still recolour a letter with
// <color symbol="N" value="8b5a2b"/> (the style guide of the world asks for its own tones).

export const MJ_PALETTE: Record<string, { color: string; name: string }> = {
  B: { color: '#000000', name: 'Black' },
  I: { color: '#1d2b53', name: 'Indigo' },
  P: { color: '#7e2553', name: 'Purple' },
  E: { color: '#008751', name: 'Emerald' },
  N: { color: '#ab5236', name: 'browN' },
  D: { color: '#5f574f', name: 'Dead, Dark' },
  A: { color: '#c2c3c7', name: 'Alive, grAy' },
  W: { color: '#fff1e8', name: 'White' },
  R: { color: '#ff004d', name: 'Red' },
  O: { color: '#ffa300', name: 'Orange' },
  Y: { color: '#ffec27', name: 'Yellow' },
  G: { color: '#00e436', name: 'Green' },
  U: { color: '#29adff', name: 'blUe' },
  S: { color: '#83769c', name: 'Slate' },
  K: { color: '#ff77a8', name: 'pinK' },
  F: { color: '#ffccaa', name: 'Fawn' },
  b: { color: '#291814', name: 'black' },
  i: { color: '#111d35', name: 'indigo' },
  p: { color: '#422136', name: 'purple' },
  e: { color: '#125359', name: 'emerald' },
  n: { color: '#742f29', name: 'brown' },
  d: { color: '#49333b', name: 'dead, dark' },
  a: { color: '#a28879', name: 'alive, gray' },
  w: { color: '#f3ef7d', name: 'white' },
  r: { color: '#be1250', name: 'red' },
  o: { color: '#ff6c24', name: 'orange' },
  y: { color: '#a8e72e', name: 'yellow' },
  g: { color: '#00b543', name: 'green' },
  u: { color: '#065ab5', name: 'blue' },
  s: { color: '#754665', name: 'slate' },
  k: { color: '#ff6e59', name: 'pink' },
  f: { color: '#ff9d81', name: 'fawn' },
  C: { color: '#00ffff', name: 'Cyan' },
  c: { color: '#5fcde4', name: 'cyan' },
  H: { color: '#e4bb40', name: 'Honey' },
  h: { color: '#8a6f30', name: 'honey' },
  J: { color: '#4b692f', name: 'Jungle' },
  j: { color: '#45107e', name: 'jungle' },
  L: { color: '#847e87', name: 'Light' },
  l: { color: '#696a6a', name: 'light' },
  M: { color: '#ff00ff', name: 'Magenta' },
  m: { color: '#9c09cc', name: 'magenta' },
  Q: { color: '#9badb7', name: 'aQua' },
  q: { color: '#3f3f74', name: 'aqua' },
  T: { color: '#37946e', name: 'Teal' },
  t: { color: '#323c39', name: 'teal' },
  V: { color: '#8f974a', name: 'oliVe' },
  v: { color: '#524b24', name: 'olive' },
  X: { color: '#ff0000', name: 'X' },
  x: { color: '#d95763', name: 'x' },
  Z: { color: '#ffffff', name: 'Z' },
  z: { color: '#cbdbfc', name: 'z' },
};

/** The letters, in the order of palette.xml. */
export const MJ_LETTERS = Object.keys(MJ_PALETTE).join('');

/**
 * A colour as a palette holds it, `#rrggbb`, from what a tint may be (T288): a hex (`#rgb`, `#rrggbb`, with or without `#`) or the
 * CSS `hsl()` the Narrator's packs and the Forge write (`hsl(120 60% 66%)`, `hsl(120, 60%, 66%)`). Undefined for anything else:
 * a letter given a colour the meshes cannot read would vanish (it did, for every generated item tinted onto its model).
 */
export function hexColor(c: unknown): string | undefined {
  if (typeof c !== 'string') return undefined;
  const s = c.trim();
  const hex = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(s);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    return `#${h.toLowerCase()}`;
  }
  const hsl = /^hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i.exec(s);
  if (!hsl) return undefined;
  const [h, sat, l] = [Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100];
  if (![h, sat, l].every(Number.isFinite)) return undefined;
  const hue = (((h % 360) + 360) % 360) / 360;
  const [S, L] = [Math.min(1, Math.max(0, sat)), Math.min(1, Math.max(0, l))];
  const k = (n: number) => (n + hue * 12) % 12;
  const a = S * Math.min(L, 1 - L);
  const channel = (n: number) => Math.round(255 * (L - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[channel(0), channel(8), channel(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
