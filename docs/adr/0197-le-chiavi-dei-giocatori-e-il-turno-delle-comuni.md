# ADR-0197 — Le chiavi dei giocatori sul server e il turno delle comuni: il varco di OpenRouter

Data: 2026-11-14 · Stato: **accettato** (T363, step 43; applica ADR-0184 punti 2, 3 e 4, D52.1, D52.2 e D52.4) · Riferimenti:
[`docs/design/open-beta.md`](../design/open-beta.md) § 1.2-1.4 e § 5 punti 1-3, ADR-0099 (il varco della chiave di Gemini), ADR-0157 (il varco di
TypeSafe), ADR-0193 (l'adattatore OpenRouter), ADR-0110 (i mondi senza segreti), ADR-0113 (chi paga si dice), ADR-0081 e ADR-0104 (i crediti e il
ledger), ADR-0188 (il master paga), ADR-0107 (i ritmi per viandante)

## Contesto

Nella open beta i giocatori pagano i modelli con la propria chiave di OpenRouter (ADR-0184): l'adattatore c'è (ADR-0193) ma non ha chiavi, e nessun
mondo ci passa. Le regole che non cambiano: la chiave arriva solo al suo varco, mai al browser (regola 9); un mondo di molti è un processo senza
segreti (8g); i soldi stanno fuori dall'universo (8d); `chi` dice chi ha chiesto e chi è addebitato lo risolve solo il kernel (8i, `billedTo`).
Con le chiavi una chiamata comune va su **una** chiave: non si divide come i crediti (ADR-0081). E non c'è più un saldo prepagato: il ledger
deve dire quanto ognuno ha speso con la sua.

## Decisione

1. **Un varco solo, `OpenRouterGate`** (`server/openrouterProxy.ts`), gemello di `GeminiGate`: tiene le chiavi dei giocatori **nella memoria del
   processo del server**, per id di viandante (quello dell'account, o l'id detto da questa macchina senza account), mai su disco, mai in un log, mai in
   una risposta: altrove solo l'impronta SHA-256 (`keyFingerprint`). Tiene anche la chiave di chi ospita (`OPENROUTER_API_KEY`), con il suo tetto al
   giorno (`OPENROUTER_TETTO_GIORNALIERO`, 10 $ se non detto, scritto per il server di produzione; la spesa in `universes/.openrouter-spend.json`).
2. **La chiave del giocatore arriva con il PKCE di OpenRouter, scambiato dal server**: `POST /api/openrouter/begin` dà uno `state` (16 byte, dieci
   minuti, al più quattro per viandante); `POST /api/openrouter/key` con `{ code, verifier, state }` lo consuma (solo di quel viandante, una volta, e solo
   da una richiesta che potrebbe essere del flusso) e fa lo scambio `POST /api/v1/auth/keys` da qui: il browser porta codice e verifier e riceve
   l'impronta. Il ripiego: `{ key }` incollata (D52.1). `DELETE` la dimentica; `GET /api/openrouter/status` dice se chi chiede può pagare (`available`),
   se ha collegato una chiave (`linked`, `fingerprint`, `exhausted`) e se il server ne ha una (`server`). Tutte le porte passano da `callerOf` (`gate`,
   il token; il mondo e chi non ha un id non collegano niente) con un ritmo per viandante (`KEY_PACE`); le porte dei modelli (`/v1/chat/completions`,
   `/alpha/decisions`) solo da loopback e dalla stessa origine, mai in produzione: chi gioca qui paga con la propria chiave se l'ha collegata, altrimenti
   con quella del server, mai con quella di un altro, qualunque cosa nomini la pagina. Un anonimo con la sua chiave paga per sé (D52.4).
3. **I corpi si rifanno campo per campo** (`chatRequest`, `decisionRequest`): un modello dell'elenco di ADR-0193 (`google/…`, `typesafe/jev-…`), i
   campi di una chiamata e basta (niente `models` di ripiego, `route`, `plugins`, `transforms`, un altro `provider`), il `provider` del varco
   (`require_parameters`, `data_collection: deny`; `zdr: true` per Jev), i tetti di Gemini (2 MiB) e di Jev (128 KiB, 64 domande).
