# ADR-0209 — Le strutture a 16 voxel per casella: gli stessi voxel, un quarto più grandi accanto al viandante

Data: 2026-11-17 · Stato: accettato (task T405 del backlog, step 30; D61 chiusa dall'autore il 17/11: B2, una densità di mezzo, 14-16) ·
Riferimenti: ADR-0179 (ciò che entra, `PARTS`, `STRUCTURE_SIDE`), ADR-0183 (lo Scultore senza scheletro, il piano a 1/5), ADR-0206 (il lotto
di più luoghi), ADR-0208 (il blocco grande quanto la sua struttura, la densità per voce), ADR-0049 (`vpt`), ADR-0092 (le taglie),
ADR-0136 (la versione del kernel); la prova in `docs/pipeline/domande/T403.md` e `lab/banco/riferimento/forte-scala.md` (§ «14, 15 o 16», T405)

## Contesto

Le strutture che crescono a regole (la classe `structure` da Grande in su: il seme, il banco, lo Scultore) giravano a 20 voxel per casella
con le parti abitabili alle misure minime di `PARTS`: una porta di 30 voxel alta esattamente un viandante (1,5 caselle), un piano di 30 di
luce. Accanto al viandante sembrano piccole. T403 l'ha misurato; l'autore (D61, B2) ha scelto una densità di mezzo, 14-16: porte di
1,25-1,4 viandanti, piani di 1,3-1,5, scale che si salgono, «un task a parte come T404 (la densità per voce c'è già)».

## Decisione

1. **16 voxel per casella** (`STRUCTURE_VPT` in `src/mj/classes.ts`). Le misure (`lab/scripts/strutture-scala.ts -- --densita 20,16,15,14`,
   villetta, rocca, forte del banco, fattoria di Opus): a 14, 15 e 16 il corpo del gioco sale tutti i piani di tutte e quattro (gradino
   `stepOf` 3 voxel, l'alzata delle scale del seme 2), le porte di 30 sono 1,43, 1,33 e 1,25 viandanti, i piani da pavimento a pavimento
   (32) 1,52, 1,42 e 1,33. Si sceglie **16** per i lotti: la gargantuesca, 500 voxel, è 31,25 caselle e sta ancora su un blocco di 2 × 2
   luoghi (lotto di 32, anello di due caselle; a 15 e 14 vorrebbe 3 × 3); la Grande è 6,25 caselle (a 15 6,67, a 14 7,14); ed è la densità
   a cui la locanda Enorme del seme era già scolpita (`vpt: 16`, ADR-0179).
2. **Gli stessi voxel, più caselle.** La scatola in voxel di una struttura che cresce a regole resta quella che aveva a 20 (`structureVoxels`:
   100 × 100 × 80 alla Grande, 150 × 150 × 120 all'Enorme, 500 × 500 × 160 alla Gargantuesca), multipla dei piani a 1/5 e a 1/10 con cui lo
   Scultore e il banco compongono; le sue caselle sono quei voxel a 16 (`tilesOf`: 6,25 × 6,25 × 5, 9,375 × 9,375 × 7,5, 31,25 × 31,25 × 10),
   la sua densità 16 (`densityFor`). I programmi non cambiano: le stesse griglie si vedono un quarto più grandi.
3. **Le parti abitabili sono i voxel di prima letti a 16** (`PARTS`): porta 11/16 × 30/16 caselle (11 × 30 voxel), piano 30/16 di luce,
   stanza 28/16 di lato, tettoia 30/16 × 20/16. `partVoxels(16)` dà le stesse misure che `partVoxels(20)` dava prima: i controlli dello
   Scultore (`partErrors`, `habitableParts`, `reachableStoreys`) chiedono gli stessi voxel, che ora sono 1,25 viandanti. Il prompt dello
   Scultore lo dice («a tile is always 16 voxels and a person 24 tall»; le aree in caselle; `bodyLine` dal codice: «a person 24 tall»).
4. **Una voce che non dice la sua densità è a 16** (`vptOf`: per la classe `structure` da Grande in su; le altre classi restano a 20). Lo
   Scultore non la scrive (`modelSize` dà solo la taglia); una carta portata la tiene se la dice (`bring.ts`), altrimenti è a 16. Una voce
   che la dice resta com'era (`entryBox`: la scala di D&D alla sua densità): la locanda Enorme del seme (16, 120 voxel), le gargantuesche
   della migrazione 0.7 → 0.8 (20, 200 voxel), il forte dell'autore (10, la sua `size`). **La cantina** resta dei voxel che il programma scrive: una casella dichiarata (`cellar`) è 20 voxel per una voce che non dice la sua densità (`cellarVoxels`), 1,25 caselle sotto il suolo a 16.
5. **Il lotto prende le caselle della voce che indosserà a ogni taglia** (`lotTiles` → `Forms.entryTiles`, prima solo la gargantuesca): una
   voce di prima (a 20) sta nel lotto in cui stava, una nuova (a 16) vuole il lotto delle sue caselle: una Grande un lotto di 7, un'Enorme di
   10; su uno più piccolo scende di taglia (`claimSizes`). Il prompt del Cartografo lo dice (un edificio di almeno 7 × 7 caselle per una
   Grande, 10 × 10 per un'Enorme) e il suo esempio di borgo ha case di 7 × 7. La gargantuesca nuova prende un blocco di 2 × 2 col lotto di 32
   (`blockShapeFor`, ADR-0208; `lot: 32` nel segno, perché non è il 25 di prima).
6. **Contratto 0.9** (kernel 0.9.0): cambia il senso di una voce senza `vpt` e le caselle delle taglie. La migrazione 0.8 → 0.9 (`migrate0_9`)
   scrive `vpt: 20` in ogni voce della classe `structure` da Grande in su che non la dice, così un universo di prima tiene le sue strutture
   come erano, sui lotti tagliati per loro; una gargantuesca senza `vpt` (500 voxel a 20, T370), che la scala di D&D a 20 non darebbe (200),
   dice anche la sua scatola nel programma (`size="500 500 160"`, la cantina sotto), come il forte dell'autore. `models/index.json` smette di
   seguire il seme (le voci del seme a 16 sostituirebbero quelle di prima): riceve le voci nuove del seme come un indice scritto dallo
   Scultore. I piani e i blocchi restano come sono. Ciò che lo Scultore scolpisce dopo, anche in un universo di prima, è a 16.
7. **Nel laboratorio 3D** il banco delle taglie e i programmi degli Scultori sono a 16 (`lab/3d/catalog.ts`, le etichette in caselle a 16),
   e il comando «voxel per casella» ha il 16.

## Cosa non cambia

- Le altre classi (persone, animali, mobili, alberi, gli edifici piccoli della classe `building`) e le strutture sotto la Grande: la scala
  di D&D a 20 (`densityOf`), il viandante di 30 voxel a 20 (1,5 caselle).
- Il kernel non allarga i timbri (`stamps.ts`: la casa di 5-6 × 4-5) né i programmi degli ambienti del seme (le case del borgo di 6 × 5):
  rifarli cambierebbe i luoghi degli universi di prima, i cui piani tengono le modifiche per casella. Una struttura con la sua taglia vi scende
  alla Media; una senza taglia (il Cartografo non la dice) vi sta com'è, e su un lotto di 5 o 6 caselle sporge di 0,1-0,6 caselle per lato,
  come la Grande di 5 su un lotto di 5 × 4 prima. Allargare i lotti dei programmi degli ambienti è un task a parte, con i piani nuovi.
- Le carte fatte a mano: alla scala di D&D sotto `MAX_SIDE` (`boxUnderMaxSide`), dove sono misurati i loro tetti.
- I quattro universi di Claude Cloud (`npm run universi:cloud`, T273): i loro piani sono tagliati a 20; orichalcum, neapolis e sidera sono
  di un contratto prima e la migrazione li porta, aurora (il seme con le sue mappe) passa dalla stessa migrazione nello strumento che lo
  installa (`cutAt20` in `lab/banco/universi-cloud/strumenti/cloud.ts`). I modelli di prova dei test che misurano scale, piani e cantine
  a 20 lo dicono nella voce (`vpt: 20`), come il banco di T154-T182 (`lab/banco/misure.ts`).

## Conseguenze

- Le strutture del seme, del banco e dello Scultore in un mondo nuovo sono 1,25 volte più grandi accanto al viandante: la porta di 30 voxel
  è 1,875 caselle, il piano di 32 è 2; il gradino del corpo è 3 voxel (4 a 20), il corpo largo 7 (9), la testa a 11 (14): i piani
  raggiunti a piedi dalle strutture del seme e del banco non cambiano (`banco-taglie.ts -- --misura`).
- Una gargantuesca nuova è 31,25 × 31,25 caselle su un blocco di 2 × 2 luoghi col lotto di 32: due caselle d'anello per lato.
- Una Grande vuole un lotto di 7: su uno di 6 scende alla Media. Nei mondi nati dal seme, finché il Cartografo scrive i suoi ambienti, le case
  del borgo del seme (6 × 5) non tengono una Grande con la taglia detta.
