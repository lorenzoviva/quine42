# La pipeline agentica (ADR-0072, ADR-0078, ADR-0079)

Il lavoro sul kernel va avanti da solo: richieste dell'autore → task → piano → esecuzione in parallelo su
Claude Code e Gemini (Antigravity CLI), ciascun task nel suo worktree, entro i limiti di consumo di ogni provider.

```
docs/userchats/to-do.md        (1) le richieste dell'autore, testo libero, con «> Provider proposto: …» (o in chat all'orchestratore)
  └─ docs/pipeline/domande/Txx.md   (2, facoltativa) lo scambio: l'agente chiede, l'autore risponde nello stesso file
docs/plans/backlog.md          (3) i task, uno per sessione; ogni task pianificato ha la riga «- Pipeline:»
docs/pipeline/PIANO.md         (4) il piano: le code per provider (generato dallo script, non toccarlo)
.pipeline/                     (5) l'esecuzione: esecuzioni.json, budget.json, orchestratore.json, log/ (locale, ignorato da git)
  └─ orchestra/                    la conversazione dell'orchestratore: stato.json, eventi.jsonl, chat.jsonl, coda.json, avvio.md
docs/pipeline/quadro.md            lo stato e le intenzioni, scritti dall'orchestratore: chi lo sostituisce parte da qui
docs/pipeline/orchestrazione.md    il diario: lanci, esiti, limiti, integrazioni, note
docs/pipeline/consumi.jsonl        lo storico dei consumi, per stimare meglio
```

## Avviare la pipeline

```bash
node tools/pipeline/pipeline.mjs orchestra                 # orchestratore su Claude Code (poi Argon, poi Gemini) + web su :4242
node tools/pipeline/pipeline.mjs orchestra --agente argon  # su Gemini 4 Argon in Antigravity
node tools/pipeline/pipeline.mjs web [--porta 4242]        # solo l'interfaccia web (stessi file e comandi della pipeline)
```

Un solo processo, in un terminale: esegue i task (`esegui`, sempre acceso), apre l'**interfaccia web** (`http://localhost:4242`,
`tools/pipeline/web.mjs`, T69) e tiene la conversazione con l'**orchestratore**, un agente
che gira a turni con la sua CLI e segue [`orchestra.md`](orchestra.md). Gli scrivi come in una chat (dal terminale o dalla pagina web,
che usano la stessa coda in `.pipeline/orchestra/coda.json`): richieste, bug, domande,
correzioni ai task fatti. Lui pianifica, stima, sceglie il provider, approva ciò che gli chiedi, lancia, interrompe, riporta gli esiti,
fa verificare nel browser e integra; non lavora sul codice, delega. Gli eventi della pipeline (esiti, limiti) gli arrivano tra un
turno e l'altro, anche se non scrivi nulla.

**L'interfaccia web** (`tools/pipeline/web.mjs`) legge e scrive gli stessi file e comandi della pipeline, senza una seconda fonte di verità:
1. **Chat e Orchestra**: chat con l'orchestratore (`.pipeline/orchestra/chat.jsonl` + `coda.json`), eventi (`eventi.jsonl`), il quadro (`quadro.md`) e il diario (`orchestrazione.md`).
2. **Lavagna e Tabella**: lavagna Kanban a colonne con le code di `PIANO.md` (In corso, Finiti da integrare, Pronti, Da approvare / stimare, Bloccati, In attesa) e tabella filtrabile di tutti i task del backlog.
3. **Dettaglio di un task**: dossier completo (`dossier`), log dell'esecuzione (`log/<Txx>.<tentativo>.log`) e **conversazione in diretta** dell'agente che sta lavorando (letta dal `.jsonl` di Claude o da `transcript.jsonl` di Antigravity).
4. **Azioni dirette**: approvare (`approva`), assegnare provider/stima/priorità (`assegna`), interrompere (`interrompi`), riprendere (`riprendi`) e integrare (`integra`).
5. **Domande & To-Do**: rispondere alle domande in `docs/pipeline/domande/*.md` e aggiungere o modificare richieste in `docs/userchats/to-do.md`.
6. **Budget & Consumi**: i contatori a 5 ore e settimanali di ogni provider (`.pipeline/budget.json`, rilettura `/usage` o impostazione manuale `budget`) e lo storico di `docs/pipeline/consumi.jsonl`.

