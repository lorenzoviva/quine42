# ADR-0233 — Il vuoto, il cielo di stelle, il giorno della natura

Data: 2026-11-20 · Stato: accettato (task T445 del backlog, S1 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 2.1-2.3)
· Riferimenti: ADR-0224 (la natura del mondo, le primitive della fisica, `NATURE_ACCEPTS`), ADR-0229 (l'arcipelago: le isole del kernel dal
seme, il mare aperto senza chiamate), ADR-0227 (il veicolo), ADR-0124 (dal cerchio nessuno vede la corona), ADR-0221 (ciò che il kernel non sa
fare non si dice), ADR-0136 (la versione del kernel)

## Contesto

Lo spazio vuole tre cose che il kernel di oggi non sa fare: il **vuoto**, una superficie che il corpo non cammina, non nuota e non salta,
attorno a terre (stazioni, asteroidi) che vi stanno sospese; il **cielo di stelle**, al posto dei colori fissi del cielo della terra; il
**giorno** della natura, al posto della costante `DAY_SECONDS`, con la luce che non cambia di una stazione. T437 ha lasciato i campi in
`universe.json → nature` (`geography: void`, `sky: stars`, `day`) chiusi finché un task non li rendesse veri; T441 ha fatto il meccanismo delle
isole del kernel. Il veicolo nel vuoto, la capsula che unisce due terre, è di T448 (S4).

## Decisione

1. **Il vuoto è un terreno del kernel**, non dei manifest: il codice `~` (`VOID_CODE`), lo strato `void`, `voidTerrain` nella lingua del mondo
   (`src/kernel/nature.ts`). È l'assenza del pavimento: non si cammina, non si nuota (`crossingOf` dice `none` qualunque cosa dica il
   terreno), non c'è aria, il salto non lo passa (è solido e non è un liquido, `airFree`), niente vi si posa (non è tra le caselle raggiungibili),
   nessun effetto, incantesimo o Lua vi costruisce né lo apre (`setTile`), l'acqua non vi scorre, nessun lotto di un blocco lo copre. Sta solo
   nella palette di un mondo del vuoto: il kernel ve lo aggiunge (`paletteOf`), sopra un terreno del generatore con lo stesso codice; la Genesi
   rifiuta `~` come codice di un terreno e il validatore dei manifest non conosce lo strato `void`. Un universo di oggi non lo ha.
2. **Le stazioni e gli asteroidi sono le isole di T441** (`src/kernel/islands.ts`): lo stesso reticolo dal solo seme, gli stessi centri, con
   `nature.geography: void`. La terra della partenza è una stazione grande quanto l'isola della partenza; delle altre, una su tre è un asteroide
   (`ASTEROID_ONE_IN`, raggio 10-24 caselle), le altre stazioni (16-40). Il bordo di una stazione è una superellisse (squadrata, gli angoli
   tondi, ogni raggio dal centro la incontra una volta); quello di un asteroide la curva mossa delle isole. **Niente isolotti**: nel vuoto non
   si nuota. Ferme come le isole: dipendono solo dal seme e dalla natura.
3. **La bozza** (`voidDraft`, in `genDraft`): fuori dai bordi il vuoto; il pavimento di una stazione è il sentiero della palette (`p`: la
   lamiera, i ponti, i corridoi su cui gli ambienti costruiscono); un asteroide tiene ciò che il generatore ha disegnato, senza prato, alberi
   né acqua (polvere `s`, roccia `r`, ghiaccio `n`), il bordo di polvere. Un generatore riscritto ha le stesse terre.
4. **Il layout** (`layout.ts`) non scava mai il vuoto (nessuna via vi passa) e non vi fa varchi: un varco sul vuoto resta vuoto. I varchi di un
   luogo del vuoto stanno dove la terra continua nel luogo accanto, dalle due parti del lato (`voidGates`: dal varco dell'hash, la prima casella
   lungo il lato che è terra da tutte e due le parti; i due luoghi guardano le stesse due file di caselle, quindi concordano); un lato vuoto da
   una parte ovunque tiene il varco dell'hash, che il layout lascia vuoto. Un luogo con tutti i varchi sul vuoto si collega dalla sua terra più
   vicina al mezzo. Un programma d'ambiente non scrive sul vuoto e non lo apre nella terra: dopo il programma le caselle tornano alla bozza;
   lo stesso per i ritocchi del piano (`edits`).
