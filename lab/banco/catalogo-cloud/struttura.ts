// The structure every program of the catalogue grows from (`genera.ts`): the skeleton of `riferimento/cantiere.xml` and the cellar of
// `riferimento/cantina.xml`, node by node, with the changes that make it fast (`genera.ts`, at the top) and the choices of a `Scheda`.

import { all, colonne, many, one, P, prl, S, type Colore, type Nodo, type Programma } from './genera';

export type Ambientazione = 'fantasy' | 'steampunk' | 'moderno' | 'futuristico';

export interface Scheda {
  nome: string;
  ambientazione: Ambientazione;
  /** What it is, in a line: for the index. */
  titolo: string;
  descrizione: string;
  cantina: boolean;
  /** Low bays that grow through a wall, after the tall ones (3 without a cellar, 1 with: the pit takes two). */
  basse?: number;
  /** Chance that a low bay next to a tall one becomes tall (0.07). */
  alte?: number;
  /** The roof on the R layer: flat with parapets, hipped (`falde` strata), or in steps two strata high. */
  tetto?: 'piano' | 'falde' | 'gradoni';
  falde?: number;
  /** Battlements on the top of the outer walls. */
  merli?: boolean;
  /** Towers 9×9 at the outer corners of the building, `alta` strata from the ground, with their top. */
  torri?: { n: number; alta: number; cima: 'punta' | 'lanterna' | 'piatta' };
  /** Chimneys on the roof: how many and how tall above it. */
  camini?: { n: number; alto: number };
  /** Pipes up the outer walls. */
  tubi?: number;
  /** A sign over the front door. */
  insegna?: boolean;
  /** Glowing bands in the outer walls, at the floors. */
  neon?: boolean;
  /** Balconies on the upper floor of the outer tall walls. */
  balconi?: number;
  /** Buttresses or pilasters on the outer walls (6). */
  lesene?: number;
  colori: Record<string, Colore>;
}

/** The letters of the skeleton and what each of them is at the end, as the colours say. */
export const COLORI_BASE: Record<string, Colore> = {
  k: { value: '5a3a22', name: 'porta' },
  S: { value: 'd6d2c8', name: 'cemento chiaro' },
  F: { value: 'a8743f', name: 'legno' },
  C: { value: 'b9b5ab', name: 'cemento grigio' },
  W: { value: 'f0ece2', name: 'intonaco' },
  R: { value: '8f8f88', name: 'ghiaia' },
  V: { value: '86b8c8', alpha: 0.5, name: 'vetro' },
  D: { value: '3a3d42', name: 'telaio' },
  L: { value: '7a5a3c', name: 'rovere' },
  T: { value: 'e0d9c2', name: 'gradino' },
  K: { value: 'c2c7cc', name: 'acciaio' },
  A: { value: '9a9590', name: 'lastricato' },
  a: { value: '6f6c66', name: 'fondazione' },
  x: { value: '7a4a24', name: 'botti' },
};

/** The letters of what a Scheda adds, given a colour only when it is used. */
export const COLORI_AGGIUNTE: Record<string, Colore> = {
  c: { value: '6a3b2a', name: 'mattoni del camino' },
  '6': { value: '8c8a84', name: 'pietra della torre' },
  q: { value: '4a5560', name: 'ardesia' },
  n: { value: 'ffd27a', name: 'lanterna', glow: true },
  '8': { value: 'b87333', name: 'rame' },
  '9': { value: '2e2e30', name: 'ferro' },
  '7': { value: '8a5a2b', name: 'insegna' },
  h: { value: 'a9a59b', name: 'merlatura' },
  i: { value: 'a9a59b', name: 'merli' },
  v: { value: '5ff0ff', name: 'neon', glow: true },
  '4': { value: '2e2e30', name: 'ringhiera' },
  '5': { value: 'd6d2c8', name: 'balcone' },
};

/** The markers that stay in the model: they have the colour of what they stand for, so nothing has to rewrite them. */
function marcatori(c: Record<string, Colore>): Record<string, Colore> {
  return {
    U: { ...c.C, name: `${c.C.name} (fascia)` },
    u: { ...c.W, name: `${c.W.name} (fascia)` },
    Y: { ...c.T, name: `${c.T.name} (testa)` },
    G: { ...c.L, name: `${c.L.name} (base)` },
  };
}

const RIGHE = (n: number, r: string) => Array(n).fill(r).join('/');

