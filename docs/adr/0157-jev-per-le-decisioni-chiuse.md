# ADR-0157 — Jev per le decisioni chiuse: un varco sul server come `GeminiGate`, la regola di oggi come pavimento e come risposta dei modelli locali

Data: 2026-11-06 · Stato: **accettato** (D45, autore 10/11; il varco e lo strato da T348, 12/11) · Proposto con T313 e T323 · Riferimenti: ADR-0099 (il varco della chiave di Gemini, regola 9), ADR-0085 e ADR-0133 (i coefficienti e le manopole), ADR-0113 (chi paga si dice), ADR-0140, ADR-0147 (mestieri e imprese), ADR-0042 (lo Scultore), ADR-0153 (la lingua interna), `lab/banco/jev/README.md`

## Contesto

Il banco di T313 (`lab/banco/jev/`, `lab/scripts/jev-banco.ts`, con i conti riconciliati in T322) ha chiesto a Jev di TypeSafe (un modello che non genera: stato e domande
tipizzate → scelte, livelli, probabilità; 0,042 $ al milione di token in ingresso, uscita gratis) e a Gemini 3.1 Flash-Lite le stesse
domande su 411 casi presi dal gioco, dal banco delle strutture e dagli universi veri (206 decisioni, 113 di scultura, 92 della vita degli individui), più i prompt veri del gioco su metà delle decisioni.
La spesa del primo giro di benchmark (`giro-1`) è di **0,161 $ (0,16 $) per TypeSafe** (1568 chiamate, 3,84 M token in ingresso, perfettamente riconciliati con la dashboard di TypeSafe a 0,042 $/M) e **0,662 $ per Gemini** (598 righe); il registro intero, includendo il giro di stabilità e le prove, somma 0,196 $ per TypeSafe e 0,680 $ per Gemini.
In sintesi (le tabelle sono nel README del banco):

- **per decisione Jev costa 6-12 volte meno di Flash-Lite con le stesse domande e 25-40 volte meno dei prompt di oggi**, risponde in
  150-250 ms, dà la stessa risposta nel 99 % delle richieste ripetute;
- è **al livello di Flash-Lite o sopra** su ciò che è riconoscere e classificare: gli effetti di un'azione libera (98 %), la squadra del
  Referente (98 %), quale oggetto noto si chiede di fabbricare (100 %), il programma di un mestiere (87 % contro il 63 % di `matchJob`), il
  riuso di un modello della libreria con il companion Noul (97 %, nessun riuso sbagliato), il nodo di un programma che rovina la forma
  (69 %, sempre fra i primi tre; Flash-Lite 31 %), la quarta parete con quattro Noul e `metaBreak` davanti (94 %);
