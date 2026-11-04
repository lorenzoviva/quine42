// The 24 structures of the catalogue (cantiere 1): 6 for each of the 4 settings, 12 with a cellar. Each is a `Scheda` for
// `struttura.ts`: its colours and what it adds to the skeleton. `genera.ts` writes them as programs.

import type { Colore } from './genera';
import type { Ambientazione, Scheda } from './struttura';

const c = (value: string, name: string, x: Partial<Colore> = {}): Colore => ({ value, name, ...x });

/** The materials of each setting, by role: slab, floor, wall low, wall high, roof, glass, frames, wood, step, stair, paving, foundation, barrels, door. */
const MATERIALI: Record<Ambientazione, Record<string, Colore>> = {
  fantasy: {
    S: c('b9ab8e', 'pietra squadrata'), F: c('8a5a32', 'assi di quercia'), C: c('9b9182', 'pietra grezza'), W: c('e8dcc0', 'intonaco a calce'),
    R: c('a4482c', 'coppi'), V: c('a9c8b8', 'vetro piombato', { alpha: 0.55 }), D: c('4a3220', 'travi scure'), L: c('6b4426', 'legno di castagno'),
    T: c('c8b896', 'gradino di pietra'), K: c('8d8170', 'pietra della scala'), A: c('857a68', 'acciottolato'), a: c('5f574c', 'fondazione'),
    x: c('6e4220', 'botti di rovere'), k: c('4b2e18', 'portone'),
  },
  steampunk: {
    S: c('7d3a2a', 'mattoni cotti'), F: c('5a4030', 'tavolato annerito'), C: c('8e3f2b', 'mattoni rossi'), W: c('a45a3e', 'mattoni chiari'),
    R: c('3c3f44', 'lamiera di ghisa'), V: c('c9b37a', 'vetro ambrato', { alpha: 0.55 }), D: c('2b2b2d', 'ghisa'), L: c('6a5236', 'legno oliato'),
    T: c('b08d57', 'gradino d’ottone'), K: c('4c4a48', 'ferro battuto'), A: c('4e4b47', 'basolato'), a: c('3e3330', 'fondazione'),
    x: c('7a5530', 'botti cerchiate'), k: c('3a2a1e', 'porta ferrata'),
    '8': c('c07a3a', 'rame'), '9': c('b5a642', 'ottone'), c: c('5a2a1e', 'mattoni della ciminiera'),
  },
  moderno: {
    S: c('d6d2c8', 'cemento chiaro'), F: c('a8743f', 'parquet'), C: c('b9b5ab', 'cemento grigio'), W: c('f0ece2', 'intonaco bianco'),
    R: c('8f8f88', 'ghiaia'), V: c('86b8c8', 'vetro', { alpha: 0.5 }), D: c('3a3d42', 'telaio d’alluminio'), L: c('7a5a3c', 'rovere'),
    T: c('e0d9c2', 'gradino'), K: c('c2c7cc', 'acciaio'), A: c('9a9590', 'lastricato'), a: c('6f6c66', 'fondazione'),
    x: c('7a4a24', 'scaffali del vino'), k: c('5a3a22', 'porta'),
  },
  futuristico: {
    S: c('e8edf2', 'lega bianca'), F: c('9aa7b4', 'pannelli del pavimento'), C: c('cfd6de', 'metallo bianco'), W: c('f4f7fa', 'composito'),
    R: c('5d6670', 'pannelli solari'), V: c('2c3e58', 'vetro scuro', { alpha: 0.6 }), D: c('1c2230', 'telaio nero'), L: c('46505c', 'polimero'),
    T: c('b8c4d0', 'gradino luminoso'), K: c('8894a0', 'titanio'), A: c('6e7884', 'pista'), a: c('4a525c', 'fondazione'),
    x: c('3a8fa0', 'serbatoi'), k: c('20283a', 'portello'),
    v: c('5ff0ff', 'neon ciano', { glow: true }), n: c('ff5fd2', 'faro magenta', { glow: true }),
  },
};

type Voce = Omit<Scheda, 'ambientazione' | 'colori'> & { colori?: Record<string, Colore> };

