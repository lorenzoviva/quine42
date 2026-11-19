# ADR-0224 — La fisica rimodellabile, la natura del mondo e l'acqua che si nuota ovunque

Data: 2026-11-19 · Stato: accettato (task T437 del backlog, N0 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md); decisioni
dell'autore D64, 19/11) · Riferimenti: ADR-0136 (la versione del kernel e il contratto), ADR-0152 e ADR-0156 (le migrazioni), ADR-0053 (la
partita scelta alla Genesi), ADR-0011 (il Fisico), ADR-0041 e ADR-0064 (la regola 10), ADR-0211 (i piani di prima e il segno `vpt`),
ADR-0221 (ciò che il kernel non sa fare non si chiede), ADR-0109 (ciò che esce ai client)

## Contesto

Lo studio di T432 proponeva il nuoto acceso solo dove `universe.json → nature` lo dice, per non toccare il contratto. L'autore (D64) ha deciso
altro: **si nuota ovunque**, anche negli universi di oggi; la regola 10 cambia, e le isole si raggiungono a nuoto anche oltre i 4 luoghi
proposti; e soprattutto la direzione: **primitive della fisica che il Concilio rimodella**, una predisposizione più che un'implementazione. Oggi
la fisica del corpo e del terreno è fatta di costanti del kernel e di un solo dato, `solid`: l'acqua (`w`, `o`) è solida per costruzione
(`BASE_CODES`), il passo e la fatica del corpo sono numeri di `core.movement` e di `sys.needs`, la gravità e l'aria non esistono.

## Decisione

### 1. Le primitive della fisica sono dati, entro tetti del kernel

Il kernel le legge da un punto solo, `src/kernel/nature.ts`, sempre entro i suoi limiti (regola 7: ciò che non è un numero, o è fuori, è il più
vicino che può essere). Ognuna ha un posto, chi la scrive e il task che la rende vera:

| Primitiva | Che cosa | Dove sta | Limiti del kernel | Chi la scrive | Vera da |
|---|---|---|---|---|---|
| **Modo di attraversare** (`cross`) | come un corpo passa una casella: `walk` a piedi, `swim` a nuoto, `none` per niente | il terreno (`TerrainDef.cross`) | uno dei tre; `swim` solo in un liquido; coerente con `solid` | il kernel per i codici di base e per lo strato (muri, alberi, rocce mai; pavimenti e porte sempre), il Fisico per il resto: un terreno a terra si cammina o no, un altro liquido si nuota o no (la lava no) | i dati: T437; il corpo e il layout: T438 |
| **Passo** (`speed`) | il moltiplicatore del passo del corpo sulla casella | il terreno | a piedi 0,3-1,5 (come dalla Genesi), a nuoto 0,2-0,6 (0,4 se non detto) | il Fisico, anche per l'acqua di base | a piedi: già; a nuoto: T438 |
| **Fatica** (`fatigue`) | quante volte l'energia di un secondo costa più che camminando | il terreno, solo dove si nuota | 1-6 (3 se non detto) | il Fisico | T438, nel kernel e non in `sys.needs` |
| **Profondità** (`depth`) | quanto è profonda l'acqua che si nuota: `shallow`, `deep` | il terreno, solo dove si nuota | uno dei due (`deep` se non detto; `w` bassa, `o` profonda) | il kernel per `w` e `o`, il Fisico per un altro liquido | T438 (il carico che ferma alla riva), T439 (il pescaggio) |
| **Aria** (`air`) | se un corpo respira sulla casella | il terreno; poi la regione e l'ambiente | vero o falso (vero se non detto) | il Fisico | T446 |
| **Geografia** | che cosa la bozza fa del mondo: `continent`, `archipelago`, `void` | `universe.json → nature` | ciò che il kernel sa fare (oggi `continent`) | il kernel, dall'ambientazione | `archipelago` T441, `void` T445 |
| **Cielo** | `earth`, `stars` | `nature` | idem (oggi `earth`) | il kernel, dall'ambientazione | `stars` T445 |
| **Giorno** | i secondi di un giorno del mondo (600), 0 per una luce che non cambia | `nature` | idem (oggi 600) | il kernel, dall'ambientazione | T445 |
| **Gravità** | il peso di un corpo contro quello della terra (1); il salto scala con lei | `nature`; poi la regione e l'ambiente | 0,2-2 quando T447 la apre (oggi 1) | il kernel, dall'ambientazione; per regione il master e il Fisico | T447 |
| **Respiro** (`oxygen`) | se i corpi contano il fiato (il bisogno `oxygen`) | `nature` | idem (oggi falso) | il kernel, dall'ambientazione | T446 |

