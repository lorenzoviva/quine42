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
- Stato: `chiusa`
- Superficie: `server/universeStore.ts`, tutte le route di `/api/universe`
- Proprietà violata: i non master non riscrivono il Lua sul server e i crediti non si toccano; un non master non legge ciò che `playerFiles` gli nega
- Prova: solo lettura del codice (T117); misurata dal kit (T137, `esiti/2026-11-01.json`): FALLA tutte le scritture e le letture senza identità, anche da un'altra origine e con un Host estraneo (V-001.a-j, l, m); il CORS non è aperto (V-001.k, ok). Giro dell'autore (`esiti/2026-11-01-f12.md`): da `https://example.com` una richiesta `no-cors` **scrive** un file nell'universo (V-001.o, FALLA); la lettura non passa (V-001.n, ok). Dopo T120: test (`tests/sicurezza/accesso.test.ts`: ogni scrittura per ogni tipo di chiamante, letture, singola, master) e kit (`esiti/2026-11-01-dopo-T120.json`): V-001.a-m ok, con V-001.m riscritta perché provi un universo di molti con un master a piacere: creare una partita in singola da questa macchina resta ammesso. V-001.n, o (da un altro sito) sono da rifare a mano nel browser dell'autore; lo stesso effetto è nei test (origine diversa, `text/plain`)
- Contromisura: identità verificata sul server e permessi per operazione su ogni route; su un universo multigiocatore un non master non scrive nulla; `clone` prende il master dall'identità; controllo di `Origin` e `Content-Type`; le letture del sito ricevono solo ciò che serve. In produzione solo le route ammesse.
- Task: T120, T133
- Test: `tests/sicurezza/rotte.test.ts`, `tests/sicurezza/accesso.test.ts`
- Esito: chiusa da T120 (ADR-0102), 01/11/2026, branch `task/T120`. Il master del clone resta nel corpo, ma lo nomina solo il master provato dell'universo di partenza: il perché è nell'ADR. Per T133: in produzione solo le route ammesse.

### V-002 · Il proxy di Gemini spende la chiave per chiunque
- Gravità: critica (oggi: alta)
- Stato: `chiusa`
- Superficie: `server/geminiProxy.ts`, `/api/gemini`
- Proprietà violata: la chiave si spende solo per il gioco e nei budget decisi
- Prova: solo lettura del codice (T117); misurata dal kit prima di T123 (`esiti/2026-11-01.json`, 01/11): FALLA V-002.a-d, ciò che arriverebbe a Google è stato contato su un Google finto. Dopo T123: test con Google finto (`tests/sicurezza/gemini.test.ts`) e kit (`esiti/2026-11-01-dopo-T123.json`, T140): V-002.a-d ok, con V-002.d riscritta perché raggiunga il tetto in dollari (9 chiamate da circa 1 $ su 20, poi 402); come era scritta, 20 chiamate piccole, restava FALLA: costano circa 0,25 $, sotto il tetto. Dopo le altre correzioni la riprova T134
- Contromisura: elenco dei modelli ammessi, corpo massimo ridotto, tetto di spesa nel proxy, solo da loopback con controllo di `Origin`; in multigiocatore il server chiama Google direttamente, senza route pubblica. La chiave resta fuori dal browser.
- Task: T123, T133
- Test: `tests/sicurezza/gemini.test.ts`, `tests/sicurezza/rotte.test.ts`
- Esito: chiusa da T123 (ADR-0099), 01/11/2026, branch `task/T123`. Resta, ed è ciò che l'ADR decide: da questa macchina, senza identità, si spende fino al tetto del giorno (10 $, confermato «per ora» dall'autore il 01/11). Per T133: il server di produzione non monta la route e chiede il tetto nel `.env`.

