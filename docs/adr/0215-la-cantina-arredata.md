# ADR-0215 — La cantina arredata: la cantina come stanza dello Scenografo, i mobili portati al soffitto, la guardia esatta

Data: 2026-11-18 · Stato: accettato (task T419 del backlog, step 13; D63; § 10.4 di `docs/design/scenografo.md`, § 6 di
`docs/design/sotterranei-stato.md`) · Riferimenti: ADR-0214 (lo Scenografo, la via dei dati), ADR-0212 (la guardia degli interni), ADR-0091
(i sotterranei), ADR-0135 (la lettera del suolo), ADR-0064 (niente cose sui passaggi obbligati), ADR-0136 (la versione del kernel); le misure
in `lab/banco/scenografo/cantina/`

## Contesto

Con T415-T418 e T417 le cantine si scavano, si vedono e si chiedono; lo Scenografo (ADR-0214) arreda i piani sopra il suolo e lasciava la
cantina vuota, perché la guardia di T409 rifiutava sotto il suolo ogni pezzo che non arrivasse con ogni colonna al soffitto (`cellar`): una
cima sotto il suolo dove un corpo starebbe e che nessuno raggiunge annulla la cantina (T52b, ADR-0135). L'autore (D63) vuole l'arredo delle
cantine prima della rigenerazione degli universi (T411). Provandolo sulla villetta offline con la cantina (`MOCK_STRUCTURE_PROGRAM`, una
casella a 16 voxel: il soffitto 19 voxel sopra il pavimento) sono venute fuori quattro cose:

- la regola «ogni colonna fino al soffitto» non la passa nessun mobile, nemmeno uno scaffale fino al soffitto (le assi, i vasi) e la regola
  vera, quella del terreno del kernel (`cellarGround`: un pavimento sotto il suolo dove un corpo sta, cioè senza niente fra 4 e 12 voxel
  sopra, va raggiunto), ne lascia passare molti di più: un barile alto 14 voxel, una credenza di 12;
- un mobile portato al soffitto schiacciandolo stringe le assi sotto i 4 voxel (una fessura conta come pavimento) e l'arredo crolla;
  tagliato al soffitto le tiene;
- girato a caso e solo «vicino a un muro» uno scaffale si mette di traverso alla cantina, o lascia fra sé e il muro una striscia di pavimento
  che nessuno raggiunge;
- la villetta sale al primo piano **solo saltando** (`walkIn` con i salti), che la guardia non cammina (ADR-0212): al seme 3 un barile al piede
  del salto toglieva il primo piano, anche senza la cantina (T410).

## Decisione

1. **La cantina è una stanza dello Scenografo** (`ROOM_KINDS` + `cellar`): il pavimento coperto sotto `base` che la scala raggiunge, le
   stanze di `interiorRooms` col piano -1, **dopo** quelle dei piani sopra (così ciò che si posa sopra il suolo è lo stesso con o senza una
   regola della cantina). **La arreda solo una regola che la nomina** (`room: "cellar"`, `ruleFor`): le regole di prima, scritte quando la
   cantina restava vuota, non ci arrivano. Il prompt, lo schema e `describeBuilding` dicono la cantina come una stanza da arredare;
   `furnishable` conta anche lei.
2. **La guardia esatta** (`InteriorGuard.refusal`): `cellar` è ora «con il pezzo la cantina non regge più», ciò che il terreno del kernel
   misura sull'edificio arredato (`groundOfForm` tiene il buco), e «sotto il suolo di una cantina che non regge» (la terra la riempie). Non
   costa niente in più: quel terreno la guardia lo rifaceva già per il cammino.
