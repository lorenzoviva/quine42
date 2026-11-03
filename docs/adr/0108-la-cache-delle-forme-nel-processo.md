# ADR-0108 — La cache delle forme è del processo, e su disco solo per i test

- Stato: accettato
- Data: 2026-11-02
- Task: T161 (nasce da T91, T148, T151)

## Contesto

Ogni `Kernel.boot` costava circa 10 s, quasi tutti in `placeCampus` → `forms.preload`: in Node il kernel riesegue i programmi MarkovJunior della
corona, e `InlineRunner` teneva i risultati per istanza. T148 e T151 condividevano il runner a mano nei test. Sul server più universi girano nello
stesso processo e rifacevano lo stesso lavoro. Nel browser le forme le fanno i worker (`WorkerRunner`, con la sua cache): lì non cambia nulla.

## Decisione

1. **Una cache per processo** (`sharedForms`, `FormCache` in `src/kernel/forms.ts`): ogni `InlineRunner` la usa senza che chi crea un kernel faccia
   nulla. `KernelOptions.forms` resta per chi vuole un altro runner.
2. **La chiave dice tutto ciò da cui dipende il risultato** (`formKey`): il **testo intero** del programma, il seme, la scatola, la tinta. Niente
   `hashStr`: con 32 bit un universo può scrivere apposta un programma che collide con quello di un altro e averne la forma. Il testo intero al posto di
   un hash crittografico perché `forms.ts` va anche nel browser, dove `node:crypto` non c'è e `crypto.subtle` è asincrono. La testa è JSON, così
   non si confondono due tinte che si leggono uguali. Non ci sono l'id del modello, `vpt`, `rig`, `sway`: non cambiano i voxel. Due modelli con lo stesso
   programma condividono il risultato.
3. **Si tiene solo ciò che ha finito.** `runMjx` a scadenza restituisce mezzo modello senza errori, e prima quel mezzo modello entrava nella
   cache; quanto arriva lontano dipende dalla macchina. Ora `runForm` dice `finished`: ciò che non ha finito (tempo o passi) va a chi l'ha chiesto e lì
   si ferma, un errore non si tiene. Per questo `tempo` non è nella chiave: ciò che ha finito è uguale con qualunque tempo.
4. **Nessuno scrive su un risultato condiviso.** Tutto è congelato con `Object.freeze`, su copie della cache (la palette compilata non è sua da
   congelare). `cells` è un `Uint8Array`, che non si può congelare: lo scrive solo `act`, e `act` nel kernel riceve sempre la copia di
   `instanceGrid`. Lua non arriva né alle forme né ai risultati. `foot`, `levels` e il resto stanno nel `Form`, che è di ogni kernel. Un test lo afferma facendo
   lavorare un kernel su una porta (`tests/forms-cache.test.ts`). Abbiamo scartato la copia di `cells` per ogni kernel: moltiplica la memoria che si vuole risparmiare.
5. **Un tetto**: LRU, 4096 voci e 256 MB (`FORM_CACHE_ENTRIES`, `FORM_CACHE_BYTES`). Una corona con il suo mondo iniziale sono ~120 voci e ~19 MB, e i
   programmi uguali di più universi contano una volta. Ciò che supera da solo il tetto non si tiene e non caccia nulla. Una voce uscita resta viva nei
   kernel che la usano: il tetto dice quanto tiene la cache, non i kernel.
6. **Non si svuota**: `InlineRunner.clear()` è sparito (non lo chiamava nessuno) e la cache non ne ha uno. Un programma riscritto ha un'altra chiave,
   e un kernel non può togliere le forme agli altri.
7. **Su disco, solo per i test.** Vitest isola i file: ogni file pagherebbe il suo primo boot, e con la sola cache in memoria era ancora la parte più
   grossa della suite. `tests/setup/forms-disk.ts`, caricato da `setupFiles` di Vitest, aggancia `FormCache.backing` a
   `node_modules/.cache/quine-forms/<versione del motore>/<sha256 della chiave>.form`. La versione è lo SHA-256 di `src/mj/*`, `src/kernel/rng.ts` e
   `src/kernel/forms.ts`. Con più worker: scrive a parte e rinomina; ciò che non è un risultato intero è una mancanza. La cartella si può cancellare quando si vuole.
   `src/` e `server/` non importano quel file, e fuori dai test `backing` non è mai impostato: mai nel gioco né sul server, dove un file su disco
   sarebbe uno stato in più da difendere e un riavvio costa un primo boot solo.