### V-003 · La cartella di git non è protetta
- Gravità: critica su file system che ignorano le maiuscole (Windows, l'ambiente dell'autore)
- Stato: `specificata`
- Superficie: `safePath` in `server/universeStore.ts`, `cleanBranch` in `src/session/server.ts`
- Proprietà violata: non si esce dalla sandbox: nessuna scrittura arriva alla configurazione di git, perché il server lancia git in quella cartella
- Prova: solo lettura del codice (T117); misurata dal kit (`esiti/2026-11-01.json`): **su Windows una scrittura arriva nella cartella di git con altre maiuscole, con il nome corto e con un flusso NTFS** (V-003.b, c, f, g: solo un file segnaposto, nessuna configurazione toccata); nome esatto, punto o spazio finale e uscita dall'universo sono rifiutati
- Contromisura: elenco dei percorsi ammessi invece di un divieto; normalizzare maiuscole, punti e spazi finali, flussi NTFS e nomi riservati di Windows; git lanciato con `core.hooksPath` vuoto e nessuna configurazione del repository scrivibile.
- Task: T121
- Test: `tests/sicurezza/rotte.test.ts`

### V-004 · Il webhook di Stripe senza segreto non controlla nulla
- Gravità: critica
- Stato: `chiusa`
- Superficie: `server/stripe.ts`, `POST /api/stripe/webhook`, nel server di sviluppo e, da T105, nella preview
- Proprietà violata: i crediti non si toccano: nascono solo da un pagamento vero, per il suo importo, dentro l'universo giusto
- Prova: solo lettura del codice (T117); la verifica della firma ha già i suoi test; misurata dal kit (`esiti/2026-11-01.json`): FALLA V-004.a, c, d, e; la firma falsa è rifiutata (V-004.b, ok). Dopo T124 (`esiti/2026-11-01-dopo-T124.json`): V-004.a-e ok; V-004.c è stata riscritta, cercava un file che la cartella `fuori` ha già dalla nascita e sarebbe rimasta FALLA comunque: ora cerca `world/pagamenti.json`, che solo un accredito scrive
- Contromisura: senza segreto la route risponde 503; nomi e id validati come nel checkout prima di finire in un percorso; credito calcolato dall'importo pagato.
- Task: T124
- Test: `tests/sicurezza/rotte.test.ts`, `tests/stripe.test.ts`
- Esito: chiusa da T124 (ADR-0083, aggiornamento), 01/11/2026, branch `task/T124`. Resta da guardare, per T45f: l'esclusione delle tasse dal credito non è provata contro una sessione vera di Stripe con le imposte. L'idempotenza e i saldi nella storia dell'universo sono V-005, T125.

### V-005 · Pagamenti: idempotenza fragile e registro nella storia dell'universo
- Gravità: alta
- Stato: `specificata`
- Superficie: `server/stripe.ts`, `world/pagamenti.json`, `world/giocatori/*.json`
- Proprietà violata: i crediti non si toccano: un evento accredita una volta sola, e `checkout` o `R` non riportano indietro saldi e pagamenti
- Prova: solo lettura del codice (T117); misurata dal kit (`esiti/2026-11-01.json`): **la corsa esiste**: V-005.a ok nel giro di T137 (commit `a55e9d2`), FALLA nel giro dell'autore (`544ce7f`): 8 consegne, 2 accrediti; FALLA V-005.b e c: il ritorno a un commit riporta indietro il saldo
- Contromisura: saldi e registro dei pagamenti in un archivio del server fuori dalla storia dell'universo, con migrazione dai file di oggi; accredito atomico e idempotente.
- Task: T125
- Test: —

