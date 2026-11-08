# Le fasi e gli step di QUINE42

Come si divide lo sviluppo (ADR-0128). Il testo dell'autore è in [`userchats/to-do-2026-11-04.md`](userchats/to-do-2026-11-04.md), «Fasi dello sviluppo»: le
fasi sono quelle pianificate oggi e **possono cambiare in corso d'opera**. Le parole sono nel [glossario](glossario.md#lo-sviluppo).

- **Fase**: un tratto dello sviluppo con un traguardo che si vede da fuori. Sono quattro.
- **Step**: il raggiungimento di un obiettivo condiviso tra task, per esempio «step 25: aggiungere il suono al gioco». Non è più una tappa del piano, come erano gli step fino al 9.

## Le quattro fasi

Siamo nella **Fase I**. Il criterio della Fase I l'ha approvato l'autore il 04/11; quelli delle altre tre sono ricavati da ciò che l'autore ha scritto. Il criterio lo può cambiare solo lui, ed è sempre lui a dire finita una fase.

### Fase I: il kernel 0.9.0

L'autore: l'implementazione del kernel 0.9.0, divisa in step. La guida dei beta tester si scrive alla fine di questa fase, prima della Fase II.

**Finita quando:**

1. Tutti gli step di Fase I nella tabella sono `raggiunto`, oppure l'autore li ha spostati a un'altra fase.
2. Il server di beta è acceso: un universo multigiocatore giocato da due browser veri (T45f, l'ultimo passo della fase: per scelta dell'autore parte quando il resto è finito).
3. I quattro universi vanilla sono generati e ci si cammina senza errori (T153).
4. `npm run sicurezza:prove` passa contro il server di beta, e nel registro non resta aperta una voce con cui un tester possa toccare i crediti di altri, il server o la chiave.
5. Ciò che T183 trova mancare al kernel e che non entrerebbe senza wipe è deciso: dentro la 0.9.0 oppure rimandato sapendo cosa costa, perché un wipe degli universi ufficiali costa molto. Con il versionamento (ADR-0136) «senza wipe» vuol dire «nella stessa `X.Y`»: ciò che cambia il contratto dopo la 0.9.0 la porta a 0.10.0 o a 1.0.0, e gli universi della beta restano sul server della loro versione.
6. Il registro di ciò che il Concilio non riesce a fare è acceso (T238): senza, la Fase III non ha da dove partire.
7. Un viandante nuovo ha seguito i due file della guida sul server di beta, e ogni passo torna (T237).
8. `package.json`, `KERNEL_VERSION` (`src/kernel/version.ts`) e `universe.json → kernel` del seme dicono `0.9.0` (oggi `0.1.x`: `Z` sale a ogni task che cambia il kernel, ADR-0136) e quel commit ha un tag.

### Fase II: i beta tester

L'autore: una decina di persone fidate, suoi amici e lui stesso, non pagati («non è il classico beta testing noioso»); serve a raccogliere i requisiti del kernel nuovo. Lui dà 5 € di crediti a testa e genera a sue spese gli universi vanilla. Con la guida i tester sanno che si prenota il turno per non sovraccaricare i server, che si può giocare insieme nella stessa sessione senza esagerare con quelle a molti, e tutti i limiti del server di beta con cui potrebbero frustrarsi. Una parte dei crediti è per esplorare; un secondo file spiega la corona e sblocca l'altra, così provano tutto anche se non capiscono come uscire dal tappeto. Le decisioni prese dopo sono in T236 (2 € + 3 €, a mano); calendario e comunicazioni stanno fuori dal repository.

**Finita quando:** i tester hanno provato le due parti e il multigiocatore, e il rapporto del registro di T238 con i commenti che l'autore porta in chat è diventato l'elenco dei requisiti del kernel 1.0.0. Alla fine di questa fase si fa la landing nuova (step 35).

### Fase III: il kernel 1.0.0

L'autore: occorre individuare le funzionalità che il Concilio non riesce a implementare nel gioco simulato durante le sessioni, che le chiedano i giocatori o che nascano dal Concilio stesso. Le quattro lingue (italiano, inglese, francese, spagnolo) sono l'ultimissima operazione di questa fase.

**Finita quando:** l'elenco dei requisiti è fatto o rimandato per scelta dell'autore, il gioco è nelle quattro lingue e `package.json` dice `1.0.0`. Gli step di questa fase, a parte quelli in tabella, nascono dall'elenco della Fase II.

### Fase IV: la produzione

L'autore: il rilascio aperto al pubblico, con i pagamenti Stripe. Il piano di lancio è T240, che verifica anche ciò che il to-do afferma sui concorrenti.

