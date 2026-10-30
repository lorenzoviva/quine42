# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle ~12:01 UTC (~13:01 locali), epoca 70 su claude (orchestratore tornato a claude dopo il reset; claude 5h e settimana al 61 %; gemini 5h al 65 %, settimana 56 %; argon fermo fino al 04/11).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **Reset Claude avvenuto alle 12:00 UTC**: Claude ha di nuovo crediti (sessione 5h al 61%, settimana 61%); l'orchestratore torna a Claude come da configurazione.
  - **T77 completato con successo su Gemini e integrato nel base `3d`**: risolto il conflitto di merge tra `task/T45e` e il base `3d`, preservando account/crediti e Stripe Checkout.
  - **T45e integrato nel base `3d`**: ricarica crediti con Stripe Checkout (supporto carte e Google Pay), webhook idempotente crittografico HMAC-SHA256, salvataggio in `world/pagamenti.json`, esclusione anonimi, bottoni di ricarica rapida nel profilo (`P`), ADR-0083. Worktree e branch di T45e e T77 rimossi.
  - **Suite di test verdi nel base**: test mirati `tests/stripe.test.ts`, `tests/account.test.ts`, `tests/credits.test.ts`, `tests/session.test.ts` (21/21) e `npm run typecheck` completamente verdi in `3d`.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Chiavi di test Stripe** dall'autore in `.env` o in chat per la verifica finale nel browser di T45e.
  2. **Completamento di T70** (claude, p0): ripresa della sessione preservata per integrare T53b (strutture a più piani) con T56b (salto).
  3. **Avanzamento multigiocatore**: T45b (coefficienti e Low Detail) e T45c (eredità cloni) su Claude, per sbloccare T45d (lobby).
- **Intenzioni / prossimi passi**:
  1. Claude riprende ed esegue **T70** (p0): risoluzione conflitti e test, poi `integra T70` e `integra T53b`.
  2. Avanzare con **T45b** (p6) e **T45c** (p7) per completare la catena multigiocatore.
  3. Ricevute le chiavi Stripe: eseguire verifica nel browser per T45e.
  4. Mantenere priorità assoluta alla catena multigiocatore (T52 e T54 p50 restano in attesa).

## Task attivi e in corso

- **Pronti / In corso**:
  - **T70** (claude, p0, sessione preservata): ripreso alle 12:00 UTC nel worktree t70.
  - **T45b** (claude, p6) e **T45c** (claude, p7): rimessi in coda alle 12:01 UTC (ripartono da capo), priorità multigiocatore.
- **Completati e integrati nel base `3d`**:
  - **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Completati in attesa di integrazione**:
  - **T53b** (claude): in attesa di T70.
- **In attesa di chiavi/verifica browser**:
  - **T45e**: codice e test integrati, in attesa credenziali test Stripe per prova interattiva browser.
- **Sbloccati / In coda**:
  - **T45d** (lobby, attende T45b).
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Claude**: 5h al 61 %, settimana al 61 % (reset avvenuto, torna orchestratore).
  - **Gemini**: 5h al 65 %, settimana al 56 %.
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
