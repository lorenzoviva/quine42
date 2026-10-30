# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle 13:49 UTC, rotazione epoca 81 su gemini: **claude ha esaurito il limite di 5 ore (0 %)** (reset 16:59 UTC / ~18:00 locali, settimana 55 %), l'orchestratore prosegue su gemini (gemini 5h al 91 %, settimana 52 %; argon fermo fino al 04/11). **T78** e **T45c** (eredità dei cloni, ADR-0084) sono stati integrati con successo nel base `3d` (worktree e branch rimossi). **T79** è in esecuzione attiva su Gemini (p0, worktree `t79`, PID attivo) per integrare **T45b** (coefficienti e Low Detail, commit `bc77bd9`) con rinumerazione ADR a 0085 per sbloccare la lobby (**T45d**) senza attendere il reset di Claude. T70 (integrazione più piani T53b e salto T56b) è sospeso per limite crediti su Claude.

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T78 e T45c integrati nel base `3d`**: T78 ha completato l'integrazione di T45c con ADR-0084, superando test e typecheck. Eseguito `integra T78` e `integra T45c`; worktree e branch rimossi.
  - **Avviato T79 per integrare T45b**: per non attendere il reset di Claude delle 17:00 UTC, T79 integra il commit `bc77bd9` di T45b su Gemini (stima 2%, p0, approvato), rinumerando ADR-0081 in ADR-0085 e preservando le integrazioni precedenti (Stripe ADR-0083, eredità cloni ADR-0084). T79 è attualmente in esecuzione nel worktree `t79`.
  - **T45e integrato nel base `3d`**: ricarica crediti con Stripe Checkout, webhook idempotente crittografico HMAC-SHA256, salvataggio in `world/pagamenti.json`, esclusione anonimi, bottoni ricarica rapida nel profilo (`P`), ADR-0083.
  - **Suite di test verdi nel base**: test mirati `tests/stripe.test.ts`, `tests/account.test.ts`, `tests/credits.test.ts`, `tests/session.test.ts`, `tests/heritage.test.ts`, `tests/clone.test.ts`, `tests/cards.test.ts` e `npm run typecheck` a 0 errori in `3d`.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Esecuzione ed esito di T79** (gemini, p0): commit finale in `task/T79` con test superati e merge di T45b con ADR-0085.
  2. **Sblocco di T45d (lobby)**: appena T79 e T45b entrano nel base `3d`, T45d diventa sbloccato.
  3. **Reset crediti Claude** (alle 16:59 UTC / ~18:00 locali): ripresa di T70 (integrazione T53b più piani con salto T56b).
  4. **Chiavi di test Stripe** dall'autore per la verifica finale nel browser di T45e.
- **Intenzioni / prossimi passi**:
  1. Attendere completamento di T79 su Gemini.
  2. Appena T79 finisce: `integra T79` e `integra T45b` nel base `3d`.
  3. Assegnare e avviare T45d (lobby) non appena sbloccato.
  4. Al reset di Claude: chiudere T70 (`integra T70` e `integra T53b`).
  5. Mantenere priorità assoluta alla catena multigiocatore (T52 e T54 p50 restano in attesa).

## Task attivi e in corso

- **Pronti / In corso**:
  - **T79** (gemini, p0): in esecuzione attiva nel worktree t79. Integrazione T45b, rinumerazione ADR a 0085.
  - **T45b** (claude, p6): commit completato `bc77bd9` nel worktree t45b (coefficienti e Low Detail); in integrazione tramite T79.
  - **T70** (claude, p0): worktree t70 in merge; agente fermo per limite 5h (reset 16:59 UTC).
- **Completati e integrati nel base `3d`**:
  - **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Completati in attesa di integrazione**:
  - **T53b** (claude): in attesa di T70.
- **In attesa di chiavi/verifica browser**:
  - **T45e**: codice e test integrati, in attesa credenziali test Stripe per prova interattiva browser.
- **Sbloccati / In coda**:
  - **T45d** (lobby, attende T45b/T79).
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Claude**: 5h al 0 %, settimana al 55 % (fermo fino alle 16:59 UTC / ~18:00 locali, orchestratore su Gemini).
  - **Gemini**: 5h al 91 %, settimana al 52 % (orchestratore attuale).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
