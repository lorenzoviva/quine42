# ADR-0136 — La fila delle scritture: ogni scrittura, salvata nella pagina, con un tetto; un 401 rinnova il token

Data: 2026-11-05 · Stato: accettato · Aggiorna: ADR-0122 · Riferimenti: ADR-0021, ADR-0102, ADR-0103, T211, T265

## Contesto

ADR-0122 ha messo i commit di `UniverseClient` in una fila ordinata, ma con tre limiti scritti: la fila viveva solo in memoria (una
pagina chiusa a server spento perdeva i commit), non aveva un tetto, e `putMap`, `branch` e `merge` non ritentavano. In più un 401 da
token scaduto era un rifiuto: il commit si scartava, anche se un token nuovo l'avrebbe fatto passare. L'autore (D15) li vuole chiusi prima della beta.

## Decisione

- **Una fila sola per ogni scrittura** (`OwedWrite`: `commit`, `map`, `branch`, `merge`). L'ordine è quello in cui sono partite, sempre:
  un piano, un ramo o una pubblicazione dietro un commit in attesa aspettano con lui e ritentano come lui (stessi tre esiti di
  `failureKind`). `getMap` legge prima la fila: un piano non ancora su disco è più nuovo di quello del disco.
- **La fila sopravvive a una ricarica** (`OwedStorage`, `browserOwedStorage`): nel browser una chiave di `localStorage` per scheda e
  universo, `quine:fila:<universo>:<scheda>`, con l'id della scheda in `sessionStorage`. Si riscrive a ogni cambio della fila e si toglie
  quando è vuota. Una ricarica trova la sua; due schede non scrivono mai l'una la fila dell'altra; la fila di una scheda senza notizie da
  `ORPHAN_LINE_MS` (2 minuti: chiusa, caduta) la prende la prima pagina dopo dello stesso universo. Ciò che si legge si controlla
  (`owedWrite`) e il resto si scarta. **Il token non si salva mai**: la fila ha solo le scritture; chi le riscrive lo fa con l'identità
  di adesso, e il server decide come per ogni altra (ADR-0102).
- **Prima di leggere l'universo** `load()` scrive ciò che la pagina prima ha lasciato: lo stato che il gioco carica è quello con quelle scritture.
- **Il tetto**: `OWED_MAX` (256 scritture) o `OWED_MAX_BYTES` (2 milioni di caratteri salvati). Al tetto una scrittura nuova si unisce a una
  già in fila, mai alla prima (che può essere in volo):
  - un commit all'ultimo commit in fila: i cambiamenti si sommano, i più nuovi vincono, il messaggio dice «fila piena»;
  - un piano a quello in fila con la stessa chiave; un ramo all'ultimo ramo con lo stesso nome, se dopo non c'è la sua pubblicazione;
  - ciò che non si può unire (una pubblicazione, un ramo dopo la sua pubblicazione) entra comunque: sono poche e rare.

  La storia perde dettaglio, il disco nessun file. Se anche così la fila supera i byte, resta in memoria e non si salva, con un avviso
  («una ricarica la perderebbe»); lo stesso se `localStorage` è pieno.
- **Un 401 rinnova il token** (`renewAuth`): una volta per giro si chiedono intestazioni nuove (il gioco le dà con `freshToken()`
  dell'account) e la scrittura si ritenta subito. Un token che ora non si rinnova (rete giù) tiene la scrittura in fila, come un server
  che non risponde. Un 401 anche col token nuovo è un rifiuto. Senza `renewAuth` (il processo di un mondo, col token interno) un 401 resta un rifiuto.
- **Un rifiuto del server non si ritenta** (regola 6, invariata), per nessuna scrittura.
- **Fuori dal browser** la fila resta in memoria, come prima: un processo Node non ha pagina (`browserOwedStorage` guarda anche `document`).
  Chi ferma un mondo aspetta la fila entro i suoi tempi (ADR-0121).

## Scartato

- **IndexedDB**: asincrono, quindi una scrittura partita subito prima di `pagehide` potrebbe non arrivarci; `localStorage` è sincrono e la fila è piccola.
- **Una chiave sola per universo**: due schede aperte riscriverebbero l'una le scritture vecchie dell'altra dopo quelle nuove, e il disco tornerebbe indietro.
- **`sessionStorage` da solo**: regge la ricarica ma non la scheda chiusa a server spento.
- **Scartare le scritture vecchie al tetto**: un commit porta solo ciò che è cambiato, uno scartato non tornerebbe più.

## Limiti

- Un processo di un mondo che muore a server spento perde ancora la sua fila (in memoria); il disco resta all'ultimo stato valido.
- La fila presa da una scheda chiusa si scrive con l'identità della scheda che la prende: se non può scrivere quell'universo, il server rifiuta e la fila si scarta.
