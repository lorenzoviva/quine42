In questo contesto, il gioco Rune, abbiamo provato a sostituite la generazione delle immagini direttamente attraverso l'IA con una generazione che passa per uno stato intermedii: codice MarkovJunior. Il tutto è stato implementato come sperimentazione standalone in "lab".
Abbiamo svolto due iterazioni di sviluppo in sessioni Claude Code separate per valutare la capacità degli agenti di produrre codice MarkovJunior di qualità e i risultati sono stati molto positivi. 
Puoi leggere tutti i prompt che ho inviato a claude code nei files step8A step8B e step8C (prima sessione) e step8.1A step8.1B e step8.1C (seconda sessione).

Nella prima sessione abbiamo stabilito un flusso di generazione, per le entità semplici generiamo direttamente lo sprite a partire dal rendering 3D di MJ.
Per le entità complesse, che occupano più di una tile, (chiamate strutture) sorgeva la necessità di identificare le singole tiles. Ad esempio in una casa è importante sapere quali tiles vengono occupate dai muri, dalla porta, le finestre etc...
In questo modo, importando la struttura nel gioco, possiamo agire su quelle singole tiles per renderle operative.
Abbiamo progettato il flusso in due passi, nel primo uno "scultore" genera il modello 3D delle singole tiles come blocchi 3D, scrivendo del codice MJ. Questi vengono poi assemblati tramite un secondo agente "architetto" che legge il json prodotto dal codice MJ, e assembla le varie tiles per formare la struttura completa.

L'intero gioco rimane in 2D, la novità è che gli sprite non vengono più generati direttamente da un sistema di IA, ma bensì importando le singole tiles 3D generate in MJ, l'agente architetto assembla il modello 3D completo, e ne genera uno sprite "fotografandolo" con una vista a 3/4.

Ci siamo resi conto nella seconda sessione che il codice che avevamo scritto non era un vero e proprio interprete MJ, veniva utilizzato inpropriamente come software CAD.
L'interprete non permetteva tutta la potenza espressiva del codice MJ. Il repository GitHub mostra esempi molto belli visivamente, le nostre interpretazioni producevano risultati molto mediocri.
Abbiamo pertanto corretto il tiro e Claude Code ha generato qualche modello di prova:
- Un dungeon con DungeonGrowth: molto bello
- Un castello: estremamente bello

L'esperimento è proseguito cercando di estendere ai modelli IA Gemini. Tuttavia i risultati prodotti in questa fase sono deludenti.
Credo che il problema derivi dalla doppio livello di generazione del codice MJ e dalla comunicazione tra gli agenti scultore e architetto. 
Per funzionare correttamente WFC deve definire le regole di adiacenza tra le tiles. In questo modo i modelli 3D delle singole tiles devono avere dei bordi perfettamente combacianti.
Nella conversione tra 3D e 2D si perdono alcune delle informazioni sui bordi, che venivano comunicati all'architetto soltanto attraverso il json dei blocchi.
Tuttavia i json conengono tante informazioni aggiuntive che confondono l'agent, inoltre lo obbligano a raggionare su aspetti che dovrebbero essere gestiti automaticamente dal sistema, come le adiacenze. Anche il codice MJ è definito in json, che contiene tutta una serie di altre informazioni come materiali, descrizioni ecc... che non sono utili per la generazione delle tiles e rendono la generazione del codice più prolissa e complessa.
In questo modo l'architetto è portato ad allucinare, inventando regole di adiacenza che non sono coerenti con i modelli 3D. 

Tuttavia complessivamente l'esperimento è stato un enorme successo e mi ha fatto ripensare alla scelta di rimanere in 2D.
Portiamo tutto a 3D. In questo modo non è necessario il doppio passo di generazione di modelli 3d di singole tiles e poi assemblaggio di un modello 3d completo. Si può passare direttamente alla generazione del modello 3D completo. 
Inoltre non avremo più problemi di adiacenze, in quanto il software gestisce nativamente le adiacenze. Occorre applicare MarkovJunior alla lettera, come è stato fatto nel repository github, e non utilizzare più il json come file di input, cercando una rappresentazione del codice MJ più semplice e diretta per gli agenti.
In questo modo si potrebbe arrivare a generare direttamente anche i personaggi e gli NPC etc...

Inoltre immagino si possa anche utilizzare MJ per associare un movimento agli oggetti, come avevamo fatto con gli NPC che abbiamo generato nella sessione precedente.
Ad esempio un albero che oscilla al vento, un fiore che cresce etc...

L'idea di base, perciò, è portare tutto a 3D e cercare di applicare la generazione in MJ nel modo più fedele possibile all'uso che se ne fa nel repository github, senza implementare passaggi intermedi e senza complicare il sistema con json e file intermedi.

Facciamo un tentativo, sempre sperimentale, standalone in lab. 
Proviamo a creare una piccola sandbox 3D e portare alcune delle entità che abbiamo generato nella sessione precedente (viandante, NPC e oggetti) in 3D.
Considera validi i modelli generati nel corso della scorsa sessione.

Per quanto riguarda Gemini, a regime il prezzo di 3.8 è alto, dobbiamo riuscire a capire se con il modello 3.1 (direi che è il cap del budget) si ottengono risultati qualitativamente comparabili. 



