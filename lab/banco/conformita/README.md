# La conformità a MarkovJunior di mxgmn (T500)

Il banco dello studio [`docs/design/markov-allineamento.md`](../../../docs/design/markov-allineamento.md): il piano dell'allineamento del
nostro motore all'originale (la scelta A1 dell'autore del 22/11). Qui tre motori si misurano sugli stessi programmi:

- **l'originale**: il C# di [github.com/mxgmn/MarkovJunior](https://github.com/mxgmn/MarkovJunior) al commit `42aaf24`, costruito con
  .NET 6 e il `Program.cs` senza grafica di T498 ([`lab/banco/markov/README.md`](../markov/README.md)); è la verità;
- **il riferimento** (`riferimento.ts`): l'originale tradotto riga per riga in TypeScript, le stesse classi, gli stessi cicli, lo stesso
  ordine di ogni numero casuale, col generatore di .NET (`dotnet-random.ts`); si tiene all'originale, e dove .NET non c'è (i test) ne fa le
  veci. Non è il motore del gioco: `src/` non lo importa;
- **il nostro motore** (`src/mj/engine.ts`), che qui non cambia.

| cosa | dove |
|---|---|
| `System.Random` di .NET in TypeScript (l'algoritmo sottrattivo di Knuth che .NET usa con un seme) | `dotnet-random.ts` |
| il programma C# che stampa ciò che `System.Random` tira, per verificarlo | `caso/` |
| l'originale tradotto: `Interpreter`, i rami, `one all prl`, `map path convolution convchain`, `wfc` a tessere e a sovrapposizione, `field`, `observe` (non `search`) | `riferimento.ts` |
| i programmi delle differenze nuove (`c1`-`c11`), su poche celle, con la griglia di partenza accanto (`.txt`); quelle dei rami e dei nodi di regola sono di T498 (`lab/banco/markov/programmi/`) | `programmi/` |
| un esempio scritto per i due motori: il borgo coi sentieri (`path`) | `esempi/` |
| i 36 modelli 3D del repository di mxgmn, il loro testo così com'è (MIT, `mxgmn/LICENSE`); le scatole e i passi in `casi.ts` (`REPO_3D`) | `mxgmn/` |
| ciò che l'originale ha stampato: i numeri di `System.Random`, i programmi `c*`, l'esempio, i modelli 3D (passi, fine, l'impronta della griglia) | `uscite.json` |
| i casi in comune fra lo script e i test | `casi.ts` |
| le misure di questo task | [`misure.md`](misure.md) |
| lo script | `lab/scripts/conformita-mj.ts` |
| i test | `tests/mj-conformita.test.ts` |

## Lo script

```bash
npx vite-node lab/scripts/conformita-mj.ts -- --caso [--registra]           # System.Random: la copia contro .NET (serve caso/ costruito)
npx vite-node lab/scripts/conformita-mj.ts -- --programmi [--registra]      # c1-c11 e l'esempio: l'originale, il riferimento, il nostro motore
npx vite-node lab/scripts/conformita-mj.ts -- --modelli [--semi 1,2,3] [--solo Growth,Keys] [--originale] [--registra]
                                                                            # i 36 modelli 3D: con --originale il C# contro il riferimento,
                                                                            # voxel per voxel; poi il nostro motore, per le lettere che scrive
npx vite-node lab/scripts/conformita-mj.ts -- --varianza [--semi 6] [--universi <cartella>] [--solo-concilio] [--solo-mxgmn]
                                                                            # quanto variano fra i semi i programmi del seme, del forte, degli
                                                                            # universi e di mxgmn (nel riferimento e nel nostro motore)
npx vite-node lab/scripts/conformita-mj.ts -- --censimento [--universi <cartella>]
                                                                            # che cosa dei nostri programmi l'originale non ha o legge altrimenti
```

Con `--md f` e `--json f` scrive i rapporti. Nessuna chiamata ai modelli; scrive solo `lab/out/conformita/`, i file detti e, con
`--registra`, `uscite.json`. Per l'originale e i modelli servono, in `lab/out/` (fuori da git):

1. il repository di mxgmn al commit `42aaf24` in `lab/out/markov/repo/` (`git clone https://github.com/mxgmn/MarkovJunior lab/out/markov/repo`);
2. l'originale senza grafica costruito come dice [`lab/banco/markov/README.md`](../markov/README.md) (`lab/out/markov/mj/mj.dll`);
3. il programma del caso: copiare `caso/Program.cs` e `caso/caso.csproj` in `lab/out/conformita/caso-src/` e
   `dotnet build lab/out/conformita/caso-src/caso.csproj -c Release -o lab/out/conformita/caso` (mai dentro `lab/banco/`: lascerebbe `obj/`).

Le risorse dei modelli (tileset, regole da file, campioni) il riferimento le legge in testo da `lab/mjx/official/resources/`
(`lab/scripts/mjx-risorse.ts`, T335): sei modelli ne leggono che non sono ancora state portate (`Knots3D` per cartella, le regole di
`CarmaTower` e di `DualRetraction`), e il riferimento non li legge.

## Che cosa dice

- `System.Random`: la copia tira gli stessi numeri di .NET, bit per bit (10 semi, anche negativi, 3000 numeri ciascuno).
- Il riferimento dà la stessa griglia voxel per voxel e gli stessi passi del C# su **30 modelli 3D su 36** (3 semi ciascuno; gli altri 6
  per le risorse), sugli 11 programmi `c*` (anche gli errori), sui 16 di T498 e sull'esempio del borgo. Il caso dell'originale si riproduce:
  il criterio di conformità è voxel per voxel.
- Il nostro motore oggi diverge in tutti gli 11 `c*` (e negli 8 di T498), su nessuno dei 36 modelli dà la griglia dell'originale, ne fa
  girare 27 (ModernHouse e SeaVilla solo nella copia portata ai simboli del contratto 0.6), simili per le lettere che scrivono salvo
  StrangeDungeon.
- Le tabelle intere in [`misure.md`](misure.md).