/** The lattice: arms from the centre, then the lines between the pillars (cantiere.xml, section 1). */
function reticolo(): Nodo[] {
  return [
    S(prl('***/*E*/***', '***/*z*/***')),
    P(all('Nz', '*a', { steps: 1 })),
    P(all('[Nx]az', '*xa', { steps: 14 })),
    P(prl('a', 'Q')),
    P(all('xQz', '*Qa', { steps: 1 })),
    P(all('[Qx]az', '*xa', { steps: 29 })),
    P(prl('a', 'Q')),
    P(all('z/Q/z', 'a/Q/a', { sym: '()' })),
    P(all('[Qp]/a/z', '*/p/a', { sym: '(y)', steps: 44 })),
    P(prl('a', 'p')),
    P(all('zQz', 'aQa', { sym: '()' })),
    P(all('[Ql]a[zp]', '*la', { sym: '(x)', steps: 44 })),
    P(many('prl', [['a', 'p'], ['l', 'p']])),
    P(all('x/Q/z', 't/O/*', { sym: '()' })),
    P(prl('Q', 'p')),
    P(many('prl', [['x', 'z'], ['N', 'z']])),
    S(all('Ez', '*E')),
    P(many('all', [['*p*/ppp/*p*', '***/*P*/***'], ['ppp/*p*', '*P*/***'], ['pp/p*', 'P*/**']])),
    P(all('Op', '*O', { steps: 5 })),
    P(all('tz', '*t')),
  ];
}

/** The pit of the cellar: one bay beyond a wall of a tall bay, the door against a pillar, the two rows behind it are the head of the stair; a second bay beside it. */
function pozzo(): Nodo[] {
  return [
    P(one('*t/Pp/*z', '**/*m/*o', { steps: 1 })),
    P(all('oz', '*o')),
    // una seconda campata del pozzo accanto alla prima, da qualunque lato: il muro fra le due sparisce
    P(one('opz', '*lo', { steps: 1 })),
    P(all('oz', '*o')),
    P(all('lp', '*l')),
    P(prl('l', 'o')),
    P(all('mp', '*m', { steps: 10 })),
    P(all('m/o', '*/x')),
    P(all('x/o', '*/Q')),
  ];
}

/** The stair and the bays that grow through a wall (cantiere.xml, section 2). */
function progetto(s: Scheda): Nodo[] {
  const T = (n: number) => RIGHE(n, '*ttttttttttt');
  const basse = s.basse ?? (s.cantina ? 1 : 3);
  const bassa = [
    P(one(`*zzzzzzzzzzzz/Ppppppppppppp/*333333333333`, `******b******/******H******/*************`, { steps: 1 })),
    P(all('bz', '*b')),
  ];
  return [
    P(all('Ot', '*v')),
    P(all('vt', '*v', { steps: 6 })),
    ...(s.cantina ? [P(all('m/t', '*/v'))] : []),
    P(one(`*zzzzzzzzzzz/Pppppppppppp/${T(17)}`, `************/*yyyyyyyyyyy/*ggggggggggg/${RIGHE(16, '************')}`, { steps: 1 })),
    P(all('[ys]/g/t', '*/s/g', { steps: 16 })),
    P(all('s/g', 'c/d')),
    P(all('z/y', 't/*')),
    P(all('tz', '*t')),
    // una porta fra campate alte vicine, anche accanto alla zona di rispetto (v): è la scala che deve starne lontana, non le porte
    P(all(`*${'[tv]'.repeat(12)}/Ppppppppppppp/*${'[tv]'.repeat(12)}`, `*************/******H******/*************`)),
    P(all('[gsdc]t', '*v')),
    P(all('vt', '*v', { steps: 9 })),
    ...Array.from({ length: basse }, () => bassa).flat(),
    P(all('Hp', '*H', { steps: 5 })),
    P(many('prl', [['tHb', '*Ht', 0.07]])),
    P(all('tb', '*t')),
    P(one('bHb', '*n*', { steps: 1 })),
    P(many('all', [['nH', '*n'], ['np', '*n']])),
    P(one('nnnnnnnnn', '*eeeeeee*', { steps: 1 })),
    P(prl('v', 't')),
    ...(s.cantina ? [P(prl('m', 'H'))] : []),
  ];
}

