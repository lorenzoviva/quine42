# ADR-0131 — La commissione la decide il server

Data: 2026-11-04 · Stato: accettato · Riferimenti: ADR-0081 (i crediti), ADR-0104 (i saldi), ADR-0110 (i mondi senza segreti), T243

## Contesto

L'autore vuole che in beta i crediti abbiano un prezzo lineare e nessun interesse, perché chi gioca contribuisce allo sviluppo. La commissione era una costante del kernel (`PLATFORM_FEE`, +1 %, ADR-0081): toglierla per la beta voleva dire cambiare il codice, e rimetterla anche. Lo sconto del 50 % non è qui: si fa a mano (`docs/pipeline/domande/T243.md`).

## Decisione

- **La commissione è configurazione del server**: `QUINE_COMMISSIONE`, una frazione del costo, letta da `platformFeeOf` (`server/ledger.ts`). Predefinita 0,01: senza la variabile non cambia nulla. 0 è ammesso.
- **Un valore non valido dà il predefinito**: valido è un numero da 0 a meno di 1. `1` non è valido, perché chi lo scrive vuole quasi certamente l'1 %, non il raddoppio del prezzo.
- **Arriva al mondo per valore**: il server la scrive nell'ambiente del processo del mondo (`worldEnv(platformFee)`), che resta senza segreti e la passa al kernel (`KernelOptions.platformFee`). Il processo non legge l'ambiente del server né il `.env`.
- **La decide solo il server**: il kernel non la cerca in `universe.json`, Lua e Concilio non hanno un'API per toccarla, il client non la manda. Uno specchio la riceve solo per mostrarla (`showPlatformFee`) e non addebita nulla.
- **`costWithFee(costo, commissione)` non ha un valore predefinito**: chi addebita o mostra dice quale commissione, così un punto nuovo non può restare all'1 % per dimenticanza.
- **Ciò che la mostra la segue**: il portafoglio del sito (`Wallet.commissione`, `feeText`) e la console del master (`ingresso.commissione`, solo al master). La lobby non mostra la commissione e non cambia.
- **I prezzi restano lineari**: controllato con questo task. Un credito è un dollaro (`paidCents`), i tagli di ricarica sono solo scorciatoie per l'importo, e la commissione è proporzionale al costo. Niente fasce né interessi.

## Alternative scartate

- **Un campo di `universe.json`**: il master o il Concilio potrebbero cambiarlo, e il prezzo è di chi tiene il server (regola 8d).
- **Un campo di `WorldOpen`, come `grantCap`**: funzionerebbe. L'ambiente è stato scelto dal task, e la lettura resta in un punto solo (`platformFeeOf`), con le stesse regole di validità da entrambe le parti.
- **Registrare nei consumi la commissione di ogni giorno**: renderebbe esatto il passato, ma cambia un file su disco per una differenza di al più l'1 %.

## Conseguenze

`world/consumi.json` tiene il costo senza commissione: dopo un cambio il portafoglio mostra anche i giorni passati alla commissione di oggi, mentre i saldi restano esatti. Un cambio vale dal riavvio del server, che ferma anche i mondi. Un valore non valido non ferma il server e non lo dice: chi vuole 0 e sbaglia a scriverlo addebita l'1 %. La sicurezza non ha superfici nuove: nessuna rotta o messaggio dal client, un numero solo in uscita, già pubblico sul sito.
