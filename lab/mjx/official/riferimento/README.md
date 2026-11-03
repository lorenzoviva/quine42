# Programmi del repository di MarkovJunior, per leggerli (T181)

Copie invariate di [`models/`](https://github.com/mxgmn/MarkovJunior/tree/main/models) del repository di MarkovJunior
(© 2022 Maxim Gumin, licenza MIT: `LICENSE`), scaricate il 2026-11-03 per studiare i pattern con cui crescono le strutture
(`lab/banco/pattern.md`). I 16 modelli 3D che il motore del gioco esegue alla lettera stanno nella cartella sopra
(`lab/mjx/official/`, `index.ts`); questi **non entrano nei test** e il motore non li esegue tutti:

| programma | gira nel motore? | perché serve |
|---|---|---|
| `ModernHouse.xml` | no: `wfc` a tessere, `map` con scala frazionaria, regole `fout` da file | la casa moderna: partizione, colonne, finestre fuse, sbalzi, scale |
| `SeaVilla.xml` | no: `wfc`, `field`, `fout` | la villa a terrazze: ponti e scale con `markov` e `path`, ritiro dei vicoli ciechi |
| `CarmaTower.xml` | no: regole da file (`block_*`, `side_*`), `map` con `outputValues` | la torre: scheletro di blocchi, `map` ×4, impalcatura, pannelli, finestre segnate e poi scavate |
| `Apartemazements.xml` | no: `wfc` | colonne tirate giù dai solai, finestre fra le colonne, fusione delle finestre |
| `PillarsOfEternity.xml`, `Partitioning.xml`, `StairsPath.xml`, `Keys.xml`, `SoftPath.xml`, `ChainDungeon.xml` | no: `wfc`, `observe`, `field`, `convchain` | pattern letti ma non riproducibili |
| `BasicPartitioning.xml`, `Rectangle.xml`, `BasicSkyline.xml`, `NystromDungeon.xml`, `BasicDungeonGrowth.xml`, `DungeonGrowth.xml` (le stanze da file no), `MultiHeadedDungeon.xml`, `Cycles.xml`, `LostCity.xml`, `GoTo.xml`, `Backtracker.xml`, `MazeBacktracker.xml` | sì (sono 2D: su una griglia 3D con `symmetry="(xy)"` girano per strati) | divisione dello spazio, rettangoli che crescono, griglie, corridoi, cicli, `path` |

Per provarne uno: `npx vite-node lab/scripts/mjx-trace.ts -- lab/mjx/official/riferimento/Cycles.xml --size "40 40 1" --forma nodi`.
