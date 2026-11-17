# I sotterranei oggi: funzionano? (T412, 17/11)

Domanda dell'autore (17/11): «credo che i sotterranei non siano mai riusciti allo Scultore: fammi capire se funzionano e in caso li
arrediamo; se è troppo complesso li rimandiamo». Il progetto è [ADR-0091](../adr/0091-i-sotterranei.md); di T52 è fatto solo T52b (il
modello che scende). Qui: le cantine nel kernel di oggi (0.9.1, strutture a 16 voxel per casella), nel browser, negli universi, e quanto
costa finire. Nessun modello chiamato, nessun codice di gioco cambiato.

## In breve

- **Nel kernel funzionano.** Le 6 voci del seme con `cellar` e le 18 degli universi di Claude Cloud tengono la cantina a ogni seme
  (`groundOfForm`: ogni pavimento sotto il suolo si raggiunge dal piano terra). Nel browser si scende la scala fino a −1,19 caselle, dalla
  cantina si esce solo per la scala, si risale. `tests/cellar.test.ts` è verde, ma misura a 20 voxel per casella.
- **Non si vedono.** Il terreno si abbassa solo sulle caselle il cui centro cade sulla cantina. Una cantina del seme è larga 1,75 caselle,
  e a 16 voxel per casella i suoi bordi non stanno sui bordi delle caselle: delle 7,4 caselle² della locanda se ne aprono 3, e il resto
  della cantina resta sotto l'erba. T52e, il taglio che fa vedere sotto terra, non c'è. Chi scende si vede in una fossa stretta, e dal
  piano terra la tromba della scala finisce nell'erba.
- **Ci sono già nel mondo, ma nessuno le chiede.** Nessun agente scrive `cellar`: né il Cartografo né lo Scultore (T52f) né il
  `ModelDirector`. Le cantine entrano solo quando il concetto di una struttura ha il nome di una voce del seme che ne ha una (`locanda`,
  `fucina`, `torre-di-guardia`, …), oppure per riuso (`model.reuse`). Aurora le ha in 6 luoghi (`lab/banco/universi-cloud/INTEGRAZIONE.md`).
  Dentro non ci va niente: `interiorPoints` arreda solo il piano terra.
- **Raccomandazione: per ora l'arredo si rimanda**, perché una cantina arredata oggi non si vedrebbe. Si può fare subito un pezzo piccolo
  e senza modelli: aprire il terreno su tutta la cantina (il buco a copertura, § 4). Da riprendere dopo T410/T411, in quest'ordine: buco,
  T52e senza strati, cantina nella via dei dati dello Scenografo con i mobili del § 10.4, T52f. T52d (gli strati) viene per ultimo, o in
  forma ridotta.

## 1. Il kernel di oggi, sulle voci con `cellar`

Misurate con `lab/scripts/misura-cantine.ts` (nuovo, senza chiamate). Lo script fa girare ogni voce come la fa girare il gioco (`Forms`,
in linea, ogni seme della classe) e ne misura il buco, i pavimenti sotto il suolo, quelli raggiunti dal piano terra e i piani raggiungibili.
Con `--universo <cartella>` misura le voci di un universo sul disco, dopo averlo portato al contratto di oggi con le migrazioni.

| voce (seme) | vpt | griglia | cantina (voxel) | tiene | buco (caselle²) | pavimento raggiunto (caselle²) | pavimento della cantina | piani raggiungibili (caselle dal fondo) |
|---|---|---|---|---|---|---|---|---|
| struttura-fucina | 16 | 100×100×100 | 20 (1,25 caselle) | sì | 7,32 | 6,24 | −1,19 | 0,06 · 1,38 · 3,38 |
| struttura-locanda | 16 | 100×100×100 | 20 | sì | 7,32 | 6,24 | −1,19 | 0,06 · 1,38 · 3,38 |
| struttura-torre-di-guardia | 16 | 100×100×100 | 20 | sì | 7,32 | 6,24 | −1,19 | 0,06 · 1,38 · 3,38 |
| struttura-fucina-nanica | 16 | 100×100×100 | 20 | sì | 7,37 | 6,24 | −0,63 | 0,63 · 1,38 · 3,38 |
| struttura-torre-del-mago | 16 | 100×100×100 | 20 | sì | 7,37 | 6,24 | −0,63 | 0,63 · 1,38 · 3,38 |
| struttura-locanda-del-cinghiale (Enorme) | 16 | 120×120×112 | 16 (1 casella) | sì | 7,37 | 6,24 | −0,63 | 0,38 · 1,13 · 3,13 |