### V-006 · Identità scelta dal client
- Gravità: alta (critica senza account)
- Stato: `chiusa`
- Superficie: `src/session/server.ts`, `server/session.ts`, `GET /api/session`, `/api/viandante`, `/api/crediti`
- Proprietà violata: i non master non riscrivono il Lua: nessuno diventa master dicendolo; `anonimo`, `tetto` e `offline` non li decide il client
- Prova: solo lettura del codice (T117); misurata dal kit (`esiti/2026-11-01.json`): FALLA V-006.a-e, compreso `GET /api/viandante`, che dà il saldo di chiunque senza identità; il protocollo rifiuta ramo, pubblicazione, Concilio e «segui» a un non master (V-006.f, ok); giro dell'autore (`esiti/2026-11-01-f12.md`): la pagina di un altro sito apre il WebSocket ed **entra nel mondo** come viandante (V-006.g, FALLA). Dopo T120: test (`tests/sicurezza/accesso.test.ts`) e kit (`esiti/2026-11-01-dopo-T120.json`): V-006.a-f ok. **V-006.a ed e sono riscritte**: su loopback senza account l'id detto vale, come vuole la contromisura, quindi si misurano da fuori, con un'intestazione di inoltro (è ciò che aggiunge un tunnel; il kit non esce dalla macchina); da un indirizzo davvero esterno lo prova il test di `admitSocket`. V-006.g è da rifare a mano nel browser dell'autore
- Contromisura: senza verificatore l'id scelto dal client vale solo da loopback; `anonimo`, `tetto` e `offline` decisi dal server; controllo di `Origin` sul WebSocket; `GET /api/session` non elenca i viandanti a chiunque; in produzione niente avvio senza verificatore. `GET /api/viandante` dice il saldo solo a chi lo possiede; lo stesso vale per `/api/crediti`, la superficie nuova di T105 (saldo e storici, stessa identità non verificata, coperta da T120).
- Task: T120, T133
- Test: `tests/sicurezza/rotte.test.ts`, `tests/sicurezza/accesso.test.ts`
- Esito: chiusa da T120 (ADR-0102), 01/11/2026, branch `task/T120`. Resta, ed è ciò che l'ADR decide: chi sta sulla macchina di un server senza account è chi dice di essere. Per T133: in produzione niente avvio senza verificatore.

### V-007 · Il blocco del tick ferma tutti
- Gravità: alta
- Stato: `in correzione`
- Superficie: `src/kernel/prelude.lua`, `src/session/host.ts`, le funzioni C di `string.*`, i programmi MarkovJunior sul server (`src/kernel/validator.ts`)
- Proprietà violata: il codice del mondo non ferma il processo: né gli altri mondi né l'HTTP. Prima di T126 il budget contava istruzioni VM per chiamata, non il lavoro nelle funzioni C, non il tick, non la memoria
- Prova: test (`string.rep`, ciclo infinito, nella suite); T117 ha provato una volta, in un file poi cancellato, che un solo pattern di `string.find` blocca il processo oltre 60 s; misurata dal kit (`esiti/2026-11-01.json`): V-007.a processo ucciso dopo 25 s, V-007.b nessun guasto, V-007.c un mondo bloccato ferma tutto l'HTTP del server
- Contromisura: `string.*` con limiti di lunghezza e di pattern, limite di memoria della VM, budget per tick, scatole e tempo limitati per i MarkovJunior (T126, fatto, ADR-0103: restano un blocco di qualche secondo per chiamata, la memoria dal lato JS e i modelli fino a `MAX_FORM_TIME`); ogni mondo in un worker o processo senza segreti, con limite di memoria e un sorvegliante che lo riavvia dall'ultimo stato valido (T127).
- Task: T126, T127
- Test: `tests/sicurezza/sandbox.test.ts`

### V-008 · La prova di caricamento gira nella sandbox viva, e le funzioni Lua passate all'`Host`
- Gravità: alta
- Stato: `chiusa`
- Superficie: `src/kernel/validator.ts`, l'`Host` di `src/kernel/sandbox.ts`
- Proprietà violata: non si esce dalla sandbox: un modulo non ancora approvato non gira nella VM del mondo, e nessuna funzione Lua diventata JS gira fuori da `guarded`
- Prova: solo lettura del codice (T117); misurata dal kit e nella suite prima della correzione (`esiti/2026-11-01.json`): ciò che la prova di caricamento esegue restava nella sandbox viva (V-008.a) e una funzione Lua arrivava a JS come funzione (V-008.b); dopo, test: nessuna funzione arriva a JS per nessuna via (tabelle, valori, campi scritti, ciò che un modulo restituisce), quindi nessuna può girare fuori da `guarded`; la prova non chiama l'`Host` vero e non lascia nulla
- Contromisura: `Crossing` (ADR-0101): da Lua a JS soli dati. `Sandbox.probe`: una VM a parte con un `Host` vuoto, azzerata prima di ogni prova (non buttata: la prova è sincrona, aprire una VM no).
- Task: T122
- Test: `tests/sicurezza/uscita.test.ts`, `tests/sicurezza/sandbox.test.ts`
- Esito: `task/T122`, 01/11. R8 ridotta come ha deciso l'autore: qui resta solo ciò che tocca la sandbox; il resto di R8 è V-018.

