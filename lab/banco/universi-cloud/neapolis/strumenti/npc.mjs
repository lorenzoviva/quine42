// I dodici tipi di individui di Neapolis (npc.*): manifest e logic.lua. node lab/banco/universi-cloud/neapolis/strumenti/npc.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { lua } from './lua.mjs';

const DIR = 'lab/banco/universi-cloud/neapolis/modules';
const URBANE = ['corrente', 'lamiera', 'marea', 'asfalto', 'caffe', 'voce', 'sirena', 'pane', 'nebbia', 'motore', 'sutura', 'tufo', 'luce', 'fuoco', 'terra', 'vento'];
const CANONE = 'Delle rune sai ciò che sa la gente di città: lastre con un segno inciso che manda una luce tenue, sul marciapiede come nei giardini; alla radio ci ridono sopra, i ragazzi le vendono al mercatino, e chi ne ha pronunciata una lo racconta sottovoce.';

const NPC = [
  { id: 'npc.barista', name: 'Barista', model: 'persona', glyph: 'b', color: '#f0e0c0', aspetto: 'una persona col grembiule bianco e il papillon nero, uno strofinaccio sulla spalla', speed: [0.5, 0.4],
    description: 'Chi sta dietro il bancone di un bar di Neapolis: caffè, cornetti, pettegolezzi e caffè sospesi.', context: 'bar della piazza e chioschi del lungomare',
    persona: `Fai il barista a Neapolis: conosci tutti, parli veloce, servi caffè e pettegolezzi. ${CANONE}`,
    compra: { label: 'Prendi un caffè (cento lire)', oggetto: 'Tazzina di caffè', prezzo: 1, quanti: 1, testo: 'Ecco il caffè, bello mio: ristretto, come si deve. E un sorso d’acqua prima, mi raccomando.' },
    saluti: { mattina: 'Bonombo! Il primo caffè della giornata è il più importante: siediti.', giorno: 'Bonombo bonombo! Con questo caldo ci vuole una granita, altro che caffè.', sera: 'Bonombo. La sera in piazza si sta bene: le sedie sono fuori, siediti pure.', notte: 'Stiamo chiudendo, ma un caffè per te lo faccio lo stesso.' },
    rami: { quartiere: ['In piazza si sa tutto: chi si sposa, chi si separa, chi ha vinto al lotto e non l’ha detto.', 'Quelli del cantiere vengono a fare colazione e non pagano mai: segnano tutto sul conto del Comune, dicono.', 'Ti dico una cosa, ma non l’hai sentita da me: di notte, dal cantiere, escono camion senza targa.'],
      mestiere: ['Il caffè si fa con l’acqua giusta, la miscela giusta e la mano giusta. La mano non si compra.', 'Il caffè sospeso è una cosa seria: lo paghi per chi viene dopo, e non chiedi chi è.', 'Trent’anni dietro il bancone: ho visto passare sindaci, assessori e fidanzati. I clienti restano.'] },
    insisti: { quartiere: 'Più di così non ti dico. Ciok Ciok stasera ne parla, sentirai.', mestiere: 'Vuoi imparare? Vieni alle sei, ti metto a lavare le tazzine.', nessuno: 'Insisti su cosa? Prima prendi un caffè, poi parliamo.' },
    rune: { caffe: 'Quella col segno della tazzina? I ragazzi dicono che pronunciata ti sveglia meglio del mio caffè. Bugiardi.', pane: 'La runa della sfornata! Se funziona davvero, chiudo il bar e mi metto in pensione.', voce: 'Con quella runa in tasca dovresti fare il banditore al mercato, non il cliente al bar.', nebbia: 'Quella della foschia? Al porto la cercano tutti, per sparire quando arriva il padrone.' },
    altra: 'Una runa! Il professore del Colle te la paga bene, quella. Io? Io non ci tocco, porta male al bancone.', nessuna: 'Le rune? Alla radio ci ridono sopra. Ma se ne trovi una, fammela vedere.',
    stati: { nascosto: '(guarda attraverso di te, asciugando una tazzina) …C’è qualcuno? Mi era sembrato.', allerta: 'Che hai, gli occhi spalancati? Sembri uno dei vigili quando arriva l’assessore.', carico: 'Mamma mia, sei elettrico! Niente caffè per te oggi.', 'di corsa': 'Piano, piano! Qua si beve seduti, non è una gara.' },
    notte: 'È saltata la luce in tutta la piazza: chissà quelli del cantiere che hanno attaccato stavolta.' },
  { id: 'npc.giornalista', name: 'Giornalista', model: 'persona', glyph: 'g', color: '#c8b088', aspetto: 'una persona con l’impermeabile, un taccuino in mano e una penna dietro l’orecchio', speed: [0.8, 0.6],
    description: 'Cronisti e fotografi di Neapolis: il Mattino, Radio Ciok Ciok, le notizie prima degli altri.', context: 'redazioni del Corso, piazze, cantieri',
    persona: `Fai il giornalista a Neapolis: fai domande, prendi appunti, non riveli le fonti. ${CANONE}`,
    compra: { label: 'Compra il giornale (cento lire)', oggetto: 'Giornale del mattino', prezzo: 1, quanti: 1, testo: 'Tieni, fresco di stampa. Leggi bene la terza pagina: l’ho scritta io.' },
    saluti: { mattina: 'Bonombo. Hai letto il giornale? No? Allora non sai niente della città.', giorno: 'Bonombo, scusa, vado di fretta: c’è una conferenza stampa al Centro Direzionale.', sera: 'Bonombo. La sera la gente parla di più: è il momento migliore per fare domande.', notte: 'Chiudo il pezzo e vado a dormire. Forse.' },
    rami: { quartiere: ['La città cambia in fretta: il porto vuole le banchine, il cantiere vuole le strade, gli uffici vogliono tutto.', 'Al Centro Direzionale ci sono pratiche firmate due volte. Non chiedermi come lo so.', 'Se vedi un camion uscire dal cantiere dopo le dieci, segnati l’ora. Mi fai un favore.'],
      mestiere: ['Una notizia vera vale più di dieci comunicati del Comune.', 'Le fonti non si dicono. Mai. Nemmeno a mia madre.', 'Il mestiere è semplice: guardi, chiedi, verifichi, scrivi. È il verificare che fa perdere amici.'] },
    insisti: { quartiere: 'Vuoi aiutarmi davvero? Parla con l’impiegato timido della Torre C. Ma senza farti vedere.', mestiere: 'Se vuoi fare questo lavoro, comincia a portare sempre una penna.', nessuno: 'Insistere è il mio mestiere, non il tuo. Fai una domanda vera.' },
    rune: { voce: 'La runa della voce. Alla radio vorrebbero un microfono così: parli e la gente si sposta.', sirena: 'Quella del lampeggiante: con quella addosso arriveresti prima della polizia su ogni notizia.', nebbia: 'Una runa per non farsi vedere? Utile a chi fa il mio lavoro. Anche a chi fa il contrario.', corrente: 'La runa dei fili. Hai sentito che il cantiere stacca la luce al rione? Coincidenze.' },
    altra: 'Una runa vera. Ne ho scritto un articolo una volta: il direttore l’ha messo nella pagina degli spettacoli.', nessuna: 'Le rune? Una storia da scrivere, un giorno. Chi le raccoglie, chi le vende, chi le pronuncia.',
    stati: { nascosto: '(scrive sul taccuino senza alzare gli occhi) Strano, avrei giurato che qualcuno mi stesse leggendo da sopra la spalla.', allerta: 'Hai la faccia di chi ha visto qualcosa. Raccontami tutto, ora.', carico: 'Sei teso come un filo dell’alta tensione. Respira.', 'di corsa': 'Corri anche tu? Dove, al cantiere? Aspettami!' },
    notte: 'Buio in tutto il quartiere. Stanotte scrivo a lume di candela, e domani scrivo di chi ha staccato la luce.' },
  { id: 'npc.meccanico', name: 'Meccanico', model: 'persona', glyph: 'm', color: '#4a6a9a', aspetto: 'una persona con la tuta blu macchiata d’olio e una chiave inglese nella tasca', speed: [0.4, 0.4],
    description: 'Meccanici di Neapolis: motorini, taxi, furgoni, e qualche radio per i vicini.', context: 'officine dei Granili, piazzali, sotto il cavalcavia',
    persona: `Fai il meccanico a Neapolis: mani sporche, poche parole, lavori in contanti. ${CANONE}`,
    compra: { label: 'Compra un pezzo di ricambio (due monete)', oggetto: 'Pezzo di ricambio', prezzo: 2, quanti: 1, testo: 'Tieni, è usato ma va. Se si rompe, non l’hai comprato da me.' },
    saluti: { mattina: 'Bonombo. Se hai il motorino rotto, mettilo là in fila: prima i taxi.', giorno: 'Bonombo. Passami quella chiave, già che ci sei.', sera: 'Bonombo. Sto chiudendo, ma per un guasto vero apro sempre.', notte: 'A quest’ora? Ti è morto il motore in mezzo alla strada, eh?' },
    rami: { quartiere: ['Il Comune ha promesso di rifare il cavalcavia. Lo promette da quando ho aperto.', 'I ragazzi truccano i motorini e poi si lamentano che consumano. Io li sistemo e loro li ritruccano.', 'Di notte qualcuno prende il furgone dell’azienda della luce e va al porto. Non è Ciro. Ciro dorme.'],
      mestiere: ['Un motore ti dice tutto, basta ascoltarlo: tossisce, sbuffa, canta.', 'I pezzi nuovi costano, quelli vecchi si aggiustano. Io aggiusto.', 'Mia figlia sente un carburatore sbagliato da dieci metri. Io da cinque.'] },
    insisti: { quartiere: 'Non sono affari miei. Io riparo, non indago.', mestiere: 'Vuoi imparare? Prendi uno straccio e pulisci quel pezzo. Poi ne parliamo.', nessuno: 'Che vuoi? Parla chiaro, qui c’è da lavorare.' },
    rune: { motore: 'La runa del motorino! Se la pronunci, corri come un due tempi truccato. Ma il motore sei tu: attento.', corrente: 'Quella dei fili accende le cose? Allora dalla a Lucia, alla centralina.', lamiera: 'La runa della serranda. Ti protegge come una carrozzeria, dicono. Io preferisco il casco.', asfalto: 'Una runa che fa le strade? Il Comune dovrebbe comprarne cento.' },
    altra: 'Una runa. Pesa poco, non si rompe, non consuma: è l’unica cosa che non devo riparare.', nessuna: 'Rune? Mia madre dice che portano bene. Io dico che portano gente che fa domande.',
    stati: { nascosto: '(alza la testa dal motore, guarda in giro, scuote le spalle) Il vento.', allerta: 'Hai sentito anche tu quel rumore? Sembra una cinghia che slitta.', carico: 'Stai lontano dai cavi della batteria, che sei già carico abbastanza.', 'di corsa': 'Corri più tu dei motorini che riparo!' },
    notte: 'È saltata la corrente: il compressore si è fermato. Qualcuno ha attaccato qualcosa di grosso.' },
  { id: 'npc.medico', name: 'Medico', model: 'persona', glyph: '+', color: '#e8f0f0', aspetto: 'una persona col camice bianco sopra il maglione e uno stetoscopio al collo', speed: [0.6, 0.5],
    description: 'Medici e infermieri degli ospedali di Neapolis, del turno di giorno e di quello di notte.', context: 'pronto soccorso dei Pellegrini, ospedale del Colle',
    persona: `Fai il medico (o l’infermiere) in un ospedale di Neapolis: stanco, pratico, attento. ${CANONE}`,
    compra: { label: 'Fatti medicare (una moneta)', oggetto: 'Garza', prezzo: 1, quanti: 2, testo: 'Ecco due garze. E la prossima volta guarda dove metti i piedi: il basolato non perdona.' },
    saluti: { mattina: 'Bonombo… scusa, smonto adesso dal turno. Se non sanguini, ripassa domani.', giorno: 'Bonombo. Siediti, ti misuro la pressione: si vede da lontano che non dormi.', sera: 'Bonombo. Tra un’ora comincio la notte: dimmi tutto adesso.', notte: 'Pronto soccorso: chi è il prossimo? Ah, sei tu. Cosa ti sei fatto?' },
    rami: { quartiere: ['Nel rione ci si fa male per tre cose: i motorini, le scale e le liti in famiglia.', 'Dal cantiere arriva un operaio ferito ogni settimana. Nessuno fa denuncia.', 'L’altra notte un operaio mi ha detto che sotto la strada c’è un molo antico. Poi ha chiesto di non scriverlo.'],
      mestiere: ['La notte è lunga, ma la gente è più sincera: alle tre del mattino nessuno recita.', 'Garze, cerotti, disinfettante e pazienza: il resto è fortuna.', 'Ho ricucito metà del rione. L’altra metà la ricucirò.'] },
    insisti: { quartiere: 'Te l’ho detto: se vuoi saperne di più, chiedi ai vigili del cantiere. Uno dei due non dorme più.', mestiere: 'Se ti interessa, porta garze e cerotti al pronto soccorso: ci servono sempre.', nessuno: 'Non ho tempo per indovinelli. Sei ferito o no?' },
    rune: { sutura: 'La runa che ricuce. Se funziona come dicono, mi toglie metà del lavoro. Speriamo funzioni.', caffe: 'Quella della tazzina? Dammela, faccio la notte e domani anche il giorno.', sirena: 'La runa della sirena. Ne sento già abbastanza, di sirene.', nebbia: 'Una runa per sparire? Ne conosco di pazienti che la vorrebbero, per scappare prima delle dimissioni.' },
    altra: 'Una runa. In corsia ne abbiamo trovata una sotto un letto: l’abbiamo lasciata lì. Non si sa mai.', nessuna: 'Le rune? Non le prescrivo e non le vieto. Basta che non le ingoi.',
    stati: { nascosto: '(guarda la sala d’aspetto e conta) …Uno in meno. Va bene così.', allerta: 'Hai le pupille dilatate e il polso veloce. Siediti un attimo.', carico: 'Sei teso come una corda di violino. Hai bevuto troppi caffè?', 'di corsa': 'Non si corre nei corridoi! E nemmeno fuori, con quelle gambe.' },
    notte: 'È andata via la luce e il generatore dell’ospedale tossisce. Tienimi questa torcia, per favore.' },
  { id: 'npc.portuale', name: 'Portuale', model: 'persona', glyph: 'P', color: '#c87a3a', aspetto: 'una persona con la canottiera, gli stivali di gomma e un caschetto giallo sotto il braccio', speed: [0.5, 0.5],
    description: 'Portuali di Neapolis: gruisti, ormeggiatori, scaricatori e pescatori del Molo Vecchio.', context: 'banchine, pontili, magazzini del porto',
    persona: `Fai il portuale a Neapolis: lavoro duro, mare, sindacato, poche parole. ${CANONE}`,
    compra: { label: 'Compra le alici (due monete)', oggetto: 'Cassetta di alici', prezzo: 2, quanti: 1, testo: 'Pescate stanotte. Friggile subito, che domani non sono più loro.' },
    saluti: { mattina: 'Bonombo. Le barche sono rientrate, il mare era buono.', giorno: 'Bonombo. Attento alla gru: quando gira, non guarda chi passa.', sera: 'Bonombo. Stasera c’è l’assemblea al molo: si decide del porto.', notte: 'Bonombo. Di notte il porto è un altro posto: parla piano.' },
    rami: { quartiere: ['Il porto commerciale vuole le nostre banchine per i container. Noi abbiamo detto di no.', 'Al magazzino sette arrivano casse senza bolla, di notte. Le scarica gente che non è della compagnia.', 'Un signore in giacca ha offerto soldi per una firma. Gli abbiamo indicato dove finisce il molo.'],
      mestiere: ['Il nodo della bitta si impara una volta e non si scorda più.', 'La gru è come una bestia grossa: se la tratti bene, ti obbedisce.', 'Il mare dà e prende. Il porto pure.'] },
    insisti: { quartiere: 'Se vuoi vedere coi tuoi occhi, il magazzino sette sta in fondo alla banchina. Ma io non ti ho detto niente.', mestiere: 'Vuoi una mano a scaricare? Allora prendi quella cima e non lasciarla.', nessuno: 'Chi parla troppo al porto, finisce a nuotare.' },
    rune: { marea: 'La runa del mare che sale. I vecchi del molo la tengono sotto il cuscino: dicono che chiama il pesce.', nebbia: 'Quella della foschia… al porto la conoscono tutti. Chi la usa, di solito, non scarica pesce.', lamiera: 'La runa della serranda: ti protegge come un container. Utile, con le casse che cadono.', voce: 'Con quella runa faresti spostare anche la gru.' },
    altra: 'Una runa. Una volta ne è salita una sulla rete, insieme alle alici. L’abbiamo rimessa sul molo.', nessuna: 'Le rune? I pescatori le trovano sugli scogli, la mattina. Nessuno sa chi le mette.',
    stati: { nascosto: '(fa un nodo alla cima, fischiettando, senza voltarsi) …Mi pareva di aver sentito passi.', allerta: 'Hai la faccia di chi ha visto il libeccio arrivare. Che c’è?', carico: 'Sembri pronto a scaricare un container da solo.', 'di corsa': 'Non si corre sulla banchina! Ci si scivola e ci si bagna.' },
    notte: 'È saltata la luce anche sulle banchine: le gru sono ferme. Perfetto, per chi scarica senza bolla.' },
  { id: 'npc.elettricista', name: 'Elettricista', model: 'persona', glyph: 'e', color: '#f08030', aspetto: 'una persona con la tuta arancione dell’azienda, la cassetta degli attrezzi e un rotolo di nastro isolante', speed: [0.6, 0.5],
    description: 'Gli elettricisti dell’azienda comunale: cabine, quadri, lampioni e qualche favore agli amici.', context: 'cabine elettriche, cantieri, lampioni del rione',
    persona: `Fai l’elettricista dell’azienda comunale a Neapolis: conosci ogni cabina e ogni quadro. ${CANONE}`,
    compra: { label: 'Compra un fusibile (una moneta)', oggetto: 'Fusibile', prezzo: 1, quanti: 2, testo: 'Due fusibili, nuovi. Se salta il quadro di casa, non chiamare l’azienda: chiama me.' },
    saluti: { mattina: 'Bonombo. Stamattina tre lampioni spenti al rione: comincio da quelli.', giorno: 'Bonombo. Non toccare quel quadro: è vivo.', sera: 'Bonombo. A quest’ora si accendono i lampioni: se ne vedi uno spento, dimmelo.', notte: 'Sono di reperibilità. Se è saltata la corrente, lo so già.' },
    rami: { quartiere: ['Il cantiere stacca la luce del rione per collegare le sue pompe. Tre volte in un mese.', 'I contatori del cantiere girano al contrario. Chi li ha montati sapeva quello che faceva.', 'Di notte, alla cabina del cantiere, c’è un quadro che non è dell’azienda. Ha un lucchetto nuovo.'],
      mestiere: ['La corrente non perdona: o la rispetti, o ti segna. Guarda la mia mano.', 'Un quadro elettrico è come un condominio: ognuno tira il suo filo e nessuno paga le scale.', 'Fusibile, nastro, pazienza. E le scarpe di gomma.'] },
    insisti: { quartiere: 'Se vuoi vedere il quadro col lucchetto, è nella cabina dietro la recinzione del cantiere. Porta un cacciavite.', mestiere: 'Vuoi una mano? Trovami un fusibile bruciato: con un po’ di filo di rame lo rimettiamo a posto.', nessuno: 'Parla chiaro, che ho le mani occupate e il quadro acceso.' },
    rune: { corrente: 'La runa dei fili! Accende senza contatore. Se lo scopre l’azienda, la mettono a bilancio.', sirena: 'Quella del lampeggiante: luce rossa senza un filo. Me la presti per i lavori notturni?', lamiera: 'La runa della serranda. Peccato che non isoli dalla corrente.', luce: 'Una runa che fa luce! Se ne trovo dieci, il rione non resta più al buio.' },
    altra: 'Una runa. Nessun filo, nessuna batteria, e quella luce tenue. Non ci capisco niente, e mi piace.', nessuna: 'Le rune? Fanno luce senza corrente. Per uno come me è quasi un’offesa.',
    stati: { nascosto: '(controlla il tester, che segna qualcosa, poi niente) Strano. Una dispersione.', allerta: 'Hai i capelli dritti. Hai toccato qualcosa che non dovevi?', carico: 'Sei carico come un condensatore! Stammi lontano dal quadro.', 'di corsa': 'Corri? Allora corri alla cabina e dimmi se la spia è rossa.' },
    notte: 'Blackout. Lo sapevo: hanno attaccato di nuovo le pompe del cantiere. Stavolta li becco.' },
  { id: 'npc.edicolante', name: 'Edicolante', model: 'persona', glyph: 'E', color: '#3a8a4a', aspetto: 'una persona col gilet di lana, gli occhiali sulla punta del naso e un giornale piegato sotto il braccio', speed: [0.3, 0.3],
    description: 'Edicolanti di Neapolis: giornali, figurine, fotoromanzi, biglietti del tram e tutte le notizie del quartiere.', context: 'chioschi verdi delle piazze e del mercato',
    persona: `Fai l’edicolante a Neapolis: sai le notizie prima di tutti e le ripeti con gusto. ${CANONE}`,
    compra: { label: 'Compra le figurine (una moneta)', oggetto: 'Bustina di figurine', prezzo: 1, quanti: 2, testo: 'Due bustine. Se trovi il portiere della squadra, te lo cambio con tre doppioni.' },
    saluti: { mattina: 'Bonombo! I giornali sono appena arrivati: il cantiere è di nuovo in prima pagina.', giorno: 'Bonombo. Vuoi il fotoromanzo nuovo? È arrivato stamattina.', sera: 'Bonombo. Chiudo il chiosco, ma le notizie restano aperte.', notte: 'A quest’ora le edicole dormono. Io no, ma l’edicola sì.' },
    rami: { quartiere: ['Ciok Ciok ieri sera ha detto che il porto vende le banchine. Lo sa anche Ciok Ciok, quindi lo sanno tutti.', 'Il professore del Colle compra tutti i giornali che parlano di rune. Li tengo da parte per lui.', 'I gabbiani volano bassi sul mercato: domani piove. La radio dirà sole.'],
      mestiere: ['Un’edicola è una finestra: tu guardi fuori, la città guarda dentro.', 'Le figurine si vendono, i giornali si leggono, i fotoromanzi si nascondono.', 'Quarant’anni di giornali: ho letto più notizie io di un direttore.'] },
    insisti: { quartiere: 'Se vuoi sapere del professore, vai al Colle dei Gelsi, al belvedere. Ma porta qualcosa da vendergli.', mestiere: 'Il mestiere? Alzarsi alle quattro, non leggere i giornali che vendi, ricordarti chi compra cosa.', nessuno: 'Insisti? Prima compra qualcosa, che qui non è la biblioteca.' },
    rune: { voce: 'La runa della voce! Con quella, gli strilloni di una volta avrebbero venduto il doppio.', nebbia: 'Quella della foschia: i gabbiani spariscono quando c’è la foschia. E pure i debitori.', pane: 'La runa della sfornata. Al mercato ne parlano tutti, nessuno l’ha mai vista.', tufo: 'La runa del tufo: il professore del Colle dice che è la più vecchia della città.' },
    altra: 'Una runa! Al mercatino della domenica i ragazzi le vendono, ma metà sono pietre dipinte. Questa no: questa fa luce.', nessuna: 'Le rune? Il professore del Colle le compra tutte. Chissà cosa ci fa.',
    stati: { nascosto: '(sistema le riviste, borbotta) Il vento muove le pagine…', allerta: 'Che occhi! Sembri uno che ha letto la notizia prima che succeda.', carico: 'Sei agitato come un’edicola il giorno del derby.', 'di corsa': 'Corri, corri: il tram passa ogni dodici minuti, dice l’orario.' },
    notte: 'Buio pesto. Domani in prima pagina: il rione al buio, terza volta in un mese.' },
  { id: 'npc.tranviere', name: 'Autista', model: 'persona', glyph: 't', color: '#6a7a8a', aspetto: 'una persona con la divisa grigia e il berretto con la visiera, le chiavi del mezzo appese alla cintura', speed: [0.6, 0.6],
    description: 'Chi guida a Neapolis: tranvieri della linea 1, tassisti del piazzale, autisti di autobus.', context: 'capolinea, fermate, piazzali dei taxi',
    persona: `Guidi un mezzo a Neapolis (tram o taxi): conosci ogni strada, ogni scorciatoia, ogni ingorgo. ${CANONE}`,
    compra: { label: 'Compra un biglietto (una moneta)', oggetto: 'Biglietto del tram', prezzo: 1, quanti: 2, testo: 'Due biglietti. Timbrali, che il controllore di turno non perdona.' },
    saluti: { mattina: 'Bonombo. Il primo giro è il più bello: la città dorme ancora.', giorno: 'Bonombo. Il Corso è bloccato dal cantiere: si va per il lungomare.', sera: 'Bonombo. Ultimo giro e poi a casa.', notte: 'Le corse della notte: si guadagna di più, si dorme di meno.' },
    rami: { quartiere: ['La metropolitana non finirà mai: il cantiere ha chiuso il Corso tre volte.', 'Dal Centro Direzionale escono signori in giacca che parlano al telefono di «sistemare il molo».', 'Di notte un camion senza targa fa sempre lo stesso giro: cantiere, porto, cantiere.'],
      mestiere: ['Guidare in città è come ballare: se sai dove mette i piedi l’altro, non lo pesti.', 'Il tram non sorpassa e non si ferma in seconda fila: per questo è il re della strada.', 'Un buon autista conosce i nomi dei clienti, non le loro storie. Poi le storie arrivano lo stesso.'] },
    insisti: { quartiere: 'Vuoi vedere il camion? Aspetta la sera al cantiere della Linea 2, dalla parte del Pendino.', mestiere: 'Se ti serve un passaggio, chiedi. Ma paghi in lire, non in rune.', nessuno: 'Fermata a richiesta: dimmi dove vuoi andare, o scendi.' },
    rune: { motore: 'La runa del motorino! Con quella in tasca il mio mezzo andrebbe il doppio.', asfalto: 'Quella che fa le strade: dalla al Comune, che il Corso è tutto buche.', voce: 'La runa della voce: un clacson senza clacson.', sirena: 'Il lampeggiante! Con quella runa avrei la strada libera all’ora di punta.' },
    altra: 'Una runa. Una volta un cliente me ne ha lasciata una al posto del biglietto. L’ho tenuta: era più bella.', nessuna: 'Le rune? Ne vedo sui marciapiedi passando. Non mi fermo mai: ho l’orario.',
    stati: { nascosto: '(controlla lo specchietto, aggrotta la fronte) …Avrei giurato di aver fatto salire qualcuno.', allerta: 'Guardi la strada come uno che aspetta l’incidente. Rilassati.', carico: 'Sei teso come il pantografo del tram.', 'di corsa': 'Non serve correre dietro al tram: il prossimo passa tra dodici minuti. Forse.' },
    notte: 'È saltata la luce e i semafori lampeggiano tutti gialli. Stanotte si guida a orecchio.' },
  { id: 'npc.cuoca', name: 'Cuoco di trattoria', model: 'persona', glyph: 'c', color: '#e86a3a', aspetto: 'una persona col grembiule a fiori e un mestolo di legno in mano', speed: [0.4, 0.3],
    description: 'Chi cucina nelle trattorie e nelle pizzerie di Neapolis: ragù, pizze a portafoglio, cuoppi di alici.', context: 'trattorie e pizzerie dei rioni',
    persona: `Cucini in una trattoria o pizzeria di Neapolis: generoso, autoritario, la cucina è il tuo regno. ${CANONE}`,
    compra: { label: 'Mangia qualcosa (due monete)', oggetto: 'Pizza a portafoglio', prezzo: 2, quanti: 1, testo: 'Tieni, mangiala calda e piegata in quattro. Seduto, no: camminando, come si deve.' },
    saluti: { mattina: 'Bonombo. Il ragù è sul fuoco da un’ora: torna a mezzogiorno.', giorno: 'Bonombo! Siediti, mangia: sei magro come un lampione.', sera: 'Bonombo. Stasera c’è il cuoppo di alici: le ha portate il molo.', notte: 'La cucina è chiusa. Ma se hai fame, un panino lo trovo.' },
    rami: { quartiere: ['Una volta il rione era tutto una famiglia. Adesso ci sono le antenne e nessuno si parla.', 'Gli operai del cantiere ordinano e non pagano: dicono che paga il Comune. Il Comune chi?', 'Il pagosso del rione dice che sotto il cantiere c’è un molo antico. Lui le cose le sa.'],
      mestiere: ['Il ragù vuole tempo. Chi ha fretta, si compri un panino.', 'La pizza si piega in quattro e si mangia camminando: è il pranzo di chi lavora.', 'Il pomodoro giusto viene dal mercato del Pendino, la mattina presto. Dopo le nove, è tardi.'] },
    insisti: { quartiere: 'Te l’ho detto: chiedi al pagosso. O alla dottoressa, che i feriti del cantiere li ricuce lei.', mestiere: 'Vuoi imparare? Portami farina, pomodori e mozzarella, e ti faccio vedere.', nessuno: 'Insisti? Prima mangia, poi ragioniamo.' },
    rune: { pane: 'La runa della sfornata! Se sfama davvero, chiudo la cucina e vado al mare.', fuoco: 'Quella del fuoco. Attento alla cucina: qui c’è già abbastanza fuoco.', caffe: 'La runa della tazzina: dopo pranzo serve, eccome.', marea: 'La runa del mare. I pescatori dicono che chiama le alici. Speriamo.' },
    altra: 'Una runa. Mia nonna ne teneva una sopra il forno, per il pane. Il pane veniva buono lo stesso.', nessuna: 'Le rune? In cucina non servono. Servono mani e pazienza.',
    stati: { nascosto: '(mescola il ragù, assaggia, aggiunge sale) …C’è qualcuno in cucina? No.', allerta: 'Che hai? Sembri uno che ha sentito bruciare il sugo.', carico: 'Sei agitato. Siediti e mangia, che ti passa.', 'di corsa': 'Non si corre in trattoria! Si rovesciano i piatti.' },
    notte: 'Senza luce, la cucina va a gas e a candela. Come una volta. Quasi meglio.' },
  { id: 'npc.vigile', name: 'Vigile urbano', model: 'persona', glyph: 'v', color: '#f0f0f8', aspetto: 'una persona con la divisa bianca e blu, il casco coloniale e un fischietto', speed: [0.7, 0.5],
    description: 'I vigili urbani di Neapolis: traffico, multe, bancarelle, cantieri.', context: 'incroci, cantieri, vicoli del rione',
    persona: `Fai il vigile urbano a Neapolis: l’ordine prima di tutto, ma conosci la gente. ${CANONE}`,
    compra: { label: 'Paga una multa (due monete)', oggetto: 'Mappa della città', prezzo: 2, quanti: 1, testo: 'Pagata. Tieni anche questa pianta della città: così la prossima volta parcheggi dove si può.' },
    saluti: { mattina: 'Bonombo. Circolare, circolare: l’incrocio non è un salotto.', giorno: 'Bonombo. Hai visto un motorino rosso in seconda fila? Ho la multa pronta.', sera: 'Bonombo. Fine turno, quasi. Non farmi fare straordinari.', notte: 'Di notte la città ha altre regole. Io no.' },
    rami: { quartiere: ['Il cantiere ha più permessi che operai. Io controllo tutti, ma qualcuno mi dice di non controllare.', 'Mi hanno detto di non guardare dentro la recinzione dopo le dieci. Io guardo lo stesso.', 'Dal cantiere, di notte, esce un camion senza targa. Se lo fermo, perdo il posto. Se non lo fermo, perdo il sonno.'],
      mestiere: ['Una multa è una lezione con la ricevuta.', 'Il fischietto si usa poco: quando fischi, la gente deve fermarsi davvero.', 'Conosco ogni motorino del rione. E ogni scusa.'] },
    insisti: { quartiere: 'Se vuoi aiutare, porta qualcosa da quel cantiere: un documento, un pezzo, una prova. Io non posso entrare.', mestiere: 'Studia, che i commissari si fanno coi libri, non con le multe.', nessuno: 'Insisti? Attento che anche l’insistenza è un’infrazione.' },
    rune: { sirena: 'La runa della sirena! Me la presti per l’ora di punta?', asfalto: 'Una runa che fa le strade dritte. Il Corso ne avrebbe bisogno.', nebbia: 'La runa per sparire… Ecco come escono dal cantiere senza essere visti.', motore: 'La runa del motorino: niente targa, niente multa. Ingiusto.' },
    altra: 'Una runa. Non c’è articolo del codice che le vieti. Per ora.', nessuna: 'Rune? Se le metti sul marciapiede in fila, è occupazione di suolo pubblico.',
    stati: { nascosto: '(fischia a un motorino, poi si gira di scatto) …Chi va là? Niente.', allerta: 'Sei sull’attenti come una recluta. Che succede?', carico: 'Calma, calma. Un vigile nervoso basta e avanza.', 'di corsa': 'Alt! Eccesso di velocità, a piedi. Per stavolta, solo un richiamo.' },
    notte: 'Semafori spenti, lampioni spenti. Stanotte il traffico lo dirigo io, col fischietto.' },
  { id: 'npc.impiegato', name: 'Impiegato', model: 'persona', glyph: 'i', color: '#8a8a9a', aspetto: 'una persona con la giacca grigia, la cravatta e una cartellina di pratiche sotto il braccio', speed: [0.5, 0.4],
    description: 'Impiegati degli uffici di Neapolis: pratiche, timbri, archivi, riunioni e caffè delle undici.', context: 'torri del Centro Direzionale, uffici comunali',
    persona: `Lavori in un ufficio di Neapolis: pratiche, timbri, colleghi, capiufficio. ${CANONE}`,
    compra: { label: 'Chiedi una fotocopia (una moneta)', oggetto: 'Pratica timbrata', prezzo: 1, quanti: 1, testo: 'Ecco la copia, timbrata. Ma non dire a nessuno da dove viene.' },
    saluti: { mattina: 'Bonombo. Timbro il cartellino e arrivo: le pratiche non aspettano.', giorno: 'Bonombo. Pausa pranzo: un panino alla scrivania, come sempre.', sera: 'Bonombo. Esco tardi anche oggi: l’archivio non finisce mai.', notte: 'A quest’ora gli uffici sono vuoti. Quasi tutti.' },
    rami: { quartiere: ['La Torre C è mezza vuota. Di notte, però, al quattordicesimo piano c’è una luce accesa.', 'Le pratiche della Linea 2 hanno firme doppie, con date diverse. Le archivio io.', 'Un fascicolo è sparito per un giorno ed è tornato con una pagina in più. Me ne sono accorto solo io.'],
      mestiere: ['Il protocollo è la memoria della città. Se qualcuno lo sporca, la città dimentica.', 'Timbro, firma, archivio. Ogni pratica ha la sua cartellina, ogni cartellina il suo scaffale.', 'La capoufficio legge tutto. Quasi tutto.'] },
    insisti: { quartiere: 'Se vuoi la verità, cerca l’archivio delle pratiche. Una cartellina gialla, l’ultima a destra.', mestiere: 'Vuoi un consiglio? Non firmare mai una cosa che non hai letto.', nessuno: 'Per favore, a bassa voce: qui le pareti hanno le orecchie.' },
    rune: { nebbia: 'La runa della foschia… con quella potrei uscire dall’archivio senza farmi vedere.', caffe: 'La runa della tazzina: alle undici del mattino ne servirebbero due.', voce: 'Con la runa della voce farei sentire alla capoufficio quello che penso. Meglio di no.', corrente: 'La runa dei fili: al quattordicesimo piano qualcuno ha la luce senza contratto.' },
    altra: 'Una runa. Non c’è un modulo per denunciarla, quindi per l’ufficio non esiste.', nessuna: 'Le rune? Non sono di competenza di questo ufficio. Provi allo sportello accanto.',
    stati: { nascosto: '(alza gli occhi dalla pratica, si guarda attorno nervoso) …Chi ha aperto la porta?', allerta: 'Ti guardi attorno come me in ascensore. Ti segue qualcuno?', carico: 'Sei agitato. Anche io. Facciamo finta di niente.', 'di corsa': 'Non si corre negli uffici: la capoufficio sente i passi.' },
    notte: 'Blackout anche alla Torre C. Eppure, al quattordicesimo piano, c’è ancora una luce.' },
];

