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

### T16 · Terreno con le altezze (Hills) — `da fare`
- Dal to-do: il terreno con variazioni di altezza, partendo dal modello 3D `Hills` di MarkovJunior. ADR: campo di
  altezza a scala di casella, continuo fra i chunk (deterministico per seme e coordinate); il renderer lo disegna,
  il kernel lo usa per i pavimenti dei corpi. Da decidere nel task: altezze solo estetiche o anche ostacoli
  (pendenze invalicabili).

### T17 · Lotti in piano — `da fare` (dipende da T16)
- Le strutture su più caselle hanno bisogno di spazi piani: il piano spiana i lotti (e i sentieri) prima di
  posare i modelli. Test.

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

### T20 · Gli esterni della corona come modelli — `da fare` (dipende da T18, T19)
- Ogni edificio della corona usa il suo programma (`models/corona-<id>.xml`) con insegna neon; collisione dai
  voxel; porta dove il modello la mette.
- Dai programmi di T19 (in `lab/mjx/models/corona-*.xml`): la libreria deve avere una densità per modello (quelli della
  corona sono a 8 voxel per casella, `VPT = 20` è fisso in `src/kernel/forms.ts`), con un ADR; la porta del campus va
  sulla lettera `name="porta"`, il davanti del modello (y grande) verso il viale.

### T21 · La vetrina con selettore — `da fare`
- Un meccanismo comune agli interni: un oggetto (schermo, silos, stampante) con «<» «>» ai lati che sceglie
  cosa mostrare; un clic apre un pannello con le informazioni (il modello, il modulo). Base per T22-T24.

### T22 · La Torre della Magia, dentro — `da fare` (dipende da T21)
- Lo schermo mostra una runa o una combinazione di rune (magiche e incantesimi noti), «<» «>» per cambiarla; il
  clic mostra nel pannello l'effetto.

### T23 · Lo Studio dei personaggi, dentro — `da fare` (dipende da T21)
- Un silos al centro con il personaggio scelto che fluttua in un liquido viscoso; «<» «>»; il clic mostra il
  modulo e l'individuo.

### T24 · Laboratorio delle cose e Magazzino degli oggetti, dentro — `da fare` (dipende da T21)
- Una stampante 3D di 3 × 3 caselle con l'oggetto scelto sulla casella centrale (le strutture ridotte alla scala
  di una casella); «<» «>»; il clic mostra le informazioni.

### T25 · La Sala del Concilio: il tavolo unito — `da fare`
- Il tavolo è fatto di cubi separati: farne un ellissoide unico (un modello o una mesh sola).

### T26 · L'Ufficio dei luoghi, dentro — `in attesa`
- Da progettare in funzione di come lavora il Cartografo (piani, lotti, atlante). **Proposta all'autore** prima
  di costruire.

### T27 · La Sala sistemi, dentro — `in attesa`
- L'autore chiede un aiuto: far apprezzare la complessità del codice con esempi (cosa fa un sistema, casi d'uso).
  **Proposta all'autore** (es. ogni sistema come un «caso» animato: prima, regola, dopo).

### T28 · Il Nucleo, dentro — `da fare` (dipende da T12)
- Il grafo del mondo navigabile in UI.

## Multiplayer

### T29 · Aggiornare il piano del multiplayer — `da fare`
- Riscrivere [`docs/plans/multiplayer.md`](multiplayer.md) con le decisioni dell'autore del to-do (sezione «Multiplayer» di
  [`docs/userchats/to-do-2026-10-22.md`](../userchats/to-do-2026-10-22.md)): server unica fonte di
  verità, modalità singola e multigiocatore, crediti e proxy, contenuti come carte del giocatore (P#2), master in
  god mode e senza tappeto, punizione della morte configurabile, budget e modelli nella lobby, PvP e «Altro…» tra
  giocatori; togliere i riferimenti al 2D e alle immagini. Poi spezzare l'implementazione in task di questo
  backlog.

## Varie

### T30 · Immagini del 3D nel README — `da fare`
- Il README mostrava le immagini del 2D (`docs/img/`): ora non le mostra più. Fare quattro schermate del 3D (il borgo
  di giorno, una persona con la chat, l'inventario con le icone dei modelli, la corona con `?dev&teleport=46,0`) con
  `vite preview` offline, salvarle in `docs/img/3d/` e rimetterle nel README.
- Fatto quando: README con le immagini nuove, commit.
