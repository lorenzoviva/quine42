# QUINE42 (ex RUNE) — Design Doc & Bootstrap per Claude Code e Gemini

Oct 19, 2026 · @Lollo1

> Nome provvisorio iniziale: «Rune»; rinominato ufficialmente in «QUINE42» (ADR-0062). Le rune restano i token e la meccanica centrale del mondo. Documento da passare a Claude Code (e Gemini) come punto di partenza.
>
> *Documento originale dell'autore, conservato così com'è. Le decisioni prese in seguito sono negli ADR
> (`docs/adr/`) e riassunte in `AGENTS.md`, che ha la precedenza.*

## 0. Il gioco: concept, obiettivo e flavor

### L'idea di partenza

Questo gioco nasce da un'idea che l'autore ha in testa da tempo e che fino a ieri era irrealizzabile: un mondo che contiene il proprio codice sorgente, dove chi gioca può accorgersene, toccarlo e riscriverlo. Il limite era sempre lo stesso: un mondo così ha bisogno di contenuti infiniti e coerenti, che nessun team può scrivere a mano. L'IA generativa colma esattamente questa lacuna: genera luoghi, immagini, storie, oggetti e perfino codice valido mentre il giocatore esplora. Non è un accessorio: è ciò che rende il gioco possibile.

È l'evoluzione di un progetto precedente, SYSTEM.exe, una storia narrativa generativa con immagini e scelte libere. Qui il salto è radicale: non più una storia raccontata, ma un mondo esplorabile la cui stessa natura è il codice.

### Cos'è il gioco, in una frase

Un gioco 2D top-down interamente fatto di rune, in cui sei dentro una simulazione: un tappeto ti riporta sempre al centro, così non raggiungi mai la corona di codice sorgente che, ferma, circonda tutto. Raccogliendo rune e componendo frasi di codice sul tappeto puoi fermarlo, e camminare fuori, fino al codice.

### La struttura spaziale: cerchio, tappeto e corona

- **Il cerchio centrale (la simulazione).** L'area in cui avviene la simulazione: luoghi, oggetti vivi, NPC, e anche rune da trovare.
- **Il tappeto.** Il giocatore si muove, ma in realtà resta fermo: il tappeto scorre in senso opposto ai suoi passi e lo riporta sempre al centro, generando la simulazione attorno a lui. Così non arriva mai al bordo. Riferimento: Rick and Morty, "M. Night Shaym-Aliens!".
- **La corona circolare (il codice sorgente).** Attorno al cerchio c'è un anello fermo, che non si muove mai, interamente composto da rune: è il codice sorgente dell'intero universo. Il giocatore non lo raggiunge né lo vede, perché il tappeto lo tiene al centro.
- **Tutto è rune.** Le rune non sono solo nella simulazione: la corona è fatta interamente di rune. Quelle sparse nel tappeto sono frammenti dello stesso alfabeto, che il giocatore può raccogliere.
- **L'uscita.** Componendo con le rune una frase di codice che ferma il tappeto (o ne rompe il meccanismo), il giocatore smette di essere riportato al centro: camminando raggiunge il bordo ed entra nella corona, dove il codice è visibile e modificabile.

### Le rune: frammenti vivi del codice

- Tutto l'universo è scritto in rune: la corona ne è interamente composta e contiene tutta la logica. Dentro il tappeto ci sono inoltre lettere e parole sparse, frammenti reali del codice che il giocatore può raccogliere.
- Le rune sono vive: sono legate ai simboli reali del codice. Esempio: una runa `x` isolata è la variabile globale della posizione X del giocatore (non quella del tappeto). Passandoci sopra il mouse appare il suo valore in quel momento.
- Questi indizi permettono al giocatore di capire, poco a poco, la grammatica dell'universo.
- Lo scopo: comporre sul tappeto frasi di codice di senso compiuto, per fermare il tappeto o rompere in qualsiasi altro modo il suo meccanismo. Fuori, nella corona, le stesse rune si spostano e riscrivono per modificare il gioco.

### L'arco dell'esperienza

1. **Abitante.** Il giocatore esplora un mondo che sembra infinito e coerente, con un tema narrativo (medievale, Tron, qualsiasi cosa). Cammina e cammina, ma qualcosa è strano: è sempre al centro di tutto.
2. **Il sospetto.** Trova rune: oggetti strani che reagiscono quando vengono disposti in un certo ordine sul tappeto. Il giocatore intuisce che il mondo è scritto, e che c'è un meccanismo che lo tiene dentro.
3. **La rottura.** Sperimentare con le rune è pericoloso: una combinazione sbagliata e la simulazione si spezza. Esistono infiniti modi per fermare il tappeto, e infiniti modi per rompere tutto prima di riuscirci.
4. **L'uscita.** Il tappeto si ferma. Per la prima volta il giocatore può raggiungere il bordo del cerchio, attraversarlo ed entrare nella corona: il codice sorgente dell'universo, i file, i prompt.
5. **Il creatore.** Fuori dalla simulazione la sfida cambia: modificare il gioco senza romperlo. Il giocatore può dialogare con l'agente IA che genera il mondo e chiedergli nuovi luoghi, nuove regole, un nuovo universo. Ogni universo diventa unico, con la propria storia di commit.

