# ADR-0109 · Ciò che esce e ciò che il Concilio scrive: due elenchi

- Stato: accettato
- Data: 2026-11-02
- Task: T130 (V-012, V-013)

## Contesto

`playerFiles` toglieva `logic` e `casi` dai manifest e lasciava `universe.json` intero: a ogni giocatore arrivavano budget e provider e, nei manifest, `persona`, `lore`, `context` e gli effetti. Ogni campo nuovo sarebbe uscito da solo. Il kit (`esiti/2026-11-01.json`) ha misurato anche che il server di sviluppo serve i file di `universes/`: viandanti, saldi, richieste della coda.

Per le scritture del Concilio l'audit non aveva verificato nulla. Letti tutti i `repo.write` di `kernel.ts` e `planGenesis`: i percorsi sono fissi o costruiti da id già validati (`ID_RE`, `MODEL_RE`), e nessun agente scrive `universe.json`. Oggi il Concilio non ci arriva, ma lo dice solo la lettura del codice: nessuna regola lo impedisce.

## Decisione

1. **Ciò che esce è un elenco** (`src/session/files.ts`). Di `universe.json` e dei manifest escono solo i campi nominati, anche dentro oggetti, terreni, ricette, rune e incantesimi. Un campo nuovo resta a casa finché qualcuno non lo nomina. Un file che non si legge non esce: il suo testo può essere qualunque cosa.
   - Al client di un giocatore niente `ai`. Dei manifest niente di ciò che fa nascere una cosa (arriva dal server, `THING_PARTS`): `spawn interaction container inventory loot layouts fragments drops`; niente di ciò che legge solo il Concilio: `persona lore context prompts origin`, e `appearance.aspetto`. `components singleton persist` solo per il viandante e per i sistemi di `PER_WANDERER`.
   - Degli effetti di un'azione esce solo il `tipo`: il menu deve sapere che ne ha, non cosa dicono. Degli incantesimi nome, descrizione e costo.
   - `publicFiles` aggiunge ciò che lobby e sito mostrano: di `ai` modelli, coefficienti, minimi e i budget che la stima oraria legge, mai `provider`, `agenti`, `thinking`, `timeout`; degli ambienti nome, descrizione e carta, mai il programma.
2. **`universes/` non si serve** (`server/hidden.ts`, primo plugin di `vite.config.ts`): un universo arriva al browser solo dalle sue route. Il middleware confronta i segmenti dell'URL (maiuscole, punti e spazi finali, flussi NTFS) e chiede il percorso vero al file system (nomi corti, collegamenti). `server.fs.deny` copre ciò che chiede un file senza passare dai middleware; l'impostazione sostituisce quella di Vite, quindi ne ripete l'elenco.
3. **Il Concilio scrive in un elenco** (`councilMayWrite` in `paths.ts`): `modules/ models/ world/ maps/` e `prompts/theme.md`. Il controllo è sul commit, non sui singoli punti che scrivono: prima di un commit con autore `agent`, `fenceCouncil` riporta all'ultimo commit ogni altro file cambiato, lo dice nel registro e ricarica i file. Vale anche sul kernel del ramo del master.
4. **`ai` cambia solo dal kernel, su comando del master**: `setAi` e l'editor passano da `writeCommanded`, che il recinto lascia stare fino al commit dopo. `keepGame` no: riscrive un file che può essere già del Concilio, e rifà il file a partire da ciò che trova.

## Alternative

- **Filtrare `ai` in `applyFiles`**, come `keepGame` fa con `partita`: `applyFiles` non sa chi scrive, e il master deve poter cambiare `ai`.
- **Un `repo.write` del Concilio separato**: i punti che scrivono sono decine e ognuno nuovo dovrebbe ricordarsene. Il commit è il passaggio unico.
- **Stringere `world/` per il Concilio**: nello stesso commit finiscono scritture del kernel in attesa (`keepProfile`, `setAnonymous`), e `world/giocatori/` non ha più saldi (ADR-0104). Resta nell'elenco.
- **Niente `ai` nemmeno in `publicFiles`**: la lobby (ADR-0086) mostra al giocatore quanto costa il mondo prima di entrare; serve.

## Conseguenze

- Chi aggiunge un campo a `Manifest` che il client di un giocatore deve leggere lo nomina in `files.ts`; altrimenti lo specchio non lo vede. `tests/players.test.ts` e `tests/sicurezza/uscite.test.ts` fanno partire uno specchio sui file del seme.
- Tra una scrittura sbagliata e il suo commit il kernel può già averla applicata, per il tempo di quel passo: il recinto ferma ciò che dura, non quel momento.
- I file interi restano interi: `models/`, il rilievo, l'atlante. `carta` esce perché è già pubblica (ADR-0102).
- In produzione `server/hidden.ts` non serve più quando la build è l'unica cosa servita (T133); fino ad allora protegge il server di sviluppo.
