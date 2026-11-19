# ADR-0225 — Il corpo che nuota e il layout che non scava l'acqua

Data: 2026-11-19 · Stato: accettato (task T438 del backlog, P1 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 1.1) ·
Riferimenti: ADR-0224 (la fisica rimodellabile, il nuoto ovunque, la regola 10), ADR-0211 (il segno `vpt` sui piani nuovi), ADR-0053 (il
livello della morte), ADR-0168 (la cosa portata sopra la testa), ADR-0056/T38 (il passo del server), ADR-0136 (la versione del kernel)

## Contesto

ADR-0224 ha reso il nuoto un dato in ogni universo (contratto 0.10: `w` e `o` sono `cross: swim`) ma il kernel 0.10.0 scavava ancora l'acqua
e il corpo non entrava: i dati dicevano che si nuota, nessuno nuotava. Restavano da decidere il segno dei piani nuovi, dove sta la fatica, chi
nuota e chi no, che cosa fa il salto, che cosa ferma il server.

## Decisione

1. **Il segno dei piani nuovi è `swim: true`** (`ChunkPlan.swim`), scritto dal kernel su ogni piano che fa (quello del Cartografo, quello di un
   luogo di un blocco, quello di un riempitivo), come `vpt` per i timbri a 16. Il layout di un piano col segno (`LayoutOptions.swim`) conta come
   via le caselle che si nuotano e **non le scava mai**: il flood della connessione le attraversa, il percorso più economico le passa a costo 1,
   un varco sull'acqua resta acqua, una sacca si misura da ciò che si cammina; scava solo ciò che non si attraversa (vegetazione, roccia),
   mai i muri. `reachable` resta ciò che si cammina: niente si posa sull'acqua. **Un piano senza segno è di prima** e tiene i sentieri che ha
   scavato sull'acqua (i suoi ponti e moli): i luoghi pianificati non cambiano (regola 2 di T183, `tests/luoghi-campione.test.ts`). Le prove
   dei programmi d'ambiente (il validatore, la stanza dei campioni) usano il layout dei piani nuovi. La rigenerazione dei modelli tiene il segno
   che il piano ha.
2. **Il corpo che nuota è solo quello del viandante.** `free` (NPC, cose, `world.free`, le vie) resta com'è: l'acqua è solida, gli NPC non
   nuotano (per ora) e chi deve andare oltre l'acqua rinuncia, come chi non ha via. Il corpo del viandante ha la sua collisione, `bodyFree`:
   `world.free_real` (il cammino di `core.movement`, anche nello specchio del client), il salto e il passo del server (`stepWanderer`) la usano.
   Lì una casella che si nuota lascia entrare, **l'acqua profonda no a chi è troppo carico**: più di metà della portata (`SWIM_LOAD`) o una
   cosa sopra la testa (`thing:`, ADR-0168). La riva lo ferma e il mondo dice «Sei troppo carico per nuotare…» una volta ogni 4 secondi (anche
   nello specchio, che cammina il suo viandante); dentro l'acqua chi è già lì può sempre uscire.
3. **Il passo** è quello della casella: `world.speed_at` su una casella che si nuota dà `terrainPhysics(...).pace` (0,2-0,6, 0,4 se non
   detto), altrove ciò che dava. Il server dà a chi ha intorno solo acqua il passo del nuoto (`paceOf`), alla riva quello del cammino: un client
   non nuota alla velocità di chi cammina e non cammina sull'acqua (lo ferma `bodyFree` come un muro, se è troppo carico).
4. **La fatica e l'annegare sono del kernel** (`src/kernel/swim.ts`, `Kernel.swimmingTick`, per ogni viandante, anche quelli di un client):
   nell'acqua il kernel toglie `fatigue − 1` volte l'energia di un secondo di cammino del seme (`WALK_ENERGY`, 0,096), che ci si muova o si stia
   a galla, così con i bisogni del seme chi nuota si stanca `fatigue` volte (3: circa 347 secondi dall'energia piena) e un universo che ha
   riscritto `sys.needs` annega lo stesso. A energia finita la salute scende di 0,6 al secondo (come per fame e sete); a zero il viandante muore
   **annegato** (`player.death`, causa `annegato`, con il livello della morte della partita: `die`). Non annegano gli dei, chi è uscito dal cerchio
   da solo, chi sta già morendo; un valore che non è un numero non si consuma (regola 7).
5. **Il salto** entra nell'acqua e ne esce: atterra sulla terra più vicina entro `JUMP_FAR`, e solo se non ce n'è nessuna nella prima casella
   d'acqua che si nuota (un ruscello si salta, un lago ci si tuffa); dall'acqua salta sulla riva.
6. **A schermo** chi nuota è immerso fino al petto (`SWIM_SINK` sotto l'acqua disegnata, `swimFloor`), con le bracciate (`swimLimbs`); la camera
   non scende con lui (`Wanderer.sunk`). Nessun campo sul filo: lo specchio ha le caselle e chiede `swimsAt` per ogni figura.

## Conseguenze

- Kernel **0.10.1** (lo stesso contratto: il segno vale solo per i piani nuovi, i dati del nuoto erano già del contratto 0.10).
- La regola 10 vale come la dice ADR-0224 § 4: i piani col segno sono connessi a piedi o a nuoto, quelli di prima restano scavati.
- Restano: l'arcipelago e lo stretto misurato sulla fatica (T441), il pescaggio dei veicoli (T439), il traghetto per gli NPC (un task dopo),
  un animale marino (`physics.swims`, dopo), il salto in multigiocatore (oggi solo da soli, come prima).
- Sicurezza: nessuna superficie nuova. Il filo non cambia; il passo del server usa la collisione del corpo, con il carico e il passo del nuoto;
  Lua non ha API nuove (`world.free_real` era già del viandante).
