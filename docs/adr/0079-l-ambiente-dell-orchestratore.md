# ADR-0079 — L'ambiente dell'orchestratore

Data: 2026-10-30 · Stato: accettato · Estende ADR-0072 e ADR-0078.

## Contesto
Con ADR-0078 l'orchestratore era una sessione di Claude Code (`/pipeline`) che lanciava `esegui` in background. La prima notte di
lavoro ha mostrato i limiti:
- quando i crediti di Claude sono finiti, la sessione si è fermata e con lei `esegui`: T53b e T56b, ripresi al reset, sono rimasti
  «in corso» senza un processo, con il lavoro a metà nel worktree e i log vuoti;
- gli eventi in volo (esiti, limiti) non arrivavano a nessuno; per ripartire serviva l'autore («ti sei fermato, riprendi»);
- l'orchestratore lavorava anche lui (merge risolti a mano, correzioni urgenti), consumando i crediti e il contesto che servono a
  orchestrare: la correzione dello sfarfallio del bagliore ha finito le 5 ore di Claude mentre Argon ne aveva;
- un thread unico per tutto il progetto satura il contesto; un thread per task perde la visione d'insieme.

## Decisione
1. **Un processo, `node tools/pipeline/pipeline.mjs orchestra [--agente claude|argon|gemini]`** (`tools/pipeline/orchestra.mjs`),
   fa girare `esegui` sempre acceso e la conversazione con l'orchestratore, un turno alla volta con la sua CLI (`claude -p --resume`,
   `agy -p --conversation`). L'autore chatta dal terminale (`/stato`, `/agente`, `/epoca`, `/esci`); l'interfaccia web verrà dopo
   (T69) sugli stessi file.
2. **Gli eventi su disco**: le righe del diario della pipeline vanno in `.pipeline/orchestra/eventi.jsonl`; un esito, un limite, un
   arresto svegliano l'orchestratore, un lancio no. Un turno porta gli eventi non consegnati e i messaggi dell'autore; sono
   consegnati solo quando l'orchestratore ha risposto. La chat è in `chat.jsonl`.
3. **Le epoche** (contesto: la scelta C dell'autore): la conversazione dura finché il contesto non supera metà della finestra del
   modello (`orchestra.rotazione`, `finestra`), o finché i crediti del suo provider non finiscono o scendono sotto `sogliaUnSolo`; allora
   il processo gli chiede di aggiornare il **quadro** (`docs/pipeline/quadro.md`) e apre un'epoca nuova, sul prossimo provider di
   `orchestra.ordine` (claude → argon → gemini) se serve, tornando al primo quando ha di nuovo crediti. Un'epoca parte da
   `.pipeline/orchestra/avvio.md`: quadro, indice dei task, ultimi messaggi, eventi da consegnare. Se i crediti finiscono a metà
   turno, il turno passa intero al provider successivo.
4. **Il dossier**: `dossier Txx` costruisce dai file e da git (senza agenti) tutto di un task: blocco, esecuzione, commit (anche
   quelli che lo citano nel corpo), file, ADR, task da cui dipende, che dipendono da lui e che hanno toccato gli stessi file. L'orchestratore
   lo apre a richiesta; chi esegue un task nato da un altro lo legge (prompt di `config.json`).
5. **L'orchestratore non lavora**: decide e delega (`docs/pipeline/orchestra.md`). Comandi nuovi: `interrompi` (ferma un task e ne
   tiene la conversazione), `approva`, `assegna`, `indice`, `prossimo`; `integra` su un conflitto annulla il merge e lascia il base
   com'era, e la risoluzione diventa un task. Approva da solo solo i task nati da richieste esplicite dell'autore e le correzioni urgenti.
6. **I task sopravvivono al processo**: la CLI di un task scrive direttamente nel suo log ed è staccata; Claude ha l'id di sessione
   fissato prima di partire (`sessioneNuova`: `--session-id`). Al riavvio `esegui` segue i task ancora vivi e riprende la
   conversazione di quelli il cui processo non c'è più.

## Conseguenze
- La pipeline va avanti senza l'autore anche quando i crediti finiscono: si ferma solo se nessun provider ne ha, e riparte da sola.
- Il quadro è l'unica memoria scritta da un agente; tutto il resto (indice, dossier, diario, eventi) lo costruisce lo script.
- Le verifiche nel browser le fa solo Claude (`--chrome`): Antigravity in modalità `-p` non ha il browser.
- `/pipeline` in Claude Code e la skill di Antigravity restano per pianificare a mano; l'ambiente normale è lo script.
