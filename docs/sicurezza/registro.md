# Il registro delle vulnerabilità

Il processo è in [`README.md`](README.md). Una voce per vulnerabilità; la forma la controlla `tests/sicurezza/registro.test.ts`. Niente payload né valori di segreti.
Le voci V-001…V-016 sono R1…R16 di [`audit-2026-11.md`](audit-2026-11.md), con lo stesso numero; lì ci sono anche i punti precisi del codice. La gravità è pensata per il server
pubblico (T45f); tra parentesi quanto pesa oggi, se è diverso. Ogni voce sarà riprovata contro il server vero da T134, e misurata prima delle correzioni dal kit dell'autore (T137).

Modello di una voce:

```
### V-NNN · Titolo
- Gravità: critica | alta | media | bassa
- Stato: `rilevata` | `specificata` | `in correzione` | `chiusa` | `accettata`
- Superficie: dove sta
- Proprietà violata: cosa dovrebbe essere vero
- Prova: test | prova dell'autore | solo lettura del codice, e che cosa
- Contromisura: cosa cambia e dove
- Task: Txx, Tyy (o —)
- Test: il file che la tiene chiusa (o — )
- Esito: commit e data, per una voce chiusa; il motivo, per una accettata (facoltativo altrimenti)
```

## Le voci

### V-001 · `/api/universe` senza autenticazione
- Gravità: critica (oggi: alta)
- Stato: `specificata`
- Superficie: `server/universeStore.ts`, tutte le route di `/api/universe`
- Proprietà violata: i non master non riscrivono il Lua sul server e i crediti non si toccano; un non master non legge ciò che `playerFiles` gli nega
- Prova: solo lettura del codice (T117)
- Contromisura: identità verificata sul server e permessi per operazione su ogni route; su un universo multigiocatore un non master non scrive nulla; `clone` prende il master dall'identità; controllo di `Origin` e `Content-Type`; le letture del sito ricevono solo ciò che serve. In produzione solo le route ammesse.
- Task: T120, T133
- Test: —

### V-002 · Il proxy di Gemini spende la chiave per chiunque
- Gravità: critica (oggi: alta)
- Stato: `chiusa`
- Superficie: `server/geminiProxy.ts`, `/api/gemini`
- Proprietà violata: la chiave si spende solo per il gioco e nei budget decisi
- Prova: test con Google finto (`tests/sicurezza/gemini.test.ts`, T123); contro il server vero la riprova T134
- Contromisura: elenco dei modelli ammessi, corpo massimo ridotto, tetto di spesa nel proxy, solo da loopback con controllo di `Origin`; in multigiocatore il server chiama Google direttamente, senza route pubblica. La chiave resta fuori dal browser.
- Task: T123, T133
- Test: `tests/sicurezza/gemini.test.ts`
- Esito: chiusa da T123 (ADR-0099), 01/11/2026, branch `task/T123`. Per T133: il server di produzione non monta la route e chiede il tetto nel `.env`.

### V-003 · La cartella di git non è protetta
- Gravità: critica su file system che ignorano le maiuscole (Windows, l'ambiente dell'autore)
- Stato: `specificata`
- Superficie: `safePath` in `server/universeStore.ts`, `cleanBranch` in `src/session/server.ts`
- Proprietà violata: non si esce dalla sandbox: nessuna scrittura arriva alla configurazione di git, perché il server lancia git in quella cartella
- Prova: solo lettura del codice (T117)
- Contromisura: elenco dei percorsi ammessi invece di un divieto; normalizzare maiuscole, punti e spazi finali, flussi NTFS e nomi riservati di Windows; git lanciato con `core.hooksPath` vuoto e nessuna configurazione del repository scrivibile.
- Task: T121
- Test: —

### V-004 · Il webhook di Stripe senza segreto non controlla nulla
- Gravità: critica
- Stato: `specificata`
- Superficie: `server/stripe.ts`, `POST /api/stripe/webhook`
- Proprietà violata: i crediti non si toccano: nascono solo da un pagamento vero, per il suo importo, dentro l'universo giusto
- Prova: solo lettura del codice (T117); la verifica della firma ha già i suoi test
- Contromisura: senza segreto la route risponde 503; nomi e id validati come nel checkout prima di finire in un percorso; credito calcolato dall'importo pagato.
- Task: T124
- Test: —

### V-005 · Pagamenti: idempotenza fragile e registro nella storia dell'universo
- Gravità: alta
- Stato: `specificata`
- Superficie: `server/stripe.ts`, `world/pagamenti.json`, `world/giocatori/*.json`
- Proprietà violata: i crediti non si toccano: un evento accredita una volta sola, e `checkout` o `R` non riportano indietro saldi e pagamenti
- Prova: solo lettura del codice (T117)
- Contromisura: saldi e registro dei pagamenti in un archivio del server fuori dalla storia dell'universo, con migrazione dai file di oggi; accredito atomico e idempotente.
- Task: T125
- Test: —

