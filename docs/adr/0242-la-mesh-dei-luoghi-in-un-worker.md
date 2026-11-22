# ADR-0242 — La mesh dei luoghi in un worker

Data: 2026-11-22 · Stato: accettato (task T486 del backlog, M0 dello studio T459, riga 13 del § 7; il punto 3 di T331, step 45) ·
Riferimenti: ADR-0040 (il mondo in 3D), ADR-0048 (il terreno con le altezze), ADR-0091 (i sotterranei, i buchi delle cantine), ADR-0108
(i worker dei modelli e la cache delle forme), lo studio [`docs/design/terreno-3d.md`](../design/terreno-3d.md) § 1.6 punto 2, lo studio
[`docs/design/gpu.md`](../design/gpu.md) punto 3

## Contesto

La mesh del terreno di un luogo (`buildChunk`, `src/render/terrain.ts`) si faceva sul thread della pagina: 7,5 ms a luogo in mediana, 30 al
95° percentile (T459, in Node), e `syncChunks` ne faceva fino a tre a frame. All'arrivo in luoghi nuovi T331 contava 5 long task fino a 170
ms; misurato prima di questo task (`misura-frame.mjs`, Chrome headless sulla RTX 2070), il frame peggiore della mesh dei luoghi era 65 ms nel
caricamento a freddo (30 frame oltre 4 ms) e 61 ms nell'arrivo tre luoghi più in là (20 frame oltre 4 ms). Ogni terreno più ricco (il
rilievo vero, gli strati, il fondale dello studio T459) costerebbe di più, sullo stesso thread.

Una mesh di luogo legge del kernel poche cose: le sue caselle, le caselle e il suolo attorno (le sponde, i muri, la schiuma e le onde guardano
oltre il bordo), i buchi delle cantine suoi e dei quattro vicini, la tavolozza coi colori, quali modelli dei terreni sono pronti. Le legge
però attraverso `groundAt`, che oggi costa 1,15 µs a chiamata (`levelsOf` controlla che il campo dei livelli sia fresco scorrendo ogni luogo
caricato): misurato, i due terzi dei 7,5 ms sono quelle letture.

## Decisione

1. **La mesh come array, senza three.js** (`src/render/terrainmesh.ts`): lo stesso ciclo di `buildChunk` produce gli array degli attributi
   (`ChunkArrays`: terreno, cose solide, acqua con l'onda e le fasi, schiuma, e le istanze dei modelli come codice, seme, posizione, verso,
   scala) e legge solo da una **sorgente** (`ChunkSource`), un elenco chiuso di letture. Le funzioni del mare che servono alla mesh stanno
   in `src/render/seawave.ts`, anch'esse senza three.js; `sea.ts` e `terrain.ts` le riesportano come prima. `MeshBuilder` è il `Builder` di
   prima senza la geometria; `Builder` lo estende con `geometry()`, e tutti gli altri che lo usano non cambiano.
