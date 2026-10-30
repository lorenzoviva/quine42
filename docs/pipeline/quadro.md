# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026, chiusura epoca 16 dell'orchestratore (gemini: contesto a 74%).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude al reset, con Gemini attivo per i task pronti compatibili.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T45a completato e integrato** (commit `c434033`): eseguito con successo su Gemini (sessione `af57b0ff`), verificati i test headless (`tests/credits.test.ts`), registrato ADR-0081 e integrato senza conflitti in `3d`.
  - **T68b in corso su Gemini** (worktree `t68b`, sessione attiva `270cce41`), sfruttando la capienza di Gemini (75% settimanale, 61% 5h).
- **Cosa si aspetta**:
  1. Il completamento di **T68b** in corso su Gemini.
  2. Il reset della sessione di 5 ore di Claude alle **07:00 UTC** (**08:00** locali, ~1h34m rimanenti; Claude ha il 69% settimanale disponibile).
- **Intenzioni al reset di Claude / prossimi passi**:
  1. Completare **T70** (integrazione T53b con salto T56b, priorità 0 su Claude), poi `integra T70` e `integra T53b`.
  2. Procedere con **T44c** (priorità 3) e **T44b** (priorità 4, che con T45a completato sblocca a cascata T45d/e/f).
  3. Proseguire con **T45b** (priorità 6) e **T45c** (priorità 7).

## Task attivi e in corso

- **In corso su Gemini:**
  - **T68b** (priorità 20, processo che serve la coda con le CLI): attivo nel worktree `t68b`.
- **Sospesi su Claude fino alle 07:00 UTC (`08:00` locali):**
  - **T70** (priorità 0, risoluzione conflitti T53b / T56b con test salto + torre).
  - **T44c** (priorità 3, correzioni da verifica browser T44a/T43c).
  - **T44b** (priorità 4, account e autenticazione).
  - **T45b** (priorità 6, coefficienti di generazione e «Low Detail»).
  - **T45c** (priorità 7, eredità dei cloni).
  - **T52**, **T54**, **T51**.
- **T53b** (strutture su più piani): finito e verificato nel browser; in attesa del completamento di **T70** per l'integrazione pulita.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
