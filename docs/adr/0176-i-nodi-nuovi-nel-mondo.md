# ADR-0176 — I nodi nuovi di MarkovJunior nel mondo: i tetti del mondo, i tileset nel validatore, lo Scultore

Data: 2026-11-08 · Stato: accettato (task T336 del backlog, step 30) · Riferimenti: ADR-0041 (ogni aspetto è un programma), ADR-0042 (lo Scultore), ADR-0105 (i limiti del motore), ADR-0142 (il motore non cambia un voxel), ADR-0160 (le strutture procedurali), ADR-0161 (le carte fatte a mano), ADR-0171 (le regole da file e `<import>`), ADR-0173 (l'inferenza), ADR-0174 (`wfc` e `convchain`), ADR-0175 (i simboli numerati)

## Contesto

Dopo T333-T335 il motore sa `field`, `temperature`, `observe`, `search`, `wfc` a tessere e a sovrapposizione, `convchain`, `map`
frazionaria, `<import>` e le regole da file, con i tetti del motore (`INFERENCE_LIMITS`, `WFC_LIMITS`, `MJX_INCLUDE_*`): misure pensate per il
laboratorio, dove un esperimento può costare. Il validatore e le carte fatte a mano rifiutavano tutto (`newNodesRefusal`) finché qualcuno
non dicesse quanto il mondo ne prende. Nel mondo un modello gira a ogni seme in ogni mondo, sul server e su ogni client; e un controllo che
dipende dal tempo dà risposte diverse su macchine diverse. Lo Scultore non conosceva i nodi; il seme non ha tileset né campioni.

## Decisione

1. **I tetti del mondo** (`WORLD_NODE_LIMITS`, `src/kernel/validator.ts`), più stretti di quelli del motore e **tutti contati in unità**: lo
   stesso programma ha la stessa risposta su ogni macchina; il tempo resta quello di sempre del validatore (8 s, o il `tempo` del modello).
   Misurati sui modelli dell'originale (`lab/scripts/nodi-mondo.ts`, `lab/banco/nodi/tabella.txt`):
   - un'onda su al più **32 768 celle** e **32 MB** (la più grande dei modelli dell'originale: 2500 celle e 5 MB, `WaveDungeon`), al più
     **1024 motivi**;
   - `tries` di una `wfc` **scritto**, da 1 a 100: senza, il motore ne fa 1000, e un'onda che non ha soluzione li prova tutti. Nessun modello
     dell'originale lo scrive: portati nel mondo, lo scrivono;
   - `limit` di una ricerca **scritto**, al più **2000 stati** (`StairsPath` ne chiede 1000);
   - `steps` di una `convchain` **scritto**, al più 50, e `n` fino a 3;
   - al più **64 file** di `models/` letti, **200 000 caratteri**, import al più **3** uno dentro l'altro (`importDepth`; `SeaVilla` legge 43
     file, 18 000 caratteri);
   - **32 MB** di potenziali e di propagazione per un nodo che inferisce.
2. **Due controlli.** Ciò che si legge dal programma compilato (tries, limit, steps, n, motivi, file, import) lo dice `worldNodeErrors`, con il
   motivo per l'agente. Ciò che dipende dalla griglia del momento (le celle e i byte dell'onda, i potenziali) lo controlla la corsa:
   `RunOptions.ceilings` (`NodeCeilings`, `src/mj/engine.ts`) porta nel motore tetti più bassi dei suoi, oltre i quali il nodo getta un
   `Mj3Error` che dice «nel mondo…»; **sotto, la corsa è la stessa** (un tetto non taglia mai una ricerca né un'onda: rifiuta). Così il mondo,
   che fa girare i modelli senza `ceilings`, dà la griglia che il validatore ha visto, e il test di ADR-0142 non si tocca.
3. **Chi li vuole**: il validatore (`modelErrors`), le carte fatte a mano (`handmadeProgramErrors`: una carta non legge file, quindi di questi
   nodi può usare `field` e `observe`), i controlli dello Scultore (`checkProgram`) e il banco delle strutture (`esegui` di `lab/banco/misure.ts`).
4. **I tileset nel validatore.** Un file di `models/` con radice `<tileset>` (`isTileset`) non è un programma: `validateFile` lo manda a
   `tilesetErrors`, che lo compila come lo leggerebbe una `wfc` di un tentativo sulle sue lettere (tessere quadrate e di una misura, simboli
   nei `values`, vicini che esistono, motivi entro il tetto). I tileset dell'originale portati in testo passano tutti.
5. **Lo Scultore.** Il prompt ha una sezione per tutte le classi (cosa fa ogni nodo e quando usarlo, con i tetti) e una per le strutture
   (`field` con `temperature` perché ogni seme sia un altro edificio, `observe` solo su pezzi piccoli, `wfc`/`convchain`/`import` solo con i
   file che la richiesta elenca). `checkProgram` compila con i file di `models/` dell'universo che il programma legge (`filesOf`) e la richiesta
   elenca i tileset, i campioni e i file di regole della biblioteca (`libraryResources`). Lo Scultore scrive un XML solo: non crea file.
   Il seme non ha ancora tileset: quale portare lo misura T337.
6. **Offline**, lo Scultore senza un programma della classe nella biblioteca risponde con `MOCK_FIELD_PROGRAM` (`src/kernel/ai/mock.ts`): un
   `field` con `temperature` porta un camminatore alla meta, la regola scritta nei figli `<in>`/`<out>`; passa il validatore in ogni classe che
   non è una struttura procedurale.
7. **La porta si misura aperta con `open`.** Dal contratto 0.5 (T308b) l'azione della porta si chiama `open`, ma `reachableStoreys`
   (`src/kernel/forms.ts`, i piani raggiunti a piedi che lo Scultore vuole per le strutture procedurali, ADR-0162) e il banco cercavano
   un'azione `apr…`: misuravano la porta chiusa, nessun corpo entrava, e ogni struttura procedurale tornava allo Scultore con «piani: 0»,
   lo scheletro del suo prompt compreso. Ora si cerca `open` (e `apr…`, per un programma di prima non ancora portato).
8. Kernel **0.6.1**: il contratto non cambia (un programma che il mondo prendeva lo prende ancora; quelli che prima erano rifiutati ora
   possono passare).

## Conseguenze

- Un programma dello Scultore o di un giocatore può usare i nodi dell'originale; uno che li usa oltre i tetti torna con il motivo (regola 2).
- I modelli dell'originale portati nel mondo vanno ritoccati: `tries` su ogni `wfc`.
- La superficie di sicurezza non cresce: i file letti restano quelli di ADR-0171, per nome semplice dentro `models/`; i tetti sono più bassi
  di quelli del motore, anche nel processo che prova le carte fatte a mano.
- Il giro del banco delle strutture con il prompt nuovo è in `lab/banco/nodi/` (`riepilogo.md`, `giudizio.md`), confrontato con quello di
  T156 (`lab/banco/gemini/`): su Gemini 3.8 Flash 0 su 7 alla prima richiesta (T156: 1 su 7), 2,39 $, e **nessun programma usa i nodi
  nuovi**: Gemini parte dallo scheletro e lo ricolora. Descriverli nel prompt non basta; perché servano alla varianza lo scheletro stesso
  deve usarli, ed è il lavoro di T337.
