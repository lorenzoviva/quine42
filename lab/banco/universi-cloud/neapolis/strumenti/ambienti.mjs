// Gli ambienti di Neapolis (world.layouts): programmi di riscrittura sulla bozza della città.
// node lab/banco/universi-cloud/neapolis/strumenti/ambienti.mjs
import { writeFileSync } from 'node:fs';
const seq = (...children) => ({ type: 'sequence', children });
const one = (rules, steps) => ({ type: 'one', rules, ...(steps ? { steps } : {}) });
const all = (rules, steps) => ({ type: 'all', rules, ...(steps ? { steps } : {}) });
const prl = (rules) => ({ type: 'prl', rules });
const r = (i, o, p) => ({ in: i, out: o, ...(p !== undefined ? { p } : {}) });
const path = (on, steps = 3) => ({ type: 'path', from: 'd', to: 'p', on, color: 'p', steps });
const G = '[gpmen]';
const box = (w, h) => Array.from({ length: h }, () => G.repeat(w)).join('/');
// Un edificio w×h con muri W, pavimento F e la porta sul lato basso (riga h-1) alla colonna dc.
const casa = (w, h, W = 'h', F = 'f', dc = 1) =>
  Array.from({ length: h }, (_, y) => (y === 0 ? W.repeat(w) : y === h - 1 ? W.repeat(dc) + 'd' + W.repeat(w - dc - 1) : W + F.repeat(w - 2) + W)).join('/');
const lottoAperto = (w, h, c) => Array.from({ length: h }, () => c.repeat(w)).join('/');

