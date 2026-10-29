# Prompt per Gemini CLI: arredi futuristici, logistica e Concilio di gerboa della corona

Task T50 del [backlog](../plans/backlog.md) (sotto-task T50a). L'autore è abbonato a Gemini: Gemini CLI (un agente con i file del
progetto, la shell e il browser) scrive **lui stesso** i programmi MarkovJunior per arricchire la corona di QUINE42 e li
collauda nel laboratorio 3D, senza la `GEMINI_API_KEY` del progetto (le chiamate a pagamento restano al gioco).
Un modello per sessione; i task T50b-T50e li integrano e animano nel campus e negli interni.

## Come si usa

1. Apri Gemini CLI nel worktree `H:\projects\rune\.claude\worktrees\step8.2A-lab3d` (branch `3d`), con il modello
   più forte disponibile in ragionamento alto (oggi `gemini-3.8-flash`, effort *high*).
2. Incolla il **prompt comune** qui sotto, sostituendo `<ID>` con l'id del modello che vuoi scolpire:
   - **Arredi urbani futuristici (8 voxel per casella)**:
     - `corona-albero-luce`: Albero di luce neon e rami traslucidi (crescita generativa ad alta varietà).
     - `corona-lampione`: Lampione futuristico ad arco per illuminare il viale della corona.
     - `corona-panchina`: Panchina sintetica monoblocco a nastro curvo per vicoli e prati.
     - `corona-totem`: Totem informativo / cartello olografico di settore con display a voxel luminosi.
   - **Logistica e trasporti esterni (8 voxel per casella)**:
     - `corona-drone`: Drone logistico volante porta-dati (animazione rotori/getti neon).
     - `corona-treno`: Vagoncino o pod magnetico di trasporto archivi e file.
   - **Gli avatar del Concilio: i gerboa giganti (20 voxel per casella)**:
     - `corona-gerboa-narratore`: Gerboa cantastorie con cilindro oro (`#ffcf5c`).
     - `corona-gerboa-cartografo`: Gerboa esploratore con berretto/visiera e mappa verde (`#7dd87d`).
     - `corona-gerboa-artista`: Gerboa pittore bohémien con basco inclinato rosa (`#ff8ad8`).
     - `corona-gerboa-scultore`: Gerboa cantiere con elmetto/visiera arancione (`#ffa65c`).
     - `corona-gerboa-fisico`: Gerboa scienziato con tocco e occhialoni azzurri (`#6fc3ff`).
     - `corona-gerboa-ingegnere`: Gerboa tecnico con berretto e monocolo lavanda (`#b9a6ff`).
     - `corona-gerboa-arbitro`: Gerboa magistrato con parrucca cerimoniale corallo (`#ff6b6b`).
     - `corona-gerboa-referente`: Gerboa concierge diplomatico con berretto e auricolare argento (`#f2f2f2`).
3. A fine sessione guarda le foto in `lab/out/mjx/<ID>.png` (e `.<animazione>.png`) e il modello nella sandbox. Se va bene,
   il commit è già pronto; altrimenti chiedigli cosa affinare nella stessa sessione.
4. Quando i modelli sono pronti, i task successivi (T50b per arredi, T50c per logistica, T50d per gli avatar, T50e per il campus)
   li integreranno nel gioco.

---

## Il prompt comune