const GATTO = { id: 'npc.gatto', name: 'Gatto di quartiere', model: 'animale', glyph: 'f', color: '#808088', aspetto: 'un gatto di strada magro, con la coda dritta', speed: [1.6, 1.2],
  description: 'I gatti di Neapolis: del bar, del porto, dei cortili. Di tutti e di nessuno.', context: 'bar, moli, cortili dei rioni',
  persona: 'Sei un gatto di quartiere di Neapolis. Rispondi solo con versi, fusa e azioni descritte tra parentesi. Dormi sulle cose calde, rubi il pesce, segui chi ti dà da mangiare, se ne hai voglia.' };

function npcLua(n) {
  return `-- ${n.name}: dialoghi a rami (saluto, quartiere, lavoro, insistere), reazioni alle rune che il viandante porta
-- e agli stati che le rune pronunciate gli lasciano addosso, uno scambio in monete. Il discorso vive nel componente
-- "discorso" dell'entità; il buio del quartiere lo dice sys.quartiere.
local M = {}

local SALUTI = ${lua(n.saluti)}

local RAMI = ${lua(n.rami)}

local INSISTI = ${lua(n.insisti)}

local RUNE = ${lua(n.rune)}
local RUNA_ALTRA = ${lua(n.altra)}
local RUNA_NESSUNA = ${lua(n.nessuna)}
local ORDINE = ${lua(URBANE)}

local STATI = ${lua(n.stati)}
local STATI_ORDINE = { "nascosto", "allerta", "di corsa", "carico" }

local COMPRA = ${lua({ oggetto: n.compra.oggetto, prezzo: n.compra.prezzo, quanti: n.compra.quanti, testo: n.compra.testo })}

local BUIO = ${lua(n.notte)}

-- La parte del giorno, come la conta il kernel (un giorno dura 600 secondi).
local function fase()
  local p = ((time or 0) / 600 + 0.12) % 1
  if p < 0.12 or p >= 0.96 then return "mattina" end
  if p < 0.42 then return "giorno" end
  if p < 0.58 then return "sera" end
  return "notte"
end

local function stato_addosso(user)
  local st = ecs.get(user, "stati")
  if not st then return nil end
  for _, nome in ipairs(STATI_ORDINE) do
    if st[nome] then return nome end
  end
  return nil
end

local function discorso(id)
  local d = ecs.get(id, "discorso")
  return { ramo = (d and d.ramo) or "nessuno", passo = (d and d.passo) or 0 }
end

local function avanza(id, ramo)
  local d = discorso(id)
  local lista = RAMI[ramo]
  local passo = 1
  if d.ramo == ramo then passo = math.min(#lista, d.passo + 1) end
  ecs.set(id, "discorso", { ramo = ramo, passo = passo })
  return lista[passo]
end

local function al_buio()
  local q = ecs.first("quartiere")
  local s = q and ecs.get(q, "quartiere")
  return s and s.buio
end

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = ${n.speed[0]} + hash(id, 5) * ${n.speed[1]} end
  ecs.set(id, "discorso", { ramo = "nessuno", passo = 0 })
end

function M.on_act(id, user, action)
  local s = stato_addosso(user)
  if s == "nascosto" and action ~= "rune" then return STATI.nascosto end
  if action == "saluta" then
    if al_buio() then return BUIO end
    local t = SALUTI[fase()]
    if s then t = t .. " " .. STATI[s] end
    return t
  end
  if action == "quartiere" or action == "mestiere" then return avanza(id, action) end
  if action == "insisti" then
    return INSISTI[discorso(id).ramo] or INSISTI.nessuno
  end
  if action == "rune" then
    for _, token in ipairs(ORDINE) do
      if inventory.count(user, "rune:" .. token) > 0 then return RUNE[token] or RUNA_ALTRA end
    end
    return RUNA_NESSUNA
  end
  if action == "compra" then
    local it = items.find(COMPRA.oggetto)
    if not it then return "Oggi è finito tutto." end
    if inventory.count(user, "item.cento-lire") < COMPRA.prezzo then
      return "Non ti basta: servono " .. COMPRA.prezzo .. " monete da cento lire."
    end
    inventory.remove(user, "item.cento-lire", COMPRA.prezzo)
    inventory.add(user, it, COMPRA.quanti)
    return COMPRA.testo
  end
  return nil
end

return M
`;
}

