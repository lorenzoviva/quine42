# Integrazione dei cantieri di Claude Cloud nei quattro universi esplorabili (T260 + T273)

Sessione cloud del 05/11 (ramo `claude/quine42-universi-cloud-integration-k3h9p5`, partito da `3d`). Obiettivo: le strutture, i modelli e i
suoni creati su Claude Cloud si vedono nei quattro universi esplorabili, e ogni universo dichiara la versione del kernel. **Zero chiamate a
un modello**: niente `GEMINI_API_KEY`, solo `MockAiModels`; costo dei modelli 0,00 $.

| universo | tema | dove sta nel repository | strutture del catalogo | modelli del seme procedurali | props | suoni |
|---|---|---|---|---|---|---|
| aurora | fantasy | `universe/` (il seme) + le mappe in `aurora/maps/` | 12 (una Enorme) | 23 | 10 | 6 brani, 19 effetti, la Morte rifatta (accanto) |
| orichalcum | steampunk | `orichalcum/` | 12 (una Enorme) | 23 | 10 | 6 brani, 19 effetti, la Morte rifatta (accanto) |
| neapolis | moderno | `neapolis/` | 12 (una Enorme) + le 2 sue (T272) | 23 | 10 | 6 brani, 19 effetti, la Morte rifatta (accanto) |
| sidera | futuristico | `sidera/` | 12 + le 2 sue (T272) | 9 (quelli che aveva, meno `grande`) | 10 | 6 brani, 19 effetti, la Morte rifatta (accanto) |

## Come si installa ed esplora (in locale)

```bash
npm run universi:cloud                      # i quattro in universes/ (aurora, orichalcum, neapolis, sidera)
npm run universi:cloud -- sidera neapolis   # solo alcuni
npm run universi:cloud -- --dir <cartella>  # altrove (così l'ho provato, su una cartella temporanea)
npm run dev
```

Poi `http://localhost:5173/?skip&offline` (aurora) e `http://localhost:5173/?universo=orichalcum&skip&offline` (e `neapolis`, `sidera`).
`offline` tiene i modelli locali (costo zero anche con la chiave nel `.env`); `skip` salta intro e Genesi. Senza `skip` la Genesi non riparte
comunque: il commit dell'installazione è `genesi: <titolo della bibbia> …` e `needsGenesis()` lo trova. Una nuova Genesi riscriverebbe la
bibbia, e con lei la firma delle mappe (`recordKey`): i luoghi pianificati qui non varrebbero più.

Lo script (`lab/scripts/installa-universi-cloud.ts`, la logica in `strumenti/installa.ts`), per ogni universo:

1. prende i file che un universo può avere (`allowedPath`) di `universe/` o di `lab/banco/universi-cloud/<nome>/`, le sue mappe (quelle di
   aurora da `aurora/maps/`) e `seed.json` con le impronte del seme, come lo scrive il browser alla nascita di un universo (`main.ts`): ciò
   che il seme ha e l'universo no è una scelta dell'universo e non viene portato dentro;