Gli universi di Claude Cloud (`lab/banco/universi-cloud/`, kernel 0.1.5 portati a 0.9) hanno altre 18 voci con `cellar`: 6 per
neapolis, 6 per orichalcum, 6 per sidera, in classe Grande a `vpt: 20` (dalla migrazione 0.8 → 0.9) o Enorme a 16. **Tengono tutte e 18**:
buco di 4,7 caselle² a 20 o di 7,3 a 16, pavimento a −0,5 o −0,95 caselle. Le voci sono di due famiglie, «primi» e «gemelli» (T269, T273),
scritte a mano su due programmi: per questo i numeri si ripetono.

Cosa dicono le misure:

- **La cantina dei programmi di prima resta la stessa in voxel.** Una voce che non dice `vpt` è a 16 (ADR-0209), ma `cellarVoxels`
  tiene 20 voxel per casella di cantina. La cantina scende di 1,25 caselle, il fondo sotto il suolo è di 20 voxel come quando fu scritta,
  e tiene.
- **Il pavimento** delle tre voci «prime» è un voxel sopra il fondo, a −1,19 caselle dal suolo (19 voxel). Quello delle tre «gemelle» è a
  −0,63 (10 voxel). Si scende per una scala di 3 voxel a gradino (`stepOf(16)` = 3): sei gradini da −1 a −16, poi −19.
- **Il controllo dei piani conta la cantina come un piano.** `reachableStoreys` elenca la cantina (0,06 o 0,63 caselle dal fondo) accanto
  al piano terra e a quello di sopra. Oggi non ha conseguenze, perché le voci sono scritte a mano. Quando lo Scultore scriverà le cantine
  (T52f), però, «almeno due piani raggiungibili» (ADR-0162) passerebbe anche per una casa di un piano con la cantina: in T52f il controllo
  deve escludere ciò che sta sotto `base`.
- **`tests/cellar.test.ts` è ancora vero (6 su 6), ma misura a 20.** Da T405 le due case di prova dicono `vpt: 20`. Il caso a 16 è coperto
  da questa misura e dal browser, non da un test. Va aggiunto quando si tocca il buco (§ 4).

## 2. Nel browser

Build e preview su una porta libera, `?skip&offline`, il tappeto fermo. La locanda del seme (`struttura-locanda`, seme 1) è posata dalla
console come in T52b, su un'entità `object.well` con la forma della locanda e il componente `structure`, a (−19,5, −10,5) accanto al borgo,
in un punto senza altre strutture. Il cammino è quello del corpo (`free` col raggio 0,2 e `floorAt` passo per passo), lungo la tromba della
scala.

- **Si scende.** Il viandante va da +2 voxel (il piano terra) a −1, −7, −13 e −19 voxel. In cantina `structureAt` è la locanda, e la
  casa si taglia sopra di lui come ogni struttura in cui si è.
- **Dalla cantina non si esce altrove.** Verso ovest il corpo si ferma a x = 39,5 voxel, contro il muro a 36; verso nord a y = 9,4,
  contro il muro a 6.
- **Si risale.** Lungo la scala il viandante torna da −19 a +2 voxel e quindi fuori.
- **Si vede poco.** `holesIn` apre 3 caselle, una colonna di 1 × 3 (−20, −13…−11), mentre la cantina copre parti di 15 caselle: quelle
  piene per metà o meno restano terreno pieno. In cantina il viandante sta in una fossa larga una casella e il resto della cantina è sotto
  l'erba e la neve. Dal piano terra, dove la casa ha la tromba della scala, si vede l'erba, con i gradini che vi scendono dentro.