### V-009 · La coda delle CLI
- Gravità: alta (oggi: alta se si usano gli abbonamenti)
- Stato: `specificata`
- Superficie: `server/subscriptionQueue.ts`, `tools/abbonamenti/servi.ts`, `POST /api/coda`
- Proprietà violata: non si esce dalla sandbox: un testo dettato dal giocatore non arriva a un agente con strumenti sulla macchina di chi gioca
- Prova: solo lettura del codice (T117), nessuna CLI lanciata; misurata dal kit (`esiti/2026-11-01.json`): FALLA V-009.a e b; nessuna CLI lanciata
- Contromisura: route montata solo su richiesta esplicita, solo in loopback, con un segreto locale; CLI in una cartella vuota, ambiente ridotto, strumenti esclusi e configurazione MCP e hook isolati, con conferma verificata; se Antigravity non può escludere gli strumenti, niente Antigravity sulla coda. In produzione la coda non c'è.
- Task: T128, T133
- Test: `tests/sicurezza/rotte.test.ts`

### V-010 · Il master e i crediti
- Gravità: media
- Stato: `specificata`
- Superficie: `src/session/server.ts` (il Referente e `giveCredits`, il ramo pubblicato, i file mandati al master)
- Proprietà violata: i crediti non si toccano: né da una risposta del Referente senza tetto, né da un ramo pubblicato; i saldi degli altri non vanno al master nei file
- Prova: solo lettura del codice (T117); misurata dal kit (`esiti/2026-11-01.json`): FALLA V-010.a e b: un ramo pubblicato cambia un saldo. La risposta del Referente non è provata
- Contromisura: saldi fuori dai file (con V-005); nessuna via da Lua, dal Concilio, dal ramo o dal rollback; chi può ricaricare a mano e con quale tetto, scritto nell'ADR di T125.
- Task: T125
- Test: —

### V-011 · Nessun limite ai messaggi
- Gravità: media
- Stato: `specificata`
- Superficie: `src/session/server.ts`, `inbox` e i messaggi del protocollo
- Proprietà violata: un giocatore solo non esaurisce i budget comuni del mondo
- Prova: solo lettura del codice (T117); misurata dal kit (`esiti/2026-11-01.json`): 600 messaggi su 600 serviti (V-011.a). La lunghezza del testo non è provata
- Contromisura: ritmo per client, lunghezza massima del testo, code per pagante; il gioco normale non se ne accorge.
- Task: T129
- Test: —

### V-012 · Ciò che esce verso il giocatore
- Gravità: media
- Stato: `specificata`
- Superficie: `playerFiles` in `src/session/server.ts`; i file sotto la radice serviti da Vite in sviluppo (da verificare)
- Proprietà violata: a un giocatore arriva solo ciò che il suo client disegna (ADR-0061)
- Prova: solo lettura del codice (T117); misurata dal kit (`esiti/2026-11-01.json`): FALLA V-012.a, b, d: **il server di sviluppo serve i file di `universes/`**; prompt, bibbia, persone e codice non arrivano al giocatore (V-012.c, e, f, ok)
- Contromisura: `playerFiles` a elenco di campi ammessi; `universes/` non servito da Vite.
- Task: T130
- Test: `tests/sicurezza/rotte.test.ts`

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
- Stato: `in correzione`
- Superficie: le dipendenze, `server.fs.deny` che protegge `.env`
- Proprietà violata: le dipendenze non hanno avvisi noti aperti senza un motivo scritto
- Prova: nessuna: T117 lo ricorda, `npm audit` non è stato lanciato; misurata dal kit (`esiti/2026-11-01.json`): **il server di sviluppo dà il contenuto di `.env` con due forme della richiesta** (V-014.c, g: valori finti, in un progetto usa e getta), senza identità; le altre nove forme non danno il valore. `npm audit` lanciato da T131 (01/11): 15 avvisi (2 critici, 5 alti, 8 moderati), ora 0 con Vite 7.3.7 e Vitest 4.1.12 (ADR-0100). Le forme del kit riprovate con le due versioni, con un server su una cartella temporanea e un valore finto: 5.4.10 dà il valore con le forme c e g, 7.3.7 con nessuna. Il kit con il `vite.config.ts` vero (`--solo V-014`, 7.3.7): 11 ok, 0 FALLA, tutte con risposta 403; `esiti/2026-11-01.json` resta la misura di prima
- Contromisura: lanciare `npm audit`, aggiornare ciò che serve (Vite compreso), riportare ciò che resta aperto e perché; in produzione niente server di sviluppo. Fatta da T131 la parte delle dipendenze; resta T133, che chiude la voce.
- Task: T131, T133
- Test: `tests/sicurezza/dipendenze.test.ts`

