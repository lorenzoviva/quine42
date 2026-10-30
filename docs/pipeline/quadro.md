# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle 13:10 UTC, avvio epoca 72 su gemini: **claude sotto il 10 %** (sessione 5h al 9 %, settimana 55 %), l'orchestratore prosegue su gemini (gemini 5h al 65 %, settimana 56 %; argon fermo fino al 04/11). I task claude avviati prima del limite (T78 p0, T70 p0, T45b p6) sono attivi e in esecuzione nei rispettivi worktree. T78 sta integrando T45c e rinumerando l'ADR in 0084; se uno dei task claude si arresta per limiti di crediti, T78 sarà riassegnato immediatamente a gemini (merge + test, ~2 %). Inoltre T45b ha predisposto bozza ADR (da rinumerare a 0085 in integrazione).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **Claude sceso sotto il 10 % sulle 5h (9 %)**: orchestratore ruotato su Gemini (epoca 71).
  - **T45c completato con successo**: quote di eredità per i cloni implementate con catena `origini` e MinHash; ADR in conflitto temporaneo con 0081.
  - **Creato T78 (p0) per integrare T45c nel base 3d**: merge, risoluzione conflitti, rinumerazione ADR a 0084 e verifica individuale dei test in timeout.
  - **T45e integrato nel base `3d`**: ricarica crediti con Stripe Checkout, webhook idempotente crittografico HMAC-SHA256, salvataggio in `world/pagamenti.json`, esclusione anonimi, bottoni ricarica rapida nel profilo (`P`), ADR-0083.
  - **Suite di test verdi nel base**: test mirati `tests/stripe.test.ts`, `tests/account.test.ts`, `tests/credits.test.ts`, `tests/session.test.ts` (21/21) e `npm run typecheck` a 0 errori in `3d`.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Esito di T78** (claude, p0): completamento del merge di T45c e rinumerazione ADR 0084; se Claude si arresta per crediti, riassegnazione immediata a Gemini.
  2. **Esito di T70** (claude, p0): integrazione T53b (strutture a più piani) con T56b (salto).
  3. **Esito di T45b** (claude, p6): coefficienti di generazione e partita Low Detail (ADR da rinumerare a 0085 per sbloccare T45d).
  4. **Chiavi di test Stripe** dall'autore per la verifica finale nel browser di T45e.
- **Intenzioni / prossimi passi**:
  1. Appena T78 finisce: `integra T78` e `integra T45c` nel base.
  2. Appena T70 finisce: `integra T70` e `integra T53b` nel base.
  3. Se Claude si ferma per limite crediti 5h su T78: `assegna T78 gemini 2% 0 --approva` per completare il merge su Gemini.
  4. Appena T45b finisce: rinumerare ADR in 0085 e integrare nel base per sbloccare T45d (lobby).
  5. Mantenere priorità assoluta alla catena multigiocatore (T52 e T54 p50 restano in attesa).

## Task attivi e in corso

- **Pronti / In corso**:
  - **T78** (claude, p0): in esecuzione nel worktree t78. Sta eseguendo merge di `task/T45c`, rinumerando l'ADR in 0084 e testando i file indicati. Monitorato da vicino per riassegnazione a Gemini se Claude si ferma.
  - **T70** (claude, p0): in esecuzione nel worktree t70 (integrazione T53b più piani con salto T56b).
  - **T45b** (claude, p6): in esecuzione nel worktree t45b (coefficienti e Low Detail). Attenzione: ha creato bozza ADR-0081 che andrà rinumerata a 0085.
  - **T45c** (claude): completato con successo (quote di eredità per clone); in attesa dell'integrazione da parte di T78.
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
  - **Claude**: 5h al 9 %, settimana al 55 % (sotto il 10 %, orchestratore su Gemini).
  - **Gemini**: 5h al 65 %, settimana al 56 % (orchestratore attuale).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
