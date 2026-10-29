
# Modifiche da valutare

Le seguenti modifiche sono ancora da valutare.

# Modifiche da fare

Le seguenti modifiche non sono ancora state pianificate. Le porta nel backlog la pipeline (`/pipeline` in Claude Code, «lancia la pipeline» in Antigravity; vedi `docs/pipeline/README.md`), che stima, sceglie il provider e le esegue con `node tools/pipeline/pipeline.mjs esegui`.
Per ogni richiesta, facoltativi: `> Provider proposto: Claude Code | Antigravity` (adottato e approvato subito), `> Priorità: <n>`, `> Dipende da: <richiesta o Txx>`. Se la pipeline ha domande, le scrive in `docs/pipeline/domande/Txx.md`: rispondi lì.

<!-- Pianificate il 22/10/2026 in docs/plans/backlog.md (testo originale: docs/userchats/to-do-2026-10-22.md). -->
<!-- Pianificate il 24/10/2026 in docs/plans/backlog.md, T49-T57 (testo originale: docs/userchats/to-do-2026-10-24.md). -->
<!-- Pianificate il 24/10/2026 (sera) in docs/plans/backlog.md, T58 (testo originale: docs/userchats/to-do-2026-10-24.md, «Luci del Nucleo e del silos»). -->
<!-- Pianificate il 25/10/2026 in docs/plans/backlog.md, T59 (testo originale: docs/userchats/to-do-2026-10-25.md, «Laboratorio: editor per modelli MarkovJunior»). -->

# Introdurre i modelli disegnati a mano da me 

sostituire i modelli dei files (md, json, lua) con quelli disegnati da me:
- schermo-scritte per gli md e i files non strutturati (piatto, semplice)
- schermo-struttura per i json e i file strutturati (3D, non leggero da generare)
- circuito-3D per i lua (3D, pesante da generare e da animare) -> vedi prossimo punto
Vorrei che questi modelli siano presi come spunto per generare i modelli futuri quando chiedo "tanta varietà" e "alta qualità". 
Inoltre ho anche rifatto il modello del drone, aumentando la risoluzione di due volte.
Utilizza drone-xl per il drone

> Provider proposto: Antigravity   

# Ottimizzazione della generazione del MJ e delle animazioni - Preloading dei modelli 3D e dei frames delle animazioni

Non so se già è il caso ma si potrebbe ottimizzare sia la generazione che le animazioni per i modelli pesanti facendo preloading di un seed e memorizzando il modello 3D statico generato e i vari frames. Il circuito 3D, ma anche gli altri modelli che ho disegnato, fanno molto uso dell'espressività di MJ e ogni seed genera risultati fortemente diversi tra loro, conviene sfruttare questa diversità e mostrare ai giocatori molte varianti. 

> Provider proposto: Antigravity   

# Lessico di Quine42, realistico ma bizzaro

Voglio implementare un linguaggio, solo alcune parole verrebbero sostituite. Gli universi generati saranno molti e diversi tra loro. Un giorno anche un ambientazione moderna, steampunk, futuristica. Voglio che ci sia un filo conduttore, una sorta di easter egg, un insieme di usanze, costumi, modi di dire, espressioni gergali e bon ton che rimangono costanti nonostante il cambio di ambientazione. voglio che il giocatore perpecisca una società credibile, non tanto diversa dalla nostra, ma diversa, e che questa diversità lo porti a pensare alle nostre stranezze come esseri umani. Le nostre usanze possono essere altrettanto bizzarre per qualcuno che arriva da un'altro universo.

> Provider proposto: Claude Code   

