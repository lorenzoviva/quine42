# ADR-0208 — Il blocco grande quanto la sua struttura: il forte dell'autore a 10 voxel per casella su 3 × 3 luoghi

Data: 2026-11-17 · Stato: accettato (task T404 del backlog, step 30; D60 opzione A e D61 chiusa dall'autore il 17/11: A2, il fattore 2) ·
Riferimenti: ADR-0206 (il lotto di più luoghi, che questo estende), ADR-0049 (la densità per voce, `vpt`), ADR-0092 (le taglie), ADR-0179
(`STRUCTURE_SIDE`), ADR-0185 (il tetto dei voxel), ADR-0136 (la versione del kernel); la prova in `lab/banco/riferimento/forte-scala.md`
(T403) e `docs/pipeline/domande/T403.md`

## Contesto

Il forte disegnato a mano dall'autore (`lab/mjx/models/handmade/forte-handmade.xml`, 500 × 500 × 150 voxel) è pensato per una scala più
grande di quella del gioco: a 20 voxel per casella (25 caselle, il lotto di 2 × 2 luoghi di ADR-0206) le mura arrivano al petto del viandante
e i piani del mastio sono più bassi di lui. T403 l'ha misurato dal programma a 20, 10 e 5 voxel per casella: a 5 l'esterno è da castello ma i
piani sono di 2,5 viandanti e le scale non si salgono (un gradino di 2 voxel è 0,4 caselle, il corpo ne sale 0,2); a 10 l'interno è a misura
(piani di 1,3 viandanti, la porta del mastio di 1,8 × 0,8, un gradino di 0,2 caselle = `stepOf`) e le mura sono di 1,5 viandanti. L'autore
(D61, 17/11) ha scelto **10 voxel per casella**: il forte è 50 × 50 caselle e vuole un blocco di 3 × 3 luoghi.

La densità per voce c'era già (`vpt`, `vptOf`): una forma gira alla densità della sua voce, e il gioco misura sulla forma (gradino, impronta,
pavimenti, parti abitabili, aree, mesh) con quella. Mancavano due cose: il lotto, fisso a 25 caselle su 2 × 2 luoghi (`BLOCK`,
`GARGANTUAN_LOT`), e le caselle che una gargantuesca prende, che `lotTiles` leggeva dalla taglia (10 × 10 per una voce che dice `vpt`) e non
dalla voce: il forte a 10 sarebbe uscito dal suo lotto.

## Decisione

