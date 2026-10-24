# ADR-0061 — Il client del giocatore senza corona né Concilio

Data: 2026-10-24 · Stato: accettato (task T41 del backlog) · Fase 1 di ADR-0050 (il multiplayer); estende ADR-0058 (il kernel
sul server) e ADR-0059 (il client sottile).

## Contesto
Con T39 ogni scheda di una partita di molti avvia un kernel specchio con **tutti** i file dell'universo, mandati dal server
nell'`ingresso`: prompt degli agenti, bibbia, regole, persone con i ricordi, trame, grafo, carte, consumi e lo stato degli altri
viandanti. Il client scaricava anche tutta la corona e gli strumenti del Concilio (studio, pannelli, registro, console, editor,
Genesi) e `window.rune` era il kernel. Per un giocatore questo è il tavolo del Dungeon Master (ADR-0025): non deve vederlo, né
in gioco né dalla console del browser. Il master invece, che lavora dalla corona, del Concilio non riceveva niente (il registro
del server non arrivava a nessuno).

## Decisione
1. **I file di un giocatore** (`playerFiles` in `src/session/server.ts`): ciò che il client disegna e con cui cammina.
   `universe.json`, `models/`, il rilievo (`world/rilievo.xml`) e l'atlante; i manifest dei moduli senza `logic` né `casi`,
   tranne il codice dei sistemi che lo specchio fa girare lui (`PER_WANDERER`: `core.movement`, `core.carpet`). Il resto
   (prompt, bibbia, stile, canone, regole, persone, trame, grafo, carte, consumi, stato del mondo e dei viandanti) resta sul
   server. Il master riceve tutti i file. Un manifest senza `logic` carica il modulo senza codice: lo specchio non ha guasti.
2. **Chi è il master** lo dice il server nell'`ingresso` (`master: true`, da `kernel.isMaster`; in singola il client non usa la
   sessione ed è sempre master).
3. **Il registro del Concilio solo al master**: l'`ingresso` del master porta il registro fin qui (`concilio`), poi il server
   gli manda a ogni aggiornamento ciò che il Concilio ha detto nel frattempo (`{ t: 'concilio', voci }`). `ThinClient` lo versa
   nel Concilio dello specchio (`council.feed` e `onFeed`): pannello del Concilio e squadre nello studio come in singola. A un
   giocatore il server non manda mai un messaggio `concilio`.
4. **Gli strumenti del master in un modulo a parte**: `src/master.ts` (`MasterTools`: editor, console, registro, Genesi,
   pannelli dello studio, atlante, grafo) e `src/render/coronaview.ts` (`CoronaView`: anello del campus, stanze, vetrine,
   tavolo della situazione, parete di schermi, catena, banco, avatar del Concilio, con la loro parte dello strato 2D).
   `main.ts` li carica con `import()` solo se il client è del master; il `Renderer` conosce `CoronaView` solo come tipo e la
   riceve con `useCorona`. Nella build sono un chunk loro (`master-*.js`); un giocatore non lo scarica.
5. **`window.rune` del giocatore è il client** (`ThinClient`: la sessione e lo specchio, che ha solo ciò che il server gli ha
   mandato); quello del master resta il kernel, con `window.session`.

## Conseguenze
- Il kernel resta una classe sola: `corona.ts`, `archive.ts`, gli agenti, `situation.ts`, `screens.ts` e `chain.ts` (logica,
  non disegno) sono ancora nel bundle principale. Separarli vorrebbe dire spezzare `Kernel`: non serve, perché senza i file del
  Concilio e senza il codice del disegno un giocatore non ha niente da mostrare o da chiedere. Lo specchio di un giocatore
  costruisce comunque una corona con i soli file che ha, e non la disegna.
- In singola gli strumenti si caricano con un `import()` in più all'avvio (un chunk di ~90 kB), in parallelo all'avvio del kernel.
- Gli interni della corona non passavano già dal server (lo studio e il campus non sono entità dell'ECS); ciò che li rivelava
  erano i file, ora filtrati.
- Un modulo forgiato dopo l'ingresso non arriva ancora a nessun client (ADR-0059): quando arriverà dovrà passare da
  `playerFiles` per i giocatori. Ciò che il master fa dallo studio (modifiche, rollback, il ramo `master`) è T42.
