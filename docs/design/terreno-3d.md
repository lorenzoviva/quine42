# Il terreno in tre dimensioni, la regola 10 rivista, gli automi dell'acqua e del vento (T459)

Data: 2026-11-21 · Step 45, Fase III · Richiesta: l'autore, 20/11 ([`docs/userchats/to-do-2026-11-20.md`](../userchats/to-do-2026-11-20.md) § 2) ·
Studi gemelli: [`acqua-spazio.md`](acqua-spazio.md) (T432), [`sotterranei-stato.md`](sotterranei-stato.md) (T412), [`gpu.md`](gpu.md) (T331),
[`scultori-specializzati.md`](scultori-specializzati.md) (T458) · Prototipi e misure: [`lab/terreno-3d/`](../../lab/terreno-3d/README.md) ·
Domande: [`docs/pipeline/domande/T459.md`](../pipeline/domande/T459.md)

Niente codice del gioco: il documento dice che cosa cambierebbe, perché, quanto costa e in che ordine. Ogni fatto sul kernel di oggi
(0.10.15) è letto nel codice, con il file. **I numeri sono misurati, non stimati**: un prototipo per ogni via in `lab/terreno-3d/vie.ts`,
le misure per luogo e per passo in Node sul kernel offline del seme (`lab/terreno-3d/misura.ts`, rapporto in
[`lab/terreno-3d/misure/node.md`](../../lab/terreno-3d/misure/node.md)) e il frame nel browser con `misura-frame.mjs --terreno` (Chrome
156 headless sulla RTX 2070, la stessa macchina di T331; [`lab/terreno-3d/misure/frame.json`](../../lab/terreno-3d/misure/frame.json)).
Nessun modello è stato chiamato.

## In breve

1. **La via raccomandata è a colonne, non in voxel.** Una colonna per casella come oggi, ma con un **rilievo vero** (massicci fino a 15
   caselle, terrazze con i dirupi fra l'una e l'altra, passi, conche, il letto sotto l'acqua fino a 7 caselle sotto il mare), la regola 10
   contata sul grafo dei gradini e gli strati scritti da un programma MarkovJunior che ne dice le adiacenze. Costa 2,5 ms in più a luogo
   (oggi 18,1 fra kernel e mesh), tiene 3,5 KB a luogo (oggi 2,2) e non cambia il frame. **Il terreno tutto in voxel** a 4 per casella costa
   322 ms di MarkovJunior e 109 di mesh a luogo (24 volte ciò che costa oggi fare e disegnare un luogo), tiene 405 KB a luogo (115 volte
   le colonne: in un mondo di molti con 240 luoghi caricati sul server, 97 MB contro 0,8), chiede un contratto nuovo per ogni cosa che
   legge il terreno, e a 8 per casella non si fa (5,7 s a luogo). Sulla RTX 2070 il frame non se ne accorge: la scena ha già 3 milioni di
   triangoli di modelli e il terreno in voxel ne aggiunge 80 mila visibili.
2. **La regola 10 rivista: la rete e le enclavi.** Il kernel garantisce **la rete** (varchi, porte, partenza, case e lavori degli
   individui, ciò che il mondo dà per raggiungibile) connessa a piedi o a nuoto **a gradini**, scavando sentieri e rampe come oggi scava
   sentieri; fuori dalla rete possono esserci **enclavi** (un altopiano, una cengia, la cima di una mesa) divise da un dirupo, dove la
   regione dell'atlante lo concede, ciascuna con un passo che un mezzo del mondo supera (il salto, l'arrampicata, una scala, un ponte, la
   leva, un veicolo), provato con «Altro…». Misurato col rilievo vero: per tenere la rete servono 0,48 rampe a luogo (3,8 livelli di terra
   mossi); per tenere la regola di oggi alla lettera, ogni enclave unita, 0,89 rampe (5,2 livelli). **Le enclavi sono una scelta, non una
   necessità**: il kernel saprebbe toglierle tutte, e le lascia dove il gioco le vuole.
3. **Il fondale e il sottosuolo.** Il letto sotto l'acqua è una colonna come la terra, sotto una superficie trasparente, con ciò che il
   Cartografo vi posa; si raggiunge immergendosi (una primitiva nuova, col fiato di T446). Le grotte non sono terreno: sono strutture che
   scendono, come le cantine (ADR-0091). Col rilievo vero il 4,6 % delle caselle aperte nasconderebbe il viandante alla camera di 3/4 (oggi
   lo 0 %): serve **il taglio verso la camera**, il disco di T416 girato.
4. **Gli strati come regole.** Un programma MarkovJunior 3D su S × S × D, la superficie in cima ferma come il bordo del layout: costa
   2,1 ms a luogo a una cella per casella (55 ms a quattro). Lo scrive il Cartografo con gli ambienti, lo leggono lo Scultore Architetto
   (le pareti di una cantina nello strato dove scende), lo Scenografo e il Narratore. Una lezione misurata: in 3D MarkovJunior prova una
   regola in ogni verso del cubo, e «sotto l'erba la terra» diventa «accanto all'erba la terra» se la radice non dice `symmetry="(xy)"`.
5. **Gli automi: la fisica nel kernel a una cella per casella, l'aspetto sulla GPU.** L'acqua a tubi virtuali (onde che viaggiano,
   correnti, fiumi che scendono, la quantità conservata a 1e-7) costa 0,34 ms a tick sulla finestra caricata (108 × 90 caselle), il vento
   a reticolo di Boltzmann a una cella ogni tre caselle 0,1 ms a passo, dieci passi al secondo; nel browser, con la superficie che li
   segue, 0,87 ms a tick sui 16,7 del frame. A quattro celle per casella l'acqua costa 4,5 ms a passo: è risoluzione da disegno, e il
   disegno va sulla GPU.
6. **La primitiva degli automi** è parametrica (famiglie del kernel, i parametri come dati scritti dal Fisico, entro tetti di celle per
   passi), con un'uscita programmatica in MarkovJunior per gli automi discreti (un `convolution` su un `Stepper` costa 1,6 volte la
   tabella del kernel). **Il Lua mai per cella**: lo stesso fuoco costa 34 volte in Lua a passo intero e 155 volte con una chiamata a
   cella. Il Lua mette sorgenti e legge campioni.
7. **Il contratto**: tutto ciò che è raccomandato è aggiuntivo (una `Z` per task), acceso dalla natura del mondo alla Genesi; il voxel
   sarebbe un contratto nuovo, forse un'era. **Tredici task, circa il 55 % di una settimana** (§ 7); le montagne con l'arrampicata il 18 %.

---

## 0. Il terreno di oggi, sulle cose che contano qui

| Cosa | Oggi | Dove |
|---|---|---|
| Il rilievo | un livello per casella (un quarto di casella), la somma di due piastrelle di `Hills` (64 e 45, profonde 12); fra vicini al più due livelli: «si sale sempre, non è mai un ostacolo» | `src/kernel/relief.ts`, ADR-0048 |
| Le montagne | il codice `k` della bozza (dove il rumore `h` supera 0,8) e `r`: caselle **solide** di roccia con il modello `rock` sopra, alla stessa altezza del prato accanto | `universe/modules/world.terrain/logic.lua:57-58` |
| La bozza e il rilievo | indipendenti: il Lua decide dove sono acqua e montagne, `Hills` dove sono le colline; `worldLevels` mette poi ogni specchio in piano al suo livello più basso, con sponde di due livelli | `relief.ts` (`worldLevels`, `chunkLevels`) |
| Il fondale | non esiste: l'acqua è un quadrato a `WATER_Y` (−0,18) sotto il livello della casella; l'automa dell'acqua dà a ogni casella mai mossa `DEEP` = 2 livelli d'acqua | `src/render/terrain.ts:23`, `src/kernel/water.ts:12` |
| Il sottosuolo | 4 righe di strati per casella (`STRATA_DEPTH`), un aspetto: non bloccano niente, si vedono solo nei tagli | `src/kernel/strata.ts`, ADR-0091, T418 |
| La regola 10 | il layout unisce varchi, porte e sacche di 4 o più caselle con la via più economica e trasforma in sentiero ciò che attraversa (vegetazione 4, roccia 9, muro 80); l'acqua che si nuota è una via e non si scava | `src/kernel/layout.ts:212-287`, ADR-0225 |
| Il corpo | collisione per assi ai quattro angoli (`free`, `bodyFree`): le caselle, le forme; nessun controllo sul dislivello del terreno, perché non serve | `src/kernel/kernel.ts:4316-4355` |
| Il salto | sopra ciò che non va oltre `JUMP_UP` = 1,05 caselle (quattro livelli), lontano fino a `JUMP_FAR` = 2,6 | `src/kernel/forms.ts:32-34` |
| La via degli individui | A* su otto direzioni con un controllo del passo (`step`, T299) che oggi guarda le forme, non il rilievo | `src/kernel/npc/route.ts`, `kernel.ts:5519` |
| L'acqua che scorre | automa del kernel, solo dove il suolo cambia (`dig`); a riposo non costa niente (T331: 0,17 ms al secondo dopo uno scavo); `Map` di caselle con le chiavi in testo | `water.ts`, ADR-0094 |
| Il mare a schermo | onde nel vertex shader (tre sinusoidi delle coordinate del tappeto), schiuma, scia, rollio: solo disegno | `src/render/sea.ts`, T451 |
| Il vento | nessuno nel kernel; la vela del veicolo dà `power` da Lua; la vegetazione ondeggia con un vento del materiale | ADR-0227, `MAT.sway` |
| La camera | 3/4, inclinazione 0,95 rad (54°), distanza fino a 15, giri a quarti; il taglio sotto terra di T416 è un disco allungato verso la camera | `src/render/renderer.ts:28`, `src/kernel/underground.ts` |
| La finestra caricata | ciò che la camera vede più un luogo attorno: alla camera più lontana circa 6 × 5 luoghi (108 × 90 caselle; nel browser 35 luoghi) | `kernel.ts:3993` (`wantChunks`), `renderer.ts:251` (`fitView`) |