### Il flavor

- **Meraviglia e sospetto**: il mondo deve sembrare vivo e infinito, ma con piccole crepe che suggeriscono che c'è qualcosa sotto.
- **Fragilità**: il codice è potente e delicato. Ogni intervento ha un peso.
- **Il giocatore come hacker e poi come dio**: si parte da esploratore, si diventa programmatore della propria realtà.
- **Glitch come estetica**: quando le cose si rompono, si deve vedere e sentire, e deve essere affascinante, non frustrante.
- **Unicità**: nessun universo è uguale a un altro; visitare il mondo di un altro giocatore è visitare la sua versione della realtà.

Riferimenti di atmosfera: Matrix (la realtà come codice), Baba Is You (le regole come oggetti manipolabili), Tron (il mondo dentro il computer), Zelda classico per la semplicità top-down.

### Principi di design che ne derivano

- Grafica e fisica volutamente semplici: la profondità sta nel contenuto e nel codice, non nel motore.
- Il codice è vero: nessuna finzione, quello che c'è scritto sulla mappa si esegue.
- Il kernel è il pavimento dell'universo: si può rompere tutto tranne lui, così si può sempre ricominciare.
- Si parte da poco: uno scaffolding solido e un universo minimo, poi il mondo cresce generandosi.

## 1. Visione

Gioco 2D top-down, grafica semplice, contenuti illimitati generati da IA. Metagame: il giocatore vive in un mondo simulato. Il mondo è fatto di celle quantizzate; in alcune celle ci sono **rune**, che sono letteralmente i caratteri del codice sorgente del gioco. Quello che c'è scritto sulla mappa **si esegue, punto**. Raccogliendo e riposizionando rune il giocatore può alterare la simulazione, romperla, oppure uscirne e raggiungere il simulatore, dove può modificare il codice (e i prompt) del gioco, anche dialogando con un agente IA integrato nel mondo.

## 2. Decisioni prese

- **Logica nella corona**: il codice sorgente dell'intero universo vive nella corona circolare attorno alla simulazione, normalmente invisibile.
- **Rune nel tappeto**: lettere e parole sparse nella simulazione sono frammenti reali del codice, legati ai simboli effettivi (es. `x` = posizione X globale del giocatore, valore visibile al passaggio del mouse). Il giocatore le raccoglie e compone sul tappeto frasi di codice che si eseguono.
- **Il giocatore può rompere il gioco**: errori di sintassi o logica del giocatore sono voluti e hanno conseguenze reali.
- **L'IA non rompe mai il gioco**: tutto ciò che viene generato passa dal parser prima del commit; se invalido viene scartato e rigenerato. Le rune generate sono frammenti sensati e collegati al codice reale. Vincolo critico: le rune sparse nel tappeto sono già codice attivo, quindi ogni loro disposizione generata deve essere valida così com'è; altrimenti il gioco si romperebbe prima ancora che il giocatore possa vederle. Solo l'intervento del giocatore può introdurre errori.
- **Linguaggio**: Lua completo, eseguito in sandbox (es. wasmoon / Fengari nel browser).
- **Kernel intoccabile**: il kernel ("pavimento dell'universo") NON è scrivibile con le rune. Garantisce che un gioco rotto sia sempre recuperabile.
- **Un universo per giocatore**: ogni giocatore ha il proprio repository (commit, storia). Multiplayer aperto come visita dei mondi altrui; in futuro fork e merge.
- **Tema narrativo configurabile via prompt** (es. Tron, medievale). Costanti: tappeto, corona, rune, possibilità di uscire.

## 3. Architettura

### 3.1 Livelli

1. **Kernel (TypeScript, immutabile dal gioco)**: game loop, rendering 2D a tile, input, griglia/chunk, registro plugin, event bus, host della sandbox Lua, versionamento (commit/rollback), parser/validatore, gateway verso i modelli IA.
2. **Runtime Lua (riscrivibile con le rune)**: sistemi di gioco, moduli di contenuto, prompt di generazione.
3. **Universo di prova**: un set minimo di moduli Lua per avere da subito un mondo giocabile.

### 3.2 ECS e hot reload

- **Entità**: solo ID.
- **Componenti**: solo dati (posizione, sprite, fisica, spawn, ecc.). Lo stato vive qui, nel kernel.
- **Sistemi**: logica Lua senza stato. Hot reload = sostituzione della funzione; il mondo resta intatto e al frame successivo gira la logica nuova. Mai riavviare il runtime.

