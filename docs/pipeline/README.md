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
1. **Chat e Orchestra**: chat con l'orchestratore (`.pipeline/orchestra/chat.jsonl` + `coda.json`), eventi (`eventi.jsonl`), il quadro (`quadro.md`) e il diario (`orchestrazione.md`). Nei messaggi della chat un riferimento a un task esistente (`T93`) è sottolineato a puntini: col mouse sopra si legge il titolo, col clic si apre il dettaglio. Sotto, **gli ultimi finiti** (T304): i 15 task `fatto` più recenti, in alto il più nuovo, con quando (integrato, o finito, o la data del commit), il commit (quello nel titolo del backlog, o l'ultimo `Txx: …` della storia, `git log` letto al più ogni 20 s) e la riga dell'esito, che si apre intera al clic.
2. **Lavagna e Tabella**: lavagna Kanban a colonne con le code di `PIANO.md` (In corso, Finiti da integrare, Pronti, Da approvare / stimare, Bloccati, In attesa) e tabella filtrabile di tutti i task del backlog. Il titolo di una tile (e della tabella) è Markdown in linea, e ogni `Txx` o `txx` di un task esistente apre quel task (T304). In alto a destra di ogni tile, dopo provider e stima: la **priorità** (scala logaritmica, rossa la più alta, blu da 100), lo **sforzo** (del task, della sua esecuzione o del provider; una scala da `low`, verde acqua, a `max`, magenta; senza sforzo nessuna etichetta) e lo **step** (un colore da un hash del numero, sempre lo stesso; senza step nessuna etichetta); i colori in `tools/pipeline/tiles.mjs`.
3. **Dettaglio di un task**: dossier completo (`dossier`), log dell'esecuzione (`log/<Txx>.<tentativo>.log`) e **conversazione in diretta** dell'agente che sta lavorando (letta dal `.jsonl` di Claude o da `transcript.jsonl` di Antigravity).
4. **Azioni dirette**: approvare (`approva`), assegnare provider/stima/priorità (`assegna`), interrompere (`interrompi`), riprendere (`riprendi`) e integrare (`integra`).
5. **Domande & To-Do**: rispondere alle domande in `docs/pipeline/domande/*.md` e aggiungere o modificare richieste in `docs/userchats/to-do.md`.
6. **Budget & Consumi**: i contatori a 5 ore e settimanali di ogni provider (`.pipeline/budget.json`, rilettura `/usage` o impostazione manuale `budget`) e lo storico di `docs/pipeline/consumi.jsonl`; i piani di abbonamento e «Può orchestrare» per provider (`POST /api/config`, salvati in `config.json`, valgono subito).

| Nel terminale | |
|---|---|
| un messaggio | va all'orchestratore (se sta rispondendo, al turno dopo) |
| `/stato` | le code e i contatori |
| `/agente argon` | l'orchestrazione passa ad Argon (una conversazione nuova, dal quadro) |
| `/sospendi claude [fino a <data>]` | sospende temporaneamente i nuovi task al provider (senza toccare quelli in corso) |
| `/riattiva claude` | riattiva l'assegnazione di nuovi task al provider |
| `/epoca` | una conversazione nuova sullo stesso provider |
| `/ferma ora` (o Ctrl+C) | interrompe i task in corso tenendo la loro conversazione e spegne; al riavvio riprendono da soli (un secondo Ctrl+C esce subito) |
| `/ferma dopo` | niente lanci nuovi: aspetta che i task in corso finiscano e spegne |
| `/esci` | chiude il processo; i task in corso continuano e al prossimo avvio li ritrova |

