// The catalogue of Cantiere 1: 24 structures, 6 per setting, written as a skeleton (`scheletri/`) plus what makes each one itself: its
// materials, its roof, what stands on it and on its walls. A module is a few rules that start from a rare letter (`../pattern.md`, «Come
// costa un programma»); it works on what the columns left, so it does not know the size of the box either.
//
//   npx vite-node lab/banco/catalogo-cloud/catalogo.ts -- [id …]     # sorgenti/<ambientazione>/<nome>.xml (tutte se nessun id)
//
// Then `valida.ts --ottimizza sorgenti/… <ambientazione>/<nome>.xml` makes the fast program and `valida.ts <ambientazione>/<nome>.xml` measures it.
// The letters a module may use are those the skeleton no longer needs after its columns: r g v n q O P t b s c d e f y H I.

import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('lab/banco/catalogo-cloud');

type Colore = [hex: string, nome: string, extra?: string];

export interface Struttura {
  id: string;
  ambientazione: 'fantasy' | 'steampunk' | 'moderno' | 'futuristico';
  /** The title of the report (first comment of the XML). */
  nome: string;
  cantina: boolean;
  colori: Record<string, Colore>;
  /** Modules of the plan, before the stair's surroundings go back to the bays (`v` → `t`): furniture. */
  progetto?: string[];
  /** Modules on the walls, after the stair and the benches, before the windows. */
  facciate?: string[];
  /** Modules on the roof, after the windows. */
  tetto?: string[];
  /** The windows of the bands U (ground floor) and u (upper floor): an 11 × 14 out pattern, top row first; `null` keeps the skeleton's. */
  finestra?: string[];
  /** Cleanup rules for the module letters, in the final prl. */
  pulizia?: string;
}

// ---------------------------------------------------------------- the modules

const rep = (s: string, n: number) => Array(n).fill(s).join(' ');

/** A ridge roof along x: a layer of R grows over every R with R on both sides in y, up to the ridge. */
export const falde = () => `<prl in="*/B/* R/R/R" out="*/R/* */*/*" symmetry="()"/>`;
/** A ridge roof along y. */
export const faldeY = () => `<prl in="*B* RRR" out="*R* ***" symmetry="()"/>`;
/** A hip roof: a layer of R over every R with R on its four sides: a pyramid on each bay. */
export const padiglione = () => `<prl in="***/*B*/*** *R*/RRR/*R*" out="***/*R*/*** ***/***/***" symmetry="()"/>`;
/** A hip roof that stops after `n` layers: a low pyramid, a flat top. */
export const padiglioneBasso = (n: number) => `<prl in="***/*B*/*** *R*/RRR/*R*" out="***/*R*/*** ***/***/***" symmetry="()" steps="${n}"/>`;

/** Battlements on the outer walls' heads (`8` = their letters): random merlons of 3 over runs of 6, raised `h`. `m` is the merlon. */
export const merli = (m: string, h = 4) =>
  [`<all in="888888" out="qqq***"/>`, `<all steps="1" symmetry="()" in="${rep('B', h)} q" out="${rep(m, h)} q"/>`].join('\n  ');

/**
 * A tower of `w` × `w` on a roof: a square of R with air above becomes the marker `g`, which rises `steps` layers (to the top of the box
 * without), leaving `body`; the last `top` layers become `cima`. `quante` towers.
 */
export function torre(o: { w: number; body: string; cima: string; quante?: number; steps?: number; top?: number }): string {
  const row = (c: string) => Array(o.w).fill(c.repeat(o.w)).join('/');
  const out = [
    `<one in="${row('B')} ${row('R')}" out="${row('g')} ${row('*')}" steps="${o.quante ?? 1}"/>`,
    `<prl in="B g" out="g ${o.body}" symmetry="()"${o.steps ? ` steps="${o.steps}"` : ''}/>`,
  ];
  const top = o.top ?? 1;
  if (top > 1) out.push(`<all steps="1" symmetry="()" in="g ${rep(o.body, top - 1)}" out="${rep(o.cima, top)}"/>`);
  out.push(`<prl in="g" out="${o.cima}" symmetry="()"/>`);
  return out.join('\n  ');
}