- **`solid` resta ciò che non si cammina**, com'è sempre stato, e tutto il codice che lo legge (il layout di oggi, le cose posate, gli NPC, le
  vie, `world.free`) resta com'è: `cross` dice come si attraversa ciò che non si cammina (`crossingOf`: a nuoto un liquido che lo dice, altrimenti
  per niente). Il validatore rifiuta un `cross` che contraddice `solid`, il nuoto fuori da un liquido, profondità e fatica dove non si nuota, il
  passo dell'acqua fuori dal suo intervallo (`terrainPhysicsErrors`).
- **Il Fisico rimodella i terreni alla Genesi** (`genesis.physics`, lo schema con `cross`, `speed`, `fatigue`, `depth`), e il kernel scrive la
  tavolozza con `physicsOf` dentro lo strato e i limiti: dei codici di base il Fisico dice solo il passo e la fatica dell'acqua. **Dopo la
  Genesi** un terreno cambia solo per mano del kernel (come oggi le azioni imparate, `learnAction`), con un commit e gli stessi limiti; il
  **modo di attraversare** di un codice che un luogo pianificato usa non cambia mai (cambierebbe le sue caselle: regola 10 e regola 2 di T183),
  il passo, la fatica, la profondità e l'aria sì. Il mondo si rimodella anche come oggi: un terreno nuovo, una casella cambiata da un effetto
  (`terreno`), il fiume che gela è caselle nuove, non l'acqua che smette di nuotarsi. La via che porta al Fisico queste richieste a mondo acceso
  (il Referente, «Altro…») è un task dopo questi; le regioni e gli ambienti che cambiano gravità e aria sono di T446 e T447.
- **Mai Lua fuori da `Host`** (regola 1): Lua legge la natura con `world.nature()`, una copia a ogni chiamata, e i terreni con `world.tile` e
  `world.speed_at`; non scrive né l'una né gli altri. Le regole del mondo (`world/rules.json`) restano giudizi in parole: un giudizio che cambia
  la fisica diventa un dato di un terreno o di una regione, mai un numero nel testo di una regola.

### 2. La natura del mondo

