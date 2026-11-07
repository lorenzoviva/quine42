// Group 3 of the Jev bench (T313): the choices of the lives of the people, today rules of the kernel (or not made at all), as cases
// from real universes. The trades of valmora (the people the Narrator individuated with Gemini) against the seed's work programs, where
// `matchJob` finds none for most; the crossroads, the destinations of a phase, the team and the next step of a venture, on the people and
// places of neapolis (lab/banco/universi-cloud/neapolis). Every case says what the kernel does today (`rule`): the floor if the answer is
// missing. The right answers are of whoever wrote the bench, said in the file: they are judgements, to be read again by the author.

import fs from 'node:fs';
import path from 'node:path';
import { matchJob, type JobProgram } from '../../../src/kernel/npc/jobs';
import { hashStr } from '../../../src/kernel/rng';
import { internalJobProgram, internalModuleId } from '../../../src/kernel/internalNames';
import type { CaseSpec, Question } from './banco';
import { ROOT } from './domande';

const read = (p: string) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const NEAPOLIS = 'lab/banco/universi-cloud/neapolis';

/**
 * The work programs a universe has: the seed's, and its own over them (the same module id wins). The modules of the contract 0.3 are
 * `job.*`; a universe of before (`lavoro.*`, neapolis) is read with the names of today (ADR-0158).
 */
export function programsOf(dir?: string): JobProgram[] {
  const mods = new Map<string, string>();
  const isJob = (m: string) => m.startsWith('job.') || m.startsWith('lavoro.');
  for (const m of fs.readdirSync(path.join(ROOT, 'universe/modules')).filter(isJob)) mods.set(internalModuleId(m), `universe/modules/${m}/manifest.json`);
  if (dir) for (const m of fs.readdirSync(path.join(ROOT, dir, 'modules')).filter(isJob)) mods.set(internalModuleId(m), `${dir}/modules/${m}/manifest.json`);
  return [...mods.values()].flatMap((p) => ((read(p).mestieri ?? []) as unknown[]).map((j) => internalJobProgram(j) as JobProgram));
}

// ------------------------------------------------------------------------------------------------ trades → programs

/**
 * The trades of valmora (universes/valmora/world/people.json, individuated by Gemini; the universe is outside the repository, its trades are
 * copied here) with the seed's programs that could make that person work: the nearest in what one does all day, `nessuno` where none is.
 */
const VALMORA_TRADES: Array<[string, string[]]> = [
  ['Cacciatore di topi', ['nessuno']],
  ['Bottaio', ['smith', 'woodcutter']],
  ['tessitrice', ['merchant', 'nessuno']],
  ['fornaio', ['cook']],
  ['Cartografo itinerante', ['scribe']],
  ['Ortolana', ['farmer']],
  ['Pittore', ['scribe', 'nessuno']],
  ['Giardiniere', ['farmer']],
  ['Erborista', ['farmer', 'merchant']],
  ['Cartografo', ['scribe']],
  ['Eremita e osservatore delle rune', ['priest']],
  ['Mercante di Erbe', ['merchant']],
  ['Pescatore di stagni', ['fisher']],
  ['Pescatore di Nebbia', ['fisher']],
  ['Mugnaio', ['cook', 'farmer']],
  ['Raccoglitore di erbe', ['farmer']],
  ['Cantore dei Raccolti', ['farmer', 'nessuno']],
  ['Pittrice itinerante', ['scribe', 'nessuno']],
  ['Cantastorie di Confine', ['innkeeper', 'nessuno']],
  ['Eremita', ['priest']],
  ['Narratore di Leggende', ['innkeeper', 'scribe', 'nessuno']],
  ['Maniscalco di Legno', ['smith']],
  ['contadina', ['farmer']],
  ['Riparatore di reti', ['fisher']],
  ['Raccoglitore di Pietre di Fiume', ['nessuno', 'woodcutter']],
  ['Cercatore di Sorgenti', ['nessuno', 'farmer']],
  ['Raccoglitore di resina', ['woodcutter']],
  ['Guardiano dei Ponti di Pietra', ['guard']],
  ['Tagliapietre', ['smith', 'woodcutter']],
  // Trades a Narrator writes often for a medieval world (the mock's own, the archetypes of the seed), none of them in the programs by name.
  ['Falegname', ['woodcutter', 'smith']],
  ['Levatrice', ['priest', 'nessuno']],
  ['Guaritrice', ['priest', 'farmer']],
  ['Ciabattino', ['smith', 'merchant']],
  ['Lavandaia', ['nessuno', 'innkeeper']],
  ['Speziale', ['merchant']],
  ['Taglialegna del bosco grande', ['woodcutter']],
  ['Locandiera della Piana', ['innkeeper']],
  ['Sentinella delle mura', ['guard']],
];

