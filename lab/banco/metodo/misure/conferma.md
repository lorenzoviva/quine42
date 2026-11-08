# Varianza tra concetti e tra semi: conferma

13 programmi, 5 semi, ognuno alla taglia del suo bersaglio (o nella sua scatola); le misure sono in `lab/banco/concetti.ts`.

## In breve

| | impronta | profilo | pieni | distanza |
|---|---|---|---|---|
| tra i semi di un programma (mediana) | 0,00 | 0,00 | 0,00 | 0,00 |
| tra concetti diversi (mediana) | 0,21 | 0,22 | 0,36 | 0,25 |
| separazione (fra / dentro) | ∞ | ∞ | ∞ | ∞ |

Vicini: 100 % delle esecuzioni hanno come esecuzione più vicina un altro seme dello stesso programma.

## Per programma

| programma | semi | impronta | profilo | pieni | distanza | voxel | colore | copertura | pieno | alt. media | alt. max | cortile | quote | torri |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| moderna/1 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,79 | 0,25 | 0,79 | 1,00 | 0,00 | 9,0 | 0,0 |
| moderna/2 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,76 | 0,26 | 0,80 | 1,00 | 0,00 | 9,0 | 0,0 |
| steampunk/1 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,84 | 0,31 | 0,83 | 1,00 | 0,00 | 12,0 | 0,0 |
| steampunk/2 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,78 | 0,28 | 0,83 | 1,00 | 0,00 | 13,0 | 0,0 |
| futuristica/1/seconda | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,82 | 0,31 | 0,67 | 1,00 | 0,00 | 8,0 | 1,0 |
| locanda/1/seconda | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,82 | 0,29 | 0,83 | 1,00 | 0,00 | 11,0 | 0,0 |
| locanda/2 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,80 | 0,31 | 0,74 | 1,00 | 0,00 | 15,0 | 0,0 |
| tempio/1 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,81 | 0,26 | 0,69 | 1,00 | 0,00 | 6,0 | 3,0 |
| tempio/2 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,79 | 0,26 | 0,67 | 1,00 | 0,00 | 8,0 | 3,0 |
| rocca/1 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,76 | 0,61 | 0,57 | 0,99 | 0,20 | 16,0 | 6,0 |
| rocca/2 | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,79 | 0,56 | 0,57 | 1,00 | 0,21 | 18,0 | 5,0 |
| pagoda/1/seconda | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,86 | 0,20 | 0,63 | 1,00 | 0,00 | 21,0 | 8,0 |
| pagoda/2/seconda | 5 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,78 | 0,24 | 0,82 | 1,00 | 0,00 | 11,0 | 0,0 |

## Concetto per concetto (distanza mediana; sulla diagonale, tra i semi)

| | moderna | steampunk | futuristica | locanda | tempio | rocca | pagoda |
|---|---|---|---|---|---|---|---|
| moderna | 0,16 | 0,20 | 0,23 | 0,23 | 0,23 | 0,45 | 0,26 |
| steampunk | 0,20 | 0,16 | 0,21 | 0,18 | 0,23 | 0,44 | 0,23 |
| futuristica | 0,23 | 0,21 | 0,00 | 0,22 | 0,18 | 0,45 | 0,24 |
| locanda | 0,23 | 0,18 | 0,22 | 0,21 | 0,26 | 0,43 | 0,29 |
| tempio | 0,23 | 0,23 | 0,18 | 0,26 | 0,15 | 0,46 | 0,23 |
| rocca | 0,45 | 0,44 | 0,45 | 0,43 | 0,46 | 0,22 | 0,48 |
| pagoda | 0,26 | 0,23 | 0,24 | 0,29 | 0,23 | 0,48 | 0,25 |

## Rifiutati

- futuristica/2/seconda: seme 1: riga 120, <box>: "at" vuole tre numeri separati da spazi; seme 2: riga 120, <box>: "at" vuole tre numeri separati da spazi; seme 3: riga 120, <box>: "at" vuole tre numeri separati da spazi; seme 4: riga 120, <box>: "at" vuole tre numeri separati da spazi; seme 5: riga 120, <box>: "at" vuole tre numeri separati da spazi

