# Dove va il tempo, e cosa porterebbe la GPU (T331)

Domanda dell'autore (07/11, epoca 324, come T330): portare MarkovJunior su WebGPU è il passo che può rendere di più? Prima di
toccare il motore (che deve restare voxel per voxel identico, ADR-0142, `tests/mj-engine-determinism.test.ts`) si misura. Questo
studio non cambia niente del gioco: aggiunge due script di misura e i loro numeri.

**In breve**: oggi MarkovJunior non è il collo di bottiglia. Nei worker l'**83 %** del tempo di un modello va nella **mesh**
(`meshVoxels`, `src/mj/mesh.ts`), non nel programma; del programma, la parte che una GPU saprebbe fare senza cambiare l'ordine
delle estrazioni (le scansioni intere della griglia) è un quarto-un terzo. Il frame sta in 5-8 ms su 16,7, con la GPU a 2-4 ms.
**Raccomando di non portare MarkovJunior su WebGPU ora**, e di fare prima tre task sulla CPU che costano poco e rendono di più
(§6).

## 1. Come si misura

| cosa | script | dove |
|---|---|---|
| il frame nel browser | `node lab/scripts/misura-frame.mjs <porta> [--secondi 8] [--json f]` | Chrome headless sulla GPU vera, su una preview della build |
| i programmi del seme | `npx vite-node lab/scripts/misura-mj.ts -- [--semi 3] [--taglie small,large,huge,gargantuan] [--classi …] [--solo …] [--json f]` | Node, offline |

**Il frame** (`misura-frame.mjs`). I tempi legati ai frame non si prendono nella scheda di Claude in Chrome (circa 1 Hz,
`docs/architettura-dettagli.md#convalida-browser`): lo script avvia un Chrome headless suo (`--use-angle=d3d11 --disable-gpu-vsync
--disable-frame-rate-limit`, un profilo usa e getta sotto `.pipeline/misura/`, quindi la cache delle forme vuota), apre
`/?skip&offline` e, senza cambiare il gioco:

- prima della pagina avvolge `requestAnimationFrame` (il JS di ogni frame), le chiamate di disegno di WebGL2 (draw call, triangoli), una
  query `EXT_disjoint_timer_query_webgl2` attorno a ogni frame (il tempo della GPU) e `Worker` (quando parte ogni lavoro e quando torna,
  con il nome del modello);
- dalla console avvolge, come proprietà dell'istanza sopra il prototipo, i metodi del kernel (`tick`, `runModule` = Lua, `npc.tick`,
  `waterTick`, `updateChunks`, `rebuildSolids`, `runRunes`, `settleHeights`…) e del renderer (`render`, `syncChunks`, `entities.update`,
  `corona.update`, `bloom.render`…), con il tempo proprio di ognuno (ciò che una parte chiama si conta in quella chiamata, non due volte).

Le fasi: l'avvio fino al kernel pronto, il caricamento a freddo (fino a quando i worker tacciono e la scena smette di crescere), un luogo
pieno col tappeto fermo, la corona, l'acqua che scorre (uno scavo nel letto di un'acqua, `kernel.dig`), l'arrivo tre luoghi più in là.

**I programmi** (`misura-mj.ts`). Ogni programma di `universe/models/` (i sonori a parte) gira come lo fa girare un worker del gioco
(`Forms.request` → `runForm` → `formMeshes`), con il profilatore di V8 acceso (`node:inspector`, un campione ogni 100 µs). Il tempo di
ogni campione va alla funzione in cui cade, e la funzione a una parte: **match** (scansione, `sync` incrementale, `MatchSet`, censimento),
**scelta** (`Rng`, il rimescolamento di `all`, le estrazioni di `prl`, la scelta pesata di `one`), **scrittura** (`write`, `apply`), gli
altri nodi (`convolution`, `path`, `map`, forme), l'inferenza, la compilazione, la mesh, il GC. Il nome della classe di un metodo (`go`
c'è in ogni nodo) si legge dal testo eseguito, che l'ispettore restituisce (`Debugger.getScriptSource`). Limite: una funzione che V8
mette in linea dentro un'altra può finire nel conto di quella (si vede in `SequenceRunner.go`, 0,3 s): le parti sono buone al punto
percentuale, non meglio.

