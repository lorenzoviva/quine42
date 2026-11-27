# La seconda prova delle strutture modulari (T543)

Lo studio è [`docs/design/strutture-modulari.md`](../../../docs/design/strutture-modulari.md) (§ 10-11); la prima prova, T522, è nella cartella di
sopra ([`../README.md`](../README.md)). Le risposte dell'autore a D/T522 (27/11) chiedevano di rifare la prova con un set grande, di mettere la
**via A** (il complesso in un programma MarkovJunior dell'Architetto) contro la **via B** (il tessitore del kernel di T522), con stanze più grandi
di 2 × 2 caselle, la massa scritta dall'Architetto come programma MarkovJunior (D3 B) e i tetti che si possono raggiungere. Qui c'è tutto questo,
misurato a più semi. Nessun modello è stato chiamato e niente del gioco cambia.

```bash
npx vite-node lab/scripts/strutture-modulari-grandi.ts -- [--semi 6] [--foto] [--json lab/strutture-modulari/grande/misure.json]
```

Circa mezz'ora con 6 semi su una macchina carica di altri agenti (la via B col collaudo è la parte lunga); le foto vanno in `foto/`,
`misure.json` è la corsa di 6 semi con le foto.

## I file

| file | che cosa |
|---|---|
| `tasselli.ts` | il **set grande**: 50 tasselli in ognuno di tre stili nello spirito di `neapolis` (la **palazzina** di tufo intonacato d'ocra con le persiane verdi, le **case popolari** di cemento a vista tutte uguali coi nastri di finestre e i pannelli azzurri, la **villa** bianca col cotto, le pergole e il giardino), 151 con l'aria; scritti come modelli parametrici in TypeScript (nel gioco sarebbero programmi MarkovJunior, la regola 11) |
| `facce.ts` | le facce lette dai voxel come le leggerebbe il kernel (aria, muro, parapetto, passaggio dentro o fuori, porta; **dove sta il varco** lungo il lato; le etichette delle facce interne), le otto simmetrie di ogni tassello (le rotazioni e lo specchio, come il modello a tessere di MarkovJunior), il propagatore per `WfcSolver` costruito sulle chiavi delle facce, i controlli del set |
| `massa.ts` | la **massa come programma MarkovJunior dell'Architetto** (D3 B), compilato ed eseguito dal motore del gioco su una griglia di vani che il kernel prepara (le strade dei varchi, l'anello attorno): isolati a corte, palazzi di uno-quattro piani lungo le strade, un nucleo scala per palazzo, androni, portici, ponti |
| `via-a.ts` | la **via A**: il nodo `wfc` del motore costruito dal set (i motivi, il propagatore, le regole che dicono che cosa può stare su ogni lettera della massa), l'onda come la fa il motore (`viaA`, per tenere il motivo di ogni vano), il nodo nel motore vero dentro i tetti del mondo o no (`engineRun`, con il confronto voxel per voxel), quanto sarebbe lungo il tileset scritto a mano nel formato di MarkovJunior (`tilesetText`) |
| `via-b.ts` | la **via B**: il tessuto di base nuovo (i nuclei girati verso il piano, le stanze dove ci stanno e i corridoi dove servono, l'ingresso, la porta sul terrazzo, i tetti col parapetto verso l'aria) e il tessitore di T522 (angoli, bordi, interni dei luoghi; margini fissati al tessuto di base; il collaudo della regola 10 nella finestra di ogni regione, coi tetti o senza; la ricucitura dentro la regione) |
| `ricucitura.ts` | la **ricucitura dopo l'onda**: dove un vano da raggiungere non si raggiunge e uno raggiunto gli sta accanto, il kernel riveste i due vani con motivi che la loro lettera ammette, della stessa famiglia, che incontrano ancora tutti i vicini, non perdono nessun passaggio e hanno lì un varco (un angolo con la finestra diventa lo stesso angolo con la porta, un tetto perde un parapetto): il tessuto resta valido e ciò che era raggiunto resta raggiunto |
| `tetti-fuori.ts` | quali tetti restano fuori dopo la ricucitura, per piano, e che cosa hanno accanto (`npx vite-node lab/strutture-modulari/grande/tetti-fuori.ts -- [--semi 3]`) |
| `misure.ts` | le misure, uguali per le due vie: la regola 10 sul grafo dei tasselli (anche in una finestra, con le sorgenti che il cammino del kernel ha), le stanze (i vani di stanza che si toccano coi lati aperti: quante, quanti vani, quante con un quadrato di 2 × 2 vani), le coppie incompatibili, i tasselli usati e l'entropia, la distanza fra due tessuti, i voxel |
| `../../scripts/strutture-modulari-grandi.ts` | lo script: i set, le scale col cammino del kernel, la via A sui tre terreni, il motore nei tetti del mondo, la via A a otto semi, la via B nei suoi modi, la ricucitura, la varianza, il cammino del kernel contro il grafo, T522 per confronto, le foto |

## Il set

Il **vano** resta quello di T522: 2 × 2 caselle e un piano, 32 × 32 × 32 voxel a 16 per casella. Quello che cambia sono i tasselli e le regole con cui
le facce si incontrano:

- **le stanze sono di più vani**: una stanza è fatta di vani d'angolo (due muri), di lato (un muro) e di mezzo (nessun muro) i cui lati aperti si
  incontrano (le nove fette di un rettangolo); le pareti hanno finestre, balconi, logge, nicchie, porte, il portone;
- **i corridoi** hanno le estremità a porta (un varco di 12 voxel in mezzo al lato): un corridoio si apre in una stanza attraverso una porta e non
  si fonde con lei;
- **il nucleo scala a segmenti**: il pianterreno, un segmento per piano, il **torrino** che esce sul tetto; i segmenti si impilano a qualunque
  altezza (la faccia di sopra e di sotto è il «fusto», che solo un altro segmento dello stesso nucleo incontra); la porta è in mezzo al muro di
  testa del pianerottolo;
- **la scala interna** (la scala dritta di T522) e **la scala esterna**, all'aperto, dal cortile al tetto di un palazzo di un piano;
- **i tetti** col parapetto su qualunque dei loro lati e ciò che ci sta sopra (antenne, panni, cisterne, lucernari, pannelli, pergole, vasi,
  comignoli); **i ponti**; **i portici** coi pilastri e con gli archi; **strade, cortili, giardini** con lampioni, panchine, alberi, pozzi, fontane.

Per stile: 9 tasselli del suolo, 18 di stanza, 6 di corridoio, 2 scale, 3 segmenti di nucleo, 11 tetti, il ponte: 50. Con le simmetrie i
motivi sono 274-287 per stile, 835 nell'unione dei tre set (il mondo ne prende al più 1 024, `WORLD_NODE_LIMITS.patterns`).

### Le facce: che cosa cambia da T522

La lettura è quella di T522 (la fascia dei due strati esterni del vano e il primo dentro), con quattro differenze, ognuna trovata dalle misure:

1. **Un passaggio dice se il suo vano è dentro o fuori** (P dentro: stanze, corridoi, scale; P fuori: strade, cortili, portici, tetti, ponti).
   Dentro e fuori si incontrano solo attraverso una porta: una stanza ha sempre la sua facciata.
2. **Un pavimento aperto dentro incontra solo un pavimento aperto dentro o una porta; una porta incontra solo una porta o un passaggio fuori;
   un passaggio fuori finisce su un muro, mai su un parapetto né sull'aria.** Con le regole di T522 (un pavimento chiuso da qualunque muro, una porta
   davanti al lato aperto di una stanza) la WFC faceva stanze di un vano solo in un quarto dei casi; con queste **una stanza è chiusa dai suoi
   muri e dalle sue porte, quindi è di almeno 2 × 2 vani (4 × 4 caselle)**, e un tetto non è mai tagliato da un parapetto in mezzo.
