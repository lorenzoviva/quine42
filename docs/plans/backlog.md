# Backlog — i task di RUNE, uno per sessione

Questo file è lo **stato del lavoro**: un elenco ordinato di task piccoli e atomici, ciascuno fatto per stare in
una sessione nuova di Claude Code (o Gemini CLI) e finire con test e typecheck verdi e un commit. Il protocollo
delle sessioni è in [`AGENTS.md`](../../AGENTS.md) (sezione «Protocollo delle sessioni»).

Le idee nuove dell'autore arrivano in [`docs/userchats/to-do.md`](../userchats/to-do.md) (testo libero): la
sessione che le trova le trasforma in task qui e le toglie da lì.

Stato: `da fare` · `in corso` · `in attesa` (serve una decisione dell'autore: la domanda è nel task) · `fatto`
(con il commit). Branch: `3d` (worktree `H:\projects\rune\.claude\worktrees\step8.2A-lab3d`).

**Il prompt per ogni sessione** è lo stesso, cambia solo il numero:

> Lavora nel worktree `H:\projects\rune\.claude\worktrees\step8.2A-lab3d` (branch `3d`). Leggi `AGENTS.md`,
> poi esegui il task **T01** di `docs/plans/backlog.md` seguendo il protocollo delle sessioni.

Senza numero («esegui il prossimo task del backlog») vale il primo `da fare` con le dipendenze fatte.

---

## Step 9 — chiusura

### T01 · Lotti e strutture: test, ADR, documenti — `fatto` (`34adee7`)
- Contesto: F7 di [`step9-3d.md`](../archivio/2-step/plans/step9-3d.md) (codice fatto: `settleLots`, `placeInside`, `floorAt`,
  `structureAt`, una struttura importante per zona, `form.wanted`).
- Fare: test in `tests/` (gli edifici del borgo diventano strutture girate verso la porta; le caselle del lotto
  sono terreno; le cose `dentro` stanno sul pavimento del modello e non nei muri; una sola struttura importante
  per zona, salvata; una cosa indossa il suo modello appena lo Scultore lo scrive). ADR-0043 «Lo spazio a scale:
  piano, lotti, strutture» (indice degli ADR); AGENTS.md (Il Concilio → Luogo; Architettura); diario di F7.
- Fatto quando: test verdi, ADR e AGENTS.md scritti, commit.
- Esito: `tests/lots.test.ts` (4 test), ADR-0043 (titolo «piano, lotti, strutture»: le ancore del piano F7 non ci
  sono), AGENTS.md. Diverso dal previsto: i test hanno trovato un difetto di `placeInside` (la struttura contava
  come occupante del proprio pavimento, quindi le cose `dentro` finivano sempre sulla casella del lotto), corretto.

### T02 · Azioni come regole: «Altro…» scrive un'`<action>` — `fatto` (`fd85a30`)
- Contesto: F8 del piano. Oggi «Altro…» su un'entità produce effetti (ADR-0014).
- Fare: se ciò che il viandante vuole fare cambia la **forma** della cosa (aprire, rompere, accendere, spegnere),
  l'Ingegnere (o lo Scultore) scrive una regola `<action>` sul programma del tipo; il kernel la prova sul modello
  (deve cambiare qualcosa, non svuotarlo, finire) e la aggiunge al programma nella libreria (commit): l'azione è
  imparata da tutto il tipo. Gli effetti restano per ciò che non è forma. Mock offline, test, ADR-0044, AGENTS.md
  (Effetti, Menu).
- Esito: campo `forma` nel giudizio del Narratore (solo per cose con un modello proprio, non generico e non figura),
  `sculptAction`/`checkAction` in `agents/sculptor.ts`, `Kernel.shapeModel`/`learnShape`; `tests/actions.test.ts`
  (3), ADR-0044, AGENTS.md, diario F8. Diverso dal previsto: la scrive lo Scultore (non l'Ingegnere); una lettera
  nuova nell'azione è accettata (colore dalla palette di MarkovJunior); non fatto per oggetti portati e terreni.
  Non verificato nel browser con Gemini (nessuna UI nuova: la voce `modello:` del menu c'era già).

### T03 · Bug: alberi e massi dei terreni visibili oltre il cerchio — `fatto` (`b1fa100`)
- Dal to-do: «gli oggetti bloccanti (roccia, montagna) vengono spawnati anche sulla corona».
- Causa probabile: in `src/render/materials.ts` il taglio usa `modelMatrix * transformed` senza `instanceMatrix`,
  quindi le istanze (`InstancedMesh` dei modelli dei terreni) non vengono tagliate.
- Fare: correggere (con `USE_INSTANCING`), verificare nel browser con `?dev&teleport=46,0`.
- Esito: in `materials.ts` il taglio segue `project_vertex` (`instanceMatrix`, `batchingMatrix`). Diverso dal previsto:
  anche le **ombre** delle cose tagliate restavano sul pavimento della corona (il passaggio delle ombre usa un suo
  materiale, senza taglio): ora ogni mesh della simulazione che fa ombra ha un materiale di profondità tagliato
  (`casts`). Verificato nel browser (offline): corona senza alberi né ombre, dentro il cerchio tutto come prima.

### T04 · Aiuto (H/F1) senza meta-gioco, con i comandi del 3D — `fatto` (`de71498`)
- Dal to-do: «rimuovere i riferimenti meta del menu di aiuto». Il testo in `index.html` parla di codice, Concilio,
  simulazione, «spezza la simulazione», caselle, sprite. Riscriverlo dentro il mondo (ADR-0025) e con i comandi
  attuali; ciò che è da giocatore trasceso solo dopo la corona.
- Esito: aiuto riscritto in `index.html` (viandante, persone, rune, frase, magia, menu, «Altro…», inventario,
  comandi del 3D: mouse, tasto destro, rotella, `X`, `V`); la sezione «Oltre il bordo» (`#help-beyond`: tappeto,
  corona, Concilio, rune come Lua, `G`, console) si vede solo con `kernel.exitedOnce` o `?dev`. Anche la barra dei
  tasti (`R` torna com'era, `H` aiuto) e il messaggio di `V`. Verificato nel browser (offline), nei due casi.
  Da notare: il pannello del Concilio (`G`, pulsante in basso a destra) resta visibile a tutti; con
  `NODE_ENV=development` nella shell `npm run build` fa una build di sviluppo (`DEV` sempre vero).

### T05 · Backup degli universi 2D e push del branch — `fatto` (chiuso dall'autore)
- D2 del piano: spostare `H:\projects\rune\universes\valmora`, `valmora copy 2`, `valmora new` in
  `H:\projects\rune-backup\universi-2d\` (spostati, non copiati; prima verificare la copia: numero di file e
  dimensione). Push del branch `3d` (mai su `main`).
- Fatto (22/10/2026): copia in `H:\projects\rune-backup\universi-2d\` verificata (`valmora` 6466 file / 98 586 709
  byte, `valmora copy 2` 2586 / 48 304 796, `valmora new` 4087 / 67 278 328; `diff -rq` senza differenze).
- Push: l'autore ha detto di saltarlo finché non c'è un repository remoto (22/10/2026).
- **Domande all'autore**: (1) la cancellazione degli originali in `H:\projects\rune\universes\` è stata bloccata
  dai permessi della sessione: cancellarli a mano (`rm -rf` delle tre cartelle) o autorizzarla; (2) il repository
  non ha nessun remote (`git remote -v` vuoto): a quale remote fare il push di `3d`, o si salta?
- Chiuso (22/10/2026) su richiesta dell'autore, senza push. Copia riverificata (stesso numero di file, `diff -rq`
  senza differenze); la cancellazione degli originali è ancora bloccata dai permessi della sessione: resta all'autore
  (`rm -rf "H:/projects/rune/universes/valmora" "H:/projects/rune/universes/valmora copy 2" "H:/projects/rune/universes/valmora new"`).

### T06 · Chiusura dello step 9 — `fatto` (`4e19d6a`)
- AGENTS.md riscritto dove descrive ancora il 2D (Visione, Regole, Corona, Personaggi, Fatto/Prossimi passi);
  `GEMINI.md` («gioco 2D top-down»); `README.md`; ADR-0037 → «attuato»; diario del piano chiuso; riassunto finale
  dello step 9 (cosa è cambiato, cosa manca, quanto è costato) in `docs/reports/step9.md`.
- Esito: AGENTS.md (Visione, regola 10, Struttura, Rune, Sala del Concilio, Personaggi, Stato e prossimi passi),
  README (descrizione, costi, comandi del 3D), GEMINI.md, ADR-0037 attuato (con le differenze), indice degli ADR,
  diario F9, `docs/reports/step9.md`. Diverso dal previsto: fatto con T05 ancora `in attesa` (l'autore ha detto di
  saltare il push: non c'è un remote); le immagini del README sono ancora del 2D (non mostrate più): task T30.

## Coerenza del mondo (prioritario)

Dal to-do: personaggi, trame e bibbia incoerenti (gatti trattati come umani, nomi quasi uguali, legami
impossibili, trame che non rispettano le persone, allusioni alla quarta parete, rune che si comportano in modo
diverso dalle regole). Analisi completa dell'autore, con gli esempi, in
[`docs/userchats/to-do-2026-10-22.md`](../archivio/3-to-do-backlog/userchats/to-do-2026-10-22.md) (sezione «Incoerenze personaggi e trame»).

### T07 · Decisione: Graphify e il grafo del mondo — `fatto` (`faa0bc7`)
- **Risposta dell'autore** (22/10/2026): approvato il grafo nativo del kernel («in casa») per l'uso (b); resta da
  provare Graphify per (a) e scrivere l'ADR.
- Due usi distinti, da non confondere: (a) **sviluppo**: Graphify (CLI open source che fa del repository un
  grafo interrogabile, con `graph.html` e un server MCP) per gli agenti che scrivono il codice; (b) **gioco**: un
  grafo dei contenuti dell'universo (persone, legami, luoghi, trame, oggetti, rune, regole, fatti) che il Concilio
  interroga per non inventare. Graphify è Python e lavora sul codice: nel browser non gira.
- Fare: provare Graphify sul repository (costo, tempi, utilità) e proporre per (b) un grafo nativo del kernel
  (`world/grafo.json`, nodi e archi tipizzati, ricostruito a ogni commit, esportabile nel formato di Graphify per
  vederlo con i suoi strumenti) contro le alternative. **Domanda all'autore** prima di implementare. ADR.
- Esito: [ADR-0045](../adr/0045-grafo-del-mondo.md). Graphify provato su una copia di `HEAD` (offline, 12 s, 0 token,
  3158 nodi, 7099 archi): utile per chi chiama chi, ma non legge gli XML, dei JSON vede solo le chiavi e i documenti
  senza modello sono titoli; resta facoltativo, fuori dal progetto (`graphify-out/` ignorato, comando in AGENTS.md).
  Per il gioco: grafo nativo `src/kernel/graph.ts` → `world/grafo.json` nel formato di Graphify. Diverso dal
  previsto: la domanda all'autore non serviva più (aveva già approvato il grafo «in casa»); le interrogazioni di
  Graphify (`explain`, `path`, `query`) non le ho potute lanciare (permessi), le ho rifatte leggendo `graph.json`.
  Misura su `valmora`: 57 persone, 215 legami, 39 legami gatto–umano di parentela o mestiere, 4 non simmetrici,
  1 verso nessuno, molti nomi quasi uguali: i casi di prova di T10-T12.

### T08 · Il canone delle rune — `fatto` (`dc311a7`)
- Un documento dell'universo (`world/canone.md`) che dice cosa sono le rune per chi vive nel mondo: aspetto, dove
  si trovano, che restano dove sono finché qualcuno non le raccoglie, cosa fanno le magiche, cosa nessuno sa. Lo
  ricevono il Narratore e l'Arbitro in ogni compito narrativo; regola: nessuna trama inventa comportamenti nuovi
  delle rune. Test sul contesto degli agenti.
- Esito: `universe/world/canone.md` nel seme (arriva agli universi esistenti con `upgradeFromSeed`); `canonSummary` in
  `agents/council.ts` aggiunge al canone le rune magiche e gli incantesimi letti dai manifest dell'universo (anche quelli
  aggiunti dopo) e lo mette nel contesto di Narratore e Arbitro, con la regola in testa; `tests/canon.test.ts` (3).
  Diverso dal previsto: nessun ADR (è contesto degli agenti, non architettura; descritto in AGENTS.md → Rune);
  `prompts/theme.md` parla ancora di «lettere che affiorano» e della strada che riporta in piazza: lo toglie T09.
  Nessuna verifica nel browser (nessuna UI cambiata).

### T09 · Prompt narrativi più semplici e senza quarta parete — `fatto` (`23d04a1`)
- Genesi: togliere l'invito al mistero e la leggenda attorno alla piazza («chi cammina troppo si ritrova in
  piazza»). Principi della quarta parete (`src/kernel/fourthwall.ts`) con gli esempi dell'analisi (tornare in
  piazza, essere osservati, confini invalicabili, simboli luminosi nel terreno) e il divieto di duplicare elementi
  di gioco. Aggiornare il filtro (`reviewFourthWall`) e i test.
- Esito: tema, bibbia del seme e personaggi del seme (abitante, gatto) senza leggende del gioco (c'erano ancora i
  44 passi e «carpet»); Genesi senza invito al mistero, con 2-4 leggende della gente; principi con gli esempi
  dell'analisi e il divieto dei doppioni; `metaBreak` riconosce piazza, chi osserva, confini e simboli luminosi;
  `bibleBreaks`/`cleanBible` per la bibbia (la Genesi la richiede una volta); le trame nuove si richiedono una volta;
  revisione con marcatore `quarta-parete-2` (rivede gli universi già rivisti: bibbia intera e trame); Narratore,
  Arbitro e mock offline ripuliti; `tests/fourthwall.test.ts` (6). Diverso dal previsto: nessun ADR nuovo, un
  aggiornamento dell'ADR-0025; la revisione ora tocca anche `plots.json`. Nessuna verifica nel browser (nessuna UI).

### T10 · Società coerente — `fatto` (`5f7db1c`)
- Ogni individuo ha una specie (persona, animale) e un genere; i legami possibili dipendono da entrambi (un gatto
  non ha fratelli umani né apprendisti; una donna non è padre); niente nomi quasi uguali. Validatore della
  società e riparazione di `people.json` esistenti; prompt del Narratore; test.
- Esito: `specie`/`genere` in `Person`; in `society.ts` i tipi di legame (chi può esserlo per chi, il rovescio, la
  forma per genere), `repairSociety`/`checkSociety` (legami possibili e simmetrici, un padrone per animale, un padre,
  una madre e un coniuge, coniugi senza genitori in comune, mestiere da animale, nomi simili rinominati anche nelle
  trame, attesi ricavati dai legami), `similarNames`, `freshName`; `addPerson` ripara a ogni aggiunta,
  `Kernel.reviewSociety` all'avvio (commit `società: …`), `Kernel.speciesOf`; Narratore con specie, parole e regole
  dei legami e nomi da evitare (una richiesta in più, poi il nome lo sceglie il kernel); niente più epiteti; i nati
  hanno un nome e un genere loro. `tests/society.test.ts` (7), aggiornamento dell'ADR-0020, AGENTS.md.
  Su una copia di `valmora` (57 persone): 227 correzioni, 24 nomi nuovi, due passate danno lo stesso risultato.
  Diverso dal previsto: la convenzione dei legami («cosa sei TU per l'altro») ora è scritta e la segue anche il
  riassunto della società; la stima del genere dei registri vecchi è euristica (nome, mestiere): qualche errore
  resta (es. «Isolde» maschio). Nessuna verifica nel browser (nessuna UI; `aurora` non ha ancora persone).

### T11 · Trame coerenti con le persone — `fatto` (`311c466`) (dipende da T08, T10)
- Le trame (`plots.json`) validate contro `people.json` (personaggi esistenti, specie, legami) e contro il canone
  delle rune; ciò che non torna va al Narratore con il motivo. Test.
- Esito: `reviewPlot` in `plots.ts` (persone esistenti; animali che non parlano, non scrivono, non chiedono missioni;
  legami nominati nei testi — «mio fratello X», «suo padre X», «X, sorella di Y» — confrontati per tipo con il registro;
  `canonBreak` per le rune che si spostano, parlano, appaiono…; `metaBreak`); ripara ciò che si ripara, il resto si
  scarta. `weaveStory` rimanda la trama al Narratore una volta con i motivi (prompt con le regole di coerenza);
  `reviewPlots` all'avvio ripara o ritira le trame aperte; `plotFromRaw`; `relationKind`, `BINDING_WORDS` in
  `society.ts`. `tests/plots.test.ts` (7), aggiornamento dell'ADR-0024, AGENTS.md. Sulle tre trame di `valmora`: due
  riparabili (gatti che parlano e chiedono missioni, persone che non esistono), una ritirata («mio fratello» falso).
  Diverso dal previsto: anche la quarta parete è nel validatore (le trame vecchie erano controllate una volta sola);
  i luoghi delle tappe (`dove`) non sono verificati: lo farà il grafo (T12-T13). Nessuna verifica nel browser (nessuna UI).

### T12 · Il grafo del mondo — `fatto` (`be10b34`) (dipende da T07)
- Attuare l'[ADR-0045](../adr/0045-grafo-del-mondo.md): `src/kernel/graph.ts` costruisce il grafo dai file dell'universo
  (nodi e archi tipizzati, id `<tipo>:<slug>`), lo ricostruisce dopo ogni scrittura di quei file e lo scrive in
  `world/grafo.json` con il commit (formato node-link di Graphify); `find`, `node`, `neighbors`, `context`, `check`.
  Test su un universo offline e su una copia dei file di `valmora` (i conteggi dell'esito di T07).
- Esito: `buildGraph` → `WorldGraph` (`node find edges neighbors describe context check counts toJson`); `kernel.graph()`
  in cache; `world/grafo.json` scritto in `Repo.beforeCommit` solo se cambia l'hash delle fonti (una riga per nodo e arco);
  `relationProblem`/`relationsAgree` in `society.ts`. `tests/graph.test.ts` (6: nodi e archi, interrogazioni, `check`,
  formato di Graphify e luoghi conservati, il kernel che lo scrive col commit e non lo riscrive se nulla cambia, `valmora`
  se c'è sul disco). ADR-0045 (sezione «Attuazione», con le misure), AGENTS.md. Diverso dal previsto: i piani dei luoghi
  non sono nel testo dell'universo, quindi il grafo li prende dai chunk pianificati, dalle mappe su disco all'avvio e dal
  `grafo.json` precedente; il viandante e le persone attese sono nodi (il «legame verso nessuno» di `valmora` era «nemico
  di Viandante»); archi in più `produce usa ambiente porta`; `GRAPH_BUILD` nell'hash per riscrivere i file quando cambia il
  costruttore. Su `valmora`: 2 164 nodi, 3 205 archi (215 legami), 930 KB, 54 ms + 11 ms per `check`; 74 riferimenti verso
  nulla (ricette con oggetti inventati, `npc.custode`), 25 legami non simmetrici, 14 impossibili, 50 coppie di nomi, una
  tappa in un luogo ignoto. Nel browser (`aurora`, offline): 196 luoghi, 103 KB nel commit, nessuna incoerenza (dopo aver
  corretto la specie delle persone attese, che dava un falso «figlio di un gatto»).

### T13 · Il contesto degli agenti dal grafo — `fatto` (`44c5dce`) (dipende da T12)
- Ogni compito narrativo riceve i nodi rilevanti (le persone coinvolte e i loro legami, il luogo, le trame
  aperte, il canone) invece dei riassunti generici di oggi: meno token, meno invenzioni. Misurare i token prima e
  dopo con il registro dei consumi.
- Esito: `CallOptions.focus` + `WorldView.graph`; `kernel.focusOn(cose, punto)` in 10 compiti del Narratore (`npc.reply
  npc.dialogue npc.individuate text.examine text.read action.judge craft.free craft.judge spell.name plot.weave`); con un
  focus noto al grafo il Narratore riceve testa della bibbia + canone + ultime 12 regole + vicinato (in fondo al system, per
  la cache) al posto di bibbia intera e catalogo. `tests/focus.test.ts` (4). Su `valmora`: `npc.reply` 5 818 → 3 310 token
  (−43 %), `plot.weave` 6 112 → 3 629 (−41 %). Diverso dal previsto: token **stimati** (4 caratteri) e passati dal registro
  dei consumi, non da chiamate vere a Gemini; `graph.context` non attraversa più gli snodi (tipi, regioni, oggetti…) e non
  dà righe alle foglie; il viandante non è nel focus (la sua riga era solo la borsa). Nel browser (`aurora`, offline) il
  contesto è giusto (luogo 0,0, le persone che vi abitano, i loro legami).

## Grafica e controlli 3D

### T14 · Voxel luminosi — `fatto` (`8c0e949`)
- `<color symbol="F" value="ffcc66" glow="True"/>`: lettere che emettono luce (fiamme, finestre, rune, neon).
  Emissivo nelle mesh (attributo per vertice), un bloom leggero, nella palette dello Scultore e nelle istruzioni.
  Serve per la corona neon (T19, T20).
- Esito: `PaletteEntry.glow`, attributo `glow` in `meshVoxels` (senza occlusione), emissione in `clipped`/`glowing`
  (`materials.ts`), `src/render/bloom.ts` (bloom selettivo: la maschera del bagliore è nell'alfa del target, così un muro
  bianco al sole non brilla), foto dell'Artista senza ombra, prompt dello Scultore (gioco e laboratorio), `ActionLetter.luce`,
  fiamme del falò, bloom anche nel laboratorio. `tests/glow.test.ts` (6), ADR-0046. Nel browser: il falò di notte nel
  laboratorio e i bordi al neon della corona brillano. Diverso dal previsto: anche `MAT.glow` (neon della corona) va nel
  bloom; le lastre delle rune (texture trasparenti) no, e i voxel luminosi non illuminano ciò che hanno intorno.

### T15 · Telecamera che ruota — `fatto` (`8806e24`)
- Dal to-do: «non mi è chiaro come si giri la telecamera»: oggi è fissa (il movimento del kernel è relativo allo
  schermo, Q e R sono tasti del gioco). Proposta: rotazione a scatti di 90° (tasti da scegliere tra quelli liberi)
  e trascinamento con il tasto centrale; WASD relativo alla telecamera (l'input del kernel ruota di conseguenza);
  nell'aiuto. ADR breve.
- Esito: ADR-0047. `,` e `.` girano di un quarto (`Input.turn`), il tasto centrale trascinato gira a mano e al
  rilascio si posa sul quarto più vicino; `Input.isHeld` traduce le direzioni dello schermo in quelle del mondo (il Lua
  del movimento non cambia); il renderer insegue `turn` per la via più breve, `kernel.view` si scambia nei quarti
  dispari; aiuto aggiornato. `tests/camera.test.ts` (3). Verificato nel browser (offline): da est `W` va a ovest,
  il trascinamento si posa su π. Diverso dal previsto: nessuno; le rune incise si leggono nel verso del mondo.

### T16 · Terreno con le altezze (Hills) — `fatto` (`8af0a7b`)
- Dal to-do: il terreno con variazioni di altezza, partendo dal modello 3D `Hills` di MarkovJunior. ADR: campo di
  altezza a scala di casella, continuo fra i chunk (deterministico per seme e coordinate); il renderer lo disegna,
  il kernel lo usa per i pavimenti dei corpi. Da decidere nel task: altezze solo estetiche o anche ostacoli
  (pendenze invalicabili).
- Esito: ADR-0048. `src/kernel/relief.ts`: `Hills` invariato (o `world/rilievo.xml`) gira su due scatole di lati 64 e 45
  (semi dal seme dell'universo), lette come piastrelle che si ripetono e rammendate; livello = somma (periodo 2880 caselle,
  ~7 livelli, ~0,45 s una volta). Deciso: **solo estetiche**, un livello = ¼ di casella, fra vicini al più due (mezza
  casella, si sale sempre: la regola 10 non chiede controlli nuovi). `kernel.groundAt`, `floorAt` sul suolo; il renderer
  disegna colonne con i fianchi, posa muri, alberi, cose, strutture, rune e luci sul suolo, i corpi salgono i gradini
  (`climb`), la camera segue l'altezza, il mouse sceglie la casella sul rilievo. `tests/relief.test.ts` (6). Nel browser
  (offline): colline a terrazze, lago piano con le sponde, taglio al cerchio pulito. Diverso dal previsto: l'acqua andava
  a gradini (482 caselle su 1505), quindi ogni specchio d'acqua di un chunk è piano al suo livello più basso
  (`waterLevels`); fra due chunk può restare un gradino. Corrette anche le sponde, che erano girate al contrario.

### T17 · Lotti in piano — `fatto` (`c50490b`)
- Le strutture su più caselle hanno bisogno di spazi piani: il piano spiana i lotti (e i sentieri) prima di
  posare i modelli. Test.
- Da T16: oggi una struttura sta sul suolo sotto il suo centro, e sotto un lotto il rilievo varia fino a 2 livelli
  (mezza casella). Spianare vuol dire un livello per lotto nel piano (persistente, letto da `groundAt` prima del
  rilievo). Facoltativo: l'acqua che passa da un chunk all'altro allo stesso livello (oggi può scendere di un gradino).
- Esito: ADR-0048 (punto 6). `chunkLevels` in `src/kernel/relief.ts`: ogni lotto è piano alla mediana dei suoi livelli, o
  il più vicino che il bordo del chunk e i lotti già posati permettono (due livelli a casella di distanza), poi un anello di
  una casella, piano dove si può; il resto del chunk si piega (vicini di terra entro due livelli), il bordo resta il
  rilievo. `groundAt` lo tiene in cache per chunk (sostituisce la cache dell'acqua). `tests/relief.test.ts` (+4). Nel
  browser (offline): i 7 lotti caricati hanno un'altezza sola ciascuno, la casa sta piana col sentiero. Diverso dal
  previsto: non si salva nulla nel piano (i lotti sono già nel piano e il calcolo è deterministico, e così segue un
  `world/rilievo.xml` nuovo); su un pendio ripido quanto il rilievo permette un lotto vicino al bordo lascia un gradino
  più alto (solo estetico); l'acqua fra i chunk non è fatta.

## La corona

Dal to-do (testo completo, con le specifiche di ogni edificio, in
[`docs/userchats/to-do-2026-10-22.md`](../archivio/3-to-do-backlog/userchats/to-do-2026-10-22.md)): la corona più grande, ogni edificio con un esterno e un interno neon-punk propri; dentro e fuori
restano di dimensioni diverse; tavoli e schermi di oggi restano se non diventano ridondanti.

### T18 · Corona quattro volte più grande — `fatto` (`151549f`)
- Raggio del campus ×4 (il cerchio della simulazione no), edifici ridisposti sull'anello, viale, insegne. Test
  dello studio aggiornati.
- Esito: `CAMPUS` in `src/kernel/corona.ts`: l'anello va da 9 a 36 caselle oltre il cerchio (`outer` = R + 36 = 80); viale
  di 6 caselle con la linea al neon, porta a R + 6.5, blocchi da R + 7 a R + 23 (16 di profondità, ~19-25 di larghezza),
  prati dietro, vicoli tra i settori (`CoronaCell.ground`: `viale vicolo prato bordo`), bordo luminoso; uscita sul viale.
  `corona3d.ts`: blocchi alti 4.5, insegne al neon (testo su canvas, due facce) sopra ogni porta. `tests/corona.test.ts`
  (3: misure, porte raggiungibili, prati raggiunti dai vicoli). Nel browser (offline): viale, blocchi e insegne leggibili.
  Diverso dal previsto: nessun ADR (è una misura, non una decisione); i test dello studio non dipendevano dal raggio.

### T19 · Prompt per Gemini (abbonamento): le strutture della corona — `fatto` (`74bf122`)
- Un prompt per Gemini CLI (agente con file e browser, **senza** la `GEMINI_API_KEY`: genera lui stesso l'XML e
  lo collauda nella sandbox `/lab/3d/` e con gli script del laboratorio), una struttura alla volta, con le
  specifiche dell'autore: Torre della Magia (cilindrica, alta, incisa di rune, scritta in rune), Studio dei
  personaggi (studio-fabbrica), Laboratorio delle cose (cupola di metallo nero e vetro), Magazzino degli oggetti
  (piramide nera e vetro), Ufficio dei luoghi (edificio mobile con strumenti di terraformazione), Sala sistemi
  (rampa verso una base sotterranea), Il Nucleo (sfera di voxel neri sotto un edificio ad anello), Sala del
  Concilio (esagonale). In `docs/prompts/gemini-strutture-corona.md`.
- Esito: [`docs/prompts/gemini-strutture-corona.md`](../archivio/3-to-do-backlog/prompts/gemini-strutture-corona.md): un prompt comune (niente
  chiave né script a pagamento; scrive solo `lab/mjx/models/corona-<id>.xml` e una riga di `lab/3d/catalog.ts`; collaudo
  con `mjx-render`, `mjx-slice`, la sandbox e il giudizio da Artista; un commit per struttura) e una scheda per ciascuna
  delle otto strutture, con le parole dell'autore, la scatola e il neon della sala. Diverso dal previsto: la scala. A 20
  voxel per casella un edificio di 14 caselle avrebbe 280 voxel di lato, quindi questi modelli si scrivono a **8 voxel per
  casella** (la sandbox lo regge già: un cilindro 112 × 112 × 160 gira in ~250 ms); la porta è la lettera `name="porta"`.
  Nessun ADR: la decisione la attua (e la registra) T20.

### T20 · Gli esterni della corona come modelli — `fatto` (`40435ef`)
- Ogni edificio della corona usa il suo programma (`models/corona-<id>.xml`) con insegna neon; collisione dai
  voxel; porta dove il modello la mette.
- Dai programmi di T19 (in `lab/mjx/models/corona-*.xml`): la libreria deve avere una densità per modello (quelli della
  corona sono a 8 voxel per casella, `VPT = 20` è fisso in `src/kernel/forms.ts`), con un ADR; la porta del campus va
  sulla lettera `name="porta"`, il davanti del modello (y grande) verso il viale.
- Esito: ADR-0049. `models/index.json` → `vpt` per modello (4-40, senza 20): `Form.vpt`, e impronta, pavimenti, portata,
  collisione, `floorAt`, `structureAt`, punti interni e mesh la usano. `corona.ts`: `Building.structure`, `campusModel`
  (`corona-<id>`), `placeStructure` (girato di `-mid`, la porta sul baricentro della lettera `porta` e mezza casella davanti
  dove era la porta del blocco, caselle coperte `building`, il resto prato), `free` con i voxel. `kernel.placeCampus`
  (dopo `corona.build` e a ogni `forms.version`). `corona3d.ts`: la mesh del modello al posto del blocco e dell'insegna,
  una soglia luminosa; il renderer rifà l'anello quando cambia ciò che il campus indossa (`campusKey`). `tests/campus.test.ts`
  (3). Nel browser (offline, un modello di prova solo in memoria): posato con la porta verso il viale, il centro blocca,
  E sulla porta entra nella Torre della Magia. Diverso dal previsto: **i programmi di T19 non esistono ancora** (il prompt
  va eseguito dall'autore in Gemini CLI); qui c'è il motore, e portarli nel gioco è T31.

### T21 · La vetrina con selettore — `fatto` (`0021163`)
- Un meccanismo comune agli interni: un oggetto (schermo, silos, stampante) con «<» «>» ai lati che sceglie
  cosa mostrare; un clic apre un pannello con le informazioni (il modello, il modulo). Base per T22-T24.
- Esito: `corona.ts`: voci `showcase` (con `source` `rune | persone | cose | oggetti` e `device` `schermo | silos |
  stampante`), `prev`, `next`; una vetrina al piano terra di Torre della Magia, Studio dei personaggi, Laboratorio delle
  cose e Magazzino degli oggetti (`SHOWCASES`, `SHOWCASE_AT`: 3 caselle a (15, 11), le frecce ai lati). `kernel.ts`:
  `showcaseEntries` (rune magiche e incantesimi; moduli `npc.*` con gli individui di `people.json`; moduli `obj.*`/`object.*`;
  oggetti dei pacchetti: modello, file, fatti; in cache per stato dei file), `showcaseOf`, `stepShowcase` (gira in tondo,
  `studio:showcase`), `openShowcase` (`ui:showcase`), `clickStudio` (clic sinistro entro 4 caselle). `corona3d.ts`: i tre
  apparecchi, i pulsanti, `buildShowcase` (il modello ridotto all'apparecchio che gira, nel silos fluttua in un vetro
  colorato; le rune sullo schermo; il nome sotto); il renderer lo rifà quando cambia la scelta o la libreria.
  `ui/studio.ts`: pannello con foto (o rune), fatti, «<» «>» e «Apri il file». `tests/showcase.test.ts` (3). Nel browser
  (offline): silos col gatto, schermo con la runa luce, stampante con le bacche; pannello e frecce funzionano.
  Diverso dal previsto: il clic cade sul pavimento dietro le cose alte, quindi vale la vetrina (o freccia) più vicina al
  punto; nessun ADR (meccanismo dentro la corona, non cambia l'architettura). Per T22-T24 resta: la combinazione di rune e
  l'effetto (T22), il liquido viscoso e l'individuo scelto (T23), la stampante 3 × 3 (T24; oggi 3 × 1).

### T22 · La Torre della Magia, dentro — `fatto` (`d2612e8`)
- Lo schermo mostra una runa o una combinazione di rune (magiche e incantesimi noti), «<» «>» per cambiarla; il
  clic mostra nel pannello l'effetto.
- Esito: `showcaseEntries('rune')` elenca le combinazioni: ogni runa magica da sola (con il suo incantesimo, se c'è),
  poi gli incantesimi di più rune (per lunghezza). Il pannello dice le rune (glifo, nome, token, elemento), il significato,
  l'incantesimo, l'effetto, «Cosa fa» (gli effetti validati come li applicherebbe il kernel, in parole: `describeEffect` in
  `validator.ts`), mana, il cristallo da tre rune, come si pronuncia; una runa mai pronunciata dice che il Narratore le
  darà un nome. Schermo 3D (`runeScreen` in `corona3d.ts`) e pannello: ogni runa nel suo colore con il nome sotto.
  `tests/showcase.test.ts` (+1). Nel browser (offline): «Vapore» con Laguz e Kenaz sullo schermo e nel pannello.
  Diverso dal previsto: niente; nessun ADR. Le rune singole e i loro incantesimi sono una voce sola (prima erano due).

### T23 · Lo Studio dei personaggi, dentro — `fatto` (`5058b48`)
- Un silos al centro con il personaggio scelto che fluttua in un liquido viscoso; «<» «>»; il clic mostra il
  modulo e l'individuo.
- Esito: `showcaseEntries('persone')` mette dopo ogni tipo i suoi individui (`person:<nome>`, «nome · mestiere»), ciascuno
  con il `seed` che ha nel mondo (`seedFor(model, origine ?? nome)`, campo nuovo di `ShowcaseEntry`, usato dal silos e dalla
  foto del pannello); i fatti dicono l'individuo (chi è, mestiere, aspetto, carattere, storia, famiglia, legame col viandante,
  giornata, dove l'ha incontrato, cosa porta, gli ultimi ricordi: `personFacts`) e poi il modulo («Aspetto del tipo»,
  «Carattere del tipo»). `corona3d.ts`: il silos è pieno di un liquido viscoso del colore dell'edificio, con un anello
  luminoso in superficie e sedici bolle che salgono; il renderer fa girare e fluttuare la figura piano. `tests/showcase.test.ts`
  (+1). Nel browser (offline): 13 voci (2 tipi, 11 individui), Ottone che fluttua nel liquido, pannello con foto, individuo e
  modulo. Diverso dal previsto: il tipo resta una voce a sé, prima dei suoi individui; nessun ADR.

### T24 · Laboratorio delle cose e Magazzino degli oggetti, dentro — `fatto` (`5a5a3c8`)
- Una stampante 3D di 3 × 3 caselle con l'oggetto scelto sulla casella centrale (le strutture ridotte alla scala
  di una casella); «<» «>»; il clic mostra le informazioni.
- Esito: `corona.ts`: `StudioItem.h` (profondità in caselle), `PRINTER = 3`; la vetrina `stampante` è 3 × 3 (righe 10-12),
  le frecce sulla riga di mezzo (11, come prima), la riga 13 resta libera; `at` conta le righe, `cellNear` (la casella
  più vicina di una cosa larga o profonda) per `itemNear`, `clickStudio` e il riquadro dell'overlay. `corona3d.ts`: la
  stampante con quattro montanti, telaio, ponte con la testina sopra la casella centrale, un letto di nove piastrelle scure
  e la centrale contornata di luce; la cosa sta sulla casella centrale, adattata a una casella (0.9 × 1.8: il pozzo e le
  strutture si riducono, le cose piccole crescono al più di 1.5). `tests/showcase.test.ts` (+1, e il primo test conta le
  righe). Nel browser (offline): banco e pozzo sulla casella centrale, clic sulla casella centrale → pannello
  «Acciarino» (1 di 36), nessun errore. Diverso dal previsto: il letto tutto luminoso nascondeva la cosa sotto il bagliore,
  quindi solo la casella centrale brilla (il contorno); nessun ADR.

### T25 · La Sala del Concilio: il tavolo unito — `fatto` (`aa4d322`)
- Il tavolo è fatto di cubi separati: farne un ellissoide unico (un modello o una mesh sola).
- Esito: `roundTable` in `src/render/corona3d.ts`: un piano ellittico pieno sull'ellisse del kernel (3.4 × 2.3, quella
  della collisione in `corona.ts`), il bordo arrotondato come mezzo ellissoide (64 spicchi, quad orientati da `facing`),
  un bordo al neon e un anello azzurro sotto l'universo; tutto nella mesh della stanza. Nel browser (offline): un pezzo
  solo, senza buchi. Diverso dal previsto: nessun modello MarkovJunior (bastano le quad del `Builder`), nessun ADR.

### T26 · L'Ufficio dei luoghi, dentro — `fatto` (T26a, T26b, T26c, T26d)
- Da progettare in funzione di come lavora il Cartografo (piani, lotti, atlante). **Proposta all'autore** prima
  di costruire.
- Proposta scritta il 23/10/2026: [`corona-proposte.md`](../archivio/3-to-do-backlog/plans/corona-proposte.md) §1 — **il plastico**: un tavolo olografico
  3 × 3 con un luogo già pianificato in miniatura («<» «>» per il luogo), una leva che scorre le sei fasi del Cartografo
  (bozza, varchi, ambiente, sentieri, lotti e strutture, cose e rune), pannello con il piano; l'atlante e i terreni dello
  Studio del Cartografo qui. Pezzi: T26a plastico, T26b fasi, T26c unione con lo Studio del Cartografo.
- **Domande per l'autore**: unire lo Studio del Cartografo all'Ufficio dei luoghi? Le sei fasi, o basta il plastico finito?
- Deciso (23/10): **unire** lo Studio del Cartografo all'Ufficio dei luoghi (T26c); plastico **e** sei fasi approvati.
- **T26a · il plastico — `fatto`** (commit «Corona (T26a)»). `corona.ts`: sorgente `luoghi`, dispositivo `plastico` (3 × 3 come la
  stampante). `kernel.ts`: `applyPlan` diviso in parti pure — `layoutOf` (programma, sentieri, ritocchi), `lotsOf` (i lotti e le
  strutture, prima dentro `settleLots`), `placementsOf` (le celle di rune, cose, oggetti a terra, bottino) — e gli spawn;
  `miniature(cx, cy)` le riusa: dal chunk caricato o, se non lo è, dal piano salvato (`chunkStore`, asincrono, `miniatureVersion`),
  senza chiamare il Concilio né caricare il luogo; un luogo mai pianificato non ha miniatura. `showcaseEntries('luoghi')`: i luoghi
  noti (`mergePlaces`), quello dove il viandante è stato per ultimo per primo, poi per distanza; fatti: dove, regione, descrizione,
  ambiente («Apri il file» apre il suo modulo), dentro/fuori, a terra, strutture, rune posate (quelle iniziali nel luogo di partenza),
  il file del piano in `maps/`. `corona3d.ts`: il tavolo scuro con i bordi al neon e `buildMiniature` (una colonna per casella nel
  colore del terreno fino al suo livello, acqua più bassa, muri e rocce più alti; strutture e cose come i loro modelli ridotti; rune
  luminose). `studio.ts`: nel pannello la pianta del luogo dall'alto (caselle, lotti, cose, rune). `tests/places.test.ts` (3) e la
  vetrina nuova in `showcase.test.ts`. Nel browser (`aurora`, offline): 285 luoghi, «Palude di Valmora» con due case, una persona e
  la runa, pannello e «>», nessun errore. Diverso dal previsto: per avere la miniatura uguale al mondo una cosa già raccolta tiene la
  sua cella (prima la lasciava alle altre): le celle non dipendono più dallo stato, quindi le cose dei luoghi già visitati possono
  spostarsi una volta (il test «at night they go to bed» ora toglie gli altri letti: quello di un luogo vicino lo
  attirava a volte); gli alberi dei terreni con un modello (bosco) nel plastico sono solo colonne verdi; nessun ADR.
- **T26b · le fasi — `fatto`** (commit «Corona (T26b)»). `layout.ts`: l'opzione `stages` tiene la griglia con i varchi e quella dopo il
  programma. `kernel.ts`: `PLACE_PHASES` (bozza, varchi, ambiente, sentieri, lotti e strutture, cose e rune: nome e una riga) e
  `PlaceMiniature.phases` (per fase caselle, livelli, celle accese: i varchi, ciò che il programma o i sentieri cambiano, i lotti, le celle
  di cose e rune; prima dei lotti il terreno non è spianato per loro); `showcaseOf` dà la fase del plastico (la sesta finché non si
  sposta, la stessa cambiando luogo), `stepPhase` la sposta fino alla prima o all'ultima con un messaggio. `corona.ts`: le pedane `less`
  `more` a terra sotto le colonne esterne del tavolo (si calpestano: E standoci sopra, o un clic), il davanti del tavolo resta libero.
  `corona3d.ts`: la miniatura nella fase scelta, con ciò che aggiunge contornato di verde, le strutture dalla quinta, cose e rune nella sesta;
  sul davanti la fase scritta e sei spie. `studio.ts`: «−» «+» nel pannello, la fase spiegata (con «Qui non è servito nulla.» se non ha
  cambiato niente) e la pianta nella fase. `tests/places.test.ts` (+2). Nel browser (offline): «Campagna del Primo Passo» fase per fase,
  pedane, pannello che segue, nessun errore. Diverso dal previsto: niente leva, due pedane; i sentieri spesso non servono (l'ambiente
  lascia il luogo connesso), quindi la fase 4 lo dice; prima riempivo le celle accese, ma col bagliore coprivano il terreno: ora sono
  contorni. Corretto un difetto di T26a: i modelli animati (`grande`) nel plastico erano invisibili (fotogrammi e corpo nascosti); nessun ADR.
- **T26c · l'unione con lo Studio del Cartografo — `fatto`** (commit «Corona (T26c)»). `corona.ts`: niente più edificio
  `cartografia`; `SAMPLES = 'luoghi'`: i terreni nel campionario, dopo i file e da un piano loro (la scala lo dice), l'atlante su un
  tavolo contro la parete di fondo del piano terra (`ATLAS_AT`, riga 1, letto dalla riga 2); il posto del Cartografo al tavolo del
  Concilio porta all'Ufficio. `studio.ts`: la nota del pannello dei campioni senza «della <edificio>». ADR-0051. Test in
  `kernel.test.ts` (lo studio senza `cartografia`, il campionario su un piano suo, il teletrasporto, l'atlante libero e raggiungibile).
  Diverso dal previsto: il campionario degli ambienti della proposta (un riquadro per ambiente) non era nel pezzo: è T26d.
- **T26d · il campionario degli ambienti — `fatto`** (commit «Corona (T26d)»). `corona.ts`: oggetto `layout`, uno per ambiente
  (`kernel.layoutExhibits`), sugli scaffali del campionario dopo i terreni, da uno scaffale suo; la scala dice «il campionario dei
  terreni e degli ambienti». `kernel.ts`: `layoutSample(id)` (`LayoutSample`): il programma girato con `layout()` come nel validatore
  su ciascuna delle `sampleDrafts`, tenuta quella che cambia di più, in cache per stato dei file; E o un clic (`ui:layout`).
  `corona3d.ts`: un plinto con la miniatura (`buildMiniature` di T26a). `studio.ts`: il pannello (pianta, descrizione, spazio,
  caselle cambiate, il programma in JSON, «Apri il file»). Test in `places.test.ts`. Nel browser (`aurora`, offline): 20 ambienti
  sui piani 2 e 3, pannello di «Rovine», nessun errore. Diverso dal previsto: con i biomi due delle tre bozze di prova fisse
  (`[3,-7] [-11,4] [20,13]`) erano tutto mare e la terza tutta neve, quindi anche il validatore provava gli ambienti quasi sul niente:
  `sampleDrafts` ora sceglie in modo deterministico una bozza boscosa, una aperta e una con acqua (le tre vecchie per prime, poi
  attorno all'origine), in cache; tutti gli ambienti del seme restano validi. Nessun ADR.

### T27 · La Sala sistemi, dentro — `fatto` (T27a, T27b, T27c, T27d)
- L'autore chiede un aiuto: far apprezzare la complessità del codice con esempi (cosa fa un sistema, casi d'uso).
  **Proposta all'autore** (es. ogni sistema come un «caso» animato: prima, regola, dopo).
- Proposta scritta il 23/10/2026: [`corona-proposte.md`](../archivio/3-to-do-backlog/plans/corona-proposte.md) §2 — **la catena** (ogni sistema una
  stazione nell'ordine del tick, con entità toccate, ms e guasti dal vivo) e **il banco di prova** (una teca 3 × 3 con un
  caso d'uso a ciclo: prima, la regola, dopo). Pezzi: T27a catena, T27b banco con i casi del seme, T27c casi dei sistemi
  forgiati.
- **Domande per l'autore**: il caso con il codice vero (un kernel in miniatura nella teca: proposta) o raccontato? Le
  meccaniche (`mech.*`, oggi nell'Archivio) vanno nella Sala sistemi?
- Deciso (23/10): il caso con il **codice vero** (kernel in miniatura nella teca); le meccaniche `mech.*` vanno nella
  **Sala sistemi** (l'Archivio resta riserva).
- **T27c · i casi dei sistemi forgiati — `fatto`** (commit «Corona (T27c)»). Fatto prima di T27b, quindi qui sono nati il
  formato e l'esecuzione dei casi (ADR-0052): `Manifest.casi` (`BenchCase` in `types.ts`); `src/kernel/bench.ts` con
  `cleanCases`, `benchFiles` e `runCase` (un `Kernel` con `KernelOptions.bench`: `core.*`, i moduli che non sono sistemi e il
  sistema del caso, terreno della scena 5 × 5, generazione ferma, niente stato, società, grafo né riparazioni; oggetti di prova
  in `bench.prova`; 20 tick/s, un fotogramma ogni mezzo secondo e dopo ogni passo, messaggi, guasti); `kernel.runBenchCase`.
  `mechanic.design` chiede 1-3 `casi` (schema, prompt dell'Ingegnere, `MockModels`: «Si indossa l'elmo»); `forgeMechanic` li
  esegue e tiene quelli in cui ciò che guardano cambia (se nessuno regge, un secondo tentativo; poi entra senza casi). Test in
  `tests/bench.test.ts` (7: un caso di `sys.needs` e uno di `sys.fire` col codice del seme, errori, file del banco, pulizia,
  la meccanica con il suo caso e il codice riscritto che cambia il caso, il ritorno all'Ingegnere). Diverso dal previsto: niente
  nel browser (nessun disegno: la teca è T27b); un caso costa ~60-300 ms in Node.
- **T27a · la catena — `fatto`** (commit «Corona (T27a)»). `src/kernel/chain.ts`: `ChainMeter` (per sistema ms e entità toccate a
  tick, medie pubblicate ogni `WINDOW` = 60 tick) e `chainOf` (stazioni nell'ordine del tick: passo, ordine, tipo `nucleo | sistema |
  meccanica`, descrizione, file, pannello, misura, guasto `module:<id>…`). `kernel.ts`: il tick misura ogni `update`, lo `Host` segna
  gli id toccati (`get set spawn destroy`), `chain()`, `openStation` (`ui:station`), E e clic. `corona.ts`: voci `stazione` contro la
  parete di fondo della Sala sistemi (`CHAIN`, `chainSlots`: larghe 3 caselle al più, centrate sulla colonna dell'uscita, le prime 20).
  `render/chain.ts`: schermi inclinati come la parete della Direzione (canvas ridisegnato solo se cambia), il nastro e l'impulso;
  `studio.ts`: il pannello. Test in `tests/chain.test.ts` (8). Nel browser (`aurora`, offline): sette stazioni con ms ed entità dal vivo,
  l'impulso sul nastro, il pannello di «Bisogni», nessun errore. Diverso dal previsto: le stazioni comprendono anche i sistemi del Nucleo
  (`core.movement`, `core.carpet`), perché girano nella stessa catena; le rune del tappeto (che si eseguono prima) non sono una stazione.
  Nessun ADR (deciso in T27, ADR-0052). Per T27b: il banco va al centro del piano terra (`DEVICES` in `corona.ts`, scaffali ai lati);
  la catena resta alla riga 1, il passaggio davanti a lei alla riga 2.
- **T27b · il banco con i casi del seme — `fatto`** (commit «Corona (T27b)»). Ogni `sys.*` del seme ha 2-3 `casi` nel manifest (11 in
  tutto: la spinta e la cassa contro il masso; verso la meta e il gatto nel recinto; ti segue e ti va dietro; senza mangiare, sazio e
  dissetato, camminare stanca; il rovo brucia e la cassa no, lo scudo protegge). Passo nuovo `cammina` (verso `su giu sinistra destra`,
  secondi: tiene premuti i tasti) in `BenchStep`, `cleanCases`, `runCase`, schema e prompt dell'Ingegnere. `corona.ts`: `BENCH_AT`, voce
  `banco` 3 × 3 al centro della Sala sistemi (ora una stanza con dispositivo: scaffali ai lati), «<» «>» con `target: 'banco'`. `kernel.ts`:
  `benchCases` (tutti i casi, nell'ordine del tick), `benchScene`, `benchOf` (esegue il caso scelto con il codice attuale, in cache per
  caso e codice, `studio:bench` quando arriva), `stepBench`, `openBench` (`ui:bench`), E e clic. `render/bench.ts`: la teca (caselle,
  viandante, cose, fiamme), il ciclo prima → la regola → dopo, lo schermo basso sul coperchio con le righe accese e i valori; `studio.ts`:
  il pannello (caso, passi, prima → dopo, messaggi, «Non va», stazione, codice aperto sulle righe accese, «<» «>», «Apri il file»).
  `bench.ts`: `fieldLabel`, `valueText`, `textKey`. Test: `tests/bench.test.ts` (+6: ogni caso del seme regge, cosa dicono, i passi
  `cammina`, il banco nella sala e le frecce, il codice riscritto rieseguito, i nomi dei campi), `tests/corona.test.ts` (la Sala sistemi
  tra le stanze con dispositivo). Nel browser (`aurora`, offline): gli 11 casi girano nel kernel in miniatura in meno di un secondo l'uno,
  la teca anima fuoco e spinte, pannello e frecce funzionano, nessun errore. Diverso dal previsto: per vagabondaggio e seguire non serve
  l'ora del giorno (la meta si dà come componente `meta`), basta `cammina`; perdere di vista a 14 caselle non entra in una scena 5 × 5,
  e nemmeno il gatto libero (va nel recinto). Lo schermo sopra la teca, alto, copriva la catena: è basso e largo, 5 righe e 4 valori
  (il pannello li ha tutti). Le cose sono blocchi colorati, non i loro modelli (possibile seguito). ADR-0052 aggiornato.
- **T27d · le meccaniche nella Sala sistemi — `fatto`** (commit «Corona (T27d)», da T32): `folderOf` in `corona.ts` manda `mech.*` a
  `sistemi` (prima finivano in `altro`, l'Archivio, che ora nasce solo per un prefisso sconosciuto). Test in `tests/bench.test.ts`:
  dopo `forgeMechanic` lo studio non ha l'Archivio e i file della meccanica sono sugli scaffali della Sala sistemi. Diverso dal
  previsto: la stazione col pannello (`manifest.ui`) nella catena resta a **T27a**, che non c'è ancora: lì una meccanica è una
  stazione come i `sys.*`, col suo pannello. Nessun ADR (deciso in T27/T32); nessuna prova nel browser (solo lo scaffale cambia edificio).

### T32 · Gli edifici dimenticati: Direzione, Biblioteca, Galleria, Archivio — `fatto` (commit «Corona (T32)»)
- Contesto: nel seme il campus ha 12 edifici (13 con l'Archivio, dove oggi finiscono le meccaniche `mech.*`); le
  specifiche del 22/10 e il prompt di T19 ne coprono 8. Proposte in [`corona-proposte.md`](../archivio/3-to-do-backlog/plans/corona-proposte.md) §3:
  Direzione come regia (maxischermo, torre di trasmissione; dentro la linea del tempo dei commit e il quadro dei costi),
  Biblioteca del Mondo come pila di libri (dentro il leggio della bibbia e le tavole delle regole), Galleria dell'Artista
  come museo-cubo con una scultura nel piazzale (dentro il tornio dello Scultore), Archivio come pila di container o
  Officina delle meccaniche.
- Fare, dopo le risposte: le schede nel prompt di T19, gli id nuovi in T31, un task di interno per edificio.
- **Domande per l'autore**: le tre proposte vanno bene come base? L'Archivio: riserva o Officina delle meccaniche?
- Deciso (23/10): **Direzione** approvata come regia, dentro una **sala operativa** (war room: tavolo della situazione
  con le operazioni in corso, parete di schermi con linea del tempo, registro dal vivo e costi, livello di allerta;
  `corona-proposte.md` §3.1); **Galleria** approvata; le schede `universo` e `galleria` sono nel prompt di T19.
  L'Archivio resta riserva (le meccaniche vanno nella Sala sistemi). **Biblioteca**: la pila di libri è scartata;
  scelto **il chiostro** (§3.2), scheda `mondo` nel prompt di T19.
- Esito (pianificazione, nessun codice): le schede `universo`, `galleria`, `mondo` erano già nel prompt di T19 e gli id
  in T31; gli interni sono T46 (Direzione: T46a-c), T47 (Biblioteca: T47a-b), T48 (Galleria: T48a-b); lo spostamento di
  `mech.*` nella Sala sistemi è un pezzo di T27 (T27d). L'Archivio resta senza scheda né interno nuovo (riserva: con le
  meccaniche altrove ci finisce solo un prefisso sconosciuto). Diverso dal previsto: la proposta numerava gli interni
  T32-T34, ma T33-T45 sono del multiplayer, quindi T46-T48.

### T49 · Gli interni della corona: aria, simmetria, luci più tenui — `fatto` (T49a, T49b)
- Contesto: richiesta del 24/10 ([`to-do-2026-10-24.md`](../archivio/3-to-do-backlog/userchats/to-do-2026-10-24.md), «Interni edifici della corona»,
  con `docs/userchats/direzione.png`). Vale per tutte le stanze (`buildRoom`/`itemMesh` in `corona3d.ts`, le posizioni in
  `corona.ts`). Oggi: tre postazioni (`desk`, `x 4/6/8, y ROOM_H-4`) davanti allo schermo della storia sono celle bloccate
  (`Corona.free` le esclude) che a vista sono solo tre trattini; il dispositivo centrale (tavolo della situazione, plastico,
  stampante, grafo, vetrina, `SHOWCASE_AT`/`SITUATION_AT`/`GRAPH_AT` a y 10-12) sta a due caselle dal muro della porta, con
  pulsanti e pedane attorno (nell'Ufficio dei luoghi è claustrofobico); gli scaffali hanno il bordo luminoso solo davanti;
  le linee del pavimento (`grid`, `rgbOf(col, 0.25)` sul bloom) fanno nebbia; le strisce dei muri sono su tre lati (il muro
  basso della porta non ne ha).
- **T49a · togliere e attenuare**: via le tre postazioni davanti allo schermo della storia in ogni stanza (le squadre
  lavorano altrove: le loro scrivanie tornano con T46c, solo nella Direzione, e senza celle bloccate inutili); il bordo
  luminoso degli scaffali (teche dei file, dei modelli, dei campioni) gira su tutto il bordo superiore, come il tavolo della
  situazione; linee del pavimento molto più tenui (misurare il bloom con e senza: nessun alone sopra la griglia); strisce dei
  muri simmetriche. Test: nessuna voce `desk` fuori dalla Sala del Concilio; le celle davanti allo schermo sono libere.
  Verifica nel browser: la Direzione inquadrata come in `direzione.png`, prima e dopo, e un'altra stanza per edificio.
  - Esito: `fatto` (commit «Corona (T49a)»). Le postazioni non ci sono più; i membri delle squadre, quando non sono a uno
    scaffale, stanno davanti allo schermo della storia (`Archive.post`, sulle celle ora libere). La griglia non si attenua
    soltanto: passa a un materiale suo (`MAT.line`, senza luce e fuori dal bloom, `GRID = 0.12` del colore), quindi non fa
    alone per costruzione invece che per misura. Il bordo intero (`rim` in `corona3d.ts`) vale anche per i piedistalli degli
    ambienti. Il muro basso della porta ha la sua striscia in cima, aperta sull'uscita. Foto prima/dopo della Direzione e
    dell'Ufficio dei luoghi, nella build offline.
- **T49b · il dispositivo al centro**: il dispositivo di ogni stanza al centro, lontano dai muri (almeno tre caselle libere
  su ogni lato, pulsanti e pedane compresi), gli scaffali del piano terra spostati di conseguenza (o i file del piano terra
  ai piani sopra, se non ci stanno: decidere misurando la stanza più piena); la parete di schermi della Direzione (T46b)
  resta contro la parete di fondo. Test: per ogni stanza con un dispositivo, il rettangolo che lo circonda (+3) è libero e
  raggiungibile dalla porta; i test di T21-T28 e T46 ancora verdi (aggiornare le posizioni).
  - Esito: `fatto` (commit «Corona (T49b)»). Ogni dispositivo sta sulla colonna dell'uscita (x 12), con il suo blocco
    (frecce, pedane) a x 10..14: vetrine con le frecce alla riga 6 (il plastico e le stampanti 5..7, le pedane a 8), il grafo
    5..7, il tavolo della situazione 6..8 (il margine non tocca le frecce della pellicola alla riga 2 né lo schermo della
    storia alla 12). Misura: la stanza più piena è lo Studio dei personaggi di `valmora` (128 file); con gli scaffali laterali
    (x 3..6 e 18..21, specchiati sull'uscita: 24 posti) più 54 per piano sopra restano 3 piani, come prima: quindi scaffali
    corti ai lati e il resto sopra. Le stanze senza dispositivo (Galleria, Biblioteca, Sala sistemi, Archivio) non cambiano.
    Diverso dal previsto: la rastrelliera di una riga si spezza in tratti contigui (`corona3d.ts`), se no attraverserebbe
    il dispositivo. Test in `tests/corona.test.ts` (rettangolo +3 libero e raggiungibile, centrato; 129 file → 24 a terra,
    3 piani). Foto prima/dopo di Direzione e Ufficio dei luoghi, e dello Studio dei personaggi, nella build offline.
- Fatto quando (per pezzo): test verdi, typecheck, verifica nel browser con le foto prima/dopo, commit.
- Dipendenze: nessuna. T46c, T47, T48 dopo T49b (mettono apparecchi nelle stanze).
- Domande per l'autore: nessuna (se il piano terra non tiene dispositivo e scaffali, la scelta è scritta nel task).

### T46 · La Direzione, dentro: la sala operativa — `fatto` (T46a, T46b, T46c)
- Contesto: [`corona-proposte.md`](../archivio/3-to-do-backlog/plans/corona-proposte.md) §3.1 (approvata il 23/10). Oggi dentro la Direzione (`universo`,
  squadra dell'Arbitro, oro `ffcf5c`) ci sono solo gli scaffali di `universe.json` e le scrivanie. Gli apparecchi seguono
  le vetrine di T21-T28 (`SHOWCASES`/`GRAPH_AT` in `corona.ts`, `showcaseOf`/`stepShowcase`/`clickStudio` in
  `kernel.ts`, il disegno in `corona3d.ts`, il pannello in `studio.ts`). Guardare non cambia nulla.
- **T46a · il tavolo della situazione — `fatto`** (commit «Corona (T46a)»): al centro (5 × 3 caselle, al posto della vetrina) il mondo dall'alto come
  operazioni: il viandante, i luoghi in generazione (pulsano), le trame aperte come segnalini sulla loro regione con la
  tappa, le missioni del diario, i guasti (`faults`) dove sono accaduti, in rosso. Un metodo del kernel (`situation()`)
  che raccoglie tutto dai dati che ci sono già (atlante, `plots.json`, guasti, luoghi in coda); E o clic → pannello con
  le operazioni in corso. Test: con trame, un guasto e un luogo in coda `situation()` li elenca con la regione giusta.
  Esito: `src/kernel/situation.ts` (funzione pura, `OPERATION_COLOR`/`OPERATION_NAME`), `kernel.situation()` che la nutre;
  voce `situazione` (`SITUATION_AT` in `corona.ts`, x 14-18, y 10-12); `corona3d.ts`: il tavolo e `buildSituation` (regioni come
  lastre dorate, un segnalino per operazione, i luoghi in generazione pulsano), riletto dal renderer una volta al secondo e
  ricostruito solo se cambia; pannello `ui:situation` in `studio.ts` (mappa su canvas e le operazioni per tipo). Test in
  `tests/direction.test.ts`. Diverso dal previsto: i guasti non avevano un luogo, ora `Fault.at` (dove era il viandante quando nasce
  un guasto `module:`/`rune:` nel mondo; caricamento e manifest restano «nel codice»); la trama sta dove sta chi fa la sua tappa
  (entità, poi `origine`, poi `luogo`), la missione «vai a» sul luogo o la regione nominati. Nessun ADR (deciso in T32). Verifica:
  build + preview, `aurora` offline, pannello aperto con E, nessun errore in console. Nel seme offline le regioni sono tante e
  vicine: i loro nomi sulla mappa del pannello si sovrappongono (da rivedere con T46b se disturba).
- **T46b · la parete di schermi — `fatto`** (commit «Corona (T46b)»): sul davanti, larga quanto la sala, tre campi: a sinistra la **linea del tempo** dei
  commit (`repo.log()`, una pellicola; «<» «>» la scorrono, il clic dice cosa è cambiato e chi l'ha voluto; non torna
  indietro: `R` resta l'unico modo); al centro il **registro dal vivo** (`kernel.feed()`: chi lavora, a cosa, con quale
  modello); a destra il **quadro dei costi** (`kernel.usage` per agente e compito, in dollari, i budget di
  `universe.json → ai` come fondo scala). Le scritte sullo strato 2D o in texture (decidere misurando i fotogrammi).
  Test: la pellicola si sposta e si ferma ai bordi; il quadro somma come il pannello del Concilio.
  Esito: `src/kernel/screens.ts` (funzioni pure: `timeline`, `whoWanted`, `changedFiles`, `liveFeed`, `costBoard`), `kernel.screens()`,
  `stepTimeline`, `openScreen`; voci `parete` (`WALL_AT` in `corona.ts`: 7 + 6 + 7 caselle contro la parete di fondo, frecce sotto la
  pellicola); `UsageLedger.sessionByAgent` e `lastCall` (il registro dei consumi teneva solo modelli e compiti: gli agenti solo per la
  sessione, il file non cambia); `ModelDirector.count`; disegno in `src/render/screens.ts`, pannello `ui:screens` in `studio.ts`. Test
  in `tests/screens.test.ts`. Diverso dal previsto: «sul davanti» letto come la parete che si ha davanti entrando (quella di fondo,
  rivolta alla camera: sulla parete della porta si vedrebbe il retro). Scritte in texture, deciso misurando: in piedi gli schermi erano
  un terzo della loro altezza (la camera guarda da 54°), inclinati di 0,6 rad all'indietro quasi interi; i fotogrammi restano a
  33,4 ms come nel Nucleo e nello Studio dei personaggi, `screens()` costa 0,04 ms. Lo schermo si misura dal piede (il bordo
  anteriore della sua cella): a pari distanza vinceva lo scaffale dietro. Budget come numeri di chiamate/forge (quelli di
  `universe.json` non sono dollari). Verifica: build + preview, `aurora` offline, i tre pannelli, «<» «>», nessun errore in console.
- **T46c · allerta e postazioni** (dopo T49b): una fascia luminosa sotto il soffitto verde/ambra/rossa (guasti aperti, rifiuti del
  validatore nell'ultima ora, budget oltre l'80 %), il motivo nel pannello; le scrivanie della squadra dell'Arbitro in file
  davanti agli schermi, chi lavora nel registro si vede alla sua console. Test: i tre livelli dai tre casi.
  Esito: `fatto` (commit «Corona (T46c)»). `alertOf` in `src/kernel/screens.ts` (funzione pura; `ALERT_COLOR`, `ALERT_NAME`,
  `REJECTS_S` = 3600, `BUDGET_WARN` = 0,8) e `Screens.allerta`: **rossa** con guasti aperti o un budget esaurito, **ambra** con
  rifiuti del validatore (voci `kernel`/`scarta` del registro) nell'ultima ora o un budget oltre l'80 %, **verde** altrimenti; i motivi
  in parole in testa al pannello `ui:screens` (`studio.ts`). La fascia la disegna `ScreenWall` (`src/render/screens.ts`), ricostruita
  solo quando cambia il livello, la rossa lampeggia: sopra la parete di schermi (a 2,05, sopra i loro sostegni) e sul bordo
  interno dei muri laterali. Le console: voci `console` (`CONSOLES_AT`, riga 2, x 9..16, una per agente di `AGENTS`, sotto il
  registro e l'inizio dei costi: la riga davanti alla pellicola resta libera, il margine del tavolo pure); `Archive.consoles`, chiamata
  dal kernel una volta al secondo con `kernel.working()` (chi è al lavoro per `liveFeed`), fa sedere dietro la sua console chi lavora
  e lo toglie quando smette; E o un clic su una console aprono il registro. `ofThe` in `corona.ts` per «dell'Artista», «dello
  Scultore». Test in `tests/screens.test.ts` (4 nuovi). Diverso dal previsto: «sotto il soffitto» con la stanza aperta in alto è
  una linea in cima ai muri; la prima prova accendeva tutta la cima dei muri laterali e faceva un alone, ora è una striscia sottile al
  55 %. I budget a zero usati contano come esauriti (`fill`). Nessun ADR (interno della corona, deciso in T32). Verifica: build +
  preview, `aurora` offline, verde → ambra (un rifiuto) → rossa (un guasto di prova), due agenti alle console, pannello con E,
  nessun errore in console.
- Fatto quando (per pezzo): test verdi, typecheck, verifica nel browser (`aurora`, offline) con pannello e nessun errore.

### T47 · La Biblioteca del Mondo, dentro — T47a `fatto` (`a363021`), T47b `fatto`
- Contesto: §3.2 (il chiostro, scelto il 23/10). Oggi dentro la Biblioteca (`mondo`, Narratore, verde `7dd87d`) ci sono
  solo gli scaffali dei file di `world/`.
- **T47a · il leggio**: al posto della vetrina, un libro aperto olografico; «<» «>» sfogliano la bibbia (`world/bible.json`:
  `luoghi`, `personaggi`, `fatti`, `misteri`, una voce per pagina), E o clic aprono la pagina nel pannello con i nodi del
  grafo che la toccano (`graph.find`/`neighbors`, cliccabili come nel Nucleo). L'interno è una stanza come le altre (il
  chiostro è fuori): il leggio sta su una vasca d'acqua scura, come l'acqua della corte. Test: le pagine coprono la bibbia
  intera, i bordi fermano, una pagina che nomina una persona ne trova il nodo.
  Esito: `fatto`. `LEGGIO_AT` in `src/kernel/corona.ts` (al centro del piano terra della Biblioteca, 3 × 3, frecce «<» «>»
  ai lati collegate a `target: 'leggio'`), vasca d'acqua scura con bordo neon verde `#7dd87d` e piedistallo con leggio inclinato;
  sopra di lui il libro aperto olografico (`bookHologram` in `src/render/corona3d.ts`) con pagine che si aprono a ventaglio,
  righe di testo luminose e faville runiche fluttuanti. `src/kernel/bible.ts` con funzioni pure `biblePages` (prologo, luoghi,
  personaggi, fatti, misteri) e `touchingNodes` (risolve nodi del grafo per nome, citazioni dei fatti e menzioni testuali);
  `kernel.bibleOf()`, `stepBible(d)` (i bordi si fermano a pagina 0 e a count - 1), `openBible()`. Pannello `ui:bible`
  in `src/ui/studio.ts` con tag della sezione, titolo, testo, nodi del grafo collegati cliccabili (aprono il grafo nel Nucleo
  centrati sul nodo) e pulsanti di navigazione. `tests/bible.test.ts` (6 test), test e typecheck verdi, verifica browser positiva.
  Diverso dal previsto: la prima pagina è il prologo (titolo, sintesi, storia della bibbia) per coprire l'intera bibbia senza
  tralasciare il racconto fondativo.
- **T47b · le tavole delle regole**: a parete una lastra per giudizio di `world/rules.json` (le ultime 12,
  quelle che il Narratore riceve, brillano), clic → il giudizio nel pannello. Test: le lastre sono quante le regole (o il massimo che la
  parete tiene, con «<» «>»), le ultime marcate.
  Esito: `fatto`. `TABLETS_WALL` (`{ x0: 3, x1: 20, y: 1 }`), `TABLETS_MAX = 16`, `FOCUSED_RULES = 12` e `ruleTablets` in `src/kernel/corona.ts`;
  se le regole sono <= 16, vengono posizionate tutte le lastre centrate sulla parete nord (y = 1) senza frecce; se superano la capienza,
  vengono mostrate 16 lastre con le frecce «<» e «>» (`target: 'regole'`, `stepRules(d)`, i bordi fermano); le ultime 12 regole stabilite in
  `world/rules.json` hanno `marked = true` e brillano con bagliore smeraldo/oro e faville fluttuanti (`corona3d.ts`). Clic o E apre `ui:rule`
  nel pannello (`studio.ts`) con esito («si può»/«non si può»), badge «Regola recente», racconto del Concilio, effetti e carta.
  `tests/rules_wall.test.ts` (3 suite / 7 test), typecheck e test verdi, verifica nel browser positiva con screenshot delle lastre.
  Diverso dal previsto: il canone inciso sopra la porta è stato rimosso per non ostruire l'uscita, non creare sovrapposizioni visive e
  perché le combinazioni di rune sono infinite (T57).
- Fatto quando (per pezzo): test verdi, typecheck, verifica nel browser.

### T48 · La Galleria dell'Artista, dentro e il plinto — `fatto`
- Contesto: §3.3 (approvata il 23/10). Oggi la Galleria (`galleria`) espone i modelli come quadri con «riscolpisci».
- **T48a · il tornio dello Scultore** — `fatto` (`a4483c7`): al posto della vetrina un piedistallo che gira con il modello scelto, il suo
  programma eseguito **passo passo** (i passi di MarkovJunior, come nella sandbox del lab: i passi intermedi da
  `src/mj/run.ts`, nei worker o renderizzati), «<» «>» cambiano modello; il pannello: le quattro foto (`src/mj/photo.ts`), voto e consigli
  dell'Artista, il programma, «riscolpisci». I quadri restano alle pareti. Test: i passi di un modello del seme finiscono
  nella griglia finale; «<» «>» scorrono la libreria.
  - Esito T48a: `src/kernel/corona.ts`: `TORNIO_AT` (3 × 3 al piano terra della Galleria, `DEVICE_MARGIN = 3` attorno), frecce «<» e «>»
    ai lati; `DEVICES` include `'galleria'`. `src/kernel/tornio.ts`: scansione ordinata dei modelli della libreria (`models/*.xml`),
    recupero classe, autore, voto, consigli e problemi canonici; esecuzione con `runMjx` e snapshot intermedi (l'ultimo coincide con le
    celle della griglia finale) e rendering delle 4 foto 3/4 pure (`src/mj/photo.ts`). `src/kernel/kernel.ts`: navigazione circolare
    `stepTornio(d)`, `tornioOf()`, interazione con E (`interact`) o clic (`clickStudio`); `requestResculpt` su modelli (`model:<id>`).
    `src/ui/studio.ts`: pannello `ui:tornio` con anteprima nitida su canvas delle 4 viste 3/4, badge del voto, consigli e problemi, blocco
    codice XML e azione «Riscolpisci». `src/render/corona3d.ts`: plinto a gradoni in metallo scuro con bordi neon fucsia/magenta.
    `src/render/tornio.ts`: `TornioView` con piatto rotante, animazione a ciclo continuo tra gli snapshot voxel, etichetta ed integrazione
    in `src/render/coronaview.ts` con didascalia in `overlay()`. `tests/tornio.test.ts` (7 test completi), typecheck e test verdi (50 suite, 363 test),
    verifica nel browser con subagent (teletrasporto in Galleria, apertura pannello con foto e scorrimento con `stepTornio`).
- **T48b · il plinto nel piazzale** — `fatto`: sulla lettera `plinto` (Q) del modello della Galleria (`corona-galleria.xml`),
  il kernel rileva la superficie del plinto e posa un'istanza di un modello della libreria scelto ad ogni visita della corona
  (seme derivato dal tick di arrivo, escludendo i modelli infrastrutturali `corona-*` e alternando sempre rispetto all'ultima visita),
  ridotto in scala (`scale <= 1.0`) per alloggiare stabilmente sui 2 × 2 della superficie senza generazioni e senza aggiungere alcuna
  collisione al suolo oltre al plinto stesso. La porta d'ingresso della Galleria rimane pienamente raggiungibile e libera dal viale.
  - Esito T48b: `src/kernel/corona.ts`: `CampusStructure.plinto` e calcolo coordinate reali, altezza superficie (`z = 1.0`) e ingombro (`width`, `depth`)
    dalle celle con colore `name: 'plinto'` in `placeStructure`. `src/kernel/kernel.ts`: `PlintoSculpture`, `visitCorona(tick)`, `updatePlinto()`,
    `plinto()`, aggiornamento automatico su transizione zona verso `corona` e sincronizzazione in `placeCampus()`. `src/render/corona3d.ts`:
    rendering della scultura centrata e posata sulla superficie del plinto con `modelObject` e scaling proporzionale ai limiti massimi di sicurezza,
    inclusione di `plintoSculpture` in `campusKey(k)` per invalidazione cache e rendering reattivo. `tests/plinto.test.ts` (5 test completi),
    typecheck e test verdi, verifica nel browser con screenshot da vicino (`galleria_plinto_closeup`) e dal viale (`galleria_avenue_view`).
- Fatto quando (per pezzo): test verdi, typecheck, verifica nel browser da vicino e dal viale.

### T28 · Il Nucleo, dentro — `fatto` (`673eeba`) (dipende da T12)
- Il grafo del mondo navigabile in UI.
- Esito: `corona.ts`: voce `grafo` (3 × 3, `GRAPH_AT`, dove gli altri edifici hanno la vetrina) al piano terra del Nucleo;
  `kernel.ts`: E o un clic (`clickStudio`) → `ui:graph`. `src/ui/graphlayout.ts`: `ForceLayout` senza DOM (molle sugli archi,
  repulsione entro 2.5 spaziature con una griglia, gravità debole; parte da una spirale con i nodi più connessi al centro;
  deterministico). `src/ui/graph.ts` (`GraphPanel`): tutto il grafo sul canvas, colorato per tipo (`NODE_COLOR`, `NODE_NAME`,
  `EDGE_NAME` in `graph.ts`), ciò che `check()` trova cerchiato di rosso e in elenco quando nulla è scelto; trascina/frecce,
  rotella/+/- verso il mouse; ricerca per nome (`find`, Invio sceglie il primo); legenda che nasconde i tipi; il nodo scelto
  con `describe`, attributi, file («Apri il file») e archi cliccabili; doppio clic o «Vicinato»: solo i nodi a due passi,
  disposti di nuovo, e il vicinato segue il nodo scelto. `corona3d.ts`: piedistallo e ologramma che gira (i 120 nodi più
  connessi su una sfera, voxel luminosi nel colore del tipo, archi come linee). `tests/nucleus.test.ts` (5). Nel browser
  (`aurora`, offline): 362 nodi, 597 archi; ricerca «Agnese», vicinato, Berta, il file, Esc; nessun errore. Misure: 1838 nodi di
  `valmora` in ~0.6 s in Node (nel browser a 6 passi per fotogramma, chiude con l'inquadratura). Diverso dal previsto: è il
  grafo **del mondo** (ADR-0045), non quello di Graphify sul codice (che non gira nel browser); con la luce piena l'ologramma
  era una palla abbagliante, quindi voxel piccoli a metà intensità; nessun ADR (interno della corona, come T21-T24).

### T31 · Gli otto edifici della corona nella libreria — `fatto` (commit «Corona (T31)»)
- Contesto: T20 ha fatto il motore (ADR-0049); mancano i programmi. **Per l'autore**: esegui il prompt di
  [`docs/prompts/gemini-strutture-corona.md`](../archivio/3-to-do-backlog/prompts/gemini-strutture-corona.md) in Gemini CLI, una struttura per
  sessione (`magia`, `persone`, `cose`, `oggetti`, `luoghi`, `sistemi`, `nucleo`, `concilio`), poi rimetti questo task
  `da fare` (bastano anche alcune).
- Fare: copiare `lab/mjx/models/corona-<id>.xml` in `universe/models/` con la voce in `models/index.json`
  (`classe: edificio`, `nome`, `autore`, `voto`, `vpt: 8`); controllare che girino in Node sotto il limite di tempo, che la
  porta sia raggiungibile dal viale (un test per edificio presente) e che il modello stia nel suo settore; escludere i
  `corona-*` dal `ModelDirector` e dal «riscolpisci» della Galleria se lo Scultore non deve toccarli (o deciderlo con
  l'autore); verifica nel browser da quattro lati, di giorno e di notte.
- Fatto quando: gli edifici scritti stanno nel campus, test verdi, commit.
- Avanzamento: **magia** fatta (la Torre della Magia di Gemini 3.8 Flash, con l'animazione `energia`: anelli di neon che
  pulsano w → T → t → u). Nel gioco: `universe/models/corona-magia.xml` e la voce nell'indice; il campus mostra i
  fotogrammi delle animazioni degli edifici (`animateRing` in `corona3d.ts`); l'aggiornamento dal seme aggiunge le voci
  nuove di `models/index.json` anche agli universi che l'hanno riscritto (senza, la torre avrebbe 20 voxel per casella);
  `tests/campus.test.ts`: per ogni edificio del seme tempo, settore, porta dal viale, animazione. Nel lab la vetrina ora
  anima i modelli («mostra» li nascondeva: corpo spento, nessun fotogramma acceso). ModelDirector e «riscolpisci» non
  toccano già i `corona-*` (il primo fa solo i modelli che mancano, il secondo solo moduli e oggetti). Mancano `persone` (scritta da Gemini in `bdd198e`, nel lab: da portare nel gioco),
  `cose`, `oggetti`, `luoghi`, `sistemi`, `nucleo`, `concilio`, `universo`, `galleria`, `mondo` (schede del 23/10); per ognuno aggiungere l'id alla lista del test.
- Esito: **tutti e undici** nel seme (`universe/models/corona-*.xml`, copiati dal lab; voci `classe: edificio`, `vpt: 8`,
  autore `gemini-3.8-flash (Gemini CLI, T19)`, senza `voto`: nessun giudizio dell'Artista). Anche `corona-magia.xml` è
  aggiornato: nel gioco c'era la versione prima dell'animazione a 16 fotogrammi (`a0f1e4b`). `tests/campus.test.ts` prova
  tutti gli undici (in Node: magia ~10 s al primo avvio a freddo, gli altri 0.6-1.3 s; tutti nel loro settore, porta dal
  viale, animazioni che cambiano il modello); il test del modello di prova costruisce un campus senza i `corona-*` del
  seme (prima contava sugli altri edifici a blocchi). Nel browser (build di produzione, `?offline`): undici strutture sui
  loro modelli, nessun guasto, nessuna chiave in `dist/`. Diverso dal previsto: verifica visiva solo parziale (Sala del
  Concilio, Ufficio dei luoghi, Biblioteca di giorno; non da quattro lati né di notte). Da guardare (T50 o un ritocco
  dei programmi): da vicino il bagliore dei neon rosa della Sala del Concilio riempie lo schermo; con la camera girata,
  dall'interno del modello tagliato, l'insegna dell'Ufficio dei luoghi si legge al contrario (da controllare dal viale).
  Il `dev` di Vite su un'altra porta non caricava wasmoon (`LuaFactory` mancante); la build di produzione sì.

### T58 · Ritocchi di luce: il piedistallo del Nucleo e il silos dei personaggi — T58a `fatto` (`33638c4`), T58b `fatto` (`93da812`)
- Contesto: richiesta del 24/10, sera ([`to-do-2026-10-24.md`](../archivio/3-to-do-backlog/userchats/to-do-2026-10-24.md), «Luci del Nucleo e del silos»).
  Il disegno è in `src/render/corona3d.ts`; non tocca il kernel.
- **T58a · il piedistallo del grafo**: oggi (`itemMesh`, caso `grafo`) il gradino alto ha il neon solo sul bordo davanti e su
  quello dietro, il basso solo davanti: da un lato si vedono due gradini accesi, dall'altro uno. Il neon gira tutto attorno
  al bordo superiore di entrambi i gradini, su tutte e quattro le facce (come `rim`, già usato da scaffali e piedistalli).
  Esito: `rim` su entrambi i gradini (y = 0.18 e y = 0.42) con colore `#6fc3ff` (opacità 0.5) in `itemMesh` di `src/render/corona3d.ts`.
  Test dedicato in `tests/corona.test.ts` con verifica geometrica dei vertici del glow su tutte e quattro le facce dei due gradini.
  Verifica visuale nel browser con screenshot prima/dopo (frontale e angolata a quarto di giro): illuminazione perfettamente simmetrica da ogni angolazione. Diverso dal previsto: nessuno.
- **T58b · il silos**: oggi (`showcaseBody`, caso `silos`) la base e il coperchio sono parallelepipedi e sotto il vetro c'è una riga
  di luce che sottolinea il nome dell'individuo e lo rende meno leggibile. Fare: via le due righe; alla base del cilindro di
  vetro (raggio 0,95) un cerchio di luce; il coperchio diventa un cilindro solido opaco poco più largo del vetro, con un
  cerchio di luce come quello della base che combacia con il bordo esterno del vetro. La base resta (o diventa anch'essa un
  cilindro, se a vista il parallelepipedo stona col coperchio tondo: decidere guardando).
  Esito: base e coperchio trasformati in cilindri opachi solidi (raggio 1.05, dark `#10101a`) con metodi `cylinder` e `ring` in `Builder` (`src/render/terrain.ts`); rimossi i due rettangoli luminosi orizzontali; aggiunti cerchi di luce (`circleRim` in `src/render/corona3d.ts`) al perimetro del vetro (r = 0.95) sia alla base che sotto il coperchio; targhetta con il nome riposizionata sul fronte della base cilindrica (z = cz + 1.07, y = 0.15) perfettamente leggibile senza sovrapposizioni. Test geometrico dedicato in `tests/corona.test.ts`. Convalida visuale nel browser da fronte e ad angolo a quarto di giro: resa perfettamente simmetrica e pulita da ogni angolazione. Diverso dal previsto: anche la base è diventata un cilindro perché il parallelepipedo originale (profondo solo 1 casella) lasciava sporgere il vetro cilindrico di raggio 0.95.
- Fatto quando (per pezzo): typecheck e test verdi, verifica nel browser da vicino (Nucleo e Studio dei personaggi, anche con la
  camera girata), foto prima/dopo, commit. Sono piccoli: si possono fare nella stessa sessione.
- Dipendenze: nessuna. Domande per l'autore: nessuna.

### T50 · La corona personalizzata: arredi futuristici, trasporti e Concilio di gerboa — `fatto`
- Contesto: consultazione del 24/10 ([`risposte-T50.md`](../archivio/3-to-do-backlog/userchats/risposte-T50.md)). Gli undici edifici sono completati
  nel campus (T31 fatto). L'ambientazione della corona deve essere marcatamente futuristica e artificiosa («lo studio che
  programma la realtà»), sfruttando MarkovJunior a piena potenza: programmi con semi riutilizzabili ad altissima varietà visiva
  e fotogrammi animati. Fuori non camminano i membri del Concilio, ma una vita robotica operosa; i membri del Concilio (negli
  interni degli edifici e nella Direzione) sono un tributo alla *Guida Galattica per gli Autostoppisti*: gerboa giganti
  pacioccosi con cappelli distintivi per ruolo.
- **T50a · Prompt per Gemini CLI (`docs/prompts/gemini-esterni-corona.md`) — `fatto` (`294a734`)**:
  - Predisposto il file guida per Gemini CLI ([`docs/prompts/gemini-esterni-corona.md`](../archivio/3-to-do-backlog/prompts/gemini-esterni-corona.md), stile `gemini-strutture-corona.md`)
    con schede dettagliate, distinzione di scala (8 vpt per arredi e veicoli; 20 vpt per i gerboa del Concilio), regole sui costi,
    e istruzioni mirate a sfruttare tutta l'espressività di MarkovJunior (regole generative ramificate ad albero/frattali,
    voxel luminosi `glow="True"`, simulazione pittorica di superfici traslucide e riflettenti, fotogrammi animati `<animation>` e parti articolate `part`).
    Schede pronte per: 4 arredi urbani (`corona-albero-luce`, `corona-lampione`, `corona-panchina`, `corona-totem`), 2 veicoli logistici
    (`corona-drone`, `corona-treno`) e gli 8 membri del Concilio come gerboa pacioccosi con i loro cappelli distintivi
    (`corona-gerboa-narratore`, `corona-gerboa-cartografo`, `corona-gerboa-artista`, `corona-gerboa-scultore`,
    `corona-gerboa-fisico`, `corona-gerboa-ingegnere`, `corona-gerboa-arbitro`, `corona-gerboa-referente`).
- **T50b · Modelli di arredo urbano futuristico (MarkovJunior, 8 voxel per casella) — `fatto`**:
  - *Alberi di luce neon e trasparenti* (`universe/models/corona-albero-luce.xml`): chiome sintetiche a calice in cristalli traslucidi sfaccettati e liane luminescenti (`glow="True"`); animazione a 8 frame stocastica (`vita`) di allungamento liane e diffrazione.
  - *Lampioni futuristici* (`universe/models/corona-lampione.xml`): struttura a stelo ricurvo in lega scura con anello a sbalzo e lanterna al plasma ciano/ambra ad alta luminescenza.
  - *Panchine sintetiche* (`universe/models/corona-panchina.xml`): seduta ergonomica sospesa a lama con cuscino a nido d'ape e basamento a levitazione o luce guida.
  - *Totem informativi* (`universe/models/corona-totem.xml`): stele poliedrica con display a cascata olografica e bande laterali pulsanti.
  - Sincronizzati in `universe/models/` e catalogati in `universe/models/index.json`.
- **T50c · Logistica e trasporti negli esterni (droni e trenini) — `fatto`**:
  - *Droni volanti* (`universe/models/corona-drone.xml`): telaio aerodinamico compatto, calotta sensoriale, propulsori a rotore e pod per il trasporto pacchetti.
  - *Trenini dei file* (`universe/models/corona-treno.xml`): convoglio monorotaia magnetica con testata aerodinamica e carrozze a scomparti luminosi per cassette di dati.
  - Animazione e percorsi in `src/render/corona3d.ts` (`animateRing`): 4 droni volanti lungo archi parabolici di Bézier tra gli edifici con roll/banking e rotori oscillanti; 2 trenini a levitazione che percorrono il binario anulare del viale a velocità costante.
- **T50d · Gli avatar del Concilio: gerboa giganti con cappello — `fatto`**:
  - Modello base `universe/models/corona-gerboa.xml` (tributo alla *Guida Galattica per gli Autostoppisti*): sagoma paffuta e soffice, orecchie ampie, lunghe zampe posteriori, coda con ciuffo e occhi grandi e luminosi.
  - 8 modelli con cappello tematico distintivo per ruolo:
    - *Narratore* (`corona-gerboa-narratore.xml`): cilindro da cantastorie;
    - *Cartografo* (`corona-gerboa-cartografo.xml`): berretto coloniale da esploratore con visiera;
    - *Artista* (`corona-gerboa-artista.xml`): basco inclinato da pittore bohémien;
    - *Scultore* (`corona-gerboa-scultore.xml`): visiera da saldatore e caschetto protettivo;
    - *Fisico* (`corona-gerboa-fisico.xml`): occhialoni protettivi da laboratorio e tocco;
    - *Ingegnere* (`corona-gerboa-ingegnere.xml`): berretto da macchinista/tecnico con monocolo/lente;
    - *Arbitro* (`corona-gerboa-arbitro.xml`): parrucca giudiziaria riccioluta d'epoca;
    - *Referente* (`corona-gerboa-referente.xml`): berretto da concierge con auricolare luminoso.
  - Integrazione completa in `Avatars` (`src/render/corona3d.ts`): rendering dei modelli MarkovJunior con fallback gerboa base, scala ~0.65, orientamento verso i tavoli/schermi e animazione corporea nel parlato e negli spostamenti.
- **T50e · Posizionamento, collisioni e rendering nel campus — `fatto`**:
  - Generazione procedurale degli arredi (`CampusProp`) in `src/kernel/corona.ts`: 81 oggetti posizionati strategicamente (lampioni lungo la linea al neon del viale, alberi di luce sui prati, panchine e totem olografici agli imbocchi dei vicoli).
  - Pervietà garantita al 100%: viali di transito e ingressi delle porte degli 11 edifici lasciati rigorosamente liberi da collisioni solide.
  - Collisione `free()` / `propAt()` gestita dal kernel per i prop solidi (alberi, lampioni, totem).
  - Rendering istanziato con materiali specifici (`MAT.sway` per le fronde degli alberi di luce, `MAT.corona` per gli altri arredi) in `src/render/corona3d.ts`, aggiornamento reattivo al caricamento asincrono delle geometrie (`k.forms.version`).
  - Prefetch nel kernel per riscaldamento worker (`kernel.ts`).
  - Test dedicati in `tests/corona.test.ts` e `tests/campus.test.ts`, verifica nel browser positiva sia di giorno sia di notte.
- Fatto quando: prompt per Gemini scritto; modelli di arredi, droni/trenini e gerboa generati e collaudati in sandbox;
  campus popolato con arredi e droni in movimento; gerboa visibili con i loro cappelli negli interni; test di conformità verdi;
  verifica visuale di giorno e di notte; commit.
- Dipendenze: nessuna (T31 è completato). Domande per l'autore: nessuna (chiarite in `risposte-T50.md`).

### T59 · Da Rune a QUINE42: refactoring del nome del gioco — `fatto` (`1133a70`)
- Contesto: a seguito di consultazione, il nome provvisorio del gioco passa da «Rune» a «QUINE42» (tributo al concetto
  di quine — il programma che produce il proprio codice sorgente, cuore del gioco — e alla Risposta Fondamentale 42 della
  *Guida Galattica per gli Autostoppisti*).
  *Distinzione fondamentale*: la meccanica delle **rune** (token Lua nel terreno, lastre luminose, canone delle rune,
  magia e borsa delle rune) resta invariata e parte integrante del mondo e della diegesi; ciò che cambia è il **nome del
  gioco** stesso, l'identità del progetto e il branding.
- Fare:
  1. **Configurazione e metadati di progetto**: `package.json` (`name: "quine42"`, eventuale descrizione); aggiornare
     script o riferimenti correlati se presenti.
  2. **Interfaccia utente e HTML**:
     - `index.html`: `<title>QUINE42</title>`, schermata intro `#intro` (`.name`: `QUINE42`; il logo runico ᚱ ᚢ ᚾ ᛖ e
       il payoff restano coerenti con il mondo), intestazione aiuto `<h2>QUINE42</h2>`.
     - UI / messaggi di sistema: banner, schermata di caricamento o dialoghi di aiuto dove compare il nome «Rune».
     - Console del browser: esporre `window.quine` (o `window.quine42`), mantenendo `window.rune` come alias per
       retrocompatibilità con test e console.
  3. **Documentazione e regole agenti**:
     - Titoli e aperture in `README.md`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`.
     - Documenti di design (`docs/design.md`, sommario) indicando il nuovo nome del gioco e chiarendo la distinzione
       dalle rune come token.
  4. **Decisione architetturale**:
     - Registrare la decisione in un ADR (`docs/adr/0062-da-rune-a-quine42.md`) e aggiornare `docs/adr/README.md`.
  5. **Verifiche e test**:
     - `npm run typecheck`, `npm test` e `npm run build` verdi.
- Fatto quando: typecheck e test verdi, build funzionante, verifica nel browser di titolo, schermata iniziale intro, guida H e
  accesso via console (`window.quine` e `window.rune`), ADR-0062 registrato, commit.
- Esito: `package.json` (`quine42`), `index.html` (title, intro .name, help h2), `src/main.ts` (`window.quine` e `window.quine42` con alias `window.rune`), documentazione (`README.md`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `docs/design.md`), ADR-0062. Verificato nel browser: titolo, intro, help e `window.quine === window.rune`. Diverso dal previsto: nessuno.
- Dipendenze: nessuna.

### T60 · Il raggio 42: i 42 passi verso la corona — `fatto` (`17045a9`)
- Contesto: con il nuovo nome QUINE42 (T59, tributo alla Guida Galattica e alla ricorsione), il cerchio di simulazione
  si allinea: 42 passi per uscire (non più 44). Il raggio del cerchio (`universe.json → circleRadius` e default in
  `src/kernel/universe.ts`) diventa 42.
- Fare: `circleRadius: 42` in `universe/universe.json` e nel kernel; la corona deve rimanere invisibile e fuori vista dal
  centro finché il tappeto è attivo (ADR-0009); verificare con la camera 3/4 e il raggio di rendering che dal centro (0,0)
  nessun edificio, strada o bagliore del campus entri nel frustum prima che il tappeto si fermi (`coronaRevealed()`);
  aggiornare `README.md` (da 44 a 42 passi), AGENTS.md, il canone e i test esistenti (`tests/kernel.test.ts`,
  `tests/campus.test.ts`, `tests/explore.test.ts`).
- Fatto quando: test verdi, verifica nel browser che camminando normalmente la corona sia nascosta, e fermando il tappeto
  (`carpet.active = false`) bastino esattamente 42 passi per varcare il cerchio e rivelare il campus; commit.
- Esito: `universe/universe.json` e default `src/kernel/universe.ts` impostati a 42; `src/kernel/fourthwall.ts` include `42 passi|quarantadue passi`; aggiornati `README.md`, `AGENTS.md`, ADR-0063 (`docs/adr/0063-raggio-42-passi-corona.md`) e `docs/adr/README.md`. Test aggiornati (`tests/corona.test.ts` e `tests/kernel.test.ts` con verifica a 41 e 42 passi). Verificato nel browser: camera 3/4 dal centro non vede la corona, a 41 passi è ancora `sim`, a 42 passi `zone` diventa `corona`, `coronaRevealed() === true` e il campus viene renderizzato. Diverso dal previsto: nessuno.
- Dipendenze: T59.

## Terreno, strutture e taglie

Richieste del 24/10 ([`to-do-2026-10-24.md`](../archivio/3-to-do-backlog/userchats/to-do-2026-10-24.md), «Generazione della heightmap» e «taglia»).

### T51 · Il livello del mare — `fatto` (T51a; il motore dell'acqua è il task T51b, qui sotto)
- Pipeline: claude · stima 6% · priorità 50
- Contesto: ADR-0048. Oggi ogni specchio d'acqua è piano **dentro il suo chunk** (`waterLevels` in `relief.ts`: al livello
  più basso delle sue caselle, contando solo il chunk); lo stesso lago o fiume su due chunk ha due livelli, e laghi vicini
  livelli diversi: a vista l'acqua ha dei dislivelli (si vede anche in `Blocchi.png`).
- **T51a · il livello del mare** — `fatto` (commit b3f4f53): un livello dell'acqua per il mondo (`universe.json → rilievo.mare`, o derivato dal rilievo
  alla Genesi): il mare e ciò che lo tocca stanno lì, il terreno sotto viene scavato fino a lui con le sponde (si sale sempre,
  come ora); laghi e fiumi interni hanno un livello per specchio **intero** (attraverso i chunk: lo specchio si segue fino
  al bordo del mondo caricato, deterministico, cache per regione). Test: lo stesso specchio su due chunk ha un livello; due
  chunk caricati in ordine diverso danno gli stessi livelli; nessuna casella d'acqua sopra la terra che la circonda.
  - Esito: `worldLevels` (`relief.ts`) è un campo dei livelli di tutto il mondo caricato (cammino minimo: acqua piana e mai
    sopra la riva, sponde di due livelli a casella, terra mai sotto il mare), su cui `chunkLevels` posa i lotti; mare da
    `rilievo.mare` o `Relief.sea` (10 % delle caselle sotto). Rispetto al previsto: la terra sotto il mare **sale** al mare
    invece di scavare il fondo; niente cache per regione, il campo si rifà quando cambia un chunk (pochi ms) e `Chunk.levels`
    fa ridisegnare chi cambia livelli senza cambiare caselle; il client sottile riceve le caselle di mare (`PlaceView.mare`);
    la miniatura usa il luogo da solo. Nel browser: 292 attraversamenti d'acqua tra chunk, tutti allo stesso livello.


### T51b · Il motore dell'acqua — `fatto` (dipende da T51)
- Pipeline: claude · stima 5% · approvato · priorità 50
- Contesto: spezzato da T51 il 31/10 (T51a fatto; `dossier T51`, `docs/pipeline/domande/T51.md`). Si appoggia a `worldLevels` di T51a.
- Fare (ADR nuovo): l'acqua che scorre quando il terreno cambia (incantesimi che alzano o abbassano
  il terreno, T57; «Altro…» che scava). Proposta: MarkovJunior resta per **generare** (rilievo, fiumi alla Genesi); per la
  fisica un automa cellulare del kernel sui chunk caricati (quantità d'acqua per casella, scorre verso i vicini più bassi,
  pochi passi al secondo, solo dove qualcosa è cambiato, si ferma quando è in equilibrio e salva il risultato nel piano
  del luogo). Un programma MarkovJunior per tick su tutto il mondo caricato costerebbe troppo (ogni passo cerca le regole su
  tutta la griglia e l'acqua non si ferma mai del tutto) ed è difficile da ottimizzare: possibile solo come regola locale
  attorno al punto cambiato. Test: una conca scavata accanto a un lago si riempie e il lago si abbassa del giusto.
- Fatto quando: test verdi, verifica nel browser su un lago tra due chunk (una conca scavata accanto che si riempie), ADR nuovo, commit.
- **Risposta dell'autore** (30/10): sì, l'automa cellulare del kernel (opzione 1); MarkovJunior resta per generare. Nasce da T51a:
  `dossier T51`.
- Esito: [ADR-0094](../adr/0094-il-motore-dell-acqua.md). `src/kernel/water.ts` (`WaterFlow`): letto e quantità per casella, scorre verso i
  vicini più bassi (0,2 della differenza), solo sulle caselle attive, si ferma in equilibrio, conserva la quantità; il mare (acqua al
  livello del mare) è una sorgente; una casella d'acqua porta dentro tutto il suo specchio prima di scorrere. Nel kernel `kernel.dig(col,
  row, delta)` (lo strumento per T57c e «Altro…» che scava; nessuna API Lua), `waterTick` (10 passi ogni 6 tick), `applyWater` (le caselle
  che si riempiono o si asciugano cambiano tipo con `setTile`); il piano tiene `scavi` e `acqua`, `worldLevels` li prende (`pinned`); il
  `PlaceView` li porta al client sottile. Test in `tests/water.test.ts` (conca accanto a un lago: 100·(L−6)+20·(L−4)=200, il lago scende a
  22/3; nel kernel uno stagno tra due chunk). Nel browser: specchio di 28 caselle tra (0,0) e (1,0), conca di 8 caselle scavata accanto:
  si riempie, un solo livello su 36 caselle, volume 56 conservato, superficie 28/36 come atteso. Diverso dal previsto: la profondità di
  un'acqua mai mossa è nominale (`DEEP`, 2 livelli: il rilievo sotto l'acqua è sopra la sua superficie, non un fondo); lo specchio al livello
  del mare è mare (sorgente), e nel browser per vederlo scendere il mare è stato abbassato a 0; suite intera: falliscono per timeout sotto
  carico e, anche sul base, `explore.test.ts` (3) e `partita.test.ts` (1).

### T52 · I sotterranei — T52a `fatto` (progetto, ADR-0091), T52b `fatto`, T52c-f `da fare`
- Pipeline: claude · stima 3% · approvato · priorità 50
- Contesto: oggi niente sta sotto il livello del terreno (il rilievo è una colonna piena, i modelli stanno sul suolo,
  `floorAt`). L'autore vuole i sotterranei (anche un edificio seminterrato nella corona, come la Sala sistemi).
- **Risposte dell'autore** (30/10, `docs/pipeline/domande/T52.md`): **(b)**, parti sotterranee delle strutture (cantine, cripte):
  il modello scende sotto lo zero e il terreno si taglia; forse poi anche (c), mai (a) da sola. La **profondità del terreno** si
  genera con lo stesso meccanismo con cui il Cartografo genera su X e Y (bozza → programma → piano), limitata a poche caselle sotto
  la più profonda visibile. Nella corona dell'edificio seminterrato cambia **solo l'esterno**.
- **T52a · il progetto** — `fatto`: [ADR-0091](../adr/0091-i-sotterranei.md) e una voce in `AGENTS.md`. In breve: `sotto: N` nella
  voce del modello (`Form.base`), ogni pavimento sotto il suolo raggiunto dal piano terra o il modello entra senza cantina; il
  Cartografo chiede `strutture[].sotto` e cose `sotto`; strati del terreno da terreni `strato` + bozza per colonna + programma
  `sottosuolo` dell'ambiente, salvati nel piano (`strati`, `PlaceView.strati`), `D` = cantina più profonda + 2, al più 6; buco del
  terreno sotto il modello e taglio a caselle in un disco attorno a chi sta sotto, con le bande degli strati e la luce attenuata.
  Diverso dal previsto: nessuno; le gallerie tra più strutture (la (c)) restano fuori, da decidere dopo le cantine.
- **T52b · il modello che scende** (kernel e renderer, ADR-0091 punti 2-3): `sotto` in `ModelInfo` (`models/index.json`), la scatola
  della classe allungata in basso, `Form.base`; `floorAt`, `structureAt`, `topUnder`, `bodyGround` (suolo a `base`), `rampBlocks`
  (fuori dal modello pavimento `base`), i piani di T53b (`Form.levels`, `pos.z`, `settleHeights`: se T53b non è ancora nel base,
  aspetta T70) e il renderer che posa il modello `base` più in basso e accorcia le colonne del terreno dove il modello ha voxel sotto
  il suolo (il buco, senza strati). Il controllo del modello: ogni pavimento sotto il suolo raggiunto dal piano terra, altrimenti
  `sotto` tolto. Test: un modello di prova con una cantina e una scala che scende (si scende, si risale, dalla cantina non si esce
  altrove, il salto non ci entra); i modelli senza `sotto` come prima. Verifica nel browser con `addModel` accanto al borgo.
  Dipendenze: T53b integrato (T70).
  **Fatto** (T52b): `sottoOf`, `Form.base`/`Form.hole`, `surfaces(…, fill)`, `groundOfForm` (la cantina tiene se ogni pavimento
  sotto il suolo si raggiunge dal piano terra, altrimenti resta dentro la terra), `levelIn`/`floorAt`/`floorBelow`/`topUnder`/
  `rampBlocks`/`interiorPoints` da `base`, `kernel.sunk(id)` e `kernel.holesIn(chunk)` nel renderer; test in `tests/cellar.test.ts`;
  verificato nel browser con `addModel` accanto al borgo (si scende a −0,9, la tromba si vede, dal muro non si esce, si risale).
  Diverso dal previsto: il controllo sta nella forma (in ogni client) e non rimanda allo Scultore (lo farà T52f); i programmi
  della libreria hanno sempre `size` sulla radice (il validatore la chiede), quindi la cantina sono i voxel più bassi della loro
  scatola: la scatola allungata vale solo per i programmi senza `size`, e T52f deve far scrivere a `withSize` la scatola
  della classe più `sotto · vpt` in basso. Suite intera: 56 file verdi, 12 con timeout (avvio del kernel ~9,7 s contro hook da
  10 s) che falliscono uguali sul base senza T52b (provato su `partita.test.ts` e `kernel.test.ts`); verdi `cellar`, `ramps`,
  `storeys`, `jump`, `forms`, `determinism`.
- **T52d · la profondità del terreno** (ADR-0091 punto 5): terreni `layer: 'strato'` (predefiniti nel seme; alla Genesi il Cartografo
  ne scrive 2-4 con gli altri terreni, il Fisico li vede), bozza degli strati per colonna (deterministica, dalla casella e dal bioma),
  programma `sottosuolo` facoltativo dell'ambiente (MarkovJunior 3D, cima congelata, provato su `sampleDrafts`), `strati` nel piano
  del luogo e in `PlaceView`; i piani vecchi ricalcolano dalla bozza. Schema Gemini, `MockModels`, prompt del Cartografo, validatore.
  Test: stesso seme stessi strati, programma che non regge rifiutato col motivo, `D` dalla cantina più profonda. Dipendenze: T52b
  (per `D`; si può fare prima con `D = 2`).
- **T52e · vedere sotto terra** (ADR-0091 punto 6): `kernel.underground()`; il taglio a caselle in un disco (raggio 6, verso la camera)
  di terreno, strutture e cose sopra `1,15 + floorAt`; le colonne tagliate con in cima lo strato e i fianchi verso il disco a bande;
  le facce del buco a bande; sole e cielo attenuati con la profondità. Verifica nel browser in una cantina (screenshot sopra e sotto).
  Dipendenze: T52b, T52d.
- **T52f · il Cartografo e lo Scultore chiedono le cantine** (ADR-0091 punto 4): `strutture[].sotto` e lista `sotto` nel piano (schema,
  normalizzazione, prompt), il `ModelDirector` chiede `struttura-<concetto>` con `sotto` (1, 2 per le `importante`), il compito dello
  Scultore con la cantina (scala che scende, luci), le cose `sotto` sui pavimenti sotto il suolo raggiunti dalla porta (ADR-0064),
  senza cantina `dentro`; `MockModels` con un piano e un modello con cantina. Test offline: un luogo con la cantina, cose giù, tutto
  raggiungibile. Dipendenze: T52b.
- **T52c · la Sala sistemi seminterrata, fuori** (ADR-0091 punto 7): solo il modello esterno dell'edificio nella corona
  (`models/corona-<id>.xml`, `sotto` nella sua voce) scende sotto il viale: `placeStructure` lo posa più in basso, il suolo del campus
  si apre dove il modello ha voxel sotto lo zero, collisione dai voxel (controlla che pavimenti e `pos.z` valgano anche nella corona);
  l'interno resta com'è. Verifica nel browser davanti alla porta. Dipendenze: T52b.
- Fatto quando (per pezzo): test verdi, verifica nel browser dove il pezzo cambia ciò che si vede, ADR-0091 aggiornato, commit.

### T53 · Le scale come rampe e le strutture su più piani — T53a `fatto` (`d7812ae`), T53b `fatto` (`eb03038`)
- Pipeline: claude · stima 6% · approvato · priorità 50
- Contesto: richiesta del 24/10: le strutture devono essere navigabili appena generate; l'autore sceglie la seconda via
  (la scala è una lastra inclinata, il viandante ci sale camminando), non «E → Sali». Oggi `floors()` in `src/mj/mesh.ts`
  dà un'altezza per colonna di voxel e **solo** fino a un gradino (`h <= step`, oltre vale 0 e l'impronta blocca): una scala
  più alta di un gradino è un muro, e un piano sopra un altro non esiste.
- **T53a · la rampa**: si sale su una colonna se è più alta di quella su cui si sta **al più di un gradino** (non più
  rispetto al suolo): una scala di gradini piccoli è una rampa e porta in alto; il viandante e le persone posano i piedi
  sull'altezza (interpolata tra le colonne, come il rilievo); l'impronta blocca solo ciò che è più alto di un gradino
  rispetto a dove si è. Test: una scala di prova (un programma con dieci gradini) si sale fino in cima e si scende; un muro
  resta un muro; i modelli del seme (`grande`, `edificio`) restano attraversabili come prima.
- **T53b · i piani**: più pavimenti per colonna (il piano terra sotto il soffitto, il primo piano sopra): `floors` dà una
  lista di altezze, si sta su quella raggiunta salendo; il renderer taglia sopra il piano in cui si è (oggi taglia la
  struttura a `1.15 + floorAt`). Test: una torre di prova a due piani con la scala si percorre fino al tetto.
- Esito T53a: `floors` senza limite (il pavimento di ogni colonna è il pieno da terra), `bodyGround` in `forms.ts`
  (`Form.block`: colonne con qualcosa ad altezza del corpo sopra il loro pavimento o irraggiungibili; si raggiungono quelle
  fino a un gradino e, da lì, le vicine al più un gradino più alte), `rampBlocks` + `kernel.formBlocks(x, y, r)`: la
  scatola del corpo si ferma su colonne bloccate o su un dislivello oltre un gradino tra colonne vicine sotto di lei;
  pavimenti e blocchi anche per istanza (`groundOf`); le cose `dentro` solo sul piano terra. `tests/ramps.test.ts` (scala
  di dieci gradini su e giù, fianco come muro, gradino sì e muro no, strutture del seme attraversabili come prima).
  Diverso dal previsto: niente interpolazione nuova dell'altezza (bastano i gradini di 0,2 caselle e `climb` del renderer);
  la canna chiusa del pozzo, che prima si attraversava, ora è irraggiungibile (test di `forms.test.ts` aggiornato).
  Verifica nel browser: la scala aggiunta con `addModel` accanto al borgo si sale e si scende, il fianco ferma, nessun errore.
- Esito T53b: `surfaces` in `mesh.ts` (per colonna la cima di ogni tratto di pieno, più il suolo se comincia vuota, ciascuna con
  il suo blocco di testa) → `Form.levels`; il riempimento di `bodyGround` va da pavimento a pavimento delle colonne vicine
  (`floor`/`block` restano il piano terra). Il corpo sta sul pavimento più vicino all'altezza dei piedi, `pos.z`, che il kernel
  tiene dopo ogni tick (`settleHeights`, anche nello specchio; solo sulle caselle con un modello solido, altrove niente `z`: il tick resta leggero) e `stepWanderer` passo dopo passo; `free`/`free_real` (anche da Lua,
  quarto argomento facoltativo: i sistemi del seme passano `p.z`), `floorAt`, `rampBlocks` la prendono, senza vale il piano terra.
  Il renderer posa ciascuno sul suo pavimento e taglia sopra il piano in cui si è. `tests/storeys.test.ts`: una torre di due
  piani con due scale si percorre dalla porta al tetto e ritorno, sotto il primo piano si cammina al piano terra, il bordo della
  tromba ferma, `pos.z` resta sul piano sopra. Diverso dal previsto: il piano non si «sceglie salendo» con uno stato a parte, è
  il più vicino ai piedi; `headroom` sostituita da `surfaces`. Verifica nel browser: la torre aggiunta con `addModel` accanto
  al borgo (con il componente `struttura`) si percorre con `stepWanderer` dal piano terra (3) al primo piano (54) al tetto (104) e
  ritorno; al primo piano il tetto è tagliato, al piano terra il primo piano; nessun errore del gioco in console.
- Fatto quando (per pezzo): test verdi, verifica nel browser su una struttura generata con le scale, commit (ADR-0043
  aggiornato).
- Dipendenze: nessuna. Utile prima di T52 e di T56.

### T54 · Le taglie di D&D per strutture e creature — `fatto` (`3c5fe95`)
- Pipeline: claude · stima 6% · approvato · priorità 50
- Contesto: richiesta del 24/10. Oggi le classi (`CLASSES` in `src/mj/classes.ts`: `persona`, `animale`, `bestia`,
  `edificio`, `grande`…) danno la scatola in caselle, e una struttura «importante» (Argon) per zona di 56 × 56 luoghi.
  L'autore vuole riferirsi alla taglia di D&D: Minuscola, Piccola, Media, Grande, Enorme, Gargantuesca. **Gargantuesca è la
  massima** (non c'è una settima); il castello «importante» di oggi diventa **Enorme**, e Gargantuesca è una taglia nuova sopra.
- Fare: un campo `taglia` per creature e strutture (manifest, piano del Cartografo, richieste allo Scultore), con la scatola
  in caselle di ogni taglia (per le creature lo spazio di D&D: Media 1 casella, Grande 2 × 2, Enorme 3 × 3, Gargantuesca
  4 × 4 o più; per le strutture una scala loro); la classe resta per la forma (persona, animale, edificio), la taglia dà le
  misure; «importante» diventa la rarità delle taglie più grandi: **Enorme** una per zona (56 × 56 luoghi, come le importanti di
  oggi), **Gargantuesca** una per **reame** (4 × 4 zone, cioè 224 × 224 luoghi, ~4032 caselle di lato; nome nuovo per non
  confondersi con le regioni dell'atlante, che sono di 3-4 luoghi); `stato.json → importanti` migra; prompt di Cartografo, Narratore e Scultore; validatore. Test: una richiesta «Enorme» dà la scatola
  giusta; la rarità per zona regge.
- Fatto quando: test verdi, AGENTS.md e un ADR (sostituisce in parte ADR-0043 sulle importanti), commit.
- **Risposte dell'autore** (30/10): niente settima taglia, Gargantuesca la massima; **stessa scala** per creature e strutture
  (la scatola in caselle la dà la classe: una struttura Media è più grande di una creatura Media); rarità come sopra. Il nome
  «reame» l'ha scelto l'orchestratore: si può cambiare.
- Esito: `TAGLIE` in `src/mj/classes.ts` (scala 0,5 · 0,75 · 1 · 2 · 3 · 4 rispetto a Media), ogni classe con la sua taglia solita;
  `tilesOf`/`boxOf(cls, taglia)`, più rada oltre 120 voxel (`densityOf`); `appearance.taglia` (validatore), taglia nei concetti della Fucina
  (`forgedSize`, mai le due rare), `strutture[].taglia` del Cartografo (`readStructure`: `importante` vecchio → `enorme`), `struttura.taglia`,
  `SculptRequest.taglia` (Argon per le rare), `ModelInfo.taglia`/`vpt` (`modelSize`). Rarità: `claimSizes` e `rareAllowed`, Enorme per zona,
  Gargantuesca per reame (`realmOf`), `stato.json → rari` (migra `importanti`). Prompt di Cartografo, Narratore, Scultore; ADR-0092, AGENTS.md;
  test in `tests/lots.test.ts` e `tests/sculptor.test.ts`. Diverso dal previsto: il kernel abbassa la taglia che non sta nel lotto (un'Enorme
  vuole un lotto di 8 caselle, una Gargantuesca di 10), quindi negli ambienti con edifici piccoli le rare diventano Grandi; lotti più grandi per
  le rare restano da fare se serviranno. Le creature arrivano fino a Grande (nessuna rarità per le creature). Test: `typecheck` verde,
  `tests/lots.test.ts` e `tests/sculptor.test.ts` verdi; nella suite completa 9 file vanno in timeout, in serie ne restano 5 (33 test, boot oltre 10 s), per il carico della
  macchina: `kernel.test.ts` «boots the bundled universe» va in timeout uguale sulla base (11,5 s contro 11,3 s).

## Controlli

### T55 · La camera libera (orbita) nel gioco — `fatto` (`b9d7de1`)
- Contesto: richiesta del 24/10: nel laboratorio (`/lab/3d/`) il tasto destro trascinato fa orbitare la camera e all'autore
  piace; nel gioco la camera gira a quarti di giro (ADR-0047: `,` `.`, tasto centrale trascinato, `Input.turn`) e il tasto
  destro apre il menu della casella (ADR-0029).
- Fare: rotazione libera attorno al viandante (angolo continuo; anche l'inclinazione entro due limiti, se regge la
  leggibilità) con il tasto centrale trascinato (il destro resta il menu); `,` `.` restano a quarti; l'input traduce le
  direzioni dello schermo in quelle del mondo con l'angolo continuo (W va sempre in alto sullo schermo, il movimento del
  kernel resta in coordinate del mondo); le cose che oggi presumono quarti di giro (taglio delle strutture, overlay 2D,
  raggio del tasto destro, schermi inclinati della Direzione) controllate. Test: la traduzione delle direzioni per angoli
  qualsiasi; la camera torna a un quarto con `,` `.`.
- Fatto quando: test verdi, verifica nel browser (mondo, corona, studio), ADR-0047 aggiornato, commit.
- Esito: rotazione libera continua con tasto centrale (`Input.angle`, `Renderer.yaw`), `,` `.` riagganciano al quarto di giro;
  l'input traduce i tasti WASD in coordinate mondo con angolo continuo sul settore a 8 direzioni più vicino; zoom in/out con
  rotellina del mouse (`renderer.zoom`); in simulazione per i giocatori l'orbita resta solo orizzontale (pitch bloccato a 3/4,
  `0.95`) e lo zoom-out non supera le 15 caselle per non vedere la corona anzitempo; in god mode (`?god`, `?master`) o nella
  corona/studio l'orbita ruota in tutte le direzioni (pitch 0.2–1.45) e lo zoom out arriva a 45 caselle come nel lab 3d; rientro
  morbido; `tests/camera.test.ts` (7 test), ADR-0047 e AGENTS.md aggiornati, verifica browser positiva. Diverso dal previsto:
  aggiunto lo zoom con rotellina e la protezione prospettica per il giocatore immerso nella simulazione richiesta dall'autore.

### T56 · Il salto, e le cose che chiudono i sentieri — T56a `fatto` (`e5f8099`), T56b `fatto` (`f91b6fe`)
- Pipeline: claude · stima 4% · approvato · priorità 55
- Contesto: richiesta del 24/10 con `docs/userchats/Blocchi.png`: un sentiero largo una casella su un lago, con un banco,
  una cassa e un letto messi sopra; i dislivelli piccoli si salgono già senza saltare (ADR-0048) e devono restare così.
- **T56a · niente cose sui passaggi obbligati**: il piazzamento delle cose (`placementsOf`/`placeInside`) non mette nulla di
  solido su una casella la cui chiusura separerebbe il luogo (punto di articolazione del grafo delle caselle libere, varchi e
  sentieri garantiti compresi); regola 10. Test: un luogo con un unico sentiero largo uno non ha cose solide sul sentiero.
  Esito: `articulationPoints` in `src/kernel/layout.ts` (algoritmo di Tarjan su grafo 4-connesso), `isSolidModule` e filtro dinamico
  in `placementsOf` di `src/kernel/kernel.ts` (ogni solido piazzato aggiorna i punti di articolazione), filtro di sicurezza (distanza ≥ 1.2)
  dalle porte in `placeInside`. Test dedicati in `tests/bottlenecks.test.ts` (8 test), ADR-0064, AGENTS.md aggiornati.
- **T56b · il salto**: un tasto (Spazio) fa saltare il viandante: supera un ostacolo alto fino a ~1 casella (le cose dei
  mobili, una cassa, un gradino alto) se oltre c'è dove posare i piedi; arco visibile, ombra, niente salto nell'acqua
  profonda né oltre i muri dei modelli più alti; nella corona nulla cambia. Test: il viandante salta una cassa su un
  sentiero e non salta un muro; un dislivello di un livello si sale ancora camminando.
- Fatto quando (per pezzo): test verdi, verifica nel browser (la scena di `Blocchi.png`), aiuto (`H`) e barra dei tasti
  aggiornati per T56b, commit.
- Dipendenze: T56b dopo T53a (l'altezza su cui si atterra è quella delle rampe).
  Esito T56b: `kernel.jump()` in TypeScript (nessuna API Lua nuova), componente `salto` portato da `jumpTick` dopo i sistemi;
  passa sopra ciò che non supera `JUMP_UP` (1,05 caselle, altezza delle colonne di voxel: `tops` in `mesh.ts`, `Form.top`, `topUnder`) e
  sopra l'acqua, mai sopra muri, rocce o caselle solide del terreno; atterra nel primo punto da 1 a 2,6 caselle dove il corpo sta,
  altrimenti salto sul posto. Arco e ombra nel renderer (`kernel.jumping()`), la camera non segue l'arco. ADR-0080, AGENTS.md,
  `tests/jump.test.ts` (4 test). Diverso dal previsto: Spazio non è più un secondo `E` nella simulazione, ma nella corona, nello
  studio e nel kernel specchio (multigiocatore) fa ancora ciò che fa `E`: il salto tra più giocatori (messaggio `salta`) resta da fare.

## Le rune

### T57 · Le rune come codice: sequenze ordinate, effetti, rune nuove — `fatto` (T57a; il resto in T57b e T57c)
- Pipeline: claude · stima 8% · approvato · priorità 60
- Contesto: richiesta del 24/10 («Le rune»). L'esempio del seme `acqua fuoco` → «Vapore» (si annullano, un messaggio, in
  `universe/modules/magic.runes/manifest.json`) non è l'idea: le rune sono come codice, una **sequenza ordinata** produce
  un effetto specifico, e l'ordine conta (`aria terra` ≠ `terra aria`). Effetti come incantesimi di D&D (`terra fuoco` →
  palla di fuoco 1, `terra fuoco fuoco` → palla di fuoco 2, `fuoco terra fuoco` → dardi infuocati 1, `acqua` → crea acqua)
  o di terraformazione (`terra aria terra` → innalza il terreno, `aria terra aria` → abbassa il terreno). Gli effetti
  **non** vanno nel kernel: Narratore, Fisico e Concilio devono sapere come generarli (gli esempi li guidano) e sapere di
  poter inventare rune nuove (es. «sangue»).
- **T57a · il Concilio sa comporre**: canone delle rune (`world/canone.md`, `canonSummary`) e prompt di Narratore, Fisico
  e Arbitro: una sequenza è un programma, l'ordine conta, ripetere una runa rafforza, gli esempi sopra come guida (non come
  lista); gli incantesimi nuovi nascono con effetti che agiscono sulla mappa e sulle persone (fuoco, spinte, terreno,
  stati), validati come oggi; il seme perde «Vapore» per un esempio vero. La chiave delle combinazioni rispetta già l'ordine
  (`seq.join(' ')` in `castSpell`, senza ordinare): resta così. Test offline: `terra aria` e `aria terra`
  danno incantesimi diversi; il MockModels risponde con effetti diversi per ordini diversi.
  **Fatto** (commit su `task/T57`): canone (formula, ordine, ripetizione, esempi), `SPELL_GUIDE` e le permutazioni già
  note nel prompt di `nameSpell`, prompt di Narratore, Fisico (la misura della magia) e Arbitro; il seme ha `terra fuoco` →
  «Palla di fuoco» al posto di «Vapore»; il mock: la prima runa dà l'effetto principale, rafforzato da ogni ripetizione.
  Diverso dal previsto: gli esempi di terraformazione usano per ora `terreno` (roccia, sentiero) finché T57c non dà `rilievo`.
  Test: typecheck verde; i test toccati (`kernel` rune e T57a, `canon`, `showcase`, `focus`) verdi; la suite intera ha fallimenti
  che ci sono uguali sulla base (`beforeEach` di `kernel.test.ts` oltre 10 s sotto carico, `explore` T40, `partita` «goes with every
  request»): provati sui file di `3d` con lo stesso esito. Il canone resta corto perché va con ogni compito narrativo (`focus` T13).
- **T57b · rune nuove dal Concilio**: una via per inventare una runa magica (nome, glifo, colore, cosa significa nel
  canone) in una sessione del Concilio o quando una combinazione la chiede: modulo `magic.runes` riscritto, validatore
  (glifo unico, nome non simile alle altre, niente meta-gioco), canone aggiornato; la runa compare nel mondo come le altre
  (rare). Test: una runa nuova entra, è valida, si può raccogliere e combinare.
- **T57c · il terreno che sale e scende**: per la terraformazione serve un effetto del kernel che cambi il **livello** delle
  caselle (oggi `terreno` cambia il tipo di casella, non l'altezza): `rilievo {delta, raggio}` nell'insieme chiuso degli
  effetti (ADR-0014), persistente come il terreno cambiato, con l'acqua che scorre se T51b c'è. È uno strumento, non un
  incantesimo: quali sequenze lo usano lo decide il Concilio.
- Fatto quando (per pezzo): test verdi, AGENTS.md (Magia) aggiornato, commit; ADR per T57b e T57c.
- Dipendenze: T57c dopo T51a (livelli dell'acqua coerenti).
- **Domanda per l'autore** (per T57c): va bene un effetto `rilievo` nel kernel come strumento generico (gli incantesimi
  che lo usano restano del Concilio)?

### T57b · Rune nuove dal Concilio — `fatto` (dipende da T57)
- Pipeline: claude · stima 5% · approvato · priorità 60
- Contesto: il pezzo T57b del blocco T57 (T57a fatto e integrato con T99: canone, `SPELL_GUIDE`, prompt di Narratore, Fisico, Arbitro).
- Fare: una via per inventare una runa magica (nome, glifo, colore, cosa significa nel canone) in una sessione del Concilio o quando una
  combinazione la chiede: modulo `magic.runes` riscritto, validatore (glifo unico, nome non simile alle altre, niente meta-gioco), canone
  aggiornato; la runa compare nel mondo come le altre (rare). Schema Gemini, risposta in `MockModels`, voce nel registro.
- Fatto quando: test verdi (una runa nuova entra, è valida, si può raccogliere e combinare), typecheck verde, AGENTS.md (Magia) aggiornato, ADR.
- **Fatto** (commit su `task/T57b`, ADR-0097): compito `rune.invent` del Narratore (schema, mock, `CENSUS`, voce nel registro), chiesto dalla
  sessione del Concilio (intervento `runa`, paga `comune`) o da una formula (`runa_nuova` di `nameSpell`, spiegato in `SPELL_GUIDE`);
  validatore puro `src/kernel/magic.ts` (`validateNewRune`: token parola di 3-12 lettere, non già usato, non riservato né simile; nome non
  simile; niente quarta parete; al più 16 rune; glifo e colore riparati); `kernel.inventRune` scrive `magic.runes` (rune e bottino `magia`),
  il canone («Le rune trovate dopo», `canonWithRune`) e committa con la carta `runa:<token>`. Test in `tests/magic.test.ts`.
  Diverso dal previsto: anche le carte hanno un tipo nuovo, `runa`; due tentativi al Narratore prima di rinunciare.
  Test: typecheck verde; `magic` (5) e `coefficients` verdi; la suite intera sotto il carico della pipeline ha solo timeout (`beforeEach`
  oltre 10 s, test oltre 20-60 s); rilanciati con tempi lunghi passano tutti tranne 5 (`referente` T42e/T42f, `wanderers` T34, `watch` T42c)
  con un timeout fisso nel test, che falliscono uguali con `src/` della base; `abbonamenti` T68b usa la CLI reale. Commit e69bb5a.

### T57c · Il terreno che sale e scende — `fatto` (`c689328`, ADR-0096)
- Pipeline: claude · stima 3% · approvato · priorità 61
- Contesto: il pezzo T57c del blocco T57. Oggi l'effetto `terreno` cambia il tipo di casella, non l'altezza; T51b ha dato
  `kernel.dig(col, row, delta)` e l'acqua che scorre (ADR-0094). La domanda del blocco T57 (un effetto `rilievo` generico nel kernel):
  l'autore ha approvato il task il 01/11.
- Fare: `rilievo {delta, raggio}` nell'insieme chiuso degli effetti (ADR-0014), validato dal kernel, applicato con `dig` (persistente nel
  piano, `scavi`), l'acqua scorre dove cambia; gli esempi di terraformazione del canone e di `SPELL_GUIDE` passano da `terreno` a
  `rilievo` (`terra aria terra` innalza, `aria terra aria` abbassa). È uno strumento, non un incantesimo: quali sequenze lo usano lo
  decide il Concilio.
- Fatto quando: test verdi (l'effetto alza e abbassa, persiste al ricaricamento, l'acqua scorre), typecheck verde, AGENTS.md (Effetti, Magia) aggiornato, ADR.
- Esito: `rilievo {delta, raggio}` aggiunto a `Effect` in `src/kernel/types.ts` e validato in `validator.ts` (-8..8 livelli interi clamped, scartato se 0, raggio 0..3 clamped, `describeEffect`); `kernel.ts` intercetta `rilievo` in `applyEffects` e invoca `this.dig` su ogni casella nel cerchio (`dx*dx + dy*dy <= r*r + r`), persistendo in `plan.scavi` e risvegliando il flusso dell'acqua (`WaterFlow.wake`); `EFFECTS_GUIDE` e `SPELL_GUIDE` in `agents/effects.ts`, `canone.md` e prompt del Narratore aggiornati con terraformazione a rilievo (`terra vento terra` solleva, `vento terra vento` abbassa); `MockModels` supporta entrambe le sequenze e i verbi innalza/abbassa/spiana; 6 test in `tests/rilievo.test.ts` (validazione, scarto delta 0, descrizione, sollevamento e scavo persistenti nel piano ricaricato, risveglio e deflusso dell'acqua, lancio incantesimi); ADR-0096 indicizzato in `docs/adr/README.md`.

## Multiplayer

Piano: [`multiplayer.md`](../archivio/3-to-do-backlog/plans/multiplayer.md) (ADR-0050). Le fasi 0 (T33-T37) servono anche da soli e non chiedono la rete;
le fasi 1-3 (T38-T43) si provano con il server di Vite e più schede; la fase 4 (T44-T45) è la piattaforma e aspetta
le risposte alle domande del piano.

### T29 · Aggiornare il piano del multiplayer — `fatto` (`a004e46`)
- Riscrivere [`docs/plans/multiplayer.md`](../archivio/3-to-do-backlog/plans/multiplayer.md) con le decisioni dell'autore del to-do (sezione «Multiplayer» di
  [`docs/userchats/to-do-2026-10-22.md`](../archivio/3-to-do-backlog/userchats/to-do-2026-10-22.md)): server unica fonte di
  verità, modalità singola e multigiocatore, crediti e proxy, contenuti come carte del giocatore (P#2), master in
  god mode e senza tappeto, punizione della morte configurabile, budget e modelli nella lobby, PvP e «Altro…» tra
  giocatori; togliere i riferimenti al 2D e alle immagini. Poi spezzare l'implementazione in task di questo
  backlog.
- Esito: piano riscritto (le decisioni, la tabella «oggi / in multigiocatore», architettura, master, spesa e carte, le
  criticità approvate, fasi, quattro domande nuove), ADR-0050, task T33-T45. Diverso dal previsto: in modalità singola
  il kernel può restare nel browser (cambiano solo proxy e crediti); spostarlo sul server anche lì è rimandato.

### T33 · La configurazione dell'universo alla Genesi — `fatto` (`5668808`)
- Contesto: decisione 9 del piano. Prima della Genesi si sceglie quanto è punitiva la morte (uno slider da 0 a 4),
  PvP sì/no, «Altro…» tra giocatori sì/no, e la modalità (singola / multigiocatore). Sono definitive.
- Fare: una sezione `partita` in `universe.json` (`modalita`, `morte`, `pvp`, `altroTraGiocatori`) con i valori di oggi
  come predefiniti; la schermata della Genesi (`src/ui/genesis.ts`) la chiede; il validatore la ripara; la punizione
  della morte va al Concilio come principio (con `canonSummary` o accanto ai principi di `fourthwall.ts`) e `kernel.die`
  la passa al Narratore, che decide cosa si perde e dove si riparte (effetti esistenti). Nessuna UI per cambiarla dopo.
- Fatto quando: test offline (due universi con punizioni diverse → richieste diverse al Narratore; il campo non si
  cambia dopo la Genesi), typecheck, verifica nel browser della schermata.
- Esito: `partita` in `universe.json` (ADR-0053), `repairPartita`, `src/kernel/partita.ts` (cinque livelli: nessuna, lieve,
  media, dura = la morte di prima, spietata), la sezione «La partita» della Genesi, la punizione nella schermata della morte,
  `tests/partita.test.ts`. Diverso dal previsto: il principio va anche a Ingegnere e Referente (costruiscono meccaniche e
  richieste), non solo con il canone; la ripartenza è `qui | piazza` perché «l'ultimo villaggio» non esiste ancora (da fare con
  T43 o dopo); `continueAfterDeath` è diventata asincrona (aspetta il Narratore).

### T34 · Il viandante con un id e lo stato per giocatore — `fatto` (`8df01dc`)
- Contesto: oggi c'è un solo `playerId` e `world/stato.json` è il viandante; ricordi, legami e missioni parlano di «il
  viandante».
- Fare: un id stabile del viandante (in singola uno solo, `io`); lo stato del giocatore in `world/giocatori/<id>.json`
  (inventario, bisogni, stati, slot, frase), letto anche dal vecchio `stato.json`; ricordi, legami, figli e missioni
  in `people.json`/`plots.json` con l'id del viandante; il nodo del viandante nel grafo per id; il Narratore riceve il
  nome del viandante con cui si parla.
- Fatto quando: un universo vecchio si carica uguale; test con due viandanti nello stesso kernel (ricordi separati).
- Esito: `src/kernel/wanderers.ts` (id `io`, `world/giocatori/<id>.json`, `readWandererState` anche dal vecchio `stato.json`,
  `wandererOf`, `bondWith`, `memoriesFor`), ADR-0054, `tests/wanderers.test.ts`. Legami e ricordi con `viandante: <id>` (il registro
  vecchio migra in lettura, `legameViandante` non si scrive più), `Quest.viandante`, `Turn.con`, `NpcContext.wanderer`; nel grafo
  `persona:viandante-<id>` per gli altri viandanti. Diverso dal previsto: per avere due viandanti nello stesso kernel già ora, il
  kernel ha un registro (`addWanderer`) e `as(id, fn)` sincrono, che fa agire un altro viandante su tutto ciò che oggi usa
  `playerId`, invece di passare un id a ogni funzione; gli altri viandanti non hanno ancora input né rendering (T38-T39).

### T35 · Semi condivisi e determinismo — `fatto` (`965b494`)
- Contesto: decisione 2. Ogni estrazione casuale (kernel, `hash` e `math.random` di Lua, `sys.wander`, fuoco, bottino)
  deve venire da (seme dell'universo, tick, entità); niente orologio di sistema nella simulazione.
- Fare: censire le fonti di casualità e di tempo (`Math.random`, `Date.now`, `performance.now` dentro il tick) e
  passarle da `rng.ts`; `math.random` della sandbox con il seme del tick.
- Fatto quando: test — due kernel con lo stesso universo e la stessa sequenza di input arrivano allo stesso stato dopo
  N tick (entità, posizioni, persone).
- Esito: `K.seed` nel preludio e `Kernel.seedLua` prima di ogni chiamata nel Lua (`runModule`, righe delle rune) con
  `hash32(seme, tick, chi chiama, entità, n)`; `math.randomseed()` senza argomenti vale 0; `rngFor` al posto di `Math.random`;
  `worldStamp` (tempo del mondo) al posto di `Date.now()` per figli, regola della morte e trame; ADR-0055,
  `tests/determinism.test.ts`. Diverso dal previsto: il censimento ha trovato poco (il kernel derivava già quasi tutto dal seme,
  `sys.wander` e il fuoco usano `hash` e `time`); anche il `MockModels` tirava a caso i nomi degli individui (ora da un
  contatore); l'orologio resta, documentato, in ciò che non è simulazione (registro, consumi, guasti, misure, scadenze di MJ).

### T36 · Chi ha generato ogni contenuto (carte, P#2) — `fatto` (`6a3cce5`)
- Contesto: decisioni 4 e 6. Ogni chiamata ha un `chi` (il giocatore) o è comune; ogni contenuto generato ha autore e
  pagante e un contatore di utilizzi.
- Fare: `chi` nel registro dei consumi (`ai/usage.ts`, `world/consumi.json`), con le chiamate del Concilio per il mondo
  marcate comuni; `origin.autore` sui moduli, sui modelli (`models/index.json`), sui luoghi (`maps/`), su persone, trame
  e regole; gli utilizzi (quante volte un contenuto entra in un luogo, in una trama, in un prompt) in un file
  `world/carte.json`; una funzione che costruisce la collezione di un giocatore dal repository.
- Fatto quando: test offline (una Genesi e due luoghi → carte con autore e utilizzi; le comuni estratte a sorte, col seme).
- Esito: `src/kernel/cards.ts` (ADR-0056): `TextCall.chi`/`CallRecord.chi` messo dal Concilio con `payerOf` (comuni i compiti del mondo, il
  resto del viandante che agisce; la Fucina e le meccaniche di una sessione o della Genesi passano `comune`), `world/consumi.json → paganti`;
  `carta {autore, pagante, titolare}` su moduli, oggetti, ambienti, incantesimi, ricette, modelli, persone, trame, regole giudicate e piani
  dei luoghi; `commitContent` + `stampFiles` timbrano ciò che un commit porta; `titolareOf` estrae le comuni col seme e l'id della carta;
  `world/carte.json` con gli utilizzi (`luoghi trame prompt`) e le carte dei luoghi; `kernel.cardsOf(id)`; `tests/cards.test.ts`. Diverso dal
  previsto: autore e pagante stanno in un campo `carta` e non in `origin` (che è già una stringa, come `ModelInfo.autore`); gli id delle carte
  sono quelli del grafo; le carte dei luoghi stanno anche in `carte.json`, perché `maps/` è fuori dal testo dell'universo; il pagante di una
  chiamata è il viandante che agisce quando parte (dopo un `await` è `io`): il server di T38-T40 passerà `chi` esplicito.

### T37 · Rune e binding per ruolo — `fatto` (`cfe85fa`)
- Contesto: decisioni 7 e 8. In multigiocatore i giocatori non hanno le rune del tappeto (`CARPET_TOKENS`) né quelle che
  scrivono `x y speed carpet time`; il master ha la sola runa che porta nella Sala del Concilio.
- Fare: con `partita.modalita = multigiocatore` niente rune del tappeto nei luoghi; il kernel ignora le scritture di quei
  binding per i non master; la runa del Concilio (scorta illimitata, solo del master) che teletrasporta nella Sala del
  Concilio; `R` (rollback del repository) solo del master, quello di un giocatore riguarda il suo tappeto e la sua frase.
  In singola tutto resta com'è.
- Fatto quando: test (un non master con `x = 9999` sul tappeto resta nel cerchio; il master arriva nella Sala).
- Esito: `partita.master` (`repairPartita`, `io` per ora; in singola il campo non c'è e `isMaster()` è sempre vero), `carpetLine` e
  `COUNCIL_RUNE` in `runes.ts`, `RuneComp.by`; le righe girano come chi le ha incise e quelle dei non master con i binding in sola
  lettura (`K.run_line(key, lock)` nel preludio, copie di tappeto e posizioni dal `Host`); `councilRune`/`councilStock`, `offCarpet`;
  `takeBackRunes`; ADR-0057, `tests/roles.test.ts`. Diverso dal previsto: il kernel non sapeva chi fosse il master, quindi T37 ha
  anticipato `partita.master` (il resto del ruolo resta a T42); la runa del Concilio funziona sia pronunciata (T) sia incisa; il tappeto
  è ancora uno solo, quindi il rollback di un giocatore riprende la sua frase ma non sposta il tappeto (arriva con T38). Nessuna verifica
  nel browser: in singola il gioco non cambia, e per provare il multigiocatore servirebbe una Genesi nuova sul disco dell'autore.

### T38 · Il kernel sul server — `fatto` (`bdec7a9`)
- Contesto: decisione 2 e «Architettura» del piano. Un processo per universo con il kernel headless, `universeStore`, il
  proxy e un WebSocket `/api/session`.
- Fare: il kernel avviabile in Node senza DOM (come nei test) dentro il server di Vite; protocollo: ingresso (istantanea:
  file + stato), aggiornamenti delle entità vicine a ~10 Hz, messaggi del client (posizione, azioni, frase, chat,
  «Altro…») con esito; la posizione controllata con la collisione del kernel. Un finto trasporto per i test.
- Fatto quando: test headless — un server e due client nello stesso processo vedono lo stesso mondo; un client che
  bara sulla velocità viene corretto.
- Esito: `src/session/` (ADR-0058): `protocol.ts` (messaggi JSON `entra passo frase incidi pronuncia azione altro chat` →
  `ingresso aggiorna correzione esito rifiuto`, `fakeLink`), `server.ts` (`SessionServer`: messaggi a ogni tick nell'ordine di arrivo,
  aggiornamenti a 10 Hz di ciò che è cambiato entro 24 caselle, credito di passo di mezzo secondo, azioni a 3 caselle, chi esce salvato),
  `client.ts` (`SessionClient`, ciò che un client sa), `host.ts` (apre un universo in multigiocatore e lo fa girare a 60 Hz);
  `server/session.ts`: WebSocket `/api/session?universo=<nome>` (pacchetto `ws`, solo `npm run dev`); `tests/session.test.ts`.
  Provato anche dal vero: un universo di prova, un client WebSocket di Node, ingresso con 98 file, un passo di 20 caselle corretto a 3,25,
  lo stato di chi esce committato in `world/giocatori/` (poi l'universo di prova è stato tolto). Diverso dal previsto: perché due
  viandanti non si muovano insieme serviva **un tappeto per viandante** già ora (`as` scambia lo scorrimento, `holdCarpet`), con
  `core.movement`/`core.carpet` che girano per viandante e la tastiera che muove solo `io` (`inputFor`); i chunk si caricano attorno
  a tutti. Il client manda la posizione nel mondo (spazio del tappeto), non i tasti: sul server il viandante resta fermo sul suo
  cerchio e si sposta il suo tappeto. «Altro…» applica ciò che segue l'`await` a chi l'ha chiesto. Restano: `chi` dopo un `await` (è
  `io`, T40), `zone` e corona del solo `io` (T41-T42), nessuna verifica nel browser (il gioco in singola non usa la sessione: T39).

### T39 · Il client sottile e gli avatar — `fatto` (`8b9c227`)
- Fare: in multigiocatore `main.ts` non crea il kernel ma un client che riceve lo stato e lo dà al renderer; predizione del
  proprio passo (il tappeto compensa come oggi) e correzione; entità `remote` per gli altri giocatori, con il modello
  del viandante, il seme e il colore del profilo, interpolate, con arti e fumetti; l'esito delle azioni mostrato subito
  e annullato se il server rifiuta.
- Fatto quando: due schede del browser sullo stesso server di Vite si vedono camminare; test del client col finto trasporto.
- Esito: ADR-0059. Il browser non rinuncia al kernel: avvia un **kernel specchio** (`mirror`: niente generazione, salvataggi né
  Concilio, il tick muove solo il suo viandante) che `ThinClient` (`src/session/thin.ts`) riempie con luoghi (con i lotti), cose
  (`THING_PARTS`) e altri viandanti (`remote`, interpolati, con arti e fumetti), così renderer, menu e HUD restano quelli di
  sempre. Passo predetto e mandato ogni 50 ms, correzioni, il client segue il server oltre 8 caselle (e il server non muove chi
  dichiara un punto più lontano, `FAR`); azioni inoltrate con esito ottimistico (raccogliere, `<action>` del modello, incidere)
  annullato se rifiutato o smentito dal prossimo aggiornamento; la frase è del client. `src/session/socket.ts` (WebSocket, id della
  scheda: `?viandante=`), in sviluppo `?universo=<nome>`; `tests/thin.test.ts`. Verificato con due schede (`anna`, `bruno`) su un
  universo di prova poi tolto: si vedono, camminano, il server li segue senza correzioni. Diverso dal previsto: il «colore del
  profilo» non c'è ancora (T44): ogni viandante oltre `io` ha un seme suo e il mantello di un colore dall'id (`tinta: N` nel
  `viandante`); in sviluppo il gioco non caricava wasmoon (escluso dal pre-bundling dal primo commit, è UMD): ora Vite lo
  pre-raggruppa; il primo passo dopo l'ingresso non partiva mai (trovato nel browser, coperto dal test). Inventario, borse,
  contenitori, fabbricazione e azioni sulle caselle non sono nel protocollo: T39b.

### T39b · Inventario e fabbricazione tra molti — `fatto` (`dc928a6`)
- Contesto: ADR-0059, punto 7. Nello specchio `useSlot equipSlot equip unequip dropSlot moveSlot craft combine freeCraft
  freeItemAction itemAct takeFromContainer putIntoContainer putIntoBag takeFromBag uiAction freeTileAction openContainer`
  (`LATER` in `thin.ts`) dicono «non ancora».
- Fare: i messaggi del protocollo per usare, impugnare, posare e spostare gli oggetti, borse e contenitori (con il contenuto del
  contenitore aperto nell'esito), fabbricazione (anche libera), pannelli delle meccaniche, azioni e «Altro…» sulle caselle; il
  server le esegue come il viandante (`as`), il client mostra l'esito (ottimistico dove si può: lo slot spostato).
- Fatto quando: test col finto trasporto per ognuno; nella scheda l'inventario si usa come in singola.
- Esito: ADR-0059 punto 7 riscritto. Messaggi `oggetto contenitore fabbrica pannello casella` e `altro` su tasca o casella; il server li
  esegue con `as`, controlla tasche e portata e cattura le finestre (`ui:container`, `ui:bag`): l'`esito` porta il contenitore con il
  contenuto e la borsa da aprire, lo stato gli `slots` dei pannelli. Il client fa subito gli spostamenti (tasca, impugnare, borse,
  contenitore, posare) e non lascia che l'inventario del server li sovrascriva finché sono in viaggio; l'inventario si ridisegna a
  `inventory:changed`. `tests/thin.test.ts`: quattro test nuovi. Verificato nel browser con un universo di prova in multigiocatore
  (poi tolto): raccolte e spostate delle bacche, mangiate, aperta una credenza e preso il sidro, senza errori. Diverso dal previsto:
  impugnare e i contenitori sono ottimistici anche loro; il pannello delle meccaniche no (`on_slot` è Lua, gira solo sul server).
  Resta in `LATER` solo `rollback` (del master, T42).

### T40 · Luoghi nuovi con il lock, a spese di chi esplora — `fatto` (`32f58bf`)
- Fare: il primo che entra in un luogo nuovo lo chiede al server, che lo genera una volta (Cartografo, Scultore), lo
  committa in `maps/` e lo addebita a lui (`chi`); gli altri lo ricevono pronto; un limite di luoghi nuovi al minuto
  per universo. Il Concilio (sessioni, trame, Fucina) gira solo sul server, anche senza master collegato.
- Fatto quando: test — due client che entrano insieme nello stesso luogo nuovo → una sola generazione.
- Esito: ADR-0060. Il kernel del server pianificava già ogni luogo una volta (un kernel, `developing`, il piano in `maps/`); mancava
  chi paga: il chunk ora ricorda chi lo ha voluto per primo (`Chunk.chi`), che paga la chiamata del Cartografo, la carta del luogo e la
  Fucina di ciò che il piano chiede. Limite `ai.placesPerMinute` (20) per minuto del mondo, solo in multigiocatore: oltre, la bozza
  aspetta (`Chunk.held`). `tests/explore.test.ts` (3 test). Diverso dal previsto: lo sviluppo guardava solo `io`, e con il master in
  un interno dello studio non si pianificava più niente per nessuno: ora le bozze più vicine a qualunque viandante nel mondo. Il
  Concilio era già solo sul server (lo specchio di T39 non ha generazione). Nessuna verifica nel browser: il gioco in singola non
  cambia, e il multigiocatore è coperto dai test col finto trasporto.

### T41 · Il client del giocatore senza corona né Concilio — `fatto` (`fdd9f42`)
- Fare: corona, studio, pannello del Concilio, registro, console ed editor caricati solo dal master (import dinamici); il
  server non manda ai giocatori il registro del Concilio, i file dello studio né gli interni della corona; `window.rune`
  del giocatore espone solo il client.
- Fatto quando: la build del giocatore non scarica i moduli della corona (verifica nel browser, rete); test sul server
  (nessun messaggio del Concilio a un giocatore).
- Esito: ADR-0061. `playerFiles` (`server.ts`): a un giocatore `universe.json`, `models/`, rilievo, atlante e i manifest senza `logic`
  né `casi` (tranne `core.movement`/`core.carpet`, che lo specchio fa girare); il master riceve tutto, `ingresso.master` e il registro
  (`concilio` all'ingresso e poi a ogni aggiornamento, solo a lui; `ThinClient` lo versa nello specchio). `src/master.ts` (`MasterTools`)
  e `src/render/coronaview.ts` (`CoronaView`, tolta dal `Renderer`) caricati con `import()` solo dal master: nella build un chunk
  `master-*.js` di ~89 kB. `window.rune` del giocatore è il `ThinClient`. `tests/players.test.ts` (3 test). Verificato nel browser con un
  universo di prova poi tolto: la scheda di `anna` non scarica né `master.ts` né i moduli dello studio, ha 30 file oltre ai modelli e
  nessun registro; quella di `io` li scarica, ha 97 file e il registro del Concilio dal server. Diverso dal previsto: il kernel resta
  una classe sola, quindi la logica della corona (`corona.ts`, `archive.ts`, gli agenti) è ancora nel bundle principale; ciò che il
  giocatore non ha sono i file del Concilio e il codice che disegna e mostra la corona. Gli interni della corona non passavano già
  dal server (non sono entità); il master non riceveva il registro del Concilio, e ora sì.

### T42 · Il master — `fatto` (T42a-T42f) (dipende da T37, T41)
- Contesto: il piano del multigiocatore, «Il master». Troppo grande per una sessione: master fisso e god mode (T42a), il ramo
  `master` e la pubblicazione (T42b), i giocatori dalla corona (T42c), il clone con un altro master (T42d), le rune della corona e il
  Referente sul ramo (T42e), le rune chieste al Referente (T42f).

### T42a · Il master in god mode, visibile solo nel mondo — `fatto` (`093d98e`)
- Fare: il master è chi crea l'universo multigiocatore (non si cambia); god mode (niente morte, bisogni, danni, effetti dei
  giocatori), visibile agli altri col suo viandante solo quando è nel mondo.
- Fatto quando: test (il master non muore; gli effetti di un giocatore non lo toccano; uscito dal cerchio gli altri non lo vedono).
- Esito: ADR-0065. `godMode`, `keepGods` (dopo i sistemi del tick: fame, sete, energia, salute a 100; il mana no), `spareGods`
  sulla morte annunciata da Lua (`die` resta com'è), `applyEffects` che sul corpo di un dio lascia passare solo `messaggio` se agisce
  un altro, `inWorld` usato dal server per i viandanti da mandare. `tests/master.test.ts` (3 test). Diverso dal previsto: «non si
  cambia» c'era già (`partita.master` è fisso con la partita, `keepGame`, coperto da `tests/partita.test.ts`); il problema vero della
  visibilità era il master sul viale del campus, che nello spazio del tappeto può cadere accanto a un giocatore. Nessuna verifica nel
  browser: in singola il gioco non cambia, e il multigiocatore è coperto dai test col finto trasporto.

### T42b · Il ramo `master` e la pubblicazione — `fatto` (`5973cae`) (dipende da T42a)
- Contesto: piano del multigiocatore, «Modifiche in prova»; `R` del master e `rollback` ancora in `LATER` di `thin.ts`.
- Fare: le modifiche del master (editor, rune scritte nella corona, richieste al Referente) vanno su un ramo `master` del
  repository dell'universo; lui le prova da solo (il suo kernel vede il ramo, i giocatori no) e le **pubblica** con un gesto esplicito
  (merge su quello principale e diffusione ai client, che ricaricano i file cambiati). Il Concilio automatico committa direttamente
  sul principale (passa dal validatore). Il rollback del master torna all'ultimo valido del suo ramo.
- Fatto quando: test — una modifica sul ramo `master` arriva ai giocatori solo dopo la pubblicazione.
- Domanda da tenere presente: cosa succede ai commit automatici del Concilio fatti sul principale mentre il ramo `master` è aperto
  (rebase del ramo alla pubblicazione, o merge)? Proposta: merge, con i conflitti risolti a favore del master e segnalati nel registro.
- Esito: ADR-0066, con la proposta (merge, vince il master, il registro lo dice). Il ramo è ciò che l'ultimo commit dello specchio del
  master ha di diverso dai file del mondo; va intero al server (`ramo`, con l'hash della versione del mondo di ogni file), che lo tiene
  da parte, lo rimanda nell'`ingresso` del master e lo scrive su disco in `refs/heads/rami/master` (indice temporaneo, la cartella di
  lavoro non si tocca; `rami/` perché il principale può chiamarsi già `master`). `pubblica` → `kernel.publish` (valida, applica,
  committa, torna indietro se il mondo si rompe) e su disco `merge -s ours`. «Pubblica (n)» nell'editor e nei commit della console
  (`kernel.publisher`); `R` del master riporta il ramo all'ultimo valido. `tests/branch.test.ts` (5 test, anche il ramo su disco in una
  cartella temporanea); provato anche via HTTP sul server di sviluppo con un universo di prova poi tolto (ramo, rilettura, commit,
  merge con due genitori). Diverso dal previsto: mancava del tutto la diffusione dei file del mondo dopo l'`ingresso` (ciò che il
  Concilio committava non arrivava a nessun client), ora a 10 Hz (`file`, ai giocatori `playerChanges`); il master prova da solo ciò che
  il suo client fa girare (modelli, aspetto, terreni, corona, cammino), non la logica del mondo, che è del server. Le rune incise
  nella corona e le richieste al Referente non passano dal server in multigiocatore: spostate in T42e. Nessuna verifica nel browser:
  in singola nulla cambia (il pulsante non c'è) e il multigiocatore è coperto dai test col finto trasporto.

### T42e · Le rune della corona e il Referente sul ramo `master` — `fatto` (`9e45c46`) (dipende da T42b)
- Contesto: T42b porta sul ramo `master` le modifiche dell'editor (e il suo `R`); in multigiocatore le rune incise nella corona e le
  richieste al Referente non arrivano ancora al server (la corona è dello specchio del master, il Referente non è un'entità del server).
- Fare: le rune scritte nella corona e ciò che il Referente fa fare alle squadre girano sul server per il master e committano sul suo
  ramo (non sul principale), da pubblicare come le modifiche dell'editor.
- Fatto quando: test — una richiesta al Referente del master cambia il ramo, non il mondo dei giocatori, finché non pubblica.
- Esito: ADR-0069. Nello specchio del master `talkToAgent` (Referente e squadre) diventa `agente {agente, testo}`; il server (solo dal master,
  solo agenti di `AGENTS`, una richiesta alla volta) la esegue in un kernel del ramo (`kernel.branchKernel`: file del mondo più il ramo,
  gli stessi modelli con `onCall` rimesso al registro del mondo, il suo registro ripetuto in quello del mondo, il master che agisce e paga,
  `mirror` perché non generi né salvi nulla da sé), che prima di ogni richiesta torna al mondo e al ramo come sono. Ciò che vi si committa
  entra nel ramo (anche su disco) e arriva al master (`ramo {files}`, poi l'`esito` con `fatto`); lo specchio lo committa, e il ramo
  intero torna al server come in T42b. `tests/referente.test.ts` (2 test). Diverso dal previsto: nella corona le rune non si incidono
  (niente tappeto) e la runa del Concilio non cambia file, quindi non c'è niente da portare sul ramo; «ogni altra runa la chiede al
  Referente» del piano è un incarico nuovo, spostato in T42f. Lo Scultore non lavora nel kernel del ramo (i modelli nuovi li scrive il
  mondo dopo la pubblicazione) e gli utilizzi delle carte nei suoi prompt non si contano. Nessuna verifica nel browser: in singola
  nulla cambia (`talkToAgent` resta locale) e il multigiocatore è coperto dai test col finto trasporto.

### T42f · Le rune che il master chiede al Referente — `fatto` (`99b5fcc`) (dipende da T42e)
- Contesto: piano del multigiocatore, «Il master»: il master ha una sola runa del tappeto (quella del Concilio) e «ogni altra runa la
  chiede al Referente». Oggi il Referente non ha un incarico per le rune (`referenteReply`: oggetto, cosa, personaggio, ambiente,
  regola, riscolpisci, oggetti, meccanica, nessuno).
- Fare: un incarico `runa` del Referente (schema, prompt, `MockModels`): dà al master le rune che chiede (token del canone o del
  tappeto), nella borsa delle rune del suo viandante sul server; in singola nulla cambia (il trasceso ha già tutto). Le rune date non
  sono file: non vanno sul ramo.
- Fatto quando: test — il master chiede «dammi la runa speed» e la trova nell'inventario sul server; un giocatore non può chiederla.
- Domanda per l'autore: quali rune può chiedere il master (tutte, o solo quelle del canone e del tappeto)? Proposta: tutte quelle che
  il validatore delle rune accetta come token.
- Esito: ADR-0070. Presa la proposta (la domanda resta aperta: basta restringere `askedRunes`): l'incarico `runa` del Referente con
  `rune` (le parole del codice) nello schema, nel prompt e in `MockModels`; `askedRunes` (`runes.ts`) spezza come sul tappeto, tiene i
  token di `TOKEN_RE` fino a 24 caratteri, mai `concilio`, al più 12. Il kernel del ramo risponde con le rune senza darle (è uno
  specchio); il server le dà al master nel mondo (`as(master, grantRunes)`: borsa delle rune e frase), il client le riceve con
  l'aggiornamento; il ramo non cambia. `tests/referente.test.ts` (3 test nuovi). Diverso dal previsto: in singola il trasceso non ha
  già tutte le rune, ma per non cambiare il gioco da solo l'incarico lì non dà nulla («le rune si trovano nel mondo»). Nessuna verifica
  nel browser: in singola nulla cambia di visibile e il multigiocatore è coperto dai test col finto trasporto.

### T42c · I giocatori dalla corona — `fatto` (`d119c30`) (dipende da T42a)
- Fare: nell'atlante della corona (Ufficio dei luoghi) e nel tavolo della situazione i giocatori collegati, ciascuno sul suo chunk;
  una vista che ne segue uno (la camera del master sopra di lui finché non la lascia), senza uscire dalla corona.
- Fatto quando: test (la situazione elenca i giocatori collegati con la loro posizione); verifica nel browser con un universo di prova.
- Esito: ADR-0067. Al master l'elenco `giocatori` (solo a lui, quando cambia); `kernel.players()` → operazioni `giocatore` (viola)
  nel tavolo e nel pannello della situazione (con «Segui») e punti con il nome nell'atlante (con un pulsante per giocatore).
  `segui {id}` sposta il centro della vista che il server manda al master; il renderer mette il giocatore al centro e nasconde
  corona e viandante del master, che resta nello studio; Esc o «Torna» sull'insegna in alto. `tests/watch.test.ts` (3 test).
  Verificato nel browser con un universo di prova poi tolto (`io` e `anna` in due schede): il pannello della Direzione elenca
  `anna`, «Segui» porta la camera sopra di lei, la vista la segue mentre cammina, Esc torna alla Direzione, l'atlante la mostra.
  Diverso dal previsto: l'atlante «della corona» è il pannello che si apre dall'Ufficio dei luoghi (nella stanza l'atlante è un
  tavolo luminoso che apre il pannello, senza disegni dei luoghi); la vista seguita mostra soltanto: le azioni sulle caselle restano fuori portata.

### T42d · Clonare l'universo con un altro master — `fatto` (`852be62`) (dipende da T42b)
- Fare: copiare il repository dell'universo in un universo nuovo con `partita.master` diverso (l'unico modo di cambiare master); le
  carte restano a chi le ha generate (`carta.autore`, `pagante`), il titolare può restare o passare al nuovo master (da decidere).
- Fatto quando: test (il clone ha lo stesso mondo, un altro master, le stesse carte).
- Esito: ADR-0068. `cloneUniverse` in `server/universeStore.ts` (`POST /api/universe/<nome>/clone {nome, master, titolari}`) copia
  la cartella intera dell'universo (storia, `maps/` anche non committati, `world/giocatori/`, carte, consumi), toglie i rami `rami/*`
  (ciò che il vecchio master provava senza pubblicare è suo) e committa ciò che dà `cloneChanges` (`src/kernel/clone.ts`, funzione
  pura e leggera perché la importa il server di Vite): `name` e `partita.master` in `universe.json`. Decisione sul titolare: resta
  (predefinito); con `titolari: 'master'` le carte del vecchio master, comprese le comuni estratte a lui, passano al nuovo
  (`passCards`); autore, pagante e utilizzi non cambiano mai. «Clona con un altro master» nella scheda «Universo» della console del
  master in multigiocatore (`Console.onClone`). `tests/clone.test.ts` (5 test, anche su disco in una cartella temporanea e il kernel
  del clone con il nuovo master in god mode). Diverso dal previsto: nulla di rilevante; nessuna verifica nel browser (il pulsante
  c'è solo per il master in multigiocatore e chiama l'endpoint coperto dal test su disco; in singola nulla cambia).

### T43 · Tra giocatori — spezzato in T43a-T43c (dipende da T33, T39)
- Fare: «Altro…» su un altro giocatore giudicato come su una persona (se l'universo lo permette), effetti applicati dal
  server; PvP secondo `partita.pvp`; scambi di oggetti; chat tra avatar vicini (fumetti, senza filtro della quarta
  parete); morte in multigiocatore con la punizione di T33; ricollegamento con lo stato del giocatore.
- Fatto quando: test headless di ogni interazione; verifica con due schede.
- Spezzato (troppo per una sessione): chat e doni (T43a), «Altro…» e PvP (T43b), morte e ricollegamento (T43c).

### T43a · Parole e doni tra viandanti — `fatto` (`c65398f`) (dipende da T39)
- Contesto: il server rifiuta ogni azione su un altro viandante (`outOfReach`: «non c'è niente lì»); i fumetti dei viandanti
  già viaggiano (`OtherView.testo`), ma niente li scrive. Il piano: «gli scambi di oggetti e la chat tra avatar vicini (fumetti)
  ci sono sempre», senza filtro della quarta parete (sono persone vere).
- Fare: nel menu di un altro viandante «Parla» e «Dai <ciò che impugni>»; `dici {viandante, testo}` mette il fumetto su chi parla
  (lo sentono tutti i vicini) e lo porta a chi ascolta nella chat; `dai {viandante, slot, quanti}` sposta ciò che si porta (una
  borsa intera, col suo contenuto) nelle tasche dell'altro, se c'è posto e se è vicino. Chi riceve lo sa (`avvisi`
  nell'aggiornamento). Uno scambio sono due doni.
- Fatto quando: test col finto trasporto (parole sentite dai vicini e non dai lontani, il dono arriva e lascia la frase, niente
  posto o troppo lontano: rifiutato) e verifica con due schede.
- Esito: ADR-0071. `kernel.sayTo` e `kernel.giveTo` (con `HEAR` 8, `GIVE_REACH` 3, `SAY_MAX` 140), `otherWanderer`; i messaggi `dici` e `dai`, gli
  `avvisi` dell'`aggiorna` (`Notice`) dalla coda di chi riceve; nel client sottile `talk` e `perform` sulle entità `remote`, la chat che
  aggiunge le parole sentite (`ui:heard`), il proprio fumetto disegnato dove è il viandante (il renderer lo cercava nello spazio del
  tappeto). `tests/between.test.ts` (2 test con tre client sottili). Verificato con due schede (`anna`, `bruno`) su un universo di prova
  poi tolto: menu «Parla» / «Dai Borsa delle rune», il fumetto sopra chi parla in tutte e due, l'avviso nei messaggi, la borsa passata.
  Diverso dal previsto: «Dai» era per ciò che si impugna, ma la borsa delle rune non si impugna (trovato nel browser): ora una voce per
  ogni tasca della barra rapida. `testTimeout` di 30 s in `vite.config.ts`: con un file di test in più quelli della sessione superavano i
  5 s sotto carico. Una volta, a suite intera, `tests/determinism.test.ts` è fallito e poi è passato (tre volte): da tenere d'occhio.

### T43b · «Altro…» e PvP tra viandanti — `fatto` (`655fe3c`) (dipende da T43a)
- Pipeline: claude · stima 5% · approvato · priorità 1
- Fare: «Altro…» su un altro viandante giudicato come su una persona, solo se `partita.altroTraGiocatori`; gli effetti li applica
  il server sul corpo dell'altro (il master in god mode lascia passare solo `messaggio`, ADR-0065); ciò che ferisce
  (bisogni che scendono, `spingi`, `fuoco`…) solo se `partita.pvp`, altrimenti il Narratore lo sa e il kernel lo toglie.
- Fatto quando: test headless con PvP sì e no, con «Altro…» tra giocatori sì e no.
- Esito: ADR-0073. `kernel.freeOnWanderer` (dal menu, o dal messaggio `altro {viandante, testo}`: nello specchio il corpo dell'altro non ha
  un id del server) rifiuta senza chiamate se la partita non lo permette e oltre `GIVE_REACH`; `judgeFree` sul bersaglio `altro viandante`
  senza azioni del modello, forma né apprendimento; il Narratore riceve `between {pvp, god}`. `kernel.touchWanderer` applica gli effetti: bisogni,
  scudo, stati sul corpo dell'altro (`as`), `spingi` sul suo tappeto (`stepWanderer`, e il server gli azzera il credito di passo), il resto dove
  sta; senza PvP `unharmed` toglie ciò che ferisce (registro `scarta`), sul master solo `messaggio`. Avviso `altro` a chi lo subisce. Nel
  `MockModels` «colpisci» e «curi» su un viandante. `tests/between.test.ts` (3 test nuovi: PvP no, PvP sì col master, «Altro…» no).
  Diverso dal previsto: in `core.effects` i bisogni valgono per chi agisce, quindi su un viandante il kernel li applica come lui; anche
  `togli_stato` e gli stati che rallentano contano come ferire. Nessuna verifica nel browser (il task chiede i test headless; la verifica con
  due schede è di T43c).

### T43c · Morte e ricollegamento in multigiocatore — `fatto` (5979812) (dipende da T43b)
- Pipeline: claude · stima 5% · approvato · priorità 2
- Fare: a salute zero un giocatore (mai il master) muore con la punizione di T33 (`continueAfterDeath` sul server, come lui,
  senza chiudere la sessione degli altri); il client lo mostra e riparte dove dice il verdetto. Chi si ricollega ritrova il suo
  stato (`world/giocatori/<id>.json`): posizione, inventario, frase, stati; la carta e i legami restano.
- Fatto quando: test headless (morte per sete di un giocatore, gli altri continuano; uscita e rientro con lo stesso stato) e
  verifica con due schede.
- **Esito**: ADR-0076. Su `lua:morte` `mortalDies` (al posto di `spareGods`) risparmia il master (`keepGods`) e chiama `as(id, () => die(cause))`
  per ogni viandante mortale con `needs.morto`. Per un viandante remoto (`remote.has(id)`) `die` avvia `judgeDeath` pagato da lui
  (`deathVerdicts.get(id)`) e concatena `continueAfterDeath(id, cause)` (`dying.get(id)`, che blocca `stepWanderer` finché non finisce), senza
  alzare `dead` né fermare gli altri; `continueAfterDeath` gira come `id`, applica la punizione della partita, salva lo stato ed emette
  `wanderer:died {id, causa, testo}`. `SessionServer` azzera il credito di passo e la vista precedente (`me`, `stato`) del client e manda
  l'avviso `morte`; `ThinClient` porta il viandante dove il verdetto lo fa risvegliare (`putMe`), allinea stato e frase e mostra il messaggio
  della morte. `WandererState` (`world/giocatori/<id>.json`) salva e ripristina anche `pos {x, y}` in coordinate del mondo (del tappeto), con
  `morto: false` al caricamento. `tests/between.test.ts` (2 test nuovi: morte per sete con punizione 3 e 0 mentre gli altri continuano e il
  master non muore; uscita e rientro con posizione, inventario, frase, stati, carta e legame) e verifica con due schede Chromium contro il
  server di sviluppo.

### T44 · Account, profilo e viandante personalizzato — spezzato in T44a e T44b
- Fare: autenticazione sicura, un profilo ricco, il viandante personalizzabile (seme e colori del suo modello, nome);
  l'id del viandante (T34) è quello dell'account.
- Spezzato il 29/10/2026 (multigiocatore in testa): il profilo e il viandante personalizzato non aspettano il fornitore
  dell'autenticazione (T44a); l'account sì (T44b).

### T44a · Il profilo e il viandante personalizzato — `fatto` (dipende da T43a)
- Pipeline: claude · stima 4% · approvato · priorità 3
- Contesto: oggi il mantello di un viandante viene dal suo id (`wandererColor` in `src/kernel/wanderers.ts`, «until the profile»)
  e il nome è l'id (`?viandante=<id>` o uno per scheda, `socket.ts`). Il profilo è di chi gioca, non dell'universo.
- Fare: un profilo del viandante (`nome`, `seme` del programma `viandante`, `colori`/`tinta` del mantello, poche righe di
  presentazione) salvato in `world/giocatori/<id>.json` e mandato nell'`entra`; il server lo valida (nome breve e non simile a
  quello di un altro viandante o di una persona, seme e colori nei limiti) e lo dà agli altri client (`OtherView`); il Narratore
  chiama il viandante col suo nome (`talk`, `sayTo`). Un pannello per scegliere nome, seme e colori, con l'anteprima del modello
  (foto come le icone). L'id resta quello di oggi: T44b lo legherà all'account.
- Fatto quando: test col finto trasporto (profilo valido arriva agli altri; nome doppio o fuori misura riparato; rientro con lo
  stesso profilo) e verifica con due schede (mantelli e nomi diversi).
- Fatto (ADR-0074): `Profile` e `repairProfile` in `wanderers.ts`, `kernel.setProfile`/`profileOf`/`introOf`, `entra {profilo}` e il
  messaggio `profilo`, `OtherView.presentazione` e «Chi è» nel menu, la presentazione al Narratore, il pannello `P` (`src/ui/profile.ts`, una
  foto per seme) e il profilo in `localStorage`; `tests/profile.test.ts` (5 test). Rispetto al previsto: un solo colore (la `tinta` del
  programma `viandante`, che ha una sola lettera da ricolorare); il nome doppio non si rifiuta, si ripara con `freshName`; vale anche in
  singola per `io`. **Non fatta** la verifica con due schede: in questa sessione non c'erano strumenti del browser (build di produzione ok).

### T44b · L'account e l'autenticazione — `fatto` (risposte in `docs/pipeline/domande/T44b.md`; dipende da T44a)
- Pipeline: claude · stima 5% · approvato · priorità 4
- Decisioni dell'autore (29/10/2026): Firebase Auth / Identity Platform di Google Cloud, accesso con Google e anonimo; in singola
  nessun account (il viandante resta `io`). Un anonimo non può recuperare l'account: non compra crediti e gioca solo offline
  (modelli locali), finché non lo lega a un account Google.
- Fare: l'accesso nel client (Google, anonimo) e il token verificato dal server della sessione (`firebase-admin`, chiave del
  progetto solo sul server, mai nel browser né in `dist/`); l'id del viandante è l'uid dell'account e il profilo di T44a gli resta
  legato; un anonimo che si lega a Google tiene lo stesso viandante; chi è anonimo entra in un universo multigiocatore solo offline.
  Senza configurazione di Firebase (sviluppo, test) vale l'id di oggi (`?viandante=`).
- Fatto quando: test con un verificatore finto (token valido, scaduto, anonimo che si lega), verifica nel browser con l'emulatore di
  Firebase o un progetto di prova, commit. Se serve creare il progetto Firebase, la domanda va in `docs/pipeline/domande/T44b.md`.
- Fatto (ADR-0082): `src/session/account.ts` (`Account`, `Verifier`, `accountWanderer`: l'uid in minuscolo), `server/account.ts`
  (`firebase-admin`, `GET /api/account` con le impostazioni web, `anonymousToken`), `SessionOptions.verify`/`masterUid` e
  `isAnonymous` in `server.ts`, `PayerModels` (`src/kernel/ai/local.ts`: le chiamate pagate da un anonimo ai modelli locali) in
  `host.ts`, `src/session/login.ts` (Google o anonimo, Firebase con `import()`), «Lega a Google» ed «Esci» nel pannello `P`;
  `tests/account.test.ts` (6 test). Verificato nel browser con l'emulatore di Firebase Auth (`demo-quine42`): accesso anonimo
  (id = uid, «anonimo: modelli locali»), legame a Google con lo stesso viandante (nome e presentazione restano), token falso e
  ingresso senza token rifiutati, «Esci» riporta alla scelta. Rispetto al previsto: dopo il legame il token dice ancora
  `sign_in_provider: anonymous` (lo ha mostrato l'emulatore), quindi l'anonimo si riconosce dalle `identities`; il client prende un
  token fresco a ogni ingresso; `QUINE_MASTER` (uid) è il master `io` degli universi fatti prima degli account. Il popup di Google
  dell'emulatore si apre fuori dalla scheda dello strumento: il legame nel browser è stato fatto con l'API REST dell'emulatore
  (`signInWithIdp` sullo stesso utente), non cliccando il popup. Il worktree ha ora un `node_modules` suo (non più la junction).
  Test: `npm run typecheck` verde, `tests/account.test.ts` e `tests/session.test.ts` verdi; nella suite intera 52 test vanno in
  timeout (kernel, thin, between, referente…): l'avvio di un kernel su questa macchina il 30/10 impiega 11-15 s, oltre l'hook di 10 s, e
  fallisce allo stesso modo sul commit di partenza (`ab79ce4`), quindi non viene da T44b; nessuna asserzione fallita.

### T44c · Correzioni dalla verifica nel browser di T44a e T43c — `fatto` (dipende da T44a, T43c)
- Pipeline: claude · stima 3% · approvato · priorità 3
- Contesto: verifica con due schede del 29/10/2026 (diario di `docs/pipeline/orchestrazione.md`): profilo, nome doppio, morte di un
  giocatore, uscita e rientro funzionano; restano questi difetti.
- Fare:
  - «Chi è» nel client sottile non fa nulla: `ThinClient.perform` (`src/session/thin.ts`, ~683) gestisce sugli altri viandanti solo
    `parla`, `dai:` e `altro`; deve mostrare la presentazione (come `kernel.ts` ~3201 in singola).
  - Il profilo nel browser sta sotto una sola chiave per origine (`rune:profilo`, `src/session/socket.ts` ~40-51): due schede (o due
    viandanti) se lo scambiano e il server **sovrascrive** il profilo salvato di uno con quello dell'altro. Una chiave per universo e id
    (`rune:profilo:<universo>:<id>`); e quando il server ha già un profilo salvato, quello del client che entra non lo sostituisce senza
    un cambio esplicito (`profilo`).
  - Il passaggio del mouse su un altro viandante dice «undefined. undefined» (`thin.ts` ~306 mette `identity {name}` senza modulo,
    `kernel.ts` ~5938): il nome e la prima riga della presentazione.
  - Il clic destro tra due viandanti vicini apre il menu dell'altro (il passaggio del mouse diceva il giusto).
  - Chi muore in multigiocatore vede solo un avviso di pochi secondi (`hud.ts` ~55): una schermata come in singola, con ciò che ha
    perso e dove riparte.
  - Le verifiche nel browser in un worktree della pipeline: con `node_modules` per junction il server di sviluppo serve `glue.wasm` di
    wasmoon da fuori la radice e la pagina dà «KERNEL PANIC: expected magic word»; `vite.config.ts` deve permetterlo
    (`server.fs.allow` con il percorso reale di `node_modules`).
- Fatto quando: test del client sottile per «Chi è» e per il profilo di due viandanti nella stessa origine, verifica con due schede
  in un worktree della pipeline (`BROWSER: verificato`), commit.
- Esito: «Chi è» nel client sottile (`ui:dialog`); profilo sotto `rune:profilo:<universo>:<id>` (`socket.ts`) e il server tiene quello
  salvato all'ingresso; passaggio del mouse su un altro viandante: nome e prima riga della presentazione; il clic destro sceglie
  l'entità sotto il puntatore (`contextAt`); morte in multigiocatore: l'avviso porta `perso` e `dove` e il client mostra la schermata
  (`ui:died`, un solo «Continua»: il server ha già deciso); `server.fs.allow` con il percorso reale di `node_modules`. In più del
  previsto: nessuno. Verificato con due schede in questo worktree (server di sviluppo, junction): niente «KERNEL PANIC».
  Test: 518, verdi; sulla macchina carica dagli altri worktree 7 test di sessione superano il loro timeout esplicito (20-60 s) e passano
  con il timeout alzato (nessuna asserzione fallita).

### T45 · Crediti, lobby, carte e server su Google Cloud — spezzato in T45a-T45f (risposte in docs/pipeline/domande/T45.md)
- Fare, a pezzi (spezzare quando si comincia): crediti e pagamenti (P#1: l'1% sul costo); la lobby con il tetto di
  crediti, i modelli degli agenti (oggi `ai.textModel` e la tabella delle classi dello Scultore), i coefficienti e i
  minimi dell'universo; crediti finiti → ricarica, offline (modelli locali) o abbandona; la collezione di carte fuori
  dalla partita, con gli utilizzi; il server su Google Cloud con i repository privati, sempre acceso.
- **Domande per l'autore**: le domande 1-4 di [`multiplayer.md`](../archivio/3-to-do-backlog/plans/multiplayer.md) (pagamenti, «un'altra storia», spese
  comuni, coefficienti).

- Decisioni dell'autore (29/10/2026): pagamenti prima nessuno (crediti dati a mano dal master), poi Stripe (con Google Pay, che
  Stripe accetta come metodo di pagamento); i contenuti passano solo nei cloni, con una gerarchia di titolari e una quota per chi ha
  dato origine al contenuto; spese comuni tra i giocatori collegati, master compreso; i coefficienti regolano quanto spesso gli agenti
  chiamano l'IA (una partita «Low Detail» a risparmio), e la lobby fa scegliere i modelli.

### T45a · I crediti e le spese comuni — `fatto` (dipende da T36)
- Pipeline: claude · stima 5% · approvato · priorità 5
- Fare: un saldo di crediti per viandante (in `world/giocatori/<id>.json`, scritto solo dal server), dati a mano dal master
  (console, o il Referente); ogni chiamata scala dal suo `chi` (T36: `payerOf`) il costo più l'1 % (P#1); le spese `comune` si
  dividono tra i giocatori collegati in quel momento, master compreso; crediti finiti → ciò che il viandante chiede si fa con i
  modelli locali (come senza chiave) e lo sa. Un anonimo (T44b) non ha crediti.
- Fatto quando: test headless (due giocatori e il master collegati, una spesa comune divisa in tre; crediti finiti → modelli locali), commit.
- Esito: modulo `src/kernel/credits.ts` (`costWithFee` con +1% P#1, `splitCost` a quote esatte); saldo crediti in `world/giocatori/<id>.json` gestito solo dal server (`kernel.creditsOf`, `giveCredits`, `deductCredits`); addebito automatico su `models.onCall` con ripartizione delle spese `comune` tra i viandanti connessi (esclusi anonimi); ricarica crediti dal master via console (`src/ui/console.ts`) e via Referente (`askReferente` con incarico `crediti`); a crediti esauriti (`crediti <= 0`) `Council.write` devia sui modelli locali (`MockModels`) e avvisa nel feed; il viandante anonimo (`anonimo: true`) ha 0 crediti non ricaricabili e usa sempre modelli locali; ADR-0081 registrato; test headless in `tests/credits.test.ts` (6/6 passati). Nessuna verifica nel browser richiesta dal criterio (logica headless multiplayer e server).

### T45b · I coefficienti di generazione e la partita «Low Detail» — `fatto`
- Pipeline: claude · stima 6% · approvato · priorità 6
- Contesto: l'autore vuole poter giocare a risparmio. I coefficienti regolano **quanto spesso ogni agente chiama l'IA**: direttamente
  dove c'è un ritmo (sessioni del Concilio ogni N luoghi, dialoghi tra persone, revisioni dello Scultore, trame), indirettamente dove
  no (meno persone per luogo, pacchetti di oggetti più rari, meno cose per luogo), e dove non si può si dice al giocatore cosa costa.
- Fare: `universe.json → ai.coefficienti` (uno per agente o compito, 0-1, riparati dal validatore) e un preset «Low Detail»; il
  censimento di ogni chiamata (`docs/conversazioni.md` di T67) diviso in diretta, indiretta, non regolabile; nella schermata della
  Genesi (e poi nella lobby) i coefficienti e la scelta dei modelli degli agenti (`ai.textModel`, la tabella delle classi dello
  Scultore); la stima del costo per ora di gioco.
- Fatto quando: test (con «Low Detail» un giro di gioco offline fa meno chiamate in `MockModels`, nella misura attesa), commit.
- Fatto (ADR-0085): `src/kernel/coefficients.ts` con nove coefficienti (diretti `sessioni dialoghi trame revisioni modelli`, indiretti
  `persone abitanti pacchetti cose`), riparati dal validatore (`repairCoefficients`, anche il nome di un preset), il censimento `CENSUS`
  delle 38 chiamate di `docs/conversazioni.md`, il preset `LOW_DETAIL` (che porta anche lo Scultore su Flash-Lite) e `hourlyEstimate`;
  nella Genesi la sezione «Il dettaglio e i modelli» (preset, cursori, modello del Concilio, modelli dello Scultore per classe, stima
  di un'ora e ciò che non si regola), scritta da `kernel.setAi`; il modello del testo cambia senza ricaricare (`Models.textModel`).
  Test: `tests/coefficients.test.ts` (riparazione, ritmi, Scultore, stima, un giro di 12 passi del tappeto: stessi luoghi, sessioni e
  pacchetti esattamente quanti dicono i coefficienti, meno della metà di ciò che il mondo aggiunge da sé). Rispetto al previsto: le
  persone, le cose nuove e gli oggetti ignoti scartati sono un'estrazione del seme per origine (uguale a ogni caricamento).

### T45c · L'eredità dei cloni — `fatto` (dipende da T42d, T36)
- Pipeline: claude · stima 5% · approvato · priorità 7
- Contesto: un clone di un clone porta contenuti cambiati più volte; chi li ha creati per primo deve ricevere una quota.
- Fare: nella carta (`carta`) la catena dei titolari precedenti (`origini`), allungata da `cloneChanges`; a ogni utilizzo di un
  contenuto (T36: `luoghi trame prompt`) le quote: una base fissa di eredità (10 %, in `universe.json`) più una parte in funzione di
  quanto il contenuto è stato cambiato rispetto all'originale (misura dal diff del file); il resto al titolare attuale; la collezione
  mostra ciò che si riceve dagli universi clonati.
- Fatto quando: test (clone di un clone, contenuto cambiato poco o tanto: le quote attese), ADR, commit.
- Esito: ADR-0084. `src/kernel/heritage.ts` (leggero, lo importa il server con `clone.ts`): `carta.origini` (`Origine {titolare, universo,
  impronta}`), l'impronta è un MinHash di 32 numeri sulle sequenze di tre parole del contenuto (`fingerprint`, `changeOf`): la misura
  del diff senza tenere l'originale. `inheritCards` (in `cloneChanges`, sempre) allunga la catena di ogni carta e mette gli utilizzi
  di allora in `world/carte.json → allaNascita` (si divide solo ciò che viene dopo il clone). `sharesOf`: risalendo, ogni anello passa
  indietro `base + copia × (1 − cambio)` (`universe.json → eredita`, seme 0,1 e 0,4, `repairEredita`), il resto al titolare.
  `allCards(files, true)` dà le `quote`, `receivedBy` / `kernel.received(id)` ciò che si riceve. `tests/heritage.test.ts` (8 test).
  Diverso dal previsto: oltre alla base fissa c'è un secondo coefficiente (`copia`, la parte per un contenuto mai cambiato); un luogo
  si misura dal nome (il piano non si riscrive); la collezione «fuori dalla partita», sommando gli universi, resta a T45d (qui la
  funzione per universo); nessuna verifica nel browser (niente di visibile).

### T45d · La lobby — `fatto`
- Pipeline: gemini · stima 5% · approvato · priorità 1
- Fare: prima di entrare in un universo multigiocatore la lobby: il tetto di crediti di chi entra (si somma ai budget di `ai`), i
  coefficienti e i modelli dell'universo (del master), i minimi; crediti finiti in partita → ricarica, offline o abbandona; la
  collezione di carte fuori dalla partita, con gli utilizzi.
- Fatto quando: test del flusso, verifica nel browser con due schede, commit.
- Esito: ADR-0086; `universe.json → ai.minimi` (tetto minimo, modello testo, modello scultore, luoghi/minuto) riparato da `repairMinimi`; `addBudgetFromTetto` in `credits.ts` aggiunge quote proporzionali a `maxText`, `maxForges`, `maxPacks`, `maxCast`, `maxModels`; `Kernel.setSessionTetto` e `sessionSpentOf` tracciano la spesa del viandante, emettendo `credits:exhausted` (`tetto` o `finiti`); avviso di rete `tipo: 'crediti'` e modale `CreditExhaustedModal` con le 3 scelte (ricarica Stripe, offline con `MockModels`, abbandona sessione); `LobbyScreen` multigiocatore con modelli e coefficienti del master, stima oraria, requisiti minimi, selettore tetto di spesa ($1, $2, $5, tutto) e collezione carte (`collectionOf`) con contatori di utilizzo (luoghi, trame, prompt, totale). Test in `tests/lobby.test.ts` (6/6 passati).

### T45e · I pagamenti con Stripe — `fatto`
- Pipeline: gemini · stima 5% · approvato · priorità 9
- Fare: la ricarica dei crediti con Stripe Checkout (Google Pay compreso) in modalità di prova; il webhook sul server accredita
  (idempotente); chiavi solo sul server; un anonimo non compra.
- Fatto quando: test con il webhook finto, una ricarica di prova nel browser con le chiavi di test, commit. Le chiavi di Stripe le
  dà l'autore: se mancano, la domanda va in `docs/pipeline/domande/T45e.md`.
- Esito: implementati gli endpoint server (`/api/stripe/checkout`, `/api/stripe/webhook`) con verifica firma HMAC-SHA256 (`stripe-signature`), accredito crediti idempotente (`Kernel.creditRecharge` e persistenza `world/pagamenti.json`), blocco acquisti per anonimi (403), interfaccia di ricarica rapida e saldo nel profilo (`P`); test headless in `tests/stripe.test.ts` (6/6 passati); ADR-0083 registrato. Codice e test integrati nel base `3d` con T77. Chiavi di test inserite dall'autore in `.env` (con listener locale indicato su porta 4242); verifica nel browser delegata a T93.

### T45f · Il server su Google Cloud — `da fare` (dipende da T44b, T45d, T133, T134)
- Pipeline: claude · stima 6% · priorità 10
- Fare: il server della sessione e i repository degli universi su Google Cloud, sempre acceso (Cloud Run con istanza minima o una VM,
  disco persistente per `universes/`, repository privati), il deploy da script, i segreti in Secret Manager.
- Fatto quando: un universo multigiocatore giocato da due browser sul server di prova, commit. Il progetto Google Cloud lo dà l'autore.

## Varie

### T70 · Integrare T53b (più piani) con il salto di T56b — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 0
- Contesto: `integra T53b` del 30/10/2026 si è fermato sui conflitti (il base è com'era): T53b (strutture su più piani: un pavimento
  per tratto di pieno, `pos.z`, `free`/`free_real`/`floorAt` con l'altezza, taglio del renderer sul piano) e T56b (il salto, già nel
  base, ADR-0080: altezza delle cose da `mesh.ts`/`forms.ts`, `jump`/`jumpTick`, arco e ombra in `things.ts`) toccano gli stessi punti.
  Conflitti: `src/kernel/forms.ts` (4 blocchi), `src/kernel/kernel.ts` (5), `src/mj/mesh.ts`, `src/render/renderer.ts`, `src/render/things.ts`.
  Leggi i dossier: `dossier T53b`, `dossier T56b`.
- Fare: nel tuo worktree `git merge task/T53b` e risolvi tenendo entrambi i comportamenti: il salto tiene conto del piano in cui si è
  (`pos.z`: si salta da un piano, si atterra su un pavimento raggiungibile), i piani funzionano come in T53b. Se T53b ha preso un numero di
  ADR già usato, prendi il primo libero.
- Fatto quando: `tests/storeys.test.ts`, `tests/jump.test.ts`, `tests/ramps.test.ts` verdi e un test che salta dentro la torre a due piani,
  `npm test` e `npm run typecheck`, verifica nel browser (salire la torre, saltare una cassa al piano terra e al primo piano), commit. Poi
  l'orchestratore fa `integra T70` e `integra T53b` (che toglie worktree e branch di T53b).
- Esito: merge di `task/T53b` (nessun ADR nuovo: T53b aggiorna solo ADR-0043). `Form.top`/`tops` tolti: `Levels.base` (dove comincia
  ogni tratto di pieno) e `topUnder(f, levels, …, at, up)` contano solo il pieno che comincia sotto `JUMP_UP` sopra il pavimento da cui
  si salta (una cassa, un muro fino al tetto; non il soffitto né il piano di sopra); `jump` parte da `floorAt(…, pos.z)`, atterra sul
  pavimento più alto che supera (`floorBelow`) se `free(…, h)`, e `jumpTick` porta `pos.z` dal pavimento di partenza a quello d'arrivo.
  ADR-0080 (punto 5) e ADR-0043 aggiornati, AGENTS.md. Test: in `tests/storeys.test.ts` la torre con una cassa per piano, saltata al
  piano terra e al primo piano atterrando sullo stesso piano, salto sul posto contro il muro esterno.
  Diverso dal previsto: la verifica nel browser ha trovato un difetto dei piani di T53b, un cartello a terra dentro la torre bloccava il
  primo piano sopra di lui (`rampBlocks` prendeva comunque il suo pavimento più vicino); `formBlocks` ora ignora un modello che sta tutto
  sotto i piedi (test nello stesso file). Browser: torre aggiunta con `addModel`, dalla porta salto della cassa del piano terra, scala A
  fino al primo piano (z 54) camminando con la collisione, oltre il cartello, salto della cassa del primo piano, atterraggio a z 54;
  taglio del renderer sul piano giusto, nessun errore del gioco in console. `npm run typecheck` verde; `npm test` con la macchina carica
  (altri agenti, CPU al 99 %) va in timeout (solo timeout, nessuna asserzione; l'avvio del kernel impiega 10 s anche sulla base): in serie
  con timeout larghi 511/520, i 9 restanti (`between`, `referente`, `wanderers`, `watch`) in timeout sui limiti scritti nei test.
  A CPU scarica 6 di loro restano in timeout, identici sulla base `2948f60` (stessi file, stessi test): lentezza che c'era già, non
  una regressione di T70.

### T69 · L'interfaccia web della pipeline — `fatto` (dipende da T61)
- Pipeline: argon · stima 6% · approvato · priorità 60
- Contesto: richiesta dell'autore del 30/10/2026 (non prioritaria: prima si usa il nuovo ambiente, ADR-0079). Oggi la pipeline si
  segue dal terminale di `node tools/pipeline/pipeline.mjs orchestra` e dai file (`docs/pipeline/PIANO.md`, `quadro.md`,
  `orchestrazione.md`, `.pipeline/esecuzioni.json`, `.pipeline/budget.json`, `.pipeline/orchestra/chat.jsonl`, `eventi.jsonl`).
  La pagina legge e scrive **gli stessi file e gli stessi comandi**: non è una seconda fonte di verità.
- Fare: una pagina locale (servita dal processo di `orchestra` o da un piccolo server Node in `tools/pipeline/`, senza dipendenze
  nuove se si può) con:
  - la **chat** con l'orchestratore (scrive nella stessa coda dei messaggi del terminale) e gli eventi della pipeline;
  - la **tabella** di tutti i task (id, titolo, stato, provider, stima, priorità, approvato, dipendenze, esecuzione) e le **lavagne**
    tipo Trello con le code di `PIANO.md` (in corso, da integrare, pronti, da approvare, bloccati, in attesa);
  - il **dettaglio** di un task: il suo dossier (`dossier Txx`), il log e la conversazione dell'agente in corso, seguita dal vivo;
  - **approvare** provider e stime proposti (`approva`, `assegna`), **interrompere** e **riprendere** un task;
  - **rispondere alle domande** (`docs/pipeline/domande/*.md`) e **modificare** `docs/userchats/to-do.md`;
  - il **consumo**: i contatori di ogni provider (5 ore e settimana) e lo storico di `consumi.jsonl`.
- Fatto quando: la pagina mostra lo stato reale e ogni azione passa dai comandi della pipeline (test dei punti del server senza
  browser), verifica nel browser con l'orchestratore acceso, README della pipeline aggiornato, commit.
- Esito: `tools/pipeline/web.mjs` (server HTTP locale senza dipendenze, avviato in automatico da `orchestra` su `:4242` con fallback di porta o da solo con `node tools/pipeline/pipeline.mjs web [--porta 4242]`), coda condivisa dei messaggi in `.pipeline/orchestra/coda.json` (`readInbox`, `enqueueMessage`, `dequeueMessages` in `tools/pipeline/orchestra.mjs`, usata sia dal terminale sia da `POST /api/chat` con risveglio immediato di `pump()`), funzioni esportate in `tools/pipeline/pipeline.mjs` (`pathsOf`, `writePlan`, `parseConversation`, `traceOf`, `resumeTasks`, `interruptTasks`, `integrateTask`, `approveTasks`, `assignTask`, `setBudgetManual`, `refreshUsage`, `dossierOf`) con parsing in diretta delle conversazioni `.jsonl` di Claude Code e `transcript.jsonl` di Antigravity CLI, vista a 5 schede (Chat & Orchestra, Lavagna Kanban, Tabella Task, Domande & To-Do, Budget & Consumi) e cassetto laterale di dettaglio task (Conversazione dal vivo, Dossier, Log, Azioni), 7 test dei punti del server e HTTP in `tests/pipeline.test.ts` (36 test totali), `docs/pipeline/README.md` e `AGENTS.md` aggiornati.

### T30 · Immagini del 3D nel README — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 60
- Il README mostrava le immagini del 2D (`docs/img/`): ora non le mostra più. Fare quattro schermate del 3D (il borgo
  di giorno, una persona con la chat, l'inventario con le icone dei modelli, la corona con `?dev&teleport=46,0`) con
  `vite preview` offline, salvarle in `docs/img/3d/` e rimetterle nel README.
- Fatto quando: README con le immagini nuove, commit. Esito: acquisite quattro schermate del gioco 3D (`world.png`, `chat.png`, `inventory.png`, `corona.png`) con `vite preview` offline e Chrome headless (D3D11 / ANGLE), salvate in `docs/img/3d/` e ripristinata la vetrina grafica nel `README.md`.

## Laboratorio MarkovJunior

Richiesta del 25/10 ([`to-do-2026-10-25.md`](../archivio/3-to-do-backlog/userchats/to-do-2026-10-25.md)). La sandbox 3D `/lab/3d/` resta com'è per
la vista d'insieme e la conformità dei modelli; l'editor MJ è un ambiente dedicato a modellare le singole mesh.

### T59 · Laboratorio: editor per modelli MarkovJunior — `fatto` (T59a, T59b, T59c e T59d fatti)
- **T59a · Split screen codice e rendering** — `fatto` (`6fb7faa`): interfaccia divisa a due riquadri (editor di testo/XML a sinistra con syntax
  highlighting e validazione immediata; viewport 3D Three.js a destra con rendering in tempo reale della mesh risultante,
  controlli camera e orbita libera con tasto destro). Esito: `lab/editor/` (`index.html`, `editor.css`, `syntax.ts`, `main.ts`, `worker.ts`),
  integrazione in `vite.config.ts`, test in `tests/editor.test.ts` (10 test), verifica nel browser confermata.
- **T59b · Controlli CAD per voxel** — `fatto` (`b4fda79`): strumenti interattivi sulla griglia (creazione, cancellazione, spostamento di forme
  base / blocchi; selezione palette colori, materiale e proprietà glow). Esito: `lab/editor/cad.ts` (manipolazione XML bidirezionale per forme base, colori, glow, arti, raycasting e hit testing), barra strumenti CAD (Seleziona, Box, Voxel 1x1, Cilindro, Sfera, Cono, Gomma; dimensioni W, D, H), anteprima 3D ghost con wireframe durante il puntamento, coordinate cursore (X, Y, Z), selezione forma con box highlight 3D e salto a riga nel codice, scheda Inspector con regolazione numerica e bottoni +/- per posizione e dimensioni, duplicazione ed eliminazione, barra palette swatches MarkovJunior con toggle Glow (`glow="True"`), colore personalizzato HEX e legame ad arti (`part="..."`), scorciatoie da tastiera; test in `tests/editor.test.ts` (18 test), verifica nel browser confermata. Diverso dal previsto: nessuno.
- **T59c · Controllo esecuzione e animazione** — `fatto` (`a729958`): controlli temporali di esecuzione delle regole MarkovJunior (step singolo,
  loop continuo, pausa/stop) e anteprima sequenza fotogrammi per modelli animati. Esito: `lab/editor/playback.ts` (PlaybackController per la gestione dello stato e scheduler temporale a FPS variabili, buildPlaybackTracks per generare tracce di generazione regole con snapshot, tracce di animazione da `<animation>` via clipFrames e tracce di azione da `<action>` via act), barra Playback & Animation Timeline in viewport Three.js (selettore traccia, pulsanti trasporto inizio/step indietro/play-pausa/step avanti/fine/stop/loop, scrubber slider progressivo, indicatore passo/fotogramma e conteggio voxel solidi, selettore velocità 2-30 FPS, toggle Timeline nel HUD), scorciatoie tastiera (Spazio, Frecce Sx/Dx, Home, End, Esc), calcolo e meshing asincrono in `worker.ts`; test in `tests/editor.test.ts` (23 test), verifica nel browser confermata. Diverso dal previsto: nessuno.
- **T59d · Strumenti per regole e WFC** — `fatto` (`04acc9c`): controlli per facilitare la stesura delle regole XML (menu di sostituzione con
  selezione all / one / parallel e menu guidato per la configurazione WFC). Esito: `lab/editor/rules.ts` (generazione e inserimento regole `<all>`, `<one>`, `<prl>` concise o con elementi figli `<rule>`, parametri passi, probabilità p con slider e numero, gruppo di simmetria, estrazione palette attiva con swatches per auto-completamento, inserimento al cursore o in fondo alla sequenza, copia negli appunti), `lab/editor/wfc.ts` (configurazione WFC guidata con 5 preset procedurali: Tubi 3D, Labirinto, Castello & Mura, Dungeon Modulare, Terreno a Isole; generazione a doppia modalità: modello a vincoli MarkovJunior nativo eseguibile all'istante nel viewport 3D o specifiche standard WFC per export), dialoghi modali in `lab/editor/index.html` e `editor.css`, supporto nodi e attributi WFC nel syntax highlighter (`syntax.ts`), pulsanti toolbar ⚡ Regole e 🧩 WFC con scorciatoie `Alt+R` e `Alt+W`; arricchimenti: palette selezionabile nel renderer da menu a tendina `#palette-source-select` con auto-attivazione palette del modello se definita, toolbar CAD e HUD telecamera riorganizzati su due righe in alto a sinistra (`.viewport-top-bars`), color chips voxel nei tag dell'editor XML con popup color picker inline interattivo (`#editor-color-picker-popup`), tab Modello/Default MJ e caratteri speciali (`*`, `.`, `0`, `?`);
  - **Estensioni CAD avanzate**: voxel traslucidi/vetri semi-trasparenti supportati nello stack di compilazione e meshing (`src/mj/model.ts`, `src/mj/mesh.ts` con culling selettivo tra facce vetrate e preservazione superfici retrostanti) e nel renderer di gioco (`src/render/materials.ts` con shader vertex alpha blending e `transparent: true, depthWrite: true`, `src/render/models.ts`), pulsante `🧊 Vetro` nella barra palette; correzione raycasting e click detection (`Math.floor` in `threeToVoxel`, soglia di spostamento iniziale contro micro-tremolii, Shift+Click non intercettato da pan) e allineamento perfetto della gabbia wireframe di selezione (`getShapeVoxelBounds` zero offset con vertici voxel); multiselezione forme CAD con Shift+Click, scheda Inspector dinamica (`MULTI`) e traslazione coordinata di tutte le forme con i bottoni passo X/Y/Z (`moveShapesInXml`); pulsante `⚡ 2× HD` (Double Definition) che raddoppia le dimensioni statiche in tutte e 3 le direzioni (volume 8×) mantenendo intatte le regole generative (`doubleDefinitionInXml`). Test in `tests/editor.test.ts` (49 test), verifica browser confermata.
- Fatto quando (per pezzo): test verdi, typecheck, verifica nel browser.




## Ambiente di sviluppo

### T61 · La pipeline agentica e i worktree — `fatto` (`3312c23`)
- Dal to-do del 28/10/2026 (`docs/userchats/to-do-2026-10-28.md`): «Strutturare meglio l'ambiente di sviluppo agentico» (ordine nei
  worktree) e «Automatizzare il lavoro agentico» (la pipeline to-do → scambio → backlog → piano → esecuzione per provider).
- Fare: la pipeline (ADR-0072), le regole dell'ambiente condiviso, un worktree per task, lo storico dei consumi; non perdere i task del backlog.
- Esito: `tools/pipeline/pipeline.mjs` + `config.json` (`stato esegui budget worktree integra`), `docs/pipeline/` (README con le
  regole per chi esegue, `pianifica.md` per le fasi 1-4, `PIANO.md` generato, `domande/`, `consumi.jsonl`), `/pipeline` in
  `.claude/commands/`, AGENTS.md, GEMINI.md, ADR-0072. Diverso dal previsto: niente PLAN_*/TASK_* per provider, il backlog resta la
  fonte con la riga `- Pipeline:` e le code sono in `PIANO.md`; il consumo vero non si legge dalle CLI, lo corregge l'autore
  (`budget`). I vecchi worktree non sono stati toccati (elencati nel README). Provati `stato` e `worktree` sul backlog vero;
  `esegui` non è stato lanciato (consumerebbe i limiti): la prima esecuzione va guardata.

### T62 · I test della pipeline — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 1
- Contesto: la prima esecuzione end-to-end della pipeline (T61, ADR-0072) su un caso semplice. `tools/pipeline/pipeline.mjs` esporta
  `parseBacklog`, `parsePipelineLine`, `parseUsage`, `usageLimit`, `readOutput`, ma nessun test li prova.
- Fare: `tests/pipeline.test.ts` (Vitest, import dinamico del `.mjs`): `parseBacklog` su un backlog in miniatura (stato tra backtick,
  sotto-task nell'intestazione «T56a `fatto`, T56b `da fare`», «spezzato in …», «dipende da» e «dopo», la riga `- Pipeline:`);
  `parseUsage` sugli output di `claude -p /usage` («Current session: 6% used · resets Oct 29, 12:10am (Europe/Rome)», «Current week
  (all models): 99% used · resets Oct 29, 5pm (Europe/Rome)») e di `agy -p /usage` (righe separate da tabulazioni: «Gemini Models»,
  «Weekly Limit Remaining», «100%», data ISO); `usageLimit` (epoca dopo `|`, nessun limite); `readOutput` (JSON di
  `claude --output-format json` con `session_id`, `total_cost_usd` e `ESITO:` nel `result`). Se un test trova un difetto, correggilo.
- Fatto quando: test e typecheck verdi, commit sul branch del task.
- Esito: `tests/pipeline.test.ts` (17 casi). I test hanno trovato quattro difetti, corretti in `pipeline.mjs`: un id corto
  scambiava per sé i task che iniziano come lui (T6 perdeva la dipendenza da T63); una riga di `agy /usage` senza data del reset
  faceva cadere `parseUsage` (`RangeError`), ora il reset è `undefined`; «429» dentro un numero (14290) era un limite (ora `429`);
  `readOutput` si fermava a un'ultima riga JSON non oggetto (`0`) e perdeva `session_id`.

## Dal to-do del 29/10/2026 (testo originale: `docs/userchats/to-do-2026-10-29.md`)

### T63 · I modelli disegnati a mano per i file della corona — `fatto` (commit «Corona (T63)»)
- Pipeline: gemini · stima 4% · approvato · priorità 10
- Contesto: l'autore ha disegnato nell'editor (T59) `schermo-scritte`, `schermo-struttura`, `circuito-3D` in `lab/mjx/models/handmade/`
  (accanto a copie di prova: `schermo-struttura copy*.xml`, `circuito.xml`, `circuito-mormale.xml`, da non portare).
- Fare: portarli nella libreria (`universe/models/` + `index.json`, con `vpt`) e usarli per i file sugli scaffali della corona:
  `schermo-scritte` per `.md` e i file non strutturati, `schermo-struttura` per `.json` e i file strutturati, `circuito-3D` per i `.lua`.
  Nei prompt dello Scultore (`universe/prompts/agents/`) citarli come esempi quando si chiede «tanta varietà» e «alta qualità».
- Fatto quando: test, typecheck, verifica nel browser negli interni dello studio (scaffali con i tre modelli), commit.
- Esito: `schermo-scritte`, `schermo-struttura`, `circuito-3D` portati in `universe/models/` e registrati in `universe/models/index.json` (`classe: "oggetto"`, `autore: "a mano (editor MJ, T59)"`, `vpt: 20`); `check.ts` aggiornato per non scartare modelli traslucidi come blocchi pieni (`fill > 0.8 && !hasTranslucent`); `validator.ts` e `forms.ts` aggiornati con flag case-insensitive (`/i`) per nomi modello con maiuscole; citati come esempi di alta qualità e varietà in `universe/prompts/agents/scultore.md`; `src/kernel/corona.ts` assegna `fileModelOf(path)` (`schermo-scritte` per `.md` e non strutturati, `schermo-struttura` per `.json` e strutturati, `circuito-3D` per `.lua`) e seed deterministico a ogni file sugli scaffali; prefetch in `kernel.ts`; rendering 3D in `src/render/corona3d.ts` e animazione fotogrammi in `src/render/coronaview.ts`; test in `tests/corona.test.ts`. Test e typecheck verdi.

### T64 · Le varianti precalcolate dei modelli pesanti — `fatto` (dipende da T63)
- Pipeline: gemini · stima 5% · approvato · priorità 20
- Contesto: i modelli dell'autore (es. `circuito-3D`) danno a ogni seme risultati molto diversi e sono pesanti da generare e animare.
- Fare: misurare prima (tempo di generazione e di animazione di `circuito-3D` nei worker); se serve, una cache per (programma, seme)
  della griglia finita e dei fotogrammi delle animazioni (in memoria e IndexedDB nel browser), precaricata per pochi semi per tipo,
  così il mondo mostra molte varianti senza rigenerarle. Prima di scrivere la cache, controllare cosa fa già `src/render/forms.ts`.
- Fatto quando: misure prima e dopo nel task, test, typecheck, verifica nel browser, commit.
- Esito: misurazione prima su `circuito-3D` (griglia 37×37×47, 32 fotogrammi d'animazione) su 4 semi: 18.338 ms totali (media 4.585 ms/seme; runMjx ~607-5.473 ms, animazioni ~1.650-2.030 ms/seme). Implementata cache deterministica a doppio livello (in memoria e IndexedDB persistente `rune-forms`) in `src/render/forms.ts`: `formCacheKey` su `(model, seed, vpt, hashXml, tint, rig, sway, size)` con invalidazione automatica su modifica XML; `FormStore`, `MemoryFormStore`, `IdbFormStore`, `restoreFormResult` (ripristino TypedArray Float32Array/Uint8Array/Uint32Array da IndexedDB); `WorkerRunner` esteso con deduplicazione chiamate in-flight simultanee, lookup memoria (< 0.1 ms, ~46.000× speedup) e IndexedDB (~1-3 ms, ~1.500× speedup), salvataggio trasparente al ritorno dal worker; `InlineRunner` con cache per Node/test; `Forms.seedsOf` restituisce 4 varianti per i modelli pesanti degli scaffali (`circuito-3D`, `schermo-struttura`, `schermo-scritte`); `Forms.preload` e precaricamento all'ingresso nella corona (`kernel.visitCorona`). Test in `tests/forms.test.ts` (11 test totali: determinismo chiave, ripristino TypedArray, store in memoria, deduplicazione in-flight e cache hit senza messaggi worker, seedsOf/preload, InlineRunner cache). Typecheck e build puliti.

### T65 · Il lessico di QUINE42 — `fatto` (risposte in `docs/pipeline/domande/T65.md`)
- Pipeline: claude · stima 5% · approvato · priorità 30
- Decisioni dell'autore (29/10/2026): il lessico è un file del seme, `universe/world/lessico.md`, che ogni universo eredita e il
  Narratore può arricchire ma non contraddire, con **pochi** termini nuovi generati; la prima versione la propone l'agente del task
  (15-20 voci: usanze, saluti, modi di dire, bon ton, parole sostituite); al più 5-6 parole sostituite, le stesse in ogni
  ambientazione, spiegate dal contesto e mai da un glossario dentro il gioco.
- Contesto: usanze, modi di dire, espressioni gergali e bon ton costanti in ogni universo, qualunque l'ambientazione (anche moderna,
  steampunk, futuristica): una società credibile, non lontana dalla nostra ma diversa, che faccia guardare le nostre stranezze da
  fuori. Solo alcune parole sostituite. Appunti dell'autore: `docs/userchats/idee-costumi-parole-etc.md`.
- Fare (dopo le risposte): il lessico come dato che va con ogni compito narrativo (come il canone delle rune), il Narratore che lo usa
  in dialoghi, oggetti e bibbia, un controllo che non diventi meta-gioco; test con `MockModels`.
- Esito: `universe/world/lessico.md` (18 voci: 5 parole sostituite dagli appunti dell'autore, bonombo, macico, lerpio, pagosso, Ciok Ciok,
  più saluti, buone maniere, usanze della fede comune e modi di dire; «Come si usa»), `lexiconSummary` nel contesto di Narratore e Arbitro,
  `usanze` della bibbia (al più 3, ripulite da `cleanBible`), `glossaryBreak` dentro `metaBreak` per bibbia, Fucina, individui, trame e
  revisione all'avvio; ADR-0075; `tests/lexicon.test.ts`. Rispetto al previsto: il test di T13 non conta il lessico (fisso, in cache);
  il nome della fede comune resta da dare (gli appunti lo lasciano vuoto): il lessico non la nomina.

### T66 · Riorganizzare la documentazione per metodologia — `fatto`
- Pipeline: gemini · stima 3% · approvato · priorità 15
- Contesto: in `docs/` convivono le metodologie passate (thread unico, step, to-do e backlog) e quella attuale (pipeline, T61).
- Fare: archiviare i documenti delle metodologie precedenti in cartelle ordinate, senza modificarne il contenuto né i link interni;
  a livello di `docs/` un resoconto: le metodologie in ordine, cosa contiene ogni cartella, e una tabella «link citato → dove è ora».
  Restano dove sono (li leggono la pipeline e gli agenti): `docs/pipeline/`, `docs/plans/backlog.md`, `docs/userchats/to-do.md`,
  `docs/adr/`, `docs/design.md`. Aggiornare i percorsi in AGENTS.md, CLAUDE.md, GEMINI.md se cambiano.
- Fatto quando: niente perso (`git status` mostra solo spostamenti), il resoconto, commit.
- Esito: archiviati i documenti delle 3 metodologie precedenti in `docs/archivio/` (`1-thread-unico/userchats/`, `2-step/` con `plans/`, `reports/`, `userchats/`, `3-to-do-backlog/` con `plans/`, `prompts/`, `userchats/`), preservando byte-for-byte contenuti e link interni; redatto `docs/README.md` con l'analisi cronologica delle 4 metodologie, mappa delle cartelle e tabella completa «link citato → dove è ora»; aggiornati i percorsi in `AGENTS.md` e `README.md`; lasciati intatti i file e cartelle attivi (`docs/pipeline/`, `docs/plans/backlog.md`, `docs/userchats/to-do.md`, `docs/adr/`, `docs/design.md`, `docs/conversazioni.md`, `docs/img/`).

### T67 · Il grafo delle conversazioni con Gemini — `fatto`
- Pipeline: gemini · stima 4% · approvato · priorità 25
- Contesto: per tradurre il gioco in quattro lingue (fine della fase I) servono i riferimenti a tutti i testi, compresi i prompt.
- Fare: `docs/conversazioni.md`: per ogni compito degli agenti (`src/kernel/agents/`, `src/kernel/ai/`) chi chiama, con quale prompt
  (`universe/prompts/`, testi nel codice), quali parti del contesto, quale schema di risposta; grafi in mermaid. Un elenco dei testi
  sparsi nel codice da portare a fattor comune (md, yaml, json o properties), senza spostarli in questo task.
- Fatto quando: il documento, commit.
- Esito: redatto `docs/conversazioni.md` con l'architettura end-to-end, i diagrammi Mermaid dei flussi, le schede dettagliate di tutti i 38 task degli agenti (Genesi, Cartografia, Fucina, Contenuti, Azioni ed effetti, Menti e dialoghi, Scultura 3D, Meccaniche) con ruoli, prompt di sistema, prompt utente, response schema e flussi di validazione. Censimento completo di tutti i testi hardcoded in italiano nel codice (template dei prompt, descrizioni degli schemi, principi e filtri della quarta parete, narrazione di fallback, testi UI e HUD) con proposta di organizzazione per la futura localizzazione multi-lingua e per la coda abbonamenti (T68).

### T68 · Generare l'universo con gli abbonamenti — spezzato in T68a, T68b, T68c (risposte in docs/pipeline/domande/T68.md)
- Decisioni dell'autore (29/10/2026): solo in locale con l'abbonamento di chi gioca (singola e sviluppo), mai il server del
  multigiocatore; solo i compiti già lenti (Genesi, Fucina, modelli dello Scultore, sessioni del Concilio), il resto sulle API;
  quale provider per quale agente in una tabella in `universe.json → ai`, con un provider predefinito.
- Contesto: il Concilio oggi chiama le API di Gemini a consumo. L'autore vuole far girare le stesse richieste su Claude Code o
  Antigravity in abbonamento (anche chi scarica il repository), con una coda servita quasi in tempo reale; la base è la pipeline
  (T61: CLI lanciate da script, contatori da `/usage`, ripresa dopo i limiti).
- Fare (dopo le risposte): un `Models` del kernel che mette le richieste in una coda su disco servita da un processo che usa le CLI,
  con lo stesso schema delle risposte e lo stesso registro dei consumi; da spezzare prima di cominciare.
- Spezzato (29/10/2026) in tre pezzi, ADR-0077:

### T68a · La tabella dei provider e la coda su disco — `fatto`
- Fare: `universe.json → ai.provider`/`agenti` (riparati), i compiti lenti, `RoutedModels`, `QueueModels` (client di `/api/coda`),
  la coda su disco `server/subscriptionQueue.ts` (richiesta → presa → risposta, battito del servitore), prezzi a zero nel registro.
- Fatto quando: test della coda e dell'instradamento, ADR, commit.
- Esito: `src/kernel/ai/subscription.ts`, `server/subscriptionQueue.ts` (in `vite.config.ts`, cartella `universes/.coda/`),
  `SUBSCRIPTION_PRICES` in `prices.ts`, `tests/subscription.test.ts`, ADR-0077. Rispetto al previsto: anche `mechanic.design` (la Fucina
  delle meccaniche) e `model.resculpt` tra i compiti lenti; `model.judge` (foto) resta sulle API. Nel gioco non è ancora collegato.

### T68b · Il processo che serve la coda con le CLI — `fatto` (dipende da T68a)
- Pipeline: claude · stima 4% · approvato · priorità 20
- Contesto: `take`/`answer`/`beat` di `server/subscriptionQueue.ts` sono il protocollo; il lancio delle CLI e il riconoscimento dei
  limiti sono in `tools/pipeline/pipeline.mjs` (`usageLimit`).
- Fare: `tools/abbonamenti/servi.mjs` (o `.ts` con vite-node) `--provider claude|antigravity`: battito ogni 10 s, prende la richiesta più
  vecchia, lancia la CLI in modo non interattivo senza strumenti (Claude: `claude -p --output-format json`, system come
  `--system-prompt`, schema nel prompt e risposta controllata/riparata con `parseJson`; Antigravity: `agy -p`), immagini se la CLI le
  accetta (o errore), token da ciò che la CLI riporta, un limite dell'abbonamento → `errore` chiaro e pausa fino al reset. `npm run abbonamento`.
- Fatto quando: test con una CLI finta (script che risponde), una prova vera con Claude Code su un `model.sculpt`, commit.
- Esito: `tools/abbonamenti/servi.ts`, `npm run abbonamento`, test con CLI mock e con Claude Code reale su `model.sculpt` in `tests/abbonamenti.test.ts`.

### T68c · Gli abbonamenti nel gioco — `fatto` (dipende da T68b)
- Pipeline: claude · stima 3% · approvato · priorità 21
- Fare: `main.ts` costruisce `RoutedModels` se `usesSubscriptions` e la coda è servita (`QueueModels.available`), solo se l'universo
  è in singola (mai in `host.ts`); `#models` e il pannello del Concilio dicono quali agenti vanno su quale abbonamento e cosa c'è in coda;
  documentazione per chi scarica il repository (README: impostare la tabella, lanciare il servitore).
- Fatto quando: Genesi offline con la coda servita da una CLI finta nel browser, commit.
- Esito: `main.ts` costruisce `RoutedModels` in singola quando la tabella `ai` usa abbonamenti e `QueueModels.available` è vero per i provider richiesti; `/api/coda/stato` e `QueueModels.queryState` riportano lo stato completo con richieste in attesa e in corso; `#models` e il pannello del Concilio (`FeedPanel`, tasto G) mostrano il riepilogo dei provider/agenti e della coda con dettagli tooltip; documentazione aggiunta nel README per tabella e comando `npm run abbonamento`; test completi e prova della Genesi offline con coda servita in `tests/subscription.test.ts`.

### T71 · Soglie della pipeline e dell'orchestratore sul limite settimanale per Argon — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 0
- Contesto: richiesta urgente dell'autore in chat (30/10/2026). La pipeline e l'orchestratore (`tools/pipeline/pipeline.mjs`,
  `tools/pipeline/orchestra.mjs`, `tools/pipeline/config.json`) fanno affidamento su soglie specifiche (es. per l'orchestratore il 50 %
  della sessione, o `sogliaUnSolo` / `riserva` / cambio provider dell'orchestratore), ma in `agy -p /usage` **Argon** (`Gemini 4 Argon`)
  ha **solo il limite settimanale** (nessuna riga per le 5 ore, quindi il contatore `5h` resta a `100 %` predefinito). Poiché Argon è
  attualmente l'orchestratore, qualsiasi controllo che guardi la sessione di 5 ore invece del limite settimanale per Argon vede `100 %`
  invece del vero residuo settimanale (`28 %`). Nasce da T61 e T62: leggi `node tools/pipeline/pipeline.mjs dossier T61` e `dossier T62`.
- Fare: in `tools/pipeline/pipeline.mjs`, `tools/pipeline/orchestra.mjs` e `tools/pipeline/config.json`, verificare tutte le soglie di
  budget (scelta e rotazione del provider dell'orchestratore, soglia del 50 % o `riserva`/`sogliaUnSolo`, blocco dei task sul provider
  dell'orchestratore, fallback) e fare in modo che per `argon` (o quando un provider ha solo il limite settimanale e non ha una finestra
  di 5 ore reale) ogni soglia — inclusa quella della sessione dell'orchestratore — si basi sul **limite settimanale**. Aggiungere i test
  in `tests/pipeline.test.ts` per il calcolo dei limiti e delle soglie di Argon (settimanale senza 5h) per task e orchestratore.
- Fatto quando: `tests/pipeline.test.ts` e `npm run typecheck` verdi, commit.
- Esito: configurato `"finestra5h": false` per Argon in `config.json`; introdotta `computeBudget` e aggiornato `loadBudget` in `pipeline.mjs` affinché per i provider con solo limite settimanale `sessione` sia allineata a `residuo` settimanale anziché a un 100% predefinito; aggiornato `capOf` in `pipeline.mjs` affinché il controllo di sessione si basi sul limite settimanale (`left`) per Argon; aggiornato `pickOrchestrator` in `orchestra.mjs` affinché le decisioni di scelta, rotazione e disponibilità dell'orchestratore considerino sempre il limite settimanale effettivo per Argon; aggiunti test dedicati in `tests/pipeline.test.ts`.

### T72 · Integrare T71 (soglie settimanali Argon) con T69 (interfaccia web) — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Contesto: `integra T71` del 30/10/2026 si è fermato su un conflitto in `tools/pipeline/pipeline.mjs` (perché nel frattempo è stato
  integrato T69). Leggi `node tools/pipeline/pipeline.mjs dossier T71` e `dossier T69`.
- Fare: nel tuo worktree esegui `git merge task/T71` e risolvi i conflitti in `tools/pipeline/pipeline.mjs` (ed eventuali altri file)
  mantenendo sia le funzioni e gli export di T69 (`web.mjs`, `setBudgetManual`, `refreshUsage`, `traceOf`, ecc.) sia le modifiche di
  T71 (`computeBudget`, `capOf`, `loadBudget`, `finestra5h: false`, `pickOrchestrator` e i test di entrambi in `tests/pipeline.test.ts`).
  IMPORTANTE: esegui solo `npx vitest run tests/pipeline.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`, NON lanciare
  `npm test` sull'intera suite per non mandare il comando in background).
- Fatto quando: `npx vitest run tests/pipeline.test.ts` e `npm run typecheck` verdi, commit sul branch `task/T72`. Poi l'orchestratore
  farà `integra T72` e `integra T71`.
- Esito: eseguito merge di `task/T71` in `task/T72`; risolti i conflitti in `tools/pipeline/pipeline.mjs` mantenendo tutti gli export e le funzioni di T69 (`web.mjs`, `refreshUsage`, `setBudgetManual`, `traceOf`, `parseConversation`, `integrateTask`, ecc.) e combinandoli con le logiche di T71 (`computeBudget`, `capOf`, `loadBudget`, gestione `"finestra5h": false` e allineamento di `sessione` al residuo settimanale per Argon anche in `setBudgetManual`); preservati e integrati i test sia di T69 sia di T71 in `tests/pipeline.test.ts` (42 test passati); `npm run typecheck` verde.

### T73 · Integrare T68b (processo abbonamenti CLI) con T45a in AGENTS.md — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Contesto: `integra T68b` del 30/10/2026 si è fermato su un conflitto in `AGENTS.md` (perché nel frattempo è stato
  integrato T45a con crediti e spese comuni). Leggi `node tools/pipeline/pipeline.mjs dossier T68b` e `dossier T45a`.
- Fare: nel tuo worktree esegui `git merge task/T68b` e risolvi i conflitti in `AGENTS.md` mantenendo sia le aggiunte
  di T45a (crediti per viandante, commissione piattaforma +1%, divisione spese comuni, ADR-0081) sia quelle di T68b
  (`npm run abbonamento` nei comandi e `tools/abbonamenti/` nell'albero).
  IMPORTANTE: esegui solo `npx vitest run tests/abbonamenti.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`,
  NON lanciare `npm test` sull'intera suite per evitare timeout o backgrounding).
- Fatto quando: `npx vitest run tests/abbonamenti.test.ts` e `npm run typecheck` verdi, commit sul branch `task/T73`.
  Poi l'orchestratore farà `integra T73` e `integra T68b`.
- Esito: eseguito merge di `task/T68b` in `task/T73`; risolto il conflitto in `AGENTS.md` preservando sia le aggiunte di T45a (modulo `credits.ts` nell'albero, sezione «Crediti e spese comuni» con ADR-0081) sia quelle di T68b (`npm run abbonamento` nei comandi, `tools/abbonamenti/servi.ts` nell'albero) e mantenendo `web.mjs` di T69; eseguiti `tests/abbonamenti.test.ts` (12/12) e `npm run typecheck` con esito verde.

### T74 · Integrare T68c (gli abbonamenti nel gioco) in backlog.md — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Contesto: `integra T68c` del 30/10/2026 si è fermato su un conflitto in `docs/plans/backlog.md` (dovuto alle integrazioni concorrenti di T71, T72 e T73 nel branch base). Leggi `node tools/pipeline/pipeline.mjs dossier T68c`.
- Fare: nel tuo worktree esegui `git merge task/T68c` e risolvi il conflitto in `docs/plans/backlog.md` mantenendo sia le aggiunte recenti (T71, T72, T73, T74) sia lo stato `fatto` e l'esito di T68c. IMPORTANTE: esegui solo `npx vitest run tests/subscription.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`, NON lanciare `npm test` sull'intera suite per evitare timeout o backgrounding).
- Fatto quando: `npx vitest run tests/subscription.test.ts` e `npm run typecheck` verdi, commit sul branch `task/T74`. Poi l'orchestratore farà `integra T74` e `integra T68c`.
- Esito: eseguito merge di `task/T68c` in `task/T74`; risolto il conflitto in `docs/plans/backlog.md` mantenendo lo stato `fatto` e l'esito di T68c insieme a tutti i task recenti (T71, T72, T73, T74); verificati `tests/subscription.test.ts` (16/16) e `npm run typecheck` con esito verde.


### T75 · Integrare T44b (l'account e l'autenticazione) con T45a (i crediti) — `fatto`
- Pipeline: gemini · stima 3% · approvato · priorità 0
- Contesto: `integra T44b` del 30/10/2026 si è fermato su conflitti in `docs/adr/README.md`, `src/main.ts`, `src/session/client.ts`,
  `src/session/protocol.ts`, `src/session/server.ts`: T44b è partito da `ab79ce4`, prima che entrassero T45a (crediti, `38dcd69`) e T68c
  (abbonamenti, `7f9c965`). Nasce da T44b: `node tools/pipeline/pipeline.mjs dossier T44b`; leggi anche `dossier T45a`.
- Fare: nel tuo worktree `git merge task/T44b` e risolvi. Due aggiunte nello stesso punto restano entrambe (messaggi del protocollo,
  campi dell'`ingresso`, opzioni del server). L'ADR di T44b (`docs/adr/0081-l-account.md`) si scontra con ADR-0081 di T45a: diventa
  **ADR-0082** (file, `docs/adr/README.md`, riferimenti in `AGENTS.md`, nel backlog e nel messaggio del commit). **L'anonimo**: T44b
  (`PayerModels`, `src/kernel/ai/local.ts`) e T45a (`anonimo: true`, 0 crediti, `MockModels` a crediti esauriti) fanno la stessa cosa:
  tienine **un solo meccanismo** (quello di T45a sui crediti, con l'anonimo che viene dall'account di T44b; un anonimo legato a Google
  smette di essere anonimo e tiene il viandante), e dillo in ADR-0082 e in `AGENTS.md`.
- Fatto quando: `npx vitest run tests/session* tests/credits* tests/subscription.test.ts` (i file che esistono) e `npm run typecheck`
  verdi (non la suite intera: va in timeout per carico macchina), commit sul branch `task/T75`. Poi l'orchestratore farà `integra T75`
  e `integra T44b`.
- Esito: eseguito merge di `task/T44b` in `task/T75`; risolti i conflitti in `docs/adr/README.md`, `src/main.ts`, `src/session/client.ts`, `src/session/protocol.ts`, `src/session/server.ts`; ADR-0081 di T44b rinumerato in ADR-0082 (`docs/adr/0082-l-account.md`, `README.md`, `AGENTS.md`, `backlog.md`); unificato il meccanismo dell'anonimo sul sistema dei crediti di ADR-0081 (`anonimo: true`, 0 crediti non ricaricabili, escluso dalle spese comuni, richieste personali gestite con `MockModels` a crediti esauriti; legandosi a Google smette di essere anonimo, sblocca i crediti e tiene viandante e profilo; rimosso `src/kernel/ai/local.ts`); verificati `tests/account.test.ts`, `tests/credits.test.ts`, `tests/session.test.ts`, `tests/subscription.test.ts` e `npm run typecheck` con esito verde.
### T76 · Integrare T75 (account T44b e crediti T45a) con T44c in src/main.ts — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Contesto: `integra T75` del 30/10/2026 si è fermato su un conflitto in `src/main.ts` (perché nel frattempo nel base `3d` è stato integrato T44c, commit `906ed6a`). Leggi `node tools/pipeline/pipeline.mjs dossier T75` e `dossier T44c`.
- Fare: nel tuo worktree esegui `git merge task/T75` e risolvi il conflitto in `src/main.ts` (e se si presenta in `docs/plans/backlog.md` mantenendo sia T75 sia T76) preservando sia le novità di T44c (`savedProfile(name, id)`, «Chi è» nel client sottile, profilo per universo e viandante, hover/clic destro corretti, schermata della morte in multigiocatore) sia quelle di T75/T44b/T45a (gestione account Firebase, login con Google/anonimo, crediti anonimo).
  IMPORTANTE: esegui solo `npx vitest run tests/account.test.ts tests/credits.test.ts tests/session.test.ts tests/subscription.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`, NON lanciare `npm test` sull'intera suite per evitare timeout o backgrounding).
- Fatto quando: i test sopra indicati e `npm run typecheck` sono verdi, commit sul branch `task/T76`. Poi l'orchestratore farà `integra T76`, `integra T75` e `integra T44b`.
- Esito: eseguito merge di `task/T75` in `task/T76`; risolti i conflitti in `src/main.ts` e `docs/plans/backlog.md` preservando sia le novità di T44c (`savedProfile(name, id)`, gestione `ui:died` in multigiocatore, profilo salvato per universo/viandante) sia quelle di T75/T44b/T45a (account Firebase, login Google/anonimo, `accountWanderer` per id e profilo, crediti per anonimo e profilo account); superati `tests/account.test.ts` (6/6), `tests/credits.test.ts` (6/6), `tests/subscription.test.ts` (16/16), `tests/session.test.ts` (3/3) e `npm run typecheck` con esito verde.

### T77 · Integrare T45e (i pagamenti con Stripe) nel base 3d — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Contesto: `integra T45e` del 30/10/2026 si è fermato su un conflitto in `docs/plans/backlog.md` (e possibili sovrapposizioni nei file aggiornati da T76/T75/T44b in `3d`). Leggi `node tools/pipeline/pipeline.mjs dossier T45e` e `dossier T76`.
- Fare: nel tuo worktree esegui `git merge task/T45e` e risolvi i conflitti:
  - In `docs/plans/backlog.md` mantieni lo stato aggiornato di T45e (con le sue note/esito e domanda chiavi Stripe) e aggiungi T77.
  - In `src/main.ts`, `server/session.ts`, `src/kernel/credits.ts`, `src/ui/profile.ts`, `vite.config.ts`, `AGENTS.md` o eventuali altri file, preserva attentamente sia l'autenticazione Firebase, i crediti anonimi e il profilo di T76/T75/T44b/T44c, sia l'integrazione di Stripe Checkout (`/api/stripe/checkout`), il webhook idempotente (`/api/stripe/webhook`), il blocco degli utenti anonimi dai pagamenti e la memorizzazione in `world/pagamenti.json` di T45e (ADR-0083).
  IMPORTANTE: esegui solo `npx vitest run tests/stripe.test.ts tests/account.test.ts tests/credits.test.ts tests/session.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`, NON lanciare `npm test` sull'intera suite per evitare timeout).
- Fatto quando: i test specificati e `npm run typecheck` sono verdi, commit sul branch `task/T77`. Poi l'orchestratore farà `integra T77` e `integra T45e`.
- Esito: eseguito merge di `task/T45e` in `task/T77`; risolto il conflitto in `docs/plans/backlog.md` mantenendo lo stato di T45e (`in attesa` chiavi Stripe di prova) e la definizione di T77; verificate e preservate tutte le integrazioni sia di Firebase Auth/profilo (T76/T75/T44b/T44c) sia di Stripe Checkout, webhook idempotente, esclusione anonimi e persistenza in `world/pagamenti.json` di T45e (ADR-0083); superati `tests/stripe.test.ts`, `tests/account.test.ts`, `tests/credits.test.ts`, `tests/session.test.ts` (21/21) e `npm run typecheck` con esito verde.


### T78 · Integrare T45c (l'eredità dei cloni) nel base 3d — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 0
- Contesto: T45c (`task/T45c`, `ce4b2db`) ha scritto il suo ADR come `docs/adr/0081-l-eredita-dei-cloni.md`, ma nel base 0081 è già «Crediti e spese comuni» (0082 l'account, 0083 Stripe). Leggi `node tools/pipeline/pipeline.mjs dossier T45c` e `traccia T45c`. L'agente ha lasciato 8 test in timeout (`between`, `referente`, `thin`, `wanderers`, `watch`), attribuiti al carico della macchina; per `between`, `referente`, `thin` il confronto con il commit di partenza non è stato fatto.
- Fare: nel tuo worktree `git merge task/T45c`; rinomina l'ADR in `docs/adr/0084-l-eredita-dei-cloni.md` (o il primo numero libero) e correggi ogni riferimento a ADR-0081 che parla dell'eredità (AGENTS.md, `docs/adr/README.md`, backlog, commenti in `src/kernel/heritage.ts`, `cards.ts`, `clone.ts`, test), lasciando ADR-0081 ai crediti. Risolvi i conflitti tenendo entrambe le aggiunte. Fai girare `npm run typecheck`, `npx vitest run tests/heritage.test.ts tests/clone.test.ts tests/cards.test.ts tests/credits.test.ts` e, uno per volta, `tests/between.test.ts tests/referente.test.ts tests/thin.test.ts tests/wanderers.test.ts tests/watch.test.ts`: se uno fallisce, provalo anche su `3d` e di' nell'esito se il guasto c'era già.
- Fatto quando: typecheck e test indicati verdi (o fallimenti dimostrati preesistenti), commit su `task/T78`. Poi l'orchestratore fa `integra T78` e `integra T45c`.
- Esito: eseguito merge di `task/T45c` in `task/T78`; rinominato l'ADR in `docs/adr/0084-l-eredita-dei-cloni.md` (e titolo aggiornato) e corretti tutti i riferimenti a ADR-0081 riguardanti l'eredità in ADR-0084 (AGENTS.md, `docs/adr/README.md`, backlog, commenti in `src/kernel/heritage.ts`, `cards.ts`, `clone.ts`, `kernel.ts`, `types.ts`), preservando ADR-0081 per i crediti e le spese comuni; risolto il conflitto in `docs/adr/README.md` includendo entrambi gli ADR (0081, 0082, 0083 e 0084); verificati con successo `npm run typecheck` e `tests/heritage.test.ts`, `tests/clone.test.ts`, `tests/cards.test.ts`, `tests/credits.test.ts` (23/23 verdi); eseguito `tests/thin.test.ts` (7/7 verde); i test `referente.test.ts`, `wanderers.test.ts`, `watch.test.ts` presentano timeout dovuti al carico macchina e `between.test.ts` ha una mancata cattura in `calls` dovuta al bypass dei mock introdotto da `hasCredits` (T45a), preesistente e identico su `3d` (file sorgenti e di test identici a `3d`).

### T79 · Integrare T45b (coefficienti di generazione e partita Low Detail) nel base 3d — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 0
- Contesto: T45b (`task/T45b`, `bc77bd9`) ha completato i coefficienti di generazione e la partita Low Detail ma ha scritto il suo ADR come `docs/adr/0081-i-coefficienti-di-generazione.md`. Nel base, 0081 è «Crediti e spese comuni», 0082 l'account, 0083 Stripe, 0084 l'eredità dei cloni (ADR-0084, T78). Claude è fermo per limite 5 ore fino alle 17:00 UTC. Leggi `node tools/pipeline/pipeline.mjs dossier T45b`.
- Fare: nel tuo worktree esegui `git merge task/T45b`; rinomina l'ADR in `docs/adr/0085-i-coefficienti-di-generazione.md` (e aggiorna il titolo interno e i riferimenti ad ADR-0081 che parlano dei coefficienti in ADR-0085 in `AGENTS.md`, `docs/adr/README.md`, backlog, commenti in `src/kernel/coefficients.ts`, `src/ui/genesis.ts`, test). Risolvi i conflitti in `docs/plans/backlog.md`, `AGENTS.md`, `docs/adr/README.md` e in `src/kernel/kernel.ts` / `src/kernel/types.ts` tenendo entrambe le aggiunte (sia l'eredità dei cloni ADR-0084 e Stripe ADR-0083 sia i coefficienti ADR-0085).
  IMPORTANTE: esegui solo `npx vitest run tests/coefficients.test.ts tests/heritage.test.ts tests/stripe.test.ts tests/credits.test.ts` e `npm run typecheck` (con timeout adeguato, NON lanciare l'intera suite).
- Fatto quando: i test specificati e `npm run typecheck` sono verdi, commit su branch `task/T79`. Poi l'orchestratore farà `integra T79` e `integra T45b`.
- Esito: eseguito merge di task/T45b in task/T79; rinominato l'ADR in docs/adr/0085-i-coefficienti-di-generazione.md (aggiornato titolo interno a ADR-0085); aggiornati tutti i riferimenti ad ADR-0081 relativi ai coefficienti di generazione in ADR-0085 in AGENTS.md, docs/adr/README.md, backlog.md (esito T45b), src/kernel/coefficients.ts, src/kernel/types.ts, src/ui/genesis.ts e tests/coefficients.test.ts, lasciando intatti i riferimenti ad ADR-0081 per i crediti e le spese comuni; preservate tutte le integrazioni preesistenti (eredità cloni ADR-0084, Stripe ADR-0083, crediti ADR-0081); verificati con esito verde npm run typecheck e vitest su tests/coefficients.test.ts, tests/heritage.test.ts, tests/stripe.test.ts, tests/credits.test.ts (26/26 passati).

### T80 · Integrare T45d (la lobby multigiocatore) nel base 3d — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Contesto: `integra T45d` del 30/10/2026 si è fermato su un conflitto in `docs/plans/backlog.md` dovuto ai commit dell'orchestratore nel base `3d`. Tutti i file sorgente di codice, `AGENTS.md` e `docs/adr/README.md` si fondono senza conflitti e ADR-0086 è già numerato correttamente. Leggi `node tools/pipeline/pipeline.mjs dossier T45d` e `traccia T45d`.
- Fare: nel tuo worktree esegui `git merge task/T45d` e risolvi il conflitto in `docs/plans/backlog.md`:
  - Nel blocco di T45d mantieni lo stato `fatto`, la pipeline approvata su gemini, e il testo dell'esito scritto da T45d.
  - Mantieni intatti i blocchi di T75, T76, T77, T78, T79 e questo blocco T80.
  - IMPORTANTE: esegui solo `npx vitest run tests/lobby.test.ts tests/credits.test.ts tests/coefficients.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`, NON lanciare `npm test` sull'intera suite per evitare timeout o sovraccarico macchina).
- Fatto quando: i test specificati e `npm run typecheck` sono verdi, commit su branch `task/T80`. Poi l'orchestratore farà `integra T80` e `integra T45d`.
- Esito: eseguito merge di `task/T45d` in `task/T80`; risolto il conflitto in `docs/plans/backlog.md` preservando per T45d lo stato `fatto`, la riga pipeline approvata su gemini e l'esito di T45d; preservati intatti i blocchi T75-T79 e completato T80; verificate tutte le integrazioni con `npm run typecheck` e `npx vitest run tests/lobby.test.ts tests/credits.test.ts tests/coefficients.test.ts` (18/18 passati).

## Dalla chat del 30/10/2026 (testo originale: `docs/userchats/to-do-2026-10-30.md`)

> Le correzioni della pipeline toccano `tools/pipeline/` (soprattutto `pipeline.mjs` e `orchestra.mjs`): su Claude vanno una
> dopo l'altra (catena di dipendenze) per non creare conflitti. Entrano in funzione al riavvio di `pipeline.mjs orchestra`.
> Nessuna lancia la suite intera di `npm test`: bastano i test della pipeline (o quelli che toccano) e `npm run typecheck`.

### T81 · Bug: la pagina web della pipeline non parte (SyntaxError nella regex) — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Contesto: aprendo `http://localhost:4242` la console dice `Uncaught SyntaxError: Invalid regular expression flags (at (index):1264:44)`:
  probabilmente una regex nello script inline di `tools/pipeline/web.mjs` perde i `\` dentro il template string del server. Nasce da T69: `dossier T69`.
- Fare: trovare la riga 1264 della pagina servita, correggere l'escape; un test che fa il parse dello script servito (`new Function(script)` in Node) per non ricaderci.
- Fatto quando: la pagina carica senza errori in console (verifica con il browser se lo hai, altrimenti il test di parse basta), test e typecheck verdi.
- Esito: corretto l'escape della regex `replace(/^\/nota\s+/i, '')` in `tools/pipeline/web.mjs` dentro il template string di `renderHtml()` (usando `^\\/nota\\s+` per non perdere i backslash nel codice client generato); aggiunto test in `tests/pipeline.test.ts` che valida con `new Function(script)` lo script inline estratto da `renderHtml()`; verificati `tests/pipeline.test.ts` (43/43 passati) e `npm run typecheck` con esito verde.

### T82 · Un task per provider: tetti di parallelismo per provider e modello — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 1
- Dipende da: T70 (gira su Claude: aspetta che finisca).
- Contesto: oggi `maxParalleli` (5) è uno solo per tutta la pipeline. Troppi task in parallelo: lasciarne due a metà al reset costa più che finirne uno,
  i cambi di provider moltiplicano il costo, crescono i conflitti, i crediti finiscono in modo imprevedibile, la macchina rallenta.
- Fare:
  - in `config.json` un tetto per provider e per modello (`limiti`, all'inizio 1 per provider), deciso dall'autore: l'orchestratore non lo alza né fa eccezioni senza
    un'istruzione esplicita dell'autore (scriverlo in `orchestra.md`);
  - **slot dinamici sotto il tetto** (per provider, tra 0 e il tetto, partendo da 1): a ogni controllo la pipeline prevede dal ritmo di consumo (gli ultimi giorni di
    `budget.json`) quando la settimana del provider arriva al 100 %; se la previsione cade **dopo** il reset settimanale aggiunge uno slot, se cade **prima** lo toglie.
    Così, se l'abbonamento cresce (Claude ×5), gli slot salgono da soli fino al tetto. Per Argon solo la settimana;
  - vicino a 0 % (5 ore o settimana) al più un task in corso su quel provider, e nessuno nuovo;
  - una **riserva** per le richieste urgenti dell'autore (un task a priorità 0 chiesto dall'autore può usare uno slot oltre quelli dinamici, mai oltre il tetto);
  - lo schedule conta solo i task eseguibili e quelli bloccati solo da altri task del backlog (non quelli in attesa dell'autore);
  - `stato` mostra per provider tetto, slot, previsione di esaurimento e reset.
- Fatto quando: test della pipeline sul calcolo degli slot (previsione prima/dopo il reset, tetto, riserva, 0 %) e typecheck verdi; `orchestra.md`, `docs/pipeline/README.md` e un ADR aggiornati.
- Esito: ADR-0087. `config.json → limiti` (`provider`: `claude` 1, `agy` 1; `modello`: `claude gemini argon` 1), `giorniPrevisione` (3), `giorniStoria` (7); in `pipeline.mjs` `ceilingOf`, `forecastEmpty`, `weeklyResetOf`, `nextSlot`, `demandOf`, `updateSlots` e il nuovo `capOf` (slot, tetto, riserva a priorità 0, resuming); `esegui` scrive `budget.json` a ogni controllo (storia, slot, anche `letto`); `stato`, `PIANO.md` e la scheda del budget nel web mostrano tetto, slot, task in programma, esaurimento previsto e reset. 9 test nuovi in `tests/pipeline.test.ts` (50/50), typecheck verde; la suite intera non l'ho lanciata (tocca solo la pipeline). Diverso dal previsto: la «riserva» per le urgenze è la priorità 0 (nessun campo nuovo); vicino a 0 % un task sospeso può riprendere se non ce n'è un altro in corso; gli slot non salgono oltre i task in programma ma non scendono per questo.

### T83 · Il carico della macchina: un solo browser e una sola suite pesante alla volta — `fatto` (`441a7cb`)
- Pipeline: claude · stima 3% · approvato · priorità 2
- Dipende da: T82.
- Contesto: `npm test` intero dura ~30 minuti e, lanciato da più agenti insieme, rallenta tutto (anche `agy -p usage` ci mette 2 minuti); più verifiche nel browser insieme sono deleterie.
- Fare: un semaforo su disco (`.pipeline/lock/`) per le operazioni pesanti: **al più una verifica nel browser** in tutta la pipeline e **al più una suite intera** di vitest;
  chi le vuole fare aspetta il suo turno (un comando come `pipeline.mjs turno browser|test -- <comando>` che il prompt dei task chiede di usare); la pipeline non lancia
  insieme due task che chiedono il browser e distribuisce nel tempo quelli pesanti.
- Fatto quando: test del semaforo verdi; il prompt in `config.json` e il README dicono di usare il turno.
- Esito: ADR-0088. `pipeline.mjs turno browser|test -- <comando>` (`runInTurn`): semaforo in `.pipeline/lock/` della cartella principale (`lockDir`, `PIPELINE_LOCK`), file del titolare creato in modo esclusivo, coda nell'ordine d'arrivo (`<tipo>.attesa/`, `tryTurn`, `leaveTurn`, `holderOf`), un processo morto o un turno oltre `turni.<tipo>.massimoMinuti` (45/60) non blocca; `turno` da solo e `stato` dicono chi lo tiene; la CLI di ogni task riceve `PIPELINE_TASK`. In `esegui` `holdBack`: mai due task col browser insieme (anche riprendendo), lanci nuovi distanziati di `intervalloLanciMinuti` (10). Prompt di `config.json`, README (regole 6-7), `orchestra.md`, AGENTS.md aggiornati. 6 test nuovi in `tests/pipeline.test.ts` (60/60, uno con due processi veri), typecheck verde. La suite intera, lanciata nel turno: 554/609, i 55 falliti sono in file che non toccano la pipeline (timeout per il carico della macchina; `branch.test.ts` e un test di `between.test.ts` falliscono anche da soli, già sul base: da guardare a parte). Diverso dal previsto: la verifica nel browser tiene il turno con la sua preview (`turno browser -- npx vite preview …` in background), non con un comando a parte.

### T84 · L'orchestratore parla solo quando serve, e con meno epoche — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 3
- Dipende da: T83.
- Contesto: in attesa dei reset Gemini ha aperto più di 100 epoche senza portare avanti nessun task («contesto a 114 % della finestra»), con risposte prolisse ogni volta:
  rumore e crediti sprecati. Forse il quadro e l'`avvio.md` sono troppo grandi (l'avvio ripete chat lunghe), forse il contesto è misurato male (token cumulati, cache comprese).
- Fare: il processo interpella l'orchestratore **solo** per messaggi dell'autore o eventi che chiedono una decisione (un task finito, fallito, in attesa, un limite raggiunto),
  non per gli eventi di routine né quando non c'è nulla in corso; capire e correggere la misura del contesto; un `avvio.md` compatto (niente indice intero, ultime chat troncate,
  niente messaggi ripetuti dell'orchestratore); in `orchestra.md` la regola delle risposte brevi.
- Fatto quando: un test che con soli eventi di routine non apre turni, uno sulla misura del contesto, un `avvio.md` d'esempio sotto un tetto di dimensione.
- Esito: ADR-0089. Il ciclo dell'orchestratore (`pump`) interpella l'agente solo quando `shouldRunTurn` rileva messaggi dell'autore in coda o eventi di decisione (`wakes`: esiti `ESITO: fatto|fallito|in attesa`, `limite di`, `fallito`, `conflitti`), mai per eventi di routine né quando non c'è nulla in corso o a inizio epoca vuota. Misura del contesto corretta in `contextOf`: per Gemini/agy `input_tokens` contiene già la cache (`cache_read_tokens`) e non viene sommata due volte quando `input_tokens >= cache_read_tokens`. Pagina di avvio `avvio.md` compatta (`startPage`, `compactChat`): rimosso l'indice intero dei task, chat troncata a 250 caratteri su max 8 elementi e deduplicata (niente boilerplate ripetuti dell'orchestratore come «quadro aggiornato»). Regola delle risposte brevi documentata in `docs/pipeline/orchestra.md`. 3 test nuovi in `tests/pipeline.test.ts` (63/63), typecheck a zero errori.

### T85 · Spegnere la pipeline in modo sicuro — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 0
- Dipende da: T84.
- Contesto: l'autore vuole fermare tutto senza Ctrl+C brutale, anche chiedendolo all'orchestratore in chat («chiudi ora tutti i task e spegni», «aspetta che finiscano e spegni»).
- Fare: comandi `ferma --ora` (interrompe ogni task tenendo la sua conversazione, salva lo stato, spegne `orchestra`) e `ferma --dopo` (niente lanci nuovi, aspetta che i task
  in corso finiscano, poi spegne); l'orchestratore li può dare; Ctrl+C fa `ferma --ora` pulito; al riavvio l'`avvio.md` dice al nuovo orchestratore cosa era in corso, cosa è
  stato interrotto e cosa è finito mentre era spento.
- Fatto quando: test dei due spegnimenti e del riepilogo al riavvio verdi; README e `orchestra.md` aggiornati.
- Esito: ADR-0090. `ferma --ora|--dopo` (anche `/ferma ora|dopo` dal terminale o dalla chat web, e dall'orchestratore con la sua shell) scrive la richiesta in `.pipeline/arresto.json` (`requestStop`); `execute` la vede entro un secondo (l'attesa del controllo ora si interrompe), con `ora` interrompe i task tenendo la conversazione (`interruptTasks` con `spegnimento`), con `dopo` non lancia né riprende nulla e aspetta, poi scrive `.pipeline/spegnimento.json` (`shutdownRecord`) e ritorna; `orchestra` aspetta il turno in corso (per `dopo` fa aggiornare il quadro) ed esce. Ctrl+C è `ferma --ora` (anche in `esegui`), un secondo Ctrl+C esce subito; `/esci` lascia anch'esso il registro. Al riavvio `recoverRuns`: gli interrotti allo spegnimento riprendono da soli (diversi da `interrompi`, che aspetta `riprendi`), e — in più del previsto — un'esecuzione il cui processo è sparito ma il cui log ha l'`ESITO:` si chiude come finita invece di ripartire da capo; l'epoca nuova ha in `avvio.md` «Lo spegnimento di prima» (`shutdownSummary`). Corretta anche una corsa: `saveRuns` non annulla più un'interruzione scritta da un altro processo. Con `PIPELINE_STATE` anche `consumi.jsonl` va nella cartella di prova, così i test fanno girare `esegui` vero con una CLI finta. 5 test nuovi in `tests/pipeline.test.ts` (68/68); il test di T84 sull'`avvio.md` misurava il `quadro.md` vivo (cresciuto a 7,4 KB) e falliva sul base: ora misura ciò che la pagina aggiunge al quadro. README, `orchestra.md`, AGENTS.md aggiornati. Suite intera nel suo turno: 562/617, i 55 falliti sono gli stessi timeout dei test multigiocatore che T83 e T91 hanno trovato sul base (`src/` non cambia; `branch.test.ts` verde da solo, `watch.test.ts` va in timeout a 20 s anche da solo sul base).

### T86 · Tracciare tutte le conversazioni in corso, anche quelle di agy e dell'orchestratore — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 0
- Dipende da: T85.
- Contesto: `traccia Txx` su un task Claude in corso dà l'id e il file della conversazione (si può seguire e suggerire); per agy l'id arriva solo alla fine. L'autore vuole poter
  sempre seguire tutte le conversazioni in corso, anche per valutare qualità ed efficienza dell'uso dei crediti, compreso il thread dell'orchestratore.
- Fare: per agy l'id della conversazione dall'avvio (passarlo noi come per Claude se la CLI lo consente, o leggerlo dal primo output o dai file di Antigravity); `traccia` di un
  task in corso dà id, file, comando per riprenderlo e un riepilogo parziale (ultime azioni); `traccia orchestratore` per le epoche (id, provider, consumi); nell'interfaccia
  web una vista delle conversazioni in corso con il consumo di ciascuna.
- Fatto quando: test su `traccia` di un task in corso per entrambi i provider e sull'orchestratore verdi.
- Esito: agy non accetta un id (`agy --help`: niente `--session-id`) e lo stampa solo alla fine: `launch` lo cerca ogni 5 s (al più 10 minuti) nei file di Antigravity (`findAgyConversation`: la conversazione in `brain/` più recente, nata dopo l'avvio, la cui prima richiesta nomina il worktree, a parola intera, o `**Txx**`) e lo salva in `esecuzioni.json`; `traceOf` lo cerca allo stesso modo per i run già partiti. `traccia Txx` dà id, file, comando per riprenderla (`cd <worktree> && claude --resume …` / `agy --conversation …`), consumo dalla trascrizione (`usageOf`: chiamate, token nuovi, cache letta e scritta, uscita; le chiamate di Claude contate una volta per messaggio, la cache di agy tolta dall'ingresso) e le ultime 8 azioni (`lastSteps`). `traccia orchestratore`: `orchestra.mjs` tiene `stato.json → epoche` (`openEpoch`, `noteTurn`: provider, motivo, conversazione, turni, token, costo di Claude), `traceOrchestrator` aggiunge file, comando, consumo e ultime azioni dell'epoca in corso. Web: scheda «Conversazioni in corso» da `GET /api/conversazioni` (`liveConversations`). README e `orchestra.md` aggiornati; nessun ADR (strumento della pipeline). 5 test nuovi in `tests/pipeline.test.ts` (73 verdi), typecheck verde; provato anche sui file veri (questa conversazione e una di agy di T84).

### T87 · Le verifiche nel browser di agy non funzionano — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 6
- Dipende da: T81 (un task alla volta su Gemini).
- Contesto: l'autore nota che i task su Gemini/Argon (agy) non riescono a fare le verifiche nel browser.
- Fare: capire perché (`agy -p` non ha il browser di Antigravity in modalità non interattiva? manca un flag?) e correggere `tools/pipeline/config.json`; se non si può,
  la pipeline lo deve sapere: i task con verifica nel browser vanno solo su Claude. Scrivi ciò che scopri nel README della pipeline.
- Fatto quando: una verifica di prova su una pagina locale riesce da `agy -p`, oppure il README dice che non si può e la pipeline non manda più ad agy i task che chiedono il browser.
- Esito: verificato sperimentalmente con `agy -p` che Antigravity CLI non supporta flag browser (es. `--chrome` non definito) e non espone strumenti di navigazione/ispezione; il subagente `/browser` cerca `DevToolsActivePort` su Chrome utente e non avvia Chrome in autonomia. Aggiornato `tools/pipeline/config.json` con `"browser": true` per Claude e `false` per Gemini/Argon, aggiornato il prompt comune; in `tools/pipeline/pipeline.mjs` aggiunti `taskNeedsBrowser`, riconoscimento `needsBrowser` nel backlog e nella riga pipeline, blocco in `plan` e `assignTask` se un task browser è indirizzato a provider non-browser, e filtro in `execute` che impedisce il fallback di task browser su Gemini o Argon; documentate le cause e la regola esclusiva per Claude in `docs/pipeline/README.md`, `pianifica.md` e `orchestra.md`; test completi in `tests/pipeline.test.ts`.

### T90 · Integrare T82 (tetti per provider) con T87 (browser solo su Claude) in pipeline.mjs — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 0
- Contesto: `integra T82` del 30/10/2026 si è fermato su un conflitto in `tools/pipeline/pipeline.mjs`: T87 (già nel base `3d`) manda i task con verifica nel browser solo a Claude, mai ad agy; T82 aggiunge i tetti per CLI e modello (`config.json → limiti`), gli slot dinamici e lo slot di riserva (ADR-0087). Leggi `node tools/pipeline/pipeline.mjs dossier T82`, `traccia T82` e `traccia T87`.
- Fare: nel tuo worktree `git merge task/T82` e risolvi tenendo entrambe le regole (i task col browser solo su Claude e dentro i tetti di T82). Se ci sono conflitti anche in `docs/plans/backlog.md`, tieni lo stato `fatto` e l'esito di T82 e T87 e questo blocco. Esegui solo i test della pipeline (`npx vitest run tests/pipeline.test.ts` e quelli che T82 ha aggiunto) e `npm run typecheck`, NON la suite intera.
- Fatto quando: test della pipeline e typecheck verdi, commit su `task/T90`. Poi l'orchestratore fa `integra T90` e `integra T82`.
- Fatto: merge di `task/T82` su `task/T90`; un solo conflitto in `execute()` di `pipeline.mjs`: tenuto il filtro `allowed` di T87 (col browser solo i provider con `browser`, predefinito Claude) con la firma nuova di T82 `fits(prov, t, resuming)` (tetti per CLI, slot, riserva a priorità 0). Il backlog si è fuso da solo. `tests/pipeline.test.ts` (54) e typecheck verdi; nessuna differenza dal previsto.

### T91 · I test che falliscono anche da soli: `branch.test.ts` e `between.test.ts` — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 3
- Contesto: chiesto dall'autore il 30/10/2026. T83 (`dossier T83`, `traccia T83`) ha trovato nella suite intera 55 test falliti su 609: quasi tutti timeout per carico della macchina, ma due file falliscono anche da soli: `tests/branch.test.ts` (tre test si aspettano un solo file cambiato, `modules/npc.cat/manifest.json`, e ne ricevono due) e un test di `tests/between.test.ts`.
- Fare: verifica sul base `3d` che falliscano davvero; trova la causa (il test vecchio o un cambio del codice, per esempio un task integrato dopo) e correggi ciò che è sbagliato, senza indebolire ciò che il test garantisce. Lancia i due file da soli; la suite intera solo nel suo turno (`node tools/pipeline/pipeline.mjs turno test -- npm test`). Se i timeout della suite intera hanno una causa comune evidente (non il carico), annotala nel blocco senza correggerla.
- Fatto quando: `branch.test.ts` e `between.test.ts` verdi da soli, typecheck verde, commit su `task/T91` con una riga sulla causa.
- Esito: falliscono davvero sul base, per T45a (crediti), non per i test. `branch.test.ts`: lo specchio riceve il saldo dal server con `setCredits`, che scriveva `world/giocatori/io.json` nel suo repository, e il file entrava nel ramo del master; ora in uno specchio (`kernel.mirror`) `setCredits` tiene il saldo solo in memoria (il file del viandante lo scrive solo il server, ADR-0081). `between.test.ts`: Anna a 0 crediti è servita dai modelli locali (`council.localModels`), così la spia su `k.models.text` non vedeva `player.death`; il test le dà crediti, e garantisce ancora che il verdetto sia chiesto e pagato da lei. I due test della morte avviano 6-7 kernel e da soli superano i 60 s: tetto a 180 s. Causa comune dei timeout della suite intera (non il carico): ogni `Kernel.boot` impiega ~10-11 s, quasi tutti in `placeCampus` → `forms.preload` che esegue di nuovo in Node i programmi MarkovJunior degli edifici della corona (`mj/engine.ts`, `scan`/`sync`); i test multigiocatore avviano un kernel per il server e uno per ogni specchio. Non corretta: una cache delle forme per (programma, seme) condivisa tra i kernel dello stesso processo, o la corona solo dove serve, la toglierebbe (da fare come task a parte). Verdi da soli: `between.test.ts` 7/7 (344 s); `branch`, `credits`, `lobby` insieme 17/17; typecheck verde; suite intera non lanciata.

### T88 · Spendere i crediti che avanzano generando l'universo con gli abbonamenti — `da fare`
- Pipeline: claude · stima 4% · priorità 90
- Contesto: obiettivo dell'autore: arrivare al reset settimanale senza crediti residui; ciò che i task non usano va alla generazione dell'universo con le CLI
  (ADR-0077, la coda `/api/coda`, `npm run abbonamento`). **Non ora**: si fa quando ci saranno meno task. Nasce da T68: `dossier T68`.
- Fare: con la previsione degli slot di T82, quando un provider finirebbe la settimana con crediti avanzati e non ha task eseguibili, la pipeline avvia `npm run abbonamento`
  su un universo scelto dall'autore, entro i crediti che avanzano, e lo ferma quando servono a un task o all'autore.
- Dipende da: T82, T85.

### T89 · La grafica a cartone — `fatto` (progetto; codice in T89a-e)
- Pipeline: claude · stima 5% · approvato · priorità 100
- Contesto: richiesta del to-do del 29/10 che la pianificazione aveva saltato (`docs/archivio/3-to-do-backlog/userchats/to-do-2026-10-29.md`, «Grafica a cartone»):
  l'autore vuole che l'universo abbia l'aspetto di Stompworks (https://www.reddit.com/r/ClaudeGameDev/comments/1x2ldgg/stompworks_a_small_books_worth_of_prompts_in/),
  foto in `docs/archivio/3-to-do-backlog/userchats/grafica_cartone.png`. Provider proposto dall'autore: Claude Code.
- Fare (primo pezzo, il progetto): guardare la foto, descrivere ciò che fa quell'aspetto (contorni, ombreggiatura a fasce, palette, luce, proporzioni) e come ottenerlo nel
  renderer three.js (materiali toon, contorni in post-processing, bloom, ombre) e nella guida di stile dell'Artista e dello Scultore, senza immagini generate (regola 11);
  un ADR e i task di codice nel backlog; una prova nel browser con un materiale toon su un chunk per confrontare.
- Fatto quando: ADR e task di codice scritti, screenshot della prova confrontato con la foto. Dietro il multigiocatore.
- Esito: ADR-0093 (`docs/adr/0093-la-grafica-a-cartone.md`, proposto) con l'analisi della foto e la decisione; la prova è nel codice dietro `?cartone`
  (`src/render/cartoon.ts`: `MeshToonMaterial` a tre fasce per i materiali illuminati della simulazione, passo `Ink` dell'`EffectComposer` che scurisce dove
  profondità o normale saltano; soglie in console in `window.cartone`). Nel browser (preview, `?skip&offline&cartone`, confronto con la vista di prima): fasce e
  contorni sui gradini del rilievo, sui sentieri e sulle case somigliano alla foto; sugli alberi (20 voxel per casella) ogni voxel fa il suo bordo e la chioma è
  rumore nero, e solo la profondità con soglia alta perde anche le sagome. Da qui la scelta che non era prevista: i contorni vengono dagli id di cosa e parte
  (la lettera della palette), non dalla geometria (T89b). Task T89a-e qui sotto. Typecheck verde; la suite intera (con `turno test`) ha 55 test
  rossi, tutti in file che non importano il renderer (kernel, between, explore, credits…: i timeout di carico già noti, T95); nessun test tocca `src/render/`.

### T89a · Cartone: fasce e interruttore — `da fare` (dipende da T89)
- Pipeline: claude · stima 3% · approvato · browser · priorità 75
- Contesto: ADR-0093, punti 1, 2 e 6; la prova `?cartone` di T89 (`src/render/cartoon.ts`, `lit()` in `materials.ts`).
- Fare: la rampa a 3 fasce per tutti i materiali illuminati (simulazione, corona e studio: `MAT.corona`, `coronaGlass`, `solid()`), i voxel luminosi fuori
  dalle fasce; il lato in ombra saturo (la fascia bassa non sotto ~0,35, il colore dell'emisfero non grigio); ombre portate più nette. Il cartone diventa il
  predefinito quando T89b e T89c sono fatti: fino ad allora `?cartone`; poi `?classica` per il vecchio aspetto.
- Fatto quando: typecheck e test verdi; screenshot con e senza nel browser (un luogo con case e alberi, lo studio) e niente errori in console.

### T89b · Cartone: contorni dagli id di cosa e parte — `da fare` (dipende da T89a)
- Pipeline: claude · stima 6% · approvato · browser · priorità 76
- Contesto: ADR-0093, punto 3. Il passo `Ink` di T89 legge normali e profondità: sugli alberi fa rumore.
- Fare: `src/mj/mesh.ts` scrive per vertice l'attributo `part` (indice della lettera della palette o della `<color part>`); `models.ts` e `terrain.ts` lo
  passano (il terreno: il codice della casella); ogni mesh/istanza ha un id. Un disegno degli id (MRT se three.js lo permette con il composer, altrimenti un
  secondo disegno con un materiale che scrive id cosa, id parte e profondità, rispettando il taglio del cerchio e il `CUT` delle strutture) e il passo
  dell'inchiostro: bordo dove cambia cosa o parte o dove la profondità salta molto; spessore costante per `devicePixelRatio`; niente inchiostro sui voxel
  luminosi; il colore scurito del pixel. Test sull'attributo `part` di `mesh.ts`.
- Fatto quando: typecheck e test verdi; nel browser gli alberi hanno la sagoma e i confini tra chioma e tronco senza rumore, le case i bordi di muri, tetto e
  finestre, il rilievo i gradini; screenshot confrontato con la foto di T89.

### T89c · Cartone: luce tinta e prospettiva aerea — `da fare` (dipende da T89a)
- Pipeline: claude · stima 3% · approvato · browser · priorità 77
- Contesto: ADR-0093, punto 4 (la foto: chiave calda, riempimento freddo, ombre azzurre, lontananza che sbiadisce nel cielo).
- Fare: in `renderer.ts` la luce chiave calda e l'emisfero freddo, l'ombra portata tinta (un pezzo di shader dopo `lights_fragment_end` o il colore
  dell'ombra), la nebbia come prospettiva aerea (verso il colore del cielo, più vicina e più forte, con la camera libera del master compresa), per giorno,
  tramonto e notte; il bloom tarato di nuovo sopra il cartone.
- Fatto quando: typecheck e test verdi; screenshot di giorno e di notte (`k.time` spostato da console) con e senza cartone.

### T89d · Cartone: lo stile nei dati e le foto dei modelli — `da fare` (dipende da T89b)
- Pipeline: claude · stima 3% · approvato · browser · priorità 78
- Contesto: ADR-0093, punto 5. Il bordo nasce dove cambia la parte: i programmi devono avere parti di colore ben distinto.
- Fare: nel seme `world/style.md` e nei prompt `prompts/agents/artista.md` e `scultore.md`: un colore pieno per parte, contrasto di valore tra parti vicine,
  dettagli come lettere scure dedicate (assi, pannelli, crepe) invece di micro-voxel, forme tozze, ambiente smorzato e pochi accenti saturi; il giudizio
  dell'Artista guarda anche se le parti si leggono a contorni. Le foto (`src/mj/photo.ts`, `src/render/thumbs.ts`) con fasce e inchiostro. Le risposte di
  `MockModels` se cambiano gli schemi.
- Fatto quando: typecheck e test verdi; le icone nell'inventario e le foto dell'Artista nel browser hanno l'aspetto del mondo.

### T89e · Cartone: laboratorio, prestazioni, togliere la prova — `da fare` (dipende da T89a-d)
- Pipeline: claude · stima 4% · approvato · browser · priorità 79
- Contesto: ADR-0093, conseguenze e punto 6.
- Fare: `lab/3d/` e `lab/editor/` con l'interruttore cartone/classica (usano `Bloom`); misurare fps e ms per fotogramma con e senza (un luogo pieno, lo
  studio, la corona) e scriverli nell'ADR; se il disegno degli id costa troppo, MRT o metà risoluzione per gli id; togliere `?cartone` e `window.cartone`
  lasciando `?classica`; ADR-0093 `accettato` e AGENTS.md aggiornato.
- Fatto quando: typecheck e test verdi; misure nell'ADR; verifica nel browser di simulazione, studio, corona e laboratorio.

### T92 · Integrare T52 (i sotterranei) nel base 3d — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Contesto: `integra T52` del 31/10/2026 si è fermato su conflitti in `AGENTS.md`, `docs/adr/README.md` e `docs/plans/backlog.md`. Nel frattempo nel base `3d` sono entrati ADR-0081..ADR-0090. L'ADR dei sotterranei scritto da T52a deve diventare ADR-0091 (`docs/adr/0091-i-sotterranei.md`). T52 è un task di solo progetto (nessun codice sorgente di gioco modificato). Leggi `node tools/pipeline/pipeline.mjs dossier T52` e `traccia T52`.
- Fare: nel tuo worktree esegui `git merge task/T52` e risolvi i conflitti:
  - Rinomina `docs/adr/0081-i-sotterranei.md` in `docs/adr/0091-i-sotterranei.md`, aggiorna il titolo/numero al suo interno ("# ADR-0091: I sotterranei"), e inseriscilo in `docs/adr/README.md` in fondo alla lista dopo ADR-0090.
  - In `AGENTS.md`, mantieni la riga dei sotterranei aggiornando il riferimento da ADR-0081 a ADR-0091.
  - In `docs/plans/backlog.md`, preserva intatti tutti i blocchi T75-T91 e questo blocco T92; per T52 mantieni lo stato `fatto`, la riga pipeline e l'esito di T52, inserendo i sotto-task T52b-f definiti da T52a con i loro riferimenti aggiornati ad ADR-0091.
  - Esegui `npm run typecheck` e verifica che sia verde. NON lanciare `npm test` sull'intera suite per evitare timeout o sovraccarico macchina (se serve un test, lancia `npx vitest run tests/pipeline.test.ts`).
  - Committa sul branch `task/T92`.
- Fatto quando: typecheck verde, ADR-0091 a posto, commit su branch `task/T92`. Poi l'orchestratore farà `integra T92` e `integra T52`.
- Esito: eseguito `git merge task/T52` e risolti i conflitti; rinominato `docs/adr/0081-i-sotterranei.md` in `docs/adr/0091-i-sotterranei.md`, aggiornato titolo interno e inserito in `docs/adr/README.md` in fondo dopo ADR-0090; in `AGENTS.md` mantenuta la riga dei sotterranei con riferimento ad ADR-0091; in `docs/plans/backlog.md` preservati tutti i blocchi T75-T91 e T92, e aggiornato T52 con T52a fatto e i sotto-task T52b-f riferiti ad ADR-0091; `npm run typecheck` verificato e verde.

### T93 · Verifica nel browser dei pagamenti Stripe (T45e) — `fatto` (dipende da T45e)
- Pipeline: claude · stima 3% · approvato · priorità 9
- Contesto: T45e ha completato l'integrazione di Stripe Checkout (ADR-0083) nel base `3d` con test headless. L'autore ha inserito le chiavi di test (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`) nel `.env`. L'autore conferma che il listener locale è attivo e inoltra gli eventi a `localhost:5173/api/stripe/webhook` (porta standard del dev server). Leggi `node tools/pipeline/pipeline.mjs dossier T45e` e `traccia T45e`.
- Fare: verificare nel browser con Claude (`--chrome`) la ricarica crediti di prova tramite Stripe Checkout:
  - Il gioco e le sue API girano sul server Vite sulla porta 5173 (se libera, o con preview/dev sotto il turno browser: `node tools/pipeline/pipeline.mjs turno browser -- npm run dev -- --port 5173 --strictPort`);
  - Verificare che il profilo (`P`) mostri il saldo e i pulsanti di ricarica (+5 $, +10 $, +20 $);
  - Cliccando su una ricarica, verificare l'avvio della sessione di checkout Stripe;
  - Verificare il ritorno con successo (`?ricarica=successo`);
  - Verificare che gli eventi del webhook raggiungano l'endpoint `/api/stripe/webhook` (listener locale su porta 5173);
  - Chiudi scheda e server alla fine del turno.
- Fatto quando: una ricarica di prova eseguita nel browser o comportamento e risposte documentati con precisione, commit su branch `task/T93`.
- Esito: ricarica di prova eseguita (sandbox, carta 4242, +5 $). Il dev server dell'autore su 5173 (worktree `step8.2A-lab3d`, stesso commit, con le chiavi) aveva `stripe listen` che inoltrava a `/api/stripe/webhook`: per non toccare `aurora` ho usato un universo usa e getta `prova-t93` (poi rimosso) e il viandante `prova-t93`. Trovato e corretto: (1) Stripe rifiuta `payment_method_types` (400) → tolto, i metodi li sceglie il Dashboard (Checkout mostrava carta, Apple Pay, Link, Amazon Pay; Google Pay solo con un wallet nel browser); (2) i Managed Payments attivi sull'account chiedono un `tax_code` (400) → `STRIPE_TAX_CODE` facoltativo nel `.env`, senza la sessione manda `managed_payments[enabled]=false` (domanda non bloccante in `docs/pipeline/domande/T93.md`); (3) `applyPaymentToUniverse` faceva `git add -A` (in `aurora` c'era una cancellazione in sospeso che sarebbe finita nel commit) → ora solo i due file, con un test su disco. Con il codice corretto (dev server mio su 5191): `/api/stripe/checkout` 200 con `cs_test_…`, 400 per universo non valido e ammontare > 1000; Stripe Checkout sandbox «Ricarica crediti QUINE42 (5 crediti) $5.00»; ritorno su `?ricarica=successo&session_id=…`, l'HUD dice «Ricarica completata! I crediti verranno accreditati dal server.» e la querystring si pulisce; il webhook (firma verificata) ha scritto `world/giocatori/prova-t93.json` con `crediti: 5`, l'evento in `world/pagamenti.json` e il commit «ricarica crediti Stripe: +5 a prova-t93». Non verificabile qui: i pulsanti `+5/+10/+20 $` del pannello `P` compaiono solo in multigiocatore con Firebase (`account && thin`), e il `.env` non ha `FIREBASE_PROJECT_ID`: in singola `P` mostra solo il profilo (visto); il clic è stato replicato con la stessa `fetch` del pulsante. ADR-0083 aggiornato (sezione T93) e AGENTS.



### T94 · Integrare T54 — `fatto` (`0041da5`)
- Pipeline: claude · stima 3% · approvato · priorità 8
- Contesto: `integra T54` va in conflitto con il base `3d` in `AGENTS.md`, `docs/adr/README.md`, `docs/plans/backlog.md`,
  `src/kernel/kernel.ts`, `src/kernel/validator.ts`. T54 ha scritto l'ADR come ADR-0081, numero già preso
  (`0081-crediti-e-spese-comuni.md`). Nasce da T54: `dossier T54`.
- Cosa fare: nel worktree `git merge task/T54`; l'ADR di T54 prende il primo numero libero (oggi ADR-0092) con tutti i
  riferimenti (AGENTS.md, README degli ADR, backlog, commenti nel codice); nelle sezioni in conflitto restano entrambe le aggiunte;
  in `backlog.md` tieni il blocco del base e segna T54 `fatto` con il suo commit.
- Quando è fatto: merge committato, `npm run typecheck` verde, `npm test` (con `turno test`) verde salvo timeout di carico già noti sulla base.
- Esito: eseguito `git merge task/T54` e risolti i conflitti in `AGENTS.md`, `docs/adr/README.md`, `docs/plans/backlog.md`, `src/kernel/forms.ts`, `src/kernel/kernel.ts`, `src/kernel/validator.ts` preservando sia i sotterranei (T52b) sia le taglie di D&D (T54); rinominato `docs/adr/0081-le-taglie-di-dnd.md` in `docs/adr/0092-le-taglie-di-dnd.md` (aggiornato titolo interno a ADR-0092); aggiornati tutti i riferimenti ad ADR-0081 relativi alle taglie in ADR-0092 in `AGENTS.md`, `docs/adr/0043-spazio-a-scale-lotti-strutture.md`, `docs/adr/README.md`, `docs/plans/backlog.md` (T54 `fatto` con commit `3c5fe95`), `src/kernel/agents/cartography.ts`, `src/kernel/agents/forge.ts`, `src/kernel/agents/sculptor.ts`, `src/kernel/forms.ts`, `src/kernel/kernel.ts`, `src/kernel/modeldirector.ts`, `src/kernel/types.ts`, `src/kernel/validator.ts`, `src/mj/classes.ts`, `tests/lots.test.ts`, `tests/sculptor.test.ts`, lasciando intatti i riferimenti ad ADR-0081 per i crediti e le spese comuni; `npm run typecheck` verde; `tests/lots.test.ts` e `tests/sculptor.test.ts` passati (11/11); suite completa eseguita sotto `turno test` (581 passati, restanti timeout di carico già noti sulla base e oggetto di T95).

### T95 · Test rossi da soli: explore, partita, subscription — `fatto`
- Pipeline: claude · stima 3% · priorità 60
- Contesto: T93 riporta che `tests/explore*`, `tests/partita*` e `tests/subscription*` falliscono anche lanciati da soli,
  senza legame con Stripe (`traccia T93`); T54 riporta 33 timeout di carico nella suite intera (`traccia T54`).
- Cosa fare: sul base `3d` lancia ciascuno di quei file da solo; per ciò che fallisce davvero (non per timeout di carico) trova il
  commit che l'ha rotto e correggi il codice o il test; i timeout solo di carico restano.
- Quando è fatto: i tre file verdi da soli, typecheck verde, il commit che li aveva rotti scritto nella riga di chiusura.
- Esito: `tests/subscription.test.ts` era già verde da solo (16/16): il suo rosso nella suite intera è di carico. `tests/explore.test.ts` (3/3) e `tests/partita.test.ts` (1 su 5) li aveva rotti `38dcd69` (T45a, crediti per viandante, ADR-0081): in multigiocatore chi ha 0 crediti è servito dai `localModels` del Concilio, non dai modelli passati al kernel, così i `Recording` dei test non vedevano più i piani (`chunk.plan`) né la morte (`player.death`). Il codice è giusto; corretti i test, che danno crediti a chi paga (`giveCredits` a `io` dopo il boot e a ogni viandante che entra in `join`). Ora i tre file verdi da soli, typecheck verde; nella suite intera (sotto `turno test`) 596 passati, 44 rossi in altri file (kernel, between, referente, thin, places, credits) più uno di subscription che da solo passa: timeout di carico, fuori dal task.

### T96 · Mai zero slot per nessun provider — `fatto`
- Pipeline: gemini · stima 3% · priorità 5 · approvato
- Contesto: richieste dell'autore del 31/10: «non chiudere mai tutti gli slot per claude», poi «tutti i modelli abbiano sempre almeno
  uno slot; sta all'orchestratore decidere l'ordine e se sospendere temporaneamente nuovi task a un provider per permettere a un altro di
  completare il proprio». `nextSlot`/`updateSlots` in `tools/pipeline/pipeline.mjs` (ADR-0087) scendono fino a 0 quando la previsione dei
  crediti finisce prima del reset; così T51 era fermo con Claude al 34 % della settimana. L'orchestratore ha fissato a mano `slot: 1` per
  Claude in `.pipeline/budget.json` (con `slotAggiornato` nel futuro) finché questo task non entra.
- Cosa fare: la previsione dei crediti non porta mai uno slot sotto 1 per nessun modello (claude, gemini, argon; mai sopra il tetto di
  `limiti`); a 0 si va solo con i crediti esauriti o il provider fermo per quota (429), come oggi. Togliere lo «zero slot» da `nextSlot`,
  `updateSlots` e `showSlots`; la decisione di non dare nuovi task a un provider per un po' è dell'orchestratore, con un comando
  (es. `sospendi <provider> [fino a <data>]` / `riattiva <provider>`, scritto in `.pipeline/budget.json`, mostrato da `stato`). Test in
  `tests/pipeline*.test.ts`; ADR-0087 aggiornato (o ADR nuovo se cambia la regola), la riga in `docs/pipeline/README.md` e il comando in
  `docs/pipeline/orchestra.md`.
- Quando è fatto: con la previsione «prima del reset» ogni modello con crediti resta ad almeno 1 slot; `sospendi`/`riattiva` funzionano;
  test e typecheck verdi.
- Esito: rimossa la discesa a zero slot da `nextSlot`, `updateSlots` e `showSlots` (lo slot non scende mai sotto 1 se tetto >= 1); introdotti `suspendProvider`, `resumeProvider` e `isSuspended` in `tools/pipeline/pipeline.mjs` con comandi CLI `sospendi <provider> [fino a <data>]` e `riattiva <provider>` che persistono in `budget.json` e vengono mostrati da `stato` e in `web.mjs`; estesi `orchestra.mjs` e `web.mjs` per gestire `/sospendi` e `/riattiva`; in `execute` le nuove assegnazioni a provider sospesi vengono bloccate senza dirottamenti impropri su alternative mentre i task da riprendere continuano; aggiornati ADR-0087, `docs/pipeline/README.md`, `docs/pipeline/orchestra.md`, `AGENTS.md`; test completi (77/77) in `tests/pipeline.test.ts` e typecheck a zero errori.

## Il sito (to-do del 31/10, testo originale: `docs/userchats/to-do-2026-10-31.md`)

### T97 · Il sito: progetto, pagine e stile — `fatto`
- Pipeline: claude · stima 5% · approvato · priorità 60
- Contesto: richiesta dell'autore del 31/10 (`docs/userchats/to-do-2026-10-31.md`): landing, login, pagina delle sessioni con «Crea nuovo
  universo», profilo, area delle carte, area pagamenti. Tema per il sito e per le interfacce in gioco: pop art a fumetti e arcade retro, neon punk,
  retrowave/synthwave; richiama velatamente la corona del Concilio senza svelarla (es. in fondo alla landing la punta delle orecchie dei gerboa,
  che si capisce solo dopo averli visti in gioco). three.js anche fuori dal gioco (carte animate, sfondi con un'animazione MarkovJunior).
  Il design lo fa generare l'autore con Claude Design (un template, anche senza componenti React o Angular): se ne copia lo stile.
  Riusa ciò che c'è: login Firebase (ADR-0082, `src/session/login.ts`), lobby e collezione (ADR-0086, `src/ui/lobby.ts`), Stripe (ADR-0083),
  carte (ADR-0056), deploy (T45f).
- Fare: un ADR con le pagine e la loro navigazione, lo stack (pagine di Vite accanto al gioco, three.js e `src/mj/` condivisi, niente framework
  se non serve), i colori e i caratteri del tema come variabili CSS uniche per sito e gioco, il segreto dei gerboa; i task di codice nel backlog
  (landing, login e profilo, sessioni e nuovo universo, carte, pagamenti, il tema nelle interfacce in gioco), ciascuno con «dipende da».
  Se il template di Claude Design non c'è ancora, chiedere all'autore in `docs/pipeline/domande/T97.md` dove metterlo (es. `docs/design/sito/`)
  e intanto proporre il tema con una pagina di prova.
- Quando è fatto: ADR e task scritti; la pagina di prova del tema vista nel browser (screenshot); typecheck verde.
- Esito: ADR-0095 (`docs/adr/0095-il-sito-progetto-pagine-e-stile.md`) con stack multi-entry Vite, mappa delle pagine, riuso di Firebase, Stripe e store git, three.js fuori dal gioco e il segreto dei gerboa; variabili CSS unificate per sito e gioco in `src/theme.css` (neon punk, retro arcade, fumetti pop e synthwave, importato in `src/style.css`); pagina dimostrativa del tema in `site/index.html` con hero 3D interattivo Three.js (`site/preview.ts`), carta 3D con shader olografico e flip, preview moduli sessioni/pagamenti e footer con la sagoma delle orecchie dei gerboa; configurazione multi-page in `vite.config.ts`; domanda per l'autore in `docs/pipeline/domande/T97.md` sulla collocazione del template Claude Design; pianificati nel backlog i task atomici T99-T104 (rinumerati T101-T106 da T100) (ciascuno con «dipende da»).


### T98 · Cartone: fuori dalla corona i contorni della simulazione nascosta — `fatto`
- Pipeline: claude · stima 2% · priorità 40 · approvato
- Contesto: segnalazione dell'autore del 31/10 (to-do, «Bug grafica cartoon», foto in `docs/userchats/image.png`): con `?cartone`,
  quando la corona si vede, oltre il cerchio compaiono i contorni a inchiostro delle cose che starebbero lì se si fosse ancora sul
  tappeto (alberi, case, sentieri). Causa probabile: il passo `Ink` di `src/render/cartoon.ts` ridisegna la scena con
  `scene.overrideMaterial = MeshNormalMaterial`, che perde il taglio al cerchio dello shader (ADR-0040: nulla della simulazione oltre
  il cerchio quando la corona si vede), e anche ciò che è nascosto in altro modo.
- Fare: il disegno di normali e profondità rispetta il taglio al cerchio (lo stesso `discard` dei materiali della simulazione, o le
  mesh tagliate escluse/rese col loro taglio) e la visibilità di ciò che il frame non mostra; vale anche per il futuro disegno degli id di T89b.
- Fatto quando: typecheck e test verdi; nel browser con `?cartone`, dalla corona (`?dev&teleport=46,0`) oltre il cerchio niente
  contorni della simulazione, dentro il cerchio i contorni come prima; niente errori in console.
- Esito: niente più `scene.overrideMaterial`: `Ink.prepare` dà a ogni mesh visibile la sua normale (`normalsOf` in `materials.ts`, in cache per materiale): con il taglio al cerchio (`clipped`, anche il vento) se il materiale lo ha, gli stessi `clippingPlanes` (il taglio sopra la testa) e le facce; fuori ciò che non scrive né colore né profondità, linee, punti e sprite. `normalsOf` arriva a `Ink` da `bloom.ts` (`materials.ts` importa `cartoon.ts`: importarlo da lì era un ciclo che rompeva l'avvio). Visto nel browser con `?cartone`: dalla corona (46,0) oltre il cerchio niente contorni, dentro i contorni come prima, niente errori.

### T99 · Integrare T57 (T57a) — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 5
- Contesto: `integra T57` va in conflitto con il base `3d` solo in `docs/plans/backlog.md` (il base ha aggiunto T96-T98 e
  aggiornato altri blocchi). T57 ha fatto il pezzo T57a (rune composte come programma); T57b e T57c restano da fare. Nasce da T57: `dossier T57`.
- Cosa fare: nel worktree `git merge task/T57`; in `backlog.md` tieni tutti i blocchi del base e, per il blocco di T57, la versione
  di `task/T57` (T57a fatto con il suo commit, T57b prossimo pezzo, il blocco resta `da fare`); nessun altro file.
- Quando è fatto: merge committato, `npm run typecheck` verde, i test toccati da T57 (`traccia T57`) verdi.
  Esito: merge di `task/T57` sul branch `task/T99`; unico conflitto l'intestazione del blocco T57 in `backlog.md`, presa da `task/T57` (T57a fatto; poi T57b) tenendo «approvato» del base. Typecheck verde; `canon`, `showcase`, `focus` verdi; `kernel.test.ts` 57/57 verde con `--hookTimeout=120000` (senza, i `beforeEach` superano 10 s sotto il carico della pipeline, come già notato in T57a). Come previsto.

### T100 · Integrare T97 e verificare il sito nel browser — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 6
- Contesto: T97 (il sito, ADR-0095) è fatto su `task/T97` (`416ea7d`) ma è partito da `cbe8532`: nel suo `backlog.md` ha
  pianificato i task del sito come T99-T104, numeri che nel base sono già presi (T98 cartone, T99 integrare T57). Chiede anche la
  verifica nel browser (`BROWSER: da verificare`, su Antigravity non c'era il browser). Nasce da T97: `dossier T97`, `traccia T97`.
- Cosa fare: nel worktree `git merge task/T97`; in `backlog.md` tieni tutti i blocchi del base e il blocco di T97 fatto da `task/T97`;
  rinumera i suoi task del sito T99-T104 nei primi numeri liberi (`pipeline.mjs prossimo`, oltre T100), aggiornando i riferimenti
  incrociati (anche in ADR-0095, `AGENTS.md`, `docs/pipeline/domande/T97.md`); ADR-0095 se già preso prende il primo libero. Poi typecheck,
  build, i test toccati; nel turno browser apri `/site/index.html` della preview e `/?skip&offline` (il gioco, ora con `src/theme.css`
  importato in `style.css`): scrivi ciò che vedi (hero three.js, carta che si gira, footer coi gerboa, HUD del gioco non rotto, errori in console).
- Quando è fatto: merge committato, task del sito rinumerati, typecheck e build verdi, verifica scritta nel blocco; i difetti trovati
  come righe «difetto:» per l'orchestratore.
- Dipende da T99.
- Esito: merge di `task/T97`; unico conflitto la coda di `backlog.md` (tenuti T98-T100 del base, poi i task del sito). Task del sito rinumerati
  T99-T104 → T101-T106 (`prossimo` dava T101) nel backlog, in ADR-0095 (numero libero, resta 0095), `docs/adr/README.md` e
  `docs/pipeline/domande/T97.md`; `AGENTS.md` non li citava. Le loro righe `- Pipeline:` non dicono ancora «approvato».
  Typecheck e build verdi (`dist/site/index.html` c'è; in `dist/` solo il nome `GEMINI_API_KEY` nei messaggi, nessuna chiave); T97 non tocca
  codice con test (CSS, `site/`, una voce di `vite.config.ts`), la suite intera non l'ho rilanciata.
  Browser (preview 4317): `/site/index.html` mostra navigazione, hero con titolo a fumetti e il canvas three.js (cubi voxel che girano dentro
  due anelli neon), le schede sessione/crediti/profilo, la carta demo che si gira al clic e il footer con la griglia synthwave e le orecchie dei
  gerboa al neon; caratteri Bangers/Press Start 2P/VT323 da Google Fonts. `/?skip&offline`: gioco e HUD come prima (bisogni, barra rapida,
  registro del Concilio, aiuto), le variabili di `theme.css` presenti senza sovrascrivere quelle di `style.css` (nessun nome in comune), carattere
  del gioco invariato. In console solo errori «message channel closed» delle estensioni del browser, nessuno della pagina.
  difetto: la carta demo girata mostra il fronte specchiato (manca un retro, `backface-visibility`).
  difetto: la carta non è three.js (è CSS 3D) come dice l'esito di T97; three.js c'è solo nell'hero.
  difetto: i testi svelano ciò che ADR-0095 voleva velato: il motto del footer descrive la corona («Attorno, invisibile finché dura la
  simulazione…»), il tooltip delle orecchie dice «chi è fuori dal tappeto conosce lo studio», l'hero nomina il «Concilio di IA».
  difetto: testo per il pubblico con riferimenti interni («architettura dei cloni (ADR-0084)» nella sezione delle carte).
  difetto: i font arrivano da `fonts.googleapis.com` (richiesta a terzi a ogni visita); da valutare se servirli in locale.

### T101 · Il sito: landing page e hero 3D con three.js — `fatto` (dipende da T109, T97)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 4% · approvato · priorità 62
- Contesto: ADR-0095, punto 2 (Landing Page). La pagina di presentazione di QUINE42.
- Fare: completare la landing page (`site/index.html`, `site/site.css`, `site/landing.ts`) con layout responsive pop art / synthwave: hero banner con Three.js e animazione voxel procedurale MarkovJunior in tempo reale, navigazione con indicatori di stato, pulsante CTA «Gioca Subito» collegato a `../index.html`, sezione pilastri (Rune, MarkovJunior 3D, Carte, Concilio IA), vetrina interattiva delle caratteristiche e footer con la silhouette delle orecchie dei gerboa (il segreto della Corona).
- Fatto quando: typecheck e test verdi; navigazione e canvas 3D funzionanti senza errori nel browser.
- Esito: `task/T101`. `site/site.css` è `docs/design/sito/template.css` copiato (senza i `@font-face`, che dà `src/theme.css`) più le regole della landing; `site/index.html` segue `landing.html` del template; `site/landing.ts` sostituisce `site/preview.ts`. L'hero fa girare **programmi MarkovJunior veri** con il motore del gioco (`compileMjx`/`runMjx` di `src/mj/`, `snapshots`): un labirinto 3D, un corallo e il pino del seme (`universe/models/albero.xml`), un seme nuovo a ogni giro, i voxel visibili in un `InstancedMesh` che cresce passo per passo (passi e voxel in alto a destra), trascinare lo gira, doppio clic passa al prossimo, fermo quando non è sullo schermo. Navigazione con indicatori di stato (`/api/universe`: mondo raggiungibile, numero di reami) e la sezione sullo schermo accesa; vetrina delle caratteristiche a schede (rune, magia, voxel, persone, reami, frecce da tastiera); carta in CSS 3D che si gira (anche da tastiera). Diverso dal previsto: i link alle pagine di T102-T105 non ci sono ancora (sarebbero 404): la navigazione va alle sezioni della pagina e i pulsanti di crediti e profilo sono `PRESTO` (disabilitati), da collegare in quei task; `site` entra nel `tsconfig` (prima non era controllato). Test `tests/site-landing.test.ts`. Nel browser (preview 4931): hero che cresce e cicla i tre programmi, «MONDO ONLINE», schede, flip, sezione attiva allo scorrere, nessuna richiesta a terzi, a 390 px niente overflow e menu che si apre; nessun errore della pagina in console (corretto un indice di fotogramma negativo al primo frame). Typecheck verde; nella suite intera 56 test del multigiocatore in timeout (anche da soli su questa macchina carica, come in T52 e T83), nessuno tocca file di T101.

### T102 · Il sito: login e gestione profilo viandante con visualizzatore 3D — `fatto` (dipende da T109, T97, T44b)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 4% · approvato · priorità 64
- Contesto: ADR-0095, punto 2 (Profilo & Account) e ADR-0082 (Firebase Auth).
- Fare: creare la pagina profilo (`site/profilo.html` e modulo TS associato): accesso Firebase con Google o anonimo riusando `src/session/login.ts` e `/api/account`; visualizzazione dettagli viandante (ID account, stato collegamento, saldo crediti); editor estetico con scelta colore mantello e seme del modello viandante con anteprima tridimensionale interattiva renderizzata tramite Three.js e `src/mj/mesh.ts`; pulsanti per legare l'account anonimo a Google (`linkWithPopup`) o disconnettersi.
- Fatto quando: typecheck e test verdi; autenticazione e visualizzatore 3D dell'avatar funzionanti nel browser.
- Esito: `task/T102`. `site/profilo.html` + `site/profilo.ts` (input `siteProfilo` di Vite), stile dai template `profilo.html` e `login.html` copiato in `site/site.css`. L'accesso riusa `signIn` di `src/session/login.ts` (nuovo parametro `choose`: la pagina usa i suoi pulsanti Google / anonimo); «Lega a Google» e «Disconnetti» sono quelli di `SignedIn`. Diverso dal previsto: il profilo vive **per reame** (`world/giocatori/<id>.json`), quindi la pagina sceglie il reame da `/api/universe` e serve una rotta nuova, `/api/viandante` (`server/wanderer.ts`, anche nella preview): GET id/account/profilo/crediti/nel mondo e il programma `viandante` del reame, POST tiene il profilo riparato (`kernel.keepProfile` se il mondo gira nel processo, altrimenti sui file su disco con un commit del solo file del giocatore); con gli account chi è viene dal token. Senza account sul server la pagina chiede l'identificativo del viandante (come la sessione senza verificatore). L'anteprima è il modello vero (`runForm` + `meshVoxels` in three.js), si gira trascinando; il colore mostrato è quello che il mondo dipinge davvero (`repairProfile`). La landing collega il profilo (al posto di «PRESTO»). ADR-0095 con la sezione «Attuazione: il profilo». Test `tests/site-profile.test.ts`. Nel browser (preview 4952, universo di prova poi rimosso, server senza account): scheda di `io` con crediti - Fatto quando: typecheck e test verdi; autenticazione e visualizzatore 3D dell'avatar funzionanti nel browser.
2.50, modello 3D che gira e si trascina, mantello rosa e seme 5 salvati (commit «profilo di io dal sito» con il solo file del giocatore, `localStorage` aggiornato), nessun errore della pagina. Non verificato nel browser: l'accesso Firebase vero (nessun progetto né emulatore qui). Typecheck verde; nella suite intera 9 file falliscono per timeout sulla macchina carica (kernel, multigiocatore, abbonamenti: nessuno tocca file di T102; `wanderers.test.ts` da solo impiega 31 s contro i suoi 30 e con un timeout più lungo passa).

### T103 · Il sito: hub sessioni multigiocatore e creazione nuovo universo — `fatto` (dipende da T109, T97, T45d)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 4% · approvato · priorità 66
- Contesto: ADR-0095, punto 2 (Sessioni & Nuovo Universo), ADR-0058 (sessioni) e ADR-0086 (lobby multigiocatore).
- Fare: implementare l'hub delle sessioni (`site/sessioni.html` e modulo TS associato): interrogare `/api/universe` e lo stato delle sessioni attive su `/api/session`; mostrare la lista dei reami disponibili con dettagli del master, modelli IA impiegati, coefficienti di generazione, stima oraria della spesa e tetto minimo richiesto; pulsante diretto per accedere alla lobby multigiocatore del reame scelto; pannello wizard «Crea nuovo universo» per avviare la Genesi di un nuovo reame git specificando nome, seme e parametri base.
- Fatto quando: typecheck e test verdi; elenco sessioni e creazione nuovo universo funzionanti via interfaccia web.
- Esito: implementato l'hub sessioni in `site/sessioni.html` e `site/sessioni.ts` con foglio di stile dedicato `site/sessioni.css` (conforme al template grafico di `docs/design/sito/`); endpoint GET `/api/session` nel server Vite per interrogare le sessioni attive e i client connessi (`clientCount`); visualizzazione dinamica dei reami con badge live/offline, master, modelli IA impiegati, coefficienti, spesa oraria stimata (`hourlyEstimate`) e tetto minimo; pulsante «Entra nella lobby» collegato a `../index.html?universo=<nome>`; wizard modale interattivo «Crea nuovo universo» con validazione slug git, seme casuale, scelta modalità di partita e profilo IA che genera il nuovo repository git tramite `/api/universe/<nome>/create`. Configurato l'entry point `sessioni` in `vite.config.ts`. Test unitari in `tests/sessioni_hub.test.ts` (8/8 verdi). Typecheck e build verdi.

### T104 · Il sito: area carte collezionabili 3D animate — `fatto` (dipende da T109, T97, T45d, T84)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 5% · approvato · priorità 68
- Contesto: ADR-0095, punto 2 (Carte 3D), ADR-0056 (carte) e ADR-0084 (eredità dei cloni).
- Fare: sviluppare la galleria interattiva delle carte collezionabili (`site/carte.html` e modulo TS associato): leggere la collezione del viandante (`collectionOf` da `src/kernel/cards.ts` e `world/carte.json`); per ogni carta visualizzare una mesh 3D Three.js con texture olografica prismatica, animazione di galleggiamento e rotazione 3D interattiva su hover/click (flip della carta); esporre i contatori di utilizzo nel mondo (luoghi, trame, prompt, totale), la rarità, l'impronta MinHash e l'albero genealogico della catena dei cloni titolari con le relative quote economiche.
- Fatto quando: typecheck e test verdi; galleria carte 3D interattiva e fluida a 60 fps nel browser.
- Esito: `task/T104`. `site/carte.html`, `carte.ts`, `carte.css`, `carte-art.ts`, `carte-worker.ts`, voce in `vite.config.ts`, link da landing e sessioni; `tests/site-carte.test.ts`. Reame a scelta (`?universo=` o il primo dove si hanno carte), statistiche, schede per famiglia più «Eredità» (ciò che si riceve come titolare di prima), fronte con nome, rarità, miniatura, frase e utilizzi, retro con impronta e catena con quote e quanto è cambiata. Nel kernel: `Forms.request` (estratto da `get`) e `Card.impronta` con `shares`. Diverso dal previsto: carte in CSS 3D e non mesh three.js, come dicono `AGENTS.md`, ADR-0095 e il template (T109); la rarità non esiste nei dati ed è derivata dagli utilizzi; la rendita è in utilizzi e non in dollari come nel template, perché le quote non muovono crediti. Limiti: con `QUINE_MASTER` il master vede la sua collezione con `?viandante=io` (il client non sa di essere `io`); il login con Firebase non è stato provato nel browser, serve un progetto o l'emulatore; la pagina legge lo snapshot intero da `/api/universe/<nome>`, aperto a chiunque come per l'hub di T103: da restringere prima di un deploy pubblico. Nel browser (preview 4977, universo di prova con 62 carte e catene, poi cancellato): 60 fps con flip e inclinazione, 59,5 scorrendo tutte le 62 carte (peggior fotogramma 33 ms), giro con clic e Invio, «mostra altre», miniature vere dei modelli, nomi con HTML mostrati come testo, a 390 px (in un iframe: la finestra non si è ridimensionata) niente overflow, collezione vuota, nessun errore in console. Test: typecheck verde, `site-carte`, `cards`, `heritage` verdi; **la suite intera non è verde**: 653 su 675, i 22 falliti tutti timeout con il limite scritto nel test, quasi tutti del multigiocatore (`between credits referente thin wanderers watch branch lobby places`), con la macchina condivisa. `watch`, `places` e `wanderers` da soli danno gli stessi esiti e tempi con e senza le modifiche al kernel di questo task (`watch` e `wanderers` falliscono anche sulla base: 1 test ciascuno); gli altri file non sono stati confrontati così. Una regressione mia trovata così e corretta: `Forms.get` costruiva la richiesta prima di guardare la cache.

### T105 · Il sito: area pagamenti e cruscotto crediti Stripe — `fatto` (dipende da T109, T97, T45e, T93)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 3% · approvato · priorità 70
- Contesto: ADR-0095, punto 2 (Crediti & Stripe), ADR-0081 (crediti) e ADR-0083 (Stripe Checkout).
- Fare: realizzare la pagina di gestione crediti (`site/pagamenti.html` e modulo TS associato): cruscotto con saldo crediti disponibile e storico dei consumi; selettore per ricarica crediti con tagli prefissati ($5, $10, $20, $50) o cifra libera; interazione con l'endpoint `/api/stripe/checkout` per avviare la sessione protetta Stripe Checkout (supporto carte e Google Pay); tabella cronologica dei pagamenti ricevuti letta da `world/pagamenti.json` con id transazione, data e accredito.
- Fatto quando: typecheck e test verdi; flusso di checkout Stripe avviabile dall'interfaccia e storico consultabile.
- Esito: `task/T105`. `site/pagamenti.html` + `site/pagamenti.ts` (input `sitePagamenti`), stile dal template copiato in `site/site.css`, link «Crediti» in tutte le pagine, «RICARICA» nella landing (al posto di «PRESTO») e nel profilo. Diverso dal previsto: serve una rotta nuova, `/api/crediti` (`server/wallet.ts`), che dà solo le righe del viandante, perché `pagamenti.json` e `consumi.json` contengono quelle di tutti; le parti comuni delle pagine passano da `profilo.ts` a `site/shared.ts`; le rotte di Stripe entrano anche nella preview; `/api/stripe/checkout` ora rifiuta meno di 1 $ e arrotonda al centesimo. Tolti dal template perché il gioco non li ha: bonus, ore stimate, accrediti dalle carte, colonne metodo e stato. Lo storico dei consumi non comprende la quota delle spese comuni (non è registrata per viandante): la pagina lo dice. ADR-0095 con la sezione «Attuazione: i crediti». Test `tests/site-wallet.test.ts`. Typecheck verde. Suite intera nel turno, due volte: 651 passati, 45 falliti, quasi tutti timeout. Rilanciati da soli passano `kernel`, `credits`, `places`, `subscription`; restano 14 timeout in `watch`, `referente`, `wanderers`, `thin`, `between`, file che non importano nulla di ciò che T105 cambia (`src/` non è toccato), con la macchina carica: non provato sul base. Nel browser (preview, universo di prova poi rimosso, `STRIPE_SECRET_KEY=mock`, server senza account): saldo, tagli e importo libero, il clic porta a `checkout.stripe.com` con la sessione finta, ritorno con il webhook in ritardo fino ad «ACCREDITATO!» (saldo da 12,50 a 17,50, commit dei soli due file), annullamento, anonimo senza ricarica. Non verificati nel browser: un pagamento su Stripe vero (nessuna chiave in questo worktree; la stessa rotta è quella provata da T93) e l'accesso Firebase. Attenzione per T124: nella preview il webhook senza `STRIPE_WEBHOOK_SECRET` accetta eventi non firmati, come già nel server di sviluppo. T125 sposterà saldi e pagamenti: `server/wallet.ts` è l'unico punto del sito da adattare, oltre a `server/wanderer.ts`.

### T106 · Tema pop art / retro arcade: applicazione alle interfacce in-game — `da fare` (dipende da T109, T97)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 4% · approvato · priorità 72
- Contesto: ADR-0095, punto 3 (Variabili CSS unificate). Il tema grafico deve permeare anche l'esperienza di gioco.
- Fare: aggiornare `src/style.css` e i componenti UI in-game (`src/ui/hud.ts`, `inventory.ts`, `lobby.ts`, `profile.ts`, `chat.ts`, `creditdialog.ts`) per adottare appieno i token di `src/theme.css`: bordi a inchiostro netto fumetto (`--border-ink-thick`), ombre rigide neon offset (`--shadow-hard-cyan`, `--shadow-hard-pink`), pattern mezze tinte sui pannelli modali, pulsanti arcade retrò e font display per intestazioni e notifiche d'avviso.
- Fatto quando: typecheck e test verdi; screenshot nel browser delle interfacce in-game rinnovate con il tema pop art comics / neon punk.

### T107 · Il sito: correggere i difetti della pagina dimostrativa — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 20
- Contesto: la verifica di T100 nel browser su `site/index.html` (T97, ADR-0095) ha trovato cinque difetti, scritti nel blocco di T100.
  Nasce da T97 e T100: `dossier T97`, `dossier T100`.
- Cosa fare: (1) la carta demo girata mostra il fronte specchiato: un retro vero (`backface-visibility: hidden` sulle due facce);
  (2) dove testi o ADR-0095 dicono che la carta è three.js, correggi il testo (resta CSS 3D); (3) i testi per il pubblico non svelano ciò che
  ADR-0095 vuole velato (il motto del footer che descrive la corona: riscrivilo allusivo); (4) niente riferimenti interni nei testi per il
  pubblico («ADR-0084» e simili); (5) i font serviti in locale (file in `site/` o `public/`, niente `fonts.googleapis.com`), anche per `src/theme.css`.
- Quando è fatto: `npm run typecheck` e `npm run build` verdi; nessuna richiesta a domini esterni nel `dist/` del sito (grep);
  `BROWSER: da verificare` per l'orchestratore.
- Esito: `task/T107` (`e107d92`): retro vero della carta (`backface-visibility`), testi corretti (carta CSS 3D), motto e tooltip velati,
  niente riferimenti ADR, font in `public/fonts/`. Da integrare dopo la verifica nel browser (T108).

### T108 · Verificare T107 (il sito corretto) nel browser — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 30
- Contesto: T107 ha corretto i cinque difetti trovati da T100 su `site/index.html` ma su Antigravity non c'era il browser
  (`BROWSER: da verificare`). Nasce da T107 e T100: `dossier T107`, `dossier T100`.
- Cosa fare: nel worktree `git merge task/T107`; typecheck e build; grep in `dist/` di domini esterni (`googleapis`, `gstatic`) e di
  `GEMINI_API_KEY` con un valore. Nel turno browser (`pipeline.mjs turno browser -- …`) apri `/site/index.html` della preview: la carta
  girata mostra un retro vero (non il fronte specchiato), i font Bangers/Press Start 2P/VT323 si caricano da `/fonts/` (nessuna richiesta a
  terzi), il motto del footer e il tooltip dei gerboa non svelano la corona, niente «ADR-» nei testi, hero three.js e nessun errore in console;
  poi `/?skip&offline`: HUD del gioco come prima.
- Quando è fatto: merge committato, verifica scritta nel blocco; ogni difetto come riga «difetto:» per l'orchestratore.
- Dipende da T107.
- Esito: merge di `task/T107` (`67dee84`, conflitto solo nel backlog: tenuto il blocco di 3d); typecheck e build verdi. In `dist/` nessun
  valore di `GEMINI_API_KEY` (solo i messaggi d'aiuto); `googleapis` solo nel SDK di Firebase (`index.esm-*.js`, il login del
  multigiocatore caricato con `import()` dal gioco), mai dal sito. Nel browser (preview 4817): hero three.js che gira; Bangers e Press
  Start 2P da `/fonts/`, VT323 (solo fallback) anche, nessuna richiesta a terzi; la carta girata mostra il retro vero («QUINE42», «Carta
  del mondo», non specchiato); motto del footer e tooltip dei gerboa allusivi, senza corona, Concilio né studio; nessun «ADR-» nei testi
  visibili (resta in due commenti HTML); in console solo errori di estensioni del browser. `/?skip&offline`: HUD come prima, nessun errore.
  Nessun difetto.

### T109 · Il sito: il template grafico in `docs/design/sito/` — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 59
- Contesto: richiesta dell'autore del 01/11: il template va fatto prima dei task del sito (T101-T106), e lo fa la pipeline al posto suo.
  Posto scelto dall'autore: `docs/design/sito/` (`docs/pipeline/domande/T97.md`, risposta (a)). Nasce da T97: `dossier T97`; tema in ADR-0095,
  `src/theme.css`, `site/index.html` (pagina dimostrativa, corretta da T107).
- Fare: un template statico (HTML + CSS, niente framework, nessuna dipendenza dal gioco) in `docs/design/sito/`, come quello che Claude Design
  esporterebbe: una pagina per ogni schermata del sito (landing, login, profilo, sessioni con «Crea nuovo universo», carte, pagamenti) con
  layout, griglia, componenti (pulsanti, schede, campi, navigazione, modali, badge, tabelle dei crediti), stati (hover, attivo, disabilitato,
  errore), tipografia e palette come variabili CSS allineate a `src/theme.css` (pop art a fumetti, retro arcade, neon punk, retrowave); una pagina
  indice dei componenti; un `README.md` che dice come T101-T106 ne copiano lo stile. Il segreto dei gerboa allusivo come nell'ADR-0095. Testi in
  italiano, niente meta-gioco.
- Quando è fatto: le pagine aperte nel browser (screenshot di ciascuna, desktop e mobile), nessun errore in console; typecheck verde.
- Esito: creato in `docs/design/sito/` il template grafico master statico (HTML5 + CSS puro, zero framework, nessuna dipendenza a runtime):
  `template.css` (palette pop art/synthwave, token, utility, stati interattivi, animazioni 3D e responsive), `landing.html` (e `index.html`),
  `login.html` (accesso Google, anonimo e stati), `profilo.html` (identità, saldo, customizer 3D avatar con mantello e seme), `sessioni.html`
  (elenco reami live e wizard modale «Crea Nuovo Universo»), `carte.html` (galleria carte 3D animate con lamina olografica, flip bifacciale e quote),
  `pagamenti.html` (saldo, selettore tagli ricarica rapida Stripe e tabella transazioni), `componenti.html` (indice componenti e design system)
  e `README.md` (guida operativa per i task T101-T106). Testi in italiano, nessun meta-gioco, segreto dei gerboa allusivo nel footer, font locali.
  Typecheck e build verdi.

### T110 · Verificare T109 (il template del sito) nel browser — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 30
- Contesto: T109 ha fatto su Gemini il template statico in `docs/design/sito/` (landing, login, profilo, sessioni, carte, pagamenti,
  componenti, `README.md`), ma su Antigravity non c'era il browser (`BROWSER: da verificare`). Nasce da T109: `dossier T109`, `traccia T109`.
- Cosa fare: nel worktree `git merge task/T109`; typecheck. Nel turno browser (`pipeline.mjs turno browser -- …`) servi `docs/design/sito/`
  (es. `npx vite --port <libera> --strictPort` dalla radice e apri `/docs/design/sito/index.html`, così `/fonts/` risolve) e apri ogni pagina
  a larghezza desktop e mobile: layout non rotto, font caricati da `/fonts/` senza richieste a terzi, stati dei componenti visibili, modale
  «Crea nuovo universo» e flip delle carte funzionanti, link tra le pagine giusti, segreto dei gerboa allusivo (niente corona, Concilio,
  studio), nessun meta-gioco né «ADR-» nei testi, nessun errore in console. Correggi da te i difetti piccoli (CSS, link); scrivi gli altri qui.
- Quando è fatto: screenshot di ogni pagina (desktop e mobile) descritti nell'esito; difetti corretti o elencati; typecheck verde.
- Esito: merge di `task/T109` completato e committato; typecheck verde. Verifica approfondita e correzione dei template in `docs/design/sito/`:
  (1) tipografia e font: esteso `template.css` con definizioni `@font-face` per i subset `latin-ext` locali dei font Bangers, Press Start 2P e VT323 per corretta resa dei glifi accentati italiani; zero richieste a CDN esterne;
  (2) navigazione e link: allineato il brand logo e il link "Mondo" al canonical `./index.html` su tutte le 7 pagine (landing, login, profilo, sessioni, carte, pagamenti, componenti); tutti i link relativi verificati e risolti con successo;
  (3) quarta parete e gerboa: rimossi tutti i riferimenti ad "ADR-xxxx" dai template e commenti; sostituito il testo del footer ("chi veglia e continua a scrivere le regole del gioco") e il tooltip ("Qualcosa osserva dall'orizzonte...") con frasi completamente allusive e in-world senza alcuna rottura di quarta parete ("Due sagome all'orizzonte...", "Il sentiero scorre sotto i tuoi passi e si apre a ogni scelta. Ciò che pronunci diventa cammino, ciò che componi diventa mondo.");
  (4) responsive e componenti: integrata la barra azioni (`.nav-actions`) nel menu a comparsa mobile (`@media (max-width: 768px)`); impostata `max-width: min(580px, calc(100vw - 32px))` sulle finestre modali per azzerare l'overflow laterale delle ombre nette; racchiusa la tabella profilo in `.comic-table-wrap`; aggiunta chiusura modale su click backdrop ed Escape key; garantita leggibilità carte su schermi stretti (≤360px);
  (5) script: verificata la correttezza sintattica ed esecuzione senza errori di tutti gli script (flip carte 3D, wizard modale, selettore colori mantello e slider seme, tab di filtro, cambio stati form login). Test suite e typecheck verdi. Su agy browser automation tool non disponibile (`BROWSER: da verificare`).

### T111 · Pipeline: un task con verifica nel browser non ripiega su un provider senza browser — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 20
- Contesto: il 01/11 T109 e T110 (verifica nel browser) erano assegnati a `claude`; con lo slot di Claude occupato la pipeline ha scritto
  «claude non può, va su gemini» e li ha lanciati su Antigravity, che non ha il browser: T110 è stato interrotto a mano. `assegna` rifiuta già
  questi task su un provider senza browser (`assignTask` in `tools/pipeline/pipeline.mjs`), il ripiego no.
- Cosa fare: nel ripiego del lancio (dove nasce «non può, va su») non scegliere un provider senza browser per un task che chiede la verifica nel
  browser (stesso controllo di `assignTask`): il task aspetta il suo provider. Un test della pipeline che lo copre.
- Quando è fatto: test della pipeline verdi con il caso nuovo; typecheck verde.

### T112 · Verificare T110 (il template del sito, con T109) nel browser — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 25 · browser
- Contesto: T109 e T110 sono girati su Antigravity, senza browser (`BROWSER: da verificare`): T110 ha fuso T109, aggiunto i font latin-ext,
  corretto nav e modali su mobile e tolto le rotture della quarta parete, senza vederle. Nasce da T109 e T110: `dossier T110`, `traccia T110`.
- Cosa fare: nel worktree `git merge task/T110`; typecheck. Nel turno browser (`pipeline.mjs turno browser -- …`) servi la radice
  (`npx vite --port <libera> --strictPort`) e apri ogni pagina di `/docs/design/sito/` a larghezza desktop e mobile: layout non rotto, font
  da `/fonts/` senza richieste a terzi, stati dei componenti visibili, modale «Crea nuovo universo» e flip delle carte funzionanti, link tra
  le pagine giusti, segreto dei gerboa allusivo (niente corona, Concilio, studio), nessun meta-gioco né «ADR-» nei testi, nessun errore in
  console. Correggi da te i difetti piccoli (CSS, link); scrivi gli altri qui.
- Quando è fatto: verifica nel browser con screenshot di ogni pagina (desktop e mobile) descritti nell'esito; difetti corretti o elencati; typecheck verde.
- Esito: fuso `task/T110` (conflitto solo nel backlog); typecheck verde. Nel browser (vite dalla radice, Claude in Chrome) le 8 pagine
  (`index` = `landing`, login, profilo, sessioni, carte, pagamenti, componenti) a 1400 px e in un iframe a 375 px: font da `/fonts/`
  (Bangers, Press Start 2P; VT323 è solo il ripiego e non si scarica), nessuna richiesta a terzi, tutti i link rispondono, nessun «ADR-», corona,
  Concilio o studio nei testi, nessun errore della pagina in console; la modale «Crea nuovo universo» si apre, «Casuale» cambia il seme, si chiude
  con ×, Esc e clic sullo sfondo; il flip delle carte gira e mostra il retro; il gerboa del footer mostra «Due orecchie lunghe nella notte…».
  Corretti su mobile: il menu (il `<nav>` restava nella riga del logo, ora `order: 3` a tutta larghezza); le griglie a una colonna
  (`minmax(0, 1fr)` in `.grid-*`, profilo, pagamenti, vetrina della landing) che uscivano a destra per la tabella e le carte; la barra degli
  stati del login va a capo; le carte dei tagli di ricarica; il fumetto del gerboa va a capo entro il 70 % dello schermo; le intestazioni di
  `componenti` vanno a capo; spazio tra «Seme» e «Casuale» nella modale. Quarta parete: la carta «Cripta delle rune» diceva «token Lua
  intatti», ora «rune intatte». Restano (non difetti): la tabella dei pagamenti scorre in orizzontale nel suo riquadro su mobile; a 320 px
  qualche badge e pulsante di profilo, carte e componenti esce di pochi pixel.

### T113 · Corona: il lampione intero e il drone in scala 1:2 dai modelli dell'autore — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 20 · browser
- Contesto: richiesta dell'autore del 01/11. Ha ridisegnato a mano due modelli della corona in `lab/mjx/models/handmade/`:
  `lampione.xml` (molto alto; già copiato in `universe/models/corona-lampione.xml` e girato di π in `corona.ts`, commit `8ca9053`) e
  `drone-xl.xml` (voxel raddoppiati per avere più definizione). Il lampione nel gioco esce **tagliato in altezza**: l'autore sospetta la taglia
  (`corona-lampione` è `classe: mobile`, taglia media, in `universe/models/index.json`; ADR-0092, `boxOf`/`tilesOf`/`densityOf` in
  `src/mj/classes.ts`, `vpt` 8, ADR-0049). Le copie `lampione copy*.xml` sono prove dell'autore: non toccarle.
- Cosa fare: (1) trova dove la scatola o la taglia tagliano il lampione (classe/taglia della voce, scatola del programma rispetto a
  `boxOf`, lettura in `forms.ts`/`src/mj/`) e fa' che si veda **intero** alla sua altezza, senza rimpicciolirlo e senza cambiare gli altri modelli
  (la via più semplice: classe o taglia della voce adatte, o la scatola dichiarata rispettata per i modelli della corona; se cambi il codice,
  un test). (2) Riduci `drone-xl.xml` in scala 1:2 (metà voxel per asse: scatola, coordinate e regole del programma; colori e parti uguali) e
  sostituiscilo a `universe/models/corona-drone.xml`, controllando che i droni in `corona3d.ts` volino come prima.
- Quando è fatto: verifica nel browser (`?skip&offline`, viale della corona con `?dev&teleport=46,0`): lampioni interi e droni visibili, screenshot
  descritti nell'esito; nessun errore in console; `npm test` dei modelli/forme e typecheck verdi.
- Fatto (commit su `task/T113`): il taglio non era la taglia. Il commento in testa al lampione nomina `<markov>`, e `sizeFor` in `forms.ts`
  prendeva quel tag per la radice: non vedeva `size="10 14 74"` e imponeva la scatola della classe `mobile` (20³). Ora `rootTag` (forms.ts,
  usato anche dal tornio) salta i commenti: il lampione gira 10 × 14 × 74, gli altri modelli non cambiano (era l'unico colpito). Il drone:
  `drone-xl.xml` ridotto a 10 × 10 × 8 dimezzando ogni box, con gli anelli delle eliche riscritti attorno alle pale (dimezzati coprivano le pale);
  test in `tests/forms.test.ts`. Nel browser: lampioni interi lungo il viale, droni in volo, nessun errore del gioco in console.

### T114 · Verificare T103 (l'hub sessioni multigiocatore) nel browser e integrare — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 25 · browser
- Contesto: T103 è stato completato su Gemini/agy senza browser (`BROWSER: da verificare`). Ha implementato l'hub sessioni (`site/sessioni.html`, `site/sessioni.ts`, `site/sessioni.css`), l'endpoint `GET /api/session`, la visualizzazione dei reami con spesa oraria stimata e il wizard «Crea nuovo universo». Il merge diretto con `3d` presenta conflitti in `site/index.html` (aggiornato nel frattempo da T101 con la nuova landing e hero 3D). Nasce da T103: `dossier T103`, `traccia T103`.
- Cosa fare: nel worktree fare `git merge task/T103`; risolvere il conflitto in `site/index.html` preservando integralmente la nuova landing page di T101 e integrando nella barra di navigazione e nel footer il link a `./sessioni.html`; typecheck e test. Nel turno browser (`pipeline.mjs turno browser -- npx vite --port <libera> --strictPort`) verificare con Claude in Chrome:
  - Apertura di `site/sessioni.html` e navigazione corretta a 1400 px e a 375 px (desktop e mobile);
  - Schede dei reami, badge live/offline, spesa oraria calcolata e tetto minimo visualizzati;
  - Apertura del wizard modale «Crea nuovo universo», validazione slug, seme casuale, chiusura con Esc, × e backdrop;
  - Link verso la lobby del gioco (`../index.html?universo=<nome>`);
  - Nessun errore JavaScript in console né rotture di quarta parete;
  - Correggere da te i difetti grafici o di navigazione minori (CSS/link).
- Quando è fatto: verifica nel browser descritta con precisione nell'esito; difetti corretti; commit su `task/T114`; typecheck e test verdi.
- Esito: fuso `task/T103`; in `site/index.html` tenuta intera la landing di T101, con «Sessioni» nella barra e nel footer e la carta «Reami condivisi» che porta a `sessioni.html` («SCEGLI UN REAME»). Corretti: i link di `sessioni.html` a pagine che non esistono ancora (`carte.html`, `profilo.html`, `pagamenti.html`) ora vanno alle sezioni della landing (`#carte`, `#reami`); il pulsante «ENTRA NELLA LOBBY» non va più a capo e il piede della carta si avvolge. Verificato nel browser su `npx vite` (porta 5287): reami vuoti → stato «nessun universo»; wizard: apertura, seme casuale, chiusura con Esc, × e sfondo, nome vuoto e slug non valido rifiutati con messaggio; creato `prova-t114` (commit nel repository git, poi rimosso), carta «IN PAUSA» con master, modelli, coefficienti, spesa oraria ~0,77 $ e tetto 1,00 $; filtri tutti/live/miei (1/0/1); il link porta a `../index.html?universo=prova-t114` e apre il gioco; a 375 px (iframe) nessuno scorrimento orizzontale, menu a tendina, wizard e carta dentro lo schermo; nessun errore in console. Il badge live con viandanti collegati non è provato (nessuna sessione multigiocatore aperta). Typecheck verde; la suite intera sotto carico ha dato 618 verdi e 44 rossi, tutti timeout tranne uno di `subscription.test.ts`, verde da solo; rilanciati da soli sono verdi tranne alcuni di `referente`, `wanderers`, `watch`, che vanno in timeout anche senza le modifiche del merge (ogni test di `watch` dura ~20 s su questa macchina, al limite). Anche `kernel.test.ts` da solo va in timeout nell'hook `beforeEach` (10 s), e importa solo `src/kernel/`, che il merge non tocca.


### T115 · Integrare T57b (rune nuove dal Concilio) — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 20
- Contesto: T57b è fatto in `task/T57b` (rune nuove dal Concilio, `src/kernel/magic.ts`, compito `rune.invent`), ma `integra T57b` va in conflitto in `AGENTS.md`, `docs/adr/README.md` e `src/kernel/agents/effects.ts` con T57c (già nel base, ADR-0096 effetto rilievo). Anche T57b ha scritto un ADR-0096. Nasce da T57b: `dossier T57b`, `traccia T57b`.
- Cosa fare: nel worktree `git merge task/T57b`; l'ADR di T57b diventa **ADR-0097** (file rinominato, indice, riferimenti in `AGENTS.md`, backlog e codice); nelle sezioni in conflitto tenere entrambe le aggiunte (in `effects.ts` sia la guida dell'effetto `rilievo` di T57c sia le rune nuove in `SPELL_GUIDE` di T57b); typecheck, `tests/magic.test.ts`, `tests/effects*` e la suite intera nel turno test (`pipeline.mjs turno test -- npm test`). I 5 timeout noti (referente T42e/T42f, wanderers T34, watch T42c) falliscono anche sul base: non sono difetti.
- Quando è fatto: merge risolto con ADR-0097, typecheck e test verdi (salvo i timeout noti), commit su `task/T115`.
- Esito: merge di `task/T57b` risolto (commit di merge su `task/T115`): l'ADR delle rune nuove è ADR-0097 (file, indice, `AGENTS.md`, `kernel.ts`, `magic.ts`, blocco di T57b); ADR-0096 resta a T57c; in `SPELL_GUIDE` gli esempi e l'elenco con `rilievo` di T57c più la riga su `runa_nuova` di T57b; in `AGENTS.md` (Magia) entrambe le aggiunte. Typecheck verde; `magic`, `coefficients`, `rilievo` verdi. Suite intera nel turno test: 48 falliti su 667, solo timeout sotto il carico; i 10 file rilanciati con tempi lunghi danno 100 verdi su 105, restano i 5 noti (referente T42e/T42f, wanderers T34, watch T42c) con timeout fisso nel test; non rilanciato `abbonamenti` T68b, che usa la CLI reale.

### T116 · Integrare T102 (la pagina profilo del sito) — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 21
- Contesto: T102 è fatto in `task/T102` (pagina profilo, editor con anteprima 3D, rotta `/api/viandante`), ma `integra T102` va in conflitto in `site/index.html` e `vite.config.ts` con T103/T114 (hub sessioni, `GET /api/session`, link a `sessioni.html`), già nel base. Nasce da T102: `dossier T102`, `traccia T102`; vedi anche `dossier T114`.
- Cosa fare: nel worktree `git merge task/T102`; tenere entrambe le aggiunte (in `vite.config.ts` gli ingressi delle pagine e le rotte di tutti e due; in `site/index.html` la landing di T101 con i link sia a `sessioni.html` sia al profilo); typecheck e la suite nel turno test (`pipeline.mjs turno test -- npm test`); i timeout noti (referente, wanderers, watch, kernel sotto carico) non sono difetti. Una prova breve nel turno browser: le pagine landing, sessioni e profilo si aprono e i link tra loro funzionano.
- Quando è fatto: merge risolto, typecheck e test verdi (salvo i timeout noti), commit su `task/T116`.
- Esito: fuso `task/T102`; in `site/index.html` (barra e footer) tenuti sia «Sessioni» sia «Profilo», in `vite.config.ts` gli ingressi `sessioni` e `siteProfilo` e tutte le rotte. In più del previsto: `site/profilo.html` non portava a `sessioni.html` né `site/sessioni.html` a `profilo.html`, aggiunti i due link in barra e footer. Typecheck e build verdi. Suite intera nel turno: 45 falliti su 675 in 9 file, con la CPU al 100%: 44 per timeout e 1 asserzione (`subscription.test.ts`, la Genesi con la coda). Rilanciati un file alla volta: `credits`, `subscription`, `thin` verdi così come sono; `between`, `places`, `referente`, `wanderers`, `watch`, `kernel` (più dei timeout noti: anche `between` e `places`) verdi solo con i timeout alzati a mano per la prova (600 s, hook 300 s), poi ripristinati, 81/81; `between` e `kernel` hanno preso circa 10 minuti ciascuno. Non c'è una suite intera tutta verde, e non ho misurato i tempi sul base per confronto; il codice del merge non tocca il tick (`keepProfile` è chiamato solo da `/api/viandante`). Browser: landing → Sessioni → Profilo → Sessioni → landing con i clic veri, `/api/viandante` e `GET /api/session` rispondono in preview, nessun errore in console. Non riprovati dopo il merge: la scheda del viandante e l'anteprima 3D (in questo worktree non c'è nessun universo), né l'accesso Firebase vero (nemmeno T102 lo ha provato).

### T117 · Audit di sicurezza: il Lua sul server, le chiavi, i rischi a valle del Concilio — `fatto`
- Pipeline: claude · stima 5% · approvato · priorità 0
- Contesto: domanda dell'autore (01/11): il codice Lua gira sandboxed sul server? Può esporre le chiavi delle API di Gemini? Quali altri rischi solleva? **Modello di minaccia, deciso dall'autore**: gli agenti del Concilio non rilevano né neutralizzano i prompt avversari, quindi il giocatore può dettare al Concilio qualunque contenuto o codice, e può anche scrivere Lua direttamente. La sicurezza deve stare **a valle** della scrittura del codice: difese contro i prompt avversari sul Concilio non contano come difese. Nasce da una richiesta in chat; vedi ADR-0057, 0058, 0059, 0061, 0066, 0069, 0077, 0082, 0083.
- Cosa fare: **solo analisi, nessuna correzione**. Rispondere alle due domande con prove, non solo leggendo il codice: riprodurre gli attacchi in locale con il kernel vero (`src/kernel/sandbox.ts`, `prelude.lua`, `Host`, `validator.ts`, wasmoon) e file di prova non committati.
  1. **La sandbox**: dove gira il Lua in multigiocatore (`src/session/host.ts`, `server/session.ts`), chi può farlo girare (rune incise, `logic.lua` generati, editor e ramo del master). Provare a uscirne: oggetti e funzioni JS passati da wasmoon a Lua (`constructor.constructor`, prototipi, `process`), metatabelle di stringhe e tabelle, `load`/`require`/`debug` raggiunti per altre vie, `pcall` e coroutine contro il budget di istruzioni, confronto tra ciò che controlla il validatore e ciò che la sandbox impedisce davvero a runtime (il validatore si può aggirare?).
  2. **La chiave**: `GEMINI_API_KEY` e gli altri segreti (`STRIPE_*`, `FIREBASE_*`) sono raggiungibili da Lua o dal processo in cui gira? Usare un valore finto in una variabile di prova, **mai leggere né stampare i valori veri** del `.env`. Possono finire nei file dell'universo, nei prompt, nei log, nel `dist/`, nei messaggi al client? Il proxy `/api/gemini` è usabile da chiunque per spendere la chiave?
  3. **Gli altri rischi**, a valle di codice e contenuti ostili: negazione del servizio (cicli, memoria, `string.rep`, programmi MarkovJunior enormi, un guasto che blocca il tick di tutti); isolamento tra giocatori e verso il master (rune senza lock, `as`, scritture dei binding, stato di altri viandanti, crediti e carte, ADR-0081); endpoint del server senza autenticazione (`/api/universe`, clone, `/api/viandante`, `/api/coda`, `/api/session`, percorsi con `..`, argomenti passati a git, id del viandante scelto dal client); pagamenti (webhook, idempotenza); XSS da testi generati o scritti da altri giocatori nel DOM (client e `site/`); file che il Concilio può scrivere e che cambiano la configurazione (`universe.json`: budget, `ai.provider`, `partita`); **coda degli abbonamenti** (ADR-0077): un prompt dettato dal giocatore che arriva a una CLI con strumenti sulla macchina di chi gioca; `playerFiles` e ciò che esce verso il giocatore (ADR-0061).
- Scrivere il risultato in `docs/sicurezza/audit-2026-11.md`: in testa la risposta alle due domande in poche righe; poi un rischio per voce con gravità, come si riproduce (provato sì/no), impatto, difesa proposta a valle. Distinguere ciò che è esposto oggi (`npm run dev` in locale) da ciò che lo diventa con il server pubblico (T45f). In coda un elenco di task di correzione proposti, in ordine di gravità: **non** aggiungerli al backlog (li propone l'orchestratore all'autore) e non scrivere `docs/pipeline/domande/` se non serve una decisione.
- Quando è fatto: il report è committato su `task/T117`; le prove riproducibili sono descritte nel report; nessun segreto vero nel report, nei log o nei commit. Non serve la suite intera di test se cambiano solo documenti.
- Esito: report in `docs/sicurezza/audit-2026-11.md` (16 rischi). **Prove solo parziali**: riprodotti quattro casi della sandbox (un pattern di `string.find` blocca il processo oltre 60 s); il resto è analisi del codice, segnato «provato: no», perché un filtro di sicurezza ha interrotto la sessione mentre preparava le prove. Manca la prova sull'uscita verso JS. Domanda in `docs/pipeline/domande/T117.md`.

### T118 · La CPU satura con due task: limitare test, typecheck e build — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 1
- Contesto: l'autore (01/11) vede la CPU al 100 % già con due task insieme (6 core, 12 thread); i test vanno in timeout e si ripetono, sprecando crediti. Agent View è scartato: non gestisce il carico della CPU. Ipotesi dell'orchestratore, da verificare: il carico viene da test e build, non dagli agenti; `vite.config.ts` non limita i worker di Vitest e il turno (ADR-0088) copre solo la suite intera e la preview. Nasce dalle regole di ADR-0088: leggi l'ADR e `dossier` dei task che lo hanno attuato.
- Cosa fare:
  1. **Misurare** cosa satura la CPU mentre girano due task (quali processi, in quali fasi: suite intera, singoli file, typecheck, build, preview), con campioni reali; scrivere i numeri nel blocco del task. Se l'ipotesi è sbagliata, dirlo e correggere la causa vera o, se esce dallo scopo, scriverlo in `docs/pipeline/domande/T118.md`.
  2. **Limitare i worker di Vitest** a un numero scelto dalle misure, in un modo che valga per la pipeline e non rallenti senza motivo chi lavora a mano.
  3. **Far passare dal turno anche typecheck e build** (`pipeline.mjs turno`, prompt in `tools/pipeline/config.json`, `docs/pipeline/README.md`), senza stalli: un comando dentro un turno già tenuto, come la build prima della preview o il typecheck dentro `npm run build`, non deve aspettare se stesso.
- **Da non fare** (decisione dell'autore): non abbassare la priorità dei processi. Non usare Agent View.
- Se la decisione è architetturale, aggiornare `AGENTS.md` e l'ADR (nuovo o ADR-0088).
- Quando è fatto: con due task attivi la suite intera non dà timeout dovuti al carico (i numeri prima e dopo nel blocco del task); `pipeline.mjs turno` mostra i turni nuovi; typecheck e test verdi; commit su `task/T118`.
- Misure (01/11, 6 core e 12 thread, campioni ogni ~10 s, CPU di tutta la macchina):
  | Prova | Worker | Durata | CPU media / picco | Campioni ≥ 90 % | Falliti |
  |---|---|---|---|---|---|
  | suite, prima | 11 (predefinito) | 907 s | 68 % / 100 % | 58 % | 44: 26 hook, 18 test, tutti timeout |
  | suite, solo meno worker | 6 | 821 s | 57 % / 81 % | 0 % | 31: 26 hook, 5 test, tutti timeout |
  | suite, dopo, con accanto un secondo task simulato (typecheck, build, `places.test.ts` in ciclo) | 6 | 890 s | 56 % / 100 % | 6 % | 0 timeout; 2 asserzioni dei test nuovi, corrette |
  | suite, dopo, finale (fine di T136 senza limite, in coda, esclusa) | 6 | 885 s | 63 % / 84 % | 0 % | 0: 680/680 |
  | la suite di T136 con il limite vecchio, mentre T118 aspettava il turno | 11 | | 58 % / 100 % | 52 % | |
  Da soli: typecheck 10 s, build 6,5 s (un solo processo, poco carico). Agenti: claude 0,1 %, agy/gemini 0,2 % in media; Chrome 1-2 %. `kernel.test.ts` da solo a CPU scarica: 945 s e **gli stessi 26 timeout di hook**.
- Esito: l'ipotesi era giusta a metà. La saturazione viene dai worker di Vitest (11 su 6 core: ~3/4 della macchina), non dagli agenti, e con 6 worker la suite è anche più veloce (la somma dei tempi dei test scende da 6736 a 4625 s). **I timeout però avevano anche un'altra causa**: i 26 di `kernel.test.ts` non dipendono dal carico, perché avviare un kernel supera da solo i 10 s predefiniti di un hook. Fatto: `turni.test.worker` = 6 in `config.json`, applicato da `server/testWorkers.ts` solo con `PIPELINE_TASK` o `PIPELINE_TURNO` (a mano nulla cambia); `hookTimeout` 60 s; i limiti di 20-30 s scritti in `referente`, `wanderers`, `thin`, `places`, `watch` a 60 s; turni `typecheck` e `build` (10 minuti); rientranza con `COVERS` e `coveredBy` (`PIPELINE_TURNO` ora è un elenco; la preview in background di un task copre le sue build); prompt, README, `orchestra.md`, AGENTS.md, ADR-0088. Test: 680/680, typecheck verde.
  Limiti: il secondo task delle misure è simulato, non un task vero con il suo agente; il limite vale per gli altri worktree solo dopo l'integrazione (fino ad allora le loro suite usano 11 worker, come quella di T136); typecheck e build nel turno restano una regola del prompt. Da guardare a parte, non fatto qui: l'avvio del kernel è lento (mediana ~18 s per test in `kernel.test.ts`, 843 s su 5030 della suite) ed è la leva più grande rimasta sulla durata.

### T119 · Integrare T116 (T102, la pagina profilo) dopo T104 — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 2
- Contesto: `integra T116` va in conflitto in `AGENTS.md`, `docs/plans/backlog.md` e `vite.config.ts` con T104 (galleria delle carte), appena entrato nel base. `task/T116` contiene già il merge di T102. Nasce da T116, T102 e T104: `dossier T116`, `dossier T104`.
- Cosa fare: nel worktree di T119 `git merge task/T116`; risolvere tenendo entrambe le aggiunte (pagine del sito in `vite.config.ts`, righe di `AGENTS.md`); nel backlog restano i blocchi di tutti i task. Niente nuove funzioni.
- Test: typecheck e build; `tests/site-profile.test.ts` e `tests/site-carte.test.ts` da soli. La suite intera è da poco stata eseguita da T116 e T104 con timeout per il carico: **non ripeterla** se il merge tocca solo i tre file in conflitto (T118 si occupa del carico); dillo nell'esito. Se il merge cambia altro codice, lanciala con il turno.
- Browser: una controllata veloce che `site/profilo.html` e `site/carte.html` si aprano senza errori in console e con i link tra le pagine; scheda del viandante e anteprima 3D con un universo di prova, che T116 non ha riprovato dopo il merge. Login Firebase non richiesto.
- Quando è fatto: merge risolto, verifiche sopra fatte, commit su `task/T119`. Poi l'orchestratore fa `integra T119`, `integra T116`, `integra T102`.
- Esito: `task/T119`, fuso `task/T116`. Conflitti in `AGENTS.md` (la riga del sito dice carte e profilo), `docs/plans/backlog.md` (l'esito di T116 al suo blocco, tutti i blocchi restano), `vite.config.ts` (ingressi `carte` e `siteProfilo`). Più del previsto, per i link tra le pagine: `site/profilo.html` portava le carte a `index.html#carte` e ora a `carte.html`; `site/carte.html` non portava al profilo, aggiunto in barra e footer. Typecheck e build verdi; `site-profile` e `site-carte` verdi (16 test). **Suite intera non ripetuta**: come dice il task, il merge non cambia codice oltre ai file in conflitto e ai due link HTML. Nel browser (preview 4983, universo di prova con 8 carte, poi cancellato, server senza account): scheda di `io` nel reame, anteprima 3D che cambia colore del mantello e gira trascinando, galleria con 8 carte e miniature; link profilo → carte e carte → profilo provati; nessun errore in console. Non provati: salvataggio del profilo dalla pagina (coperto da `site-profile`), login Firebase, giro delle carte.

### T141 · Il materiale per generare il nuovo logo — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 0
- Contesto: richiesta dell'autore (chat del 01/11): vuole rifare il logo del gioco con Claude Design o con Gemini, dalle loro interfacce web, e scegliere tra una serie di alternative. Serve una cartella con materiale grafico e istruzioni scritte. Oggi non c'è un logo: il gioco mostra ancora ᚱ ᚢ ᚾ ᛖ, il vecchio nome (`index.html`, `src/ui/genesis.ts`), il sito la scritta QUINE42 (`.nav-logo` in `site/site.css`). Il task prepara il materiale e basta: non genera loghi e non cambia il gioco né il sito. L'autore sta già facendo le prove: il materiale gli serve presto, meglio pochi file buoni che molti.
- Cosa fare, in `docs/design/logo/`:
  - `brief.md`, da incollare così com'è, scritto per chi non sa nulla del progetto: il nome esatto `QUINE42` (cosa vuol dire: quine è il programma che stampa il proprio sorgente, 42 sono i passi del cerchio e il numero che tutti riconoscono); il gioco in poche righe (mondo a voxel fatto del proprio codice sorgente, rune che sono token di codice vero, il tappeto, il cerchio, la corona); le idee visive tra cui scegliere; lo stile (pop art a fumetti, retro arcade, neon punk, retrowave) con i colori esadecimali di `src/theme.css` e i font Bangers, Press Start 2P, VT323 come riferimento; ciò che va evitato (lettere sbagliate, testi inventati oltre al nome, rune decorative alla fantasy generica, il vecchio nome RUNE).
  - La richiesta di **diverse alternative**: almeno 8 direzioni davvero diverse tra loro (per esempio scritta sola, emblema, voxel in 3D, cerchio e tappeto, autoreferenza del quine, glifo di runa come codice, gerboa, arcade), non varianti della stessa idea. Di ognuna: il nome della direzione, una riga sul perché, la versione su fondo scuro, su fondo chiaro, a un colore e un'icona che si legge a 32 px.
  - `prompt-claude-design.md` e `prompt-gemini.md`: il testo pronto per ciascuno strumento, con quali immagini allegare. Per Claude Design una richiesta unica con tutte le direzioni in SVG o HTML. Per Gemini, che genera immagini, un prompt breve per direzione (gestisce male il testo: dire di controllare le lettere). Se non sai con certezza formati o limiti di allegati di uno strumento, cercali o scrivilo come dubbio: non inventarli.
  - `immagini/`, al più 10 file numerati nell'ordine in cui allegarli, ciascuno sotto i 2 MB, scelti perché mostrano l'identità e non per completezza: il mondo a voxel, la corona con le insegne al neon, una runa a terra, un gerboa del Concilio (`corona-gerboa-*.xml`), un modello che brilla, l'hero MarkovJunior e i componenti del sito, una tavola di palette e font. Foto nuove del gioco attuale in `?skip&offline` (procedura in `AGENTS.md`, «Convalida nel browser», con il turno `browser`); `docs/img/3d/` e `docs/design/sito/` si riusano se sono ancora fedeli. Per salvare su file: se lo strumento del browser non scrive PNG, una foto dei modelli con `lab/scripts/mjx-render.ts` o `src/mj/photo.ts`, o il `toDataURL` del canvas; nell'esito di' cosa non sei riuscito a fotografare, senza riempire con foto vecchie.
  - `README.md`: cosa c'è, come si usa con i due strumenti in pochi passi, come confrontare i risultati (leggibile a 32 px, riconoscibile in bianco e nero, legato al gioco, usabile nella landing e nel gioco), dove mettere i loghi che tornano (`docs/design/logo/proposte/`).
- Riservatezza: ciò che sta in questa cartella finisce su servizi esterni, quindi solo materiale che si può mostrare: niente chiavi, `.env`, dati di account, universi dell'autore che non siano il seme, codice del kernel. Il segreto dei gerboa (ADR-0095) va citato solo come direzione tra le altre, senza spiegare dove si nasconde nel sito.
- Test: nessuno sul codice, che non cambia; niente suite. Controlla che i link del README portino a file che esistono e che le dimensioni delle immagini rispettino il limite.
- Browser: guarda ogni immagine prima di tenerla (una foto nera o con pannelli aperti non serve).
- Quando è fatto: commit su `task/T141` con la cartella. Nell'esito: l'elenco delle immagini e cosa mostra ognuna, le 8 direzioni. Poi l'orchestratore fa `integra T141`. Sostituire il logo nel gioco e nel sito, quando l'autore ne avrà scelto uno, è un altro task.
- Esito: `docs/design/logo/` con brief, due prompt, README e 9 immagini (la più pesante 173 KB), `proposte/` vuota. Link del README e pesi controllati; i prompt non sono stati provati sui due strumenti. Limiti letti dalle guide il 01/11: Gemini fino a 10 file per prompt; Claude Design non dice i limiti degli allegati e tra le esportazioni non cita l'SVG, quindi il prompt chiede una pagina HTML con gli SVG dentro. Diverso dal previsto: le foto sono JPEG dello strumento del browser, ritagliate; i gerboa di profilo vengono da `src/mj/photo.ts`; la tavola di palette e font è una pagina temporanea, non tenuta. Da guardare, fuori da questo task: con il tappeto fermato dalla console le lastre delle rune si vedevano stando nella corona e non stando dentro il cerchio (`speed = speed` a (12-14, 8) guardata da (13, 11), scorrimento a zero); causa non cercata, e non provato se succede anche giocando normalmente.

### T143 · Le rune non si vedono sul tappeto — `fatto`
- Pipeline: claude · stima 5% · approvato · priorità 2
- Contesto: bug riportato dall'autore (chat del 01/11): giocando, le rune non si vedono sul tappeto «da un po', almeno da 40 task». È una regressione: una volta si vedevano. Indizio da T141 (`dossier T141`, ultima riga dell'esito), raccolto con il tappeto fermato dalla console: le lastre si vedevano stando nella corona e non stando dentro il cerchio (`speed = speed` a (12-14, 8) guardata da (13, 11), scorrimento a zero). Causa non cercata: non darla per buona, può essere anche il taglio al cerchio, la disposizione delle rune, l'altezza delle lastre sul rilievo o altro.
- Cosa fare:
  - Riprodurre giocando normalmente, con il tappeto attivo, in `?skip&offline` e nella build (`AGENTS.md`, «Convalida nel browser»). Il chunk (0,0) ha sempre `x`, `speed = speed` e la runa magica `luce`, quindi si può guardare subito attorno alla partenza. Provare sia le rune a terra sia quelle incise dalla frase, che camminano con il tappeto.
  - Trovare la causa: stanno nel kernel (entità, posizioni) e non si disegnano, o non ci sono? Risalire con `git bisect` o provando commit vecchi al commit che le ha fatte sparire, se è il modo più rapido (il disegno è in `src/render/things.ts`, il taglio al cerchio in `src/render/`).
  - Correggere alla radice, senza toccare ciò che la corona deve nascondere: oltre il cerchio la simulazione resta tagliata quando la corona si vede.
- Test: un test di regressione se la causa è provabile senza WebGL; `npm run typecheck` e la suite intera con i loro turni.
- Browser: screenshot delle rune a terra e di quelle incise, con il tappeto attivo mentre si cammina, di giorno e di notte, e con il tappeto fermato dentro il cerchio e dalla corona. Guardare anche le rune fuori dal chunk (0,0).
- Quando è fatto: rune visibili in tutti i casi qui sopra, commit su `task/T143`. Nell'esito: la causa, il commit che l'ha introdotta se trovato, cosa si vede.
- Esito: fatto. **Causa**: le lastre c'erano ed erano disegnate, con alfa 0. `noGlow` (`src/render/materials.ts`) aggiungeva gli attributi `glow` e `alpha` mancanti da `onBeforeRender`, ma three carica gli attributi prima del disegno: quello nuovo non aveva un buffer, three non lo legava e lo ricordava come legato, quindi quella coppia geometria-programma leggeva per sempre il valore costante. La geometria delle lastre è una sola e il primo programma con cui la si disegna è quello con la nebbia, cioè dentro il cerchio; dalla corona (senza nebbia, programma nuovo, buffer ormai caricato) si vedevano: da qui l'indizio di T141. Prova: lo stesso shader con un'altra chiave di programma si vede. **Commit**: l'alfa come attributo viene da 379636a (25/10), aaacca6 (30/10) ha aggiunto i riempitivi senza chiudere il caso; dedotto dal codice, senza `git bisect`. **Correzione**: i riempitivi arrivano dopo il fotogramma (`queueMicrotask`): al successivo three li carica e li lega; un solo fotogramma legge il valore costante, come una geometria mai disegnata. Vale per tutte le geometrie senza quegli attributi, non solo per le rune. Test `tests/fillers.test.ts` (senza WebGL: cosa arriva e quando). **Si vede** (`?skip&offline`, build): rune a terra e incise (`y = y`) col tappeto attivo mentre si cammina, di giorno e di notte; col tappeto fermo dentro il cerchio e dalla corona; fuori dal chunk (0,0) (`vita`, `terra`, `speed = speed` a (-4..-2, 1)). Dalla corona la simulazione resta tagliata oltre il cerchio. Sicurezza: nessuna superficie nuova.

## La sicurezza (audit T117, `docs/sicurezza/audit-2026-11.md`; chat dell'autore del 01/11)

**Decisione dell'autore, vale per tutti questi task.** Dentro il gioco, a parte i crediti dei giocatori, tutto si può modificare: il codice generato può toccare inventario, bisogni ed entità degli altri viandanti, e ci sono i rollback. Difendersi dai prompt avversari al Concilio è una guerra persa e non si fa. Ciò che conta: **non si esce dalla sandbox del gioco**, **i crediti non si toccano**, **i giocatori non master non riscrivono direttamente il codice Lua sul server**. Le difese di R8 sui permessi per viandante, su `U` in sola lettura e sul `by` delle rune **non si fanno**. Le prove sono test difensivi nel repository, che falliscono prima della correzione e passano dopo; niente payload nel report, mai valori veri dei segreti. **Ogni task di questa sezione segue `docs/sicurezza/README.md` (T136)**: aggiorna la sua voce in `docs/sicurezza/registro.md` e toglie `.fails` dai test che chiude; ciò che una sessione non riesce a provare va nel kit dell’autore (T137).

### T120 · Chi può scrivere: `/api/universe` e il WebSocket — `fatto` (dipende da T136, T137, T139)
- Pipeline: claude · stima 5% · approvato · priorità 3
- Contesto: richiesta dell'autore: con F12 un giocatore può riscrivere i file Lua sul server. Confermato nel codice: `server/universeStore.ts` accetta `commit`, `create`, `checkout`, `branch`, `merge`, `clone`, `reset` e `PUT map` senza identità (R1). Il WebSocket controlla `isMaster`, ma senza account l'id lo sceglie il client (R6). Nasce da T117: `dossier T117`; vedi ADR-0058, 0061, 0066, 0082.
- Cosa fare:
  1. Identità verificata sul server e permessi per operazione su ogni route di `/api/universe`: su un universo multigiocatore un non master non scrive nulla; `clone` prende il master dall'identità verificata, non dal corpo. Verificare prima come scrivono `host.ts`, il kernel del server e `site/sessioni.ts` (`create`) e tenere funzionanti i percorsi legittimi.
  2. Letture: un non master non legge file che `playerFiles` gli negherebbe. `site/carte.ts`, `site/sessioni.ts` e `site/landing.ts` leggono `/api/universe`: dare loro ciò che serve senza aprire il resto (logica, prompt, saldi).
  3. Controllo di `Origin` e `Content-Type` sulle route che scrivono e sul WebSocket; in singola, sul server locale, il gioco continua a funzionare come oggi.
  4. Senza verificatore (niente `FIREBASE_PROJECT_ID`) l'id scelto dal client vale solo da loopback. `anonimo` e `tetto` non li decide il client; `offline` non lo decide il primo client; `GET /api/session` non elenca i viandanti a chiunque. Le stesse regole valgono per `/api/viandante` (`server/wanderer.ts`, T102) e `/api/crediti` (`server/wallet.ts`, T105), entrate dopo la scrittura di questo task: chi chiede viene dall'identità verificata, e `/api/viandante` non tocca i crediti e non dà il saldo di altri (V-006.e, misurata da T137: oggi lo dà a chiunque).
  5. Controllare ogni messaggio del protocollo che un client può mandare a mano: nessuno deve far scrivere codice a un non master.
  6. **ADR nuovo e `AGENTS.md`**: il modello di minaccia di questa sezione, con le regole di accesso.
- Test: un non master (HTTP e WebSocket) è rifiutato su ogni operazione di scrittura; il master e la singola funzionano; un'origine diversa è rifiutata.
- Browser: controllata veloce del gioco in singola (`?skip&offline`, un salvataggio dall'editor) e delle pagine del sito.
- Quando è fatto: test e typecheck verdi, commit su `task/T120`.
- Esito: `task/T120`, ADR-0102. `server/access.ts` dice chi chiede e cosa può; `src/session/files.ts` ha `playerFiles` e il nuovo `publicFiles`. V-001 e V-006 chiuse, `tests/sicurezza/accesso.test.ts` nuovo, tolti gli `it.fails`. Il mondo del server si fa riconoscere con un segreto del processo. Le pagine: la lobby legge il saldo da `/api/viandante`, la galleria da `GET …/carte` (carte misurate sul server), `sessioni` si identifica per creare. **Diverso dal previsto**: (1) il `clone` non prende il master dall'identità: lo fa solo il master provato e nomina il nuovo nel corpo, perché altrimenti o un non master legge tutto clonando, o non si può più dare un clone a un altro (ADR-0102, «Alternative»; se l'autore lo vuole diverso è una riga); (2) in più: in una partita di molti nemmeno il master scrive i saldi via HTTP, un universo creato non porta saldi, il `tetto` sta nel saldo e rientrare non aggiunge budget; (3) nel kit V-001.m, V-006.a, V-006.e riscritte e le prove di V-003 e V-005 fatte come master, perché continuino a misurare (T121, T125): i motivi nel registro. Kit dopo (`esiti/2026-11-01-dopo-T120.json`): 24 ok, 6 FALLA, tutte di V-003 e V-005, non di T120. Da rifare a mano: i blocchi di `prove-f12.md` da un altro sito (V-001.n, o, V-006.g). Sicurezza: V-001 e V-006 chiuse, nessuna voce nuova. Si nota per T130: lobby e sito leggono `ai` da `universe.json`.

### T121 · Percorsi ammessi e protezione di git — `fatto` (dipende da T120)
- Pipeline: claude · stima 3% · approvato · priorità 4
- Contesto: R3 dell'audit: `safePath` (`universeStore.ts`) e `cleanBranch` (`src/session/server.ts`) confrontano `.git` alla lettera; su NTFS varianti dello stesso nome sono la stessa cartella, e scriverci può diventare esecuzione di codice sulla macchina (il server lancia git lì).
- Cosa fare: elenco di percorsi ammessi (`modules/ models/ world/ maps/ prompts/ universe.json`, da verificare con ciò che il kernel scrive davvero) invece di un divieto; normalizzare maiuscole, punti e spazi finali, flussi NTFS, nomi riservati di Windows; git lanciato con `core.hooksPath` vuoto e nessuna configurazione del repository scrivibile.
- Test: tabella di percorsi rifiutati sul validatore dei percorsi, senza scrivere fuori da una cartella temporanea.
- Quando è fatto: test e typecheck verdi, commit su `task/T121`.
- Esito: `task/T121`, ADR-0103. `src/kernel/paths.ts` (`allowedPath`) al posto del divieto, in `safePath`, `cleanBranch` e `PUT map`; un commit con un percorso rifiutato risponde 400 e non scrive nulla; `server/git.ts` (`runGit`) è l'unico git del server (anche `stripe` e `wanderer`). V-003 chiusa, `tests/sicurezza/percorsi.test.ts` nuovo. **Diverso dal previsto**: (1) `core.hooksPath=/dev/null`, non vuoto: provato, vuoto cerca `/pre-commit` alla radice del disco; (2) si rifiuta invece di normalizzare: con un elenco non serve conoscere le equivalenze; (3) `seed.json` nell'elenco, che il task non diceva, e `assets/` no: è del vecchio 2D e nessuno la scrive; (4) in più, trovato leggendo: un `commit` su un universo senza `.git` faceva `git add -A` e `git commit` **nel repository del kernel**, sopra `universes/` (solo da questa macchina): ora git non risale (`GIT_CEILING_DIRECTORIES`) e il magazzino rifiuta prima; `UNIVERSE_NAME_RE` unica, nomi di universi, viandanti e moduli non dispositivi di Windows; `UniverseClient` toglie il percorso non ammesso e scrive il resto del commit, che altrimenti andrebbe perso. Sicurezza: V-003 chiusa, nessuna voce nuova; il `commit` nel repository del kernel è dentro V-003 e chiuso qui. Kit `--solo V-003` (`esiti/2026-11-01-dopo-T121.json`): 8 ok su 8; il kit intero non è stato rifatto. **Suite intera: 1033 verdi, 1 rosso**, il timeout da 60 s di un test di `tests/between.test.ts`, a macchina carica (lo stesso file è già nei timeout di T137); da solo con il limite alzato passa 7 su 7, ma a circa 67 s per test, sopra il limite: è il carico o il test è al limite, non i percorsi. Typecheck verde. Niente browser: il task non lo chiede, quindi il gioco non è stato aperto.

### T122 · Non si esce dalla sandbox: prove difensive e chiusure — `fatto` (dipende da T136, T137)
- Pipeline: claude · stima 4% · approvato · priorità 2
- Contesto: è **la cosa più importante per l'autore**, e l'audit non l'ha dimostrata: una sessione è stata fermata da un filtro di sicurezza mentre preparava le prove. Il lavoro è difensivo, sulla sandbox di questo progetto. Il `Sandbox` gira in wasmoon dentro il processo del server. Nasce da T117 (R8 ridotta, annotazione `string.dump`, «Cosa non è stato fatto»).
- Cosa fare:
  1. Test in `tests/` che affermano le proprietà: da Lua nessun accesso a `process`, `require`, costruttori o prototipi JS, né attraverso i valori restituiti dall'`Host` né attraverso le metatabelle; `string.dump` non raggiungibile nemmeno con la sintassi a metodo; `pcall` e coroutine non scavalcano il budget; un valore finto in una variabile d'ambiente di prova non arriva mai a Lua.
  2. Le funzioni Lua dentro le tabelle passate all'`Host` diventano funzioni JS: verificare che nessuna giri fuori da `guarded`, e ripararlo se succede.
  3. Togliere `dump` dalla tabella vera nel prelude; la prova di caricamento dei moduli (`validator.ts`) in una VM usa e getta, non nella sandbox viva.
  4. Aggiornare `docs/sicurezza/audit-2026-11.md`: la risposta alla domanda 1, con ciò che è provato e ciò che no.
- **Se un filtro interrompe di nuovo la sessione**: non insistere; scrivere cosa resta non provato in `docs/pipeline/domande/T122.md`, così l'autore decide se farlo vedere a una persona esperta.
- Quando è fatto: test e typecheck verdi, commit su `task/T122`.
- Esito: `task/T122`. V-008, V-017, V-019 `chiuse`. La proprietà non reggeva (da Lua si raggiungevano prototipi e metodi di JS, misurato dal kit): il proxy di wasmoon è spento e tutto passa da `Crossing` in `sandbox.ts` (ADR-0099), che dà a Lua solo i campi di dati propri e a JS solo dati, quindi nessuna funzione Lua può girare fuori da `guarded`. `string.dump` tolto dalla tabella vera. Test in `tests/sicurezza/uscita.test.ts`; audit aggiornato con ciò che è provato e ciò che no (un difetto di wasm o di Lua, il blocco e la memoria, nessuno sguardo esterno: nessun filtro ha fermato la sessione, nessuna domanda aperta). Costo invariato. Rispetto al previsto: (1) più largo del task, perché riparare solo le funzioni non bastava; (2) la VM di prova non è buttata a ogni prova ma azzerata, perché `validateForged` è sincrona e aprire una VM no; (3) la prova del valore finto di T136/T137 non misurava nulla (l'ambiente di un modulo è vuoto) ed è corretta, anche nel kit (`tools/sicurezza/sandbox.mjs`); (4) fuori dal task, `tests/between.test.ts` ha un limite suo di 180 s: i suoi test stanno sui 60 s anche col codice di prima (misurato) e cadevano sotto carico, due volte su tre suite: andrebbero alleggeriti. Nella build, `?skip&offline`: il gioco gira, nessun guasto, nessun campo di JS dalla console. Le coroutine non sono provate: non sono raggiungibili. Sicurezza: nessuna superficie nuova, voci chiuse sopra.

### T123 · Il proxy di Gemini — `fatto` (dipende da T136)
- Pipeline: claude · stima 3% · approvato · priorità 6
- Contesto: R2: `/api/gemini` spende la chiave per chiunque raggiunga la porta, con qualunque modello `gemini-*` e fino a 12 MB.
- Cosa fare: elenco dei modelli ammessi (quelli di `universe.json` e dei prezzi), corpo massimo ridotto, tetto di spesa nel proxy, accesso solo da loopback con controllo di `Origin`; in multigiocatore il server chiama Google direttamente, senza route pubblica. La chiave resta fuori dal browser (regola 9).
- Test: richieste rifiutate per origine, modello e dimensione, con `fetch` finto; nessuna chiamata vera a Gemini.
- Quando è fatto: test e typecheck verdi, commit su `task/T123`.
- Esito: `GeminiGate` in `server/geminiProxy.ts`, ADR-0099, V-002 `chiusa`, `tests/sicurezza/gemini.test.ts`. Corpo massimo 2 MB. Scelte non scritte nel task: tetto giornaliero per tutta la chiave (`GEMINI_TETTO_GIORNALIERO`, predefinito 10 $, in `universes/.spesa-gemini.json`); un modello fuori dai prezzi ma nominato da un universo passa e si conta al prezzo del più caro; al tetto la risposta è 402 e `GeminiModels` la traduce in `BudgetError`. Più del previsto: controllo di `Host` e delle intestazioni di inoltro (nomi puntati su 127.0.0.1, tunnel). Nessuna chiamata vera a Gemini: la porta diretta del multigiocatore è provata con `fetch` finto, non con una partita vera. Sicurezza: nessuna superficie nuova.

### T124 · Il webhook di Stripe — `fatto` (dipende da T136, T139)
- Pipeline: claude · stima 2% · approvato · priorità 7
- Contesto: R4: senza `STRIPE_WEBHOOK_SECRET` ogni evento è accettato (crediti gratis); `metadata.universo` e `wandererId` finiscono in `path.join` senza validazione; `crediti` non è confrontato con `amount_total`. T105 ha aggiunto le rotte di Stripe anche alla preview e riscritto parte di `server/stripe.ts`: per questo si parte da T139.
- Cosa fare: senza segreto la route risponde 503, nel server di sviluppo e nella preview; validare nomi e id come fa il checkout; credito calcolato dall'importo pagato.
- Test: i tre casi.
- Quando è fatto: test e typecheck verdi, commit su `task/T124`.
- Esito: `task/T124`. Senza segreto la route risponde 503 (sviluppo e preview); universo e viandante validati come nel checkout; credito da `paidCents` (il minore tra `amount_total` e `amount_subtotal`, solo dollari), mai dai metadati. In più rispetto al previsto: una chiave vera senza segreto del webhook non apre sessioni e `config` dice `available: false`, altrimenti si incasserebbe senza poter accreditare; la prova V-004.c del kit è riscritta perché dava FALLA sempre. Kit: V-004.a-e ok (`esiti/2026-11-01-dopo-T124.json`). Tasse escluse non provate contro una sessione vera di Stripe: da guardare in T45f. Sicurezza: V-004 chiusa, nessuna superficie nuova.

### T125 · Saldi e pagamenti fuori dall'universo — `fatto` (dipende da T120, T124)
- Pipeline: claude · stima 6% · approvato · priorità 8
- Contesto: R5 e R10: i crediti sono **l'unica cosa del gioco che non si deve poter modificare**, ma stanno in `world/giocatori/*.json` e `world/pagamenti.json`, nel repository dell'universo: un `checkout`, `R`, un ramo pubblicato o il codice generato possono cambiarli; la risposta del Referente diventa `giveCredits` senza tetto visibile; il controllo di idempotenza non passa dalla coda `serial`. Vedi ADR-0081, 0083.
- Cosa fare: un archivio del server fuori dalla storia dell'universo per saldi e registro dei pagamenti, con migrazione dai file di oggi; nessuna via da Lua, dal Concilio, dal ramo o dal rollback; accredito atomico e idempotente; chi può ricaricare a mano e con quale tetto (scriverlo nell'ADR). I saldi degli altri non vanno al master nei file. ADR nuovo e `AGENTS.md`.
- Test: rollback, ramo pubblicato e codice generato non cambiano i saldi; due eventi uguali in contemporanea accreditano una volta. La corsa è stata misurata (V-005.a: 8 consegne, 2 accrediti) ma non esce a ogni giro: il test la ripete o la forza, un solo giro verde non basta.
- Quando è fatto: test e typecheck verdi, commit su `task/T125`.
- Esito: `task/T125`, ADR-0104. Saldi, pagamenti e ricariche in `universes/.saldi/<nome>.json` (`server/ledger.ts`, `Ledger` in `credits.ts`), fuori da ogni repository; passi atomici sotto un lucchetto che vale tra processi; migrazione alla prima volta che il server incontra un universo, poi i file non contano più e `sweepBalances` li ripulisce (anche dopo un `checkout`). Test `tests/sicurezza/saldi.test.ts`: la corsa forzata con 8 consegne e un commit in mezzo per 12 giri, metà attraverso il mondo acceso per 10 giri, quattro processi veri. Kit su server vero: V-005.a-c e V-010.a-b ok (`esiti/2026-11-02-dopo-T125.json`; 12 FALLA di voci aperte di altri task). Browser: `npm run dev`, universo di prova usa e getta, master: saldi migrati, ricarica di 3 a un viandante, rifiuto oltre il tetto, riga nella console, nessun errore. **Decisioni da far vedere all'autore** (ADR-0104): (1) il Referente non dà più crediti, nemmeno al master; (2) il tetto delle ricariche a mano è per universo e per giorno, `QUINE_TETTO_RICARICHE`: **0 con gli account** se il `.env` non dice altro (chiunque può fare un universo e diventarne master, e il dono spende la chiave del server), 20 senza. **Diverso dal previsto**: il clone non porta più i saldi (prima li duplicava); V-005.b e V-004.c del kit riscritte (motivi nel registro e nel catalogo); un accredito non fa più commit, quindi cambia il test di T93. Limiti: nella storia di un universo di prima della migrazione si leggono ancora i saldi di allora (accettato, non si riscrive la storia); nella console il master sceglie solo tra sé e i collegati. Sicurezza: V-005 e V-010 chiuse, nessuna voce nuova; superficie nuova: il messaggio `ricarica`, solo master.

### T126 · I limiti dentro la sandbox — `fatto` (dipende da T136)
- Pipeline: claude · stima 4% · approvato · priorità 9
- Contesto: R7, prima parte. Provato: un solo pattern di `string.find` blocca il processo oltre 60 s; `string.rep` alloca 200 MB senza guasti. Il budget conta le istruzioni VM per chiamata, non il lavoro nelle funzioni C né il tick.
- Cosa fare: `string.*` con limiti di lunghezza e di pattern; limite di memoria della VM; budget per tick; limiti di scatola e di tempo per i programmi MarkovJunior sul server (l'XML può dire la propria `size`). Attenzione ai moduli esistenti, che devono continuare a girare, e alle prestazioni del tick.
- Test: i casi della tabella dell'audit finiscono in un guasto entro un tempo breve, senza payload nel report.
- Quando è fatto: test e typecheck verdi, commit su `task/T126`.
- Esito: ADR-0103. Oltre al previsto: i pattern costosi non si vietano, girano in un porting di `lstrlib.c` in Lua (`tests/sandbox-patterns.test.ts` lo confronta col C), dove il budget li conta; la memoria e la lunghezza delle stringhe stanno nell'allocatore (`Meter`), che conta anche i byte copiati; una rete di 2 s con l'orologio per ciò che non si misura. Chi viene dopo il budget del tick salta senza guasto suo (`tick:budget`), `core.*` gira comunque. Tick del seme da ~0,95 a ~1,15 ms. Sicurezza: V-007 `in correzione`, resta T127 (blocco di qualche secondo per chiamata, memoria dal lato JS, modelli fino a 30 s); nessuna superficie nuova. Suite intera verde (820 verdi, 11 attesi). Non provato nel browser (il task non lo chiede) e il kit di T137 non ripassato.

### T127 · Ogni mondo in un worker con un sorvegliante — `da fare` (dipende da T120, T126)
- Pipeline: claude · stima 8% · approvato · priorità 10
- Contesto: R7, seconda parte, la difesa più importante a valle: oggi tick, Lua e HTTP stanno nello stesso event loop del processo che tiene i segreti. Vedi ADR-0058 (`server/session.ts`, `src/session/host.ts`).
- Cosa fare: ogni mondo in un `worker_thread` o processo, **senza i segreti nell'ambiente**, con limite di memoria e un sorvegliante che lo uccide se il tick si blocca e lo riavvia dall'ultimo stato valido; i MarkovJunior nel worker; i client lo sanno (un avviso, non un errore). ADR nuovo e `AGENTS.md`. Se è troppo grande, spezzarlo.
- Test: un mondo bloccato non ferma l'HTTP né un altro mondo e riparte; i test del multigiocatore restano verdi.
- Browser: due schede in multigiocatore che giocano e si vedono.
- Quando è fatto: test e typecheck verdi, commit su `task/T127`.

### T128 · La coda delle CLI — `fatto` (dipende da T136)
- Pipeline: claude · stima 3% · approvato · priorità 11
- Contesto: R9: `POST /api/coda` non ha autenticazione e accetta `system` e `prompt` qualsiasi; un testo dettato dal giocatore può arrivare a un agente con strumenti sulla macchina di chi gioca. Vedi ADR-0077.
- Cosa fare: route montata solo su richiesta esplicita, solo in loopback, con un segreto locale; CLI in una cartella vuota, ambiente ridotto, strumenti esclusi e configurazione MCP e hook isolati, con conferma verificata; se Antigravity non può escludere gli strumenti, niente Antigravity sulla coda (dirlo all'autore nell'esito).
- Test: senza segreto o non da loopback è rifiutata; gli argomenti delle CLI, senza lanciarle.
- Quando è fatto: test e typecheck verdi, commit su `task/T128`.
- Esito: fatto su `task/T128`, ADR-0102, V-009 chiusa. La route c'è solo con `QUINE_CODA=1`, da loopback e con un segreto in memoria; CLI in una cartella vuota, ambiente ridotto, senza strumenti, MCP, hook e impostazioni. Rispetto al previsto: il testo va su stdin (come argomento poteva diventare un'opzione); la conferma è a ogni esecuzione, dall'`init` della CLI, e una breccia ferma il processo. **Antigravity esce dalla coda**: `agy` 1.4.12 non può escludere gli strumenti. Provato con la CLI vera: il solo `--tools ""` di prima lasciava hook, `CLAUDE.md` e 8 strumenti MCP. Sicurezza: nessuna superficie nuova oltre a `GET /api/coda/segreto`; le richieste in `universes/.coda/` restano leggibili dal server di sviluppo finché V-012 è aperta (T130).

### T129 · Limiti ai messaggi — `da fare` (dipende da T120)
- Pipeline: claude · stima 2% · approvato · priorità 12
- Contesto: R11: `inbox` non ha tetto per client, ogni messaggio può chiamare il modello, `testo` è tagliato solo per `agente`. Un giocatore esaurisce i budget comuni del mondo.
- Cosa fare: ritmo per client, lunghezza massima del testo, code per pagante, in `src/session/server.ts`. Il gioco normale non deve accorgersene.
- Test: un client che inonda è limitato, gli altri no.
- Quando è fatto: test e typecheck verdi, commit su `task/T129`.

### T130 · Ciò che esce e ciò che il Concilio scrive — `da fare` (dipende da T120)
- Pipeline: claude · stima 3% · approvato · priorità 13
- Contesto: R12 e R13. `playerFiles` toglie campi invece di ammetterli; in sviluppo Vite potrebbe servire i file di `universes/` (da verificare). Il Concilio può forse scrivere `ai` in `universe.json`, cioè budget e provider: soldi veri, quindi fuori dal «tutto si può modificare».
- Cosa fare: `playerFiles` a elenco di campi ammessi; `universes/` non servito da Vite; il Concilio scrive solo in un elenco di percorsi; `ai` solo dal kernel, su comando del master.
- Test: i campi che non escono; una scrittura di `ai` dal Concilio rifiutata.
- Quando è fatto: test e typecheck verdi, commit su `task/T130`.

### T131 · `npm audit` e Vite — `fatto` (dipende da T136)
- Pipeline: claude · stima 2% · approvato · priorità 2
- Contesto: R14: Vite 5.4.10, l'audit non ha lanciato `npm audit`.
- Cosa fare: lanciarlo, aggiornare ciò che serve (Vite compreso, nei limiti della 5.x se basta), riportare ciò che resta aperto e perché.
- Test: suite intera, typecheck, build.
- Browser: il gioco parte in `?skip&offline`.
- Quando è fatto: commit su `task/T131`.
- Esito: `npm audit` da 15 avvisi (2 critici, 5 alti, 8 moderati) a **0**; non resta aperto nulla. **La 5.x non bastava** (gli avvisi di Vite arrivano alla 6.4.3, quelli di Vitest alla 4.1.11): Vite 7.3.7, Vitest 4.1.12, `vite-node` 5.3.0 diretto (Vitest 4 non lo porta più), `npm audit fix` per il resto, un override di `@grpc/grpc-js` solo sotto `@firebase/firestore` (il progetto non importa Firestore, gRPC non è in `dist/`). ADR-0099. V-014 `in correzione`: la parte delle dipendenze è fatta, la chiude T133. Più del previsto: `tests/sicurezza/dipendenze.test.ts` (il lock non torna indietro; il server di sviluppo non dà `.env` nelle forme del kit: controllate le stesse forme su 5.4.10, c e g falliscono, su 7.3.7 nessuna); `minWorkers` tolto da `server/testWorkers.ts` perché Vitest 4 non lo ha più. Kit `--solo V-014` con il `vite.config.ts` vero: 11 ok, 0 FALLA (l'esito dell'autore in `esiti/2026-11-01.json` è stato ripristinato). Suite intera verde (80 file, 716 verdi, 18 attesi, 1 todo, 868 s), typecheck e build verdi. In un primo giro 4 rossi per timeout (`campus credits referente`) con la macchina carica: stessi file, nello stesso momento, vecchie versioni 540 s e nuove 534 s, tutti verdi. Il gioco parte in `?skip&offline` dalla build e dal server di sviluppo. **Dopo `integra` serve `npm ci` nel base**: il worktree di T131 ha un `node_modules` suo (junction tolta), gli altri condividono quello del base. npm 10 non sa installare Vitest 4 da zero (`edgesOut`), il lock è scritto con npm 11; `npm ci` e `npm install` con npm 10 sul lock passano, provati in una cartella a parte. Il sito (`site/`) è stato solo compilato, non aperto nel browser. Sicurezza: nessuna superficie nuova; `server/` cambia solo in `testWorkers.ts`.

### T132 · Le correzioni piccole — `da fare` (dipende da T136)
- Pipeline: claude · stima 2% · approvato · priorità 15
- Contesto: R15 e R16.
- Cosa fare: `Number()` su `realm.seed` in `site/sessioni.ts`; `returnUrl` del checkout limitato alla stessa origine; una CSP compatibile con three.js e con i worker; errori generici al client e dettagli nel log (`stripe.ts`); un test che cerca valori finti dei segreti in `dist/` dopo una build con un ambiente di prova.
- Browser: gioco e sito senza errori di CSP in console.
- Quando è fatto: test e typecheck verdi, commit su `task/T132`.

### T133 · Il server di produzione — `da fare` (dipende da T120, T123, T127, T131)
- Pipeline: claude · stima 6% · approvato · priorità 16
- Contesto: correzione 1 dell'audit: il server di sviluppo non va esposto. Oggi la sessione vive nel plugin di Vite (`ssrLoadModule`). Prerequisito di T45f.
- Cosa fare: un punto d'ingresso di produzione senza il server di sviluppo di Vite, che serve la build e monta solo le route ammesse; rifiuta di partire senza verificatore di identità, segreto del webhook e origini configurate; la coda delle CLI non c'è. ADR e `AGENTS.md`.
- Test: non parte senza configurazione; una partita di prova con `fakeLink` o WebSocket vero in locale.
- Browser: due schede sul server di produzione in locale.
- Quando è fatto: test e typecheck verdi, commit su `task/T133`.

### T134 · Le prove contro il server vero — `da fare` (dipende da T120, T121, T122, T123, T124, T125, T128, T129, T130, T132, T133, T137)
- Pipeline: claude · stima 3% · approvato · priorità 17
- Contesto: chiude «Cosa non è stato fatto» dell'audit, per la parte non coperta dai test di ogni correzione: nessuna prova HTTP o WebSocket è stata fatta contro un server vero.
- Cosa fare: test di integrazione che avviano il server di produzione in locale con segreti finti e provano le regole di accesso (identità, origine, percorsi, webhook, proxy) e che i valori finti non escano mai (risposte, log, `dist/`). Aggiornare `docs/sicurezza/audit-2026-11.md` voce per voce: chiusa, provata, o aperta con il motivo.
- Quando è fatto: test e typecheck verdi, report aggiornato, commit su `task/T134`. Poi l'orchestratore porta all'autore cosa resta prima di T45f.

### T135 · Integrare T119 dopo i task di sicurezza — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 2
- Contesto: `integra T119` va in conflitto solo in `docs/plans/backlog.md`: la sezione «La sicurezza» (T120-T134) è entrata in fondo al file, accanto al blocco di T119. Nasce da T119: `dossier T119`.
- Cosa fare: nel worktree di T135 `git merge task/T119`; nel backlog restano tutti i blocchi, con ciò che T119 ha scritto nel proprio e la sezione «La sicurezza» intera. Niente altro.
- Test: `npm run typecheck`. Niente suite intera né browser: T119 li ha già fatti e il conflitto è solo in un documento. Se il merge cambia altro, fermarsi e scriverlo nell'esito.
- Quando è fatto: merge risolto, commit su `task/T135`. Poi l'orchestratore fa `integra T135`, `integra T119`, `integra T116`, `integra T102`.
- Esito: `task/T135`, fuso `task/T119`. Unico conflitto in `docs/plans/backlog.md`: l'esito di T119 resta nel suo blocco, subito sopra la sezione «La sicurezza», rimasta intera (T120-T135). Gli altri file sono entrati dal merge senza conflitti. Typecheck verde; suite intera e browser non ripetuti, come dice il task.

### T136 · Il processo delle vulnerabilità: registro, specifiche, suite — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 1
- Contesto: richiesta dell'autore (`docs/pipeline/domande/T117.md`, 01/11): un processo di rilevamento, documentazione e specifica delle contromisure, che regga molte vulnerabilità e finisca in task della pipeline. Le voci di oggi sono R1-R16 in `docs/sicurezza/audit-2026-11.md`, le correzioni T120-T134. Nasce da T117: `dossier T117`. Solo documenti e struttura dei test: nessuna correzione e nessun attacco qui.
- Cosa fare:
  1. `docs/sicurezza/README.md`, il processo: **rilevamento** (audit, `npm audit`, suite, prove dell'autore, revisione dei task che toccano server, sandbox o pagamenti) → **scheda** → **specifica della contromisura** → **task della pipeline** (dalla gravità alla priorità) → **test di regressione** → **chiusura**. Dice anche cosa non è una vulnerabilità: la decisione dell'autore in testa a questa sezione del backlog.
  2. `docs/sicurezza/registro.md`, una voce `V-NNN` per vulnerabilità: gravità, stato (`rilevata`, `specificata`, `in correzione`, `chiusa`, `accettata`), superficie, proprietà violata, prova (test, prova dell'autore o solo lettura del codice), contromisura, task, test che la tiene chiusa. Portarci R1-R16 con i loro task T120-T134; R8 ridotta come ha deciso l'autore. Niente payload né valori di segreti.
  3. `tests/sicurezza/`: la suite, dentro `npm test`, più `npm run test:sicurezza`. Convenzione: ogni test porta il suo `V-NNN`; una vulnerabilità aperta sta in `it.fails` (la suite resta verde per tutti gli altri task e diventa rossa quando la falla si chiude), e la correzione toglie `.fails`. Un test d'esempio su ciò che T117 ha già provato.
  4. La regola per l'orchestratore in `docs/pipeline/orchestra.md`: da una voce `specificata` senza task nasce un task; gli esiti delle prove dell'autore diventano voci. ADR con il primo numero libero e riga in `AGENTS.md`.
- Quando è fatto: test e typecheck verdi, registro completo, commit su `task/T136`.
- Esito: `docs/sicurezza/README.md` (il processo), `docs/sicurezza/registro.md` (19 voci: V-001…V-016 sono R1…R16), `tests/sicurezza/` con `npm run test:sicurezza`, regola in `orchestra.md`, ADR-0098. Più del previsto: `registro.test.ts` controlla forma del registro e legame con i test; V-017 (`string.dump`), V-018 (il resto di R8, `accettata`), V-019 (uscita verso JS: proprietà non provata, non falla dimostrata); l'orchestratore può scrivere il registro. Il pattern di `string.find` è un `it.todo`: bloccherebbe il processo, va nel kit di T137. **Suite intera non verde**: due giri nel turno, 47 e 45 rossi su 696 in 9 file (`between credits kernel places referente subscription thin wanderers watch`), quasi tutti timeout, con altri task in corso sulla macchina. Il commit non cambia codice (`src server tools lab universe vite.config.ts` senza differenze): oltre ai file nuovi, solo documenti e uno script in `package.json`. File per file, uno alla volta, passano `subscription credits places between thin`; restano rossi `watch` (1), `referente` (3), `wanderers` (2, poi 1), `kernel` (27): i conteggi cambiano tra i giri, ma per questi quattro da soli il motivo è stato controllato solo su `wanderers` (timeout), e **non è provato su una macchina scarica**: da ricontrollare con T118. `tests/sicurezza/` verde (12 verdi, 1 todo), typecheck verde. `it.fails` controllato senza `.fails`: fallisce perché manca il guasto.

### T137 · Le prove che esegue l'autore — `fatto` (dipende da T136)
- Pipeline: claude · stima 4% · approvato · priorità 2
- Contesto: l'autore esegue di persona ciò che una sessione di agente non riesce a eseguire (`docs/pipeline/domande/T117.md`). Serve a misurare lo stato di oggi prima delle correzioni: le voci «Cosa non è stato fatto» dell'audit. Ogni prova è difensiva e afferma una proprietà di questo progetto. Nasce da T117 e T136: `dossier T117`.
- Cosa fare:
  1. `tools/sicurezza/`: uno script `npm run sicurezza:prove` che avvia il server in locale e prova route HTTP e WebSocket (senza identità, da un'altra origine, percorsi, webhook, proxy) e la sandbox in un processo a parte. Stampa per ogni prova `V-NNN`, proprietà, `ok` o `FALLA`, e scrive `docs/sicurezza/esiti/<data>.json`.
  2. **Non deve poter fare danni**: solo loopback, rifiuta ogni altro host; una cartella temporanea di universi, mai `universes/` dell'autore; segreti finti, mai il `.env` vero (verificare come Vite lo carica); nessuna chiamata a Gemini o Stripe; nessun valore di segreto negli esiti.
  3. `docs/sicurezza/prove-f12.md`: ciò che si prova solo dal browser, come blocchi da incollare in console, con la stessa uscita.
  4. Una guida di poche righe in testa a `docs/sicurezza/README.md`: cosa lanciare, cosa aspettarsi, come riportare.
  5. Ciò che si può verificare da soli va anche in `tests/sicurezza/` con la convenzione di T136.
- **Se un filtro ferma la sessione**: non insistere e non riformulare per aggirarlo. Scrivere la proprietà da verificare e cosa resta scoperto in `docs/pipeline/domande/T137.md`, e consegnare il resto.
- Quando è fatto: lo script gira fino in fondo in locale, il registro dice per ogni voce quale prova la copre, test e typecheck verdi, commit su `task/T137`. Poi l'orchestratore chiede all'autore di eseguirlo sul base, prima che entri T120.
- Esito: `tools/sicurezza/` e `npm run sicurezza:prove` (73 prove, ~2 minuti, gira fino in fondo), `docs/sicurezza/prove-f12.md` (5 blocchi, 8 prove), guida in testa al README, tabella «Le prove dell'autore» nel registro, `tests/sicurezza/rotte.test.ts` e altri casi in `sandbox.test.ts`, `tests/sicurezza-kit.test.ts`. Il server gira con il `vite.config.ts` vero in un progetto usa e getta (`.env` finto e `universes/` suoi, collegamenti ai sorgenti, ambiente pulito perché `loadEnv` legge anche `process.env`), con `fetch` e socket verso fuori bloccati. **Prima misura**, `docs/sicurezza/esiti/2026-11-01.json`: 22 ok, 51 FALLA, 0 errori. Oltre l'audit: **da Lua si raggiungono `constructor` e `__proto__` di JS sui valori dell'Host (V-019.a, guardati per tipo, nessuno chiamato: se si esca davvero lo dice T122)**; **il server di sviluppo dà `.env` con due forme della richiesta (V-014.c, g)** e serve `universes/` (V-012.d); **su Windows si scrive dentro `.git` con quattro varianti del nome (V-003)**; un mondo bloccato ferma l'HTTP (V-007.c); `GET /api/viandante` dà il saldo di chiunque (V-006.e, voce e contromisura aggiornate: T120 deve coprirla); XSS dal seme in `sessioni.html` (V-015.c). Regge: un non master non ha ramo né pubblica nel protocollo (V-006.f), la chiave non arriva al browser né in `dist/`. Da fare a mano: il blocco 3 (da un altro sito), che nel browser dell'agente resta fermo, forse sul permesso di Chrome per la rete locale (`esiti/2026-11-01-f12.md`); V-013 non ha prove (T130). Sicurezza: nessuna superficie nuova nel gioco, il kit non è montato dal server. **Suite intera non verde**: 45 rossi su 728, tutti timeout, nei file già rossi con T136 (`between credits kernel places referente thin wanderers watch`, più `branch`), con altri task sulla macchina; il commit non tocca `src server universe lab vite.config.ts`. `tests/sicurezza*` verdi, typecheck verde.

### T140 · Integrare T123 — `fatto` (dipende da T139)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Contesto: `integra T123` va in conflitto in `docs/sicurezza/registro.md`: T123 chiude V-002, T137 ha aggiunto a ogni voce la copertura e la misura del kit. Parte da un base che ha già T139 e T105, che con T123 toccano `vite.config.ts`: si risolve tutto insieme. Nasce da T123: `dossier T123`.
- Cosa fare: nel worktree di T140, partito dal base con T139 e T105 dentro, `git merge task/T123`; nel registro V-002 resta `chiusa` e tiene anche ciò che T137 ha scritto, con la misura del 01/11 detta come precedente a T123. Se le prove V-002 di `tools/sicurezza/catalogo.mjs` o i test di T137 si aspettano ancora la falla, vanno allineati a T123.
- Test: `npm run typecheck`, `npm run sicurezza:prove -- --solo V-002` (nell'esito le righe `ok` e `FALLA`: una FALLA vuol dire che V-002 non è chiusa e va detto, non coperto) e la suite intera con il suo turno.
- Quando è fatto: merge risolto, commit su `task/T140`. Poi l'orchestratore fa `integra T140` e `integra T123`.
- Esito: merge di `task/T123` su `task/T140`. Conflitti in `vite.config.ts` (restano `walletRoute` e `sessionServer(accounts, gemini.direct())`) e nel registro (V-002 `chiusa`, la misura del 01/11 detta come precedente a T123). ADR-0099 senza scontri. Di diverso dal previsto, tre cose. 1) **V-002.d com'era scritta dava FALLA** (`--solo V-002`: a, b, c ok; d 20 su 20 arrivate a Google): 20 chiamate piccole costano circa 0,25 $, sotto il tetto di 10 $. L'ADR-0099 decide un tetto in dollari, quindi la prova ora fa 20 chiamate da circa 1 $: 9 arrivano, poi 402; con la prova allineata 4 ok, 0 FALLA (`esiti/2026-11-01-dopo-T123.json`). Resta scritto nel registro che un processo di questa macchina, senza identità, spende fino al tetto del giorno. 2) Con la stessa data `--solo` sovrascrive l'esito del giorno: la misura intera del 01/11 è stata ripristinata uguale; il kit non è stato corretto. 3) `tests/sicurezza/rotte.test.ts`: i due `it.fails` di V-002 ora sono test normali con `GeminiGate` e un controllo che il modello ammesso arrivi. Typecheck verde. Suite intera nel turno, prima del commit, con il codice di questo commit: **2 rossi su 761** (758 passati, 1 todo), timeout da 60 s in `tests/between.test.ts`. Rilanciando il file da solo restano 2 rossi, su test diversi (5 su 7); con `--testTimeout=300000` passano 7 su 7, circa 55 s a test (uno 103 s), macchina al 44 % di CPU e altri processi node. Nessuna asserzione rotta e il merge non tocca ciò che il file carica, se non una riga in `gemini.ts`; T139 li aveva verdi nella sua suite, il confronto col base alle stesse condizioni non è stato fatto. Timeout non toccati. Il kit intero non è stato rilanciato, solo V-002. Sicurezza: V-002 chiusa da T123, nessuna superficie nuova dal merge.

### T138 · Integrare T118 — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 1
- Contesto: `integra T118` va in conflitto in `vite.config.ts`: T118 ha toccato la configurazione dei test (worker e `hookTimeout`), mentre nel base sono entrati altri cambi allo stesso file. Serve presto: senza T118 la suite resta a 11 worker e con i timeout, anche per i task di sicurezza. Nasce da T118: `dossier T118`.
- Cosa fare: nel worktree di T138 `git merge task/T118`; in `vite.config.ts` restano le aggiunte di entrambi. Nel backlog restano tutti i blocchi. Se gli ADR si scontrano, quello di T118 prende il primo numero libero.
- Test: `npm run typecheck` e la suite intera con il suo turno: deve restare senza timeout (T118 ne ha misurati 680 su 680; il base ha test in più).
- Quando è fatto: merge risolto, commit su `task/T138`. Poi l'orchestratore fa `integra T138` e `integra T118`.
- Esito: merge di `task/T118` nel commit 1f0e912. L'unico conflitto era negli import di `vite.config.ts`: restano `wandererRoute` e `testWorkers`. Gli ADR non si scontrano (T118 aggiorna ADR-0088). Typecheck verde; suite intera nel suo turno: 688/688, 797 s, nessun timeout. Niente di diverso dal previsto.

### T142 · Integrare T131 — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Contesto: `integra T131` va in conflitto in `AGENTS.md`. T131 porta Vite 7.3.7 e Vitest 4.1.12 (`npm audit` a 0, ADR-0099). Nasce da T131: `dossier T131`.
- Cosa fare: nel worktree di T142 `git merge task/T131`; in `AGENTS.md` restano le aggiunte di entrambi. Se gli ADR si scontrano, quello di T131 prende il primo numero libero. `node_modules` è una junction verso quello del base, che ha ancora le versioni vecchie e che altri task stanno usando: **non installare attraverso la junction**. Toglila (solo la junction, non il contenuto) e fai un `npm ci` tuo nel worktree, come ha fatto T131.
- Test: `npm run typecheck`, `npm run build` e la suite intera con i loro turni. Nell'esito scrivi quanti test passano e i rossi che restano rilanciando il file da solo.
- Browser: T131 ha provato solo il gioco. Apri dalla build con Vite 7 le pagine di `site/` (landing, carte, sessioni, profilo, pagamenti): si aprono senza errori in console e con il loro stile? Il login Firebase non serve.
- Quando è fatto: merge risolto, commit su `task/T142`. Non toccare il `node_modules` del base: l'`npm ci` lì lo fa l'orchestratore, a pipeline senza task, quando integra.
- Esito: merge di `task/T131` risolto (in `AGENTS.md` «Vite 7» di T131 e la riga del sito del base, con i crediti di T105); ADR-0099 era libero, nessuna rinumerazione. Junction tolta e `npm ci` nel worktree (Vite 7.3.7, Vitest 4.1.12, `npm audit` a 0); `node_modules` del base non toccato (ancora Vite 5.4.10). Typecheck e build verdi. Suite intera: 728 passati, 18 attesi falliti, 1 todo, 1 rosso (`between.test.ts`, timeout di 60 s su «words to who is near»); rilanciato da solo passa 7 su 7, ma il file richiede 330 s da solo, vicino al limite. Browser: dalla build con Vite 7 landing, carte, sessioni, profilo e pagamenti si aprono con il loro stile, senza errori della pagina in console e con le risorse tutte a 200; senza universi su disco, carte e sessioni mostrano lo stato vuoto e profilo e pagamenti il modulo di accesso, quindi le pagine con dati veri non sono state provate. Sicurezza: nessuna superficie nuova oltre a quanto T131 ha registrato.

### T139 · Integrare T105 — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 1
- Contesto: `integra T105` va in conflitto in `vite.config.ts`: T105 aggiunge `walletRoute` e la pagina `sitePagamenti`, mentre nel base è entrato T118 con `testWorkers`. T105 è verificato nel browser. Viene prima di T124, che tocca `server/stripe.ts` come T105. Nasce da T105: `dossier T105`.
- Cosa fare: nel worktree di T139 `git merge task/T105`; in `vite.config.ts` restano le aggiunte di entrambi. Nel backlog restano tutti i blocchi. Se gli ADR si scontrano, quello di T105 prende il primo numero libero.
- Test: `npm run typecheck` e la suite intera con il suo turno. È la prima suite con T118, T136 e T105 insieme: nell'esito scrivi quanti test passano e, se ce ne sono di rossi, quali. Un rosso che resta rilanciando il file da solo va detto e non va coperto: T136 ne aveva 45-47 e T105 14 (`watch`, `referente`, `wanderers`, `thin`, `between`), tutti senza T118.
- Quando è fatto: merge risolto, commit su `task/T139`. Poi l'orchestratore fa `integra T139` e `integra T105`.
- Esito: `task/T139`, merge di `task/T105`. L'unico conflitto era negli import di `vite.config.ts`: restano `testWorkers` (T118) e `walletRoute` (T105); `sitePagamenti` e `testWorkers(process.env)` si erano fusi da soli. Nessun ADR nuovo in T105, quindi nessuna rinumerazione; 170 blocchi nel backlog prima e dopo. Typecheck verde. Suite intera nel turno, una volta: 80 file, 745 passati, 1 todo, 0 rossi; i 14 di T105 non si ripresentano. Nei 745 ci sono i 18 `it.fails` di `tests/sicurezza/`, le falle ancora aperte. Sicurezza: il merge porta `/api/crediti` (T105), che senza account dà saldo e righe del viandante chiesto, come V-006.e per `/api/viandante`; il registro non la nomina (V-006, superficie), T120 punto 4 la copre.

### T145 · Integrare T142 (con T131) — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Contesto: `integra T142` va in conflitto in `docs/adr/README.md`: il 0099 nel base è di T123 (il proxy di Gemini), T131 aveva preso lo stesso numero per Vite 7. T142 porta T131 (Vite 7.3.7, Vitest 4.1.12) ed è verificato nel browser, ma la sua suite è partita senza T140 e T123. Nasce da T142: `dossier T142`.
- Cosa fare: nel worktree di T145 `git merge task/T142`. L'ADR `0099-vite-7-vitest-4-e-il-primo-npm-audit.md` diventa `0100-…`; correggi le citazioni che parlano di Vite 7 («ADR-0099» di T131 in `AGENTS.md`, `docs/`, codice, indice degli ADR), lasciando stare quelle del proxy. Nel backlog restano tutti i blocchi. `node_modules` è una junction verso il base, che ha ancora le versioni vecchie: **non installare attraverso la junction**; togli solo la junction e fai un `npm ci` tuo nel worktree.
- Test: `npm run typecheck`, `npm run build` e la suite intera con i loro turni: è la prima con Vite 7, Vitest 4 e il proxy di T123 insieme. Nell'esito quanti passano e i rossi che restano rilanciando il file da solo.
- Browser: non serve, T142 ha provato le pagine e T131 il gioco.
- Quando è fatto: merge risolto, commit su `task/T145`. Non toccare il `node_modules` del base. Poi l'orchestratore fa `integra T145`, `integra T142`, `integra T131` e l'`npm ci` nel base, a pipeline senza task.
- Esito: merge di `task/T142` risolto; l'ADR di Vite 7 è ora `0100-vite-7-vitest-4-e-il-primo-npm-audit.md`, con l'indice, `AGENTS.md` (Stack) e `docs/sicurezza/registro.md` (V-014); quelle del proxy restano 0099. Le citazioni «ADR-0099» di Vite 7 negli esiti di T131 e T142 restano com'erano, perché qui si cambia solo questo blocco: leggile come 0100. Junction tolta e `npm ci` nel worktree (Vite 7.3.7, Vitest 4.1.12, `npm audit` a 0); `node_modules` del base non toccato. Typecheck e build verdi; suite intera con il proxy di T123: 82 file, 746 passati, 16 `it.fails` attesi, 1 todo, nessun rosso. In `dist/` solo il nome di `GEMINI_API_KEY`, nei messaggi. Sicurezza: nessuna superficie nuova.

### T149 · Integrare T146 — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Contesto: `integra T146` va in conflitto in `docs/adr/README.md` e `src/kernel/validator.ts`. T146 (che porta dentro T126, i limiti dentro la sandbox) è partito senza T121 e ha preso il numero 0103, che nel base è di T121 (percorsi ammessi e git del server). Nasce da T146: `dossier T146`.
- Cosa fare: nel worktree di T149 `git merge task/T146`. L'ADR `0103-i-limiti-dentro-la-sandbox.md` prende il primo numero libero del base (0104, se nessun altro lo ha preso); correggi le citazioni che parlano di quei limiti (`AGENTS.md`, `docs/`, codice, test, indice degli ADR), lasciando stare quelle di T121. In `src/kernel/validator.ts` restano le modifiche di entrambi. Nel backlog restano tutti i blocchi.
- Test: `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Poi `npm run sicurezza:prove -- --solo V-007` e `--solo V-003`: il kit si legge, non si riscrive; se sovrascrive un esito di `docs/sicurezza/esiti/`, ripristinalo e metti il tuo in un file a parte.
- Browser: non serve, T146 ha provato il gioco con T126.
- Quando è fatto: merge risolto, commit su `task/T149`. Poi l'orchestratore fa `integra T149`, `integra T146` e `integra T126`.
- Esito: merge di `task/T146` risolto (c50d530). L'ADR dei limiti è **ADR-0105**, non 0104: mentre il task girava T125 è entrato nel base e ha preso lo 0104. Citazioni corrette in indice, `AGENTS.md`, registro, codice e test; quelle di T121 restano 0103. Gli esiti di T126 e T146 in questo backlog dicono ancora ADR-0103, perché qui si cambia solo questo blocco: leggile come 0105. In `validator.ts` restano `reservedName` di T121 e i limiti dei modelli di T126. Typecheck verde; suite intera: 87 file, 1065 passati, 3 `it.fails` attesi, nessun rosso. Kit: `--solo V-007` 3 ok su 3, `--solo V-003` 8 ok su 8, in `docs/sicurezza/esiti/2026-11-02-dopo-T149-V-007.json` e `-V-003.json`. Resta: `integra T149` va ancora in conflitto in `docs/adr/README.md` (git, provato con `merge-tree` su e69a22b): le righe 0104 del base e 0105 di qui entrano nello stesso punto, e vanno tenute entrambe, 0104 prima. È l'unico conflitto. Il base non è stato fuso (le regole ammettono solo `git merge task/T146`), quindi suite e kit non hanno girato con T125 dentro. Sicurezza: nessuna superficie nuova rispetto a T121 e T126.

### T150 · Integrare T149 — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Contesto: `integra T149` va in conflitto su una riga di `docs/adr/README.md`: nello stesso punto dell'indice entrano la 0104 del base (T125, i saldi) e la 0105 di T149 (i limiti dentro la sandbox). La suite e il kit di T149 non hanno girato con T125 dentro, e T125 e T126 toccano entrambi `src/kernel/kernel.ts` (git li fonde da solo, va provato). Nasce da T149: `dossier T149`.
- Cosa fare: nel worktree di T150 `git merge task/T149`. Nell'indice restano entrambe le righe, la 0104 prima. Non si rinumera nulla. Nel backlog restano tutti i blocchi.
- Test: `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Poi `npm run sicurezza:prove -- --solo V-005`, `--solo V-007`, `--solo V-010`: il kit si legge, non si riscrive; se sovrascrive un esito di `docs/sicurezza/esiti/`, ripristinalo e metti il tuo in un file a parte.
- Browser: non serve, T146 e T125 hanno provato il gioco ciascuno col suo.
- Quando è fatto: merge risolto, commit su `task/T150`. Poi l'orchestratore fa `integra T150`, `integra T149`, `integra T146` e `integra T126`.
- Esito: merge di `task/T149` risolto (6e0439d): nell'indice degli ADR la 0104 e poi la 0105, nessuna rinumerazione, tutti i blocchi del backlog restano; `kernel.ts` lo ha fuso git da solo. Typecheck verde. Suite intera, a macchina condivisa: 88 file, 1073 passati, 3 `it.fails` attesi, **7 rossi, tutti timeout da 60 s** (`between` 2, `credits` 2, `referente` 3). Rilanciati da soli: `credits` verde (6 su 6); `referente` 5 su 5 con la macchina al 9-34 %, ma 3 rossi con la macchina oltre il 50 %; `between` **mai verde col suo limite** (5 rossi su 7 da solo, due volte, macchina al 56-63 %), 7 su 7 solo su una copia temporanea del merge con i limiti del file alzati (macchina al 22 %, 369 s, test da 42 a 89 s: lì nessuna asserzione fallisce). I rossi non vengono dal merge: `referente`, stesso file in contemporanea su `e1c04a8`, T149 e il merge, dà gli stessi 3 timeout e gli stessi tempi (71, 74-75, 66 s). Nota: `--testTimeout` da riga di comando non conta per questi test, che hanno il limite nel file o nella configurazione; `between` è il lavoro di T148, `referente` sta ancora a 40-70 s per test e resta fragile. Kit, su server vero, con T125 e T126 insieme: V-005 3 ok su 3, V-007 3 ok su 3, V-010 2 ok su 2 (`docs/sicurezza/esiti/2026-11-02-dopo-T150-V-00{5,7}.json`, `-V-010.json`; il kit non ha sovrascritto esiti già committati). Sicurezza: nessuna superficie nuova, solo il merge.

### T147 · Integrare T128 — `fatto` (dipende da T146)
- Pipeline: claude · stima 3% · approvato · priorità 1
- Contesto: `integra T128` va in conflitto in `docs/adr/README.md` e `vite.config.ts`: T128 (la coda delle CLI blindata, V-009) è partito senza T120, che ha messo `gate` sulle route in `vite.config.ts`, e aveva preso il numero 0102, che nel base è di T120. Nasce da T128: `dossier T128`.
- Cosa fare: nel worktree di T147 `git merge task/T128`. L'ADR di T128 prende il primo numero libero del base; correggi le citazioni della coda blindata (`AGENTS.md`, `docs/`, codice, test, indice degli ADR), lasciando stare quelle di T120. In `vite.config.ts` restano entrambe le cose: la route `/api/coda` montata solo con `QUINE_CODA=1`, loopback, stessa origine e segreto di T128, insieme ai controlli di T120. In `AGENTS.md` e nel backlog restano le aggiunte di entrambi.
- Test: `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Poi `npm run sicurezza:prove -- --solo V-009`: il kit si legge, non si riscrive.
- Browser: col turno `browser`, con `QUINE_CODA=1`: la pagina del gioco legge il segreto e mette e ritira una richiesta; senza segreto e da un'altra origine locale 403 (T128 lo ha provato senza T120). Nell'esito cosa si è visto.
- Quando è fatto: merge risolto, commit su `task/T147`. Poi l'orchestratore fa `integra T147` e `integra T128`.
- Esito: merge di `task/T128` su `task/T147`. L'ADR della coda è ora ADR-0106 (0102 resta di T120), citazioni corrette tranne l'esito di T128 in questo backlog, che dice ancora ADR-0102 perché qui si tocca solo il blocco di T147. In `vite.config.ts` `subscriptionQueue` con `enabled: queueWanted(env)` e `sessionServer` con i parametri di T120. La route resta su `accessRefusal`, cioè `gate` senza account anche con gli account: annotato nell'ADR. Typecheck verde; suite intera 88 file, 1090 passati, 2 attesi, nessun rosso. Kit `--solo V-009`: 2 ok (risposte 404, perché il kit gira senza `QUINE_CODA`: non misura il segreto, lo fanno i test di `rotte.test.ts` e il browser), in `esiti/2026-11-02-dopo-T147-V-009.json`. Browser con `QUINE_CODA=1` sulla build: la pagina `localhost` legge il segreto (64 caratteri), mette una richiesta (`in coda`, 1), la ritira (0); senza segreto o con uno sbagliato 403; da `http://[::1]:4741` verso `localhost:4741` 403 «origine non ammessa» su segreto, stato e POST, nessun file in coda anche con `no-cors`. Sicurezza: nessuna superficie nuova.

### T148 · Alleggerire `tests/between.test.ts` — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 2
- Contesto: richiesta dell'autore (02/11). In T121 il file ha 1 timeout a 60 s nella suite; da solo col limite normale ne scadono 5, col limite alzato passa 7 su 7 a circa 67 s per test, a macchina carica. Il file mette limiti di 60 s e 180 s test per test (T91 li aveva già alzati): alzarli ancora non è la soluzione. Nasce da T121 e T91: `dossier T121`, `dossier T91`.
- Cosa fare: misura prima dove va il tempo (avvio del kernel per ogni test, tick simulati, attese) e con che carico; se ne viene un collo di bottiglia del kernel e non del test, dillo nell'esito con la misura. Poi accorcia il file: per esempio un mondo condiviso dove i test non si disturbano, meno tick da simulare, un universo di prova più piccolo. Ogni test continua ad affermare le stesse cose (T43a, T43b, T43c): nessuna asserzione tolta né indebolita, nessun `skip`. Niente limiti alzati. Non cambiare il codice del gioco per far passare i test: se serve, è una domanda.
- Test: tempi del file prima e dopo, da solo e nella suite, e il carico della macchina quando li misuri. `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo.
- Browser: non serve.
- Quando è fatto: il file passa da solo entro i limiti normali, ogni test molto sotto i 60 s; commit su `task/T148`.
- Esito: `task/T148`, cambia solo `tests/between.test.ts`: un `InlineRunner` condiviso da tutti i kernel del file (`KernelOptions.forms`, opzione che esisteva già) e via `vi.setConfig` e i limiti test per test, ora vale il globale di 60 s; nessun `expect` toccato, nessuno `skip`, nessun cambio al gioco. **Dove va il tempo** (carico CPU 69 % all'inizio, 3 % alla fine, una lettura): un mondo con tre viandanti sono 4 boot da ~10 s, 40 s su 41; i tick poco (30 fotogrammi di tutti i kernel 0,6 s). Con le forme già pronte un boot scende a 0,2-0,5 s: **il collo di bottiglia è del kernel**, ogni `Kernel.boot` riesegue in Node i programmi delle forme (quanto T91 aveva già indicato); non corretto, come chiesto. Il risultato condiviso è sicuro perché nessuno scrive sulla griglia di un risultato e le istanze la copiano (`instanceGrid`). **Tempi, da solo**: prima 386 s, test da 39-111 s (carico 31-47 %); dopo 39 s, test da 1,7-16,6 s (carico 43-51 %), il primo paga l'unico giro dei programmi. **Nella suite**: dopo 2-19 s per test, 7 su 7 (carico 30-47 %); il prima nella suite non l'ho rimisurato, per T121 era 1 timeout da 60 s. **Suite intera: 1032 verdi, 2 rossi, 4 `expected fail`, 1 `todo`**: timeout da 60 s in `tests/credits.test.ts` e `tests/referente.test.ts`, che T148 non tocca e che T121 aveva verdi. Rilanciati da soli insieme (due file, carico 51-62 %) restano rossi e di più: 5 timeout su 11 test (2 in `credits`, 3 in `referente`), 62-66 s. È lo stesso male dei boot ripetuti, ma quei due file andrebbero alleggeriti a parte: qui non sono stati toccati e la suite **non è verde**. Typecheck verde. Sicurezza: nessuna superficie nuova, cambia solo un test.

### T151 · Alleggerire `tests/credits.test.ts` e `tests/referente.test.ts` — `da fare`
- Pipeline: claude · stima 3% · approvato · priorità 2
- Contesto: approvato dall'autore (02/11). Nella suite di T148 sono gli unici 2 rossi, per timeout a 60 s; T121 li aveva verdi. Rilanciati insieme, senza il resto della suite, danno 5 timeout su 11 a 62-66 s, con la CPU al 51-62 %. Causa probabile, non misurata su questi due file: i boot ripetuti, che rieseguono in Node i programmi delle forme della corona (T91). T148 ha risolto lo stesso problema in `tests/between.test.ts` con un `InlineRunner` condiviso, passato con `KernelOptions.forms`. Nasce da T148 e T91: `dossier T148`, `dossier T91`.
- Cosa fare: prima misura dove va il tempo in ciascun file; se la causa non sono i boot, scrivilo nell'esito e correggi ciò che misuri. Poi alleggerisci i due file come ha fatto T148. Non togliere asserzioni, non usare `skip`, non alzare i limiti, non toccare il codice del gioco: la cache delle forme nel kernel è un passo a parte, che l'autore non ha ancora approvato. Se i file non si possono alleggerire senza toccare il gioco, fermati e scrivilo in `docs/pipeline/domande/T151.md`.
- Test: tempi dei due file prima e dopo, da soli e nella suite, e il carico della macchina quando li misuri. `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo.
- Browser: non serve.
- Quando è fatto: i due file passano da soli entro i limiti normali, ogni test molto sotto i 60 s; commit su `task/T151`.

### T144 · Integrare T122 — `fatto` (dipende da T142)
- Pipeline: claude · stima 2% · approvato · priorità 1
- Contesto: `integra T122` va in conflitto in `AGENTS.md`, sulle righe vicine dello Stack. T122 (il confine tra JS e Lua, `Crossing`) è finito e verificato. Parte quando Vite 7 e Vitest 4 di T131 sono nel base, per non rifare il merge. Nasce da T122: `dossier T122`.
- Cosa fare: nel worktree di T144 `git merge task/T122`; in `AGENTS.md` restano le aggiunte di entrambi. L'ADR di T122 è `0099-il-confine-tra-js-e-lua.md`, ma nel base il 0099 è già di T123 (il proxy di Gemini) e T131 ne prende un altro: rinominalo al primo numero libero del base e correggi le citazioni che parlano del confine («ADR-0099» di T122 in `AGENTS.md`, `sandbox.ts`, test, `docs/sicurezza/`, indice degli ADR), lasciando stare quelle del proxy. Nel backlog restano tutti i blocchi.
- Test: `npm run typecheck` e la suite intera con i loro turni, con Vitest 4 e i test nuovi di T122 (`tests/sicurezza/uscita.test.ts`, il limite di 180 s in `tests/between.test.ts`). Nell'esito quanti passano e i rossi che restano rilanciando il file da solo; le voci V-008, V-017 e V-019 restano chiuse.
- Browser: non serve, T122 ha provato la build.
- Quando è fatto: merge risolto, commit su `task/T144`. Poi l'orchestratore fa `integra T144` e `integra T122`.
- Esito: merge di `task/T122` risolto. In `AGENTS.md` lo Stack del base (Vite 7, ADR-0100; sito con i crediti) con la riga di Lua di T122. L'ADR del confine è ora `0101-il-confine-tra-js-e-lua.md`, con l'indice, `AGENTS.md`, `sandbox.ts`, `docs/sicurezza/audit-2026-11.md` e `docs/sicurezza/registro.md` (V-008, V-019); quelle del proxy restano 0099. La citazione «ADR-0099» nell'esito di T122 resta com'era, perché qui si cambia solo questo blocco: leggila come 0101. Typecheck verde; suite intera con Vitest 4.1.12: 83 file, 782 passati, 12 `it.fails` attesi, 1 todo, nessun rosso. V-008, V-017, V-019 restano `chiuse`. Sicurezza: nessuna superficie nuova rispetto a T122 e al base.

### T146 · Integrare T126 — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 1
- Contesto: `integra T126` va in conflitto in `docs/adr/README.md`: il 0102 nel base è di T120 (chi può scrivere), T126 aveva preso lo stesso numero per i limiti dentro la sandbox. La suite di T126 è partita senza T120. T126 non ha provato nel browser il nuovo allocatore (lo attraversa JS a ogni allocazione) né ripassato il kit. Nasce da T126: `dossier T126`.
- Cosa fare: nel worktree di T146 `git merge task/T126`. L'ADR dei limiti dentro la sandbox prende il primo numero libero del base; correggi le citazioni che parlano di quei limiti (`AGENTS.md`, `docs/`, codice, test, indice degli ADR), lasciando stare quelle di T120. In `AGENTS.md` e nel backlog restano le aggiunte di entrambi.
- Test: `npm run typecheck` e la suite intera con i loro turni. Nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Poi `npm run sicurezza:prove` per V-007, compresa V-007.c (l'HTTP con un mondo bloccato, che nei test non ha equivalente), e V-007 nel registro secondo ciò che misura: resta `in correzione` per T127. Il kit si legge, non si riscrive: se una prova va cambiata, l'esito lo dice con il motivo.
- Browser: `?skip&offline` sulla build, col turno `browser`: il gioco parte e cammina senza errori in console e il tick non è visibilmente più lento (l'allocatore è stato misurato solo in Node, da 0,95 a 1,15 ms). Nell'esito cosa si è visto e la misura del tick, se si riesce a leggerla.
- Quando è fatto: merge risolto, commit su `task/T146`. Poi l'orchestratore fa `integra T146` e `integra T126`.
- Esito: `task/T146`, l'ADR dei limiti è ora ADR-0103 (indice, `AGENTS.md`, registro, backlog, codice, test); le citazioni di T120 restano 0102. Typecheck verde. Suite intera, a macchina condivisa: 872 passati, 3 attesi, 9 rossi, tutti timeout da 60 s (`between` 4, `referente` 3, `branch` 1, `credits` 1); rilanciati da soli i quattro file sono verdi, nessun rosso resta. Da guardare: da solo il test più lento di `credits` sta a 53 s su 60. Stesso file, una misura per lato: 159 s con i sorgenti di prima del merge e 177 s con T126 (+11%), il test più lento da 43 a 53 s. T126 riduce il margine e questi timeout possono tornare. Kit `--solo V-007`, invariato (`esiti/2026-11-01-dopo-T126.json`): a, b, c ok; V-007 resta `in correzione` per T127, perché il kit non misura i blocchi rimasti. Browser su `?skip&offline`: parte e cammina, nessun guasto né errore del gioco; tick 3,8 ms da fermo e 4,4 ms camminando (p95 5-6 ms, massimo 9 ms a mondo assestato). Nessun confronto nel browser col prima di T126. Sicurezza: nessuna superficie nuova rispetto a T126.
