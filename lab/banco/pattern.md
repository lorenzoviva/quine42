# I pattern di MarkovJunior e il metodo del cantiere (T181)

I modelli di `lab/banco/finale/` e `conferma/` sono belli ma statici: centinaia di `<box>` a coordinate assolute, un seme solo, una taglia
sola (`varianza/riepilogo.md`). Qui c'è l'altro modo di scrivere un edificio: **un programma che lo fa crescere** con le regole di
MarkovJunior, come fanno i programmi del [repository](https://github.com/mxgmn/MarkovJunior) (`lab/mjx/official/`, e i grandi in
`lab/mjx/official/riferimento/`, con licenza e fonte). Ogni pattern qui sotto dice cosa fa, il frammento minimo, da dove viene, cosa dà per
**varianza** (semi diversi, architetture diverse) e **scala** (la stessa scatola di qualunque taglia). In fondo i tre programmi di riferimento
scritti con questo metodo (`riferimento/`) e ciò che il motore non sa fare.

Le regole del motore che contano (`src/mj/engine.ts`, `src/mj/model.ts`): gli strati si scrivono dall'alto (`in="D W"` è D sopra W);
`one` riscrive una corrispondenza a caso per passo, `all` tutte quelle che non si sovrappongono nelle celle scritte, `prl` ognuna con
probabilità `p` (che sta sulla `<rule>`, non sul nodo); senza `steps` un nodo va finché cambia qualcosa; la simmetria predefinita in 3D è
tutto il gruppo del cubo: un edificio vuole `symmetry="(xy)"` sulla radice (la gravità resta) e `"()"` sulle regole verticali.

## Come costa un programma

Ogni variante di ogni pattern di ogni nodo costa una scansione intera della griglia (1,4 milioni di posizioni a Enorme) la prima volta che
il nodo gira, poi solo le celle cambiate. La scansione si ferma alla **prima cella** del pattern che non corrisponde: un pattern la cui
prima cella (in basso a sinistra, lo strato più basso) è una lettera rara costa ~15 ms; uno che comincia con `*` o con l'aria `B` costa
quanto tutte le sue celle (il primo progetto della palazzina spendeva 2,2 s in un solo nodo per questo). Da qui tre regole:

1. **Il piano del cantiere non è aria**: lo strato z=0 si riempie di una lettera sua (`z`, «lotto») e tutte le regole del progetto la
   usano al posto di `B`, così falliscono subito su ogni altro strato.
2. **Ancora rara nell'angolo**: ogni pattern grande ha una lettera rara nella cella (0,0,0) e, se ha simmetrie, in tutti gli angoli
   che le simmetrie portano lì (la striscia della scala si piazza **dopo** il riempimento delle campate, così i suoi angoli sono `k` e `n`).
3. **Poche varianti**: `symmetry="()"` dove basta una direzione, `(x)` o `(y)` dove ne bastano due; le colonne verticali sempre `()`.

Con queste tre regole la palazzina gira in 2,0 s a Grande e 3,3 s a Enorme, il forte in 3,7 s, il tempio in 2,1 s (il limite del gioco è 8 s,
`MODEL_TIME`); con altri processi sulla macchina i tempi crescono del 30-50 %.

## I pattern

### 1. Il lotto: orlo, origine, reticolo

**Cosa fa.** Segna il bordo della griglia e un punto di partenza senza sapere quanto è grande la scatola; da lì un reticolo di pilastri a
passo fisso **finché c'è posto**. È ciò che rende un programma indipendente dalla taglia: la stessa riga di XML dà 3 campate a Grande e
3 o 4 a Enorme a seconda del passo.

```xml
<sequence values="BNEzP…" symmetry="(xy)" suolo="E" origin="bottom">   <!-- E riempie lo strato del suolo (z=0 senza cantina), N sta al suo centro -->
  <prl in="***/*E*/***" out="***/*z*/***"/>                            <!-- dentro l'orlo il lotto diventa z: l'orlo resta E -->
  <one in="Nzzzzzzzzzzzzzzz" out="***************Z" symmetry="()"/>      <!-- dal centro all'angolo della campata centrale -->
  <one in="Z/z/z/z/z/z/z/z/z/z/z/z/z/z/z/z" out="*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/P" symmetry="()"/>
  <all in="Pzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz" out="******************************P***"/>  <!-- il prossimo pilastro a 30, se oltre c'è margine 3 -->
```

