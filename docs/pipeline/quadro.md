# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle 14:57 UTC, epoca 100 su gemini: **claude ha esaurito il limite di 5 ore (0 %)** (reset 16:59 UTC / ~18:00 locali, settimana 55 %), l'orchestratore prosegue su gemini (gemini 5h al 57 %, settimana 42 %; argon fermo fino al 04/11). **T80 e T45d (la lobby multigiocatore, ADR-0086)** integrati con successo nel base `3d` (test 18/18 passati, typecheck pulito, rimossi worktree e branch). **T45f (server su Google Cloud)** sbloccato e pronto in attesa delle risposte in `docs/pipeline/domande/T45f.md` (Project ID, architettura Cloud Run vs VM GCE, regione). T70 (integrazione più piani T53b e salto T56b) resta sospeso in attesa del reset crediti su Claude.

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T80 completato su Gemini e integrato nel base `3d`**: T80 ha unito `task/T45d` risolvendo il conflitto in `docs/plans/backlog.md`, preservando lo stato `fatto` e l'esito di T45d e mantenendo intatti i blocchi T75-T79. Suite `tests/lobby.test.ts`, `tests/credits.test.ts`, `tests/coefficients.test.ts` (18/18) superata e typecheck a 0 errori. Eseguiti `integra T80` e `integra T45d`, worktree e branch rimossi.
  - **T45d integrato nel base `3d` (ADR-0086)**: implementati requisiti minimi `ai.minimi`, tetto crediti con incremento budget in `credits.ts`, evento e modale a 3 scelte a crediti esauriti (`CreditExhaustedModal`), schermata lobby multigiocatore (`LobbyScreen`) e collezione carte con contatori di utilizzo.
  - **T45f sbloccato e preparato**: dipendeva da T44b e T45d, ora entrambi integrati. Aperte le domande su GCP Project ID, architettura di hosting (Cloud Run vs VM GCE) e regione in `docs/pipeline/domande/T45f.md`.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Risposte dell'autore per T45f**: GCP Project ID, preferenza architetturale (Cloud Run vs VM GCE) e regione.
  2. **Reset crediti Claude** (alle 17:00 UTC / ~18:00 locali): ripresa di T70 (integrazione T53b più piani con salto T56b).
  3. **Chiavi di test Stripe** dall'autore per la verifica finale nel browser di T45e.
- **Intenzioni / prossimi passi**:
  1. Ricevute le risposte su T45f, approvare e lanciare l'allestimento dell'infrastruttura Google Cloud.
  2. Al reset crediti di Claude: chiudere T70 (`integra T70` e `integra T53b`) e preparare task di verifica browser multigiocatore a due schede (lobby T45d, account T44b, profilo T44a, crediti T45a).

## Task attivi e in corso

- **Pronti / In corso**:
  - Nessun task attivo al momento.
  - **T70** (claude, p0): worktree t70 in merge; agente fermo per limite 5h (reset 16:59 UTC / ~18:00 locali).
- **Completati in attesa di integrazione**:
  - **T53b** (claude): in attesa di T70.
- **Completati e integrati nel base `3d`**:
  - **T80**, **T45d**, **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **In attesa di chiavi/risposte/verifica browser**:
  - **T45f**: sbloccato, in attesa di GCP Project ID e scelte di deploy (`docs/pipeline/domande/T45f.md`).
  - **T45e**: codice e test integrati, in attesa credenziali test Stripe per prova interattiva browser.
- **In coda / Bloccati**:
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
  - **T57** (rune come codice, bloccato da T51a).
- **Crediti**:
  - **Claude**: 5h al 0 %, settimana al 55 % (fermo fino alle 17:00 UTC / ~18:00 locali, orchestratore su Gemini).
  - **Gemini**: 5h al 57 %, settimana al 42 % (orchestratore attuale).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T45d (la lobby multigiocatore, selezione tetto e modale crediti esauriti), T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