/** A pyramid cap over the top of what a letter `c` makes flat (a tower's top): it grows while there is room. */
export const cuspide = (c: string, steps?: number) => `<prl in="***/*B*/*** *${c}*/${c}${c}${c}/*${c}*" out="***/*${c}*/*** ***/***/***" symmetry="()"${steps ? ` steps="${steps}"` : ''}/>`;

/** Slits on the faces of a tower of letter `body`: `n` windows of 3 × 4 (`fin`, named «finestra…»). */
export const feritoie = (body: string, fin: string, n: number) =>
  `<one in="${rep(`BBB/${body.repeat(3)}`, 4)}" out="${rep(`***/${fin.repeat(3)}`, 4)}" steps="${n}"/>`;

/** Chimneys or roof volumes: `n` of them, widened `w` each way (2w+1), raised `h`, letter `c`, the top `cima` if given. */
export function ciminiere(o: { n: number; w: number; h: number; c: string; cima?: string }): string {
  const out = [`<one in="B B R" out="* ${o.c} *" steps="${o.n}" symmetry="()"/>`];
  if (o.w) out.push(`<all in="${o.c}B *R" out="*${o.c} **" symmetry="(x)" steps="${o.w}"/>`, `<all in="${o.c}/B */R" out="*/${o.c} */*" symmetry="(y)" steps="${o.w}"/>`);
  out.push(`<prl in="B ${o.c}" out="${o.c} *" steps="${o.h}" symmetry="()"/>`);
  if (o.cima) out.push(`<prl in="B ${o.c}" out="${o.cima} *" steps="1" symmetry="()"/>`);
  return out.join('\n  ');
}

/** Pipes up the outer walls, from the ground to the head: `n` of them, letter `t`, a cap `cima`. */
export function tubi(o: { n: number; t: string; cima: string }): string {
  return [
    `<one in="B[CS] [Ez]S" out="${o.t}* **" steps="${o.n}"/>`,
    `<prl in="B7 ${o.t}7" out="${o.t}* **"/>`,
    `<prl in="B ${o.t}" out="${o.cima} *" steps="1" symmetry="()"/>`,
  ].join('\n  ');
}

/** Plates on the upper walls (gears, rivets, medallions): `n` rings of 3 × 3 of `c` with the wall in the middle. */
export const piastre = (c: string, n: number, muro = 'W') =>
  `<one in="BBB/${muro.repeat(3)} BBB/${muro.repeat(3)} BBB/${muro.repeat(3)}" out="***/${c.repeat(3)} ***/${c}${muro}${c} ***/${c.repeat(3)}" steps="${n}"/>`;

/** Beams of the half-timbering: `n` uprights of 8 on the plaster W of the outer faces. */
export const travi = (c: string, n: number) => `<one in="${rep('BW', 8)}" out="${rep(`*${c}`, 8)}" steps="${n}"/>`;

/** Horizontal beams along the slab band of the outer walls (the two S over the ground floor's wall): a cornice, `c`. */
export const fascia = (c: string) => `<prl in="BW BS BS BC" out="** *${c} *${c} **"/>`;
/** The same band one voxel out: a ledge, a ring around the building (`c`). */
export const anello = (c: string) => `<prl in="BW BS BS BC" out="** ${c}* ${c}* **"/>`;

/** `n` boxes of `w` × `w` on the flat roofs, one layer, letter `c` (solar panels, skylights). */
export function pannelli(c: string, n: number, w = 5): string {
  const row = (x: string) => Array(w).fill(x.repeat(w)).join('/');
  return `<one in="${row('B')} ${row('R')}" out="${row(c)} ${row('*')}" steps="${n}"/>`;
}

/** Masts: `n` of them, `h` high, letter `c`, a light `luce` on top. */
export const antenne = (c: string, n: number, h: number, luce: string) =>
  [`<one in="B B R" out="* ${c} *" steps="${n}" symmetry="()"/>`, `<prl in="B ${c}" out="${c} *" steps="${h}" symmetry="()"/>`, `<prl in="B ${c}" out="${luce} *" steps="1" symmetry="()"/>`].join('\n  ');

/**
 * Furniture against a full wall (no door in it), 9 wide and 2 deep, 8 high: a counter, an altar, a workbench. `bassa` in a bay of one storey
 * (`b` → `e`, which the skeleton raises as a bench), else in a bay of two (`t` → `f`), never where the stair lands (`v`). A bay with it may stop
 * counting as a room (`contaStanze`): the rooms change from seed to seed, and it is something to jump on.
 */
