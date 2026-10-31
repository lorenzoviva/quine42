# ADR-0095 — Il sito web: progetto, pagine, navigazione e stile pop art comics / retro arcade

Data: 2026-10-31 · Stato: accettato (progetto del task T97; da attuare T101-T106) · Riferimenti: ADR-0022 (la corona e lo studio), ADR-0025 (due tavoli e quarta parete), ADR-0040 (il mondo in 3D), ADR-0050/ADR-0058 (il multigiocatore), ADR-0056/ADR-0084/ADR-0086 (le carte dei contenuti e l'eredità dei cloni), ADR-0081 (crediti e spese comuni), ADR-0082 (l'account Firebase), ADR-0083 (i pagamenti con Stripe)

## Contesto
Fin qui QUINE42 è stato accessibile unicamente come applicazione di gioco a schermo intero (`index.html`) con le due sandbox dedicate di MarkovJunior (`lab/3d/` e `lab/editor/`).
Con l'evoluzione del multigiocatore, dell'autenticazione con Firebase Auth, dei pagamenti con Stripe Checkout, dell'economia dei crediti e della collezione di carte con quote di eredità nei cloni, serve una piattaforma web esterna al gioco («out-game») che permetta a nuovi e vecchi giocatori di:
1. Conoscere il progetto e accedere direttamente con un clic («Gioca nel browser»);
2. Autenticarsi (Google o anonimo) e gestire il profilo del viandante;
3. Esplorare le sessioni multigiocatore attive e creare nuovi universi personalizzati;
4. Ammirare e collezionare le carte dei contenuti (moduli, oggetti, luoghi) con le statistiche vive di utilizzo nel mondo;
5. Gestire il portafoglio crediti con ricariche rapide e trasparenti tramite Stripe.

