# ADR-0056 — Chi paga e le carte

Data: 2026-10-24 · Stato: accettato (task T36 del backlog) · Fase 0 di ADR-0050 (il multiplayer, decisioni 4 e 6: crediti e
carte, P#2); estende ADR-0039 (registro dei consumi) e ADR-0054 (il viandante con un id).

## Contesto
In multigiocatore chi fa generare paga (i luoghi che esplora, le sue chat, i suoi «Altro…»), mentre ciò che il Concilio decide
per il mondo intero (Genesi, sessioni, trame orizzontali, revisioni) è comune. Ogni contenuto generato è una **carta** di chi
l'ha pagato; quello pagato da tutti va a uno dei giocatori, estratto a sorte. Fuori dalla partita il giocatore vedrà la sua
collezione con gli utilizzi. Il registro dei consumi contava per giorno, modello e compito, senza pagante; i contenuti non
dicevano chi li avesse voluti. `Manifest.origin` è già una stringa (`genesi | agente | …`) e `ModelInfo.autore` è il modello
di Gemini che ha scritto il programma: nessuno dei due può portare autore e pagante.

## Decisione
1. **Chi paga ogni chiamata.** `TextCall.chi` e `CallRecord.chi`: l'id di un viandante o `comune`. Lo mette il Concilio
   (`Council.write`) con la politica del kernel (`payerOf` in `src/kernel/cards.ts`): comuni i compiti del mondo
   (`genesis.*`, `council.*`, `plot.*`, `review.*`, `npc.dialogue`, `forge.fix`, `model.sculpt|judge|resculpt`, `content.*`),
   del viandante che agisce (`kernel.wanderer()`) tutti gli altri; un `chi` esplicito vince (la Fucina e le meccaniche chieste
   da una sessione o dalla Genesi passano `comune`). `Council.write` è sincrono fino alla chiamata, quindi dentro `as(id, …)`
   paga quel viandante; dopo un `await` paga `io`, che in singola è l'unico (il server di T38-T40 passerà `chi` esplicito).
2. **Il registro per pagante.** `world/consumi.json → paganti` (giorno → pagante → conteggio, come gli altri), `usage.payers()`
   e `usage.sessionByPayer`.
3. **La carta di un contenuto** è un campo `carta { autore, pagante, titolare }` sulla voce stessa: il manifest di un modulo,
   ogni oggetto, ambiente, incantesimo e ricetta di un modulo di dati, la voce di `models/index.json`, la persona di
   `people.json`, la trama di `plots.json`, la regola di `rules.json`, il piano del luogo (`maps/`). `autore` è l'agente che
   l'ha scritto (o l'id del viandante trasceso, quando la richiesta è sua); `titolare` è il pagante o, per i contenuti comuni,
   uno dei viandanti dell'universo estratto con `hash32(seme, id della carta)` (`titolareOf`): non dal tick, così la stessa
   carta va allo stesso viandante in ogni kernel. L'id di una carta è quello del nodo del grafo (`tipo:`, `oggetto:`,
   `ambiente:`, `luogo:cx_cy`, `persona:`, `trama:`, `regola:`, `incantesimo:`, `ricetta:`) più `modello:<id>`.
4. **Si timbra ciò che un cambio porta.** I punti in cui il Concilio crea contenuti committano con `commitContent(messaggio,
   compito, autore, chi?)`: `stampFiles` confronta i file di lavoro con l'ultimo commit e timbra le voci nuove; una voce che
   aveva una carta e l'ha persa riscrivendola (un modello riscolpito, una persona riparata) la riprende. Il seme e gli universi
   di prima non diventano carte. Le regole le timbra `recordRule` solo quando sono giudizi del Concilio (fabbricare, «Altro…»,
   il Referente): i fatti che il kernel annota (una morte, un legame, una missione) non sono carte. Il luogo lo timbra il kernel
   quando il Cartografo lo pianifica per la prima volta.
5. **Gli utilizzi** stanno in `world/carte.json` (`utilizzi`: per carta `luoghi trame prompt`), scritto prima di ogni commit
   come i consumi: un luogo nuovo conta il suo ambiente, ogni cosa (modulo o oggetto, e il suo modello) e le strutture; una
   trama nuova le persone coinvolte e i luoghi delle tappe; un prompt i nodi del suo `focus` (`Council.onFocus`). Lì stanno
   anche le carte dei luoghi (`luoghi`), perché i piani sono fuori dal testo dell'universo.
6. **La collezione** si costruisce dal repository: `allCards(files)` e `collectionOf(files, id)` (pure), `kernel.cardsOf(id?)`.

## Conseguenze
- `tests/cards.test.ts`: una Genesi e i primi luoghi → carte comuni (moduli, oggetti, ambienti) e del viandante (luoghi), con
  autore e utilizzi; il registro per pagante; le comuni estratte col seme tra due viandanti, uguali in due kernel; `stampFiles`
  non timbra il seme e ridà la carta persa.
- Nessuna interfaccia ancora: la collezione fuori dalla partita, la ripartizione delle spese comuni (domanda 3 del piano) e i
  crediti sono di T45. Il titolare di una carta comune si estrae tra i viandanti che l'universo conosce quando nasce; chi arriva
  dopo non rimescola le carte già date.
- I contenuti nati prima di T36 restano senza carta.