2. applica `upgradeFromSeed` come il browser a ogni caricamento (gli ambienti, i terreni e le rune nuove del seme nei manifest con lo stesso
   id, le voci nuove dell'indice dei modelli), così il primo caricamento non ha niente da scrivere;
3. lo controlla: il kernel lo avvia senza fault e ogni struttura dei suoi piani viene dalla libreria; se no, si ferma e non scrive niente;
4. lo scrive come repository git con `runGit` (`server/git.ts`), un commit della Genesi, e prepara il suo registro dei saldi vuoto
   (`sealLedger`, come `create` del server). **Un universo che c'era già non si cancella**: va in `universes/.cestino/<nome>-<ora>`, come fa
   «ricomincia dal seme».

Cosa porta il passo 2, misurato sulla cartella temporanea: orichalcum `modules/world.layouts`, `models/index.json`; neapolis
`modules/magic.runes`, `modules/world.layouts`, `modules/world.terrain`, `models/index.json`; sidera `modules/magic.runes`, `models/index.json`;
aurora niente. Sono gli ambienti e i terreni del seme che i manifest con lo stesso id ricevono comunque nel browser (`mergeKeyed`): i luoghi
pianificati non cambiano, il Cartografo potrebbe usarli per i luoghi nuovi oltre i 19.

### Andare a una struttura dalla console

Il tappeto riporta il viandante al centro: si sposta il mondo, non il viandante (come `verifica.ts`). Con le coordinate della tabella
(«centro del luogo», caselle del mondo):

```js
const k = window.quine, c = k.carpet(), p = k.wandererPos();
c.ox = X - p.x; c.oy = Y - p.y;   // X, Y = centro del luogo; la struttura è sul lotto indicato, la porta verso il sentiero
```

`?dev&teleport=X,Y` non serve qui: ferma il tappeto e mette il viandante a X, Y **dal centro del cerchio**, non nel mondo (oltre 42
caselle si è nella corona). La posizione si salva alla chiusura (`world/giocatori/io.json`, T214): per ripartire dalla piazza, reinstalla l'universo.

## Dove sta ogni struttura

Generato da `npx vite-node lab/banco/universi-cloud/strumenti/integrazione.ts` (dai piani, come il kernel costruisce i lotti: `layoutOf` +
`lotsOf`). «Lotto» è larghezza × altezza in caselle; il centro del lotto è in caselle del mondo.

<!-- strutture -->

### aurora (fantasy) — 12 strutture

| luogo (cx, cy) | nome del luogo | ambiente | struttura (concetto del piano) | modello | taglia | lotto | centro del lotto (x, y) | centro del luogo (x, y) | catalogo |
|---|---|---|---|---|---|---|---|---|---|
| (0, 0) | Campagna del Primo Passo | `borgo` | locanda | `struttura-locanda` | grande | 5×6 | (4.5, 10) | (9, 9) | primo: `fantasy/locanda.xml`, cantina |
| (0, 0) | Campagna del Primo Passo | `borgo` | fucina nanica | `struttura-fucina-nanica` | grande | 5×6 | (9.5, 14) | (9, 9) | gemello: `fantasy/fucina-nanica.xml`, cantina |
| (0, -1) | Piana delle Lanterne | `borgo` | residenza del borgomastro | `struttura-residenza-del-borgomastro` | grande | 6×5 | (6, -11.5) | (9, -9) | gemello: `fantasy/residenza-del-borgomastro.xml` |
| (0, -1) | Piana delle Lanterne | `borgo` | fucina | `struttura-fucina` | grande | 5×6 | (7.5, -6) | (9, -9) | primo: `fantasy/fucina.xml`, cantina |
| (-1, 0) | Radura Senza Ritorno | `borgo` | fortino | `struttura-fortino` | grande | 5×6 | (-14.5, 10) | (-9, 9) | primo: `fantasy/fortino.xml` |
| (-1, 0) | Radura Senza Ritorno | `borgo` | tempio della luna | `struttura-tempio-della-luna` | grande | 5×6 | (-9.5, 14) | (-9, 9) | gemello: `fantasy/tempio-della-luna.xml` |
| (1, 0) | Torre dell'Astrologo | `torre_mago` | torre del mago | `struttura-torre-del-mago` | grande | 7×7 | (24.5, 5.5) | (27, 9) | gemello: `fantasy/torre-del-mago.xml`, cantina |
| (0, 1) | Contrada dei Mattoni | `borgo_mattoni` | torre di guardia | `struttura-torre-di-guardia` | grande | 4×5 | (7, 26.5) | (9, 27) | primo: `fantasy/torre-di-guardia.xml`, cantina |
| (0, 1) | Contrada dei Mattoni | `borgo_mattoni` | casa del borgomastro | `struttura-casa-del-borgomastro` | grande | 5×5 | (11.5, 29.5) | (9, 27) | primo: `fantasy/casa-del-borgomastro.xml` |
| (-1, -1) | Borgo Immobile | `locanda` | locanda del cinghiale | `struttura-locanda-del-cinghiale` | enorme | 9×7 | (-10.5, -7.5) | (-9, -9) | gemello: `fantasy/locanda-del-cinghiale.xml`, cantina |
| (1, -1) | Santuario della Luna Bianca | `tempio` | santuario | `struttura-santuario` | grande | 9×8 | (26.5, -9) | (27, -9) | primo: `fantasy/santuario.xml` |
| (2, 0) | Rocca del Passo | `castello` | forte di frontiera | `struttura-forte-di-frontiera` | grande | 5×5 | (45.5, 8.5) | (45, 9) | gemello: `fantasy/forte-di-frontiera.xml` |

### orichalcum (steampunk) — 12 strutture

| luogo (cx, cy) | nome del luogo | ambiente | struttura (concetto del piano) | modello | taglia | lotto | centro del lotto (x, y) | centro del luogo (x, y) | catalogo |
|---|---|---|---|---|---|---|---|---|---|
| (0, 0) | Piazza della Pesa | `piazza_pesa` | taverna | `struttura-taverna` | grande | 4×5 | (7, 8.5) | (9, 9) | primo: `steampunk/taverna.xml`, cantina |
| (0, 0) | Piazza della Pesa | `piazza_pesa` | cattedrale degli ingranaggi | `struttura-cattedrale-degli-ingranaggi` | grande | 6×4 | (11, 8) | (9, 9) | gemello: `steampunk/cattedrale-degli-ingranaggi.xml` |
| (1, 0) | Bottega Vitti | `quartiere_telai` | palazzina degli inventori | `struttura-palazzina-degli-inventori` | grande | 5×5 | (25.5, 6.5) | (27, 9) | gemello: `steampunk/palazzina-degli-inventori.xml` |
| (0, 1) | Scalo della Ferrovia Sospesa | `scalo_ferroviario` | stazione dirigibili | `struttura-stazione-dirigibili` | grande | 6×5 | (13, 21.5) | (9, 27) | primo: `steampunk/stazione-dirigibili.xml` |
| (-1, 1) | Officine del Canale Bruma | `officine_canale` | officina | `struttura-officina` | grande | 6×5 | (-11, 25.5) | (-9, 27) | primo: `steampunk/officina.xml`, cantina |
| (1, 1) | Capannone dei Telai | `quartiere_telai` | palazzo dei meccanici | `struttura-palazzo-dei-meccanici` | grande | 6×5 | (23, 28.5) | (27, 27) | primo: `steampunk/palazzo-dei-meccanici.xml` |
| (-2, 0) | Porto dei Bastimenti | `porto_bastimenti` | osservatorio | `struttura-osservatorio` | grande | 6×5 | (-25, 3.5) | (-27, 9) | primo: `steampunk/osservatorio.xml`, cantina |
| (2, 0) | Torre d'Ormeggio di Vetta Bruna | `torre_ormeggio` | faro a vapore | `struttura-faro-a-vapore` | grande | 7×7 | (43.5, 12.5) | (45, 9) | gemello: `steampunk/faro-a-vapore.xml`, cantina |
| (-1, -2) | Cunicolo diciassette | `miniera_termale` | officina meccanica | `struttura-officina-meccanica` | enorme | 11×10 | (-8.5, -25) | (-9, -27) | gemello: `steampunk/officina-meccanica.xml`, cantina |
| (-2, 1) | Banchina del rame | `porto_bastimenti` | stazione ferroviaria | `struttura-stazione-ferroviaria` | grande | 5×5 | (-30.5, 25.5) | (-27, 27) | gemello: `steampunk/stazione-ferroviaria.xml` |
| (2, 1) | Piazzale degli aeronauti | `quartiere_mattoni` | taverna delle caldaie | `struttura-taverna-delle-caldaie` | grande | 6×5 | (40, 25.5) | (45, 27) | gemello: `steampunk/taverna-delle-caldaie.xml`, cantina |
| (2, 1) | Piazzale degli aeronauti | `quartiere_mattoni` | cattedrale | `struttura-cattedrale` | grande | 6×4 | (46, 26) | (45, 27) | primo: `steampunk/cattedrale.xml` |

### neapolis (moderno) — 14 strutture

| luogo (cx, cy) | nome del luogo | ambiente | struttura (concetto del piano) | modello | taglia | lotto | centro del lotto (x, y) | centro del luogo (x, y) | catalogo |
|---|---|---|---|---|---|---|---|---|---|
| (0, 0) | Piazza delle Erbe | `piazza` | cappella | `struttura-cappella` | grande | 6×5 | (10, 8.5) | (9, 9) | primo: `moderno/cappella.xml` |
| (0, -1) | Corso Partenope | `corso` | palazzina | `struttura-palazzina` | grande | 7×5 | (6.5, -13.5) | (9, -9) | primo: `moderno/palazzina.xml` |
| (1, 0) | Piazzale degli Uffici | `uffici` | bistrot | `struttura-bistrot` | enorme | 7×8 | (27.5, 6) | (27, 9) | primo: `moderno/bistrot.xml`, cantina |
| (-1, -1) | Pronto soccorso dei Pellegrini | `rione` | trattoria con cantina | `struttura-trattoria-con-cantina` | grande | 5×6 | (-12.5, -4) | (-9, -9) | gemello: `moderno/trattoria-con-cantina.xml`, cantina |
| (-1, -1) | Pronto soccorso dei Pellegrini | `rione` | condominio | `struttura-condominio` | grande | 6×5 | (-10, -10.5) | (-9, -9) | gemello: `moderno/condominio.xml` |
| (1, -1) | Torre C del Centro Direzionale | `uffici` | osservatorio civico | `struttura-osservatorio-civico` | grande | 5×6 | (25.5, -4) | (27, -9) | gemello: `moderno/osservatorio-civico.xml`, cantina |
| (1, -1) | Torre C del Centro Direzionale | `uffici` | torre di vetro | `struttura-torre-di-vetro` | — | 8×7 | (31, -11.5) | (27, -9) | dell’universo (T272) |
| (-1, 1) | Vico del Vesuvietto | `rione` | laboratorio | `struttura-laboratorio` | grande | 6×5 | (-5, 21.5) | (-9, 27) | primo: `moderno/laboratorio.xml`, cantina |
| (0, -2) | Ospedale del Colle | `collina` | chiesa moderna | `struttura-chiesa-moderna` | grande | 5×5 | (3.5, -27.5) | (9, -27) | gemello: `moderno/chiesa-moderna.xml` |
| (-2, 0) | Mercato del Pendino | `mercato` | mercato coperto | `struttura-mercato-coperto` | — | 6×9 | (-29, 8.5) | (-27, 9) | dell’universo (T272) |
| (2, 0) | Stazione Centrale | `stazione` | mercato a padiglione | `struttura-mercato-a-padiglione` | grande | 6×10 | (47, 12) | (45, 9) | gemello: `moderno/mercato-a-padiglione.xml` |
| (2, 1) | Officine dei Granili | `officine` | laboratorio artigiano | `struttura-laboratorio-artigiano` | grande | 7×6 | (49.5, 24) | (45, 27) | gemello: `moderno/laboratorio-artigiano.xml`, cantina |
| (1, 2) | Porto commerciale | `porto` | mercato coperto rionale | `struttura-mercato-coperto-rionale` | grande | 7×5 | (22.5, 39.5) | (27, 45) | primo: `moderno/mercato-coperto.xml` |
| (1, 2) | Porto commerciale | `porto` | torre panoramica | `struttura-torre-panoramica` | grande | 7×5 | (30.5, 40.5) | (27, 45) | primo: `moderno/torre-panoramica.xml`, cantina |

### sidera (futuristico) — 14 strutture

| luogo (cx, cy) | nome del luogo | ambiente | struttura (concetto del piano) | modello | taglia | lotto | centro del lotto (x, y) | centro del luogo (x, y) | catalogo |
|---|---|---|---|---|---|---|---|---|---|
| (0, 0) | Piazza dei Viadotti | `piazza_neon` | santuario della luce | `struttura-santuario-della-luce` | grande | 4×5 | (5, 9.5) | (9, 9) | primo: `futuristico/santuario-della-luce.xml` |
| (0, 0) | Piazza dei Viadotti | `piazza_neon` | bar orbitale | `struttura-bar-orbitale` | grande | 5×4 | (8.5, 4) | (9, 9) | gemello: `futuristico/bar-orbitale.xml`, cantina |
| (0, -1) | Ponte dei Canali | `vicoli_pioggia` | residenza modulare | `struttura-residenza-modulare` | grande | 6×5 | (14, -12.5) | (9, -9) | gemello: `futuristico/residenza-modulare.xml` |
| (-1, 0) | Scalinata dei Corrieri | `vicoli_pioggia` | scalo navette | `struttura-scalo-navette` | grande | 5×6 | (-8.5, 8) | (-9, 9) | primo: `futuristico/scalo-navette.xml` |
| (1, 0) | Vicolo delle Cuoche | `vicoli_pioggia` | stazione di transito | `struttura-stazione-di-transito` | grande | 5×6 | (22.5, 5) | (27, 9) | gemello: `futuristico/stazione-di-transito.xml` |
| (-1, -1) | Rampa dei Turni | `vicoli_pioggia` | laboratorio di fusione | `struttura-laboratorio-di-fusione` | grande | 6×5 | (-12, -14.5) | (-9, -9) | primo: `futuristico/laboratorio-di-fusione.xml`, cantina |
| (-1, 1) | Fermata del Treno Sospeso | `piazza_neon` | santuario quantico | `struttura-santuario-quantico` | grande | 5×4 | (-5.5, 26) | (-9, 27) | gemello: `futuristico/santuario-quantico.xml` |
| (-2, 0) | Spazioporto di Ponente | `spazioporto` | faro al plasma | `struttura-faro-al-plasma` | grande | 6×5 | (-24, 9.5) | (-27, 9) | gemello: `futuristico/faro-al-plasma.xml`, cantina |
| (2, 0) | Cupole di Serralta | `cupola` | la grande cupola di Serralta, vetro a spicchi su un anello di lega | `struttura-la-grande-cupola-di-serralta-v` | piccola | 2×2 | (44, 13) | (45, 9) | dell’universo (T272) |
| (0, 2) | Quartiere delle Torri | `quartiere_torri` | residenza ad anelli | `struttura-residenza-ad-anelli` | grande | 6×6 | (4, 42) | (9, 45) | primo: `futuristico/residenza-ad-anelli.xml` |
| (0, 2) | Quartiere delle Torri | `quartiere_torri` | lounge criogenica | `struttura-lounge-criogenica` | grande | 6×6 | (12, 42) | (9, 45) | primo: `futuristico/lounge-criogenica.xml`, cantina |
| (-1, 2) | Torre dei Filtri | `quartiere_torri` | faro | `struttura-faro` | grande | 6×6 | (-9, 40) | (-9, 45) | primo: `futuristico/faro.xml`, cantina |
| (-2, -2) | Cantiere della Fusione | `cantiere_fusione` | laboratorio del plasma | `struttura-laboratorio-del-plasma` | grande | 5×7 | (-26.5, -25.5) | (-27, -27) | gemello: `futuristico/laboratorio-del-plasma.xml`, cantina |
| (2, -2) | Campo dei Relitti | `relitti` | la costola ricurva di uno scafo antico, lamiere corrose | `struttura-la-costola-ricurva-di-uno-scaf` | media | 4×4 | (50, -28) | (45, -27) | dell’universo (T272) |

<!-- /strutture -->

## Cosa è stato fatto, fase per fase

**Fase 1.** `git merge origin/claude/step32-kernel-chain-cghym8` senza conflitti (`edbf404`): `KERNEL_VERSION = '0.1.5'`,
`checkKernelVersion`, `stampKernel`, `universe.json → kernel` (T260, ADR-0136) e il resto della catena Step 32. Typecheck verde.

**Fase 2.** `kernel: "0.1.5"` in `orichalcum/`, `neapolis/`, `sidera/universe.json` (`universe/universe.json` lo aveva già dal ramo):
stesso `0.1`, `Z` uguale a quello del kernel. `tests/universi-cloud.test.ts` li legge tutti e quattro con `checkKernelVersion`.

**Fase 3.**

- *Il catalogo gemello* (`origin/claude/quine42-3d-structures-catalog-3l6ejl`, unito con un merge): i suoi file comuni restano accanto ai
  primi con il suffisso `-generatore` (`catalogo-generatore.ts`, `valida-generatore.ts`, `README-generatore.md`; `scrivi.ts` e `indice.ts`
  li seguono); le tre strutture omonime hanno un altro nome: `fantasy/residenza-del-borgomastro`, `moderno/mercato-a-padiglione`,
  `futuristico/laboratorio-del-plasma`. Il catalogo ha ora 48 strutture, 12 per ambientazione.
- *I 60 modelli* (`origin/claude/markov-junior-3d-60-models-pajzz6`, `lab/banco/fauna-biomi-cloud/`): uniti senza conflitti; **non**
  registrati negli universi (la richiesta nomina strutture, seme, props e suoni; nessun luogo li userebbe ancora).
- *La registrazione* (`strumenti/integra.ts`, si può rilanciare: dà gli stessi file). In `models/` e `models/index.json` di ognuno:
  - le 12 strutture del tema con id `struttura-<ownModelId(concetto).slice(0, 30)>`, `classe: grande`, `sotto: 1` per le 6 con la
    cantina (senza, la libreria la taglierebbe: ADR-0135), e per quella Enorme `taglia: enorme`, `vpt: 16` (`modelSize`: la taglia di una
    struttura è del suo modello). Il concetto è il nome del file in parole (`torre-del-mago` → «torre del mago»), tranne
    `moderno/mercato-coperto` → «mercato coperto rionale», perché neapolis ha già il suo `struttura-mercato-coperto`;
  - i modelli procedurali del seme (T270) **al posto** delle copie del seme che l'universo aveva (tutte identiche al seme), con la voce che
    resta (nome, tinta) e `autore` nuovo; il `voto` dell'Artista, che era del modello vecchio, va via. Sono 23 su 24: **`grande`** (la casa
    a graticcio, la casa comune di aurora) resta la vecchia, per il difetto del kernel descritto sotto. Sidera ne aveva 10 su 24 (aveva tolto
    gli altri): 9, gli stessi meno `grande`;
  - i 10 props del tema (T270);
  - i 6 brani del tema e i 19 effetti (T271). Dove suona ogni brano (`suono.ambienti`, `momenti`) è in `strumenti/cloud.ts → MUSICA`: chi
    nomina un ambiente esattamente suona lì, l'ultimo dell'indice per primo, quindi ogni brano prende pochi ambienti e lascia gli altri alla
    musica che l'universo aveva;
  - la Morte rifatta (`suono-effetto-morte-v2`) **accanto** alla vecchia, dopo di lei nell'indice: `effectProgram` suona la prima che
    nomina l'effetto, quindi suona ancora quella del seme. La vecchia dà la stessa partitura a ogni seme (`modelErrors` la rimanda come
    `ripetitivo`), ma l'autore l'ha scelta a orecchio e i test lo dicono (`SOUNDS_KEPT_BY_THE_AUTHOR` in `tests/helpers.ts`: «per cambiarla,
    chiedi all'autore»): per sentire la nuova basta spostarla prima della vecchia in `models/index.json`, o togliere `morte` alla vecchia.
    Nel seme la musica di T224 resta dove i suoi test la vogliono (`borgo`, `campi`, `bosco` di giorno, `castello`, `dungeon`): i brani fantasy
    prendono `locanda`, `borgo_mattoni`, `tempio`, `piramide`, `fortezza`, `caserma`, `tana_drago`, `rovine`, `montagne` e `deserto`, e di notte
    `bosco`, `giungla`, `montagne`, `deserto`.
- *Sidera*: non aveva `commonHouse`, quindi i suoi lotti comuni erano le casette e le case a graticcio del seme in una città di lega. Ora
  il terreno dice «moduli abitativi di lega bianca…» e le case comuni sono `casa-comune-edificio-052c7ac8` (il suo `sidera-modulo-abitativo`)
  e `casa-comune-grande-052c7ac8` (la `residenza-modulare` del gemello). Le due strutture che i suoi piani nominavano senza modello (la cupola
  di Serralta e la costola dello scafo, che sarebbero andate allo Scultore) hanno ora il modello: i suoi `sidera-cupola` e `sidera-relitto`.
- *Le copie del seme* di `modules/core.effects/logic.lua` e `prompts/agents/ingegnere.md` nei tre universi Cloud seguono il seme cambiato da
  T260 (l'effetto senza chi lo applica è un guasto): erano le copie del seme di prima, e la quarta parete di orichalcum le guarda solo quando
  differiscono dal seme.
- *I luoghi*: le strutture vanno sui lotti dei `maps/*.json` come il kernel li costruisce (`strumenti/cloud.ts → lotti`: `layoutOf` +
  `lotsOf`, puri), i più grandi per primi; «grande» solo su un lotto il cui lato più lungo è almeno 5 (la regola di `lotsOf` e
  `claimSizes`), «enorme» su uno solo per zona (`IMPORTANT_ZONE`: i 19 luoghi sono tutti nella zona 0,0) di lato almeno 8 (la scatola Enorme
  è 7,5 caselle: su 7 `claimSizes` la riporterebbe a Grande), scelto fra quelli col lato corto più lungo. Ognuna va dove le parole del luogo
  le somigliano di più (ambiente, nome, descrizione: una taverna in un quartiere, un faro in un porto), poi la più vicina alla partenza, al più
  due per luogo e mai due dello stesso tipo nello stesso luogo. Le strutture proprie di neapolis e sidera restano prime nei loro luoghi.
  Sidera non ha lotti di lato 8: niente Enorme.
- *Aurora* non ha mappe sue (il seme non ne ha): i 19 luoghi attorno alla partenza sono pianificati una volta dal Cartografo offline
  (`MockAiModels`) e tenuti in `aurora/maps/`, senza `fresh` (la Fucina non parte) e con a terra solo oggetti che il mondo conosce. Quattro
  luoghi che il Cartografo offline lasciava senza lotti sono scritti a mano in ambienti del seme con i lotti: (1, -1) «Santuario della Luna
  Bianca» (`tempio`), (1, 0) «Torre dell'Astrologo» (`torre_mago`), (2, 0) «Rocca del Passo» (`castello`), (0, 1) «Contrada dei Mattoni»
  (`borgo_mattoni`). **Le mappe di aurora non stanno in `universe/maps/`**: `upgradeFromSeed` le scriverebbe in ogni `universes/aurora/` già
  esistente (lo snapshot non porta `maps/`, quindi il seme le vedrebbe sempre come nuove) e sovrascriverebbe i luoghi che l'autore ha già.

**Fase 4.** Vedi sotto.

## Verifiche (tutte offline)

Tutte con `MockAiModels`, nessuna chiave letta, sul kernel `0.1.5`.

| cosa | comando | esito |
|---|---|---|
| versione del kernel dei 4 universi | `tests/universi-cloud.test.ts` (`checkKernelVersion`) | 4/4 compatibili (`0.1.5`) |
| ogni modello delle 4 librerie nella scatola in cui la libreria lo fa girare (`erroriModello` in `strumenti/cloud.ts`: classe, taglia, cantina) | `modelErrors` | 553 modelli (127 + 151 + 148 + 127): 549 senza un errore; gli altri 4 sono la Morte del seme (`ripetitivo`), una per universo, scelta dell'autore che i test tengono (`SOUNDS_KEPT_BY_THE_AUTHOR`) |
| le strutture dei piani: dal modello della libreria (`forms.resolve(own, 'grande') === own`), `validatePlan` senza errori né scarti, `lotsOf` senza `wanted`, `claimSizes` non cambia niente, ogni struttura del tema su un lotto | `tests/universi-cloud.test.ts` | verde |
| l'installazione su una cartella temporanea: 4 repository, un commit `genesi:`, albero pulito, saldi sigillati, `upgradeFromSeed` non ha più niente da fare, la seconda volta il vecchio va nel cestino | `tests/universi-cloud.test.ts`, e a mano `npm run universi:cloud -- --dir <tmp>` | verde |
| orichalcum, neapolis, sidera da capo a fondo (600-900 tick, ogni modulo, rune, società, quarta parete) | `npx vite-node lab/banco/universi-cloud/<nome>/verifica.ts` | verdi tutte e tre: 0 fault visti e alla fine, nessun problema (dopo che le loro copie del seme di `core.effects` e del prompt dell'Ingegnere hanno seguito il seme di T260: prima la quarta parete di orichalcum le leggeva come testi suoi) |
| le strutture sul kernel vero, come le installa lo script: i 19 luoghi visitati, 600 tick, la forma di ogni struttura costruita (voxel, cantina sotto terra), nessun `wanted` | `npx vite-node lab/banco/universi-cloud/strumenti/verifica-strutture.ts` (scrive `verifica-strutture.json`) | verde: aurora 12, orichalcum 12, neapolis 14, sidera 14 strutture costruite, con la cantina dove il programma la ha; 0 fault, 0 `wanted` |
| typecheck | `npm run typecheck` | verde |
| i test toccati | `npx vitest run tests/universi-cloud.test.ts tests/kernel-version.test.ts tests/forms.test.ts tests/lots.test.ts tests/sound.test.ts tests/sounddirector.test.ts tests/soundanalysis.test.ts lab/tests/banco.test.ts` | verdi (262 test) |
| la suite intera | `npm test` | 2201 passati, 3 saltati, **4 caduti, tutti dell'ambiente di questo clone e caduti uguali sul commit di partenza (`608b0a3`)**: V-006 e V-007 di `tests/sicurezza/` (`fsync API is disabled when Permission Model is enabled`, Node 22 del contenitore, come in T269) e due casi di `tests/espressivita/aggiunte.test.ts` (`7ced571`, `0d773f2`: il clone è superficiale e quei commit non ci sono). V-016 cadeva per questo lavoro (vedi sotto) e ora passa |

I test cambiati e perché: `tests/forms.test.ts` giudica ogni modello del seme nella scatola della libreria (le strutture del catalogo non
scrivono `size`: la cantina e la taglia le dà la libreria, ADR-0135), con un tempo più lungo; `tests/fixtures/griglie-visive.json` ha le griglie
dei 23 programmi del seme cambiati (gli altri 34 danno le stesse: il motore è lo stesso); `lab/tests/banco.test.ts` misura il banco sulla casa
e sulla fattoria di prima (`lab/tests/fixtures/`), perché le loro proprietà erano del programma vecchio; `tests/sounddirector.test.ts` e
`tests/soundanalysis.test.ts` contano i suoni del seme (13 brani, 29 effetti); `tools/sicurezza/ambiente.mjs` dà a `git` 256 MB di uscita: il
seme ora pesa 2 MB e `git log --all -p` di un universo passava il MB di `execFileSync` (V-016).

## Un difetto del kernel che le strutture mostrano (non corretto qui)

Ciò che il piano mette «dentro» una struttura (`placeInside`) va in un punto del pavimento che `interiorPoints` trova sgombro (niente
`foot` nei ±6 voxel, pavimento non più alto di un gradino), ma che `kernel.free(x, y, 0.15)` può trovare bloccato: è `formBlocks`, non le
caselle (contati sui 4 universi installati, punti bloccati su punti trovati). Per la casa a graticcio del seme: **21 su 32 la vecchia, 15 su
15 la procedurale**, a yaw 0 (girata di −π/2, 0 su 32 e 0 su 15); per le strutture del catalogo da 10 su 59 a 61 su 128, a ogni rotazione;
per la casa comune grande di orichalcum (T272) 34 su 800. `tests/lots.test.ts` («never inside its walls») passava con la casa vecchia perché i
suoi quattro tiri cadevano su punti sgombri, e cadrebbe con la nuova: per questo `grande` resta la vecchia (`SEME_TENUTI` in
`strumenti/cloud.ts`). Toccare `src/kernel/` voleva dire alzare `KERNEL_VERSION` in un compito di integrazione, ed è fuori da questo:
**da fare in un task del kernel** (guardare se `interiorPoints` e `formsUnder`/`rampBlocks` usano la stessa rotazione e lo stesso livello: senza
`z`, `free` misura al suolo un pavimento rialzato), poi togliere `grande` da `SEME_TENUTI` e rilanciare `integra.ts`.

## L'integrazione su Windows (T279, 05/11)

- `new URL(…, import.meta.url).pathname` su Windows dà `/H:/…`: lo script si fermava con `H:\H:\…`. Ora gli strumenti del banco usano `fileURLToPath`.
- Installati con `--dir` su una cartella temporanea e copiati in una `universes/` del worktree, che non esisteva, poi tolta: niente nel cestino, `universes/` dell'autore non toccata.
- Visti nel browser, sulla preview della build, con `?universo=<nome>&skip&offline`, 0 guasti, kernel `0.1.5`: aurora (locanda, fucina nanica), orichalcum (taverna, cattedrale degli ingranaggi), neapolis (cappella), sidera (santuario della luce, bar orbitale; in Chrome headless). Finché il worker non finisce, una struttura è un blocco scuro: il primo caricamento di un universo ha chiesto 30-40 secondi nella scheda.
- Il resto dell'elenco qui sotto resta non provato, tranne la suite intera, che su Windows è verde. Interni, cantine, scale e la taglia Enorme non sono stati guardati.

## Cosa non ho provato

- **Il browser**: nessuna partita vera, nessuno screenshot. Le strutture sono costruite dal kernel (le forme dei loro programmi, con la
  cantina sotto terra) ma non le ho viste disegnate: interni, tetto che si apre entrando, porta verso il sentiero e scale sono quelle dei
  programmi già misurati da T269 e dal gemello, non guardate qui. Da guardare in locale con le coordinate della tabella.
- **`npm run universi:cloud` su `universes/` vero**: nel clone non c'è; l'ho eseguito su una cartella temporanea (e lo fa il test).
- **L'ascolto** dei brani e degli effetti (T271 dice lo stesso); i 19 effetti nuovi non hanno ancora un momento del gioco che li chiami
  (`SOUND_CUES` ne ha 9: runa, oggetto, arpeggio, incantesimo, guasto, ritorno, soglia, salto, morte), stanno nella libreria e il Musicista li
  vede fra gli effetti noti. Suonano davvero i 6 brani (negli ambienti di `MUSICA`); la Morte rifatta aspetta l'orecchio dell'autore.
- **I props** sono nella libreria (la Galleria dell'Artista nello studio li mette sugli scaffali, `models/` → `galleria`), ma nessun luogo
  li mette in scena: servirebbero moduli che li usano come aspetto.
- **La suite intera** di `npm test`: vedi sopra cosa ho fatto girare.
- **Online**: con Gemini il Cartografo scrive i luoghi nuovi oltre i 19 e potrebbe chiedere altre strutture; quelle del catalogo le trova
  già se il concetto coincide.

## Sul kernel delle imprese (T280, kernel `0.1.9`)

Le verifiche di orichalcum, neapolis e sidera restano verdi, 0 fault, ma questi tre universi **non hanno `sys.lavoro` né i programmi `lavoro.*`**: `jobPrograms()` è vuoto, nessuno lavora, nessuna squadra. Ciò che cade fa un'impresa `ferma` per sempre: il lotto resta ai picchetti (misurato: nove giorni dopo, `lavorato` 0). Gli stessi moduli del seme non bastano: con l'innesto i programmi validi sono 6, 6 e 5, e le persone con un programma 0/24 in orichalcum, 4/24 in neapolis, 3/24 in sidera, perché i mestieri di questi mondi non si chiamano così (fuochista, barista, xenobotanica…), e `item.grano` e `item.pesce` mancano. Servono programmi dei loro mestieri. Aurora è il seme: li ha.

## I mestieri dei tre universi (T298)

Ognuno dei tre ha ora `modules/sys.lavoro/` (il sistema del seme, copiato com'è: così gli arrivano gli aggiornamenti del seme) e i suoi
programmi `modules/lavoro.<mestiere>/`, uno per mestiere, nel suo tema (ADR-0140, ADR-0141). Nessun file del kernel è cambiato.

| universo | programmi | persone con un programma | animali (senza) | chi fa i materiali delle case | oggetti nuovi |
|---|---|---|---|---|---|
| orichalcum | 9: `fabbro` (colatrici, fonditori, capo forno), `caldaista`, `orologiaio`, `minatore`, `ferroviere`, `aeronauta`, `tessitore`, `giornalaio`, `guardia` | **22/22** | 2 gatti | `fabbro` (travi e ribattini), `caldaista` (ribattini) | `item.ciocco` «Trave di ghisa», `item.chiodi` «Ribattini d'ottone», `item.telo-canapa` |
| neapolis | 12: `fabbro` (meccanici), `portuale`, `elettricista`, `barista`, `cuoco`, `pizzaiolo`, `medico`, `giornalista`, `edicolante`, `autista`, `guardia`, `impiegato` | **22/22** | 2 gatti | `portuale` (tufo e bulloni scaricati), `fabbro` (bulloni) | `item.ciocco` «Blocco di tufo», `item.chiodi` «Bulloni da carpenteria» |
| sidera | 13: `fabbro` (ingegneri di fusione, tecnici, riparatori), `xenobotanico`, `alghicoltore`, `recuperatore`, `minatore`, `navigatore`, `pilota`, `medico`, `sintetista`, `cuoco`, `corriere`, `venditore`, `guardia` | **23/23** | 1 corvo | `fabbro` (pannelli e rivetti), `recuperatore` (pannelli dalla lamiera dei relitti) | `item.ciocco` «Pannello di lega», `item.chiodi` «Rivetti magnetici», `item.alghe` |

Gli altri prodotti sono oggetti che gli universi avevano già (minerale rosso, ingranaggi, tazzine, ragù, pizza, pratiche, frutti di vetro,
polvere di cristallo, carte delle rotte, siero…): ciò che un mestiere porta in piazza va nel deposito del suo luogo, e i luoghi che nessuno
guarda lo riempiono una volta al giorno (ADR-0149). Una casa da rifare chiede `item.ciocco` e `item.chiodi` (`housePhases`, del kernel):
qui hanno il nome di ogni mondo. Il capomastro è il programma `fabbro` di ogni universo (`HOUSE_ROLES`).

Sidera ha due caselle nuove nel suo terreno (`world.terreno-sidera`): `u` vasca seminata, che in un giorno matura in `y` vasca in frutto.
Gli xenobotanici seminano le vasche idroponiche (`m` → `u`) e raccolgono i frutti di vetro (`y` → `m`): è un raccolto anche per la regola
del kernel (ADR-0147), che una volta all'anno fa nascere la mietitura dove ci sono almeno quattro vasche. Orichalcum ha già tutte le 26
lettere del terreno occupate e i suoi mestieri non seminano; neapolis non coltiva.

Le parole dei mestieri: ogni persona ha il suo mestiere per intero tra i `nomi` («capo della gilda dei caldaisti», «impiegato dell ufficio
appalti»: `normalTrade` toglie gli apostrofi), più le parole generiche del mestiere; un nome sta in un solo programma. Alcune parole dei
modelli offline (contadina, fornaio, locandiera, tessitrice, pescatore) sono in un programma vicino, così anche gli individui che il Narratore
offline mette nei luoghi oltre i 19 lavorano. Gli animali non hanno un programma di proposito: una squadra prende chiunque ne abbia uno,
e un gatto al cantiere sarebbe un manovale; manca una primitiva per un mestiere che non fa squadra (scritto nell'esito del task).

**Verifica** (`tests/mestieri-cloud.test.ts`, sul `Kernel` vero, con i file come li installa `componi`, solo `MockAiModels`): ogni persona
con un mestiere ha un programma valido, gli animali no, i testi passano `metaBreak`; poi, in un luogo per universo (orichalcum `0,-1` le
Fonderie Ramelli, neapolis `1,2` il Porto commerciale, sidera `-2,-2` il Cantiere della Fusione), otto giorni fuori vista riempiono il
deposito, una giornata di lavoro a vista (i compiti, ciò che si fa, il deposito che cresce la sera), un edificio che crolla: l'impresa nasce
con una squadra del posto (orichalcum Nives, Raniero, Fosca; neapolis Gennaro, Salvatore, Lucia; sidera Ottone, Greta, Ugo), porta dal
deposito e lavora a vista, poi fuori vista sale 0,2 → 0,7 → 0,9 → 1 e al ritorno è intero. Fra 2200 e 3800 tick per universo, 0 fault.
Le tre `verifica.ts` restano verdi (orichalcum conta ora 34 moduli nuovi; neapolis valida anche i programmi e lascia `sys.lavoro`, testo
della Sala sistemi, fuori dal controllo della quarta parete).

Un limite del kernel, visto qui: un luogo carica al più `NPC_CAP` (2) individui dello stesso modulo, e i luoghi che il Cartografo offline fa
intorno ne usano di quelli; arrivando da lontano, gli abitanti scritti di un luogo possono restare fuori (al Porto commerciale, i due
portuali erano di due luoghi offline). Il test alza `NPC_CAP` per sé; nel gioco è la regola di varietà di sempre.

**Nel browser** (preview della build, sidera installato in una cartella `universes/` del worktree e poi tolto, `?offline`; catture in
`catture-t298/`): alle Cupole di Serralta Iris e Tobia seminano quattro vasche il primo giorno, il giorno dopo sono `y` e le raccolgono
(frutti di vetro nel carico); al Cantiere della Fusione il laboratorio del plasma crollato mostra picchetti e corda, il pannello del cantiere
dice «4 × Pannello di lega, 8 ore di lavoro», poi a muri con le impalcature (0,7), poi di nuovo intero con le luci. 0 fault.

Un caso che il browser ha mostrato e il test no: in un mondo appena nato il deposito del Cantiere della Fusione è vuoto, e i soli che lì
fanno pannelli (Ottone e Greta) sono nella squadra, quindi fuori vista non producono (ADR-0149: chi è in un'impresa non riempie il deposito)
e l'impresa fuori vista prende solo dal deposito del suo luogo: resta «in attesa». A vista porterebbero dai depositi dei loro luoghi, ma i
loro corpi non c'erano (`NPC_CAP`). Si sblocca quando qualcuno porta ciò che serve (il viandante col pulsante, come nella prova), o se il
mondo è vissuto qualche giorno prima del crollo (il test). È una regola del kernel, non dei programmi: scritto nell'esito.