Macchina: Windows 10, 12 core logici, NVIDIA GeForce RTX 2070 (ANGLE D3D11), Chrome 156 headless, 1904×985, dpr 1. Tre giri del
browser con numeri entro il 10-15 % l'uno dall'altro; qui il quarto.

## 2. Il frame

Millisecondi; il kernel a 60 tick al secondo, i frame senza vsync (quindi più di 60: i numeri per frame valgono per qualunque ritmo).

| fase | fps | tick del kernel (per tick) | disegno CPU (per frame) | GPU (mediana, per frame) | draw call | triangoli |
|---|---|---|---|---|---|---|
| caricamento a freddo (14 s) | 189 | 4,04 | 3,30 | 2,63 | 175 | 3,6 M |
| luogo pieno, tappeto fermo | 317 | 2,86 | 2,30 | 2,24 | 182 | 3,6 M |
| corona | 180 | 3,05 | 3,94 | 3,57 | 195 | 2,0 M |
| acqua che scorre | 173 | 3,51 | 3,92 | 3,59 | 197 | 2,0 M |
| arrivo tre luoghi più in là (16 s) | 239 | 2,77 | 3,17 | 2,70 | 179 | 2,1 M |

Il resto del frame (HUD, suono, input) è 0,05 ms. A 60 Hz il thread principale usa **5-8 ms su 16,7**, la GPU 2-4 ms: su questa
macchina c'è margine dappertutto, e la GPU non è il limite.

**Il tick** (luogo pieno, per tick): Lua (sistemi e hook) **1,67 ms** (il 60 %), solidi 0,30, altezze 0,24, rune 0,21, il resto
0,08; luoghi 0,02, società 0,01, studio 0,01; **acqua 0,00**. Nel caricamento a freddo Lua sale a 2,9 ms (i luoghi nuovi, gli hook
`on_spawn`). La società è quasi a zero perché l'universo offline del seme ha poche persone: in un mondo del Concilio va rimisurata.

**L'acqua**: uno scavo di 18 caselle nel letto di un'acqua la mette in moto per circa 100 ms; in tutta la finestra costa 0,17 ms al
secondo. L'automa gira solo dove qualcosa è cambiato e si ferma subito (`src/kernel/water.ts`, al più 40 000 caselle): non è un costo.

**Il disegno** (per frame): `bloom.render`, cioè le passate di three.js (scena, inchiostro, bagliore, uscita) che inviano le draw call,
1,7-3,0 ms; entità 0,3-0,5; luoghi 0,1; corona 0,2. Il bagliore è già sulla GPU (shader di `UnrealBloomPass`): sulla CPU costa
l'invio, non il calcolo.

**L'avvio e il caricamento**: il kernel è pronto in 4-5 s; prima ci sono long task fino a ~1 s (la pagina che si monta). Dopo, nei
14-16 s del caricamento a freddo, 4 worker eseguono **164 programmi**, occupati al **62 %**: un programma in mediana 34 ms, p95 1,6 s,
il più lungo 4,6 s. **I più lenti sono gli edifici della corona**: `corona-concilio` 4,6 s, `corona-universo` 4,0, `corona-magia` 3,9,
`corona-mondo` 3,6, `corona-nucleo` 2,9, `corona-oggetti` 2,3, poi `circuito-3D` 1,9 e `corona-sistemi` 1,8. All'arrivo in luoghi
nuovi i modelli erano già in memoria (nessun lavoro dei worker), ma ci sono 5 long task fino a 170 ms che non stanno nel tick
(0,03 ms per `updateChunks`): stanno nella pianificazione dei luoghi fuori dal tick, ed è uno scatto che si vede.