**Da dove viene.** `StrangeDungeon` (`prl in="***/*E*/***"` lascia l'orlo), `NystromDungeon` (`PBB → **P` disegna una griglia dall'origine),
`Growth`/`MazeGrowth` (`origin`).

**Varianza e scala.** Nessuna varianza (è la struttura), tutta la scala: il margine richiesto oltre il pilastro (`zzz` dopo `P`) decide
quante campate stanno nella scatola. Il centro resta sempre il centro di una campata, quindi la porta sta sul davanti al centro a ogni taglia.

### 2. Campate complete, linee fra i pilastri, il davanti

**Cosa fa.** Riconosce le campate del reticolo (quattro pilastri agli angoli → un marcatore al centro), traccia le linee fra pilastri
contigui, e trova il **davanti** (la campata oltre il cui pilastro non c'è più reticolo) senza coordinate.

```xml
<all in="P*…*P/*…*/P*…*P" out="…c…" symmetry="()"/>   <!-- 31×31: c al centro se i quattro angoli sono P -->
<all in="PzzzzzzzzzzzzzzzzzzzzzzzzzzzzzP" out="*ppppppppppppppppppppppppppppp*"/>
<all in="c***…/…/***P/***z" out="f…" symmetry="()"/>   <!-- c con, 15 sotto e 15 a destra, un pilastro e poi il lotto vuoto: campata davanti -->
```

**Da dove viene.** Il reticolo di `NystromDungeon`; l'idea delle linee fra nodi da `Apartemazements` (`Paths`).

**Varianza e scala.** Il davanti è la riga di campate più vicina al bordo basso della scatola, a ogni taglia.

### 3. Il progetto: crescita da un seme, poi scelte a caso

**Cosa fa.** La campata della porta è una di quelle davanti con vicine a entrambi i lati (così la porta non sta mai a un bordo); le altre
campate costruite **crescono** da lei (`one steps="3"`: tre vicine a caso, sempre connesse) e poi un giro di `prl` con `p` aggiunge o no
ciascuna vicina. Lo stesso per i piani: le campate a due piani crescono dalla porta come un gruppo connesso. **È la varianza delle
piante**: con 9 campate possibili si ottengono L, T, quadrati, strisce.

```xml
<one in="[cf]*…*f*…*[cf]" out="*…d…*" steps="1" symmetry="()"/>
<one steps="3"><rule in="d*…*[cf]" out="*…*b"/><rule in="b*…*[cf]" out="*…*b"/></one>
<prl steps="1"><rule in="d*…*[cf]" out="*…*b" p="0.35"/><rule in="b*…*[cf]" out="*…*b" p="0.35"/></prl>
```

**Da dove viene.** `Growth` (`WB → WW`, una cella a caso per passo), `StochasticVoronoi` (semi `one steps="10"` e poi crescita).

**Varianza e scala.** Il numero di campate possibili cresce con la taglia, quello costruito con `steps` e `p`: a Enorme la palazzina ha
più spazio attorno. Misurato (`banco-varianza`): pianta 0,38 a Grande e 0,40 a Enorme, perimetro 0,21 e 0,37, 5 architetture su 5.

### 4. Il riempimento e i muri dalle lettere

**Cosa fa.** Ogni campata scelta si riempie con la sua lettera (`bz → *b`, `tz → *t`: la linea `p` ferma il riempimento), e poi ogni cella
di linea diventa il muro che le sue due vicine dicono: `bpb` interno basso, `tpt` interno alto, `bpt` misto, `zpb` esterno. I pilastri
prendono la lettera del muro più alto che toccano. **Nessuna coordinata**: i muri sono una conseguenza del progetto.

```xml
<all><rule in="bz" out="*b"/><rule in="tz" out="*t"/></all>
<all><rule in="bpb" out="*i*"/><rule in="[ts]p[ts]" out="*I*"/><rule in="bp[ts]" out="*J*"/></all>
<all><rule in="zpb" out="*w*"/><rule in="zp[ts]" out="*X*"/></all>
<prl><rule in="PX" out="Q*"/><rule in="PI" out="Q*"/><rule in="PJ" out="Q*"/></prl>
```

**Da dove viene.** `ModernHouse` («erase walls not bounded by columns», «mark insides»), `Apartemazements` («draw columns», «remove extra
columns»), il riempimento di `Voronoi` (`EB → *E`).

**Attenzione.** Una cella del progetto con una lettera diversa (la scala `s`) accanto a una linea la lascia non classificata: le regole
dei muri vanno scritte con insiemi (`[ts]`), e i pilastri con `[qQ]` nei pattern dei tratti.

### 5. Le colonne: una cella del progetto tira su tutta la sua colonna

**Cosa fa.** Il pattern verticale 1×1×N (fino a 1728 celle, cioè fino a oltre 1000 strati) scrive **in un colpo** tutto ciò che sta sopra
una cella del progetto: pavimento, aria, solaio, pavimento, aria, tetto, parapetto. Un `all` con una regola per lettera costruisce
l'edificio intero in un passo (la palazzina: 22 regole, 13 000 celle). È il «cemento armato attorno allo scheletro» del cantiere: le quote
dei piani stanno in una stringa, non in cento `<box>`.

```xml
<all symmetry="()">
  <rule in="B B … B t" out="R S B … B F S B … B F S"/>   <!-- 66 strati: due piani, dal basso: *, F, 30 B, S, F, 30 B, S, R -->
  <rule in="B B … B X" out="W W W R S W … u … W F S C … U … C C"/>  <!-- il muro esterno alto, con le fasce delle finestre U e u -->
```

**Da dove viene.** `Apartemazements` («draw columns»: `D B → * F`, `F B → * F`, una cella per passo); qui in una regola sola.

**Varianza e scala.** Nessuna: le quote sono le stesse a ogni taglia, in voxel. Una persona è 30 voxel a Grande e 24 a Enorme: un piano di
32 regge entrambe (`testa` ≥ 1,5 caselle). Chi vuole un piano in più a Enorme scrive una colonna da 98 strati: a Grande (80) non trova
posto e non si applica, e una colonna da 66 fa da ripiego.

### 6. La scala a profilo

**Cosa fa.** Un pattern 2D (lunghezza × altezza) scrive la rampa intera: per ogni gradino la colonna piena fino alla sua cima, il gradino
(`T`), l'aria sopra e, se serve, il solaio e il tetto in cima. Alzata 2 e pedata 1: sale per qualunque corpo (`gradino` 4, 3, 2 alle tre
taglie), e la larghezza (10-12) è ciò che serve al corpo del gioco (`rampBlocks` guarda tutte le colonne sotto il corpo, da 8 a 9 voxel).
L'ancora è il **tratto di approccio**: la rampa sale verso il muro, non contro.

