# ADR-0259 — Il fondale (R4)

- **Stato**: accettato
- **Data**: 2026-11-23
- **Task**: T480 (riga 7 di T459, `docs/design/terreno-3d.md` § 3.3 e § 7)
- **Estende**: ADR-0256 (il rilievo vero), ADR-0249 (gli strati come regole), ADR-0242 (la mesh dei luoghi nel worker), ADR-0094 (l'acqua che scorre), ADR-0091 (cantina e componente `below`), ADR-0093 (cartoon e inchiostro)

## Contesto

Con T475 (ADR-0256) il generatore del rilievo vero (`generate_relief`, `islandRelief`) restituisce già una seconda riga di livelli: il **letto** sotto l'acqua (`Relief.bed`, mare profondo 8–28 livelli, acqua bassa 2–7, secche 1). Tuttavia:
- il renderer disegnava l'acqua sempre opaca (`SEA_MAT.water`), senza alcuna colonna di fondale né strati sotto la superficie;
- `water.ts` usava una profondità fissa `DEEP = 2` livelli per qualsiasi specchio d'acqua;
- il Cartografo non poteva collocare dettagli sommersi sul fondale (casse affondate, ancore, coralli, relitti);
- i client sottili non ricevevano i livelli del letto (`ChunkView.relief` portava solo la superficie, e `bed` veniva posto uguale a `levels`).

Serve rendere il fondale visibile, coerente fra pagina, worker e multigiocatore, con i suoi strati e i dettagli sommersi del Cartografo, preparando il terreno per l'immersione (R5, T481) senza alterare i mondi collinari (`Hills`) né i liquidi non nuotabili (lava).

## Decisione

1. **Il letto nel kernel e nell'automa dell'acqua**:
   - `Kernel.bedLevelAt(col, row)` e `Kernel.bedAt(x, y)` danno la quota solida del letto: sulla terra coincide col suolo (`groundAt`), sotto un liquido usa il record di `WaterFlow` se l'acqua è scorsa, `surf - 1` sulle secche (`depth === 'reef'`), il letto di `TrueRelief` (con gli scavi `digAt`) su mare aperto e acque del rilievo vero, o `surf - 8` / `surf - DEEP` sulle acque dipinte da un ambiente, sempre entro `[-RELIEF_DEPTH, surf - 1]`.
   - `Kernel.hasBedAt(col)` coincide con `relief.hasCliffs(col)`; `Kernel.isClearWater(code)` riconosce i liquidi nuotabili (`crossingOf(t) === 'swim'`), tenendo opaca la lava.
   - `WaterWorld.bed?(col, row)` (`src/kernel/water.ts`): nei mondi col rilievo vero `WaterFlow.take` legge la profondità reale del letto (`surf - bed`, almeno 1 livello) invece del fisso `DEEP`, conservando il volume d'acqua reale quando si scava vicino a bacini più profondi. Nei mondi collinari resta `DEEP`.
2. **Gli strati del fondale**:
   - `biomeOf` (`src/kernel/strata.ts`) classifica le secche (`terrain?.depth === 'reef' || code === 'y'`) come `'rock'`, così la bozza e i programmi degli strati le posano su `bedrock`.
   - `bedStratum(terrain, depthLevels, top, strata)` e `Kernel.bedStratumAt(col, row)` danno `bedrock` sulle secche e sui bassifondi a 1 livello nel rilievo vero, e la riga 0 degli strati del luogo altrove (fango, sabbia compatta o gli strati della Genesi).
   - Il programma `strata` dell'ambiente `harbour` del seme distingue `w → #3` (`sandbed`), `o → #4` (`mud`) e `y → #5` (`bedrock`); `designStrata` alla Genesi cita esplicitamente gli strati costieri e delle secche.
3. **La colonna del fondale sotto acqua trasparente (con parità del worker)**:
   - `SEA_MAT.clear` (`src/render/sea.ts`): materiale trasparente (`transparent: true, depthWrite: false`, `vertexColors: true`, stesso moto ondoso `waving` e creste di `SEA_MAT.water`, `renderOrder = 0` così schiuma e scie a `renderOrder = 1` stanno sempre sopra; `addGlow` moltiplica per `vAlpha`, e l'inchiostro tiene gli id ondosi alla linea di riva e degli scafi).
   - `chunkArrays` (`src/render/terrainmesh.ts`), solo quando `ChunkSource.hasBed` è vero: per ogni casella di acqua nuotabile (`isClear`) disegna in `ground` il tetto del letto a `by = Math.min(bedAt, g0 - 0.25)` (almeno un livello sotto il suolo, mai sopra i cavi d'onda) col colore dello strato del letto (`bedTopRgb`), e in `clearWater` la superficie ondosa con `alpha` per vertice mediato agli angoli tramite `waterAlpha(depth)` (da 0,34 sulle secche fino a 0,88 sul mare abissale). Le sponde fra terra e acqua mostrano la riva (`BANK`) sopra la superficie e le bande degli strati sotto; i salti di fondale e le cascate mostrano le bande degli strati (`strataSideIn`) e, dove un lago è sospeso su terreno più basso, il velo d'acqua laterale.
   - `ChunkInput` / `chunkInput` / `inputSource` / `chunkBuffers` portano i soli dati del fondale quando `hasBed` è vero (niente nei mondi `Hills`), mantenendo la parità byte per byte fra pagina e worker del terreno (ADR-0242).
4. **Il posto `underwater` del Cartografo**:
   - `'underwater'` entra in `Where` e `WHERE` (`src/kernel/agents/cartography.ts`), ma resta escluso da `WHERE_PLAIN` e viene aggiunto allo schema (`withWhere`) e al prompt (`seabedLine`) **solo** quando `PlanContext.seabed` è presente (`Kernel.draftSeabed`: rilievo vero e almeno 4 caselle interne di acqua nuotabile — zero token negli altri luoghi).
   - `Kernel.placementsOf` sceglie una casella interna di acqua nuotabile (preferendo profondità ≥ 2 livelli, mai sui moli); gli individui (`persona`) con `where: 'underwater'` vengono ricondotti a `'outside'` e i veicoli restano su `placeVehicle`.
   - `applyPlan` e `forgeForChunk` posano l'oggetto sul fondale impostando `pos.z = bedAt` e il componente `below: { z: bedZ }` (già in `ENTITY_PARTS` per il multigiocatore). `cellarHeight`, `settleHeights` e `rebuildSolids` mantengono gli oggetti sommersi sul letto senza aggiungerli a `solidTiles` in superficie (i nuotatori e le barche non si incagliano) e fuori da `onFloor` dalla superficie (si raggiungono solo immergendosi, R5 / T481).
5. **Multigiocatore e sicurezza**:
   - `Relief.chunkBedAt` (`TrueRelief`, `BandedRelief`) e `Kernel.chunkBedOf` forniscono i livelli del letto di un luogo; `SessionServer` li invia una volta per luogo in `ChunkView.bed` (solo server → client, elenco di `src/session/protocol.ts`, regola 8f).
   - `ThinClient` legge `ChunkView.bed` senza fidarsi con `readRelief` (lunghezza esatta `S × S`, interi in `[-RELIEF_DEPTH, RELIEF_PEAK]`, schiacciati `bed[i] <= relief[i]`, regola 7), senza mai esporre il codice Lua del generatore. Nessun nuovo messaggio client → server né API Lua.

## Conseguenze

- I mondi collinari (`Hills`), i mondi del vuoto e la lava restano identici byte per byte (`hasBed` falso, nessun `clearWater`, nessun costo di token al Cartografo).
- Il fondale e gli oggetti sommersi sono già nella scena, nel kernel e nei client sottili: R5 (T481, immergersi) può appoggiarsi direttamente a `Kernel.bedAt`, `below` e `SEA_MAT.clear` senza rifare mesh né protocollo.
- Versione del kernel: `0.10.35` (incremento `Z`, compatibile col contratto `0.10`).
