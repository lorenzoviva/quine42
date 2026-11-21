# ADR-0236 — I pianeti a definizione variabile e il viaggio

Data: 2026-11-21 · Stato: accettato (task T449 del backlog, S5 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 2.7-2.8, la via C1
di D64) · Riferimenti: ADR-0233 (il vuoto, il cielo, il giorno), ADR-0234 (le astronavi e le capsule, l'approdo), ADR-0227 e ADR-0232 (il veicolo,
in molti), ADR-0226 (la gravità), ADR-0224 (la natura del mondo), ADR-0004 e ADR-0124 (il tappeto, la corona, la regola 8), ADR-0136 (la versione)

## Contesto

Lo spazio voleva i pianeti e il passaggio dall'uno all'altro. L'autore ha scelto (D64) la via C1 dello studio: i pianeti sono **fasce lontane
dello stesso piano**, senza una coordinata nuova e senza un contratto nuovo; il viaggio sposta lo scorrimento del tappeto di chi è a bordo e mai la
sua posizione nel cerchio; il renderer disegna attorno al tappeto (l'origine mobile). E ha chiesto i pianeti **a definizione variabile secondo la
distanza**: precalcolati, con meno voxel da lontano e sempre più dettaglio avvicinandosi, fino ai luoghi veri all'atterraggio.

## Decisione

1. **Il pianeta è una fascia** (`src/kernel/planets.ts`): il pianeta k è la striscia di luoghi attorno a (k · `planetPitch`, 0), un passo di
   `PLANET_SPAN` (2^20) caselle in luoghi interi (58 254 a 18 caselle), un giorno e una notte di cammino; la fascia 0 è l'orbita, il vuoto con le
   stazioni e gli asteroidi, e ogni mondo senza pianeti (`bandOfPlace`, `bandOfTile`: oltre l'ultimo pianeta è di nuovo l'orbita). Niente si
   scrive della fascia: si ricava dalla coordinata. Un universo di oggi non ha pianeti e non se ne accorge.
2. **I pianeti sono della natura** (`universe.json → nature.planets`, `Planet`, `repairPlanets` in `src/kernel/nature.ts`): solo in un mondo del
   vuoto, al più `MAX_PLANETS` (8), ognuno con il nome (una riga, `cleanText`), il seme (del mondo e della fascia se non lo dice, `planetSeed`), la
   geografia (`continent`: la terra e i mari del generatore; l'arcipelago e il vuoto su un pianeta non sono aperti), il cielo, il giorno, la
   gravità e il mare (i livelli del suo rilievo, 0-24), riparati entro ciò che il kernel accetta come la natura del mondo; fissati alla Genesi con
   lei (`sameNature` li confronta). Un pianeta senza nome ha un nome di sillabe dal suo seme (`planetName`), mai un numero, e mai una parola offensiva, volgare o ridicola né una sillaba ripetuta di fila: un nome che cade nel filtro dei nomi coniati (`src/kernel/coined.ts`, T462) si ricompone col seme successivo.
3. **La natura di una fascia** (`natureOfBand`, `Kernel.natureAt`, `bandAt`, `bandOf`): il cielo, il giorno e la gravità del pianeta, il respiro del
   mondo; la gravità di un punto la prende (`gravityAt`), la luce anche (`daylight(x)`), `world.nature()` dice a Lua la natura di dove gira il codice
   (la fascia del luogo che il generatore disegna, `draftBand`, o quella del viandante che agisce), mai l'elenco dei pianeti.
4. **La terra di un pianeta è del generatore attorno al suo centro**: `generate_chunk` riceve il luogo nelle coordinate del pianeta (`planetLocal`)
   e il suo seme; niente reticolo del kernel, niente vuoto, i varchi del vuoto solo nell'orbita. **Il rilievo** è suo (`BandedRelief` in
   `src/kernel/relief.ts`): l'orbita piatta, ogni pianeta le sue colline dal suo seme lette nelle sue coordinate, alzate perché il suo mare stia al
   livello del mare del mondo: un livello del mare per tutte le fasce, ogni pianeta il suo mare. Il rilievo di un pianeta si fa la prima volta che
   serve (alcune centinaia di millisecondi di MarkovJunior), e il renderer lo anticipa nelle pause.
5. **Lo spazioporto** (`PAD`, `planetDock`, `padTiles`): l'approdo di un pianeta è una piazzola nel suo primo luogo, una capsula di 2,5 × 4 con la
   prua a nord e il portello sulla casella (1, 4); il layout tiene camminate e raggiunte dai varchi le sue caselle (`dockApron`, come la terra al
   portello di ADR-0234) e il piano non vi posa niente; il kernel vi mette la capsula quando il luogo entra nel mondo (`docksOf`, `dockCapsules`):
   la regola 10 dei pianeti, da un pianeta si torna solo con la capsula.
6. **Il viaggio** (`travelTo`, `transitTick`, `jumpVehicle`): ai comandi di un veicolo del vuoto, in un mondo con pianeti, il menu offre una rotta
   per ogni corpo che non è quello dov'è («Rotta per Aldora», «Rotta per l'orbita»: `destinations`, l'azione `travel:<fascia>`). Il viaggio è lo
   stato `transit` del componente `vehicle` (`from`, `to`, `t`, `total`, `jumped`; `saneTransit`), scritto solo dal kernel; dura `TRAVEL_SECONDS`
   (16 s); intanto il veicolo non guida, non si esce né si sale. **A metà** il kernel porta il veicolo all'approdo della destinazione (lo
   spazioporto di un pianeta, l'approdo della stazione della partenza per l'orbita) con il verso dell'approdo, e chi è a bordo allo stesso posto del
   ponte **spostando lo scorrimento del suo tappeto** e mai la sua posizione nel cerchio (la corona non se ne accorge, regola 8); i piedi alla
   stessa altezza sul ponte, ciò che vi giace con lui. Senza condizioni: i luoghi arrivano attorno a loro come attorno a chiunque. Una capsula
   ferma e vuota all'approdo gli lascia il posto (tornerà al suo); un approdo con un altro veicolo rifiuta la rotta. Alla fine il veicolo è
   all'ancora e chi è a bordo sente «Siete arrivati».
