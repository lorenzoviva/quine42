# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 31/10/2026 alle 11:20 UTC, epoca 169 su **claude**. T93 e **T52b** (cantine nei modelli) integrati. **T54 fatto** (taglie D&D) ma `integra` va in conflitto (AGENTS.md, README ADR, backlog, kernel.ts, validator.ts; ADR-0081 già preso): approvato **T94** «Integrare T54» su Claude (priorità 8, prima di T93). Multigiocatore: T45f aspetta risposte GCP (`docs/pipeline/domande/T45f.md`). T88 da approvare; T89 approvato (Claude, priorità 100).

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
  - **T92 e T52 integrati nel base `3d`**: task/T92 ha risolto i conflitti con task/T52, rinumerato l'ADR in ADR-0091, aggiornato `AGENTS.md`, `README.md` e `backlog.md` (T52a fatto, T52b-f definiti). Eseguiti `integra T92` e `integra T52`, worktree e branch rimossi, typecheck e test pipeline verdi.
  - **T54 fatto**, da integrare tramite **T94** (conflitti; ADR da rinumerare in ADR-0092). Suite intera con 33 timeout di carico: T94 la rilancia col turno test.
  - **T45d integrato nel base `3d` (ADR-0086)**: requisiti minimi, tetto crediti, modale esaurimento, lobby multigiocatore e collezione carte integrati.
  - **T45f sbloccato e preparato**: dipendeva da T44b e T45d, ora entrambi integrati. Aperte le domande su GCP Project ID, hosting e regione in `docs/pipeline/domande/T45f.md`.
  - **T45e completato e chiavi Stripe fornite**: l'autore ha risposto in `docs/pipeline/domande/T45e.md` inserendo le credenziali di test in `.env` e impostando il listener locale su `localhost:5173/api/stripe/webhook`. T45e segnato `fatto` e approvato **T93** per la verifica nel browser su Claude (priorità 9).
- **Cosa si aspetta**:
  1. **T94** (integrare T54). T93 fatto e integrato (ricarica Stripe di prova verificata nel browser).
  2. Proposto **T95** (test explore/partita/subscription rossi anche da soli): aspetta l'approvazione dell'autore.
  2. **Risposte dell'autore per T45f** (`docs/pipeline/domande/T45f.md`).
- **Intenzioni / prossimi passi**:
  1. Al ripristino di Claude, seguire l'avanzamento di T54 e l'esecuzione di T93 (verifica browser Stripe).
  2. Seguire poi T51 e T89 in coda. Nota: un «dipende da Txx» verso un task fatto solo nel suo branch blocca il task (T94 era fermo per questo).
  3. Ricevute le risposte su T45f, riprendere il deploy del multigiocatore su GCP.

## Task attivi e in corso

- **Pronti / In corso**:
  - **T94** approvato su Claude (integrare T54, priorità 8).
  - **T51** approvato su Claude (in coda dopo T52b, priorità 100).
- **Completati e integrati nel base `3d`**:
  - **T52b**, **T93**, **T92**, **T52**, **T86**, **T85**, **T91**, **T84**, **T83**, **T90**, **T82**, **T87**, **T81**, **T70**, **T53b**, **T80**, **T45d**, **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Da integrare**:
  - Nessuno.
- **In attesa di chiavi/risposte**:
  - **T45f**: sbloccato, in attesa di GCP Project ID e scelte di deploy (`docs/pipeline/domande/T45f.md`).
- **In coda / Bloccati**:
  - **T88** (in coda da approvare); **T89** approvato, in coda su Claude.
  - **T57** (rune come codice, bloccato da T51a).
- **Crediti**:
  - **Claude**: 5h all' 87 % (reset 08:00 UTC), settimana al 40 %.
  - **Gemini**: 5h al 94 %, settimana al 27 %.
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto fatto e integrato), T54 (in corso su Claude).
- **Verifiche nel browser** (un task di verifica alla volta su `claude`, che ha `--chrome`): T45d (lobby multigiocatore), T64 (varianti in cache circuito-3D), T56b (arco salto e ombra), T69 (interfaccia web), T68c (stato provider coda abbonamenti).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con più agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
