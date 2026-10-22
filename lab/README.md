# Laboratorio voxel — MarkovJunior 3D → sprite in 3/4

Sperimentazione richiesta in [`docs/userchats/step8A.md`](../docs/userchats/step8A.md): verificare se gli
agenti sanno scrivere programmi MarkovJunior in 3D che producono modelli sensati, da fotografare in 3/4
per ottenere gli sprite (fronte, destra, retro, sinistra). **Non è integrato nel gioco**: tutto sta in
`lab/`, legge l'universo e non lo scrive. Decisione: [ADR-0031](../docs/adr/0031-laboratorio-voxel.md).

## Come si usa

- Pagina: `npm run dev` → <http://localhost:5173/lab/> (anche `npm run build && npx vite preview` →
  `/lab/`). `?offline` usa i modelli locali (lo Scultore risponde con gli esempi scritti a mano).
- A sinistra i bersagli, in quattro schede: semplici, strutture (un solo modello), figure, e **a blocchi**
  (strutture su più caselle). Per ognuna: prove preimpostate, i programmi **scritti da Claude Code** (già
  pronti, da confrontare) e gli asset dell'universo scelto (ostacoli, oggetti, persone, il giocatore),
  con lo sprite attuale e **tutti i suoi fotogrammi** accanto (per il viandante 4 direzioni × 3).
- Ogni bersaglio ha una **classe** (albero, roccia, persona…) che fissa la scatola: vedi «Scala».
- **Scolpisci**: lo Scultore scrive il programma; il kernel del laboratorio lo ripara, lo esegue (in un
  worker, max 20 s), lo misura e lo rimanda indietro con il motivo se non va (vuoto, galleggia, pezzi
  staccati, blocco, non termina). Poi l'Artista guarda le quattro viste e vota.
- **Migliora**: lo Scultore riceve il suo programma, le sue viste e il giudizio dell'Artista.
- **Varianti**: lo stesso programma con altri semi, gratis. Il programma è modificabile a mano («Esegui»).
- **Fotogrammi**, gratis: la camminata delle figure nelle 4 direzioni × 3 fotogrammi del gioco (piede
  sinistro avanti, passo, piede destro avanti), il vento per alberi e cespugli, l'ombra nel corso del
  giorno per tutto; e il modello accanto al viandante, alla stessa scala.
- **A blocchi**: «Scolpisci i blocchi» (Scultore dei blocchi), poi l'Architetto compone; si vedono i
  blocchi con le loro prese, la struttura da quattro lati, i livelli uno alla volta, la mappa delle caselle
  per il gioco (calpestabile o no); un clic su una casella con un'azione la fa (apri il portone, alza il
  ponte, apri lo scrigno) e la struttura si ricompone.
- I risultati restano nel browser (`localStorage`); «esporta risultati» li scarica in JSON.
- Script headless (scrivono in `lab/out/`, ignorata da git):
  - `npx vite-node lab/scripts/sculpt.ts -- --step 1 --refine 1 --model gemini-3.8-flash` (anche
    `--only "Pino,Sasso"`, `--rules-only`, `--no-examples`, `--seeds 3`, `--offline`);
  - `npx vite-node lab/scripts/montage.ts -- <run>`: un mosaico delle versioni finali;
  - `npx vite-node lab/scripts/examples.ts`: gli esempi scritti a mano;
  - `npx vite-node lab/scripts/resolution.ts -- 12 16 20 24 32 40`: lo studio della risoluzione delle persone;
  - `npx vite-node lab/scripts/structure.ts`: castello e sotterraneo scritti a mano (blocchi, viste, livelli, azioni);
  - `npx vite-node lab/scripts/build.ts -- --review`: Scultore dei blocchi + Architetto + Artista sulle strutture;
  - `npx vite-node lab/scripts/review-hand.ts`: l'Artista sui programmi scritti a mano;
  - `npx vite-node lab/scripts/castle-big.ts -- 100`: il castello scritto a mano su 100 × 100, con i tempi;
  - `npx vite-node lab/scripts/check-catalogue.ts -- <prova> <struttura>`: i controlli del kernel su una prova salvata;
  - `npx vite-node lab/scripts/prompt-sizes.ts`: quanto pesano le istruzioni di ogni agente.
