# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle ~09:58 UTC, epoca 60 (gemini orchestratore: claude al 0 % della sessione 5h, reset 12:00 UTC / ~13:00 locali; settimana 61 %; gemini 5h al 72 %, settimana 58 %; argon fermo fino al 04/11).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T76, T75 e T44b integrati con successo in `3d`**: dipendenze npm Firebase installate, typecheck e test account/credits/session (15/15) verdi nel branch base.
  - **T45e completato su Gemini**: implementata la ricarica crediti con Stripe Checkout (supporto carte e Google Pay), webhook idempotente con verifica crittografica HMAC-SHA256, memorizzazione in `world/pagamenti.json`, blocco degli utenti anonimi, pulsanti di ricarica rapida nel profilo (`P`), ADR-0083 e suite `tests/stripe.test.ts` (6/6) verde.
  - **T77 avviato per integrare T45e**: `integra T45e` ha riscontrato un conflitto in `docs/plans/backlog.md`; creato **T77** (`p0`, stima 1%, Gemini) per fondere `task/T45e` con il base `3d`, preservando account/crediti e Stripe Checkout con relativi test verdi.
  - **Chiavi Stripe per test nel browser**: registrata la domanda in `docs/pipeline/domande/T45e.md` per le credenziali di test Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, facoltativa `STRIPE_PUBLISHABLE_KEY`) necessarie alla prova interattiva nel browser.
  - **T70 sospeso in attesa del reset di Claude**: sessione preservata; riprenderà automaticamente alle 12:00 UTC (~13:00 locali) per completare l'integrazione di T53b con T56b.
- **Cosa si aspetta**:
  1. **T77** su Gemini: merge pulito di `task/T45e`, esecuzione test e integrazione nel base `3d`.
  2. **Chiavi di test Stripe** dall'autore in `.env` o in chat per la verifica finale nel browser.
  3. **Reset crediti Claude** alle ~12:00 UTC: ripresa automatica di **T70** (integrazione T53b e salto T56b), poi avanzamento di **T45b** (coefficienti e Low Detail, sbloccando T45d lobby) e **T45c** (eredità cloni).
- **Intenzioni / prossimi passi**:
  1. All'esito positivo di T77: eseguire `integra T77` e `integra T45e`.
  2. Ricevute le chiavi Stripe: eseguire verifica nel browser per T45e.
  3. Al reset di Claude (12:00 UTC): completare T70, eseguire `integra T70` e `integra T53b`.
  4. Mantenere priorità assoluta alla catena multigiocatore (T52 e T54 p50 restano in attesa).

## Task attivi e in corso

- **Pronti / In corso**:
  - **T77** (gemini, p0, pronto): integrazione di T45e (Stripe) nel base `3d`.
  - **T70** (claude, p0, sessione preservata): sospeso per limite 5h Claude, riprenderà alle 12:00 UTC.
  - **T45b** (claude, p6) e **T45c** (claude, p7): priorità multigiocatore (in attesa reset crediti Claude).
- **Completati in attesa di chiavi/verifica browser**:
  - **T45e** (gemini): codice e test completati, in attesa credenziali test Stripe.
- **Completati e integrati nel base `3d`**:
  - **T76**, **T75**, **T44b**, **T44c**.
- **Completati in attesa di integrazione**:
  - **T53b** (claude): in attesa di T70.
- **Sbloccati / In coda**:
  - **T45d** (lobby, attende T45b).
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Gemini**: 5h al 73 %, settimana al 58 % (orchestratore e T77).
  - **Claude**: 5h a 0 %, settimana al 61 % (reset 12:00 UTC / ~13:00 locali).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
