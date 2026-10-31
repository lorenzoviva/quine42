# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 31/10/2026 alle 02:01 UTC, epoca 167 su **gemini**. **T45e completato e integrato nel base `3d`**; l'autore ha aggiornato `.env` e configurato il listener locale del webhook su `localhost:5173/api/stripe/webhook` (porta dev standard); approvato **T93** su Claude (priorità 9) per la verifica browser. **T92 e T52 integrati nel base `3d`** (ADR-0091). **T54** su Claude ha raggiunto il limite 5h (0%), riprende dopo le 02:59 UTC. Multigiocatore: T45f aspetta risposte GCP (`docs/pipeline/domande/T45f.md`). T88, T89 in coda da approvare.

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
  - **T54 in corso su Claude**: in attesa reset limite 5h (alle 02:59 UTC) per completare le taglie D&D e la Fucina.
  - **T45d integrato nel base `3d` (ADR-0086)**: requisiti minimi, tetto crediti, modale esaurimento, lobby multigiocatore e collezione carte integrati.
  - **T45f sbloccato e preparato**: dipendeva da T44b e T45d, ora entrambi integrati. Aperte le domande su GCP Project ID, hosting e regione in `docs/pipeline/domande/T45f.md`.
  - **T45e completato e chiavi Stripe fornite**: l'autore ha risposto in `docs/pipeline/domande/T45e.md` inserendo le credenziali di test in `.env` e impostando il listener locale su `localhost:5173/api/stripe/webhook`. T45e segnato `fatto` e approvato **T93** per la verifica nel browser su Claude (priorità 9).
- **Cosa si aspetta**:
  1. **Reset limite 5h di Claude** (02:59 UTC) per completare T54 e lanciare la verifica browser T93.
  2. **Risposte dell'autore per T45f** (`docs/pipeline/domande/T45f.md`).
- **Intenzioni / prossimi passi**:
  1. Al ripristino di Claude, seguire l'avanzamento di T54 e l'esecuzione di T93 (verifica browser Stripe).
  2. Seguire poi T52b e T51 in coda.
  3. Ricevute le risposte su T45f, riprendere il deploy del multigiocatore su GCP.

## Task attivi e in corso

- **Pronti / In corso**:
  - **T54** in corso su Claude (limite 5h raggiunto a 0%, riprende dopo le 02:59 UTC).
  - **T93** approvato su Claude (verifica browser Stripe, in testa ai pronti con priorità 9).
  - **T52b** pronto su Claude (in coda dopo T93, priorità 50).
  - **T51** approvato su Claude (in coda dopo T52b, priorità 100).
- **Completati e integrati nel base `3d`**:
  - **T92**, **T52**, **T86**, **T85**, **T91**, **T84**, **T83**, **T90**, **T82**, **T87**, **T81**, **T70**, **T53b**, **T80**, **T45d**, **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Da integrare**:
  - Nessuno.
- **In attesa di chiavi/risposte**:
  - **T45f**: sbloccato, in attesa di GCP Project ID e scelte di deploy (`docs/pipeline/domande/T45f.md`).
- **In coda / Bloccati**:
  - **T88**, **T89** (in coda da approvare).
  - **T57** (rune come codice, bloccato da T51a).
- **Crediti**:
  - **Claude**: 5h al 0 % (reset alle 02:59 UTC / 03:01 UTC), settimana al 41 % (9% per Claude and GPT models).
  - **Gemini**: 5h al 96 %, settimana al 28 %.
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Pianificate le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto fatto e integrato), T54 (in corso su Claude).
- **Verifiche nel browser** (un task di verifica alla volta su `claude`, che ha `--chrome`): T45d (lobby multigiocatore), T64 (varianti in cache circuito-3D), T56b (arco salto e ombra), T69 (interfaccia web), T68c (stato provider coda abbonamenti), T93 (ricarica Stripe T45e).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con più agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
