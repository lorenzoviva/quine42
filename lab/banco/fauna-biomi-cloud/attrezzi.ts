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

/** A walker grows a thin limb from its tip letter `P`, leaving `A`: up, aslant, or splitting in two, for `passi` steps. */
export const ramifica = (passi: number, punta = 'P', scia = 'A', pesi = { su: 1, obliquo: 2, biforca: 0.6 }) => [
  `<one steps="${passi}">`,
  `  <rule in="B ${punta}" out="${punta} ${scia}" p="${pesi.su}"/>`,
  `  <rule in="B* *${punta}" out="${punta}* *${scia}" p="${pesi.obliquo}"/>`,
  `  <rule in="B*B *${punta}*" out="${punta}*${punta} *${scia}*" p="${pesi.biforca}"/>`,
  '</one>',
  `<prl in="${punta}" out="${scia}"/>`,
];

/** Seeds on the top surface of `su` (`n` at random), each growing `alto` up or aslant: spikes, crystals, chimneys. */
export const punte = (su: string, n: number, alto: number, colore: string, punta = 'P') => [
  nota(`${n} punte a caso sulla faccia alta di ${su}, alte fino a ${alto}`),
  `<one in="B ${su}" out="${punta} *" steps="${n}"/>`,
  `<all steps="${alto}"><rule in="B ${punta}" out="${punta} ${colore}"/><rule in="B* *${punta}" out="${punta}* *${colore}"/></all>`,
  `<prl in="${punta}" out="${colore}"/>`,
];

/** Spots on the faces of `su` that look sideways (`p` per cell): runes, rivets, lights. */
export const macchie = (su: string, colore: string, p: number) => `<prl in="B${su}" out="*${colore}" p="${p}" steps="1"/>`;

/** Moss, snow, rust on the faces of `su` that look up. */
export const sopra = (su: string, colore: string, p: number) => `<prl in="B ${su}" out="* ${colore}" p="${p}" steps="1"/>`;

/** A wheel: an ellipsoid flattened across x, a disc standing on the ground. */
export const ruota = (x0: number, x1: number, y: number, r: number, c: string) => ell([(x0 + x1) / 2, y, 0], [x1 - x0 + 1, 2 * r + 1, 2 * r + 1], c);

/**
 * A trunk that walks up from `H` (at the top of its foot): `basso` steps leaving `T`, then `alto` leaving `U` (the upper trunk, where branches
 * are born), mostly straight, sometimes aslant; then it thickens.
 */
export const tronco = (basso: number, alto: number, spessore = [2, 1], t = 'T', u = 'U', storto = 1) => [
  nota('il tronco cammina verso l\'alto, dritto o di sbieco'),
  `<one steps="${basso}"><rule in="B H" out="H ${t}" p="4"/><rule in="B* *H" out="H* *${t}" p="${storto}"/></one>`,
  `<one steps="${alto}"><rule in="B H" out="H ${u}" p="4"/><rule in="B* *H" out="H* *${u}" p="${storto}"/></one>`,
  ...(spessore[0] ? [`<all in="${t}B" out="*${t}" steps="${spessore[0]}"/>`] : []),
  ...(spessore[1] ? [`<all in="${u}B" out="*${u}" steps="${spessore[1]}"/>`] : []),
];

/**
 * Branches: `n` seeds at random on the side faces of `da`, each going the way of the side it was born on (`e w s n`), and sometimes up:
 * a `prl` with no symmetry, so a tip that can go both ways forks.
 */
export const rami = (da: string, n: number, passi: number, legno: string, su = 0.3, avanti = 0.8) => [
  nota(`${n} rami nati a caso sui fianchi di ${da}: ognuno va dalla sua parte e a volte sale`),
  `<one steps="${n}" symmetry="()"><rule in="${da}B" out="*e"/><rule in="B${da}" out="w*"/><rule in="${da}/B" out="*/s"/><rule in="B/${da}" out="n/*"/></one>`,
  `<prl steps="${passi}" symmetry="()">` +
    `<rule in="eB" out="${legno}e" p="${avanti}"/><rule in="*B e*" out="*e ${legno}*" p="${su}"/>` +
    `<rule in="Bw" out="w${legno}" p="${avanti}"/><rule in="B* *w" out="w* *${legno}" p="${su}"/>` +
    `<rule in="s/B" out="${legno}/s" p="${avanti}"/><rule in="*/B s/*" out="*/s ${legno}/*" p="${su}"/>` +
    `<rule in="B/n" out="n/${legno}" p="${avanti}"/><rule in="B/* */n" out="n/* */${legno}" p="${su}"/>` +
    `</prl>`,
];