```xml
<all in="s s … s g s  B…" out="C C … T  B…"/>   <!-- 16 colonne × 66 strati; g è il varco nel muro fra le due campate -->
```

Tre cose imparate misurando con il corpo del gioco (`misure.ts`):

- **L'approccio è largo quanto il corpo**: davanti al primo gradino servono almeno 9 celle piane (il forte: `111111111 222…`), altrimenti
  la scatola del corpo tocca i gradini alti e non sale.
- **Lo sbocco in cima** è di lato: l'ultimo gradino è alla quota del piano, il corpo scende di lato sul pavimento. Non serve un pianerottolo
  oltre la rampa, serve che il piano accanto sia a quella quota.
- **Il foro nel solaio** toglie al piano di sopra l'area della rampa più 4 celle intorno (il corpo non si avvicina al vuoto): un piano
  di 27×27 con un foro di 10×16 non arriva alle 310 celle raggiunte che fanno un «piano». Nel forte il mastio prende due campate; nella
  palazzina la rampa attraversa il muro (`g`) e il foro è diviso fra due campate.
- **Due rampe una sull'altra** nella stessa striscia (il mastio): fra la rampa di sotto e quella di sopra 12 voxel d'aria, il resto pieno:
  la rampa di sopra poggia su quella di sotto.

**Da dove viene.** `StairsPath` e `SeaVilla` hanno scale come tessere (`Stairs`, `OrientedStairs`): non si possono eseguire qui; il profilo
in un pattern solo è il modo del motore.

### 7. Finestre sulle fasce