| Nel terminale | |
|---|---|
| un messaggio | va all'orchestratore (se sta rispondendo, al turno dopo) |
| `/stato` | le code e i contatori |
| `/agente argon` | l'orchestrazione passa ad Argon (il quadro aggiornato, poi una conversazione nuova) |
| `/epoca` | una conversazione nuova sullo stesso provider |
| `/esci` | chiude il processo; i task in corso continuano e al prossimo avvio li ritrova |

**Epoche e crediti.** La conversazione dell'orchestratore è un'epoca: ne parte una nuova quando il contesto supera metà della
finestra del modello, quando i crediti del suo provider finiscono o scendono sotto `sogliaUnSolo` (passa al prossimo di
`orchestra.ordine` in `config.json`, e torna al primo quando ha di nuovo crediti), o quando lo chiedi. Prima di chiuderla il
processo gli fa aggiornare il quadro; la nuova parte da quadro, indice dei task, ultimi messaggi ed eventi non consegnati. Se i
crediti finiscono a metà turno, il turno passa intero al provider successivo. Sul provider dell'orchestratore, sotto la soglia,
non parte nessun task.

Al posto di PLAN_CLAUDE.md/PLAN_GEMINI.md/TASK_*.md c'è **una sola fonte**, il backlog: il provider e la stima
stanno nel task, le code per provider sono sezioni di `PIANO.md`, l'esecuzione è stato locale. Così nessun task
(fatto o da fare) si perde e non ci sono due file da tenere allineati.

## Le fasi 1-4: la pianificazione (un agente)

La fa l'orchestratore. A mano, senza lo script, si lancia dal prompt di Claude Code (`/pipeline`, eventualmente con un filtro: `/pipeline solo le richieste per Claude Code`)
o di Antigravity (`/pipeline`, la skill in `.agents/skills/pipeline/SKILL.md`; per la pianificazione con Argon: `agy --model gemini-4-argon-high`, poi `/pipeline`). L'agente segue
[`pianifica.md`](pianifica.md): to-do → backlog, sblocca gli `in attesa` con risposta, stima e assegna, poi
`node tools/pipeline/pipeline.mjs stato`. Si committa sul branch base (`3d`).

La riga che la pianificazione scrive in ogni task:

```
- Pipeline: claude · stima 4% · approvato · priorità 2
```

`claude | gemini | argon` (le chiavi di `providers` in `config.json`: `gemini` è `agy --model gemini-3.8-flash-high`, `argon` è `agy --model gemini-4-argon-high` con i suoi contatori); la stima è la percentuale del limite **settimanale** del provider; `approvato` manca finché
l'autore non approva (con `"approvazione": "manuale"` in `config.json`; con `"auto"` tutto parte); `priorità` (più
bassa prima, 100 se manca). Se l'autore ha scritto il provider nella richiesta, la pianificazione lo usa e scrive
già `approvato`. Per approvare basta aggiungere `· approvato` alla riga.

## La fase 5: l'esecuzione (uno script)