### V-006 · Identità scelta dal client
- Gravità: alta (critica senza account)
- Stato: `specificata`
- Superficie: `src/session/server.ts`, `server/session.ts`, `GET /api/session`
- Proprietà violata: i non master non riscrivono il Lua: nessuno diventa master dicendolo; `anonimo`, `tetto` e `offline` non li decide il client
- Prova: solo lettura del codice (T117)
- Contromisura: senza verificatore l'id scelto dal client vale solo da loopback; `anonimo`, `tetto` e `offline` decisi dal server; controllo di `Origin` sul WebSocket; `GET /api/session` non elenca i viandanti a chiunque; in produzione niente avvio senza verificatore.
- Task: T120, T133
- Test: —

### V-007 · Il blocco del tick ferma tutti
- Gravità: alta
- Stato: `specificata`
- Superficie: `src/kernel/prelude.lua`, `src/session/host.ts`, le funzioni C di `string.*`, i programmi MarkovJunior sul server (`src/kernel/validator.ts`)
- Proprietà violata: il codice del mondo non ferma il processo: né gli altri mondi né l'HTTP. Il budget conta istruzioni VM per chiamata, non il lavoro nelle funzioni C, non il tick, non la memoria
- Prova: test (`string.rep`, ciclo infinito, nella suite); T117 ha provato una volta, in un file poi cancellato, che un solo pattern di `string.find` blocca il processo oltre 60 s
- Contromisura: `string.*` con limiti di lunghezza e di pattern, limite di memoria della VM, budget per tick, scatole e tempo limitati per i MarkovJunior (T126); ogni mondo in un worker o processo senza segreti, con limite di memoria e un sorvegliante che lo riavvia dall'ultimo stato valido (T127).
- Task: T126, T127
- Test: `tests/sicurezza/sandbox.test.ts`

### V-008 · La prova di caricamento gira nella sandbox viva, e le funzioni Lua passate all'`Host`
- Gravità: alta
- Stato: `specificata`
- Superficie: `src/kernel/validator.ts`, l'`Host` di `src/kernel/sandbox.ts`
- Proprietà violata: non si esce dalla sandbox: un modulo non ancora approvato non gira nella VM del mondo, e nessuna funzione Lua diventata JS gira fuori da `guarded`
- Prova: solo lettura del codice (T117)
- Contromisura: la prova di caricamento dei moduli in una VM usa e getta; verificare e riparare le funzioni Lua dentro le tabelle passate all'`Host`.
- Task: T122
- Test: —
- Esito: R8 ridotta come ha deciso l'autore: qui resta solo ciò che tocca la sandbox; il resto di R8 è V-018.

### V-009 · La coda delle CLI
- Gravità: alta (oggi: alta se si usano gli abbonamenti)
- Stato: `specificata`
- Superficie: `server/subscriptionQueue.ts`, `tools/abbonamenti/servi.ts`, `POST /api/coda`
- Proprietà violata: non si esce dalla sandbox: un testo dettato dal giocatore non arriva a un agente con strumenti sulla macchina di chi gioca
- Prova: solo lettura del codice (T117), nessuna CLI lanciata
- Contromisura: route montata solo su richiesta esplicita, solo in loopback, con un segreto locale; CLI in una cartella vuota, ambiente ridotto, strumenti esclusi e configurazione MCP e hook isolati, con conferma verificata; se Antigravity non può escludere gli strumenti, niente Antigravity sulla coda. In produzione la coda non c'è.
- Task: T128, T133
- Test: —

### V-010 · Il master e i crediti
- Gravità: media
- Stato: `specificata`
- Superficie: `src/session/server.ts` (il Referente e `giveCredits`, il ramo pubblicato, i file mandati al master)
- Proprietà violata: i crediti non si toccano: né da una risposta del Referente senza tetto, né da un ramo pubblicato; i saldi degli altri non vanno al master nei file
- Prova: solo lettura del codice (T117)
- Contromisura: saldi fuori dai file (con V-005); nessuna via da Lua, dal Concilio, dal ramo o dal rollback; chi può ricaricare a mano e con quale tetto, scritto nell'ADR di T125.
- Task: T125
- Test: —

### V-011 · Nessun limite ai messaggi
- Gravità: media
- Stato: `specificata`
- Superficie: `src/session/server.ts`, `inbox` e i messaggi del protocollo
- Proprietà violata: un giocatore solo non esaurisce i budget comuni del mondo
- Prova: solo lettura del codice (T117)
- Contromisura: ritmo per client, lunghezza massima del testo, code per pagante; il gioco normale non se ne accorge.
- Task: T129
- Test: —

### V-012 · Ciò che esce verso il giocatore
- Gravità: media
- Stato: `specificata`
- Superficie: `playerFiles` in `src/session/server.ts`; i file sotto la radice serviti da Vite in sviluppo (da verificare)
- Proprietà violata: a un giocatore arriva solo ciò che il suo client disegna (ADR-0061)
- Prova: solo lettura del codice (T117)
- Contromisura: `playerFiles` a elenco di campi ammessi; `universes/` non servito da Vite.
- Task: T130
- Test: —

