# Il quadro

> La fotografia che l'orchestratore riscrive e che chi lo sostituisce legge per prima (`orchestra.md`, punto 7): sotto le 75 righe, niente diario.
> Gli eventi sono in [`orchestrazione.md`](orchestrazione.md). Il quadro lungo di prima, con le voci delle epoche 191-219: `git show 940570f:docs/pipeline/quadro.md`.

Aggiornato il 03/11/2026, epoca 226. Crediti: vedi `stato`.

## Stato attuale

- T187 integrato (glossario, R1-R17 con i nomi esatti). T206 e T179 integrati: traccia nel base con l'ADR-0118, `banco-strutture --seconda --traccia` non provato con una chiamata vera.
- **T180 integrato** (banco della varianza, solo `lab/`): 31 programmi su 31 statici; i sei vuoti del gioco per T156 sono nel suo esito; da decidere con T156 il tetto di 120 per Enorme e Gargantuesca. Soglia non provata su un edificio vero.
- **Rinomine: R1-R10 integrate (T188-T197), T198 (R11) parte da solo.** `heap out of memory` nel log dei test a ogni rinomina (T188-T197), senza test falliti: da guardare a T205. Le dipendenze da T205 sui task approvati dall'autore restano.
- Rimasti dopo R4, perché la riga non li nomina (a T205 vedere se proporre una riga nuova): `SessionClient.places`, `Client.places`, `ThinClient.places()`, `ShowcaseEntry.place`, `graphCache.places`, `PLACE_PHASES`, `PLACES_PER_MINUTE`, `Kernel.miniature`, `tests/places.test.ts`. Dopo R7 restano `tornio` e `plinto` (`stepTornio`, `openTornio`, `TORNIO_AT`, `CoronaView.tornio`, `Studio.tornio`, `Kernel.plinto()`, `updatePlinto`), aggiunti alla riga nel glossario: convivono con `lathe`. Dopo R8 «ledger» resta in locali e commenti di consumi e carte, omonimo dei saldi. Dopo R9 resta «ground floor» nei commenti (piano terra, inglese comune): a T205 dirlo all'autore, serve un passaggio solo se lo vuole. Dopo R10 restano come caselle: i campi `cell` di `Placements` e `HoverInfo`, `Building.cells`, `Cell`/`cells`/`cell()` di `water.ts`, `Overlay.cell`, i locali `cells`, i commenti (a T205 vedere se proporre una riga nuova).
- ADR nuovi dallo **0121**.

## Pronti e priorità

