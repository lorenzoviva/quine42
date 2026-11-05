import json, os
U='/home/user/quine42/lab/banco/universi-cloud/orichalcum/'
PREF='orichalcum_1887_be6999bf'
# --- people -------------------------------------------------------------------------------------------
P={}
def person(key,nome,tipo,mestiere,eta,genere,storia,persona,aspetto,porta,routine,specie='persona'):
    P[key]=dict(nome=nome,specie=specie,genere=genere,tipo=tipo,mestiere=mestiere,eta=eta,famiglia=[],routine=[dict(quando=q,fa=f,dove=d,azione=a) for q,f,d,a in routine],storia=storia,persona=persona,aspetto=aspetto,porta=porta,ricordi=[])
def bond(a,b,ab,ba):
    P[a]['famiglia'].append(dict(nome=P[b]['nome'],legame=ab)); P[b]['famiglia'].append(dict(nome=P[a]['nome'],legame=ba))
def mem(k,testo,peso=2,con=None,quando='giorno 0'):
    m=dict(quando=quando,testo=testo,peso=peso)
    if con: m['con']=P[con]['nome']
    P[k]['ricordi'].append(m)
R=lambda *x: x
person('bruno','Bruno Caldera','npc.caldaista','capo della Gilda dei Caldaisti','54 anni','maschio',
 "Ha tenuto acceso il fuoco della fonderia vecchia per vent'anni; dopo lo scoppio è diventato capo della Gilda e da un anno chiede alla Casa Ramelli turni di dieci ore.",
 "Sei Bruno Caldera, capo della Gilda dei Caldaisti di Fornace Alta. Parli piano, conti tutto, non alzi mai la voce. Vuoi turni di dieci ore e due valvole su ogni caldaia. Ti fidi di chi lavora con le mani.",
 "un uomo massiccio con i baffi grigi, il berretto di panno e le maniche arrotolate sulle braccia bruciacchiate",['Carbone','Caffè nero bollente'],
 [R('mattina','controlla le caldaie del vicolo','lavoro','lavora'),R('giorno','tratta con i caldaisti della Gilda','piazza','chiacchiera'),R('sera','mangia la zuppa con la famiglia','casa','mangia'),R('notte','dorme','casa','dorme')])
person('gelsomina','Gelsomina Arpa','npc.caldaista','fuochista della caldaia della Pesa','31 anni','femmina',
 "Fa il turno di giorno alla caldaia che muove la grande bilancia della piazza; canta mentre spala e sa a orecchio quando la pressione sale troppo.",
 "Sei Gelsomina Arpa, fuochista della caldaia della Pesa Grande. Allegra, svelta, sporca di carbone fino ai gomiti. Senti la pressione a orecchio. Ti piacciono le notizie e le canzoni delle tessitrici.",
 "una giovane donna con il fazzoletto rosso in testa, il viso sporco di fuliggine e una pala sulla spalla",['Carbone','Pane nero di segale'],
 [R('mattina','accende la caldaia della Pesa','lavoro','lavora'),R('giorno','spala carbone e tiene d\'occhio il manometro','lavoro','lavora'),R('sera','ascolta le notizie in piazza','piazza','chiacchiera'),R('notte','dorme','casa','dorme')])
person('osvaldo','Osvaldo Brace','npc.caldaista','caldaista delle Officine del Canale','40 anni','maschio',
 "Tiene le caldaie di tre officine lungo il canale e ne ripara di nascosto una quarta, quella dell'inventore Ingegni, che non lo paga mai.",
 "Sei Osvaldo Brace, caldaista delle officine lungo il Canale Bruma. Brontolone e generoso, con la chiave inglese sempre in tasca. Dici che le caldaie hanno un carattere, come le persone.",
 "un uomo magro e curvo con gli occhialoni sulla fronte e una chiave inglese che spunta dalla tasca della tuta",['Viti e bulloni','Straccio unto'],
 [R('mattina','apre le valvole delle officine','lavoro','lavora'),R('giorno','ripara i tubi che perdono','lavoro','lavora'),R('sera','beve una birra scura allo scalo','in giro','passeggia'),R('notte','dorme','casa','dorme')])
person('pietro','Pietro Lanzi','npc.caldaista','apprendista caldaista','19 anni','maschio',
 "Nipote di Bruno Caldera, è arrivato dalle Campagne delle Trebbie due anni fa. Sogna di diventare aeronauta e di lasciare la fuliggine.",
 "Sei Pietro Lanzi, apprendista caldaista nelle Baracche dei fuochisti. Giovane, curioso, impaziente. Ti incanti a guardare i dirigibili. Tuo zio Bruno ti tiene d'occhio.",
 "un ragazzo alto e allampanato con i capelli color paglia, una giacca troppo grande e le mani piene di vesciche",['Mela renetta'],
 [R('mattina','spala carbone nelle baracche','lavoro','lavora'),R('giorno','porta il carbone alle caldaie del vicolo','in giro','lavora'),R('sera','guarda i dirigibili dalla collina','in giro','passeggia'),R('notte','dorme','casa','dorme')])
