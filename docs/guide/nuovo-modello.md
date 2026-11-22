# Guida: come si integra un modello nuovo

Il canovaccio per chi scrive il dossier o esegue un task che aggiunge un modello (T466). L'esperienza era sparsa in molti task e ADR:
qui c'è l'ordine dei passi, i file, i test, cosa misurare e con quali tetti di spesa, e le regole di `AGENTS.md` che il lavoro tocca.
Non sostituisce gli ADR: quando una riga qui e un ADR non dicono la stessa cosa, vale l'ADR, e la guida si corregge.

Due parti, perché un modello entra in due posti che non si toccano:

- **A. Nel gioco**: un agente del Concilio che chiama il modello (via Google, via OpenRouter o dalla coda degli abbonamenti), oppure una
  decisione chiusa (Jev). Codice in `src/kernel/ai/`, `server/`, `src/ui/`; il kernel sale di versione; la sicurezza c'entra sempre.
- **B. Nel layer di sviluppo**: la pipeline, l'orchestratore, il generatore, la coda, gli agenti che eseguono i task, i banchi offline.
  Codice in `tools/pipeline/` e documenti in `docs/pipeline/`; nessun file del gioco cambia.

Un modello può entrare in una sola parte (Gemini 4 Neon, T465: solo B, con una proposta per A), o in tutte e due con due task separati.
Alla fine c'è un [modello di blocco del backlog](#c-modello-di-blocco-del-backlog) da copiare.

Esempi svolti: **T465** (Neon nella pipeline, ADR-0237: verifica su `agy`, contatore misurato, prova di qualità contro Opus, la proposta
per il Concilio) e **T360** (Hydrogen e l'Orchestrator, ADR-0187: i livelli di sforzo come dato); per il gioco **T397** (Opus 5.5 Scultore
su OpenRouter, ADR-0205), **T398/T402** (Fable 5.1 e il livello dello Scultore, ADR-0207), **T348** (Jev, ADR-0157), **T362-T364**
(OpenRouter, ADR-0193, ADR-0197, ADR-0200), ADR-0216 (modello e sforzo sulla coda).

Da tenere aperti: [`architettura-dettagli.md#gemini`](../architettura-dettagli.md#gemini) (il sottosistema nel gioco),
[`pipeline/modelli.md`](../pipeline/modelli.md) (la scheda dei modelli della pipeline e le misure), [`pipeline/README.md`](../pipeline/README.md)
(i campi di `config.json`), [`sicurezza/registro.md`](../sicurezza/registro.md) (le voci dei varchi), gli ADR citati in
[`adr/README.md`](../adr/README.md): [ADR-0187](../adr/0187-hydrogen-e-orchestrator-nella-pipeline.md),
[ADR-0237](../adr/0237-gemini-4-neon-nella-pipeline.md), [ADR-0205](../adr/0205-opus-scultore-delle-strutture-su-openrouter.md),
[ADR-0207](../adr/0207-lo-scultore-delle-strutture-scelto-dal-master.md), [ADR-0157](../adr/0157-jev-per-le-decisioni-chiuse.md),
[ADR-0193](../adr/0193-l-adattatore-openrouter.md), [ADR-0216](../adr/0216-la-rigenerazione-dei-modelli.md).

---

## Prima di cominciare (per tutte e due le parti)

1. **L'annuncio, letto e riassunto con la data**: id esatti, livelli di ragionamento, contesto, prezzi a listino (ingresso, cache, uscita,
   conservazione della cache esplicita), dove è disponibile (API, OpenRouter, Antigravity, CLI di Claude, quali piani). Scrivi anche **ciò
   che l'annuncio non dice** (quote e contatori, latenza, uscita massima, schema JSON, immagini): sono le cose da misurare. «Meglio di X» non
   è un fatto finché una prova nostra non lo dice (T465, `modelli.md` 1.4).