- Test: `lab/tests/*.test.ts` (girano con `npm test`).

## Pezzi

| File | Cosa fa |
|---|---|
| `mj3d/engine.ts` | MarkovJunior 3D: `one all prl sequence markov` con pattern 3D e simmetrie (`xy` di default: la gravità resta), più `conv` (automa cellulare), `path` (percorsi 3D) e `shape` (primitive). Corrispondenze aggiornate in modo incrementale |
| `mj3d/check.ts` | ripara le forme sbagliate delle regole, misura il modello (voxel, pezzi, appoggio, riempimento) |
| `mj3d/render.ts` | fotografia in 3/4: faccia sopra + faccia frontale per voxel, sole a nord-ovest con autombra e occlusione, ombra a sud-est, contorni scuri; quattro viste ruotando il modello |
| `mj3d/scale.ts` | la scala: 20 voxel per casella, una scatola per classe di oggetti |
| `mj3d/animate.ts` | scheletro (parti del palette o gambe indovinate), camminata, vento |
| `mj3d/structure.ts` | blocchi con prese, catalogo delle varianti e compatibilità, piante a zone, controlli (chiudibilità, zone, prese, giunture), mappa delle caselle, azioni |
| `mj3d/wfc.ts` | WFC a insiemi di bit con heap e riparazioni locali |
| `mj3d/composite.ts` | foto delle strutture per blocchi |
| `mj3d/meter.ts` | contatore dei token (anche ragionamento e cache) e timeout |
| `mj3d/architect.ts`, `prompts/blocchi.md`, `prompts/architetto.md` | Scultore dei blocchi e Architetto |
| `mj3d/examples.ts`, `programs/` | scritti a mano (da Claude Code): masso, pino, quercia, cespuglio, viandante, castello, sotterraneo; rocca e cripta nello stile di MJ (step 8D) |
| `mj3d/sculptor.ts`, `prompts/` | lo Scultore (scrive, riprova, rivede) e l'Artista (giudica le viste) |
| `mj3d/targets.ts` | prove preimpostate e asset dell'universo |
| `index.html`, `main.ts`, `worker.ts`, `lab.css` | la pagina |

## Risultati dello step 8A (21 ottobre 2026, universo valmora; scala vecchia, 8 voxel per casella)

Ogni prova: esempi sì, shape sì, 2 tentativi in caso di errore, una revisione dell'Artista.

| Punto | Modello | Validi | Al primo colpo | Approvati dall'Artista (≥ 7) | Chiamate di testo |
|---|---|---|---|---|---|
| 1 · semplici (17) | gemini-3.1-flash-lite | 16/17 | 14 | 3 | 71 |
| 1 · semplici (17) | gemini-3.8-flash | 17/17 | 17 | 11 | 60 |
| 2 · strutture (7) | gemini-3.8-flash | 7/7 | 7 | 4 | 25 |
| 3 · figure (5) | gemini-3.8-flash | 5/5 | 4 | 0 (voti 3-6) | 21 |

Cosa si vede (mosaici in `lab/out/<run>/montage.png`, rigenerabili):

1. **Semplici: sì.** Con `gemini-3.8-flash` pino, quercia, palma, fungo, ceppo, barile, vaso, cespuglio,
   cumulo di pietre e albero secco sono sprite credibili, coerenti tra le quattro viste e con la guida
   di stile; ogni programma dà infinite varianti con altri semi. Deboli: sasso (troppo piccolo), betulla
   (chioma a lecca-lecca), salice, cassa. `flash-lite` scrive programmi validi ma forme più povere.
