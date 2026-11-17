# ADR-0207 — Lo Scultore delle strutture scelto dal master: standard, performante, massimo

Data: 2026-11-17 · Stato: accettato · Riferimenti: ADR-0205 (Opus 5.5 sulla via di OpenRouter dall'1/12), ADR-0193 (l'adattatore, gli id a
elenco), ADR-0197 (il varco delle chiavi), ADR-0133 (le regolazioni si fissano entrando), ADR-0188 (chi paga la partita), ADR-0085 (la stima
oraria); D57 (l'autore, 16/11); T397, T402 (il giro pagato di Opus via OpenRouter); T398 (step 30)

## Contesto

Con la risposta a D57 l'autore ha chiesto che «a regime» si possa impostare dalla Genesi uno Scultore più bravo: «se un folle volesse spendere di
propria tasca 3 $ a struttura con Fable, dovrebbe essergli concesso». Fino a qui lo Scultore delle strutture lo decideva `DEFAULT_SCULPTORS` con la
via del mondo (ADR-0205): Argon sulla via di Google, Opus 5.5 su OpenRouter dall'1/12. Il giro pagato di T402 ha dato Opus 4 su 4 a 0,61 $ per
riuscita via OpenRouter.

Letto il 17/11/2026 su `https://openrouter.ai/api/v1/models/anthropic/claude-fable-5.1/endpoints`: id `anthropic/claude-fable-5.1`, versione
`anthropic/claude-fable-5.1-20260831`, 10,00 $ al milione in ingresso, 50,00 in uscita, 0,25 dalla cache, 12,50 la scrittura in cache (20,00 per un'ora),
uguale al listino di Anthropic (`ANTHROPIC_PRICES`); l'endpoint regionale di Vertex negli Stati Uniti chiede il 10 % in più. Nessun endpoint prende
`temperature`; tutti prendono `response_format`, `reasoning` e `max_tokens`; nessuno ha la cache implicita. Nello stesso elenco c'è anche Fable 5.2
(`anthropic/claude-fable-5.2-20261109`, 8/40 $): non l'abbiamo provato su nessun banco e il task chiede Fable 5.1, quindi resta fuori.

## Decisione

1. **Una manopola in `ai`**: `ai.sculptorTier`, `standard` (assente), `strong` («performante») o `max` («massimo»); il tipo `SculptorTier`,
   `repairSculptorTier` (una parola che non è un livello è `standard`), `TIER_MODELS` (`strong` → `claude-opus-5-5`, `max` → `claude-fable-5-1`).
   Il livello sceglie lo Scultore **delle strutture e delle importanti**; figure, cose semplici, Artista e Musicista non cambiano.
2. **Per via, a elenco** (`sculptorsOn(…, tier)`): `standard` è ADR-0205; sulla via di OpenRouter `strong` mette Opus 5.5 da subito (anche prima
   dell'1/12) e `max` Fable 5.1. Un livello sopra `standard` è l'ultima parola del master sulle strutture: vince anche su un modello scelto per la classe
   (Low Detail compreso; la Genesi e la lobby rimettono `standard` quando si sceglie Low Detail). **Sulla via di Google solo i Gemini**: ogni livello
   scrive con Argon, e la pagina lo dice.
3. **Fable 5.1 nell'elenco dell'adattatore** (`OPENROUTER_MODELS['claude-fable-5-1']`), come Opus: id e versione fissi, senza temperatura, il prompt
   di sistema in cache con `cache_control`, `max_tokens` 32 000; il prezzo in `PRICES` con la data (`FABLE_PRICES_READ_ON`), che `priceOf` legge anche
   dall'id di OpenRouter. Dalla lobby il livello entra solo come una delle tre parole (`repairAiSettings`): Opus e Fable non sono fra i modelli che la
   lobby offre per una classe (`pricedAiModels`), e nessun altro id di Anthropic entra nell'elenco del varco.
4. **Il varco riscrive il tetto dei token** dei modelli che ne hanno uno nell'elenco (`chatRequest`, `CHAT_MAX_TOKENS`): `max_tokens` mai sopra 32 000
   per Opus e Fable, e c'è anche se il corpo non lo dice. Così una chiamata di Fable costa al più circa 1,60 $ d'uscita più l'ingresso, e il tetto al
   giorno della chiave del server (`OPENROUTER_TETTO_GIORNALIERO`, 10 $ se non detto) e il limite di una chiave di un giocatore reggono anche il modello più caro.
5. **Nella Genesi e nella lobby** (`src/ui/sculptortier.ts`, `#genesi-scultore-livello`, `#lobby-scultore-livello`): le tre scelte con il modello e
   il costo di una struttura di un concetto nuovo sulla via del mondo (`sculptorTiers`, `structureCost`: i pesi di `STRUCTURE_SCULPT`), la stima oraria
   che segue, e chi la paga: da soli chi gioca; nella lobby di molti chi paga la partita (il master con «Pago io tutta la partita», altrimenti le spese
   comuni). Fissa a partita in corso come le altre regolazioni (`setAi`, `applySettings`, regola 8b-bis); un giocatore la vede e non la tocca.

Numeri della stima (17/11, dettaglio pieno, via di OpenRouter): una struttura nuova costa circa 0,29 $ con Argon, 0,58 con Opus 5.5 (il giro di T402:
0,61 per riuscita), 1,44 con Fable 5.1; un'ora di gioco 2,67 $ standard, 3,83 performante, 7,29 massimo. Dall'1/12 standard è già Opus: 3,83. Sulla
via di Google 2,67 a ogni livello (3,83 dall'1/12, quando Argon raddoppia).

## Conseguenze

- Chi vuole le strutture migliori le paga: il livello sta in `universe.json` del mondo, e il costo va a chi paga la partita come ogni altra chiamata
  (`billedTo`, ADR-0188). Il master lo vede prima di entrare, con la stima.
- Fable 5.1 non è stato provato sul banco delle strutture: i numeri per riuscita sono una stima coi pesi di Opus; una prova pagata (`scultore-gemini.ts
  -- --modelli claude-fable-5-1 --via openrouter`) direbbe riuscite e costo veri.
- Sicurezza (V-040, aggiornamento): un id in più nell'elenco del varco, il più caro; il tetto dei token riscritto dal varco lo tiene dentro il tetto al giorno.
- Kernel 0.8.1 (Z: un campo facoltativo in `ai`, assente come prima; nessun formato cambia).