3. **Dove sta il varco lungo il lato** (le colonne del passaggio più largo): due varchi si incontrano solo dove si sovrappongono per la larghezza
   di una porta (11 voxel). La prima versione del nucleo aveva la porta sul fianco del pianerottolo e le stanze in mezzo al lato: per le classi
   delle facce era una porta contro una porta, per il cammino del kernel un muro. Ora la classe lo sa, e tutte le porte del set stanno in mezzo.
4. **Un pavimento è qualcosa di pieno sotto i piedi**: una colonna d'aria non è un pavimento a quota 0 (T522 la leggeva così), tranne dove sotto
   c'è il vano dello stesso tassello (la cima della rampa di una scala).

## La massa, un programma dell'Architetto (D3 B)

`MASSING_XML` in `massa.ts` (una sessantina di righe, compilate da `compileMjx` ed eseguite da `runOn` sulla griglia che il kernel prepara): lungo
ogni strada un anello di palazzi profondo due vani, tagliato in palazzi di uno-quattro piani da semi lungo il fronte che crescono a turno; il cortile
in mezzo; un nucleo per palazzo di due piani o più, lungo una fila dell'anello con la porta verso il vano accanto (messo di traverso tagliava il
palazzo in due); un palazzo senza posto per il nucleo resta di un piano; un vano che al suo piano non tocca nessun altro vano diventa il tetto della
sua colonna; l'androne (due vani di portico dalla strada al cortile), qualche portico sulla strada, i ponti sulle strade al primo piano e fra due
tetti, solo dove ai loro fianchi c'è aria. Le stesse lettere servono alle due vie: la via A le dà alla sua `wfc` come regole, la via B le legge.

