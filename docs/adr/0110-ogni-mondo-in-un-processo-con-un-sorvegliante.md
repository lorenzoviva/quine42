# ADR-0110 — Ogni mondo in un processo, con un sorvegliante

- Stato: accettato
- Data: 2026-11-02
- Task: T127, integrato da T169 (voce V-007 del registro, prima metà in ADR-0105; tocca ADR-0058, ADR-0102, ADR-0107, ADR-0108, ADR-0109)

## Contesto

Tick, Lua, programmi MarkovJunior, HTTP e segreti stavano nello stesso processo e nello stesso event loop: i limiti di ADR-0105 riducono un blocco a qualche
secondo per chiamata (fino a `MAX_FORM_TIME` per un modello), ma non lo tolgono, la memoria dal lato JS non è contata e un difetto di wasm o di Lua
stesso (V-019) arriverebbe dove stanno la chiave di Gemini e quella di Stripe.

## Decisione

1. **Un processo per mondo, non un `worker_thread`.** Un worker condivide lo spazio di indirizzi con chi tiene i segreti; un processo no.
   `server/worldHost.ts` (`WorldHost`) lo avvia con `fork`; ciò che gira dentro è `src/session/worldProcess.ts` attorno a `openUniverse` (`host.ts`).
2. **Un programma intero, in una cartella sola.** `buildWorld` lo costruisce con Vite (`mondo.mjs` con tutte le dipendenze, più `glue.wasm`) in
   `node_modules/.quine-mondo/<pid>/`, una volta per avvio del server e di nuovo se cambiano i sorgenti; un mondo acceso tiene il suo. `ssrLoadModule` non serve più.
3. **Niente segreti**: l'ambiente è ridotto a `worldEnv()`, i parametri arrivano dal canale (`apri`), mai da ambiente o comando. Chi chiama Gemini e chi
   verifica un token lo chiede al server sul canale (`chiedi`, `src/session/worldwire.ts`): la chiave e `GeminiGate`, con i suoi limiti, restano lì.
4. **Il permesso di Node**: `--permission` con lettura solo della cartella del programma e, per l'archivio dei saldi di quell'universo, lettura e scrittura di
   `<nome>.json*`. Niente processi figli né worker. **Una cartella permessa apre tutto ciò che contiene**: mai una cartella superiore, dove sta il `.env`. Per questo
   il programma è intero e Node gira con `--preserve-symlinks` e `--preserve-symlinks-main`, che evitano al caricatore di guardare ogni passo del percorso (un test tiene un segreto accanto a `node_modules`).
5. **Il token del mondo vale per il suo universo**: `worldToken(segreto, nome)` (HMAC) al posto del segreto del processo in `X-Quine-Interno`, solo sulla
   strada `/api/universe/<nome>`. Il segreto non è più un token e un mondo non clona. I saldi restano nel `FileLedger`, su disco, col lucchetto tra processi di ADR-0104.
6. **Il limite di memoria**: `--max-old-space-size` (1024 MB, `QUINE_MONDO_MEMORIA` nel `.env`). Oltre, il processo muore da solo e il sorvegliante lo riavvia.
7. **Il sorvegliante**: il mondo manda `vivo` ogni secondo **dal timer dei suoi tick**. Dopo 5 s di silenzio i client hanno un avviso, dopo 45 s (più di `MAX_FORM_TIME`, il massimo che un
   programma valido può tenere il mondo) il processo è ucciso; l'apertura ha 180 s. Riparte da ciò che c'è su disco. Alla seconda morte di fila torna all'ultimo
   commit vissuto (visto, con il mondo vivo per i 60 s dopo), con il commit «ritorno a …»; alla quarta si arrende: i client hanno un `rifiuto` e il prossimo riprova. Un'apertura che fallisce la prima volta (l'universo non c'è, è in singola) non riparte.
