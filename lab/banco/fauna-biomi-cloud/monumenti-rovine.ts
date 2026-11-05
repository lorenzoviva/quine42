// Collection 3: bridges, ruins, portals and large outdoor installations. Most are `edificio` (50 × 50 × 50): a choice of the whole
// silhouette, then what time and use do to it at random (missing stones, columns broken at a height of their own, moss, rust, ivy).

import { box, chioma, cone, cristalli, cyl, ell, line, macchie, massi, nota, programma, punte, ramifica, rami, scelta, sopra, tronco } from './attrezzi';
import type { Definizione } from './catalogo';

const C = 'monumenti-rovine' as const;

/** Ivy or roots that hang from the underside of `da` (n seeds), down for lengths of their own. */
const pende = (da: string, n: number, lungo: number, c: string, p = 0.75) => [
  nota(`${n} rampicanti pendono da sotto ${da}, ognuno per la sua lunghezza`),
  `<one in="${da} B" out="* P" steps="${n}"/>`,
  `<prl in="P B" out="${c} P" p="${p}" steps="${lungo}"/>`,
  `<prl in="P" out="${c}"/>`,
];

/** Columns that rise from `P` seeds and stop at a height of their own: a ruin, a building site. */
const colonne = (passi: number, c: string, rotta: string, pStop = 0.05) => [
  nota('ogni colonna sale finché non si spezza, a caso'),
  `<prl steps="${passi}"><rule in="B P" out="P ${c}" p="0.9"/><rule in="P" out="${rotta}" p="${pStop}"/></prl>`,
  `<prl in="P" out="${rotta}"/>`,
];

