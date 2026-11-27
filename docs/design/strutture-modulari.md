# Le strutture modulari e «seamless»: tasselli tessuti a WFC sopra i luoghi, sostituzione e sovraimpressione, i pianeti (T522)

Data: 2026-11-27 · Richiesta: l'autore, 26/11 ([`docs/userchats/to-do-2026-11-26.md`](../userchats/to-do-2026-11-26.md), «Le strutture
seamless»: le villette di `neapolis`, parallelepipedi con note brutaliste, piccole e singole; comporle in strutture più grandi e complesse,
applicate all'universo come sostituzioni o in sovraimpressione; [marian42](https://marian42.de/article/infinite-wfc/) e i pianeti a WFC) ·
Nasce da T458 (le parti del mondo, [`scultori-specializzati.md`](scultori-specializzati.md) § 4), T472 (ADR-0243), ADR-0206 e ADR-0208 (il lotto
di più luoghi), ADR-0174 e ADR-0176 (`wfc` nel motore e nel mondo), T500 ([`markov-allineamento.md`](markov-allineamento.md): la `wfc` che
diverge apposta) · Prototipo: [`lab/strutture-modulari/`](../../lab/strutture-modulari/README.md), `npx vite-node lab/scripts/strutture-modulari.ts`.

Niente codice del gioco: lo studio dice che cosa servirebbe, perché, quanto costa e in che ordine; ogni fatto sul kernel di oggi (0.10.x) è
letto nel codice, col file. Il codice nuovo sta solo in `lab/`: un set di tasselli nello stile delle palazzine di `neapolis`, la lettura delle
loro facce dai voxel, il tessuto a WFC sopra 3 × 3 luoghi e le sue misure. **Nessun modello è stato chiamato** e nessun file del gioco è
cambiato.

**I nomi** (ADR-0117: «modulo», «blocco», «pezzo», «composizione», «cella» e «prefabbricato» sono già presi): un **tassello** è il mattone del
tessuto, un programma della grandezza di uno o più **vani** (il vano: 2 × 2 caselle e un piano); il **set di tasselli** è ciò che lo Scultore
scrive una volta per stile; il **tessuto** è ciò che il kernel compone coi tasselli sopra i luoghi; la **massa** è lo scheletro che lo precede
(quanti piani ha ogni colonna, dove salgono le scale); il **tessuto di base** è la massa vestita senza onda, valido per costruzione. In inglese
nel codice: `Brick`, `BrickSet`, `Bay`, `Fabric`, `Massing`, `baseFabric` (§ 12).

## In breve

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