4. **Il canale dei mondi** (`op: 'openrouter'`): il mondo chiede per il canale con `payers`, gli id di chi può pagare **in ordine**, che l'adattatore
   scrive nell'intestazione `x-quine-payers` e il kernel decide (`keyPayersFor`): per una richiesta di un viandante lui (dove paga il master, il master);
   per una comune la chiave di chi ospita se c'è (nessun id), altrimenti **il turno**: i collegati con una chiave valida, prima chi finora ha pagato meno
   delle comuni in questo universo, a pari merito per id. Il varco prova le chiavi in quell'ordine e dice chi ha pagato (`x-quine-paid-by`,
   `CallRecord.paidBy`); un **402** mette quella chiave fuori dal turno (`exhausted`) e passa alla seguente, un **401** la dimentica; senza nessuno che
   possa pagare, 402 (un `BudgetError` nel mondo). Il mondo sa solo **chi** ha una chiave (`WorldOpen.keys`, `setKeys` a ogni cambiamento, ids per
   valore) e come si paga (`WorldOpen.openrouter`: `players`, `server`); un mondo va su OpenRouter quando chi ospita ha dato una chiave di OpenRouter, o
   non ha una chiave di Google e i giocatori possono portare le loro (`worldsPayWith`): un server che vuole che paghino i giocatori non ha una chiave di
   Google. Su OpenRouter anche Jev passa di lì (`OpenRouterDecisionModels`, D52), `TYPESAFE_KEY` resta per i mondi su Gemini.
5. **Il kernel** (`keyPolicy`, `payWithKeys`): con le chiavi dei giocatori `hasCredits` è «ha una chiave che non ha detto 402, sotto il suo tetto della
   lobby» (`canPay`), anche per un anonimo; le comuni vogliono qualcuno che possa pagare (o la chiave di chi ospita); dove paga il master la sua chiave
   paga per tutti. Chi perde la chiave (402, 401) lo sente come i crediti finiti (`credits:exhausted`) e passa ai modelli locali. Il tetto della lobby
   non si limita al saldo (`sessionCapFor`), perché nulla è prepagato. `charge` scrive nel ledger la **spesa** di chi ha pagato (`Ledger.spend`,
   `spent[id] = { usd, common }`, in `universes/.balances/<nome>.json`; un file di prima ne ha nessuna), mai un addebito su un saldo; `chi` non cambia
   (8i): il registro dei consumi e le mancanze dicono chi ha chiesto; le carte delle comuni restano del mondo (`payer: comune`, il titolare col seme:
   il pagante di una carta nata da più chiamate su più chiavi non è uno solo).
6. **Senza chiavi dei giocatori niente cambia**: i crediti del ledger, le comuni divise, Gemini con la chiave del server, come prima. La chiave di chi
   ospita da sola (`server` senza `players`) è un'altra chiave del server: paga tutto entro il suo tetto, i crediti come oggi.

## Alternative considerate

- **Il turno deciso dal varco**: non sa chi è collegato né quanto ha pagato ognuno in quell'universo; il kernel sì (il ledger è dell'universo). Il
  varco applica l'ordine e sa di 402 e 401: ognuno fa la sua parte.
- **Il pagante del turno dentro `billedTo`**: avrebbe fatto del turno il titolare delle carte comuni (come dove paga il master, D54.1); ma una carta
  comune nasce da più chiamate, su chiavi diverse, e il titolare col seme è stabile. Scartata: il turno è solo di `keyPayersFor` e `charge`.
- **Una variabile per scegliere OpenRouter o Gemini**: una configurazione in più da ricordare; la regola «OpenRouter se c'è la sua chiave o non c'è
  quella di Google» dice la stessa cosa con ciò che c'è già. Da rivedere se un server vorrà entrambe.
- **Le chiavi su disco, cifrate**: ADR-0184 le ha scartate; qui un riavvio costa un clic. Da soli sul PC il file accanto agli universi è di T364.
- **Riprovare una comune rifiutata con 402 dal kernel**: il varco passa già al prossimo del turno nella stessa richiesta, senza un'altra andata.

## Conseguenze

- `server/openrouterProxy.ts` (il varco, le rotte, `worldsPayWith`), `src/kernel/ai/openrouter.ts` (`keyPayers`, le intestazioni, `paidBy`),
  `src/kernel/kernel.ts` (`setKeyPolicy`, `setKeys`, `keyPayersFor`, `hasCredits`, `charge`, `sessionCapFor`), `src/kernel/credits.ts` (`spent`,
  `Ledger.spend`, `spentOf`, `KeyHolders`, `KeyPolicy`), il canale (`WorldOpen.openrouter`, `keys`, `op: 'openrouter'`, `setKeys`), `server/session.ts`
  (`tellKeys`), `server/production.ts` (la rotta delle chiavi, il tetto in `productionProblems`), `vite.config.ts`. Kernel 0.7.8: nessun formato
  dell'universo cambia; il file del ledger ha un campo in più, facoltativo.
- Sicurezza: V-040 nel registro (le chiavi in memoria, la rotta del PKCE, la scelta della chiave da `chi`; lo studio § 5 punti 1-3), con
  `tests/sicurezza/openrouter.test.ts`.
- Cosa manca: il collegamento nel gioco e nel sito («Collega OpenRouter», il limite residuo da `/api/v1/key`, il tetto proposto, da soli sul PC il file
  accanto agli universi: T364); la cache esplicita dell'Attore via OpenRouter (ADR-0193); il portafoglio che mostri la spesa con la chiave (`spent`).
