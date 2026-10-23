# Prompt per Gemini CLI: le strutture della corona

Task T19 del [backlog](../plans/backlog.md). L'autore è abbonato a Gemini: Gemini CLI (un agente con i file del
progetto, la shell e il browser) scrive **lui stesso** i programmi MarkovJunior degli esterni della corona e li
collauda nel laboratorio, senza la `GEMINI_API_KEY` del progetto (le chiamate a pagamento restano al gioco). Una
struttura per sessione; T20 li porta poi nel gioco.

## Come si usa

1. Apri Gemini CLI nel worktree `H:\projects\rune\.claude\worktrees\step8.2A-lab3d` (branch `3d`), con il modello
   più forte disponibile in ragionamento alto (oggi `gemini-3.8-flash`, effort *high*).
2. Incolla il **prompt comune** qui sotto, sostituendo `<ID>` con l'id della struttura (in ordine: `magia`,
   `persone`, `cose`, `oggetti`, `luoghi`, `sistemi`, `nucleo`, `concilio`, poi `universo`, `galleria` e `mondo`, aggiunte il 23/10). La scheda della struttura è più sotto
   in questo stesso file: Gemini la legge da qui.
3. A fine sessione guarda le foto in `lab/out/mjx/corona-<ID>.png` e il modello nella sandbox; se va bene, il
   commit l'ha già fatto lui; altrimenti scrivigli cosa cambiare nella stessa sessione.
4. Quando ci sono tutte (o quelle che ti bastano), T20 le mette nel gioco.

## Il prompt comune