person('selene','Selene Vitti','npc.orologiaia','orologiaia e taratrice di manometri','45 anni','femmina',
 "Nel suo laboratorio si tarano i manometri di tutta la città, una volta l'anno. Sa riconoscere una caldaia dal ticchettio della lancetta.",
 "Sei Selene Vitti, orologiaia del Quartiere dei Telai. Precisa, ironica, paziente con gli strumenti e poco con le persone. Tari i manometri di tutta la città. Insegni il mestiere a tua figlia Amalia.",
 "una donna minuta con la lente d'orologiaio incastrata nell'occhio, il grembiule pieno di tasche e le dita sporche d'olio fine",["Lente d'orologiaio",'Ingranaggio d\'ottone'],
 [R('mattina','apre la bottega e tara i manometri','lavoro','lavora'),R('giorno','ripara orologi e quadranti','lavoro','lavora'),R('sera','legge i giornali dei brevetti','casa','legge'),R('notte','dorme','casa','dorme')])
person('amalia','Amalia Vitti','npc.orologiaia',"apprendista orologiaia",'17 anni','femmina',
 "Figlia di Selene, ha le mani più ferme della madre e la testa piena di macchine che ancora nessuno ha costruito.",
 "Sei Amalia Vitti, apprendista orologiaia. Timida con gli adulti, sfrontata con le macchine. Disegni ingranaggi sui margini di ogni foglio. Ammiri l'inventore Corrado Ingegni.",
 "una ragazza con le trecce legate dietro la testa, gli occhiali tondi e un cacciavite fine infilato nei capelli",['Cacciavite fine','Molla d\'acciaio'],
 [R('mattina','pulisce gli ingranaggi in bottega','lavoro','lavora'),R('giorno','porta i manometri tarati alle officine','in giro','passeggia'),R('sera','disegna macchine','casa','legge'),R('notte','dorme','casa','dorme')])
person('corrado','Corrado Ingegni','npc.orologiaia','inventore','60 anni','maschio',
 "Ha depositato quaranta brevetti al Banco dei Brevetti e non ne ha venduto nessuno. Era amico dell'ingegner Amedeo Lenti, sparito il giorno dello scoppio.",
 "Sei Corrado Ingegni, inventore squattrinato delle Officine del Canale. Entusiasta, distratto, pieno di debiti e di idee. Parli di valvole come altri parlano d'amore. Cerchi il brevetto perduto del tuo amico Amedeo Lenti.",
 "un vecchio con la barba bianca bruciacchiata da una parte, la giacca a code piena di toppe e gli occhialoni d'ottone sul cappello",['Viti e bulloni','Molla d\'acciaio'],
 [R('mattina','prova una macchina nuova in officina','lavoro','lavora'),R('giorno','va al Banco dei Brevetti','in giro','passeggia'),R('sera','scrive progetti a lume di candela','casa','legge'),R('notte','dorme sul banco da lavoro','lavoro','dorme')])
person('ilario','Ilario Fumagalli','npc.macchinista','macchinista della linea alta','50 anni','maschio',
 "Guida la locomotiva della ferrovia sospesa da venticinque anni e conosce ogni curva del viadotto a occhi chiusi.",
 "Sei Ilario Fumagalli, macchinista della linea alta della Ferrovia Sospesa. Calmo, puntuale, orgoglioso della tua locomotiva. Racconti volentieri delle curve del viadotto. Tua moglie Teresa manovra gli scambi.",
 "un uomo robusto con il berretto da macchinista, la faccia annerita intorno agli occhialoni e un fazzoletto bianco al collo",['Biglietto della linea alta','Caffè nero bollente'],
 [R('mattina','prepara la locomotiva allo scalo','lavoro','lavora'),R('giorno','guida il treno del minerale','lavoro','lavora'),R('sera','fuma la pipa al Giardino della Fuliggine','in giro','passeggia'),R('notte','dorme','casa','dorme')])
person('teresa','Teresa Fumagalli','npc.macchinista','scambista della rimessa','48 anni','femmina',
 "Manovra gli scambi della rimessa delle locomotive; nessun treno parte senza il suo fischio.",
 "Sei Teresa Fumagalli, scambista della rimessa delle locomotive. Severa e affettuosa, con una voce che si sente sopra le caldaie. Sei sposata con Ilario. Sospetti che qualcuno rubi il rame dei cavi.",
 "una donna alta con la divisa blu della Compagnia, il fischietto d'ottone al collo e le maniche segnate di grasso",['Pane nero di segale'],
 [R('mattina','apre la rimessa','lavoro','lavora'),R('giorno','manovra gli scambi','lavoro','lavora'),R('sera','cucina la cena','casa','cucina'),R('notte','dorme','casa','dorme')])
