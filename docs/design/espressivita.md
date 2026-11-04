# L'espressività del kernel (T183)

Una misura, non un progetto: quanto regge oggi il kernel di ciò che il Concilio potrebbe chiedere, e quanto costa aggiungere dopo ciò che manca.
**Nessuna primitiva qui è nel gioco**: sono proposte, da approvare. Le prove sono in `tests/espressivita/`, con moduli veri in `tests/espressivita/moduli/`; `src/kernel/` non è stato toccato.

## In breve

1. **La premessa «non si può introdurre a posteriori» è quasi sempre falsa.** Sei semi del progetto, il più vecchio del 20/10, e l'universo giocato `valmora` del 22/10 si aprono sul kernel di oggi senza un guasto, con i loro piani. Una primitiva vera, il magazzino del mondo, messa su un kernel di domani nel test, non tocca l'universo di prima e i suoi dati sopravvivono alla riapertura. **Nessuna delle modifiche misurate chiede un wipe.**
2. **Tre cose non sono aggiuntive**, e si possono fare male senza accorgersene: cambiare ciò che è derivato e non salvato (con un altro caso l'8,9 % delle caselle cambia sotto gli stessi piani), togliere o cambiare di senso un'API, mettere una funzione nuova in un file che l'universo può aver riscritto (l'effetto nuovo non accade e nessuno lo dice).
3. **Ciò che manca di più non è un gesto, è la memoria.** In una sessione, da solo, un modulo fa quasi tutto: 10 scenari su 13 riescono per intero e 3 in parte. Dopo una riapertura ne restano interi 2, e 3 in parte: da Lua durano solo le caselle cambiate e gli stati del viandante. In multigiocatore un pannello non arriva al client e i tasti di un viandante non arrivano ai sistemi.

**Prime tre primitive per scenari sbloccati:** il magazzino durevole (`D`, 20 su 39), i campi dei pannelli al client (`W`, 15), gli eventi (`E`, 9). Prima della versione pubblica però servono `D`, `W` e i comandi di ogni viandante (`K`, solo 4 scenari, ma senza non si guida niente in multigiocatore).

## Come si è provato

- `tests/espressivita/banco.ts` fa ciò che fa la Fucina delle meccaniche: `cleanPanel`, `validateForged` con `system: true`, `cleanCases`, poi `runBenchCase` → `runCase` con `MockAiModels`.
- `scenari.test.ts`: gli scenari nel kernel in miniatura.
- `durata.test.ts`: un kernel intero che si chiude e si riapre dai suoi file e dai suoi piani. Il banco dura pochi secondi senza riaperture e non può rispondere a domande di mesi. Le prove dei limiti hanno `LIMIT` nel titolo.
- `aggiunte.test.ts`: universi dalla storia git del seme, e con `QUINE_UNIVERSO_VECCHIO=<cartella>` un universo giocato, letto e mai scritto.
- `dopo.test.ts`: un kernel di domani costruito nel test (`vi.mock` del preludio, `Host` e salvataggio estesi sul prototipo), e un kernel col caso cambiato.

**Non provato**, perché si vede solo a schermo: camera, grafica, la resa di ogni scenario, se il viandante sembri seduto sulla barca. Tutto è girato con modelli offline; nessun Ingegnere vero ha scritto questi moduli, quindi la colonna «L'Ingegnere» è un giudizio sul suo prompt, non una prova. Il multigiocatore è provato sul kernel del server e sul filo (`fakeLink`), non con due browser.

## Scenari per primitiva

Gli scenari provati in codice. Le colonne dicono se lo scenario regge lì, per intero (●), in parte (◐) o no (○).

