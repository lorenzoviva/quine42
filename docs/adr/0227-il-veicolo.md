# ADR-0227 — Il veicolo, da soli

Data: 2026-11-20 · Stato: accettato (task T439 del backlog, P3 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 1.3; la Q di
T183) · Riferimenti: ADR-0224 (la fisica rimodellabile: la profondità dell'acqua), ADR-0225 (il corpo che nuota), ADR-0168 (le cose che non
sono di un luogo, `moved`), ADR-0150 (ciò che è posato), ADR-0139 (i tasti di ogni viandante), ADR-0135 (`soil`, il suolo sulla radice),
ADR-0091 (`base`, ciò che sta sotto terra), ADR-0124 (la regola 8), ADR-0136 (la versione del kernel)

## Contesto

Nessun corpo ne portava un altro: il passo non scende sotto 0,2, `settleHeights` cancella la quota dove nessuna forma copre la casella, e
`mech.barca` di T183 riscriveva `pos` del viandante a ogni tick (il «sedile a mano»), mescolando lo spazio del cerchio e quello del tappeto.
Il veicolo serve ai Pirati (barche), allo spazio (capsule, T445) e a ogni mondo (carri): una primitiva generica da cui il Concilio fa ciò
che gli serve, non una barca cablata. Questo ADR è il veicolo **da soli**; in molti (il passo relativo, gli altri a bordo, il timone dal
client) è T442.

## Decisione

1. **Il veicolo è un dato del manifest**: `vehicle: { medium, speed, accel, turn, draught }` su un'entità che non è qualcuno né una cosa che
   si prende (`src/kernel/vehicle.ts`). `medium` è ciò su cui sta: `water` (l'acqua che si nuota; `draught: deep` solo la profonda, `shallow`
   anche la bassa) o `land` (ciò che si cammina). Il vuoto non è ancora un terreno: `void` non si accetta finché T445 non lo fa (ciò che il kernel
   non sa fare non si dice, ADR-0221). I numeri stanno nei tetti del kernel (`VEHICLE_LIMITS`: velocità 0,5-8 caselle al secondo,
   accelerazione 0,2-4, giro 0,2-2 radianti al secondo); un manifest che esce dai tetti lo rifiuta il validatore, uno letto si ripara.
2. **Lo stato è il componente `vehicle`**, scritto solo dal kernel: il verso (`heading`, lo `yaw` della forma: la prua guarda verso
   (sin, cos)), l'abbrivio e il giro, ciò che gli si chiede (`thrust` e `steer` −1…1, `power` 0…1), l'ancora, chi tiene il timone, se l'ultimo
   passo è stato fermato (`bumped`). `saneVehicle` lo ripara a ogni lettura (regola 7). Nasce fermo e all'ancora.
3. **A bordo è stare sul ponte**: i piedi su un pavimento della forma del veicolo, alla loro altezza (`deckAt`); finché la forma non c'è, o il
   veicolo non è solido, il disco del suo corpo. Sul ponte non si nuota (`swimsAt`) e l'acqua sotto non conta per il corpo (`bodyFree`,
   `world.free_real`): anche chi è troppo carico per l'acqua profonda cammina sul ponte; il salto atterra sul ponte come sulla terra.
