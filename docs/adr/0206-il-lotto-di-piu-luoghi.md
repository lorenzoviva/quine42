# ADR-0206 — Il lotto di più luoghi: la gargantuesca delle strutture su un blocco di 2 × 2 luoghi, 25 × 25 caselle

Data: 2026-11-16 · Stato: accettato (task T370 del backlog, step 30; D53 chiusa dall'autore il 13/11: opzione 1 di
`docs/pipeline/domande/T356.md`, con il lato a 500) · Riferimenti: ADR-0043 (lotti e strutture), ADR-0048 (i lotti piani), ADR-0064 e la
regola 10 (ogni luogo è connesso), ADR-0092 (le taglie, la gargantuesca per reame), ADR-0136 (la versione del kernel), ADR-0160 (le
strutture che crescono a regole), ADR-0179 (`STRUCTURE_SIDE`, una scala sola), ADR-0185 (il tetto dei voxel, che questo chiude sul lotto);
il forte disegnato a mano dall'autore, `lab/mjx/models/handmade/forte-handmade.xml` (500 × 500 × 150 voxel)

## Contesto

ADR-0185 ha misurato il tetto: il motore e la mesh reggono una struttura di 20-25 caselle; mancava **il lotto**. Una struttura sta su un
lotto del suo luogo (ADR-0043), un luogo è 18 caselle e `claimSizes` fa scendere la taglia che non entra: una gargantuesca più grande di un
luogo non aveva dove stare, e `STRUCTURE_SIDE` era rimasto 200 (10 × 10 caselle). L'autore (D53, 13/11) ha scelto il lotto di più luoghi,
un blocco di 2 × 2 (36 × 36 caselle), con il lato a **500** perché ci stia il suo forte disegnato a mano, la gargantuesca di riferimento (T371).

## Decisione

1. **La taglia.** La gargantuesca della classe `structure` è 25 × 25 × 8 caselle (`GARGANTUAN_LOT`, `tilesOf`): 500 × 500 × 160 voxel a 20
   per casella (`STRUCTURE_SIDE` 500, `densityFor` resta `TILE`), 40 milioni di celle (`FORM_LIMITS` da 32 a 40 milioni, il lato resta 512).
   Le altre classi e le altre taglie restano la scala di D&D (`scaledTiles`), e così ciò che è venuto prima: una voce della libreria che dice
   la sua densità (`vpt`, `entryBox`) e le carte fatte a mano (`boxUnderMaxSide`, `bring.ts`), i cui tetti sono misurati lì.
2. **Il blocco** (`src/kernel/block.ts`, funzioni pure): quattro luoghi, nominati dal luogo in alto a sinistra (`BlockMark`); il lotto è un
   quadrato di 25 caselle nel mezzo, cinque caselle di anello prima e sei dopo (`blockLot`, `lotIn`, `reservedCells`).
3. **Chi lo prende** (`Kernel.claimBlock`, in `develop` dopo il piano del Cartografo): un piano nuovo che chiede una gargantuesca, in un luogo
   che può ancora averla (`rareAllowed`), prende il primo dei quattro blocchi attorno al luogo (`blocksAround`) i cui altri tre luoghi sono
   bozze che nessuno sta pianificando, in nessun blocco, non la partenza, fuori dalle regioni del master e nella stessa regione dell'atlante
   (un ambiente per i quattro), col lotto al più per un quarto d'acqua (`blockFree`), e senza un piano salvato (controllato di nuovo dopo
   l'attesa). Il piano è segnato (`block`), la sua gargantuesca va prima nelle `structures` (va sul lotto più grande) e la gargantuesca del
   reame è sua (`rari`); gli altri tre luoghi hanno il **piano del kernel** (`blockPlan`: lo stesso nome e lo stesso ambiente, niente cose,
   rune né strutture, il segno), salvato subito, senza chiamate e senza carte (non costa niente). Senza un blocco libero non cambia niente: la
   struttura scende alla taglia che i suoi lotti ricevono (`claimSizes`), come prima.
