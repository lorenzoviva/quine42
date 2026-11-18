# ADR-0216 — La rigenerazione dei modelli di un universo, dalla coda degli abbonamenti

Data: 2026-11-18 · Stato: accettato (task T411 del backlog, step 31; richiesta dell'autore del 17/11) · Riferimenti: ADR-0143 (la
generazione differita), ADR-0177 (il generatore sui crediti che avanzano), ADR-0077 e ADR-0106 (la coda e il suo isolamento), ADR-0209 (le
strutture a 16 voxel per casella), ADR-0211 (timbri e ambienti tagliati per le strutture a 16), ADR-0213 (la casa che usa la Grande), ADR-0214
e ADR-0215 (lo Scenografo, la cantina arredata), ADR-0091 (le cantine), T391 (la CLI isolata con le immagini)

## Contesto

Gli universi di `universes/` (aurora, orichalcum, neapolis, sidera) sono stati fatti con Scultori di prima: a 20 voxel per casella, senza
Scenografo, molti modelli scritti a mano da Claude Cloud (T270, T273). L'autore (17/11) vuole rigenerarli, almeno i modelli, con lo Scultore
stabile e lo Scenografo base, sulla CLI di Claude Code con Opus 5.5, prima di leggerli e provarli (T153); lo stato di prima resta nella storia
git di ogni universo, con un tag. Il lavoro lo fa il generatore sui crediti che avanzano (ADR-0177).