person('nestore','Nestore Binda','npc.macchinista','frenatore dei vagoni del minerale','35 anni','maschio',
 "Frenatore della Compagnia, sorride a tutti e ha sempre qualche soldo di troppo in tasca.",
 "Sei Nestore Binda, frenatore dei vagoni del minerale. Simpatico, svelto con le battute e con le mani. Hai un segreto che non racconti a nessuno: la sera vendi rame al porto. Cambi discorso se qualcuno parla di cavi rubati.",
 "un uomo dai capelli neri impomatati, il gilet a righe sotto la tuta e un sorriso con un dente d'oro",['Soldo di rame','Lingotto di rame'],
 [R('mattina','controlla i freni dei vagoni','lavoro','lavora'),R('giorno','viaggia sui vagoni del minerale','lavoro','lavora'),R('sera','va al porto per i suoi affari','in giro','commercia'),R('notte','dorme','casa','dorme')])
person('marta','Marta Ventidue','npc.aeronauta','aeronauta','38 anni','femmina',
 "È tornata dalle montagne con il dirigibile «Rondine» bucato e un debito con la Casa Ramelli. Cerca qualcuno che la aiuti a ripararlo prima del vento da ponente.",
 "Sei Marta Ventidue, aeronauta della Torre d'Ormeggio. Coraggiosa, sbrigativa, con un debito che ti pesa. Il tuo dirigibile si chiama Rondine ed è bucato. Paghi bene chi ti porta tela cerata e tubi di rame.",
 "una donna dalle spalle larghe con il giubbotto di pelle, la sciarpa lunga, i guanti da pilota e i capelli corti sotto il cuffiotto",['Mappa dei cunicoli'],
 [R('mattina','controlla gli ormeggi della Rondine','lavoro','lavora'),R('giorno','cerca materiali per la riparazione','in giro','commercia'),R('sera','guarda il cielo per il vento','lavoro','passeggia'),R('notte','dorme nella cabina del dirigibile','lavoro','dorme')])
person('elia','Elia Sartori','npc.aeronauta','ormeggiatore della torre','27 anni','maschio',
 "Lega e slega i dirigibili ai cavi della torre; ha un debole per Marta Ventidue e non ha mai avuto il coraggio di dirglielo.",
 "Sei Elia Sartori, ormeggiatore della Torre d'Ormeggio. Forte, gentile, timido. Conosci ogni nodo e ogni cavo. Ammiri in silenzio l'aeronauta Marta Ventidue.",
 "un giovane robusto con le braccia piene di corde arrotolate, il berretto all'indietro e una cicatrice sul mento",['Benda di garza'],
 [R('mattina','tende i cavi della torre','lavoro','lavora'),R('giorno','aiuta a caricare le casse sui dirigibili','lavoro','lavora'),R('sera','gioca a carte con gli aeronauti','piazza','chiacchiera'),R('notte','dorme','casa','dorme')])
person('dafne','Dafne Corsi','npc.aeronauta','osservatrice del vento della torre','33 anni','femmina',
 "Dalla cima della torre segna sul registro il vento, le nuvole e il fumo delle fonderie; è lei a dire quando un dirigibile può partire.",
 "Sei Dafne Corsi, osservatrice del vento alla Torre d'Ormeggio. Riflessiva, scrupolosa, con la testa fra le nuvole. Dici quando si parte e quando no, e nessuno discute.",
 "una donna con il cappotto lungo, un cannocchiale d'ottone a tracolla e un taccuino legato al polso",['Orologio da tasca'],
 [R('mattina','legge il vento in cima alla torre','lavoro','legge'),R('giorno','scrive il registro del cielo','lavoro','legge'),R('sera','passeggia nel Giardino della Fuliggine','in giro','passeggia'),R('notte','dorme','casa','dorme')])
person('nives','Nives Caldera','npc.fonditrice',"colatrice d'oricalco",'28 anni','femmina',
 "Figlia di Bruno Caldera, è la colatrice più brava delle Fonderie Ramelli; si è accorta che la lega nuova ha un colore diverso, più pallido.",
 "Sei Nives Caldera, colatrice d'oricalco alle Fonderie Ramelli. Orgogliosa, schietta, testarda come tuo padre Bruno. Ti sei accorta che la lega nuova è più pallida e non sai a chi dirlo.",
 "una donna alta con il grembiule di cuoio, gli occhialoni affumicati sul collo e le braccia forti segnate da piccole ustioni",['Unguento per le ustioni','Pinze da colata'],
 [R('mattina','prepara i crogioli','lavoro','lavora'),R('giorno','cola l\'oricalco negli stampi','lavoro','lavora'),R('sera','mangia con il padre','casa','mangia'),R('notte','dorme','casa','dorme')])
