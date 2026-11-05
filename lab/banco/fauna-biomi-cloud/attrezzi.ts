// The sculptor's tools for Cantiere 8: small functions that write MarkovJunior XML, so that sixty programs share the same few procedural
// patterns (`metodo.md`). Nothing here runs a program: these strings are the programs, and `banco.ts` measures what they give.

export type V = [number, number, number];

const n = (x: number) => String(Math.round(x));
const vec = (a: V) => a.map(n).join(' ');
const su = (on?: string) => (on ? ` on="${on}"` : '');

/** Shapes of the engine: `at` is the centre of the base. */
export const box = (at: V, size: V, c: string, on?: string) => `<box at="${vec(at)}" size="${vec(size)}" color="${c}"${su(on)}/>`;
export const ell = (at: V, size: V, c: string, on?: string) => `<ellipsoid at="${vec(at)}" size="${vec(size)}" color="${c}"${su(on)}/>`;
export const cyl = (at: V, size: V, c: string, on?: string) => `<cylinder at="${vec(at)}" size="${vec(size)}" color="${c}"${su(on)}/>`;
export const cone = (at: V, size: V, c: string, on?: string) => `<cone at="${vec(at)}" size="${vec(size)}" color="${c}"${su(on)}/>`;
export const line = (at: V, to: V, r: number, c: string, on?: string) => `<line at="${vec(at)}" to="${vec(to)}" r="${r}" color="${c}"${su(on)}/>`;
export const nota = (s: string) => `<!-- ${s} -->`;

/** The hidden letters of a choice: the region and up to six options. */
const SCELTA = 'u123456';

/**
 * A choice made at random (pattern 1 of `metodo.md`): a region of air gets the hidden letter `u`, `one` turns one of its cells into the
 * letter of an option (every rule matches every cell: the options are equally likely), an `all` with the whole cube's symmetry floods
 * the region with that letter, and only the shapes of that option paint (`on="k"`). Then the region goes back to air.
 */
export function scelta(nome: string, regione: [V, V], opzioni: Array<[string, string[]]>): string[] {
  const k = opzioni.map((_, i) => String(i + 1));
  if (k.length > 6) throw new Error('al più sei opzioni');
  return [
    nota(`scelta «${nome}»: ${opzioni.map(([t]) => t).join(' | ')}`),
    box(regione[0], regione[1], 'u', 'B'),
    `<one steps="1">${k.map((c) => `<rule in="u" out="${c}"/>`).join('')}</one>`,
    `<all symmetry="(xyz)">${k.map((c) => `<rule in="${c}u" out="*${c}"/>`).join('')}</all>`,
    ...opzioni.flatMap(([t, forme], i) => [nota(`  ${i + 1}: ${t}`), ...forme.map((f) => (/\son="/.test(f) ? f : f.replace(/\/>$/, ` on="${k[i]}"/>`)))]),
    `<prl>${['u', ...k].map((c) => `<rule in="${c}" out="B"/>`).join('')}</prl>`,
  ];
}

export interface Modello {
  titolo: string;
  /** symbol, colour (rrggbb), name, and `part` or `glow`. */
  colori: Array<[string, string, string, string?]>;
  /** Hidden letters the program uses besides those of the choices. */
  marcatori?: string;
  corpo: string[];
  commento: string;
}

/** The whole program: the root with every letter, the palette, the body. */
export function programma(m: Modello): string {
  const usa = m.corpo.join('\n');
  const scelte = /on="[1-6]"|in="u"/.test(usa) ? SCELTA : '';
  const nascoste = [...new Set([...(m.marcatori ?? ''), ...scelte])].filter((c) => !m.colori.some(([s]) => s === c));
  const values = ['B', ...m.colori.map(([s]) => s), ...nascoste].join('');
  const colori = m.colori.map(([s, hex, nome, extra]) => {
    const x = extra === 'glow' ? ' glow="True"' : extra ? ` part="${extra}"` : '';
    return `  <color symbol="${s}" value="${hex}" name="${nome}"${x}/>`;
  });
  return [
    `<!-- ${m.commento} -->`,
    `<sequence values="${values}" symmetry="(xy)" name="${m.titolo}">`,
    ...colori,
    ...nascoste.map((c) => `  <color symbol="${c}" hidden="True" name="marcatore"/>`),
    ...m.corpo.map((r) => `  ${r}`),
    '</sequence>',
    '',
  ].join('\n');
}
