# ADR-0247 — Le strutture del mondo si vestono di nuovo con un seme del luogo, e i programmi nuovi delle strutture hanno un tetto orario

Data: 2026-11-22 · Stato: accettato (task T495 del backlog, risposta dell'autore a D69 del 22/11) · Riferimenti: ADR-0043 (le strutture dei
lotti), ADR-0055 (i semi condivisi), ADR-0133 (le regolazioni fissate entrando), ADR-0157 (`model.reuse`, Jev), ADR-0160 (le strutture che
crescono a regole, più taglie e più semi), ADR-0170 (le carte portate), ADR-0245 (il raggio)

## Contesto

Dopo il raggio (ADR-0245) il cammino della prima run costa circa 6 $ l'ora a pieno dettaglio, di cui circa 4 di Scultore delle strutture:
ogni luogo raggiunto porta una struttura di un concetto suo («Capannone di stoccaggio delle chiatte»), lo Scultore ha sempre una struttura in
raggio da scolpire (cinque chiamate di Argon e l'Artista, 0,27-0,35 $ l'una). Nei 291 piani nuovi della run di `orichalcum` ci sono 281
strutture di **234 concetti diversi**, molti dello stesso genere (dieci «rimessa dei palombari», tre «officina di smantellamento», «capanno»,
«deposito» e «magazzino» a decine), mentre il mondo aveva già una ventina di strutture che crescono a regole. Il Cartografo non le vedeva: gli
si offrivano solo quelle portate con le carte (T295). L'autore credeva il riuso già fatto: i programmi MarkovJunior delle strutture sono
variabili apposta (ADR-0160), un seme è un altro edificio dello stesso genere (D69.2). `model.reuse` (T349, Jev) decide solo prima dello
Scultore, per una richiesta già fatta. La leva «le strutture solo dove ci si ferma» è rifiutata (D69.1); un tetto di programmi nuovi l'ora sì,
solo per i programmi nuovi, mai per il riuso con un seme nuovo (D69.3).

## Decisione

1. **Le strutture del mondo** (`src/kernel/reuse.ts`, puro, `reusableStructures`): le voci della libreria che un piano veste per concetto (le
   `struttura-…` dello Scultore, ADR-0043) e quelle venute con le carte, di classe `structure` o `building`, col programma; mai una parte, una
   parte del mondo, una casa comune né un edificio della corona; un programma del seme com'è (`seed.json`) solo in un mondo della sua epoca
   (`seedAged`), così un mondo steampunk non si vede offrire la locanda di Valmora. Per concetto (`sameName`): le taglie a cui si vestono
   senza chiamate (le sue, e da Grande in su quelle di un programma che scala), la cantina, in quanti luoghi (il registro delle carte).
