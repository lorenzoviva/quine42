// T325 (b): the cases of the lines reused (casi/battute.json comes from here: `--prepara battute`). People of three universes (their names,
// trades, places and bonds from world/people.json of neapolis, orichalcum, sidera) with an archive of what a wanderer asked them and what they
// answered, and a new question: the same, said in other words, another one, or the same in a circumstance that changed (the time, the bond, what
// happened). The right answer: which old question asks the same (`same`), and which old answer can be said again now (`fits_*`). The lines and the
// labels were written for the bench by who wrote it (Claude Opus 5.5): the author should read them again.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ArchivedLine } from './domande';

type When = Record<string, unknown>;
interface Person {
  key: string;
  universe: string;
  person: { name: string; job: string; place: string };
  archive: ArchivedLine[];
  /** [id, asked now, the circumstance now, the old question that asks the same or 'none', the old line that can be said again or 'none', note] */
  now: Array<[string, string, When, string, string, string]>;
}

const stranger = 'sconosciuto';

const PEOPLE: Person[] = [
  {
    key: 'assunta',
    universe: 'neapolis',
    person: { name: 'Assunta Cimmino', job: 'barista del Bar Gambrinus', place: 'Piazza delle Erbe' },
    archive: [
      { id: 'b1', asked: 'Buongiorno! Chi sei?', answered: 'Assunta, bello mio, e questo è il Gambrinus: il caffè più buono della piazza. Tu chi sei, che non ti ho mai visto?', when: { day: 3, moment: 'mattina', place: 'Bar Gambrinus', doing: 'apre il bar', bond: stranger } },
      { id: 'b2', asked: 'Quanto costa un caffè?', answered: 'Mille lire al banco. E se ne lasci pagato uno per chi viene dopo, il quaderno dei sospesi ti ringrazia.', when: { day: 3, moment: 'mattina', place: 'Bar Gambrinus', doing: 'apre il bar', bond: stranger } },
      { id: 'b3', asked: 'Che fai stamattina?', answered: 'Apro il bar e preparo i caffè della prima ora: tra mezz’ora arriva tutto il porto.', when: { day: 3, moment: 'mattina', place: 'Bar Gambrinus', doing: 'apre il bar', bond: stranger } },
      { id: 'b4', asked: 'Cosa pensi del cantiere della Linea 2?', answered: 'Una mangiatoia, bello mio! Scavano da tre anni e la piazza è ancora un buco.', when: { day: 3, moment: 'giorno', place: 'Piazza delle Erbe', doing: 'serve ai tavolini', bond: stranger } },
      { id: 'b5', asked: 'Conosci un buon pizzaiolo qui vicino?', answered: 'Gaetano, dice lui. Io dico che la sua pizza è come lui: gonfia e vuota.', when: { day: 3, moment: 'giorno', place: 'Piazza delle Erbe', doing: 'serve ai tavolini', bond: stranger } },
    ],
    now: [
      ['uguale', 'Buongiorno! Chi sei?', { day: 3, moment: 'mattina', place: 'Bar Gambrinus', doing: 'apre il bar', bond: stranger, who: 'un altro viandante, appena arrivato' }, 'b1', 'b1', 'la stessa domanda da un altro sconosciuto'],
      ['parafrasi', 'Salve, come ti chiami?', { day: 3, moment: 'mattina', place: 'Bar Gambrinus', doing: 'apre il bar', bond: stranger }, 'b1', 'b1', ''],
      ['legame-cambiato', 'Buongiorno! Chi sei?', { day: 9, moment: 'mattina', place: 'Bar Gambrinus', doing: 'apre il bar', bond: 'amica: si parlano ogni giorno da una settimana' }, 'b1', 'none', '«non ti ho mai visto» sarebbe falso'],
      ['parafrasi-prezzo', 'Quanto si paga un caffè al banco?', { day: 3, moment: 'mattina', place: 'Bar Gambrinus', doing: 'apre il bar', bond: stranger }, 'b2', 'b2', ''],
      ['ora-cambiata', 'Che fai stamattina?', { day: 3, moment: 'sera', place: 'Piazza delle Erbe', doing: 'chiacchiera con le vicine', bond: stranger }, 'b3', 'none', 'di sera «tra mezz’ora arriva il porto» è sbagliato'],
      ['altra-ora', 'Che fai stasera?', { day: 3, moment: 'sera', place: 'Piazza delle Erbe', doing: 'chiacchiera con le vicine', bond: stranger }, 'none', 'none', 'un’altra domanda'],
      ['parafrasi-cantiere', 'Che ne pensi dei lavori della metropolitana in piazza?', { day: 4, moment: 'giorno', place: 'Piazza delle Erbe', doing: 'serve ai tavolini', bond: stranger }, 'b4', 'b4', ''],
      ['fatto-cantiere', 'Cosa pensi del cantiere della Linea 2?', { day: 6, moment: 'giorno', place: 'Piazza delle Erbe', doing: 'serve ai tavolini', bond: stranger, happened: 'ieri il cantiere è stato chiuso e la piazza riaperta' }, 'b4', 'none', 'la piazza non è più un buco'],
      ['nuova', 'Dove posso comprare il giornale?', { day: 3, moment: 'giorno', place: 'Piazza delle Erbe', doing: 'serve ai tavolini', bond: stranger }, 'none', 'none', ''],
      ['fatto-pace', 'Conosci un buon pizzaiolo qui vicino?', { day: 5, moment: 'giorno', place: 'Piazza delle Erbe', doing: 'serve ai tavolini', bond: stranger, happened: 'alla festa di ieri Assunta e Gaetano hanno fatto pace' }, 'b5', 'none', 'dopo la pace la battuta sarebbe stonata'],
    ],
  },
  {
    key: 'gennaro',
    universe: 'neapolis',
    person: { name: 'Gennaro Esposito', job: 'meccanico', place: 'Officina di Gennaro' },
    archive: [
      { id: 'b1', asked: 'Mi ripari il motorino?', answered: 'Lascialo qua, domani è pronto: è la candela, si sente dal rumore.', when: { day: 2, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger, wanderer_has: 'un motorino che tossisce' } },
      { id: 'b2', asked: 'Dove si compra la benzina?', answered: 'Al distributore sul lungomare, dopo la curva del porto. Di notte è chiuso.', when: { day: 2, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger } },
      { id: 'b3', asked: 'Da quanto fai il meccanico?', answered: 'Da quando avevo dodici anni: mio padre mi metteva in mano la chiave inglese prima della cartella.', when: { day: 2, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger } },
      { id: 'b4', asked: 'Chi è il miglior tassista della città?', answered: 'Mia figlia Nunzia, chi se no? I taxi li ripara e li guida meglio di tutti.', when: { day: 2, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger } },
    ],
    now: [
      ['altro-motorino', 'Puoi aggiustarmi il motorino?', { day: 4, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger, wanderer_has: 'un motorino diverso, che fuma nero dallo scarico' }, 'b1', 'none', 'la diagnosi era di un altro motorino'],
      ['parafrasi-benzina', 'Dove posso fare benzina?', { day: 4, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger }, 'b2', 'b2', ''],
      ['benzina-notte', 'Dove si compra la benzina?', { day: 4, moment: 'notte', place: 'officina', doing: 'chiude la serranda', bond: stranger }, 'b2', 'b2', 'la risposta dice già che di notte è chiuso'],
      ['parafrasi-mestiere', 'Da quanto tempo fai questo lavoro?', { day: 5, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger }, 'b3', 'b3', ''],
      ['parafrasi-tassista', 'Chi guida meglio il taxi in città?', { day: 3, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger }, 'b4', 'b4', ''],
      ['fatto-tassista', 'Chi è il miglior tassista della città?', { day: 6, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger, happened: 'Nunzia è in ospedale dopo un incidente col taxi' }, 'b4', 'none', 'il padre non scherzerebbe così'],
      ['nuova', 'Mi presti la chiave inglese?', { day: 4, moment: 'giorno', place: 'officina', doing: 'ripara un taxi', bond: stranger }, 'none', 'none', ''],
    ],
  },
  {
    key: 'selene',
    universe: 'orichalcum',
    person: { name: 'Selene Vitti', job: 'orologiaia e taratrice di manometri', place: 'Bottega degli orologi, Via delle Lancette' },
    archive: [
      { id: 'b1', asked: 'Che lavoro fai?', answered: 'Taro i manometri delle caldaie e aggiusto orologi: se una lancetta mente, qualcuno salta in aria.', when: { day: 1, moment: 'giorno', place: 'bottega', doing: 'tara un manometro', bond: stranger } },
      { id: 'b2', asked: 'Che ore sono?', answered: 'Le sette e un quarto, e il mio orologio non sbaglia mai di un secondo.', when: { day: 1, moment: 'sera', time: '19:15', place: 'bottega', doing: 'chiude la bottega', bond: stranger } },
      { id: 'b3', asked: 'Dove si trova la Gilda dei Caldaisti?', answered: 'In fondo al Canale delle Officine, dove il fumo è più nero: non puoi sbagliare.', when: { day: 1, moment: 'giorno', place: 'bottega', doing: 'tara un manometro', bond: stranger } },
      { id: 'b4', asked: 'Hai visto l’inventore stamattina?', answered: 'Corrado? È passato all’alba col suo carretto di ingranaggi, diretto alla torre.', when: { day: 1, moment: 'mattina', place: 'bottega', doing: 'apre la bottega', bond: stranger } },
    ],
    now: [
      ['parafrasi-lavoro', 'Di cosa ti occupi?', { day: 2, moment: 'giorno', place: 'bottega', doing: 'aggiusta un orologio', bond: stranger }, 'b1', 'b1', ''],
      ['ora-dopo', 'Che ore sono?', { day: 1, moment: 'notte', time: '23:05', place: 'bottega', doing: 'lavora a lume di candela', bond: stranger }, 'b2', 'none', 'l’ora è cambiata'],
      ['ora-stessa', 'Sai dirmi l’ora?', { day: 1, moment: 'sera', time: '19:15', place: 'bottega', doing: 'chiude la bottega', bond: stranger }, 'b2', 'b2', 'stesso minuto'],
      ['parafrasi-gilda', 'Come arrivo alla sede della Gilda dei Caldaisti?', { day: 3, moment: 'giorno', place: 'bottega', doing: 'tara un manometro', bond: stranger }, 'b3', 'b3', ''],
      ['altro-giorno', 'Hai visto l’inventore stamattina?', { day: 2, moment: 'mattina', place: 'bottega', doing: 'apre la bottega', bond: stranger }, 'b4', 'none', 'un’altra mattina'],
      ['nuova', 'Mi ripari questo orologio da taschino?', { day: 2, moment: 'giorno', place: 'bottega', doing: 'aggiusta un orologio', bond: stranger }, 'none', 'none', ''],
    ],
  },
  {
    key: 'ruben',
    universe: 'sidera',
    person: { name: 'Ruben Kessler', job: 'pilota di navette', place: 'Hangar sette del porto spaziale' },
    archive: [
      { id: 'b1', asked: 'Mi porti alla stazione orbitale?', answered: 'Duecento crediti e partiamo al prossimo turno, se la tempesta ionica ci lascia passare.', when: { day: 4, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: stranger, weather: 'tempesta ionica' } },
      { id: 'b2', asked: 'Che tempo fa lassù?', answered: 'Tempesta ionica sull’Anello da tre giorni: si vola bassi e si prega.', when: { day: 4, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: stranger, weather: 'tempesta ionica' } },
      { id: 'b3', asked: 'Come si diventa pilota?', answered: 'Sei anni alla scuola della Gilda e mille ore di simulatore, poi ti danno una navetta vecchia come me.', when: { day: 4, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: stranger } },
      { id: 'b4', asked: 'Chi è il tuo capo?', answered: 'Rispondo alla Gilda della Navigazione Profonda, cioè a Selene Moro quando è di cattivo umore.', when: { day: 4, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: stranger } },
    ],
    now: [
      ['parafrasi-viaggio', 'Quanto vuoi per portarmi alla stazione orbitale?', { day: 4, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: stranger, weather: 'tempesta ionica' }, 'b1', 'b1', ''],
      ['tempo-cambiato', 'Che tempo fa lassù?', { day: 6, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: stranger, weather: 'sereno', happened: 'la tempesta ionica è finita stamattina' }, 'b2', 'none', ''],
      ['parafrasi-pilota', 'Cosa serve per diventare pilota?', { day: 5, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: stranger }, 'b3', 'b3', ''],
      ['parafrasi-capo', 'Per chi lavori?', { day: 5, moment: 'sera', place: 'hangar', doing: 'pulisce la cabina', bond: stranger }, 'b4', 'b4', 'la sera non cambia il capo'],
      ['amico', 'Mi porti alla stazione orbitale?', { day: 8, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: 'amico: il viandante gli ha salvato la navetta', weather: 'sereno' }, 'b1', 'none', 'a chi ti ha salvato non chiedi il prezzo di prima'],
      ['simile-diversa', 'Mi insegni a pilotare?', { day: 5, moment: 'giorno', place: 'hangar', doing: 'controlla i motori', bond: stranger }, 'none', 'none', 'una richiesta, non come si diventa pilota'],
    ],
  },
  {
    key: 'carmela',
    universe: 'neapolis',
    person: { name: 'Carmela Esposito', job: 'cuoca della trattoria', place: 'Trattoria da Carmela' },
    archive: [
      { id: 'b1', asked: 'Cosa c’è da mangiare oggi?', answered: 'Oggi pasta e patate con la provola e polpette al sugo: il ragù lo faccio la domenica.', when: { day: 4, weekday: 'giovedì', moment: 'giorno', place: 'trattoria', doing: 'cucina', bond: stranger } },
      { id: 'b2', asked: 'Come si fa il ragù?', answered: 'Ci vuole la domenica intera: carne buona, pomodoro e sei ore sul fuoco piano, che pippia.', when: { day: 4, moment: 'giorno', place: 'trattoria', doing: 'cucina', bond: stranger } },
      { id: 'b3', asked: 'Da quanto hai la trattoria?', answered: 'Da quarant’anni, e mio figlio Gennaro ci mangiava sotto il tavolo da piccolo.', when: { day: 4, moment: 'giorno', place: 'trattoria', doing: 'cucina', bond: stranger } },
    ],
    now: [
      ['stesso-giorno', 'Che si mangia oggi?', { day: 4, weekday: 'giovedì', moment: 'giorno', place: 'trattoria', doing: 'cucina', bond: stranger }, 'b1', 'b1', ''],
      ['domenica', 'Che si mangia oggi?', { day: 7, weekday: 'domenica', moment: 'giorno', place: 'trattoria', doing: 'cucina il ragù', bond: stranger }, 'b1', 'none', 'di domenica c’è il ragù'],
      ['parafrasi-ragu', 'Qual è la ricetta del ragù?', { day: 5, moment: 'giorno', place: 'trattoria', doing: 'cucina', bond: stranger }, 'b2', 'b2', ''],
      ['parafrasi-trattoria', 'Da quanto tempo cucini qui?', { day: 5, moment: 'sera', place: 'trattoria', doing: 'lava i piatti', bond: stranger }, 'b3', 'b3', ''],
      ['nuova', 'Mi dai la ricetta delle polpette?', { day: 5, moment: 'giorno', place: 'trattoria', doing: 'cucina', bond: stranger }, 'none', 'none', ''],
    ],
  },
  {
    key: 'iris',
    universe: 'sidera',
    person: { name: 'Iris Calandra', job: 'xenobotanica capo delle Cupole', place: 'Cupole di coltura' },
    archive: [
      { id: 'b1', asked: 'Cosa coltivate nelle cupole?', answered: 'Felci di Titano, alghe rosse e un melo che non ha mai visto il sole: tutto sotto luce artificiale.', when: { day: 2, moment: 'giorno', place: 'cupola uno', doing: 'misura le felci', bond: stranger } },
      { id: 'b2', asked: 'Posso entrare nella cupola tre?', answered: 'No: la tre è in quarantena per una muffa. Torna quando la spia è verde.', when: { day: 2, moment: 'giorno', place: 'cupola uno', doing: 'misura le felci', bond: stranger, dome_three: 'in quarantena' } },
      { id: 'b3', asked: 'Chi è il ragazzo che ti aiuta?', answered: 'Tobia, mio figlio: apprendista, testardo come una radice.', when: { day: 2, moment: 'giorno', place: 'cupola uno', doing: 'misura le felci', bond: stranger } },
    ],
    now: [
      ['parafrasi-piante', 'Che piante crescono qui sotto le cupole?', { day: 3, moment: 'giorno', place: 'cupola uno', doing: 'misura le felci', bond: stranger }, 'b1', 'b1', ''],
      ['quarantena-finita', 'Posso entrare nella cupola tre?', { day: 5, moment: 'giorno', place: 'cupola uno', doing: 'misura le felci', bond: stranger, dome_three: 'aperta', happened: 'ieri la quarantena della cupola tre è finita' }, 'b2', 'none', ''],
      ['quarantena-ancora', 'Posso visitare la cupola tre?', { day: 3, moment: 'giorno', place: 'cupola uno', doing: 'misura le felci', bond: stranger, dome_three: 'in quarantena' }, 'b2', 'b2', ''],
      ['parafrasi-figlio', 'Chi è quel giovane che lavora con te?', { day: 3, moment: 'giorno', place: 'cupola uno', doing: 'misura le felci', bond: stranger }, 'b3', 'b3', ''],
      ['nuova', 'Quando apre la cupola uno ai visitatori?', { day: 3, moment: 'giorno', place: 'cupola uno', doing: 'misura le felci', bond: stranger }, 'none', 'none', ''],
    ],
  },
  {
    key: 'bruno',
    universe: 'orichalcum',
    person: { name: 'Bruno Caldera', job: 'capo della Gilda dei Caldaisti', place: 'Sede della Gilda, Canale delle Officine' },
    archive: [
      { id: 'b1', asked: 'Come entro nella Gilda?', answered: 'Porta tre caldaie riparate e la firma di un maestro: allora ne parliamo.', when: { day: 1, moment: 'giorno', place: 'sede della Gilda', doing: 'controlla i registri', bond: stranger } },
      { id: 'b2', asked: 'Perché il carbone costa così tanto?', answered: 'Perché le miniere del nord sono allagate e chi ha carbone fa il prezzo che vuole.', when: { day: 1, moment: 'giorno', place: 'sede della Gilda', doing: 'controlla i registri', bond: stranger } },
      { id: 'b3', asked: 'Chi comanda in città?', answered: 'Il Consiglio delle Torri, sulla carta. In pratica chi tiene accese le caldaie: cioè noi.', when: { day: 1, moment: 'giorno', place: 'sede della Gilda', doing: 'controlla i registri', bond: stranger } },
    ],
    now: [
      ['parafrasi-gilda', 'Cosa serve per entrare nella Gilda?', { day: 2, moment: 'giorno', place: 'sede della Gilda', doing: 'controlla i registri', bond: stranger }, 'b1', 'b1', ''],
      ['caldaie-portate', 'Come entro nella Gilda?', { day: 4, moment: 'giorno', place: 'sede della Gilda', doing: 'controlla i registri', bond: stranger, happened: 'il viandante ha portato tre caldaie riparate e la firma della maestra Gelsomina' }, 'b1', 'none', 'ha già fatto ciò che chiedeva'],
      ['parafrasi-carbone', 'Come mai il carbone è così caro?', { day: 2, moment: 'giorno', place: 'sede della Gilda', doing: 'controlla i registri', bond: stranger }, 'b2', 'b2', ''],
      ['parafrasi-comando', 'Chi governa la città?', { day: 2, moment: 'giorno', place: 'sede della Gilda', doing: 'controlla i registri', bond: stranger }, 'b3', 'b3', ''],
      ['consiglio-sciolto', 'Chi comanda in città?', { day: 5, moment: 'giorno', place: 'sede della Gilda', doing: 'controlla i registri', bond: stranger, happened: 'ieri la rivolta dei fuochisti ha sciolto il Consiglio delle Torri' }, 'b3', 'none', ''],
    ],
  },
  {
    key: 'fumo',
    universe: 'neapolis',
    person: { name: 'Fumo', job: 'gatto di quartiere del bar', place: 'Bar Gambrinus' },
    archive: [{ id: 'b1', asked: 'Ciao micio, come stai?', answered: '(Fumo ti guarda, sbadiglia e si rimette a dormire sulla sedia del bar.)', when: { day: 3, moment: 'giorno', place: 'Bar Gambrinus', doing: 'dorme su una sedia', bond: stranger } }],
    now: [
      ['parafrasi', 'Ehi gatto, tutto bene?', { day: 4, moment: 'giorno', place: 'Bar Gambrinus', doing: 'dorme su una sedia', bond: stranger }, 'b1', 'b1', ''],
      ['pesce', 'Vuoi un po’ di pesce?', { day: 4, moment: 'giorno', place: 'Bar Gambrinus', doing: 'dorme su una sedia', bond: stranger, wanderer_has: 'una cassetta di alici' }, 'none', 'none', ''],
    ],
  },
];

