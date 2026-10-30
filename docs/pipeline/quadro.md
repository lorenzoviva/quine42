# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026 alle 17:47 UTC, fine epoca 152 su **gemini** (rotazione per contesto; claude al limite 5h: 1 %, reset 22:00 UTC). **Ordine dell'autore: finire i task sulla pipeline (T82-T87 e la catena T83-T86), poi nessun task nuovo; quando finiscono i task in corso, dirgli che può chiudere con Ctrl-C.** Tolta l'approvazione a T52, T54, T57 perché non partano. T70, T53b, T81, T87, T82 e T90 integrati. In corso: T83 su Claude (turni per operazioni pesanti); se si ferma per il limite delle 5 ore riprende dopo le 22:00 UTC. Poi la catena T84 → T85 → T86. T51/T89 non approvati. Gemini libero, nessun task nuovo assegnato.

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
  - **T80 completato su Gemini e integrato nel base `3d`**: T80 ha unito `task/T45d` risolvendo il conflitto in `docs/plans/backlog.md`, preservando lo stato `fatto` e l'esito di T45d e mantenendo intatti i blocchi T75-T79. Suite `tests/lobby.test.ts`, `tests/credits.test.ts`, `tests/coefficients.test.ts` (18/18) superata e typecheck a 0 errori. Eseguiti `integra T80` e `integra T45d`, worktree e branch rimossi.
  - **T45d integrato nel base `3d` (ADR-0086)**: implementati requisiti minimi `ai.minimi`, tetto crediti con incremento budget in `credits.ts`, evento e modale a 3 scelte a crediti esauriti (`CreditExhaustedModal`), schermata lobby multigiocatore (`LobbyScreen`) e collezione carte con contatori di utilizzo.
  - **T45f sbloccato e preparato**: dipendeva da T44b e T45d, ora entrambi integrati. Aperte le domande su GCP Project ID, architettura di hosting (Cloud Run vs VM GCE) e regione in `docs/pipeline/domande/T45f.md`.
  - **Chiavi Stripe per test nel browser**: T45e resta segnato `in attesa` per la verifica browser (in attesa di `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env` o in chat, segnalate in `docs/pipeline/domande/T45e.md`).
- **Cosa si aspetta**:
  1. **Completamento di T83** su Claude (turni su disco operazioni pesanti). Se Claude tocca il limite 5h, riprenderà dopo le 22:00 UTC.
  2. **Esecuzione e integrazione di T84, T85, T86** su Claude uno alla volta.
  3. **Risposte dell'autore per T45f** e chiavi di test Stripe per T45e (per quando riprenderanno i task normali).
- **Intenzioni / prossimi passi**:
  0. Integrare la catena T83 → T84 → T85 → T86 man mano che finiscono. Finito T86 (ultimo task di correzione della pipeline), NON approvare nulla e comunicare all'autore che può chiudere con Ctrl-C.
  1. Ricevute le risposte su T45f e le chiavi Stripe per T45e, riprendere il multigiocatore nelle prossime sessioni.

## Task attivi e in corso

- **Pronti / In corso**:
  - **T83** (claude) in corso (turni per operazioni pesanti), poi la catena T84 → T85 → T86.
  - **T52** risulta "in corso" nello stato ma è interrotto nel dossier.
- **Da guardare (non integrare)**: **T54** finito con errore (codice 1), non approvato.
- **Completati e integrati nel base `3d`**:
  - **T90**, **T82**, **T87**, **T81**, **T70**, **T53b**, **T80**, **T45d**, **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **In attesa di chiavi/risposte/verifica browser**:
  - **T45f**: sbloccato, in attesa di GCP Project ID e scelte di deploy (`docs/pipeline/domande/T45f.md`).
  - **T45e**: codice e test integrati, in attesa credenziali test Stripe per prova interattiva browser.
- **In coda / Bloccati**:
  - **T51** (livello mare e motore acqua, p50).
  - **T52** e **T54** (p50): interrotti per dare precedenza al multigiocatore.
  - **T57** (rune come codice, bloccato da T51a).
  - **T84**, **T85**, **T86** (bloccati a cascata da T83).
- **Crediti**:
  - **Claude**: 5h all'1 % (reset 22:00 UTC), settimana al 49 % (sta eseguendo T83).
  - **Gemini**: 5h al 18 %, settimana al 31 % (orchestratore attuale).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e tre approvati, priorità 50, dietro il multigiocatore.
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T45d (la lobby multigiocatore, selezione tetto e modale crediti esauriti), T64 (le varianti in cache di `circuito-3D` sugli scaffali della corona), T56b (l'arco del salto e l'ombra), T69 (interfaccia web della pipeline: vista browser), T68c (stato provider e coda abbonamenti in `#models` e pannello del Concilio), T45e (ricarica di prova Stripe con chiavi di test).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con tre agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