/** The walls from the letters at their sides, the buttresses, the fences to jump, the street (cantiere.xml, section 3). */
function muri(s: Scheda): Nodo[] {
  return [
    P(many('prl', [['[zE]p[zE]', '*q*'], ['[zE]p1', '*w*'], ['[zE]p2', '*X*'], ['1p1', '*i*'], ['2p2', '*I*'], ['1p2', '*J*'], ['1H1', '*h*'], ['1H2', '*j*'], ['EO2', '*M*']])),
    P(prl('n', 'h')),
    P(prl('P[XIJjHMy]', 'I*')),
    P(prl('P[wihO]', 'i*')),
    P(prl('P', 'E')),
    P(many('one', [['EEEEEEE/EEEEEEE/wwwwwww', '*iiiii*/*iiiii*/*******'], ['EEEEEEE/EEEEEEE/XXXXXXX', '*IIIII*/*IIIII*/*******']], { steps: s.lesene ?? 6 })),
    // Fences to jump over, against the building: at the middle of an outer wall (15 from its pillar), at most one per wall, far from each other.
    P(one(`[iI]${'[wX]'.repeat(15)}/${RIGHE(10, '*' + '[zE]'.repeat(15))}`, `${'*'.repeat(16)}/${RIGHE(9, '*'.repeat(15) + 'G')}/${'*'.repeat(16)}`, { steps: 4 })),
    ...aggiunte(s),
    P(prl('q', 'E')),
    P(all('M/E', '*/A', { sym: '()' })),
    P(all('A/E', '*/A', { sym: '()' })),
  ];
}

/** What a Scheda adds to the plan, on the ground beside the outer walls: towers at the corners, pipes, balconies. */
function aggiunte(s: Scheda): Nodo[] {
  const O = '[zEq]';
  const out: Nodo[] = [];
  if (s.torri) {
    // a corner of the building: the pillar, the wall to its right and the one below, outside up and to the left; the tower takes the 9×9 outside and the pillar
    const inn = [...Array(8).fill(O.repeat(10)), `${O.repeat(8)}[iI][wX]`, `${O.repeat(8)}[wX]*`].join('/');
    const o = [...Array(9).fill('fffffffff*'), '**********'].join('/');
    out.push(P(one(inn, o, { steps: s.torri.n })));
  }
  if (s.tubi) out.push(P(one(`[wX]/${O}/${O}`, '*/r/*', { steps: s.tubi })));
  if (s.balconi) out.push(P(one(`${O.repeat(11)}/${O.repeat(11)}/${O.repeat(11)}/XXXXXXXXXXX`, '***********/*444444444*/*555555555*/***********', { steps: s.balconi })));
  return out;
}

/** Every letter of the plan, its column from the ground up (the quotes of cantiere.xml, section 4, in one stroke). */
function quote(s: Scheda): Record<string, string> {
  const fascia = s.neon ? 'v' : 'S';
  const cima = s.merli ? 'h' : 'C';
  const c: Record<string, string> = {
    i: 'S C31 S S R',
    w: `S C9 U14 C8 ${fascia} S W4 ${cima}`,
    b: 'S F .30 S R',
    I: 'S C31 S S W30 S R',
    j: `S F .30 S S W8 u14 W8 ${fascia} S S ${cima}`,
    J: `S C31 S S W8 u14 W8 ${fascia} S S ${cima}`,
    t: 'S F .30 S F .30 S R',
    X: `S C9 U14 C8 ${fascia} S W8 u14 W8 ${fascia} S S ${cima}`,
    y: 'S K32 .31 S R',
    H: 'S F .30 S F .30 S R',
    s: 'S F .62 S R',
    c: 'S Y .62 S R',
    d: 'S T .62 S R',
    M: `S F k30 S S ${s.insegna ? '7 9 7 9 7 9 7 9' : 'W8'} W22 ${fascia} S S ${cima}`,
    h: 'S F .30 S S R',
    e: 'S L8 G .22 S R',
    G: 'G L8',
  };
  if (s.cantina) Object.assign(c, { o: 'l .31 S R', x: 'l m .30 S R', Q: 'l N .30 S R' });
  if (s.torri) {
    const h = s.torri.alta;
    c.f = s.torri.cima === 'lanterna' ? `S 6${h - 10} V4 n3 6 q` : `S 6${h - 2} q`;
  }
  if (s.tubi) c.r = 'S 8 864 8';
  if (s.balconi) Object.assign(c, { '5': '.32 S', '4': '.32 S 9 9 9' });
  return c;
}

/** Under the ground: the pit dug to the bottom, the stair that goes down, the barrels (cantina.xml), with the pit in the first cell. */
function scavo(): Nodo[] {
  return [
    P(prl('Sl', 'al')),
    // il pozzo scende di 12 strati a ogni taglia: 4 gradini da 3 con pedata 6 stanno in una campata
    all('l B', '* l', { sym: '()', steps: 11 }),
    all('l B', 'A *', { sym: '()' }),
    all('a B', '* a', { sym: '()' }),
    all('a Z', '* a', { sym: '()' }),
    // alzata 3 e pedata 6: sopra il pozzo ogni colonna sotto il corpo sta entro un gradino dai piedi; la testa mN cerca il pozzo (l) nell'angolo che il motore legge per primo
    all('mN****** ******** ******** llllllll', 'KK****** ******** ******** llKKKKmN'),
    many('prl', [['l', 'B'], ['m', 'K'], ['N', 'K']]),
  ];
}

