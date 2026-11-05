# ADR-0146 — L'edificio per stadi: il filtro della griglia finita, il cantiere attorno, lo stadio nel piano del luogo

Data: 2026-11-05 · Stato: accettato (task T245e del backlog) · Riferimenti: D8 dell'autore (04/11), `docs/design/comportamento-npc.md` (sezione 3.4), ADR-0043 (i lotti e le strutture), ADR-0046 (i voxel luminosi), ADR-0059 (il client sottile), ADR-0108 (la cache delle forme), ADR-0145 (le imprese)

## Contesto

Con le imprese (ADR-0145) una casa si ricostruisce o si costruisce, ma non sale a vista. Un programma MarkovJunior gira in un colpo e un seme diverso dà una pianta diversa: non si può eseguirlo a tappe senza riscriverlo. Il progetto propone l'opposto: il programma gira una volta, la griglia finita (già in cache) si mostra filtrata per stadio. Serve che lo stadio duri con il luogo, che chi cammina incontri ciò che c'è e non ciò che ci sarà, e che lo veda anche un client in una partita di molti.

## Decisione

1. **Il filtro è una funzione pura** della griglia finita (`stageGrid` in `src/mj/mesh.ts`, accanto a `meshVoxels`): le quote vengono dalla griglia sola (`stageHeights`: un strato è pieno quando ha qualcosa in almeno il 60 % delle colonne dell'edificio; il primo pavimento è la cima del primo strato pieno dal suolo, la base del tetto l'inizio dell'ultimo strato pieno sopra di esso). Stadio 0: niente dell'edificio. Fino a 0,2 (platea): il piano terra. Fino a 0,7 (muri): l'altezza sale dal primo pavimento alla base del tetto. Da 0,9 (tetto): tutto. Sotto 1 le luci sono spente (la tavolozza restituita non ha `glow`) e la cantina non c'è. A 1 la griglia e la tavolozza sono quelle di prima, lo stesso oggetto. **Nessun nodo MarkovJunior nuovo**, nessun programma nuovo: funziona con ogni modello già scolpito, dei vecchi universi compresi.
2. **Il cantiere attorno** (`site`): un voxel in più per lato (la griglia cresce di due, il centro resta), e due lettere del kernel con il loro colore (`SCAFFOLD_LETTER`, `STAKE_LETTER`): a 0 i picchetti agli angoli e la corda all'altezza di un ginocchio, mentre sale le impalcature (pali a ogni casella e agli angoli, tavole a ogni casella d'altezza) fino a poco sopra ciò che sta su, ancora con il tetto; a 1 spariscono. Sono voxel derivati dalla griglia e dallo stadio, non due modelli del seme: un modello andrebbe scalato a ogni lotto e chiederebbe un posto in più da validare, mentre il filtro sa già la scatola dell'edificio.
3. **Ciò che un corpo incontra segue lo stadio**: `groundOf` (impronta, pavimenti, piani) usa la griglia filtrata senza il cantiere (picchetti e impalcature non bloccano), con una cache per istanza e stadio. A 0 il lotto si attraversa; i muri bloccano a caselle quando ci sono (regola 10). Le stanze di una casa (`interiorPoints`, dove `placeFor` mette chi ci abita) valgono dal tetto.
4. **Lo stadio sta nel piano del luogo**, che è ciò da cui il kernel riposa il luogo a ogni caricamento e che dura con lui (i client non lo ricevono: hanno le entità, punto 5): `plan.stadi` (origine del lotto → stadio) per un edificio che un'impresa rifà, `plan.case` (origine, posto, modello, seme, verso, classe, concetto, stadio) per una casa su un terreno libero. Due campi nuovi e a parte, come `plan.giorni` (ADR-0140): un kernel della stessa `X.Y` che non li conosce posa il luogo come prima. Il kernel li scrive quando un'impresa nasce, quando una fase si chiude e quando finisce (`syncVenturePlan`), e `settleLots` li legge: le case nuove non vengono più dal file delle imprese ma dal piano. La struttura nel mondo ha `struttura.stadio` (assente: intera).
5. **Sul filo**: della struttura di un edificio che sale il server manda solo lo stadio (`c.struttura = {stadio}`, nulla quando è intero); il client sottile lo scrive nel componente e lo toglie quando non arriva più. Il renderer rifà la mesh dell'istanza con il filtro e il cantiere (`stagedBody`), una per modello, seme, azioni e stadio.

## Alternative scartate

- **Eseguire il programma a tappe** (`steps`): coerente, ma chiede programmi scritti apposta, e lo Scultore non li sa scrivere (T156).
- **Le classi di voxel** (platea, muro, tetto per lettera): la tavolozza non ne ha, una lettera è un colore; le quote valgono per ogni modello.
- **`strutture[].stadio`** nel piano (come diceva il progetto): `strutture` è ciò che il Cartografo chiede, nell'ordine dei lotti più grandi, e non nomina le case comuni né quelle nuove; un elenco per origine non dipende da quell'ordine.
- **Lo stadio letto dal file delle imprese a ogni caricamento**: un luogo si posa dal suo piano, e il piano deve bastare anche a un kernel che non conosce le imprese (la stessa `X.Y`).

## Conseguenze

- `tests/stadi.test.ts`: le quote e il filtro su una casa di prova, il cantiere attorno, una ricostruzione che sale di stadio nel mondo, nel piano e nell'impronta, la riapertura, ciò che esce sul filo.
- Le imprese di ADR-0145 non lasciano più il lotto vuoto: lo mostrano a 0 (picchetti) e poi a stadi.
- Kernel 0.1.7 (compatibile: due campi in avanti nel piano, un campo in più per un'entità sul filo).
- Sicurezza: un campo nuovo sul filo, a elenco (`struttura`, solo `stadio`, un numero tra 0 e 1, e solo per un edificio che sale): nulla della struttura oltre a ciò che il client disegna già. Il filtro è puro e lavora su una griglia che c'è già; nessuna rotta, nessun messaggio nuovo.