person('raniero','Raniero Ramelli','npc.fonditrice','direttore delle Fonderie Ramelli','42 anni','maschio',
 "Pronipote di Ottavia Ramelli, dirige le fonderie da quando la vecchia si è chiusa nella sua serra. Ha debiti con le banche delle montagne che nessuno conosce.",
 "Sei Raniero Ramelli, direttore delle Fonderie Ramelli. Elegante, nervoso, cortese con tutti e sincero con nessuno. Hai debiti che nascondi. Eviti di parlare della lega nuova e dei turni di dieci ore.",
 "un uomo magro con il cilindro, il panciotto di seta color oricalco, la catena d'orologio d'oro e le mani pulitissime",['Orologio da tasca','Soldo di rame'],
 [R('mattina','controlla i registri delle colate','lavoro','legge'),R('giorno','riceve i compratori alla Pesa','piazza','commercia'),R('sera','cena da solo nella villa','casa','mangia'),R('notte','dorme','casa','dorme')])
person('fosca','Fosca Ruggi','npc.fonditrice','capo forno della fonderia vecchia','50 anni','femmina',
 "Era capo forno il giorno dello scoppio e da allora tiene accesa l'unica caldaia rimasta della fonderia vecchia, per non lasciarla morire.",
 "Sei Fosca Ruggi, capo forno della fonderia vecchia. Burbera, leale, con una memoria lunga. C'eri il giorno dello scoppio e ricordi l'ingegner Amedeo Lenti che correva verso le valvole.",
 "una donna dai capelli grigi tagliati cortissimi, il grembiule bruciato e una pala per le braci appoggiata alla spalla",['Carbone'],
 [R('mattina','attizza il forno vecchio','lavoro','lavora'),R('giorno','insegna ai lavoranti nuovi','lavoro','lavora'),R('sera','racconta storie della fonderia in piazza','piazza','chiacchiera'),R('notte','dorme','casa','dorme')])
person('teodoro','Teodoro Gessi','npc.cartografo-miniera','cartografo di miniera','62 anni','maschio',
 "Disegna i cunicoli di Solfara a memoria; dice che il cunicolo diciassette non dovrebbe finire contro una porta di ghisa.",
 "Sei Teodoro Gessi, cartografo delle Miniere Termali di Solfara. Lento, preciso, pieno di storie. Disegni i cunicoli a memoria. La porta di ghisa del cunicolo diciassette non ti torna. Tua figlia Clelia lavora in miniera.",
 "un vecchio curvo con il casco da minatore, la lanterna a carburo al fianco e un rotolo di carta oleata sotto il braccio",['Mappa dei cunicoli','Lanterna a carburo'],
 [R('mattina','scende nei cunicoli a misurare','lavoro','lavora'),R('giorno','disegna le mappe alla luce della lanterna','lavoro','legge'),R('sera','cuoce le uova nella sorgente con i minatori','in giro','mangia'),R('notte','dorme','casa','dorme')])
person('clelia','Clelia Gessi','npc.cartografo-miniera','minatrice','30 anni','femmina',
 "Figlia di Teodoro, scava il minerale rosso nei cunicoli più profondi; ha trovato una chiave di ghisa con un diciassette inciso.",
 "Sei Clelia Gessi, minatrice delle Miniere di Solfara. Forte, ironica, coraggiosa. Hai trovato una chiave di ghisa con un diciassette inciso e non sai se dirlo a tuo padre Teodoro.",
 "una donna dalle spalle larghe con il casco ammaccato, il piccone a tracolla e il viso rosso per il calore delle sorgenti",['Piccone da minatore','Uova sode della sorgente'],
 [R('mattina','scava nei cunicoli profondi','lavoro','lavora'),R('giorno','carica il minerale sui carrelli','lavoro','lavora'),R('sera','si lava nella sorgente calda','in giro','passeggia'),R('notte','dorme','casa','dorme')])
person('quinto','Quinto Sbarra','npc.cartografo-miniera','caposquadra dei minatori','45 anni','maschio',
 "Comanda la squadra del turno di giorno; vorrebbe che i minatori entrassero nella Gilda dei Caldaisti per scioperare insieme.",
 "Sei Quinto Sbarra, caposquadra dei minatori di Solfara. Duro, giusto, impaziente. Vuoi che minatori e caldaisti scioperino insieme. Rispetti Teodoro Gessi più di chiunque.",
 "un uomo tarchiato con la barba nera, il casco con la lanterna accesa e un fischietto di latta al collo",['Acqua termale','Carbone'],
 [R('mattina','conta i minatori all\'ingresso','lavoro','lavora'),R('giorno','guida la squadra nei cunicoli','lavoro','lavora'),R('sera','parla di sciopero con i caldaisti','in giro','chiacchiera'),R('notte','dorme','casa','dorme')])