```bash
node tools/pipeline/pipeline.mjs stato                  # rigenera PIANO.md e stampa le code
node tools/pipeline/pipeline.mjs budget claude 40       # il residuo attuale (%) del limite settimanale
node tools/pipeline/pipeline.mjs esegui [--sempre] [--max 5] [--solo claude|gemini|argon] [--task T43b]
node tools/pipeline/pipeline.mjs worktree               # i worktree, cosa resta in ciascuno
node tools/pipeline/pipeline.mjs traccia T43b           # la conversazione dell'agente, se ha letto AGENTS.md, il suo riepilogo
node tools/pipeline/pipeline.mjs integra T43b           # merge --no-ff di task/T43b nel base, poi toglie worktree e branch
node tools/pipeline/pipeline.mjs riprendi T51           # rimette in coda un task fermato o interrotto: riprende la sua conversazione
node tools/pipeline/pipeline.mjs interrompi T51         # ferma un task in corso (o --tutti), tenendo la conversazione
node tools/pipeline/pipeline.mjs dossier T63            # tutto di un task: blocco, esecuzione, commit, file, ADR, task collegati
node tools/pipeline/pipeline.mjs indice                 # una riga per task
node tools/pipeline/pipeline.mjs assegna T69 argon 6 60 [--approva]   # la riga Pipeline: provider, stima, priorità
node tools/pipeline/pipeline.mjs approva T69            # aggiunge «approvato»
node tools/pipeline/pipeline.mjs prossimo               # il primo numero di task libero
node tools/pipeline/pipeline.mjs orchestratore argon    # su quale provider gira l'orchestratore (lo scrive orchestra da solo)
node tools/pipeline/pipeline.mjs nota "testo"           # una riga nel diario di orchestrazione.md
```

`integra` su un conflitto annulla il merge e lascia il base com'era (dice i file): la risoluzione la fa un agente, in un task.

**I task sopravvivono al processo.** La CLI di un task scrive direttamente nel suo log in `.pipeline/log/` ed è staccata dal
processo che la lancia; Claude ha l'id della sessione fissato prima di partire (`sessioneNuova`). Se il processo della pipeline
muore, al riavvio `esegui` segue i task ancora vivi e riprende la conversazione di quelli il cui processo non c'è più.

**L'orchestratore non resta senza crediti.** Il provider su cui gira l'orchestratore (`.pipeline/orchestratore.json`, lo scrive
`orchestra`; senza, `orchestratore` di `config.json`): sotto `sogliaUnSolo` (settimana o 5 ore) su di lui non parte **nessun** task
(sugli altri nessuno nuovo e al più uno in corso), così i task non consumano i crediti che servono all'orchestrazione. In Antigravity conta il modello che usa
(`argon` con Gemini 4 Argon, `gemini` con 3.8 Flash).

`esegui` gira finché c'è qualcosa da fare; con `--sempre` non si ferma mai: rilegge backlog e contatori a ogni controllo, e i task che pianifichi intanto partono da soli (lascialo in un terminale a parte):

- lancia i task **pronti** (dipendenze `fatto` nel base, approvati, con stima) entro gli **slot** del provider, se la
  stima sta nel residuo del provider meno ciò che i task in corso hanno già impegnato e la `riserva`;
