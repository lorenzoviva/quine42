# ADR-0094 — Il motore dell'acqua: un automa cellulare del kernel

Data: 2026-10-31 · Stato: accettato (task T51b del backlog) · Estende ADR-0048 (punto 7, il livello del mare e l'acqua piana
tra i chunk, T51a) · Riferimenti: ADR-0014 (gli effetti), ADR-0055 (i semi condivisi), `docs/pipeline/domande/T51.md`

## Contesto
Con T51a ogni specchio d'acqua è piano per intero attraverso i chunk caricati (`worldLevels` in `relief.ts`), al livello più basso
delle sue caselle e mai sopra la riva; il mare sta al suo livello. Ma l'acqua non si muove: quando il terreno cambia (gli incantesimi
che alzano o abbassano il terreno, T57c; «Altro…» che scava) un lago accanto a una conca nuova dovrebbe riempirla e abbassarsi. L'autore
(30/10) ha scelto l'automa cellulare del kernel: MarkovJunior resta per **generare** (rilievo, fiumi, i luoghi), non per la fisica.
Un programma MarkovJunior a ogni tick su tutto il mondo caricato costerebbe troppo (ogni passo cerca le regole su tutta la griglia) e
non si fermerebbe mai del tutto.

## Decisione
1. **L'automa** (`src/kernel/water.ts`, `WaterFlow`): ogni casella ha un **letto** e una **quantità d'acqua** (in livelli, un quarto di
   casella); a ogni passo una casella dà a ciascun vicino più basso una parte (`RATE` 0,2) della differenza tra le superfici, mai più di
   ciò che ha. Gira solo sulle caselle attive (cambiate, e i loro vicini) e si ferma quando nulla si muove più di `EPS`. La quantità si
   conserva; il **mare** (acqua al livello del mare o sotto) è una sorgente che non sale né scende. Puro e deterministico (stesso mondo,
   stessi passi, stessa acqua: ADR-0055), nessun orologio: i passi li conta il tick.
2. **Da dove parte**: una casella d'acqua mai mossa ha `DEEP` (2) livelli d'acqua sotto la superficie che le dà il campo di T51a; la terra
   ha il suolo del rilievo, scavato o alzato, mai sotto il mare; una casella che ha già scorso riparte da ciò che il suo piano tiene. Una
   casella d'acqua porta nell'automa tutto il suo specchio, fin dove arrivano i luoghi caricati, prima che qualcosa scorra (così la
   superficie letta è quella di prima). Al più `MAX_CELLS` caselle (il pavimento).
3. **Cosa cambia nel mondo** (`kernel.applyWater`): oltre `WET` (½ livello) una casella è acqua, sotto è terra. La terra che diventa acqua
   prende il tipo d'acqua da cui è venuta (o di un vicino) con `setTile`, e ricorda ciò che era; l'acqua che si asciuga torna ciò che era
   (o la terra accanto che non blocca). Durante il flusso si scrive solo ciò che si vede (acqua o terra, superficie arrotondata al livello);
   a riposo tutto, con le quantità esatte, e l'automa si svuota (`rest`): il flusso dopo riparte dai piani.
4. **Nel piano del luogo**: `scavi` (casella → livelli scavati o alzati) e `acqua` (casella → letto, acqua e, se era terra, il tipo di
   prima). Il campo di T51a (`worldLevels`) prende il rilievo più gli `scavi`, e le caselle d'acqua che hanno scorso hanno la loro
   superficie fissata (`pinned`): non le abbassa ciò che le circonda, e l'acqua mai mossa che le tocca scende a loro come a ogni acqua più
   bassa. Il client sottile riceve `scavi` e `acqua` nel `PlaceView`; lo specchio non fa scorrere nulla.
5. **Il ritmo**: `WATER_STEPS` (10) passi ogni `WATER_EVERY` (6) tick, cioè 100 passi al secondo a 60 Hz: una conca di una dozzina di caselle
   accanto a uno stagno si riempie in un paio di secondi, un lago grande in una decina.
6. **Lo strumento**: `kernel.dig(col, row, delta)` scava (negativo) o alza il suolo di livelli interi (al più 8 per volta, 16 in tutto)
   su un luogo pianificato e sveglia l'acqua attorno; lo useranno l'effetto `rilievo` di T57c e «Altro…» che scava. Nessuna API Lua nuova.

## Conseguenze
- Un lago che dà acqua a una conca si abbassa di quanto le ha dato; l'acqua sopra la terra accanto può esserci solo mentre scorre.
- Lo scavo sotto il livello del mare è fermato al mare (la terra mai sotto il mare, T51a); sotto l'acqua il letto scende davvero.
- La parte di uno specchio fuori dai luoghi caricati non dà acqua; quando arriva scende al livello di quella che ha scorso.
- Se il gioco si chiude a metà flusso, il piano tiene l'ultimo stato scritto e l'acqua resta lì finché qualcosa non la sveglia.