2. **Strutture: sì, con riserva.** Casetta con tetto di paglia, porta e finestra; torre merlata; pozzo col
   tettuccio; fontana; portale ad arco; colonne. Leggibili; i dettagli (finestre, scanalature) sono al
   limite della risoluzione.
3. **Figure: non ancora.** A 8×6×14 voxel persone e animali sono sagome: si intuiscono mantello, gonna,
   bastone, ma non volti né pose; gatto e slime non si riconoscono. Serve altro: più risoluzione per le
   figure, uno scheletro con parti (testa, busto, arti) dato dal kernel su cui lo Scultore mette forme e
   colori, e pose ottenute ruotando le parti, non riscrivendo il modello.

Errori tipici degli agenti (ora nelle «trappole» del prompt): `prl` con `steps` che cambia quasi tutto,
crescite verticali che fanno spuntoni, forme lisce che sembrano blocchi, chiome sospese con il tronco
steso a terra (ora è un errore: il corpo principale deve toccare z=0). L'Artista è severo e coerente con
ciò che si vede; la revisione con le viste migliora spesso (betulla 5→7, palma 4→7, albero secco 4→7)
ma non sempre.

Costo: solo testo, ~3-4 chiamate per oggetto con la revisione, nessuna immagine. Un'immagine di sprite
oggi costa una chiamata di immagine per vista; qui le quattro viste e tutte le varianti sono gratis.

## Step 8B: scala, fotogrammi, strutture a blocchi

Richiesta in [`docs/userchats/step8B.md`](../docs/userchats/step8B.md). Decisione: [ADR-0032](../docs/adr/0032-scala-fotogrammi-strutture.md).

### 1. Scala

Lo studio sulle persone (`scripts/resolution.ts`: il viandante scritto a mano alto 12, 16, 20, 24, 32 e
40 voxel, guardato sia a un pixel per voxel sia rimpicciolito alla misura che ha nel gioco): a 12 è una
sagoma; a 16 si legge appena; da 24 compaiono viso, occhi, cintura e fibbia; oltre 32 si guadagna poco.
Scelta: **20 voxel per casella**, persona alta ~28-30 voxel (1,5 caselle); nel gioco (40 px per casella)
sono 2 px per voxel. Ogni **classe** ha una scatola fissa, la stessa per tutti i suoi membri, e un'altezza
minima, così le cose simili hanno sempre le stesse proporzioni:

| classe | caselle | voxel |
|---|---|---|
| sasso | 0,5×0,5×0,4 | 10×10×8 |
| roccia, cespuglio | 1×1×0,8 | 20×20×16 |
| albero | 2×2×3 | 40×40×60 (alto almeno 48) |
| oggetto piccolo | 0,6×0,6×0,6 | 12×12×12 |
| mobile | 1×1×1 | 20×20×20 |
| persona | 1×0,75×1,5 | 20×15×30 (alta almeno 24) |
| animale piccolo | 0,75×1×0,75 | 15×20×15 |
| animale grande, mostro | 1,25×2×1,5 | 25×40×30 |
| monumento | 1×1×3 | 20×20×60 |
| edificio piccolo | 2,5×2,5×2,5 | 50×50×50 |

