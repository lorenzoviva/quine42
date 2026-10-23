# ADR-0049 — La densità di ogni modello e gli edifici del campus come modelli

Data: 2026-10-23 · Stato: accettato (task T20 del backlog) · Modifica ADR-0032 (20 voxel per casella) e ADR-0041
(la libreria dei modelli); completa T18 (il campus quattro volte più grande).

## Contesto
Tutti i modelli della libreria erano a 20 voxel per casella (`VPT` fisso in `src/kernel/forms.ts`, e un 20 scritto a mano
in `floorAt`, `structureAt`, nei punti interni delle strutture). Gli esterni della corona (T19) sono edifici di 10-16
caselle di lato: a 20 voxel per casella sarebbero griglie di 280 voxel, troppo grandi da far girare e da scrivere. Il
prompt di T19 li fa scrivere a **8 voxel per casella**, con la porta su una lettera che si chiama `porta` e il davanti
verso y grande. Il campus di T18 disegnava ogni edificio come un blocco di caselle, con un'insegna al neon sopra la porta.

## Decisione
1. **Ogni modello dice la sua densità** in `models/index.json`: `vpt` (voxel per casella, intero da 4 a 40; senza, 20).
   La forma la porta con sé (`Form.vpt`) e tutto ciò che passa da voxel a caselle la usa: impronta (`bodyFoot`: il gradino
   è 0,2 caselle e la testa 0,7, nei voxel di quella densità), pavimenti, portata (`reach`), collisione (`footBlocks`),
   `floorAt`, `structureAt`, i punti interni, la mesh (il worker riceve già `vpt`). I modelli di oggi non cambiano.
2. **Un edificio del campus è il suo modello quando la libreria ce l'ha**: `models/corona-<id>.xml` (`campusModel`).
   Il kernel lo cerca dopo ogni `corona.build` e quando la libreria ha finito di eseguire un programma
   (`placeCampus`, a ogni cambio di `forms.version`); `Corona.placeStructure` lo posa:
   - girato di `yaw = -mid` (il mezzo del settore): il davanti guarda il cerchio;
   - la porta è il baricentro dei voxel della lettera `porta` (senza, il mezzo del davanti); mezza casella davanti a lei
     sta dove stava la porta del blocco (sul viale, a R + 6,5), e lì è la casella `door` (E entra, come prima);
   - **blocca con i suoi voxel**, non con le caselle: `free` interroga l'impronta del modello; le caselle che il modello
     copre sono `building` (per il passaggio del mouse e il disegno), il resto del blocco torna prato.
   Senza programma l'edificio resta il blocco di T18 con l'insegna al neon; con il programma l'insegna è quella del
   modello (la lettera `insegna`), il renderer disegna la sua mesh e rifà l'anello quando cambia ciò che il campus indossa.
3. Il seme è uno solo (1): nel gioco ogni edificio esiste una volta.

## Conseguenze
- Modelli grandi a una scala grossa e modelli piccoli fini convivono; un modello si può riscrivere a un'altra densità
  cambiando una riga dell'indice.
- La corona non dipende dai programmi: finché non ci sono (o se non si eseguono) è quella di T18.
- I programmi degli otto edifici li scrive Gemini CLI con il prompt di T19; portarli nella libreria del seme (con
  `"vpt": 8`) è un task a sé (T31).
- Gli interni restano altrove e più grandi (ADR-0022): la porta del modello teletrasporta.