Richieste dell'autore (to-do del 31/10/2026, `docs/userchats/to-do-2026-10-31.md` e T97):
- **Stile visivo**: pop art a fumetti e arcade retro, neon punk, retrowave/synthwave, condiviso sia per le pagine web esterne sia per le interfacce in gioco;
- **three.js fuori dal gioco**: rendering 3D attivo anche nel sito (es. sfondi con animazioni MarkovJunior nella hero, carte 3D animate interattive);
- **Il segreto dei gerboa**: richiamare velatamente la corona del Concilio senza svelarla (es. in fondo alla landing la punta delle orecchie dei gerboa che spuntano dalla linea d'orizzonte, comprensibili solo dopo averli visti in gioco);
- **Architettura leggera**: riuso delle funzionalità esistenti (Firebase, sessioni, Stripe, carte, store git), template grafico ispirato a Claude Design ma senza obbligo di framework monolitici (niente React/Angular nel kernel).

---

## Decisione

### 1. Stack e architettura tecnica
- **Pagine multi-entry Vite**: le pagine del sito risiedono in `site/` e sono compilate da Vite come input separati in `rollupOptions.input` (`main: index.html`, `site: site/index.html`, ecc.).
- **Nessun framework pesante**: l'interfaccia adotta TypeScript nativo, leggero e modulare, coerente con l'architettura a zero-dipendenze pesanti del kernel (`src/ui/dom.ts`, componenti UI stateless).
- **Condivisione diretta di three.js e `src/mj/`**: il motore grafico three.js e gli algoritmi di parsing/mesh voxel di MarkovJunior sono importati direttamente anche nelle pagine del sito per:
  - Lo sfondo / hero canvas animato con voxel e anelli orbitali al neon;
  - Il visualizzatore dell'avatar e del mantello del viandante nella pagina profilo;
  - Il rendering tridimensionale delle carte con rotazione, riflessi prismatici e flip interattivo.
- **Riuso dei servizi backend**:
  - `server/account.ts` e `src/session/login.ts` per Firebase Auth (`/api/account`);
  - `server/universeStore.ts` per l'elenco degli universi e la creazione di nuovi mondi git (`/api/universe`);
  - `server/session.ts` per le informazioni in tempo reale sulle sessioni multigiocatore attive;
  - `server/stripe.ts` e `world/pagamenti.json` per ricarica crediti e storico acquisti (`/api/stripe/checkout`).

---

### 2. Mappa delle pagine e flusso di navigazione

```
                        ┌─────────────────────────────────┐
                        │   Landing Page (site/index.html) │
                        │  Hero 3D · Pilastri · CTA ·     │
                        │  Segreto dei Gerboa nel footer   │
                        └───────────────┬─────────────────┘
                                        │
        ┌───────────────────────┬───────┴───────────────┬────────────────────────┐
        ▼                       ▼                       ▼                        ▼
┌──────────────┐     ┌─────────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Profilo    │     │      Sessioni       │    │     Carte 3D    │    │     Crediti      │
│  & Account   │     │  & Nuovo Universo   │    │  Collezionabili │    │  & Ricarica      │
│  (Firebase)  │     │  (Lobby & Git Store)│    │  (three.js Mesh)│    │  (Stripe Checkout│
└──────────────┘     └─────────────────────┘    └─────────────────┘    └──────────────────┘
```

1. **Landing Page (`site/index.html`)**:
   - Presentazione accattivante: titolo punchy a fumetti, pillole informative;
   - Hero 3D Three.js interattivo che risponde al movimento del cursore con animazione procedurale;
   - Call To Action immediate: «Gioca Subito» (entra direttamente nel mondo), «Esplora le Carte», «Crea Universo»;
   - Vetrina dinamica con anteprima interattiva dei tre moduli chiave (Carte, Sessioni, Crediti);
   - Footer synthwave con la griglia prospettica e **il segreto dei gerboa**.

2. **Pagina Login & Profilo (`site/profilo.html` — task T102)**:
   - Integrazione Firebase Auth con pulsanti per accesso Google o anonimo;
   - Sezione account: ID univoco viandante, stato di collegamento account (con pulsante «Lega a Google» per gli anonimi), saldo crediti attuale;
   - Personalizzazione estetica del viandante: selettore colore mantello e seme MarkovJunior con anteprima 3D in tempo reale.

3. **Pagina Sessioni & Nuovo Universo (`site/sessioni.html` — task T103)**:
   - Visualizzazione a schede delle sessioni multigiocatore attive e degli universi ospitati;
   - Informazioni chiare per ciascun mondo: master titolare, modelli IA adottati (Concilio e Scultore), coefficienti di generazione, stima oraria della spesa e tetto minimo richiesto (`minimi.tetto`);
   - Pulsante «Crea nuovo universo»: wizard web che permette di specificare nome, seme iniziale, tipo di partita e modelli IA, chiamando le API di `universeStore`.

4. **Area Carte Collezionabili (`site/carte.html` — task T104)**:
   - Galleria delle carte possedute dal giocatore (`cards.ts`, `world/carte.json`);
   - Ogni carta è renderizzata come mesh 3D Three.js con texture olografica prismatica, animazione di galleggiamento e flip interattivo;
   - Mostra gli utilizzi vivi nel mondo (luoghi, trame, prompt, totale), l'impronta MinHash e l'albero genealogico della catena dei titolari (ADR-0084).

5. **Area Pagamenti e Crediti (`site/pagamenti.html` — task T105)**:
   - Visualizzazione del saldo crediti in dollari ($);
   - Selettore di ricarica con tagli rapidi ($5, $10, $20, $50) o importo personalizzato;
   - Integrazione sicura con `/api/stripe/checkout` per pagamento tramite carta o Google Pay;
   - Tabella storica delle transazioni accreditate registrate in `world/pagamenti.json`.

---

### 3. Sistema di design e variabili CSS unificate (`src/theme.css`)
Per garantire totale armonia visiva, i token di stile sono centralizzati in `src/theme.css` e importati sia da `src/style.css` (interfacce in-game) sia dai fogli di stile del sito web:

- **Colori Neon Punk & Synthwave**:
  - `--neon-pink: #ff2a85` (accenti energetici, pulsanti primari)
  - `--neon-cyan: #00f0ff` (pulsanti secondari, bordi elettrici, bagliori)
  - `--neon-yellow: #ffe600` (titoli display, rarità auree, stelle)
  - `--neon-green: #05ffa1` (successo, statistiche, saldi positivi)
  - `--neon-purple: #9d00ff` (mistero, dettagli arcani)
  - `--comic-ink: #07040d` (nero inchiostro per tratti e ombre nette)
  - `--synth-bg: #090514` (sfondo notte profondo con riflessi violacei)
- **Tipografia**:
  - Titoli ed enfasi: `--font-display: 'Bangers', 'Impact', 'Arial Black', sans-serif`
  - Diciture arcade: `--font-arcade: 'Press Start 2P', 'VT323', monospace`
  - Codice e dati: `--font-mono: 'Cascadia Mono', 'JetBrains Mono', Consolas, monospace`
- **Tratti distintivi dello stile**:
  - *Bordi a inchiostro netto*: `border: 3px solid var(--comic-ink)`
  - *Ombre ad angolo senza sfocatura*: `box-shadow: 4px 4px 0px var(--neon-cyan)`
  - *Pattern mezze tinte (Ben-Day dots)*: gradienti radiali CSS per replicare la stampa tipografica dei fumetti vintage
  - *Griglie prospettiche*: griglie synthwave per sfondi e orizzonti.

---

### 4. Il segreto dei gerboa
Nel rispetto rigoroso della regola inviolabile 0 (niente meta-gioco e due tavoli, ADR-0025):
- La landing page non contiene spiegazioni metanarrative sulla simulazione né rivela l'esistenza dello studio del Concilio o dei gerboa giganti (ADR-0022, T50d);
- In fondo alla landing page, al centro dell'orizzonte prospettico al neon del footer, spuntano unicamente le due caratteristiche sagome delle orecchie lunghe dei gerboa (`.jerboa-silhouette`, SVG minimale);
- Per chi approda sul sito per la prima volta si tratta di un simpatico ammiccamento estetico o di una silhouette misteriosa; chi ha superato il tappeto ed è entrato nello studio riconosce immediatamente gli avatar del Concilio.

---

### 5. Roadmap e compiti atomici nel backlog
Il lavoro di implementazione è suddiviso nei seguenti task sequenziali atomici:
1. **T101**: *Landing page completa* — Struttura HTML/CSS/TS, hero con 3D canvas three.js, animazione procedurale, pillole informative e footer con il segreto dei gerboa. (Dipende da: T97)
2. **T102**: *Login e Profilo* — Interfaccia autenticazione Firebase Auth (Google/Anonimo), editor profilo viandante con visualizzatore 3D mantello e seme MarkovJunior. (Dipende da: T97, T44b)
3. **T103**: *Sessioni e Nuovo Universo* — Hub sessioni multigiocatore, schede dettagli universi (modelli, minimi, stime orarie) e wizard di creazione nuovo universo tramite API git. (Dipende da: T97, T45d)
4. **T104**: *Area Carte Collezionabili 3D* — Galleria interattiva three.js delle carte del giocatore, rotazione 3D e animazione flip, statistiche di utilizzo in-world e albero genealogico dell'eredità dei cloni. (Dipende da: T97, T45d, T84)
5. **T105**: *Area Pagamenti e Crediti* — Cruscotto saldo crediti, ricarica Stripe Checkout e storico transazioni. (Dipende da: T97, T45e, T93)
6. **T106**: *Il tema pop art / retro arcade in-game* — Applicazione delle variabili CSS di `theme.css` e dello stile a fumetti neon su HUD, inventario, lobby, chat e finestre modali del gioco. (Dipende da: T97)

---

## Conseguenze
- QUINE42 dispone di un'architettura web modulare e integrata, servita nativamente da Vite senza sovraccarico di framework esterni.
- Lo stile grafico pop art comics / retro arcade unifica l'identità visiva dell'esperienza utente dentro e fuori dal gioco.
- three.js valorizza gli asset procedurali anche nelle pagine web (hero canvas, carte collezionabili e profilo 3D).
- La divisione dei task garantisce avanzamenti rapidi, collaudabili e indipendenti all'interno della pipeline.