- è **sotto** dove serve sapere come si fanno le cose (le combinazioni, 65 % contro 88-91 %) e **inutile** dove serve fare i conti (il passo
  di un'impresa: la regola è esatta) o giudicare l'aspetto da viste in testo (né Jev né Flash-Lite distinguono i modelli buoni dai cattivi);
- le decisioni di oggi pesano poco nella spesa (`«Altro…» e fabbricazioni libere` 0,01 $ di 1,04 $ l'ora); la scultura il 60 %. Il
  guadagno è nelle scelte che **evitano una generazione** (riusare un modello, non fare un doppione, usare un programma che c'è) e nelle
  scelte che oggi non si fanno perché costerebbero (i bivi e le mete degli individui, ADR-0140: con Jev 30 individui per un'ora costano
  2-5 ¢ invece di 1,87 $ del `npc.decide` progettato su Flash-Lite).

## Decisione

1. **Un varco sul server, come `GeminiGate`** (`server/typesafeProxy.ts`, ADR-0099 e regola 9): `TypeSafeGate` tiene `TYPESAFE_KEY`, che
   non arriva mai al browser; i modelli da un elenco (`jev-1.13.0`, `jev-1.14.0`: versioni fisse, mai un alias che si sposta), il corpo
   limitato (la richiesta più grande del banco è 60 KB), un tetto di spesa giornaliero (`TYPESAFE_TETTO_GIORNALIERO`) con la spesa in
   `universes/.spesa-typesafe.json`, i 429 e 529 ripetuti con l'attesa, gli altri errori no. La route `/api/typesafe` solo da questa macchina
   e dalla stessa origine; in multigiocatore il mondo la chiede per il canale (ADR-0110), come Gemini, e il server di produzione non serve
   la route (ADR-0112). Il mondo di molti non vede la chiave.
2. **Uno strato di decisioni nel kernel**, accanto a `AiModels` (`src/kernel/ai/decisions.ts`): `decide(call)` con lo stato e le domande
   (Choice, Noul, Score), il compito, chi paga (`chi`, ADR-0113), e risposte che il kernel valida comunque (dentro le opzioni, probabilità
   finite). Il registro dei consumi conta le chiamate come quelle di Gemini (`world/consumi.json`), i prezzi in `prices.ts` con la data.
3. **Il pavimento è la regola di oggi**: se la risposta manca (rete, tetto, crediti, manopola a 0, universo in sola lettura) il kernel fa
   ciò che fa oggi; **la risposta dei modelli locali** (`MockAiModels`, o la sua parte per le decisioni) **è quella regola**, così i test e il
   gioco senza chiave restano identici. Niente soglia di probabilità per tornare alla regola: il banco dice che dove Jev è incerto la regola
   sbaglia di più; la soglia resta per le azioni rischiose (distruggere, togliere qualcosa a qualcuno).
4. **I compiti, nell'ordine** (ognuno una riga di `CENSUS` con la sua manopola, ADR-0133, e la sua voce nel registro):
   1. `model.reuse`: prima di scolpire, «un modello della libreria va già bene?» (Choice + companion Noul); manopola `modelli`, per classe
      (decide l'autore se anche le persone).
   2. `job.match`: un mestiere che `matchJob` non abbina → il programma più vicino o nessuno, una volta per mestiere, scritto come regola.
   3. `npc.decide` e le mete dei giorni con un fatto, a lotti per luogo e fase (manopola `vite`): con Jev Vita e Teatro costano centesimi;
      la battuta resta delle righe `dice` del programma o di una chiamata solo per chi è vicino al viandante.
   4. il filtro della quarta parete su ogni testo generato (quattro Noul, `metaBreak` davanti; ciò che non passa torna al Narratore con il
      motivo, regola 0 e 2).
   5. le scelte di `action.judge`, `referente.coordinate` e `craft.free` (quale oggetto noto): Jev decide, il racconto si scrive solo per ciò
      che riesce.
   6. i tre nodi sospetti per la seconda richiesta dello Scultore, o da togliere uno alla volta rifacendo le misure.
5. **La lingua dello stato e delle domande (T323)**: lo stato vive nella lingua dell'universo (italiano), mentre le domande, le istruzioni e gli enum delle scelte restano nella lingua interna (inglese, ADR-0153). Questa combinazione mista è la più precisa (88,5 % contro 84,5 % di tutto-inglese e 85,4 % di tutto-italiano) e risparmia il 18 % di token rispetto alle domande in italiano. **Niente si traduce a runtime**: il testo libero del viandante (`player_writes`, `request`, quarta parete) va a Jev direttamente in italiano (93,6 % di precisione contro 91,8 % in inglese). Tradurre con un LLM costerebbe $1,20-$1,55 per 1000 chiamate (28-35 volte l'intera decisione di Jev) con 2-3 secondi di latenza e peggiorerebbe l'accuratezza per il drift dei sinonimi. Per i soli termini noti che dovessero servire in inglese si usa la tabella statica (`internalNames.ts`), a costo zero.
6. **Non si portano**: `craft.judge`, `model.judge`, ciò che è numeri (fisica, passi delle imprese) e ciò che è testo.
7. **Il banco è il collaudo**: prima di cambiare versione di Jev si rifà `jev-banco.ts` sulla nuova e si confronta con il registro.

## Alternative scartate

- **Fare tutto con Flash-Lite e domande corte** (le stesse del banco): già 5 volte più economico dei prompt di oggi, ma 6-12 volte più caro
  di Jev, 5 volte più lento, e peggiore sulla quarta parete con una domanda sola (62 %) e sul nodo colpevole (31 %).
- **Jev dietro il Vercel AI Gateway**: un intermediario in più per la chiave e i dati, senza un vantaggio misurato.
- **La soglia di probabilità sotto cui decide la regola**: misurata, peggiora le decisioni.
- **Le immagini e il contesto lungo di Jev** («Danger Zone»): fuori dalla produzione per chi li offre.

## Conseguenze

- Un fornitore e una chiave in più: `TYPESAFE_KEY` nel `.env` del server, mai nel browser, in `dist/` né in un universo; un'intestazione e un
  host in uscita (`api.typesafe.ai`) solo dal server, la CSP delle pagine non cambia. Una voce nel registro delle vulnerabilità quando il
  varco si scrive (la regola 9 si estende a questa chiave).
- I dati del mondo (gli stati, mai la bibbia) vanno a TypeSafe: per la sua documentazione Jev non si allena sulle richieste; la ritenzione
  zero è solo dei contratti enterprise.
- Jev 1.13 si ritira 60 giorni dopo l'uscita della 1.14, la 1.14 30 giorni dopo la successiva: le versioni fisse si aggiornano a mano,
  con il banco.
- Il testo del viandante entra nello stato di `action.judge` e del Referente: un testo scritto per convincere il giudice (jaggedness #6
  della documentazione) va provato prima di portare quei due compiti; gli effetti restano l'insieme chiuso che il validatore controlla.
- `KERNEL_VERSION`: un compito nuovo che i modelli locali risolvono con la regola di oggi lascia buoni gli universi della stessa `X.Y`.

## Domande per l'autore (chiuse: D45, 10/11)

1. Portarlo nel gioco, e in che ordine (la proposta è quella del punto 4)? **Sì, tutte le proposte approvate**, nell'ordine di T325
   (`lab/banco/jev/casi-d-uso.md` §6-7): il varco (T348) → `model.reuse` (T349) → guardie e quarta parete (T350) → le altre scelte del
   punto 4 → l'Attore con la cache esplicita di Gemini (T351) → le battute riusate.
2. Il riuso dei modelli anche per le persone, o solo per mobili, piante, rocce, strutture? Approvato con il resto; le classi le fissa T349.
3. I dati del mondo a un fornitore nuovo vanno bene così, senza ritenzione zero? **Sì per i dati del mondo e del catalogo; il testo libero
   del viandante no** (D45.3, privacy e GDPR) finché TypeSafe non offre la ritenzione zero. Quindi `action.judge`, `referente.coordinate` e
   `craft.free` del punto 4.5, il cui stato porterebbe ciò che il viandante scrive, restano al Narratore fino ad allora; e così le guardie di
   T325 sul testo del viandante.

## Come è fatto (T348)

Il varco e lo strato, senza ancora un compito che li usi (il primo lo accende T349). Ciò che è cambiato rispetto alla proposta:

- **Il varco** è `server/typesafeProxy.ts`: `TypeSafeGate` con `forward(body)`, `direct()` per i mondi e `typesafeRoute` (dev e preview,
  mai nel server di produzione). Il corpo, al più 128 KB (`JEV_MAX_BODY`: il banco arrivava a 60 KB, il contesto di produzione di Jev è
  32k token), **si rifà campo per campo** (`jevRequest`): un modello dell'elenco `JEV_MODELS`, lo stato, al più 64 domande di tipo
  `choice`, `noul` o `score`; ogni altro campo, `assets` compresi, è un rifiuto. Il tetto è `TYPESAFE_TETTO_GIORNALIERO`, 1 $ se non detto
  (circa 24 milioni di token), obbligatorio con la chiave nel server di produzione (`productionProblems`); la spesa sta in
  `universes/.typesafe-spend.json` (`serverPath(…, 'typesafeSpend')`, un nome inglese: ADR-0159). Le ripetizioni dei 429 e 529 le fa il
  client, come per Gemini; il varco no.
- **Il canale dei mondi** porta `op: 'typesafe'` accanto a `gemini` (`worldwire.ts`, `worldHost.ts`, `worldProcess.ts`): il mondo ha un
  `fetch` che non conosce indirizzo né chiave.
- **Lo strato** è `src/kernel/ai/decisions.ts`: `DecisionCall` (agente, compito, stato, domande, `rule`, `chi`), `DecisionModels`,
  `JevDecisionModels` (il client del varco, `jev-1.13.0`), `settleDecisions` (dentro le opzioni, o la regola domanda per domanda) e
  `readJevAnswers`. **Chi chiede è il Concilio**: `Council.decide(agent, task, { state, questions, rule, chi })`, che non getta mai, applica
  come `write` chi paga (`payer`), i crediti, la manopola e la sola lettura (i modelli locali), e la regola su ogni errore. I modelli locali
  (`MockAiModels.decide`) rispondono con la regola. `Kernel.boot({ decisions })`: nel browser di chi gioca da solo se
  `/api/typesafe/status` dice che la chiave c'è, nei mondi di molti se il server ce l'ha.
- **La manopola** (regola 8b-bis): una riga di `CENSUS` per compito con `via: 'decide'` (`decisionKnob`); un compito che il censimento non
  dice decisione non arriva allo strato. La prima riga è `model.reuse` con la manopola `models`.
- **I prezzi** stanno in `DECISION_PRICES` (`prices.ts`, letti il 06/11): `priceOf` li trova, il registro dei consumi (`world/usage.json`, non
  `consumi.json`) conta ogni chiamata sotto il suo modello e compito, e in multigiocatore si addebita come le altre.
- **Sicurezza**: la voce V-034 del registro (`tests/sicurezza/typesafe.test.ts`).
- **La versione**: kernel **0.6.6**. T348 aveva portato il kernel a 0.6.5 come T353 (ADR-0181), integrato prima; T357 dà al varco e allo strato
  l'incremento successivo e fa girare la suite sui due insieme.

## Il riuso dei modelli (T349)

La prima decisione accesa, `model.reuse` (punto 4.1), nel `ModelDirector` prima dello Scultore. Le classi (domanda 2): **mobili, piante, rocce e
strutture**, cioè `furniture`, `tree`, `bush`, `rock`, `pebble`, `monument`, `building`, `structure` (`REUSE_CLASSES`); non le persone, e nemmeno animali e
bestie (gli errori del banco senza la Noul compagna erano lì: il lupo per il drago, il gatto per la pecora) né gli oggetti piccoli, che hanno già le forme comuni.
Ciò che è cambiato rispetto alla proposta:

- **Le opzioni sono della stessa classe** e di una taglia che il modello regge (o un programma che scala), non tutta la libreria come nel banco: lo stato
  scende da ~3400 a ~300 token e un modello di un'altra classe, che girerebbe nella scatola sbagliata, non si può scegliere. Sui 30 casi del banco di
  queste classi, con le risposte registrate di `jev-1.13.0` (`tests/fixtures/model-reuse.json`), il riuso è giusto in 30 su 30 e mai sbagliato.
- **Il generico della classe è un'opzione** (il primo): scegliere lui è «la *Classification using confidence*» di T325, il generico invece di scolpire.
- **Mai per una richiesta di riscolpire** (`previous`, `desiderio`): il desiderio può essere testo del viandante (D45.3), e chi chiede di riscolpire vuole
  un modello nuovo.
- **Un riuso copia il programma** sotto l'id della richiesta, come le carte portate (ADR-0170): una carta del mondo (`model.reuse` è comune), fuori da
  `ai.maxModels` e dalla pausa della manopola `models`.
- **La stima** toglie dalle sculture il 16 % (`REUSE_ASKED` 0,4 misurato su una Genesi offline × `REUSE_HIT` 0,4 di T325) quando Jev decide; la Genesi offline
  misurata (`lab/banco/jev/riuso.md`) dà lo stesso ordine: 16 % della spesa dello Scultore e dell'Artista, fino al 44 % se Jev riusasse tutto ciò che può.
- **La versione**: kernel **0.6.7** (un compito nuovo che i modelli locali risolvono con la regola lascia buoni gli universi dello stesso contratto).

