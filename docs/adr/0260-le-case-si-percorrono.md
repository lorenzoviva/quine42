# ADR-0260 — Le case si percorrono: il salto che guarda la via, la stanza chiusa, la cosa solida che non chiude

- **Stato**: accettato
- **Data**: 2026-11-26
- **Task**: T513 (run #2 della beta, `sidera`)
- **Estende**: ADR-0162 (due piani raggiungibili a piedi), ADR-0212 (la guardia degli interni), ADR-0168 (il luogo resta connesso, `wouldSplit`), ADR-0250 (regola 10)

## Contesto

Nella run #2 (26/11) l'autore ha trovato in `sidera` due case che non si percorrono:

1. **la stanza sul retro senza porta**: la «Residenza modulare (residenza a due piani)» di Opus 5.5, riusata in 36 luoghi (ADR-0247),
   ha un tramezzo fra l'atrio e la stanza sul retro, dove sta la scala. La regola che vi apre la porta
   (`<one in="f/Y/Y/Y/Y/Y/f">`) cerca la porta sullo strato del pavimento, dove il tramezzo non c'è: non trova mai niente e il tramezzo resta
   pieno a ogni seme. I controlli dello Scultore l'avevano presa: il cammino del kernel (`walkIn`) **saltava attraverso il tramezzo**. Il
   salto di `walkIn` provava solo i punti d'arrivo, da una casella in su, e un muro più sottile di una casella meno il corpo (qui 5 voxel su
   16) stava fra la partenza e il primo punto provato. Così la stanza sul retro, la scala e il piano di sopra risultavano raggiunti. Il salto
   del mondo (`Kernel.jump`) invece guarda ogni decimo di casella (`airFree`) e lì si ferma.
2. **un mobile davanti all'ingresso**: non un mobile dello Scenografo (la guardia di ADR-0212 non chiude niente, misurato su ogni casa con
   l'interno di `sidera` a ogni seme), ma una cosa del piano del luogo posata `inside`: `obj.armadietto` (solido, raggio 0,42). `placeInside`
   la teneva a 1,2 caselle dalla porta **del lotto**, non da quella del modello, che nella Residenza sta dietro il portico; l'atrio è profondo
   1,25 caselle e l'armadietto ne chiudeva una parte. Nessuno misurava se una cosa solida posata dentro una struttura chiude il cammino.

## Decisione

1. **Il salto di `walkIn` guarda la via** (`src/kernel/forms.ts`): come `Kernel.jump`, ogni decimo di casella dalla partenza; ciò che è più
   alto di `JUMP_UP` lo ferma anche dove non si atterra; si atterra ancora da una casella in su. Un muretto più basso di un salto si salta
   come prima. `walkIn` prende anche `{ jumps: false }`, il cammino a piedi.
2. **Ogni stanza a terra si raggiunge** (i controlli dello Scultore, `checkOnce`): `roomsReached` (`src/kernel/interior.ts`) taglia il
   pavimento coperto del piano terra in stanze (`standingCells`, `roomsOf`, raggiunte o no) e dice di ognuna se il cammino vi entra;
   `closedRoomErrors` (`src/mj/check.ts`) rifiuta una stanza di almeno `CLOSED_ROOM` (1 casella²) che il cammino non raggiunge, col motivo
   e la cura («apri una porta (part-door) nella parete che la separa dalle altre»). La scala in una stanza chiusa è già il «piani: 1».
3. **Una cosa solida posata dentro una struttura non chiude il cammino** (`Kernel.placeInside`): il kernel cammina la struttura e un tratto
   attorno con la collisione del mondo (`free`, `BODY_R`) su una griglia di un ottavo di casella (`INSIDE_STEP`, al più `INSIDE_CELLS` per
   lato), in gruppi (`walkGroups`); un punto del pavimento è buono per una cosa solida solo se, con la sua forma lì per un momento
   (`withSolid`, lo stesso modo di `wouldSplit`), due celle che un corpo univa restano unite (`splitBetween`, `shutsInside`). Vale nella
   struttura della cosa e nelle altre del luogo; altrimenti la cosa va accanto, fuori dai lotti, come prima.
4. **Ciò che il mondo ha già scolpito così si rifà con lo Scultore**: niente ripara un programma senza chiamate. `lab/scripts/interni-percorsi.ts`
   misura ogni casa con l'interno di un universo ai semi dei suoi piani (stanze chiuse, piani, stanze che i mobili chiudono) e scrive il
   comando che le mette nella coda dello Scultore (`npm run genera -- <universo> --rigenera modelli --tipi …`, ADR-0216); la rigenerazione
   usa i controlli di oggi.

## Conseguenze

- In `sidera` cadono la «Residenza modulare» a ogni seme (piani 1, stanza sul retro chiusa) e la «Residenza ad anelli» ai semi 3 e 4
  (stanza a terra chiusa); le altre 16 strutture e le 12 del seme reggono ai primi quattro semi. Finché lo Scultore non le rifà, nel mondo
  le loro stanze sul retro restano chiuse.
- Le cose solide del piano posate dentro una struttura cambiano posto dove chiudevano: nel luogo (0,-8) di `sidera` l'armadietto lascia l'atrio.
  Il posto dipende ancora da ciò che c'è già (come prima con `taken`); il controllo costa un cammino della struttura per cosa solida, una
  volta, e un cammino locale per ogni punto provato.
- I piani, le stanze e le parti che i controlli misurano non vedono più le stanze dietro un muro sottile: un modello di prima che passava
  così ora torna allo Scultore col motivo. La guardia degli interni (ADR-0212) camminava già senza salti e non cambia.
- Kernel 0.10.36: gli universi della stessa `X.Y` restano buoni (nessun formato cambia).
