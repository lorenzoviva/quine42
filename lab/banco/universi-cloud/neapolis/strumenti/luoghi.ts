// I 19 luoghi pianificati di Neapolis (maps/) e il registro delle persone (world/people.json).
// Ogni piano passa da validatePlan del validatore (ambiente noto, oggetti posizionabili, rune valide); gli individui
// stanno nei piani come oggetti e il registro li ritrova per origine (`cx,cy#o<indice>`, come applyPlan).
// npx vite-node lab/banco/universi-cloud/neapolis/strumenti/luoghi.ts
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { hashStr, hex } from '../../../../../src/kernel/rng';
import type { ChunkPlan, Where } from '../../../../../src/kernel/agents/cartography';
import { checkSociety } from '../../../../../src/kernel/npc/society';
import { PEOPLE, registry, type Person } from './persone';
import { bootNeapolis, DIR, universeFiles } from './universo';

interface Place {
  at: [number, number];
  nome: string;
  descrizione: string;
  ambiente: string;
  cose: Array<[string, Where]>;
  terra: string[];
  rune: string[];
  strutture?: string[];
}

export const PLACES: Place[] = [
  { at: [0, 0], nome: 'Piazza delle Erbe', ambiente: 'piazza', descrizione: 'La piazza del basolato con la fontana dei delfini, il Bar Gambrinus sotto i portici, l’edicola verde e la cabina del telefono: qui si incontra mezza città.',
    cose: [['obj.espresso', 'dentro'], ['obj.edicola', 'fuori'], ['obj.lampione', 'fuori'], ['obj.lampione', 'fuori'], ['obj.cabina-telefonica', 'fuori']], terra: ['Cornetto', 'Moneta da cento lire', 'Moneta da cento lire', 'Gettone telefonico'], rune: ['luce', 'caffe'] },
  { at: [0, -1], nome: 'Corso Partenope', ambiente: 'corso', descrizione: 'Il corso dei negozi, con le vetrine illuminate, il tram che sferraglia e, all’ultimo piano di un palazzo d’angolo, le antenne di Radio Ciok Ciok.',
    cose: [['obj.lampione', 'fuori'], ['obj.motorino', 'fuori'], ['obj.cassonetto', 'fuori'], ['obj.distributore', 'fuori']], terra: ['Biglietto del tram', 'Giornale del mattino', 'Moneta da cento lire'], rune: ['voce'] },
  { at: [1, -1], nome: 'Torre C del Centro Direzionale', ambiente: 'uffici', descrizione: 'La torre di vetro più alta del Centro Direzionale, mezza vuota: atrio di marmo, ascensori lenti, l’ufficio appalti al decimo piano.',
    cose: [['obj.scrivania', 'dentro'], ['obj.distributore', 'fuori'], ['obj.lampione', 'fuori']], terra: ['Pratica timbrata', 'Penna a sfera'], rune: ['nebbia'], strutture: ['torre di vetro'] },
  { at: [1, 0], nome: 'Piazzale degli Uffici', ambiente: 'uffici', descrizione: 'Il piazzale tra le torri, con il parcheggio dei taxi, le aiuole squadrate e i signori in giacca che parlano al telefono.',
    cose: [['obj.scrivania', 'dentro'], ['obj.motorino', 'fuori'], ['obj.cabina-telefonica', 'fuori']], terra: ['Gettone telefonico', 'Mappa della città'], rune: ['motore'] },
  { at: [2, 0], nome: 'Stazione Centrale', ambiente: 'stazione', descrizione: 'La stazione di cemento con la sala d’aspetto di marmo, il capolinea del tram 1, il piazzale dei taxi e l’officina dei tassisti sul retro.',
    cose: [['obj.distributore', 'fuori'], ['obj.banco-officina', 'dentro'], ['obj.cabina-telefonica', 'fuori'], ['obj.lampione', 'fuori']], terra: ['Orario dei tram', 'Pila', 'Biglietto del tram'], rune: ['sirena'] },
  { at: [2, 1], nome: 'Officine dei Granili', ambiente: 'officine', descrizione: 'Capannoni di mattoni sotto il cavalcavia: l’officina di Gennaro, la centralina elettrica del quartiere, piazzali pieni di motorini da riparare.',
    cose: [['obj.banco-officina', 'dentro'], ['obj.quadro-elettrico', 'fuori'], ['obj.motorino', 'fuori'], ['obj.cassonetto', 'fuori']], terra: ['Olio motore', 'Fusibile', 'Pezzo di ricambio'], rune: ['corrente'] },
  { at: [-1, 0], nome: 'Vico delle Lavandaie', ambiente: 'rione', descrizione: 'Il cuore del rione: vicoli coi panni stesi, i bassi con la porta aperta, la trattoria «Da Carmela» e l’edicola votiva all’angolo.',
    cose: [['obj.cucina-trattoria', 'dentro'], ['obj.lampione', 'fuori'], ['obj.cassonetto', 'fuori']], terra: ['Pomodori', 'Farina', 'Carne macinata'], rune: ['pane'] },
  { at: [-1, -1], nome: 'Pronto soccorso dei Pellegrini', ambiente: 'rione', descrizione: 'Il vecchio ospedale del rione, con il pronto soccorso sempre pieno, il cortile delle ambulanze e la cabina elettrica che ronza.',
    cose: [['obj.distributore', 'fuori'], ['obj.lampione', 'fuori'], ['obj.quadro-elettrico', 'fuori']], terra: ['Garza', 'Scatola di cerotti', 'Disinfettante'], rune: ['sutura'] },
  { at: [-1, 1], nome: 'Vico del Vesuvietto', ambiente: 'rione', descrizione: 'Un vicolo del rione a due passi dal cantiere, con la pizzeria «Il Vesuvietto», i motorini sul marciapiede e le sedie in strada la sera.',
    cose: [['obj.cucina-trattoria', 'dentro'], ['obj.motorino', 'fuori'], ['obj.lampione', 'fuori']], terra: ['Mozzarella', 'Schedina del lotto', 'Farina'], rune: [] },
  { at: [0, 1], nome: 'Vico del Molo', ambiente: 'rione', descrizione: 'Il vicolo in discesa che porta dal rione al mare, con le scale, i bassi dei pescatori e la cabina telefonica all’incrocio.',
    cose: [['obj.cabina-telefonica', 'fuori'], ['obj.cassonetto', 'fuori'], ['obj.lampione', 'fuori']], terra: ['Gettone telefonico', 'Moneta da cento lire'], rune: ['asfalto'] },
  { at: [1, 1], nome: 'Redazione del Mattino', ambiente: 'corso', descrizione: 'La redazione del giornale in un palazzo d’angolo del Corso: macchine da scrivere, telefoni che squillano, il chiosco dei giornali sotto.',
    cose: [['obj.edicola', 'fuori'], ['obj.scrivania', 'dentro'], ['obj.lampione', 'fuori']], terra: ['Taccuino', 'Rullino fotografico'], rune: [] },
  { at: [-2, 0], nome: 'Mercato del Pendino', ambiente: 'mercato', descrizione: 'Il mercato coperto di mattoni rossi, con i banchi del pesce e della frutta, le bancarelle all’aperto e l’edicola all’ingresso.',
    cose: [['obj.edicola', 'fuori'], ['obj.cassonetto', 'fuori'], ['obj.distributore', 'fuori']], terra: ['Limone', 'Cassetta di alici', 'Pomodori', 'Chicchi di caffè'], rune: ['tufo'], strutture: ['mercato coperto'] },
  { at: [-2, 1], nome: 'Cantiere della Linea 2', ambiente: 'cantiere', descrizione: 'Il cantiere eterno della metropolitana: recinzioni di rete, transenne a strisce, il grande scavo con le pompe e, in fondo, pietre di un molo antico.',
    cose: [['obj.transenna', 'fuori'], ['obj.transenna', 'fuori'], ['obj.transenna', 'fuori'], ['obj.quadro-elettrico', 'fuori']], terra: ['Gessetto', 'Mattone forato', 'Filo di rame', 'Cavo elettrico'], rune: ['lamiera'] },
  { at: [-1, 2], nome: 'Molo Vecchio', ambiente: 'porto', descrizione: 'Il molo dei pescatori: gozzi tirati a secco, reti stese, cassette di alici, gatti che aspettano. Il porto commerciale lo vuole per i container.',
    cose: [['obj.cassonetto', 'fuori'], ['obj.lampione', 'fuori']], terra: ['Cima da ormeggio', 'Cassetta di alici'], rune: ['marea'] },
  { at: [0, 2], nome: 'Lungomare delle Rondini', ambiente: 'lungomare', descrizione: 'La passeggiata sul golfo: la spiaggia di ciottoli, il chiosco delle granite di Tonino, le panchine, gli innamorati e i pescatori della domenica.',
    cose: [['obj.lampione', 'fuori'], ['obj.lampione', 'fuori'], ['obj.distributore', 'fuori'], ['obj.cabina-telefonica', 'fuori']], terra: ['Granita al limone', 'Cartolina del golfo'], rune: [] },
  { at: [1, 2], nome: 'Porto commerciale', ambiente: 'porto', descrizione: 'Le banchine del porto commerciale: gru, pile di container, i magazzini di mattoni numerati, il magazzino sette con il lucchetto nuovo.',
    cose: [['obj.quadro-elettrico', 'fuori'], ['obj.lampione', 'fuori'], ['obj.cassonetto', 'fuori']], terra: ['Chiave del magazzino', 'Caschetto giallo', 'Cima da ormeggio'], rune: ['fuoco'] },
  { at: [0, -2], nome: 'Ospedale del Colle', ambiente: 'collina', descrizione: 'L’ospedale tra i pini del Colle dei Gelsi, con il giardino dei convalescenti, le panchine e la vista sul golfo.',
    cose: [['obj.distributore', 'fuori'], ['obj.lampione', 'fuori']], terra: ['Caramella alla menta', 'Disinfettante'], rune: ['terra'] },
  { at: [-1, -2], nome: 'Belvedere dei Gelsi', ambiente: 'collina', descrizione: 'La terrazza di tufo sul colle, dove si vede tutta la città fino al porto; le ville coi giardini, il chiosco chiuso, la cabina del telefono.',
    cose: [['obj.lampione', 'fuori'], ['obj.cabina-telefonica', 'fuori']], terra: ['Cartolina del golfo', 'Limone'], rune: ['vento'] },
  { at: [1, -2], nome: 'Parco dei Platani', ambiente: 'parco', descrizione: 'Il giardino pubblico sul colle: viali di brecciolino, platani, la vasca dei pesci rossi, le panchine dei pensionati.',
    cose: [['obj.lampione', 'fuori'], ['obj.lampione', 'fuori'], ['obj.cassonetto', 'fuori']], terra: ['Limone', 'Bustina di figurine'], rune: [] },
];