function tradeCases(): CaseSpec[] {
  const programs = programsOf();
  const options = programs.map((p) => ({ id: p.id, nomi: p.names }));
  return VALMORA_TRADES.map(([trade, right], i) => ({
    id: `mestiere/${trade.toLowerCase().replace(/[^a-zàèéìòù]+/g, '-')}`,
    group: 'vita',
    kind: 'mestiere',
    source: i < 29 ? 'universes/valmora/world/people.json (mestieri individuati da Gemini)' : 'banco (mestieri da Narratore, per il seme)',
    state: { trade, programs: options },
    expected: { program: right },
    rule: { program: matchJob(trade, programs)?.id ?? 'nessuno' },
  }));
}

// ------------------------------------------------------------------------------------------------ the people of neapolis

interface Person {
  nome: string;
  mestiere: string;
  eta?: string;
  luogo: string;
  persona: string;
  famiglia: Array<{ nome: string; legame: string }>;
  routine: Array<{ quando: string; fa: string; dove: string }>;
}

const people = (): Map<string, Person> => new Map((read(`${NEAPOLIS}/world/people.json`).persone as Person[]).map((p) => [p.nome, p]));

/** What the state says of a person: who they are in two sentences, their bonds in words, their day. */
function personState(p: Person) {
  const sentences = p.persona.replace(/Delle rune sai[^]*$/, '').split(/(?<=\.)\s+/).slice(0, 3).join(' ');
  return {
    name: p.nome,
    trade: p.mestiere,
    ...(p.eta ? { age: p.eta } : {}),
    lives_in: p.luogo,
    character: sentences,
    bonds: p.famiglia.map((f) => `è ${f.legame} di ${f.nome}`),
    routine: Object.fromEntries(p.routine.map((r) => [r.quando, `${r.dove}: ${r.fa}`])),
  };
}

// ------------------------------------------------------------------------------------------------ crossroads

interface Crossroad {
  id: string;
  who: string;
  moment: string;
  task: string;
  situation: string;
  nearby?: string[];
  options: string[];
  right: string[];
  why: string;
}

