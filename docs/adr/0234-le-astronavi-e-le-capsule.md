# ADR-0234 — Le astronavi e le capsule

Data: 2026-11-20 · Stato: accettato (task T448 del backlog, S4 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 2.2 e § 2.6)
· Riferimenti: ADR-0227 (il veicolo), ADR-0232 (il veicolo in molti), ADR-0233 (il vuoto, il cielo, il giorno), ADR-0229 (l'arcipelago: il
reticolo delle terre), ADR-0228 (lo Scultore delle navi: le aree `boarding` e `helm`), ADR-0230 (porti e moli: dal molo si saltava a bordo),
ADR-0224 punto 6 (la capsula a ogni approdo, D64), ADR-0136 (la versione del kernel)

## Contesto

T445 ha fatto il vuoto, un terreno che il corpo non cammina, non nuota e non salta, attorno a stazioni e asteroidi; fra due terre del vuoto
non si va a piedi, quindi la regola 10 voleva un mezzo garantito dal kernel: **ogni approdo ha la sua capsula** (lo studio, § 2.2), con la
stessa garanzia dei varchi. Il veicolo di T439 e T442 sapeva stare sull'acqua e sulla terra; lo studio (§ 2.6) chiedeva lo stesso veicolo con
`medium: 'void'`, agganciato al bordo di una terra, con il portello dove si sale e un ponte che ha aria.

## Decisione

