# ADR-0244 — Ciò che sembra un veicolo si guida: la Fucina lo scrive, il validatore lo vuole, il kernel lo ripara e lo mette dove si muove

Data: 2026-11-22 · Stato: accettato (task T487 del backlog, step 34) · Riferimenti: ADR-0227 (il veicolo), ADR-0228 (lo Scultore delle navi),
ADR-0232 (il veicolo in molti), ADR-0234 (le capsule del vuoto), ADR-0064 (regola 10: ciò che sembra invalicabile lo è), ADR-0168 (ciò che si
prende), ADR-0136 (la versione del kernel), T457 (la prima run della beta)

## Contesto

Nella prima run della beta (T457) le chiatte di `orichalcum` non si guidavano. `obj.chiatta-a-vapore-della-d` l'aveva fatta la Fucina per un
luogo del Cartografo come una cosa qualunque (`kind: entity`, classe `object`, una stiva, un'azione «Vai al timone» che dava solo uno stato):
per il kernel era un soprammobile. Il veicolo di T439, T442 e T448 funziona, ma nessun agente sapeva scriverlo, e il Cartografo non metteva
veicoli nei luoghi (`catalog` li toglieva: «li fanno Lua e i porti», che però non ne mettevano). Il Cartografo aveva poi messo la stessa
chiatta nei piani di circa 120 luoghi del porto: una barca che non si muove, ripetuta in ogni darsena.

Una barca che non si guida promette ciò che non fa, come un muro che si attraversa: la regola 10 dice che ciò che sembra invalicabile lo è;
la sua sorella è che ciò che sembra un mezzo si guida.

## Decisione

1. **Che cosa si presenta come un veicolo** (`src/kernel/vehicleclaim.ts`, `vehicleMediumIn`): il **nome** di una cosa del mondo (non
   qualcuno, non un oggetto dell'inventario) che comincia, dopo articoli e aggettivi che vanno davanti, con un nome di mezzo
   dell'italiano («Chiatta a vapore della darsena», «Vecchio carro del fieno»), o che lo ha nelle prime parole in inglese («Steam barge»,
   «Old fishing boat»); oppure i suoi **tag**, se uno dice `veicolo`/`vehicle` e un altro il mezzo. Il mezzo è ciò su cui va: l'acqua (barca,
   chiatta, zattera, canoa, gondola, battello, nave, veliero…), la terra (carro, carretto, carrozza, calesse, slitta…), il vuoto (capsula,
   navetta) **solo in un mondo del vuoto** (`worldMedia`). Non si presenta come un veicolo ciò che il nome dice decorazione (un relitto, una
   chiatta arenata o in secca, un modellino, una nave in bottiglia, un carro rotto, un dipinto, un'insegna) né ciò che il kernel non sa
   muovere: ciò che va su rotaia (tram, treno, carrello da miniera) e ciò che vola (il dirigibile) restano cose; né una parola che comincia
   come un mezzo (barcaiolo, carrozzeria, navigatore). Le altre lingue sono di T239.
2. **La Fucina lo scrive** (`forge.ts`). Il concetto del Narratore ha `vehicle`: `water`, `land`, `void` o `none` (lo schema, il prompt:
   «ciò che si guida dice su che cosa va; `none` per tutto il resto e per ciò che ne ha solo l'aspetto, e allora lo dice il nome»); il Fisico,
   per un veicolo, `vehicle_speed`, `vehicle_accel`, `vehicle_turn` e sull'acqua `draught`, con misure del mondo nel prompt. Il medium del
   concetto (`conceptMedium`) è quello del Narratore, se il mondo lo ha; **se il Narratore non dice niente, quello del nome** (il pavimento
   del kernel: una chiatta dimenticata resta una chiatta). Il kernel scrive il manifest (`assembleManifest`): `vehicle` coi numeri del Fisico
   dentro `VEHICLE_LIMITS` o quelli del mezzo (`vehicleFor`, `MEDIUM_DEFAULTS`: una chiatta 2,5 caselle/s, un carro 3, una capsula 6), solido
   e mai spinto né da prendere, e sull'acqua la classe `vessel`, così lo Scultore delle navi (ADR-0228) lo fa galleggiare. Il riassunto dice
   «Nuovo mezzo … si guida (sull'acqua)».
3. **Il validatore lo vuole, col motivo all'agente**. Un concetto il cui nome dice un mezzo e il Narratore dice `none` torna al Narratore
   una volta (`vehicleRefusal`: «si presenta come un mezzo che si guida…: scrivi "vehicle", o fanne ciò che è davvero e dillo nel nome»), poi
   la Fucina rifiuta (`ForgeRejected` del Narratore, una mancanza). Il giro dell'Arbitro che lo riporta a `none` prende la parola del kernel.
   Come pavimento per ogni modulo forgiato, `validateForged` rifiuta una cosa del mondo che si presenta come un veicolo senza `vehicle`
   (`vehicleClaimErrors`); non `parseManifest`, che legge anche gli universi di prima e i moduli scritti a mano.
4. **Il Cartografo può chiederne uno nel piano**, ma solo dove si muove: il catalogo di un luogo (`catalogFor`, non `catalog`, che resta
   quello del Concilio e dei test) offre, col tipo `vehicle`, i veicoli del Concilio che stanno nella bozza del luogo con tutta la loro
   scatola su ciò che li porta, finché il mondo ne ha meno di `MAX_VEHICLES`; mai la capsula del seme, che hanno gli approdi. Un veicolo per
   luogo: il secondo lo toglie `validatePlan` («un veicolo per luogo»). Il prompt glielo dice solo quando il catalogo ne ha uno; i modelli
   locali lo mettono, a parte, dove è offerto (le estrazioni del resto non cambiano).
5. **Nasce dove può muoversi** (`vehicleSpot`, `placeVehicle`): in `applyPlan` e quando la Fucina finisce ciò che un luogo ha chiesto, un
   veicolo non va sulla casella estratta per lui (che resta presa, così le altre cose del piano restano dove erano) ma dove la sua scatola
   (la classe alla sua taglia, `tilesOf`, con un quarto di casella attorno) sta tutta su ciò che lo porta dentro il luogo, la prua lungo un
   lato; prima dove si sale dalla terra (una casella dello scafo entro `BOARD_REACH` da una che si cammina), poi la più vicina alla casella
   del piano, deterministico e senza estrazioni. In un luogo senz'acqua, o oltre i veicoli che il mondo tiene, **non nasce**: non diventa
   mai una cosa del luogo che sembra un mezzo e non si muove. Mai in uno specchio.
6. **L'ormeggio** (`berths`): un veicolo che il piano di un luogo ha messo e nessuno ha mosso è del suo luogo: non è consumato né salvato, se
   ne va col luogo (`unloadChunk`) e torna con lui, come la capsula lasciata ferma (ADR-0234). Appena si muove (`vehicleTick`) lascia
   l'ormeggio: da lì è di nessun luogo, la sua origine consumata e il salvataggio lo tiene dov'è. Così ogni darsena ha la sua chiatta e i 32
   veicoli del mondo restano per quelli che qualcuno ha usato; i veicoli accesi sono quelli dei luoghi caricati.
7. **La riparazione degli universi di prima** (`repairVehicleClaims`, all'avvio del kernel, dopo le migrazioni, un commit del kernel
   «riparazione: si guidano …»; mai in uno specchio, nel banco o in un universo che si legge soltanto): i moduli forgiati dal Concilio
   (`origin` genesi, agente, cartografo, combinazione) che si presentano come veicoli senza `vehicle` lo prendono dal kernel, col mezzo del
   nome e i numeri del mezzo, solidi e non spinti; la classe `vessel` solo se il loro modello non è ancora scolpito (quello che c'è resta).
   Ciò che il nome dice decorazione resta decorazione dichiarata; i moduli scritti a mano non si toccano. È una riparazione, non una
   migrazione: il formato non cambia (`vehicle` c'è da 0.10.3), un universo riparato si apre anche sul kernel di prima. Kernel **0.10.20**.

## Conseguenze

- Una barca chiesta alla Fucina si guida: sale a bordo, il timone, si muove (`tests/veicoli-concilio.test.ts`, coi modelli locali).
- La chiatta di `orichalcum` si guida: sul clone la riparazione le dà `vehicle` (acqua, bassa) e nei dieci porti attorno al viandante nasce
  sull'acqua accanto alla riva (`lab/scripts/veicoli-finti.ts`, che lo dice senza scrivere). La sua azione «Vai al timone» del Narratore
  resta (dà uno stato): non la togliamo, non promette un'altra cosa.
- I mezzi su rotaia e in aria aspettano una primitiva (rotaie, il volo): finché non c'è non si presentano come veicoli, e nessuna regola li
  obbliga a esserlo.
- Il carico (la stiva) resta di T444; le ruote dei carri una classe loro.
- Sicurezza: nessuna superficie nuova (un commit del kernel all'avvio, nel solo universo, coi campi che il manifest aveva già).