### V-015 · XSS e reindirizzamento aperto
- Gravità: bassa
- Stato: `specificata`
- Superficie: `realm.seed` in `site/sessioni.ts`, `returnUrl` del checkout in `server/stripe.ts`; i testi delle pagine fuori dalla ricerca di T117 non sono stati guardati
- Proprietà violata: un testo o un valore dei file dell'universo non diventa codice nella pagina; il checkout torna solo alla stessa origine
- Prova: solo lettura del codice (T117); misurata dal kit e da F12 (`esiti/2026-11-01.json`, `esiti/2026-11-01-f12.md`): FALLA V-015.a, b, c: un `seed` non numerico diventa un elemento di `site/sessioni.html`
- Contromisura: `Number()` sul seme, `returnUrl` limitato alla stessa origine, una CSP compatibile con three.js e con i worker.
- Task: T132
- Test: —

### V-016 · Errori e segreti
- Gravità: bassa
- Stato: `specificata`
- Superficie: `server/stripe.ts`, `dist/`
- Proprietà violata: nessun segreto e nessun dettaglio interno arriva al client
- Prova: solo lettura del codice (T117); `dist/` non controllato; misurata dal kit (`esiti/2026-11-01.json`): FALLA V-016.a; nessun valore finto nelle risposte (salvo V-014), nel log, in `dist/` e nel browser (V-016.b-e, ok)
- Contromisura: errori generici al client e dettagli nel log; un test che cerca valori finti dei segreti in `dist/` dopo una build con un ambiente di prova.
- Task: T132
- Test: —

### V-017 · `string.dump` raggiungibile con la sintassi a metodo
- Gravità: bassa
- Stato: `chiusa`
- Superficie: `src/kernel/prelude.lua`, la metatabella delle stringhe
- Proprietà violata: non si esce dalla sandbox: ciò che il prelude toglie non resta raggiungibile da un'altra via
- Prova: solo lettura del codice (T117, annotazione dell'audit); misurata dal kit e nella suite prima della correzione (`esiti/2026-11-01.json`): `dump` raggiunto (V-017.a), non chiamato; dopo, test: non c'è né nella tabella né con la sintassi a metodo, anche dopo un reset
- Contromisura: `dump` tolto dalla tabella vera, in testa al prelude.
- Task: T122
- Test: `tests/sicurezza/uscita.test.ts`, `tests/sicurezza/sandbox.test.ts`
- Esito: `task/T122`, 01/11.

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
- Stato: `chiusa`
- Superficie: `src/kernel/sandbox.ts`, `src/kernel/prelude.lua`, wasmoon nel processo che tiene i segreti
- Proprietà violata: non si esce dalla sandbox: da Lua nessun accesso a `process`, `require`, costruttori o prototipi JS, e un valore finto nell'ambiente non arriva a Lua. È la proprietà che conta di più
- Prova: misurata prima della correzione dal kit e nella suite (`esiti/2026-11-01.json`): **da Lua si raggiungevano `constructor`, `__proto__` e altri campi di JS sui valori che l'Host dà** (V-019.a), guardati per tipo e mai chiamati: la proprietà non reggeva. La lettura di wasmoon aggiunge che anche l'errore di un indice sbagliato arrivava a `pcall` come oggetto JS. Dopo, test su ogni via (`uscita.test.ts`): oggetti, annidati, liste, istanze di classi, argomenti dei moduli, errori, stringhe, funzioni dell'API; scritture del prototipo; budget contro `pcall`, callback e rientri nel kernel. V-019.b del primo kit era vuota (l'ambiente di un modulo è vuoto, `pairs` non scorre nulla): la prova ora va per nomi. Il kit dopo la correzione: 6 ok su 6 per V-008, V-017, V-019 (`esiti/2026-11-01-t122.json`). Ciò che queste prove non coprono è in `audit-2026-11.md`, domanda 1. Le coroutine non si provano: non sono raggiungibili
- Contromisura: `Crossing` (ADR-0101): il proxy di wasmoon è spento, a Lua arrivano viste dei soli campi di dati propri. Un difetto di wasm o di Lua stesso non è coperto da qui: T127, il mondo in un worker senza segreti.
- Task: T122
- Test: `tests/sicurezza/uscita.test.ts`, `tests/sicurezza/sandbox.test.ts`
- Esito: `task/T122`, 01/11.

