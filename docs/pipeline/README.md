# La pipeline agentica (ADR-0072)

Il lavoro sul kernel va avanti da solo: richieste dell'autore → task → piano → esecuzione in parallelo su
Claude Code e Gemini (Antigravity CLI), ciascun task nel suo worktree, entro i limiti di consumo di ogni provider.

```
docs/userchats/to-do.md        (1) le richieste dell'autore, testo libero, con «> Provider proposto: …»
  └─ docs/pipeline/domande/Txx.md   (2, facoltativa) lo scambio: l'agente chiede, l'autore risponde nello stesso file
docs/plans/backlog.md          (3) i task, uno per sessione; ogni task pianificato ha la riga «- Pipeline:»
docs/pipeline/PIANO.md         (4) il piano: le code per provider (generato dallo script, non toccarlo)
.pipeline/                     (5) l'esecuzione: esecuzioni.json, budget.json, log/ (locale, ignorato da git)
docs/pipeline/consumi.jsonl        lo storico dei consumi, per stimare meglio
```

Al posto di PLAN_CLAUDE.md/PLAN_GEMINI.md/TASK_*.md c'è **una sola fonte**, il backlog: il provider e la stima
stanno nel task, le code per provider sono sezioni di `PIANO.md`, l'esecuzione è stato locale. Così nessun task
(fatto o da fare) si perde e non ci sono due file da tenere allineati.

## Le fasi 1-4: la pianificazione (un agente)

Si lancia dal prompt di Claude Code (`/pipeline`, eventualmente con un filtro: `/pipeline solo le richieste per Claude Code`)
o di Antigravity («Lancia la pipeline: segui `docs/pipeline/pianifica.md`»). L'agente segue
[`pianifica.md`](pianifica.md): to-do → backlog, sblocca gli `in attesa` con risposta, stima e assegna, poi
`node tools/pipeline/pipeline.mjs stato`. Si committa sul branch base (`3d`).

La riga che la pianificazione scrive in ogni task:

```
- Pipeline: claude · stima 4% · approvato · priorità 2
```

`claude | gemini`; la stima è la percentuale del limite **settimanale** del provider; `approvato` manca finché
l'autore non approva (con `"approvazione": "manuale"` in `config.json`; con `"auto"` tutto parte); `priorità` (più
bassa prima, 100 se manca). Se l'autore ha scritto il provider nella richiesta, la pianificazione lo usa e scrive
già `approvato`. Per approvare basta aggiungere `· approvato` alla riga.

## La fase 5: l'esecuzione (uno script)

```bash
node tools/pipeline/pipeline.mjs stato                  # rigenera PIANO.md e stampa le code
node tools/pipeline/pipeline.mjs budget claude 40       # il residuo attuale (%) del limite settimanale
node tools/pipeline/pipeline.mjs esegui [--max 5] [--solo claude|gemini] [--task T43b]
node tools/pipeline/pipeline.mjs worktree               # i worktree, cosa resta in ciascuno
node tools/pipeline/pipeline.mjs integra T43b           # merge --no-ff di task/T43b nel base (lo lancia l'autore)
```

`esegui` gira finché c'è qualcosa da fare (lascialo in un terminale a parte, o in background):

- lancia i task **pronti** (dipendenze `fatto` nel base, approvati, con stima) fino a `maxParalleli` (5), se la
  stima sta nel residuo del provider meno ciò che i task in corso hanno già impegnato e la `riserva`;
  sotto `sogliaUnSolo` (10 %) un solo task per provider;
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
  regolare sul nome) dice quali contano per i modelli che la pipeline usa con `agy` (oggi `^Gemini Models$`; se aggiungi
  `--model` con Argon, aggiungi il suo). Il budget di un provider è il contatore settimanale più basso; sotto
  `sogliaUnSolo` (anche nelle 5 ore) parte un task alla volta; un contatore vuoto (settimana sotto la `riserva`, 5 ore a 0)
  ferma il provider fino al suo reset. Tutto in `PIANO.md`, sezione «Budget»;
- quando il task finisce scala la stima dal residuo fino alla lettura successiva e scrive una riga in `consumi.jsonl`
  (stima, costo in dollari se la CLI lo dice, minuti, tentativi, esito): confrontata con i contatori prima e dopo, serve a
  stimare meglio. Se `/usage` non risponde vale il residuo a mano (`budget <provider> <%>`), che torna a 100 a
  `resetSettimanale`.

I limiti non li gestiscono gli agenti: un task non si ferma a metà per risparmiare, è lo script che decide quanti
partono. Il merge nel base non lo fa nessun agente: dopo `ESITO: fatto` l'autore guarda il branch e lancia `integra`
(le dipendenze contano come fatte solo quando il loro `fatto` è nel base).

**Permessi.** In `config.json` le CLI girano con `--dangerously-skip-permissions`: niente prompt, perché nessuno
risponde. Ogni task è nel suo worktree, ma l'agente ha la shell: toglilo (e dai un allowlist in
`.claude/settings.json`) se non lo vuoi.

## Regole per chi esegue un task (ambiente condiviso)

Altri agenti, di altri provider, lavorano nello stesso repository nello stesso momento.

1. Lavora solo nel tuo worktree e sul tuo branch (`task/<Txx>`); niente merge, push, `git stash` né `checkout` di
   altri branch; non toccare gli altri worktree né la cartella principale.
2. Non pianificare il to-do e non toccare altri task del backlog: cambia solo il blocco del tuo (stato, esito).
3. Non fare domande e non aspettare risposte: se serve una decisione dell'autore scrivila in
   `docs/pipeline/domande/<Txx>.md` (contesto, domanda, opzioni con la tua raccomandazione), segna il task
   `in attesa`, committa e termina.
4. I numeri di ADR possono scontrarsi tra task paralleli: prendi il primo libero nel tuo branch; chi integra
   rinumera se serve.
5. Chiudi con `npm test` e `npm run typecheck` verdi, un commit sul tuo branch e la riga
   `ESITO: fatto|in attesa|fallito — <cosa è cambiato>`.

## I worktree

Uno per task, `.claude/worktrees/<txx>` su `task/<Txx>`, nato dal base (`3d`, nel worktree storico
`step8.2A-lab3d`); il base resta quello in cui l'autore guarda e integra. Dopo `integra` il worktree si toglie con
`git worktree remove`. `node tools/pipeline/pipeline.mjs worktree` dice, per ogni worktree, quanti commit non sono
nel base (a meno di cherry-pick) e quanti file non sono committati.

Stato al 28/10/2026: `t20`, `t23-studio`, `t27a`, `t27b` sono tentativi paralleli di T20, T23, T27a, T27b, rifatti su
`3d`; restano 0-2 commit non portati ciascuno e `t23-studio` ha 9 file non committati. Da guardare e togliere a mano
(`git worktree remove <dir>`, poi `git branch -D <branch>`): nessuno script li cancella.