4. **La linea di galleggiamento** è `waterline="N"` sulla radice del programma (voxel sotto l'acqua): la forma si posa N voxel più in basso,
   come una cantina (`base`, ADR-0091) ma senza suolo; il ponte si raggiunge dall'acqua e dalla riva se sta entro un gradino sopra di lei. La
   classe `vessel`, le aree e i controlli dello Scultore sono di T440.
5. **Il kernel muove i veicoli prima dei solidi** (`vehicleTick`, nel tick prima di `rebuildSolids`): il timone o Lua dicono che cosa si
   chiede, `vehicleStep` integra entro i limiti (indietro a metà, a riposo un terzo del giro, l'ancora frena tre volte più in fretta), lo scafo
   va dove ciò che lo porta lo lascia andare: ogni punto dello scafo (le colonne della forma, ogni quarto di casella e i bordi; il disco del
   corpo senza forma) su ciò che lo porta, nessuno in ciò che ferma un corpo né nello scafo di un altro veicolo. Fermato, prova a girare soltanto
   o ad andare soltanto; se non può, si ferma e perde l'abbrivio: **l'urto ferma, non rompe** (romperà Lua, T444). Chi tiene il timone lo
   sente, una volta finché preme lì («Lo scafo urta e si ferma»). Poi **chi è sul ponte va e gira con lui**: la stessa rototraslazione attorno
   al suo centro (`carried`), solo dove un corpo può stare (altrimenti resta, e cade in acqua); così ciò che vi è posato o vi giace, con il suo
   verso. Le persone del mondo non salgono a bordo (la loro via è sulle caselle, un passo dopo).
6. **Il timone** si prende dal menu del veicolo (E, o Spazio al timone: chi governa non salta), solo sul ponte e se è libero, e leva l'ancora;
   chi governa **non cammina** (il kernel salta `core.movement` per lui) e i suoi tasti spingono (su, giù) e girano la prua (sinistra a sinistra
   della prua); guarda dove guarda la prua. Si lascia dal menu, scendendo dal ponte, saltando, morendo, uscendo. **L'ancora** (il freno, sui
   carri) si getta e si leva dal menu; **un veicolo senza nessuno a bordo getta l'ancora da sé**: niente va alla deriva dove nessuno guarda.
7. **Non è di un luogo**, come le cose spostate (ADR-0168): nasce con un'origine, il suo luogo non lo rifà (`consumed`) e non lo porta via
   quando si scarica; il salvataggio lo tiene in `world/state.json → vehicles` (modulo, origine, dove, verso, ancora), al più `MAX_VEHICLES`
   (32), letto voce per voce (`readVehicles`); al caricamento torna dove era. Un modulo che non c'è più: la voce aspetta nel salvataggio.
   Il carico sul ponte non si salva ancora (la stiva è di T444).
   Il Cartografo non lo mette nei luoghi (`catalog` non offre i veicoli: una barca finirebbe sulla terra di un luogo); lo fanno Lua e, con
   T443, i porti.
8. **Lua** legge (`world.vehicle(id)`, una copia: verso, abbrivio, ciò che si chiede, ancora, timone, chi è a bordo), chiede
   (`world.vehicle_set(id, {thrust, steer, power, anchored, helm})`: la spinta e la rotta solo se nessuno tiene il timone, la forza come il vento
   nella vela o i remi, il timone a un viandante sul ponte o `false`) e sa su che cosa sta un'entità (`world.vehicle_of(id)`); **mai dove sta**:
   la posizione e lo stato di un veicolo arrivano a Lua come copie, il componente non si scrive né si crea da Lua (V-045). Così l'Ingegnere
   scrive vele, remi, vapore o un traghetto senza toccare il kernel. Il vento di `mech.barca` è ora così, senza il sedile a mano.
9. **A schermo** il renderer legge il verso di ogni cosa a ogni fotogramma (prima solo quando costruiva la vista); chi è a bordo si disegna sul
   ponte e muove le gambe solo se cammina sul ponte; al timone la camera arretra una volta a `HELM_VIEW` (22) e la rotella arriva a
   `ZOOM.helm` (30): per la regola 8 è sicuro, la corona non si disegna per chi sta nel cerchio (ADR-0124).

## Conseguenze

- Kernel **0.10.3**: aggiuntivo (un campo del manifest, un componente, un campo del salvataggio, tre funzioni di Lua, un attributo della
  radice dei programmi); nessun universo di oggi se ne accorge.
- Multigiocatore (T442): oggi il veicolo porta solo i viandanti di questo kernel; chi gioca da un suo client non è portato e non prende il
  timone, e lo specchio non ha il verso dopo la prima vista. Il passo relativo al ponte, gli altri a bordo e il timone dal filo sono di T442.
- Restano: la classe `vessel`, le aree del timone e dell'imbarco, i controlli e il prompt delle navi (T440); porti e moli (T443); affondare, il
  danno e la stiva salvata (T444); chi nuota davanti a uno scafo (oggi lo scafo gli passa accanto come a chi non è solido: la spinta, con
  gli altri viandanti, è di T442); le persone del mondo a bordo; il vuoto (T445).
- Sicurezza: V-045 (Lua: legge, chiede entro i limiti, non sposta). Il filo non cambia.
- **Il tetto delle chiamate annidate** (trovato qui, regola 7): tre funzioni in più nell'`Host` dei test hanno fatto bloccare per sempre la suite su
  «il rientro nel kernel senza fine finisce»: il rientro finiva solo quando una pila traboccava, e un trabocco nel mezzo del codice C della VM
  (l'interning delle stringhe) la lasciava rotta, così la chiamata dopo girava senza fine; dove cadeva il trabocco dipendeva dalla memoria. Ora
  `Sandbox.enter` tiene al più `MAX_NESTING` (32) chiamate aperte fra il kernel e Lua, e oltre la chiamata è un guasto e non entra (V-019,
  `tests/sicurezza/uscita.test.ts`).