const CROSSROADS_CASES: Crossroad[] = [
  { id: 'assunta-chicchi', who: 'Assunta Cimmino', moment: 'mattina', task: 'fa i caffè della prima ora', situation: 'manca: Chicchi di caffè (il deposito del bar è vuoto)', nearby: ['Filomena Caputo, all’edicola a dieci passi'], options: ['compra', 'chiedi:vicino', 'aspetta', 'rinuncia', 'va_a_casa'], right: ['compra', 'chiedi:vicino'], why: 'non ha mai saltato un’apertura' },
  { id: 'gaetano-mozzarella', who: 'Gaetano Cozzolino', moment: 'giorno', task: 'vende le pizze a portafoglio', situation: 'manca: Mozzarella', nearby: ['Assunta Cimmino, al bar di fronte'], options: ['compra', 'chiedi:vicino', 'aspetta', 'rinuncia'], right: ['compra'], why: 'l’unica vicina è la sua rivale' },
  { id: 'gaetano-domenica', who: 'Gaetano Cozzolino', moment: 'mattina', task: 'impasta la pasta della pizza', situation: 'manca: Farina; è domenica e il mercato è chiuso', nearby: ['Aniello Russo, il vicino di casa'], options: ['compra', 'chiedi:vicino', 'aspetta', 'rinuncia'], right: ['chiedi:vicino'], why: 'di domenica non si compra; il vicino è un amico' },
  { id: 'carmela-affamato', who: 'Carmela Esposito', moment: 'giorno', task: 'cucina in trattoria', situation: 'chiesto: un ragazzino senza soldi chiede un piatto di pasta', options: ['aiuta', 'ignora', 'chiedi:vicino'], right: ['aiuta'], why: 'sfama chiunque passi' },
  { id: 'franco-cantiere', who: 'Franco Barone', moment: 'mattina', task: 'dirige il traffico davanti al cantiere', situation: 'chiesto: il viandante gli chiede di lasciarlo entrare nel cantiere della Linea 2, chiuso al pubblico', options: ['aiuta', 'ignora', 'chiedi:vicino'], right: ['ignora'], why: 'rigido, ligio: l’ordine è tutto' },
  { id: 'carla-ferito', who: 'Carla Ferrante', moment: 'notte', task: 'lavora al pronto soccorso', situation: 'chiesto: il viandante entra portando un uomo ferito alla testa', options: ['aiuta', 'ignora', 'va_a_casa'], right: ['aiuta'], why: 'è il suo turno, ed è il suo lavoro' },
  { id: 'salvatore-banchine', who: 'Salvatore Iovine', moment: 'giorno', task: 'manovra la gru dei container', situation: 'chiesto: un funzionario del porto commerciale gli chiede di firmare la cessione delle banchine dei pescatori', options: ['aiuta', 'ignora', 'chiedi:vicino'], right: ['ignora'], why: 'ha già detto di no: non firma' },
  { id: 'pasquale-burrasca', who: 'Pasquale Amato', moment: 'mattina', task: 'esce in barca a pescare all’alba', situation: 'pioggia: burrasca sul golfo, onde alte sul molo', options: ['continua', 'aspetta', 'chiedi:vicino'], right: ['aspetta'], why: 'legge il tempo dai gabbiani: con la burrasca non si esce' },
  { id: 'ciro-luce', who: 'Ciro Amitrano', moment: 'giorno', task: 'ripara i lampioni del rione', situation: 'chiesto: una vecchia del Vico delle Lavandaie gli chiede di riattaccarle la corrente che il Comune le ha staccato', options: ['aiuta', 'ignora', 'chiedi:vicino'], right: ['aiuta'], why: 'generoso, un po’ imbroglione per buona causa' },
  { id: 'dario-carte', who: 'Dario Fusco', moment: 'giorno', task: 'mangia un panino alla scrivania', situation: 'chiesto: Rosaria Vitale gli chiede al telefono altre carte della Linea 2, mentre Sabrina Longo, la sua capoufficio, è nella stanza', options: ['aiuta', 'ignora', 'aspetta'], right: ['aspetta'], why: 'vuole aiutarla, ma ha paura di farsi scoprire' },
  { id: 'sabrina-intervista', who: 'Sabrina Longo', moment: 'giorno', task: 'tiene le riunioni nell’ufficio', situation: 'chiesto: Rosaria Vitale, giornalista, le chiede un’intervista sugli appalti della Linea 2', options: ['aiuta', 'ignora'], right: ['ignora'], why: 'sospetta di chi parla con i giornalisti' },
  { id: 'anna-multa', who: 'Anna Greco', moment: 'giorno', task: 'controlla le bancarelle e fa le multe', situation: 'lite: il motorino del suo fidanzato Tonino è in divieto di sosta, e lui le chiede di lasciar perdere', options: ['continua', 'ignora', 'rinuncia'], right: ['continua'], why: 'fa le multe anche al fidanzato' },
  { id: 'aniello-binari', who: 'Aniello Russo', moment: 'giorno', task: 'guida il tram lungo il Corso', situation: 'bloccato: un motorino in seconda fila sui binari ferma il tram', options: ['aspetta', 'chiedi:vicino', 'chiedi:viandante', 'rinuncia'], right: ['aspetta', 'chiedi:vicino', 'chiedi:viandante'], why: 'un tranviere non lascia il tram' },
  { id: 'rosaria-busta', who: 'Rosaria Vitale', moment: 'sera', task: 'cerca le sue fonti in giro per la città', situation: 'chiesto: un uomo in giacca le offre una busta di soldi per non scrivere della Linea 2', options: ['aiuta', 'ignora'], right: ['ignora'], why: 'testarda, convinta che qualcuno menta' },
  { id: 'marco-foto', who: 'Marco De Luca', moment: 'giorno', task: 'fotografa il cantiere e il porto', situation: 'chiesto: il viandante gli chiede una foto davanti al golfo', options: ['aiuta', 'ignora'], right: ['aiuta'], why: 'entusiasta, vuole fotografare tutto' },
  { id: 'nunzia-padre', who: 'Nunzia Esposito', moment: 'giorno', task: 'prova i motori sul piazzale', situation: 'lite: il padre Gennaro le dice di non toccare il motore del taxi, che non è roba per lei', options: ['continua', 'rinuncia', 'va_a_casa'], right: ['continua'], why: 'non sopporta che la tratti da bambina' },
  { id: 'tonino-madre', who: 'Tonino Cimmino', moment: 'giorno', task: 'fa le granite al chiosco del lungomare', situation: 'chiesto: la madre Assunta gli chiede di chiudere il chiosco e correre ad aiutarla al bar, pieno di gente', options: ['aiuta', 'ignora'], right: ['aiuta'], why: 'gentile, non sa dire di no a sua madre' },
  { id: 'lucia-fratello', who: 'Lucia Sorrentino', moment: 'notte', task: 'dorme', situation: 'chiesto: il fratello Raffaele la chiama: si è fatto male e vuole che lo accompagni al Colle', options: ['aiuta', 'ignora', 'aspetta'], right: ['aiuta'], why: 'per il fratello farebbe qualunque cosa' },
  { id: 'filomena-motorino', who: 'Filomena Caputo', moment: 'mattina', task: 'sistema i giornali sul chiosco', situation: 'bloccato: un motorino parcheggiato sul marciapiede davanti all’edicola le impedisce di aprire', options: ['ignora', 'chiedi:vicino', 'chiedi:viandante', 'aspetta'], right: ['chiedi:vicino', 'chiedi:viandante'], why: 'odia i motorini sul marciapiede: non sta zitta' },
  { id: 'vincenzo-pioggia', who: 'Vincenzo Sannino', moment: 'mattina', task: 'apre l’edicola alle cinque', situation: 'pioggia: i gabbiani volano bassi e comincia a piovere forte', options: ['continua', 'aspetta', 'va_a_casa'], right: ['aspetta', 'va_a_casa'], why: 'pigro e scaramantico' },
];