function gattoLua() {
  return `-- Gatto di quartiere: si lascia accarezzare (o no), mangia ciò che gli dai, sente le rune che porti.
-- Il suo umore vive nel componente "umore" dell'entità.
local M = {}

local FUSA = {
  "(si struscia sulle tue gambe e fa le fusa come un motorino al minimo)",
  "(si gira a pancia in su, poi ti graffia appena la mano. Miao.)",
  "(chiude gli occhi a metà e ti guarda dall'alto in basso)",
}

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 1.6 + hash(id, 3) * 1.2 end
  ecs.set(id, "umore", { fiducia = math.floor(hash(id, 11) * 2) })
end

local function fiducia(id)
  local u = ecs.get(id, "umore")
  return (u and u.fiducia) or 0
end

function M.on_act(id, user, action)
  local st = ecs.get(user, "stati")
  if st and st["nascosto"] then return "(ti fissa dritto negli occhi, la coda gonfia: i gatti ti vedono anche nella foschia)" end
  if action == "accarezza" then
    if fiducia(id) < 1 then return "(si scansa con un salto e ti guarda offeso. Mrrr.)" end
    return FUSA[math.floor(hash(id, math.floor(time or 0)) * #FUSA) + 1]
  end
  if action == "sfama" then
    local cibo = nil
    for _, nome in ipairs({ "item.alici", "item.cornetto", "item.mozzarella" }) do
      if inventory.count(user, nome) > 0 then cibo = nome break end
    end
    if not cibo then return "(annusa le tue mani vuote e se ne va con la coda dritta)" end
    inventory.remove(user, cibo, 1)
    ecs.set(id, "umore", { fiducia = fiducia(id) + 1 })
    return "(mangia tutto in un boccone, si lecca i baffi e ti segue per tre passi. Miao!)"
  end
  if action == "rune" then
    if inventory.count(user, "rune:marea") > 0 then return "(annusa la tua tasca: sa di mare. Fa le fusa forte.)" end
    if inventory.count(user, "rune:corrente") > 0 then return "(il pelo gli si rizza tutto, come vicino a un quadro elettrico. Ffff!)" end
    return "(guarda la tua borsa delle rune, sbadiglia e si mette a dormire)"
  end
  return nil
end

return M
`;
}

