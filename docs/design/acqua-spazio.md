# L'acqua dei Pirati e lo spazio: la specifica del kernel (T432)

Data: 2026-11-19 · Step 37, Fase III · Richiesta: l'autore, 19/11 («inizia a lavorare alla specifica per le modifiche al kernel che
dovremmo fare per l'acqua dell'ambientazione "Pirati" e per lo spazio») · Studi gemelli: [`espressivita.md`](espressivita.md) (T183: il
catalogo, le primitive, i costi di un'aggiunta), [`campagna-master.md`](campagna-master.md) (T347), [`sotterranei-stato.md`](sotterranei-stato.md);
i reami scritti a mano di T278 (`lab/banco/coming-soon-cloud/pirati/`, `spazio/`) · Domande: [`docs/pipeline/domande/T432.md`](../pipeline/domande/T432.md)

Niente codice del gioco: questo documento dice che cosa cambierebbe nel kernel, perché, quanto costa e in che ordine. Ogni fatto sul kernel
di oggi (0.9.17) è letto nel codice, con il file. L'unica prova è offline, in `lab/scripts/mare-scavato.ts` (§ 1.2); niente è provato nel
browser e nessun modello è stato chiamato.

> **Dopo le risposte dell'autore (D64, 19/11)**: si nuota **ovunque**, anche negli universi di oggi, e le primitive della fisica sono dati che il
> Concilio rimodella. N0 (T437) l'ha fatto con un contratto nuovo, 0.10, e la migrazione: [ADR-0224](../adr/0224-la-fisica-rimodellabile-e-il-nuoto-ovunque.md).
> Il § 4 qui sotto (il nuoto acceso dalla natura, nessun contratto) è la proposta di prima; `nature` non ha più `water`.

## In breve

1. **Oggi l'acqua è un muro e il kernel ci scava le strade.** `w` e `o` sono `liquid` e solidi per costruzione, qualunque cosa dica il
   Cartografo (`BASE_CODES`, `toPalette` in `src/kernel/agents/genesis.ts`); il layout collega i varchi passando anche per l'acqua e la
   trasforma in sentiero. Misurato: un luogo tutto mare riceve una croce di 36 caselle di sentiero su 324, un isolotto 29, una costa un
   molo di 14. Con il layout di oggi un arcipelago diventa una rete di strade sull'acqua: è la prima cosa da cambiare, ed è la più semplice.
2. **Il mare e il vuoto sono lo stesso problema**: una superficie che il corpo non cammina attorno a terre che si raggiungono solo
   attraversandola. Servono le stesse primitive: una natura del mondo scelta alla Genesi, caselle che non si camminano ma si attraversano
   (a nuoto, con un veicolo), il veicolo che porta i corpi, l'aria che si consuma, la regola 10 contata anche fuori dalla terra.
3. **Il veicolo è la Q di T183, nel kernel.** Oggi nessun corpo ne porta un altro: il passo non scende sotto 0,2, `settleHeights` cancella
   la quota, la barca di `tests/espressivita/` riscrive `pos` a mano e in multigiocatore il server la riporta indietro. La proposta: chi
   ha i piedi sul ponte di un veicolo si muove e gira con lui, nel kernel, sul server e nello specchio; sul filo la posizione di chi è a
   bordo è **relativa al veicolo**; governa chi prende il timone, con i tasti che il filo porta già (ADR-0139).
4. **Passare da un pianeta all'altro non tocca né il tappeto né la corona**, che stanno in due spazi diversi (ADR-0004): il viaggio sposta
   lo scorrimento del tappeto (`carpet.ox/oy`) di chi è a bordo, mai la sua posizione nel cerchio. I pianeti sono fasce lontane dello
   stesso piano, non una coordinata nuova; il renderer, che oggi scrive i vertici in coordinate assolute a 32 bit, deve disegnare attorno
   al tappeto (a un milione di caselle due float vicini distano 1/8 di casella).
5. **Nessuna primitiva chiede un contratto nuovo** se si accende con un campo che gli universi di oggi non hanno (`universe.json → nature`,
   scelto alla Genesi con l'ambientazione e fermo come `game`) e se il seme non cambia i suoi `w`, `o` e la sua bozza dove quel campo
   manca. Tre vie naturali lo chiederebbero: il nuoto nei terreni del seme (arrivano agli universi senza Genesi), la soglia del mare della
   bozza del seme, i pianeti come coordinata dei luoghi. Se il nuoto debba valere in ogni universo nuovo è una domanda per l'autore, non
   di contratto.
6. **Le prime tre primitive.** Pirati: il mare che si nuota (P1), il veicolo (P3 da soli, P4 in molti), l'arcipelago disegnato
   dall'atlante (P2). Spazio: il vuoto (S1), l'aria (S2), i pianeti e il viaggio (S5). **Quindici task, circa il 57 % di una
   settimana** (§ 6); i Pirati giocabili (natura, nuoto, veicolo da soli e in molti, Scultore delle navi, arcipelago) circa il 29 %.

---

## 0. Il kernel di oggi, sulle cose che contano qui

| Cosa | Oggi | Dove |
|---|---|---|
| Il terreno | caselle `TerrainDef`: `solid`, `speed` (0,3-1,5 dalla Genesi), `layer` fra `ground floor wall door liquid vegetation rock stratum`, `indoor` | `src/kernel/types.ts:69-94` |
| L'acqua | `w` «acqua o liquido invalicabile» e `o` «acqua profonda del mare» sono codici di base: `liquid` e **solidi** qualunque cosa dica il Cartografo | `genesis.ts` (`BASE_CODES`, `toPalette`) |
| Il mare nella bozza | lo decide il generatore Lua del seme (`world.terrain`): `cont < 0,24` mare aperto `o`, fino a 0,28 riva (`w` o sabbia); entro 90 caselle dall'origine il clima è smorzato e il mare non c'è | `universe/modules/world.terrain/logic.lua:36-54` |
| Il livello del mare | quello sotto cui sta il 10 % delle caselle (`SEA_SHARE`) o `universe.json → relief.sea`; l'acqua che tocca il mare (bozza `o`) sta al suo livello, ogni altro specchio è piano | `relief.ts` |
| L'acqua che scorre | automa del kernel; il mare è una sorgente; l'acqua può allagare la terra | `water.ts`, ADR-0094 |
| La connessione (regola 10) | flood sulle caselle non solide; ciò che non è raggiunto (varchi, porte, sacche di 4 o più) si collega con la via più economica (vegetazione 4, **liquido 7**, roccia 9, muro 80) e ogni casella solida non muro sulla via **diventa sentiero** | `layout.ts:79-150, 236-255` |
| I varchi | una casella per lato, `2 + hash32(seme, lato) % (S − 4)`, uguale ai due lati; un varco bloccato diventa sentiero | `layout.ts:67-77, 205` |
| Il corpo | raggio 0,22; collisione per assi ai quattro angoli (`free_real`); il passo moltiplicato dagli stati, **mai sotto 0,2** né sopra 4 (`paceTick`); la quota la scrive solo il kernel (`settleHeights`, che la cancella dove nessun modello copre la casella) | `core.movement`, `kernel.ts:3942-3976, 9946-9956, 10016` |
| Il salto | passa sopra l'acqua, non ci atterra mai | `kernel.ts:4014-4057` |
| Nuotare, annegare | non esistono | — |
| Le forme solide | l'indice dei solidi si rifà a ogni tick dalle posizioni e dal verso (`yaw`) di ogni forma: una forma che si muove ferma chi le sta davanti dal tick dopo; NPC e animali non sono solidi | `kernel.ts:9958-9985` |
| Portare un corpo | nessun campo; `mech.barca` sposta il viandante dello spostamento dello scafo a ogni tick, a mano, mescolando lo spazio del cerchio e quello del tappeto | `tests/espressivita/moduli/mech.barca` |
| Il multigiocatore | il client dice dove è (`step {seq, x, y}` ogni 50 ms), il server lo porta lì entro il credito di passo a passi di 0,1 con `free` (`stepWanderer`), oltre 8 caselle rifiuta (`FAR`), oltre 0,05 corregge; nessuna quota sul filo; le cose a 10 Hz entro 24 caselle, solo x e y dopo la prima volta; i tasti tenuti sono `up down left right` | `src/session/server.ts:40-47`, `protocol.ts`, `kernel.ts:497, 1367` |
| Tappeto e corona | due spazi (ADR-0004): reale (il cerchio, la corona, lo studio a x ≥ 30000) e tappeto (terreno, cose, rune); `reale = tappeto − scorrimento`; ogni viandante ha il suo scorrimento | `kernel.ts:1063-1073, 1207-1216`, `corona.ts` |
| Teletrasporti | nessun portale del mondo; `?teleport` in sviluppo; una runa che scrive `x`, `y` o `carpet.ox/oy` (in molti solo il master) | `teleport.ts`, `kernel.ts:929-935` |
| L'atlante | regioni con centro, raggio, ambiente, `master`, `kind: filler | held`; un ambiente riscrive la bozza, non la crea: un riempitivo non fa il mare aperto; la regione «mare» proposta da T347 è diventata il riempitivo (ADR-0201) | `atlas.ts` |
| I bisogni | `hunger thirst energy health mana` fissi nel TypeScript, nell'effetto `needs` (quattro) e nell'HUD; il consumo è Lua (`sys.needs`); la morte dice sete, fame o ferite | `kernel.ts:321-328, 811`, `types.ts:193`, `hud.ts:249-256` |
| Cielo, giorno, clima | colori fissi (`SKY`), giorno di 600 s (`DAY_SECONDS`), nebbia sempre accesa; **nessun meteo**; nessuna stella | `renderer.ts:24`, `kernel.ts:8406` |
| L'acqua a schermo | un quadrato piatto a `WATER_Y` = −0,18, senza onde | `terrain.ts:21` |
| La camera | 3/4, inclinazione 0,95, distanza 15, zoom 2,5-15 (45 solo in orbita libera: fuori dal cerchio, nello studio, in god mode), giri a quarti | `renderer.ts:25-33`, `camera.ts:8` |
| Le forme a schermo | la posizione si legge a ogni fotogramma, il verso solo quando la vista si costruisce: un veicolo che gira non si vedrebbe girare | `entities.ts:186, 245` |
| La precisione | i vertici dei luoghi sono in coordinate assolute del tappeto, a 32 bit, e il gruppo del mondo è spostato di −scorrimento | `terrain.ts:124, 239`, `renderer.ts:293, 305` |
| Le classi dello Scultore | nessuna per i veicoli; la scialuppa del reame di T278 è un mobile di una casella | `src/mj/classes.ts:27-40` |
| Il ponte di una nave | si cammina se raggiunto a gradini (`bodyGround`), ma non è un piano: un piano vuole un soffitto | `forms.ts:301-315, 487-526` |
| Il blocco di più luoghi | non più di un quarto di liquido sotto il lotto: un forte sulla costa sì, una nave mai | `kernel.ts:2149-2170` |

I reami di T278 l'hanno già visto dal lato dei contenuti: la scialuppa non naviga e il varo è uno stato; le navette non volano; nello spazio
il vuoto non è un terreno, l'ossigeno è un oggetto e non un bisogno, il cielo ha il giorno e la notte del seme; prato, bosco e mare
restano anche dentro una stazione; gli effetti sonori del cannone e della campana non hanno un evento che li suoni.

---

## 1. I Pirati

### 1.1 Il mare che si attraversa: nuotare (P1)

**Il mare non è un muro: si nuota.** La natura del mondo (`nature.water: 'swim'`, § 4) cambia il senso dei due codici di base, come oggi
`BASE_CODES` decide che sono solidi:

| Codice | Oggi | Con `water: 'swim'` |
|---|---|---|
| `o` mare aperto, acqua profonda | solido | si **nuota** (`swim`): non si cammina, ci si muove a nuoto; ci navigano tutti i veicoli d'acqua |
| `w` riva, fiumi, laghi, fossati | solido | si **nuota**; ci navigano solo i veicoli a pescaggio basso |

Il Cartografo dà nomi e colori, il kernel dà la fisica: il principio di `BASE_CODES` («i codici di base tengono il loro senso, il motore
dipende da loro») resta. Un `swim` scritto dal Cartografo su un altro codice si ignora. Un guado (l'acqua bassa che si cammina piano)
sarebbe un terzo senso da insegnare a layout, timbri e Scultore: non serve, e i fossati dei timbri (`w` attorno al castello, con il ponte
levatoio `z`) restano fossati che si nuotano, con il muro che resta un muro e il ponte la via comoda.

Il corpo che nuota:

- **Passo** 0,4 del cammino, dal `speed` della casella; il salto entra nell'acqua (atterra su `swim`) e ne esce su una riva entro
  `JUMP_UP`; dall'acqua si sale su ogni riva, perché il rilievo scende verso l'acqua al più due livelli a casella.
- **Fatica**: l'energia cala tre volte più che camminando. Lo fa il kernel, non `sys.needs`, così un universo che ha riscritto
  `sys.needs` annega lo stesso. A energia zero, nell'acqua, la salute scende come per la fame: si **annega**, una causa nuova per
  `player.death` (`mortalDies('annegato')`), che segue il livello della morte della partita (ADR-0053).
- **Carico**: con più di metà della portata, o con un mobile sopra la testa (`thing:`, ADR-0168), nell'acqua profonda non si entra
  («Troppo carico per nuotare»): si posa prima. È più gentile che affondare, e la regola 10 resta vera per chi posa.
- **A schermo**: il corpo affonda fino al petto (`pos.z` sotto la superficie), le braccia nella posa del nuoto; nessun campo sul filo,
  perché lo specchio ha le caselle e sa chi nuota.
- **Gli NPC non nuotano**: la loro via resta sulla terra (`world.path`, `findRoute`); chi deve andare su un'altra isola rinuncia, come oggi
  chi non ha via. Un animale marino (`physics.swims`) sta solo nell'acqua: dopo.

Nel layout le caselle `swim` **contano come passabili** per la connessione e **non si scavano mai**; un varco sul mare resta
acqua; niente si posa sull'acqua (`placementsOf`). In multigiocatore `stepWanderer` usa lo stesso `free` di chi nuota: niente di nuovo
sul filo, e un client che dice di camminare sull'acqua profonda lo ferma il server come oggi un muro.

- **Genere**: movimento, terreno, rendering. **Contratto**: aggiuntivo (§ 4). **Costo**: 5 %.
- **Nel browser**: dalla riva nell'acqua, il corpo affonda e rallenta, l'energia scende più in fretta; un fiume attraversato a nuoto; un
  salto in acqua; una riva da cui si risale; il pieno della portata che ferma alla riva.

### 1.2 La regola 10 con le isole

La regola 10 dice due cose: ciò che sembra invalicabile lo è; ogni luogo è connesso (varchi e sentieri scavati dal kernel). Il layout di
oggi la tiene **scavando**, e sul mare scava strade. Misurato con `lab/scripts/mare-scavato.ts` (il `layout` vero, i terreni del seme,
tre bozze di 18 × 18):

| Bozza | Acqua | Diventa sentiero oggi | Con l'acqua passabile |
|---|---:|---:|---:|
| tutto mare aperto | 324 | 36 (una croce fra i quattro varchi) | 0 |
| isolotto di 6 × 6 nel mare | 288 | 29 (quattro moli verso i varchi) | 0 |
| costa: terra, riva, mare | 180 | 14 (un molo fino al varco del mare) | 0 |

E il luogo di accanto continua la strada fino al suo varco: il mare di un arcipelago sarebbe una griglia di moli.

**Proposta: la connessione conta anche il nuoto.** Con `water: 'swim'` un'isola è connessa a nuoto: la regola 10 resta vera alla
lettera, e il mare non sembra invalicabile, perché si nuota. Le garanzie che il kernel aggiunge:

1. La connessione del layout passa per `swim` e non la scava (la colonna di destra della tabella).
2. Ogni casella camminabile accanto all'acqua è un approdo per chi nuota: fra vicini il rilievo non supera mai mezza casella e la terra non
   sta mai sotto il mare (ADR-0048). Un'isola chiusa da scogli (`r`, `k`) la raggiunge il layout come oggi: scava nella roccia, non
   nell'acqua, fino all'acqua.
3. **Lo stretto**: un viandante con l'energia piena nuota circa 347 secondi, 833 caselle, 46 luoghi (l'energia cala di 0,06 al secondo,
   1,6 volte tanto camminando in `sys.needs`, tre volte quello a nuoto; il nuoto a 0,4 dei 6 passi al secondo). Perché la
   connessione sia una garanzia e non fortuna, l'atlante dell'arcipelago tiene ogni isola entro `MAX_STRAIT` luoghi (proposta: 4) da
   un'altra isola della catena che porta all'isola di partenza (§ 1.5).
4. Gli NPC restano sulla loro isola finché non c'è un traghetto (un equipaggio di NPC, fuori da questo elenco).

**L'alternativa scartata**: il mare come muro, e su ogni approdo una barca messa dal kernel come un varco. È fragile (le barche si
prendono, si affondano, si portano via, in molti più di tutto) e chiede il veicolo prima di poter generare un'isola. Resta però la
via dello spazio (§ 2.2), dove nel vuoto non si nuota.

La regola 10 in `AGENTS.md` cambierebbe così (con l'ADR del primo task): «ogni luogo è connesso a piedi o, dove la natura del mondo lo
dice, a nuoto; nel vuoto ogni terra è connessa al suo interno e ha un approdo con la sua capsula».

### 1.3 Il veicolo: navigare (P3, P4)

**Che cos'è.** Un'entità con una forma (il programma dello Scultore, classe `vessel`, § 1.6) e il componente `vehicle` (`heading`,
`speed`, `turn`, `anchored`, `helm`, `hull`); il manifest dice `vehicle: { medium: 'water' | 'void', speed, accel, turn, draught:
'shallow' | 'deep', aboard }`. È solida per chi le sta attorno (l'indice dei solidi la prende già a ogni tick, girata) e il suo ponte è un
pavimento come quello di una struttura (`bodyGround`, `floorAt`).

**A bordo.** Un corpo è a bordo quando i suoi piedi stanno su un pavimento della forma del veicolo, lo stesso `floorAt` che oggi dà la
quota sui piani. A ogni tick il kernel muove il veicolo **prima** che l'indice dei solidi si rifaccia, e porta con sé chi è a bordo e
ciò che vi è posato (ADR-0150): la stessa rototraslazione attorno al centro del veicolo, poi la quota dal ponte. Camminare sul ponte
resta `core.movement`, con la collisione dei voxel come in una struttura; `settleHeights` tiene la quota del ponte perché una forma
copre la casella. Il trasporto non porta mai un corpo dove il kernel non lo ammette (un muro, oltre l'anello della corona): lì il corpo
resta e cade in acqua. Gli arredi fissi (timone, cannoni) sono parte della forma o entità fissate (`mount { on, lx, ly, yaw }`) portate
rigide.

**Il timone.** Un punto della forma (`area="helm"`, come `area="pasture"`, ADR-0182). `E` → «Governa»: il veicolo prende `helm = id` se è
libero; chi governa non cammina (il kernel salta `core.movement` per lui, come oggi per un viandante remoto) e i suoi tasti tenuti girano il
veicolo (sinistra, destra) e lo spingono (su, giù); lascia con `E`, allontanandosi, morendo, uscendo. Il vento e le vele sono Lua: un
sistema (`sys.sail` nel seme del tema) scrive la spinta entro i limiti del manifest con `world.vehicle_set`; il kernel integra, urta e
porta. Così l'Ingegnere può scrivere remi, vapore o motori senza toccare il kernel.

**Le collisioni.** Lo scafo (l'impronta della forma, girata) contro le caselle: un veicolo d'acqua sta solo dove il suo pescaggio galleggia
(`o`, e anche `w` se `draught: 'shallow'`); contro le cose solide e gli altri veicoli (le impronte girate). L'urto ferma, non rompe: rompe
Lua, se il mondo lo dice e la partita lo permette (§ 1.4). Chi nuota davanti a uno scafo viene spinto, mai schiacciato (la spinta
c'è già, `stepWanderer` con una forza, `kernel.ts:5696`).

**Ancorare e dove sta.** `anchored`: fermo, nessuno lo spinge. Un veicolo senza nessuno a bordo né al timone si ancora da sé e non deriva:
niente correnti, perché un veicolo non va dove nessuno guarda. Non è di un luogo: come le cose spostate (ADR-0168) si salva in
`world/state.json → vehicles` (modulo, seme, x, y, verso, ancorato, scafo, il contenitore della stiva), al più `MAX_VEHICLES`, letto con
validazione; nasce al caricamento dove era. Si ferma al bordo dei luoghi non ancora pianificati: la sua velocità massima resta sotto
quella con cui i luoghi davanti si caricano (il mare aperto si pianifica senza chiamate, § 1.5).

**A schermo.** Il renderer legge il verso a ogni fotogramma (oggi solo quando costruisce la vista), chi è a bordo si disegna sul ponte;
al timone la camera si allontana (§ 2.8). Chi scende sottocoperta ha sopra di sé il ponte: lo nasconde il taglio di chi sta sotto
(`kernel.underground()`, T416), esteso ai pavimenti di un veicolo.

**In multigiocatore (P4).**

- Il server è l'autorità del veicolo (la posa a 60 Hz). Ai client va la posa nella parte `vehicle` di `EntityView` (verso, velocità,
  velocità di giro), a elenco come vuole la regola 8f, e lo specchio la **estrapola** fra un aggiornamento e l'altro invece di inseguirla
  (`FOLLOW`): il ponte non trema.
- Chi è a bordo manda la sua posizione **relativa al veicolo**: `step { seq, x, y, on }`, con x e y nel riferimento del ponte; il suo
  specchio lo disegna relativo al veicolo che estrapola. Il passo predetto non lotta con lo scafo, e il credito di passo del server conta
  solo il cammino sul ponte, non il viaggio. Gli altri a bordo arrivano relativi (`OtherView.on`, `lx`, `ly`).
- Il timone è un'azione come le altre (`perform`); i tasti viaggiano già (`keys`, ADR-0139). Il client del timoniere non predice il
  veicolo: una nave è lenta e un decimo di secondo al timone si accetta.
- `mech.barca` di T183 smette di riscrivere `pos`: il catalogo segna la barca (1), il carro (12) e la regata (39) interi anche in molti, il
  treno (23) in parte (con `on_return`, ADR-0149). La mongolfiera (2) e l'ascensore (24) no: chiedono un ponte che sale, un passo dopo.

**Le persone del mondo a bordo.** Fuori dal primo passo: la via degli individui è sulle caselle del mondo; a bordo serve una via sul ponte,
nel riferimento del veicolo. Un equipaggio di NPC è un task dopo questi.

- **Genere**: movimento, rete, rendering. **Contratto**: aggiuntivo (componente, parti del filo, campo del salvataggio, API di Lua nuovi).
  **Costo**: P3 6 %, P4 6 %.
- **Nel browser**: salire dalla passerella, «Governa», la nave gira e chi è sul ponte gira con lei, l'urto con la costa, l'ancora; in
  due schede uno governa e l'altro cammina sul ponte senza tremare; chi si tuffa resta indietro.

### 1.4 Affondare (P7)

- **Le persone** annegano (§ 1.1).
- **I veicoli** hanno uno scafo (`hull`, 0-100) che cala con `world.vehicle_damage` (il cannone del reame di T278 trova finalmente un
  bersaglio) o con l'effetto `distruggi` su un veicolo. A zero affonda: la forma scende in pochi secondi, chi era a bordo nuota, la stiva
  diventa un **relitto** sul fondo, un contenitore che si fruga nuotandoci sopra (`E`). Fra veicoli di viandanti solo se la partita ha
  `pvp`.
- Il suono del cannone e della campana resta senza evento: è la X di T183 («un modulo chiede un effetto»), che serve a ogni ambientazione
  e non è in questo elenco.
- **Genere**: movimento, rendering. **Contratto**: aggiuntivo. **Costo**: 3 %. **Nel browser**: un colpo, lo scafo che cala, la nave che
  affonda, il relitto da frugare.

### 1.5 L'arcipelago: la bozza, l'atlante, il Cartografo (P2, P6)

Oggi il mare sta dove il rumore del generatore lo mette (`cont`), non lo sa nessuno prima di generarlo e vicino all'origine non c'è; un
luogo di mare lo pianifica il Cartografo come ogni altro, pagando, e il layout gli scava una strada.

**L'arcipelago lo disegna l'atlante.** Con `nature.geography: 'archipelago'` il generatore del seme (che la legge con `world.nature()`)
mette terra solo nelle regioni `kind: 'island'` dell'atlante (centro, raggio, una forma dal seme attorno al centro) e mare aperto
altrove; l'isola di partenza ha il porto. Le isole le scrive il **kernel**, senza chiamate: alla Genesi in un disco attorno alla partenza
(punti distanti, deterministici dal seme, con la regola dello stretto del § 1.2), e più in là quando la frontiera si sposta. Il Cartografo
le battezza e sceglie l'ambiente quando il primo luogo di un'isola si pianifica (`planAhead`); il master ne dichiara altre come regioni sue
(`kind: 'island'`, ADR-0201).

Un'isola fa parte di ciò che è derivato: la bozza la legge. **Una volta che un luogo sotto di lei ha una bozza, la regione non cambia
più** (né centro né raggio né forma, nemmeno dal master); altrimenti le caselle di un luogo pianificato cambierebbero sotto il suo piano
(T183, «ciò che è derivato o è salvato o è congelato»).

**Il mare aperto costa zero.** Un luogo la cui bozza è tutta acqua profonda lo pianifica il kernel (`seaPlan`: il nome della regione o
«Mare aperto», nessuna cosa, nessuna runa, nessuna chiamata, il piano salvato), come i luoghi di un blocco e il riempitivo. È la regione
«mare» di T347 fatta bene: la dice la bozza, non una regione. In un mondo di pirati la gran parte dei luoghi è mare, e costa niente;
si pagano coste e isole, entro `placesPerMinute` e il ritmo del mondo come oggi.

**Porti e approdi (P6).** Il porto come ambiente e timbro, con il **molo**: una casella che si cammina sopra l'acqua (`floor`, tavole
sull'acqua) fino all'acqua profonda, dove una nave si affianca e si sale dalla passerella. Il kernel controlla che il molo di un porto
tocchi `swim` (se no lo allunga di una casella), come oggi controlla che gli ingressi dei timbri diano su caselle raggiungibili
(ADR-0211). La **secca** (`reef`): roccia sotto il pelo dell'acqua, dove un veicolo si ferma e chi nuota passa. Il prompt del Cartografo
per gli arcipelaghi: porto, faro, cantiere, relitti, secche.

**La bussola e la carta.** Lua legge l'atlante (`world.region_at(x, y)`, `world.islands()`, in sola lettura): la chiesuola e il tavolo del
cartografo di T278 indicano un'isola vera.

- **Genere**: terreno, Concilio. **Contratto**: aggiuntivo (§ 4). **Costo**: P2 5 %, P6 3 %.
- **Nel browser**: dall'isola di partenza il mare tutt'attorno e altre isole all'orizzonte (dove la nebbia le lascia vedere); i luoghi di
  mare compaiono senza il ritardo del Cartografo; il molo del porto, una nave affiancata.

### 1.6 Lo Scultore: scafi, alberi, vele (P5)

- **La classe `vessel`** (nave), con la prua verso +y (il davanti delle forme, `FormComp.yaw`), scatole lunghe: Media la scialuppa
  (circa 1 × 2,5 × 1 caselle), Grande la barca a vela (2,5 × 6 × 4), Enorme il brigantino (4 × 10 × 6), Gargantuesca il galeone
  (6 × 16 × 9) a `STRUCTURE_VPT` 16 come le strutture, dentro `STRUCTURE_SIDE` e `FORM_LIMITS`. I numeri sono un punto di partenza: li
  misura il banco delle taglie (`lab/banco/taglie/`) con il viandante accanto.
- **Ciò che il kernel legge della forma**, come `PARTS` e le aree (ADR-0182): `waterline` sulla radice (i voxel sotto la linea di
  galleggiamento, il pescaggio, come `soil="E"` dice il suolo, ADR-0135), `area="helm"` (il timone), `area="boarding"` (passerella o
  scaletta), `area="hold"` (la stiva, un contenitore). Il ponte sono i pavimenti raggiunti dall'imbarco; le cabine sono piani (hanno un
  soffitto).
- **Alberi e vele** come `<action>` della forma (ADR-0044): `issa`, `ammaina`; lo stato è dell'istanza e si salva (`savedForms`). Che
  la spinta dipenda dalla vela lo decide il sistema del vento.
- **I controlli** (`checkProgram` e il validatore): lo scafo pieno sotto il ponte lungo tutta l'impronta fino alla linea di
  galleggiamento, il ponte raggiunto dall'imbarco, il timone sul ponte, la lunghezza almeno il doppio della larghezza. Il prompt delle
  navi come quello delle strutture (ADR-0183), con la risposta offline in `MockAiModels` (una barca semplice); il riuso (`model.reuse`,
  Jev) vale per i veicoli come per i mobili.
- **I tetti**: `MAX_VEHICLES` per mondo (proposta 32), al più `MAX_ABOARD` corpi portati (24), i galeoni rari come le gargantuesche.
- **Le astronavi** sono la stessa classe con `medium: 'void'`: niente linea di galleggiamento, `area="dock"` per l'aggancio.
- **Genere**: Concilio, rendering. **Contratto**: aggiuntivo (una classe nuova in `classes.ts`). **Costo**: 5 %.
- **Nel browser**: una nave offline e una dello Scultore nel laboratorio 3D (`/lab/3d/`), alla scala del viandante; nel gioco, la nave
  nel porto.

### 1.7 Il mare a schermo (P8, facoltativo)

Onde, schiuma sulle rive, scia e rollio: solo rendering, nessun dato. **Costo**: 2 %.

---

## 2. Lo spazio

### 2.1 Che cosa significano terreno, cielo, acqua, gravità e clima

| | Stazione | Asteroide | Pianeta | Vuoto |
|---|---|---|---|---|
| **Terreno** | lamiera, grate, moquette: terreni della Genesi, dati come oggi | regolite, roccia, ghiaccio | come oggi, con la natura del pianeta | nessuno: `void` (§ 2.2) |
| **Cielo** | stelle (`nature.sky: 'stars'`) | stelle, il pianeta all'orizzonte | il cielo del pianeta | stelle |
| **Acqua** | serbatoi, poca; l'automa vale | ghiaccio | laghi e mari: le regole dei Pirati (§ 1) | — |
| **Gravità** | 1 (artificiale) | bassa (0,3) | quella del pianeta | — |
| **Aria** | sì | no | la dice il pianeta | no |
| **Giorno** | luce artificiale o nessun ciclo (`nature.day: 0`) | il sole fermo | il giorno del pianeta | — |
| **Clima** | — | — | — | — |

**Il clima** oggi non esiste: nessuna pioggia, neve o nuvola nel kernel o nel renderer; c'è solo la nebbia come prospettiva aerea. Non c'è
niente da spegnere; se un meteo nascerà (la A di T183) sarà per regione e mai sotto un tetto. **L'acqua** nello spazio è rara: la fa
rara la bozza (§ 2.2), non una regola.

### 2.2 Il vuoto che non si cammina (S1)

- **Un layer nuovo, `void`**: solido per i corpi; nessun suolo (il renderer non disegna terra: sotto si vedono le stelle, e il bordo della
  stazione è una lastra con il suo spessore); nessuna aria, rilievo, acqua; mai scavato dal layout (costo infinito, come una casella
  riservata); mai un varco (un lato fra due luoghi che è vuoto da tutte e due le parti non ha varco; uno che lo è solo in parte lo mette
  sulla terra); niente vi si posa; il salto non lo attraversa, a differenza dell'acqua.
- **Che cosa lo rende invalicabile**: non un muro disegnato, l'assenza del pavimento. Il corpo si ferma al bordo come davanti a una
  casella solida. Una caduta nelle stelle sembra invalicabile, e lo è (regola 10); non è un confine del mondo raccontato (regola 0): è lo
  spazio.
- **La bozza**: con `nature.geography: 'void'` il mare aperto della bozza è il vuoto, e stazioni e asteroidi sono le isole dell'atlante
  (`kind: 'station' | 'asteroid'`), con lo stesso meccanismo del § 1.5; un luogo tutto vuoto lo pianifica il kernel senza chiamate.
- **La connessione**: dentro una stazione o un asteroide come oggi; fra due terre solo con un veicolo (S4). Qui non si nuota, quindi il
  kernel garantisce il mezzo: **ogni approdo ha la sua capsula**, un veicolo piccolo del seme che il piano del luogo mette all'aggancio
  e che, se manca quando il luogo si carica, il kernel rimette. È la stessa garanzia dei varchi: il kernel la scrive, nessuno la chiede.
- **La tuta** (camminare nel vuoto agganciati a un cavo, con l'ossigeno che cala più in fretta) è un passo dopo e non è in questo elenco.
- **Genere**: terreno, rendering. **Contratto**: aggiuntivo. **Costo**: S1 4 %, con il cielo e il giorno.
- **Nel browser**: il pavimento della stazione con il bordo sulle stelle, il corpo che si ferma al bordo, l'asteroide di fronte oltre il
  vuoto, il cielo nero.

### 2.3 Il cielo e il giorno (in S1)

`nature.sky` (`earth` oggi, `stars`) e `nature.day` (i secondi di un giorno, 0 per la luce che non cambia) al posto delle costanti `SKY` e
`DAY_SECONDS`; per un pianeta le dice il pianeta (§ 2.7). Il giorno entra nelle routine e nei giorni del mondo (`ripens`, `plan.days`):
per questo si sceglie alla Genesi e non cambia.

### 2.4 L'aria e l'ossigeno (S2)

- **Un bisogno `oxygen`** (0-100) che esiste solo dove la natura del mondo ha luoghi senza aria (`nature.air: true`): il kernel lo aggiunge a
  `Needs`, l'HUD lo mostra solo allora, l'effetto `needs` lo accetta (validatore), la bombola dei reami di T278 lo ricarica.
- **Dove c'è aria**: il terreno (`air`, vero se non detto; `void` mai), l'ambiente o la regione (un asteroide o un pianeta senza aria),
  il veicolo (la sua forma). Nell'aria l'ossigeno risale in fretta, fuori cala (circa 100 in due minuti; una tuta indossata, ADR-0180, lo
  rallenta dieci volte). A zero la salute scende in fretta: **asfissia**, una causa nuova per `player.death`.
- **Lo fa il kernel** (`airTick`), non `sys.needs`: un universo che lo ha riscritto respira lo stesso, e il client non lo scrive (i bisogni
  sono componenti del kernel, che `takePanelFields` non tocca).
- **Niente gas**: l'aria è una proprietà di caselle e ambienti, non un fluido. Una falla che svuota una stanza sarebbe l'automa
  dell'acqua sull'aria: forse, dopo.
- Lo stesso bisogno serve ai Pirati il giorno che si potrà nuotare sott'acqua (il fiato).
- **Genere**: bisogni, UI. **Contratto**: aggiuntivo. **Costo**: 4 %. **Nel browser**: la barra, un corridoio di grate senza aria, la
  bombola.

### 2.5 La gravità (S3)

`gravity` (0,2-2) per ambiente o regione: il salto (`JUMP_UP`, `JUMP_FAR`, la durata dell'arco) scala con 1/g, il passo appena. La gravità
zero (fluttuare, l'inerzia) non è camminare ed è esclusa: in una stazione la gravità è artificiale. **Genere**: movimento. **Contratto**:
aggiuntivo. **Costo**: 1,5 %. **Nel browser**: sull'asteroide il salto va lontano e lento.

### 2.6 Le astronavi (S4)

Il veicolo del § 1.3 con `medium: 'void'`: sta solo sul vuoto, si aggancia al bordo di una terra (`area="dock"` della forma, o l'hangar
della stazione), si sale dal portello (`area="boarding"`); il ponte ha aria. Più la capsula del seme (§ 2.2). **Costo**: 2 % sopra P3 e P4.

### 2.7 I pianeti e il passaggio fra l'uno e l'altro (S5)

| Via | Che cosa è | Contratto | Costo |
|---|---|---|---|
| **A. Fasce lontane dello stesso piano** (raccomandata) | il pianeta k è la fascia attorno a (k · 2^20, 0) caselle; la fascia 0 è l'orbita (stazioni e asteroidi nel vuoto); il generatore legge la fascia dalle coordinate e i parametri del pianeta da `nature.planets[k]` (nome, geografia, mare, gravità, aria, cielo, giorno) | aggiuntivo | 6 % |
| B. Una coordinata nuova (`plane`) | ogni chiave di luogo, ogni entità, `maps/`, lo stato, il filo, il renderer | **nuovo** | 15-20 % |
| C. Niente pianeti nel primo universo | solo la fascia 0 | — | 0 |

**Nella via A**:

- **Fra due pianeti c'è un giorno di cammino**: una fascia è larga un milione di caselle (48 ore a 6 caselle al secondo) e la sua
  superficie va avanti senza bordo; le terre stanno attorno al centro, ai margini il pianeta mette ciò che lo circonda (oceano, deserto,
  ghiaccio; nella fascia 0 il vuoto), che il kernel pianifica senza chiamate. Nessuno lo attraversa, e chi lo facesse arriverebbe al
  pianeta accanto senza rompere niente: non c'è un bordo da raccontare (regola 0).
- **Ogni pianeta ha il suo rilievo e il suo mare**: `Relief` e `worldLevels` prendono il seme e il livello del mare della fascia, non più
  uno per universo (dentro S5).
- **Il viaggio** (`travel`): al timone di un veicolo, una rotta fra i pianeti che l'atlante conosce. Il veicolo e chi a bordo ha
  accettato si spostano dello stesso Δ fino all'approdo della destinazione (un luogo dello spazioporto, pianificato dal kernel o dal
  Cartografo). Il kernel sposta **lo scorrimento del tappeto** di ognuno di Δ, non la sua posizione nel cerchio. Per qualche secondo il
  renderer mostra il veicolo da solo sulle stelle.
- **Il tappeto e la corona non se ne accorgono**: sono in due spazi (ADR-0004). La corona si mostra solo con `coronaRevealed()`
  (regola 8, ADR-0124), che guarda la posizione nel cerchio; il viaggio non la cambia. Se il tappeto è fermo e un veicolo porta un
  viandante oltre il cerchio, la corona si mostra: è il gioco, come a piedi.
- **L'origine mobile del renderer**: i vertici relativi all'origine del loro luogo, le mesh poste a `(cx · S − ox)` calcolato in JS a
  doppia precisione, `U.cutOff` relativo. Senza, due float vicini distano 1/64 di casella a 131 072 caselle e **1/8 a un milione**
  (2 voxel a 16 per casella; misurato in `mare-scavato.ts`).
- **Ciò che regge già**: le chiavi dei luoghi e i nomi in `maps/` sono numeri come oggi; `hash32` prende interi fino a 2^31; Lua e il
  JSON hanno i doppi. In molti ogni viandante ha il suo tappeto: due su pianeti diversi sono solo lontani, il server carica i luoghi
  attorno a ognuno, e il `me` oltre 8 caselle lo specchio lo prende dal server.

- **Genere**: movimento, rendering, rete, Concilio (il Cartografo battezza i pianeti alla Genesi). **Contratto**: A aggiuntivo, B nuovo.
- **Nel browser**: dall'hangar della stazione, una navetta, «rotta per X», il transito fra le stelle, l'atterraggio su una superficie con
  un altro cielo e un'altra gravità; nel cerchio la corona resta invisibile; nessun tremolio dei voxel lontano dall'origine.

### 2.8 La camera 3/4

- **Non cambia**: 3/4, inclinazione 0,95, giri a quarti; la regola 8 resta com'è.
- **Le stelle**: un cielo dietro e sotto tutto (una sfera di punti che segue la camera, più uno strato lento sotto il piano del pavimento
  per dare la profondità) al posto dei colori di `SKY`; la nebbia nera o spenta nel vuoto.
- **Al timone** lo zoom va più in là (da 15 a 30) per vedere la nave e la costa. Per la regola 8 è sicuro: la corona non si disegna per
  chi sta nel cerchio (ADR-0124), quindi nessuna inquadratura la mostra.
- **Costo**: dentro S1 (le stelle) e P3 (lo zoom al timone).

### 2.9 Lo spazio nel Concilio (S6)

- Il Cartografo alla Genesi: i terreni della natura del vuoto (lamiera, grate, regolite, ghiaccio, con `air`), gli ambienti (moduli di
  stazione, hangar, serra, miniera), i nomi di stazioni, asteroidi e pianeti; il prompt.
- La quarta parete: T278 ha trovato che il filtro vieta «programma di volo», «server», «simulazione d'attracco». Il prompt del tema
  insegna le parole del mondo (rotta, schermo, trasmissione); **niente eccezioni per natura** al filtro, che indebolirebbero la regola 0.
- **Costo**: 3 %.

---

## 3. Le primitive in una tabella

Il costo è in percentuale di una settimana, come la riga `- Pipeline:` dei task (T292, prendere e spostare i mobili, era il 4 %; T263, i
pannelli e i tasti di ogni viandante, l'8 %).

| Id | Primitiva | Genere | Contratto | Costo | Si vede nel browser | Sicurezza |
|---|---|---|---|---:|---|---|
| N0 | La natura del mondo (`universe.json → nature`) | Concilio, kernel | aggiuntivo | 2 % | la scelta nella Genesi | nessuna: un campo pubblico, fermo, scritto solo dal kernel |
| P1 | Il mare che si nuota | movimento, terreno, rendering | aggiuntivo | 5 % | nuotare, annegare | nessuna nuova: `free` sul server |
| P2 | L'arcipelago dall'atlante, il mare senza chiamate | terreno, Concilio | aggiuntivo | 5 % | le isole all'orizzonte | il costo: il mare è gratis, coste e isole entro `placesPerMinute` |
| P3 | Il veicolo, da soli | movimento, rendering | aggiuntivo | 6 % | governare, girare con la nave | Lua: `world.vehicle_set` entro i limiti |
| P4 | Il veicolo in molti | rete | aggiuntivo | 6 % | in due schede, il ponte fermo | il passo relativo, il timone, il rapimento (§ 5) |
| P5 | Lo Scultore delle navi | Concilio | aggiuntivo | 5 % | la nave nel laboratorio e nel porto | nessuna nuova |
| P6 | Porti, moli, secche | terreno, Concilio | aggiuntivo | 3 % | il molo e la nave affiancata | nessuna nuova |
| P7 | Affondare e relitti | movimento, rendering | aggiuntivo | 3 % | la nave che affonda | il danno fra viandanti solo con `pvp` |
| P8 | Il mare a schermo (facoltativo) | rendering | aggiuntivo | 2 % | onde, scia | nessuna |
| S1 | Il vuoto, il cielo, il giorno | terreno, rendering | aggiuntivo | 4 % | il bordo sulle stelle | nessuna nuova |
| S2 | L'aria e l'ossigeno | bisogni, UI | aggiuntivo | 4 % | la barra, la bombola | i bisogni restano del kernel |
| S3 | La gravità | movimento | aggiuntivo | 1,5 % | il salto lungo | nessuna |
| S4 | Le astronavi e le capsule | movimento, rete | aggiuntivo | 2 % | l'aggancio | come P4 |
| S5 | I pianeti e il viaggio, l'origine mobile | movimento, rendering, rete | aggiuntivo (via A) | 6 % | il transito, l'altro cielo | il consenso di chi è a bordo, il costo dei luoghi |
| S6 | Lo spazio nel Concilio | Concilio | aggiuntivo | 3 % | i terreni e i nomi | la quarta parete |

---

## 4. Il contratto (ADR-0136)

**Aggiuntivo vuol dire che un universo di oggi non se ne accorge.** Ogni primitiva qui sopra è inerte senza `nature` o senza i campi nuovi:
i `w` e `o` del seme restano solidi, la bozza senza `nature` è la stessa, il layout senza caselle `swim` o `void` è lo stesso. Un
universo dei Pirati scritto dal kernel 0.9.N non si apre su un kernel più vecchio (`checkKernelVersion`: la sua `Z` è sopra), quindi non
si rovina.

**La natura del mondo** (`universe.json → nature`): `water` (`wall` oggi, `swim`), `geography` (`continent` oggi, `archipelago`, `void`),
`sky` (`earth`, `stars`), `day` (secondi, 600 oggi), `air` (falso oggi), `planets` (vuoto oggi). La porta l'ambientazione della lista
(`WORLD_THEMES` accanto al testo: i Pirati `swim` e `archipelago`, lo spazio `void`, `stars`, l'aria, i pianeti); un testo scritto a mano
ha la natura di oggi. Si sceglie alla Genesi e poi non cambia, come `game` (ADR-0053): la ripara il validatore, la riscrive il kernel, il
Concilio non la scrive (`universe.json` non è in `councilMayWrite`). Non è un «reame»: la parola è delle 4 × 4 zone (glossario).

**Le tre trappole**, dove una primitiva diventerebbe un contratto nuovo:

1. **Il nuoto nei terreni del seme.** La Genesi riscrive i terreni di ogni universo (`toPalette` in `genesis.ts`, con la fisica dei codici
   di base), ma `upgradeFromSeed` porta il manifest del seme agli universi che non l'hanno riscritto: quelli senza Genesi (`?skip`, un
   universo non ancora generato, i test). Un `swim` messo sui `w` e `o` del seme arriverebbe lì, e il layout dei loro luoghi nuovi
   smetterebbe di scavare strade sull'acqua: regole del terreno cambiate, quindi `0.10.0`. Per questo il nuoto passa dalla natura, e il
   manifest del seme non cambia.
2. **La soglia del mare della bozza** (`cont < 0,24`). Il generatore è un modulo del seme che `upgradeFromSeed` porta agli universi che non
   l'hanno riscritto: cambiare la soglia sposterebbe il mare sotto i piani di tutti. La geografia nuova è un ramo su `nature` in cui gli
   universi di oggi non entrano, e N0 aggiunge il test che fissa la bozza e il layout di tre luoghi campione senza `nature` (la regola 2 di
   T183, mai scritta come test).
3. **I pianeti come coordinata** (via B del § 2.7): cambia la chiave di ogni luogo e `maps/`.

Le parti nuove del filo (`EntityView.vehicle`, `OtherView.on`, `step.on`) e del salvataggio (`state.json → vehicles`) sono aggiuntive: client
e server sono la stessa build, e il salvataggio legge il campo che manca.

**Quindi tutto entra nella 0.9**, una `Z` per task. Resta una decisione dell'autore, che non è di contratto: se il nuoto debba valere
anche negli universi nuovi delle altre ambientazioni. Portato dalla Genesi (i codici di base di ogni palette nuova) non tocca gli universi di
oggi, ma cambia ogni mondo nuovo: i fiumi non hanno più i ponti scavati dal kernel e i fossati dei castelli (`w` attorno ai timbri, con il
ponte levatoio) si nuotano. La raccomandazione è di tenerlo ai mondi la cui natura lo dice (domanda 1).

---

## 5. Le superfici di sicurezza

Questo task non ne apre: solo documenti e uno script del laboratorio che non scrive. Quelle che i task apriranno, con una voce nel
registro (`docs/sicurezza/registro.md`) quando nascono:

| Superficie | Rischio | Regola | Difesa proposta | Prova |
|---|---|---|---|---|
| Il passo relativo (`step.on`) | un client si dice a bordo di un veicolo lontano: un teletrasporto | 7, 8e | `on` accettato solo se il server lo ha già a bordo o se è entro 1,5 caselle dall'imbarco; x, y su un pavimento del ponte; il credito di passo sul cammino relativo; `FAR` nel riferimento del ponte | `tests/sicurezza/`, con `fakeLink` |
| Il timone | prendere la nave di un altro | `game.pvp` | il timone solo a chi è vicino e se è libero; si libera all'uscita, alla morte, alla disconnessione; il master lo libera; senza `pvp` nessuno prende un timone tenuto | idem |
| Il rapimento | il timoniere porta via gli altri, o su un altro pianeta | `game.pvp` | dal ponte ci si tuffa sempre; nel vuoto `travel` porta solo chi ha accettato, gli altri scendono all'aggancio prima della partenza | idem |
| Il danno | speronare, cannoneggiare i veicoli di altri viandanti | `game.pvp` | l'urto non danneggia; `world.vehicle_damage` su un veicolo di viandanti solo con `pvp` | kernel |
| Lua | spostare un veicolo, portare corpi | 1, 7 | `world.vehicle(id)` legge; `world.vehicle_set` solo spinta, giro e ancora, entro i limiti del manifest, NaN ignorato; Lua non scrive la posizione di un veicolo e non chiama `travel` (le rune che muovono il tappeto restano del master); `world.nature()`, `world.region_at()`, `world.islands()` in sola lettura | `tests/sicurezza/` sulla sandbox |
| Il salvataggio | un `state.json` gonfiato | 7 | `vehicles` al più `MAX_VEHICLES`, letto con validazione come `readMoved`; la stiva un contenitore con il suo tetto | kernel |
| Ciò che esce | un campo nuovo verso i client | 8f | `EntityView.vehicle` e `OtherView.on/lx/ly` a elenco; `nature` è pubblica come il resto di `universe.json` senza `ai` | `files.ts` |
| Il costo | un veicolo veloce o un viaggio fanno pianificare molti luoghi | 8e, 8i | mare e vuoto senza chiamate; coste, isole e approdi entro `placesPerMinute` e il ritmo (ADR-0196); `travel` nel ritmo dei messaggi pesanti e pagato da chi viaggia (`chi`) | `server.ts` |
| I bisogni | un client che si dà l'ossigeno | 8f | i bisogni sono componenti del kernel, che i campi dei pannelli non toccano | esiste già |

---

## 6. I task proposti, in ordine (da approvare)

Non sono nel backlog: li scrive chi pianifica, dopo le risposte dell'autore. Le dipendenze da T184 (le ambientazioni) e T185 (la
generazione) sono quelle del backlog di oggi.

| # | Task | Dipende da | Costo | Browser |
|---:|---|---|---:|---|
| 1 | **N0 · La natura del mondo**: `universe.json → nature` portata dall'ambientazione, fissata alla Genesi, riparata e tenuta come `game`; `world.nature()`; il test che fissa bozza e layout di tre luoghi campione senza `nature`; l'ADR (la regola 10 a nuoto, domanda 2) e `AGENTS.md` | T184 | 2 % | no |
| 2 | **P1 · Il mare che si nuota**: `swim` dalla natura, il corpo che nuota, la fatica e l'annegare, il salto in acqua, il layout che non scava l'acqua, il carico | 1 | 5 % | sì |
| 3 | **P3 · Il veicolo, da soli**: `vehicle`, chi è a bordo, il timone, l'ancora, le collisioni, `state.json → vehicles`, il verso a ogni fotogramma, lo zoom al timone, `world.vehicle*`; `mech.barca` senza il sedile a mano | 2 | 6 % | sì |
| 4 | **P5 · Lo Scultore delle navi**: la classe `vessel`, `waterline`, le aree, i controlli, il prompt, la risposta offline, le taglie sul banco | 3 | 5 % | sì (laboratorio) |
| 5 | **P2 · L'arcipelago dall'atlante**: le isole del kernel, la regola dello stretto, le isole ferme, il mare aperto senza chiamate, il Cartografo che battezza, `world.region_at`/`islands` | 2 | 5 % | sì |
| 6 | **P4 · Il veicolo in molti**: la parte `vehicle` estrapolata, il passo relativo, gli altri a bordo, il timone in molti, le voci di sicurezza | 3 | 6 % | sì (due schede) |
| 7 | **P6 · Porti, moli, secche** | 4, 5 | 3 % | sì |
| 8 | **P7 · Affondare e relitti** | 6 | 3 % | sì |
| — | *qui si può generare l'universo dei Pirati (T185)* | | | |
| 9 | **S1 · Il vuoto, il cielo, il giorno** (stazioni e asteroidi con il meccanismo di P2, le stelle) | 1, 5 | 4 % | sì |
| 10 | **S2 · L'aria e l'ossigeno** | 9 | 4 % | sì |
| 11 | **S3 · La gravità** | 1 | 1,5 % | sì |
| 12 | **S4 · Le astronavi e le capsule** | 6, 9 | 2 % | sì |
| 13 | **S5 · I pianeti e il viaggio, l'origine mobile del renderer** | 12 | 6 % | sì |
| 14 | **S6 · Lo spazio nel Concilio** | 9, 10, 11 | 3 % | no |
| — | *qui si può generare l'universo dello spazio (T185)* | | | |
| 15 | **P8 · Il mare a schermo** (facoltativo) | 3 | 2 % | sì |

**Totale**: 57,5 % con P8 (Pirati 35 %, spazio 20,5 %, la natura 2 %), quindici task. **I Pirati giocabili** (1-6): 29 %. Lo spazio
senza pianeti (via C, domanda 3): 14,5 %. Ogni task che tocca `src/kernel/` sale di una `Z`; nessuno cambia il contratto. Ogni concetto
nuovo ha la sua voce nel glossario nello stesso commit (natura del mondo, veicolo, a bordo, nuotare, vuoto, ossigeno, approdo).

---

## 7. Le domande per l'autore

Sono in [`docs/pipeline/domande/T432.md`](../pipeline/domande/T432.md), con le opzioni e la raccomandazione:

1. Il nuoto solo nei mondi che lo dicono (raccomandato) o in ogni universo nuovo, dalla Genesi (fiumi e fossati di ogni mondo si nuotano)?
2. La regola 10 con le isole: connesse a nuoto (raccomandato) o il mare come muro con una barca a ogni approdo?
3. I pianeti: fasce lontane dello stesso piano (raccomandato), una coordinata nuova, o niente pianeti nel primo universo dello spazio?
4. L'ordine: prima i Pirati e il veicolo (raccomandato), poi lo spazio; e se generare i Pirati dopo il task 6 o dopo l'8.
