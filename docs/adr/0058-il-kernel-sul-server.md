# ADR-0058 — Il kernel sul server

Data: 2026-10-24 · Stato: accettato (task T38 del backlog) · Fase 1 di ADR-0050 (il multiplayer, decisione 2 e «Architettura»);
estende ADR-0004 (il tappeto), ADR-0054 (i viandanti con un id) e ADR-0055 (i semi condivisi).

## Contesto
In multigiocatore il server è l'unica fonte di verità: il kernel gira lì, i client disegnano lo stato che ricevono e mandano la
propria posizione e le proprie azioni. Il kernel girava già in Node (i test), aveva più viandanti (`addWanderer`, `as`) e la
casualità dal seme; ma il tappeto era uno solo, `core.movement` muoveva con la tastiera tutti i viandanti e `core.carpet` li
riportava tutti al centro sullo stesso scorrimento, i chunk si caricavano solo attorno al viandante che agisce, e non c'era né
un protocollo né un trasporto.

## Decisione
1. **Un tappeto per viandante.** Ogni viandante ha il suo scorrimento: l'entità del tappeto tiene quello di chi agisce, gli altri
   il loro (`tappeto` nel registro dei viandanti); `as(id, …)` scambia anche quello (`holdCarpet`). Tutto ciò che legge `offset()`,
   `playerCarpet()` o `freeReal` dentro `as` vale per quel viandante.
2. **Sistemi per viandante.** `core.movement` e `core.carpet` (`PER_WANDERER`) girano una volta per ogni viandante che il kernel
   muove da sé, come lui, e il loro `ecs.each` vede solo lui tra i giocatori; la tastiera del kernel muove soltanto `inputFor`
   (`io`). Il ritmo (`passo` dagli stati), il carico, la frase, gli stati e i chunk da caricare sono di ogni viandante. **In singola
   nulla cambia**: c'è solo `io`.
3. **I viandanti dei client** (`setRemote`): il kernel non li muove e non li riporta al centro; un client dice dove è il suo
   viandante nel mondo (spazio del tappeto) e il server controlla il passo con `stepWanderer`: al più quanto il ritmo consente
   (`paceOf`: velocità, stati, il terreno più veloce attorno), con la stessa collisione del cammino (asse per asse, la scatola del
   corpo, chi è incastrato può sempre uscire). Il viandante resta dov'è sul suo cerchio, si sposta il suo tappeto.
4. **Il protocollo** (`src/session/protocol.ts`): messaggi JSON. Dal client `entra passo frase incidi pronuncia azione altro
   chat`; dal server `ingresso` (i file dell'universo, il viandante, i luoghi, le cose e i viandanti vicini), `aggiorna` (~10 Hz,
   solo ciò che è cambiato vicino a lui: posizione, stato, caselle dei luoghi, cose e viandanti entrati, mossi, usciti),
   `correzione` (il passo non era possibile: dove è davvero), `esito` (di ogni azione: cosa ha detto il mondo nel frattempo e la
   risposta) e `rifiuto`. Le azioni sulle cose valgono solo a portata (3 caselle).
5. **Il server** (`src/session/server.ts`, `SessionServer`): tiene il kernel, prende un collegamento per client, a ogni tick
   applica i messaggi nell'ordine di arrivo, fa girare il kernel e manda gli aggiornamenti. Il passo ha un credito: ogni tick
   il ritmo × dt (con un margine del 15 %), al più mezzo secondo di cammino; chi bara sulla velocità avanza di quello e riceve una
   correzione. Chi se ne va è salvato (`world/giocatori/<id>.json`) e la sua entità lascia il mondo (`removeWanderer`; `io` resta).
   Ciò che segue un `await` in «Altro…» va a chi l'ha chiesto (come già la chat, ADR-0054).
6. **Il trasporto.** Nei test `fakeLink()` (le due estremità nello stesso processo, attraverso JSON come sulla rete). Nel server di
   Vite `server/session.ts`: un WebSocket (`ws`) su `/api/session?universo=<nome>`; il primo client avvia il mondo di quell'universo
   (`src/session/host.ts`, caricato con `ssrLoadModule` perché gli import del kernel si risolvano come nel browser), che poi gira a
   60 Hz nel processo. Si apre solo un universo che esiste ed è in multigiocatore: in singola il kernel resta nel browser.
   L'archivio (`UniverseClient` con un indirizzo assoluto) e il proxy di Gemini sono le rotte HTTP dello stesso server.

## Conseguenze
- Il gioco nel browser non usa ancora la sessione: il client sottile, la predizione e gli avatar sono di T39.
- Il pagante di una chiamata che parte dopo un `await` resta `io` (ADR-0056): `chi` esplicito per le chiamate del server con T40.
- `zone`, `exitedOnce` e la corona sono ancora del viandante `io`: un viandante di un client non esce dal tappeto (T41-T42).
- I chunk restano caricati attorno a ogni viandante: con viandanti lontani il mondo caricato cresce (il limite è T40).
- Solo `npm run dev`: `vite preview` non carica i sorgenti del kernel.
- Test: `tests/session.test.ts`.
