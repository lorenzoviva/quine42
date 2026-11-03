# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 03/11/2026, dopo l'epoca 219 e il cambio della pipeline (ADR-0119). Crediti: vedi `stato`.

## Stato attuale

- Pipeline spenta dall'autore (`ferma --dopo`), nessun task in corso: la riavvia lui. Il processo va riavviato per avere il codice di ADR-0119.
- T179 finito (traccia in testo, suite 1403 verdi), non integrato: il suo ADR ha lo 0117, che è di T178. `banco-strutture --seconda --traccia` non provato con una chiamata vera.
- ADR nuovi dallo **0121**: lo 0118 è riservato a T179, lo 0119 è di questo cambio, lo 0120 dello split di `AGENTS.md`.

## Pronti e priorità

1. **T206** (p1, approvato): fonde T179 con lo 0118. Alla fine `integra T206`, `integra T179`: sblocca T187. Con ADR-0119 anche un `integra T179` diretto rinumererebbe da solo, ma salterebbe la suite con entrambi dentro.
2. **Catena delle rinomine** (l'autore: «i nomi vanno bene e fai tutte le rinomine»): T187 (glossario) → T188-T203 → T204 (`AGENTS.md`) → T205 (prova nel browser), p2-20, approvati, ognuno dipende dal precedente. A ogni fine `traccia` e `integra`, una alla volta.
3. **T180 T175 T106 T89a T183 T152 T186 T158**: senza `· approvato` dall'epoca 219, perché partiti con i nomi vecchi si fonderebbero senza conflitti e romperebbero il typecheck. Non sono proposte nuove. Alla fine di T205: `approva` nell'ordine di prima. Se l'autore vuole T180-T182 prima, si ferma la catena tra due task. D'ora in poi un vincolo così si scrive con le dipendenze.
4. **T181 → T182 → T156** (strutture procedurali; T181 su Fable, aspetta T179 e T180): alla fine di T181 leggere il contatore delle 5 ore e confrontarlo con `ratioSessioneSettimana`.
5. Bloccati da T89a: T89b-e.

## Attese dall'autore

- **T176, due proposte sul sorvegliante, senza risposta** (se sì, task Claude prima di T45f, con voce V-NNN se è il caso): (1) `healthy` conti da `pronto`; (2) `stop()` aspetti i git in corso.
- **T153** (`domande/T153.md`): `agy` sulla Genesi, tetto di consumo, singola o multi, nomi, `aurora`. T184-T185: `in attesa`, ripartono solo se lo dice lui.
- **T45f** (`domande/T45f.md`, progetto GCP e deploy). Prima di T45f restano non provabili qui: token vero di Firebase, TLS e bilanciatore, `QUINE_PROXY_FIDATI` e controllo di salute, Stripe vero con le imposte, `npm ci --omit=dev`, tetto Gemini sul server di produzione; silenzio massimo del mondo 5,5 s contro i 5 di `notice`.
- **T88**: «non ora», l'universo lo sceglie lui.
- **Decisioni di gioco e sicurezza chieste:** il salto sulle casse; V-023 con gli account; V-002 chiusa col residuo; l'orologio di 2 s di T126; anonimo che avvia un mondo fermo (consigliato tenerlo); il master del clone nel corpo della richiesta (consigliato tenerlo); Referente senza crediti e `QUINE_TETTO_RICARICHE`; immagine per le carte dei luoghi (consigliato no).
- **Da guardare:** il criterio degli interni; la rilettura di `lab/banco/finale/giudizio.md` con le foto; la vista Markdown della pagina web, mai vista in un browser; `tests/abbonamenti.test.ts` dietro una variabile (consigliato sì); le prove a mano V-001.n, V-001.o, V-006.g se vuole rifarle.
- **Da dirgli se non è d'accordo:** T155 e T173 chiusi con un allentamento della soglia (scelta A), la strada ora è T179-T182. Lo sbalzo di spazio su C: durante i task lo verifica lui.

## Regole attive

- **I tetti sono dell'autore** (`limiti`: 2 su Claude, di cui Fable al più 1, e 1 su `agy`): non si alzano senza una sua istruzione. Mai zero slot per la previsione (T96).
- **Abbonamenti** (ADR-0119): Claude Max 5x dal 01-02/11, Google Ultra. Le stime si scrivono sul piano di riferimento; lo script le scala.
- **La finestra delle 5 ore la protegge lo script.** Mai più togliere `· approvato` per dosare i lanci. Nessun ripiego: un task aspetta il suo provider, si sposta solo con `assegna`.
- **Argon:** quota esaurita fino al 04/11. **Fable:** solo i task più difficili, mai orchestratore; una sola misura (T157: 7 % sul suo contatore, ~55 punti di sessione).
- Al più una verifica nel browser alla volta, solo su Claude. Risposte brevi all'autore.
- Obiettivi: nessun parallelismo che aumenta il lavoro; finire i crediti entro il reset settimanale, non prima; margine per le urgenze.
- **Autonomia scaduta il 02/11 alle 18:00:** le mie proposte nuove aspettano l'approvazione; i task già approvati vanno avanti. Priorità 0 solo per le urgenze dell'autore e ciò che blocca gli altri.
- **Mai `git commit -a` nel base:** l'autore ha file suoi (`lab/mjx/models/handmade/lampione copy*.xml`, `docs/design/logo/proposte/`).
- **Il parser delle dipendenze legge «dopo» e «dipende da» in tutto il blocco**, anche in un nome di file: niente «dopo» vicino a un Txx che non è una dipendenza. Dopo un blocco nuovo controlla `stato`.
- Un test rosso nella suite intera e verde da solo non è per forza un difetto del task: guarda il carico. Un task «in corso» col log vuoto e la conversazione finita su `usage_limit_reached`: `interrompi` + `riprendi`.
- Una stranezza mai indagata: l'evento «limite di claude fino a 2026-11-03T18:31», un giorno dopo il reset vero; potrebbe far scegliere male il provider a un cambio di epoca.

## Ultime 2 epoche

- **218:** T176 integrato (i rossi di `mondo.test.ts` erano i tempi del test), T178 integrato (`docs/glossario.md`, ADR-0117, nessuna rinomina). Scelte del glossario: 6 su 8 come raccomandate; per la 4 e la 6 proposte «individuo» e `SizeTier`, `GameSetup`, `liaison`.
- **219:** l'autore accetta nomi e rinomine: catena T187-T205. T179 finito, in conflitto sull'indice degli ADR: T206. Pipeline spenta dall'autore alle 02:58 UTC.