<!-- Pianificate il 28/10/2026 in docs/plans/backlog.md, T61 (testo originale: docs/userchats/to-do-2026-10-28.md, «Strutturare meglio l'ambiente di sviluppo agentico» e «Automatizzare il lavoro agentico»). -->

# Riorganizzare i file di documentazione e di sviluppo


Dobbiamo rimettere a posto le directory sotto docs/, la metodologia di sviluppo è passata da un singolo thread di Claude Code a un approccio basato su steps, poi to-do e backlog e infine, ora, lo stiamo cambiando nuovamente per andare verso un approccio basato su pipeline, multi-worktree, e distribuizione del carico (fatto in T61: `docs/pipeline/README.md`, ADR-0072; la richiesta originale è in `docs/userchats/to-do-2026-10-28.md`). `docs/pipeline/`, `tools/pipeline/`, `docs/plans/backlog.md` e `docs/userchats/to-do.md` sono la metodologia attuale e restano dove sono (la pipeline li legge da lì). Voglio che la documentazione relativa a tutte le metodologie precedenti siano archiviate in cartelle ben organizzate e con un resoconto, a livello di root, dell'approccio utilizzato e dei files presenti. Voglio che i files rimangano quelli originali, nessun refactoring dei link interni ad altri documenti. Le sostituzioni da effettuare (dove trovare veramente il file citato) verranno riportate nel resoconto. 

> Provider proposto: Antigravity

# Il grafo delle conversazioni

Mi serve capire quali conversazioni avvengono con le API di Gemini e come vengoo costruiti i prompt. 
Al termine della prima fase di sviluppo di questo gioco tradurremo il tutto in quattro lingue. La fase I del progetto verrà considerata conclusa quando il kernel avrà le funzionalità di base, il multiplayer funzionerà e ci sarà account management, crediti utente, il sistema di carte, e tre quattro universi "vanilla" in italiano. Per tradurre il gioco sarà necessario avere i riferimenti a tutti i testi, compresi quelli delle interazioni con Gemini, eventualmente raccogliendoli a fattor comune (files md, yaml, json o properties).
Per i grafi voglio che vengano espressi in mermaid.

> Provider proposto: Antigravity

# Processo di sviluppo universo tramite abbonamento

Il punto precedente, inoltre, apre la strada verso un nuovo modo di generare gli universi.
Abbiamo suddiviso il gioco in due componenti software. Da una parte il kernel con le funzionalità di base, l'engine, il 3D la corona etc. Questo espone primitive e funzionalità implementabili in lua all'interno dell'universo. Dall'altra parte l'universo in corso di generazione, in "sessione", che gira su server in caso di multiplayer (ora non so, ma credo che in single gira tutto sul client). In ogni caso sono componenti software distinti, ogniuno con il proprio versionamento. Ad oggi l'ambiente di sviluppo del kernel è misto gemini antigravity e claude code, tutto da desktop. L'ambiente di sviluppo dell'universo, ovvero dei vari moduli, della narrativa e dei vari contenuti di gioco, è gestito interamente tramite dagli agenti del concilio, che sono interpretati dai modelli di Gemini chiamando API a consumo. 
Una volta che avremo centralizzato queste chiamate ad API, possiamo fare un passo ulteriore e generalizzarle per farle "girare su server", ovvero alimentate da CLI Claude Code o Gemini Antigravity. Possiamo riadattare il metodo di sviluppo del kernel per venire in contro alla necessita di generare i contenuti dell'universo quasi in real-time. Quindi per esempio facendo lei "loop" su claude code molto frequenti sulla coda delle richieste in modo da evaderle in fretta.
La base c'è già nella pipeline del kernel (T61, `tools/pipeline/pipeline.mjs`): `claude -p` / `agy -p` lanciati da uno script, i contatori letti da `/usage` (5 ore e settimana, per gruppo di modelli in Antigravity), il parallelismo entro il budget, la ripresa dopo un limite. Per l'universo va adattata a una coda di richieste del Concilio (al posto del backlog) con risposte in secondi, non task da ore.
In questo modo possiamo sfruttare gli abbonamenti ai providers. Per gli sviluppi e la prototipazione mi farà risparmiare molto.
Inoltre avendo un repository pubblico, permetterò agli sviluppatori in possesso di un abbonamento Claude o Gemini (o entrambi), di sfruttarli per la generazione e provare il gioco in locale scaricandolo dal repository. Voglio che la community di sviluppatori sia incentivata a provarlo.

> Provider proposto: Claude Code

# Grafica a cartone

Ho visto questo gioco su reddit (https://www.reddit.com/r/ClaudeGameDev/comments/1x2ldgg/stompworks_a_small_books_worth_of_prompts_in/) realizzato con claude code, adoro la grafica, mi piacerebbe che l'universo generato sia così. Ho messo una foto in questa cartella: docs\userchats\grafica_cartone.png

> Provider proposto: Claude Code