const key = (at: [number, number]) => `${at[0]},${at[1]}`;

/** Il piano di un luogo: prima gli individui che ci stanno (nell'ordine del registro), poi le cose. */
function planOf(p: Place): { plan: ChunkPlan; npc: Map<string, number> } {
  const objects: ChunkPlan['objects'] = [];
  const npc = new Map<string, number>();
  for (const person of PEOPLE.filter((x) => key(x.at) === key(p.at))) {
    npc.set(person.nome, objects.length);
    objects.push({ module: person.tipo, where: 'fuori' });
  }
  for (const [module, where] of p.cose) objects.push({ module, where });
  return {
    plan: { place: { name: p.nome, description: p.descrizione }, layout: p.ambiente, objects, ground: p.terra, fresh: [], runes: p.rune, ...(p.strutture ? { structures: p.strutture.map((concetto) => ({ concept: concetto })) } : {}) },
    npc,
  };
}

const files = universeFiles();
const universe = JSON.parse(files['universe.json']);
const bible = JSON.parse(files['world/bible.json']);
/** Come `Kernel.recordKey`, e come lo scrive il server (`:` e `,` diventano `_`). */
export const mapFile = (cx: number, cy: number) => `${universe.name}:${universe.seed}:${hex(hashStr(bible.titolo ?? ''))}:${cx},${cy}`.replace(/[:,]/g, '_') + '.json';

