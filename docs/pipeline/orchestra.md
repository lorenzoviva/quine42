# Orchestra (la pipeline dall'inizio alla fine)

Sei l'**agente orchestratore**, nel worktree del branch base (`3d`), in Claude Code o in Antigravity. Non esegui task: li fai
eseguire, li riporti all'autore, li fai verificare e li integri. L'autore lancia la pipeline sempre attraverso di te.

## 0. Riprendi da dove si era fermati

1. Leggi `docs/pipeline/orchestrazione.md`: il **passaggio di consegne** (cosa è in corso, cosa resta, le decisioni prese) e
   la coda del **diario**. Il tuo contesto è quello: la chat precedente non c'è più.
2. Di' alla pipeline su chi giri: `node tools/pipeline/pipeline.mjs orchestratore <claude|argon|gemini>` (Claude Code →
   `claude`; Antigravity → il modello che usi: `argon` con Gemini 4 Argon, `gemini` con 3.8 Flash). Da quel momento, sotto
   `sogliaUnSolo`, sul tuo provider non parte nessun task: i crediti restano a te.
3. `node tools/pipeline/pipeline.mjs stato` (o `uso` per rileggere i contatori subito).

## 1. Pianifica

Se ci sono richieste nel to-do, risposte nei file di `domande/` o task da stimare, segui [`pianifica.md`](pianifica.md)
con il filtro dell'autore. Approvi solo se l'autore lo dice.

## 2. Esegui e riporta

1. Lancia `node tools/pipeline/pipeline.mjs esegui` in background (con `--sempre` se l'autore vuole che resti acceso) e
   guarda le sue righe (lanci, `ESITO`, `BROWSER`, limiti, «Niente da lanciare: fine.»); in Claude Code con un Monitor sul suo
   log, ritirato ogni 30 minuti.
2. Per ogni task finito: `node tools/pipeline/pipeline.mjs traccia <Txx>` e riporta all'autore l'esito e il riepilogo (cosa
   cambia, cosa è diverso dal previsto, cosa manca).
3. Un task `fallito` per un limite che lo script non ha riconosciuto («hit your … limit», 429): `riprendi <Txx>` (riprende la
   sua conversazione) e una `nota`.

## 3. Verifica nel browser

Se il «Fatto quando» del task chiede una verifica nel browser e la riga `BROWSER:` dice `da verificare` (o manca), delegala a
un **subagente** (Claude Code: Agent con Claude in Chrome; Antigravity: il suo subagente con il browser) con: il commit da
provare, un worktree staccato tutto suo fuori dal base (`git worktree add --detach <dir> <commit>`, `node_modules` come
junction da togliere **prima** del worktree), una porta libera, `?offline` (niente chiamate a Gemini), ciò che il task dice
di guardare, e l'ordine di pulire tutto. Il suo esito va nel diario (`nota`) e all'autore; un difetto trovato diventa un task.

## 4. Integra (quando l'autore lo chiede)

1. `node tools/pipeline/pipeline.mjs integra <Txx>`, prima i task che sbloccano altri.
2. Se il merge si ferma sui conflitti:
   - **ADR con lo stesso numero** (task paralleli): l'ADR del task che integri prende il primo numero libero; rinumera il file,
     il suo titolo, la sua riga in `docs/adr/README.md`, e le sue citazioni (`AGENTS.md`, backlog, commenti) **solo** dove
     parlano di quel task: altri task usano lo stesso numero vecchio.
   - **Due aggiunte nello stesso punto** (AGENTS.md, campi di un'interfaccia): tienile tutte e due.
   - Altro: capisci entrambe le intenzioni; se non si possono tenere insieme, `git merge --abort` e chiedi all'autore.
3. `npm run typecheck` e `npm test` verdi sul merge (un test che fallisce solo nella suite intera e passa da solo: annotalo),
   poi `git commit` con «Pipeline: integra <Txx> (…)» e di nuovo `integra <Txx>`: il merge non ha più nulla da fare, e toglie
   worktree e branch staccando prima la junction di `node_modules`.
4. Se il task ha spostato file: controlla i link dei documenti attivi (`AGENTS.md`, backlog, README).

## 5. Il report e il passaggio di consegne

`docs/pipeline/orchestrazione.md` è la memoria tra un orchestratore e il successivo. Lo script ne scrive il diario da solo;
tu ci aggiungi con `nota` ciò che solo tu sai (conflitti risolti, ADR rinumerati, verifiche, difetti, decisioni dell'autore).
Riscrivi il **passaggio di consegne** a ogni integrazione, quando i tuoi crediti scendono sotto la soglia e prima di fermarti:
in corso, finiti da integrare, verifiche da fare, falliti da riprendere, domande aperte, il prossimo passo. Committalo con i
cambi della pipeline (`Pipeline: …`).

Quando i tuoi crediti stanno per finire: scrivi il passaggio di consegne, committa, e di' all'autore di aprire un orchestratore
sull'altro provider (`/pipeline` in Claude Code, la skill `pipeline` in Antigravity), che riparte dal punto 0.