function crossroadCases(): CaseSpec[] {
  const P = people();
  return CROSSROADS_CASES.map((x) => ({
    id: `bivio/${x.id}`,
    group: 'vita',
    kind: 'bivio',
    source: `${NEAPOLIS}/world/people.json (${x.who}); situazione scritta per il banco`,
    note: x.why,
    state: { person: personState(P.get(x.who)!), moment: x.moment, task: x.task, situation: x.situation, ...(x.nearby ? { nearby: x.nearby } : {}), options: x.options },
    expected: { decision: x.right },
    // The design's floor (docs/design/comportamento-npc.md, 2.1): an answer off the list, or none, is `aspetta`.
    rule: { decision: x.options.includes('aspetta') ? 'aspetta' : x.options[0] },
  }));
}

// ------------------------------------------------------------------------------------------------ where to go in a phase

interface Destination {
  id: string;
  who: string;
  moment: 'mattina' | 'giorno' | 'sera' | 'notte';
  today: string[];
  /** Places of this case besides home, work, the square and around. */
  extra?: Record<string, string>;
  right: string[];
}

const DESTINATIONS: Destination[] = [
  { id: 'assunta-mattina', who: 'Assunta Cimmino', moment: 'mattina', today: [], right: ['lavoro'] },
  { id: 'assunta-sera-pioggia', who: 'Assunta Cimmino', moment: 'sera', today: ['piove a dirotto da un’ora, la piazza è vuota'], right: ['casa', 'lavoro'] },
  { id: 'carla-notte', who: 'Carla Ferrante', moment: 'notte', today: [], right: ['lavoro'] },
  { id: 'carla-notte-febbre', who: 'Carla Ferrante', moment: 'notte', today: ['ha la febbre alta da ieri sera'], right: ['casa'] },
  { id: 'tonino-compleanno', who: 'Tonino Cimmino', moment: 'sera', today: ['oggi è il compleanno di sua madre Assunta: festa al Bar Gambrinus'], extra: { bar_madre: 'il Bar Gambrinus di sua madre, in Piazza delle Erbe' }, right: ['bar_madre'] },
  { id: 'dario-domenica', who: 'Dario Fusco', moment: 'giorno', today: ['è domenica: gli uffici del Centro Direzionale sono chiusi'], right: ['casa', 'piazza', 'in_giro'] },
  { id: 'vincenzo-sciopero', who: 'Vincenzo Sannino', moment: 'mattina', today: ['sciopero dei giornali: oggi all’edicola non arriva nessun giornale'], right: ['casa', 'piazza', 'in_giro'] },
  { id: 'pasquale-burrasca', who: 'Pasquale Amato', moment: 'mattina', today: ['burrasca sul golfo: i gozzi restano a terra e le onde spazzano il molo'], right: ['lavoro'] },
  { id: 'anna-esame', who: 'Anna Greco', moment: 'notte', today: ['domani mattina ha l’esame da commissario'], right: ['casa'] },
  { id: 'rosaria-fonte', who: 'Rosaria Vitale', moment: 'sera', today: ['una fonte le ha dato appuntamento al Molo Vecchio alle nove'], extra: { molo: 'il Molo Vecchio' }, right: ['molo'] },
  { id: 'salvatore-assemblea', who: 'Salvatore Iovine', moment: 'sera', today: ['stasera i portuali votano lo sciopero'], right: ['piazza'] },
  { id: 'gaetano-festa', who: 'Gaetano Cozzolino', moment: 'sera', today: ['festa del santo: la processione passa nel Vico del Vesuvietto e tutto il rione è in strada'], right: ['lavoro'] },
  { id: 'franco-sorveglianza', who: 'Franco Barone', moment: 'notte', today: ['gli hanno ordinato di sorvegliare il cantiere della Linea 2 stanotte'], extra: { cantiere: 'il Cantiere della Linea 2' }, right: ['cantiere', 'lavoro'] },
  { id: 'lucia-fratello-malato', who: 'Lucia Sorrentino', moment: 'sera', today: ['il fratello Raffaele è a letto malato'], extra: { fratello: 'la casa del fratello Raffaele, al Colle' }, right: ['fratello'] },
  { id: 'gilda-sera', who: 'Gilda Marino', moment: 'sera', today: [], right: ['in_giro', 'lavoro'] },
  { id: 'carmela-mercato-chiuso', who: 'Carmela Esposito', moment: 'mattina', today: ['il mercato è chiuso per la festa'], right: ['lavoro', 'casa'] },
  { id: 'raffaele-sera', who: 'Raffaele Sorrentino', moment: 'sera', today: [], right: ['piazza'] },
  { id: 'marco-sera', who: 'Marco De Luca', moment: 'sera', today: [], right: ['lavoro'] },
  { id: 'ciro-blackout', who: 'Ciro Amitrano', moment: 'sera', today: ['è saltata la luce in tutto il rione'], extra: { cabina: 'la cabina elettrica del rione' }, right: ['cabina', 'lavoro'] },
  { id: 'nunzia-sera', who: 'Nunzia Esposito', moment: 'sera', today: [], extra: { nonna: 'la trattoria della nonna Carmela, al Vico delle Lavandaie' }, right: ['nonna', 'in_giro'] },
];