## Conseguenze

- Il primo boot di un processo costa come prima, i successivi ~0,25 s (misure nell'esito di T161 nel backlog).
- Le forme dei test sono risultati di esecuzioni vecchie: se il risultato dipendesse da un file fuori dalla versione del motore, un test vedrebbe il
  vecchio. Chi fa dipendere il motore da un altro file lo aggiunge a `engineVersion`.
- Le cartelle delle versioni vecchie restano finché non si cancellano (~24 MB l'una). Nella pipeline `node_modules` è una giunzione, quindi i worktree le condividono: il contenuto dipende solo dalla chiave e dalla versione.
- Tra universi dello stesso processo si può capire dal tempo se un programma con un seme è già stato eseguito da un altro. Si scopre solo che quel testo esiste, e per provarlo bisogna già averlo: lo accettiamo.
- Un universo può riempire la cache: gli altri perdono al più i risultati e li ricalcolano. È un rallentamento limitato dal tetto, non una scrittura sul loro mondo.
- Resta fuori: la chiave di `WorkerRunner` nel browser usa ancora `hashStr` (T164, fatto: vedi sotto). È una cache della sola macchina del giocatore, per un solo universo alla volta: non è toccata qui.

## Aggiunta (T163)

Il browser ora fa come Node: il worker dice `finished` e `WorkerRunner`, anche nel ripiego senza worker, tiene in memoria e in IndexedDB solo ciò che ha finito. Le voci già salvate non dicono se erano a metà: la versione del database (`FORMS_DB_VERSION`, 2) le butta una volta. Una scheda con la versione vecchia aperta non blocca: la nuova va avanti senza IndexedDB finché quella non si chiude. Un modello che non finisce non riparte a ogni frame, perché `Forms` tiene il suo `Form` per tutta la partita: riparte a ogni caricamento della pagina.

## Aggiunta (T164)

Anche la chiave del browser è il testo intero: `formCacheKey` è `formKey` più `vpt`, `rig` e `sway`, che cambiano le mesh; il nome del modello e `tempo` non ci sono più, per la stessa ragione che in Node. Abbiamo scartato un hash forte: `crypto.subtle` è asincrono e `has` e `getCached` no, e un SHA-256 scritto a mano è codice in più per risparmiare 1,8 MB di chiavi accanto a 1,9 GB di risultati. Le voci con la chiave vecchia le butta `FORMS_DB_VERSION` = 3.

## Aggiunta (T160)

Stessa regola per il rilievo, che T161 non copriva: `Hills` gira due volte per ogni kernel, circa 400 ms di ogni boot. `tests/setup/relief-memo.ts`, da `setupFiles`, lo tiene in memoria e su disco (`node_modules/.cache/quine-relief/`) per seme e programma, solo nei test e sostituendo il modulo con `vi.mock`, senza toccare il gioco; un giro lento (da 2 s, la scadenza è 4 s) non si tiene, perché può essersi fermato a metà. `tests/relief.test.ts` e `tests/determinism.test.ts` fanno `vi.unmock`: provano ciò che la memoria dà per scontato. Nel gioco e sul server il rilievo si ricalcola per kernel: una cache del processo sarebbe la stessa cosa fatta per loro, ma va decisa a parte.

## Aggiunta (T177)

La cache in IndexedDB appartiene a un'origine, e un'origine ha la sua porta. Ogni verifica nel browser su una porta libera, nel profilo vero di Chrome, lasciava lì circa 0,5 GB per sempre: 31 origini e 14,8 GB dal 30/10 al 02/11, 7,5 GB nel solo 02/11, su C:. Era ciò che riempiva il disco. Ora `WorkerRunner` usa IndexedDB solo se `keepsFormsOnDisk` lo permette: fuori da questa macchina sempre, su questa macchina solo sulle porte che restano le stesse (5173 di `npm run dev`, 4173 di `vite preview`) o con `?formecache`, per chi prova la cache stessa; altrove le forme stanno in memoria e una pagina ricaricata le rifà. Abbiamo scartato una porta fissa per le verifiche, perché basta un agente che ne sceglie un'altra e la perdita torna senza che nessuno la veda, e un tetto per origine, che lascerebbe un tetto per ogni porta. Una pagina non può pulire le altre origini: ciò che c'è già lo toglie l'autore. Un tetto alla cache di un'origine sola resta da fare se un giorno servirà: oggi 5173 pesa 0,5 GB.

## Aggiunta (T175)

La cache del browser ha un tetto, e un tetto a tre piani, perché gli stessi array li tenevano in tre: `WorkerRunner.memory`, il `Form` di ogni kernel (`result.meshes`, per tutta la partita) e la geometria di three (`models.ts`). Togliere una voce da `memory` da sola non avrebbe liberato un byte.

**La misura, prima** (build di produzione, `?skip&offline`, mondo iniziale, processo della scheda in Windows): 2445 MB privati, 147 forme con 1,77 GB di array, di cui 1,55 GB fotogrammi di animazione e i più pesanti sono gli edifici della corona (`corona-magia` da sola 159 MB). Il mondo iniziale ne disegna 47 da **49 MB**: il resto la scheda lo teneva senza guardarlo, finché il viandante non arriva alla corona. IndexedDB 504 MB per quegli 1,77 GB.

**I numeri** (`FORM_MEMORY_BYTES`, `GEOMETRY_BYTES`, `FORM_DISK_BYTES`, `FORM_ENTRIES`):

- **In memoria 128 MB** di forme pronte oltre a ciò che è disegnato, LRU, 4096 voci. Bastano quei 49 MB più un margine; una forma più grande del tetto si tiene lo stesso, da sola, così la prossima la libera: chi l'ha chiesta sta per disegnarla, e se non si tenesse il `Form` la tratterrebbe per sempre.
- **Geometrie 128 MB**, solo quelle che non sono appese alla scena e che nessuno ha chiesto da 30 s. Ciò che è in scena non conta nel tetto: un mondo sullo schermo non può pesare meno di quanto pesa. I 30 s sono il riparo dalla giostra: chi guarda un modello a ogni frame (i modelli dei terreni, il campus) lo tiene, altrimenti toglierlo lo farebbe richiedere subito.
- **Su disco 4 GB di array** (circa 1,1 GB di disco con la compressione misurata, 0,28), 4096 voci. Deve starci un mondo intero: con un LRU, un mondo più grande della cache butterebbe a ogni caricamento proprio ciò che il prossimo chiede. La corona è 1,5 GB ed è uguale in tutti gli universi con gli stessi programmi, che contano una volta. I byte d'uso stanno in un archivio a parte (`uses`), così né contarli né aggiornarli vuol dire leggere una forma; lettura e scrittura contano come uso. `FORMS_DB_VERSION` = 4: le voci di prima non hanno quei dati, e si rifanno una volta.

**Come una forma torna.** Quando esce da `memory` il risultato perde le mesh e prende `meshesGone`; griglia e tutto il resto restano, il kernel non se ne accorge e la forma resta `ready`. `geoOf` trova `meshesGone`, chiama `Form.remake` e dà `undefined` come per un modello non ancora pronto: il disegno ha già il suo sostituto per quel caso e si rifà quando `forms.version` cresce. `remake` chiede al runner, cioè IndexedDB e, se lì non c'è, i worker; la stessa richiesta dà la stessa griglia. Le firme delle entità ora guardano `geoOf` e non `result.meshes`: una geometria viva con le mesh uscite è ancora un modello, e una forma senza mesh deve poterle richiedere anche se nessuno la ricostruisce.

**`memory` deve tenere gli array quando le mesh sono fatte?** No, e non li paga due volte: sono gli stessi oggetti. Abbiamo scartato di liberare gli array dopo il caricamento sulla GPU (`onUpload`): `computeBoundingBox` li rilegge nel campus, e dopo una perdita del contesto WebGL three li ricarica da lì. In memoria quindi restano quelli delle geometrie vive.

**L'anello della corona** tiene da solo circa 1,1 GB di geometrie, e restava nella scena dopo una visita fino al ricaricamento della pagina. Ora, non rivelato per 60 s (`RING_IDLE`, sull'orologio vero: `t` va piano dove i frame sono pochi), si toglie con ciò che è suo. Mentre i modelli arrivano si ricostruisce al più una volta al secondo (`RING_REBUILD`), non una per modello.

**Il prezzo.** Arrivare alla corona non è più istantaneo: gli edifici arrivano dalla cache in pochi secondi, e nel frattempo si vedono i blocchi con l'insegna al neon, come quando un modello non è pronto. Accettiamo: è un passaggio raro. Restano fuori dal tetto: le stanze dello studio già visitate (`CoronaView.rooms`) e i corpi cambiati da un'azione (`changed`), che sono piccoli; una forma che non ha finito, che non sta in `memory` e resta nel suo `Form`.

**Dopo** (stessa misura, secondo caricamento, scheda nuova): 345 MB privati nella scheda contro 2445, heap 157 MB, 0 lavori ai worker, 147 forme pronte; IndexedDB 512 MB contro 504 (il mondo sta sotto il tetto: il disco non cambia finché non lo supera). Con la corona in scena 1,6 GB, e 60 s dopo esserne usciti lo heap torna a 220 MB. Attenzione a chi misura: `usedJSHeapSize` conta anche la pagina precedente se si ricarica nella stessa scheda (1,7 GB lì, 156 MB nella scheda nuova con lo stesso stato; `WeakRef` sulle 107 mesh tolte, 1682 MB: tutte raccolte). Si misura da una scheda nuova. **Da fare a parte:** ogni caricamento legge da IndexedDB tutti gli 1,77 GB per poi usarne 49 MB; griglie e mesh in due archivi lo eviterebbero (fatto, T212: vedi sotto).

## Aggiunta (T212)

Griglie e mesh stanno in due archivi di IndexedDB: `forms` (griglia, palette, azioni, animazioni, e `meshesGone` se le mesh ci sono) e `meshes`; `uses` resta. `FORMS_DB_VERSION` = 5.

**Si separa al contrario di come era stato scritto il task.** Il task chiedeva di leggere la griglia solo quando un `Form.remake` la chiede. Non si può: appena una forma è pronta il kernel ne ricava subito `foot`, i pavimenti e il raggio, e `placeCampus` cerca le porte in tutte le griglie. La misura dice anche che non servirebbe: le griglie delle 147 forme sono **16,4 MB** su 1861 MB, meno dell'1 %. Quindi un caricamento legge tutte le griglie e nessuna mesh (`Forms.get` → `FormRunner.withoutMeshes`, facoltativo: `InlineRunner` e `MemoryFormStore` non lo hanno e danno tutto); la forma nasce con `meshesGone` e le mesh arrivano per la stessa via di T175, `geoOf` → `Form.remake`, solo per ciò che qualcuno disegna. `remake` legge la voce intera, griglia compresa: un metodo a parte per risparmiare meno dell'1 % non vale il codice in più.

**Le mesh diventano geometria appena arrivano** (`remake(arrived)`). Con il tetto di 128 MB in memoria, l'edificio appena letto usciva da `memory` all'arrivo del successivo, prima che l'anello, ricostruito al più una volta al secondo, ne facesse la geometria: si rileggeva, e arrivare alla corona leggeva 7,3 GB in circa 16 s. La geometria tiene gli array per conto suo, sotto `trimGeometries`, e ogni forma si legge una volta. `Thumbs`, che chiede una volta sola e non torna al frame dopo, aspetta con `geoWhenReady`.

**Una cache vecchia si scarta, non si migra.** Migrare vorrebbe dire leggere 1,8 GB dentro la transazione di aggiornamento, con la pagina ferma; rifare le forme costa un primo caricamento di circa 20 s, una volta sola, come per le versioni 2, 3 e 4. Abbiamo scartato anche di leggere la griglia dalla versione 4 voce per voce in sottofondo: codice che serve una volta sola.

**Il tetto** resta sul totale: `uses.bytes` conta griglia più mesh, una voce esce con tutti e due i pezzi, e leggere la sola griglia conta come uso: una forma che ogni caricamento chiede non è da buttare, anche se non è disegnata.

**Le misure** (build di produzione, `?skip&offline&formecache`, stessa origine, scheda nuova, secondo caricamento, 147 forme; `IdbFormStore.bytesRead` dopo, la somma di `uses` prima):

| | prima | dopo |
|---|---|---|
| byte letti al caricamento | 1861 MB | 70 MB |
| forme pronte durante il caricamento | 10 su 131 a 3,4 s | 129 su 129 a 2,0 s |
| tutte le 147 pronte | 9,4 s | 9,2-9,8 s |
| heap a fine caricamento | 155 MB | 115-118 MB |
| lavori ai worker, forme fallite | 0, 0 | 0, 0 |
| IndexedDB su disco | 540 MB | 541 MB |
| arrivare alla corona: byte letti, ultima lettura | non misurato | 1,25 GB, 5,2 s (7,3 GB e circa 16 s senza la geometria all'arrivo) |

L'ultima forma pronta non arriva prima: quei 9 s non sono più di lettura, le ultime forme vengono chieste tardi. Il guadagno è nei byte e nei primi 3 s. Il prezzo è un passaggio in più: un modello del mondo iniziale prima è una forma pronta senza mesh, e per un istante si vede il sostituto, come quando un modello non è pronto.

## Aggiunta (T215)

**Le mesh le legge un worker.** Il profilo dell'arrivo alla corona, 3,2 s, diceva: 1,55 s nella decodifica dei valori di IndexedDB sul thread della pagina (il valore si decodifica dove si legge), 0,39 s nelle sfere di ingombro di tutti i fotogrammi, più la ricostruzione dell'anello che chiedeva i modelli al più una volta al secondo. Il tempo era del thread della pagina, non della memoria: non c'era da scegliere tra le due, e i tetti di T175 non cambiano.

- `IdbFormStore.get`, se ha un `meshReader`, legge griglia e `uses` sulla pagina e chiede le mesh a un worker di `WorkerRunner`, che le decodifica e ne cede i buffer. Una lettura passa davanti ai programmi in coda. Se il worker non trova nulla, o si guasta, legge la pagina: la lettura vecchia resta il ripiego e decide lei cosa è una mancanza. Il worker non crea né aggiorna il database: lo apre con la versione detta dalla pagina, che l'ha già aperto, e lo chiude a una versione nuova. Abbiamo scartato di tenere la decodifica sulla pagina a piccole dosi: i byte sono gli stessi e il tempo non scende.
- `geometry()` non calcola più la sfera di ingombro: three la calcola da sé per ciò che sta per disegnare, e dei fotogrammi di un edificio se ne vede uno alla volta. Il primo disegno di ogni fotogramma la paga allora, una volta.
- `askCampusModels` chiede a ogni frame le mesh di ciò che l'anello porta oltre agli edifici; l'anello resta ricostruito al più una volta al secondo (`RING_REBUILD`), quindi ciò che si vede può arrivare fino a un secondo dopo l'ultimo `forms.version`.

**Le misure** (Chrome headless, RTX 2070 D3D11, build di produzione, `?skip&offline&formecache`, scheda nuova, seme e file uguali, arrivo = ultimo cambio di `forms.version` dallo spostamento a (46, 0); memoria = byte privati del processo in Windows):

| | prima | dopo |
|---|---|---|
| arrivo alla corona, secondo caricamento | 3,25 · 3,16 · 3,32 s | 1,30 · 1,22 · 1,00 · 1,90 · 0,88 s |
| arrivo con la cache vuota, stesso caricamento | non misurato | 4,18 s |
| blocchi sopra i 50 ms in 45-60 s | 13-14, 2,1-2,2 s | 2-6, 0,28-0,54 s |
| fps medi in quei secondi | 57,8 | 59,2-59,6 |
| byte letti | 1,2 GB | 1,2 GB |
| scheda prima di arrivare | 286-352 MB | 259-290 MB |
| scheda alla corona | 1493-1562 MB | 1468-1515 MB |
| GPU alla corona | 1023-1070 MB | 1025-1039 MB |
| heap alla corona | 1309-1322 MB | 1277-1330 MB |

Per confronto, dalle misure di T213 (senza T212): 0,7-1,0 s prima di T175, circa 6 s dopo. Il cambio tardivo di `forms.version` visto da T213 a 48,8 s non si è ripresentato: in 15 prove l'ultimo è a 7,05 s con la cache vuota e a 3,32 s con quella piena. Solo 7 di queste sono osservate oltre i 48,8 s (60 s, una 120 s), e tutte prima di `askCampusModels`; le 5 del «dopo» durano 45 s. La causa di quel cambio resta non accertata. Il lavoro nuovo a ogni arrivo è la scultura del plinto, che `visitCorona` sceglie con il tick e quindi con un seme ogni volta diverso: di solito un programma nei worker per arrivo, e una voce in più nella cache su disco. Al caricamento, prima di arrivare, i worker fanno 1-3 lavori (T212 ne contava 0): non indagati. L'universo su disco parte dagli stessi file del seme ma cresce da una prova all'altra: il «prima» e il «dopo» non hanno lo stesso stato salvato, solo le stesse forme.
