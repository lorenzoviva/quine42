# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 31/10/2026 alle 00:31 UTC, epoca 164 su **gemini** (subentrato: claude sotto il 10 %). **T52 completato** (progetto sotterranei), `integra T52` in conflitto su ADR (0081 occupato da crediti, ora ADR-0091), AGENTS e backlog: creato **T92** (integrazione T52 su Gemini, p0, stima 1%). **T54** in corso su Claude (riprende le taglie di creature e strutture). **T51** (T51b automa cellulare) approvato dall'autore su Claude, in coda. Multigiocatore fermo (T45f aspetta risposte GCP, T45e aspetta chiavi test Stripe). T88, T89 non approvati.

## Regole nuove dell'autore (30/10, chat: `docs/userchats/to-do-2026-10-30.md`)

- **Un solo task per provider alla volta** (finché T82 non mette i tetti per provider in `config.json`: approvare a mano al più un task per provider). I tetti li decide l'autore; l'orchestratore non li alza senza sua istruzione.
- Obiettivi: niente parallelismo che aumenta il lavoro; a 0 % uno o zero task sul provider; finire i crediti entro il reset settimanale (non prima); distribuire i task pesanti nel tempo; tenere un margine per le urgenze dell'autore; i crediti avanzati andranno alla generazione con gli abbonamenti (T88, non ora).
- Al più **una verifica nel browser** alla volta. Risposte brevi.
- Catena delle correzioni della pipeline su Claude dopo T70: T82 → T83 → T84 → T85 → T86; su Gemini T81 (pagina web rotta) → T87 (browser di agy). T51 e T89 da approvare quando Claude è libero. T45b fermato (era già integrato e ripartiva per errore).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Decisioni prese e fatti recenti**:
  - **T52 completato su Claude**: progetto dei sotterranei (ADR-0081 originario, da rinumerare in ADR-0091; AGENTS.md; T52 spezzato in T52b-f). Typecheck verde. Tentativo di integrazione automatica in conflitto su `AGENTS.md`, `docs/adr/README.md` e `docs/plans/backlog.md`.
  - **Creato T92 su Gemini**: task di integrazione per fondere `task/T52` nel base `3d`, rinumerare ADR-0081 in ADR-0091, aggiornare `AGENTS.md` e `README.md`, e incorporare i sotto-task T52b-f nel backlog.
  - **T54 in corso su Claude**: ripreso nel suo worktree per completare le taglie D&D e la Fucina.
  - **T45d integrato nel base `3d` (ADR-0086)**: requisiti minimi, tetto crediti, modale esaurimento, lobby multigiocatore e collezione carte integrati.
  - **T45f sbloccato e preparato**: dipendeva da T44b e T45d, ora entrambi integrati. Aperte le domande su GCP Project ID, hosting e regione in `docs/pipeline/domande/T45f.md`.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Esecuzione e integrazione di T92** su Gemini per chiudere e rimuovere `task/T52`.
  2. **Completamento di T54** su Claude (o avanzamento prima/dopo il reset delle 03:00 UTC).
  3. **Risposte dell'autore per T45f** e chiavi di test Stripe per T45e.
- **Intenzioni / prossimi passi**:
  1. Integrare T92 appena terminato ed eseguire `integra T52`.
  2. Ricevute le risposte su T45f e le chiavi Stripe per T45e, riprendere il multigiocatore.

## Task attivi e in corso

- **Pronti / In corso**:
  - **T54** in corso su Claude (taglie creature e strutture).
  - **T92** pronto e approvato su Gemini (integrazione T52 nel base `3d`).
  - **T51** approvato su Claude (in coda dopo T54, aspetta pazientemente su Claude come confermato dall'autore).
- **Completati e integrati nel base `3d`**:
  - **T86**, **T85**, **T91**, **T84**, **T83**, **T90**, **T82**, **T87**, **T81**, **T70**, **T53b**, **T80**, **T45d**, **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Da integrare**:
  - **T52** (i sotterranei, gestito da T92).
- **In attesa di chiavi/risposte/verifica browser**:
  - **T45f**: sbloccato, in attesa di GCP Project ID e scelte di deploy (`docs/pipeline/domande/T45f.md`).
  - **T45e**: codice e test integrati, in attesa credenziali test Stripe per prova interattiva browser.
- **In coda / Bloccati**:
  - **T57** (rune come codice, bloccato da T51a).
- **Crediti**:
  - **Claude**: 5h al 9 % (sotto soglia 10 %, reset alle 03:00 UTC), settimana al 41 %.
  - **Gemini**: 5h al 100 %, settimana al 29 % (orchestratore + T92).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei fatto, in integrazione con T92), T54 (in corso su Claude).
- **Verifiche nel browser** (un task di verifica alla volta su `claude`, che ha `--chrome`): T45d (lobby multigiocatore), T64 (varianti in cache circuito-3D), T56b (arco salto e ombra), T69 (interfaccia web), T68c (stato provider coda abbonamenti), T45e (ricarica Stripe).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con più agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