**Epoche e crediti.** La conversazione dell'orchestratore è un'epoca: ne parte una nuova quando il contesto supera il 35 % della
finestra del modello (`orchestra.rotazione`), quando i crediti del suo provider finiscono o scendono sotto `sogliaUnSolo` (passa al prossimo di
`orchestra.ordine` in `config.json` che abbia `orchestrabile` e un piano attivo, e torna al primo quando ha di nuovo crediti), o quando lo chiedi. Nessun turno
di chiusura: l'orchestratore tiene il quadro aggiornato nei turni normali, e la nuova epoca parte da quadro, ultimi messaggi ed eventi non consegnati. Se i
crediti finiscono a metà turno, il turno passa intero al provider successivo. Sul provider dell'orchestratore, sotto la soglia,
non parte nessun task.

**Spegnere** (ADR-0090). `ferma --ora` e `ferma --dopo` (dal terminale, da `/ferma`, dalla chat web o dall'orchestratore quando glielo
chiedi: «chiudi ora tutti i task e spegni», «aspetta che finiscano e spegni») scrivono la richiesta in `.pipeline/arresto.json`; il
processo che fa girare la pipeline la vede entro un secondo e si spegne lasciando `.pipeline/spegnimento.json`. Al riavvio gli interrotti
riprendono la loro conversazione, un task finito mentre la pipeline era spenta (l'esito è nel suo log) si chiude invece di ripartire, e la
pagina di avvio dell'epoca nuova dice all'orchestratore cosa era in corso, cosa è stato interrotto e cosa è finito nel frattempo.

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
node tools/pipeline/pipeline.mjs sospendi claude [fino a <data>] # non dà nuovi task a Claude fino a revoca o scadenza (T96)
node tools/pipeline/pipeline.mjs riattiva claude         # riattiva l'assegnazione di nuovi task a Claude
node tools/pipeline/pipeline.mjs esegui [--sempre] [--max 5] [--solo claude|gemini|argon] [--task T43b]
node tools/pipeline/pipeline.mjs worktree               # i worktree, cosa resta in ciascuno
node tools/pipeline/pipeline.mjs traccia T43b           # la conversazione dell'agente (id, file, come riprenderla), consumo, ultime azioni, riepilogo
node tools/pipeline/pipeline.mjs traccia orchestratore  # le epoche dell'orchestratore (provider, turni, token, costo) e la conversazione in corso
node tools/pipeline/pipeline.mjs integra T43b           # merge --no-ff di task/T43b nel base, poi toglie worktree e branch
node tools/pipeline/pipeline.mjs riprendi T51           # rimette in coda un task fermato o interrotto: riprende la sua conversazione (o riparte da capo, vedi sotto)
node tools/pipeline/pipeline.mjs interrompi T51         # ferma un task in corso (o --tutti), tenendo la conversazione
node tools/pipeline/pipeline.mjs ferma --ora            # spegne la pipeline: interrompe i task (riprendono al riavvio); --dopo aspetta che finiscano
node tools/pipeline/pipeline.mjs dossier T63            # tutto di un task: blocco, esecuzione, commit, file, ADR, task collegati
node tools/pipeline/pipeline.mjs indice                 # una riga per task
node tools/pipeline/pipeline.mjs assegna T69 argon 6 60 [--sforzo high] [--approva]   # la riga Pipeline: provider, sforzo, stima, priorità
node tools/pipeline/pipeline.mjs approva T69            # aggiunge «approvato»
node tools/pipeline/pipeline.mjs step 31                # i task dello step 31 (docs/fasi.md, ADR-0128)
node tools/pipeline/pipeline.mjs step 31 --priorita 1   # porta a quella priorità i suoi task non finiti (anche se non stimati: `assegna` la tiene)
node tools/pipeline/pipeline.mjs step 31 T152 T153      # la riga `- Step: 31` di quei task, a mano
node tools/pipeline/pipeline.mjs step --da-tabella      # mette i tag leggendo la tabella di docs/fasi.md; rifatto non cambia nulla
node tools/pipeline/pipeline.mjs prossimo               # il primo numero di task libero
node tools/pipeline/pipeline.mjs orchestratore argon    # su quale provider gira l'orchestratore (lo scrive orchestra da solo)
node tools/pipeline/pipeline.mjs nota "testo"           # una riga nel diario di orchestrazione.md
```

`integra` prima dà un numero nuovo agli ADR del task il cui numero è stato preso nel base (file, riferimenti in ciò che il branch ha cambiato, indice: un commit sul branch del task), poi fa il merge e, nello stesso commit, scrive nel blocco del backlog stato ed esito dalla riga `ESITO` del task (`fatto` con l'hash; `in attesa` resta tale; `fallito` non cambia lo stato). L'indice `docs/adr/README.md` si fonde con `merge=union` (`.gitattributes`): le righe di due task restano entrambe. Su un conflitto che resta annulla il merge e lascia il base com'era (dice i file): la risoluzione la fa un agente, in un task.

**Abbonamenti** (ADR-0119). `abbonamenti` in `config.json` dice il piano attivo (`claude`: `pro`, `max5x`, `max20x`, `nessuno`; `google`: `pro`, `ultra`, `nessuno`); `piani` dice per ciascuno `moltiplicatoreStima` (quanto pesano le stime del backlog, scritte sul piano di riferimento Max 5x / Ultra) e `disponibili` (i provider che comprende: uno fuori ha tetto 0, i suoi task sono bloccati e `assegna` lo rifiuta). Ogni provider dice il suo `abbonamento`, `orchestrabile` e `ratioSessioneSettimana` (quanti punti della sessione di 5 ore vale un punto della settimana, misurato da `consumi.jsonl`: Claude 12, Fable 8 sul suo contatore, Gemini 3,3, Argon senza finestra; Sonnet e Haiku 12, provvisorio e non misurato; Opus e Sonnet su `agy` 2, da T268). Si cambiano al volo dalla pagina web.

**Modelli e sforzo** (ADR-0146). Ogni provider dice il suo `modello`, e `stato`, `indice`, `assegna`, `PIANO.md` e la pagina web lo mostrano: `claude` è Opus 5.5. La riga `- Pipeline:` può dire `sforzo low|medium|high|extra|xhigh|max`: `assegna --sforzo` lo scrive (senza, tiene quello di prima o prende `sforzoPredefinito`, `high`), al lancio arriva alla CLI (`--effort` su `claude`, con `extra` → `xhigh`; il suffisso del modello su `agy`, con `high`, `extra`, `xhigh` e `max` → `-high`), e `consumi.jsonl` lo registra. Come scegliere: [`pianifica.md`](pianifica.md) e [`modelli.md`](modelli.md).

**Un task che riparte da capo** (T256). Una voce di `.pipeline/esecuzioni.json` già integrata non vale più se il blocco del task non è chiuso (è tornato `da fare`; anche integrare un `fallito` o un esito senza riga lo lascia così: se non deve ripartire, chiudi il blocco): `esegui` lo lancia da solo, quando è pronto, con worktree, branch e conversazione nuovi e `tentativi` da capo. `riprendi` su quella voce, su una il cui worktree non c'è più o su una senza conversazione non riapre nulla: la porta allo stato `da capo` e lo dice; parte quando il blocco è `da fare` e pronto, e se il branch `task/<Txx>` esiste ancora riparte da lì. I tentativi di prima restano in `precedenti` della voce (provider, tentativi, stato, date, esito, sessione, worktree, log), `dossier` e `traccia` li mostrano e i log non si sovrascrivono (`<Txx>.d<n>.<tentativo>.log`). Un task `fatto` tiene la sua voce; una voce finita e non integrata resta da integrare.

**I task sopravvivono al processo.** La CLI di un task scrive direttamente nel suo log in `.pipeline/log/` ed è staccata dal
processo che la lancia; Claude ha l'id della sessione fissato prima di partire (`sessioneNuova`). Se il processo della pipeline
muore, al riavvio `esegui` segue i task ancora vivi e riprende la conversazione di quelli il cui processo non c'è più.

**L'orchestratore non resta senza crediti.** Il provider su cui gira l'orchestratore (`.pipeline/orchestratore.json`, lo scrive
`orchestra`; senza, `orchestratore` di `config.json`): sotto `sogliaUnSolo` (settimana o 5 ore) su di lui non parte **nessun** task
(sugli altri nessuno nuovo e al più uno in corso), così i task non consumano i crediti che servono all'orchestrazione. In Antigravity conta il modello che usa
(`argon` con Gemini 4 Argon, `gemini` con 3.8 Flash).

`esegui` gira finché c'è qualcosa da fare; con `--sempre` non si ferma mai: rilegge backlog e contatori a ogni controllo, e i task che pianifichi intanto partono da soli (lascialo in un terminale a parte):

- lancia i task **pronti** (dipendenze `fatto` nel base, approvati, con stima) entro gli **slot** del provider, se la
  stima scalata per il piano sta nel residuo del provider meno ciò che i task in corso hanno già impegnato e la `riserva`;
- **la finestra delle 5 ore** (ADR-0119): un task nuovo parte solo se la sessione, meno ciò che i task in corso sullo stesso conto dovrebbero consumare (tutta la loro stima, anche se sono a metà: è una stima prudente), regge il suo costo (stima scalata × `ratioSessioneSettimana`, al più 85), oppure se il contatore delle 5 ore si azzera entro 20 minuti, oppure se ha priorità 0. Morire a metà sul limite costa la cache del prompt. Queste eccezioni non superano `sogliaUnSolo`, che resta in vigore. Nessuno toglie `· approvato` per dosare i lanci;
- **tetti e slot** (ADR-0087): il tetto lo decide l'autore in `limiti` (`limiti.provider` per CLI, `claude` e `agy`;
  `limiti.modello` per voce di `providers`; oggi 1 ciascuno: un task su Claude e uno su `agy` alla volta); sotto il tetto gli
  **slot dinamici** (da 1 al tetto, T96): a ogni controllo la pipeline campiona il residuo settimanale (`budget.json → storia`,
  ultimi `giorniStoria` giorni) e prevede dal ritmo degli ultimi `giorniPrevisione` giorni quando la settimana arriva al 100 %;
  se cade dopo il reset settimanale (o il provider non consuma) aggiunge uno slot, se cade prima lo toglie (al più uno spostamento
  ogni `usoSecondi`), ma **mai sotto 1** (la previsione non chiude mai tutti gli slot di un modello; a 0 si va solo con crediti esauriti o quota 429);
  non sale oltre i task che il provider ha in programma (in corso, pronti, bloccati solo da altri task: non quelli
  in attesa dell'autore). La decisione di non dare nuovi task a un provider per un po' è dell'orchestratore (`sospendi <provider> [fino a <data>]` / `riattiva <provider>`).
  Sotto `sogliaUnSolo` (10 %, settimana o 5 ore) nessun task nuovo e al più uno in corso, nessuno su
  quello dell'orchestratore. Un task a **priorità 0** (le urgenze dell'autore) può usare uno slot in più, mai oltre il tetto.
  `stato` (e `PIANO.md`, l'interfaccia web) mostra per provider tetto, slot, sospensione, task in programma, esaurimento previsto e reset;
- **nessun ripiego** (ADR-0119): un task gira solo sul suo provider; se quello non ha slot o crediti, aspetta. Il ripiego automatico mandava task complessi su modelli meno capaci. Solo l'orchestratore o l'autore lo spostano, con `assegna`;
- **turni delle operazioni pesanti** (ADR-0088): in tutta la pipeline al più **una verifica nel browser**, **una suite intera** di vitest,
  **un typecheck** e **una build** alla volta; chi le vuole fare le lancia con `node tools/pipeline/pipeline.mjs turno browser|test|typecheck|build -- <comando>`, che aspetta il turno
  (in coda, nell'ordine d'arrivo), esegue il comando (il codice d'uscita è il suo) e lo lascia quando finisce. Test, typecheck e build scrivono tutto in `.pipeline/turno-<tipo>.log` del worktree e stampano solo le ultime 20 righe se passano, i blocchi di errore (al più 120 righe) se no, più il percorso del log; il browser tiene la sua uscita. Il semaforo è su disco,
  `.pipeline/lock/` della cartella principale (lo stesso per tutti i worktree): `<tipo>.json` dice chi lo tiene (task, comando, da
  quando), `<tipo>.attesa/` chi aspetta; un processo morto o un turno tenuto oltre `turni.<tipo>.massimoMinuti` (45 il browser, 60 i
  test, 10 typecheck e build) non blocca più. Un comando dentro un turno già tenuto non aspetta se stesso (`COVERS`, `coveredBy`): il browser copre
  build e typecheck, i test anche, la build il typecheck; lo stesso vale per un task la cui preview tiene il browser da un'altra shell. Sotto la pipeline vitest usa
  al più `turni.test.worker` (6, un worker per core fisico; a mano quelli di sempre, `server/testWorkers.ts`). `turno` da solo (e `stato`) dice chi tiene ogni turno. La pipeline poi non lancia insieme due task che chiedono
  il browser (nemmeno riprendendone uno) e distanzia i lanci nuovi di `intervalloLanciMinuti` (10) mentre altri sono in corso, così le
  loro suite finali non arrivano tutte insieme;
- i provider girano **in parallelo** tra loro (ognuno con i suoi contatori e i suoi slot), al più `maxParalleli` in tutto;
- ogni task ha un worktree `.claude/worktrees/<txx>` sul branch `task/<Txx>` nato dal base, con il
  `node_modules` del base collegato (junction); il prompt è quello di `config.json`, e prima di avviare la CLI la pipeline scrive nel worktree `.pipeline-task.md` (ignorato da git): il blocco del task, i dossier dei task da cui dipende o nasce, le regole qui sotto;
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
- **Regola della pipeline**: la pipeline riconosce i task che richiedono una verifica nel browser (o screenshot): non li invia mai ad agy (`gemini`, `argon`, `agy-opus`, `agy-sonnet`). Se un task con browser è configurato su un provider senza browser, la pipeline lo blocca e `assegna` lo rifiuta.

**Permessi.** In `config.json` le CLI girano con `--dangerously-skip-permissions`: niente prompt, perché nessuno
risponde. Ogni task è nel suo worktree, ma l'agente ha la shell: toglilo (e dai un allowlist in
`.claude/settings.json`) se non lo vuoi.

## La traccia di un task

Ogni esecuzione lascia la conversazione intera dove la tiene la sua CLI, anche dopo che il worktree è tolto: Claude in
`~/.claude/projects/<cartella del worktree>/<sessione>.jsonl` (si riapre con `claude --resume <sessione>` dalla cartella del
worktree), Antigravity in `~/.gemini/antigravity-cli/conversations/<id>.db` (SQLite; `agy --conversation <id>`). L'id è in
`.pipeline/esecuzioni.json`, l'uscita finale in `.pipeline/log/<Txx>.<tentativo>.log`. `traccia <Txx>` li trova, dice se l'agente ha
avuto `AGENTS.md` (Claude lo riceve da `CLAUDE.md`, che lo importa; Antigravity lo apre) e stampa il suo riepilogo finale.
Anche **mentre il task lavora** (T86): l'id e il comando per riprendere la conversazione (per seguirla o suggerire), il consumo finora
letto dalla trascrizione (chiamate, token nuovi, dalla cache, scritti in cache, in uscita; agy conta la cache dentro i token in ingresso)
e le ultime azioni. Claude ha l'id dall'avvio (`--session-id`); agy non lo accetta e lo dice solo alla fine, così la pipeline lo legge
dai file di Antigravity appena li scrive (`findAgyConversation`: la conversazione più recente, nata dopo l'avvio, la cui prima richiesta
nomina il worktree del task) e lo salva in `.pipeline/esecuzioni.json`. `traccia orchestratore` fa lo stesso per l'orchestratore: ogni
epoca in `.pipeline/orchestra/stato.json → epoche` con provider, motivo, conversazione, turni, token e costo (Claude), e per quella in
corso il file, il comando e le ultime azioni. Nell'interfaccia web la scheda «Conversazioni in corso» (`GET /api/conversazioni`) le
mostra tutte, con il consumo di ciascuna.
**L'orchestratore** riporta all'autore, per ogni task finito, l'esito e il riepilogo di `traccia`.

## Regole per chi esegue un task (ambiente condiviso)

Altri agenti, di altri provider, lavorano nello stesso repository nello stesso momento.

1. Lavora solo nel tuo worktree e sul tuo branch (`task/<Txx>`); niente merge, push, `git stash` né `checkout` di
   altri branch; non toccare gli altri worktree né la cartella principale. Unica eccezione: un task «Integrare Txx» fa
   `git merge task/Txx` nel suo branch, risolve i conflitti e committa.
2. Il tuo task e i dossier di quelli da cui dipende o nasce sono in `.pipeline-task.md`; per un altro task che cita (un bug di T63): `node tools/pipeline/pipeline.mjs dossier T63`.
3. Non pianificare il to-do. **Non leggere e non modificare `docs/plans/backlog.md`**: stato ed esito del tuo task li scrive la pipeline quando lo integra, dalla tua riga `ESITO`, che quindi deve dire tutto ciò che serve (cosa è cambiato, cosa manca, cosa non è provato). Un task «Integrare Txx» fonde anche il backlog, se quel branch lo tocca, senza altre modifiche.
4. Non fare domande e non aspettare risposte: se serve una decisione dell'autore scrivila in
   `docs/pipeline/domande/<Txx>.md` (sotto il titolo la riga `Stato: aperta`, poi contesto, domanda, opzioni con la tua raccomandazione), committa e termina con
   `ESITO: in attesa`. Chi chiude una domanda porta quella riga a `Stato: chiusa`: la pagina web conta le aperte da lì, e rispondere non basta a chiuderla.
5. I numeri di ADR possono scontrarsi tra task paralleli: prendi il primo libero nel tuo branch; `integra` rinumera da solo.
6. Se il task chiede una verifica nel browser, falla (`docs/architettura-dettagli.md#convalida-browser`: porta libera, scheda tua, chiudi
   tutto alla fine) nel suo turno: la preview con `node tools/pipeline/pipeline.mjs turno browser -- npx vite preview --port <n> --strictPort`
   in background; il browser è tuo finché la preview vive, fermarla lo lascia.
