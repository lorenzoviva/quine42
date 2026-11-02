# ADR-0114 · Le risorse per account: chi avvia un mondo, quanto dura, quanto si chiede

- Stato: accettato
- Data: 2026-11-02
- Task: T172 (V-026)

## Contesto

Il secondo audit (ADR-0113, `docs/sicurezza/audit-2026-11-2.md`) ha lasciato aperta V-026: un mondo vero partiva appena un socket nominava un universo, prima di verificare il token, e non si fermava più, quindi `QUINE_MONDI_MASSIMI` si occupava senza identità; un account faceva universi senza limite; un anonimo lasciava un file e un commit di profilo in ogni universo; socket e rotte non avevano un ritmo. Con gli account il server ascolta chiunque: va chiusa prima di esporlo (T45f).

## Decisione

1. **Un mondo parte per chi prova chi è** (`admit` in `server/session.ts`). Un socket aperto non occupa nulla: ha 15 s (`ENTRY_MS`) per dire `entra`, dopo 16 messaggi senza dirlo si chiude, e fino ad allora nulla va a un mondo. Con gli account il token si verifica qui, prima di prendere un posto; il mondo lo verifica di nuovo, perché è lui che decide chi entra. Il nome di un universo che non potrà mai partire (V-025) si rifiuta subito, senza aspettare. Vale anche un anonimo: entrare in un reame senza essersi registrati è previsto (ADR-0082), e un reame fermo deve poter ripartire per lui.
2. **Un account non tiene tutti i posti.** Al più `ACCOUNT_SOCKETS` (4) socket insieme, e chi avvia un mondo fermo ha un ritmo (`WORLD_STARTS`, sei e poi uno ogni 100 s), per account e per indirizzo.
3. **Un mondo vuoto si salva e si ferma** dopo 5 minuti (`WorldTimes.idle`): lo dice il sorvegliante (`onIdle`), solo se il mondo gira. Chi era nel mondo è andato via, quindi nessun client è collegato e il rientro (`mondo`, `reenter`) non c'entra: un mondo che riparte per un guasto con qualcuno collegato non è vuoto. Finché il mondo si salva l'universo è in `stopping`: chi arriva aspetta e trova un processo nuovo, mai due sugli stessi file; le rotte leggono il disco dopo il salvataggio; il posto conta ancora tra i mondi accesi.
4. **Una quota di universi per account** (`QUINE_UNIVERSI_PER_ACCOUNT`, 3): si contano gli universi di cui è master, da `universe.json`, che alla nascita scrive il server. Si controlla prima di leggere il corpo e di nuovo in una coda per master, così due richieste insieme non trovano entrambe posto. Un clone conta per chi lo riceve. L'autore (`QUINE_MASTER`) non ha quota. Siccome ciò che si butta resta in `.cestino/`, anche fare e clonare ha un ritmo per account (`UNIVERSES_MADE`, dodici e poi uno ogni due ore). Con gli account un anonimo non fa universi, nemmeno da questa macchina.
5. **`POST /api/viandante`, con gli account: un ritmo per account** (`PROFILE_SAVES`, sei e poi uno al minuto) per tutti, e un anonimo solo dove il mondo lo conosce; nessuno in una partita in singola, che su quel server non è di nessuno. Un account vero può salvare il profilo di un reame in cui non è ancora entrato: la pagina del profilo lo prevede, e un account costa più di un anonimo. Il ritmo tiene il resto.
6. **Un ritmo per indirizzo, nel server di produzione** (`FRONT_RATES`): ogni rotta (240, poi 4 al secondo), ciò che legge o scrive un universo intero (60, poi 1 al secondo), i socket nuovi (30, poi uno ogni 2 s) e quelli aperti insieme (24). Un `429` con `Retry-After`. Le pagine della build non hanno ritmo: non vi si calcola nulla. Una richiesta di un mondo non ha ritmo, ma solo col suo token (`isInternal`). Molte persone possono stare dietro un indirizzo: i numeri lasciano loro spazio e fermano chi martella. Il server di sviluppo non li ha: ascolta questa macchina e non si espone (regola 8h).
7. **L'indirizzo non lo dice il client** (`clientAddress` in `server/rates.ts`). Senza altro detto conta il socket, e `X-Forwarded-For` non vale nulla. Dietro un bilanciatore si dichiara quanti proxy nostri ci sono (`QUINE_PROXY_FIDATI`, N): ognuno aggiunge a destra l'indirizzo che ha visto, quindi vale l'N-esimo da destra, e ciò che il client ha scritto resta a sinistra. Una lista più corta o una voce che non è un indirizzo: il socket. Un valore che non è un numero: il server non parte. Un IPv6 conta per i suoi primi 64 bit, ciò che ha un cliente solo. Il numero giusto dipende da come si pubblica il server e **si misura al deploy** (T45f): se è troppo alto un client sceglie il proprio indirizzo; se è troppo basso, tutti valgono come il proxy e vengono rifiutati insieme, che è sicuro, e il log lo dice una volta.

## Alternative scartate

- **Un elenco di indirizzi di proxy fidati**: sui servizi gestiti gli indirizzi interni non si conoscono e cambiano; contare i salti non dipende da loro.
- **Fidarsi di `X-Forwarded-For` se la richiesta viene da un indirizzo privato**: un altro processo della stessa rete si sceglierebbe l'indirizzo.
- **Vietare a un anonimo di avviare un mondo**: un reame fermo resterebbe chiuso a chi ci entra da anonimo, e il mondo si ferma proprio quando è vuoto. I ritmi tengono il costo.
- **Il ritmo come limite per ogni rotta, dentro ciascuna**: una rotta nuova nascerebbe senza. Sta alla porta, e nelle rotte resta solo ciò che riguarda l'account.
- **Solo la quota, senza ritmo su ciò che si fa**: fare e buttare riempirebbe `.cestino/`, che non si cancella mai (regola 6).

## Conseguenze

- Un socket deve dire `entra` subito: il client lo fa (`SessionClient`, dopo l'accesso), ma un messaggio prima di `entra` non viene conservato.
- Riaprire un reame fermo costa un avvio intero: ogni mondo è un processo suo e la cache delle forme non passa da uno all'altro (ADR-0108). Chi entra aspetta come al primo ingresso.
- Ciò che un mondo stava generando senza nessuno collegato si ferma con lui: niente chiamate pagate per un mondo che nessuno guarda.
- Non coperti, da fare al bilanciatore (T45f): chi ha molti indirizzi e molti account occupa i posti (al più `QUINE_MONDI_MASSIMI`, la macchina regge), le connessioni HTTP aperte e lente, il traffico delle pagine, e una quindicina di indirizzi che leggono universi interi al loro ritmo, che saturano il processo (la misura qui sotto). Resta possibile riempire il disco con molti account veri e tutti i loro universi: ogni account vale al più la quota × 32 MB più ciò che il suo mondo scrive.
- La misura di carico è in `docs/sicurezza/esiti/2026-11-02-T172-carico.md`.