Chi decide la massa è una domanda (D3): il kernel dal seme coi parametri che il Cartografo sceglie per il quartiere, un programma MarkovJunior
della massa (la «composizione» dell'Architetto, a scala di quartiere), o il master con una sua regione.

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
   sé**;
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

## 10. Il prototipo

[`lab/strutture-modulari/`](../../lab/strutture-modulari/README.md): `tasselli.ts` (il set, scritto a mano come lo scriverebbe lo Scultore, coi
colori della palazzina di tufo e un cemento a vista), `facce.ts` (la lettura delle facce, i motivi, il propagatore per `WfcSolver`, i controlli
del set), `tessuto.ts` (la massa, il tessuto di base, le regioni, il collaudo, il grafo della regola 10, i voxel); lo script
`lab/scripts/strutture-modulari.ts` fa le misure e le foto (`--foto`, in `lab/strutture-modulari/foto/`). I tasselli sono funzioni TypeScript, non
programmi MarkovJunior: il prototipo misura il tessuto, non il disegno. Nessun modello è stato chiamato.

## 11. La catena dei task (da approvare)

| | task | provider · sforzo · stima | dipende da |
|---|---|---|---|
| M1 | **Il set di tasselli come dato del kernel**: il formato (programmi `models/tassello-<set>-<nome>.xml`, la voce dell'indice con `set`, `bays`, `weight`, `covered`), la lettura delle facce dai voxel e i controlli del § 4.3 in `src/kernel/bricks.ts` (dal prototipo), il validatore, la carta del set, le voci del glossario (§ 12); i test sui tasselli del prototipo riscritti come programmi | claude · high · 5% | risposte D1, D2 |
| M2 | **Il tessitore del kernel**: la massa (altezze, nuclei, ponti dichiarati), il tessuto di base, le regioni coi margini sulla base, il `WfcSolver`, il collaudo della regola 10 reso economico (l'onda che conosce i passaggi, o la connessione dopo l'onda come ModernHouse), una funzione pura del seme; test d'ordine, di validità, di raggiungibilità contro `walkIn` | claude · max · 7% | M1 |
| M3 | **La sostituzione su un blocco di luoghi**: il Cartografo chiede un complesso (un set e una massa) dove oggi chiede una gargantuesca; il blocco di ADR-0206/0208 tessuto; le domande dello spazio sui vani tessuti (`free`, `floorAt`, il passo del server), i piani con l'indice dei motivi, i client sottili, `InstancedMesh` per motivo; la verifica nel browser | claude · max · 8% | M2 |
| M4 | **Lo Scultore dei tasselli**: il mestiere o la sezione dell'Architetto (D6), la richiesta (concetto, stile, vano, tabella delle facce, misure del corpo, le tre trappole delle scale), la risposta (i programmi), i controlli (facce, chiusura, specchi, il tessuto di base di una massa di prova, il cammino), il motivo che torna; il censimento e la manopola | claude · high · 6% | M1 (M2 per la massa di prova) |
| M5 | **La sovraimpressione**: le strutture in piedi come vani fissi (la loro impronta e la loro altezza dalla forma), le loro porte mai chiuse, i portici e i ponti sulle strade, le sopraelevazioni; sui luoghi già pianificati | claude · xhigh · 6% | M3 |
| M6 | **Il quartiere**: una regione tessuta (del Cartografo o del master, ADR-0201) col suo set e i parametri della massa; i piani dei suoi luoghi del kernel senza chiamate; la massa nell'atlante | claude · xhigh · 6% | M3, M5 |
| M7 | **La prova pagata**: lo Scultore vero scrive due o tre set (le palazzine brutaliste di `neapolis`, uno romano alla marian42, una stazione del vuoto), tessuti su alcuni blocchi, il voto dell'Artista, il costo | claude · high · 3% (più la prova pagata) | M3, M4 |
| M8 | **I pianeti e le stazioni**: set per pianeta, la stazione del vuoto tessuta, la massa nel globo da lontano | claude · high · 5% | M6 |

L'ordine: M1 → M2 → M3 in fila; M4 dopo M1, in parallelo a M2-M3 (si prova sulla massa di prova); M5 dopo M3; M6 dopo M3 e M5; M7 dopo M3 e
M4; M8 per ultimo. In tutto circa il 46 % della scala, più la prova pagata. **L'ADR** (da scrivere con M1, non prima): i tasselli come parti del
mondo con le facce lette dal kernel; il tessuto come modifica a pezzi di un tessuto di base valido, sulla griglia dei luoghi; la massa prima del
WFC; la regola 10 collaudata a ogni regione.

## 12. I nomi proposti

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

## 13. Le domande per l'autore

In [`docs/pipeline/domande/T522.md`](../pipeline/domande/T522.md), ognuna col consiglio: (D1) la via, dentro un programma dell'Architetto o il
tessitore del kernel; (D2) la misura del vano; (D3) chi decide la massa; (D4) prima la sostituzione o la sovraimpressione; (D5) i tetti
tessuti, raggiungibili o no; (D6) chi scrive i set e quanti per universo; (D7) i pianeti.

## 14. Che cosa non è provato

- **Lo Scultore vero**: che sappia scrivere un set coi bordi giusti (le facce le legge il kernel, ma un set che non si chiude torna indietro, e
  quante volte non si sa): M7.
- **La bellezza**: i tasselli del prototipo sono scatole con finestre; le foto mostrano la massa e il tessuto, non ciò che un set scritto bene
  farebbe; nessun tassello varia per seme.
- **Il gioco**: niente è nel kernel; il passo del server, il client sottile, il renderer a istanze, il raggio e i tempi nel ciclo sono stimati,
  non misurati. I tempi sono di una macchina carica (altri agenti in parallelo).
- **Il rilievo**: il prototipo è in piano; col rilievo vero (ADR-0256) la massa dovrebbe stare sulle terrazze (`onTerrace`) o i tasselli avere
  quote diverse (le toppe a gradini di marian42 2023).
- **La regola 10 globale**: il collaudo guarda la finestra della regione; l'8-17 % di stanze non raggiunte viene da lì. Un collaudo sul luogo
  intero, o la connessione dopo l'onda, sono da provare in M2. I cortili chiusi (strada senza uscita in mezzo a un lotto) non sono contati.
- **Le carte**: il set come carta, il viaggio con le carte portate, il clone: descritti, non fatti.
- **I riferimenti**: il post di r/Unity3D non letto; PlanetSmith non dice come genera.
