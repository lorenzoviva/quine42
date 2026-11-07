# ADR-0164 — La veste futuristica mista: il labirinto sotto l'hero, il passo persistente del motore, il palco 3D a richiesta

Data: 2026-11-07 · Stato: accettato (task T315 del backlog) · Riferimenti: ADR-0151 (la veste futuristica, che questo aggiorna), ADR-0145 (le vesti del sito), ADR-0142 (il motore si ottimizza solo a voxel identici), ADR-0095 (il sito), ADR-0111 (la CSP), T284, T287

## Contesto

L'autore ha visto la variante `?fx=mj-pagina` di T284 (D42, 06/11): gli piace il labirinto MarkovJunior in due dimensioni fatto con le lettere della scritta, e chiede un misto nella veste futuristica, non una variante in URL: il palco 3D resta nella sua sezione, il labirinto entra in un'altra parte della pagina (dove, lo propone chi lo fa, coi numeri), con gli effetti MarkovJunior lungo la pagina dove reggono. Nel labirinto vuole i colori invertiti, le pareti tenui e i percorsi liberi accesi («visivamente ha più senso»), con i testi sopra leggibili. three.js va caricato solo quando il palco sta per vedersi e fermato quando esce dallo schermo; i picchi di 11–15 ms a 4× trovati da T284 vanno trattati. Il misto non deve costare più della veste di oggi: 39,6 % del thread principale a 4× (T284).

## Decisione

### Dove sta il labirinto: una sezione sua, sotto l'hero

Una banda larga quanto la pagina (1322 × 377 px a 1920, 364 × 322 su un telefono a 390), nel riquadro del palco con il nome del programma e i passi, subito dopo l'hero: è la prima cosa che si vede scorrendo, il «2D» sotto il «3D». È una `<section class="section-wrap fx-labirinto">` che `effects.ts` mette dopo l'hero solo nella landing e toglie quando la veste cambia; per chi non vede è un'immagine con la sua descrizione. Palco e labirinto si vedono insieme solo mentre si scorre dall'uno all'altro: le misure (sotto) guardano anche quel momento, e il misto resta sotto la veste di oggi in ogni posizione.

Le due posizioni che il task proponeva come esempio:

- **lo sfondo dell'hero**: dietro la scritta grande, che è fatta delle stesse lettere piccole, la confonde; dietro titolo e testo vuole un velo; e starebbe dove la pagina costa già di più, insieme al palco, a ogni caricamento;
- **il posto del palco finché three.js non arriva**: si vedrebbe per una frazione di secondo su un computer (three.js arriva subito, il palco è nel primo schermo) e quasi mai su un telefono, dove il palco sta sotto il testo e three.js arriva prima che lo si raggiunga.

### I colori invertiti

Nella variante le pareti erano lettere al 13 % e i percorsi lettere piene: ma in un labirinto perfetto pareti e corridoi sono larghi uguale, e l'occhio legge come pareti le righe di lettere accese (le pareti di un labirinto disegnato sono righe), come corridoi i vuoti scuri. Rovesciare solo le luminosità dà lo stesso equivoco a parti scambiate. Le prove offline (stesse celle dipinte in quattro modi) l'hanno mostrato: per leggere i corridoi come accesi devono essere **bande di luce, non righe di lettere**. Così (`mazeInk` in `program.ts`, `Ink.block` in `surface.ts`):

