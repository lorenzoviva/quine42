# ADR-0211 — I timbri e gli ambienti del seme tagliati per le strutture a 16 voxel per casella

Data: 2026-11-17 · Stato: accettato (task T407 del backlog, step 30; ciò che ADR-0209 lasciava a un task a parte) ·
Riferimenti: ADR-0209 (le strutture a 16 voxel per casella), ADR-0043 (lotti e strutture), ADR-0092 (le taglie, `claimSizes`), ADR-0023
(timbri e ambienti), ADR-0064 (regola 10), ADR-0168 (il controllo del posare), ADR-0136 (la versione del kernel)

## Contesto

Dal T405 una Grande è 6,25 caselle (100 voxel a 16) e un'Enorme 9,375. I timbri del kernel (`stamps.ts`) e i programmi degli ambienti del
seme erano tagliati per le strutture a 20: le case del borgo di 6 × 5, la casa del timbro di 5-6 × 4-5, il mastio del castello di 5 × 5, la
caserma della fortezza di 5 × 4, la piramide di 5 × 8, le sale della caserma di 6 × 5, la locanda di 9 × 7 divisa in due lotti, il tempio di
9 × 8 (un'Enorme a 20, 7,5 caselle, ci stava). Su quei lotti una Grande con la taglia scendeva alla Media e una senza taglia (le case comuni,
il forno del borgo del seme) sporgeva di 0,1-0,6 caselle per lato. Il censimento (60 luoghi per ambiente, i bozzetti del seme) contava 488
lotti che sporgono su 1126. E i timbri si coprivano l'un l'altro (le quattro case del borgo di mattoni, il recinto sulla caserma: lotti
spezzati, lotti che si toccano); su 200 bozzetti di prova per ambiente una porta su nove dava su un muro o sul bordo del luogo, e 341
varchi su 16 000 restavano chiusi dietro un muro (102 su 800 nella fortezza; regola 10).

ADR-0209 non li toccava perché i piani dei luoghi tengono le modifiche per casella (`edits`), le cose e le forme dei lotti per indice:
cambiare timbri o programmi sotto un piano salvato cambia il luogo.

## Decisione