**Cosa fa.** Il muro esterno porta una **fascia** (una lettera `U` fra due quote); una regola `all` di 11×14 mette finestre con telaio e
vetro dove la fascia è lunga abbastanza, a caso, senza sovrapporsi; ciò che resta della fascia torna muro. Il numero e la posizione delle
finestre cambiano a ogni seme; la fascia garantisce l'altezza giusta senza coordinate.

```xml
<all in="UUUUUUUUUUU UUUUUUUUUUU … (14 strati)" out="*********** *DDDDDDDDD* *DVVVVVVVD* …"/>
<prl><rule in="U" out="C"/><rule in="u" out="W"/></prl>
```

**Da dove viene.** `Apartemazements` («place windows» `FBBBF *AAA* → *RRR*`, poi «merge h-even windows»), `CarmaTower` («setting up panels»,
«mark long enough windows», «deepen windows»), `ModernHouse` («mark boundary walls as windows», «merge elementary windows»).

**Attenzione.** Il banco conta una finestra solo sul piano principale di ogni lato (`lati()` in `misure.ts`): tutto ciò che sta più dentro
di 2 voxel si fonde in un unico «buco» con il cielo. Le finestre del mastio dietro le mura non contano; contano le feritoie sulla faccia
esterna (`mmmm → *uu*`, sotto ogni merlo), dette «finestra a feritoia» così `isWindow` le riconosce dal nome.

### 8. Tratti aperti, panche, porte: una per muro

**Cosa fa.** Un tratto di muro interno fra due pilastri (`[qQ] I×29 [qQ]`) si apre tutto (`one steps="1"`, poi `prl` con `p`) e in
testa riceve una **panca** da saltare; ogni tratto che resta riceve **una** porta in una di tre posizioni (`one` con tre regole: fino a
che un tratto è intero, una regola si applica, poi non più).

```xml
<one steps="1"><rule in="[qQ]IIII…I[qQ]" out="*2222…2*"/></one>
<one><rule in="[qQ]III…[qQ]" out="****HHHHHHHHHHH***…"/><rule in="[qQ]III…[qQ]" out="**********HHHHHHHHHHH…"/></one>
```

**Da dove viene.** `NystromDungeon` («connect components», «insert cycles» con `one … steps="5"`), `DungeonGrowth` («retract dead ends»).

### 9. La cinta dalle linee fra dentro e fuori, le torri dove girano, lo spessore per crescita

