# Registro delle decisioni (ADR)

Ogni decisione architetturale ha un ADR: contesto, decisione, conseguenze. Un ADR non si riscrive:
se una decisione cambia, se ne scrive uno nuovo che sostituisce il precedente (e si aggiorna `AGENTS.md`).

| # | Titolo | Stato |
|---|--------|-------|
| [0001](0001-stack.md) | Stack: Vite + TypeScript + Canvas 2D + Lua 5.4 (wasmoon) | accettato; il Canvas 2D è sostituito da three.js (0040) |
| [0002](0002-grammatica-ed-esecuzione-delle-rune.md) | Grammatica ed esecuzione delle rune | accettato |
| [0003](0003-sandbox-moduli-e-pavimento.md) | Sandbox, moduli e il kernel come pavimento | accettato |
| [0004](0004-tappeto-spazi-e-corona.md) | Tappeto, spazi di coordinate e corona | accettato |
| [0005](0005-gateway-ia-e-validazione.md) | Gateway IA e validazione | sostituito da 0008 |
| [0006](0006-versionamento.md) | Versionamento dell'universo | accettato |
| [0007](0007-universo-di-prova-e-rottura.md) | Universo di prova, resa grafica e stato "rotto" | in parte sostituito da 0008 (resa a glifi) |
| [0008](0008-concilio-degli-agenti-e-gemini.md) | Il Concilio degli agenti e Google Gemini | accettato; la pittura per chunk è sostituita da 0011, le immagini sono tolte (0037, 0040) |
| [0009](0009-corona-nascosta.md) | La corona è davvero nascosta finché il tappeto ti tiene | accettato |
| [0010](0010-oggetti-inventario-personaggi.md) | Oggetti, inventario e personaggi simulati | accettato |
| [0011](0011-tile-e-layout-markovjunior.md) | Mappe a tile e layout con regole stile MarkovJunior | accettato; la resa è sostituita da 0040 |
| [0012](0012-contenuti-guidati-dai-dati.md) | Contenuti guidati dai dati: oggetti, bottino, ricette, bisogni, azioni | accettato |
| [0013](0013-atelier-e-individui.md) | L'Atelier (immagini in contesto) e gli NPC come individui | accettato; l'Atelier è sostituito da 0040 |
| [0014](0014-azioni-libere-ed-effetti.md) | Azioni libere («Altro…») e il motore degli effetti | accettato |
| [0015](0015-rune-magia-giorno-notte.md) | Una runa per casella, magia, incantesimi, giorno e notte | accettato |
| [0016](0016-corona-archivio-e-concilio.md) | La corona come archivio, il Concilio in carne e ossa | accettato |
| [0017](0017-varieta-delle-persone.md) | Varietà delle persone | accettato; abiti ricolorati e scontorno degli sprite sostituiti da 0041 (un individuo è un seme del modello) |
| [0018](0018-rune-oggetto-mana-borse.md) | Rune come oggetti, frase, mana e cristalli, borse nell'inventario | accettato |
| [0019](0019-decisioni-regole.md) | Le decisioni del Concilio diventano regole | accettato |
| [0020](0020-societa-degli-npc.md) | La società degli NPC | accettato |
| [0021](0021-due-repository.md) | Due repository: il kernel (seme) e l'universo (su disco) | accettato |
| [0022](0022-corona-studio-e-referente.md) | La corona come studio, il Referente, il viandante trasceso | accettato; sostituisce la disposizione di 0016 |
| [0023](0023-geografia-atlante-timbri.md) | Geografia: biomi, atlante, timbri di strutture | accettato |
| [0024](0024-vita-degli-npc.md) | La vita degli NPC: attività, dialoghi, ricordi, trame, famiglia | accettato |
| [0025](0025-due-tavoli.md) | Due tavoli: il Concilio è il Dungeon Master, dentro il mondo niente meta-gioco | accettato; supera le «crepe» |
| [0026](0026-meccaniche-morte-trascendenza.md) | Meccaniche nuove (stati), morte, trascendenza, camminate valide | accettato |
| [0027](0027-studi-neon-e-atlante.md) | Studi neon-punk, sala del Concilio, atlante navigabile | accettato |
| [0028](0028-meccaniche-con-interfacce.md) | Meccaniche con interfacce: il Concilio aggiunge pannelli (slot, barre, pulsanti) | accettato |
| [0029](0029-menu-delle-caselle.md) | Menu contestuale delle caselle, azioni imparate dal terreno | accettato |
| [0030](0030-prospettiva-tre-quarti-e-scontorno.md) | Prospettiva 3/4 e scontorno delle immagini (perché il magenta) | sostituito da 0040 |
| [0031](0031-laboratorio-voxel.md) | Laboratorio voxel: MarkovJunior 3D fotografato in 3/4 (fuori dal gioco) | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0032](0032-scala-fotogrammi-strutture.md) | Laboratorio voxel: scala unica, fotogrammi dal modello, strutture a blocchi | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0033](0033-protocollo-blocchi-wfc.md) | Laboratorio voxel: protocollo tra i due scultori (catalogo, varianti, zone), WFC a bit, foto per blocchi | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0034](0034-strutture-alla-markovjunior.md) | Laboratorio voxel: strutture scritte come gli esempi di MarkovJunior (crescita, contorno, dettaglio sulla struttura intera) | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0035](0035-commissione-dei-blocchi.md) | Laboratorio voxel: l'Architetto commissiona i blocchi (pianta prima, configurazioni, vuoti di tipo diverso) | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0036](0036-markovjunior-alla-lettera-in-3d.md) | Laboratorio voxel: MarkovJunior alla lettera (XML), modelli interi, sandbox 3D; Gemini 3.1 contro 3.8 | accettato; il formato è quello del gioco (0038) |
| [0037](0037-passaggio-al-3d.md) | Si passa al 3D: modelli MarkovJunior come asset, spazio a scale, via il 2D (attuazione nello step 9) | attuato (step 9, riassunto in `docs/reports/step9.md`) |
| [0038](0038-laboratorio-di-markovjunior.md) | MarkovJunior nel gioco (src/mj), il laboratorio diventa il laboratorio di MarkovJunior | accettato |
| [0039](0039-registro-dei-consumi.md) | Registro dei consumi, prezzi in un file, ragionamento low, niente ripetizioni dopo un tempo scaduto | accettato |
| [0040](0040-il-gioco-in-3d.md) | Il gioco è 3D: renderer three.js, niente immagini | accettato |
| [0041](0041-asset-come-programmi.md) | Gli asset sono programmi MarkovJunior (libreria models/, forme, semi); collisione dai voxel; azioni come regole | accettato |
| [0042](0042-scultore-e-artista.md) | Lo Scultore nel Concilio (per classe, programmi indipendenti, revisione), l'Artista giudica le foto | accettato |
| [0043](0043-spazio-a-scale-lotti-strutture.md) | Lo spazio a scale: i lotti del piano diventano strutture (modelli girati verso la porta), dentro è sul pavimento del modello, una struttura importante per zona | accettato |
| [0044](0044-azioni-come-regole-sul-modello.md) | Le azioni sono regole sul modello: «Altro…» che cambia l'aspetto fa scrivere allo Scultore un'`<action>`, provata dal kernel e imparata dal tipo; gli effetti per il resto | accettato |
| [0045](0045-grafo-del-mondo.md) | Il grafo del mondo nel kernel (`world/grafo.json`, nodi e archi tipizzati, interrogazioni e controlli, formato di Graphify); Graphify facoltativo per lo sviluppo | accettato |
| [0046](0046-voxel-luminosi.md) | Voxel luminosi: `<color glow="True">`, attributo `glow` nelle mesh, emissione nei materiali e bloom selettivo dalla maschera nell'alfa | accettato |
| [0047](0047-telecamera-che-ruota.md) | La telecamera che ruota e camera libera: rotazione libera e continua con tasto centrale, quarti di giro con `,` `.`, zoom con rotellina; vincoli di prospettiva in simulazione, libera in god mode e corona | accettato |
| [0048](0048-terreno-con-le-altezze.md) | Il terreno con le altezze: `Hills` di MarkovJunior su due piastrelle che si ripetono, livelli di un quarto di casella, gradini sempre salibili, acqua piana; `groundAt` nel kernel | accettato |
| [0049](0049-densita-dei-modelli-e-campus.md) | Ogni modello dice la sua densità (`vpt` in `models/index.json`, senza 20); gli edifici del campus sono i loro modelli `corona-<id>` (davanti al viale, porta sulla lettera `porta`, collisione dai voxel) | accettato |
| [0050](0050-multiplayer-server-unica-fonte.md) | Multiplayer: il server è l'unica fonte di verità (semi condivisi), modalità singola e multigiocatore, crediti e carte, master fisso in god mode, scelte definitive alla Genesi | accettato (piano) |
| [0051](0051-ufficio-dei-luoghi-e-cartografo.md) | Lo Studio del Cartografo è l'Ufficio dei luoghi: niente edificio `cartografia`; i terreni nel campionario (da un piano loro, dopo i file), l'atlante contro la parete di fondo, il posto del Cartografo al tavolo porta lì | accettato |
| [0052](0052-banco-della-sala-sistemi.md) | I casi dei sistemi (`Manifest.casi`) girano con il codice vero in un kernel in miniatura (`KernelOptions.bench`, `runCase` in `bench.ts`: `core.*`, i contenuti e quel sistema su una scena 5 × 5); l'Ingegnere scrive quelli delle meccaniche, il kernel tiene solo quelli in cui qualcosa cambia | accettato |
| [0053](0053-la-partita-alla-genesi.md) | La partita (`universe.json → partita`: modalità, morte 0-4, PvP, «Altro…» tra giocatori) si sceglie alla Genesi e non cambia più; va al Concilio come principio; alla morte il Narratore decide cosa si perde e dove si riparte | accettato |
| [0054](0054-il-viandante-con-un-id.md) | Il viandante ha un id stabile (`io` in singola) e il suo stato in `world/giocatori/<id>.json`; legami, ricordi, figli e missioni portano l'id; più viandanti nello stesso kernel (`addWanderer`, `as` sincrono); il Narratore sa con chi parla; un nodo del grafo per viandante | accettato |
| [0055](0055-semi-condivisi.md) | Semi condivisi: il kernel semina `math.random` di Lua prima di ogni chiamata da (seme dell'universo, tick, chi chiama, entità); `randomseed()` non legge l'orologio; il kernel tira da `rngFor`, i nomi unici dal tempo del mondo (`worldStamp`); l'orologio solo fuori dalla simulazione | accettato |
| [0056](0056-le-carte.md) | Chi paga e le carte: ogni chiamata ha un `chi` (un viandante o `comune`, per compito), il registro dei consumi conta per pagante; ogni contenuto generato porta `carta {autore, pagante, titolare}` (le comuni a un viandante estratto col seme); gli utilizzi e le carte dei luoghi in `world/carte.json`; la collezione dal repository | accettato |
| [0057](0057-rune-per-ruolo.md) | Rune e binding per ruolo: `partita.master` (in singola chi gioca è il master di tutto); in multigiocatore niente righe del tappeto nei luoghi, le righe girano come chi le ha scritte (`RuneComp.by`) e quelle dei non master non scrivono `x y speed carpet time`; la runa `concilio` del master porta nella Sala del Concilio; `R` del repository solo del master, un giocatore riprende le sue rune | accettato |
| [0058](0058-il-kernel-sul-server.md) | Il kernel sul server: un tappeto per viandante (`as` lo scambia), `core.movement`/`core.carpet` per viandante, i viandanti dei client (`setRemote`) con il passo controllato (`stepWanderer`, ritmo e collisione); protocollo JSON (`ingresso aggiorna correzione esito`), `SessionServer`, finto trasporto nei test, WebSocket `/api/session` nel server di Vite | accettato |
| [0059](0059-il-client-sottile.md) | Il client sottile: in multigiocatore il browser avvia un kernel specchio (`mirror`: niente generazione né salvataggi, muove solo il suo viandante) che `ThinClient` riempie con luoghi, cose e altri viandanti della sessione; predizione del passo e correzione, interpolazione, azioni inoltrate al server con esito ottimistico annullato se rifiutato; un seme e un colore del mantello per viandante | accettato |
| [0060](0060-luoghi-nuovi-con-il-lock.md) | Luoghi nuovi con il lock: il chunk ricorda chi lo ha voluto per primo (`Chunk.chi`), che paga il piano, la sua carta e ciò che la Fucina fa per lui; le bozze si pianificano vicino a qualunque viandante fuori dallo studio; in multigiocatore al più `ai.placesPerMinute` luoghi nuovi al minuto del mondo; il Concilio solo sul server | accettato |
| [0061](0061-il-client-del-giocatore.md) | Il client del giocatore senza corona né Concilio: a un giocatore solo i file che il client disegna (`playerFiles`: manifest senza codice, modelli, rilievo, atlante); il registro del Concilio (`concilio`) solo al master; corona, studio, registro, console, editor e Genesi in `src/master.ts` e `CoronaView`, caricati con `import()` solo dal master; `window.rune` del giocatore è il client | accettato |
| [0062](0062-da-rune-a-quine42.md) | Da Rune a QUINE42: refactoring del nome del gioco (package.json `quine42`, UI e title `QUINE42`, `window.quine` e alias `window.rune`, documentazione; le rune restano token e meccanica diegetica) | accettato |
| [0063](0063-raggio-42-passi-corona.md) | Il raggio 42: i 42 passi verso la corona (`universe.json → circleRadius` e default kernel a 42; corona invisibile finché il tappeto tiene; 42 passi esatti per uscire fermando il tappeto) | accettato |
| [0064](0064-niente-cose-sui-passaggi-obbligati.md) | Niente cose solide sui passaggi obbligati: `articulationPoints` (Tarjan) individua i punti di articolazione delle caselle libere; `placementsOf` e `placeInside` non mettono cose solide su strettoie, colli di bottiglia o ingressi (regola 10) | accettato |
| [0065](0065-il-master-in-god-mode.md) | Il master in god mode, visibile solo nel mondo: in multigiocatore `godMode` (bisogni pieni con `keepGods`, morte risparmiata da `spareGods`, effetti mirati dei giocatori ridotti a `messaggio`); `inWorld`: il server manda agli altri solo i viandanti sul loro tappeto dentro il cerchio | accettato |
| [0066](0066-il-ramo-del-master.md) | Il ramo del master e la pubblicazione: i salvataggi validi dello specchio del master sono il suo ramo (`ramo`, su disco `refs/heads/rami/master`), il mondo non lo vede finché non pubblica (`pubblica`: commit del principale, vince il master, merge su disco); i file del mondo che cambiano arrivano ai client (`file`, `playerChanges`); `R` del master torna all'ultimo valido del ramo | accettato |
| [0067](0067-i-giocatori-dalla-corona.md) | I giocatori dalla corona: al master l'elenco dei giocatori collegati (`giocatori`), nel tavolo della situazione e nell'atlante (`kernel.players()`); `segui` sposta la sua vista attorno a un giocatore, il renderer lo mette al centro senza muovere il master; Esc per tornare | accettato |
| [0068](0068-il-clone-con-un-altro-master.md) | Il clone con un altro master: l'unico modo di cambiare master è copiare l'universo (storia, luoghi, viandanti, carte; non il ramo del vecchio master) in uno nuovo con un altro `partita.master`; autore e pagante delle carte non cambiano, il titolare resta o (a scelta) le carte del vecchio master passano al nuovo | accettato |
| [0069](0069-il-concilio-sul-ramo-del-master.md) | Il Concilio sul ramo del master: in multigiocatore le richieste del master al Referente e alle squadre girano sul server, in un kernel del ramo (file del mondo più il ramo, stessi modelli), e ciò che committano va sul ramo, da pubblicare; le rune nella corona non cambiano file | accettato |

Modello: copia un ADR esistente, numero successivo, stato `proposto` → `accettato`.