export const REUSE_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'casi', 'battute.json');

export function reuseCases() {
  return PEOPLE.flatMap((p) =>
    p.now.map(([id, asked, when, same, reuse, note]) => ({
      id: `battuta/${p.key}/${id}`,
      group: 'battute',
      kind: 'battuta',
      state: { person: p.person, archive: p.archive, now: { asked, when } },
      expected: { same: [same], ...Object.fromEntries(p.archive.map((l) => [`fits_${l.id}`, l.id === reuse])) },
      // Today every line goes to the model; `reuse` is the right decision of the trial.
      rule: { reuse: 'none' },
      reuse,
      source: `scritto per il banco (T325), ${p.universe}: persona da world/people.json`,
      ...(note ? { note } : {}),
    })),
  );
}

export function writeReuseCases(): string {
  fs.mkdirSync(path.dirname(REUSE_FILE), { recursive: true });
  fs.writeFileSync(
    REUSE_FILE,
    JSON.stringify(
      {
        group: 'battute',
        description: 'Le battute riusate (T325, idea (b)): l’archivio di ciò che una persona ha risposto, una domanda nuova, la circostanza di allora e di adesso. Le battute e le risposte giuste le ha scritte chi ha scritto il banco: vanno rilette.',
        cases: reuseCases(),
      },
      null,
      1,
    ) + '\n',
  );
  return REUSE_FILE;
}