> Sei lo Scultore della corona di QUINE42 (in precedenza RUNE), un gioco in 3D a voxel visto dall'alto in 3/4. Lavori nel worktree
> `H:\projects\rune\.claude\worktrees\step8.2A-lab3d` (branch `3d`, già attivo: non cambiare branch). Oggi scrivi
> **un solo modello**: quello con id **`<ID>`**, descritto nella sua scheda in
> `docs/prompts/gemini-esterni-corona.md` (sezione «Le schede»). Leggi tutto quel file prima di cominciare: le
> regole, la scala e le convenzioni valgono per tutte le realizzazioni.
>
> **Regole sulla chiave e sui costi — inviolabili.**
> - Non leggere, stampare, copiare né usare `.env` o la `GEMINI_API_KEY`. Non chiamare le API di Google da
>   script o da codice.
> - Non eseguire gli script del laboratorio che chiamano Gemini: `mjx-sculpt.ts`, `mjx-trial.ts`,
>   `sculpt-game.ts`, `trial-batch.sh`. Nella sandbox non premere «Scolpisci con Gemini».
> - Il programma lo scrivi tu, a mano, ragionando; le foto le guardi tu (apri i PNG o la pagina nel browser).
>
> **Dove scrivi.** Solo:
> - `lab/mjx/models/<ID>.xml` (il programma, con il commento in testa descritto nel file del prompt);
> - una riga in `lab/3d/catalog.ts`, nell'elenco `MODELS`:
>   `['<ID>', '<Nome>', '<ruolo>', <vpt>],` (dove `<vpt>` è 8 per arredi/trasporti e 20 per i gerboa);
> - `lab/out/` per le prove e i rendering (cartella ignorata da git).
> Non toccare `src/`, `universe/`, `tests/` né altri file: il gioco li integrerà nei task dedicati.
> Se ti sembra che il motore abbia un difetto, non correggerlo: segnalalo nel resoconto finale.
>
> **Che cosa leggere prima** (in quest'ordine):
> 1. `universe/prompts/agents/scultore.md`: il dialetto MarkovJunior del gioco (coordinate, pattern, nodi, forme,
>    `glow`, animazioni, parti `part`, azioni, trappole).
> 2. `docs/prompts/gemini-esterni-corona.md` (questo file, in particolare «Sfruttare MarkovJunior a piena potenza»).
> 3. `lab/README.md` (sezioni «Come si usa» e «Che cosa ho imparato»).
> 4. Esempi di riferimento:
>    - `universe/models/falo.xml` (voxel luminosi `glow` e animazione a fotogrammi);
>    - `universe/models/corona-magia.xml` (accenti neon, palette scura e animazione anelli);
>    - `universe/models/gatto.xml` e `universe/models/viandante.xml` (arti `part`, anatomia e proporzioni a 20 vpt);
>    - `universe/models/pino.xml` e `universe/models/quercia.xml` (crescita organica da seme).
>
> **Il ciclo di lavoro.**
> 1. Progetta le masse principali, la silhouette, i materiali (4-8 colori scelti dalla palette o ricolorati, più i neon),
>    dove collocare le fonti di luce `glow="True"` e gli eventuali fotogrammi animati `<animation>`.
> 2. Scrivi `lab/mjx/models/<ID>.xml`.
> 3. Fotografalo da quattro lati e semi diversi:
>    `npx vite-node lab/scripts/mjx-render.ts -- <ID> --seeds 3` (se ha un'animazione aggiungi `--frames`).
>    Le foto vengono salvate in `lab/out/mjx/<ID>.png` (e `.<animazione>.png`). Il terminale stampa voxel, passi,
>    millisecondi, errori e avvisi: **nessun errore**, non deve mai andare in ciclo infinito («non finisce»), tempo sotto i 3000 ms per seme.
> 4. Se una parte interna o un'articolazione non torna, esaminala a fette:
>    `npx vite-node lab/scripts/mjx-slice.ts -- <ID> 1 0 5 10 15` (sezioni orizzontali) oppure `... 1 --y 12` (sezione verticale).
> 5. **Giudica le foto come l'Artista** (`universe/prompts/agents/artista.md`):
>    - È immediatamente riconoscibile dai quattro lati?
>    - Per i Gerboa: è carino, paffuto e pacioccoso, per nulla inquietante? Il cappello si distingue subito?
>    - Per l'arredo urbano: la forma è marcatamente futuristica e artificiosa? I semi diversi danno varianti ricche?
>    - Voto da 1 a 10: correggi finché non raggiungi almeno 8 (almeno tre iterazioni di rifinitura).
> 6. Collaudalo nella sandbox interattiva: `npm run dev`, apri <http://localhost:5173/lab/3d/>, seleziona il modello
>    dal catalogo, clicca «Mettilo davanti a me», ruota la visuale (WASD, Q/R, rotellina zoom), porta il cursore
>    dell'orario verso la notte (ore 22-24) per verificare il bloom del neon e poi torna a giorno pieno.
>    Salva uno screenshot significativo in `lab/out/<ID>-sandbox.png`.
> 7. Verifica di conformità: `npm test` e `npm run typecheck` verdi.
> 8. Commit sul branch `3d`: aggiungi solo `lab/mjx/models/<ID>.xml` e `lab/3d/catalog.ts`, con messaggio
>    `Corona (T50): <nome> scritto da Gemini`. Non fare push, non fare merge.
> 9. **Resoconto finale** (in chat, in italiano): voto motivato alle foto; numero di voxel, passi e tempo;
>    lettere della palette impiegate; spiegazione della resa dei semi diversi o dell'animazione; impressioni sul modello.

---

## Sfruttare MarkovJunior a piena potenza

L'autore ha richiesto espressamente di **usare MarkovJunior a tutta la sua espressività**: niente blocchi rigidi o banali
composizioni di sole scatole geometriche. Vogliamo modelli dinamici, ricchi e sorprendenti:

### 1. Regole generative e semi riutilizzabili ad altissima varietà
- Per l'**albero di luce**: sfrutta nodi ad accrescimento gerarchico (`<sequence>`, `<markov>`, `<one>`). Parti da un tronco
  base o da un seme a terra (`origin="True"`), fai salire linee guidate con biforcazioni asimmetriche, usa automi cellulari
  (`<convolution sum="9..18" neighborhood="NoCorners">`) per addensare i grappoli di fotoni/cristalli sui rami.
- **La magia del seme**: il codice deve produrre un albero sempre coerente nello stile, ma con ramificazioni, nodi e
  forme della chioma visibilmente differenti passando da seed 1 a seed 2 e 3.

### 2. Voxel luminosi `glow="True"` ed emissione di bloom
- Una lettera definita con `<color symbol="X" value="<esadecimale>" glow="True" name="..."/>` emette luce propria: non riceve
  ombre scure e nel renderer three.js genera l'alone di bagliore (bloom).
- Usalo con cura scenografica:
  - Nei lampioni: solo la campana interna o la feritoia emittente verso il basso;
  - Negli alberi di luce: vene energetiche interne o gemme luminose sparse sulla chioma sintetica;
  - Nei droni e trenini: anelli di levitazione magnetica o cuori energetici dei pacchetti dati;
  - Nei gerboa: dettagli sottili del cappello (spille, visiere olografiche, lenti) o pupille con riflesso.

### 3. Illusione di voxel trasparenti e riflettenti (tecnica pittorica)
- Il motore voxel non ha trasparenza alpha fisica sulle singole facce (i voxel visibili sono renderizzati con shader opaco):
  la trasparenza e il riflesso vitreo si creano **pittoricamente**:
  - Usa tonalità fredde stratificate: ciano (`00ffff`), azzurro ciano (`5fcde4`), indaco/notte (`1c2a3a`), riflessi ardesia (`3d5a78`)
    e bagliori bianchi (`ffffff`);
  - Alterna voxel vitrei a piccoli vuoti d'aria (`B`) creando strutture a reticolo, tralicci aperti o gusci forati, che
    lasciano intravedere i componenti interni e i neon retrostanti.

### 4. Fotogrammi animati `<animation>`
- Per i modelli con componenti in movimento (come i droni logistici e i trenini dei file), inserisci un nodo di animazione:
  ```xml
  <animation name="propulsione" frames="4">
    <sequence>
      <!-- Regole che ciclano o scambiano due lettere della palette, es. luce accesa/spenta o rotazione eliche -->
      <rule in="L B" out="B L"/>
    </sequence>
  </animation>
  ```
- Ogni fotogramma viene campionato dal visualizzatore, consentendo di collaudare rotazioni di pale, anelli a pulsazione o
  onde di dati che attraversano i pod.

### 5. Anatomia e articolazioni per i Gerboa (`part`)
- Per rendere i gerboa animabili quando camminano o salutano, assegna alle lettere delle zampe, della testa e della coda
  l'attributo `part`:
  ```xml
  <color symbol="T" value="c89868" part="testa" name="testa"/>
  <color symbol="G" value="b07848" part="gamba" name="zampa_posteriore"/>
  <color symbol="A" value="d8a878" part="braccio" name="zampetta_anteriore"/>
  <color symbol="C" value="8a5830" part="coda" name="coda"/>
  ```
- Il kernel del gioco sa muovere in sincronia le parti contrassegnate durante il movimento degli avatar.

---

## Scale e convenzioni

Ci sono **due scale dimensionali distinte**:

| Categoria | Voxel per casella (`vpt`) | Altezza indicativa | Note di scala |
|---|---|---|---|
| **Arredi urbani e logistica** | **8** | 8 – 28 voxel (1 – 3.5 caselle) | Stessa scala degli 11 edifici della corona; il viandante è alto 12 voxel. |
| **Avatar del Concilio (Gerboa)** | **20** | 24 – 30 voxel (1.2 – 1.5 caselle) | Scala delle figure (viandante, NPC); permette dettagli espressivi del volto e cappelli ricchi. |

### Coordinate
- **x**: da sinistra a destra (-x sinistra, +x destra).
- **y**: dal fondo verso il davanti (davanti = **y grande**, verso chi guarda in 3/4).
- **z**: dal basso verso l'alto (z = 0 è il pavimento / suolo; il corpo poggia solidamente a terra su z = 0).
- Centratura: poggia la base al centro orizzontale della scatola; lascia almeno 1-2 voxel di margine rispetto ai bordi
  esterni per evitare tagli bruschi delle regole.

### Lo stile visivo: Cyberpunk raffinato & "Pacioccosità" galattica
- **Arredi e veicoli**: metalli scuri grafite (`141418`, `1d1e26`), leghe titanio opaco (`3a3a40`, `5f574f`), vetro riflettente
  a fasce (`1c2a3a`, `3d5a78`), neon mirati (ciano `#05d9e8`, rosa elettrico `#ff2a6d`, ambra dorata `#ffa300`).
- **Gerboa del Concilio**: soffici, teneri, pacioccosi! Omaggio alla *Guida Galattica per gli Autostoppisti*. Pelliccia soffice e
  calda (crema, sabbia, biscotto o grigio perla con pancino chiaro), musetto accattivante con baffetti, zampone posteriori elastiche,
  manine minute al petto, orecchie giganti a parabola traslucide e una lunga coda elegante con ciuffo batuffoloso.
  I cappelli tematici devono essere vistosi, spiritosi e immediatamente riconoscibili.

---

## Le schede dei modelli

### SEZIONE 1 · Arredo urbano futuristico (Scala 8 vpt)

#### `corona-albero-luce` — Albero di luce neon e traslucido
- **Scatola**: 2 × 2 × 3.5 caselle → `size="16 16 28"`, `vpt: 8`.
- **Ruolo catalogo**: `tree`.
- **Palette consigliata**: metallo scuro o cristallo grafite per il fusto (`141418`, `2a2c38`), fusto interno con fibra luminosa
  ciano o zaffiro (`05d9e8`, `29adff` glow), chioma sintetica sfumata in vetro traslucido aqua/indaco (`1c2a3a`, `9badb7`, `cbdbfc`)
  e voxel fogliari al neon (`#6fc3ff`, `#00ffff` glow).
- **Concetto generativo**: non un cono o una sfera banale! Il tronco sale con una torsione fluida o una linea spezzata elegante,
  diramandosi a quota z ~ 10-12 in 3 o 4 rami principali che si aprono verso l'esterno. La chioma è una nuvola di particelle
  cristalline e rami frattali generati con regole MarkovJunior. Con seed 1, 2 e 3 la ramificazione deve cambiare nettamente silhouette.

#### `corona-lampione` — Lampione futuristico ad arco del viale
- **Scatola**: 1 × 1 × 2.5 caselle → `size="8 8 20"`, `vpt: 8`.
- **Ruolo catalogo**: `prop`.
- **Palette consigliata**: base e stelo in titanio scuro (`1a1b22`, `2e303d`), giunti cromati (`83769c`, `c2c3c7`), fascio
  luminoso neon (`05d9e8` o azzurro puro `6fc3ff` glow="True").
- **Concetto**: stelo slanciato asimmetrico: sale dritto fino a z ~ 12, poi curva bruscamente ad arco o con uno spigolo a 45 gradi
  sporgendosi in avanti (verso y grande, dove scorre il viale). Sulla punta a sbalzo, una testa luminescente piatta o una doppia
  fessura neon che proietta la luce verso il basso. Alla base, un collare geometrico con una sottile spia di stato verde o blu.

#### `corona-panchina` — Panchina sintetica monoblocco
- **Scatola**: 1.5 × 1 × 1 caselle → `size="12 8 8"`, `vpt: 8`.
- **Ruolo catalogo**: `prop`.
- **Palette consigliata**: guscio ergonomico scuro opaco (`20222a`), seduta in materiale sintetico comfort grafite chiaro (`495060`),
  lama inferiore o profilo neon magenta/rosa (`ff2a6d` glow="True") che illumina il pavimento sottostante.
- **Concetto**: linea fluida monolitica a nastro continuo (un profilo che sale da un lato, forma la seduta orizzontale, sale
  nello schienale ribassato e ridiscende). Sembra quasi galleggiare su un piccolo piedistallo centrale scuro arretrato.
  Sul lato della spalliera, una piccola feritoia luminosa orizzontale.

#### `corona-totem` — Totem informativo / cartello olografico di settore
- **Scatola**: 1 × 1 × 2.5 caselle → `size="8 8 20"`, `vpt: 8`.
- **Ruolo catalogo**: `prop`.
- **Palette consigliata**: montante metallico nero (`141418`), plinto di fondazione (`3a3a40`), schermo olografico verticale
  in azzurro ciano (`29adff` e `00ffff` glow="True"), simboli di dati (`ffffff` glow="True").
- **Concetto**: una stele tecnologica slanciata. Il pilastro metallico sale fino a mezza altezza e regge un pannello/display
  verticale semitrasparente a voxel luminosi, inciso con trame di circuiti e rune binarie. In testa, un piccolo sensore
  o antenna ricetrasmittente a cuspide.

---

### SEZIONE 2 · Logistica e trasporti esterni (Scala 8 vpt)

#### `corona-drone` — Drone volante porta-dati
- **Scatola**: 1 × 1 × 1 casella → `size="8 8 8"`, `vpt: 8`.
- **Ruolo catalogo**: `prop` o `animal`.
- **Palette consigliata**: scocca aerodinamica bianca o grafite (`fff1e8`, `2a2c38`), 4 anelli propulsori neon ciano (`05d9e8` glow),
  pacco dati centrale arancione/oro pulsante (`ffa300` glow).
- **Animazione**: `<animation name="elica" frames="4">`: i 4 propulsori o rotori scambiano celle luminose simulando una
  rotazione rapida o una pulsazione anti-gravitazionale.
- **Concetto**: un piccolo e simpatico robottino quadricottero futuristico. Il corpo centrale a capsula tondeggiante stringe
  tra i carrelli inferiori un pacchetto dati cubico luminoso (un file che vola da un edificio all'altro). Dai quattro angoli
  sporgono braccetti sottili con anelli propulsori a reazione neon.

#### `corona-treno` — Pod magnetico di trasporto archivi e file
- **Scatola**: 2.5 × 1 × 1.25 caselle → `size="20 8 10"`, `vpt: 8`.
- **Ruolo catalogo**: `prop` o `structure`.
- **Palette consigliata**: carrozzeria profilata metallo nero e argento (`141418`, `847e87`), pattini magnetici a levitazione
  con striscia neon magenta (`ff2a6d` glow), finestrature panoramiche oscurate (`1c2a3a`), archivi interni illuminati (`ffec27`).
- **Concetto**: vagoncino passeggeri/merci futuristico, affusolato sul muso e sulla coda (a siluro o proiettile magnetico).
  Viaggia sollevato di 1 voxel da terra su pattini a repulsione magnetica che lasciano una scia luminosa. Attraverso i finestrini
  laterali si intravedono pile ordinate di cubetti dati che brillano all'interno.

---

### SEZIONE 3 · Gli Avatar del Concilio: Gerboa giganti con cappello (Scala 20 vpt)

Tutti i membri del Concilio condividono l'**anatomia base del Gerboa** (omaggio alla *Guida Galattica per gli Autostoppisti*):
- **Scatola standard del modello base**: `size="32 44 42"`, `vpt: 20` (ingombro 1.6 × 2.2 × 2.1 caselle, altezza 42 voxel).
- **Ruolo catalogo**: `npc`.
- **Anatomia base adottata**: Modello base `corona-gerboa.xml` (orecchie rivolte in avanti e leggermente divaricate a V). I tentativi con orecchie a 45° e laterali sono stati scartati: le orecchie risultavano visivamente troppo larghe ("grasse"), appesantendo la silhouette ed erodendo la grazia e la tenerezza del musetto.
- **Canone Sartoriale Gerboa: Decisione Architetturale Copricapo / Grandi Orecchie**:
  - **Le orecchie non vengono MAI nascoste né inglobate**: Le grandi orecchie a conchiglia (14 voxel di altezza) sono l'elemento identitario cardine della specie e della silhouette del Concilio. Se un copricapo contenesse le orecchie, il personaggio perderebbe la sua natura di gerboa, sembrando un roditore indistinto con un barattolo in testa.
  - **Coerenza obbligata tra tutti i membri**: Un cilindro alto potrebbe teoricamente contenere le orecchie, ma il basco dell'Artista, il caschetto protettivo dello Scultore, il casco coloniale del Cartografo, il tocco accademico del Fisico o il berretto dell'Ingegnere non possono farlo in nessun modo. Trattare il cilindro diversamente renderebbe il Concilio disomogeneo e sbilanciato.
  - **Copricapi su misura tra le orecchie (Asole anatomiche)**: Tutti i copricapi degli avatar sono realizzati dalla "sartoria della Corona" appositamente per la volta cranica del Gerboa:
    1. **Alloggiamento**: Il copricapo poggia sulla sommità del cranio (`x = 15.5, y = 32, z = 26..27`), perfettamente incastonato nello spazio centrale tra le radici delle due orecchie;
    2. **Tesa e asole**: La tesa/base del cappello si sviluppa verso la fronte e la nuca; ai fianchi segue la conformazione anatomica (asole sartoriali), lasciando emergere i padiglioni auricolari che svettano liberi verso l'alto;
    3. **Incorniciatura maestosa**: Le due orecchie incorniciano il copricapo a destra e a sinistra come due grandi ali, preservando la piena visibilità sia del musetto/espressione sia del copricapo distintivo con la fascia nel colore araldico dell'agente;
    4. **Copricapi inclinati / asimmetrici (es. Basco dell'Artista)**: Calzati con un'inclinazione vezzosa che si appoggia morbida contro la base di un'orecchio, lasciando l'altra completamente eretta;
    5. **Accessori del ruolo al collo e al muso**: Ogni avatar integra un collare/sciarpetta annodata sotto il mento (`y = 32..35, z = 12..16`) o accessori specifici (stilo luminoso, lenti, visiere, monocoli) nel proprio colore agente.

---

#### `corona-gerboa-narratore` — Il Cantastorie
- **Colore agente**: `#ffcf5c` (oro / giallo caldo).
- **Pelliccia**: manto color nocciola caldo con pancino dorato/panna.
- **Cappello**: **Cilindro sontuoso da cantastorie / nobiluomo vittoriano**:
  - Cilindro alto a sezione ovale in velluto nero grafite (`1d1e26`), con una brillante fascia di seta oro puro (`ffcf5c`, `ffa300`);
  - Infilata nella fascia sul lato destro, una lunga penna d'oca o stilo luminoso con la punta che brilla (`ffec27` glow);
  - Piccola sciarpetta dorata annodata con eleganza sotto il mento.

#### `corona-gerboa-cartografo` — L'Esploratore dei Luoghi
- **Colore agente**: `#7dd87d` (verde smeraldo chiaro).
- **Pelliccia**: manto sabbia deserto con sfumature verdognole delicate.
- **Cappello**: **Casco coloniale da esploratore con visiera e mappa olografica**:
  - Caschetto bombato da safari color kaki/verde oliva (`8f974a`, `7dd87d`), con visiera frontale pronunciata sopra gli occhioni;
  - Sopra la visiera, un paio di lenti/occhialini da geodesia rialzati con vetri riflettenti verdi;
  - Sulla schiena o a tracolla, un minuscolo rotolo di pergamena o cannocchiale in ottone (`e4bb40`).

#### `corona-gerboa-artista` — Il Maestro d'Arte
- **Colore agente**: `#ff8ad8` (rosa acceso / magenta).
- **Pelliccia**: manto candido o grigio perla con guance rosate.
- **Cappello**: **Basco bohémien inclinato da pittore**:
  - Grande basco morbido di panno inclinato vezzosamente sull'orecchio sinistro, in velluto rosa magenta (`ff8ad8`, `ff00ff`);
  - Con un piccolo stilo/pennello da scultura digitale infilato nel bordo del basco con la punta gocciolante di colore ciano o rosa;
  - Colletto a balze o piccolo foulard rosa vivo intorno al collo.

#### `corona-gerboa-scultore` — Il Costruttore di Forme
- **Colore agente**: `#ffa65c` (arancio vigoroso).
- **Pelliccia**: manto grigio grafite con pettorina ambrata.
- **Cappello**: **Caschetto protettivo da cantiere / visiera sollevabile**:
  - Elmetto protettivo aerodinamico arancione vivo (`ffa65c`, `ffa300`), con una spessa visiera scura sollevata a mezza fronte;
  - Piccola torcia o faretto led montato sulla fronte del caschetto che emette un fascio brillante (`ffffff` glow);
  - Robusti guantini da lavoro gommati sulle zampette anteriori.

#### `corona-gerboa-fisico` — Lo Scienziato delle Regole
- **Stato**: scolpito e collaudato (`lab/mjx/models/corona-gerboa-fisico.xml`, 4121 voxel, 112 passi, 0 errori, 0 colori inutilizzati).
- **Colore agente**: `#6fc3ff` (azzurro ciano / blu cielo).
- **Pelliccia**: manto azzurrino argentato con musetto bianco puro.
- **Cappello**: **Tocco accademico con nappa e grandi occhialoni tondi**:
  - Berretto universitario quadrato (tocco a mortaio) in velluto blu notte con nappa pendente azzurra (`6fc3ff`);
  - Sul muso, enormi occhiali protettivi rotondi da laboratorio con montatura argentata e lenti spesse cerchiate di luce azzurra;
  - Papillon geometrico azzurro sotto il mento;
  - Fialetta con reagente azzurro luminescente (`glow="True"`) alla cintura sul fianco.

#### `corona-gerboa-ingegnere` — Il Tecnico dei Sistemi
- **Colore agente**: `#b9a6ff` (lavanda / viola tecnologico).
- **Pelliccia**: manto scuro color prugna/ardesia con macchie lavanda.
- **Cappello**: **Berretto da macchinista hi-tech con lente/monocolo ottico**:
  - Berretto sportivo con visiera in tessuto tecnico viola (`b9a6ff`, `7e2553`);
  - Sull'occhio destro cala un monocolo ottico di precisione con lente ingranditrice a cerchi concentrici che brilla lievemente (`b9a6ff` glow);
  - Piccolo auricolare ad archetto che circonda la base dell'orecchio destro con microfonino sul musetto.

#### `corona-gerboa-arbitro` — Il Custode dell'Armonia
- **Colore agente**: `#ff6b6b` (rosso corallo).
- **Pelliccia**: manto marrone castano caldo con colletto candido.
- **Cappello**: **Parrucca cerimoniale settecentesca da giudice / tocco corallo**:
  - Classica parrucca giudiziaria a riccioli candidi sovrapposti (`ffffff`, `cbdbfc`), da cui spuntano maestose le due grandi orecchie da gerboa;
  - Sopra la parrucca, una papalina o tocco di panno rosso corallo (`ff6b6b`);
  - Pettorina candida a jabot da magistrato che scende sul petto tra le zampine.

#### `corona-gerboa-referente` — L'Ambasciatore del Concilio
- **Colore agente**: `#f2f2f2` (bianco latte / argento splendente).
- **Pelliccia**: soffice manto completamente candido, con orecchie e nasino rosa pallido.
- **Cappello**: **Berretto da concierge d'albergo d'alta classe con visore olografico**:
  - Berretto tondo da cerimonia bianco con fascia e visiera bordata in argento metallico riflettente (`f2f2f2`, `c2c3c7`);
  - Auricolare diplomatico integrato con una sottile visiera a display trasparente che scende davanti agli occhi proiettando rune dorate;
  - Elegante gilet argentato abbottonato sul pancino.

---

## Integrazione nel gioco (Task successivi)

Una volta generati e collaudati i programmi MarkovJunior:
1. **T50b**: Gli arredi (`corona-albero-luce`, `corona-lampione`, `corona-panchina`, `corona-totem`) vengono registrati in
   `universe/models/` e posizionati attorno al campus della corona (`src/render/corona3d.ts`).
2. **T50c**: I robottini (`corona-drone` e `corona-treno`) vengono animati su orbite e percorsi tra le strutture esterne.
3. **T50d**: I modelli dei Gerboa con i rispettivi cappelli sostituiscono i coni e le sfere provvisorie di `Avatars`
   in `src/render/corona3d.ts`, presenziando alle console della Direzione e nella Sala del Concilio.
4. **T50e**: Collaudo definitivo di layout, collisioni, illuminazione notturna e rendering del campus arricchito.