const k = await bootNeapolis({ files });
const layouts = new Set(Object.keys((k as any).content.layouts));
const placeable = new Set(k.catalog().map((c) => c.id));
const origins = new Map<string, string>();
const placeNames = new Map<string, string>();
rmSync(`${DIR}/maps`, { recursive: true, force: true });
mkdirSync(`${DIR}/maps`, { recursive: true });
let problems = 0;
for (const p of PLACES) {
  const { plan, npc } = planOf(p);
  const v = k.validator.validatePlan(plan, layouts, placeable);
  if (v.errors.length || v.dropped.length) {
    problems++;
    console.log(`✗ ${key(p.at)} ${p.nome}: ${[...v.errors, ...v.dropped].join('; ')}`);
  }
  for (const [nome, i] of npc) origins.set(nome, `${key(p.at)}#o${i}`);
  placeNames.set(key(p.at), p.nome);
  writeFileSync(`${DIR}/maps/${mapFile(p.at[0], p.at[1])}`, JSON.stringify({ plan: v.plan }, null, 1) + '\n');
}
const people = registry((x: Person) => origins.get(x.nome)!, (x: Person) => placeNames.get(key(x.at))!);
const missing = PEOPLE.filter((x) => !origins.get(x.nome));
if (missing.length) throw new Error(`senza luogo: ${missing.map((x) => x.nome).join(', ')}`);
const society = checkSociety(people as never, (tipo) => (tipo === 'npc.gatto' ? 'animal' : 'person'));
if (society.length) {
  problems++;
  console.log(`✗ società: ${society.join('; ')}`);
}
writeFileSync(`${DIR}/world/people.json`, JSON.stringify(people, null, 2) + '\n');
console.log(`${readdirSync(`${DIR}/maps`).length} piani, ${people.persone.length} individui, ${problems} problemi`);
process.exit(problems ? 1 : 0);