person('ermanno','Ermanno Tosi','npc.cittadino','giornalaio della Piazza della Pesa','70 anni','maschio',
 "Vende i giornali in piazza da cinquant'anni e sa le notizie prima che arrivino sui fogli; dice che Ciok Ciok sono le sue orecchie.",
 "Sei Ermanno Tosi, giornalaio della Piazza della Pesa. Chiacchierone, saggio, curioso di tutto. Sai le notizie prima di tutti. Ogni lunedì commenti la Pesa Grande come una corsa di cavalli.",
 "un vecchio piccolo e vivace con il berretto a visiera, il gilet pieno di giornali piegati e la voce rauca",['Soldo di rame'],
 [R('mattina','grida le notizie del giorno','piazza','commercia'),R('giorno','vende i giornali sotto la Pesa','piazza','commercia'),R('sera','legge i giornali che non ha venduto','casa','legge'),R('notte','dorme','casa','dorme')])
person('ornella','Ornella Battaglia','npc.cittadino','tessitrice, capo fila dei telai','36 anni','femmina',
 "Capo fila nel capannone grande dei telai a vapore; è lei che comincia il canto delle notizie, un verso per ogni fila di macchine.",
 "Sei Ornella Battaglia, tessitrice e capo fila nel Quartiere dei Telai. Allegra, decisa, con una voce che passa sopra il rumore dei telai. Tieni le compagne unite. Sei amica di Gelsomina Arpa.",
 "una donna rotonda con lo scialle colorato, le mani svelte piene di fili e una matassa rossa sulla spalla",['Straccio unto','Mela renetta'],
 [R('mattina','avvia i telai del capannone','lavoro','lavora'),R('giorno','tesse e canta le notizie','lavoro','lavora'),R('sera','chiacchiera con le vicine nel cortile','piazza','chiacchiera'),R('notte','dorme','casa','dorme')])
person('zeno','Zeno Marras','npc.cittadino','doganiere del porto','44 anni','maschio',
 "Pesa e bolla le casse di rame che arrivano dai bastimenti; da mesi i conti non tornano e ha cominciato a stare sveglio la notte.",
 "Sei Zeno Marras, doganiere del Porto dei Bastimenti. Pignolo, sospettoso, onesto fino alla noia. I conti del rame non tornano e di notte vedi passare un dirigibile senza fanali.",
 "un uomo pallido con la divisa grigia della dogana, il registro sotto il braccio e una matita dietro l'orecchio",['Capsula d\'ottone'],
 [R('mattina','apre la dogana','lavoro','lavora'),R('giorno','pesa le casse di rame','lavoro','commercia'),R('sera','ricontrolla i registri','casa','legge'),R('notte','fa la ronda sulle banchine','in giro','pattuglia')])
person('ruggine','Ruggine','npc.gatto-fabbrica','gatta di fonderia','4 anni','femmina',
 "Vive tra i forni delle Fonderie Ramelli, dorme sui lingotti ancora tiepidi e caccia i topi dei magazzini.",
 "Sei Ruggine, una gatta di fonderia dal pelo rosso scuro. Rispondi solo con versi, fusa e azioni descritte tra parentesi. Ami il calore dei forni.",
 "una gatta dal pelo rosso ruggine con una macchia nera sul naso",[],
 [R('mattina','dorme sui lingotti tiepidi','lavoro','dorme'),R('giorno','caccia topi nei magazzini','lavoro','passeggia'),R('sera','gironzola tra le gambe dei fonditori','in giro','passeggia'),R('notte','dorme vicino al forno','lavoro','dorme')],specie='animale')
person('tizzone','Tizzone','npc.gatto-fabbrica','gatto dello scalo','6 anni','maschio',
 "Il gatto nero dello scalo ferroviario: sale sui vagoni del minerale e scende sempre alla fermata giusta.",
 "Sei Tizzone, un gatto nero dello scalo ferroviario. Rispondi solo con versi, fusa e azioni descritte tra parentesi. Viaggi sui vagoni e ti fai coccolare dai macchinisti.",
 "un gatto nero lucido con gli occhi gialli e un orecchio smangiato",[],
 [R('mattina','sale sui vagoni del minerale','lavoro','passeggia'),R('giorno','dorme sul tetto della pensilina','lavoro','dorme'),R('sera','chiede da mangiare ai macchinisti','in giro','passeggia'),R('notte','caccia tra i binari','in giro','passeggia')],specie='animale')