## 3. I programmi del seme

80 programmi (i sonori a parte), 3 semi, ognuno alla sua taglia (quella dell'indice o della sua classe). Millisecondi in media per
programma; «programma» è `runForm` (compilazione ed esecuzione), «mesh» è `formMeshes`.

| classe (programmi) | casella | programma | mesh |
|---|---|---|---|
| structure (13) | 100×100×80-100 | 227 | 295 |
| structure, huge (1) | 120×120×112 | 362 | 211 |
| object (6) | — | 79 | 343 |
| building (14, quasi tutti della corona) | fino a 160×160×72 | 78 | **1 467** |
| monument (5) | 20×20×60 | 74 | 6 |
| tree (5) | 40×40×60 | 43 | 14 |
| furniture (16) | 20×20×20 | 13 | 23 |
| person (14) | — | 6 | 24 |

I più lenti nel programma: `fantasy-fontana-antica` 673 ms, `circuito-3D` 433, le strutture grandi 270-360. I più lenti nella mesh:
gli edifici della corona, da 0,8 a **4,2 s** (`corona-magia`), e `circuito-3D` 1,2 s.

**Per taglia** (`--taglie small,large,huge,gargantuan --classi structure,monument,tree,beast`, 1 seme; un programma che dice la sua
`size` nell'XML non cambia casella):

| taglia | strutture: casella | strutture: programma | strutture: mesh | tutti i 25: programma | tutti i 25: mesh |
|---|---|---|---|---|---|
| small | 40×40×30-50 | 84 | 88 | 70 | 53 |
| large (la loro di base) | 100×100×80-100 | 248 | 317 | 161 | 182 |
| huge | 120×120×96-116 | 285 | 310 | 183 | 178 |
| gargantuan | 120×120×96-116 | 275 | 299 | 176 | 171 |

Le strutture si fermano a 120 di lato: enorme e gargantuesca hanno la stessa casella, e il tempo cresce meno delle celle (il censimento
per riga di D33 salta le righe vuote). Il più lento: `struttura-fucina-nanica` gargantuesca, 420 ms.

**Dove va il tempo** (tutti i programmi, 3 semi, 100 s di campioni):

| parte | ms | % del tutto | % del solo programma |
|---|---|---|---|
| **mesh** (`meshVoxels`, `formmeshes`) | 65 944 | **65,8** | — |
| GC (quasi tutto della mesh: un array per vertice) | 12 688 | 12,7 | — |
| match | 14 066 | 14,0 | 65 |
| — di cui scansioni intere (`scanPattern`, censimento) | 6 474 | 6,5 | **30** |
| — di cui `sync` incrementale e `MatchSet` | 6 968 | 7,0 | 32 |
| compilazione | 2 593 | 2,6 | 12 |
| scelta | 1 866 | 1,9 | 9 |
| altri nodi (`convolution`, `path`, `map`, forme) | 1 226 | 1,2 | 6 |
| scrittura | 655 | 0,7 | 3 |
| altro | 1 162 | 1,2 | 5 |

Con le taglie grandi la mesh scende al 54 % (senza gli edifici della corona) e le scansioni intere sono il 24 % del programma.
Nel browser i conti tornano: 62 % di 4 worker per 14 s sono ~35 s di worker, quanto la somma in Node di programma e mesh (33 s).

## 4. Cosa porterebbe WebGPU compute

### MarkovJunior

Il motore è deterministico perché ogni estrazione del seme cade nello stesso posto: `one` sceglie `keys[rng.int(keys.length)]`, e
l'ordine di `keys` (aggiunte in coda, una rimossa sostituita dall'ultima) fa parte della corsa. Una cosa a favore: `Rng` è mulberry32,
il cui stato dopo k estrazioni è `seme + k·0x6d2b79f5`, quindi l'estrazione k-esima si calcola da sola, senza le precedenti: una GPU
può fare estrazioni in parallelo se sa il loro numero.

| nodo | in parallelo senza cambiare le estrazioni? | perché |
|---|---|---|
| scansione intera (inizio di un nodo, griglia cambiata di più di un quarto) | **sì** | ogni posizione si giudica da sola; l'ordine di `keys` (z, y, x, pattern per pattern) si ricostruisce con una somma prefissa |
| `one` | **no** | una scrittura per passo e migliaia di passi; ogni passo dipende dal precedente, e il `sync` incrementale tocca poche celle (è veloce proprio perché è piccolo) |
| `all` | in parte | la scansione sì; il rimescolamento di Fisher-Yates è sequenziale (si fa sulla CPU, è O(n)); l'applicazione salta i match che toccano celle già scritte nell'ordine rimescolato: chi vince dipende da chi viene prima, sequenziale |
| `prl` | **sì** | ogni match estrae `rng.next()` nell'ordine di `keys`: l'estrazione i-esima è la i-esima dello stream, poi tutte le scritture insieme |
| `convolution` | **sì**, con due passate | le estrazioni avvengono solo nelle celle che passano le condizioni: una somma prefissa dà a ognuna il suo numero |
| `map`, forme | **sì** | nessuna estrazione |
| `path` | poco | una visita in ampiezza a fronti, poi una scelta |
| inferenza (`field`, `observe`, `search`) | i campi sì, la ricerca no | i potenziali sono visite in ampiezza; la ricerca è un albero di stati |

Quindi la GPU farebbe le scansioni intere, `prl`, `convolution`, `map`: il **30 % del programma** (le scansioni) più il 6 % (gli altri
nodi). Con una GPU infinitamente veloce il programma guadagnerebbe al più un terzo, cioè il **5-6 % del tempo di un worker** (il
programma è il 17 % del lavoro di un worker, la mesh il resto). In pratica meno: ogni scansione sulla GPU vuole i match di ritorno sulla
CPU (`mapAsync`, circa 1 ms di andata e ritorno nel browser), e un programma ne fa molte; la scansione della CPU con il censimento per
riga è già rapida. Stima onesta: **il 10-20 % del programma, il 2-4 % di un worker**, per un motore doppio.

Il costo invece è alto: Node non ha WebGPU, quindi il motore della CPU resta il riferimento (test, server, mondi di molti,
validatore) e la versione GPU va tenuta identica voxel per voxel con un controllo che gira solo nel browser; due motori da far evolvere
insieme (T334 ha appena aggiunto l'inferenza, T342 i simboli illimitati).

### L'acqua

Un passo dell'automa si può scrivere alla Jacobi (ogni casella dalla stessa fotografia), quindi in parallelo; ma costa 0,17 ms al
secondo mentre si muove e si ferma in 100 ms. Niente da guadagnare.

### Il bagliore e il disegno

Il bagliore è già sulla GPU. Ciò che costa sulla CPU è l'invio delle passate di three.js (1,7-3 ms per ~180 draw call). Il
`WebGPURenderer` di three.js ridurrebbe forse l'invio, ma vorrebbe dire riscrivere i materiali del cartone e dell'inchiostro in TSL: un
lavoro grande per un guadagno che su questa macchina non serve (GPU a 2-4 ms). Da rimisurare su una GPU integrata prima di parlarne.

### La mesh (non chiesta, ma è dove sta il tempo)

`meshVoxels` è in parallelo per natura (ogni faccia di ogni voxel si giudica da sola, l'occlusione guarda tre vicini): sulla GPU
andrebbe benissimo. Ma prima c'è un guadagno grande e senza rischi sulla CPU: oggi crea array a ogni vertice (`d`, `t`, `a1`, `a2`,
`[0, 1, 2].filter`) e accumula in array di numeri da convertire alla fine; da qui il 13 % di GC. Riscritta senza allocazioni, con le
tabelle delle facce precalcolate e array tipizzati che crescono, è ragionevole aspettarsi 3-5 volte meno tempo con **la stessa mesh,
byte per byte**. Gli edifici della corona sono il 77 % della mesh del seme.

## 5. WebGPU nei browser di oggi, e il ripiego

- **Chrome ed Edge**: attivo da 113 su Windows, macOS e ChromeOS; su Android da 121 (Android 12+, GPU Qualcomm e ARM); su Linux solo su
  alcune GPU (Intel Gen12+ da gennaio 2026, NVIDIA recenti). In questo Chrome 156 headless `navigator.gpu` c'è. WebGPU c'è anche nei
  worker dedicati, dove girano i programmi.
- **Firefox**: Windows da 141, macOS su Apple Silicon da 145; Linux, Android e Mac Intel solo in Nightly.
- **Safari**: attivo da macOS Tahoe 26, iOS e iPadOS 26, visionOS 26.

Fonti: [web.dev, «WebGPU is now supported in major browsers»](https://web.dev/blog/webgpu-supported-major-browsers),
[gpuweb, implementation status](https://github.com/gpuweb/gpuweb/wiki/implementation-status),
[Khronos, WebGL e WebGPU a SIGGRAPH 2026](https://www.khronos.org/developers/linkto/webgl-and-webgpu-sigg26).

Ripiego: senza WebGPU (Linux, Firefox fuori da Windows e Mac Apple, schede vecchie) tutto resta sulla CPU come oggi, che è comunque
il riferimento. Il ripiego non costa niente perché è il motore attuale; costa tenere due strade uguali.

## 6. Raccomandazione

**Non portare MarkovJunior su WebGPU ora.** Il guadagno massimo sul lavoro di un worker è sotto il 6 %, quello realistico il 2-4 %, e
il prezzo è un secondo motore da tenere identico al primo. Il tempo sta altrove, e lì si guadagna sulla CPU senza toccare il motore.
I task che ne seguono, da approvare:

1. **La mesh senza allocazioni** (`src/mj/mesh.ts`, `meshVoxels`): tabelle delle facce e degli angoli precalcolate, array tipizzati che
   crescono, niente array per vertice. Fatto quando un test confronta l'impronta delle mesh di tutti i modelli del seme prima e dopo
   (byte per byte) e `misura-mj.ts` mostra la mesh almeno 3 volte più veloce. Atteso: dal 40 al 55 % in meno del lavoro dei worker al
   caricamento a freddo. Piccolo, sforzo medio.
2. **Gli edifici della corona quando servono**: oggi sono gli 8 lavori più lenti del caricamento (2-4,6 s l'uno) anche per chi è nel
   cerchio, che non li vede (regola 8). Chiederli quando la corona si avvicina o si rivela (`coronaRevealed`, `coronaNear`), lasciando
   `loadRing` (T226) a caricarli in anticipo un po' alla volta, oppure dopo tutti i modelli del luogo nella coda dei worker. Fatto quando
   nel caricamento a freddo di un viandante nel cerchio nessun `corona-*` passa prima dei modelli del suo luogo, e attraversare il bordo
   non fa scatti (rimisurato). Da decidere con l'autore se chi è master li vuole subito.
3. **Gli scatti all'arrivo**: 5 long task fino a 170 ms quando nascono luoghi nuovi, fuori dal tick. Trovarli con un profilo della pagina
   (CDP `Profiler`, come `misura-mj.ts` in Node) e spezzarli o spostarli in un worker.
4. Poi, se serve, **rimisurare con `misura-frame.mjs` e `misura-mj.ts`** su un mondo del Concilio (più persone, strutture più grandi) e
   su una GPU integrata. Riaprire la questione WebGPU solo se, dopo il punto 1, il programma supera la metà del lavoro dei worker **e** le
   scansioni intere superano il 40 % del programma; e in quel caso partire dalla mesh sulla GPU (parallela per natura, nessun seme da
   rispettare), non dal motore.

Il Lua dei sistemi è il 60 % del tick (1,7 ms): il misuratore della Sala sistemi (`kernel.meter`) dice già quale sistema costa; non è
un lavoro per la GPU.
