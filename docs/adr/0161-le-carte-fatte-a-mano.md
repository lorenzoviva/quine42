# ADR-0161 — Le carte fatte a mano: forma, archivio, rotte, controllo del programma, interruttore

Data: 2026-11-06 · Stato: accettato (task T293 del backlog, step 41) · Riferimenti: ADR-0056 (le carte), ADR-0084 (l'eredità dei cloni), ADR-0102 (chi chiede e cosa può), ADR-0104 (i saldi fuori dall'universo), ADR-0109 (ciò che esce è un elenco), ADR-0110 (ogni mondo di molti è un processo senza segreti), ADR-0112 (il server di produzione), ADR-0114 (i ritmi), ADR-0123 e ADR-0125 (il suono e le sue soglie), ADR-0131 (`site/beta.json`), ADR-0136 (la versione del kernel), ADR-0153 (la lingua interna); decisione dell'autore D40 A (05/11)

## Contesto

L'autore vuole che i tre laboratori (la sandbox 3D, l'editor dei modelli, il SoundLab) siano dei giocatori: «forkano» un modello o un suono e
modificano la copia, che diventa una carta; spenti nel primo passo della beta, accesi nel secondo (`docs/userchats/to-do-2026-11-05.md`,
«Modificare le carte»). Con D40 A ha deciso dove sta la copia: nella **collezione del suo account, fuori dagli universi**, visibile a tutti
nei laboratori e sul sito; entra in un mondo solo all'inizio di un universo (T295). Oggi `lab/` non ha un archivio (il SoundLab usa
`localStorage`) e chi non è il master non scrive un universo (regola 8b). Questo ADR decide la forma della carta, l'archivio, le rotte, il
controllo del programma e l'interruttore; i laboratori per i giocatori sono T294, l'ingresso in un universo T295, la carta che si rompe T296.

## Decisione

1. **La forma** (`HandmadeCard`, `src/kernel/handmade.ts`):
   - `id`: `handmade-` e dieci lettere o cifre casuali, del server (`newHandmadeId`), mai quello dell'originale né uno detto dal client:
     **un fork non sostituisce mai l'originale**. È un id di modello valido (`MODEL_RE`), così un universo lo prende com'è (T295).
   - `kind`: `model` o `sound`; `class` (una di `CLASSES`) e `size` (una di `SIZE_TIERS`, facoltativa) solo per un modello.
   - `name`: testo di un giocatore (punto 5); `xml`: il programma MarkovJunior.
   - `kernel`: il contratto `X.Y` con cui il programma è stato controllato, quello del server.
   - `author`: il viandante dell'account (`accountWanderer`); senza account, l'id che dice questa macchina o `me`. Non esce mai agli altri.
   - `from`: dove nasce, `{universe, model, fingerprint}` (un modello o un suono di un universo) o `{card, fingerprint}` (un'altra carta
     dello stesso autore); `origins`: la catena di `heritage.ts`. Il client dice solo universo e modello, o la carta: **impronta, titolare e
     catena li legge il server dal disco** (`resolveFrom`), mai dal corpo. Da un modello con una carta la catena è la sua più il suo titolare
     in quell'universo, come un clone (ADR-0084); da un modello del seme, senza carta, non c'è; da una propria carta è la sua.
   - **Ciò che si misura di una carta fatta a mano è il suo programma** (`handmadeFingerprint`: l'impronta dell'XML), qui e quando entra in un
     universo (T295): di un modello generato l'impronta è la voce dell'indice (ADR-0084), che un fork non cambia.
   - `made`, `changed`: date del server. Il file di un account (`HandmadeRecord`) ha anche la **firma** (`signature`), come l'autore si fa
     vedere dagli altri: non è un'identità, due autori possono firmarsi uguali.
2. **L'archivio**: `universes/.handmade/<viandante>.json`, un file per account (`server/folders.ts`: `handmade`), scritto intero e atomico
   sotto un lucchetto come i saldi (`HandmadeArchive`); un file illeggibile non si riscrive mai, la scrittura rifiuta; una voce con l'id di
   una carta che questo kernel non sa leggere (di un kernel di domani, con una classe nuova; o con un autore che non è quello del file)
   resta nel file com'è (`unread`), conta nei tetti e non esce a nessuno. Il nome è inglese, non
   `.carte-mano` come diceva il task: una cartella nuova su disco nasce inglese (ADR-0153). Come i saldi (regola 8d) **nessun repository di
   universo lo contiene**: nessun Lua (non ha il file system), nessun Concilio (scrive solo i percorsi di un universo, `allowedPath`), nessun
   ramo né ritorno (git gira solo in `universes/<nome>/`), nessun mondo (il suo processo legge solo la cartella del suo programma). **Tetti per
   account** (`HANDMADE_CAPS`): 50 carte e 2 MiB di file; un ritmo di scritture (`HANDMADE_WRITES`: dodici, poi una ogni venti secondi).
   Un accesso anonimo non scrive carte (come non fa universi): non si ritrova, e non costa niente farne.