export function arredo(n: number, bassa = true): string {
  const c = bassa ? 'b' : 't', m = bassa ? 'e' : 'f';
  const row = c.repeat(11);
  return `<one in="ppppppppppp/${row}/${row}/${row}/${row}" out="***********/*${m.repeat(9)}*/*${m.repeat(9)}*/***********/***********" steps="${n}"/>`;
}

/**
 * The same furniture in a bay of two storeys, but only at one seed in two: it is written with `r` and a single coin cell `f`, the coin is
 * tossed once (`p` on one cell), and only a coin that stays lets the furniture be (`fr` → `ff`); else it goes back to the bay. Rooms then
 * change between seeds even where one bay is like another.
 */
export function arredoForse(p = 0.5): string {
  const row = 't'.repeat(11);
  return [
    `<one in="ppppppppppp/${row}/${row}/${row}/${row}" out="***********/*f${'r'.repeat(8)}*/*${'r'.repeat(9)}*/***********/***********" steps="1"/>`,
    `<prl steps="1"><rule in="f" out="t" p="${1 - p}"/></prl>`,
    `<prl in="fr" out="*f"/>`,
    `<prl in="r" out="t"/>`,
  ].join('\n  ');
}

/** `n` low blocks of 5 × 3 in the lot around the building (planters, crates, stones), never on the path to the door (`A`): the skeleton raises `G` 8. */
export const cortile = (n: number) => `<one in="zzzzzzz/zzzzzzz/zzzzzzz/zzzzzzz/zzzzzzz" out="*******/*GGGGG*/*GGGGG*/*GGGGG*/*******" steps="${n}"/>`;

/**
 * A low wing in the margin around the bays, against an outer wall: 13 × 12, raised 8 like the benches (`G`). It needs 13 rows of the soil `E`
 * beyond the wall: at Large the margin is 5 and there is none, at Huge it is 15 and the wing changes the outline from seed to seed.
 */
export const ala = (n: number) =>
  `<one in="${[...Array(13).fill('E'.repeat(15)), 'p'.repeat(15), '3'.repeat(15)].join('/')}" out="${['*'.repeat(15), ...Array(12).fill(`*${'G'.repeat(13)}*`), '*'.repeat(15), '*'.repeat(15)].join('/')}" steps="${n}"/>`;

// ---------------------------------------------------------------- windows

/** The skeleton's window: a frame D and glass V. */
export const FINESTRA_SCHELETRO = ['***********', '*DDDDDDDDD*', ...Array(10).fill('*DVVVVVVVD*'), '*DDDDDDDDD*', '***********'];
/** An arch: the top rows narrower. */
export const ARCO = ['***********', '***DDDDD***', '**DDVVVDD**', '*DDVVVVVDD*', ...Array(8).fill('*DVVVVVVVD*'), '*DDDDDDDDD*', '***********'];
/** Mullions: two lights with a post in the middle. */
export const BIFORA = ['***********', '*DDDDDDDDD*', ...Array(10).fill('*DVVVDVVVD*'), '*DDDDDDDDD*', '***********'];
/** A wide band of glass with a thin frame. */
export const NASTRO = ['***********', 'DDDDDDDDDDD', ...Array(11).fill('DVVVVVVVVVD'), 'DDDDDDDDDDD'];
/** A round window (an oculus) in a square frame. */
export const OCCHIO = ['***********', '****DDD****', '**DDVVVDD**', '*DVVVVVVVD*', '*DVVVVVVVD*', 'DVVVVVVVVVD', 'DVVVVVVVVVD', 'DVVVVVVVVVD', '*DVVVVVVVD*', '*DVVVVVVVD*', '**DDVVVDD**', '****DDD****', '***********', '***********'];