| Scenario | Modulo | Da solo, in una sessione | Dopo una riapertura | In multigiocatore | Dove si ferma, genere | L'Ingegnere |
|---|---|---|---|---|---|---|
| Barca | `mech.barca` | ● | ○ | ○ | Il sedile è a mano: si riscrive `pos` a ogni tick, perché il passo non scende sotto 0,2. Sul server nessun tasto. **Movimento, multigiocatore** | con due righe: il prompt non spiega `pos` contro `world.player_pos()` |
| Mongolfiera | `mech.mongolfiera` | ◐ | ○ | ○ | La logica c'è, la quota no: `settleHeights` cancella `pos.z` a ogni tick. **Movimento, camera** | la logica sì, la quota nessuno |
| Fucile | `mech.fucile` | ● | ◐ | ◐ | Proiettile vero, si ferma ai muri. I colpi nel caricatore non durano. Mira solo nelle 4 direzioni di `facing`, F non si legge (`input.held` vede solo WASD), niente suono. **Proiettili, input** | sì; `free_real` e `facing` mancano nel prompt |
| Computer anni 90 | `mech.computer` | ◐ | ○ | ○ | Un menu su 4 righe e 4 tasti funziona; non si scrive, e un'entità non apre un pannello. **Pannelli** | sì, come menu |
| Bisca | `mech.bisca` | ● | ◐ | ◐ | Puntate, ruota con il suo tempo, ronda, stesso esito in ogni kernel. Il sospetto non dura; i campi non arrivano al client. **Pannelli, stato condiviso, multigiocatore** | sì |
| Sport 1 contro 1 | `mech.partita` | ● | ○ | ○ | Contro un NPC gira. Tra due viandanti il sistema non sa i tasti né dove sia l'altro nel mondo. **Multigiocatore, input** | sì contro un NPC |
| **Cantiere** (mesi) | `mech.cantiere` | ● | ● | ◐ | Vedi sotto. **Stato durevole, tempo, aspetto** | sì per caselle, se conosce il trucco |
| Mercato | `mech.mercato` | ● | ○ | ◐ | Il prezzo torna a quello del manifest. **Stato durevole** | sì; `singleton` non può, serve `ecs.spawn` al primo uso |
| Legge e fazioni | `mech.fazioni` | ● | ○ | ◐ | Il reato si vede contando a ogni tick: nessun evento dice cosa è successo né chi è stato. **Eventi** | sì |
| Stagioni | `mech.stagioni` | ● | ● | ◐ | Il calendario è una funzione di `time`, che dura. La neve va messa casella per casella e resta per sempre in `plan.edits`. **Tempo, aspetto** | sì |
| Torneo a turni | `mech.torneo` | ● | ○ | ◐ | Turni e tabellone di tutti funzionano; il tabellone non dura e non arriva al client. **Turni, stato condiviso** | sì |
| Carro con più persone | `mech.carro` | ◐ | ○ | ◐ | Porta più corpi di quanto si sposta, ma solo un viandante ha i tasti. Il `passo` del client può contraddirlo: letto in `server.ts`, non provato. **Movimento, multigiocatore** | sì in parte |
| Costruzioni del viandante | `mech.posa` | ● | ◐ | ◐ | Il muro dura, il mobile sparisce, nessuno dei due dice chi l'ha fatto. **Stato durevole** | sì |

**Totale:** da solo in una sessione 10 interi e 3 in parte; dopo una riapertura 2 interi (cantiere, stagioni) e 3 in parte (fucile, bisca, costruzioni); in multigiocatore nessuno intero. Ciò che dichiaro possibile ha un test; `◐` e `○` in multigiocatore derivano da due prove (`LIMIT (multiplayer)`) e da ciò che ogni modulo usa, non da una partita per modulo.

### Il cantiere: l'edificio in una sessione lunga mesi

**Riesce, per caselle, e senza un wipe.** Muratori NPC prendono un pezzo dalla catasta, camminano, lavorano, posano: prima la platea, poi i muri, poi porta e pavimento, in quest'ordine. Il mondo si chiude a metà, si riapre e il lavoro riprende dal punto giusto, perché **lo stato del lavoro è il lavoro stesso**: una casella posata dura (`plan.edits`). Se il materiale manca il cantiere lo dice e aspetta; se i muratori muoiono ne cerca un altro. Il tempo del mondo dura anche lui (`stato.json → ora`), provato portando l'orologio a 270 giorni di gioco, non giocandoli.

Dove si ferma, ed è ciò che serve a T245:

| Manca | Prova | Genere | Entra senza wipe? |
|---|---|---|---|
| Il contatore del cantiere, chi lavora a cosa, gli accordi: tutto ciò che non è una casella | `placed(second) === 0` | stato durevole | sì, `D` |
| Crescere per **forme**: tetto, piani alti, un modello a tappe. Lua può scrivere `form.done` ma non viene salvato; il kernel salva solo le azioni fatte da lui | `LIMIT … shape of an instance` | aspetto | sì, `F`: le `<action>` di un modello ci sono già, manca il comando |
| Lavorare **dove nessuno guarda**: `world.set_tile` su un luogo non caricato dice no, e un luogo lontano per Lua non esiste | `LIMIT (out of sight)` | fuori vista | sì, `O` |
| Il tempo a mondo spento: `time` si ferma con il mondo, un mese di calendario è un mese di gioco | letto in `kernel.tick` | tempo | sì, ed è una decisione più che una primitiva |
| Mostrarlo al banco: i luoghi del banco non sono mai pianificati, `set_tile` dice no, e un caso che guarda il terreno viene scartato | `LIMIT (the bench)` | Fucina | sì, `Y` |
| Chiedere al Narratore il prossimo passo: da Lua non si chiede niente al Concilio | `LIMIT (Council)` | Concilio | sì, `R`, con superficie nuova |

Un trucco che non è una primitiva: con un edificio funzione pura del tempo (la casella *i* è posata se `time ≥ T0 + i·passo`) il cantiere si «recupera» da solo al ritorno, ma non può reagire a nulla, né al materiale né a chi muore.

## Il catalogo

39 scenari, scelti per coprire generi diversi. **Oggi**: ● provato in codice, ◐ riesce solo in parte, ○ manca qualcosa di essenziale; senza «provato» è un giudizio dal codice. Per le primitive, vedi le lettere nel paragrafo dopo.

| # | Scenario | Genere | Oggi | Primitive |
|---|---|---|---|---|
| 1 | Barca a vela col vento | movimento | ● provato | Q K X |
| 2 | Mongolfiera | movimento, camera | ◐ provato | Q C |
| 3 | Fucile | proiettili | ● provato | I X W |
| 4 | Computer anni 90 | pannelli | ◐ provato | U W D |
| 5 | Bisca clandestina | pannelli, stato | ● provato | W D |
| 6 | Sport inventato, 1 contro 1 | multigiocatore | ● provato contro NPC | K W I |
| 7 | Cantiere: un edificio in mesi | tempo, stato, aspetto | ● provato per caselle | D F O Y R |
| 8 | Mercato con prezzi che durano | stato durevole | ◐ provato | D W |
| 9 | Leggi e fazioni, reati e taglie | eventi | ● provato | E D W |
| 10 | Costruzioni dei giocatori | stato durevole | ◐ provato | L F D W |
| 11 | Stagioni | tempo, ambiente | ● provato | A W |
| 12 | Carro con più persone | movimento, multigiocatore | ◐ provato | Q K W |
| 13 | Torneo con tabellone | turni | ◐ provato | D W |
| 14 | Città che cresce per mesi | crescita | ○ | L O R D |
| 15 | Banca, prestiti e interessi | stato durevole, tempo | ◐ | D W |
| 16 | Lettere tra viandanti che non si incontrano | stato durevole, multigiocatore | ○ | D U W |
| 17 | Elezione del sindaco | stato condiviso, eventi | ◐ | D E W |
| 18 | Epidemia tra gli NPC | fuori vista | ◐ | O D E |
| 19 | Famiglia ed eredità col viandante | legami, stato durevole | ◐ | D L E |
| 20 | Ufficio con colleghi e orari (T245) | NPC, tempo | ◐ | D N O |
| 21 | Caccia: animali che fuggono | NPC | ◐ | N E |
| 22 | Furtività: guardie che vedono | vista | ◐ | N X |
| 23 | Treno con orario tra luoghi lontani | fuori vista, movimento | ○ | O Q L |
| 24 | Ascensore, piattaforma che si muove | movimento | ○ | Q |
| 25 | Scacchi tra due viandanti | pannelli, turni | ○ | U W D |
| 26 | Libro scritto dal giocatore | pannelli, stato durevole | ○ | U D |
| 27 | Teatro: gli NPC recitano, la scena si inquadra | camera | ○ | C X E |
| 28 | Concerto: un NPC suona un brano | suono | ○ | X |
| 29 | Temporale e alluvione | ambiente | ◐ | A X |
| 30 | Drago su più caselle (`radius` ≤ 0,6) | corpi, aspetto | ○ | Q F |
| 31 | Guerra: fronte che si muove, luoghi conquistati | fuori vista, Concilio | ○ | O D L R |
| 32 | Pesca, con pesci che finiscono | stato durevole | ◐ | D |
| 33 | Giornale del mondo su ciò che accade | Concilio, eventi | ○ | R E D |
| 34 | Gravità che cambia per un mese in tutto il mondo | regole del kernel | ○ | Q A |
| 35 | Magia che riscrive il terreno per sempre | effetti | ● | — |
| 36 | Portali | movimento | ● | — |
| 37 | Prigione che tiene il viandante | movimento, eventi | ◐ | Q E |
| 38 | Fornaio: forno, ricette, clienti, tutto il giorno | NPC | ◐ | N E Y |
| 39 | Regata con traguardi e classifica | multigiocatore | ◐ | K W D |

