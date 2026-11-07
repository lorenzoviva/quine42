# L'inferenza di MarkovJunior nel motore (T334)

I modelli del repository di MarkovJunior che usano `field`, `temperature`, `observe` e `search` (`lab/banco/pattern.md` §12), portati in
`lab/mjx/official/` e fotografati due volte con lo stesso obiettivo: `<Modello>.png` è il motore del laboratorio (`src/mj/engine.ts`,
`src/mj/infer.ts`), `<Modello>-originale.png` è la griglia che dà l'originale in C# (`originale/`, sotto). Un modello 3D dai quattro lati
(fronte, destra, retro, sinistra), uno 2D dall'alto, come una lastra di un voxel. Seme 1 per entrambi: i due generatori casuali sono diversi,
quindi le griglie non sono le stesse voxel per voxel; si confrontano gli esiti.

```bash
npx vite-node lab/scripts/mjx-inferenza.ts -- --dir lab/banco/inferenza                  # le foto e la tabella qui sotto
npx vite-node lab/scripts/mjx-inferenza.ts -- --dir lab/banco/inferenza --seme 2 Keys    # un altro seme, un modello
```

| modello | griglia | passi | tempo | celle (laboratorio) | passi dell'originale | celle (originale) |
|---|---|---|---|---|---|---|
| Keys | 23×23×23 | 354 | 104 ms | B:11140,F:943,G:1,P:41,R:1,U:41 | 356 | B:11140,F:959,G:1,P:33,R:1,U:33 |
| SoftPath | 80×80×80 | 165 | 321 ms | B:511795,G:1,U:1,W:203 | 178 | B:511771,G:1,U:1,W:227 |
| StairsPath | 33×33×33 | 30 | 544 ms | A:38,B:35872,D:27 | 28 | A:24,B:35897,D:16 |
| Dwarves | 20×20×1 | 25 | 6 ms | B:376,E:2,N:12,W:10 | 16 | B:376,E:2,N:12,W:10 |
| Division | 75×75×1 | 8 | 27 ms | A:297,B:33,I:296,U:3738,a:207,u:1054 | 9 | A:284,B:33,I:296,U:3742,a:214,u:1056 |
| RegularPath | 79×79×1 | 297 | 27 ms | A:456,B:5784,R:1 | 204 | A:270,B:5970,R:1 |
| GrowTo | 120×120×1 | 2000 (il tetto di models.xml) | 99 ms | B:12400,N:1999,U:1 | 2000 | B:12400,N:1999,U:1 |
| CompleteSAW | 19×19×1 | 88 | 371 ms | B:200,R:1,W:160 | 89 | B:200,R:1,W:160 |

Come si leggono:

- **Uguali dove l'esito non dipende dal caso.** Dwarves (i nani scavano una volta e restano col carico: `E` non diventa `G`, perché il campo di
  `G` vale -1 dove sta `E`, anche nell'originale), GrowTo, CompleteSAW (la ricerca trova il cammino che tocca tutti gli 81 punti del reticolo:
  80 mosse, «found a trajectory of length 80» nell'originale) e il reticolo di Keys (`B` 11140, una porta `U` per ogni chiave `P`).
- **Della stessa famiglia dove dipende dal caso.** I cammini di StairsPath, SoftPath e RegularPath dipendono da dove cadono gli estremi: su
  dieci semi l'originale dà per StairsPath da 8 a 42 celle `A`, SoftPath (48³) da 59 a 143 `W`. Anche il nodo `A` isolato di Keys capita a
  entrambi (l'originale col seme 4).
- **I passi.** L'originale conta anche il passo in cui un ramo finisce (`Branch.Go` che torna falso): uno per la radice, uno per ogni `markov`
  che si chiude (Keys 356 contro 354, Division 9 contro 8). Dove i cammini sono più lunghi i passi sono di più in entrambi.

Le differenze volute dall'originale sono nell'ADR-0173: il motore guarda corrispondenze sempre aggiornate (l'originale, in un `all` con i
campi, perde fino a quando il nodo ricomincia le corrispondenze che in un passo non hanno potenziale), un `all` che non applica niente si ferma subito
invece di contare un passo vuoto, i tetti della ricerca. StairsPath è senza il `map` finale: disegna le scale con tessere da file (`fout`),
che il motore non legge ancora (T333, T335); il cammino resta sulla griglia grossa, `A` il corridoio, `D` gli angoli e i capi delle rampe.

## L'originale (`originale/`)

`originale/Program.cs` sostituisce il `Program.cs` di MarkovJunior: esegue un modello con un seme e stampa la griglia in testo invece di
PNG e VOX. Per rifare il confronto (serve un SDK .NET 6 o più recente):

1. scaricare i sorgenti di `source/` del repository (github.com/mxgmn/MarkovJunior, MIT) **tranne** `Program.cs`, `GUI.cs` e `Graphics.cs`
   (che vogliono ImageSharp) in una cartella con `originale/Program.cs` e `originale/mj.csproj`;
2. `dotnet build -c Release -o out`;
3. per ogni modello `dotnet out/mj.dll lab/mjx/official/<Modello>.xml <X> <Y> <Z> <seme> <passi> > lab/out/inferenza-originale/<Modello>-<seme>.txt`
   (i passi: 85 per Dwarves, 2000 per GrowTo, 50000 per gli altri);
4. `npx vite-node lab/scripts/mjx-inferenza.ts -- --dir lab/banco/inferenza` legge quei file e fa le foto `-originale`.

Le stesse prove, dove l'esito è certo, sono anche nei test: `tests/mj-infer.test.ts` («come l'originale»).
