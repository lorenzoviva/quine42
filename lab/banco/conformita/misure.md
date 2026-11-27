# Le misure di T500

Fatte il 2026-11-23 sul kernel 0.10.29 con `lab/scripts/conformita-mj.ts` (lo studio: [`docs/design/markov-allineamento.md`](../../../docs/design/markov-allineamento.md)).
L'originale è il C# di mxgmn al commit `42aaf24` (.NET SDK 6.0.300), il riferimento `riferimento.ts`, il nostro motore quello di `src/mj/`.

## System.Random (`--caso`)

10 semi × 3000 numeri (Next, Next(n) con dieci n, NextDouble come i suoi 64 bit): **gli stessi di .NET**.

## I programmi delle differenze (`--programmi`)

| programma | semi | l’originale (C#) | il riferimento | il nostro motore |
|---|---|---|---|---|
| c1-d-ignorato | 1 | GGGG · 3 passi · finisce | GGGG · 3 passi · finisce | BBBB · 0 passi · finisce |
| c1-d-ignorato | 2 | GGGG · 3 passi · finisce | GGGG · 3 passi · finisce | BBBB · 0 passi · finisce |
| c1-d-ignorato | 3 | GGGG · 3 passi · finisce | GGGG · 3 passi · finisce | BBBB · 0 passi · finisce |
| c2-la-map-chiude | 1 | WBBB · 3 passi · finisce | WBBB · 3 passi · finisce | WWWW · 3 passi · finisce |
| c2-la-map-chiude | 2 | BBBW · 3 passi · finisce | BBBW · 3 passi · finisce | WWWW · 3 passi · finisce |
| c2-la-map-chiude | 3 | BWBB · 3 passi · finisce | BWBB · 3 passi · finisce | WWWW · 3 passi · finisce |
| c3-path-dal-vicino | 1 | RWWGBBBBBR · 1 passi · non finisce | RWWGBBBBBR · 1 passi · non finisce | RBBGWWWWWR · 1 passi · non finisce |
| c3-path-dal-vicino | 2 | RWWGBBBBBR · 1 passi · non finisce | RWWGBBBBBR · 1 passi · non finisce | RBBGWWWWWR · 1 passi · non finisce |
| c3-path-dal-vicino | 3 | RWWGBBBBBR · 1 passi · non finisce | RWWGBBBBBR · 1 passi · non finisce | RBBGWWWWWR · 1 passi · non finisce |
| c4-path-senza-colore | 1 | RRRG · 1000 passi · non finisce | RRRG · 1000 passi · non finisce | errore: riga 1, <path>: "color" è un solo simbolo (una lettera o # e un numero) |
| c4-path-senza-colore | 2 | RRRG · 1000 passi · non finisce | RRRG · 1000 passi · non finisce | errore: riga 1, <path>: "color" è un solo simbolo (una lettera o # e un numero) |
| c4-path-senza-colore | 3 | RRRG · 1000 passi · non finisce | RRRG · 1000 passi · non finisce | errore: riga 1, <path>: "color" è un solo simbolo (una lettera o # e un numero) |
| c5-conv-passi | 1 | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBB · 51 passi · finisce | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBB · 51 passi · finisce | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBBBBBBBBBBBBBBBBBBBBBB · 30 passi · finisce |
| c5-conv-passi | 2 | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBB · 51 passi · finisce | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBB · 51 passi · finisce | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBBBBBBBBBBBBBBBBBBBBBB · 30 passi · finisce |
| c5-conv-passi | 3 | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBB · 51 passi · finisce | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBB · 51 passi · finisce | RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBBBBBBBBBBBBBBBBBBBBBB · 30 passi · finisce |
| c6-conv-moore-3d | 1 | eccezione: Unhandled exception. System.Collections.Generic.KeyNotFoundException: The given key 'Moore' was not present in the dictionary. | errore: the given key 'Moore' was not present in the dictionary | RRRRRRRR · 1 passi · finisce |
| c6-conv-moore-3d | 2 | eccezione: Unhandled exception. System.Collections.Generic.KeyNotFoundException: The given key 'Moore' was not present in the dictionary. | errore: the given key 'Moore' was not present in the dictionary | RRRRRRRR · 1 passi · finisce |
| c6-conv-moore-3d | 3 | eccezione: Unhandled exception. System.Collections.Generic.KeyNotFoundException: The given key 'Moore' was not present in the dictionary. | errore: the given key 'Moore' was not present in the dictionary | RRRRRRRR · 1 passi · finisce |
| c7-conv-non-registra | 1 | BA · 3 passi · finisce | BA · 3 passi · finisce | BB · 3 passi · finisce |
| c7-conv-non-registra | 2 | BA · 3 passi · finisce | BA · 3 passi · finisce | BB · 3 passi · finisce |
| c7-conv-non-registra | 3 | BA · 3 passi · finisce | BA · 3 passi · finisce | BB · 3 passi · finisce |
| c8-unione-nel-nodo | 1 | errore: input code ? at line 1 is not found in codes / ERROR | errore: input code ? at line 1 is not found in codes | BGB · 1 passi · finisce |
| c8-unione-nel-nodo | 2 | errore: input code ? at line 1 is not found in codes / ERROR | errore: input code ? at line 1 is not found in codes | BGB · 1 passi · finisce |
| c8-unione-nel-nodo | 3 | errore: input code ? at line 1 is not found in codes / ERROR | errore: input code ? at line 1 is not found in codes | BGB · 1 passi · finisce |
| c9-conv-2d-periodica | 1 | BBBBBBBBBBBBRBBBBBBBBBBBB · 1 passi · finisce | BBBBBBBBBBBBRBBBBBBBBBBBB · 1 passi · finisce | BBBBBBRRRBBRRRBBRRRBBBBBB · 1 passi · finisce |
| c9-conv-2d-periodica | 2 | BBBBBBBBBBBBRBBBBBBBBBBBB · 1 passi · finisce | BBBBBBBBBBBBRBBBBBBBBBBBB · 1 passi · finisce | BBBBBBRRRBBRRRBBRRRBBBBBB · 1 passi · finisce |
| c9-conv-2d-periodica | 3 | BBBBBBBBBBBBRBBBBBBBBBBBB · 1 passi · finisce | BBBBBBBBBBBBRBBBBBBBBBBBB · 1 passi · finisce | BBBBBBRRRBBRRRBBRRRBBBBBB · 1 passi · finisce |
| c10-prl-sovrapposte | 1 | RRB · 1 passi · non finisce | RRB · 1 passi · non finisce | RBB · 1 passi · non finisce |
| c10-prl-sovrapposte | 2 | RRB · 1 passi · non finisce | RRB · 1 passi · non finisce | RBB · 1 passi · non finisce |
| c10-prl-sovrapposte | 3 | RRB · 1 passi · non finisce | RRB · 1 passi · non finisce | RBB · 1 passi · non finisce |
| c11-path-per-spigoli | 1 | RBBBWBBBG · 1 passi · non finisce | RBBBWBBBG · 1 passi · non finisce | RWBBWBBWG · 1 passi · non finisce |
| c11-path-per-spigoli | 2 | RBBBWBBBG · 1 passi · non finisce | RBBBWBBBG · 1 passi · non finisce | RWWBBWBBG · 1 passi · non finisce |
| c11-path-per-spigoli | 3 | RBBBWBBBG · 1 passi · non finisce | RBBBWBBBG · 1 passi · non finisce | RWWBBWBBG · 1 passi · non finisce |

| esempio | seme | l’originale (C#): passi, fine, impronta | il riferimento | il nostro motore: passi, fine |
|---|---|---|---|---|
| borgo-sentieri | 1 | 33, finisce, f9b24391 | 33, finisce, f9b24391 | 31, finisce |
| borgo-sentieri | 2 | 33, finisce, 4cfd6642 | 33, finisce, 4cfd6642 | 30, finisce |
| borgo-sentieri | 3 | 33, finisce, 3b6432d9 | 33, finisce, 3b6432d9 | 29, finisce |

## I modelli 3D del repository di mxgmn (`--modelli --originale`)

Semi 1, 2, 3; i passi di models.xml (50 000 se non li dice). «Riferimento = C#»: la stessa griglia voxel per voxel e gli stessi passi su ogni seme. «Noi»: il nostro motore di oggi; `TV` è la distanza fra le quote delle lettere della griglia (0 uguali, 1 niente in comune), la nostra media contro quella del riferimento, accanto a quanto si allontana dalla sua media un seme del riferimento.

| modello | scatola | riferimento = C# | il riferimento: passi, fine | noi: gira? | noi: passi, fine | TV noi/originale | TV fra semi dell’originale |
|---|---|---|---|---|---|---|---|
| Apartemazements | 8×8×8 | **sì** (3 semi) | 275, 244, 298; finisce | gira | 131, 118, 108; finisce | 0.011 | 0.005 |
| CarmaTower | 12×12×18 | il C# gira, il riferimento non ne legge le risorse | non legge: couldn't read CarmaTower-block_2_4x3.txt | non c’è la copia (risorse da portare in testo) | — | — | — |
| ClosedSurface | 12×12×12 | **sì** (3 semi) | 324, 305, 326; finisce | non c’è la copia (risorse da portare in testo) | — | — | — |
| ColoredKnots | 12×12×12 | il C# gira, il riferimento non ne legge le risorse | non legge: couldn't open tileset Knots3D | non c’è la copia (risorse da portare in testo) | — | — | — |
| Counting | 8×8×8 | **sì** (3 semi) | 2, 2, 2; finisce | gira | 1, 1, 1; finisce | 0.000 | 0.000 |
| DualRetraction3D | 27×27×27 | il C# gira, il riferimento non ne legge le risorse | non legge: couldn't read DualRetraction-Room1.txt | non c’è la copia (risorse da portare in testo) | — | — | — |
| Escher | 8×8×8 | **sì** (3 semi) | 79, 75, 96; finisce | gira | 3, 3, 3; finisce | 0.011 | 0.007 |
| EscherSurface | 8×8×8 | **sì** (3 semi) | 123, 116, 118; finisce | gira | 3, 3, 3; finisce | 0.004 | 0.000 |
| Growth | 29×29×29 | **sì** (3 semi) | 3000, 3000, 3000; finisce 0/3 | gira | 3000, 3000, 3000; finisce 0/3 | 0.000 | 0.000 |
| Hills | 40×40×12 | **sì** (3 semi) | 8018, 8019, 8014; finisce | gira | 8017, 8027, 8019; finisce | 0.002 | 0.001 |
| Keys | 23×23×23 | **sì** (3 semi) | 356, 356, 356; finisce | gira | 354, 354, 354; finisce | 0.001 | 0.000 |
| Knots3D | 8×8×8 | il C# gira, il riferimento non ne legge le risorse | non legge: couldn't open tileset Knots3D | non c’è la copia (risorse da portare in testo) | — | — | — |
| MazeGrowth | 27×27×27 | **sì** (3 semi) | 2197, 2197, 2197; finisce | gira | 2196, 2196, 2196; finisce | 0.000 | 0.000 |
| MazeTrail | 27×27×27 | **sì** (3 semi) | 1000, 1000, 1000; finisce 0/3 | gira | 1000, 1000, 1000; finisce 0/3 | 0.003 | 0.003 |
| ModernHouse | 9×9×4 | **sì** (3 semi) | 112, 764, 140; finisce | gira (un’altra griglia finale) (il testo dell’originale no: riga 164, <union>: symbol: "#" senza numero: un simbolo nume; la copia portata ai simboli 0.6 sì) | 606, 513, 628; finisce | 0.639 | 0.426 |
| NoDeadEnds | 19×19×19 | **sì** (3 semi) | 730, 730, 730; finisce | gira | 729, 729, 729; finisce | 0.001 | 0.001 |
| Noise | 24×24×24 | **sì** (3 semi) | 12675, 12675, 12675; finisce | gira | 12674, 12674, 12674; finisce | 0.005 | 0.009 |
| OddScale3D | 8×8×8 | **sì** (3 semi) | 3166, 3447, 3252; finisce | gira | 3247, 3099, 3269; finisce | 0.011 | 0.019 |
| OpenCave3D | 40×40×40 | **sì** (3 semi) | 116, 120, 55; finisce | gira | 57, 68, 120; finisce | 0.016 | 0.044 |
| OrientedEscher | 6×6×6 | **sì** (3 semi) | 23, 26, 14; finisce | gira | 4, 4, 4; finisce | 0.017 | 0.025 |
| ParallelGrowth | 29×29×29 | **sì** (3 semi) | 24, 24, 24; finisce 0/3 | gira | 24, 24, 24; finisce 0/3 | 0.000 | 0.000 |
| Partitioning | 11×11×3 | **sì** (3 semi) | 119, 113, 121; finisce | gira | 4, 4, 4; finisce | 0.006 | 0.002 |
| PeriodicEscher | 8×8×8 | **sì** (3 semi) | 95, 104, 85; finisce | gira | 3, 3, 3; finisce | 0.013 | 0.003 |
| PillarsOfEternity | 9×9×9 | **sì** (3 semi) | 84, 119, 105; finisce | gira | 75, 79, 69; finisce | 0.010 | 0.014 |
| RegularSAW | 19×19×19 | **sì** (3 semi) | 144, 316, 212; finisce | gira | 267, 30, 169; finisce | 0.028 | 0.018 |
| RegularSAWRestart | 19×19×19 | **sì** (3 semi) | 729, 729, 729; finisce | gira | 728, 728, 728; finisce | 0.001 | 0.001 |
| River | 20×20×20 | **sì** (3 semi) | 13690, 13210, 14320; finisce | gira | 13876, 13577, 13464; finisce | 0.073 | 0.100 |
| SeaVilla | 10×10×4 | **sì** (3 semi) | 1247, 1294, 1080; finisce | gira (il testo dell’originale no: riga 207, <union>: symbol: la cifra "6" da sola non è un sim; la copia portata ai simboli 0.6 sì) | 1044, 1119, 1235; finisce | 0.038 | 0.007 |
| SelectLongKnots | 10×10×10 | il C# gira, il riferimento non ne legge le risorse | non legge: couldn't open tileset Knots3D | non c’è la copia (risorse da portare in testo) | — | — | — |
| SoftPath | 80×80×80 | **sì** (3 semi) | 178, 203, 186; finisce | gira | 165, 181, 190; finisce | 0.000 | 0.000 |
| StairsPath | 33×33×33 | **sì** (3 semi) | 29, 28, 23; finisce | gira | 31, 31, 30; finisce | 0.001 | 0.000 |
| StochasticVoronoi | 50×50×50 | **sì** (3 semi) | 125001, 125001, 125001; finisce | gira | 125000, 125000, 125000; finisce | 0.049 | 0.037 |
| StrangeDungeon | 29×29×29 | **sì** (3 semi) | 148, 161, 152; finisce | gira | 146, 141, 149; finisce | 0.165 | 0.005 |
| SubmergedKnots | 12×12×12 | il C# gira, il riferimento non ne legge le risorse | non legge: couldn't open tileset Knots3D | non c’è la copia (risorse da portare in testo) | — | — | — |
| Surface | 10×10×10 | **sì** (3 semi) | 509, 507, 539; finisce | gira | 1, 1, 1; finisce | 0.004 | 0.004 |
| Voronoi | 60×60×60 | **sì** (3 semi) | 66, 70, 77; finisce | gira | 68, 71, 67; finisce | 0.041 | 0.028 |

ModernHouse: con i semi 1 e 3 l'originale (il C# e il riferimento) finisce presto sulla griglia di 17 × 17 × 4 (la seconda `wfc` non trova una soluzione in `tries` tentativi, e la corsa finisce con i nodi della `map` che la contiene); col 2 arriva alla casa intera. Da noi la casa arriva sempre in fondo, a 51 × 51 × 24.

## Che cosa dei nostri programmi l’originale non ha, o legge altrimenti (`--censimento`)

Programmi che lo usano, per sorgente (fra parentesi i programmi letti; negli universi solo quelli che non sono copie del seme).

| | seme (94) | laboratorio (lab/mjx/models) (60) | forte dell’autore (1) | aurora (del Concilio) (8) | mesa (del Concilio) (48) | neapolis (del Concilio) (69) | orichalcum (del Concilio) (69) | sidera (del Concilio) (70) | mxgmn (159 modelli) (159) |
|---|---|---|---|---|---|---|---|---|---|
| <in>/<out> figli | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| animazioni, azioni, capi indossati | 35 | 20 | 0 | 1 | 1 | 5 | 4 | 5 | 0 |
| color con part, hidden, glow, alpha, area | 90 | 41 | 1 | 5 | 23 | 50 | 47 | 65 | 0 |
| d="2"/d="3" (l’originale lo ignora) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| forme (box, cylinder…) | 74 | 53 | 0 | 8 | 46 | 52 | 54 | 54 | 0 |
| ground | 11 | 2 | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| import | 0 | 1 | 0 | 0 | 2 | 17 | 14 | 16 | 0 |
| insiemi [..] negli ingressi | 40 | 5 | 1 | 0 | 14 | 28 | 27 | 25 | 0 |
| markov dentro map | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 3 |
| markov dentro markov | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| markov dentro sequence | 4 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 40 |
| markov dentro wfc | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 |
| nodi dopo una map (l’originale non li esegue) | 1 | 1 | 0 | 0 | 2 | 17 | 14 | 16 | 0 |
| optional | 7 | 7 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| origin="bottom" | 20 | 2 | 1 | 0 | 2 | 17 | 15 | 16 | 0 |
| p nelle regole di one (l’originale lo ignora) | 12 | 7 | 0 | 1 | 3 | 5 | 1 | 14 | 0 |
| p="0" (da noi vale 1) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| path con steps | 1 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| più di 31 valori in una griglia | 28 | 11 | 1 | 1 | 2 | 17 | 20 | 14 | 0 |
| regola che non cambia niente | 9 | 1 | 0 | 1 | 1 | 4 | 2 | 8 | 3 |
| sequence dentro map | 0 | 0 | 0 | 0 | 2 | 17 | 14 | 16 | 2 |
| sequence dentro markov | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 8 |
| sequence dentro sequence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| sequence dentro wfc | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| sequence non ultimo figlio di markov | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| sequence ultimo figlio di markov | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 7 |
| simboli #N | 38 | 12 | 1 | 2 | 12 | 23 | 26 | 16 | 0 |
| size nel programma | 82 | 60 | 1 | 8 | 46 | 52 | 54 | 54 | 0 |
| soil | 13 | 0 | 0 | 0 | 2 | 17 | 15 | 16 | 0 |

## Quanto variano fra i semi (`--varianza --semi 6 --solo-concilio`)

6 semi per programma, alla scatola del gioco (i nostri) o di models.xml (mxgmn, nel riferimento); la mediana delle coppie di semi. «Forma»: i voxel pieni in un seme e vuoti nell’altro, sui pieni in almeno uno; «lettere»: le celle piene in almeno uno con un’altra lettera. Statico: forma sotto 0,01 (la soglia di lab/banco/varianza.ts).

| dove | programmi misurati | forma: mediana | statici (forma < 0,01) | lettere: mediana | non misurati |
|---|---|---|---|---|---|
| seme | 94 | 0.062 | 46 | 0.180 | 0 |
| forte dell’autore | 1 | 0.915 | 0 | 0.955 | 0 |
| aurora | 8 | 0.003 | 6 | 0.007 | 0 |
| mesa | 48 | 0.000 | 30 | 0.013 | 0 |
| neapolis | 69 | 0.031 | 30 | 0.044 | 0 |
| orichalcum | 69 | 0.043 | 29 | 0.090 | 0 |
| sidera | 70 | 0.128 | 20 | 0.142 | 0 |
| mxgmn | 30 | 0.547 | 5 | 0.612 | 6 |

### I costrutti e la varianza (tutti i programmi misurati, nostri e di mxgmn)

| costrutto | programmi con | forma: mediana con | statici con | programmi senza | forma: mediana senza |
|---|---|---|---|---|---|
| one | 241 | 0.212 | 40 | 148 | 0.000 |
| prl a moneta | 218 | 0.138 | 60 | 171 | 0.000 |
| markov | 13 | 0.216 | 6 | 376 | 0.043 |
| path | 5 | 0.217 | 1 | 384 | 0.042 |
| wfc | 11 | 0.753 | 0 | 378 | 0.038 |
| field | 6 | 0.412 | 0 | 383 | 0.040 |
| temperature | 2 | 0.791 | 0 | 387 | 0.043 |
| all | 277 | 0.181 | 74 | 112 | 0.000 |
| map | 56 | 0.182 | 1 | 333 | 0.014 |
| forme | 288 | 0.004 | 153 | 101 | 0.217 |
| import | 49 | 0.169 | 1 | 340 | 0.019 |

Dei nostri 359 programmi misurati, 91 non hanno né `one`, né una `prl` a moneta, né `path`, `wfc` o `convchain`: 91 di loro sono statici. Di quelli di mxgmn, 2 su 30.

### I modelli di mxgmn nei due motori (`--varianza --solo-mxgmn`)

Forma / lettere, la mediana delle coppie di 6 semi; nel nostro motore dalla copia del laboratorio.

| modello | nell'originale (il riferimento) | nel nostro motore | costrutti |
|---|---|---|---|
| Apartemazements | 0.585 / 0.631 | 0.585 / 0.635 | prl a moneta, wfc, all |
| CarmaTower | non letto | — | one, markov, path, all, map |
| ClosedSurface | 0.626 / 0.626 | — | wfc, all |
| ColoredKnots | non letto | — | one, markov, wfc, all |
| Counting | 0.000 / 0.000 | 0.000 / 0.000 |  |
| DualRetraction3D | non letto | — | one, all |
| Escher | 0.753 / 0.782 | 0.750 / 0.781 | wfc, all |
| EscherSurface | 0.847 / 0.885 | 0.848 / 0.900 | wfc, all |
| Growth | 0.484 / 0.484 | 0.467 / 0.467 | one |
| Hills | 0.097 / 0.097 | 0.094 / 0.094 | one |
| Keys | 0.582 / 0.637 | 0.584 / 0.637 | one, markov, field, temperature |
| Knots3D | non letto | — | wfc, all |
| MazeGrowth | 0.483 / 0.483 | 0.483 / 0.483 | one |
| MazeTrail | 0.901 / 0.902 | 0.893 / 0.893 | one |
| ModernHouse | 0.217 / 0.386 | 0.469 / 0.584 | one, markov, path, wfc, all, map |
| NoDeadEnds | 0.468 / 0.468 | 0.470 / 0.470 | one, markov, all |
| Noise | 0.102 / 0.102 | 0.096 / 0.096 | one |
| OddScale3D | 0.512 / 0.598 | 0.538 / 0.627 | one, prl a moneta, markov, all, map |
| OpenCave3D | 0.826 / 0.826 | 0.805 / 0.805 | prl a moneta |
| OrientedEscher | 0.920 / 0.962 | 0.918 / 0.950 | wfc, all |
| ParallelGrowth | 0.000 / 0.000 | 0.000 / 0.000 | all |
| Partitioning | 0.806 / 0.806 | 0.803 / 0.803 | wfc, all |
| PeriodicEscher | 0.809 / 0.831 | 0.797 / 0.822 | wfc, all |
| PillarsOfEternity | 0.924 / 0.973 | 0.882 / 0.916 | wfc, all |
| RegularSAW | 0.906 / 0.908 | 0.943 / 0.943 | one |
| RegularSAWRestart | 0.474 / 0.538 | 0.465 / 0.527 | one, markov |
| River | 0.000 / 0.574 | 0.000 / 0.540 | one, all |
| SeaVilla | 0.216 / 0.273 | 0.204 / 0.259 | one, markov, path, wfc, field, all, map |
| SelectLongKnots | non letto | — | one, markov, wfc, all |
| SoftPath | 1.000 / 1.000 | 1.000 / 1.000 | one, field, temperature, all |
| StairsPath | 1.000 / 1.000 | 1.000 / 1.000 | one, all, map |
| StochasticVoronoi | 0.000 / 0.466 | 0.000 / 0.491 | one |
| StrangeDungeon | 0.407 / 0.407 | 0.417 / 0.417 | one, all |
| SubmergedKnots | non letto | — | one, wfc, all |
| Surface | 0.657 / 0.657 | 0.657 / 0.657 | wfc |
| Voronoi | 0.000 / 0.518 | 0.000 / 0.486 | one, all |


## Il nostro motore con l’interruttore acceso, dopo A1-4 (`--modelli --mj`, T529)

Fatte il 2026-11-27 dopo T529 (A1-4: `map`, `path`, `convolution`, `convchain` dell’originale e `d` ignorato, [ADR-0274](../../../docs/adr/0274-map-path-convolution-convchain-dell-originale.md)), come sotto, con una colonna in più: «la griglia» è la stessa griglia voxel per voxel e la stessa fine, i passi a parte. **21 su 36** voxel per voxel coi passi: in più StrangeDungeon (i suoi due `d`) e CarmaTower (cinque `path` e due `convolution`, anche coi semi 2 e 3). **35 su 36 con la griglia dell’originale**: i 14 con la `wfc` (anche SeaVilla, che prima di A1-4 col seme 3 girava 36 405 passi, e ModernHouse, coi loro `path`, `field` e `map`) hanno già la sua griglia, coi passi di meno perché la nostra `wfc` osserva tutta l’onda in un passo (A1-5); SubmergedKnots si ferma ai 50 000 passi della corsa, e coi passi di meno della sua `wfc` vi arriva con un’altra griglia. Il giro intero in 70 s. I programmi delle differenze (`--programmi --mj`, che compila senza `strict`): tutti come il riferimento sui tre semi, e il borgo coi sentieri; `c6` e `c8`, che l’originale non carica, girano con la riparazione e l’avviso (con `strict`, come nei test, sono l’errore dell’originale). Contro il riferimento anche ChainDungeon e ChainDungeonMaze (2D, `path` e `convchain`), cinque semi (`tests/mj-nodi-originale.test.ts`).

| modello | scatola | il riferimento: passi, fine | noi con l’interruttore acceso: passi, fine | noi = riferimento | la griglia |
|---|---|---|---|---|---|
| Apartemazements | 8×8×8 | 275, 244, 298; finisce | 120, 96, 151; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| CarmaTower | 12×12×18 | 3786, 3243, 2724; finisce | 3786, 3243, 2724; finisce | **sì** (3 semi) | **sì** (3 semi) |
| ClosedSurface | 12×12×12 | 324, 305, 326; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| ColoredKnots | 12×12×12 | 2134, 2138, 2135; finisce | 1321, 1335, 1330; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| Counting | 8×8×8 | 2, 2, 2; finisce | 2, 2, 2; finisce | **sì** (3 semi) | **sì** (3 semi) |
| DualRetraction3D | 27×27×27 | 107, 136, 115; finisce | 107, 136, 115; finisce | **sì** (3 semi) | **sì** (3 semi) |
| Escher | 8×8×8 | 79, 75, 96; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| EscherSurface | 8×8×8 | 123, 116, 118; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| Growth | 29×29×29 | 3000, 3000, 3000; finisce 0/3 | 3000, 3000, 3000; finisce 0/3 | **sì** (3 semi) | **sì** (3 semi) |
| Hills | 40×40×12 | 8018, 8019, 8014; finisce | 8018, 8019, 8014; finisce | **sì** (3 semi) | **sì** (3 semi) |
| Keys | 23×23×23 | 356, 356, 356; finisce | 356, 356, 356; finisce | **sì** (3 semi) | **sì** (3 semi) |
| Knots3D | 8×8×8 | 175, 172, 173; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| MazeGrowth | 27×27×27 | 2197, 2197, 2197; finisce | 2197, 2197, 2197; finisce | **sì** (3 semi) | **sì** (3 semi) |
| MazeTrail | 27×27×27 | 1000, 1000, 1000; finisce 0/3 | 1000, 1000, 1000; finisce 0/3 | **sì** (3 semi) | **sì** (3 semi) |
| ModernHouse | 9×9×4 | 112, 764, 140; finisce | 32, 624, 31; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| NoDeadEnds | 19×19×19 | 730, 730, 730; finisce | 730, 730, 730; finisce | **sì** (3 semi) | **sì** (3 semi) |
| Noise | 24×24×24 | 12675, 12675, 12675; finisce | 12675, 12675, 12675; finisce | **sì** (3 semi) | **sì** (3 semi) |
| OddScale3D | 8×8×8 | 3166, 3447, 3252; finisce | 3166, 3447, 3252; finisce | **sì** (3 semi) | **sì** (3 semi) |
| OpenCave3D | 40×40×40 | 116, 120, 55; finisce | 116, 120, 55; finisce | **sì** (3 semi) | **sì** (3 semi) |
| OrientedEscher | 6×6×6 | 23, 26, 14; finisce | 5, 5, 5; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| ParallelGrowth | 29×29×29 | 24, 24, 24; finisce 0/3 | 24, 24, 24; finisce 0/3 | **sì** (3 semi) | **sì** (3 semi) |
| Partitioning | 11×11×3 | 119, 113, 121; finisce | 6, 6, 6; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| PeriodicEscher | 8×8×8 | 95, 104, 85; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| PillarsOfEternity | 9×9×9 | 84, 119, 105; finisce | 56, 82, 76; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| RegularSAW | 19×19×19 | 144, 316, 212; finisce | 144, 316, 212; finisce | **sì** (3 semi) | **sì** (3 semi) |
| RegularSAWRestart | 19×19×19 | 729, 729, 729; finisce | 729, 729, 729; finisce | **sì** (3 semi) | **sì** (3 semi) |
| River | 20×20×20 | 13690, 13210, 14320; finisce | 13690, 13210, 14320; finisce | **sì** (3 semi) | **sì** (3 semi) |
| SeaVilla | 10×10×4 | 1247, 1294, 1080; finisce | 1209, 1261, 1019; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| SelectLongKnots | 10×10×10 | 1114, 1079, 1180; finisce | 714, 670, 773; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| SoftPath | 80×80×80 | 178, 203, 186; finisce | 178, 203, 186; finisce | **sì** (3 semi) | **sì** (3 semi) |
| StairsPath | 33×33×33 | 29, 28, 23; finisce | 29, 28, 23; finisce | **sì** (3 semi) | **sì** (3 semi) |
| StochasticVoronoi | 50×50×50 | 125001, 125001, 125001; finisce | 125001, 125001, 125001; finisce | **sì** (3 semi) | **sì** (3 semi) |
| StrangeDungeon | 29×29×29 | 148, 161, 152; finisce | 148, 161, 152; finisce | **sì** (3 semi) | **sì** (3 semi) |
| SubmergedKnots | 12×12×12 | 50000, 50000, 50000; finisce 0/3 | 50000, 50000, 50000; finisce 0/3 | no: 1 no, 2 no, 3 no | no: 1 no, 2 no, 3 no |
| Surface | 10×10×10 | 509, 507, 539; finisce | 2, 2, 2; finisce | no: 1 no, 2 no, 3 no | **sì** (3 semi) |
| Voronoi | 60×60×60 | 66, 70, 77; finisce | 66, 70, 77; finisce | **sì** (3 semi) | **sì** (3 semi) |

## Il nostro motore con l’interruttore acceso, dopo A1-3 (`--modelli --mj`, T528)

Fatte il 2026-11-27 dopo T528 (A1-3: i rami dell’originale, [ADR-0273](../../../docs/adr/0273-i-rami-dell-originale.md)), come sotto. **19 su 36**: in più RegularSAWRestart (il `markov` radice non fa più ripartire i figli quando lavora l’ultimo), Keys (il passo vuoto del `markov` dentro la sequenza) e OddScale3D (i passi vuoti della sequenza e del `markov` dentro la `map`, la `map` che chiude la corsa); CarmaTower col seme 1. Gli altri: `d` (A1-4: StrangeDungeon, che senza i suoi due `d` è già l’originale sui tre semi, `tests/mj-conformita.test.ts`), `path` (A1-4: un nostro `path` dentro un `markov` dell’originale che riesce sempre allunga la corsa, SeaVilla col seme 3 a 36 405 passi), la `wfc` a passi (A1-5). Il giro intero in 69 s (81 s dopo A1-2). I quattro cicli del forte come piccoli programmi (`lab/banco/markov/programmi/l*`): la misura, i passi e la fine dell’originale su tutti i 400 semi di `originale.json` (`l1`, `l2`, `l3`, `l3b`, `l4`: 400 su 400 ciascuno).

| modello | scatola | il riferimento: passi, fine | noi con l’interruttore acceso: passi, fine | noi = riferimento |
|---|---|---|---|---|
| Apartemazements | 8×8×8 | 275, 244, 298; finisce | 120, 96, 151; finisce | no: 1 no, 2 no, 3 no |
| CarmaTower | 12×12×18 | 3786, 3243, 2724; finisce | 3786, 2964, 2769; finisce | no: 1 sì, 2 no, 3 no |
| ClosedSurface | 12×12×12 | 324, 305, 326; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| ColoredKnots | 12×12×12 | 2134, 2138, 2135; finisce | 1321, 1335, 1330; finisce | no: 1 no, 2 no, 3 no |
| Counting | 8×8×8 | 2, 2, 2; finisce | 2, 2, 2; finisce | **sì** (3 semi) |
| DualRetraction3D | 27×27×27 | 107, 136, 115; finisce | 107, 136, 115; finisce | **sì** (3 semi) |
| Escher | 8×8×8 | 79, 75, 96; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| EscherSurface | 8×8×8 | 123, 116, 118; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| Growth | 29×29×29 | 3000, 3000, 3000; finisce 0/3 | 3000, 3000, 3000; finisce 0/3 | **sì** (3 semi) |
| Hills | 40×40×12 | 8018, 8019, 8014; finisce | 8018, 8019, 8014; finisce | **sì** (3 semi) |
| Keys | 23×23×23 | 356, 356, 356; finisce | 356, 356, 356; finisce | **sì** (3 semi) |
| Knots3D | 8×8×8 | 175, 172, 173; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| MazeGrowth | 27×27×27 | 2197, 2197, 2197; finisce | 2197, 2197, 2197; finisce | **sì** (3 semi) |
| MazeTrail | 27×27×27 | 1000, 1000, 1000; finisce 0/3 | 1000, 1000, 1000; finisce 0/3 | **sì** (3 semi) |
| ModernHouse | 9×9×4 | 112, 764, 140; finisce | 32, 591, 31; finisce | no: 1 no, 2 no, 3 no |
| NoDeadEnds | 19×19×19 | 730, 730, 730; finisce | 730, 730, 730; finisce | **sì** (3 semi) |
| Noise | 24×24×24 | 12675, 12675, 12675; finisce | 12675, 12675, 12675; finisce | **sì** (3 semi) |
| OddScale3D | 8×8×8 | 3166, 3447, 3252; finisce | 3166, 3447, 3252; finisce | **sì** (3 semi) |
| OpenCave3D | 40×40×40 | 116, 120, 55; finisce | 116, 120, 55; finisce | **sì** (3 semi) |
| OrientedEscher | 6×6×6 | 23, 26, 14; finisce | 5, 5, 5; finisce | no: 1 no, 2 no, 3 no |
| ParallelGrowth | 29×29×29 | 24, 24, 24; finisce 0/3 | 24, 24, 24; finisce 0/3 | **sì** (3 semi) |
| Partitioning | 11×11×3 | 119, 113, 121; finisce | 6, 6, 6; finisce | no: 1 no, 2 no, 3 no |
| PeriodicEscher | 8×8×8 | 95, 104, 85; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| PillarsOfEternity | 9×9×9 | 84, 119, 105; finisce | 56, 82, 76; finisce | no: 1 no, 2 no, 3 no |
| RegularSAW | 19×19×19 | 144, 316, 212; finisce | 144, 316, 212; finisce | **sì** (3 semi) |
| RegularSAWRestart | 19×19×19 | 729, 729, 729; finisce | 729, 729, 729; finisce | **sì** (3 semi) |
| River | 20×20×20 | 13690, 13210, 14320; finisce | 13690, 13210, 14320; finisce | **sì** (3 semi) |
| SeaVilla | 10×10×4 | 1247, 1294, 1080; finisce | 1299, 1361, 36405; finisce | no: 1 no, 2 no, 3 no |
| SelectLongKnots | 10×10×10 | 1114, 1079, 1180; finisce | 714, 670, 773; finisce | no: 1 no, 2 no, 3 no |
| SoftPath | 80×80×80 | 178, 203, 186; finisce | 178, 203, 186; finisce | **sì** (3 semi) |
| StairsPath | 33×33×33 | 29, 28, 23; finisce | 29, 28, 23; finisce | **sì** (3 semi) |
| StochasticVoronoi | 50×50×50 | 125001, 125001, 125001; finisce | 125001, 125001, 125001; finisce | **sì** (3 semi) |
| StrangeDungeon | 29×29×29 | 148, 161, 152; finisce | 145, 141, 136; finisce | no: 1 no, 2 no, 3 no |
| SubmergedKnots | 12×12×12 | 50000, 50000, 50000; finisce 0/3 | 50000, 50000, 50000; finisce 0/3 | no: 1 no, 2 no, 3 no |
| Surface | 10×10×10 | 509, 507, 539; finisce | 2, 2, 2; finisce | no: 1 no, 2 no, 3 no |
| Voronoi | 60×60×60 | 66, 70, 77; finisce | 66, 70, 77; finisce | **sì** (3 semi) |

## Il nostro motore con l’interruttore acceso, dopo A1-2 (`--modelli --mj`, T527)

Fatte il 2026-11-27 dopo T527 (A1-2: le regole e le corrispondenze dell’originale, [ADR-0268](../../../docs/adr/0268-le-regole-e-le-corrispondenze-dell-originale.md)), dal testo dell’originale (`original`) con `semantics: 'mj'`, semi 1, 2, 3. «Noi = riferimento»: la stessa griglia voxel per voxel, gli stessi passi e la stessa fine, seme per seme. **16 su 36.** Gli altri: i rami (A1-3: il nostro `markov` fa ripartire i figli quando lavora l’ultimo, e il turno vuoto di un ramo annidato: Keys, RegularSAWRestart, OddScale3D, che ha già la griglia e due passi in meno), `d` (A1-4: StrangeDungeon), la `wfc` a passi (A1-5: gli altri).

| modello | scatola | il riferimento: passi, fine | noi con l’interruttore acceso: passi, fine | noi = riferimento |
|---|---|---|---|---|
| Apartemazements | 8×8×8 | 275, 244, 298; finisce | 120, 96, 151; finisce | no: 1 no, 2 no, 3 no |
| CarmaTower | 12×12×18 | 3786, 3243, 2724; finisce | 6854, 6594, 4748; finisce | no: 1 no, 2 no, 3 no |
| ClosedSurface | 12×12×12 | 324, 305, 326; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| ColoredKnots | 12×12×12 | 2134, 2138, 2135; finisce | 1320, 1334, 1329; finisce | no: 1 no, 2 no, 3 no |
| Counting | 8×8×8 | 2, 2, 2; finisce | 2, 2, 2; finisce | **sì** (3 semi) |
| DualRetraction3D | 27×27×27 | 107, 136, 115; finisce | 107, 136, 115; finisce | **sì** (3 semi) |
| Escher | 8×8×8 | 79, 75, 96; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| EscherSurface | 8×8×8 | 123, 116, 118; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| Growth | 29×29×29 | 3000, 3000, 3000; finisce 0/3 | 3000, 3000, 3000; finisce 0/3 | **sì** (3 semi) |
| Hills | 40×40×12 | 8018, 8019, 8014; finisce | 8018, 8019, 8014; finisce | **sì** (3 semi) |
| Keys | 23×23×23 | 356, 356, 356; finisce | 355, 355, 355; finisce | no: 1 no, 2 no, 3 no |
| Knots3D | 8×8×8 | 175, 172, 173; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| MazeGrowth | 27×27×27 | 2197, 2197, 2197; finisce | 2197, 2197, 2197; finisce | **sì** (3 semi) |
| MazeTrail | 27×27×27 | 1000, 1000, 1000; finisce 0/3 | 1000, 1000, 1000; finisce 0/3 | **sì** (3 semi) |
| ModernHouse | 9×9×4 | 112, 764, 140; finisce | 31, 544, 31; finisce | no: 1 no, 2 no, 3 no |
| NoDeadEnds | 19×19×19 | 730, 730, 730; finisce | 730, 730, 730; finisce | **sì** (3 semi) |
| Noise | 24×24×24 | 12675, 12675, 12675; finisce | 12675, 12675, 12675; finisce | **sì** (3 semi) |
| OddScale3D | 8×8×8 | 3166, 3447, 3252; finisce | 3164, 3445, 3250; finisce | no: 1 no, 2 no, 3 no |
| OpenCave3D | 40×40×40 | 116, 120, 55; finisce | 116, 120, 55; finisce | **sì** (3 semi) |
| OrientedEscher | 6×6×6 | 23, 26, 14; finisce | 5, 5, 5; finisce | no: 1 no, 2 no, 3 no |
| ParallelGrowth | 29×29×29 | 24, 24, 24; finisce 0/3 | 24, 24, 24; finisce 0/3 | **sì** (3 semi) |
| Partitioning | 11×11×3 | 119, 113, 121; finisce | 5, 5, 5; finisce | no: 1 no, 2 no, 3 no |
| PeriodicEscher | 8×8×8 | 95, 104, 85; finisce | 4, 4, 4; finisce | no: 1 no, 2 no, 3 no |
| PillarsOfEternity | 9×9×9 | 84, 119, 105; finisce | 56, 82, 76; finisce | no: 1 no, 2 no, 3 no |
| RegularSAW | 19×19×19 | 144, 316, 212; finisce | 144, 316, 212; finisce | **sì** (3 semi) |
| RegularSAWRestart | 19×19×19 | 729, 729, 729; finisce | 729, 729, 729; finisce | no: 1 no, 2 no, 3 no |
| River | 20×20×20 | 13690, 13210, 14320; finisce | 13690, 13210, 14320; finisce | **sì** (3 semi) |
| SeaVilla | 10×10×4 | 1247, 1294, 1080; finisce | 1152, 1356, 1144; finisce | no: 1 no, 2 no, 3 no |
| SelectLongKnots | 10×10×10 | 1114, 1079, 1180; finisce | 1366, 1282, 1372; finisce | no: 1 no, 2 no, 3 no |
| SoftPath | 80×80×80 | 178, 203, 186; finisce | 178, 203, 186; finisce | **sì** (3 semi) |
| StairsPath | 33×33×33 | 29, 28, 23; finisce | 29, 28, 23; finisce | **sì** (3 semi) |
| StochasticVoronoi | 50×50×50 | 125001, 125001, 125001; finisce | 125001, 125001, 125001; finisce | **sì** (3 semi) |
| StrangeDungeon | 29×29×29 | 148, 161, 152; finisce | 145, 141, 136; finisce | no: 1 no, 2 no, 3 no |
| SubmergedKnots | 12×12×12 | 50000, 50000, 50000; finisce 0/3 | 42006, 42006, 42006; finisce | no: 1 no, 2 no, 3 no |
| Surface | 10×10×10 | 509, 507, 539; finisce | 2, 2, 2; finisce | no: 1 no, 2 no, 3 no |
| Voronoi | 60×60×60 | 66, 70, 77; finisce | 66, 70, 77; finisce | **sì** (3 semi) |