- **i percorsi liberi** sono blocchi del ciano della scritta (al 62 %) con la lettera **incisa** in scuro (al 60 % del fondo) e la Q piccola rosa; due posti liberi accanto si uniscono anche nello spazio fra loro (a destra e sotto), così un corridoio è una banda sola; le stanze appena scavate sono bianche, poi chiare, il percorso più lungo giallo e il suo inizio bianco;
- **le pareti** (e ciò che non è ancora scritto) sono lettere tenui, al 17 %, tutte del ciano: niente colonne rosa;
- ogni riga comincia tre lettere dopo quella di sopra (`stripeSurface(…, 3)`), così le Q non stanno in colonna;
- il fondo del riquadro è scuro e piano (`--skin-ink`): la luce del palco al centro rendeva chiare le pareti;
- **i testi sopra** (il nome del programma, i passi, l'etichetta) stanno sul loro fondo scuro all'86 %, e restano leggibili su qualunque banda.

### Il passo persistente del motore

ADR-0151 lo indicava come il primo lavoro se l'autore avesse voluto MarkovJunior lungo la pagina: `runOn` a ogni tick compila di nuovo il programma, rifà il censimento e cerca ogni regola in tutta la griglia, per ogni nodo. `Stepper` (`src/mj/engine.ts`) tiene il programma compilato sulla sua griglia, con il suo generatore e il suo censimento:

- `advance(n)` prosegue la stessa corsa: tagliata a pezzi è la corsa di `runOn` con lo stesso seme, voxel per voxel (`tests/mj-stepper.test.ts`, su tre programmi e tre semi). È il labirinto: cresce di qualche stanza a tick.
- `tick(n)` rifà il programma dal primo nodo, come un `runOn` nuovo, ma i nodi tengono le loro corrispondenze e le aggiornano dalle celle scritte nel frattempo (`rewind` invece di `reset`, solo mentre il flag `keeping` è acceso). Le regole sono le stesse, l'ordine delle corrispondenze no: non è la corsa di `runOn`, ed è per ciò che di una corsa vuole solo il comportamento (le luci). Il registro della griglia ricomincia oltre 4 volte le celle, e i nodi cercano di nuovo una volta.
- `run` e `runOn` non cambiano: il flag è spento per loro, e `tests/mj-engine-determinism.test.ts` lo conferma su ogni modello del seme.

Con lo stesso vincolo (ADR-0142), il nodo `path` è scritto senza un array per cella: stessi vicini nello stesso ordine e stesse estrazioni, quindi la stessa griglia (`tests/mj-path.test.ts`, impronte prese col motore di prima, più i tre modelli del seme che hanno un `path`). La soluzione del labirinto della pagina, il picco che restava (una volta per labirinto, quando il JIT non l'ha ancora ottimizzata), passa da 9,0 a 2,6 ms a 1× la prima volta, da 0,5 a 0,2 ms le successive.

Banco a 1× in Node (media e massimo per tick):

| Che cosa | `runOn` a ogni tick | `Stepper` | cicli scritti a mano |
|---|---|---|---|
| luci della scritta (2208 posti) | 0,33–0,41 ms | 0,08–0,11 ms | 0,25–0,29 ms |
| luci di una striscia (481 × 2) | 0,25 ms | 0,04–0,06 ms | 0,13–0,15 ms |
| labirinto 61 × 43 (la variante) | 0,13 ms, massimo 4,9 | 0,03 ms, massimo 1,1 | — |
| labirinto 169 × 31 | 0,21 ms, massimo 1,1 | 0,03 ms, massimo 0,5 | — |

### Le luci MarkovJunior lungo tutta la pagina

Col passo persistente il programma MarkovJunior delle luci costa quanto i cicli scritti a mano che T284 aveva scelto per i numeri: nel banco meno (sopra), nella pagina a 4× fra 0,8 e 2,7 punti di thread in più a seconda della posizione, dove pesano anche le onde (partono a caso e tengono accesa una striscia per una ventina di secondi, quindi da ridipingere a ogni tick); con `runOn` a ogni tick T284 misurava 2,4 volte il costo per tick. Il misto con le luci MarkovJunior resta sotto la veste di oggi in ogni posizione: le luci di scritta e strisce sono di nuovo il programma (`lights-mj.ts`), su ogni pagina. «Dove reggono» è quindi dappertutto. `?fx=semplice` resta per rifare il confronto; `?fx=mj` (ora il predefinito) e `?fx=mj-pagina` (la variante senza palco, superata dal misto) non ci sono più, e un valore che non c'è dà il predefinito.

Un tick degli effetti non sta più per forza in un fotogramma: i pezzi in vista si passano uno dopo l'altro finché il fotogramma ha speso 4 ms, e il resto va al fotogramma dopo. Una macchina veloce dipinge il tick in un fotogramma solo (un'immagine per il compositore, non una per pezzo); una lenta lo spalma, e nessun fotogramma porta tutti i pezzi. Un pezzo che non è cambiato (lo stesso stato, lo stesso passo del tappeto) non si ridipinge: il labirinto finito, fra un passo e l'altro del tappeto, non costa niente. La pittura scrive i blocchi cella per cella invece di chiamare `fill` su tre celle alla volta, e calcola lo spostamento del tappeto una volta per riga: il labirinto si dipinge in 0,33 ms a 1× invece di 0,90, la scritta in 0,08 invece di 0,13, con la stessa immagine pixel per pixel. Il labirinto cresce in 40 tick qualunque sia la sua misura (un telefono ne ha un quarto), resta acceso 44 tick e ricomincia con un altro seme.

### Il palco 3D a richiesta

Il palco è della landing, quindi di ogni veste, e da solo valeva quasi tutto il costo della pagina.

- **three.js a richiesta.** `landing.ts` non importa più three.js: un `IntersectionObserver` con mezzo schermo di margine sotto carica `hero-stage.ts` (e three.js) quando il palco sta per vedersi. Su un computer è subito, perché il palco è nel primo schermo; su un telefono il palco sta sotto il testo e three.js arriva quando ci si avvicina (a 390 × 844 il palco comincia meno di mezzo schermo sotto il primo, quindi arriva presto; non si vede e non disegna finché non ci si arriva).
- **Fermo fuori schermo.** Il ciclo di `requestAnimationFrame` si ferma quando il palco esce dallo schermo o la scheda si nasconde, e riparte quando torna; prima girava a vuoto a 60 fotogrammi al secondo (9,8 % del thread a 4× con il palco fuori schermo). Il tempo del programma passa solo mentre il palco disegna: torna dove era.
- **`prefers-reduced-motion`.** Il modello sta fermo e finito, senza girare né crescere, e si disegna solo quando lo si trascina o cambia qualcosa; il programma successivo arriva solo col doppio clic.
- **I programmi in un worker** (`hero-worker.ts`; `hero-programs.ts` senza three.js). Il pino (40 × 40 × 60) costava 225–265 ms a 1× ogni 24 s sul thread della pagina, circa 0,8–0,9 s a 4×: il fotogramma più lungo della landing di oggi. Il worker manda per ogni fotogramma solo le celle che si vedono e i loro codici (`showOf`), spostando gli array invece di copiarli; la pagina chiede il programma dopo mentre mostra questo. Se un worker non parte, il programma gira nella pagina come prima, un po' dopo.
- **Solo ciò che si disegna va alla scheda grafica.** A ogni fotogramma del modello che cresce si mandava il buffer intero di 40 000 istanze (matrici e colori, circa 6 MB), il 6–7 % del thread a 4× nel profilo; ora `addUpdateRange` manda le istanze disegnate, e di ogni matrice si scrive solo la traslazione. I codici nascosti si tolgono con una tabella invece di un insieme di stringhe (il 4,5 % del thread nel profilo, sul pino).

### Le misure

Con `tools/vesti/misura.mjs` (aggiornato: il telefono, le posizioni, finestre di 24 s con i tre programmi del palco e il pino, il fotogramma più lungo, i compiti lunghi, lo script dei worker) su una preview, in un Chrome headless proprio con la GPU vera; «prima di T315» è la build di partenza, misurata con lo stesso strumento nella stessa sessione. «Cima» è l'inizio della pagina, «insieme» il fondo dell'hero a metà schermo (palco e labirinto in vista insieme, la posizione più cara del misto), «sotto» il fondo dell'hero in cima allo schermo (il labirinto in vista, il palco no). Thread principale:

| Landing | Larghezza, CPU | Cima | Insieme | Sotto | Fotogramma più lungo | ms per fotogramma degli effetti (media / p95 / max, la posizione peggiore) | Scaricati, JS compresso |
|---|---|---|---|---|---|---|---|
| sobria, prima di T315 | 1920, 4× | 30,0 % | 31,4 % | 9,8 % | 901,2 ms | — | 195,5 KB |
| sobria, con T315 (il palco) | 1920, 4× | 20,8 % | 21,7 % | 0,4 % | 3,1 ms | — | 206,1 KB |
| futuristica di T284 (luci semplici, niente labirinto) | 1920, 4× | 33,0 % | 33,7 % | 13,8 % | 839,0 ms | 3,2 / 4,6 / 5,1 | 201,4 KB |
| **futuristica mista** (luci MarkovJunior, labirinto) | 1920, 4× | 25,5 % | 28,4 % | 12,8 % | 13,4 ms | 3,5 / 5,3 / 13,4 | 222,8 KB |
| futuristica mista, luci semplici (`?fx=semplice`) | 1920, 4× | 24,7 % | 27,5 % | 10,1 % | 9,3 ms | 3,5 / 5,4 / 9,3 | 222,9 KB |
| futuristica ferma, prima di T315 | 1920, 4× | 32,0 % | 32,1 % | 10,3 % | 839,3 ms | — | 201,4 KB |
| futuristica ferma, con T315 | 1920, 4× | 0,4 % | 0,4 % | 0,5 % | 0,0 ms | — | 222,8 KB |
| sobria, prima di T315 | 390, 4× | 10,1 % | 29,5 % | 9,8 % | 810,6 ms | — | 195,5 KB |
| sobria, con T315 (il palco) | 390, 4× | 0,4 % | 18,7 % | 0,4 % | 5,9 ms | — | 206,1 KB |
| futuristica di T284 (luci semplici, niente labirinto) | 390, 4× | 13,7 % | 31,4 % | 13,9 % | 820,8 ms | 2,3 / 3,5 / 5,0 | 201,4 KB |
| **futuristica mista** (luci MarkovJunior, labirinto) | 390, 4× | 6,1 % | 23,9 % | 7,3 % | 7,8 ms | 2,6 / 4,3 / 7,8 | 222,8 KB |
| futuristica mista, luci semplici (`?fx=semplice`) | 390, 4× | 6,1 % | 23,0 % | 6,0 % | 4,7 ms | 2,6 / 4,3 / 4,7 | 222,9 KB |
| futuristica ferma, prima di T315 | 390, 4× | 10,5 % | 30,6 % | 11,3 % | 803,4 ms | — | 201,4 KB |
| futuristica ferma, con T315 | 390, 4× | 0,4 % | 0,5 % | 0,5 % | 0,0 ms | — | 222,8 KB |
| sobria, prima di T315 | 1920, 1× | 7,3 % | 7,4 % | — | 187,4 ms | — | 195,5 KB |
| sobria, con T315 (il palco) | 1920, 1× | 4,1 % | 4,5 % | 0,2 % | 2,8 ms | — | 206,1 KB |
| futuristica di T284 (luci semplici, niente labirinto) | 1920, 1× | 8,3 % | 8,0 % | — | 203,4 ms | 0,4 / 0,9 / 1,5 | 201,4 KB |
| **futuristica mista** (luci MarkovJunior, labirinto) | 1920, 1× | 5,2 % | 6,7 % | 3,3 % | 6,0 ms | 1,6 / 2,8 / 6,0 | 222,8 KB |
| futuristica mista, luci semplici (`?fx=semplice`) | 1920, 1× | 5,0 % | 5,9 % | 2,8 % | 4,5 ms | 1,2 / 2,8 / 4,5 | 222,9 KB |
| futuristica ferma, prima di T315 | 1920, 1× | 7,3 % | 7,5 % | — | 193,6 ms | — | 201,4 KB |
| futuristica ferma, con T315 | 1920, 1× | 0,2 % | 0,2 % | 0,2 % | 0,0 ms | — | 222,8 KB |

- **Il misto costa meno della veste di oggi in ogni posizione**: a 1920 e a 4× il 28,4 % nel caso peggiore (palco e labirinto insieme) contro il 33,7 % della futuristica prima di T315 nello stesso punto e il 39,6 % che T284 aveva misurato in cima; in cima il 25,5 % contro 33,0; sotto l'hero di poco (12,8 contro 13,8 %), perché lì prima girava solo il palco a vuoto e ora c'è il labirinto. Su un telefono a 4×: 6,1 / 23,9 / 7,3 % contro 13,7 / 31,4 / 13,9.
- **I picchi**: il fotogramma più lungo della landing di prima era il pino del palco (765–901 ms a 4×, 176–204 ms a 1×, un compito lungo per ogni finestra); ora è di 13,4 ms a 1920 e 7,8 ms sul telefono, nessun fotogramma oltre 16,7 ms, nessun compito lungo. Il fotogramma più lungo degli effetti è di 5,3 / 13,4 / 9,5 ms nelle tre posizioni (T284: 11–15 ms per la variante).
- **Fermo**: con `prefers-reduced-motion` la futuristica costa lo 0,4–0,5 % (prima il 10–32 %: il palco girava comunque); a scheda nascosta (simulata come in T284, `document.hidden`) nessuna pittura degli effetti e nessun fotogramma del palco dopo quello in corso, contro 57 pitture e 181 disegni WebGL al secondo con la scheda in vista, e tutto riparte al ritorno; con palco e labirinto fuori schermo, zero disegni WebGL.
- **Il peso**: la sobria scarica 10,6 KB compressi di JavaScript in più (206,1 contro 195,5: il worker porta una sua copia del motore e dei programmi); la futuristica 21,4 KB in più (222,8 contro 201,4), il motore per le luci (9,9 KB) compreso.
- **Le luci semplici** (`?fx=semplice`) costano 0,8–2,7 punti in meno a 4× e restano solo per il confronto.

## Alternative scartate

- **Il labirinto come sfondo dell'hero, o al posto del palco finché three.js non arriva**: vedi sopra.
- **Rovesciare soltanto le luminosità** (pareti accese, corridoi spenti): in un labirinto perfetto pareti e corridoi sono larghi uguale, e ciò che è acceso si legge comunque come parete; provato offline, stesso equivoco a parti scambiate.
- **Il negativo pieno** (blocchi opachi e lettere nere) e **i corridoi a due toni** (un velo sotto lettere accese): il primo spegne la banda, che resta più scura che accesa; il secondo si legge ancora come righe di lettere. Provati offline sulle stesse celle.
- **Un labirinto più piccolo invece del passo persistente**: avrebbe ridotto i picchi solo in proporzione, e le luci a `runOn` per tick sarebbero rimaste più care di quelle semplici.
- **Un pezzo per fotogramma, sempre**: provato. Con il palco in vista non costa niente (il palco disegna comunque ogni fotogramma), ma sotto l'hero moltiplica i fotogrammi che il compositore deve fare: 51 al secondo invece di 21, il 24,2 % del thread a 4× invece del 15,3 % (prima che la pittura diventasse più svelta).
- **Indovinare il costo di ogni pezzo** per dare al labirinto un fotogramma suo: provato. 39 fotogrammi al secondo invece di 21, il 20,9 % invece del 15,3 %, e lo stesso fotogramma più lungo: il picco era la pittura del labirinto, ed è lei che si è resa più svelta.
- **Lasciare il palco com'era e togliere effetti per stare nel budget**: il palco da solo era il 30 % del thread a 4×, e un terzo di quel costo era lavoro buttato (buffer interi, il ciclo a vuoto, i programmi sul thread della pagina) che si toglie senza toccare ciò che si vede.
- **Anche il disegno del palco in un worker** (`OffscreenCanvas`): three.js ci girerebbe, ma i colori della veste, le dimensioni e il trascinamento passerebbero da messaggi; ciò che resta sul thread della pagina è il disegno vero, che lì non cambierebbe.

## Conseguenze

- La landing non porta più three.js e il motore nel suo script: arrivano col palco, per ogni veste; la futuristica scarica in più il motore (9,9 KB compressi) ed `effects.ts` col labirinto; il worker del palco porta con sé una sua copia del motore e dei programmi (30 KB compressi).
- Il motore ha un ingresso nuovo, `Stepper`, per ciò che si muove a ogni tick: chi ne fa un altro uso sa che `advance` è la corsa di `runOn` e `tick` no.
- `tools/vesti/misura.mjs` misura anche il telefono (`--telefono`, 390 × 844, DPR 2) e più posizioni della pagina (`--posizioni cima,insieme,sotto`), su finestre da 24 s (i tre programmi del palco, il pino compreso), con il fotogramma più lungo, i fotogrammi oltre 16,7 ms, i compiti lunghi e lo script dei worker; `cattura.mjs` fotografa e registra anche il labirinto.
- Restano da provare un telefono vero, un browser diverso da Chrome e una macchina lenta vera (il rallentamento è la simulazione di Chrome); la scelta fra le vesti resta all'autore (T287).
- Sicurezza: nessuna superficie nuova. Il worker è dello stesso sito (`worker-src 'self'`, ADR-0111), riceve solo un numero di programma e un seme e rimanda solo array; `?fx=` sceglie ancora solo fra valori noti e non entra mai nella pagina.
