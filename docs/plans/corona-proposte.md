# La corona: proposte per gli interni e gli edifici dimenticati

> Proposta per l'autore (sessione del 23/10/2026, task T26 e T27 del [backlog](backlog.md)). Niente è ancora
> costruito: ogni sezione finisce con le domande da decidere. Le specifiche dell'autore sono in
> [`docs/userchats/to-do-2026-10-22.md`](../userchats/to-do-2026-10-22.md); i programmi degli esterni si scrivono con
> [`docs/prompts/gemini-strutture-corona.md`](../prompts/gemini-strutture-corona.md) (T19, T31).

Obiettivo dell'autore: **ogni struttura della corona completamente sua**, fuori (un programma `corona-<id>.xml`) e
dentro (un apparecchio che fa capire il lavoro della squadra, come lo schermo, il silos, le stampanti e il grafo di
T21-T28). Stile neon punk, lo studio di una software house; dentro più grande di fuori.

## 0. Gli edifici che ci sono davvero

Un edificio nasce per ogni gruppo di file (`folderOf` e `ROOMS` in `src/kernel/corona.ts`). Nel seme sono **12**, le
specifiche ne coprono 8:

| id | Nome | Squadra | Cosa tiene (seme) | Esterno | Interno |
|---|---|---|---|---|---|
| `magia` | Torre della Magia | narratore | `magic.*`, `runes.*` | ✔ fatto (T31) | ✔ T22 |
| `persone` | Studio dei personaggi | narratore | `npc.*` | scheda T19 | ✔ T23 |
| `cose` | Laboratorio delle cose | fisico | `obj.*`, `object.*` | scheda T19 | ✔ T24 |
| `oggetti` | Magazzino degli oggetti | fisico | `items.*`, `item.*` | scheda T19 | ✔ T24 |
| `luoghi` | Ufficio dei luoghi | cartografo | `world.*` (terreni, ambienti) | scheda T19 | **T26 (§1)** |
| `sistemi` | Sala sistemi | ingegnere | `sys.*` | scheda T19 | **T27 (§2)** |
| `nucleo` | Il Nucleo | ingegnere | `core.*` | scheda T19 | ✔ T28 |
| `concilio` | Sala del Concilio | arbitro | `prompts/` | scheda T19 | ✔ T25 |
| `universo` | **Direzione** | arbitro | `universe.json` | — | solo scaffali |
| `mondo` | **Biblioteca del Mondo** | narratore | `world/` (bibbia, stile, canone, atlante; poi persone, trame, regole, stato, consumi, grafo) | — | solo scaffali |
| `galleria` | **Galleria dell'Artista** | artista, scultore | `models/` (i programmi) + i modelli esposti | — | modelli e «riscolpisci» |
| `cartografia` | **Studio del Cartografo** | cartografo | i terreni esposti, l'atlante | — | terreni e atlante |
| `altro` | **Archivio** | ingegnere | ciò che ha un prefisso sconosciuto: oggi **le meccaniche** (`mech.*`, `kernel.ts:3250`) | — | solo scaffali |

