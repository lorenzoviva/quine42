# Le misure di T498

Fatte il 22/11/2026 col kernel 0.10.22 (gli universi: quelli sul disco della prima run, `universes/` del worktree del base) e MarkovJunior di mxgmn al commit `42aaf24` (SDK .NET 6.0.300), con
`lab/scripts/markov-originale.ts` (il README dice come rifarle). «La copia» è il nostro motore coi rami dell'originale (README); ≠ dove
la griglia non è quella che stampa l'originale.

## Le differenze, una per programma

| programma | l’originale (C#) | la copia col flusso dell’originale | il nostro motore |
|---|---|---|---|
| d1-contatori-radice | `RRRBBBBBBBGG` 4 passi | `RRRBBBBBBBGG` 4 passi | `RRRRRRRRGGGG` 10 passi ≠ |
| d1b-contatori-annidati | `RRRRRRRRGGGG` 15 passi | `RRRRRRRRGGGG` 15 passi | `RRRRRRRRGGGG` 10 passi |
| d2-sequenza-nel-ciclo | `RRRRRRGGGGGG` 17 passi | `RRRRRRGGGGGG` 17 passi | `RRRRRRRRRRRG` 10 passi ≠ |
| d3-sequenza-nella-sequenza | `RRRRRRRRRRRG` 21 passi | `RRRRRRRRRRRG` 21 passi | `RRBBBBBBBBGG` 2 passi ≠ |
| d4-il-ramo-tiene-il-turno | `Rcaaaaaaaa` 15 passi | `Rcaaaaaaaa` 15 passi | `RcBBBBBBBB` 2 passi ≠ |
| d5-sequenza-rientrata | `RRRRRRRRRRRG` 22 passi | `RRRRRRRRRRRG` 22 passi | `RRRRRRGGGGGG` 10 passi ≠ |
| d6-prl-conta-i-giri-vuoti | `WWGBB` 4 passi | `WWGBB` 4 passi | `WWWGB` 5 passi ≠ |
| d6b-prl-annidata | `WWWWW` 13 passi | `WWWWW` 13 passi | `WWWGB` 5 passi ≠ |
| d7-one-che-non-cambia | `RGBB` 3 passi | `RGBB` 2 passi | `RGBB` 1 passi |
| d8-prl-che-non-cambia | `RBBB` 200 passi, non finisce | `RGBB` 2 passi ≠ | `RGBB` 1 passi ≠ |
| d9-one-e-p | `RRRRRBBBBGGG` 7 passi | `RBBBBGGGGGGG` 7 passi ≠ | `RBBBBGGGGGGG` 6 passi ≠ |
| d10-prl-p-zero | `RBBB` 1 passi | `RGBB` 2 passi ≠ | `RGBB` 1 passi ≠ |

## I quattro cicli del forte, 400 semi

| programma | misura | l’originale (C#) | la copia | il nostro motore | la copia dà la nostra griglia |
|---|---|---|---|---|---|
| l1-braccia | celle del cortile | media 1894.1 (13-9089) (400 semi) | media 2077.05 (18-10099) | media 2080.5 (18-10099) | 182 su 400 |
| l2-braccia-dagli-estremi | celle del cortile | media 5030.18 (931-10228) (400 semi) | media 5065.5 (769-10372) | media 5051.62 (1166-10356) | 96 su 400 |
| l3-mastio | celle del mastio | media 251.65 (100-254); 100: 1, 121: 1, 144: 1, 169: 3, 196: 3, 225: 4, 254: 387 (400 semi) | media 249.13 (100-254); 100: 2, 121: 3, 144: 3, 169: 8, 196: 1, 225: 6, 254: 377 | media 249.13 (100-254); 100: 2, 121: 3, 144: 3, 169: 8, 196: 1, 225: 6, 254: 377 | 400 su 400 |
| l3b-mastio-probabile | celle del mastio | media 98.41 (25-254); 25: 22, 36: 36, 49: 50, 64: 60, 81: 53, 100: 44, 121: 39, 144: 27, 169: 28, 196: 14, 225: 14, 254: 13 (400 semi) | media 95.56 (25-254); 25: 23, 36: 31, 49: 44, 64: 59, 81: 61, 100: 54, 121: 47, 144: 26, 169: 24, 196: 13, 225: 12, 254: 6 | media 95.56 (25-254); 25: 23, 36: 31, 49: 44, 64: 59, 81: 61, 100: 54, 121: 47, 144: 26, 169: 24, 196: 13, 225: 12, 254: 6 | 400 su 400 |
| l4-piani | piani | media 15 (15-15), 400 su 400 non finiscono; 15: 400 (400 semi) | media 15 (15-15), 400 su 400 non finiscono; 15: 400 | media 1.95 (1-9); 1: 212, 2: 93, 3: 52, 4: 18, 5: 11, 6: 4, 7: 8, 8: 1, 9: 1 | 0 su 400 |


## Il forte dell’autore (copia del 22/11), alla sua scatola

| seme | motore | finito | passi | ms | griglia | solai `F` (strati con un solaio, a gruppi) | il mastio (`K` o `k`) fino allo strato | uguale |
|---|---|---|---|---|---|---|---|---|
| 1 | il nostro | sì | 865 | 7612 | 500×500×168 | 2 | 99 | no |
| 1 | col flusso dell’originale | no (120 s) | 138636 | 120046 | 125×125×42 | 6 | 23 | no |
| 2 | il nostro | sì | 454 | 6817 | 500×500×168 | 0 | 39 | no |
| 2 | col flusso dell’originale | no (120 s) | 131886 | 120036 | 125×125×42 | 6 | 18 | no |
| 3 | il nostro | sì | 705 | 6672 | 500×500×168 | 1 | 75 | no |
| 3 | col flusso dell’originale | no (120 s) | 109840 | 120039 | 125×125×42 | 6 | 38 | no |


## Chi usa `<markov>` (o un ramo dentro un ramo)

| dove | programmi letti | con `<markov>` | cicli | con un ramo dentro il ciclo | il ramo ultimo figlio | figli con `steps` | `prl` a moneta | rami annidati | la copia dà un’altra griglia (seme 1 o 2) |
|---|---|---|---|---|---|---|---|---|---|
| seme | 140 | 6 | 11 | 5 | 1 | 4 | 0 | 5 | 2 su 6 |
| laboratorio | 1531 | 51 | 121 | 26 | 12 | 28 | 12 | 102 | 27 su 100 |
| forte dell’autore | 1 | 1 | 5 | 3 | 2 | 1 | 3 | 1 | 1 su 1 |
| universo aurora | 136 | 4 | 7 | 3 | 1 | 5 | 0 | 2 | 1 su 4 |
| universo mesa | 183 | 3 | 6 | 3 | 1 | 4 | 0 | 4 | 3 su 5 |
| universo neapolis | 187 | 3 | 6 | 3 | 1 | 4 | 0 | 19 | 18 su 20 |
| universo orichalcum | 190 | 3 | 6 | 3 | 1 | 4 | 0 | 16 | 15 su 17 |
| universo sidera | 163 | 2 | 5 | 3 | 1 | 3 | 0 | 17 | 17 su 18 |
| modelli di mxgmn | 159 | 58 | 93 | 11 | 9 | 4 | 0 | 52 | — |

| programma | dove | i cicli (dove stanno: figli) | rami annidati | la copia |
|---|---|---|---|---|
| `universe/models/circuito-3D.xml` | seme | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `universe/models/corona-lampione.xml` | seme | animation telemetria/sequence: all | 0 | uguale |
| `universe/models/part-leaf.xml` | seme | sequence: prl prl prl all; sequence: prl prl prl all | 2 | uguale |
| `universe/models/part-wheel.xml` | seme | sequence: prl sequence prl; sequence: prl sequence prl | 4 | cambia (≠≠) |
| `universe/models/part-window.xml` | seme | sequence: prl prl | 1 | uguale |
| `universe/models/sound-final-battle.xml` | seme | sequence: all one | 1 | uguale |
| `lab/banco/pezzi/fattoria.xml` | laboratorio | map: all one | 1 | uguale, non gira: map: la griglia scalata (1×1×0) è vuota |
| `lab/banco/pezzi/forte.xml` | laboratorio | map: prl all; map: prl all | 2 | uguale |
| `lab/banco/rigenerazione/struttura-palazzina-degli-inventori.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/casa/vuoto/claude-opus-5-5/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/casa/vuoto/claude-opus-5-5/giro1/villetta-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura/insieme/claude-opus-5-5/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura/insieme/claude-opus-5-5/giro1/villetta-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura/insieme/claude-opus-5-5/giro2/villetta-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura/vuoto/claude-opus-5-5/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura/vuoto/claude-opus-5-5/giro1/villetta-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura16/insieme/claude-opus-5-5/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura16/insieme/claude-opus-5-5/giro2/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura16/insieme/claude-opus-5-5/giro2/villetta-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura16/vuoto/claude-opus-5-5/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/scenografo/misura16/vuoto/claude-opus-5-5/giro1/villetta-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/specialita/giro1/prima/rocca/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/fattoria.xml` | laboratorio | sequence: all one | 3 | cambia (≠≠) |
| `lab/banco/taglie/gemini/giro1/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/gemini/giro2/fattoria-huge/programma.xml` | laboratorio | — | 2 | cambia (≠≠) |
| `lab/banco/taglie/gemini/giro2/forte-huge/programma.xml` | laboratorio | — | 2 | cambia (≠≠) |
| `lab/banco/taglie/gemini/giro3/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/gemini/giro3/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/gemini/giro5-argon-grande/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-fable-5-1/giro1/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-fable-5-1/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-fable-5-1/giro1/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-fable-5-1/giro2/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-fable-5-1/giro2/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-fable-5-1/giro2/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-fable-5-1/giro2/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro1/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro1/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro1/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro2/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro2/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro2/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro2/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro3/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro3/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-opus-5-5/giro3/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro1/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro1/forte-huge/programma.xml` | laboratorio | — | 2 | cambia (≠≠) |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro1/forte-large/programma.xml` | laboratorio | — | 2 | cambia (≠≠) |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro2/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro2/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro2/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro2/forte-large/programma.xml` | laboratorio | — | 2 | cambia (≠≠) |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro3/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro3/fattoria-large/programma.xml` | laboratorio | — | 2 | cambia (≠≠) |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro3/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/claude-sonnet-5-5/giro3/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/gemini-4-carbon/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/gemini-4-carbon/giro1/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/gemini-4-carbon/giro2/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/gemini-4-carbon/giro3/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/gemini-4-hydrogen/giro1/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/gemini-4-hydrogen/giro2/fattoria-huge/programma.xml` | laboratorio | — | 2 | cambia (≠≠) |
| `lab/banco/taglie/modelli/gemini-4-hydrogen/giro3/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/gemini-4-hydrogen/giro3/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/openrouter/claude-opus-5-5/giro1/fattoria-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/openrouter/claude-opus-5-5/giro1/fattoria-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/openrouter/claude-opus-5-5/giro1/forte-huge/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/modelli/openrouter/claude-opus-5-5/giro1/forte-large/programma.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/taglie/scultore-rocca-ciclo.xml` | laboratorio | sequence: sequence | 4 | uguale |
| `lab/banco/taglie/scultore-rocca.xml` | laboratorio | — | 2 | uguale |
| `lab/banco/universi-cloud/neapolis/models/circuito-3D.xml` | laboratorio | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `lab/banco/universi-cloud/neapolis/models/corona-lampione.xml` | laboratorio | animation telemetria/sequence: all | 0 | —, non gira: riga 31, <color>: symbol: la cifra "1" da sola non è un simbolo: i simboli sono lettere o # e un num |
| `lab/banco/universi-cloud/neapolis/models/suono-scontro-finale.xml` | laboratorio | sequence: all one | 1 | uguale |
| `lab/banco/universi-cloud/orichalcum/models/circuito-3D.xml` | laboratorio | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `lab/banco/universi-cloud/orichalcum/models/corona-lampione.xml` | laboratorio | animation telemetria/sequence: all | 0 | —, non gira: riga 31, <color>: symbol: la cifra "1" da sola non è un simbolo: i simboli sono lettere o # e un num |
| `lab/banco/universi-cloud/orichalcum/models/suono-scontro-finale.xml` | laboratorio | sequence: all one | 1 | uguale |
| `lab/banco/universi-cloud/sidera/models/circuito-3D.xml` | laboratorio | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `lab/banco/universi-cloud/sidera/models/corona-lampione.xml` | laboratorio | animation telemetria/sequence: all | 0 | —, non gira: riga 31, <color>: symbol: la cifra "1" da sola non è un simbolo: i simboli sono lettere o # e un num |
| `lab/mjx/models/banco/fattoria-pezzi.xml` | laboratorio | map: all one | 1 | cambia (≠≠) |
| `lab/mjx/models/banco/forte-pezzi.xml` | laboratorio | map: prl all; map: prl all | 2 | cambia (≠≠) |
| `lab/mjx/models/handmade/circuito-3D.xml` | laboratorio | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `lab/mjx/models/handmade/circuito-mormale.xml` | laboratorio | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `lab/mjx/models/handmade/circuito.xml` | laboratorio | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `lab/mjx/models/handmade/forte-handmade copy.xml` | laboratorio | map: prl all; map: prl all all | 2 | cambia (≠≠) |
| `lab/mjx/models/handmade/forte-handmade-segrete.xml` | laboratorio | map: prl all; map: prl all all; map: sequence; map: sequence prl prl all; sequence: sequence | 8 | cambia (≠≠), col flusso dell’originale non finisce (165957 passi) |
| `lab/mjx/models/handmade/forte-handmade.xml` | laboratorio | map: prl all; map: prl all all; map: sequence; map: sequence prl prl all; sequence: sequence | 8 | cambia (≠≠), col flusso dell’originale non finisce (11689 passi) |
| `lab/mjx/models/handmade/lampione copy 2.xml` | laboratorio | animation telemetria/sequence: all | 0 | uguale |
| `lab/mjx/models/handmade/lampione copy 3.xml` | laboratorio | animation telemetria/sequence: all | 0 | uguale |
| `lab/mjx/models/handmade/lampione copy 4.xml` | laboratorio | animation telemetria/sequence: all | 0 | uguale |
| `lab/mjx/models/handmade/lampione copy 5.xml` | laboratorio | animation telemetria/sequence: all | 0 | uguale |
| `lab/mjx/models/handmade/lampione copy 6.xml` | laboratorio | animation telemetria/sequence: all | 0 | uguale |
| `lab/mjx/models/handmade/lampione copy.xml` | laboratorio | animation telemetria/sequence: all | 0 | uguale |
| `lab/mjx/models/handmade/lampione.xml` | laboratorio | animation telemetria/sequence: all | 0 | uguale |
| `lab/mjx/models/handmade/schermo-struttura copy 2.xml` | laboratorio | sequence: one one one one; sequence: one one one one | 3 | cambia (≠≠) |
| `lab/mjx/official/ChainDungeon.xml` | laboratorio | sequence: all path one | 1 | —, non gira: riga 10, <convchain>: manca il file models/Room.txt |
| `lab/mjx/official/ChainDungeonMaze.xml` | laboratorio | sequence: all path one | 1 | —, non gira: riga 10, <convchain>: manca il file models/Maze.txt |
| `lab/mjx/official/Keys.xml` | laboratorio | sequence: one one | 1 | cambia (≠≠) |
| `lab/mjx/official/ModernHouse.xml` | laboratorio | map: all one; wfc: one path one; wfc: one one path; wfc: all all one one one one one; wfc: all path; wfc: all one one one one one one one one one one one one; wfc: all all one; map: all one | 8 | —, non gira: riga 3, <wfc>: manca il file models/Partition.xml |
| `lab/mjx/official/NoDeadEnds.xml` | laboratorio | radice: one one all all | 0 | uguale |
| `lab/mjx/official/OddScale3D.xml` | laboratorio | sequence: one one | 2 | uguale |
| `lab/mjx/official/Partitioning.xml` | laboratorio | — | 1 | —, non gira: riga 3, <wfc>: manca il file models/Partition.xml |
| `lab/mjx/official/PeriodicEscher.xml` | laboratorio | — | 1 | —, non gira: models/Escher.xml, riga 4, <wfc>: models/Escher.xml non è un tileset (la sua radice è <tileset>) |
| `lab/mjx/official/RegularPath.xml` | laboratorio | sequence: one prl one | 1 | cambia (≠≠) |
| `lab/mjx/official/RegularSAWRestart.xml` | laboratorio | radice: one one | 0 | cambia (≠≠) |
| `lab/mjx/official/SeaVilla.xml` | laboratorio | wfc: one one one one one one; wfc: one path; wfc: one path; wfc: one one one one; wfc: all all one; map: one path; map: one path; map: one path | 8 | —, non gira: riga 5, <wfc>: manca il file models/MarchingHills.xml |
| `lab/mjx/official/WaveDungeon.xml` | laboratorio | sequence: all path one | 1 | —, non gira: riga 10, <wfc>: manca il file models/Dungeon.txt |
| `lab/mjx/official/riferimento/Backtracker.xml` | laboratorio | radice: one one | 0 | cambia (≠≠) |
| `lab/mjx/official/riferimento/BasicPartitioning.xml` | laboratorio | sequence: one one | 1 | cambia (≠≠) |
| `lab/mjx/official/riferimento/CarmaTower.xml` | laboratorio | map: one one; map: all one path one; map: one all all one; map: all all one path one; map: all one path one; map: all one path one; map: one path one one; map: one one; map: all one; map: all one; map: one one; map: one one | 13 | —, non gira: riga 17, <rule>: file vuole il nome semplice di un file di models/ (lettere, cifre e "-", niente per |
| `lab/mjx/official/riferimento/ChainDungeon.xml` | laboratorio | sequence: all path one | 1 | —, non gira: riga 10, <convchain>: manca il file models/Room.txt |
| `lab/mjx/official/riferimento/DungeonGrowth.xml` | laboratorio | sequence: all path one one | 1 | —, non gira: riga 6, <rule>: manca il file models/DungeonGrowth-Room1.txt |
| `lab/mjx/official/riferimento/GoTo.xml` | laboratorio | radice: one path one | 0 | —, non finisce nemmeno da noi in 20 s |
| `lab/mjx/official/riferimento/Keys.xml` | laboratorio | sequence: one one | 1 | cambia (≠≠) |
| `lab/mjx/official/riferimento/LostCity.xml` | laboratorio | sequence: all all | 1 | uguale |
| `lab/mjx/official/riferimento/MazeBacktracker.xml` | laboratorio | radice: one one | 0 | uguale |
| `lab/mjx/official/riferimento/ModernHouse.xml` | laboratorio | map: all one; wfc: one path one; wfc: one one path; wfc: all all one one one one one; wfc: all path; wfc: all one one one one one one one one one one one one; wfc: all all one; map: all one | 8 | —, non gira: riga 3, <wfc>: manca il file models/Partition.xml |
| `lab/mjx/official/riferimento/MultiHeadedDungeon.xml` | laboratorio | sequence: sequence | 2 | cambia (≠≠) |
| `lab/mjx/official/riferimento/NystromDungeon.xml` | laboratorio | sequence: one one one; sequence: all one | 2 | uguale |
| `lab/mjx/official/riferimento/Partitioning.xml` | laboratorio | — | 1 | —, non gira: riga 3, <wfc>: manca il file models/Partition.xml |
| `lab/mjx/official/riferimento/SeaVilla.xml` | laboratorio | wfc: one one one one one one; wfc: one path; wfc: one path; wfc: one one one one; wfc: all all one; map: one path; map: one path; map: one path | 8 | —, non gira: riga 5, <wfc>: manca il file models/MarchingHills.xml |
| `docs/userchats/forte-handmade-2026-11-22.xml` | forte dell’autore | map: prl all; map: prl all all; map: sequence; map: sequence prl prl all; sequence: sequence | 8 | cambia (≠≠), col flusso dell’originale non finisce (22409 passi) |
| `universes/aurora/models/circuito-3D.xml` | universo aurora | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `universes/aurora/models/corona-lampione.xml` | universo aurora | animation telemetria/sequence: all | 0 | uguale |
| `universes/aurora/models/lampione.xml` | universo aurora | animation telemetria/sequence: all | 0 | uguale |
| `universes/aurora/models/sound-final-battle.xml` | universo aurora | sequence: all one | 1 | uguale |
| `universes/mesa/models/circuito-3D.xml` | universo mesa | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `universes/mesa/models/corona-lampione.xml` | universo mesa | animation telemetria/sequence: all | 0 | uguale |
| `universes/mesa/models/obj-abbeveratoio-di-pietra.xml` | universo mesa | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (421649 passi) |
| `universes/mesa/models/obj-cisterna-della-stazione.xml` | universo mesa | — | 2 | cambia (≠≠) |
| `universes/mesa/models/sound-final-battle.xml` | universo mesa | sequence: all one | 1 | uguale |
| `universes/neapolis/models/casa-comune-structure-f2e1f8de.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (9842 passi) |
| `universes/neapolis/models/circuito-3D.xml` | universo neapolis | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `universes/neapolis/models/corona-lampione.xml` | universo neapolis | animation telemetria/sequence: all | 0 | uguale |
| `universes/neapolis/models/obj-gozzo-tirato-a-secco.xml` | universo neapolis | — | 2 | cambia (≠≠) |
| `universes/neapolis/models/sound-final-battle.xml` | universo neapolis | sequence: all one | 1 | uguale |
| `universes/neapolis/models/struttura-bistrot.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (3457 passi) |
| `universes/neapolis/models/struttura-cappella.xml` | universo neapolis | — | 2 | cambia (≠≠) |
| `universes/neapolis/models/struttura-chiesa-moderna.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (32643 passi) |
| `universes/neapolis/models/struttura-condominio.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (19135 passi) |
| `universes/neapolis/models/struttura-la-torre-della-banca-del-golfo.xml` | universo neapolis | — | 2 | cambia (≠≠) |
| `universes/neapolis/models/struttura-laboratorio-artigiano.xml` | universo neapolis | — | 2 | cambia (≠≠) |
| `universes/neapolis/models/struttura-laboratorio.xml` | universo neapolis | — | 2 | cambia (≠≠) |
| `universes/neapolis/models/struttura-mercato-a-padiglione.xml` | universo neapolis | — | 2 | cambia (≠≠) |
| `universes/neapolis/models/struttura-mercato-coperto-rionale.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (6427 passi) |
| `universes/neapolis/models/struttura-mercato-coperto.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (35797 passi) |
| `universes/neapolis/models/struttura-osservatorio-civico.xml` | universo neapolis | — | 2 | cambia (≠≠) |
| `universes/neapolis/models/struttura-palazzina.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (65209 passi) |
| `universes/neapolis/models/struttura-torre-di-vetro.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (16966 passi) |
| `universes/neapolis/models/struttura-torre-panoramica.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (16176 passi) |
| `universes/neapolis/models/struttura-trattoria-con-cantina.xml` | universo neapolis | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (265777 passi) |
| `universes/orichalcum/models/casa-comune-structure-ee18c0d6.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/circuito-3D.xml` | universo orichalcum | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `universes/orichalcum/models/corona-lampione.xml` | universo orichalcum | animation telemetria/sequence: all | 0 | uguale |
| `universes/orichalcum/models/sound-final-battle.xml` | universo orichalcum | sequence: all one | 1 | uguale |
| `universes/orichalcum/models/struttura-cattedrale-degli-ingranaggi.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/struttura-cattedrale.xml` | universo orichalcum | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (30603 passi) |
| `universes/orichalcum/models/struttura-faro-a-vapore.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/struttura-il-capannone-dei-telai-a-vapor.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/struttura-il-faro-a-gas-del-molo-di-tram.xml` | universo orichalcum | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (7133 passi) |
| `universes/orichalcum/models/struttura-officina-meccanica.xml` | universo orichalcum | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (4826 passi) |
| `universes/orichalcum/models/struttura-officina.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/struttura-osservatorio.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/struttura-palazzina-degli-inventori.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/struttura-palazzo-dei-meccanici.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/struttura-stazione-dirigibili.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/orichalcum/models/struttura-stazione-ferroviaria.xml` | universo orichalcum | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (267679 passi) |
| `universes/orichalcum/models/struttura-taverna-delle-caldaie.xml` | universo orichalcum | — | 2 | cambia (≠≠) |
| `universes/sidera/models/casa-comune-structure-052c7ac8.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/circuito-3D.xml` | universo sidera | sequence: markov all one; markov: path all; sequence: one markov one; markov: sequence | 5 | cambia (≠≠) |
| `universes/sidera/models/corona-lampione.xml` | universo sidera | animation telemetria/sequence: all | 0 | uguale |
| `universes/sidera/models/struttura-bar-orbitale.xml` | universo sidera | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (75404 passi) |
| `universes/sidera/models/struttura-faro-al-plasma.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/struttura-faro.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/struttura-il-portone-sorvegliato-della-t.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/struttura-l-hangar-dei-rifornimenti-dell.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/struttura-l-hangar-delle-navette-leggere.xml` | universo sidera | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (68072 passi) |
| `universes/sidera/models/struttura-laboratorio-del-plasma.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/struttura-laboratorio-di-fusione.xml` | universo sidera | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (61183 passi) |
| `universes/sidera/models/struttura-lounge-criogenica.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/struttura-residenza-ad-anelli.xml` | universo sidera | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (16257 passi) |
| `universes/sidera/models/struttura-residenza-modulare.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/struttura-santuario-della-luce.xml` | universo sidera | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (35594 passi) |
| `universes/sidera/models/struttura-santuario-quantico.xml` | universo sidera | — | 2 | cambia (≠≠) |
| `universes/sidera/models/struttura-scalo-navette.xml` | universo sidera | — | 2 | cambia (≠≠), col flusso dell’originale non finisce (85112 passi) |
| `universes/sidera/models/struttura-stazione-di-transito.xml` | universo sidera | — | 2 | cambia (≠≠) |