const layouts = {
  piazza: {
    name: 'Piazza', description: 'una piazza di basolato con la fontana al centro, aiuole, panchine e palazzi con il bar sotto i portici', environment: 'esterno',
    program: seq(
      prl([r('t', 'g', 0.7)]),
      one([r(box(4, 4), 'gwwg/wwww/wwww/gwwg')], 1),
      one([r(box(6, 5), casa(6, 5, 'h', 'f', 2))], 2),
      one([r(box(3, 2), lottoAperto(3, 2, 'm'))], 3),
      path('gme'),
    ),
  },
  rione: {
    name: 'Rione', description: 'vicoli stretti tra palazzine di tufo con i panni stesi, bassi con la porta sulla strada, un cortile con la siepe', environment: 'misto',
    program: seq(
      prl([r('t', 'g', 0.8)]),
      one([r(box(5, 5), casa(5, 5, 'h', 'f', 2)), r(box(6, 5), casa(6, 5, 'h', 'f', 1))], 4),
      one([r(box(4, 4), casa(4, 4, 'q', 'f', 1))], 1),
      one([r('ggg', 'jjj')], 2),
      path('gme'),
    ),
  },
  corso: {
    name: 'Corso', description: 'un corso alberato di negozi e vetrine, con le aiuole spartitraffico e la fermata del tram', environment: 'misto',
    program: seq(
      one([r(box(7, 5), casa(7, 5, 'h', 'l', 3))], 2),
      one([r(box(5, 4), casa(5, 4, 'h', 'f', 2))], 1),
      one([r('ggggg', 'mtmtm')], 2),
      one([r('gggggg', 'aaaaaa')], 1),
      path('gmea'),
    ),
  },
  uffici: {
    name: 'Centro direzionale', description: 'torri di vetro e cemento con l’atrio di marmo, piazzali, parcheggi e aiuole squadrate', environment: 'misto',
    program: seq(
      prl([r('t', 'm', 0.6)]),
      one([r(box(8, 7), casa(8, 7, 'b', 'l', 3))], 1),
      one([r(box(6, 5), casa(6, 5, 'b', 'l', 2))], 1),
      one([r(box(4, 3), lottoAperto(4, 3, 'e'))], 2),
      one([r('gg/gg', 'mm/mm')], 2),
      path('gme'),
    ),
  },
  mercato: {
    name: 'Mercato', description: 'il mercato coperto di mattoni con i banchi del pesce e della frutta, e le bancarelle all’aperto attorno', environment: 'misto',
    program: seq(
      prl([r('t', 'g', 0.9)]),
      one([r(box(9, 6), 'qqqqqqqqq/qlllllllq/qlllllllq/qlllllllq/qlllllllq/qqdqqqdqq')], 1),
      one([r(box(4, 4), casa(4, 4, 'h', 'f', 1))], 2),
      one([r('ggg', 'cgc')], 2),
      path('gme'),
    ),
  },
  stazione: {
    name: 'Stazione', description: 'la grande stazione di cemento con la sala d’aspetto di marmo, i binari del tram e il piazzale dei taxi', environment: 'misto',
    program: seq(
      prl([r('t', 'g', 0.8)]),
      one([r(box(10, 6), 'bbbbbbbbbb/bllllllllb/bllllllllb/bllllllllb/bllllllllb/bbbdbbdbbb')], 1),
      one([r('gggggggg', 'aaaaaaaa')], 2),
      one([r(box(4, 3), lottoAperto(4, 3, 'e'))], 1),
      path('gmea'),
    ),
  },
  cantiere: {
    name: 'Cantiere', description: 'il cantiere della metropolitana: recinzioni di rete, brecciolino, cumuli di macerie, la baracca degli operai', environment: 'esterno',
    program: seq(
      prl([r('g', 'n', 0.35)]),
      one([r(box(7, 5), 'ccccccc/cnnnnnc/cnnrnnc/cnnnnnc/cccnccc')], 1),
      one([r(box(4, 4), casa(4, 4, 'b', 'f', 1))], 1),
      one([r('[gn][gn]', 'rr')], 2),
      path('gmen'),
    ),
  },
  lungomare: {
    name: 'Lungomare', description: 'la passeggiata sul mare: spiaggia di ciottoli, la banchina, palme e chioschi, gli scogli del frangiflutti', environment: 'esterno',
    program: seq(
      all([r('s/w', 'z/*')]),
      prl([r('t', 'm', 0.5)]),
      one([r(box(4, 4), casa(4, 4, 'h', 'f', 1))], 2),
      one([r('ggg', 'mtm')], 3),
      path('gmesz'),
    ),
  },
  porto: {
    name: 'Porto', description: 'le banchine del porto con i magazzini di mattoni, le pile di container, le bitte e i pontili dei pescherecci', environment: 'misto',
    program: seq(
      all([r('s', 'z')]),
      one([r('z/w/w', 'z/z/z')], 6),
      prl([r('t', 'g', 1)]),
      one([r(box(7, 5), casa(7, 5, 'q', 'f', 3))], 2),
      one([r('gg/gg', 'xx/xx')], 3),
      path('gmez'),
    ),
  },
  officine: {
    name: 'Officine', description: 'capannoni di mattoni e officine meccaniche, piazzali di cemento, recinzioni e la cabina elettrica', environment: 'misto',
    program: seq(
      prl([r('t', 'g', 0.8)]),
      one([r(box(7, 6), casa(7, 6, 'q', 'f', 3))], 2),
      one([r(box(4, 3), lottoAperto(4, 3, 'e'))], 2),
      one([r('gggg', 'cccc')], 2),
      path('gme'),
    ),
  },
  collina: {
    name: 'Collina', description: 'il colle di tufo con i pini, le ville con il giardino, i viali di brecciolino e il belvedere sul golfo', environment: 'esterno',
    program: seq(
      one([r(box(5, 5), casa(5, 5, 'h', 'f', 2))], 2),
      one([r('ggg/ggg', 'jjj/mmm')], 2),
      prl([r('g', 'n', 0.12)]),
      path('gmen'),
    ),
  },
  parco: {
    name: 'Parco', description: 'un giardino pubblico di platani e aiuole, con la vasca dei pesci rossi, le siepi e i viali di brecciolino', environment: 'esterno',
    program: seq(
      prl([r('g', 'm', 0.5)]),
      one([r(box(3, 3), 'mwm/www/mwm')], 1),
      one([r('mmm', 'jjj')], 2),
      one([r('[gm][gm][gm]', 'ntn')], 3),
      one([r(box(4, 4), casa(4, 4, 'h', 'f', 1))], 1),
      path('gmen'),
    ),
  },
};
const m = { id: 'world.layouts', name: 'Ambienti di Neapolis', kind: 'data', version: '0.1.0', description: 'Gli ambienti della città: dalla bozza fanno piazze, rioni, corsi, uffici, mercati, la stazione, il cantiere, il lungomare, il porto, le officine, il colle e i parchi.', layouts };
writeFileSync('lab/banco/universi-cloud/neapolis/modules/world.layouts/manifest.json', JSON.stringify(m, null, 2) + '\n');
console.log(Object.keys(layouts).join(' '));
