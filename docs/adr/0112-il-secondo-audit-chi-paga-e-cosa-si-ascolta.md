# ADR-0112 · Il secondo audit: chi paga, chi può far spendere, cosa si ascolta prima di sapere chi è

- Stato: accettato
- Data: 2026-11-02
- Task: T167 (V-020, V-021, V-022, V-023, V-024, V-025, V-027, V-028, V-029; V-026 resta da fare)

## Contesto

Il secondo audit (`docs/sicurezza/audit-2026-11-2.md`) ha riletto da avversario il codice aggiunto dalle correzioni e ha provato ogni sospetto. Le falle trovate hanno alcune decisioni in comune, che vanno oltre la riga corretta.

## Decisione

1. **Il pagante non si ricava da chi tiene il corpo predefinito** (V-022). `as` non attraversa un `await` (ADR-0054), quindi dopo un `await` `wanderer()` dice `io`: una persona che rispondeva a un giocatore, anche anonimo, costava al master. In una partita di molti, fuori da un `as`, `kernel.payerNow()` dà `comune`; ciò che una richiesta di un viandante chiede dopo un `await` passa il suo `chi` (`talk`).
2. **Con gli account, le spese comuni vogliono qualcuno che paga** (V-023). `kernel.commonNeedsPayer`, acceso da `SessionServer` quando c'è un verificatore: se nessuno dei collegati ha crediti, le chiamate `comune` vanno ai modelli locali. Prima le pagava il padrone della chiave fino al tetto del giorno, e chiunque poteva esaurirlo per tutti. **Senza account resta com'era**: è questa macchina e la sua chiave, e lo sviluppo non deve aver bisogno di crediti. Il prezzo è noto: un mondo pubblico senza paganti produce contenuti dei modelli locali, che restano nella sua storia. Se uno dei collegati ha crediti, la quota di chi non ne ha non passa agli altri: resta al padrone della chiave, come dice ADR-0081.
3. **Un modello di Google fuori listino costa come il più caro** (V-024), nel proxy e nell'addebito (`billedModel` in `prices.ts`): costare zero per il pagante e il massimo per la chiave era un modo di giocare gratis. Un universo può ancora nominare un modello (ADR-0099).
4. **Ciò che arriva dal filo non getta eccezioni** (V-021). `SessionServer.handleSafely` è l'unico modo in cui un messaggio viene eseguito; l'ingresso e il canale del processo hanno il loro `try`; il processo del mondo registra le promesse fallite invece di morire. Un messaggio incomprensibile costa la sua risposta, mai il tick o il processo. Dal filo i numeri si leggono guardando il tipo: `Number()` e `String()` possono gettare su un oggetto scritto in JSON.
5. **Un socket avvia solo il mondo di una partita di molti che esiste, e al più `QUINE_MONDI_MASSIMI` (16)** (V-025, `worldRefusal` in `server/session.ts`). Non chiede ancora chi è: questo è V-026, con la quota degli universi per account e i ritmi HTTP, perché cambiano il momento in cui un mondo parte e quando si ferma.
6. **Prima di «entra» nulla arriva al mondo** (V-028): i limiti di ADR-0107 sono per viandante, e prima non c'è un viandante. Per lo stesso motivo il checkout passa da `gate` (regola 8b) e `create` rifiuta chi non può creare prima di leggere il corpo.
7. **Ciò che Lua lascia al kernel resta scrivibile** (V-027): una lista cresce al più di uno alla volta, e una tabella data al kernel non supera `MAX_TABLE_SIZE` chiavi una volta scritta per intero, contando due volte ciò che è condiviso. Restano i cicli fatti scrivendo una vista in un'altra, vedi «Conseguenze».
8. **Al client solo le parole scritte per lui** (V-020, `failureText` in `server/access.ts`): un elenco delle frasi del server; il resto (git, file system, parser) va nel log.
9. **Il server di sviluppo non ha CORS** (V-029, `cors: false`): il gioco è della stessa origine. Prima una pagina di qualunque altra porta di questa macchina leggeva i file del progetto.

## Alternative scartate

- **`AsyncLocalStorage` per il pagante**: risolve tutti gli `await` in Node, ma il kernel gira anche nel browser, dove non c'è.
- **Dividere le spese comuni solo tra chi ha crediti**: sposterebbe il costo di chi non paga su chi paga, che non l'ha scelto. È una scelta di prezzo, non di sicurezza.
- **Spegnere i contenuti comuni senza paganti invece dei modelli locali**: fermerebbe la vita del mondo per chi gioca da anonimo.

## Conseguenze

- Un `Kernel` usato in una partita di molti fuori da un `as` non attribuisce più nulla a `io`: chi aggiunge un flusso che chiama i modelli dopo un `await` e vuole far pagare il viandante passa `chi`.
- Restano, in `audit-2026-11-2.md`: V-026 (specificata, task proposto); un ciclo fatto scrivendo una vista in un'altra fa fallire `JSON.stringify`, nel mondo di chi lo fa (codice generato, dentro il processo del mondo, c'è il rollback).
- T133 deve riusare `worldRefusal` e tenere spento il CORS.
