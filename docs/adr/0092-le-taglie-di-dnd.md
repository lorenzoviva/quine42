# ADR-0092 — Le taglie di D&D per strutture e creature

Data: 2026-10-31 · Stato: accettato (task T54 del backlog) · Sostituisce in parte ADR-0043 (punto 4, la struttura importante
per zona) · Riferimenti: ADR-0041 (le classi), ADR-0042 (lo Scultore), ADR-0049 (la densità dei modelli grandi)

## Contesto
Le classi (`CLASSES` in `src/mj/classes.ts`) danno forma e scatola in caselle, e c'era una sola grandezza speciale: la struttura
«importante» (un castello, Argon) una per zona di 56 × 56 luoghi. L'autore (richiesta del 24/10, risposte del 30/10) vuole le taglie di
D&D: Minuscola, Piccola, Media, Grande, Enorme, Gargantuesca. Gargantuesca è la massima; il castello importante di oggi è **Enorme**;
la scala è la stessa per creature e strutture, e la scatola la dà la classe (una struttura Media è più grande di una creatura Media).

## Decisione
1. **Le taglie** (`TAGLIE`, `Taglia` in `classes.ts`) hanno una `scala`: il lato dello spazio di D&D rispetto a Media (0,5 · 0,75 · 1 ·
   2 · 3 · 4). Ogni classe ha la sua taglia solita (`AssetClass.taglia`: persona media, animale piccola, bestia grande, edificio
   media, grande grande…) e la sua scatola è quella di quella taglia. Una cosa di un'altra taglia ha la scatola della classe scalata per
   il rapporto delle scale (`tilesOf(cls, taglia)`): una persona Grande 2 × 1,5 × 3 caselle, una struttura Enorme 7,5 × 7,5 × 6, una
   Gargantuesca 10 × 10 × 8. Oltre `MAX_SIDE` (120) voxel di lato il modello si scrive più rado (`densityOf`, ADR-0049): `boxOf(cls,
   taglia)` dà la scatola in voxel a quella densità.
2. **Dove sta la taglia**: `appearance.taglia` nei manifest (il validatore la controlla), `taglia` nei concetti della Fucina (mai le due
   rare, `forgedSize`), `strutture[].taglia` nel piano del Cartografo (`readStructure`: un piano salvato con `importante: true` è
   `enorme`; il validatore toglie le taglie che non esistono), `struttura.taglia` nel componente, `SculptRequest.taglia` per lo Scultore
   (la richiesta dice taglia, caselle e densità; il programma si prova nella scatola della taglia), `ModelInfo.taglia` e `vpt` nella
   voce di `models/index.json` (`modelSize`), così la libreria lo fa girare nella scatola in cui è stato scolpito.
3. **La rarità delle due più grandi** (`RARE_SIZES`): **Enorme** una per **zona** (56 × 56 luoghi, `zoneOf`, come le importanti),
   **Gargantuesca** una per **reame** (4 × 4 zone, 224 × 224 luoghi, ~4000 caselle di lato, `realmOf`; nome scelto per non confonderlo con
   le regioni dell'atlante, di 3-4 luoghi). Una rara per luogo. Al Cartografo il kernel dice quali può ancora mettere (`rareAllowed`);
   le strutture rare vanno al modello migliore dello Scultore (Argon, `modelFor`) finché dura il suo prezzo.
4. **Il kernel adatta** (`claimSizes`, quando il piano si applica): le strutture vanno sui lotti più grandi, la taglia scende alla più
   grande la cui scatola sta nel lotto (il lato più lungo del lotto, come la classe `grande` di oggi), e una rara già presa nella sua area
   scende alla successiva permessa. Il piano cambiato si salva così.
5. **Lo stato**: `stato.json → rari {enorme: {zona: luogo}, gargantuesca: {reame: luogo}}`; un `importanti` vecchio diventa `rari.enorme`.

## Conseguenze
- Una richiesta Enorme dà la scatola giusta; le taglie e la rarità hanno i loro test (`tests/sculptor.test.ts`, `tests/lots.test.ts`).
- Un'Enorme ha bisogno di un lotto di almeno 8 caselle di lato, una Gargantuesca di 10: negli ambienti con edifici piccoli diventano
  Grandi. Lotti più grandi per le rare (unirne due, allargarli) sono lavoro a parte, se servirà.
- Le creature possono essere di ogni taglia fino a Grande; la rarità delle creature Enormi e Gargantuesche non c'è ancora.
- I modelli scolpiti prima restano nella loro scatola (la voce dell'indice non dice una taglia).