1. **Il vuoto è un mezzo del veicolo**: `vehicle.medium` vale `water`, `land` o `void` (`VEHICLE_MEDIA`). Uno scafo del vuoto sta solo sul
   vuoto (`carries`: `isVoid`), mai sopra una terra: il bordo di una stazione lo ferma come la costa ferma una barca, senza romperlo («La capsula
   urta e si ferma.»). Tutto il resto è il veicolo di T439 e T442: il ponte, chi vi sta portato, i comandi (il timone), i motori (l'ancora), il
   salvataggio, il filo. Le parole del mondo sono sue (`VEHICLE_WORDS.void`: «Prendi i comandi», «Spegni i motori», «Esci», «Entra»).
2. **L'approdo di ogni terra del vuoto** è una funzione del seme e della terra (`dockOf` in `src/kernel/islands.ts`): sull'asse (est, ovest,
   sud, nord) verso la più vicina delle sue quattro vicine del reticolo, dove la terra finisce lungo la riga (o la colonna) del suo centro; la
   capsula (`CAPSULE_TILES`, 2,5 × 4 caselle) oltre il bordo, la prua lontano dalla terra, la poppa col portello sul bordo, sopra di lui di
   `DOCK_OVERLAP` (1/64 di casella: fra la terra e il ponte non resta una fessura, e ogni punto dello scafo, il mezzo di una sua colonna, sta sul
   vuoto); spostata fuori di una casella alla volta finché una casella sotto di lei è terra. La terra al portello (`Dock.land`) il layout del suo
   luogo la tiene camminata e raggiunta dai varchi (`apron`, come il bordo del lotto di un blocco): la regola 10 per l'approdo.
3. **La capsula del seme**: il modulo `vehicle.capsule` (`CAPSULE`, `medium: void`, 6 caselle al secondo) col programma `models/capsule.xml`
   (classe `vessel`, la sua scatola nel programma): un ponte di un voxel, le pareti sotto la spalla, senza tetto (dall'alto si vede chi c'è a
   bordo), l'oblò e i comandi a prua (`area="helm"`), il portello a poppa (`area="boarding"`), i motori che brillano, un arco sopra la testa.
   **Il kernel la mette** quando il luogo del mezzo dell'approdo entra nel mondo (`dockCapsules`, in `applyPlan`), se nessun veicolo è a meno di
   `DOCK_NEAR` (2,5 caselle) dall'approdo: senza chiamate, come i varchi; mai in uno specchio (la mette il mondo, i client la vedono). Oltre
   `MAX_VEHICLES` non la mette e lo dice come guasto (`kernel:capsule`).
4. **La capsula lasciata torna al suo approdo**: una capsula di un approdo (l'origine `dock:<terra>`, `dock:<terra>/<n>` se quella c'è già) ferma
   coi motori spenti, senza nessuno ai comandi né a bordo, non si salva (`vehiclesToSave`) e lascia il mondo con il luogo in cui sta; il luogo
   dell'approdo, quando torna, ne rimette una dove manca. Così i veicoli del vuoto non si accumulano oltre il tetto, e ogni approdo ha sempre la
   sua. Una capsula in viaggio, con qualcuno a bordo, si salva e torna dov'era come ogni veicolo.
5. **Il mondo del vuoto è piano** (`flatRelief` in `src/kernel/relief.ts`): stazioni, asteroidi e vuoto al livello 0. Una stazione è costruita;
   una capsula agganciata a qualunque bordo ha il ponte un gradino sopra la terra (1/16 di casella) e ci si entra camminando dal portello. Il
   corpo che mette un piede sul vuoto lo mette sul ponte se il ponte sta entro un gradino dai piedi (`DECK_STEP`, nella collisione del corpo,
   `bodyFree` e `freeReal`): prima la tolleranza era 0,05, meno del ponte della capsula.
6. **Salire a bordo dal menu** (`board`, `boardDeck`): accanto a un veicolo e su nessun ponte, il menu del veicolo offre «Sali a bordo» (sull'acqua),
   «Sali» (a terra), «Entra» (nel vuoto); il kernel mette il corpo sul posto libero del ponte più vicino, prima l'area `boarding`, entro
   `BOARD_REACH` (2,5 caselle), e lo dice al client come una spinta (`wanderer:pushed`). Vale per ogni veicolo: dall'acqua accanto alla barca e
   dalla testa del molo, dove T443 voleva un salto. «Esci» dal portello sta nel menu di bordo come «Tuffati»: nel vuoto solo verso una terra
   entro `LEAVE_REACH`, altrimenti «Fuori c'è solo il vuoto».

## Alternative scartate

- **L'aggancio come stato del veicolo** (`area="dock"`, la capsula che si allinea da sé al bordo quando spegne i motori): con il mondo piano e il
  portello a filo non serve; il kernel posa la capsula già agganciata, e una capsula fermata a un altro bordo si lascia con «Esci» o si raggiunge
  con «Entra». Resta possibile dopo, con l'hangar della stazione (T450).
- **Il rilievo che sale anche nel vuoto, il ponte all'altezza del bordo** (la capsula che porta con sé la quota della terra a cui si aggancia):
  la quota di un veicolo è quella del suolo sotto il suo mezzo, sul filo e nello specchio; cambiarla per il vuoto voleva un campo nuovo e una
  capsula che sale e scende senza ragione fra due terre.
- **Il veicolo dell'approdo salvato sempre**: ogni terra visitata ne terrebbe uno nel salvataggio e il tetto (`MAX_VEHICLES`, 32) finirebbe dopo
  32 terre, lasciando senza capsula le terre dopo (regola 10).
- **La capsula che segue una rotta da sola fra le stazioni** (un traghetto): il veicolo lo sa fare con Lua (`world.vehicle_set`); il kernel
  garantisce il mezzo, non il viaggio.

## Conseguenze

- Kernel **0.10.10**: aggiuntivo. Un universo di oggi non ha il vuoto: il suo rilievo, i suoi piani e i suoi veicoli non cambiano; riceve dal
  seme il modulo e il modello della capsula, che nessun suo luogo mette (il Cartografo non mette veicoli, `catalog`); nella corona i moduli
  `vehicle.` stanno nel Laboratorio delle Cose (`folderOf`). «Sali a bordo» è nuovo
  per ogni veicolo; il gradino del ponte vale per ogni ponte (prima un piede su un'acqua troppo profonda per chi è carico non saliva su un ponte
  appena più alto).
- Un mondo del vuoto scritto a mano prima di qui (nessuno è nato dalla Genesi, ADR-0233 punto 8) diventa piano: i suoi piani restano, le quote
  no.
- **Nessuna ambientazione porta ancora il vuoto**: i terreni e gli ambienti dello spazio e il prompt del Cartografo sono di T450 (lo spazio nel
  Concilio), l'aria del ponte di T446 (l'ossigeno: il ponte della capsula avrà aria), l'hangar della stazione e i pianeti di T449.
- Restano: un'astronave dello Scultore (la classe `vessel` con `medium: void`, la sezione del prompt), l'equipaggio di NPC, il viaggio fra i
  pianeti (T449).
- Sicurezza: «Sali a bordo» da un client sposta il suo viandante sul server, ma solo sul ponte di un veicolo entro 2,5 caselle da dove il
  server lo sa, dove il corpo è libero, come «Tuffati» (V-046); la capsula la mette solo il mondo, Lua non crea veicoli né li sposta (V-045). Il
  filo non cambia.
