# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 31/10/2026 alle 17:40 UTC, epoca 176 su **claude**. **T57a, T99, T97 (sito, ADR-0095), T100 integrati.** Task del sito rinumerati **T101-T106** (da approvare). I 5 difetti della pagina demo → **T107** su Gemini (approvato).

## Regole nuove dell'autore (30/10, chat: `docs/userchats/to-do-2026-10-30.md`)

- **31/10: mai zero slot per nessun modello** (T96); l'orchestratore decide ordine e sospensioni temporanee di un provider. Slot di Claude fissato a 1 a mano in `.pipeline/budget.json` (`slotAggiornato` al 05/11, così la previsione non lo riabbassa) finché **T96** (su Gemini, approvato) non mette `slotMinimi` in `config.json`. T51 ha la precedenza (priorità 50); T89 interrotto, da riprendere (`riprendi T89`) dopo T51.
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
  2. Proposto **T95** (test explore/partita/subscription rossi anche da soli): aspetta l'approvazione dell'autore.
  2. **Risposte dell'autore per T45f** (`docs/pipeline/domande/T45f.md`).
- **Intenzioni / prossimi passi**:
  1. Seguire T99 (poi integrare T57 con `integra T57` se T99 non lo toglie da solo, e T99), T98, T97; T57 riparte per T57b dopo T99 (T57c porterà l'effetto `rilievo`: oggi la terraformazione cambia solo il tipo di casella); per le sospensioni temporanee di un provider usare `sospendi/riattiva` (T96). Se T97 chiede dove mettere il template di Claude Design, proporre `docs/design/sito/`.
  2. Proporre all'autore stime e approvazione di T89a-e (cartone) e T95 (test rossi). Nota: un «dipende da Txx» verso un task fatto solo nel suo branch blocca il task.
  3. Ricevute le risposte su T45f, riprendere il deploy del multigiocatore su GCP.

## Task attivi e in corso

- **Pronti / In corso**:
  - Su Claude **T98** (40) → T57b (60). Su Gemini **T107**; T107 poi chiede una verifica nel browser (su Claude).
- **Completati e integrati nel base `3d`**:
  - **T96** (31/10 16:48), **T51b** (ADR-0094, integrato il 31/10 16:13), **T89**, **T94**, **T54**, **T52b**, **T93**, **T92**, **T52**, **T86**, **T85**, **T91**, **T84**, **T83**, **T90**, **T82**, **T87**, **T81**, **T70**, **T53b**, **T80**, **T45d**, **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Da integrare**:
  - Nessuno.
- **In attesa di chiavi/risposte**:
  - **T45f**: sbloccato, in attesa di GCP Project ID e scelte di deploy (`docs/pipeline/domande/T45f.md`).
- **In coda / Bloccati**:
  - **T88** e **T89a-e** (da approvare).
  - (T57 sbloccato e partito.)
- **Crediti**:
  - **Claude**: 5h al 77 % residuo (reset 20:29 UTC), settimana al 28 % residuo (reset 05/11).
  - **Gemini**: 5h rinnovate, settimana al 25 %.
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Nota**: T51b ripartito il 31/10 dopo che il processo era rimasto appeso sul limite 5h di Claude: se un task "in corso" ha il log vuoto e la conversazione finisce con `usage_limit_reached`, `interrompi` + `riprendi`. Attenzione a non committare con `-a`: l'autore ha modifiche locali sue (`src/kernel/corona.ts`, `corona-lampione.xml`, `lab/mjx/models/handmade/lampione*`).
- **Verifiche nel browser** (un task di verifica alla volta su `claude`, che ha `--chrome`): T45d (lobby multigiocatore), T64 (varianti in cache circuito-3D), T56b (arco salto e ombra), T69 (interfaccia web), T68c (stato provider coda abbonamenti).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con più agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