assert len(P)==24
bond('bruno','nives','figlia','padre'); bond('bruno','pietro','nipote','zio'); bond('selene','amalia','figlia','madre')
bond('ilario','teresa','moglie','marito'); bond('teodoro','clelia','figlia','padre'); bond('gelsomina','ornella','amica','amica')
bond('marta','elia','amico','amica'); bond('amalia','corrado','maestro','allieva'); bond('osvaldo','corrado','amico','amico')
bond('bruno','quinto','alleato','alleato'); bond('fosca','nives','allieva','maestra'); bond('raniero','bruno','rivale','rivale')
bond('nestore','zeno','rivale','rivale'); bond('dafne','marta','amica','amica'); bond('ermanno','fosca','vecchia amica','vecchio amico')
bond('teodoro','quinto','collega','collega'); bond('ilario','nestore','collega','collega')
mem('bruno',"Il giorno dello scoppio della fonderia vecchia ha tirato fuori dalle macerie tre lavoranti.",3)
mem('bruno',"La Casa Ramelli non ha risposto alla terza lettera della Gilda sui turni di dieci ore.",2,'raniero')
mem('gelsomina',"La caldaia della Pesa ha fischiato due volte di troppo lunedì scorso, e il prezzo è sceso.",2)
mem('osvaldo',"Ha riparato la caldaia di Corrado Ingegni per la quinta volta senza essere pagato.",2,'corrado')
mem('pietro',"Ha visto partire la Rondine di Marta Ventidue e ha deciso che un giorno volerà anche lui.",3)
mem('selene',"Ha tarato un manometro della fonderia nuova che segnava mezza atmosfera in meno del vero.",3)
mem('amalia',"Corrado Ingegni le ha regalato una molla che salta più in alto di tutte.",2,'corrado')
mem('corrado',"Ha visto Amedeo Lenti l'ultima volta la mattina dello scoppio, con una cartella di fogli sotto il braccio.",3)
mem('ilario',"Una sera di nebbia ha frenato a un palmo da un vagone sganciato sul viadotto.",3)
mem('teresa',"Ha trovato tagliato un cavo di rame dietro la rimessa, pulito, come con le cesoie.",2)
mem('nestore',"Ha venduto tre rotoli di cavo al porto a uno che non diceva il suo nome.",2)
mem('marta',"Sulle montagne un colpo di vento ha strappato la tela della Rondine sopra il bruciatore.",3)
mem('elia',"Ha legato la Rondine alla torre in piena notte, con il vento contro, mentre Marta urlava gli ordini.",2,'marta')
mem('dafne',"Il fumo delle fonderie da un mese sale più giallo del solito.",2)
mem('nives',"La colata di martedì era più pallida, e il capo reparto le ha detto di non pensarci.",3)
mem('raniero',"Una lettera delle banche delle montagne gli chiede di pagare entro la fine del mese.",3)
mem('fosca',"Il giorno dello scoppio ha visto l'ingegner Lenti correre verso le valvole invece che fuori.",3)
mem('teodoro',"Il cunicolo diciassette, sulle sue mappe di trent'anni fa, continuava oltre la porta di ghisa.",3)
mem('clelia',"Ha trovato una chiave di ghisa con un diciassette inciso in una pozza d'acqua calda.",3)
mem('quinto',"I minatori hanno votato: se la Gilda sciopera, scioperano anche loro.",2)
mem('ermanno',"Lunedì il prezzo dell'oricalco è sceso per la terza settimana di fila.",2)
mem('ornella',"Le tessitrici hanno cominciato una canzone nuova sullo sciopero dei caldaisti.",2)
mem('zeno',"Ha contato dodici casse di rame in meno di quelle scritte sul registro del bastimento «Gabbiano».",3)
mem('ruggine',"Un fonditore le ha lasciato un pezzo di salsiccia sul lingotto più caldo.",1)
mem('tizzone',"Ha viaggiato fino alle miniere su un vagone e ne è tornato coperto di polvere rossa.",1)
# --- places --------------------------------------------------------------------------------------------
M={}
def place(c,name,desc,layout,objects,ground=(),runes=(),people=()):
    M[c]=dict(place=dict(name=name,description=desc),layout=layout,objects=[dict(module=m,where=w) for m,w in objects],ground=list(ground),fresh=[],runes=list(runes),_people=list(people))
O=lambda m,w='fuori':(m,w)
place((0,0),'Piazza della Pesa',"La piazza selciata di Fornace Alta, con la grande bilancia d'ottone, la caldaia che la muove e i lampioni a gas.",'piazza_pesa',
 [O('npc.caldaista'),O('npc.cittadino'),O('obj.caldaia'),O('obj.valvola-manometro'),O('obj.lampione-gas'),O('obj.lampione-gas'),O('obj.bacheca-corporazione'),O('obj.telegrafo-pneumatico')],
 ['Soldo di rame','Pane nero di segale','Carbone'],['vapore','ingranaggio','luce'],[('gelsomina',0),('ermanno',1)])