Due cose da notare:
- **Studio del Cartografo e Ufficio dei luoghi** sono la stessa squadra e lo stesso lavoro (i terreni stanno in
  `world.terrain`, gli ambienti in `world.layouts`, l'atlante è del Cartografo): propongo di **unirli** (§1).
- **L'Archivio non è teorico**: ogni meccanica che la Fucina delle meccaniche crea (l'equipaggiamento, ADR-0028) ci
  finisce, in un edificio senza identità. Propongo di mandare `mech.*` alla **Sala sistemi** (sono sistemi
  dell'Ingegnere con un pannello) e di tenere l'Archivio solo come riserva (§3.5).

---

## 1. T26 · L'Ufficio dei luoghi, dentro

**Come lavora il Cartografo** (per decidere cosa mostrare). Per ogni luogo di 18 × 18: la bozza Lua continua
(`g p t w r`) → i varchi sui bordi (deterministici) → il programma dell'ambiente (regole MarkovJunior, bordo congelato)
→ i sentieri garantiti (scavati dal kernel) → i lotti, ciascuno con la sua struttura girata verso la porta → le cose
dentro e fuori, il bottino, le rune. Tutto è deterministico (`layout()` in `src/kernel/layout.ts` è una funzione pura) e
il piano è salvato in `maps/`: **si può rifare ogni passo senza chiamare l'IA**. Sopra, l'atlante dà regione e direzioni.

**Proposta: il plastico.** L'Ufficio dei luoghi è il cantiere mobile (fuori, la scheda di T19); dentro è la sua
plancia di comando.
- **Il plastico** (piano terra, al posto della vetrina, 3 × 3 caselle come la stampante): un tavolo olografico con un
  luogo **già pianificato** in miniatura, a voxel, con le sue altezze, le strutture e le cose. «<» «>» scelgono il luogo
  (prima quello dove il viandante è stato per ultimo, poi gli altri per distanza). Guardare non genera nulla.
- **Le fasi**: una leva (o due pulsanti «−» «+», una casella sotto il plastico) fa scorrere le sei fasi del lavoro del
  Cartografo sullo stesso luogo: *1 bozza · 2 varchi · 3 ambiente · 4 sentieri · 5 lotti e strutture · 6 cose e rune*.
  Ciò che la fase aggiunge si accende di verde (i sentieri scavati, i varchi, i lotti con la porta). Si vede la
  complessità: un luogo non è disegnato, è costruito a strati, e ogni strato ha una regola.
- **Il pannello** (E o clic): nome, regione, ambiente (con il suo programma, «Apri il file»), cosa c'è dentro e fuori,
  le strutture, le rune, la fase scelta spiegata in una riga, «Apri il file» del piano (`maps/…`).
- **L'atlante** (oggi nello Studio del Cartografo) si sposta qui, su un tavolo a parete.
- **Il campionario** (primo piano): i terreni (oggi nello Studio del Cartografo) e un riquadro per ambiente, il suo
  programma fatto girare su una bozza di prova (come fa già il validatore), con «riscolpisci» per i terreni come oggi.

**Lavoro, in pezzi** (uno per sessione):
- **T26a** · il plastico: voce `showcase` con `source: 'luoghi'`, `device: 'plastico'`; `showcaseEntries('luoghi')` dai
  piani salvati; la miniatura nel renderer (le colonne del terreno e le strutture ridotte, come la stampante riduce le
  cose); pannello. Test: le voci, la miniatura deterministica.
- **T26b** · le fasi: `layout()` che restituisce anche le griglie intermedie (o un `layoutStages()` accanto), la leva,
  l'evidenza di ciò che cambia.
- **T26c** · l'unione con lo Studio del Cartografo (se decisa): terreni e atlante nell'Ufficio, il posto del Cartografo
  al tavolo del Concilio porta qui, ADR breve (cambia la mappa dei file sugli edifici).

**Domande**
1. Unire lo Studio del Cartografo all'Ufficio dei luoghi? (Proposta: **sì**; un edificio in meno lascia più arco agli altri.)
2. Le sei fasi ti convincono, o basta il plastico finito?

---

## 2. T27 · La Sala sistemi, dentro

**Cosa c'è da far apprezzare.** I sistemi sono Lua veri che girano **ogni tick**, in ordine (`order`): movimento (10),
tappeto (20), fisica (25), vagabondaggio (30), seguire (31), bisogni (40), fuoco (45), più quelli che l'Ingegnere forgia.
Ognuno è poche decine di righe che, insieme, fanno vivere il mondo. Il rischio è mostrarli come testo; l'idea è
mostrarli **mentre lavorano**.

**Proposta: la sala macchine e il banco di prova.** Fuori è la base sotterranea (scheda di T19); dentro, la sala di
controllo della base.
- **La catena** (parete lunga): ogni sistema è una stazione su un nastro luminoso, nell'ordine del tick; un impulso la
  percorre a ogni tick. Su ogni stazione, dal vivo: quante entità ha toccato, quanto tempo ha preso (ms), se è in errore
  (rossa, con il guasto: `faults`). Il nastro dice da solo «tutto questo succede 60 volte al secondo». Costo: misurare
  `runModule` per sistema (poche righe nel kernel).
- **Il banco di prova** (piano terra, al posto della vetrina): una teca di vetro 3 × 3 con un **caso** in miniatura.
  «<» «>» scelgono il sistema, e la teca mette in scena un caso d'uso in tre momenti, a ciclo: **prima** (la scena),
  **la regola** (le righe di codice che contano, accese sullo schermo sopra la teca), **dopo** (cosa è cambiato).
  Esempi per il seme:
  - *Fuoco*: una fiamma accanto a un cespuglio e a una cassa; il cespuglio brucia, la cassa no; un viandante di prova
    perde salute, con lo scudo no.
  - *Bisogni*: le barre di fame e sete che scendono (la sete più in fretta, di più con la fatica); a zero cala la
    salute, sopra metà torna.
  - *Vagabondaggio*: due persone che vanno alla loro meta di mattina, alla piazza di sera.
  - *Fisica*: una cassa spinta che si ferma contro un masso.
  - *Seguire*: una persona a cui il viandante ha chiesto di seguirlo gli va dietro; se resta indietro di 14 caselle
    lo perde di vista e torna a vagare.
- **Il pannello** (E o clic): cosa fa il sistema (la `description` del manifest), il caso in parole, il codice con le
  righe del caso evidenziate, le misure della catena, «Apri il file».

**Due modi di fare il caso** (la decisione vera di T27):
- **A · Codice vero** *(proposta)*: la teca è un mondo in miniatura, un secondo kernel minimo (`Kernel.boot` con i soli
  moduli `core.*` e il sistema scelto, una scena di 5 × 5 caselle) che gira davvero dentro la teca. Ciò che si vede è ciò
  che il codice fa: se il giocatore riscrive il sistema, il caso cambia (o si rompe, e si vede). Per i sistemi del seme
  le scene le scrivo io (`casi` nel manifest: entità, componenti, durata, cosa guardare); per quelli nuovi le scrive
  l'Ingegnere quando forgia (un campo in più nello schema, provato dal validatore come i programmi di layout: una
  chiamata in più per sistema forgiato, nessuna per guardare). Lavoro: 3 sessioni.