> Sei lo Scultore della corona di RUNE, un gioco in 3D a voxel visto dall'alto in 3/4. Lavori nel worktree
> `H:\projects\rune\.claude\worktrees\step8.2A-lab3d` (branch `3d`, già attivo: non cambiare branch). Oggi scrivi
> **una sola struttura**: quella con id **`<ID>`**, descritta nella sua scheda in
> `docs/prompts/gemini-strutture-corona.md` (sezione «Le schede»). Leggi tutto quel file prima di cominciare: le
> regole, la scala e le convenzioni valgono per tutte le strutture.
>
> **Regole sulla chiave e sui costi — inviolabili.**
> - Non leggere, stampare, copiare né usare `.env` o la `GEMINI_API_KEY`. Non chiamare le API di Google da
>   script o da codice.
> - Non eseguire gli script del laboratorio che chiamano Gemini: `mjx-sculpt.ts`, `mjx-trial.ts`,
>   `sculpt-game.ts`, `trial-batch.sh`. Nella sandbox non premere «Scolpisci con Gemini».
> - Il programma lo scrivi tu, a mano, ragionando; le foto le guardi tu (apri i PNG o la pagina nel browser).
>
> **Dove scrivi.** Solo:
> - `lab/mjx/models/corona-<ID>.xml` (il programma, con il commento in testa descritto nel file del prompt);
> - una riga in `lab/3d/catalog.ts`, nell'elenco `MODELS`: `['corona-<ID>', '<nome> (corona)', 'structure', 8],`
>   (l'8 sono i voxel per casella di questi modelli);
> - `lab/out/` per le prove (è ignorata da git).
> Non toccare `src/`, `universe/`, `tests/` né altri file: il gioco li prenderà dopo (task T20). Se ti sembra che
> il motore abbia un difetto, non correggerlo: scrivilo nel resoconto finale.
>
> **Che cosa leggere prima** (in quest'ordine):
> 1. `universe/prompts/agents/scultore.md`: il dialetto MarkovJunior del gioco (coordinate, pattern, nodi, forme,
>    `glow`, animazioni, azioni, trappole). È scritto per i modelli piccoli: per la scala vale quella di questo file.
> 2. `lab/README.md` (sezioni «Come si usa» e «Che cosa ho imparato»).
> 3. Esempi: `universe/models/fattoria.xml` (struttura grande, porta con azione), `universe/models/grande.xml`
>    (si decide in grande con `map`, si rifinisce in piccolo), `universe/models/falo.xml` (voxel luminosi e
>    animazione). Se serve, `src/mj/xml.ts` è la verità su ciò che il front-end legge.
>
> **Il ciclo di lavoro.**
> 1. Progetta su carta: masse principali, materiali (4-8 colori più la lettera neon), dove sta la porta, dove sta
>    l'insegna, quale dettaglio rende la struttura riconoscibile da lontano.
> 2. Scrivi `lab/mjx/models/corona-<ID>.xml`.
> 3. Fotografalo da quattro lati e due semi:
>    `npx vite-node lab/scripts/mjx-render.ts -- corona-<ID> --seeds 2` (con un'animazione aggiungi `--frames`).
>    Le foto vanno in `lab/out/mjx/corona-<ID>.png` (e `.<animazione>.png`). La riga stampata dice voxel, passi,
>    millisecondi, errori e avvisi: **nessun errore**, «non finisce» mai, tempo sotto i 3000 ms per seme.
> 4. Se una parte non viene come pensavi, guardala a fette:
>    `npx vite-node lab/scripts/mjx-slice.ts -- corona-<ID> 1 0 10 40` (sezioni orizzontali alle z indicate) o
>    `... -- corona-<ID> 1 --y 60` (una sezione verticale).
> 5. **Giudica le foto come l'Artista** (`universe/prompts/agents/artista.md`): si capisce che cos'è, dai quattro
>    lati? Le proporzioni tornano con il viandante (1,5 caselle = 12 voxel di altezza)? La porta si vede ed è
>    alta abbastanza? L'insegna si legge, nel verso giusto, dal davanti? Il neon è poco e mirato (bordi, insegna,
>    rune), non tutto il modello? Dai un voto da 1 a 10 e correggi finché non è almeno 8. Almeno tre giri.
> 6. Collaudalo nella sandbox: `npm run dev`, apri <http://localhost:5173/lab/3d/>, scegli «<nome> (corona)» nel
>    pannello («Oggetti e strutture»), «Mettilo davanti a me», giraci intorno (WASD, Q/R ruotano la camera,
>    rotella zoom), entra dalla porta se c'è un interno percorribile, guarda la sua ombra e il neon (con il cursore
>    dell'ora nel pannello porta la sandbox a notte, verso le 22, e poi di nuovo a giorno). Fai uno screenshot dal davanti e uno da dietro e
>    salvali in `lab/out/corona-<ID>-sandbox-*.png`. In console `window.sandbox` dà accesso alla sandbox.
> 7. Verifica: `npm test` e `npm run typecheck` verdi (cambi solo `catalog.ts`, ma deve compilare).
> 8. Commit sul branch `3d`, con l'identità git già configurata nel repository (non toccare la configurazione
>    globale): solo i due file, messaggio `Corona (T19): <nome> scritto da Gemini`. Non fare push, non fare merge.
>
> **Il resoconto finale** (in chat, in italiano): il voto che dai alle foto e perché; voxel, tempo e griglia;
> le lettere della palette e il loro ruolo; dove sono la porta e l'insegna (coordinate); che cosa non sei
> riuscito a fare e che cosa suggerisci per la prossima struttura; eventuali difetti del motore che hai trovato.

## Scala e convenzioni (valgono per tutte)

**Scala.** Questi modelli sono troppo grandi per i 20 voxel per casella degli altri (una struttura di 14 caselle
sarebbe 280 voxel di lato): si scrivono a **8 voxel per casella**, come i modelli dello step 8A. Nel laboratorio
lo dice la riga di `catalog.ts`; nel gioco lo farà T20. Il viandante è alto 1,5 caselle = **12 voxel**; una
porta normale è larga 2 caselle e alta 2,5 (**16 × 20 voxel**); un piano di edificio è alto circa 3 caselle
(24 voxel).

**Coordinate.** x da sinistra a destra, y dal fondo (nord) al davanti (sud), z dal basso in alto; il davanti
guarda verso **y grande**. Il gioco gira il modello in modo che il davanti dia sul viale (verso il cerchio).
`size="X Y Z"` sulla radice con la scatola della scheda; il corpo poggia su z = 0 e non tocca i bordi della
scatola (lascia almeno 2 voxel di margine).

**La porta.** Al centro del lato davanti (x a metà, y verso il massimo), a z = 0, con una lettera sua che si
chiama `porta`: `<color symbol="O" value="…" name="porta"/>`. Dietro la porta il modello è vuoto per almeno
3 voxel (un vano d'ingresso): da lì il gioco teletrasporta negli interni, che sono altrove e più grandi
(non serve modellare l'interno, ma un atrio intravisto dalle vetrate aiuta). Se la scheda dice una rampa o un
ingresso diverso, la lettera `porta` va comunque dove si entra.

**L'insegna.** Il nome della struttura in lettere maiuscole, con una lettera della palette che brilla:
`<color symbol="F" value="<neon>" glow="True" name="insegna"/>`, nel colore neon della scheda. Le lettere sono
un carattere a pixel 3 × 5 voxel (o 4 × 6 se c'è spazio), un voxel di spazio tra le lettere e tre tra le parole,
su un piano verticale (x-z) rivolto verso y grande, e si leggono **da sinistra a destra guardando dal davanti**.
Scrivile con `<box>` (un tratto per box, `size="1 1 5"` per un'asta) o con regole con `symmetry="()"` (mai
`(xy)` o `(x)` sulle regole delle lettere: le specchierebbe). Fondo dell'insegna scuro (una lastra di 1-2 voxel
davanti alla facciata) perché il neon si stacchi. Parole lunghe su due righe se non ci stanno.

**Lo stile: neon punk.** Metallo nero o quasi (`141418`, `1d1e26`, `2a2c38`), vetro scuro riflettente
(`1c2a3a` con riflessi `3d5a78` in linee oblique o in fasce), cemento grafite per le basi (`3a3a40`), qualche
dettaglio metallico chiaro (`8a8f9c`). Il neon (lettere con `glow="True"`) solo su insegna, spigoli, fasce,
rune: **meno del 5 % dei voxel visibili**. Futuristico, non medioevale; niente legno, coppi o pietra a vista.
Il renderer non fa riflessi: il vetro «riflettente» si dipinge, con due toni e i riflessi come strisce chiare.

**Il programma.** Le masse con le forme pronte (`<box>`, `<cylinder>`, `<cone>`, `<ellipsoid>`, `<line>`, con
`on=` per scavare), i dettagli con regole brevi e `steps`; `map` se conviene progettare in grande. Le forme
pronte costano poco anche su griglie grandi (un cilindro su 112 × 112 × 160 gira in ~250 ms); le crescite voxel
per voxel su tutta la griglia no: limitale con `steps` o falle su una griglia grossa prima di `map`. Ogni seme
deve dare la stessa struttura con varianti piccole (fregi, rune, finestre), mai un'altra forma: nel gioco ne esiste
una sola per edificio. Tutto attaccato al corpo principale (il controllo dà errore se più dell'8 % dei voxel è
staccato).

**Il commento in testa** (come negli esempi): che cosa è (nome e una riga di descrizione), «scritto da Gemini CLI
(`<modello>`, abbonamento) il `<data>`, task T19», la scatola in caselle e in voxel, «8 voxel per casella»,
le lettere che contano (porta, insegna, neon), le animazioni e le azioni se ci sono, come è costruito in due righe.

## Le schede

Le dimensioni sono in caselle (× 8 = voxel). Gli edifici del campus oggi hanno un blocco di 16 × ~20 caselle (T18)
(`CAMPUS` in `src/kernel/corona.ts`); le scatole sotto ci stanno con il margine per il prato e i viali. Il colore
neon è quello della sala nel gioco (`ROOMS` in `corona.ts`), così fuori e dentro si riconoscono.

### `magia` — La Torre della Magia
- **Scatola**: 10 × 10 × 24 caselle → `size="80 80 192"`. Neon `c48aff` (viola).
- **Esterno** (parole dell'autore): «cilindrica, alta e tutta incisa di rune, futuristica, non medioevale. In
  grande la scritta "La torre della Magia", sembra scritta con le rune.»
- Indicazioni: un cilindro di metallo nero su uno zoccolo più largo, che si stringe un poco salendo (anelli o
  gradini ogni 5-6 caselle), coronato da un anello o un'antenna luminosa. Le **rune incise** sono solchi (una
  lettera più scura) con dentro, qua e là, il neon: segni angolari brevi (aste verticali con tratti obliqui, stile
  futhark), in fasce orizzontali che girano intorno alla torre, non macchie a caso. La **scritta** «LA TORRE DELLA
  MAGIA» con lettere latine dal disegno runico (solo aste e diagonali, niente curve), in verticale o su due-tre
  righe su una lastra sopra la porta, grande: è la cosa che si legge da lontano. Porta alta e stretta (2 × 3
  caselle) con una cornice neon.

### `persone` — Lo Studio dei personaggi
- **Scatola**: 14 × 12 × 7 caselle → `size="112 96 56"`. Neon `ffb38a` (pesca).
- **Esterno**: «studios ma anche un po' magazzino/fabbrica, sempre futuristico, poco. Un'insegna neon "Lo studio
  dei personaggi".»
- Indicazioni: un capannone da studio cinematografico: volume basso e largo, tetto a shed (denti di sega con le
  vetrate rivolte a nord) o a botte ribassata, un grande portone a scorrimento sul davanti accanto alla porta
  pedonale (la lettera `porta` è quella pedonale, o il portone se è al centro), una ciminiera o un camino di
  ventilazione, tubi lungo una parete. Futuristico «poco»: pannelli lisci, bordi neon sottili, l'insegna
  «LO STUDIO DEI PERSONAGGI» sopra il portone, su due righe se serve.

### `cose` — Il Laboratorio delle cose
- **Scatola**: 14 × 14 × 8 caselle → `size="112 112 64"`. Neon `d89a6a` (rame).
- **Esterno**: «tensostruttura a semisfera in metallo nero e vetro riflettente. Un cartello (futuristico) con
  l'insegna neon: "Il laboratorio delle cose".»
- Indicazioni: una cupola (metà di un ellissoide) a reticolo: nervature di metallo nero (meridiani e paralleli, o
  una geodetica a triangoli) e i riquadri in vetro scuro con riflessi. La porta in un piccolo avancorpo a tunnel
  sul davanti. Il **cartello** è a parte ma attaccato a terra: un totem o un portale basso davanti alla cupola,
  di lato al sentiero, con «IL LABORATORIO DELLE COSE»; non sovrapporlo alla porta.

### `oggetti` — Il Magazzino degli oggetti
- **Scatola**: 14 × 14 × 10 caselle → `size="112 112 80"`. Neon `e0b070` (ambra).
- **Esterno**: «piramide in metallo nero e vetro riflettente. Un cartello (futuristico) con l'insegna neon:
  "Il magazzino degli oggetti".»
- Indicazioni: piramide a base quadrata (strati che rientrano di un voxel per strato, o `cone` con la base quadra
  se lo regge), spigoli in metallo nero con una linea neon sui quattro spigoli, facce in vetro scuro a fasce. La
  porta in un taglio rettangolare al centro della faccia sud, con un portale sporgente. Cartello come quello del
  Laboratorio delle cose (stessa famiglia: sono due magazzini gemelli) con «IL MAGAZZINO DEGLI OGGETTI».

### `luoghi` — L'Ufficio dei luoghi
- **Scatola**: 14 × 9 × 7 caselle → `size="112 72 56"`. Neon `9ad27a` (verde).
- **Esterno**: «grande edificio mobile (forse su ruote ma non è abbastanza neon punk/futuristico) in metallo nero
  e vetro riflettente, attrezzato con strumenti di terraformazione futuristici. Su un lato, la scritta adesiva neon
  "Ufficio dei luoghi".»
- Indicazioni: un mezzo da cantiere enorme, lungo sull'asse x: cingoli o pattini a levitazione (una fascia neon
  sotto lo scafo, ma lo scafo poggia comunque a terra con i cingoli/piedi: niente pezzi sospesi), cabina vetrata,
  sul tetto una gru o un braccio articolato, un'antenna radar, una trivella o una lama da ruspa sul fianco, un
  proiettore che disegna una griglia verde a terra davanti. La **scritta** «UFFICIO DEI LUOGHI» è sul fianco lungo
  rivolto verso y grande, come un adesivo (le lettere a filo della parete). La porta: una scaletta o una passerella
  che scende dal fianco fino a z = 0.

### `sistemi` — La Sala sistemi
- **Scatola**: 14 × 14 × 5 caselle → `size="112 112 40"`. Neon `b9a6ff` (lavanda).
- **Esterno**: «una rampa che scende verso una base sotterranea. Insegna neon "Sala sistemi" e protezioni tipo
  base segreta futuristiche.»
- Attenzione: il terreno del mondo è a z = 0 e il modello non può scendere sotto. Si fa l'illusione: un **terrapieno**
  basso (un rilievo erboso o di cemento, `3f5a3a` / `3a3a40`, alto 2-4 caselle) in cui si apre una **trincea**: il
  fondo della rampa resta a z = 0 ma i muri ai lati crescono man mano che si entra, così chi entra sembra
  scendere; in fondo un **portellone blindato** (la lettera `porta`, a z = 0) incassato. Protezioni da base segreta:
  barriere a scacchi neon e nero, due pilastri con luci rotanti (un'animazione che fa ruotare il bagliore, facoltativa),
  sbarra all'ingresso della trincea, griglie di ventilazione sul terrapieno, una cupola radar. Insegna «SALA
  SISTEMI» sopra il portellone, sulla parete di fondo della trincea, rivolta verso y grande.

### `nucleo` — Il Nucleo
- **Scatola**: 14 × 14 × 14 caselle → `size="112 112 112"`. Neon `6fc3ff` (azzurro).
- **Esterno**: «una sfera di voxel neri che si illuminano a intermittenza. La sfera fluttua in alto, sotto
  l'edificio del nucleo, a forma di corona circolare futuristico, insegna neon "Il nucleo".»
- Indicazioni: a terra un **edificio ad anello** (un toro basso o un anello a più livelli, diametro ~12 caselle,
  alto ~4, con il foro al centro), la porta sul lato davanti dell'anello. Sopra il foro, in alto (z ~ 7-12 caselle),
  la **sfera** di voxel neri (diametro ~5 caselle), con celle luminose che si accendono e si spengono:
  un'`<animation name="pulsa" frames="8">` che scambia due lettere (accesa `glow="True"` e spenta), come le braci
  del falò. Perché la sfera non sia un pezzo staccato, tienila unita all'anello con tre o quattro **raggi** sottili
  (travi o fasci di luce, 1-2 voxel) che salgono dall'anello alla sfera. Insegna «IL NUCLEO» sulla facciata
  davanti dell'anello, sopra la porta.

### `concilio` — La Sala del Concilio
- **Scatola**: 16 × 16 × 9 caselle → `size="128 128 72"`. Neon `ff8ad8` (rosa).
- **Esterno**: «struttura imponente esagonale, insegna neon sulla facciata.»
- Indicazioni: pianta esagonale (un lato dell'esagono rivolto verso y grande: è la facciata), su un basamento a
  gradoni, pareti inclinate o a lesene, tetto a gradoni esagonali che sale verso una lanterna centrale o una
  guglia; neon lungo i sei spigoli verticali e la cornice del tetto. Facciata monumentale: portale alto (3 × 4
  caselle) con colonne o pinne laterali, l'insegna «SALA DEL CONCILIO» sopra il portale, grande. È l'edificio più
  imponente del campus: deve sembrarlo anche accanto alla Torre della Magia (che è più alta, ma più stretta).

### `universo` — La Direzione
- **Scatola**: 14 × 10 × 12 caselle → `size="112 80 96"`. Neon `ffcf5c` (oro).
- **Esterno** (proposta approvata dall'autore il 23/10, [`corona-proposte.md`](../plans/corona-proposte.md) §3.1): la
  regia della software house; dentro c'è la sala operativa.
- Indicazioni: un volume basso e largo (alto ~4 caselle) **a sbalzo** su pilastri neri, sollevato di 1-2 caselle da
  terra (sotto, ombra e la porta in un atrio vetrato a z = 0, al centro del davanti, sotto lo sbalzo). La facciata
  davanti è un **maxischermo curvo** (un arco di cilindro largo quanto l'edificio, convesso verso y grande): pannelli neri
  a griglia con pixel oro sparsi, e un'`<animation name="trasmette" frames="8">` che li fa scorrere in orizzontale (due
  lettere, acceso `glow="True"` e spento, come il neon della Torre). Sul tetto, un poco arretrata, una **torre di
  trasmissione** sottile a traliccio fino a z ~ 11 caselle, con due o tre luci d'ostacolo (lettere luminose rosse
  `ff4a4a`) che si accendono nella stessa animazione. Insegna «DIREZIONE» sul bordo alto dello schermo (o sul cornicione
  sopra), in oro. È la coppia della Sala del Concilio: meno imponente, più tecnica.

### `galleria` — La Galleria dell'Artista
- **Scatola**: 14 × 14 × 10 caselle → `size="112 112 80"`. Neon `ff8ad8` (rosa).
- **Esterno** (proposta approvata dall'autore il 23/10, [`corona-proposte.md`](../plans/corona-proposte.md) §3.3): il
  museo dei modelli e la bottega dello Scultore.
- Indicazioni: un **cubo nero** (~9 caselle di lato, alto ~7) sollevato di una casella su uno zoccolo di vetro scuro
  arretrato (sembra galleggiare), nella metà di fondo della scatola. Sulla facciata davanti una grande **cornice** al neon
  rosa come quella di un quadro, con dentro il vetro; la porta al centro della base della cornice, a z = 0, con una
  scaletta di due gradini che scende dallo zoccolo. Nella metà davanti della scatola, il **piazzale** (lastre di cemento
  grafite) con al centro un **plinto** basso (2 × 2 caselle, alto 1) col piano vuoto: la sua lettera si chiama `plinto`
  (`name="plinto"`), perché il gioco ci poserà sopra un modello della libreria che cambia a ogni visita (lascia libero lo
  spazio sopra, almeno 3 caselle). Il plinto non sta davanti alla porta: spostalo di lato al percorso. Insegna «GALLERIA
  DELL'ARTISTA» sopra la cornice, su due righe se serve.

### `mondo` — La Biblioteca del Mondo
- **Scatola**: 14 × 14 × 7 caselle → `size="112 112 56"`. Neon `7dd87d` (verde).
- **Esterno** (proposta A, scelta dall'autore il 23/10, [`corona-proposte.md`](../plans/corona-proposte.md) §3.2):
  **il chiostro**. La memoria del Narratore come un luogo dove si cammina piano; elegante, niente libri da vedere.
- Indicazioni: un edificio basso e quadrato (~12 × 12 caselle, alto ~3), con il tetto piano e sottile come una lama
  (una lastra di 1-2 voxel che sporge un poco oltre i muri). Tutto attorno, sotto il tetto, un **portico** di pilastri neri
  sottilissimi e fitti (1 × 1 voxel, uno ogni 4-6 voxel), ciascuno con un filo di neon verde alla base; dietro il portico,
  pareti di vetro scuro. Al centro una **corte aperta** (~6 × 6 caselle, senza tetto) con uno **specchio d'acqua** scura
  (`10202a`, a filo del pavimento o un voxel sotto, mai sotto z = 0): sul fondo dell'acqua, a filo, le rune del canone
  accese in verde (segni angolari brevi, come quelli della Torre della Magia, in un anello o in righe ordinate, non a
  caso). Nella corte, in un angolo dello specchio, **una sola lanterna** alta e sottile (fino a z ~ 6 caselle: l'unica cosa
  che sale), con la luce in cima. La porta al centro del lato davanti, a z = 0, larga, con un varco nel portico. Insegna
  «BIBLIOTECA DEL MONDO» sul bordo del tetto sopra la porta, in lettere sottili (su due righe se serve). È l'unico edificio
  orizzontale del campus: niente torri, cupole o antenne.

## Dopo (T20)

Quello che T20 dovrà fare con questi modelli, perché le convenzioni sopra non restino lettera morta: una densità di
voxel per modello nella libreria (`models/index.json` o una classe `corona` a 8 voxel per casella, oggi `VPT = 20`
è fisso in `src/kernel/forms.ts`), la copia dei programmi in `universe/models/corona-<id>.xml`, l'edificio del
campus girato verso il viale con la collisione dai voxel, la porta del campus dove il modello mette la lettera
`porta`.