Il kernel impone la scatola (sostituisce la `size` dello Scultore) e rifiuta ciò che è troppo basso. Il
motore regge griglie fino a 64 per lato; il costo in token non cambia (il programma è lo stesso e l'Artista
vede un'immagine).

### 2. Fotogrammi

Dal modello il kernel ricava, senza chiamate:
- la **camminata** (`animate.ts`): le parti marcate nel palette con `part` (gamba, braccio, testa, coda)
  ruotano attorno al loro attacco; senza parti, il quarto più basso della figura fa da gambe; i quadrupedi
  muovono le zampe in diagonale. Formato del gioco: `down left right up` × [piede sinistro avanti, passo,
  piede destro avanti];
- il **vento** per alberi e cespugli: la parte alta si piega e torna (4 fotogrammi);
- l'**ombra** che si sposta col sole (`render.ts → DAY`: mattina, mezzogiorno, pomeriggio, sera); l'ombra
  ora è proiettata davvero lungo il sole.

### 3. Strutture a blocchi (il «terzo strato»)

Un **blocco** è una casella per un livello (20×20×20 voxel) con una **presa** per lato (n, e, s, w, sopra,
sotto): un'etichetta che dice com'è fatto quel lato. Lo **Scultore dei blocchi** scrive l'insieme dei blocchi
(con `walk` e con azioni che portano a un altro blocco: porta chiusa ↔ aperta, ponte abbassato ↔ alzato,
scrigno chiuso ↔ aperto). L'**Architetto** scrive un programma MarkovJunior la cui griglia è fatta di blocchi
(ogni codice è un blocco con una rotazione): regole di contesto scelgono il pezzo e la rotazione giusti e,
se serve, un **WFC** riempie le zone segnate con blocchi le cui prese combaciano, anche in verticale (una
scala ha sempre sopra il suo arrivo). Il kernel controlla ogni coppia di lati che si toccano (etichette e
**voxel delle due facce**), espande la pianta in voxel (ogni blocco posato col suo seme, così i muri non sono
tutti uguali) e tiene la **mappa delle caselle** per il gioco.

### Risultati dello step 8B (gemini-3.8-flash, una revisione dell'Artista)

| Prova | Validi | Al primo colpo | Approvati (≥ 7) | Chiamate |
|---|---|---|---|---|
| semplici alla nuova scala (8) | 8/8 | 8 | 6 | 24 |
| figure alla nuova scala (6) | 6/6 | 6 | 0 (voti 4-6) | 24 |
| strutture a blocchi (5) | 4/5 | 4 | 0 (castello 6, tempio 5, ponte 5, sotterraneo 4) | ~25 |

- **Semplici**: alla nuova scala pino, palma, betulla, quercia e barile sono più ricchi che nello step 8A
  (6 approvati su 8, contro 11 su 17); il sasso resta il più debole.
- **Figure**: nettamente meglio dello step 8A. La contadina ha fazzoletto e gonna, il fabbro il grembiule,
  gatto e lupo sono quadrupedi leggibili di lato, e la camminata funziona anche sui modelli di Gemini.
  L'Artista resta severo (4-6): volti e mani sono ancora pochi voxel.
- **Strutture**: castello (con fossato, torri, mastio, portone e ponte levatoio con le loro azioni), ponte di pietra
  sul fiume con due torrette, tempio in rovina e sotterraneo sono composti al primo colpo, con le prese
  tutte giuste (le giunture storte sono da 0 a 5 per struttura). Il castello somiglia molto al mio esempio;
  il sotterraneo è una griglia regolare di corridoi, senza la varietà che dà il WFC. La casa a due piani
  non è arrivata in fondo: prima il motore non reggeva le 30 e più combinazioni blocco-rotazione della
  palette (corretto: ora entrano solo i codici usati), poi le richieste all'Architetto sono scadute più
  volte senza risposta e ho interrotto la prova.

### Scritti da Claude Code

Ho scritto a mano (`programs/`, `mj3d/examples.ts`) masso, pino, quercia, cespuglio e viandante alla nuova
scala, un castello completo e un sotterraneo su due livelli. Il castello ha 10 blocchi (muro, torre, cima
della torre, portone chiuso e aperto, ponte abbassato e alzato, fossato, mastio, falda di tetto) e una
pianta 10×10×3: le rotazioni le scelgono regole di contesto, il portone cade in un punto a caso del lato
sud, il tetto a padiglione è fatto di quattro falde ruotate. Il sotterraneo ha 10 blocchi; la pianta fissa
solo bordo, sala e scala, il resto lo sceglie il WFC. Castello e sotterraneo hanno zero prese sbagliate e
zero giunture storte su più semi. Lo stesso Artista dà 7/10 (approvati) a tutti e cinque i modelli
singoli, 5 al castello e 4 al sotterraneo.

Cosa ho imparato scrivendoli:
- le prese funzionano solo se si decide prima com'è fatta ogni faccia: il muro passa in mezzo al blocco,
  l'acqua sta sulla metà esterna, e così girando il blocco tutto combacia;
- le regole di contesto di MarkovJunior sono il modo naturale di scegliere le rotazioni; il WFC è comodo
  dove la forma conta poco (corridoi), le regole dove conta (un castello);
- per le strutture l'Artista vede una veduta d'insieme rimpicciolita e la giudica «piatta» anche quando i
  dettagli ci sono: va mostrata anche a pezzi, ingrandita.


## Step 8C: protocollo tra i due scultori, WFC, costi

Richiesta in [`docs/userchats/step8C.md`](../docs/userchats/step8C.md). Decisione: [ADR-0033](../docs/adr/0033-protocollo-blocchi-wfc.md).

### Il limite dei codici
`MAX_CODES` limitava davvero: il motore usava maschere a 32 bit (31 codici più l'aria). Nello step 8B avevo
solo evitato di registrare codici inutili, non tolto il limite. Ora i codici si raccolgono in un registro
di insiemi (una tabella di 256 voci per insieme): fino a 255 codici per programma (test con 100 codici).

### Il costo
Ogni chiamata paga in input 3-4 mila token, quasi tutti di istruzioni ripetute: la descrizione del
linguaggio (~2.400) e gli esempi (~2.000; il viandante da solo 700). Il programma vero è poca cosa
(`scripts/prompt-sizes.ts` misura tutto senza chiamare nessuno). Ma il costo maggiore è un altro: Gemini 3
«ragiona» prima di rispondere, e il ragionamento si paga come risposta. Il contatore di prima non lo vedeva.
Nella prova del castello: input 29.726 token, risposta 15.347, **ragionamento 45.369**.

Cosa ho cambiato:
- modello predefinito `gemini-3.5-flash`;
- un contatore (`mj3d/meter.ts`) che legge da ogni risposta anche il ragionamento e la parte servita dalla
  cache, mostrato nella pagina e negli script;
- lo Scultore manda solo gli esempi della classe (al più due: ~3.200 token invece di ~4.500);
- le istruzioni restano uguali da una chiamata all'altra, così Gemini può servirle dalla cache (nella prova
  non l'ha fatto: 0 token in cache);
- `--thinking low` negli script chiede meno ragionamento (non provato: niente altre prove).

### Il protocollo tra i due scultori
Prima i bordi dei blocchi venivano controllati dopo, e l'Architetto posava i blocchi uno per uno. Ora:

1. **Catalogo prima dei programmi.** Lo Scultore dei blocchi scrive prima il catalogo: i blocchi con le
   prese, `faces` (com'è fatta in voxel la faccia di ogni etichetta) e `open` (le prese che possono
   guardare fuori). Poi scrive i programmi, 6 blocchi alla volta; ogni blocco nuovo si confronta con le
   facce già accettate che hanno la stessa etichetta.
2. **Varianti e compatibilità.** Il laboratorio ricava le varianti (blocco × quarto di giro, senza doppioni)
   e una tabella di compatibilità per le sei direzioni, calcolata una volta: prese uguali **e** facce voxel
   che si continuano. Le sole combinazioni possibili sono quelle della tabella.
3. **L'Architetto dipinge zone.** Per ogni zona dice quali blocchi ammette, e mette esatti solo i pezzi
   unici. Il WFC sceglie variante per variante tra le combinazioni della tabella. Nel castello scritto a
   mano l'Architetto non nomina più né torri né rotazioni: dice «mura», e angoli, torri e rotazioni li
   decidono le prese.
4. **Prima di costruire, il laboratorio rifiuta:**
   - i blocchi che non possono far parte di nessuna struttura chiusa (un piccolo WFC di prova per ogni
     blocco, già sul catalogo e poi con le facce vere);
   - un catalogo con molti meno blocchi di quelli chiesti;
   - le zone che si toccano senza nessuna coppia di blocchi possibile, indicando il punto.
   Se dopo i programmi qualche blocco resta senza chiusura, lo Scultore deve aggiungere i pezzi di raccordo.

### Velocità
Il WFC ora lavora su insiemi di bit, con le compatibilità già pronte, un heap per la cella più vincolata e
la riparazione locale delle contraddizioni. Le strutture si fotografano per blocchi (`mj3d/composite.ts`),
senza mai costruire tutti i voxel. Misure con i blocchi del castello scritto a mano
(`scripts/castle-big.ts`):

| | pianta 100 × 100 × 3 |
|---|---|
| catalogo (10 blocchi → 29 varianti) e compatibilità | 55 ms |
| programma della pianta + WFC su 1.766 celle | 69 ms |
| foto 2.000 × 2.000 px (una vista) | 0,25-0,3 s |

Prima il WFC poteva restare bloccato per minuti anche su piante piccole. I motivi erano tre: domini fatti
di liste di stringhe, propagazione quadratica e ripartenze da capo. La struttura intera, poi, veniva
espansa in voxel (un castello 100 × 100 sarebbe stato 240 milioni di celle).

**GPU?** Per ora non serve. Le parti data-parallel si presterebbero a WebGPU: le regole `all`, `prl` e
`conv` di MarkovJunior e la pittura dei voxel. Il WFC invece è sequenziale nel cuore (una scelta alla
volta) e ne guadagnerebbe poco. Per la produzione vengono prima altre due cose:
- piante grandi divise in riquadri con i bordi vincolati, generati in Web Worker paralleli quando il
  viandante si avvicina, come i luoghi del gioco;
- i dipinti dei blocchi usati direttamente come tile del gioco, senza fotografare la struttura intera.

### La prova: castello di 30 blocchi su 100 × 100 (gemini-3.5-flash, una sola esecuzione)
È andata male, ed è istruttiva:
- **Catalogo:** 12 blocchi invece di 30. Tre non potevano chiudersi in nessun modo: il mastio aveva
  «mastio_f» su tutti e quattro i lati e nessun blocco che lo chiudesse; caserma e cappella avevano tre
  lati «edificio_f» senza pezzi di testata. Inoltre nessun muro poteva toccare il cortile lastricato.
- **Pianta:** l'Architetto ha usato bene lo spazio (doppia cinta con due fossati, cortili lastricati,
  pozzo, ponti e portoni). Ma il WFC, correttamente, non ha trovato blocchi per gran parte delle mura: 431
  celle vuote dopo 3 tentativi. Al posto delle mura c'è una linea vuota. L'Artista ha dato 2/10.
- **Il catalogo è passato perché il controllo non c'era.** Il controllo di chiudibilità e quello delle
  zone sono nati da questa prova: rieseguiti sui file salvati (`scripts/check-catalogue.ts`, nessuna
  chiamata a Gemini) rifiutano il catalogo indicando proprio mastio, caserma e cappella, e dicono
  all'Architetto «la zona mura non può avere la zona cortile a sud». I miei castello e sotterraneo li
  passano.
- **Un bug mio.** Con più di 32 varianti la propagazione del WFC poteva non finire: in JavaScript
  l'operazione `&` dà un numero con segno, e il confronto con la parola senza segno vedeva sempre un
  cambiamento. Il catalogo della prova ne aveva 32, quindi può averne risentito. Corretto e coperto da un
  test.
- Costo: 7 chiamate (catalogo, 2 gruppi di programmi, 3 piante, l'Artista).

Non ho fatto altre prove con Gemini, come richiesto. La prossima prova dello stesso castello avrebbe il
catalogo rifiutato con il motivo (e la fase di completamento), e le zone incompatibili segnalate prima del
WFC.

## Step 8D: strutture scritte come gli esempi di MarkovJunior

Decisione: [ADR-0034](../docs/adr/0034-strutture-alla-markovjunior.md). Confrontato con gli esempi ufficiali
di MJ (Apartemazements, DungeonGrowth, ModernHouse, SeaVilla), il laboratorio perdeva qualità in tre punti:
- la pianta era una sagoma fissa di `shape`, uguale a ogni seme;
- nessuna regola girava sulla struttura composta, mentre in MJ le regole dopo il `wfc` fanno colonne,
  finestre, scale ed erba attraverso le tessere;
- i blocchi erano scritti come CAD.

Cosa c'è ora:
- **Motore**: `unions`, `map` (scala la griglia: si decide in grande, si rifinisce in piccolo), `path` con
  `inertia` e `longest` e ripetibile dentro un `markov`, `runOn` (regole su una griglia esistente).
- **Pianta**: `paint` (segni dipinti sul terreno: cortili, strade, orti) e `detail` (un programma sui voxel
  della struttura intera; i materiali tengono la loro lettera in tutti i blocchi). `finish()` fa tutto;
  la pagina lo esegue nel worker fino a 24 milioni di voxel, oltre fotografa per blocchi come prima.
- **`programs/rocca.ts`**: il cortile cresce da un seme come rettangoli sovrapposti, poi viene pulito;
  mura e fossato sono il suo contorno; il WFC mette torri convesse e concave a ogni svolta. Il portone va
  dove il muro corre dritto, le strade sono `path` verso il bordo e verso il mastio. Mastio, case a
  graticcio con tetti a due falde o a padiglione, orti, alberi (cresciuti da un seme dentro un ellissoide
  nascosto) e pozzo sono timbri che chiedono spazio. Il dettaglio aggiunge muschio, edera, ciottoli, erba,
  solchi negli orti, porte dove la strada tocca un muro e stendardi sulle torri.
- **`programs/cripta.ts`**: stile DungeonGrowth. Stanze nella roccia; un ciclo `markov` allaga il
  collegato e traccia un `path` dalla stanza scollegata più vicina, finché tutte sono collegate. Poi
  porte, file di pilastri, scrigni, scala tra i livelli. Il dettaglio fa roccia ruvida, torce con la luce
  sul pavimento, macerie, ossa e muschio.
- Prompt dell'Architetto riscritti sugli idiomi di MJ; esempi dei prompt e modelli offline sulla rocca e
  sulla cripta. Castello e sotterraneo di prima restano per confronto.

Misure (nessuna chiamata a Gemini):

| | semi senza errori | pianta + WFC | dettaglio |
|---|---|---|---|
| rocca 18 × 18 × 3 | 30/30 | ~25 ms | 3,5 s (7,8 M voxel) |
| rocca 30 × 30 × 3 | 10/10 | ~60 ms | 10 s (21,6 M voxel) |
| cripta 20 × 20 × 2 | 30/30 | ~20 ms | 1,6 s (6,4 M voxel) |

Script: `npx vite-node lab/scripts/structure.ts -- rocca --size 30` (immagini, anche `-zoom` e
`-senza-dettaglio`), `lab/scripts/plan.ts -- cripta 3` (la pianta in testo), `lab/scripts/seeds.ts -- rocca 30`
(molti semi, solo controlli).

## Step 8E: l'Architetto commissiona i blocchi

Decisione: [ADR-0035](../docs/adr/0035-commissione-dei-blocchi.md). Nella rocca dell'8D il pozzo aveva un
angolo di prato (la sua casella non era dipinta) e alcune torri avevano l'acqua verso il cortile: per le
prese il cortile era come la campagna, e un angolo con il fossato fuori e un nodo fra due cortili hanno
gli stessi quattro lati, cambiano solo in diagonale. Ora:
- **pianta prima**: l'Architetto descrive le zone (`describe`) senza blocchi; il kernel ne ricava la
  **commissione** (`mj3d/commission.ts`): per ogni zona le configurazioni (lati, diagonali, sopra, sotto,
  a meno di una rotazione) con quante volte e dove. Lo Scultore dei blocchi le riceve e dice per ogni
  blocco quali serve (`serves`); nella composizione una casella sceglie solo fra i blocchi della sua
  configurazione;
- **vuoti di tipo diverso** (`open`): il cortile accetta «vuoto» e le facciate, mai l'acqua;
- **terreno sotto i blocchi** (`paint.under`): il cortile c'è anche sotto pozzo, alberi e mura;
- **diagnosi**: prima del collasso il kernel propaga i vincoli e, se una casella resta senza blocchi, ne
  dice la configurazione («serve un blocco commissionato per questa configurazione, o una pianta che non
  la crei»);
- nella rocca regole di contesto distinguono angoli convessi e concavi, nodi fra cortili, incroci a T e a
  croce, con quattro torri nuove commissionate (raccordo senz'acqua, incrocio sul cortile, sul fossato, a
  croce).

- **ordini a posteriori**: se componendo resta una configurazione senza un blocco che ci stia, il kernel
  la rimanda allo Scultore (fino a due giri) e ricompone la stessa pianta; solo dopo l'Architetto ritocca
  la pianta. Tutta la catena è `buildStructure` (pagina e `scripts/build.ts`).

`npx vite-node lab/scripts/commission.ts -- rocca 1 24 W` stampa la commissione di una zona;
`lab/scripts/build.ts -- --offline` esegue tutta la catena nel nuovo ordine (e salva `<nome>.commissione.txt`).

### Prove con Gemini (gemini-3.5-flash, ragionamento low)

Quattro strutture nuove (`architect.ts → STRUCTURE_TRIALS`, `scripts/build.ts -- --set nuove --review --improve`).
Le prime prove fallivano per errori di contratto, ora tolti dal kernel (vedi ADR-0035, aggiornamento):
prese ricavate dalla pianta, materiali scelti dall'Architetto, nodi inutili spiegati, pesi dei blocchi,
giro di miglioramento con l'immagine. Ultima tornata, voti dell'Artista:

| struttura | voto | com'è venuta |
|---|---|---|
| Monastero | 5/10 | chiostro con portico, giardino e pozzo, cinta e orti: leggibile, ma a rettangoli concentrici |
| Miniera abbandonata | 3/10 | gallerie e camere collegate su due livelli, vene d'oro, scale: buona pianta, blocchi piatti |
| Fortino di confine | 3/10 | palizzata con torri e portone, ma il cortile è quasi vuoto |
| Borgo di pescatori | 2/10 | case e rastrelliere a terra, ma i pontili invadono tutto il lago |

71 chiamate per l'ultima tornata (~655k token in input, 162k in risposta). Immagini in `lab/out/g8e-tutte*/`.
Il limite ora è la qualità dei blocchi dello Scultore (quasi solo scatole) e la tendenza dell'Architetto a
copiare gli schemi degli esempi o a far crescere una zona fino a riempire tutto.

## Prossimi passi proposti

- Provare l'Architetto su Gemini con i nuovi prompt (rocca e cripta come esempi) e misurare se impara crescita,
  contorno e `detail`.
- Dettaglio a riquadri con un bordo in comune, nei worker, per le strutture oltre 24 milioni di voxel.

- `GeminiModels` del kernel non ha un tempo massimo per le richieste e non conta il ragionamento: il laboratorio
  rimedia con `meter.ts`; il kernel andrebbe corretto.
- Strutture nel gioco: castelli e sotterranei a più livelli come luoghi (i livelli come zone), i blocchi con
  azioni come caselle interattive (`TileDef.actions`).
- Integrazione: l'ArtDirector sceglie voxel o immagine per tipo di asset; le viste diventano `frames`
  (`down`, `right`, `up`, `left`); pannello nello studio dell'Artista per approvare.

Per tornare indietro basta cancellare `lab/` e le tre righe che lo nominano (`vite.config.ts`,
`tsconfig.json`, `.gitignore`).
