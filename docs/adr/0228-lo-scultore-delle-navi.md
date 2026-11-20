# ADR-0228 — Lo Scultore delle navi

Data: 2026-11-20 · Stato: accettato (task T440 del backlog, P5 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 1.6) ·
Riferimenti: ADR-0227 (il veicolo, `waterline`), ADR-0209 (le strutture a 16 voxel per casella), ADR-0182 (le aree di una struttura),
ADR-0183 (il prompt delle strutture, la risposta offline), ADR-0179 (le parti abitabili), ADR-0092 (le taglie), ADR-0044 (le azioni della forma),
ADR-0136 (la versione del kernel)

## Contesto

T439 ha fatto il veicolo come primitiva: un'entità col componente `vehicle`, il ponte dai pavimenti della forma, `waterline` sulla radice
del programma. Mancava chi scrive le navi: lo Scultore non aveva una classe per loro (una barca era un `object` di una casella o una
`structure` quadrata), nessun controllo diceva se uno scafo galleggia o se il ponte si raggiunge, e il timone si prendeva da ovunque sul ponte.

## Decisione

1. **La classe `vessel`** (`src/mj/classes.ts`), taglia sua la Grande. Le sue scatole sono una tabella sua (`VESSEL_TILES`), lunghe e non i
   quadrati di D&D: Media la scialuppa 1 × 2,5 × 1 caselle, Grande la barca a vela 2,5 × 6 × 4, Enorme il brigantino 4 × 10 × 6, Gargantuesca il
   galeone 6 × 16 × 9 (Minuscola e Piccola il modellino e la canoa), a `VESSEL_VPT` (16, quello delle strutture, ADR-0209) a ogni taglia:
   il galeone è 96 × 256 × 144 voxel, dentro `STRUCTURE_SIDE` e i tetti delle forme. Una voce non scrive la densità (`modelSize`), `vptOf` la
   legge 16. La prua verso y grande, come il davanti di ogni forma. Le parole di una barca (barca, nave, galeone, boat, ship…) danno la classe
   a ciò che non la dice (`guessClass`). Il seme ha il suo generico (`universe/models/vessel.xml`, la barca a vela), come ogni classe.
2. **Ciò che il kernel legge della forma** (`src/mj/vessel.ts`, funzioni pure): la linea di galleggiamento (`waterline`, T439); le aree su
   **ogni strato** (`columnAreasOf`: il timone sta sul ponte, la stiva sotto, non sul suolo come le aree di una struttura; una casella è di ogni
   area che vi ha una cella), `helm`, `boarding`, `hold`; lo scafo alla linea di galleggiamento (lo strato appena sotto, il mare allagato dal
   bordo: ciò che non raggiunge è scafo, anche l'acqua chiusa dentro), quanto è lungo e largo, la prua; il ponte che si cammina dall'imbarco
   (asciutto, un gradino alla volta, la testa libera), quanto ne sta sopra lo scafo, il timone accanto.
3. **I controlli** (`vesselErrors`, nei controlli dello Scultore `checkProgram`): `waterline` sulla radice, meno dell'altezza della scatola;
   lo scafo alla linea chiuso, **lungo almeno il doppio della larghezza**, l'ottavo davanti al più il 75 % della larghezza (la prua si stringe;
   uno specchio di poppa va bene); dalla Media in su (ciò che porta persone, `carriesPeople`) l'imbarco, almeno mezza casella² di ponte
   asciutto raggiunto da lì, **almeno metà del ponte sopra lo scafo alla linea** (lo scafo pieno sotto il ponte e chiuso: un buco nel fianco
   allaga lo scafo e il controllo lo dice; una murata che si apre verso il ponte va bene), il timone entro 0,75 caselle dal ponte. Un modellino
   galleggia e ha la forma di uno scafo, niente di più. Ogni difetto torna allo Scultore con le sue parole.
4. **La richiesta e il prompt**: la sezione «Vessels» del prompt dello Scultore (nella parte comune, prima delle strutture) dice come si fa una
   nave; la richiesta di una nave dice i numeri della sua scatola (la densità, il gradino, la testa, le soglie: `vesselLine`). Una nave è della
   categoria delle strutture (`categoryOf`: lo Scultore più forte, una revisione), ma non cresce a regole: le sue taglie sono altre navi, un
   programma per taglia con la scatola scritta, come le altre classi; gli esempi sono le navi della libreria.
5. **La risposta offline** (`mockVesselProgram`, `src/kernel/ai/mockVessel.ts`): una barca scritta per la scatola della richiesta, uno scafo a
   mezzo uovo con lo specchio di poppa, aperta e col pagliolo fino alla Media, col ponte, il parapetto, il varco dell'imbarco, il timone a
   poppa, la stiva e da uno a tre alberi con le vele dalla Grande; le vele sono azioni della forma (`furl` «Ammaina le vele», `hoist` «Issa le
   vele», ADR-0044). Passa i controlli a ogni taglia; il generico del seme è lei alla Grande.
6. **Il timone dov'è**: se la forma di un veicolo ha l'area `helm`, il timone si prende solo entro `HELM_REACH` (1,5 caselle) da una sua casella
   (`nearHelm`, `formDeckAreas`); da altrove il menu lo mostra spento con «Il timone è più in là.» Una forma senza l'area, o che non c'è ancora,
   si governa da ovunque sul ponte, come prima (T439). Lua (`world.vehicle_set(helm = …)`) ha la stessa regola.
7. **Il banco** (`lab/scripts/banco-navi.ts`, `lab/banco/navi/`): ogni taglia in caselle e in viandanti, la linea, lo scafo, la prua, il ponte,
   il timone, le aree, i controlli e le foto; nel laboratorio 3D le navi dei modelli locali alle quattro taglie che portano persone accanto al viandante.

## Conseguenze

- Kernel **0.10.4**: aggiuntivo (una classe, un modello del seme, un attributo letto, un controllo dello Scultore, una regola del timone che
  vale solo per le forme con l'area `helm`); nessun universo di oggi se ne accorge, salvo che una cosa nuova col nome di una barca e senza
  classe ora è una nave.
- Il ponte del generico sta 9 voxel sopra l'acqua: più di un gradino, si sale con un salto o da un molo (T443). Le aree `boarding` e `hold`
  il kernel le misura e non le usa ancora: l'approdo è di T443, la stiva salvata di T444.
- Restano: le cabine misurate come piani, il riuso (`model.reuse`) per i veicoli, le astronavi (`void`, `area="dock"`, T445), un equipaggio di NPC.
- Sicurezza: nessuna superficie nuova (un programma passa dal validatore come prima; la regola del timone restringe).
