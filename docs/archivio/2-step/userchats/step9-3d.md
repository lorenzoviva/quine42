# Step 9 — Il passaggio al 3D

Abbiamo deciso: **RUNE diventa un gioco 3D** ([ADR-0037](../adr/0037-passaggio-al-3d.md)). Gli esperimenti degli
step 8A-8.2B hanno mostrato che un mondo fatto di modelli MarkovJunior interi funziona, è più bello e costa meno
delle immagini dipinte. Ora va portato nel gioco, e va tolto tutto ciò che è 2D.

## Prima di tutto: pianifica

Questo passo è grande e tocca quasi ogni parte del progetto. **Non cominciare a modificare il codice prima di
avere un piano scritto**, in `docs/plans/step9-3d.md`:
- l'inventario di ciò che si toglie, di ciò che resta e di ciò che si riscrive (file per file, per le parti grandi:
  `src/kernel/kernel.ts`, `src/render/renderer.ts`, `src/kernel/art.ts`, `src/kernel/agents/*`, `src/ui/*`);
- le fasi, in ordine, ciascuna piccola abbastanza da finire con `npm test` e `npm run typecheck` verdi, il gioco che
  parte, e un commit; dove il gioco per un po' non sarà giocabile, dillo nel piano;
- i rischi e le domande aperte; se una decisione spetta a me, chiedimela prima di cominciare quella fase;
- per ogni fase, gli ADR da scrivere o da segnare come sostituiti e le parti di `AGENTS.md` da riscrivere.

Poi esegui il piano una fase alla volta, aggiornandolo man mano (cosa è fatto, cosa è cambiato rispetto al
previsto e perché).

## Da leggere prima

- [`AGENTS.md`](../../AGENTS.md) e gli ADR, in particolare
  [0036](../adr/0036-markovjunior-alla-lettera-in-3d.md) (MarkovJunior alla lettera, sandbox 3D) e
  [0037](../adr/0037-passaggio-al-3d.md) (la decisione).
- [`docs/plans/universo-continuo.md`](../plans/universo-continuo.md): caselle, chunk o spazio continuo. **Confermo
  la proposta C** (una scala di griglie: regione → piano del Cartografo con lotti e ancore → modello a 20 voxel per
  casella → corpi in posizione continua; i chunk come unità tecnica).
- [`docs/reports/costi-step8.2B.md`](../reports/costi-step8.2B.md): spesa passata e prova su un modello
  complesso. **Confermo le proposte** della sezione 6.
- [`lab/README.md`](../../lab/README.md), sezione «Step 8.2A», e i prompt degli step
  [8.2A](step8.2A.md), [8.2B](step8.2B.md), [8.2C](step8.2C.md).
- Il codice della sandbox, che è il prototipo da cui partire: `lab/mjx/` (MarkovJunior in XML, conversione,
  Scultore), `lab/3d/` (mesh, collisioni, pavimenti, arti, vento, animazioni, azioni, Cartografo di prova sul
  modello `River`), `lab/mj3d/engine.ts` (il motore), `lab/mj3d/prices.ts` e `meter.ts` (i costi).

## Cosa voglio

### 1. Un branch nuovo e il 2D tolto interamente
- Lavora su un branch nuovo (per esempio `3d`), partendo dal branch degli step 8.2A-8.2C.
- Togli il rendering 2D e tutto ciò che serve solo a lui: canvas 2D, tile con texture, sprite, camminate e icone
  dipinte, scontorno e magenta, `imagetools`, l'Atelier delle immagini, l'ArtDirector che dipinge, il modello di
  immagini nella configurazione. Nessuna chiamata di immagine deve restare nel gioco.
- **Non togliere i concetti di gioco**: tappeto, corona, rune e magia, Concilio, società, trame e missioni,
  inventario, effetti, regole, due tavoli e quarta parete, rollback e repository dell'universo. Vanno riportati
  nel 3D; dove il modo di funzionare cambia (le rune «una per casella», il menu delle caselle, la corona come
  studio), proponi nel piano come diventano.

### 2. Il gioco in 3D
- Renderer three.js con la camera in 3/4 (come la sandbox), HUD e pannelli sopra.
- Ogni aspetto è un programma MarkovJunior: il manifest e le `ItemDef` hanno un programma (con classe e semi)
  al posto dello sprite; le persone camminano con gli arti, le strutture hanno azioni e animazioni come regole.
- Lo spazio a scale (proposta C): il Cartografo scrive il piano a scala di casella con lotti e ancore; il kernel
  posa i modelli con posizione e rotazione libere, li esegue nei worker, collega sentieri e ingressi; collisione e
  pavimenti dai voxel; i chunk restano per generare, caricare e salvare.
- Lo **Scultore** entra nel Concilio (scrive i programmi); l'**Artista** giudica i modelli invece di dipingerli;
  il **Cartografo** produce lotti e ancore. I modelli offline (`MockModels`) rispondono ai compiti nuovi con i
  programmi scritti a mano, così i test restano senza rete.
- Le azioni sugli oggetti diventano regole sul modello (come la porta della sandbox); «Altro…» può generare
  nuove regole.

### 3. Costi sotto controllo (dal report 8.2B)
- Scultore per classe: 3.1 Flash-Lite per vegetazione, rocce e oggetti, con più programmi indipendenti invece
  di giri di miglioramento; 3.8 Flash per persone, animali e strutture; Argon solo per le strutture che contano.
- Ragionamento `low` esplicito in ogni chiamata; istruzioni stabili all'inizio, così la cache lavora.
- Un **registro dei consumi** nel kernel (per giorno, modello e compito, salvato nell'universo), il costo in
  dollari visibile subito nel pannello del Concilio; `GeminiModels` deve contare ragionamento e cache e **non
  ripetere una richiesta dopo un tempo scaduto**. I prezzi in un file solo, con la data in cui li hai letti.
- Riuso: un programma per tipo, le istanze sono semi diversi.

### 4. Cartelle in ordine
- Gli esperimenti in cartelle dedicate. Il laboratorio è stato costruito in tre sessioni e non è più allineato
  con il progetto: o lo togli, o lo tieni come **laboratorio di MarkovJunior**, per analizzare e correggere i
  programmi (modelli e strutture) che il Concilio non riesce a generare. Io propenderei per tenerlo così, ma
  decidi nel piano e motivalo. Le parti superate (strutture a blocchi, WFC, architetto, sprite fotografati)
  restano nella storia di git e negli ADR, non nel codice.
- L'universo `valmora` e le mie copie di backup (`universes/valmora copy 2`, `universes/valmora new`) vanno
  spostati in una cartella di backup fuori dal progetto attivo (i dati non si cancellano). Il gioco 3D parte da
  un seme nuovo.

## Regole
- `AGENTS.md` resta l'unica fonte di verità: riscrivilo dove descrive il 2D, e ogni decisione ha il suo ADR
  nello stesso commit.
- Test e typecheck verdi alla fine di ogni fase; i test di conformità di MarkovJunior (i modelli 3D ufficiali)
  non si toccano.
- Le prove con Gemini costano: falle solo quando servono a decidere, con i contatori accesi, e riporta la spesa.
- Alla fine: un riassunto di cosa è cambiato, cosa manca, e quanto è costato.

Fuori da questo passo: la coerenza di persone e trame (la mia bozza in `docs/userchats/step9.md`) diventerà lo
step successivo.