place((1,0),'Bottega Vitti',"La bottega dell'orologiaia Selene Vitti, piena di quadranti e di ticchettii, all'imbocco del Quartiere dei Telai.",'quartiere_telai',
 [O('npc.orologiaia'),O('obj.banco-orologiaio','ovunque'),O('obj.enigma-ingranaggi'),O('obj.lampione-gas')],
 ["Ingranaggio d'ottone","Molla d'acciaio",'Manometro rotto','Vetro da manometro'],['quadrante','molla'],[('selene',0)])
place((-1,0),'Vicolo dei Caldaisti',"Il vicolo della Gilda dei Caldaisti: baracche di assi, mucchi di carbone e il fischio continuo delle valvole.",'baracche',
 [O('npc.caldaista'),O('npc.caldaista'),O('obj.caldaia'),O('obj.bacheca-corporazione'),O('item.chiave-inglese')],
 ['Carbone','Carbone','Caffè nero bollente'],['carbone','pressione'],[('bruno',0),('pietro',1)])
place((0,1),'Scalo della Ferrovia Sospesa',"I binari dello scalo sotto i piloni del viadotto, la pensilina e i vagoni del minerale in attesa.",'scalo_ferroviario',
 [O('npc.macchinista'),O('npc.gatto-fabbrica'),O('obj.carrello-minerario'),O('obj.lampione-gas'),O('obj.telegrafo-pneumatico')],
 ['Biglietto della linea alta','Birra scura'],['vapore','rame'],[('ilario',0),('tizzone',1)])
place((0,-1),'Fonderie Ramelli',"Il recinto di pietra delle Fonderie Ramelli: forni d'oricalco, canali di colata e montagne di scorie nere.",'fonderia',
 [O('npc.fonditrice'),O('npc.fonditrice'),O('npc.gatto-fabbrica'),O('obj.fucina-oricalco','ovunque'),O('obj.caldaia'),O('obj.valvola-manometro'),O('npc.automa-guardia')],
 ['Minerale rosso di Solfara','Lingotto di rame','Pane di zinco','Carbone'],['carbone','ottone'],[('nives',0),('raniero',1),('ruggine',2)])
place((1,1),'Capannone dei Telai',"Il capannone grande dei telai a vapore e le case operaie attorno a un cortile di matasse.",'quartiere_telai',
 [O('npc.cittadino'),O('npc.orologiaia'),O('obj.caldaia'),O('obj.lampione-gas')],
 ['Straccio unto','Mela renetta'],['nebbia'],[('ornella',0),('amalia',1)])
place((-1,-1),'Magazzini Ramelli',"I magazzini di pietra della Casa Ramelli dietro la cancellata, dove si ammassano i lingotti d'oricalco.",'magazzini_ramelli',
 [O('npc.automa-guardia'),O('npc.automa-guardia'),O('obj.cassaforte-combinazione','ovunque'),O('obj.lampione-gas')],
 ['Viti e bulloni'],['magnete'],[])
place((1,-1),'Giardino della Fuliggine',"Il parco dei platani anneriti, con la fontana di ghisa e le panchine dove i macchinisti fumano la pipa.",'giardino_fuliggine',
 [O('obj.lampione-gas'),O('obj.lampione-gas'),O('obj.enigma-ingranaggi')],
 ['Mela renetta','Candela di sego'],['vita','nebbia','scudo'],[])
place((-1,1),'Officine del Canale Bruma',"Officine di lamiera lungo il canale, passerelle di ferro e l'officina disordinata dell'inventore Ingegni.",'officine_canale',
 [O('npc.caldaista'),O('npc.orologiaia'),O('obj.caldaia'),O('obj.banco-orologiaio','ovunque'),O('obj.valvola-manometro')],
 ['Tubo di rame','Viti e bulloni','Straccio unto'],['molla','scintilla'],[('osvaldo',0),('corrado',1)])
place((2,0),"Torre d'Ormeggio di Vetta Bruna","La torre di ferro sulla collina di levante, con i cavi tesi e il dirigibile Rondine ormeggiato, bucato su un fianco.",'torre_ormeggio',
 [O('npc.aeronauta'),O('npc.aeronauta'),O('obj.dirigibile-attracco'),O('obj.telegrafo-pneumatico')],
 ['Tubo di rame','Benda di garza'],['vento','vapore'],[('marta',0),('dafne',1)])
place((-2,0),'Porto dei Bastimenti',"Le banchine di pietra e le passerelle di ferro dove attraccano i bastimenti del rame; la dogana conta le casse.",'porto_bastimenti',
 [O('npc.cittadino'),O('obj.lampione-gas'),O('obj.bacheca-corporazione'),O('obj.carrello-minerario')],
 ['Lingotto di rame','Birra scura'],['acqua','rame'],[('zeno',0)])
