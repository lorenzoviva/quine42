# ADR-0184 — La open beta senza pagamenti all'autore: le chiavi OpenRouter dei giocatori, le comuni a turno, un pacchetto per ogni hosting

Data: 2026-11-13 · Stato: **proposto** (T345, step 43; decide l'autore) · Riferimenti: [`docs/design/open-beta.md`](../design/open-beta.md)
(lo studio, con le fonti datate), `docs/fasi.md` (Fase IV), ADR-0081 (spese comuni), ADR-0084 (eredità e quote), ADR-0099 (il varco della
chiave), ADR-0104 (saldi fuori dall'universo), ADR-0110 (mondi senza segreti), ADR-0112 (il server di produzione), ADR-0113 (chi paga si
dice), ADR-0132 (la commissione), ADR-0156 (sola lettura fuori contratto), ADR-0157 (Jev), ADR-0170 (le carte portate); T347 (la campagna del
master, ADR proposto a parte)

## Contesto

L'autore (10/11) ha spostato la produzione alla Fase VI: nella Fase IV, la open beta, nessun pagamento passa da lui (niente Stripe vero,
commissione 0). I giocatori pagano direttamente i fornitori: OpenRouter per i modelli, un hosting esterno o il proprio PC per il server.
Oggi invece la chiave dei modelli è una sola, del server (regola 9, `GeminiGate`); i crediti sono un saldo prepagato nel ledger con una
commissione (ADR-0104, ADR-0132); il server di produzione non parte senza Firebase, il segreto del webhook di Stripe e un tetto per la
chiave (`productionProblems`, ADR-0112). Le alternative e i numeri sono nello studio.

## Decisione proposta

1. **I modelli via OpenRouter, con la chiave del giocatore.** Un adattatore `OpenRouterAiModels` accanto a `GeminiAiModels`: gli stessi
   modelli Gemini con id fissi, lo schema del Concilio convertito in `response_format` JSON Schema con `require_parameters`, il ragionamento
   come `reasoning.effort`, le foto dell'Artista come `image_url` con i data URL di oggi, il costo vero dalla risposta (`usage.cost`) nel
   registro dei consumi. `prices.ts` resta per le stime.
2. **La chiave si ottiene con l'OAuth PKCE di OpenRouter e la scambia il server**: il browser porta al server il codice e il verifier, la
   chiave (creata per QUINE42, con un limite proposto dal gioco, revocabile) non passa dal browser. Incollare una chiave resta un ripiego.