2. **Due sorgenti, una mesh.** Sulla pagina la sorgente è il kernel (`kernelSource`, per `buildChunk`); nel worker è una **copia** delle
   letture (`ChunkInput`, fatta da `chunkInput` sulla pagina: le caselle e il suolo in una finestra di `CHUNK_MARGIN` = 2 caselle oltre i
   bordi, i buchi con le copie delle loro celle, la tavolozza nel suo ordine, i colori già accesi da `rgbOf`, i terreni coi modelli pronti).
   Fuori dalla finestra la copia non dice niente (nessuna casella, il suolo `NaN`): una lettura nuova che la finestra non contiene si vede.
   Le geometrie three.js (`meshGeometry`, `foamGeometry`) e le istanze (`chunkView`, che compone le matrici come prima e le raggruppa per
   forma nell'ordine in cui sono state posate) si fanno sulla pagina dagli array.
3. **Un worker suo** (`src/render/terrainworker.ts`, governato da `ChunkMesher` in `src/render/chunkmesher.ts`), non il pool dei modelli,
   i cui programmi durano secondi e terrebbero un luogo dietro di sé. Un luogo è fuori **una volta alla volta**: ciò che cambia mentre è
   fuori si richiede quando torna (la sua firma, `chunkSig`, è vecchia), così un luogo le cui caselle cambiano a ogni tick (l'acqua che
   scorre) mostra l'ultimo fatto e non una coda. Gli array tornano trasferiti, senza copia. Il renderer manda fino a tre copie a frame, non
   oltre un millisecondo e mezzo; mette a schermo ciò che è tornato, se il suo luogo c'è ancora e i modelli che vi ha posato sono ancora pronti
   (altrimenti lo richiede); quando riparte dai file dell'universo dimentica ciò che è fuori (`forget`). Un worker che si ferma, che non parte o
   che con luoghi fuori tace per 20 s (`MESHER_WATCHDOG_MS`) si abbandona: da lì la pagina fa le mesh da sé, tre a frame, come prima.
4. **La stessa mesh byte per byte.** `tests/terreno-worker.test.ts` confronta la mesh della pagina con quella del worker (la copia clonata come
   `postMessage`, gli array trasferiti) attributo per attributo, con e senza i modelli dei terreni, sull'acqua con le onde, sul vuoto, sui
   buchi delle cantine, e registra ogni lettura che la mesh della pagina fa del kernel: stanno tutte nella finestra, e le più lontane ne toccano
   il bordo. `lab/scripts/impronta-terreno.ts` dà l'impronta delle mesh di 95 luoghi del seme (con e senza i modelli, una cantina a 16, l'acqua,
   il vuoto): `bf19e2fdbfb56b15` prima e dopo. Nel browser, sulla build, i 35 luoghi fatti dal worker sono uguali a quelli rifatti sulla pagina.

## Conseguenze

- Chi aggiunge una lettura alla mesh di un luogo la aggiunge a `ChunkSource`, a `kernelSource`, a `ChunkInput` con `chunkInput` e a
  `inputSource`; se la finestra non basta, allarga `CHUNK_MARGIN`. Il test lo dice se si dimentica.
- Misurato con `misura-frame.mjs` sulla stessa macchina (`lab/terreno-3d/misure/m0-prima.json`, `m0-dopo.json`): il frame peggiore della mesh
  dei luoghi da 65 a 20 ms nel caricamento a freddo (oltre 4 ms: da 30 frame a 9), da 61 a 5,4 ms nell'arrivo (da 20 frame a 1), da 15,7 a 2,6
  con l'acqua che scorre; i long task del caricamento da 20 a 5, quelli dell'arrivo da 15 a 5 (ciò che resta non è la mesh dei luoghi). Un
  luogo arriva dal worker in 6-16 ms in mediana, fino a 150 quando il caricamento ne chiede decine insieme.
- La copia costa sulla pagina 0,7 ms a luogo (2 al massimo), quasi tutto `groundAt`: renderlo economico (il controllo di freschezza di
  `levelsOf`) servirebbe alla copia e a tutto ciò che il kernel chiede del suolo; non è di questo task.
- Gli attributi delle mesh dei luoghi sono `THREE.BufferAttribute` sugli array fatti, non più `Float32BufferAttribute` che li copiava: gli
  stessi tipi e gli stessi byte.
- Il taglio sotto terra (`buildCut`) resta sulla pagina: legge gli strati e si fa solo quando si scende.

## Alternative scartate

- **Il pool dei worker dei modelli** (`WorkerRunner`): un luogo aspetterebbe dietro programmi di secondi; dargli la precedenza vorrebbe
  comunque un worker libero.
- **Il kernel specchiato nel worker** (i luoghi mandati una volta e tenuti aggiornati): uno stato in più da tenere uguale, e il suolo dipende da
  tutti i luoghi caricati (i livelli del mondo, ADR-0048); la copia delle letture costa meno di un decimo della mesh.
- **La geometria three.js nel worker**: three.js e i materiali nel worker per niente, gli array sono ciò che si trasferisce comunque.
- **`SharedArrayBuffer`**: vuole le intestazioni COOP e COEP su tutte le pagine, e non toglie la copia delle letture.