### V-013 · Configurazione scrivibile
- Gravità: media
- Stato: `specificata`
- Superficie: `keepGame` in `src/kernel/kernel.ts`, `universe.json → ai`, i percorsi che il Concilio scrive (non verificati)
- Proprietà violata: budget e provider sono soldi veri: fuori dal «tutto si può modificare»
- Prova: solo lettura del codice (T117)
- Contromisura: il Concilio scrive solo in un elenco di percorsi; `ai` solo dal kernel, su comando del master.
- Task: T130
- Test: —

### V-014 · Vite 5.4.10
- Gravità: media
- Stato: `specificata`
- Superficie: le dipendenze, `server.fs.deny` che protegge `.env`
- Proprietà violata: le dipendenze non hanno avvisi noti aperti senza un motivo scritto
- Prova: nessuna: T117 lo ricorda, `npm audit` non è stato lanciato
- Contromisura: lanciare `npm audit`, aggiornare ciò che serve (Vite compreso), riportare ciò che resta aperto e perché; in produzione niente server di sviluppo.
- Task: T131, T133
- Test: —

### V-015 · XSS e reindirizzamento aperto
- Gravità: bassa
- Stato: `specificata`
- Superficie: `realm.seed` in `site/sessioni.ts`, `returnUrl` del checkout in `server/stripe.ts`; i testi delle pagine fuori dalla ricerca di T117 non sono stati guardati
- Proprietà violata: un testo o un valore dei file dell'universo non diventa codice nella pagina; il checkout torna solo alla stessa origine
- Prova: solo lettura del codice (T117)
- Contromisura: `Number()` sul seme, `returnUrl` limitato alla stessa origine, una CSP compatibile con three.js e con i worker.
- Task: T132
- Test: —

### V-016 · Errori e segreti
- Gravità: bassa
- Stato: `specificata`
- Superficie: `server/stripe.ts`, `dist/`
- Proprietà violata: nessun segreto e nessun dettaglio interno arriva al client
- Prova: solo lettura del codice (T117); `dist/` non controllato
- Contromisura: errori generici al client e dettagli nel log; un test che cerca valori finti dei segreti in `dist/` dopo una build con un ambiente di prova.
- Task: T132
- Test: —

### V-017 · `string.dump` raggiungibile con la sintassi a metodo
- Gravità: bassa
- Stato: `specificata`
- Superficie: `src/kernel/prelude.lua`, la metatabella delle stringhe
- Proprietà violata: non si esce dalla sandbox: ciò che il prelude toglie non resta raggiungibile da un'altra via
- Prova: solo lettura del codice (T117, annotazione dell'audit)
- Contromisura: togliere `dump` dalla tabella vera nel prelude, dopo averne preso le copie.
- Task: T122
- Test: —

### V-018 · Il codice generato non ha permessi per viandante
- Gravità: bassa
- Stato: `accettata`
- Superficie: `set`, `destroy`, `inv_add`, `inv_remove`, `spawn` in `src/kernel/kernel.ts`; l'ambiente `U` e il `by` delle rune; `apiErrors` in `src/kernel/validator.ts`, che aiuta il modello e non è una difesa
- Proprietà violata: nessuna di quelle che contano: dentro il gioco, a parte i crediti, tutto si può modificare
- Prova: solo lettura del codice (T117)
- Contromisura: nessuna. Se il codice generato arrivasse ai crediti (tramite `by` o altro) è V-010 o una voce nuova, non questa.
- Task: —
- Test: —
- Esito: decisione dell'autore, 01/11 (testa della sezione «La sicurezza» del backlog): le difese di R8 sui permessi per viandante, su `U` in sola lettura e sul `by` delle rune non si fanno; i rollback bastano.

### V-019 · L'uscita dalla sandbox verso JS non è stata provata
- Gravità: critica
- Stato: `specificata`
- Superficie: `src/kernel/sandbox.ts`, `src/kernel/prelude.lua`, wasmoon nel processo che tiene i segreti
- Proprietà violata: non si esce dalla sandbox: da Lua nessun accesso a `process`, `require`, costruttori o prototipi JS, e un valore finto nell'ambiente non arriva a Lua. **Non è una falla dimostrata**: è la proprietà che conta di più e che T117 non ha potuto provare
- Prova: test per i soli globali nascosti, nella suite; le vie indirette (valori restituiti dall'`Host`, metatabelle, `pcall` e coroutine contro il budget) non provate
- Contromisura: test che affermano la proprietà su ogni via, e chiusure dove non regge; se una sessione non può provarla, l'autore decide se farla vedere a una persona esperta.
- Task: T122
- Test: `tests/sicurezza/sandbox.test.ts`

## Ciò che nessuna voce copre ancora

Da «Cosa non è stato fatto» dell'audit: la lettura completa di `kernel.ts`, delle route di scrittura del Concilio e dei testi del DOM di gioco. T130 guarda le scritture del Concilio, T132 i testi del sito;
ciò che ne esce diventa una voce. Le prove HTTP e WebSocket contro un server vero sono di T137 (lo stato di oggi) e T134 (dopo le correzioni).
