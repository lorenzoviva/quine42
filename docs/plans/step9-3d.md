# Step 9 — Piano del passaggio al 3D

Richiesta: [`docs/userchats/step9-3d.md`](../userchats/step9-3d.md). Decisione: [ADR-0037](../adr/0037-passaggio-al-3d.md).
Branch: `3d`, partito da `worktree-step8.2A-lab3d` (commit `2832382`, step 8.2C).

Questo file è il piano **e** il diario dello step: ogni fase dice cosa era previsto e, una volta fatta, cosa è
stato fatto davvero e cosa è cambiato rispetto al previsto (sezione «Fatto» in fondo a ciascuna).

Stato di partenza verificato: `npm test` 13 file, 155 test verdi (38 s); `npm run typecheck` pulito.
Tempi di MarkovJunior (`lab/scripts/mjx-stats.ts`, un core): casa 72×72×90 in 131 ms (+95 ms di mesh),
fattoria 100×100×80 in 1,2 s, alberi 7-99 ms, persone e oggetti 0-10 ms. Il kernel può quindi eseguire i
modelli **in linea** in Node (test) e **nei worker** nel browser, senza materializzare voxel di chunk.

---

## 1. Principi

1. **Il kernel resta il pavimento e resta in caselle.** Le posizioni dei corpi sono già continue (in caselle);
   la casella resta la scala del **piano** (terreno, luoghi, rune, sentieri). Cambia ciò che sta sopra: un
   modello MarkovJunior con posizione e rotazione libere, con collisione e pavimenti dai suoi voxel.
2. **Un solo MarkovJunior.** Il motore 3D e il front-end XML del laboratorio diventano codice del gioco in
   `src/mj/` (puro: niente DOM, niente three.js), usato da kernel, worker, renderer e laboratorio.
3. **Nessuna immagine generata.** Il modello di immagini sparisce dalla configurazione e dal codice. Le icone
   sono fotografie dei modelli fatte dal renderer, gratis.
4. **Ogni fase finisce verde** (`npm test`, `npm run typecheck`), con il gioco che parte e un commit.

## 2. Inventario: cosa si toglie, cosa resta, cosa si riscrive

### Si toglie (2D e immagini)
| file | perché |
|---|---|
| `src/render/renderer.ts` (1650 righe) | canvas 2D: chunk come immagini, texture procedurali, ostacoli, sprite, camminate, tetti, studio disegnato; sostituito da `src/render/` in three.js |
| `src/render/imagetools.ts` | scontorno, magenta, `keyAndFit`, `ImageCache` delle immagini dipinte |
| `src/kernel/imaging.ts` | interfaccia `ImageTools` (taglio dei fogli, misure degli sprite) |
| `src/kernel/art.ts` | l'ArtDirector che dipinge texture, ostacoli, sprite, camminate, icone |
| `src/kernel/agents/atelier.ts` | few-shot di immagini, camminate, fogli di icone |
| `src/kernel/assets.ts` (parte immagini), `UniverseAssets`/`IdbAssets` | archivio delle immagini (`assets/`); i chunk restano (`ChunkStore`) |
| `Models.image()`, `ImageCall`, `canPaint`, `imageModel`, `maxImages`, `animation` | nessuna chiamata di immagine nel gioco |
| `Appearance.sprite/frames/imagePrompt/scale`, `TileDef.texture/sprites`, `ItemDef.icon/iconPrompt` | campi del 2D; i manifest vecchi si leggono ancora (i campi si ignorano) |
| `world/atelier.json`, la sezione `PERSPECTIVE` della guida di stile | coppie few-shot e prospettiva delle immagini |
| `render/glitch.ts` (versione canvas) | rifatto come effetto sopra la scena 3D |

