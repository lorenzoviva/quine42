# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026, avvio epoca 38 dell'orchestratore (gemini: contesto a 132%).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude al reset, con Gemini attivo per i task pronti compatibili.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T45a completato e integrato** (commit `c434033`): crediti per viandante, commissione +1% (P#1), divisione spese comuni tra collegati, ADR-0081.
  - **T68b completato su Gemini e integrato** (commit `8083986`, T73 integrato commit `d5fb2d1`): implementato `tools/abbonamenti/servi.ts`, `npm run abbonamento` e suite di test unitari e reali.
  - **T68c completato su Gemini** (branch `task/T68c` commit `7f9c965`): collegati gli abbonamenti nel gioco tramite `RoutedModels` in `main.ts`, stato e coda in `#models` e nel pannello del Concilio (`FeedPanel`), documentazione in `README.md` e test Genesi offline con coda servita in `tests/subscription.test.ts`.
  - **T74 creato, approvato e avviato su Gemini (priorità 0)**: `integra T68c` ha segnalato un conflitto testuale isolato in `docs/plans/backlog.md` (dovuto alle integrazioni concorrenti di T71/T72/T73 in `3d`). Creato T74 per risolvere il merge in `docs/plans/backlog.md` preservando tutti i blocchi ed esiti, con test e typecheck. Attualmente in esecuzione su Gemini.
- **Cosa si aspetta**:
  1. Completamento di **T74** su Gemini, poi `integra T74` e `integra T68c`.
  2. Reset della sessione di 5 ore di Claude alle **06:59 UTC** (**~08:00** locali, ~44m rimanenti; quota settimanale al 69%).
- **Intenzioni al reset di Claude / prossimi passi**:
  1. Completare **T70** (integrazione T53b con salto T56b, priorità 0 su Claude), poi `integra T70` e `integra T53b`.
  2. Procedere con **T44c** (priorità 3) e **T44b** (priorità 4, che con T45a completato sblocca a cascata T45d/e/f).
  3. Proseguire con **T45b** (priorità 6) e **T45c** (priorità 7).

## Task attivi e in corso

- **In corso su Gemini:**
  - **T74** (priorità 0, integrazione merge T68c in `docs/plans/backlog.md`, worktree `t74`).
- **Da integrare:**
  - **T68c** (in attesa di T74).
  - **T53b** (in attesa di T70).
- **Pronti:**
  - **T51** (priorità 50 su Claude).
- **Sospesi su Claude fino alle 06:59 UTC (`~08:00` locali, ~44m):**
  - **T70** (priorità 0, risoluzione conflitti T53b / T56b con test salto + torre).
  - **T44c** (priorità 3, correzioni da verifica browser T44a/T43c).
  - **T44b** (priorità 4, account e autenticazione).
  - **T45b** (priorità 6, coefficienti di generazione e «Low Detail»).
  - **T45c** (priorità 7, eredità dei cloni).
  - **T52**, **T54**.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