---

## 1. Le misure (e)

### 1.1 Come si misura

- **Per luogo e per passo, in Node** (`npx vite-node lab/terreno-3d/misura.ts`): il kernel del seme offline (`Kernel.boot` con
  `MockAiModels`), 300 luoghi presi uno ogni cinque su un quadrato di 90 × 90 luoghi attorno alla partenza (mari, coste, boschi,
  montagne); per ogni via i passi veri del kernel quando esistono (`genDraft`, `layout` con gli ambienti del seme a turno, `chunkLevels`,
  `draftStrata`, `buildChunk`) e i prototipi quando no. I voxel su 12 luoghi: i 10 col dislivello più grande, uno di mezzo e la partenza
  (a 8 per casella solo i primi due), quindi **il caso costoso**. Gli automi sulla finestra caricata più grande (108 × 90 caselle) sulla
  costa del luogo col dislivello più grande. Mediana e 95° percentile; ogni passo misurato dopo un giro a vuoto (il codice compilato).
- **Il frame, nel browser** (`node lab/scripts/misura-frame.mjs <porta> --terreno`, la modalità nuova): dopo il caricamento a freddo il
  viandante va nel luogo col dislivello più grande entro 12 luoghi dalla partenza ((−2, −4), 53 livelli), si misurano 8 secondi col terreno
  di oggi, poi i 35 luoghi caricati vengono rifatti in ogni via con il prototipo (`lab/terreno-3d/pagina.ts`, compilato con esbuild e
  valutato nella pagina: le mesh accanto a quelle del gioco, con il suo materiale e il suo inchiostro, il suolo del gioco nascosto) e si
  misurano altri 8 secondi per via; infine il terreno di oggi con gli automi accesi. La memoria (heap JS e buffer) prima e dopo, con un GC.
- **Il prototipo del rilievo vero** (`trueRelief`) è un generatore plausibile, non quello che il gioco avrebbe: le colline di oggi, più
  massicci da un rumore a creste su 150 caselle (fino a 56 livelli, 14 caselle), a terrazze di 8 livelli (dentro una terrazza un quarto
  della pendenza, fra due un dirupo), più passi (valli strette dove il massiccio tiene la sua pendenza), e sotto l'acqua un letto (il mare
  da 8 a 28 livelli sotto la superficie, l'acqua bassa da 2 a 7, una secca a 1). Le statistiche della regola 10 dipendono da lui; i costi
  quasi no.

Macchina: Windows 10, 12 core logici, NVIDIA GeForce RTX 2070 (ANGLE D3D11), Chrome 156 headless 1904 × 985, Node 22.19. Altri agenti
lavoravano sulla stessa macchina: i tempi sono buoni al 10-15 %, come quelli di T331.

### 1.2 Per luogo

Millisecondi a luogo (mediana; fra parentesi il 95° percentile o il massimo), in Node.

| via | fare il luogo nel kernel | la mesh | triangoli del terreno | ciò che il luogo tiene | buffer della mesh |
|---|---|---|---:|---:|---:|
| **oggi** | 10,6: la bozza in Lua 10,0 (10,3), il layout 0,45 (1,43), i livelli 0,06, gli strati 0,08 | `buildChunk` 7,5 (29,6) | 1 976 (7 224) | 2,2 KB | 216 KB |
| **colonne** | +2,5: il rilievo vero 0,22 (0,79), la regola 10 sui gradini con le rampe 0,17 (0,59), gli strati in MarkovJunior 2,1 (3,4) | 1,1 (2,7)* | 1 268 (1 540)* | 3,5 KB | 137 KB* |
| voxel a 1 per casella | +4,1 (6,4) di MarkovJunior | 3,4 | 1 274 (1 716) | 7 KB | 138 KB |
| voxel a 2 | +25 (36) | 15 | 2 714 (3 554) | 52 KB | 294 KB |
| **voxel a 4** | **+322 (485)** di MarkovJunior, 1,6 i pavimenti 3D | **109** | **9 392 (11 000)** | **405 KB (516)** | **1 018 KB** |
| voxel a 8 | +5 733 | 876 | 40 270 | 4,0 MB | 4,3 MB |