7. La suite intera dei test nel suo turno: `node tools/pipeline/pipeline.mjs turno test -- npm test` (un solo file di test, `npx vitest run
   <file>`, anche senza); il typecheck con `turno typecheck -- npm run typecheck`, la build con `turno build -- npm run build`. Aspettare il turno è normale: non aggirarlo.
8. Chiudi con `npm test` e `npm run typecheck` verdi, un commit sul tuo branch e la riga
   `ESITO: fatto|in attesa|fallito — <cosa è cambiato>` (e `BROWSER: verificato|da verificare — …` se il task la chiede).

## I worktree

Uno per task, `.claude/worktrees/<txx>` su `task/<Txx>`, nato dal base (`3d`, nel worktree storico
`step8.2A-lab3d`); il base resta quello in cui l'autore guarda e integra. Dopo `integra` il worktree si toglie con
`git worktree remove`. `node tools/pipeline/pipeline.mjs worktree` dice, per ogni worktree, quanti commit non sono
nel base (a meno di cherry-pick) e quanti file non sono committati.

Stato al 28/10/2026: `t20`, `t23-studio`, `t27a`, `t27b` sono tentativi paralleli di T20, T23, T27a, T27b, rifatti su
`3d`; restano 0-2 commit non portati ciascuno e `t23-studio` ha 9 file non committati. Da guardare e togliere a mano
(`git worktree remove <dir>`, poi `git branch -D <branch>`): nessuno script li cancella.