2. **Una domanda: dove serve?** Un modello nuovo non entra «perché c'è». Scrivi il ruolo che deve prendere (quale agente o quale tipo di
   task) e contro chi si confronta (il modello che oggi fa quel lavoro), con i prezzi accanto.
3. **Quanto si può spendere**: ogni prova che costa ha un tetto scritto nel task prima di partire (in dollari per le API, in punti di
   contatore per gli abbonamenti). Le prove con Gemini costano: una Genesi più qualche chunk sono circa 80 chiamate di testo e 20 immagini
   (`CLAUDE.md`). Prima tutto ciò che è offline e gratis (`countTokens`, banchi `--offline`, modelli finti), poi il giro pagato.
4. **Le chiavi**: `GEMINI_API_KEY`, `TYPESAFE_KEY`, `OPENROUTER_API_KEY` si leggono dai `.env` dagli script e dai varchi del server, mai
   stampate né scritte in un log, in un rapporto o in `dist/` (regola 9).

---

## A. Nel gioco

### A.0 Che cosa si sta aggiungendo

| Caso | Esempio | Dove sta il grosso |
|---|---|---|
| Un modello di Google per un agente esistente | Gemini 4 Hydrogen nel banco dello Scultore (T391) | `prices.ts`, l'elenco della lobby, la stima |
| Un modello su OpenRouter (anche non di Google) | Opus 5.5 e Fable 5.1 Scultori delle strutture (T397, T398) | `OPENROUTER_MODELS`, il varco, `sculptorsOn` |
| Un modello per le decisioni chiuse | Jev 1.14 (T348) | `JEV_MODELS`, `DECISION_PRICES`, `TypeSafeGate` |
| Un modello sulla coda degli abbonamenti | Opus 5.5 nella rigenerazione dei modelli (ADR-0216) | `ANTHROPIC_PRICES`, `CLI_MODELS`, la coda |
| Un compito nuovo o un agente nuovo | l'Attore (ADR-0116), lo Scenografo (ADR-0214) | schema, `MockAiModels`, `CENSUS`, manopola |

Un compito nuovo è un task suo, anche se nasce col modello: questa guida lo tocca solo nei passi A.4 e A.5.

### A.1 Il prezzo, con la data