const VOCI: Record<Ambientazione, Voce[]> = {
  fantasy: [
    { nome: 'locanda-del-cinghiale', titolo: 'Locanda con la cantina', descrizione: 'Graticcio e pietra, tetto di coppi a padiglione, comignolo, insegna sopra la porta; la cantina delle botti sotto la sala.', cantina: true, tetto: 'falde', falde: 9, camini: { n: 1, alto: 9 }, insegna: true, lesene: 4 },
    { nome: 'tempio-della-luna', titolo: 'Tempio a gradoni', descrizione: 'Pietra chiara e oro, tetto a gradoni, lesene fitte sulle facciate, un campanile a punta su un angolo.', cantina: false, tetto: 'gradoni', falde: 5, lesene: 12, torri: { n: 1, alta: 70, cima: 'punta' }, colori: { R: c('d9c27a', 'gradoni dorati'), W: c('f2ead6', 'marmo'), q: c('c9a640', 'cuspide d’oro') } },
    { nome: 'torre-del-mago', titolo: 'Torre con il sotterraneo', descrizione: 'Due torri d’angolo con la lanterna accesa in cima, merli sulle mura, la cripta sotto.', cantina: true, merli: true, torri: { n: 2, alta: 72, cima: 'lanterna' }, colori: { n: c('b98cff', 'lume arcano', { glow: true }), R: c('6d6a66', 'lastre di pietra') } },
    { nome: 'fucina-nanica', titolo: 'Fucina con la cantina', descrizione: 'Pietra scura, tre camini alti, il deposito del minerale sotto la bottega.', cantina: true, tetto: 'falde', falde: 6, camini: { n: 3, alto: 14 }, colori: { R: c('4a4a52', 'lastre d’ardesia'), c: c('3a3230', 'pietra del camino') } },
    { nome: 'casa-del-borgomastro', titolo: 'Residenza a due piani', descrizione: 'Casa alta con balconi di legno al piano di sopra, tetto di coppi, molte finestre.', cantina: false, tetto: 'falde', falde: 10, balconi: 4, alte: 0.4, colori: { '4': c('5a3a22', 'ringhiera di legno'), '5': c('8a5a32', 'balcone di legno') } },
    { nome: 'forte-di-frontiera', titolo: 'Forte con le torri', descrizione: 'Mura merlate, quattro torri piatte agli angoli, il portone sul davanti.', cantina: false, merli: true, torri: { n: 4, alta: 66, cima: 'piatta' }, lesene: 8, colori: { R: c('7a756c', 'cammino di ronda'), q: c('5c5852', 'piattaforma della torre') } },
  ],
  steampunk: [
    { nome: 'taverna-delle-caldaie', titolo: 'Taverna con la cantina', descrizione: 'Mattoni e rame, tubi lungo i muri, un comignolo che fuma, l’insegna d’ottone; le botti nella cantina.', cantina: true, tubi: 4, camini: { n: 1, alto: 10 }, insegna: true },
    { nome: 'cattedrale-degli-ingranaggi', titolo: 'Cattedrale a gradoni', descrizione: 'Mattoni rossi, tetto a gradoni di ghisa, lesene, una guglia d’ottone, tubi d’organo sulle facciate.', cantina: false, tetto: 'gradoni', falde: 6, lesene: 10, tubi: 6, torri: { n: 1, alta: 72, cima: 'punta' }, colori: { q: c('b5a642', 'guglia d’ottone') } },
    { nome: 'faro-a-vapore', titolo: 'Faro con il sotterraneo', descrizione: 'Due torri di mattoni con la lanterna accesa, tubi di rame, la sala delle pompe sotto.', cantina: true, tubi: 3, torri: { n: 2, alta: 72, cima: 'lanterna' }, colori: { '6': c('7d3a2a', 'mattoni del faro') } },
    { nome: 'officina-meccanica', titolo: 'Officina con la cantina', descrizione: 'Capannone con tre ciminiere altissime, tubi di rame e ottone, il deposito del carbone sotto.', cantina: true, camini: { n: 3, alto: 15 }, tubi: 8, tetto: 'falde', falde: 5 },
    { nome: 'palazzina-degli-inventori', titolo: 'Palazzina a due piani', descrizione: 'Mattoni chiari, balconi di ferro, tubi sulle facciate, comignoli.', cantina: false, balconi: 4, tubi: 4, alte: 0.4, tetto: 'gradoni', falde: 2, camini: { n: 2, alto: 8 }, colori: { '4': c('2b2b2d', 'ringhiera di ghisa') } },
    { nome: 'stazione-ferroviaria', titolo: 'Stazione coperta', descrizione: 'Grande tetto di lamiera a padiglione, la torre dell’orologio, ciminiere e tubi.', cantina: false, tetto: 'falde', falde: 8, torri: { n: 1, alta: 72, cima: 'lanterna' }, tubi: 4, camini: { n: 2, alto: 12 }, colori: { n: c('fff2c0', 'quadrante dell’orologio', { glow: true }), '6': c('8e3f2b', 'mattoni della torre') } },
  ],
  moderno: [
    { nome: 'trattoria-con-cantina', titolo: 'Trattoria con la cantina dei vini', descrizione: 'Intonaco bianco e legno, tetto a padiglione basso, l’insegna sopra la porta, la cantina dei vini sotto.', cantina: true, tetto: 'falde', falde: 5, insegna: true, colori: { R: c('8a4a36', 'tegole') } },
    { nome: 'chiesa-moderna', titolo: 'Chiesa a gradoni', descrizione: 'Cemento bianco, tetto a gradoni, lesene, il campanile a punta.', cantina: false, tetto: 'gradoni', falde: 4, lesene: 10, torri: { n: 1, alta: 72, cima: 'punta' }, colori: { q: c('d6d2c8', 'cuspide di cemento') } },
    { nome: 'osservatorio-civico', titolo: 'Osservatorio con il sotterraneo', descrizione: 'Due torri bianche con le cupole di vetro illuminate, l’archivio sotto.', cantina: true, torri: { n: 2, alta: 72, cima: 'lanterna' }, colori: { '6': c('e6e2d8', 'cemento della torre'), n: c('9fd4ff', 'cupola illuminata', { glow: true }) } },
    { nome: 'laboratorio-artigiano', titolo: 'Laboratorio con la cantina', descrizione: 'Capannone con due camini d’acciaio, tubi sulle facciate, il magazzino sotto.', cantina: true, camini: { n: 2, alto: 12 }, tubi: 3, colori: { c: c('9aa0a6', 'camino d’acciaio'), '8': c('9aa0a6', 'tubi d’acciaio') } },
    { nome: 'condominio', titolo: 'Condominio a due piani', descrizione: 'Volumi squadrati, balconi con le ringhiere, tetto piano a terrazza.', cantina: false, balconi: 5, alte: 0.5, basse: 3, tetto: 'gradoni', falde: 2, camini: { n: 2, alto: 6 } },
    { nome: 'mercato-coperto', titolo: 'Mercato coperto', descrizione: 'Un grande tetto a padiglione su campate basse, lesene, la torre dell’orologio.', cantina: false, tetto: 'falde', falde: 10, basse: 3, alte: 0, lesene: 8, torri: { n: 1, alta: 66, cima: 'piatta' }, colori: { R: c('6f7c5a', 'lamiera verde') } },
  ],
  futuristico: [
    { nome: 'bar-orbitale', titolo: 'Bar con la cantina', descrizione: 'Metallo bianco e vetro scuro, fasce al neon, l’insegna luminosa, i serbatoi nella cantina.', cantina: true, neon: true, insegna: true, colori: { '7': c('ff5fd2', 'insegna al neon', { glow: true }), '9': c('5ff0ff', 'insegna al neon ciano', { glow: true }) } },
    { nome: 'santuario-quantico', titolo: 'Santuario a gradoni', descrizione: 'Gradoni di pannelli, fasce al neon, lesene, una guglia luminosa.', cantina: false, tetto: 'gradoni', falde: 5, neon: true, lesene: 10, torri: { n: 1, alta: 72, cima: 'punta' }, colori: { q: c('5ff0ff', 'guglia luminosa', { glow: true }) } },
    { nome: 'faro-al-plasma', titolo: 'Faro con il sotterraneo', descrizione: 'Due torri bianche con il faro al plasma in cima, fasce al neon, il reattore sotto.', cantina: true, neon: true, torri: { n: 2, alta: 72, cima: 'lanterna' }, colori: { '6': c('e8edf2', 'lega della torre') } },
    { nome: 'laboratorio-di-fusione', titolo: 'Laboratorio con la cantina', descrizione: 'Moduli bianchi, tre camini di scarico, condotti sulle facciate, la camera di contenimento sotto.', cantina: true, neon: true, camini: { n: 3, alto: 12 }, tubi: 5, colori: { c: c('8894a0', 'scarico di titanio'), '8': c('3a8fa0', 'condotti') } },
    { nome: 'residenza-modulare', titolo: 'Residenza a due piani', descrizione: 'Moduli con balconi sospesi, fasce al neon, tetto di pannelli solari.', cantina: false, balconi: 5, neon: true, alte: 0.5, tetto: 'gradoni', falde: 2, colori: { '4': c('5ff0ff', 'parapetto luminoso', { glow: true }), '5': c('cfd6de', 'balcone sospeso') } },
    { nome: 'stazione-di-transito', titolo: 'Stazione coperta', descrizione: 'Tetto a padiglione di pannelli, quattro piloni d’angolo con i fari, fasce al neon.', cantina: false, tetto: 'falde', falde: 7, neon: true, torri: { n: 4, alta: 64, cima: 'lanterna' }, colori: { '6': c('cfd6de', 'piloni') } },
  ],
};

export const CATALOGO: Scheda[] = (Object.keys(VOCI) as Ambientazione[]).flatMap((amb) =>
  VOCI[amb].map((v) => ({ ...v, ambientazione: amb, colori: { ...MATERIALI[amb], ...(v.colori ?? {}) } })),
);
