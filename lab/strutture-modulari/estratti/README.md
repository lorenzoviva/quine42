# La terza prova delle strutture modulari: i tasselli estratti dai modelli statici (T557)

Lo studio è [`docs/design/strutture-modulari.md`](../../../docs/design/strutture-modulari.md) (§ 12); la prima prova, T522, è in [`../README.md`](../README.md), la
seconda, T543, in [`../grande/README.md`](../grande/README.md). Le risposte dell'autore a D/T543 (27/11) correggevano la seconda prova in sei punti:
i tasselli sono **un solo modello, un solo programma MarkovJunior**; coprono **solo la parte edilizia** (niente mobili né props); **una
cinquantina per edificio** bastano; si **estraggono dai modelli statici** che il Concilio ha scritto usando MarkovJunior come un CAD; **la massa
fa parte del modello** (il seme cambia anche la disposizione); **la ricucitura si fa in MarkovJunior**, nel modello e variabile col seme; e in
posti come `mesa` niente edifici enormi (taverne, bar, osterie, al più tre piani) con una massa e un set diversi. Qui c'è tutto questo, misurato
a 8 semi. Nessun modello è stato chiamato e niente del gioco cambia.

```bash
npx vite-node lab/scripts/strutture-modulari-estratte.ts -- [--semi 8] [--universi <cartella degli universi>] [--foto] [--json lab/strutture-modulari/estratti/misure.json]
```

Gli universi si leggono dal disco (per default `../step8.2A-lab3d/universes`, dove stanno quelli generati); circa tre minuti a 8 semi.

## I file