Gli scenari 35 e 36 non hanno un modulo di prova: li coprono gli effetti `terreno` e `rilievo` già nel gioco e il fatto, provato sulla barca, che `pos` si riscrive.

## Le primitive proposte, per quanti scenari sbloccano

| Lett. | Primitiva | Scenari | Genere | Cosa farebbe |
|---|---|---:|---|---|
| D | **Magazzino durevole** | 20 | stato durevole | `world.store_get/set`: dati per modulo in un file del mondo, salvati con la partita; una versione per viandante |
| W | **Campi dei pannelli al client** | 15 | multigiocatore | I `campo` nominati dai `manifest.ui` viaggiano in `MyState`: un elenco, come vuole la regola 8f |
| E | **Eventi** | 9 | eventi | `M.on_event(nome, dati)`: morte, rottura, azione, con chi è stato. Oggi `bus.emit` non ha ascoltatori in Lua |
| Q | **Corpi: quota, sedile, stazza** | 8 | movimento | Quota libera non cancellata da `settleHeights`; `body.portato_da`, valido anche sul client; corpi più larghi |
| O | **Fuori vista** | 6 | fuori vista | `M.on_return(luogo, trascorso)` per recuperare al ritorno; caselle di un luogo non caricato |
| X | **Effetti e suono da Lua** | 6 | aspetto | `fx.play(id)`, `sound.play(id)`, un evento al client (ADR-0126: il suono resta del client) |
| L | **Cose posate che durano** | 5 | stato durevole | `world.place(modulo, x, y)` scrive in `plan.objects`, con i componenti che dichiara `persist` |
| K | **I comandi di ogni viandante** | 4 | multigiocatore | Tasti tenuti e posizione nel mondo di ognuno visibili a un sistema (`world.wanderers()`, `input.held(azione, id)`) |
| U | **Pannelli ricchi** | 4 | pannelli | `ui.open` da un'entità, griglia, testo libero, lista che cambia. Oggi 16 elementi fissi, nell'inventario |
| R | **Chiedere al Concilio** | 4 | Concilio | `council.ask(tema)`, entro un coefficiente e con chi paga (regole 8e, 8i) |
| N | **Percorsi e vista** | 4 | NPC | `world.path`, `world.los`. In Lua si possono scrivere, ma il budget del tick è di tutti |
| F | **Aspetto d'istanza** | 3 | aspetto | `world.form_do(id, azione)`: un'`<action>` da Lua, salvata come quelle del kernel |
| A | **Ambiente** | 3 | ambiente | Tinta di terreno e luce, meteo, `world.daylight()`, senza scrivere in `plan.edits` |
| I | **Input e mira** | 2 | input | `input.pressed`, la direzione del mouse |
| C | **Camera** | 2 | camera | Seguire, inquadrare, scuotere, entro la regola 8. Non provabile senza schermo |
| Y | **La Fucina più larga** | 2 | Fucina | Sistema, entità e `singleton` in un colpo; casi su luoghi pianificati. Oggi un solo sistema, e il prompt non spiega `free_real`, `facing`, `pos` |

## Il costo di una primitiva aggiunta dopo

Misurato caso per caso. «Prova» è il test che lo dice.

