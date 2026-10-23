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
- Contesto: F7 di [`step9-3d.md`](step9-3d.md) (codice fatto: `settleLots`, `placeInside`, `floorAt`,
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
[`docs/userchats/to-do-2026-10-22.md`](../userchats/to-do-2026-10-22.md) (sezione «Incoerenze personaggi e trame»).

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
[`docs/userchats/to-do-2026-10-22.md`](../userchats/to-do-2026-10-22.md)): la corona più grande, ogni edificio con un esterno e un interno neon-punk propri; dentro e fuori
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
- Esito: [`docs/prompts/gemini-strutture-corona.md`](../prompts/gemini-strutture-corona.md): un prompt comune (niente
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
- Proposta scritta il 23/10/2026: [`corona-proposte.md`](corona-proposte.md) §1 — **il plastico**: un tavolo olografico
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

### T27 · La Sala sistemi, dentro — `da fare` (si comincia da T27a)
- L'autore chiede un aiuto: far apprezzare la complessità del codice con esempi (cosa fa un sistema, casi d'uso).
  **Proposta all'autore** (es. ogni sistema come un «caso» animato: prima, regola, dopo).
- Proposta scritta il 23/10/2026: [`corona-proposte.md`](corona-proposte.md) §2 — **la catena** (ogni sistema una
  stazione nell'ordine del tick, con entità toccate, ms e guasti dal vivo) e **il banco di prova** (una teca 3 × 3 con un
  caso d'uso a ciclo: prima, la regola, dopo). Pezzi: T27a catena, T27b banco con i casi del seme, T27c casi dei sistemi
  forgiati.
- **Domande per l'autore**: il caso con il codice vero (un kernel in miniatura nella teca: proposta) o raccontato? Le
  meccaniche (`mech.*`, oggi nell'Archivio) vanno nella Sala sistemi?
- Deciso (23/10): il caso con il **codice vero** (kernel in miniatura nella teca); le meccaniche `mech.*` vanno nella
  **Sala sistemi** (l'Archivio resta riserva).
- **T27d · le meccaniche nella Sala sistemi** (da T32): `folderOf` in `corona.ts` manda `mech.*` a `sistemi` (oggi
  finiscono in `altro`, l'Archivio); nella catena di T27a una meccanica è una stazione col suo pannello (`manifest.ui`).
  Test: un universo con una meccanica forgiata non ha l'Archivio nello studio.

### T32 · Gli edifici dimenticati: Direzione, Biblioteca, Galleria, Archivio — `fatto` (commit «Corona (T32)»)
- Contesto: nel seme il campus ha 12 edifici (13 con l'Archivio, dove oggi finiscono le meccaniche `mech.*`); le
  specifiche del 22/10 e il prompt di T19 ne coprono 8. Proposte in [`corona-proposte.md`](corona-proposte.md) §3:
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

### T46 · La Direzione, dentro: la sala operativa — `da fare` (si comincia da T46a)
- Contesto: [`corona-proposte.md`](corona-proposte.md) §3.1 (approvata il 23/10). Oggi dentro la Direzione (`universo`,
  squadra dell'Arbitro, oro `ffcf5c`) ci sono solo gli scaffali di `universe.json` e le scrivanie. Gli apparecchi seguono
  le vetrine di T21-T28 (`SHOWCASES`/`GRAPH_AT` in `corona.ts`, `showcaseOf`/`stepShowcase`/`clickStudio` in
  `kernel.ts`, il disegno in `corona3d.ts`, il pannello in `studio.ts`). Guardare non cambia nulla.
- **T46a · il tavolo della situazione**: al centro (5 × 3 caselle, al posto della vetrina) il mondo dall'alto come
  operazioni: il viandante, i luoghi in generazione (pulsano), le trame aperte come segnalini sulla loro regione con la
  tappa, le missioni del diario, i guasti (`faults`) dove sono accaduti, in rosso. Un metodo del kernel (`situation()`)
  che raccoglie tutto dai dati che ci sono già (atlante, `plots.json`, guasti, luoghi in coda); E o clic → pannello con
  le operazioni in corso. Test: con trame, un guasto e un luogo in coda `situation()` li elenca con la regione giusta.
- **T46b · la parete di schermi**: sul davanti, larga quanto la sala, tre campi: a sinistra la **linea del tempo** dei
  commit (`repo.log()`, una pellicola; «<» «>» la scorrono, il clic dice cosa è cambiato e chi l'ha voluto; non torna
  indietro: `R` resta l'unico modo); al centro il **registro dal vivo** (`kernel.feed()`: chi lavora, a cosa, con quale
  modello); a destra il **quadro dei costi** (`kernel.usage` per agente e compito, in dollari, i budget di
  `universe.json → ai` come fondo scala). Le scritte sullo strato 2D o in texture (decidere misurando i fotogrammi).
  Test: la pellicola si sposta e si ferma ai bordi; il quadro somma come il pannello del Concilio.
- **T46c · allerta e postazioni**: una fascia luminosa sotto il soffitto verde/ambra/rossa (guasti aperti, rifiuti del
  validatore nell'ultima ora, budget oltre l'80 %), il motivo nel pannello; le scrivanie della squadra dell'Arbitro in file
  davanti agli schermi, chi lavora nel registro si vede alla sua console. Test: i tre livelli dai tre casi.
- Fatto quando (per pezzo): test verdi, typecheck, verifica nel browser (`aurora`, offline) con pannello e nessun errore.

### T47 · La Biblioteca del Mondo, dentro — `da fare` (si comincia da T47a)
- Contesto: §3.2 (il chiostro, scelto il 23/10). Oggi dentro la Biblioteca (`mondo`, Narratore, verde `7dd87d`) ci sono
  solo gli scaffali dei file di `world/`.
- **T47a · il leggio**: al posto della vetrina, un libro aperto olografico; «<» «>» sfogliano la bibbia (`world/bible.json`:
  `luoghi`, `personaggi`, `fatti`, `misteri`, una voce per pagina), E o clic aprono la pagina nel pannello con i nodi del
  grafo che la toccano (`graph.find`/`neighbors`, cliccabili come nel Nucleo). L'interno è una stanza come le altre (il
  chiostro è fuori): il leggio sta su una vasca d'acqua scura, come l'acqua della corte. Test: le pagine coprono la bibbia
  intera, i bordi fermano, una pagina che nomina una persona ne trova il nodo.
- **T47b · le tavole delle regole e il canone**: a parete una lastra per giudizio di `world/rules.json` (le ultime 12,
  quelle che il Narratore riceve, brillano), clic → il giudizio nel pannello; il canone delle rune (`world/canone.md`)
  inciso sopra la porta, le rune magiche nei loro colori. Test: le lastre sono quante le regole (o il massimo che la
  parete tiene, con «<» «>»), le ultime marcate.
- Fatto quando (per pezzo): test verdi, typecheck, verifica nel browser.

### T48 · La Galleria dell'Artista, dentro e il plinto — `da fare` (si comincia da T48a)
- Contesto: §3.3 (approvata il 23/10). Oggi la Galleria (`galleria`) espone i modelli come quadri con «riscolpisci».
- **T48a · il tornio dello Scultore**: al posto della vetrina un piedistallo che gira con il modello scelto, il suo
  programma eseguito **passo passo** (i passi di MarkovJunior, come nella sandbox del lab: i passi intermedi da
  `src/mj/run.ts`, nei worker), «<» «>» cambiano modello; il pannello: le quattro foto (`src/mj/photo.ts`), voto e consigli
  dell'Artista, il programma, «riscolpisci». I quadri restano alle pareti. Test: i passi di un modello del seme finiscono
  nella griglia finale; «<» «>» scorrono la libreria.
- **T48b · il plinto nel piazzale** (dipende da `corona-galleria.xml` in T31): sulla lettera `plinto` del modello della
  Galleria il kernel posa un'istanza di un modello della libreria, scelto a ogni visita della corona (seme dal tick
  dell'arrivo), ridotto a stare sul plinto; nessuna generazione, nessuna collisione nuova oltre al plinto. Test: il
  modello cambia tra due visite, sta sopra la lettera `plinto`, la porta resta raggiungibile.
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

### T31 · Gli otto edifici della corona nella libreria — `in attesa` (dipende da T20 e dai programmi di T19)
- Contesto: T20 ha fatto il motore (ADR-0049); mancano i programmi. **Per l'autore**: esegui il prompt di
  [`docs/prompts/gemini-strutture-corona.md`](../prompts/gemini-strutture-corona.md) in Gemini CLI, una struttura per
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

## Multiplayer

Piano: [`multiplayer.md`](multiplayer.md) (ADR-0050). Le fasi 0 (T33-T37) servono anche da soli e non chiedono la rete;
le fasi 1-3 (T38-T43) si provano con il server di Vite e più schede; la fase 4 (T44-T45) è la piattaforma e aspetta
le risposte alle domande del piano.

### T29 · Aggiornare il piano del multiplayer — `fatto` (`a004e46`)
- Riscrivere [`docs/plans/multiplayer.md`](multiplayer.md) con le decisioni dell'autore del to-do (sezione «Multiplayer» di
  [`docs/userchats/to-do-2026-10-22.md`](../userchats/to-do-2026-10-22.md)): server unica fonte di
  verità, modalità singola e multigiocatore, crediti e proxy, contenuti come carte del giocatore (P#2), master in
  god mode e senza tappeto, punizione della morte configurabile, budget e modelli nella lobby, PvP e «Altro…» tra
  giocatori; togliere i riferimenti al 2D e alle immagini. Poi spezzare l'implementazione in task di questo
  backlog.
- Esito: piano riscritto (le decisioni, la tabella «oggi / in multigiocatore», architettura, master, spesa e carte, le
  criticità approvate, fasi, quattro domande nuove), ADR-0050, task T33-T45. Diverso dal previsto: in modalità singola
  il kernel può restare nel browser (cambiano solo proxy e crediti); spostarlo sul server anche lì è rimandato.

### T33 · La configurazione dell'universo alla Genesi — `da fare`
- Contesto: decisione 9 del piano. Prima della Genesi si sceglie quanto è punitiva la morte (testo libero, o «molto» /
  «poco punitiva»), PvP sì/no, «Altro…» tra giocatori sì/no, e la modalità (singola / multigiocatore). Sono definitive.
- Fare: una sezione `partita` in `universe.json` (`modalita`, `morte`, `pvp`, `altroTraGiocatori`) con i valori di oggi
  come predefiniti; la schermata della Genesi (`src/ui/genesis.ts`) la chiede; il validatore la ripara; la punizione
  della morte va al Concilio come principio (con `canonSummary` o accanto ai principi di `fourthwall.ts`) e `kernel.die`
  la passa al Narratore, che decide cosa si perde e dove si riparte (effetti esistenti). Nessuna UI per cambiarla dopo.
- Fatto quando: test offline (due universi con punizioni diverse → richieste diverse al Narratore; il campo non si
  cambia dopo la Genesi), typecheck, verifica nel browser della schermata.

### T34 · Il viandante con un id e lo stato per giocatore — `da fare`
- Contesto: oggi c'è un solo `playerId` e `world/stato.json` è il viandante; ricordi, legami e missioni parlano di «il
  viandante».
- Fare: un id stabile del viandante (in singola uno solo, `io`); lo stato del giocatore in `world/giocatori/<id>.json`
  (inventario, bisogni, stati, slot, frase), letto anche dal vecchio `stato.json`; ricordi, legami, figli e missioni
  in `people.json`/`plots.json` con l'id del viandante; il nodo del viandante nel grafo per id; il Narratore riceve il
  nome del viandante con cui si parla.
- Fatto quando: un universo vecchio si carica uguale; test con due viandanti nello stesso kernel (ricordi separati).

### T35 · Semi condivisi e determinismo — `da fare`
- Contesto: decisione 2. Ogni estrazione casuale (kernel, `hash` e `math.random` di Lua, `sys.wander`, fuoco, bottino)
  deve venire da (seme dell'universo, tick, entità); niente orologio di sistema nella simulazione.
- Fare: censire le fonti di casualità e di tempo (`Math.random`, `Date.now`, `performance.now` dentro il tick) e
  passarle da `rng.ts`; `math.random` della sandbox con il seme del tick.
- Fatto quando: test — due kernel con lo stesso universo e la stessa sequenza di input arrivano allo stesso stato dopo
  N tick (entità, posizioni, persone).

### T36 · Chi ha generato ogni contenuto (carte, P#2) — `da fare`
- Contesto: decisioni 4 e 6. Ogni chiamata ha un `chi` (il giocatore) o è comune; ogni contenuto generato ha autore e
  pagante e un contatore di utilizzi.
- Fare: `chi` nel registro dei consumi (`ai/usage.ts`, `world/consumi.json`), con le chiamate del Concilio per il mondo
  marcate comuni; `origin.autore` sui moduli, sui modelli (`models/index.json`), sui luoghi (`maps/`), su persone, trame
  e regole; gli utilizzi (quante volte un contenuto entra in un luogo, in una trama, in un prompt) in un file
  `world/carte.json`; una funzione che costruisce la collezione di un giocatore dal repository.
- Fatto quando: test offline (una Genesi e due luoghi → carte con autore e utilizzi; le comuni estratte a sorte, col seme).

### T37 · Rune e binding per ruolo — `da fare` (dipende da T33)
- Contesto: decisioni 7 e 8. In multigiocatore i giocatori non hanno le rune del tappeto (`CARPET_TOKENS`) né quelle che
  scrivono `x y speed carpet time`; il master ha la sola runa che porta nella Sala del Concilio.
- Fare: con `partita.modalita = multigiocatore` niente rune del tappeto nei luoghi; il kernel ignora le scritture di quei
  binding per i non master; la runa del Concilio (scorta illimitata, solo del master) che teletrasporta nella Sala del
  Concilio; `R` (rollback del repository) solo del master, quello di un giocatore riguarda il suo tappeto e la sua frase.
  In singola tutto resta com'è.
- Fatto quando: test (un non master con `x = 9999` sul tappeto resta nel cerchio; il master arriva nella Sala).

### T38 · Il kernel sul server — `da fare` (dipende da T34, T35)
- Contesto: decisione 2 e «Architettura» del piano. Un processo per universo con il kernel headless, `universeStore`, il
  proxy e un WebSocket `/api/session`.
- Fare: il kernel avviabile in Node senza DOM (come nei test) dentro il server di Vite; protocollo: ingresso (istantanea:
  file + stato), aggiornamenti delle entità vicine a ~10 Hz, messaggi del client (posizione, azioni, frase, chat,
  «Altro…») con esito; la posizione controllata con la collisione del kernel. Un finto trasporto per i test.
- Fatto quando: test headless — un server e due client nello stesso processo vedono lo stesso mondo; un client che
  bara sulla velocità viene corretto.

### T39 · Il client sottile e gli avatar — `da fare` (dipende da T38)
- Fare: in multigiocatore `main.ts` non crea il kernel ma un client che riceve lo stato e lo dà al renderer; predizione del
  proprio passo (il tappeto compensa come oggi) e correzione; entità `remote` per gli altri giocatori, con il modello
  del viandante, il seme e il colore del profilo, interpolate, con arti e fumetti; l'esito delle azioni mostrato subito
  e annullato se il server rifiuta.
- Fatto quando: due schede del browser sullo stesso server di Vite si vedono camminare; test del client col finto trasporto.

### T40 · Luoghi nuovi con il lock, a spese di chi esplora — `da fare` (dipende da T36, T38)
- Fare: il primo che entra in un luogo nuovo lo chiede al server, che lo genera una volta (Cartografo, Scultore), lo
  committa in `maps/` e lo addebita a lui (`chi`); gli altri lo ricevono pronto; un limite di luoghi nuovi al minuto
  per universo. Il Concilio (sessioni, trame, Fucina) gira solo sul server, anche senza master collegato.
- Fatto quando: test — due client che entrano insieme nello stesso luogo nuovo → una sola generazione.

### T41 · Il client del giocatore senza corona né Concilio — `da fare` (dipende da T39)
- Fare: corona, studio, pannello del Concilio, registro, console ed editor caricati solo dal master (import dinamici); il
  server non manda ai giocatori il registro del Concilio, i file dello studio né gli interni della corona; `window.rune`
  del giocatore espone solo il client.
- Fatto quando: la build del giocatore non scarica i moduli della corona (verifica nel browser, rete); test sul server
  (nessun messaggio del Concilio a un giocatore).

### T42 · Il master — `da fare` (dipende da T37, T41)
- Fare: il master è chi crea l'universo multigiocatore (non si cambia); god mode (niente morte, bisogni, danni, effetti dei
  giocatori), visibile agli altri col suo viandante; dalla corona i giocatori sull'atlante e una vista che ne segue uno;
  il ramo `master` per le sue modifiche, provate da solo e pubblicate con un gesto (merge e diffusione); clonare
  l'universo con un altro master (le carte restano a chi le ha generate).
- Fatto quando: test (il master non muore; una modifica sul ramo `master` arriva ai giocatori solo dopo la pubblicazione).

### T43 · Tra giocatori — `da fare` (dipende da T33, T39)
- Fare: «Altro…» su un altro giocatore giudicato come su una persona (se l'universo lo permette), effetti applicati dal
  server; PvP secondo `partita.pvp`; scambi di oggetti; chat tra avatar vicini (fumetti, senza filtro della quarta
  parete); morte in multigiocatore con la punizione di T33; ricollegamento con lo stato del giocatore.
- Fatto quando: test headless di ogni interazione; verifica con due schede.

### T44 · Account, profilo e viandante personalizzato — `in attesa` (domanda 1 del piano)
- Fare: autenticazione sicura, un profilo ricco, il viandante personalizzabile (seme e colori del suo modello, nome);
  l'id del viandante (T34) è quello dell'account.
- **Domanda per l'autore**: quale fornitore per l'autenticazione (Firebase Auth / Identity Platform, altro)?

### T45 · Crediti, lobby, carte e server su Google Cloud — `in attesa` (domande 1-4 del piano; dipende da T36, T44)
- Fare, a pezzi (spezzare quando si comincia): crediti e pagamenti (P#1: l'1% sul costo); la lobby con il tetto di
  crediti, i modelli degli agenti (oggi `ai.textModel` e la tabella delle classi dello Scultore), i coefficienti e i
  minimi dell'universo; crediti finiti → ricarica, offline (modelli locali) o abbandona; la collezione di carte fuori
  dalla partita, con gli utilizzi; il server su Google Cloud con i repository privati, sempre acceso.
- **Domande per l'autore**: le domande 1-4 di [`multiplayer.md`](multiplayer.md) (pagamenti, «un'altra storia», spese
  comuni, coefficienti).

## Varie

### T30 · Immagini del 3D nel README — `da fare`
- Il README mostrava le immagini del 2D (`docs/img/`): ora non le mostra più. Fare quattro schermate del 3D (il borgo
  di giorno, una persona con la chat, l'inventario con le icone dei modelli, la corona con `?dev&teleport=46,0`) con
  `vite preview` offline, salvarle in `docs/img/3d/` e rimetterle nel README.
- Fatto quando: README con le immagini nuove, commit.