place((0,2),'Rimessa delle locomotive',"La rimessa dove dormono le locomotive della linea alta, con gli scambi a leva e il fischio di Teresa.",'scalo_ferroviario',
 [O('npc.macchinista'),O('npc.macchinista'),O('obj.caldaia'),O('obj.carrello-minerario')],
 ['Carbone','Oliatore'],['pressione'],[('teresa',0),('nestore',1)])
place((0,-2),'Fonderia vecchia',"Ciò che resta della fonderia vecchia dopo lo scoppio: muri anneriti, un forno solo ancora acceso e l'erba tra le scorie.",'rovine',
 [O('npc.fonditrice'),O('obj.caldaia'),O('obj.valvola-manometro'),O('obj.cassaforte-combinazione','ovunque')],
 ['Carbone','Occhialoni da fonderia'],['fuliggine','fuoco'],[('fosca',0)])
place((1,-2),'Ingresso delle Miniere di Solfara',"L'imbocco delle miniere nella roccia rossa: binari dei carrelli, pozze d'acqua calda che fumano e il casotto della squadra.",'miniera_termale',
 [O('npc.cartografo-miniera'),O('npc.cartografo-miniera'),O('obj.carrello-minerario'),O('obj.lampione-gas')],
 ['Minerale rosso di Solfara','Uova sode della sorgente',"Bottiglia d'acqua termale"],['terra','nebbia'],[('teodoro',0),('quinto',1)])
place((-1,-2),'Cunicolo diciassette',"Un cunicolo profondo di Solfara che finisce contro una porta di ghisa murata; l'aria è calda e umida.",'miniera_termale',
 [O('npc.cartografo-miniera'),O('obj.enigma-ingranaggi'),O('obj.carrello-minerario')],
 ['Minerale rosso di Solfara','Lanterna a carburo'],['ingranaggio','magnete'],[('clelia',0)])
place((2,1),'Piazzale degli aeronauti',"Il piazzale di case di mattoni sotto la torre, dove gli aeronauti giocano a carte e aspettano il vento.",'quartiere_mattoni',
 [O('npc.aeronauta'),O('obj.lampione-gas'),O('obj.bacheca-corporazione')],
 ['Caffè nero bollente','Salsiccia affumicata'],['quadrante'],[('elia',0)])
place((-2,1),'Banchina del rame',"La banchina più lontana del porto, dove i bastimenti scaricano di notte e i lampioni sono spesso spenti.",'porto_bastimenti',
 [O('obj.lampione-gas'),O('obj.carrello-minerario'),O('obj.telegrafo-pneumatico')],
 ['Lingotto di rame','Viti e bulloni'],['fuliggine'],[])
place((1,2),'Campagne delle Trebbie',"Campi arati fuori città, una cascina di assi e la trebbiatrice a caldaia ferma sull'aia.",'campagne_trebbie',
 [O('obj.caldaia')],
 ['Mela renetta','Mela renetta','Pane nero di segale'],['vita','terra'],[])
place((-1,2),'Boschetto della Bruma',"Un boschetto di platani lungo il fiume Bruma, dove le famiglie operaie vanno la domenica.",'bosco',
 [O('obj.lampione-gas')],
 ['Mela renetta'],['acqua','vento','ottone'],[])
assert len(M)==19
people=[]
for c,pl in M.items():
    for key,idx in pl['_people']:
        pp=P[key]; assert pl['objects'][idx]['module']==pp['tipo'],(key,c)
        pp['luogo']=pl['place']['name']; pp['origine']=f"{c[0]},{c[1]}#o{idx}"
for k in P: assert 'origine' in P[k],k
os.makedirs(U+'maps',exist_ok=True)
for f in os.listdir(U+'maps'): os.remove(U+'maps/'+f)
for (cx,cy),pl in M.items():
    plan={k:v for k,v in pl.items() if k!='_people'}
    json.dump({"plan":plan},open(f"{U}maps/{PREF}_{cx}_{cy}.json",'w'),ensure_ascii=False,indent=1); open(f"{U}maps/{PREF}_{cx}_{cy}.json",'a').write('\n')
json.dump({"persone":list(P.values()),"attesi":[{"nome":"Ottavia Ramelli","legame":"prozia","di":"Raniero Ramelli"},{"nome":"Amedeo Lenti","legame":"amico","di":"Corrado Ingegni"}]},open(U+'world/people.json','w'),ensure_ascii=False,indent=2); open(U+'world/people.json','a').write('\n')
json.dump({c:pl['place']['name'] for c,pl in {f'{k[0]},{k[1]}':v for k,v in M.items()}.items()},open('/tmp/claude-0/luoghi.json','w'),ensure_ascii=False)
print('ok', len(P), len(M))