3. **Le rotte** (`server/handmade.ts`, `/api/handmade`): `GET` l'elenco di tutti (le 500 cambiate per ultime, senza programma), `GET ?mine=1`
   le proprie con firma, uso e tetti, `GET /<id>` una carta col programma, `POST` crea, `POST /<id>` aggiorna (il nome senza controllo, il
   programma con il controllo e il contratto), `DELETE /<id>` toglie, `POST /signature` la firma. Tutto passa da `gate`, poi
   dall'interruttore, poi dall'identità (`callerOf`): con gli account leggere ne vuole uno (anche anonimo), scrivere uno non anonimo; senza
   account solo questa macchina. **Il file che si scrive viene solo dall'identità verificata**, mai dalla richiesta: chi non è l'autore non
   trova la carta tra le sue (404), e non c'è un'altra via. Solo JSON (415), un corpo al più ~576 KiB. Nel server di produzione sono
   nell'elenco delle rotte e ogni loro richiesta è **pesante** per il ritmo per indirizzo (`HEAVY`, `FRONT_RATES`).
   **Ciò che esce a un altro è un elenco** (regola 8f, `handmadeSummary`, `handmadeView`): id, tipo, nome, classe, taglia, contratto, firma,
   `mine`, da quale universo e modello (o carta), date, lunghezza, e aperta il programma; mai l'id dell'autore, la catena o le impronte.
   L'autore vede anche la catena delle sue. I campi sul filo sono inglesi (`ok`, `reason`, `errors`, `card`, `cards`); i testi italiani.
4. **Il controllo del programma** (`handmadeProgramErrors`), sul motore vero e con **tetti misurati sui programmi del seme**
   (`HANDMADE_LIMITS`, `lab/scripts/carte-mano.ts`, che li rimisura ed esce con 1 se un programma del seme che il validatore prende non ci
   sta): il testo 128 KiB; la griglia 2 milioni di celle e 256 di lato, `map` compresi; ogni corsa 250 000 passi e 4 s; **ogni seme della
   sua classe** (`classSeeds`, gli stessi del mondo), nella scatola che il gioco gli dà (la sua `size`, o quella della classe alla sua
   taglia), deve finire e stare in piedi (`analyse`, come ogni modello del validatore); poi ogni azione e ogni fotogramma di ogni animazione,
   come li fa il gioco, entro 100 000 passi e 1 s ciascuno, al più 16 azioni e 16 animazioni; un suono passa le soglie dell'analisi su tre
   semi come quelli del Musicista (`soundErrors`, esportata dal validatore), entro 8 s; tutto entro 15 s. Un modello non è un suono e un
   suono non è un modello. Il testo si legge prima con il lettore che lo attraversa una volta (`parseXml`), così un XML ostile (commenti o
   tag mai chiusi, annidamento, entità, regole da file) torna indietro subito. Il giocatore che salva vede i motivi (422, `errors`).
   **Dove gira**: nel server di produzione, in un processo suo, il **programma dei mondi** (`mondo.mjs`, che risponde al messaggio `check`
   con `checked`; `server/programCheck.ts`, `processChecker`): un processo per controllo, avviato con `worldFlags` e `worldEnv` (nessun
   segreto, 512 MB, sola lettura della sua cartella), ucciso a 25 s; uno alla volta, una coda di 8, poi 503. Il server HTTP non aspetta mai
   un programma: un passo solo può durare quanto vuole. In `npm run dev` e nell'anteprima lo stesso controllo gira nel processo del server
   (`inlineChecker`), come il validatore: ascoltano solo questa macchina (regola 8h).
5. **I testi di un giocatore** (`cleanText`, `cleanCardName`): una riga (gli spazi si uniscono, NFC), al più 60 caratteri il nome e 40 la
   firma, almeno una lettera o una cifra, niente `<` `>`, niente caratteri di controllo, di formato (compresi i rovesciamenti
   bidirezionali e quelli di larghezza zero), privati, non assegnati o surrogati. Ciò che non va torna col motivo, non si corregge in
   silenzio. Il nome può diventare il nome di una cosa in un mondo: passa anche da `metaBreak` (la quarta parete, ADR-0025). Chi li mostra li
   mostra come testo (T294).
