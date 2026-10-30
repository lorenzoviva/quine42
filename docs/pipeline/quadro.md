# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle 14:37 UTC, epoca 94 su gemini: **claude ha esaurito il limite di 5 ore (0 %)** (reset 17:00 UTC / ~18:00 locali, settimana 55 %), l'orchestratore prosegue su gemini (gemini 5h al 61 %, settimana 43 %; argon fermo fino al 04/11). **T45d (la lobby multigiocatore, ADR-0086)** è completato con successo su Gemini (test 18/18 passati, typecheck pulito, commit `c803df1`). L'integrazione **T80** (p0, Gemini) è in esecuzione attiva nel worktree `t80` per risolvere il conflitto su `docs/plans/backlog.md` (merge di `task/T45d` avviato, conflitti risolti, verifiche in corso). T70 (integrazione più piani T53b e salto T56b) è sospeso in attesa del reset crediti su Claude.

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T45d completato su Gemini (commit `c803df1`)**: implementati requisiti minimi `ai.minimi`, tetto crediti con incremento budget in `credits.ts`, evento e modale a 3 scelte a crediti esauriti (`CreditExhaustedModal`), schermata lobby multigiocatore (`LobbyScreen`) e collezione carte con contatori di utilizzo. Test `tests/lobby.test.ts` (6/6), `tests/credits.test.ts` (6/6), `tests/coefficients.test.ts` (6/6) superati, `npm run typecheck` a 0 errori. ADR-0086 redatto.
  - **T80 creato e approvato su Gemini (stima 1%, p0)**: `integra T45d` ha riscontrato conflitto solo in `docs/plans/backlog.md` dovuto ai commit nel base `3d`. T80 eseguirà il merge di `task/T45d` risolvendo il backlog mantenendo l'esito di T45d e i task T75-T79.
  - **T79 e T45b integrati nel base `3d`**: T79 ha integrato T45b su Gemini rinumerando l'ADR in 0085, preservando le integrazioni precedenti (Stripe ADR-0083, eredità cloni ADR-0084). Superati 26/26 test e typecheck. Eseguito `integra T79` e `integra T45b`, worktree e branch rimossi.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Esecuzione di T80** (gemini, p0) per completare l'integrazione di T45d nel base `3d`.
  2. **Reset crediti Claude** (alle 17:00 UTC / ~18:00 locali): ripresa di T70 (integrazione T53b più piani con salto T56b).
  3. **Chiavi di test Stripe** dall'autore per la verifica finale nel browser di T45e.
- **Intenzioni / prossimi passi**:
  1. Con T80 integrato, eseguire `integra T80` e `integra T45d` per rimuovere branch e worktree.
  2. Sbloccare **T45f** (server su Google Cloud).
  3. Al reset crediti di Claude: chiudere T70 (`integra T70` e `integra T53b`) e preparare task di verifica browser multigiocatore a due schede.

## Task attivi e in corso

- **Pronti / In corso**:
  - **T80** (gemini, 1%, p0, approvato): integrazione di T45d (lobby multigiocatore, ADR-0086) nel base `3d`.
  - **T70** (claude, p0): worktree t70 in merge; agente fermo per limite 5h (reset 17:00 UTC).
- **Completati in attesa di integrazione**:
  - **T45d** (gemini): in attesa di T80.
  - **T53b** (claude): in attesa di T70.
- **Completati e integrati nel base `3d`**:
  - **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **In attesa di chiavi/verifica browser**:
  - **T45e**: codice e test integrati, in attesa credenziali test Stripe per prova interattiva browser.
- **In coda / Bloccati**:
  - **T45f** (server su Google Cloud, attende T45d / T80).
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Claude**: 5h al 0 %, settimana al 55 % (fermo fino alle 17:00 UTC / ~18:00 locali, orchestratore su Gemini).
  - **Gemini**: 5h al 61 %, settimana al 43 % (orchestratore attuale ed esecuzione di T80).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T45d (la lobby multigiocatore, selezione tetto e modale crediti esauriti), T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