const routineKey = (dove: string) => (dove === 'in giro' ? 'in_giro' : dove);

function destinationOptions(p: Person, d: Destination) {
  const work = p.routine.find((r) => r.dove === 'lavoro')?.fa ?? 'il suo lavoro';
  return [
    { id: 'casa', what: 'home' },
    { id: 'lavoro', what: `work (${work})` },
    { id: 'piazza', what: 'the square of their quarter' },
    { id: 'in_giro', what: 'around the city' },
    ...Object.entries(d.extra ?? {}).map(([id, what]) => ({ id, what })),
  ];
}

function destinationCases(): CaseSpec[] {
  const P = people();
  return DESTINATIONS.map((d) => {
    const p = P.get(d.who)!;
    return {
      id: `meta/${d.id}`,
      group: 'vita',
      kind: 'meta',
      source: `${NEAPOLIS}/world/people.json (${d.who}); i fatti del giorno scritti per il banco`,
      state: { person: personState(p), moment: d.moment, today: d.today.length ? d.today : ['un giorno come gli altri'], options: destinationOptions(p, d) },
      expected: { where: d.right },
      // Today the kernel follows the routine whatever happens (society.ts → placeFor).
      rule: { where: routineKey(p.routine.find((r) => r.quando === d.moment)?.dove ?? 'casa') },
    };
  });
}