6. **La versione**: la scrittura di un programma dice il contratto per cui è scritto (`kernel`, `X.Y` o `X.Y.Z`); un altro contratto torna
   409, nessun contratto 400. Una carta di un contratto vecchio resta nell'archivio con il suo `kernel`; si riscrive (e si ricontrolla) solo con questo.
   Per ora nessuna migrazione dell'archivio: un contratto che cambia i programmi dirà cosa farne, come `migrations.ts` per gli universi.
7. **L'interruttore**: `site/beta.json → laboratori` (`labsOn` in `server/betaGuide.ts`), separato da `laCorona`, spento salvo `true`
   esatto. Spento, ogni rotta delle carte rifiuta chiunque (403, «i laboratori non sono aperti»), anche il master, e il server di produzione
   non serve `/lab` (`NOT_SERVED`), come oggi; nessuna pagina porta ai laboratori. `npm run dev` lo legge a ogni richiesta, il server di
   produzione quando parte (`serve.ts` → `ProductionOptions.labs`): accenderlo vuole un riavvio, e una build per i link che porterà T294.

## Alternative scartate

- **Il controllo nel processo del server HTTP, con un tempo breve**: il motore guarda l'orologio solo tra un passo e l'altro, e un passo di
  un programma ostile può durare minuti; il server fermo è fermo per tutti (i socket delle partite passano di lì). Il programma dei mondi è
  già il processo senza segreti con il motore dentro (ADR-0110): costruirne un altro avrebbe raddoppiato build e sorveglianza.
- **Un processo del controllo sempre acceso**: più veloce, ma ciò che un programma lascia (memoria, stato del motore) resterebbe per il
  prossimo; un processo per controllo costa mezzo secondo a una scrittura che ha comunque un ritmo.
- **Fidarsi del controllo del laboratorio nel browser**: il programma finisce nei browser e nei mondi degli altri; il client si può
  riscrivere. Il laboratorio lo farà prima di salvare, per rispondere subito (T294), ma vale solo quello del server.
- **Catena e impronta dette dal client**: chi salva potrebbe mettersi nella catena di chiunque e prendere le sue quote quando la carta sarà
  usata in un universo (T295); il server le legge dal disco.
- **L'id dell'autore come firma**: è l'uid dell'account, che oggi non esce a chi non lo conosce (`/api/session` non lo dice).
- **Leggere l'elenco senza account**: «visibili a tutti gli account» (T294); l'elenco legge i file di tutti e resta tra chi gioca.
- **`universes/.carte-mano/`**: il nome del task; una cartella nuova del server nasce inglese (ADR-0153, ADR-0159).

## Conseguenze

- `KERNEL_VERSION` `0.4.2`: un modulo nuovo del kernel e due funzioni esportate (`classSeeds` da `forms.ts`, `soundErrors` da
  `validator.ts`); gli universi della `0.4` restano buoni.
- Il programma dei mondi ha un messaggio in più (`check` → `checked`, `worldwire.ts`; inglesi, come ogni nome nuovo sul filo, ADR-0153,
  accanto a quelli italiani del canale che T308b porterà in inglese); un mondo acceso lo saprebbe fare, ma nessuno glielo chiede.
- Test: `tests/handmade.test.ts` (forma, testi, il controllo sul motore vero con i programmi più pesanti del seme, le rotte con fork da un
  universo e da una propria carta, firma, aggiornamento, togliere); `tests/sicurezza/carte-mano.test.ts` (V-030, V-031, V-032: permessi,
  interruttore, tetti, ritmo, contratto, archivio illeggibile, XML ostile, il processo del controllo muto, morto, senza memoria, in coda,
  senza segreti); `tests/sicurezza/produzione.test.ts` e `serververo.test.ts` sul server di produzione vero, col programma dei mondi
  costruito, con l'interruttore spento e acceso.
- Restano a T294 i laboratori serviti con l'interruttore acceso, il fork e il salvataggio nelle pagine, le carte in `site/carte.html` e il
  punto d'ingresso; a T295 l'ingresso in un universo (che ricontrolla programma e contratto); a T296 la carta che si rompe nel mondo.
- Non coperto: chi ha molti account e molti indirizzi tiene occupata la coda del controllo (la macchina no: un processo alla volta); lo
  spazio su disco cresce con gli account (2 MiB l'uno), come gli universi (V-026).