\* La mesh a colonne del prototipo non ha l'acqua, la schiuma e le istanze di `buildChunk`: è il terreno con le bande degli strati sui
fianchi, il confronto giusto è con i suoi triangoli, non col suo tempo. La mesh dei voxel è fusa (facce complanari della stessa lettera
unite in rettangoli, come farebbe un generatore di terreno); una faccia a quad ne fa 3,9 volte tante a 4 per casella (36 634), la mesh dei
modelli del gioco (`meshVoxels`, con l'occlusione e le facce sul bordo del luogo) 8,4 volte (79 066).

- **Il voxel nel browser** sui 35 luoghi attorno a (−2, −4), più piani di quelli scelti in Node: a 4 per casella 123 ms di programma (max
  319) e 30 di mesh a luogo; a 2, 11 e 6. Fare i 35 luoghi a 4 per casella ha tenuto il thread principale 5,7 s: nel gioco andrebbe in un
  worker, e il kernel vorrebbe comunque la griglia per la collisione (in molti anche il server).
- **Con gli strati scritti dal kernel** colonna per colonna (come `draftStrata`) e MarkovJunior solo per vene, grotte e fondale, il voxel
  a 4 scende da 322 a 224 ms: gli strati in MarkovJunior sono un terzo del costo, il resto è la griglia grande.
- **Il rilievo stesso in MarkovJunior**, luogo per luogo (`Hills` su 72 × 72 × 48): 745-918 ms a luogo, e ogni luogo con i suoi bordi
  (due vicini non si incontrerebbero). Oggi `Relief` fa le sue due piastrelle una volta per universo in 255 ms. **La grande scala non è un
  lavoro per MarkovJunior.**
- **La grande scala in Lua**: il rumore del rilievo vero scritto nel Lua del generatore costa 6-7,5 ms a luogo (wasmoon senza la sandbox),
  contro i 10 ms della bozza di oggi nella sandbox: fare il rilievo nel generatore costerebbe una bozza e mezza, una volta per luogo.

### 1.3 La memoria

| | a luogo | i 35 luoghi della finestra | un mondo di molti, 240 luoghi caricati sul server |
|---|---:|---:|---:|
| oggi: caselle, strati, livelli | 2,2 KB | 77 KB | 0,5 MB |
| colonne: più 2 righe di strati e il letto | 3,5 KB | 123 KB | 0,8 MB |
| voxel a 4: la griglia (un byte a voxel) | 405 KB (516) | 14 MB | 97 MB (il limite di un mondo è 1024 MB, ADR-0110) |

Nel browser i buffer delle mesh (non indicizzate, come quelle del gioco) sono passati da 159 a 165 MB con le colonne (5,1 MB per i 35
luoghi), a 166 con il voxel a 2, a 185 con il voxel a 4 (23 MB per i 35 luoghi). L'heap JS è rimasto a 32-33 MB: il prototipo
non tiene le griglie, che il kernel invece terrebbe.

### 1.4 Il frame

Nel browser, 8 secondi per fase, il kernel a 60 tick al secondo, i frame senza vsync (quindi più di 60). Il bilancio è di 16,7 ms a frame;
T331 misurava 5-8 ms di thread principale e 2-4 di GPU.

| fase | JS a frame (mediana, p95) | tick | disegno | GPU (mediana, p95) | draw call | triangoli a frame |
|---|---|---:|---:|---|---:|---:|
| caricamento a freddo (11 s) | 2,90, 8,50 | 3,09 | 4,08 | 2,81, 3,85 | 182 | 3 368 k |
| **oggi**, nel luogo con più rilievo | 3,30, 6,90 | 3,14 | 3,24 | 3,02, 3,70 | 165 | 3 012 k |
| **colonne** (35 luoghi, 48 k triangoli di terreno) | 3,30, 6,90 | 3,20 | 3,23 | 2,93, 3,54 | 160 | 3 013 k |
| **voxel a 2** (61 k) | 3,30, 6,80 | 3,14 | 3,25 | 2,95, 3,46 | 159 | 3 018 k |
| **voxel a 4** (217 k) | 3,30, 6,70 | 3,09 | 3,24 | 2,96, 3,66 | 161 | 3 092 k |
| **oggi con gli automi** (acqua 11 340 celle a tick, vento 1 260 a 10 Hz, la superficie) | 3,30, 7,70 | **3,96** (gli automi 0,87) | 3,24 | 3,10, 3,73 | 168 | 3 057 k |

- **La GPU non vede il terreno.** I 3 milioni di triangoli a frame sono i modelli (edifici, alberi, persone) e le loro passate
  (scena, inchiostro, ombre); il terreno in voxel a 4 ne aggiunge 80 mila visibili (il 2,7 %). Fra le vie la GPU resta a 2,9-3,0 ms, entro
  il rumore della misura. Su una GPU integrata il conto andrà rifatto (T331 lo diceva già per il bagliore), ma lì peserebbero prima i
  modelli.
- **Il thread principale nemmeno**: le mesh sono ferme, il disegno resta a 3,2 ms. Ciò che costa è **fare** il terreno (§ 1.2), non
  disegnarlo.
- **Gli automi** aggiungono 0,87 ms al tick (+28 %, il 5 % del frame) e meno di 0,1 ms alla GPU (da 3,02 a 3,10: la superficie che si
  muove, 11 557 vertici caricati a ogni tick). Di questi, in Node, l'acqua sola è 0,34 ms: il resto è la superficie e il vento, e la
  superficie sulla GPU non costerebbe (§ 5.4).

### 1.5 Gli automi

Sulla finestra caricata (108 × 90 caselle, 9 720 celle a una cella per casella), in Node.

| automa | celle | ms a passo (mediana, p95) | passi al secondo | ms al secondo | del tick a 60 Hz |
|---|---:|---|---:|---:|---:|
| acqua a tubi virtuali, 1 cella per casella | 9 720 | 0,340, 0,365 | 60 | 20,4 | 0,34 ms |
| acqua a tubi, 2 celle per casella | 38 880 | 1,21, 1,24 | 60 | 72,6 | 1,21 ms |
| acqua a tubi, 4 celle per casella | 155 520 | 4,49, 4,61 | 66 | 296 | 4,9 ms |
| vento D2Q9, 1 cella per casella | 9 720 | 0,870, 0,882 | 10 | 8,7 | 0,14 ms in media |
| vento D2Q9, 1 cella ogni 3 caselle | 1 080 | 0,098, 0,100 | 10 | 1,0 | 0,02 ms in media |
| fumo che si spande (`diffuse`, la primitiva parametrica) | 9 720 | 0,066, 0,095 | 10 | 0,7 | 0,01 ms in media |
| fuoco a tabella (la primitiva parametrica) | 9 720 | 0,407, 0,663 | 10 | 4,1 | 0,07 ms in media |
| lo stesso fuoco in MarkovJunior (`convolution` su uno `Stepper`) | 9 720 | 0,632, 0,957 | 10 | 6,3 | 0,11 ms |
| lo stesso in Lua, il passo intero in Lua | 9 720 | 13,8, 15,1 | 10 | 138 | 2,3 ms |
| lo stesso in Lua, una chiamata del kernel a cella | 9 720 | 62,9, 64,1 | 10 | 629 | 10,5 ms |
| l'acqua di oggi (`water.ts`) mentre si muove dopo uno scavo, 3 538 caselle attive | — | 4,09, 5,96 | 100 | 409 | 6,8 ms (finché si muove) |

- **Per cella e per passo**: i tubi 35 ns, il vento 90 ns, il fumo 7 ns, la tabella 42 ns, MarkovJunior 65 ns, il Lua a passo intero
  1,4 µs, il Lua chiamato a cella 6,5 µs; l'acqua di oggi 1,24 µs a casella attiva (le chiavi in testo e le `Map`: 35 volte i tubi).
- **La quantità**: i tubi la conservano (la finestra chiusa, senza mare: −9,7e−8 dopo mille passi); col mare aperto la finestra ha perso
  il 29 % dell'acqua nei passi misurati, perché i laghi del prototipo non nascono in piano e scendono al mare: con l'automa sempre acceso
  la bozza dovrà dire dove l'acqua è ferma (§ 5.2).
- **Il passo stabile** dei tubi è mezzo lato di cella diviso per la velocità di un'onda (√(g·h)): col mare profondo 7 caselle, 0,06 s a
  una cella per casella (un passo a tick basta), 0,015 s a quattro (66 passi al secondo).

### 1.6 Che cosa dicono i numeri

1. **Il collo di bottiglia del terreno è farlo, non disegnarlo.** Le colonne col rilievo vero costano il 14 % in più di oggi a luogo; i
   voxel a 4 per casella 24 volte, e la loro griglia va tenuta (115 volte la memoria) dove si cammina: nel kernel e, in molti, sul server.
2. **La mesh del terreno di oggi è già uno scatto**: `buildChunk` costa 7,5 ms a luogo (30 al 95° percentile) sul thread principale, e
   `syncChunks` ne fa fino a tre a frame; T331 contava 5 long task fino a 170 ms all'arrivo in luoghi nuovi. Qualunque terreno più ricco
   va fatto in un worker; questo vale anche senza T459 (il punto 3 delle raccomandazioni di T331).
   *Fatto in T486 (ADR-0242, M0 del § 7)*: la mesh si fa nel worker del terreno da una copia di ciò che legge, uguale byte per byte; con
   `misura-frame.mjs` prima e dopo (`lab/terreno-3d/misure/m0-prima.json`, `m0-dopo.json`) il frame peggiore della mesh dei luoghi scende da
   65 a 20 ms al caricamento a freddo e da 61 a 5,4 all'arrivo. Dei 7,5 ms di `buildChunk` due terzi erano le letture di `groundAt`.
3. **L'automa fisico a una cella per casella è sostenibile** (0,34 ms a tick); a quattro no (4,9 ms): la risoluzione fine è disegno.
4. **Il Lua non fa girare un campo.** Neanche a passo intero (2,3 ms a tick a 10 Hz per un fuoco); va bene per gli eventi.
5. **MarkovJunior è il linguaggio delle regole discrete** (1,6 volte la tabella del kernel) e delle adiacenze fra strati (2,1 ms a
   luogo); non della grande scala (Hills a luogo 745-918 ms, e i bordi).

---

## 2. La regola 10 rivista (a)

### 2.1 Che cosa garantisce oggi

La regola dice due cose. **Ciò che sembra invalicabile lo è**: il terreno blocca a caselle, i modelli con i loro voxel, il vuoto, la lava.
**Ogni luogo è connesso a piedi o a nuoto**: varchi uguali dalle due parti, e il layout che unisce varchi, porte e sacche di quattro o più
caselle scavando sentieri nella vegetazione e nella roccia (`layout.ts`), cose solide mai su un punto di articolazione (ADR-0064), il molo
che tocca l'acqua (ADR-0230), lo stretto mai più lungo di 144 caselle (ADR-0229). Il rilievo non entra mai nel conto, perché non è mai un
ostacolo (ADR-0048, punto 2: due livelli fra vicini, mezza casella).

Con il rilievo vero entra: un dirupo di sei livelli sembra invalicabile e deve esserlo, e una cima di terrazze dove nessun gradino sale
è un posto dove non si arriva camminando.

### 2.2 La proposta: la rete, le enclavi, le zone

- **I gradini** (la regola della vista, che resta): fra due caselle aperte vicine un dislivello fino a `STEP` (2 livelli, mezza casella)
  **si cammina sempre**; oltre, **non si cammina mai**; fino a `JUMP` (4 livelli) si salta; fino a `CLIMB` (12 livelli, 3 caselle, una
  proposta) si arrampica chi ha il mezzo; oltre, solo una scala, un ponte, una rampa costruita. L'acqua che si nuota unisce l'acqua
  qualunque sia il suo letto.
- **La rete** (ciò che il kernel garantisce, come oggi): i quattro varchi, le porte, la partenza, le case, i posti di lavoro e i cantieri
  degli individui, i moli, ciò che il Cartografo mette per i viandanti, sono connessi a piedi o a nuoto **sul grafo dei gradini**. Dove non
  lo sono, il kernel scava: un sentiero dove una casella è solida (come oggi), **una rampa** dove un dislivello supera il gradino (la via
  più economica, poi i suoi livelli pareggiati dall'estremo raggiunto, così ogni gradino della rampa è entro `STEP`: un sentiero di
  montagna a tornanti). La rampa è derivata come il sentiero: deterministica dal piano, mai salvata.
- **Le enclavi**: ciò che si cammina per quattro caselle o più e solo un dirupo divide dalla rete. Restano enclavi **dove la regione lo
  concede**, altrimenti il kernel le unisce con una rampa come oggi unisce le sacche; ognuna ha il suo **passo** (il dirupo più basso fra lei
  e la rete) e il mezzo che quel passo chiede. Il piano le segna (derivate, non salvate): il Cartografo può mettervi qualcosa col posto
  `enclave` (il tesoro sulla mesa, il nido sulla cengia), il kernel non vi mette niente che il mondo dia per raggiungibile.
- **Le zone, cioè l'asprezza delle regioni.** Il kernel misura dal rilievo di ogni luogo, senza chiamate, quanto è aspro: **piana** e
  **collinare** (nessun dirupo, o pochi: tutto unito come oggi), **montuosa** (enclavi fino a una quota delle caselle del luogo, ogni passo
  entro `CLIMB`), **impervia** (enclavi fino a una quota più alta, passi anche oltre, per chi costruisce). Il master può dichiarare
  l'asprezza di una regione sua, come oggi ne dichiara la gravità (ADR-0226: `Region.gravity`), e il Cartografo la legge nella richiesta
  del piano. Le quote sono numeri del kernel (proposta: montuosa 15 %, impervia 35 %), da misurare nel gioco.

**Misurato** col rilievo del prototipo, sui 300 luoghi (con l'acqua che si nuota e i boschi solidi, come oggi):

| | a luogo |
|---|---:|
| fra due caselle aperte vicine, entro un gradino / un salto / un'arrampicata di 3 caselle / oltre | 94,9 % / 1,4 % / 3,4 % / 0,3 % |
| rampe per unire i varchi (la rete), e i livelli di terra mossi | 0,48, 3,8 livelli |
| sacche divise da caselle solide (il layout di oggi le unisce con un sentiero) | 0,85 |
| enclavi divise da un dirupo (4 caselle o più): col salto / con un'arrampicata / oltre | 0,40: 58 / 59 / 3 su 120 (2 416 caselle, il 2,5 % del mondo) |
| la regola di oggi alla lettera, ogni enclave unita: rampe e livelli mossi; enclavi che nessuna rampa raggiunge | 0,89, 5,2 livelli; 0 |
| caselle aperte raggiunte dal primo varco, prima dei sentieri delle sacche | 82,9 % |

Due conseguenze. Il kernel **saprebbe** tenere la regola di oggi alla lettera anche con le montagne (0,89 rampe a luogo: una rampa ogni due
luoghi e mezzo in più di quelle della rete), quindi le enclavi si tengono perché il gioco le vuole, non perché il kernel non sappia toglierle. E
con un generatore così le enclavi sono poche (una ogni due luoghi e mezzo) e per metà si raggiungono saltando: l'arrampicata ha un senso
solo se la regione aspra ne lascia di più, cioè se il generatore del rilievo lo vuole (il Cartografo, il master).

### 2.3 I mezzi e «Altro…»

La regola rivista funziona solo se i mezzi esistono. Quasi tutti esistono già come effetti (ADR-0014, ADR-0096) o come primitive:

| ostacolo | mezzo | come lo prova il viandante | primitiva |
|---|---|---|---|
| dirupo fino a 1 casella | il salto | Spazio | c'è (`jumpUp`, ADR-0080, ADR-0226) |
| dirupo fino a 3 caselle | arrampicarsi | «Arrampicati» nel menu della casella del dirupo, con la corda o la piccozza (`bonus.climb` di ciò che si indossa o si impugna), o «Altro…: mi arrampico» che il Narratore giudica e dà lo stato `climb` | **nuova**: `climb`, come il salto ma lenta e con la fatica (§ 3.5) |
| dirupo qualunque | i gradini nella roccia | «Altro…: scavo dei gradini» → l'effetto `relief` | c'è (`kernel.dig`, ADR-0094; al più 8 livelli a volta, 16 in tutto) |
| dirupo qualunque | la scala a pioli | posare una scala presa (`takeable`, ADR-0168): una cosa con una forma i cui pavimenti salgono | c'è quasi: i pavimenti delle forme si camminano (`floorAt`); manca il posarla contro il dirupo (`putCarried` non guarda la parete) |
| burrone, fiume, fossato | il ponte | un'impresa (`costruisci`, ADR-0147) o un'asse posata attraverso | c'è l'impresa; il ponte come struttura che scavalca è nuovo (il lotto oggi è piano e intero) |
| masso che chiude un passo | la leva, spingere | «Altro…: faccio leva col palo» → `push`, `destroy` o `terrain` | ci sono |
| acqua profonda, una corrente | nuotare, la barca | camminare in acqua, il timone | ci sono (T438, T439) |
| il fondale | immergersi | «Immergiti» nell'acqua profonda | **nuova**: `dive` (§ 3.3) |

Il Narratore, giudicando un'azione libera sull'ostacolo, sceglie fra questi: il kernel applica l'effetto entro i suoi tetti, e la regola
10 resta vera perché un mezzo cambia il mondo (un gradino scavato, una scala posata) o il corpo (lo stato `climb` per qualche secondo), mai
la regola. Ciò che il viandante scava resta (`digs`): **un giocatore può togliere un'enclave**, e va bene così (regola 3).

### 2.4 Cosa garantisce il kernel e cosa no

Garantisce:

1. ciò che sembra percorribile lo è e ciò che sembra invalicabile lo è: un gradino entro `STEP` si cammina sempre, un dirupo oltre `STEP`
   mai (`free` e `bodyFree` con il dislivello, il server con lo stesso controllo), oltre `JUMP` non si salta, oltre `CLIMB` non si
   arrampica nessuno;
2. la rete del § 2.2, sul grafo dei gradini, con i sentieri e le rampe che scava; i varchi uguali dalle due parti (il livello del varco è
   una funzione del lato, come la sua posizione);
3. le enclavi solo dove la regione lo concede, entro la quota, ognuna col suo passo entro il mezzo che il mondo ha (senza l'arrampicata nel
   mondo, solo passi entro `JUMP`), mai un varco, mai l'unica via fra due varchi, mai ciò che il mondo dà per raggiungibile;
4. gli individui vanno solo sulla rete (non saltano, non si arrampicano), come oggi non nuotano.

Non garantisce: che il viandante trovi il mezzo; che «Altro…» riesca (lo giudica il Narratore); che un'enclave resti un'enclave; che una
rampa scavata dal kernel sia bella (è un sentiero di montagna, non un'opera).

### 2.5 Il path-finding comodo

Il gioco si muove bene da quando c'è la via (T245b, T299): resta, con un controllo in più. Il grafo dei gradini è la stessa cosa del
controllo del passo di `findRoute` (`step(c, r, nc, nr)`, che oggi guarda le forme): vi si aggiunge il dislivello del terreno, e la via
gira attorno al dirupo come oggi gira attorno al muro. Costa poco: il grafo di un luogo con le rampe è 0,17 ms. Il viandante non ha una via
automatica (cammina con i tasti): per lui conta la collisione, che al bordo di un dirupo lo ferma come davanti a una casella solida, e il
taglio verso la camera che gli fa vedere dove va (§ 3.2).

### 2.6 Il testo della regola (proposta per `AGENTS.md`)

> 10. **Ciò che sembra invalicabile lo è, ciò che sembra percorribile lo è**: il terreno blocca a caselle, i modelli con i loro voxel; un
> gradino fino a mezza casella si cammina sempre, un dirupo oltre mai, oltre una casella non si salta, oltre tre non si arrampica nessuno
> (`STEP`, `JUMP`, `CLIMB`); … [l'acqua, il vuoto e le capsule come oggi] … ogni luogo ha la sua **rete**, connessa a piedi o a nuoto a
> gradini (varchi, porte, la partenza, le case e i lavori degli individui, i moli, ciò che il mondo dà per raggiungibile), con i sentieri e
> le rampe scavati dal kernel; oltre la rete solo le **enclavi** che l'asprezza della regione concede, ognuna col suo passo entro un mezzo
> del mondo (ADR-0239) … [i lotti, i timbri e il molo come oggi].

---

## 3. Il rilievo con picchi e avvallamenti, il fondale, il sottosuolo (b)

### 3.1 Il rilievo vero

- **Chi lo fa**: il generatore, non `Hills`. Il Lua del generatore sa già dove sono montagne, mari e fiumi (la bozza); oggi il rilievo è un
  rumore a parte, e i due non si parlano (il lago sta dove dice il Lua, la conca dove dice `Hills`, `worldLevels` li mette d'accordo
  spianando). La proposta: il generatore restituisce **anche i livelli** del luogo (una seconda funzione, `generate_relief(cx, cy, seed,
  size)`, una stringa di livelli come `generate_chunk` restituisce i codici), con massicci dove dice montagna, conche dove dice acqua, il
  letto sotto l'acqua. Il kernel lo legge senza fidarsi (al più `PEAK` livelli sopra il mare e `DEPTH` sotto, interi) e ci mette le sue
  garanzie: i varchi, le rampe, i lotti in piano, il mare al suo livello. Misurato: 6-7,5 ms a luogo in Lua (una bozza e mezza), 0,22 ms in
  TypeScript. Resta nel Lua perché il Concilio lo possa riscrivere come la bozza; il kernel, come oggi per le isole (ADR-0229), fa solo ciò
  che deve garantire.
- **Che cosa fa**: il prototipo dà livelli da −26 (il letto del mare) a 62 (15,5 caselle), massicci sul 41 % delle caselle, e il 95 % dei
  vicini entro un gradino. Le montagne smettono di essere caselle solide: `k` diventa roccia nuda che si cammina, con le sue terrazze, e `r`
  resta il masso.
- **I lotti**: oggi un lotto è piano alla mediana dei suoi livelli e il resto si piega verso di lui (`chunkLevels`); su una terrazza il lotto
  è piano dentro la terrazza, e un lotto che scavalca un dirupo non si dà (il Cartografo lo sa dalla richiesta: il rilievo del luogo, le
  terrazze, i dirupi). Il blocco di più luoghi sta su un livello solo (`blockLevel`, ADR-0206): in montagna è un altopiano.
- **I fiumi**: il generatore di oggi mette i fiumi dove un rumore lo dice, in piano. Col rilievo vero un fiume scende: lo specchio non è
  più piano per intero, ed è l'automa dell'acqua (§ 5) a dire la sua superficie.
- **I pianeti** (ADR-0236) hanno già il loro rilievo per fascia (`BandedRelief`): il loro generatore lo darebbe allo stesso modo.

### 3.2 La camera e il taglio verso la camera

Il rilievo vero nasconde: misurato con la camera di oggi (54° da sud, la linea dal mezzo del corpo alla camera), un corpo in piedi è
coperto dal terreno verso la camera sul **4,6 %** delle caselle aperte (oggi sullo 0 %). Il rimedio esiste quasi: il taglio sotto terra di
T416 è un disco allungato verso la camera (`inCutDisc`, `towardsCamera`) che non disegna ciò che sta sopra un'altezza e mette i tappi
dello strato a cui ogni colonna arriva. **Il taglio verso la camera** è lo stesso disco, acceso quando il terreno davanti copre il viandante
(`hiddenFromCamera` del prototipo, a ogni cambio di casella), all'altezza della sua testa: le colonne davanti si fermano lì e mostrano le
bande degli strati (`strataSide`). Non tocca la corona (regola 8): toglie soltanto, come il taglio di T416.

### 3.3 Il fondale

- **Il letto**: una colonna come la terra, al livello del letto (`trueRelief`: il mare da 8 a 28 livelli sotto la superficie, l'acqua bassa
  da 2 a 7, la secca a 1, il porto e il molo come oggi), con lo strato in cima (fango, sabbia, roccia della secca); la superficie sopra, un
  po' trasparente dove si vede il fondo. La mesh a colonne del prototipo lo disegna già (1 268 triangoli a luogo con i letti). Il kernel lo
  sa per chi si immerge e per l'automa dell'acqua (il letto è il suo `bed`); oggi `water.ts` lo inventa (`DEEP` = 2 livelli).
- **I dettagli**: ciò che il Cartografo mette sul letto con un posto nuovo, `underwater` (relitti, anfore, coralli, alghe, la cassa
  affondata), come oggi `under` per la cantina (T417); lo Scultore li ha già nelle sue classi (pianta, roccia, oggetto, la nave affondata è
  un relitto di T443). Il fondale ha i suoi strati (§ 4).
- **Immergersi** (`dive`): nell'acqua profonda «Immergiti» (o un tasto) porta il corpo sotto la superficie, verso il letto, e il fiato è
  l'ossigeno di T446 (`breathingTick`: chi è sott'acqua è fuori dall'aria); si risale da sé o a fiato finito; il letto e ciò che vi giace
  si raggiungono solo così. A schermo la superficie si taglia attorno a chi è sotto (il disco di T416 un'altra volta) con la nebbia
  dell'acqua. In molti, come il nuoto: la posizione del corpo con la sua quota (`pos.z`), controllata dal server come il salto.

### 3.4 Il sottosuolo

In colonne gli strati restano **un materiale e un aspetto**: nei tagli, sui fianchi dei dirupi (le bande del prototipo), nelle pareti di
una cantina, e una cosa che il mondo sa (`world.stratum_at`, § 4.2). **Le grotte non sono terreno**: in una colonna non c'è un vuoto
sotto il pieno. Una grotta è una struttura che scende, come la cantina di ADR-0091 («uno spazio sotterraneo è il pezzo di una struttura
sotto il suolo»): lo Scultore la scolpisce con la sua entrata, il kernel apre il buco (T415) e la camera la taglia (T416). È coerente con
ciò che l'autore ha già deciso per i sotterranei (mai un mondo sotto il mondo) e costa solo dove c'è una grotta.

La via in voxel darebbe grotte naturali dappertutto (il prototipo ne scava; i suoi pavimenti 3D raggiunti dal primo varco sono il 36 %:
grotte e terrazze chiuse), al prezzo del § 1: è la via di un'altra era.

### 3.5 Arrampicarsi

Un movimento del kernel come il salto (`jump`, ADR-0080): sul bordo di un dirupo entro la portata del mezzo (`bonus.climb`, 1-12 livelli,
il più grande di ciò che si indossa o si impugna; lo stato `climb` che un effetto dà per qualche secondo), «Arrampicati» porta il corpo in
cima (o in fondo) in un tempo che cresce col dislivello, con la fatica (l'energia, come il nuoto di ADR-0225) e senza poter fare altro;
interrotto (un colpo, l'energia a zero), il corpo torna giù. Il kernel lo verifica come il salto (`jumpUp`): la cima è un punto dove il
corpo sta, a portata. Gli individui no. In molti il server lo conduce come il salto (che oggi in molti è solo da soli: va aperto lì per
entrambi).

---

## 4. Gli strati come concetto trasversale (c)

### 4.1 Le adiacenze in MarkovJunior

L'idea dell'autore: la profondità del terreno è fatta di strati, e ciò che sta sotto cosa lo dicono regole esplicite. In MarkovJunior una
regola verticale è un motivo a due strati (il primo in alto, come nell'originale): `<all in="G E" out="G T"/>` è «sotto l'erba, la terra».
Il prototipo (`STRATA_XML` in `lab/terreno-3d/vie.ts`) scrive gli strati di un luogo su S × S × D con la superficie ferma in cima:

```xml
<sequence values="EGSRNMWTCADBOQ" symmetry="(xy)">
  <all in="G E" out="G T"/>   <!-- sotto l'erba la terra -->
  <all in="S E" out="S A"/>   <!-- sotto la sabbia la sabbia compatta -->
  <all in="W E" out="W D"/>   <!-- sotto l'acqua il fango -->
  <all in="R E" out="R B"/>   <!-- sotto la roccia la roccia viva -->
  <prl in="T E" out="T T" p="0.5" steps="1"/>   <!-- quanto è spessa la terra -->
  <all in="T E" out="T C"/>   <!-- poi l'argilla -->
  <prl in="C E" out="C C" p="0.5" steps="2"/>
  <all in="C E" out="C B"/>   <!-- poi la roccia viva -->
  <all in="B E" out="B B"/>   <!-- fino in fondo -->
  <one in="B" out="O" steps="3"/>  <prl in="OB" out="OO" p="0.3" steps="3"/>  <!-- una vena nella roccia -->
  <prl in="D C" out="D Q" p="0.05" steps="1"/>  <!-- una falda sotto il fango -->
</sequence>
```

(nel file anche il nevaio e il fango). Ne escono colonne come `GTTCCBB` sotto il prato, `WDDCBBB` sotto l'acqua, `SAACCBB` sotto la
sabbia, `RBBBBBB` sotto la roccia. Misurato: **2,1 ms a luogo** a una cella per casella (18 × 18 × 7), 7,1 a due, 55 a quattro. Per un
luogo è un quinto della bozza in Lua.

**La lezione di `symmetry`**: senza `symmetry="(xy)"` sulla radice MarkovJunior prova ogni regola in ogni verso del cubo (è il suo
predefinito in 3D, ed è per questo che `Hills` scrive `symmetry="()"`): «sotto l'erba la terra» diventa anche «accanto all'erba la terra»,
e l'argilla del prato entra di due colonne nella roccia accanto (misurato nel prototipo prima di correggerlo). Il validatore di un
programma degli strati deve volere una simmetria che tiene l'alto e il basso, e il prompt del Cartografo dirlo.

### 4.2 Chi li scrive e chi li legge

| chi | che cosa | dove |
|---|---|---|
| **Cartografo** | alla Genesi i terreni degli strati (T418 li ha nel seme; il Cartografo li riscrive per il mondo: sotto la steppa il loess, sotto il vulcano il basalto) e, con ogni ambiente, il suo programma `strata` (le adiacenze, provate sulle bozze di prova come il layout, `sampleDrafts`); nel piano di un luogo ciò che c'è sotto (la falda, la vena, la grotta come struttura, il relitto sepolto) | `genesis.ts`, `cartography.ts`, `EnvironmentDef` |
| **Scultore Architetto** (T458) | la cantina che scende nello strato dove sta: le sue pareti nel materiale dello strato (l'argilla, la roccia viva), le fondamenta sulla roccia; la richiesta gli dice gli strati sotto il lotto | `SculptRequest`, `part-cellar` |
| **Scenografo** | gli interni sotto il suolo arredati per strato (la cantina nell'argilla è fresca: botti; nella roccia: la cripta) | `interior.design` |
| **Narratore** | sa che cosa c'è sotto un luogo (nel contesto del piano: «sotto il villaggio argilla e una falda»), ne fa leggende, mestieri (il cavatore, il pozzaro), oggetti (l'argilla del vasaio) | il contesto del grafo (`focus`) |
| **Lua** | `world.stratum_at(x, y, depth)` in sola lettura: il pozzo che trova la falda, il minatore che trova la vena | `Host`, `prelude.lua` |
| **kernel** | il programma gira alla pianificazione del luogo (2,1 ms), il risultato va nel piano (`strata`, 6 righe nei piani nuovi), i piani di prima tengono le loro 4 dalla bozza | `strata.ts`, `ChunkPlan` |

### 4.3 I pianeti

Visti dallo spazio sono livelli di dettaglio (`PlanetLod`, ADR-0236): gli strati non si vedono. Sulla loro terra valgono come altrove, con
la tavolozza del pianeta; il Cartografo del pianeta li scrive alla Genesi con gli altri terreni. Poco da fare, come diceva l'autore.

### 4.4 L'alternativa: il terreno tutto in MarkovJunior 3D

**Che cos'è**: ogni luogo una griglia di voxel (r per casella, cubici: a 4 un voxel è un livello) fatta da un programma MarkovJunior 3D;
il kernel legge da lei il suolo (i pavimenti di ogni colonna, anche sotto, nelle grotte), la collisione, le vie, dove si posa; il renderer
la disegna come un modello. Il prototipo (`terrainXml`, `voxelPlace`) fa scrivere al kernel la grande scala (il rilievo vero ai voxel: la
terra sotto la superficie, il letto e l'acqua) e al programma il dettaglio (strati, vene, grotte, alghe e rocce sul letto), perché la grande
scala in MarkovJunior luogo per luogo costa 745-918 ms e ha i bordi (§ 1.2).

**Che cosa costa**, misurato (§ 1): a 4 per casella 322 ms di programma e 109 di mesh a luogo nei luoghi più mossi (123 e 30 nel browser
sui luoghi della finestra), 405 KB di griglia a luogo, 1 MB di mesh; a 2 per casella 25 e 15 ms, 52 KB; a 8, 5,7 s. **Che cosa cambia**:
tutto ciò che legge il terreno (`tileAt`, `groundAt`, `floorAt`, `free`, il layout e i timbri, le vie, i posti delle cose, l'acqua, il filo
del multigiocatore, i piani in `maps/`, il renderer) leggerebbe voxel, e il kernel dovrebbe tenere entrambe le rappresentazioni per gli
universi di prima. In molti il server fa e tiene le griglie di tutti i luoghi caricati (97 MB per 240 luoghi a 4 per casella) e ogni client
le rifà per disegnarle (MarkovJunior è deterministico voxel per voxel, ADR-0142, quindi non vanno sul filo, ma costano a tutti).

**Che cosa darebbe**: grotte e archi naturali, sporgenze, il fondale scolpito, un mondo che si scava davvero in 3D. È la via giusta per
un gioco di scavo; per questo gioco, visto dall'alto in 3/4 con la camera a 15 caselle, è soprattutto una differenza sotto il suolo, che le
strutture che scendono danno dove serve.

**La raccomandazione**: non ora. Se un giorno il sottosuolo vorrà grotte naturali dappertutto, la via è ibrida: le colonne restano la
superficie e un **sottosuolo in voxel a 2 per casella** (52 KB e 25 ms a luogo, solo sotto il suolo e solo nei luoghi che lo chiedono) le
completa, in un worker, con un contratto nuovo (§ 6).

### 4.5 La divisione fra Lua, MarkovJunior e il kernel

| scala | chi | perché | costo misurato |
|---|---|---|---|
| il mondo: continenti, biomi, massicci, fiumi, i livelli | il Lua del generatore (`generate_chunk`, `generate_relief`) | continuo e senza bordi, una casella alla volta, riscrivibile dal Concilio | 10 ms la bozza, 6-7,5 il rilievo, a luogo |
| ciò che deve essere garantito: isole, stretti, approdi, varchi, rampe, lotti in piano, l'acqua in piano | il kernel (TypeScript) | il pavimento (regola 7) | 0,2-0,4 ms a luogo |
| il luogo in pianta: strade, borghi, timbri | MarkovJunior 2D del Cartografo (gli ambienti) | il dettaglio, regole leggibili | 0,45 ms |
| il luogo in profondità: strati, falde, vene, il fondale | MarkovJunior 3D del Cartografo (il programma `strata`) | le adiacenze come regole | 2,1 ms |
| la fisica che si muove: l'acqua, il vento | il kernel, automi parametrici | per cella e per passo, deterministica | 0,34 ms a tick |
| le regole discrete che si muovono: il fuoco, la crescita, la muffa | MarkovJunior su uno `Stepper`, o la tabella del kernel | regole del Concilio, entro tetti | 0,4-0,6 ms a passo |
| l'aspetto che si muove: increspature, schiuma, scia, la corrente a schermo | la GPU (shader) | fine, solo disegno, niente sul filo | — |
| ciò che accade: una sorgente, un incendio, un mulino, un incantesimo | il Lua dei moduli, a eventi (`world.field_*`) | la logica | a evento, mai a cella |

---

## 5. L'acqua e il vento come automi cellulari (d)

### 5.1 Perché oggi sembra una piscina

L'acqua di oggi è ferma per costruzione: ogni specchio è piano per intero (`worldLevels`), il mare al suo livello, un fiume è un lago
lungo. L'automa del kernel (ADR-0094) si sveglia solo quando il suolo cambia e si riaddormenta; le onde sono tre sinusoidi nel vertex
shader, uguali dappertutto, ferme dove l'acqua tocca altro (T451). Niente scorre, niente spinge, niente gira attorno a uno scoglio.

### 5.2 L'acqua a tubi virtuali

Il modello dei tubi virtuali (O'Brien e Hodgins 1995; Mei, Decaudin e Hu 2007, quello dell'erosione sulla GPU): ogni cella una colonna
d'acqua sul suo letto e un flusso verso ognuno dei quattro vicini che la differenza delle superfici accelera; da una cella non esce più di
ciò che ha; la profondità cambia di ciò che entra ed esce. Ne vengono **onde che viaggiano** e si riflettono sulle rive, **acqua che scende**
e si ferma in piano, **correnti** (la velocità di una cella dai flussi che la attraversano: ciò che spinge chi nuota e uno scafo), la
quantità conservata (−9,7e−8 dopo mille passi a finestra chiusa). Il mare aperto è una sorgente che tiene il suo livello. Il prototipo è
`PipesWater` (un centinaio di righe, solo aritmetica IEEE su `Float32Array`: gli stessi passi danno la stessa acqua in ogni motore).

Che cosa serve oltre l'automa:

- **Le sorgenti e la bozza**: un fiume scorre se ha una sorgente a monte e il mare a valle. Il generatore dice dove nasce (la sorgente, un
  codice o un segno della bozza) e il kernel ci tiene l'acqua; i laghi fermi sono quelli la cui superficie è in piano sulla bozza (nel
  prototipo i laghi nascevano storti e la finestra ha perso il 29 % dell'acqua verso il mare: il rilievo vero e l'automa vanno disegnati
  insieme).
- **La superficie è dell'automa**: dove l'automa gira, il livello dell'acqua lo dice lui (come oggi le caselle che hanno scorso,
  `pinned`, T51b), e il nuoto, la profondità e lo scafo leggono quella.
- **Il sonno**: una cella in equilibrio (tutti i flussi sotto una soglia) non si calcola; una finestra con un lago fermo costa poco, un
  fiume costa la sua lunghezza. Il prototipo non dorme: i suoi 0,34 ms sono il caso pieno.
- **Lo scavo** (`dig`, «Altro…» che scava, l'incantesimo che alza il suolo) diventa un cambio del letto dell'automa: `water.ts`, 35 volte
  più caro a cella, si scioglie in lui.
- **La finestra**: l'automa gira sui luoghi caricati, con il bordo della finestra come un muro o come il mare; quando la finestra si sposta i
  luoghi nuovi entrano con l'acqua del loro piano e quelli che escono lasciano la loro nel piano (come oggi `rest`).

### 5.3 Il vento

Un reticolo di Boltzmann D2Q9 (`LbmWind`): nove popolazioni a cella che scorrono ai vicini e si rilassano verso l'equilibrio, gli ostacoli
(ciò che sta più in alto dello strato del vento: un massiccio, un edificio) le rimandano indietro, così il vento gira attorno alle
montagne e ha il suo ridosso e le sue raffiche. **A una cella ogni tre caselle e 10 passi al secondo costa 1 ms al secondo**: il vento
cambia piano, e una vela, un mulino, il fumo, il fuoco che si allarga sottovento, l'erba e gli alberi (oggi un vento del materiale) lo
leggono. Il vento dominante viene dal tempo del mondo (una funzione lenta del giorno e del seme, come la luce: niente orologio).

**Le barche a vela**: oggi la vela dà `power` da Lua (ADR-0227). Con il vento del kernel `power` diventa l'angolo fra la vela e il vento nel
punto della nave (la spinta di bolina, di traverso, in poppa), e la corrente dell'acqua sposta lo scafo: il veicolo ha già spinta, giro e
abbrivio, servono due letture in più nel passo (`vehicleStep`).

### 5.4 Due strati: la fisica nel kernel, l'aspetto sulla GPU

| | la fisica | l'aspetto |
|---|---|---|
| dove gira | nel kernel (da soli nel thread della pagina, in molti sul server) | nel renderer, sulla GPU (due texture che si scambiano, uno shader a passo) |
| risoluzione | una cella per casella (l'acqua), una ogni tre (il vento) | quattro celle per casella o più |
| che cosa fa | correnti che spingono, livelli che il corpo e lo scafo leggono, il vento della vela | increspature, la scia che si allarga, i cerchi di chi nuota, l'acqua che corre lungo il fiume, la schiuma dove la corrente batte |
| deterministica | sì, voxel per voxel come MarkovJunior (aritmetica IEEE, nessun `Math.sin`, il caso dal seme) | no, non serve: ogni client il suo |
| costo misurato | 0,34 ms a tick (nel browser 0,87 con la superficie e il vento) | sulla CPU niente; il passo della fisica a quattro celle per casella costerebbe 4,9 ms a tick sulla CPU |
| sul filo | il vento grossolano (1 260 celle, due byte a cella, 2 Hz: 5 KB al secondo a client); l'acqua no (la ricalcolano i client per l'aspetto, i corpi li muove il server) | niente |

### 5.5 La primitiva del kernel: parametrica o programmatica, esposta a chi, con quali tetti

**La primitiva** (proposta, `src/kernel/automata.ts`): un automa è un campo sulla finestra caricata, di una **famiglia del kernel**, con i
**parametri come dati**:

| famiglia | che cos'è | parametri | costo per cella e passo |
|---|---|---|---:|
| `flow` | i tubi virtuali: acqua (e lava, sabbia mobile) | gravità, smorzamento, chi è sorgente (terreni), chi è muro | 35 ns |
| `wind` | il reticolo D2Q9 | viscosità, il vento dominante, l'altezza dello strato, chi è ostacolo | 90 ns |
| `diffuse` | uno scalare che si spande e svanisce: calore, fumo, odore, umidità | velocità, decadimento, sorgenti, il vento che lo porta | 7 ns |
| `table` | stati discreti con una tabella: fuoco, crescita, marciume, il contagio dei campi | gli stati (≤ 16), per stato e numero di vicini nello stato contato il prossimo e la probabilità (dal seme e dal passo, mai `Math.random`) | 42 ns |
| `rules` | stati discreti scritti come un programma MarkovJunior (`convolution`, `prl`, `all`, `one`) su uno `Stepper` | il programma, entro `WORLD_NODE_LIMITS`, con `symmetry="(xy)"` | 65 ns |

- **Parametrica, con un'uscita programmatica.** La parametrica copre la fisica (acqua, vento, calore) con codice del kernel che si
  misura e non si rompe; l'uscita programmatica è MarkovJunior, il linguaggio che il Concilio già scrive, per le regole discrete. **Non il
  Lua**: un passo di Lua su 9 720 celle costa 14 ms (34 volte la tabella), una chiamata a cella 63 ms; un automa in Lua sarebbe anche il
  modo più semplice di fermare il tick (il limite di istruzioni lo taglierebbe a metà passo, e un campo a metà non è deterministico).
- **Chi lo scrive**: il **Fisico**, alla Genesi con la natura del mondo (quali automi il mondo ha e con che parametri) e a mondo acceso su
  richiesta del Referente (come rimodella oggi i terreni, ADR-0235): `physics.automaton`, con i motivi del rifiuto se esce dai tetti.
  Il Cartografo dice dove sono le sorgenti nella bozza; l'Ingegnere scrive i moduli che leggono e scrivono i campi.
- **Chi lo usa**: il **Lua** legge un campione (`world.field(id, x, y)`: un numero, o un vettore per l'acqua e il vento, una copia) e mette
  una sorgente o un pozzo (`world.field_add(id, x, y, quanto)`: entro un tetto a chiamata e a tick, NaN ignorato); gli **effetti** (un
  incantesimo che fa piovere, un fuoco acceso: `fire` del seme) diventano sorgenti; il **kernel** ne legge le correnti per i corpi e gli scafi;
  il **renderer** ne legge i campi per l'aspetto. Il **client** mai: non scrive un campo, e in molti riceve solo ciò che il § 5.4 dice.
- **I tetti**: celle per automa = la finestra caricata alla sua risoluzione (al più una cella per casella; due solo per `table` e `rules`,
  che sono byte); al più 6 automi; passi al secondo per famiglia (`flow` 60, `wind` 10, gli altri 10); **il carico** = Σ celle × passi al
  secondo × costo per cella misurato ≤ un bilancio fisso (proposta: 1,5 ms a tick a 60 Hz, il 9 % del frame), calcolato quando il mondo
  si carica e mai a tempo (un tetto a tempo non sarebbe deterministico). Il ritmo del mondo (`pace: hold`, ADR-0196) li ferma come ferma
  ciò che il mondo fa da sé.
- **I semi**: il caso di `table` e `rules` viene dal seme del mondo, dalla cella e dal passo (come il prototipo, `hash32`); niente
  orologio. Server e partita da soli danno lo stesso campo dagli stessi passi.

### 5.6 Il multigiocatore e la sicurezza

- **Il server** fa girare gli automi fisici sui luoghi caricati di tutti i viandanti (una finestra per gruppo di luoghi vicini: due
  viandanti lontani non pagano il mare fra loro) e muove i corpi con le correnti come muove oggi il veicolo; ai client il vento grossolano
  a elenco (regola 8f, un campo nuovo di `PlaceView` o un messaggio a 2 Hz) e niente acqua; il client fa la sua acqua per l'aspetto.
- **Le superfici nuove**, con una voce nel registro (`docs/sicurezza/registro.md`) quando nascono: `world.field_add` (un modulo che inonda il
  mondo: il tetto a chiamata e a tick, il carico fisso); il campo sul filo (a elenco, quantizzato, nient'altro); l'arrampicata e
  l'immersione nel passo del server (la quota controllata come il salto: un client che si dice in cima a un dirupo senza il mezzo lo riporta
  giù); il costo di un mondo di molti (gli automi entro il bilancio, regola 8e e 8g: l'acqua e il vento sulla finestra di un viandante
  tengono circa 370 KB).

---

## 6. I contratti e le migrazioni (f)

Il contratto (ADR-0136) cambia quando cambiano i formati, il senso di una primitiva, le regole del terreno o il caso per gli universi che
esistono. Con la natura del mondo (ADR-0224) un cambio acceso solo dove la natura lo dice, scelta alla Genesi e ferma, è aggiuntivo: è
la strada di T432 e di T437-T449.

| cambio | contratto | perché | migrazione |
|---|---|---|---|
| la regola 10 della rete e delle enclavi, i gradini in `free`, nel layout, nelle vie | aggiuntivo | con il rilievo di oggi nessun dislivello supera `STEP`: layout, collisione e vie danno gli stessi risultati (lo dice `tests/luoghi-campione.test.ts`, che va tenuto verde) | nessuna |
| il rilievo vero (`nature.relief: 'true'`, `generate_relief`) | aggiuntivo | solo i mondi nuovi la cui natura lo dice; il generatore del seme legge la natura e senza di lei resta `Hills` (la trappola 1 di T432: un cambio del seme arriva agli universi senza Genesi) | nessuna |
| `k` che si cammina | aggiuntivo | la tavolozza la scrive la Genesi di ogni universo (`toPalette`); i mondi di prima tengono `k` solido | nessuna |
| il letto sotto l'acqua | aggiuntivo | derivato dal rilievo; senza il rilievo vero il letto è quello di `water.ts` (`DEEP`) | nessuna |
| gli strati in MarkovJunior, 6 righe | aggiuntivo con un segno | i piani nuovi dicono `strataDepth: 6` (come `vpt` e `swim`, ADR-0211, ADR-0225), quelli di prima tengono le 4 righe della bozza; `readStrata` accetta le due | nessuna |
| arrampicarsi, immergersi | aggiuntivo | primitive nuove, un bonus nuovo (`climb`), un posto nuovo (`underwater`) | nessuna |
| gli automi (`nature.automata`) | aggiuntivo | assenti, nessun automa; `water.ts` resta per gli universi senza | nessuna |
| l'acqua che scorre al posto degli specchi piani | aggiuntivo dove un automa `flow` è dichiarato | la superficie dell'automa vale solo lì | nessuna |
| **il terreno in voxel** | **contratto nuovo, forse un'era** (`1.0`) | il suolo di ogni luogo cambia rappresentazione: collisione, vie, posti, layout e timbri, filo, piani, renderer | una migrazione può voxelizzare le colonne di oggi (equivalenti per chi cammina), ma ogni luogo di ogni universo verrebbe rifatto: in pratica un universo nuovo |

**Quindi tutto ciò che è raccomandato entra nella 0.10**, una `Z` per task, acceso dalla natura alla Genesi (le ambientazioni che lo
portano: la frontiera coi canyon e le mesa, i Pirati con le isole a picco sul mare, lo spazio con gli asteroidi frastagliati; il medioevo di
oggi può restare collinare o prenderlo, da decidere). Un universo nato con il rilievo vero su un kernel `0.10.N` non si apre su un kernel più
vecchio (`checkKernelVersion`), quindi non si rovina.

---

## 7. I task proposti, in ordine (da approvare)

Non sono nel backlog: li scrive chi pianifica, dopo le risposte dell'autore. Il costo è in percentuale di una settimana, come la riga
`- Pipeline:` (T437, la fisica rimodellabile, era il 4 %; T438, il nuoto, il 6 %).

| # | Task | Dipende da | Costo | Browser |
|---:|---|---|---:|---|
| 1 | **R0 · La regola 10 della rete e delle enclavi**: l'ADR (§ 8) e la regola in `AGENTS.md`; i gradini in `free`/`bodyFree`, nel passo del server e nel controllo del passo di `findRoute`; il grafo dei gradini e le rampe nel layout; le enclavi segnate nel piano (derivate), il posto `enclave`; l'asprezza delle regioni (misurata, e del master); inerte col rilievo di oggi (`luoghi-campione` verde), provato con un rilievo sintetico | — | 5 % | sì (un dirupo sintetico dalla console) |
| 2 | **R1 · Il rilievo vero**: `nature.relief` alla Genesi (ferma come `game`), `generate_relief` nel generatore del seme (massicci, terrazze, passi, conche, il letto), `Relief` che lo legge per quei mondi, `k` che si cammina, i lotti sulle terrazze, la richiesta del Cartografo col rilievo del luogo, l'ambientazione che lo porta | 1 | 6 % | sì |
| 3 | **R2 · Il taglio verso la camera**: il disco di T416 acceso quando il terreno copre il viandante, all'altezza della testa, con le bande degli strati | 2 | 3 % | sì |
| 4 | **R3 · Arrampicarsi**: `climb` come il salto ma lento e faticoso, `bonus.climb`, lo stato `climb` dagli effetti, «Arrampicati» nel menu della casella, il Narratore che lo sa dare; il salto e l'arrampicata nel passo del server | 1 | 4 % | sì |
| 5 | **S1 · Gli strati come regole**: il programma `strata` di ogni ambiente (il validatore lo prova sulle bozze e vuole `(xy)`), il Cartografo che lo scrive alla Genesi coi terreni degli strati (il seguito di T418), 6 righe nei piani nuovi (`strataDepth`); *fatto in T478, ADR-0248* | — | 4 % | sì (i tagli) |
| 6 | **S2 · Gli strati nel Concilio**: `world.stratum_at`, il contesto del Narratore, la richiesta dello Scultore Architetto (gli strati sotto il lotto: le pareti della cantina), le stanze dello Scenografo per strato | 5 | 3 % | no |
| 7 | **R4 · Il fondale**: il letto come colonna sotto una superficie trasparente, il posto `underwater` del Cartografo, gli strati del fondale | 2 | 3 % | sì |
| 8 | **R5 · Immergersi**: `dive`, il fiato sott'acqua (l'ossigeno di T446), la camera sott'acqua (il taglio della superficie, la nebbia), ciò che giace sul letto, il server | 7 | 5 % | sì |
| 9 | **A0 · La primitiva degli automi**: `src/kernel/automata.ts` (le famiglie, i parametri come dati, il carico fisso, i semi), il Fisico che li scrive (`physics.automaton`), `world.field`/`world.field_add`, il ritmo che li ferma, i test di determinismo | — | 6 % | no |
| 10 | **A1 · L'acqua che scorre**: `flow` sui luoghi caricati a una cella per casella, le sorgenti della bozza, la superficie dell'automa per il nuoto e lo scafo, le correnti, il sonno, lo scavo dentro di lui (al posto di `water.ts` dove c'è) | 2, 9 | 5 % | sì |
| 11 | **A2 · Il vento**: `wind` a una cella ogni tre caselle a 10 Hz, il vento dominante dal tempo del mondo, la vela che lo legge (`power`), il fumo e il fuoco sottovento, l'erba e gli alberi, il vento grossolano ai client | 9 | 4 % | sì |
| 12 | **A3 · L'acqua a schermo sulla GPU**: un campo d'onde a quattro celle per casella in due texture, mosso dalle correnti, dagli scafi e da chi nuota; niente nel kernel né sul filo | 10 | 4 % | sì |
| 13 | **M0 · La mesh dei luoghi in un worker** (il punto 3 di T331, che questo studio rimisura: 7,5 ms a luogo, 30 al p95, fino a tre a frame): `buildChunk` fuori dal thread principale, la stessa mesh byte per byte; *fatto in T486, ADR-0242* | — | 3 % | sì |
| — | *rinviato, solo se approvato*: **V0 · Il sottosuolo in voxel** a 2 per casella sotto le colonne, nei luoghi che lo chiedono, in un worker, con le grotte come pavimenti; contratto nuovo | 5, 13 | 10-12 % | sì |

**Totale**: 55 % (senza V0). **Le montagne con l'arrampicata** (1-4): 18 %. **Il mare sotto** (7-8): 8 %. **Gli strati** (5-6): 7 %.
**Gli automi** (9-12): 19 %. Ogni task che tocca `src/kernel/` sale di una `Z`; nessuno cambia il contratto. Ogni concetto nuovo ha la sua
voce nel glossario nello stesso commit (rete, enclave, passo, asprezza, gradino, rampa, arrampicarsi, immergersi, letto, automa, campo).

---

## 8. L'ADR proposto

Da copiare in `docs/adr/0239-…` con il primo task (R0), con le risposte dell'autore al posto delle raccomandazioni.

> **ADR-0239 — Il terreno vero a colonne, la regola 10 della rete e delle enclavi, gli automi del kernel**
>
> Stato: proposto (T459) · Modifica ADR-0048 (il rilievo non è più solo estetico), ADR-0064 e la regola 10 · Estende ADR-0091 (gli
> strati), ADR-0094 (l'acqua che scorre), ADR-0224 (la natura del mondo, la fisica come dati)
>
> **Contesto.** Il rilievo è un livello per casella e non è mai un ostacolo; le montagne sono caselle solide; il fondale e il sottosuolo
> non hanno dettagli; l'acqua è ferma. L'autore (20/11) vuole montagne vere, il fondale per il nuoto sott'acqua, gli strati come concetto
> del Concilio, l'acqua e il vento come automi, una regola 10 che ammetta luoghi da raggiungere con mezzi originali. Le misure di T459
> (`docs/design/terreno-3d.md`) dicono che il terreno in voxel costa 24 volte a luogo e 115 volte in memoria, e che sulla GPU di oggi
> nessuna via cambia il frame.
>
> **Decisione.**
> 1. **Colonne, non voxel**: una colonna per casella; il rilievo vero lo dà il generatore (`generate_relief`) dove la natura del mondo lo
>    dice (`nature.relief`, scelta alla Genesi e ferma); il kernel lo legge entro i suoi tetti e vi mette le garanzie (varchi, rampe, lotti,
>    il mare). Il letto sotto l'acqua è una colonna. Le grotte sono strutture che scendono (ADR-0091).
> 2. **La regola 10 della rete**: i gradini (`STEP` si cammina, oltre no; `JUMP`; `CLIMB`), la rete garantita a gradini con sentieri e
>    rampe, le enclavi solo dove l'asprezza della regione le concede, entro una quota, ognuna con un passo entro un mezzo del mondo;
>    gli individui solo sulla rete.
> 3. **I mezzi**: gli effetti di oggi (scavare, spingere, il terreno, costruire), più due movimenti del kernel, `climb` e `dive`.
> 4. **Gli strati** come programma MarkovJunior 3D per ambiente (le adiacenze, `symmetry="(xy)"`), scritti dal Cartografo, letti dallo
>    Scultore Architetto, dallo Scenografo, dal Narratore e da Lua (`world.stratum_at`); 6 righe nei piani nuovi.
> 5. **Gli automi** come primitiva parametrica del kernel (`flow`, `wind`, `diffuse`, `table`, e `rules` in MarkovJunior), i parametri
>    scritti dal Fisico entro un carico fisso, deterministici; il Lua mette sorgenti e legge campioni, mai un passo; l'aspetto fine sulla GPU.
>
> **Conseguenze.** Tutto aggiuntivo, acceso dalla natura: gli universi di oggi non se ne accorgono. Il 4,6 % delle caselle col rilievo vero
> nasconde il viandante: il taglio verso la camera è parte della decisione. La mesh dei luoghi va in un worker. Il voxel resta possibile
> per il solo sottosuolo, con un contratto nuovo.
>
> **Alternative scartate.** Il terreno tutto in voxel (§ 4.4: costo, memoria, contratto); il rilievo in MarkovJunior luogo per luogo (745-918
> ms, i bordi); gli automi in Lua (34-155 volte); la regola 10 di oggi alla lettera (fattibile, 0,89 rampe a luogo, ma senza enclavi non
> c'è niente da superare con un mezzo).

---

## 9. Le domande per l'autore

In [`docs/pipeline/domande/T459.md`](../pipeline/domande/T459.md), con le opzioni e la raccomandazione:

1. La via: colonne col rilievo vero (raccomandata) o il terreno in voxel (un contratto nuovo, 24 volte a luogo)?
2. Le enclavi: dove l'asprezza della regione le concede, con le quote del kernel (raccomandata), solo dove il Cartografo o il master le
   chiedono, o nessuna (la regola di oggi alla lettera, che il kernel sa tenere)?
3. Arrampicarsi come movimento del kernel con l'attrezzo (raccomandata), o solo i mezzi che ci sono già (scavare gradini, la scala)?
4. Gli automi: la fisica nel kernel a una cella per casella e l'aspetto sulla GPU (raccomandata), e in molti il vento ai client ma non
   l'acqua?
5. L'ordine: prima le montagne (1-4), o prima l'acqua e il vento per le vele (9-11, dopo i veicoli di T439 e T442)? E quali ambientazioni
   portano il rilievo vero?