export const MONUMENTI_ROVINE: Definizione[] = [
  {
    collezione: C,
    ambientazione: 'fantasy',
    nome: 'ponte-pietra-antico',
    titolo: 'Ponte di pietra antico',
    classe: 'edificio',
    descrizione: 'Un ponte di pietra che scavalca un torrente di Aurora da prima che qualcuno ricordi: archi, parapetti sbrecciati, edera.',
    procedura: 'due scelte a caso (il ponte: un arco grande, due archi, tre archi bassi, crollato a metà sul suo cumulo di pietre; le teste: due statue, due lanterne, una torretta) e poi il tempo: pietre del parapetto che mancano a caso, muschio sopra, edera che pende da sotto gli archi.',
    xml: () =>
      programma({
        titolo: 'Ponte di pietra antico',
        commento: 'Ponte di pietra antico (Cantiere 8, aurora): archi e teste a caso; parapetti, muschio ed edera a caso.',
        colori: [
          ['S', '9a948a', 'pietra'],
          ['D', '6f6a62', 'pietra scura'],
          ['Q', 'b0aa9e', 'parapetto'],
          ['M', '5f8f3e', 'muschio'],
          ['V', '3f7a35', 'edera'],
          ['L', 'ffd27a', 'lanterne', 'glow'],
        ],
        marcatori: 'Px',
        corpo: [
          ...scelta('ponte', [[25, 25, 0], [50, 18, 34]], [
            ['un arco grande', [ell([25, 25, -26], [36, 14, 52], 'x'), box([25, 20, 31], [50, 1, 3], 'Q'), box([25, 30, 31], [50, 1, 3], 'Q'), box([25, 25, 30], [50, 12, 1], 'D'), box([25, 25, 0], [50, 12, 30], 'S')]],
            ['due archi', [ell([13, 25, -24], [18, 14, 48], 'x'), ell([37, 25, -24], [18, 14, 48], 'x'), box([25, 20, 31], [50, 1, 3], 'Q'), box([25, 30, 31], [50, 1, 3], 'Q'), box([25, 25, 30], [50, 12, 1], 'D'), box([25, 25, 0], [50, 12, 30], 'S')]],
            ['tre archi bassi', [ell([9, 25, -20], [12, 14, 40], 'x'), ell([25, 25, -20], [12, 14, 40], 'x'), ell([41, 25, -20], [12, 14, 40], 'x'), box([25, 20, 31], [50, 1, 3], 'Q'), box([25, 30, 31], [50, 1, 3], 'Q'), box([25, 25, 30], [50, 12, 1], 'D'), box([25, 25, 0], [50, 12, 30], 'S')]],
            ['crollato a metà', [ell([25, 25, 0], [40, 16, 14], 'D'), ell([25, 25, -26], [36, 14, 52], 'x'), box([25, 25, 26], [9, 16, 12], 'x'), box([25, 20, 31], [50, 1, 3], 'Q'), box([25, 30, 31], [50, 1, 3], 'Q'), box([25, 25, 30], [50, 12, 1], 'D'), box([25, 25, 0], [50, 12, 30], 'S')]],
          ]),
          `<prl in="x" out="B"/>`,
          ...scelta('teste', [[25, 25, 30], [50, 20, 20]], [
            ['due statue', [box([2, 25, 31], [4, 4, 3], 'D'), ell([2, 25, 33], [4, 4, 10], 'S'), box([48, 25, 31], [4, 4, 3], 'D'), ell([48, 25, 33], [4, 4, 10], 'S')]],
            ['due lanterne', [line([2, 20, 31], [2, 20, 40], 0.5, 'D'), box([2, 20, 40], [3, 3, 3], 'L'), line([48, 30, 31], [48, 30, 40], 0.5, 'D'), box([48, 30, 40], [3, 3, 3], 'L')]],
            ['una torretta', [box([5, 25, 31], [8, 12, 10], 'S'), cone([5, 25, 41], [10, 14, 7], 'D')]],
          ]),
          nota('pietre del parapetto che mancano'),
          `<prl in="B Q" out="* B" p="0.3" steps="1"/>`,
          sopra('S', 'M', 0.35),
          sopra('D', 'M', 0.25),
          ...pende('S', 12, 14, 'V'),
        ],
      }),
  },

  {
    collezione: C,
    ambientazione: 'fantasy',
    nome: 'circolo-megalitico',
    titolo: 'Circolo megalitico',
    classe: 'edificio',
    descrizione: 'Un cerchio di pietre ritte su un poggio di Aurora: nessuno sa chi le abbia alzate, ognuna ha la sua altezza.',
    procedura: 'otto pietre nascono in punti a caso dell\'anello, salgono e si fermano a un\'altezza propria; il centro a caso (altare, pietra madre, dolmen, cerchio del fuoco); licheni e muschio a caso.',
    xml: () =>
      programma({
        titolo: 'Circolo megalitico',
        commento: 'Circolo megalitico (Cantiere 8, aurora): pietre in posti e altezze a caso; centro a caso.',
        colori: [
          ['E', '6a7a4a', 'poggio erboso'],
          ['S', '8a8680', 'pietra'],
          ['D', '5f5b55', 'pietra scura'],
          ['L', 'c8c070', 'licheni'],
          ['M', '5f8f3e', 'muschio'],
          ['F', 'ff8a2a', 'fuoco', 'glow'],
        ],
        marcatori: 'gPx',
        corpo: [
          cyl([25, 25, 0], [48, 48, 1], 'E'),
          cyl([25, 25, 0], [44, 44, 2], 'E'),
          nota('l\'anello dove possono nascere le pietre'),
          cyl([25, 25, 2], [40, 40, 1], 'g'),
          cyl([25, 25, 2], [30, 30, 1], 'B', 'g'),
          `<one in="g" out="P" steps="8"/>`,
          `<prl in="g" out="B"/>`,
          ...[`<prl steps="36"><rule in="B P" out="P S" p="0.92"/><rule in="P" out="D" p="0.025"/></prl>`, `<prl in="P" out="D"/>`],
          `<all in="SB" out="*S" steps="2"/>`,
          ...scelta('centro', [[25, 25, 2], [24, 24, 40]], [
            ['altare', [box([25, 25, 2], [10, 6, 5], 'D'), box([25, 25, 7], [12, 8, 2], 'S')]],
            ['pietra madre', [line([25, 25, 2], [25, 25, 36], 2.5, 'D')]],
            ['dolmen', [box([20, 25, 2], [3, 8, 12], 'S'), box([30, 25, 2], [3, 8, 12], 'S'), box([25, 25, 14], [16, 12, 3], 'D')]],
            ['cerchio del fuoco', [cone([25, 25, 2], [6, 6, 6], 'F'), cyl([25, 25, 2], [6, 6, 2], 'x'), cyl([25, 25, 2], [10, 10, 2], 'D'), line([25, 25, 2], [25, 25, 32], 0.5, 'D')]],
          ]),
          `<prl in="x" out="B"/>`,
          macchie('S', 'L', 0.08),
          sopra('S', 'M', 0.4),
          sopra('E', 'M', 0.2),
        ],
      }),
  },
  {
    collezione: C,
    ambientazione: 'fantasy',
    nome: 'rovine-tempio-sommerso',
    titolo: 'Rovine del tempio sommerso',
    classe: 'edificio',
    descrizione: 'Un tempio di Aurora che la palude si è ripresa: lo stilobate sott\'acqua, colonne spezzate a ogni altezza, alghe e liane.',
    procedura: 'la pianta a caso (peristilio, due file, cella con le colonne davanti, colonnato a ferro di cavallo), ogni colonna che si spezza a un\'altezza sua, il resto del frontone a caso, liane che pendono e alghe sull\'acqua.',
    xml: () => {
      const semi = (punti: number[][]) => punti.map(([x, y]) => box([x, y, 6], [1, 1, 1], 'P'));
      const giro: number[][] = [];
      for (const x of [9, 17, 25, 33, 41]) giro.push([x, 13], [x, 37]);
      for (const y of [21, 29]) giro.push([9, y], [41, y]);
      return programma({
        titolo: 'Rovine del tempio sommerso',
        commento: 'Rovine del tempio sommerso (Cantiere 8, aurora): pianta a caso; colonne spezzate a caso; liane e alghe a caso.',
        colori: [
          ['A', '3f6f78', 'acqua della palude', 'alpha 0.6'],
          ['S', 'cfc6b0', 'marmo'],
          ['D', 'a89e86', 'marmo spezzato'],
          ['C', 'e0d8c4', 'colonne'],
          ['V', '3f7a35', 'liane'],
          ['G', '6a8f4a', 'alghe'],
        ],
        marcatori: 'P',
        corpo: [
          box([25, 25, 0], [42, 32, 6], 'S'),
          box([25, 25, 0], [46, 36, 2], 'S'),
          ...scelta('pianta', [[25, 25, 6], [42, 32, 2]], [
            ['peristilio', semi(giro)],
            ['due file', semi([9, 17, 25, 33, 41].flatMap((x) => [[x, 19], [x, 31]]))],
            ['cella con le colonne davanti', [box([25, 22, 6], [24, 14, 1], 'D'), ...semi([[13, 36], [21, 36], [29, 36], [37, 36]])]],
            ['ferro di cavallo', semi([[9, 13], [9, 21], [9, 29], [9, 37], [17, 37], [25, 37], [33, 37], [41, 37], [41, 29], [41, 21], [41, 13]])],
          ]),
          nota('le colonne salgono e si spezzano ognuna alla sua altezza'),
          ...colonne(38, 'C', 'D', 0.035),
          `<all in="CB" out="*C" steps="1"/>`,
          `<all in="DB" out="*D" steps="1"/>`,
          nota('la cella, se c\'è, alza i muri dal suo pavimento'),
          `<prl steps="14"><rule in="B D" out="D *" p="0.7"/></prl>`,
          nota('l\'acqua della palude copre lo stilobate'),
          box([25, 25, 0], [50, 50, 4], 'A', 'B'),
          sopra('A', 'G', 0.06),
          ...pende('C', 8, 12, 'V', 0.6),
        ],
      });
    },
  },
  {
    collezione: C,
    ambientazione: 'fantasy',
    nome: 'statua-colosso',
    titolo: 'Statua colosso',
    classe: 'monumento',
    descrizione: 'Il guardiano di pietra che veglia su un passo di Aurora: ogni seme è un altro eroe, con la sua posa e il suo copricapo.',
    procedura: 'tre scelte a caso (la posa: con la lancia, a braccia alzate, con la spada piantata, con lo scudo; il copricapo: elmo crestato, corona, cappuccio; il piedistallo: a gradoni, a tamburo, di roccia) e muschio, licheni e crepe a caso.',
    xml: () =>
      programma({
        titolo: 'Statua colosso',
        commento: 'Statua colosso (Cantiere 8, aurora): posa, copricapo e piedistallo a caso; muschio e crepe a caso.',
        colori: [
          ['S', 'b8b2a4', 'pietra chiara'],
          ['D', '807a6e', 'pietra scura'],
          ['O', 'c9a24a', 'bronzo'],
          ['M', '5f8f3e', 'muschio'],
          ['K', '4a463e', 'crepe'],
        ],
        corpo: [
          ...scelta('piedistallo', [[10, 10, 0], [20, 20, 9]], [
            ['a gradoni', [box([10, 10, 0], [19, 19, 3], 'D'), box([10, 10, 3], [15, 15, 3], 'D'), box([10, 10, 6], [12, 12, 2], 'S')]],
            ['a tamburo', [cyl([10, 10, 0], [19, 19, 2], 'D'), cyl([10, 10, 2], [14, 14, 6], 'S')]],
            ['di roccia', [ell([10, 10, 0], [20, 20, 14], 'D')]],
          ]),
          nota('il corpo: gambe, tunica, busto, testa'),
          line([7, 10, 7], [7, 10, 24], 2, 'S'),
          line([13, 10, 7], [13, 10, 24], 2, 'S'),
          cone([10, 10, 14], [14, 10, 14], 'S'),
          box([10, 10, 24], [11, 7, 14], 'S'),
          ell([10, 10, 37], [7, 7, 9], 'S'),
          ...scelta('posa', [[10, 10, 8], [20, 20, 52]], [
            ['con la lancia', [line([4, 10, 35], [3, 12, 24], 1.5, 'S'), line([16, 10, 35], [17, 12, 26], 1.5, 'S'), line([17, 12, 8], [17, 12, 58], 0.5, 'O'), cone([17, 12, 54], [3, 3, 5], 'O')]],
            ['a braccia alzate', [line([4, 10, 35], [2, 10, 50], 1.5, 'S'), line([16, 10, 35], [18, 10, 50], 1.5, 'S'), ell([2, 10, 50], [3, 3, 3], 'S'), ell([18, 10, 50], [3, 3, 3], 'S')]],
            ['con la spada piantata', [line([4, 10, 35], [9, 14, 26], 1.5, 'S'), line([16, 10, 35], [11, 14, 26], 1.5, 'S'), line([10, 15, 8], [10, 15, 28], 0.5, 'O'), box([10, 15, 26], [6, 1, 1], 'O')]],
            ['con lo scudo', [line([4, 10, 35], [3, 13, 28], 1.5, 'S'), ell([3, 15, 22], [4, 2, 14], 'O'), line([16, 10, 35], [18, 10, 44], 1.5, 'S'), line([18, 10, 44], [18, 10, 52], 0.5, 'O')]],
          ]),
          ...scelta('copricapo', [[10, 10, 40], [20, 20, 20]], [
            ['elmo crestato', [ell([10, 10, 40], [8, 8, 7], 'O'), line([10, 6, 46], [10, 15, 46], 1, 'D'), line([10, 6, 47], [10, 13, 51], 1, 'D')]],
            ['corona', [cyl([10, 10, 43], [8, 8, 3], 'O'), cone([7, 10, 46], [2, 2, 4], 'O'), cone([13, 10, 46], [2, 2, 4], 'O'), cone([10, 7, 46], [2, 2, 4], 'O'), cone([10, 13, 46], [2, 2, 4], 'O')]],
            ['cappuccio', [cone([10, 9, 39], [10, 10, 14], 'D')]],
          ]),
          nota('il tempo: crepe, licheni, muschio'),
          macchie('S', 'K', 0.04),
          sopra('S', 'M', 0.35),
          sopra('D', 'M', 0.3),
        ],
      }),
  },
  {
    collezione: C,
    ambientazione: 'fantasy',
    nome: 'portale-arcano',
    titolo: 'Portale arcano',
    classe: 'edificio',
    descrizione: 'Una soglia di pietra runica in una radura di Aurora, con una pellicola di luce tesa nel vano: di là non si vede la radura.',
    procedura: 'la cornice a caso (arco tondo, arco a punta, anello ritto, due obelischi con l\'architrave) con la sua pellicola di luce, il basamento a caso (gradini, cerchio, rocce), rune che si accendono a caso sulla pietra e cristalli che spuntano a caso dal basamento.',
    xml: () =>
      programma({
        titolo: 'Portale arcano',
        commento: 'Portale arcano (Cantiere 8, aurora): cornice e basamento a caso; rune e cristalli a caso.',
        colori: [
          ['S', '6a6478', 'pietra runica'],
          ['D', '45405a', 'pietra scura'],
          ['F', 'a87aff', 'pellicola di luce', 'alpha 0.55'],
          ['R', '9ff0ff', 'rune', 'glow'],
          ['X', 'd8b0ff', 'cristalli', 'glow'],
        ],
        marcatori: 'xPQ7890',
        corpo: [
          ...scelta('basamento', [[25, 25, 0], [50, 30, 6]], [
            ['gradini', [box([25, 25, 0], [44, 22, 2], 'D'), box([25, 25, 2], [38, 16, 2], 'D'), box([25, 25, 4], [32, 12, 1], 'S')]],
            ['cerchio', [cyl([25, 25, 0], [44, 26, 4], 'D')]],
            ['rocce', [ell([12, 25, 0], [20, 20, 8], 'D'), ell([38, 25, 0], [20, 20, 8], 'D'), box([25, 25, 0], [30, 12, 3], 'D')]],
          ]),
          ...scelta('cornice', [[25, 25, 3], [50, 14, 47]], [
            ['arco tondo', [ell([25, 25, 4], [22, 1, 36], 'F'), ell([25, 25, 4], [22, 9, 36], 'x'), box([25, 25, 3], [34, 6, 24], 'S'), ell([25, 25, 4], [34, 6, 44], 'S')]],
            ['arco a punta', [cone([25, 25, 3], [22, 1, 38], 'F'), cone([25, 25, 3], [22, 9, 38], 'x'), cone([25, 25, 3], [34, 6, 48], 'S')]],
            ['anello ritto', [ell([25, 25, 6], [28, 1, 28], 'F'), ell([25, 25, 6], [28, 9, 28], 'x'), ell([25, 25, 2], [38, 6, 36], 'S'), box([25, 25, 3], [16, 8, 4], 'D')]],
            ['obelischi con architrave', [box([25, 25, 4], [20, 1, 30], 'F'), box([13, 25, 3], [5, 6, 34], 'S'), box([37, 25, 3], [5, 6, 34], 'S'), box([25, 25, 36], [34, 7, 4], 'D'), cone([13, 25, 40], [5, 6, 6], 'S'), cone([37, 25, 40], [5, 6, 6], 'S')]],
          ]),
          `<prl in="x" out="B"/>`,
          macchie('S', 'R', 0.05),
          ...cristalli('D', 9, 7, 'X', 0.75, 0.3),
        ],
      }),
  },
  {
    collezione: C,
    ambientazione: 'steampunk',
    nome: 'orologio-astrario-piazza',
    titolo: 'Orologio astrario',
    classe: 'edificio',
    descrizione: 'L\'orologio astronomico in mezzo a una piazza di Orichalcum: torre di ghisa, quattro quadranti, e in cima i cieli in ottone.',
    procedura: 'tre scelte a caso (l\'ora: le lancette del quadrante davanti in una di quattro posizioni; la cima: sfera armillare, planetario a bracci, cupola con la campana, guglia con la banderuola; il basamento: a gradini, a fontana, a panchine) e ingranaggi di rame in posti a caso.',
    xml: () =>
      programma({
        titolo: 'Orologio astrario',
        commento: 'Orologio astrario (Cantiere 8, orichalcum): ora, cima e basamento a caso; ingranaggi a caso.',
        colori: [
          ['I', '33302c', 'ghisa'],
          ['O', 'c9a24a', 'ottone'],
          ['W', 'efe6cf', 'quadranti'],
          ['K', '1a1714', 'lancette'],
          ['C', 'c4703a', 'ingranaggi di rame'],
          ['S', '9a948a', 'pietra'],
          ['A', '6aa8c8', 'acqua', 'alpha 0.6'],
          ['L', 'ffd27a', 'luce dei quadranti', 'glow'],
        ],
        marcatori: 'x',
        corpo: [
          ...scelta('basamento', [[25, 25, 0], [50, 50, 7]], [
            ['a gradini', [box([25, 25, 0], [30, 30, 2], 'S'), box([25, 25, 2], [24, 24, 2], 'S'), box([25, 25, 4], [18, 18, 2], 'S')]],
            ['a fontana', [cyl([25, 25, 1], [40, 40, 3], 'A'), cyl([25, 25, 0], [44, 44, 4], 'S'), box([25, 25, 4], [16, 16, 2], 'S')]],
            ['a panchine', [box([25, 25, 0], [22, 22, 6], 'S'), box([25, 8, 0], [16, 3, 3], 'O'), box([25, 42, 0], [16, 3, 3], 'O'), box([8, 25, 0], [3, 16, 3], 'O'), box([42, 25, 0], [3, 16, 3], 'O'), box([25, 12, 0], [16, 7, 1], 'S'), box([25, 38, 0], [16, 7, 1], 'S'), box([12, 25, 0], [7, 16, 1], 'S'), box([38, 25, 0], [7, 16, 1], 'S')]],
          ]),
          box([25, 25, 6], [10, 10, 22], 'I'),
          box([25, 25, 28], [15, 15, 11], 'I'),
          nota('quattro quadranti luminosi'),
          box([25, 33, 29], [9, 1, 9], 'W', 'B'),
          box([25, 17, 29], [9, 1, 9], 'L', 'B'),
          box([33, 25, 29], [1, 9, 9], 'L', 'B'),
          box([17, 25, 29], [1, 9, 9], 'L', 'B'),
          ...scelta('ora', [[25, 34, 29], [10, 1, 9]], [
            ['le tre', [line([25, 34, 33], [25, 34, 37], 0, 'K'), line([25, 34, 33], [28, 34, 33], 0, 'K')]],
            ['le sei', [line([25, 34, 33], [25, 34, 37], 0, 'K'), line([25, 34, 33], [25, 34, 30], 0, 'K')]],
            ['le nove', [line([25, 34, 33], [25, 34, 37], 0, 'K'), line([25, 34, 33], [22, 34, 33], 0, 'K')]],
            ['mezzogiorno', [line([25, 34, 33], [25, 34, 37], 0, 'K')]],
          ]),
          ...scelta('cima', [[25, 25, 39], [50, 50, 11]], [
            ['sfera armillare', [line([25, 25, 38], [25, 25, 49], 0.5, 'O'), ell([25, 25, 41], [16, 16, 1], 'x'), ell([25, 25, 41], [20, 20, 1], 'O'), ell([25, 25, 40], [1, 14, 9], 'x'), ell([25, 25, 39], [1, 18, 11], 'O'), ell([25, 25, 40], [14, 1, 9], 'x'), ell([25, 25, 39], [18, 1, 11], 'O'), ell([25, 25, 43], [4, 4, 4], 'L')]],
            ['planetario a bracci', [line([25, 25, 39], [25, 25, 48], 1, 'O'), ell([25, 25, 46], [5, 5, 5], 'L'), line([25, 25, 42], [10, 25, 42], 0.5, 'O'), ell([10, 25, 41], [4, 4, 4], 'C'), line([25, 25, 44], [36, 36, 44], 0.5, 'O'), ell([36, 36, 43], [3, 3, 3], 'W'), line([25, 25, 40], [25, 8, 40], 0.5, 'O'), ell([25, 8, 39], [5, 5, 5], 'O')]],
            ['cupola con la campana', [line([19, 19, 39], [19, 19, 45], 0.5, 'I'), line([31, 19, 39], [31, 19, 45], 0.5, 'I'), line([19, 31, 39], [19, 31, 45], 0.5, 'I'), line([31, 31, 39], [31, 31, 45], 0.5, 'I'), ell([25, 25, 41], [8, 8, 6], 'O'), ell([25, 25, 44], [16, 16, 8], 'C')]],
            ['guglia con la banderuola', [cone([25, 25, 39], [14, 14, 9], 'C'), line([25, 25, 46], [25, 25, 49], 0, 'O'), box([27, 25, 48], [4, 1, 2], 'O')]],
          ]),
          `<prl in="x" out="B"/>`,
          macchie('I', 'C', 0.03),
        ],
      }),
  },
  {
    collezione: C,
    ambientazione: 'steampunk',
    nome: 'ponte-levatoio-ingranaggi',
    titolo: 'Ponte levatoio a ingranaggi',
    classe: 'edificio',
    descrizione: 'La porta di un quartiere di Orichalcum: due torri di mattoni con le ruote dentate, e un ponte che si alza a vapore.',
    procedura: 'tre scelte a caso (il ponte: abbassato, alzato, a metà; le torri: tonde, quadre, a traliccio; le ruote dentate: una grande per torre, due piccole, un treno di tre) e denti delle ruote, rivetti e ruggine a caso.',
    xml: () =>
      programma({
        titolo: 'Ponte levatoio a ingranaggi',
        commento: 'Ponte levatoio a ingranaggi (Cantiere 8, orichalcum): ponte, torri e ruote a caso; denti e ruggine a caso.',
        colori: [
          ['K', '8a4a35', 'mattoni'],
          ['W', '6b4a2a', 'tavolato'],
          ['I', '3a3633', 'ferro'],
          ['O', 'b88a2e', 'ruote d\'ottone'],
          ['Z', '8a4a2a', 'ruggine'],
          ['N', '2a2826', 'catene'],
        ],
        corpo: [
          ...scelta('torri', [[25, 38, 0], [50, 24, 50]], [
            ['tonde', [cyl([9, 38, 0], [14, 14, 36], 'K'), cyl([41, 38, 0], [14, 14, 36], 'K'), cone([9, 38, 36], [16, 16, 10], 'I'), cone([41, 38, 36], [16, 16, 10], 'I'), box([25, 38, 26], [24, 8, 10], 'K')]],
            ['quadre', [box([9, 38, 0], [13, 13, 38], 'K'), box([41, 38, 0], [13, 13, 38], 'K'), box([9, 38, 38], [15, 15, 2], 'I'), box([41, 38, 38], [15, 15, 2], 'I'), box([25, 38, 28], [24, 8, 10], 'K')]],
            ['a traliccio', [line([4, 33, 0], [8, 37, 36], 1, 'I'), line([14, 33, 0], [10, 37, 36], 1, 'I'), line([4, 43, 0], [8, 39, 36], 1, 'I'), line([14, 43, 0], [10, 39, 36], 1, 'I'), line([36, 33, 0], [40, 37, 36], 1, 'I'), line([46, 33, 0], [42, 37, 36], 1, 'I'), line([36, 43, 0], [40, 39, 36], 1, 'I'), line([46, 43, 0], [42, 39, 36], 1, 'I'), box([25, 38, 34], [42, 8, 4], 'I'), line([9, 38, 0], [9, 38, 34], 1, 'I'), line([41, 38, 0], [41, 38, 34], 1, 'I')]],
          ]),
          box([25, 31, 0], [24, 3, 4], 'I', 'B'),
          ...scelta('ponte', [[25, 18, 0], [24, 36, 38]], [
            ['abbassato', [box([25, 15, 3], [18, 30, 2], 'W'), box([25, 1, 0], [20, 3, 3], 'I'), line([16, 2, 5], [12, 33, 30], 0.5, 'N'), line([34, 2, 5], [38, 33, 30], 0.5, 'N')]],
            ['alzato', [box([25, 30, 3], [18, 2, 30], 'W'), line([16, 30, 32], [12, 34, 32], 0.5, 'N'), line([34, 30, 32], [38, 34, 32], 0.5, 'N')]],
            ['a metà', [...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => line([17, 30 - i * 2, 4 + i * 2], [33, 30 - i * 2, 4 + i * 2], 1, 'W')), line([16, 14, 20], [12, 33, 30], 0.5, 'N'), line([34, 14, 20], [38, 33, 30], 0.5, 'N')]],
          ]),
          ...scelta('ruote', [[25, 38, 4], [50, 24, 44]], [
            ['una grande per torre', [ell([1, 38, 16], [2, 16, 16], 'O'), ell([49, 38, 16], [2, 16, 16], 'O'), line([1, 38, 16], [9, 38, 16], 1, 'I'), line([49, 38, 16], [41, 38, 16], 1, 'I')]],
            ['due piccole', [ell([1, 34, 10], [2, 9, 9], 'O'), ell([1, 42, 22], [2, 9, 9], 'O'), ell([49, 34, 10], [2, 9, 9], 'O'), ell([49, 42, 22], [2, 9, 9], 'O'), line([1, 34, 14], [9, 38, 14], 1, 'I'), line([1, 42, 26], [9, 38, 26], 1, 'I'), line([49, 34, 14], [41, 38, 14], 1, 'I'), line([49, 42, 26], [41, 38, 26], 1, 'I')]],
            ['un treno di tre', [ell([25, 42, 30], [12, 2, 12], 'O'), ell([15, 42, 34], [8, 2, 8], 'O'), ell([35, 42, 34], [8, 2, 8], 'O'), box([25, 43, 35], [3, 2, 3], 'I')]],
          ]),
          nota('denti delle ruote, rivetti, ruggine'),
          `<prl in="BO" out="*O" p="0.25" steps="1"/>`,
          macchie('I', 'Z', 0.1),
          sopra('K', 'Z', 0.1),
        ],
      }),
  },
  {
    collezione: C,
    ambientazione: 'steampunk',
    nome: 'cisterna-pressione',
    titolo: 'Cisterna a pressione',
    classe: 'edificio',
    descrizione: 'Una cisterna del vapore cittadino di Orichalcum: lamiera rivettata, manometri accesi, tubi che partono in tutte le direzioni.',
    procedura: 'il serbatoio a caso (sfera su gambe, cilindro alto con la cupola, due botti coricate, botte a cerchi), tubi che nascono in punti a caso della lamiera e corrono dritti salendo a gomiti, valvole sulle punte, manometri e ruggine a caso.',
    xml: () =>
      programma({
        titolo: 'Cisterna a pressione',
        commento: 'Cisterna a pressione (Cantiere 8, orichalcum): serbatoio a caso; tubi, valvole, manometri e ruggine a caso.',
        colori: [
          ['T', '7a7570', 'lamiera'],
          ['I', '3a3633', 'ferro'],
          ['C', 'c4703a', 'tubi di rame'],
          ['R', 'a3322a', 'valvole'],
          ['G', 'f0e8c8', 'manometri', 'glow'],
          ['Z', '8a4a2a', 'ruggine'],
          ['S', '9a948a', 'basamento'],
        ],
        marcatori: 'ewsn',
        corpo: [
          box([25, 25, 0], [40, 40, 2], 'S'),
          ...scelta('serbatoio', [[25, 25, 2], [44, 44, 48]], [
            ['sfera su gambe', [ell([25, 25, 12], [30, 30, 30], 'T'), line([15, 15, 2], [18, 18, 20], 1.5, 'I'), line([35, 15, 2], [32, 18, 20], 1.5, 'I'), line([15, 35, 2], [18, 32, 20], 1.5, 'I'), line([35, 35, 2], [32, 32, 20], 1.5, 'I')]],
            ['cilindro alto', [cyl([25, 25, 2], [24, 24, 30], 'T'), ell([25, 25, 26], [24, 24, 14], 'T'), line([13, 25, 2], [13, 25, 32], 0.5, 'I')]],
            ['due botti coricate', [ell([25, 16, 6], [40, 14, 14], 'T'), ell([25, 34, 6], [40, 14, 14], 'T'), box([12, 25, 2], [4, 32, 6], 'I'), box([38, 25, 2], [4, 32, 6], 'I'), box([25, 25, 18], [4, 22, 2], 'I'), line([25, 25, 19], [25, 25, 32], 1, 'C')]],
            ['botte a cerchi', [cyl([25, 25, 2], [28, 28, 24], 'T'), cyl([25, 25, 7], [30, 30, 2], 'I'), cyl([25, 25, 17], [30, 30, 2], 'I'), cone([25, 25, 26], [28, 28, 8], 'T'), line([25, 25, 32], [25, 25, 38], 1, 'C')]],
          ]),
          nota('i tubi partono dalla lamiera e corrono dritti, salendo a gomiti'),
          ...rami('T', 7, 16, 'C', 0.12, 0.95),
          `<prl><rule in="e" out="R"/><rule in="w" out="R"/><rule in="s" out="R"/><rule in="n" out="R"/></prl>`,
          macchie('T', 'G', 0.012),
          macchie('T', 'Z', 0.08),
          `<prl in="ZT" out="*Z" p="0.3" steps="2"/>`,
        ],
      }),
  },
  {
    collezione: C,
    ambientazione: 'steampunk',
    nome: 'stazione-teleferica',
    titolo: 'Stazione della teleferica',
    classe: 'edificio',
    descrizione: 'La stazione a monte della teleferica di Orichalcum: la grande ruota delle funi, le funi che partono verso il pilone, una cabina appesa.',
    procedura: 'tre scelte a caso (il tetto: a falde, a cupola d\'ottone, piatto con l\'insegna; dove sta la cabina: in partenza, a metà, al pilone, in arrivo; il pilone: a traliccio, di pietra, a cavalletto) e fumo che sale a caso dal comignolo.',
    xml: () => {
      const fune = (y: number) => 19 + ((y - 14) * 15) / 35;
      const cabina = (y: number) => [line([18, y, fune(y)], [18, y, fune(y) - 6], 0.5, 'I'), box([18, y, fune(y) - 14], [8, 8, 8], 'R'), box([18, y + 4, fune(y) - 11], [5, 1, 3], 'V')];
      return programma({
        titolo: 'Stazione della teleferica',
        commento: 'Stazione della teleferica (Cantiere 8, orichalcum): tetto, cabina e pilone a caso; fumo a caso.',
        colori: [
          ['K', '8a4a35', 'mattoni'],
          ['I', '3a3633', 'ferro'],
          ['O', 'b88a2e', 'ottone'],
          ['R', 'a3322a', 'cabina rossa'],
          ['V', '8fc4d0', 'vetri'],
          ['S', '9a948a', 'pietra'],
          ['F', 'cfd3d6', 'fumo'],
        ],
        marcatori: 'P',
        corpo: [
          box([25, 9, 0], [40, 18, 16], 'K'),
          box([25, 9, 16], [42, 20, 1], 'I'),
          nota('la ruota delle funi'),
          cyl([25, 14, 17], [20, 20, 2], 'O'),
          cyl([25, 14, 17], [4, 4, 5], 'I'),
          line([18, 14, 19], [18, 49, 34], 0.5, 'I'),
          line([32, 14, 19], [32, 49, 34], 0.5, 'I'),
          ...scelta('tetto', [[25, 9, 17], [44, 20, 33]], [
            ['a falde', [...[0, 1, 2, 3, 4, 5].map((i) => box([25, 6, 22 + i * 2], [40, 12 - i * 2, 2], 'I')), line([25, 6, 22], [25, 6, 20], 2, 'I'), box([10, 6, 30], [3, 3, 6], 'K'), box([10, 6, 36], [1, 1, 1], 'P'), ...[13, 37].map((x) => line([x, 3, 17], [x, 3, 22], 1, 'I'))]],
            ['a cupola d\'ottone', [ell([25, 7, 17], [30, 14, 20], 'O'), cyl([25, 7, 36], [3, 3, 3], 'O'), box([12, 4, 26], [3, 3, 8], 'K'), box([12, 4, 34], [1, 1, 1], 'P')]],
            ['piatto con l\'insegna', [box([25, 4, 17], [36, 6, 4], 'K'), box([25, 3, 21], [30, 1, 8], 'O'), box([38, 4, 21], [3, 3, 8], 'K'), box([38, 4, 29], [1, 1, 1], 'P')]],
          ]),
          ...scelta('cabina', [[18, 30, 4], [14, 40, 34]], [
            ['in partenza', cabina(23)],
            ['a metà', cabina(31)],
            ['al pilone', cabina(39)],
            ['in arrivo', cabina(46)],
          ]),
          ...scelta('pilone', [[25, 44, 0], [24, 10, 36]], [
            ['a traliccio', [line([20, 44, 0], [24, 44, 30], 1, 'I'), line([30, 44, 0], [26, 44, 30], 1, 'I'), box([25, 44, 30], [18, 3, 2], 'I'), ...[8, 16, 24].map((z) => box([25, 44, z], [10 - z / 4, 2, 1], 'I'))]],
            ['di pietra', [box([25, 44, 0], [8, 6, 30], 'S'), box([25, 44, 30], [18, 4, 2], 'I')]],
            ['a cavalletto', [line([25, 40, 0], [25, 44, 30], 1.5, 'I'), line([25, 48, 0], [25, 44, 30], 1.5, 'I'), box([25, 44, 30], [18, 3, 2], 'I')]],
          ]),
          ...ramifica(12, 'P', 'F', { su: 3, obliquo: 2, biforca: 0.6 }),
          `<prl in="BF" out="*F" p="0.4" steps="1"/>`,
        ],
      });
    },
  },
  {
    collezione: C,
    ambientazione: 'steampunk',
    nome: 'faro-aeronautico',
    titolo: 'Faro aeronautico',
    classe: 'edificio',
    descrizione: 'Il faro che guida i dirigibili sopra Orichalcum: torre alta, lanterna a gas, fasci di luce e un braccio d\'ormeggio.',
    procedura: 'tre scelte a caso (la torre: traliccio, mattoni rastremati, tubo con i contrafforti; i fasci: due opposti, quattro a croce, uno lungo, tre; il braccio d\'ormeggio da uno dei quattro lati) e rivetti e fuliggine a caso.',
    xml: () => {
      const fascio = (a: number) => line([25, 25, 40], [25 + Math.cos(a) * 24, 25 + Math.sin(a) * 24, 41], 1, 'Y');
      const braccio = (dx: number, dy: number) => [line([25 + dx * 5, 25 + dy * 5, 32], [25 + dx * 22, 25 + dy * 22, 32], 1, 'I'), cone([25 + dx * 22, 25 + dy * 22, 28], [4, 4, 4], 'O'), line([25 + dx * 5, 25 + dy * 5, 38], [25 + dx * 18, 25 + dy * 18, 32], 0.5, 'I')];
      return programma({
        titolo: 'Faro aeronautico',
        commento: 'Faro aeronautico (Cantiere 8, orichalcum): torre, fasci e braccio d\'ormeggio a caso; rivetti e fuliggine a caso.',
        colori: [
          ['K', '8a4a35', 'mattoni'],
          ['I', '3a3633', 'ferro'],
          ['O', 'b88a2e', 'ottone'],
          ['L', 'ffe08a', 'lanterna', 'glow'],
          ['Y', 'fff2b0', 'fasci di luce', 'alpha 0.4'],
          ['N', '1e1c1a', 'fuliggine'],
          ['S', '9a948a', 'pietra'],
        ],
        corpo: [
          cyl([25, 25, 0], [22, 22, 3], 'S'),
          ...scelta('torre', [[25, 25, 3], [24, 24, 35]], [
            ['traliccio', [line([16, 16, 3], [22, 22, 36], 1, 'I'), line([34, 16, 3], [28, 22, 36], 1, 'I'), line([16, 34, 3], [22, 28, 36], 1, 'I'), line([34, 34, 3], [28, 28, 36], 1, 'I'), ...[10, 18, 26].map((z) => box([25, 25, z], [18 - z / 3, 18 - z / 3, 1], 'I')), cyl([25, 25, 3], [3, 3, 34], 'O')]],
            ['mattoni rastremati', [cone([25, 25, 3], [18, 18, 52], 'K'), box([25, 25, 34], [3, 3, 3], 'K')]],
            ['tubo con i contrafforti', [cyl([25, 25, 3], [10, 10, 34], 'I'), ...[0, 1, 2, 3].map((i) => line([25 + Math.cos(i * 1.57) * 11, 25 + Math.sin(i * 1.57) * 11, 3], [25 + Math.cos(i * 1.57) * 5, 25 + Math.sin(i * 1.57) * 5, 26], 1.5, 'I'))]],
          ]),
          cyl([25, 25, 36], [14, 14, 1], 'I'),
          cyl([25, 25, 37], [8, 8, 7], 'L'),
          cone([25, 25, 44], [12, 12, 6], 'O'),
          ...scelta('fasci', [[25, 25, 39], [50, 50, 4]], [
            ['due opposti', [fascio(0.4), fascio(0.4 + Math.PI)]],
            ['quattro a croce', [0, 1, 2, 3].map((i) => fascio(i * 1.57))],
            ['uno lungo', [fascio(2.2)]],
            ['tre', [0, 1, 2].map((i) => fascio(1 + i * 2.09))],
          ]),
          ...scelta('ormeggio', [[25, 25, 26], [50, 50, 14]], [
            ['a est', braccio(1, 0)],
            ['a ovest', braccio(-1, 0)],
            ['a nord', braccio(0, 1)],
            ['a sud', braccio(0, -1)],
          ]),
          macchie('I', 'O', 0.04),
          sopra('K', 'N', 0.15),
          sopra('I', 'N', 0.1),
        ],
      });
    },
  },
];
