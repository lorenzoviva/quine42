# ADR-0262 — La coda degli abbonamenti pagata coi crediti API di Anthropic

- **Stato**: accettato
- **Data**: 2026-11-26
- **Task**: T542
- **Estende**: ADR-0077 (la coda degli abbonamenti), ADR-0106 (la CLI isolata), ADR-0177 (il generatore sui crediti che avanzano), ADR-0216 (la rigenerazione dei modelli)

## Contesto

L'abbonamento di Anthropic dell'autore porta 100 $ di crediti API al mese, da spendere entro l'1/12. La rigenerazione dei modelli
(`npm run genera -- <u> --rigenera modelli`) passa dalla coda servita dalla CLI sull'abbonamento (`tools/abbonamenti/servi.ts`), che consuma la
settimana. La CLI di Claude Code fattura all'API quando trova `ANTHROPIC_API_KEY` nel suo ambiente: in modalità `-p` la chiave vince sul login
dell'abbonamento, e il suo `init` lo dice (`apiKeySource: "ANTHROPIC_API_KEY"`, `"none"` sull'abbonamento; letto sulla CLI 2.1.330).

Il rischio è l'opposto: una chiave nell'ambiente della pipeline, del server o di un mondo farebbe pagare all'API ogni CLI che lanciano.

## Decisione

1. **Solo il figlio che serve una richiesta ha la chiave** (`tools/abbonamenti/api.ts`). `npm run abbonamento -- --api --tetto-api <usd>` (o
   `QUINE_CODA_API=1` e `QUINE_CODA_TETTO_API=<usd>` nel `.env`; `--env <file>` per un altro `.env`) legge `ANTHROPIC_API_KEY` dal `.env` di
   questo checkout o, da un worktree, da quello principale, **mai in `process.env`** (`envValues`, `apiSettings`): nessun altro figlio la eredita.
   L'ambiente del figlio è quello ridotto di ADR-0106 più la chiave, senza il token dell'abbonamento (`childEnv`); senza `--api` il figlio non ha
   chiave, qualunque cosa abbia l'ambiente di chi serve. La chiave non si stampa né si scrive: il servitore dice da quale file viene; un testo
   della CLI che la contenesse esce con `[chiave]` (`redact`).
2. **Ogni corsa dice come paga, prima del modello**: `IsolationCheck` legge `apiKeySource` dell'`init`; con `--api` deve essere
   `ANTHROPIC_API_KEY`, senza deve essere `none` (una CLI che non lo dice è creduta solo sull'abbonamento). Altrimenti la corsa si ferma al suo
   `init` e il servitore smette (`billing`), come per l'isolamento.
3. **Il tetto e il registro**: ogni corsa che dice i suoi token va nel registro accanto alla coda, `universes/.queue/spesa-api-claude.json`
   (`recordCall`): per mese (`AAAA-MM`, ora locale) il costo al listino di Anthropic (`priceRun` → `anthropicCost`, i token per modello di
   `modelUsage`, le scritture della cache fra 5 minuti e un'ora), accanto il costo che la CLI dice (`total_cost_usd`), le chiamate; le ultime 500
   una per una, senza prompt né risposta. Raggiunto il tetto del mese la coda non prende più richieste e il servitore si ferma (chi aspetta vede che
   nessuno serve); così quando l'API dice che i crediti sono finiti. Il tetto è controllato prima di ogni richiesta: l'ultima può passarlo del suo
   costo (una chiamata dello Scultore su Opus vale centesimi).
4. **Una chiave di nessun workspace** (una chiave dell'organizzazione) vuole l'intestazione `anthropic-workspace-id`: l'id sta nel `.env`
   (`ANTHROPIC_WORKSPACE_ID`, lettere, cifre, `_` e `-`) e la CLI lo manda da `ANTHROPIC_CUSTOM_HEADERS`; senza, l'API rifiuta la prima richiesta
   e il servitore si ferma col motivo.
5. **Nessuna chiave in ciò che la pipeline lancia** (`withoutApiKeys` in `tools/pipeline/generatore.mjs`): i task, i turni, `/usage`,
   l'orchestratore, il generatore e la sua coda partono senza `ANTHROPIC_API_KEY` né `ANTHROPIC_AUTH_TOKEN`; il server di produzione le toglie
   dal suo ambiente all'avvio (`server/serve.ts`, che legge tutto il `.env`); i mondi avevano già un ambiente a elenco (ADR-0110).
6. **Il generatore sui crediti API** (`"api": true` in `generatore` di `config.json`, `"tettoApi"` facoltativo): la coda parte con `--api`
   (`queueCommand`); la settimana e la finestra delle 5 ore dell'abbonamento non lo trattengono, il tetto dei crediti sì (`apiDecision`: il
   registro del mese contro il tetto della coda o di `config.json`); l'interruttore dell'autore, un task pronto e il tetto della CLI come sempre;
   ogni universo con `--tetto 100` (la settimana che la generazione misura non è ciò che paga). `stato` dice in ogni caso la spesa del mese
   (`apiLine`: speso, tetto, il costo della CLI, le chiamate, chi serve, perché si è fermata).

Nessun cambio al kernel.

## Conseguenze

- I crediti API si spendono sulla stessa coda isolata, con gli stessi modelli a elenco (`CLI_MODELS`), senza toccare la settimana.
- Il costo del registro è il listino sui token che la CLI dice: va confrontato con la console di Anthropic (la prova di T542).
- Una chiave nell'ambiente della shell dell'autore non arriva più a ciò che la pipeline lancia; resta sua nei processi che lancia a mano.