- **tetti e slot** (ADR-0087): il tetto lo decide l'autore in `limiti` (`limiti.provider` per CLI, `claude` e `agy`;
  `limiti.modello` per voce di `providers`; oggi 1 ciascuno: un task su Claude e uno su `agy` alla volta); sotto il tetto gli
  **slot dinamici** (da 0, partendo da 1): a ogni controllo la pipeline campiona il residuo settimanale (`budget.json → storia`,
  ultimi `giorniStoria` giorni) e prevede dal ritmo degli ultimi `giorniPrevisione` giorni quando la settimana arriva al 100 %;
  se cade dopo il reset settimanale (o il provider non consuma) aggiunge uno slot, se cade prima lo toglie (al più uno spostamento
  ogni `usoSecondi`), mai oltre i task che il provider ha in programma (in corso, pronti, bloccati solo da altri task: non quelli
  in attesa dell'autore). Sotto `sogliaUnSolo` (10 %, settimana o 5 ore) nessun task nuovo e al più uno in corso, nessuno su
  quello dell'orchestratore. Un task a **priorità 0** (le urgenze dell'autore) può usare uno slot in più, mai oltre il tetto.
  `stato` (e `PIANO.md`, l'interfaccia web) mostra per provider tetto, slot, task in programma, esaurimento previsto e reset;
- **alternative** (`alternative` in `config.json`: oggi `claude → argon → gemini`, `argon → gemini`): se il provider di un task nuovo è fermo per i limiti o la stima non entra nel suo residuo, il task va al primo che può, con la stessa stima; un task sospeso riprende sempre sul suo. Così finiti i crediti di Claude la pipeline continua su Argon e poi su Gemini 3.8. Toglile se un task delicato deve aspettare Claude;
- i provider girano **in parallelo** tra loro (ognuno con i suoi contatori e i suoi slot), al più `maxParalleli` in tutto;
- ogni task ha un worktree `.claude/worktrees/<txx>` sul branch `task/<Txx>` nato dal base, con il
  `node_modules` del base collegato (junction); il prompt è quello di `config.json`;
- `claude -p … --output-format json` / `agy -p … --output-format json`; ogni `controlloSecondi` guarda chi ha finito
  e lancia il prossimo;
- se l'uscita dice che il limite è finito, il task è `sospeso` con la sua sessione; quando il limite si resetta
  (l'ora che la CLI dice, o `attesaLimiteMinuti`) lo script riprende la stessa conversazione con
  «Ti sei fermato in questo punto, riprendi.» (`--resume` / `--conversation`), senza intervento umano;
- **i contatori** li legge da `claude -p /usage` e `agy -p /usage` (al più ogni `usoSecondi`, 300; `uso` li rilegge
  subito), entrambe le finestre: le **5 ore** e la **settimana**; per Antigravity un contatore per gruppo di modelli
  (`Gemini Models`, `Claude and GPT models`, `Gemini 4 Argon`…), e `contatori` in `config.json` (un'espressione
  regolare sul nome) dice quali contano per i modelli che la pipeline usa con `agy` (`gemini`: `^Gemini Models$`, `argon`: `^Gemini 4 Argon`); `stato` mostra anche i contatori che nessun provider usa (es. «Claude and GPT models» di Antigravity). Il budget di un provider è il contatore settimanale più basso; sotto
  `sogliaUnSolo` (anche nelle 5 ore) non parte nessun task nuovo e ne resta al più uno in corso; un contatore vuoto (settimana sotto la `riserva`, 5 ore a 0)
  ferma il provider fino al suo reset. Tutto in `PIANO.md`, sezione «Budget»;
- quando il task finisce scala la stima dal residuo fino alla lettura successiva e scrive una riga in `consumi.jsonl`
  (stima, costo in dollari se la CLI lo dice, minuti, tentativi, esito): confrontata con i contatori prima e dopo, serve a
  stimare meglio. Se `/usage` non risponde vale il residuo a mano (`budget <provider> <%>`), che torna a 100 a
  `resetSettimanale`.

I limiti non li gestiscono gli agenti: un task non si ferma a metà per risparmiare, è lo script che decide quanti
partono. Il merge nel base non lo fa chi esegue: dopo `ESITO: fatto` il task è in «Finiti, da guardare e integrare» di
`PIANO.md`; lo integra l'orchestratore quando l'autore glielo chiede (`orchestra.md`), o l'autore con `integra` (che toglie anche
worktree e branch). Le dipendenze contano come fatte solo quando il loro `fatto` è nel base: un task che sblocca altri va
integrato presto. Il diario di `orchestrazione.md` lo scrive lo script (lanci, esiti, limiti, integrazioni) e l'orchestratore
(`nota`, il passaggio di consegne).

**Verifica nel browser.** Se il «Fatto quando» di un task la chiede, chi esegue la fa e chiude con
`BROWSER: verificato|da verificare — …`, che `esegui` riporta nel diario.
- **Solo su Claude Code**: Claude gira con `--chrome` (`"browser": true` in `config.json`), che avvia un'istanza Chromium isolata ed espone gli strumenti del browser all'agente.
- **Perché agy non supporta la verifica nel browser (T87)**: in modalità non interattiva (`agy -p`), Antigravity CLI non ha il flag `--chrome` e non fornisce strumenti di navigazione/ispezione browser all'agente primario. Il subagente `/browser` si appoggia su Chrome DevTools cercando una porta attiva (`DevToolsActivePort`) sul profilo Chrome utente predefinito, ma da istruzioni non avvia Chrome direttamente; se Chrome non è già stato lanciato manualmente con `--remote-debugging-port`, la connessione fallisce. Pertanto da `agy -p` le verifiche nel browser non sono possibili.
- **Regola della pipeline**: la pipeline riconosce i task che richiedono una verifica nel browser (o screenshot): non li invia mai ad agy (`gemini` o `argon`), non li fa ripiegare sulle alternative non-browser e li assegna esclusivamente a `claude`. Se un task con browser è configurato su un provider senza browser, la pipeline lo blocca.

**Permessi.** In `config.json` le CLI girano con `--dangerously-skip-permissions`: niente prompt, perché nessuno
risponde. Ogni task è nel suo worktree, ma l'agente ha la shell: toglilo (e dai un allowlist in
`.claude/settings.json`) se non lo vuoi.