| file | che cosa |
|---|---|
| `sorgente.ts` | **la sorgente**: un modello statico di un universo sul disco eseguito a un seme come lo esegue il gioco (`Forms.request`, `runForm`, senza interno), ripulito (resta solo ciò che la tavolozza non chiama mobile o prop: antenne, panni, botti, panche, comignoli, insegne, alberi via; le lettere nascoste via; le ante delle porte restano e il cammino le legge aperte, dall'azione `open` del modello), **allineato ai vani** di T522/T543 (32 × 32 × 32 voxel a 16 per casella: il solaio di ogni piano in fondo al suo vano, i muri dentro i vani con una striscia di terra attorno, la griglia spostata perché la scala tagli meno lati), con un **anello di strada** attorno e uno strato d'aria sopra; e la stessa sorgente **senza le scale** (`stairless`: la scala tolta sopra ogni solaio, il solaio richiuso) |
| `estrattore.ts` | **il taglio**: il cammino del corpo nella sorgente (dove il piede sta, 26 voxel liberi sopra, l'impronta di 7 × 7 voxel liscia come la vuole `rampBlocks`, un gradino di 3), i **tasselli** (i vani che il cammino attraversa lontano dal pavimento, una scala da un piano all'altro, sono un tassello di più vani; gli altri vani tasselli di un vano), le **facce lette dai voxel** (un lato è il suo strato di voxel in blocchi di 8 × 8, pieno o no, con il pavimento dentro o fuori; sopra e sotto in blocchi di 4 × 4, e una stanza dice che vuole qualcosa sopra di sé), il **nodo** di ogni tassello (il pezzo del suo cammino con più pavimento coperto) e i lati per cui esce, le **coppie di facce che la sorgente mostra** |
| `insieme.ts` | **il set**: i vani di più semi contati dove sono uguali; le **firme** (vani con facce che incontrano le stesse facce, gli stessi passaggi e le stesse lettere della massa: la prima onda va sulle firme, la seconda sceglie il vano); il propagatore dalle coppie osservate; la riduzione a ~50 tasselli (i gemelli quasi uguali di una stessa firma); le **copie per la ricucitura**: la porta nel mezzo di ogni lato che il vano non passa (con la soglia dove fuori non c'è pavimento: un ballatoio), la rampa interna dal pavimento al piano di sopra e il foro nel solaio sopra di lei, la **scala esterna** in un vano di strada che sale contro la facciata accanto |
| `masse.ts` | **le due masse** come programmi MarkovJunior: `neapolis`, palazzine sole, rettangoli di 2 × 2 a 4 × 4 vani mai a contatto, da uno a tre piani; `mesa`, piccoli edifici di 2 × 2 e 3 × 2 vani col fronte sulla strada maestra, un vuoto fra l'uno e l'altro, qualche lotto lasciato vuoto, uno-due piani e ogni tanto tre, pochi arretrati |
| `programma.ts` | **il programma unico**: il testo XML intero (massa, onda sulle firme, ricucitura, vestizione, voxel), compilato col compilatore del gioco con le due `wfc` del set al loro posto; i lanci per stadio per le misure |
| `misure.ts` | la regola 10 sul grafo dei vani (con e senza ricucitura, e con la ricucitura del kernel di T543 sulla stessa onda), le stanze, i tasselli usati e l'entropia, il cammino del kernel (`walkIn`) sui voxel accanto al grafo |
| `programmi/neapolis.xml`, `programmi/mesa.xml` | **i due programmi**, come li scriverebbe l'Architetto: 19 e 26 mila caratteri, sotto i 100 000 di un file di `models/` |
| `insiemi/neapolis.json`, `insiemi/mesa.json` | i set come li terrebbe il kernel: una riga a tassello (da quale seme, di che famiglia, quanti vani), una a firma |
| `misure.json` | la corsa di 8 semi con le foto |
| `../../scripts/strutture-modulari-estratte.ts` | lo script |

## Le sorgenti e i set

| | `neapolis` | `mesa` |
|---|---|---|
| modello | `casa-comune-structure-f2e1f8de`, «Palazzina di tufo (grande)», Opus 5.5, voto 6 | `struttura-locanda`, «Locanda del Cinghiale, con la cantina delle botti» (la locanda di `mesa`, dal seme: è la taverna che il Far West indossa; un saloon suo `mesa` non l'ha mai avuto) |
| semi | 1-4, con e senza le scale | 1-3, con e senza le scale |
| come sta nei vani | 3 × 3 vani e 3 piani (due e il tetto piano), 16 voxel per casella, nessuna scala di misura | 3 × 3 vani e 3 piani (due e le falde), la sua cantina lasciata sotto, premuta del 1-3 % per stare nei vani |
| tolto come prop | antenne, panni stesi, comignoli | panche, botti, comignoli e il loro fuoco |
| **tasselli** | **49**: 35 di stanza, 10 di tetto, 4 scale di 2 × 1 × 2 vani | **65**: 31 di stanza, 27 di tetto (le falde a più altezze di una pianta a L), 4 di cortile, 3 scale di 1 × 1 × 2 |
| vani del set, copie per la ricucitura | 65, 37 (28 porte, 1 rampa, 4 fori, 4 scale esterne) | 71, 103 (74 porte, 16 rampe, 9 fori, 4 scale esterne) |
| firme, lettere vestite, simboli del programma | 56, 89, 123 | 71, 174, 208 (il motore ne regge 255) |
| coppie di facce viste (x, y, sopra) | 21, 7, 31 | 38, 45, 26 |

## Il programma

Un `<sequence>` solo, eseguito una volta dal motore del gioco sulla griglia di vani che il kernel prepara (come in T543: le strade dei varchi,
l'anello attorno al lotto):

1. **la massa** (le regole di `masse.ts`, così come sono);
2. **l'onda sul set** (`<wfc set="…" stage="sig" tries="100"/>`, l'estensione D2 A): una cella a vano, un motivo a firma, e sopra di lei lo stato da
   cui parte la ricucitura (raggiunto, da raggiungere, né l'uno né l'altro): la griglia diventa due strati a piano;
3. **la ricucitura in MarkovJunior**: un `<markov>` di tre figli. Un `<all>` di 73 regole sparge il «raggiunto» per i passaggi che le firme
   dicono e per le porte e le scale già aperte; quando non sparge più, un `<one>` apre **una porta** a caso (il seme) fra un vano raggiunto e
   uno da raggiungere accanto (16 regole: si marca lo stato, il lato è nella lettera); quando nessuna porta può, un `<one>` (5 regole) mette **una scala**:
   la rampa interna da una stanza raggiunta a quella di sopra, o la **scala esterna** da una strada raggiunta alla porta della stanza del piano
   sopra la facciata accanto; e da capo, finché niente si raggiunge più;
4. **la vestizione**: una `<map scale="1 1 1/2">` che legge la firma e lo stato di ogni vano e scrive la lettera del vano da mettere (il vano
   com'è, con quella porta, con la rampa, col foro, con la scala esterna). Le lettere vestite riusano i simboli delle firme: la `map` scrive su
   una griglia nuova, e così il programma sta nei 255 simboli del motore;
5. **i voxel** (`<wfc set="…" stage="voxels" tries="1"/>`): ogni vano della sua lettera, scelto a peso fra i vani che l'hanno, scritto intero.

Le due `wfc` sono l'unica estensione: il kernel le costruirebbe dal set (le facce lette dai voxel). Il resto compila col compilatore del gioco
così com'è, e nei tetti del mondo (`worldNodeErrors` non dice niente; `FORM_LIMITS` e `WORLD_NODE_LIMITS` nella corsa).

## Le misure (8 semi, `misure.json`)

«Senza» è l'onda sola; «MJ» la ricucitura del programma; «kernel T543» la ricucitura del kernel della seconda prova fatta sulla stessa onda
(rivestire due vani con firme della stessa famiglia che incontrano ancora i vicini e passano: nessuna porta scolpita). Sul grafo dei vani,
dall'anello di strada; «sopra» sono le stanze dei piani alti.

| set | terreno | semi fatti | ms (massa · onda · ricucitura · voxel) | pian terreno senza / MJ / T543 | piani alti senza / MJ / T543 | scale | tetti MJ | porte, scale dentro, fuori | stanze (la più grande) | tasselli usati, bit |
|---|---|---|---|---|---|---|---|---|---|---|
| neapolis | lotto | 8/8 | 345 (1 · 6 · 2 · 337) | 56 / **100** / 56 % | 13 / **93** / 13 % | 100 % | 66 % | 3, 0,5, 0,9 | 3 (16 vani) | 21 di 49, 4,2 |
| neapolis | blocco | 8/8 | 424 (3 · 17 · 6 · 399) | 45 / **100** / 45 % | 12 / **85** / 12 % | 100 % | 41 % | 20, 1,6, 8,9 | 24 (16) | 41 di 49, 5,0 |
| mesa | lotto | 8/8 | 596 (1 · 10 · 3 · 582) | 70 / **100** / 87 % | 0 / **85** / 0 % | 100 % | — | 2,3, 0,1, 0,4 | 4 (4) | 11 di 65, 1,6 |
| mesa | blocco | 5/8 | 681 (4 · 47 · 5 · 624) | 82 / **100** / 92 % | 1 / **86** / 3 % | 100 % | — | 13, 1,8, 1,8 | 30 (6) | 28 di 65, 2,8 |

- **Tutto nei tetti del mondo**: il lotto di un blocco (480 × 480 × 128 voxel, 29,5 milioni) in 0,4-0,7 s, quasi tutto per scrivere i voxel; la
  ricucitura 2-6 ms, l'onda 6-47 ms.
- **La ricucitura in MarkovJunior porta il pian terreno al 100 % e i piani alti all'85-93 %**, dove l'onda sola si ferma al 45-82 % e al 0-13 %.
  Quella del kernel di T543 sulla stessa onda **non apre quasi niente** (0-1,2 vani rivestiti a corsa): i tasselli estratti hanno facce strette (si
  incontrano come la sorgente li mostra) e non c'è un altro vano con un passaggio in più che incontri ancora i vicini; servono copie con la porta,
  ed è ciò che la ricucitura in MarkovJunior fa.
- **Le scale**: la palazzina ha una sola scala, nell'angolo nord-ovest; senza la copia senza scale la fila nord dei suoi vani era «scala, scala,
  angolo» e nessun palazzo poteva essere più largo di 3 vani. Con la copia, le scale vengono dal tassello della scala (dove sta: 44/44 raggiunte
  sul blocco), dalla rampa interna (rara: i vani della palazzina hanno i muri spessi vicino ai lati) e soprattutto dalla **scala esterna** (8,9 a
  blocco di `neapolis`, 1,8 in quello di `mesa`), che il cammino del kernel sale.
- **I tetti**: la palazzina non ha accesso al tetto; quelli raggiunti (41-66 %) lo sono per le porte aperte fra un tetto e una stanza più alta
  accanto. Le falde della locanda non si camminano.
- **I semi da collaudare**: 3 semi su 8 del blocco di `mesa` l'onda li rifiuta subito (le condizioni iniziali contraddittorie: la massa chiede
  un vano che il set non ha accanto a quelli che ha); il kernel passerebbe al seme dopo. `neapolis` li prende tutti.
- **Il cammino del kernel** (`walkIn`, le ante aperte) sui voxel, accanto al grafo: `neapolis` lotto 32 vani raggiunti dai due e nessuna
  differenza, blocco 142 e 1 solo dal grafo; `mesa` blocco (seme 2, il primo che l'onda prende) 68 e **8 solo dal grafo**: oltre una rampa
  interna (il foro e la rampa nei vani della locanda non si salgono come il grafo crede). La rampa interna va collaudata col cammino; la scala
  esterna e le porte reggono.
- **La varianza**: fra due semi la massa cambia il 29 % (`neapolis`) e il 20 % (`mesa`) dei vani, l'uso dei tasselli dista 0,18-0,21, i
  colori 0,03-0,06 (stesso set, stesso aspetto); a massa ferma l'onda cambia la firma del 13 % dei vani in `neapolis` e del 38 % in `mesa`; fra i
  due set i colori distano 0,87.

## Le foto

| | |
|---|---|
| `foto/sorgenti.png` (`sorgenti-neapolis.png`, `sorgenti-mesa.png`) | i modelli statici da cui vengono i set, ai semi usati, allineati ai vani con l'anello di strada |
| `foto/catalogo-neapolis.png`, `foto/catalogo-mesa.png` | i tasselli estratti, uno per tassello |
| `foto/neapolis-lotto.png`, `foto/neapolis-blocco.png` | tre semi su un lotto e sul lotto di un blocco: palazzine di uno-tre piani, le scale esterne contro le facciate |
| `foto/mesa-lotto.png`, `foto/mesa-blocco.png` | lo stesso per le taverne di `mesa` |
| `foto/*-blocco-due-lati.png` | il blocco di un seme da due lati |
| `foto/accanto-a-t543.png` | il lotto di un blocco della via A di T543 (la palazzina del set grande), poi `neapolis` e `mesa` di questa prova |

## Che cosa ha insegnato, in ordine

1. **Il taglio a vani regolari attraversa i ritmi della sorgente**: le finestre della palazzina ogni 10 voxel, i vani ogni 32. Con le facce lette
   lettera per lettera due vani di facciata si incontrano solo come nella sorgente, e un palazzo può essere solo largo quanto lei. Le facce che
   reggono sono **pieno o vuoto, in blocchi di 8 voxel** (un solaio, la sezione di un muro, un'apertura grande): qualche finestra resta tagliata
   a metà dove due vani si incontrano.
2. **Le coppie osservate, non le classi**: due facce si incontrano se la sorgente le mostra insieme (in qualunque vano con la stessa faccia). Unire
   le facce per classi d'equivalenza transitive fa incontrare una stanza col vuoto attraverso un muro; le coppie no.
3. **Una scala nell'angolo rende unica la facciata che tocca**: senza la copia senza scale nessun palazzo di `neapolis` passava i 3 vani di
   larghezza. Le scale vanno tolte dalla sorgente e rimesse dal tassello della scala dove sta, o dalla ricucitura.
4. **Una stanza vuole qualcosa sopra**: senza dirlo nella faccia di sopra l'onda metteva l'aria sopra una stanza (le stanze senza tetto di `mesa`).
5. **Le lettere sono poche**: il motore regge 255 simboli. Le firme (56-71), le lettere vestite (89-170) e la tavolozza ci stanno perché la
   vestizione scrive una griglia nuova e riusa i simboli delle firme; quattro rotazioni della sorgente non ci starebbero (277 firme), e non
   servono: la sorgente ha già le facciate nelle quattro direzioni.
6. **La ricucitura del kernel di T543 non basta coi tasselli estratti**: ricucire vuol dire scolpire (una porta, una soglia, una scala), non
   scegliere fra i vani che ci sono.
7. **La scala esterna è la ricucitura verticale che regge**: la rampa interna entra solo nei vani senza muri vicini (uno in tutta la palazzina) e,
   nei vani della locanda, il cammino del kernel non sempre la sale; la scala esterna sta in una strada, sale contro la facciata e il kernel la sale.
8. **La locanda di `mesa` si ricompone meno della palazzina**: una pianta a L con le falde a più altezze dà 27 tasselli di tetto e coppie più
   rigide; la massa di `mesa` sta su impronte di 2 × 2 e 3 × 2 vani, e un seme su tre del blocco va scartato.

## Che cosa non fa

I tasselli non variano per seme (vengono da semi diversi della sorgente, ognuno com'è). La massa non sa quali impronte il set regge: dove non le
regge l'onda rifiuta il seme. La rampa interna non è collaudata dal cammino del kernel in `mesa`. I tetti della palazzina si raggiungono solo per
caso. Il terreno è in piano. Niente è nel kernel, nel renderer o sul filo: le due `wfc` del set le costruisce il laboratorio; il formato del set
(una riga a tassello, da quale modello, seme e vano viene) è scritto in `insiemi/*.json`, non letto da nessuno. I tempi sono di una macchina carica
di altri agenti.