### Resta com'è (concetti di gioco, logica nel kernel)
Tappeto, corona (logica), rune e magia, Concilio e registro, società, trame e missioni, inventario e borse,
effetti, regole, due tavoli e quarta parete, rollback, repository dell'universo, sandbox Lua e `Host`, ECS,
validatore (meno le parti grafiche), `layout.ts` e `mj.ts` a scala di casella (vedi D4), atlante, timbri,
`society.ts`, `plots.ts`, `inventory.ts`, `runes.ts`, `content.ts`, `repo.ts`, `universes.ts` (senza assets),
server (`geminiProxy.ts`, `universeStore.ts`), UI testuali (`chat`, `editor`, `console`, `feed`, `actions`, `atlas`).

### Si riscrive
| parte | come |
|---|---|
| `src/kernel/kernel.ts` (4009 righe) | via `art`, `imageTools`, `requestRepaint` → `requestResculpt`; `glyphOf` → aspetto con modello; nuovi: libreria dei modelli, forme (`Forms`: griglia, impronta, pavimento, azioni), collisione dai voxel in `free/freeReal`, strutture sui lotti, azioni del modello nel menu, registro dei consumi |
| `src/kernel/agents/*` | `forge.ts` (via l'Atelier; il concetto chiede la classe e lo Scultore fa il programma), `genesis.ts` (via stile per immagini, sì modelli per terreni e cast), `content.ts` (le `ItemDef` hanno `model`), `council.ts` (via `image()`; lo Scultore entra), nuovo `sculptor.ts` (Scultore + Artista giudice), `cartography.ts` (lotti e ancore), `minds.ts` (Referente: «riscolpisci») |
| `src/kernel/ai/*` | `gemini.ts` (ragionamento `low`, niente ripetizioni dopo un tempo scaduto, conta ragionamento e cache, modello per chiamata), `prices.ts` (nuovo, dal laboratorio), `usage.ts` (registro dei consumi), `mock.ts` (programmi scritti a mano per lo Scultore, voti per l'Artista) |
| `src/kernel/corona.ts` | la Galleria dell'Artista espone **modelli** (non quadri); lo Studio del Cartografo i terreni con il loro modello |
| `src/render/` | nuovo: `scene.ts` (three.js, camera 3/4, luci, giorno e notte), `terrain.ts` (chunk come mesh), `things.ts` (modelli, arti, vento, animazioni), `forms.ts` (worker), `worker.ts`, `overlay.ts` (fumetti, rune, passaggio del mouse, glitch), `corona3d.ts` (corona e studio dalle celle), `thumbs.ts` (icone dai modelli) |
| `src/ui/hud.ts`, `inventory.ts`, `studio.ts`, `genesis.ts`, `feed.ts` | icone dai modelli; la galleria mostra il modello e «Riscolpisci»; testi senza immagini; costo in dollari nel pannello del Concilio |
| `index.html`, `style.css` | il canvas WebGL e uno strato sopra per fumetti e rune |
| `universe/` | seme nuovo (nome nuovo), `models/` con i programmi del seme, manifest con `appearance.model`, terreni con `model`, niente `atelier.json` |
| `lab/` | laboratorio di MarkovJunior (vedi D1); via ciò che è superato |

## 3. Decisioni di questo piano (mie; dimmi se una non va)

- **D1 — Il laboratorio resta, come laboratorio di MarkovJunior.** Serve a ciò che il gioco non fa: leggere un
  programma che lo Scultore non riesce a scrivere, eseguirlo passo per passo, guardarne le sezioni, correggerlo
  e provarlo nella sandbox, e rifare le prove dei modelli Gemini con i contatori. Toglierlo vorrebbe dire
  rifare questi strumenti al primo programma difficile. Resta: `lab/3d` (sandbox, ora su `src/mj`),
  `lab/mjx/official` + i test di conformità, `lab/mjx/models` (esempi e prove), gli script `mjx-*`, `costs-history`,
  `game-requests`. Si toglie: la pagina `/lab/` dei blocchi (`lab/main.ts`, `index.html`, `lab.css`, `worker.ts`),
  `mj3d/{architect, commission, composite, structure, wfc, examples, sculptor, targets, mock}`, `lab/programs/`,
  i prompt `architetto blocchi scultore` (JSON), gli script dei blocchi e degli sprite, `mjx/convert.ts` (la
  conversione è fatta), `mj3d/meter.ts` e `prices.ts` (passano al kernel). Il motore, il front-end XML,
  la mesh, le classi, le foto e il controllo passano in `src/mj/`.
- **D2 — Gli universi 2D** (`universes/valmora`, `valmora copy 2`, `valmora new`, 232 MB, nella cartella del
  checkout principale) vanno in `H:/projects/rune-backup/universi-2d/` (fuori dal progetto), spostati e non
  copiati, dopo aver verificato che la copia è integra (numero di file e dimensione). Il seme del 3D ha un
  **nome nuovo** (`aurora`), così il gioco 2D su `main` e quello 3D non si toccano mai lo stesso universo.
- **D3 — Una scala di griglie (proposta C).** Regione (atlante) → piano del Cartografo a scala di casella →
  modello a 20 voxel per casella → corpi continui. I chunk restano 18 × 18 per generare, caricare, salvare.
- **D4 — Il piano resta il MarkovJunior a caselle di oggi** (`src/kernel/mj.ts`, programmi JSON degli
  ambienti, timbri). Nello step 9 non lo porto all'XML: è la scala del *piano*, non dell'aspetto, funziona, ha
  20 ambienti nel seme e un prompt del Cartografo collaudato. Cambia ciò che il piano produce: gli edifici
  riconosciuti (`findBuildings`) diventano **lotti** e la porta del lotto è l'**ingresso**; il Cartografo
  sceglie per ogni lotto la struttura (o la chiede alla Fucina) e mette **ancore** (cosa, dentro/fuori, vicino a
  cosa). Unificare il piano con l'XML 2D è un passo successivo (lo scrivo in AGENTS.md).
- **D5 — Collisione.** Il terreno resta a caselle (acqua, roccia, muri fuori dai lotti, vegetazione fitta:
  `solid` del `TileDef`); i modelli bloccano con i loro voxel (le colonne solide all'altezza del corpo) e
  danno il pavimento (soglie e pavimenti fino a 0,2 caselle), come nella sandbox. Finché la forma di un
  modello non è pronta, blocca il suo raggio (`physics.radius`) o, per una struttura, l'intero lotto.
- **D6 — Le rune restano una per casella**, sulla griglia del piano: lastre luminose a terra, righe
  orizzontali eseguite; il tappeto è il disco di caselle attorno al centro. Le regole del linguaggio non cambiano.
- **D7 — Il menu delle caselle diventa il menu di ciò che si guarda**: tasto destro (o `E` davanti) sceglie
  con un raggio il modello colpito; il menu ha le azioni dell'entità, le azioni del modello (`<action>`, «Apri
  la porta») e «Altro…»; se il raggio colpisce il terreno, il menu è quello della casella (con le azioni
  imparate dal terreno).
- **D8 — La corona e lo studio** restano logica del kernel (celle, edifici, piani, scaffali, teletrasporti) e si
  vedono in 3D costruiti dalle celle (muri estrusi, scaffali, file come volumi colorati, portali luminosi). La
  Galleria dell'Artista espone i modelli su piedistalli; «ridipingi» diventa **«riscolpisci»**.
- **D9 — Libreria dei modelli nell'universo**: `models/<id>.xml` (il programma, con il commento che dice chi
  l'ha scritto e con che voto) e `models/index.json` (classe, nome, autore, modello Gemini, voto, costo). Un
  programma per tipo; un'istanza è un seme. Manifest: `appearance.model` (+ `classe`); `ItemDef.model`;
  `TileDef.model` (ciò che sta sulla casella: alberi per il bosco, massi per la roccia). Un riferimento a un
  modello che non c'è usa il programma generico della classe (scritto a mano nel seme) finché lo Scultore non
  lo scrive.
- **D10 — Lo Scultore per classe** (report 8.2B): `gemini-3.1-flash-lite` per vegetazione, rocce, oggetti e
  mobili, **due programmi indipendenti** e l'Artista sceglie il migliore; `gemini-3.8-flash` per persone,
  animali e strutture, con un giro di revisione guidato dall'Artista; `gemini-4-argon` solo per le strutture
  `importante` (al massimo 3 per mondo, quelle che la Genesi segna come luoghi notevoli) e solo prima del
  1/12/2026 (poi il prezzo raddoppia: torna a 3.8). Ragionamento `low` in ogni chiamata. L'Artista
  (`gemini-3.5-flash` come nelle prove, configurabile) guarda quattro foto del modello (render software,
  `src/mj/photo.ts`) e dà voto, problemi, consigli.
- **D11 — Costi.** `src/kernel/ai/prices.ts` è l'unico file dei prezzi (con la data di lettura); `GeminiModels`
  conta prompt, cache, risposta e ragionamento, non ripete dopo un tempo scaduto (né dopo un errore di rete),
  ripete solo 429/5xx con risposta del server; il kernel tiene `world/consumi.json` (per giorno → modello →
  compito: chiamate, token, dollari) e il pannello del Concilio mostra il costo della sessione e del giorno.
- **D12 — Nessun pathfinding nuovo nello step 9**, salvo che serva: gli NPC si muovono come oggi
  (`sys.wander` con `world.free`), e `world.free` ora vede i voxel. Se si incastrano nelle case, una griglia di
  navigazione a mezza casella dalle impronte (rischio R4).

## 4. Fasi

Ogni fase: test e typecheck verdi, il gioco parte (`npm run build && npx vite preview`), un commit.

### F0 — Piano (questo file)
ADR: nessuno. AGENTS.md: rimando a questo piano in «Stato e prossimi passi».

### F1 — MarkovJunior nel gioco (`src/mj/`) e laboratorio in ordine
- `lab/mj3d/engine.ts` → `src/mj/engine.ts`; `lab/mjx/{xml,model,palette,run}.ts` → `src/mj/`;
  `lab/mj3d/animate.ts` (rig) → `src/mj/rig.ts`; `lab/3d/mesh.ts` → `src/mj/mesh.ts`; `lab/mj3d/scale.ts` →
  `src/mj/classes.ts`; `lab/mj3d/render.ts` → `src/mj/photo.ts`; `lab/mj3d/check.ts` (analisi) → `src/mj/check.ts`.
- Il laboratorio importa da `src/mj/` (mai il contrario); via le parti superate (D1).
- I test di conformità (`lab/tests/mjx.test.ts`, modelli ufficiali) restano identici: cambiano solo i percorsi
  degli import. Via i test di blocchi, WFC, commissione.
- Gioco: invariato (2D). ADR-0038 «Laboratorio di MarkovJunior; il motore nel gioco» (sostituisce per il
  laboratorio 0031-0035). AGENTS.md: Struttura, laboratorio.

### F2 — Costi sotto controllo
- `src/kernel/ai/prices.ts` (dal laboratorio), `src/kernel/ai/usage.ts` (registro), `GeminiModels` (D11),
  `TextCall.model` (modello per chiamata) e `ai.models` nella configurazione (testo, scultore per classe,
  artista); consumi salvati in `world/consumi.json` a ogni commit e alla chiusura; costo nel pannello del Concilio.
- Gioco: invariato (2D), con il costo visibile. ADR-0039 «Registro dei consumi e chiamate senza sorprese».
  AGENTS.md: Stack, Costi e prestazioni.

### F3 — Il kernel senza immagini
- Via ArtDirector, Atelier, `image()`, `imageTools`, campi grafici dei tipi (lettura tollerante dei manifest
  vecchi), `imageModel/maxImages/animation`; la Genesi non scrive più la guida di stile per le immagini (la
  guida di stile resta, per lo Scultore: colori, materiali, proporzioni); il validatore non chiede più
  `imagePrompt`. Il renderer 2D continua a disegnare (texture procedurali e glifi, come offline).
- **Il gioco resta 2D ma senza pittura** per questa fase.
- ADR: parte di 0040. AGENTS.md: Concilio (Artista), Costi.

### F4 — Il renderer 3D
- three.js con camera 3/4 (come la sandbox: Q/R ruotano a scatti di 45°, rotella zoom), HUD e pannelli sopra.
- Terreno: un mesh per chunk (colore del `TileDef`, acqua più bassa, sponde), in coordinate del tappeto come
  nel 2D; corpi e oggetti con un segnaposto per classe finché non hanno il modello (F5); rune come lastre
  luminose; fumetti, nomi e passaggio del mouse in uno strato sopra; giorno e notte dal `daylight()`; luci dai
  componenti `luce`; il glitch come effetto sullo strato sopra e sul colore della scena.
- Corona e studio dalle celle (D8); picking con un raggio (D7, il menu resta quello delle caselle).
- Via `renderer.ts`, `imagetools.ts`, il canvas 2D. **Gioco giocabile in 3D, con segnaposto.**
- ADR-0040 «Il gioco è 3D: renderer three.js, niente immagini» (sostituisce 0011 per la resa, 0013 e 0017
  per la parte grafica, 0030). AGENTS.md: Stack, Architettura (Mappa, Prospettiva), Comandi, Struttura.

### F5 — I modelli come aspetto
- Libreria `models/` (D9); `appearance.model`, `ItemDef.model`, `TileDef.model`; programmi del seme dal
  laboratorio (persone, animali, alberi, rocce, cespugli, barile, falò, pozzo, casa, casetta, fattoria, fontana,
  torre) più quelli che mancano scritti a mano (letto, banco, credenza, cassa, forbici e oggetti generici).
- `Forms` (kernel): richiesta di una forma (programma, seme, scatola) → griglia, impronta, pavimento, azioni;
  in Node in linea, nel browser nel pool di worker che fa anche le mesh. Collisione e pavimenti dai voxel (D5).
- Persone e animali camminano con gli arti; vegetazione al vento; animazioni `<animation>`; le azioni
  `<action>` nel menu dell'entità («Apri la porta»), con lo stato del modello salvato con la partita.
- Icone dell'inventario e della barra: foto dei modelli (offscreen, in cache).
- Seme nuovo `aurora` (D2). **Gioco giocabile con i modelli.**
- ADR-0041 «Gli asset sono programmi MarkovJunior; collisione dai voxel». AGENTS.md: Manifest, API, Architettura.

### F6 — Il Concilio in 3D
- `agents/sculptor.ts`: Scultore per classe (D10), riparazioni di forma del front-end, controllo del kernel
  (finisce, non è vuoto, poggia, alto abbastanza, non riempie la scatola), Artista giudice con le foto.
- Fucina, Genesi (terreni → modelli dei terreni, cast → modelli), pacchetti di oggetti (un programma per tipo
  di oggetto, riusato fra oggetti simili), oggetti citati: chiedono i programmi; il Referente porta allo
  Scultore «riscolpisci»; la Galleria espone i modelli.
- `MockModels`: risposte ai compiti nuovi con i programmi scritti a mano della classe; voti fissi.
- ADR-0042 «Lo Scultore nel Concilio, l'Artista giudica». AGENTS.md: Concilio, Costi.

### F7 — Lo spazio a scale: lotti e ancore
- Il piano del Cartografo ha `strutture` (per ogni lotto: quale struttura, o un concetto da forgiare) e
  `ancore` (cosa, dove, vicino a cosa); il kernel posa le strutture nei lotti (scatola dal lotto, rotazione verso
  l'ingresso, posizione libera nel lotto), libera le caselle del lotto, collega l'ingresso del modello (le
  lettere della porta) al sentiero del piano; le cose `dentro` vanno sul pavimento del modello.
- ADR-0043 «Lo spazio a scale: piano, lotti, ancore». AGENTS.md: Il Concilio (Luogo), Architettura.

### F8 — Azioni come regole
- «Altro…» su un modello può produrre una regola nuova (`<action>`): l'Ingegnere/Scultore la scrive, il kernel
  la prova sul modello (deve cambiare qualcosa, non svuotarlo, finire), la aggiunge al programma del tipo (nella
  libreria), e l'azione è imparata per tutto il tipo. Gli effetti di oggi restano per ciò che non è forma.
- ADR-0044 «Le azioni sono regole sul modello». AGENTS.md: Effetti, Menu.

### F9 — Cartelle, documenti, chiusura
- Backup degli universi 2D (D2); `AGENTS.md` riscritto dove descrive il 2D; ADR-0037 «attuato»; indice degli
  ADR (con le righe doppie corrette); README; questo piano con il diario; riassunto finale con i costi.

## 5. Rischi

- **R1 — La fase F4 è grande** (il renderer è un terzo del client). Mitigazione: il kernel non cambia API in
  F4; il renderer nuovo legge le stesse cose del vecchio (`chunks`, `ecs`, `palette`, `corona`, `offset`).
- **R2 — Prestazioni**: centinaia di alberi per chunk. Mitigazione: istanze (`InstancedMesh`) per (programma,
  seme), pochi semi per tipo di casella (3), mesh nei worker, chunk lontani scaricati.
- **R3 — Modelli che non finiscono o esplodono**: il kernel li esegue con un tempo massimo (worker) e un
  limite di celle; se falliscono, il programma generico della classe; l'errore torna allo Scultore.
- **R4 — NPC incastrati** fra i voxel delle case: vedi D12.
- **R5 — Universi vecchi**: il seme nuovo ha un altro nome, quindi `valmora` non viene mai aperto dal 3D;
  i manifest 2D si leggono ancora (campi ignorati), così l'aggiornamento dal seme non rompe nulla.
- **R6 — Test lenti**: le strutture in linea costano 100-1200 ms; i test usano programmi piccoli e la cache
  delle forme (stesso programma e seme → stessa forma).
- **R7 — Costi delle prove**: solo a fine F6 una prova con Gemini dal gioco (una Genesi ridotta e qualche
  luogo), con il registro dei consumi acceso; la spesa va nel diario.

## 6. Domande aperte (non bloccano: ho scelto un default)

1. Il nome del seme nuovo: `aurora` (D2).
2. Argon: al massimo 3 strutture «importanti» per mondo, scelte dalla Genesi (D10). Va bene il tetto?
3. Il piano a caselle resta in JSON nello step 9 (D4): l'XML 2D per il Cartografo lo propongo come passo dopo.
4. La cartella del backup: `H:/projects/rune-backup/universi-2d/` (D2).

---

## Diario

(aggiornato a ogni fase)

### F0 — fatto (`a3cc228`)
Piano scritto; branch `3d`.

### F1 — fatto
- `src/mj/` con `engine xml model palette run rig mesh classes photo check` (spostati con `git mv`, la storia li segue).
  `rig.ts` ha solo lo scheletro (via camminate e vento a fotogrammi, servivano agli sprite); `check.ts` solo le
  misure (via le riparazioni del JSON).
- Laboratorio: via la pagina `/lab/`, blocchi, WFC, architetto, commissione, Scultore JSON, esempi e programmi
  JSON, conversione, 16 script e 5 file di test. Le parti del vecchio Scultore che le prove XML usano ancora
  (bersaglio, descrizione, Artista, foglio delle quattro viste) sono in `lab/mjx/target.ts`; i bersagli
  preimpostati in `lab/mjx/targets.ts`.
- Test: `lab/tests/mjx.test.ts` (conformità ai modelli ufficiali) invariato salvo gli import; tolto solo il caso
  della conversione JSON → XML (il convertitore non c'è più). I test del motore sono ora in `tests/mj.test.ts`
  (13 casi, su XML o programmi minimi). Totale: 9 file, 120 test (prima 155: i 47 dei blocchi e del JSON sono andati).
- ADR-0038; indice degli ADR (0031-0035 sostituiti, 0036 accettato); AGENTS.md (Struttura, MarkovJunior);
  `lab/README.md` riscritto.
- Diverso dal previsto: nulla di sostanziale; `prices.ts` e `meter.ts` restano in `lab/mj3d/` fino a F2.
