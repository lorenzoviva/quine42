# ADR-0117 — La traccia di un programma MarkovJunior, in testo

Data: 2026-11-03 · Stato: accettato (task T179 del backlog) · Riferimenti: ADR-0036 e ADR-0038 (MarkovJunior del gioco e laboratorio), ADR-0042 (lo Scultore), ADR-0092 (le taglie)

## Contesto

Chi scrive un programma MarkovJunior vede solo il risultato, in foto. Non può capire cosa fanno `one all prl convolution path` passo per passo, come fa l'autore nell'editor andando
avanti e indietro tra i fotogrammi; così non usa i pattern dei programmi migliori e i modelli vengono statici (richiesta 1 dell'autore, 03/11). Le immagini costano: il debug intermedio va in testo.
Per dire quale nodo ha cambiato quali celle serve vedere l'esecuzione da dentro: i nodi sono privati del motore, e rifarli a parte darebbe un altro risultato.

## Decisione

1. **Il motore si lascia guardare, senza cambiare**: `RunOptions.watch` (`RunWatch`: `start`, `step`, in `src/mj/engine.ts`). Con un osservatore ogni foglia è avvolta da un `WatchedRunner`, che dopo un passo riuscito dice nodo, griglia e da dove leggere il registro delle scritture. Non tira numeri casuali e non scrive: stessa griglia, stessi passi (provato sui modelli ufficiali e su uno del banco). Senza osservatore si compilano gli stessi nodi di prima. In più ogni nodo conta le applicazioni per regola (`Runner.fired`), sempre: un incremento, nessun effetto sul risultato.
2. **`src/mj/trace.ts`**: `traceProgram` (per nodo: volte, celle, scatola, passi, regole, «lettera→lettera»), `framesAt` (la griglia a un passo: rifà il giro, stesso seme stesso giro, invece di tenere ogni fotogramma in memoria), `traceText` e `renderTrace` (il testo), `estimateTokens`. Sta in `src/mj/` perché T156 potrà portarla alla seconda richiesta dello Scultore nel gioco; oggi la importa solo il laboratorio.
3. **Le forme** sono quattro, sempre con l'elenco dei nodi: `nodi`, (a) `sezioni`, (b) `differenze`, (c) `scatole`. **La predefinita è (b)**, con un **tetto di 4000 token stimati**; numeri e prova cieca in `lab/banco/traccia.md`. (a) costa decine di migliaia di token e sotto un tetto perde piani; (c) è la più corta per i modelli fatti di `box` ma esplode sui programmi di regole e non dice l'ordine; (b) dipende dai nodi e non dalla griglia, ed è l'unica che dice «quando». Le altre due restano per guardare un fotogramma.
4. **Il tetto si rispetta sempre, e ciò che si toglie si dice**: fonde i fotogrammi vicini (i `box` prima, le regole per ultime, `map` mai), taglia le scatole partendo dalle più piccole, piega piani e righe uguali, in ultimo taglia le righe. La stima dei token è tarata contro i token reali, e nelle misure sta sopra.
5. **La traccia arriva al banco a richiesta**: `Esame.traccia` in `lab/banco/seconda.ts`, `banco-strutture --seconda --traccia`. Senza il flag la seconda richiesta è quella di prima. Il risultato finale resta giudicato con le foto.

## Conseguenze

- Una traccia sono fino a cinque esecuzioni del programma: si fa fuori dal ciclo del gioco.
- La traccia dura fino a 20 s, oltre gli 8 del gioco: di un programma troppo lento dice cosa stava facendo.
- Non misurato: se la traccia fa scrivere programmi migliori. Lo dirà T182.