Tre terreni: il **lotto** di un luogo (5 × 5 vani, 10 × 10 caselle, col suo anello di cortile: 224 voxel di lato), il **lotto di un blocco di luoghi**
nei 500 voxel di oggi (13 × 13 vani col suo anello: 480 voxel, una croce di strade in mezzo), il **quartiere** di 3 × 3 luoghi (27 × 27 vani, le strade
dei varchi, un anello di strada: 928 voxel di lato, oltre i tetti di oggi, per confrontare le due vie sugli stessi luoghi).

## Le due vie e la ricucitura

- **Via A**: dopo la massa, una `wfc` a tessere sul motore del gioco, un'onda sola per tutto il terreno, fino a 100 tentativi da un seme (il tetto
  del mondo): la prima soluzione senza contraddizioni. Il nodo è quello del gioco (`WfcNode`, eseguito da `WfcRunner`); `viaA` rifà la stessa onda
  per tenere il motivo di ogni vano, e `engineRun` controlla che la griglia scritta dal motore sia la stessa.
- **Via B**: il tessitore di T522 sulle stesse massa e set, nei modi **base** (il tessuto di base da solo), **libera** (le regioni senza collaudo),
  **regola10** (una regione si prende solo se nella sua finestra si raggiungono le sue stanze, i corridoi, le scale e i nuclei; altrimenti un altro
  seme, poi la base), **regola10+tetti** (anche i tetti), **libera+ricucitura** (ogni regione ricucita dentro la sua finestra, sui soli vani suoi).
- **La ricucitura dopo l'onda** (`ricucitura.ts`): la «connessione dopo l'onda» che lo studio di T522 proponeva per M2, alla ModernHouse ma sui
  vani (un vano riveste con un motivo che incontra ancora i vicini e ha il varco); data dopo l'onda della via A (**A+ricucitura**) e dopo il tessuto della via B (**B regola10+tetti+ricucitura**, sul quartiere intero: non
  più uguale in ogni ordine, perché guarda i luoghi caricati insieme).