3. **In cantina il kernel porta il mobile al soffitto** (`furnishWithRules`, `toHeight`, `cellarSafe`): il soffitto più basso sopra il pezzo
   decide; un pezzo più alto si **taglia** lì (le assi restano dove erano e lo scaffale continua nel soffitto), uno a meno di un gradino si
   stira. Poi `cellarSafe` lo rende tale che la cantina lo regga, colonna per colonna: ogni cima con meno di 4 o almeno 12 voxel d'aria sopra
   (il pezzo o il soffitto) si riempie fino a ciò che le sta sopra col voxel sotto (un vaso tocca l'asse sopra), tranne un gradino che un corpo
   sale dal pavimento accanto; e così il pavimento chiuso dentro il pezzo, che non porta al pavimento della stanza accanto. Un pezzo che
   crescerebbe più del 35 % oltre le fessure (`CELLAR_GROWTH`: un tavolo in una cantina di due caselle, un pilastro fino al soffitto) lì non va.
4. **In cantina il mobile ha la schiena al muro** (la schiena è il lato opposto al davanti del modello, y = 0 prima di girarlo): i posti
   provati sono solo quelli con almeno metà della schiena **a contatto** del muro, ogni voxel invece di ogni due; un pezzo non entra in un
   altro.
5. **I piani del cammino del kernel restano** (`furnishWithRules`, alla fine): se con l'arredo `storeysOf(walkIn(...))` perde un piano (uno
   che si raggiunge solo saltando), il primo pezzo con cui si perde si toglie, trovato dimezzando, e di nuovo finché i piani sono quelli
   dell'edificio nudo; oltre 12 cammini l'edificio resta nudo (`FURNISH_CAPS.walks`). Il piano dell'interno porta `actions` e `seed`.
6. **Il piede di una scala piena** sotto le pedate (quella di `part-cellar`) si protegge: oltre al riempimento dalle colonne della scala che hanno
   aria al piano, il protetto si riempie dai centri del piano accanto alla sua prima pedata (`interiorPlan`). Sui piani sopra il suolo la
   villetta e il forno non cambiano.
7. **I mobili della cantina nel seme**: `cellar-shelf` («Scaffale della cantina», voto 9) e `cellar-rack` («Rastrelliera delle botti», voto
   5), classe `furniture`, taglia Grande (32 voxel a 16: tagliati in una cantina di una casella, interi sotto una di due), scritti dallo
   Scultore del gioco con 3.8 Flash (`lab/scripts/mobili-cantina.ts`); i modelli locali li mettono in cantina col barile (`CELLAR_FURNITURE`,
   quattro pezzi). La botte grande non è entrata (3/10, in piedi invece che sdraiata).
8. **Kernel 0.9.9**: nessun formato cambia; gli edifici arredati sopra il suolo restano quelli di prima tranne dove un pezzo sporgeva oltre il
   soffitto (ora si ferma sotto), toglieva un piano raggiunto saltando o stava al piede di una scala piena sotto le pedate.

## Alternative scartate

- **La regola del terreno più tollerante** (non contare come pavimento una cima con meno di 4 voxel d'aria): è una regola del terreno di ogni
  cantina, cambierebbe quali cantine reggono negli universi che ci sono e vorrebbe un contratto nuovo.
- **Schiacciare il mobile al soffitto**: le assi di uno scaffale finiscono a 3 voxel e la cantina crolla (+111 % per tenerla).
- **Il programma di secondo stadio** (§ 10.3 di `scenografo.md`): arreda la cantina con scaffali fino al soffitto per costruzione, ma è il
  passo dopo, non questo.
- **Riempire ogni colonna del pezzo dal pavimento alla cima**: regge sempre, ma lo scaffale diventa un blocco.

## Conseguenze

- Sulla villetta offline con la cantina (`lab/banco/scenografo/cantina/riepilogo.md`): 2-4 pezzi in cantina per seme (scaffali e
  rastrelliera contro i muri, barili), 4-9 mila voxel, nessun rifiuto `cellar`, la cantina regge, si raggiunge, il piede della scala libero, i
  piani uguali; 1,2-1,9 s l'arredo intero. Le cantine piccole del seme (2,5-3,2 caselle², quasi tutte sotto la tromba) restano vuote.
- La botte grande dello Scultore resta da rifare; i mobili offline sono quelli del seme.
- I salti restano fuori dalla guardia: il punto 5 è una verifica finale, non un cammino in più per ogni pezzo.
