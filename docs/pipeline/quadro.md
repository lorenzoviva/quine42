# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle 08:35 UTC, epoca 46 (claude: 5h al 16 %, settimana 62 %; gemini 5h al 100 %).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude dopo il reset crediti avvenuto (5h al 69%, settimana al 69%).

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **Claude ha di nuovo crediti**: sessione di 5h resettata (5h al 69%, settimana al 69%); sblocco immediato dei task sospesi.
  - **T45a completato e integrato** (commit `c434033`): crediti per viandante, commissione +1% (P#1), divisione spese comuni tra collegati, ADR-0081.
  - **T68b completato su Gemini e integrato** (commit `8083986`, T73 integrato commit `d5fb2d1`): implementato `tools/abbonamenti/servi.ts`, `npm run abbonamento` e suite di test unitari e reali.
  - **T68c completato su Gemini e integrato** in `3d`: collegati gli abbonamenti nel gioco tramite `RoutedModels` in `main.ts`, stato e coda in `#models` e nel pannello del Concilio (`FeedPanel`), documentazione in `README.md` e test Genesi offline con coda servita in `tests/subscription.test.ts`.
  - **T74 completato su Gemini e integrato** in `3d`: risolto il merge di T68c in `docs/plans/backlog.md` preservando tutti i blocchi ed esiti, suite `tests/subscription.test.ts` (16/16) e typecheck verdi. Integrati con successo sia T74 che T68c nel branch base `3d`, con rimozione dei relativi worktree e branch.
- **Cosa si aspetta**:
  1. Completamento ed esito di **T70** su Claude per procedere all'integrazione di T70 e T53b nel base `3d`.
- **Intenzioni / prossimi passi**:
  1. Esecuzione di **T70** (integrazione T53b con salto T56b, priorità 0 su Claude), poi `integra T70` e `integra T53b`.
  2. Procedere con **T44c** (priorità 3) e **T44b** (priorità 4, che con T45a completato sblocca a cascata T45d/e/f).
  3. Proseguire con **T45b** (priorità 6) e **T45c** (priorità 7).

## Task attivi e in corso

- **Su Claude (crediti tornati: 5h 69 %, settimana 69 %)**, ripresi alle 07:01: **T70** (p0), **T44c** (p3), **T44b** (p4), **T45b** (p6), **T45c** (p7).
- **Interrotti dall'orchestratore** alle 07:01 per lasciare i posti al multigiocatore (priorità 1 dell'autore): **T52** e **T54** (p50; T54 risulta «fallito (codice 1)» solo per l'interruzione). Da riprendere con `riprendi T52 T54` quando si libera un posto.
- **Da integrare:** **T53b** (dopo T70: `integra T70`, poi `integra T53b`); **T44b** (fatto 08:33, verificato con l'emulatore di Firebase; `integra` in conflitto con T45a → **T75** su gemini, p0, poi `integra T75` e `integra T44b`; il suo ADR diventa 0082, un solo meccanismo per l'anonimo).
- **Gemini:** 5h al 30 %, settimana al 66 %. **Argon:** fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