`universe.json → nature` (`WorldNature`: `geography`, `sky`, `day`, `gravity`, `oxygen`) la porta l'ambientazione (`WorldTheme.nature`), la scrive
il kernel alla Genesi (`chooseNature`, a ogni Genesi: il mondo rinasce), e da lì **non cambia**, come la partita: il primo universe.json la fissa,
uno dopo che dice altro torna com'era (`keepNature`, accanto a `keepGame`). La ripara `repairNature`: **accetta solo ciò che questo kernel sa
rendere vero** (`NATURE_ACCEPTS`), il resto è il mondo di oggi (ADR-0221). Un universo senza `nature` è il mondo di oggi: i predefiniti
(`DEFAULT_NATURE`) non cambiano mai. Il Concilio non la scrive (`universe.json` non è in `councilMayWrite`). È pubblica come il resto di
universe.json fuori da `ai` (`UNIVERSE_FIELDS` in `src/session/files.ts`), e ai client vanno anche i campi nuovi dei terreni (`TILE_FIELDS`:
il client predice i passi del suo viandante e disegna chi nuota). **Oggi nessuna ambientazione porta una natura diversa**: ognuna la avrà dal
task che la rende vera (l'arcipelago dei Pirati da T441, il vuoto e le stelle dello Spazio da T445-T450), così un universo nato prima non ha
una natura che il suo kernel non sapeva fare. Lua la legge con `world.nature()` (`Host.nature`, `prelude.lua`, `LUA_API`, il prompt
dell'Ingegnere).

### 3. Il nuoto ovunque cambia il contratto: 0.10

Che `w` e `o` si nuotino in **ogni** universo cambia il senso di una primitiva e le regole del terreno degli universi che esistono: per ADR-0136
è un contratto nuovo. Il kernel sale a **0.10.0** con la migrazione `0.9 → 0.10` (`migrate0_10` in `src/kernel/migrations.ts`): nei manifest
dell'universo i codici `w` e `o`, liquidi che non si camminano, prendono `cross: swim`, la loro profondità (`w` bassa, `o` profonda) e un passo da
nuoto (0,4, se non ne avevano già uno: l'1 che il Cartografo dava all'acqua era un passo da piedi). Restano `solid`. Gli altri liquidi (la lava)
restano invalicabili, i programmi non cambiano (le carte fatte a mano di 0.9 si leggono come sono), un universe.json senza `nature` resta il mondo
di oggi, un manifest dei terreni che seguiva il seme continua a seguirlo (il seme lo dice da sé). Le alternative scartate: accendere il nuoto
dalla natura (non è ciò che l'autore vuole) o dai terreni del seme senza migrazione (arriverebbe agli universi senza Genesi e non a quelli con:
due regole per lo stesso codice).

**I piani dei luoghi non cambiano.** Il layout ricalcola le caselle di un luogo pianificato a ogni caricamento, quindi il kernel 0.10.0 **scava
ancora l'acqua** come prima: i dati dicono che si nuota, il corpo e il layout lo faranno da T438. Il layout che non scava più l'acqua vale solo
per i piani che il kernel fa da allora, che lo dicono con un **segno sul piano** (come `vpt` per i timbri a 16, ADR-0211; T438 ne sceglie il
nome); un piano senza segno è di prima e tiene i suoi sentieri sull'acqua, che diventano ponti e moli. `tests/luoghi-campione.test.ts` fissa la
bozza e il layout di tre luoghi del seme (la partenza con lo stagno, la costa, il mare aperto: oggi 0, 16 e 37 caselle d'acqua scavate) e dice
che cosa fare se cambiano.

### 4. La regola 10: connesso a piedi o a nuoto

La regola 10 di `AGENTS.md` diventa: **ciò che sembra invalicabile lo è, e ogni luogo è connesso a piedi o a nuoto.** Le garanzie del kernel:

1. Il layout di un piano col segno di T438 conta come via le caselle che si nuotano e non le scava mai; scava solo ciò che non si attraversa
   (vegetazione, roccia), mai i muri, come oggi. Un piano di prima resta scavato.
2. Ogni casella che si cammina accanto all'acqua è un approdo: fra vicini il rilievo non supera mezza casella e la terra non sta sotto il mare
   (ADR-0048); da un'isola chiusa da scogli il layout scava nella roccia fino all'acqua, non nell'acqua.
3. **Le isole lontane**: non un tetto di 4 luoghi ma la garanzia dello stretto che T441 misura sulla fatica a nuoto (il valore oltre 4 col margine
   che resta, con gli scogli o gli isolotti di riposo che il kernel mette sulla rotta), scritta nell'atlante delle isole: ogni isola è raggiungibile
   a nuoto, con l'energia piena, da un'altra della catena che porta alla partenza.
4. **Il nuoto ha un limite e non è un muro raccontato**: chi nuota si stanca (T438) e annega come muore di sete, secondo il livello della morte della
   partita; nessun confine invalicabile entra nei contenuti (regola 0).
5. Gli NPC non nuotano (per ora): la loro via resta sulla terra e chi deve andare su un'altra isola rinuncia, come oggi chi non ha via (regola 10
   vale per i viandanti; un traghetto è un task dopo).
6. Nel vuoto (T445) non si nuota: lì ogni approdo ha la sua capsula, rimessa dal kernel se manca (§ 2.2 dello studio).

### 5. Come restano vere la regola 7 e la regola 10 quando il Concilio rimodella

- **Regola 7**: ogni grandezza ha un lettore solo (`terrainPhysics`, `repairNature`) con i suoi limiti; il validatore rifiuta il manifest che li
  passa; `toPalette` scrive dentro i limiti qualunque cosa dica il Fisico; Lua ha una copia e non scrive; `NaN`, `nil`, un tipo sbagliato
  diventano il predefinito.
- **Regola 10**: il modo di attraversare di un codice usato da un luogo pianificato non cambia; ciò che cambia l'attraversare di un luogo
  pianificato è una casella nuova (un effetto, `world.set_tile`), con la stessa guardia di oggi; un layout che cambia le caselle dei luoghi di
  prima è un contratto o ha il suo segno sui piani nuovi (§ 3).

## Conseguenze

- Kernel **0.10.0**, contratto 0.10: ogni universo di 0.9 si apre portato dalla migrazione; un universo di 0.10 non si apre su un kernel 0.9.
  Le carte fatte a mano di 0.9 si leggono in 0.10 (`PROGRAM_STEPS`). La radice degli universi nati dal seme è quella del contratto 0.10.
- Cose nuove: `src/kernel/nature.ts` (`crossingOf`, `terrainPhysics`, `terrainPhysicsErrors`, `physicsOf`, `TERRAIN_LIMITS`, `WATER_CODES`,
  `WorldNature`, `DEFAULT_NATURE`, `NATURE_ACCEPTS`, `repairNature`), i campi `cross`, `depth`, `fatigue`, `air` di `TerrainDef`,
  `UniverseConfig.nature`, `Kernel.nature()`, `world.nature()`, lo schema del Fisico con `cross`.
- Restano ai task dopo: **T438** il corpo che nuota (passo, fatica, annegare, salto, carico), il layout che non scava l'acqua col suo segno sui
  piani, gli NPC che non nuotano, il server che ferma chi cammina sull'acqua; **T439** il pescaggio dei veicoli; **T441** l'arcipelago, lo stretto
  e `archipelago` in `NATURE_ACCEPTS`; **T445** il vuoto, le stelle, il giorno; **T446** l'aria e il respiro; **T447** la gravità; la via del
  Fisico a mondo acceso, un task da scrivere.
- Sicurezza: una superficie nuova per Lua, `world.nature()`, in sola lettura (una copia: niente arriva al kernel); un campo nuovo verso i client,
  `nature`, pubblico e scritto solo dal kernel; i campi dei terreni verso i client, già pubblici come il resto delle caselle. Nessuna in
  multigiocatore oltre questi: il filo non cambia.