| | |
|---|---|
| ![fuori](sotterranei-stato/1-fuori.jpg) fuori, davanti alla locanda | ![sulla scala](sotterranei-stato/2-sulla-scala.jpg) sulla scala, a −7 voxel: la casa tagliata, la tromba |
| ![in cantina](sotterranei-stato/3-in-cantina.jpg) in cantina, a −19: la fossa di una casella, il resto sotto il terreno | ![girata](sotterranei-stato/4-in-cantina-girata.jpg) la stessa, la camera girata: i gradini che scendono nella fossa |
| ![risalito](sotterranei-stato/5-risalito.jpg) risalito al piano terra: dove c'è la tromba, l'erba | |

Il primo tentativo era su un punto che `free` dava libero ma dove c'era già una casa del borgo (l'entità 24, la forma `structure`). Le due
forme si sovrapponevano e il corpo si fermava sulla scala. Non è un difetto delle cantine: le misure sopra sono sul secondo punto, libero.

## 3. Negli universi

- **`universes/` della cartella principale** contiene soltanto `valmora`, `valmora copy 2` e `valmora new`, universi del 2D (con `assets/`,
  senza `models/`): nessuna cantina.
- **Gli universi di Claude Cloud** (`npm run universi:cloud`): aurora usa le 6 voci del seme, posate in 6 luoghi (la locanda e la fucina
  nanica nella Campagna del Primo Passo, la fucina, la torre del mago, la torre di guardia, la locanda del cinghiale); neapolis, orichalcum
  e sidera hanno 6 voci ciascuno (§ 1). Sono tutte scritte a mano, nessuna dallo Scultore.
- **Nessun universo generato dal Concilio** ha una voce con `cellar`. Non può averla, perché nessun compito la chiede.

Quindi il difetto del buco si vede già oggi, ovunque una di queste voci è posata: per esempio nella locanda di aurora.

## 4. Quanto costa finire, sul kernel di oggi

Cosa è cambiato da ADR-0091 (30/10):

- **I nomi.** Dal contratto 0.4-0.5 `sotto` è `cellar` e il codice è in inglese. Lo schema del Cartografo avrà `structures[].cellar` e una
  lista `under` accanto a `inside`, `outside` e `anywhere` (`Where`, T310b). Gli strati diventano `layer: 'stratum'`, e il campo del piano
  `strata`, con `PlaceView.strata`. Le migrazioni non hanno niente da portare, perché nessun piano ha strati.
- **La densità.** A 16 voxel per casella la cantina di una voce nuova (senza `vpt`) è `cellar · 20` voxel, cioè 1,25 caselle: T52f deve
  scegliere se tenerla così o portarla a `cellar · 16`. Il buco a caselle intere funziona male se la cantina non è allineata alle caselle
  (§ 2). La cantina di prova di T52b era di 3 × 3 caselle a 20, allineata: per questo allora sembrava giusto.
- **Lo Scultore delle strutture.** Oggi scrive le strutture senza scheletro, a regole, con le parti del seme (`part-stair`, `part-door`…;
  ADR-0182, ADR-0183) e senza `size` (`withoutSize`). Così la scatola si allunga da sola sotto (`sizeFor` con `under`, `soil` sulla radice
  passa `base` al compilatore), e la nota di T52b su `withSize` vale solo per le classi a scatola fissa. Una cantina, per lo Scultore,
  sarebbe una parte nuova del seme (`part-cellar`: la scala che scende al fondo e le fondamenta), da elencare nella richiesta come le altre.
- **I controlli.** `reachableStoreys` e `habitableParts` vedono la cantina come un piano (§ 1). Il metro dell'ottima (ADR-0210) non ha
  cantine.
- **I lotti di più luoghi** (ADR-0206, ADR-0208) hanno il piano a un livello (`blockLevel`): una gargantuesca con la cantina non cambia il
  conto.