/** Several people in one request (the speculative fan-out of TypeSafe's docs): the same moment, one question each. */
function destinationBatches(): CaseSpec[] {
  const P = people();
  const out: CaseSpec[] = [];
  for (const moment of ['sera', 'notte', 'mattina'] as const) {
    const ds = DESTINATIONS.filter((d) => d.moment === moment);
    if (ds.length < 3) continue;
    const questions: Question[] = ds.map((d, i) => ({
      id: `where_${i}`,
      type: 'choice',
      instructions: `Where does \`people[${i}]\` go now, in the part of the day \`moment\`, given their routine and the facts in \`people[${i}].today\`?`,
      criteria: Object.fromEntries(destinationOptions(P.get(d.who)!, d).map((o) => [o.id, o.what])),
    }));
    out.push({
      id: `meta-lotto/${moment}`,
      group: 'vita',
      kind: 'meta-lotto',
      source: `i casi meta/* della ${moment}, in una richiesta`,
      batchOf: ds.map((d) => `meta/${d.id}`),
      state: { moment, people: ds.map((d) => ({ ...personState(P.get(d.who)!), today: d.today.length ? d.today : ['un giorno come gli altri'] })) },
      questions,
      expected: Object.fromEntries(ds.map((d, i) => [`where_${i}`, d.right])),
      rule: Object.fromEntries(ds.map((d, i) => [`where_${i}`, routineKey(P.get(d.who)!.routine.find((r) => r.quando === moment)?.dove ?? 'casa')])),
    });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ the team of a venture

interface TeamCase {
  id: string;
  venture: string;
  place: string;
  role: string;
  /** The program the role asks (`qualunque`: anyone), as HOUSE_ROLES says it. */
  program: string;
  candidates: Array<{ nome: string; mestiere: string; programma: string; luoghi_di_distanza: number; note?: string }>;
  right: string[];
  why: string;
}

const TEAMS_CASES: TeamCase[] = [
  {
    id: 'cabina-capo',
    venture: 'rimettere in piedi la cabina elettrica del Vico del Molo, caduta col temporale',
    place: 'Vico del Molo',
    role: 'capo del lavoro, che sa di quadri e di fusibili',
    program: 'elettricista',
    candidates: [
      { nome: 'Ciro Amitrano', mestiere: 'elettricista comunale', programma: 'elettricista', luoghi_di_distanza: 1 },
      { nome: 'Lucia Sorrentino', mestiere: 'tecnica della centralina', programma: 'elettricista', luoghi_di_distanza: 2 },
      { nome: 'Gennaro Esposito', mestiere: 'meccanico', programma: 'fabbro', luoghi_di_distanza: 2 },
      { nome: 'Anna Greco', mestiere: 'vigile urbana', programma: 'guardia', luoghi_di_distanza: 0 },
    ],
    right: ['Ciro Amitrano', 'Lucia Sorrentino'],
    why: 'chi sa il mestiere; il più vicino dei due va bene come l’altra',
  },
  {
    id: 'cabina-manovale',
    venture: 'rimettere in piedi la cabina elettrica del Vico del Molo, caduta col temporale; il capo è Ciro Amitrano',
    place: 'Vico del Molo',
    role: 'manovale, che porta e tiene',
    program: 'qualunque',
    candidates: [
      { nome: 'Franco Barone', mestiere: 'vigile urbano', programma: 'guardia', luoghi_di_distanza: 0, note: 'è rivale di Ciro Amitrano' },
      { nome: 'Gennaro Esposito', mestiere: 'meccanico', programma: 'fabbro', luoghi_di_distanza: 2, note: 'è amico di Ciro Amitrano' },
      { nome: 'Salvatore Iovine', mestiere: 'gruista del porto', programma: 'portuale', luoghi_di_distanza: 1 },
      { nome: 'Mora', mestiere: 'gatta di quartiere del porto', programma: 'nessuno', luoghi_di_distanza: 0 },
    ],
    right: ['Gennaro Esposito', 'Salvatore Iovine'],
    why: 'il rivale del capo lavora male con lui; la gatta non porta niente',
  },
  {
    id: 'piazza-manovale',
    venture: 'rifare il basolato di Piazza delle Erbe dopo il cantiere',
    place: 'Piazza delle Erbe',
    role: 'manovale, che porta i basoli',
    program: 'qualunque',
    candidates: [
      { nome: 'Fumo', mestiere: 'gatto di quartiere del bar', programma: 'nessuno', luoghi_di_distanza: 0 },
      { nome: 'Assunta Cimmino', mestiere: 'barista', programma: 'barista', luoghi_di_distanza: 0, note: '54 anni, apre il bar ogni mattina' },
      { nome: 'Tonino Cimmino', mestiere: 'barista', programma: 'barista', luoghi_di_distanza: 1, note: 'giovane' },
      { nome: 'Salvatore Iovine', mestiere: 'gruista del porto', programma: 'portuale', luoghi_di_distanza: 2 },
    ],
    right: ['Tonino Cimmino', 'Salvatore Iovine'],
    why: 'chi ha braccia e tempo; non il gatto, non chi tiene aperto il bar',
  },
  {
    id: 'trattoria-capomastro',
    venture: 'rifare il tetto della trattoria «Da Carmela» al Vico delle Lavandaie',
    place: 'Vico delle Lavandaie',
    role: 'capomastro, che sa lavorare il ferro e il legno',
    program: 'fabbro',
    candidates: [
      { nome: 'Gennaro Esposito', mestiere: 'meccanico', programma: 'fabbro', luoghi_di_distanza: 2, note: 'è figlio di Carmela Esposito' },
      { nome: 'Nunzia Esposito', mestiere: 'meccanica dei taxi', programma: 'fabbro', luoghi_di_distanza: 2, note: 'è nipote di Carmela Esposito' },
      { nome: 'Carla Ferrante', mestiere: 'medico del turno di notte', programma: 'medico', luoghi_di_distanza: 0 },
      { nome: 'Raffaele Sorrentino', mestiere: 'infermiere', programma: 'medico', luoghi_di_distanza: 1 },
    ],
    right: ['Gennaro Esposito', 'Nunzia Esposito'],
    why: 'chi ha il mestiere, e la trattoria è della loro famiglia',
  },
  {
    id: 'molo-manovale',
    venture: 'riparare il pontile del Molo Vecchio dopo la burrasca',
    place: 'Molo Vecchio',
    role: 'manovale, che tira le cime e porta le assi',
    program: 'qualunque',
    candidates: [
      { nome: 'Dario Fusco', mestiere: 'impiegato dell’ufficio appalti', programma: 'impiegato', luoghi_di_distanza: 2, note: 'timido, non ha mai lavorato di braccia' },
      { nome: 'Pasquale Amato', mestiere: 'ormeggiatore', programma: 'portuale', luoghi_di_distanza: 0 },
      { nome: 'Mora', mestiere: 'gatta di quartiere del porto', programma: 'nessuno', luoghi_di_distanza: 0 },
      { nome: 'Sabrina Longo', mestiere: 'capoufficio delle pratiche', programma: 'impiegato', luoghi_di_distanza: 2 },
    ],
    right: ['Pasquale Amato'],
    why: 'è il suo molo e il suo mestiere',
  },
];

/** fillTeam's order (ventures.ts): the program the role asks, then the distance, then a draw of the seed on the name. */
function teamRule(t: TeamCase): string {
  return [...t.candidates].sort((a, b) => {
    const fa = t.program === 'qualunque' || a.programma === t.program ? 0 : 1;
    const fb = t.program === 'qualunque' || b.programma === t.program ? 0 : 1;
    return fa - fb || a.luoghi_di_distanza - b.luoghi_di_distanza || hashStr(`${a.nome}|${t.id}`) - hashStr(`${b.nome}|${t.id}`);
  })[0].nome;
}

function teamCases(): CaseSpec[] {
  return TEAMS_CASES.map((t) => ({
    id: `squadra/${t.id}`,
    group: 'vita',
    kind: 'squadra',
    source: `${NEAPOLIS}/world/people.json; l'impresa scritta per il banco`,
    note: t.why,
    state: { venture: `${t.venture} (${t.place})`, role: t.role, candidates: t.candidates.map(({ programma: _p, ...c }) => c) },
    expected: { member: t.right },
    rule: { member: teamRule(t) },
  }));
}

// ------------------------------------------------------------------------------------------------ the next step of a venture

interface StepCase {
  id: string;
  member: string;
  carrying: Record<string, number>;
  deposit: Record<string, number>;
  needs: Record<string, number>;
  phase: string;
}

const STEPS: StepCase[] = [
  { id: 'porta-ciocchi', member: 'Gennaro Esposito', carrying: { 'Ciocco di legna': 2 }, deposit: {}, needs: { 'Ciocco di legna': 4 }, phase: 'platea' },
  { id: 'niente-da-portare', member: 'Gennaro Esposito', carrying: { 'Pezzo di ricambio': 1 }, deposit: {}, needs: { 'Ciocco di legna': 4 }, phase: 'platea' },
  { id: 'deposito-chiodi', member: 'Nunzia Esposito', carrying: {}, deposit: { Chiodi: 6 }, needs: { 'Ciocco di legna': 0, Chiodi: 4 }, phase: 'muri' },
  { id: 'materiali-finiti', member: 'Tonino Cimmino', carrying: { 'Ciocco di legna': 3 }, deposit: {}, needs: {}, phase: 'tetto' },
  { id: 'due-mancano', member: 'Salvatore Iovine', carrying: { Chiodi: 1 }, deposit: {}, needs: { 'Ciocco di legna': 6, Chiodi: 4 }, phase: 'muri' },
  { id: 'ha-quello-sbagliato', member: 'Pasquale Amato', carrying: { 'Cima da ormeggio': 2, 'Cassetta di alici': 1 }, deposit: {}, needs: { Chiodi: 2 }, phase: 'finiture' },
];

/** nextStep (ventures.ts): the first missing material one has (carrying or the deposit), else work if nothing is missing, else the trade. */
function stepRule(s: StepCase): string {
  const missing = Object.entries(s.needs).filter(([, n]) => n > 0).map(([m]) => m);
  if (!missing.length) return 'lavora';
  const has = missing.find((m) => (s.carrying[m] ?? 0) > 0 || (s.deposit[m] ?? 0) > 0);
  return has ? `porta:${has}` : 'mestiere';
}

function stepCases(): CaseSpec[] {
  return STEPS.map((s) => {
    const materials = [...new Set([...Object.keys(s.needs), ...Object.keys(s.carrying), ...Object.keys(s.deposit)])];
    const options = [...materials.map((m) => ({ id: `porta:${m}`, what: `bring ${m} to the site` })), { id: 'lavora', what: 'work on the site with what is already there' }, { id: 'mestiere', what: 'go back to their own trade: there is nothing they can do for the work now' }];
    return {
      id: `passo/${s.id}`,
      group: 'vita',
      kind: 'passo',
      source: 'le fasi di housePhases (ventures.ts); i carichi scritti per il banco',
      state: { venture: `rifare il tetto della trattoria «Da Carmela», fase ${s.phase}`, member: s.member, still_needed: Object.keys(s.needs).length ? s.needs : 'niente: i materiali di questa fase ci sono tutti', carrying: s.carrying, deposit: s.deposit, options },
      expected: { step: [stepRule(s)] },
      rule: { step: stepRule(s) },
    };
  });
}

export function prepare(log: (s: string) => void = console.log): string {
  const cases = [...tradeCases(), ...crossroadCases(), ...destinationCases(), ...destinationBatches(), ...teamCases(), ...stepCases()];
  const file = path.join(ROOT, 'lab/banco/jev/casi/vita.json');
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        group: 'vita',
        description:
          'Gruppo 3 (T313), generato da `--prepara vita`: le scelte della vita degli individui che oggi fa una regola del kernel (o nessuno), su universi veri. I mestieri di valmora (individuati con Gemini) contro i programmi del seme, dove `matchJob` non ne trova quasi mai; bivi, mete, squadre e passi delle imprese sulle persone e i luoghi di neapolis. `rule` è ciò che fa il kernel oggi, il pavimento se la risposta manca. Le risposte giuste sono giudizi di chi ha scritto il banco: vanno rilette dall’autore.',
        cases,
      },
      null,
      1,
    ) + '\n',
  );
  log(`vita: ${cases.length} casi (${[...new Set(cases.map((c) => c.kind))].map((k) => `${k} ${cases.filter((c) => c.kind === k).length}`).join(', ')})`);
  return file;
}

