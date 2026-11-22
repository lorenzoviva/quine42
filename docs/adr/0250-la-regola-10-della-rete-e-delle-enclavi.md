# ADR-0250 — Il terreno vero a colonne, la regola 10 della rete e delle enclavi, gli automi del kernel

Data: 2026-11-22 · Stato: accettato (task T474 del backlog, la riga 1 dello studio di T459, `docs/design/terreno-3d.md` § 2 e § 8; le
risposte dell'autore del 21/11, D67: A1, B1, C1, D3, E1, V0 rinviato) · Modifica ADR-0048 (il rilievo non è più solo estetico), ADR-0064 e
la regola 10 · Estende ADR-0091 (gli strati), ADR-0094 (l'acqua che scorre), ADR-0224 (la natura del mondo, la fisica come dati) · Il
punto 4 (gli strati come regole) è ADR-0249 (T478)

## Contesto

Il rilievo è un livello per casella (un quarto di casella) e non è mai un ostacolo: due caselle vicine differiscono al più di due livelli
(ADR-0048), e la regola 10 vuole ogni luogo connesso a piedi o a nuoto contando solo le caselle. Le montagne sono caselle solide, il fondale
e il sottosuolo non hanno dettagli, l'acqua è ferma. L'autore (20/11) vuole montagne vere, il fondale per il nuoto sott'acqua, gli strati
come concetto del Concilio, l'acqua e il vento come automi, e una regola 10 che ammetta luoghi da raggiungere con mezzi originali. Lo studio
di T459 ha misurato le vie: il terreno in voxel costa 24 volte a luogo e 115 volte in memoria; a colonne col rilievo vero 2,5 ms e 3,5 KB in
più a luogo; sulla GPU di oggi nessuna via cambia il frame; la regola 10 terrebbe la rete con 0,48 rampe a luogo e la regola di oggi alla
lettera con 0,89.

## Decisione

1. **Colonne, non voxel** (A1): una colonna per casella; il rilievo vero lo dà il generatore dove la natura del mondo lo dice (R1:
   `nature.relief`, `generate_relief`), il kernel lo legge entro i suoi tetti e vi mette le garanzie (varchi, rampe, lotti, il mare). Il
   letto sotto l'acqua è una colonna (R4). Le grotte sono strutture che scendono (ADR-0091). Il sottosuolo in voxel (V0) è rinviato.
2. **La regola 10 della rete** (B1), fatta in T474:
   - **I gradini** (`src/kernel/network.ts`): fra due caselle vicine aperte (camminate o nuotate) un dislivello fino a `STEP` (2 livelli,
     mezza casella) **si cammina sempre**; oltre **non si cammina mai**, né in salita né in discesa; fino a `JUMP` (4 livelli, il salto della
     terra, `JUMP_UP`) si salta; fino a `CLIMB` (12 livelli, tre caselle, C1) si arrampicherà chi ha il mezzo (R3); oltre, solo costruendo
     (gradini scavati, una scala, un ponte). Due caselle nuotate si uniscono qualunque sia il loro livello.
   - **La collisione**: `free`, `bodyFree` e `freeReal` rifiutano una scatola che sta a cavallo di due caselle vicine più di un gradino
     lontane (`acrossRise`, sui soli lati condivisi: due caselle in diagonale non sono un lato), come davanti a una casella solida; il ponte di
     un veicolo porta chi vi sta sopra. Lo stesso controllo vale per il passo del server (`stepWanderer` usa `bodyFree`), per le persone e le
     cose (`free`, `world.free`), per il controllo del passo delle vie (`stepFree` di `npc/places.ts` con `NpcHost.riseOnStep`) e per ciò che
     spezzerebbe un luogo (`stepsBetween`). Le persone vanno solo sulla rete: non saltano e non si arrampicano. Il salto supera ciò che è
     entro `jumpUp()` come prima. Il percorso veloce: un luogo senza dislivelli oltre il gradino (`steep` falso nei suoi livelli) non chiede
     altro; i livelli per la collisione sono gli ultimi fatti finché le caselle, i lotti, le rampe e il rialzo sono quelli (`quickLevels`).
   - **La rete di un luogo** (`placeNetwork`, `Kernel.networkOf`), derivata quando il suo piano si stende e mai salvata: dai livelli del
     luogo come se fosse solo (quelli del modellino: la sua acqua e le sue rive, i lotti piani, nessuno scavo), dal primo varco del layout
     (`LayoutResult.start`) ciò che il mondo dà per raggiungibile è unito sui gradini: gli altri varchi, le porte, l'orlo del lotto di un
     blocco e di un approdo (`LayoutResult.mustReach`), i sentieri e i moli (i codici `road` e `pier` dei timbri), la partenza del mondo
     (l'angolo dei quattro luoghi attorno a 0, 0); solo ciò che le caselle da sole uniscono alla partenza, il resto è del layout (lo scenario,
     una sacca chiusa da una modifica). Dove un dislivello ne stacca uno, il kernel pareggia **una rampa**: la via più corta fra le caselle
     non raggiunte (`evenRamp`); le caselle che può muovere si pareggiano, ogni casella il più vicino possibile al suo livello con ogni gradino
     entro `STEP`; quelle ferme (il bordo, che incontra il luogo accanto; i lotti; l'acqua) si passano come sono, appoggi come l'estremo
     sulla rete e il bersaglio se è fermo (un varco, una porta), e ogni tratto fra due appoggi è lungo abbastanza per la differenza dei loro
     livelli; un bersaglio che si può muovere e da solo (una casella di sentiero) si pareggia dall'altro estremo fino a lui. Un sentiero di
     montagna, la terra mossa solo dove serve. Ciò che nessuna rampa raggiunge resta **staccato** (`stranded`) e il kernel lo dice nel
     registro. Le rampe sono la terra che muovono, casella per casella, come gli scavi (`Network.moved`, `Chunk.ramps`): il kernel la
     aggiunge ai livelli del luogo sul mondo caricato (`placeLevels`, `addMoved`) e la manda ai client sottili (`ChunkView.ramps`, letta da
     `readMoved`), che la aggiungono allo stesso modo.
   - **Le enclavi**: ciò che si cammina per quattro caselle o più (`ENCLAVE_TILES`) e solo un dirupo stacca dalla rete. Ognuna ha il suo
     **valico** (il dislivello più piccolo fra lei e la rete) e il mezzo che chiede (`meansOf`: il salto, l'arrampicata, costruire). Restano
     enclavi **dove l'asprezza del luogo lo concede**, altrimenti il kernel le unisce con una rampa come fa con le sacche: **piana** e
     **collinare** nessuna (tutto unito come oggi), **montuosa** fino al 15 % delle caselle camminate del luogo col valico entro un salto
     (entro un'arrampicata quando il mondo l'avrà, R3: `keptPass`), **impervia** fino al 35 % con ogni valico (`ROUGHNESS_QUOTA`, numeri da
     misurare nel gioco). Mai un varco, una porta, un sentiero: sono della rete.
   - **L'asprezza** (`roughnessOf`): il kernel la misura dal rilievo di ogni luogo, senza chiamate: la quota dei lati fra caselle aperte
     oltre un gradino (montuosa dal 2 %, impervia dal 10 % o con un lato oltre `CLIMB`, `ROUGH_EDGES`, tarate sul rilievo vero del prototipo di
     T459: 56 % dei luoghi senza dirupi, 13 % fra il 2 e il 10 %, 14 % oltre), piana se la sua terra non varia più di una casella. Il master
     la può dire per una regione sua (`Region.roughness`, `regionRoughness`, come la gravità di ADR-0226; mai una trattenuta): vale per i luoghi
     nuovi, scritta nel piano quando il luogo si pianifica (`ChunkPlan.roughness`), così una regione cambiata dopo non sposta i luoghi che
     aveva. Il modulo «Dichiara regione» ha la scelta, il messaggio `region` il campo.
   - **I piazzamenti** (`placementsOf`): ciò che il mondo dà per raggiungibile sta sulla rete: dalle caselle raggiungibili del layout si
     tolgono solo quelle che un dislivello stacca dalla rete (`Network.apart`), così col rilievo di oggi ogni cosa sta dove stava; il nuovo
     posto **`enclave`** del Cartografo mette una cosa in un'enclave che l'asprezza ha tenuto (il forziere sulla mesa, il nido sulla
     cengia), senza enclavi dovunque.
   - **Il Cartografo**: dove la bozza del luogo tiene enclavi (`draftRelief`: i suoi livelli da sola, il layout nudo, la rete con l'asprezza
     del master o del rilievo) la richiesta del piano lo dice (`reliefLine`) e lo schema offre `enclave`; altrove niente, e lo schema è quello
     di prima (nessun token in più per i luoghi di oggi). I modelli locali vi mettono un forziere.
   - **Il rialzo sintetico** (`Kernel.syntheticRise`): dei test e della console, livelli aggiunti alla terra dei luoghi caricati (mai
     all'acqua né ai lotti), mai salvati, mai da Lua, mai sul filo: la regola vista al lavoro su dirupi che il rilievo di oggi non ha.
3. **I mezzi** (C1): gli effetti di oggi (scavare e alzare, `relief`; spingere; il terreno; costruire), più due movimenti del kernel,
   `climb` (R3: «Arrampicati» sul bordo di un dirupo entro la portata della corda o della piccozza, fino a tre caselle, lento e faticoso;
   lo stato `climb` anche dagli effetti) e `dive` (R5).
4. **Gli strati** come programma MarkovJunior 3D per ambiente: ADR-0249 (T478).
5. **Gli automi** (D3) come primitiva parametrica del kernel (`flow`, `wind`, `diffuse`, `table`, e `rules` in MarkovJunior), i parametri
   scritti dal Fisico entro un carico fisso, deterministici, **a due celle per lato di casella nel kernel** (1,2 ms a tick per l'acqua sulla
   finestra caricata, misurato in T459); il Lua mette sorgenti e legge campioni, mai un passo; l'aspetto fine sulla GPU (A0-A3).
6. **L'ordine** (E1): prima le montagne (R0-R3), poi gli strati (S1-S2), il mare sotto (R4-R5), gli automi (A0-A3). Il rilievo vero lo
   portano la frontiera, i Pirati e lo spazio; il medioevo resta collinare finché non lo si prova.

## Conseguenze

- **Inerte col rilievo di oggi**: `worldLevels` tiene ogni terra entro due livelli dalle vicine e `chunkLevels` la piega verso i lotti
  entro lo stesso limite; misurato su 328 luoghi pianificati offline (`lab/scripts/rete-gradini.ts`), nessuna coppia di caselle vicine
  aperte oltre il gradino su 165 395 (13 in diagonale, che non sono un lato); in ogni luogo la rete è il riempimento delle sue caselle,
  senza rampe, enclavi né caselle staccate, e i piazzamenti sono quelli di prima (`tests/rete-kernel.test.ts`, `tests/luoghi-campione.test.ts`
  verde). Col plateau sintetico di otto livelli in mezzo a ogni luogo (`--rialzo 8`): 434 rampe su 327 luoghi, 21 enclavi tenute, nessuna
  casella staccata; la rete di un luogo 0,66 ms (1,29 al p95). Il contratto non cambia (kernel
  0.10.25): niente su disco, il filo ha un campo in più dal server al client.
- **Il costo**: il controllo del gradino in `free` è un'occhiata al segno `steep` del luogo quando la scatola sta su due caselle dello stesso
  luogo (circa 0,3 µs), due livelli quando sta a cavallo di due luoghi (circa 0,6 µs); la rete di un luogo si fa una volta quando il piano si
  stende (0,57 ms in mediana, 1,16 al p95, col rilievo di oggi).
- **Restano a R1** (il rilievo vero): un rilievo i cui dirupi `worldLevels` e `chunkLevels` non spianino, i varchi il cui livello sia una
  funzione del lato (oggi il bordo è il campo, mai mosso dalle rampe: due luoghi si incontrano come prima), i lotti sulle terrazze, `k` che
  si cammina. A R3 il salto e l'arrampicata nel passo del server, e `climb` in `keptPass`. **Non garantito**: che chi salta giù in una conca
  di meno di quattro caselle più profonda di un salto ne esca da sé (col rilievo di oggi non ce ne sono; R1 non deve farne, R3 le rende
  risalibili); che il viandante trovi il mezzo; che «Altro…» riesca; che un'enclave resti un'enclave (un giocatore può scavarla, regola 3);
  che una rampa sia bella.
- **Sicurezza**: il passo del server usa la stessa collisione, `ChunkView.ramps` va solo dal server al client e il client lo legge senza
  fidarsi, l'asprezza di una regione arriva solo dal master e la legge `masterRegion` (un valore dei quattro); nessuna superficie nuova.

## Alternative scartate

- **Il terreno tutto in voxel** (A2): costo, memoria, un contratto nuovo per tutto ciò che legge il terreno (studio § 4.4).
- **La regola 10 di oggi alla lettera** (B3): fattibile (0,89 rampe a luogo), ma senza enclavi non c'è niente da superare con un mezzo.
- **Le enclavi solo dove il Cartografo o il master le chiedono** (B2): il rilievo vero le fa da sé, e l'asprezza le misura senza chiamate.
- **Le rampe salvate nel piano**: sono derivate come i sentieri, deterministiche dal piano; salvate, un piano di prima e uno nuovo
  avrebbero due verità.
- **La rete sui livelli del mondo caricato**: dipenderebbe dai luoghi attorno (l'acqua che continua), e i piazzamenti cambierebbero con
  l'ordine dei caricamenti; i livelli del luogo da solo sono quelli del modellino, uguali dappertutto.
- **Il salto limitato anche in discesa**: col rilievo di oggi un salto giù per un pendio di più caselle cambierebbe; le conche resteranno
  un compito del rilievo vero (R1) e dell'arrampicata (R3).
