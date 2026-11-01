# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 01/11/2026 dopo le 13:35 UTC, epoca 186 su **claude** (Claude settimana 100 %, 5h 96 %, reset 05/11 16:00, abbonamento Pro nuovo; Gemini settimana 8 %).

- **Tetto di Claude a 2** (richiesta dell'autore, 01/11): attivo dopo il riavvio delle 13:35; `stato` dice tetto 2, slot 2. L'autore dice che con il Pro i limiti di Claude sono 5 volte più alti.

- **Integrati di recente**: T115 e T57b (rune nuove dal Concilio, ADR-0097; restano 5 timeout noti di referente, wanderers e watch, `abbonamenti` T68b non ricontrollato), T57c (effetto rilievo e terraformazione nel kernel, ADR-0096), T111 (ripiego senza browser corretto), T113 (lampione intero, drone 1:2), T109+T110+T112 (template del sito verificato), T101 (landing con hero MarkovJunior verificata nel browser).
- **In corso, coda, attese**: vedi «Stato e decisioni» e «Task attivi» sotto.
- **Decisioni recenti**:
  - T57c completato su Gemini e integrato nel base `3d` con test e typecheck verdi; branch e worktree rimossi.
  - T89 diviso in T89a-e e approvato; T57 diviso in T57b/T57c e approvato. T57 segnato fatto (T57a).
  - T103 completato con successo headless (test 8/8); delegata la verifica browser e merge a T114 su Claude.
- **Aspetto**: reset crediti Claude alle 05:50 UTC per T57b e T114; risposte su T45f (GCP); T88 da approvare.

- **Lezione**: mai `git commit -a` nel base (l'autore ha file suoi; le `lampione copy*.xml` restano non committate).

## Regole nuove dell'autore (30/10, chat: `docs/userchats/to-do-2026-10-30.md`)

- **31/10: mai zero slot per nessun modello** (T96); l'orchestratore decide ordine e sospensioni temporanee di un provider. Slot di Claude fissato a 1 a mano in `.pipeline/budget.json` (`slotAggiornato` al 05/11, così la previsione non lo riabbassa) finché **T96** (su Gemini, approvato) non mette `slotMinimi` in `config.json`. T51 ha la precedenza (priorità 50); T89 interrotto, da riprendere (`riprendi T89`) dopo T51.
- **Tetti**: 2 task su Claude (dal 01/11), 1 su `agy` (`limiti` in `config.json`). I tetti li decide l'autore; l'orchestratore non li alza senza sua istruzione.
- Obiettivi: niente parallelismo che aumenta il lavoro; a 0 % uno o zero task sul provider; finire i crediti entro il reset settimanale (non prima); distribuire i task pesanti nel tempo; tenere un margine per le urgenze dell'autore; i crediti avanzati andranno alla generazione con gli abbonamenti (T88, non ora).
- Al più **una verifica nel browser** alla volta. Risposte brevi.
- Catena delle correzioni della pipeline su Claude dopo T70: T82 → T83 → T84 → T85 → T86; su Gemini T81 (pagina web rotta) → T87 (browser di agy). T51 e T89 da approvare quando Claude è libero. T45b fermato (era già integrato e ripartiva per errore).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon esaurito per la settimana (quota 429 fino al 04/11): nessun task su Argon. Tutti i task complessi/multiplayer instradati su Claude o Gemini a seconda dei crediti.

## Stato e decisioni

- **Sicurezza e CPU (01/11)**: T117 (audit, p0) e T118 (CPU satura con due task, p1) richiesti e approvati dall'autore, senza interrompere i task in corso. Agent View scartato dall'autore; niente abbassamento della priorità dei processi. Le correzioni proposte da T117 vanno portate all'autore.
- **T117 in attesa dell'autore** (`docs/pipeline/domande/T117.md`, report su `task/T117`): riprodotti solo 4 casi perché un filtro di sicurezza ha interrotto la sessione; l'uscita dalla sandbox verso JS non è provata. Proposta all'autore: opzione 1, test difensivi. Niente server pubblico (T45f) prima delle correzioni 1-3 del report.
- **Riavvio**: spenta alle 13:08 (`ferma --dopo`, T115 finito), riaccesa alle 13:35 con il tetto 2 di Claude; nessun task interrotto da riprendere.
- **Cosa si aspetta**:
  1. **T119** (merge di T116 dopo T104, p2): poi `integra T119`, `integra T116`, `integra T102`.
  2. **Risposte dell'autore per T45f** (`docs/pipeline/domande/T45f.md`); T88 da approvare.
- **Intenzioni**: T116 prima del resto; se l'autore vuole gli slot di Claude fissi a 2, bloccare `slotAggiornato` in `.pipeline/budget.json` (non l'ha ancora chiesto).
- **Da sapere**: la pipeline, a ogni fine task, può riprovare da sola `integra`: i conflitti su T102 sono attesi finché T116 non entra. Sotto `sogliaUnSolo` (10 %) nessun task nuovo parte e non c'è un lancio forzato.

## Task attivi e in corso

- **In corso** (all'ultimo `stato`): **T117** su Claude.
- **Pronti su Claude**: **T118** (p1) → **T119** (p2) → **T105** (p70) → **T106** (p72) → **T89a** (p75); bloccati **T89b-e** (da T89a).
- **Da integrare**: **T102** e **T116** (via T119).
- **Integrati di recente**: **T104** (22 timeout su 675 nella suite, estraneità provata solo in 3 file: se restano dopo T118, ricontrollare `forms.ts` e `cards.ts`), **T115**, **T57b**, **T114**, **T103**, **T57c**, **T113**, **T112**, **T111**, **T101**, **T110**, **T109**.
- **Crediti** (01/11 dopo le 13:35 UTC): Claude settimana 100 %, 5h 96 % (reset 05/11 16:00); Gemini settimana 8 %, sotto soglia: nessun task nuovo (reset 05/11 17:37); Argon fermo fino al 04/11.

## Da fare appena possibile

- **Nota**: T51b ripartito il 31/10 dopo che il processo era rimasto appeso sul limite 5h di Claude: se un task "in corso" ha il log vuoto e la conversazione finisce con `usage_limit_reached`, `interrompi` + `riprendi`. Attenzione a non committare con `-a`: l'autore ha modifiche locali sue (`src/kernel/corona.ts`, `corona-lampione.xml`, `lab/mjx/models/handmade/lampione*`).
- **Verifiche nel browser** (un task di verifica alla volta su `claude`, che ha `--chrome`): T45d (lobby multigiocatore), T64 (varianti in cache circuito-3D), T56b (arco salto e ombra), T69 (interfaccia web), T68c (stato provider coda abbonamenti).

## Da sapere

- Il 30/10 sono stati corretti fuori dalla pipeline lo sfarfallio del bagliore e il tempo di `circuito-3D` (30 s).
- Con più agenti al lavoro i test possono andare in timeout per carico macchina: un test che fallisce nella suite intera e passa da solo non è un difetto del task.