## Le misure (6 semi, `misure.json`)

Il **set**: per stile 51 tasselli con l'aria, 60 vani, 274-287 motivi con le simmetrie, 188-210 mila coppie nel propagatore, le facce lette in
0,3-0,4 s, nessun problema nei controlli; l'unione dei tre 835 motivi e 1,76 milioni di coppie. **Le scale col cammino del kernel** (ogni tassello di
più piani da solo, col tetto attorno al torrino): il nucleo di 2 e di 4 piani si sale fino al torrino (i piedi a 66 e a 130 voxel) e il cammino
esce sul tetto; la scala interna e quella esterna fino al piano di sopra (34).

Due corse, la seconda con la suite dei test in parallelo (i tempi sono delle due; i raggiunti uguali, tranne la ricucitura, corretta
fra le due: la prima copiava le altre facce e lasciava fuori metà dei tetti, § «Che cosa ha insegnato»). La via A sui tre stili (18 corse per riga), la via B sul quartiere («sopra» sono le stanze e i corridoi dei piani alti; «scale e nuclei» anche i
torrini; raggiunti sul grafo dei tasselli dalle strade e dall'anello attorno):

| via | terreno | corse | s | contraddizioni | pian terreno | piani alti | scale e nuclei | tetti | ponti | stanze con 2 × 2 vani | vani a stanza | tasselli usati | bit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | lotto | 18 | 0,2 | 1 tentativo | 85 % | 75 % | 94 % | 66 % | 90 % | 100 % | 7,3 | 30 di 50 | 4,08 |
| A + ricucitura | lotto | 18 | 0,2 | 1 tentativo | 100 % | 100 % | 100 % | 91 % | 90 % | 100 % | 7,5 | 30 di 50 | 4,09 |
| A | lotto di un blocco | 18 | 0,9-1,2 | 1-4 tentativi (media 1,6) | 97 % | 66 % | 94 % | 54 % | 61 % | 99,7 % | 7,1 | 46 di 50 | 4,80 |
| A + ricucitura | lotto di un blocco | 18 | 0,9-1,2 | 1-4 tentativi (media 1,6) | 100 % | 99 % | 100 % | 95 % | 85 % | 99,7 % | 7,6 | 46 di 50 | 4,79 |
| A | 3 × 3 luoghi | 18 | 4,8-6,9 | 2-45 tentativi (media 8) | 97 % | 68 % | 97 % | 47 % | 49 % | 99,5 % | 6,9 | 50 di 50 | 5,08 |
| A + ricucitura | 3 × 3 luoghi | 18 | 4,8-6,9 | 2-45 tentativi (media 8) | 100 % | 98 % | 100 % | 90 % | 83 % | 99,5 % | 7,5 | 49 di 50 | 5,06 |
| B, tessuto di base | 3 × 3 luoghi | 18 | 0,02 | — | 100 % | 100 % | 100 % | 89 % | 68 % | 100 % | 13,2 | 22 di 50 | 3,74 |
| B, regioni senza collaudo | 3 × 3 luoghi | 6 | 6,3-8,8 | 0/294 regioni alla base | 99 % | 74 % | 100 % | 56 % | 41 % | 100 % | 7,7 | 49 di 50 | 5,10 |
| B, regioni ricucite nella finestra | 3 × 3 luoghi | 6 | 6,3-9,5 | 0/294 | 99 % | 75 % | 100 % | 59 % | 44 % | 100 % | 7,9 | 48 di 50 | 5,09 |
| B, collaudo delle stanze | 3 × 3 luoghi | 6 | 9,8-14,9 | 3/294, 374 semi | 100 % | 74 % | 100 % | 59 % | 45 % | 100 % | 8,0 | 49 di 50 | 5,10 |
| B, collaudo coi tetti | 3 × 3 luoghi | 18 | 19,3-21,9 | 51/882, 1 726 semi | 98 % | 77 % | 98 % | 65 % | 56 % | 100 % | 8,5 | 48 di 50 | 5,06 |
| B, collaudo coi tetti, poi ricucitura sul quartiere | 3 × 3 luoghi | 18 | 19,3-21,9 | 51/882 | 100 % | 100 % | 100 % | 91 % | 73 % | 100 % | 9,1 | 48 di 50 | 5,04 |

Nessuna corsa ha una coppia di vani incompatibili. La via B col collaudo coi tetti è uguale nell'altro ordine dei luoghi in 6 corse su 6
(la palazzina); con la ricucitura sul quartiere intero non lo è più per costruzione. Le stanze senza un quadrato di 2 × 2 vani (lo 0,3-0,5 %)
sono uno o due vani aperti sull'imbocco di una scala interna, che fanno da pianerottolo. La ricucitura riveste 0-180 vani per corsa (in media 5 sul lotto, 32 sul lotto di un blocco, 142 sui 3 × 3 luoghi) in 0-36 ms.

Per stile, sui 3 × 3 luoghi (6 semi ciascuno; i tempi delle due corse, la seconda con la suite dei test in parallelo):

| via | stile | pian terreno | piani alti | scale | tetti | contraddizioni | s | tasselli | bit |
|---|---|---|---|---|---|---|---|---|---|
| A | palazzina | 97 % | 72 % | 99 % | 48 % | 2-12 tentativi | 4,1 | 49,8 | 5,07 |
| A + ricucitura | palazzina | 100 % | 98 % | 100 % | 89 % | | 4,1 | 49,5 | 5,05 |
| A | popolare | 98 % | 67 % | 96 % | 46 % | 2-12 tentativi | 4,5-7,4 | 49,3 | 5,08 |
| A + ricucitura | popolare | 100 % | 98 % | 100 % | 89 % | | 4,6-7,4 | 49,2 | 5,07 |
| A | villa | 97 % | 64 % | 94 % | 46 % | 4-45 tentativi | 5,7-9,1 | 49,5 | 5,09 |
| A + ricucitura | villa | 100 % | 99 % | 100 % | 92 % | | 5,7-9,2 | 49,0 | 5,07 |
| B, collaudo coi tetti | palazzina | 99 % | 81 % | 99 % | 66 % | 17/294 regioni alla base | 18,5-26,6 | 47,8 | 5,04 |
| B, + ricucitura | palazzina | 100 % | 100 % | 100 % | 91 % | | 18,6-26,6 | 47,8 | 5,02 |
| B, collaudo coi tetti | popolare | 98 % | 75 % | 97 % | 60 % | 18/294 | 20,2-20,4 | 47,8 | 5,05 |
| B, + ricucitura | popolare | 100 % | 100 % | 100 % | 91 % | | 20,2-20,4 | 47,8 | 5,03 |
| B, collaudo coi tetti | villa | 99 % | 75 % | 99 % | 69 % | 16/294 | 18,9-19,0 | 47,3 | 5,09 |
| B, + ricucitura | villa | 100 % | 100 % | 100 % | 91 % | | 19,0 | 47,3 | 5,07 |

**Il motore del gioco** (`engineRun`: il nodo eseguito da `runOn`, la griglia confrontata con quella del laboratorio su un campione di voxel di
ogni vano, la diagonale e due facce):

| set | terreno | voxel di lato | motivi | tetti | esito | ms nel motore |
|---|---|---|---|---|---|---|
| palazzina | lotto | 224 | 274 | del mondo | fatto, 8,0 milioni di voxel, la stessa griglia | 1 227-2 070 |
| palazzina | lotto di un blocco | 480 | 274 | del mondo | fatto, 36,9 milioni di voxel, la stessa griglia | 1 886-3 455 |
| popolare | lotto di un blocco | 480 | 287 | del mondo | fatto, la stessa griglia | 2 005-3 656 |
| villa | lotto di un blocco | 480 | 276 | del mondo | fatto, la stessa griglia | 2 021-3 839 |
| palazzina | 3 × 3 luoghi | 928 | 274 | del mondo | rifiutato: «la griglia nuova (928×928×160) supera i limiti» | — |
| palazzina | 3 × 3 luoghi | 928 | 274 | del laboratorio | fatto, 137,8 milioni di voxel, la stessa griglia | 4 738-7 935 |
| unione dei tre | lotto di un blocco | 480 | 835 | del mondo | nella prima corsa fatto, la stessa griglia (l'onda 30,5 MB su 32, 8,1 s, 3 tentativi); nella seconda, con la suite dei test in parallelo, l'onda passa i 10 s di un nodo (13 s) e il motore la ferma | 11 959 |

**La via A che sceglie il suo seme** (la massa del blocco al seme 1, otto semi dell'onda; vani coperti raggiunti, senza ricucitura): la
palazzina 66-98 %, le case popolari 72-82 %, la villa 76-84 %; nessun seme raggiunge tutto. Scegliere il seme non basta: serve la ricucitura.

**Il tileset di MarkovJunior scritto a mano** (`tilesetText`): per stile 60 tessere da 32 768 caratteri e 11 778-13 138 righe di vicini, 2,6-2,7
milioni di caratteri; l'unione 11,3 milioni. Un file di `models/` ne tiene 100 000, un programma ne legge 200 000.

**La varianza** (`variance` in `misure.json`; distanze da 0, uguali, a 1, niente in comune):

| | come si usano i tasselli (i tipi, senza lo stile) | i colori |
|---|---|---|
| fra due semi dello stesso set (la massa cambia col seme) | 0,10 (A e B) | 0,02-0,04 |
| fra i tre set sulla stessa massa | 0,10-0,11 | 0,90-0,92 |

e **la sola onda** (la stessa massa, sei semi dell'onda): la via A cambia il tassello o la simmetria dell'85 % dei vani, la via B del 69 % (le
regioni che cadono sulla base). Un seme cambia la pianta e l'onda; un set cambia l'aspetto quasi del tutto, ma non la pianta, perché qui i tre set
hanno la stessa massa: **ogni set vorrà la sua massa** (le case popolari a stecche, la villa nel giardino). **T522** sullo stesso quartiere
col collaudo usa 23 dei suoi 25 tasselli, 3,7-3,8 bit; il set grande 46-50 tasselli per stile, circa 5 bit.

**Il cammino del kernel contro il grafo** (luogo di mezzo e un vano attorno, 352 × 352 × 160 voxel, il grafo con le sorgenti che il cammino ha:
i bordi a terra della finestra che danno fuori): la via A 78 vani raggiunti da tutti e due, 1 solo dal grafo (la cima di una scala esterna);
la via A ricucita 104 e lo stesso 1; la via B col collaudo coi tetti 103 e nessuna differenza. 1-1,3 s a cammino.

## Le foto

| | |
|---|---|
| `foto/accanto-a-t522.png` | lo stesso seme accanto: il quartiere di T522 col collaudo, la via A, la via B col collaudo coi tetti (3 × 3 luoghi, a metà dei voxel) |
| `foto/via-a-quartiere.png`, `foto/via-a-ricucita-quartiere.png` | la via A prima e dopo la ricucitura (le porte nuove sono poche e piccole: a quella scala quasi non si vedono) |
| `foto/via-b-quartiere.png`, `foto/tessuto-di-base.png` | la via B col collaudo coi tetti; il tessuto di base da solo, monotono |
| `foto/via-a-blocco.png` | il lotto di un blocco nei 480 voxel di oggi, a tutti i voxel, da due lati: i palazzi a corte, i torrini, le scale esterne nell'anello |
| `foto/via-b-luogo-di-mezzo.png` | il luogo di mezzo della via B, a tutti i voxel, da due lati |
| `foto/via-a-popolare-villa.png`, `foto/via-b-popolare-villa.png` | gli altri due stili sulla stessa massa |
| `foto/catalogo-palazzina.png`, `foto/catalogo-popolare.png`, `foto/catalogo-villa.png` | i 50 tasselli di ogni stile |

## Che cosa ha insegnato, in ordine

1. **Con le regole di T522 la WFC fa stanze di un vano** (un quarto delle stanze): una porta davanti al lato aperto di una stanza la chiude, e un
   pavimento si chiude contro il muro di chiunque. Con «un pavimento dentro incontra solo un pavimento dentro o una porta; una porta solo una porta
   o l'esterno» una stanza è chiusa dai suoi muri e dalle sue porte: di almeno 2 × 2 vani, per costruzione.
2. **Un tetto tagliato in mezzo da un parapetto** è un tetto che non si attraversa: il parapetto guarda solo l'aria (un pavimento fuori finisce
   solo su un muro).
3. **Una colonna d'aria non è un pavimento a quota 0** (la lettura di T522 la prendeva per tale); ma la cima di una rampa è davvero il
   pavimento del vano di sopra: a quota 0 conta ciò che il tassello ha sotto.
4. **Due facce «porta» possono non essere un varco**: il nucleo con la porta sul fianco del pianerottolo contro una stanza con la porta in
   mezzo al lato; per le classi un passaggio, per il cammino del kernel un muro. La faccia dice dove sta il varco, e tutte le porte del set
   stanno in mezzo.
5. **Un nucleo di traverso nell'anello di un palazzo lo taglia in due** e la sua porta ne serve un lato: lungo l'anello, con la porta in testa al
   pianerottolo, l'altra fila gli passa dietro.
6. **Un palazzo che a un piano si riduce al nucleo e a un vano** lascia un vano con quattro muri, che nessun tassello veste e nessuno
   raggiunge: la massa lo fa tetto della sua colonna. E due ponti messi nello stesso passo uno di traverso all'altro non si incontrano: la massa
   toglie i ponti che si toccano.
7. **La ricucitura non deve copiare le altre facce**: togliere un parapetto o un muro sposta i varchi dei lati accanto (la sua fine sta nei loro
   angoli), e una variante con le altre facce identiche quasi non esiste: la prima versione lasciava fuori metà dei tetti. Si cerca un motivo che
   incontri ancora i vicini e non perda nessun passaggio.
8. **Il collaudo di una regione è ottimista**: conta raggiunto il bordo della sua finestra, e non alza i piani alti sopra la WFC libera. La
   ricucitura sì, ma dove vede l'intero: il complesso della via A, o il quartiere intero della via B (che allora non è più uguale in ogni ordine);
   dentro la finestra di una regione non serve, per la stessa ragione del collaudo.
9. **Le contraddizioni dell'onda unica crescono con la misura**: sul lotto mai, sul lotto di un blocco 1-4 tentativi, sul quartiere fino a 45.
   La via A sta sul lotto e sul blocco.
10. **Due cose di MarkovJunior che l'Architetto dovrà sapere**: un `prl` con `p` senza `steps="1"` converte tutto (ripete finché trova); un'unione
   non sta nell'uscita di una regola, e il suo simbolo non dev'essere una lettera dei `values`.

## Che cosa non fa

I tasselli sono funzioni TypeScript e non programmi MarkovJunior, e non variano per seme; il formato del set coi tasselli-programmi (D2 di
T543) è descritto, non scritto: il nodo `wfc` lo costruisce il laboratorio. Il terreno è in piano. Niente è nel kernel, nel renderer o sul
filo: la ricucitura, i motivi consegnati dal motore, il rendering a istanze e i tetti raggiunti nel gioco sono stimati. Il cammino del kernel
gira sul luogo di mezzo, non su un complesso intero. I tempi sono di una macchina carica di altri agenti.