4. **Dove si ricorda**: il segno `block` nei quattro piani di `maps/` (il formato dei piani cambia) e `world/state.json → blocks` (il luogo in
   alto a sinistra → il luogo con la struttura). Il registro del kernel (`blocks`, `blockOfPlace`) li prende tutti e due; un piano applicato
   vince (`knowBlock`: chi chiede la gargantuesca è il luogo che la tiene), così un salvataggio dello stato perso non perde il blocco. Un luogo
   del blocco senza piano salvato lo prende da quello con la struttura (`anchorPlan`: in memoria, caricato o dal disco), altrimenti dal
   Cartografo, col segno.
5. **Il layout** di un luogo del blocco (`blockLayout`; `layout` prende `reserved`, `gates`, `apron`): le caselle sotto il lotto sono
   riservate (il programma dell'ambiente non le scrive, nessun sentiero le attraversa, non sono mai raggiungibili, niente vi è posato) e poi
   tornano terreno come ogni lotto (`lotGround`); il varco di un lato fra due luoghi del blocco che cadrebbe sotto il lotto va nell'anello,
   per un hash del lato, lo stesso per i due luoghi (`blockGates`); le caselle accanto al lotto (anche sul bordo fra due luoghi) si camminano e
   i varchi le raggiungono (`apron`): le porte della struttura, da qualunque lato, si aprono su un sentiero, e l'anello gira attorno senza
   uscire dal blocco (regola 10). I lati del blocco verso fuori tengono i varchi di sempre: i vicini non cambiano. Le caselle accanto al lotto restano
   libere anche delle cose del piano (`placementsOf`: niente rune, cose né oggetti a terra sul bordo).
6. **Il lotto è piano a un livello solo** per i quattro luoghi (`blockLevel`: la mediana del rilievo sul lotto, mai sotto il mare, entro due
   livelli a casella del rilievo sui bordi dei quattro luoghi fuori dal lotto), dal rilievo soltanto, così i luoghi caricati o no, un client
   sottile e il modello dei luoghi sono d'accordo: `LotBox.level` per `chunkLevels` (che lo stende per primo, anche sul bordo del luogo),
   `Chunk.blockLot`, `ChunkView.block` nel protocollo.
7. **La struttura** è un lotto del luogo che l'ha chiesta (`structureLots`: dopo i suoi lotti, l'origine `<luogo>#s<n>`, così il resto del
   kernel, le imprese e i salvataggi delle forme la trattano come ogni lotto), nel mezzo del lotto (mezza casella prima dell'angolo comune dei
   quattro luoghi), girata verso uno dei quattro lati per il seme del luogo (il lotto non ha porta di caselle). Vive con quel luogo, e i quattro
   luoghi si caricano e si scaricano insieme (`updateChunks`).
8. **Il validatore**: una struttura che cresce a regole è un insieme di parti a terra (i recinti dei pascoli, i campi, le torri di una cinta):
   ciò che poggia sul fondo della griglia è un corpo solo, staccato è ciò che galleggia (`analyse(…, { groundJoins })`, nel validatore per le
   voci della libreria che crescono a regole, `Validator.modelGrows`, e nei controlli dello Scultore, `checkProgram`). La fattoria a 20 caselle,
   che cadeva per il 48 % di pezzi staccati, passa.
9. **Il contratto 0.8** (kernel 0.8.0, sale `Y`): cambiano il formato dei piani (`block`), lo stato (`blocks`) e il senso di una taglia. La
   migrazione 0.7 → 0.8 scrive in `models/index.json` la densità delle gargantuesche di prima (`vpt: 20`): la loro scatola resta 200 × 200 ×
   160 (`entryBox` legge una voce che dice la sua densità alla scala di D&D) e il loro luogo le tiene sul suo lotto (`lotTiles` in
   `claimSizes` guarda le caselle della voce che la struttura indosserebbe). I piani di prima non hanno blocchi e restano come sono.