function finestre(xml: string, f: string[] | undefined): string {
  if (!f) return xml;
  if (f.length !== 14 || f.some((r) => r.length !== 11)) throw new Error('una finestra è 11 × 14');
  const out = f.join(' ');
  return xml.replace(/(<all in="(U{11}(?: U{11}){13})" out=")[^"]*"/, `$1${out}"`).replace(/(<all in="(u{11}(?: u{11}){13})" out=")[^"]*"/, `$1${out}"`);
}

// ---------------------------------------------------------------- composing

export function componi(s: Struttura): string {
  let xml = fs.readFileSync(path.join(DIR, 'scheletri', s.cantina ? 'cantina.xml' : 'piano.xml'), 'utf8');
  // Colours: the skeleton's are replaced, the new ones added.
  for (const [k, [hex, nome, extra]] of Object.entries(s.colori)) {
    const tag = `<color symbol="${k}" value="${hex}" name="${nome}"${extra ? ` ${extra}` : ''}/>`;
    const re = new RegExp(`<color symbol="${k}"[^>]*/>`);
    xml = re.test(xml) ? xml.replace(re, tag) : xml.replace('<!-- @colori -->', `${tag}<!-- @colori -->`);
  }
  xml = xml.replace('<!-- @colori -->', '');
  // The union of the outer walls' heads for the battlements, and of every wall letter for the pipes.
  xml = xml.replace(/(<union symbol="1")/, '<union symbol="8" values="XJMjw"/>\n  <union symbol="7" values="CUWSuXJMjwDV"/>\n  $1');
  xml = xml.replace('  <!-- @progetto -->\n', (s.progetto ?? []).map((m) => `  ${m}\n`).join(''));
  xml = xml.replace('  <!-- @facciate -->\n', (s.facciate ?? []).map((m) => `  ${m}\n`).join(''));
  xml = xml.replace('  <!-- @tetto -->\n', (s.tetto ?? []).map((m) => `  ${m}\n`).join(''));
  xml = xml.replace('<!-- @pulizia -->', `<rule in="q" out="C"/>${s.pulizia ?? ''}`);
  xml = finestre(xml, s.finestra);
  return `<!-- ${s.nome} -->\n${xml}`;
}

// ---------------------------------------------------------------- the catalogue

const FANTASY: Record<string, Colore> = {
  k: ['5a3a22', 'portone di quercia'], S: ['c9c0a6', 'pietra squadrata'], F: ['9a6b3c', 'assi di legno'], C: ['8f877a', 'pietra di cava'], W: ['eee4cb', 'intonaco a calce'],
  R: ['a9503a', 'coppi'], V: ['9cc3b4', 'vetro piombato', 'alpha="0.5"'], D: ['4a3020', 'legno scuro'], L: ['7a5a3c', 'panca di castagno'], T: ['b4a98e', 'gradino di pietra'],
  K: ['7d5634', 'scala di legno'], A: ['8c8a80', 'acciottolato'], a: ['5f5a52', 'fondazione'], x: ['7a4a24', 'botti'],
};
const STEAMPUNK: Record<string, Colore> = {
  k: ['3b2a1e', 'portone ferrato'], S: ['6e5a4a', 'cornice di ghisa'], F: ['7b5233', 'tavolato oliato'], C: ['8a3f2c', 'mattoni rossi'], W: ['a6553a', 'mattoni a vista'],
  R: ['4f7a6a', 'lamiera di rame verderame'], V: ['c9a45a', 'vetro ambrato', 'alpha="0.5"'], D: ['2e2b29', 'ghisa'], L: ['6b4a2e', 'panca di noce'], T: ['5b544e', 'gradino di ferro'],
  K: ['3f3a36', 'scala di ferro'], A: ['5e5852', 'lastre di basalto'], a: ['4a3f38', 'fondazione'], x: ['6b4224', 'botti cerchiate'],
};
const MODERNO: Record<string, Colore> = {
  k: ['3a3d42', 'porta di acciaio'], S: ['d6d2c8', 'cemento chiaro'], F: ['b88a55', 'parquet di rovere'], C: ['a9a59b', 'cemento a vista'], W: ['f2efe8', 'intonaco bianco'],
  R: ['8f8f88', 'ghiaia'], V: ['86b8c8', 'vetro', 'alpha="0.5"'], D: ['2f3236', 'telaio di alluminio'], L: ['8a6a48', 'panca di rovere'], T: ['e0d9c2', 'gradino'],
  K: ['c2c7cc', 'acciaio'], A: ['9a9590', 'pavimento di pietra'], a: ['6f6c66', 'fondazione'], x: ['7a4a24', 'botti'],
};
const FUTURISTICO: Record<string, Colore> = {
  k: ['1d2633', 'portale scorrevole'], S: ['e8edf2', 'metallo bianco'], F: ['9aa7b4', 'pavimento composito'], C: ['c9d2db', 'pannelli di lega'], W: ['f4f7fa', 'scocca bianca'],
  R: ['b7c0c9', 'copertura in lega'], V: ['1f3550', 'vetro scuro', 'alpha="0.6"'], D: ['5a6b7c', 'profilo di titanio'], L: ['7b8a99', 'seduta sospesa'], T: ['d7dee5', 'gradino'],
  K: ['8d9aa8', 'rampa di lega'], A: ['aab4be', 'pavimento composito'], a: ['707c88', 'fondazione'], x: ['47c1d6', 'serbatoi'],
};

export const CATALOGO: Struttura[] = [
  // ---------------------------------------------------------------- fantasy
  {
    id: 'locanda',
    ambientazione: 'fantasy',
    nome: 'Locanda del Cinghiale, con la cantina delle botti',
    cantina: true,
    colori: { ...FANTASY, c: ['8a4a3a', 'comignolo di mattoni'], n: ['ffb347', 'fuoco del comignolo', 'glow="True"'], f: ['4a3020', 'travi del graticcio'] },
    progetto: [arredo(1)],
    facciate: [travi('f', 14)],
    finestra: ARCO,
    tetto: [falde(), ciminiere({ n: 2, w: 1, h: 12, c: 'c', cima: 'n' })],
  },
  {
    id: 'santuario',
    ambientazione: 'fantasy',
    nome: "Santuario della Luna d'Argento",
    cantina: false,
    colori: { ...FANTASY, C: ['d9d4c7', 'marmo'], W: ['f1eee6', 'pietra bianca'], S: ['b9b19a', 'cornice di pietra'], R: ['5d6f86', 'ardesia azzurra'], V: ['8e7cc3', 'vetrata viola', 'alpha="0.5"'], O: ['d4af37', 'oro'], I: ['e8e4da', 'pietra della guglia'], n: ['f6f2c4', 'luce della luna', 'glow="True"'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [fascia('O'), piastre('O', 6)],
    finestra: ARCO,
    tetto: [torre({ w: 3, body: 'I', cima: 'n', top: 3 }), padiglione()],
  },
  {
    id: 'torre-di-guardia',
    ambientazione: 'fantasy',
    nome: 'Torre di guardia del passo, con la segreta',
    cantina: true,
    colori: { ...FANTASY, C: ['7e786e', 'pietra grigia'], W: ['948d80', 'pietra a filari'], R: ['6b6b6b', 'lastre di pietra'], I: ['8a8378', 'pietra della torre'], g: ['a39b8c', 'merli'], t: ['4f5a66', 'ardesia'], v: ['1e1a16', 'finestra a feritoia'] },
    progetto: [arredo(1)],
    finestra: ARCO,
    tetto: [torre({ w: 11, body: 'I', cima: 't', steps: 22 }), cuspide('t'), feritoie('I', 'v', 8), merli('g')],
  },
  {
    id: 'fucina',
    ambientazione: 'fantasy',
    nome: 'Fucina del fabbro, con la carbonaia sotto terra',
    cantina: true,
    colori: { ...FANTASY, C: ['6a645c', 'pietra scura'], W: ['b8ab90', 'intonaco annerito'], R: ['4a5058', 'ardesia'], c: ['5c4a3e', 'camino della forgia'], n: ['ff7a2a', 'brace', 'glow="True"'], O: ['6e7275', 'scudi di ferro'] },
    progetto: [arredo(1)],
    facciate: [piastre('O', 6)],
    finestra: BIFORA,
    tetto: [falde(), ciminiere({ n: 1, w: 3, h: 16, c: 'c', cima: 'n' })],
  },
  {
    id: 'casa-del-borgomastro',
    ambientazione: 'fantasy',
    nome: 'Casa del borgomastro, a due piani',
    cantina: false,
    colori: { ...FANTASY, R: ['8c3b2e', 'coppi scuri'], f: ['5a3a24', 'travi del graticcio'], c: ['8a4a3a', 'comignolo'], n: ['ffb347', 'fuoco', 'glow="True"'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [travi('f', 20), fascia('f')],
    finestra: BIFORA,
    tetto: [padiglione(), ciminiere({ n: 3, w: 1, h: 8, c: 'c', cima: 'n' })],
  },
  {
    id: 'fortino',
    ambientazione: 'fantasy',
    nome: 'Fortino di confine',
    cantina: false,
    colori: { ...FANTASY, C: ['77726a', 'pietra grigia'], W: ['8b867c', 'pietra a filari'], S: ['9a958a', 'cordolo'], R: ['6f6a62', 'camminamento'], I: ['827d73', 'pietra delle torri'], g: ['a19c90', 'merli'], v: ['1e1a16', 'finestra a feritoia'] },
    progetto: [arredoForse(), ala(2)],
    finestra: ARCO,
    tetto: [torre({ w: 13, body: 'I', cima: 'g', quante: 2, steps: 14 }), feritoie('I', 'v', 10), merli('g')],
  },
  // ---------------------------------------------------------------- steampunk
  {
    id: 'taverna',
    ambientazione: 'steampunk',
    nome: 'Taverna della Caldaia, con la cantina delle botti',
    cantina: true,
    colori: { ...STEAMPUNK, b: ['b87333', 'tubi di rame'], s: ['e8e4dc', 'sbuffo di vapore'], O: ['c9a227', 'ingranaggi di ottone'], c: ['3a3532', 'ciminiera di ghisa'] },
    progetto: [arredo(1)],
    facciate: [tubi({ n: 5, t: 'b', cima: 's' }), piastre('O', 6)],
    finestra: OCCHIO,
    tetto: [falde(), ciminiere({ n: 2, w: 0, h: 18, c: 'c', cima: 's' })],
  },
  {
    id: 'cattedrale',
    ambientazione: 'steampunk',
    nome: 'Cattedrale degli Ingranaggi',
    cantina: false,
    colori: { ...STEAMPUNK, R: ['3f3a36', 'tegole di ghisa'], O: ['c9a227', 'ottone'], I: ['5a4b3f', 'ferro brunito'], n: ['ffd27a', 'lanterna', 'glow="True"'], b: ['b87333', 'tubi di rame'], s: ['e8e4dc', 'vapore'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [piastre('O', 10), tubi({ n: 3, t: 'b', cima: 's' })],
    finestra: ARCO,
    tetto: [torre({ w: 5, body: 'I', cima: 'n', top: 3 }), padiglione()],
  },
  {
    id: 'osservatorio',
    ambientazione: 'steampunk',
    nome: 'Osservatorio a vapore, con la sala delle caldaie',
    cantina: true,
    colori: { ...STEAMPUNK, I: ['7a3a28', 'mattoni della torre'], O: ['c9a227', 'cupola di ottone'], v: ['2a2420', 'finestra a oblò'], b: ['b87333', 'tubi di rame'], s: ['e8e4dc', 'vapore'] },
    progetto: [arredo(1)],
    facciate: [tubi({ n: 4, t: 'b', cima: 's' })],
    finestra: OCCHIO,
    tetto: [torre({ w: 11, body: 'I', cima: 'O', steps: 16 }), cuspide('O'), feritoie('I', 'v', 6), padiglioneBasso(3)],
  },
  {
    id: 'officina',
    ambientazione: 'steampunk',
    nome: 'Officina delle presse, con il deposito del carbone',
    cantina: true,
    colori: { ...STEAMPUNK, R: ['4b4440', 'lamiera ondulata'], c: ['2e2b29', 'ciminiera'], s: ['dcd8cf', 'fumo'], b: ['b87333', 'tubi di rame'], O: ['c9a227', 'ingranaggi'] },
    progetto: [arredo(1)],
    facciate: [tubi({ n: 6, t: 'b', cima: 's' }), piastre('O', 8)],
    finestra: NASTRO,
    tetto: [faldeY(), ciminiere({ n: 3, w: 1, h: 20, c: 'c', cima: 's' })],
  },
  {
    id: 'palazzo-dei-meccanici',
    ambientazione: 'steampunk',
    nome: 'Palazzo dei meccanici, a due piani',
    cantina: false,
    colori: { ...STEAMPUNK, O: ['c9a227', 'fregi di ottone'], d: ['3a3532', 'antenna di ferro'], n: ['ffd27a', 'lampada', 'glow="True"'], c: ['5b3a2e', 'comignolo'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [fascia('O'), piastre('O', 8)],
    finestra: BIFORA,
    tetto: [padiglioneBasso(4), antenne('d', 3, 10, 'n'), ciminiere({ n: 2, w: 1, h: 6, c: 'c' })],
  },
  {
    id: 'stazione-dirigibili',
    ambientazione: 'steampunk',
    nome: 'Stazione dei dirigibili, con la torre dell’orologio',
    cantina: false,
    colori: { ...STEAMPUNK, R: ['9fb7a8', 'tettoia di vetro', 'alpha="0.6"'], I: ['6a3324', 'mattoni della torre'], O: ['e9d9a0', 'quadrante', 'glow="True"'], b: ['b87333', 'tubi di rame'], s: ['e8e4dc', 'vapore'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [tubi({ n: 4, t: 'b', cima: 's' })],
    finestra: NASTRO,
    tetto: [torre({ w: 7, body: 'I', cima: 'O', top: 4 }), falde()],
  },
  // ---------------------------------------------------------------- moderno
  {
    id: 'bistrot',
    ambientazione: 'moderno',
    nome: 'Bistrot con l’enoteca interrata',
    cantina: true,
    colori: { ...MODERNO, O: ['24324a', 'pannelli solari'], f: ['a0703f', 'listelli di larice'], c: ['9da3a8', 'canna fumaria'] },
    progetto: [arredo(1)],
    facciate: [fascia('f')],
    finestra: NASTRO,
    tetto: [pannelli('O', 6), ciminiere({ n: 2, w: 1, h: 4, c: 'c' })],
  },
  {
    id: 'cappella',
    ambientazione: 'moderno',
    nome: 'Cappella del silenzio, con il campanile',
    cantina: false,
    colori: { ...MODERNO, I: ['ece9e2', 'cemento bianco'], O: ['b9bec4', 'cella campanaria'], V: ['d9c27a', 'vetro dorato', 'alpha="0.5"'], e: ['a9d6e5', 'lucernario', 'alpha="0.5"'] },
    progetto: [arredoForse(), ala(2)],
    finestra: BIFORA,
    tetto: [torre({ w: 5, body: 'I', cima: 'O', top: 4 }), pannelli('e', 4, 3)],
  },
  {
    id: 'torre-panoramica',
    ambientazione: 'moderno',
    nome: 'Torre panoramica, con l’autorimessa interrata',
    cantina: true,
    colori: { ...MODERNO, I: ['cfccc4', 'cemento della torre'], O: ['7fb2c4', 'belvedere di vetro', 'alpha="0.5"'], d: ['5d6166', 'antenna'], n: ['ff4b4b', 'luce di segnalazione', 'glow="True"'] },
    progetto: [arredo(1)],
    finestra: NASTRO,
    tetto: [torre({ w: 13, body: 'I', cima: 'O', top: 5 }), antenne('d', 2, 8, 'n')],
  },
  {
    id: 'laboratorio',
    ambientazione: 'moderno',
    nome: 'Laboratorio di ricerca, con il magazzino interrato',
    cantina: true,
    colori: { ...MODERNO, R: ['a3a7aa', 'guaina grigia'], O: ['24324a', 'pannelli solari'], c: ['b4b9bd', 'bocchette di aerazione'], d: ['5d6166', 'antenna'], n: ['ff4b4b', 'luce rossa', 'glow="True"'] },
    progetto: [arredo(1)],
    finestra: NASTRO,
    tetto: [pannelli('O', 8), ciminiere({ n: 3, w: 2, h: 5, c: 'c' }), antenne('d', 2, 12, 'n')],
  },
  {
    id: 'palazzina',
    ambientazione: 'moderno',
    nome: 'Palazzina di quattro alloggi, con i balconi',
    cantina: false,
    colori: { ...MODERNO, f: ['a0703f', 'rivestimento di legno'], b: ['c7ccd0', 'balconi'], O: ['24324a', 'pannelli solari'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [anello('b'), travi('f', 10)],
    finestra: NASTRO,
    tetto: [pannelli('O', 5)],
  },
  {
    id: 'mercato-coperto',
    ambientazione: 'moderno',
    nome: 'Mercato coperto',
    cantina: false,
    colori: { ...MODERNO, R: ['a7c7d3', 'copertura di vetro', 'alpha="0.6"'], O: ['6c7378', 'travi di acciaio'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [fascia('O')],
    finestra: NASTRO,
    tetto: [falde()],
  },
  // ---------------------------------------------------------------- futuristico
  {
    id: 'lounge-criogenica',
    ambientazione: 'futuristico',
    nome: 'Lounge orbitale, con il deposito criogenico',
    cantina: true,
    colori: { ...FUTURISTICO, n: ['3df5ff', 'anello di neon', 'glow="True"'], d: ['8d9aa8', 'antenna'], e: ['ff3df0', 'luce magenta', 'glow="True"'] },
    progetto: [arredo(1)],
    facciate: [anello('n')],
    finestra: NASTRO,
    tetto: [padiglioneBasso(5), antenne('d', 2, 10, 'e')],
  },
  {
    id: 'santuario-della-luce',
    ambientazione: 'futuristico',
    nome: 'Santuario della luce',
    cantina: false,
    colori: { ...FUTURISTICO, I: ['eaf6ff', 'guglia di luce', 'glow="True"'], n: ['7af0ff', 'fascia di luce', 'glow="True"'], R: ['d8e2ea', 'copertura opalina'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [fascia('n')],
    finestra: OCCHIO,
    tetto: [torre({ w: 3, body: 'I', cima: 'n' }), padiglione()],
  },
  {
    id: 'faro',
    ambientazione: 'futuristico',
    nome: 'Faro di segnalazione, con la sala dei generatori',
    cantina: true,
    colori: { ...FUTURISTICO, I: ['e3e9ef', 'fusto del faro'], n: ['ffe66b', 'lanterna del faro', 'glow="True"'], b: ['3df5ff', 'anello di neon', 'glow="True"'] },
    progetto: [arredo(1)],
    facciate: [anello('b')],
    finestra: NASTRO,
    tetto: [torre({ w: 9, body: 'I', cima: 'n', top: 6 })],
  },
  {
    id: 'laboratorio-di-fusione',
    ambientazione: 'futuristico',
    nome: 'Laboratorio di fusione, con il nucleo interrato',
    cantina: true,
    colori: { ...FUTURISTICO, O: ['1b2a44', 'celle fotovoltaiche'], d: ['8d9aa8', 'antenna'], n: ['3df5ff', 'neon', 'glow="True"'], e: ['ff3df0', 'segnale', 'glow="True"'] },
    progetto: [arredo(1)],
    facciate: [fascia('n')],
    finestra: NASTRO,
    tetto: [pannelli('O', 10), antenne('d', 4, 14, 'e')],
  },
  {
    id: 'residenza-ad-anelli',
    ambientazione: 'futuristico',
    nome: 'Residenza ad anelli',
    cantina: false,
    colori: { ...FUTURISTICO, n: ['ff3df0', 'anello di neon', 'glow="True"'], O: ['1b2a44', 'celle fotovoltaiche'], d: ['8d9aa8', 'antenna'], e: ['3df5ff', 'segnale', 'glow="True"'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [anello('n')],
    finestra: NASTRO,
    tetto: [pannelli('O', 6), antenne('d', 2, 10, 'e')],
  },
  {
    id: 'scalo-navette',
    ambientazione: 'futuristico',
    nome: 'Scalo delle navette, con la piattaforma',
    cantina: false,
    colori: { ...FUTURISTICO, I: ['c3ccd5', 'piloni della piattaforma'], n: ['3df5ff', 'bordo della piattaforma', 'glow="True"'], d: ['8d9aa8', 'antenna'], e: ['ff9a3d', 'luce di pista', 'glow="True"'], b: ['3df5ff', 'anello di neon', 'glow="True"'] },
    progetto: [arredoForse(), ala(2)],
    facciate: [anello('b')],
    finestra: NASTRO,
    tetto: [torre({ w: 15, body: 'I', cima: 'n', steps: 4 }), antenne('d', 3, 14, 'e')],
  },
];

const args = process.argv.slice(2).filter((a) => a !== '--');
const scelte = args.length ? CATALOGO.filter((s) => args.includes(s.id) || args.includes(`${s.ambientazione}/${s.id}`)) : CATALOGO;
for (const s of scelte) {
  const file = path.join(DIR, 'sorgenti', s.ambientazione, `${s.id}.xml`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, componi(s));
  console.log(path.relative(process.cwd(), file));
}