3. **Dove sta**: in un mondo di molti nella memoria del processo del server, per uid verificato, mai su disco, mai al mondo (8g), mai a un
   client, mai nei log (solo l'impronta SHA-256); il mondo chiede per il canale con `chi` e il server sceglie la chiave di `chi`. Da soli sul
   proprio PC in `OPENROUTER_API_KEY` o, dopo il PKCE su `localhost`, in un file accanto agli universi; il varco `OpenRouterGate` ha le
   regole di `GeminiGate` (loopback, modelli a elenco, corpo limitato, tetto se la chiave è del server).
4. **Le spese comuni a turno**: ogni chiamata comune va sulla chiave del collegato che finora in quell'universo ne ha pagate meno; un 402 la
   passa al prossimo e mette chi l'ha avuto «senza crediti»; senza nessuno con una chiave i modelli locali (come ADR-0113). «Il master paga
   tutto» è un'opzione dell'universo (T347). Una chiave del server per le comuni solo per chi ospita e lo sceglie, con il tetto di oggi.
5. **La modalità open beta del server di produzione, detta**: `QUINE_PAGAMENTI=spenti` non monta le rotte di Stripe, porta la commissione a
   0 qualunque cosa dica `QUINE_COMMISSIONE`, nasconde le ricariche, e `productionProblems` non chiede `STRIPE_WEBHOOK_SECRET`. Il ledger
   diventa il registro di ciò che ognuno ha speso con la sua chiave; chi chiama i modelli ha una chiave valida, è sotto il suo tetto della
   lobby e la chiave non ha detto 402. `QUINE_TETTO_RICARICHE` 0. Stripe resta nel codice per la Fase VI.
6. **Jev solo con una chiave detta**: senza `TYPESAFE_KEY` le decisioni usano la regola (ADR-0157); sul server ufficiale lo accende l'autore,
   che lo paga.
7. **Un pacchetto, tre posti**: un'immagine Docker con `docker compose` (e lo stesso come pacchetto Node), con l'etichetta della versione del
   kernel, per una VM o VPS, Railway, Fly e il PC di casa dietro un Cloudflare Tunnel. **Il server ufficiale su una VM di Compute Engine**,
   non Cloud Run (git vuole un disco con i lock; i WebSocket di Cloud Run si chiudono a 60 minuti); T45f si riscrive così. Niente template
   nel marketplace di Railway con il kickback, che è un pagamento all'autore. RunPod e Vast.ai solo per modelli locali, con l'indirizzo
   dall'ambiente del server, dopo.
8. **Un verificatore a inviti** per chi ospita senza Firebase (`QUINE_ACCOUNT=inviti`, token firmati dal segreto del server), lo stesso che
   serve agli universi privati di T347.
9. **Le carte restano contate**, con il costo di ogni carta preso dalla risposta di OpenRouter; nella Fase VI conta solo la storia scritta su
   un server di cui l'autore si fida, le carte nate altrove entrano come carte portate (ADR-0170).

## Alternative considerate

- **La chiave nel browser del giocatore, che chiama OpenRouter da sé**: in un mondo di molti il client restituirebbe ciò che vuole come
  risposta del Concilio (regola 8b). Scartata per i mondi di molti.
- **Le chiavi su disco, cifrate**: servirebbero solo a chiamare per un giocatore non collegato, che oggi non succede. Un file di chiavi su un
  server pubblico è un bersaglio. Scartata per la open beta.
- **Dividere ogni chiamata comune fra le chiavi**: una chiamata va su una chiave. Il turno dà le parti uguali in media.
- **Una chiave del server pagata dall'autore**: contraddice la Fase IV; resta per chi ospita e lo sceglie.
- **Cloud Run per il server ufficiale**: vedi il punto 7 e lo studio, § 2.2.
- **Firebase obbligatorio anche per chi ospita**: possibile (gratuito fino a 50 000 utenti attivi al mese), ma è il passo che ferma una
  guida per il PC di casa.

## Conseguenze

- Regola 9 di `AGENTS.md`: le chiavi di OpenRouter dei giocatori si aggiungono a quelle che arrivano solo al loro varco; 8d resta (i soldi
  fuori dall'universo), 8g resta (il mondo non vede chiavi), 8i resta (`chi` si dice; la scelta della chiave da `chi` la fa il server).
  Applicandolo si aggiornano `AGENTS.md` (regole 8d, 9, Stack, Comandi e `.env`) e `docs/architettura-dettagli.md` (`#gemini`,
  `#carte-crediti`, `#stripe`).
- Superfici nuove, da registrare quando nascono i task: le chiavi in memoria, la rotta del PKCE, `chi` → chiave, il verificatore a inviti,
  l'endpoint dei modelli locali, il pacchetto pubblico, la fiducia verso chi ospita (studio, § 5).
- I task, in ordine (studio, § 6): la modalità open beta; l'adattatore; le chiavi sul server con il turno; il collegamento nel gioco e nel
  sito; il costo delle carte; il verificatore a inviti; il pacchetto e la guida; T45f riscritto; «Come usiamo l'IA»; poi i modelli locali.

## Domande per l'autore

1. PKCE come via principale e la chiave incollata come ripiego? *Consiglio: sì.*
2. Le spese comuni a turno come predefinito, «il master paga» come opzione (T347)? *Consiglio: sì.*
3. Il server ufficiale: una VM di Compute Engine pagata da te per la macchina, con pochi mondi accesi; e quanti? *Consiglio: la VM; il numero
   dopo la prova di carico della beta chiusa (D6.4 del piano di lancio).*
4. Un anonimo con una chiave sua paga per sé e partecipa al turno delle comuni? *Consiglio: sì.*
5. Jev spento sul server ufficiale in open beta? *Consiglio: sì, finché non decidi di pagarlo.*
6. Il pacchetto su Railway: niente template nel marketplace (il kickback è un pagamento a te), solo il `Dockerfile` del repository?
   *Consiglio: sì.*
7. Per chi ospita: verificatore a inviti oltre a Firebase? *Consiglio: sì, insieme agli universi privati di T347.*

## Applicazione del punto 8 (T366)

Il verificatore a inviti è in [ADR-0194](0194-l-universo-privato-e-il-verificatore-a-inviti.md), con gli universi privati di ADR-0188 (D52.7, D54.8):
`QUINE_ACCOUNT=inviti` e `QUINE_SEGRETO_INVITI`, identità `inv-…` firmate col segreto, 30 giorni rinnovati, revocabili nel libro delle identità;
il padrone del server con `npm run inviti`.
