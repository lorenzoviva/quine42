# Le strutture modulari e «seamless»: tasselli tessuti a WFC sopra i luoghi, sostituzione e sovraimpressione, i pianeti (T522)

Data: 2026-11-27 · Richiesta: l'autore, 26/11 ([`docs/userchats/to-do-2026-11-26.md`](../userchats/to-do-2026-11-26.md), «Le strutture
seamless»: le villette di `neapolis`, parallelepipedi con note brutaliste, piccole e singole; comporle in strutture più grandi e complesse,
applicate all'universo come sostituzioni o in sovraimpressione; [marian42](https://marian42.de/article/infinite-wfc/) e i pianeti a WFC) ·
Nasce da T458 (le parti del mondo, [`scultori-specializzati.md`](scultori-specializzati.md) § 4), T472 (ADR-0243), ADR-0206 e ADR-0208 (il lotto
di più luoghi), ADR-0174 e ADR-0176 (`wfc` nel motore e nel mondo), T500 ([`markov-allineamento.md`](markov-allineamento.md): la `wfc` che
diverge apposta) · Prototipo: [`lab/strutture-modulari/`](../../lab/strutture-modulari/README.md), `npx vite-node lab/scripts/strutture-modulari.ts` ·
**Seconda prova (T543, 27/11)**: [`lab/strutture-modulari/grande/`](../../lab/strutture-modulari/grande/README.md),
`npx vite-node lab/scripts/strutture-modulari-grandi.ts`; il riquadro qui sotto, il § 10.2 e la catena nuova nel § 11. **Terza prova (T557,
27/11)**: [`lab/strutture-modulari/estratti/`](../../lab/strutture-modulari/estratti/README.md), `npx vite-node lab/scripts/strutture-modulari-estratte.ts`;
il primo riquadro, il § 12 e la catena ripianificata nel § 11.

Niente codice del gioco: lo studio dice che cosa servirebbe, perché, quanto costa e in che ordine; ogni fatto sul kernel di oggi (0.10.x) è
letto nel codice, col file. Il codice nuovo sta solo in `lab/`: un set di tasselli nello stile delle palazzine di `neapolis`, la lettura delle
loro facce dai voxel, il tessuto a WFC sopra 3 × 3 luoghi e le sue misure. **Nessun modello è stato chiamato** e nessun file del gioco è
cambiato.

**I nomi** (ADR-0117: «modulo», «blocco», «pezzo», «composizione», «cella» e «prefabbricato» sono già presi): un **tassello** è il mattone del
tessuto, un programma della grandezza di uno o più **vani** (il vano: 2 × 2 caselle e un piano); il **set di tasselli** è ciò che lo Scultore
scrive una volta per stile; il **tessuto** è ciò che il kernel compone coi tasselli sopra i luoghi; la **massa** è lo scheletro che lo precede
(quanti piani ha ogni colonna, dove salgono le scale); il **tessuto di base** è la massa vestita senza onda, valido per costruzione. In inglese
nel codice: `Brick`, `BrickSet`, `Bay`, `Fabric`, `Massing`, `baseFabric` (§ 13).

## Dopo la terza prova (T557, 27/11)

L'autore ha risposto a D/T543 il 27/11 (A a D1, D2, D4, D5; D3 così; D6 A senza la «serie»; D7 A, ma i set crescono a mondo acceso e un pianeta
ha più tipi di edificio) correggendo la seconda prova in sei punti: un set è **un modello, un programma MarkovJunior**; **solo la parte
edilizia**; **una cinquantina di tasselli per edificio**; i tasselli **si estraggono dai modelli statici** che il Concilio ha scritto usando
MarkovJunior come un CAD; **la massa è parte del modello**; **la ricucitura è in MarkovJunior**, nel modello, e cambia col seme; e in posti come
`mesa` **taverne di al più tre piani**, con una massa e un set loro. La terza prova (§ 12, [`lab/strutture-modulari/estratti/`](../../lab/strutture-modulari/estratti/README.md))
fa tutto questo, senza chiamate. In breve:

1. **Due set estratti** da due modelli statici sul disco: la «Palazzina di tufo (grande)» di `neapolis` (Opus 5.5, 4 semi) dà **49 tasselli**, la
   «Locanda del Cinghiale» di `mesa` (la taverna che il Far West indossa, 3 semi) **65**. L'estrattore taglia il modello nei vani di T522/T543
   (32 voxel, il solaio in fondo a ogni vano), toglie antenne, panni, botti, panche e comignoli, legge le facce dai voxel e unisce in un tassello
   di più vani ciò che una scala attraversa.
2. **Ogni set è un programma solo** (`programmi/neapolis.xml`, 19 mila caratteri; `programmi/mesa.xml`, 25 mila): la **massa** (palazzine sole di
   2 × 2 a 4 × 4 vani, da uno a tre piani; per `mesa` piccoli edifici sul fronte della strada maestra, uno-due piani e a volte tre, lotti vuoti),
   l'**onda** sulle firme del set, la **ricucitura scritta in MarkovJunior** (porte, rampe interne e **scale esterne** aperte una alla volta a caso,
   finché niente si raggiunge più), la **vestizione** (una `map`) e i **voxel**. Gira sul motore del gioco **dentro i tetti del mondo**, su un lotto
   e sul lotto di un blocco (480 voxel di lato) in **0,35-0,7 s**, la ricucitura in 2-6 ms.
