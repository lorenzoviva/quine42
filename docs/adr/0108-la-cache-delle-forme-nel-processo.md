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
