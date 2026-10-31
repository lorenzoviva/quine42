# ADR-0043 — Lo spazio a scale: piano, lotti, strutture

Data: 2026-10-22 · Stato: accettato (step 9, fase F7) · Attua ADR-0037 (punto 3, lo spazio come scala di
griglie) per il passaggio piano → modello; segue ADR-0041 (asset come programmi) e ADR-0042 (lo Scultore).

## Contesto
Fino a F6 gli edifici dei luoghi erano ancora muri a caselle: il layout (ADR-0011) trova nel piano i recinti
(`walls floor doors`), il kernel ci metteva tetti a padiglione e le cose `dentro` sulle caselle del pavimento.
Con i modelli MarkovJunior (ADR-0041) una casa è un programma intero (`edificio`, `grande`, o uno suo scritto
dallo Scultore) con muri, porta che si apre e pavimenti propri: la griglia del piano e quella del modello sono
due scale diverse, e ciò che sta dentro deve stare sul pavimento del modello, non su una casella che ora è muro.
Le strutture «importanti» (castelli, templi, torri) costano il modello migliore (Argon, ADR-0042): il tetto di
tre per sessione dipendeva da quante volte si gioca, non da quanto è grande il mondo.

## Decisione
1. **Il piano dà i lotti**: ogni edificio che il layout trova è un **lotto**. Il kernel (`settleLots`) ci posa
   una **struttura**: un'entità con `form` (il modello), `struttura {concetto, classe, importante, model}`,
   `body` solido, origine stabile `<chunk>#s<i>` (così le azioni fatte sul modello — la porta aperta — si
   ricordano, ADR-0041). Classe `grande` se il lotto ha un lato di almeno 5 caselle, altrimenti `edificio`.
2. **Orientamento**: il modello sta al centro del lotto con il davanti verso la porta del piano (porta a sud
   → yaw 0, a nord → π, a ovest → −π/2, a est → π/2); il sentiero del piano prosegue dalla porta per due
   caselle dentro il lotto. Le caselle del lotto tornano terreno (il fondo della bozza se calpestabile, se no
   il sentiero): il muro è il modello, la collisione è quella dei suoi voxel.
3. **Le strutture del Cartografo**: il piano ha `strutture` (0-2 per luogo, `{concetto, importante?}`); vanno
   sui lotti più grandi, con il modello `struttura-<concetto>` che finché non esiste lo Scultore scrive (lo
   trova il `ModelDirector`); gli altri lotti hanno case comuni (il generico della classe).
4. **Una struttura importante per zona** (sostituito da ADR-0092: l'importante è la taglia Enorme, una per zona; sopra c'è la Gargantuesca, una per reame): il mondo è diviso in zone di 56 × 56 luoghi (circa 1000 × 1000
   caselle, centrate sulla partenza, `zoneOf`); il primo luogo di una zona che ne ha una la tiene, negli altri
   il kernel toglie `importante` dal piano (e al Cartografo lo dice già il prompt). Una sola per luogo. Le zone
   prese si salvano con la partita (`stato.json → importanti`) e si azzerano con una nuova Genesi.
5. **Dentro è sul pavimento del modello**: le cose `dentro`, il bottino che cade su un lotto e la casa delle
   persone vanno su punti del pavimento del modello lontani dai suoi voxel (`interiorPoints`, appena la forma
   è pronta: `placeInside` aspetta il programma). Il kernel risponde a `floorAt(x, y)` (l'altezza di ciò su cui
   si sta) e `structureAt(x, y)` (la struttura in cui si è); il renderer mette le figure sui pavimenti e taglia
   la struttura in cui si è sopra la testa; niente più tetti a caselle.
6. **Il modello che arriva**: una cosa (entità, oggetto, struttura) il cui modello non esiste ancora indossa il
   generico della sua classe con `form.wanted`; quando lo Scultore lo scrive (`addModel` → `applyFiles`) la cosa
   lo indossa subito, con il seme della sua origine.
