# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 01/11/2026 ~06:45 UTC, epoca 184 su **claude** (Claude 5h 86 %, settimana 13 %, reset 05/11 16:00; Gemini settimana 8 %, 5h 100 %).

- **Integrati di recente**: T57c (effetto rilievo e terraformazione nel kernel, ADR-0096), T111 (ripiego senza browser corretto), T113 (lampione intero, drone 1:2), T109+T110+T112 (template del sito verificato), T101 (landing con hero MarkovJunior verificata nel browser).
- **In corso / Sospesi**:
  - **T102** su Claude, in corso. **T114 e T103 integrati** (hub sessioni verificato nel browser; badge live non provato).
  - **T57b** fatto (rune nuove dal Concilio, ADR suo da rinumerare 0097): `integra` in conflitto (AGENTS.md, adr/README.md, agents/effects.ts con T57c). Creato e approvato **T115** su Claude (p20; Gemini sotto il 10 % settimanale non riceve task nuovi) per il merge; poi `integra T115` e `integra T57b`. 5 timeout noti della suite (referente, wanderers, watch) falliscono anche sul base.
- **Finiti / Da verificare nel browser**:
  - **T103** (hub sessioni multigiocatore e wizard nuovo universo): completato su Gemini (`BROWSER: da verificare`). Merge diretto con `3d` ha conflitto in `site/index.html` (aggiornato da T101). Creato **T114** su Claude (p25, browser) per fondere `task/T103`, risolvere il conflitto e verificare nel browser Chrome.
- **Coda di Claude**: T114 (verifica T103) → T102, T104, T105, T106 (sito) → T89a-e (cartone, p75-79).
- **Decisioni recenti**:
  - T57c completato su Gemini e integrato nel base `3d` con test e typecheck verdi; branch e worktree rimossi.
  - T89 diviso in T89a-e e approvato; T57 diviso in T57b/T57c e approvato. T57 segnato fatto (T57a).
  - T103 completato con successo headless (test 8/8); delegata la verifica browser e merge a T114 su Claude.
- **Aspetto**: reset crediti Claude alle 05:50 UTC per T57b e T114; risposte su T45f (GCP); T88 da approvare.

- **Lezione**: mai `git commit -a` nel base (l'autore ha file suoi; le `lampione copy*.xml` restano non committate).

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
  - **T57c integrato nel base `3d` (ADR-0096)**: aggiunto l'effetto `rilievo {delta, raggio}` nel kernel, validazione (-8..8), persistenza in `plan.scavi`, deflusso d'acqua risvegliato; canone e guide di incantesimi aggiornate; test 6/6 e typecheck passati. Branch e worktree rimossi.
  - **T92 e T52 integrati nel base `3d`**: task/T92 ha risolto i conflitti con task/T52, rinumerato l'ADR in ADR-0091, aggiornato `AGENTS.md`, `README.md` e `backlog.md` (T52a fatto, T52b-f definiti). Eseguiti `integra T92` e `integra T52`, worktree e branch rimossi, typecheck e test pipeline verdi.
  - **T54 fatto**, da integrare tramite **T94** (conflitti; ADR da rinumerare in ADR-0092). Suite intera con 33 timeout di carico: T94 la rilancia col turno test.
  - **T45d integrato nel base `3d` (ADR-0086)**: requisiti minimi, tetto crediti, modale esaurimento, lobby multigiocatore e collezione carte integrati.
  - **T45f sbloccato e preparato**: dipendeva da T44b e T45d, ora entrambi integrati. Aperte le domande su GCP Project ID, hosting e regione in `docs/pipeline/domande/T45f.md`.
  - **T45e completato e chiavi Stripe fornite**: l'autore ha risposto in `docs/pipeline/domande/T45e.md` inserendo le credenziali di test in `.env` e impostando il listener locale su `localhost:5173/api/stripe/webhook`. T45e segnato `fatto` e approvato **T93** per la verifica nel browser su Claude (priorità 9).
- **Cosa si aspetta**:
  1. Reset di Claude alle 05:50 UTC per ripresa di **T57b** e avvio di **T114** (verifica nel browser di T103 e merge).
  2. **Risposte dell'autore per T45f** (`docs/pipeline/domande/T45f.md`).
- **Intenzioni / prossimi passi**:
  1. Al reset di Claude (05:50 UTC), far riprendere T57b e poi lanciare T114 per la verifica nel browser di T103 e merge di `task/T103`.
  2. Ricevute le risposte su T45f, riprendere il deploy del multigiocatore su GCP.

## Task attivi e in corso

- **Pronti / In corso**:
  - In corso / Sospeso: **T57b** su Claude (in attesa reset 5h alle 05:50 UTC).
  - Pronti su Claude: **T114** (p25, browser) → **T102** (p64) → **T104** (p68) → **T105** (p70) → **T106** (p72) → **T89a** (p75).
- **Completati e integrati nel base `3d`**:
  - **T57c**, **T113**, **T112**, **T111**, **T101**, **T110**, **T109**, **T95**, **T98**, **T108**, **T107**, **T96**, **T51b**, **T89**, **T94**, **T54**, **T52b**, **T93**, **T92**, **T52**, **T86**, **T85**, **T91**, **T84**, **T83**, **T90**, **T82**, **T87**, **T81**, **T70**, **T53b**, **T80**, **T45d**, **T79**, **T45b**, **T78**, **T45c**, **T77**, **T45e**, **T76**, **T75**, **T44b**, **T44c**.
- **Da integrare / Da verificare**:
  - **T103** (in `task/T103`, integrato e verificato nel browser tramite **T114**).
- **In attesa di chiavi/risposte**:
  - **T45f**: sbloccato, in attesa di GCP Project ID e scelte di deploy (`docs/pipeline/domande/T45f.md`).
- **In coda / Bloccati**:
  - **T88** (da approvare).
  - **T89b-e** (dipendono da T89a).
- **Crediti**:
  - **Claude**: 5h al 0 % residuo (reset 05:50 UTC), settimana al 14 % residuo (reset 05/11 16:00 UTC).
  - **Gemini**: 5h al 64 % residuo (reset 06:01 UTC), settimana al 9 % residuo (riservato per orchestrazione).
  - **Argon**: fermo fino al 04/11.

## Da fare appena possibile

- **Nota**: T51b ripartito il 31/10 dopo che il processo era rimasto appeso sul limite 5h di Claude: se un task "in corso" ha il log vuoto e la conversazione finisce con `usage_limit_reached`, `interrompi` + `riprendi`. Attenzione a non committare con `-a`: l'autore ha modifiche locali sue (`src/kernel/corona.ts`, `corona-lampione.xml`, `lab/mjx/models/handmade/lampione*`).
- **Verifiche nel browser** (un task di verifica alla volta su `claude`, che ha `--chrome`): T45d (lobby multigiocatore), T64 (varianti in cache circuito-3D), T56b (arco salto e ombra), T69 (interfaccia web), T68c (stato provider coda abbonamenti).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con più agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