function scala(s: Scheda): Nodo[] {
  return [
    all('*BB *B* TY*', '*TY *K* KK*', { steps: 16 }),
    all('K B', '* K', { sym: '()' }),
    ...(s.cantina
      ? [
          one(`${RIGHE(13, '*BB')} ${RIGHE(13, 'aAA')}`, `${RIGHE(5, '***')}/*xx/*xx/*xx/${RIGHE(5, '***')} ${RIGHE(13, '***')}`, { steps: 4 }),
          all('B x', 'x *', { sym: '()' }),
        ]
      : []),
  ];
}

const FINESTRA = (U: string) => [
  Array(14).fill(U.repeat(11)).join(' '),
  ['***********', '*DDDDDDDDD*', ...Array(10).fill('*DVVVVVVVD*'), '*DDDDDDDDD*', '***********'].join(' '),
];

function facciate(s: Scheda): Nodo[] {
  const out: Nodo[] = [all(...(FINESTRA('U') as [string, string])), all(...(FINESTRA('u') as [string, string]))];
  if (s.merli) out.push(all('BBBB BBBB BBBB hhhh', 'ii** ii** ii** ****'));
  return out;
}

/** The roof on the R layer, the tops of the towers, the chimneys. */
function tetto(s: Scheda): Nodo[] {
  const out: Nodo[] = [];
  if (s.tetto === 'falde') out.push(all('***/*B*/*** *R*/RRR/*R*', '***/*R*/*** ***/***/***', { steps: s.falde ?? 9, sym: '()' }));
  if (s.tetto === 'gradoni') out.push(all('***/*B*/*** ***/*B*/*** *R*/RRR/*R*', '***/*R*/*** ***/*R*/*** ***/***/***', { steps: s.falde ?? 5, sym: '()' }));
  if (s.torri?.cima === 'punta') out.push(all('***/*B*/*** *q*/qqq/*q*', '***/*q*/*** ***/***/***', { steps: 5, sym: '()' }));
  if (s.camini) out.push(one('B B R', '* c *', { steps: s.camini.n, sym: '()' }), all('B c', 'c *', { steps: s.camini.alto, sym: '()' }));
  else out.push(one('B B R', '* D *', { steps: 2, sym: '()' }), all('DB *R', '*D **', { sym: '(x)', steps: 8 }), all('D/B */R', '*/D */*', { sym: '(y)', steps: 8 }), all('B D', 'D *', { steps: 7, sym: '()' }));
  return out;
}

export function programma(s: Scheda): Programma {
  const colori = { ...COLORI_BASE, ...COLORI_AGGIUNTE, ...s.colori };
  return {
    values: 'BNE',
    cantina: s.cantina,
    unions: { '1': s.cantina ? 'beoxQ' : 'be', '2': 'tsdcv', '3': 'tbv' },
    colori: { ...colori, ...marcatori(colori) },
    sezioni: [
      { titolo: '1. reticolo: bracci dal centro, poi le linee (pattern alti: la pianta sta sul suolo)', nodi: reticolo() },
      ...(s.cantina ? [{ titolo: 'la cantina: una campata accanto, poi due campate in linea oltre un muro', nodi: pozzo() }] : []),
      { titolo: '2. progetto: la scala attraversa il muro, le altre campate crescono attraverso un muro', nodi: progetto(s) },
      { titolo: '3. i muri dalle lettere vicine, contrafforti, staccionate da saltare, la strada', nodi: muri(s) },
      { titolo: '4. le colonne: ogni lettera scrive tutta la sua colonna in un passo', nodi: [colonne(quote(s))] },
      ...(s.cantina ? [{ titolo: 'la cantina: il pozzo si scava dal suolo, le fondazioni scendono fino in fondo, la scala scende cercando il pozzo', nodi: scavo() }] : []),
      { titolo: '5. la scala', nodi: scala(s) },
      { titolo: '6. finestre e facciate', nodi: facciate(s) },
      { titolo: '7. tetto, cime delle torri, comignoli', nodi: tetto(s) },
      { titolo: '8. pulizia', nodi: [P(many('prl', [['E', 'B'], ['z', 'B'], ...(s.cantina ? ([['Z', 'B']] as Array<[string, string]>) : [])]))] },
    ],
    azioni: ['<action name="apri" label="Apri la porta"><prl in="k" out="B"/></action>'],
  };
}