**Finita quando:** il sito è pubblico, i pagamenti Stripe sono veri e non più in prova, e il post del lancio con il link è uscito. Che cosa viene dopo non è ancora detto.

## Le regole della tabella

- **Un numero non cambia mai.** Uno step nuovo prende il primo numero libero, qualunque sia la sua fase: la numerazione non è un calendario (il 26 e il 27 sono arrivati in gran parte prima del 25). Uno step può cambiare fase.
- **Ogni task sta in una sola riga.** Chi pianifica un task che serve a uno step lo scrive qui nello stesso commit; un task che non serve a nessun obiettivo può non avere step.
- **La colonna `task` è un elenco di id separati da spazi**, senza intervalli: `pipeline.mjs step --da-tabella` la legge così e ne copia il numero nella riga `- Step:` di ogni task del backlog (T231). Un altro testo nella colonna, o un id in due righe, ferma il comando prima che scriva.
- **`stato`** è uno di: `raggiunto` (i suoi task sono finiti e l'obiettivo si vede), `in corso` (almeno un task è fatto o in corso), `da fare`, `in attesa` (aspetta l'autore o un'altra fase).
- **Gli step da 1 a 9 sono quelli di prima**, riletti come obiettivi: 1-8 dalle chat archiviate ([`archivio/1-thread-unico/userchats/`](archivio/1-thread-unico/userchats/), [`archivio/2-step/userchats/`](archivio/2-step/userchats/)), e non hanno task perché il backlog non c'era. La chat `step0.md` è la creazione del progetto, prima del conto. I riferimenti a «step 8.2B» e simili negli ADR e nei commenti restano com'erano e indicano quelle sessioni.

## Gli step

| step | obiettivo | fase | stato | task |
|---|---|---|---|---|
| 1 | Il primo mondo: non tutto è rune, le mappe vengono da un modulo | I | raggiunto | — |
| 2 | Il mondo lo scrive Google Gemini | I | raggiunto | — |
| 3 | Luoghi senza cuciture e percorribili, pieni di contenuti | I | raggiunto | — |
| 4 | Si può chiedere qualunque azione: «Altro…», effetti, una runa per casella, magia | I | raggiunto | — |
| 5 | Rune come oggetti e frase, mana, regole dal Concilio, società degli NPC | I | raggiunto | — |
| 6 | Il mondo cresce e vive: due repository, atlante, vita degli NPC, corona come studio | I | raggiunto | — |
| 7 | Due tavoli: il Concilio è il Dungeon Master, niente meta-gioco, meccaniche nuove | I | raggiunto | — |
| 8 | Ciò che porta al 3D: menu delle caselle, pannelli, MarkovJunior provato e costi misurati | I | raggiunto | — |
| 9 | Il gioco è in 3D: ogni aspetto è un programma MarkovJunior | I | raggiunto | T01 T02 T03 T04 T05 T06 |
| 10 | Il mondo è coerente: canone, lessico, società, trame, grafo | I | raggiunto | T07 T08 T09 T10 T11 T12 T13 T65 |
| 11 | Il 3D si guarda bene: voxel luminosi e camera che gira | I | raggiunto | T14 T15 T55 |
| 12 | Il terreno ha altezze, mare e acqua che scorre | I | raggiunto | T16 T17 T51 T51b T57c |
| 13 | Le strutture hanno piani, scale, taglie, sotterranei; si salta | I | raggiunto | T52a T52b T53a T53b T54 T56a T56b T70 T92 T94 |
| 14 | Le rune sono codice: sequenze, effetti, rune nuove dal Concilio | I | raggiunto | T57 T57b T99 T115 T143 |
| 15 | La corona è uno studio abitato, dentro e fuori, visibile solo fuori dal tappeto | I | raggiunto | T18 T19 T20 T21 T22 T23 T24 T25 T26 T27 T28 T31 T32 T46 T47a T47b T48 T49 T50 T58a T58b T60 T63 T64 T113 T217 T218 T219 T220 T226 |
| 16 | Il gioco si chiama QUINE42 e si fa vedere | I | raggiunto | T59 T30 T141 |
| 17 | Si gioca in molti: kernel sul server, client sottile, master, tra viandanti, profilo | I | raggiunto | T29 T33 T34 T35 T36 T37 T38 T39 T39b T40 T41 T42 T42a T42b T42c T42d T42e T42f T43 T43a T43b T43c T44 T44a T44c T168 |
| 18 | Chi gioca ha un account e paga ciò che consuma: crediti, coefficienti, eredità, lobby, Stripe | I | raggiunto | T44b T45 T45a T45b T45c T45d T45e T75 T76 T77 T78 T79 T80 T93 |
| 19 | La pipeline porta avanti il lavoro da sola | I | raggiunto | T61 T62 T69 T71 T72 T81 T82 T83 T84 T85 T86 T87 T90 T96 T111 T118 T138 T208 |
| 20 | Il Concilio lavora anche sugli abbonamenti, con la coda | I | raggiunto | T68 T68a T68b T68c T73 T74 |
| 21 | Il sito: landing, profilo, sessioni, carte, crediti, tema | I | raggiunto | T97 T100 T101 T102 T103 T104 T105 T106 T107 T108 T109 T110 T112 T114 T116 T119 T135 T139 T186 |
| 22 | Si può mettere in rete: vulnerabilità chiuse, mondi isolati, server di produzione | I | raggiunto | T117 T120 T121 T122 T123 T124 T125 T126 T127 T128 T129 T130 T131 T132 T133 T134 T136 T137 T140 T142 T144 T145 T146 T147 T149 T150 T159 T165 T166 T167 T169 T170 T171 T172 |
| 23 | MarkovJunior si scrive e si legge a mano: l'editor del laboratorio (l'altro T59, vedi sotto) e la traccia in testo | I | raggiunto | T179 T206 |
| 24 | Un nome per ogni concetto, documenti in ordine | I | raggiunto | T66 T67 T178 T187 T188 T189 T190 T191 T192 T193 T194 T195 T196 T197 T198 T199 T200 T201 T202 T203 T204 T205 |
| 25 | Aggiungere il suono al gioco | I | raggiunto | T221 T222 T223 T224 T225 T227 T228 |
| 26 | L'Attore interpreta gli individui, se il master lo accende | I | raggiunto | T157 T158 T229 |
| 27 | Regge: test stabili e più veloci, cache delle forme, memoria, disco, git, prestazioni misurate | I | raggiunto | T91 T95 T148 T151 T160 T161 T162 T163 T164 T174 T175 T176 T177 T209 T210 T211 T212 T213 T214 T215 T216 |
| 28 | Si parla del lavoro per fasi, step e titoli dei task | I | raggiunto | T230 T231 T246 |
| 29 | La grafica a cartone | I | in corso | T89 T89a T89b T89c T89d T89e T98 |
| 30 | Lo Scultore scolpisce strutture con un metodo misurato sul banco | I | in corso | T154 T155 T173 T180 T181 T182 T258 T259 T156 T303 T313 T333 T334 T335 T336 T337 T338 T339 T340 T341 T342 T343 T344 |
| 31 | Quattro ambientazioni, generate senza browser dai crediti che avanzano | I | da fare | T152 T153 T207 T88 |
| 32 | Il kernel regge mesi di vita, e gli NPC agiscono davvero | I | in corso | T183 T245 T260 T261 T262 T263 T245a T245b T245c T245d T245e T245f T274 T280 T297 T298 T299 T300 T302 T312 T317 |
| 33 | Il rapporto aureo in HUD, pannelli e in ciò che si genera da qui in poi | I | da fare | T241 T242 |
| 34 | Pronti per la beta: server, guida, notizie, home, consumo in lobby, registro dei fallimenti del Concilio | I | in corso | T45f T232 T234 T236 T237 T238 T243 T244 T247 T248 T249 T250 T251 T252 T265 T283 T284 T285 T286 T287 T311 T316 |
| 35 | Il sito è il launcher del gioco | II | in attesa | T233 T235 |
| 36 | Il gioco in quattro lingue | III | in attesa | T239 |
| 37 | Altri universi: spazio, pirati, cowboy | III | in attesa | T184 T185 T278 |
| 38 | Il lancio | IV | in attesa | T240 |
| 39 | Gli NPC decidono e invecchiano | III | in attesa | T326 T327 T245g T245h T245i |
| 40 | Gli oggetti si vedono: in mano, addosso, sui mobili; i mobili si spostano | I | da fare | T288 T289 T290 T291 T292 T301 |
| 41 | I giocatori modificano le carte nei laboratori; le carte passano da un universo all'altro prima della Genesi | I | da fare | T293 T294 T295 T296 |
| 42 | L'inglese è la lingua interna: chi apre il repository lo legge | I | da fare | T306 T307a T314 T307b T308a T308b T309 T310 T310b |

La Fase II non ha ancora uno step per la beta stessa e la Fase III non ha quelli dei requisiti: uno step si apre quando ha dei task.

**Due task hanno lo stesso numero.** Nel backlog ci sono due blocchi `T59`: «Da Rune a QUINE42» (il primo, quello che dà `pipeline.mjs dossier T59`, nello step 16) e «Laboratorio: editor per modelli MarkovJunior» (obiettivo dello step 23). Un id può stare in una sola riga, quindi sta nello step 16.
