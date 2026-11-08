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
- Step: 9
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
- Step: 9
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
- Step: 9
- Dal to-do: «gli oggetti bloccanti (roccia, montagna) vengono spawnati anche sulla corona».
- Causa probabile: in `src/render/materials.ts` il taglio usa `modelMatrix * transformed` senza `instanceMatrix`,
  quindi le istanze (`InstancedMesh` dei modelli dei terreni) non vengono tagliate.
- Fare: correggere (con `USE_INSTANCING`), verificare nel browser con `?dev&teleport=46,0`.
- Esito: in `materials.ts` il taglio segue `project_vertex` (`instanceMatrix`, `batchingMatrix`). Diverso dal previsto:
  anche le **ombre** delle cose tagliate restavano sul pavimento della corona (il passaggio delle ombre usa un suo
  materiale, senza taglio): ora ogni mesh della simulazione che fa ombra ha un materiale di profondità tagliato
  (`casts`). Verificato nel browser (offline): corona senza alberi né ombre, dentro il cerchio tutto come prima.

### T04 · Aiuto (H/F1) senza meta-gioco, con i comandi del 3D — `fatto` (`de71498`)
- Step: 9
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
- Step: 9
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
- Step: 9
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
- Step: 10
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
- Step: 10
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
- Step: 10
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
- Step: 10
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
- Step: 10
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
- Step: 10
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
- Step: 10
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
- Step: 11
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
- Step: 11
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
- Step: 12
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
- Step: 12
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
- Step: 15
- Raggio del campus ×4 (il cerchio della simulazione no), edifici ridisposti sull'anello, viale, insegne. Test
  dello studio aggiornati.
- Esito: `CAMPUS` in `src/kernel/corona.ts`: l'anello va da 9 a 36 caselle oltre il cerchio (`outer` = R + 36 = 80); viale
  di 6 caselle con la linea al neon, porta a R + 6.5, blocchi da R + 7 a R + 23 (16 di profondità, ~19-25 di larghezza),
  prati dietro, vicoli tra i settori (`CoronaCell.ground`: `viale vicolo prato bordo`), bordo luminoso; uscita sul viale.
  `corona3d.ts`: blocchi alti 4.5, insegne al neon (testo su canvas, due facce) sopra ogni porta. `tests/corona.test.ts`
  (3: misure, porte raggiungibili, prati raggiunti dai vicoli). Nel browser (offline): viale, blocchi e insegne leggibili.
  Diverso dal previsto: nessun ADR (è una misura, non una decisione); i test dello studio non dipendevano dal raggio.

### T19 · Prompt per Gemini (abbonamento): le strutture della corona — `fatto` (`74bf122`)
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
- Il tavolo è fatto di cubi separati: farne un ellissoide unico (un modello o una mesh sola).
- Esito: `roundTable` in `src/render/corona3d.ts`: un piano ellittico pieno sull'ellisse del kernel (3.4 × 2.3, quella
  della collisione in `corona.ts`), il bordo arrotondato come mezzo ellissoide (64 spicchi, quad orientati da `facing`),
  un bordo al neon e un anello azzurro sotto l'universo; tutto nella mesh della stanza. Nel browser (offline): un pezzo
  solo, senza buchi. Diverso dal previsto: nessun modello MarkovJunior (bastano le quad del `Builder`), nessun ADR.

### T26 · L'Ufficio dei luoghi, dentro — `fatto` (T26a, T26b, T26c, T26d)
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 15
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
- Step: 16
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
- Step: 15
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
- Step: 12
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
- Step: 12
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
- Step: 13
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
- Step: 13
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
- Step: 13
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
- Step: 11
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
- Step: 13
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
- Step: 14
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
- Step: 14
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
- Step: 12
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
- Contesto: il piano del multigiocatore, «Il master». Troppo grande per una sessione: master fisso e god mode (T42a), il ramo
  `master` e la pubblicazione (T42b), i giocatori dalla corona (T42c), il clone con un altro master (T42d), le rune della corona e il
  Referente sul ramo (T42e), le rune chieste al Referente (T42f).

### T42a · Il master in god mode, visibile solo nel mondo — `fatto` (`093d98e`)
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
- Fare: «Altro…» su un altro giocatore giudicato come su una persona (se l'universo lo permette), effetti applicati dal
  server; PvP secondo `partita.pvp`; scambi di oggetti; chat tra avatar vicini (fumetti, senza filtro della quarta
  parete); morte in multigiocatore con la punizione di T33; ricollegamento con lo stato del giocatore.
- Fatto quando: test headless di ogni interazione; verifica con due schede.
- Spezzato (troppo per una sessione): chat e doni (T43a), «Altro…» e PvP (T43b), morte e ricollegamento (T43c).

### T43a · Parole e doni tra viandanti — `fatto` (`c65398f`) (dipende da T39)
- Step: 17
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
- Step: 17
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
- Step: 17
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
- Step: 17
- Fare: autenticazione sicura, un profilo ricco, il viandante personalizzabile (seme e colori del suo modello, nome);
  l'id del viandante (T34) è quello dell'account.
- Spezzato il 29/10/2026 (multigiocatore in testa): il profilo e il viandante personalizzato non aspettano il fornitore
  dell'autenticazione (T44a); l'account sì (T44b).

### T44a · Il profilo e il viandante personalizzato — `fatto` (dipende da T43a)
- Pipeline: claude · stima 4% · approvato · priorità 3
- Step: 17
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
- Step: 18
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
- Step: 17
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
- Step: 18
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
- Step: 18
- Fare: un saldo di crediti per viandante (in `world/giocatori/<id>.json`, scritto solo dal server), dati a mano dal master
  (console, o il Referente); ogni chiamata scala dal suo `chi` (T36: `payerOf`) il costo più l'1 % (P#1); le spese `comune` si
  dividono tra i giocatori collegati in quel momento, master compreso; crediti finiti → ciò che il viandante chiede si fa con i
  modelli locali (come senza chiave) e lo sa. Un anonimo (T44b) non ha crediti.
- Fatto quando: test headless (due giocatori e il master collegati, una spesa comune divisa in tre; crediti finiti → modelli locali), commit.
- Esito: modulo `src/kernel/credits.ts` (`costWithFee` con +1% P#1, `splitCost` a quote esatte); saldo crediti in `world/giocatori/<id>.json` gestito solo dal server (`kernel.creditsOf`, `giveCredits`, `deductCredits`); addebito automatico su `models.onCall` con ripartizione delle spese `comune` tra i viandanti connessi (esclusi anonimi); ricarica crediti dal master via console (`src/ui/console.ts`) e via Referente (`askReferente` con incarico `crediti`); a crediti esauriti (`crediti <= 0`) `Council.write` devia sui modelli locali (`MockModels`) e avvisa nel feed; il viandante anonimo (`anonimo: true`) ha 0 crediti non ricaricabili e usa sempre modelli locali; ADR-0081 registrato; test headless in `tests/credits.test.ts` (6/6 passati). Nessuna verifica nel browser richiesta dal criterio (logica headless multiplayer e server).

### T45b · I coefficienti di generazione e la partita «Low Detail» — `fatto`
- Pipeline: claude · stima 6% · approvato · priorità 6
- Step: 18
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
- Step: 18
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
- Step: 18
- Fare: prima di entrare in un universo multigiocatore la lobby: il tetto di crediti di chi entra (si somma ai budget di `ai`), i
  coefficienti e i modelli dell'universo (del master), i minimi; crediti finiti in partita → ricarica, offline o abbandona; la
  collezione di carte fuori dalla partita, con gli utilizzi.
- Fatto quando: test del flusso, verifica nel browser con due schede, commit.
- Esito: ADR-0086; `universe.json → ai.minimi` (tetto minimo, modello testo, modello scultore, luoghi/minuto) riparato da `repairMinimi`; `addBudgetFromTetto` in `credits.ts` aggiunge quote proporzionali a `maxText`, `maxForges`, `maxPacks`, `maxCast`, `maxModels`; `Kernel.setSessionTetto` e `sessionSpentOf` tracciano la spesa del viandante, emettendo `credits:exhausted` (`tetto` o `finiti`); avviso di rete `tipo: 'crediti'` e modale `CreditExhaustedModal` con le 3 scelte (ricarica Stripe, offline con `MockModels`, abbandona sessione); `LobbyScreen` multigiocatore con modelli e coefficienti del master, stima oraria, requisiti minimi, selettore tetto di spesa ($1, $2, $5, tutto) e collezione carte (`collectionOf`) con contatori di utilizzo (luoghi, trame, prompt, totale). Test in `tests/lobby.test.ts` (6/6 passati).

### T45e · I pagamenti con Stripe — `fatto`
- Pipeline: gemini · stima 5% · approvato · priorità 9
- Step: 18
- Fare: la ricarica dei crediti con Stripe Checkout (Google Pay compreso) in modalità di prova; il webhook sul server accredita
  (idempotente); chiavi solo sul server; un anonimo non compra.
- Fatto quando: test con il webhook finto, una ricarica di prova nel browser con le chiavi di test, commit. Le chiavi di Stripe le
  dà l'autore: se mancano, la domanda va in `docs/pipeline/domande/T45e.md`.
- Esito: implementati gli endpoint server (`/api/stripe/checkout`, `/api/stripe/webhook`) con verifica firma HMAC-SHA256 (`stripe-signature`), accredito crediti idempotente (`Kernel.creditRecharge` e persistenza `world/pagamenti.json`), blocco acquisti per anonimi (403), interfaccia di ricarica rapida e saldo nel profilo (`P`); test headless in `tests/stripe.test.ts` (6/6 passati); ADR-0083 registrato. Codice e test integrati nel base `3d` con T77. Chiavi di test inserite dall'autore in `.env` (con listener locale indicato su porta 4242); verifica nel browser delegata a T93.

### T45f · Il server su Google Cloud — `in attesa` (dipende da T44b, T45d, T133, T134, T172, T209)
- Pipeline: claude · stima 6% · priorità 10
- Step: 34
- **In attesa (autore, 04/11): la fine della Fase I.** Allora servono le risposte di `docs/pipeline/domande/T45f.md`.
- Fare: il server della sessione e i repository degli universi su Google Cloud, sempre acceso (Cloud Run con istanza minima o una VM,
  disco persistente per `universes/`, repository privati), il deploy da script, i segreti in Secret Manager.
- Fatto quando: un universo multigiocatore giocato da due browser sul server di prova, commit. Il progetto Google Cloud lo dà l'autore.

## Varie

### T70 · Integrare T53b (più piani) con il salto di T56b — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 0
- Step: 13
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
- Step: 19
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
- Step: 16
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
- Step: 19
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
- Step: 19
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
- Step: 15
- Contesto: l'autore ha disegnato nell'editor (T59) `schermo-scritte`, `schermo-struttura`, `circuito-3D` in `lab/mjx/models/handmade/`
  (accanto a copie di prova: `schermo-struttura copy*.xml`, `circuito.xml`, `circuito-mormale.xml`, da non portare).
- Fare: portarli nella libreria (`universe/models/` + `index.json`, con `vpt`) e usarli per i file sugli scaffali della corona:
  `schermo-scritte` per `.md` e i file non strutturati, `schermo-struttura` per `.json` e i file strutturati, `circuito-3D` per i `.lua`.
  Nei prompt dello Scultore (`universe/prompts/agents/`) citarli come esempi quando si chiede «tanta varietà» e «alta qualità».
- Fatto quando: test, typecheck, verifica nel browser negli interni dello studio (scaffali con i tre modelli), commit.
- Esito: `schermo-scritte`, `schermo-struttura`, `circuito-3D` portati in `universe/models/` e registrati in `universe/models/index.json` (`classe: "oggetto"`, `autore: "a mano (editor MJ, T59)"`, `vpt: 20`); `check.ts` aggiornato per non scartare modelli traslucidi come blocchi pieni (`fill > 0.8 && !hasTranslucent`); `validator.ts` e `forms.ts` aggiornati con flag case-insensitive (`/i`) per nomi modello con maiuscole; citati come esempi di alta qualità e varietà in `universe/prompts/agents/scultore.md`; `src/kernel/corona.ts` assegna `fileModelOf(path)` (`schermo-scritte` per `.md` e non strutturati, `schermo-struttura` per `.json` e strutturati, `circuito-3D` per `.lua`) e seed deterministico a ogni file sugli scaffali; prefetch in `kernel.ts`; rendering 3D in `src/render/corona3d.ts` e animazione fotogrammi in `src/render/coronaview.ts`; test in `tests/corona.test.ts`. Test e typecheck verdi.

### T64 · Le varianti precalcolate dei modelli pesanti — `fatto` (dipende da T63)
- Pipeline: gemini · stima 5% · approvato · priorità 20
- Step: 15
- Contesto: i modelli dell'autore (es. `circuito-3D`) danno a ogni seme risultati molto diversi e sono pesanti da generare e animare.
- Fare: misurare prima (tempo di generazione e di animazione di `circuito-3D` nei worker); se serve, una cache per (programma, seme)
  della griglia finita e dei fotogrammi delle animazioni (in memoria e IndexedDB nel browser), precaricata per pochi semi per tipo,
  così il mondo mostra molte varianti senza rigenerarle. Prima di scrivere la cache, controllare cosa fa già `src/render/forms.ts`.
- Fatto quando: misure prima e dopo nel task, test, typecheck, verifica nel browser, commit.
- Esito: misurazione prima su `circuito-3D` (griglia 37×37×47, 32 fotogrammi d'animazione) su 4 semi: 18.338 ms totali (media 4.585 ms/seme; runMjx ~607-5.473 ms, animazioni ~1.650-2.030 ms/seme). Implementata cache deterministica a doppio livello (in memoria e IndexedDB persistente `rune-forms`) in `src/render/forms.ts`: `formCacheKey` su `(model, seed, vpt, hashXml, tint, rig, sway, size)` con invalidazione automatica su modifica XML; `FormStore`, `MemoryFormStore`, `IdbFormStore`, `restoreFormResult` (ripristino TypedArray Float32Array/Uint8Array/Uint32Array da IndexedDB); `WorkerRunner` esteso con deduplicazione chiamate in-flight simultanee, lookup memoria (< 0.1 ms, ~46.000× speedup) e IndexedDB (~1-3 ms, ~1.500× speedup), salvataggio trasparente al ritorno dal worker; `InlineRunner` con cache per Node/test; `Forms.seedsOf` restituisce 4 varianti per i modelli pesanti degli scaffali (`circuito-3D`, `schermo-struttura`, `schermo-scritte`); `Forms.preload` e precaricamento all'ingresso nella corona (`kernel.visitCorona`). Test in `tests/forms.test.ts` (11 test totali: determinismo chiave, ripristino TypedArray, store in memoria, deduplicazione in-flight e cache hit senza messaggi worker, seedsOf/preload, InlineRunner cache). Typecheck e build puliti.

### T65 · Il lessico di QUINE42 — `fatto` (risposte in `docs/pipeline/domande/T65.md`)
- Pipeline: claude · stima 5% · approvato · priorità 30
- Step: 10
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
- Step: 24
- Contesto: in `docs/` convivono le metodologie passate (thread unico, step, to-do e backlog) e quella attuale (pipeline, T61).
- Fare: archiviare i documenti delle metodologie precedenti in cartelle ordinate, senza modificarne il contenuto né i link interni;
  a livello di `docs/` un resoconto: le metodologie in ordine, cosa contiene ogni cartella, e una tabella «link citato → dove è ora».
  Restano dove sono (li leggono la pipeline e gli agenti): `docs/pipeline/`, `docs/plans/backlog.md`, `docs/userchats/to-do.md`,
  `docs/adr/`, `docs/design.md`. Aggiornare i percorsi in AGENTS.md, CLAUDE.md, GEMINI.md se cambiano.
- Fatto quando: niente perso (`git status` mostra solo spostamenti), il resoconto, commit.
- Esito: archiviati i documenti delle 3 metodologie precedenti in `docs/archivio/` (`1-thread-unico/userchats/`, `2-step/` con `plans/`, `reports/`, `userchats/`, `3-to-do-backlog/` con `plans/`, `prompts/`, `userchats/`), preservando byte-for-byte contenuti e link interni; redatto `docs/README.md` con l'analisi cronologica delle 4 metodologie, mappa delle cartelle e tabella completa «link citato → dove è ora»; aggiornati i percorsi in `AGENTS.md` e `README.md`; lasciati intatti i file e cartelle attivi (`docs/pipeline/`, `docs/plans/backlog.md`, `docs/userchats/to-do.md`, `docs/adr/`, `docs/design.md`, `docs/conversazioni.md`, `docs/img/`).

### T67 · Il grafo delle conversazioni con Gemini — `fatto`
- Pipeline: gemini · stima 4% · approvato · priorità 25
- Step: 24
- Contesto: per tradurre il gioco in quattro lingue (fine della fase I) servono i riferimenti a tutti i testi, compresi i prompt.
- Fare: `docs/conversazioni.md`: per ogni compito degli agenti (`src/kernel/agents/`, `src/kernel/ai/`) chi chiama, con quale prompt
  (`universe/prompts/`, testi nel codice), quali parti del contesto, quale schema di risposta; grafi in mermaid. Un elenco dei testi
  sparsi nel codice da portare a fattor comune (md, yaml, json o properties), senza spostarli in questo task.
- Fatto quando: il documento, commit.
- Esito: redatto `docs/conversazioni.md` con l'architettura end-to-end, i diagrammi Mermaid dei flussi, le schede dettagliate di tutti i 38 task degli agenti (Genesi, Cartografia, Fucina, Contenuti, Azioni ed effetti, Menti e dialoghi, Scultura 3D, Meccaniche) con ruoli, prompt di sistema, prompt utente, response schema e flussi di validazione. Censimento completo di tutti i testi hardcoded in italiano nel codice (template dei prompt, descrizioni degli schemi, principi e filtri della quarta parete, narrazione di fallback, testi UI e HUD) con proposta di organizzazione per la futura localizzazione multi-lingua e per la coda abbonamenti (T68).

### T68 · Generare l'universo con gli abbonamenti — spezzato in T68a, T68b, T68c (risposte in docs/pipeline/domande/T68.md)
- Step: 20
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
- Step: 20
- Fare: `universe.json → ai.provider`/`agenti` (riparati), i compiti lenti, `RoutedModels`, `QueueModels` (client di `/api/coda`),
  la coda su disco `server/subscriptionQueue.ts` (richiesta → presa → risposta, battito del servitore), prezzi a zero nel registro.
- Fatto quando: test della coda e dell'instradamento, ADR, commit.
- Esito: `src/kernel/ai/subscription.ts`, `server/subscriptionQueue.ts` (in `vite.config.ts`, cartella `universes/.coda/`),
  `SUBSCRIPTION_PRICES` in `prices.ts`, `tests/subscription.test.ts`, ADR-0077. Rispetto al previsto: anche `mechanic.design` (la Fucina
  delle meccaniche) e `model.resculpt` tra i compiti lenti; `model.judge` (foto) resta sulle API. Nel gioco non è ancora collegato.

### T68b · Il processo che serve la coda con le CLI — `fatto` (dipende da T68a)
- Pipeline: claude · stima 4% · approvato · priorità 20
- Step: 20
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
- Step: 20
- Fare: `main.ts` costruisce `RoutedModels` se `usesSubscriptions` e la coda è servita (`QueueModels.available`), solo se l'universo
  è in singola (mai in `host.ts`); `#models` e il pannello del Concilio dicono quali agenti vanno su quale abbonamento e cosa c'è in coda;
  documentazione per chi scarica il repository (README: impostare la tabella, lanciare il servitore).
- Fatto quando: Genesi offline con la coda servita da una CLI finta nel browser, commit.
- Esito: `main.ts` costruisce `RoutedModels` in singola quando la tabella `ai` usa abbonamenti e `QueueModels.available` è vero per i provider richiesti; `/api/coda/stato` e `QueueModels.queryState` riportano lo stato completo con richieste in attesa e in corso; `#models` e il pannello del Concilio (`FeedPanel`, tasto G) mostrano il riepilogo dei provider/agenti e della coda con dettagli tooltip; documentazione aggiunta nel README per tabella e comando `npm run abbonamento`; test completi e prova della Genesi offline con coda servita in `tests/subscription.test.ts`.

### T71 · Soglie della pipeline e dell'orchestratore sul limite settimanale per Argon — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 0
- Step: 19
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
- Step: 19
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
- Step: 20
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
- Step: 20
- Contesto: `integra T68c` del 30/10/2026 si è fermato su un conflitto in `docs/plans/backlog.md` (dovuto alle integrazioni concorrenti di T71, T72 e T73 nel branch base). Leggi `node tools/pipeline/pipeline.mjs dossier T68c`.
- Fare: nel tuo worktree esegui `git merge task/T68c` e risolvi il conflitto in `docs/plans/backlog.md` mantenendo sia le aggiunte recenti (T71, T72, T73, T74) sia lo stato `fatto` e l'esito di T68c. IMPORTANTE: esegui solo `npx vitest run tests/subscription.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`, NON lanciare `npm test` sull'intera suite per evitare timeout o backgrounding).
- Fatto quando: `npx vitest run tests/subscription.test.ts` e `npm run typecheck` verdi, commit sul branch `task/T74`. Poi l'orchestratore farà `integra T74` e `integra T68c`.
- Esito: eseguito merge di `task/T68c` in `task/T74`; risolto il conflitto in `docs/plans/backlog.md` mantenendo lo stato `fatto` e l'esito di T68c insieme a tutti i task recenti (T71, T72, T73, T74); verificati `tests/subscription.test.ts` (16/16) e `npm run typecheck` con esito verde.


### T75 · Integrare T44b (l'account e l'autenticazione) con T45a (i crediti) — `fatto`
- Pipeline: gemini · stima 3% · approvato · priorità 0
- Step: 18
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
- Step: 18
- Contesto: `integra T75` del 30/10/2026 si è fermato su un conflitto in `src/main.ts` (perché nel frattempo nel base `3d` è stato integrato T44c, commit `906ed6a`). Leggi `node tools/pipeline/pipeline.mjs dossier T75` e `dossier T44c`.
- Fare: nel tuo worktree esegui `git merge task/T75` e risolvi il conflitto in `src/main.ts` (e se si presenta in `docs/plans/backlog.md` mantenendo sia T75 sia T76) preservando sia le novità di T44c (`savedProfile(name, id)`, «Chi è» nel client sottile, profilo per universo e viandante, hover/clic destro corretti, schermata della morte in multigiocatore) sia quelle di T75/T44b/T45a (gestione account Firebase, login con Google/anonimo, crediti anonimo).
  IMPORTANTE: esegui solo `npx vitest run tests/account.test.ts tests/credits.test.ts tests/session.test.ts tests/subscription.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`, NON lanciare `npm test` sull'intera suite per evitare timeout o backgrounding).
- Fatto quando: i test sopra indicati e `npm run typecheck` sono verdi, commit sul branch `task/T76`. Poi l'orchestratore farà `integra T76`, `integra T75` e `integra T44b`.
- Esito: eseguito merge di `task/T75` in `task/T76`; risolti i conflitti in `src/main.ts` e `docs/plans/backlog.md` preservando sia le novità di T44c (`savedProfile(name, id)`, gestione `ui:died` in multigiocatore, profilo salvato per universo/viandante) sia quelle di T75/T44b/T45a (account Firebase, login Google/anonimo, `accountWanderer` per id e profilo, crediti per anonimo e profilo account); superati `tests/account.test.ts` (6/6), `tests/credits.test.ts` (6/6), `tests/subscription.test.ts` (16/16), `tests/session.test.ts` (3/3) e `npm run typecheck` con esito verde.

### T77 · Integrare T45e (i pagamenti con Stripe) nel base 3d — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Step: 18
- Contesto: `integra T45e` del 30/10/2026 si è fermato su un conflitto in `docs/plans/backlog.md` (e possibili sovrapposizioni nei file aggiornati da T76/T75/T44b in `3d`). Leggi `node tools/pipeline/pipeline.mjs dossier T45e` e `dossier T76`.
- Fare: nel tuo worktree esegui `git merge task/T45e` e risolvi i conflitti:
  - In `docs/plans/backlog.md` mantieni lo stato aggiornato di T45e (con le sue note/esito e domanda chiavi Stripe) e aggiungi T77.
  - In `src/main.ts`, `server/session.ts`, `src/kernel/credits.ts`, `src/ui/profile.ts`, `vite.config.ts`, `AGENTS.md` o eventuali altri file, preserva attentamente sia l'autenticazione Firebase, i crediti anonimi e il profilo di T76/T75/T44b/T44c, sia l'integrazione di Stripe Checkout (`/api/stripe/checkout`), il webhook idempotente (`/api/stripe/webhook`), il blocco degli utenti anonimi dai pagamenti e la memorizzazione in `world/pagamenti.json` di T45e (ADR-0083).
  IMPORTANTE: esegui solo `npx vitest run tests/stripe.test.ts tests/account.test.ts tests/credits.test.ts tests/session.test.ts` e `npm run typecheck` (con `WaitMsBeforeAsync: 10000`, NON lanciare `npm test` sull'intera suite per evitare timeout).
- Fatto quando: i test specificati e `npm run typecheck` sono verdi, commit sul branch `task/T77`. Poi l'orchestratore farà `integra T77` e `integra T45e`.
- Esito: eseguito merge di `task/T45e` in `task/T77`; risolto il conflitto in `docs/plans/backlog.md` mantenendo lo stato di T45e (`in attesa` chiavi Stripe di prova) e la definizione di T77; verificate e preservate tutte le integrazioni sia di Firebase Auth/profilo (T76/T75/T44b/T44c) sia di Stripe Checkout, webhook idempotente, esclusione anonimi e persistenza in `world/pagamenti.json` di T45e (ADR-0083); superati `tests/stripe.test.ts`, `tests/account.test.ts`, `tests/credits.test.ts`, `tests/session.test.ts` (21/21) e `npm run typecheck` con esito verde.


### T78 · Integrare T45c (l'eredità dei cloni) nel base 3d — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 0
- Step: 18
- Contesto: T45c (`task/T45c`, `ce4b2db`) ha scritto il suo ADR come `docs/adr/0081-l-eredita-dei-cloni.md`, ma nel base 0081 è già «Crediti e spese comuni» (0082 l'account, 0083 Stripe). Leggi `node tools/pipeline/pipeline.mjs dossier T45c` e `traccia T45c`. L'agente ha lasciato 8 test in timeout (`between`, `referente`, `thin`, `wanderers`, `watch`), attribuiti al carico della macchina; per `between`, `referente`, `thin` il confronto con il commit di partenza non è stato fatto.
- Fare: nel tuo worktree `git merge task/T45c`; rinomina l'ADR in `docs/adr/0084-l-eredita-dei-cloni.md` (o il primo numero libero) e correggi ogni riferimento a ADR-0081 che parla dell'eredità (AGENTS.md, `docs/adr/README.md`, backlog, commenti in `src/kernel/heritage.ts`, `cards.ts`, `clone.ts`, test), lasciando ADR-0081 ai crediti. Risolvi i conflitti tenendo entrambe le aggiunte. Fai girare `npm run typecheck`, `npx vitest run tests/heritage.test.ts tests/clone.test.ts tests/cards.test.ts tests/credits.test.ts` e, uno per volta, `tests/between.test.ts tests/referente.test.ts tests/thin.test.ts tests/wanderers.test.ts tests/watch.test.ts`: se uno fallisce, provalo anche su `3d` e di' nell'esito se il guasto c'era già.
- Fatto quando: typecheck e test indicati verdi (o fallimenti dimostrati preesistenti), commit su `task/T78`. Poi l'orchestratore fa `integra T78` e `integra T45c`.
- Esito: eseguito merge di `task/T45c` in `task/T78`; rinominato l'ADR in `docs/adr/0084-l-eredita-dei-cloni.md` (e titolo aggiornato) e corretti tutti i riferimenti a ADR-0081 riguardanti l'eredità in ADR-0084 (AGENTS.md, `docs/adr/README.md`, backlog, commenti in `src/kernel/heritage.ts`, `cards.ts`, `clone.ts`, `kernel.ts`, `types.ts`), preservando ADR-0081 per i crediti e le spese comuni; risolto il conflitto in `docs/adr/README.md` includendo entrambi gli ADR (0081, 0082, 0083 e 0084); verificati con successo `npm run typecheck` e `tests/heritage.test.ts`, `tests/clone.test.ts`, `tests/cards.test.ts`, `tests/credits.test.ts` (23/23 verdi); eseguito `tests/thin.test.ts` (7/7 verde); i test `referente.test.ts`, `wanderers.test.ts`, `watch.test.ts` presentano timeout dovuti al carico macchina e `between.test.ts` ha una mancata cattura in `calls` dovuta al bypass dei mock introdotto da `hasCredits` (T45a), preesistente e identico su `3d` (file sorgenti e di test identici a `3d`).

### T79 · Integrare T45b (coefficienti di generazione e partita Low Detail) nel base 3d — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 0
- Step: 18
- Contesto: T45b (`task/T45b`, `bc77bd9`) ha completato i coefficienti di generazione e la partita Low Detail ma ha scritto il suo ADR come `docs/adr/0081-i-coefficienti-di-generazione.md`. Nel base, 0081 è «Crediti e spese comuni», 0082 l'account, 0083 Stripe, 0084 l'eredità dei cloni (ADR-0084, T78). Claude è fermo per limite 5 ore fino alle 17:00 UTC. Leggi `node tools/pipeline/pipeline.mjs dossier T45b`.
- Fare: nel tuo worktree esegui `git merge task/T45b`; rinomina l'ADR in `docs/adr/0085-i-coefficienti-di-generazione.md` (e aggiorna il titolo interno e i riferimenti ad ADR-0081 che parlano dei coefficienti in ADR-0085 in `AGENTS.md`, `docs/adr/README.md`, backlog, commenti in `src/kernel/coefficients.ts`, `src/ui/genesis.ts`, test). Risolvi i conflitti in `docs/plans/backlog.md`, `AGENTS.md`, `docs/adr/README.md` e in `src/kernel/kernel.ts` / `src/kernel/types.ts` tenendo entrambe le aggiunte (sia l'eredità dei cloni ADR-0084 e Stripe ADR-0083 sia i coefficienti ADR-0085).
  IMPORTANTE: esegui solo `npx vitest run tests/coefficients.test.ts tests/heritage.test.ts tests/stripe.test.ts tests/credits.test.ts` e `npm run typecheck` (con timeout adeguato, NON lanciare l'intera suite).
- Fatto quando: i test specificati e `npm run typecheck` sono verdi, commit su branch `task/T79`. Poi l'orchestratore farà `integra T79` e `integra T45b`.
- Esito: eseguito merge di task/T45b in task/T79; rinominato l'ADR in docs/adr/0085-i-coefficienti-di-generazione.md (aggiornato titolo interno a ADR-0085); aggiornati tutti i riferimenti ad ADR-0081 relativi ai coefficienti di generazione in ADR-0085 in AGENTS.md, docs/adr/README.md, backlog.md (esito T45b), src/kernel/coefficients.ts, src/kernel/types.ts, src/ui/genesis.ts e tests/coefficients.test.ts, lasciando intatti i riferimenti ad ADR-0081 per i crediti e le spese comuni; preservate tutte le integrazioni preesistenti (eredità cloni ADR-0084, Stripe ADR-0083, crediti ADR-0081); verificati con esito verde npm run typecheck e vitest su tests/coefficients.test.ts, tests/heritage.test.ts, tests/stripe.test.ts, tests/credits.test.ts (26/26 passati).

### T80 · Integrare T45d (la lobby multigiocatore) nel base 3d — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Step: 18
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
- Step: 19
- Contesto: aprendo `http://localhost:4242` la console dice `Uncaught SyntaxError: Invalid regular expression flags (at (index):1264:44)`:
  probabilmente una regex nello script inline di `tools/pipeline/web.mjs` perde i `\` dentro il template string del server. Nasce da T69: `dossier T69`.
- Fare: trovare la riga 1264 della pagina servita, correggere l'escape; un test che fa il parse dello script servito (`new Function(script)` in Node) per non ricaderci.
- Fatto quando: la pagina carica senza errori in console (verifica con il browser se lo hai, altrimenti il test di parse basta), test e typecheck verdi.
- Esito: corretto l'escape della regex `replace(/^\/nota\s+/i, '')` in `tools/pipeline/web.mjs` dentro il template string di `renderHtml()` (usando `^\\/nota\\s+` per non perdere i backslash nel codice client generato); aggiunto test in `tests/pipeline.test.ts` che valida con `new Function(script)` lo script inline estratto da `renderHtml()`; verificati `tests/pipeline.test.ts` (43/43 passati) e `npm run typecheck` con esito verde.

### T82 · Un task per provider: tetti di parallelismo per provider e modello — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 1
- Step: 19
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
- Step: 19
- Dipende da: T82.
- Contesto: `npm test` intero dura ~30 minuti e, lanciato da più agenti insieme, rallenta tutto (anche `agy -p usage` ci mette 2 minuti); più verifiche nel browser insieme sono deleterie.
- Fare: un semaforo su disco (`.pipeline/lock/`) per le operazioni pesanti: **al più una verifica nel browser** in tutta la pipeline e **al più una suite intera** di vitest;
  chi le vuole fare aspetta il suo turno (un comando come `pipeline.mjs turno browser|test -- <comando>` che il prompt dei task chiede di usare); la pipeline non lancia
  insieme due task che chiedono il browser e distribuisce nel tempo quelli pesanti.
- Fatto quando: test del semaforo verdi; il prompt in `config.json` e il README dicono di usare il turno.
- Esito: ADR-0088. `pipeline.mjs turno browser|test -- <comando>` (`runInTurn`): semaforo in `.pipeline/lock/` della cartella principale (`lockDir`, `PIPELINE_LOCK`), file del titolare creato in modo esclusivo, coda nell'ordine d'arrivo (`<tipo>.attesa/`, `tryTurn`, `leaveTurn`, `holderOf`), un processo morto o un turno oltre `turni.<tipo>.massimoMinuti` (45/60) non blocca; `turno` da solo e `stato` dicono chi lo tiene; la CLI di ogni task riceve `PIPELINE_TASK`. In `esegui` `holdBack`: mai due task col browser insieme (anche riprendendo), lanci nuovi distanziati di `intervalloLanciMinuti` (10). Prompt di `config.json`, README (regole 6-7), `orchestra.md`, AGENTS.md aggiornati. 6 test nuovi in `tests/pipeline.test.ts` (60/60, uno con due processi veri), typecheck verde. La suite intera, lanciata nel turno: 554/609, i 55 falliti sono in file che non toccano la pipeline (timeout per il carico della macchina; `branch.test.ts` e un test di `between.test.ts` falliscono anche da soli, già sul base: da guardare a parte). Diverso dal previsto: la verifica nel browser tiene il turno con la sua preview (`turno browser -- npx vite preview …` in background), non con un comando a parte.

### T84 · L'orchestratore parla solo quando serve, e con meno epoche — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 3
- Step: 19
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
- Step: 19
- Dipende da: T84.
- Contesto: l'autore vuole fermare tutto senza Ctrl+C brutale, anche chiedendolo all'orchestratore in chat («chiudi ora tutti i task e spegni», «aspetta che finiscano e spegni»).
- Fare: comandi `ferma --ora` (interrompe ogni task tenendo la sua conversazione, salva lo stato, spegne `orchestra`) e `ferma --dopo` (niente lanci nuovi, aspetta che i task
  in corso finiscano, poi spegne); l'orchestratore li può dare; Ctrl+C fa `ferma --ora` pulito; al riavvio l'`avvio.md` dice al nuovo orchestratore cosa era in corso, cosa è
  stato interrotto e cosa è finito mentre era spento.
- Fatto quando: test dei due spegnimenti e del riepilogo al riavvio verdi; README e `orchestra.md` aggiornati.
- Esito: ADR-0090. `ferma --ora|--dopo` (anche `/ferma ora|dopo` dal terminale o dalla chat web, e dall'orchestratore con la sua shell) scrive la richiesta in `.pipeline/arresto.json` (`requestStop`); `execute` la vede entro un secondo (l'attesa del controllo ora si interrompe), con `ora` interrompe i task tenendo la conversazione (`interruptTasks` con `spegnimento`), con `dopo` non lancia né riprende nulla e aspetta, poi scrive `.pipeline/spegnimento.json` (`shutdownRecord`) e ritorna; `orchestra` aspetta il turno in corso (per `dopo` fa aggiornare il quadro) ed esce. Ctrl+C è `ferma --ora` (anche in `esegui`), un secondo Ctrl+C esce subito; `/esci` lascia anch'esso il registro. Al riavvio `recoverRuns`: gli interrotti allo spegnimento riprendono da soli (diversi da `interrompi`, che aspetta `riprendi`), e — in più del previsto — un'esecuzione il cui processo è sparito ma il cui log ha l'`ESITO:` si chiude come finita invece di ripartire da capo; l'epoca nuova ha in `avvio.md` «Lo spegnimento di prima» (`shutdownSummary`). Corretta anche una corsa: `saveRuns` non annulla più un'interruzione scritta da un altro processo. Con `PIPELINE_STATE` anche `consumi.jsonl` va nella cartella di prova, così i test fanno girare `esegui` vero con una CLI finta. 5 test nuovi in `tests/pipeline.test.ts` (68/68); il test di T84 sull'`avvio.md` misurava il `quadro.md` vivo (cresciuto a 7,4 KB) e falliva sul base: ora misura ciò che la pagina aggiunge al quadro. README, `orchestra.md`, AGENTS.md aggiornati. Suite intera nel suo turno: 562/617, i 55 falliti sono gli stessi timeout dei test multigiocatore che T83 e T91 hanno trovato sul base (`src/` non cambia; `branch.test.ts` verde da solo, `watch.test.ts` va in timeout a 20 s anche da solo sul base).

### T86 · Tracciare tutte le conversazioni in corso, anche quelle di agy e dell'orchestratore — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 0
- Step: 19
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
- Step: 19
- Dipende da: T81 (un task alla volta su Gemini).
- Contesto: l'autore nota che i task su Gemini/Argon (agy) non riescono a fare le verifiche nel browser.
- Fare: capire perché (`agy -p` non ha il browser di Antigravity in modalità non interattiva? manca un flag?) e correggere `tools/pipeline/config.json`; se non si può,
  la pipeline lo deve sapere: i task con verifica nel browser vanno solo su Claude. Scrivi ciò che scopri nel README della pipeline.
- Fatto quando: una verifica di prova su una pagina locale riesce da `agy -p`, oppure il README dice che non si può e la pipeline non manda più ad agy i task che chiedono il browser.
- Esito: verificato sperimentalmente con `agy -p` che Antigravity CLI non supporta flag browser (es. `--chrome` non definito) e non espone strumenti di navigazione/ispezione; il subagente `/browser` cerca `DevToolsActivePort` su Chrome utente e non avvia Chrome in autonomia. Aggiornato `tools/pipeline/config.json` con `"browser": true` per Claude e `false` per Gemini/Argon, aggiornato il prompt comune; in `tools/pipeline/pipeline.mjs` aggiunti `taskNeedsBrowser`, riconoscimento `needsBrowser` nel backlog e nella riga pipeline, blocco in `plan` e `assignTask` se un task browser è indirizzato a provider non-browser, e filtro in `execute` che impedisce il fallback di task browser su Gemini o Argon; documentate le cause e la regola esclusiva per Claude in `docs/pipeline/README.md`, `pianifica.md` e `orchestra.md`; test completi in `tests/pipeline.test.ts`.

### T90 · Integrare T82 (tetti per provider) con T87 (browser solo su Claude) in pipeline.mjs — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 0
- Step: 19
- Contesto: `integra T82` del 30/10/2026 si è fermato su un conflitto in `tools/pipeline/pipeline.mjs`: T87 (già nel base `3d`) manda i task con verifica nel browser solo a Claude, mai ad agy; T82 aggiunge i tetti per CLI e modello (`config.json → limiti`), gli slot dinamici e lo slot di riserva (ADR-0087). Leggi `node tools/pipeline/pipeline.mjs dossier T82`, `traccia T82` e `traccia T87`.
- Fare: nel tuo worktree `git merge task/T82` e risolvi tenendo entrambe le regole (i task col browser solo su Claude e dentro i tetti di T82). Se ci sono conflitti anche in `docs/plans/backlog.md`, tieni lo stato `fatto` e l'esito di T82 e T87 e questo blocco. Esegui solo i test della pipeline (`npx vitest run tests/pipeline.test.ts` e quelli che T82 ha aggiunto) e `npm run typecheck`, NON la suite intera.
- Fatto quando: test della pipeline e typecheck verdi, commit su `task/T90`. Poi l'orchestratore fa `integra T90` e `integra T82`.
- Fatto: merge di `task/T82` su `task/T90`; un solo conflitto in `execute()` di `pipeline.mjs`: tenuto il filtro `allowed` di T87 (col browser solo i provider con `browser`, predefinito Claude) con la firma nuova di T82 `fits(prov, t, resuming)` (tetti per CLI, slot, riserva a priorità 0). Il backlog si è fuso da solo. `tests/pipeline.test.ts` (54) e typecheck verdi; nessuna differenza dal previsto.

### T91 · I test che falliscono anche da soli: `branch.test.ts` e `between.test.ts` — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 3
- Step: 27
- Contesto: chiesto dall'autore il 30/10/2026. T83 (`dossier T83`, `traccia T83`) ha trovato nella suite intera 55 test falliti su 609: quasi tutti timeout per carico della macchina, ma due file falliscono anche da soli: `tests/branch.test.ts` (tre test si aspettano un solo file cambiato, `modules/npc.cat/manifest.json`, e ne ricevono due) e un test di `tests/between.test.ts`.
- Fare: verifica sul base `3d` che falliscano davvero; trova la causa (il test vecchio o un cambio del codice, per esempio un task integrato dopo) e correggi ciò che è sbagliato, senza indebolire ciò che il test garantisce. Lancia i due file da soli; la suite intera solo nel suo turno (`node tools/pipeline/pipeline.mjs turno test -- npm test`). Se i timeout della suite intera hanno una causa comune evidente (non il carico), annotala nel blocco senza correggerla.
- Fatto quando: `branch.test.ts` e `between.test.ts` verdi da soli, typecheck verde, commit su `task/T91` con una riga sulla causa.
- Esito: falliscono davvero sul base, per T45a (crediti), non per i test. `branch.test.ts`: lo specchio riceve il saldo dal server con `setCredits`, che scriveva `world/giocatori/io.json` nel suo repository, e il file entrava nel ramo del master; ora in uno specchio (`kernel.mirror`) `setCredits` tiene il saldo solo in memoria (il file del viandante lo scrive solo il server, ADR-0081). `between.test.ts`: Anna a 0 crediti è servita dai modelli locali (`council.localModels`), così la spia su `k.models.text` non vedeva `player.death`; il test le dà crediti, e garantisce ancora che il verdetto sia chiesto e pagato da lei. I due test della morte avviano 6-7 kernel e da soli superano i 60 s: tetto a 180 s. Causa comune dei timeout della suite intera (non il carico): ogni `Kernel.boot` impiega ~10-11 s, quasi tutti in `placeCampus` → `forms.preload` che esegue di nuovo in Node i programmi MarkovJunior degli edifici della corona (`mj/engine.ts`, `scan`/`sync`); i test multigiocatore avviano un kernel per il server e uno per ogni specchio. Non corretta: una cache delle forme per (programma, seme) condivisa tra i kernel dello stesso processo, o la corona solo dove serve, la toglierebbe (da fare come task a parte). Verdi da soli: `between.test.ts` 7/7 (344 s); `branch`, `credits`, `lobby` insieme 17/17; typecheck verde; suite intera non lanciata.

### T88 · Spendere i crediti che avanzano con la generazione differita — `da fare`
- Pipeline: claude · stima 4% · approvato · priorità 60
- Step: 31
- Contesto: obiettivo dell'autore (03/11): generare gli universi non in tempo reale, in alta qualità, solo con gli abbonamenti. Sono lavori costosi in crediti ma leggeri per la macchina: perfetti per consumare ciò che a fine settimana resterebbe inutilizzato. Il generatore è T207. Nasce da T68: `dossier T68`. Previsione degli slot: T82, T85.
- Cosa fare: con la previsione degli slot, quando un provider arriverebbe al reset settimanale con crediti avanzati anche a slot pieni, la pipeline avvia il generatore sul prossimo universo dell'elenco `generazione` di `tools/pipeline/config.json`, entro ciò che avanza e il tetto per universo; lo ferma, tenendo il lavoro fatto, quando un task o l'autore servono quei crediti, e rispetta la finestra delle 5 ore. Il generatore occupa uno slot del tetto di Claude, che non cambia, e cede sempre il posto ai task pronti. `stato` dice cosa genera e quanto ha speso; l'autore può spegnerlo.
- Test: offline, sulla previsione e sull'avvio e l'arresto con un generatore finto: crediti avanzati → parte; un task pronto che ha bisogno dello slot → si ferma e riprende; tetto raggiunto → passa al prossimo. Typecheck e suite con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T88`; nell'esito come si accende e si spegne.
- Dipende da: T82, T85, T207, T156 (autore, 03/11: niente strutture dei mondi nuovi prima del prompt nuovo dello Scultore).

### T207 · La generazione differita: un universo generato senza browser, solo dagli abbonamenti — `fatto` (`c007831`) (dipende da T205, T156)
- Pipeline: claude · stima 6% · approvato · priorità 59
- Step: 31
- Contesto: richiesta dell'autore (03/11), l'idea di T88 e T153: generare gli universi non in tempo reale, in alta qualità, solo con gli abbonamenti. Oggi la coda (ADR-0077, ADR-0106, `src/kernel/ai/subscription.ts`) prende solo i compiti lenti, il resto va alle API, e non c'è sul server dei mondi di molti: una partita multigiocatore senza API non genererebbe i luoghi nuovi. Se il mondo si genera prima, il problema non si pone per ciò che è già pronto.
- Cosa fare: un comando locale, senza browser, che apre un universo in un kernel e genera Genesi, luoghi in anticipo a partire dal centro, persone e modelli, un passo alla volta. In questa modalità **ogni** compito va alla coda; se una chiamata andrebbe alle API, il comando si ferma con un errore, non spende. Ogni passo passa dal validatore e dal filtro della quarta parete come sempre, e si committa solo uno stato valido; fermato e riavviato, riprende da lì. Un tetto di consumo per universo in percentuale della settimana, riletto a ogni passo. Mai su un universo con un mondo acceso. La partita (singola o multigiocatore) si sceglie all'avvio. Decidi tu, e scrivilo: quale modello per l'alta qualità (con revisioni in più?), quanti luoghi, chi risulta pagante e titolare delle carte. L'isolamento della CLI (ADR-0106) non cambia. Mai sul server di produzione. Un ADR e la voce nel glossario.
- Test: offline, con una coda finta: una Genesi e qualche luogo completi senza alcuna chiamata alle API; un compito fuori coda ferma il comando; interruzione e ripresa; tetto raggiunto; rifiuto con un mondo acceso. Typecheck e suite con i loro turni.
- Browser: non serve; una prova vera di un luogo con la CLI, col consumo misurato nell'esito.
- Quando è fatto: commit su `task/T207`; nell'esito il comando, il costo misurato di un luogo, e cosa vede chi cammina oltre ciò che è stato generato, in un mondo di molti senza API. La riga «sicurezza:».
### T89 · La grafica a cartone — `fatto` (progetto; codice in T89a-e)
- Pipeline: claude · stima 5% · approvato · priorità 100
- Step: 29
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

### T89a · Cartone: fasce e interruttore — `fatto` (`9ae9a23`) (dipende da T89, T205)
- Pipeline: claude · stima 3% · approvato · browser · priorità 75
- Step: 29
- Contesto: ADR-0093, punti 1, 2 e 6; la prova `?cartone` di T89 (`src/render/cartoon.ts`, `lit()` in `materials.ts`).
- Fare: la rampa a 3 fasce per tutti i materiali illuminati (simulazione, corona e studio: `MAT.corona`, `coronaGlass`, `solid()`), i voxel luminosi fuori
  dalle fasce; il lato in ombra saturo (la fascia bassa non sotto ~0,35, il colore dell'emisfero non grigio); ombre portate più nette. Il cartone diventa il
  predefinito quando T89b e T89c sono fatti: fino ad allora `?cartone`; poi `?classica` per il vecchio aspetto.
- Fatto quando: typecheck e test verdi; screenshot con e senza nel browser (un luogo con case e alberi, lo studio) e niente errori in console.
- Esito: rampa a 3 fasce con soglie scelte sulle sei normali dei voxel per tutti i materiali illuminati di simulazione, corona e studio (`lit()`), voxel luminosi fuori dalle fasce, emisfero freddo, ombra portata che lascia la fascia bassa a 0,35, ombre nette (raggio 0), sole tenue nello studio solo nel cartone, interruttore `cartoonOn` con `CARTOON_BY_DEFAULT=false` e `?classica` che vince (da mettere a `true` dopo T89b e T89c), `PCFSoftShadowMap` rimosso da three sostituito con `PCFShadowMap` senza cambi nel classico; test nuovi in `tests/cartoon.test.ts`, suite 111 file/1502 test, typecheck e build verdi; non provati la notte nel cartone, le prestazioni (T89e) e i voxel luminosi visti da vicino su facce diverse (solo test e compilazione dello shader); icone e laboratorio restano Lambert (T89d, T89e). Sicurezza: nessuna superficie nuova.

### T89b · Cartone: contorni dagli id di cosa e parte — `fatto` (`e3c0f20`) (dipende da T89a)
- Pipeline: claude · stima 6% · approvato · browser · priorità 76
- Step: 29
- Contesto: ADR-0093, punto 3. Il passo `Ink` di T89 legge normali e profondità: sugli alberi fa rumore.
- Fare: `src/mj/mesh.ts` scrive per vertice l'attributo `part` (indice della lettera della palette o della `<color part>`); `models.ts` e `terrain.ts` lo
  passano (il terreno: il codice della casella); ogni mesh/istanza ha un id. Un disegno degli id (MRT se three.js lo permette con il composer, altrimenti un
  secondo disegno con un materiale che scrive id cosa, id parte e profondità, rispettando il taglio del cerchio e il `CUT` delle strutture) e il passo
  dell'inchiostro: bordo dove cambia cosa o parte o dove la profondità salta molto; spessore costante per `devicePixelRatio`; niente inchiostro sui voxel
  luminosi; il colore scurito del pixel. Test sull'attributo `part` di `mesh.ts`.
- Fatto quando: typecheck e test verdi; nel browser gli alberi hanno la sagoma e i confini tra chioma e tronco senza rumore, le case i bordi di muri, tetto e
  finestre, il rilievo i gradini; screenshot confrontato con la foto di T89.
- Esito: inchiostro da id di cosa, istanza e parte con un secondo disegno (`Ink`, `idsOf`, `thingOf`), senza rifare la mappa delle ombre; attributo `part` in `mesh.ts`, `models.ts` e `terrain.ts`; cambiato rispetto al previsto: la parte non è la lettera ma il gruppo delle sfumature di un colore (`partTable`, ADR-0093), il terreno ha una parte per il piano e una per i lati, sui `Builder` la parte è il colore, cache delle forme alla versione 6; test nuovi in `tests/cartoon-ink.test.ts`, voci nel glossario, suite 127 file/1980 test e typecheck verdi; non provati il costo (T89e), la notte e un `devicePixelRatio` diverso da 1; il predefinito resta a T89e. Sicurezza: nessuna superficie nuova.

### T89c · Cartone: luce tinta e prospettiva aerea — `fatto` (`8914f6f`) (dipende da T89a)
- Pipeline: claude · stima 3% · approvato · browser · priorità 77
- Step: 29
- Contesto: ADR-0093, punto 4 (la foto: chiave calda, riempimento freddo, ombre azzurre, lontananza che sbiadisce nel cielo).
- Fare: in `renderer.ts` la luce chiave calda e l'emisfero freddo, l'ombra portata tinta (un pezzo di shader dopo `lights_fragment_end` o il colore
  dell'ombra), la nebbia come prospettiva aerea (verso il colore del cielo, più vicina e più forte, con la camera libera del master compresa), per giorno,
  tramonto e notte; il bloom tarato di nuovo sopra il cartone.
- Fatto quando: typecheck e test verdi; screenshot di giorno e di notte (`k.time` spostato da console) con e senza cartone.
- Esito: luce chiave calda ed emisfero freddo con luna di notte (`cartoonLight`, `PHASES`, `CARTOON_INDOORS`), ombre tinte senza seconda lettura della mappa (`addShade`, da `toon()` e `addGlow`), nebbia come prospettiva aerea anche con la camera libera (`aerial`: 0,85-2,2 distanze), inchiostro che sbiadisce con la nebbia (`uFog` in `Ink`: T89b deve tenerlo), bloom tarato (raggio 0,3; forza 0,5 di giorno, 0,85 di notte, 0,7 al chiuso); test nuovi in `tests/cartoon.test.ts`, ADR-0093 e `#cartone` aggiornati; typecheck e build verdi, suite verde al secondo giro (117 file, 1607 test): al primo giro è fallito `tests/subscription.test.ts` (T68c), che non tocca il renderer e passa da solo, causa non cercata; `CARTOON_BY_DEFAULT` resta `false` finché non è fatto T89b; non provati le prestazioni (T89e) e l'effetto della camera delle ombre ±22 da lontano (dedotto, come nel classico); dopo l'ultima taratura della nebbia ricontrollati solo giorno e notte; icone e laboratorio restano Lambert (T89d, T89e). Sicurezza: nessuna superficie nuova.

### T89d · Cartone: lo stile nei dati e le foto dei modelli — `fatto` (`1b0d744`) (dipende da T89b)
- Pipeline: claude · stima 3% · approvato · browser · priorità 78
- Step: 29
- Contesto: ADR-0093, punto 5. Il bordo nasce dove cambia la parte: i programmi devono avere parti di colore ben distinto.
- Fare: nel seme `world/style.md` e nei prompt `prompts/agents/artista.md` e `scultore.md`: un colore pieno per parte, contrasto di valore tra parti vicine,
  dettagli come lettere scure dedicate (assi, pannelli, crepe) invece di micro-voxel, forme tozze, ambiente smorzato e pochi accenti saturi; il giudizio
  dell'Artista guarda anche se le parti si leggono a contorni. Le foto (`src/mj/photo.ts`, `src/render/thumbs.ts`) con fasce e inchiostro. Le risposte di
  `MockModels` se cambiano gli schemi.
- Fatto quando: typecheck e test verdi; le icone nell'inventario e le foto dell'Artista nel browser hanno l'aspetto del mondo.
- Esito: foto dell'Artista e del tornio sempre a cartone (`cartoonRender`, `inkRaster`, `toonlight.ts`, nessun three.js), icone con fasce, luce di giorno e `Ink` dietro l'interruttore, guida del seme, prompt di Artista e Scultore, `genesis.style` e testo del giudizio aggiornati, schema e mock invariati; cambiato rispetto al previsto: il sole delle foto a cartone è quello del mondo (l'ombra cade a nord-est), le icone disegnano la scena due volte per non bucare i voxel luminosi e dare la riga alla sagoma, il pannello del tornio ora tiene le proporzioni, `window.cartone` si imposta in `bloom.ts`; manca: laboratorio (T89e) e carte del sito ancora alle foto classiche, guide e modelli esistenti non toccati; non provato: giudizio con Gemini vero, `devicePixelRatio` diverso da 1 sulle icone; suite 128 file/1991 test e typecheck verdi. Sicurezza: nessuna superficie nuova.

### T89e · Cartone: laboratorio, prestazioni, togliere la prova — `fatto` (`b05fc0a`) (dipende da T89b, T89d)
- Pipeline: claude · stima 4% · approvato · browser · priorità 79
- Step: 29
- Contesto: ADR-0093, conseguenze e punto 6.
- Fare: `lab/3d/` e `lab/editor/` con l'interruttore cartone/classica (usano `Bloom`); misurare fps e ms per fotogramma con e senza (un luogo pieno, lo
  studio, la corona) e scriverli nell'ADR; se il disegno degli id costa troppo, MRT o metà risoluzione per gli id; togliere `?cartone` e `window.cartone`
  lasciando `?classica`; ADR-0093 `accettato` e AGENTS.md aggiornato.
- Fatto quando: typecheck e test verdi; misure nell'ADR; verifica nel browser di simulazione, studio, corona e laboratorio.
- Nota: un primo lancio (04/11) è partito prima di T89b e T89d perché il parser non espande `T89a-d`; nessun codice. Dipendenza corretta a mano: `docs/pipeline/domande/T89e.md`.
- Esito: cartone predefinito (`cartoonOn`: solo `?classica` lo spegne), tolti `?cartone`, `CARTOON_BY_DEFAULT` e `window.cartone`; interruttore dal vivo in `lab/3d/` e `lab/editor/` (`LabLook` in `lab/look.ts`, `Bloom.inked`); misure in ADR-0093, ora `accettato`, con `lab/scripts/misura-cartone.mjs`: l'inchiostro costa 0,9-2,7 ms a dpr 1 e 2,4-3,3 ms a dpr 2, caso peggiore 13,4 ms, quindi niente MRT né metà risoluzione; cambiato rispetto al previsto: l'interruttore è dal vivo e non un ricaricamento, l'editor passa sempre dal composer, `PCFSoftShadowMap` (rimosso da three.js) sostituito con `PCFShadowMap` nei laboratori; manca: foto del laboratorio (`lab/mjx`, `lab/banco`, script) e carte del sito restano classiche, alcuni task del backlog citano ancora `?cartone`, che ora non fa nulla; non provato: una GPU integrata (misure solo su RTX 2070), un `devicePixelRatio` diverso da 1 guardato a occhio (a dpr 2 solo misurato), la causa dei 2,5 ms di JavaScript nella corona (`Ink.swap` è un'ipotesi); suite 2038 passati e 1 saltato, typecheck verde. Sicurezza: nessuna superficie nuova.

### T92 · Integrare T52 (i sotterranei) nel base 3d — `fatto`
- Pipeline: gemini · stima 1% · approvato · priorità 0
- Step: 13
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
- Step: 18
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
- Step: 13
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
- Step: 27
- Contesto: T93 riporta che `tests/explore*`, `tests/partita*` e `tests/subscription*` falliscono anche lanciati da soli,
  senza legame con Stripe (`traccia T93`); T54 riporta 33 timeout di carico nella suite intera (`traccia T54`).
- Cosa fare: sul base `3d` lancia ciascuno di quei file da solo; per ciò che fallisce davvero (non per timeout di carico) trova il
  commit che l'ha rotto e correggi il codice o il test; i timeout solo di carico restano.
- Quando è fatto: i tre file verdi da soli, typecheck verde, il commit che li aveva rotti scritto nella riga di chiusura.
- Esito: `tests/subscription.test.ts` era già verde da solo (16/16): il suo rosso nella suite intera è di carico. `tests/explore.test.ts` (3/3) e `tests/partita.test.ts` (1 su 5) li aveva rotti `38dcd69` (T45a, crediti per viandante, ADR-0081): in multigiocatore chi ha 0 crediti è servito dai `localModels` del Concilio, non dai modelli passati al kernel, così i `Recording` dei test non vedevano più i piani (`chunk.plan`) né la morte (`player.death`). Il codice è giusto; corretti i test, che danno crediti a chi paga (`giveCredits` a `io` dopo il boot e a ogni viandante che entra in `join`). Ora i tre file verdi da soli, typecheck verde; nella suite intera (sotto `turno test`) 596 passati, 44 rossi in altri file (kernel, between, referente, thin, places, credits) più uno di subscription che da solo passa: timeout di carico, fuori dal task.

### T96 · Mai zero slot per nessun provider — `fatto`
- Pipeline: gemini · stima 3% · priorità 5 · approvato
- Step: 19
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
- Step: 21
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
- Step: 29
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
- Step: 14
- Contesto: `integra T57` va in conflitto con il base `3d` solo in `docs/plans/backlog.md` (il base ha aggiunto T96-T98 e
  aggiornato altri blocchi). T57 ha fatto il pezzo T57a (rune composte come programma); T57b e T57c restano da fare. Nasce da T57: `dossier T57`.
- Cosa fare: nel worktree `git merge task/T57`; in `backlog.md` tieni tutti i blocchi del base e, per il blocco di T57, la versione
  di `task/T57` (T57a fatto con il suo commit, T57b prossimo pezzo, il blocco resta `da fare`); nessun altro file.
- Quando è fatto: merge committato, `npm run typecheck` verde, i test toccati da T57 (`traccia T57`) verdi.
  Esito: merge di `task/T57` sul branch `task/T99`; unico conflitto l'intestazione del blocco T57 in `backlog.md`, presa da `task/T57` (T57a fatto; poi T57b) tenendo «approvato» del base. Typecheck verde; `canon`, `showcase`, `focus` verdi; `kernel.test.ts` 57/57 verde con `--hookTimeout=120000` (senza, i `beforeEach` superano 10 s sotto il carico della pipeline, come già notato in T57a). Come previsto.

### T100 · Integrare T97 e verificare il sito nel browser — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 6
- Step: 21
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
- Step: 21
- Contesto: ADR-0095, punto 2 (Landing Page). La pagina di presentazione di QUINE42.
- Fare: completare la landing page (`site/index.html`, `site/site.css`, `site/landing.ts`) con layout responsive pop art / synthwave: hero banner con Three.js e animazione voxel procedurale MarkovJunior in tempo reale, navigazione con indicatori di stato, pulsante CTA «Gioca Subito» collegato a `../index.html`, sezione pilastri (Rune, MarkovJunior 3D, Carte, Concilio IA), vetrina interattiva delle caratteristiche e footer con la silhouette delle orecchie dei gerboa (il segreto della Corona).
- Fatto quando: typecheck e test verdi; navigazione e canvas 3D funzionanti senza errori nel browser.
- Esito: `task/T101`. `site/site.css` è `docs/design/sito/template.css` copiato (senza i `@font-face`, che dà `src/theme.css`) più le regole della landing; `site/index.html` segue `landing.html` del template; `site/landing.ts` sostituisce `site/preview.ts`. L'hero fa girare **programmi MarkovJunior veri** con il motore del gioco (`compileMjx`/`runMjx` di `src/mj/`, `snapshots`): un labirinto 3D, un corallo e il pino del seme (`universe/models/albero.xml`), un seme nuovo a ogni giro, i voxel visibili in un `InstancedMesh` che cresce passo per passo (passi e voxel in alto a destra), trascinare lo gira, doppio clic passa al prossimo, fermo quando non è sullo schermo. Navigazione con indicatori di stato (`/api/universe`: mondo raggiungibile, numero di reami) e la sezione sullo schermo accesa; vetrina delle caratteristiche a schede (rune, magia, voxel, persone, reami, frecce da tastiera); carta in CSS 3D che si gira (anche da tastiera). Diverso dal previsto: i link alle pagine di T102-T105 non ci sono ancora (sarebbero 404): la navigazione va alle sezioni della pagina e i pulsanti di crediti e profilo sono `PRESTO` (disabilitati), da collegare in quei task; `site` entra nel `tsconfig` (prima non era controllato). Test `tests/site-landing.test.ts`. Nel browser (preview 4931): hero che cresce e cicla i tre programmi, «MONDO ONLINE», schede, flip, sezione attiva allo scorrere, nessuna richiesta a terzi, a 390 px niente overflow e menu che si apre; nessun errore della pagina in console (corretto un indice di fotogramma negativo al primo frame). Typecheck verde; nella suite intera 56 test del multigiocatore in timeout (anche da soli su questa macchina carica, come in T52 e T83), nessuno tocca file di T101.

### T102 · Il sito: login e gestione profilo viandante con visualizzatore 3D — `fatto` (dipende da T109, T97, T44b)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 4% · approvato · priorità 64
- Step: 21
- Contesto: ADR-0095, punto 2 (Profilo & Account) e ADR-0082 (Firebase Auth).
- Fare: creare la pagina profilo (`site/profilo.html` e modulo TS associato): accesso Firebase con Google o anonimo riusando `src/session/login.ts` e `/api/account`; visualizzazione dettagli viandante (ID account, stato collegamento, saldo crediti); editor estetico con scelta colore mantello e seme del modello viandante con anteprima tridimensionale interattiva renderizzata tramite Three.js e `src/mj/mesh.ts`; pulsanti per legare l'account anonimo a Google (`linkWithPopup`) o disconnettersi.
- Fatto quando: typecheck e test verdi; autenticazione e visualizzatore 3D dell'avatar funzionanti nel browser.
- Esito: `task/T102`. `site/profilo.html` + `site/profilo.ts` (input `siteProfilo` di Vite), stile dai template `profilo.html` e `login.html` copiato in `site/site.css`. L'accesso riusa `signIn` di `src/session/login.ts` (nuovo parametro `choose`: la pagina usa i suoi pulsanti Google / anonimo); «Lega a Google» e «Disconnetti» sono quelli di `SignedIn`. Diverso dal previsto: il profilo vive **per reame** (`world/giocatori/<id>.json`), quindi la pagina sceglie il reame da `/api/universe` e serve una rotta nuova, `/api/viandante` (`server/wanderer.ts`, anche nella preview): GET id/account/profilo/crediti/nel mondo e il programma `viandante` del reame, POST tiene il profilo riparato (`kernel.keepProfile` se il mondo gira nel processo, altrimenti sui file su disco con un commit del solo file del giocatore); con gli account chi è viene dal token. Senza account sul server la pagina chiede l'identificativo del viandante (come la sessione senza verificatore). L'anteprima è il modello vero (`runForm` + `meshVoxels` in three.js), si gira trascinando; il colore mostrato è quello che il mondo dipinge davvero (`repairProfile`). La landing collega il profilo (al posto di «PRESTO»). ADR-0095 con la sezione «Attuazione: il profilo». Test `tests/site-profile.test.ts`. Nel browser (preview 4952, universo di prova poi rimosso, server senza account): scheda di `io` con crediti - Fatto quando: typecheck e test verdi; autenticazione e visualizzatore 3D dell'avatar funzionanti nel browser.
2.50, modello 3D che gira e si trascina, mantello rosa e seme 5 salvati (commit «profilo di io dal sito» con il solo file del giocatore, `localStorage` aggiornato), nessun errore della pagina. Non verificato nel browser: l'accesso Firebase vero (nessun progetto né emulatore qui). Typecheck verde; nella suite intera 9 file falliscono per timeout sulla macchina carica (kernel, multigiocatore, abbonamenti: nessuno tocca file di T102; `wanderers.test.ts` da solo impiega 31 s contro i suoi 30 e con un timeout più lungo passa).

### T103 · Il sito: hub sessioni multigiocatore e creazione nuovo universo — `fatto` (dipende da T109, T97, T45d)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 4% · approvato · priorità 66
- Step: 21
- Contesto: ADR-0095, punto 2 (Sessioni & Nuovo Universo), ADR-0058 (sessioni) e ADR-0086 (lobby multigiocatore).
- Fare: implementare l'hub delle sessioni (`site/sessioni.html` e modulo TS associato): interrogare `/api/universe` e lo stato delle sessioni attive su `/api/session`; mostrare la lista dei reami disponibili con dettagli del master, modelli IA impiegati, coefficienti di generazione, stima oraria della spesa e tetto minimo richiesto; pulsante diretto per accedere alla lobby multigiocatore del reame scelto; pannello wizard «Crea nuovo universo» per avviare la Genesi di un nuovo reame git specificando nome, seme e parametri base.
- Fatto quando: typecheck e test verdi; elenco sessioni e creazione nuovo universo funzionanti via interfaccia web.
- Esito: implementato l'hub sessioni in `site/sessioni.html` e `site/sessioni.ts` con foglio di stile dedicato `site/sessioni.css` (conforme al template grafico di `docs/design/sito/`); endpoint GET `/api/session` nel server Vite per interrogare le sessioni attive e i client connessi (`clientCount`); visualizzazione dinamica dei reami con badge live/offline, master, modelli IA impiegati, coefficienti, spesa oraria stimata (`hourlyEstimate`) e tetto minimo; pulsante «Entra nella lobby» collegato a `../index.html?universo=<nome>`; wizard modale interattivo «Crea nuovo universo» con validazione slug git, seme casuale, scelta modalità di partita e profilo IA che genera il nuovo repository git tramite `/api/universe/<nome>/create`. Configurato l'entry point `sessioni` in `vite.config.ts`. Test unitari in `tests/sessioni_hub.test.ts` (8/8 verdi). Typecheck e build verdi.

### T104 · Il sito: area carte collezionabili 3D animate — `fatto` (dipende da T109, T97, T45d, T84)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 5% · approvato · priorità 68
- Step: 21
- Contesto: ADR-0095, punto 2 (Carte 3D), ADR-0056 (carte) e ADR-0084 (eredità dei cloni).
- Fare: sviluppare la galleria interattiva delle carte collezionabili (`site/carte.html` e modulo TS associato): leggere la collezione del viandante (`collectionOf` da `src/kernel/cards.ts` e `world/carte.json`); per ogni carta visualizzare una mesh 3D Three.js con texture olografica prismatica, animazione di galleggiamento e rotazione 3D interattiva su hover/click (flip della carta); esporre i contatori di utilizzo nel mondo (luoghi, trame, prompt, totale), la rarità, l'impronta MinHash e l'albero genealogico della catena dei cloni titolari con le relative quote economiche.
- Fatto quando: typecheck e test verdi; galleria carte 3D interattiva e fluida a 60 fps nel browser.
- Esito: `task/T104`. `site/carte.html`, `carte.ts`, `carte.css`, `carte-art.ts`, `carte-worker.ts`, voce in `vite.config.ts`, link da landing e sessioni; `tests/site-carte.test.ts`. Reame a scelta (`?universo=` o il primo dove si hanno carte), statistiche, schede per famiglia più «Eredità» (ciò che si riceve come titolare di prima), fronte con nome, rarità, miniatura, frase e utilizzi, retro con impronta e catena con quote e quanto è cambiata. Nel kernel: `Forms.request` (estratto da `get`) e `Card.impronta` con `shares`. Diverso dal previsto: carte in CSS 3D e non mesh three.js, come dicono `AGENTS.md`, ADR-0095 e il template (T109); la rarità non esiste nei dati ed è derivata dagli utilizzi; la rendita è in utilizzi e non in dollari come nel template, perché le quote non muovono crediti. Limiti: con `QUINE_MASTER` il master vede la sua collezione con `?viandante=io` (il client non sa di essere `io`); il login con Firebase non è stato provato nel browser, serve un progetto o l'emulatore; la pagina legge lo snapshot intero da `/api/universe/<nome>`, aperto a chiunque come per l'hub di T103: da restringere prima di un deploy pubblico. Nel browser (preview 4977, universo di prova con 62 carte e catene, poi cancellato): 60 fps con flip e inclinazione, 59,5 scorrendo tutte le 62 carte (peggior fotogramma 33 ms), giro con clic e Invio, «mostra altre», miniature vere dei modelli, nomi con HTML mostrati come testo, a 390 px (in un iframe: la finestra non si è ridimensionata) niente overflow, collezione vuota, nessun errore in console. Test: typecheck verde, `site-carte`, `cards`, `heritage` verdi; **la suite intera non è verde**: 653 su 675, i 22 falliti tutti timeout con il limite scritto nel test, quasi tutti del multigiocatore (`between credits referente thin wanderers watch branch lobby places`), con la macchina condivisa. `watch`, `places` e `wanderers` da soli danno gli stessi esiti e tempi con e senza le modifiche al kernel di questo task (`watch` e `wanderers` falliscono anche sulla base: 1 test ciascuno); gli altri file non sono stati confrontati così. Una regressione mia trovata così e corretta: `Forms.get` costruiva la richiesta prima di guardare la cache.

### T105 · Il sito: area pagamenti e cruscotto crediti Stripe — `fatto` (dipende da T109, T97, T45e, T93)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 3% · approvato · priorità 70
- Step: 21
- Contesto: ADR-0095, punto 2 (Crediti & Stripe), ADR-0081 (crediti) e ADR-0083 (Stripe Checkout).
- Fare: realizzare la pagina di gestione crediti (`site/pagamenti.html` e modulo TS associato): cruscotto con saldo crediti disponibile e storico dei consumi; selettore per ricarica crediti con tagli prefissati ($5, $10, $20, $50) o cifra libera; interazione con l'endpoint `/api/stripe/checkout` per avviare la sessione protetta Stripe Checkout (supporto carte e Google Pay); tabella cronologica dei pagamenti ricevuti letta da `world/pagamenti.json` con id transazione, data e accredito.
- Fatto quando: typecheck e test verdi; flusso di checkout Stripe avviabile dall'interfaccia e storico consultabile.
- Esito: `task/T105`. `site/pagamenti.html` + `site/pagamenti.ts` (input `sitePagamenti`), stile dal template copiato in `site/site.css`, link «Crediti» in tutte le pagine, «RICARICA» nella landing (al posto di «PRESTO») e nel profilo. Diverso dal previsto: serve una rotta nuova, `/api/crediti` (`server/wallet.ts`), che dà solo le righe del viandante, perché `pagamenti.json` e `consumi.json` contengono quelle di tutti; le parti comuni delle pagine passano da `profilo.ts` a `site/shared.ts`; le rotte di Stripe entrano anche nella preview; `/api/stripe/checkout` ora rifiuta meno di 1 $ e arrotonda al centesimo. Tolti dal template perché il gioco non li ha: bonus, ore stimate, accrediti dalle carte, colonne metodo e stato. Lo storico dei consumi non comprende la quota delle spese comuni (non è registrata per viandante): la pagina lo dice. ADR-0095 con la sezione «Attuazione: i crediti». Test `tests/site-wallet.test.ts`. Typecheck verde. Suite intera nel turno, due volte: 651 passati, 45 falliti, quasi tutti timeout. Rilanciati da soli passano `kernel`, `credits`, `places`, `subscription`; restano 14 timeout in `watch`, `referente`, `wanderers`, `thin`, `between`, file che non importano nulla di ciò che T105 cambia (`src/` non è toccato), con la macchina carica: non provato sul base. Nel browser (preview, universo di prova poi rimosso, `STRIPE_SECRET_KEY=mock`, server senza account): saldo, tagli e importo libero, il clic porta a `checkout.stripe.com` con la sessione finta, ritorno con il webhook in ritardo fino ad «ACCREDITATO!» (saldo da 12,50 a 17,50, commit dei soli due file), annullamento, anonimo senza ricarica. Non verificati nel browser: un pagamento su Stripe vero (nessuna chiave in questo worktree; la stessa rotta è quella provata da T93) e l'accesso Firebase. Attenzione per T124: nella preview il webhook senza `STRIPE_WEBHOOK_SECRET` accetta eventi non firmati, come già nel server di sviluppo. T125 sposterà saldi e pagamenti: `server/wallet.ts` è l'unico punto del sito da adattare, oltre a `server/wanderer.ts`.

### T106 · Tema pop art / retro arcade: applicazione alle interfacce in-game — `fatto` (`126c5a6`) (dipende da T109, T97, T205)

- Stile: copia lo stile grafico del template in `docs/design/sito/` (fatto da T109, leggi il suo `README.md`).
- Pipeline: claude · stima 4% · approvato · priorità 72
- Step: 21
- Contesto: ADR-0095, punto 3 (Variabili CSS unificate). Il tema grafico deve permeare anche l'esperienza di gioco.
- Fare: aggiornare `src/style.css` e i componenti UI in-game (`src/ui/hud.ts`, `inventory.ts`, `lobby.ts`, `profile.ts`, `chat.ts`, `creditdialog.ts`) per adottare appieno i token di `src/theme.css`: bordi a inchiostro netto fumetto (`--border-ink-thick`), ombre rigide neon offset (`--shadow-hard-cyan`, `--shadow-hard-pink`), pattern mezze tinte sui pannelli modali, pulsanti arcade retrò e font display per intestazioni e notifiche d'avviso.
- Fatto quando: typecheck e test verdi; screenshot nel browser delle interfacce in-game rinnovate con il tema pop art comics / neon punk.
- Esito: tema pop art/arcade nelle interfacce in gioco (`src/style.css`, classi in hud, inventory, lobby, profile, creditdialog e login; `chat.ts` invariato), `#topleft` in `index.html`, `tests/theme.test.ts`, riga in `#sito`; typecheck, build e suite (110 file, 1469 test) verdi, con una traccia V8 di memoria esaurita nell'output dei test, probabilmente dalle prove sui limiti dei mondi, non accertata. Non provati: finestra di login nel browser, riga crediti del profilo con account, lobby in una vera partita di molti (aperta col modulo vero e i file del seme), mobile, strumenti del master riguardati a vista. Sicurezza: nessuna superficie nuova.

### T107 · Il sito: correggere i difetti della pagina dimostrativa — `fatto`
- Pipeline: gemini · stima 2% · approvato · priorità 20
- Step: 21
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
- Step: 21
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
- Step: 21
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
- Step: 21
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
- Step: 19
- Contesto: il 01/11 T109 e T110 (verifica nel browser) erano assegnati a `claude`; con lo slot di Claude occupato la pipeline ha scritto
  «claude non può, va su gemini» e li ha lanciati su Antigravity, che non ha il browser: T110 è stato interrotto a mano. `assegna` rifiuta già
  questi task su un provider senza browser (`assignTask` in `tools/pipeline/pipeline.mjs`), il ripiego no.
- Cosa fare: nel ripiego del lancio (dove nasce «non può, va su») non scegliere un provider senza browser per un task che chiede la verifica nel
  browser (stesso controllo di `assignTask`): il task aspetta il suo provider. Un test della pipeline che lo copre.
- Quando è fatto: test della pipeline verdi con il caso nuovo; typecheck verde.

### T112 · Verificare T110 (il template del sito, con T109) nel browser — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 25 · browser
- Step: 21
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
- Step: 15
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
- Step: 21
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
- Step: 14
- Contesto: T57b è fatto in `task/T57b` (rune nuove dal Concilio, `src/kernel/magic.ts`, compito `rune.invent`), ma `integra T57b` va in conflitto in `AGENTS.md`, `docs/adr/README.md` e `src/kernel/agents/effects.ts` con T57c (già nel base, ADR-0096 effetto rilievo). Anche T57b ha scritto un ADR-0096. Nasce da T57b: `dossier T57b`, `traccia T57b`.
- Cosa fare: nel worktree `git merge task/T57b`; l'ADR di T57b diventa **ADR-0097** (file rinominato, indice, riferimenti in `AGENTS.md`, backlog e codice); nelle sezioni in conflitto tenere entrambe le aggiunte (in `effects.ts` sia la guida dell'effetto `rilievo` di T57c sia le rune nuove in `SPELL_GUIDE` di T57b); typecheck, `tests/magic.test.ts`, `tests/effects*` e la suite intera nel turno test (`pipeline.mjs turno test -- npm test`). I 5 timeout noti (referente T42e/T42f, wanderers T34, watch T42c) falliscono anche sul base: non sono difetti.
- Quando è fatto: merge risolto con ADR-0097, typecheck e test verdi (salvo i timeout noti), commit su `task/T115`.
- Esito: merge di `task/T57b` risolto (commit di merge su `task/T115`): l'ADR delle rune nuove è ADR-0097 (file, indice, `AGENTS.md`, `kernel.ts`, `magic.ts`, blocco di T57b); ADR-0096 resta a T57c; in `SPELL_GUIDE` gli esempi e l'elenco con `rilievo` di T57c più la riga su `runa_nuova` di T57b; in `AGENTS.md` (Magia) entrambe le aggiunte. Typecheck verde; `magic`, `coefficients`, `rilievo` verdi. Suite intera nel turno test: 48 falliti su 667, solo timeout sotto il carico; i 10 file rilanciati con tempi lunghi danno 100 verdi su 105, restano i 5 noti (referente T42e/T42f, wanderers T34, watch T42c) con timeout fisso nel test; non rilanciato `abbonamenti` T68b, che usa la CLI reale.

### T116 · Integrare T102 (la pagina profilo del sito) — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 21
- Step: 21
- Contesto: T102 è fatto in `task/T102` (pagina profilo, editor con anteprima 3D, rotta `/api/viandante`), ma `integra T102` va in conflitto in `site/index.html` e `vite.config.ts` con T103/T114 (hub sessioni, `GET /api/session`, link a `sessioni.html`), già nel base. Nasce da T102: `dossier T102`, `traccia T102`; vedi anche `dossier T114`.
- Cosa fare: nel worktree `git merge task/T102`; tenere entrambe le aggiunte (in `vite.config.ts` gli ingressi delle pagine e le rotte di tutti e due; in `site/index.html` la landing di T101 con i link sia a `sessioni.html` sia al profilo); typecheck e la suite nel turno test (`pipeline.mjs turno test -- npm test`); i timeout noti (referente, wanderers, watch, kernel sotto carico) non sono difetti. Una prova breve nel turno browser: le pagine landing, sessioni e profilo si aprono e i link tra loro funzionano.
- Quando è fatto: merge risolto, typecheck e test verdi (salvo i timeout noti), commit su `task/T116`.
- Esito: fuso `task/T102`; in `site/index.html` (barra e footer) tenuti sia «Sessioni» sia «Profilo», in `vite.config.ts` gli ingressi `sessioni` e `siteProfilo` e tutte le rotte. In più del previsto: `site/profilo.html` non portava a `sessioni.html` né `site/sessioni.html` a `profilo.html`, aggiunti i due link in barra e footer. Typecheck e build verdi. Suite intera nel turno: 45 falliti su 675 in 9 file, con la CPU al 100%: 44 per timeout e 1 asserzione (`subscription.test.ts`, la Genesi con la coda). Rilanciati un file alla volta: `credits`, `subscription`, `thin` verdi così come sono; `between`, `places`, `referente`, `wanderers`, `watch`, `kernel` (più dei timeout noti: anche `between` e `places`) verdi solo con i timeout alzati a mano per la prova (600 s, hook 300 s), poi ripristinati, 81/81; `between` e `kernel` hanno preso circa 10 minuti ciascuno. Non c'è una suite intera tutta verde, e non ho misurato i tempi sul base per confronto; il codice del merge non tocca il tick (`keepProfile` è chiamato solo da `/api/viandante`). Browser: landing → Sessioni → Profilo → Sessioni → landing con i clic veri, `/api/viandante` e `GET /api/session` rispondono in preview, nessun errore in console. Non riprovati dopo il merge: la scheda del viandante e l'anteprima 3D (in questo worktree non c'è nessun universo), né l'accesso Firebase vero (nemmeno T102 lo ha provato).

### T117 · Audit di sicurezza: il Lua sul server, le chiavi, i rischi a valle del Concilio — `fatto`
- Pipeline: claude · stima 5% · approvato · priorità 0
- Step: 22
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
- Step: 19
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
- Step: 21
- Contesto: `integra T116` va in conflitto in `AGENTS.md`, `docs/plans/backlog.md` e `vite.config.ts` con T104 (galleria delle carte), appena entrato nel base. `task/T116` contiene già il merge di T102. Nasce da T116, T102 e T104: `dossier T116`, `dossier T104`.
- Cosa fare: nel worktree di T119 `git merge task/T116`; risolvere tenendo entrambe le aggiunte (pagine del sito in `vite.config.ts`, righe di `AGENTS.md`); nel backlog restano i blocchi di tutti i task. Niente nuove funzioni.
- Test: typecheck e build; `tests/site-profile.test.ts` e `tests/site-carte.test.ts` da soli. La suite intera è da poco stata eseguita da T116 e T104 con timeout per il carico: **non ripeterla** se il merge tocca solo i tre file in conflitto (T118 si occupa del carico); dillo nell'esito. Se il merge cambia altro codice, lanciala con il turno.
- Browser: una controllata veloce che `site/profilo.html` e `site/carte.html` si aprano senza errori in console e con i link tra le pagine; scheda del viandante e anteprima 3D con un universo di prova, che T116 non ha riprovato dopo il merge. Login Firebase non richiesto.
- Quando è fatto: merge risolto, verifiche sopra fatte, commit su `task/T119`. Poi l'orchestratore fa `integra T119`, `integra T116`, `integra T102`.
- Esito: `task/T119`, fuso `task/T116`. Conflitti in `AGENTS.md` (la riga del sito dice carte e profilo), `docs/plans/backlog.md` (l'esito di T116 al suo blocco, tutti i blocchi restano), `vite.config.ts` (ingressi `carte` e `siteProfilo`). Più del previsto, per i link tra le pagine: `site/profilo.html` portava le carte a `index.html#carte` e ora a `carte.html`; `site/carte.html` non portava al profilo, aggiunto in barra e footer. Typecheck e build verdi; `site-profile` e `site-carte` verdi (16 test). **Suite intera non ripetuta**: come dice il task, il merge non cambia codice oltre ai file in conflitto e ai due link HTML. Nel browser (preview 4983, universo di prova con 8 carte, poi cancellato, server senza account): scheda di `io` nel reame, anteprima 3D che cambia colore del mantello e gira trascinando, galleria con 8 carte e miniature; link profilo → carte e carte → profilo provati; nessun errore in console. Non provati: salvataggio del profilo dalla pagina (coperto da `site-profile`), login Firebase, giro delle carte.

### T141 · Il materiale per generare il nuovo logo — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 0
- Step: 16
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
- Step: 14
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
- Step: 22
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
- Step: 22
- Contesto: R3 dell'audit: `safePath` (`universeStore.ts`) e `cleanBranch` (`src/session/server.ts`) confrontano `.git` alla lettera; su NTFS varianti dello stesso nome sono la stessa cartella, e scriverci può diventare esecuzione di codice sulla macchina (il server lancia git lì).
- Cosa fare: elenco di percorsi ammessi (`modules/ models/ world/ maps/ prompts/ universe.json`, da verificare con ciò che il kernel scrive davvero) invece di un divieto; normalizzare maiuscole, punti e spazi finali, flussi NTFS, nomi riservati di Windows; git lanciato con `core.hooksPath` vuoto e nessuna configurazione del repository scrivibile.
- Test: tabella di percorsi rifiutati sul validatore dei percorsi, senza scrivere fuori da una cartella temporanea.
- Quando è fatto: test e typecheck verdi, commit su `task/T121`.
- Esito: `task/T121`, ADR-0103. `src/kernel/paths.ts` (`allowedPath`) al posto del divieto, in `safePath`, `cleanBranch` e `PUT map`; un commit con un percorso rifiutato risponde 400 e non scrive nulla; `server/git.ts` (`runGit`) è l'unico git del server (anche `stripe` e `wanderer`). V-003 chiusa, `tests/sicurezza/percorsi.test.ts` nuovo. **Diverso dal previsto**: (1) `core.hooksPath=/dev/null`, non vuoto: provato, vuoto cerca `/pre-commit` alla radice del disco; (2) si rifiuta invece di normalizzare: con un elenco non serve conoscere le equivalenze; (3) `seed.json` nell'elenco, che il task non diceva, e `assets/` no: è del vecchio 2D e nessuno la scrive; (4) in più, trovato leggendo: un `commit` su un universo senza `.git` faceva `git add -A` e `git commit` **nel repository del kernel**, sopra `universes/` (solo da questa macchina): ora git non risale (`GIT_CEILING_DIRECTORIES`) e il magazzino rifiuta prima; `UNIVERSE_NAME_RE` unica, nomi di universi, viandanti e moduli non dispositivi di Windows; `UniverseClient` toglie il percorso non ammesso e scrive il resto del commit, che altrimenti andrebbe perso. Sicurezza: V-003 chiusa, nessuna voce nuova; il `commit` nel repository del kernel è dentro V-003 e chiuso qui. Kit `--solo V-003` (`esiti/2026-11-01-dopo-T121.json`): 8 ok su 8; il kit intero non è stato rifatto. **Suite intera: 1033 verdi, 1 rosso**, il timeout da 60 s di un test di `tests/between.test.ts`, a macchina carica (lo stesso file è già nei timeout di T137); da solo con il limite alzato passa 7 su 7, ma a circa 67 s per test, sopra il limite: è il carico o il test è al limite, non i percorsi. Typecheck verde. Niente browser: il task non lo chiede, quindi il gioco non è stato aperto.

### T122 · Non si esce dalla sandbox: prove difensive e chiusure — `fatto` (dipende da T136, T137)
- Pipeline: claude · stima 4% · approvato · priorità 2
- Step: 22
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
- Step: 22
- Contesto: R2: `/api/gemini` spende la chiave per chiunque raggiunga la porta, con qualunque modello `gemini-*` e fino a 12 MB.
- Cosa fare: elenco dei modelli ammessi (quelli di `universe.json` e dei prezzi), corpo massimo ridotto, tetto di spesa nel proxy, accesso solo da loopback con controllo di `Origin`; in multigiocatore il server chiama Google direttamente, senza route pubblica. La chiave resta fuori dal browser (regola 9).
- Test: richieste rifiutate per origine, modello e dimensione, con `fetch` finto; nessuna chiamata vera a Gemini.
- Quando è fatto: test e typecheck verdi, commit su `task/T123`.
- Esito: `GeminiGate` in `server/geminiProxy.ts`, ADR-0099, V-002 `chiusa`, `tests/sicurezza/gemini.test.ts`. Corpo massimo 2 MB. Scelte non scritte nel task: tetto giornaliero per tutta la chiave (`GEMINI_TETTO_GIORNALIERO`, predefinito 10 $, in `universes/.spesa-gemini.json`); un modello fuori dai prezzi ma nominato da un universo passa e si conta al prezzo del più caro; al tetto la risposta è 402 e `GeminiModels` la traduce in `BudgetError`. Più del previsto: controllo di `Host` e delle intestazioni di inoltro (nomi puntati su 127.0.0.1, tunnel). Nessuna chiamata vera a Gemini: la porta diretta del multigiocatore è provata con `fetch` finto, non con una partita vera. Sicurezza: nessuna superficie nuova.

### T124 · Il webhook di Stripe — `fatto` (dipende da T136, T139)
- Pipeline: claude · stima 2% · approvato · priorità 7
- Step: 22
- Contesto: R4: senza `STRIPE_WEBHOOK_SECRET` ogni evento è accettato (crediti gratis); `metadata.universo` e `wandererId` finiscono in `path.join` senza validazione; `crediti` non è confrontato con `amount_total`. T105 ha aggiunto le rotte di Stripe anche alla preview e riscritto parte di `server/stripe.ts`: per questo si parte da T139.
- Cosa fare: senza segreto la route risponde 503, nel server di sviluppo e nella preview; validare nomi e id come fa il checkout; credito calcolato dall'importo pagato.
- Test: i tre casi.
- Quando è fatto: test e typecheck verdi, commit su `task/T124`.
- Esito: `task/T124`. Senza segreto la route risponde 503 (sviluppo e preview); universo e viandante validati come nel checkout; credito da `paidCents` (il minore tra `amount_total` e `amount_subtotal`, solo dollari), mai dai metadati. In più rispetto al previsto: una chiave vera senza segreto del webhook non apre sessioni e `config` dice `available: false`, altrimenti si incasserebbe senza poter accreditare; la prova V-004.c del kit è riscritta perché dava FALLA sempre. Kit: V-004.a-e ok (`esiti/2026-11-01-dopo-T124.json`). Tasse escluse non provate contro una sessione vera di Stripe: da guardare in T45f. Sicurezza: V-004 chiusa, nessuna superficie nuova.

### T125 · Saldi e pagamenti fuori dall'universo — `fatto` (dipende da T120, T124)
- Pipeline: claude · stima 6% · approvato · priorità 8
- Step: 22
- Contesto: R5 e R10: i crediti sono **l'unica cosa del gioco che non si deve poter modificare**, ma stanno in `world/giocatori/*.json` e `world/pagamenti.json`, nel repository dell'universo: un `checkout`, `R`, un ramo pubblicato o il codice generato possono cambiarli; la risposta del Referente diventa `giveCredits` senza tetto visibile; il controllo di idempotenza non passa dalla coda `serial`. Vedi ADR-0081, 0083.
- Cosa fare: un archivio del server fuori dalla storia dell'universo per saldi e registro dei pagamenti, con migrazione dai file di oggi; nessuna via da Lua, dal Concilio, dal ramo o dal rollback; accredito atomico e idempotente; chi può ricaricare a mano e con quale tetto (scriverlo nell'ADR). I saldi degli altri non vanno al master nei file. ADR nuovo e `AGENTS.md`.
- Test: rollback, ramo pubblicato e codice generato non cambiano i saldi; due eventi uguali in contemporanea accreditano una volta. La corsa è stata misurata (V-005.a: 8 consegne, 2 accrediti) ma non esce a ogni giro: il test la ripete o la forza, un solo giro verde non basta.
- Quando è fatto: test e typecheck verdi, commit su `task/T125`.
- Esito: `task/T125`, ADR-0104. Saldi, pagamenti e ricariche in `universes/.saldi/<nome>.json` (`server/ledger.ts`, `Ledger` in `credits.ts`), fuori da ogni repository; passi atomici sotto un lucchetto che vale tra processi; migrazione alla prima volta che il server incontra un universo, poi i file non contano più e `sweepBalances` li ripulisce (anche dopo un `checkout`). Test `tests/sicurezza/saldi.test.ts`: la corsa forzata con 8 consegne e un commit in mezzo per 12 giri, metà attraverso il mondo acceso per 10 giri, quattro processi veri. Kit su server vero: V-005.a-c e V-010.a-b ok (`esiti/2026-11-02-dopo-T125.json`; 12 FALLA di voci aperte di altri task). Browser: `npm run dev`, universo di prova usa e getta, master: saldi migrati, ricarica di 3 a un viandante, rifiuto oltre il tetto, riga nella console, nessun errore. **Decisioni da far vedere all'autore** (ADR-0104): (1) il Referente non dà più crediti, nemmeno al master; (2) il tetto delle ricariche a mano è per universo e per giorno, `QUINE_TETTO_RICARICHE`: **0 con gli account** se il `.env` non dice altro (chiunque può fare un universo e diventarne master, e il dono spende la chiave del server), 20 senza. **Diverso dal previsto**: il clone non porta più i saldi (prima li duplicava); V-005.b e V-004.c del kit riscritte (motivi nel registro e nel catalogo); un accredito non fa più commit, quindi cambia il test di T93. Limiti: nella storia di un universo di prima della migrazione si leggono ancora i saldi di allora (accettato, non si riscrive la storia); nella console il master sceglie solo tra sé e i collegati. Sicurezza: V-005 e V-010 chiuse, nessuna voce nuova; superficie nuova: il messaggio `ricarica`, solo master.

### T126 · I limiti dentro la sandbox — `fatto` (dipende da T136)
- Pipeline: claude · stima 4% · approvato · priorità 9
- Step: 22
- Contesto: R7, prima parte. Provato: un solo pattern di `string.find` blocca il processo oltre 60 s; `string.rep` alloca 200 MB senza guasti. Il budget conta le istruzioni VM per chiamata, non il lavoro nelle funzioni C né il tick.
- Cosa fare: `string.*` con limiti di lunghezza e di pattern; limite di memoria della VM; budget per tick; limiti di scatola e di tempo per i programmi MarkovJunior sul server (l'XML può dire la propria `size`). Attenzione ai moduli esistenti, che devono continuare a girare, e alle prestazioni del tick.
- Test: i casi della tabella dell'audit finiscono in un guasto entro un tempo breve, senza payload nel report.
- Quando è fatto: test e typecheck verdi, commit su `task/T126`.
- Esito: ADR-0103. Oltre al previsto: i pattern costosi non si vietano, girano in un porting di `lstrlib.c` in Lua (`tests/sandbox-patterns.test.ts` lo confronta col C), dove il budget li conta; la memoria e la lunghezza delle stringhe stanno nell'allocatore (`Meter`), che conta anche i byte copiati; una rete di 2 s con l'orologio per ciò che non si misura. Chi viene dopo il budget del tick salta senza guasto suo (`tick:budget`), `core.*` gira comunque. Tick del seme da ~0,95 a ~1,15 ms. Sicurezza: V-007 `in correzione`, resta T127 (blocco di qualche secondo per chiamata, memoria dal lato JS, modelli fino a 30 s); nessuna superficie nuova. Suite intera verde (820 verdi, 11 attesi). Non provato nel browser (il task non lo chiede) e il kit di T137 non ripassato.

### T127 · Ogni mondo in un worker con un sorvegliante — `fatto` (dipende da T120, T126)
- Pipeline: claude · stima 8% · approvato · priorità 10
- Step: 22
- Contesto: R7, seconda parte, la difesa più importante a valle: oggi tick, Lua e HTTP stanno nello stesso event loop del processo che tiene i segreti. Vedi ADR-0058 (`server/session.ts`, `src/session/host.ts`).
- Cosa fare: ogni mondo in un `worker_thread` o processo, **senza i segreti nell'ambiente**, con limite di memoria e un sorvegliante che lo uccide se il tick si blocca e lo riavvia dall'ultimo stato valido; i MarkovJunior nel worker; i client lo sanno (un avviso, non un errore). ADR nuovo e `AGENTS.md`. Se è troppo grande, spezzarlo.
- Test: un mondo bloccato non ferma l'HTTP né un altro mondo e riparte; i test del multigiocatore restano verdi.
- Browser: due schede in multigiocatore che giocano e si vedono.
- Quando è fatto: test e typecheck verdi, commit su `task/T127`.
- Esito: `task/T127`, ADR-0110, V-007 chiusa. **Un processo, non un worker** (un worker condivide la memoria con chi tiene i segreti): `server/worldHost.ts`, `src/session/worldProcess.ts`. Sorvegliante: avviso dopo 5 s di silenzio, ucciso dopo 45 s, riparte dal disco; alla seconda morte di fila torna all'ultimo commit vissuto, alla quarta si arrende e il prossimo client riprova. Heap 1024 MB (`QUINE_MONDO_MEMORIA`). **Oltre il previsto**: (1) `--permission` di Node: il mondo legge solo la cartella del suo programma, costruito intero con Vite, e scrive solo il suo archivio dei saldi; un test ha trovato che permettere una cartella superiore apriva anche il `.env`, da qui il programma intero; (2) il token del mondo vale per il suo universo, il segreto del processo non è più un token e un mondo non clona; (3) le rotte non hanno più il kernel in mano: `getActiveWorld` e `WorldCalls` al posto di `getActiveKernel`, con 10 s di attesa; (4) il client resta collegato e rientra da solo (`mondo` nel protocollo, `ThinClient.again`). **Da sapere**: si perde ciò che è successo dopo l'ultimo salvataggio (al più 2 minuti); restano, scritti nell'ADR, la rete del processo su Node 22, la memoria fuori dallo heap, un mondo lento ma vivo che non viene ucciso, il volume del canale. Solo `npm run dev`: la produzione è T133, che può riusare `WorldHost` e `buildWorld`. Sicurezza: V-007 chiusa; superficie nuova: il canale tra server e mondo. Kit `--solo V-001,V-002,V-005,V-007`: 23 ok (`esiti/2026-11-02-dopo-T127.json`); il kit misura l'HTTP accanto a un mondo acceso, il blocco vero, la memoria e i permessi stanno in `tests/sicurezza/mondo.test.ts`. Browser su `npm run dev`, universo di prova usa e getta, `?offline`: due schede che camminano e si vedono; ucciso il processo del mondo a mano, HTTP subito attivo, le due schede ricevono l'avviso, rientrano da sole e riprendono a camminare; negli errori della console solo messaggi del canale di un'estensione del browser.

### T128 · La coda delle CLI — `fatto` (dipende da T136)
- Pipeline: claude · stima 3% · approvato · priorità 11
- Step: 22
- Contesto: R9: `POST /api/coda` non ha autenticazione e accetta `system` e `prompt` qualsiasi; un testo dettato dal giocatore può arrivare a un agente con strumenti sulla macchina di chi gioca. Vedi ADR-0077.
- Cosa fare: route montata solo su richiesta esplicita, solo in loopback, con un segreto locale; CLI in una cartella vuota, ambiente ridotto, strumenti esclusi e configurazione MCP e hook isolati, con conferma verificata; se Antigravity non può escludere gli strumenti, niente Antigravity sulla coda (dirlo all'autore nell'esito).
- Test: senza segreto o non da loopback è rifiutata; gli argomenti delle CLI, senza lanciarle.
- Quando è fatto: test e typecheck verdi, commit su `task/T128`.
- Esito: fatto su `task/T128`, ADR-0102, V-009 chiusa. La route c'è solo con `QUINE_CODA=1`, da loopback e con un segreto in memoria; CLI in una cartella vuota, ambiente ridotto, senza strumenti, MCP, hook e impostazioni. Rispetto al previsto: il testo va su stdin (come argomento poteva diventare un'opzione); la conferma è a ogni esecuzione, dall'`init` della CLI, e una breccia ferma il processo. **Antigravity esce dalla coda**: `agy` 1.4.12 non può escludere gli strumenti. Provato con la CLI vera: il solo `--tools ""` di prima lasciava hook, `CLAUDE.md` e 8 strumenti MCP. Sicurezza: nessuna superficie nuova oltre a `GET /api/coda/segreto`; le richieste in `universes/.coda/` restano leggibili dal server di sviluppo finché V-012 è aperta (T130).

### T129 · Limiti ai messaggi — `fatto` (dipende da T120)
- Pipeline: claude · stima 2% · approvato · priorità 12
- Step: 22
- Contesto: R11: `inbox` non ha tetto per client, ogni messaggio può chiamare il modello, `testo` è tagliato solo per `agente`. Un giocatore esaurisce i budget comuni del mondo.
- Cosa fare: ritmo per client, lunghezza massima del testo, code per pagante, in `src/session/server.ts`. Il gioco normale non deve accorgersene.
- Test: un client che inonda è limitato, gli altri no.
- Quando è fatto: test e typecheck verdi, commit su `task/T129`.
- Esito: `task/T129`, ADR-0107. `LIMITS` in `src/session/server.ts`: 60 messaggi al secondo (120 di colpo), ciò che può chiamare i modelli (`heavy`) uno ogni 2 secondi (20 di colpo) e al più 2 in corso con 8 in coda per pagante, testo verso il Concilio a 500 caratteri. **Diverso dal previsto**: (1) il ritmo è per viandante e non per client, perché rientrare non lo riempia; (2) in più: chi supera 600 rifiuti accumulati viene chiuso, `profilo` conta come `heavy` perché scrive lo stato, nome d'ingresso a 64 caratteri, e in `server/session.ts` ciò che arriva mentre il mondo si apre si ferma a 16 messaggi. Non coperti, scritti nell'ADR: molti account, peso in byte. Kit: V-011.a ok contro il server vero (`esiti/2026-11-02-dopo-T129.json`). Sicurezza: V-011 chiusa, nessuna voce nuova. Test: con la macchina carica, 2 giri su 3 della suite intera danno timeout a 60 s in `between`, `branch`, `credits`, `referente` (kernel multipli, nessuna asserzione fallita): da soli passano e con `--testTimeout=240000` la suite intera è verde.

### T130 · Ciò che esce e ciò che il Concilio scrive — `fatto` (dipende da T120)
- Pipeline: claude · stima 3% · approvato · priorità 13
- Step: 22
- Contesto: R12 e R13. `playerFiles` toglie campi invece di ammetterli; in sviluppo Vite potrebbe servire i file di `universes/` (da verificare). Il Concilio può forse scrivere `ai` in `universe.json`, cioè budget e provider: soldi veri, quindi fuori dal «tutto si può modificare».
- Cosa fare: `playerFiles` a elenco di campi ammessi; `universes/` non servito da Vite; il Concilio scrive solo in un elenco di percorsi; `ai` solo dal kernel, su comando del master.
- Test: i campi che non escono; una scrittura di `ai` dal Concilio rifiutata.
- Quando è fatto: test e typecheck verdi, commit su `task/T130`.
- Esito: `task/T130`, ADR-0109. `playerFiles` e `publicFiles` a elenco di campi (`src/session/files.ts`), `universes/` non servito (`server/hidden.ts` e `server.fs.deny`), il Concilio fermato sul commit (`fenceCouncil`, `councilMayWrite`). V-012 e V-013 chiuse, `tests/sicurezza/uscite.test.ts` nuovo, tolti gli `it.fails`; kit `--solo V-012,V-014`: 15 ok, 0 FALLA. **Diverso dal previsto**: (1) la lettura delle scritture del Concilio dice che oggi non arriva a `universe.json`: percorsi fissi o da id validati, quindi V-013 era una regola mancante, non una via aperta; (2) `ai` non sparisce del tutto: alla lobby e al sito (`publicFiles`) restano modelli, coefficienti, minimi e budget, perché li mostrano (ADR-0086), mai `provider` e `agenti`; (3) un manifest illeggibile non esce più: lo specchio va avanti senza quel modulo; (4) degli effetti delle azioni esce solo il `tipo`, perché l'inventario mostra il pulsante se ne ha. Niente browser: il task non lo chiede e non cambia ciò che si vede; lo specchio del giocatore è provato sui file del seme. `tests/session.test.ts` non pretendeva più a torto che `universe.json` arrivi uguale al giocatore: ora confronta nome, seme e chunk. Sicurezza: V-012 e V-013 chiuse, nessuna voce nuova.

### T131 · `npm audit` e Vite — `fatto` (dipende da T136)
- Pipeline: claude · stima 2% · approvato · priorità 2
- Step: 22
- Contesto: R14: Vite 5.4.10, l'audit non ha lanciato `npm audit`.
- Cosa fare: lanciarlo, aggiornare ciò che serve (Vite compreso, nei limiti della 5.x se basta), riportare ciò che resta aperto e perché.
- Test: suite intera, typecheck, build.
- Browser: il gioco parte in `?skip&offline`.
- Quando è fatto: commit su `task/T131`.
- Esito: `npm audit` da 15 avvisi (2 critici, 5 alti, 8 moderati) a **0**; non resta aperto nulla. **La 5.x non bastava** (gli avvisi di Vite arrivano alla 6.4.3, quelli di Vitest alla 4.1.11): Vite 7.3.7, Vitest 4.1.12, `vite-node` 5.3.0 diretto (Vitest 4 non lo porta più), `npm audit fix` per il resto, un override di `@grpc/grpc-js` solo sotto `@firebase/firestore` (il progetto non importa Firestore, gRPC non è in `dist/`). ADR-0099. V-014 `in correzione`: la parte delle dipendenze è fatta, la chiude T133. Più del previsto: `tests/sicurezza/dipendenze.test.ts` (il lock non torna indietro; il server di sviluppo non dà `.env` nelle forme del kit: controllate le stesse forme su 5.4.10, c e g falliscono, su 7.3.7 nessuna); `minWorkers` tolto da `server/testWorkers.ts` perché Vitest 4 non lo ha più. Kit `--solo V-014` con il `vite.config.ts` vero: 11 ok, 0 FALLA (l'esito dell'autore in `esiti/2026-11-01.json` è stato ripristinato). Suite intera verde (80 file, 716 verdi, 18 attesi, 1 todo, 868 s), typecheck e build verdi. In un primo giro 4 rossi per timeout (`campus credits referente`) con la macchina carica: stessi file, nello stesso momento, vecchie versioni 540 s e nuove 534 s, tutti verdi. Il gioco parte in `?skip&offline` dalla build e dal server di sviluppo. **Dopo `integra` serve `npm ci` nel base**: il worktree di T131 ha un `node_modules` suo (junction tolta), gli altri condividono quello del base. npm 10 non sa installare Vitest 4 da zero (`edgesOut`), il lock è scritto con npm 11; `npm ci` e `npm install` con npm 10 sul lock passano, provati in una cartella a parte. Il sito (`site/`) è stato solo compilato, non aperto nel browser. Sicurezza: nessuna superficie nuova; `server/` cambia solo in `testWorkers.ts`.

### T132 · Le correzioni piccole — `fatto` (dipende da T136)
- Pipeline: claude · stima 2% · approvato · priorità 15
- Step: 22
- Contesto: R15 e R16.
- Cosa fare: `Number()` su `realm.seed` in `site/sessioni.ts`; `returnUrl` del checkout limitato alla stessa origine; una CSP compatibile con three.js e con i worker; errori generici al client e dettagli nel log (`stripe.ts`); un test che cerca valori finti dei segreti in `dist/` dopo una build con un ambiente di prova.
- Browser: gioco e sito senza errori di CSP in console.
- Quando è fatto: test e typecheck verdi, commit su `task/T132`.
- Esito: `Number()` su seme, clienti, costo e tetto in `site/sessioni.ts` (un valore non numerico vale 0); `sameOriginReturn` in `stripe.ts`: un `returnUrl` di un altro sito è un 400 e, senza `returnUrl`, un `Origin` estraneo non decide il ritorno; errori di checkout e accredito generici al client, dettagli nel log senza i segreti (`logFailure`); CSP in `server/csp.ts` (ADR-0110, un'intestazione, non un `<meta>`); `tests/sicurezza/pagine.test.ts`, con una build vera in un progetto usa e getta che cerca i valori finti in `dist/`. V-015 e V-016 `chiuse`. Più del previsto: tolto l'`onsubmit` scritto in `site/sessioni.html`, che la CSP avrebbe fermato. Kit `--solo V-015,V-016`: 5 ok, 0 FALLA (`esiti/2026-11-02-dopo-T132-V-015-016.json`). Browser: **la console dello strumento non mostra le violazioni della CSP** (uno script inline bloccato non vi compare), quindi la prova è un proxy temporaneo con `report-uri`, controllato con un `eval` bloccato e segnalato: 0 violazioni su gioco (anche corona, studio, inventario), sito e `lab/` dalla preview, e su `sessioni.html` e su una partita in multigiocatore dal server di sviluppo del kit (WebSocket, `ThinClient`); F12 V-015.c ok, `SEME #0`. **Non provato**: l'accesso con Google vero sotto la CSP (l'elenco di Firebase viene dalla documentazione). In `carte.html` le foto delle carte non compaiono e nessun worker parte, uguale senza CSP (controllato togliendo l'intestazione): non dipende da qui, il perché non l'ho cercato. **T133 deve mettere la stessa intestazione.** Suite intera verde (92 file, 1145 test, 118 s), typecheck e build verdi. Sicurezza: V-020 `rilevata`: `universeStore`, `wallet`, `wanderer` e `session` mandano al client il testo delle eccezioni come faceva `stripe.ts`; non corretta qui, come chiede il processo, e senza task.

### T133 · Il server di produzione — `fatto` (dipende da T120, T123, T127, T131, T132)
- Pipeline: claude · stima 6% · approvato · priorità 16
- Step: 22
- Contesto: correzione 1 dell'audit: il server di sviluppo non va esposto. Oggi la sessione vive nel plugin di Vite (`ssrLoadModule`). Prerequisito di T45f.
- Cosa fare: un punto d'ingresso di produzione senza il server di sviluppo di Vite, che serve la build e monta solo le route ammesse; rifiuta di partire senza verificatore di identità, segreto del webhook e origini configurate; la coda delle CLI non c'è; ogni risposta porta la stessa CSP (`server/csp.ts`, l'ADR della CSP, nota di T132). ADR e `AGENTS.md`.
- Test: non parte senza configurazione; una partita di prova con `fakeLink` o WebSocket vero in locale.
- Browser: due schede sul server di produzione in locale.
- Quando è fatto: test e typecheck verdi, commit su `task/T133`.
- Esito: `server/production.ts` senza Vite, `server/serve.ts` costruito da `npm run build:server` in `dist-server/` (`npm run serve`), ADR-0112, regola 8h, V-014 chiusa. Serve solo `dist/` e le rotte di un elenco, niente `/api/gemini` né `/api/coda`; non parte senza `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `QUINE_ORIGINI`. **Oltre il previsto**: (1) rifiuta anche l'emulatore (prende token senza firma), una chiave `mock` di Stripe e la chiave di Gemini senza un tetto scritto (nota di T123); (2) `?universo=` nella build non valeva senza `?dev`, e i link del sito e il ritorno da un pagamento aprivano il seme: ora vale sempre (`src/main.ts`, anche in preview); (3) `/index.html` senza universo porta a `/site/sessioni.html`: nella prova da loopback ha creato `aurora` come partita da sola; (4) `firebase-admin` passa a `dependencies`; (5) `lab/` non è servito; (6) i plugin e il server di produzione montano gli stessi handler (`universeHandler`, `accountHandler`, `sessionList`, `attachSessions`). Test: `tests/sicurezza/produzione.test.ts` (build vera, file costruito senza e con configurazione, partita di due con WebSocket veri). Browser: lanciatore temporaneo con `createProductionServer`, la build vera e il programma dei mondi di `dist-server/`, **un servizio di identità finto** al posto di Firebase, modelli locali, schede su `localhost` e `127.0.0.1` per avere due account: entrano, si vedono, chi cammina si muove nell'altra scheda (x da 1 a 3), lobby e landing si aprono, nessuna violazione CSP dagli ascoltatori messi dopo il caricamento (la console dello strumento non le mostra, nota di T132). **Non provati**: Firebase vero, il file `server.mjs` in una partita (nel test risponde alle rotte; la partita gira con gli stessi moduli in processo), né `npm ci --omit=dev`. Sicurezza: V-014 chiusa; superficie nuova: la porta (`frontDoorRefusal`) e il servizio dei file (`buildFile`), coperti dai test; V-020 resta a T167. Per T45f: TLS e limiti di connessione al bilanciatore, un controllo di salute con un altro `Host` riceve 403.

### T134 · Le prove contro il server vero — `fatto` (dipende da T120, T121, T122, T123, T124, T125, T128, T129, T130, T132, T133, T137)
- Pipeline: claude · stima 3% · approvato · priorità 17
- Step: 22
- Contesto: chiude «Cosa non è stato fatto» dell'audit, per la parte non coperta dai test di ogni correzione: nessuna prova HTTP o WebSocket è stata fatta contro un server vero.
- Cosa fare: test di integrazione che avviano il server di produzione in locale con segreti finti e provano le regole di accesso (identità, origine, percorsi, webhook, proxy) e che i valori finti non escano mai (risposte, log, `dist/`). Aggiornare `docs/sicurezza/audit-2026-11.md` voce per voce: chiusa, provata, o aperta con il motivo.
- Quando è fatto: test e typecheck verdi, report aggiornato, commit su `task/T134`. Poi l'orchestratore porta all'autore cosa resta prima di T45f.
- Esito: `tests/sicurezza/serververo.test.ts` (31 test): il server di produzione in processi veri, build vera del client, programma costruito dei mondi, segreti finti, nessuna uscita dalla macchina (`fixtures/rete-finta.mjs`). Due server: il file di `npm run serve` con `firebase-admin` vero, e gli stessi moduli costruiti allo stesso modo con token nostri (`fixtures/server-con-account.ts`). Provati identità, origine, percorsi, webhook, checkout, assenza di Gemini e coda, una partita di due, e i valori finti cercati in risposte, socket, log, disco, storia git, `dist/`, `dist-server/`. **Nessuna falla trovata, nessuna voce riaperta.** Kit intero: 80 ok, 0 FALLA (`esiti/2026-11-02-dopo-T134.json`). `audit-2026-11.md`: «Lo stato voce per voce», con cosa resta prima di T45f: un token vero di Firebase accettato (il file costruito non ha giocato una partita), un indirizzo davvero esterno con TLS, bilanciatore e `QUINE_PROXY_FIDATI`, Stripe vero con le imposte, `npm ci --omit=dev`, uno sguardo esterno su `Crossing`; la lettura intera di `kernel.ts` e dei testi del DOM di gioco non è fatta. Diverso dal previsto: nessuna correzione al server, solo test e documenti; niente ADR. Sicurezza: nessuna superficie nuova.

### T170 · Integrare T132 — `fatto` (dipende da T169)
- Pipeline: claude · stima 2% · approvato · browser · priorità 1
- Step: 22
- Contesto: T132 (`dossier T132`) ha preso l'ADR-0110, che va a T127 (T169). Si fonde pulito con il base di oggi, ma il numero si scontra appena T169 entra, e T132 non è mai stato provato con il mondo in un processo a parte (T127 tocca `server/session.ts` e `vite.config.ts`, come T132).
- Cosa fare: nel worktree di T170, con il base aggiornato, `git merge task/T132`. L'ADR della CSP diventa **0111**: file, indice, `AGENTS.md`, `docs/sicurezza/registro.md`, commenti e test che lo citano. Nelle aggiunte nello stesso punto tieni tutte e due. Nel registro V-020 cita T167 come task (anche nella tabella in fondo e in `tools/sicurezza/catalogo.mjs`, se il test lo chiede). Controlla che `server/csp.ts` valga anche per ciò che T127 ha aggiunto e che il WebSocket del rientro dopo un riavvio del mondo non sia bloccato.
- Test: `npm run typecheck` e la suite intera con i loro turni, col limite normale; nell'esito quanti passano, i rossi rilanciando il file da solo, il tempo. Il kit `npm run sicurezza:prove -- --solo V-007,V-015,V-016`, esito in un file a parte.
- Browser: col turno `browser`, su `npm run dev`, una partita multigiocatore usa e getta con `?offline`: nessuna violazione della CSP misurata come ha fatto T132 (`report-uri`, la console dello strumento non le mostra), anche durante il rientro dopo aver ucciso il processo del mondo.
- Quando è fatto: commit su `task/T170`. L'orchestratore integra T170 e T132. L'esito dice «sicurezza: nessuna superficie nuova» o le voci aggiunte.
- Esito: `task/T170`, fuso `task/T132`; conflitti solo in `AGENTS.md`, nell'indice degli ADR e nella tabella del registro, tenute le due parti. L'ADR della CSP è **0111** (file, indice con lo stato che mancava, `AGENTS.md`, registro, commenti); l'esito di T132 nel suo blocco dice ancora ADR-0110: resta com'è, fuori dal blocco di T170. V-020 cita T167 (voce, tabella, `catalogo.mjs`, che `sicurezza-kit.test.ts` chiede uguali). `server/csp.ts` vale anche per T127: il processo del mondo non serve pagine e parla col server fuori dal browser, e `securityHeaders` è prima di ogni rotta, quindi anche il 404 di `hideUniverses` la porta; un test nuovo in `pagine.test.ts` tiene l'ordine. Il rientro non apre un WebSocket nuovo: il client resta collegato al server di sviluppo (`mondo`, poi `reenter`), e una pagina caricata a mondo fermo apre il suo sulla stessa origine, che `connect-src 'self'` ammette. Test: typecheck verde; suite intera verde al primo giro, nessun rosso (97 file, 1163 test, 162 s; nel log un `heap out of memory` è V-007 di `mondo.test.ts`, che lo provoca apposta). Kit `--solo V-007,V-015,V-016`: 8 ok, 0 FALLA (`esiti/2026-11-02-dopo-T170-V-007-015-016.json`). Browser, con `npm run dev` e un proxy temporaneo con `report-uri` fuori dal repository, su un universo usa e getta con `?offline`, giocatore e master insieme: 0 violazioni della partita, anche uccidendo due volte il processo del mondo (entrambe le schede mostrano «si è fermato» e «ripartito», il passo arriva dopo il rientro; la seconda volta la scheda del giocatore è stata ricaricata a mondo fermo ed è rientrata) e con il master nello Studio dei personaggi; il controllo ha funzionato (4 `eval` miei, bloccati e segnalati: gli unici 4 report; nessuna risposta senza intestazione). **Lo strumento del browser deroga alla CSP per il codice sincrono che esegue**: `eval` e `new Function` lì passano, dopo un `await` sono bloccati; chi la prova così lo tenga presente. Fatto con `npm run dev` come chiesto, non col server del kit. Non provati qui: l'accesso con Google vero, come in T132, e `site/`, già provato da T132 e non toccato da T127. Sicurezza: nessuna superficie nuova.

### T167 · Secondo audit: trovare da soli le vulnerabilità e correggerle — `fatto` (dipende da T127, T132, T166)
- Pipeline: claude · stima 8% · approvato · browser · priorità 18
- Step: 22
- Contesto: richiesta dell'autore (chat, 02/11): «per la sicurezza, cerca di trovare da solo vulnerabilità e correggerle». Il primo audit (T117, `dossier T117`) ha fatto poche prove, e le correzioni hanno aggiunto codice mai riletto da chi attacca: `server/access.ts`, `server/ledger.ts`, `server/git.ts`, `src/kernel/paths.ts`, `Crossing` in `sandbox.ts`, i limiti ai messaggi, gli elenchi di `src/session/files.ts`, il worker dei mondi. Il processo è `docs/sicurezza/README.md`: ciò che conta (le tre proprietà) e ciò che non è una vulnerabilità valgono qui; il modello di minaccia è quello di T117: il giocatore può dettare al Concilio qualunque contenuto o codice, la difesa sta a valle.
- Cosa fare, cercando prima dove un guasto costa di più (sandbox, crediti, scritture dei non master, spesa, macchina che ospita):
  1. **Cercare con prove**: rileggere da avversario il codice elencato sopra e ogni route e messaggio che ascolta un client (confronti tra ciò che il validatore controlla e ciò che succede a runtime, corse tra le richieste, bordi di `Crossing`, percorsi, XSS nel gioco e in `site/` da testi di altri giocatori, le route del sito, il ramo del master, il clone). Ogni sospetto si prova con un test o con il kit, non basta leggerlo. `npm audit` compreso. Il server di produzione rientra se è già nel base quando il task parte; altrimenti l'esito dice che manca.
  2. **Le prove da un altro sito** che aspettavano l'autore (V-001.n, V-001.o, V-006.g, `docs/sicurezza/prove-f12.md`): falle da solo col turno `browser`, contro il server del kit (`--resta`), da una pagina su un'altra porta di loopback, che è già un'altra origine; nessun sito esterno. Esito in `docs/sicurezza/esiti/` e nel campo **Prova**.
  3. **Registro**: una voce per ogni falla trovata, col primo numero libero; nel report e nel registro nessun payload pronto all'uso. Report in `docs/sicurezza/audit-2026-11-2.md`: cosa è stato guardato, cosa provato, cosa no.
  4. **Correggere** qui, ciascuna con il suo test di regressione e la voce chiusa come dice il README, ciò che sta in poche righe e non cambia un'architettura. Ciò che è più grande: voce `specificata` e un task proposto nell'esito, con gravità e stima; lo crea l'orchestratore. Ciò che sta in un task aperto (`T133`, `T134`, `T127`) si scrive lì come nota nell'esito, senza farlo due volte. Qui dentro anche **V-020** (rilevata da T132: il testo delle eccezioni arriva al client da altre route), da provare e correggere sul modello di `logFailure`.
- Limiti: solo loopback e cartelle temporanee, segreti finti, mai il `.env` vero né `universes/`, nessuna richiesta verso l'esterno. Se un filtro di sicurezza ferma una prova vale il README: non insistere, non riformulare; va nel kit e nell'esito. Una voce `chiusa` che si scopre aperta torna `in correzione` e l'esito lo dice in testa, perché è una decisione da portare all'autore; una falla critica sfruttabile oggi sul server locale si scrive subito in `docs/pipeline/domande/T167.md`.
- Test: `npm run typecheck` e la suite intera con i loro turni; il kit intero, esito in un file a parte in `docs/sicurezza/esiti/`.
- Browser: le prove del punto 2; gioco e sito senza errori in console se le correzioni li toccano.
- Quando è fatto: commit su `task/T167`. L'esito dice le voci trovate per gravità, quali chiuse, quali restano con il task proposto.
- Esito: `task/T167`, ADR-0112, report `docs/sicurezza/audit-2026-11-2.md`. **Nessuna voce chiusa riaperta**, nessuna critica sfruttabile oggi. Trovate: critica V-022 (il master pagava le risposte delle persone agli altri, anche agli anonimi; oggi media); alte V-021 (un messaggio malformato fermava il mondo o ne uccideva il processo), V-023 (spese comuni senza paganti sulla chiave), V-025 (un socket avviava un processo per ogni nome), V-026; medie V-024 (modello fuori listino gratis), V-027 (da Lua, liste e tabelle enormi da scrivere); basse V-028, V-029 (CORS di Vite verso le altre porte locali), più V-020 di T132. Tutte chiuse tranne **V-026, `specificata`: task proposto** «Le risorse per account» (mondo solo dopo un token verificato, mondo vuoto che si ferma, quota di universi, ritmi HTTP e socket; alta, stima 4%, da fare con o dopo T133). Per T133: riusare `worldRefusal`, `cors: false`. **Decisione da guardare per l'autore**: V-023 vale solo con gli account, e un mondo pubblico senza paganti produce contenuti dei modelli locali che restano nella sua storia. Oltre il previsto: `npm audit` 0 avvisi; V-001.n era scritta male (contava un rifiuto come lettura): blocco corretto, misura in V-001.p. Un filtro dello strumento ha fermato una lettura del browser da un'altra origine: non riformulata, è nel kit; la V-001.n corretta non è stata rifatta in un browser. Il server di produzione non è nel base (T133): non provato. Test: typecheck verde, suite 1200 passati su 99 file; kit intero 79 ok, 0 FALLA, 0 ERRORE (`esiti/2026-11-02-dopo-T167.json`). Sicurezza: voci V-020…V-029.

### T171 · Integrare T167 — `fatto`
- Pipeline: claude · stima 3% · approvato · browser · priorità 1
- Step: 22
- Contesto: T167 (`dossier T167`) è partito prima che T133 (`dossier T133`) entrasse: ha preso l'ADR-0112, che è di T133, e non ha mai visto il server di produzione. `integra T167` va in conflitto in `AGENTS.md` e `server/session.ts`.
- Cosa fare: nel worktree di T171, con il base aggiornato, `git merge task/T167`. L'ADR dell'audit diventa **0113**: file, indice, `AGENTS.md`, `docs/sicurezza/registro.md`, report, commenti e test che lo citano. Nelle aggiunte nello stesso punto tieni tutte e due. In `server/session.ts` le correzioni di T167 (`worldRefusal`, V-021, V-025, V-028) devono valere anche per `attachSessions` di T133. Il server di produzione deve avere ciò che T167 ha messo nel server di sviluppo: controlla V-020, V-021, V-025, V-028 e il checkout attraverso `gate`; `cors: false` di V-029 riguarda Vite, ma scrivi cosa fa la produzione con un'altra origine. Se manca qualcosa, mettilo qui con un test. In V-026 il campo Task dice **T172**, anche nella tabella e in `tools/sicurezza/catalogo.mjs` se il test lo chiede.
- Test: `npm run typecheck` e la suite intera con i loro turni, col limite normale; nell'esito quanti passano, i rossi rilanciando il file da solo, il tempo. Il kit intero, esito in un file a parte.
- Browser: col turno `browser`, sul server di produzione in locale come ha fatto T133 (identità finte, modelli locali): due schede, chi non è il master entra e cammina; un messaggio malformato sul socket non ferma il mondo.
- Quando è fatto: commit su `task/T171`. L'orchestratore integra T171 e T167. L'esito dice «sicurezza: nessuna superficie nuova» o le voci aggiunte.
- Esito: `task/T171`, fuso `task/T167`; conflitti in `AGENTS.md` e `server/session.ts`. L'ADR dell'audit è **0113** (file, indice, registro, report, test; la regola è **8i**, la 8h resta del server di produzione). `attachSessions` usa `worldRefusal` e `failureText`. **Mancava in produzione, messo qui**: `QUINE_MONDI_MASSIMI`, che T167 leggeva solo in `vite.config.ts` (`maxWorlds` in `SessionOptions`, letto in `server/production.ts`). V-020, V-021, V-028 e il checkout attraverso `gate` valgono già: stanno negli handler, nel `WorldHost` e nel processo del mondo, comuni ai due server. Test nuovi in `tests/sicurezza/produzione.test.ts`, sul server vero: V-020, V-021, V-025 (nome inesistente, singola, tetto), V-028, V-029. **Un'altra origine in produzione**: nessuna risposta scrive `Access-Control-*`; un'`Origin` fuori da `QUINE_ORIGINI`, preflight compreso, è un 403 prima di ogni rotta e così l'apertura di un socket; senza `Origin` un file della build arriva, ma un'altra pagina non può leggerlo (ADR-0113, punto 9). V-026: Task T172 (voce e report; la riga del catalogo non cita un task e il test non lo chiede). **Oltre il previsto**: `V-007 un mondo bloccato…` in `mondo.test.ts` era rosso a intermittenza, sul merge anche da solo (2 su 3 giri del file) e sul base `0d2977e` senza T167 (1 su 4), quindi non viene dalla fusione: con `notice` a 300 ms bastava una pausa di un mondo sano. La causa della pausa è dedotta, non misurata. I mondi veri di quel file ora hanno `notice` 2 s e `kill` 8 s: 4 giri su 4 verdi. Test: typecheck verde; suite intera verde dopo la correzione (100 file, 1227 test, 167 s); il primo giro, prima della correzione, aveva quel solo rosso. Kit intero: 79 ok, 0 FALLA, 0 ERRORE (`esiti/2026-11-02-dopo-T171.json`). Browser: lanciatore temporaneo fuori dal repository con `createProductionServer`, la build vera e il programma dei mondi di `dist-server/`, un servizio di identità finto, modelli locali, schede su `localhost` (master) e `127.0.0.1` (`u2`, non master): entra e cammina, il master lo vede passare da x 1 a x 2,2; un terzo socket ha mandato messaggi malformati prima e dopo `entra`: resta aperto, continua a ricevere `aggiorna`, nessun avviso «si è fermato», e il cammino continua dopo. In console solo errori del canale dell'estensione del browser. **Non provati**: Firebase vero, il file `server.mjs` in una partita, le violazioni CSP (non misurate qui). Sicurezza: nessuna superficie nuova; V-026 resta aperta a T172.

### T172 · Le risorse per account — `fatto` (dipende da T171)
- Pipeline: claude · stima 4% · approvato · priorità 16
- Step: 22
- Contesto: V-026 (`docs/sicurezza/registro.md`, gravità alta, oggi bassa), trovata dal secondo audit (`dossier T167`). Va chiusa prima di esporre il server (T45f).
- Cosa fare: la contromisura della voce. (1) Il mondo parte solo con un `entra` dal token verificato. (2) Un mondo vuoto si salva e si ferma dopo qualche minuto. (3) Una quota di universi per account, nel `.env`, e nessun `create` da un anonimo. (4) `POST /api/viandante` solo per chi il mondo conosce o con un ritmo per account. (5) Un ritmo per indirizzo su socket e route HTTP, nel server di produzione (`server/production.ts`); dietro un bilanciatore l'indirizzo vero va letto senza fidarsi di un'intestazione mandata dal client: scrivi la scelta nell'ADR. Il rientro di chi resta collegato mentre il mondo si ferma deve continuare a funzionare (`mondo`, `reenter`).
- Test: proprietà in `tests/sicurezza/`, prove nel kit (`tools/sicurezza/catalogo.mjs`); typecheck e suite intera con i loro turni. Una misura di carico minima, scritta nell'esito con ciò che resta non misurato.
- Quando è fatto: commit su `task/T172`, V-026 chiusa con la prova. L'ADR prende il primo numero libero, **dallo 0114**. L'esito dice le voci.
- Esito: `task/T172`, ADR-0114, regola 8j. **V-026 chiusa**, nessuna voce nuova. (1) `admit` in `server/session.ts`: il mondo parte dopo un `entra` con il token verificato, un socket muto si chiude dopo 15 s o 16 messaggi. (2) Un mondo vuoto per 5 minuti si salva e si ferma; chi arriva intanto aspetta e trova un processo nuovo; il rientro (`mondo`, `reenter`) è provato su un mondo finto che riparte. (3) `QUINE_UNIVERSI_PER_ACCOUNT` (3), niente `create` da un anonimo. (4) `POST /api/viandante`: un ritmo per account, un anonimo solo dove il mondo lo conosce. (5) `FRONT_RATES` in `server/production.ts`, indirizzo dal socket o con `QUINE_PROXY_FIDATI` (quanti proxy nostri, da misurare al deploy in T45f; un valore che non è un numero non fa partire il server). Oltre il previsto: al più 4 socket per account e un ritmo su chi avvia un mondo; un clone conta per chi lo riceve; un ritmo su ciò che si fa e si butta, perché `.cestino/` resta sul disco; nessun profilo in una partita in singola con gli account; l'autore (`QUINE_MASTER`) senza quota. Scelta da guardare: un anonimo può ancora avviare un mondo fermo (ADR-0114, alternative). Test: `tests/sicurezza/risorse.test.ts`, kit V-026.a (`esiti/2026-11-02-dopo-T172.json`: 14 ok su V-006, V-007, V-011, V-021, V-025, V-026, V-028; non il kit intero); typecheck verde, suite 1261 passati su 101 file, 167 s. Un primo giro della suite ha avuto un rosso, «ingresso di bruno» scaduto dopo 30 s in `produzione.test.ts`: non si è ripetuto né col file da solo né nel secondo giro intero; causa non accertata, forse il carico della macchina. Da tenere d'occhio. Misura di carico in `esiti/2026-11-02-T172-carico.md`: una lettura intera di un universo costa ~75 ms, quindi una quindicina di indirizzi al loro ritmo saturano il processo; non misurati molti indirizzi, la memoria per socket, i processi veri dei mondi sotto carico, le connessioni lente; spettano al bilanciatore (T45f). Nessuna verifica nel browser (il task non la chiede): il gioco non cambia, l'ingresso è provato su WebSocket veri. Sicurezza: superficie toccata `server/session.ts`, `server/production.ts`, `server/universeStore.ts`, `server/wanderer.ts`, nessuna voce aggiunta.

### T168 · I resti della verifica di T166: raccogliere da non master, carte, porta nelle sessioni — `fatto`
- Pipeline: claude · stima 2% · approvato · browser · priorità 28
- Step: 17
- Contesto: note dell'esito di T166 (`dossier T166`), con T130 ormai nel base. La verifica non ha visto un «Raccogli» riuscito da un viandante non master, e una volta `ospite` è rimasto chiuso nel bosco con tutte le caselle attorno bloccate, durante un cammino fatto da script: non si sa se dipende dallo script.
- Cosa fare: (1) col turno `browser`, in un universo multigiocatore usa e getta, un non master raccoglie una cosa da vicino, con il loop normale: se non riesce, trova la causa e correggi. (2) Prova a riprodurre il viandante chiuso nel bosco, con i tasti veri e il loop normale; se non si ripete, scrivilo e non correggere nulla. (3) `describeCard` (`site/carte.ts`) cerca ancora `lore` e `aspetto`, che `publicFiles` non dà più: togli i rami morti, una carta senza `description` resta con la riga generica; non rimettere campi negli elenchi di `src/session/files.ts`. (4) `site/sessioni.ts:330` scrive «PORTA 5173» fisso: la porta vera o niente. (5) Nota di T132 (`dossier T132`): in `site/carte.html` le foto delle carte non compaiono e nessun worker parte, anche togliendo la CSP: trova la causa e correggi.
- Test: uno per `describeCard`, con una carta come la dà `publicFiles`; `npm run typecheck` e la suite con i loro turni.
- Quando è fatto: commit su `task/T168`. L'esito dice se il raccolto riesce e se il blocco si ripete, e «sicurezza: nessuna superficie nuova» o le voci aggiunte.
- Esito: `task/T168`. (1) **Il raccolto riesce**: server di sviluppo col turno `browser`, universo usa e getta offline, poi cancellato; `ospite`, non master, arrivato con i tasti e il loop normale, `E` sulle bacche: «Raccolto: Bacche di rovo», in inventario, sparite da terra. Da lontano il server rifiuta («è troppo lontano») e la cosa torna: la sparizione vista da T166 era il momento prima della risposta. Nessuna correzione. (2) **Il blocco non si è ripetuto**, e non ho corretto nulla: ~3 minuti tra gli alberi, oltre il bordo del chunk, nessuna correzione dal server. Dove il cammino si ferma c'è un ostacolo e c'è sempre una via (in un vicolo cieco a -10.8, 0.75 si esce a est). Due falsi allarmi utili a chi riprova: nello specchio Spazio fa come `E` e apre il menu «bosco», che ferma il movimento in tutte le direzioni finché non si chiude; una sonda `free` a 0,3 caselle può dire tutto bloccato attorno a un punto da cui ci si muove con passi più corti, cosa che può spiegare il «tutte bloccate» di T166, ma non so dirlo con certezza. **Limiti**: la scheda andava a ~1,3 fotogrammi al secondo; il tasto vero premuto e rilasciato di colpo non ha mosso il viandante (cade tra due fotogrammi), quindi i cammini sono `keydown`/`keyup` mandati da script agli stessi ascoltatori, con il loop normale; solo `E` ed Esc sono tasti veri. A questo ritmo non si può superare il server: un chunk ripianificato sotto i piedi di chi corre non è escluso né provato. (3) `describeCard` legge solo `description` e `mestiere`: tolti `lore` e `aspetto` e anche `descrizione`, `mistero`, `storia`, altrettanto morti con `publicFiles`; `files.ts` non è toccato. Una carta senza `description` dice la riga generica. (4) `site/sessioni.ts`: la porta della pagina, o niente senza porta; visto «PORTA 4868». (5) **Foto delle carte: nessun difetto, nessuna correzione al codice.** Worker e foto funzionano, in sviluppo e nella build con la CSP: 11 carte con un corpo su 11 (modelli, oggetti, moduli), caricate scorrendo. Un universo dal seme giocato offline ha però solo carte `luogo` (16 di `io`, 4 di `ospite`, a parte le carte che avevo messo io nel seme), che non hanno un corpo (`artOf`): 0 foto, 16 gemme, 0 worker, cioè il sintomo di T132. Non ho rivisto l'universo di T132: è la causa che spiega il sintomo, riprodotto, non una prova su quello. Dare un'immagine ai luoghi chiederebbe `maps/` in `publicFiles`, cosa che il task vieta per gli elenchi: resta una scelta per l'autore. Test: due in `tests/site-carte.test.ts`, con le carte come le dà `publicFiles`. Typecheck e build verdi, suite intera 99 file, 1195 test, 159 s, 0 rossi. Sicurezza: nessuna superficie nuova.

### T169 · Integrare T127 — `fatto`
- Pipeline: claude · stima 3% · approvato · browser · priorità 1
- Step: 22
- Contesto: T127 (`dossier T127`) ha preso l'ADR-0107, che è dei limiti ai messaggi, ed è partito da un base senza T129, T130 e la cache delle forme: quello che fa non è mai stato provato con loro. `git merge-tree` dà conflitti in `AGENTS.md` e `docs/adr/README.md`; `server/session.ts` e `vite.config.ts` si fondono da soli, ma vanno riletti.
- Cosa fare: nel worktree di T169, con il base aggiornato, `git merge task/T127`. L'ADR di T127 diventa **0110**: file, indice, `AGENTS.md`, `docs/sicurezza/registro.md`, commenti e test che lo citano; 0107, 0108, 0109 restano dove sono. Nelle aggiunte nello stesso punto tieni tutte e due. Controlla dove le parti si toccano, e correggi qui ciò che non torna: i limiti ai messaggi (`LIMITS`, `heavy`) e gli elenchi di `src/session/files.ts` valgono anche con il mondo in un processo a parte, e i messaggi che il processo manda (l'avviso, il rientro) passano dagli elenchi; `server/hidden.ts` copre anche la cartella `node_modules/.quine-mondo/`, se è servibile; `buildWorld` contiene ciò che serve a `sharedForms` e a `engineVersion`; a ogni riavvio del mondo la cache delle forme riparte da vuota: misura quanto ci mette il primo avvio e confrontalo con i 5 s dell'avviso e i 45 s del sorvegliante, perché un avvio lento non deve far uccidere il mondo.
- Test: `npm run typecheck` e la suite intera con i loro turni, col limite normale; nell'esito quanti passano, i rossi rilanciando il file da solo, il tempo. Il kit `npm run sicurezza:prove -- --solo V-001,V-002,V-005,V-007,V-011,V-012,V-013`, con la build, esito in un file a parte.
- Browser: col turno `browser`, su `npm run dev`, un universo multigiocatore usa e getta e `?offline`: due viandanti, di cui uno non master, si vedono e camminano; ucciso a mano il processo del mondo, avviso e rientro automatico su tutte e due le schede.
- Quando è fatto: commit su `task/T169`. L'orchestratore integra T169 e T127. L'esito dice i tempi del primo avvio, e «sicurezza: nessuna superficie nuova» o le voci aggiunte.
- Esito: `task/T169`, fuso `task/T127`; conflitti solo in `AGENTS.md` e nell'indice degli ADR, tenute le due parti. L'ADR di T127 è **0110** (file, indice, `AGENTS.md`, registro, commenti, test e, fuori dal blocco di T169, la prima riga dell'esito di T127 che citava il numero); la sua regola in `AGENTS.md` è la **8g**. **Tempi del primo avvio**, sul seme: build del programma 2,5 s, apertura 11,1 s (anche dopo un'uccisione: la cache delle forme riparte da vuota), contro i 180 s dell'apertura, che è fuori dai 5 s dell'avviso e dai 45 s del sorvegliante; poi, camminando con un client per 25-40 s, silenzio massimo 1,03 s, nessun avviso né uccisione; dall'uccisione a di nuovo dentro circa 11 s. **Non tornava, corretto qui**: (1) i programmi giravano di seguito nello stesso turno del ciclo: una raffica oltre i 45 s, anche di soli programmi validi (8 s l'uno), avrebbe fatto uccidere il mondo, e al riavvio di nuovo, senza battiti in mezzo: ora `TurnRunner` (`host.ts`) ne fa uno per turno, e l'apertura aspetta quelli del boot (`idle`), perché sul seme uno dura 5 s e dopo `pronto` sfiorava l'avviso; (2) `/node_modules/.quine-mondo/…` non è più servito: nascosto in `server/hidden.ts` e in `server.fs.deny`, 404 sul server vero anche con `?raw`, `/@fs/` e il percorso reale della junction; la risposta prima della correzione non l'ho provata, l'ho dedotta dal fatto che Vite serve ciò che sta sotto la radice; (3) un mondo fermo non applica `LIMITS` e ciò che gli si mandava si accumulava nel server: tetto `MAX_BACKLOG` (8 MiB) a ciò che è in viaggio, oltre si perde e chi aspetta ha un `esito` negativo. **Tornava già**: `LIMITS`, `heavy` e `playerFiles` stanno in `SessionServer`, quindi nel processo: test nuovo col processo vero (i pesanti rifiutati con una risposta, chi inonda chiuso, l'altro continua, niente `ai`, prompt, bibbia né persone anche dopo un riavvio); `mondo` dice solo `stato` e `testo`, fissi nel server; il programma ha `sharedForms`, non il disco dei test né `engineVersion`. **Resta**, scritto nell'ADR: il validatore non passa da `TurnRunner` (6 modelli da 8 s nello stesso commit, per esempio una pubblicazione, tacerebbero oltre i 45 s: non provato; oggi lo Scultore ne scrive uno alla volta). Le misure sono su una macchina con altri agenti al lavoro, sul seme, non su un universo grande. Typecheck verde. Suite intera col limite normale, 157 s: **92 file, 1149 passati, 0 rossi** (al primo giro 2 rossi in `registro.test.ts`, per i test nuovi senza la loro voce: corretti). Kit `--solo V-001,V-002,V-005,V-007,V-011,V-012,V-013`, con la build: 28 ok, 0 FALLA, 0 errori (`esiti/2026-11-02-dopo-T169.json`; V-013 non ha prove nel kit, la tiene `uscite.test.ts`). **Browser**, `npm run dev` sulla 4869 col turno `browser`, universo usa e getta `prova-t169` offline, poi cancellato; `io` master e `ospite` no: si vedono e camminano (la posizione di `io` cambia nella scheda di `ospite`). Ucciso a mano il processo del mondo con `taskkill`: su tutte e due le schede «Il mondo si è fermato: sta ripartendo.» e «Il mondo è ripartito dall’ultimo stato salvato.», rientro da solo, poi `io` cammina e `ospite` lo vede, `ospite` cammina anche lui; nel suo `ingresso` nuovo niente `ai` né prompt. Il cammino l'ho fatto con eventi di tastiera mandati alla pagina, non con tasti veri. Negli errori della console solo messaggi del canale di un'estensione del browser. Sicurezza: nessuna superficie nuova rispetto a T127; il canale ha ora un tetto verso il mondo, non dal mondo (già scritto nell'ADR).

### T135 · Integrare T119 dopo i task di sicurezza — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 2
- Step: 21
- Contesto: `integra T119` va in conflitto solo in `docs/plans/backlog.md`: la sezione «La sicurezza» (T120-T134) è entrata in fondo al file, accanto al blocco di T119. Nasce da T119: `dossier T119`.
- Cosa fare: nel worktree di T135 `git merge task/T119`; nel backlog restano tutti i blocchi, con ciò che T119 ha scritto nel proprio e la sezione «La sicurezza» intera. Niente altro.
- Test: `npm run typecheck`. Niente suite intera né browser: T119 li ha già fatti e il conflitto è solo in un documento. Se il merge cambia altro, fermarsi e scriverlo nell'esito.
- Quando è fatto: merge risolto, commit su `task/T135`. Poi l'orchestratore fa `integra T135`, `integra T119`, `integra T116`, `integra T102`.
- Esito: `task/T135`, fuso `task/T119`. Unico conflitto in `docs/plans/backlog.md`: l'esito di T119 resta nel suo blocco, subito sopra la sezione «La sicurezza», rimasta intera (T120-T135). Gli altri file sono entrati dal merge senza conflitti. Typecheck verde; suite intera e browser non ripetuti, come dice il task.

### T136 · Il processo delle vulnerabilità: registro, specifiche, suite — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 1
- Step: 22
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
- Step: 22
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
- Step: 22
- Contesto: `integra T123` va in conflitto in `docs/sicurezza/registro.md`: T123 chiude V-002, T137 ha aggiunto a ogni voce la copertura e la misura del kit. Parte da un base che ha già T139 e T105, che con T123 toccano `vite.config.ts`: si risolve tutto insieme. Nasce da T123: `dossier T123`.
- Cosa fare: nel worktree di T140, partito dal base con T139 e T105 dentro, `git merge task/T123`; nel registro V-002 resta `chiusa` e tiene anche ciò che T137 ha scritto, con la misura del 01/11 detta come precedente a T123. Se le prove V-002 di `tools/sicurezza/catalogo.mjs` o i test di T137 si aspettano ancora la falla, vanno allineati a T123.
- Test: `npm run typecheck`, `npm run sicurezza:prove -- --solo V-002` (nell'esito le righe `ok` e `FALLA`: una FALLA vuol dire che V-002 non è chiusa e va detto, non coperto) e la suite intera con il suo turno.
- Quando è fatto: merge risolto, commit su `task/T140`. Poi l'orchestratore fa `integra T140` e `integra T123`.
- Esito: merge di `task/T123` su `task/T140`. Conflitti in `vite.config.ts` (restano `walletRoute` e `sessionServer(accounts, gemini.direct())`) e nel registro (V-002 `chiusa`, la misura del 01/11 detta come precedente a T123). ADR-0099 senza scontri. Di diverso dal previsto, tre cose. 1) **V-002.d com'era scritta dava FALLA** (`--solo V-002`: a, b, c ok; d 20 su 20 arrivate a Google): 20 chiamate piccole costano circa 0,25 $, sotto il tetto di 10 $. L'ADR-0099 decide un tetto in dollari, quindi la prova ora fa 20 chiamate da circa 1 $: 9 arrivano, poi 402; con la prova allineata 4 ok, 0 FALLA (`esiti/2026-11-01-dopo-T123.json`). Resta scritto nel registro che un processo di questa macchina, senza identità, spende fino al tetto del giorno. 2) Con la stessa data `--solo` sovrascrive l'esito del giorno: la misura intera del 01/11 è stata ripristinata uguale; il kit non è stato corretto. 3) `tests/sicurezza/rotte.test.ts`: i due `it.fails` di V-002 ora sono test normali con `GeminiGate` e un controllo che il modello ammesso arrivi. Typecheck verde. Suite intera nel turno, prima del commit, con il codice di questo commit: **2 rossi su 761** (758 passati, 1 todo), timeout da 60 s in `tests/between.test.ts`. Rilanciando il file da solo restano 2 rossi, su test diversi (5 su 7); con `--testTimeout=300000` passano 7 su 7, circa 55 s a test (uno 103 s), macchina al 44 % di CPU e altri processi node. Nessuna asserzione rotta e il merge non tocca ciò che il file carica, se non una riga in `gemini.ts`; T139 li aveva verdi nella sua suite, il confronto col base alle stesse condizioni non è stato fatto. Timeout non toccati. Il kit intero non è stato rilanciato, solo V-002. Sicurezza: V-002 chiusa da T123, nessuna superficie nuova dal merge.

### T138 · Integrare T118 — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 19
- Contesto: `integra T118` va in conflitto in `vite.config.ts`: T118 ha toccato la configurazione dei test (worker e `hookTimeout`), mentre nel base sono entrati altri cambi allo stesso file. Serve presto: senza T118 la suite resta a 11 worker e con i timeout, anche per i task di sicurezza. Nasce da T118: `dossier T118`.
- Cosa fare: nel worktree di T138 `git merge task/T118`; in `vite.config.ts` restano le aggiunte di entrambi. Nel backlog restano tutti i blocchi. Se gli ADR si scontrano, quello di T118 prende il primo numero libero.
- Test: `npm run typecheck` e la suite intera con il suo turno: deve restare senza timeout (T118 ne ha misurati 680 su 680; il base ha test in più).
- Quando è fatto: merge risolto, commit su `task/T138`. Poi l'orchestratore fa `integra T138` e `integra T118`.
- Esito: merge di `task/T118` nel commit 1f0e912. L'unico conflitto era negli import di `vite.config.ts`: restano `wandererRoute` e `testWorkers`. Gli ADR non si scontrano (T118 aggiorna ADR-0088). Typecheck verde; suite intera nel suo turno: 688/688, 797 s, nessun timeout. Niente di diverso dal previsto.

### T142 · Integrare T131 — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 22
- Contesto: `integra T131` va in conflitto in `AGENTS.md`. T131 porta Vite 7.3.7 e Vitest 4.1.12 (`npm audit` a 0, ADR-0099). Nasce da T131: `dossier T131`.
- Cosa fare: nel worktree di T142 `git merge task/T131`; in `AGENTS.md` restano le aggiunte di entrambi. Se gli ADR si scontrano, quello di T131 prende il primo numero libero. `node_modules` è una junction verso quello del base, che ha ancora le versioni vecchie e che altri task stanno usando: **non installare attraverso la junction**. Toglila (solo la junction, non il contenuto) e fai un `npm ci` tuo nel worktree, come ha fatto T131.
- Test: `npm run typecheck`, `npm run build` e la suite intera con i loro turni. Nell'esito scrivi quanti test passano e i rossi che restano rilanciando il file da solo.
- Browser: T131 ha provato solo il gioco. Apri dalla build con Vite 7 le pagine di `site/` (landing, carte, sessioni, profilo, pagamenti): si aprono senza errori in console e con il loro stile? Il login Firebase non serve.
- Quando è fatto: merge risolto, commit su `task/T142`. Non toccare il `node_modules` del base: l'`npm ci` lì lo fa l'orchestratore, a pipeline senza task, quando integra.
- Esito: merge di `task/T131` risolto (in `AGENTS.md` «Vite 7» di T131 e la riga del sito del base, con i crediti di T105); ADR-0099 era libero, nessuna rinumerazione. Junction tolta e `npm ci` nel worktree (Vite 7.3.7, Vitest 4.1.12, `npm audit` a 0); `node_modules` del base non toccato (ancora Vite 5.4.10). Typecheck e build verdi. Suite intera: 728 passati, 18 attesi falliti, 1 todo, 1 rosso (`between.test.ts`, timeout di 60 s su «words to who is near»); rilanciato da solo passa 7 su 7, ma il file richiede 330 s da solo, vicino al limite. Browser: dalla build con Vite 7 landing, carte, sessioni, profilo e pagamenti si aprono con il loro stile, senza errori della pagina in console e con le risorse tutte a 200; senza universi su disco, carte e sessioni mostrano lo stato vuoto e profilo e pagamenti il modulo di accesso, quindi le pagine con dati veri non sono state provate. Sicurezza: nessuna superficie nuova oltre a quanto T131 ha registrato.

### T139 · Integrare T105 — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 21
- Contesto: `integra T105` va in conflitto in `vite.config.ts`: T105 aggiunge `walletRoute` e la pagina `sitePagamenti`, mentre nel base è entrato T118 con `testWorkers`. T105 è verificato nel browser. Viene prima di T124, che tocca `server/stripe.ts` come T105. Nasce da T105: `dossier T105`.
- Cosa fare: nel worktree di T139 `git merge task/T105`; in `vite.config.ts` restano le aggiunte di entrambi. Nel backlog restano tutti i blocchi. Se gli ADR si scontrano, quello di T105 prende il primo numero libero.
- Test: `npm run typecheck` e la suite intera con il suo turno. È la prima suite con T118, T136 e T105 insieme: nell'esito scrivi quanti test passano e, se ce ne sono di rossi, quali. Un rosso che resta rilanciando il file da solo va detto e non va coperto: T136 ne aveva 45-47 e T105 14 (`watch`, `referente`, `wanderers`, `thin`, `between`), tutti senza T118.
- Quando è fatto: merge risolto, commit su `task/T139`. Poi l'orchestratore fa `integra T139` e `integra T105`.
- Esito: `task/T139`, merge di `task/T105`. L'unico conflitto era negli import di `vite.config.ts`: restano `testWorkers` (T118) e `walletRoute` (T105); `sitePagamenti` e `testWorkers(process.env)` si erano fusi da soli. Nessun ADR nuovo in T105, quindi nessuna rinumerazione; 170 blocchi nel backlog prima e dopo. Typecheck verde. Suite intera nel turno, una volta: 80 file, 745 passati, 1 todo, 0 rossi; i 14 di T105 non si ripresentano. Nei 745 ci sono i 18 `it.fails` di `tests/sicurezza/`, le falle ancora aperte. Sicurezza: il merge porta `/api/crediti` (T105), che senza account dà saldo e righe del viandante chiesto, come V-006.e per `/api/viandante`; il registro non la nomina (V-006, superficie), T120 punto 4 la copre.

### T145 · Integrare T142 (con T131) — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 22
- Contesto: `integra T142` va in conflitto in `docs/adr/README.md`: il 0099 nel base è di T123 (il proxy di Gemini), T131 aveva preso lo stesso numero per Vite 7. T142 porta T131 (Vite 7.3.7, Vitest 4.1.12) ed è verificato nel browser, ma la sua suite è partita senza T140 e T123. Nasce da T142: `dossier T142`.
- Cosa fare: nel worktree di T145 `git merge task/T142`. L'ADR `0099-vite-7-vitest-4-e-il-primo-npm-audit.md` diventa `0100-…`; correggi le citazioni che parlano di Vite 7 («ADR-0099» di T131 in `AGENTS.md`, `docs/`, codice, indice degli ADR), lasciando stare quelle del proxy. Nel backlog restano tutti i blocchi. `node_modules` è una junction verso il base, che ha ancora le versioni vecchie: **non installare attraverso la junction**; togli solo la junction e fai un `npm ci` tuo nel worktree.
- Test: `npm run typecheck`, `npm run build` e la suite intera con i loro turni: è la prima con Vite 7, Vitest 4 e il proxy di T123 insieme. Nell'esito quanti passano e i rossi che restano rilanciando il file da solo.
- Browser: non serve, T142 ha provato le pagine e T131 il gioco.
- Quando è fatto: merge risolto, commit su `task/T145`. Non toccare il `node_modules` del base. Poi l'orchestratore fa `integra T145`, `integra T142`, `integra T131` e l'`npm ci` nel base, a pipeline senza task.
- Esito: merge di `task/T142` risolto; l'ADR di Vite 7 è ora `0100-vite-7-vitest-4-e-il-primo-npm-audit.md`, con l'indice, `AGENTS.md` (Stack) e `docs/sicurezza/registro.md` (V-014); quelle del proxy restano 0099. Le citazioni «ADR-0099» di Vite 7 negli esiti di T131 e T142 restano com'erano, perché qui si cambia solo questo blocco: leggile come 0100. Junction tolta e `npm ci` nel worktree (Vite 7.3.7, Vitest 4.1.12, `npm audit` a 0); `node_modules` del base non toccato. Typecheck e build verdi; suite intera con il proxy di T123: 82 file, 746 passati, 16 `it.fails` attesi, 1 todo, nessun rosso. In `dist/` solo il nome di `GEMINI_API_KEY`, nei messaggi. Sicurezza: nessuna superficie nuova.

### T149 · Integrare T146 — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 22
- Contesto: `integra T146` va in conflitto in `docs/adr/README.md` e `src/kernel/validator.ts`. T146 (che porta dentro T126, i limiti dentro la sandbox) è partito senza T121 e ha preso il numero 0103, che nel base è di T121 (percorsi ammessi e git del server). Nasce da T146: `dossier T146`.
- Cosa fare: nel worktree di T149 `git merge task/T146`. L'ADR `0103-i-limiti-dentro-la-sandbox.md` prende il primo numero libero del base (0104, se nessun altro lo ha preso); correggi le citazioni che parlano di quei limiti (`AGENTS.md`, `docs/`, codice, test, indice degli ADR), lasciando stare quelle di T121. In `src/kernel/validator.ts` restano le modifiche di entrambi. Nel backlog restano tutti i blocchi.
- Test: `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Poi `npm run sicurezza:prove -- --solo V-007` e `--solo V-003`: il kit si legge, non si riscrive; se sovrascrive un esito di `docs/sicurezza/esiti/`, ripristinalo e metti il tuo in un file a parte.
- Browser: non serve, T146 ha provato il gioco con T126.
- Quando è fatto: merge risolto, commit su `task/T149`. Poi l'orchestratore fa `integra T149`, `integra T146` e `integra T126`.
- Esito: merge di `task/T146` risolto (c50d530). L'ADR dei limiti è **ADR-0105**, non 0104: mentre il task girava T125 è entrato nel base e ha preso lo 0104. Citazioni corrette in indice, `AGENTS.md`, registro, codice e test; quelle di T121 restano 0103. Gli esiti di T126 e T146 in questo backlog dicono ancora ADR-0103, perché qui si cambia solo questo blocco: leggile come 0105. In `validator.ts` restano `reservedName` di T121 e i limiti dei modelli di T126. Typecheck verde; suite intera: 87 file, 1065 passati, 3 `it.fails` attesi, nessun rosso. Kit: `--solo V-007` 3 ok su 3, `--solo V-003` 8 ok su 8, in `docs/sicurezza/esiti/2026-11-02-dopo-T149-V-007.json` e `-V-003.json`. Resta: `integra T149` va ancora in conflitto in `docs/adr/README.md` (git, provato con `merge-tree` su e69a22b): le righe 0104 del base e 0105 di qui entrano nello stesso punto, e vanno tenute entrambe, 0104 prima. È l'unico conflitto. Il base non è stato fuso (le regole ammettono solo `git merge task/T146`), quindi suite e kit non hanno girato con T125 dentro. Sicurezza: nessuna superficie nuova rispetto a T121 e T126.

### T150 · Integrare T149 — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 22
- Contesto: `integra T149` va in conflitto su una riga di `docs/adr/README.md`: nello stesso punto dell'indice entrano la 0104 del base (T125, i saldi) e la 0105 di T149 (i limiti dentro la sandbox). La suite e il kit di T149 non hanno girato con T125 dentro, e T125 e T126 toccano entrambi `src/kernel/kernel.ts` (git li fonde da solo, va provato). Nasce da T149: `dossier T149`.
- Cosa fare: nel worktree di T150 `git merge task/T149`. Nell'indice restano entrambe le righe, la 0104 prima. Non si rinumera nulla. Nel backlog restano tutti i blocchi.
- Test: `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Poi `npm run sicurezza:prove -- --solo V-005`, `--solo V-007`, `--solo V-010`: il kit si legge, non si riscrive; se sovrascrive un esito di `docs/sicurezza/esiti/`, ripristinalo e metti il tuo in un file a parte.
- Browser: non serve, T146 e T125 hanno provato il gioco ciascuno col suo.
- Quando è fatto: merge risolto, commit su `task/T150`. Poi l'orchestratore fa `integra T150`, `integra T149`, `integra T146` e `integra T126`.
- Esito: merge di `task/T149` risolto (6e0439d): nell'indice degli ADR la 0104 e poi la 0105, nessuna rinumerazione, tutti i blocchi del backlog restano; `kernel.ts` lo ha fuso git da solo. Typecheck verde. Suite intera, a macchina condivisa: 88 file, 1073 passati, 3 `it.fails` attesi, **7 rossi, tutti timeout da 60 s** (`between` 2, `credits` 2, `referente` 3). Rilanciati da soli: `credits` verde (6 su 6); `referente` 5 su 5 con la macchina al 9-34 %, ma 3 rossi con la macchina oltre il 50 %; `between` **mai verde col suo limite** (5 rossi su 7 da solo, due volte, macchina al 56-63 %), 7 su 7 solo su una copia temporanea del merge con i limiti del file alzati (macchina al 22 %, 369 s, test da 42 a 89 s: lì nessuna asserzione fallisce). I rossi non vengono dal merge: `referente`, stesso file in contemporanea su `e1c04a8`, T149 e il merge, dà gli stessi 3 timeout e gli stessi tempi (71, 74-75, 66 s). Nota: `--testTimeout` da riga di comando non conta per questi test, che hanno il limite nel file o nella configurazione; `between` è il lavoro di T148, `referente` sta ancora a 40-70 s per test e resta fragile. Kit, su server vero, con T125 e T126 insieme: V-005 3 ok su 3, V-007 3 ok su 3, V-010 2 ok su 2 (`docs/sicurezza/esiti/2026-11-02-dopo-T150-V-00{5,7}.json`, `-V-010.json`; il kit non ha sovrascritto esiti già committati). Sicurezza: nessuna superficie nuova, solo il merge.

### T147 · Integrare T128 — `fatto` (dipende da T146)
- Pipeline: claude · stima 3% · approvato · priorità 1
- Step: 22
- Contesto: `integra T128` va in conflitto in `docs/adr/README.md` e `vite.config.ts`: T128 (la coda delle CLI blindata, V-009) è partito senza T120, che ha messo `gate` sulle route in `vite.config.ts`, e aveva preso il numero 0102, che nel base è di T120. Nasce da T128: `dossier T128`.
- Cosa fare: nel worktree di T147 `git merge task/T128`. L'ADR di T128 prende il primo numero libero del base; correggi le citazioni della coda blindata (`AGENTS.md`, `docs/`, codice, test, indice degli ADR), lasciando stare quelle di T120. In `vite.config.ts` restano entrambe le cose: la route `/api/coda` montata solo con `QUINE_CODA=1`, loopback, stessa origine e segreto di T128, insieme ai controlli di T120. In `AGENTS.md` e nel backlog restano le aggiunte di entrambi.
- Test: `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Poi `npm run sicurezza:prove -- --solo V-009`: il kit si legge, non si riscrive.
- Browser: col turno `browser`, con `QUINE_CODA=1`: la pagina del gioco legge il segreto e mette e ritira una richiesta; senza segreto e da un'altra origine locale 403 (T128 lo ha provato senza T120). Nell'esito cosa si è visto.
- Quando è fatto: merge risolto, commit su `task/T147`. Poi l'orchestratore fa `integra T147` e `integra T128`.
- Esito: merge di `task/T128` su `task/T147`. L'ADR della coda è ora ADR-0106 (0102 resta di T120), citazioni corrette tranne l'esito di T128 in questo backlog, che dice ancora ADR-0102 perché qui si tocca solo il blocco di T147. In `vite.config.ts` `subscriptionQueue` con `enabled: queueWanted(env)` e `sessionServer` con i parametri di T120. La route resta su `accessRefusal`, cioè `gate` senza account anche con gli account: annotato nell'ADR. Typecheck verde; suite intera 88 file, 1090 passati, 2 attesi, nessun rosso. Kit `--solo V-009`: 2 ok (risposte 404, perché il kit gira senza `QUINE_CODA`: non misura il segreto, lo fanno i test di `rotte.test.ts` e il browser), in `esiti/2026-11-02-dopo-T147-V-009.json`. Browser con `QUINE_CODA=1` sulla build: la pagina `localhost` legge il segreto (64 caratteri), mette una richiesta (`in coda`, 1), la ritira (0); senza segreto o con uno sbagliato 403; da `http://[::1]:4741` verso `localhost:4741` 403 «origine non ammessa» su segreto, stato e POST, nessun file in coda anche con `no-cors`. Sicurezza: nessuna superficie nuova.

### T148 · Alleggerire `tests/between.test.ts` — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 2
- Step: 27
- Contesto: richiesta dell'autore (02/11). In T121 il file ha 1 timeout a 60 s nella suite; da solo col limite normale ne scadono 5, col limite alzato passa 7 su 7 a circa 67 s per test, a macchina carica. Il file mette limiti di 60 s e 180 s test per test (T91 li aveva già alzati): alzarli ancora non è la soluzione. Nasce da T121 e T91: `dossier T121`, `dossier T91`.
- Cosa fare: misura prima dove va il tempo (avvio del kernel per ogni test, tick simulati, attese) e con che carico; se ne viene un collo di bottiglia del kernel e non del test, dillo nell'esito con la misura. Poi accorcia il file: per esempio un mondo condiviso dove i test non si disturbano, meno tick da simulare, un universo di prova più piccolo. Ogni test continua ad affermare le stesse cose (T43a, T43b, T43c): nessuna asserzione tolta né indebolita, nessun `skip`. Niente limiti alzati. Non cambiare il codice del gioco per far passare i test: se serve, è una domanda.
- Test: tempi del file prima e dopo, da solo e nella suite, e il carico della macchina quando li misuri. `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo.
- Browser: non serve.
- Quando è fatto: il file passa da solo entro i limiti normali, ogni test molto sotto i 60 s; commit su `task/T148`.
- Esito: `task/T148`, cambia solo `tests/between.test.ts`: un `InlineRunner` condiviso da tutti i kernel del file (`KernelOptions.forms`, opzione che esisteva già) e via `vi.setConfig` e i limiti test per test, ora vale il globale di 60 s; nessun `expect` toccato, nessuno `skip`, nessun cambio al gioco. **Dove va il tempo** (carico CPU 69 % all'inizio, 3 % alla fine, una lettura): un mondo con tre viandanti sono 4 boot da ~10 s, 40 s su 41; i tick poco (30 fotogrammi di tutti i kernel 0,6 s). Con le forme già pronte un boot scende a 0,2-0,5 s: **il collo di bottiglia è del kernel**, ogni `Kernel.boot` riesegue in Node i programmi delle forme (quanto T91 aveva già indicato); non corretto, come chiesto. Il risultato condiviso è sicuro perché nessuno scrive sulla griglia di un risultato e le istanze la copiano (`instanceGrid`). **Tempi, da solo**: prima 386 s, test da 39-111 s (carico 31-47 %); dopo 39 s, test da 1,7-16,6 s (carico 43-51 %), il primo paga l'unico giro dei programmi. **Nella suite**: dopo 2-19 s per test, 7 su 7 (carico 30-47 %); il prima nella suite non l'ho rimisurato, per T121 era 1 timeout da 60 s. **Suite intera: 1032 verdi, 2 rossi, 4 `expected fail`, 1 `todo`**: timeout da 60 s in `tests/credits.test.ts` e `tests/referente.test.ts`, che T148 non tocca e che T121 aveva verdi. Rilanciati da soli insieme (due file, carico 51-62 %) restano rossi e di più: 5 timeout su 11 test (2 in `credits`, 3 in `referente`), 62-66 s. È lo stesso male dei boot ripetuti, ma quei due file andrebbero alleggeriti a parte: qui non sono stati toccati e la suite **non è verde**. Typecheck verde. Sicurezza: nessuna superficie nuova, cambia solo un test.

### T151 · Alleggerire `tests/credits.test.ts` e `tests/referente.test.ts` — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 2
- Step: 27
- Contesto: approvato dall'autore (02/11). Nella suite di T148 sono gli unici 2 rossi, per timeout a 60 s; T121 li aveva verdi. Rilanciati insieme, senza il resto della suite, danno 5 timeout su 11 a 62-66 s, con la CPU al 51-62 %. Causa probabile, non misurata su questi due file: i boot ripetuti, che rieseguono in Node i programmi delle forme della corona (T91). T148 ha risolto lo stesso problema in `tests/between.test.ts` con un `InlineRunner` condiviso, passato con `KernelOptions.forms`. Nasce da T148 e T91: `dossier T148`, `dossier T91`.
- Cosa fare: prima misura dove va il tempo in ciascun file; se la causa non sono i boot, scrivilo nell'esito e correggi ciò che misuri. Poi alleggerisci i due file come ha fatto T148. Non togliere asserzioni, non usare `skip`, non alzare i limiti, non toccare il codice del gioco: la cache delle forme nel kernel è un passo a parte, che l'autore non ha ancora approvato. Se i file non si possono alleggerire senza toccare il gioco, fermati e scrivilo in `docs/pipeline/domande/T151.md`.
- Test: tempi dei due file prima e dopo, da soli e nella suite, e il carico della macchina quando li misuri. `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo.
- Browser: non serve.
- Quando è fatto: i due file passano da soli entro i limiti normali, ogni test molto sotto i 60 s; commit su `task/T151`.
- Esito: `task/T151`, cambiano solo `tests/credits.test.ts` e `tests/referente.test.ts`: tutti i kernel di ciascun file usano un `InlineRunner` condiviso e in `referente` spariscono i `60_000` test per test, uguali al globale; nessun `expect` toccato, nessuno `skip`, nessun cambio al gioco. **Diverso da T148**: `Kernel.branchKernel` fa il suo boot senza passare `forms`, quindi l'opzione data ai boot del test non lo raggiunge; il runner entra con `vi.spyOn(Kernel, 'boot')` a livello di file (ogni file di test ha il suo ambiente, la spia non esce di lì). **Dove va il tempo**, misurato con un test temporaneo, non committato (carico 54 % a fine misura): i boot, come previsto. Ogni boot 13-14 s; con il runner già pieno 0,2-0,3 s. Un mondo con master e un giocatore sono 3 boot, ~40 s; la prima richiesta al Referente 14-15 s, quasi tutti del boot del kernel del ramo, che nella misura non era raggiunto dal runner (8 fotogrammi 0,5 s); 6 fotogrammi 0,4-0,5 s. **Tempi, da soli**: prima, i due file in sequenza, 365 s, test fino a 59,6 s (carico 26-58 %, tutti verdi per poco); dopo, `credits` 27 s, test da 1,3-14 s (carico 46-37 %), `referente` 29 s, test da 0,3-18 s (carico 37-43 %); in ogni file il primo paga l'unico giro dei programmi. **Nella suite** (carico 57-36 %): `credits` 1,7-15 s, `referente` 0,4-21 s, 11 su 11; il prima nella suite non l'ho rimisurato, per T148 erano 2 timeout da 60 s. **Suite intera: 1048 verdi, 1 rosso, 4 `expected fail`, 1 `todo`**: timeout da 60 s in `tests/branch.test.ts` («only the master has a branch…», 67 s), che T151 non tocca e che T148 aveva verde. Rilanciato da solo passa, 5 su 5 in 174 s con test fino a 46 s e oltre (carico 63-44 %): è lo stesso male in un altro file, che va alleggerito a parte; **la suite non è verde**. Typecheck verde. Sicurezza: nessuna superficie nuova, cambiano solo due test.

### T144 · Integrare T122 — `fatto` (dipende da T142)
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 22
- Contesto: `integra T122` va in conflitto in `AGENTS.md`, sulle righe vicine dello Stack. T122 (il confine tra JS e Lua, `Crossing`) è finito e verificato. Parte quando Vite 7 e Vitest 4 di T131 sono nel base, per non rifare il merge. Nasce da T122: `dossier T122`.
- Cosa fare: nel worktree di T144 `git merge task/T122`; in `AGENTS.md` restano le aggiunte di entrambi. L'ADR di T122 è `0099-il-confine-tra-js-e-lua.md`, ma nel base il 0099 è già di T123 (il proxy di Gemini) e T131 ne prende un altro: rinominalo al primo numero libero del base e correggi le citazioni che parlano del confine («ADR-0099» di T122 in `AGENTS.md`, `sandbox.ts`, test, `docs/sicurezza/`, indice degli ADR), lasciando stare quelle del proxy. Nel backlog restano tutti i blocchi.
- Test: `npm run typecheck` e la suite intera con i loro turni, con Vitest 4 e i test nuovi di T122 (`tests/sicurezza/uscita.test.ts`, il limite di 180 s in `tests/between.test.ts`). Nell'esito quanti passano e i rossi che restano rilanciando il file da solo; le voci V-008, V-017 e V-019 restano chiuse.
- Browser: non serve, T122 ha provato la build.
- Quando è fatto: merge risolto, commit su `task/T144`. Poi l'orchestratore fa `integra T144` e `integra T122`.
- Esito: merge di `task/T122` risolto. In `AGENTS.md` lo Stack del base (Vite 7, ADR-0100; sito con i crediti) con la riga di Lua di T122. L'ADR del confine è ora `0101-il-confine-tra-js-e-lua.md`, con l'indice, `AGENTS.md`, `sandbox.ts`, `docs/sicurezza/audit-2026-11.md` e `docs/sicurezza/registro.md` (V-008, V-019); quelle del proxy restano 0099. La citazione «ADR-0099» nell'esito di T122 resta com'era, perché qui si cambia solo questo blocco: leggila come 0101. Typecheck verde; suite intera con Vitest 4.1.12: 83 file, 782 passati, 12 `it.fails` attesi, 1 todo, nessun rosso. V-008, V-017, V-019 restano `chiuse`. Sicurezza: nessuna superficie nuova rispetto a T122 e al base.

### T146 · Integrare T126 — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 1
- Step: 22
- Contesto: `integra T126` va in conflitto in `docs/adr/README.md`: il 0102 nel base è di T120 (chi può scrivere), T126 aveva preso lo stesso numero per i limiti dentro la sandbox. La suite di T126 è partita senza T120. T126 non ha provato nel browser il nuovo allocatore (lo attraversa JS a ogni allocazione) né ripassato il kit. Nasce da T126: `dossier T126`.
- Cosa fare: nel worktree di T146 `git merge task/T126`. L'ADR dei limiti dentro la sandbox prende il primo numero libero del base; correggi le citazioni che parlano di quei limiti (`AGENTS.md`, `docs/`, codice, test, indice degli ADR), lasciando stare quelle di T120. In `AGENTS.md` e nel backlog restano le aggiunte di entrambi.
- Test: `npm run typecheck` e la suite intera con i loro turni. Nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Poi `npm run sicurezza:prove` per V-007, compresa V-007.c (l'HTTP con un mondo bloccato, che nei test non ha equivalente), e V-007 nel registro secondo ciò che misura: resta `in correzione` per T127. Il kit si legge, non si riscrive: se una prova va cambiata, l'esito lo dice con il motivo.
- Browser: `?skip&offline` sulla build, col turno `browser`: il gioco parte e cammina senza errori in console e il tick non è visibilmente più lento (l'allocatore è stato misurato solo in Node, da 0,95 a 1,15 ms). Nell'esito cosa si è visto e la misura del tick, se si riesce a leggerla.
- Quando è fatto: merge risolto, commit su `task/T146`. Poi l'orchestratore fa `integra T146` e `integra T126`.
- Esito: `task/T146`, l'ADR dei limiti è ora ADR-0103 (indice, `AGENTS.md`, registro, backlog, codice, test); le citazioni di T120 restano 0102. Typecheck verde. Suite intera, a macchina condivisa: 872 passati, 3 attesi, 9 rossi, tutti timeout da 60 s (`between` 4, `referente` 3, `branch` 1, `credits` 1); rilanciati da soli i quattro file sono verdi, nessun rosso resta. Da guardare: da solo il test più lento di `credits` sta a 53 s su 60. Stesso file, una misura per lato: 159 s con i sorgenti di prima del merge e 177 s con T126 (+11%), il test più lento da 43 a 53 s. T126 riduce il margine e questi timeout possono tornare. Kit `--solo V-007`, invariato (`esiti/2026-11-01-dopo-T126.json`): a, b, c ok; V-007 resta `in correzione` per T127, perché il kit non misura i blocchi rimasti. Browser su `?skip&offline`: parte e cammina, nessun guasto né errore del gioco; tick 3,8 ms da fermo e 4,4 ms camminando (p95 5-6 ms, massimo 9 ms a mondo assestato). Nessun confronto nel browser col prima di T126. Sicurezza: nessuna superficie nuova rispetto a T126.

### T159 · Integrare T129 — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 22
- Contesto: `integra T129` va in conflitto in `docs/adr/README.md`: T129 (i limiti ai messaggi, V-011) ha preso il numero 0105, che nel base è di T149 (i limiti dentro la sandbox). T129 è partito da `e1c04a8`, senza T126, T146, T148, T149 e T150. Nasce da T129: `dossier T129`.
- Cosa fare: nel worktree di T159 `git merge task/T129`. L'ADR di T129 diventa **ADR-0107** (0107-limiti-ai-messaggi.md): lo 0106 è riservato a T147, già in corso. Correggi le citazioni dei limiti ai messaggi (`AGENTS.md`, `docs/`, codice, test, `docs/sicurezza/registro.md`, l'esito del kit di T129 in `docs/sicurezza/esiti/` se la cita, il blocco di T129 nel backlog), lasciando stare quelle dei limiti dentro la sandbox. Nell'indice degli ADR restano tutte le righe, in ordine. Nel backlog restano tutti i blocchi.
- Test: `npm run typecheck` e la suite intera con i loro turni, col limite normale, senza `--testTimeout`: nell'esito quanti passano, i rossi che restano rilanciando il file da solo, il carico della macchina. Il `between` nuovo di T148 è nel base: i tempi di `between` vanno letti col suo. Poi `npm run sicurezza:prove -- --solo V-011`: il kit si legge, non si riscrive; se sovrascrive un esito, ripristinalo e metti il tuo in un file a parte.
- Browser: non serve, T129 non cambia ciò che si vede.
- Quando è fatto: merge risolto, commit su `task/T159`. Poi l'orchestratore fa `integra T159` e `integra T129`.
- Esito: `task/T159`, merge in 010c865; il solo conflitto era l'indice degli ADR, con tutte le righe tenute in ordine (0105 di T149, poi 0107). I limiti ai messaggi sono **ADR-0107**: file, indice, `AGENTS.md` (regola 8e), `docs/sicurezza/registro.md` (V-011), `src/session/server.ts`, `tests/sicurezza/messaggi.test.ts`, blocco di T129; le citazioni dei limiti dentro la sandbox restano 0105. L'esito del kit di T129 non cita l'ADR. Dal fork di T129 il base non ha cambiato `src/session/` né `server/session.ts`, quindi non c'erano messaggi nuovi da mettere in `heavy`. Typecheck verde. Suite intera col limite normale (980 s): **1089 passati, 3 attesi, 1 rosso**: `referente` «a request of the master to the Referente…», timeout a 60 s, nessuna asserzione fallita. Il file da solo: verde 2 volte su 3 con la macchina scarica (149 s, carico 10% a fine suite); rosso nei giri col carico al 35-50% (14 processi node di altri task), con 2 test a 60 s. Lo stesso rosso c'è con il `server.ts` del base: non lo porta T129, ma la misura dice solo che entrambi superano il limite, non quanto durano. Un giro della suite interrotto aveva dato anche un timeout in `credits`. `between` non è rosso e i test V-011 durano meno di 1 s. Kit: V-011.a ok sul merge (`esiti/2026-11-02-dopo-T159-V-011.json`; il kit scrive `<data>.json`, che non esisteva: niente sovrascritto). Il kit conta «600 su 600 serviti» anche quando sono rifiuti: l'ok viene dal motivo della risposta. Sicurezza: nessuna superficie nuova, V-011 chiusa da T129.

## Dalla chat del 02/11/2026 (testo originale: `docs/userchats/to-do-2026-11-02.md`)

### T152 · Le ambientazioni della Genesi: medievale, steampunk, moderna, futuristica — `fatto` (`e30e2c8`) (dipende da T205)
- Pipeline: claude · stima 5% · approvato · browser · priorità 80
- Step: 31
- Contesto: richiesta 1 dell'autore: un universo medievale (quello che c'è, `aurora`), uno steampunk, uno moderno (grande città, anni 90), uno futuristico (tipo neonpunk). Oggi il tema è testo libero nella schermata della Genesi (`src/ui/genesis.ts`, `planGenesis` in `agents/genesis.ts`) e il seme `universe/prompts/theme.md` è il Regno di Valmora. Il seme può presupporre il medioevo anche altrove: i 20 ambienti, i prompt degli agenti, la guida di stile, il canone delle rune e i modelli generici. Il lessico è già uguale in ogni ambientazione (ADR-0075).
- Cosa fare: prima un censimento di ciò che nel seme presuppone il medioevo, con file e riga. Poi quattro temi tra cui scegliere nella schermata della Genesi, modificabili come oggi; il medievale resta quello attuale. Ciò che il censimento trova diventa neutro o dipende dal tema, nel modo più piccolo: niente seme separato per ambientazione. Rune, tappeto, corona e quarta parete valgono ovunque; il tema spiega le rune senza magia medievale obbligatoria e senza metagioco. Il censimento dice anche ciò che si è lasciato com'è e perché. Decisione architetturale: ADR e `AGENTS.md`.
- Test: una Genesi offline (`MockModels`) per ogni tema: i file giusti, `prompts/theme.md` scritto, un universo che parte. Un universo esistente non cambia. Typecheck e suite intera con i loro turni.
- Browser: col turno `browser`, `?offline`: la schermata della Genesi offre i quattro temi e con ognuno si arriva al mondo senza errori in console. I contenuti veri non si vedono offline: scrivilo nell'esito.
- Quando è fatto: commit su `task/T152`; nell'esito il censimento e cosa può ancora tradire il tema nei contenuti generati, da leggere in T153.
- Esito: commit `fa0d352` e `e30e2c8` su `task/T152`: quattro temi modificabili nella Genesi su un seme solo (`src/kernel/themes.ts`, ADR-0134, `AGENTS.md`, glossario); prompt, principi e canone neutri; case comuni dipendenti dal mondo (`case_comuni` → `commonHouse`, `commonHouseModel`, prime nella coda del `ModelDirector`); con meno di 3 ambienti restano solo quelli senza epoca (`TIMELESS_LAYOUTS`, anche per il medievale); un piano il cui ambiente non c'è più si rifà; `?offline` può fare una Genesi locale; `STRUCTURES` riconosce edifici moderni; corretto il riquadro del tema schiacciato. Censimento in `docs/temi-censimento.md`: lasciati com'è, con il motivo, i contenuti di Valmora (la Genesi li sostituisce), i nomi dei timbri, i modelli generici, il viandante, la bozza naturale, `BASE_CODES`, `ITEM_SHAPES`, i ripieghi su terreni e oggetti del seme, la musica. Il filtro `META_RE` non è allentato. Può ancora tradire il tema, da leggere in T153: forma dei timbri, città rada sulla bozza naturale, mestieri, casette se l'Artista lascia vuoto `case_comuni` o finisce il budget, oggetti, righe ritirate dal filtro, leggende, modo di parlare della magia, musica. Non provato: Gemini vero, quindi nessun contenuto generato per tema, e `commonHouse` solo nei test con modelli finti, senza un modello scolpito davvero. Margine di `tests/focus.test.ts` quasi esaurito. Suite 1960 test, typecheck e build verdi. Sicurezza: nessuna superficie nuova.

### T153 · Gli universi steampunk, moderno e futuristico: leggerli e provarli — `in attesa` (dipende da T152, T156, T88)
- Pipeline: claude · stima 2% · priorità 81
- Step: 31
- In attesa: la generazione stessa. I nomi scelti dall'autore (03/11, `docs/pipeline/domande/T153.md`) sono nell'elenco `generazione` di `tools/pipeline/config.json`: `orichalcum` (steampunk), `neapolis` (moderno), `sidera` (futuristico). Questo task si approva quando gli universi sono pronti.
- Contesto: integrato con T88 su richiesta dell'autore (03/11): gli universi li genera il generatore differito (T207) con i crediti che avanzano (T88), non questo task. Decisioni dell'autore: niente API a consumo; solo Claude Code (`agy` soltanto nelle prove del prompt, ADR-0106 non si riapre); tetto per universo 25 % della settimana, modificabile in corsa; tutti in multigiocatore; `aurora` non si tocca. Le strutture vengono col prompt nuovo: T156.
- Cosa fare: per ogni universo leggi i contenuti e il costo da ciò che il generatore registra. La bibbia, gli ambienti e i modelli sono dell'ambientazione? Ciò che tradisce il tema diventa una proposta di task.
- Browser: col turno `browser`, ogni universo con `?universo=<nome>`, senza chiamate alle API (resta nei luoghi già generati o usa `?offline`): screenshot di un luogo con strutture; si cammina senza errori in console.
- Quando è fatto: nell'esito il costo di ciascuno e ciò che si è visto.
### T154 · Il banco del prompt delle strutture: una prova senza contesto e il suo giudizio — `fatto`
- Pipeline: claude · stima 4% · approvato · priorità 30
- Step: 30
- Contesto: richiesta 2 dell'autore. Con piani (T53b), rampe (T53a), salto (ADR-0080) e sotterranei (ADR-0091) i palazzi devono essere più articolati e dettagliati. Il metodo è dell'autore: si scrive un prompt, lo si prova senza altro contesto su Claude Code, si guarda il risultato, si corregge **il prompt e mai il risultato**, si riparte. Si riusa ciò che c'è: `lab/prompts/scultore-mj.md`, `lab/mjx/sculptor.ts`, `lab/scripts/mjx-trial.ts`, `mjx-render.ts`, `mjx-stats.ts`, `src/mj/check.ts`, `src/mj/photo.ts`, `universe/prompts/agents/scultore.md`.
- Cosa fare: uno script che (1) lancia `claude -p` col solo prompt e il bersaglio, da una cartella vuota, senza strumenti né file di progetto, e ne salva i token di input e di output; (2) passa l'XML al motore vero e dà quattro foto, le misure e un elenco di difetti; (3) tiene ogni tentativo in una cartella con prompt, risposta, foto e misure, così si confrontano. Definisci la soglia di qualità, in misure dove si può: più piani raggiungibili con rampe, stanze collegate, porta sul sentiero, punti da cui si salta, varietà delle parti, finestre e dettagli, il modello che finisce entro `FORM_LIMITS`. Ciò che non si misura lo giudica chi guarda le foto, con criteri scritti. Scrivi anche una prima versione del prompt. Bersagli: almeno 6 edifici diversi, tra cui uno moderno, uno steampunk e uno futuristico.
- Test: lo script gira su un bersaglio e le misure riconoscono un modello buono e uno brutto (test offline su XML fissi). Typecheck e suite intera con i loro turni.
- Browser: non serve, le foto vengono dallo script.
- Quando è fatto: commit su `task/T154`; nell'esito soglia, token del primo prompt e prima foto giudicata.
- Esito: `lab/banco/` (misure, bersagli, prompt, soglia e criteri nel README, prima prova in `prima-prova/`) e `lab/scripts/banco-strutture.ts`. Sette bersagli. Le misure usano `rampBlocks`, `topUnder`, `groundOfForm`, con un corpo largo come il viandante; un test cammina nel kernel vero. Prompt: input 2662 token, poi 2750. Steampunk: il tentativo 1 fallisce `salti`, il 2 passa tutte le misure, ma le foto non passano (tetto a strisce, massa unica, lati ripetuti): T155 parte da lì. Diverso dal previsto: nel gioco si atterra solo sui pavimenti a cui si arriva a piedi (`bodyGround`), quindi sulla cima di una cassa non si sta; il banco lo misura così e il prompt lo dice. L'output pesa molto più dell'input (30-39 mila token, ragionamento compreso). Sicurezza: nessuna superficie nuova (`lab/`, riusa l'isolamento di `tools/abbonamenti/servi.ts`).

### T155 · Iterare il prompt delle strutture fino alla soglia — `fatto` (dipende da T154)
- Pipeline: claude · stima 8% · approvato · priorità 31
- Step: 30
- Contesto: il ciclo della richiesta 2, col banco di T154. Obiettivo: alta qualità col minimo di token in input; il prompt può contenere esempi o altre tecniche, purché ognuna si guadagni i suoi token.
- Cosa fare: ciclo prova → foto e misure → correzione del prompt → da capo. Mai correggere a mano un XML. A ogni giro una riga in un diario (cosa è cambiato, token, misure, cosa si vede). Prova anche a togliere: ciò che non cambia il risultato esce. La soglia è raggiunta quando tutti i bersagli la passano nello stesso giro e con un secondo tentativo sugli stessi (la casualità conta). **Al più 12 giri**: se la soglia non arriva, fermati e scrivi in `docs/pipeline/domande/T155.md` a che punto sei e cosa manca, senza abbassarla.
- Test: i modelli finali girano nel motore del gioco e passano i controlli di `src/mj/check.ts`. Typecheck con il suo turno.
- Browser: non serve; le foto finali restano nel commit per l'autore.
- Quando è fatto: commit su `task/T155` con prompt, diario e foto finali; nell'esito token per modello e quanti giri.
- Esito: **soglia non raggiunta**, domanda in `docs/pipeline/domande/T155.md`. 11 giri su 12, 102 chiamate. Ultimo giro completo (`lab/banco/finale/`, con `giudizio.md`): 11 tentativi su 14 passano le misure, 7 di quelli anche le foto; per ogni bersaglio almeno un tentativo le passa entrambe, ma non tutti nello stesso giro con il secondo tentativo. Giri 5-11: 64 su 80 passano le misure. Token per modello al giro 11: input 3770-3832 (2750 in T154), output in media 57 mila. Oltre la stima: ~114 dollari a listino e il limite delle 5 ore scattato due volte. Diverso dal previsto: due correzioni al banco, `murato` contava l'aria sotto il piano terra fuori dalla cantina, che nel gioco è terra piena (falso rosso), e una misura nuova `cantina`, che alza la soglia per chi ha una cantina; timeout della CLI da 15 a 25 minuti. La soglia non si è abbassata; il giudizio delle foto è di chi ha scritto il prompt. Diario: `lab/banco/diario.md`. Sicurezza: nessuna superficie nuova (solo `lab/` e documenti).

### T173 · Il banco con una seconda richiesta: il giro di conferma del prompt delle strutture — `fatto` (dipende da T155)
- Pipeline: claude · stima 6% · approvato · priorità 31
- Step: 30
- Contesto: nasce da T155 (`dossier T155`, `docs/pipeline/domande/T155.md`, con la decisione in fondo): 11 giri, soglia non raggiunta per sbagli del singolo tentativo. Decisione dell'orchestratore, nell'autonomia dell'autore: si conta come nel gioco, dove l'invalido torna con il motivo (regola 2 di `AGENTS.md`, e l'Artista giudica con problemi e consigli). Il prompt è `lab/banco/prompt.md`.
- Cosa fare: al banco una seconda richiesta: al tentativo che non passa torna il suo XML con i difetti misurati e, se le misure passano e le foto no, i problemi scritti dal giudizio. Poi **un solo giro** dei sette bersagli, due tentativi ciascuno. Passa se tutti i 14 tentativi passano misure e foto entro due richieste, nello stesso giro: misure e criteri restano quelli di `lab/banco/README.md`, senza toccarli, e il README dice cosa conta ora. **Non cambiare il prompt.** Il giudizio delle foto lo dà chi non ha scritto il prompt: `lab/banco/conferma/giudizio.md` con le foto accanto, e dice per ogni tentativo se è passato alla prima o alla seconda. Se non passa, fermati: niente altri giri, scrivi in `docs/pipeline/domande/T173.md` cosa manca.
- Test: i modelli finali girano nel motore del gioco e passano i controlli di `src/mj/check.ts`; il cambio al banco ha un test in `lab/tests/banco.test.ts`. Typecheck con il suo turno.
- Browser: non serve; le foto restano nel commit per l'autore.
- Quando è fatto: commit su `task/T173`; nell'esito quanti alla prima, quanti alla seconda, quali difetti ha corretto la seconda, token e costo della seconda richiesta (è il dato che serve a T156). Attento alla finestra delle 5 ore: al più 3 tentativi insieme.
- Esito: **12 su 14, soglia non raggiunta**, domanda in `docs/pipeline/domande/T173.md`. Alla prima 9, alla seconda 3; falliscono `futuristica/2` (un `at` con due numeri nella seconda richiesta, il gioco la rifiuta) e `pagoda/2` (scala corretta, foto no). La seconda ha corretto una scala che non portava al piano sopra e, dalle foto, tetti, torre, terrazza e sala comune; gli interni restano «parte» in tutti i 12. Seconda richiesta, media di 5: input 14 251 token, output 43 828, 0,90 dollari a listino (0,28 con un solo difetto di misure); prima richiesta: 3791, 60 553, 1,22. Prompt, misure e criteri invariati. Diverso dal previsto: al messaggio ho aggiunto il significato di ogni misura e dove sta il pavimento non raggiunto (`persi`, in `misure.ts`, che non cambia nessun valore); il limite delle 5 ore è scattato una volta e tre chiamate si sono perse con un'interruzione della sessione. Giudizio delle foto: una sessione che non ha scritto il prompt, stesso modello, `lab/banco/conferma/giudizio.md`. Test: suite intera con tutti i test verde una volta su quattro; le altre tre un fallimento per tempo scaduto sotto carico (due volte V-006 di `tests/sicurezza/produzione.test.ts`, «ingresso di bruno»; passa da solo). Senza i test nuovi di T173 verde due su due: pochi tentativi, ma il test è fragile e va guardato. Non l'ho toccato. Sicurezza: nessuna superficie nuova (solo `lab/` e documenti).

### T258 · Il kernel segna il suolo per i programmi delle strutture — `fatto` (`cbfe5ca`, `ed092eb`; D33 chiusa con l'opzione A dall'orchestratore nell'autonomia, 05/11)
- Pipeline: claude · stima 5% · approvato · priorità 6
- Step: 30
- Contesto: decisione dell'autore del 04/11 (`docs/pipeline/domande/T182.md`, domanda 1, opzione A). Nasce da T182 (`dossier T182`). Una cantina non regge due taglie con un programma solo: a Grande il suolo è a z=20, a Enorme a z=16, e il programma non sa quale riceve. La locanda è perciò fuori dai 12 bersagli del banco.
- Cosa fare: il kernel segna il suolo con una lettera nello strato `base` da cui il programma parte, così lo stesso XML serve ogni taglia; i modelli già scolpiti non cambiano aspetto e non si rigenerano (attenzione alla versione della cache delle forme). Il prompt del banco (`lab/banco/prompt.md`) dice la lettera. Prova la locanda a due taglie e 5 semi, al più 4 richieste, con token e costo nell'esito. Non correggere qui `pagoda/1` e `tempio/2`: se la locanda non regge, dillo in `domande/T258.md` senza un altro giro.
- Test: motore e misure di `lab/tests/`, un caso con la lettera a Grande e a Enorme, un modello vecchio identico. Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T258`; ADR se la lettera è un contratto nuovo dei programmi, voce nel glossario. Sicurezza: nessuna superficie nuova.
- Esito: fatto: lettera del suolo (`suolo="E"`, `Program3.soil`, `FormRequest.base`, ADR-0135, glossario), modelli vecchi identici con la stessa chiave di cache e senza cambiare `FORMS_DB_VERSION`, `lab/tests/suolo.test.ts`, `riferimento/cantina.xml` a mano 12 semi su 12 alle due taglie e varia, ricetta in `lab/banco/prompt.md`, `esegui` con un tempo facoltativo; la locanda del modello non regge: 0 su 4 richieste (input 11 660-25 958, output 48 041-73 298, 5,45 $ a listino), Grande 4/5 nelle seconde richieste, Enorme 0/5 perché il programma supera gli 8 s e si tronca (`1/seconda` senza limite passa le misure a 5 semi su 5 in 7,3-7,8 s), perimetro a Grande 0,04-0,05 contro 0,15; decisione in `docs/pipeline/domande/T258.md` (A motore, B tempo proprio, C una taglia), niente altro giro; non provato nel gioco (T156, lo Scultore non passa ancora `base`), foto non giudicate per soglia, `pagoda/1` e `tempio/2` non toccati; suite e typecheck verdi; sicurezza: nessuna superficie nuova.
- D33 (05/11, opzione A): il motore guarda solo dove serve (censimento delle lettere per riga, ADR-0142), voxel per voxel identico (`tests/mj-engine-determinism.test.ts`, 172 impronte prese prima): la cantina a Enorme da 5,6 s a 0,5 s, `locanda/1/seconda` da 5,8 s a 0,3 s e 5/5 a Grande ed Enorme col limite di 8 s. Locande con il perimetro corretto (`suolo/locanda/<n>/corretta`, 0,19 e 0,20) e quattro strutture con la cantina (`suolo/strutture/`): `lab/banco/suolo/D33.md`. Sicurezza: nessuna superficie nuova (solo il motore, nel processo di chi lo usa).

### T259 · Lo Scenografo: progetto e misura degli interni separati dall'edificio — `in attesa`
- Cloud: progetto e banco portati da T276 (`ed092eb`). Non si lancia in locale. Manca ciò che il task chiedeva: i costi di `docs/design/scenografo.md` sono stime, senza chiamate ai modelli. D37 (05/11): sì alla misura vera, con gli abbonamenti: la fa T303; resta `in attesa` finché T303 non porta i numeri.
- Pipeline: claude · stima 5% · approvato · priorità 8
- Step: 30
- Contesto: decisione dell'autore del 04/11 (`domande/T182.md`, domanda 2, opzione C): interni, decorazioni e oggetti di scena non li scrive lo Scultore ma un agente a parte, come il passaggio dal Cartografo allo Scultore. L'autore si aspetta di risparmiare rispetto a generare tutto insieme: va misurato. T182 dice che accorciare il prompt non ha abbassato il costo (1,15 $ contro 1,22 $: quasi tutto l'output è ragionamento), quindi il risparmio non è scontato. Nasce da T182 (`dossier T182`).
- Cosa fare, senza toccare il gioco: `docs/design/scenografo.md`. Come riceve l'edificio (programma, semi, piani, stanze misurate); come resta vera la regola «un programma per tipo, le istanze sono semi» su un edificio che cambia a ogni seme, confrontando un programma che cresce sulla griglia già fatta con la scelta di mobili esistenti come dati; quando parte (al primo ingresso o nella generazione differita); cosa si vede prima; quale manopola in `CENSUS`; chi paga. Sul banco, poche richieste: un edificio di T182 con il suo interno a parte contro lo stesso edificio con l'interno insieme, con token e costo; anche su un modello che costi meno.
- Test: i programmi provati girano nel motore e passano i controlli.
- Browser: non serve; fogli di contatto nel commit.
- Quando è fatto: commit su `task/T259`; nell'esito costo misurato di ogni via e la raccomandazione; i task che ne nascono sono una proposta per l'autore.
- Esito: `docs/design/scenografo.md`, banco `lab/banco/scenografo/` (`lab/scripts/banco-scenografo.ts`, `lab/tests/scenografo.test.ts`). Due vie su 6 edifici × 5 semi, con le stesse classi dello strato dei piedi (`φ ψ π #`) e una guardia del kernel sulla connessione 3D dei centri: il programma MarkovJunior di secondo stadio regge 30/30 al primo arredo (122 ms, varianza interna 0,86, ≈ 1 200 token), i modelli esistenti come dati 28/30 al primo e 30/30 entro 4 (319 ms, 0,77, ≈ 30 token di catalogo). Raccomandazione: i dati come base, il programma solo per cantina e arredi al soffitto. Diverso dal previsto: **nessuna richiesta ai modelli** (niente API in questa sessione), quindi il costo in dollari è una stima e la misura vera è il primo dei task proposti; la misura `stanze` di `giudica` non vale su un edificio arredato (cade quasi sempre, con tutte le stanze ancora percorribili).

### T156 · Il prompt nuovo nello Scultore del gioco — `fatto` (`7d9ee13`) (dipende da T155, T173, T182, T258)
- Pipeline: claude · stima 5% · approvato · browser · priorità 4
- Step: 30
- Deciso dall'autore il 04/11 (`domande/T182.md`): la ricchezza dei programmi a regole basta; le campate restano sgombre e gli interni arrivano in seguito, da un altro agente: un interno vuoto qui non è un difetto.
- Cambiato il 03/11 (autore, `docs/userchats/to-do-2026-11-03.md`, richiesta 1): il prompt da portare è quello procedurale di T182, non quello di T155. In più: il banco di T180 anche su Gemini (varianza e scala, non solo la qualità); nel gioco un programma serve più taglie, un forte enorme e uno gargantuesco lo condividono, e la seconda richiesta dello Scultore porta la traccia di T179; ciò che T180 dice che manca si fa qui.
- Contesto: T155 ottimizza il prompt su Claude, ma nel gioco le strutture le scrive lo Scultore sui modelli Gemini (ADR-0042, e i provider di ADR-0077): il risultato può cambiare col modello e va misurato. **Niente API (autore, 02/11):** per ora si genera solo con gli abbonamenti, Claude Code e `agy`. Il prompt del gioco è `universe/prompts/agents/scultore.md`, con `agents/sculptor.ts`.
- Cosa fare: porta il prompt per le classi di struttura e togli ciò che è superato, senza peggiorare le classi semplici. Prova gli stessi bersagli di T155 su Gemini attraverso `agy`, col banco di T154 e il suo prompt fidato (non la coda, ADR-0106), poche chiamate, nessuna alle API, con token e consumo nell'esito. Se il risultato è sotto la soglia, dillo con foto e misure e proponi la strada (adattare il prompt o cambiare modello): non cambiare da solo il modello predefinito, ha un costo per chi gioca. Gli universi esistenti ricevono il prompt come ogni aggiornamento dal seme, senza che cambi un modello già scolpito.
- Test: `MockModels` e i test dello Scultore; typecheck e suite intera con i loro turni.
- Browser: col turno `browser`: un edificio nuovo nel gioco, si entra, si sale di piano e si salta; screenshot.
- Quando è fatto: commit su `task/T156`; nell'esito qualità e costo su Gemini contro Claude.
- Esito: prompt procedurale nello Scultore per `structure` da Grande in su (senza scatola, 4 semi più la taglia successiva, traccia nella seconda richiesta), una voce per taglia che condivide il programma senza chiamate, `ModelInfo.seeds`, ADR-0158, kernel 0.2.2, suite e typecheck verdi; su Gemini 3.8 Flash via agy 1 su 7 alla prima e 2 su 7 entro due richieste contro 7 e 10 su 12 di Claude (alla prima 18 850 di input e 90 mila di output, 0,35 $ a chiamata contro 1,15 $; 13 chiamate, 5,39 $; tre seconde richieste vuote per il tetto di output); Argon non provato per il limite dell'abbonamento; i controlli del kernel non misurano i piani raggiunti; la decisione su modello o prompt è in `docs/pipeline/domande/T156.md`; sicurezza: nessuna superficie nuova.

### T157 · L'Attore: chi interpreta gli NPC, un'opzione del master — `fatto` (`a63d8e2`)
- Pipeline: fable · stima 15% · approvato · browser · priorità 20
- Step: 26
- Contesto: richiesta 3 dell'autore. Oggi il Narratore è l'unico interprete: `npc.chat` e `npc.dialogue` in `agents/minds.ts`. Con l'opzione accesa il Narratore crea solo legami, storie e **schede degli NPC** (il prompt di ognuno); un agente nuovo, l'**Attore**, le interpreta. Default spento: senza l'opzione nulla cambia e nessuna chiamata in più.
- Cosa fare: `universe.json → ai.attore`, riparato dal validatore, che il master sceglie con modelli e coefficienti (Genesi con `kernel.setAi`) e che la lobby mostra e permette di impostare (ADR-0086). La scheda è scritta dal Narratore una volta per individuo, salvata con lui, rivista quando cambiano legami o storia ma non a ogni battuta; alla prima battuta di un NPC senza scheda (universi vecchi) si scrive. L'Attore riceve scheda, ricordi per viandante, vicinato del grafo e tutto ciò che il Narratore riceve per quei compiti: principi della quarta parete, canone, lessico, filtro. Non inventa fatti del mondo: ciò che nasce nel dialogo (ricordi, oggetti citati, azioni) passa come oggi. Convenzione del nuovo compito: schema Gemini, risposta in `MockModels`, voce nel registro, `CENSUS` dei coefficienti, `payerOf`, prompt in `prompts/agents/attore.md`. Decidi il modello predefinito dell'Attore e scrivi perché. Decisione architetturale: ADR e `AGENTS.md`.
- Test: con l'opzione spenta le chiamate sono le stesse di oggi; accesa, `npc.chat` e `npc.dialogue` vanno all'Attore con la scheda, il Narratore scrive la scheda una volta sola, paga chi pagava; quarta parete e crediti esauriti come oggi; un client che non è il master non cambia l'opzione. Typecheck e suite intera con i loro turni. Esito «sicurezza: …» (lobby, sessione, crediti).
- Browser: col turno `browser`, `?offline`: l'opzione nella Genesi e nella lobby; una battuta con un NPC accesa e spenta; il registro mostra chi ha parlato.
- Quando è fatto: commit su `task/T157`; nell'esito il costo in più stimato per un'ora di gioco (`hourlyEstimate`).
- Esito: ADR-0116, `AGENTS.md`. `universe.json → ai.attore` (booleano, nome di un modello o `{acceso, modello}`; `repairAttore` in
  `coefficients.ts`, riesportata dal validatore, applicata da `readConfig`; `kernel.actor()`, `kernel.interpreter()`, `setAi({attore})`).
  Agente `attore` in `AGENTS` con `prompts/agents/attore.md`, contesto del Narratore per i compiti narrativi. La scheda: `Person.scheda
  {testo, impronta}` (`sheetFingerprint` in `society.ts`: persona, mestiere, storia, età, genere, legami), scritta da `kernel.ensureSheet`
  (compito `npc.sheet`, Narratore) alla prima battuta di un individuo e riscritta solo se l'impronta cambia; scartata se rompe la quarta
  parete. `npcReply`/`npcDialogue` prendono un `Interpreter` (agente e modello): con l'opzione accesa `attore` con `ACTOR_MODEL`
  (`gemini-3.8-flash`: le battute sono ciò che il giocatore legge di più, il prompt dell'Attore è corto, il perché nell'ADR). Stessi nomi
  dei compiti: `payerOf`, limiti e mock invariati; la scheda la paga chi paga la battuta (il viandante; `comune` per un dialogo). Il registro
  dice chi ha parlato (`npc.reply` dell'Attore o del Narratore, `npc.sheet`). Genesi: casella e modello; lobby: tutti lo vedono, il master lo
  imposta (nuovo messaggio `attore`, master soltanto, `setActor` in `server.ts`); `attore` in `LOBBY_AI_FIELDS`. `CENSUS` +`npc.sheet` (40 compiti);
  `hourlyEstimate`: battute sul modello dell'Attore e riga delle schede solo se acceso. `tests/attore.test.ts` (10 test); aggiornati
  `coefficients`, `screens` (9 scrivanie) e il finto DOM di `lobby.test.ts` (`input[type='number']`). Costo in più per un'ora (seme, pieno
  dettaglio): da 358 chiamate / 0,96 $ a 413 / 1,17 $ con `gemini-3.8-flash` (+0,21 $: 55 schede 0,07 $, 65 battute da 0,09 $ a 0,23 $);
  con l'Attore su Flash-Lite 1,03 $. Diverso dal previsto: il task diceva `npc.chat`, il compito si chiama `npc.reply`; la scheda non si
  scrive alla creazione dell'individuo ma alla prima battuta (chi non parla non costa), così universi vecchi e nuovi fanno lo stesso; la
  console nella Direzione e la scrivania del registro dal vivo nascono da `AGENTS` (T158 resta per gerboa, posto al tavolo e sala).
  Sicurezza: una superficie nuova, il messaggio `attore` (solo il master, nessuna chiamata ai modelli, modello filtrato e riparato);
  `ai.attore` esce nei `publicFiles` come gli altri campi della lobby; i crediti non cambiano.
  BROWSER: verificato con Claude in Chrome (`?offline`, preview 4737): Genesi con casella e modello dell'Attore e stima che passa da 0,96 $ a
  1,18 $; battuta con Berta accesa (registro: «Narratore → Attore: la scheda di Berta è scritta», «Attore: Berta a Viandante») e spenta
  («Narratore: Berta a Viandante»); nessun errore in console. La lobby solo nei test (nessun universo di molti sul disco della preview).
  Suite intera: 1338 su 1338 (105 file) in 184 s al primo giro; nel log un processo figlio di un test è morto per il suo limite di heap
  (~200 MB, un mondo o una sandbox a parte), senza un rosso. Typecheck verde.

### T158 · L'Attore nello studio — `fatto` (`4759b9a`) (dipende da T157, T205)
- Pipeline: claude · stima 3% · approvato · browser · priorità 86
- Step: 26
- Contesto: ogni agente è una squadra nella corona (`archive.ts`), con un gerboa e un cappello (`corona-gerboa-<agente>.xml`, T50), un posto nella Sala del Concilio e una console nella Direzione; l'Attore di T157 non c'è ancora.
- Cosa fare: il suo gerboa con un cappello riconoscibile, il posto al tavolo (i membri seduti diventano nove), la console, lo studio dove sta, i colori e i nomi nei pannelli. Con l'opzione spenta scegli se non compare o resta a riposo come gli altri che non lavorano, e scrivilo.
- Test: quelli di corona e archivio; typecheck e suite intera con i loro turni.
- Browser: col turno `browser`: Sala del Concilio e Direzione, l'Attore c'è e la sala non si scontra; screenshot.
- Quando è fatto: commit su `task/T158`.
- Esito: gerboa dell'Attore (`corona-gerboa-attore.xml`: moschettiere verde acqua piumato, mezza maschera, gorgiera), posto al tavolo accanto al Narratore (nove seduti, nove teletrasporti, nessuna collisione, due verso `persone`), postazione nello Studio dei Personaggi (campo `guest` della stanza, un passo oltre il Narratore; le battute senza file le dice da lì, `pathForFeed`), etichette dei posti con `ofThe`; console, colori e nomi c'erano già da `AGENTS` e ora sono provati. Opzione spenta: resta a riposo, posto e avatar non dipendono dalla configurazione, console vuota perché non lavora; scritto in `docs/architettura-dettagli.md` e `AGENTS.md`, nessun ADR nuovo. Test: `tests/kernel-studio.test.ts`, typecheck, build e suite intera (119 file, 1706 test) verdi prima dell'ultima correzione, che tocca solo `docs/glossario.md` e dopo la quale ho rilanciato `tests/glossario.test.ts` (verde) ma non la suite. Non provato: l'Attore acceso con una battuta vera in browser (simulata con `council.say`; l'opzione accesa solo nel test). Da valutare a parte: `Archive.go` senza file manda lo Scultore in `buildings[0]`, difetto già presente; `docs/glossario-censimento.md` rigenerato porta differenze estranee, lasciato com'era. Sicurezza: nessuna superficie nuova.

### T162 · Integrare T161 — `fatto` (dab503e)
- Pipeline: claude · stima 1% · approvato · priorità 0
- Step: 27
- Contesto: `integra T161` va in conflitto solo in `docs/adr/README.md`: T161 aggiunge la riga dello 0108 dove il base ha aggiunto quella dello 0106. Nasce da T161: `dossier T161`.
- Cosa fare: nel worktree di T162 `git merge task/T161` e tieni tutte e due le righe, in ordine di numero, senza un posto per lo 0107 (lo aggiungerà T159). Nessun numero cambia.
- Test: `npm run typecheck` e la suite intera con i loro turni, col limite normale; nell'esito quanti passano, i rossi che restano rilanciando il file da solo, il tempo della suite e il carico della macchina. Il base ha T128 e T147, che T161 non aveva: è la prima suite con la cache e con loro.
- Browser: non serve.
- Quando è fatto: merge risolto, commit su `task/T162`. L'orchestratore fa `integra T162` e `integra T161`.
- Esito: conflitto solo in `docs/adr/README.md`, tenute le righe dello 0106 e dello 0108, nessun numero cambiato, come previsto. Typecheck verde. Suite: 89 file, 1107 passati e 2 `expected fail` su 1109, nessun rosso, 111,64 s (tests 568,51 s sommati tra i worker), CPU della macchina tra il 45 e l’87 % nei campioni ogni 30 s. Nessun altro cambio; sicurezza: nessuna superficie nuova oltre a quella di T161 (`src/kernel/forms.ts`).

### T165 · Integrare T159 — `fatto`
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 22
- Contesto: `integra T159` e `integra T129` vanno in conflitto solo in `docs/adr/README.md`: T159 aggiunge la riga dello 0107 e il base, nel frattempo, quella dello 0108 di T161. Nasce da T159: `dossier T159`.
- Cosa fare: nel worktree di T165 `git merge task/T159` (porta dentro anche T129) e tieni tutte le righe dell'indice, in ordine di numero. Nessun numero cambia.
- Test: `npm run typecheck` e la suite intera con i loro turni, col limite normale; nell'esito quanti passano, i rossi che restano rilanciando il file da solo, il tempo della suite e il carico della macchina. T159 non aveva la cache delle forme e aveva un rosso per timeout in `tests/referente.test.ts`: di' se con la cache è sparito. Il kit su V-011 (`npm run sicurezza:prove -- --solo V-011`) va rifatto su questo merge; l'esito in un file a parte, senza sovrascriverne altri.
- Browser: non serve.
- Quando è fatto: merge risolto, commit su `task/T165`. L'orchestratore integra T165, T159 e T129, in quest'ordine.
- Esito: `task/T165`, merge in 3f4401a; il solo conflitto era l'indice degli ADR, con tutte le righe in ordine (0106, 0107, 0108); nessun numero cambia. Typecheck verde. Suite intera col limite normale, 105 s (T159 senza cache: 980 s): **90 file, 1117 passati, 2 attesi, 0 rossi**; carico 10% prima e 31% dopo (CPU; RAM libera 18 GB su 32). Il rosso per timeout di `tests/referente.test.ts` è sparito: verde nella suite e da solo in 12 s (8,7 s di test, 5 test), contro i 149 s di T159. Kit: V-011.a ok sul merge (`esiti/2026-11-02-dopo-T165-V-011.json`; il kit scrive `<data>.json`, che non esisteva: niente sovrascritto). Sicurezza: nessuna superficie nuova rispetto a T129.

### T166 · Integrare T130 — `fatto` (dipende da T165)
- Pipeline: claude · stima 3% · approvato · browser · priorità 1
- Step: 22
- Contesto: T130 ha preso l'ADR-0107, riservato ai limiti ai messaggi di T129, e non ha la cache delle forme; tocca `AGENTS.md`, l'indice ADR, il backlog e `docs/sicurezza/registro.md` come T159. Ha corretto due test senza rifare la suite e non ha aperto il browser, ma cambia ciò che il client del giocatore riceve. Nasce da T130: `dossier T130`.
- Cosa fare: nel worktree di T166, con il base aggiornato, `git merge task/T130`. Lo 0107 resta ai limiti ai messaggi; l'ADR di T130 diventa **0109**: file, indice, `AGENTS.md`, `docs/sicurezza/registro.md`, commenti e test che lo citano. Nelle aggiunte nello stesso punto tieni tutte e due. Controlla anche se i file con limiti ai messaggi (`src/session/`) e l'elenco dei campi si toccano: un campo o messaggio nuovo non deve restare fuori dagli elenchi. `.t130msg.txt` non deve stare nel risultato.
- Test: `npm run typecheck` e la suite intera con i loro turni, col limite normale; nell'esito quanti passano, i rossi rilanciando il file da solo, il tempo. Il kit `npm run sicurezza:prove -- --solo V-011,V-012,V-013,V-014`, con la build, esito in un file a parte.
- Browser: col turno `browser`, un universo multigiocatore usa e getta e un viandante che **non** è il master: si entra, si cammina, si vedono terreni, modelli e altri viandanti, il menu delle azioni di una cosa e di una persona funziona; niente errori in console. Poi lobby e galleria delle carte del sito, che leggono `publicFiles`. Un difetto dovuto ai campi tolti si corregge qui; il resto diventa una domanda per l'orchestratore.
- Quando è fatto: commit su `task/T166`. L'orchestratore integra T166 e T130.
- Esito: `task/T166`, merge in 8afba09; conflitti solo in `AGENTS.md` e nell'indice degli ADR. Lo 0107 resta ai limiti ai messaggi, l'ADR di T130 è **0109** (file, indice, `AGENTS.md`, registro, commenti, test e, fuori dal blocco di T166, la prima riga dell'esito di T130 che citava il numero); la regola di T130 in `AGENTS.md` è la **8f**, accanto alla 8e di T129. `.t130msg.txt` non c'è. **Elenchi**: T129 non aggiunge campi né messaggi, T130 non aggiunge messaggi: niente resta fuori da `heavy` né da `files.ts`; i campi di `universe.json` e di `ai` che client, lobby e sito leggono sono tutti in elenco. Typecheck verde. Suite intera col limite normale, 109 s: **91 file, 1132 passati, 0 rossi** (i 2 attesi di prima erano V-012 e V-013, ora chiuse); carico non misurato. Kit `--solo V-011,V-012,V-013,V-014`, con la build: 16 ok, 0 FALLA, 0 errori (`esiti/2026-11-02-dopo-T166-V-011-014.json`; V-013 non ha prove nel kit, la tiene `tests/sicurezza/uscite.test.ts`). **Browser**, server di sviluppo sulla 4866 col turno `browser` (il WebSocket delle sessioni c'è solo lì, non nella preview), universo usa e getta `prova-t166` offline dentro il worktree, poi cancellato; viandanti non master `ospite`, `altra`, `ospite2`: terreni, modelli e altri viandanti si vedono; menu giusti (cartello Leggi, credenza Apri e contenuto che arriva, bacche Raccogli, un altro viandante Parla e Dai, persona Parla, Esamina, Altro…), e la persona risponde. Al client niente `ai`, prompt, bibbia, persone né `persona`/`lore`/`context`; `/universes/…` dà 404. Lobby, galleria delle carte (18 carte) e sessioni leggono `publicFiles` e sono a posto, senza errori della pagina in console. Nessun difetto dovuto ai campi tolti, nessuna correzione al codice. **Limiti della prova**: quella scheda andava a ~2 fotogrammi al secondo, quindi i cammini lunghi li ho fatti con i tasti veri ma facendo girare io `tick` e `frame` a loop di disegno fermo; solo il primo tratto (1,6 caselle) è col loop normale. Il Raccogli sulle bacche è arrivato a «è troppo lontano» e la cosa è sparita dallo specchio: l'ho provato solo da lontano, non ho visto un raccolto riuscito. **Per l'orchestratore**: (1) `describeCard` (`site/carte.ts`) cerca ancora `lore` e `aspetto`, che `publicFiles` non dà più: una carta senza `description` mostra la riga generica; la Fucina la scrive sempre, quindi non si è visto, ma il seme non ha carte con cui misurarlo. (2) `site/sessioni.ts:330` scrive «PORTA 5173» fisso, anche sulla 4866; è di prima, non di T130. (3) Una volta `ospite` è finito dentro il bosco, tutte caselle bloccate attorno, senza correzioni dal server, durante un cammino col mio script mentre il loop era fermo; con `ospite2` non si è ripetuto: non so dire se è solo lo script. Sicurezza: nessuna superficie nuova rispetto a T129 e T130.

### T160 · Ottimizzare i test più lenti della suite — `fatto` (dipende da T151, T161)
- Pipeline: claude · stima 5% · approvato · priorità 2
- Step: 27
- Contesto: richiesta dell'autore (02/11): i tempi di esecuzione della suite sono molto lunghi, va cercato ciò che si può accorciare, anche come in T148 e T151. In T148 un boot del kernel costava ~10 s contro 0,2-0,5 s con le forme già pronte: `tests/between.test.ts` è sceso da 386 s a 39 s con un `InlineRunner` condiviso, passato con `KernelOptions.forms`. Ogni minuto di suite pesa su ogni task, perché la suite ha un turno solo. Nasce da T148, T151 e T91: `dossier T148`, `dossier T151`, `dossier T91`.
- Cosa fare: misura la suite intera con il reporter JSON di Vitest e fai la classifica dei file e dei test per tempo; per i primi file misura dove va il tempo (boot del kernel, tick simulati, attese, `setTimeout` veri, git su disco, build). Poi alleggerisci, dal più lento e finché il guadagno vale il lavoro: il runner condiviso dove i test non si disturbano, un helper comune in `tests/` se lo stesso rimedio serve in più file, meno tick da simulare, attese sostituite da tempi finti, mondi di prova più piccoli, fixture git condivise. `between`, `credits` e `referente` li hanno già visti T148 e T151: toccali solo se sono ancora in testa. Puoi guardare anche la configurazione di Vitest (pool, isolamento), senza superare i 6 worker dei turni. Ogni test continua ad affermare le stesse cose: nessuna asserzione tolta né indebolita, nessuno `skip`, nessun limite alzato, nessun test cancellato. In `tests/sicurezza/` e nei test del determinismo uno stato condiviso non deve nascondere ciò che il test prova: nel dubbio lascia il file com'è e dillo nell'esito. Non cambiare il codice del gioco: la cache delle forme nel kernel la fa T161, e la classifica si misura con quella dentro; togli gli `InlineRunner` condivisi nei test se non servono più.
- Test: la classifica e il tempo totale della suite prima e poi, con il carico della macchina quando li misuri, nelle stesse condizioni per quanto puoi. `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo. Stesso numero di test di prima, a meno di quelli entrati col base.
- Browser: non serve.
- Quando è fatto: il tempo totale della suite è sceso, con la misura, e nell'esito ci sono i file toccati, ciò che guadagna ognuno e i lenti rimasti, con il motivo; commit su `task/T160`.
- Esito: `task/T160`. **Suite (vitest, turno, 6 worker)**: prima 108,9 s (somma dei test 554,9 s; CPU 11 % all'inizio, 44 % alla fine); dopo 90,8 s (455,8 s; CPU 22 % e 11 %), −17 %. **Limite della misura**: i carichi non sono uguali e sono due letture sole, quindi parte del guadagno può venire dalla macchina più scarica; la base non l'ho rifatta. Stessi test: 1119, 1117 passati e 2 `expected fail`, nessun rosso; typecheck verde. **Dove andava il tempo**: `tests/kernel.test.ts` da solo prendeva 103 dei 109 s, quindi faceva da collo di bottiglia per i worker; con le forme di T161 un boot più la pianificazione costa ~1150 ms, di cui ~400 sono `Hills` (il rilievo, due giri per kernel), non coperto da T161; il resto è codice Lua e layout. **File toccati**: `tests/kernel.test.ts` diviso per `describe` in cinque file, con gli aiuti in `tests/world.ts` (verificato: le righe, tolti gli import, sono identiche; 57 test; un file da 103 s, ora 81 s sommati e il più lungo 23 s). `tests/setup/relief-memo.ts`, nuovo, da `setupFiles` in `vite.config.ts`: il rilievo per seme e programma, in memoria e su disco, solo nei test con `vi.mock`, codice del gioco non toccato; un giro da 2 s in su non si tiene, perché può essersi fermato a metà per la scadenza; guadagno per file 1-12 s (tempi nella suite, prima → dopo: `thin` 28,5 → 16,9, `campus` 23,7 → 18,2, `branch` 13,0 → 10,4, `roles` 12,0 → 8,5, `partita` 10,7 → 8,4). `tests/forms-cache.test.ts` 19,1 → 4,4: `expect(a).not.toBe(b)` e `toEqual` facevano in Vitest un confronto profondo su milioni di celle (`not.toBe` lo fa per il messaggio d'errore): ora `=== … toBe(false)` e `Buffer.compare`, stesse affermazioni. `tests/between.test.ts` 24,3 → 17,1, `credits` 7,7 → 7,0, `referente` 10,6 → 8,3: tolti `InlineRunner` e spia su `Kernel.boot`, inutili dopo T161. Commenti che citavano `kernel.test.ts` in `graph`, `roles`, `magic`. Riga in `AGENTS.md` e aggiunta all'ADR-0108. **Stato condiviso**: `tests/relief.test.ts` e `tests/determinism.test.ts` fanno `vi.unmock` e fanno girare il rilievo vero (una riga in più, nessuna asserzione toccata); `tests/sicurezza/` non è toccata e nessun suo file nomina il rilievo. **Provato e scartato**: `--pool=threads` si è bloccato oltre 10 minuti: non hanno finito solo `tests/perf.test.ts` e `tests/sicurezza/uscita.test.ts`; ho fermato la prova, che ha tenuto il turno dei test per 10 minuti, e terminato i processi rimasti. `isolate: false` non provato: gli import pesano 50 s sommati, ma i moduli condivisi tra file (`vi.mock`, cache) rischiano di nascondere ciò che i test provano. `develop` con attese più corte non provato: ~1 s reale contro il rischio di test instabili. **Lenti rimasti**: `tests/abbonamenti.test.ts` 25-36 s, quasi tutti di un solo test, che chiama davvero la CLI di Claude con `model.sculpt` a ogni suite: costa tempo e consumo reale dell'abbonamento, ma toglierlo o saltarlo è fuori dalle regole del task: da decidere per l'autore. `coefficients` 10 s (due camminate che pianificano 36 luoghi: le chiamate contate sono ciò che prova). `forms.test` 8 s (`modelErrors` esegue ogni programma e ne misura il tempo: con la cache non proverebbe nulla). `campus` 18 s, di cui `magia` 7 s: non ho misurato dentro; il test misura i programmi e ne esegue le animazioni. `kernel-*`, `thin`, `between`, `explore` 12-23 s: molti boot da ~0,8 s, di cui il resto è codice del gioco. `sicurezza/saldi` 17 s: git su disco e processi veri, non toccato di proposito. Tolto il collo di bottiglia, il tempo reale è il lavoro totale diviso 6 worker: da qui si scende solo togliendo lavoro. Una cache del rilievo nel kernel (un cambio del gioco, fuori da questo task) varrebbe anche per il server. Sicurezza: nessuna superficie nuova (solo `tests/` e la sezione test di `vite.config.ts`).

### T161 · La cache delle forme nel kernel, condivisa nel processo — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 1
- Step: 27
- Contesto: approvato dall'autore (02/11). Ogni `Kernel.boot` costa ~10 s, quasi tutti in `placeCampus` → `forms.preload`, che riesegue in Node i programmi MarkovJunior della corona; con le forme pronte un boot scende a 0,2-0,5 s (misura di T148). `InlineRunner` (`src/kernel/forms.ts`) ha già una cache, ma per istanza: ogni kernel ne fa una sua. T148 e T151 la condividono a mano nei test con `KernelOptions.forms`. Nasce da T91 e T148: `dossier T91`, `dossier T148`.
- Cosa fare: una cache di `InlineRunner` condivisa tra i kernel dello stesso processo, senza che chi crea un kernel debba fare nulla. Il browser non cambia: lì le forme le fanno i worker. Attenzione a:
  - **La chiave**: oggi non contiene `q.size` e identifica il programma con `hashStr`. Una volta condivisa, deve dire tutto ciò da cui dipende il risultato (`size` compreso) e non può confondere due programmi: sul server girano più universi nello stesso processo, e un universo non deve poter avere la forma di un altro per una collisione. Usa il testo intero o un hash crittografico.
  - **Il tempo**: `runMjx` ha una scadenza. Controlla cosa fa quando scade e che un risultato parziale o un errore non entrino nella cache, e che `q.tempo` non cambi ciò che si tiene.
  - **La condivisione**: nessuno deve poter scrivere su un risultato condiviso. T148 lo ha dedotto dal codice (`instanceGrid` copia); ricontrollalo anche per le `<action>` e per ogni altro punto che riceve `result` o `model`, e affermalo con un test.
  - **La memoria**: un tetto per il server, che vive a lungo (per esempio LRU, per voci e per voxel), con la misura di quanto occupa una corona.
  - **`clear()` e chi lo chiama**: ora che è condivisa, non deve svuotare la cache degli altri kernel per sbaglio; un programma riscritto ha comunque un'altra chiave.
  - **I file di test**: Vitest isola i file, quindi una cache in memoria non passa da un file all'altro e ogni file paga il suo primo boot. Misura quanto resta. Se è ancora la parte più grossa, aggiungi una cache su disco **solo per i test**, attivata dalla configurazione di Vitest (`node_modules/.cache/` o simile, chiave con hash crittografico del programma e la versione del motore, sicura con 6 worker in parallelo). Mai nel gioco né sul server.
  Non toccare `tests/credits.test.ts` e `tests/referente.test.ts` (T151 è in corso) né gli altri test lenti (T160). Scrivi l'ADR se è una decisione che resta: primo numero libero dal 0108.
- Test: test nuovi su: due kernel che condividono le forme, chiavi diverse per `size`, tinta e programma, un risultato che resta uguale dopo l'uso, una scadenza non tenuta, il tetto. `tests/determinism.test.ts` verde. Tempo di un boot, il primo e i successivi, e della suite prima e poi, con il carico della macchina; `npm run typecheck` e la suite intera con i loro turni; nell'esito quanti passano e i rossi che restano rilanciando il file da solo.
- Browser: non serve se non cambia ciò che gira nei worker; se cambia, una prova con `?skip&offline`.
- Quando è fatto: un boot dopo il primo sotto il secondo, misurato; la suite più corta, misurata; commit su `task/T161`. Nell'esito la riga sulla sicurezza (`src/kernel/forms.ts` sta anche sul server).
- Esito: `task/T161`, ADR-0108. `FormCache` e `sharedForms` in `src/kernel/forms.ts`: ogni `InlineRunner` la usa senza che chi crea un kernel faccia nulla. **Chiave** (`formKey`): testo intero, seme, scatola, tinta (un test trova una collisione vera di `hashStr` e la distingue). **Scadenza**: prima un run scaduto restituiva mezzo modello senza errori e finiva nella cache; ora `runForm` dice `finished` e ciò che non ha finito o dà errore non si tiene (ai worker non cambia nulla: ignorano il campo, niente prova nel browser). **Condivisione**: risultati congelati su copie; `cells` non si può congelare, lo scrive solo `act`, sempre sulla copia di `instanceGrid` o sulla griglia dello Scultore; un test fa lavorare un kernel su una porta e confronta. **Tetto**: LRU, 4096 voci e 256 MB; una corona con il mondo iniziale sono 122 voci e 19,3 MB. **`clear()`** tolto da `InlineRunner` (non lo chiamava nessuno). **Disco**: con la sola memoria il primo boot di ogni file restava la parte più grossa, quindi `tests/setup/forms-disk.ts` da `setupFiles` di Vitest, in `node_modules/.cache/quine-forms/<versione del motore>/` (24 MB, 152 file; solo `.form`, nessun file a parte rimasto dopo due giri a 4 worker). Mai nel gioco né sul server. **Boot** (carico 11-13 %): primo 10,6 s, poi 0,25-0,28 s; col disco il primo 0,39 s, poi 0,21-0,22 s. **Suite** (tempo reale di vitest, CPU a inizio e fine): base 862 s, 1083 test (28 % alla fine; a inizio 60 % ma letto 6 minuti prima, in attesa del turno, e altri task giravano forse ancora); sola memoria 254 s, 1083 test (8-22 %); col disco a freddo 133 s, a caldo 115 s, 1100 test (15-30 %). **Limite della misura**: la base non è nelle stesse condizioni, quindi 862 → 115 s gonfia il guadagno per quanto non so dire; il confronto pulito è tra i giri dopo. In più una seconda sessione ha lavorato per errore in questo worktree: alle 04:00 ha tenuto per circa un minuto la sua versione di `setupFiles` in `vite.config.ts`, con forme su disco; la base era già finita, il giro di boot di quel momento l'ho rifatto e i numeri qui sono quelli rifatti. **Il più lento resta `tests/kernel.test.ts`** (112 s): è per T160, non toccato. Nessun test esistente toccato, 17 test nuovi in `tests/forms-cache.test.ts`. **Resta fuori**: `WorkerRunner` nel browser tiene ancora i risultati scaduti e la sua chiave usa `hashStr`; è la cache di un solo giocatore. Sicurezza: una superficie nuova valutata e nessuna voce aggiunta: la cache è condivisa tra universi dello stesso processo, ma la chiave è il testo intero, i risultati non si scrivono e Lua non ci arriva; restano un canale di tempo (dice solo che un testo già noto è stato eseguito) e il riempimento della cache, che costa al più un ricalcolo entro il tetto (ADR-0108).

### T163 · La cache delle forme nel browser non tiene i modelli incompleti — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 60
- Step: 27
- Contesto: richiesta dell'autore (02/11). `WorkerRunner` (`src/render/forms.ts`) mette in memoria e in IndexedDB ogni risposta dei worker, anche quando il programma ha finito il tempo o i passi e il modello è a metà. Da quel momento quel modello resta incompleto a ogni visita, e quanto è andato avanti dipende dalla macchina. In Node non succede più: `InlineRunner` (`src/kernel/forms.ts`) tiene solo i run con `finished` (ADR-0108). Il difetto è dedotto dal codice, non visto nel gioco. Nasce da T161: `dossier T161`.
- Cosa fare: fai arrivare `finished` dal worker (`src/render/worker.ts`) a `WorkerRunner`, anche nel ripiego senza worker; un risultato non finito va a chi l'ha chiesto e non entra né in memoria né in IndexedDB, come in `InlineRunner`. Le voci incomplete già salvate nell'IndexedDB dei giocatori non si riconoscono: scartale una volta (una versione del database o della chiave), senza toccare la cartella dell'universo. Non cambiare l'hash della chiave: è T164. Se chi chiede la stessa forma riparte a ogni frame perché nulla la tiene, evita di rilanciare il programma di continuo e di' nell'esito come.
- Test: un test con un `workerFactory` finto: risposta non finita → `has(key)` falso, niente nello store; risposta finita → in cache; una voce vecchia non viene riusata. `npm run typecheck` e la suite intera con i loro turni, col limite normale.
- Browser: sì, con la procedura di `AGENTS.md`: il mondo si disegna, e a un secondo caricamento i modelli arrivano dalla cache senza errori in console.
- Quando è fatto: commit su `task/T163`, una riga nell'ADR-0108 sul fatto che il browser ora fa come Node. L'esito dice: sicurezza: nessuna superficie nuova, o le voci aggiunte.
- Esito: `task/T163`, aggiunta in ADR-0108. Il worker dice `finished` (`WorkerAnswer`) e `WorkerRunner`, anche nel ripiego senza worker, tiene in memoria e in IndexedDB solo ciò che ha finito; il ripiego non restituisce più `model` e `finished`. Le voci vecchie le butta una volta `FORMS_DB_VERSION` = 2 (l'aggiornamento cancella e rifà lo store). **In più del previsto:** con una scheda vecchia aperta l'aggiornamento resterebbe bloccato e le forme non arriverebbero mai: `onblocked` fa proseguire senza IndexedDB, e `onversionchange` chiude la connessione per non bloccare una versione futura (T164 può servirsene). **Il rilancio a ogni frame non c'è:** `Forms` tiene il suo `Form` per chiave per tutta la partita, un test lo afferma; un modello che non finisce riparte solo a ogni caricamento della pagina, e lì costa di nuovo il suo tempo. Test in `tests/forms-browser-cache.test.ts` (runner con `workerFactory` finto, ripiego, worker vero con `self` finto, IndexedDB finta scritta nel test, solo ciò che lo store tocca: l'aggiornamento vero l'ha provato il browser). **Suite:** il primo giro 2 rossi su 1235 (`determinism.test.ts`, due kernel con `time` diverso dopo `develop`; `sicurezza/mondo.test.ts`, V-007), verdi rilanciando i due file da soli e il secondo giro intero 1235 su 1235: non importano `src/render/`, causa non indagata, sembrano dipendere dal carico. Typecheck verde. **Browser** (build di produzione, `?skip&offline`): un database v1 con una voce finta → versione 2, voce sparita, 147 lavori ai worker, 147 in memoria e in IndexedDB; il mondo si disegna. Secondo caricamento: 0 lavori ai worker, 147 dalla cache, nessun errore in console. Worker vero con un programma che scade (`tempo: 1`): griglia a metà, nessuna voce nuova; lo stesso con tempo largo: una voce. Non provato nel browser: la scheda vecchia che blocca (solo col finto). Sicurezza: nessuna superficie nuova.

### T164 · La chiave della cache delle forme nel browser senza collisioni — `fatto` (dipende da T163)
- Pipeline: claude · stima 3% · approvato · priorità 61
- Step: 27
- Contesto: richiesta dell'autore (02/11): con molti universi e molti modelli può diventare un problema. `formCacheKey` (`src/render/forms.ts`) usa `hashStr(req.xml)`, 32 bit: due programmi diversi con lo stesso modello e lo stesso seme possono dare la stessa chiave, e il secondo prende la forma del primo. Il nome del modello sta nella chiave, quindi l'universo no: due universi dello stesso browser condividono le voci. In Node ADR-0108 ha già tolto `hashStr` (`formKey`, testo intero). Il difetto è dedotto dal codice, non visto nel gioco. Nasce da T161: `dossier T161`.
- Cosa fare: una chiave che due programmi diversi non possono condividere in pratica: il testo intero come `formKey` o un hash forte, a tua scelta, misurando quanto pesano memoria e IndexedDB con i programmi veri del seme. Attento: `has` e `getCached` sono sincroni, un hash asincrono (`crypto.subtle`) non ci sta senza cambiare chi li chiama. Controlla tutti gli usi di `formCacheKey`. Le voci con la chiave vecchia non servono più: non devono restare a occupare spazio. Scrivi nell'esito il rapporto in numeri prima e dopo (lunghezza delle chiavi, tempo di un `run` già in cache). Il limite alla crescita di `memory` e dello store resta fuori: se misurando lo trovi un problema, scrivilo nell'esito.
- Test: due programmi con lo stesso `hashStr` (trovali con una ricerca nel test o costruiscili) danno chiavi diverse e forme diverse; la stessa richiesta dà la stessa chiave. `npm run typecheck` e la suite intera con i loro turni, col limite normale.
- Browser: sì, con la procedura di `AGENTS.md`: il mondo si disegna e al secondo caricamento i modelli arrivano dalla cache, senza errori in console.
- Quando è fatto: commit su `task/T164`, una riga nell'ADR-0108. L'esito dice: sicurezza: nessuna superficie nuova, o le voci aggiunte.
- Esito: `task/T164`, aggiunta in ADR-0108. `formCacheKey` è `formKey` (testo intero, seme, scatola, tinta) più `vpt`, `rig` e `sway`, che cambiano le mesh; è usata solo dentro `WorkerRunner.run`, `has` e `getCached` restano sincroni. Le voci vecchie le butta `FORMS_DB_VERSION` = 3. **Scelta:** testo intero e non un hash forte: `crypto.subtle` è asincrono, e un SHA-256 scritto a mano risparmierebbe 1,8 MB di chiavi accanto a 1,9 GB di risultati. **In più del previsto:** il nome del modello e `tempo` escono dalla chiave, come in Node: un programma sotto due nomi è un risultato solo. **Numeri.** Lunghezza delle chiavi: prima 35-55 caratteri (mediana 42, sui 57 programmi del seme, in Node); dopo, nell'IndexedDB vero, 628-51.659 (mediana 12.684), 1,77 milioni di caratteri per 148 voci (45 programmi diversi). Chiave più `Map.get`: prima 20,7 µs, dopo 8,8 µs (Node, i 57 programmi, 200 giri): `hashStr` scorre tutto il testo in JS a ogni richiesta. Un `run` già in cache con la chiave nuova: 9,1 µs in Node, 3,2 µs nel browser (42 programmi); la chiave vecchia nel browser non l'ho misurata. **Il limite alla crescita è un problema misurato, lasciato fuori come chiesto:** i valori di quelle 148 voci sono 1,86 GB di array (somma di `byteLength` delle voci lette dallo store) e l'IndexedDB dell'origine occupa 528 MB su disco (`storage.estimate`, quota 11 GB), con il solo mondo iniziale di un universo. `memory` tiene gli stessi risultati per tutta la partita, quindi la scheda dovrebbe tenerne altrettanti: è dedotto da quei byte, non ho misurato la memoria della scheda. Le chiavi sono lo 0,1 % di quel peso. Più universi e più modelli sommano e nulla toglie: serve un tetto, da decidere a parte. **Non toccato:** `Forms.get` (`src/kernel/forms.ts`) tiene i `Form` di un kernel sotto `hashStr(xml)`: un modello riscritto con un programma che collide terrebbe la forma vecchia in quel kernel. Vale per un id nello stesso kernel, non tra universi, e non è `formCacheKey`. Anche la cache del browser non dice la versione del motore: un motore cambiato si butta solo alzando `FORMS_DB_VERSION` a mano. **Test** in `tests/forms-browser-cache.test.ts`: due programmi con lo stesso `hashStr` e colori diversi, trovati nel test, danno chiavi e forme diverse; stessa richiesta, stessa chiave; due universi con lo stesso nome di modello non condividono la voce; le chiavi vecchie non restano nello store. **Suite:** il primo giro 1 rosso su 1304 (`sicurezza/produzione.test.ts`, V-006, scaduti i 30 s dell'ingresso di bruno), che non importa `src/render/forms`; verde il file da solo (27 su 27) e il secondo giro intero, 1304 su 1304: sembra dipendere dal carico, causa non indagata. Typecheck verde. **Browser** (build di produzione, `?skip&offline`): un database v2 con una voce sotto la chiave vecchia → versione 3, nessuna chiave vecchia; 148 voci; il mondo si disegna. Secondo caricamento: 0 lavori ai worker, 145 dalla cache, nessun errore in console (il primo giro ne ha una in più del solito, e il secondo ne chiede meno, perché una mia misura aveva chiesto modelli non ancora in cache). Sicurezza: nessuna superficie nuova.

### T174 · Il timeout di `produzione.test.ts` nella suite intera: la causa — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 20
- Step: 27
- Contesto: nasce da T172 e T164 (`dossier T172`, `dossier T164`): in `tests/sicurezza/produzione.test.ts` scadono i 30 s dell'attesa dell'ingresso («ingresso di bruno» in T172, V-006 in T164), solo al primo giro della suite, verde da solo. Due volte su suite diverse: «carico» è una deduzione, non una misura. T163 aveva visto rossi simili in `determinism.test.ts` e `sicurezza/mondo.test.ts`. Conta per T45f: l'ingresso nel mondo di molti è il percorso che lì deve reggere.
- Cosa fare: riproducilo (la suite intera col suo turno, o il file insieme a un carico misurato) e di' cosa occupa quei 30 s: la macchina, il primo avvio del mondo (build del programma, forme senza cache) o un'attesa persa nel server. Se è un difetto del server, correggilo; se è il test, che aspetti ciò che deve senza alzare il limite alla cieca. Non cambiare il comportamento del gioco.
- Test: il file verde nella suite intera per due giri di fila; se non si riproduce, scrivi quanti giri hai fatto e cosa hai aggiunto per vedere la causa la prossima volta.
- Browser: non serve.
- Quando è fatto: commit su `task/T174`; l'esito dice la causa misurata o che non è stata trovata, e: sicurezza: nessuna superficie nuova, o le voci aggiunte.
- Esito: `task/T174`. **Causa misurata: il test, non la macchina né il server.** In V-006 il socket di bruno si apriva insieme a quello di alice e taceva finché alice non era dentro. Da T172 (ADR-0114) un socket ha 15 s (`ENTRY_MS`) per dire `entra`: se il mondo che alice avvia ne impiega di più, il server chiude bruno con `rifiuto` «nessun ingresso» (voluto, V-026). Il `ws.send` del test su un socket chiuso non dice nulla, e i 30 s passavano aspettando una risposta a un messaggio mai partito: nessuno li occupa. **Misure** (`-t "V-006 una partita"`): file da solo, alice dentro a 11,4 s, bruno 263 ms dopo il suo `entra`: margine di 3,6 s sui 15. Con 24 thread che girano a vuoto su 12 processori logici: rifiuto a 15,07 s, alice a 52,7 s, stesso rosso «ingresso di bruno». Il carico fa solo superare i 15 s all'avvio del mondo, e il primo giro della suite è il più lento. Dopo la correzione, stesso carico: alice 54,4 s, bruno 245 ms, verde. Non ho separato cosa compone gli 11,4 s dell'avvio. **Cambiato solo `tests/sicurezza/produzione.test.ts`:** il socket del secondo giocatore si apre dopo l'ingresso del primo, in V-006 e in V-021 (dove carla avvia il mondo se il file gira filtrato); il limite resta 30 s. Per vedere la causa la prossima volta: `say` su un socket chiuso getta l'errore con il rifiuto ricevuto, e `entered` dice subito un rifiuto invece di aspettare la scadenza. **Server e gioco non cambiano:** il client vero manda `entra` appena il socket si apre (`socket.ts`, `client.ts`), dopo il login, quindi non cade qui. **Resta aperto, non toccato:** (1) i rossi di T163 non hanno questa causa: non passano da questa attesa, e `determinism.test.ts` è stato verde sotto carico nell'unico giro in cui l'ho provato. `mondo.test.ts` sotto i 24 thread dà rossi: V-007 «muore due volte» e «un mondo bloccato» al primo giro; il primo dei due aspetta 1,5 s fissi prima che un commit sia «vissuto», dedotto che sia troppo poco, non misurato. Il secondo giro di `mondo.test.ts` (7 rossi) non vale come misura: i mondi uscivano con `0xC000026B`, lo stesso codice dei `fork` di bash, perché Windows non creava più processi con il mio carico addosso. (2) In un giro sotto carico `produzione.test.ts` ha passato tutti i 27 test ma ha dato un errore a livello di `il server vero`, forse un hook di chiusura; l'output era filtrato e non ho l'errore; nel giro dopo, sotto lo stesso carico, non si è ripetuto. **Test:** suite intera verde due giri di fila, 1317 su 1317 (200 s e 173 s), typecheck verde; quei due giri non avevano la cache fredda né il carico: la prova della correzione è il giro sotto carico. Sicurezza: nessuna superficie nuova.

### T175 · Un tetto alla cache delle forme nel browser — `fatto` (`c213912`) (dipende da T205)
- Pipeline: claude · stima 4% · approvato · browser · priorità 55
- Step: 27
- Contesto: nasce da T164 (`dossier T164`): il solo mondo iniziale pesa 1,86 GB di array e 528 MB su disco, più universi si sommano e nulla toglie voci. La memoria della scheda è dedotta da quei byte, non misurata. In Node la cache ha già un tetto (ADR-0108: LRU, 4096 voci, 256 MB).
- Cosa fare: misura prima la memoria vera della scheda nel mondo iniziale. Poi un tetto sia in memoria (`WorkerRunner`, `src/render/forms.ts`) sia in IndexedDB, usando l'LRU e togliendo le voci meno usate, con i numeri scelti da quella misura e scritti nell'ADR-0108. Una forma tolta si rifà nei worker: mai un modello che manca. Controlla anche se il `memory` deve tenere gli array quando le mesh sono già fatte.
- Test: oltre il tetto escono le voci meno usate, una forma tolta torna, la stessa richiesta dà la stessa forma.
- Browser: sì, con la procedura di `AGENTS.md`: memoria prima e dopo, il mondo si disegna, secondo caricamento senza errori in console.
- Quando è fatto: commit su `task/T175`; l'esito dice memoria e disco prima e dopo, e quanti lavori ai worker al secondo caricamento. Sicurezza: nessuna superficie nuova, o le voci aggiunte.
- Esito: tetto alla cache delle forme su tre piani (`WorkerRunner.memory` 128 MB LRU, geometrie non disegnate 128 MB con `trimGeometries`, IndexedDB 4 GB di array LRU con archivio `uses`, `FORMS_DB_VERSION` 4), numeri nell'ADR-0108; una forma tolta perde solo le mesh (`meshesGone`) e torna con `Form.remake`; le firme delle entità guardano `geoOf`; in più del previsto l'anello della corona, non rivelato da 60 s, si toglie, e si ricostruisce al più una volta al secondo. Memoria della scheda da 2445 a 345 MB, heap da 1818 a 157 MB; disco da 504 a 512 MB (il mondo sta sotto il tetto); 0 lavori ai worker al secondo caricamento su 147 forme. Prezzo: arrivare alla corona richiede 12-15 s con i blocchi al neon, misurati a circa 1,5 frame al secondo; con la corona in scena 1,6 GB. Il `memory` non deve tenere gli array quando le mesh sono fatte, ma non costa doppio: sono gli stessi oggetti; non si liberano dopo il caricamento su GPU perché il campus li rilegge e servono dopo una perdita del contesto. Suite 108 file/1467 test verde (la riga «heap out of memory» nel log è il processo a 200 MB di `tests/sicurezza/mondo.test.ts`, T210), typecheck verde. Da fare a parte: ogni caricamento legge da IndexedDB tutti gli 1,77 GB per usarne 49 MB (griglie e mesh in due archivi); la scheda di verifica girava a circa 1,5 frame al secondo, causa non accertata, senza confronto col codice di prima. Non provato: superamento del tetto su disco in un browser vero (solo test con IndexedDB finto), multigiocatore, un universo diverso dal seme. Attenzione a misurare: `usedJSHeapSize` conta la pagina precedente se si ricarica nella stessa scheda. Sicurezza: nessuna superficie nuova.

### T176 · `mondo.test.ts` rosso sotto carico: la causa — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 21
- Step: 27
- Contesto: nasce da T174 e T163 (`dossier T174`, `dossier T163`), approvato dall'autore il 02/11. In `tests/sicurezza/mondo.test.ts`, con 24 thread a vuoto su 12 processori logici, sono rossi al primo giro V-007 «muore due volte» e «un mondo bloccato». Il primo aspetta 1,5 s fissi prima che un commit sia «vissuto»: che siano troppo pochi è una deduzione di T174, non una misura. T163 aveva visto `mondo.test.ts` rosso nella suite intera. Conta per T45f: il sorvegliante dei mondi è ciò che lì deve reggere. Un giro di T174 con 7 rossi non vale come misura: i mondi uscivano con `0xC000026B` perché Windows non creava più processi con quel carico.
- Cosa fare: riproduci con un carico misurato che lasci creare i processi (se un mondo esce con `0xC000026B` il giro non conta, abbassa il carico), e di' per ciascuno dei due test cosa occupa il tempo. Se è il test, che aspetti ciò che deve invece di un tempo fisso, senza alzare i limiti alla cieca. Se è il sorvegliante (`server/worldHost.ts`), per esempio un mondo sano ucciso perché tace sotto carico, non correggere da solo se cambia il comportamento: scrivilo nell'esito con la misura e la proposta. Guarda anche, senza filtrare l'output, se torna l'errore a livello del blocco `il server vero` di `produzione.test.ts` visto una volta da T174: se non torna, scrivi quanti giri hai fatto.
- Test: `mondo.test.ts` verde sotto lo stesso carico che lo faceva rosso, e nella suite intera per due giri di fila; se non si riproduce, scrivi quanti giri hai fatto e con quale carico.
- Browser: non serve.
- Quando è fatto: commit su `task/T176`; l'esito dice la causa misurata di ciascun test o che non è stata trovata, e: sicurezza: nessuna superficie nuova, o le voci aggiunte.
- Esito: `task/T176`. **Carico:** 24 thread a vuoto su 12 processori logici (`fork` da 50 ms a ~1,1 s, ritardo di un timer: 99° percentile ~150 ms); nessun mondo è uscito con `0xC000026B`, tutti i giri valgono. **I due test sono stati provati entrambi, e nessuno dei rossi è un difetto del sorvegliante con i suoi tempi di produzione.** **«Muore due volte» (rosso 6 giri su 6 sotto carico; verde nei 2 in cui il carico è finito durante il giro):** la deduzione di T174 è sbagliata: dopo 1,5 s il commit è già «vissuto» in 8 giri su 8. Il rosso viene dopo: il test ha `healthy: 150` ms, `healthy` si conta dal `fork` (`markGood`), e il mondo ripartito impiega 650-1350 ms ad aprirsi: al primo sguardo le morti si azzerano (`riparte (1)` due volte), la seconda morte conta 1 e non torna al commit vissuto. **«Un mondo bloccato»: i test con quel nome sono due; T174 non dice quale.** Quello col mondo finto non è mai rosso: 16 ripetizioni a 24 thread, 6 a 48, 6 a 96 (avviso ~0,4 s, ripartito 2,7-5,7 s, un solo riavvio). Quello con i mondi veri è rosso, per scadenza dei 180 s, e con lui V-011 V-012: un mondo vero si apre in 12 s a vuoto e in ~90 s sotto carico (tre misure: 88,6-90,2 s). Fasi: a vuoto 0,6 s di caricamento e kernel, 11,2 s di forme; sotto carico 7,8 s e 84 s: i programmi del campus con la cache vuota. Il test dava 60 s (`FAST.boot`): ucciso in apertura, ripartito, di nuovo ucciso. **Cambiati solo i test.** «Muore due volte» aspetta che un commit sia vissuto (`good`) invece di 1,5 s e poi alza `healthy`. I mondi veri hanno i tempi misurati: apertura, avviso e chiamate quelli di `WORLD_TIMES`, uccisione a 20 s (il silenzio massimo di un mondo aperto è 5,5 s sotto carico; era 8 s), limite di ogni test ricavato dalle aperture che fa (`opening`): 298 s il più lungo sotto carico, oltre i 180 di prima. **`produzione.test.ts`, l'errore a livello di `il server vero` è tornato, 1 giro su 2 sotto carico:** `EBUSY: rmdir …\universes\prova` nell'`afterAll`, con tutti i 27 test verdi. Causa: l'ultimo salvataggio del mondo era ancora un `git commit` in corso in quella cartella (`HEAD.lock`, `refs/heads/master.lock` e l'indice preparato, tutti di quel secondo): `stop()` non aspetta il git già partito e Windows non rimuove la cartella di lavoro di un processo. Corretto nel test (`fixtures/removeWhenFree.ts`, anche in `mondo.test.ts`); dopo, 0 su 3 sotto carico: pochi giri per dirlo da soli, la correzione regge perché riprova finché la cartella è libera. **Il sorvegliante, due cose da decidere, non toccate perché cambiano il comportamento:** (1) `healthy` conta anche l'apertura: con i tempi di produzione (60 s) un mondo che impiega 90 s ad aprirsi ha le morti azzerate al primo sguardo; se muore appena aperto per un commit cattivo non torna mai all'ultimo vissuto e non si arrende, riparte per sempre, 90 s di processore ogni volta. Misurato in scala col test (150 ms contro 1 s), non provato con i 60 s veri. Proposta: contare `healthy` da `pronto`, una riga in `heard`/`markGood`, con un test. (2) `stop()` lascia il `git commit` a metà: i lock restano se il processo viene interrotto (qui è successo, non so da chi: il repository lasciato li aveva) e un lock rimasto può fermare i commit dopo; in produzione `serve.ts` fa `process.exit` subito dopo `stop()`, non l'ho provato. Proposta: il negozio tiene il conto dei git in corso e `stop()` li aspetta. **Per T45f, con i tempi di produzione:** nessun mondo sano ucciso: silenzio massimo 5,5 s contro i 45 di `kill`; sopra i 5 s di `notice`, quindi sotto questo carico i client possono leggere «il mondo si è fermato» per poco. L'apertura ha margine di 2× sui 180 s di `boot`: un carico doppio la porterebbe a quattro uccisioni e alla resa. **Test:** `mondo.test.ts` sotto il carico 15 su 15, due giri (il secondo sul codice finale; ~1100 s l'uno), `produzione.test.ts` 27 su 27, tre giri; suite intera verde due giri di fila sul codice finale, 1357 su 1357 (202 s e 189 s), typecheck verde. Sicurezza: nessuna superficie nuova.

## Dalla chat del 03/11/2026 (testo originale: `docs/userchats/to-do-2026-11-03.md`)

### T177 · Il disco C: si riempie: chi scrive, e i residui dei test — `fatto`
- Pipeline: claude · stima 2% · approvato · priorità 19
- Step: 27
- Contesto: richiesta 5 dell'autore: svuotati 30 GB la settimana scorsa, di nuovo pieno; il progetto è su H:. Misurato dall'orchestratore il 02/11 alle 23:20 UTC: C: 196 GB, liberi 12 (95 %). In `%TEMP%` 6038 voci, circa 2400 `coda-*` e 2400 `quine-*` (`quine-turni`, `quine-ferma`, `quine-traccia`), 1147 delle `quine-*` nate il solo 02/11: test e strumenti non le tolgono (da verificare in `tests/pipeline.test.ts`, `tests/subscription.test.ts`, `tests/abbonamenti.test.ts`, `tests/sicurezza/*`). Pesano poco una per una (6-22 KB, ma `quine-t43c-*` 49 MB), quindi **non è detto che spieghino i 30 GB**. `~/.claude` 643 MB, `ms-playwright` 645 MB. Non misurati: il totale di `%TEMP%` (contarlo è lento), i profili di Chrome, le cache di npm e dei browser, ciò che è fuori dal profilo utente.
- Cosa fare: (1) in sola lettura, le cartelle che pesano di più su C:, con le date; la crescita misurata su un intervallo, se si può; chi le scrive, con le prove: l'autore ha ipotizzato git, va verificato. Il gioco può non c'entrare: se è così, dillo. (2) Correggi ciò che è del progetto: test e strumenti tolgono le cartelle temporanee che creano. (3) **Non cancellare nulla su C: fuori da ciò che crea il tuo giro**: nell'esito l'elenco di ciò che si può togliere, quanto libera e il comando; decide l'autore.
- Test: la suite non lascia nuove voci in `%TEMP%` (conteggio prima e dopo, un giro col suo turno); typecheck.
- Browser: non serve.
- Quando è fatto: commit su `task/T177`; l'esito dice chi riempie il disco, misurato o no, e quanti GB al giorno.
- Esito: `task/T177`, aggiunta in ADR-0108. **Chi riempie C: (misurato il 03/11, scansione di tutti i file di C:, 187,7 GB visti su 197,5 usati): il gioco.** La cache delle forme in IndexedDB (`IdbFormStore`, nata con T64 il 29/10) è per origine e l'origine ha la porta: ogni verifica nel browser su una porta libera, nel profilo vero di Chrome, lasciava circa 0,5 GB in `ChromeUser DataDefaultIndexedDB`, per sempre. 31 origini locali e 14,8 GB in quattro giorni, per data dell'ultima scrittura: 30/10 1,5 GB, 31/10 2,4, 01/11 3,4, 02/11 7,5. Provato con un giro: 410 MB dopo 12 s su una porta nuova con la cache accesa. **Git no:** nessuna sua cartella tra chi scrive su C:. **I residui dei test nemmeno:** `coda-*` 2423 voci e meno di 1 MB, `quine-*` 2383 voci e 57 MB (49 MB sono due `quine-t43c`). Il resto degli ultimi 7 giorni su C: è di altri: aggiornamento di Office 2,5 GB, Windows 4,5, `.geminiantigravity-iderowser_recordings` 1,8, installazione di Visual Studio in `Temp	2ngxpaa` 2,6, npm-cache 1,2. Non misurato: i 10 GB non leggibili senza amministratore (`System Volume Information`, punti di ripristino). Una crescita su un intervallo non c'è: tra le 23:32 e le 01:02 UTC lo spazio libero è rimasto a 12,4-12,5 GB, senza verifiche nel browser; i GB al giorno vengono dalle date dei file. **In più del previsto:** `keepsFormsOnDisk` in `src/render/forms.ts`: su questa macchina IndexedDB delle forme solo sulle porte 5173 e 4173 o con `?formecache`; altrove memoria. Il sito non cambia. **I test:** `tests/setup/suite-temp.ts` (`globalSetup`) dà a ogni giro una cartella temporanea sola, ereditata da worker e processi figli, tolta alla fine; quelle di un giro ucciso le toglie il giro dopo, solo se il suo processo è finito. Gli strumenti (`servi.ts`, `lab/banco/claude.ts`, `tools/sicurezza`) le toglievano già. Giro intero con `TEMP` puntato su una cartella osservata: resta solo `node-compile-cache`, la cache unica di Vite, 44 MB, già in `%TEMP%`. **Browser** (non chiesto, ma il cambio è lì): porta 4977, `?skip&offline`: il mondo si disegna, nessun database `rune-forms`, spazio occupato 0 MB; con `?formecache` il database c'è e pesa 410 MB, cancellato alla fine. Gli errori in console sono dell'estensione del browser. Nulla di C: toccato oltre ai file temporanei di questo giro. Sicurezza: nessuna superficie nuova.

### T178 · Il glossario: un nome per ogni concetto — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 22
- Step: 24
- Contesto: richiesta 2 dell'autore: una nomenclatura ufficiale, gli stessi concetti chiamati allo stesso modo, nel codice in inglese. Oggi si mescolano italiano e inglese e nomi diversi per la stessa cosa (esempi da verificare: `struttura`/`structure`/`edificio`, `luogo`/`chunk`/`place`, `viandante`/`wanderer`/`player`, `modello`/`programma`/`forma`, `cose`/`entità`, `master`/`dio`).
- Cosa fare: `docs/glossario.md`: per ogni concetto il nome ufficiale in italiano (documenti, UI, prompt), quello in inglese (codice), una definizione di una riga, dove vive, i sinonimi da non usare. Il censimento viene da `AGENTS.md`, `docs/adr/`, `src/`, `server/`, `universe/prompts/` e conta le occorrenze dei sinonimi. Attenzione a ciò che non si rinomina senza migrazione: campi JSON degli universi, messaggi del protocollo, API Lua, nomi nel validatore. Una regola in `AGENTS.md` (Convenzioni) e un ADR. **Nessuna rinomina nel codice in questo task**: nell'esito le rinomine proposte, a gruppi, ciascuna con quanti file tocca e se chiede una migrazione. Ne nasceranno task quando l'autore avrà letto il glossario, da eseguire con pochi task in corso, perché vanno in conflitto con tutti.
- Test: un test che controlla che ogni voce abbia i suoi campi e che i nomi in inglese citati esistano in `src/` o `server/`. Typecheck e suite con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T178`; l'esito dice le scelte dubbie, da far decidere all'autore.
- Esito: `docs/glossario.md` (121 voci), censimento rigenerabile (`tools/glossario/glossario.mjs`, `docs/glossario-censimento.md`), `tests/glossario.test.ts`, regola in `AGENTS.md`, ADR-0117. Rispetto al previsto: oltre ai sinonimi un elenco degli **omonimi**, il problema più grosso (due `Building`, `model` anche per Gemini, «reame» per due cose). Nessuna rinomina. Le 8 scelte dubbie e le rinomine R1-R15 sono in fondo al glossario; ne nasceranno task quando l'autore le avrà lette.

### T179 · La traccia di un programma MarkovJunior, in testo — `fatto`
- Pipeline: claude · stima 3% · approvato · priorità 23
- Step: 23
- Contesto: richiesta 1 dell'autore, primo pezzo. I modelli di T155 e T173 sono belli ma statici, e chi li scrive vede solo il risultato (foto dai quattro lati). Non può capire cosa fanno `one all prl convolution path` passo per passo, come fa l'autore nell'editor andando avanti e indietro tra i fotogrammi; così non sa usare i pattern dei programmi migliori. Le immagini costano: il debug intermedio va in testo. Il risultato finale resta giudicato con le foto, come oggi. Si riusa: `src/mj/engine.ts`, `lab/scripts/mjx-trial.ts`, `mjx-stats.ts`, `lab/banco/` (leggi `dossier T154`, `dossier T173`), le sezioni del laboratorio, l'editor `/lab/editor/`.
- Cosa fare: uno strumento che, dati XML e seme, dà una traccia leggibile da un modello: per ogni nodo eseguito il tipo, la regola, quante volte e quante celle ha cambiato, la scatola di ciò che ha cambiato; le sezioni di un fotogramma scelto, coi simboli MJ al posto dei voxel. Confronta tre forme sugli stessi programmi, in token e in ciò che fanno capire: (a) sezioni in simboli, (b) solo le differenze tra nodi, (c) la proposta dell'autore: il fotogramma come modello statico con i voxel raggruppati in scatole. Scegli la predefinita, con un tetto di token e una compressione (fotogrammi vicini, piani uguali), e scrivi i numeri. Lo strumento non cambia il risultato del motore. Il banco deve poterla mettere nella seconda richiesta (`lab/banco/seconda.ts`).
- Test: su XML fissi la traccia dice i nodi e le celle giuste per ogni tipo di nodo; griglia identica con e senza traccia; tetto rispettato. Typecheck e suite con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T179`; nell'esito la forma scelta e i token su uno dei modelli di `lab/banco/conferma/`. Se tocca `src/mj/`: ADR.
- Esito: `task/T179`, ADR-0117, numeri in `lab/banco/traccia.md`. `src/mj/trace.ts` sul motore vero, osservato (`RunOptions.watch`), `lab/scripts/mjx-trace.ts`, `banco-strutture --seconda --traccia`. **Forma predefinita: (b) le differenze fra nodi, tetto 4000 token stimati.** Su `conferma/moderna/1`: 3799 stimati, 3405 reali, 5114 caratteri; rocca 2893 stimati. Senza tetto, su moderna: (a) sezioni 421889 grezze e 18139 piegate, (c) scatole 3892, (b) la traccia intera 9831. (c), la proposta dell'autore, è la più corta sui programmi di `box` e la più lunga su quelli di regole (OddScale3D 62702, contro 1549 di (b)): resta per guardare un fotogramma. **Prova cieca** con Sonnet, due programmi, un seme, 12 domande: nodi 9, (a) 8, (b) 10, (c) 10, senza traccia 0; solo (b) dice «quando» cambia una crescita. Campione piccolo, giudice uno, e la riga dei conteggi finali è stata aggiunta dopo aver visto la domanda. **Rispetto al previsto:** la prima stima dei token stava sotto il reale (il reale il 20-36 % in più): scalata con `TOKEN_SCALE`, ora sopra del 5-25 % sulle 8 misure. Tutti i modelli di `conferma/` sono centinaia di `box`: lì la traccia dice poco più dell'XML, servirà a T181 e T182. **Non provato:** `--seconda --traccia` con una chiamata vera (provati il testo e la traccia di un modello del banco); se la traccia fa scrivere programmi migliori. Sicurezza: nessuna superficie nuova (il motore non cambia risultato, il gioco non importa `trace.ts`).

### T180 · Il banco misura varianza e scala — `fatto` (`d3864f2`)
- Pipeline: claude · stima 3% · approvato · priorità 24
- Step: 30
- Contesto: richiesta 1, secondo pezzo. Il banco di T154 prova un seme in una scatola sola: premia i modelli statici. L'autore vuole lo stesso programma per più semi e più taglie: un forte enorme e uno gargantuesco possono condividere il programma e differire nell'area di generazione; architetture diverse da seme a seme, per gli edifici grandi anche il perimetro esterno. Taglie: ADR-0092, `boxOf`, `sizeFor` in `src/kernel/forms.ts`.
- Cosa fare: (1) le misure di varianza fra almeno 5 semi: quota di voxel diversi, pianta e perimetro diversi, piani e stanze diversi; il solo rumore di colore non conta come varianza. (2) La prova di scala: lo stesso programma in almeno 2 taglie; tutte le misure di oggi (piani, stanze, rampe, porta, `FORM_LIMITS`) devono passare a ogni seme e a ogni taglia. (3) La misura di partenza sui modelli di `lab/banco/finale` e `lab/banco/conferma`: l'osservazione dell'autore, statici, con il numero. (4) La soglia proposta, scritta nel README del banco, con i criteri delle foto (un foglio di contatto a basso costo: un solo PNG con i semi). (5) Cosa fa oggi il gioco: un programma può già servire due taglie? Come si nomina nella libreria (`struttura-<concetto>`, `ModelInfo.taglia`)? Se manca qualcosa, descrivilo nell'esito: non correggerlo qui, lo farà T156.
- Test: offline, su XML fissi: un modello statico è riconosciuto come tale, uno che varia no, uno che si rompe a una taglia è bocciato. Typecheck e suite con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T180`; nell'esito la misura di partenza, la soglia, il costo in tempo del banco con più semi.
- Esito: il banco prova ogni programma con 5 semi e 2+ taglie (`lab/banco/varianza.ts`, `lab/scripts/banco-varianza.ts`, `--varianza`), con foglio di contatto in un PNG, soglia e criteri nel README, partenza in `lab/banco/varianza/riepilogo.md`. Partenza: 31 su 31 statici (voxel 0,00; 2 su 33 rifiutati), dei 27 per Grande 25 reggono alla loro taglia, 2 a Enorme, 1 a Gargantuesca; rocche a Gargantuesca 0 su 4. Soglia proposta: voxel ≥ 0,20, pianta ≥ 0,15, perimetro ≥ 0,15 (classe grande), interno ≥ 0,35, ≥ 2 liste diverse di piani o stanze, architetture ≥ 3 su 5. Costo: circa 4 s a programma contro 0,4 s (a regole fino a circa 15 s), nessun token. Manca nel gioco, per T156: seme delle strutture sempre 1, id senza taglia, `ModelInfo.taglia` una per voce, `size` scritta dallo Scultore che prevale, Enorme e Gargantuesca con la stessa griglia 120 × 120 × 96 (tetto da decidere), `<box>` assoluti e `checkProgram` su una taglia sola. Non provato: che un edificio vero regga e vari insieme; soglia tarata solo su programmi del seme e XML di prova. Sicurezza: nessuna superficie nuova (solo `lab/`).

### T181 · I pattern di MarkovJunior e il metodo del cantiere: programmi di riferimento — `fatto` (`11a973c`) (dipende da T179, T180, T205)
- Pipeline: fable · stima 10% · approvato · priorità 25
- Step: 30
- Contesto: richiesta 1, terzo pezzo, il più difficile: **il risultato di oggi è la qualità voluta, ma da un programma che genera architetture diverse.** L'autore chiede di basarsi sui programmi del [repository di MarkovJunior](https://github.com/mxgmn/MarkovJunior) (nel laboratorio ci sono 16 modelli 3D ufficiali; gli altri si scaricano in `lab/`, con la licenza e la fonte) e propone il metodo del **cantiere** per gli edifici grandi, perimetro compreso. Esempio suo, palazzina moderna: lo scheletro di metallo; il cemento armato attorno a colonne e righe; i piani, pavimenti riempiti con una regola `all`; le scale: i pavimenti aperti nello stesso punto a tutti i piani, tolti N incroci dello scheletro, poi scale, raccordi, una rampa; l'ascensore; e così via. Non va imitata l'edilizia troppo alla lettera: si possono usare marcatori temporanei o riempire l'intero edificio di «materiale» per discriminare una regola successiva, come fa l'autore nell'editor. Dell'edilizia si prende ciò che aiuta a generare invece di disegnare.
- Cosa fare: (1) con la traccia di T179, leggi i programmi ufficiali che fanno crescere strutture e scrivi `lab/banco/pattern.md`: per ogni pattern cosa fa, il frammento minimo, il programma da cui viene, cosa dà per varianza e scala (crescita di corridoi e stanze, divisione dello spazio, `path` per collegare, `convolution`, marcatori, `map` per cambiare scala). (2) Scrivi a mano, con quel metodo, almeno 3 programmi di riferimento di stile diverso (una palazzina moderna, un forte per due taglie, uno a scelta tra i bersagli): passano la soglia di T180 a ogni seme e taglia e tutte le regole del gioco (rampe, piani, porte, `FORM_LIMITS`). La qualità di riferimento sono le foto di `lab/banco/conferma/`. Se un pattern non si può esprimere col motore, dillo. Fogli di contatto nel commit, per l'autore.
- Test: i programmi girano nel motore del gioco e passano `src/mj/check.ts` e il banco. Typecheck e suite con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T181`; nell'esito token di pattern e programmi, cosa non si riesce a fare, la varianza contro la misura di partenza. Se a un terzo della stima nemmeno un programma arriva alla soglia: fermati e scrivi in `docs/pipeline/domande/T181.md`.
- Esito: `lab/banco/pattern.md` (12 pattern, 10 328 token) e tre programmi di riferimento in `lab/banco/riferimento/` (palazzina 46 nodi/16 291 token, forte 58/16 121, tempio 36/9 982) che reggono tutte le misure a 5 semi e 2 taglie (partenza: 31/31 statici, 1/27 a Enorme); palazzina e forte variano oltre la soglia di T180 (perimetro 0,21-0,37), il tempio no nel perimetro (0,00: il lotto da 100 non lascia spazio); 22 programmi del repository in `lab/mjx/official/riferimento/` con licenza; test `lab/tests/riferimento.test.ts`; suite 112 file/1508 test e typecheck verdi; non provati nel gioco (T156) né giudicati sulle foto dall'autore; sicurezza: nessuna superficie nuova (solo `lab/`).

### T182 · Il prompt procedurale delle strutture — `fatto` (`1d8a959`, chiuso dall'autore il 04/11 con la soglia delle foto non raggiunta) (dipende da T181)
- Pipeline: claude · stima 8% · approvato · priorità 26
- Step: 30
- Contesto: richiesta 1, quarto pezzo: portare nel prompt del banco (`lab/banco/prompt.md`) i pattern di T181, senza perdere la qualità raggiunta. Oggi un programma costa 57-60 mila token di output: un giro di 14 tentativi ~20 dollari a listino e un pezzo del limite delle 5 ore (T155: 114 dollari). Metodo come T155: si corregge il prompt, mai il risultato.
- Cosa fare: ciclo sul banco con la soglia di T180 e con misure e foto di prima; ogni richiesta successiva alla prima porta la traccia di T179 in testo, le foto solo per il risultato finale. Decidi se i programmi di riferimento entrano come esempi: ogni esempio si guadagna i suoi token. **Al più 4 giri**: oltre, `docs/pipeline/domande/T182.md`, senza abbassare la soglia. Diario in `lab/banco/diario.md`.
- Test: i modelli finali girano nel motore e passano i controlli. Typecheck col suo turno.
- Browser: non serve; i fogli di contatto restano nel commit.
- Quando è fatto: commit su `task/T182`; nell'esito token, costo per modello, quanti giri, soglia sì o no.
- Esito: prompt procedurale con lo scheletro `riferimento/cantiere.xml` (pattern 13 in `pattern.md`, banco con semi e taglie, traccia nella seconda richiesta): 3 giri su 4; soglia NO: misure e varianza 10/12 entro due richieste (7 alla prima; 5 semi, 2 taglie, partenza 31/31 statici), foto 0/10 per giudizio mio (interni vuoti, salti su casse, meno ricchi di `conferma`), locanda esclusa dal giro 3 perché la cantina non regge due taglie con un programma solo; costo per modello alla prima richiesta: input 10 968, output 55 423, 1,15 $ (T173: 3 791, 60 553, 1,22 $), seconda richiesta 0,43-1,28 $, totale 30,59 $ su 27 chiamate misurate più 2 senza conto; non provato nel gioco (T156) né giudicato dall'autore; tempi 6-7 s a Enorme contro il limite di 8 s; decisioni in `docs/pipeline/domande/T182.md`; suite e typecheck verdi; sicurezza: nessuna superficie nuova (solo `lab/`).

### T183 · Le interfacce di simulazione complesse: una prova dell'espressività del kernel — `fatto` (`3313447`) (dipende da T205)
- Pipeline: claude · stima 9% · approvato · priorità 79
- Step: 32
- **Scenario obbligato (autore, 04/11):** un gruppo di NPC costruisce un edificio in una sessione lunga mesi, con passi visivamente coerenti verso lo scopo comune. Provalo come gli altri: cosa manca al kernel, di che genere, se entra senza wipe. Serve a T245.
- Precisazione dell'autore (03/11, in `docs/userchats/to-do-2026-11-03.md`), vale più del resto del blocco: **i sei scenari non sono il limite, usa l'immaginazione.** Un universo parte con una versione del kernel e deve reggere anche ciò che servirà dopo mesi di vita: chi ha speso sul suo universo non vorrà rinunciarci per un kernel nuovo, e un wipe degli universi ufficiali costa molto. Quindi **le versioni «finali» del kernel vanno ridotte al minimo**, e ognuna deve prevedere le esigenze future. Allarga di conseguenza: (1) un catalogo di almeno 30 scenari inventati da te, scelti per coprire generi di primitive diversi, non per quantità, compresi quelli che nascono solo col tempo in un universo vivo (a titolo di esempio: economia e mercati, leggi e fazioni, costruzioni fatte dai giocatori, stagioni, veicoli con più persone, tornei, mondi che crescono per mesi) e ciò che il Concilio potrebbe chiedere di più ambizioso; per ognuno il genere di primitive che chiede. In codice bastano quelli che provano un genere non ancora provato. (2) **Il costo di una primitiva aggiunta dopo, misurato:** cosa succede davvero a un universo esistente quando il kernel cambia (API Lua in più, un campo nuovo, un effetto nuovo, un nodo MJ nuovo, un formato di file che cambia; `universes.ts`, gli aggiornamenti dal seme): cosa entra senza rompere nulla e cosa chiede davvero un wipe. La premessa «non si può introdurre a posteriori» va verificata caso per caso: se il grosso è aggiuntivo, dillo, con la prova su un universo fatto col kernel di prima. (3) In `docs/design/espressivita.md`, oltre alla tabella, le primitive divise in: da avere prima della prima versione pubblica, aggiungibili dopo senza danno, e le regole perché un kernel cambi senza wipe.
- Contesto: richiesta 3 dell'autore, non prioritaria: il simulatore deve reggere gli scenari più ambiziosi del Concilio, coerente con la storia e la grafica, nel 3D e nelle UI dentro il tappeto; il kernel deve esporre molte primitive per comporre i moduli. **Non serve aggiungere contenuti al gioco:** è una misura. Scenari: navigazione in barca, volo in mongolfiera, sparo di un fucile, interazione con un computer (anni 90: «forse troppo?»), una bisca con scommesse clandestine, una partita 1v1 di uno sport semplice inventato. Primitive di oggi: API Lua, pannelli (`manifest.ui`, ADR-0028), effetti, stati (ADR-0026), `<action>` e `<animation>`, i casi della Sala sistemi (ADR-0052).
- Cosa fare: per ogni scenario scrivi moduli veri in `tests/espressivita/`, **senza toccare `src/kernel/`**, che girino nel kernel in miniatura (`runCase`) con `MockModels` e che il validatore accetti. Dove non si riesce, fermati al punto preciso: cosa manca, quale primitiva lo risolverebbe, di che genere è (movimento, camera, proiettili, pannelli, turni, tempo, stato condiviso, multigiocatore), e se l'Ingegnere saprebbe scriverlo col suo prompt. Scrivi `docs/design/espressivita.md`: una tabella scenario per primitiva, le primitive proposte in ordine di quanti scenari sbloccano. Nessuna primitiva nuova qui: sono proposte, da approvare. Se uno scenario è davvero interessante da avere nel gioco, proponilo.
- Test: i moduli girano in `tests/` e ciò che dichiari possibile è provato. Typecheck e suite con i loro turni.
- Browser: non serve; ciò che si vede solo a schermo (camera, grafica) scrivilo come non provato.
- Quando è fatto: commit su `task/T183`; nell'esito quanti scenari riescono senza kernel e le prime tre primitive. Sicurezza: nessuna superficie nuova, o le voci aggiunte.
- Esito: scritto `docs/design/espressivita.md` (tabella scenario per primitiva, catalogo di 39, costo misurato, divisione delle primitive, regole senza wipe) e `tests/espressivita/` con 13 scenari in moduli veri, nessuna modifica a `src/kernel/`. Da solo in una sessione riescono 10 su 13 interi e 3 in parte; dopo una riapertura 2 interi e 3 in parte; in multigiocatore nessuno intero. Cantiere per mesi riuscito per caselle. Prime tre primitive per scenari sbloccati: magazzino durevole (20), campi dei pannelli al client (15), eventi (9); per la versione pubblica anche i comandi di ogni viandante. Nessuna modifica misurata chiede un wipe: sei semi dal 20/10 e `valmora` si aprono senza guasti; non aggiuntivi il caso cambiato (8,9 % delle caselle), un'API tolta, un effetto in un `core.effects` riscritto. Suite 2006 verdi e 1 saltato (`valmora`, solo con `QUINE_UNIVERSO_VECCHIO`), typecheck verde. Da decidere dall'autore: se un guasto a runtime può non fermare il salvataggio (regola 6). Non provato: resa a schermo, Ingegnere vero, partita di multigiocatore per ogni modulo, `hashStr` (solo letto nel codice). Sicurezza: nessuna superficie nuova; quelle che le primitive aprirebbero sono scritte nel documento.

### T184 · Le ambientazioni spazio, pirati, cowboy — `in attesa` (dipende da T152)
- Pipeline: claude · stima 2% · browser · priorità 90
- Step: 37
- In attesa (autore, 03/11): «per ora mettili in attesa»; riparte quando lo dice lui. Vale solo per spazio, pirati e cowboy: T152 e T153 non cambiano. Sul sito intanto li annuncia T186.
- Contesto: richiesta 4 dell'autore, l'ultima: altri universi, spazio, pirati, cowboy. T152 fa i temi della Genesi e il censimento di ciò che presuppone il medioevo: questo task ne aggiunge tre. Lo spazio è il caso difficile: terreno, cielo, acqua e clima possono non significare ciò che significano altrove. Pirati e cowboy chiedono barche e fucili: le meccaniche le misura T183.
- Cosa fare: tre temi in più nella schermata della Genesi, col metodo di T152; ciò che il censimento non aveva considerato diventa neutro o dipende dal tema, nel modo più piccolo. Dello spazio di' cosa funziona e cosa no.
- Test: una Genesi offline per ogni tema. Typecheck e suite con i loro turni.
- Browser: col turno `browser`, `?offline`: i temi nuovi si scelgono e si arriva al mondo senza errori.
- Quando è fatto: commit su `task/T184`; nell'esito cosa può tradire il tema nei contenuti generati.

### T185 · Generare gli universi spazio, pirati, cowboy — `in attesa` (dipende da T184, T153)
- Pipeline: claude · stima 2% · priorità 91
- Step: 37
- Contesto: in attesa come T184, per scelta dell'autore (03/11); servono anche le risposte di T153 (`docs/pipeline/domande/T153.md`): costo, abbonamenti, nomi.
- Cosa fare: come T153, un universo alla volta, nessuna chiamata alle API Gemini.
- Quando è fatto: i tre universi su disco; nell'esito il costo di ciascuno e ciò che si è visto.

### T186 · Sul sito: spazio, pirati e cowboy «coming soon» — `fatto` (`f776e79`) (dipende da T205)
- Pipeline: claude · stima 1% · approvato · browser · priorità 85
- Step: 21
- Contesto: l'autore (03/11) ha messo in attesa questi tre universi (T184, T185) e propone di scrivere «coming soon» sul sito. Pagine in `site/`, stile del template `docs/design/sito/` (`site/site.css`), landing `site/landing.ts`, reami in `site/sessioni.html`.
- Cosa fare: guarda dove il sito parla degli universi e metti lì spazio, pirati e cowboy come «coming soon», senza link né pulsanti che portano a un universo che non c'è e senza date. Nel punto più piccolo che si vede: se non c'è un posto naturale, una sezione breve nella landing. Niente generazione né modelli nuovi. Il testo di tema, nessun meta-gioco sui contenuti del mondo.
- Test: typecheck e, se tocca il codice di una pagina, i test del sito con il loro turno.
- Browser: col turno `browser`: la pagina con la voce, a larghezza piena e stretta; screenshot; nessun errore né violazione della CSP in console.
- Quando è fatto: commit su `task/T186`; nell'esito dove sta e la frase scritta. Sicurezza: nessuna superficie nuova.
- Esito: in `site/index.html` (sezione `#reami`, sotto le tre schede) una striscia «COMING SOON · ALTRI UNIVERSI ALL'ORIZZONTE» con «SPAZIO Rotte tra le stelle e stazioni alla deriva.», «PIRATI Isole senza mappa e velieri da abbordare.», «COWBOY Polvere, mandrie e città di frontiera.», senza link, pulsanti né date; stile in `site/site.css`; niente test nuovi, perché cambiano solo HTML e CSS; suite 119 file/1705 test, typecheck e build verdi; `sessioni.html` non toccata; non provato: la pagina sotto `npm run serve`, solo `vite preview`. Sicurezza: nessuna superficie nuova.

## Le rinomine del glossario (chat del 03/11/2026: «i nomi vanno bene e fai tutte le rinomine»)

Una catena: ogni task parte solo con il precedente integrato, e nient'altro gira nel frattempo (l'orchestratore ha tolto l'approvazione ai pronti e la ridà alla fine), perché una rinomina si scontra con tutti e un task partito prima userebbe i nomi vecchi senza un conflitto che lo dica.

### T206 · Integrare T179 — `fatto` (`2f5cb96`)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 23
- Contesto: T179 (`dossier T179`) è finito, ma `integra T179` va in conflitto in `docs/adr/README.md`: ha preso lo 0117, che nel base è il glossario di T178.
- Cosa fare: nel tuo worktree `git merge task/T179`; il suo ADR diventa **0118** (file, indice, citazioni in `AGENTS.md` e nel codice che porta); le due righe dell'indice restano entrambe. Nessun'altra modifica. Il blocco di T179 nel backlog dice ADR-0117: si legge 0118, non riscriverlo.
- Test: typecheck e suite intera con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T206`. Sicurezza: nessuna superficie nuova.
- Esito: T179 fuso in `task/T206` (2f5cb96), l'ADR della traccia diventa 0118 (file, indice con entrambe le righe, `AGENTS.md`, `lab/banco/traccia.md`, `src/mj/engine.ts`, `src/mj/trace.ts`), nessun'altra modifica; il blocco di T179 nel backlog dice ADR-0117 e si legge 0118; typecheck e suite verdi (1429 test); non provato: `banco-strutture --seconda --traccia` con una chiamata vera, come già nell'esito di T179; sicurezza: nessuna superficie nuova.

### T187 · Il glossario con le scelte dell'autore — `fatto` (`074bb7f`) (dipende da T179)
- Pipeline: claude · stima 1% · approvato · priorità 2
- Step: 24
- Contesto: l'autore ha letto il glossario di T178 (`dossier T178`) e ha deciso. Scelte 1, 2, 3, 5, 7, 8 come raccomandate: «universo» anche nel sito, `chunk`, «sessione del Concilio» resta, «entità» ed `entity`, `Storey`, `phrase`. **Scelta 4:** «individuo», `Individual` per uomini e animali; «persona» resta solo il valore di `specie` (`persona | animale`) e nei campi fermi (`people.json`, `persona` nel manifest, `npc.*`). **Scelta 6, nessuna eccezione alla convenzione:** `Taglia` → `SizeTier`, `TAGLIE` → `SIZE_TIERS`, `Partita` → `GameSetup`, `referenteReply` → `liaisonReply`, `askReferente` → `askLiaison`; in italiano restano «taglia», «partita», «Referente» e il valore `referente` di `AgentId`, come gli altri agenti.
- Cosa fare: correggi `docs/glossario.md`: le voci delle scelte 4 e 6; la sezione «Le scelte dubbie» diventa «Le scelte fatte» (una riga per scelta, senza alternative); nella tabella delle rinomine aggiungi **R16** (`Person` e i nomi derivati → `Individual…`: censisci tu quali; `Identity` resta, unirli è un'altra cosa) e **R17** (la scelta 6); dai a **R7** i nomi inglesi d'arrivo, che oggi non dice, senza collisioni in `src server tests site`, e aggiungi `Carta` se è un tipo da rinominare. Per ogni R, nomi di partenza e d'arrivo esatti, così il task che la esegue non deve scegliere. Riconta i file. Nessuna rinomina nel codice in questo task. Gli ADR non si riscrivono: se ADR-0117 dice le eccezioni ora tolte, la correzione sta nel glossario e, se serve, in `AGENTS.md`.
- **Regole comuni a T188-T204:** (1) esegui solo la tua R, con i nomi d'arrivo del glossario, in `src server tests site tools lab`, e in `AGENTS.md`, `CLAUDE.md` e `docs/glossario.md` dove citano quei nomi; ADR, backlog e diari sono storia, non si toccano. (2) **Ciò che è su disco, sul filo o visibile a Lua non cambia** (campi JSON, messaggi del protocollo, API Lua, effetti, componenti, chiavi di `localStorage`): attento alle abbreviazioni che fanno da chiave di ciò che si serializza (`{ hand }`), al `Host`, ai nomi in stringhe (`bus`, `window.quine`, `lab/`, script, prompt). Se un nome si rivela fermo, lascialo e scrivilo nell'esito. (3) Niente modifiche di logica, formattazione o pulizia di passaggio: il diff deve leggersi come una rinomina; un'incongruenza trovata va nell'esito. (4) Un nome già occupato o una R che tocca molto più del previsto: non inventare, scrivilo in `docs/pipeline/domande/<Txx>.md`. (5) Il glossario si aggiorna nello stesso commit: la riga R segnata fatta, i nomi nuovi nelle voci, quelli vecchi tra i «da non usare».
- Test: `tests/glossario.test.ts` e typecheck con il turno. Suite intera non serve se tocchi solo documenti.
- Browser: non serve.
- Quando è fatto: commit su `task/T187`; nell'esito i nomi scelti per R7 e R16. Sicurezza: nessuna superficie nuova.
- Esito: glossario con le scelte dell'autore, voci delle scelte 4 e 6 corrette, R1-R17 con nomi esatti, ciò che resta e file ricontati (R7: `ActorConfig`, `AiMinimums`, `HeritageConfig`, `CardOrigin`, `CardStamp`, `cardHolderOf`, `cellarOf`, `sessionCap`…; R16: `Individual`, `DialogueIndividual`, `addIndividual`, `updateIndividual`, `individualOf`, `individualFacts`, `individualByName`, `individualNode`, `noIndividual`; `Identity`, `People`, `readPeople` restano); aggiunte oltre il previsto: `Origine`, `Scheda`, `Forma`, `Plinto…`, `Tornio…` in R7, `Lot`→`LotBox` in R1, `playerId`→`wandererEntity` e `playerCell` spostato da R10 a R3, la frase in `AGENTS.md`, il censimento rigenerato; nessuna rinomina nel codice; verdi `tests/glossario.test.ts` e typecheck, suite intera non lanciata (non serve per i documenti); non provato: funzioni e locali italiani fuori dalle famiglie non censiti, conteggio `person` in R16 approssimato. Sicurezza: nessuna superficie nuova.

### T188 · R1: `Building` → `Lot` — `fatto` (`a47dd57`) (dipende da T187)
- Pipeline: claude · stima 1% · approvato · priorità 3
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R1 del glossario: il `Building` di `layout.ts`, `Chunk.buildings`, `findBuildings`, `buildingAt`.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T188`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R1 eseguita in 18 file (7 sorgenti, 9 test, 2 documenti; stima 13): `Building` di `layout.ts` → `Lot`, `LayoutResult.buildings` e `Chunk.buildings` → `lots`, `findBuildings` → `findLots`, `buildingAt` → `lotAt` (campo `lot`), `Lot` di `relief.ts` → `LotBox`; glossario (riga R1, voce Lotto, omonimi) e censimento aggiornati; fermi il `Building` di `corona.ts` (è l'edificio), `lotti` del protocollo (sul filo), `lotsOf` e il suo `lots` locale (non si scontrano), la stringa in `tests/pipeline.test.ts` (dato di prova) e i commenti con «buildings» generico (`types.ts:279`, `terrain.ts:6`, `lab/banco/`); nessuna migrazione, su disco va solo `plan`; suite 1429 verde, typecheck verde, `tests/glossario.test.ts` verde; nell'output dei test un `heap out of memory`, forse di un processo figlio con limite di memoria, non individuato e senza test falliti; `lotAt` in `src/` non ha chiamanti, solo i test (incongruenza già presente); browser non richiesto (prova finale in T205). Sicurezza: nessuna superficie nuova.

### T189 · R2: `Models` → `AiModels`, `kernel.ai` — `fatto` (`b88d99e`) (dipende da T188)
- Pipeline: claude · stima 2% · approvato · priorità 4
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R2: `Models` e le sue classi, `kernel.models` → `kernel.ai`. Tocca ~100 file, soprattutto test: una sostituzione meccanica verificata dal typecheck. Cambia `window.quine.models`: aggiorna ciò che lo cita (`AGENTS.md`, `lab/`).
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T189`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R2 eseguita in 110 file (75 test, 18 `src`, 8 `lab`, 2 `server`, 1 `site`, 1 `tools`, 5 documenti; stima 114): `Models` e classi → `AiModels`, `MockAiModels`, `GeminiAiModels`, `RoutedAiModels`, `QueueAiModels`, `TrackingAiModels`, `TrackingOnlineAiModels`, `SculptorAiModels`, `pricedAiModels`, `localAiModels`, `baseAiModels`, `updateAiModelsHud`; campo `models` di `Kernel` e `Council` → `ai`, `window.quine.models` → `window.quine.ai`; oltre la riga: l'opzione `models` di `Kernel.boot` → `ai` (scritto nella riga R2) e i nomi anche in `README.md` e `docs/architettura-dettagli.md`; fermi la libreria (`maxModels`, `tornioModels`, `upgradeModels`, `listModels`, il `models` di `addBudgetFromTetto`), `textModel` e `ai` di `universe.json`, l'id DOM `#models`, il file `src/kernel/ai/models.ts`, i locali e i campi dei test `models` (la riga non li cita), i commenti con «Models» generico, `Gemini Models` della pipeline; nessuna migrazione; suite 1440 verde, typecheck verde, `tests/glossario.test.ts` verde, censimento rigenerato, `sicurezza:prove` 80 ok (lanciato fuori turno, comprende una build; esito generato cancellato); resta nell'output dei test un `heap out of memory` già visto in T188, non individuato e senza test falliti; browser non provato (prova finale in T205). Sicurezza: nessuna superficie nuova.

### T190 · R3: `player…` → `wanderer…` — `fatto` (`4597184`) (dipende da T189)
- Pipeline: claude · stima 2% · approvato · priorità 5
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R3. **Fermi** `world.player`, `world.player_pos`, `player_id`, `player_get`, `player_set` e il binding: Lua li vede. `playerPos` è nella procedura di «Convalida nel browser» di `AGENTS.md`: aggiornala.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T190`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R3 eseguita in 56 file (13 `src`, 39 test, 1 `tools`, `GEMINI.md`, 3 documenti; stima 53): `playerPos`→`wandererPos`, `playerCarpet`→`wandererCarpet`, `playerId`→`wandererEntity`, `playerComp`→`wandererComp`, `playerMod`→`wandererModule`, `playerCell`→`wandererTile`, `playerText`→`wandererText`, `playerPrompt`→`wandererPrompt`; oltre la riga: lo snippet di `GEMINI.md` e l'esempio di `tools/glossario/glossario.mjs` (ora `playerFiles`); fermi perché Lua li vede `world.player`, `world.player_pos`, `player_id`, `player_get`, `player_set` e il binding, fermi su file e moduli `kind: player` e `core.player`, restano perché sono il giocatore `players`, `PlayerSpot`, `playerFiles`, `playerFile`, `playerFilesIn`, `playerChanges`, `PLAYERS_DIR`, `manyPlayers`; incongruenze lasciate: `FALLBACK_PLAYER`, il locale `player` di `bench.ts`, `PLAYER` di `atlas.ts`, il commento «Player position» di `kernel.ts` indicano il viandante ma la riga non li nomina, e `docs/conversazioni.md` cita ancora `playerText`; nessuna migrazione; suite 1440 verde, typecheck verde, `tests/glossario.test.ts` verde, censimento rigenerato; resta nell'output dei test il `heap out of memory` già visto in T188 e T189, senza test falliti; non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T191 · R4: `Place` → `ChunkInfo`, `PlaceView` → `ChunkView` — `fatto` (`b02f53a`) (dipende da T190)
- Pipeline: claude · stima 2% · approvato · priorità 6
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R4; il `ChunkView` del renderer diventa prima `TerrainView`. I `place` locali a mano, dove sono il luogo. **Fermi** `plan.place` in `maps/`, `placesPerMinute`, `luoghi` del protocollo.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T191`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R4 eseguita in 20 file di codice (15 `src`, 5 test; stima 24) più 3 documenti (`docs/architettura-dettagli.md`, `docs/glossario.md`, censimento). Il `ChunkView` del renderer è ora `TerrainView`; poi `Place`→`ChunkInfo`, `PlaceView`→`ChunkView`, `PlaceLot`→`ChunkLot`, `PlaceMiniature`→`ChunkMiniature`, `GraphPlace`→`GraphChunk` e tutti gli altri nomi della riga (`chunkHere`, `chunksOf`, `mergeChunks`, `graphChunks`, `chunkCardId`, `addChunk`, `hasChunk`, `lastChunk`, `listChunks`…), senza collisioni. A mano i locali che sono il luogo (`chunk`, `chunks`, `chunkKey`) in `kernel.ts`, `graph.ts`, `atlas.ts`, `hud.ts`, `server.ts` e in 4 test: il task lo chiedeva, mentre la riga del glossario li dava tutti per fermi, quindi l'ho corretta. Fermi perché su disco o sul filo: `plan.place` in `maps/`, `Chunk.place`, `placesPerMinute`, `luoghi`, `senza_luogo`. Restano perché vanno nei dati agli agenti: `ctx.place`, `npc.place`, i `data` e i parametri di `npcDialogue` e `weavePlot`. Restano perché verbo o altro senso: `placeStructure` e simili, i locali `place` di `placementsOf`, `Hud.place` (`#place`), `keepsFormsOnDisk(place)`, le cartelle temporanee nei test. Incongruenze lasciate perché la riga non le nomina: `SessionClient.places`, `Client.places`, `ThinClient.places()`, `ShowcaseEntry.place`, `graphCache.places`, il locale `places` di `kernel.ts` per `weavePlot` (contiene anche le regioni), `PLACE_PHASES`, `PLACES_PER_MINUTE`, `Kernel.miniature`, `tests/places.test.ts` e i commenti inglesi con «place». Nessuna migrazione. Nell'output dei test resta il `heap out of memory` già visto in T188-T190, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T192 · R5: `hand` → `phrase` nel TypeScript — `fatto` (`2ce3311`) (dipende da T191)
- Pipeline: claude · stima 1% · approvato · priorità 7
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R5, senza il componente: **fermo** il componente `hand`, salvato nello stato dei viandanti e visto da Lua.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T192`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R5 eseguita in 15 file di codice (6 `src`, 9 test; stima 15) più 3 documenti (`docs/architettura-dettagli.md`, `docs/glossario.md`, censimento). Di `Kernel`: `hand()`→`phrase()`, `syncHand`→`syncPhrase`, `inscribeHand`→`inscribePhrase`; in `hud.ts`: `lastHand`→`lastPhrase`, `handKey`→`phraseKey`; nessuna collisione. Fermi perché su disco, sul filo o visti da Lua: il componente `hand`, `hand.tokens`, `hand.sel`, il campo `hand` dello stato sul filo e in `world/giocatori/` (`hand: k.phrase()`), le stringhe `'hand'` nelle liste dei componenti (`kernel.ts`, `bench.ts`), `core.player/manifest.json`. Restano perché la riga non li nomina (aggiunti alla riga nel glossario): `ThinClient.phrase` e `ThinClient.syncPhrase` su un'altra classe, i locali `const hand = k.phrase()` che tengono il componente, `Hud.hand` e l'id CSS `#hand`, i commenti inglesi con «hand». Incongruenze lasciate per la regola 3: quei locali si leggono ora un po' storti accanto a `phrase()`, e il commento di `phrase()` dice ancora «The rune hand». Nessuna migrazione. Nell'output dei test resta il `heap out of memory` già visto in T188-T191, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T193 · R6: `Thing…` → `Entity…` — `fatto` (`0333f7f`) (dipende da T192)
- Pipeline: claude · stima 2% · approvato · priorità 8
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R6, con `src/render/things.ts` → `entities.ts` (`git mv`). **Fermi** `cose` ed `entita` del protocollo; nei prompt del Cartografo «cose» resta.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T193`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R6 eseguita in 42 file: 38 di codice (27 `src`, 10 `tests`, 1 `lab`; stima 54, più bassa perché i commenti con «thing» parola comune restano) e 4 documenti (`AGENTS.md`, `docs/architettura-dettagli.md`, `docs/glossario.md`, censimento rigenerato). Rinominati: `src/render/things.ts`→`entities.ts` (`git mv`), `ThingView`→`EntityView`, `THING_PARTS`→`ENTITY_PARTS`, `Things`→`Entities`, `Thing` del laboratorio→`Entity`, `thingStandIn`→`entityStandIn`, `thingCards`→`entityCards`, i campi `things`→`entities` di `Renderer`, `SessionClient`, `BenchScene` e `ChunkMiniature` (questi ultimi due si calcolano in memoria, né su disco né sul filo), i commenti dove «thing» è il termine tecnico; nessuna collisione. Fermi perché sul filo o nei dati: `cose` ed `entita` del protocollo, `cose` dei casi del banco e dei prompt del Cartografo, `showcaseEntries('cose')`. Restano perché la riga non li nomina (aggiunti alla riga nel glossario): `Client.things` in `server.ts`, il metodo privato `ThinClient.things`, i locali `things` e `thing` (`kernel`, `bench`, `graph`, `coefficients`, test), `things` e `userData.thing` del laboratorio, `things` di `lab/3d/world.ts`, il valore `'thing'` di `EntityView.kind`, i titoli dei test, `tests/kernel-things.test.ts`. `class Thing` di `tests/sicurezza/uscita.test.ts` resta perché non è un'entità. Restano anche i commenti con la parola comune: «things» accanto a «people» (che tradurrebbe `cose` come sottoinsieme delle entità), ciò che si porta, le stampanti e le vetrine della corona; «they are not a thing» in `kernel.ts` resta perché un viandante è un'entità. Incongruenze lasciate per la regola 3: `this.things([...s.entities.values()])` in `thin.ts` e `let things: Entity[]` nel laboratorio si leggono un po' storti. Nessuna migrazione. Verdi typecheck, suite intera (108 file, 1440 test) e `tests/glossario.test.ts`; nel log dei test resta 1 `heap out of memory` già visto in T188-T192, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T194 · R7: l'italiano nel TypeScript — `fatto` (`44e81b9`) (dipende da T193)
- Pipeline: claude · stima 1% · approvato · priorità 9
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R7, con i nomi che T187 ha scritto nel glossario. **Fermi** i campi omonimi nei file (`attore`, `minimi`, `eredita`, `sotto`, `titolare`, `tetto`).
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T194`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R7 eseguita in 35 file: 32 di codice (`src`, `tests`, `site/sessioni.ts`; stima 34) e 3 documenti (`docs/architettura-dettagli.md`, `docs/glossario.md`, censimento rigenerato). Nessuna collisione e nessuna migrazione. Rinominati tutti i nomi della riga R7 (`ActorConfig`, `AiMinimums`, `HeritageConfig`, `DEFAULT_HERITAGE`, `CardOrigin`, `CardStamp`, `cardHolderOf`, `cellarOf`, `sessionCap` e derivati, `minCap`, `IndividualSheet`, `ItemShape`, `ITEM_SHAPES`, `Plinth…`, `Lathe…`/`lathe…`), con `git mv` di `src/kernel/tornio.ts`, `src/render/tornio.ts` e `tests/tornio.test.ts` → `lathe`. Glossario: riga R7 fatta, nomi nuovi nelle voci, vecchi tra i «da non usare», `latheModels` anche nella riga R2. Fermi perché su disco, sul filo o nei dati: i campi `attore`, `minimi`, `eredita`, `origini`, `carta`, `titolare`, `sotto`, `tetto`, `scheda`, gli id `forma-…`, i valori `tornio` e `plinto` (`ItemKind`, `target`, la lettera `plinto`), i messaggi `ui:tornio` e `studio:tornio`. Restano in italiano perché non sono nomi di tipi o di funzioni del TypeScript: il locale `tetto`, che è la chiave del messaggio, il laboratorio (`Scheda`, `daCorreggere`) e i testi visibili («Scheda del tipo», «Carta del giocatore», «UTILIZZI EREDITATI»). Restano perché la riga non li nomina (aggiunti alla riga nel glossario): `stepTornio`, `openTornio`, `TORNIO_AT`, il campo `tornio` di `CoronaView`, il metodo `tornio` di `Studio`, i locali `tornio`, `Kernel.plinto()`, `updatePlinto`, il campo `plinto` della struttura; `Person.scheda` resta per R16. Incongruenza lasciata per la regola 3: in `src/render/coronaview.ts` e `src/kernel/lathe.ts` convivono ora `tornio` e `lathe`, e servirebbe una riga R apposita se l'autore vuole finirla. Verdi typecheck, suite intera (108 file, 1440 test) e `tests/glossario.test.ts`; nel log dei test resta 1 `heap out of memory` già visto in T188-T193, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T195 · R8: `CardUses`, `UsageLog` — `fatto` (`059b1cf`) (dipende da T194)
- Pipeline: claude · stima 1% · approvato · priorità 10
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R8: `CardLedger` → `CardUses`, `UsageLedger` → `UsageLog`; `Ledger` resta dei saldi.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T195`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R8 eseguita in 15 file: 12 di codice come stimato (4 `src`, 4 `tests`, 4 `lab`) e 3 documenti (`docs/architettura-dettagli.md`, `docs/glossario.md`, censimento rigenerato); nessuna collisione, nessuna migrazione. Glossario: riga R8 fatta, nomi nuovi nelle voci «Consumi» e «Carta», vecchi tra i «da non usare», riga `Ledger` degli omonimi aggiornata. Restano fermi: `Ledger`, `FileLedger`, `MemoryLedger`, `LedgerBook`, `openLedger`, perché sono dei saldi; `world/consumi.json` e `world/carte.json`, perché sono su disco. Restano perché la riga non li nomina (regola 3, scritti nella riga del glossario): i locali e parametri `ledger` che tengono un `UsageLog` (`lab/scripts/gemini.ts`, `lab/scripts/mjx-sculpt.ts`, `tests/subscription.test.ts`), il locale `ledger` di `allCards` in `cards.ts`, la parola «ledger» nei commenti e nel titolo di test `usage ledger`. Resta anche `UsageLedger` nel diagramma di `docs/conversazioni.md`, trattato come storia e fuori dall'elenco della regola 1: se l'autore lo considera vivo, va cambiato a mano. Incongruenza lasciata: «ledger» nei commenti di consumi e carte è ancora omonimo dei saldi, servirebbe una riga R se l'autore vuole finirla. Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory` già visto, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T196 · R9: `Floor` → `Storey` — `fatto` (`ea03b51`) (dipende da T195)
- Pipeline: claude · stima 2% · approvato · priorità 11
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R9, solo il piano di un edificio: il pavimento resta `floor` (`floorAt`, `floorBelow`), controlla ogni uso. `k.corona.building(id).floors` è nella «Convalida nel browser» di `AGENTS.md`: aggiornala.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T196`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R9 eseguita in 23 file: 19 di codice (6 `src`, 13 `tests`) e 4 documenti (`GEMINI.md`, `docs/architettura-dettagli.md`, `docs/glossario.md`, censimento rigenerato); nessuna collisione, nessuna migrazione. Rinominati `Floor` → `Storey`, `Building.floors` → `storeys`, `perFloor` → `perStorey`, `nFloors` → `nStoreys`, `FLOOR_STRIDE` → `STOREY_STRIDE`, il campo di `roomAt` e il parametro di `buildRoom` → `storey`, e i commenti dove «floor» significa quel piano. Oltre la riga del glossario, scritti in R9: l'indice `floor` di `entrance` → `storey`; nei test `sampleFloor` → `sampleStorey` e `floorOf` → `storeyOf` (è il piano di un oggetto, la riga lo dava per pavimento e l'ho corretta); `GEMINI.md`, fuori dall'elenco della regola 1, perché il suo snippet si sarebbe rotto. Glossario: riga R9 fatta, voce «Piano» con i nomi nuovi e i vecchi tra i «da non usare», `floors` di `mesh.ts` spostato nella voce «Pavimento», omonimi aggiornati. Restano fermi: `floorAt`, `floorBelow`, `floors` di `src/mj/mesh.ts`, `Lot.floor`, `Form.floor`, le misure di `lab/banco/misure.ts`, perché sono pavimenti; lo strato `floor` di `TileLayer`, perché è su disco; il genere `'floor'` di `CoronaCell`, perché è una casella all'aperto, non un piano; la parola inglese «ground floor» nei commenti, lasciata di proposito anche se indica il piano terra di un edificio; la scritta «piano» nella UI, già italiana. Se l'autore vuole togliere anche «ground floor», serve un altro passaggio sui commenti. Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory` già visto, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T197 · R10: le caselle → `…Tiles` — `fatto` (`3034e3d`) (dipende da T196)
- Pipeline: claude · stima 1% · approvato · priorità 12
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R10: gli identificatori elencati (`playerCell` si chiama ormai `wandererCell`, per R3); le variabili locali `cell` a mano solo dove sono una casella e non una cella di voxel o di griglia.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T197`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R10 eseguita in 15 file: 13 di codice (7 `src`, 6 `tests`) e 2 documenti (`docs/glossario.md`, censimento rigenerato); nessuna collisione, nessuna migrazione, nessun cambio di logica. Rinominati tutti i 14 nomi della riga: `gateCells`, `freeCell`, `freeCells`, `runeCells`, `solidCells`, `cellNear`, `propCells`, `pickCell`, `doorCells`, `nicheCell`, `cellOf`, `cellIndex`, `polarCell`, `CoronaCell` → `…Tile(s)`, `tileNear`, `tileOf`, `tileIndex`, `polarTile`, `CoronaTile`. I locali `cell` sono diventati `tile` dove indicano una casella (`kernel.ts`, `corona.ts`, `corona3d.ts`, `hud.ts`, `tests/bottlenecks`, `cellar`, `rilievo`). Oltre la lettera della riga: il campo `cell` del risultato di `tileOf` → `tile`, perché è privato e non esce da `kernel.ts`. Glossario: riga R10 fatta, voci «Casella» e «Varco» con i nomi nuovi e i vecchi tra i «da non usare», omonimo `cell` e citazione in R9 aggiornati. Restano fermi perché la riga non li nomina: i campi `cell` di `Placements` e di `HoverInfo`, con i loro destrutturati `{ index, cell }`; `Building.cells`; `Cell`, `cells` e `cell()` di `water.ts`; `Overlay.cell`; i locali `cells` al plurale; i commenti. Se l'autore vuole togliere anche questi, serve un altro passaggio. Restano fermi perché non sono caselle: griglie MarkovJunior, `cells` del layout, `turnCells`, `cellAt`, `nCell`, `sameCells`, `visibleCells`, `sleepCell`, e i `cell` di griglie, tabelle e tele (`graphlayout`, `pagamenti`, `inventory`, `studio`, `corona3d` 991/1030). Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory` già visto, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T198 · R11: `LayoutDef` → `EnvironmentDef` — `fatto` (`8781b79`) (dipende da T197)
- Pipeline: claude · stima 1% · approvato · priorità 13
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R11. **Fermi** `layouts` nei manifest, `layout` nei piani.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T198`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R11 eseguita in 10 file: 8 di codice (6 `src`, 2 `tests`) e 2 documenti (`docs/glossario.md`, censimento rigenerato); `LayoutDef` → `EnvironmentDef`, `layoutsFor` → `environmentsFor`; nessuna collisione, nessuna migrazione, nessun cambio di logica. Glossario: riga R11 fatta, voce «Ambiente» con i nomi nuovi e i vecchi tra i «da non usare». Restano fermi perché su disco: `layouts` nei manifest, `layout` nei piani. Restano fermi perché la riga non li nomina: il campo `layouts` del risultato di `environmentsFor` e i locali `layouts`, `designLayouts`, `validateLayout`, `checkLayout`, `LayoutCheck`; se l'autore vuole togliere anche questi serve un altro passaggio. Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory` già visto, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T199 · R12: `TileDef` → `TerrainDef` — `fatto` (`51897f7`) (dipende da T198)
- Pipeline: claude · stima 1% · approvato · priorità 14
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R12. **Fermo** `tiles`.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T199`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R12 eseguita in 15 file (12 di codice: 10 `src`, 2 `tests`; 3 documenti: `docs/glossario.md`, censimento rigenerato, `docs/architettura-dettagli.md`, fuori dall'elenco delle regole comuni ma con 3 citazioni e già toccato dalle rinomine precedenti); `TileDef` → `TerrainDef`, `TileLayer` → `TerrainLayer`; nessuna collisione, nessuna migrazione, nessun cambio di logica. Glossario: riga R12 fatta, voce «Terreno» con i nomi nuovi e i vecchi tra i «da non usare». Restano fermi perché su disco: `tiles` nei manifest e in `ChunkInfo`; per il glossario: `TerrainDef.layer`. Restano fermi perché la riga non li nomina: `tiles` e `tile` del risultato di `cartography.ts`, `VOID_TILE`; se l'autore vuole togliere anche questi serve un altro passaggio. Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory`, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T200 · R13: i commenti, «multiplayer» e `slot` — `fatto` (`aa1cadd`) (dipende da T199)
- Pipeline: claude · stima 1% · approvato · priorità 15
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R13: «game of many» → «multiplayer», `pocket` → `slot`, nei commenti e nelle poche variabili.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T200`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R13 eseguita in 40 file (38 di codice, più glossario e censimento rigenerato): «game of many» → «multiplayer game», `pocket` → `slot`, compreso il metodo privato `SessionServer.pocket`; solo commenti e titoli dei test oltre a quel metodo, nessuna migrazione. Fermi: le tasche di un individuo (`src/kernel/agents/content.ts`, `src/kernel/kernel.ts`, `tests/kernel-things.test.ts`), perché la riga le esclude; il `pocket` di `src/kernel/layout.ts`, che è una zona calpestabile; «universe/world/server/session of many», che la riga non nomina: per toglierli serve un altro passaggio. Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory`, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T201 · R15: nel sito «universo», non «reame» — `fatto` (`0b842ae`) (dipende da T200)
- Pipeline: claude · stima 1% · approvato · priorità 16
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R15: testi di `site/` e, nel suo codice e CSS, `realm` → `universe`, con i 6 test. **Fermi** ciò che un URL o una rotta espone e il «reame» del kernel, che è l'area di 4 × 4 zone (`realmOf`).
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T201`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R15 eseguita in 26 file (13 del sito, 7 test, 2 server, `AGENTS.md`, `docs/architettura-dettagli.md`, glossario, censimento rigenerato): testi «universo/universi» con articoli corretti, `realm` → `universe` nel codice e nel CSS, messaggi di `server/wanderer.ts`, solo rinomina, nessuna migrazione. Fuori dalla riga R15: `tab-reami` e `panel-reami` → `tab-universi` e `panel-universi`, che nessun indirizzo usa. Fermi: l'ancora `#reami` (negli indirizzi); il valore `quine:sito:reame` (chiave di `localStorage`); il reame del kernel (`realmOf`, commenti di `src/`, `tests/lots.test.ts`, prompt del Cartografo); i nomi d'universo delle prove (`reame`, `reame2`, `reame-low`, `reame-high`); `docs/design/sito/` e `docs/sicurezza/prove-f12.md`, fuori ambito, dove restano `realm-card` e un messaggio con «reame». Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory`, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T202 · R16: `Person` → `Individual` — `fatto` (`7a7a82e`) (dipende da T201)
- Pipeline: claude · stima 2% · approvato · priorità 17
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R16, con i nomi di T187. **Fermi** `people.json`, `persona` nel manifest, il valore `persona` di `specie`, `npc.*`, i nodi `persona:…` del grafo, salvati in `world/grafo.json`. `Identity` resta.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T202`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R16 eseguita in 38 file, commit `7a7a82e`, solo rinomina senza migrazione: `Person` e derivati → `Individual…`, campo `person` di `BenchScene`/`figure` e locali → `individual`, vetrine `individual:<nome>`, commenti dove è il concetto, «persona» → «individuo» in UI, `AGENTS.md` e `docs/architettura-dettagli.md`, glossario con R16 fatta, censimento rigenerato. Fermi con il motivo: su disco, sul filo o nel prompt `people.json`/`persone`, `persona` del manifest, valore di `specie`, `npc.*`, nodi `persona:…` con `senza_persona`, id `persona:…` delle carte, chiave `persone` dei coefficienti e id dell'edificio; per il glossario `Identity`, `People`, `readPeople`, `Species`, `personaggi`, prompt e mondo; la classe di modello `persona` nei commenti di `src/mj/`, `forms.ts` e nei test di forms e sculptor; le frasi persona contro animale (`society.ts:66,149,493`, `kernel.ts:6047`, `plots.ts:126`). Lasciati e da valutare: il locale `person` di `src/ui/chat.ts` (vuol dire «altro viandante»), il locale `persona` di `src/render/entities.ts:156`, i testi e `tab-persone` della landing (`site/index.html`), il testo di `tools/sicurezza/catalogo.mjs:614`. Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory`, senza test falliti. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T203 · R17: `SizeTier`, `GameSetup`, `liaison` — `fatto` (`23ae1f6`) (dipende da T202)
- Pipeline: claude · stima 2% · approvato · priorità 18
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R17: `Taglia` → `SizeTier`, `TAGLIE` → `SIZE_TIERS`, `Partita` → `GameSetup`, `referenteReply` → `liaisonReply`, `askReferente` → `askLiaison`. **Fermi** `universe.json → partita`, `appearance.taglia`, `strutture[].taglia`, il valore `referente` di `AgentId`. Il file `partita.ts` resta dov'è, salvo che il glossario dica altro.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T203`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R17 eseguita in 31 file, commit `23ae1f6`, solo rinomina senza migrazione: `Taglia` → `SizeTier`, `TAGLIE` → `SIZE_TIERS`, `Partita` → `GameSetup`, `repairPartita` → `repairGameSetup`, `partitaSummary` → `gameSetupSummary`, `DEFAULT_PARTITA` → `DEFAULT_GAME_SETUP`, `Kernel.partita()` → `gameSetup()`, `referenteReply` → `liaisonReply`, `askReferente` → `askLiaison`; `src/kernel/partita.ts` → `src/kernel/gameSetup.ts`, come dice il glossario; aggiornati `AGENTS.md`, `docs/architettura-dettagli.md`, glossario con R17 fatta, censimento rigenerato. Fermi con il motivo: su disco o nei dati `universe.json → partita` (con `modalita`, `altroTraGiocatori`, i campi `cfg.partita`), `appearance.taglia`, `strutture[].taglia` e il campo `taglia` con i suoi valori, il valore `referente` di `AgentId`; per il glossario `SizeDef`, `RARE_SIZES`, `sizeOf`, `sizeRank`, `game`, `chooseGame`, il `Game` di `server/access.ts`; il testo di UI «Partita Narrativa» (`site/sessioni.html`, commento in `tests/sessioni_hub.test.ts`), `docs/conversazioni.md` e `docs/design/sito/`, che non sono nell'ambito. Lasciati e da valutare, perché fuori dai nomi di R17: i locali `partita` di `server/access.ts:100,140`, il nome del file `tests/partita.test.ts`, `ProvaTaglia` e `taglieDiProva` di `lab/banco/varianza.ts`, l'italiano «partita» e «taglia» nei commenti e nei testi. Verdi typecheck, suite intera (108 file, 1448 test) e `tests/glossario.test.ts`; nel log resta 1 `heap out of memory`, senza test falliti, come in T202. Non provati il browser (prova finale in T205) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T204 · R14: `AGENTS.md` con i nomi del glossario — `fatto` (`e971fb4`) (dipende da T203)
- Pipeline: claude · stima 1% · approvato · priorità 19
- Step: 24
- Contesto: una rinomina del glossario (`docs/glossario.md`, «Le rinomine proposte»), scelta dall'autore il 03/11. Regole comuni: blocco di T187. Nasce da T178: `dossier T178`.
- Cosa fare: R14: in `AGENTS.md`, `chunk` → «luogo» e `layout` → «ambiente» dove sono il concetto e non un identificatore; ricontrolla che ogni identificatore citato esista ancora. Gli ADR non si toccano. Solo documenti: la suite intera non serve se il codice non cambia.
- Test: `npm run typecheck` e la suite intera con i loro turni; `tests/glossario.test.ts` verde, censimento rigenerato.
- Browser: non serve (la prova finale è in T205).
- Quando è fatto: commit su `task/T204`, solo la rinomina; nell'esito quanti file e ciò che è rimasto fermo, con il motivo. Sicurezza: nessuna superficie nuova.
- Esito: R14 eseguita in 3 file, commit `e971fb4`, solo documenti: `AGENTS.md` (regola 2 «programmi degli ambienti»; righe `relief.ts` e `terrain.ts` «luoghi»; `universe.json` «lato del luogo (18)»), R14 segnata fatta in `docs/glossario.md`, censimento rigenerato. Identificatori citati in `AGENTS.md` ricontrollati con uno script: esistono tutti. Fermi con il motivo: `layout` in `npm test` (è la procedura della voce «Layout», `tests/layout.test.ts`), `layout.ts`, `graphlayout.ts`, `chunks.ts` (nomi di file), `layouts` del manifest e `generate_chunk` (su disco e API Lua), gli ADR. Lasciato e da valutare, perché la riga R14 nomina solo `AGENTS.md`: «qualche chunk» in `CLAUDE.md:19`. Verdi typecheck e `tests/glossario.test.ts`; suite intera non lanciata (il codice non cambia, come dice il task); non verificato che le descrizioni in `AGENTS.md` siano ancora esatte. Sicurezza: nessuna superficie nuova.

### T205 · La prova delle rinomine nel gioco — `fatto` (`94121e2`) (dipende da T204)
- Pipeline: claude · stima 2% · approvato · browser · priorità 20
- Step: 24
- Contesto: T188-T204 hanno rinominato con i soli test e il typecheck. Ciò che sfugge a entrambi sono i nomi in stringhe e ciò che si serializza.
- Cosa fare: un universo salvato **prima** delle rinomine deve aprirsi uguale: prova il seme e, se c'è, un universo già esistente in `universes/`, su una copia di lavoro, senza modificarlo. Correggi solo ciò che le rinomine hanno rotto; altro va nell'esito.
- Test: suite intera con il turno, `npm run build`, `npm run build:server`.
- Browser: col turno `browser`, la procedura di «Convalida nel browser» di `AGENTS.md` (è anche la prova che sia ancora giusta con i nomi nuovi): `?skip&offline`, un luogo, «E» su un individuo, la corona con un dispositivo; due schede in multigiocatore (master e giocatore, un oggetto dato all'altro); le pagine del sito con «universo»; nessun errore in console.
- Quando è fatto: commit su `task/T205`; nell'esito cosa è stato provato davvero e cosa no. Sicurezza: nessuna superficie nuova.
- Esito: nessuna rinomina ha rotto un universo salvato e nessuna correzione al codice; commit `94121e2` solo su `docs/architettura-dettagli.md` (multigiocatore che non gira sotto `vite preview`, «E» da y 7.5). Provato davvero: stesso universo aperto col codice di prima di T188 e con l'attuale (`valmora` del 22/10 e seme salvato col vecchio codice), unica differenza `buildings`→`lots` con gli stessi valori; suite 108 file/1448 test verde, typecheck, `build`, `build:server`. Da valutare a parte, non dalle rinomine: `UniverseClient.commit` non ritenta un commit fallito (visto una volta «fetch failed» alla prima partenza, commit dell'Arbitro perso, mondo e disco divergenti, causa non accertata, non ripetuto in due partenze nuove e una vecchia); all'apertura di `valmora` l'Arbitro ritira 16 moduli, uguale col vecchio codice. Non provato: `npm run serve` avviato, Firebase, Stripe, Gemini vero, `valmora new` e `valmora copy 2`, un salvataggio nato in multigiocatore (provato un universo in singola convertito a mano). Sicurezza: nessuna superficie nuova.

### T208 · La pagina web conta male le domande aperte — `fatto` (`0e14809`)
- Pipeline: claude · stima 1% · approvato · priorità 5
- Step: 19
- Contesto: richiesta dell'autore del 03/11 («un sacco di domande aperte che probabilmente non dovrebbero esserle»). `parseQuestionFile` (`tools/pipeline/web.mjs`) sbaglia in entrambi i versi. Dà «da rispondere» a file risolti, scritti in forma libera (T117, T155, T173, T45e, T97), e «risposto» a file con la risposta vuota (T45f, T93), perché in `Risposta:\s*\S` il `\s*` scavalca l'a capo e `\S` prende il `**` di `**Risposta:**` o il testo seguente. Il badge (riga ~1481) somma quei falsi.
- Cosa fare: i file ora hanno in testa una riga `Stato: aperta` o `Stato: chiusa`, scritta dall'orchestratore: se c'è, decide lei. Senza quella riga vale il parser di oggi, corretto perché una risposta vuota sia vuota (mai oltre l'a capo, `**` non è una risposta). Il badge conta solo le aperte; l'elenco le mette per prime e nomina lo stato giusto. Di' in `docs/pipeline/README.md`, nelle regole sulle domande, che chi chiude una domanda aggiorna la riga. `POST /api/domande` non deve togliere la riga.
- Test: casi in `tests/pipeline.test.ts` (riga aperta, riga chiusa, `**Risposta:**` vuoto, forma libera senza riga), poi la suite intera e il typecheck con i loro turni.
- Browser: non serve; la pagina si legge dopo il prossimo riavvio del processo.
- Quando è fatto: commit su `task/T208`, solo questo. Sicurezza: nessuna superficie nuova.
- Esito: `parseQuestionFile` legge la riga `Stato:` in testa e, senza riga, non prende più per risposta l'a capo o `**`; badge (`domandeAperte`, anche 0) solo sulle aperte, elenco con le aperte per prime e stato giusto; `POST /api/domande` conserva la riga e scrive anche su `**Risposta:**`; regola nel README; test in `tests/pipeline.test.ts`, suite e typecheck verdi. Sui file veri: 3 aperte (T45f, T93, T153), 12 chiuse. Non provato nel browser (il task non lo chiede): si vedrà dopo il riavvio del processo. Sicurezza: nessuna superficie nuova.
### T209 · Il sorvegliante: `healthy` da `pronto`, e `stop()` che aspetta i git — `fatto` (`d59dbf3`) (dipende da T205)
- Pipeline: claude · stima 2% · approvato · priorità 9
- Step: 27
- Contesto: le due proposte di T176 (`dossier T176`, l'esito), rimaste senza risposta; le approva l'orchestratore nell'autonomia data dall'autore il 03/11. Da chiudere prima di T45f, perché in produzione i mondi si aprono lenti. (1) `healthy` si conta dal `fork`: con i tempi di produzione (60 s) un mondo che impiega 90 s ad aprirsi ha le morti azzerate al primo sguardo; se muore appena aperto per un commit cattivo non torna all'ultimo vissuto e non si arrende, riparte per sempre, 90 s di processore ogni volta. (2) `stop()` non aspetta il `git commit` già partito: se il processo viene interrotto i lock restano nel repository dell'universo.
- Cosa fare: in `server/worldHost.ts` contare `healthy` da `pronto` (`heard`/`markGood`); `stop()` aspetta i git in corso, entro un limite di tempo, e non lascia lock. Solo questo: tempi e soglie di produzione non cambiano.
- Test: un mondo che muore appena aperto, dopo un'apertura più lunga di `healthy`, torna al commit vissuto e alla fine si arrende; `stop()` con un commit in corso non lascia `*.lock`. Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T209`; nell'esito se una voce V-NNN è da aggiungere o aggiornare (`docs/sicurezza/registro.md`) e la riga «sicurezza:».
- Esito: `healthy` si conta da `pronto` (`openedAt`); `stop()` aspetta i git del suo universo al più 5 s (`settleGit`, `holdGit` in `server/git.ts`, `gits` in `WorldHost`), poi uccide il resto e toglie i `*.lock`; in più del previsto il server di produzione fa `settleAllGit` dopo aver chiuso le connessioni. ADR-0121, `AGENTS.md`. Test nuovi in `mondo.test.ts` (apertura più lunga di `healthy` → commit vissuto e resa; morti dimenticate dopo `healthy` da aperto; commit in corso senza lock e arrivato; git bloccato ucciso e lock tolti) e assenza di lock dopo lo stop in `produzione.test.ts`; i due test principali sono rossi senza le correzioni. Suite 108 file/1452 test verde, typecheck verde. Non provato: i 60 s veri di `healthy`, `npm run serve` fermato con un segnale reale, carico da 24 thread (nessun giro dedicato). Resta fuori, scritto nell'ADR: un server ucciso di colpo lascia i lock fino alla fermata seguente di quel mondo, all'apertura nessuno li toglie; il limite di 5 s va rivisto al deploy (T45f). Sicurezza: nessuna superficie nuova (`settleGit` cancella solo `*.lock` dentro `.git` di una cartella di universo con nome già validato, senza seguire i link); nessuna voce V-NNN da aggiungere o aggiornare: V-007 resta chiusa.
### T210 · Il `heap out of memory` nel log della suite — `fatto` (`55e2e97`) (dipende da T205)
- Pipeline: claude · stima 2% · approvato · priorità 12
- Step: 27
- Contesto: le rinomine T188-T194 riportano un `heap out of memory` nel log di `npm test`, con tutti i test verdi. Non si sa di chi è né se un errore di quel tipo può nascondere un file di test non eseguito o un rosso. Proposta dell'orchestratore, approvata nell'autonomia del 03/11. (`dossier T194`)
- Cosa fare: trova quale processo finisce la memoria (worker di Vitest, un mondo avviato da un test, un figlio) e con quale test. Se è un mondo di prova col suo limite voluto (`QUINE_MONDO_MEMORIA`, ADR-0110) e il test se lo aspetta, scrivilo e chiudi. Se è altro, correggilo; se la correzione è grande, descrivila nell'esito e fermati.
- Test: suite intera col suo turno, due giri, senza quell'errore o con la spiegazione del perché resta.
- Browser: non serve.
- Quando è fatto: commit su `task/T210` se c'è da cambiare qualcosa; nell'esito la causa, con il numero dei file di test eseguiti rispetto a quelli attesi.
- Esito: causa: il `heap out of memory` viene da un mondo di prova del test `V-007 oltre il limite di memoria muore lui solo, e riparte` (`tests/sicurezza/mondo.test.ts`, `memoryMb: 200` + `sonda-gonfia`), che muore apposta e stampa nel log perché il figlio eredita lo stderr; riprodotto col solo test e confermato in due giri della suite: 1 solo `FATAL ERROR` per giro, heap a 196-197 MB, 108 file eseguiti su 108 attesi, 1448 test verdi, nessun `Unhandled` o `Worker exited`, quindi non nasconde né file né rossi. Il messaggio resta, voluto; cambiato solo un commento sopra il test (commit `55e2e97`), typecheck verde, test rilanciato verde, i due giri sono di prima del commento. Non provato: un esaurimento di memoria in un worker di Vitest (qui non avviene). Sicurezza: nessuna superficie nuova.
### T211 · Il commit dell'universo che fallisce e si perde — `fatto` (`27031cc`)
- Pipeline: claude · stima 2% · approvato · priorità 12
- Step: 27
- Contesto: nasce da T205 (`dossier T205`): alla prima partenza si è visto una volta «fetch failed» su `UniverseClient.commit` (`src/kernel/universes.ts`), il commit dell'Arbitro è andato perso e mondo e disco sono rimasti diversi. Causa non accertata, non ripetuto in tre partenze. La regola 6 di `AGENTS.md` dice che si committano gli stati validi: uno perso in silenzio non torna con `R`. Proposta dell'orchestratore, approvata nell'autonomia del 03/11.
- Cosa fare: leggi cosa succede oggi a un commit fallito (chi lo chiama, se lo stato resta da scrivere, se il commit seguente lo recupera). Se il commit seguente porta già tutto, scrivilo con un test e chiudi. Altrimenti fai in modo che un fallimento di rete non perda il commit (ritenta, o resta in attesa del prossimo) senza bloccare il gioco e senza riordinare i commit; un rifiuto del server (percorso non ammesso, permesso) non si ritenta. Cerca anche perché il server non rispondeva alla prima partenza, senza fermarti su questo se non si riproduce.
- Test: un test offline con un `fetch` che fallisce una volta: niente di perso su disco alla fine; uno con un rifiuto del server: nessun ritento. Suite intera col suo turno, typecheck.
- Browser: non serve.
- Quando è fatto: commit su `task/T211`; nell'esito cosa succedeva prima, cosa succede ora e se la causa del «fetch failed» è stata trovata. Sicurezza: nessuna superficie nuova, o le voci aggiunte.
- Esito: prima un commit fallito andava perso, perché il seguente porta solo la sua differenza; ora `UniverseClient` tiene i commit in fila senza riordinarli (senza risposta o 408/429/502/503/504: tre tentativi, poi in attesa con nuovo tentativo a ogni commit e ogni 30 s; altri 5xx: tre tentativi, poi scartato; altri 4xx: nessun ritento) e `checkout`, `clone`, `branch`, `merge` non passano sopra un commit in attesa; ADR-0122, regola 6 di `AGENTS.md`, test in `tests/universe-commit.test.ts`; suite 109 file/1466 test verde, typecheck verde. Causa del «fetch failed» non trovata: è la dicitura di Node, quindi probabilmente il processo di un mondo; l'ipotesi del keep-alive a ciclo bloccato non si riproduce (0/30 con blocco, 0/2 senza), i log di T205 non ci sono più, ora `lastError` riporta il codice sottostante. Non coperto: fila solo in memoria e senza tetto, `putMap`, `branch` e `merge` non ritentano, un token scaduto (401) perde il commit come rifiuto. Non provato: un mondo vero con il server che cade (provati client con `fetch` finto e un server `http` vero con lo store reale). Sicurezza: nessuna superficie nuova.


### T212 · La cache delle forme legge da IndexedDB tutto ciò che ha — `fatto` (`783317a`)
- Pipeline: claude · stima 2% · approvato · priorità 13
- Step: 27
- Contesto: nasce da T175 (`dossier T175`, ADR-0108): ogni caricamento legge da IndexedDB tutti gli 1,77 GB per usarne 49 MB, perché griglie e mesh stanno insieme nello stesso valore.
- Cosa fare: tieni griglie e mesh in due archivi, così che un caricamento legga solo le mesh che servono e la griglia solo quando un `Form.remake` la chiede. Alza `FORMS_DB_VERSION` senza perdere il gioco: una cache vecchia si migra o si scarta, mai un errore. Il tetto di 4 GB e l'LRU valgono sul totale. Misura prima e dopo: byte letti e tempo al secondo caricamento.
- Test: offline con l'IndexedDB finto (una griglia non letta finché non serve, migrazione dalla versione 4, tetto rispettato). Suite intera col suo turno, typecheck.
- Browser: serve. Build di produzione, `?skip&offline&formecache`, scheda nuova per ogni misura (`usedJSHeapSize` conta la pagina precedente se si ricarica nella stessa scheda): il mondo si disegna, 0 lavori ai worker e 0 forme fallite al secondo caricamento, la corona arriva intera.
- Quando è fatto: commit su `task/T212`; nell'esito le misure prima e dopo e cosa non è stato provato. Sicurezza: nessuna superficie nuova, o le voci aggiunte.
- Esito: griglie e mesh in due archivi di IndexedDB (`forms`, `meshes`, `FORMS_DB_VERSION` 5, la cache vecchia si scarta con 147 lavori una volta e nessun errore, provato anche nel browser); `Forms.get` usa `FormRunner.withoutMeshes`, le mesh arrivano con `geoOf` → `Form.remake`, solo per ciò che si disegna; il tetto di 4 GB e l'LRU valgono sul totale, una voce esce intera, leggere la sola griglia conta come uso. Secondo caricamento: byte letti da 1861 a 70 MB, forme pronte da 10/131 a 3,4 s a 129/129 a 2,0 s, tutte le 147 pronte invariate (9,4 contro 9,2-9,8 s, le ultime sono chieste tardi), heap da 155 a 115-118 MB, disco 540→541 MB, 0 lavori, 0 fallite. Cambiato rispetto al previsto: la griglia non si può leggere solo su `remake` perché il kernel la vuole subito (16 MB su 1861), quindi si leggono tutte le griglie e solo le mesh disegnate, e `remake` rilegge la voce intera; in più la geometria si fa all'arrivo delle mesh (`remake(arrived)`), che porta l'arrivo alla corona da 7,3 GB e circa 16 s a 1,25 GB e 5,2 s (il codice di prima alla corona non è misurato), e le icone aspettano con `geoWhenReady`. Suite 109 file/1490 test verde, typecheck verde. ADR-0108 e `architettura-dettagli.md` aggiornati. Non provato: superamento del tetto in un browser vero (solo IndexedDB finto), multigiocatore, un universo diverso dal seme. Da guardare a parte: circa 1,3 frame al secondo alla corona, causa non accertata; un sostituto per un istante sui modelli al caricamento, dedotto dal codice e non osservato. Sicurezza: nessuna superficie nuova.

### T213 · Il gioco a 1,5 frame al secondo nella verifica di T175: è il codice o la scheda? — `fatto` (`5c899cd`)
- Pipeline: claude · stima 1.5% · approvato · priorità 14
- Step: 27
- Contesto: nasce da T175 (`dossier T175`): la scheda di verifica girava a circa 1,5 frame al secondo, causa non accertata e senza confronto col codice di prima; anche i 12-15 s per arrivare alla corona sono misurati a quel ritmo, quindi quel numero può non valere per un giocatore.
- Cosa fare: solo misura e diagnosi, niente correzioni. Misura i frame al secondo con la scheda in primo piano (`document.visibilityState`, renderer WebGL da `WEBGL_debug_renderer_info`: una scheda nascosta o una GPU software spiegano già tutto), sul base e sul commit che precede il merge di T175, stessa scena, stessa partita, build di produzione, `?skip&offline`. Rimisura il tempo per arrivare alla corona. Se il rallentamento viene dal codice, individua dove va il tempo di un frame e scrivilo nell'esito: la correzione sarà un task a parte.
- Test: nessun test nuovo se il codice non cambia.
- Browser: serve, è il task.
- Quando è fatto: esito con la tabella prima/dopo, il renderer e la visibilità della scheda, e la causa o ciò che la esclude. Commit su `task/T213` solo se c'è qualcosa da committare.
- Esito: diagnosi senza modifiche e senza commit (test e typecheck non lanciati): 1,5 fps di T175 non dipendono dal codice ma dalla scheda di Claude in Chrome, limitata a circa 1 Hz anche con pagina vuota (1,08 fps), thread libero (frame ≤15,5 ms, blocco massimo 15,9 ms), `visible`, RTX 2070; in Chrome headless con la stessa GPU prima e dopo fanno 60 fps con circa 5 ms di JS per frame. Arrivo alla corona: dopo 13,1 s nella scheda e circa 6 s a 60 fps (prima 2,1 s e 0,7-1,0 s), quindi il prezzo di T175 esiste ma è circa 6 s, non 12-15; si può correggere in un task a parte (forme rifatte dopo il tetto). Non provato: finestra vera in primo piano, meccanismo esatto del limite a 1 Hz (finestra non in primo piano o estensione), cambio di `forms.version` a 48,8 s in una prova, terreno a ovest della corona che cambia tra i caricamenti della build «dopo». Solo l'ultima coppia ha file identici, le altre lo stesso seme.

### T214 · Il terreno grigio a ovest della corona, che cambia tra un caricamento e l'altro — `fatto` (`4a9a7f1`)
- Pipeline: claude · stima 2% · approvato · browser · priorità 15
- Step: 27
- Contesto: nasce da T213 (`dossier T213`, `traccia T213`). Nella build che comprende T175 il terreno a ovest della corona è a volte grigio, a volte con acqua ed erba, e resta grigio anche a 40 s: non è un ritardo. Nelle poche catture della build precedente era sempre colorato, ma il legame con T175 non è accertato. Quella misura non comprendeva T212, che ha cambiato il modo in cui arrivano le mesh.
- Cosa fare: riproduci sul base attuale (build di produzione, `?skip&offline`, stesso universo, più caricamenti, spostandosi a (46, 0)). Confronta con il commit `2dad42c`, che precede T175, sugli stessi file. Trova la causa. Se è una forma tolta dal tetto e mai rifatta, o un'altra regressione della cache, correggila; se il comportamento c'era già o viene da altro, scrivi la causa nell'esito e non correggere nulla di estraneo alla cache.
- Test: se correggi, un test che fallisce senza la correzione.
- Browser: serve. Le misure di tempo vanno fatte in Chrome headless con la GPU vera: la scheda di Claude in Chrome è limitata a circa 1 Hz.
- Quando è fatto: esito con causa, frequenza osservata sul base e su `2dad42c`, screenshot descritti; il terreno si disegna uguale a ogni caricamento, oppure è detto perché no.
- Esito: nessuna modifica e nessun commit (test e typecheck non lanciati): non è una regressione della cache ma lo scostamento del tappeto salvato da `pagehide` (`saveState`, `applyWandererState`), che sposta (46, 0) di 46 caselle a ogni caricamento chiuso in modo ordinato, su neve (`n`) che alla luce della corona appare grigia; frequenza: stessa partenza 10/10 identici (5 base, 5 `2dad42c`) e con cache su disco 6/6, con posizione accumulata scostamenti 0, 46, 92, 138 e terreno che cambia allo stesso modo su entrambe le build; il terreno si disegna uguale a parità di universo e posizione, e cambia solo se cambia la posizione salvata; non provato: lo scostamento nelle catture originali di T213, i cui file non esistono più (causa dedotta dallo stesso schema), finestra vera, multigiocatore; da decidere a parte se chi chiude nella corona debba ripartire spostato, e l'avviso in `#convalida-browser` può entrare in T215; sicurezza: nessuna superficie nuova.

### T215 · Il prezzo di T175 per arrivare alla corona, rimisurato; l'avviso sulla scheda a 1 Hz — `fatto` (`c277555`)
- Pipeline: claude · stima 3% · approvato · browser · priorità 16
- Step: 27
- Contesto: nasce da T213 (`dossier T213`): a 60 fps l'arrivo alla corona era di circa 6 s contro 0,7-1,0 s del codice precedente a T175, ma la misura non comprendeva T212, che nella scheda lenta porta l'arrivo a 5,2 s. Nella scheda di Claude in Chrome il ritmo è di circa 1 Hz anche con pagina vuota: i tempi legati ai frame presi lì non valgono. In una prova di T213 c'è anche un ultimo cambio di `forms.version` a 48,8 s, mai indagato.
- Cosa fare: (1) in `docs/architettura-dettagli.md#convalida-browser` aggiungi l'avviso: nella scheda di Claude in Chrome misura prima una pagina vuota, e i tempi legati ai frame si prendono in Chrome headless con la GPU vera. (2) Rimisura l'arrivo alla corona sul base attuale, in headless, con la stessa definizione di T213 (ultimo cambio di `forms.version` dallo spostamento a (46, 0)), almeno tre volte, sugli stessi file di `2dad42c`. (3) Se resta sopra i 2 s, trova dove va il tempo (T213 indica le forme rifatte perché il tetto le ha tolte) e correggi senza alzare la memoria oltre i tetti dell'ADR-0108; se la correzione richiede di scegliere tra memoria e tempo, scrivi le due misure e lascia la scelta nell'esito. (4) Se il cambio tardivo di `forms.version` si ripresenta, di' cos'è.
- Test: se correggi, un test sul comportamento; nessun test nuovo per la sola misura.
- Browser: serve, in headless per i tempi.
- Quando è fatto: l'avviso è nel documento; esito con la tabella prima/ora e la memoria della scheda nei due casi.
- Esito: arrivo alla corona da 3,25 · 3,16 · 3,32 s a 1,30 · 1,22 · 1,00 · 1,90 · 0,88 s (T213: circa 6 s senza T212; prima di T175 0,7-1,0 s), cache vuota 4,18 s; blocchi del thread da 2,1-2,2 s a 0,28-0,54 s; memoria invariata (scheda alla corona 1493-1562 → 1468-1515 MB, prima di arrivare 286-352 → 259-290 MB, GPU 1023-1070 → 1025-1039 MB), quindi nessuna scelta tra memoria e tempo. Il tempo era del thread della pagina: mesh lette e decodificate in un worker con cessione dei buffer (`IdbFormStore.meshReader`, ripiego sulla pagina), sfera di ingombro calcolata da three quando disegna, `askCampusModels` a ogni frame; avviso sulla scheda a 1 Hz in `#convalida-browser`; ADR-0108, `architettura-dettagli.md` e `AGENTS.md` aggiornati, 6 test nuovi; suite 111 file/1508 test e typecheck verdi. Cambio tardivo di `forms.version`: non ripresentato, causa non accertata (7 prove su 15 oltre i 48,8 s, tutte prima di `askCampusModels`; le 5 finali durano 45 s). Non provati: finestra vera in primo piano, multigiocatore, superamento del tetto su disco. Da guardare a parte: 1-3 lavori ai worker al caricamento (T212 ne contava 0), la scultura del plinto con un seme nuovo a ogni arrivo (di solito un lavoro e una voce in più su disco), il terreno a ovest che cambia, l'universo su disco che cresce tra le prove (stesse forme, non lo stesso stato salvato). L'anello si ricostruisce al più una volta al secondo, quindi ciò che si vede può arrivare fino a 1 s dopo l'ultimo `forms.version`. Sicurezza: nessuna superficie nuova.

### T216 · L'avviso sullo scostamento del tappeto salvato nelle prove con teleport — `fatto` (`023db5b`)
- Pipeline: claude · stima 1% · approvato · priorità 17
- Step: 27
- Contesto: nasce da T214 (`dossier T214`): il terreno grigio a ovest della corona non è una regressione della cache. `pagehide` salva lo scostamento del tappeto (`saveState`, `applyWandererState`), che sposta `?dev&teleport=46,0` di 46 caselle a ogni caricamento chiuso in modo ordinato: scostamenti 0, 46, 92, 138 e terreno che cambia con loro. Chi confronta due caricamenti sullo stesso profilo guarda posti diversi.
- Cosa fare: in `docs/architettura-dettagli.md#convalida-browser`, vicino a `?dev&teleport`, aggiungi l'avviso in poche righe: la posizione del teleport si somma allo scostamento salvato, quindi per confrontare due caricamenti si riparte da un profilo pulito o si controlla la posizione prima di guardare o misurare. Solo documentazione, nessun cambio al codice.
- Test: nessuno.
- Dipende da T215 (tocca la stessa sezione).
- Quando è fatto: l'avviso è nel documento.
- Esito: avviso aggiunto in `#convalida-browser` (`023db5b`), solo documentazione; rispetto al previsto dice che il profilo pulito non basta, perché la posizione sta in `universes/<nome>/world/giocatori/io.json`, quindi si rimette una copia dell'universo o si controlla `k.carpet().ox`/`.oy`; non lanciati `npm test`, typecheck e prova nel browser (nessun test legge il file; accumulo da T214 e dal codice); sicurezza: nessuna superficie nuova.

### T217 · Il vetro del lampione della corona non lascia passare la luce: lo stesso rendering dell'editor — `fatto` (`beb677f`)
- Pipeline: claude · stima 1.5% · approvato · priorità 1
- Step: 15
- Contesto: richiesta dell'autore (03/11): «Il vetro del lampione della corona non si comporta come nell'editor, non lascia passare proprio la luce. Voglio che il rendering sia lo stesso che nell'editor. Anche il lab3d ha il comportamento atteso». Il modello è `corona-lampione` (T113: `dossier T113`), messo nella corona da `src/kernel/corona.ts`. I riferimenti giusti sono l'editor (`lab/editor/`) e il sandbox `lab/3d/`, dove il vetro è `matGlass` (`lab/3d/main.ts`); nel gioco è `MAT.coronaGlass` (`src/render/materials.ts`), scelto in `src/render/models.ts`. La causa non è accertata. Prima ipotesi da provare: il ciclo dei `props` di `buildCoronaRing` (`src/render/corona3d.ts`) crea `new THREE.Mesh(bg, mat)` con un solo materiale, mentre `models.ts` passa `[mat, glassMat]` quando la geometria ha i gruppi, quindi il vetro dei props verrebbe disegnato opaco; vale anche per le ombre (`castShadow`). Poi confronta materiali, luci e cosa fa `cartoonOn` sul vetro, anche con il cartone spento.
- Cosa fare: trova perché il vetro del lampione nella corona blocca la luce e correggilo perché si veda come nell'editor. Correggi la causa nel materiale o nelle luci condivise, senza un caso speciale per questo modello, e guarda se lo stesso difetto tocca gli altri vetri del gioco (`MAT.glass`, `MAT.cutGlass`): di' nell'esito cosa cambia per loro.
- Test: un test sul materiale o sulla mesh se la causa si può fissare fuori dal browser; altrimenti scrivi nell'esito perché non c'è.
- BROWSER: confronto a vista nella corona (`?skip&offline&dev&teleport=46,0`, attenzione allo scostamento salvato, `#convalida-browser`) e nell'editor, stesso lampione, con le catture dei due nell'esito; anche di notte se la luce del lampione conta lì, e con `?cartone` per non rompere T89a.
- Quando è fatto: il vetro del lampione nella corona lascia passare la luce come nell'editor e in `lab/3d/`, verificato a vista.
- Esito: il vetro dei modelli della corona ora è trasparente perché ogni mesh prende i materiali da `modelMaterials` (causa: un solo materiale su una geometria a due gruppi); stessa correzione per i modelli dei terreni e le icone, `casts` riconosce il taglio anche con due materiali, `MAT.glass` e `MAT.cutGlass` invariati per ciò che passava già da `modelObject`; aggiunti `tests/glass.test.ts` e una riga in `docs/architettura-dettagli.md`; test e typecheck verdi; sicurezza: nessuna superficie nuova; non provati a vista i modelli dei terreni con vetro (nessuno nel seme) e `lab/3d/` (codice del vetro identico all'editor); le luci della corona restano più deboli di quelle dell'editor.

### T218 · Gli alberi di luce della corona non si vedono — `fatto` (`2b1d6a8`)
- Pipeline: claude · stima 1.5% · approvato · priorità 1
- Step: 15
- Contesto: richiesta dell'autore (03/11): «Gli alberi luce della corona non sono visibili, dal codice sembrano essere stati disposti ma non li vedo». Il kernel li dispone in `src/kernel/corona.ts` (`addProp('albero', 'corona-albero-luce', …)`, tre per settore, nati con T50e), il renderer li disegna nel ciclo dei `props` di `buildCoronaRing` (`src/render/corona3d.ts`) con `MAT.sway`, gli altri con `MAT.corona`. La causa non è accertata. Da controllare in quest'ordine: il programma `universe/models/corona-albero-luce.xml` produce voxel con quel seme; la forma arriva (`k.forms.ready`, il tetto della cache di T175 e il censimento di `kernel.ts`); `MAT.sway` regge i frame e i colori dei vertici; le posizioni cadono dentro un edificio o sotto il terreno; `campusKey` ricostruisce l'anello quando la forma è pronta.
- Cosa fare: trova perché non si vedono e correggi la causa, senza spostare gli alberi né cambiare il modello se non è lì il difetto. Di' nell'esito quanti alberi ci sono nella corona e quanti ne vedi.
- Test: un test sulla causa se si può fissare fuori dal browser (per esempio che il programma dia una griglia non vuota per ogni seme usato); altrimenti scrivi nell'esito perché non c'è.
- BROWSER: nella corona, catture da almeno due settori, a modelli caricati; poi un secondo caricamento, perché la cache delle forme non li faccia sparire.
- Dipende da T217 (tocca lo stesso ciclo dei `props`).
- Quando è fatto: gli alberi di luce si vedono nella corona, verificato a vista, anche al secondo caricamento.
- Esito: gli alberi di luce della corona si vedono: 26 presenti, 26 visti; causa: `MAT.sway` scartava tutto oltre il raggio 42 a corona rivelata, lasciando solo l'ombra; aggiunto `MAT.coronaSway` (stesso vento, senza taglio, vetro `MAT.coronaGlass`) scelto da `geo.sway`, contorno di `?cartone` compreso; aggiunti `tests/corona-trees.test.ts` e una riga in `docs/architettura-dettagli.md`; test e typecheck verdi, con un `FATAL ERROR: heap out of memory` nell'output della suite (codice 0, tutti i file passati; probabile prova del limite di memoria dei mondi, non accertato); sicurezza: nessuna superficie nuova; non provati il vento a vista (coperto dal test sullo shader) e un albero con vetro nel browser (il modello non ne ha); modello e posizioni invariati, la luce puntiforme del lab resta assente nel gioco.

### T219 · Il viale della corona: due cerchi perfetti al posto delle caselle seghettate — `fatto` (`eaeacc6`)
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 15
- Contesto: richiesta dell'autore (03/11): «La strada seghettata della corona: dalla prima "corona" che abbiamo implementato abbiamo lasciato una "strada" graficamente povera. Le tiles designate come strada presentano una riga orizzontale, sempre nella stessa direzione. Voglio che invece i due estremi della strada siano due cerchi perfetti concentrici». La strada è il suolo `viale` di `buildCoronaRing` (`src/render/corona3d.ts`): caselle quadrate con il colore di `GROUND`, e la riga è `glow.box(x, …, y + 0.45, x + 1, …)`, uguale in ogni casella qualunque sia la sua direzione sull'anello. Il raggio e la linea stanno in `CAMPUS` (`src/kernel/corona.ts`).
- Cosa fare: disegna il viale come una corona circolare con il bordo interno e il bordo esterno cerchi perfetti e concentrici, con abbastanza segmenti da non vedere spigoli alla distanza della camera. Togli la riga orizzontale da ogni casella. Se serve una linea di luce, è anch'essa un cerchio concentrico. Il prato deve toccare i due bordi senza fessure né z-fighting, e anche i vicoli, gli ingressi degli edifici e ciò che sta sul viale devono restare a posto. La griglia delle caselle del kernel non cambia, a meno che non serva: il cambio è di disegno. Guarda se il bordo disegnato e ciò che blocca il cammino restano coerenti (regola 10): di' nell'esito cosa hai trovato.
- Test: un test sulla geometria se la funzione si può isolare (ogni vertice di bordo sta al suo raggio, i centri coincidono); altrimenti scrivi nell'esito perché non c'è.
- BROWSER: catture del viale dall'alto, su un tratto dritto per la griglia e su uno in diagonale, con `?cartone` e senza, di giorno e di notte.
- Quando è fatto: i due bordi del viale sono cerchi perfetti concentrici e la riga orizzontale non c'è più, verificato a vista.
- Esito: i due bordi del viale sono cerchi perfetti concentrici (360 segmenti) e la riga orizzontale non c'è più; il suolo si taglia sul cerchio esterno senza fessure né sovrapposizioni; aggiunti due cerchi di luce tenui sui bordi perché quello esterno non si vedeva; regola 10: le caselle attraversate dal cerchio interno con il centro dentro erano un muro invisibile, ora esistono come viale (`src/kernel/corona.ts`); test di geometria e di cammino in `tests/corona.test.ts`; non provato: con `?cartone` la vista della porta solo di giorno, porte degli edifici a blocco mai guardate; restano a gradini il bordo della simulazione su terreno rialzato, i vicoli e i blocchi degli edifici; il trenino nelle catture sembra nella corsia interna, non controllato se è prospettiva.

### T220 · Il pavimento a esagoni nelle sale del Concilio — `fatto` (`b21d65e`)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 15
- Contesto: richiesta dell'autore (03/11): «Il pavimento a esagoni nelle sale del concilio: voglio che la griglia del pavimento delle varie sale dei membri del concilio abbia un pattern esagonale anzichè quadrato». La griglia sta in `src/render/corona3d.ts`, nel disegno della stanza (le due righe `lines.box` con `GRID`, colore della stanza, tenue e senza bloom, T49a). È la stessa per ogni stanza dello studio, e ogni edificio ha la sua squadra (`ROOMS` in `src/kernel/corona.ts`). Scelta dell'orchestratore, da correggere se l'autore la vuole diversa: gli esagoni valgono per tutte le stanze dello studio, non solo per la Sala del Concilio.
- Cosa fare: sostituisci la griglia quadrata con una griglia esagonale, tagliata pulita ai bordi del pavimento, con la stessa tenuità di `GRID` e lo stesso colore. Le linee sono oblique, quindi `lines.box` non basta: usa quad sottili nello stesso builder, così resta una sola geometria. Solo disegno: caselle, cammino, scaffali e piattaforme restano sulla griglia quadrata del kernel. Lato dell'esagono intorno a una casella. Tieni d'occhio il numero di triangoli (stanze per piani) e dillo nell'esito.
- Test: nessuno se è solo disegno; scrivi nell'esito se ne hai aggiunto uno.
- BROWSER: catture dall'interno della Sala del Concilio e di almeno un'altra stanza, con `?cartone` e senza; procedura per entrare in una stanza in `#convalida-browser`.
- Quando è fatto: il pavimento delle stanze ha la griglia esagonale, verificato a vista, e l'esito dice il costo in triangoli.
- Esito: griglia esagonale (lato 1 casella, centrata, tagliata ai bordi, stesso colore e tenuità) su tutte le stanze dello studio con `hexEdges` e `hexLines` in `corona3d.ts`; costo 679 triangoli per stanza contro 370 (+309, al massimo circa 4.600 su 15 stanze); aggiunti 2 test in `tests/corona.test.ts`; `npm test` e typecheck verdi; solo disegno, nessuna superficie di sicurezza nuova; non accertati l'origine del `FATAL ERROR` di heap nel log dei test (suite comunque verde) e il blocco scuro nello Studio dei Personaggi, in codice non toccato.

### T221 · Il suono come programma MarkovJunior: la lingua in XML, il sintetizzatore puro, i preset — `fatto` (`a6ee6e6`)
- Pipeline: claude · stima 3.5% · approvato · priorità 1
- Step: 25
- Contesto: richiesta dell'autore (03/11): «colonna sonora e effetti sonori generati proceduralmente con MJ (e l'IA genera i programmi). Abbiamo fatto una prova di implementazione di un sintetizzatore MJ. I risultati sono eccezzionali. Voglio integrarlo, ti passo il mockup, la demo creata da Argon in browser. La sintassi è diversa, è json invece di xml, quindi riadattalo, voglio che i programmi MJ siano solo xml. Inoltre assicurati che siano presenti tutte le funzioni MJ e completa il mockup per renderlo operativo». Il mockup è `docs/userchats/mj_3d_soundlab_sintetizzatore_musicale_markovjunior.html`: ha un suo motore MJ in JavaScript e programmi in JSON. La griglia è la partitura: X il tempo, Y la traccia (0 lead, 1 pad, 2 basso e batteria), Z l'altezza sulla scala, i simboli il tipo di evento (nota, sustain, accento, ghost, marcatori nascosti); `SoundEngine` suona con Web Audio (filtro, delay, compressore, swing) e il rumore viene da `Math.random`. Oggi nel gioco c'è solo `src/audio.ts` (`Sfx`, pochi blip).
- Cosa fare: (1) la lingua: i programmi sonori sono XML del motore vero (`src/mj/xml.ts`, `model.ts`, `engine.ts`), senza un secondo motore né JSON; i parametri musicali (bpm, scala, tonica, swing, strumenti, mix) stanno nell'XML. Confronta i nodi e gli attributi del mockup (`one`, `all`, `prl`, `markov`, `sequence`, `path` con `inertia` e `longest`, `conv`, `unions`, `steps`) con il motore: ciò che manca lo aggiungi al motore, per tutti i programmi, senza cambiare il risultato di quelli che ci sono. Un test prova in un programma sonoro ogni nodo che il motore conosce. (2) la partitura: una funzione pura griglia → eventi. (3) il sintetizzatore: **una sola fonte del suono**, una funzione pura partitura + seme → campioni, che gira anche in Node e in un worker, senza `Math.random` né orologio; il browser suona quei campioni. Ciò che un agente misura è ciò che il giocatore sente. Riproduci il carattere del grafo Web Audio del mockup (inviluppi, filtro, delay, compressore, swing, batteria): è il suono che all'autore è piaciuto. (4) i preset del mockup, tutti, tradotti in XML in un posto che i test leggono. (5) decidi dove stanno i programmi sonori in un universo, restando nell'elenco di `src/kernel/paths.ts` (consigliato: dentro `models/`, con una classe propria in `index.json`). ADR, voce in `AGENTS.md`, sezione in `docs/architettura-dettagli.md`, voci in `docs/glossario.md` per i concetti nuovi.
- Test: stessi programma e seme danno campioni identici; ogni preset dà una partitura non vuota su ogni traccia che dichiara e un segnale senza NaN e senza clipping; i programmi visivi esistenti danno le griglie di prima.
- Quando è fatto: tutti i preset del mockup girano in XML sul motore vero e diventano campioni in Node; `npm test` e `npm run typecheck` verdi. Nessuna pagina: è il pezzo successivo.
- Esito: programmi sonori in XML sul motore vero (`<sound>`, `map clear="False"`, engine.ts invariato), `src/mj/sound.ts` griglia→partitura, `src/mj/synth.ts` partitura+seme→campioni come unica fonte, i 4 preset in `universe/models/suono-*.xml` con classe `suono`, validatore, `Sfx.playSamples`, ADR-0123, AGENTS, dettagli, glossario; test su ogni nodo, campioni identici, preset su 8 semi, griglie visive invariate rispetto alle impronte del commit di partenza. Scostamenti: preset 1 del mockup non compilava (corretto secondo il suo commento), preset 3 con pad garantito, picco scalato a 0,98 invece del taglio. Non provato: nessun ascolto umano, `playSamples` solo typecheck; confronto una tantum con il grafo Web Audio in Chrome: inviluppo 0,973–0,999. Manca: pagina, agente che scrive suoni, wfc/convchain/observe/field (non usati dal mockup). Sicurezza: nessuna superficie nuova (il validatore limita griglia e tempo, il `<sound>` è validato con tetti su eventi e durata).

### T222 · Il SoundLab nel laboratorio: il mockup reso operativo per il lavoro a mano — `fatto` (`6912da5`)
- Pipeline: claude · stima 2.5% · approvato · priorità 1
- Step: 25
- Contesto: richiesta dell'autore (03/11): «Dotalo di tutte le funzionalità necessarie per il lavoro manuale (io in browser nel lab)». Il mockup è `docs/userchats/mj_3d_soundlab_sintetizzatore_musicale_markovjunior.html`; le pagine del laboratorio sono `lab/3d/` e `lab/editor/`, da cui riusare editor XML e salvataggio.
- Cosa fare: una pagina `/lab/suono/` (senza CDN, niente Tailwind né font esterni) che porta tutto ciò che il mockup sa fare: preset, editor del programma (ora XML, con errori e diagnostica), vista a voxel 3D, piano roll modificabile, passi del programma avanti e indietro, morph del loop, oscilloscopio, manopole (bpm, swing, cutoff, spazio, scala, tonica, volume e muto per traccia), export WAV. Completa ciò che è demo: carica e salva l'XML su disco come l'editor, seme esplicito e ripetibile, una modifica nel piano roll si riflette in qualcosa che si può salvare (se non è esprimibile nel programma, dillo a vista). Il suono viene dal sintetizzatore puro del task richiesto, non da un secondo grafo Web Audio; una manopola agisce senza scatti udibili.
- Test: la logica della pagina che si può isolare (piano roll → griglia, salva e ricarica dà lo stesso XML).
- BROWSER: ogni preset si carica e suona (misura il segnale all'uscita con un `AnalyserNode`, oltre alle catture), export WAV aperto e controllato, modifica salvata e ricaricata. Confronto col mockup: stesso preset nelle due pagine, inviluppo e spettro nell'esito. L'agente non sente: chiudi con l'elenco di ciò che l'autore deve ascoltare.
- Dipende da T221.
- Quando è fatto: l'autore può scrivere, ascoltare, correggere e salvare un programma sonoro in browser, verificato a vista, con il confronto col mockup nell'esito.
- Esito: pagina `/lab/suono/` (`lab/suono/`: `index.html`, `main.ts`, `logic.ts`, `worker.ts`, `player.ts`, `voxels.ts`, `soundlab.css`) con preset, editor XML con errori e diagnostica, piano roll a trascinamento che scrive ritocchi `<box>` nel programma (se non si può lo dice a vista), voxel 3D in three.js, passi avanti e indietro, morph, oscilloscopio, manopole in `<sound>`, volume e muto per traccia (il muto solo ascolto), apri e salva XML col seme in un commento, WAV intero o solo ciclo, Annulla, bozza nel browser; il suono solo da `src/mj/synth.ts`, due worker e dissolvenza di 60 ms allo stesso punto del ciclo. Test in `tests/soundlab.test.ts`; `tests/glossario.test.ts` legge anche `lab/suono/`; voce Ritocco, `lab/README`, dettagli `#suono`, `AGENTS`; niente ADR. Suite intera verde (116 file, 1584 test) lanciata prima degli ultimi ritocchi di testo e CSS, dopo i quali typecheck, build e i 4 file collegati sono verdi. Non provato: dialogo «Apri» e scrittura reale su disco (download intercettati, file simulato), `npm run dev`, nessun ascolto umano. Sicurezza: nessuna superficie nuova (pagina di laboratorio, non servita dal server di produzione, nessuna rotta nuova).

### T223 · L'analisi automatica dei programmi sonori per gli agenti — `fatto` (`abc5803`)
- Pipeline: claude · stima 1.5% · approvato · priorità 1
- Step: 25
- Contesto: richiesta dell'autore (03/11): «tutte le funzionalità necessarie […] per l'analisi automatizzata dei risultati da parte degli agenti». Un agente non sente: deve leggere il risultato come testo. C'è già la traccia dei programmi (`src/mj/trace.ts`, ADR-0118, `lab/banco/traccia.md`) e il banco della varianza (`lab/banco/varianza.ts`).
- Cosa fare: un comando in `lab/scripts/` che da un programma XML e dai semi dà il WAV, la traccia MJ e un rapporto in testo: note per traccia e per battuta, estensione, densità, ripetizione e varianza tra i semi, tonalità effettiva contro quella dichiarata, picco e RMS, silenzi, clipping, spettro per bande, durata del loop e continuità alla giuntura. Soglie che dicono «vuoto», «piatto», «ripetitivo», «stonato», «fuori volume», che servono anche al validatore del Concilio: la funzione sta dove `src/` può importarla, il comando in `lab/`. Una guida breve per chi scrive programmi sonori, in `lab/banco/`, che dice anche che cosa le misure non possono dire. Calibra le soglie sui preset: passano tutti, e un programma costruito apposta per ogni difetto viene segnalato.
- Test: i casi costruiti, uno per difetto; il rapporto è deterministico.
- Dipende da T221.
- Quando è fatto: un agente, senza browser né chiamate ai modelli, dice da un XML cosa suona e cosa non va; `npm test` e `npm run typecheck` verdi.
- Esito: `src/mj/soundanalysis.ts` (misure di partitura e campioni, rapporto deterministico, `SOUND_THRESHOLDS` calibrate sui preset e a maggioranza dei semi), `lab/scripts/mjx-sound.ts` e `wav.ts` (WAV, traccia, rapporto), validatore con le stesse soglie (semi 1, 2, 3, segnale solo sul primo, nessun rendering se basta la partitura), `rawPeak` in `RenderedSound`, guida `lab/banco/suono.md`, ADR-0125, AGENTS, dettagli, glossario, `tests/soundanalysis.test.ts` (un caso per difetto); `npm test` e typecheck verdi. Scostamenti: difetto in più `giuntura`, tonalità effettiva solo come dato, sotto una battuta il programma è un effetto. Non provato: nessun ascolto umano; `giuntura` e dinamica minima solo su campioni costruiti; 4 terne di semi su 598 danno un falso difetto su Architettura Frattale; il cutoff molto basso non è segnalato. Sicurezza: nessuna superficie nuova; il validatore fa un rendering sincrono in più, limitato dai tetti di `renderScore` e da quello di eventi a passo, che in un caso limite può costare qualche secondo.

### T224 · La colonna sonora e gli effetti nel gioco — `fatto` (`cdf5bce`)
- Pipeline: claude · stima 3% · approvato · priorità 2
- Step: 25
- Contesto: richiesta dell'autore (03/11): «colonna sonora e effetti sonori generati proceduralmente con MJ». Scelta dell'orchestratore, da correggere se l'autore la vuole diversa: musica per ambiente e momento del giorno, effetti per ciò che oggi fa `Sfx` (`src/audio.ts`) e per le azioni principali. Regola 11 e `#semi`: un programma per tipo, le istanze sono semi; la simulazione non estrae dall'orologio.
- Cosa fare: programmi di partenza nel seme `universe/`, a mano, pochi e per tipo. Il direttore del suono sceglie cosa suona dallo stato del mondo; il rendering sta in un worker e in cache come le forme, e non ferma mai il thread principale; dissolvenze ai cambi, volume e muto nel menu, sblocco dell'audio al primo gesto. `Sfx` passa dal nuovo percorso senza perdere i suoni di oggi. Un programma che fallisce tace e non rompe il gioco (regola 7). In multigiocatore il suono è del client e non chiede messaggi nuovi. Misura costo di rendering e memoria.
- Test: la scelta del brano da uno stato è pura e deterministica; un programma rotto non getta eccezioni.
- BROWSER: con `?skip&offline`, nessuna caduta di fps misurabile fuori dalla scheda a 1 Hz (avviso in `#convalida-browser`), segnale all'uscita con un `AnalyserNode` al cambio di ambiente e per ogni effetto, muto che tace. L'agente non sente: chiudi con l'elenco di ciò che l'autore deve ascoltare.
- Dipende da T221.
- Quando è fatto: il gioco ha musica ed effetti dai programmi MJ del seme, verificati a vista e con le misure.
- Esito: musica ed effetti del gioco dai programmi MJ del seme (7 brani e 9 effetti `universe/models/suono-*.xml`, campo `suono` in `index.json`); `src/audio/`: `director.ts` (scelta pura `chooseMusic`, attesa ai confini, 4 varianti, `SOUND_CUES`), `renders.ts` e `worker.ts` (un worker, cane da guardia a 20 s, 64 MB in memoria, IndexedDB 256 MB su disco), `prepare.ts`, `sfx.ts` (spostato da `src/audio.ts`; tolti `blip`/`noise`/`chord`/`playSamples`); volume e muto in cima al pannello d'aiuto, in `localStorage`; sblocco al primo tasto o clic; ADR-0125, AGENTS, dettagli `#suono`, glossario; `tests/sounddirector.test.ts`; `npm test` (1644) lanciato prima delle ultime modifiche ai soli documenti, poi verdi typecheck e test collegati; `npm run typecheck` verde. Scostamenti: il menu sta nel pannello d'aiuto perché il gioco non ha altri menu; nei test i «preset» sono ora i programmi senza `suono`; `SOUND_CACHE_VERSION` da alzare se cambia il sintetizzatore, inchiodato da un test. Limiti: in multigiocatore niente suono per `item:crafted`, `forge:done` e salto, perché il client non li riceve (nessun messaggio nuovo per condizione); i livelli degli ambienti sono stati misurati prima dell'ultimo riequilibrio. Non provato: multigiocatore dal vivo, nessun ascolto umano, T223 non è nel branch quindi le sue soglie non sono state applicate. Da ascoltare: i 7 brani (Notte molto più bassa), equilibrio musica/effetti, dissolvenze e giuntura del ciclo, effetti contro i vecchi blip. Sicurezza: nessuna superficie nuova (programmi già limitati dal motore, nel worker; indice letto con controllo dei tipi; nessuna route né messaggio).

### T225 · Il Musicista: un membro del Concilio nella casa dell'Artista — `fatto` (`9c8f546`)
- Pipeline: claude · stima 3% · approvato · priorità 2
- Step: 25
- Contesto: richiesta dell'autore (03/11): «dobbiamo creare un membro del concilio musicista, ma la corona è già troppo piena di palazzi, io forse lo metterei nella casa dell'artista». Decisione dell'orchestratore, sulla proposta dell'autore: nessun edificio nuovo, sta nella `galleria` (`ROOMS` in `src/kernel/corona.ts`, team `artista`), che oggi ha una squadra sola. Gli agenti stanno in `src/kernel/agents/council.ts` (`AgentId`).
- Cosa fare: l'agente `musicista`, coi passi di `AGENTS.md` per un compito nuovo: schema Gemini, risposta in `MockAiModels`, voce nel registro, prompt in `universe/prompts/agents/musicista.md`, tabella del Concilio. Scrive i programmi sonori XML di ciò che il mondo chiede; il validatore li esegue di prova e applica le soglie dell'analisi, e l'invalido torna a lui col motivo (regola 2); niente meta-gioco nei nomi (regola 0). Coperto da `councilMayWrite`, da `chi` e dalle carte come gli altri contenuti, con i coefficienti di generazione e il «Low Detail» (ADR-0085). Nella corona: il Musicista si vede al lavoro nella casa dell'Artista, senza edifici nuovi, e la stanza regge due squadre senza un caso speciale; il Referente gli porta le richieste. ADR se il modello «una stanza, una squadra» cambia.
- Chiamate vere: al più 10 di testo per provare il prompt; tutto il resto offline.
- Test: Concilio offline, da una richiesta a un programma valido e committato; un programma che fallisce le soglie torna indietro; un test sulla stanza con due squadre.
- BROWSER: nella casa dell'Artista con `?skip&offline&dev`, catture del Musicista al lavoro; un programma generato suona nel gioco, con il segnale misurato.
- Dipende da T223, T224.
- Quando è fatto: il Musicista scrive programmi che passano il validatore e suonano nel gioco, e lo si vede nella casa dell'Artista.
- Esito: agente `musicista` (`sound.compose`, `src/kernel/agents/composer.ts`, prompt `universe/prompts/agents/musicista.md`): schema Gemini, risposta in `MockAiModels`, voce nel censimento, tabella del Concilio; il validatore esegue il programma e applica le soglie, più nomi del mondo (regola 0) e minimo 32 passi per un brano; l'invalido torna a lui col motivo, due volte al più. `ScoreDirector` (`src/kernel/scoredirector.ts`): brano per gli ambienti dei luoghi caricati che nessun programma nomina, entro `ai.maxBrani` (8) e il nuovo coefficiente `brani`, con «Low Detail» e modello `scultori.musicista`; con il seme non chiede nulla. Il Referente ha l'incarico `musica` e con `E` si parla al Musicista: paga chi chiede, ciò che chiede il mondo è comune; carte via `addModel(…, card)`. Un effetto chiesto sostituisce il programma di quell'effetto. Corona: `Building.teams` al posto di `team`, un posto per squadra, nono posto al tavolo, console, avatar `corona-gerboa-musicista`, nessun edificio nuovo. Scostamenti rispetto al previsto: `chooseMusic` ora preferisce chi nomina l'ambiente per intero e tra pari l'ultimo dell'indice, altrimenti un brano chiesto poteva non suonare; il validatore ricorda l'ultimo programma sonoro passato per non rimisurarlo; corretto in `Archive.onFeed` lo slittamento di un membro rimandato dal kernel. ADR-0127, AGENTS, dettagli, glossario e censimento, `lab/banco/suono.md`, `lab/scripts/musicista-prova.ts`, `tests/musicista.test.ts`. Test: typecheck verde; suite intera 1723 su 1724, l'unico rosso era un nome del glossario, corretto, con `glossario.test.ts` e `musicista.test.ts` poi verdi, senza rilanciare la suite intera dopo quella correzione ai soli documenti. Non provato: nessun ascolto umano, multigiocatore dal vivo, `ScoreDirector` con un modello vero (solo prova diretta di `compose`, 3 chiamate, 3 programmi validi) e il percorso da un vero ambiente del Cartografo solo in test offline. Limiti: validazione sincrona, circa 0,8 s a tentativo sulla pagina (lo stesso nel processo di un mondo di molti, come lo Scultore); i brani di Gemini seguono da vicino la struttura dell'esempio; un «Low Detail» salvato come oggetto senza `brani` non è più riconosciuto finché non lo si riapplica. Sicurezza: nessuna superficie nuova: nessuna route né messaggio; il testo del modello passa dal validatore con i tetti esistenti, il nome finisce in un commento ripulito e in un id ricavato da `ownModelId`, i percorsi restano in `models/` sotto `councilMayWrite`.

### T226 · La corona si disegna solo fuori dal tappeto, per chiunque e con qualunque camera — `fatto` (`ab70e37`)
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 15
- Contesto: richiesta dell'autore (03/11): «Quando sono entrato all'interno di una struttura (edificio) in single player, la telecamera è passata da bloccata a 3/4 a orbit libero 360°. Muovendo la telecamera ho visto la corona. Potrebbe essere un bug da correggere, ma pensandoci bene: il concilio può sbagliare e concedere il free orbit anche a chi è in gioco. Alcuni edifici alti potrebbero comunque portare la corona nell'inquadratura. Per garantire che non si veda, non la renderiamo proprio finché il giocatore non esce dal tappeto. Di base preferisco la visuale di 3/4 nel simulatore per questioni di performance del gioco, nella corona avere il free orbit permette di avere una visione d'insieme ed è affascinante da guardare. Nel gioco, se si attiva il full orbit per un'attività è ok, basta che non si veda la corona. Questo ultimo punto lo applicherei anche al master (in multiplayer) o al giocatore che è già uscito dal tappeto (in single). L'esperienza di gioco verrebbe compromessa dalla presenza costante della corona intorno. Lascierei comunque la possibilità di usare il free orbit e free zoom, per avere una visione più ampia, ma da dentro il tappeto non farei render della corona». Il codice oggi: `coronaRevealed()` (`src/kernel/kernel.ts`) è vero già a 0,45 del raggio; il renderer lo usa per l'anello (`CoronaView.update`, `src/render/coronaview.ts`), il taglio del mondo (`U.clipR`), lo sfondo e le etichette, e `canFreeOrbit()` (`src/render/renderer.ts`) dà l'orbita libera con quello. Dedotto dal codice, da accertare: dentro una struttura il viandante si è trovato oltre quella soglia, e da lì orbita e corona insieme. Regola 8, ADR-0009.
- Cosa fare: (1) **la garanzia**: un solo punto decide se la corona si disegna: vero solo se il viandante è fuori dal tappeto (a distanza `circleRadius` o più dal centro) o in un interno dello studio. Dentro il cerchio la corona non si disegna per nessuno: giocatore mai uscito, chi è già uscito ed è tornato, master, god mode, qualunque camera, orbita o zoom. Niente anello, luci, ombre, etichette, hover, né lo sfondo della corona; la simulazione dentro il cerchio resta senza il taglio, come per chi non è mai uscito. Passa in rassegna ogni uso di `coronaRevealed()`, anche nel kernel (`clamp` e il controllo del movimento), e dì nell'esito cosa fa ognuno: ciò che riguarda il cammino non cambia senza un motivo. (2) **la camera**: nel simulatore di base 3/4; l'orbita libera resta a chi è nella corona o nello studio, al god mode e al master, e a un'attività che la chiede. Togli `coronaRevealed()` da `canFreeOrbit()` e trova la causa del passaggio all'orbita entrando in una struttura: entrarci in single player lascia la 3/4. Chi è uscito ed è tornato dentro riprende la 3/4, a meno che il suo ruolo non dia l'orbita. (3) **il passaggio**: attraversare il bordo non deve bloccare il thread (i numeri di T215 sono il riferimento) né far vedere un buco nel mondo: scelta dell'autore e dell'orchestratore (03/11): l'anello si prepara **già costruito ma invisibile** (`visible = false`) quando il viandante si avvicina al bordo, con geometrie e materiali già sulla GPU (`visible = false` da solo rimanda il caricamento al primo frame, e il blocco resterebbe), e si butta quando si allontana, perché con la corona in scena la memoria sale a 1,4-1,6 GB (T175): chi il tappeto tiene al centro non deve pagarla. Da invisibile non deve dare ombre, luci, etichette né hover (il raycast di three.js non guarda `visible`). La soglia di preparazione la scegli misurando e la scrivi nell'esito; se il cambio resta brusco, dillo all'autore con una cattura. ADR, regola 8 in `AGENTS.md`, `#corona` in `docs/architettura-dettagli.md`.
- Test: la decisione è una funzione pura, con i casi: mai uscito, a 0,45 del raggio, appena dentro e appena fuori dal bordo, tornato dentro, master, god mode, dentro una struttura, interno dello studio. Un test che fissa che l'orbita libera non accende la corona.
- BROWSER: in single player entra in una struttura vicino al bordo del cerchio e in una alta: camera 3/4, nessuna corona; con la console accendi l'orbita libera e lo zoom lontano dentro il cerchio e gira a 360°: nessuna corona, catture da quattro lati; esci dal tappeto: corona e orbita libera; torna dentro: corona sparita e 3/4. Da master in una partita di molti (`?viandante=`): orbita e zoom liberi, nessuna corona dentro, corona fuori. Attenzione allo scostamento salvato con `teleport` (`#convalida-browser`).
- Quando è fatto: dal cerchio nessuno può vedere la corona con nessuna camera, verificato a vista, e nel simulatore la camera di base resta 3/4.
- Esito: corona solo fuori dal cerchio o nello studio per chiunque e con qualunque camera (`coronaShown`, `kernel.coronaRevealed`, ADR-0123, regola 8, `#corona`, glossario); `canFreeOrbit` senza `coronaRevealed`; `clamp` di `wantChunks` non usa più `coronaRevealed` (mondo caricato fino a 6 caselle oltre il bordo); `hoverAt` segue la nuova regola; `freeReal` e zona invariati; anello preparato invisibile e caricato sulla GPU da 0,3 del raggio (`loadRing`, 6 ms a fotogramma), buttato dopo 60 s; una sola nebbia sempre accesa; bordo da 104-370 ms a 53-55 ms (188-207 ms alla prima prova di un profilo nuovo), preparazione 115-477 ms lontano dal bordo; 1539 test e typecheck verdi. Causa del passaggio all'orbita non riprodotta: camminando in una struttura il tappeto tiene entro 2 caselle (test), quindi la soglia 0,45 si supera solo con il tappeto fermo o spostato, e ora non decide più nulla. Non provati: edificio davvero alto (offline c'è solo `grande`), arrivo con teleport oltre il bordo senza preparazione (resta il costo di prima), finestra vera in primo piano per i tempi. Il giro col tasto centrale resta nella 3/4 (T55); nessuna attività chiede oggi l'orbita, nessun meccanismo aggiunto. Il cambio al bordo resta brusco: catture nella risposta. Da cancellare a mano `H:\t226-profilo-tmp`. Sicurezza: nessuna superficie nuova.

### T227 · Integrare T223 — `fatto` (`e3c9839`)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 25
- Contesto: T223 (`dossier T223`) è finito, ma `integra T223` va in conflitto in `AGENTS.md`, `docs/architettura-dettagli.md`, `docs/glossario.md`: T222 (`dossier T222`), già nel base, ha scritto negli stessi punti.
- Cosa fare: nel tuo worktree `git merge task/T223`; le due aggiunte restano entrambe, in un testo unico dove stanno sulla stessa riga. L'ADR-0125 resta 0125, se è ancora libero. Nessun'altra modifica.
- Test: typecheck e suite intera con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T227`, con SoundLab e analisi del suono entrambi descritti. Sicurezza: nessuna superficie nuova.
- Esito: `git merge task/T223` su `task/T227` (`e3c9839`): conflitti risolti in `AGENTS.md`, `docs/architettura-dettagli.md` e `docs/glossario.md`, SoundLab e analisi del suono entrambi descritti, ADR-0125 invariato, nessun'altra modifica; typecheck e suite intera verdi (118 file, 1625 test). Non provato: ciò che T222 e T223 già dichiaravano non provato (nessun ascolto umano, dialogo «Apri» e scrittura reale su disco del SoundLab, falsi difetti rari su Architettura Frattale); browser non richiesto. Sicurezza: nessuna superficie nuova.

### T228 · Integrare T224 — `fatto` (`99c356e`)
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 25
- Contesto: T224 (`dossier T224`) è finito, ma `integra T224` va in conflitto in `AGENTS.md` e `docs/architettura-dettagli.md`: T222 e T223 (`dossier T223`), già nel base, hanno scritto negli stessi punti. I programmi sonori di T224 non sono mai stati provati insieme alle soglie di T223.
- Cosa fare: nel tuo worktree `git merge task/T224`; le aggiunte restano tutte, in un testo unico dove stanno sulla stessa riga. L'ADR-0126 resta 0126. Fai passare i 7 brani e i 9 effetti del seme dall'analisi di T223 (`src/mj/soundanalysis.ts`, validatore). Se un programma non passa e il difetto è vero, correggi il programma; le soglie non si toccano; se pensi sia un falso difetto, lascialo com'è e scrivilo nell'esito con le misure. `suono-effetto-morte` e `suono-musica-profondo` sono i preferiti dell'autore: non si ritoccano, se non passano si scrive nell'esito e si lascia decidere a lui.
- Test: typecheck e suite intera con i loro turni.
- Browser: non serve, T224 l'ha già fatto; se correggi un programma dillo nell'esito, l'ascolto resta dell'autore.
- Quando è fatto: commit su `task/T228`, con musica nel gioco, SoundLab e analisi descritti tutti e tre. Sicurezza: nessuna superficie nuova.
- Esito: merge di `task/T224` con tutte le aggiunte (`AGENTS.md`, `#suono`), ADR-0126 invariato; 15 programmi su 16 passano l'analisi di T223. Corretto `suono-effetto-soglia` (era `vuoto` e `ripetitivo`: il seme sceglie la nota d'arrivo tra due, ottava G3 in più nel pad, seme 1 uguale più l'ottava): l'autore lo deve riascoltare. `suono-effetto-morte` non passa (`ripetitivo`, distanza 0 tra i semi) e non è toccato, decide l'autore: il gioco lo suona, il validatore ne rifiuta una nuova pubblicazione, i test lo sanno (`keptByTheAuthor`). `suono-musica-profondo` passa. Test dell'analisi sui preset riportati ai 4 del SoundLab, aggiunta la prova su tutti i 16; misure in `lab/banco/suono.md`. Da sapere: l'analisi riconosce un effetto solo sotto i 16 passi, non da `uso`; il validatore costa 1-1,9 s su un brano del gioco. `npm test` (1692) e typecheck verdi. Non provato: nessun ascolto dopo la correzione, multigiocatore dal vivo. Sicurezza: nessuna superficie nuova.

### T229 · Integrare T158 — `fatto` (`396bf90`)
- Pipeline: claude · stima 3% · approvato · priorità 1
- Step: 26
- Contesto: T158 (`dossier T158`, l'Attore nella corona) è finito, ma `integra T158` va in conflitto in `AGENTS.md`, `src/kernel/archive.ts`, `src/kernel/corona.ts`, `src/kernel/kernel.ts`, `tests/kernel-studio.test.ts`: T225 (`dossier T225`, il Musicista), già nel base, ha toccato gli stessi punti. Il conflitto è anche di sostanza: entrambi prendono il nono posto al tavolo della Sala del Concilio, e T225 ha sostituito `Building.team` con `Building.teams`, mentre T158 aggiunge il campo `guest` alla stanza dello Studio dei Personaggi.
- Cosa fare: nel tuo worktree `git merge task/T158`; le aggiunte restano tutte. Al tavolo siedono dieci: Musicista e Attore hanno ciascuno il suo posto e il suo teletrasporto, senza collisioni e senza occupare l'uscita; ricalcola ciò che era scritto per nove. Decidi se il `guest` di T158 può diventare una squadra di `Building.teams` senza perdere il comportamento di T158 (l'Attore a riposo con l'opzione spenta, un passo oltre il Narratore, le battute senza file dette da lì): se sì un solo meccanismo, altrimenti tienili entrambi e scrivi il perché nell'esito. Nessun ADR nuovo se non cambia una decisione.
- Test: typecheck e suite intera con i loro turni, anche l'ultima volta che cambi il codice.
- Browser: sì, con `?skip&offline`: Sala del Concilio con dieci gerboa ai loro posti, etichette leggibili, teletrasporti liberi; Direzione con le console di Musicista e Attore; Studio dei Personaggi con l'Attore; Galleria dell'Artista con Artista e Musicista; nessun errore del gioco in console.
- Quando è fatto: commit su `task/T229`, con Musicista e Attore descritti entrambi in `AGENTS.md` e `docs/architettura-dettagli.md`. Sicurezza: nessuna superficie nuova.
- Esito: merge di T158 con tutte le aggiunte; dieci al tavolo con posti ruotati di mezzo passo, così uscita e colonna restano libere; `guest` assorbito in `Building.teams` (`persone`: narratore, attore), un solo meccanismo con lo stesso comportamento di T158, voce del glossario tolta; Musicista e Attore descritti in `AGENTS.md` e `docs/architettura-dettagli.md`; test aggiornati e nuovo controllo su uscita e raggiungibilità dei teletrasporti; typecheck, build e suite intera verdi (120 file, 1725 test) sul codice finale. Non provato: Attore acceso con una battuta vera (battute simulate con `council.say`, opzione accesa solo nel test) e i teletrasporti con `E` nel browser (nei test solo quello verso `luoghi`). Sicurezza: nessuna superficie nuova.

## Le fasi, il sito come launcher, la beta e il lancio (to-do del 04/11/2026)

Il testo dell'autore: [`to-do-2026-11-04.md`](../userchats/to-do-2026-11-04.md).

### T230 · Fasi e step: glossario, documento, il pregresso riassegnato — `fatto` (`0e16a6c`)
- Pipeline: claude · stima 2% · approvato · priorità 1
- Step: 28
- Contesto: l'autore introduce due termini (to-do del 04/11, «Fasi dello sviluppo»). **Fase**: I kernel 0.9.0, II beta tester (10 persone), III kernel 1.0.0, IV produzione pubblica con Stripe. **Step**: non più una tappa del piano ma il raggiungimento di un obiettivo condiviso tra task (esempio suo: «step 25: aggiungere il suono al gioco»). La numerazione continua quella dei 9 step fatti. Le fasi possono cambiare in corso d'opera.
- Cosa fare: voci `Fase` e `Step` in `docs/glossario.md`. Nuovo `docs/fasi.md`: le quattro fasi con ciò che l'autore ne ha detto e il criterio per dire finita ciascuna (per la Fase I proponilo tu, segnato come proposta); una tabella `| step | obiettivo | fase | stato | task |` col pregresso riassegnato agli obiettivi già raggiunti e il lavoro aperto raggruppato negli step da fare, numerati a seguire. Leggi il backlog con `pipeline.mjs indice` e, solo dove serve, i blocchi: non aprire i diari. ADR e riga in `AGENTS.md`. Il backlog non lo tocchi: i tag li mette l'orchestratore, con il comando di T231, dalla tua tabella.
- Test: typecheck e suite intera con i loro turni (`tools/glossario` se il censimento ne risente; le sue differenze estranee non si committano).
- Browser: non serve.
- Quando è fatto: ogni task del backlog sta in una sola riga della tabella; commit su `task/T230`. Sicurezza: nessuna superficie nuova.
- Esito: nuovo `docs/fasi.md` (quattro fasi con criterio di fine, proposta per la Fase I; tabella di 38 step, 1-27 pregresso con suono = 25, 28-38 lavoro aperto, ogni id di `indice` in una sola riga, controllo una tantum), voci `Fase` e `Step` e omonimi nel glossario, due righe nel censimento, ADR-0128, riga in `AGENTS.md`. Manca: i tag li mette T231; il backlog ha due blocchi `T59` e il comando per id li tratterebbe uguali (l'id è nello step 16, l'editor è citato nel 23). Non provato: suite intera non rilanciata dopo il secondo commit, solo documenti (glossario e typecheck rilanciati, verdi). Sicurezza: nessuna superficie nuova.

### T231 · Il tag `step` nella pipeline — `fatto` (`2ff2f99`) (dipende da T230)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 28
- Contesto: l'autore vuole dire all'orchestratore «priorizza lo step N». La tabella di `docs/fasi.md` dice quali task stanno in ogni step; serve che anche la pipeline lo sappia. Molti task vecchi non hanno la riga `- Pipeline:`: il tag è una riga a parte, `- Step: <n>`.
- Cosa fare: in `tools/pipeline/pipeline.mjs` il parser di `- Step:`; il campo in `indice`, `dossier` e nella pagina web; `step <n> Txx…` assegna il tag; `step --da-tabella` li mette tutti leggendo `docs/fasi.md`; `step <n>` elenca i task; `step <n> --priorita <p>` porta alla priorità data quelli non finiti. Un task nuovo senza step resta valido. Aggiorna `docs/pipeline/README.md` e `orchestra.md`. Tocchi il backlog solo nei test, su una copia.
- Test: `tests/` della pipeline; typecheck e suite intera con i loro turni.
- Browser: non serve; il campo nella pagina web lo provi con il suo test.
- Quando è fatto: l'orchestratore può lanciare il comando che mette i tag e chiederne la priorità; commit su `task/T231`. Sicurezza: nessuna superficie nuova.
- Esito: parser di `- Step:`, campo in `indice`, `dossier` e pagina web, comando `step` (`<n> Txx…`, `--da-tabella`, `<n>`, `<n> --priorita <p>`), README, `orchestra.md`, `fasi.md` e `AGENTS.md` aggiornati. Rispetto al previsto: un task non stimato riceve la riga `- Pipeline: priorità N`, che `assegna` mantiene; i sotto-task nello stesso titolo condividono il tag; i task «spezzato in…» non ricevono la priorità; `orchestra.md` ammette `docs/fasi.md` fra i documenti scrivibili e avvisa di non usare la priorità 0. Manca: l'orchestratore deve lanciare `step --da-tabella` sul backlog vero dopo l'integrazione. Provato su una copia del backlog: 282 id riconosciuti, 277 righe `- Step:`, nessun'altra differenza. Pagina web provata solo con il test. Non provato: il comando sul backlog vero. Sicurezza: nessuna superficie nuova.

### T232 · Il sito come launcher: proposte della landing col rapporto aureo — `fatto` (assorbito, nessun commit proprio)
- Step: 34
- **Assorbito (autore, 05/11: «vedi tu»; decisione dell'orchestratore):** le tre proposte diventano le tre vesti di T284, T285 e T286, e griglia e tipografia da φ e Fibonacci stanno nella base comune di T283. Ciò che era «launcher» (carte e strutture in 3D, universi più giocati, notizie) resta a fine Fase II, in T233 e T235, sulla veste scelta. La richiesta di partenza: «sembra a metà tra un pitch per una startup e un blog per fumetti»; la vuole come il launcher di un gioco multiplayer moderno, «oddly satisfying», senza testi che guastino la scoperta della corona.

### T233 · La landing launcher nel sito — `da fare` (dipende da T287)
- Pipeline: claude · stima 3% · priorità 2
- Step: 35
- Contesto: si approva solo quando è scelta la veste del sito (`dossier T287`; da dove viene: `dossier T232`).
- Cosa fare: la proposta scelta in `site/` col tema condiviso, senza framework; le sezioni di showcase e notizie restano nascoste finché non hanno contenuti, niente «coming soon» finti. La striscia «coming soon» degli altri universi resta.
- Test: typecheck, build e suite intera con i loro turni.
- Browser: sì, a 1920 e 390 px, in `npm run dev` e sotto `npm run serve`.
- Quando è fatto: la home è il launcher scelto; commit su `task/T233`. Sicurezza: nessuna superficie nuova, o le voci.

### T234 · Il news-blog del sito — `fatto` (`fc48b9b`)
- Pipeline: claude · stima 2% · approvato · priorità 3
- Step: 34
- L'autore (04/11): non aspetta la landing nuova. Grafica semplice nel tema attuale, entro la Fase I.
- Contesto: dal rilascio in beta l'autore vuole notizie: aggiornamenti del kernel, creazione di un universo, sessioni di generazione intensa, sondaggi per feedback, link alla pianificazione dell'utilizzo dei server.
- Cosa fare: notizie come file Markdown in `site/`, trasformate alla build, senza rotte nuove sul server né database; elenco, pagina singola, tag per tipo, le ultime nella landing. Un sondaggio è un link esterno. Una notizia di prova e la guida di due righe per scriverne una.
- Test: typecheck, build e suite intera con i loro turni; un test sul testo che non diventa HTML eseguibile.
- Browser: sì, elenco e pagina a 1920 e 390 px.
- Quando è fatto: l'autore aggiunge un file e la notizia appare; commit su `task/T234`. Sicurezza: nessuna superficie nuova, o le voci.
- Esito: notizie come Markdown in `site/notizie/` raccolte alla build (nessuna rotta né database), elenco con filtri per tag, pagina singola, ultime tre nella landing, link esterno per sondaggi e server, notizia di prova, guida `LEGGIMI.md`, test su testo ostile, ADR-0129, voce di glossario; `escapeHtml` spostata in `shared.ts` e test del glossario esteso a `site/`; suite (1759), typecheck e build verdi; sicurezza: nessuna superficie nuova; non provati un telefono vero e la landing a 390 px; una notizia nuova si pubblica con build e deploy.

### T235 · Showcase: carte famose e universi più giocati — `in attesa` (dipende da T233)
- Step: 35
- Contesto: dal to-do del 04/11: carte famose, video in loop di gameplay o delle strutture più «lerpe» in 3D, universi di giocatori più giocati. Ha senso solo con dati veri: riparte alla fine della Fase II, quando lo dice l'autore. Il conteggio delle partite non esiste ancora; una rotta pubblica nuova passa da `gate` e dall'elenco di `server/production.ts`.
- Domanda per l'autore: nessuna ora; alla ripartenza si riscrive con ciò che la beta ha lasciato.

### T236 · La beta: i crediti in due parti — `fatto` (decisioni dell'autore, 04/11, nessun commit di codice)
- Step: 34
- Contesto: per la Fase II l'autore dà 5 € a ogni tester e genera a sue spese gli universi vanilla; una parte dei crediti per esplorare, l'altra sbloccata da un secondo file che rivela la corona. Oggi con gli account `QUINE_TETTO_RICARICHE` vale 0. **Calendario, chat tra i partecipanti e comunicazioni li gestisce l'autore fuori dal repository (04/11):** niente prenotazioni nel sito né codice che in produzione sparirebbe; la beta non deve durare troppo. Su richiesta l'orchestratore lo aiuta con i messaggi WhatsApp d'invito.
- **Deciso dall'autore (04/11, `docs/pipeline/domande/T236.md`):** 2 € per esplorare, parlare, generare oggetti; 3 € con il secondo file, e chi li riceve può restare nel tappeto: è una scelta. Tutto a mano dal master. Altri 5 € a mano ai più assidui. Chi poi vuole continuare in beta ha uno sconto del 50 % sui crediti, a prezzo lineare e senza commissione (T243; come paga: `docs/pipeline/domande/T243.md`). Quattro universi condivisi: medievale (`aurora`), steampunk, moderno, futuristico, generati perlopiù sul server con gli abbonamenti (T207, T88, T153).
- Conseguenze per il deploy: `QUINE_TETTO_RICARICHE` da alzare, oggi 0 con gli account (consigliato 50: 10 tester per 5); `QUINE_UNIVERSI_PER_ACCOUNT` è 3 e i mondi del master sono 4. I saldi stanno per universo (ADR-0104), quindi i crediti di un tester valgono in un mondo solo.

### T237 · La guida dei beta tester, in due file — `da fare` (dipende da T45f, T236, T294)
- Pipeline: claude · stima 2% · approvato · priorità 3
- Step: 34
- Contesto: si scrive a fine Fase I, per gli amici dell'autore, non pagati: «non è il classico beta testing noioso». Il primo file: come giocare, che si gioca prenotando il turno sul calendario dell'autore, fuori dal repository (anche insieme, senza esagerare con le sessioni a molti), tutte le limitazioni del server di beta con cui ci si potrebbe frustrare. Il secondo file: la corona, e come avere la seconda parte dei crediti, per chi non ha capito come uscire dal tappeto. Il primo non deve guastarla.
- Decisioni di T236: 2 € + 3 €, a mano; il secondo file dice che si può anche restare nel tappeto; quattro universi condivisi con l'autore come master. Da provare, non da supporre: cosa può fare nella corona chi non è il master; come si spende il saldo, che vale per un universo solo. Gli altri 5 € e lo sconto li propone l'autore a voce: non stanno nei file. I due file vanno anche sul sito (T244): scrivili come pagine pubbliche, e il primo non guasti la corona.
- Richiesta dell'autore (05/11): il secondo file ha una sezione sui laboratori, che si accendono solo nel secondo passo (`laboratori` in `site/beta.json`, T294): come si forka, come si salva, cosa ci si fa.
- Cosa fare: `docs/beta/guida.md` e `docs/beta/la-corona.md`, in italiano, dal comportamento vero del server di beta (limiti di `LIMITS`, `FRONT_RATES`, mondi accesi, tetti, modelli locali a crediti finiti), non dai documenti: ciò che non puoi provare lo segni. Tono da amico.
- Test: nessun codice: typecheck con il suo turno.
- Browser: sì: segui la guida da viandante nuovo sul server di beta; ogni passo che non torna lo correggi.
- Quando è fatto: l'autore può spedirla; commit su `task/T237`. Sicurezza: nessuna superficie nuova.

### T238 · Il registro di ciò che il Concilio non riesce a fare — `fatto` (`ff1315b`)
- Pipeline: claude · stima 2% · approvato · priorità 3
- Step: 34
- Contesto: la Fase III parte dalle funzionalità che il Concilio non riesce a implementare durante le sessioni, chieste dai giocatori o nate dal Concilio. Se la beta non le registra, si perdono: va fatto entro la Fase I. Approvato dall'autore il 04/11. I feedback dei giocatori non passano da qui: l'autore li porta in chat.
- Cosa fare: leggi `#concilio` e i punti in cui una richiesta finisce male (Referente, Fucina, azioni libere, validatore che rifiuta anche l'ultimo tentativo, Ingegnere che non ripara). Ognuno scrive una voce (richiesta, chi, agente, motivo, quante volte) in un file di mondo che non va ai client e senza quarta parete nel gioco; un comando che ne fa il rapporto per il kernel 1.0.0.
- Test: typecheck e suite intera con i loro turni, offline con `MockAiModels`.
- Browser: non serve.
- Quando è fatto: una richiesta rifiutata in un test diventa una riga del rapporto; commit su `task/T238`. Sicurezza: il file resta fuori da `playerFiles` e `publicFiles`; scrivi l'esito.
- Esito: ogni richiesta che finisce male (Referente, Fucina, azioni e fabbricazioni libere, ultimo tentativo rifiutato dal validatore, Ingegnere che non ripara, e anche modelli, brani, luoghi, trame, rune, pacchetti, Genesi) è una voce di `world/mancanze.json` (richiesta, chi, agente, compito, esito, motivo, volte), che sopravvive ai rollback, viene dal ramo del master e ha il comando `npm run mancanze`; una richiesta rifiutata in un test diventa una riga del rapporto; ADR-0129, glossario, AGENTS e dettagli aggiornati. Manca: `docs/glossario-censimento.md` non rigenerato. Non provato: fallimenti veri con Gemini o in una partita reale, solo modelli offline. Sicurezza: nessuna voce nuova nel registro, il file resta fuori da `playerFiles`, `publicFiles` e `playerChanges` (test V-012 in `tests/sicurezza/uscite.test.ts`), i testi di giocatori e modelli sono tagliati e appiattiti, con al massimo 500 voci; il master lo vede solo come ogni file del suo universo, un clone lo eredita.

### T239 · Quattro lingue: censimento e progetto — `in attesa`
- Step: 36
- Contesto: prima della Fase IV il gioco va in italiano, inglese (la versione di punta sui social), francese e spagnolo: le lingue che l'autore può verificare. **L'autore (04/11): è l'ultimissima operazione, in Fase III, non in Fase I:** è dispendiosa e obbliga a quadruplicare ogni modifica che tocca la lingua. Riparte quando lo dice l'autore. Oggi UI, prompt e testi di gioco sono in italiano per convenzione; i contenuti li genera il Concilio, gli universi hanno già una lingua, il multigiocatore può mescolarle.
- Cosa fare alla ripartenza: censimento dei testi (UI, sito, prompt, seme, lessico, canone delle rune, messaggi del kernel), proposta con le alternative in `docs/lingue.md`: lingua per universo o per viandante, cosa si traduce e cosa si genera, come si verifica. A parte documentazione, pipeline agentica e pregresso dello sviluppo: si traducono solo se il piano di lancio punta anche alla comunità dello sviluppo agentico.
- Prodotto su Claude Cloud e portato da T278 (`112b736`): `docs/lingue.md`, `docs/lingue-censimento.md`. Resta `in attesa`: lo chiude l'autore quando l'ha letto.
- Risposta dell'autore a D34.1 (05/11): non una lingua fissa per universo: un universo si traduce in tempo reale, e ciò che si crea (un oggetto, un luogo, un individuo) nasce già con i testi in tutte le lingue; la lingua la sceglie il viandante. `docs/lingue.md` va riscritto su questa base alla ripartenza (Fase III). Restano aperti i punti 2-6 di D34.
- Risposte dell'autore a D34 (05/11 sera): **1. C** (ripensata: la B è troppo complessa): lingua del mondo per universo, interfaccia nella lingua del viandante; **2.** l'inglese come lingua interna, subito, nello step 42 (T306-T310); **3.** rune magiche in latino; **4.** con la C, prompt in inglese; **5.** filtro su mondo + italiano + inglese; **6.** sì, la documentazione solo nel sottoinsieme; si misura la spesa in corsa. Resta per la Fase III: la lingua scelta alla Genesi, i dizionari dell'interfaccia, il seme e il sito nelle lingue (L1, L5-L9 di `docs/lingue.md`).

### T240 · Il piano di lancio: concorrenti, punti di forza, Boa Loger — `in attesa`
- Step: 38
- Prodotto su Claude Cloud e portato da T278 (`112b736`): `docs/lancio/piano.md`. Non si rilancia su Fable. Resta `in attesa`: lo chiude l'autore quando l'ha letto (D35 in `docs/pipeline/domande/aperte.md`).
- Contesto: leggi tutto il to-do del 04/11, «Fase IV». L'autore: «ci giochiamo tutte le carte», non ha studi di marketing, vuole le idee migliori e il dissenso dove c'è. Afferma che non esiste niente del genere e chiede se la narrativa generativa sia davvero solo sua: va verificato, non assecondato. Da confrontare almeno con: AI Dungeon, Project Sid, Generative Agents (Smallville), inZOI; nella ricerca veloce del 04/11 nessun gioco pubblicato che generi mondo e codice durante il gioco, con fonti deboli. Propone: account dedicati, una settimana di spoiler in contemporanea, post finale col link; il personaggio Boa Loger (gerboa, finto anonimato facile da forare, collettivo artistico, interviste animate).
- Cosa fare: `docs/lancio/piano.md`, con le fonti. (1) Ricerca sul web dei concorrenti, per ogni punto di forza: chi lo fa già, e quanto; cosa resta davvero unico, in una frase difendibile su Hacker News. (2) I punti di forza in ordine, per pubblico (tecnico, giocatori, creatori), compresi quelli che l'autore non ha elencato: il mondo fatto del proprio codice, le rune eseguite, il tappeto e la corona, i modelli come programmi di testo. (3) Giudizio sul piano dell'autore: regole di autopromozione e di account nuovi di Reddit e Hacker News, la pubblicazione simultanea, quali canali mancano e quali togliere; cosa impone il farsi pagare in UE sull'identità pubblica. (4) Boa Loger: cosa tenere e cosa rischia, un personaggio dichiarato contro un finto sviluppatore, voce sintetica, compatibilità con la regola 0 se entra nella narrativa dell'universo. (5) Calendario dal termine della Fase III, narrativa e 3-5 idee migliori della sua, con il costo in tempo per una persona sola. (6) Ciò che il gioco deve avere prima (video, press kit, costi a molti utenti al picco, tetti di spesa). (7) Il pubblico degli sviluppatori: l'autore crede che il progetto interessi anche chi segue lo sviluppo agentico (i subreddit dedicati): la pipeline, l'orchestratore, i task. Di' se conviene e cosa chiede: tradurre documentazione, pipeline e pregresso, oggi in italiano, ha un costo (→ il censimento delle lingue, T239). Parti dalle osservazioni che l'orchestratore ha dato all'autore il 04/11 e che lui ha apprezzato, ma verificale: la frase «non esiste niente del genere» è smontabile, di unico c'è l'insieme; il punto più forte è il mondo fatto del proprio codice e le rune eseguite, con la storia di 18 anni come racconto; Boa Loger come mascotte dichiarata anziché finto sviluppatore, perché chi incassa in UE mostra comunque la propria identità; account nuovi e stessa data ovunque sembrano spam; mancano Discord, YouTube, TikTok. Non creare account e non pubblicare nulla.
- Test: nessun codice: typecheck con il suo turno.
- Browser: non serve.
- Quando è fatto: l'autore può decidere voce per voce; commit su `task/T240`. Sicurezza: nessuna superficie nuova.

### T241 · Il rapporto aureo in HUD e pannelli — `fatto` (`84f5339`)
- Pipeline: claude · stima 2% · approvato · priorità 4
- Step: 33
- Contesto: l'autore (04/11, `docs/pipeline/domande/T232.md`): nel gioco il rapporto aureo sì per la UI, senza spese grosse. La landing nuova non c'è ancora (T232 è a fine Fase II): la scala φ/Fibonacci nasce qui, e la landing la riprenderà.
- Cosa fare: spaziature, proporzioni e tipografia di HUD e pannelli dalla scala φ/Fibonacci in `src/theme.css`. Solo stile: niente modelli, niente logica, nessun effetto sulle prestazioni.
- Test: typecheck e suite intera con i loro turni.
- Browser: sì, con `?skip&offline`: HUD, inventario, chat, profilo a 1920 e 1280 px, testi che non escono dai riquadri.
- Quando è fatto: commit su `task/T241`, con la tabella dei rapporti in `#sito`. Sicurezza: nessuna superficie nuova.
- Esito: HUD e pannelli leggono la scala φ/Fibonacci da `src/theme.css` (spazi, corpi, interlinea, larghezze; inventario 322:521, bisogni 55:89), tabella in `#sito`, voce nel glossario, test che rifiuta `font`/`padding`/`margin`/`gap` in px a mano; corretti griglia dell'inventario stirata, parole lunghe fuori dai fumetti, barra dei tasti a capo a 1920. Restano fuori bordi, ombre, pallini delle legende e classi `comic-*` del sito. Non provato: un vero viewport a 1280 (simulato, `vw`/`vh` restano a 1920×919) e la guida H a 800 px di altezza. Sicurezza: nessuna superficie nuova. Typecheck e suite intera verdi (1871 test), `tests/theme.test.ts` rilanciato dopo la rimozione di `--phi`.

### T242 · Il rapporto aureo nei prompt dello Scultore e dell'Artista — `in attesa` (dipende da T156)
- Pipeline: claude · stima 1% · approvato · priorità 33
- Attesa (07/11, epoca 324): l'autore propone una metodologia nuova per i programmi MarkovJunior degli edifici, «ad alto livello per scomposizione del modello», che scriverà l'08/11; questo task tocca il prompt o la misura dello Scultore e aspetta quel testo (poi si riscrive o si sblocca).
- Step: 33
- Contesto: l'autore (04/11, `docs/pipeline/domande/T232.md`): nel mondo solo come indicazione per ciò che si genera da qui in poi. **I modelli esistenti non si toccano e non si rigenerano:** potrebbe costare caro.
- Cosa fare: una riga di principio (proporzioni auree, spirali di Fibonacci dove ha senso: piante, conchiglie, scale, cupole) nel prompt dello Scultore e nella guida di stile dell'Artista, nel seme. Misura sul banco, con pochi tentativi, che non peggiori qualità e varianza.
- Test: typecheck e suite intera con i loro turni, offline.
- Browser: non serve.
- Quando è fatto: commit su `task/T242`, con le misure prima e con la riga. Sicurezza: nessuna superficie nuova.

### T243 · La beta senza commissione — `fatto` (`12dfb2b`)
- Pipeline: claude · stima 1% · approvato · priorità 3
- Step: 34
- Contesto: l'autore (04/11, da T236): in beta i crediti hanno un prezzo lineare e nessun interesse, perché chi gioca contribuisce allo sviluppo. Oggi `PLATFORM_FEE` è una costante di `src/kernel/credits.ts` (+1 %, ADR-0081). Lo sconto del 50 % non è qui: per ora si fa a mano (`docs/pipeline/domande/T243.md`).
- Cosa fare: la commissione diventa configurazione del server, `QUINE_COMMISSIONE`, predefinita 0,01; 0 è ammesso, un valore non valido dà il predefinito. Arriva al processo del mondo (`worldEnv`, nessun segreto) e la decide solo il server: mai `universe.json`, Lua, il Concilio o il client. Tutti i punti che calcolano o mostrano il +1 % la seguono, sito e lobby compresi. Controlla che ricariche e consumi siano lineari, senza fasce. Aggiorna `AGENTS.md`, `#carte-crediti` e un ADR.
- Test: commissione 0 e predefinita su consumi e spese comuni; valore non valido. Typecheck e suite intera con i loro turni, offline.
- Browser: non serve.
- Quando è fatto: con `QUINE_COMMISSIONE=0` il saldo cala esattamente del costo base; senza, nulla cambia; commit su `task/T243`. Sicurezza: scrivi l'esito, tocca i crediti.
- Esito: commissione configurabile con `QUINE_COMMISSIONE` (predefinita 0,01, 0 ammesso, non valido → predefinito), decisa solo dal server e passata al mondo con `worldEnv`; la seguono addebiti, portafoglio del sito e console del master, la lobby non la mostrava; ricariche e consumi controllati lineari; ADR-0130, `AGENTS.md`, `#carte-crediti` e glossario aggiornati; test e typecheck verdi. Limiti: i giorni passati del portafoglio si leggono alla commissione di oggi, un valore non valido non viene segnalato; pagina crediti e console non provate nel browser (non richiesto). Sicurezza: nessuna superficie nuova.

### T244 · La home per la beta: ritocchi, video, istruzioni — `fatto` (`9b8523c`) (dipende da T234)
- Pipeline: claude · stima 3% · approvato · browser · priorità 3
- Step: 34
- Contesto: l'autore (04/11): la home di oggi lo imbarazza («a metà tra un pitch per una startup e un blog per fumetti») e molti tester sono amici sviluppatori. Non è il launcher, che resta a T232: solo ritocchi. Un video in cui l'autore parla del progetto; le istruzioni della prima parte del test, senza corona; quando tutti passano alla seconda parte l'autore aggiunge le altre. I video li registra lui: **più di uno e non brevi** (lui che parla del progetto, il gameplay; autore, 04/11), serviti dal nostro sito.
- Cosa fare: in `site/index.html`, `site/landing.ts`, `site/site.css` togli il tono da pitch e riduci i fumetti, tenendo programmi MarkovJunior e striscia «coming soon». Un elenco di video, con titolo e ordine in un file di configurazione: si vede solo ciò che ha il file. I file video non vanno nel repository né in `dist/`: stanno in una cartella del server detta da una variabile d'ambiente, e `npm run dev` li serve allo stesso modo. Oggi `server/production.ts` manda i file interi, senza richieste `Range`: un video lungo non si può saltare in avanti né riprendere. Aggiungile per questa cartella, con i tetti di `FRONT_RATES` e l'elenco delle rotte (regola 8h), e controlla quanta memoria costano più visioni insieme. Una pagina di istruzioni dal Markdown, con la stessa trasformazione del blog: mostra `docs/beta/guida.md` e, solo quando l'autore lo accende con una riga di configurazione, `docs/beta/la-corona.md`. Se i file non ci sono ancora la pagina non compare. Di' nella consegna come si aggiunge un video e come si accende la seconda parte.
- Test: la seconda parte non finisce in `dist/` finché è spenta, testo compreso. Typecheck, build e suite intera con i loro turni.
- Browser: sì, a 1920 e 390 px, in `npm run dev` e sotto `npm run serve`, con video e seconda parte accesi e spenti, salto in avanti in un video di prova lungo; catture nel commit.
- Quando è fatto: l'autore aggiunge un video e accende la seconda parte senza toccare il codice; commit su `task/T244`. Sicurezza: la rotta dei video è una superficie nuova: nessun percorso fuori dalla sua cartella, intervalli `Range` non validi rifiutati; scrivi l'esito.
- Esito: home ritoccata (meno pitch e fumetti, restano MarkovJunior e «coming soon»); video da `QUINE_VIDEO` con `video.json`, rotta `/api/video` con `Range`, tetti in `FRONT_RATES` e sull'elenco di `production.ts`, uguale in `npm run dev`; pagina istruzioni da `docs/beta/` con `site/beta.json` per la seconda parte, che spenta non entra in `dist/` (test con build vera); ADR-0131, guida `docs/beta/LEGGIMI.md`, voci di glossario; suite (1869), typecheck e build verdi; memoria circa 200 KB per visione (200 ferme su 4 GB: da 115 a 159 MB di RSS); sicurezza: superficie nuova `/api/video`, il nome chiesto si confronta con l'elenco e non diventa mai un percorso, un link che esce dalla cartella è rifiutato, `Range` non validi o multipli 416, passa da `gate`, provata in `tests/site-video.test.ts`, nessuna voce V perché nessuna falla; il test sul link simbolico si salta se Windows non permette di crearli; `guida.md` e `la-corona.md` non scritti (senza, la pagina non compare); il link alle istruzioni è solo nella home e nella pagina stessa; non provati un telefono vero e un `.mp4` vero (prova con WebM VP8 di 2 ore, 241 MB); la banda è da decidere al primo deploy pubblico.

### T245 · Gli NPC agiscono davvero: mestieri in sotto-compiti e scopi comuni, il progetto — `fatto` (`b48399f`) (dipende da T183)
- Pipeline: fable · stima 5% · approvato · priorità 20
- Step: 32
- Contesto: l'autore (04/11): vuole che l'intero comportamento degli NPC sia gestito con l'IA, non solo le chat. Oggi ci sono routine (`RoutineStep`, `meta`) e attività che si vedono (`ACTIVITIES`, `inferActivity` in `src/kernel/society.ts`, ADR-0024). Suo esempio: «lavora al campo di grano» scomposto in tutti i sotto-compiti e poi attuato davvero, con **codice Lua riutilizzabile, non l'IA che ogni volta dice cosa fare**. Se l'Attore è acceso (ADR-0116) può essere lui a gestire le azioni dell'NPC. Narratore e attori devono poter collaborare a uno scopo comune: in una sessione lunga mesi costruiscono un edificio, facendo qualcosa di visivamente coerente per arrivarci. Il kernel deve permetterlo. Nasce da T157, T183: `dossier T157`, `dossier T183`.
- Cosa fare: **solo il progetto**, in `docs/design/comportamento-npc.md`, nessun codice del gioco. (1) Da mestiere a sotto-compiti ad azioni nel mondo: chi scompone, dove sta il risultato (dati dell'universo, riusati da ogni individuo con quel mestiere), quali comportamenti Lua servono e quali primitive del `Host`. (2) Chi decide cosa: kernel, Lua, Narratore, Attore; a Attore spento il gioco deve reggere uguale. (3) Lo scopo comune: come nasce, dove vive per mesi, come se lo dividono, cosa succede se chi lavora muore, se manca il materiale, se il viandante interviene; come un edificio cresce a vista per passi coerenti, in rapporto ai programmi delle strutture (`dossier T156`, `lab/banco/pattern.md`). (4) I costi, con i numeri: chiamate per NPC al giorno di gioco, per universo e per mese, chi paga (regola 8i), il coefficiente che le limita, il «Low Detail». (5) Luoghi non caricati e server dei mondi di molti (regola 8g): cosa si simula quando nessuno guarda. (6) Cosa entra in un universo esistente senza wipe, dalle misure di T183, e cosa va nel kernel 0.9.0. (7) Una spezzatura in task, con stime. Guarda cosa hanno imparato Generative Agents (Smallville) e Project Sid, con le fonti.
- **Gli esempi non sono il perimetro (autore, 04/11):** gli scenari a lungo termine sono di tipo diverso e il progetto non si limita a quelli citati, mestieri ed edifici compresi. Altri suoi esempi: in una sessione lunga mesi il viandante mette su famiglia con un NPC e ha un vicinato di NPC; nell'universo moderno ha un lavoro d'ufficio con dei colleghi. Ognuno ha una storia, un carattere, una personalità: Giovanni il collega può essere di destra e complottista. Quindi il documento risponde anche a questo: (8) cosa regge in generale i legami e le vite lunghe (famiglia, vicinato, colleghi), oltre ai lavori; come la personalità, anche con opinioni nette, sta nei dati dell'individuo, resta coerente per mesi e cambia ciò che fa, non solo ciò che dice; come ogni NPC ha la sua storia senza che il costo cresca oltre il punto (4).
- **Programmi prima dell'IA, realismo scelto in lobby (autore, 04/11):** questi comportamenti costano più di quelli di oggi, lo sa. Dove è possibile si scrive un programma invece di delegare il comportamento all'IA direttamente: per ogni comportamento il documento dice cosa fa il programma, cosa resta all'IA e perché. Il miglioramento deve avere un grado di realismo e spesa selezionabile in lobby. Quindi: (9) i gradi, ognuno con cosa fanno gli NPC e cosa si vede di diverso, le chiamate e la spesa stimate; il grado più basso regge il gioco senza chiamate in più; come sta insieme ai coefficienti di generazione e al «Low Detail» (ADR-0085) e ai minimi della lobby (ADR-0086); **deciso dall'autore: lo sceglie solo il master e non si cambia a partita in corso**, quindi il documento dice dove si fissa e come il server lo fa rispettare. L'uso reale nella lobby entra nella spezzatura del punto (7).
- Test: nessun codice: typecheck con il suo turno. Ciò che affermi del kernel lo controlli sul codice.
- Browser: non serve.
- Quando è fatto: l'autore può decidere dal documento cosa fare e in che fase; commit su `task/T245`. Sicurezza: nessuna superficie nuova; scrivi quali ne nascerebbero.
- Esito: scritto `docs/design/comportamento-npc.md` (programmi di mestiere con comportamenti Lua, chi decide cosa, le imprese e l'edificio per stadi, costi con i numeri, contabilità fuori vista, senza wipe e kernel 0.9.0, nove task T245a-i, vite lunghe con tratti e opinioni, tre gradi con la manopola `vite`); nessun codice, typecheck verde nel suo turno; sicurezza: nessuna superficie nuova, quelle che nascerebbero sono elencate nel documento; i costi sono stime non misurate.

### T246 · La chat dell'orchestratore: il titolo di un task al passaggio del mouse — `fatto` (`6ef2eaf`)
- Pipeline: claude · stima 1% · approvato · browser · priorità 2
- Step: 28
- Contesto: l'autore (04/11): nella chat dell'orchestratore della pagina web vuole che i riferimenti ai task (`T93`, `T89b`) siano riconosciuti e che al passaggio del mouse appaia il titolo del task, per capire di cosa si parla senza andarlo a cercare. La chat si disegna in `renderChatAndEvents` di `tools/pipeline/web.mjs`, col Markdown di `tools/pipeline/markdown.mjs`, e si ridisegna a ogni aggiornamento della pagina. Nasce da T69: `dossier T69`.
- Cosa fare: nei messaggi della chat (autore, orchestratore, pipeline, in coda) ogni riferimento a un task esistente, anche dentro il `codice` in linea, diventa un elemento con il titolo del task come tooltip e una sottolineatura leggera che dica che lo si può passare col mouse. I titoli vengono dai dati che la pagina ha già, o da un campo in più dell'API di stato se mancano. Non si tocca ciò che è già HTML: un `T12` dentro un attributo o un link non deve rompere il markup; il testo arriva da fuori, quindi il titolo va sottoposto a escape. Un numero senza task resta testo semplice. La vista «Sorgente» resta il testo com'è scritto. Il riconoscimento è una funzione pura, provata da sola. Il clic che apre il task è facoltativo: solo se la pagina ha già la modale pronta e costa poche righe.
- Test: la funzione di riconoscimento con task esistente, inesistente, suffisso di lettera, dentro una parola (`ST12`), dentro il codice in linea, titolo con `"` e `<`. Typecheck e test della pipeline con i loro turni.
- Browser: sì, `node tools/pipeline/pipeline.mjs web` su una porta libera, senza toccare il processo acceso: tooltip visibile su un messaggio vero, la selezione e lo scorrimento della chat restano come prima a un aggiornamento.
- Quando è fatto: passando il mouse su `T93` in un messaggio si legge il titolo del task; commit su `task/T246`. Di' nella consegna che la pagina accesa lo mostra solo al riavvio del processo, se è così. Sicurezza: nessuna superficie nuova, salvo ciò che trovi; scrivi l'esito.
- Esito: nella chat della pagina web i riferimenti ai task esistenti (autore, orchestratore, pipeline, in coda; anche nel codice in linea) hanno sottolineatura a puntini, titolo come tooltip e clic che apre il dettaglio, con la funzione pura `taskRefsToHtml` provata da sola; rispetto al previsto la chat ora si riscrive solo quando cambia, altrimenti l'aggiornamento ogni 3 s chiudeva il tooltip; eventi e quadro non cambiano; la pagina accesa lo mostra solo dopo integrazione e riavvio del processo; non provato: la finestrina del tooltip nativo a occhio, perché gli screenshot non la catturano; `npm test` e typecheck verdi; sicurezza: nessuna superficie nuova (il titolo passa per l'escape, tag e link restano intatti).

### T247 · Tutto il consumo si regola in lobby, prima di giocare — `fatto` (`fcdffd6`)
- Pipeline: claude · stima 4% · approvato · browser · priorità 10
- Step: 34
- Contesto: l'autore (04/11): «il consumo deve essere tutto tunabile in lobby pre game». Oggi la lobby (`src/ui/lobby.ts`, ADR-0086) al master fa regolare solo l'Attore (ADR-0116): modello del Concilio, modelli dello Scultore, coefficienti, «Low Detail» e minimi sono solo mostrati. In `CENSUS` (`src/kernel/coefficients.ts`, ADR-0085) molti compiti sono `non regolabile`, come `chunk.plan`, `npc.reply`, `text.examine`, `action.judge` e la Genesi. Il grado di realismo degli NPC progettato da T245 sarà una manopola in più di questa lobby. Nasce da T45b, T45d, T157: `dossier T45b`, `dossier T45d`, `dossier T157`.
- Cosa fare: (1) in lobby il master regola ciò che già esiste: preset, ogni coefficiente, ogni modello, budget e minimi, con la stima oraria che segue i valori; gli altri li vedono e non li toccano, e lo rifiuta il server, come per l'Attore (regole 8b e 8f). (2) Ogni riga `non regolabile` di `CENSUS` riceve una manopola, con ciò che il gioco fa quando è al minimo (testo locale, risposta breve, niente chiamata). Non si tolgono i modi di giocare senza dirlo: a zero il gioco regge e il viandante capisce cosa succede, senza meta-gioco nel mondo (regola 0). Una riga che non può averla (per esempio una della Genesi, se la lobby compare a Genesi finita) va in `docs/pipeline/domande/T247.md` con il motivo e una proposta. (3) Un test impedisce che un compito nuovo entri in `CENSUS` senza una manopola. (4) Le impostazioni si fissano entrando in partita. Scrivi nell'esito quando compare la lobby di un universo già avviato e se c'è un equivalente per chi gioca da solo.
- **Deciso dall'autore (04/11): tutte le manopole si bloccano a partita in corso.** Oggi il master può cambiare `ai` anche durante la partita (`setAi`, l'editor): questa possibilità va tolta, e il blocco lo fa rispettare il server e il kernel, non solo l'interfaccia. Definisci cosa vuol dire «partita in corso» e quando il master può tornare a regolare (per esempio a mondo fermo), per la partita di molti e per chi gioca da solo, e scrivilo nell'ADR. Il tetto di spesa del singolo viandante e le scelte a crediti esauriti (ricarica, offline, abbandona) sono suoi, non manopole del master: restano.
- Test: riparazione dei valori fuori scala, master e non master sul server, rifiuto di ogni modifica a partita in corso anche dal master, comportamento di ogni manopola al minimo con `MockAiModels` senza chiamate, stima oraria; suite intera e typecheck con i loro turni.
- Browser: sì, la lobby in una partita di molti come master e come altro viandante, a 1920 e 390 px; con una manopola a zero il gioco regge.
- Quando è fatto: il master regola ogni consumo prima di entrare e nessun compito resta senza manopola o senza un motivo scritto; ADR e `docs/architettura-dettagli.md#lobby` aggiornati; commit su `task/T247`. Sicurezza: tocca `server/`, `src/session/` e i crediti; scrivi l'esito, comprese le prove che un non master non cambi nulla e che i minimi non scendano sotto ciò che il master ha fissato.
- Esito: master regola tutto il consumo in lobby (preset, coefficienti, modelli, ragionamento, Attore, budget, minimi; stima che segue i valori), otto manopole nuove con modelli locali al minimo, a 0 nessuna chiamata; blocco a partita in corso su kernel, server e deposito, anche per il master (molti: dal primo che entra all'ultimo che esce; da soli: dalla lobby alla ricarica); lobby anche da soli; la lobby di molti compare a ogni apertura salvo `?skip`; tetto minimo controllato dal server; tolto il messaggio `attore`; corretta la lobby coperta dall'intro; censita `review.fourthwall`; ADR-0132, `AGENTS.md`, `#lobby`, glossario. Manca: domanda aperta sulle 8 righe della Genesi in `docs/pipeline/domande/T247.md` (proposta: lasciarle così). Non provato: la lobby da soli con modelli veri (solo con `?offline&lobby`), una battuta con una persona a zero nel browser (coperta dai test). Sicurezza: nessuna voce nuova nel registro; superficie nuova `regolazioni` in `entra` (riparato a elenco, solo master, rifiutato a partita in corso), `inCorso` in `/api/viandante` (sì/no), tre campi in più nei `publicFiles`; test che un non master non cambi nulla e che i minimi reggano; resta che `checkout`/`reset` del master muovono `ai` sul disco, con effetto solo dalla partita dopo. Test 1935 verdi, typecheck verde.

### T248 · Integrare T243 — `fatto` (`93a25f1`)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 34
- Contesto: T243 (`dossier T243`) è finito, ma `integra T243` va in conflitto in `AGENTS.md` e `src/kernel/kernel.ts`: T238 (`dossier T238`), già nel base, ha scritto negli stessi punti. I due ADR hanno lo stesso numero: 0130 è di T238 nel base.
- Cosa fare: nel tuo worktree `git merge task/T243`; le due aggiunte restano entrambe, in un testo unico dove stanno sulla stessa riga. L'ADR di T243 diventa il primo numero libero (0131, se lo è ancora), con i rimandi in `AGENTS.md`, nei dettagli, nel glossario e in `docs/adr/README.md`. Nessun'altra modifica.
- Test: typecheck e suite intera con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T248`, con mancanze e commissione configurabile entrambe nel codice e descritte. Sicurezza: tocca i crediti, ma solo per l'unione; scrivi l'esito.
- Esito: T243 unito a T238 in `ca281f5`: `QUINE_COMMISSIONE` (ADR-0131) e `world/mancanze.json` (ADR-0130) convivono, in `AGENTS.md` e nell'indice degli ADR con entrambe le voci; conflitti risolti tenendo le due aggiunte, ADR già 0131 sul branch di T243, indice ADR riordinato in una tabella sola; typecheck e suite intera verdi (1792 test). Manca: `docs/glossario-censimento.md` non rigenerato. Non provato: nel browser non è stato visto nulla (non richiesto); valgono i limiti già scritti negli esiti di T243 e T238. Sicurezza: nessuna superficie nuova, tocca i crediti solo per l'unione; la logica degli addebiti è quella di T243, invariata.

### T249 · Integrare T248 e T243 — `fatto` (`bf8061e`)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 34
- Contesto: T248 (`dossier T248`) ha unito T243 a T238, ma `integra T248` va in conflitto in `AGENTS.md` e `vite.config.ts`: T244 (`dossier T244`), entrato nel base nel frattempo, ha scritto negli stessi punti. I due ADR hanno lo stesso numero: 0131 è di T244 nel base.
- Cosa fare: nel tuo worktree `git merge task/T248`; le aggiunte restano tutte, in un testo unico dove stanno sulla stessa riga. L'ADR di T243 diventa il primo numero libero (0132, se lo è ancora), con i rimandi in `AGENTS.md`, nei dettagli, nel glossario, nel codice e in `docs/adr/README.md`; `QUINE_VIDEO` e `QUINE_COMMISSIONE` restano ciascuna col suo ADR. Nessun'altra modifica.
- Test: typecheck e suite intera con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T249`, con video, mancanze e commissione configurabile tutti nel codice e descritti. Sicurezza: tocca i crediti e `server/production.ts` solo per l'unione; scrivi l'esito.
- Esito: T248 unito in `bf8061e`: `QUINE_VIDEO` (ADR-0131), `world/mancanze.json` (ADR-0130) e `QUINE_COMMISSIONE` (ADR-0132) convivono nel codice e nei documenti; conflitti solo in `AGENTS.md` e `vite.config.ts`, risolti tenendo tutte le aggiunte; l'ADR di T243 era già 0132, nessun'altra modifica; typecheck e suite intera verdi (1875 test). Manca: `docs/glossario-censimento.md` non rigenerato (porta solo ciò che arriva dall'unione). Non provato: nulla nel browser (non richiesto) né sotto `npm run serve`; valgono i limiti già scritti negli esiti di T243, T238 e T244. Sicurezza: nessuna superficie nuova; crediti e `server/production.ts` toccati solo per l'unione, logica invariata.

### T250 · Chiudere il ramo di T243 — `fatto` (`2221167`)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Step: 34
- Contesto: il lavoro di T243 è già nel base, entrato con T248 e T249 (`dossier T249`). Su `task/T243` resta solo `12dfb2b`, la rinumerazione dell'ADR a 0132, con le stesse righe di `93a25f1` che è già nel base; ma `integra T243` va in conflitto in `AGENTS.md`, perché nel frattempo quelle righe sono cambiate.
- Cosa fare: nel tuo worktree controlla che `12dfb2b` non porti nulla che manca al base, poi `git merge -s ours task/T243`: il ramo risulta unito e l'albero non cambia. Se trovi qualcosa che manca, non unire: scrivilo nell'esito.
- Test: basta `git diff HEAD~1 HEAD --stat` vuoto, niente suite: l'albero non cambia.
- Browser: non serve.
- Quando è fatto: commit su `task/T250` senza differenze di contenuto. Sicurezza: nessuna superficie nuova.
- Esito: `task/T243` unito con `git merge -s ours` in `2221167`, nessuna differenza di contenuto (`git diff HEAD~1 HEAD --stat` vuoto); `12dfb2b` non porta nulla che manchi al base (24 righe su 25 identiche, la riga `.env` del base ha in più solo `QUINE_VIDEO` di T244; ADR-0132 identico). Manca: nulla. Non provato: suite e typecheck non lanciati, il task non li chiede perché l'albero non cambia. Sicurezza: nessuna superficie nuova.

### T251 · Integrare T247 — `fatto` (`5edb09d`)
- Pipeline: claude · stima 4% · approvato · priorità 1
- Step: 34
- Contesto: nasce da T247 (`dossier T247`, `traccia T247`). `integra T247` va in conflitto con il base in `AGENTS.md`, `src/session/client.ts`, `src/session/protocol.ts`, `src/style.css`: nel frattempo sono entrati T241 (scala φ in `src/theme.css` e negli stili di HUD e pannelli), T243 e T244.
- Cosa fare: nel tuo worktree `git merge task/T247` e risolvi. Due aggiunte nello stesso punto restano entrambe. In `src/style.css` valgono insieme gli stili della lobby di T247 e la scala φ di T241: i nuovi stili della lobby usano le variabili della scala. Tieni l'ADR di T247 col numero 0133 e non toccare l'ADR-0132 di T243.
- Test: suite intera e typecheck verdi.
- Browser: solo la lobby, perché `src/style.css` è in conflitto: `?offline&lobby` da soli a 1920 px, controlli leggibili e non tagliati, blocco dopo l'applicazione. Non rifare le altre prove di T247.
- Quando è fatto: commit di merge su `task/T251`, nessun conflitto rimasto; l'esito dice come hai risolto ciascuno dei quattro file. Sicurezza: nessuna superficie nuova oltre a quella dichiarata da T247.
- Esito: merge di T247 su `task/T251` (`5edb09d`), nessun conflitto rimasto: `AGENTS.md` tiene la commissione di T243 più la riga delle regolazioni; `client.ts` e `protocol.ts` portano in `ingresso` sia `commissione` sia `regolazioni`; `style.css` unisce `z-index: 55` di T247 e scala φ, con i nuovi stili della lobby sulle variabili della scala; ADR-0133 tenuto, ADR-0132 intatto; suite (1943), typecheck e build verdi. Sicurezza: nessuna superficie nuova oltre a quella dichiarata da T247. Manca: difetto nuovo non corretto, la casella del tema nella Genesi è schiacciata a 22 px (proposta `flex-shrink: 0` su `#genesis textarea`, task a parte); resta aperta `docs/pipeline/domande/T247.md`. Non provato, come da task: 390 px, partita di molti e le altre prove di T247.

### T252 · La casella del tema nella Genesi non è schiacciata — `fatto` (`e30e2c8`)
- Pipeline: claude · stima 1% · approvato · browser · priorità 10
- Step: 34
- Contesto: nasce da T251 (`dossier T251`). Nella schermata della Genesi la casella del tema è alta 22 px: un figlio di un contenitore flex che si restringe. Proposta dell'agente che l'ha trovata: `flex-shrink: 0` su `#genesis textarea` in `src/style.css:317`.
- Cosa fare: correggi lo schiacciamento nella regola della casella, senza ritoccare altro della schermata. Se la causa non è quella proposta, correggi la causa e dillo.
- Test: typecheck con il suo turno; la suite intera non serve se cambia solo il CSS.
- Browser: sì, la schermata della Genesi a 1920 e a 390 px: la casella mostra più righe, si può scrivere e ridimensionare, il resto della schermata non esce dalla vista né si taglia.
- Quando è fatto: commit su `task/T252`; nell'esito l'altezza prima e ora. Sicurezza: nessuna superficie nuova.
- Esito: chiuso senza lavoro: la stessa correzione è entrata con T152 (`e30e2c8`, `flex-shrink: 0` sui figli della finestra). Non provati i 390 px.

### T253 · Il parser delle dipendenze capisce gli intervalli — `fatto` (`adbf865`)
- Pipeline: argon · stima 5% · approvato · priorità 10
- Contesto: nasce da T89e (`dossier T89e`, `docs/pipeline/domande/T89e.md`). `parseBacklog` in `tools/pipeline/pipeline.mjs` legge un intervallo come `T89a-d` come il solo `T89a`: un task è partito troppo presto, a dipendenza non finita.
- Cosa fare: in `parseBacklog` espandi le lettere di un intervallo (`T89a-d` → `T89a`, `T89b`, `T89c`, `T89d`; anche `T89a-T89d`). Solo dove il parser legge già le dipendenze: non cambiare le parole che le introducono. Non espandere gli intervalli di soli numeri come `T230-T242`: i due estremi restano ciò che sono oggi. Poi cerca nei blocchi non `fatto` di `docs/plans/backlog.md` la stessa forma e riporta nell'esito quali task cambierebbero dipendenze; il backlog non lo tocchi.
- Test: casi nuovi in `tests/pipeline.test.ts`: intervallo di lettere nelle due forme, un elenco misto con un intervallo, i soli numeri invariati, il task stesso che non diventa una sua dipendenza. Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T253`. Sicurezza: nessuna superficie nuova.
- Esito: in `parseBacklog` (`tools/pipeline/pipeline.mjs`) espansi gli intervalli di lettere nelle due forme (`T89a-d` e `T89a-T89d`) dentro le clausole di dipendenza senza toccare gli intervalli di soli numeri (`T230-T242`) né includere il task stesso; nessun blocco non `fatto` del backlog attuale cambia dipendenze (`T89e` era già stato corretto in `dipende da T89b, T89d`, mentre `T43`, `T45`, `T52` e `T253` hanno intervalli solo fuori dalle clausole di dipendenza); aggiunti i test in `tests/pipeline.test.ts`, typecheck e suite eseguiti nei rispettivi turni (`subscription.test.ts` verde da solo, 131/132 file verdi nel turno della suite intera).

## I modelli e le loro benchmark (chat del 04/11/2026, sera)

L'autore: i modelli più cari non sono per forza i migliori (legge Opus 5.5 sopra Fable 5.1 pur costando meno, in particolare nella pianificazione ad alto livello); i modelli vanno inquadrati con le loro benchmark, l'orchestratore deve sapere chi rende meglio su ogni tipo di task, i modelli di Claude vanno distinti (Opus, Sonnet, ecc.).

### T254 · La scheda dei modelli: benchmark e misure nostre per tipo di task — `fatto` (`302ec9c`)
- Pipeline: argon · stima 10% · approvato · priorità 8
- Contesto: richiesta dell'autore, sopra. Oggi la scelta del provider in `docs/pipeline/pianifica.md` poggia su impressioni (ADR-0115 per Fable). Nasce anche dal contatore «Claude and GPT models» di Antigravity, che `stato` elenca come non usato.
- Cosa fare: scrivi `docs/pipeline/modelli.md`. Per ogni modello disponibile: Claude Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1; Gemini e Argon come li usa `agy`; i modelli Claude e GPT che `agy` offre davvero (guarda cosa dice la CLI). Una tabella modelli × tipi di task della pipeline: pianificazione e orchestrazione, architettura e kernel, programmazione, sicurezza, programmi MarkovJunior, documenti, UI, test semplici. Per ogni cella la benchmark pubblica con nome, data e URL. Accanto, ciò che abbiamo misurato noi da `docs/pipeline/consumi.jsonl`: consumo contro stima per provider, esiti. Prezzi di listino e contatore su cui pesa ogni modello. Infine una proposta di assegnazione per tipo di task, con il motivo.
- Regole: **nessun numero senza fonte**. Ciò che non trovi resta «non misurato», non si deduce e non si ricorda a memoria. Due benchmark che si contraddicono si riportano entrambe. Se non hai accesso al web, fermati e dillo nell'esito: niente tabella inventata. Non toccare `config.json` né il codice.
- Browser: non serve.
- Quando è fatto: commit su `task/T254` col solo `docs/pipeline/modelli.md`. Sicurezza: nessuna superficie nuova.
- Esito: creato e committato `docs/pipeline/modelli.md` con tabella modelli × 8 tipi di task, benchmark pubbliche con data e URL (incluse le contraddizioni), misure reali sulle 141 righe di `consumi.jsonl` e sui benchmark interni (`costi-step8.2B.md`, `lab/banco/`, `quadro.md`), prezzi di listino, contatori CLI (`claude` e `agy`) e proposta motivata di assegnazione per T255; nessun file di codice o configurazione modificato.

### T255 · I modelli di Claude distinti nella pipeline, lo sforzo (`effort`) e l'assegnazione dalla scheda — `fatto` (`9ab72ef`) (dipende da T254, T268)
- Pipeline: claude · stima 3% · approvato · priorità 0
- Sforzo: extra. Decisione dell'autore del 05/11, da codificare in `pianifica.md`, `orchestra.md` e nel predefinito di `assegna`: tanti task `high`, media `extra`, `max` qua e là; la qualità conta più del tempo.
- Ripresa: Argon si è fermato a metà (0 % fino all'11/11). Il worktree `t255` ha le sue modifiche non committate a `tools/pipeline/config.json`, `orchestra.mjs`, `pipeline.mjs`: rileggile con `git diff`, tieni ciò che è giusto, completa e committa. Il ramo è indietro rispetto al base: fondi il base prima dei test.
- Contesto: richiesta dell'autore, sopra e il 05/11 («Voglio che per i task venga anche stimato e distinto l'effort (low, medium, high, extra, max) ho notato che con max i risultati sono eccezionali, sopra ogni aspettativa»). Oggi il provider `claude` è Opus 5.5 e nulla lo dice, né la pipeline distingue o registra il livello di sforzo (`effort`). Nasce da T254 (`dossier T254`), T257 (`dossier T257`) e T268 (`dossier T268`).
- Cosa fare:
  1. **Provider nuovi in `tools/pipeline/config.json`:** `sonnet` e `haiku` (`claude-sonnet-5-5`, `claude-haiku-5-5`), sullo stesso conto di `claude`, con `orchestrabile: false` (inclusi in `piani.claude.{pro,max5x,max20x}.disponibili` e `limiti.modello`); il loro `ratioSessioneSettimana` provvisorio uguale a `claude`, detto nell'esito come non misurato. In base all'esito e alle misure di T268 (`dossier T268`), aggiungi anche `agy-opus` (`claude-opus-5-5-high`) e `agy-sonnet` (`claude-sonnet-5-5-high`) sul contatore `^Claude and GPT models$`, `abbonamento: "google"`, `orchestrabile: false`, `browser: false`, con `ratioSessioneSettimana: 2` misurato in T268 (inclusi in `piani.google.{pro,ultra}.disponibili` e `limiti.modello`). `stato`, `indice` e `assegna` mostrano il modello per nome, così che `claude` si legga come Opus; il nome `claude` resta com'è per non riscrivere il backlog. Il tetto della CLI resta 3 su `claude` e 1 su `agy` e non si alza nessun tetto.
  2. **Sforzo (`sforzo low|medium|high|extra|xhigh|max`) distinto e stimato per task (richiesta dell'autore del 05/11):**
     - In `parsePipelineLine` e `setPipelineLine` (`tools/pipeline/pipeline.mjs`), la riga `- Pipeline:` accetta e conserva `sforzo <low|medium|high|extra|xhigh|max>` (es. `- Pipeline: claude · sforzo max · stima 4% · approvato · priorità 9`; `extra` e `xhigh` sono entrambi validi).
     - `assegna` accetta `--sforzo <low|medium|high|extra|xhigh|max>` (o un token `sforzo <...>`), conserva lo sforzo precedente se non specificato, e `indice` e `writePlan` (`PIANO.md`) mostrano lo sforzo accanto al provider e alla stima quando è impostato.
     - Al lancio (`launch` in `tools/pipeline/pipeline.mjs`): per i provider su `cmd: "claude"` (`claude`, `sonnet`, `haiku`, `fable`), se il task (o il provider in `config.json` tramite `sforzo`) specifica uno sforzo, passa `--effort <livello>` negli argomenti della CLI (mappando `extra`→`xhigh`, poiché `claude --effort` accetta `low, medium, high, xhigh, max`); per i provider su `cmd: "agy"` che hanno varianti `-low|-medium|-high` (`gemini`, `argon`, `agy-opus`, `agy-sonnet`), mappa `low`→`-low`, `medium`→`-medium`, `high|extra|xhigh|max`→`-high` sul flag `--model`.
     - Registra `sforzo` nella voce di `.pipeline/esecuzioni.json` e nella riga di `docs/pipeline/consumi.jsonl` (così misuriamo sul campo il consumo di `max` e `extra` rispetto a `high`/`medium`).
  3. **Documentazione e regole (`docs/pipeline/pianifica.md`, `docs/pipeline/orchestra.md`, `docs/pipeline/modelli.md`, ADR e `AGENTS.md`):**
     - L'assegnazione di modello e sforzo si sceglie da `docs/pipeline/modelli.md`, stimando anche lo sforzo (`sforzo max` raccomandato per architettura, kernel, creazione MarkovJunior, universi e task complessi dove la qualità con `max` è nettamente superiore; `extra`/`xhigh` per task impegnativi; `high` per sviluppo ordinario; `medium`/`low` per compiti meccanici, tenendo conto del maggior peso di `max`/`extra` nella stima %).
     - In `orchestra.md` la regola nuova: **ogni domanda per l'autore si scrive per intero in chat, numerata, con la raccomandazione; i file di `domande/` non bastano**, e l'elenco vivo è `docs/pipeline/domande/aperte.md`.
     - **Deciso dall'autore il 04/11 (D31):** approvate le proposte delle sezioni 4.2 e 4.3 di `docs/pipeline/modelli.md`, con le correzioni di questo blocco e le misure di T268; Opus resta il predefinito e i provider nuovi entrano in prova, Argon solo per task piccoli. Fable può orchestrare se lui spunta la sua casella nella pagina web (`orchestrabile`, già c'è): l'ADR e `AGENTS.md` non dicono più «mai orchestratore», `fable` resta fuori da `orchestra.ordine` e si sceglie con `/agente`, e `orchestra.finestra` gli dà la sua finestra. In 4.3 di `modelli.md` Argon si aggiorna con T257 (16 punti su stima 5, 3,2×). ADR nuovo che aggiorna ADR-0115, riga in `AGENTS.md`.
- Test: `npx vitest run tests/pipeline.test.ts` con i provider nuovi e con `sforzo` (`low|medium|high|extra|xhigh|max` in `parsePipelineLine`, `setPipelineLine`, `assignTask` con `--sforzo`, `launch` che passa `--effort` su `claude` con `extra`→`xhigh` e il suffisso su `agy`, registrazione in `consumi.jsonl`, conto condiviso, tetto della CLI rispettato, nessuno dei nuovi orchestratore) e `node tools/pipeline/pipeline.mjs turno typecheck -- npm run typecheck` (non serve la suite intera del gioco perché tocca solo `tools/pipeline/` e `docs/`).
- Browser: non serve.
- Quando è fatto: commit su `task/T255`. Sicurezza: nessuna superficie nuova.
- Esito: provider `sonnet`, `haiku`, `agy-opus`, `agy-sonnet` in prova a tetto 1, non orchestrabili, tetti delle CLI invariati (3 e 1); modello per nome in `stato`, `indice`, `assegna`, `PIANO.md`, `traccia`, `dossier` e pagina web; `sforzo` nella riga `- Pipeline:`, `assegna --sforzo` (predefinito `high`, tiene quello di prima), `--effort` su claude con `extra`→`xhigh` e suffisso su agy, anche in ripresa, registrato in `esecuzioni.json` e `consumi.jsonl`; regole in `pianifica.md`, `orchestra.md`, `modelli.md` 4.3-4.5, ADR-0146 e `AGENTS.md`; Fable orchestra solo se spuntato, fuori da `ordine`. Oltre il previsto: la settimana in `fitsOn` conta tutto il conto, `/agente` resta finché ha crediti, i menu della pagina web sono generati da `config.json`. Da fare dopo l'integrazione: riportare con `assegna` le righe `- Sforzo:` del backlog, che lo script non legge. Non provato: nessun lancio reale con `--effort` né sui provider nuovi (argomenti verificati con processo finto, `--effort` confermato da `claude --help`); `ratioSessioneSettimana` di `sonnet` e `haiku` provvisorio (12, non misurato), peso di `max` e `extra` non misurato; `tests/pipeline.test.ts` e typecheck verdi, suite intera non lanciata perché il task non la chiede. Sicurezza: nessuna superficie nuova.

### T256 · Un task tornato `da fare` riparte da capo — `fatto` (`e2a2528`)
- Pipeline: claude · stima 3% · approvato · priorità 5
- Contesto: richiesta dell'autore (chat del 04/11/2026). Nasce da T89e (`dossier T89e`). Una voce di `.pipeline/esecuzioni.json` con `integrato` resta anche se il blocco del task torna `da fare`. Il difetto ha due facce, in `tools/pipeline/pipeline.mjs`: `plan` lo mette tra i pronti, ma `execute` lancia solo con `!runs[t.id]`, quindi il task resta fermo in silenzio; `resumeTasks` (`riprendi`) riapre la vecchia conversazione nel vecchio worktree, che `integra` ha tolto, e l'esecuzione muore con codice -1 e log vuoto, finendo come «fallito». Oggi l'unica via è togliere la voce a mano.
- Cosa fare: una voce già integrata non vale più per un task non chiuso: il task si lancia da capo, con worktree, branch e conversazione nuovi, senza che nessuno intervenga, e `riprendi` fa lo stesso. Anche fuori da questo caso, `riprendi` su una voce il cui worktree non esiste più non deve riaprire la conversazione: riparte da capo e lo dice nel messaggio. Non perdere ciò che `dossier` e `traccia` dicono del tentativo vecchio, se costa poco (per esempio i campi essenziali in una lista `precedenti` della voce nuova). Un task `fatto` non cambia: la sua voce resta com'è. Una voce finita e non integrata resta `daIntegrare`.
- Test: casi nuovi in `tests/pipeline.test.ts`: voce integrata e blocco `da fare` (viene lanciato, voce nuova con `tentativi` da capo); `riprendi` sulla stessa voce; `riprendi` con worktree assente; voce integrata e blocco `fatto` (nulla cambia); voce finita non integrata (resta da integrare). Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T256`; `docs/pipeline/README.md` aggiornato se descrive `riprendi`. Sicurezza: nessuna superficie nuova.
- Esito: una voce integrata di un task non chiuso non vale più: `esegui` lo rilancia con worktree, branch e conversazione nuovi e `tentativi` da capo; `riprendi` su voce integrata, senza worktree o senza conversazione la porta allo stato `da capo` e lo dice; tentativi vecchi in `precedenti`, mostrati da `dossier` e `traccia`; `fatto` e voci non integrate invariati; cambiato rispetto al previsto: log con nome proprio (`T1.d1.1.log`) per non sovrascrivere i vecchi, `taskWorktree` fa `git worktree prune` se la cartella è sparita; da sapere: integrare un `fallito` o un esito senza riga lascia il blocco `da fare`, quindi ora il task si rilancia da solo (scritto nel README), e con worktree sparito e branch ancora presente riparte da quel branch; non provato: una CLI reale (test su repository git veri con CLI finta); suite 2060 passati e 1 saltato, typecheck verde. Sicurezza: nessuna superficie nuova.

### T257 · La scheda dei modelli: correggere attribuzioni e misure — `fatto` (`5a08aac`)
- Pipeline: argon · stima 5% · approvato · priorità 7
- Contesto: richiesta dell'autore: sui modelli fatti, non impressioni. Nasce da T254 (`dossier T254`). Il controllo a campione dell'orchestratore su `docs/pipeline/modelli.md` conferma prezzi e Terminal-Bench 4.0 di Sonnet e Opus e i prezzi di Haiku, e trova gli errori qui sotto, che pesano proprio sulla proposta di assegnazione.
- Cosa fare, nel solo `docs/pipeline/modelli.md`:
  1. **Riga dei programmi MarkovJunior (sezione 4.2).** Dice che Opus in T180 «ha prodotto» 31 programmi statici e in T182 lavorava senza i pattern di Fable. Falso: T180 ha solo misurato programmi di prima; T182 aveva i pattern di T181 nel prompt ed è passato da 31/31 statici a 10/12 su misure e varianza, con foto 0/10 per giudizio dell'agente. T181 non è «3/3»: il tempio ha varianza 0,00 nel perimetro (`quadro.md`). Accerta quale modello usa `claude -p` nel banco (`lab/banco/README.md` non lo dice) e riscrivi il confronto con ciò che è misurato; Fable a mano in T181 (80 $) e il banco a richiesta (1,15 $ a modello) non sono la stessa prova: dillo.
  2. **I consumi.** La scheda legge 141 righe; quelle vere sono 213, perché il file nel base non è committato. Leggi `H:\projects\rune\.claude\worktrees\step8.2A-lab3d\docs\pipeline\consumi.jsonl` (solo lettura) e rifai ogni aggregato; T181 e T182 hanno la loro riga.
  3. **Argon «8×».** I 122 punti contano due volte lo stesso calo: T68b e T69 partono entrambi da 63 con esito 28 e 13, cioè girano insieme. Il calo vero è 37 + 50. Aggiungi T254: stima 10, misurati 11. Riscrivi il fattore, dicendo quanti task e quanto è incerto.
  4. **OSWorld 2.1.** La pagina di Sonnet 5.5 dà per Opus 81,8 % (partial), la scheda 87,2 %: se sono entrambi veri riportali come contraddizione, altrimenti correggi. Il link della valutazione di Argon ora rimanda a `storage.googleapis.com/deepmind-media/gemini/gemini_4_argon_model_evaluation.pdf`: rileggi da lì i suoi numeri e aggiorna il link.
  5. **La proposta.** Ciò che regge solo su quei numeri cambia con loro. Le voci mai provate da noi (i modelli Claude su `agy`, Sonnet e Haiku) si scrivono come tali, in chiaro.
- Regole: quelle di T254. Non toccare `config.json` né il codice.
- Browser: non serve.
- Quando è fatto: commit su `task/T257` col solo `docs/pipeline/modelli.md`; nell'esito cosa cambia nella proposta. Sicurezza: nessuna superficie nuova.
- Esito: aggiornato `docs/pipeline/modelli.md` correggendo l'attribuzione di T180/T181/T182 e del modello del banco (`claude-opus-5-5`), ricalcolando i consumi sulle 213 righe di `consumi.jsonl` (inclusi T181, T182 e T254), correggendo il fattore di Argon da 8,13× a 3,92× su 4 task (1,10× in T254, senza doppio conteggio T68b+T69), riallineando OSWorld 2.1 (Opus 81,8 % vs Sonnet 80,1 %) e tutti i numeri del PDF `gemini_4_argon_model_evaluation.pdf`, e aggiornando la proposta di assegnazione con indicazione esplicita delle voci `mai provato da noi`; nulla manca.

### T260 · Il versionamento del kernel (`X.Y.Z`) e la compatibilità degli universi — `fatto` (`73b5841`)
- Cloud: fatto su Claude Cloud, portato da T274 (`73b5841`).
- Pipeline: claude · stima 3% · approvato · priorità 10
- Step: 32
- Contesto: decisioni dell'autore del 04/11 (D32): (1) una nuova versione incompatibile del kernel non è vincolata dalla retrocompatibilità con gli universi precedenti («se vuoi giocare sul nuovo kernel devi iniziare un nuovo universo»; gli universi vecchi girano sul server della versione con cui sono nati o migrano in futuro via IA a pagamento); (2) introdurre da subito il versionamento rigoroso del kernel a partire da `0.1.0`, avanzando progressivamente quando le modifiche toccano `src/kernel/`. Nasce da T183 (`dossier T183`).
- Cosa fare:
  1. **Schema SemVer del kernel (`X.Y.Z` = `FASE . CONTRATTO . INCREMENTO`):**
     - `X` (**Major — era**): `0` durante lo sviluppo e la beta (Fase I-II), `1` dal kernel `1.0.0` (Fase III-IV).
     - `Y` (**Minor — contratto dell'universo**): parte da `1` (`0.1.0`), sale di `+1` quando uno step o una modifica di `src/kernel/` cambia il contratto con l'universo (formati in `world/`/`maps/`/`modules/`, semantica delle primitive o regole del terreno) in modo incompatibile con gli universi esistenti (richiedendo un nuovo universo), ed è `9` (`0.9.0`) al congelamento della Beta a fine Fase I.
     - `Z` (**Patch — incremento progressivo del kernel**): parte da `0` e sale di `+1` a ogni task integrato che modifica `src/kernel/` restando compatibile con gli universi della stessa `X.Y` (correzioni, ottimizzazioni, aggiunte puramente additive; torna a `0` quando sale `Y`).
  2. **`KERNEL_VERSION` e `universe.json → kernel`:**
     - Definisci `KERNEL_VERSION = '0.1.0'` in `src/kernel/` (allineato a `package.json`, verificato da un test) e scrivilo in `universe/universe.json → kernel` e a ogni creazione/salvataggio dell'universo.
     - Funzione pura `checkKernelVersion(universeKernel, kernelVersion)` chiamata al caricamento dell'universo: un universo è compatibile se ha lo **stesso `X.Y`** del kernel e `Z_universo <= Z_kernel`; se `X.Y` è diverso (o `Z_universo > Z_kernel`), rifiuta/avvisa in modo chiaro indicando la versione dell'universo e quella del kernel (serve iniziare un nuovo universo o usare il server della versione `X.Y`).
  3. **Effetto senza chi lo applica:** quando un effetto invocato non è gestito né dal kernel né da `core.effects`, alza un guasto chiaro (`fault`) invece di ignorarlo in silenzio.
  4. **ADR, regole e test:** ADR sul versionamento `X.Y.Z` e sulla regola «nuovo contratto `X.Y` = nuovo universo»; aggiorna `AGENTS.md` (chi tocca `src/kernel/` aggiorna `KERNEL_VERSION` e `package.json` secondo `Y`/`Z`) e `docs/fasi.md` (criteri 5 e 8 di Fase I); adatta i test `TRAP` di `tests/espressivita/` che assumevano la retrocompatibilità tra contratti diversi del kernel.
- Test: `checkKernelVersion` (stesso `X.Y` con `Z <=` accettato, `X.Y` diverso o `Z >` rifiutato, allineamento con `package.json`), guasto su effetto ignoto, test di `tests/espressivita/`. Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T260`; ADR, `AGENTS.md`, `docs/fasi.md`. Sicurezza: scrivi l'esito, tocca il caricamento di un universo.

### T261 · I luoghi salvati come caselle — `fatto` (chiuso senza lavoro: decisione dell'autore del 04/11, D32)
- Pipeline: claude · stima 8% · approvato · priorità 10
- Step: 32
- Contesto: decisione dell'autore del 04/11 (D32): `plan.tiles` serviva solo a congelare le caselle contro cambi di caso/MJ/layout tra versioni diverse del kernel, che l'autore ha escluso (bloccare le caselle impedirebbe evoluzioni come l'immersione in acqua). Dentro lo stesso contratto `X.Y` del kernel `(piano, seme) + plan.edits` è già deterministico. Nasce da T183 (`dossier T183`).
- Cosa fare: annullato in D32.
- Test: non serve.
- Browser: non serve.
- Quando è fatto: chiuso senza lavoro.
- Esito: chiuso senza lavoro per decisione dell'autore (04/11, D32): congelare le caselle in `plan.tiles` tra versioni del kernel legherebbe le mani alle evoluzioni future; dentro lo stesso contratto `X.Y` del kernel `(piano, seme) + plan.edits` è già deterministico, e un cambio incompatibile di `X.Y` richiede un nuovo universo.

### T262 · Il salvataggio che non si ferma — `fatto` (`73b5841`)
- Cloud: fatto su Claude Cloud, portato da T274 (`73b5841`).
- Pipeline: claude · stima 6% · approvato · priorità 12
- Step: 32
- Contesto: decisione dell'autore del 04/11 (D9): un guasto a runtime di un modulo invalida il codice, non i dati della partita. Oggi un guasto qualsiasi, anche di un giocatore, ferma tutti i salvataggi: in una vita di mesi è la perdita più probabile. Nasce da T183 (`dossier T183`): `docs/design/espressivita.md`, primitiva 3 e `TRAP: every module that calls it`.
- Cosa fare: con un guasto aperto stato, viandanti e piani si salvano; il codice guasto non diventa uno stato valido. Riscrivi la regola 6 di `AGENTS.md` con la distinzione. `R` e la riparazione dell'Ingegnere restano come sono, e non toccano i file modificati dal giocatore (regola 3). Decidi e di' nell'esito cosa succede a chi torna all'ultimo stato valido del codice tenendo i dati nuovi.
- Test: un modulo in guasto e dei dati salvati si riaprono; il guasto di un giocatore non ferma i salvataggi degli altri; `R` torna indietro come prima. Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T262`; ADR, regola 6. Sicurezza: scrivi l'esito.

### T263 · I pannelli e i comandi di ogni viandante in multigiocatore — `fatto` (`73b5841`) (dipende da T245a)
- Cloud: fatto su Claude Cloud, portato da T274 (`73b5841`).
- Pipeline: claude · stima 8% · approvato · priorità 16
- Step: 32
- Contesto: primitive `W` e `K` di `docs/design/espressivita.md`, approvate dall'autore il 04/11 (D10). Senza, nessuna meccanica con un pannello si legge e nessun veicolo si guida; il pannello del cantiere di T245d usa `W`. Nasce da T183 (`dossier T183`).
- Cosa fare: `W`: i `campo` nominati dai `manifest.ui` viaggiano in `MyState`, a elenco (regola 8f). `K`: `world.wanderers()`, `input.held(azione, id)`. Un'API nuova per Lua segue la convenzione di `AGENTS.md`.
- Test: gli scenari di `tests/espressivita/` che chiedevano `W` e `K` ora riescono in multigiocatore; un campo non nominato non esce. Suite intera e typecheck con i loro turni.
- Browser: sì, due schede con `?viandante=`.
- Quando è fatto: commit su `task/T263`; ADR se serve, riga in `AGENTS.md`. Sicurezza: scrivi l'esito, tocca il filo.

### T245a · Il magazzino durevole e `vite` — `fatto` (`73b5841`) (dipende da T262)
- Cloud: fatto su Claude Cloud, portato da T274 (`73b5841`).
- Pipeline: claude · stima 7% · approvato · priorità 13
- Step: 32
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezione 7. Fase 0.9.0, decisione dell'autore del 04/11 (D8). Primitive 2 e 5 di `docs/design/espressivita.md` (D10).
- Cosa fare: `world.store_get/set` (file per modulo, tetto in byte, fuori da `playerFiles`); il salvataggio conserva i campi ignoti; `vite` in `COEFFICIENT_KEYS` con 0 assente, in lobby e in `hourlyEstimate`.
- Test: `TRAP: in the saved state` cambia di conseguenza; `vite` segue la sorte di `dialoghi` a partita in corso. Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T245a`; ADR, glossario, `AGENTS.md`. Sicurezza: scrivi l'esito.

### T245b · Il lavoro degli NPC: i primi tre mestieri — `fatto` (`73b5841`) (dipende da T245a)
- Cloud: fatto su Claude Cloud, portato da T274 (`73b5841`).
- Pipeline: claude · stima 12% · approvato · priorità 17
- Step: 32
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezioni 1 e 7. Fase 0.9.0 (D8).
- Cosa fare: `sys.lavoro` con i comportamenti, `world.path` e `world.find_tile` nel `Host`, `matura` nei terreni, il giorno in `plan.edits`; tre programmi scritti a mano nel seme (contadino, boscaiolo, pescatore) e il campo che cambia davvero, senza una chiamata ai modelli.
- Test: test del banco su un luogo pianificato. Suite intera e typecheck con i loro turni.
- Browser: sì: un contadino ara, semina e miete.
- Quando è fatto: commit su `task/T245b`; ADR, glossario, `AGENTS.md`. Sicurezza: scrivi l'esito.

### T245c · Gli altri mestieri del seme — `fatto` (`73b5841`) (dipende da T245b)
- Cloud: fatto su Claude Cloud, portato da T274 (`73b5841`). Nel browser da vedere con T280.
- Pipeline: claude · stima 7% · approvato · priorità 18
- Step: 32
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezione 7. Fase 0.9.0 (D8).
- Cosa fare: gli altri nove programmi del seme per le quattro ambientazioni (T152), `produci` e `usa` (`host.act`), il deposito del luogo.
- Test: Suite intera e typecheck con i loro turni.
- Browser: sì: una giornata di tre mestieri.
- Quando è fatto: commit su `task/T245c`; glossario. Sicurezza: scrivi l'esito.

### T245d · Le imprese — `fatto`
- Cloud: finita il 05/11 (sessione B, `e7cddc1`); integrata con T280, via T297 e T300 (`d4dc0c6`): ADR-0147, 0148, 0149, kernel 0.1.9.
- Pipeline: claude · stima 12% · approvato · priorità 19
- Step: 32
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezione 3. Fase 0.9.0 (D8).
- Cosa fare: `world/imprese.json`, assegnazione, materiali, morte e sostituzione, le imprese dalle regole del kernel (ricostruzione, casa comune, raccolto), `costruisci`, il pannello del cantiere con `W`.
- Test: test di durata: mesi di orologio, riaperture. Suite intera e typecheck con i loro turni.
- Browser: sì: un'impresa che avanza e il suo pannello.
- Quando è fatto: commit su `task/T245d`; ADR, glossario, `AGENTS.md`. Sicurezza: scrivi l'esito.

### T245e · L'edificio per stadi — `fatto`
- Cloud: finita il 05/11 (sessione B, `e7cddc1`); integrata con T280, via T297 e T300 (`d4dc0c6`): ADR-0147, 0148, 0149, kernel 0.1.9.
- Pipeline: claude · stima 9% · approvato · priorità 20
- Step: 32
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezione 3.4. Fase 0.9.0 (D8).
- Cosa fare: filtro `(griglia, stadio)`, impalcature e picchetti, impronta e pavimenti per stadio, `stadio` nel piano.
- Test: Suite intera e typecheck con i loro turni.
- Browser: sì: una casa che sale in quattro fasi.
- Quando è fatto: commit su `task/T245e`; ADR se è un contratto nuovo dei programmi. Sicurezza: scrivi l'esito.

### T245f · Fuori vista — `fatto`
- Cloud: finita il 05/11 (sessione B, `e7cddc1`); integrata con T280, via T297 e T300 (`d4dc0c6`): ADR-0147, 0148, 0149, kernel 0.1.9.
- Pipeline: claude · stima 9% · approvato · priorità 21
- Step: 32
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezione 5. Fase 0.9.0, decisione dell'autore del 04/11 (D8: il progetto la lasciava aperta).
- Cosa fare: contabilità al cambio di fase, `on_return`, maturazione e stadio al ritorno; sul server dei mondi di molti con due viandanti lontani.
- Test: Suite intera e typecheck con i loro turni.
- Browser: sì, due schede con `?viandante=`.
- Quando è fatto: commit su `task/T245f`; ADR se serve. Sicurezza: scrivi l'esito, tocca il server.

### T245g · Il Narratore scrive mestieri e imprese — `in attesa` (dipende da T245c, T245d, T327)
- Pipeline: claude · stima 10% · approvato · priorità 90
- Step: 39
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezione 7. Fase 1.0.0 (D8): non parte prima della Fase III. Vincolo dell'autore (06/11): dentro il confine dell'NPC della sezione 10 (T326, T327), niente comportamento NPC in moduli nuovi fuori di lì; vale anche per T245h e T245i.
- Cosa fare: `job.program` con `JobDirector` e validatore, `impresa.plan` dalle trame e dal Referente, effetto `impresa`, `CENSUS`, mock, registro; i costi misurati su un universo.
- Test: Suite intera e typecheck con i loro turni.
- Browser: da decidere quando riparte.
- Quando è fatto: commit su `task/T245g`; Sicurezza: scrivi l'esito.

### T245h · I bivi degli NPC — `in attesa` (dipende da T245g)
- Pipeline: claude · stima 10% · approvato · priorità 90
- Step: 39
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezione 2. Fase 1.0.0 (D8): non parte prima della Fase III.
- Cosa fare: `npc.decide` con l'Attore o il Narratore, opzioni chiuse, ritmo, chi paga; tratti e opinioni in `people.json` e nella scheda; a grado 0 il seme.
- Test: Suite intera e typecheck con i loro turni.
- Browser: da decidere quando riparte.
- Quando è fatto: commit su `task/T245h`; Sicurezza: scrivi l'esito.

### T245i · Vite lunghe — `in attesa` (dipende da T245h)
- Pipeline: claude · stima 10% · approvato · priorità 90
- Step: 39
- Contesto: Nasce da T245 (`dossier T245`): progetto in `docs/design/comportamento-npc.md`, sezione 8. Fase 1.0.0 (D8): non parte prima della Fase III.
- Cosa fare: cronaca per righe, `npc.reflect`, `npc.life` con il calendario (nozze, nascite, traslochi, cambio mestiere, morte naturale), vicinato e colleghi derivati dal grafo; un universo di prova fatto invecchiare 90 giorni di mondo.
- Test: Suite intera e typecheck con i loro turni.
- Browser: da decidere quando riparte.
- Quando è fatto: commit su `task/T245i`; Sicurezza: scrivi l'esito.

### T264 · `?dev&teleport` ignora lo scostamento salvato — `fatto` (`c007831`)
- Pipeline: claude · stima 2% · approvato · priorità 15
- Contesto: decisione dell'autore del 04/11 (D13): chi chiude nella corona riparte dov'era, come oggi. Ma `pagehide` salva lo scostamento del tappeto, che sposta `?dev&teleport=46,0` di 46 caselle a ogni caricamento chiuso bene. Nasce da T214 (`dossier T214`).
- Cosa fare: con `?dev&teleport` lo scostamento salvato non si applica, così l'URL porta sempre allo stesso punto; senza, tutto come prima.
- Test: un test sullo scostamento con e senza `teleport`, se la logica si isola. Suite intera e typecheck con i loro turni.
- Browser: sì: due caricamenti di `?dev&teleport=46,0` chiusi bene arrivano allo stesso punto; senza `teleport` si riparte dov'era.
- Quando è fatto: commit su `task/T264`; nell'esito cosa è stato provato. Sicurezza: nessuna superficie nuova.

### T265 · I commit non si perdono: fila su disco, tutte le scritture, token scaduto — `fatto` (`c007831`)
- Pipeline: claude · stima 6% · approvato · priorità 14
- Step: 34
- Contesto: decisione dell'autore del 04/11 (D15): prima della beta. Nasce da T211 (`dossier T211`, ADR-0122): la fila di `UniverseClient` sta solo in memoria e senza tetto; `putMap`, `branch` e `merge` non ritentano; un 401 da token scaduto perde il commit.
- Cosa fare: la fila sopravvive a una ricarica e ha un tetto, con ciò che fa al tetto scritto nell'ADR; `putMap`, `branch` e `merge` ritentano come i commit; un 401 rinnova il token e riprova. Un rifiuto del server resta senza nuovi tentativi (regola 6). Mai un ordine diverso da quello dei commit.
- Test: server che cade e torna, ricarica a metà fila, token scaduto. Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T265`; ADR che aggiorna ADR-0122, regola 6. Sicurezza: scrivi l'esito, tocca token e scritture sull'universo.

### T266 · Un'altra tornata di rinomine — `in attesa`
- Pipeline: claude · stima 5% · priorità 90
- Contesto: decisione dell'autore del 04/11 (D14): sì, verso la fine della Fase I. I nomi sono dell'autore: quando riparte, l'orchestratore gli chiede quali righe nuove aggiungere al glossario (ADR-0117); il task poi le esegue.
- Cosa fare: i nomi rimasti, per riga. R4: `SessionClient.places`, `Client.places`, `ThinClient.places()`, `ShowcaseEntry.place`, `graphCache.places`, `PLACE_PHASES`, `PLACES_PER_MINUTE`, `Kernel.miniature`, `tests/places.test.ts`. R7: `stepTornio`, `openTornio`, `TORNIO_AT`, `CoronaView.tornio`, `Studio.tornio`, `Kernel.plinto()`, `updatePlinto`, che convivono con `lathe`. R8: «ledger» in locali e commenti di consumi e carte, omonimo dei saldi. R9: «ground floor» nei commenti. R10: i campi `cell` di `Placements` e `HoverInfo`, `Building.cells`, `Cell`/`cells`/`cell()` di `water.ts`, `Overlay.cell`, i locali `cells`. R11: il campo `layouts` di `environmentsFor` e `designLayouts`, `validateLayout`, `checkLayout`, `LayoutCheck`. R12: `tiles` e `tile` del risultato di `cartography.ts`, `VOID_TILE`. R13: «universe/world/server/session of many» nei commenti. R14: «qualche chunk» in `CLAUDE.md:19`. R15, per scelta: l'ancora `#reami`, `quine:sito:reame` in `localStorage`, `realm-card` in `docs/design/sito/`. R16: il locale `person` di `src/ui/chat.ts`, `persona` di `src/render/entities.ts:156`, testi e `tab-persone` di `site/index.html`, il testo di `tools/sicurezza/catalogo.mjs:614`. R17: i locali `partita` di `server/access.ts:100,140`, `tests/partita.test.ts`, `ProvaTaglia` e `taglieDiProva` di `lab/banco/varianza.ts`. I numeri di riga sono del 04/11: ricontrollali.
- Test: Suite intera e typecheck con i loro turni.
- Browser: non serve, salvo righe che toccano ciò che si vede.
- Quando è fatto: commit su `task/T266`; Sicurezza: nessuna superficie nuova.

### T267 · `tests/subscription.test.ts` rosso sotto carico, verde da solo: la causa — `fatto` (`c007831`) (dipende da T255)
- Pipeline: claude · stima 2% · approvato · priorità 40
- Contesto: decisione dell'autore del 04/11 (D28). Il file è rosso nella suite intera e verde da solo: visto in T89c e T253, già notato in passato come «rosso di carico» senza cercarne la causa (`dossier T253`, `dossier T89c`). Un rosso che si ignora nasconde quelli veri.
- Cosa fare: riprodurlo (suite intera o carico simulato), trovare la causa, correggerla nel test o nel codice, secondo dove sta. Se è un tempo massimo troppo stretto, dirlo con la misura, non alzarlo a occhio. Se non si riproduce, scrivere nell'esito cosa è stato provato e fermarsi lì: niente correzioni alla cieca.
- Test: il file verde in più giri sotto carico. Suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T267`; nell'esito la causa, o cosa è stato provato. Sicurezza: nessuna superficie nuova.

### T268 · Prova e misura dei modelli esterni di `agy` (`Claude and GPT models`) — `fatto` (`215e2c1`) (dipende da T257)
- Pipeline: argon · stima 2% · approvato · priorità 1
- Contesto: richiesta dell'autore (04/11): provare sul campo i modelli esterni offerti da `agy` (`claude-opus-5-5-high`, `claude-sonnet-5-5-high`, `gpt-oss-120b-medium`) sul contatore `Claude and GPT models` per vedere quanto consumano davvero prima di T255. Nasce da T254 (`dossier T254`) e T257 (`dossier T257`).
- Cosa fare: per ciascuno dei tre modelli (`claude-opus-5-5-high`, `claude-sonnet-5-5-high`, `gpt-oss-120b-medium`), leggi `agy -p /usage` prima del lancio, poi esegui `agy -p --output-format json --dangerously-skip-permissions --model <modello>` su uno stesso compito reale e breve in sola lettura nel tuo worktree (leggere `src/kernel/paths.ts` e `tests/paths.test.ts`, lanciare `npx vitest run tests/paths.test.ts` e riassumere in 5 righe cosa verifica ogni test), poi rileggi `agy -p /usage`. Registra per ogni modello: esito, durata, eventuali errori o limiti raggiunti, il calo esatto di `Claude and GPT models` (`Weekly Limit Remaining` e `Five Hour Limit Remaining`) e il rapporto 5h/settimana. Se un modello esaurisce la finestra di 5 ore, annotalo e fermati. Aggiorna `docs/pipeline/modelli.md` (sezioni 1.2, 3.1 e 4.1) con i numeri misurati. Non toccare altri file.
- Browser: non serve.
- Quando è fatto: commit su `task/T268` col solo `docs/pipeline/modelli.md`; nell'esito i cali misurati (settimana e 5h) per ciascun modello. Sicurezza: nessuna superficie nuova.
- Esito: provati e misurati sul campo i tre modelli esterni di `agy` sul contatore `Claude and GPT models` (`claude-opus-5-5-high`: settimana -4 pt [97%→93%], 5h -8 pt [100%→92%], rapporto 2,00, 23,61 s; `claude-sonnet-5-5-high`: settimana -2 pt [93%→91%], 5h -4 pt [92%→88%], rapporto 2,00, 17,01 s; `gpt-oss-120b-medium`: settimana 0 pt [91%→91%], 5h 0 pt [88%→88%], rapporto 0/0, 25,47 s) e aggiornate le sezioni 1.2, 3.1 e 4.1 di `docs/pipeline/modelli.md`; nulla manca.

### T269 · Cantiere 1: il catalogo di 24 strutture procedurali e le cantine veloci — `fatto` (`9298643`)
- Step: —
- Contesto: richiesta dell'autore (04/11, sessione cloud): 24 programmi MarkovJunior di strutture (`classe` grande), 6 per ambientazione (fantasy, steampunk, moderno, futuristico), almeno 12 con la cantina (`suolo="E"`, ADR-0135), ognuno validato con `lab/banco/misure.ts` e `lab/banco/varianza.ts` su 5 semi e 2 taglie (Grande, Enorme), sotto 4500 ms a Enorme. Il riferimento `lab/banco/riferimento/cantina.xml` impiegava 7 s a Enorme (`docs/pipeline/domande/T258.md`).
- Cosa fare: in `lab/banco/catalogo-cloud/` gli XML, un rapporto per struttura (misure alle due taglie, varianza, traccia del seme 1), l'indice `README.md`; nessun modello chiamato.
- Quando è fatto: le 24 strutture passano; commit ogni 4. Sicurezza: nessuna superficie nuova (solo `lab/`).
- Esito: 24 strutture su 24 passano (5/5 semi a Grande e a Enorme, varianza sopra ogni soglia), 12 con la cantina; massimo a Enorme 3,3 s (le cantine 2,5-3,3 s, le altre 1,6-1,8 s, misurati con tre prove in parallelo). La cantina del riferimento passa da 7,4 s a 2,0-2,4 s senza cambiare l'edificio: colonne alte in un passo, la scala della cantina ancorata al vuoto del pozzo, l'imbottitura dei pattern del progetto (`lab/banco/catalogo-cloud/ottimizza.ts`, griglie confrontate cella per cella). Rispetto al previsto: lo scheletro senza cantina non variava a 5 semi (stanze e perimetro), corretto con una quarta campata a moneta, un arredo a moneta e un'ala nel margine; le torri a Grande sporgono poco (la scatola è alta 80). `npm test`: 2 test di `tests/sicurezza/` (V-006, V-007) cadono in questo ambiente per il Permission Model di Node 22.23 (`fsync` disabilitato), anche senza queste modifiche; typecheck verde. Sicurezza: nessuna superficie nuova.

### T270 · Cantiere 2: 24 modelli del seme procedurali e 40 props tematici — `fatto` (`28afffb`)
- Step: —
- Contesto: richiesta dell'autore (04/11, sessione cloud): riscrivere i 24 modelli non-corona di `universe/models/` come programmi MarkovJunior procedurali in `lab/banco/seme-procedurale/` e creare 40 props tematici (10 per ambientazione: fantasy, steampunk, moderno, futuristico) in `lab/banco/props-tematici/`, validati su 5 semi con varianza ≥ 0,15 e zero frammenti staccati.
- Cosa fare: in `lab/banco/seme-procedurale/` e `lab/banco/props-tematici/` i 64 XML, i rapporti `.md`, le anteprime `.png` e il banco `prova.ts`; non toccare `universe/models/`.
- Quando è fatto: tutti i 64 modelli passano il validatore su 5 semi. Sicurezza: nessuna superficie nuova (solo `lab/`).
- Esito: 64 modelli su 64 (24 in `lab/banco/seme-procedurale/` e 40 in `lab/banco/props-tematici/`) passano `modelErrors`, `checkProgram` e `analyse` con `grounded` su 5 semi senza frammenti staccati e con varianza ≥ 0,15 (media delle medie 0,44 sul seme); `universe/models/` intatto. Sicurezza: nessuna superficie nuova.

### T271 · Cantiere 3: 44 programmi sonori MarkovJunior per i 4 temi e gli effetti — `fatto` (`5c3ff31`)
- Step: —
- Contesto: richiesta dell'autore (04/11, sessione cloud): 44 programmi sonori MarkovJunior in `lab/banco/suoni-cloud/` (`suono-effetto-morte-v2.xml`, 24 brani per le 4 ambientazioni, 19 effetti), validati su 10 terne di semi (`[1..3]` .. `[28..30]`) senza difetti in `analyzeSound` né `modelErrors`, con distanza tra i semi ≥ 0,15.
- Cosa fare: in `lab/banco/suoni-cloud/` gli XML, i rapporti in `rapporti/`, il compositore `componi.mjs` e il validatore `valida.ts`; non toccare `universe/models/`.
- Quando è fatto: tutti i 44 programmi passano su 10 terne. Sicurezza: nessuna superficie nuova (solo `lab/`).
- Esito: 44 programmi sonori su 44 passano `analyzeSound` e `modelErrors` su tutte le 10 terne di semi con distanza ≥ 0,15; rapporti completi in `lab/banco/suoni-cloud/rapporti/` e guida `README.md`. Non provato l'ascolto umano. Sicurezza: nessuna superficie nuova.

### T272 · Cantiere 4: i tre universi completi (`orichalcum`, `neapolis`, `sidera`) in `lab/banco/universi-cloud/` — `fatto` (`2ced05c`, `eb822f7`, `5e90652`)
- Step: —
- Contesto: richiesta dell'autore (04/11, sessione cloud): generare interamente offline su abbonamento i tre universi tematici (`orichalcum` steampunk, `neapolis` moderno, `sidera` futuristico) in `lab/banco/universi-cloud/<nome>/`, ciascuno con bibbia, atlante, 24 persone, 8 trame, regole, lessico, canone con 12 rune nuove, 25 moduli Lua + 4 di dati, 19 luoghi pre-pianificati (`maps/`), 16 modelli MarkovJunior e 8 programmi sonori, validati dai validatori del kernel e da almeno 600 tick sul `Kernel` vero con `MockAiModels`.
- Cosa fare: in `lab/banco/universi-cloud/{orichalcum,neapolis,sidera}/` tutti i file dell'universo, gli strumenti di verifica e `verifica.ts`; zero chiamate API esterne.
- Quando è fatto: tutti e tre passano `verifica.ts` con 0 fault e 0 rotture della quarta parete. Sicurezza: nessuna superficie nuova (solo `lab/`).
- Esito: `orichalcum` (`2ced05c`), `neapolis` (`eb822f7`) e `sidera` (`5e90652`) passano tutti i controlli (`metaBreak`, `canonBreak`, `bibleBreaks`, `validateForged` su 25 moduli, `validatePlan` e `validateLayout` su 19 luoghi, `checkSociety` su 24 persone, `reviewPlot` su 8 trame, `validateNewRune` su 12 rune, `modelErrors` + varianza ≥ 0,15 su 16 modelli, `analyzeSound` su 8 suoni) e 600-900 tick sul `Kernel` vero con **0 fault**. Sicurezza: nessuna superficie nuova.

### T273 · Integrare a costo zero nei quattro universi esplorabili le strutture, i modelli e i suoni creati su Claude Cloud — `fatto` (`c5ecbd8`)
- Cloud: finita il 05/11 (sessione A, `752288c`), portata da T279.
- Pipeline: claude · stima 4% · approvato · priorità 1
- Contesto: richiesta esplicita dell'autore del 05/11 («integrare le modifiche svolte in cloud da claude nei quattro universi esplorabili. E se si può fare a costo zero (solo su abbonamento e/o offline) mi piacerebbe vedere le magnifiche strutture create in cloud in game»). Nasce da T269 (`dossier T269`), T270 (`dossier T270`), T271 (`dossier T271`) e T272 (`dossier T272`). Poiché tutti gli XML sono già pronti e validati, se i modelli delle strutture sono registrati in `models/struttura-<ownModelId(concetto).slice(0, 30)>.xml` e in `models/index.json`, `Kernel.lotsOf` (`this.forms.resolve(own, classe)`) trova subito `own === model` senza mettere `wanted`, quindi `ModelDirector` non chiama mai lo Scultore (**0 chiamate API, costo 0,00 $**).
- Cosa fare:
  1. **Unificare il catalogo completo delle strutture Cloud:** unisci in `lab/banco/catalogo-cloud/` anche le 22 strutture distinte del ramo gemello `origin/claude/quine42-3d-structures-catalog-3l6ejl` (portando il catalogo a 46 strutture complessive: 12 fantasy, 12 steampunk, 11 moderno, 11 futuristico) e, se pronto, i modelli di `origin/claude/markov-junior-3d-60-models-pajzz6` (`lab/banco/fauna-biomi-cloud/`).
  2. **Integrare strutture, modelli e suoni nei 4 universi (`universe/` per `aurora`, più `lab/banco/universi-cloud/{orichalcum,neapolis,sidera}/`):**
     - Per ciascuno dei 4 universi, registra in `models/` e `models/index.json`:
       - le strutture del suo tema da `lab/banco/catalogo-cloud/<tema>/` con id `struttura-<ownModelId(concetto).slice(0, 30)>` (`classe: "grande"`), più le case comuni procedurali (`casa-comune-edificio-*` e `casa-comune-grande-*` secondo `commonHouse`);
       - i 24 modelli procedurali del seme da `lab/banco/seme-procedurale/` (`T270`), i 10 props tematici della sua ambientazione da `lab/banco/props-tematici/<tema>/` (`T270`), e i programmi sonori del suo tema e degli effetti da `lab/banco/suoni-cloud/` (`T271`).
     - Nei piani pre-calcolati `maps/*.json` dei luoghi che hanno lotti (`ch.lots.length > 0`) di tutti e 4 gli universi, popola `"strutture": [{ "concetto": "...", "taglia": "grande" | "enorme" }]` (rispettando `claimSizes`: `enorme` al più una per area rara e sui lotti con lato $\ge 7$, `grande` sui lotti con lato $\ge 5$), così che ogni struttura del catalogo Cloud compaia davvero in gioco sui lotti dei luoghi, con porta orientata al sentiero, interni visitabili, tetto che si apre entrando e cantina (`suolo="E"`).
  3. **Installazione in `universes/` ed esplorazione a costo zero:**
     - Scrivi ed esegui uno script `lab/scripts/installa-universi-cloud.ts` (`npm run universi:cloud` o invocabile da CLI) che inizializza/aggiorna `universes/aurora/`, `universes/orichalcum/`, `universes/neapolis/` e `universes/sidera/` come repository git validi su disco (tramite `runGit`), pronti per essere esplorati subito nel browser a costo zero con `?skip&offline` e `?universo=<nome>&skip&offline`.
     - Verifica che tutti i modelli in `universe/models/` e nei 3 universi passino `modelErrors` e che `verifica.ts` dei 3 universi (e il boot di `universe/` sul `Kernel` con `MockAiModels`) girino con **0 fault** e **0 richieste mancanti a `ModelDirector` (`wanted` = 0)** per le strutture piazzate.
- Test: test unitario (`tests/universi-cloud.test.ts`) che verifica che nei 4 universi tutte le `strutture` dei `maps/*.json` risolvano a un modello esistente in `models/index.json` (`forms.resolve(own, 'grande') === own`, zero `wanted`) e passino `Validator.validatePlan`, più `verifica.ts` e `turno typecheck -- npm run typecheck`.
- Browser: non serve (convalida con `Kernel.boot` + `MockAiModels` nei test; se il provider ha lo strumento browser controlla anche dal vivo `?skip&offline`, altrimenti scrivi le coordinate `(cx, cy)` nell'esito per l'esplorazione diretta).
- Quando è fatto: commit su `task/T273` e installazione dei 4 universi in `universes/`; nell'esito l'elenco dei luoghi/coordinate `(cx, cy)` dove si trova ogni struttura nei 4 universi. Sicurezza: nessuna superficie nuova.

### T274 · Integrare la catena Step 32 di Claude Cloud (T260, T262, T245a, T263, T245b, T245c) — `fatto` (`73b5841`)
- Pipeline: claude · stima 3% · approvato · priorità 1
- Step: 32
- Sforzo: extra.
- Contesto: richiesta dell'autore del 05/11: T260 prima di tutto, gli universi Cloud devono avere una versione del kernel. Il lavoro è già fatto sul ramo `origin/claude/step32-kernel-chain-cghym8` (`6c75530`, kernel `0.1.5`, ADR-0136 e seguenti); `git merge-tree` non vede conflitti con `3d` al 05/11.
- Cosa fare: `git merge` del ramo nel worktree; rinumera gli ADR se servono; suite intera e typecheck con i loro turni; controlla che `npm run mancanze` e il caricamento di `universe/` reggano `checkKernelVersion`. Nell'esito elenca ciò che il ramo non ha provato (browser di T263, T245b, T245c; i test di `aggiunte.test.ts` saltati nel clone Cloud, da far girare qui).
- Browser: sì, i pannelli di T263 e un mestiere di T245b: se non si può, `BROWSER: da verificare`.
- Quando è fatto: commit su `task/T274`. All'integrazione l'orchestratore segna `fatto` i sei task. Sicurezza: scrivi l'esito, il ramo tocca sessione, pannelli e caricamento di un universo.
- Esito: merge di `origin/claude/step32-kernel-chain-cghym8` (`6c75530`) senza conflitti, ADR 0136-0141 invariati, kernel `0.1.5`; suite (2142 passati, 1 saltato ma lanciato a parte su `valmora` e `valmora new`), typecheck e build verdi; `checkKernelVersion` regge il seme e gli universi senza campo, `npm run mancanze` funziona ma non lo chiama; sicurezza: messaggio `tasti`, `campi` in `MyState`, `world.wanderers`, `world.path`, `world.find_tile`, campo `kernel`, nessuna voce nuova oltre V-012 e V-021 già aggiornate dal ramo; non provati nel browser T245c, la maturazione e il server di produzione; all'integrazione vanno segnati `fatto` T260, T262, T245a, T263, T245b, T245c.

### T275 · Integrare i task del kernel di Claude Cloud (T267, T264, T265, T207) — `fatto` (`c007831`) (dipende da T274)
- Pipeline: claude · stima 2% · approvato · priorità 3
- Sforzo: high.
- Contesto: ramo `origin/claude/quine42-kernel-tasks-dquv5s` (`635f19f`), senza conflitti con `3d` al 05/11, ma tocca il kernel come T274: sale `Z` di `KERNEL_VERSION`.
- Cosa fare: `git merge`, allinea `KERNEL_VERSION` e `package.json`, suite intera e typecheck con i loro turni. T207 viene prima di T156 nell'ordine voluto dall'autore solo come codice: il generatore non si accende.
- Browser: sì per `?dev&teleport` (T264); se non si può, `BROWSER: da verificare`.
- Quando è fatto: commit su `task/T275`. Sicurezza: scrivi l'esito, T265 tocca le scritture dell'universo.
- Esito: merge di `origin/claude/quine42-kernel-tasks-dquv5s` in `835a5dc` con il conflitto in `AGENTS.md` risolto tenendo entrambe le parti, ADR rinumerati a 0142 (fila delle scritture) e 0143 (generazione differita), kernel `0.1.6` e `npm run genera` che rifiuta un universo di un altro kernel o illeggibile (con test); suite (2188 passati, 1 saltato), typecheck e build verdi, due test «forte» di `lab/tests/riferimento.test.ts` falliti in un giro su tre per il limite di 8000 ms sotto carico e verdi da soli e nel giro dopo; sicurezza: nessuna voce nuova, T265 salva le scritture in `localStorage` per scheda, senza token e rilette con `owedWrite`, e le riscrive con l'identità di adesso sotto il controllo del server, ma su un computer condiviso il testo in fila resta lì finché non si scrive, e una fila orfana la prende la pagina dopo; T207 ha un gettone interno buono per un solo universo su una porta di loopback, i segni `universes/.accesi/` e `universes/.generazione/` stanno sotto `universes/`, che non si serve, e `generateUniverse` non è nella build di produzione; non provati: `npm run genera` con la CLI vera e il suo costo per luogo (il generatore non si accende), la fila di T265 nel browser con server spento e il rinnovo del 401 con un account vero (solo test offline), la lettura di `/usage` con la CLI vera.

### T276 · Integrare il motore MarkovJunior per D33 e lo Scenografo di Claude Cloud (T259) — `fatto` (`ed092eb`) (dipende da T274)
- Pipeline: claude · stima 2% · approvato · priorità 3
- Sforzo: extra.
- Contesto: ramo `origin/claude/markov-junior-optimization-scenografo-ebsq24` (`5d6feb8`): il motore guarda solo dove serve (opzione A di D33, quella raccomandata), voxel per voxel identico, e T259. D33 resta dell'autore: l'esito dice i tempi misurati a Enorme, così può chiuderla.
- Cosa fare: `git merge`, suite intera e typecheck con i loro turni; rifai a mano la misura della locanda (`locanda/1/seconda`) e di `riferimento/cantina.xml` a Enorme; controlla che `FORMS_DB_VERSION` non debba cambiare.
- Browser: non serve.
- Quando è fatto: commit su `task/T276`. Sicurezza: nessuna superficie nuova.
- Esito: merge di `origin/claude/markov-junior-optimization-scenografo-ebsq24` (`5d6feb8`) in `ed092eb`, ADR del motore rinumerato 0142 (la riga D33 del backlog dice ancora ADR-0136: da correggere; T280 usa anch'esso 0142-0144: da rinumerare all'integrazione); suite (2181 passati, 1 saltato) e typecheck verdi; misura a mano con macchina carica (~60%), vecchio → nuovo a Enorme: cantina 11,87 s → 1,09-1,19 s (max 1,71), `locanda/1/seconda` 11,67 s → 0,52-0,55 s (max 0,58), `giudica` 0/5 → 5/5 su entrambe col limite di 8 s, a Grande cantina 6,86 s → 0,74-1,19 s, locanda 7,95 s → 0,45-0,49 s; griglie uguali seme per seme e fixture delle 172 impronte verde anche col motore vecchio; `FORMS_DB_VERSION` non cambia (griglie e formato uguali), kernel resta 0.1.5; D33 resta dell'autore (`domande/T258.md` non chiusa); il titolo di T259 nel backlog resta `in attesa` di `3d`: lo segna `fatto` l'orchestratore, ma i costi di T259 sono stime senza chiamate ai modelli (programmi a mano, ~1200 contro ~30 token), la misura vera è da fare; non provato nel gioco (T156); sicurezza: nessuna superficie nuova.

### T277 · Integrare i 60 modelli di Claude Cloud — `fatto` (`c5ecbd8`, via T279)
- Pipeline: claude · stima 1% · approvato · priorità 4
- Sforzo: high.
- Cloud: la sessione A l'ha unito tutto (`e0466b7`, punta del ramo `b6cff15`): non lanciare in locale, lo porta T279, che alla sua integrazione lo chiude.
- Contesto: ramo `origin/claude/markov-junior-3d-60-models-pajzz6` (`b6cff15`), solo `lab/banco/`.
- Cosa fare: `git merge`, i test di `lab/` e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T277`. Sicurezza: nessuna superficie nuova.

### T278 · Integrare i tre reami, le lingue e il piano di lancio di Claude Cloud (step 37, T239, T240) — `fatto` (`112b736`)
- Pipeline: claude · stima 1% · approvato · priorità 4
- Step: 37
- Sforzo: high.
- Contesto: ramo `origin/claude/quine42-realms-languages-4mbbsi` (`40eb2de`): reami spazio, pirati, cowboy sul banco, censimento delle lingue, piano di lancio. Il ramo ha scritto nel backlog: tieni il backlog di `3d` e riporta solo gli esiti. T239 e T240 restano `in attesa`: li chiude l'autore, che deve leggerli.
- Cosa fare: `git merge`, test e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T278`. Sicurezza: nessuna superficie nuova.
- Esito: merge di `40eb2de` su `task/T278` (`112b736`), senza conflitti: `lab/banco/coming-soon-cloud/{spazio,pirati,cowboy}` con `verifica.ts` ed `esito.md`, `lab/scripts/censimento-lingue.ts`, `docs/lingue.md`, `docs/lingue-censimento.md`, `docs/lancio/piano.md`, `tests/reami.test.ts`, `tests/censimento-lingue.test.ts`; test (2092 passati, 1 saltato) e typecheck verdi. Backlog di `3d` invariato; in `docs/fasi.md` lo step 37 cita T278 al posto del T269 del ramo, che in `3d` è del Cantiere 1. Esiti da riportare: T239 e T240 restano `in attesa` finché l'autore non li legge; T239 ha prodotto il censimento (325 file, 34.064 parole per lingua, 83 regex che leggono l'italiano) e la proposta in `docs/lingue.md`, con le decisioni in fondo; T240 ha prodotto `docs/lancio/piano.md` con le decisioni D1.1-D7.3 e le verifiche aperte V1-V9 (le regole di HN e Reddit vengono da fonti secondarie e vanno rilette all'origine; al picco il tetto di 10 $/giorno non regge; «non esiste niente del genere» non regge). Reami, secondo l'esito del ramo: 400 tick su `Kernel` con `MockAiModels`, 0 fault e 0 rotture della quarta parete; limiti scritti nei README: ambienti e terreni sono quelli del seme rinominati, i veicoli non portano nessuno (T183), gli effetti sonori non hanno un evento, nello spazio il vuoto non è un terreno e l'ossigeno è un oggetto, `META_RE` vieta parole del mestiere dello spazio. Manca: il ramo non aveva altro task per i reami oltre al T269 in collisione, quindi il suo esito resta in queste righe e non nel backlog. Non provato: browser e Concilio vero. Sicurezza: nessuna superficie nuova.

### T279 · Integrare T273 di Claude Cloud: strutture, modelli e suoni nei quattro universi, con la versione del kernel — `fatto` (`99d0682`) (dipende da T274)
- Pipeline: claude · stima 3% · approvato · priorità 1
- Sforzo: extra.
- Contesto: sveglia del 05/11, richiesta dell'autore. Ramo `origin/claude/quine42-universi-cloud-integration-k3h9p5` (`752288c`, sessione `session_01Tozk13S2R7eyZHQCXBo3Si`), senza conflitti con `3d` al 05/11. Contiene la catena di T274 e i 60 modelli di T277 (`b6cff15`) e il catalogo gemello. Rapporto: `lab/banco/universi-cloud/INTEGRAZIONE.md`. I tre universi dicono `kernel: 0.1.5`. Il ramo ha scritto nel backlog e nel quadro: tieni quelli di `3d`.
- Cosa fare: `git merge` del ramo; rinumera gli ADR se servono; suite intera (il ramo non l'ha fatta girare) e typecheck con i loro turni; `tests/universi-cloud.test.ts` e la verifica dei quattro universi. `npm run universi:cloud` solo con `--dir` su una cartella temporanea: l'installazione in `universes/` sposta nel cestino ciò che c'è, la decide l'autore. Nell'esito: i modelli del seme cambiati (`griglie-visive.json`, `tests/forms.test.ts`) e ciò che il rapporto dice non provato.
- Browser: sì, `?universo=orichalcum&skip&offline` da un'installazione temporanea, una struttura per universo con le coordinate del rapporto: se non si può, `BROWSER: da verificare`.
- Quando è fatto: commit su `task/T279`. All'integrazione l'orchestratore segna `fatto` T273 e T277. Sicurezza: scrivi l'esito (il ramo tocca `tools/sicurezza/ambiente.mjs`, V-016).
- Esito: merge di `origin/claude/quine42-universi-cloud-integration-k3h9p5` (`752288c`) senza conflitti, nessun ADR da rinumerare, kernel `0.1.5`, più `fileURLToPath` negli strumenti dei banchi (su Windows `universi:cloud` non partiva); suite 2207 passati e 1 saltato, typecheck verde, build verde prima dell'ultimo commit che tocca solo `lab/`; modelli del seme cambiati: 23 programmi più `index.json` (elenco qui sopra), `griglie-visive.json` e `tests/forms.test.ts` aggiornati, `grande` e la Morte restano i vecchi; difetto kernel `placeInside`/`formBlocks` non corretto, serve un task; sicurezza: nessuna superficie nuova, solo `maxBuffer` nel kit delle prove (V-016); non provati interni, cantine, scale, taglia Enorme, ascolto, 19 effetti senza momento di gioco, props in scena, installazione su `universes/` vera, online; all'integrazione vanno segnati `fatto` T273 e T277.

### T280 · Integrare T245d, T245e, T245f di Claude Cloud: imprese, edificio per stadi, fuori vista — `fatto` (`7e8cd6c`) (dipende da T274, T279)
- Pipeline: claude · stima 3% · approvato · priorità 1
- Step: 32
- Sforzo: extra.
- Contesto: sveglia del 05/11, richiesta dell'autore. Ramo `origin/claude/step32-kernel-chain-2vu1qd` (`e7cddc1`, sessione `session_01Tozk15L8GmN1nhtMGKeTdr`), kernel `0.1.8`, ADR-0142, ADR-0143, ADR-0144; senza conflitti con `3d` né con il ramo di T279 al 05/11. Viene per secondo perché cambia `sys.lavoro`, `mesh.ts` e il kernel sotto i quattro universi di T279, e questo una fusione pulita non lo vede. Il ramo ha scritto nel backlog e nel quadro: tieni quelli di `3d`.
- Cosa fare: `git merge` del ramo; rinumera gli ADR se servono; `KERNEL_VERSION`, `package.json` e `universe/universe.json` allineati; suite intera e typecheck con i loro turni; la verifica dei quattro universi su questo kernel: 0 fault, e di' se i tre di `lab/banco/universi-cloud/` hanno bisogno del `sys.lavoro` nuovo.
- Browser: sì, un mestiere di T245c (non visto da T274), il pannello del cantiere, una casa che sale per stadi, due schede con `?viandante=` per il fuori vista: se non si può, `BROWSER: da verificare`.
- Quando è fatto: commit su `task/T280`. All'integrazione l'orchestratore segna `fatto` T245d, T245e, T245f. Sicurezza: scrivi l'esito, il ramo tocca sessione, sandbox e validatore.
- Esito: merge di `origin/claude/step32-kernel-chain-2vu1qd` (`e7cddc1`) senza conflitti, ADR 0142-0144 invariati, backlog e quadro di `3d`; in più due correzioni trovate nel browser (il pulsante e il pannello del cantiere leggevano la posizione sul tappeto invece che nel mondo; uno stadio nel piano senza impresa lasciava impalcature per sempre), con i loro test e kernel `0.1.9`; suite 2247 passati e 1 saltato, typecheck verde, build non lanciata; quattro universi a 0 fault (verifiche di orichalcum, neapolis, sidera su `0.1.8` prima delle correzioni, strutture su `0.1.9`); orichalcum, neapolis e sidera non hanno `sys.lavoro` né `lavoro.*`, un edificio che crolla vi resta ai picchetti e i moduli del seme non bastano (0/24, 4/24, 3/24 persone con un programma; mancano `item.grano` e `item.pesce`): serve un task coi loro mestieri, scritto in `INTEGRAZIONE.md`; sicurezza: nessuna voce nuova, `impresa` e `impresa_porta` nel `Host` e `struttura: {stadio}` a elenco sul filo come dicono gli ADR, nessuna rotta né messaggio, le correzioni restringono ciò che il pulsante può fare; non provati casa comune e raccolto nel browser, `on_return` nel browser, ritorno a piedi, server di produzione; all'integrazione vanno segnati `fatto` T245d, T245e, T245f.

### T281 · I punti di `placeInside` che il kernel trova bloccati dentro le strutture — `fatto` (`ecb7b695`) (dipende da T279)
- Pipeline: claude · sforzo extra · stima 4% · approvato · priorità 5
- Sforzo: extra.
- Contesto: difetto trovato dalla sessione A, sezione «Un difetto del kernel» di `lab/banco/universi-cloud/INTEGRAZIONE.md`: `interiorPoints` trova sgombro un punto che `kernel.free(x, y, 0.15)` trova bloccato (`formBlocks`): casa a graticcio del seme 21 su 32 la vecchia e 15 su 15 la procedurale a yaw 0, 0 girata di -π/2; catalogo da 10 su 59 a 61 su 128. Ciò che si mette dentro una struttura può finire nei muri. Per questo `grande` è rimasta la casa vecchia (`SEME_TENUTI` in `strumenti/cloud.ts`).
- Cosa fare: guarda se `interiorPoints` e `formsUnder`/`rampBlocks` usano la stessa rotazione e lo stesso livello (senza `z`, `free` misura al suolo un pavimento rialzato); correggi; togli `grande` da `SEME_TENUTI`, rilancia `integra.ts`; alza `Z` di `KERNEL_VERSION`.
- Test: `tests/lots.test.ts` con la casa nuova, tutti i punti e non quattro tiri; suite intera e typecheck con i loro turni.
- Browser: sì, un oggetto dentro una struttura del catalogo.
- Quando è fatto: commit su `task/T281`. Sicurezza: nessuna superficie nuova.
- Esito: interiorPoints controlla ogni colonna con block e rampBlocks come free; placeInside scarta i punti occupati e aspetta la forma finché il programma gira (Forms.settled); findTile/world.find_tile esclude le caselle dei lotti (trattato come Z: se è senso nuovo della primitiva, va contratto Y); casa a graticcio procedurale come universe/models/structure.xml con commenti inglesi e open/close, tolta da SEME_TENUTI, i tre universi Cloud la prendono dal seme per impronta; kernel 0.5.2; test in lots.test, impronte di structure aggiornate, banco del fabbro in mestieri.test messo in un punto libero; suite 2671 passati e 1 saltato, typecheck e build verdi; integra.ts non rilanciato perché scrive il contratto 0.1 (riscriveva male 234 file), ora si ferma prima di scrivere; restano al punto del piano le cose dentro strutture senza interno (neapolis, sidera); le case degli abitanti non scartano i mobili; orichalcum, neapolis e sidera non visti nel browser; sicurezza: nessuna superficie nuova.

### T282 · Integrare T275: il conflitto in `package.json` — `fatto` (`7b0d821`)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Sforzo: high.
- Contesto: `integra T275` si è fermato su `package.json`. Nasce da T275: `dossier T275`. `3d` ha aggiunto lo script `universi:cloud` (T279), `task/T275` lo script `genera` e la versione `0.1.6`.
- Cosa fare: nel tuo worktree `git merge task/T275`; in `package.json` tieni i due script e la versione `0.1.6`, uguale in `version.ts`. Gli ADR 0142 e 0143 di T275 si scontrano col 0142 di T276: rinumerali ai primi liberi, anche nei rimandi di `AGENTS.md`, `docs/architettura-dettagli.md` e `docs/adr/README.md`. Suite intera e typecheck con i loro turni; i due test «forte» di `lab/tests/riferimento.test.ts` hanno un limite di tempo reale, sotto carico possono cadere: riprovali da soli e dillo nell'esito.
- Browser: non serve, T275 ha già provato T264.
- Quando è fatto: commit su `task/T282`. All'integrazione l'orchestratore segna `fatto` T264, T265, T267, T207 e dà `integra T275`. Sicurezza: scrivi l'esito, T265 tocca le scritture dell'universo.
- Esito: `git merge task/T275` in `7b0d821`: `package.json` con `universi:cloud` e `genera`, versione `0.1.6` uguale in `version.ts`; ADR di T275 a 0143 (generazione differita) e 0144 (fila delle scritture), indice in ordine e rimando corretto in ADR-0143. Fuori dal previsto: `tests/fixtures/mj-engine-hashes.json` rigenerata perché già rossa su `3d` (T276 + T273), con il motore di prima di D33 (`5204a3d^`) e confermata dal motore attuale: 96 voci nuove, 46 cambiate, tutte di modelli dell'universo. Suite (2272 passati, 1 saltato) e typecheck verdi; il primo giro è caduto solo su quella fixture; i due test «forte» di `lab/tests/riferimento.test.ts` sono passati nel giro finale senza riprove. Sicurezza: nessuna voce nuova e nessuna superficie oltre a quella di T275: T265 salva le scritture in `localStorage` per scheda, senza token, rilette con `owedWrite` e riscritte con l'identità corrente sotto il controllo del server; su un computer condiviso il testo in fila resta finché non si scrive e una fila orfana la prende la pagina dopo. Non provati, come in T275: `npm run genera` con la CLI vera e il suo costo per luogo, la fila di T265 nel browser con server spento, il rinnovo del 401 con un account vero, la lettura di `/usage` con la CLI vera. All'integrazione: segnare `fatto` T264, T265, T267, T207 e dare `integra T275`.

### T283 · Il sito in tre vesti: la base comune, col rapporto aureo — `fatto` (`8a76c40`)
- Pipeline: claude · stima 2% · approvato · browser · priorità 3
- Sforzo: extra.
- Step: 34
- Contesto: richiesta dell'autore del 05/11, testo intero in `docs/userchats/to-do-2026-11-05.md`: la pagina in tre modalità grafiche, tra cui sceglierà lui o i beta tester. Questo task assorbe la parte grafica di T232 (griglia e tipografia da φ e Fibonacci): `dossier T232`, `dossier T241`, `dossier T244`.
- Cosa fare:
  1. Nel sito (`site/`, senza framework) una **veste** si sceglie con un attributo sulla radice delle pagine, e ognuna sta in file propri (colori, font, logo, sfondi, effetti), caricando solo ciò che le serve; tutte le pagine del sito la seguono, non solo la home. Il nome nel codice non è «tema»: la parola indica già le ambientazioni e `src/theme.css`. Voce nuova nel glossario.
  2. **La griglia comune:** struttura e proporzioni delle pagine dalla scala φ/Fibonacci di `src/theme.css` (T241), con la tabella dei rapporti in `#sito`. Le tre vesti cambiano l'aspetto, non i contenuti né la struttura.
  3. Un selettore che confronta le vesti e ricorda la scelta in `localStorage`; **nessun voto e nessuna rotta nuova** (sono di T287). La veste di partenza è quella attuale, che sarà la sobria.
  4. La CSP (`server/csp.ts`) va rispettata: niente script né gestori scritti nell'HTML. La veste si applica senza far lampeggiare quella sbagliata al caricamento.
- Test: un test che ogni veste dichiari tutto ciò che la base chiede; typecheck, build e suite intera con i loro turni.
- Browser: sì, a 1920 e 390 px, sotto `npm run dev` e sotto `npm run serve`; il cambio di veste su ogni pagina del sito.
- Quando è fatto: si aggiunge una veste con i suoi file, senza toccare la base; commit su `task/T283`, ADR e riga in `#sito`. Sicurezza: nessuna superficie nuova, o le voci.
- Esito: base comune (solo token `--skin-*`, misure dalla scala aurea in `site/*.css`) e vesti in `site/skins/<id>/` scelte con `data-skin`; `server/skins.ts` genera `/skins/boot.js` e copia i file in `dist/skins/` senza rotte, `site/skin.ts` è il selettore con `localStorage`; sobria (l'aspetto di T244, ora su tutte le pagine, `body.home` tolto), fumetto e futuristica come prime stesure per T285 e T284 (logo e favicon definitivi a T286); `tests/site-skins.test.ts` ricava il contratto da ciò che la base legge; ADR-0145, voce nel glossario, tabella in `#sito`; aggiunti `--space-55`, `--space-89`, `--measure-1364`; carta 322×521; typecheck e build verdi, suite intera verde (2311 test, 1 saltato), dopo la quale ho allentato un test di `site-skins` e rilanciato da soli quel file e `glossario.test.ts`. Non provati: carte e schede di universi vere (nessun universo nel worktree, si vedono solo gli stati vuoti, quindi la carta 322×521 non è mai stata disegnata), `effects.ts` (nessuna veste ne ha uno), un telefono vero, un browser diverso da Chrome, `istruzioni.html` sotto `npm run serve` (senza `docs/beta/guida.md` la pagina non è nella build). Sicurezza: nessuna superficie nuova in produzione; in sviluppo il plugin serve solo nomi semplici di `site/skins/` con estensioni a elenco, e `boot.js` non scrive mai nella pagina ciò che è in `localStorage` se non è un id noto (test).

### T284 · La veste futuristica: l'inception di scritte neon — `fatto` (`b24a260`) (dipende da T283, T255)
- Ripartenza (D41 A, 05/11): l'autore ha visto le bozze di T283 e le boccia: scritte e icone delle proposte scelte mancano. Si rifà tutto partendo dalla scritta e dall'icona della proposta, **estratte così come sono** (SVG/HTML) e poi ritoccate come chiede l'autore; le bozze di T283 in `site/skins/<id>/` si buttano. Le proposte sono nel repository: **parti dalla v2 di Claude, fatta dopo le votazioni**, `docs/design/logo/proposte/claude/QUINE42 Logo v2 standalone.html` (1,7 MB, HTML autosufficiente con le risorse incorporate: cerca la sezione, non leggerlo intero); la v1 e le catture di `landing-tests/` servono solo da confronto.
- Pipeline: claude · sforzo max · stima 4% · approvato · browser · priorità 3
- Sforzo: max, scelto dall'autore. Dipende da T255 perché questo sforzo arrivi davvero alla CLI.
- Step: 34
- Contesto: testo dell'autore in `docs/userchats/to-do-2026-11-05.md`, § «Tema futuristico». Parte dalla seconda proposta di Claude per il prompt 5: `docs/design/logo/proposte/claude/Logo Videogioco Quine42/QUINE42 Logo.html` (file da 1,4 MB: cerca la sezione, non leggerlo intero) e `docs/design/logo/proposte/landing-tests/5-claude-2.png`; i giudizi in `docs/design/logo/proposte/votazioni.md`. La scritta QUINE è fatta di scritte «quine» più piccole, tra Matrix e Tron, nei colori neon punk. Allude a MarkovJunior, alle rune del tappeto, al doppio livello di gioco e a un gioco fatto del suo stesso codice.
- Cosa fare:
  1. **Le scritte piccole si muovono:** effetto «tappeto che si muove» o «logica MJ», lettere che si accendono e attraversano la scritta grande, come un programma che compila.
  2. **Strisce con lo stesso effetto**, più tenui, lungo la pagina.
  3. **Il motore:** l'autore teme che un algoritmo MJ 2D o testuale sia troppo per la landing. Prova il programma MJ e l'animazione semplice, misura entrambi (ms per fotogramma e CPU a 1920 px, una macchina modesta simulata con il rallentamento del processore, peso scaricato) e scegli coi numeri, scritti nell'esito. Solo se MJ regge, proponi una variante senza lo showcase 3D e con effetti MJ lungo tutta la pagina: è una scelta che resta all'autore.
  4. **L'icona:** quella accanto alla scritta non convince l'autore. Toglila o ridisegnala dalla scritta stessa; la favicon deve comunque leggersi a 16 px.
  5. L'animazione si ferma a scheda nascosta e rispetta `prefers-reduced-motion`; i testi restano leggibili sopra l'effetto.
- Test: typecheck, build e suite intera con i loro turni.
- Browser: sì, a 1920 e 390 px; catture nel commit e, se puoi, una breve registrazione dell'effetto.
- Quando è fatto: la veste è selezionabile, le misure sono nell'esito; commit su `task/T284`. Sicurezza: nessuna superficie nuova.
- Esito: veste futuristica rifatta dalla proposta 05 «Il quine» v2 di Claude: la scritta estratta così com'è da `tools/vesti/scritta.ts` (16 righe di posti, 7 lettere 3×5, 2 colori, la regola della proposta), confrontata cella per cella in `tests/site-skin-futuristica.test.ts` (dati, logo fermo di barra e piede da 34,8 KB invece di 316, ciò che la pagina dipinge, file non ritoccati a mano); niente icona accanto alla scritta, la favicon è la sua Q a due misure (una riga di pixel per riga di testo fino a 63 px, anello chiuso a 16 px; da 64 px la Q con le lettere piccole); si muovono la scritta grande nell'hero e strisce tenui (barra, sezioni, piede): tappeto a righe alterne, teste che compilano le righe, onde in una lettera, un fotogramma per tick (90 ms), ferme fuori schermo, a scheda nascosta e con prefers-reduced-motion; misure con `tools/vesti/misura.mjs` (Chrome headless, 1920×1080, DPR 1, GPU vera, CPU 4×): landing col palco 3D sobria 36,7 % del thread principale, futuristica con luci semplici 39,6 % (2,0 ms/tick, p95 3,3), con MarkovJunior 40,7 % (4,9 ms, p95 7,7); solo gli effetti 4,7 % contro 7,7 %; peso +32,2 KB compressi (18,1 il font VT323, circa 81 KB senza compressione), MarkovJunior +1,2 KB sulla landing perché il motore c'è già → scelte le luci semplici; MarkovJunior regge, quindi proposta la variante `?fx=mj-pagina` (niente palco 3D, MarkovJunior ovunque, un labirinto MarkovJunior 2D di lettere al posto del palco): 18,3 % a 4× con three.js ancora caricato, 9,8 % senza; non è nel selettore, decide l'autore; se la sceglie servono three.js caricato solo quando il palco si vede e un intervento sui picchi da 11–15 ms a 4×; ADR-0151, voce Scritta nel glossario, `#sito` con la tabella, `tools/vesti/` (estrai, misura, cattura: solo loopback, con test); typecheck, build e suite intera verdi (2378 passati, 1 saltato); non provati: un telefono vero, browser diversi da Chrome, la favicon nella barra delle schede (provata come immagine a 16–256 px), una macchina modesta vera (il rallentamento è la simulazione di Chrome); sicurezza: nessuna superficie nuova nel sito né nel server, `?fx=` sceglie solo fra valori noti e non entra mai nella pagina.

### T285 · La veste a fumetto: crea la tua quine-storia — `fatto` (`2f1f310`) (dipende da T283)
- Ripartenza (D41 A, 05/11): l'autore ha visto le bozze di T283 e le boccia: scritte e icone delle proposte scelte mancano. Si rifà tutto partendo dalla scritta e dall'icona della proposta, **estratte così come sono** (SVG/HTML) e poi ritoccate come chiede l'autore; le bozze di T283 in `site/skins/<id>/` si buttano. Le proposte sono nel repository: **parti dalla v2 di Claude, fatta dopo le votazioni**, `docs/design/logo/proposte/claude/QUINE42 Logo v2 standalone.html` (1,7 MB, HTML autosufficiente con le risorse incorporate: cerca la sezione, non leggerlo intero); la v1 e le catture di `landing-tests/` servono solo da confronto.
- Pipeline: claude · sforzo extra · stima 3% · approvato · browser · priorità 3
- Sforzo: extra.
- Step: 34
- Contesto: testo dell'autore in `docs/userchats/to-do-2026-11-05.md`, § «Tema Fumetto». Parte dalla seconda proposta di Claude per il prompt 1: `docs/design/logo/proposte/claude/Logo Videogioco Quine42/QUINE42 Logo.html` (cerca la sezione) e `docs/design/logo/proposte/landing-tests/1-claude-2.png`. Il vecchio aspetto pop art del sito è nella storia: `git show 9b8523c~1:site/site.css`. Allude alla storia nella storia, alla libera conversazione di NPC e Concilio, ai fumetti del gioco.
- Cosa fare:
  1. **La Q:** nella scritta e nell'icona l'asticella sembra staccata dal resto; ridisegnala perché faccia corpo con la lettera, a ogni misura.
  2. **I pois nel sito, animati:** texture retinata nel design delle pagine, con un movimento lento che non disturbi la lettura; si ferma a scheda nascosta e rispetta `prefers-reduced-motion`.
  3. **La palette:** l'autore sente qualcosa di discrepante e non sa dire cosa. Trova la causa (per esempio tinte, saturazioni o contrasti fuori famiglia, misurati), correggila e di' nell'esito cosa hai cambiato, con la cattura prima e la cattura poi.
  4. I fumetti degli NPC in gioco **non si toccano qui**: si fanno solo se vince questa veste (T287).
- Test: typecheck, build e suite intera con i loro turni.
- Browser: sì, a 1920 e 390 px; contrasto dei testi sopra i pois; catture nel commit.
- Quando è fatto: la veste è selezionabile; commit su `task/T285`. Sicurezza: nessuna superficie nuova.
- Esito: veste fumetto rifatta dalla v2 di Claude: Q in un corpo solo nella scritta e nell'icona a ogni misura; palette riportata nei tre colori del logo e nel nero (pois del logo rosa in sovrastampa invece del viola che spegneva il giallo del 70%, grigio secondario lavanda invece del beige, nero sul rosa invece del bianco a 3,55:1, rosso di sovrastampa invece del gemello del rosa, raro più chiaro), con catture prima/poi in `docs/design/vesti/fumetto/` e misure in `docs/design/vesti/fumetto.md`; retino a mezzatinta agli angoli che `effects.ts` fa muovere piano, fermo a scheda nascosta e con `prefers-reduced-motion`; `genera.ts` riscrive i disegni e `tests/site-skin-fumetto.test.ts` li controlla. Typecheck, build e suite verdi. Non provati: un telefono vero, un altro browser, la scheda davvero nascosta (simulata nel Chrome vero), `prefers-reduced-motion` nel Chrome vero (solo headless). Sicurezza: nessuna superficie nuova (`genera.ts` ed `effects.ts` non si servono come file; `effects.ts` entra nella build come pezzo a parte, nessuna rotta).

### T286 · La veste sobria: vediamoci chiaro — `fatto` (`08d9e54`) (dipende da T283)
- Ripartenza (D41 A, 05/11): l'autore ha visto le bozze di T283 e le boccia: scritte e icone delle proposte scelte mancano. Si rifà tutto partendo dalla scritta e dall'icona della proposta, **estratte così come sono** (SVG/HTML) e poi ritoccate come chiede l'autore; le bozze di T283 in `site/skins/<id>/` si buttano. Le proposte sono nel repository: **parti dalla v2 di Claude, fatta dopo le votazioni**, `docs/design/logo/proposte/claude/QUINE42 Logo v2 standalone.html` (1,7 MB, HTML autosufficiente con le risorse incorporate: cerca la sezione, non leggerlo intero); la v1 e le catture di `landing-tests/` servono solo da confronto.
- Pipeline: claude · sforzo high · stima 2% · approvato · browser · priorità 3
- Sforzo: high.
- Step: 34
- Contesto: testo dell'autore in `docs/userchats/to-do-2026-11-05.md`, § «Tema sobrio». Il sito attuale (T244) è chiaro e pulito, misterioso e poco spoilerante, ma ha poca personalità. Il logo è la seconda proposta di Claude per il prompt 4 (`docs/design/logo/proposte/claude/Logo Videogioco Quine42/QUINE42 Logo.html`, `docs/design/logo/proposte/landing-tests/4-claude-2.png`), con la sua icona, che all'autore piace molto.
- Cosa fare: porta quel logo e quell'icona nel sito attuale e dagli più personalità con pochi gesti legati al logo (il cerchio, il tappeto), **senza aggiungere spoiler né riportare l'aspetto da pitch o da fumetto**. Favicon compresa.
- Test: typecheck, build e suite intera con i loro turni.
- Browser: sì, a 1920 e 390 px; catture nel commit.
- Quando è fatto: la veste è selezionabile; commit su `task/T286`. Sicurezza: nessuna superficie nuova.
- Esito: la sobria ha il logo e l'icona della proposta 04 v2 di Claude, estratti così come sono da `tools/vesti/logo.ts` (lo richiama `estrai.ts`) in `site/skins/sobria/scritta.svg` e `icona.svg` (barra, piede, favicon), con `tests/site-skin-sobria.test.ts` che li confronta con la proposta elemento per elemento; il carattere a fumetti è tolto; tre gesti dalla Q, solo CSS: doppia riga rosa e ciano sotto la barra, anelli del tappeto nel palco 3D, la Q in piccolo davanti ai titoli; catture a 1920 e 390 px in `docs/design/vesti/sobria/`; righe in `#sito`, LEGGIMI e AGENTS.md; typecheck, build e suite intera verdi (2382 test, 1 saltato). Le orecchie del piede (di T244) sono rimaste: da decidere con l'autore. Non provati: telefono vero, `npm run serve`, carte con un universo vero. Sicurezza: nessuna superficie nuova.

### T287 · La scelta della veste: subito dall'autore, o col voto dei beta tester — `in attesa` (dipende da T284, T285, T286, T315)
- D38 A (autore, 05/11): il filone del prompt 7 (le orecchie) resta fuori dal sito della beta, niente quarta veste; le orecchie restano un'idea per monete e carte.
- Step: 34
- Contesto: l'autore confronta le tre vesti. Se una è nettamente superiore la sceglie subito; altrimenti decidono i tester. Il testo in `docs/userchats/to-do-2026-11-05.md`. Lo riscrive e lo stima l'orchestratore alla risposta dell'autore.
- Se sceglie subito: restano la veste scelta e, solo se è la futuristica o la fumetto, le sue conseguenze (senza showcase se è MJ; i fumetti degli NPC in gioco se è la fumetto).
- Se si vota: lo switch in alto e una scelta per account, che si può cambiare, registrata dal server. Una rotta nuova passa da `gate` e dall'elenco di `server/production.ts`, con il suo ritmo in `FRONT_RATES`; i voti stanno sotto `universes/` in una cartella che non si serve, e i conti li legge solo il master. Due parole per i tester nella guida della beta. Sicurezza: voci nuove.

### T288 · Ciò che il viandante impugna si vede addosso: armi e attrezzi — `fatto` (`cf93ce5e`) (dipende da T255)
- Pipeline: claude · sforzo max · stima 4% · approvato · browser · priorità 6
- Sforzo: max, scelto dall'autore. Dipende da T255 perché questo sforzo arrivi davvero alla CLI.
- Step: 40
- Contesto: richiesta dell'autore del 05/11, testo in `docs/userchats/to-do-2026-11-05.md`, § «Interazioni grafiche di oggetti». Oggi impugnare e gli slot esistono (`src/kernel/inventory.ts`, `#regole-effetti`, `#multigiocatore`), ma il renderer non mostra nulla sul corpo. Regola dell'autore: **minimizzare i modelli; un attrezzo usa la stessa mesh di quando è a terra.** Vale la regola 11: niente immagini, ogni aspetto è un programma MarkovJunior; niente modelli nuovi né chiamate ai modelli.
- Cosa fare:
  1. L'oggetto impugnato si disegna sul viandante con la sua mesh di terra, agganciato a un arto del rig (`src/mj/rig.ts`, `src/render/entities.ts`): segue il passo e le animazioni e guarda dalla parte del corpo. Scala e presa valgono per qualunque modello, anche generato domani, e si ricavano dalla forma, senza una tabella per oggetto. Un oggetto senza modello o un corpo senza arti non rompono nulla: semplicemente non si vede.
  2. Ogni oggetto si aggancia dove ha senso per il suo posto (`slot`), con un punto di aggancio per posto scritto una volta sola.
  3. **In multigiocatore lo vedono anche gli altri:** ciò che esce verso i client resta a elenco (regola 8f), e il cambio arriva a chi è vicino senza ricaricare. Vale anche per gli NPC che hanno qualcosa in mano, se il dato c'è già; altrimenti scrivi nell'esito cosa manca.
  4. Costo misurato con molti viandanti in scena: le mesh sono condivise, nessuna griglia si rifà a ogni cambio.
- Test: aggancio e scelta del punto come funzioni pure; ciò che esce verso gli altri client; typecheck e suite intera con i loro turni. Versione del kernel se tocchi `src/kernel/` (ADR-0136).
- Browser: sì, con `?skip&offline`: spada e attrezzo fermi e in cammino, da più lati, a cartone e con `?classica`; due schede in multigiocatore. Catture nel commit.
- Quando è fatto: impugno, si vede, lo vede anche l'altro viandante; commit su `task/T288`, riga in `#mondo3d`. Sicurezza: scrivi l'esito, tocca ciò che esce dal server.
- Esito: l'oggetto impugnato si vede in mano con la sua mesh di terra condivisa, mano ricavata dalle braccia e presa dalla forma, senza tabelle per oggetto; un punto di aggancio per posto (mano destra, avambraccio per lo scudo); in multigiocatore `OtherView.held` porta solo l'id dell'oggetto e il cambio arriva all'altro senza ricaricare; costo misurato con 60 viandanti (Node: nessuna differenza entro il rumore; browser: 4,72 contro 4,24 ms, +3 chiamate di disegno per mano, nessuna griglia o geometria rifatta); corretto il colore `hsl()` che svuotava i modelli tinti (kernel 0.5.3); ADR-0166, `#mondo3d`, AGENTS.md, glossario, 22 test nuovi; mancano gli individui con qualcosa in mano (nessuna funzione glielo dà; in multigiocatore manca anche il campo); non provati i modelli dello Scultore reali (usati programmi scritti a mano) né gli fps in headless; sicurezza: nessuna superficie nuova.

### T289 · Vestiti e armature addosso: il banco che decide come — `fatto` (`90765ba8`) (dipende da T288)
- Pipeline: claude · sforzo max · stima 3% · approvato · browser · priorità 6
- Sforzo: max, scelto dall'autore.
- Step: 40
- Contesto: testo dell'autore in `docs/userchats/to-do-2026-11-05.md`: «per i vestiti e l'armatura va deciso», forse due mesh, una a terra e una indossata, che «eventualmente potrebbe essere solo una modifica alla mesh dell'NPC». Questo task produce la decisione, con le prove. Ricorda che l'autore ha già detto di non rigenerare tutti i modelli perché costa caro (`docs/pipeline/domande/T232.md`).
- Cosa fare: in `lab/banco/`, confronta almeno tre vie sugli stessi tre oggetti (un elmo, una corazza, un mantello) e su due corpi diversi (il viandante e una creatura non umana):
  - **A:** due programmi per oggetto, a terra e indossato;
  - **B:** un programma solo, con una riscrittura che lo modella sul corpo (mesh dell'NPC modificata dalle regole, senza un modello in più);
  - **C:** un cambio di palette e poche celle sul corpo, senza geometria propria.
  Per ognuna: foto da quattro lati, tempo per viandante, memoria, modelli da scrivere per un universo, costo stimato con lo Scultore, cosa succede con i corpi generati e con gli oggetti che esistono già. Scrivi `lab/banco/indossati.md` con la raccomandazione e la domanda per l'autore (le foto una accanto all'altra).
- Test: quelli del banco; typecheck col suo turno. Il gioco non cambia.
- Browser: sì, per le foto nel `lab/`.
- Quando è fatto: l'autore può decidere guardando le foto; commit su `task/T289`. Sicurezza: nessuna superficie nuova.
- Esito: banco degli indossati in `lab/banco/indossati.md` e `lab/banco/indossati/` (zone del corpo dai voxel e dal rig; tre vie A due programmi / B sezione `<worn>` / C colori del kernel; elmo, corazza e mantello scritti a mano come lo Scultore; foto a cartone da quattro lati su viandante e lupo, lo stesso abito su 27 corpi del seme e del Cantiere 8; tempi, memoria, chiamate di disegno, costo con lo Scultore in `riepilogo.md` e `misure.json`), pagina 3D `/lab/indossati/` con 12 catture, `lab/scripts/indossati.ts`, 10 test in `lab/tests/indossati.test.ts`, voce della pagina in `vite.config.ts`; raccomandazione C + B, domanda aperta per l'autore in `docs/pipeline/domande/T289.md` (serve a T290); il gioco non cambia; non provato: nessun modello vero ha scritto una sezione `<worn>`, tempi misurati in Node e non nel browser, zone euristiche (sbagliano sul cane randagio e sul ragno meccanico); sicurezza: nessuna superficie nuova.

### T290 · Vestiti e armature addosso nel gioco — `in attesa` (dipende da T289)
- Step: 40
- Sforzo: max, scelto dall'autore.
- Contesto: lo riscrive e lo stima l'orchestratore con la decisione dell'autore su T289. Conterrà il rendering, ciò che esce verso gli altri client, il prompt dello Scultore se servono programmi nuovi, e cosa fare degli oggetti che esistono già.

### T291 · Posare gli oggetti sui mobili — `fatto` (`bbf0db7`) (dipende da T255)
- Pipeline: claude · sforzo max · stima 3% · approvato · browser · priorità 6
- Sforzo: max, scelto dall'autore. Dipende da T255 perché questo sforzo arrivi davvero alla CLI.
- Step: 40
- Contesto: testo dell'autore in `docs/userchats/to-do-2026-11-05.md`, § «Interazioni grafiche di oggetti»: «la possibilità di posare gli oggetti sui mobili». Le superfici delle forme ci sono già (`surfaces` in `src/mj/mesh.ts`, `src/kernel/forms.ts`), e le usano i pavimenti. Stessa mesh di quando l'oggetto è a terra.
- Cosa fare: un'azione per posare ciò che impugni sul mobile che guardi; l'oggetto sta sul piano vero del mobile, alla sua altezza, si riprende e resta lì nel salvataggio e per gli altri viandanti. Si rifiuta con una frase del mondo se non c'è un piano libero (una sedia occupata, un pozzo, un mobile senza superficie). Decidi quanti oggetti stanno su un piano in base alla loro impronta. Un oggetto posato non rende invalicabile nulla (regola 10) e non si perde se il mobile sparisce.
- Test: scelta del punto su forme vere, salvataggio e riapertura, due viandanti; typecheck e suite intera con i loro turni. Versione del kernel (ADR-0136). Un messaggio nuovo del protocollo non getta eccezioni per ciò che arriva dal filo (regola 8i).
- Browser: sì, con `?skip&offline`, su due mobili diversi; catture nel commit.
- Quando è fatto: poso, ricarico la pagina, è ancora lì; commit su `task/T291`, riga in `#regole-effetti`. Sicurezza: scrivi l'esito, tocca il protocollo.
- Esito: dal menu di un mobile si posa ciò che si impugna, sul ripiano vero (scelta per impronta dall'angolo vicino a chi posa), con frasi del mondo per i rifiuti; componente `posato` e `stato.json → posati`; resta dopo ricarica e per gli altri viandanti; regola 10 rispettata, l'oggetto non si perde se il mobile sparisce; kernel 0.1.7, ADR-0147, glossario, `#regole-effetti`; typecheck e suite intera verdi (152 file, 2344 test). Non provato: due viandanti in due schede vere del browser (solo nei test). Gli oggetti gettati a terra restano non salvati come prima. Sicurezza: nessuna superficie nuova fuori dal gioco (l'azione passa da `azione`, con raggio e ritmo; `posato` dice solo ciò che la posizione già dice; `posati` si legge con validazione).

### T292 · Prendere e spostare i mobili (`takeable`) — `fatto` (`0b875f2b`) (dipende da T288)
- Pipeline: claude · sforzo max · stima 4% · approvato · browser · priorità 6
- Sforzo: max, scelto dall'autore.
- Step: 40
- Contesto: testo dell'autore in `docs/userchats/to-do-2026-11-05.md`, § «Interazioni grafiche con oggetti di grandi dimensioni»: alcuni mobili hanno una proprietà che dice se si possono prendere e spostare. La credenza sì, il pozzo no. Oggi un mobile è un'entità di modulo (`physics.pushable` lo spinge soltanto), un oggetto in borsa è un'altra cosa (`ItemDef`).
- Decisioni dell'orchestratore, da riportare all'autore: assente vale `false` (gli universi che esistono restano buoni); **un contenitore pieno non si prende, si vuota prima**, così niente borse dentro borse.
- Cosa fare:
  1. Campo `takeable` nel manifest (`src/kernel/types.ts`, validatore, riga in `AGENTS.md`), e una voce «Prendi» nel menu. In inventario il mobile è un oggetto con la sua icona, e mentre è in mano si vede con T288 (grande: decidi come portarlo, per esempio sopra la testa, e fallo giudicare con le catture).
  2. Posarlo a terra rispetta la regola 10: la casella dev'essere libera e **il luogo resta connesso**, niente solido su un punto di articolazione né davanti a una porta (ADR-0064). Se non si può, una frase del mondo, e il mobile resta in mano.
  3. Stato e identità seguono il mobile (componenti, codice del modulo, contenuto una volta vuoto), e l'entità sta dove è stata posata nel salvataggio, anche se il piano del luogo la generava altrove; non rinasce al ricaricamento del luogo. Vale in multigiocatore, e il mobile preso da uno sparisce per gli altri.
  4. Il Narratore e il Cartografo decidono `takeable` per ciò che generano (schema, prompt, `MockAiModels`, voce nel registro). Nel seme, a mano: i moduli di `universe/` che si possono spostare.
  5. Nell'esito di' cosa non è coperto, per esempio chi porta via i mobili dalla casa di un NPC: oggi nessuna conseguenza.
- Test: connessione a ogni posa, salvataggio, doppia presa in multigiocatore, contenitore pieno; typecheck e suite intera con i loro turni. Versione del kernel (ADR-0136).
- Browser: sì, con `?skip&offline`: prendo una credenza, la porto altrove, ricarico; provo a tapparmi una porta; il pozzo non si prende. Catture nel commit.
- Quando è fatto: commit su `task/T292`, ADR, riga in `#regole-effetti` e nell'elenco del manifest. Sicurezza: scrivi l'esito, tocca il protocollo e il validatore.
- Esito: `takeable` nel manifest (assente vale no; validatore, MANIFEST_FIELDS; nel seme credenza, cassapanca, letto, banco, cassa; non pozzo né cartello); «Prendi» solo se vuoto (un contenitore mai aperto si riempie come all'apertura), niente posato sopra, nessuno sopra, posto libero; la cosa portata `thing:<modulo>` con origine, seme e stato (mai in borse, contenitori o pannelli; a un altro viandante intera; corretta la borsa data che arrivava a 0); posa dal menu della casella, con F o con «Posa davanti a te», con la regola 10 (terreno che regge, niente in mezzo, non accanto a una porta, luogo connesso con `wouldSplit` sulla via vera, circa 4 ms) e frasi del mondo; `state.json → moved` più `consumed`: resta dov'è stato posato anche dopo ricarica e scarico del luogo; sopra la testa con le braccia alzate, scala circa 0,7 scelta sulle catture; multigiocatore: doppia presa provata nei test, a chi porta solo il seme (`shownInventory`), agli altri `OtherView.heldSeed`, ritmo nuovo `LIMITS.moveRate` (4 al secondo); Narratore e Cartografo decidono `takeable` (schema, prompt, MockAiModels, docs/conversazioni.md); ADR-0168, kernel 0.5.5, 29 test nuovi, suite (2752 più 1 saltato) e typecheck verdi nei turni; decisioni dell'orchestratore da riportare all'autore: assente vale no, un contenitore pieno non si prende; non coperto: mobili portati via dalla casa di un abitante senza conseguenze, imprese e case nuove che non sanno delle cose spostate, un `unique` portato che può ricomparire altrove, posa solo a terra (non su un piano di sopra né su un mobile), icona dell'inventario col seme del modulo, una cosa senza origine e senza forma pronta controllata sulla sua sola casella; multigiocatore provato solo nei test, non nel browser; sicurezza: nessuna superficie nuova (prendi e _posa nei messaggi esistenti, con raggio e un ritmo in più; lo stato della cosa portata resta sul server; `moved` letto senza fidarsi, con readMoved e readParts).

### T293 · Le carte fatte a mano: forma, archivio, rotte, interruttore — `fatto` (`7e6c4e68`) (dipende da T255)
- Pipeline: claude · sforzo max · stima 3% · approvato · priorità 7
- Sforzo: max.
- Step: 41
- Deciso dall'autore (05/11): **D40 A**: la carta sta nella collezione del suo account, fuori dagli universi; entra in un mondo solo con T295, all'inizio di un universo.
- Contesto: testo dell'autore in `docs/userchats/to-do-2026-11-05.md`, § «Modificare le carte». I giocatori forkano un modello o un suono e modificano la copia, che è associata a una carta. Oggi `lab/` non ha un archivio (il SoundLab usa `localStorage`), e la regola 8b vieta a chi non è il master di scrivere l'universo. Carte ed eredità: `#carte-crediti`, `#clone-eredita`, ADR-0056, ADR-0084.
- Cosa fare:
  1. Decidi e scrivi in un ADR la forma di una carta fatta a mano: programma XML (modello o suono), da quale modello e universo nasce (id, impronta, `carta.origini` di `heritage.ts`), autore, nome, classe e taglia, versione `X.Y` del kernel. Un fork prende un id suo: non sostituisce mai l'originale. Voce nel glossario.
  2. L'archivio fuori dagli universi, per account, come i saldi (regola 8d: `universes/.carte-mano/`): nessun Lua, Concilio, ramo o rollback ci arriva. Tetti per account: numero di carte e byte.
  3. Rotte (GET elenco, POST crea e aggiorna, DELETE): passano da `gate`, si aggiungono all'elenco di `server/production.ts`, stanno sotto `FRONT_RATES`; solo l'autore scrive le sue carte; ciò che esce a un altro è a elenco (regola 8f).
  4. Un programma scritto da un giocatore finirà nei browser e nei mondi di altri: va al validatore, con tetti di griglia, passi e tempo misurati sul motore vero. Per i suoni le soglie di `soundanalysis.ts`. Nome e testi sono dati ostili (HTML sul sito, quarta parete).
  5. L'interruttore: `site/beta.json` prende `{ "laboratori": false }`, separato da `laCorona`. Spento, le rotte rifiutano e `/lab` resta in `NOT_SERVED` (`server/production.ts:96`), come oggi; e i link non ci sono.
- Test: permessi (un altro account, nessun account, interruttore spento), tetti, programma che non termina, XML ostile, nome con HTML, un programma di altro `X.Y`; `tests/sicurezza/` con le voci nuove. Typecheck e suite intera con i loro turni. Versione del kernel se tocchi `src/kernel/` (ADR-0136).
- Browser: non serve.
- Quando è fatto: commit su `task/T293`, ADR, sezione in `#carte-crediti`, riga in `AGENTS.md`. Nell'esito le voci di sicurezza.
- Esito: carte fatte a mano: forma (ADR-0161, kernel 0.4.2), archivio `universes/.handmade/` con tetti, rotte `/api/handmade` dietro `gate` e l'interruttore `laboratori` (spento), controllo del programma sul motore vero con tetti misurati sul seme, in produzione nel programma dei mondi in un processo a parte; sicurezza: V-030, V-031, V-032 aggiunte e chiuse; nomi inglesi `.handmade` e `check`/`checked` invece di `.carte-mano` (ADR-0153); aggiunta la firma dell'account; il kit dell'autore non prova le rotte (le prova `serververo.test.ts`); conflitti attesi con T308b su numero di ADR, versione del kernel e canale dei mondi; laboratori per i giocatori a T294.

### T294 · I tre laboratori per i giocatori: forkare e modificare — `fatto` (`e59e79f2`) (dipende da T293)
- Pipeline: claude · sforzo high · stima 4% · approvato · browser · priorità 7
- Sforzo: high.
- Step: 41
- Contesto: testo dell'autore come T293. Le tre pagine sono `lab/3d/`, `lab/editor/`, `lab/suono/`; sono strumenti da sviluppatore, senza account e senza un punto d'ingresso per chi gioca. `NOT_SERVED` oggi le esclude dal server di produzione.
- Cosa fare:
  1. Con `laboratori` acceso il server di produzione le serve, sotto la CSP (`server/csp.ts`); spento non escono, come oggi. Controlla cosa entra davvero in `dist/`: nessuna chiave, nessuno script di `lab/scripts/`, nessuna chiamata ai modelli.
  2. «Forka» da un modello o da un suono di un universo che il giocatore può leggere (solo ciò che `publicFiles` già dà) e dalle proprie carte: apre la copia nel laboratorio giusto. «Salva» scrive la carta (T293) e riporta il motivo di un rifiuto del validatore.
  3. Le carte fatte a mano stanno in `site/carte.html` con le altre, riconoscibili, con l'autore e il link al laboratorio; visibili a tutti gli account.
  4. Un punto d'ingresso nel sito, col tema condiviso. Ciò che nei laboratori serve solo agli sviluppatori (cartelle del disco, prove con Gemini, modelli ufficiali da confrontare) non si vede.
  5. Il lavoro non si perde: una modifica non salvata resta in locale. Dai laboratori non si chiama mai Gemini: per un giocatore non costano crediti.
- Test: la logica isolabile (fork → carta → riapertura dà lo stesso XML); server di produzione con interruttore acceso e spento. Typecheck, build e suite intera con i loro turni.
- Browser: sì, sotto `npm run serve` con l'interruttore nei due stati, con un account di prova (emulatore): forko un modello, lo modifico, salvo, ricarico, lo vedo in `carte.html`; stesso giro per un suono (l'agente non sente: misura il segnale e di' cosa deve ascoltare l'autore); da un secondo account lo vedo e non lo scrivo. Catture nel commit.
- Quando è fatto: commit su `task/T294`. Sicurezza: nell'esito.
- Esito: laboratori serviti dal server di produzione solo con `laboratori` acceso e solo i tre; build senza strumenti degli sviluppatori (`import.meta.env.MODE`, perché `DEV` segue NODE_ENV e portava Gemini nel dist); barra delle carte in editor e SoundLab (fork da `publicFiles` o da una propria carta, Salva / Salva come nuova coi motivi del server, bozza in localStorage, carta altrui sola lettura); sandbox con i modelli fatti a mano; `site/laboratori.html` e link a build accesa; carte fatte a mano in `carte.html`; senza account viandante per id; preset del SoundLab ripristinati (`sound-*`); ADR-0168; non provato con un account dell'emulatore (non installato), miniature delle carte fatte a mano assenti, il posizionamento automatico della carta nella sandbox non visto nel browser; sicurezza: nessuna rotta nuova, superficie solo le tre pagine statiche con l'interruttore acceso, sotto CSP, nessuna voce nuova.

### T295 · Portare le carte in un universo nuovo, prima della Genesi — `fatto` (`f3a98545`) (dipende da T293)
- Pipeline: claude · sforzo max · stima 4% · approvato · browser · priorità 7
- Sforzo: max, scelto dall'autore.
- Step: 41
- Deciso dall'autore (05/11): **D39 A**: il primo commit dal seme è identico per lo stesso seme e la stessa `X.Y`; gli universi che esistono già restano fuori.
- Contesto: testo dell'autore, § «A regime». Oggi i modelli e i suoni di un universo si ereditano solo clonandolo. L'autore vuole aggiungere carte, fatte a mano o generate, solo all'inizio, prima della Genesi, solo tra universi con un antenato comune: meno collisioni, e la Genesi non rigenera ciò che esiste. Fatto trovato pianificando: ogni universo nato dal seme fa il suo `git init` (`server/universeStore.ts:391`), e il clone copia un mondo già generato, senza Genesi: oggi le due condizioni non sono mai vere insieme.
- Cosa fare:
  1. Il primo commit di un universo nato dal seme è identico per lo stesso seme e la stessa `X.Y` (albero, data e autore fissi): tutti hanno la stessa radice. «Antenato comune» si controlla confrontando le radici (`git rev-list --max-parents=0`, solo da `server/git.ts`), senza portare la storia dell'altro universo. I cloni tengono la radice. Gli universi che esistono già non la hanno: dillo nell'esito.
  2. Nella Genesi, prima di partire, il master sceglie le carte: dalla sua collezione, da quelle fatte a mano e dai modelli e suoni degli universi che può leggere e che hanno la stessa radice. Per un clone il momento è prima che entri il primo viandante. Poi la scelta si chiude.
  3. Ogni carta ripassa dal validatore e dal controllo di `X.Y`, e due carte con lo stesso id si segnalano prima di partire; entrano nell'universo con un commit del kernel e con la loro `carta`.
  4. La Genesi e i direttori (`ModelDirector`, `ScoreDirector`, `runDeferred` di ADR-0143) non rigenerano ciò che c'è, e il Cartografo e lo Scultore sanno che esiste e lo usano: conta le chiamate con e senza carte con `MockAiModels` e scrivi il risparmio. Controlla cosa dice l'Artista della guida di stile davanti a modelli nati altrove.
  5. Chi guadagna: la catena di `carta.origini` si allunga come in un clone e le quote seguono ADR-0084; importare non costa crediti. Il controllo della regola 8d resta: nessun saldo si muove con l'import.
- Test: radice uguale e diversa, clone, `X.Y` diverso, scelta a Genesi già fatta (rifiutata), a partita iniziata (rifiutata), non master (rifiutata), Genesi offline con carte (meno chiamate, 0 fault), carta ostile da un altro universo; `tests/sicurezza/` se serve. Typecheck e suite intera con i loro turni. Versione del kernel (ADR-0136; una radice nuova per i nuovi universi: motiva nell'ADR se `Y` sale).
- Browser: sì, con `?offline`: scelgo due modelli e un suono prima della Genesi, li vedo nel mondo, ricarico. Catture nel commit.
- Quando è fatto: commit su `task/T295`, ADR, sezione in `#clone-eredita`.
- Esito: radice del contratto per gli universi nuovi (un commit fisso per `X.Y`, parenti per radice); scelta aperta in `universe.json → cardChoice`, chiusa dal kernel alla Genesi e al primo ingresso; rotte `kin` e `bring` solo del master, ogni carta riletta dal disco e controllata, doppioni prima di partire, tutto o niente in un commit del kernel; titolare il master e un anello in più nella catena, nessun saldo si muove; Cartografo, Narratore e Scultore usano le carte portate, l'Artista non le rigiudica; i modelli dello Scultore ora sono carte; risparmio offline 21→0 programmi e 68→26 chiamate; V-033 chiusa; ADR-0169, kernel 0.5.6. Mancano: gli universi di prima (senza radice) e i modelli scolpiti prima di 0.5.6 (senza carta) restano fuori; `npm run genera` non sceglie carte da sé. Non provati nel browser: la lobby di un clone e le carte fatte a mano (coperti solo dai test).

### T296 · Eliminare la carta problematica — `fatto` (`2e0d5a87`) (dipende da T295)
- Pipeline: claude · sforzo max · stima 1.5% · approvato · browser · priorità 7
- Sforzo: max, scelto dall'autore.
- Step: 41
- Contesto: testo dell'autore: «se poi ci dovesse essere [una collisione] eliminiamo la carta problematica». Regola 2: l'IA non rompe mai il gioco, regola 3: ciò che viene da un giocatore si isola.
- Cosa fare: una carta importata che fallisce (programma che non produce, forma senza impronta, guasto nel worker, suono muto) non rompe il mondo: si isola, si mostra al master con il motivo, e il master la toglie da un'azione nella console (scheda «Universo»), con un commit. Ciò che la usava torna al modello generico o alla richiesta al `ModelDirector` / `ScoreDirector`, entro i loro tetti; il suono tace (ADR-0126). La carta resta nell'archivio del suo autore e nella catena delle origini. Registra il fallimento in `world/mancanze.json` se il Concilio non può rimediare (ADR-0130).
- Test: una carta rotta per ogni modo di fallire: 0 crash, entità ancora presenti, rimozione, salvataggio e riapertura; un non master non può togliere. Typecheck e suite intera con i loro turni. Versione del kernel (ADR-0136).
- Browser: sì, con `?offline`: una carta rotta di proposito, il mondo gira, la tolgo dalla console, ricarico. Catture nel commit.
- Quando è fatto: commit su `task/T296`. Sicurezza: nell'esito.
- Esito: una carta portata che nel mondo dà errore o ferma il suo worker, non produce niente, non ferma un corpo solido o tace (anche un brano sotto −80 dB) si isola con le sue copie: chi la indossava veste il generico della classe e la aspetta, il terreno torna al suo aspetto, il suono tace, gli agenti e il ModelDirector non la usano più; il master la vede (guasto `card:<id>`, registro `card.broken`, scheda «Universo» «Le carte portate») e la toglie con «Togli» (due clic) con un commit del kernel dei soli `models/`, anche se funziona; chi la usava torna ai direttori entro i tetti, e ciò che il Concilio non può rifare va in `world/shortfalls.json` (il nome di `mancanze.json` dal contratto 0.4); un ritorno a prima la riprova e `R` non la guarisce; in un mondo di molti l'elenco `broken` va a ogni client e il messaggio `card` è solo del master; il WorkerRunner perde solo il lavoro del worker che si ferma o non risponde (120 s) e lo rimpiazza; ADR-0172, kernel 0.5.8, voce «Carta guasta» nel glossario. Manca: lo Scultore può prendere ad esempio il programma di una carta isolata finché non è tolta; un guasto solo nel browser di un giocatore resta suo; il suono muto si scopre solo dopo il primo gesto e per ciò che suona. Non provati nel browser (coperti dai test): partita di molti, forma senza impronta, worker che non risponde. Sicurezza: superficie nuova, il messaggio `card` del filo (solo del master, controllato nel server e nel kernel, provato con un giocatore, con messaggi malformati e nella lista V-021 avvelenata) e il campo `broken` verso i client (id e motivi di carte portate, nessun segreto, letto con `readBrokenCards`); nessuna voce nuova nel registro.

### T297 · Integrare T280: i conflitti di versione e gli ADR — `fatto` (`f560a67`)
- Pipeline: claude · stima 1% · approvato · priorità 1
- Sforzo: high.
- Step: 32
- Contesto: `integra T280` si è fermato su `package.json`, `package-lock.json`, `src/kernel/version.ts`, `universe/universe.json`. Nasce da T280: `dossier T280`. `3d` è a `0.1.6` (T275, via T282), `task/T280` a `0.1.9`.
- Cosa fare: nel tuo worktree `git merge task/T280`. Versione: la più alta, `0.1.9`, uguale in tutti e quattro i file (ADR-0136). **Attenzione agli ADR:** `task/T280` porta i suoi 0142-0144 e su `3d` quei numeri ora sono presi da T276 e T275: rinumera i suoi ai primi liberi, con indice, `AGENTS.md` e rimandi corretti, e nessun ADR di `3d` toccato. Due aggiunte nello stesso punto restano entrambe. `tests/fixtures/mj-engine-hashes.json`: se è rossa spiega perché prima di rigenerarla (T282 l'ha rigenerata col motore di prima di D33).
- Test: suite intera e typecheck con i loro turni.
- Browser: non serve, T280 ha già guardato.
- Quando è fatto: commit su `task/T297`. Nell'esito: i numeri nuovi degli ADR; ricorda di dare `integra T280` e di segnare `fatto` T245d, T245e, T245f.
- Esito: merge di `task/T280` in `task/T297` (`d767201`) con versione `0.1.9` in `package.json`, `package-lock.json`, `src/kernel/version.ts` e `universe/universe.json`; numeri nuovi degli ADR di T280: ADR-0145 (imprese), ADR-0146 (edificio per stadi), ADR-0147 (fuori vista), già rinumerati in `06e33cf`, rimandi controllati, nessun ADR di `3d` toccato; aggiunta la colonna dello stato (`accettato`) alle loro righe dell'indice; `tests/fixtures/mj-engine-hashes.json` verde e non rigenerata; backlog e quadro non cambiati dal merge; suite 2292 passati e 1 saltato, typecheck verde; censimento del glossario tenuto com'è fuso, non rigenerato; non provati browser (non richiesto, T280 ha già guardato), build e i quattro universi su questo merge; manca dare `integra T280` e segnare `fatto` T245d, T245e, T245f; sicurezza: nessuna superficie nuova oltre a quella dichiarata da T280.

### T298 · I mestieri di orichalcum, neapolis e sidera — `fatto` (`3d33e02`) (dipende da T297)
- Pipeline: claude · sforzo high · stima 2% · approvato · priorità 5
- Sforzo: high.
- Step: 32
- Contesto: trovato da T280 (`dossier T280`, e il suo `INTEGRAZIONE.md`). I tre universi non hanno `sys.lavoro` né `lavoro.*`: un edificio che crolla vi resta ai picchetti. I moduli del seme non bastano: 0/24, 4/24, 3/24 persone con un programma, e mancano `item.grano` e `item.pesce`. Mestieri: ADR-0140 e `#societa`.
- Cosa fare: in `lab/banco/universi-cloud/`, per ogni universo, `sys.lavoro` e i programmi `lavoro.<mestiere>` nel suo tema, con gli oggetti e le ricette che servono, così che ogni persona che ha un mestiere abbia un programma e un edificio crollato si ricostruisca. Niente kernel: se manca una primitiva scrivilo nell'esito. Testi senza meta-gioco. `npm run universi:cloud` li installa.
- Test: gli universi sul `Kernel` vero per almeno 600 tick: 0 fault, ogni mestiere con un programma, un edificio crollato che risale di stadio e torna intero. Typecheck e suite intera con i loro turni.
- Browser: sì, con un'installazione temporanea di uno dei tre: una giornata di lavoro e un cantiere. Catture nel commit. Niente nelle `universes/` dell'autore (D36).
- Quando è fatto: commit su `task/T298`; nell'esito la tabella persone con un programma per universo.
- Esito: orichalcum, neapolis e sidera hanno `sys.lavoro` e 9/12/13 programmi `lavoro.*` nel loro tema; persone con un programma 22/22, 22/22, 23/23 (2 gatti, 2 gatti e un corvo senza, di proposito: le squadre prendono chiunque abbia un programma, manca una primitiva per un mestiere che non fa squadra); `item.ciocco`/`item.chiodi` con i nomi di ogni mondo, `item.telo-canapa` e `item.alghe`, due caselle nuove in sidera (vasca seminata → vasca in frutto); `tests/mestieri-cloud.test.ts` sul Kernel vero: programmi validi, testi senza meta-gioco, una giornata di lavoro, un crollo che sale 0,2→0,7→0,9→1 e torna intero, 0 fault (il test alza `NPC_CAP` solo per sé); tre `verifica.ts` verdi (orichalcum conta 34 moduli, neapolis valida i programmi e lascia `sys.lavoro` fuori dalla quarta parete); suite 2416 passati e 1 saltato, typecheck e build verdi; niente kernel; scoperto: con il deposito del luogo vuoto e i soli produttori in squadra l'impresa fuori vista resta «in attesa» (regola di ADR-0149; proposta: prendere anche dai depositi dei luoghi della squadra); `NPC_CAP` può lasciare fuori gli abitanti di un luogo quando i luoghi offline intorno occupano i posti; non provati orichalcum e neapolis nel browser, raccolto annuale, multigiocatore; `INTEGRAZIONE.md` aggiornato.

### T299 · Un individuo si blocca su un dislivello — `fatto` (`812f893`) (dipende da T297)
- Pipeline: claude · sforzo high · stima 1% · approvato · priorità 6
- Sforzo: high.
- Step: 32
- Contesto: nella verifica di T280 (`dossier T280`, `traccia T280`) Ugo si è fermato su un dislivello, tanto che il rientro a piedi non si è potuto provare. Un mestiere o un'impresa che non arriva vale poco. Vie: `src/kernel/route.ts` (`findRoute`), `#rilievo`.
- Cosa fare: riproduci con un test offline. Trova se è la via che passa dove il rilievo non fa salire, o il passo che non segue la via. Correggi la causa; un individuo davvero senza via rinuncia, con la sua routine, invece di restare fermo. Con il rientro a piedi, che T280 non ha provato.
- Test: il caso riprodotto, una via su rilievo con gradini validi e invalidi. Typecheck e suite intera con i loro turni. Versione del kernel (ADR-0136).
- Browser: sì, con `?skip&offline`: un individuo che attraversa un dislivello e il rientro a piedi in un cantiere. Catture nel commit.
- Quando è fatto: commit su `task/T299`.
- Esito: la via passa solo dove il passo passa: un passo fra due caselle vale solo se il corpo ci cammina (`stepFree`: campioni ogni 0.1 con i piedi sul pavimento, scorciatoia senza modelli), raggio di chi chiede (`world.path(x, y, tx, ty, r)`, predefinito 0.35), punto più lontano raggiungibile dritti, meta irraggiungibile raggiunta il più vicino possibile entro `ROUTE_NEAR` 2.5, riuso del resto di una via e cache dei passi, cache svuotata quando un luogo si carica o si scarica o il primo passo non è più libero; senza via `sys.lavoro` fallisce subito con `fallito:nessuna via` e va avanti (campo `no_way`); causa: la via guardava solo i centri delle caselle (24/14035 passi falsi sul mondo di prova, 0 ora); `tests/dislivello.test.ts` (platea con e senza scala, abitante che sale o rinuncia, mondo intero, rientro a piedi al cantiere); kernel 0.1.13, ADR-0154, AGENTS.md, `#societa`, prompt dell'Ingegnere; suite 2428 passati e 1 saltato, typecheck e build verdi; non fatto: chi non ha un mestiere va ancora dritto verso la sua routine (`sys.wander`), copie del prompt in `lab/banco/universi-cloud/` non aggiornate, ricerca senza via accanto ai modelli più lenta (0,2–0,3 s contro 0,09), punto esatto di Ugo in T280 non riprodotto (universo non più presente), server di produzione non provato; sicurezza: nessuna superficie nuova (un numero stretto 0.1–0.5 da Lua).

### T300 · Integrare T297 sul base con T283: il censimento e l'ADR-0145 — `fatto` (`2c40eb0`)
- Pipeline: claude · sforzo high · stima 1% · approvato · priorità 1
- Sforzo: high.
- Step: 32
- Contesto: `integra T297` e `integra T280` si fermano su `docs/glossario-censimento.md`, perché T283 è entrato nel base con la voce «Veste» e con ADR-0145. Nasce da T297: `dossier T297`, e da T283: `dossier T283`. `task/T297` contiene già `task/T280` e usa ADR-0145, 0146, 0147.
- Cosa fare: nel tuo worktree `git merge task/T297`. Il censimento è generato: rigeneralo con `tools/glossario/glossario.mjs`, non fonderlo a mano. **ADR:** ADR-0145 sul base è di T283 (le vesti) e resta suo: rinumera imprese, edificio per stadi e fuori vista ai primi numeri liberi, con i rimandi in `AGENTS.md`, `docs/architettura-dettagli.md`, indice degli ADR e codice. Versione `0.1.9` uguale nei quattro file (ADR-0136), o più alta se il base nel frattempo è salito.
- Test: suite intera e typecheck con i loro turni.
- Browser: non serve, T280 ha già guardato.
- Quando è fatto: commit su `task/T300`. Nell'esito: i numeri nuovi degli ADR; ricorda di dare `integra T297` e `integra T280` e di segnare `fatto` T245d, T245e, T245f.
- Esito: `task/T297` fuso in `task/T300` (`4163194`) col censimento del glossario rigenerato con `tools/glossario/glossario.mjs`; ADR di T280 rinumerati ai primi liberi: imprese → ADR-0147, edificio per stadi → ADR-0148, fuori vista → ADR-0149, con i rimandi in `AGENTS.md`, `docs/architettura-dettagli.md`, `docs/glossario.md`, indice degli ADR, codice e test; ADR-0145 (vesti, T283) e ADR-0146 (modelli e sforzo, T255) del base non toccati; versione `0.1.9` in `package.json`, `package-lock.json`, `src/kernel/version.ts` e `universe/universe.json` (il base è a `0.1.6`); fuso anche `task/T280` (`2c40eb0`, `-s ours`), andato avanti con `7e8cd6c` dopo T297: era la stessa rinumerazione di `f560a67` e senza il merge `integra T280` si sarebbe fermato su un conflitto; suite 2350 passati e 1 saltato, typecheck verde; non provati la build e i quattro universi su questo merge; `docs/pipeline/quadro.md` dice ancora «ADR di T280 → 0145-0147»; manca dare prima `integra T300`, poi `integra T297` e `integra T280` (a quel punto non fondono niente), e segnare `fatto` T245d, T245e, T245f; sicurezza: nessuna superficie nuova oltre a quella dichiarata da T280.

### T301 · Integrare T291 sul base con T300: versione del kernel e ADR — `fatto` (`da81925`)
- Pipeline: claude · sforzo high · stima 2% · approvato · priorità 1
- Step: 40
- Contesto: `integra T291` si ferma su `AGENTS.md`, `package-lock.json`, `package.json`, `src/kernel/version.ts`, `universe/universe.json`: T291 ha portato il kernel a `0.1.7` e ha preso ADR-0147, mentre il base, con T300 (T280, T297), è a `0.1.9` e ADR-0147, 0148, 0149 sono imprese, edificio per stadi e fuori vista. Nasce da T291: `dossier T291`, e da T300: `dossier T300`.
- Cosa fare: nel tuo worktree `git merge task/T291`. **ADR:** quelli del base restano loro; l'ADR di T291 (posare sui mobili) va al primo numero libero, con i rimandi in `AGENTS.md`, `docs/architettura-dettagli.md`, `docs/glossario.md`, indice degli ADR, codice e test. Nei conflitti di `AGENTS.md` e dei documenti le due aggiunte restano entrambe. Il censimento del glossario si rigenera con `tools/glossario/glossario.mjs`. Versione `0.1.10` uguale nei quattro file (ADR-0136), o più alta se il base nel frattempo è salito. Controlla che il componente `posato` e `stato.json → posati` convivano con ciò che T280 scrive in `stato.json` e con il fuori vista (ADR-0149): un oggetto posato in un luogo lasciato torna con il luogo.
- Test: suite intera e typecheck con i loro turni.
- Browser: non serve, T291 ha già guardato.
- Quando è fatto: commit su `task/T301`. Nell'esito: il numero nuovo dell'ADR; ricorda di dare `integra T301`, poi `integra T291`.
- Esito: `task/T291` fuso in `task/T301` (`da81925`); l'ADR di posare sui mobili è **ADR-0150** (T291 lo aveva già rinumerato, nessun rimando a 0147); ADR-0147, 0148 e 0149 del base non toccati; `AGENTS.md` con entrambe le aggiunte; versione `0.1.10` nei quattro file; censimento del glossario rigenerato; `posato` e `stato.json → posati` convivono con T280, che non scrive campi nuovi in `stato.json`; un oggetto posato non appartiene al luogo e torna con lui, provato da un test nuovo in `tests/posare.test.ts`; suite 2365 passati e 1 saltato, typecheck verde; non provate la build e il browser (non richiesti); manca dare `integra T301`, poi `integra T291`; sicurezza: nessuna superficie nuova oltre a quella dichiarata da T291.

### T302 · Gli universi dicono su quali kernel girano: l'intervallo e l'impalcatura della retrocompatibilità — `fatto` (`2498090`)
- Pipeline: claude · sforzo high · stima 3% · approvato · priorità 3
- Step: 32
- Contesto: risposta dell'autore a D36 (05/11). Oggi `universe.json → kernel` dice la versione che l'ha scritto e `checkKernelVersion` (ADR-0136, `src/kernel/version.ts`) lascia in piedi con il guasto `universe:kernel` un universo di un'altra `X.Y`. L'autore: un universo non più compatibile non si butta né si migra ora: si etichetta con l'intervallo dei kernel su cui gira e si lascia; della retrocompatibilità non ci si occupa ancora, ma se ne predispone l'impalcatura. L'installazione dei quattro universi di T279 (`npm run universi:cloud`) è il primo banco: nasce da T279, `dossier T279`, e da ADR-0136.
- Cosa fare: (1) in `universe.json` l'intervallo dei kernel su cui l'universo gira (da quale a quale `X.Y`, il limite alto aperto finché un kernel nuovo non cambia contratto), scritto dal kernel e derivato dalla versione con cui l'universo è nato o è stato portato; un universo vecchio senza il campo lo ricava da `kernel`. (2) `checkKernelVersion` legge l'intervallo; fuori intervallo resta il guasto `universe:kernel` di oggi, con l'intervallo nel motivo. (3) Dove si scelgono gli universi (lobby, sito, `?universo=`) un universo fuori intervallo si vede con la sua etichetta («kernel 0.1–0.1») e non si cancella. (4) L'impalcatura: un punto unico in cui un domani si registrano le migrazioni da un `X.Y` al successivo (vuoto oggi, con un test che dice che senza migrazione l'universo resta com'è) e, se serve, la strada per servire un universo con un kernel di un'altra versione (solo descritta nell'ADR, niente server dedicato). (5) `npm run universi:cloud` scrive l'intervallo sui quattro universi. ADR nuovo, `AGENTS.md` (regola 6 o la convenzione della versione), `#stato` o la sezione giusta di `docs/architettura-dettagli.md`, glossario («intervallo dei kernel»). Versione del kernel come dice ADR-0136.
- Test: unitari su intervallo, universi vecchi senza campo, fuori intervallo; suite intera e typecheck con i loro turni.
- Browser: un universo fuori intervallo (fatto a mano in una copia temporanea) si vede nella lobby con l'etichetta e si apre col guasto, senza rompere il gioco; uno buono si apre come prima.
- Quando è fatto: commit su `task/T302`. Nell'esito: dove sta l'intervallo e come l'autore installa i quattro universi (`npm run universi:cloud`, `aurora` va nel cestino).
- Esito: `universe.json → kernels` (`from`, `to` facoltativo, aperto fino al contratto di `kernel`), scritto dal kernel e ricavato da `kernel` negli universi vecchi; `checkKernelVersion` lo legge, fuori intervallo il guasto `universe:kernel` dice l'intervallo, un universo di un kernel più nuovo non si apre mai su uno più vecchio; etichetta «kernel X.Y–X.Y» nella pagina delle sessioni e nella lobby, `?universo=` apre col guasto, niente dal seme (`upgradeFromSeed`); `kernel`/`kernels` ai client (`UNIVERSE_FIELDS`); `src/kernel/migrations.ts` (`MIGRATIONS` vuoto, `migrateUniverse` all'avvio, test), server di un'altra versione solo nell'ADR-0152; `npm run universi:cloud` scrive l'intervallo sui quattro (provato solo con `--dir`; in `universes/` vero `aurora` e le altre vanno nel cestino); kernel 0.1.11; suite 2392 passati e 1 saltato, typecheck e build verdi; non chiuso, serve un task: il Concilio committa ancora i suoi contenuti su un universo fuori intervallo (succedeva già prima); sicurezza: nessuna superficie nuova, solo i due campi di versione in più verso i client.

### T303 · La misura vera dello Scenografo, con gli abbonamenti — `in attesa` (dipende da T156)
- Pipeline: claude · sforzo high · stima 3% · approvato · priorità 5
- Attesa (07/11, epoca 324): l'autore propone una metodologia nuova per i programmi MarkovJunior degli edifici, «ad alto livello per scomposizione del modello», che scriverà l'08/11; questo task tocca il prompt o la misura dello Scultore e aspetta quel testo (poi si riscrive o si sblocca).
- Step: 30
- Contesto: risposta dell'autore a D37 (05/11): sì alla misura vera, preferibilmente con gli abbonamenti, perché la CLI di Claude riporta sempre la spesa. Nasce da T259: `dossier T259`, `docs/design/scenografo.md` § 9, e da T182 (`dossier T182`). Dopo T156, perché si misuri col prompt nuovo dello Scultore.
- Cosa fare: lo stesso edificio di T182, 2 richieste per via: (a) interno insieme all'edificio, (b) interno a parte come programma MarkovJunior di secondo stadio, (c) interno a parte come catalogo di mobili esistenti. Le richieste vanno alla CLI di Claude (la coda degli abbonamenti, ADR-0077, ADR-0106, o la CLI isolata come fa `tools/abbonamenti/servi.ts`), mai alla chiave Gemini; il costo di ogni via è quello che la CLI riporta (`total_cost_usd`, token in e out), con il modello scritto accanto. Ogni risultato passa dal motore e dai controlli del banco (`lab/scripts/banco-scenografo.ts`). Aggiorna § 9 con i numeri misurati al posto delle stime, e la raccomandazione: conviene separare? I quattro task del § 9 (guardia nel kernel, Scenografo, mobili per la cantina, misure dello Scultore) restano una proposta nell'esito. Solo `lab/` e `docs/design/`, niente gioco.
- Test: i programmi provati girano nel motore e passano i controlli; typecheck con il suo turno.
- Browser: non serve; fogli di contatto nel commit.
- Quando è fatto: commit su `task/T303`. Nell'esito il costo misurato di ogni via e quanto ha speso la misura.

### T304 · La lavagna della pagina web della pipeline: titoli in Markdown, priorità, sforzo e step sulle tile, gli ultimi task finiti — `fatto` (`e00994b2`)
- Pipeline: claude · sforzo high · stima 3% · approvato · priorità 4
- Contesto: richiesta dell'autore in chat (05/11, epoca 291) sulla pagina web della pipeline (`tools/pipeline/web.mjs`, T69; il Markdown in `tools/pipeline/markdown.mjs`). Nasce da T69 e T208: `dossier T69`, `dossier T208`.
- Cosa fare: (1) nella lavagna il titolo di ogni task si rende in Markdown (come già la vista Markdown), e ogni `Txx`/`txxx` citato nel titolo è un link al task (lo stesso che apre il dossier o il blocco nella pagina). (2) In alto a destra di ogni tile, accanto al provider e alla stima («claude», «5%»), tre etichette: priorità, sforzo, step. Priorità e sforzo colorati in scala (priorità alta = colore più caldo; sforzo da `low` a `max` in una scala sola), lo step con un colore fisso ricavato da un hash del suo numero (step diversi, colori diversi, sempre uguali tra un caricamento e l'altro); un task senza step non ha l'etichetta. Leggibili sul tema scuro della pagina. (3) Sotto la chat con l'orchestratore e il diario, una lista degli ultimi task completati (almeno 10, più recenti in alto): numero (link), titolo, quando, commit, e la riga dell'esito se c'è, così l'autore vede cosa è successo mentre l'orchestratore lavora da solo.
- Test: se `tools/pipeline` ha test (`tests/pipeline*.test.ts`), uno per il link ai Txx nel titolo e uno per il colore dello step stabile; typecheck con il suo turno.
- Browser: `node tools/pipeline/pipeline.mjs web --porta <libera>` (mai la 4242 del processo acceso), screenshot della lavagna con le etichette e della lista dei finiti; chiudi il processo alla fine.
- Quando è fatto: commit su `task/T304`. Nell'esito: dove sta ciò che è cambiato e che la pagina accesa si aggiorna solo al riavvio del processo dell'orchestratore.
- Esito: lavagna della pagina web della pipeline: titoli di tile e tabella in Markdown in linea con ogni Txx/txx di un task esistente che apre quel task (`markdown.mjs`: `markdownToHtml(…, { inline: true })`, `taskRefsToHtml(…, { anyCase: true })`, clic in cattura in `web.mjs`); etichette di priorità (scala logaritmica dal rosso al blu), sforzo (da `low` verde acqua a `max` magenta; quello del task, poi della sua esecuzione, poi del provider; senza sforzo nessuna etichetta) e step (colore da un hash del numero; senza step nessuna etichetta), con i colori in `tools/pipeline/tiles.mjs`; lista «Ultimi finiti» sotto la chat (15, più recenti in alto: numero, titolo, quando, commit, provider, esito che si apre al clic; `recentlyDone` e `taskCommits` in `web.mjs`, campo `finiti` in `/api/stato`, `parseBacklog` legge il commit dal titolo); README della pipeline aggiornato; 4 test in `tests/pipeline-markdown.test.ts` e uno aggiornato in `tests/pipeline.test.ts`; typecheck verde; suite intera: l'unico rosso dell'ultima corsa è `tests/coefficients.test.ts` (57 invece di 60), estraneo ai file del task, verde nella prima corsa e da solo due volte su due: sembra instabile sotto carico. La pagina accesa si aggiorna solo al riavvio del processo dell'orchestratore. Sicurezza: nessuna superficie nuova.

### T305 · Argon anche con l'abbonamento Google Pro — `fatto` (`a53f14ed`) (dopo T304)
- Pipeline: claude · sforzo high · stima 1% · approvato · priorità 4
- Contesto: l'autore (05/11, epoca 291): ha Google Pro, non Ultra, e ha accesso ad Argon; ma in `tools/pipeline/config.json → piani.google.pro.disponibili` Argon manca, quindi scegliendo «Pro» nella scheda consumo e budget della pagina web Argon si spegne. Nasce da T255 e ADR-0119: `dossier T255`. Dopo T304 perché toccano la stessa pagina.
- Cosa fare: (1) `argon` tra i `disponibili` del piano `google.pro` (tenendo i limiti di D31: solo task piccoli); controlla in `pipeline.mjs` e `web.mjs` che nient'altro leghi Argon a Ultra (scheda consumo e budget, `windowAdmits`, slot). (2) `abbonamenti.google` a `pro`, come dice l'autore; il `moltiplicatoreStima` di Pro (2,5) scala le stime di gemini e agy: scrivi nell'esito se le misure di T268 erano fatte su Ultra o su Pro e, se su Pro, proponi il moltiplicatore giusto senza cambiarlo. (3) Aggiorna ADR-0119 o la riga di `docs/pipeline/README.md` che lo descrive, e `docs/pipeline/modelli.md` se dice che Argon è solo Ultra.
- Test: se ci sono test della pipeline, uno che con `google: pro` Argon è disponibile; typecheck con il suo turno.
- Browser: nella pagina web (porta libera) scegliere Pro lascia Argon acceso.
- Quando è fatto: commit su `task/T305`. Nell'esito che il processo dell'orchestratore legge `config.json` solo all'avvio.
- Esito: Argon tra i disponibili di `piani.google.pro` e `abbonamenti.google` a `pro` (`tools/pipeline/config.json`); nient'altro nel codice legava Argon a Ultra; `refreshConfig` rilegge anche i piani; test in `tests/pipeline.test.ts`; README della pipeline e `modelli.md` (4.6) aggiornati, ADR-0119 non toccato. Le misure di T268 e tutte quelle dei provider Google erano su Pro, anche se `consumi.jsonl` scrive `ultra` perché lo diceva la configurazione: propongo di portare `piani.google.pro.moltiplicatoreStima` da 2,5 a 1, non l'ho cambiato. Il processo dell'orchestratore legge `config.json` solo all'avvio e quello acceso adesso spegnerebbe Argon: va riavviato. Typecheck e suite intera verdi (2469 test). Sicurezza: nessuna superficie nuova.

### T306 · L'inglese come lingua interna: la tabella delle corrispondenze, le rune in latino e l'ADR — `fatto` (`83b5ba3`) (dipende da T302)
- Pipeline: claude · sforzo high · stima 3% · approvato · priorità 3
- Step: 42
- Contesto: risposte dell'autore a D34 (05/11 sera): **C** per le lingue (una lingua del mondo per universo, scelta alla Genesi; l'interfaccia nella lingua del viandante, T239 in Fase III), e **subito, prima della beta, l'inglese come lingua interna** perché la comunità dello sviluppo agentico possa leggere il repository: valori confrontati dal codice, nomi di campo su disco, commenti di Lua e XML, prompt. La documentazione resta italiana (a parte il sottoinsieme in inglese del punto 6, in Fase III). I **token delle rune magiche in latino** (`terra`, `ignis`, `ventus`, `aqua`, `lux`…), uguali in ogni lingua; i token di codice (`x`, `speed`, `=`) restano Lua. Le cifre sono in `docs/lingue-censimento.md` (≈ 130 valori distinti nei domini, 212 nomi di campo; le 3.849 sono occorrenze) e `docs/lingue.md` §3, §5. Contratto nuovo (D32, ADR-0136): `0.2.0`; la migrazione degli universi salvati è la prima che si registra nell'impalcatura di T302 (`dossier T302`).
- Cosa fare, solo documenti e un test: (1) `docs/lingua-interna.md`: la tabella completa, dominio per dominio (classi, taglie, effetti `tipo`, momenti, «dove», attività, specie e generi, usi dei suoni, azioni e layout del seme, nomi dei terreni, rune magiche → latino, i 212 campi su disco con il file in cui stanno, i percorsi come `world/giocatori/`, `world/imprese.json`, `world/magazzino/`, i messaggi del protocollo e i nomi visibili a Lua che sono italiani), ogni voce: italiano → inglese (o latino), dove si legge, se tocca disco, filo o Lua. (2) La stessa tabella come dato, `src/kernel/internalNames.ts` (o il nome che il glossario suggerisce), con un test che non ci siano doppioni né collisioni con nomi inglesi già usati. (3) Il piano dei task successivi (T307-T310) verificato sul codice: se uno è troppo grande, lo spezza nell'esito. (4) ADR nuovo («L'inglese è la lingua interna; il mondo ha la lingua del suo universo; le rune in latino»), che supera la convenzione sui commenti Lua italiani; `AGENTS.md` (Convenzioni) e `docs/glossario.md` aggiornati; `docs/lingue.md` §2-§4 allineato alle risposte di D34 (C, P2, latino, filtro su mondo + italiano + inglese).
- Test: quello della tabella; typecheck con il suo turno.
- Browser: non serve.
- Quando è fatto: commit su `task/T306`. Nell'esito il numero di voci per dominio e cosa resta fuori.
- Esito: `docs/lingua-interna.md` e `src/kernel/internalNames.ts` (54 domini, 847 voci: T307a 192, T307b 244, T308a 266, T308b 145) con il test (niente doppioni, catene, collisioni; copertura del codice e del seme); ADR-0153, `AGENTS.md`, glossario, `docs/lingue.md` §2-§4 allineati a D34; kernel 0.1.12. T307 e T308 spezzati in T307a (0.2), T307b (0.3), T308a (0.4), T308b (0.5), ognuno da solo con la sua migrazione; T310 toglie anche la riparazione dei valori italiani e aggiunge il tipo di legame come id. Fuori: testo del mondo, UI, indirizzi, le 83 regex (T310), contenuti del Concilio salvati, esiti del Lua di `sys.lavoro` (T307b). Il conteggio dei file per passo è un tetto, non la cifra esatta. Suite intera e typecheck verdi.

### T307a · L'inglese come lingua interna: i valori della simulazione e le rune in latino (contratto 0.2) — `fatto` (`66b98324`) (dipende da T306)
- Pipeline: claude · sforzo extra · stima 4% · approvato · priorità 2
- Step: 42
- Contesto: il primo dei quattro passi di codice in cui T306 ha spezzato T307 e T308 (`dossier T306`, `docs/lingua-interna.md`, sezione del piano, punto 1; ADR-0153). **Va lanciato da solo**: nessun altro task su `src/`, `universe/`, `tests/` in corso, perché si scontra con tutti.
- Cosa fare: i domini della tabella marcati T307a (0.2) in `src/kernel/internalNames.ts`: classi, animazioni, taglie, effetti e i loro campi, categorie, forme, terreni (id con l'etichetta italiana), ambienti, timbri, azioni, **rune in latino** (canone, `magic.runes`, `magic.ts`), elementi, pannelli, passi del banco; nel codice, nel seme `universe/`, nei programmi `models/`, in `MockAiModels` e nei test. Contratto `0.2.0` (ADR-0136), migrazione `0.1 → 0.2` in `MIGRATIONS` con la riscrittura del Lua (la scrive questo task, gli altri la estendono); un universo salvato si apre tradotto, deterministico, con un test su `valmora` o sugli universi del 20/10 e sui quattro di `lab/banco/universi-cloud/` (`npm run universi:cloud` installa la versione migrata). Il validatore per una versione accetta il valore italiano e lo riporta all'inglese (riparazione, come `repairGameSetup`). Le regex che leggono testo generato restano (T310).
- Test: unitari della migrazione, suite intera e typecheck con i loro turni; 400 tick offline sul seme senza fault.
- Browser: `?skip&offline`, un universo salvato prima si apre migrato senza guasti; una runa latina pronunciata funziona.
- Quando è fatto: commit su `task/T307a`. Sicurezza: nessuna superficie nuova, o le voci.
- Esito: contratto 0.2.0: i 15 domini T307a in inglese (rune in latino) nel codice, nel seme, nei modelli, in MockAiModels, in lab/ e nei test; migrazione 0.1→0.2 (ADR-0154) con piani migrati alla lettura, Lua solo dei moduli del Concilio, seed.json che segue, prepareUniverse in ogni caricamento e Kernel.boot che committa subito; il validatore ripara l'italiano finché T310 non cambia i prompt (schemi del Concilio ancora italiani); i quattro universi del laboratorio restano 0.1 sul disco e si leggono/installano migrati (seme-0.1.json); typecheck e suite verdi (2449). Restano: parole dell'interfaccia ancora dal valore di prima (T239); gli strumenti di lab che generano i quattro universi ora scrivono 0.2. Sicurezza: nessuna superficie nuova (files.ts: gli effetti escono come `type`).

### T314 · Integrare T307a nel base, che ha T299 — `fatto` (`734aaa7d`)
- Step: 42

Nasce da T307a e T299: `dossier T307a`, `dossier T299`. `integra T307a` si è fermato su conflitti in `package-lock.json`, `package.json`, `src/kernel/version.ts`, `universe/universe.json`: T307a è partito prima che T299 (kernel 0.1.13, ADR-0154, la via col raggio) entrasse nel base.

**Cosa fare:** nel worktree, `git merge task/T307a` sul base di adesso. La versione è `0.2.0` (contratto nuovo di T307a), uguale in `version.ts`, `package.json` e `package-lock.json`; in `universe.json` tieni il contratto 0.2 e ciò che T299 ha aggiunto. Entrambi gli ADR si chiamano 0154: quello di T307a prende il primo numero libero, con i rimandi in AGENTS.md, `docs/architettura-dettagli.md`, `docs/lingua-interna.md` e nel codice. Poi applica ai nomi che T299 ha portato (`world.path` col raggio, `fallito:nessuna via`, `no_way`, `tests/dislivello.test.ts`, il prompt dell'Ingegnere) le voci dei domini di T307a in `src/kernel/internalNames.ts`, così che nessun valore italiano di quei domini resti nel codice nuovo; se un nome di T299 appartiene a quei domini e non ha una voce, aggiungila.

**Quando è fatto:** merge committato, `npm test` e `npm run typecheck` verdi, `tests/dislivello.test.ts` verde sul contratto 0.2, un solo ADR per numero; esito con le voci aggiunte a `internalNames.ts`.
- Pipeline: claude · sforzo high · stima 2% · approvato · priorità 1
- Esito: merge di T307a sul base con T299 committato (`734aaa7d`), kernel 0.2.0 uguale in `version.ts`, `package.json`, `package-lock.json` e `universe.json` (`kernels.from 0.2`); ADR-0154 resta la via di T299 e ADR-0155 la migrazione di T307a, con i rimandi già allineati; nessuna voce aggiunta a `internalNames.ts`, perché l'unico valore di un dominio T307a nel codice di T299 era la classe `grande` → `structure` in `tests/dislivello.test.ts`; gli esiti `fallito:…` di `sys.lavoro` (`nessuna via`, `non ci arriva`, `comportamento sconosciuto`) e `continua` non hanno voce in nessun dominio, da dare a T307b; typecheck verde, suite 2455 passati e 1 saltato, `tests/dislivello.test.ts` verde sul contratto 0.2; non provato: browser e build (il task non li chiede); sicurezza: nessuna superficie nuova.

### T307b · L'inglese come lingua interna: i valori della società e del Concilio (contratto 0.3) — `fatto` (`43ca9c35`) (dipende da T314, T317)
- Pipeline: claude · sforzo extra · stima 4% · approvato · priorità 3
- Step: 42
- Contesto: il secondo passo di T306 (`dossier T306`, `dossier T307a`, `docs/lingua-interna.md`, punto 2). **Va lanciato da solo**, come T307a.
- Cosa fare: i domini marcati T307b (0.3): momenti, «dove», attività, specie, legami, mestieri e moduli del seme, comportamenti, imprese, trame, suoni, parti, agenti (e i file dei loro prompt, `prompts/agents/<agente>.md`), classi dello Scultore, coefficienti, carte e grafo, modalità, valori del solo TypeScript; i moduli `lavoro.*` → `job.*`, `sys.lavoro` → `sys.work` (anche gli esiti del suo Lua), i modelli `corona-gerboa-<agente>` e `suono-*` del seme. Contratto `0.3.0`, migrazione `0.2 → 0.3` che estende quella di T307a; stessa riparazione nel validatore e stesse prove sugli universi salvati.
- Da T314 (`traccia T314`): gli esiti `fallito:nessuna via`, `fallito:non ci arriva`, `fallito:comportamento sconosciuto` e `continua` di `sys.lavoro` (T299, ADR-0154) non hanno voce in nessun dominio di `internalNames.ts`: aggiungili qui, con la migrazione. Il kernel ora è 0.2.0 (T307a integrato).
- Test: unitari della migrazione, suite intera e typecheck con i loro turni; 400 tick offline sul seme senza fault.
- Browser: `?skip&offline`, un universo salvato prima si apre migrato; gli individui fanno le loro routine e i mestieri; nello studio i gerboa delle squadre ci sono.
- Quando è fatto: commit su `task/T307b`. Sicurezza: nessuna superficie nuova, o le voci.
- Esito: contratto 0.3.0: i domini T307b in inglese nel codice, nel seme, nei modelli, in MockAiModels, in lab/ e nei test; file rinominati con ciò che nominano (sys.work, job.*, obj.bed|chest|counter|cupboard, item.scissors, prompts/agents/<agent>.md, sound-*, corona-gerboa-<agent>); migrazione 0.2→0.3 (ADR-0157) con piani, Lua del Concilio, seed.json, magazzino, carte, grafo e mancanze; domini nuovi esiti-lavoro (gli esiti di sys.work, da T314), suoni-seme e viandante-solo (io→me spostato a T308a); riparazione dell'italiano in ogni lettura finché T310 non cambia i prompt; il server legge anche `multigiocatore`; MockAiModels tiene i mondi offline di prima; nel test del letto di kernel-council il letto è spostato fuori dalla linea di cammino. Non coperti: i moduli del Concilio con nomi propri (`lavoro.portuale`) tengono l'id, un sys.lavoro modificato nell'universo è rinominato ma non tradotto; restano italiani le stanze dello studio e gli archi del grafo; il difetto di sys.wander contro un ostacolo allineato non è corretto. Typecheck e suite verdi (2497 passati, 1 saltato). Sicurezza: nessuna superficie nuova (access/wallet leggono anche `multigiocatore`).

### T308a · L'inglese come lingua interna: i campi e i percorsi dei file dell'universo (contratto 0.4) — `fatto` (`9a53f8fe`) (dipende da T307b)
- Pipeline: claude · sforzo extra · stima 3% · approvato · priorità 3
- Step: 42
- Contesto: il terzo passo di T306 (`dossier T306`, `docs/lingua-interna.md`, punto 3). ADR-0117: ciò che è su disco si rinomina solo con una migrazione: è questa. **Va lanciato da solo**, come T307a.
- Cosa fare: i nomi di campo di ogni file dell'universo e i percorsi (`world/giocatori/` → `world/players/`…) della tabella (T308a, 0.4); `paths.ts` (`allowedPath`, `councilMayWrite`), `files.ts` (`playerFiles`, `publicFiles`, `UNIVERSE_FIELDS`, regola 8f), le letture di sito e server; le cartelle del server fuori dagli universi (`.saldi` → `.balances`…) con la lettura del nome vecchio finché c'è; `quine:fila:` in `localStorage` (T265) letta anche col nome vecchio. Contratto `0.4.0`, migrazione `0.3 → 0.4`; `AGENTS.md` e `docs/architettura-dettagli.md` coi nomi nuovi.
- Test: migrazione di un universo salvato (anche nato in multigiocatore, se c'è una fixture), la suite di sicurezza (`files.ts`, `paths.ts`), suite intera e typecheck con i loro turni.
- Browser: singola, un universo salvato prima si apre e si salva coi nomi nuovi.
- Quando è fatto: commit su `task/T308a`. Sicurezza: le voci o «nessuna superficie nuova» (tocca `server/`, `src/session/`).
- Esito: contratto 0.4.0, migrazione 0.3→0.4 (ADR-0159): i campi dei file dell'universo per forma (FIELD_SHAPES, internalFields), i timbri carta→card ovunque, io→me (anche world/players/me.json, mai i crediti), i percorsi del mondo in inglese, soil="E" (il parser legge anche suolo); ogni lettura accetta anche i campi di prima (gli schemi del Concilio restano italiani fino a T310) e il server porta in memoria ciò che legge dal disco (portedFiles, pathsBefore); cartelle del server in server/folders.ts con lo spostamento della vecchia, archivio dei saldi di prima letto con io→me, fila del browser in quine:owed: (quella di prima presa e portata); sys.work e il passo dell'impresa con i campi di 0.4 (tile:/entity:); seme portato; voci aggiunte alla tabella (regole, trame, nome, voci, volte, primo, ultimo, entita; l'azione di un mestiere è action); test nuovo tests/migration-0.4.test.ts; typecheck e suite verdi (2523 passati, 1 saltato). Non coperti: le impronte delle carte cambiano una volta (quote dei cloni fatti prima del 0.4); un sys.work riscritto in un universo legge ancora i campi italiani (si ripara come guasto); restano italiani i campi interni dei saldi, i nodi del grafo, il componente struttura, i messaggi (T308b); gli strumenti di lab che generano gli universi non sono portati; multigiocatore provato solo nei test. Sicurezza: nessuna superficie nuova (files.ts nomina i campi di 0.4, un universo non portato manda meno, mai di più; creditFile riconosce world/players/ e world/giocatori/; le cartelle del server restano fuori dagli universi).

### T308b · L'inglese come lingua interna: il filo e Lua (contratto 0.5) — `fatto` (`50a00c53`) (dipende da T308a)
- Pipeline: claude · sforzo extra · stima 3% · approvato · priorità 3
- Step: 42
- Contesto: il quarto passo di T306 (`dossier T306`, `docs/lingua-interna.md`, punto 4). **Va lanciato da solo**, come T307a.
- Cosa fare: i messaggi del protocollo e i loro campi (client e server insieme), i componenti e i loro campi, l'API Lua (`Host`, `prelude.lua`, `LUA_API`, prompt dell'Ingegnere, `AGENTS.md`), gli eventi del bus, come dice la tabella (T308b, 0.5). Contratto `0.5.0`, migrazione `0.4 → 0.5` (il Lua salvato riscritto con la funzione di T307a).
- Test: protocollo, sandbox e la suite di sicurezza, suite intera e typecheck con i loro turni.
- Browser: singola e due schede in multigiocatore (`?viandante=`), un universo salvato prima si apre e gira.
- Quando è fatto: commit su `task/T308b`. Sicurezza: le voci o «nessuna superficie nuova» (tocca `src/session/`, la sandbox).
- Esito: contratto 0.5.0 e migrazione 0.4→0.5 (ADR-0161): protocollo in inglese client e server insieme; componenti e campi per componente (`COMPONENT_FIELDS`; `fino` → `expires`, non `until` che in Lua è riservato); `world.venture`/`venture_bring`, evento `death`, chiave `deposit:`; `luaFor0_5` porta il Lua del Concilio e ripara il codice dell'Ingegnere fino a T310; voci aggiunte alla tabella (compiti, impresa_posto, concetto/classe/taglia, stati velocita/peso/luce, salto da/a/alto, cantiere titolo/stato/manca/squadra, morto, fame/sete); test nuovo `migration-0.5.test.ts`; suite (2533 passati) e typecheck verdi, build ok. Non coperti: `worldwire.ts` e rotte HTTP restano italiani; `sicurezza:prove` non lanciato; conflitti attesi con T319 all'integrazione. Sicurezza: nessuna superficie nuova (cambiano i nomi, non ciò che il server accetta né ciò che esce).

### T309 · L'inglese come lingua interna: i commenti di Lua e degli XML — `fatto` (`b6140aec`) (dipende da T308b, T328)
- Pipeline: claude · sforzo high · stima 4% · approvato · priorità 4
- Step: 42
- Contesto: T306 (`dossier T306`). ≈ 27.000 parole di commenti in `universe/modules/*/logic.lua` e `universe/models/*.xml`, più i programmi ufficiali di `lab/`. Oggi la convenzione li vuole italiani; l'ADR di T306 la cambia.
- Cosa fare: tradurre i commenti in inglese senza toccare una riga di codice né un attributo; un controllo automatico che il codice sia identico togliendo i commenti (Lua: token uguali; XML: albero senza commenti uguale) e che le forme dei modelli restino voxel per voxel uguali (`tests/mj-engine-determinism.test.ts`). Anche i commenti italiani in TypeScript che il censimento trova (≈ 1.000 parole in `src/`). I prompt dello Scultore e dell'Ingegnere che chiedono commenti italiani nel codice generato li cambia T310.
- Test: il controllo di identità, suite intera e typecheck con i loro turni.
- Browser: non serve.
- Quando è fatto: commit su `task/T309`.
- Esito: commenti del Lua e degli XML del seme in inglese (≈ 2.000 commenti, 27.000 parole; anche le copie sotto lab/ tranne lab/banco/universi-cloud, che la migrazione riconosce per impronta), `tools/lingua/` (estrai, applica, confronta <ref>, italiano) e `tests/seed-comments.test.ts`; codice identico in tutti i file cambiati (token Lua, albero XML) e voxel uguali; commenti TS italiani di src/ e site/sessioni.ts tradotti; kernel 0.5.1; suite (2633 passati, 1 saltato) e typecheck verdi. Restano italiani i commenti di tests/, tools/pipeline/ e dei programmi del laboratorio che non sono copie del seme; docs/lingue-censimento.md non rigenerato (cambiata solo la riga della convenzione). Non provati: browser (non serviva).

### T310 · L'inglese come lingua interna: i prompt del Concilio in inglese, il mondo nella lingua del suo universo — `fatto` (`4291afb0`) (dipende da T309)
- Pipeline: claude · sforzo extra · stima 6% · approvato · priorità 4
- Step: 42
- Contesto: D34.4 con la C (05/11): i prompt diventano inglesi (P2 di `docs/lingue.md` §4), il testo del mondo resta nella lingua dell'universo (oggi l'italiano per tutti; la scelta alla Genesi la fa T239 in Fase III). `dossier T306`.
- Cosa fare: `universe/prompts/agents/*.md`, `theme.md`, i frammenti di `src/kernel/agents/*.ts`, `COUNCIL_PRINCIPLES` e `themes.ts` in inglese, più il blocco «Lingua» (il testo del mondo nella lingua dell'universo, `it` se non detto; gli id dello schema in inglese). `META_RE` e `glossaryBreak` sulla lingua del mondo + italiano + inglese (D34.5), con le frasi di prova e venti frasi innocue per lingua. Le regex di `docs/lingue.md` §5 che leggono richieste o risposte: dove c'è uno schema, l'id; dove no, la tabella per lingua. `MockAiModels` riconosce le richieste nuove. Una prova a pagamento piccola (al più ≈ 20 richieste, sotto un dollaro, spesa scritta nell'esito) che il Concilio scriva ancora in italiano e passi il validatore: Genesi offline + qualche luogo con Gemini, profilo browser persistente.
- Test: quarta parete per lingua, mock, suite intera e typecheck con i loro turni.
- Browser: una Genesi con `?offline` e la prova a pagamento sopra.
- Quando è fatto: commit su `task/T310`. Nell'esito quanti testi del Concilio sono usciti in inglese per sbaglio e la differenza di token misurata.
- Esito: prompt del Concilio in inglese (ruoli, tema e ambientazioni, principi, frammenti degli agenti e del kernel), lingua del mondo (`universe.json → language`, it se manca) e blocco «Lingua» di 128 token in ogni richiesta, valori degli schemi interni (riparazione dei valori italiani tenuta un contratto), quarta parete con tabelle it/en e test di frasi di prova e venti innocue per lingua, rilevatore della lingua, kernel 0.5.2, ADR-0164; token: testi fissi −6,9 %, richieste di una Genesi offline −3,3 %; prova a pagamento: ≈ 30 richieste invece delle ≈ 20 previste (luoghi in più aperti dal tappeto), ≈ 0,07 $, 156 testi del mondo, 0 in inglese, nessuno scarto né guasto; suite e typecheck verdi. Spezzato: T310b fa i nomi dei campi degli schemi in inglese, il tipo di legame come id, i valori interni ancora italiani (contratto nuovo) e le espressioni regolari di `lingue.md` §5; fr/es della quarta parete e controllo della lingua nel validatore restano a T239.

### T310b · L'inglese come lingua interna: i nomi dei campi degli schemi, il tipo di legame come id, i valori interni ancora italiani — `da fare` (dipende da T310)
- Pipeline: claude · sforzo extra · stima 6% · priorità 4
- Step: 42
- Contesto: spezzato da T310 (kernel 0.5.2, ADR-0165): i prompt sono inglesi, ma i nomi dei campi degli schemi Gemini, il tipo di legame (testo, non id) e alcuni valori interni restano italiani; serve un contratto nuovo (0.6) con la sua migrazione. Nasce da T310: `dossier T310`, e da T308b: `dossier T308b`. Le regole: `docs/lingua-interna.md`, `src/kernel/internalNames.ts`.
- Cosa fare: i campi degli schemi in inglese (schemi Gemini, `MockAiModels`, chi legge le risposte, con lettura dei campi di prima finché serve); il tipo di legame come id interno inglese, il nome nella lingua del mondo; i valori interni ancora italiani in inglese con la migrazione `0.5 → 0.6` in `migrations.ts` (pura, deterministica, piani idempotenti); le espressioni regolari di `docs/lingue.md` §5. fr/es della quarta parete e il controllo della lingua nel validatore restano a T239.
- Test: migrazione (universo 0.5 → 0.6, idempotente), mock, quarta parete; suite intera e typecheck con i loro turni.
- Browser: una Genesi con `?offline` su un universo nuovo e un universo vecchio migrato che si apre senza guasti.
- Quando è fatto: commit su `task/T310b`. Nell'esito: il contratto nuovo, cosa resta italiano e perché.

### T311 · Integrare T285 sul base con T284 e T286: la sezione delle vesti e il LEGGIMI — `fatto` (`b04e4b6`)
- Pipeline: claude · sforzo high · stima 2% · approvato · priorità 1
- Step: 34
- Contesto: `integra T285` si ferma su `docs/architettura-dettagli.md` e `site/skins/LEGGIMI.md`: T284 (veste futuristica, ADR-0151), T286 (veste sobria, integrata dopo) e T285 (veste fumetto) aggiungono tutti righe nella sezione `#sito` e nel LEGGIMI delle vesti. Nasce da T285: `dossier T285`, da T284: `dossier T284` e da T286: `dossier T286`. Parti dal base attuale (con T286).
- Cosa fare: nel tuo worktree `git merge task/T285`. Nei conflitti tutte le aggiunte restano, nell'ordine delle vesti (anche in `AGENTS.md`); se T285 ha preso un numero di ADR già usato nel base, va al primo libero con i rimandi. Controlla che `tests/site-skin-fumetto.test.ts` , i test della futuristica e `tests/site-skin-sobria.test.ts` passino insieme e che la build porti tutte e tre le vesti in `dist/skins/`.
- Test: suite intera, typecheck e build con i loro turni.
- Browser: non serve, T285 ha già guardato.
- Quando è fatto: commit su `task/T311`. Nell'esito: ricorda di dare `integra T311`, poi `integra T285`.
- Esito: T285 integrato in `task/T311`: nei conflitti di `docs/architettura-dettagli.md` (`#sito`) e `site/skins/LEGGIMI.md` restano tutte le aggiunte, nell'ordine sobria, fumetto, futuristica (la riga delle vesti non chiama più il fumetto «prima stesura»; nel LEGGIMI una frase in più su come si rifanno i disegni del fumetto); `AGENTS.md` senza conflitti e non toccato; nessun ADR da rinumerare. Test delle tre vesti e `site-skins` verdi insieme (70), suite intera (2396, 1 saltato), typecheck e build verdi, e `dist/skins/` ha le tre vesti. Browser non aperto, come chiede il task. Ora `integra T311`, poi `integra T285`.

### T312 · Il Concilio non scrive su un universo fuori dall'intervallo dei kernel — `fatto` (`4104fee2`)
- Pipeline: claude · sforzo high · stima 3% · approvato · priorità 3
- Step: 32
- Contesto: T302 (ADR-0152) apre un universo fuori dall'intervallo `kernels` con il guasto `universe:kernel` e rifiuta il salvataggio dello stato, ma nella verifica nel browser il Concilio ha committato 5 contenuti sulla copia `vecchio` (kernel 0.0.4): un difetto che c'era già prima. Nasce da T302: `dossier T302`, e da ADR-0136.
- Cosa fare: con il guasto `universe:kernel` aperto nessun commit dell'universo (contenuti del Concilio, moduli, modelli, brani, mappe, piani, rami, pubblicazioni) arriva al repository; il mondo resta giocabile in sola lettura e il pannello dell'anomalia lo dice. Trova il punto unico (`Repo`, `UniverseClient`, `commitContent` o dove passa ogni scrittura) invece di un controllo per agente; meglio ancora: con il guasto aperto il Concilio non chiama nemmeno i modelli (niente spesa per contenuti che non si salvano). Versione del kernel come dice ADR-0136; una riga in `docs/architettura-dettagli.md` dove T302 ha descritto l'intervallo.
- Test: unitari (universo fuori intervallo: nessun commit, nessuna chiamata ai modelli; universo buono: come prima); suite intera e typecheck con i loro turni.
- Browser: la copia `vecchio` di T302 (fatta a mano in una cartella temporanea): entrando e camminando qualche minuto offline, `git log` dell'universo non si muove; `sidera` scrive come prima.
- Quando è fatto: commit su `task/T312`. Nell'esito: dove sta il blocco e cosa resta scrivibile (se qualcosa).
- Esito: Il blocco è in un punto solo, `Kernel.readOnly()` (il guasto `universe:kernel`, mai per uno specchio), che regola `Repo.readOnly` (nessun commit; il backend avvolto da `attach` non scrive commit, rami, merge né ritorni), `SealedChunks` (piani nuovi solo in memoria) e `Council.write` (ogni compito ai modelli locali, niente spesa); il pannello dell'anomalia dice «sola lettura» in testa; `/api/viandante` a mondo spento risponde 409; `runsOnThisKernel` in version.ts; ADR-0155, kernel 0.1.14; restano scrivibili il cestino, il clone, i saldi, le scritture in fila da una pagina precedente e i piani legacy da IndexedDB; ciò che si accumula in sessione si perde alla ricarica, o va nel primo commit se il guasto si chiude; suite 2440 passati e 1 saltato, typecheck e build verdi; sicurezza: nessuna superficie nuova (una rotta risponde 409 in un caso in più).

### T313 · Jev sul banco: decisioni chiuse del gioco e giudizi sulla scultura, contro Flash-Lite — `fatto` (`23b8045d`)
- Pipeline: claude · sforzo max · stima 6% · approvato · priorità 1
- Step: 30
- Contesto: l'autore (06/11, D44 A) propone Jev di TypeSafe AI (https://typesafe.ai/blog/jev-1-14, docs su docs.typesafe.ai; anche dal Vercel AI Gateway): un modello che non genera ma sceglie (stato + domande tipizzate → scelte, punteggi, probabilità booleane), 0,042 $ per milione di token in ingresso, contesto di produzione 32k, affidabilità che cala col contesto lungo, immagini e contesto lungo solo come funzioni sperimentali (`TypeSafe-Danger-Zone-*`), da non usare. Modello: `jev-1.13.0` (produzione), e `jev-preview` (1.14) per confronto. La chiave è `TYPESAFE_KEY` nel `.env` del base (5 € di crediti caricati dall'autore): mai stamparla, registrarla né metterla in `lab/`, `dist/` o in un commit. C'è anche un plugin di TypeSafe per Claude: usalo solo se serve a leggere la documentazione, le misure passano da uno script.
- Cosa fare: uno script Node in `lab/scripts/` (fuori da `src/`, niente browser, la chiave letta dal `.env` solo lì) e una cartella `lab/banco/jev/` con casi registrati e risposte giuste. Tre gruppi:
  1. **Decisioni del gioco:** effetto di un'azione libera tra l'insieme chiuso degli effetti; squadra del Referente per una richiesta; oggetto citato → modello già in `models/index.json` o «nuovo»; ricetta/combinazione → oggetto esistente o nessuno; un sì/no della quarta parete (casi da `fourthwall.ts` e dai ritiri noti).
  2. **Scultura:** rubriche su fette in testo della griglia finita (per parte, per simbolo o colore, per strato, ridotta di risoluzione; Enorme e Gargantuesca a pezzi), e sui frame intermedi la scelta del nodo del programma che rovina la forma (con `src/mj/trace.ts`). Risposte giuste dai giudizi dell'Artista già registrati (`lab/banco/finale/giudizio.md` e il resto del banco).
  3. **Dove risparmiare (autore, 06/11: ragionaci tu, a sforzo max).** Prima di misurare, censisci in `CENSUS` (`src/kernel/coefficients.ts`) i compiti che oggi chiamano un modello che genera ma in fondo **scelgono** tra opzioni note (es. `action.judge`, `craft.judge`, `craft.free` quando l'esito è un oggetto esistente, `referente.coordinate`, `review.fourthwall`, `model.judge`), e quelli che il kernel oggi decide con regole fisse ma che starebbero meglio con un giudizio economico. In particolare: **le scelte delle azioni degli individui** (routine, mete, mestieri di `sys.lavoro`, ADR-0140) e **il cantiere delle imprese** (ADR-0147: chi porta cosa, il passo successivo, la squadra; oggi regole senza chiamate): se Jev è davvero tanto economico, proponi quali di queste scelte delegargli, con casi registrati presi da un universo vero (stato del luogo + opzioni → scelta) e la misura di quante decisioni al minuto di gioco servirebbero e quanto costerebbero. Per ognuna: cosa si guadagna in vita del mondo, cosa costa per ora di gioco con N individui, cosa fa il kernel se la risposta manca o è fuori dalle scelte (deve restare il pavimento: la regola di oggi come ripiego), e se la scelta va in `MockAiModels`. Valuta anche come tagliare i token: domande raggruppate (più individui in una chiamata), stato compresso, cache delle risposte per stati uguali, soglia di probabilità sotto cui si usa la regola. Il risultato è una tabella «compito → oggi, con Jev, risparmio stimato, rischio» nell'esito, con le misure vere dove le hai fatte (stessi tetti di spesa).
  Per ogni caso: precisione, token, costo, latenza, contro Gemini 3.1 Flash-Lite (la via esistente dei `lab/scripts`) con le stesse domande. **Traccia tutto:** ogni chiamata (modello, caso, token in/out, costo, ms, esito) in `lab/banco/jev/consumi.jsonl`. Tetti: TypeSafe al più 3 $ in tutto, Gemini al più 1 $; **se il primo giro non basta a una conclusione, si sale fino a 5 $ per TypeSafe e 5 $ per Gemini** (autore, 06/11 notte). **Sii intraprendente** (autore): se i casi e i test previsti non bastano a capire, aggiungine altri; l'autore si aspetta un risparmio grande (Jev è usato per giochi e bot in tempo reale), ma la conclusione la danno le misure. Domande corte (stato del luogo e scelte, non la bibbia).
- Test: lo script ha una modalità offline con risposte finte e un test che la prova; suite intera e typecheck con i loro turni. Niente cambia in `src/`.
- Quando è fatto: commit su `task/T313`. Nell'esito: tabella per gruppo (precisione Jev / Flash-Lite, costo per 1000 decisioni, latenza), dove conviene e dove no, consumo totale, la tabella del gruppo 3 e la proposta (con ADR solo se si propone di portarlo nel gioco: un varco sul server come `GeminiGate`, regola 9, e una risposta in `MockAiModels`). Sicurezza: una chiave nuova, solo in `lab/`, detta nell'esito.
- Esito: banco di Jev in `lab/banco/jev/` + `lab/scripts/jev-banco.ts` (411 casi registrati, stesse domande a jev-1.13.0, jev-1.14.0 e gemini-3.1-flash-lite, prompt del gioco su metà delle decisioni, modelli locali, `consumi.jsonl`, modalità offline con test in `lab/tests/jev-banco.test.ts`), spesi TypeSafe 0,196 $ e Gemini 0,680 $; Jev 6–12× più economico e 5× più veloce di Flash-Lite, al suo livello su azioni, Referente, quarta parete con domande atomiche, mestieri e bivi, migliore sul nodo colpevole (69 %, top-3 100 %, contro 31 %), peggiore sulle combinazioni, nessuno dei due vale sulle rubriche in testo; ADR-0157 proposto (varco `TypeSafeGate`, regola di oggi come pavimento e risposta di `MockAiModels`) con 3 domande per l'autore; non provati: domande in italiano, testi del viandante scritti per ingannare il giudice, difetti veri (non sabotaggi) dei programmi; le risposte giuste scritte a mano vanno rilette dall'autore; sicurezza: chiave nuova `TYPESAFE_KEY` solo in `lab/`, nessuna superficie nuova nel gioco.

### T315 · La veste futuristica mista: il palco 3D e il labirinto MarkovJunior 2D insieme — `fatto` (`5d913635`)
- Pipeline: claude · sforzo max · stima 4% · approvato · browser · priorità 4
- Step: 34
- Contesto: l'autore (06/11, D42) ha visto la variante `?fx=mj-pagina` di T284 (ADR-0151): gli piace anche il labirinto MarkovJunior 2D di lettere, e chiede un mix delle due cose nella veste futuristica, con lo showcase 3D che resta. Nel labirinto vuole i colori invertiti: le pareti tenui, i percorsi liberi accesi («visivamente ha più senso»). Misure di T284 (CPU 4×): veste col palco 39,6 % del thread principale, `mj-pagina` 18,3 % con three.js caricato, 9,8 % senza.
- Cosa fare:
  1. Nella veste futuristica (non una variante in URL): il palco 3D resta nella sua sezione, e il labirinto MarkovJunior 2D entra in un'altra parte della pagina (proponi tu dove, coi numeri: ad esempio una sezione propria o lo sfondo dell'hero prima che il palco arrivi), con gli effetti MarkovJunior lungo la pagina dove reggono.
  2. Labirinto con i colori invertiti: pareti tenui, percorsi liberi accesi; i testi sopra restano leggibili.
  3. three.js caricato solo quando il palco sta per vedersi, e fermo quando esce dallo schermo; intervento sui picchi da 11-15 ms a 4× trovati da T284.
  4. Misura con `tools/vesti/misura.mjs` come in T284 (1920 e 390 px, CPU 4×): il mix non deve costare più della veste di oggi (39,6 %); se costa di più dillo coi numeri e proponi cosa togliere. A scheda nascosta e con `prefers-reduced-motion` tutto fermo.
  5. `?fx=mj-pagina` resta solo se serve ancora al confronto; ADR-0151 aggiornato (o un ADR nuovo) e `#sito`.
- Test: typecheck, build e suite intera con i loro turni; i test della veste (`tests/site-skin-futuristica.test.ts`) verdi.
- Browser: sì, a 1920 e 390 px, catture nel commit.
- Quando è fatto: commit su `task/T315`; la veste futuristica ha palco e labirinto insieme, misure nell'esito. T287 lo aspetta per la scelta. Sicurezza: nessuna superficie nuova.
- Esito: veste futuristica mista: palco 3D nella sua sezione e labirinto MarkovJunior 2D in una sezione sua sotto l'hero (banda larga quanto la pagina; scartati lo sfondo dell'hero, che confonde la scritta e costa in cima, e il posto del palco, che non si vedrebbe), colori invertiti (pareti di lettere tenui al 17 %, percorsi liberi in bande di luce ciano con le lettere incise, Q rosa, via più lunga gialla, testi sul loro fondo scuro); luci MarkovJunior su scritta e strisce col passo persistente nuovo del motore (`Stepper`: `advance` = `runOn` a pezzi, `tick` con le corrispondenze tenute; run/runOn invariati, determinismo del motore verde) e nodo `path` senza un array per cella (stessa griglia: soluzione del labirinto 9 → 2,6 ms); effetti a 4 ms per fotogramma, pittura dei blocchi 2,7× più svelta; palco: three.js quando sta per vedersi, fermo fuori schermo/a scheda nascosta/con riduci movimento, programmi in un worker (il pino, 0,8–0,9 s a 4×, fuori dal thread), solo le istanze disegnate verso la GPU; misure a 4× (misura.mjs aggiornato: telefono, posizioni, 24 s): 1920 cima/insieme/sotto 25,5/28,4/12,8 % contro 33,0/33,7/13,8 % della veste di prima (T284: 39,6 % in cima), 390 6,1/23,9/7,3 % contro 13,7/31,4/13,9, fotogramma più lungo 13,4 ms contro 765–901 ms, ferma 0,4–0,5 %; luci semplici (`?fx=semplice`, solo confronto) 0,8–2,7 punti in meno; `?fx=mj` e `?fx=mj-pagina` tolte; JS +10,6 KB sobria, +21,4 KB futuristica compressi; ADR-0164, ADR-0151 aggiornato, #sito con la tabella, #markovjunior-modelli, glossario, AGENTS.md, LEGGIMI; test nuovi mj-stepper, mj-path e labirinto; typecheck, build e suite intera verdi (2660 passati, 1 saltato; alla prima suite `tests/determinism.test.ts` è fallito una volta, difetto noto di T43a: da solo 3/3, seconda suite verde); non provati: telefono vero, browser diversi da Chrome, macchina lenta vera; sicurezza: nessuna superficie nuova (worker dello stesso sito, `worker-src 'self'`).

### T316 · Il glitch dei guasti senza flash: niente lampi bianchi, glifi e scossa più lenti — `fatto` (`64c102b3`)
- Pipeline: claude · sforzo high · stima 2% · approvato · browser · priorità 2
- Step: 34
- Contesto: l'autore (06/11) segnala che l'effetto quando il mondo ha guasti aperti (il riquadro «⚠ N anomalie nella simulazione» di `src/ui/hud.ts`) è esagerato e può essere pericoloso per chi soffre di epilessia fotosensibile: lampi improvvisi e frequenti di luce bianca, glifi che appaiono e spariscono di continuo, scossa orizzontale veloce. Il codice: `applyGlitch` in `src/render/glitch.ts` (la «Rare inversion flash» a pieno schermo con `difference` e bianco, gli strappi orizzontali con `Math.random()` a ogni frame, i blocchi di rumore), i glifi in `src/render/overlay.ts` (righe ~190 e ~198: `randomGlyph` a ogni frame), il livello in `src/render/renderer.ts` (`glitchLevel`, `crack`).
- Cosa fare:
  1. Togli il lampo d'inversione a pieno schermo e ogni altro cambio di luminosità ampio e improvviso: nessuna zona grande dello schermo cambia luminosità più di 3 volte al secondo (soglia WCAG 2.3.1).
  2. Glifi: cambiano a ritmo lento e regolare (indicativo: qualche volta al secondo, non a ogni frame), con meno apparizioni e sparizioni.
  3. Scossa orizzontale e blocchi di rumore: più lenti e meno ampi (gli strappi restano qualche frame invece di ricambiare a ogni frame); l'effetto si deve ancora riconoscere come «il mondo si è rotto» (regola 3 di AGENTS.md: il guasto si mostra).
  4. Con `prefers-reduced-motion` il glitch resta solo statico (scanline e tinta, niente movimento). Anche la «crepa» rara del mondo sano segue le stesse regole.
  5. Numeri nell'esito: lampi/secondo e cambi dei glifi/secondo prima e dopo.
- Test: un test sulle frequenze (es. con un orologio finto: nessun riempimento bianco a pieno schermo, glifi stabili per almeno N ms); typecheck e suite intera con i loro turni.
- Browser: sì, un mondo con un guasto aperto (anche provocato dalla console), cattura e due righe su come appare.
- Quando è fatto: commit su `task/T316`; nessun flash bianco, glifi e scossa rallentati. Non tocca `src/kernel/` (niente salto di versione). Sicurezza: nessuna superficie nuova.
- Esito: glitch dei guasti senza lampi: tolta l'inversione bianca a pieno schermo (lampi/s da 0,45–1,5 a 0); strappi e blocchi di rumore fermi 0,4 s (da 60 a 2,5 cambi/s), più stretti e meno spostati; glifi che durano 1,6–2,8 s e sfumano (cambi/s da 720–2400 a 2–5,4); il glitch arriva al suo livello in ~1 s e la crepa sale e scende in 0,8 s; con prefers-reduced-motion solo scanline, tinta e immagine sdoppiata, ferme; il riquadro dei guasti respira invece di tremolare; tolto `Overlay.noisy`, inutilizzato; test nuovo `tests/glitch-safe.test.ts`; suite, typecheck e build verdi; il ritmo nel browser non è misurato (la scheda di Claude in Chrome gira a ~1 Hz), le frequenze sono provate dal test; sicurezza: nessuna superficie nuova.

### T317 · Integrare T312 nel base, che ha il contratto 0.2 — `fatto` (`a1ce0172`)
- Step: 32

Nasce da T312: `dossier T312`. `integra T312` si è fermato su conflitti in `AGENTS.md`, `docs/architettura-dettagli.md`, `package-lock.json`, `package.json`, `src/kernel/kernel.ts`, `src/kernel/universes.ts`, `src/kernel/version.ts`, `universe/universe.json`: T312 è partito a 0.1 (kernel 0.1.14) e intanto nel base è entrato T307a (contratto 0.2.0, ADR-0155 la migrazione 0.1→0.2).

**Cosa fare:** nel worktree, `git merge task/T312` sul base di adesso. La versione è `0.2.1` (T312 resta compatibile col contratto 0.2), uguale in `version.ts`, `package.json`, `package-lock.json` e `universe.json`, che tiene `kernels.from 0.2`. Entrambi gli ADR si chiamano 0155: quello di T312 (sola lettura fuori intervallo) prende il primo numero libero, con i rimandi in AGENTS.md, `docs/architettura-dettagli.md` e nel codice. In `kernel.ts` e `universes.ts` tieni sia `Kernel.readOnly()` / `runsOnThisKernel` sia la migrazione all'avvio (`prepareUniverse`, `migrateUniverse`): un universo che si migra a 0.2 **non** è in sola lettura; solo uno fuori intervallo anche dopo le migrazioni lo è. Un test lo dice.

**Quando è fatto:** merge committato, `npm test`, `npm run typecheck` e `npm run build` verdi con i loro turni, un solo ADR per numero; esito con le scelte fatte nei conflitti di `kernel.ts` e `universes.ts`. Non serve il browser (T312 l'ha provato). Sicurezza: nessuna superficie nuova.
- Pipeline: claude · sforzo high · stima 2% · approvato · priorità 2
- Esito: merge di T312 su 0.2 committato (kernel 0.2.1, ADR-0156; ADR-0155 resta la migrazione). kernel.ts: i piani letti passano da `migratePlanRecord` e poi da `SealedChunks`; la migrazione si committa in `Kernel.boot` prima che si colleghi `Repo.readOnly`, e il guasto si decide sul `universe.json` già portato, quindi un universo migrato a 0.2 non è in sola lettura. universes.ts: `runsOnThisKernel` al posto di `ofThisKernel`, con `migrateUniverse` e `prepareUniverse`. In più: `/api/viandante` a mondo spento usa `opensOnThisKernel` (nuovo in migrations.ts), perché la suite intera falliva su V-006 e V-026 con universi 0.1 o senza versione. Test nuovi in tests/kernel-read-only.test.ts (0.1.14 migrato scrive, 0.0.4 in sola lettura, `opensOnThisKernel`); suite 2468 passati e 1 saltato, typecheck e build verdi; non provato nel browser (non richiesto). Sicurezza: nessuna superficie nuova, la rotta rifiuta meno universi, solo quelli che le migrazioni non portano a 0.2.

### T318 · Integrare T307b nel base, che ha T313 — `fatto` (`33ef670c`)
- Pipeline: claude · sforzo high · stima 2% · approvato · priorità 1
- Step: 42

Nasce da T307b: `dossier T307b`. `integra T307b` si è fermato su un conflitto in `AGENTS.md`: intanto nel base è entrato T313 (il banco di Jev, `TYPESAFE_KEY`, ADR-0157 **proposto**), e anche T307b ha scritto un ADR-0157 (la migrazione 0.2→0.3).

**Cosa fare:** nel worktree, `git merge task/T307b` sul base di adesso. In `AGENTS.md` tieni entrambe le aggiunte (il comando di `jev-banco.ts` e `TYPESAFE_KEY` di T313; il contratto 0.3 e la migrazione di T307b). Due ADR 0157: quello di T313 resta 0157, quello di T307b prende il primo numero libero, con i rimandi in `AGENTS.md`, `docs/architettura-dettagli.md`, `docs/lingua-interna.md`, `docs/adr/README.md` e nel codice (`migrations.ts`, test). Se `lab/scripts/jev-banco.ts` o `lab/banco/jev/` usano nomi che T307b ha rinominato (prompt `prompts/agents/<agent>.md`, `sys.work`, `job.*`), portali ai nomi nuovi.

**Quando è fatto:** merge committato, `npm test`, `npm run typecheck` e `npm run build` verdi con i loro turni, un solo ADR per numero; esito con le scelte fatte nel conflitto. Non serve il browser (T307b l'ha provato). Sicurezza: nessuna superficie nuova.
- Esito: merge di T307b (contratto 0.3.0) nel base con T313; conflitto in AGENTS.md risolto tenendo il comando di jev-banco.ts/TYPESAFE_KEY (T313) e `sound-cellular-fugue` (T307b); ADR-0157 resta Jev, la seconda migrazione è ADR-0158 (rinumerata sul ramo T307b con tutti i rimandi), un ADR per numero; banco di Jev portato al contratto 0.3 (vita.ts: moduli `job.*` più i `lavoro.*` di neapolis tradotti, risposte giuste dei mestieri con gli id inglesi, casi/vita.json rigenerato offline; oggi.ts: agente `arbiter`, turni `player`/`npc`); squadre del Referente e classe `suono` invariate perché ancora italiane nel kernel; storico del banco non toccato; banco non rilanciato su Jev/Gemini. Typecheck, suite (2504 passati, 1 saltato) e build verdi nei loro turni. Sicurezza: nessuna superficie nuova.

### T319 · Integrare T156 nel base, che ha il contratto 0.3 (T307b) — `fatto` (`e5d26a46`) (dipende da T308a)
- Pipeline: claude · sforzo high · stima 3% · approvato · priorità 1
- Step: 32

Nasce da T156: `dossier T156`. `integra T156` si è fermato su conflitti in `AGENTS.md`, `docs/glossario-censimento.md`, `package-lock.json`, `package.json`, `src/kernel/agents/sculptor.ts`, `src/kernel/kernel.ts`, `src/kernel/modeldirector.ts`, `src/kernel/version.ts`, `universe/universe.json`: T156 è nato a 0.2.1, intanto sono entrati T307b e T318 (contratto 0.3.0, nomi inglesi della società e del Concilio, ADR-0158 la migrazione 0.2→0.3).

**Cosa fare:** nel worktree, `git merge task/T156` sul base di adesso. Il kernel sale di `Z` sul contratto del base (0.4.x se T308a è entrato; `version.ts`, `package.json`, `package-lock.json`, `universe.json` uguali). L'ADR di T156 (anche lui 0158) prende il primo numero libero, con i rimandi in `AGENTS.md`, `docs/architettura-dettagli.md`, `docs/adr/README.md` e nel codice. In `sculptor.ts`, `kernel.ts`, `modeldirector.ts` tieni il prompt procedurale, le voci per taglia e `ModelInfo.seeds` di T156 con i nomi inglesi di T307b (classe, campi, agenti): un nome che T156 ha aggiunto in italiano e che T307b ha rinominato prende il nome inglese. Due aggiunte nello stesso punto restano entrambe. Rigenera `docs/glossario-censimento.md` con `tools/glossario/glossario.mjs`.

**Quando è fatto:** merge committato, `npm test`, `npm run typecheck` e `npm run build` verdi con i loro turni, un solo ADR per numero; esito con le scelte fatte nei conflitti. Non serve il browser (T156 l'ha provato). Sicurezza: nessuna superficie nuova.
- Esito: merge di task/T156 sul contratto 0.4: kernel 0.4.1, ADR di T156 rinumerato 0160 (un solo ADR per numero); prompt procedurale, voci per taglia e `ModelInfo.seeds` con i nomi inglesi di T307b/T308a (campi `class`/`size`/`name`/`cellar`/`time`, agenti `sculptor`/`artist`, `plan.structures`/`concept`, `prompts/agents/sculptor.md`, `soil="E"` nel prompt, nello scheletro e nel test); `modelTime` e `modelBox` restano entrambi; censimento del glossario rigenerato; typecheck, suite intera (2529 passati, 1 saltato) e build verdi nei loro turni; non portato `lab/banco/prompt.md` (ancora `suolo`, come gli altri strumenti di lab); sicurezza: nessuna superficie nuova.

### T320 · Lo Scultore: «almeno due piani raggiungibili a piedi» nei controlli del kernel — `fatto` (`2957f4eb`) (dipende da T319)
- Pipeline: gemini · sforzo high · stima 4% · approvato · priorità 3
- Step: 32

Nasce da T156 (`dossier T156`, `docs/pipeline/domande/T156.md`, risposta C scelta dall'orchestratore nell'autonomia del 06/11): i controlli del kernel garantiscono che un programma di struttura finisca e stia in piedi a ogni seme, non che la scala porti al piano di sopra; su Gemini 3.8 Flash è il difetto tipico (4 su 7). Le misure ci sono già in `lab/` (il banco di T182/T156, `lab/banco/gemini/giudizio.md`).

**Cosa fare:** portare nel kernel (in `src/`, non importando da `lab/`) la misura dei piani raggiungibili a piedi da una porta (scale e salti come il gioco li permette) e aggiungerla ai controlli di `checkProgram` per la classe `structure` da Grande in su, su ognuno dei semi provati: sotto i due piani il programma torna allo Scultore col motivo, in testo che il prompt della seconda richiesta già sa leggere. Tenere il costo per seme (misurarlo, l'atteso è qualche decimo di secondo) e non cambiare l'esito delle classi semplici. Kernel `+Z`. Test: un programma con la scala che non porta in alto è rifiutato col motivo, uno buono passa, lo scheletro offline passa.

**Quando è fatto:** test nuovi, `npm test` e `npm run typecheck` verdi nei loro turni; esito con il tempo misurato per seme. Non serve il browser. Sicurezza: nessuna superficie nuova.
- Esito: portata la misura dei piani raggiungibili a piedi nel kernel (src/kernel/forms.ts: reachableStoreys) e aggiunta a checkProgram per structure da Grande in su con motivo di scarto leggibile 'piani: <n> (serve ≥ 2)'; costo medio ~90 ms per seme; kernel 0.4.3, ADR-0162, typecheck e suite intera di test (170/170 file) verdi nei loro turni.

### T321 · Lo Scultore su Gemini 3.8 Flash: il prompt adattato e un giro sul banco — `in attesa` (dipende da T320)
- Pipeline: claude · sforzo high · stima 4% · approvato · priorità 4
- Attesa (07/11, epoca 324): l'autore propone una metodologia nuova per i programmi MarkovJunior degli edifici, «ad alto livello per scomposizione del modello», che scriverà l'08/11; questo task tocca il prompt o la misura dello Scultore e aspetta quel testo (poi si riscrive o si sblocca).
- Step: 32

Nasce da T156 (`dossier T156`, `docs/pipeline/domande/T156.md`, risposta B scelta dall'orchestratore nell'autonomia del 06/11): col prompt procedurale Gemini 3.8 Flash passa 1 su 7 alla prima e 2 su 7 entro due richieste, contro 7 e 10 su 12 di Claude; tre seconde richieste su sei tornano vuote perché ragiona fino al tetto di output.

**Cosa fare:** nel prompt dello Scultore per `structure` da Grande in su, dire di non toccare reticolo e scala (sezioni 1-2 del riferimento) e di cambiare solo colori, tetto e facciate; provare lo sforzo `medium` di Gemini perché la risposta non finisca vuota. Un giro sugli stessi sette bersagli di T156 con `gemini-3.8-flash` via `agy` (circa 5 $), con il controllo di T320 acceso, e il confronto in `lab/banco/gemini/giudizio.md`. Se regge la soglia del banco, resta il modello delle strutture grandi; se no, l'esito lo dice e propone Argon (risposta A) senza lanciarlo.

**Quando è fatto:** prompt cambiato nel gioco con i test verdi (`npm test`, `npm run typecheck`), il giro misurato e scritto; esito con passati alla prima e entro due richieste e il costo. Non serve il browser. Sicurezza: nessuna superficie nuova.

### T322 · Jev: la spesa del banco riconciliata con la dashboard di TypeSafe, i conti rifatti — `fatto` (`df387f6e`)
- Pipeline: gemini · sforzo high · stima 2% · approvato · priorità 2
- Contesto: l'autore (06/11 sera) vede sulla dashboard di TypeSafe **0,16 $ con circa 3 milioni di token in ingresso**; il rapporto di T313 (`lab/banco/jev/README.md`, `riepilogo.md`) dice ovunque **0,196 $ su 4,66 milioni** (2176 chiamate). Il rapporto calcola la spesa da `lab/banco/jev/consumi.jsonl` come token in ingresso × 0,042 $/M; 0,16 $ su 3 M fa ~0,053 $/M, quindi differiscono sia i token sia il prezzo effettivo. Nasce da T313: `dossier T313`.
- Cosa fare: capire da dove nasce la differenza: righe contate due volte (giri ripetuti, tentativi falliti o ripresi, `prova-1`), token stimati da noi invece di quelli che l'API restituisce, il companion Noul o le domande raggruppate fatturate diversamente, token in uscita fatturati, cache dei prompt, arrotondamenti della dashboard, giorno o fuso. Leggi la documentazione dei prezzi di TypeSafe (docs.typesafe.ai) e i campi d'uso delle risposte. Se senza i numeri della dashboard non si chiude, scrivi in `docs/pipeline/domande/T322.md` che cosa esportare (una CSV per chiamata o per giorno) e fermati lì. Poi: il rapporto (`--rapporto`) usa la spesa vera (i campi dell'API, il prezzo documentato), `README.md`, `riepilogo.md` e ADR-0157 con i numeri giusti, compreso «$ per 1000 decisioni» e i rapporti con Flash-Lite. Controlla allo stesso modo la spesa Gemini (0,680 $) contro i prezzi di `src/kernel/ai/prices.ts`.
- Test: `lab/tests/jev-banco.test.ts` aggiornato sul calcolo; suite intera e typecheck con i loro turni. Spesa: al più 0,05 $ TypeSafe solo se serve una chiamata di prova per leggere i campi d'uso.
- Quando è fatto: commit su `task/T322`; nell'esito la causa della differenza, i numeri vecchi e nuovi e quanto cambia il risparmio. Sicurezza: nessuna superficie nuova (solo `lab/`).
- Esito: conti del banco di Jev riconciliati con la dashboard di TypeSafe: i 0,16 $ e ~3 M token corrispondono esattamente al primo giro di benchmark `giro-1` (1568 chiamate, 3,84 M token in ingresso a 0,042 $/M, di cui 2,92 M per la variante `base`), mentre i 0,196 $ su 4,66 M token (2176 chiamate) comprendevano il giro di stabilità `giro-1-ripeti` (596 chiamate, 0,034 $) e le prove; verificata la spesa Gemini (0,662 $ su giro-1, 0,680 $ totale su prices.ts); aggiornati rapporto.ts, riepilogo.md, README.md, ADR-0157 e i test in lab/tests/jev-banco.test.ts; typecheck e suite intera verdi.

### T323 · Jev in italiano: quanto perde con stato e domande nella lingua del mondo, quando tradurre — `fatto` (`6cddf939`)
- Pipeline: gemini · sforzo high · stima 3% · approvato · priorità 2
- Contesto: l'autore (06/11) non capisce dal rapporto di T313 quanto sia un problema l'italiano. T313 ha fatto le domande in inglese e ha lasciato «domande in italiano» tra i casi non provati; nel gioco lo stato (nomi di oggetti, luoghi, testo del viandante, battute degli NPC) è nella lingua dell'universo, mentre i nomi interni sono inglesi (ADR-0153). Nasce da T313: `dossier T313`.
- Cosa fare: sul banco di `lab/banco/jev/`, gli stessi casi del gruppo 1 (azioni, Referente, oggetto → modello, combinazioni, fabbricazione, quarta parete) e dei mestieri in tre varianti: tutto in inglese (quella di T313), stato in italiano con domande e opzioni in inglese (come sarà nel gioco quando i prompt saranno in inglese), tutto in italiano. Jev 1.13 e Flash-Lite. Per ogni compito precisione, token e costo per variante, e la regola che ne esce: cosa si traduce (niente, le sole domande, i nomi degli oggetti, il testo libero del viandante) e quanto costa tradurre (con quale modello o con la tabella dei nomi). Il testo libero del viandante (azioni libere, richieste al Referente, quarta parete) è il caso più delicato: misuralo a parte.
- Test: varianti nuove nella modalità offline e nel test; suite intera e typecheck con i loro turni. Tetti: TypeSafe 0,30 $, Gemini 0,40 $.
- Quando è fatto: commit su `task/T323`; tabella nell'esito e in `README.md`, la raccomandazione in ADR-0157. Sicurezza: nessuna superficie nuova (solo `lab/`).
- Esito: Jev 1.13 e Flash-Lite misurati su 244 casi nelle tre varianti (tutto-inglese 84,5 %, base misto 88,5 %, tutto-italiano 85,4 %); testo libero a 93,6 % in italiano; traduzione con LLM a $1,20-$1,55/1k scartata; raccomandazione registrata in ADR-0157

### T324 · Jev con le immagini: le foto dei modelli giudicate come l'Artista, contro Flash-Lite — `fatto` (`5927bdd2`)
- Pipeline: claude · sforzo extra · stima 4% · approvato · priorità 3
- Contesto: l'autore (06/11) chiede di valutare Jev con le immagini, che T313 non ha provato perché TypeSafe le dà come funzione sperimentale (`TypeSafe-Danger-Zone-*`): qui le si prova sul banco, solo in `lab/`, senza portarle nel gioco. L'Artista oggi giudica le foto dei modelli da quattro lati (`src/mj/photo.ts`, `model.judge`); T313 ha visto che sulle rubriche in testo nessuno dei due modelli funziona. Nasce da T313: `dossier T313`.
- Cosa fare: le foto in 3/4 a cartone (quattro lati, anche un solo lato e una griglia 2×2) dei modelli che hanno un giudizio registrato (`lab/banco/finale/giudizio.md`, `lab/banco/conferma/giudizio.md`, il resto del banco), domande chiuse come le rubriche dell'Artista (si riconosce il concetto? proporzioni, parti mancanti, colori, un voto a soglie, quale di N modelli è migliore) a Jev e a Flash-Lite con le stesse immagini. Misura precisione, token, costo (le immagini come le fattura TypeSafe), latenza e stabilità tra due giri; leggi i limiti della funzione sperimentale nella documentazione. Prova anche le immagini per la quarta parete e per l'oggetto → modello della libreria (la foto al posto del nome).
- Test: modalità offline e test; suite intera e typecheck con i loro turni. Tetti: TypeSafe 0,50 $, Gemini 0,50 $.
- Quando è fatto: commit su `task/T324`; tabella nell'esito e in `README.md`: dove le immagini con Jev valgono la spesa e dove no. Sicurezza: nessuna superficie nuova (solo `lab/`).
- Esito: banco di Jev con le immagini in `lab/` (`foto.ts`, `immagini.ts`, `artista-oggi.ts`, `rapporto-immagini.ts`, 936 casi in `casi-immagini/`, `--prepara immagini`, varianti per forma, `--oggi-artista`, `--tetti-giri`, test `lab/tests/jev-immagini.test.ts`); spesi TypeSafe 0,280 $ e Gemini 0,477 $; tabella «dove vale la spesa» nel README del banco e in `riepilogo-immagini.md`: Jev con le immagini vale come filtro dei difetti visivi evidenti (AUC 0,93–1,00) e per scartare la versione rotta (79 % fra quattro contro 32 %), non per il giudizio dell'Artista né per oggetto → modello con le foto (65–68 % contro 97–100 % coi nomi); corretto `seedLibrary` di T313 (campi del contratto 0.4); non provati: difetti veri del Concilio, soglie su casi nuovi, Flash-Lite con le foto su tutti i casi oggetto → modello (14 su 37), l'Artista del gioco oltre 10 casi; sicurezza: nessuna superficie nuova (solo `lab/`, chiave e pixel mai nel registro, test).

### T325 · Dove Jev ci fa risparmiare ancora: i casi d'uso di TypeSafe sul nostro progetto, con la spesa di oggi misurata — `fatto` (`a20783c4`)
- Pipeline: claude · sforzo max · stima 6% · approvato · priorità 2
- Contesto: l'autore (06/11) ha letto i cookbook di TypeSafe (https://docs.typesafe.ai, anche https://docs.typesafe.ai/cookbooks/sde_cascade) e chiede un'analisi più ampia dei casi d'uso che ci farebbero risparmiare, partendo da tre idee sue: (a) **le guardrail dell'LLM**: un pre-filtro delle richieste al Concilio (testo del viandante, richieste al Referente, azioni libere) prima di Gemini; (b) **`npc.decide` e le risposte degli NPC che riusano le frasi**: la scheda dell'individuo tiene lo storico delle sue battute, e se la circostanza non è cambiata e qualcuno fa la stessa domanda risponde uguale (l'autore chiede quanto sia realizzabile); (c) **la cascata SDE**: Jev con un modello «mini» sceglie il contesto da mandare agli agenti del Concilio, all'Attore, allo Scultore. L'autore ricorda che la documentazione è fatta per essere trovata dagli agenti e che il grafo del mondo (`src/kernel/graph.ts`, `focus`) è già un buon strumento di recupero; vuole sapere **quanto spendiamo oggi negli agenti per preparare il contesto** (le informazioni strutturate che vanno nella richiesta di generazione) e se Jev può tagliarlo. Nasce da T313: `dossier T313`, ADR-0157, D45 (ancora aperta: questo task non la decide, la informa).
- Cosa fare:
  1. **La spesa di oggi:** dai registri dei consumi degli universi veri (`world/usage.json` di valmora, sidera, orichalcum, neapolis e degli altri in `universes/`), da `CENSUS` (`src/kernel/coefficients.ts`) e dai prompt, quanto dei token in ingresso di ogni compito è contesto (bibbia, grafo, lessico, stile, stato, schede) e quanto è la richiesta; quanto costa per ora di gioco, per compito e in totale.
  2. **I casi d'uso:** leggi i cookbook di TypeSafe e per ognuno di' se e dove si applica a noi; per le tre idee dell'autore e per quelle che trovi: come funzionerebbe nel kernel (chi chiama, cosa si chiede, cosa fa il pavimento se Jev manca o non è sicuro), cosa si risparmia con i numeri del punto 1 e del banco, il rischio (qualità, quarta parete, determinismo dei semi, multigiocatore), e una prova sul banco dove costa poco. Per (b): una prova con casi registrati (domande ripetute, parafrasate, con circostanze cambiate o no) in cui Jev sceglie «stessa domanda di una già fatta e stessa circostanza» con una soglia; quanta parte delle battute si riuserebbe in una sessione vera. Per (c): sui compiti più cari del punto 1, Jev sceglie le parti di contesto (voci della bibbia, nodi del grafo, schede) e si confronta la risposta di Gemini con il contesto intero e con quello scelto.
  3. Una tabella «caso d'uso → oggi, con Jev, risparmio stimato per ora di gioco, rischio, prova fatta», in `lab/banco/jev/casi-d-uso.md`, e una proposta d'ordine. Niente in `src/`: i task che portano qualcosa nel gioco li scrive l'orchestratore dopo che l'autore ha deciso (D45).
- Test: le prove nuove nella modalità offline e nel test; suite intera e typecheck con i loro turni. Tetti: TypeSafe 0,50 $, Gemini 0,80 $.
- Quando è fatto: commit su `task/T325`; nell'esito la spesa di oggi per il contesto, la tabella e le domande per l'autore. Sicurezza: nessuna superficie nuova (solo `lab/`).
- Esito: banco dei casi d'uso di TypeSafe in `lab/banco/jev/casi-d-uso/` + `lab/scripts/jev-casi-d-uso.ts` + analisi in `lab/banco/jev/casi-d-uso.md` (test offline `lab/tests/jev-casi-d-uso.test.ts`); spesa di oggi (733 richieste vere ricostruite in 4 universi, token esatti con countTokens, registri degli universi vuoti): ora 1,67/1,42/1,26 $ (senza cache/miste/calda), contesto 0,375/0,219/0,115 $ (22/15/9 %; canone+lessico 3.500-3.900 token per richiesta narrativa; uscita e ragionamento 0,86 $/h; 3.8 Flash senza cache implicita, righe dell'Attore 0,53 $/h di cui 0,33 contesto; la stima della lobby dice 1,04 $); prove: (a) guardie Jev 1.13 59/63 rotte giuste, 0 legittimi fermati, risparmio ~0; (b) battute 21/24 riusi, 0 sbagliati, 0,1-4,8 ¢/h; (c) contesto scelto: su Flash-Lite +8-21 % con la cache calda (no), Attore −38 % a battuta (~0,15 $/h), liste tagliate rompono; tabella: riuso dei modelli 0,20-0,34 $/h, cache esplicita 3.8 Flash (non Jev) ~0,11 $/h (+0,22 con l'Attore), contesto per l'Attore ~0,15, cascata dell'Attore 0,10-0,18 (non provata), Arbitro 0,01-0,02, battute 0,1-4,8 ¢, guardie ~0, contesto su Flash-Lite negativo; ordine proposto: varco → riuso dei modelli → guardie e quarta parete → scelte di T313 → Attore (prima cache esplicita) → battute; domande: l'ordine per D45, guardie ai modelli locali o al Narratore e ordini isolati o fermati, salvare le domande del viandante per il riuso, Attore con Jev o cache esplicita, aggiornare la stima della lobby, rileggere le risposte scritte a mano; spesi TypeSafe 0,039 $ e Gemini 0,317 $; non provati: sessioni vere (frequenze di HOUR), cascata dell'Attore, cache esplicita, durata della cache, jailbreak a più turni; sicurezza: nessuna superficie nuova (solo lab/).

### T326 · L'NPC come oggetto coeso: dove vive oggi il suo comportamento e il confine da dargli — `fatto` (`87255e5c`)
- Pipeline: gemini · sforzo high · stima 3% · approvato · priorità 5
- Step: 39
- Contesto: l'autore (06/11 sera), letto `docs/design/comportamento-npc.md`: il piano va bene, ma teme che porti il codice del comportamento degli NPC sparso su troppi moduli; vuole **basso accoppiamento e alta coesione interna dell'oggetto NPC**. Oggi il comportamento è già in parte implementato (T245a-f, integrati via T280, T297, T300): `src/kernel/society.ts`, `jobs.ts`, `ventures.ts`, `route.ts`, `plots.ts`, parti di `kernel.ts`, il modulo Lua `sys.work` e i `job.<trade>`. Nascono da qui T327 (il rifacimento) e i vincoli su T245g-i. Leggi `dossier T245`, `dossier T280`.
- Cosa fare: **solo documento, nessun codice.** (1) La mappa: ogni funzione, tipo, campo di stato e chiamata che riguarda il comportamento di un NPC (decidere, camminare, lavorare, imprese, routine, ricordi, legami, fuori vista), file per file con i numeri di riga, e chi chiama chi (le dipendenze tra moduli, anche da `kernel.ts`, dal `Host`, dai pannelli, dal Concilio). (2) Le misure: quanti moduli toccano lo stato di un NPC, quante funzioni di `kernel.ts` sono comportamento NPC, i cicli di import. (3) La proposta: un confine unico (per esempio `src/kernel/npc/` con una facciata stretta: cosa entra, cosa esce, chi possiede lo stato dell'NPC), cosa ci va dentro, cosa resta fuori e perché (Lua, Concilio, rendering), le dipendenze ammesse in una direzione sola; come T245g, T245h, T245i ci si appoggiano senza aprire file nuovi fuori dal confine. Scrivila come sezione nuova «10. Coesione: l'NPC come oggetto» in `docs/design/comportamento-npc.md`, con una tabella «com'è → come sarà» che T327 seguirà passo per passo.
- Test: nessuno (solo documentazione); typecheck col suo turno.
- Quando è fatto: commit su `task/T326`; nell'esito le misure e la proposta in cinque righe. Sicurezza: nessuna superficie nuova.
- Esito: aggiunta sezione 10 in docs/design/comportamento-npc.md con mappa completa, misure (24 moduli toccano lo stato, 65 funzioni e 1.470 righe in kernel.ts, ciclo society/wanderers) e proposta del confine unico src/kernel/npc/ con facciata NpcSubsystem e tabella di transizione per T327; typecheck verde nel suo turno; sicurezza: nessuna superficie nuova.

### T327 · L'NPC come oggetto coeso: il comportamento in un modulo solo, dietro una facciata — `fatto` (`3b9d44ab`) (dipende da T326, T308b, T328)
- Pipeline: claude · sforzo extra · stima 6% · approvato · priorità 5
- Step: 39
- Contesto: richiesta dell'autore del 06/11 (vedi T326): basso accoppiamento, alta coesione dell'oggetto NPC. Segue la sezione 10 di `docs/design/comportamento-npc.md` scritta da T326 (`dossier T326`); se la proposta ha un difetto lo correggi nel documento e lo dici nell'esito. Dopo T308b perché il contratto 0.5 tocca il filo e Lua.
- Cosa fare: spostare il comportamento degli NPC dentro il confine deciso, dietro la facciata, **senza cambiare comportamento**: stessi semi, stessi esiti, stessi file su disco e sul filo (nessun contratto nuovo: sale solo `Z`). `kernel.ts` chiama solo la facciata. Un test di architettura che fallisce se un modulo fuori dal confine importa l'interno dell'NPC o se il confine importa ciò che non deve. ADR nuovo e una riga in `AGENTS.md` (Struttura e indice `#societa`), la sezione `#societa` di `docs/architettura-dettagli.md` aggiornata.
- Test: i test di società, mestieri, imprese, fuori vista invariati e verdi; il test di architettura; suite intera e typecheck con i loro turni.
- Browser: una passeggiata in un luogo con individui al lavoro (`#convalida-browser`): camminano, lavorano, il cantiere cresce come prima.
- Quando è fatto: commit su `task/T327`; nell'esito i moduli prima e ora e le righe tolte da `kernel.ts`. Sicurezza: scrivi l'esito.
- Esito: il comportamento degli NPC sta in src/kernel/npc/ dietro la facciata Npc (index.ts) e la porta NpcHost (host.ts), con le parti people/places/trades/worksites/away/speech/stories/talk e i dati society/plots/jobs/ventures/route spostati con la faccia model.ts; prima i 5 moduli in src/kernel/ più 66 metodi e 18 campi in kernel.ts, ora 16 file in npc/ più wandererIds.ts (ciclo society⇄wanderers spezzato); kernel.ts da 9.363 a 7.972 righe (≈1.500 tolte, ≈185 aggiunte: campo npc, porta, 15 deleghe, spawnLot), chiama solo la facciata; tests/npc-architecture.test.ts nuovo; nessun cambio di comportamento, kernel 0.5.3; ADR-0166, AGENTS.md, #societa, §10.5 del documento di T326 con le correzioni alla proposta (due facce, porta larga a elenco, wandererIds al posto di names.ts, orologio e stesura delle strutture restano del kernel), glossario e lingua-interna aggiornati; test esistenti toccati solo in import e accessi allo stato privato; suite intera (2689 passati, 1 saltato), typecheck e build verdi nei turni. Non fatto: corretto il bug trovato (meetings legge activity.tipo invece di kind: chi dorme saluta), rigenerato docs/lingue-censimento.md, sicurezza:prove. Rischio d'integrazione: chi importa src/kernel/society|plots|jobs|ventures|route va portato a npc/. Sicurezza: nessuna superficie nuova.

### T328 · Integrare T308b nel base, che ha T319 e T156 — `fatto` (`e7b00a26`)
- Pipeline: claude · sforzo high · stima 3% · approvato · priorità 1
- Step: 42

Nasce da T308b: `dossier T308b`. `integra T308b` si è fermato su conflitti in `docs/glossario-censimento.md`, `package-lock.json`, `package.json`, `src/kernel/modeldirector.ts`, `src/kernel/version.ts`, `universe/universe.json`: intanto nel base sono entrati T319 e T156 (`7d9ee13`, kernel 0.4.1, ADR-0160, prompt procedurale dello Scultore, `ModelInfo.seeds`, voci per taglia).

**Cosa fare:** nel worktree, `git merge task/T308b` sul base di adesso. Versione: T308b porta il contratto a `0.5.0` (vince, in `version.ts`, `package.json`, `package-lock.json`, `universe/universe.json → kernel`/`kernels`). In `modeldirector.ts` tieni entrambe le modifiche (il prompt procedurale e i semi di T156/T319; i nomi inglesi di T308b), e porta al contratto 0.5 ciò che T319/T156 hanno scritto con i nomi di prima se la tabella di T308b li rinomina. `glossario-censimento.md`: rigeneralo con `node tools/glossario/glossario.mjs`. ADR di T308b: se il numero è preso, il primo libero, con i rimandi. Due aggiunte nello stesso punto restano entrambe.

**Quando è fatto:** merge committato, `npm test`, `npm run typecheck` e `npm run build` verdi con i loro turni; esito con le scelte fatte nel conflitto. Non serve il browser (T308b l'ha provato), salvo che la risoluzione cambi codice oltre l'unione. Sicurezza: nessuna superficie nuova.
- Esito: T308b fuso nel base (con T319, T156, T320, T293): contratto 0.5.0; `modeldirector.ts` unisce `shareWith`/`structureSiblings` con i campi inglesi di `structure`; nei test delle carte fatte a mano il verificatore usa `anonymous`; `architettura-dettagli.md` tiene entrambe le righe; censimento del glossario rigenerato; l'ADR di T308b diventa ADR-0163 con i rimandi. Suite (2607 passati, 1 saltato), typecheck e build verdi nei turni. Non provati: il browser (non serviva) e `sicurezza:prove`. Sicurezza: nessuna superficie nuova.

### T329 · Integrare T324 nel base — `fatto` (`53f819f2`)
- Pipeline: claude · sforzo medium · stima 2% · approvato · priorità 1

Nasce da T324: `dossier T324`. `integra T324` si è fermato su conflitti in `AGENTS.md` e `lab/README.md` (nel frattempo nel base sono entrati T325, T308b e altri).

**Cosa fare:** nel worktree, `git merge task/T324` sul base di adesso. In `AGENTS.md` e `lab/README.md` due aggiunte nello stesso punto restano entrambe (le righe del banco di Jev di T325 e quelle delle immagini di T324). Se T324 ha un ADR il cui numero è preso, il primo libero con i rimandi.

**Quando è fatto:** merge committato, `npm test` e `npm run typecheck` verdi con i loro turni; esito con le scelte fatte nel conflitto. Non serve il browser (solo `lab/` e documenti). Sicurezza: nessuna superficie nuova.
- Esito: merge di `task/T324` nel base (commit 53f819f2); conflitti in AGENTS.md e lab/README.md risolti tenendo le due aggiunte nello stesso punto: la riga di `jev-banco.ts` di T324 (quella di T313 più `--prepara immagini`, `--gruppi immagini`, `--oggi-artista`, `--tetti-giri`) e sotto la riga di `jev-casi-d-uso.ts` di T325, invariata; il resto (banco di Jev con le immagini, `consumi.jsonl`, test) fuso da solo; T324 non ha ADR, niente da rinumerare; `npm test` (173 file, 2636 passati, 1 saltato) e `npm run typecheck` verdi nei loro turni; browser non necessario (solo `lab/` e documenti); sicurezza: nessuna superficie nuova.

### T330 · La GPU dedicata per il renderer — `fatto` (`89dcf5e1`)
- Pipeline: claude · sforzo medium · stima 1% · approvato · priorità 6
- Contesto: l'autore in chat (07/11, epoca 324): «il gioco gira in GPU? si può far girare sulla GPU?». Il disegno è già su WebGL (three.js), ma nessun `THREE.WebGLRenderer` chiede `powerPreference: 'high-performance'` (`src/render/renderer.ts:85`, `src/render/thumbs.ts:58`, e quelli di `lab/` e `site/` se ce ne sono): su un portatile con due GPU il browser può scegliere l'integrata.
- Cosa fare: `powerPreference: 'high-performance'` su ogni `WebGLRenderer` del gioco (renderer, foto dei modelli), del laboratorio e del sito, con un solo punto da cui lo si legge (una costante o un aiuto in `src/render/`). Nel HUD di sviluppo o in console (`window.quine`) la GPU in uso (`WEBGL_debug_renderer_info`, se il browser la dà; altrimenti niente), così l'autore vede se è quella dedicata. Una riga in `docs/architettura-dettagli.md#mondo3d`.
- Test: un test che ogni `new THREE.WebGLRenderer(` di `src/`, `lab/` e `site/` passa dall'aiuto (lettura dei sorgenti); typecheck con il suo turno.
- Browser: build e preview, in console la GPU riportata e nessun errore; screenshot del mondo uguale a prima.
- Quando è fatto: commit su `task/T330`. Nell'esito la GPU vista sulla macchina dell'autore, se il browser la dice. Sicurezza: nessuna superficie nuova (il nome della GPU resta nel client, non va al server).
- Esito: ogni WebGLRenderer di src/, lab/ e site/ passa da `makeRenderer` (`src/render/gpu.ts`, powerPreference 'high-performance'); la GPU in uso è in `window.gpu` e in una riga `[gpu]` in console; test sui sorgenti `tests/gpu.test.ts`, doc in #mondo3d; test, typecheck e build verdi; GPU vista sulla macchina dell'autore: ANGLE (NVIDIA GeForce RTX 2070, D3D11). Sicurezza: nessuna superficie nuova (il nome della GPU resta nel client).

### T331 · Dove va il tempo: la misura di frame e generazione, prima di portare MarkovJunior sulla GPU — `fatto` (`7a5bfda6`)
- Pipeline: claude · sforzo high · stima 4% · approvato · priorità 7
- Contesto: l'autore in chat (07/11, epoca 324), stessa domanda di T330. Sulla CPU restano kernel, Lua (wasmoon), MarkovJunior nei worker (`src/render/forms.ts`), sintesi del suono e acqua (`src/kernel/water.ts`). Portare MarkovJunior su WebGPU è il passo che può rendere di più ma è grande, e il motore deve restare voxel per voxel identico (ADR-0142, `tests/mj-engine-determinism.test.ts`): prima si misura.
- Cosa fare: (1) nel browser, su una preview con un universo carico, il tempo di un frame diviso tra tick del kernel (sistemi Lua, società, acqua), disegno (draw call, triangoli, GPU se `EXT_disjoint_timer_query` c'è) e attesa dei worker; (2) in Node, il tempo dei programmi MarkovJunior del seme per taglia (riusa i banchi esistenti di `lab/scripts/`), con quanto del tempo va in match delle regole, scelta casuale e scrittura; (3) uno studio in `docs/design/gpu.md`: cosa porterebbe WebGPU compute a MarkovJunior (quali nodi si parallelizzano senza cambiare l'ordine delle estrazioni del seme, quali no), all'acqua e al bagliore, con la stima del guadagno dai numeri misurati, il supporto di WebGPU nei browser di oggi e il ripiego senza. Raccomandazione con i task che ne seguono (se conviene), da far approvare all'autore. Niente cambi al motore in questo task.
- Test: gli script di misura girano offline; typecheck con il suo turno.
- Browser: sì, per la parte (1): preview su una porta libera, misure dalla console, tappeto fermo; chiudi la preview alla fine.
- Quando è fatto: commit su `task/T331`. Nell'esito i numeri principali (ms per frame per parte, ms per programma per taglia) e la raccomandazione. Sicurezza: nessuna superficie nuova.
- Esito: aggiunti `lab/scripts/misura-frame.mjs` (il frame nel browser diviso tra tick per parte, disegno per parte, GPU, draw call, worker e blocchi del thread) e `lab/scripts/misura-mj.ts` (i programmi del seme per taglia e classe, il tempo diviso dal profilatore di V8, offline), lo studio `docs/design/gpu.md`, i comandi in AGENTS.md e una riga in #costi; numeri: tick 2,9–4,0 ms (Lua 60 %), disegno sulla CPU 2,3–3,9 ms, GPU 2,2–3,6 ms per frame su RTX 2070, acqua ~0; strutture 84 ms in taglia piccola, 248 in grande, 275–285 in enorme e gargantuesca; nei worker mesh 66 %, garbage collection 13 %, match 14 %, scansioni intere 30 % del programma; gli edifici della corona sono i lavori più lunghi del caricamento (2,3–4,6 s). Raccomandazione: MarkovJunior su WebGPU non ora; proposti 4 task da approvare (mesh senza allocazioni, corona solo quando serve, scatti all'arrivo, rimisurare); non provato: un mondo del Concilio con molte persone, una GPU integrata. Sicurezza: nessuna superficie nuova.

### T332 · Chi dorme non saluta: gli incontri leggono `activity.kind` — `fatto` (`05d0e02f`)
- Pipeline: claude · sforzo medium · stima 1.5% · approvato · priorità 4

- Nasce da T327: `dossier T327` (bug trovato spostando la società in `src/kernel/npc/`).
- **Contesto:** `src/kernel/npc/talk.ts:47` salta gli incontri di chi dorme guardando `activity.tipo`, ma dal contratto 0.5 (ADR-0163) il componente è `activity {kind, still}`: il controllo non scatta mai e chi dorme saluta.
- **Cosa fare:** leggere `kind` (cercare in `src/kernel/` altri accessi a campi di componenti di prima del contratto 0.5, es. `.tipo` sui componenti, e correggerli; non `m.tipo` delle trame se è un campo del Concilio ancora accettato); un test che due individui, uno dei quali dorme, non si incontrano.
- **Quando è fatto:** test nuovo verde, suite e typecheck verdi; kernel sale di Z.
- Dipende da T327.
- Esito: talk.ts:47 legge activity.kind invece di activity.tipo, così chi dorme non saluta più; non ci sono altri accessi a campi di componenti di prima del contratto 0.5 in src/ né nel Lua del seme (i .tipo rimasti sono schemi del Concilio o nodi del grafo, T310b); test nuovo tests/npc-talk.test.ts, rosso prima della correzione e verde dopo; kernel 0.5.4 (version.ts, package.json, package-lock.json, universe/universe.json); suite intera (2691 passati, 1 saltato) e typecheck verdi nei turni; nessuna verifica nel browser (il task non la chiede); sicurezza: nessuna superficie nuova.

### T333 · MarkovJunior: `<in>` e `<out>` come figli delle regole, e un programma che carica un altro file — `fatto` (`4915a5a3`)
- Pipeline: claude · sforzo high · stima 5% · approvato · priorità 2
- Step: 30
- Contesto: l'autore in chat (07/11, epoca 327, testo in `docs/userchats/to-do-2026-11-07.md`, punto 2): i pattern lunghi negli attributi sono difficili da scrivere e sostituire; vuole decomporre le strutture complesse in sottoblocchi in file a parte e ricomporli (con MarkovJunior o con `wfc`, che arriva con un task a parte). Oggi le regole da file (`file`, `fin`, `fout`) non ci sono (`lab/banco/pattern.md` §12).
- Cosa fare: (1) in `src/mj/xml.ts`/`model.ts`/`engine.ts` `<in>` e `<out>` come figli facoltativi di `<rule>`, `<one>`, `<all>`, `<prl>` (e di ogni nodo con `in`/`out`), testo multiriga con gli strati separati come oggi: una seconda forma, facoltativa, accanto agli attributi `in`/`out`, che restano validi e invariati (l'autore, 07/11: si usano gli attributi oppure i figli; per lo stesso lato entrambi = errore chiaro); (2) caricare un file: un nodo (proposta: `<import file="<id>"/>`) che inserisce il programma di un altro modello di `models/` come sottoprogramma, e le regole con `fin`/`fout`/`file` lette da un file di testo del modello (solo testo, regola 11; solo dentro `models/` dell'universo o del laboratorio, nomi semplici, niente percorsi, tetti su profondità e cicli di inclusione); (3) validatore: i file inclusi si validano come il resto, un include mancante è un errore col motivo; la cache delle forme tiene conto dei file inclusi (cambiarne uno invalida chi lo include); (4) editor del laboratorio: evidenziazione e un modello di prova che ne include un altro; (5) il motore resta voxel per voxel identico sui programmi di oggi (`tests/mj-engine-determinism.test.ts`, ADR-0142). ADR, `docs/architettura-dettagli.md#markovjunior-modelli`, glossario.
- Test: figli e attributi danno lo stesso esito voxel per voxel; include, include mancante, ciclo, profondità; cache invalidata.
- Browser: sì, l'editor del laboratorio con un modello che ne include un altro.
- Quando è fatto: commit su `task/T333`; kernel sale di Z (nessun programma esistente cambia). Sicurezza: il caricamento di file è una superficie (percorsi): dillo nell'esito.
- Esito: `<in>`/`<out>` figli delle regole (stessa sintassi degli attributi, invariati; i due insieme sono un errore), regole da file di testo (`fin`/`fout`/`file`, `models/<nome>.txt`), `<import file>` da `models/` per nome semplice, con tetti su profondità, numero e caratteri e i cicli come errore; la cache delle forme conta i file inclusi; il validatore controlla gli include e i `.txt`; editor del laboratorio con evidenziazione e la torre merlata come modello di prova; ADR-0171, kernel 0.5.7; motore invariato. Sicurezza: superficie nuova, il caricamento di file (percorsi): il compilatore non legge il disco, solo nomi semplici dentro `models/`, con i tetti. Non fatto: lo Scultore non conosce ancora `<import>` (T338/T339). Non provato: un include dentro un universo vero nel gioco.

### T334 · MarkovJunior: `field`, `temperature` e `observe` nel motore — `fatto` (`970c085b`)
- Pipeline: claude · sforzo extra · stima 7% · approvato · priorità 3
- Step: 30
- Contesto: l'autore in chat (07/11, punto 1): i casi più belli del repository di MarkovJunior non si riproducono sul banco perché il motore non ha `field`/`temperature` (`Keys`, `SoftPath`, `Division`, `Dwarves`) né `observe` (`StairsPath`, `RegularPath`) (`lab/banco/pattern.md` §12).
- Cosa fare: implementare come nell'originale (riferimento: il sorgente C# di MarkovJunior, `Field.cs`, `Observation.cs`, `Search.cs`) `<field>` (for, from, to, on, recompute, essential, inversed) con `temperature` sui nodi di regole, e `<observe>` (value, from, to) con la propagazione delle osservazioni e la ricerca (`search`, `limit`, `depthCoefficient`) entro tetti di tempo e memoria; deterministici dal seme (ADR-0142: i programmi di oggi voxel per voxel identici); la traccia (`src/mj/trace.ts`) e l'editor del laboratorio li riconoscono; i modelli del repository che li usano portati nel banco (`lab/`) con le foto. Validatore e prompt dello Scultore li apre T336. ADR, dettagli, glossario.
- Test: un caso piccolo per ogni attributo, confronto con l'esito dell'originale dove si può; determinismo; tetti.
- Browser: sì, i modelli portati nel laboratorio 3D.
- Quando è fatto: commit su `task/T334`; kernel sale di Z. Sicurezza: i tetti di tempo e memoria della ricerca nell'esito.
- Esito: field/temperature/observe/search nel motore come l'originale in 3D (`src/mj/infer.ts`, `GuidedRunner` solo per i nodi che inferiscono, ogni altro programma identico voxel per voxel e con gli stessi tempi); confrontati con l'originale in C# compilato in locale (stessi conteggi dove l'esito non dipende dal caso); validatore e carte fatte a mano li rifiutano fino a T336; traccia, editor, 8 modelli del repository nel laboratorio con le foto accanto all'originale; ADR-0171, kernel 0.5.7; test: suite intera con 1 fallimento non legato (`tests/determinism.test.ts`, tick che dipendono dall'orologio sotto carico, da solo 3/3 verde; primo giro verde a parte i 3 test di versione poi corretti), typecheck e build verdi; sicurezza: nessuna superficie nuova verso i client, tetti della ricerca 100 000 stati / 64 MB / 4096 figli (deterministici), 10 s o la scadenza della corsa (corsa non finita), 128 MB di potenziali, 32 valori osservati; manca: StairsPath senza il `map` finale a tessere (T333/T335), la ricerca su griglie 3D grandi resta limitata dai tetti.

### T335 · MarkovJunior: `wfc` (a tessere e a sovrapposizione), `convchain` e `map` frazionaria nel motore — `fatto` (`cd675e5b`) (dipende da T333)
- Pipeline: claude · sforzo extra · stima 8% · approvato · priorità 3
- Step: 30
- Contesto: l'autore in chat (07/11, punti 1 e 2): `wfc` a tessere è il cuore di `ModernHouse`, `SeaVilla`, `Apartemazements`, `PillarsOfEternity`, `Partitioning`, `Surface`, `Escher*`; `convchain` di `ChainDungeon` (`lab/banco/pattern.md` §12). L'autore vuole ricomporre con `wfc` i sottoblocchi di T333; `ModernHouse` e `SeaVilla` vogliono anche `map` a scala frazionaria (`1/3`, `5/3`).
- Cosa fare: `<wfc>` come nell'originale (`tileset` a tessere e `sample` a sovrapposizione, `values`, `N`, `periodic`, `shannon`, `tries`, `<rule>` di mappatura, `<tile>`/`<neighbor>`), con le tessere da file di testo del modello grazie al caricamento di T333 (niente immagini né `.vox`: solo testo, regola 11; se serve un formato testuale per le tessere, deciderlo e scriverlo nell'ADR); `<convchain>` (sample, N, temperature, on, black, white); `map` a scala frazionaria; deterministici dal seme, tetti di tempo; traccia ed editor; nel banco i modelli citati sopra, con le foto da quattro lati accanto a quelle dell'originale. ADR, dettagli, glossario.
- Test: tessere piccole con esito noto, contraddizione e nuovo tentativo, determinismo, tetti.
- Browser: sì, i modelli portati nel laboratorio 3D.
- Quando è fatto: commit su `task/T335`; kernel sale di Z. Sicurezza: i tetti nell'esito.
- Esito: `wfc` a tessere (tileset in testo in `models/`, tessere come pattern anche da file) e a sovrapposizione (campione di testo), `convchain`, `map` frazionaria, `folder` e unioni per griglia nel motore (`src/mj/wfc.ts`, ADR-0174, kernel 0.5.10); tessere e vicini identici all'originale in C#, 13 modelli portati con foto in `lab/banco/wfc/`, test in `tests/mj-wfc.test.ts`. Sicurezza: nessuna superficie nuova; tetti `WFC_LIMITS`: 2048 motivi, 1000 tentativi, 4 milioni di vicini, 128 MB di onde, N di convchain ≤ 4, campioni ≤ 16 384 celle; 10 s per `wfc`, oltre i quali la corsa non è finita; `wfc` e `convchain` fuori dal mondo fino a T336. Non fatto/non provato: SeaVilla dopo l'onda diverge a volte dall'originale per i nodi già esistenti (causa non trovata, da indagare a parte); il validatore non riconosce ancora i tileset in `models/` (T336); l'editor è aggiornato ma non l'ho provato nel browser.

### T342 · MarkovJunior: simboli illimitati con `#<numero>`, le cifre da sole non sono più simboli — `da fare` (dipende da T335)
- Pipeline: claude · sforzo extra · stima 6% · approvato · priorità 3
- Step: 30
- Contesto: l'autore in chat (08/11): i simboli (colori) di un programma MarkovJunior oggi sono un carattere solo, lettere e le dieci cifre: troppo pochi per strutture ricche. Propone un suffisso `#` seguito da un numero (`#12`), così i simboli sono illimitati; ogni programma che oggi usa una cifra come simbolo va convertito, e da qui in poi le cifre stanno solo dopo `#`. Nasce dai nodi di T333-T335: `dossier T333`, `dossier T334`, `dossier T335` (`wfc`, `convchain`, `values`, regole da file e tessere testuali usano gli stessi simboli).
- Cosa fare: un simbolo è una lettera o `#` seguito da cifre (avido: `#12A` sono due simboli, `#1#2` due); una cifra senza `#` è un errore del compilatore col motivo. Ovunque si leggono simboli: `values`, `in`/`out` (attributi, figli, file di T333), `union`, `origin`/`soil`, palette e colori dei simboli, `field`/`observe` (T334), `wfc`/`convchain` (T335), `<sound>` (ADR-0123), mesh, foto, traccia, editor e SoundLab. Il motore tiene un tetto sul numero di simboli che regge (dirlo nell'ADR). La conversione: ogni programma del seme (`universe/models/`), del laboratorio (`lab/`, anche i modelli originali portati) e di `universes/` con una migrazione in `src/kernel/migrations.ts` (cambia il senso dei programmi: contratto nuovo, la Y successiva a quella di T310b se intanto è integrato); le carte fatte a mano e quelle portate passano dalla stessa migrazione. Prompt dello Scultore e del Musicista, `MockAiModels`, validatore, `lab/banco/pattern.md`, glossario, ADR, `docs/architettura-dettagli.md#markovjunior-modelli`.
- Test: tokenizzazione (`#` avido, cifra sola rifiutata, `#` senza numero rifiutato); più di 36 simboli in un programma; ogni programma del seme convertito dà la stessa griglia voxel per voxel e lo stesso suono campione per campione (`tests/mj-engine-determinism.test.ts`); la migrazione idempotente su un universo del contratto di prima.
- Browser: sì, il seme nel gioco e un modello convertito nel laboratorio 3D come prima.
- Quando è fatto: commit su `task/T342`; contratto del kernel nuovo. Sicurezza: il tetto dei simboli nell'esito (carte fatte a mano).

### T336 · Lo Scultore e i nodi nuovi: validatore, prompt e banco delle strutture — `da fare` (dipende da T333, T334, T335, T342)
- Pipeline: claude · sforzo high · stima 5% · approvato · priorità 4
- Step: 30
- Contesto: dopo T333-T335 il motore sa i nodi; lo Scultore deve poterli usare e il validatore deve contenerli.
- Cosa fare: il validatore accetta i nodi nuovi con tetti (celle, tentativi, profondità di ricerca, file inclusi); il prompt dello Scultore e `lab/banco/pattern.md` §12 aggiornati (cosa fa ogni nodo, quando usarlo per una struttura); `MockAiModels` con un programma che usa i nodi nuovi; un giro sul banco delle strutture confrontato con quello di T156.
- Browser: sì, le foto del banco.
- Quando è fatto: commit su `task/T336`; kernel sale di Z.

### T337 · Edifici che non sembrano tutti lo stesso: varianza e qualità dallo Scultore, coi nodi originali di MarkovJunior — `da fare` (dipende da T333, T335)
- Pipeline: claude · sforzo max · stima 8% · approvato · priorità 4
- Step: 30
- Contesto: l'autore in chat (07/11, punto 2): nelle ultime prove con l'IA solo palazzine e villette futuristiche sono venute bene; il castello/forte sembra una prigione (resta solo il merlo, la forma originale è persa) e gli edifici sembrano tutti lo stesso. Dall'editor l'autore ottiene molta varianza con un metodo: una traccia a terra della base, marcatori messi a caso e in punti specifici (curve, incroci), muri tirati su dalla base, finestre dai marcatori sui muri; per un forte una cinta muraria esterna, una sala, le segrete, espandendo con `map`. L'IA non può fare tentativi guardando il risultato come lui. Precisazione dell'autore (07/11, epoca 328): il suo metodo è solo un esempio di come lui ci riesce con l'editor grafico, **non** è prescritto e non è detto che vada bene per un'IA generativa; i risultati statici dei modelli erano molto belli, quindi la rappresentazione a cui il modello «mira» è buona: manca il modo di fargli disegnare con regole probabilistiche che «deformano» le strutture. Si vogliono varianza **e** qualità; come arrivarci lo decide chi esegue. L'autore crede che la miglioria più evidente venga già dall'avere tutti i nodi originali di MarkovJunior, `wfc` prima di tutto (T333-T335).
- Cosa fare: (1) capire perché i programmi dello Scultore convergono sullo stesso edificio (prompt procedurale di T319, `lab/banco/pattern.md`, `lab/banco/riferimento/cantiere.xml`): una misura di varianza tra concetti e tra semi (impronta, profilo, rapporto pieni/vuoti) sui programmi del banco di T156 e su quelli fatti a mano dall'autore (`lab/mjx/models/handmade/`); (2) scegliere e provare il metodo per lo Scultore, misurandolo: per primo l'uso dei nodi originali (`wfc` a tessere e a sovrapposizione, `convchain`, `field`, `observe`, `map` frazionaria) con esempi presi dai programmi dell'originale; tra le alternative, sottoblocchi in file a parte ricomposti con `map`, include (T333) o `wfc`, e (solo se le misure lo premiano) il metodo dell'autore traccia → marcatori → muri → aperture; (3) un sostituto del «guardare il risultato»: dopo ogni sottoblocco lo Scultore riceve la traccia in testo (`src/mj/trace.ts`) e le misure (`src/mj/check.ts`) e corregge; (4) un giro sul banco con forte, castello, tempio, palazzina, villetta: foto da quattro lati, misure di varianza prima e dopo, costo per modello. Raccomandazione all'autore su cosa portare nel prompt dello Scultore (domanda in `docs/pipeline/domande/T337.md`).
- Browser: sì, le foto del banco.
- Quando è fatto: commit su `task/T337`, rapporto in `lab/banco/` con le foto e i numeri.

### T338 · Strutture che si adattano alla taglia: ciò che entra, non l'edificio intero rimpicciolito — `da fare` (dipende da T336)
- Pipeline: claude · sforzo high · stima 6% · approvato · priorità 4
- Step: 30
- Contesto: l'autore in chat (07/11, epoca 328, testo in `docs/userchats/to-do-2026-11-07.md`): se l'area è piccola non si forza l'edificio completo del tipo. Un forte piccolo è una torre a base larga, un avanposto fortificato; una fattoria 5x5 è una casa di misura normale con una tettoia e la paglia dietro (oggi passa per valida una fattoria in miniatura: casa e cortile piccolissimi); a 15x15 si aggiungono campi, staccionata, sentiero e, se entra, il fienile; a 50x50 la fattoria completa con gli animali al pascolo. Oggi un programma serve più taglie (ADR-0160, `struttura-<concetto>-<taglia>`).
- Cosa fare: (1) una scala fissa delle parti: le parti abitabili (porta, piano, stanza, tettoia) hanno misure minime in caselle che non si rimpiccioliscono con la taglia, scritte una volta (in `src/mj/classes.ts` o accanto) e lette da validatore, controlli e prompt; (2) per ogni concetto una scala delle composizioni per taglia («cosa entra»): lo Scultore la scrive (o il prompt procedurale la guida) e il programma sceglie le parti dalla misura della griglia, con `observe`/`field` o rami per taglia, non scalando tutto; (3) controlli in `src/mj/check.ts`: una parte abitabile sotto la sua misura minima è un errore col motivo (la fattoria 5x5 di oggi deve essere rifiutata), e la varietà delle parti cresce con la taglia; (4) sul banco forte e fattoria a tre taglie (piccola, media, grande, fin dove arriva il tetto di oggi): foto da quattro lati, cosa contiene ognuna, costo.
- Test: la misura minima delle parti; il caso della fattoria 5x5 rifiutato; lo stesso programma dà composizioni diverse alle tre taglie.
- Browser: sì, le foto del banco.
- Quando è fatto: commit su `task/T338`, rapporto in `lab/banco/` con le foto; kernel sale di Z se cambiano i controlli.

### T341 · Integrare T340 nel base (ADR e kernel presi da T296) — `fatto` (`6909ea52`)
- Pipeline: claude · sforzo high · stima 2% · approvato · priorità 1
- Step: 30
- Contesto: `integra T340` ha trovato un conflitto in `docs/glossario-censimento.md`. Inoltre T296, integrato poco prima (`67bf2669`), ha preso ADR-0172 e kernel 0.5.8, gli stessi numeri scritti da T340 (ADR di T334). Nasce da T340: `dossier T340`, `dossier T296`.
- Cosa fare: nel worktree `git merge task/T340`; `docs/glossario-censimento.md` si rigenera con `node tools/glossario/glossario.mjs` dopo aver unito `docs/glossario.md`; l'ADR di T334 (field/temperature/observe/search) diventa ADR-0173 (il file, i rimandi in AGENTS.md, `docs/architettura-dettagli.md`, ADR README, glossario, codice e test), le carte guaste restano ADR-0172; il kernel sale a 0.5.9 (`version.ts`, `package.json`, `universe/universe.json`, test di versione), con la voce dei due incrementi distinta; test, typecheck e build verdi.
- Test: suite intera (il fallimento noto di `tests/determinism.test.ts` sotto carico si riprova da solo), typecheck, build.
- Browser: no (T340 e T296 già verificati).
- Quando è fatto: commit su `task/T341`; poi l'orchestratore integra T341 e `integra T340` toglie worktree e branch di T340, poi `integra T334`.
- Esito: merge di task/T340 nel base dopo T296: censimento del glossario rigenerato, l'inferenza di MarkovJunior resta ADR-0173 (rinumerata già in T340), le carte guaste ADR-0172 (kernel 0.5.8), il kernel sale a 0.5.9 (version.ts, package.json, package-lock.json, universe.json, ADR-0173 e la sua riga nel README); suite intera, typecheck e build passati; nessuna verifica nel browser (il task non la chiede); sicurezza: nessuna superficie nuova.

### T340 · Integrare T334 nel base (conflitti con T333) — `fatto` (`3031d45f`)
- Pipeline: claude · sforzo high · stima 3% · approvato · priorità 1
- Step: 30
- Contesto: `integra T334` ha trovato conflitti con T333, integrato prima (`10bfb184`): `AGENTS.md`, `lab/banco/pattern.md`, `lab/editor/syntax.ts`, `src/kernel/validator.ts`, `src/mj/model.ts`. Entrambi hanno scritto ADR-0171 e kernel 0.5.7. Nasce da T334: `dossier T334`, `dossier T333`.
- Cosa fare: nel worktree `git merge task/T334`; risolvere tenendo entrambe le aggiunte (i nodi `<in>`/`<out>`, regole da file, `<import>` di T333 e `field`/`temperature`/`observe`/`search` di T334, nel parser, nel validatore, nell'evidenziazione dell'editor, in AGENTS.md e nel banco); l'ADR di T334 diventa ADR-0172 (il file, i rimandi in AGENTS.md, `docs/architettura-dettagli.md`, ADR README, glossario e codice) e il kernel sale a 0.5.8 (`version.ts`, `package.json`, `universe/universe.json` e i test di versione); test, typecheck e build verdi; nel laboratorio una prova veloce che un modello con `<import>` e uno con `observe` girano ancora.
- Test: suite intera (il fallimento noto di `tests/determinism.test.ts` sotto carico si riprova da solo), typecheck, build.
- Browser: sì, breve: editor del laboratorio con la torre merlata (T333) e Keys (T334).
- Quando è fatto: commit su `task/T340`; poi l'orchestratore integra T340 e `integra T334` toglie worktree e branch di T334.
- Esito: merge di T334 su T333 con i conflitti risolti tenendo le due aggiunte (parser, validatore, editor, AGENTS.md, banco); ADR di T334 come ADR-0172; kernel 0.5.8; un test che unisce `<import>`, figli `<in>`/`<out>` e `field`; suite intera verde tranne il noto `tests/determinism.test.ts` (da solo 3/3), typecheck e build verdi; già presente prima del merge e non corretto: l'editor del laboratorio non passa la dimensione della griglia dei modelli ufficiali di MarkovJunior, quindi Keys senza `size` dà «manca la scatola»; sicurezza: nessuna superficie nuova.

### T339 · Modelli grandi a parti coerenti: oltre il tetto di una griglia sola — `da fare` (dipende da T333, T335)
- Pipeline: claude · sforzo max · stima 9% · approvato · priorità 5
- Step: 30
- Contesto: l'autore (07/11, epoca 328): le misure massime dei modelli sono limitate perché MarkovJunior lavora sull'intera griglia; una fattoria 50x50 con pascolo non entra. Una prova passata con due griglie di misure diverse è fallita perché i pezzi da assemblare quasi mai combaciavano. La scomposizione aiuta, ma le parti devono restare compatibili e coerenti: «crearle insieme nella stessa griglia e poi separarle, oppure inventati qualcosa».
- Cosa fare: (1) misurare dove sta il tetto oggi (tempo e memoria per taglia, ADR-0142, `tests/mj-engine-determinism.test.ts`) e la prova di prima (cercarla in git e negli ADR, dire perché non combaciava); (2) proporre e provare almeno due vie, con le misure: (a) un piano grossolano in una griglia piccola (a scala ridotta, ogni cella una zona: casa, campo, recinto, sentiero) e il dettaglio di ogni zona generato dentro la sua casella con i bordi fissati dal piano e dai vicini (vincoli di bordo come `wfc` a tessere, T335), così le parti combaciano per costruzione; (b) una griglia sola generata a pezzi (finestre che scorrono con i bordi già scritti come ingresso), o quella che chi esegue trova migliore; (3) la via scelta nel motore e nella cache delle forme, deterministica dal seme, con un tetto di tempo per pezzo; il risultato è un modello solo per il resto del gioco (impronta, pavimenti, regola 10); (4) sul banco una fattoria 50x50 e un forte grande: foto, controlli sui bordi tra le parti (niente muri spezzati, sentieri continui), tempo, memoria. ADR, `docs/architettura-dettagli.md#markovjunior-modelli`, glossario. Domanda all'autore con la raccomandazione se le vie si equivalgono (`docs/pipeline/domande/T339.md`).
- Test: le parti combaciano ai bordi su più semi; determinismo; il tetto di tempo per pezzo.
- Browser: sì, le foto del banco e un modello grande nel gioco.
- Quando è fatto: commit su `task/T339`; kernel sale di Z (o di Y se cambia il formato dei modelli).