const write = (n, logic, actions) => {
  mkdirSync(`${DIR}/${n.id}`, { recursive: true });
  const man = {
    id: n.id, name: n.name, kind: 'entity', version: '0.1.0', description: n.description, context: n.context, logic: 'logic.lua',
    appearance: { model: n.model, glyph: n.glyph, color: n.color, aspetto: n.aspetto },
    physics: { solid: false, radius: n.model === 'animale' ? 0.25 : 0.35, speed: n.speed[0] + n.speed[1] / 2 },
    components: { wander: { dx: 0, dy: 0, t: 0, speed: n.speed[0] + n.speed[1] / 2 } },
    interaction: { type: 'talk' }, persona: n.persona, actions, tags: ['neapolis', n.model === 'animale' ? 'animale' : 'abitante'],
  };
  writeFileSync(`${DIR}/${n.id}/manifest.json`, JSON.stringify(man, null, 2) + '\n');
  writeFileSync(`${DIR}/${n.id}/logic.lua`, logic);
};
for (const n of NPC)
  write(n, npcLua(n), [
    { id: 'saluta', label: 'Saluta' }, { id: 'quartiere', label: 'Chiedi del quartiere' }, { id: 'mestiere', label: 'Chiedi del lavoro' },
    { id: 'insisti', label: 'Insisti' }, { id: 'rune', label: 'Parla delle rune' }, { id: 'compra', label: n.compra.label, requires: 'item.cento-lire' },
  ]);
write(GATTO, gattoLua(), [{ id: 'accarezza', label: 'Accarezza' }, { id: 'sfama', label: 'Dagli da mangiare' }, { id: 'rune', label: 'Fagli annusare la borsa delle rune' }]);
console.log(`${NPC.length + 1} moduli npc`);
