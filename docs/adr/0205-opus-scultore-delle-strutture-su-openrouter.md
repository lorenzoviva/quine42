# ADR-0205 — Opus 5.5 Scultore delle strutture sulla via di OpenRouter, dall'1/12

Data: 2026-11-16 · Stato: accettato · Riferimenti: ADR-0193 (l'adattatore OpenRouter: gli id fissi a elenco, punto 2), ADR-0197 (il varco delle
chiavi), ADR-0183 (lo Scultore delle strutture a blocchi), ADR-0160 (un programma per concetto, condiviso fra le taglie), ADR-0085 (la stima
oraria); D57 (opzione 1, scelta dall'autore il 16/11), D58 (Argon a ogni taglia, T395); T392 (il giro dei Claude sull'abbonamento), T397 (step 30)

## Contesto

Lo Scultore delle strutture che crescono a regole scrive su Argon a ogni taglia (T395, D58). Il giro di T392 (15/11, sulla CLI dell'abbonamento, lo
stesso banco di T355 e T391: forte e fattoria a Grande ed Enorme, tre ripetizioni) ha dato:

| Scultore | riuscite | costo per riuscita | tempo a struttura | chiamate oltre i 120 s del gioco | fattorie con merli |
|---|---|---|---|---|---|
| Argon (T355) | 6 su 8 | 0,37 $, **0,74 $ dall'1/12** | 188 s | 0 su 40 | 4 su 4 |
| **Opus 5.5** | **11 su 12** | **0,75 $** | 207 s | 1 su 49 | **0 su 6** |

Dall'1/12 Argon raddoppia (`prices.ts`): Opus costa quanto lui per riuscita, riesce di più, non fortifica le fattorie e separa i concetti il triplo.
Il gioco però non chiamava nessun modello di Anthropic: `OPENROUTER_MODELS` aveva solo Gemini, e sulla via di Google Opus non c'è. L'autore ha scelto
(D57, opzione 1): Argon fino all'1/12, poi Opus 5.5 quando il mondo va su OpenRouter; Argon resta sulla via di Google.

Letto il 16/11/2026 su `https://openrouter.ai/api/v1/models/anthropic/claude-opus-5.5/endpoints`: id `anthropic/claude-opus-5.5`, versione
`anthropic/claude-opus-5.5-20260921`, 4,00 $ al milione in ingresso, 20,00 in uscita, 0,20 dalla cache, 5,00 la scrittura in cache (8,00 per un'ora),
uguale al listino di Anthropic; alcuni endpoint regionali chiedono il 10 % in più. Nessun endpoint prende `temperature`; tutti prendono
`response_format`, `reasoning` e `max_tokens`; nessuno ha la cache implicita (`supports_implicit_caching: false`).

## Decisione

1. **Opus 5.5 nell'elenco dell'adattatore** (`OPENROUTER_MODELS['claude-opus-5-5']`): id e versione fissi come per Google, `temperature: false`
   (con `require_parameters` una temperatura lascerebbe la richiesta senza endpoint), `cacheSystem: true` (le istruzioni di sistema come una parte di
   testo con `cache_control: { type: 'ephemeral' }`: le chiamate che seguono entro cinque minuti, i due blocchi e le correzioni della stessa struttura,
   le leggono al prezzo della cache), `maxTokens: 32 000` (il ragionamento basso e un programma stanno in 7 mila; il tetto limita una risposta che
   scappa a 0,64 $). Lo schema, quando c'è, è lo schema JSON di ADR-0193; il ragionamento è `ai.thinking` (`low`), come per gli altri. Il varco lo
   ammette perché è nell'elenco (`CHAT_MODELS` viene da `OPENROUTER_MODELS`) e lascia passare `cache_control` dentro `messages`; ogni altro id di
   Anthropic resta fuori.
2. **Il prezzo** in `PRICES['claude-opus-5-5']` con la data (`OPUS_PRICES_READ_ON`); `priceOf` legge l'id di OpenRouter (`anthropic/claude-opus-5.5`,
   col punto) come il nostro. Il costo vero è quello che ogni risposta dice (`CallRecord.usd`), scrittura in cache compresa. Un modello di Google fuori
   listino si conta ancora col più caro di Google (`DEAREST_MODEL`), non con Opus.
3. **La via del mondo** (`AiRoute`: `google` o `openrouter`) la sa il kernel da ciò con cui scrive il Concilio (`Kernel.aiRoute()`: `OpenRouterAiModels`,
   anche dietro il router degli abbonamenti). **Lo Scultore di un mondo** è `sculptorsOn(ai.sculptors, via, oggi)`: i predefiniti sotto ciò che dice
   l'universo; poi, su OpenRouter da `openRouterFrom` (2026-12-01, come `importanteFino`), `openRouterStructure` (Opus 5.5) per le strutture e le
   importanti **che il master ha lasciato come i predefiniti** (Argon scritto dalla lobby è ancora il predefinito; Low Detail o un altro modello scelto
   restano). Sulla via di Google un modello che Google non ha torna al predefinito (un `universe.json` scritto a mano). Figure, cose semplici,
   l'Artista e il Musicista non cambiano; le `<action>` di una struttura le scrive lo stesso modello.
4. **La stima oraria conta le strutture col loro Scultore**: prima le contava col modello delle figure. Una struttura di un concetto nuovo sono circa
   tre chiamate (la composizione, il programma intero, una correzione) di 20 mila token in ingresso, 7,5 mila stabili, e 6,5 mila in uscita
   (`STRUCTURE_SCULPT`, dalle 35 chiamate di Opus di T392); al più `HOUR.strutture` (4) all'ora, perché un programma vale per il concetto a ogni taglia
   (ADR-0160), e mai più della loro parte dei modelli voluti. `hourlyEstimate(ai, data, { route })`: la lobby da soli sa la via dal kernel, in una
   partita di molti da `/api/openrouter/status` (`worlds`), la Genesi dal kernel; il sito resta alla via di Google. Col dettaglio pieno la stima passa
   da 1,56 a 2,67 $ l'ora oggi e a 3,83 dall'1/12, uguale sulle due vie (Opus costa per token quanto Argon raddoppiato); Low Detail da 0,58 a 0,73.
5. **Il banco**: `scultore-gemini.ts -- --modelli claude-opus-5-5 --via openrouter` manda le chiamate dello Scultore all'adattatore del gioco (con la
   chiave `OPENROUTER_API_KEY` dal `.env`, mai stampata), l'Artista resta su Gemini, `--tetto` conta anche i dollari di OpenRouter, ogni chiamata in
   `esito.json` con i token letti dalla cache e il costo detto; `--offline` con un OpenRouter finto.

## Conseguenze

- Chi gioca su OpenRouter dall'1/12 paga le strutture a Opus: lo stesso costo per riuscita di Argon raddoppiato, più riuscite. Chi gioca con la chiave
  di Google ha Argon.
- La prova pagata via OpenRouter (4 strutture, tetto 4 $, `docs/pipeline/domande/T397.md`) non è stata fatta in T397: nei `.env` della macchina non
  c'era `OPENROUTER_API_KEY`. Se desse meno di 3 su 4 o più di 1,50 $ a riuscita, si torna indietro spostando `openRouterFrom` o togliendo
  `openRouterStructure` da `DEFAULT_SCULPTORS`: una riga.
- Sicurezza: nessuna superficie nuova. Un id in più nell'elenco dei modelli del varco; `cache_control` passava già dentro `messages`, che il varco
  copia com'è (ADR-0197).
- Kernel 0.7.14 (Z: nessun formato cambia).