5. **Il vuoto costa zero**: un luogo tutto vuoto lo pianifica il kernel senza chiamate, come il mare aperto (`seaPlan`, «Vuoto» nella lingua
   del mondo, `OPEN_VOID`), fuori dalla quota e dalla pausa. Il Cartografo battezza la stazione o l'asteroide col primo luogo che vi pianifica,
   come un'isola (`island` della richiesta con `body`, la riga `VOID_LINE` al posto di quella delle rive); `world.region_at` e `world.islands`
   leggono anche le terre del vuoto (`body`: `station`, `asteroid`).
6. **Il cielo di stelle** (`nature.sky: stars`, `src/render/stars.ts`): uno sfondo nero col sole che illumina come di giorno; una sfera di stelle
   che segue la camera (sopra e sotto il pavimento) e un campo più lento sotto il piano, che si muove con il mondo a una parte della sua via
   (la parallasse, periodico, quindi non finisce mai); né la nebbia né la luce li toccano; mai con la corona (ADR-0124). Sul vuoto il renderer
   non disegna niente (si vedono le stelle) e il bordo della terra accanto è una lastra con il suo spessore (`VOID_SLAB`). Solo disegno.
7. **Il giorno della natura** (`nature.day`): i secondi di un giorno, da 2 minuti a un'ora (`NATURE_ACCEPTS.day` 120-3600), o 0 per **la luce
   ferma** (`STILL_DAY`: le lampade di una stazione, il sole fermo su un asteroide), sempre pieno giorno (`daylight` 1). Il giorno entra
   nell'orologio del mondo (`Kernel.daySeconds`, `clockDay`: le routine, i turni, ciò che matura, i giorni di un piano); sotto la luce ferma
   l'orologio tiene il giorno della terra (600 s), così la gente di una stazione dorme e lavora. Si sceglie alla Genesi e non cambia.
8. **Nessuna ambientazione porta il vuoto, per ora**: la regola 10 vuole ogni luogo connesso, e fra due terre del vuoto si va solo con la
   capsula, che T448 mette a ogni approdo (ADR-0224 punto 6). Finché non c'è, `void` si accetta (un `universe.json` scritto a mano, i test, la
   verifica nel browser) ma lo Spazio della Genesi resta la colonia di oggi (ADR-0221), con il cielo della terra perché ha l'aria; lo porterà
   T448 o lo Spazio nel Concilio (T450). Le stelle valgono anche per un mondo che non è il vuoto.

## Alternative scartate

- **Passerelle del kernel fra le stazioni** (un sentiero sul vuoto, come l'isolotto fra due isole): terrebbero la regola 10 senza la capsula,
  ma l'autore ha scelto la capsula a ogni approdo (D64, ADR-0224 punto 6) e un ponte di cento caselle nel vuoto non è lo spazio.
- **Il vuoto come codice di base** (`BASE_CODES`): ogni Genesi dovrebbe scriverlo, anche dove non serve; il kernel lo aggiunge solo dove la
  natura lo dice.
- **Il vuoto come un liquido che non si nuota**: erediterebbe il salto sopra l'acqua, l'automa, le rive e la schiuma.
- **La luce ferma che ferma anche l'orologio**: le routine e ciò che matura si fermerebbero con lei.

## Conseguenze

- Contratto invariato (kernel 0.10.9; la 0.10.8 è di T442): un universo di oggi non ha il vuoto nella palette e la sua natura è quella di prima; i piani salvati restano.
- Restano: la capsula e le astronavi (T448), l'aria e l'ossigeno (T446), i terreni e gli ambienti dello spazio nel Concilio (T450), i pianeti (T449).
- Sicurezza: nessuna superficie nuova. `nature` era già pubblica; il campo `body` di `world.islands` è una copia in sola lettura; il vuoto non si
  scrive da Lua (`world.set_tile` lo rifiuta) né dal filo; il filo non cambia.
