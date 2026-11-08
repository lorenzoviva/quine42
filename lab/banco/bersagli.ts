// The buildings of the bench (T154): different in style and in how they are organised, so that a prompt does not pass by knowing one of them.

import type { Bersaglio } from './misure';
import { scatolaDi } from './misure';

export const BERSAGLI: Bersaglio[] = [
  {
    id: 'moderna',
    nome: 'Villa moderna',
    stile: 'moderno, cemento chiaro, legno e grandi vetrate',
    descrizione: 'Volumi squadrati sfalsati, tetto piano con una terrazza su cui si sale, una parete di vetro su un lato, soggiorno e cucina al piano terra, camere sopra, una scala a vista, pensilina sopra la porta.',
    classe: 'structure',
  },
  {
    id: 'steampunk',
    nome: 'Officina a vapore',
    stile: 'steampunk: mattoni, rame, ottone, ghisa, vapore',
    descrizione: 'Capannone di mattoni con grandi tubi di rame lungo i muri, una caldaia e due ciminiere, ingranaggi di ottone in facciata, finestre ad arco con grate; dentro la sala macchine, un deposito, un ballatoio di ferro al piano sopra con l’ufficio del capofficina.',
    classe: 'structure',
  },
  {
    id: 'futuristica',
    nome: 'Torre futuristica',
    stile: 'futuristico: metallo bianco, vetro scuro, luci al neon',
    descrizione: 'Torre con anelli sporgenti e fasce di neon, ingresso con un portale luminoso, sala d’accoglienza e laboratorio al piano terra, una rampa che gira attorno a un nucleo centrale, una sala di comando in alto con le vetrate, una piattaforma esterna.',
    classe: 'structure',
  },
  {
    id: 'locanda',
    nome: 'Locanda con la cantina',
    stile: 'medievale: graticcio, pietra, coppi',
    descrizione: 'Sala comune con il camino e il bancone, cucina sul retro, una scala che scende in cantina tra le botti e una che sale alle stanze degli ospiti; insegna sopra la porta, comignolo acceso, un balcone di legno.',
    classe: 'structure',
    sotto: 1,
  },
  {
    id: 'tempio',
    nome: 'Tempio a gradoni',
    stile: 'antico: pietra chiara, oro, colonne',
    descrizione: 'Piramide a terrazze con una scalinata larga sul davanti, colonne lungo il primo livello, un vestibolo, una sala delle offerte e due celle laterali, una cella più in alto raggiunta da una scala interna, statue e bracieri accesi.',
    classe: 'structure',
  },
  {
    id: 'rocca',
    nome: 'Rocca di frontiera',
    stile: 'fortezza: pietra grigia, merli, legno scuro',
    descrizione: 'Mura con il cammino di ronda e quattro torri, portone sul davanti, cortile interno con un pozzo, corpo di guardia e armeria, una scala sulle mura, il mastio con una sala in alto. È grande e rara.',
    classe: 'structure',
    taglia: 'huge',
  },
  {
    id: 'pagoda',
    nome: 'Pagoda sul giardino',
    stile: 'estremo oriente: legno rosso, tetti curvi verdi, carta',
    descrizione: 'Tre tetti sporgenti uno sopra l’altro con le punte rialzate, ballatoi attorno a ogni piano, pannelli di carta illuminati, una sala al piano terra divisa da pareti scorrevoli, una scala interna, lanterne appese.',
    classe: 'structure',
  },
  // T337: the buildings the author found «all the same» (07/11): the fort is `rocca`, the temple `tempio`.
  {
    id: 'castello',
    nome: 'Castello del signore',
    stile: 'castello medievale: pietra chiara, tetti conici d’ardesia, stendardi',
    descrizione: 'Un mastio alto con la sala grande e le stanze del signore, torri rotonde o quadrate con i tetti a cono, una cinta più bassa con il portone, un cortile d’onore, una cappella addossata alle mura, finestre a bifora sul mastio. Più alto e più elegante di un forte, con la sagoma che si vede da lontano.',
    classe: 'structure',
    taglia: 'huge',
  },
  {
    id: 'palazzina',
    nome: 'Palazzina di città',
    stile: 'Novecento: intonaco color sabbia, cornici bianche, persiane verdi, balconi in ferro',
    descrizione: 'Tre piani con il tetto piano e il parapetto, il portone al centro con la pensilina, l’atrio e la scala, due appartamenti per piano, balconi sul davanti, finestre regolari sui quattro lati, un piccolo cortile sul retro.',
    classe: 'structure',
  },
  {
    id: 'villetta',
    nome: 'Villetta con giardino',
    stile: 'casa di campagna: intonaco bianco, tetto a falde di coppi rossi, legno',
    descrizione: 'Un corpo a due piani e un’ala bassa, tetti a falde, un portico sul davanti, soggiorno e cucina al piano terra, camere sopra, un comignolo, un giardino con un vialetto e una siepe.',
    classe: 'structure',
  },
];

export const bersaglio = (id: string) => BERSAGLI.find((b) => b.id === id);

/** What the model gets besides the prompt: the building and the numbers of its box. */
export function testoBersaglio(b: Bersaglio): string {
  const s = scatolaDi(b);
  const [X, Y, Z] = s.box;
  return [
    `Edificio: ${b.nome}`,
    `Stile: ${b.stile}`,
    `Com'è: ${b.descrizione}`,
    `Scatola: ${X} × ${Y} × ${Z} voxel; una casella è ${s.vpt} voxel.`,
    `Corpo: gradino ${s.gradino} voxel, passaggio largo almeno ${s.corpo}, persona alta ${s.persona}; salto: sale al più ${Math.floor(1.05 * s.vpt)}, va da ${s.vpt} a ${Math.floor(2.6 * s.vpt)} voxel di distanza.`,
    s.base ? `C'è una cantina: il suolo, la lettera dell'attributo suolo, sta ${s.base} voxel sopra il fondo in questa scatola e a un'altra quota in un'altra taglia; ci si scende con una scala e fuori dalla cantina sotto il suolo non si scrive nulla.` : 'Il suolo è in fondo alla scatola.',
  ].join('\n');
}