2. **Il Cartografo le vede** (`PlanContext.known`, `Kernel.knownStructures`, `reuseLines`): al più 40, le meno usate prima, delle taglie rare
   solo quelle che il luogo può ancora avere; ne sceglie una quando sta bene scrivendone il concetto esatto e una taglia; un concetto nuovo
   solo quando nessuna va, circa un luogo su dieci (indicativo, nel prompt: non un tetto). Flash-Lite vero, così, riusa sempre e quasi sempre
   la stessa (sotto): sotto il tetto, dopo `FRESH_EVERY` (10) piani senza un concetto nuovo (`Kernel.plansSinceFresh`, un conto, mai
   l'orologio) il kernel lo invita a dare al luogo seguente una struttura sua, nuova (`freshWanted`). Un concetto che è l'inizio del nome di
   una struttura del mondo in almeno quattro parole, o il contrario, è quella struttura (`reusableOf`, `SHORT_NAME_WORDS`): i nomi dello Scultore
   sono lunghi e Flash-Lite li accorcia.
3. **Il kernel la veste con un seme suo** (`wearAgain`, sul piano nuovo prima di salvarlo): il concetto come lo dice la libreria, la taglia
   più vicina che ha (`nearestSize`; poi `claimSizes` le dà la più grande che ha e che il lotto tiene), il seme dal seme del mondo, dal luogo
   e dal posto della struttura nel piano (`PlanStructure.seed`, `reuseSeed`: da 5 a 4100, oltre i quattro che lo Scultore ha provato; mai
   dall'orologio né dall'ordine in cui le cose accadono, ADR-0055), scritto nel piano e quindi lo stesso a ogni caricamento e su ogni
   macchina. Il lotto la veste a quel seme (`lotsOf`, `structure.seed`, anche quando passa dal generico al suo modello). Una struttura con la
   cantina e una carta portata tengono il seme del loro lotto (`newSeedFor`): la misura dei semi (sotto) dice che oltre il quarto cade più
   spesso il controllo della cantina, e una carta che fallisse a un seme nuovo si isolerebbe per tutto il mondo (ADR-0172). Niente Scultore
   né Artista: il modello c'è; un'altra taglia di un programma che scala la copia il `ModelDirector` senza chiamate (`shareWith` con gli id
   della struttura, qualunque siano).
4. **Il tetto orario dei programmi nuovi** (`ai.newStructuresPerHour`, 2 se non detto, `BUDGET_SCALE` 0-60): un budget della lobby, che il
   master alza o abbassa prima di entrare e che resta fermo a partita in corso (regola 8b-bis, come ogni `ai`); nel censimento la riga
   `model.sculpt` lo nomina (`tetto`). Due contatori sull'ora del mondo (`StructureHour`, 3600 s di `kernel.time`, della sessione come gli
   altri budget): i concetti nuovi che i piani portano (`Kernel.structureHour`) decidono se il Cartografo può chiederne un altro
   (`newStructureAllowed`); al tetto riceve solo le strutture del mondo e lo schema lascia passare solo i loro concetti, come gli ambienti (o
   nessuna struttura, se il mondo non ne ha: i lotti hanno le case comuni). E il `ModelDirector` non comincia più programmi nuovi di strutture
   dei piani di quanti ne dice l'ora (`programs`, `overHour`, `noteProgram`): una struttura oltre aspetta col generico della sua classe, il resto
   va avanti. Non contano mai: il riuso con un seme nuovo, ciò che dà la libreria (`model.reuse`, la copia di un'altra taglia, una carta), le
   case comuni, i modelli dei moduli. Con più viandanti il tetto è del mondo (un kernel). La generazione differita (ADR-0143) non ce l'ha: la
   paga l'abbonamento del master, prima che qualcuno giochi.

## Alternative scartate

- **Le strutture solo dove il viandante si ferma** (D69.1): rifiutata dall'autore.
- **Il seme tra i quattro provati** (`seedFor` del lotto, com'era): con un programma vestito da decine di luoghi gli edifici si ripetono ogni
  quattro. La misura dice che i semi oltre reggono come i primi (sotto).
- **Provare il seme nuovo coi controlli dello Scultore prima di darlo**: 0,3-0,7 s a seme per una struttura Grande sul filo della pagina, a
  ogni luogo; per un rischio che la misura dice piccolo e solo della cantina, che resta ai semi provati.
- **Il kernel che sostituisce un concetto nuovo oltre il tetto con una struttura del mondo scelta da lui** (per parole in comune): sceglierebbe
  il genere sbagliato; lo schema chiuso lascia la scelta al Cartografo, e il tetto vero lo tiene lo Scultore.
- **Togliere la struttura oltre il tetto** (una casa comune al suo posto): butta ciò che il Cartografo ha scritto; aspettare col generico la
  tiene per quando l'ora la lascia passare.
- **Il tetto come coefficiente 0-1**: le manopole a 1 sono il pieno dettaglio e il master non potrebbe alzarlo; un numero l'ora è ciò che
  l'autore ha chiesto.

## Conseguenze

- **La misura dei semi** (`lab/scripts/semi-strutture.ts`, i controlli dello Scultore a un seme, `checkSeed`): le 67 strutture che si
  riusano in `orichalcum`, `sidera`, `neapolis` e `aurora`, 12 semi ciascuna: cadono 13 semi su 804 (1,6 %), tutti tranne uno la cantina che
  dalla porta non si raggiunge (la cascina di `orichalcum` già ai semi 1-3, l'officina meccanica Enorme ai semi 5, 6, 10, 12, uno di
  `neapolis`); 10 di loro oltre il quarto seme. `sidera` e `aurora` nessuno.
- **Il Cartografo vero** (`lab/scripts/riuso-cartografo.ts`, Flash-Lite su una copia in memoria di `orichalcum`, 0,105 $ in tutto per le due
  prove senza l'invito): 24 luoghi, 28 strutture, **28 riusate**, nessun concetto nuovo; il capanno di collaudo delle chiatte in 11 porti su 15.
  Col tetto a 0, 8 luoghi, 11 strutture, tutte del mondo. Con l'invito (0,077 $): 24 luoghi, 29 strutture, 27 riusate e 2 concetti nuovi, al
  decimo e al ventesimo piano; uno era il nome di una struttura del mondo accorciato, che ora è un riuso. Le prove con Gemini: 0,182 $.
- **Il cammino della run, prima e dopo**: in `lab/banco/run-1/consumi.md` § 6.
- Il prompt del piano ha al più 40 righe in più (circa 15 token l'una): circa 0,02 $ l'ora sui piani di Flash-Lite.
- Un universo maturo si ripete di più (è la scelta dell'autore): le strutture meno usate vengono offerte prima.
- I piani di prima non hanno `seed`: i loro lotti restano come sono. La stima oraria della lobby la rifà T496.
- `KERNEL_VERSION` 0.10.23: gli universi della 0.10 restano buoni (un campo in più nei piani nuovi, un budget in più).
- Sicurezza: nessuna superficie nuova (un campo di `ai` nominato nella lobby, `LOBBY_AI_FIELDS`; un campo dei piani scritto dal kernel, che la
  risposta del Cartografo non può dire; niente sul filo né per Lua).
