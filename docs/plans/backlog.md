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

### T27 · La Sala sistemi, dentro — `fatto` (T27a, T27b, T27c, T27d)
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

### T49 · Gli interni della corona: aria, simmetria, luci più tenui — `fatto` (T49a, T49b)
- Contesto: richiesta del 24/10 ([`to-do-2026-10-24.md`](../userchats/to-do-2026-10-24.md), «Interni edifici della corona»,
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
- Contesto: [`corona-proposte.md`](corona-proposte.md) §3.1 (approvata il 23/10). Oggi dentro la Direzione (`universo`,
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

### T48 · La Galleria dell'Artista, dentro e il plinto — T48a `fatto`, si continua con T48b
- Contesto: §3.3 (approvata il 23/10). Oggi la Galleria (`galleria`) espone i modelli come quadri con «riscolpisci».
- **T48a · il tornio dello Scultore** — `fatto`: al posto della vetrina un piedistallo che gira con il modello scelto, il suo
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

### T31 · Gli otto edifici della corona nella libreria — `fatto` (commit «Corona (T31)»)
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
- Contesto: richiesta del 24/10, sera ([`to-do-2026-10-24.md`](../userchats/to-do-2026-10-24.md), «Luci del Nucleo e del silos»).
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
- Contesto: consultazione del 24/10 ([`risposte-T50.md`](../userchats/risposte-T50.md)). Gli undici edifici sono completati
  nel campus (T31 fatto). L'ambientazione della corona deve essere marcatamente futuristica e artificiosa («lo studio che
  programma la realtà»), sfruttando MarkovJunior a piena potenza: programmi con semi riutilizzabili ad altissima varietà visiva
  e fotogrammi animati. Fuori non camminano i membri del Concilio, ma una vita robotica operosa; i membri del Concilio (negli
  interni degli edifici e nella Direzione) sono un tributo alla *Guida Galattica per gli Autostoppisti*: gerboa giganti
  pacioccosi con cappelli distintivi per ruolo.
- **T50a · Prompt per Gemini CLI (`docs/prompts/gemini-esterni-corona.md`) — `fatto` (`294a734`)**:
  - Predisposto il file guida per Gemini CLI ([`docs/prompts/gemini-esterni-corona.md`](../prompts/gemini-esterni-corona.md), stile `gemini-strutture-corona.md`)
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

Richieste del 24/10 ([`to-do-2026-10-24.md`](../userchats/to-do-2026-10-24.md), «Generazione della heightmap» e «taglia»).

### T51 · Il livello del mare e un motore dell'acqua — `da fare` (si comincia da T51a; T51b in attesa della domanda)
- Contesto: ADR-0048. Oggi ogni specchio d'acqua è piano **dentro il suo chunk** (`waterLevels` in `relief.ts`: al livello
  più basso delle sue caselle, contando solo il chunk); lo stesso lago o fiume su due chunk ha due livelli, e laghi vicini
  livelli diversi: a vista l'acqua ha dei dislivelli (si vede anche in `Blocchi.png`).
- **T51a · il livello del mare**: un livello dell'acqua per il mondo (`universe.json → rilievo.mare`, o derivato dal rilievo
  alla Genesi): il mare e ciò che lo tocca stanno lì, il terreno sotto viene scavato fino a lui con le sponde (si sale sempre,
  come ora); laghi e fiumi interni hanno un livello per specchio **intero** (attraverso i chunk: lo specchio si segue fino
  al bordo del mondo caricato, deterministico, cache per regione). Test: lo stesso specchio su due chunk ha un livello; due
  chunk caricati in ordine diverso danno gli stessi livelli; nessuna casella d'acqua sopra la terra che la circonda.
