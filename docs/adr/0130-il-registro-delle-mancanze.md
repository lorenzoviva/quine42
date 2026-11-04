# ADR-0130 — Ciò che il Concilio non riesce a fare si conta in un file di mondo che non esce

Data: 2026-11-04 · Stato: accettato · Riferimenti: ADR-0025 (i due tavoli), ADR-0109 (ciò che esce è un elenco), ADR-0128 (le fasi), T238

## Contesto

La Fase III parte dalle funzionalità che il Concilio non riesce a implementare durante le sessioni, chieste dai giocatori o nate dal Concilio stesso. Oggi una richiesta che finisce male lascia una riga nel registro del Concilio (`feed`), che tiene le ultime 400 voci e non si salva: se la beta non le registra, si perdono.

## Decisione

- **Un file di mondo, `world/mancanze.json`**, tenuto da `ShortfallLog` (`src/kernel/shortfalls.ts`): una voce per richiesta con `richiesta`, `chi`, `agente`, `compito`, `esito`, `motivo`, `volte`, `primo`, `ultimo`. La stessa richiesta allo stesso agente per lo stesso compito conta una volta di più e tiene l'ultimo motivo.
- **Quattro esiti**: `rifiuto` (il Concilio dice no), `invalido` (il validatore rifiuta l'ultimo tentativo o scarta ciò che il Concilio proponeva), `errore` (nessuna risposta usabile dal modello, budget compreso), `guasto` (l'Ingegnere non ripara). Il rapporto li tiene distinti: un `invalido` che si ripete è una funzionalità che manca, un `rifiuto` è una domanda dei giocatori, un `errore` può essere solo la rete.
- **Un solo punto d'ingresso, `kernel.noteShortfall`**, chiamato dove una richiesta finisce: Referente, agenti nella corona, Fucina, ambienti, meccaniche, rune, pacchetti, oggetti citati, piani dei luoghi, trame, azioni e fabbricazioni libere, modelli, brani, riparazioni, Genesi.
- **`chi` si dice** (ADR-0113): chi chiede dopo un `await` lo cattura prima; senza, è `comune`, il mondo. Non si tocca chi paga: `forgeModule` riceve lo stesso `chi` di prima, il registro lo calcola a parte.
- **L'agente sta sull'errore**: `Council.ask` segna per quale agente era la chiamata fallita, `ForgeRejected` per quale agente è il tentativo rifiutato. Così una Fucina che fallisce dice «Fisico» e non genericamente «Fucina».
- **Sopravvive ai rollback, come i consumi**: sta in memoria e si scrive prima di ogni commit, confrontando il testo perché il rollback riporta indietro il file. Una richiesta fallita di solito non committa nulla: il salvataggio guarda anche `version`, altrimenti con il mondo fermo la voce andrebbe persa.
- **Il ramo del master non tiene niente**: il suo kernel è uno specchio e non salva; la voce va al mondo (`onShortfall`), come le chiamate vanno ai suoi consumi.
- **Fuori da ciò che esce**: `playerFiles` e `publicFiles` non lo nominano, quindi non esce (ADR-0109); un test in `tests/sicurezza/uscite.test.ts` lo tiene fermo. Niente nel gioco lo legge o lo mostra, né nuove righe nel registro: nessuna quarta parete (ADR-0025). Il master di un universo lo vede solo come vede ogni file del suo universo.
- **Testi dal filo e dai modelli**: appiattiti su una riga e tagliati (richiesta 200, motivo 300), 500 voci al massimo, e oltre il tetto se ne va la più vecchia tra le meno contate: chi inventa richieste nuove non cancella quelle che si ripetono.
- **Il rapporto è un comando**: `npm run mancanze [-- <universo>] [--cartella <dir>]` legge il disco, senza server né kernel, e stampa Markdown con le voci più frequenti prima.

## Alternative scartate

- **Un file fuori dall'universo, come i saldi**: i saldi stanno fuori perché nessuno deve poterli scrivere (ADR-0104); qui il peggio è un rapporto falsato dal master del suo universo, e il dato appartiene al mondo che l'ha prodotto, anche in un clone.
- **Ricavarlo dal registro del Concilio**: non si salva, ne tiene 400, e le sue righe sono racconto, non dati.
- **Un commit a ogni voce**: la cartella di lavoro può contenere altro di non finito, e un commit porterebbe anche quello.
- **Contare anche le combinazioni giudicate impossibili**: il prompt dice al Narratore di essere severo, «la maggior parte non produce nulla», e sarebbero rumore. Si conta il loro `errore`.
- **Contare ciò che manca al viandante** (non ha gli ingredienti): il Concilio ha detto sì.

## Conseguenze

- Un clone porta con sé le mancanze dell'universo da cui nasce, con gli id dei viandanti: gli stessi id che ha già in `world/giocatori/`.
- `chi` e `motivo` sono scritti in chiaro nel repository git dell'universo; il `motivo` può contenere il messaggio d'errore di un modello, non la chiave, che non arriva mai al kernel (ADR-0099).
- Il file compare nello studio del master tra i file di `world/`, come i consumi.
