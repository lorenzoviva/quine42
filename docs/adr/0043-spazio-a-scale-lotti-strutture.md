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
4. **Una struttura importante per zona**: il mondo è diviso in zone di 56 × 56 luoghi (circa 1000 × 1000
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

Le **ancore** previste dal piano (cose messe «vicino a» altre) non sono in questo ADR: le cose stanno ancora
dove le mette il piano (`dentro fuori ovunque`).

## Conseguenze
- Una casa costa un modello per tipo (spesso nessuno: il generico), non una texture per casella; le case comuni
  dello stesso luogo differiscono per seme.
- Le cose dentro compaiono un attimo dopo il luogo (quando la forma è pronta); se il modello non ha pavimento
  restano dove le metteva il piano.
- Il Cartografo descrive le costruzioni con parole, il kernel decide dove e come stanno: gli agenti non contano
  caselle (lezione ricorrente).
- Test: `tests/lots.test.ts`.