7. **Il viaggio a schermo** (`transitView`, `src/render/renderer.ts`): il corpo lasciato fino al salto, quello raggiunto dopo; il veicolo e chi è a
   bordo salgono sopra il suo approdo (`Entities.aloft`, `Wanderer.aloft`) fino a 6 raggi del globo (360 caselle sopra una stazione) e scendono
   sull'altro, la quota esponenziale (la stessa parte della distanza ogni secondo), la camera che li tiene senza inseguirli, il piano lontano e la
   nebbia che seguono la quota; sopra un pianeta, oltre `PLACES_BELOW` (160 caselle), il resto del mondo si nasconde e restano il veicolo e il
   globo.
8. **I livelli di dettaglio** (`PlanetLod`, `src/render/planet.ts`): il globo di un pianeta ha il raggio della sua fascia avvolta (`GLOBE_RADIUS`,
   l'equatore lungo quanto la fascia) e la mappa attorno al suo centro è azimutale equidistante (`globePoint`: vera vicino al centro, piatta come i
   luoghi). Sedici livelli, dal pianeta intero in celle di 32 768 caselle alla casella (`lodCell`), ognuno 32 × 32 celle centrate sul centro del
   pianeta, il codice del terreno di ognuna dal generatore (`Kernel.planetTile`: `generate_chunk` di una casella col seme del pianeta, senza
   toccare i semi del mondo né sollevare guasti), l'ultimo livello è la bozza. **Precalcolati** dal più grosso, poche celle per volta nelle pause
   fra un frame e l'altro (5 ms ogni 40, 14 durante un viaggio, il pianeta del viaggio per primo) e **tenuti nel browser** (`localStorage`, la
   chiave con la versione dei livelli e la firma del generatore, del seme e dei colori: `planetSignature`). Ogni livello è una mesh di voxel sul
   globo, alti quanto ciò che cresce in una parte del lato della cella (l'acqua a 0) e, dove la cella è di poche caselle, il rilievo.
9. **Il passaggio senza scatti**: il livello voluto è quello le cui celle sembrano larghe circa nove pixel alla distanza (`lodWanted`); quello più
   fine entra con un **retino complementare** sopra il più grosso, che gli lascia il suo quadrato (ogni pixel è di un livello o dell'altro, mai dei
   due), e sotto `PLACES_BELOW` i livelli lasciano ai luoghi veri il loro rettangolo: all'atterraggio si vedono i luoghi. Da lontano il globo è
   girato attorno al veicolo verso dove guarda la camera (in 3/4 ciò che è sotto il veicolo è fuori dall'inquadratura) e torna sotto di lui
   avvicinandosi. Il globo e le sue stelle si disegnano in un passaggio prima di quello del mondo (`Bloom.background`), con la camera del mondo ma
   i piani vicino e lontano dalla quota; il mondo sopra, con la profondità pulita. I programmi si fanno prima del primo viaggio (`Planets.warm`).
10. **L'origine mobile**: i vertici di un luogo sono relativi al suo angolo (`Builder.geometry(origin)`, `FoamBuilder.geometry(origin)`, le istanze)
    e il gruppo sta lì in doppia precisione; il taglio sotto terra relativo alla sua casella, `U.cutOff` la frazione dello scorrimento e
    `U.cutTile` relativa alla sua parte intera; le onde dalle fasi calcolate in doppia precisione per vertice (`swellPhases`, l'attributo
    `seaPhase`, `foamPhase`), la scia relativa al suo primo sbuffo. A 1 048 572 caselle un float32 perde un sessantaquattresimo di casella (il
   passo è 1/8), relativo al luogo no.

## Alternative scartate

- **Una coordinata nuova** (`plane`, la via C2): pulita, ma ogni chiave, entità, `maps/`, stato e messaggio, e un contratto nuovo.
- **Il viaggio che sposta la posizione nel cerchio**: porterebbe il viandante fuori dal cerchio, e la corona si mostrerebbe (regola 8).
- **Il salto all'inizio del viaggio**: i luoghi della partenza sparirebbero subito; a metà si vede il corpo lasciato allontanarsi e quello
  raggiunto avvicinarsi, e i luoghi della destinazione hanno otto secondi per arrivare prima dell'atterraggio.
- **I livelli campionati dalle bozze dei luoghi**: un luogo intero (circa 10 ms di Lua) per una cella; il campione di una casella costa circa 0,2 ms.
- **Una sfera di voxel uniforme**: il dettaglio di una casella su un globo di un milione di caselle non sta in memoria; i quadrati annidati sì.
- **Il globo in scala vera sotto il veicolo anche da lontano**: in 3/4 è fuori dall'inquadratura finché non è enorme.
- **Il passaggio con la trasparenza**: vuole l'ordinamento e mostra i due livelli insieme; il retino complementare no.

## Conseguenze

- Kernel **0.10.12**, contratto invariato: un universo di oggi non ha pianeti, le sue fasce sono tutte l'orbita, i suoi piani e il suo filo sono
  quelli di prima. Sul filo un campo in più del veicolo (`transit`), che i client leggono senza fidarsi (V-046).
- Misure (T449, `lab/scripts/misura-frame.mjs --viaggio <universo>`, Chrome headless sulla GPU, RTX 2070, 1920 × 1080): i sedici livelli di un
  pianeta senza cache in circa 16 s di pause (16 109 celle, 2,7 s di lavoro); il viaggio di 17,5 s a 117-126 fps senza vsync, frame JS mediana
  4,1-4,9 ms (p95 10-11), GPU mediana 2,4-2,6 ms (p95 6,2-6,8), 94-99 draw call; i livelli sulla GPU 10 mesh, 47 000 triangoli, 5,9 MB; heap JS da
  29 a 33-34 MB; sul pianeta atterrati 141-147 fps, GPU 4,6 ms. Durante il viaggio 26-30 long task (2,5-2,8 s, il più lungo 477-482 ms), dopo il
  salto, quando arrivano i luoghi nuovi del pianeta: il costo di un caricamento a freddo; da distribuire (resta).
- Restano: i pianeti nella Genesi e nel Concilio (il Cartografo che li battezza, i loro terreni e ambienti: T450); l'arcipelago e il vuoto su un
  pianeta; l'aria e l'ossigeno del ponte (T446); un viaggio in molti provato su due client (il server muove e manda `transit`, ma due schede non
  sono state provate); i luoghi della destinazione caricati a poco a poco durante la discesa; le mesh dei livelli fatte nelle pause invece che al
  primo frame che le vuole (7-20 ms l'una); le celle grosse sono un campione puntuale (un'isola, una strada, un fiume), non la media della cella.
- Sicurezza: «Rotta per …» solo da chi tiene i comandi, controllata dal kernel; Lua non ha un'API del viaggio; il campo `transit` è letto con
  `saneTransit` (V-046).