- **B · Raccontato**: niente secondo kernel. Il caso è una scena fissa (prima e dopo come due modelli) con il testo; più
  semplice (1 sessione), ma non dice la verità quando il codice cambia.

**Lavoro, in pezzi** (con A): **T27a** la catena con le misure dal vivo; **T27b** il banco con un kernel in
miniatura e i casi del seme; **T27c** i casi dei sistemi forgiati (schema dell'Ingegnere, `MockModels`, validatore).

**Domande**
3. A (codice vero, in miniatura) o B (raccontato)?
4. Le meccaniche (`mech.*`, oggi nell'Archivio) vanno nella Sala sistemi, con i loro pannelli provabili al banco?

---

## 3. Gli edifici dimenticati

Proposte di esterno (per una scheda del prompt di T19) e di interno, con lo stesso criterio: fuori si riconosce il
mestiere, dentro c'è un apparecchio che lo fa vedere. Il colore è quello della sala (`ROOMS`).

### 3.1 La Direzione (`universo`, Arbitro, `ffcf5c` oro)
È la regia della software house, e dentro la sua **sala operativa** (war room): dove si vede, in un colpo d'occhio,
che cosa sta succedendo all'universo, che cosa costa, che cosa si è rotto e quale versione vale. *(Approvata il 23/10.)*
- **Esterno: la regia.** Un edificio basso e largo, a sbalzo su pilastri, la facciata intera un **maxischermo curvo**
  (pannelli neri con pixel oro che scorrono: un'animazione) e sopra una **torre di trasmissione** sottile con le luci
  d'ostacolo che lampeggiano. Insegna «DIREZIONE». Accanto alla Sala del Concilio fa la coppia: il Concilio decide, la
  Direzione dirige.
- **Interno: la sala operativa.** Penombra, tutto rivolto verso la parete di schermi, luci dal basso.
  - *Il tavolo della situazione* (al centro, 5 × 3 caselle, al posto della vetrina): il mondo visto dall'alto, ma non
    come geografia (quella è l'atlante, nell'Ufficio dei luoghi): come **operazioni**. Il viandante, i luoghi che il
    Concilio sta generando adesso (pulsano), le trame aperte come segnalini sulle loro regioni con la tappa a cui sono, le
    missioni del diario, i guasti dove sono accaduti (rossi). Clic → pannello con le operazioni in corso.
  - *La parete di schermi* (davanti, larga quanto la sala, il maxischermo visto da dentro), in tre campi:
    a sinistra la **linea del tempo** dei commit (una pellicola: «<» «>» la scorrono, il clic dice cosa è cambiato e chi
    l'ha voluto; guardare non torna indietro, `R` resta l'unico modo); al centro il **registro dal vivo** del Concilio
    (`kernel.feed()`: chi sta lavorando, a cosa, con quale modello); a destra il **quadro dei costi** (`kernel.usage` per
    agente e per compito, in dollari, con i budget di `universe.json` come fondo scala).
  - *Il livello di allerta* (una fascia luminosa che corre sotto il soffitto): verde, ambra o rossa secondo lo stato
    (guasti aperti, rifiuti del validatore nell'ultima ora, budget oltre l'80 %), con il motivo nel pannello.
  - *Le postazioni* della squadra dell'Arbitro in file davanti agli schermi (le scrivanie di oggi): chi lavora nel
    registro si vede alla sua console.
  - Lavoro: tre pezzi (tavolo della situazione; parete di schermi; allerta e postazioni). Guardare non cambia nulla.

### 3.2 La Biblioteca del Mondo (`mondo`, Narratore, `7dd87d` verde)
È la memoria del Narratore: la bibbia, il canone, lo stile, le regole, le persone, le trame. La pila di libri è stata
scartata (didascalica). Tre alternative più eleganti, in cui il libro non si vede ma si sente. *(Scelta A, il chiostro, il
23/10: scheda `mondo` nel prompt di T19.)*
- **A · Il chiostro** *(proposta)*: un edificio basso e quadrato, un portico di pilastri neri sottilissimi e fitti (un
  filo di neon verde alla base di ognuno) attorno a una **corte aperta** con uno specchio d'acqua scura; sul fondo
  dell'acqua le rune del canone, accese. In mezzo, una sola lanterna alta e sottile. Orizzontale e quieto: è l'unico
  edificio del campus che non sale, e per questo si nota accanto alla Torre e al Nucleo. La memoria come un luogo dove
  si cammina piano.
- **B · La stele**: un monolite nero, sottile e alto (meno della Torre), spaccato da una fenditura verticale di luce; la
  facciata a lamelle verticali finissime, illuminate da dietro: pagine viste di taglio, ma astratte. Davanti, una vasca
  che lo riflette.
- **C · Il nastro**: una sola lastra che si avvolge salendo in spirale, come una pagina srotolata, con una linea di neon
  sul bordo. La più scultorea; anche la più difficile da scrivere in MarkovJunior.
- **Interno** (vale per tutte): *il leggio* (al posto della vetrina), un libro aperto olografico; «<» «>» sfogliano la
  bibbia (fatti, luoghi, misteri, personaggi), il clic apre la pagina nel pannello con i nodi del grafo che la toccano.
  *Le tavole delle regole* a parete (ogni giudizio di `rules.json` una lastra, le ultime brillano). *Il canone* inciso
  sopra la porta. Con A, il leggio sta nella corte, sull'acqua.

### 3.3 La Galleria dell'Artista (`galleria`, Artista e Scultore, `ff8ad8` rosa)
*(Approvata il 23/10.)*
È il museo dei modelli e la bottega dello Scultore.
- **Esterno: il museo-cubo.** Un cubo nero sollevato su un piedistallo di vetro, con una grande cornice neon sulla
  facciata come un quadro; nel piazzale davanti un **plinto** con una scultura che cambia (un modello della libreria:
  il kernel ne posa uno a caso a ogni visita; costa nulla, è un'istanza). Insegna «GALLERIA DELL'ARTISTA».
- **Interno: il tornio dello Scultore** (al posto della vetrina): un piedistallo che gira con il modello scelto, e il suo
  programma che si **esegue passo passo** (i passi di MarkovJunior, come nel laboratorio), «<» «>» per il modello; il
  pannello mostra le quattro foto, il voto e i consigli dell'Artista, il programma, «riscolpisci». I quadri di oggi
  restano sulle pareti.

### 3.4 Lo Studio del Cartografo (`cartografia`)
Proposta: **unito all'Ufficio dei luoghi** (§1, domanda 1). Se invece vuoi tenerlo: un **osservatorio** (cupola con la
fenditura e un telescopio che guarda verso il cerchio), dentro l'atlante come una mappa stellare sulla cupola.

### 3.5 L'Archivio (`altro`)
Se le meccaniche vanno alla Sala sistemi (domanda 4), l'Archivio nasce solo per un prefisso che il kernel non conosce,
cioè quasi mai. Proposta: un esterno semplice e suo (una **pila di container** neri con le strisce neon, gru a ponte),
dentro scaffali come oggi. Se invece le meccaniche restano lì, diventa l'**Officina delle meccaniche** (un capannone
con un banco dove il pannello della meccanica si prova a vuoto) e merita una scheda piena.

**Domande**
5. Le tre proposte (regia, libri impilati, museo-cubo) vanno bene come base per le schede di Gemini?
6. L'Archivio: pila di container (riserva) o Officina delle meccaniche?

---

## 4. Dopo le risposte

- Le schede approvate vanno nel prompt di T19 (`gemini-strutture-corona.md`): scatola, neon, parole tue, indicazioni.
- T31 cresce con gli id nuovi (`universo`, `mondo`, `galleria`, ed eventualmente `altro`).
- Nel backlog: T26a-c, T27a-c e un task di interno per Direzione, Biblioteca e Galleria (T32-T34).
