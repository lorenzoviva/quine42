# ADR-0138 — Il magazzino dei moduli, il salvataggio che conserva ciò che non conosce, la manopola `vite`

Data: 2026-11-05 · Stato: accettato (task T245a del backlog) · Riferimenti: D8 e D10 dell'autore (04/11), `docs/design/comportamento-npc.md` (sezioni 1.4, 6, 7 e 9), `docs/design/espressivita.md` (primitive D, regola 4 dei cambi senza wipe, `TRAP: in the saved state`), ADR-0085 (coefficienti), ADR-0109 (ciò che esce, a elenco), ADR-0133 (le regolazioni si fissano entrando), ADR-0137

## Contesto

T183 ha misurato che ciò che manca di più a una meccanica non è un gesto ma la memoria: dopo una riapertura da Lua durano solo le caselle cambiate e gli stati del viandante; un `singleton` torna al manifest, il mercato dimentica il prezzo, il cantiere il suo contatore. La primitiva `D` sblocca 20 scenari su 39 e ogni meccanica forgiata prima nasce smemorata. Nello stesso giro: il salvataggio riscriveva `world/stato.json` e i file dei viandanti da zero, quindi un campo scritto da un kernel più nuovo si perdeva tornando a uno più vecchio. E i mestieri e le imprese degli NPC (T245b e seguenti) hanno una manopola nuova, `vite`, che deve esistere con il valore giusto prima che nascano gli universi ufficiali.

## Decisione

1. **`world.store_get(chiave)` e `world.store_set(chiave, valore)`**: il magazzino del modulo che gira. Il kernel sa quale modulo gira (`luaModule`, messo da `runModule` e ripreso dopo, anche per le chiamate annidate): ogni modulo vede solo il suo, una runa e un client sottile non ne hanno (restituiscono `nil` e `false`).
2. **Un file per modulo**, `world/magazzino/<modulo>.json`, scritto da `saveState` con la partita (ADR-0137: anche con un guasto aperto), letto al caricamento con reset, quindi tornato indietro con `R` come ogni file dell'universo. Il percorso è già tra quelli ammessi (`paths.ts`).
3. **I limiti** (`src/kernel/store.ts`): chiavi di lettere, cifre e `_ - . :`, al più 64 caratteri, al più 256 per modulo; valori di soli dati (testi, numeri finiti, booleani, tabelle fino a 16 livelli); 64 KB di JSON per modulo e 1 MB per universo. `nil` toglie una chiave. Ciò che sfora o non è un dato è rifiutato con `false`, senza guasto, e il magazzino resta com'era. Un file che non si legge è un magazzino vuoto.
4. **Non esce mai**: `playerFiles` e `publicFiles` nominano i file uno per uno (regola 8f) e `world/magazzino/` non c'è. Il Concilio non lo scrive: nessun agente produce quel file, e il kernel lo scrive solo nel salvataggio, che lo committa subito. Il percorso resta in `councilMayWrite` come tutto `world/`: chiuderlo è una riga in `paths.ts` se un agente nuovo dovesse scrivere in `world/`.
5. **Il salvataggio conserva i campi ignoti** di `world/stato.json` e di `world/giocatori/<id>.json`: ciò che il kernel non nomina (`STATE_FIELDS`, `WANDERER_FIELDS`, i campi delle sue migrazioni compresi) resta com'era. I crediti di prima della migrazione no: i saldi stanno fuori dall'universo (regola 8d).
6. **`vite` in `COEFFICIENT_KEYS`**, con i nomi Cronaca (0), Vita (0,5), Teatro (1). **Assente vale 0** (`ABSENT` in `coefficients.ts`), a differenza di ogni altra manopola che vale 1: un universo di prima non deve giocare Teatro senza averlo scelto. «Pieno» la porta a 1, «Low Detail» a 0,2. Entra con il master e si fissa come le altre (ADR-0133): nessun codice del server cambia. La lobby la mostra come ogni manopola; `hourlyEstimate` ha la sua riga, a zero chiamate finché i compiti dei mestieri e delle imprese scritti dal Narratore non ci sono (T245g-T245i).

## Alternative scartate

- **Un magazzino per viandante** (la variante di T183): nessuno scenario del seme lo chiede ancora; si aggiunge dopo come chiave (`viandante:<id>`) o come primitiva, senza toccare questa.
- **I componenti che durano** (`persist` su ogni componente): un componente sta su un'entità, che un luogo scaricato non ha; il magazzino è del modulo, non dell'istanza.
- **Un file solo per tutti i moduli**: un modulo rotto o riscritto riscriverebbe anche gli altri, e il tetto per modulo diventerebbe un conto a parte.

## Conseguenze

- `tests/espressivita/`: il «kernel di domani» di `dopo.test.ts` non serve più, le stesse prove girano sul kernel di oggi; `TRAP: in the saved state` è ora un test che afferma che il campo resta.
- Il prompt dell'Ingegnere dice il magazzino; `LUA_API`, `prelude.lua`, `Host` e `AGENTS.md` lo nominano.
- Sicurezza: un modulo generato scrive su disco, entro i tetti e dentro un file del mondo; nessuna rotta, nessun messaggio, nessun campo nuovo sul filo. Il lavoro di `store_set` (una copia e una misura del JSON del modulo, al più 64 KB) sta nel budget del tick come ogni chiamata del `Host`.