| Cosa cambia | Cosa succede a un universo esistente | Wipe? | Prova |
|---|---|---|---|
| **API Lua in più** | Niente: i moduli non la chiamano, un nome locale uguale resta suo. Con il preludio esteso, `Host`, validatore e salvataggio, i dati di un modulo nuovo durano | **no** | `dopo.test.ts` |
| **Campo nuovo nel manifest** | Il validatore lo lascia passare e resta nel file | **no** | `aggiunte.test.ts` |
| Campo nuovo in un manifest **riscritto** dall'universo | **Non arriva**: `upgradeFromSeed` porta solo `tiles layouts runes spells`. Il kernel deve reggere il campo assente | no, ma trappola | `TRAP: a field the seed adds` |
| **Campo nuovo nel salvataggio** | Avanti funziona. `saveState` riscrive l'oggetto da zero: ciò che non conosce si perde al salvataggio dopo, quindi tornare a un kernel precedente cancella i dati nuovi | no, ma trappola | `TRAP: in the saved state` |
| **Effetto nuovo** | Arriva con `core.effects` intatto. Se l'universo l'ha riscritto, il kernel lo accetterebbe e **non accade nulla, senza guasto** | no, ma trappola | `TRAP: in a universe that rewrote` |
| **Nodo MJ nuovo** | Aggiuntivo: i programmi già scritti non lo usano; chi non lo conosce lo rifiuta col nome e il mondo resta in piedi | **no** | `a new node of MarkovJunior` |
| **Formato di file** | Una migrazione alla lettura, già fatta quattro volte: `viandante` → `giocatori/`, `importanti` → `rari`, `crediti` tolti, `buildings` → `lots` | **no**, se resta il codice che legge il vecchio | `wanderers.test.ts`; T205; `valmora` |
| **Caso, MJ, `layout`, `generate_chunk`** | **Non aggiuntivo.** I luoghi non sono salvati come caselle: si ridisegnano da piano e seme. Con `hash32` cambiato, **l'8,9 % di 5184 caselle** in 16 luoghi è diverso sotto gli stessi piani; le modifiche restano, salvate per indice, ma ora stanno dove il disegno è un altro | no, ma il mondo cambia sotto i piedi | `MEASURE` in `dopo.test.ts` |
| `hashStr` | Fa parte della chiave di ogni piano (`worldSignature`): cambiarlo orfana tutti i piani, che si rifanno e **si ripagano** | quasi | letto in `kernel.ts`, non misurato |
| **API tolta o cambiata di senso** | Ogni modulo che la chiama va in guasto, e **con un guasto aperto il mondo non salva nulla** finché non lo ripara l'Ingegnere | no, ma è la peggiore | `TRAP: every module that calls it` |

### Gli universi di prima, davvero

| Universo | File | Dal seme di oggi | Nuovi | Guasti, così com'è e aggiornato |
|---|---:|---:|---:|---|
| `81ab943` (20/10) | 37 | 132 | 104 | nessuno |
| `6f2d8df` (20/10) | 55 | 121 | 85 | nessuno |
| `21c5ff4` (23/10) | 86 | 76 | 53 | nessuno |
| `7ced571` (26/10) | 111 | 47 | 28 | nessuno |
| `848a088` (29/10) | 115 | 43 | 24 | nessuno |
| `0d773f2` (01/11) | 115 | 30 | 24 | nessuno |
| `valmora` (22/10, giocato) | 236 + 301 piani | 106 | 85 | nessuno; 16 luoghi su 16 dai piani salvati; `ora` 4577 s |

Nella suite ne restano tre (`6f2d8df`, `7ced571`, `0d773f2`), per non allungarla; gli altri sono stati misurati una volta con lo stesso codice. `valmora` si ripete con `QUINE_UNIVERSO_VECCHIO=<cartella> npx vitest run tests/espressivita/aggiunte.test.ts`: è letto in memoria, e su disco non è cambiato nulla (`git status` vuoto dopo la prova).

In questi quindici giorni il kernel ha avuto i modelli, i lotti, il rilievo, l'acqua, il suono. Limiti della misura: un seme della storia non ha una partita dentro, e di universi giocati ce n'è uno solo; questo test con Mock non dice se quel mondo si **giochi** bene (T205 ha visto l'Arbitro ritirare 16 moduli all'apertura, col vecchio codice come col nuovo).

## Divisione delle primitive

**Da avere prima della prima versione pubblica.** Non perché dopo non si potrebbe, salvo la prima: perché senza, chi spende su un universo perde qualcosa ogni giorno.