3. **La regola 10**: la ricucitura MJ porta il **pian terreno al 100 %** (l'onda sola 45-82 %) e i **piani alti all'85-93 %** (l'onda sola 0-13 %);
   quella del kernel di T543 sulla stessa onda non apre quasi niente (con i tasselli estratti non c'è un vano diverso con un passaggio in più:
   ricucire vuol dire scolpire). Il **cammino del kernel** sui voxel conferma il grafo in `neapolis` (142 vani su 143); in `mesa` 8 vani su 76
   sono raggiunti solo sul grafo, oltre una rampa interna.
4. **Quello che costa**: il taglio a vani regolari attraversa i ritmi della sorgente (le finestre ogni 10 voxel, i vani ogni 32), quindi le facce
   reggono solo come pieno o vuoto in blocchi di 8 voxel (qualche finestra tagliata a metà); una scala in un angolo rende unica la facciata che
   tocca (serve la copia della sorgente senza scale); 255 simboli in un programma bastano solo senza le quattro rotazioni; la locanda (pianta a
   L, falde a più altezze) si ricompone meno della palazzina e 3 semi su 8 del suo blocco l'onda li rifiuta (da collaudare).
5. **La catena** (§ 11) è ripianificata: l'estrattore nel kernel, il complesso dell'Architetto con la ricucitura MJ generata dal set, i set che
   crescono a mondo acceso (uno all'arrivo su un pianeta, poi altri, più tipi di edificio per pianeta), le masse per ambientazione, niente serie
   allo stesso seme; le domande in [`docs/pipeline/domande/T557.md`](../pipeline/domande/T557.md).

## Dopo la seconda prova (T543, 27/11)

L'autore ha risposto a D/T522 il 27/11 (la via A attesa migliore, stanze più grandi, la massa dell'Architetto, i tetti raggiungibili, tanti set
per universo e per pianeta) e ha chiesto una seconda prova con un set grande prima di implementare. La prova è nel § 10.2, la catena nuova nel
§ 11, le domande in [`docs/pipeline/domande/T543.md`](../pipeline/domande/T543.md). In breve:

1. **Un set grande**: 151 tasselli in tre stili di `neapolis` (palazzina, case popolari, villa), 274-287 motivi per stile con le simmetrie; la
   massa come **programma MarkovJunior dell'Architetto**, eseguito dal motore del gioco (D3 B).
2. **La via A funziona oggi nel motore e nei tetti del mondo**, su un lotto e sul lotto di un blocco di luoghi (480 voxel di lato): l'onda del
   blocco in circa un secondo, poche contraddizioni (1-4 tentativi), quasi tutto il set usato (circa 5 bit contro i 3,7 di T522). Il quartiere di
   3 × 3 luoghi no: la via A è un complesso per lotto o per blocco.
3. **Stanze di almeno 2 × 2 vani (4 × 4 caselle) per costruzione**, da una regola delle facce (un pavimento dentro incontra solo un pavimento
   dentro o una porta; una porta solo una porta o l'esterno) e porte sempre allineate (la faccia dice dove sta il varco).
4. **Il WFC da solo non fa la regola 10 nemmeno con il set grande** (i piani alti al 66-75 %), ma **la ricucitura dopo l'onda sì**: il kernel
   trasforma un muro in porta dove una stanza non si raggiunge, rivestendo i due vani con motivi che incontrano ancora i vicini; pian terreno e scale al 100 %, piani alti
   al 98-100 %, tetti al 90-95 %, in pochi millisecondi.
5. **La via B** (il tessitore sopra i luoghi) è senza cuciture e uguale in ogni ordine, ma il suo collaudo per regione è ottimista (piani alti
   74-81 %) e costa 6-22 s ogni 3 × 3 luoghi; con la ricucitura sul quartiere intero arriva dove la A ricucita (100 % dei piani alti, 91 % dei
   tetti), ma non è più uguale in ogni ordine.
6. **La via raccomandata è la A** (gira oggi, costa un quinto a luogo, la stessa varietà e, ricucita, la stessa regola 10 della B, il modello «un
   set, un modello, tante strutture»), con
   tre cose del kernel: il set di tasselli-programmi con le facce lette dal kernel (il tileset di
   MarkovJunior scritto a mano sarebbe 2,6 milioni di caratteri per stile), la ricucitura dopo l'onda, i semi collaudati. La B è rimandata a
   quando serviranno quartieri senza cuciture o la sovraimpressione. La catena scende dal 46 % al 34 % (§ 11).

Il testo dal § 1 al § 9 è quello di T522 (la via B), con le note della seconda prova dove cambia qualcosa.

## In breve (la prima prova, T522)

1. **Si può fare, e il risolutore c'è già.** Quello della `wfc` di MarkovJunior (`WfcSolver` in `src/mj/wfc.ts`, ADR-0174) prende così com'è un
   set di tasselli: i motivi (ogni vano di un tassello con le sue rotazioni), i pesi, il propagatore, i divieti iniziali, i tentativi da un
   seme. Il prototipo tesse 3 × 3 luoghi di `neapolis` (27 × 27 vani, 5 piani) in circa 3 s in Node (15 s col collaudo della regola 10), **senza
   mai un bordo che non combacia fra due luoghi e con lo stesso risultato in qualunque ordine i luoghi entrino nel mondo** (su ogni seme).
2. **Le facce non si dichiarano: il kernel le legge dai voxel.** Una faccia di un vano è aria, muro, parapetto, passaggio (alla sua quota) o
   porta; due vani possono stare accanto secondo una tabella del kernel che è la regola 10 in piccolo (una porta non dà mai sul vuoto né su un
   muro, un pavimento non finisce nell'aria). Le facce interne di un tassello di più vani (una scala, un nucleo) incontrano solo la loro
   compagna. È ciò che marian42 scrive a mano coi suoi connettori, fatto dal kernel: lo Scultore non può dichiarare una porta che non c'è.
3. **Il WFC da solo non rispetta la regola 10.** Senza uno scheletro, le stanze ai piani alti raggiunte da una strada sono l'**1-2 %**: il WFC
   vede solo coppie di vani, la raggiungibilità è globale. È il limite noto (ModernHouse di MarkovJunior rimedia con `path` dopo la sua
   `wfc`; marian42 lo dà come il motivo per cui il suo WFC infinito di allora «non è adatto a un gioco commerciale»).
4. **La ricetta che regge** (misurata): (a) **la massa prima** — quanti piani ha ogni colonna, i cortili, i nuclei scala, i ponti: deterministici
   dal seme, mai lasciati al WFC; (b) **un tessuto di base** valido ovunque, la massa vestita senza onda dal kernel; (c) **il WFC a pezzi come
   modifica del tessuto di base** — angoli, poi bordi, poi interni dei luoghi, ognuno coi margini fissati al tessuto di base e accettato solo se
   tutte le sue stanze restano raggiungibili, altrimenti resta il tessuto di base. È il metodo di Boris the Brave («modifying in blocks») e di
   marian42 2023, posato sulla griglia dei luoghi come oggi i varchi. Risultato: **0 coppie di vani incompatibili, 0 regioni perse, stesso
   risultato in ogni ordine; stanze raggiunte il 92 % a terra e l'83 % in alto** (il tessuto di base da solo il 99 %).
5. **Le trappole trovate**: un tassello con due capi che vogliono un seguito (il ponte) fa catene senza fine su una fila di vani bassi — il
   «tunnel infinito» di marian42: i ponti li deve dichiarare la massa; due bordi che immaginano in due modi lo stesso vano dell'interno rompono
   l'interno (coi margini liberi il 14 % delle regioni resta senza soluzione e un quartiere ha centinaia di coppie incompatibili): i margini
   vanno fissati al tessuto di base; una porta d'angolo è chirale (le sole rotazioni non bastano); una scala si prova col cammino del kernel,
   non con le facce (la chiocciola in 2 × 2 caselle non si sale; il pianerottolo dev'essere più profondo dell'impronta del corpo; sotto la prima
   rampa ci vuole pieno).
6. **Il costo in chiamate è quello di un set, una volta**: uno Scultore che scrive 15-25 tasselli piccoli costa quanto una o due strutture di
   oggi (0,3-1,5 $), poi **zero** per ogni luogo tessuto: il tessuto è del kernel, dal seme. In memoria un luogo tessuto è un indice di motivo
   per vano (810 byte), a schermo una mesh per motivo ripetuta a istanze, come i modelli dei terreni (`InstancedMesh` in `src/render/terrain.ts`).
7. **Sostituzione e sovraimpressione sono la stessa macchina** con vincoli diversi: sostituzione = il tessuto prende i lotti (o il lotto di un
   blocco di luoghi, ADR-0206/0208) al posto delle strutture di oggi; sovraimpressione = le case che ci sono restano vani fissi e il tessuto
   cresce attorno e sopra (sopraelevazioni, portici sulle strade, ponti), con le strade che a terra restano strade. Il prototipo fa le due.
8. **I pianeti**: nel nostro gioco un pianeta è una fascia dello stesso piano (ADR-0236), quindi il tessuto vale lì com'è; servono set per
   pianeta (colonie, stazioni del vuoto) e, per il globo da lontano, la massa (funzione pura del seme) dipinta nei livelli di dettaglio. Il
   terreno dei pianeti a WFC non lo consiglio ora: il rilievo vero e la rete della regola 10 (ADR-0250, ADR-0256) fanno già quel lavoro.
9. **Otto task** (§ 11, M1-M8, circa il 46 % della scala più una prova pagata), da approvare; **sette domande** in
   [`docs/pipeline/domande/T522.md`](../pipeline/domande/T522.md), ognuna col consiglio.

## 1. Che cosa chiede l'autore, nel gioco

Le «villette» di `neapolis` sono le case comuni del mondo (`commonHouse` del manifest di `world.terrain`: «una palazzina di tufo intonacata di
ocra, con balconi di ferro, persiane verdi e tetto piano con le antenne»): due voci della libreria, `casa-comune-structure-f2e1f8de` (la Grande,
riscolpita da Opus 5.5, 100 × 100 × 80 voxel a 16 per casella, 6,25 caselle di lato) e `casa-comune-building-…` (la piccola, 25 × 25 × 24 a 8).
Ogni lotto senza una struttura chiesta veste la casa comune della sua classe a un seme suo (`lotsOf` in `src/kernel/kernel.ts`): da qui la
città di parallelepipedi singoli. La Grande (seme 1, viste in testo): un corpo di circa 84 × 82 voxel, due piani e il parapetto, finestre con le
persiane, balconi, il portone in mezzo al fronte, le antenne sul tetto.

Comporre questi blocchi è, in architettura, ciò che il brutalismo ha fatto con le cellule prefabbricate: Habitat 67 (354 cellule uguali
impilate sfalsate, i tetti di sotto come terrazze di sopra), le Vele di Scampia (a Napoli: corpi a gradoni coi ballatoi), il Corviale. Nel gioco
vuol dire due cose, che l'autore nomina:

- **sostituzione**: dove oggi ci sarebbero più villette singole (più lotti, o i luoghi di un blocco), c'è un complesso unico di tasselli;
- **sovraimpressione**: le villette restano, e sopra e attorno a loro cresce il tessuto: piani aggiunti (le sopraelevazioni, molto
  napoletane), portici sulle strade, ponti e ballatoi fra una casa e l'altra.

E «seamless» vuol dire che il tessuto non si ferma al bordo di un luogo: continua nel luogo accanto senza cuciture, in qualunque ordine i luoghi
entrino nel mondo.

## 2. Che cosa insegnano i riferimenti

Letti per questo studio (26-27/11); il post di r/Unity3D non si è potuto leggere (Reddit rifiuta i lettori automatici).

| | che cosa fa | che cosa prendiamo |
|---|---|---|
| marian42, [2019](https://marian42.de/article/wfc/) (la demo [su itch](https://marian42.itch.io/wfc), sorgente MIT) | ~100 moduli fatti a mano; ogni faccia ha un connettore (un numero, più «girato / non girato / simmetrico» sui lati, l'indice di rotazione o «invariante» sopra e sotto); i vicini si ricavano dai connettori, più regole di esclusione; aria in cima, pieno in fondo; il mondo cresce attorno al giocatore con un **backtracking** che a volte torna molto indietro e rigenera anche dove sta il giocatore; **il risultato dipende dall'ordine in cui si esplora**; avverte del «tunnel infinito» (un pezzo dritto senza un pezzo che lo chiuda) | le facce come connettori ricavati, non come elenchi di vicini; aria e pieno ai bordi verticali; la trappola delle catene |
| marian42, [2023](https://marian42.de/article/infinite-wfc/) | rinuncia al backtracking: una mappa periodica 8 × 8 × 8 fatta prima, delle «toppe» fatte prima per i bordi, poi ogni pezzo del mondo rigenerato sfasato di 4 blocchi a partire dalle toppe che tocca, **scelte a caso ma in modo deterministico**: ogni pezzo si genera da solo, in parallelo, sempre uguale; **se fallisce resta la toppa**; i biomi variando i pesi dei moduli per regione; il terreno come mappa di altezze a gradini di ±1 con toppe per forma | l'indipendenza dall'ordine, il «resta la toppa» (il nostro tessuto di base), i pesi per regione |
| Boris the Brave, [Infinite Modifying in Blocks](https://www.boristhebrave.com/2021/11/08/infinite-modifying-in-blocks/) | da una soluzione di sfondo, strati di blocchi sfalsati del 50 %: ogni blocco dipende da due dello strato prima, 12 in tutto, quindi **una funzione pura del seme e della posizione**; circa 4 volte il lavoro; un blocco che fallisce lascia lo strato di prima; ciò che è più grande di un blocco non si rappresenta | il principio: sempre una soluzione valida, modificata a pezzi in un ordine fisso di strati |
| MarkovJunior: Apartemazements, ModernHouse, SeaVilla (nel laboratorio, ADR-0174) | la `wfc` a tessere su una griglia grossa che le regole hanno disegnato (la massa), poi altre regole sul risultato; ModernHouse dopo la sua seconda `wfc` ricollega con `path` «le porte che possono essere state chiuse» | la massa prima e il dettaglio dopo; la connessione è un passo a sé |
| [PlanetSmith](https://planetsmith.world/) | un gioco (sandbox su pianeti sferici interi, «costruzioni a blocchi esagonali»); la pagina non dice come genera, né se usa il WFC | niente di tecnico |
| [r/Unity3D, pianeti esplorabili](https://www.reddit.com/r/Unity3D/comments/1w1kgup/im_trying_to_generate_entire_explorable_planets/) | non letto (Reddit rifiuta) | — |

## 3. Che cosa c'è già nel gioco

- **La `wfc` nel motore e nel mondo** (ADR-0174, ADR-0176): tessere da un tileset di `models/` (`<tileset>` con `<tiles>` e `<neighbors>`), le
  rotazioni, il propagatore, l'onda, fino a `tries` tentativi da un seme; nel mondo dentro tetti stretti (`WORLD_NODE_LIMITS` in
  `src/kernel/validator.ts`: 32 768 celle d'onda, 1 024 motivi, 100 tentativi scritti, 32 MB) e un tileset si valida da solo (`tilesetErrors`,
  al più `MAX_RULE_FILE` 100 000 caratteri). Un programma dello Scultore può già usare un tileset di `models/` (`libraryResources` lo elenca
  nella richiesta), ma nessun universo ne ha. L'allineamento A1 (T500, T525-T539) porta la `wfc` all'originale (A1-5) e i suoi modelli come
  esempi (A1-11, T536).
- **Le parti del mondo** (ADR-0239 punto 9, ADR-0241, ADR-0243): programmi `models/part-*.xml` di un mestiere, con un contratto e un nome dal
  testo, verificati dal kernel (la stessa griglia su ogni seme), una carta ciascuna, che viaggiano con chi le include. Un set di tasselli è una
  parte del mondo di un tipo nuovo: non si include con `<import>`, si tesse.
- **Il lotto di più luoghi** (ADR-0206, ADR-0208): un blocco di 2 × 2 o 3 × 3 luoghi con un lotto nel mezzo, gli altri luoghi col piano del
  kernel senza chiamate, caricati insieme, la regola 10 sull'anello. È il posto naturale della prima sostituzione.
- **I bordi fra luoghi si decidono prima, da un hash** (`src/kernel/layout.ts`: «deterministic gates on every edge … both sides agree: same edge,
  same hash», l'anello di bordo congelato; `blockGates`, `gateEdgeLevel`): lo stesso principio del tessuto a pezzi.
- **Le strutture del mondo riusate a un seme nuovo** (ADR-0247): un concetto, molti edifici. Il tessuto è il passo dopo: molti tasselli, un
  complesso.
- **Le forme condivise e le istanze**: due entità con la stessa forma hanno la stessa mesh (la chiave della forma, ADR-0108,
  `src/render/forms.ts`); i modelli dei terreni di un luogo sono già `InstancedMesh`, uno per geometria (`chunkView` in `src/render/terrain.ts`).
- **La regola 10 dentro le strutture** si misura col cammino del corpo sui voxel (`walkIn`, `reachableStoreys` in `src/kernel/forms.ts`,
  `roomsReached` in `src/kernel/interior.ts`): lo stesso che il prototipo usa per controllare il grafo dei tasselli.

## 4. I tasselli come parti del mondo

### 4.1 Il tassello e il vano

**Il vano** è 2 × 2 caselle e un piano: 32 × 32 × 32 voxel a 16 per casella (`STRUCTURE_VPT`), il solaio a z 0-1, i muri di 2 dentro il vano,
un piano di 32 da pavimento a pavimento (le `PARTS` dell'Architetto: porta 11 × 30, piano 30 di luce). Un luogo di 18 caselle è 9 × 9 vani; la
villetta Grande (6,25 caselle) ne occupa circa 3 × 3. Più piccolo (1 casella) vorrebbe quattro volte i vani e tasselli che non contengono una
stanza (1,75 caselle di lato al minimo); più grande (3 × 3 caselle) farebbe un vano per stanza, ma la massa a gradini di sei caselle.

**Un tassello** è uno o più vani (una stanza d'angolo è 1 × 1 × 1, la scala dritta 1 × 2 × 2, il nucleo 1 × 2 × h). Nel gioco ogni tassello è
un programma MarkovJunior (regola 11) con la scatola dei suoi vani; il set dice il peso di ognuno e se la sua cima vuole un soffitto (una
stanza) o resta aperta (un tetto, una strada). Il kernel taglia un tassello di più vani e dà alle sue facce interne un'etichetta che incontra
solo la compagna (marian42: «tagliare il blocco grande in blocchi di 1 × 1 × 1 con connettori che non si usano altrove»).

**Le varianti per seme**: un tassello può variare col seme (le finestre, le antenne, i panni stesi) solo se le sue facce restano le stesse su
ogni seme che il mondo gli dà, controllate come le parti del mondo controllano la stessa griglia (`sameGridErrors`, ADR-0243): è il «modelli
variabili, riutilizzati cambiando il seme» del to-do dello stesso giorno.

### 4.2 Le facce lette dai voxel

(La seconda prova ha aggiunto quattro regole a questa tabella: dentro e fuori, il pavimento dentro che incontra solo un pavimento dentro o una
porta, la porta che incontra solo una porta o l'esterno, dove sta il varco lungo il lato; § 10.2.)

Il prototipo (`lab/strutture-modulari/facce.ts`) legge ogni faccia laterale sulla fascia dei due strati esterni del vano più il primo dentro:

| classe | quando | si accosta a |
|---|---|---|
| **A** aria | niente di pieno nella fascia | A, W, R |
| **W** muro | niente passaggio, pieno sopra 10 voxel | A, W, R, P (un muro chiude il pavimento accanto) |
| **R** parapetto | niente passaggio, niente di pieno sopra 10 voxel (un parapetto, una ringhiera, la loggia) | A, W, R, P |
| **P**(h) passaggio | una fila di almeno 11 colonne (la porta) col pavimento entro un gradino (3) dentro il vano e 26 voxel liberi sopra (il corpo è alto 24) | W, R, P e D entro un gradino |
| **D**(h) porta | un passaggio con un muro attorno (più del 30 % della fascia sopra il pavimento) | P e D entro un gradino |
| **L** etichetta | faccia interna di un tassello di più vani | la stessa etichetta |

Sopra e sotto: il fondo è un solaio (F) o aperto (O); la cima di una stanza vuole un solaio sopra, quella di un tetto o della strada no. La
tabella è la regola 10 in piccolo: una porta non dà mai sull'aria, su un muro o su un parapetto; un pavimento non finisce nell'aria; due
passaggi si incontrano solo entro un gradino (`STEP`, ADR-0250). **Il primo strato dentro** serve a non leggere un parapetto o una ringhiera
come un pavimento rialzato: è stato il primo errore del prototipo.

Le facce dei tasselli del prototipo, come il kernel le legge (+x +y −x −y, sopra, sotto):

```
strada             P1 P1 P1 P1 open F        tetto              P2 P2 P2 P2 open F
aria               A A A A open O            tetto-bordo        P2 P2 P2 R open F
portico            P1 P1 P1 P1 needs F       tetto-angolo       R P2 P2 R open F
sala               P2 P2 P2 P2 needs F       ponte              P2 R P2 R open F
stanza-muro        P2 P2 P2 W needs F        tetto-testa        R R P2 R open F
stanza-angolo      W P2 P2 W needs F         scala 0,0,0        W L W P3 L F   (si entra da −y)
stanza-corridoio   P2 W P2 W needs F         scala 0,1,0        W W W L L F
stanza-testa       W W P2 W needs F          scala 0,0,1        W L W W needs L
porta-muro         P2 P2 P2 D2 needs F       scala 0,1,1        W P2 W L needs L   (si esce a +y, un piano sopra)
porta-angolo       W P2 P2 D2 needs F        nucleo-2 0,0,0     D2 L W W L O   (la porta sul pianerottolo)
porta-angolo-sp.   P2 P2 W D2 needs F        nucleo-2 0,1,0     W W W L L O
porta-testa        W W P2 D2 needs F         nucleo-2 0,0,1     D2 L W W needs L
villetta           W W W D2 needs F          nucleo-2 0,1,1     W W W L needs L
loggia             P2 P2 P2 R needs F        (nucleo-3 e nucleo-4 uguali, con un piano o due in più)
cemento-muro       P2 P2 P2 W needs F        tetto-isola        R R R R open F
```

### 4.3 I controlli di un set

Ciò che il kernel chiede a un set prima di prenderlo (nel prototipo i primi tre nel codice, il quarto e il quinto nelle misure):

1. **ogni motivo ha un vicino in ogni direzione** (altrimenti non si posa mai);
2. **ogni passaggio si chiude** con un vano solo che chiude il resto (un passaggio senza una «testa» è il tunnel infinito);
3. **le chiralità**: il kernel gira i tasselli e non li specchia (i tasselli di più vani non lo permettono); un tassello chirale (una porta
   d'angolo) vuole la sua immagine allo specchio nel set, o il kernel la genera (MarkovJunior genera le otto simmetrie di una tessera,
   `squareSymmetries`); il prototipo ha dovuto aggiungere `porta-angolo-specchio`;
4. **il tessuto di base esiste**: per una massa di prova il kernel sa vestirla senza onda (§ 5.2); se il set non ha i vani che servono (una
   stanza con un muro, con due, la porta su una strada…) non passa; nel prototipo l'ha trovato la sovraimpressione: una villetta in piedi in un
   cortile alza da sola la sua colonna, e il suo tetto vuole il parapetto su quattro lati (`tetto-isola`, aggiunto);
5. **le scale si salgono col cammino del kernel** (`walkIn`), da sole e nel tessuto: le facce dicono dove si entra, non se si sale. Il prototipo
   ha trovato tre modi di sbagliare una scala che le facce non vedono (§ 7.3).

### 4.4 Chi lo scrive, la carta, il viaggio

Lo Scultore, una volta per set: un mestiere suo o una sezione dell'Architetto (D6), che riceve il concetto e lo stile del mondo, il vano, la
tabella delle facce, le misure del corpo e una massa di prova, e risponde coi programmi dei tasselli; il kernel legge le facce, fa i controlli
del § 4.3, tesse una massa di prova e la cammina; ciò che non passa torna col motivo (come oggi `checkProgram`). Il set è una carta del mondo
(come una parte, ADR-0243), del pagante della chiamata; i luoghi tessuti sono i suoi utilizzi; viaggia con le carte portate tutto intero o per
niente. Un set per stile e per epoca: `neapolis` ne avrebbe uno brutalista e uno di tufo, un mondo romano alla marian42 il suo.

## 5. Il tessuto

### 5.1 La massa prima

Il WFC vede coppie di vani; la raggiungibilità, i ponti, le scale, i cortili sono globali. La massa li decide prima, deterministica dal seme e
dalla posizione, e il WFC la veste:

- **le altezze**: quanti piani di stanze ha ogni colonna (0 una strada o un cortile), a blocchi di 2 × 2 vani nel prototipo (4 × 4 caselle);
- **i nuclei**: una torre scala (1 × 2 vani, due rampe a piano) in ogni blocco di due piani o più, con i suoi due vani detti dalla massa
  (lasciati al WFC, due metà di due nuclei si accoppiavano attraverso i blocchi, e un bordo poi non si chiudeva più);
- **i ponti, i portici, le strade**: dove la massa li vuole (nel prototipo le strade sono la croce di mezzo di ogni luogo, sui varchi; i ponti
  lasciati al WFC sono stati tolti, § 7.2).

Chi decide la massa era una domanda (D3): il kernel dal seme coi parametri che il Cartografo sceglie per il quartiere, un programma MarkovJunior
della massa (la «composizione» dell'Architetto, a scala di quartiere), o il master con una sua regione. L'autore ha scelto il programma
(27/11); la seconda prova ne ha scritto uno che il motore esegue (§ 10.2).

### 5.2 Il tessuto di base

La massa vestita senza onda (`baseFabric` in `lab/strutture-modulari/tessuto.ts`): in ogni colonna le stanze proseguono nel vicino che ha una
stanza a quel piano (un edificio solo per tutto il lotto) e hanno la facciata verso chi è più basso; al piano terra la porta sul primo lato che
dà su una strada o un cortile; il nucleo con la porta verso il suo blocco; il tetto prosegue nei tetti della sua altezza, col parapetto verso il
resto; sopra, il cielo. È valido per costruzione (0 coppie incompatibili) e raggiunge il 99 % delle stanze e dei nuclei. È monotono (sempre le
stesse stanze d'angolo), ma è la rete di sicurezza.

### 5.3 Il WFC a pezzi

Ogni luogo è 9 × 9 vani; le regioni, ognuna funzione pura del seme del mondo, della sua posizione e delle regioni da cui dipende:

1. **gli angoli**: i 2 × 2 vani attorno al punto dove si toccano quattro luoghi;
2. **i bordi**: le due file di vani lungo il lato fra due luoghi, fra due angoli (fissi ai capi);
3. **l'interno di un luogo**: 7 × 7 vani col suo anello di bordi e angoli fisso.

Angoli e bordi guardano un vano dentro i luoghi attorno (il **margine**), **fissato al tessuto di base**: ciò che scrivono incontra sempre ciò che
ci sarà se le regioni dopo falliscono. Ogni regione è un'onda del `WfcSolver` coi divieti della massa e dell'anello, provata da un seme suo
(`hash32(seme, tipo, i, j, tentativo)`, fino a 9 semi di 50 tentativi); se non trova una soluzione, o se la soluzione lascia una stanza della
regione irraggiungibile nella sua finestra (dalle strade o dal bordo della finestra), **resta il tessuto di base**. Così:

- il risultato non dipende dall'ordine in cui i luoghi entrano nel mondo (un luogo chiede i suoi angoli e i suoi bordi, ognuno una volta);
- due luoghi accanto combaciano per costruzione (il bordo è uno solo);
- l'insieme è sempre valido: il tessuto di base lo è, e ogni modifica lo resta.

È «modifying in blocks» di Boris the Brave con tre strati (angoli, bordi, interni) invece di quattro, sulla griglia dei luoghi come i varchi. Il
prezzo: le regioni sono più vincolate (il margine è il tessuto di base) e il collaudo della regola 10 scarta molti semi.

### 5.4 Dove gira e che cosa si salva

Nel kernel che pianifica il luogo (il server in molti), quando il luogo entra in raggio (ADR-0245), come oggi il layout: angoli e bordi si
calcolano una volta e si tengono finché un luogo che li usa è caricato. Il risultato è una funzione pura e non va salvato, come le rampe
(`Chunk.ramps`); conviene però scrivere nel piano l'indice dei motivi (810 byte a luogo), perché un kernel nuovo non cambi un luogo già visto
(come `PlanStructure.seed`, ADR-0247). Ai client sottili va il piano coi motivi, non le forme: ogni client fa le mesh dei tasselli una volta.

## 6. Sostituzione e sovraimpressione

| | sostituzione | sovraimpressione |
|---|---|---|
| che cosa resta | niente di ciò che c'era: il tessuto prende i lotti (o il lotto di un blocco di luoghi) | le strutture che ci sono, come vani fissi |
| i vincoli | la massa, le strade e i varchi del luogo | in più le case in piedi (vani fissi coi loro muri e il tetto), le loro porte mai chiuse, le strade a terra solo strada o portico |
| che cosa aggiunge | un complesso al posto delle villette | piani sopra (le sopraelevazioni), portici e ponti sulle strade, logge, terrazze |
| nel prototipo | i 3 × 3 luoghi con la massa | sulla massa, col tessuto di base e il collaudo: 37 villette in piedi (una ogni tanto sui lotti lungo le strade), tenute tutte, 21 con una stanza sopra; stanze raggiunte il 92 % a terra e il 75 % in alto (seme 1) |
| dove prima | sul lotto di un blocco di luoghi (ADR-0206/0208): luoghi ancora bozze, il piano del kernel, niente da rompere | su luoghi già pianificati, dopo la sostituzione |

**Le tre scale del tessuto** (la stessa macchina):

1. **un lotto**: un complesso al posto di una struttura, nelle sue 7-10 caselle. Lo può già fare l'Architetto dentro un suo programma, con una
   `wfc` su un tileset grosso (la via di Apartemazements), e gli esempi di MarkovJunior di A1-11 (T536) gliela insegnano: **non serve un task a
   sé**; dopo la seconda prova è la via raccomandata, col set di tasselli-programmi, la ricucitura e i semi collaudati (§ 10.2, § 11);
2. **un blocco di luoghi** (2 × 2, 3 × 3): il lotto grande di ADR-0206/0208 tessuto invece di scolpito: il primo passo della via del kernel;
3. **un quartiere** (una regione dell'atlante, del Cartografo o del master): il tessuto «infinito» a pezzi, attraverso i luoghi.

**I tasselli nel mondo**: un vano tessuto non è un'entità per vano (405 a luogo): il kernel tiene per ogni luogo l'indice dei motivi e risponde
alle domande dello spazio (`free`, `floorAt`, `structureAt`, il passo del server) guardando la forma del tassello in quel vano, già nella cache
delle forme (una per motivo e per seme). Il renderer disegna una `InstancedMesh` per motivo, come i modelli dei terreni.

## 7. La regola 10 e le porte

### 7.1 Che cosa ha misurato il prototipo

Sul quartiere di 3 × 3 luoghi (27 × 27 vani, 5 piani, 6 semi, i 25 tasselli del prototipo), i vani «coperti» (stanze, scale, nuclei) raggiunti dalle strade sul grafo dei
tasselli:

| | stanze a terra | stanze sopra | scale e nuclei | regioni senza soluzione | coppie incompatibili | s per 3 × 3 luoghi |
|---|---|---|---|---|---|---|
| WFC libero | 84 % | 1 % | 24 % | 0 su 294 | 0 | 2,9 |
| massa e nuclei, margini liberi | 71 % | 68 % | 80 % | 40 su 294 | 3 102 | 8,8 |
| massa, nuclei e tessuto di base | 59 % | 42 % | 53 % | 0 su 294 | 0 | 2,8 |
| **massa, nuclei, tessuto di base e collaudo della regola 10** | **92 %** | **83 %** | **86 %** | 74 su 294 (resta la base) | **0** | 15,5 |
| il tessuto di base da solo (seme 1) | 99 % | 99 % | 99 % | — | 0 | — |

(I numeri di ogni seme nel [README del prototipo](../../lab/strutture-modulari/README.md); i tempi sono di una macchina carica di altri agenti.)
Ciò che resta irraggiungibile col collaudo viene dalla finestra: una regione accetta una stanza che raggiunge il bordo della sua finestra, e il
bordo non sempre porta fuori.

**Il grafo dei tasselli contro il cammino del kernel** (`walkIn` sui voxel del luogo di mezzo e di un vano attorno, 352 × 352 × 160 voxel, 1-3
s): sul tessuto col collaudo i due concordano su 139 vani, il grafo ne dà 15 in più e il cammino 5. Le differenze stanno sul bordo della finestra
del cammino (vie che passano fuori dalla finestra, che il grafo vede e il cammino no; la terra fuori dalla finestra, che il cammino prende per
aperta e da cui entra in un nucleo che nel quartiere dà su un cortile chiuso) e nel vano in cima alla tromba di un nucleo, che a quel piano non
ha pavimento. Il grafo è il controllo veloce, il cammino quello vero, come oggi nei controlli dello Scultore: nel gioco il cammino girerebbe sul
luogo intero coi vicini caricati.

### 7.2 Le porte e le catene

- **Le porte** sono facce D: la tabella vieta una porta sull'aria, su un muro, su un parapetto. Una porta a terra dà su una strada o un cortile
  (P1, un voxel sotto il pavimento della stanza, P2).
- **I ponti** (`ponte`: un tetto coi parapetti sui fianchi e i capi aperti): un ponte sopra un vano basso vuole un passaggio a tutti e due i
  capi, e su una fila di vani bassi diventa una catena che nessuna regione chiude. È il tunnel infinito di marian42; la cura è la sua (nessun
  tassello che obblighi a continuare senza uno che chiuda) più la nostra: i ponti li dichiara la massa.
- **Le strade restano strade**: sui vani di strada al piano terra solo `strada` o `portico` (il portico ha un soffitto: chi sta sopra lo copre);
  sopra una strada il cielo, o un ponte dichiarato.

### 7.3 Le scale (che cosa le facce non vedono)

Tre modi in cui una scala sbaglia per il cammino del kernel e non per le facce, trovati nel prototipo:

1. **la chiocciola in 2 × 2 caselle** (un giro a piano attorno a un pilastro): sotto l'impronta del corpo (9 colonne, `BODY_R` 0,22) la rampa
   sale più di un gradino e `rampBlocks` la ferma; la scala dritta (1 × 2 vani, un voxel ogni due) si sale;
2. **il pianerottolo di mezzo profondo 8**: l'impronta è di 9 voxel, il corpo non gira attorno al muro fra le rampe; a 12 sì;
3. **la prima rampa sospesa sul terreno**: sotto resta un «pavimento» con pochi voxel di luce, e `levelAt` a parità di distanza sceglie quello;
   piena sotto, si sale.

Il nucleo buono (due rampe a piano, la porta sul pianerottolo) si sale fino all'ultimo piano col cammino del kernel. Lo Scultore dei tasselli
avrà bisogno di questi tre fatti nel suo prompt, e il kernel del controllo del § 4.3, punto 5.

## 8. Il costo

**Le chiamate**: una volta per set. Un set di 15-25 tasselli piccoli (32 × 32 × 32 voxel l'uno, poche decine di righe di programma) costa allo
Scultore quanto una o due strutture di oggi: Argon 0,27-0,35 $ a chiamata (ADR-0247), Opus 5.5 circa 0,75 $ a struttura riuscita (T392), con una
revisione; stima **0,3-1,5 $ a set**, una volta per stile. Poi **zero**: ogni luogo tessuto è il kernel che gira. Rispetto a oggi è un
risparmio: un quartiere di villette singole chiede al Cartografo una struttura per lotto e allo Scultore un concetto nuovo ogni tanto (2 l'ora,
ADR-0247); un quartiere tessuto, nessuno.

**Il calcolatore** (prototipo, Node, una macchina carica):

| | tempo | note |
|---|---|---|
| leggere le facce di 25 tasselli (153 motivi, 76 118 coppie nel propagatore) | 0,2-0,3 s | una volta per set |
| un angolo / un bordo / un interno | 3 / 15 / 70 ms col WFC libero; 30 / 160-250 / 1 150 ms con la massa e il collaudo | un luogo = un interno, più metà dei suoi bordi e un quarto dei suoi angoli |
| 3 × 3 luoghi col tessuto di base | 2,8-4,6 s | 49 regioni |
| 3 × 3 luoghi col collaudo della regola 10 | 15-23 s (secondo il carico) | il collaudo scarta semi: da ridurre (M2) |
| il cammino del kernel su un luogo e un vano attorno (20 milioni di voxel) | 1-3 s | il controllo finale |

Un luogo tessuto costa quindi 0,3-3 s di kernel quando entra in raggio, a turni nel ciclo come oggi i programmi delle forme (`TurnRunner`) o in
un worker. Il collaudo del prototipo è ingenuo (rifà l'onda intera a ogni seme scartato): un'onda che conosce i passaggi (il vincolo di
connessione di DeBroglie, o il `path` di ModernHouse dopo l'onda) lo porterebbe vicino al tempo senza collaudo.

**La memoria e lo schermo**: un luogo tessuto è 405 indici (810 byte); 220-395 vani non vuoti di 48-83 motivi diversi (col collaudo, seme 1: 221 di 61 motivi di 19 tasselli). Le forme sono una per
motivo (32 768 celle, qualche decina di millisecondi), nella cache; a schermo una `InstancedMesh` per motivo: decine di draw call per luogo
invece di una mesh di 13 milioni di voxel.

## 9. I pianeti

Un pianeta, nel nostro gioco, è una fascia lontana dello stesso piano (ADR-0236): la sua terra è del generatore attorno al suo centro, il suo
rilievo è `BandedRelief`, e da lontano il globo è disegnato a sedici livelli di dettaglio precalcolati (`PlanetLod`, la proiezione azimutale).
Quindi:

- **il tessuto vale sui pianeti com'è**: niente sfera da cucire, niente esagoni; i luoghi di un pianeta sono luoghi;
- **i set per pianeta**: una colonia, una stazione del vuoto (ADR-0233: oggi una superellisse di pavimento) tessute di tasselli (corridoi,
  cupole, moli d'attracco: la stazione è il caso più naturale di un set);
- **da lontano**: la massa è una funzione pura del seme e della posizione, quindi i livelli grossi del globo possono dipingerla (le celle alte
  dove ci sono i complessi) senza tessere niente;
- **il terreno dei pianeti a WFC** (tasselli di terreno alla marian42 2023, a gradini di ±1): non lo consiglio ora. Il rilievo vero (ADR-0256),
  la rete della regola 10 coi gradini (ADR-0250) e i livelli di dettaglio fanno già quel lavoro, e un terreno a tasselli dovrebbe accordarsi con
  tutti e tre a ogni livello.

PlanetSmith dice «blocchi esagonali» e il post di r/Unity3D non si è letto: nessuno dei due cambia questa conclusione.

## 10. I prototipi

### 10.1 La prima prova (T522)

[`lab/strutture-modulari/`](../../lab/strutture-modulari/README.md): `tasselli.ts` (il set, scritto a mano come lo scriverebbe lo Scultore, coi
colori della palazzina di tufo e un cemento a vista), `facce.ts` (la lettura delle facce, i motivi, il propagatore per `WfcSolver`, i controlli
del set), `tessuto.ts` (la massa, il tessuto di base, le regioni, il collaudo, il grafo della regola 10, i voxel); lo script
`lab/scripts/strutture-modulari.ts` fa le misure e le foto (`--foto`, in `lab/strutture-modulari/foto/`). I tasselli sono funzioni TypeScript, non
programmi MarkovJunior: il prototipo misura il tessuto, non il disegno. Nessun modello è stato chiamato.

### 10.2 La seconda prova (T543): il set grande, la via A contro la B

Le risposte del 27/11 a D/T522 chiedevano di rifare la prova con un set grande (marian42 ne ha circa 144), di mettere la via A (il complesso in un
programma MarkovJunior dell'Architetto, come Apartemazements) contro la via B (il tessitore di T522), con stanze più grandi di 2 × 2 caselle, la
massa scritta dall'Architetto come programma (D3 B) e i tetti che si possono raggiungere. Il laboratorio è
[`lab/strutture-modulari/grande/`](../../lab/strutture-modulari/grande/README.md), lo script `lab/scripts/strutture-modulari-grandi.ts`; le misure
qui sono la corsa di 6 semi in `misure.json`. Nessun modello è stato chiamato e nessun file del gioco è cambiato.

**Che cosa c'è.**

- **Il set grande**: 151 tasselli, 50 in ognuno di tre stili di `neapolis` (la palazzina di tufo intonacato, le case popolari di cemento a vista
  tutte uguali, la villa bianca col cotto e le pergole) più l'aria: per stile 9 del suolo (strade, cortili, giardini, portici), 18 di stanza (le
  nove fette di una stanza con finestre, balconi, logge, nicchie, porte, il portone), 6 di corridoio, la scala interna e quella esterna, il nucleo
  scala in tre segmenti (il pianterreno, un piano, il **torrino** che esce sul tetto: si impilano a qualunque altezza), 11 tetti (il parapetto su
  qualunque lato, antenne, panni, cisterne, lucernari, pergole, comignoli), il ponte. Con le otto simmetrie sono **274-287 motivi per stile**,
  **835 nell'unione** dei tre (il mondo ne prende al più 1 024). Il vano resta quello di T522 (D2: 2 × 2 caselle e un piano).
- **Le facce, con quattro regole nuove** (ognuna trovata dalle misure; il § 4.2 resta la lettura di T522): un passaggio dice se il suo vano è
  dentro o fuori, e dentro e fuori si incontrano solo per una porta; **un pavimento aperto dentro incontra solo un pavimento aperto dentro o una
  porta, una porta solo una porta o l'esterno, un pavimento fuori finisce solo su un muro**; un passaggio dice dove sta lungo il lato, e due
  passaggi si incontrano solo dove si sovrappongono per una porta; un pavimento è qualcosa di pieno sotto i piedi. Con la seconda regola **una stanza
  è chiusa dai suoi muri e dalle sue porte, quindi è di almeno 2 × 2 vani (4 × 4 caselle)**: è la risposta 2 dell'autore resa una proprietà della
  tabella, senza contare le stanze. Con la terza la prima versione del nucleo, porta sul fianco del pianerottolo, è risultata un muro per il
  cammino del kernel e una porta per le classi di T522: ora la classe lo sa.
  La tabella della seconda prova (`lab/strutture-modulari/grande/facce.ts`, `sidesMeet` e `stacks`):

  | classe | si accosta a |
  |---|---|
  | **A** aria | A, W, R |
  | **W** muro | A, W, R, P fuori (una strada o un terrazzo finisce su una facciata) |
  | **R** parapetto | A, W, R (verso l'aria; mai in mezzo a un tetto) |
  | **P** dentro (quota, varco) | P dentro e D, entro un gradino e coi varchi sovrapposti per una porta |
  | **P** fuori (quota, varco) | P fuori, D e W, entro un gradino e coi varchi sovrapposti |
  | **D** porta (quota, varco) | D e P fuori, entro un gradino e coi varchi sovrapposti |
  | **L** etichetta | la stessa etichetta (le facce interne di un tassello; il «fusto» di un nucleo, che solo il fusto dello stesso nucleo incontra) |

  Sopra e sotto: una cima che vuole il solaio (una stanza, un portico) vuole sopra un fondo pieno; sopra una cima aperta (un tetto, una strada,
  un cortile) solo un fondo aperto, l'aria, o un solaio che scavalca (un ponte).
- **La massa come programma dell'Architetto** (D3 B): una sessantina di righe di MarkovJunior (`lab/strutture-modulari/grande/massa.ts`), compilate
  ed eseguite dal motore del gioco su una griglia di vani che il kernel prepara con le strade dei varchi: isolati a corte coi palazzi di uno-quattro
  piani lungo le strade, un nucleo per palazzo lungo l'anello, l'androne, portici, ponti sulle strade e fra i tetti. Serve alle due vie.
- **La via A**: dopo la massa una `wfc` a tessere, un'onda sola, fino a 100 tentativi (il tetto del mondo). Il nodo è quello del gioco (`WfcNode`,
  `WfcRunner`), costruito dal set come lo farebbe il compilatore da un set di tasselli-programmi.
- **La via B**: il tessitore di T522 (angoli, bordi e interni dei luoghi, margini sul tessuto di base, collaudo della regola 10 nella finestra
  di ogni regione) con un tessuto di base nuovo (stanze dove ci stanno, corridoi dove servono, i nuclei girati verso il piano, il torrino verso il
  tetto: valido e raggiunto per costruzione).
- **La ricucitura dopo l'onda** (`ricucitura.ts`): dove un vano da raggiungere non si raggiunge e uno raggiunto gli sta accanto, il kernel
  riveste i due vani con motivi che la loro lettera della massa ammette, della stessa famiglia, che incontrano ancora tutti i vicini, non perdono
  nessun passaggio e hanno lì un varco (un angolo con la finestra diventa lo stesso angolo con la porta, un tetto perde un parapetto). È la
  «connessione dopo l'onda» di ModernHouse fatta sui vani: il tessuto resta valido e ciò che era raggiunto resta raggiunto.

**Le misure** (6 semi; la via A sui tre stili, 18 corse per riga; la via B sul quartiere; «sopra» sono le stanze e i corridoi dei piani alti,
«scale» i nuclei, i torrini e le scale; raggiunti sul grafo dei tasselli, che sul luogo di mezzo concorda col cammino del kernel):

| via | terreno | s | contraddizioni | pian terreno | piani alti | scale e nuclei | tetti | stanze con 2 × 2 vani | tasselli usati | bit |
|---|---|---|---|---|---|---|---|---|---|---|
| A | lotto | 0,2 | 1 tentativo | 85 % | 75 % | 94 % | 66 % | 100 % | 30 di 50 | 4,1 |
| **A + ricucitura** | lotto | 0,2 | 1 tentativo | **100 %** | **100 %** | **100 %** | **91 %** | 100 % | 30 di 50 | 4,1 |
| A | lotto di un blocco | 0,9-1,2 | 1-4 tentativi | 97 % | 66 % | 94 % | 54 % | 99,7 % | 46 di 50 | 4,8 |
| **A + ricucitura** | lotto di un blocco | 0,9-1,2 | 1-4 tentativi | **100 %** | **99 %** | **100 %** | **95 %** | 99,7 % | 46 di 50 | 4,8 |
| A | 3 × 3 luoghi | 4,8-6,9 | 2-45 tentativi | 97 % | 68 % | 97 % | 47 % | 99,5 % | 50 di 50 | 5,1 |
| **A + ricucitura** | 3 × 3 luoghi | 4,8-6,9 | 2-45 tentativi | **100 %** | **98 %** | **100 %** | **90 %** | 99,5 % | 49 di 50 | 5,1 |
| B, tessuto di base | 3 × 3 luoghi | 0,02 | — | 100 % | 100 % | 100 % | 89 % | 100 % | 22 di 50 | 3,7 |
| B, regioni senza collaudo | 3 × 3 luoghi | 6,3-8,8 | 0 regioni alla base | 99 % | 74 % | 100 % | 56 % | 100 % | 49 di 50 | 5,1 |
| B, collaudo delle stanze | 3 × 3 luoghi | 9,8-14,9 | 3/294 regioni alla base | 100 % | 74 % | 100 % | 59 % | 100 % | 49 di 50 | 5,1 |
| B, collaudo coi tetti | 3 × 3 luoghi | 19-22 | 51/882 regioni alla base | 98 % | 77 % | 98 % | 65 % | 100 % | 48 di 50 | 5,1 |
| B, collaudo coi tetti, poi ricucitura sul quartiere | 3 × 3 luoghi | 19-22 | 51/882 | 100 % | 100 % | 100 % | 91 % | 100 % | 48 di 50 | 5,0 |

(Le righe della via A sono 18 corse, 6 semi per 3 stili; la B 6 corse della palazzina, 18 dove i tre stili ci sono tutti. I tempi sono di due
corse, la seconda con la suite dei test in parallelo; i raggiunti sono uguali nelle due, tranne la ricucitura, corretta fra le due (il README dice
come). Nessuna corsa ha una coppia di vani incompatibili; la via B col collaudo è uguale nell'altro ordine dei luoghi in 6 su 6. Le stanze senza un quadrato di 2 × 2 vani
sono uno o due vani aperti sull'imbocco di una scala interna. Ogni numero, e ogni stile, nel
[README](../../lab/strutture-modulari/grande/README.md); T522, sullo stesso quartiere col suo collaudo, usava 23 dei suoi 25 tasselli, 3,7 bit.)

**Nei tetti del mondo.** Il motore del gioco esegue la via A dentro `WORLD_NODE_LIMITS` e `FORM_LIMITS` e scrive la griglia che il laboratorio ha
trovato (controllata su un campione di voxel di ogni vano: la diagonale e due facce):

| set | terreno | voxel di lato | motivi | tetti | esito |
|---|---|---|---|---|---|
| un set (palazzina) | lotto | 224 | 274 | del mondo | fatto in 1,2-2,1 s, 8 milioni di voxel |
| un set (ognuno dei tre) | lotto di un blocco | 480 | 274-287 | del mondo | fatto in 1,9-3,8 s, 36,9 milioni di voxel |
| l'unione dei tre | lotto di un blocco | 480 | 835 | del mondo | nella prima corsa fatto in 12 s (l'onda 30,5 MB su 32, 8 s, 3 tentativi); nella seconda, su una macchina più carica, l'onda passa i 10 s di un nodo e il motore la ferma |
| un set | 3 × 3 luoghi | 928 | 274 | del mondo | rifiutato: «la griglia nuova (928×928×160) supera i limiti» |
| un set | 3 × 3 luoghi | 928 | 274 | del laboratorio | fatto in 4,7-7,9 s, 138 milioni di voxel |

**Che cosa servirebbe allargare per la via A**:

1. **Il formato del set** (l'unico tetto che la via A rompe davvero): scritto come tileset di MarkovJunior (le tessere come testo, un carattere a
   voxel, e i vicini una riga per coppia) un set di uno stile è **2,6 milioni di caratteri** (60 tessere da 33 000 e circa 12 000 righe di vicini),
   l'unione 11,3 milioni, contro i 100 000 di un file di `models/` (`MAX_RULE_FILE`) e i 200 000 che un programma può leggere
   (`WORLD_NODE_LIMITS.fileChars`); e un vicino scritto a mano può mentire, una faccia letta dal kernel no. Il set va scritto **coi tasselli come
   programmi e le facce lette dal kernel** (D2): il file del set è una riga per tassello e il propagatore si costruisce dalle chiavi delle facce in
   0,3-0,4 s per stile (1 s per l'unione). Quanto il compilatore di oggi impiegherebbe a leggere un tileset così, con le sue righe di vicini, non
   è misurato.
2. **I motivi e l'onda**: un set per modello sta largo (280 motivi su 1 024, 10-12 MB d'onda su 32); l'unione dei tre set sul lotto di un blocco
   sta al limite (835 motivi, 30,5 MB) e passa a 5 piani: un modello di più set o di più piani vorrebbe `waveBytes` più grande (D5).
3. **Il tempo**: un set sul lotto di un blocco fa l'onda in circa un secondo, il motore la scrive in due-quattro; l'unione in 8-13 s, oltre gli
   8 s del validatore (serve il `tempo` della voce, fino a 30 s) e proprio sui 10 s che `WFC_LIMITS.ms` dà a un nodo: su una macchina carica
   li passa e il motore la ferma.
4. **La griglia**: il lotto di un blocco coi suoi 5 piani è 480 × 480 × 160 = 36,9 milioni di voxel, sotto i 40 di `FORM_LIMITS` ma di poco; un
   sesto piano non ci sta. Il quartiere di 3 × 3 luoghi (928 voxel di lato) il motore lo rifiuta: la via A è un complesso per lotto o per blocco.
5. **I vani del motore**: la ricucitura e il rendering a istanze vogliono sapere quale motivo sta in ogni vano; oggi la `wfc` scrive i voxel e
   basta: il motore deve consegnare i motivi accanto alla griglia (M2).

**La varianza** (in `misure.json → variance`): fra due semi dello stesso set (la massa cambia col seme) l'uso dei tipi di tassello dista 0,10 e i colori 0,02-0,04 (da 0,
uguali, a 1, niente in comune); fra i tre set sulla stessa massa i tipi 0,10 e i colori 0,90-0,92; la sola onda, a massa fissa, cambia il
tassello o la simmetria dell'85 % dei vani nella via A, del 69 % nella B. Un seme cambia la pianta e il dettaglio, un set l'aspetto: ma qui i tre
set hanno la stessa massa, e la pianta resta. **Ogni set vorrà la sua massa** (le case popolari a stecche, la villa nel giardino): è ciò che
rende diverso un quartiere da un altro oltre ai colori.

**Le contraddizioni.** L'onda unica non torna indietro: dopo una contraddizione ricomincia da capo (i «tentativi»). Sul lotto mai (un tentativo
in ognuna delle 18 corse), sul lotto di un blocco 1-4, sul quartiere 2-45 (la villa la più difficile): la via A sta sotto i 100 tentativi del mondo, e il lotto di un
blocco è la sua misura. La via B non ne ha bisogno: una regione che non trova una soluzione in 50 tentativi passa a un altro seme, poi alla base.

**Il cammino del kernel** contro il grafo, sul luogo di mezzo e un vano attorno (352 × 352 × 160 voxel, il grafo con le sorgenti che il cammino
ha, i bordi a terra della finestra): la via A 78 vani raggiunti dai due e 1 solo dal grafo (la cima di una scala esterna), la via A ricucita
104 e lo stesso 1, la via B col collaudo 103 e nessuna differenza; un cammino 1-1,3 s. Il grafo è il controllo veloce, il cammino quello vero, e qui dicono la stessa cosa.

**La via B, il suo collaudo e la ricucitura.** Il collaudo di una regione guarda la sua finestra e conta raggiunto il bordo della finestra: una
stanza che tocca il bordo passa anche se dal bordo non si va da nessuna parte (lo diceva già il § 14 di T522). Il collaudo delle sole stanze non
alza i piani alti sopra la WFC libera (74 % e 74 %); con i tetti nel collaudo si arriva al 77 % (81 % la palazzina), scartando più semi e
lasciando più regioni alla base. La ricucitura dentro la finestra di ogni regione non serve, per la stessa ragione. Data sul quartiere intero
porta la via B al 100 % dei piani alti e al 91 % dei tetti, **quanto la via A ricucita** (98 % e 90 % sugli stessi luoghi). Ma allora il risultato
dipende da quali luoghi sono caricati insieme e non è più uguale in ogni ordine, e la via B costa quattro volte il tempo. Il tessuto di base da solo raggiunge tutto, ma usa
22 tasselli su 50.

**La via raccomandata: la A, con tre cose del kernel.** La via A è quella che l'autore si aspettava, e la prova la sostiene per quattro ragioni
(sulla regola 10, dopo la ricucitura, le due vie si equivalgono): **gira oggi** nel motore e nei tetti del mondo per un lotto
o il lotto di un blocco, senza la macchina nuova del tessitore (regioni, tessuto di base, margini); **costa meno**: l'onda del lotto di un blocco,
circa due luoghi, in un secondo, contro i due secondi e più a luogo della B col collaudo; ha **la stessa varietà** (46-50 tasselli su 50, circa
5 bit, la B 48 e 5); e **il modello è quello delle risposte**: un set dà un modello, un modello dà tante strutture (un seme ciascuna), e il
Cartografo le mette nel mondo con le sue concentrazioni. Con la ricucitura la regola 10 dentro un complesso è al 100 % per il pian terreno e le
scale, al 98-100 % per i piani alti, al 90-95 % per i tetti: fuori restano soprattutto i tetti dei palazzi di un piano, che non hanno nucleo (il
22 % di quelli al primo piano, l'1-7 % più in alto: `lab/strutture-modulari/grande/tetti-fuori.ts`). Le tre cose che la prova ha trovato e che
sono del kernel:

1. **il set di tasselli-programmi con le facce lette dal kernel**, con la tabella della seconda prova (D2): niente elenchi di vicini, le stanze
   di almeno 2 × 2 vani e le porte allineate per costruzione;
2. **la ricucitura dopo l'onda**: la regola 10 dentro il complesso (il pian terreno e le scale sempre, i piani alti al 98-100 %, i tetti al
   90-95 %);
3. **i semi collaudati** come oggi le strutture (la regola 10 col cammino del kernel sui semi che il mondo usa, i tetti misurati).

La via B resta per ciò che la A non fa: un tessuto senza cuciture attraverso i luoghi e la sovraimpressione sulle case che ci sono. La catena
(§ 11) la rimanda.

**Le foto** (`lab/strutture-modulari/grande/foto/`): `accanto-a-t522.png` (il quartiere di T522 col collaudo, la via A, la via B col collaudo,
lo stesso seme, a metà dei voxel), `via-a-quartiere.png` e `via-a-ricucita-quartiere.png`, `via-b-quartiere.png`, `tessuto-di-base.png`,
`via-a-blocco.png` (il lotto di un blocco a tutti i voxel, da due lati), `via-b-luogo-di-mezzo.png`, `via-a-popolare-villa.png` e
`via-b-popolare-villa.png` (gli altri due stili), `catalogo-<stile>.png` (i 50 tasselli di ogni stile).

## 11. La catena dei task (ripianificata dopo T557, da approvare)

La catena M1-M7 di T543 era scritta per tasselli che l'Architetto avrebbe scritto da zero, coi nuclei scala e la ricucitura nel kernel. Le
risposte del 27/11 a D/T543 e la terza prova (§ 12) la cambiano: i tasselli si **estraggono** dai modelli statici della libreria (nessuna
chiamata in più per un set), un set è **un programma** con la sua massa e la sua **ricucitura in MarkovJunior**, le masse sono **per
ambientazione**, i set **crescono a mondo acceso** e **niente serie** allo stesso seme. La sostituisce questa:

| | task | provider · sforzo · stima | dipende da |
|---|---|---|---|
| M1 | **L'estrattore nel kernel, il set come dato**: `src/kernel/bricks.ts` da `lab/strutture-modulari/estratti/` (la sorgente eseguita come la esegue il gioco, la parte edilizia, i vani di 32 voxel a 16 per casella, la copia senza scale, il cammino, i tasselli di più vani, le facce lette dai voxel pieno o vuoto in blocchi di 8 col pavimento dentro o fuori e la stanza che vuole un soffitto, le coppie osservate, le firme, le copie per la ricucitura: la porta con la soglia, la rampa e il foro, la scala esterna); il set come dato (`models/<set>.json`: una riga a tassello, da quale modello, seme e vano, mai i voxel: il kernel li rifà dalla forma del modello in cache); i controlli del set (ogni firma ha un vicino per lato; le impronte che la massa può chiedere e che il set regge, misurate); il glossario (§ 13); i test sulla locanda del seme (offline) | claude · high · 6% | risposte D1, D2 di T557 |
| M2 | **Il complesso nel gioco**: il programma unico (massa, `<wfc set stage="sig">`, ricucitura, vestizione, `<wfc set stage="voxels">`) compilato dal kernel, con le unioni della ricucitura e la vestizione generate dal set (l'Architetto scrive la massa, D2); il motore che esegue le due `wfc` del set; i **semi collaudati** (un seme che l'onda rifiuta passa al seguente; il cammino del kernel sui voxel conferma le scale ricucite, e la rampa interna che non regge si toglie dalle copie); il complesso su un lotto e sul lotto di un blocco (ADR-0206/0208); le mesh per vano a istanze (la vestizione dice il vano di ogni cella); la verifica nel browser (entrare dal portone, salire una scala esterna, uscire su un ballatoio) | claude · max · 8% | M1 |
| M3 | **Le masse per ambientazione**: la massa come programma dell'Architetto per ambientazione o per regione (le palazzine di una città, le taverne del Far West, al più tre piani dove l'ambientazione lo dice), scritta sulle impronte che il set regge (M1 le misura), coi lotti vuoti e le altezze; la richiesta e la risposta, il controllo su una griglia di prova (i semi rifiutati, le stanze raggiunte), il motivo che torna | claude · high · 5% | M2 |
| M4 | **I set che crescono a mondo acceso, le concentrazioni**: ogni struttura della libreria che regge l'estrazione diventa un set (all'arrivo su un pianeta uno, poi altri man mano che lo Scultore scolpisce modelli statici, senza chiamate in più; più tipi di edificio per pianeta); il Cartografo sceglie un complesso fra quelli del mondo per regione, coi pesi (D6 A); **mai la serie**: un complesso a ogni seme è un'altra disposizione, un'altra onda, un'altra ricucitura; il kernel non lascia lo stesso set oltre una soglia attorno | claude · xhigh · 6% | M2, M3 |
| M5 | **La prova pagata**: lo Scultore scolpisce modelli statici fatti per essere tagliati (muri sui lati dei vani, il passo delle finestre sul vano, le scale in un vano loro, il tetto raggiungibile), per esempio le palazzine di `neapolis`, il saloon di `mesa`, una stazione del vuoto; i set estratti, i complessi misurati e fotografati, il voto dell'Artista, il costo | claude · high · 3% (più la prova pagata) | M3, M4 |
| M6 | **I set per pianeta e le stazioni del vuoto**: la libreria dei set per fascia (ADR-0236), il Cartografo che sceglie per pianeta, la stazione del vuoto (ADR-0233) da un modello statico di stazione; da lontano i complessi nel globo (la massa del modello, dipinta nei livelli grossi) | claude · high · 5% | M4 |
| M7 | **(Rimandato) Il tessitore sopra i luoghi**: la via B, solo se serviranno quartieri senza cuciture fra i luoghi o la sovraimpressione sulle villette che ci sono | claude · max · 9% | M2, una risposta |

L'ordine: M1 → M2 → M3 → M4 → M5; M6 dopo M4; M7 solo se l'autore lo chiede. In tutto M1-M6 circa il 33 % della scala più la prova pagata. **L'ADR**
(da scrivere con M1): i set estratti dai modelli statici con le facce lette dal kernel; il complesso come un programma (massa, onda, ricucitura in
MarkovJunior, vestizione, voxel) con le due `wfc` del set come estensione nostra; la ricucitura in MarkovJunior come garanzia della regola 10 dentro
il complesso, collaudata dal cammino del kernel.

## 12. La terza prova (T557): i tasselli estratti dai modelli statici, la ricucitura in MarkovJunior

Il laboratorio è [`lab/strutture-modulari/estratti/`](../../lab/strutture-modulari/estratti/README.md), lo script
`lab/scripts/strutture-modulari-estratte.ts`; le misure sono la corsa di 8 semi in `misure.json`. Nessun modello è stato chiamato e nessun file del
gioco è cambiato.

### 12.1 L'estrattore

- **La sorgente** è un modello statico di un universo sul disco eseguito come lo esegue il gioco (`Forms.request`, `runForm`, senza interno), a più
  semi: la «Palazzina di tufo (grande)» di `neapolis` (Opus 5.5, voto 6, semi 1-4) e la «Locanda del Cinghiale» di `mesa` (dal seme: la taverna che
  il Far West indossa; un saloon suo `mesa` non l'ha avuto, semi 1-3). Resta la parte edilizia: ciò che la tavolozza chiama mobile o prop (antenne,
  panni, botti, panche, comignoli, insegne, alberi) e le lettere nascoste diventano aria; le ante delle porte restano, e il cammino le legge aperte
  (le lettere che l'azione `open` del modello cambia).
- **I vani** sono quelli di T522/T543: 32 × 32 × 32 voxel a 16 per casella. Il modello si posa sui vani col solaio di ogni piano in fondo al suo
  vano (le due sorgenti hanno 32 voxel da solaio a solaio) e coi muri dentro i vani, una striscia di terra attorno; la griglia si sposta perché la
  scala tagli meno lati; attorno un anello di strada e sopra uno strato d'aria: il modello come sta in un lotto. Tutte e due stanno in 3 × 3 vani e
  tre strati (due piani e il tetto).
- **La copia senza scale**: la stessa sorgente con la scala tolta sopra ogni solaio e il solaio richiuso. Senza, la scala della palazzina
  nell'angolo nord-ovest rendeva unica la sua fila di vani («scala, scala, angolo») e nessun palazzo passava i tre vani di larghezza.
- **I tasselli**: il cammino del corpo nella sorgente (l'impronta di 7 × 7 voxel liscia come la vuole `rampBlocks`, un gradino di 3); i vani che
  attraversa lontano dal pavimento (una scala da un piano all'altro) sono un tassello di più vani: la palazzina ne ha di 2 × 1 × 2, la locanda di
  1 × 1 × 2. **49 tasselli** dalla palazzina (35 di stanza, 10 di tetto, 4 scale), **65** dalla locanda (31 di stanza, 27 di tetto, 4 di cortile,
  3 scale): le falde di una pianta a L a più altezze sono molte.
- **Le facce lette dai voxel**: un lato è il suo strato di voxel in blocchi di 8 × 8, pieno o no, col pavimento che lo tocca dentro (coperto) o
  fuori; sopra e sotto in blocchi di 4 × 4, e la faccia di sopra di una stanza dice che vuole qualcosa sopra. **Due facce si incontrano dove la
  sorgente le mostra insieme** (le coppie osservate, in qualunque vano con la stessa faccia; nella palazzina 21 coppie lungo x, 7 lungo y, 31
  in verticale), mai per classi transitive.
- **Le firme**: vani con facce che incontrano le stesse facce, gli stessi passaggi e le stesse lettere della massa sono una firma (56 nella
  palazzina, 71 nella locanda); l'onda va sulle firme e la scelta del vano dentro la firma viene dopo: è la stessa onda, perché le facce decidono
  chi incontra chi.
- **Le copie per la ricucitura**: la porta nel mezzo di ogni lato che un vano non passa (con la soglia dove fuori non c'è pavimento: un
  ballatoio), la rampa interna dal pavimento al piano di sopra col foro nel solaio di sopra, la scala esterna in un vano di strada che sale contro
  la facciata accanto (37 copie nella palazzina, 103 nella locanda). La faccia di una copia resta quella del suo vano: la porta non cambia chi
  incontra chi.

### 12.2 Il programma

Un `<sequence>` solo, eseguito una volta: la **massa**; l'**onda sul set** (`<wfc set stage="sig" tries="100">`, una cella a vano, il motivo è la
firma e, sopra, lo stato da cui parte la ricucitura: la griglia diventa due strati a piano); la **ricucitura in MarkovJunior** (un `<markov>`: un
`<all>` di 73 regole sparge il raggiunto per i passaggi, le porte e le scale aperte; un `<one>` di 16 apre una porta a caso fra un vano raggiunto
e uno da raggiungere; un `<one>` di 5 mette una scala, la rampa interna o la scala esterna; da capo, finché niente si raggiunge più); la
**vestizione** (una `<map scale="1 1 1/2">` che dalla firma e dallo stato scrive la lettera del vano: com'è, con la porta, con la rampa, col foro,
con la scala esterna); i **voxel** (`<wfc set stage="voxels" tries="1">`, ogni vano della sua lettera scelto a peso). La vestizione riusa i
simboli delle firme (scrive una griglia nuova): il programma sta nei 255 simboli del motore con 123 (`neapolis`) e 208 (`mesa`). I testi sono in
`programmi/` (19 e 26 mila caratteri). Le due `wfc` sono l'estensione D2 A; il resto compila col compilatore del gioco ed esegue nei tetti del
mondo (`worldNodeErrors` non dice niente; `FORM_LIMITS` e `WORLD_NODE_LIMITS` nella corsa).

### 12.3 Le misure (8 semi)

«Senza» è l'onda sola, «MJ» la ricucitura del programma, «T543» la ricucitura del kernel della seconda prova fatta sulla stessa onda (rivestire due
vani con firme della stessa famiglia che incontrano ancora i vicini e passano: nessuna porta scolpita). Sul grafo dei vani, dall'anello di
strada; «sopra» sono le stanze dei piani alti.

| set | terreno | semi fatti | ms (massa · onda · ricucitura · voxel) | pian terreno senza / MJ / T543 | piani alti senza / MJ / T543 | scale | tetti MJ | porte, scale dentro, fuori | tasselli usati, bit |
|---|---|---|---|---|---|---|---|---|---|
| neapolis | lotto | 8/8 | 345 (1 · 6 · 2 · 337) | 56 / **100** / 56 % | 13 / **93** / 13 % | 100 % | 66 % | 3, 0,5, 0,9 | 21 di 49, 4,2 |
| neapolis | blocco | 8/8 | 424 (3 · 17 · 6 · 399) | 45 / **100** / 45 % | 12 / **85** / 12 % | 100 % | 41 % | 20, 1,6, 8,9 | 41 di 49, 5,0 |
| mesa | lotto | 8/8 | 596 (1 · 10 · 3 · 582) | 70 / **100** / 87 % | 0 / **85** / 0 % | 100 % | — | 2,3, 0,1, 0,4 | 11 di 65, 1,6 |
| mesa | blocco | 5/8 | 681 (4 · 47 · 5 · 624) | 82 / **100** / 92 % | 1 / **86** / 3 % | 100 % | — | 13, 1,8, 1,8 | 28 di 65, 2,8 |

Accanto a T543 (la via A ricucita nel kernel, sul lotto di un blocco: pian terreno 100 %, piani alti 99 %, tetti 95 %, 46 tasselli su 50, 4,8 bit):
la ricucitura in MarkovJunior porta il pian terreno allo stesso 100 % e i piani alti all'85-93 % con tasselli che non hanno nuclei scala né torrini
(le scale vengono dal tassello della scala dove sta, dalla rampa interna e soprattutto dalla scala esterna); la ricucitura del kernel di T543 sulla
stessa onda non apre quasi niente (0-1,2 vani rivestiti a corsa). I tetti: la palazzina non ha accesso al tetto, quelli raggiunti (41-66 %) lo sono
per le porte fra un tetto e una stanza più alta accanto; le falde della locanda non si camminano. Le stanze: 24 per blocco nella palazzina (la più
grande di 16 vani), 30 nella locanda (6 vani). **Il cammino del kernel** (`walkIn`, le ante aperte) sui voxel accanto al grafo: `neapolis` 32 vani
sul lotto e 142 sul blocco raggiunti dai due, 1 solo dal grafo; `mesa` 68 sul blocco e 8 solo dal grafo, oltre una rampa interna. **I semi da
collaudare**: 3 semi su 8 del blocco di `mesa` l'onda li rifiuta subito (la massa chiede vani che il set non ha accanto a quelli che ha);
`neapolis` li prende tutti.

### 12.4 La varianza

Fra due semi la massa cambia il 29 % dei vani in `neapolis` e il 20 % in `mesa` (la disposizione cambia col seme: la correzione 4); a massa ferma
l'onda cambia la firma del 13 % dei vani in `neapolis` e del 38 % in `mesa`; l'uso dei tasselli fra due semi dista 0,18-0,21 (da 0, uguali, a 1), i
colori 0,03-0,06 (lo stesso set ha lo stesso aspetto); fra i due set i colori distano 0,87. Un set è un aspetto, la massa e l'onda sono le
disposizioni: dove T543 concludeva che «ogni set vorrà la sua massa», qui ogni set ce l'ha.

### 12.5 Le foto

In `lab/strutture-modulari/estratti/foto/`: `sorgenti.png` (i modelli statici ai semi usati, allineati ai vani), `catalogo-<set>.png` (i
tasselli), `<set>-lotto.png` e `<set>-blocco.png` (tre semi), `<set>-blocco-due-lati.png`, e `accanto-a-t543.png`: il lotto di un blocco della via A
di T543, poi `neapolis` e `mesa` di questa prova. Le palazzine estratte hanno le facciate della sorgente (il tufo, le persiane, i balconi, il
portone) su impronte e altezze che la sorgente non ha, con le scale esterne contro le facciate; le taverne di `mesa` il pianterreno di pietra, il
piano d'intonaco e le falde di coppi della locanda, più frammentate (qualche pilastro del cortile della locanda resta solo in una strada).

### 12.6 Che cosa ha insegnato

1. **Il taglio a vani regolari attraversa i ritmi della sorgente** (le finestre della palazzina ogni 10 voxel, i vani ogni 32): con le facce lette
   lettera per lettera un palazzo può essere solo largo quanto la sorgente; reggono le facce pieno o vuoto in blocchi di 8 voxel, e qualche
   finestra resta tagliata a metà. Un modello statico fatto per essere tagliato (muri sui lati dei vani, il passo delle finestre sul vano, scale
   in un vano loro) si ricomporrebbe meglio: è la richiesta della prova pagata (M5).
2. **Le coppie osservate, non le classi**: le classi transitive fanno incontrare una stanza col vuoto attraverso un muro.
3. **Una scala nell'angolo rende unica la facciata che tocca**: si toglie dalla sorgente (la copia senza scale) e si rimette dal tassello della
   scala dove sta, o dalla ricucitura.
4. **Una stanza vuole qualcosa sopra**: va detto nella faccia di sopra, o l'onda lascia stanze senza tetto.
5. **255 simboli bastano senza le quattro rotazioni** (277 firme con le rotazioni): la sorgente ha già le facciate nelle quattro direzioni.
6. **Ricucire vuol dire scolpire**: la ricucitura del kernel di T543 (scegliere un altro vano che incontra i vicini) coi tasselli estratti non trova
   quasi mai un vano adatto; la ricucitura in MarkovJunior scolpisce porte, soglie e scale, e cambia col seme (la porta che apre è scelta a caso
   fra quelle che servono).
7. **La scala esterna è la ricucitura verticale che regge**: la rampa interna entra solo nei vani senza muri vicini e, nei vani della locanda, il
   cammino del kernel non sempre la sale; la scala esterna sta in una strada, sale contro la facciata, e il kernel la sale. Nel Far West è anche la
   scala dei saloon.
8. **Una sorgente semplice si ricompone meglio**: la palazzina (un parallelepipedo) regge tutte le masse provate; la locanda (pianta a L, falde a
   più altezze) dà 27 tasselli di tetto, la sua massa sta su impronte di 2 × 2 e 3 × 2 vani e 3 semi su 8 del suo blocco l'onda li rifiuta.

## 13. I nomi proposti

Verificati liberi nel glossario (ADR-0117) e nel codice; entrano nel glossario con M1, quando esistono in `src/` (il test del glossario vuole
che i nomi inglesi ci siano):

| nome | inglese | che cosa | perché non un altro |
|---|---|---|---|
| tassello | `Brick` | un programma di uno o più vani con le facce lette dal kernel | «modulo» è il modulo dell'universo, «blocco» il lotto di più luoghi, «pezzo» `<pieces>`, «parte» le parti del mondo, «prefabbricato» è vietato (è il timbro), «tessera» è del tileset |
| set di tasselli | `BrickSet` | i tasselli di uno stile, coi pesi | — |
| vano | `Bay` | un posto del tessuto: 2 × 2 caselle e un piano | «cella» è il posto della griglia di un programma |
| tessuto | `Fabric` | ciò che il kernel tesse coi tasselli sopra i luoghi | «composizione» è ciò che una struttura contiene (ADR-0179) |
| massa | `Massing` | lo scheletro: le altezze, i nuclei, i ponti | — |
| tessuto di base | `baseFabric` | la massa vestita senza onda, valida per costruzione | «sfondo» è già di altro (la corona) |
| complesso | `Complex` | (T543) il modello della via A: la massa e una `wfc` su un set, un complesso per lotto o per blocco, un seme per edificio | «struttura» è la classe, «edificio» ciò che il mondo indossa |
| ricucitura | `stitch` | (T543) ciò che il kernel fa dopo l'onda: un muro che diventa porta dove un vano non si raggiunge, coi vani rivestiti di motivi che incontrano ancora i vicini | «riparazione» è dell'Ingegnere (il codice che fallisce) |
| concentrazione | `concentration` | (T543) quali complessi il Cartografo mette in una regione e con che peso (la «serie», lo stesso complesso allo stesso seme ripetuto, è caduta con la risposta D6 a T543) | — |
| estrattore | `extractBricks` | (T557) ciò che taglia un modello statico della libreria in tasselli: la sorgente sui vani, la parte edilizia, il cammino, le facce, le coppie | «scultore» è l'agente che scrive i modelli |
| sorgente | `BrickSource` | (T557) il modello statico a un seme da cui un set è estratto, posato sui vani | «origine» è dell'eredità delle carte |
| firma | `Signature` | (T557) i vani le cui facce incontrano le stesse facce, con gli stessi passaggi e le stesse lettere della massa: il motivo della prima onda | «chiave» è la faccia sola |
| vestizione | `dress` | (T557) la `map` del complesso che dalla firma e dallo stato scrive la lettera del vano da mettere (com'è, con la porta, con la scala) | «veste» è del sito |
| scala esterna | `outdoorStair` | (T557) la scala della ricucitura in un vano di strada, che sale contro la facciata alla porta del piano di sopra | — |

## 14. Le domande per l'autore

Le sette di T543 hanno avuto risposta il 27/11 ([`docs/pipeline/domande/T543.md`](../pipeline/domande/T543.md), chiusa): la terza prova le ha
usate tutte (§ 12). Le domande nuove sono in [`docs/pipeline/domande/T557.md`](../pipeline/domande/T557.md), ognuna col consiglio: (D1) il set nel
kernel estratto dai modelli statici della libreria; (D2) chi scrive il programma (l'Architetto la massa, il kernel la ricucitura dal set); (D3) la
scala esterna e la rampa interna; (D4) i semi rifiutati; (D5) i modelli statici fatti per essere tagliati; (D6) la parte edilizia detta dalla
tavolozza; (D7) le masse per ambientazione e i set che crescono a mondo acceso.

Prima: le sette di T522 hanno avuto risposta il 27/11 ([`docs/pipeline/domande/T522.md`](../pipeline/domande/T522.md), chiusa): la seconda prova le ha
usate tutte (§ 10.2). Le domande nuove sono in [`docs/pipeline/domande/T543.md`](../pipeline/domande/T543.md), ognuna col consiglio: (D1) la via:
la A con le tre cose del kernel, la B rimandata; (D2) il formato del set: tasselli che sono programmi e facce lette dal kernel, non il tileset di
MarkovJunior con le sue righe di vicini; (D3) la stanza più piccola: 2 × 2 vani, 4 × 4 caselle; (D4) i tetti: misurati e ricuciti, non
obbligatori; (D5) un set per modello; (D6) le concentrazioni del Cartografo; (D7) i set per pianeta.

## 15. Che cosa non è provato

- **L'Architetto vero**: che sappia scrivere un set e la sua massa con le facce giuste (le legge il kernel, ma un set che non si chiude torna
  indietro, e quante volte non si sa): M5.
- **La bellezza**: i tasselli delle due prove sono scatole con finestre in tre tavolozze; le foto mostrano la massa e il tessuto, non ciò che
  l'Architetto farebbe; nessun tassello varia per seme.
- **Il gioco**: niente è nel kernel. Il motore ha eseguito la via A nei tetti del mondo (lotto e lotto di un blocco) e scritto la stessa griglia
  del laboratorio; la ricucitura, i motivi consegnati dal motore, il rendering a istanze, il passo del server, il client sottile e i tetti
  raggiunti nel gioco sono stimati, non provati. I tempi sono di una macchina carica di altri agenti.
- **Il formato del set come programmi**: il laboratorio costruisce il nodo `wfc` dal set; il formato coi tasselli che sono programmi (D2) è
  descritto, non scritto.
- **Il rilievo**: le due prove sono in piano; col rilievo vero (ADR-0256) un complesso sta su una terrazza (`onTerrace`) come le strutture di oggi.
- **La regola 10 dopo la ricucitura**: ciò che resta fuori sono soprattutto i tetti dei palazzi di un piano (nessun nucleo, nessuna porta che
  li veda) e qualche vano accanto al muro di un nucleo o di una scala (la ricucitura non riveste i tasselli di più vani); il cammino del kernel concorda col grafo sul luogo di mezzo, non su un complesso
  intero nel gioco.
- **La via B**: il suo collaudo guarda la finestra della regione e la conta raggiunta (ottimista); la ricucitura sul quartiere intero non è più
  uguale in ogni ordine; il tessuto di base nuovo (stanze e corridoi) è valido sui semi provati, non dimostrato su ogni massa.
- **Le carte**: il set come carta, il viaggio con le carte portate, il clone: descritti, non fatti.
- **I riferimenti**: il post di r/Unity3D non letto; PlanetSmith non dice come genera.
- **Dopo la terza prova (T557)**: l'estrattore e il set sono nel laboratorio; le due `wfc` del set le costruisce il laboratorio (il formato del set,
  una riga a tassello in `insiemi/*.json`, non lo legge nessuno); i tasselli non variano per seme (vengono da semi diversi della sorgente); la massa
  non sa quali impronte il set regge e l'onda rifiuta i semi che non regge (3 su 8 nel blocco di `mesa`); la rampa interna nei vani della locanda
  non sempre la sale il cammino del kernel (8 vani su 76 del blocco raggiunti solo sul grafo); i tetti della palazzina si raggiungono solo per
  caso; due sorgenti sole, a 16 voxel per casella e con 32 voxel da solaio a solaio (una sorgente con un altro passo andrebbe scalata in altezza,
  non provato); il terreno in piano; niente è nel kernel, nel renderer o sul filo.