**Cosa fa.** Nel forte le campate scelte sono il **dentro**; le linee fra dentro e fuori sono le mura (`zp[bK] → w`), i pilastri dove le mura
girano (`Pw/w*`: un pilastro con mura su due lati perpendicolari) sono torri, le mura si ingrossano per crescita (`w[zbK] → *w` per 4
passi: 9 voxel, un cammino di ronda da 8 fra i merli), le torri crescono quadrate (`t[zbw] → *t` più la diagonale, 6 passi: 13×13). La
faccia esterna (`zw → *W`) riceve merli (`WWWWWWWW → MMMMmmmm`) e feritoie; il portone scava le mura (`o/[wb] → */o` con simmetria `(y)`),
prosegue come **via** nel cortile (`v`, dove casse e pozzo non vanno) e per 20 celle è coperto (l'androne che il banco misura come porta).

**Da dove viene.** `SeaVilla` e `ModernHouse` (marcare i contorni, «mark grass nodes»), `Rectangle` (crescita a rettangolo), `Hills`
(`prl in="A *" out="B *"` come «solo lo strato sopra»).

**Varianza e scala.** Il perimetro è quello del gruppo di campate: 0,39-0,43 fra semi (soglia 0,15). A Gargantuesca la griglia è la stessa di
Enorme (120³), cambia solo il corpo (vpt 12 contro 16): le stesse mura sono più larghe in caselle.

### 10. Marcatori temporanei e riempimenti che discriminano

**Cosa fa.** L'idea dell'autore (riempire tutto di «materiale» per poi far distinguere una regola) è il modo normale di MarkovJunior: `E` sul
pavimento e `z` nel lotto, `c`/`f` per le campate, `k`/`n` per la coppia della scala, `U`/`u` per le fasce, `v` per la via, `y` per l'anello
del mastio. Tutti `hidden="True"`, tutti tolti alla fine (`prl`), o riscritti dalla colonna stessa (lo z=0 del progetto diventa la platea).

**Da dove viene.** Dappertutto: `OddScale3D` (`D`→`Y`→`A`), `CarmaTower` (`t`, `T`, `R`, `O`, `H` segnano impalcature e pannelli e poi
spariscono: «delete fine scaffold»), `River` (`W`, `R` → `U` → `B`).

### 11. `path`, `convolution`, `map`: cosa danno e cosa no

- **`path`** (`GoTo`, `DungeonGrowth`, `SeaVilla` «connect to water»): il cammino più corto fra due lettere su un terreno ammesso, con
  `inertia` per tratti dritti e `longest` per partire da lontano. Serve per collegare stanze o cortili non contigui (un sentiero fra due
  edifici, un corridoio fra due porte); nei tre riferimenti non è servito perché le campate adiacenti si collegano da sole. Per un
  edificio: scavare un corridoio da una porta a un'altra attraverso un blocco pieno (`on` = la lettera del pieno).
- **`convolution`** (`Hills`, `OpenCave3D`, `LostCity`, `CarmaTower` «mark edges», `Counting`): leviga, erode, dilata per conteggio dei
  vicini; «mark edges» (`L → p` se 2-3 vicini sono `B`) trova spigoli e orli in un passo. Utile per colline e rocce, per smussare i merli,
  per un bordo di gronda; non per piante di edifici (le smussa).
- **`map`** (`OddScale3D`, `CarmaTower`, `ModernHouse` 1/3 e 5/3): decidere su una griglia grossa e poi ingrandire. Qui **non si usa**: con
  `map` la scatola la decide il programma (`withSize` lascia la `size` scritta, `scales` in `sculptor.ts`) e un programma non serve più due
  taglie. Il motore accetta solo scale intere, non `1/3`: `ModernHouse` e `SeaVilla` non girano per questo oltre che per `wfc`.

### 12. Ciò che il motore non sa fare

- `wfc` a tessere (`ModernHouse`, `SeaVilla`, `Apartemazements`, `PillarsOfEternity`, `Partitioning`, `Surface`, `Escher*`): è il cuore di
  quei modelli (partizione a tessere `Partition`, scale `Stairs`/`OrientedStairs`). Qui si sostituisce con il reticolo e la crescita (1-3).
- `convchain` (`ChainDungeon`), `map` frazionaria.
- `field` e `temperature` (`Keys`, `SoftPath`, `Division`, `Dwarves`), `observe` e `search` (`StairsPath`, `RegularPath`, `CompleteSAW`):
  **il motore li sa da T334** (ADR-0172; i modelli in `lab/mjx/official/`, le foto accanto all'originale in `inferenza/`), ma il validatore del
  gioco non li prende finché T336 non li apre: per lo Scultore, oggi, un corridoio «verso» un bersaglio si fa ancora con `path`.
- Le regole da file ci sono dal T333 (ADR-0171), ma di testo, non immagini: `fin`, `fout` e `file` leggono `models/<nome>.txt`
  (`CarmaTower`, `DungeonGrowth` vanno riscritti a lettere); un pattern lungo si scrive anche nei figli `<in>`/`<out>`, su più
  righe, e un sottoblocco in un file a parte si esegue con `<import file="…"/>`.
- Pattern più grandi di 1728 celle: una colonna da 96 strati sì, un profilo 18×96 sì (1728), una campata intera 31×31×anything no.

### 13. Regole corte con `steps` al posto dei pattern lunghi (T182)

I pattern 5 e 6 costano: una colonna da 66 strati è una stringa da contare, ed è il grosso dei 16 mila token della palazzina. Lo stesso edificio si scrive
con regole di poche celle ripetute (`riferimento/cantiere.xml`, ~7 000 token stimati, 3-5 s), e chi lo scrive conta passi invece di caratteri:

```xml
<all in="[Nx]az" out="*xa" steps="14"/>        <!-- un camminatore: va solo avanti perché guarda la sua scia -->
<all in="[Ql]a[zp]" out="*la" steps="44"/>     <!-- attraversa le linee p: la scia ha una lettera diversa, o torna indietro a caso -->
<all in="tz" out="*t"/>                        <!-- riempie una campata e si ferma alle linee -->
<one in="*zzzzzzzzzzzz/Ppppppppppppp/*333333333333" out="******b******/******H******/*************" steps="1"/>  <!-- cresce passando un muro: la porta è dove passa, tutto resta collegato -->
<all steps="30" symmetry="()"><rule in="B t" out="t B"/><rule in="B i" out="i C"/></all>  <!-- la testa sale di 30 e lascia una lettera: le quote sono numeri di passi -->
<all in="*BB *B* TY*" out="*TY *K* KK*" steps="16"/>  <!-- la scala: T è il gradino, Y dice la direzione; alzata 2, pedata 1 -->
<all in="K B" out="* K" symmetry="()"/>        <!-- sotto la scala è pieno: un vuoto sotto i gradini ferma il corpo (`levelAt`) -->
<all in="***/*B*/*** *R*/RRR/*R*" out="***/*R*/*** ***/***/***" steps="10" symmetry="()"/>  <!-- il tetto a falde: uno strato in più sopra chi ha R attorno -->
```

Tre cose che si sono dovute misurare:

- **La scala sbocca in linea.** Il corpo non scende di lato dall'ultimo gradino (`rampBlocks`: sotto i suoi 9 voxel due colonne vicine non differiscono più di un gradino). Attraversa un muro (`y`), con il piano di sopra oltre: si sceglie **prima** delle altre porte, nella campata davanti, attaccata a un pilastro.
- **Le porte a 1-11 da un pilastro**, non a caso nel muro: così resta posto per la scala nello stesso muro; una porta in mezzo non lo lascia.
- **A Grande una campata da 29 è una stanza solo se è sgombra fino ai muri** (29 − 9 del corpo − 2×8 della strettoia di `contaStanze` lasciano 4×4, il minimo): un arredo la toglie dalla conta. Non è detto che sia giusto; è ciò che la soglia misura oggi.

**La cantina regge due taglie con la lettera del suolo** (T258, ADR-0135): il piano parte da `suolo="E"`, il pozzo si scava fino al fondo (`ground="Z"`) con regole senza `steps`. Senza quella lettera un programma solo non poteva: `docs/pipeline/domande/T182.md`. Il programma è `riferimento/cantina.xml`.

## I programmi di riferimento (`riferimento/`)

| programma | bersaglio | taglie | nodi | regge | varia | tempo |
|---|---|---|---|---|---|---|
| `palazzina.xml` | moderna | Grande (100×100×80, vpt 20), Enorme (120×120×96, vpt 16) | 46 | 5/5 e 5/5 | sì: voxel 0,53 / 0,62, pianta 0,38 / 0,40, perimetro 0,21 / 0,37, interno 0,60 / 0,67, architetture 5/5 | 2,0 s / 3,3 s |
| `forte.xml` | rocca | Enorme (vpt 16), Gargantuesca (vpt 12): la stessa griglia | 58 | 5/5 e 5/5 | sì: voxel 0,61, pianta 0,57, perimetro 0,29 / 0,31, interno 0,91, architetture 5/5 | 3,7 s |
| `tempio.xml` | tempio | Grande, Enorme | 36 | 5/5 e 5/5 | no: voxel 0,76, pianta 0,20, interno 0,39, perimetro 0,00 / 0,02, architetture 2/5 | 2,1 s / 3,3 s |

I numeri vengono da `npx vite-node lab/scripts/banco-varianza.ts -- --xml lab/banco/riferimento/<nome>.xml --bersagli <bersaglio>`; i fogli
di contatto sono `riferimento/<nome>-<bersaglio>.png`, i dettagli di ciascuno in `riferimento/README.md`. La misura di partenza era 31
programmi su 31 statici e 1 su 27 che regge a Enorme (`varianza/riepilogo.md`). Il tempio regge ma non varia nel perimetro: nel lotto da 100
una piramide a tre terrazze non ha spazio per cambiare contorno (il perché è nel README); è il limite della scatola, non del metodo.

Il metodo, in ordine, è quello che l'autore ha proposto: **il lotto** (1), **il progetto** come lettere su z=0 (2-4), **le colonne** (5), **le
scale** (6), poi ciò che si aggiunge sulle facce (7-9) e la pulizia (10). Ciò che un `<box>` fa con un numero, qui lo fa una regola che
guarda cosa c'è intorno: il programma non sa quanto è grande la scatola e non sa quante campate ha costruito, e per questo serve due
taglie e cinque semi.