### 3.3 Moduli / plugin

Ogni contenuto (oggetto, NPC, luogo, personaggio, sistema) è un **modulo autosufficiente** con manifest che dichiara:

- logica (Lua)
- aspetto grafico (sprite/prompt immagine)
- fisica e interazioni
- regole di comparsa (luoghi, condizioni)
- prompt di generazione

I moduli sono importabili, esportabili e rimovibili a runtime, agnostici rispetto all'ambiente, senza dipendenze implicite (comunicano tramite componenti ed eventi).

### 3.4 Mondo, rune e codice

- Spazio a celle quantizzate, interamente composto da rune. Due zone: il cerchio di simulazione al centro e la corona del codice attorno, ferma nello spazio.
- Tappeto: finché è attivo, ogni passo del giocatore viene compensato da uno scorrimento opposto che lo riporta al centro; la simulazione si genera attorno a lui e il giocatore non raggiunge mai la corona.
- Corona: fatta di celle-runa che contengono il codice sorgente, con celle speciali per fine file (EOF) e struttura di file e cartelle. Mappatura deterministica corona → file sorgente.
- Rune nel tappeto: entità legate a simboli reali del codice (binding verso variabili e funzioni), con tooltip sul valore corrente.
- Frasi composte con le rune sul tappeto: validate ed eseguite nella sandbox; possono alterare o fermare il tappeto.
- Tappeto fermo: il giocatore cammina fino al bordo ed entra nella corona, dove modifica il codice spostando rune; ogni modifica ricostruisce i file, li valida e li ricarica a caldo.
- Codice invalido scritto dal giocatore: il kernel isola l'errore, la simulazione entra in uno stato "rotto" visibile, rollback sempre possibile all'ultimo commit valido.

### 3.5 Pipeline di generazione IA

- Generazione anticipata dei chunk vicini al giocatore.
- Immagini via inpainting usando come contesto i bordi dei chunk adiacenti, la narrativa e le descrizioni del luogo (niente generazione da zero, niente memoria di tutte le celle).
- Testo, narrativa e codice dei moduli generati da LLM, sempre validati.
- Il gateway IA è esposto anche dentro il mondo: oltre la simulazione il giocatore può chiedere all'agente di generare luoghi o logiche.

## 4. Scope della prima iterazione

1. Kernel: loop, rendering tile, input, chunk, ECS, sandbox Lua con hot reload, event bus, registro plugin.
2. Versionamento locale (commit/rollback) dell'universo.
3. Mappatura rune ↔ file sorgente + validatore.
4. Universo di prova minimo: giocatore, movimento, qualche oggetto e NPC, alcune rune sparse valide.
5. Gateway IA con stub/mock (provider reali in seguito).

Fuori scope per ora: multiplayer, fork/merge, uscita completa dalla simulazione.

## 5. Istruzioni bootstrap per Claude Code

Come primo passo, Claude Code deve:

- Creare **`AGENTS.md`** come unica fonte di verità per gli agenti: visione, decisioni della sezione 2, architettura, convenzioni, comandi di build/test, regole ("il kernel non è mai modificabile da Lua", "ogni contenuto generato passa dal validatore", "stato nei componenti, logica stateless").
- Creare **`CLAUDE.md`** che importa/rimanda ad `AGENTS.md` più eventuali note specifiche per Claude Code.
- Creare **`GEMINI.md`** (file di contesto di Gemini CLI) con lo stesso contenuto o un rimando ad `AGENTS.md`.
- Creare `docs/` con questo design doc e un registro delle decisioni (ADR).
- Mantenere `AGENTS.md` aggiornato a ogni decisione architetturale.

## 6. Prompt iniziale per Gemini

> Sei un collaboratore al progetto RUNE, un gioco 2D top-down in cui il mondo è composto dal codice sorgente del gioco stesso sotto forma di rune. Leggi `AGENTS.md` e `docs/` prima di qualsiasi lavoro. Rispetta queste regole: il kernel TypeScript è immutabile dal gioco; tutta la logica di gioco è in Lua, eseguita in sandbox e ricaricata a caldo; lo stato vive nei componenti ECS, i sistemi sono stateless; ogni contenuto è un modulo autosufficiente con manifest; ogni rune o codice generato dall'IA deve passare dal validatore e non può mai rompere il gioco, mentre il giocatore può farlo. Ogni universo è un repository indipendente. Quando prendi una decisione architetturale, aggiornala in `AGENTS.md` e in un ADR in `docs/`.

## 7. Domande aperte

- Nome definitivo del gioco.
- Tema dell'universo di prova.
- Provider IA per immagini e testo.
- Cosa vede il giocatore quando il gioco si rompe.
- Meccanica di uscita dalla simulazione.
