Ok alcuni dettagli:

- Modelli di IA generativa:
    - I modelli che avevo scelto sono deprecati e leggermente sovraprezzati rispetto alla controparte più recente. 
        - Sostituiamo gemini-3.1-flash-lite-image a gemini-2.5-flash-image. 
        - Sostituiamo gemini-3.1-flash-lite a gemini-2.5-flash-lite.

- La corona e il consiglio:
    - Ottima intuizione di utilizzare cristalli e papiri, ottima anche l'idea di far spostare i membri del consiglio per parlare tra loro.
        - Ho anche provato a chiedere all'artista di ridisegnare uno sprite, e l'ha fatto. Molto interessante.
        - Forse servirebbe tipo un referente a cui fare le domande? che coordini le richieste del giocatore verso il consiglio
        - Una volta arrivati al consiglio, devono diventare meno restrittivi rispetto all'aggiunta di contenuti di gioco.
        - Immaginiamo che una volta arrivati alla corona, il giocatore sia "trasceso" e diventato parte del consiglio, quindi gli danno retta su tutto, salvo eccezioni (es. evitare di autodistruggersi, distruggere l'universo o rompere la fisica o il gioco)
    - Ottimo di suddividere la corona in sezioni, ma voglio un architettura più complessa, con edifici, archivi, biblioteche, stanze, etc...
        - Potrebbe essere rappresentato come l'ufficio di una software house di giochi.
        - Ho notato che si spostano verso i files per effettuare le modifiche. Ma le modifiche non sono visibili, almeno io non le ho viste. 
            - Voglio vedere tutti i contenuti del kernel e quelli creati in sessione, compresi gli sprites e le tipologie di celle disegnate.
                - Siccome graficamente occupano molto spazio, occorre trovare un escamotage per visualizzarle
                - Possiamo avere delle pergamene a scorrimento oppure delle case che sono più grandi dentro che fuori, oppure delle scale che portano in stanze sotterranee, oppure delle stanze su più piani.
                - I membri del consiglio possono essere duplicati per evitare spostamenti troppo complessi. (Per la lore del gioco possiamo immaginare che l'ingegnere sia in realtà un team di ingegneri, e così per tutti i membri del consiglio). Oppure possono teletrasportarsi. Tuttavia vorrei che parlassero tra di loro (visivamente) solo quelli che effettivamente stanno interagendo in chat.
            - Mancano i moduli creati nella sessione stessa (vedi prossimo punto)

- I Moduli:
    - Vorrei che nella corona siano visibili tutte le creazioni di questo universo, organizzate per cartelle
    - Per il VCS, ho notato che il repository è gestito in-browser tipo da frontend, correggimi se sbaglio. Viene mostrato un warning a console che indica che lo spazio è esaurito. Hai avuto un ottima idea nel progettare l'archiotettura in questo modo tuttavia dobbiamo fare un passo ulteriore: 
        - I repository devono essere due: 
            1. Repository del kernel (immutabile, a partire da questo si crea una versione del gioco)
            2. Repository dell'universo, con mappe, moduli, ecc... (versionata durante la sessione)
    - In questo modo ad ogni sessione si arricchisce il parco di contenuti pur rimanendo coerente con quanto avvenuto nella sessione precedente.
    (per ovvi motivi non salveremo l'ultimo commit se il gioco è corrotto). Oppure possiamo lasciare libero il giocatore di salvare i progressi del consiglio o meno.
    Sarebbe bene che ogni conseguenza delle azioni del giocatore venga impostata come regola e che avvenga nello stesso modo dopo un riavvio continuando con lo stesso consiglio.
    Anche per le conversazioni? si potrebbe cachare la chat? forse si rischia di dare sempre le stesse risposte anche se passa del tempo e le cose cambiano, forse è meglio scriverlo nella memoria dell'NPC (vedi sezione NPC)
In questo modo le regole e i contenuti di gioco introdotti nella sessione di una partita restano disponibili in locale per le successive partite. Per resettare è sufficente tornare al repository del kernel e ricreare l'universo.
Scegli tu i dettagli tecnici, spero tu abbia capito l'idea. Se hai idee migliori usa quelle.

- La mappa di gioco:
    - C'è poca varietà. Voglio castelli con ponti levatoi, mura, fossati, case di paglia, pietre, mattoni, villaggi di capanne, maneggi, caserme, dungeon, torri di maghi, casa di draghi, fortezze, templi, piramidi, giungle, deserti, oceani, fiumi, laghi, montagne, colline, foreste, pianure, ecc...
      - Ho provato a chiedere al cartografo di creare un bosco degli elfi, ma l'effetto è stata la creazione di un obj "elf forest" che non è comparso sulla mappa in modo coerente col gioco.
        - Lo scopo del cartografo è proprio quello di coordinare la creazione di nuovi ambienti e di geolocalizzarli nello spazio.
      - Ho chiesto a un NPC dove trovare una località che avevo appena lasciato alle spalle, a ovest. Non mi ha saputo dare indicazioni precise, invece il cartografo deve saperlo e alcuni NPC (gli abitanti del villaggio limitrofo) devono potertelo indicare.

Gli NPC:
- Ottima l'idea di dargli una routine ma vorrei che i personaggi facessero fisicamente le azioni in base alla routine, ad esempio: se è un contadino lo voglio vedere zappare la terra. Se va a dormire, lo vedo andare a letto.
- Voglio che gli NPC parlino tra di loro, in funzione delle loro relazioni.
- Al netto delle frasi di circostanza che dicono tra di loro, vorrei che il narratore creasse trame orizzontali, che coinvolgano più NPC in base alle loro routine e relazioni. Per intenderci, qualcosa tipo quelle di westworld, che creano mistero e intrigano il giocatore. 
    - Vanno integrate con il cartografo e col consiglio
- Gli NPC devono avere memoria delle azioni e interazioni passate con gli altri NPC e con il giocatore. Devono ricordare eventi importanti, promesse, tradimenti, ecc
    - Il giocatore può addirittura creare una famiglia con un NPC, eventualmente se il consiglio lo permette averci dei bambini etc...
    - Occorre mettere un tasto "altro..." anche sulle azioni relative agli NPC. 
- Il narratore potrebbe anche generare delle quest, degli eventi etc...