8. **I client restano**: il WebSocket è del server, non del mondo. `{t: 'mondo', stato: 'fermo' | 'ripreso' | 'ripartito', testo}` è un avviso, non un errore; a `ripartito` `SessionClient` risponde alle
   azioni in sospeso con un esito negativo e rientra con `entra` (un token fresco, `freshToken`), e al secondo `ingresso` `ThinClient.again` butta ciò che lo specchio ha del mondo vecchio e riprende tutto.
9. **Le rotte chiedono al mondo** con `WorldCalls` (`server/worldCalls.ts`, `getActiveWorld`): asincrone, con 10 s; un mondo bloccato fa fallire la rotta, non la ferma. Il webhook di Stripe che fallisce viene riconsegnato, e l'accredito è idempotente.
10. **Con la cache delle forme (ADR-0108), T169.** A ogni riavvio la cache riparte da vuota: il primo avvio costa 11 s (misurati sul seme; prima di `pronto`, sotto i 180 s dell'apertura, che sono fuori dai 5 s e dai 45 s). I programmi nel mondo girano **uno per turno del ciclo** (`TurnRunner` in `host.ts`, non `InlineRunner` da solo): una raffica nello stesso tick sommerebbe i suoi secondi senza un battito, e più di 45 s farebbero uccidere il mondo, che al riavvio ricomincerebbe da capo. L'apertura aspetta ciò che il boot ha chiesto (`idle`), così i più lenti del campus (5 s uno) non pesano su chi gioca. Il silenzio massimo misurato camminando è di 1 s. La cache su disco e `engineVersion` restano dei test: nel programma non ci sono.
11. **Con i limiti ai messaggi (ADR-0107), T169.** `LIMITS` e `heavy` stanno in `SessionServer`, quindi nel processo del mondo: valgono, e chi non smette è chiuso (`chiudi` sul canale). Un mondo fermo però non li applica, e ciò che gli si manda resterebbe nella memoria del server: `MAX_BACKLOG` (8 MiB, in `worldHost.ts`) è il tetto di ciò che è in viaggio; oltre, il messaggio si perde, e chi aspetta una risposta ha un `esito` negativo.
12. **Con gli elenchi (ADR-0109), T169.** Tutto ciò che esce dal mondo lo scrive `SessionServer`, quindi con `playerFiles`; `mondo` dice solo `stato` e `testo`, fissi nel server. `node_modules/.quine-mondo/` il server di sviluppo non lo serve (`server/hidden.ts`, `server.fs.deny`).

## Conseguenze

- Un mondo bloccato non ferma l'HTTP né un altro mondo, e riparte. Cosa si perde: ciò che è successo dopo l'ultimo `saveState` (al più 2 minuti) o, alla seconda morte di fila, dopo l'ultimo commit vissuto.
- Un mondo costa un processo con il suo V8 e il primo mondo dopo un cambio dei sorgenti aspetta la build (qualche secondo). I messaggi passano due volte da JSON verso il client solo da server a mondo: dal mondo al client vanno già scritti.
- **Ciò che resta**, da sapere: su Node 22 il permesso non limita la rete, quindi chi uscisse da Lua e da V8 arriverebbe alla rete (con un token del solo suo universo, e scrivendo il solo suo archivio dei saldi); non c'è un tetto del sistema sulla memoria fuori dallo heap (quella di Lua la conta `Meter`); un mondo lento ma vivo (tick di 2 s) non viene ucciso e pesa solo su di sé; il canale non ha un tetto al volume di ciò che un mondo compromesso può mandare; ciò che gira nel validatore (`modelErrors`, una pubblicazione con molti modelli lenti) non passa da `TurnRunner`, e 6 modelli da 8 s nello stesso commit tacerebbero oltre il limite: oggi lo Scultore ne scrive uno alla volta.
- Senza il flag `--permission` (Node prima del 22.13) resta il limite di memoria, senza il limite sul disco.
- Solo `npm run dev`, come prima: il server di produzione (T133) riusa `WorldHost` e `buildWorld`.
