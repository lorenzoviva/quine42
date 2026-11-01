# ADR-0102 — Chi può scrivere: il modello di minaccia e le regole d'accesso

Data: 2026-11-01 · Stato: accettato (task T120 del backlog) · Riferimenti: V-001 e V-006 (R1 e R6 dell'audit T117), ADR-0098 (il processo delle vulnerabilità), ADR-0099 (il proxy di Gemini), ADR-0058, 0061, 0066, 0068, 0081, 0082, 0086

## Contesto
Con F12 un giocatore poteva riscrivere i file Lua sul server: `/api/universe` accettava ogni operazione senza identità, e senza account il WebSocket credeva all'id che il client diceva, compreso quello del master. Da un altro sito una richiesta `no-cors` scriveva nell'universo e una pagina entrava nel mondo (giro dell'autore, `esiti/2026-11-01-f12.md`). `GET /api/viandante` e `/api/crediti` davano il saldo di chiunque.

## Il modello di minaccia (decisione dell'autore, 01/11)
**Chi attacca**: un giocatore con F12, o qualunque programma che raggiunge la porta; un altro sito aperto nel browser di chi gioca. **Cosa si difende**: non si esce dalla sandbox; i crediti non si toccano; i non master non riscrivono direttamente il Lua sul server. **Cosa non si difende**: ciò che resta dentro il gioco (`docs/sicurezza/README.md`, V-018), un prompt avversario al Concilio, un programma già in esecuzione sulla macchina di chi ospita un server senza account: ha già il disco.

## Decisione
1. **Chi chiede** si decide in un posto solo, `server/access.ts` (`callerOf`, `gate`):
   - **Un'altra origine non passa mai**: l'`Origin`, se c'è, dev'essere l'`Host` chiesto, su ogni route e sul WebSocket. Chi scrive (`POST`, `PUT`) manda `application/json`, che un altro sito non può mandare senza chiedere.
   - **Con il verificatore** (`FIREBASE_PROJECT_ID`) chi sei lo dice il token (`Authorization: Bearer`); un token falso è 401, non «nessuno».
   - **Senza verificatore** l'id detto è tutto ciò che c'è, quindi **vale solo da questa macchina** (`accessRefusal` di ADR-0099: indirizzo di loopback, `Host` di loopback, nessuna intestazione di inoltro) e da fuori non risponde nulla, nemmeno l'elenco. Su `/api/universe` l'id si dice con `X-Quine-Viandante`; senza, non si è nessuno.
   - **Il mondo del server** si fa riconoscere con un segreto del processo (`X-Quine-Interno`): nato in `vite.config.ts` a ogni avvio, passato a `universeStore` e, attraverso `sessionServer`, a `openUniverse`; sta solo in memoria.
2. **Permessi su `/api/universe`**: una partita in singola è di chi sta su questa macchina, come sempre, senza identità. Una partita di molti è del suo master e del suo mondo (`owns`). Gli altri:
   - **leggono solo `publicFiles`** (`src/session/files.ts`): ciò che `playerFiles` dà a un giocatore, più ciò che mostrano il sito e la lobby (le carte, di una persona nome e mestiere, di una trama il titolo, di una regola il testo, della bibbia `concetto` e `tema`). Niente storia, piani, elenco dei luoghi né ramo.
   - **non scrivono nulla**: `commit`, `checkout`, `reset`, `branch`, `merge`, `clone`, `PUT map` danno 403.
3. **I saldi li scrive solo il mondo**: in una partita di molti nemmeno il master tocca via HTTP `world/giocatori/` e `world/pagamenti.json`. Le carte si misurano sul server (`GET …/carte`), perché ciò che le misura (il codice) non esce.
4. **`create`**: in singola solo da questa macchina. Una partita di molti ha per master chi la fa, non ciò che dicono i file, e non porta saldi; un anonimo non ne fa. Da fuori, con un account, un universo è sempre di molti.
5. **`clone`**: lo fa solo il master provato dell'universo di partenza, e nomina il nuovo master nel corpo. Vedi le alternative: il testo del task chiedeva il master «dall'identità», che qui è l'identità di chi autorizza.
6. **Il WebSocket** (`admitSocket`, `server/session.ts`): stesse regole di `gate`, rifiuto prima dell'upgrade. `offline` vale solo su un server senza account, dove il primo client è chi ospita; con gli account non si ascolta. `anonimo` lo dice solo il token: il messaggio `entra` non ha più quel campo. Il `tetto` è un desiderio dentro il saldo: `min(tetto, crediti)`, 0 per un anonimo; rientrare non aggiunge di nuovo lo stesso budget.
7. **`GET /api/session`** dice quanti, non chi. **`/api/viandante`** e **`/api/crediti`**: `gate`, e il viandante viene da `whoAsks`; con gli account l'id chiesto non si ascolta. Il `POST` di `/api/viandante` scrive solo il profilo.
8. **Il protocollo**: `ramo`, `pubblica`, `agente`, `segui` controllano già il master; ogni altro messaggio agisce sul corpo di chi lo manda. Un test li manda tutti a mano, con codice ovunque ci sia testo, e guarda che i moduli non cambino.

## Alternative scartate
- **Il master del clone sempre dall'identità di chi lo chiede**: chiunque potrebbe clonare e diventare master della copia, leggendone così codice, prompt e saldi: annulla il punto 2. Se invece può clonare solo il master, l'identità è già quella del master e `cloneChanges` rifiuta («è già il master»): non si potrebbe più dare un clone a un altro, che è lo scopo di ADR-0068.
- **Il kernel del server dentro lo store, senza HTTP**: più pulito, ma tocca `UniverseClient`, `host.ts` e i test per nulla di più: il segreto basta, e T133 può cambiarlo senza cambiare le regole.
- **Un id locale firmato su un server senza account**: chi sta sulla macchina ha già il disco; una firma difenderebbe solo da sé stessi. Per lo stesso motivo le prove dell'autore su loopback non dicono più «diventa master»: si misurano da fuori (con un'intestazione di inoltro) e l'effetto vero sta nei test.
- **`?offline` tolto del tutto**: su un server senza account serve a provare senza spendere, e chi lo chiede è chi ospita.

## Conseguenze
Da un altro dispositivo della rete locale, su un server senza account, non si gioca più in multigiocatore: per giocare in più macchine servono gli account (fino a T133, in produzione, che rifiuta l'avvio senza verificatore). La lobby legge saldo e nome da `/api/viandante`, non più dallo snapshot. Con un account la pagina delle sessioni chiede l'accesso prima di creare un reame. I nomi delle carte, compresi titoli di trame e testi di regole, restano pubblici come la galleria ha sempre voluto. T130 restringe `playerFiles` (V-012): lobby e sito leggono `ai` da `universe.json`, e dovrà lasciare loro ciò che mostrano.
