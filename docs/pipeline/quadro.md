# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle ~09:50 UTC, epoca 58 (gemini orchestratore: claude al 0 % della sessione 5h, reset 11:59 UTC / ~13:00 locali; settimana 61 %; gemini 5h al 75 %, settimana 58 %; argon fermo fino al 04/11).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T76, T75 e T44b integrati con successo in `3d`**: dipendenze npm Firebase installate, typecheck e test account/credits/session (15/15) verdi nel branch base.
  - **T45e approvato e avviato su Gemini**: approvate le specifiche di ricarica Stripe (Checkout/Google Pay di prova, webhook server idempotente, anonimi esclusi). Poiché Claude è fermo per limite 5h e Argon è bloccato, la pipeline ha instradato T45e su Gemini (Antigravity), dove è attualmente in corso nel worktree `t45e`.
  - **T70 sospeso in modo pulito in attesa del reset di Claude**: Claude ha raggiunto il limite 5h alle 10:17 («resets 1pm / 12:00 UTC»). Il task è stato interrotto e rimesso in coda (`interrompi T70` e `riprendi T70`), preservando la sessione; riprenderà automaticamente al reset delle 12:00 UTC.
- **Cosa si aspetta**:
  1. **T45e** in corso su Gemini (pagamenti Stripe): completamento dell'implementazione e dei test con webhook finto.
  2. **Reset crediti Claude** alle ~12:00 UTC (13:00 locali): ripresa automatica di **T70** (integrazione T53b e salto T56b), poi avanzamento di **T45b** (coefficienti e Low Detail, sbloccando T45d lobby) e **T45c** (eredità cloni).
- **Intenzioni / prossimi passi**:
  1. All'esito positivo di T45e: verifica ed eventuale `integra T45e`.
  2. Al reset di Claude (12:00 UTC): completare T70, eseguire `integra T70` e `integra T53b`.
  3. Mantenere priorità assoluta alla catena multigiocatore: T52 e T54 (p50) restano in attesa che la coda multigiocatore si svuoti.

## Task attivi e in corso

- **In corso**:
  - **T45e** (gemini, p9, worktree `t45e`, pid 11792): pagamenti Stripe Checkout e webhook server.
  - **T70** (claude, p0, sessione preservata): sospeso per limite 5h Claude, riprenderà alle 12:00 UTC.
  - **T45b** (claude, p6) e **T45c** (claude, p7): priorità multigiocatore (in attesa reset crediti Claude).
- **Completati e integrati nel base `3d`**:
  - **T76**, **T75**, **T44b**, **T44c**.
- **Completati in attesa di integrazione**:
  - **T53b** (claude): in attesa di T70.
- **Sbloccati / In coda**:
  - **T45d** (lobby, attende T45b).
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
- **Crediti**:
  - **Gemini**: 5h al 75 %, settimana al 58 % (orchestratore e T45e).
  - **Claude**: 5h a 0 %, settimana al 61 % (reset 11:59 UTC / ~13:00 locali).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
