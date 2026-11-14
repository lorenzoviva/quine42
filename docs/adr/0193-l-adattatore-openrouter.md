# ADR-0193 — L'adattatore OpenRouter: gli stessi modelli e Jev con il costo detto dalla risposta

Data: 2026-11-14 · Stato: accettato · Riferimenti: ADR-0184 (la open beta senza pagamenti all'autore, punto 1 e punto 6 come D52 lo cambia),
ADR-0099 (il varco della chiave), ADR-0113 (chi paga si dice), ADR-0157 (Jev, le decisioni chiuse), ADR-0186 (la cache esplicita dell'Attore);
[`docs/design/open-beta.md`](../design/open-beta.md) § 1.5-1.7 e § 6 riga 2; T362 (step 43); D52 (13/11: Jev resta acceso perché OpenRouter dà anche i
modelli di TypeSafe), D45 (il testo libero del viandante mai a Jev finché non c'è la ritenzione zero)

## Contesto

Nella open beta i giocatori pagano i modelli con la propria chiave di OpenRouter (ADR-0184). Oggi il Concilio parla solo con Gemini
(`GeminiAiModels`, il formato di Google) e Jev solo con TypeSafe (`JevDecisionModels`, `/v1/systemone`); il registro dei consumi ricava i dollari dal
listino di `prices.ts`. OpenRouter ha un'API nel formato di OpenAI (`/api/v1/chat/completions`), un'API delle decisioni per Jev
(`/api/alpha/decisions`) e, in ogni risposta, il costo che ha addebitato (`usage.cost`). Letti il 14/11/2026 (gli endpoint pubblici
`/api/v1/models`, `/api/v1/models/<id>/endpoints`, `/api/v1/endpoints/zdr` e le pagine della documentazione):

- i modelli di Google che usiamo ci sono tutti, con gli stessi prezzi di Google sul livello standard (Flash-Lite 0,25 / 1,50, 3.8 Flash 0,75 / 3,75,
  Argon 2 / 10 $ al milione), tutti con le immagini in ingresso; i livelli `flex` e `priority` costano metà o quasi il doppio, ma un id senza suffisso
  non li sceglie mai;
- gli endpoint Vertex di 3.8 Flash, 3.7 Flash, 3.6 Flash e 3.5 Flash-Lite non accettano `temperature`: con `require_parameters` una richiesta che la
  manda resta solo ad AI Studio;
- Jev c'è come `typesafe/jev-1.13` e `typesafe/jev-1.14` (0,042 $ al milione in ingresso, la risposta gratis), un solo fornitore, TypeSafe, il cui
  endpoint è **nell'elenco della ritenzione zero** di OpenRouter (`safety_retention: false`); la richiesta è quella di TypeSafe (`model`, `state`,
  `questions`) più `provider`, la risposta ha le stesse `answers` e un tipo `refusal` in più.

## Decisione

1. **`OpenRouterAiModels`** (`src/kernel/ai/openrouter.ts`) accanto a `GeminiAiModels`: lo stesso `AiModels`, le stesse chiamate, lo stesso testo
   restituito. Non ha chiavi: parla con una base (`endpoint`, il varco `/api/openrouter` di T363, o l'API stessa in uno script del laboratorio che
   aggiunge la chiave nel suo `fetch`).
2. **Gli id sono fissi e a elenco** (`OPENROUTER_MODELS`: il nostro id → quello di OpenRouter, con la versione datata letta e se ogni endpoint
   standard accetta la temperatura); mai un alias che si muove (`~…-latest`), `openrouter/auto` o un livello (`:floor`, `:nitro`). Un modello fuori
   elenco non parte e non consuma il budget.
3. **La richiesta**: le istruzioni di sistema come primo messaggio, il prompt e poi le foto dell'Artista come parti `image_url` con i data URL di oggi;
   lo schema del Concilio convertito in uno schema JSON (`toJsonSchema`: tipi in minuscolo, `nullable` come tipo che può essere `null`, `required` solo
   per le proprietà che ci sono) in `response_format` con `strict: false` (il validatore resta la rete, regola 2); `reasoning.effort` come oggi
   `thinkingLevel`, con `exclude` (il ragionamento non torna); `ai.thinking: off` non manda niente, come per Gemini; la temperatura solo dove ogni
   endpoint standard la prende; `provider: { require_parameters: true, data_collection: 'deny' }`.
4. **Gli errori**: una richiesta senza risposta, un 408 e un errore dopo l'accettazione (un 200 con l'errore nel corpo o nella scelta) non si
   ripetono (possono essere stati pagati) e restano nel registro con ciò che OpenRouter ha contato; 429 e 5xx sì, tre volte, dopo `Retry-After` se lo
   dice (al più 20 s); **402** (il credito o il limite della chiave) è un `BudgetError`, come il tetto di oggi; **401** (la chiave revocata o sbagliata)
   lo dice con lo stato e non si ripete: cosa ne fa il varco è di T363.
5. **Il costo detto**: `CallRecord.usd` è ciò che il fornitore ha detto (`usage.cost`, più `cost_details.upstream_inference_cost` se la chiave di
   Google è del giocatore, `is_byok`). Il registro dei consumi e l'addebito lo prendono al posto del listino (`callCost`) quando è un numero finito
   ≥ 0; altrimenti il listino, come prima. Le chiamate stanno nel registro sotto l'id di OpenRouter (`google/gemini-3.8-flash`), che `priceOf`
   legge come quello di Google: il listino resta per le stime, il tetto e chi non dice.
6. **Jev via OpenRouter** (D52): `OpenRouterDecisionModels` accanto a `JevDecisionModels`, lo stesso `DecisionModels`. Le versioni del gioco
   (`jev-1.13.0`, `jev-1.14.0`) → `typesafe/jev-1.13`, `typesafe/jev-1.14` (`OPENROUTER_JEV`), con il loro prezzo in `DECISION_PRICES`; il corpo è
   quello del varco di TypeSafe più **`provider.zdr: true`**: OpenRouter rifiuta piuttosto che mandare la richiesta a un endpoint che conserva. Le
   risposte si leggono con `readJevAnswers` (un `refusal` lascia la regola a quella domanda; un livello di Score anche per le sue parole).
7. **D45 resta**: il testo libero del viandante non va a Jev nemmeno così (`freeTextDecision`, `JEV_ZERO_RETENTION` falso). Che l'endpoint di
   TypeSafe su OpenRouter sia a ritenzione zero è un fatto della porta (`zeroRetention`), non un permesso: accenderlo è dell'autore
   (`docs/pipeline/domande/T362.md`).
8. **Niente cablaggio nel gioco** in questo passo: senza il varco (T363: le chiavi dei giocatori, la rotta, il canale dei mondi) nessuna chiave
   arriva a una pagina o a un mondo (regole 8g e 9). La prova pagata è `lab/scripts/openrouter-prova.ts`, con la chiave dell'autore dal `.env`.

## Alternative considerate

- **Le chiamate nel registro sotto il nostro id** (`gemini-3.8-flash`): il registro non direbbe più da dove è passata una chiamata, e due chiamate
  con costi di natura diversa (ricavato e detto) si sommerebbero sotto lo stesso nome. Scartata: un prefisso che `priceOf` toglie.
- **Ricavare sempre i dollari dal listino**: con gli sconti della cache, gli endpoint regionali (+10 %), una chiave di Google del giocatore e i
  cambi di prezzo, il listino sbaglia; OpenRouter dice ciò che ha addebitato davvero. Scartata; il listino resta per chi non dice.
- **`/api/v1/systemone`**, la porta compatibile con l'SDK di TypeSafe: lo stesso corpo di oggi, ma la documentazione delle preferenze di
  instradamento (`zdr`) è di `/api/alpha/decisions`. Scelta quest'ultima, anche se «alpha»: se cambia, cambia in un punto.
- **`strict: true`**: le modalità strette restringono lo schema e variano per fornitore; il validatore ripara e rimanda già. Da riprovare con la prova pagata.
- **Mandare sempre la temperatura**: su 3.8 Flash lascerebbe solo AI Studio (e nessun endpoint a chi ha la ritenzione zero imposta nel suo account).

## Conseguenze

- `src/kernel/ai/openrouter.ts`; `CallRecord.usd` e `callCost` in `usage.ts`; `priceOf` e `billedModel` leggono `google/…`; `DECISION_PRICES` con gli
  id di OpenRouter; `readJevAnswers` legge un livello di Score anche per le sue parole. Kernel 0.7.4 (nessun formato cambia: `world/usage.json` ha
  solo nomi di modello in più).
- Cosa manca, nei task di ADR-0184: il varco `OpenRouterGate` con le chiavi dei giocatori, la rotta `/api/openrouter` e `op: 'openrouter'` sul canale
  dei mondi (T363); la cache esplicita dell'Attore via OpenRouter (ADR-0186 parla al varco di Gemini: via OpenRouter l'Attore paga il prefisso intero
  finché non si prova `cache_control`); la prova pagata (`docs/pipeline/domande/T362.md`).
- Sicurezza: nessuna superficie nuova in questo passo (nessuna chiave, nessuna rotta); il costo detto entra nell'addebito solo dalla risposta di
  un varco, che sarà la superficie di T363.
