# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle 13:25 UTC, avvio epoca 74 su gemini: **claude ha esaurito il limite di 5 ore (0 %)** (reset 16:59 UTC / ~18:00 locali, settimana 55 %), l'orchestratore prosegue su gemini (gemini 5h al 60 %, settimana 55 %; argon fermo fino al 04/11). **T78** (integrazione T45c ed eredità cloni) è in corso avanzato su Gemini nel worktree t78: merge completato, ADR rinumerato in 0084, typecheck e test mirati (23/23) superati, verifica dei test in timeout in corso. T45b ha il commit pronto (`bc77bd9`) con bozza ADR-0081 (da rinumerare a 0085). T70 (integrazione più piani T53b e salto T56b) è sospeso per limite crediti su Claude.

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **Claude sceso a 0 % sulle 5h**: limite raggiunto alle 13:13 UTC (reset 16:59 UTC).
  - **T78 riassegnato a Gemini**: Claude si è interrotto per quota 429 durante T78; T78 è stato riassegnato a Gemini (stima 2 %, p0, approvato), worktree `t78` pulito a HEAD e lanciato su Gemini alle 13:16 UTC.
  - **T45c completato con successo**: quote di eredità per i cloni implementate con catena `origini` e MinHash; in attesa dell'integrazione di T78.
  - **T45b predisposto con commit**: implementati i coefficienti di generazione e la partita Low Detail (`bc77bd9`); ADR-0081 in conflitto temporaneo (sarà rinumerato a 0085 durante l'integrazione).
  - **T45e integrato nel base `3d`**: ricarica crediti con Stripe Checkout, webhook idempotente crittografico HMAC-SHA256, salvataggio in `world/pagamenti.json`, esclusione anonimi, bottoni ricarica rapida nel profilo (`P`), ADR-0083.
  - **Suite di test verdi nel base**: test mirati `tests/stripe.test.ts`, `tests/account.test.ts`, `tests/credits.test.ts`, `tests/session.test.ts` (21/21) e `npm run typecheck` a 0 errori in `3d`.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Esito di T78** (gemini, p0): commit finale in `task/T78` con test superati e merge di T45c con ADR-0084.
  2. **Reset crediti Claude** (alle 16:59 UTC / ~18:00 locali): ripresa di T70 (integrazione T53b più piani con salto T56b) e finalizzazione T45b (oppure integrazione di T45b via Gemini/task dedicato per non attendere le 18:00).
  3. **Chiavi di test Stripe** dall'autore per la verifica finale nel browser di T45e.
- **Intenzioni / prossimi passi**:
  1. Appena T78 finisce: `integra T78` e `integra T45c` nel base.
  2. Per T45b: commit `bc77bd9` già presente in `task/T45b`; valutare task di integrazione (T79) su Gemini per rinumerare ADR a 0085 e integrare subito nel base, sbloccando T45d senza aspettare il reset di Claude alle 18:00.
  3. Al reset di Claude o quando riprende: chiudere T70 (`integra T70` e `integra T53b`).
  4. Mantenere priorità assoluta alla catena multigiocatore (T52 e T54 p50 restano in attesa).

## Task attivi e in corso

- **Pronti / In corso**:
  - **T78** (gemini, p0): in esecuzione attiva su Gemini nel worktree t78. Esegue merge di `task/T45c`, rinumerando l'ADR in 0084; typecheck e suite mirata (23/23) superati, verifica dei test in timeout in corso.
  - **T45b** (claude, p6): commit completato `bc77bd9` nel worktree t45b (coefficienti e Low Detail); agente fermo per limite 5h.
  - **T70** (claude, p0): worktree t70 in merge; agente fermo per limite 5h (reset 16:59 UTC).
  - **T45c** (claude): completato con successo (quote di eredità per clone); in fase di integrazione da parte di T78.
- **Completati e integrati nel base `3d`**:
  - **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Completati in attesa di integrazione**:
  - **T53b** (claude): in attesa di T70.
  - **T45c** (claude): in attesa di T78.
- **In attesa di chiavi/verifica browser**:
  - **T45e**: codice e test integrati, in attesa credenziali test Stripe per prova interattiva browser.
- **Sbloccati / In coda**:
  - **T45d** (lobby, attende T45b).
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Claude**: 5h al 0 %, settimana al 55 % (fermo fino alle 16:59 UTC, orchestratore su Gemini).
  - **Gemini**: 5h al 60 %, settimana al 55 % (orchestratore attuale).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
