# Tessere, campioni e `map` frazionaria nel motore (T335)

I modelli del repository di MarkovJunior che usano `wfc` a tessere o a sovrapposizione, `convchain`, la `map` a scala frazionaria e le
regole da file (`lab/banco/pattern.md` §11-12, ADR-0174), portati in `lab/mjx/official/` invariati, con le risorse dell'originale (tileset
e regole `.vox`, campioni `.png`) portate in testo in `lab/mjx/official/resources/`. Ogni modello è fotografato due volte con lo stesso
obiettivo: `<Modello>.png` è il motore del laboratorio (`src/mj/engine.ts`, `src/mj/wfc.ts`), `<Modello>-originale.png` è la griglia che
dà l'originale in C# (`originale/`, sotto). Un modello 3D dai quattro lati (fronte, destra, retro, sinistra), uno 2D dall'alto. Seme 1 per
entrambi, tranne ModernHouse (seme 2: col seme 1 l'originale si ferma alla pianta, sotto). I due generatori casuali sono diversi: le
griglie non sono le stesse voxel per voxel, si confrontano gli esiti.

```bash
npx vite-node lab/scripts/mjx-risorse.ts -- <il repository di MarkovJunior>       # le risorse in testo (una volta, già fatte)
npx vite-node lab/scripts/mjx-wfc.ts -- --dir lab/banco/wfc                       # le foto e la tabella qui sotto
npx vite-node lab/scripts/mjx-wfc.ts -- --dir lab/banco/wfc --seme 3 SeaVilla     # un altro seme, un modello
```

| modello | seme | griglia | passi | tempo | celle (laboratorio) | griglia dell'originale | passi dell'originale | celle (originale) |
|---|---|---|---|---|---|---|---|---|
| Surface | 1 | 10×10×10 → 30×30×30 | 1 | 72 ms | B:18599,W:8401 | 30×30×30 | 509 | B:18578,W:8422 |
| Escher | 1 | 8×8×8 → 40×40×40 | 3 | 80 ms | A:6904,B:56175,R:82,W:757,Y:82 | 40×40×40 | 79 | A:8448,B:54500,R:108,W:836,Y:108 |
| EscherSurface | 1 | 8×8×8 → 40×40×40 | 3 | 162 ms | A:1580,B:60050,D:1580,G:790 | 40×40×40 | 123 | A:1760,B:59600,D:1760,G:880 |
| OrientedEscher | 1 | 6×6×6 → 30×30×30 | 4 | 426 ms | A:728,B:25200,D:696,W:376 | 30×30×30 | 23 | A:544,B:24150,D:528,E:1500,W:278 |
| PeriodicEscher | 1 | 8×8×8 → 40×40×40 | 3 | 1800 ms | A:99,B:54600,G:890,R:99,W:8312 | 40×40×40 | 95 | A:90,B:55200,G:860,R:90,W:7760 |
| PillarsOfEternity | 1 | 9×9×9 → 45×45×45 | 75 | 736 ms | B:84032,E:3375,W:3718 | 45×45×45 | 84 | B:83771,E:3375,W:3979 |
| Apartemazements | 1 | 8×8×8 → 40×40×40 | 131 | 95 ms | A:3225,B:53416,C:25,E:1580,N:1600,R:1634,W:2520 | 40×40×40 | 275 | A:2960,B:53850,C:36,E:1585,N:1600,R:1527,W:2442 |
| Partitioning | 1 | 11×11×3 → 33×33×9 | 4 | 4 ms | A:574,B:9227 | 33×33×9 | 119 | A:570,B:9231 |
| ModernHouse | 2 | 9×9×4 → 51×51×24 | 513 | 497 ms | B:46958,H:1335,J:2601,N:251,O:327,U:1476,W:3087,Y:9,d:1516,g:186,l:2078,o:2600 | 51×51×24 | 764 | B:50996,H:43,J:2601,N:378,O:344,U:714,W:2294,Y:9,d:901,g:132,l:1415,o:2597 |
| SeaVilla | 1 | 10×10×4 → 95×95×24 | 1044 | 671 ms | B:168255,E:917,T:49,U:34436,W:233,Y:76,a:3864,g:156,w:5,y:8609 | 95×95×24 | 1247 | B:153353,C:27,E:5120,M:6,O:18,T:783,U:33964,W:2579,Y:95,a:11357,g:426,o:239,p:142,y:8491 |
| StairsPath | 1 | 33×33×33 → 55×55×55 | 31 | 767 ms | A:206,B:165873,R:2,W:294 | 55×55×55 | 29 | A:136,B:166048,R:2,W:189 |
| ChainDungeon | 1 | 60×60×1 → 60×60×1 | 120 | 76 ms | A:315,D:2120,O:1165 | 60×60×1 | 119 | A:181,D:2063,O:1356 |
| ChainDungeonMaze | 1 | 60×60×1 → 60×60×1 | 134 | 41 ms | A:166,D:1738,O:1696 | 60×60×1 | 116 | A:327,D:1781,O:1492 |
| WaveDungeon | 1 | 50×50×1 → 50×50×1 | 198 | 53 ms | B:1466,P:1034 | 50×50×1 | 1449 | B:1632,P:868 |

Come si leggono:

- **Uguali dove l'esito non dipende dal caso.** Le tessere con le loro rotazioni e i vicini di ogni tileset, e le finestre del campione
  di WaveDungeon, sono quelli dell'originale voce per voce: Surface 48 motivi e 370 vicini per direzione, Escher 55 e 687, EscherSurface 31
  e 447, OrientedEscher 64 e 650, PillarsOfEternity 26 (95 in orizzontale, 266 in verticale), Apartemazements 16 (114, 148), Partition 7
  (14, 21), PartitionedEdges 49 (180, 365), MarchingHills 14 (37, 63), WaveDungeon 84 (251). L'originale stampa i motivi («P = …»); i vicini
  li ha stampati una sua copia con una riga in più, solo per questo confronto. Sono nei test (`tests/mj-wfc.test.ts`).
- **Della stessa famiglia dove dipende dal caso.** Le celle sono vicine per ogni modello. La sola onda (il programma tagliato dopo la
  `wfc`) ha la stessa distribuzione nei due motori: su dieci semi Apartemazements `A` 959 contro 1004, `W` 2431 contro 2534; SeaVilla `a`
  da 1595 a 1920 contro 1638-1978. OrientedEscher mette i cubi (`E`) solo con alcuni semi, in entrambi (l'originale col seme 4, il
  laboratorio col 3 e il 5).
- **ModernHouse a volte si ferma alla pianta.** La seconda onda (PartitionedEdges) parte da una pianta che a volte la rende
  contraddittoria fin dall'inizio: l'originale si ferma allora alla griglia di 17×17×4 (semi 1, 3, 6, 7 su sette), il laboratorio anche
  (semi 6 e 8 su otto). È ciò che fa una `wfc` senza soluzione: la griglia resta e i suoi nodi non girano.
- **SeaVilla dopo l'onda si scosta.** L'onda è la stessa; nei 67 nodi che la seguono (path, field, scale) un seme su dodici lascia una `l`
  senza strada fino a `R` (nodo 25, «connect»), che poi si allarga, e a volte la «scala girata male» (`g`) riempie i vuoti; l'originale su
  otto semi non lo fa mai e mette sempre i suoi `M`, `O` e `C`. Il seme 1 del laboratorio è uno di questi (un'isola piccola), i semi 2-8
  sono ville come quella dell'originale. Non viene dai nodi nuovi (tagliando il programma, la differenza compare dopo l'onda e prima della
  `map`) e non dalla partenza di `path` (provata la più vicina, come l'originale: lo stesso quadro); resta da indagare in un task a parte.
- **I passi.** L'originale conta un passo per ogni osservazione dell'onda (Surface 509), il laboratorio uno per l'onda intera (ADR-0174).

## L'originale (`originale/`)

`originale/Program.cs` sostituisce il `Program.cs` di MarkovJunior: esegue un modello con un seme e stampa la griglia in testo invece di
PNG e VOX; il suo `Graphics.LoadBitmap` legge i PNG (8 bit, grigio, RGB o RGBA) senza ImageSharp, per i campioni di ConvChain e di
WaveDungeon; i `.vox` li legge l'originale da sé. Per rifare il confronto (serve un SDK .NET 6 o più recente):

1. scaricare il repository (github.com/mxgmn/MarkovJunior, MIT) in una cartella a parte; copiare i sorgenti di `source/` **tranne**
   `Program.cs`, `GUI.cs` e `Graphics.cs` in un'altra cartella con `originale/Program.cs` e `originale/mj.csproj`;
2. `dotnet build -c Release -o out`;
3. da una cartella che contiene una copia di `resources/` del repository, per ogni modello
   `dotnet out/mj.dll <repository>/models/<Modello>.xml <X> <Y> <Z> <seme> 0 > lab/out/wfc-originale/<Modello>-<seme>.txt`
   (le misure sono quelle della tabella; 50000 passi bastano a tutti, 0 è senza tetto);
4. `npx vite-node lab/scripts/mjx-wfc.ts -- --dir lab/banco/wfc` legge quei file e fa le foto `-originale`.