## Le prove dell'autore

Chi prova ogni voce (T137). Le lettere sono le prove `V-NNN.x`: del kit (`npm run sicurezza:prove`, `tools/sicurezza/catalogo.mjs`) e di [`prove-f12.md`](prove-f12.md); i test stanno in `tests/sicurezza/`. Le misure in [`esiti/`](esiti/). `tests/sicurezza-kit.test.ts` controlla che la tabella e il catalogo dicano le stesse prove: una voce nuova ha qui la sua riga.

| Voce | Kit | F12 | Suite | Non coperto |
|---|---|---|---|---|
| V-001 | a b c d e f g h i j k l m | n o | `rotte.test.ts` | — |
| V-002 | a b c d | — | `gemini.test.ts`, `rotte.test.ts` | un processo di questa macchina spende fino al tetto del giorno: voluto (ADR-0099), un loop di chiamate piccole non si ferma prima |
| V-003 | a b c d e f g h | — | `rotte.test.ts` (solo il nome esatto: le varianti valgono su NTFS) | `cleanBranch` della sessione: T121 |
| V-004 | a b c d e | — | `rotte.test.ts` | — |
| V-005 | a b c | — | — | la corsa con un commit del mondo in mezzo: T125 |
| V-006 | a b c d e f | g | `rotte.test.ts` | `offline` e `tetto` decisi dal client non si vedono da fuori: T120 |
| V-007 | a b c | — | `sandbox.test.ts` | il mondo isolato e il sorvegliante: T127; il kit è da ripassare dopo T126 |
| V-008 | a b | — | `uscita.test.ts`, `sandbox.test.ts` | — |
| V-009 | a b | — | `rotte.test.ts` | gli argomenti delle CLI, che non si lanciano: T128 |
| V-010 | a b | — | — | la risposta del Referente con i crediti: T125 |
| V-011 | a | — | — | la lunghezza del testo, le code per pagante: T129 |
| V-012 | a b c d | e f | `rotte.test.ts` | — |
| V-013 | — | — | — | il Concilio che scrive `ai` si vede solo dentro il kernel: lo prova T130 |
| V-014 | a b c d e f g h i j k | — | `dipendenze.test.ts` | `npm audit`: T131 lo ha lanciato, il kit non esce sulla rete |
| V-015 | a b | c | — | i testi delle altre pagine: T132 |
| V-016 | a b c | d e | — | — |
| V-017 | a | — | `uscita.test.ts`, `sandbox.test.ts` | — |
| V-018 | — | — | — | accettata: non si prova |
| V-019 | a b c | — | `uscita.test.ts`, `sandbox.test.ts` | un difetto di wasm o di Lua stesso: T127 |

## Ciò che nessuna voce copre ancora

Da «Cosa non è stato fatto» dell'audit: la lettura completa di `kernel.ts`, delle route di scrittura del Concilio e dei testi del DOM di gioco. T130 guarda le scritture del Concilio, T132 i testi del sito;
ciò che ne esce diventa una voce. Le prove HTTP e WebSocket contro un server vero: lo stato di oggi nel kit (T137, tabella sopra), dopo le correzioni T134.
