# Laboratorio di MarkovJunior

Dallo step 9 ([ADR-0038](../docs/adr/0038-laboratorio-di-markovjunior.md)) il laboratorio serve a una cosa
sola: **analizzare e correggere i programmi MarkovJunior** (modelli e strutture) che il Concilio non riesce
a scrivere, e provarli in una sandbox prima di metterli nell'universo. Non fa parte del gioco: il gioco non
importa nulla da `lab/`; il laboratorio usa il MarkovJunior del gioco (`src/mj/`) e, per lo Scultore, il
livello dei modelli del kernel (`src/kernel/ai`).

La storia degli esperimenti (step 8A-8.2B: sprite fotografati, strutture a blocchi, WFC, architetto, prove dei
modelli Gemini) è negli ADR [0031](../docs/adr/0031-laboratorio-voxel.md)-[0037](../docs/adr/0037-passaggio-al-3d.md),
nel [report dei costi](../docs/reports/costi-step8.2B.md) e nella storia di git (fino al commit `2832382`).

## Che cosa c'è

| percorso | cosa |
|---|---|
| `editor/` | l'editor di modelli MarkovJunior (`/lab/editor/`): split screen codice e rendering 3D Three.js in tempo reale, syntax highlighting, validazione immediata, controlli orbita |
| `suono/` | il SoundLab (`/lab/suono/`): preset, editor XML con errori e diagnostica, piano roll che scrive nel programma, voxel 3D, passi avanti e indietro, morph del ciclo, oscilloscopio, manopole, muto, apri e salva XML, export WAV; il suono è solo quello di `src/mj/synth.ts` |
| `3d/` | la sandbox 3D (`/lab/3d/`): terreno dal modello `River`, i modelli posati, collisioni, case in cui si entra, azioni, pannello per ispezionare e modificare l'XML, «Scolpisci con Gemini» |
| `mjx/official/` | 16 modelli 3D del repository di MarkovJunior, invariati (MIT): la prova che il front-end legge MarkovJunior alla lettera; da T334 anche gli 8 che inferiscono (`field`, `temperature`, `observe`, `search`: Keys, SoftPath, StairsPath senza il `map` a tessere da file, e in 2D Dwarves, Division, RegularPath, GrowTo, CompleteSAW; ADR-0171); in `riferimento/` altri 22 del repository, da leggere (T181): i grandi usano `wfc` e regole da file, che il motore non ha |
| `mjx/models/` | modelli scritti a mano e portati dagli step 8A-8B (esempi dello Scultore del laboratorio); `gemini/` i programmi delle prove 8.2A e 8.2B |
| `mjx/sculptor.ts`, `mjx/target.ts`, `mjx/targets.ts` | lo Scultore XML delle prove, i bersagli preimpostati, l'Artista che giudica le quattro foto |
| `prompts/` | i prompt dello Scultore e dell'Artista delle prove |
| `banco/` | il banco del prompt delle strutture (T154, [`banco/README.md`](banco/README.md)): prompt, bersagli, misure con il corpo del gioco, soglia e criteri, la prima prova; `banco/pattern.md` e `banco/riferimento/` (T181): i pattern con cui crescono le strutture e tre programmi scritti a mano con il metodo del cantiere, che variano e reggono due taglie |
| `banco/jev/` | il banco di Jev (T313, [`banco/jev/README.md`](banco/jev/README.md)): decisioni chiuse del gioco, giudizi sulla scultura e scelte della vita degli individui chieste a Jev di TypeSafe e a Gemini 3.1 Flash-Lite con le stesse domande; casi registrati, il registro delle chiamate `consumi.jsonl`, `riepilogo.md` |
| `banco/jev/casi-d-uso/` | dove Jev ci fa risparmiare ancora (T325, [`banco/jev/casi-d-uso.md`](banco/jev/casi-d-uso.md)): quanto delle richieste del Concilio è contesto (un registratore delle chiamate, il taglio delle richieste in parti, `countTokens`, un'ora di gioco), le guardie sui testi del viandante, le battute riusate, il contesto scelto da Jev; casi, misure, il registro `consumi.jsonl`, `riepilogo.md` |
| `banco/indossati.md`, `banco/indossati/`, `indossati/` | vestiti e armature addosso (T289): tre vie (due programmi per oggetto; un programma con la sezione `<worn>`, regole che riscrivono il corpo; i colori del kernel) sugli stessi elmo, corazza e mantello, sul viandante, sul lupo e su 27 corpi del seme e del Cantiere 8; foto da quattro lati, tempi, memoria, costo con lo Scultore, la domanda per l'autore; la pagina 3D `/lab/indossati/` le mostra una accanto all'altra, ferme o in cammino |
| `scripts/` | strumenti da riga di comando (sotto) |
| `tests/` | conformità ai modelli ufficiali (`mjx.test.ts`), mesh (`mesh3d.test.ts`) |
| `out/` | ciò che scrivono gli script (ignorata da git) |

Il motore, il front-end XML, la palette, le mesh, lo scheletro, le classi e le foto sono in `src/mj/` (vedi
`AGENTS.md`). Per i test del motore stesso: `tests/mj.test.ts`.

## Come si usa

- Editor modelli MarkovJunior: `npm run dev` → <http://localhost:5173/lab/editor/>. Split screen con editor codice/XML a sinistra (syntax highlighting, numeri di riga con segnalazione errori immediata, formattazione, copia/esporta) e viewport 3D Three.js a destra (orbita libera con tasto destro o sinistro, zoom, pan con Shift, viste isometrica/alto/fronte/fianco, griglia, wireframe e bloom per voxel luminosi).
- SoundLab: `npm run dev` → <http://localhost:5173/lab/suono/>. Spazio suona e ferma, Ctrl+Invio riesegue, Ctrl+S salva. In console `window.soundlab`. La bozza resta nel browser (`localStorage`) tra un caricamento e l'altro.
- Sandbox: `npm run dev` → <http://localhost:5173/lab/3d/>. WASD (Shift corre), Q/R ruota la camera, rotella
  zoom, tasto destro trascina per orbitare, E agisce (la porta della casa si apre), clic su un modello per
  ispezionarlo: XML modificabile («Esegui»), «Nuovo seme», «Cresci», «Mettilo davanti a me». In console
  `window.sandbox`.
  Solo con `npm run dev`: gli XML di `lab/mjx/models/` entrano nella pagina quando si costruisce, quindi
  `vite preview` mostra quelli dell'ultima `npm run build` (anche il seme `universe/` del gioco), e un file
  cambiato si vede solo dopo una nuova build. Con `npm run dev` la pagina si ricarica appena il file cambia.
- Un programma che non riesce: `npx vite-node lab/scripts/mjx-slice.ts -- <id> [seme] [z …]` stampa le sezioni
  in lettere; `mjx-render.ts -- <id> --frames --act apri` lo fotografa da quattro lati, con i fotogrammi delle
  animazioni e il risultato delle azioni; `mjx-stats.ts` dà tempi, voxel e triangoli di tutti i modelli.
- Le prove con Gemini (costano: contatori sempre accesi):
  - `mjx-sculpt.ts -- --model gemini-3.1-flash-lite [--judge gemini-3.5-flash]`: lo Scultore sui bersagli
    preimpostati, con un giudice fisso;
  - `banco-strutture.ts -- --bersagli moderna --giro v1`: il prompt delle strutture provato con `claude -p` senza altro contesto, foto, misure e difetti (`banco/README.md`);
  - `mjx-trial.ts -- --model … --run …`: un modello complesso, una richiesta per chiamata, il costo di ognuna;
  - `trial-report.ts`, `costs-history.ts`: tabelle dei costi delle prove;
  - `mjx-keep.ts`, `trial-keep.ts`: tengono i programmi migliori in `mjx/models/gemini/`.
- `mjx-official.ts [-- Growth River]`: i modelli ufficiali eseguiti e fotografati.
- `mjx-inferenza.ts [-- --dir lab/banco/inferenza] [Keys]`: i modelli che inferiscono, fotografati accanto alla griglia che dà l'originale in C# (T334, `banco/inferenza/README.md`).
- `mjx-trace.ts -- modello.xml [--bersaglio moderna | --size "X Y Z"] [--forma differenze] [--tetto 4000] [--passo N]`: cosa ha fatto un programma, nodo per nodo, in testo (`banco/traccia.md`).
- `jev-banco.ts -- --offline | --gruppi decisioni,scultura,vita [--modelli …] [--varianti base,rovescio,domande-2] [--oggi] | --prepara scultura|vita | --rapporto`: il banco di Jev (`banco/jev/README.md`); senza `--offline` costa, con i tetti sul registro intero. Con le immagini (T324): `--prepara immagini` (le foto in `out/jev/foto`), `--gruppi immagini --varianti lati4,lato1,griglia,separate,nomi8,foto8,foto50`, `--oggi-artista` (l'Artista del gioco), `--tetti-giri img` (i tetti su quei giri soltanto).
- `jev-casi-d-uso.ts -- --offline | --contesto [--conta] [--universi …] | --gruppi guardia,battute [--modelli …] | --scelta [--taglio largo] [--riusa-intero] | --prepara guardia,battute,scelta | --rapporto`: i casi d'uso di TypeSafe (`banco/jev/casi-d-uso.md`); `--conta` usa `countTokens` di Gemini (gratis), le prove costano con i tetti sul registro di T325 (0,50 $ e 0,80 $).
- `game-requests.ts`: quanto sono grandi le richieste del gioco (offline, conta i token con `countTokens`).
- `indossati.ts [-- --rapido]`: il banco degli indossati (`banco/indossati.md`): foto a cartone da quattro lati, `misure.json` e
  `riepilogo.md` in `banco/indossati/`, senza modelli né browser (≈ 20 s). In 3D: `npm run dev` → <http://localhost:5173/lab/indossati/>
  (`?corpo=viandante|lupo|gerboa|golem|cervo&seme=2&vista=0..3&passo`, in console `window.indossati`).

## Che cosa ho imparato scrivendo modelli (vale per chi corregge)

- gli strati si scrivono dall'alto: `in="D W"` è D sopra W;
- in `out` va scritto solo ciò che cambia (`out="*X"`): `all` blocca le corrispondenze che si sovrappongono
  nelle celle scritte;
- `prl` decide per ogni corrispondenza: allungare a caso un lato intero lo fa frastagliato;
- una regola che crea ciò che cerca (una trave sotto una trave) va con `steps="1"`;
- «muro con il vuoto davanti» vale anche dall'interno: la porta va ancorata al terreno fuori;
- le proporzioni si decidono su una griglia grossa e poi `map` (come ModernHouse e CarmaTower): i pattern
  restano corti.