Il nodo sono i lotti. Una struttura a 16 è un quarto più grande in caselle (una Grande 6,25 caselle, ADR-0209); i lotti di questi universi sono
tagliati per 20 (le case di 5 × 5 e 6 × 5 delle regole del Cartografo, i timbri di prima): riscolpita a 16, una Grande con la taglia scenderebbe
alla Media al caricamento (`claimSizes`, e lo Scultore ne scolpirebbe un'altra in gioco, sulle API), una senza taglia sporgerebbe dal lotto.

## Decisione

1. **Il comando**: `npm run genera -- <universo> --rigenera modelli [--tipi <id,…>] [--classi <classe,…>] [--modelli n] [--tetto %]
   [--modello <id>] [--sforzo <livello>]` (`regenerateUniverse` in `tools/generazione/genera.ts`). Apre l'universo come la generazione differita
   (l'archivio nel suo processo, il lucchetto, mai con un mondo acceso, solo un universo di questo kernel), che deve esistere; non chiede la Genesi
   (aurora, il seme con le sue mappe, non ne ha una). Il progresso in `universes/.generation/<nome>.rigenera-modelli.json`, separato da quello
   della generazione; il tetto, la misura della settimana da `/usage`, i passi scritti solo se validi (`StepGate`), la ripresa e gli arresti sono
   quelli di `runDeferred`, che prende i passi della modalità (`steps`). Aspetta fino a 2 minuti chi serve la coda (la pipeline li avvia insieme),
   poi si ferma: senza, ogni chiamata aspetterebbe un'ora.
2. **Quali tipi** (`regenerationTargets`): le voci di `models/index.json` che il mondo indossa (`wearersOf`: l'aspetto dei moduli, gli oggetti, le
   strutture dei piani di **tutti** i luoghi pianificati dell'universo, `plannedPlaces`, le case comuni) delle classi `furniture`, `structure`,
   `person`, `animal`, `beast` (`REGEN_CLASSES`: «strutture, mobili, figure»), in quest'ordine: i mobili prima, perché lo Scenografo sceglie fra
   loro. Mai i modelli del kernel (`kernelModel`: i generici delle classi, la corona, gli schermi, le parti `part-…`, i suoni), i corpi dei
   viandanti (`wandererModels`: le sezioni `<worn>` dei capi lavorano sulle sue lettere) né una carta portata da un altro universo (`brought`).
   Ciò che nessuno indossa resta: il catalogo del seme in un mondo moderno, per esempio. `--tipi` ne sceglie alcuni (la prova vera, T411).
3. **Cosa si chiede allo Scultore** (`requestOf`): ciò che chiede il `ModelDirector` per un tipo che manca, dal concetto e mai dal programma di
   prima (con `previous` lo Scultore salterebbe la composizione a blocchi): una struttura col suo concetto, la taglia della voce, la cantina della
   voce o di un piano che la chiede (`cellarFor`), l'abitazione per le case comuni (ADR-0213); un mobile o una figura con l'aspetto di chi lo
   indossa, o col nome della voce e l'elenco di chi la indossa quando sono molti (un modello di gente condiviso da sette mestieri non è uno di
   loro). La voce nuova tiene il nome; la scrive `addModel`, dal validatore, con la sua carta (`model.sculpt`); l'interno di prima si toglie.
4. **Lo Scultore stabile su Opus 5.5**: lo Scultore e l'Artista con `regenSculptors(REGEN_MODEL)` (ogni classe su `claude-opus-5-5`), lo
   Scenografo con il modello della coda; sforzo `low` (`REGEN_EFFORT`), come le misure di T406 e T413. Il giudizio e la revisione come in gioco
   (`sculptPlan` delle manopole dell'universo). Dopo ogni struttura che cresce a regole, il suo interno (`interno:<modello>`, `InteriorDirector.make`
   con l'autore detto).
5. **La coda dice modello, sforzo e immagini** (aggiorna ADR-0077 e il limite di T391): una richiesta può dire `model` (uno di `CLI_MODELS`, i
   modelli del listino di Anthropic) ed `effort` (uno di `CLI_EFFORTS`): `checkRequest` rifiuta il resto all'ingresso (la route e il disco),
   `serveOne` rilegge la richiesta prima di servirla e passa `--model`/`--effort` alla CLI (`CHOICE_RE` resta). `QueueAiModels` mette il
   modello della CLI che la chiamata nomina, altrimenti il suo (`model`), mai un modello delle API; senza, la CLI usa il suo, come prima. Le
   immagini di una richiesta (il giudizio dell'Artista, la revisione dello Scultore) vanno alla CLI come un messaggio di eventi
   (`--input-format stream-json`, `imageBlock`: solo data URL png e jpeg), la via del banco di T391; prima la coda le rifiutava. L'isolamento di
   ADR-0106 non cambia: cartella vuota, ambiente ridotto, nessuno strumento, la conferma dall'`init`.
6. **I lotti rifatti dove la taglia cambierebbe** (`regenerationPlan`, prima delle strutture, `ambiente:<id>`): per ogni ambiente con un luogo in
   cui una struttura riscolpita a 16 non starebbe nel suo lotto (le due misure del lotto almeno le caselle della struttura, arrotondate in su), la
   prima via che il validatore degli ambienti accetta (`validateLayout`) e con cui **nessun luogo perde una struttura** che i suoi lotti tengono oggi
   (`structureLotSizes`, il layout di `applyPlan` senza caricare il luogo, i lotti dati come `claimSizes`): il programma del **seme di oggi** dove
   l'universo teneva quello del seme di prima (T407 lo ha tagliato per 16; `keepEnvironments` lo lasciava); le **regole-scatola allargate**
   (`stretchBoxes`, `stretchRule`: una regola che disegna un edificio di almeno 5 di lato, il suo ingresso un codice solo, la sua uscita con muri e
   porte attorno, cresce di 20/16 e almeno a 7, ripetendo righe e colonne interne senza porte, la porta resta una; il nodo mette `steps` diviso per
   (20/16)², tanti edifici quanto terreno coprivano); le stesse **solo fino a 7** (`least`) se le più grandi non trovano posto; i **timbri a 16**.
   I piani dell'ambiente prendono `vpt: 16` (`savePlan`): i timbri si ritagliano (ADR-0211). Un ambiente già ritagliato da un giro non si ritaglia di
   nuovo. Se nessuna via va bene l'ambiente resta com'era.
7. **La densità** di ogni struttura riscolpita: 16 (la voce non dice `vpt`) se ogni lotto che la indossa dopo i lotti rifatti la tiene; altrimenti
   **20** (`vpt: 20`): gli stessi voxel (ADR-0209), la taglia che aveva, i lotti su cui stava. Nessuna struttura scende di taglia al caricamento
   per la rigenerazione.
8. **Un passo che fallisce** (una chiamata della coda che non torna, la CLI che sbaglia) ferma il giro senza scrivere niente del passo, come nella
   generazione differita, e conta nel progresso (`tries`); dopo `MAX_STEP_TRIES` (3) giri il passo si lascia e il resto va avanti (vale anche
   per la generazione). Uno Scultore che non trova un programma valido lascia il modello di prima (una mancanza, `noteShortfall`) e il passo è fatto.
9. **Il tag**: prima di ogni scrittura (anche della migrazione), la testa dell'universo prende `prima-della-rigenerazione`, una volta sola
   (`tagUniverse` di `server/universeStore.ts`, col git di `server/git.ts`): lo stato di prima resta nella storia, e un tag che c'è non si sposta.
   Ciò che la cartella aveva e la storia non ancora (i piani che l'archivio scrive senza commit, che il commit dopo porterebbe) si committa prima
   del tag, così il tag ha lo stato di prima intero.
10. **Il generatore** (ADR-0177): una voce di `config.json → generazione` con `"rigenera": "modelli"` lancia `generatore.comandoRigenera` (`npm run
    genera -- {universo} --rigenera {rigenera} --tetto {tetto}`), legge il suo progresso (`<nome>.rigenera-modelli.json`) e ha il suo posto nello
    stato (`<nome>:rigenera-modelli`): una generazione finita non ferma la rigenerazione dello stesso universo, né il contrario. L'elenco ha le quattro
    voci (aurora, orichalcum, neapolis, sidera, 25 % della settimana ciascuna); il generatore lo accende l'orchestratore.

## Cosa non cambia

La bibbia, i luoghi (nomi, descrizioni, cose, strutture chieste, i loro piani salvo `vpt`), le persone, gli ambienti che non ospitano una
struttura riscolpita, i modelli del kernel, le carte portate. La generazione differita senza `--rigenera` fa ciò che faceva (più i tentativi del
punto 8). La coda del gioco: senza `model` né `effort` la CLI usa i suoi, come prima.

## Scartato

- **Rifare gli ambienti col Cartografo**: un compito nuovo, i suoi prompt e il suo costo per ogni ambiente; per ora gli ambienti si ritagliano
  senza chiamate. Dove nessuna via meccanica tiene le strutture (due ambienti di sidera), resta una proposta.
- **Lasciare che la taglia scenda** (`claimSizes`) o che la struttura sporga: una Grande diventerebbe una casetta di 2,5 caselle, scolpita in
  gioco sulle API.
- **Riscolpire dal programma di prima** (`SculptRequest.previous`): lo Scultore salterebbe la composizione a blocchi e il programma di Claude
  Cloud farebbe da scheletro.
- **Una densità per luogo**: il kernel ne ha una per voce; una per istanza toccherebbe forme, cache, collisioni, renderer e filo.

## Conseguenze

- I quattro universi (prova a secco, `regenerationPlan` sui loro piani): aurora 5 tipi (4 mobili e la contadina), nessun ambiente toccato;
  orichalcum 20 tipi (5 mobili, 13 strutture con la casa comune, 2 figure), 12 ambienti ritagliati (i timbri a 16, il borgo dal seme), 2 strutture
  a 20; neapolis 10 tipi (9 mobili e la casa comune), 17 ambienti ritagliati; sidera 20 tipi (6 mobili, 13 strutture, il colono), 4 ambienti
  ritagliati e 2 tenuti (allargati, un luogo perderebbe la sua struttura), 7 strutture e la casa comune a 20.
- neapolis si apre oggi come «aurora» (seme 1337): un salvataggio del 06/11 ha riscritto il suo `universe.json`, e i 19 luoghi di T273 con le
  strutture (`neapolis_1990_…`) non si leggono più; la rigenerazione riscolpisce ciò che il mondo che si apre indossa. Da riparare a parte.
- **La prova vera** (18/11, una copia di orichalcum, `--tipi struttura-palazzina-degli-inventori`, la CLI di Claude Code con Opus 5.5 a sforzo
  `low`): l'ambiente `quartiere_telai` ritagliato coi timbri a 16 (6 luoghi, le 2 strutture tenute), la palazzina riscolpita in 7 chiamate (i due
  blocchi, due correzioni dei controlli, il giudizio dell'Artista con le foto, la revisione, il secondo giudizio: 6/10), a 16 e arredata dallo
  Scenografo (6 regole, 1 chiamata), 9 minuti in tutto. Token: 114 927 in ingresso, 35 084 dalla cache, 44 787 in uscita, almeno 1,36 $ al listino
  di Opus 5.5 (senza i token che la CLI scrive nella cache del prompt: il servitore della coda di quella prova non li contava, `extractUsage` ora
  sì; T413 misurava una casa di Opus 1,18-1,64 $ con quelli); il contatore della settimana è salito di 1 punto (75 → 76 %, con altri agenti al
  lavoro), la finestra delle 5 ore di 7 (14 → 21 %). Con il rapporto di T303 e T406 (circa 4,8 $ a punto di settimana) una struttura vale circa
  0,3-0,4 % della settimana; il punto intero del contatore è il tetto.
- **La stima per universo** (una struttura 1,4-1,7 $, un mobile circa 0,5 $ con due programmi e due giudizi, una figura circa 0,7 $): orichalcum e
  sidera circa 25 $ ciascuno (5-6 % della settimana; al più 15-16 % contando un punto intero per struttura), neapolis circa 6 $ (1-4 %), aurora
  circa 3 $ (1-2 %); circa 2,5 ore ciascuno per orichalcum e sidera. Tutti sotto il tetto di 25 %.