- [ ] `src/kernel/ai/prices.ts` è **l'unico listino del progetto**. Una voce in `PRICES` (Google e i modelli chiamati su OpenRouter) con
  `input`, `output`, `cached`; `storage` solo se il modello ha il prezzo della conservazione della cache esplicita; `until` e `next` se il
  prezzo cambia a una data (Argon e Carbon all'1/12); `note` se il prezzo non viene dalla pagina di Google.
- [ ] Una costante `<MODELLO>_READ_ON` con il giorno in cui il prezzo è stato letto, e il commento con la pagina. Un prezzo stimato (non
  pubblicato) va in `ESTIMATED`, sempre per eccesso.
- [ ] Jev e gli altri modelli che scelgono: `DECISION_PRICES` (e l'id di OpenRouter accanto, `typesafe/jev-…`). Un modello di Claude sulla
  coda: `ANTHROPIC_PRICES` (con `write`, il prezzo della scrittura in cache): da lì nasce `CLI_MODELS`.
- [ ] `priceOf` legge anche l'id di OpenRouter (`google/<id>`, `anthropic/claude-<nome>-X.Y` col punto): controlla che il tuo id ci passi;
  se no, il registro conta il modello col più caro di Google (`billedModel`, `DEAREST_MODEL`) e l'addebito sbaglia.
- Test: `tests/coefficients.test.ts`, `tests/openrouter.test.ts`, `tests/opus-openrouter.test.ts`, `tests/decisions.test.ts` per i casi
  vicini; aggiungi l'id nuovo dove un test enumera i prezzi.

### A.2 Gli elenchi a id fissi dei varchi (regola 9)

Nessun varco prende un modello che non conosce: l'elenco è la difesa, non un dettaglio.

- [ ] **Via Google** (`server/geminiProxy.ts`, `GeminiGate.allows`): ammette gli id `gemini-…` di `PRICES` ed `ESTIMATED` (e quelli che un
  `universe.json` nomina). Un modello di Google entra col prezzo; un modello che non è `gemini-…` **non passa mai di lì**, e
  `sculptorsOn` lo riporta al predefinito sulla via di Google (`onGoogle`).
- [ ] **Via OpenRouter** (`src/kernel/ai/openrouter.ts`, `OPENROUTER_MODELS`): una voce `nostro id → { id, snapshot, temperature,
  cacheSystem?, maxTokens? }`. `snapshot` è la versione datata letta da `https://openrouter.ai/api/v1/models/<id>/endpoints`
  (`canonical_slug`), con la sua costante `…_READ_ON`; `temperature` solo se **ogni** endpoint standard la prende (con
  `require_parameters` un parametro che uno non prende lascia la richiesta senza endpoint); `cacheSystem` per i modelli di Anthropic, che
  non hanno cache implicita; `maxTokens` per i modelli cari: il varco lo **riscrive** (`CHAT_MAX_TOKENS` in `server/openrouterProxy.ts`,
  ADR-0207), così il tetto al giorno della chiave regge anche il modello più caro. `CHAT_MODELS` del varco nasce da qui: niente da copiare,
  ma controlla che nessun altro id dello stesso fornitore entri per sbaglio.
- [ ] **Jev**: `JEV_MODELS` in `src/kernel/ai/decisions.ts` (versioni fisse), `OPENROUTER_JEV` per la via di OpenRouter; `TypeSafeGate`
  (`server/typesafeProxy.ts`, `jevRequest`) prende solo quelle.
- [ ] **Coda degli abbonamenti**: `CLI_MODELS` (le chiavi di `ANTHROPIC_PRICES`) e `CLI_EFFORTS` in `src/kernel/ai/subscription.ts`;
  `checkRequest` (`server/subscriptionQueue.ts`) rifiuta il resto all'ingresso e `serveOne` rilegge la richiesta prima di passare `--model`
  e `--effort` alla CLI (ADR-0216). Una versione nuova della CLI può cambiare `init`: la conferma dell'isolamento (`IsolationCheck` in
  `tools/abbonamenti/servi.ts`, ADR-0106) ferma la coda invece di fidarsi, ed è giusto così. Antigravity non va sulla coda (ADR-0106 punto 6).
- Test di sicurezza: `tests/sicurezza/gemini.test.ts` (V-002), `openrouter.test.ts` (V-040), `typesafe.test.ts` (V-034),
  `testo-viandante.test.ts` (V-044); un id fuori elenco rifiutato con 403 è il caso da aggiungere per il modello nuovo.

### A.3 Dove il gioco lo sceglie

- [ ] **La lobby e la Genesi** offrono per ogni classe i modelli di `pricedAiModels()` (`src/kernel/coefficients.ts`), e
  `repairAiSettings` (`src/kernel/universe.ts`) prende dal filo solo quelli. Un modello che il master non deve poter scegliere per una classe
  non va lì (Opus e Fable entrano solo come livello dello Scultore, `ai.sculptorTier`, ADR-0207).
- [ ] **I predefiniti**: `DEFAULT_SCULPTORS`, `openRouterStructure`, `TIER_MODELS` e `sculptorsOn` in `src/kernel/agents/sculptor.ts`;
  `ACTOR_MODEL` e `LOW_DETAIL` in `coefficients.ts`; `universe/universe.json → ai` (il seme). Un cambio di predefinito è una decisione:
  ADR, e il costo dell'ora prima e dopo nell'esito.
- [ ] **La via del mondo** (`Kernel.aiRoute()`, `google` o `openrouter`): un modello che c'è su una via sola si scrive per quella via e
  ritorna al predefinito sull'altra; la pagina lo dice (`src/ui/sculptortier.ts`, `MODEL_NAMES`).
- [ ] **Regola 8b-bis**: i modelli stanno in `ai` e si fissano quando entra il primo viandante; nessun pulsante nuovo cambia un modello a
  partita in corso, nemmeno per il master. Il livello dello Scultore e le altre scelte entrano da `join`/`applySettings`.
- [ ] **Regola 8i**: chi paga non cambia col modello: `chi` su ogni chiamata, `billedTo` decide. Un modello che costa dieci volte va detto
  nella lobby col suo costo e chi lo paga (`sculptorTiers`, `structureCost`).

### A.4 Schemi, risposte offline, censimento (solo per un compito o un agente nuovo)

- [ ] Lo schema del compito (Gemini, e lo stesso diventa schema JSON per OpenRouter con `toJsonSchema`). Controlla che il modello nuovo
  prenda lo schema sulla via che userai: l'annuncio spesso non lo dice (Neon, T465).
- [ ] La risposta in `MockAiModels` (`src/kernel/ai/mock.ts`): senza chiave, con `?offline` e nei test il gioco funziona uguale. Per una
  decisione chiusa la risposta offline è la regola (`MockAiModels.decide`).
- [ ] Una riga di `CENSUS` (`coefficients.ts`) con la sua manopola (`coefficiente`); una decisione chiusa con `via: 'decide'` e la regola
  di oggi in `rule`, il pavimento (ADR-0157); `freeText: true` se lo stato porta parole del viandante: allora **solo** via OpenRouter con
  la ritenzione zero (`keepsNothing`, ADR-0204), mai a TypeSafe direttamente.
- [ ] La voce nel registro degli agenti (`docs/architettura-dettagli.md#concilio`) e, se è un concetto nuovo, in `docs/glossario.md`.

### A.5 La stima della lobby, i coefficienti, la cache

- [ ] `hourlyEstimate` (`coefficients.ts`) conta ogni compito col suo modello: i token per chiamata sono quelli misurati (`CALL_TOKENS`,
  `TOKENS_MEASURED`, si rimisurano gratis con `lab/scripts/jev-casi-d-uso.ts -- --contesto --conta`); le strutture con `STRUCTURE_SCULPT`.
- [ ] **La cache implicita**: la parte del prefisso che Google serve da sé, per modello, in `IMPLICIT_CACHE` (ADR-0248); un modello non misurato
  prende 0,6 (`IMPLICIT_CACHE_SHARE`): dopo la prima sessione vera la si misura col suo registro (`lab/scripts/cache-registro.ts -- universes/<nome>`)
  e la si scrive, altrimenti la stima conta un risparmio che non c'è. **La cache esplicita** (ADR-0186): solo un modello con `storage` in `PRICES` (`cacheable`), solo per gli agenti di
  `CACHED_AGENTS` (`src/kernel/agents/council.ts`); `GeminiGate.writeCache` la scrive e la conta nel tetto del giorno.
- [ ] Nell'esito: l'ora di gioco prima e dopo (dettaglio pieno e Low Detail, oggi e dopo il prossimo cambio di prezzo).
- Test: `tests/coefficients.test.ts`, `tests/scultore-livello.test.ts`, `tests/attore.test.ts` per gli schemi simili.

### A.6 Il banco pagato, con un tetto

Prima gratis, poi pagato, sempre con un tetto scritto e il registro delle chiamate accanto al rapporto.

| Banco | Per cosa | Gratis | Pagato, col tetto |
|---|---|---|---|
| `lab/scripts/prompt-tokens.ts` | quanto pesa ogni prompt (`countTokens`) | sempre | — |
| `lab/scripts/scultore-gemini.ts` | lo Scultore su un modello nuovo, a ogni taglia (T355, T391) | `--offline`, `--misura`, `--concetti` | `--modelli <id> [--via openrouter] --tetto <$>` |
| `lab/scripts/openrouter-prova.ts` | l'adattatore OpenRouter, una decina di chiamate (T362) | `--offline` | `--tetto 0.05` |
| `lab/scripts/jev-banco.ts` | Jev contro Flash-Lite sulle stesse domande (T313) | `--offline` | `--tetto-typesafe`, `--tetto-gemini` |
| `lab/scripts/jev-casi-d-uso.ts` | i casi d'uso delle decisioni (T325) | `--offline`, `--contesto --conta` | i tetti sul registro |

- [ ] Il tetto del giro nel task (in dollari), e il rapporto in `lab/banco/<area>/` con ogni chiamata e il suo costo detto (`CallRecord.usd`
  su OpenRouter) accanto al listino.
- [ ] Cosa misurare: riuscite su tentate, dollari **per riuscita** (non per chiamata), latenza contro `ai.timeout` (120 s), errori di schema,
  il confronto col modello di oggi sulle stesse richieste. Un giro dello Scultore delle strutture costa 3-5 $ (T391, la proposta di T465).
- [ ] Mai una Genesi intera per provare un modello: un profilo del browser persistente e i test offline per il resto (`CLAUDE.md`).

### A.7 Kernel, sicurezza, documenti

- [ ] **La versione del kernel** (ADR-0136): un file di `src/kernel/` cambiato fa salire `Z` in `src/kernel/version.ts` e `package.json`;
  un modello nuovo non cambia il contratto.
- [ ] **La sicurezza** (ADR-0098): il task tocca `server/` e i varchi, quindi l'esito dice «sicurezza: nessuna superficie nuova» oppure la
  voce `V-NNN` aggiunta in `docs/sicurezza/registro.md` con il suo test in `tests/sicurezza/`. Una rotta nuova passa da `gate` (8b) e da
  `productionProblems` (8h); un mondo di molti chiama per il canale e non vede mai la chiave (8g).
- [ ] `docs/architettura-dettagli.md#gemini` (la sezione del sottosistema), ADR nuovo se cambia un predefinito o una regola, `AGENTS.md`
  solo se cambia l'indice o una regola inviolabile.
- [ ] `npm test` e `npm run typecheck` coi turni; la verifica nel browser se la lobby o la Genesi cambiano ciò che si vede.

### A.8 Le regole inviolabili coinvolte

| Regola | Perché c'entra |
|---|---|
| 2 (validatore) | ciò che il modello nuovo scrive passa dal validatore come prima: nessuna scorciatoia perché «è più bravo» |
| 3 e 7 (il pavimento) | un modello che sbaglia o tace fa rispondere i modelli locali o la regola, mai un'eccezione |
| 8b-bis | i modelli si fissano entrando; nessuno li cambia a partita in corso |
| 8e | ciò che chiama i modelli ha il ritmo stretto (`heavy`), anche col modello nuovo |
| 8f | un campo nuovo di `ai` esce a un client solo se nominato in `src/session/files.ts` |
| 8i | chi paga si dice (`chi`), `billedTo` lo risolve |
| 9 | le chiavi solo nei varchi; elenchi a id fissi; il testo del viandante a Jev solo con la ritenzione zero |
| 0 | i principi della quarta parete vanno con ogni richiesta anche al modello nuovo |

---

## B. Nel layer di sviluppo

### B.1 Annuncio e verifica sulla CLI (senza spendere quota, poi con le micro-prove)

- [ ] L'elenco: `agy models` su Antigravity; sulla CLI di Claude `claude --help` (`--model <id|alias>`) e il modello che l'evento
  `system`/`init` dice in una corsa breve (`modelli.md` 1.1). Scrivi la versione della CLI (T465: `agy` 1.5.14). Su `agy` in Git Bash
  serve `MSYS_NO_PATHCONV=1`, o `/usage` diventa un percorso di Windows.
- [ ] I livelli di sforzo: su `agy` `agy --model <base> --effort max -p /model` li dice senza spendere (ADR-0187); su `claude` lo sforzo è
  `--effort low|medium|high|xhigh|max`. Un livello scritto che il modello non ha fa fallire il lancio.
- [ ] I contatori: `agy -p /usage` (o `/usage` della CLI di Claude) **prima e 20 s dopo** una micro-prova in sola lettura, con nessun altro
  task su quella CLI e, se si può, i contatori appena rinnovati: lo stesso compito di T268, T360 e T465 (leggere `src/kernel/paths.ts` e
  `tests/sicurezza/percorsi.test.ts`, lanciare quel test, riassumere in cinque righe). Una corsa per livello che userai; la tabella in
  `docs/pipeline/modelli.md` con durata, token e i contatori prima e dopo. **Il contatore si misura, non si deduce dal nome.**
- Tetto: le micro-prove costano qualche punto di 5 ore; non si fanno con un task dello stesso conto in corso.

### B.2 Il provider in `tools/pipeline/config.json`

- [ ] Una voce in `providers` (copia quella più vicina: `neon` per `agy`, `sonnet` per la CLI di Claude): `modello` (il nome per le
  persone), `cmd`, `args` con `--model <id>` (su `agy` l'id col suffisso predefinito, `-high`), `resume` (`--resume {sessione}` su
  `claude`, `--conversation {sessione}` su `agy`), `sessioneNuova` su `claude`, `resetSettimanale`, `browser` (solo `claude` ha Chrome),
  `orchestrabile: false`, `abbonamento`.
- [ ] **I contatori e il conto**: `contatori` è l'espressione regolare sui nomi di `/usage` che decidono per lui (misurati in B.1);
  `stessoContoDi` dice con chi condivide la quota (`fitsOn` e `windowAdmits` tolgono dal residuo le stime dei task in corso di tutto il conto,
  `accountOf`); `ratioSessioneSettimana` è del contatore: provvisorio (copiato dal vicino sullo stesso contatore) finché `consumi.jsonl` non
  ha righe sue, e l'esito lo dice.
- [ ] **I livelli**: su `agy`, `livelli` con i livelli che la CLI ha detto (senza, `low, medium, high`); un id senza suffisso (l'Orchestrator)
  non ne ha. `launchArgs` sceglie il più alto che non supera lo sforzo del task (`agyLevel`, `extra` vale `xhigh`) e su `agy` **mai**
  `--effort`; su `claude` lo sforzo è `--effort` (`extra` → `xhigh`). Un modello su una CLI nuova (né `claude` né `agy`) è codice nuovo in
  `launchArgs`, `parseUsage` e `readOutput` (`tools/pipeline/pipeline.mjs`): un task a parte.
- [ ] **I tetti dell'autore** (ADR-0087): `limiti.modello.<provider>` a 1; `limiti.provider.<cmd>` non sale (oggi `claude` 3, `agy` 1).
- [ ] **I piani** (ADR-0119): il provider nei `disponibili` dei piani che lo danno (`piani.google.pro`, `piani.google.ultra`,
  `piani.claude.max5x`…); un piano che non lo dà lo spegne (`providerEnabled`, `ceilingOf` 0). Gemini 4 Carbon solo su Ultra (ADR-0187).
- [ ] **L'orchestratore** (ADR-0078, ADR-0089): `orchestra.ordine` (dove mettersi: prima di chi risparmia, T465 prima di Argon) e
  `orchestra.finestra.<provider>` (la finestra di contesto pubblicata, o 200 000 se non si sa). Non orchestrabile, il provider si salta;
  lo spunta solo l'autore nella pagina web. Fable resta fuori da `ordine` (ADR-0115, ADR-0146).
- [ ] **Il generatore** (ADR-0177) e la coda (`generatore.provider`, `coda`): un modello nuovo non ci va da solo; la coda della CLI degli
  abbonamenti usa i modelli di `CLI_MODELS` (parte A.2), non quelli di `config.json`.
- [ ] **La copia fissa dei test**: `tests/fixtures/pipeline-config.json` (T424) è la configurazione su cui girano i test, così le scelte
  dell'autore in `config.json` non li rompono: il provider nuovo va **anche lì**, con gli stessi campi.
- [ ] Il processo dell'orchestratore legge `config.json` (tranne piani e `orchestrabile`) solo all'avvio: il provider c'è dal riavvio, e
  l'esito lo dice.

### B.3 I test (`tests/pipeline.test.ts`)

Un blocco `describe` per il modello, come quello di T465 (`Gemini 4 Neon nella pipeline`), su fixture e su `config.json` vero:

- [ ] il provider: `cmd`, `modello`, `browser`, `abbonamento`, `stessoContoDi`, `livelli`; nei piani giusti; `limiti.modello` 1 e
  `limiti.provider` invariato; `canOrchestrate` falso; `ceilingOf` 0 senza l'abbonamento;
- [ ] il contatore: un `/usage` vero copiato nel test (con la data) passa da `parseUsage` e `computeBudget`; il conto è quello giusto e non
  quello di un altro (`accountOf`); su `agy` un task alla volta di qualunque modello (`fitsOn`);
- [ ] lo sforzo: ogni livello e `extra|xhigh|max` danno l'id giusto, anche riprendendo una conversazione; mai `--effort` su `agy`;
- [ ] l'ordine e la finestra dell'orchestratore; la pagina web lo offre col suo nome (`renderHtml`).

### B.4 La scheda e le regole di assegnazione

- [ ] `docs/pipeline/modelli.md`: l'annuncio e le micro-prove (una sezione 1.x col giorno), la prova di qualità, la riga nella tabella dei
  tipi di task (2), dove provarlo (4.2), lo sforzo (4.4), cosa è entrato in `config.json` (4.5).
- [ ] `docs/pipeline/pianifica.md` e `docs/pipeline/orchestra.md`: quando sceglierlo e quando no, rispetto ai vicini. Opus 5.5 (`claude`)
  resta il predefinito; architettura, kernel, sicurezza e MarkovJunior non vanno su un provider in prova.
- [ ] `docs/pipeline/README.md` (l'elenco dei provider), un ADR (la forma di ADR-0187 e ADR-0237: contesto con ciò che è verificato,
  decisione, conseguenze con ciò che non è misurato), la riga dei modelli della pipeline in `AGENTS.md`.
- [ ] Su file grandi le sostituzioni si fanno con Edit, a funzione o con `split`/`join`: la sequenza `` $` `` in un testo passato a
  `String.replace` ha copiato mezzo `README.md` dentro una riga (T360, trovato da T465).

### B.5 La prova di qualità su un task già fatto

La sola misura che dice se il modello vale (T465, `modelli.md` 1.5):

- [ ] Scegli un **task chiuso** fatto da Opus 5.5, di programmazione su più file, senza browser, con test offline (T465 ha usato T423).
- [ ] Rifallo col modello nuovo **dallo stesso commit di partenza**, lo stesso blocco del backlog e il prompt della pipeline, in un
  worktree usa e getta **fuori dal repository**; non si integra mai.
- [ ] Misura e scrivi accanto al commit vero: l'esito; test e typecheck (il modello passa i suoi test? passa **quelli di Opus**? Opus passa
  i suoi?); il tempo; i punti di contatore spesi (5 ore e settimana) contro quelli di Opus; il costo a listino API; il diff (file, righe,
  quanto ha allargato il compito).
- [ ] La patch in `docs/pipeline/prove/<Txx>-<modello>-<task>.patch`, il verdetto in una riga onesta («pari sul risultato, peggiore sulla
  misura del diff»), su una prova sola.
- Tetto: un task di stima ~3 % sul conto del modello nuovo; niente prova durante un task vero dello stesso conto.

### B.6 Il periodo «in prova» e quando uscirne

- **In prova** vuol dire: `limiti.modello` 1, non orchestrabile, `ratioSessioneSettimana` provvisorio, nessun task di kernel, sicurezza,
  architettura o MarkovJunior, e nelle regole di assegnazione detto come tale (ADR-0146, ADR-0187, ADR-0237).
- **Si esce** con una decisione dell'autore (una `D…` nel backlog o una domanda in `docs/pipeline/domande/`), quando `consumi.jsonl` ha
  abbastanza righe del provider (con `prima`, `dopo`, `sforzo`) da correggere `ratioSessioneSettimana` e le stime, e i task fatti sono
  stati integrati senza rifacimenti. Allora: il tetto può salire entro `limiti.provider`, `orchestrabile` lo decide l'autore, `modelli.md`
  4.5 e l'ADR si aggiornano.
- **Si toglie** (dai `disponibili`, non dalla voce) se i task tornano rifatti, se il contatore non è leggibile o se il piano non lo dà più.

---

## C. Modello di blocco del backlog

Da copiare e riempire; le righe tra parentesi angolari si sostituiscono, quelle che non servono si tolgono (un task di sola parte B non ha
le righe del gioco).

```markdown
### Txxx · <Modello> <nel gioco come <agente> | nella pipeline (<cli>)>: verifica, <prezzo|contatori>, <banco|provider> in prova — `da fare`
- Pipeline: claude · sforzo high · stima 3% · priorità <n>
- Contesto: richiesta dell'autore del <gg/mm>: <cosa è uscito>. Annuncio (<url>, <data>): id `<id>`, livelli <…>, contesto <…>,
  prezzi <in/cache/out $/M>, disponibile su <API|OpenRouter|Antigravity|CLI> per <piani>; non dice: <quote, latenza, schema JSON,
  immagini, confronto con <modello di oggi>>. Nasce da <Txx> (`dossier Txx`); la guida è `docs/guide/nuovo-modello.md`.
- Cosa fare:
  (A, nel gioco) il prezzo in `prices.ts` con la data; <`OPENROUTER_MODELS` | `JEV_MODELS` | `CLI_MODELS`> e il varco
  <`GeminiGate` | `OpenRouterGate` | `TypeSafeGate` | la coda>; <dove si sceglie: `pricedAiModels` | `sculptorsOn` | `ai.sculptorTier`>;
  la stima della lobby (`hourlyEstimate`, `IMPLICIT_CACHE`, cache esplicita sì/no); il banco <script> prima `--offline`, poi pagato
  con `--tetto <$>`; kernel `Z` +1.
  (B, nella pipeline) su <cli>: elenco, livelli, `/usage` prima e dopo le micro-prove; il provider `<nome>` in `config.json` e nella
  fixture (contatori misurati, `stessoContoDi`, `livelli`, rapporto provvisorio, tetto 1, `limiti.provider` invariato, piani,
  `orchestra.ordine` e `finestra`, non orchestrabile); la prova di qualità su <task chiuso di Opus>; `modelli.md`, `pianifica.md`,
  `orchestra.md`, README della pipeline, ADR, `AGENTS.md`.
- Test: <`tests/pipeline.test.ts` (provider, contatore, sforzo, ordine, pagina web)> <`tests/sicurezza/<varco>.test.ts` (l'id fuori
  elenco rifiutato), `tests/coefficients.test.ts`>; typecheck coi turni.
- Tetti di spesa: micro-prove <n punti di 5 ore>; prova di qualità <~3 % del conto>; banco pagato <$>.
- Browser: <no | sì, la lobby e la Genesi col modello nuovo>.
- Quando è fatto: commit su `task/Txxx` con <config, test, documenti, ADR | codice, test, banco>; l'esito dice i contatori misurati,
  il costo misurato contro il listino, la prova di qualità e la raccomandazione d'uso, e ciò che resta non misurato.
  Sicurezza: <nessuna superficie nuova | V-NNN>.
```