- **Lo Scenografo** (`docs/design/scenografo.md`) non esiste ancora nel gioco (T410 è la via dei dati). Il § 10.4 chiede mobili che
  arrivino al soffitto, perché la via dei dati non lasci vuota la cantina. Nessuna misura dello Scenografo (T303, T406) ha avuto un
  edificio con la cantina.

Le stime sono nella stessa unità del backlog (quota della finestra di Claude); il costo in modelli è a parte.

| pezzo | cosa | stima | modelli | dipende da |
|---|---|---|---|---|
| **buco a copertura** (nuovo) | `holesIn`: una casella si apre se una parte abbastanza grande delle sue colonne è cantina, non solo il centro. Le fondamenta dei programmi del seme scendono al fondo, quindi il fianco del buco è il muro del modello. Un test a 16 in `cellar.test.ts` e la verifica nel browser sulla locanda. | 1 % | nessuno | — |
| **T52e senza strati** | `kernel.underground()`, il taglio a caselle in un disco attorno a chi sta sotto, le colonne tagliate di un colore di terra, il sole e il cielo attenuati. Senza il disco una fossa di 1,25 caselle nasconde alla camera in 3/4 circa una casella dietro il muro sud: con cantine larghe 1,75 caselle è metà. | 3 % | nessuno | buco |
| **cantina nella via dei dati** (§ 10.4) | la cantina come classe di stanza nello Scenografo (il pavimento coperto sotto `base`, raggiunto dalla scala), i mobili da cantina (il seme ha `barile`; servono scaffali e botti grandi, 2-3 modelli dello Scultore, della classe dei mobili), un edificio con la cantina nel banco dello Scenografo. | 2 % | 2-3 modelli | T410, T52e |
| **T52f** | il Cartografo chiede `structures[].cellar` e mette cose `under`, il `ModelDirector` chiede la voce con `cellar`, `part-cellar` e il prompt dello Scultore, `reachableStoreys` senza la cantina, le cose `under` sui pavimenti sotto il suolo raggiunti dalla porta (ADR-0064), `MockAiModels`, test offline. | 4 % | qualche struttura in più per mondo: la cantina allunga la richiesta, e una che non regge torna senza cantina | buco; prima di T411 se si vuole che i modelli rigenerati abbiano cantine |
| **T52d** | terreni `stratum` (predefiniti nel seme e scritti dal Cartografo alla Genesi), bozza per colonna, programma `subsoil` facoltativo dell'ambiente, `strata` nel piano e in `PlaceView`, schema, mock, validatore. Si vede solo nei tagli di T52e. | 4 % (ridotto ai predefiniti del seme e alla bozza, senza Cartografo né programma: 1,5 %) | 2-4 terreni e un programma per ambiente alla Genesi | T52e |

Finire tutto costa circa 14 %, più le chiamate dello Scultore per i mobili e per le cantine delle strutture nuove. Il minimo perché una cantina
arredata si veda è buco + T52e + cantina nella via dei dati: circa 6 %, dopo T410.

## 5. Raccomandazione

**Rimandare l'arredo**, perché oggi una cantina arredata non si vedrebbe: il terreno copre metà della cantina e non c'è il taglio. Le
cantine nel kernel invece funzionano: si scende, si risale, e da sotto non si esce altrove. L'unica cosa da fare subito, piccola e senza
modelli, è **il buco a copertura** (1 %), perché il difetto si vede già oggi in aurora, dovunque è posata una delle 6 voci del seme. Poi,
quando la Fase I lo permette, in quest'ordine:

1. il buco a copertura, con il test a 16;
2. T52e senza strati (il disco, la luce);
3. la cantina nella via dei dati dello Scenografo (dopo T410), con i mobili del § 10.4;
4. T52f, se le strutture nuove devono avere cantine: prima di T411, se si vuole che le abbiano anche i modelli rigenerati;
5. T52d per ultimo, ridotto ai predefiniti del seme.
