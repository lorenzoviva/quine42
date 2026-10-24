# ADR-0059 — Il client sottile e gli avatar

Data: 2026-10-24 · Stato: accettato (task T39 del backlog) · Fase 1 di ADR-0050 (il multiplayer); estende ADR-0058 (il kernel
sul server), ADR-0004 (il tappeto) e ADR-0041 (i modelli, un seme per istanza).

## Contesto
Con T38 il kernel di una partita di molti gira sul server, ma il gioco nel browser creava ancora il suo kernel. Il renderer, i
menu, l'HUD e i pannelli leggono il `Kernel` direttamente (ECS, chunk, `groundAt`, forme, palette, `actionsFor`): riscriverli
per un client senza kernel avrebbe raddoppiato il codice del mondo.

## Decisione
1. **Il kernel specchio.** In multigiocatore il browser avvia comunque un `Kernel`, con i file che il server manda all'ingresso e
   `mirror: true`: niente generazione (né bozze né piani né Concilio: `generationHeld`, `ensureChunk` non crea), niente salvataggi
   (`saveState`/`saveUsage`), niente riparazioni. Il suo tick (`mirrorTick`) muove solo il viandante del client: tempo, ritmo,
   corpi solidi, `core.movement` e `core.carpet`, zona, fumetti. Il resto del mondo si muove sul server.
2. **Il client sottile** (`src/session/thin.ts`, `ThinClient`) riempie lo specchio con ciò che dice la sessione: i luoghi
   diventano chunk (caselle, nome, lotti come rettangoli per le altezze), le cose entità con i componenti che servono a disegnarle
   e a farne il menu (`THING_PARTS` in `protocol.ts`: raccolta, runa, corpo, interazione, luce, fuoco, attività, figura,
   contenitore; di `identity` solo il nome, di `mind` solo che c'è), gli altri viandanti entità `remote` (`wander` le fa figure con
   gli arti). Gli id del server e dello specchio sono tradotti nei due sensi.
3. **Predizione e correzione.** Il viandante cammina subito con la tastiera, come da solo (il tappeto compensa); ogni 50 ms il
   client manda dove è nel mondo. Una `correzione` (la più recente vince) lo rimette dove lo ha il server. Se il server lo ha a più
   di 8 caselle da dove crede di essere, il mondo ce lo ha portato (la runa del Concilio, una porta): il client lo segue; e il
   server non muove chi dichiara un punto a più di 8 caselle (`FAR`): o è un passo partito prima, o è una bugia.
4. **Interpolazione.** Ciò che si muove sul server (persone, animali, altri viandanti) arriva a 10 Hz e scivola verso la sua
   posizione (`FOLLOW`, circa un periodo di aggiornamento); oltre 4 caselle salta. Gli arti si muovono da soli perché il renderer
   anima le figure che si spostano. I fumetti arrivano con le cose e con i viandanti (`testo`).
5. **Le azioni passano dal server.** Il client sostituisce, sull'istanza dello specchio, i metodi del kernel che cambiano il mondo
   (`interact perform performMenu freeAction talk inscribeHand dropSelected castSpell action`) con messaggi della sessione;
   «Parla» e «Altro…» aprono le finestre in locale e mandano solo le parole. Il server risponde con messaggi e dialoghi
   (`esito.dialoghi`), che il client mostra come li mostrerebbe il mondo; la raccolta di una runa per id (`pickUpRune(id)`).
6. **Esito ottimistico.** Ciò che si può mostrare subito si mostra: la cosa raccolta sparisce, l'`<action>` del modello si vede
   (la porta si apre), la frase incisa lascia la mano. Se il server rifiuta si annulla; se accetta, al primo aggiornamento dopo
   la risposta la cosa torna com'è sul server (se è ancora a terra, ricompare). La frase è del client: la compone in locale e la
   manda quando cambia; quella del server la sostituisce solo quando nessun messaggio sulla frase è in viaggio e il server l'ha
   cambiata (una runa raccolta, consumata, incisa).
7. **Il resto aspetta.** Uso, equipaggiamento, borse, contenitori, fabbricazione, pannelli e azioni sulle caselle non sono ancora
   nel protocollo: nello specchio dicono «Tra molti viandanti questo non si può ancora fare» e non cambiano nulla (`LATER`).
8. **L'aspetto.** Ogni viandante oltre `io` è un seme suo del programma `viandante` e ha il mantello del suo colore (`tinta: N` nel
   programma, `wandererColor(id)` finché il profilo di T44 non lo fa scegliere); il server manda la forma all'ingresso e con gli
   altri viandanti.
9. **Il browser.** `main.ts` legge `universe.json` dell'universo: se è in multigiocatore entra con un WebSocket
   (`src/session/socket.ts`) come il viandante della scheda (`?viandante=<id>`, o uno inventato una volta per scheda in
   `sessionStorage`), avvia lo specchio e chiama `thin.frame` a ogni fotogramma. Niente Genesi, salvataggi né hot reload dal disco.
   In sviluppo `?universo=<nome>` apre un altro universo di `universes/`. Vite pre-raggruppa `wasmoon` (UMD), che altrimenti nel
   browser non si importava in `npm run dev`.

## Conseguenze
- Due schede sullo stesso server di Vite si vedono camminare (verificato con un universo di prova in multigiocatore, poi tolto).
- In singola nulla cambia: il kernel resta nel browser e non c'è sessione.
- Gli oggetti dell'inventario e le borse arrivano con le interazioni tra giocatori (T43) o un task loro; corona, studio e pannelli
  del Concilio nel client del giocatore sono di T41 (oggi lo specchio li ha come in singola, vuoti di ciò che fa il server).
- Lo specchio non scarica i luoghi lontani (il server non li rimanda): con viaggi lunghi la memoria del client cresce.
- Test: `tests/thin.test.ts` (due client che si vedono camminare, la correzione, l'esito ottimistico e il suo annullamento, la frase).