1. **Fissare ciò che è derivato: i luoghi salvati come caselle** (`plan.tiles`, scritto la prima volta che un luogo si apre). È l'unica vera scadenza: deve uscire *prima* del primo cambio di caso o di MJ, altrimenti l'universo vecchio non ha più modo di sapere com'era. Stessa cosa per il rilievo, da verificare.
2. **`D`, il magazzino durevole.** Aggiuntivo, ma ogni meccanica forgiata prima nasce smemorata.
3. **Il salvataggio che non si ferma**: oggi un guasto qualsiasi, anche di un giocatore, ferma tutti i salvataggi. La regola 6 dice che si committano solo stati validi, quindi qui serve una decisione dell'autore: la proposta è che un guasto a runtime di un modulo non renda invalidi i dati della partita, solo il codice. In una vita di mesi è la perdita più probabile.
4. **`W` e `K`**, se la versione pubblica ha il multigiocatore: senza, nessuna meccanica con un pannello si legge e nessun veicolo si guida.
5. **Il salvataggio che conserva ciò che non conosce** (`stato.json`, `giocatori/`): costa poche righe, e dopo un kernel sbagliato sarebbe tardi.
6. **Effetti nuovi nel kernel, non in `core.effects`**, come `rilievo` (ADR-0094); oppure un guasto chiaro quando un `tipo` non ha chi lo applica.

**Aggiungibili dopo senza danno**, in ordine di scenari: `E Q X O L U R N F A C I Y`. Consiglio `E` ed `L` subito dopo, e `F` e `O` con T245. `R` è anche una decisione sui costi.

**Le regole perché un kernel cambi senza wipe** (proposta; se approvate, ADR e `AGENTS.md`):

1. **L'API di Lua e gli effetti crescono e basta.** Non si toglie e non si cambia di senso nulla: ciò che si ritira resta come funzione che non fa niente.
2. **Ciò che è derivato o è salvato o è congelato.** Caso, hash, MJ, `layout`, `generate_chunk` sono un formato su disco: cambiarli è una migrazione, non un ritocco. Un test di non regressione tiene ferme le caselle di un luogo campione.
3. **Si legge il vecchio per sempre, si scrive il nuovo.** Ogni formato ha la sua migrazione alla lettura e un universo di prova; `tests/espressivita/aggiunte.test.ts` ne apre già tre a ogni esecuzione.
4. **Ciò che non si conosce si conserva.** Campi ignoti nei manifest e nei salvataggi non si buttano.
5. **Il kernel regge il campo assente.** Un universo può aver riscritto un manifest: ogni campo nuovo ha un valore predefinito nel kernel, non nel seme.
6. **Una funzione nuova non vive in un file che l'universo può riscrivere**, oppure ne controlla la presenza.
7. **Una versione dichiara ciò che le serve** (`universe.json → kernel`, che oggi non c'è): serve a dire «questo universo è più nuovo di te» invece di rovinarlo.

Con queste regole le versioni «finali» del kernel diventano una sola, quella che fissa i luoghi: il resto è crescita.

## Ciò che nasce solo col tempo

Misure di passaggio, non primitive; da tenere d'occhio in T245.

- `consumati` tiene gli ultimi 5000 (`slice(-5000)`): oltre, ciò che era stato preso torna (letto in `saveState`, non provato).
- `plan.edits` non si svuota mai: ogni casella toccata resta, anche rimessa com'era; le stagioni per caselle la gonfiano ogni anno per ogni luogo visto (`seasons` in `durata.test.ts`).
- `valmora`, in 76 minuti di mondo: 851 commit, `.git` di 63 MB, `people.json` di 142 KB. I commit e i MB comprendono le vecchie immagini (ADR-0037 le ha tolte), quindi **non vanno estrapolati**; il ritmo di oggi è da misurare su un universo nuovo.
- Salvataggio ogni 2 minuti di gioco, un commit se qualcosa è cambiato.

## Proposte di contenuti

Non servono al gioco per ora; tre valgono un task se l'autore le vuole:

- **Il cantiere**: è T245, ed è il primo uso vero di `D`, `F`, `O`.
- **Il terminale**: un computer che legge file è già un mondo fatto del proprio codice sorgente; con `U` e `D` diventa una via di mezzo fra le rune e la corona. Da pensare con la regola 0: dentro il mondo è solo un terminale del suo tempo.
- **La bisca**: con `D` è il primo piccolo esempio di economia con la legge intorno, e sta tutta nei moduli.

## Sicurezza

I test non aggiungono superficie: nessun file di `server/`, `src/session/`, della sandbox, del validatore o dei crediti cambia. Le primitive ne aprirebbero: `D` un tetto ai byte per universo e per modulo, e un posto fuori da `publicFiles`; `W` e `K` un elenco, regola 8f; `R` costi e chi paga, regole 8e e 8i; `world.wanderers()` quanto un modulo può sapere degli altri; `O` il lavoro di un luogo non caricato sul budget del tick.
