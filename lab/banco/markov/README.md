# `<markov>` e `<sequence>`: il nostro motore contro l'originale (T498)

Il banco dello studio [`docs/design/markov.md`](../../../docs/design/markov.md) (D68.3 dell'autore, 22/11). Qui ci sono i programmi su cui
il nostro motore e MarkovJunior di mxgmn fanno cose diverse, ciò che l'originale vi stampa, e lo script che li confronta.

| cosa | dove |
|---|---|
| i programmi delle differenze (`d*`), uno per differenza, su una riga di celle; la griglia di partenza accanto (`.txt`) | `programmi/` |
| i quattro cicli del forte dell'autore come programmi piccoli (`l*`) | `programmi/` |
| ciò che l'originale stampa: per ogni `d*` la griglia, i passi e se finisce (seme 1; `d9` semi 1-5); per ogni `l*` la misura di 400 semi | `originale.json` |
| il `Program.cs` dell'originale senza grafica, con la griglia di partenza e un intervallo di semi | `originale/` |
| le misure di questo task | [`misure.md`](misure.md) |
| lo script | `lab/scripts/markov-originale.ts` |
| i test (il nostro motore, e `it.fails` dove l'originale fa altro) | `tests/mj-markov-originale.test.ts` |

## Lo script

```bash
npx vite-node lab/scripts/markov-originale.ts -- --differenze                 # i d*: l'originale, la copia, il nostro motore
npx vite-node lab/scripts/markov-originale.ts -- --cicli --semi 400           # i l*: la misura di ogni ciclo su 400 semi
npx vite-node lab/scripts/markov-originale.ts -- --forte --semi 2             # il forte dell'autore (copia del 22/11), alla sua scatola
npx vite-node lab/scripts/markov-originale.ts -- --censimento --universi <cartella degli universi> [--originale <modelli di mxgmn>]
npx vite-node lab/scripts/markov-originale.ts -- --registra --semi 400        # rifà originale.json (serve l'originale costruito, sotto)
```

Con `--md f` e `--json f` scrive anche i rapporti. Nessuna chiamata ai modelli; scrive solo `lab/out/markov/` e i file detti.

**La copia del motore.** Il motore non cambia: lo script scrive in `lab/out/markov/engine-originale.ts` una copia di `src/mj/engine.ts` in
cui `<sequence>` e `<markov>` girano come `Branch`, `MarkovNode` e `Interpreter` dell'originale (`Node.cs`, `Interpreter.cs`): il ramo al
lavoro ha il turno, un ramo che finisce lo rende al genitore con un passo vuoto e ricomincia da capo, un `markov` chiede dal primo figlio a
ogni passo e non fa mai ripartire i passi dei figli finché non finisce, una `map` chiude la corsa quando i suoi nodi hanno finito; e una
`prl` conta fra i suoi `steps` i giri in cui non ha applicato niente (`ParallelNode.Go`). I nodi di regola restano i nostri (le
corrispondenze solo dove la regola cambia qualcosa, i nostri numeri casuali): un programma i cui rami l'originale gira come noi dà nella copia
la stessa griglia voxel per voxel. Con la copia spenta lo script controlla, su ogni programma del banco, che sia il motore di `src/`.
Dentro `<pieces>` la copia gira come il nostro motore (l'originale non ha `<pieces>`).

**Verificata contro l'originale vero**: sui programmi `d1`-`d6b` (le differenze dei rami) la copia stampa la griglia **e i passi** che stampa
il C#; su `d7`-`d10` no, di proposito (sono differenze dei nodi di regola, che la copia non imita). Vedi la prima tabella di `misure.md`.

## L'originale

`originale/Program.cs` sostituisce il `Program.cs` di MarkovJunior (MIT, © 2022 Maxim Gumin): legge il modello, scrive la griglia di
partenza dopo averla svuotata (come `Interpreter.Run`), gira con un seme o un intervallo (`1-400`) e stampa passi, fine e griglia in testo.
Per rifare `originale.json` (serve un SDK .NET 6 o più recente; questo banco: SDK 6.0.300, repository al commit `42aaf24`):

1. scaricare i sorgenti di `source/` di github.com/mxgmn/MarkovJunior **tranne** `Program.cs`, `GUI.cs` e `Graphics.cs` in
   `lab/out/markov/mjsrc/`, con `originale/Program.cs` e `originale/mj.csproj`;
2. `cd lab/out/markov/mjsrc && dotnet build -c Release -o ../mj`;
3. `npx vite-node lab/scripts/markov-originale.ts -- --registra --semi 400`.

A mano: `dotnet lab/out/markov/mj/mj.dll lab/banco/markov/programmi/d2-sequenza-nel-ciclo.xml 12 1 1 1 1000 lab/banco/markov/programmi/d2-sequenza-nel-ciclo.txt`.

I programmi del banco sono scritti perché entrambi li leggano: solo lettere (niente `#6`), le unioni come `<union>` (niente `[Nx]`), la
griglia di partenza in un file (niente `ground` né `origin="bottom"`). Le griglie dell'originale e le nostre si confrontano voxel per voxel
solo dove la corsa non dipende dal caso (`d*`: una corrispondenza alla volta); dove dipende (`l*`) i due generatori casuali sono diversi e si
confronta la misura su 400 semi.