/** The tips of the branches (and the trunk's head) become `foglia`, which swells at random: a crown that is never the same. */
export const chioma = (foglia: string, passi: number, p: number, punte = 'ewsnH') => [
  nota('le punte diventano foglie, che si gonfiano a caso in tutte le direzioni'),
  `<prl>${[...punte].map((c) => `<rule in="${c}" out="${foglia}"/>`).join('')}</prl>`,
  `<prl in="${foglia}B" out="*${foglia}" p="${p}" steps="${passi}" symmetry="(xyz)"/>`,
];

/**
 * Crystals: `n` seeds at random on the top faces of `su`; each takes a direction at random (straight up, or aslant towards one of the four
 * sides) and grows along it with probability `p` per step, so they come out of different lengths; then they thicken a little.
 */
export const cristalli = (su: string, n: number, passi: number, c: string, p = 0.85, spessore = 0.5) => [
  nota(`${n} cristalli a caso sulla faccia alta di ${su}: ognuno con la sua direzione e la sua lunghezza`),
  `<one in="B ${su}" out="P *" steps="${n}"/>`,
  `<all symmetry="()"><rule in="P" out="Q"/><rule in="P" out="7"/><rule in="P" out="8"/><rule in="P" out="9"/><rule in="P" out="0"/></all>`,
  `<prl steps="${passi}" symmetry="()">` +
    `<rule in="B Q" out="Q ${c}" p="${p}"/><rule in="*B 7*" out="*7 ${c}*" p="${p}"/><rule in="B* *8" out="8* *${c}" p="${p}"/>` +
    `<rule in="*/B 9/*" out="*/9 ${c}/*" p="${p}"/><rule in="B/* */0" out="0/* */${c}" p="${p}"/>` +
    `</prl>`,
  `<prl>${[...'Q7890'].map((x) => `<rule in="${x}" out="${c}"/>`).join('')}</prl>`,
  `<prl in="B${c}" out="${c}*" p="${spessore}" steps="1"/>`,
];

/**
 * Boulders that grow from `n` seeds at random on the ground (the hidden layer `g`), each next to what is already there (`accanto`, so the
 * heap stays in one piece): sideways and up with their own probabilities, so the heap is another heap at every seed.
 */
export const massi = (centro: V, lato: V, n: number, passi: number, r: string, pLato = 0.45, pSu = 0.45, accanto = r) => [
  nota(`${n} massi nascono a caso sul terreno accanto a ciò che c'è già (${accanto}) e crescono di lato e in alto`),
  box(centro, [lato[0], lato[1], 1], 'g', 'B'),
  `<one in="${accanto}g" out="*${r}" steps="${n}"/>`,
  `<prl steps="${passi}"><rule in="${r}[Bg]" out="*${r}" p="${pLato}"/><rule in="B ${r}" out="${r} *" p="${pSu}"/></prl>`,
  `<prl in="g" out="B"/>`,
];

/**
 * The hidden letter of the first nodes: eight cells that `one` erases, one draw each. The engine's generator (mulberry32) gives related
 * numbers to close seeds at the same draw (first draw, seeds 1-5: 0.63 0.73 0.72 0.92 0.69; second: 0.00 0.32 0.04 0.33 0.77, seeds 1 and 3
 * alike), so the first choice of a program would fall on the same options for the seeds a bench tries. The ninth draw is the first
 * that, for seeds 1-15 and two to five options, never puts most seeds on one option (measured in `metodo.md`).
 */
const MESCOLA = 'z';

export interface Modello {
  titolo: string;
  /** symbol, colour (rrggbb), name, and `part`, `glow` or `alpha 0.6`. */
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
  const nascoste = [...new Set([...(m.marcatori ?? ''), ...scelte, ...MESCOLA])].filter((c) => !m.colori.some(([s]) => s === c));
  const values = ['B', ...m.colori.map(([s]) => s), ...nascoste].join('');
  const colori = m.colori.map(([s, hex, nome, extra]) => {
    const x = extra === 'glow' ? ' glow="True"' : extra?.startsWith('alpha ') ? ` alpha="${extra.slice(6)}"` : extra ? ` part="${extra}"` : '';
    return `  <color symbol="${s}" value="${hex}" name="${nome}"${x}/>`;
  });
  return [
    `<!-- ${m.commento} -->`,
    `<sequence values="${values}" symmetry="(xy)" name="${m.titolo}">`,
    ...colori,
    ...nascoste.map((c) => `  <color symbol="${c}" hidden="True" name="marcatore"/>`),
    ...[
      nota('mescola: consuma le prime otto estrazioni del generatore, che per semi vicini (1, 2, 3…) danno numeri vicini'),
      box([3, 0, 0], [7, 1, 1], MESCOLA, 'B'),
      box([0, 1, 0], [1, 1, 1], MESCOLA, 'B'),
      `<one in="${MESCOLA}" out="B" steps="8"/>`,
      ...m.corpo,
    ].map((r) => `  ${r}`),
    '</sequence>',
    '',
  ].join('\n');
}