7. Il raggio del viandante passa da 0,3 a 0,22: le porte delle case sono larghe 0,6 caselle.
8. **Le scale come rampe** (T53a, 29/10/2026): il pavimento di una colonna di voxel è l'altezza del pieno che parte da
   terra senza buchi, senza limite (`floors` in `src/mj/mesh.ts`). Un gradino è 0,2 caselle (`stepOf`). Ci si sta
   (`bodyGround` in `forms.ts` → `Form.floor`, `Form.block`) se nulla è ad altezza del corpo sopra quel pavimento
   e se il pavimento si raggiunge: quelli fino a un gradino da terra, gli altri salendo colonne vicine al più
   un gradino alla volta (un riempimento dalle colonne basse). Il corpo (la sua scatola) è fermato se sotto di lui c'è una
   colonna dove non si sta o due colonne vicine con più di un gradino di differenza (`rampBlocks`, `kernel.formBlocks`):
   una scala di gradini piccoli porta in alto e si riscende, un muro resta un muro, il bordo di un pianerottolo non si
   scavalca. `floorAt` dà l'altezza del pavimento della colonna (il renderer la ammorbidisce con `climb`); le azioni
   del modello (la porta che si apre) cambiano anche pavimenti e blocchi dell'istanza. Le cose `dentro` vanno solo sul
   piano terra (pavimenti fino a un gradino). La canna chiusa di un pozzo, che prima si attraversava, ora è
   irraggiungibile.
9. **I piani** (T53b, 29/10/2026): una colonna ha un pavimento per ogni tratto di pieno, la sua cima (il piano terra,
   il piano sopra, il tetto), più il suolo se comincia vuota (`surfaces` in `mesh.ts` → `Form.levels`: per colonna le
   altezze dal basso, ciascuna con il suo blocco). Il riempimento di `bodyGround` va da pavimento a pavimento: da uno
   si passa a uno della colonna vicina al più un gradino più alto o più basso, così la scala porta al piano sopra e una
   seconda scala al tetto; `Form.floor`/`Form.block` restano il piano terra. Un corpo sta sul pavimento della colonna
   **più vicino all'altezza dei suoi piedi**, che il kernel tiene in `pos.z` (caselle del mondo): dopo i sistemi di ogni
   tick `settleHeights` lo rimette al pavimento più vicino a dov'era (i viandanti dal loro tappeto; fuori dal cerchio
   e lontano dai modelli solidi non c'è, così il tick costa quanto prima); `stepWanderer` lo porta con sé passo dopo passo. `free`, `free_real` (anche da Lua, `world.free(x, y, r, z)`,
   i sistemi del seme passano `p.z`), `floorAt` e `rampBlocks` prendono quell'altezza; senza, il piano terra (come prima:
   il codice generato che non la passa vede il mondo di T53a). Sotto il piano sopra si cammina sul piano terra, sopra di
   lui sul suo pavimento; il bordo della tromba delle scale è un salto e ferma. Il renderer posa ciascuno sul suo
   pavimento e taglia la struttura sopra il piano in cui si è (`1.15 + floorAt(x, y, z)`). Le cose `dentro` restano
   sul piano terra; ciò che sta sotto un pianerottolo sospeso ora è un posto. Un modello che sta tutto sotto i piedi
   (un cartello a terra sotto il piano sopra) non ferma chi gli cammina sopra (T70, `formBlocks` lo ignora se i piedi
   sono più in alto della sua griglia più un gradino). Il salto con i piani: ADR-0080, punto 5.

Le **ancore** previste dal piano (cose messe «vicino a» altre) non sono in questo ADR: le cose stanno ancora
dove le mette il piano (`dentro fuori ovunque`).

## Conseguenze
- Una casa costa un modello per tipo (spesso nessuno: il generico), non una texture per casella; le case comuni
  dello stesso luogo differiscono per seme.
- Le cose dentro compaiono un attimo dopo il luogo (quando la forma è pronta); se il modello non ha pavimento
  restano dove le metteva il piano.
- Il Cartografo descrive le costruzioni con parole, il kernel decide dove e come stanno: gli agenti non contano
  caselle (lezione ricorrente).
- Test: `tests/lots.test.ts`, `tests/ramps.test.ts` (la scala di dieci gradini, il muro, le strutture del seme).
