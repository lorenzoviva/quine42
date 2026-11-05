// Le 8 trame di Neapolis (world/plots.json), le regole (world/rules.json) e lo stato iniziale (world/stato.json).
// node lab/banco/universi-cloud/neapolis/strumenti/trame.mjs
import { writeFileSync } from 'node:fs';
const D = 'lab/banco/universi-cloud/neapolis/world';
const T = (giorno, momento, chi, dove, cosa, battuta, indizio) => ({ giorno, momento, chi, dove, cosa, ...(battuta ? { battuta } : {}), ...(indizio ? { indizio } : {}) });
const P = (id, titolo, mistero, tappe, missione) => ({ id, titolo, mistero, coinvolti: [...new Set(tappe.map((t) => t.chi))], tappe, ...(missione ? { missione: { ...missione, stato: 'offerta' } } : {}), inizio: 0, stato: 'attiva' });
const trame = [
  P('trama-busta-gialla', 'La busta gialla della Torre C', 'Dario Fusco ha trovato pratiche della Linea 2 con firme doppie e vuole farle arrivare a Rosaria Vitale senza farsi scoprire dalla sua capoufficio.', [
    T(0, 'mattina', 'Dario Fusco', 'Torre C del Centro Direzionale', 'archivia le pratiche e nasconde una busta nell’ultimo cassetto', 'Non posso uscire con queste carte. Non oggi.', 'una busta gialla in fondo all’archivio della Torre C'),
    T(0, 'sera', 'Rosaria Vitale', 'Piazza delle Erbe', 'aspetta al bar una busta che non arriva', 'Doveva essere qui alle sette. Qualcuno l’ha spaventato.'),
    T(1, 'giorno', 'Sabrina Longo', 'Piazzale degli Uffici', 'controlla chi è entrato in archivio', 'Un fascicolo è sparito ed è tornato. Voglio sapere chi.', 'il registro delle chiavi dell’archivio'),
    T(2, 'sera', 'Rosaria Vitale', 'Redazione del Mattino', 'scrive l’articolo, se ha le carte', 'Con le prove, domani esce in prima pagina.'),
  ], { da: 'Rosaria Vitale', testo: 'Prendi la busta gialla dall’archivio della Torre C e portamela, senza farti vedere.', obiettivo: { tipo: 'porta', oggetto: 'Busta gialla', a: 'Rosaria Vitale' }, ricompensa: 'Biglietto dello stadio' }),
  P('trama-camion-notte', 'Il camion senza targa', 'Ogni notte un camion senza targa esce dal cantiere della Linea 2 e va al porto: chi lo guida e che cosa porta?', [
    T(0, 'notte', 'Franco Barone', 'Cantiere della Linea 2', 'fa finta di non vedere il camion che esce', 'Dopo le dieci io non guardo. Me l’hanno ordinato.', 'le tracce di gomme fresche davanti alla transenna'),
    T(1, 'notte', 'Anna Greco', 'Vico del Molo', 'segna l’ora in cui passa il camion', 'Mezzanotte e dieci, come ieri. Va al porto.'),
    T(2, 'mattina', 'Salvatore Iovine', 'Porto commerciale', 'trova il lucchetto nuovo del magazzino sette', 'Questo lucchetto non è della compagnia.', 'la chiave con l’etichetta «Mag. 7»'),
    T(3, 'sera', 'Anna Greco', 'Piazza delle Erbe', 'decide di fare rapporto al comando', 'La legge vale anche di notte.'),
  ], { da: 'Anna Greco', testo: 'Scopri dove va il camion senza targa: segui la strada dal cantiere fino al porto commerciale.', obiettivo: { tipo: 'vai', luogo: 'Porto commerciale' }, ricompensa: 'Mappa della città' }),
  P('trama-blackout', 'Il rione al buio', 'Il quartiere resta al buio certe notti: Ciro Amitrano è convinto che il cantiere stacchi la corrente per collegare le sue pompe con un quadro abusivo.', [
    T(0, 'notte', 'Ciro Amitrano', 'Cantiere della Linea 2', 'trova un quadro col lucchetto nuovo nella cabina del cantiere', 'Questo non l’ha montato l’azienda.', 'il contatore del cantiere che gira al contrario'),
    T(1, 'giorno', 'Lucia Sorrentino', 'Officine dei Granili', 'confronta i contatori della centralina', 'I numeri non mentono: quel quadro ruba corrente al rione.'),
    T(2, 'notte', 'Carla Ferrante', 'Pronto soccorso dei Pellegrini', 'lavora a lume di torcia durante il blackout', 'Il generatore tossisce. Se salta, opero al buio.'),
  ], { da: 'Ciro Amitrano', testo: 'Il quartiere è al buio: cambia il fusibile della cabina elettrica, e poi portami un fusibile bruciato come prova.', obiettivo: { tipo: 'porta', oggetto: 'Fusibile bruciato', a: 'Ciro Amitrano' }, ricompensa: 'Torcia elettrica' }),
  P('trama-molo-vecchio', 'Il Molo Vecchio non si vende', 'Il porto commerciale vuole le banchine dei pescatori per i container; un uomo in giacca ha offerto soldi a Salvatore Iovine per una firma.', [
    T(0, 'mattina', 'Pasquale Amato', 'Molo Vecchio', 'vede un uomo in giacca misurare le banchine', 'Quello non è un pescatore. Nemmeno un turista.'),
    T(1, 'sera', 'Salvatore Iovine', 'Porto commerciale', 'tiene l’assemblea dei portuali', 'Il molo è di chi ci lavora. Nessuno firma.'),
    T(2, 'giorno', 'Gilda Marino', 'Piazzale degli Uffici', 'sente un cliente parlare di «sistemare il molo» entro fine mese', 'Gente che parla troppo in macchina.', 'il nome di un ufficio della Torre C'),
    T(3, 'sera', 'Vincenzo Sannino', 'Mercato del Pendino', 'porta al cugino il giornale con la notizia', 'Lo sa anche Ciok Ciok, ormai.'),
  ], { da: 'Salvatore Iovine', testo: 'Parla con Gilda Marino, la tassista: ha sentito qualcosa in macchina su chi vuole il molo.', obiettivo: { tipo: 'parla', a: 'Gilda Marino' }, ricompensa: 'Cassetta di alici' }),
  P('trama-molo-antico', 'Il molo sotto la strada', 'Scavando la metropolitana sono venute fuori le pietre di un molo antico; i lavori si sono fermati e nessuno dice chi ha dato l’ordine.', [
    T(0, 'giorno', 'Franco Barone', 'Cantiere della Linea 2', 'tiene lontani i curiosi dallo scavo', 'Circolare, non c’è niente da vedere.'),
    T(1, 'mattina', 'Raffaele Sorrentino', 'Ospedale del Colle', 'racconta che il pagosso del rione ha visto le pietre', 'Dice che sono più vecchie della città.', 'un coccio liscio tra la terra smossa'),
    T(2, 'giorno', 'Marco De Luca', 'Corso Partenope', 'cerca di fotografare lo scavo', 'Una foto e lo sa tutta la città.'),
  ], { da: 'Marco De Luca', testo: 'Portami una prova dal cantiere: un pezzo del molo antico, anche piccolo.', obiettivo: { tipo: 'porta', oggetto: 'Coccio antico', a: 'Marco De Luca' }, ricompensa: 'Rullino fotografico' }),
  P('trama-locale-tonino', 'Il locale di Tonino', 'Tonino Cimmino vuole aprire un locale con la musica sul lungomare, ma ha paura di dirlo a sua madre Assunta.', [
    T(0, 'giorno', 'Tonino Cimmino', 'Lungomare delle Rondini', 'conta i soldi delle granite e sogna il suo locale', 'Un locale piccolo, con le sedie fuori e la radio accesa.'),
    T(1, 'sera', 'Anna Greco', 'Lungomare delle Rondini', 'gli dice che deve parlarne con la madre', 'Se non glielo dici tu, glielo dice Filomena.'),
    T(2, 'mattina', 'Assunta Cimmino', 'Piazza delle Erbe', 'scopre il progetto del figlio da Filomena', 'Un locale? E il bar chi lo tiene, i gatti?'),
    T(3, 'sera', 'Filomena Caputo', 'Piazza delle Erbe', 'convince Assunta a dare una possibilità al figlio', 'Assunta, il primo biglietto in vetrina l’hai appeso anche tu.'),
  ], { da: 'Tonino Cimmino', testo: 'Va’ in Piazza delle Erbe e parla con mia madre Assunta, prima che lo sappia da qualcun altro.', obiettivo: { tipo: 'parla', a: 'Assunta Cimmino' }, ricompensa: 'Granita al limone' }),
  P('trama-ragu-domenica', 'La sfida del ragù', 'Al rione c’è una vecchia rivalità di cucina: Carmela Esposito dice che i giovani non sanno fare il ragù, e Gaetano Cozzolino vuole dimostrare il contrario alla festa di quartiere.', [
    T(0, 'mattina', 'Carmela Esposito', 'Vico delle Lavandaie', 'sceglie i pomodori al mercato', 'Il pomodoro giusto si sceglie con le mani, non con gli occhi.'),
    T(1, 'giorno', 'Gaetano Cozzolino', 'Vico del Vesuvietto', 'prova il suo ragù per la festa', 'Il mio ragù farà piangere anche Carmela.'),
    T(2, 'sera', 'Nunzia Esposito', 'Vico delle Lavandaie', 'assaggia i due ragù e non vuole scegliere', 'Nonna, sono buoni tutti e due. Davvero.'),
  ], { da: 'Carmela Esposito', testo: 'Per il ragù della festa mi servono i pomodori del Pendino: portamene.', obiettivo: { tipo: 'porta', oggetto: 'Pomodori', a: 'Carmela Esposito' }, ricompensa: 'Ragù della domenica' }),
  P('trama-luce-torre', 'La luce al quattordicesimo piano', 'Al quattordicesimo piano della Torre C, che risulta vuoto, di notte c’è una luce accesa: chi ci lavora, e senza contratto della luce?', [
    T(0, 'notte', 'Marco De Luca', 'Torre C del Centro Direzionale', 'fotografa la finestra accesa', 'Ecco: quattordicesimo piano. Vuoto, dicono.'),
    T(1, 'giorno', 'Lucia Sorrentino', 'Officine dei Granili', 'scopre che la Torre C non ha contratto per quel piano', 'Corrente senza contatore. Come al cantiere.', 'un cavo che dal cantiere sale alla torre'),
    T(2, 'notte', 'Dario Fusco', 'Torre C del Centro Direzionale', 'sente un telefono squillare di sopra', 'C’è qualcuno, lassù. Ogni notte.'),
  ], { da: 'Lucia Sorrentino', testo: 'Va’ alla Torre C del Centro Direzionale e guarda tu stesso: se la luce è accesa di notte, ho ragione io.', obiettivo: { tipo: 'vai', luogo: 'Torre C del Centro Direzionale' }, ricompensa: 'Fusibile' }),
];
writeFileSync(`${D}/plots.json`, JSON.stringify({ trame }, null, 2) + '\n');
const R = (chiave, testo, possibile, racconto, effetti) => ({ chiave, testo, possibile, racconto, ...(effetti ? { effetti } : {}) });
const regole = [
  R('caffe-sospeso', 'al bar si può lasciare pagato un caffè per chi verrà dopo, e prenderne uno sospeso', true, 'Il caffè sospeso è un’usanza della città: chi lo lascia non lo dice, chi lo prende non chiede.', ['crea_oggetto']),
  R('motorino-seconda-fila', 'un motorino in seconda fila si può accendere e guidare, se ha la miscela', true, 'Il motorino parte con una nuvola blu e porta lontano in fretta.', ['stato']),
  R('cabina-elettrica', 'un fusibile nuovo nella cabina elettrica ridà la luce al quartiere quando salta', true, 'Il colpo secco del fusibile, e i lampioni che si riaccendono uno dopo l’altro.', ['messaggio']),
  R('cantiere-di-notte', 'di notte il cantiere della Linea 2 non si attraversa: le recinzioni sono chiuse e c’è chi sorveglia', false, 'Le recinzioni del cantiere sono alte e qualcuno, di notte, punta le torce su chi si avvicina.'),
  R('tram-gratis', 'sul tram si sale solo col biglietto timbrato', true, 'Il controllore della linea 1 non perdona: biglietto timbrato o multa.'),
  R('gru-del-porto', 'le gru del porto le manovrano solo i gruisti della compagnia', false, 'Le cabine delle gru sono chiuse a chiave e i portuali non lasciano salire nessuno.'),
  R('rune-in-vendita', 'le rune si possono vendere e comprare al mercatino della domenica', true, 'I ragazzi le vendono sul telo, accanto ai fumetti; metà sono pietre dipinte, l’altra metà fanno luce.'),
];
writeFileSync(`${D}/rules.json`, JSON.stringify({ regole }, null, 2) + '\n');
writeFileSync(`${D}/stato.json`, JSON.stringify({ consumati: [], contenitori: {}, forme: {}, rari: {}, ora: 30 }, null, 1) + '\n');
console.log(`${trame.length} trame, ${regole.length} regole`);
