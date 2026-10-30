# ADR-0084 — L'eredità dei cloni

Data: 2026-10-30 · Stato: accettato (task T45c del backlog) · Estende ADR-0056 (le carte) e ADR-0068 (il clone con un altro master).

## Contesto
Un clone copia le carte di un universo (ADR-0068); un clone di un clone porta contenuti che possono essere stati cambiati più
volte. L'autore ha deciso (29/10/2026) che i contenuti passano solo nei cloni, con una gerarchia di titolari e una quota per chi ha
dato origine al contenuto: una base fissa di eredità (10 %, in `universe.json`) più una parte che dipende da quanto il contenuto è
stato cambiato rispetto all'originale; il resto al titolare attuale.

## Decisione
1. **La catena** (`carta.origini`, `Origine {titolare, universo, impronta}` in `src/kernel/heritage.ts`): a ogni clone
   `inheritCards` (in `clone.ts`, chiamata da `cloneChanges` sempre, anche quando i titolari restano) aggiunge a ogni carta un anello:
   il titolare che aveva nell'universo da cui viene, il nome di quell'universo e l'impronta del contenuto in quel momento. Poi, se
   le carte passano, cambia il titolare. Autore e pagante non cambiano mai.
2. **Il contenuto di una carta** è ciò che la porta (`contentText`: JSON con le chiavi in ordine, senza nessuna `carta`): un modulo
   col suo `logic.lua`, un oggetto, un ambiente, un incantesimo, una ricetta col loro oggetto o, se non hanno una carta loro, il
   modulo di dati intero; un modello la sua voce dell'indice; persone, trame e regole la loro voce nel file com'è scritta; un luogo
   il suo nome (il piano in `maps/` non si riscrive mai).
3. **Quanto è cambiato** si misura senza tenere l'originale: l'impronta è un MinHash di 32 numeri sulle sequenze di tre parole del
   contenuto (`fingerprint`); `changeOf` è la parte dei numeri diversi (0 uguale, 1 nulla in comune). È la misura del diff del file
   alla risoluzione di 1/32.
4. **Le quote** (`sharesOf`): a ogni utilizzo, risalendo dal titolare attuale, ogni anello passa indietro
   `base + copia × (1 − cambio)` di ciò che ha ricevuto e tiene il resto; il primo titolare tiene ciò che gli arriva. Il cambio di
   un anello è tra l'impronta del clone e quella dopo (o il contenuto di adesso): chi ha riscritto il contenuto in un clone intermedio
   tiene di più. `universe.json → eredita {base, copia}` (seme: 0,1 e 0,4; `repairEredita`: tra 0 e 1, somma al più 1): un contenuto
   copiato senza cambiarlo dà metà di ogni utilizzo a chi c'era prima, uno riscritto solo il 10 %.
5. **Gli utilizzi** di un universo clonato si contano dalla sua nascita: il clone mette in `world/carte.json → allaNascita` gli
   utilizzi che le carte avevano (quelli li ha già divisi l'universo da cui viene). `CardLedger` lo conserva.
6. **Ciò che si riceve**: `allCards(files, true)` dà le `quote` delle carte con una catena; `receivedBy(files, id)` e
   `kernel.received(id)` le carte di un universo tenute da altri di cui il viandante è un anello, con la quota, l'universo dove
   l'aveva, gli utilizzi dalla nascita e `ricevuto = quota × utilizzi`. Mostrarlo fuori dalla partita, sommando gli universi, è della
   collezione della lobby (T45d); i crediti che si muovono davvero sono di T45a.

## Conseguenze
- `tests/heritage.test.ts`: clone di un clone con la catena; contenuto mai cambiato (½, ¼, ¼), cambiato poco, riscritto (solo la
  base), cambiato nel clone di mezzo; ciò che si riceve dagli utilizzi dopo il clone; `eredita` da `universe.json`; il kernel del
  clone conserva catena e `allaNascita`. `tests/clone.test.ts`: un clone cambia ora anche i file con carte.
- Un contenuto nuovo nato nel clone è una carta senza catena: tutto al suo titolare.
- Il MinHash non vede l'ordine al di là delle tre parole e ha la granularità di 1/32: basta per «poco o tanto».
