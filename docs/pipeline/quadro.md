# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026, avvio epoca 35 dell'orchestratore (gemini).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude al reset, con Gemini attivo per i task pronti compatibili.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T45a completato e integrato** (commit `c434033`): crediti per viandante, commissione +1% (P#1), divisione spese comuni tra collegati, ADR-0081.
  - **T68b completato su Gemini** (commit `8083986`): implementato `tools/abbonamenti/servi.ts`, script `npm run abbonamento` e suite di test unitari e reali con Claude Code in `tests/abbonamenti.test.ts`.
  - **T73 completato e integrato con T68b**: risolto il conflitto in `AGENTS.md` preservando sia `credits.ts` (T45a) che `servi.ts`/`npm run abbonamento` (T68b) e `web.mjs` (T69). Task T73 e T68b integrati con successo nel branch base `3d`.
  - **T68c avviato su Gemini**: con Claude fermo al limite delle 5h, T68c (priorità 21) è stato instradato automaticamente su Gemini nel worktree `t68c` ed è attualmente in esecuzione.
- **Cosa si aspetta**:
  1. Completamento di **T68c** su Gemini (integrazione abbonamenti nel gioco, `main.ts`, pannello Concilio, documentazione).
  2. Reset della sessione di 5 ore di Claude alle **07:00 UTC** (**~08:00** locali, ~51m rimanenti; quota settimanale al 69%).
- **Intenzioni al reset di Claude / prossimi passi**:
  1. Completare **T70** (integrazione T53b con salto T56b, priorità 0 su Claude), poi `integra T70` e `integra T53b`.
  2. Procedere con **T44c** (priorità 3) e **T44b** (priorità 4, che con T45a completato sblocca a cascata T45d/e/f).
  3. Proseguire con **T45b** (priorità 6) e **T45c** (priorità 7).
  4. Integrare **T68c** al termine.

## Task attivi e in corso

- **In corso su Gemini:**
  - **T68c** (priorità 21, integrazione abbonamenti nel gioco, worktree `t68c`).
- **Da integrare:**
  - **T53b** (in attesa di T70).
- **Pronti:**
  - **T51** (priorità 50 su Claude).
- **Sospesi su Claude fino alle 07:00 UTC (`~08:00` locali, ~51m):**
  - **T70** (priorità 0, risoluzione conflitti T53b / T56b con test salto + torre).
  - **T44c** (priorità 3, correzioni da verifica browser T44a/T43c).
  - **T44b** (priorità 4, account e autenticazione).
  - **T45b** (priorità 6, coefficienti di generazione e «Low Detail»).
  - **T45c** (priorità 7, eredità dei cloni).
  - **T52**, **T54**.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
