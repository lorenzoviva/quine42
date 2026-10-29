I risultati sono ottimi ma ci sono alcune migliorie che possiamo ancora introdurre.

Inizio con un dubbio che mi è venuto mentre osservavo i risultati del laboratorio di MarkovJunior 3d, ho notato che c'è un numero massimo "MAX_CODES" che limita la generazione di strutture complesse. L'hai scritto anche nel tuo riassunto finale indicando di averlo corretto ma vedo ancora la costante dichiarata, sei sicuro funzioni?

Proviamo a downgradare il modello alla versione 3.5 per contenere i costi, tanto è solo per valutazione. Non mi è chiaro perché sto spendendo molto in input per gemini 3.8 flash, sono solo i programmi mj?

Problemi di generazione delle strutture complesse:

Non mi è chiaro come hai gestito la WFC sul "secondo" scultore: i bordi delle tiles (in 3D) del primo scultore dovrebbero vincolare la posizione di quelli del secondo scultore, non trovi? Mi sembra abbiano solo sovrapposto le meshes in modo casuale. Questo porta la WFC ad essere molto più pesante da computare. Occorre definire un protocollo attraverso il quale lo scultore sul secondo livello vede già le possibili combinazioni delle tiles/orientamento del primo livello come uniche opzioni.

Lo spazio di generazione deve essere aumentato, solo così non escono dei dungeon microscopici e castelli con un interno a 4 tiles quadrate. Credo che i tempi eccessivi di generazione siano dovuti in gran parte dall'esecuzione dell'algoritmo di WFC errata come spiegato nel punto precedente. Tuttavia se non dovesse essere il caso, occorre ottimizzare se vogliamo utilizzarlo in produzione, quali accorgimenti possiamo adottare? sarebbe possibile spostare la computazione su GPU? o chiedo troppo? 

Farei un tentativo con un castello di 30 tiles di varietà al primo livello e 100x100 di spazio di generazione di secondo livello.
Non fare altre prove