- **T51b · il motore dell'acqua** (ADR): l'acqua che scorre quando il terreno cambia (incantesimi che alzano o abbassano
  il terreno, T57; «Altro…» che scava). Proposta: MarkovJunior resta per **generare** (rilievo, fiumi alla Genesi); per la
  fisica un automa cellulare del kernel sui chunk caricati (quantità d'acqua per casella, scorre verso i vicini più bassi,
  pochi passi al secondo, solo dove qualcosa è cambiato, si ferma quando è in equilibrio e salva il risultato nel piano
  del luogo). Un programma MarkovJunior per tick su tutto il mondo caricato costerebbe troppo (ogni passo cerca le regole su
  tutta la griglia e l'acqua non si ferma mai del tutto) ed è difficile da ottimizzare: possibile solo come regola locale
  attorno al punto cambiato. Test: una conca scavata accanto a un lago si riempie e il lago si abbassa del giusto.
- Fatto quando (per pezzo): test verdi, verifica nel browser su un lago tra due chunk, ADR-0048 aggiornato (T51a) o ADR
  nuovo (T51b), commit.
- **Domanda per l'autore**: va bene l'automa cellulare del kernel per la fisica dell'acqua (MarkovJunior solo per generare)?

### T52 · I sotterranei — `in attesa` (decisione di progetto prima del codice)
- Contesto: oggi niente sta sotto il livello del terreno (il rilievo è una colonna piena, i modelli stanno sul suolo,
  `floorAt`). L'autore vuole i sotterranei (anche un edificio seminterrato nella corona, come la Sala sistemi).
- **T52a · il progetto** (ADR, nessun codice): come esiste uno spazio sotto il terreno (un piano sotto il luogo come zona a
  parte, tipo gli interni della corona, con scale/rampe che ci portano; oppure strutture che scendono sotto il suolo con il
  terreno tagliato dal renderer come le strutture oggi); chi lo genera (il Cartografo: «sotterraneo» nel piano; lo Scultore:
  un modello che scende sotto lo zero); come si vede (taglio sopra il viandante, luce); collisione e connettività (regola 10).
  Poi spezzare in task di codice.
- Dipendenze: T53a (le scale come rampe sono il modo di scendere).
- **Domanda per l'autore**: sotterranei come luoghi a parte sotto il mondo (dungeon) o come parti sotterranee delle
  strutture (cantine, cripte), o entrambi?

### T53 · Le scale come rampe e le strutture su più piani — `da fare` (si comincia da T53a)
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
- Fatto quando (per pezzo): test verdi, verifica nel browser su una struttura generata con le scale, commit (ADR-0043
  aggiornato).
- Dipendenze: nessuna. Utile prima di T52 e di T56.

### T54 · Le taglie di D&D per strutture e creature — `in attesa` (domande sotto)
- Contesto: richiesta del 24/10. Oggi le classi (`CLASSES` in `src/mj/classes.ts`: `persona`, `animale`, `bestia`,
  `edificio`, `grande`…) danno la scatola in caselle, e una struttura «importante» (Argon) per zona di 56 × 56 luoghi.
  L'autore vuole riferirsi alla taglia di D&D: Minuscola, Piccola, Media, Grande, Enorme, Gargantuesca, più una ancora più
  grande e più rara; il castello più grande di oggi è «Enorme».
- Fare: un campo `taglia` per creature e strutture (manifest, piano del Cartografo, richieste allo Scultore), con la scatola
  in caselle di ogni taglia (per le creature lo spazio di D&D: Media 1 casella, Grande 2 × 2, Enorme 3 × 3, Gargantuesca
  4 × 4 o più; per le strutture una scala loro); la classe resta per la forma (persona, animale, edificio), la taglia dà le
  misure; «importante» diventa la rarità delle taglie più grandi (Enorme per zona, Gargantuesca per regione, la settima per
  mondo, da decidere); prompt di Cartografo, Narratore e Scultore; validatore. Test: una richiesta «Enorme» dà la scatola
  giusta; la rarità per zona regge.
- Fatto quando: test verdi, AGENTS.md e un ADR (sostituisce in parte ADR-0043 sulle importanti), commit.
- **Domande per l'autore**: il nome della settima taglia (es. «Colossale», «Titanica»)? Le taglie delle strutture seguono
  quelle delle creature (Media = una casa, Enorme = il castello) o una scala a parte? Quanto rare sono le ultime tre?

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

### T56 · Il salto, e le cose che chiudono i sentieri — T56a `fatto` (`e5f8099`), T56b `da fare` (dopo T53a)
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

## Le rune

### T57 · Le rune come codice: sequenze ordinate, effetti, rune nuove — `da fare` (si comincia da T57a)
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

### T43b · «Altro…» e PvP tra viandanti — `da fare` (dipende da T43a)
- Fare: «Altro…» su un altro viandante giudicato come su una persona, solo se `partita.altroTraGiocatori`; gli effetti li applica
  il server sul corpo dell'altro (il master in god mode lascia passare solo `messaggio`, ADR-0065); ciò che ferisce
  (bisogni che scendono, `spingi`, `fuoco`…) solo se `partita.pvp`, altrimenti il Narratore lo sa e il kernel lo toglie.
- Fatto quando: test headless con PvP sì e no, con «Altro…» tra giocatori sì e no.

### T43c · Morte e ricollegamento in multigiocatore — `da fare` (dipende da T43b)
- Fare: a salute zero un giocatore (mai il master) muore con la punizione di T33 (`continueAfterDeath` sul server, come lui,
  senza chiudere la sessione degli altri); il client lo mostra e riparte dove dice il verdetto. Chi si ricollega ritrova il suo
  stato (`world/giocatori/<id>.json`): posizione, inventario, frase, stati; la carta e i legami restano.
- Fatto quando: test headless (morte per sete di un giocatore, gli altri continuano; uscita e rientro con lo stesso stato) e
  verifica con due schede.

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