1. **La voce del forte** dice la sua densità: `{ "class": "structure", "size": "gargantuan", "vpt": 10, "time": 30000 }`. La sua forma gira a
   10 voxel per casella (500 × 500 × 148 voxel = 50 × 50 × 14,8 caselle) e tutto ciò che il gioco misura sulla forma scala con lei: il gradino
   (`stepOf(10)` = 2 voxel, l'alzata delle sue scale), l'impronta e i pavimenti (`bodyFoot`, `groundOfForm`), le parti abitabili
   (`habitableParts`, `reachableStoreys`), le aree (`formAreas`), la mesh. Il programma e i suoi voxel non cambiano. Nel laboratorio 3D il
   forte parte da 10 (`HANDMADE_VPT` in `lab/3d/catalog.ts`). Il forte **non entra nel seme**: un programma di 37,5 milioni di celle in ogni
   universo nuovo è una scelta di contenuto, non di scala; entra in un mondo come ogni voce della libreria (`addModel`, la console del
   master), e il riferimento per lo Scultore è T371.
2. **Le caselle di una gargantuesca sono quelle della voce che indosserà** (`lotTiles` → `Forms.entryTiles`): la sua scatola alla sua densità,
   la scatola del programma se la dice (`size="500 500 150"` a 10: 50 × 50) o quella della voce (`entryBox`); senza voce (una da scolpire)
   quelle della classe (`tilesOf`, 25). Per le voci di prima non cambia niente: una gargantuesca con `vpt: 20` della migrazione 0.7 → 0.8 resta
   10 × 10 caselle.
3. **Il blocco parametrico** (`src/kernel/block.ts`): un blocco ha un lato in luoghi e un lotto in caselle (`BlockMark.side`, `.lot`; 2 e 25 se
   non li dice). `blockShapeFor(caselle, 18)`: il lotto è grande quanto la struttura, mai sotto i 25 di ADR-0206; il lato è il più piccolo,
   da `BLOCK` (2) a `MAX_BLOCK` (3), che lo contiene con almeno `RING` (2) caselle d'anello per lato (`lato · 18 − 4`). Il forte a 10: 3 × 3
   luoghi, lotto di 50 nei 54, due caselle d'anello per lato. Oltre 3 × 3 (il forte a 5 vorrebbe 6 × 6) **nessun blocco**: il registro lo
   dice e la struttura scende di taglia (`claimSizes`), come senza un blocco libero. `blockPlaces`, `inBlock`, `blocksAround(cx, cy, forma)`,
   `blockLot`, `lotIn`, `reservedCells`, `blockGates` e `blockLevel` leggono il lato e il lotto del blocco; `blockOfPlace` cerca fra i blocchi
   noti (uno per reame) e non più fra i quattro attorno.
4. **Dove si ricorda**: il segno dei piani `block: { x, y, side?, lot? }` e lo stato `world/state.json → blocks: { "x,y": "ax,ay" | { anchor,
   side, lot } }`. Un blocco di 2 × 2 col lotto di 25 si scrive come prima (`markOf`, `blockRecord`): i file dei mondi di ADR-0206 non
   cambiano. `readBlockMark` e `readBlocks` rifiutano un lato fuori da 2-3 o un lotto che non è un intero sano (la geometria dei luoghi dipende
   da loro).
5. **Le garanzie di ADR-0206 per ogni lato**: lotto piano a un livello (`blockLevel` su tutti i luoghi), caselle riservate, il luogo che chiede
   tiene la struttura, gli altri hanno il piano del kernel senza chiamate né carte (otto, nel 3 × 3), tutti si caricano e si scaricano insieme
   (`updateChunks`), regola 10. Con l'anello di due caselle:
   - il varco di un lato fra due luoghi del blocco che cade sotto il lotto va **sulla casella accanto all'angolo**, sul bordo del lotto che si
     cammina (`blockGates`: prima fra 2 e 17 come in ADR-0206, se lì il lotto copre tutto fra 1 e 16), lo stesso per i due luoghi;
   - il **luogo di mezzo** del 3 × 3 è tutto lotto: niente vi è raggiungibile né posato; un lato che il lotto copre tutto tiene il varco
     sotto il lotto, dove nessuno lo cerca;
   - il layout parte dal **primo varco fuori dal lotto** (`layout`: prima dal varco ovest, che nel 3 × 3 può stare sotto il lotto); per i 2 × 2
     è sempre il varco ovest, come prima;
   - il luogo che chiede la gargantuesca non è mai quello di mezzo (`claimBlock` salta i blocchi dove il luogo sarebbe tutto lotto): le cose,
     le rune e le persone del suo piano hanno l'anello dove stare.
6. **Le mura basse** (1,5 viandanti a 10) non le alza il kernel: è il disegno dell'autore. Se vuole un forte con le mura più alte dei piani, lo
   fa il programma (un ritocco del forte, T371 o un task suo).
7. **La versione**: kernel 0.8.2, il contratto resta 0.8. I campi nuovi sono facoltativi e i 2 × 2 si scrivono e si dispongono come prima
   (gli stessi varchi, lo stesso layout): gli universi del contratto 0.8 restano buoni.

## Le misure

- **Il cammino del kernel** (`lab/scripts/forte-scala.ts -- --cammina 20,10,5`, la stessa funzione del gioco, `reachableStoreys`): a 10 il
  corpo del gioco raggiunge a piedi dal suolo quattro piani del forte (il suolo, il camminatoio a 23 voxel, il secondo e il terzo piano del
  mastio a 35 e 59); a 5 solo il suolo (le scale non si salgono); a 20 due.
- **Nel browser** (la build, `?skip&offline`, Chrome headless sulla RTX 2070, `misura-frame.mjs <porta> --blocco … --vpt 10|20`,
  `lab/banco/riferimento/misure/`): a 10 il blocco di 3 × 3 è preso e i nove luoghi sono pianificati in 1,9 s, il forte arriva dal worker in
  11,5 s (10,1 s il programma), accanto al forte 184 fps, 3,8 ms di JS e 3,4 di GPU a frame; a 20 il blocco di 2 × 2 in 1,4 s, il forte in
  12,2 s, 192 fps, 4,0 e 3,9 ms. La memoria dei buffer (le mesh) arriva a 200 MB in tutti e due, il JS a 31 MB: i cinque luoghi in più pesano
  poco, la mesh del forte è la stessa.
- **A piedi** (Claude in Chrome, i tasti tenuti e i tick del kernel): il forte voce `vpt: 10` validato in 7,9 s col suo `time`, il blocco
  20,24-22,26 preso, il viandante entra dalla porta del mastio, attraversa il salone e sale la rampa fino al secondo piano (i piedi da 0,85 a
  4,35 caselle, 35 voxel), senza salto; le foto in `docs/img/forte-gioco-10-*.jpg`.

## Alternative scartate

- **Il fattore 4** (A1 di D61, 5 voxel per casella): 36 luoghi a blocco, il forte più largo del cerchio, piani di 2,5 viandanti e le scale da
  riscrivere.
- **Il lotto di un 3 × 3 sempre di 50** (`lato · 18 − 4`) per ogni struttura che ci va: una di 34 caselle starebbe nel mezzo di un lotto
  riservato con le porte a otto caselle dal bordo che si cammina; il lotto grande quanto la struttura tiene le porte sul sentiero.
- **Il lato del blocco dalla taglia** (gargantuesca = 3 × 3): una gargantuesca scolpita oggi è 25 caselle e sta in 2 × 2; il lato lo dice la
  voce che la struttura indossa.
- **Blocchi di 4 × 4 o più**: sedici luoghi caricati insieme non sono misurati e nessuna struttura li chiede (una gargantuesca a 10 voxel è
  50 caselle); `MAX_BLOCK` sale con una misura.
- **I varchi negli angoli** dei luoghi: un angolo è di due lati; la casella accanto sta su un lato solo ed è già bordo del lotto.
- **Il forte nel seme**: vedi il punto 1.

## Conseguenze

- Una gargantuesca può costare la terra di nove luoghi: nove bozze libere della stessa regione, più rare di quattro; senza, la struttura scende.
- Il registro dice quando una struttura è più grande del blocco più grande.
- Un blocco preso resta della sua forma: se la voce di una gargantuesca cambia dopo (il master mette il forte a 10 dove un 2 × 2 tiene già una
  gargantuesca da 25 dello stesso nome), la struttura non entra più nel lotto e `claimSizes` la fa scendere, col lotto che resta riservato;
  prima di T404 il forte sarebbe uscito dal lotto sopra i sentieri dell'anello.
- T405 (le strutture a 14-16 voxel per casella) trova il blocco pronto: una gargantuesca a 15 è 34 caselle e prende un 3 × 3 col lotto di 34.
- Sicurezza: nessuna superficie nuova. Due campi numerici in più nei piani e nello stato, letti coi tipi e con i limiti (`readBlockMark`,
  `readBlocks`); ai client esce lo stesso rettangolo di prima (`ChunkView.block`).