## La traccia di un task

Ogni esecuzione lascia la conversazione intera dove la tiene la sua CLI, anche dopo che il worktree è tolto: Claude in
`~/.claude/projects/<cartella del worktree>/<sessione>.jsonl` (si riapre con `claude --resume <sessione>` dalla cartella del
worktree), Antigravity in `~/.gemini/antigravity-cli/conversations/<id>.db` (SQLite; `agy --conversation <id>`). L'id è in
`.pipeline/esecuzioni.json`, l'uscita finale in `.pipeline/log/<Txx>.<tentativo>.log`. `traccia <Txx>` li trova, dice se l'agente ha
avuto `AGENTS.md` (Claude lo riceve da `CLAUDE.md`, che lo importa; Antigravity lo apre) e stampa il suo riepilogo finale.
**L'orchestratore** riporta all'autore, per ogni task finito, l'esito e il riepilogo di `traccia`.

## Regole per chi esegue un task (ambiente condiviso)

Altri agenti, di altri provider, lavorano nello stesso repository nello stesso momento.

1. Lavora solo nel tuo worktree e sul tuo branch (`task/<Txx>`); niente merge, push, `git stash` né `checkout` di
   altri branch; non toccare gli altri worktree né la cartella principale. Unica eccezione: un task «Integrare Txx» fa
   `git merge task/Txx` nel suo branch, risolve i conflitti (l'ADR che entra prende il primo numero libero) e committa.
2. Se il tuo task nasce da un altro o lo cita (un bug di T63), leggi prima il suo dossier: `node tools/pipeline/pipeline.mjs dossier T63`.
3. Non pianificare il to-do e non toccare altri task del backlog: cambia solo il blocco del tuo (stato, esito).
4. Non fare domande e non aspettare risposte: se serve una decisione dell'autore scrivila in
   `docs/pipeline/domande/<Txx>.md` (contesto, domanda, opzioni con la tua raccomandazione), segna il task
   `in attesa`, committa e termina.
5. I numeri di ADR possono scontrarsi tra task paralleli: prendi il primo libero nel tuo branch; chi integra
   rinumera se serve.
6. Se il task chiede una verifica nel browser, falla (`AGENTS.md`, «Convalida nel browser»: porta libera, scheda tua, chiudi
   tutto alla fine); altri agenti usano lo stesso browser nello stesso momento.
7. Chiudi con `npm test` e `npm run typecheck` verdi, un commit sul tuo branch e la riga
   `ESITO: fatto|in attesa|fallito — <cosa è cambiato>` (e `BROWSER: verificato|da verificare — …` se il task la chiede).

## I worktree

Uno per task, `.claude/worktrees/<txx>` su `task/<Txx>`, nato dal base (`3d`, nel worktree storico
`step8.2A-lab3d`); il base resta quello in cui l'autore guarda e integra. Dopo `integra` il worktree si toglie con
`git worktree remove`. `node tools/pipeline/pipeline.mjs worktree` dice, per ogni worktree, quanti commit non sono
nel base (a meno di cherry-pick) e quanti file non sono committati.

Stato al 28/10/2026: `t20`, `t23-studio`, `t27a`, `t27b` sono tentativi paralleli di T20, T23, T27a, T27b, rifatti su
`3d`; restano 0-2 commit non portati ciascuno e `t23-studio` ha 9 file non committati. Da guardare e togliere a mano
(`git worktree remove <dir>`, poi `git branch -D <branch>`): nessuno script li cancella.
