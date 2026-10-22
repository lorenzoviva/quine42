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
| `3d/` | la sandbox 3D (`/lab/3d/`): terreno dal modello `River`, i modelli posati, collisioni, case in cui si entra, azioni, pannello per ispezionare e modificare l'XML, «Scolpisci con Gemini» |
| `mjx/official/` | 16 modelli 3D del repository di MarkovJunior, invariati (MIT): la prova che il front-end legge MarkovJunior alla lettera |
| `mjx/models/` | modelli scritti a mano e portati dagli step 8A-8B (esempi dello Scultore del laboratorio); `gemini/` i programmi delle prove 8.2A e 8.2B |
| `mjx/sculptor.ts`, `mjx/target.ts`, `mjx/targets.ts` | lo Scultore XML delle prove, i bersagli preimpostati, l'Artista che giudica le quattro foto |
| `prompts/` | i prompt dello Scultore e dell'Artista delle prove |
| `scripts/` | strumenti da riga di comando (sotto) |
| `tests/` | conformità ai modelli ufficiali (`mjx.test.ts`), mesh (`mesh3d.test.ts`) |
| `out/` | ciò che scrivono gli script (ignorata da git) |

Il motore, il front-end XML, la palette, le mesh, lo scheletro, le classi e le foto sono in `src/mj/` (vedi
`AGENTS.md`). Per i test del motore stesso: `tests/mj.test.ts`.

## Come si usa

- Sandbox: `npm run dev` → <http://localhost:5173/lab/3d/>. WASD (Shift corre), Q/R ruota la camera, rotella
  zoom, tasto destro trascina per orbitare, E agisce (la porta della casa si apre), clic su un modello per
  ispezionarlo: XML modificabile («Esegui»), «Nuovo seme», «Cresci», «Mettilo davanti a me». In console
  `window.sandbox`.
- Un programma che non riesce: `npx vite-node lab/scripts/mjx-slice.ts -- <id> [seme] [z …]` stampa le sezioni
  in lettere; `mjx-render.ts -- <id> --frames --act apri` lo fotografa da quattro lati, con i fotogrammi delle
  animazioni e il risultato delle azioni; `mjx-stats.ts` dà tempi, voxel e triangoli di tutti i modelli.
- Le prove con Gemini (costano: contatori sempre accesi):
  - `mjx-sculpt.ts -- --model gemini-3.1-flash-lite [--judge gemini-3.5-flash]`: lo Scultore sui bersagli
    preimpostati, con un giudice fisso;
  - `mjx-trial.ts -- --model … --run …`: un modello complesso, una richiesta per chiamata, il costo di ognuna;
  - `trial-report.ts`, `costs-history.ts`: tabelle dei costi delle prove;
  - `mjx-keep.ts`, `trial-keep.ts`: tengono i programmi migliori in `mjx/models/gemini/`.
- `mjx-official.ts [-- Growth River]`: i modelli ufficiali eseguiti e fotografati.
- `game-requests.ts`: quanto sono grandi le richieste del gioco (offline, conta i token con `countTokens`).

## Che cosa ho imparato scrivendo modelli (vale per chi corregge)

- gli strati si scrivono dall'alto: `in="D W"` è D sopra W;
- in `out` va scritto solo ciò che cambia (`out="*X"`): `all` blocca le corrispondenze che si sovrappongono
  nelle celle scritte;
- `prl` decide per ogni corrispondenza: allungare a caso un lato intero lo fa frastagliato;
- una regola che crea ciò che cerca (una trave sotto una trave) va con `steps="1"`;
- «muro con il vuoto davanti» vale anche dall'interno: la porta va ancorata al terreno fuori;
- le proporzioni si decidono su una griglia grossa e poi `map` (come ModernHouse e CarmaTower): i pattern
  restano corti.