1. **T198** (R11), il prossimo della catena.
2. **Catena delle rinomine** (l'autore: «i nomi vanno bene e fai tutte le rinomine»): T198-T203 → T204 (`AGENTS.md`) → T205 (prova nel browser), p2-20, ognuno dipende dal precedente. A ogni fine `traccia` e `integra`, una alla volta.
3. **T175 T106 T89a T183 T152 T186 T158, e T181**: approvati, con «dipende da T205» (l'autore: non c'è bisogno di toglierla). Partono da soli alla fine di T205.
4. **T181 → T182 → T156** (strutture procedurali; T181 su Fable, stima 10 %, contatore Fable al 93 % fino al 05/11): alla fine di T181 leggere il contatore delle 5 ore e confrontarlo con `ratioSessioneSettimana`.
4b. **Generazione differita** (richiesta dell'autore, 03/11): **solo dopo T156, il prompt nuovo dello Scultore** (l'autore: non sprecare crediti). T207 (generatore senza browser, solo abbonamenti, aspetta T205 e T156) → T88 (la pipeline lo accende coi crediti che avanzano) → T153 (legge e prova i tre universi). L'elenco `generazione` di `config.json` c'è già: nessuno lo legge finché T88 non lo usa; la sua forma è mia, T88 può adattarla.
5. Bloccati da T89a: T89b-e.

## Attese dall'autore

- **Domande nei file (03/11): aperte solo T45f (progetto, hosting, regione), T93 (regime fiscale, non blocca); le altre hanno `Stato: chiusa` in testa. T208 integrato: il conteggio giusto della pagina web si vede dopo il riavvio del processo, non provato nel browser.**
- **T176, le due proposte sul sorvegliante:** approvate da me nell'autonomia, sono T209; T45f ora dipende da T209. T210 indaga il `heap out of memory`. Da dirgli al ritorno.
- **T153**: domande chiuse. Nomi scelti (03/11): `orichalcum`, `neapolis`, `sidera`, già in `generazione` di `config.json`. Il resto è deciso: niente API, Claude Code, 25 % per universo modificabile in corsa, tutti multigiocatore, `aurora` intatto. T184-T185: `in attesa`, ripartono solo se lo dice lui.
- **T45f** (`domande/T45f.md`, progetto GCP e deploy). Prima di T45f restano non provabili qui: token vero di Firebase, TLS e bilanciatore, `QUINE_PROXY_FIDATI` e controllo di salute, Stripe vero con le imposte, `npm ci --omit=dev`, tetto Gemini sul server di produzione; silenzio massimo del mondo 5,5 s contro i 5 di `notice`.
- **Decisioni di gioco e sicurezza chieste:** il salto sulle casse; V-023 con gli account; V-002 chiusa col residuo; l'orologio di 2 s di T126; anonimo che avvia un mondo fermo (consigliato tenerlo); il master del clone nel corpo della richiesta (consigliato tenerlo); Referente senza crediti e `QUINE_TETTO_RICARICHE`; immagine per le carte dei luoghi (consigliato no).
- **Da guardare:** il criterio degli interni; la rilettura di `lab/banco/finale/giudizio.md` con le foto; la vista Markdown della pagina web, mai vista in un browser; `tests/abbonamenti.test.ts` dietro una variabile (consigliato sì); le prove a mano V-001.n, V-001.o, V-006.g se vuole rifarle.
- **Da dirgli se non è d'accordo:** T155 e T173 chiusi con un allentamento della soglia (scelta A), la strada ora è T179-T182. Lo sbalzo di spazio su C: durante i task lo verifica lui.

## Regole attive

- **I tetti sono dell'autore** (`limiti`: 3 su Claude dal 03/11 per sua istruzione, di cui Fable al più 1, e 1 su `agy`; il processo legge i limiti solo all'avvio): non si alzano senza una sua istruzione. Mai zero slot per la previsione (T96).
- **Abbonamenti** (ADR-0119): Claude Max 5x dal 01-02/11, Google Ultra. Le stime si scrivono sul piano di riferimento; lo script le scala.
- **La finestra delle 5 ore la protegge lo script.** Mai più togliere `· approvato` per dosare i lanci. Nessun ripiego: un task aspetta il suo provider, si sposta solo con `assegna`.
- **Argon:** quota esaurita fino al 04/11. **Fable:** solo i task più difficili, mai orchestratore; una sola misura (T157: 7 % sul suo contatore, ~55 punti di sessione).
- Al più una verifica nel browser alla volta, solo su Claude. Risposte brevi all'autore.
- Obiettivi: nessun parallelismo che aumenta il lavoro; finire i crediti entro il reset settimanale, non prima; margine per le urgenze.
- **Autonomia fino al 03/11 alle 18:00** (l'autore, che non può rispondere: «sii proattivo»; scritto «domani», ma la data è questa): approvo da solo le mie proposte; ciò che spetta solo a lui (nomi, regime fiscale, hosting, tetti) resta in attesa. Dopo quell'ora le proposte nuove aspettano di nuovo l'approvazione. Priorità 0 solo per le urgenze dell'autore e ciò che blocca gli altri.
- **Mai `git commit -a` nel base:** l'autore ha file suoi (`lab/mjx/models/handmade/lampione copy*.xml`, `docs/design/logo/proposte/`).
- **Il parser delle dipendenze legge «dopo» e «dipende da» in tutto il blocco**, anche in un nome di file: niente «dopo» vicino a un Txx che non è una dipendenza. Dopo un blocco nuovo controlla `stato`.
- Un test rosso nella suite intera e verde da solo non è per forza un difetto del task: guarda il carico. Un task «in corso» col log vuoto e la conversazione finita su `usage_limit_reached`: `interrompi` + `riprendi`.
- Una stranezza mai indagata: l'evento «limite di claude fino a 2026-11-03T18:31», un giorno dopo il reset vero; potrebbe far scegliere male il provider a un cambio di epoca.

## Ultime 2 epoche

- **226:** T196-T197 (R9-R10) integrati.
- **225:** T194-T195 (R7-R8) integrati; autonomia fino alle 18:00, nascono T209 e T210.