10. Il prompt dello Scultore dice il piano a 1/5 di 100 × 100 celle alla gargantuesca (500 voxel, 25 × 25 caselle, la terra di quattro luoghi).
11. `addModel` prova una voce nuova col suo `time` e, se cresce a regole, con `groundJoins` (prima il validatore leggeva solo le voci già nella
   libreria: un programma lento scritto a mano non entrava, e una fattoria scolpita sarebbe caduta per i pezzi).

## Le misure col forte dell'autore

Tabelle e immagini in `lab/banco/taglie/README.md`, sezione «Il lotto di più luoghi». Il forte a 500 × 500 × 150 (37,5 milioni di celle) gira
in 7,2 s in Node, 48 pezzi, picco 164 MB (a 160 di altezza 7,5 s e 175 MB); la mesh del gioco 1,80 milioni di vertici, 77 MB, nei 128 MB del
worker. Il validatore lo passa in 7,6-7,8 s, al limite degli 8 s: la sua voce deve dire `time` (T371). Nel browser (Chrome headless, RTX 2070)
arriva dal worker in 8,6 s; dentro, disegnato, 197 fps, 3,8 ms di JS e 3,4 ms di GPU a frame (4,18 milioni di triangoli). In un mondo vero
(la build, `?skip&offline`) il blocco è preso dal piano del Cartografo, sopravvive a una ricarica, e il viandante gira a piedi attorno al forte
attraverso i quattro luoghi ed entra dal portone.

## Alternative scartate

- **Il luogo più grande** (`chunkSize` 36) e **la gargantuesca che riempie il suo luogo** (16 × 16): le opzioni 3 e 2 di D53, scartate
  dall'autore.
- **Il Cartografo che pianifica i quattro luoghi**: quattro chiamate per un posto solo, e i tre luoghi intorno sono l'anello della struttura;
  il piano del kernel non costa niente e tiene il nome e l'ambiente del luogo che l'ha chiesta.
- **Una struttura per luogo** (quattro entità, ognuna col suo pezzo): la forma è una, il suo programma gira una volta; tenere i quattro luoghi
  caricati insieme è più semplice che spezzare un modello.
- **Il livello piano di ogni luogo** (la mediana dei suoi tre quarti di lotto, come per un lotto di un luogo): i quattro pezzi a quote
  diverse sotto una struttura sola.
- **Lasciare i varchi interni dove `gates` li mette**: sotto il lotto per la maggior parte dei semi, il primo varco di un luogo può cadere
  nel lotto e niente sarebbe raggiungibile.
- **Il blocco anche su luoghi già pianificati**: cambierebbe un luogo visto (le sue cose, le sue rune, le sue case); un blocco si forma solo
  su bozze.
- **Le 30 caselle** (600 voxel): non entrano nel lotto di 2 × 2 con l'anello, e la mesh per pezzo che chiederebbero resta un passo dopo, se
  l'autore le vuole (ADR-0185).

## Conseguenze

- Una gargantuesca nuova costa la terra di quattro luoghi, che restano bozze fino a che il blocco non è preso: un luogo che chiede la
  gargantuesca accanto a luoghi già visti non la ha (scende), e i luoghi del blocco sono l'anello della struttura, senza cose né rune loro.
- Un programma del Concilio può chiedere fino a 40 milioni di celle (prima 32); i controlli di una struttura Enorme provano anche il primo
  seme alla gargantuesca, ora a 500 (più tempo nei controlli dello Scultore).
- Il modello dei luoghi mostra la struttura del blocco nella miniatura del luogo che la tiene, fuori dal suo quadrato.
- Sicurezza: nessuna superficie nuova. Un campo in più nei piani e nello stato, letti con i tipi controllati (`readBlockMark`, `readBlocks`);
  un campo in più nella vista dei luoghi che il server manda (numeri, letti dal client solo se sono cinque numeri finiti); un tetto di memoria
  del motore più alto (40 milioni di celle, a tempo invariato).