1. **Ogni edificio di un timbro o di un ambiente del seme tiene la struttura per cui è tagliato**, nei due versi, senza scendere né
   sporgere: `STAMP_SIZES` lo dice per forma. Il tempio è di 10 × 10 (un'Enorme); casa (7-8 di lato), mastio del castello (7 × 7),
   caserma della fortezza (7 × 7, la fortezza di 14 di lato), torre (7 × 7, com'era), piramide (la camera di 5 × 5: 7 × 9), sotterraneo (le
   quattro stanze verso gli angoli: lo scavato è di 7 o più nei due versi), le due sale della caserma (14 × 7, muro contro muro) una Grande;
   capanne e stalla del recinto una casetta (la classe `building`, sotto le 5 caselle, com'erano). Gli ambienti: le case del borgo di 7 × 7
   (una Grande), la locanda di 10 × 10 con le stanze aperte sulla sala (un lotto solo, per un'Enorme), il capanno dei campi di 4 × 4.
2. **I timbri a 16 si tengono lontani** (`StampCut`, sulla griglia del programma, `MjGrid.cut`): un timbro non copre la scatola di un altro
   (`claimed`) né un edificio delle regole e non lo tocca (`built`: i codici di muri, porte e pavimenti interni del mondo); un suo muro o
   recinto non tocca il bordo del luogo né le caselle ferme (un varco resta raggiunto attorno, i muri non si scavano); ogni suo ingresso sul
   bordo (porta, ponte, strada) dà su una casella che si raggiunge, che resta sua. Le case delle regole del seme hanno **un anello di terreno
   libero** attorno (l'ingresso della regola più largo di una casella per lato, `*` nell'uscita): né un varco né la porta di un'altra casa
   restano chiusi. Il borgo le mette con `all` (tutte quelle che entrano, al più quattro, mai addossate) e non più con `one` due volte:
   con l'anello la prima casa nel mezzo del luogo non ne lasciava entrare un'altra. Il prompt del Cartografo dice la taglia che ogni timbro regge, che i timbri non si coprono, e il suo esempio di borgo ha
   l'anello. Sui bozzetti del censimento: 0 lotti che sporgono, 0 lotti che si toccano, 0 porte e 0 varchi chiusi (`tests/stamp-lots.test.ts`).
3. **I piani di prima tengono i timbri di prima.** Il kernel scrive `vpt: 16` (`STRUCTURE_VPT`) su ogni piano che fa (`ChunkPlan.vpt`: il
   Cartografo, i luoghi di un blocco, il riempitivo); un piano che non lo dice è di prima e il suo programma gira coi timbri di allora
   (`layout(…, { vpt: TILE })`, `patternAt20`, senza le regole del punto 2). Un universo di prima che pianifica un luogo nuovo lo taglia a 16:
   i suoi lotti più larghi tengono anche le voci a 20.
4. **Gli ambienti che un universo ha restano suoi** (`keepEnvironments` in `upgradeFromSeed`): un programma del seme cambiato non arriva
   dove l'universo ha già quell'ambiente, anche se non l'ha mai riscritto; arrivano gli ambienti nuovi, come da un manifest riscritto.
   Così il borgo nuovo è dei mondi nati dal seme di oggi, e quelli di prima tengono il borgo con cui sono stati disegnati.
5. **Un mobile solido senza posto** in nessuna casa del suo luogo (una casa del seme ha un interno piccolo) sta accanto alla sua,
   fuori dai lotti, nella prima casella vicina dove il controllo del posare lo ammette (`spotFailure`: il terreno lo regge, niente in mezzo,
   non davanti a una porta, il luogo resta connesso); prima andava sulla casella del piano, dentro i muri o sul tetto. Prima di uscire prova
   le altre case del luogo.
6. **Le modifiche del piano vincono sul lotto**: un lotto rifatto al caricamento non rimette terreno né sentiero sulle caselle che il piano
   ha cambiato dopo il disegno (`edits`: un cantiere, un incantesimo); prima, al riavvio, quelle sul margine di un lotto si perdevano.
7. **Kernel 0.9.1**: gli universi del contratto 0.9 restano buoni (i loro piani e i loro ambienti come sono), quindi sale `Z`; nessuna
   migrazione.

## Cosa non cambia

- Torre, capanne, recinto, tana e pozzo: lo stesso disegno (cambiano solo le regole del punto 2).
- I programmi degli ambienti che il Cartografo scrive: il prompt chiede edifici di 7 × 7 e l'anello, il kernel non li riscrive; su un
  lotto più piccolo una struttura scende di taglia (`claimSizes`) o, senza taglia, sporge come prima.
- `claimSizes` misura ancora il lato più lungo del lotto: sui timbri e sugli ambienti del seme i due lati bastano.

## Conseguenze

- Il borgo del seme: le case di 7 × 7 con l'anello trovano posto in un luogo su otto dei bozzetti veri (16 case su 100 luoghi; prima 18
  su 100 in uno su sei), due nel luogo della partenza; il borgo di mattoni ha due case per luogo invece di quattro sovrapposte.
- Aurora (il seme con le sue mappe di prima, `npm run universi:cloud`) si installa con gli ambienti di prima
  (`lab/banco/universi-cloud/ambienti-prima-T407.json`), come un universo nato da quel seme li tiene.
- Un'Enorme (un castello, un tempio chiesti dal Cartografo) sta nel tempio e nella locanda; il mastio del castello regge una Grande, come
  a 20.
- I test che leggevano il borgo della partenza com'era: un punto libero finché la casa ne ha (`tests/lots.test.ts`), la mela appena
  posata e non la prima a terra (`tests/thin.test.ts`), un luogo con terreno libero per la casa comune (`tests/imprese.test.ts`), una
  casella lontana dai lotti per il rilievo (`tests/rilievo.test.ts`), l'arco del salto sopra la base della cassa (`tests/jump.test.ts`).
