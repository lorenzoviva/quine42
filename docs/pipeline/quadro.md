# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle 13:59 UTC, fine epoca 82 su gemini: **claude ha esaurito il limite di 5 ore (0 %)** (reset 16:59 UTC / ~18:00 locali, settimana 55 %), l'orchestratore prosegue su gemini (gemini 5h all'86 %, settimana 50 %; argon fermo fino al 04/11). **T79** e **T45b** (coefficienti e Low Detail, ADR-0085) sono stati integrati con successo nel base `3d` (worktree e branch rimossi), con test mirati (35/35) e typecheck a 0 errori. **T45d (la lobby)** è sbloccato, approvato e in esecuzione attiva su Gemini (stima 5%, p1, worktree `t45d`). T70 (integrazione più piani T53b e salto T56b) è sospeso per limite crediti su Claude.

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T79 e T45b integrati nel base `3d`**: T79 ha integrato T45b su Gemini rinumerando l'ADR in 0085, preservando le integrazioni precedenti (Stripe ADR-0083, eredità cloni ADR-0084). Superati 26/26 test e typecheck. Eseguito `integra T79` e `integra T45b`, worktree e branch rimossi.
  - **T45d (la lobby) approvato e assegnato a Gemini**: per non attendere il reset di Claude delle 17:00 UTC e dare continuità alla priorità multigiocatore, T45d è assegnato a Gemini (stima 5%, priorità 1, approvato).
  - **Suite di test verdi nel base**: test mirati `tests/heritage.test.ts`, `tests/session.test.ts`, `tests/coefficients.test.ts`, `tests/account.test.ts`, `tests/stripe.test.ts`, `tests/credits.test.ts` (35/35 passati) e `npm run typecheck` a 0 errori in `3d`.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Esecuzione ed esito di T45d** (gemini, p1) nel worktree `t45d` (la lobby: crediti, coefficienti/modelli, collezione carte fuori partita).
  2. **Reset crediti Claude** (alle 16:59 UTC / ~18:00 locali): ripresa di T70 (integrazione T53b più piani con salto T56b).
  3. **Chiavi di test Stripe** dall'autore per la verifica finale nel browser di T45e.
- **Intenzioni / prossimi passi**:
  1. Monitorare l'avanzamento di T45d su Gemini.
  2. Al termine di T45d: integrare nel base `3d`, sbloccare T45f (server su Google Cloud), preparare task di verifica browser a due schede per Claude dopo il reset.
  3. Al reset di Claude: chiudere T70 (`integra T70` e `integra T53b`).

## Task attivi e in corso

- **Pronti / In corso**:
  - **T45d** (gemini, 5%, p1, approvato): in esecuzione attiva nel worktree t45d. La lobby: tetto crediti, coefficienti/modelli dell'universo, minimi, esaurimento crediti in partita, collezione carte.
  - **T70** (claude, p0): worktree t70 in merge; agente fermo per limite 5h (reset 16:59 UTC).
- **Completati e integrati nel base `3d`**:
  - **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Completati in attesa di integrazione**:
  - **T53b** (claude): in attesa di T70.
- **In attesa di chiavi/verifica browser**:
  - **T45e**: codice e test integrati, in attesa credenziali test Stripe per prova interattiva browser.
- **In coda / Bloccati**:
  - **T45f** (server su Google Cloud, attende T45d).
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Claude**: 5h al 0 %, settimana al 55 % (fermo fino alle 16:59 UTC / ~18:00 locali, orchestratore su Gemini).
  - **Gemini**: 5h all'86 %, settimana al 50 % (orchestratore attuale e agente attivo su T45d).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
